/**
 * Concept Evaluator Prompt
 *
 * Evaluates ALL generated concepts for a task and returns structured data
 * for the interactive concept review UI. Instead of auto-selecting one,
 * it rates and summarizes each concept so the user can make informed decisions.
 */

import type { ConceptOption } from '../engine/autopilotTypes';

export function buildConceptEvaluatorPrompt(
  conceptsRaw: string,
  taskName: string,
  angle: string,
  product: string,
  medium: string,
  duration: string,
  strategyBrief: string | undefined,
  usedFrameworks: string[],
  inspirationContext?: string,
): { system: string; user: string } {
  const system = `You are a Senior Creative Strategist evaluating advertising concepts for Viasox, a premium DTC compression sock brand. You have deep expertise in direct response advertising, performance creative, and DTC marketing strategy.

Your job is to evaluate EACH concept and provide:
1. A clear title and summary
2. A strategic strength rating (1-5)
3. The best framework for this concept
4. Your reasoning — why this concept is strong/weak for THIS specific task

You are opinionated and specific. You don't rate everything 4/5. You differentiate clearly between strong and weak concepts. A 5/5 concept perfectly matches the angle, product, audience, and medium. A 2/5 concept is generic, off-target, or strategically weak.

**CRITICAL EVALUATION CRITERIA — ANGLE SPECIFICITY:**
The most important evaluation criterion is whether the concept is SPECIFICALLY about the assigned angle. If the task says "Neuropathy" and the concept is generic "foot discomfort" without mentioning neuropathy, nerve pain, or diabetic neuropathy — that concept gets a 1/5 regardless of how well-written it is. The angle must be the SOUL of the concept, not a backdrop.

**FORMAT APPROPRIATENESS:**
For short form (<15s), reject concepts that try to tell full stories compressed into 15 seconds. A good 15s concept is a single powerful moment, a direct address, a visual before/after, or a bold statement — NOT a mini-movie. Rate any concept that reads like a compressed 30s ad as 2/5 max.

${strategyBrief ? `\nWEEKLY STRATEGY BRIEF (this is the north star for all creative decisions):\n${strategyBrief}\n\nYour evaluations MUST align with this strategy brief. Concepts that match the strategy direction score higher.` : ''}

${usedFrameworks.length > 0 ? `\nFRAMEWORKS ALREADY USED IN THIS BATCH (for diversity — avoid recommending these unless the concept demands it):\n${usedFrameworks.join(', ')}\n` : ''}

${inspirationContext ? `\n**INSPIRATION BANK PROVEN-PATTERN BIAS:**\nThe inspiration block below contains real reference ads/briefs that have already been judged worth learning from for this exact ad type, angle, and product context. Use them as a proven-pattern lens when rating concepts:\n- Concepts whose hook style, structure, narrative arc, or emotional entry CLOSELY mirror the patterns in these references should score higher (these are the patterns we know work).\n- Concepts that ignore the proven patterns or contradict them should score lower, UNLESS the concept is doing something genuinely fresh that the strategy brief or angle warrants.\n- If a starred reference exists, treat its patterns as especially load-bearing.\nDo NOT name the references in your reasoning. Speak about the *patterns*, not the *examples*.\n${inspirationContext}\n` : ''}`;

  const user = `Evaluate the following concepts generated for task **${taskName}** (${product} / ${angle} / ${medium} / ${duration}).

<concepts>
${conceptsRaw}
</concepts>

For EACH concept (typically 3-5), provide your evaluation in this exact format:

<evaluation>
<concept index="1">
<title>[Short descriptive title, 3-6 words]</title>
<summary>[2-3 sentence summary of the concept's approach, hook, and emotional territory]</summary>
<framework>[Best script framework for this concept, e.g., "PAS (Problem-Agitate-Solution)"]</framework>
<rating>[1-5 integer]</rating>
<reasoning>[2-3 sentences: why this rating? What makes it strong/weak for this specific task? How does it align with the strategy brief?]</reasoning>
</concept>
<concept index="2">
...
</concept>
</evaluation>

Be honest and differentiated in your ratings. Not every concept is a 4. Identify the clear winner(s) and explain why.`;

  return { system, user };
}

// ─── Parse Evaluator Response ───────────────────────────────────────────────

export function parseConceptEvaluations(response: string, conceptsRaw: string): ConceptOption[] {
  const options: ConceptOption[] = [];

  // Try to import parseConceptBlocks to get full text
  const conceptBlockRegex = /(?:^|\n)(?:#{1,3}\s*)?(?:\*\*)?(?:Concept|CONCEPT)\s*#?\d+/gi;
  const splits = conceptsRaw.split(conceptBlockRegex);
  const fullTexts = splits.filter((s) => s.trim().length > 50);

  const conceptRegex = /<concept\s+index="(\d+)">([\s\S]*?)<\/concept>/g;
  let match;

  while ((match = conceptRegex.exec(response)) !== null) {
    const idx = parseInt(match[1]);
    const block = match[2];

    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const summaryMatch = block.match(/<summary>([\s\S]*?)<\/summary>/);
    const frameworkMatch = block.match(/<framework>([\s\S]*?)<\/framework>/);
    const ratingMatch = block.match(/<rating>(\d)<\/rating>/);
    const reasoningMatch = block.match(/<reasoning>([\s\S]*?)<\/reasoning>/);

    if (titleMatch) {
      options.push({
        index: idx,
        title: titleMatch[1].trim(),
        summary: summaryMatch ? summaryMatch[1].trim() : '',
        fullText: fullTexts[idx - 1]?.trim() || `[Concept ${idx}]`,
        recommendedFramework: frameworkMatch ? frameworkMatch[1].trim() : 'PAS (Problem-Agitate-Solution)',
        strengthRating: ratingMatch ? Math.min(5, Math.max(1, parseInt(ratingMatch[1]))) : 3,
        reasoning: reasoningMatch ? reasoningMatch[1].trim() : '',
      });
    }
  }

  // Fallback if XML parsing fails
  if (options.length === 0 && fullTexts.length > 0) {
    fullTexts.forEach((text, i) => {
      options.push({
        index: i + 1,
        title: `Concept ${i + 1}`,
        summary: text.substring(0, 200).trim() + '...',
        fullText: text.trim(),
        recommendedFramework: 'PAS (Problem-Agitate-Solution)',
        strengthRating: 3,
        reasoning: 'Auto-parsed — evaluation data not available.',
      });
    });
  }

  return options;
}
