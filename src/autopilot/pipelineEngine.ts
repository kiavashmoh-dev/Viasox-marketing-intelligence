/**
 * Autopilot Pipeline Engine — FULL EXPERT VERSION
 *
 * Orchestrates the complete brief generation pipeline with maximum depth:
 *
 * 0. Reference Analysis (if media provided) — Vision analysis of style references
 * For each task:
 *   1. Generate Concepts — Full angles prompt with Opus
 *   2. Select Best Concept — Expert selector with complete knowledge stack, Opus
 *   3. Generate Brief — Full script prompt with Opus
 * After all tasks:
 *   4. Batch Review — Expert reviewer with complete knowledge stack, Opus
 *
 * All creative agents use claude-opus-4-6.
 * Framework diversity is enforced across the batch.
 * Reference media is analyzed via vision and injected into all subsequent steps.
 */

import { sendMessage, sendVisionMessage } from '../api/claude';
import type { ContentBlock } from '../api/claude';
import { buildAnglesPrompt } from '../prompts/anglesPrompt';
import { buildScriptPrompt } from '../prompts/scriptPrompt';
import { buildResourceContext } from '../prompts/systemBase';
import { buildConceptSelectorPrompt, parseSelectorResponse } from '../prompts/conceptSelectorPrompt';
import { buildBatchReviewerPrompt } from '../prompts/batchReviewerPrompt';
import { parseConceptBlocks } from '../utils/conceptParser';
import type { FullAnalysis, ScriptParams, ScriptFramework } from '../engine/types';
import type { AutopilotTask, AutopilotState, CreativeDirection } from '../engine/autopilotTypes';

// ─── All creative agents use Opus ────────────────────────────────────────────

const OPUS = 'claude-opus-4-6';
const INTER_CALL_DELAY = 2500; // 2.5s between API calls

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
  // Try multi-word matching
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

function getMaxTokensForDuration(duration: string): number {
  switch (duration) {
    case '15s': return 8000;
    case '30s': return 12000;
    case '60s': return 16000;
    default: return 12000;
  }
}

// ─── Creative Direction Block ────────────────────────────────────────────────

function buildDirectionBlock(direction: CreativeDirection, referenceAnalysis: string): string {
  const parts: string[] = [];

  if (direction.instructions.trim()) {
    parts.push(`## CREATIVE DIRECTOR'S INSTRUCTIONS — HIGHEST PRIORITY

The following instructions come directly from the creative director for this batch. These are NON-NEGOTIABLE directives that override default behavior. Every creative decision — concept generation, concept selection, angle framing, script writing, hook style, tone, visual approach, framework choice — must align with these instructions.

<creative_direction>
${direction.instructions}
</creative_direction>`);
  }

  if (referenceAnalysis) {
    parts.push(`## STYLE REFERENCE ANALYSIS — MATCH THIS STYLE

The creative director provided reference ads that were analyzed in detail. Here is the complete analysis:

<reference_analysis>
${referenceAnalysis}
</reference_analysis>

**CRITICAL:** Your concepts and scripts must match the style, energy, pacing, narrative structure, and visual approach identified in these references. The references define the creative template — your job is to fill that template with Viasox-specific content for each task's angle and product.`);
  }

  return parts.length > 0 ? '\n\n' + parts.join('\n\n') : '';
}

// ─── Reference Media Analysis ────────────────────────────────────────────────

const REFERENCE_ANALYSIS_SYSTEM = `You are a senior creative strategist analyzing reference advertisements for a DTC compression sock brand called Viasox. You are an expert in direct response video advertising, performance marketing, and creative strategy.

Your job is to deeply analyze the provided reference ad(s) — images, video screenshots, or storyboard frames — and extract every insight that will help create new ads in the same style.

Be EXTREMELY detailed and specific. This analysis will be used by other AI agents to generate concepts and scripts, so they need granular, actionable detail — not vague descriptions.`;

const REFERENCE_ANALYSIS_PROMPT = `Analyze these reference ad(s) in extreme detail. For each reference, extract:

## 1. VISUAL STYLE
- Color palette and grading (warm/cool, saturated/muted, specific tones)
- Framing and composition (close-ups, wide shots, rule of thirds, centered)
- Text overlay style (font weight, position, animation style, color, size relative to frame)
- Lighting (natural, studio, warm ambient, clinical)
- Overall aesthetic (raw/polished, UGC-feel/produced, minimal/busy)

## 2. STORYTELLING & NARRATIVE
- How does the ad open? What's the first thing you see/read?
- What's the narrative arc? (Problem→Solution? Day-in-life? Testimonial? Demonstration?)
- When does the product first appear? (early/midpoint/late)
- How is the product shown? (in-use, close-up, lifestyle, before/after)
- What's the emotional journey? (anxiety→relief? curiosity→discovery? pain→joy?)

## 3. SCRIPT & COPY APPROACH
- What script framework does this appear to use? (PAS, AIDA, Before-After-Bridge, etc.)
- Is the tone conversational, authoritative, confessional, educational?
- Point of view: First person? Second person ("you")? Third person narrative?
- Hook style: Question? Bold statement? Shocking stat? Relatable moment?
- CTA style: Soft discovery? Direct action? Social proof nudge?

## 4. PACING & RHYTHM
- Is the pacing fast-cut or slow/deliberate?
- How long do text cards stay on screen?
- Is there a rhythm pattern (fast-fast-slow, building tempo, etc.)?
- Music/sound direction implied by the visual style

## 5. KEY TAKEAWAYS FOR REPLICATION
- What makes this ad effective? (3-5 specific strengths)
- What should be replicated in new ads? (specific techniques)
- What should NOT be copied? (elements specific to the reference brand)

Be specific enough that a copywriter and editor could recreate this style for a different product.`;

async function analyzeReferenceMedia(
  direction: CreativeDirection,
  apiKey: string,
  signal: AbortSignal,
): Promise<string> {
  if (direction.referenceMedia.length === 0) return '';

  const content: ContentBlock[] = [];

  // Add all reference images
  for (const media of direction.referenceMedia) {
    if (media.mediaType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: media.mediaType, data: media.base64 },
      });
    }
  }

  if (content.length === 0) return '';

  // Add the analysis prompt
  content.push({ type: 'text', text: REFERENCE_ANALYSIS_PROMPT });

  const result = await sendVisionMessage(
    REFERENCE_ANALYSIS_SYSTEM,
    content,
    apiKey,
    6000,  // Deep analysis needs space
    OPUS,  // Use Opus for nuanced visual analysis
    signal,
  );

  return result;
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

export async function runAutopilotPipeline(
  tasks: AutopilotTask[],
  analysis: FullAnalysis,
  apiKey: string,
  resourceContext: string,
  direction: CreativeDirection,
  onProgress: (state: AutopilotState) => void,
  signal: AbortSignal,
): Promise<AutopilotState> {
  const resourceCtx = buildResourceContext(resourceContext);

  const state: AutopilotState = {
    phase: 'running',
    tasks: tasks.map((task) => ({
      task,
      step: 'pending',
    })),
    currentTaskIndex: 0,
  };

  onProgress({ ...state });

  // ── Step 0: Analyze Reference Media (if provided) ──────────────────────

  let referenceAnalysis = '';

  if (direction.referenceMedia.length > 0) {
    try {
      referenceAnalysis = await analyzeReferenceMedia(direction, apiKey, signal);
      await delay(INTER_CALL_DELAY);
    } catch (err) {
      // Non-fatal — continue without reference analysis
      referenceAnalysis = `[Reference analysis failed: ${err instanceof Error ? err.message : String(err)}]`;
    }
  }

  const directionBlock = buildDirectionBlock(direction, referenceAnalysis);

  // Track used frameworks for diversity enforcement
  const usedFrameworks: string[] = [];

  // ── Process each task sequentially ──────────────────────────────────────

  for (let i = 0; i < state.tasks.length; i++) {
    if (signal.aborted) throw new Error('Pipeline cancelled');

    state.currentTaskIndex = i;
    const ts = state.tasks[i];
    const { task } = ts;

    try {
      // ── Step 1: Generate Concepts (Opus, full knowledge) ────────────

      ts.step = 'generating-concepts';
      onProgress({ ...state });

      const anglesPrompt = buildAnglesPrompt(task.anglesParams, analysis);
      const conceptsRaw = await sendMessage(
        anglesPrompt.system + resourceCtx + directionBlock,
        anglesPrompt.user,
        apiKey,
        12000,
        OPUS,
        signal,
      );
      ts.conceptsRaw = conceptsRaw;
      onProgress({ ...state });

      await delay(INTER_CALL_DELAY);
      if (signal.aborted) throw new Error('Pipeline cancelled');

      // ── Step 2: Select Best Concept (Opus, full expert knowledge) ───

      ts.step = 'selecting-concept';
      onProgress({ ...state });

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
        referenceAnalysis,
      );

      const selectorResponse = await sendMessage(
        selectorPrompt.system + directionBlock,
        selectorPrompt.user,
        apiKey,
        4000,  // Increased for deep reasoning
        OPUS,
        signal,
      );

      const selection = parseSelectorResponse(selectorResponse);
      ts.selectedConceptIndex = selection.selectedIndex;
      ts.selectionReasoning = selection.reasoning;
      ts.recommendedFramework = selection.framework;

      // Track framework for diversity
      const framework = matchFramework(selection.framework);
      usedFrameworks.push(framework);

      // Extract the selected concept text
      const conceptBlocks = parseConceptBlocks(conceptsRaw);
      const blockIndex = Math.max(0, Math.min(selection.selectedIndex - 1, conceptBlocks.length - 1));
      ts.selectedConceptText = conceptBlocks[blockIndex] ?? conceptsRaw;

      onProgress({ ...state });

      await delay(INTER_CALL_DELAY);
      if (signal.aborted) throw new Error('Pipeline cancelled');

      // ── Step 3: Generate Brief (Opus, full knowledge) ───────────────

      ts.step = 'generating-script';
      onProgress({ ...state });

      const scriptParams: ScriptParams = {
        ...task.scriptParamsBase,
        framework,
        conceptAngleContext: ts.selectedConceptText,
      };

      const scriptPrompt = buildScriptPrompt(scriptParams, analysis);
      const scriptResult = await sendMessage(
        scriptPrompt.system + resourceCtx + directionBlock,
        scriptPrompt.user,
        apiKey,
        getMaxTokensForDuration(task.duration),
        OPUS,
        signal,
      );

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

  // ── Batch Review (Opus, full expert knowledge) ──────────────────────────

  const completedTasks = state.tasks.filter((t) => t.step === 'complete' && t.scriptResult);

  if (completedTasks.length > 0) {
    state.phase = 'reviewing';
    onProgress({ ...state });

    try {
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
        referenceAnalysis,
      );

      state.reviewResult = await sendMessage(
        reviewPrompt.system,
        reviewPrompt.user,
        apiKey,
        12000,  // Increased for thorough per-brief reviews
        OPUS,
        signal,
      );
    } catch (err) {
      state.reviewResult = `Review failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  state.phase = 'complete';
  onProgress({ ...state });

  return state;
}
