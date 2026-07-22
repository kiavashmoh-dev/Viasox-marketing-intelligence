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

/**
 * Rolling recency window for pattern mining. Patterns are mined from the
 * most recent N briefs only — NOT all-time history. Rationale (July 2026
 * convergence fix): all-time mining meant the table's "verdicts" grew
 * stronger and stronger as history accumulated, freezing the system's taste
 * at whatever the reviewer favored months ago. A window lets old preference
 * decay while still surfacing genuinely recent signal.
 */
const MINING_WINDOW_BRIEFS = 50;

/** Re-derive AnglePatternRecord[] from the most recent briefs (rolling window). */
export function mineAnglePatterns(): AnglePatternRecord[] {
  // getAllBriefs flattens batches in chronological insertion order, so the
  // tail of the array is the most recent work.
  const briefs = getAllBriefs().slice(-MINING_WINDOW_BRIEFS);
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

// Minimum samples before a combination appears in the prompt table AT ALL.
// Was 1 ("even a single data point is signal-rich") — that turned single
// lucky/unlucky briefs into table rows that herded every future selection
// for that angle×product. Three samples is the floor for showing anything.
const MIN_SAMPLE_FOR_PROMPT = 3;
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
  lines.push(`### 📊 OBSERVED HISTORY — "${angle}" × ${product} (advisory context, NOT verdicts)`);
  lines.push('');
  lines.push(
    'Internal review scores from recent past briefs in this angle+product combination. Read this correctly: these are OUR OWN reviewer\'s scores, not market results — treat them as context, never as a veto. A combination with consistently low recent scores deserves skepticism; a combination with strong recent scores deserves weight WHEN a concept genuinely fits it. But a framework or hook style with NO history here is an OPPORTUNITY, not a risk — never penalize a concept for lacking history, and never nudge a concept toward a listed pattern it doesn\'t naturally fit. Framework variety across the batch is a strength.',
  );
  lines.push('');
  lines.push('| Framework | Hook Styles | Avg Score | Samples | Verdict |');
  lines.push('|-----------|-------------|-----------|---------|---------|');

  for (const r of matched) {
    const verdict =
      r.avgScore >= 8 && r.sampleSize >= 3
        ? '✅ Consistently strong (internal)'
        : r.avgScore >= 7
          ? '🟢 Solid'
          : r.avgScore >= 6
            ? '🟡 Mixed'
            : '🔴 Weak so far';
    const hooks = r.hookStyles.length > 0 ? r.hookStyles.join(', ') : '(none)';
    lines.push(
      `| ${r.framework} | ${hooks} | ${r.avgScore.toFixed(1)}/10 | ${r.sampleSize} | ${verdict} |`,
    );
  }

  // History narrative — context, not commands
  const winners = matched.filter((r) => r.avgScore >= 8 && r.sampleSize >= 3);
  const losers = matched.filter((r) => r.avgScore < 6 && r.sampleSize >= 3);

  if (winners.length > 0) {
    lines.push('');
    lines.push(
      `**Consistently strong here (internal scores):** ${winners
        .map((w) => `${w.framework} + ${w.hookStyles.join('/') || 'any hook'} (${w.avgScore.toFixed(1)}/10 across ${w.sampleSize})`)
        .join('; ')}. Give weight when a concept genuinely fits one of these — do not bend concepts toward them.`,
    );
  }
  if (losers.length > 0) {
    lines.push('');
    lines.push(
      `**Weak so far here (internal scores):** ${losers
        .map((l) => `${l.framework} + ${l.hookStyles.join('/') || 'any hook'} (${l.avgScore.toFixed(1)}/10 across ${l.sampleSize})`)
        .join('; ')}. Apply skepticism to concepts that closely resemble these — but judge each on its own execution; a fresh take on a weak-so-far framework can absolutely win.`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

/** Format a global "top-performing patterns" overview across all angles. */
export function formatGlobalTopPatterns(patterns: AnglePatternRecord[], limit = 10): string {
  const ranked = [...patterns]
    .filter((p) => p.sampleSize >= 3)
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
