/**
 * Differentiation / Relevance Critic runner.
 *
 * Invokes the Differentiation Critic agent for a single brief's 5 concepts
 * and returns the parsed verdict + raw text. Called AFTER concept generation
 * and BEFORE concept selection. If the critic returns REGENERATE, the
 * pipeline should regenerate ONCE with the provided guidance.
 */

import { sendMessage } from '../api/claude';
import {
  buildDifferentiationCriticPrompt,
  parseDifferentiationCritique,
  type DifferentiationCriticInput,
  type ParsedCritique,
} from '../prompts/differentiationCriticPrompt';
import { buildBrainAddendum } from '../brain/contextAssembler';
import type { BrainProduct } from '../brain/brainTypes';
import { ensureCurrentBrainSession } from '../brain/brainSession';

import { IDEATION_MODEL } from '../config/models';
// The critic judges creative originality — ideation tier (frontier model).
const OPUS = IDEATION_MODEL;
const MAX_TOKENS = 5000;

/** Best-effort mapping from the critic input's freeform product string to a
 *  BrainProduct key (used for slice selection). Returns undefined if the
 *  string doesn't match a known product. Brain handles undefined gracefully. */
function mapProductForBrain(productStr: string | undefined): BrainProduct | undefined {
  if (!productStr) return undefined;
  const p = productStr.toLowerCase();
  if (p.includes('easystretch') || p.includes('easy stretch')) return 'easystretch';
  if (p.includes('ankle')) return 'ankle';
  if (p.includes('compression')) return 'compression';
  return undefined;
}

export async function runDifferentiationCritic(
  input: DifferentiationCriticInput,
  apiKey: string,
  signal: AbortSignal,
): Promise<ParsedCritique> {
  const { system, user } = buildDifferentiationCriticPrompt(input);

  // Brain integration — additive only. When the per-module flag is OFF
  // (the default), brain.addendum === '' and `finalSystem === system`,
  // making this a strict no-op. When ON, the brain appends a labeled
  // VoC section at the end of the existing system prompt.
  const brain = await buildBrainAddendum(
    {
      module: 'differentiationCritic',
      product: mapProductForBrain(input.product),
      angle: input.angle,
    },
    { apiKey, sessionId: ensureCurrentBrainSession() },
  );
  const finalSystem = system + brain.addendum;

  const raw = await sendMessage(finalSystem, user, apiKey, MAX_TOKENS, OPUS, signal);
  const parsed = parseDifferentiationCritique(raw);

  // Log the batch-level outcome for visibility (non-fatal if nothing matches)
  const keeps = parsed.conceptVerdicts.filter((v) => v.verdict === 'KEEP').length;
  const rejects = parsed.conceptVerdicts.filter((v) => v.verdict === 'REJECT').length;
  console.log(
    `[differentiationCritic] ${input.taskName}: ${keeps} keep / ${rejects} reject — verdict: ${parsed.overallVerdict}`,
  );

  return parsed;
}
