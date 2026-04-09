/**
 * Concept Evaluator Prompt
 *
 * Evaluates ALL generated concepts for a task and returns structured data
 * for the interactive concept review UI. Instead of auto-selecting one,
 * it rates and summarizes each concept so the user can make informed decisions.
 */

import type { ConceptOption } from '../engine/autopilotTypes';
import type { AwarenessLevel } from '../engine/types';
import { getDurationTarget, isShortFormDuration } from './creativeConstraints';

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
  pinnedFramework?: string | null,
  pinnedHookStyle?: string | null,
  /**
   * Pre-formatted angle×framework×hookStyle pattern table mined from past
   * brief history. When present, the evaluator uses it as hard data on
   * "what has worked before" for this exact angle+product combo.
   * Built via formatAnglePatternsForEvaluator(angle, product, getAnglePatternsFor(angle, product)).
   */
  anglePatternTable?: string,
  awarenessLevel: AwarenessLevel = 'Problem Aware',
): { system: string; user: string } {
  const isUnaware = awarenessLevel === 'Unaware';
  // Duration-aware constraints for the evaluator. Used to downrate concepts
  // that break the VO-by-length rule (16-59 sec / 60-90 sec without VO) or
  // the length calibration rule (concepts that pitch too much story for a
  // 1-15 sec slot).
  const durationTarget = getDurationTarget(duration);
  const shortForm = isShortFormDuration(duration);

  const system = `You are a Senior Creative Strategist evaluating advertising concepts for Viasox, a premium DTC compression sock brand. You have deep expertise in direct response advertising, performance creative, and DTC marketing strategy.

Your job is to evaluate EACH concept and provide:
1. A clear title and summary
2. A strategic strength rating (1-5)
3. The best framework for this concept
4. Your reasoning — why this concept is strong/weak for THIS specific task

You are opinionated and specific. You don't rate everything 4/5. You differentiate clearly between strong and weak concepts. A 5/5 concept perfectly matches the angle, product, audience, and medium. A 2/5 concept is generic, off-target, or strategically weak.

**CRITICAL EVALUATION CRITERIA — ANGLE SPECIFICITY:**
The most important evaluation criterion is whether the concept is SPECIFICALLY about the assigned angle. If the task says "Neuropathy" and the concept is generic "foot discomfort" without mentioning neuropathy, nerve pain, or diabetic neuropathy — that concept gets a 1/5 regardless of how well-written it is. The angle must be the SOUL of the concept, not a backdrop.
${isUnaware ? `

**AWARENESS LEVEL: UNAWARE — SCHWARTZ'S THREE ELIMINATION RULES (HARD RATING CAPS):**

This brief targets Unaware viewers — people who have NOT yet recognized that they have a problem. They've normalized sock marks, puffy ankles, tingling feet, and circulation issues as "just life." You must evaluate each concept through Schwartz's Breakthrough Advertising Unaware framework (pp. 36-38). Apply these HARD CAPS:

**RULE 1 — NO PRICE.** If a concept references price, offers, discounts, "B2G3", or money language in Beats 1–4, **rate it 1/5** and flag the violation in reasoning.

**RULE 2 — NO PRODUCT NAME.** If a concept opens with "Viasox," "our socks," "these socks," "compression socks," or describes a branded sock product visually in the hook (Beat 1) or identification (Beat 2) beats, **rate it 1/5**. The product may appear ONLY in Beat 5 (Product Reveal) at the very end.

**RULE 3 — NO DIRECT PROBLEM OR SOLUTION STATEMENT IN OPENING.** If a concept's hook names a medical condition ("neuropathy," "edema," "swelling," "varicose veins," "diabetic neuropathy"), directly tells the viewer they have a problem ("Do you suffer from X?", "If you have Y..."), or promises a solution in Beat 1, **rate it 1/5**. The opening must feel like a SCENE the viewer sees themselves in, not a pitch.

**RULE 4 — MUST MAP TO THE 5-BEAT UNAWARE BODY STRUCTURE** (Identification → Reframe → Mechanism → Category Reveal → Product Reveal). Concepts that compress identification into "you have neuropathy" or skip the Reframe or Mechanism beats should be rated **2/5 max**.

**RULE 5 — MUST TARGET ONE OF THE 3 UNAWARE SUB-PERSONAS:**
- The Normalizer — "my ankles have always been like that"
- The Diagnosed Non-Searcher — has a condition but doesn't connect it to sock choice
- The Incidental Sufferer — has symptoms but blames wrong cause (age, the weather, long days)

Concepts that target no sub-persona or lump them together score **2/5 max**.

**RULE 6 — REVIEWS ARE POST-EDUCATION.** Review quotes are written by customers who already understand the problem and solution. A concept that lifts "finally no sock marks!" as a hook reads as RESOLVED — that's a Solution Aware ad. Downrate concepts that paste review language verbatim. Concepts must TRANSFORM review data into pre-recognition framing (scene-first, mundane moments).

**RULE 7 — BANNED WORDS IN HOOK / BEAT 1:** "neuropathy", "diabetic neuropathy", "edema", "varicose veins", "compression sock", "Viasox", "our socks", "these socks", "buy", "offer", "discount", "shop now", "B2G3", "sale", "solution", "treatment", "cure", "symptoms", "condition", "suffer from", "if you have". Any of these in the opening = **rate 1/5**.

**PREFERRED UNAWARE FRAMEWORKS:** "The Gradualization (Schwartz)" framework maps natively to the 5-beat Unaware structure. Strongly prefer it. Also strong: "Contrast Framework" (if it builds to the reveal) and "Discovery Narrative" style story openings.

**PREFERRED UNAWARE HOOK STYLES (from Manifesto 4.1 April 2026 update):**
- Scene Identification ("the line across your calf after taking off your socks")
- Mundane Reframe ("you thought that sock-mark was just tight elastic. it isn't.")
- False Cause Flip ("you've been blaming your long days for this. look again.")
- "Doctor Said Watch Your Feet" (medical authority triggers curiosity, not pitch)
- Micro-Behavior (tiny unconscious action the viewer recognizes as their own)
- Hidden Math ("your sock elastic is pressing on ~4 lbs of tissue per square inch")

Concepts using these hook styles = rate HIGHER. Concepts using "Pain Agitation," "Bold Claim," or "Direct Address" in Unaware context = rate LOWER (those are Problem Aware / Solution Aware hooks).` : ''}

**FORMAT APPROPRIATENESS:**
This brief is **${duration}** — target length ${durationTarget.sweetSpot} (hard ceiling ${durationTarget.hardCeiling} words). Concept evaluations must enforce the length budget and the VO-by-length rule.

${shortForm
  ? `**SHORT-FORM (${duration}, final cut MUST be ≤ ${durationTarget.maxSeconds}s) RULES:**
- Reject concepts that try to tell full stories compressed into ${duration}. A good ${duration} concept is a single powerful moment, a direct address, a visual before/after, or a bold statement — NOT a mini-movie. Rate any concept that reads like a compressed mid-form ad as **2/5 max**.
- VO is OPTIONAL at ${duration}. You may rate text-only/silent concepts fairly if they use the format well. Concepts with VO are also fine.
- Watch for LENGTH OVERSHOOT: if a concept pitches 4+ distinct beats, voiceover lines, or story turns, it will not fit in ${duration}. Downrate to 2/5 max.
- Recommended frameworks for this length: ${durationTarget.recommendedFrameworks.join(', ')}.`
  : `**MEDIUM/EXPANDED (${duration}, final cut MUST be ≤ ${durationTarget.maxSeconds}s) RULES:**
- VO/SPOKEN DIALOGUE IS MANDATORY. Any concept that relies on text-only/silent b-roll, pure visual montage with no voiceover, or on-screen text as the sole verbal channel must be rated **1/5** — it is a format violation. A ${duration} ad without a spoken track is not shippable.
- The concept must explicitly describe the voice: a voiceover narrator, a UGC creator talking to camera, a founder monologue, a podcast host conversation, or a spokesperson delivery. If the concept description never mentions who is speaking, downrate it significantly and flag the missing voice in your reasoning.
- Length: the concept should fit in ${durationTarget.sweetSpot} of spoken content. If a concept pitches more story than can be voiced in ${duration}, downrate to 2/5 max.
- Recommended frameworks for this length: ${durationTarget.recommendedFrameworks.join(', ')}. Concepts that lean into these frameworks are more likely to land inside the ${durationTarget.maxSeconds}s runtime cap.`}

**LENGTH CALIBRATION — KNOWN FAILURE MODE:**
The downstream script writer has historically produced scripts 20-30% longer than their target. Your job as evaluator is to FRONT-LOAD discipline: if a concept is clearly too ambitious for ${duration}, downrate it NOW so the script writer is not handed an impossible brief. Favor concepts with a tight focused payload over concepts with sprawling arcs.

${strategyBrief ? `\nWEEKLY STRATEGY BRIEF (this is the north star for all creative decisions):\n${strategyBrief}\n\nYour evaluations MUST align with this strategy brief. Concepts that match the strategy direction score higher.` : ''}

${usedFrameworks.length > 0 ? `\nFRAMEWORKS ALREADY USED IN THIS BATCH (for diversity — avoid recommending these unless the concept demands it):\n${usedFrameworks.join(', ')}\n` : ''}

${pinnedFramework ? `\n**🔒 PINNED FRAMEWORK LOCK — NON-NEGOTIABLE FOR THIS TASK: ${pinnedFramework}**
The creative director has pinned a reference ad that uses **${pinnedFramework}**. The downstream script phase WILL force this framework regardless of what you recommend. Your job is to:
1. Recommend **${pinnedFramework}** in the <framework> tag for the chosen concept (do not recommend a different framework — it will be overridden anyway).
2. Score concepts HIGHER if they naturally fit ${pinnedFramework} (because the chosen concept has to actually work inside ${pinnedFramework}).
3. Score concepts LOWER if they would feel forced or broken inside ${pinnedFramework}.
4. Batch diversity rules DO NOT apply to this task — the pinned framework overrides diversity.\n` : ''}${pinnedHookStyle ? `\n**🔒 PINNED HOOK STYLE LOCK FOR THIS TASK: ${pinnedHookStyle}**
The pinned reference uses a **${pinnedHookStyle}** hook. Score concepts higher if they open with the same hook archetype.\n` : ''}

${anglePatternTable ? `\n**📊 DERIVED PERFORMANCE TABLE — HARD DATA FROM PAST BRIEFS:**\nThe table below was mined from the rolling brief history. Each row is a (framework × hook-style combo) that has actually been used for **${angle} / ${product}** before — with the average reviewer score and the sample size. Use this as load-bearing evidence when rating concepts and recommending frameworks:\n- ✅ PROVEN STRONG rows (high avg score, multiple samples) — recommending these is the safe high-EV play. Score concepts that fit them HIGHER.\n- 🔴 UNDERPERFORMER rows — these combos have repeatedly under-delivered for this angle. Score concepts that map to them LOWER and avoid recommending the framework unless the concept is doing something demonstrably fresh.\n- 🟡 Mixed / 🟢 Solid — neutral, judge on concept merit.\n- If a row has no samples (the table is empty), this angle×product is fresh — judge concepts on first principles.\nDo NOT name the table or scores in your reasoning. Use the data silently to inform your verdict.\n\n${anglePatternTable}\n` : ''}

${inspirationContext ? `\n**INSPIRATION BANK PROVEN-PATTERN BIAS:**\nThe inspiration block below contains real reference ads/briefs that have already been judged worth learning from for this exact ad type, angle, and product context. Use them as a proven-pattern lens when rating concepts:\n- Concepts whose hook style, structure, narrative arc, or emotional entry CLOSELY mirror the patterns in these references should score higher (these are the patterns we know work).\n- Concepts that ignore the proven patterns or contradict them should score lower, UNLESS the concept is doing something genuinely fresh that the strategy brief or angle warrants.\n- If a starred reference exists, treat its patterns as especially load-bearing.\n- If a PINNED reference is included, its patterns OVERRIDE the others — the pin is the locked north star for this task.\nDo NOT name the references in your reasoning. Speak about the *patterns*, not the *examples*.\n${inspirationContext}\n` : ''}`;

  const user = `Evaluate the following concepts generated for task **${taskName}** (${product} / ${angle} / ${medium} / ${duration} / **Awareness: ${awarenessLevel}**).
${isUnaware ? `
**REMINDER: THIS IS AN UNAWARE BRIEF.** The viewer does NOT know they have a problem worth solving. Apply Schwartz's Three Elimination Rules as hard rating caps. Any concept that violates Rule 1/2/3 = 1/5. Any concept that skips the 5-beat structure = 2/5 max. Reviews are post-education — do NOT reward concepts that lift customer-quote language into the hook.
` : ''}
<concepts>
${conceptsRaw}
</concepts>

For EACH concept (typically 3-5), provide your evaluation in this exact format:

<evaluation>
<concept index="1">
<title>[Short descriptive title, 3-6 words]</title>
<summary>[2-3 sentence summary of the concept's approach, hook, and emotional territory]</summary>
<framework>[Best script framework for this concept${isUnaware ? ' — strongly prefer "The Gradualization (Schwartz)" for Unaware' : ', e.g., "PAS (Problem-Agitate-Solution)"'}]</framework>
<rating>[1-5 integer]</rating>
<reasoning>[2-3 sentences: why this rating? What makes it strong/weak for this specific task?${isUnaware ? ' For Unaware briefs, explicitly state whether the concept passes Schwartz\'s Three Elimination Rules and whether it maps cleanly to the 5-beat structure.' : ' How does it align with the strategy brief?'}]</reasoning>
</concept>
<concept index="2">
...
</concept>
</evaluation>

Be honest and differentiated in your ratings. Not every concept is a 4. Identify the clear winner(s) and explain why.${isUnaware ? ' For Unaware briefs, err on the side of HARSHER ratings — if the concept smells even slightly like a Problem Aware pitch, rate it lower.' : ''}`;

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
