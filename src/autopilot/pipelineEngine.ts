/**
 * Autopilot Pipeline Engine — FULL EXPERT VERSION
 *
 * Orchestrates the complete brief generation pipeline with maximum depth:
 *
 * Phase 1 — Strategy & Concepts:
 *   1. Strategy Session — Senior strategist analyzes batch, asks questions
 *   2. Strategy Synthesis — Produces weekly strategy brief from answers
 *   3. Generate Concepts — Full angles prompt with Opus per task
 *   4. Evaluate Concepts — Rate and summarize each concept for interactive review
 * [User reviews and approves concepts]
 * Phase 2 — Scripts & Review:
 *   5. Generate Briefs — Full script prompt with Opus per task
 *   6. Batch Review — Expert reviewer with complete knowledge stack
 *
 * All creative agents use claude-opus-4-6.
 * Framework diversity is enforced across the batch.
 * Tasks may be pinned to a specific Inspiration Bank item — when pinned, the
 * full frames + tags + summary + learnings + script of that ad are injected
 * into the concept and script generation steps via vision calls.
 */

import { sendMessage, sendVisionMessage } from '../api/claude';
import type { ContentBlock } from '../api/claude';
import { buildAnglesPrompt } from '../prompts/anglesPrompt';
import { buildScriptPrompt } from '../prompts/scriptPrompt';
import { buildResourceContext } from '../prompts/systemBase';
import { buildConceptSelectorPrompt, parseSelectorResponse } from '../prompts/conceptSelectorPrompt';
import { buildBatchReviewerPrompt } from '../prompts/batchReviewerPrompt';
import { buildConceptEvaluatorPrompt, parseConceptEvaluations } from '../prompts/conceptEvaluatorPrompt';
import { buildStrategyAnalysisPrompt, buildStrategySynthesisPrompt, parseStrategyAnalysis } from '../prompts/strategySessionPrompt';
import { parseConceptBlocks } from '../utils/conceptParser';
import type { FullAnalysis, ScriptParams, ScriptFramework } from '../engine/types';
import type { AutopilotTask, AutopilotState, CreativeDirection, StrategySession } from '../engine/autopilotTypes';
import type { InspirationItem } from '../engine/inspirationTypes';
import { loadMemory, getHistoryForAngle, getReviewerFailurePatterns, addRedoEvent } from './memoryStore';
import { getAngleLanguageBank } from '../prompts/manifestoReference';
import { getAngleDirectives } from '../utils/customOptionsRegistry';
import { runMemoryCurator, formatAngleHistoryForSelector } from './memoryCurator';
import { saveCompletedBatchToMemory } from './memoryExtractor';
import { getDeepInspirationContextBlock } from '../inspiration/inspirationInjection';
import type { ScoredInspiration } from '../inspiration/inspirationSelector';
import { getItem as getInspirationItem, getFrames as getInspirationFrames, getAllItems as getAllInspirationItems } from '../inspiration/inspirationStore';
import { getEffectiveTags } from '../engine/inspirationTypes';
import { runAngleDirectiveProposer } from './angleDirectiveProposer';
import { formatAnglePatternsForEvaluator } from './anglePatternMiner';
import { getAnglePatternsFor, getScoreCalibration } from './memoryStore';
import { formatCalibrationForReviewer } from './scoreCalibration';

// ─── All creative agents use Opus ────────────────────────────────────────────

const OPUS = 'claude-opus-4-6';
const INTER_CALL_DELAY = 8000;

const VALID_FRAMEWORKS: ScriptFramework[] = [
  'PAS (Problem-Agitate-Solution)',
  'AIDA-R (Attention-Interest-Desire-Action-Retention)',
  'Before-After-Bridge',
  'Star-Story-Solution',
  'Feel-Felt-Found',
  'Problem-Promise-Proof-Push',
  'Hook-Story-Offer',
  'Empathy-Education-Evidence',
  'The Contrast Framework',
  'The Skeptic Converter',
  'The Day-in-Life',
  'The Myth Buster',
  'The Enemy Framework',
  'The Discovery Narrative',
  'The Professional Authority',
  'The Demonstration Proof',
  'The Objection Crusher',
  'The Identity Alignment',
  'The Reason-Why (Hopkins)',
  'The Gradualization (Schwartz)',
];

function matchFramework(suggestion: string): ScriptFramework {
  const exact = VALID_FRAMEWORKS.find((f) => f === suggestion);
  if (exact) return exact;
  const lower = suggestion.toLowerCase();
  for (const f of VALID_FRAMEWORKS) {
    const fWords = f.toLowerCase().replace(/[()]/g, '').split(/\s+/);
    const matchCount = fWords.filter((w) => lower.includes(w) && w.length > 3).length;
    if (matchCount >= 2) return f;
  }
  const partial = VALID_FRAMEWORKS.find((f) => lower.includes(f.toLowerCase().split(' ')[0].replace('(', '')));
  return partial ?? 'PAS (Problem-Agitate-Solution)';
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Deep Inspiration Bank Loader (unpinned tasks) ──────────────────────────

/**
 * What the autopilot pipeline needs to mirror the bank with the same depth as
 * a pinned reference: a rich text block + (when the top pick is a video) up
 * to N frames from the highest-scoring item to drive vision generation.
 *
 * Top pick is treated as the PRIMARY reference. Its frames are loaded so the
 * model literally sees the look. Secondary picks contribute via text only.
 */
interface DeepInspirationContext {
  picks: ScoredInspiration[];
  primaryFrames: string[];           // base64 jpeg data URLs (with prefix)
  primaryItemId: string | null;
  richContext: string;
  hasContent: boolean;
}

const DEEP_PRIMARY_FRAME_CAP = 4;    // smaller than the pin path (8) — token cost

/**
 * Load the deep inspiration bank context for a task. Used when no pin is set
 * and the user still wants the generators to deeply mirror proven references.
 *
 * Returns an empty/zero-content struct if the bank has no relevant matches.
 */
export async function loadDeepInspirationForTask(
  task: AutopilotTask,
): Promise<DeepInspirationContext> {
  const empty: DeepInspirationContext = {
    picks: [],
    primaryFrames: [],
    primaryItemId: null,
    richContext: '',
    hasContent: false,
  };

  try {
    const { block, picks } = await getDeepInspirationContextBlock({
      adType: task.scriptParamsBase.adType,
      angleType: task.anglesParams.angleType,
      productCategory: task.product,
      duration: task.duration,
      isFullAi: task.scriptParamsBase.adType === 'Full AI (Documentary, story, education, etc)',
      fullAiSpec: task.scriptParamsBase.fullAiSpecification,
      fullAiVisualStyle: task.scriptParamsBase.fullAiVisualStyle,
      framework: undefined,
      maxResults: 5,
    });

    if (!picks.length) return empty;

    // Load frames for the top (PRIMARY) pick if it's a video. Cap aggressively
    // to keep vision call cost in check — 4 frames are enough to convey the
    // visual blueprint for an unpinned task.
    let primaryFrames: string[] = [];
    let primaryItemId: string | null = null;
    const primary = picks[0]?.item;
    if (primary && primary.kind === 'video') {
      primaryItemId = primary.id;
      try {
        const allFrames = await getInspirationFrames(primary.id);
        // Pick evenly-spaced frames from the available set
        if (allFrames.length <= DEEP_PRIMARY_FRAME_CAP) {
          primaryFrames = allFrames;
        } else {
          const step = allFrames.length / DEEP_PRIMARY_FRAME_CAP;
          primaryFrames = Array.from({ length: DEEP_PRIMARY_FRAME_CAP }, (_, i) =>
            allFrames[Math.min(allFrames.length - 1, Math.floor(i * step))],
          );
        }
      } catch (frameErr) {
        console.warn('[deep-inspiration] failed to load primary frames', frameErr);
      }
    }

    return {
      picks,
      primaryFrames,
      primaryItemId,
      richContext: block,
      hasContent: true,
    };
  } catch (e) {
    console.warn('[deep-inspiration] failed to load context for task', e);
    return empty;
  }
}

/**
 * Collect the inspiration item IDs that were injected for a single task by
 * either a pin or the deep loader. Returns an empty array if neither path
 * had any items. Used by the post-batch performance loop so each item gets
 * its derivedScore updated based on the brief's review score.
 */
function collectInspirationIds(
  pinned: PinnedInspirationContext | null,
  deep: DeepInspirationContext | null,
): string[] {
  const ids: string[] = [];
  if (pinned?.item?.id) ids.push(pinned.item.id);
  if (deep && deep.picks.length > 0) {
    for (const p of deep.picks) ids.push(p.item.id);
  }
  return ids;
}

/** Merge new IDs into a previously captured list, deduplicated. */
function mergeInspirationIds(prev: string[] | undefined, next: string[]): string[] {
  return Array.from(new Set([...(prev ?? []), ...next]));
}

/**
 * Build vision content blocks for a deep inspiration context. Mirrors the
 * pin path's frame-attaching but with the smaller frame cap.
 */
export function buildDeepInspirationVisionContent(
  deep: DeepInspirationContext,
  userText: string,
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const frames = deep.primaryFrames.slice(0, DEEP_PRIMARY_FRAME_CAP);
  for (const dataUrl of frames) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) continue;
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: match[1], data: match[2] },
    });
  }
  blocks.push({ type: 'text', text: userText });
  return blocks;
}

/**
 * Wrapper around sendMessage that auto-retries twice on timeout or overload errors.
 * Pipeline tasks should not fail just because a single API call was slow.
 */
async function sendMessageWithRetry(
  system: string,
  user: string,
  apiKey: string,
  maxTokens: number,
  model: string,
  signal: AbortSignal,
): Promise<string> {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await sendMessage(system, user, apiKey, maxTokens, model, signal);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isRetryable = msg.includes('timed out') || msg.includes('overloaded') || msg.includes('Rate limited');
      if (!isRetryable || attempt === MAX_ATTEMPTS) throw err;
      const waitMs = attempt * 15000 + Math.random() * 5000;
      console.log(`Pipeline retry ${attempt}/${MAX_ATTEMPTS - 1} — waiting ${Math.round(waitMs / 1000)}s...`);
      await delay(waitMs);
      if (signal.aborted) throw new Error('Pipeline cancelled');
    }
  }
  throw new Error('Unreachable');
}

function getMaxTokensForDuration(duration: string): number {
  switch (duration) {
    case '1-15 sec': return 16000;
    case '16-59 sec': return 20000;
    case '60-90 sec': return 24000;
    default: return 20000;
  }
}

// ─── Script Result Validation ───────────────────────────────────────────────

/**
 * Validate that a script result contains meaningful brief content.
 * The model occasionally returns a near-empty or preamble-only response
 * (especially under load). Without this check, the task would be marked
 * 'complete' with an empty brief card that can't be exported or used.
 *
 * Checks:
 *  1. Minimum length (300 chars — even a minimal 15s brief exceeds this)
 *  2. Contains at least one markdown table row (pipe-delimited)
 */
function validateScriptResult(result: string): void {
  if (result.trim().length < 300) {
    throw new Error('Brief generation returned insufficient content. Retrying...');
  }
  if (!result.includes('|')) {
    throw new Error('Brief generation returned no table content. Retrying...');
  }
}

// ─── Creative Direction Block ────────────────────────────────────────────────

function buildDirectionBlock(direction: CreativeDirection, strategyBrief?: string): string {
  const parts: string[] = [];

  if (strategyBrief) {
    parts.push(`## WEEKLY STRATEGY BRIEF — THIS IS THE NORTH STAR

The following strategy brief was produced by a senior creative strategist in collaboration with the creative director. Every creative decision — concept generation, concept selection, angle framing, script writing, hook style, tone, visual approach, framework choice — MUST align with this brief. This takes precedence over default behavior.

<strategy_brief>
${strategyBrief}
</strategy_brief>`);
  }

  if (direction.instructions.trim()) {
    parts.push(`## CREATIVE DIRECTOR'S INSTRUCTIONS — HIGHEST PRIORITY

<creative_direction>
${direction.instructions}
</creative_direction>`);
  }

  return parts.length > 0 ? '\n\n' + parts.join('\n\n') : '';
}

// ─── Pinned Inspiration Loader ──────────────────────────────────────────────

interface PinnedInspirationContext {
  item: InspirationItem;
  frames: string[];          // base64 jpeg data URLs (with `data:image/...;base64,` prefix)
  richContext: string;       // formatted text block describing the pin
  framework: ScriptFramework | null;  // pin's tagged framework matched to a valid framework, or null
  hookStyle: string | null;
  narrativeArc: string | null;
  hookBreakdown: string | null;
}

/**
 * Load a pinned inspiration item (full frames + tags + summary + learnings + script)
 * for the given task. Returns null if no pin, item not found, or item not ready.
 */
export async function loadPinnedInspirationForTask(
  taskName: string,
  pinnedInspirations: Record<string, string>,
): Promise<PinnedInspirationContext | null> {
  const itemId = pinnedInspirations[taskName];
  if (!itemId) return null;

  try {
    const item = await getInspirationItem(itemId);
    if (!item || item.status !== 'ready') return null;

    const frames = item.kind === 'video' ? await getInspirationFrames(itemId) : [];

    const tags = item.tags;
    // Resolve the pin's framework against the valid framework list. If the pin has a
    // tagged framework, this becomes the locked framework for the generated script.
    const framework: ScriptFramework | null =
      tags.framework && tags.framework !== 'unknown'
        ? matchFramework(tags.framework)
        : null;
    const hookStyle = tags.hookStyle && tags.hookStyle !== 'unknown' ? tags.hookStyle : null;

    const tagPills = [
      tags.adType !== 'unknown' ? tags.adType : null,
      tags.angleType !== 'unknown' ? tags.angleType : null,
      framework,
      tags.duration !== 'unknown' ? tags.duration : null,
      tags.productCategory && tags.productCategory !== 'unknown' ? tags.productCategory : null,
      hookStyle,
      tags.emotionalEntry || null,
      tags.isFullAi ? 'Full AI' : null,
      tags.fullAiSpecification && tags.fullAiSpecification !== 'unknown' ? tags.fullAiSpecification : null,
      tags.fullAiVisualStyle && tags.fullAiVisualStyle !== 'unknown' ? tags.fullAiVisualStyle : null,
      ...(tags.customTags || []),
    ].filter(Boolean).join(' · ');

    const learnings = (item.learnings || []).map((l, i) => `${i + 1}. ${l}`).join('\n');
    const scriptText = item.attachedScriptText || item.textContent || '';

    // Build a loud, framework-locked directive when the pin has a tagged framework.
    const frameworkLock = framework
      ? `

**🔒 PINNED FRAMEWORK LOCK — NON-NEGOTIABLE: ${framework}**
The reference ad is built on **${framework}**. The new brief MUST be built on the same framework — same persuasion arc, same beats in the same order, same payoff structure. Do NOT switch frameworks. Every concept you generate must work cleanly inside ${framework}, and the final script body must explicitly walk through ${framework}'s phases. This overrides any other framework recommendation, batch diversity rule, or default behavior.`
      : '';

    const hookLock = hookStyle
      ? `

**🔒 PINNED HOOK STYLE LOCK: ${hookStyle}**
The reference ad opens with a **${hookStyle}** hook. The new brief's first 3 seconds MUST use the same hook style. Do not invent a different hook archetype.`
      : '';

    const richContext = `## PINNED REFERENCE AD — FOLLOW THIS EXAMPLE CLOSELY

The creative director has pinned the following ad from the Inspiration Bank as the primary reference for THIS specific brief. You must study every detail and let it shape this brief's style, structure, hook approach, narrative arc, and visual treatment. This pin OVERRIDES general inspiration matches and default behaviors — when it conflicts with other examples or rules, follow the pin.

**Pin Title:** ${item.title}
**Tags:** ${tagPills || '(none)'}${frameworkLock}${hookLock}

**Summary (why this ad works):**
${item.summary}

**Key Learnings to Replicate:**
${learnings}

**Style Notes:**
${item.styleNotes}
${item.hookBreakdown ? `\n**Hook Breakdown (first 3 seconds) — REPLICATE THIS APPROACH:**\n${item.hookBreakdown}` : ''}
${item.narrativeArc ? `\n**Narrative Arc — MATCH THIS STRUCTURE BEAT FOR BEAT:**\n${item.narrativeArc}` : ''}
${scriptText ? `\n**Reference Script / Voiceover (study the rhythm, pacing, and beat structure — do not copy lines):**\n${scriptText}` : ''}
${frames.length > 0 ? `\n**Visual Frames:** ${frames.length} frames from the reference ad are attached as images. Study them carefully — they show the actual look, framing, pacing, and visual language to emulate.` : ''}

**HOW TO USE THIS PIN — IN-DEPTH MIRRORING (NOT LIGHT INSPIRATION):**
1. The new brief should feel like a **direct sibling** of this pin — same creative DNA, fresh execution for this brief's angle/product
2. **Concept level:** every concept you generate must structurally mirror the pin's approach — same hook archetype, same emotional entry, same narrative shape
3. **Visual level:** the visual treatment, framing, color palette, and pacing must match what is shown in the attached frames
4. **Script level:** the script body must walk the same beats as the pin's narrative arc${framework ? ` and explicitly apply **${framework}**` : ''}
5. **Hook level:** the first 3 seconds must use the same hook style and emotional pattern as the pin${hookStyle ? ` (${hookStyle})` : ''}
6. **Tone:** voice, register, sentence length, and rhythm must echo the pin's reference script
7. Apply every listed learning as a creative principle that shapes decisions
8. Do NOT copy lines verbatim — adapt the approach to this brief's specific angle and product
9. The pin's product/angle may differ from this brief's — translate the STYLE, STRUCTURE, FRAMEWORK, and PACING, not the literal content`;

    return {
      item,
      frames,
      richContext,
      framework,
      hookStyle,
      narrativeArc: item.narrativeArc || null,
      hookBreakdown: item.hookBreakdown || null,
    };
  } catch (e) {
    console.warn('[pinned-inspiration] failed to load', e);
    return null;
  }
}

/**
 * Build vision content blocks from a pinned inspiration's frames + a final text prompt.
 * Strips the `data:image/...;base64,` prefix that frame extractor stores.
 */
export function buildPinnedVisionContent(
  pin: PinnedInspirationContext,
  userText: string,
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  // Cap at 8 frames for vision call efficiency
  const frames = pin.frames.slice(0, 8);
  for (const dataUrl of frames) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) continue;
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: match[1], data: match[2] },
    });
  }
  blocks.push({ type: 'text', text: userText });
  return blocks;
}

/**
 * Wrapper around sendVisionMessage that auto-retries on transient errors.
 */
async function sendVisionMessageWithRetry(
  system: string,
  content: ContentBlock[],
  apiKey: string,
  maxTokens: number,
  model: string,
  signal: AbortSignal,
): Promise<string> {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await sendVisionMessage(system, content, apiKey, maxTokens, model, signal);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isRetryable = msg.includes('timed out') || msg.includes('overloaded') || msg.includes('Rate limited');
      if (!isRetryable || attempt === MAX_ATTEMPTS) throw err;
      const waitMs = attempt * 15000 + Math.random() * 5000;
      console.log(`Vision pipeline retry ${attempt}/${MAX_ATTEMPTS - 1} — waiting ${Math.round(waitMs / 1000)}s...`);
      await delay(waitMs);
      if (signal.aborted) throw new Error('Pipeline cancelled');
    }
  }
  throw new Error('Unreachable');
}

// ─── Strategy Session ───────────────────────────────────────────────────────

export async function runStrategySession(
  tasks: AutopilotTask[],
  analysis: FullAnalysis,
  apiKey: string,
  memoryBriefing: string | undefined,
  signal: AbortSignal,
): Promise<StrategySession> {
  const prompt = buildStrategyAnalysisPrompt(tasks, analysis, memoryBriefing);

  const response = await sendMessage(
    prompt.system,
    prompt.user,
    apiKey,
    12000,
    OPUS,
    signal,
  );

  const parsed = parseStrategyAnalysis(response);

  return {
    batchAnalysis: parsed.analysis,
    questions: parsed.questions.map((q) => ({
      id: q.id,
      question: q.question,
      context: q.context,
      options: q.options || [],
      recommendedOption: q.recommendedOption,
      suggestedAnswer: q.suggested,
    })),
    answers: {},
  };
}

export async function synthesizeStrategy(
  session: StrategySession,
  tasks: AutopilotTask[],
  apiKey: string,
  memoryBriefing: string | undefined,
  signal: AbortSignal,
): Promise<string> {
  const qaPairs = session.questions.map((q) => ({
    question: q.question,
    answer: session.answers[q.id] || q.suggestedAnswer || '(No answer provided — use your best judgment)',
  }));

  const prompt = buildStrategySynthesisPrompt(
    session.batchAnalysis,
    qaPairs,
    tasks,
    memoryBriefing,
  );

  return await sendMessage(
    prompt.system,
    prompt.user,
    apiKey,
    14000,
    OPUS,
    signal,
  );
}

// ─── Phase 1: Generate & Evaluate Concepts ──────────────────────────────────

export async function runConceptPhase(
  tasks: AutopilotTask[],
  analysis: FullAnalysis,
  apiKey: string,
  resourceContext: string,
  direction: CreativeDirection,
  strategyBrief: string | undefined,
  memoryBriefing: string | undefined,
  onProgress: (state: AutopilotState) => void,
  signal: AbortSignal,
): Promise<AutopilotState> {
  const resourceCtx = buildResourceContext(resourceContext);
  const directionBlock = buildDirectionBlock(direction, strategyBrief);

  const state: AutopilotState = {
    phase: 'generating-concepts',
    tasks: tasks.map((task) => ({ task, step: 'pending' })),
    currentTaskIndex: 0,
  };
  onProgress({ ...state });

  const usedFrameworks: string[] = [];

  for (let i = 0; i < state.tasks.length; i++) {
    if (signal.aborted) throw new Error('Pipeline cancelled');

    state.currentTaskIndex = i;
    const ts = state.tasks[i];
    const { task } = ts;

    try {
      // ── Generate Concepts ──────────────────────────────────────────
      ts.step = 'generating-concepts';
      onProgress({ ...state });

      // Load pinned inspiration if any (overrides general bank matches).
      // If no pin, fall back to a DEEP load of the bank — top pick gets frames
      // for vision, all picks get rich text with reference scripts + strong
      // mirroring directives. This gives unpinned tasks the same depth.
      const pinned = await loadPinnedInspirationForTask(task.parsed.name, direction.pinnedInspirations);
      const deep = pinned ? null : await loadDeepInspirationForTask(task);
      // Capture which bank items are feeding this task — used post-batch to
      // update each item's derivedScore via recordInspirationUsage.
      ts.inspirationIdsUsed = mergeInspirationIds(
        ts.inspirationIdsUsed,
        collectInspirationIds(pinned, deep),
      );
      const inspirationCtx = pinned
        ? pinned.richContext
        : (deep && deep.hasContent ? deep.richContext : '');
      const anglesPrompt = buildAnglesPrompt(task.anglesParams, analysis, memoryBriefing, inspirationCtx);

      // Inject the SPECIFIC angle from Asana as the primary creative directive.
      // This ensures "Neuropathy" briefs are actually ABOUT neuropathy, not generic.
      // Also check for custom angle directives from the registry.
      const customDirectives = getAngleDirectives()
        .filter((d) => d.angle.toLowerCase() === task.parsed.angle.toLowerCase() ||
                       d.product.toLowerCase() === task.product.toLowerCase())
        .map((d) => `**Custom Directive (${d.angle} / ${d.product}):** ${d.directive}`)
        .join('\n');

      const angleDirective = `\n\n## ⚠️ PRIMARY CREATIVE DIRECTIVE — TALKING POINT: "${task.parsed.angle}"
${customDirectives ? `\n### CUSTOM DIRECTIVES FROM PREVIOUS FEEDBACK:\n${customDirectives}\n` : ''}

**THIS OVERRIDES ALL OTHER INSPIRATION.** The manifesto examples (sock graveyard, shoe swapping, 30-inch truth, etc.), winning ad bank, emotional patterns, and customer voice bank are BACKGROUND CONTEXT — they inform tone and strategy, but they do NOT set the topic. The topic is "${task.parsed.angle}" and ONLY "${task.parsed.angle}".

Every concept must:
1. Be unmistakably, specifically about "${task.parsed.angle}" — not about comfort in general, not about gifting, not about working all day, not about any other condition or lifestyle unless it directly connects to "${task.parsed.angle}"
2. Name "${task.parsed.angle}" explicitly (or its direct synonym) in the concept description
3. Describe scenarios, symptoms, or experiences that someone with/experiencing "${task.parsed.angle}" would immediately recognize as THEIR reality
4. Use customer language specifically from the "${task.parsed.angle}" angle language bank below — not generic Viasox quotes about other conditions

**REJECTION TEST:** If you could swap out "${task.parsed.angle}" for a different talking point and the concept would still work unchanged, the concept is TOO GENERIC and must be rewritten. Each concept must be so tightly bound to "${task.parsed.angle}" that removing it would break the concept.

${getAngleLanguageBank(task.parsed.angle)}

**FORMAT: ${task.parsed.medium} (${task.duration}${task.duration === '1-15 sec' ? ', final cut ≤ 15s' : task.duration === '16-59 sec' ? ', final cut ≤ 59s' : ', final cut ≤ 90s'})**
${task.duration === '1-15 sec' ? `This is a SHORT FORM ad. Do NOT write a compressed long-form story. Short form means:
- Experiment with VO and no-VO styles
- Consider POV-only (viewer sees through the character's eyes)
- First person, third person, or talking directly to viewer
- A single powerful moment or image, not a full narrative arc
- Creative visual treatments: split screen, text overlay, rapid cuts, reaction format
- The hook IS the ad — there's no "body." Every second is hook.
- Think TikTok/Reels native, not a TV spot cut short.
- Word budget: 30-35 words, hard ceiling 37 words.` : task.duration === '16-59 sec' ? `This is a MID FORM ad (16-59 seconds). VO REQUIRED. Structure:
- Full hook → body → close arc that lands inside 59 seconds
- 6-7 narrative beats, compact scene count (8-14 storyboard rows)
- Word budget: 115-135 words, hard ceiling 145 words.
- Every line must earn its place — cut anything that doesn't drive the arc.` : `This is an EXPANDED ad (60-90 seconds). VO REQUIRED. Structure:
- Full documentary-style arc with setup, intensification, turn, resolution
- 8-stage narrative possible, 16-22 storyboard rows
- Word budget: 190-215 words, hard ceiling 225 words.
- Pacing matters — every 15-second block must earn attention to keep the viewer through 90s.`}`;

      const conceptSystem = anglesPrompt.system + resourceCtx + directionBlock + angleDirective;

      // Vision call when either:
      //   - a pin exists with frames, OR
      //   - the deep bank fallback found a primary video reference with frames
      let conceptsRaw: string;
      if (pinned && pinned.frames.length > 0) {
        const visionContent = buildPinnedVisionContent(pinned, anglesPrompt.user);
        conceptsRaw = await sendVisionMessageWithRetry(
          conceptSystem,
          visionContent,
          apiKey,
          24000,
          OPUS,
          signal,
        );
      } else if (deep && deep.primaryFrames.length > 0) {
        const visionContent = buildDeepInspirationVisionContent(deep, anglesPrompt.user);
        conceptsRaw = await sendVisionMessageWithRetry(
          conceptSystem,
          visionContent,
          apiKey,
          24000,
          OPUS,
          signal,
        );
      } else {
        conceptsRaw = await sendMessageWithRetry(
          conceptSystem,
          anglesPrompt.user,
          apiKey,
          22000,
          OPUS,
          signal,
        );
      }
      ts.conceptsRaw = conceptsRaw;
      onProgress({ ...state });

      await delay(INTER_CALL_DELAY);

      // ── Evaluate Concepts ──────────────────────────────────────────
      ts.step = 'selecting-concept';
      onProgress({ ...state });

      const anglePatternTable = formatAnglePatternsForEvaluator(
        task.parsed.angle,
        task.parsed.product,
        getAnglePatternsFor(task.parsed.angle, task.parsed.product),
      );

      const evalPrompt = buildConceptEvaluatorPrompt(
        conceptsRaw,
        task.parsed.name,
        task.parsed.angle,
        task.parsed.product,
        task.parsed.medium,
        task.duration,
        strategyBrief,
        usedFrameworks,
        inspirationCtx,
        pinned?.framework ?? null,
        pinned?.hookStyle ?? null,
        anglePatternTable,
        task.scriptParamsBase.awarenessLevel,
      );

      const evalResponse = await sendMessageWithRetry(
        evalPrompt.system + directionBlock,
        evalPrompt.user,
        apiKey,
        9000,
        OPUS,
        signal,
      );

      const options = parseConceptEvaluations(evalResponse, conceptsRaw);
      // Pin framework override — force every option's recommendedFramework to the pin's
      // framework so the downstream script phase locks to it regardless of which option
      // the user picks.
      if (pinned?.framework) {
        for (const opt of options) {
          opt.recommendedFramework = pinned.framework;
        }
      }
      ts.conceptOptions = options;

      // Track top framework for diversity (skip pinned tasks — they're locked, not free)
      if (options.length > 0 && !pinned?.framework) {
        const sorted = [...options].sort((a, b) => b.strengthRating - a.strengthRating);
        usedFrameworks.push(sorted[0].recommendedFramework);
      }

      ts.step = 'awaiting-concept-approval';
      onProgress({ ...state });

      if (i < state.tasks.length - 1) {
        await delay(INTER_CALL_DELAY);
      }
    } catch (err) {
      if (signal.aborted) throw new Error('Pipeline cancelled');
      ts.step = 'error';
      ts.error = err instanceof Error ? err.message : String(err);
      onProgress({ ...state });
    }
  }

  // ── Auto-retry any failed tasks once (after a cooldown) ─────────────────
  const failedIndices = state.tasks
    .map((ts, i) => (ts.step === 'error' ? i : -1))
    .filter((i) => i >= 0);

  if (failedIndices.length > 0 && !signal.aborted) {
    console.log(`Auto-retrying ${failedIndices.length} failed task(s) after 15s cooldown...`);
    await delay(30_000);

    for (const i of failedIndices) {
      if (signal.aborted) throw new Error('Pipeline cancelled');

      state.currentTaskIndex = i;
      const ts = state.tasks[i];
      const { task } = ts;

      try {
        ts.step = 'generating-concepts';
        ts.error = undefined;
        onProgress({ ...state });

        const pinned = await loadPinnedInspirationForTask(task.parsed.name, direction.pinnedInspirations);
        const deep = pinned ? null : await loadDeepInspirationForTask(task);
        ts.inspirationIdsUsed = mergeInspirationIds(
          ts.inspirationIdsUsed,
          collectInspirationIds(pinned, deep),
        );
        const inspirationCtx = pinned
          ? pinned.richContext
          : (deep && deep.hasContent ? deep.richContext : '');
        const anglesPrompt = buildAnglesPrompt(task.anglesParams, analysis, memoryBriefing, inspirationCtx);
        const customDirectives = getAngleDirectives()
          .filter((d) => d.angle.toLowerCase() === task.parsed.angle.toLowerCase() ||
                         d.product.toLowerCase() === task.product.toLowerCase())
          .map((d) => `**Custom Directive (${d.angle} / ${d.product}):** ${d.directive}`)
          .join('\n');

        const angleDirective = `\n\n## ⚠️ PRIMARY CREATIVE DIRECTIVE — TALKING POINT: "${task.parsed.angle}"
${customDirectives ? `\n### CUSTOM DIRECTIVES FROM PREVIOUS FEEDBACK:\n${customDirectives}\n` : ''}
**THIS OVERRIDES ALL OTHER INSPIRATION.** The manifesto examples, winning ad bank, and emotional patterns are BACKGROUND CONTEXT — they do NOT set the topic. The topic is "${task.parsed.angle}" and ONLY "${task.parsed.angle}".

Every concept must be unmistakably about "${task.parsed.angle}". If a concept could work with a different talking point swapped in, it is too generic — rewrite it.

${getAngleLanguageBank(task.parsed.angle)}

**FORMAT: ${task.parsed.medium} (${task.duration}${task.duration === '1-15 sec' ? ', final cut ≤ 15s' : task.duration === '16-59 sec' ? ', final cut ≤ 59s' : ', final cut ≤ 90s'})**
${task.duration === '1-15 sec' ? 'This is a SHORT FORM ad (≤15s). Do NOT write a compressed long-form story. Word budget: 30-35 words, hard ceiling 37.' : task.duration === '16-59 sec' ? 'This is a MID FORM ad (≤59s). VO required. Word budget: 115-135 words, hard ceiling 145.' : 'This is an EXPANDED ad (≤90s). VO required. Word budget: 190-215 words, hard ceiling 225.'}`;

        const conceptSystem = anglesPrompt.system + resourceCtx + directionBlock + angleDirective;

        let conceptsRaw: string;
        if (pinned && pinned.frames.length > 0) {
          const visionContent = buildPinnedVisionContent(pinned, anglesPrompt.user);
          conceptsRaw = await sendVisionMessageWithRetry(
            conceptSystem,
            visionContent,
            apiKey,
            24000,
            OPUS,
            signal,
          );
        } else if (deep && deep.primaryFrames.length > 0) {
          const visionContent = buildDeepInspirationVisionContent(deep, anglesPrompt.user);
          conceptsRaw = await sendVisionMessageWithRetry(
            conceptSystem,
            visionContent,
            apiKey,
            24000,
            OPUS,
            signal,
          );
        } else {
          conceptsRaw = await sendMessageWithRetry(
            conceptSystem,
            anglesPrompt.user,
            apiKey,
            22000,
            OPUS,
            signal,
          );
        }
        ts.conceptsRaw = conceptsRaw;
        onProgress({ ...state });

        await delay(INTER_CALL_DELAY);

        ts.step = 'selecting-concept';
        onProgress({ ...state });

        const anglePatternTableRetry = formatAnglePatternsForEvaluator(
          task.parsed.angle,
          task.parsed.product,
          getAnglePatternsFor(task.parsed.angle, task.parsed.product),
        );

        const evalPrompt = buildConceptEvaluatorPrompt(
          conceptsRaw,
          task.parsed.name,
          task.parsed.angle,
          task.parsed.product,
          task.parsed.medium,
          task.duration,
          strategyBrief,
          usedFrameworks,
          inspirationCtx,
          pinned?.framework ?? null,
          pinned?.hookStyle ?? null,
          anglePatternTableRetry,
          task.scriptParamsBase.awarenessLevel,
        );

        const evalResponse = await sendMessageWithRetry(
          evalPrompt.system + directionBlock,
          evalPrompt.user,
          apiKey,
          9000,
          OPUS,
          signal,
        );

        const options = parseConceptEvaluations(evalResponse, conceptsRaw);
        if (pinned?.framework) {
          for (const opt of options) {
            opt.recommendedFramework = pinned.framework;
          }
        }
        ts.conceptOptions = options;
        if (options.length > 0 && !pinned?.framework) {
          const sorted = [...options].sort((a, b) => b.strengthRating - a.strengthRating);
          usedFrameworks.push(sorted[0].recommendedFramework);
        }

        ts.step = 'awaiting-concept-approval';
        onProgress({ ...state });
        await delay(INTER_CALL_DELAY);
      } catch (err) {
        if (signal.aborted) throw new Error('Pipeline cancelled');
        ts.step = 'error';
        ts.error = err instanceof Error ? err.message : String(err);
        onProgress({ ...state });
      }
    }
  }

  state.phase = 'concept-review';
  onProgress({ ...state });
  return state;
}

// ─── Phase 2: Generate Scripts from Approved Concepts ───────────────────────

export async function runScriptPhase(
  currentState: AutopilotState,
  selections: Array<{ taskIndex: number; conceptIndex: number }>,
  analysis: FullAnalysis,
  apiKey: string,
  resourceContext: string,
  direction: CreativeDirection,
  strategyBrief: string | undefined,
  memoryBriefing: string | undefined,
  onProgress: (state: AutopilotState) => void,
  signal: AbortSignal,
): Promise<AutopilotState> {
  const resourceCtx = buildResourceContext(resourceContext);
  const directionBlock = buildDirectionBlock(direction, strategyBrief);

  const state = { ...currentState, tasks: currentState.tasks.map((t) => ({ ...t })) };
  state.phase = 'running';
  onProgress({ ...state });

  // Apply user selections
  for (const sel of selections) {
    const ts = state.tasks[sel.taskIndex];
    if (!ts || !ts.conceptOptions) continue;

    const chosen = ts.conceptOptions.find((c) => c.index === sel.conceptIndex);
    if (!chosen) continue;

    ts.selectedConceptIndex = chosen.index;
    ts.selectedConceptText = chosen.fullText;
    ts.selectionReasoning = chosen.reasoning;
    ts.recommendedFramework = chosen.recommendedFramework;
  }

  // Generate scripts
  for (let i = 0; i < state.tasks.length; i++) {
    if (signal.aborted) throw new Error('Pipeline cancelled');

    state.currentTaskIndex = i;
    const ts = state.tasks[i];

    // Skip tasks that aren't ready
    if (!ts.selectedConceptText || ts.step === 'error') continue;

    try {
      ts.step = 'generating-script';
      onProgress({ ...state });

      // Load the pin FIRST so its framework can override the evaluator's recommendation.
      // This guarantees the script body, persuasion arc, and "How X Was Applied" section
      // all use the pin's framework — not whatever the text-only evaluator picked.
      const pinned = await loadPinnedInspirationForTask(ts.task.parsed.name, direction.pinnedInspirations);
      // For unpinned tasks, fall back to a deep load of the bank so the script
      // generator gets the same depth (top pick frames + rich text + reference scripts).
      const deep = pinned ? null : await loadDeepInspirationForTask(ts.task);
      ts.inspirationIdsUsed = mergeInspirationIds(
        ts.inspirationIdsUsed,
        collectInspirationIds(pinned, deep),
      );
      const lockedFramework = pinned?.framework
        ? pinned.framework
        : matchFramework(ts.recommendedFramework || 'PAS');
      // Reflect the override on the task state so the UI / batch reviewer see the truth.
      if (pinned?.framework) {
        ts.recommendedFramework = pinned.framework;
      }

      const scriptParams: ScriptParams = {
        ...ts.task.scriptParamsBase,
        framework: lockedFramework,
        conceptAngleContext: ts.selectedConceptText,
      };

      const scriptInspirationCtx = pinned
        ? pinned.richContext
        : (deep && deep.hasContent ? deep.richContext : '');
      // Autopilot always renders the brief in the unified Ecom template
      // (except AGC and Static, which keep their own output shapes — the
      // buildScriptPrompt flag is auto-ignored for those). This lets Full
      // AI, UGC, Founder Style, etc. all ship in the same navy/gray Ecom
      // brief template the user delivers to editors, while still being
      // generated with ad-type-specific creative content.
      const scriptPrompt = buildScriptPrompt(scriptParams, analysis, memoryBriefing, scriptInspirationCtx, true);

      // Inject angle-specific and format-specific directives into script generation
      const scriptAngleDirective = `\n\n## ANGLE ENFORCEMENT: "${ts.task.parsed.angle}"
This script MUST be specifically about "${ts.task.parsed.angle}". The word "${ts.task.parsed.angle}" (or its direct synonym) must appear in the script. The viewer must understand this ad is about "${ts.task.parsed.angle}" — not generic comfort or generic socks.

${getAngleLanguageBank(ts.task.parsed.angle)}

${ts.task.duration === '1-15 sec' ? `## SHORT FORM CREATIVE PRINCIPLES (≤15 seconds)
This is NOT a compressed long-form ad. Short form is its own creative discipline:
- DO NOT try to tell a full story with problem → agitate → solution → proof → CTA. That's 30-60s thinking forced into 15s.
- Instead, pick ONE of these short-form approaches:
  1. **POV Moment** — First-person camera, no dialogue, just the experience (putting on socks, looking at legs, the relief moment)
  2. **Direct Address** — Talent looks at camera, says ONE powerful line + shows the product. No story setup.
  3. **Visual Before/After** — Split screen or quick cut: the problem vs. the solution. Zero narration needed.
  4. **VO over B-roll** — 2-3 seconds of footage with one punchy voiceover line. Let the visual do the work.
  5. **Text-on-screen** — No VO at all. Bold text over footage. Think TikTok caption style.
  6. **Reaction Format** — Show someone reacting to the product/result. Authentic surprise > scripted lines.
  7. **Single Stat** — One powerful number (107,347 reviews, 65% repeat buyers) + product shot. That's the ad.

The script table should have 3-5 rows MAX. Not 6-8 rows squeezed into 15 seconds.
Word budget: 30-35 words, hard ceiling 37 words. Every second matters. If a word doesn't earn its place, cut it.` : ts.task.duration === '16-59 sec' ? `## MID FORM CREATIVE PRINCIPLES (16-59 seconds)
This is a mid-form ad built around a VO arc that lands inside 59 seconds:
- VO IS MANDATORY — no silent scripts at this length
- 6-7 narrative beats in a tight hook → escalation → proof → close arc
- Storyboard rows: 8-14. Every row earns its place.
- Word budget: 115-135 words, hard ceiling 145 words (calibrated for 150 WPM)
- The final cut MUST be ≤ 59 seconds — pick frameworks that fit (PAS, Myth Buster, Observation Arc, Contrast/Split, Confession Arc)
- Avoid sprawling 8-stage documentaries — those belong in 60-90 sec briefs
- If you're tempted to write a 10th beat, you're overshooting. Tighten the arc.` : `## EXPANDED CREATIVE PRINCIPLES (60-90 seconds)
This is the long-form slot — full documentary/narrative arc possible:
- VO IS MANDATORY — no silent scripts at this length
- Full 8-stage arc: setup → tension → escalation → turn → proof → resolution → CTA
- Storyboard rows: 16-22. Pacing matters — every 15-second block must earn continued attention.
- Word budget: 190-215 words, hard ceiling 225 words (calibrated for 150 WPM)
- The final cut MUST be ≤ 90 seconds — this is the ceiling, not a suggestion
- Frameworks that work here: Documentary, Narrative Arc, Confession Arc, Observation Arc, Contrast/Split, PAS extended
- Avoid filler — the extra runtime is earned by depth, not padding.`}\n`;

      const scriptSystem = scriptPrompt.system + resourceCtx + directionBlock + scriptAngleDirective;
      const scriptTokens = getMaxTokensForDuration(ts.task.duration);

      let scriptResult: string;
      if (pinned && pinned.frames.length > 0) {
        const visionContent = buildPinnedVisionContent(pinned, scriptPrompt.user);
        scriptResult = await sendVisionMessageWithRetry(
          scriptSystem,
          visionContent,
          apiKey,
          scriptTokens,
          OPUS,
          signal,
        );
      } else if (deep && deep.primaryFrames.length > 0) {
        const visionContent = buildDeepInspirationVisionContent(deep, scriptPrompt.user);
        scriptResult = await sendVisionMessageWithRetry(
          scriptSystem,
          visionContent,
          apiKey,
          scriptTokens,
          OPUS,
          signal,
        );
      } else {
        scriptResult = await sendMessageWithRetry(
          scriptSystem,
          scriptPrompt.user,
          apiKey,
          scriptTokens,
          OPUS,
          signal,
        );
      }

      validateScriptResult(scriptResult);
      ts.scriptResult = scriptResult;
      ts.step = 'complete';
      onProgress({ ...state });

      if (i < state.tasks.length - 1) {
        await delay(INTER_CALL_DELAY);
      }
    } catch (err) {
      if (signal.aborted) throw new Error('Pipeline cancelled');
      ts.step = 'error';
      ts.error = err instanceof Error ? err.message : String(err);
      onProgress({ ...state });
    }
  }

  // ── Auto-retry failed script tasks once ─────────────────────────────────
  const failedScriptIndices = state.tasks
    .map((ts, i) => (ts.step === 'error' && ts.selectedConceptText ? i : -1))
    .filter((i) => i >= 0);

  if (failedScriptIndices.length > 0 && !signal.aborted) {
    console.log(`Auto-retrying ${failedScriptIndices.length} failed script task(s) after 15s cooldown...`);
    await delay(30_000);

    for (const i of failedScriptIndices) {
      if (signal.aborted) throw new Error('Pipeline cancelled');

      state.currentTaskIndex = i;
      const ts = state.tasks[i];

      try {
        ts.step = 'generating-script';
        ts.error = undefined;
        onProgress({ ...state });

        const pinned = await loadPinnedInspirationForTask(ts.task.parsed.name, direction.pinnedInspirations);
        const deep = pinned ? null : await loadDeepInspirationForTask(ts.task);
        ts.inspirationIdsUsed = mergeInspirationIds(
          ts.inspirationIdsUsed,
          collectInspirationIds(pinned, deep),
        );
        const lockedFramework = pinned?.framework
          ? pinned.framework
          : matchFramework(ts.recommendedFramework || 'PAS');
        if (pinned?.framework) {
          ts.recommendedFramework = pinned.framework;
        }

        const scriptParams: ScriptParams = {
          ...ts.task.scriptParamsBase,
          framework: lockedFramework,
          conceptAngleContext: ts.selectedConceptText!,
        };

        const retryScriptInspirationCtx = pinned
          ? pinned.richContext
          : (deep && deep.hasContent ? deep.richContext : '');
        // forceEcomTemplate=true — same unified-template rationale as the
        // primary script call above. Retries must use the same template.
        const scriptPrompt = buildScriptPrompt(scriptParams, analysis, memoryBriefing, retryScriptInspirationCtx, true);
        const scriptAngleDirective = `\n\n## ANGLE ENFORCEMENT: "${ts.task.parsed.angle}"
This script MUST be specifically about "${ts.task.parsed.angle}".\n\n${getAngleLanguageBank(ts.task.parsed.angle)}\n`;

        const retryScriptSystem = scriptPrompt.system + resourceCtx + directionBlock + scriptAngleDirective;
        const retryScriptTokens = getMaxTokensForDuration(ts.task.duration);

        let scriptResult: string;
        if (pinned && pinned.frames.length > 0) {
          const visionContent = buildPinnedVisionContent(pinned, scriptPrompt.user);
          scriptResult = await sendVisionMessageWithRetry(
            retryScriptSystem,
            visionContent,
            apiKey,
            retryScriptTokens,
            OPUS,
            signal,
          );
        } else if (deep && deep.primaryFrames.length > 0) {
          const visionContent = buildDeepInspirationVisionContent(deep, scriptPrompt.user);
          scriptResult = await sendVisionMessageWithRetry(
            retryScriptSystem,
            visionContent,
            apiKey,
            retryScriptTokens,
            OPUS,
            signal,
          );
        } else {
          scriptResult = await sendMessageWithRetry(
            retryScriptSystem,
            scriptPrompt.user,
            apiKey,
            retryScriptTokens,
            OPUS,
            signal,
          );
        }

        validateScriptResult(scriptResult);
        ts.scriptResult = scriptResult;
        ts.step = 'complete';
        onProgress({ ...state });
        await delay(INTER_CALL_DELAY);
      } catch (err) {
        if (signal.aborted) throw new Error('Pipeline cancelled');
        ts.step = 'error';
        ts.error = err instanceof Error ? err.message : String(err);
        onProgress({ ...state });
      }
    }
  }

  // ── Batch Review ────────────────────────────────────────────────────────

  const completedTasks = state.tasks.filter((t) => t.step === 'complete' && t.scriptResult);

  if (completedTasks.length > 0) {
    state.phase = 'reviewing';
    onProgress({ ...state });

    try {
      const pastFailures = getReviewerFailurePatterns();
      const calibrationBlock = formatCalibrationForReviewer(getScoreCalibration());
      const reviewPrompt = buildBatchReviewerPrompt(
        completedTasks.map((t) => ({
          taskName: t.task.parsed.name,
          angle: t.task.parsed.angle,
          product: t.task.parsed.product,
          medium: t.task.parsed.medium,
          framework: t.recommendedFramework ?? 'PAS',
          briefContent: t.scriptResult!,
          awarenessLevel: t.task.scriptParamsBase.awarenessLevel,
        })),
        analysis,
        direction.instructions,
        memoryBriefing,
        pastFailures.length > 0 ? pastFailures : undefined,
        calibrationBlock,
      );

      state.reviewResult = await sendMessageWithRetry(
        reviewPrompt.system,
        reviewPrompt.user,
        apiKey,
        22000,
        OPUS,
        signal,
      );
    } catch (err) {
      state.reviewResult = `Review failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // ── Save to memory + run post-batch learning loop ───────────────────────
  // saveCompletedBatchToMemory is now async because it walks each used
  // inspiration item to update its derivedScore, then recomputes the
  // angle pattern table, the rolling-bar calibration, and the auto-star
  // pass. We await it so the next batch sees the freshest derived facts.

  try {
    await saveCompletedBatchToMemory(state, direction);
  } catch (err) {
    console.warn('[pipelineEngine] saveCompletedBatchToMemory failed', err);
  }

  // ── Run the angle-directive proposer on the rolling redo log ────────────
  // Sonnet inspects clusters of repeated user revisions and surfaces
  // candidate permanent directives the user can approve. Failures are
  // non-fatal — proposals just don't appear in the next BatchResultsView.
  try {
    await runAngleDirectiveProposer(apiKey, signal);
  } catch (err) {
    console.warn('[pipelineEngine] runAngleDirectiveProposer failed', err);
  }

  state.phase = 'complete';
  onProgress({ ...state });

  return state;
}

// ─── Single-Task Redo ─────────────────────────────────────────────────────────

export async function redoSingleTask(
  taskIndex: number,
  feedback: string,
  currentState: AutopilotState,
  analysis: FullAnalysis,
  apiKey: string,
  resourceContext: string,
  direction: CreativeDirection,
  onProgress: (state: AutopilotState) => void,
  signal: AbortSignal,
): Promise<AutopilotState> {
  const state = { ...currentState, tasks: currentState.tasks.map((t) => ({ ...t })) };
  const ts = state.tasks[taskIndex];
  if (!ts) return state;

  const { task } = ts;
  const resourceCtx = buildResourceContext(resourceContext);
  const memory = loadMemory();

  // Capture this redo as a learning signal — the angle-directive proposer will
  // analyze recurring patterns in redo instructions to propose permanent
  // directives the next time the user kicks off a batch.
  if (feedback && feedback.trim()) {
    try {
      addRedoEvent({
        date: new Date().toISOString(),
        batchId: task.parsed.name,
        taskName: task.parsed.name,
        angle: task.parsed.angle,
        product: task.parsed.product,
        scope: 'script',
        instructions: feedback.trim(),
      });
    } catch { /* non-fatal */ }
  }

  const feedbackDirective = `## REDO FEEDBACK — THIS IS THE #1 PRIORITY FOR THIS BRIEF

The creative director reviewed the previous version of this brief (${task.parsed.name}) and provided the following specific feedback. This feedback MUST be the primary driver of all decisions.

<redo_feedback>
${feedback}
</redo_feedback>

Previous brief that needs to be redone (for reference — DO NOT copy this):
<previous_brief>
${ts.scriptResult || '[no previous brief]'}
</previous_brief>

## ROOT CAUSE DIAGNOSIS (MANDATORY — PRODUCE BEFORE THE NEW BRIEF)

Before regenerating, you MUST analyze the previous brief against the feedback and diagnose the ROOT CAUSE of each issue. Output a concise diagnosis ABOVE the new brief:

### ROOT CAUSE ANALYSIS
For each problem identified in the feedback:
1. **What failed:** Name the specific failure pattern (e.g., "talking point drift," "wrong awareness treatment," "generic manifesto contamination," "framework structure violation," "hook archetype convergence," "product line confusion," "word count overrun," "visual pacing monotony")
2. **Why it failed:** The structural reason — did the model default to manifesto examples instead of the assigned talking point? Did it front-load the product in an Unaware brief? Did it use post-education reviewer language in the hook? Did it exceed the word ceiling because beats weren't planned?
3. **Corrective action:** The specific decision that will be DIFFERENT in the new brief — name the beat, the line, or the structural change

This diagnosis ensures the regeneration targets the actual failure instead of blindly retrying with the same structural approach. The new brief MUST demonstrate that each diagnosed issue has been corrected — if the diagnosis says "talking point only appeared in 1 beat," the new brief must thread it through at least 3 beats.

After the diagnosis, proceed to generate the complete new brief.`;

  const fullDirection: CreativeDirection = {
    ...direction,
    instructions: feedbackDirective + (direction.instructions ? '\n\n' + direction.instructions : ''),
  };

  const strategyBrief = currentState.strategySession?.strategyBrief;
  const directionBlock = buildDirectionBlock(fullDirection, strategyBrief);

  let memoryBriefing = currentState.memoryBriefing || '';
  if (!memoryBriefing && memory.batches.length > 0) {
    try {
      // Load inspiration items for curator intelligence
      const allInsp = await getAllInspirationItems();
      const inspForCurator = allInsp
        .filter((i) => i.status === 'ready')
        .map((i) => {
          const tags = getEffectiveTags(i);
          return {
            id: i.id, title: i.title, starred: i.starred,
            adType: String(tags.adType ?? 'unknown'),
            angleType: String(tags.angleType ?? 'unknown'),
            duration: String(tags.duration ?? 'unknown'),
            derivedScore: i.derivedScore ?? null,
            sampleSize: i.derivedScoreSampleSize ?? 0,
            contextualScores: i.contextualScores,
          };
        });
      const briefing = await runMemoryCurator(apiKey, signal, inspForCurator);
      if (briefing) memoryBriefing = briefing.briefingText;
    } catch { /* non-fatal */ }
    await delay(INTER_CALL_DELAY);
  }

  const usedFrameworks = state.tasks
    .filter((_, i) => i !== taskIndex && _.recommendedFramework)
    .map((t) => t.recommendedFramework!)
    .map(matchFramework);

  try {
    ts.step = 'generating-concepts';
    ts.error = undefined;
    onProgress({ ...state });

    const pinned = await loadPinnedInspirationForTask(task.parsed.name, direction.pinnedInspirations);
    const deep = pinned ? null : await loadDeepInspirationForTask(task);
    ts.inspirationIdsUsed = mergeInspirationIds(
      ts.inspirationIdsUsed,
      collectInspirationIds(pinned, deep),
    );
    const regenInspirationCtx = pinned
      ? pinned.richContext
      : (deep && deep.hasContent ? deep.richContext : '');
    const anglesPrompt = buildAnglesPrompt(task.anglesParams, analysis, memoryBriefing || undefined, regenInspirationCtx);
    const regenAngleCtx = `\n\n## ⚠️ PRIMARY CREATIVE DIRECTIVE — TALKING POINT: "${task.parsed.angle}"

**THIS OVERRIDES ALL OTHER INSPIRATION.** The manifesto examples, winning ad bank, and emotional patterns are BACKGROUND CONTEXT — they do NOT set the topic. The topic is "${task.parsed.angle}" and ONLY "${task.parsed.angle}".

Every concept must be unmistakably about "${task.parsed.angle}". If a concept could work with a different talking point swapped in, it is too generic — rewrite it.

${getAngleLanguageBank(task.parsed.angle)}\n`;

    const regenConceptSystem = anglesPrompt.system + resourceCtx + directionBlock + regenAngleCtx;
    let conceptsRaw: string;
    if (pinned && pinned.frames.length > 0) {
      const visionContent = buildPinnedVisionContent(pinned, anglesPrompt.user);
      conceptsRaw = await sendVisionMessageWithRetry(
        regenConceptSystem,
        visionContent,
        apiKey,
        24000,
        OPUS,
        signal,
      );
    } else if (deep && deep.primaryFrames.length > 0) {
      const visionContent = buildDeepInspirationVisionContent(deep, anglesPrompt.user);
      conceptsRaw = await sendVisionMessageWithRetry(
        regenConceptSystem,
        visionContent,
        apiKey,
        24000,
        OPUS,
        signal,
      );
    } else {
      conceptsRaw = await sendMessageWithRetry(
        regenConceptSystem,
        anglesPrompt.user,
        apiKey,
        22000,
        OPUS,
        signal,
      );
    }
    ts.conceptsRaw = conceptsRaw;
    onProgress({ ...state });

    await delay(INTER_CALL_DELAY);

    ts.step = 'selecting-concept';
    onProgress({ ...state });

    const angleHistoryRecords = getHistoryForAngle(task.parsed.angle);
    const angleHistoryText = angleHistoryRecords.length > 0
      ? formatAngleHistoryForSelector(
          task.parsed.angle,
          angleHistoryRecords.map((r) => ({
            framework: r.framework,
            hookStyles: r.hookStyles,
            conceptSummary: r.conceptSummary,
            reviewScore: r.reviewScore,
            date: r.batchId.split('T')[0],
          })),
        )
      : undefined;

    const selectorPrompt = buildConceptSelectorPrompt(
      conceptsRaw,
      task.parsed.name,
      task.parsed.angle,
      task.parsed.product,
      task.product,
      task.parsed.medium,
      task.duration,
      analysis,
      usedFrameworks,
      memoryBriefing || undefined,
      angleHistoryText,
      task.scriptParamsBase.adType,
      task.scriptParamsBase.fullAiSpecification,
      task.scriptParamsBase.fullAiVisualStyle,
      regenInspirationCtx,
      task.scriptParamsBase.awarenessLevel,
      task.scriptParamsBase.funnelStage,
    );

    const selectorResponse = await sendMessageWithRetry(
      selectorPrompt.system + directionBlock,
      selectorPrompt.user,
      apiKey,
      9000,
      OPUS,
      signal,
    );

    const selection = parseSelectorResponse(selectorResponse);
    ts.selectedConceptIndex = selection.selectedIndex;
    ts.selectionReasoning = selection.reasoning;
    // Pin framework lock — overrides the selector's pick when present.
    const lockedFramework = pinned?.framework
      ? pinned.framework
      : matchFramework(selection.framework);
    ts.recommendedFramework = pinned?.framework ? pinned.framework : selection.framework;

    const conceptBlocks = parseConceptBlocks(conceptsRaw);
    const blockIndex = Math.max(0, Math.min(selection.selectedIndex - 1, conceptBlocks.length - 1));
    ts.selectedConceptText = conceptBlocks[blockIndex] ?? conceptsRaw;

    onProgress({ ...state });
    await delay(INTER_CALL_DELAY);

    ts.step = 'generating-script';
    onProgress({ ...state });

    const scriptParams: ScriptParams = {
      ...task.scriptParamsBase,
      framework: lockedFramework,
      conceptAngleContext: ts.selectedConceptText,
    };

    // forceEcomTemplate=true — regen (redo) path also ships the unified
    // Ecom template so every task in the autopilot batch delivers
    // consistently (only AGC and Static keep their own formats).
    const scriptPrompt = buildScriptPrompt(scriptParams, analysis, memoryBriefing || undefined, regenInspirationCtx, true);
    const regenScriptAngleCtx = `\n\n## ANGLE ENFORCEMENT: "${task.parsed.angle}"\nThis script MUST be specifically about "${task.parsed.angle}".\n\n${getAngleLanguageBank(task.parsed.angle)}\n`;

    const regenScriptSystem = scriptPrompt.system + resourceCtx + directionBlock + regenScriptAngleCtx;
    const regenScriptTokens = getMaxTokensForDuration(task.duration);

    let scriptResult: string;
    if (pinned && pinned.frames.length > 0) {
      const visionContent = buildPinnedVisionContent(pinned, scriptPrompt.user);
      scriptResult = await sendVisionMessageWithRetry(
        regenScriptSystem,
        visionContent,
        apiKey,
        regenScriptTokens,
        OPUS,
        signal,
      );
    } else if (deep && deep.primaryFrames.length > 0) {
      const visionContent = buildDeepInspirationVisionContent(deep, scriptPrompt.user);
      scriptResult = await sendVisionMessageWithRetry(
        regenScriptSystem,
        visionContent,
        apiKey,
        regenScriptTokens,
        OPUS,
        signal,
      );
    } else {
      scriptResult = await sendMessageWithRetry(
        regenScriptSystem,
        scriptPrompt.user,
        apiKey,
        regenScriptTokens,
        OPUS,
        signal,
      );
    }

    validateScriptResult(scriptResult);
    ts.scriptResult = scriptResult;
    ts.step = 'complete';
    onProgress({ ...state });
  } catch (err) {
    if (signal.aborted) throw new Error('Redo cancelled');
    ts.step = 'error';
    ts.error = err instanceof Error ? err.message : String(err);
    onProgress({ ...state });
  }

  return state;
}
