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

  // Reviewer failure patterns
  const failures = getReviewerFailurePatterns();
  if (failures.length > 0) {
    parts.push(`## REVIEWER FAILURE PATTERNS (FLAG/FAIL counts across all batches)`);
    parts.push(failures.map((f) => `- ${f.check}: ${f.count} times`).join('\n'));
    parts.push('');
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

### Creative Direction History
[Summary of past creative direction instructions and feedback, so agents understand the creative director's evolving preferences and can align with them even if no new direction is given this batch.]

### Style Reference Evolution
[If reference styles have been provided across batches, describe how the visual/narrative direction has evolved. If no references have been provided, note that and suggest that agents default to the brand's established style.]

OUTPUT ONLY THE BRIEFING. No preamble, no explanation of your process.`;

// ─── Run Curator ────────────────────────────────────────────────────────────

export async function runMemoryCurator(
  apiKey: string,
  signal: AbortSignal,
): Promise<CreativeIntelligenceBriefing | null> {
  const store = loadMemory();
  if (store.batches.length === 0) return null;

  const curatorInput = buildCuratorInput();
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
