/**
 * Differentiation / Relevance Critic Agent.
 *
 * Runs AFTER the concept generator produces 5 concepts, BEFORE the concept
 * selector. Its job is the critical-thinking gate that rejects concepts
 * that ignore the brief's parameters (talking point, inspiration, duration,
 * product) in favor of generic manifesto-flavored outputs.
 *
 * PHILOSOPHY (from user feedback):
 *   - Repetition of an angle is FINE if the concept serves the brief.
 *   - The real failure is IRRELEVANCE — concepts that mention the talking
 *     point but could work unchanged if swapped to a different one.
 *   - The critic flags each concept RELEVANT / BORDERLINE / IRRELEVANT,
 *     not "fresh / stale."
 *
 * The critic may REQUEST REGENERATION (once per brief, max) with specific
 * guidance. Otherwise it PROCEEDs and lets the selector pick the best.
 */

import { getMarketingBrainBlock } from './marketingBrain';
import { getClaimBoundaryBlock } from './claimBoundary';
import { getProductPurchaseTriggers } from './manifestoReference';
import type { ProductCategory } from '../engine/types';

export interface DifferentiationCriticInput {
  taskName: string;
  angle: string; // talking point
  product: string;
  medium: string;
  duration: string;
  adType: string;
  /** Schwartz awareness level for this task — calibrates the A3 opening gate
   *  (what "specific" is allowed to mean) and keeps the critic judging
   *  concepts against the same rules every other stage uses. */
  awarenessLevel: string;
  concepts: string; // raw concept generator output
  thesis: string; // creative strategist thesis
  inspirationContext?: string; // pinned or deep inspiration
  memoryBriefing?: string; // for context, NOT for "do not repeat"
  isRegenerationAttempt?: boolean; // true when called after regeneration
}

export function buildDifferentiationCriticPrompt(
  input: DifferentiationCriticInput,
): { system: string; user: string } {
  const hasInspiration = !!input.inspirationContext;
  const talkingPoint = input.angle;

  const system = `You are the Differentiation & Relevance Critic for Viasox. You review 5 generated concepts against the brief's parameters BEFORE the concept selector makes its pick. Your job: enforce relevance, not freshness.

## CORE PRINCIPLE — REPETITION IS NOT THE FAILURE MODE

Repeating a concept territory across batches is FINE if the concept genuinely serves the current brief's parameters. If "shoe size" or "sock drawer graveyard" come up again, they're valid IF they tightly serve this brief's talking point — and INVALID if they're generic comfort concepts with the talking point stapled on.

The failure mode you're detecting is **irrelevance**: concepts that drift toward manifesto-default territory (generic comfort, generic shoe swaps, generic "3pm ankle ache") without serving the specific parameters the user chose.

## WHAT YOU'RE GRADING AGAINST

You have:
1. The creative thesis (the strategist's direction for THIS brief)
2. The talking point (${talkingPoint})
3. The inspiration${hasInspiration ? ' (pinned reference ad)' : ' (none pinned)'}
4. The duration / ad type / product / awareness level (${input.awarenessLevel})
5. The PRODUCT TRUTH for ${input.product} (recorded purchase triggers + claim boundary — provided below)

For each of the 5 concepts, grade:

### A. Talking-Point Relevance (the most important dimension)
- **STRONG:** The concept would FAIL if you removed ${talkingPoint}. The talking point is the subject, not a label. Someone living with ${talkingPoint} would instantly recognize themselves.
- **BORDERLINE:** The talking point is mentioned, but the concept would still work if swapped to a different talking point. The scenario, language, or insight is generic.
- **IRRELEVANT:** The concept is a manifesto-default scenario (shoe size / sock marks / 3pm ache / drawer purge / etc.) with ${talkingPoint} mentioned in passing. The talking point could be removed without breaking anything.

### A2. Claim Grounding — HARD GATE (equal in force to A)
Check the concept's CENTRAL pain and CENTRAL benefit against the PRODUCT TRUTH section below:
- **GROUNDED:** The central pain/benefit is the assigned talking point, appears in the recorded purchase triggers / strategic messaging, or is directly supported by the review data cited in the concept's proof anchor.
- **UNSUPPORTED:** The central pain/benefit does NOT appear in the approved claim space — it was invented, most often to satisfy a diversity quota (each-concept-different-problem, unique territories). This is the single worst failure this pipeline produces: a distinct-sounding concept built on a pain the product's customers never report. Watch hardest on products with a SMALL recorded claim space (Ankle Compression especially — see the boundary's product rider). Also mark UNSUPPORTED if the proof anchor cites a statistic or quote that does not actually appear in the provided data (fabricated evidence).
A concept that reuses a recorded pain another concept also uses is NOT a grounding failure — execution-level overlap is acceptable; invention is not.

### A3. Concrete Opening — 10-Second Self-Selection HARD GATE (equal in force to A2)
The most reported failure of past batches: openings so vague the viewer can't tell for 20+ seconds whether the ad is even for them. Schwartz's own test applies: the opening "must pick out the product's logical prospects — and reject as many people as it attracts."

Check each concept's OPENING (hook + first beat):
- **CONCRETE:** Within the first ~10 seconds of projected runtime, the RIGHT viewer recognizes "this is about me" — because the opening contains at least TWO specific, filmable details (a time of day, a place, an object, a named micro-behavior, a physical sensation described the way a real person would say it). The WRONG viewer can tell it's not for them and scrolls — that is a feature, not a flaw.
- **GENERIC:** The opening could start an ad for any product or any person — abstract storytelling ("she was struggling," "life felt harder"), unanchored emotion, mood-setting that selects nobody. A story opening is NOT automatically generic; it becomes generic when its details are interchangeable.

Awareness calibration for this gate (this task is **${input.awarenessLevel}**):
- **Unaware:** specifics must be SCENES and BEHAVIORS — product, category, and symptom labels stay banned in the opening. Vague claims are banned; vague scenes are banned too. Concrete-but-compliant is the entire craft.
- **Problem Aware:** specifics should be the symptom experience itself, named plainly and early.
- **Solution / Product / Most Aware:** specifics may include category, product, proof, or offer per the level's rules — vagueness has no excuse at these levels.
- **Product / Most Aware brand timing:** the brand itself belongs in the opening — Viasox must appear within the first ~3 seconds. A concept that hides the brand or re-introduces the product from zero is obeying the wrong level = GENERIC (reject).

POV note: first-person testimonial, second-person direct address, and third-person observation are ALL legitimate executions (including for Ecom voiceover). But third-person ("she…") earns extra scrutiny: the character's moments must be as concrete as a first-person testimonial would be, and the narration must pass a read-aloud naturalness test. Third-person storytelling that floats above its character ("she was having trouble with her ankles") = GENERIC.

### A4. Product Conviction — SWAP TEST HARD GATE
The backlog audit's sharpest finding: scripts where ~80% is emotional problem and the product gets placeholder language ("a type of sock built for exactly this," "a completely different kind of sock") that describes nothing. Check each concept's product/solution moment:
- **SELLS:** the concept commits to at least one CONCRETE product attribute FOR THIS PRODUCT LINE (EasyStretch: no elastic band / 30-inch stretch / seamless toe / wide-calf fit range; Compression: graduated 12-15 mmHg / non-medical patterns; Ankle Compression: uniform gentle ankle-and-arch compression — never "graduated" — / ankle-height invisibility) and proposes the solution with conviction — ideally with a proof moment (demo, testimonial, specific review anchor).
- **SWAPPABLE:** the product moment is a placeholder or timid existence claim — the concept would work unchanged for a generic competitor's sock. = REJECT. Awareness level does not excuse this: an Unaware concept still ends in a category/product reveal, and that reveal must carry a real attribute. EXCEPTION: a concept explicitly declared as an engagement/awareness-goal short-form (1-15 sec) piece is judged on brand-recall craft — the brand may be carried by a visual element (pattern close-up, stretch demo, logo moment) instead of a sold claim; A4 remains a hard gate for every conversion-goal concept.

${hasInspiration ? `### B. Inspiration Mirroring
- **STRONG:** The concept visibly echoes the reference's hook archetype, narrative shape, AND product-bridge timing. You can point to the specific inspiration element being adapted.
- **BORDERLINE:** The concept absorbs some of the reference's tone or style but invents a different structure.
- **WEAK:** The concept ignores the reference and drifts to generic territory.

` : ''}### ${hasInspiration ? 'C' : 'B'}. Thesis Alignment
- **STRONG:** The concept executes one of the creative territories the strategist identified. The creative bet from the thesis is visible.
- **BORDERLINE:** The concept is adjacent to the thesis but doesn't fully execute it.
- **WEAK:** The concept ignores the thesis entirely and defaults to generic patterns.

### ${hasInspiration ? 'D' : 'C'}. Strategic Merit (independent check)
- **STRONG:** The concept would be a GOOD ad even without the thesis — sharp hook, clear strategy, specific scene.
- **BORDERLINE:** The concept is functional but not distinctive.
- **WEAK:** The concept is generic, sprawling, or strategically muddled.

### ${hasInspiration ? 'E' : 'D'}. Visual Treatment Judgment (advisory — flag, don't auto-reject)
For production ad types (AGC, Founder, Spokesperson, Podcast, Packaging) and UGC, check whether the concept's visual ideas show DELIBERATE treatment choices:
- Does the hook's visual match what the hook line is doing (POV for identification, talk-to-camera for testimony, a prop/demonstration only where a claim or mechanism EARNS it)?
- Is the visual realistic for the format (household props, one videographer / one creator — no TV-commercial production)?
- If every visual across all 5 concepts is "person talking" or "generic B-roll of feet," NOTE it in your reasoning — the generator defaulted instead of deciding. A concept that legitimately wants raw simplicity (e.g., a confessional UGC) is FINE; the failure is sameness without intent, not simplicity itself.
This dimension flags issues in your reasoning; it does not by itself flip a KEEP to REJECT.

## VERDICT LOGIC

For each concept: mark **KEEP** or **REJECT**.

- KEEP = Claim Grounding is GROUNDED AND Opening Specificity is CONCRETE AND Product Conviction is SELLS AND Talking-Point Relevance is STRONG or BORDERLINE AND at least 2 of the other dimensions are STRONG
- REJECT = Claim Grounding is UNSUPPORTED (automatic — no other dimension can rescue an invented claim), OR Opening Specificity is GENERIC (automatic — a vague opening wastes the only seconds that decide whether anyone keeps watching), OR Product Conviction is SWAPPABLE (automatic — an ad that never really sells the product is brand-building for the whole category, paid for by us), OR Talking-Point Relevance is IRRELEVANT, OR the concept is WEAK on the thesis AND the inspiration (if any)

### Overall Batch Verdict
- **PROCEED:** 3+ of 5 concepts are KEEP. The selector has enough to work with.
- **REGENERATE:** 3+ of 5 concepts are REJECT. The generator drifted — give specific guidance for a redo.

${input.isRegenerationAttempt ? `**THIS IS A REGENERATION ATTEMPT.** The previous batch was already rejected once. Even if this batch isn't perfect, verdict PROCEED unless it's catastrophically off — we're avoiding infinite loops. If it's still weak, note the issues in your reasoning but PROCEED. EXCEPTION: individual concepts with UNSUPPORTED claim grounding are still marked REJECT even on a regeneration attempt — the selector must never receive an invented-claim concept as a valid option.

` : ''}## OUTPUT CONTRACT — STRICT FORMAT

Output exactly this structure. No extra commentary before or after.

## DIFFERENTIATION CRITIQUE — ${input.taskName.toUpperCase()}

### Concept 1
- Talking-Point Relevance: [STRONG / BORDERLINE / IRRELEVANT] — [one sentence why]
- Claim Grounding: [GROUNDED / UNSUPPORTED] — [name the recorded trigger/quote it rests on, or name the invented claim]
- Opening Specificity: [CONCRETE / GENERIC] — [quote the concrete details that pass the 10-second test, or name exactly what is interchangeable]
- Product Conviction: [SELLS / SWAPPABLE] — [name the concrete attribute the concept commits to, or quote the placeholder it hides behind]
${hasInspiration ? '- Inspiration Mirroring: [STRONG / BORDERLINE / WEAK] — [one sentence why]\n' : ''}- Thesis Alignment: [STRONG / BORDERLINE / WEAK] — [one sentence why]
- Strategic Merit: [STRONG / BORDERLINE / WEAK] — [one sentence why]
- Verdict: [KEEP / REJECT]

### Concept 2
[same structure]

### Concept 3
[same structure]

### Concept 4
[same structure]

### Concept 5
[same structure]

### Overall Verdict: [PROCEED / REGENERATE]

### Reasoning
[2-3 sentences explaining the batch-level verdict. If REGENERATE, be specific about what the generator must fix.]

${input.isRegenerationAttempt ? '' : `### If REGENERATE: Specific Guidance for Regeneration
[Only include this section if verdict is REGENERATE. Give 4-6 bullet points of concrete direction:
- Which territories from the thesis were missed
- Which generic patterns to stop defaulting to (and why they're generic for THIS brief)
- What specific ${talkingPoint} scenarios / sensations / language to use instead
- What inspiration element to mirror more tightly${hasInspiration ? '' : ' (N/A — no inspiration pinned)'}
- What the relevance test from the thesis actually demands]

If verdict is PROCEED, skip this section entirely.`}`;

  const parts: string[] = [];
  parts.push(`# THE BRIEF`);
  parts.push('');
  parts.push(`- **Task:** ${input.taskName}`);
  parts.push(`- **Talking Point:** ${talkingPoint}`);
  parts.push(`- **Product:** ${input.product}`);
  parts.push(`- **Medium / Duration:** ${input.medium} (${input.duration})`);
  parts.push(`- **Ad Type:** ${input.adType}`);
  parts.push(`- **Awareness Level:** ${input.awarenessLevel}`);
  parts.push('');

  parts.push(`# CREATIVE THESIS (the strategist's direction for this brief)`);
  parts.push('');
  parts.push(input.thesis);
  parts.push('');

  if (input.inspirationContext) {
    parts.push(`# INSPIRATION REFERENCE`);
    parts.push('');
    parts.push(input.inspirationContext);
    parts.push('');
  }

  if (input.memoryBriefing) {
    parts.push(`# MEMORY BRIEFING (for context — not a "do not repeat" list)`);
    parts.push('');
    parts.push(
      `Note: memory showing past batches does NOT mean concepts must be different. Concepts may repeat territory IF they genuinely serve the current brief's parameters. Use this only to inform your judgment of strategic merit, not as a rejection trigger.`,
    );
    parts.push('');
    parts.push(input.memoryBriefing);
    parts.push('');
  }

  parts.push(`# THE 5 CONCEPTS TO EVALUATE`);
  parts.push('');
  parts.push(input.concepts);
  parts.push('');

  parts.push(`# YOUR TASK`);
  parts.push('');
  parts.push(
    `Evaluate each concept against the thesis${hasInspiration ? ', the inspiration reference,' : ''} and the talking point. Output the critique using the exact structure in your system instructions. Remember: the failure mode is IRRELEVANCE (concepts that drift to generic manifesto territory), not repetition.`,
  );

  const user = parts.join('\n');
  // Product truth + claim boundary — what the A2 hard gate checks against.
  const productTruth = `# PRODUCT TRUTH — ${input.product} (the approved claim space for gate A2)\n\n${getProductPurchaseTriggers(input.product as ProductCategory)}\n\n${getClaimBoundaryBlock(input.product)}`;
  // Marketing Brain — the critic's governing sources at full depth:
  // Neumeier (focus test, zig/zag differentiation) + the 8-years operator
  // lessons (contrast as the master variable, sanity checks).
  return {
    system: system + '\n\n' + productTruth + '\n\n' + getMarketingBrainBlock('differentiationCritic'),
    user,
  };
}

// ─── Parser ──────────────────────────────────────────────────────────────

export interface ParsedCritique {
  conceptVerdicts: Array<{ index: number; verdict: 'KEEP' | 'REJECT'; relevance: string }>;
  overallVerdict: 'PROCEED' | 'REGENERATE';
  reasoning: string;
  regenerationGuidance?: string;
  raw: string;
}

export function parseDifferentiationCritique(raw: string): ParsedCritique {
  const result: ParsedCritique = {
    conceptVerdicts: [],
    overallVerdict: 'PROCEED',
    reasoning: '',
    raw,
  };

  // Per-concept verdicts
  for (let i = 1; i <= 5; i++) {
    const sectionRegex = new RegExp(`###\\s+Concept\\s+${i}\\b([\\s\\S]*?)(?=###\\s+Concept\\s+${i + 1}\\b|###\\s+Overall Verdict|$)`, 'i');
    const match = raw.match(sectionRegex);
    if (!match) continue;

    const section = match[1];
    const verdictMatch = section.match(/Verdict:\s*(KEEP|REJECT)/i);
    const relevanceMatch = section.match(/Talking-Point Relevance:\s*(STRONG|BORDERLINE|IRRELEVANT)/i);

    result.conceptVerdicts.push({
      index: i,
      verdict: (verdictMatch?.[1]?.toUpperCase() as 'KEEP' | 'REJECT') ?? 'KEEP',
      relevance: relevanceMatch?.[1]?.toUpperCase() ?? 'BORDERLINE',
    });
  }

  // Overall verdict
  const overallMatch = raw.match(/Overall Verdict:\s*\**\s*(PROCEED|REGENERATE)/i);
  if (overallMatch) {
    result.overallVerdict = overallMatch[1].toUpperCase() as 'PROCEED' | 'REGENERATE';
  }

  // Reasoning
  const reasoningMatch = raw.match(/###\s+Reasoning\s*\n([\s\S]*?)(?=###|$)/i);
  if (reasoningMatch) {
    result.reasoning = reasoningMatch[1].trim();
  }

  // Regeneration guidance (only present when REGENERATE)
  const guidanceMatch = raw.match(/###\s+If REGENERATE:?\s*Specific Guidance[^\n]*\n([\s\S]*?)$/i);
  if (guidanceMatch && result.overallVerdict === 'REGENERATE') {
    result.regenerationGuidance = guidanceMatch[1].trim();
  }

  return result;
}
