/**
 * Autopilot Pipeline Engine
 *
 * Orchestrates the full brief generation pipeline:
 * For each task: Generate Concepts → Select Best → Generate Brief
 * Then: Batch Review all briefs
 */

import { sendMessage } from '../api/claude';
import { buildAnglesPrompt } from '../prompts/anglesPrompt';
import { buildScriptPrompt } from '../prompts/scriptPrompt';
import { buildResourceContext } from '../prompts/systemBase';
import { buildConceptSelectorPrompt, parseSelectorResponse } from '../prompts/conceptSelectorPrompt';
import { buildBatchReviewerPrompt } from '../prompts/batchReviewerPrompt';
import { parseConceptBlocks } from '../utils/conceptParser';
import type { FullAnalysis, ScriptParams, ScriptFramework } from '../engine/types';
import type { AutopilotTask, AutopilotState } from '../engine/autopilotTypes';

const INTER_CALL_DELAY = 2000; // 2s between API calls for rate limiting
const CONCEPT_MODEL = 'claude-opus-4-6';
const SCRIPT_MODEL = 'claude-opus-4-6';
const SELECTOR_MODEL = 'claude-sonnet-4-20250514';
const REVIEWER_MODEL = 'claude-sonnet-4-20250514';

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
  // Try exact match first
  const exact = VALID_FRAMEWORKS.find((f) => f === suggestion);
  if (exact) return exact;
  // Try partial match
  const lower = suggestion.toLowerCase();
  const partial = VALID_FRAMEWORKS.find((f) => lower.includes(f.toLowerCase().split(' ')[0]));
  return partial ?? 'PAS (Problem-Agitate-Solution)';
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getMaxTokensForDuration(duration: string): number {
  switch (duration) {
    case '15s': return 7000;
    case '30s': return 10000;
    case '60s': return 14000;
    default: return 10000;
  }
}

/**
 * Run the full autopilot pipeline.
 */
export async function runAutopilotPipeline(
  tasks: AutopilotTask[],
  analysis: FullAnalysis,
  apiKey: string,
  resourceContext: string,
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

  // ── Process each task sequentially ──────────────────────────────────────

  for (let i = 0; i < state.tasks.length; i++) {
    if (signal.aborted) throw new Error('Pipeline cancelled');

    state.currentTaskIndex = i;
    const ts = state.tasks[i];
    const { task } = ts;

    try {
      // ── Step 1: Generate Concepts ─────────────────────────────────────

      ts.step = 'generating-concepts';
      onProgress({ ...state });

      const anglesPrompt = buildAnglesPrompt(task.anglesParams, analysis);
      const conceptsRaw = await sendMessage(
        anglesPrompt.system + resourceCtx,
        anglesPrompt.user,
        apiKey,
        12000,
        CONCEPT_MODEL,
        signal,
      );
      ts.conceptsRaw = conceptsRaw;
      onProgress({ ...state });

      await delay(INTER_CALL_DELAY);
      if (signal.aborted) throw new Error('Pipeline cancelled');

      // ── Step 2: Select Best Concept ───────────────────────────────────

      ts.step = 'selecting-concept';
      onProgress({ ...state });

      const selectorPrompt = buildConceptSelectorPrompt(
        conceptsRaw,
        task.parsed.name,
        task.parsed.angle,
        task.parsed.product,
        task.parsed.medium,
        task.duration,
      );

      const selectorResponse = await sendMessage(
        selectorPrompt.system,
        selectorPrompt.user,
        apiKey,
        2000,
        SELECTOR_MODEL,
        signal,
      );

      const selection = parseSelectorResponse(selectorResponse);
      ts.selectedConceptIndex = selection.selectedIndex;
      ts.selectionReasoning = selection.reasoning;
      ts.recommendedFramework = selection.framework;

      // Extract the selected concept text
      const conceptBlocks = parseConceptBlocks(conceptsRaw);
      const blockIndex = Math.max(0, Math.min(selection.selectedIndex - 1, conceptBlocks.length - 1));
      ts.selectedConceptText = conceptBlocks[blockIndex] ?? conceptsRaw;

      onProgress({ ...state });

      await delay(INTER_CALL_DELAY);
      if (signal.aborted) throw new Error('Pipeline cancelled');

      // ── Step 3: Generate Brief ────────────────────────────────────────

      ts.step = 'generating-script';
      onProgress({ ...state });

      const framework = matchFramework(selection.framework);
      const scriptParams: ScriptParams = {
        ...task.scriptParamsBase,
        framework,
        conceptAngleContext: ts.selectedConceptText,
      };

      const scriptPrompt = buildScriptPrompt(scriptParams, analysis);
      const scriptResult = await sendMessage(
        scriptPrompt.system + resourceCtx,
        scriptPrompt.user,
        apiKey,
        getMaxTokensForDuration(task.duration),
        SCRIPT_MODEL,
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
      // Continue to next task
    }
  }

  // ── Batch Review ────────────────────────────────────────────────────────

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
      );

      state.reviewResult = await sendMessage(
        reviewPrompt.system,
        reviewPrompt.user,
        apiKey,
        8000,
        REVIEWER_MODEL,
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
