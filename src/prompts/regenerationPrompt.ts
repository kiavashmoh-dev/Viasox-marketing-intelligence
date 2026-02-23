/**
 * regenerationPrompt.ts
 *
 * Wraps the original generation prompt with previous output + user feedback
 * for directed regeneration. Instead of a blind re-roll, Claude sees what it
 * previously generated and the user's specific corrections/preferences.
 */

/**
 * Build a regeneration-aware user prompt that includes:
 * 1. The original user prompt (all base requirements)
 * 2. The previous output (so Claude knows what to improve)
 * 3. The user's feedback (the primary directive)
 * 4. Strict regeneration rules
 */
export function buildRegenerationPrompt(
  originalUserPrompt: string,
  previousOutput: string,
  feedback: string,
): string {
  // Truncate previous output if extremely long to avoid blowing context.
  // Most outputs are 3-8K chars; 10K is generous.
  const maxOutputChars = 10000;
  const truncatedOutput =
    previousOutput.length > maxOutputChars
      ? previousOutput.slice(0, maxOutputChars) +
        '\n\n[... output truncated for context ...]'
      : previousOutput;

  return `${originalUserPrompt}

---

## REGENERATION WITH FEEDBACK

**CRITICAL INSTRUCTION — READ THIS FIRST:**
You previously generated output for this exact request. The user has reviewed your output and is asking you to regenerate with specific feedback. Their feedback is the HIGHEST PRIORITY instruction in this entire prompt. You must treat their feedback as a direct, non-negotiable directive that overrides any default behavior.

### YOUR PREVIOUS OUTPUT:
<previous_output>
${truncatedOutput}
</previous_output>

### USER'S FEEDBACK — THIS IS YOUR PRIMARY DIRECTIVE:
<user_feedback>
${feedback}
</user_feedback>

### REGENERATION RULES:
1. **The feedback is law.** Whatever the user says they want different, you MUST change it exactly as they describe. Do not partially address their feedback or water it down. If they say "make it more emotional," the new output should be DRAMATICALLY more emotional. If they say "concept 3 was weak, replace it," concept 3 must be completely new and stronger.
2. **Preserve what they did NOT criticize.** If the user only mentions specific parts they want changed, keep the rest of the output at the same quality level or better. Do not degrade parts they liked.
3. **Do not repeat the same output.** Even for parts the user did not mention, introduce fresh language, data points, and approaches. The regeneration should feel like a genuinely new take that also incorporates their specific feedback.
4. **Maintain all original requirements.** The output format, structure, data grounding, and framework adherence from the original prompt still apply in full. The feedback adjusts WHAT you generate, not HOW it's structured (unless the feedback specifically asks for structural changes).
5. **Acknowledge the feedback implicitly through your output.** Do NOT include meta-commentary like "Based on your feedback, I've changed..." — just produce the improved output directly. The output should stand on its own as if it were the original generation, but better.

Now regenerate the full output, following ALL original instructions above AND incorporating the user's feedback as the primary directive.`;
}
