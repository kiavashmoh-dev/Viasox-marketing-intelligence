/**
 * Memory Curator Agent — Synthesizes creative history into actionable intelligence
 *
 * Runs as Step 0.5 in the pipeline, before any task processing.
 * Only runs if at least 1 previous batch exists in memory.
 * Uses Opus 4.6 to produce a 500-800 word Creative Intelligence Briefing
 * that gets injected into every subsequent agent in the batch.
 */

import { sendMessage } from '../api/claude';
import {
  loadMemory,
  getFrameworkUsageCounts,
  getHookStyleUsageCounts,
  getPersonaUsageCounts,
  getAngleUsageCounts,
  getReviewerFailurePatterns,
  getRecentFeedback,
  saveCuratorBriefing,
} from './memoryStore';
import type { CreativeIntelligenceBriefing } from './memoryTypes';

const OPUS = 'claude-opus-4-6';

// ─── Build Curator Input ────────────────────────────────────────────────────

function buildCuratorInput(): string {
  const store = loadMemory();
  const parts: string[] = [];

  // Overview
  const totalBriefs = store.batches.reduce((s, b) => s + b.briefs.length, 0);
  parts.push(`## CREATIVE HISTORY OVERVIEW
- Total batches: ${store.batches.length}
- Total briefs produced: ${totalBriefs}
- Date range: ${store.batches[0]?.date ?? 'N/A'} to ${store.batches[store.batches.length - 1]?.date ?? 'N/A'}
`);

  // Framework usage
  const frameworks = getFrameworkUsageCounts();
  if (Object.keys(frameworks).length > 0) {
    parts.push(`## FRAMEWORK USAGE (from most to least used)`);
    const sorted = Object.entries(frameworks).sort((a, b) => b[1] - a[1]);
    parts.push(sorted.map(([f, c]) => `- ${f}: ${c} times`).join('\n'));
    parts.push('');
  }

  // Hook style usage
  const hooks = getHookStyleUsageCounts();
  if (Object.keys(hooks).length > 0) {
    parts.push(`## HOOK STYLE USAGE`);
    const sorted = Object.entries(hooks).sort((a, b) => b[1] - a[1]);
    parts.push(sorted.map(([s, c]) => `- ${s}: ${c} times`).join('\n'));
    parts.push('');
  }

  // Persona usage
  const personas = getPersonaUsageCounts();
  if (Object.keys(personas).length > 0) {
    parts.push(`## PERSONA/ARCHETYPE USAGE`);
    const sorted = Object.entries(personas).sort((a, b) => b[1] - a[1]);
    parts.push(sorted.map(([p, c]) => `- ${p}: ${c} times`).join('\n'));
    parts.push('');
  }

  // Angle usage
  const angles = getAngleUsageCounts();
  if (Object.keys(angles).length > 0) {
    parts.push(`## ANGLE DISTRIBUTION`);
    const sorted = Object.entries(angles).sort((a, b) => b[1] - a[1]);
    parts.push(sorted.map(([a, c]) => `- ${a}: ${c} briefs`).join('\n'));
    parts.push('');
  }

  // Reviewer failure patterns (aggregate counts)
  const failures = getReviewerFailurePatterns();
  if (failures.length > 0) {
    parts.push(`## REVIEWER FAILURE PATTERNS (FLAG/FAIL counts across all batches)`);
    parts.push(failures.map((f) => `- ${f.check}: ${f.count} times`).join('\n'));
    parts.push('');
  }

  // Failure context correlation — which angle/product combos trigger which failures
  const allBriefs = store.batches.flatMap((b) => b.briefs);
  const failedBriefs = allBriefs.filter((b) => b.reviewFlags.length > 0);
  if (failedBriefs.length > 0) {
    parts.push(`## FAILURE CONTEXT CORRELATION (angle × product × check)`);
    parts.push(`Briefs with FLAGS/FAILs: ${failedBriefs.length} of ${allBriefs.length} total\n`);

    // Group failures by angle+check to find failure-prone combos
    const comboMap: Record<string, { count: number; checks: Record<string, number>; scores: number[] }> = {};
    for (const brief of failedBriefs) {
      const key = `${brief.angle} × ${brief.product}`;
      if (!comboMap[key]) comboMap[key] = { count: 0, checks: {}, scores: [] };
      comboMap[key].count++;
      comboMap[key].scores.push(brief.reviewScore);
      for (const flag of brief.reviewFlags) {
        comboMap[key].checks[flag] = (comboMap[key].checks[flag] ?? 0) + 1;
      }
    }

    const sorted = Object.entries(comboMap).sort((a, b) => b[1].count - a[1].count);
    for (const [combo, data] of sorted.slice(0, 8)) {
      const avgScore = (data.scores.reduce((s, v) => s + v, 0) / data.scores.length).toFixed(1);
      const topChecks = Object.entries(data.checks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([check, cnt]) => `${check} (${cnt}x)`)
        .join(', ');
      parts.push(`- **${combo}** — ${data.count} flagged brief(s), avg score ${avgScore}/10 | Top failures: ${topChecks}`);
    }
    parts.push('');

    // High-scoring combos (for "proven strengths" contrast)
    const highScorers = allBriefs.filter((b) => b.reviewScore >= 8);
    if (highScorers.length > 0) {
      parts.push(`## HIGH-PERFORMING COMBOS (score ≥ 8/10)`);
      const highMap: Record<string, { count: number; frameworks: string[]; avgScore: number }> = {};
      for (const brief of highScorers) {
        const key = `${brief.angle} × ${brief.product}`;
        if (!highMap[key]) highMap[key] = { count: 0, frameworks: [], avgScore: 0 };
        highMap[key].count++;
        highMap[key].avgScore += brief.reviewScore;
        if (!highMap[key].frameworks.includes(brief.framework)) {
          highMap[key].frameworks.push(brief.framework);
        }
      }
      for (const [combo, data] of Object.entries(highMap).sort((a, b) => b[1].count - a[1].count).slice(0, 5)) {
        parts.push(`- **${combo}** — ${data.count} high-score brief(s), avg ${(data.avgScore / data.count).toFixed(1)}/10 | Frameworks: ${data.frameworks.join(', ')}`);
      }
      parts.push('');
    }
  }

  // Criterion-level analysis — which criteria are weakest system-wide
  const scoredBriefs = allBriefs.filter((b) => b.scoring?.reviewerBreakdown);
  if (scoredBriefs.length >= 3) {
    const criteriaKeys = [
      'scriptVagueness', 'confusionFactor', 'scriptLineStrength', 'hookQuality',
      'hookToBodyTransition', 'adTypeAdaptation', 'uniquenessCreativity',
      'angleSpecificity', 'visualClarity', 'inspirationAdherence', 'frameworkExecution',
    ] as const;

    parts.push(`## CRITERION-LEVEL PERFORMANCE (across ${scoredBriefs.length} scored briefs)`);
    for (const key of criteriaKeys) {
      const scores: number[] = [];
      for (const b of scoredBriefs) {
        const bd = b.scoring!.reviewerBreakdown;
        const entry = bd[key as keyof typeof bd];
        if (entry && typeof entry === 'object' && 'score' in entry) scores.push(entry.score);
      }
      if (scores.length === 0) continue;
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      const failCount = scores.filter((s) => s <= 4).length;
      const flagCount = scores.filter((s) => s > 4 && s <= 6).length;
      parts.push(`- **${key}**: avg ${avg.toFixed(1)}/10 (${failCount} FAILs, ${flagCount} FLAGs across ${scores.length} briefs)`);
    }
    parts.push('');
  }

  // Recent creative inventory — concept summaries + hooks with dates
  // This gives the curator concrete data to flag repetition risks
  const now = Date.now();
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const recentInventoryBriefs = allBriefs
    .filter((b) => {
      const batchDate = store.batches.find((batch) => batch.briefs.includes(b))?.date;
      return batchDate && (now - Date.parse(batchDate)) < TWO_WEEKS_MS;
    });

  if (recentInventoryBriefs.length > 0) {
    parts.push(`## RECENT CREATIVE INVENTORY (last 14 days — informational)`);
    parts.push(`This is a REFERENCE LIBRARY of what's been produced. Not a blacklist. Repetition of a concept or angle is fine if it serves the current brief's parameters; the downstream Creative Strategist decides per-brief. Use the scores to identify what underperformed so future iterations can rethink the approach.\n`);

    // Group by angle for easy scanning
    const byAngle: Record<string, typeof recentInventoryBriefs> = {};
    for (const brief of recentInventoryBriefs) {
      const key = brief.angle;
      if (!byAngle[key]) byAngle[key] = [];
      byAngle[key].push(brief);
    }

    for (const [angle, briefs] of Object.entries(byAngle)) {
      parts.push(`### ${angle}`);
      for (const brief of briefs) {
        const batchDate = store.batches.find((batch) => batch.briefs.includes(brief))?.date ?? '?';
        const daysAgo = batchDate !== '?' ? Math.round((now - Date.parse(batchDate)) / (24 * 60 * 60 * 1000)) : '?';
        const scoreNote = brief.reviewScore > 0 ? `Score ${brief.reviewScore}/10` : 'Unscored';
        const performanceNote = brief.reviewScore > 0 && brief.reviewScore <= 5 ? ' (underperformed — rethink if revisited)' : '';
        parts.push(`- [${batchDate}, ${daysAgo}d ago] ${brief.id} (${brief.product}) — ${scoreNote}${performanceNote}`);
        parts.push(`  Concept: "${brief.conceptSummary.slice(0, 150)}"`);
        parts.push(`  Framework: ${brief.framework} | Emotion: ${brief.emotionalEntry} | Persona: ${brief.persona}`);
        if (brief.hookSummaries.length > 0) {
          parts.push(`  Hooks: ${brief.hookSummaries.map((h) => `"${h}"`).join(' | ')}`);
        }
      }
      parts.push('');
    }
  }

  // Per-batch summaries (last 5)
  const recentBatches = store.batches.slice(-5);
  if (recentBatches.length > 0) {
    parts.push(`## RECENT BATCH SUMMARIES`);
    for (const batch of recentBatches) {
      parts.push(`### Batch ${batch.date} (${batch.taskCount} tasks)`);
      if (batch.creativeDirection) {
        parts.push(`Creative Direction: "${batch.creativeDirection.slice(0, 200)}"`);
      }
      for (const brief of batch.briefs) {
        const flags = brief.reviewFlags.length > 0 ? ` [FLAGS: ${brief.reviewFlags.join(', ')}]` : '';
        parts.push(`- ${brief.id}: ${brief.angle}/${brief.product} | ${brief.framework} | Hooks: ${brief.hookStyles.join(', ')} | Persona: ${brief.persona} | Score: ${brief.reviewScore}/10${flags}`);
      }
      if (batch.batchReviewSummary) {
        parts.push(`Assessment: ${batch.batchReviewSummary.slice(0, 200)}`);
      }
      parts.push('');
    }
  }

  // Feedback history
  const feedback = getRecentFeedback(10);
  if (feedback.length > 0) {
    parts.push(`## FEEDBACK HISTORY`);
    for (const fb of feedback) {
      parts.push(`- [${fb.date}] (${fb.source}): "${fb.content.slice(0, 200)}"`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

// ─── Curator System Prompt ──────────────────────────────────────────────────

const CURATOR_SYSTEM = `You are the Creative Intelligence Curator for Viasox, a DTC compression sock brand with 107,993+ customer reviews. You have access to the complete creative history of the autopilot brief pipeline.

Your job is to synthesize this history into a concise CREATIVE INTELLIGENCE BRIEFING that will be injected into every agent in the current batch (concept generator, concept selector, script writer, batch reviewer).

The briefing must be:
1. **ACTIONABLE** — specific enough that agents can make different decisions because of it. Not "use variety" but "The Contrast Framework has been used 0 times — try it for Neuropathy."
2. **CONCISE** — 500-800 words maximum. Agents already have massive prompts; this must be tight.
3. **BALANCED** — acknowledge what worked AND what to avoid, without being so restrictive that agents feel boxed in. Overused doesn't mean banned — it means be thoughtful about WHY you'd use it again.

STRUCTURE YOUR BRIEFING EXACTLY AS:

## CREATIVE INTELLIGENCE BRIEFING — BATCH [N+1]

### What We've Done (Pattern Summary)
[2-3 sentences on the creative landscape so far: how many batches, dominant angles, framework patterns, hook style tendencies]

### Overused Patterns — DIVERSIFY AWAY FROM THESE
[Bullet list of specific patterns that have been used too often. Be precise with counts: "Question-style hooks have been used in 8 of 12 briefs" not "we use too many questions"]

### Underexplored Territory — LEAN INTO THESE
[Bullet list of frameworks, hook styles, personas, emotional entry points, or narrative structures that have NOT been used or are significantly underrepresented. Reference the full list of 20 available frameworks when identifying gaps.]

### Recurring Quality Issues — AVOID THESE MISTAKES
[Bullet list derived from reviewer FLAG/FAIL patterns. If "Angle Alignment" fails often, say so with counts. If "Hook Differentiation" is a recurring weakness, call it out with specifics about what went wrong.]

### Proven Strengths — BUILD ON THESE
[Bullet list of patterns that consistently score well in reviews. Include which angle/framework/hook combos produced the highest scores.]

### Failure Mode Intelligence — CONDITIONAL WARNINGS
[This is the most actionable section. Analyze the failure context correlation data to extract SPECIFIC failure modes — patterns that predict when quality drops. Format each as a conditional warning that agents can act on. Examples of the format:
- "When talking point is a MEDICAL CONDITION (Neuropathy, Diabetes, Varicose Veins) + awareness is UNAWARE → concepts drift to generic comfort messaging 40% of the time. COUNTERMEASURE: Force the medical condition into the concept title and Beat 1 scene."
- "When ad type is ECOM + duration is 1-15 SEC → briefs overshoot word ceiling by 30%+ in 60% of cases. COUNTERMEASURE: Plan 25-word body maximum, not 35."
- "When framework is PAS + angle is PROBLEM-BASED → Hook Differentiation fails 50% of the time because all 3 hooks default to pain questions. COUNTERMEASURE: Force at least one statement and one revelation hook."
Only include failure modes supported by the data (at least 2 occurrences of the pattern). If the history is too small to detect conditional patterns, say so and provide general warnings instead.]

### Creative Direction History
[Summary of past creative direction instructions and feedback, so agents understand the creative director's evolving preferences and can align with them even if no new direction is given this batch.]

### Creative History — Reference, Not Restriction
[Review the RECENT CREATIVE INVENTORY data and list what's been produced recently. Key framing rules for downstream agents:

**REPETITION IS NOT THE ENEMY.** If a concept, angle, or hook style served a previous brief and would also serve a new brief's parameters well, using it again is FINE. The system is not trying to enforce novelty-for-novelty's-sake.

**IRRELEVANCE IS THE ENEMY.** What the system is trying to prevent is concepts that ignore the current brief's talking point, inspiration, duration, or product — concepts that look like generic manifesto defaults (shoe size, sock drawer purge, 3pm ankle ache) with the talking point stapled on.

For each recent batch / brief listed below, simply describe WHAT was done and how it scored. Do NOT mark anything as "banned" or "too recent." Downstream agents will decide — for each specific brief's parameters — whether revisiting a past approach genuinely serves the new parameters or is just defaulting to something familiar.

- If angles / concepts / hook styles appeared in the last 7-14 days, list them with their scores and a one-line description so agents have full visibility.
- Note which past approaches underperformed (scores ≤5) — these are good to rethink when that angle comes up again, but not banned.
- If no prior batches in the last 14 days, say "No recent history — full creative freedom."

The downstream Creative Strategist will decide per-brief whether a past approach is relevant NOW. The memory is a reference library, not a blacklist.]

### Style Reference Evolution
[If reference styles have been provided across batches, describe how the visual/narrative direction has evolved. If no references have been provided, note that and suggest that agents default to the brand's established style.]

OUTPUT ONLY THE BRIEFING. No preamble, no explanation of your process.`;

// ─── Run Curator ────────────────────────────────────────────────────────────

export async function runMemoryCurator(
  apiKey: string,
  signal: AbortSignal,
  /** Optional inspiration bank items for performance intelligence. */
  inspirationItems?: Array<{
    id: string; title: string; starred: boolean;
    adType: string; angleType: string; duration: string;
    derivedScore: number | null; sampleSize: number;
    contextualScores?: Record<string, { angleType: string; duration: string; avgScore: number; sampleSize: number }>;
  }>,
): Promise<CreativeIntelligenceBriefing | null> {
  const store = loadMemory();
  if (store.batches.length === 0) return null;

  let curatorInput = buildCuratorInput();

  // Inject inspiration performance intelligence if available
  if (inspirationItems && inspirationItems.length > 0) {
    const inspParts: string[] = [];
    inspParts.push(`## INSPIRATION BANK PERFORMANCE INTELLIGENCE`);
    inspParts.push(`Total items in bank: ${inspirationItems.length}`);
    inspParts.push('');

    // Top performers
    const scored = inspirationItems
      .filter((i) => i.derivedScore !== null && i.sampleSize >= 2)
      .sort((a, b) => (b.derivedScore ?? 0) - (a.derivedScore ?? 0));
    if (scored.length > 0) {
      inspParts.push('**Top-performing inspirations (by derivedScore):**');
      for (const item of scored.slice(0, 5)) {
        inspParts.push(`- "${item.title}" (${item.adType}, ${item.angleType}, ${item.duration}) — ${item.derivedScore?.toFixed(1)}/10 across ${item.sampleSize} uses${item.starred ? ' ★' : ''}`);
        const ctxEntries = Object.values(item.contextualScores ?? {});
        for (const ctx of ctxEntries) {
          inspParts.push(`  → ${ctx.angleType} + ${ctx.duration}: ${ctx.avgScore.toFixed(1)}/10 (${ctx.sampleSize} uses)`);
        }
      }
      inspParts.push('');
    }

    // Coverage gaps — ad types and durations with no inspiration items
    const adTypeCounts: Record<string, number> = {};
    const durationCounts: Record<string, number> = {};
    for (const item of inspirationItems) {
      adTypeCounts[item.adType] = (adTypeCounts[item.adType] ?? 0) + 1;
      durationCounts[item.duration] = (durationCounts[item.duration] ?? 0) + 1;
    }
    const gaps: string[] = [];
    if (!durationCounts['1-15 sec']) gaps.push('No short-form (1-15 sec) inspiration ads — user should add some');
    if (!adTypeCounts['Founder Style']) gaps.push('No Founder Style inspiration ads');
    if (!adTypeCounts['UGC (User Generated Content)']) gaps.push('No UGC inspiration ads');
    if (gaps.length > 0) {
      inspParts.push('**Inspiration gaps (missing coverage):**');
      for (const g of gaps) inspParts.push(`- ${g}`);
      inspParts.push('');
    }

    curatorInput += '\n' + inspParts.join('\n');
  }

  const totalBriefs = store.batches.reduce((s, b) => s + b.briefs.length, 0);

  const briefingText = await sendMessage(
    CURATOR_SYSTEM,
    `Here is the complete creative history to analyze:\n\n${curatorInput}`,
    apiKey,
    10000,
    OPUS,
    signal,
  );

  const briefing: CreativeIntelligenceBriefing = {
    generatedAt: new Date().toISOString(),
    totalBatchesAnalyzed: store.batches.length,
    totalBriefsAnalyzed: totalBriefs,
    frameworkUsage: getFrameworkUsageCounts(),
    angleUsage: getAngleUsageCounts(),
    hookStyleUsage: getHookStyleUsageCounts(),
    personaUsage: getPersonaUsageCounts(),
    briefingText,
  };

  saveCuratorBriefing(briefing);
  return briefing;
}

// ─── Format Angle History for Selector ──────────────────────────────────────

export function formatAngleHistoryForSelector(
  angle: string,
  history: Array<{ framework: string; hookStyles: string[]; conceptSummary: string; reviewScore: number; date?: string }>,
): string {
  if (history.length === 0) {
    return `No prior briefs for the "${angle}" angle. Full creative freedom — explore boldly.`;
  }

  let table = `| Batch | Framework | Hook Styles | Concept Summary | Score |
|-------|-----------|-------------|-----------------|-------|
`;
  for (const h of history.slice(-10)) { // Last 10 max
    table += `| ${h.date ?? '?'} | ${h.framework} | ${h.hookStyles.join(', ')} | ${h.conceptSummary.slice(0, 60)}... | ${h.reviewScore}/10 |\n`;
  }

  // Identify overused patterns for this specific angle
  const frameworkCounts: Record<string, number> = {};
  const hookCounts: Record<string, number> = {};
  for (const h of history) {
    frameworkCounts[h.framework] = (frameworkCounts[h.framework] ?? 0) + 1;
    for (const s of h.hookStyles) {
      hookCounts[s] = (hookCounts[s] ?? 0) + 1;
    }
  }

  const overusedFrameworks = Object.entries(frameworkCounts)
    .filter(([, c]) => c >= 2)
    .map(([f, c]) => `${f} (used ${c}x)`);

  const overusedHooks = Object.entries(hookCounts)
    .filter(([, c]) => c >= 3)
    .map(([s, c]) => `${s} (used ${c}x)`);

  let advice = '';
  if (overusedFrameworks.length > 0) {
    advice += `\nPatterns to DIVERSIFY from for "${angle}": ${overusedFrameworks.join(', ')}`;
  }
  if (overusedHooks.length > 0) {
    advice += `\nHook styles to VARY for "${angle}": ${overusedHooks.join(', ')}`;
  }

  return table + advice;
}
