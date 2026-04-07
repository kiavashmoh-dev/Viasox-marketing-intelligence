/**
 * Angle Pattern Miner
 *
 * Walks the full BriefMemoryRecord history and derives stable, structured
 * "what works" facts: for each (angle, product, framework, hookStylesKey)
 * combination, what's the average review score and how many samples back it.
 *
 * The output is persisted in CreativeMemoryStore.anglePatterns and re-mined
 * after every completed batch. The concept evaluator and the curator both
 * read these patterns as hard data instead of relying on Opus to re-derive
 * them from raw history each time.
 */

import type { AnglePatternRecord, BriefMemoryRecord } from './memoryTypes';
import { getAllBriefs, saveAnglePatterns } from './memoryStore';

interface PatternBucket {
  angle: string;
  product: string;
  framework: string;
  hookStyles: string[];
  scores: Array<{ briefId: string; score: number }>;
}

function hookKey(styles: string[]): string {
  // Sort + dedupe + lowercase so [Question, Bold] === [bold, question]
  return Array.from(new Set(styles.map((s) => s.toLowerCase().trim())))
    .sort()
    .join('|');
}

function bucketKey(brief: BriefMemoryRecord): string {
  return [
    brief.angle.toLowerCase(),
    brief.product.toLowerCase(),
    brief.framework.toLowerCase(),
    hookKey(brief.hookStyles),
  ].join('::');
}

/** Re-derive AnglePatternRecord[] from the full brief history. */
export function mineAnglePatterns(): AnglePatternRecord[] {
  const briefs = getAllBriefs();
  if (briefs.length === 0) return [];

  const buckets = new Map<string, PatternBucket>();

  for (const brief of briefs) {
    if (!Number.isFinite(brief.reviewScore)) continue;
    if (!brief.framework || brief.framework === 'Unknown') continue;

    const key = bucketKey(brief);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        angle: brief.angle,
        product: brief.product,
        framework: brief.framework,
        hookStyles: Array.from(new Set(brief.hookStyles)).sort(),
        scores: [],
      };
      buckets.set(key, bucket);
    }
    bucket.scores.push({ briefId: brief.id, score: brief.reviewScore });
  }

  const records: AnglePatternRecord[] = [];
  const now = new Date().toISOString();

  for (const bucket of buckets.values()) {
    const sorted = [...bucket.scores].sort((a, b) => b.score - a.score);
    const sum = sorted.reduce((s, x) => s + x.score, 0);
    const avg = sum / sorted.length;
    records.push({
      angle: bucket.angle,
      product: bucket.product,
      framework: bucket.framework,
      hookStyles: bucket.hookStyles,
      avgScore: Math.round(avg * 10) / 10,
      sampleSize: sorted.length,
      bestExampleBriefId: sorted[0]?.briefId ?? '',
      worstExampleBriefId: sorted[sorted.length - 1]?.briefId ?? '',
      lastUpdated: now,
    });
  }

  return records;
}

/** Re-derive and persist in one shot. Run after every completed batch. */
export function recomputeAndSaveAnglePatterns(): AnglePatternRecord[] {
  const records = mineAnglePatterns();
  saveAnglePatterns(records);
  return records;
}

// ─── Prompt Formatting ──────────────────────────────────────────────────────

const MIN_SAMPLE_FOR_PROMPT = 1; // even a single data point is signal-rich vs nothing
const TOP_N_FOR_PROMPT = 8;

/**
 * Build a markdown table of proven (and disproven) patterns for a specific
 * angle+product to inject into the concept evaluator's system prompt.
 *
 * Returns an empty string when there are no patterns yet — the evaluator
 * already has the curator briefing for general guidance.
 */
export function formatAnglePatternsForEvaluator(
  angle: string,
  product: string,
  patterns: AnglePatternRecord[],
): string {
  const a = angle.toLowerCase();
  const p = product.toLowerCase();
  const matched = patterns
    .filter(
      (r) =>
        r.angle.toLowerCase() === a &&
        r.product.toLowerCase() === p &&
        r.sampleSize >= MIN_SAMPLE_FOR_PROMPT,
    )
    .sort((x, y) => {
      // Prioritize high-confidence high-score combinations
      if (x.sampleSize === y.sampleSize) return y.avgScore - x.avgScore;
      // Confidence-weighted score
      const xWeighted = x.avgScore * Math.min(1, x.sampleSize / 3);
      const yWeighted = y.avgScore * Math.min(1, y.sampleSize / 3);
      return yWeighted - xWeighted;
    })
    .slice(0, TOP_N_FOR_PROMPT);

  if (matched.length === 0) return '';

  const lines: string[] = [];
  lines.push('');
  lines.push(`### 📊 PROVEN PATTERN DATA — "${angle}" × ${product}`);
  lines.push('');
  lines.push(
    'Hard data from past briefs in this exact angle+product combination. Use these as the empirical baseline when scoring concepts. Combinations with 2+ samples and avg ≥7.5 are PROVEN — concepts that fit them should score higher. Combinations with avg <6 are KNOWN UNDERPERFORMERS — concepts that resemble them should score lower.',
  );
  lines.push('');
  lines.push('| Framework | Hook Styles | Avg Score | Samples | Verdict |');
  lines.push('|-----------|-------------|-----------|---------|---------|');

  for (const r of matched) {
    const verdict =
      r.avgScore >= 8 && r.sampleSize >= 2
        ? '✅ PROVEN STRONG'
        : r.avgScore >= 7
          ? '🟢 Solid'
          : r.avgScore >= 6
            ? '🟡 Mixed'
            : '🔴 UNDERPERFORMER';
    const hooks = r.hookStyles.length > 0 ? r.hookStyles.join(', ') : '(none)';
    lines.push(
      `| ${r.framework} | ${hooks} | ${r.avgScore.toFixed(1)}/10 | ${r.sampleSize} | ${verdict} |`,
    );
  }

  // Top recommendations narrative
  const winners = matched.filter((r) => r.avgScore >= 8 && r.sampleSize >= 2);
  const losers = matched.filter((r) => r.avgScore < 6 && r.sampleSize >= 2);

  if (winners.length > 0) {
    lines.push('');
    lines.push(
      `**PROVEN WINNERS for this angle+product:** ${winners
        .map((w) => `${w.framework} + ${w.hookStyles.join('/') || 'any hook'} (${w.avgScore.toFixed(1)}/10 across ${w.sampleSize})`)
        .join('; ')}. Concepts that fit one of these patterns get a clear scoring bonus.`,
    );
  }
  if (losers.length > 0) {
    lines.push('');
    lines.push(
      `**KNOWN UNDERPERFORMERS for this angle+product — AVOID:** ${losers
        .map((l) => `${l.framework} + ${l.hookStyles.join('/') || 'any hook'} (${l.avgScore.toFixed(1)}/10 across ${l.sampleSize})`)
        .join('; ')}. Concepts that resemble these get a clear scoring penalty.`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

/** Format a global "top-performing patterns" overview across all angles. */
export function formatGlobalTopPatterns(patterns: AnglePatternRecord[], limit = 10): string {
  const ranked = [...patterns]
    .filter((p) => p.sampleSize >= 2)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, limit);
  if (ranked.length === 0) return '';

  const lines: string[] = [];
  lines.push('### Top Proven Patterns Across All Angles');
  for (const r of ranked) {
    lines.push(
      `- **${r.angle} × ${r.product}** | ${r.framework} | hooks: ${r.hookStyles.join(', ') || 'any'} | ${r.avgScore.toFixed(1)}/10 (×${r.sampleSize})`,
    );
  }
  return lines.join('\n');
}
