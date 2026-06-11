/**
 * Creative Strategist runner.
 *
 * Invokes the Creative Strategist agent for a single brief and returns the
 * raw thesis markdown. The thesis is opaque to the runner — it's designed
 * to be pasted directly into downstream prompts (concept generator,
 * differentiation critic) as a top-priority directive.
 */

import { sendMessage } from '../api/claude';
import { buildCreativeStrategistPrompt, type CreativeStrategistInput } from '../prompts/creativeStrategistPrompt';
import { buildBrainAddendum } from '../brain/contextAssembler';
import type { BrainProduct } from '../brain/brainTypes';
import { ensureCurrentBrainSession } from '../brain/brainSession';

import { IDEATION_MODEL } from '../config/models';
// The strategist is the head of the ideation tier — frontier model.
const OPUS = IDEATION_MODEL;
const MAX_TOKENS = 3000;

/** Best-effort mapping from CreativeStrategistInput's freeform product
 *  string to a BrainProduct key (used for slice selection). */
function mapProductForBrain(productStr: string | undefined): BrainProduct | undefined {
  if (!productStr) return undefined;
  const p = productStr.toLowerCase();
  if (p.includes('easystretch') || p.includes('easy stretch')) return 'easystretch';
  if (p.includes('ankle')) return 'ankle';
  if (p.includes('compression')) return 'compression';
  return undefined;
}

export async function runCreativeStrategist(
  input: CreativeStrategistInput,
  apiKey: string,
  signal: AbortSignal,
): Promise<string> {
  const { system, user } = buildCreativeStrategistPrompt(input);

  // Brain integration — additive, off by default per flag. Triggers deep
  // reasoning automatically (creativeStrategist is in the auto-deep-reason
  // module set per the spec). Failure falls through to skip deep reasoning,
  // never aborts the strategist.
  const brain = await buildBrainAddendum(
    {
      module: 'creativeStrategist',
      product: mapProductForBrain((input as { product?: string }).product),
    },
    { apiKey, sessionId: ensureCurrentBrainSession() },
  );
  const finalSystem = system + brain.addendum;

  const thesis = await sendMessage(finalSystem, user, apiKey, MAX_TOKENS, OPUS, signal);

  // Light sanity check — if the model forgot the header, the downstream
  // injection still works but log a warning so we can spot degraded calls.
  if (!thesis.toUpperCase().includes('CREATIVE THESIS')) {
    console.warn('[creativeStrategist] thesis missing "CREATIVE THESIS" header — downstream will still inject it, but the output may be malformed');
  }

  return thesis.trim();
}
