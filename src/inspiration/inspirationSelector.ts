/**
 * Inspiration Bank — selection / scoring engine.
 *
 * Given a generation context (the params for an angles / script / autopilot
 * task), score each ready item in the bank and return the top N most
 * relevant ones. The injected context block is built from these picks.
 *
 * HARD FILTERS (applied before scoring — items that fail these are dropped
 * entirely, never injected):
 *   - adType: if specified, item.adType MUST exactly match. A Full AI brief
 *     will never see Ecom references; an Ecom brief will never see UGC.
 *   - isFullAi: if specified, item.isFullAi MUST match the boolean.
 *
 * Scoring rules (additive, applied to surviving items):
 *   +5  exact adType match (always true after hard filter, but kept for reasons trail)
 *   +4  exact angleType match
 *   +3  exact framework match (script tasks)
 *   +3  exact productCategory match
 *   +2  duration match
 *   +2  fullAiSpecification match
 *   +2  fullAiVisualStyle match
 *   +1  hookStyle match
 *   +2  starred bonus
 *   +1  recency bonus (uploaded in last 30 days)
 *
 * Items must score >= 3 to be included. We always cap at maxResults.
 */

import { getAllItems } from './inspirationStore';
import { getEffectiveTags } from '../engine/inspirationTypes';
import type {
  InspirationItem,
  InspirationSelectionParams,
} from '../engine/inspirationTypes';

export interface ScoredInspiration {
  item: InspirationItem;
  score: number;
  matchReasons: string[];
}

const MIN_SCORE = 3;
const RECENCY_DAYS = 30;

export interface SelectionOptions extends InspirationSelectionParams {
  framework?: string;
  hookStyle?: string;
  /** Max number of items to return (default 5) */
  maxResults?: number;
  /** If true, only consider starred items */
  starredOnly?: boolean;
}

export async function selectInspiration(
  opts: SelectionOptions
): Promise<ScoredInspiration[]> {
  const all = await getAllItems();

  // Step 1: status + starred-only gate
  let candidates = all.filter(
    (i) => i.status === 'ready' && (!opts.starredOnly || i.starred)
  );
  if (candidates.length === 0) return [];

  // Step 2: HARD FILTERS — drop anything whose ad type or full-AI flag
  // doesn't match the requested brief. A Full AI brief must NEVER see
  // live-action references and vice versa, regardless of how well the
  // other tags align.
  if (opts.adType) {
    candidates = candidates.filter((item) => {
      const tags = getEffectiveTags(item);
      return tags.adType === opts.adType;
    });
  }
  if (opts.isFullAi !== undefined) {
    candidates = candidates.filter((item) => {
      const tags = getEffectiveTags(item);
      return tags.isFullAi === opts.isFullAi;
    });
  }
  if (candidates.length === 0) return [];

  const maxResults = opts.maxResults ?? 5;
  const now = Date.now();
  const recencyCutoff = now - RECENCY_DAYS * 24 * 60 * 60 * 1000;

  const scored: ScoredInspiration[] = candidates.map((item) => {
    const tags = getEffectiveTags(item);
    let score = 0;
    const reasons: string[] = [];

    if (opts.adType && tags.adType === opts.adType) {
      score += 5;
      reasons.push(`adType: ${opts.adType}`);
    }
    if (opts.angleType && tags.angleType === opts.angleType) {
      score += 4;
      reasons.push(`angle: ${opts.angleType}`);
    }
    if (opts.framework && tags.framework === opts.framework) {
      score += 3;
      reasons.push(`framework: ${opts.framework}`);
    }
    if (opts.productCategory && tags.productCategory === opts.productCategory) {
      score += 3;
      reasons.push(`product: ${opts.productCategory}`);
    }
    if (opts.duration && tags.duration === opts.duration) {
      score += 2;
      reasons.push(`duration: ${opts.duration}`);
    }
    if (opts.fullAiSpec && tags.fullAiSpecification === opts.fullAiSpec) {
      score += 2;
      reasons.push(`AI spec: ${opts.fullAiSpec}`);
    }
    if (
      opts.fullAiVisualStyle &&
      tags.fullAiVisualStyle === opts.fullAiVisualStyle
    ) {
      score += 2;
      reasons.push(`AI visual: ${opts.fullAiVisualStyle}`);
    }
    if (opts.hookStyle && tags.hookStyle === opts.hookStyle) {
      score += 1;
      reasons.push(`hook: ${opts.hookStyle}`);
    }

    if (item.starred) {
      score += 2;
      reasons.push('starred');
    }
    const uploaded = Date.parse(item.uploadedAt);
    if (!isNaN(uploaded) && uploaded >= recencyCutoff) {
      score += 1;
      reasons.push('recent');
    }

    return { item, score, matchReasons: reasons };
  });

  return scored
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreak by recency
      return (
        Date.parse(b.item.uploadedAt) - Date.parse(a.item.uploadedAt)
      );
    })
    .slice(0, maxResults);
}

/** Convenience: pick the single best match (or null). */
export async function selectBestInspiration(
  opts: SelectionOptions
): Promise<ScoredInspiration | null> {
  const picks = await selectInspiration({ ...opts, maxResults: 1 });
  return picks[0] ?? null;
}
