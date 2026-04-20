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

const OPUS = 'claude-opus-4-6';
const MAX_TOKENS = 3000;

export async function runCreativeStrategist(
  input: CreativeStrategistInput,
  apiKey: string,
  signal: AbortSignal,
): Promise<string> {
  const { system, user } = buildCreativeStrategistPrompt(input);

  const thesis = await sendMessage(system, user, apiKey, MAX_TOKENS, OPUS, signal);

  // Light sanity check — if the model forgot the header, the downstream
  // injection still works but log a warning so we can spot degraded calls.
  if (!thesis.toUpperCase().includes('CREATIVE THESIS')) {
    console.warn('[creativeStrategist] thesis missing "CREATIVE THESIS" header — downstream will still inject it, but the output may be malformed');
  }

  return thesis.trim();
}
