/**
 * Comment Puller — orchestrates pulling Facebook ad comments via the
 * Meta proxy Worker, then writes them into the local Comment Bank
 * (IndexedDB).
 *
 * Two pull modes:
 *   1. First-time per ad: 90-day backfill window
 *   2. Subsequent per ad: delta — only fetch comments newer than the
 *      cursor we stored last time
 *
 * Everything is GET-only — both because the Worker enforces it and
 * because we never need to write anything to Meta.
 */

import { metaGraph } from '../api/metaProxy';
import { putComments, putCursor, getCursor, setLastPullAt } from './commentBank';
import type { CommentRecord, AdSyncCursor, PullProgress, PullSummary } from './commentBankTypes';

const BACKFILL_DAYS = 90;
const COMMENTS_PAGE_SIZE = 100;
const ADS_PAGE_SIZE = 100;

// ─── Graph API response shapes (subset of what Meta returns) ────────────

interface GraphPaging {
  cursors?: { before?: string; after?: string };
  next?: string;
  previous?: string;
}

interface AdAccountRow {
  id: string;           // 'act_<id>'
  name?: string;
  account_status?: number;
}

interface AdRow {
  id: string;
  name: string;
  status?: string;
  effective_status?: string;
  campaign_id?: string;
  creative?: { id: string; effective_object_story_id?: string };
}

interface CommentRow {
  id: string;
  message?: string;
  created_time: string;     // ISO
  from?: { id: string; name: string };
  like_count?: number;
}

interface GraphListResponse<T> {
  data: T[];
  paging?: GraphPaging;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function isoToMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Date.now() : t;
}

function isAdActive(ad: AdRow): boolean {
  // Active means: status ACTIVE and effective_status not PAUSED/DELETED/etc.
  // We pull comments from any ad with a creative; status filters help avoid noise.
  if (!ad.creative?.effective_object_story_id) return false;
  const effStatus = ad.effective_status || ad.status || '';
  return effStatus === 'ACTIVE' || effStatus === 'PAUSED' || effStatus === 'IN_PROCESS';
}

// Paginate any Graph list endpoint until exhausted or until `stopWhen` returns true.
async function paginate<T>(
  initialPath: string,
  initialParams: Record<string, string | number>,
  stopWhen?: (rows: T[]) => boolean,
): Promise<T[]> {
  const out: T[] = [];
  // Initial page
  let response = await metaGraph<GraphListResponse<T>>({ path: initialPath, params: initialParams });
  while (true) {
    if (response?.data?.length) out.push(...response.data);
    if (stopWhen?.(out)) break;
    const nextUrl = response?.paging?.next;
    if (!nextUrl) break;
    // The `next` URL has the cursor baked in — but we still proxy through our Worker,
    // so we need to extract the path + params and re-call metaGraph (which adds the
    // access_token server-side; never let the caller-provided URL include it).
    const url = new URL(nextUrl);
    const pathOnly = url.pathname.replace(/^\/v\d+(\.\d+)?\//, '');
    const params: Record<string, string> = {};
    for (const [k, v] of url.searchParams.entries()) {
      if (k === 'access_token') continue; // safety: stripped server-side anyway
      params[k] = v;
    }
    response = await metaGraph<GraphListResponse<T>>({ path: pathOnly, params });
  }
  return out;
}

// ─── Main pull flow ────────────────────────────────────────────────────

export async function pullAllAdComments(
  onProgress?: (p: PullProgress) => void,
  signal?: AbortSignal,
): Promise<PullSummary> {
  const startedAt = Date.now();
  const backfillSince = Math.floor((startedAt - BACKFILL_DAYS * 24 * 60 * 60 * 1000) / 1000);
  const reportProgress = (p: Partial<PullProgress>) => onProgress?.({
    phase: 'idle',
    currentAd: 0,
    totalAds: 0,
    pulledSoFar: 0,
    ...p,
  } as PullProgress);

  // 1) Discover ad accounts
  reportProgress({ phase: 'discovering-ads', currentAd: 0, totalAds: 0, pulledSoFar: 0 });
  const accounts = await paginate<AdAccountRow>('me/adaccounts', {
    fields: 'id,name,account_status',
    limit: 50,
  });
  if (signal?.aborted) throw new Error('Pull cancelled');

  // 2) Discover ads per account — keep only those with a post (creative.effective_object_story_id)
  const allAds: Array<AdRow & { adAccountId: string; adAccountName?: string }> = [];
  for (const acct of accounts) {
    if (signal?.aborted) throw new Error('Pull cancelled');
    try {
      const ads = await paginate<AdRow>(`${acct.id}/ads`, {
        fields: 'id,name,status,effective_status,campaign_id,creative{id,effective_object_story_id}',
        limit: ADS_PAGE_SIZE,
      });
      for (const ad of ads) {
        if (isAdActive(ad)) allAds.push({ ...ad, adAccountId: acct.id, adAccountName: acct.name });
      }
    } catch (err) {
      console.warn(`[commentPuller] Failed to list ads for ${acct.id}:`, err);
    }
  }

  // 3) Pull comments per ad (delta or backfill based on cursor)
  reportProgress({
    phase: 'pulling-comments',
    currentAd: 0,
    totalAds: allAds.length,
    pulledSoFar: 0,
  });

  let pulledSoFar = 0;
  let isInitialBackfillAny = false;
  const perAd: PullSummary['perAd'] = [];

  for (let i = 0; i < allAds.length; i++) {
    if (signal?.aborted) throw new Error('Pull cancelled');
    const ad = allAds[i];
    const postId = ad.creative!.effective_object_story_id!;
    reportProgress({
      phase: 'pulling-comments',
      currentAd: i + 1,
      totalAds: allAds.length,
      currentAdName: ad.name,
      pulledSoFar,
    });

    const cursor = await getCursor(ad.id);
    const isInitialBackfill = !cursor;
    if (isInitialBackfill) isInitialBackfillAny = true;
    const sinceUnix = cursor
      ? Math.floor(cursor.newestCommentTime / 1000)
      : backfillSince;

    try {
      const commentRows = await paginate<CommentRow>(`${postId}/comments`, {
        fields: 'id,message,created_time,from,like_count',
        since: sinceUnix,
        limit: COMMENTS_PAGE_SIZE,
        // 'order=chronological' returns oldest-first, which is fine for delta cursors
        order: 'chronological',
      });

      // Convert + filter empty + dedupe by Meta id within this batch
      const seen = new Set<string>();
      const records: CommentRecord[] = [];
      let newestThisRun = cursor?.newestCommentTime ?? 0;
      for (const c of commentRows) {
        if (!c.message?.trim()) continue;
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        const createdAt = isoToMs(c.created_time);
        if (createdAt > newestThisRun) newestThisRun = createdAt;
        records.push({
          id: `${ad.id}:${c.id}`,
          commentId: c.id,
          text: c.message.trim(),
          createdAt,
          authorName: c.from?.name,
          reactionsCount: c.like_count,
          adId: ad.id,
          adName: ad.name,
          campaignId: ad.campaign_id,
          adAccountId: ad.adAccountId,
          adAccountName: ad.adAccountName,
          postId,
          platform: 'facebook',
          pulledAt: startedAt,
        });
      }

      const { added } = await putComments(records);
      pulledSoFar += added;

      // Update cursor (even if zero comments this run — we know we pulled)
      const newCursor: AdSyncCursor = {
        adId: ad.id,
        lastPullAt: startedAt,
        newestCommentTime: newestThisRun,
        totalComments: (cursor?.totalComments ?? 0) + added,
      };
      await putCursor(newCursor);

      perAd.push({ adId: ad.id, adName: ad.name, newComments: added });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[commentPuller] Failed to pull comments for ad ${ad.id}:`, message);
      perAd.push({ adId: ad.id, adName: ad.name, newComments: 0, error: message });
    }
  }

  reportProgress({
    phase: 'done',
    currentAd: allAds.length,
    totalAds: allAds.length,
    pulledSoFar,
  });

  await setLastPullAt(startedAt);

  return {
    startedAt,
    finishedAt: Date.now(),
    adsScanned: allAds.length,
    newCommentsCount: pulledSoFar,
    perAd,
    isInitialBackfill: isInitialBackfillAny,
  };
}
