/**
 * Brain — deep-reasoning Claude call.
 *
 * The optional second LLM call. Fires only for complex tasks (batch ≥ 3,
 * AI Doc, strategy session, creative strategist, or explicit override).
 * Failure here NEVER aborts the user's main task — caller handles the
 * exception by skipping the deep-reasoning block in the addendum.
 *
 * See the spec for cost (~$0.04 per fire) and latency (10-25s) details.
 */
import { sendMessage } from '../api/claude';
import type { BrainTaskDescriptor, SelectedSlices } from './brainTypes';
import { isDeepReasoningEnabled } from './brainConfig';
import { UTILITY_MODEL } from '../config/models';

/** Decide whether the deep-reasoning call should fire for a given task.
 *  Checks the per-task heuristics on top of the global enable flag. */
export function shouldRunDeepReasoning(task: BrainTaskDescriptor): boolean {
  if (!isDeepReasoningEnabled()) return false;
  if (task.forceDeepReasoning === true) return true;
  if (task.isBatch && (task.batchCount ?? 0) >= 3) return true;
  if (task.template === 'aidoc') return true;
  if (task.module === 'strategySession') return true;
  if (task.module === 'creativeStrategist') return true;
  return false;
}

const DEEP_REASONING_SYSTEM = `You are a strategic analyst for the Viasox marketing intelligence brain.

You will be given:
1. A task descriptor — what's about to be generated
2. Selected slices of the current Voice-of-Audience index — top customer
   objections, testimonials, questions, complaints, persona signals,
   emerging themes, product-specific feedback.

Your job: identify what's most strategically important for THIS specific
task. Be ruthlessly specific. Reference actual quote text. Don't speak in
generalities. Don't repeat what's already in the task descriptor.

Output a concise markdown analysis (≤1200 words) with these sections:

### KEY GAPS
What customer-voice evidence is NOT being addressed by the current task
parameters that probably should be. Cite specifics.

### MUST-USE EVIDENCE
Specific quotes / themes that would meaningfully strengthen this output.
Quote them verbatim. Group by relevance.

### PERSONA-VOICE REMINDERS
What makes the targeted persona's voice distinct in the data above.
Quote examples.

### RECOMMENDED EMPHASIS
What to lean into for this particular task — angles, hierarchy of message,
which objections to preempt.

If the data is sparse or doesn't add anything to the task, say so plainly
in one sentence. Do not pad.`;

const DEEP_REASONING_MAX_TOKENS = 2000;

/** Run the deep-reasoning Claude call. Returns the raw markdown output.
 *  Throws on any failure — the assembler catches and degrades gracefully. */
export async function runDeepReasoning(
  task: BrainTaskDescriptor,
  slices: SelectedSlices,
  apiKey: string,
): Promise<string> {
  const userMessage = [
    'TASK DESCRIPTOR:',
    '```json',
    JSON.stringify(task, null, 2),
    '```',
    '',
    'VOICE-OF-AUDIENCE INDEX (selected slices):',
    '```json',
    JSON.stringify(serializeSlicesForPrompt(slices), null, 2),
    '```',
  ].join('\n');

  return sendMessage(
    DEEP_REASONING_SYSTEM,
    userMessage,
    apiKey,
    DEEP_REASONING_MAX_TOKENS,
    // Utility model (Sonnet) — deep reasoning is structured pattern-matching,
    // doesn't need the creative model. Cost stays low.
    UTILITY_MODEL,
  );
}

/** Drop the `sliceNames` helper field — the LLM only needs the data. */
function serializeSlicesForPrompt(slices: SelectedSlices): Omit<SelectedSlices, 'sliceNames'> {
  const { sliceNames: _ignored, ...rest } = slices;
  void _ignored;
  return rest;
}
