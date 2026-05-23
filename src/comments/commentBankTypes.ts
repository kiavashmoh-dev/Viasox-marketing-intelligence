/**
 * Comment Bank — types for the Meta-pulled ad comments stored in IndexedDB.
 *
 * Mirrors the inspiration bank pattern: small metadata records that can be
 * queried in-memory, with all the pull cursor / sync state living alongside.
 */

export interface CommentRecord {
  /** Composite key: `${adId}:${commentId}` — guarantees uniqueness even if a comment
   * surfaces against multiple ad rows (Meta sometimes does that with carousels). */
  id: string;

  // ── Comment payload ──
  /** Meta's native comment ID (what they return from the Graph API). */
  commentId: string;
  /** The comment text (HTML decoded). */
  text: string;
  /** Comment creation time (ms since epoch). */
  createdAt: number;
  /** Public commenter name when available. May be empty for anonymized comments. */
  authorName?: string;
  /** Reactions count Meta reports (likes, hearts, etc.). */
  reactionsCount?: number;

  // ── Ad context (lets us trace any comment back to the ad that drove it) ──
  adId: string;
  adName: string;
  campaignId?: string;
  campaignName?: string;
  adAccountId: string;
  adAccountName?: string;
  pageId?: string;
  pageName?: string;
  /** The post (effective_object_story_id) the comment is attached to. */
  postId: string;
  /** Platform — currently always 'facebook' until we wire Instagram. */
  platform: 'facebook' | 'instagram';

  // ── Pull metadata ──
  pulledAt: number;
}

export interface AdSyncCursor {
  /** Matches CommentRecord.adId. */
  adId: string;
  /** Last pull start time (ms since epoch). */
  lastPullAt: number;
  /** Newest comment timestamp we've stored — used as `since=` on next pull. */
  newestCommentTime: number;
  /** Number of comments stored for this ad in total. */
  totalComments: number;
}

export interface CommentBankStats {
  totalComments: number;
  uniqueAds: number;
  uniqueCampaigns: number;
  oldestComment: number | null;
  newestComment: number | null;
  lastPullAt: number | null;
}

export interface PullProgress {
  phase: 'idle' | 'discovering-ads' | 'pulling-comments' | 'saving' | 'done' | 'error';
  /** Which ad we're currently pulling (1-indexed). */
  currentAd: number;
  /** Total ads to walk. */
  totalAds: number;
  /** Current ad's display name. */
  currentAdName?: string;
  /** Comments pulled this run so far. */
  pulledSoFar: number;
  /** Optional error message when phase === 'error'. */
  error?: string;
}

export interface PullSummary {
  startedAt: number;
  finishedAt: number;
  adsScanned: number;
  newCommentsCount: number;
  /** Per-ad breakdown for diagnostics. */
  perAd: Array<{ adId: string; adName: string; newComments: number; error?: string }>;
  /** Window used for this pull (true on first-time backfill, false on delta). */
  isInitialBackfill: boolean;
}
