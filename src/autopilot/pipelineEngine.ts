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
import { loadMemory, getHistoryForAngle, getReviewerFailurePatterns } from './memoryStore';
import { getAngleLanguageBank } from '../prompts/manifestoReference';
import { getAngleDirectives } from '../utils/customOptionsRegistry';
import { runMemoryCurator, formatAngleHistoryForSelector } from './memoryCurator';
import { saveCompletedBatchToMemory } from './memoryExtractor';
import { getInspirationContextBlock } from '../inspiration/inspirationInjection';
import { getItem as getInspirationItem, getFrames as getInspirationFrames } from '../inspiration/inspirationStore';

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

/**
 * Pull the most relevant Inspiration Bank context block for an autopilot task.
 * Never throws — if the bank is empty, unavailable, or errors, returns empty string.
 */
async function getInspirationForTask(task: AutopilotTask): Promise<string> {
  try {
    const { block } = await getInspirationContextBlock({
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
    return block;
  } catch (e) {
    console.warn('[inspiration] failed to load context for task', e);
    return '';
  }
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
    case '15s': return 16000;
    case '30s': return 20000;
    case '60s': return 24000;
    default: return 20000;
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
}

/**
 * Load a pinned inspiration item (full frames + tags + summary + learnings + script)
 * for the given task. Returns null if no pin, item not found, or item not ready.
 */
async function loadPinnedInspirationForTask(
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
    const tagPills = [
      tags.adType !== 'unknown' ? tags.adType : null,
      tags.angleType !== 'unknown' ? tags.angleType : null,
      tags.framework && tags.framework !== 'unknown' ? tags.framework : null,
      tags.duration !== 'unknown' ? tags.duration : null,
      tags.productCategory && tags.productCategory !== 'unknown' ? tags.productCategory : null,
      tags.hookStyle && tags.hookStyle !== 'unknown' ? tags.hookStyle : null,
      tags.emotionalEntry || null,
      tags.isFullAi ? 'Full AI' : null,
      tags.fullAiSpecification && tags.fullAiSpecification !== 'unknown' ? tags.fullAiSpecification : null,
      tags.fullAiVisualStyle && tags.fullAiVisualStyle !== 'unknown' ? tags.fullAiVisualStyle : null,
      ...(tags.customTags || []),
    ].filter(Boolean).join(' · ');

    const learnings = (item.learnings || []).map((l, i) => `${i + 1}. ${l}`).join('\n');
    const scriptText = item.attachedScriptText || item.textContent || '';

    const richContext = `## PINNED REFERENCE AD — FOLLOW THIS EXAMPLE CLOSELY

The creative director has pinned the following ad from the Inspiration Bank as the primary reference for THIS specific brief. You must study every detail and let it shape this brief's style, structure, hook approach, narrative arc, and visual treatment. This pin OVERRIDES general inspiration matches — when it conflicts with other examples, follow the pin.

**Pin Title:** ${item.title}
**Tags:** ${tagPills || '(none)'}

**Summary (why this ad works):**
${item.summary}

**Key Learnings to Replicate:**
${learnings}

**Style Notes:**
${item.styleNotes}
${item.hookBreakdown ? `\n**Hook Breakdown (first 3 seconds):**\n${item.hookBreakdown}` : ''}
${item.narrativeArc ? `\n**Narrative Arc:**\n${item.narrativeArc}` : ''}
${scriptText ? `\n**Reference Script / Voiceover:**\n${scriptText}` : ''}
${frames.length > 0 ? `\n**Visual Frames:** ${frames.length} frames from the reference ad are attached as images. Study them carefully — they show the actual look, framing, pacing, and visual language to emulate.` : ''}

**HOW TO USE THIS PIN:**
1. The new brief should feel like a sibling of this pin — same DNA, fresh execution
2. Match the hook style and opening approach
3. Match the narrative pacing and structure
4. Match the visual language and tone
5. Apply the listed learnings as creative principles
6. Do NOT copy lines verbatim — adapt the approach to this brief's specific angle and product
7. The pin's product/angle may differ from this brief's — translate the STYLE, not the content`;

    return { item, frames, richContext };
  } catch (e) {
    console.warn('[pinned-inspiration] failed to load', e);
    return null;
  }
}

/**
 * Build vision content blocks from a pinned inspiration's frames + a final text prompt.
 * Strips the `data:image/...;base64,` prefix that frame extractor stores.
 */
function buildPinnedVisionContent(
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

      // Load pinned inspiration if any (overrides general bank matches)
      const pinned = await loadPinnedInspirationForTask(task.parsed.name, direction.pinnedInspirations);
      const inspirationCtx = pinned ? pinned.richContext : await getInspirationForTask(task);
      const anglesPrompt = buildAnglesPrompt(task.anglesParams, analysis, memoryBriefing, inspirationCtx);

      // Inject the SPECIFIC angle from Asana as the primary creative directive.
      // This ensures "Neuropathy" briefs are actually ABOUT neuropathy, not generic.
      // Also check for custom angle directives from the registry.
      const customDirectives = getAngleDirectives()
        .filter((d) => d.angle.toLowerCase() === task.parsed.angle.toLowerCase() ||
                       d.product.toLowerCase() === task.product.toLowerCase())
        .map((d) => `**Custom Directive (${d.angle} / ${d.product}):** ${d.directive}`)
        .join('\n');

      const angleDirective = `\n\n## PRIMARY CREATIVE DIRECTIVE — SPECIFIC ANGLE: "${task.parsed.angle}"
${customDirectives ? `\n### CUSTOM DIRECTIVES FROM PREVIOUS FEEDBACK:\n${customDirectives}\n` : ''}

**CRITICAL:** This brief MUST be specifically, unmistakably about "${task.parsed.angle}". Every concept must:
1. Name "${task.parsed.angle}" explicitly — use the actual word/condition in the script
2. Show scenarios, symptoms, or experiences directly related to "${task.parsed.angle}"
3. Reference real customer quotes and review data specifically about "${task.parsed.angle}"
4. The viewer should understand within the first 3 seconds that this ad is about "${task.parsed.angle}"

If the angle is a medical condition (neuropathy, diabetes, varicose veins, swelling), the concepts must use medically accurate but accessible language about that specific condition. If the angle is a lifestyle (standing all day, travel, gift), the concepts must center on that specific life situation.

DO NOT create generic "comfortable socks" concepts. The angle "${task.parsed.angle}" must be the SOUL of every concept.

${getAngleLanguageBank(task.parsed.angle)}

**FORMAT: ${task.parsed.medium} (${task.duration})**
${task.duration === '15s' ? `This is a SHORT FORM ad. Do NOT write a compressed long-form story. Short form means:
- Experiment with VO and no-VO styles
- Consider POV-only (viewer sees through the character's eyes)
- First person, third person, or talking directly to viewer
- A single powerful moment or image, not a full narrative arc
- Creative visual treatments: split screen, text overlay, rapid cuts, reaction format
- The hook IS the ad — there's no "body." Every second is hook.
- Think TikTok/Reels native, not a TV spot cut short.` : ''}`;

      const conceptSystem = anglesPrompt.system + resourceCtx + directionBlock + angleDirective;

      // When pinned, switch to vision call so the model can see the actual frames
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
      ts.conceptOptions = options;

      // Track top framework for diversity
      if (options.length > 0) {
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
        const inspirationCtx = pinned ? pinned.richContext : await getInspirationForTask(task);
        const anglesPrompt = buildAnglesPrompt(task.anglesParams, analysis, memoryBriefing, inspirationCtx);
        const customDirectives = getAngleDirectives()
          .filter((d) => d.angle.toLowerCase() === task.parsed.angle.toLowerCase() ||
                         d.product.toLowerCase() === task.product.toLowerCase())
          .map((d) => `**Custom Directive (${d.angle} / ${d.product}):** ${d.directive}`)
          .join('\n');

        const angleDirective = `\n\n## PRIMARY CREATIVE DIRECTIVE — SPECIFIC ANGLE: "${task.parsed.angle}"
${customDirectives ? `\n### CUSTOM DIRECTIVES FROM PREVIOUS FEEDBACK:\n${customDirectives}\n` : ''}
**CRITICAL:** This brief MUST be specifically, unmistakably about "${task.parsed.angle}".
**FORMAT: ${task.parsed.medium} (${task.duration})**
${task.duration === '15s' ? 'This is a SHORT FORM ad. Do NOT write a compressed long-form story.' : ''}`;

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
        ts.conceptOptions = options;
        if (options.length > 0) {
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

      const framework = matchFramework(ts.recommendedFramework || 'PAS');
      const scriptParams: ScriptParams = {
        ...ts.task.scriptParamsBase,
        framework,
        conceptAngleContext: ts.selectedConceptText,
      };

      const pinned = await loadPinnedInspirationForTask(ts.task.parsed.name, direction.pinnedInspirations);
      const scriptInspirationCtx = pinned ? pinned.richContext : await getInspirationForTask(ts.task);
      const scriptPrompt = buildScriptPrompt(scriptParams, analysis, memoryBriefing, scriptInspirationCtx);

      // Inject angle-specific and format-specific directives into script generation
      const scriptAngleDirective = `\n\n## ANGLE ENFORCEMENT: "${ts.task.parsed.angle}"
This script MUST be specifically about "${ts.task.parsed.angle}". The word "${ts.task.parsed.angle}" (or its direct synonym) must appear in the script. The viewer must understand this ad is about "${ts.task.parsed.angle}" — not generic comfort or generic socks.

${getAngleLanguageBank(ts.task.parsed.angle)}

${ts.task.duration === '15s' ? `## SHORT FORM CREATIVE PRINCIPLES (<15 seconds)
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

The script table should have 2-4 rows MAX. Not 6-8 rows squeezed into 15 seconds.
Every second matters. If a word doesn't earn its place, cut it.` : ''}\n`;

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

        const framework = matchFramework(ts.recommendedFramework || 'PAS');
        const scriptParams: ScriptParams = {
          ...ts.task.scriptParamsBase,
          framework,
          conceptAngleContext: ts.selectedConceptText!,
        };

        const pinned = await loadPinnedInspirationForTask(ts.task.parsed.name, direction.pinnedInspirations);
        const retryScriptInspirationCtx = pinned ? pinned.richContext : await getInspirationForTask(ts.task);
        const scriptPrompt = buildScriptPrompt(scriptParams, analysis, memoryBriefing, retryScriptInspirationCtx);
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
      const reviewPrompt = buildBatchReviewerPrompt(
        completedTasks.map((t) => ({
          taskName: t.task.parsed.name,
          angle: t.task.parsed.angle,
          product: t.task.parsed.product,
          medium: t.task.parsed.medium,
          framework: t.recommendedFramework ?? 'PAS',
          briefContent: t.scriptResult!,
        })),
        analysis,
        direction.instructions,
        memoryBriefing,
        pastFailures.length > 0 ? pastFailures : undefined,
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

  // ── Save to memory ──────────────────────────────────────────────────────

  try {
    saveCompletedBatchToMemory(state, direction);
  } catch { /* non-fatal */ }

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

  const feedbackDirective = `## REDO FEEDBACK — THIS IS THE #1 PRIORITY FOR THIS BRIEF

The creative director reviewed the previous version of this brief (${task.parsed.name}) and provided the following specific feedback. This feedback MUST be the primary driver of all decisions.

<redo_feedback>
${feedback}
</redo_feedback>

Previous brief that needs to be redone (for reference — DO NOT copy this):
<previous_brief>
${ts.scriptResult || '[no previous brief]'}
</previous_brief>`;

  const fullDirection: CreativeDirection = {
    ...direction,
    instructions: feedbackDirective + (direction.instructions ? '\n\n' + direction.instructions : ''),
  };

  const strategyBrief = currentState.strategySession?.strategyBrief;
  const directionBlock = buildDirectionBlock(fullDirection, strategyBrief);

  let memoryBriefing = currentState.memoryBriefing || '';
  if (!memoryBriefing && memory.batches.length > 0) {
    try {
      const briefing = await runMemoryCurator(apiKey, signal);
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
    const regenInspirationCtx = pinned ? pinned.richContext : await getInspirationForTask(task);
    const anglesPrompt = buildAnglesPrompt(task.anglesParams, analysis, memoryBriefing || undefined, regenInspirationCtx);
    const regenAngleCtx = `\n\n${getAngleLanguageBank(task.parsed.angle)}\n`;

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
    ts.recommendedFramework = selection.framework;

    const framework = matchFramework(selection.framework);
    const conceptBlocks = parseConceptBlocks(conceptsRaw);
    const blockIndex = Math.max(0, Math.min(selection.selectedIndex - 1, conceptBlocks.length - 1));
    ts.selectedConceptText = conceptBlocks[blockIndex] ?? conceptsRaw;

    onProgress({ ...state });
    await delay(INTER_CALL_DELAY);

    ts.step = 'generating-script';
    onProgress({ ...state });

    const scriptParams: ScriptParams = {
      ...task.scriptParamsBase,
      framework,
      conceptAngleContext: ts.selectedConceptText,
    };

    const scriptPrompt = buildScriptPrompt(scriptParams, analysis, memoryBriefing || undefined, regenInspirationCtx);
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
