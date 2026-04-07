/**
 * Score Calibration — Rolling-bar reviewer
 *
 * Walks the most recent N briefs and computes the median, p25, p75, and mean
 * review scores. The reviewer reads this calibration and rescales its grading
 * so a 7/10 in the future is harder to earn than a 7/10 today.
 *
 * Recomputed after every batch. Cached in CreativeMemoryStore.scoreCalibration.
 */

import type { ScoreCalibration } from './memoryTypes';
import { getAllBriefs, saveScoreCalibration } from './memoryStore';

const DEFAULT_WINDOW = 30;
const MIN_SAMPLES_FOR_CALIBRATION = 5;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/** Compute the calibration snapshot. Returns null if insufficient samples. */
export function computeScoreCalibration(window = DEFAULT_WINDOW): ScoreCalibration | null {
  const briefs = getAllBriefs();
  if (briefs.length < MIN_SAMPLES_FOR_CALIBRATION) return null;

  // Newest first via batchId (ISO-sortable)
  const recent = briefs
    .filter((b) => Number.isFinite(b.reviewScore))
    .sort((a, b) => (a.batchId < b.batchId ? 1 : -1))
    .slice(0, window);

  if (recent.length < MIN_SAMPLES_FOR_CALIBRATION) return null;

  const scores = recent.map((b) => b.reviewScore).sort((a, b) => a - b);
  const median = percentile(scores, 0.5);
  const p25 = percentile(scores, 0.25);
  const p75 = percentile(scores, 0.75);
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;

  return {
    windowSize: window,
    sampleSize: recent.length,
    median: Math.round(median * 10) / 10,
    p25: Math.round(p25 * 10) / 10,
    p75: Math.round(p75 * 10) / 10,
    mean: Math.round(mean * 10) / 10,
    computedAt: new Date().toISOString(),
  };
}

/** Compute and persist in one shot. Run after every completed batch. */
export function recomputeAndSaveCalibration(): ScoreCalibration | null {
  const cal = computeScoreCalibration();
  if (cal) saveScoreCalibration(cal);
  return cal;
}

/**
 * Build the rising-bar instructions block for the batch reviewer prompt.
 * Returns an empty string when there isn't enough history yet (the reviewer
 * uses its default 1-10 scale).
 */
export function formatCalibrationForReviewer(cal: ScoreCalibration | null): string {
  if (!cal) return '';

  const lines: string[] = [];
  lines.push('');
  lines.push('## 📈 RISING-BAR CALIBRATION — RAISE YOUR STANDARDS');
  lines.push('');
  lines.push(
    `You are reviewing batch in a system that has now completed ${cal.sampleSize} scored briefs in the rolling window. The historical score distribution is:`,
  );
  lines.push('');
  lines.push(`- **p25:** ${cal.p25.toFixed(1)}/10 (the bottom quartile of past briefs)`);
  lines.push(`- **median:** ${cal.median.toFixed(1)}/10 (the typical past brief)`);
  lines.push(`- **p75:** ${cal.p75.toFixed(1)}/10 (the top quartile)`);
  lines.push(`- **mean:** ${cal.mean.toFixed(1)}/10`);
  lines.push('');
  lines.push(
    '**This means your scoring must shift to reflect the rising bar:**',
  );
  lines.push(
    `- A brief that is merely "average for our history" deserves around the median (${cal.median.toFixed(1)}/10) — NOT 7/10 by default.`,
  );
  lines.push(
    `- To earn a score above the p75 (${cal.p75.toFixed(1)}/10), the brief must demonstrably outperform the top quartile of past work — sharper hook, deeper angle alignment, more specific data, more original framework execution.`,
  );
  lines.push(
    `- Briefs in the bottom quartile (≤${cal.p25.toFixed(1)}/10) should be flagged with NEEDS_ATTENTION even if they pass individual checks.`,
  );
  lines.push(
    '- Do NOT grade on a curve relative to OTHER briefs in this batch. Grade against the rolling history. The bar rises.',
  );
  lines.push('');
  lines.push(
    '**Why this matters:** the system gets smarter every batch. What was a 7/10 ten batches ago is a 6/10 now because the team has learned. Apply this discipline.',
  );
  lines.push('');

  return lines.join('\n');
}
