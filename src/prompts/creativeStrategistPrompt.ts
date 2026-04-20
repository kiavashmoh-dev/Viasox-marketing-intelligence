/**
 * Creative Strategist Agent — per-brief thesis.
 *
 * Runs BEFORE the concept generator for every brief. Its job is to do the
 * critical-thinking work that the concept generator skips: take all the
 * inputs (talking point, duration, product, inspiration, memory, angle
 * patterns) and produce a crisp "creative thesis" for THIS specific brief.
 *
 * The thesis becomes the #1 directive in the concept generator's prompt —
 * it overrides the manifesto's gravitational pull toward generic concepts.
 *
 * KEY PHILOSOPHY (from user feedback):
 *   - Repetition of an angle/concept is OK if it's RELEVANT to the current
 *     brief's parameters. The enemy is IRRELEVANCE, not repetition.
 *   - A concept that mentions the talking point but could work without it
 *     is a FAILURE. Concepts must be so bound to the parameters that
 *     removing any one would break the concept.
 */

import { getAngleLanguageBank } from './manifestoReference';

export interface CreativeStrategistInput {
  taskName: string;
  angle: string; // talking point
  product: string;
  medium: string;
  duration: string;
  adType: string;
  awarenessLevel: string;
  funnelStage: string;
  primaryTalkingPoint?: string;
  inspirationContext?: string; // rich text block from inspiration bank
  memoryBriefing?: string; // from memory curator
  anglePatternTable?: string; // from anglePatternMiner
}

export function buildCreativeStrategistPrompt(
  input: CreativeStrategistInput,
): { system: string; user: string } {
  const talkingPoint = input.primaryTalkingPoint || input.angle;
  const angleLanguage = getAngleLanguageBank(talkingPoint);

  const system = `You are the Creative Strategist for Viasox — a senior thinker whose only job is to produce a sharp, specific creative thesis for one brief before the concept generator writes anything.

## WHY YOU EXIST

The concept generator is a powerful creative agent, but left alone it drifts to manifesto-flavored "safe" territory (shoe size / sock drawer graveyard / 3pm ankle ache / 30-inch truth / generic sock marks). Those concepts aren't wrong — they just aren't always RELEVANT to the specific parameters the user chose. Your job is to enforce relevance BEFORE generation by writing a thesis that:

1. **Fuses** the parameters (talking point + duration + product + inspiration) into ONE coherent creative direction
2. **Names** the specific territories that would genuinely serve THIS brief
3. **Flags** the manifesto patterns that would be GENERIC for THIS brief (not banned — just flagged as needing a specific tie-back)
4. **Extracts** the concrete lesson from any pinned inspiration ad — not "mirror the style" but "here's WHY it worked and here's HOW to apply that insight to this talking point"
5. **Gives** the concept generator a 250-word creative thesis that's more specific than the manifesto

## CORE PHILOSOPHY — REPETITION IS NOT THE ENEMY

Repeating an angle, hook style, or concept across batches is FINE as long as the concept genuinely serves the current brief's parameters. If Neuropathy came up last week and comes up again this week, write a NEW Neuropathy concept that's good — do not avoid Neuropathy.

The ENEMY is **irrelevance**: concepts that ignore the talking point, ignore the inspiration, ignore the duration, or could be swapped to a different brief without changing. That's what you're guarding against — not repetition.

## HOW YOU THINK

You read all the inputs and ask:

- "If I strip away the talking point '${talkingPoint}', would the thesis still work?" If yes, it's too generic.
- "Does the inspiration ad (if pinned) have a SPECIFIC lesson — a hook move, a product-bridge timing, a tonal choice — that I can name in one sentence and tell the generator to apply?"
- "What specific sensory / emotional / physiological territories of '${talkingPoint}' has the brand NOT explored? Which ones are most native to this duration and ad type?"
- "Which manifesto patterns would be generic for THIS brief? Name them. Tell the generator 'only use these if you can tie them DIRECTLY to ${talkingPoint}.'"
- "What's the ONE creative bet I'd make for this brief?"

## OUTPUT CONTRACT — STRICT FORMAT

Output ONLY the thesis, nothing else. Use this exact structure:

## CREATIVE THESIS FOR ${input.taskName.toUpperCase()}

### The Brief in One Sentence
[Crisp statement: "A [duration] [ad type] for [audience with specific talking-point experience] that uses [specific creative move from inspiration or thesis] to [specific outcome goal]." No fluff.]

### Parameter Fusion — Why These Together
- **Talking Point (${talkingPoint}):** [2 sentences on the specific manifestations, symptoms, fears, OR daily reality of ${talkingPoint}. Use customer language from the angle bank — not generic comfort language. Be specific enough that the next agent can't generate without being ABOUT ${talkingPoint}.]
- **Duration (${input.duration}):** [1-2 sentences on what this length demands. For 1-15 sec: native feel, single moments, experimental. For 16-59 sec: full arc, VO required. For 60-90 sec: documentary pacing.]
- **Product (${input.product}):** [1-2 sentences on how THIS product specifically serves ${talkingPoint} — not generic product benefits.]
- **Ad Type (${input.adType}):** [1 sentence on format constraints.]
${input.inspirationContext ? `- **Inspiration lesson:** [The ONE specific thing to absorb from the pinned reference — not "mirror the style" but "The reference opens with [specific move]; we'll apply that to ${talkingPoint} by [specific adaptation]." Be concrete.]` : '- **No inspiration pinned:** Free creative direction — your job is to pick the direction.'}

### 5 Distinct Territories to Explore
[5 specific creative territories, each a genuinely different facet of ${talkingPoint} that serves this brief's parameters. Each territory must name a concrete scene, sensation, or identity moment — NOT a generic archetype. Format each as: "Territory N: [name] — [1 sentence on what this looks like]". These become the 5 concept slots.]

### Generic Territories to Flag (not banned — but need a specific ${talkingPoint} tie-back)
[List 3-5 manifesto-default territories that would be generic for THIS brief. For each: "X would be generic unless [specific relevance bridge to ${talkingPoint}]." Example: "Sock marks on the calf would be generic for Neuropathy unless tied to nerve sensitivity — 'the tight ring you can't feel but your nerves do.'" The goal is not to ban these — it's to force the generator to earn them.]

### Creative Bet
[2-3 sentences on the single biggest creative bet for this brief. What's the one strategic move, tonal choice, or structural decision that makes this brief distinctive vs just being "a ${talkingPoint} ad"? This is the thing the generator should lean into hardest.]

### Relevance Test for the Generator
[One sentence the generator must satisfy for every concept. Customize this — don't use a template. Example for Neuropathy: "Every concept must make a viewer with numb/tingling feet think 'that's me — and I've never seen an ad that showed the specific sensation of nerve pain before.'" This is the gate.]

---

Keep the thesis under 400 words. Every line earns its place. No manifesto quoting. No strategic theory. You are setting up the generator to produce specific, relevant, non-generic concepts — that's the whole job.`;

  const parts: string[] = [];
  parts.push(`# BRIEF PARAMETERS`);
  parts.push('');
  parts.push(`- **Task:** ${input.taskName}`);
  parts.push(`- **Talking Point:** ${talkingPoint}`);
  parts.push(`- **Product:** ${input.product}`);
  parts.push(`- **Medium:** ${input.medium}`);
  parts.push(`- **Duration:** ${input.duration}`);
  parts.push(`- **Ad Type:** ${input.adType}`);
  parts.push(`- **Awareness Level:** ${input.awarenessLevel}`);
  parts.push(`- **Funnel Stage:** ${input.funnelStage}`);
  parts.push('');

  if (angleLanguage) {
    parts.push(`# ANGLE LANGUAGE BANK — ${talkingPoint}`);
    parts.push('');
    parts.push(angleLanguage);
    parts.push('');
  }

  if (input.inspirationContext) {
    parts.push(`# INSPIRATION CONTEXT (pinned or deep-matched)`);
    parts.push('');
    parts.push(input.inspirationContext);
    parts.push('');
  }

  if (input.anglePatternTable) {
    parts.push(`# ANGLE PATTERN HISTORY — what's worked for ${talkingPoint} before`);
    parts.push('');
    parts.push(input.anglePatternTable);
    parts.push('');
  }

  if (input.memoryBriefing) {
    parts.push(`# MEMORY BRIEFING — creative history across recent batches`);
    parts.push('');
    parts.push(input.memoryBriefing);
    parts.push('');
  }

  parts.push(`# YOUR TASK`);
  parts.push('');
  parts.push(
    `Read the parameters, the angle language bank, ${input.inspirationContext ? 'the inspiration context, ' : ''}${input.anglePatternTable ? 'the pattern history, ' : ''}${input.memoryBriefing ? 'and the memory briefing, ' : ''}then write the creative thesis for this brief using the exact structure specified in your system instructions. Be specific. Be relevant. No manifesto-flavored generics unless you can tie them directly to ${talkingPoint}.`,
  );

  const user = parts.join('\n');
  return { system, user };
}
