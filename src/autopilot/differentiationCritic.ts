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

const OPUS = 'claude-opus-4-6';
const MAX_TOKENS = 5000;

export async function runDifferentiationCritic(
  input: DifferentiationCriticInput,
  apiKey: string,
  signal: AbortSignal,
): Promise<ParsedCritique> {
  const { system, user } = buildDifferentiationCriticPrompt(input);

  const raw = await sendMessage(system, user, apiKey, MAX_TOKENS, OPUS, signal);
  const parsed = parseDifferentiationCritique(raw);

  // Log the batch-level outcome for visibility (non-fatal if nothing matches)
  const keeps = parsed.conceptVerdicts.filter((v) => v.verdict === 'KEEP').length;
  const rejects = parsed.conceptVerdicts.filter((v) => v.verdict === 'REJECT').length;
  console.log(
    `[differentiationCritic] ${input.taskName}: ${keeps} keep / ${rejects} reject — verdict: ${parsed.overallVerdict}`,
  );

  return parsed;
}
