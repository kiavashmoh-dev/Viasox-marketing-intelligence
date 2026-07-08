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

import {
  getAngleLanguageBank,
  getProductPurchaseTriggers,
  getProductStrategicInsights,
} from './manifestoReference';
import type { ProductCategory } from '../engine/types';
import { getVisualCraftGuide } from './visualCraftGuide';
import { getMarketingBrainBlock } from './marketingBrain';
import { getClaimBoundaryBlock } from './claimBoundary';

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
  /**
   * How the inspiration was supplied:
   *   'pinned'  — the user pinned ONE specific reference for this task.
   *               Follow it closely; it is THE blueprint.
   *   'matched' — no pin; the strategist receives the PALETTE of references
   *               matching this ad type and must actively CHOOSE which to
   *               follow or which creative elements to blend.
   *   'none'    — no inspiration available; free creative direction.
   * Defaults to 'matched' when inspirationContext is present, else 'none'.
   */
  inspirationMode?: 'pinned' | 'matched' | 'none';
  memoryBriefing?: string; // from memory curator
  anglePatternTable?: string; // from anglePatternMiner
}

export function buildCreativeStrategistPrompt(
  input: CreativeStrategistInput,
): { system: string; user: string } {
  const talkingPoint = input.primaryTalkingPoint || input.angle;
  const angleLanguage = getAngleLanguageBank(talkingPoint);
  const inspMode: 'pinned' | 'matched' | 'none' =
    input.inspirationMode ?? (input.inspirationContext ? 'matched' : 'none');
  // Visual craft guide — non-empty only for production ad types + UGC
  // (the formats where treatment decisions and props are in play).
  const visualCraft = getVisualCraftGuide(input.adType, 'strategist');

  // The strategist's inspiration job differs sharply by mode. In PINNED mode
  // it follows one reference; in MATCHED mode it is the curator who selects
  // and blends from the whole palette.
  const inspirationPhilosophy =
    inspMode === 'pinned'
      ? `4. **Follow the PINNED reference.** The user pinned ONE specific inspiration ad for this brief — it IS the blueprint. Extract its concrete creative moves (hook archetype, product-bridge timing, visual treatment, tonal choice, script rhythm) and direct the generator to follow them closely, adapted to this talking point. Do NOT dilute it with other directions.`
      : inspMode === 'matched'
        ? `4. **CURATE the inspiration palette — this is a core part of your job.** No single reference was pinned, so you are given the FULL set of proven references matching this ad type (and, for short-form briefs, every short-form reference). These hold a rich range of creative visual choices, script frameworks, and hook archetypes. Your job is to ACTIVELY CHOOSE: pick the single reference whose approach best fits THIS task's angle / talking point / duration and follow it closely, OR blend the strongest elements from a few (e.g. the hook archetype from one, the visual treatment from another, the script framework from a third). Lean on your expertise to decide what serves this exact brief. NAME the specific references and elements you're selecting — your thesis is the instruction the concept generator and script writer will follow, so be concrete about which creative DNA to carry forward and which to leave behind.`
        : `4. **No inspiration available** — pick the creative direction yourself from first principles.`;

  const system = `You are the Creative Strategist for Viasox — a senior thinker whose only job is to produce a sharp, specific creative thesis for one brief before the concept generator writes anything.

## WHY YOU EXIST

The concept generator is a powerful creative agent, but left alone it drifts to manifesto-flavored "safe" territory (shoe size / sock drawer graveyard / 3pm ankle ache / 30-inch truth / generic sock marks). Those concepts aren't wrong — they just aren't always RELEVANT to the specific parameters the user chose. Your job is to enforce relevance BEFORE generation by writing a thesis that:

1. **Fuses** the parameters (talking point + duration + product + inspiration) into ONE coherent creative direction
2. **Names** the specific territories that would genuinely serve THIS brief
3. **Flags** the manifesto patterns that would be GENERIC for THIS brief (not banned — just flagged as needing a specific tie-back)
${inspirationPhilosophy}
5. **Gives** the concept generator a 250-word creative thesis that's more specific than the manifesto

## CORE PHILOSOPHY — REPETITION IS NOT THE ENEMY

Repeating an angle, hook style, or concept across batches is FINE as long as the concept genuinely serves the current brief's parameters. If Neuropathy came up last week and comes up again this week, write a NEW Neuropathy concept that's good — do not avoid Neuropathy.

The ENEMY is **irrelevance**: concepts that ignore the talking point, ignore the inspiration, ignore the duration, or could be swapped to a different brief without changing. That's what you're guarding against — not repetition.

## HOW YOU THINK

You read all the inputs and ask:

- "If I strip away the talking point '${talkingPoint}', would the thesis still work?" If yes, it's too generic.
${inspMode === 'pinned'
  ? `- "What are the PINNED reference's specific moves — its hook, product-bridge timing, visual treatment, script rhythm — that I should name and tell the generator to follow closely?"`
  : inspMode === 'matched'
    ? `- "Across the inspiration palette, which reference's approach is the strongest fit for THIS angle + duration? Should I follow one closely, or blend elements — this one's hook, that one's visual treatment, another's framework? Which creative DNA do I carry forward, and which do I deliberately leave behind?"`
    : `- "With no inspiration available, what's the strongest creative direction from first principles?"`}
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
${inspMode === 'pinned'
  ? `- **Inspiration to follow (PINNED — this IS the blueprint):** [Name the pinned reference's specific moves — hook archetype, product-bridge timing, visual treatment, script rhythm — and exactly how you'll apply each to ${talkingPoint}. The concept generator and script writer must follow this reference closely.]`
  : inspMode === 'matched'
    ? `- **Inspiration selection (curate from the palette):** [Survey the references provided. CHOOSE deliberately: name which reference(s) you're drawing from and the specific creative elements you're taking from each — e.g. "Follow Reference 3's pattern-interrupt hook + single-continuous-shot visual; borrow Reference 7's Before-After-Bridge framework." You may follow ONE closely or blend 2-3. Justify the pick against ${talkingPoint} + ${input.duration}. Explicitly note what you're NOT using and why. THIS selection is the instruction the concept generator and script writer will execute — be concrete.]`
    : '- **No inspiration available:** Free creative direction — your job is to pick the direction from first principles.'}

### 5 Distinct Territories to Explore
[5 specific creative territories, each a genuinely different facet of ${talkingPoint} that serves this brief's parameters. Each territory must name a concrete scene, sensation, or identity moment — NOT a generic archetype. Format each as: "Territory N: [name] — [1 sentence on what this looks like]". These become the 5 concept slots.]

### Generic Territories to Flag (not banned — but need a specific ${talkingPoint} tie-back)
[List 3-5 manifesto-default territories that would be generic for THIS brief. For each: "X would be generic unless [specific relevance bridge to ${talkingPoint}]." Example: "Sock marks on the calf would be generic for Neuropathy unless tied to nerve sensitivity — 'the tight ring you can't feel but your nerves do.'" The goal is not to ban these — it's to force the generator to earn them.]

### Creative Bet
[2-3 sentences on the single biggest creative bet for this brief. What's the one strategic move, tonal choice, or structural decision that makes this brief distinctive vs just being "a ${talkingPoint} ad"? This is the thing the generator should lean into hardest.]

### Claim Grounding
[1-2 lines. Name the RECORDED pain/benefit this brief is built on, with its source from the PRODUCT TRUTH section (e.g. "localized ankle swelling — 12.0% of ACS reviews" or a specific review quote). If the recorded claim space for this product is smaller than the concept quota, say so here and instruct the generator to differentiate concepts by persona/moment/format while REUSING recorded claims — never by inventing new pains or benefits.]
${visualCraft ? `
### Visual Treatment Plan
[Map the ad's beats to visual treatments using the palette from the Visual Craft Guide: which beats are talk-to-camera, where simple B-roll is the CORRECT call, where POV lands the identification, where dynamic B-roll carries a transition. Then the prop decision: IF one line earns a prop/demonstration moment, name the specific realistic prop, the exact claim or mechanism it demonstrates, and why it passes the earn-it test. If no line earns one, say "No prop moment — this concept lives on [treatments]" — that is a correct professional decision, not a failure. Max 1-2 prop moments, household-realistic only, no TV-commercial production.]` : ''}

### Relevance Test for the Generator
[One sentence the generator must satisfy for every concept. Customize this — don't use a template. Example for Neuropathy: "Every concept must make a viewer with numb/tingling feet think 'that's me — and I've never seen an ad that showed the specific sensation of nerve pain before.'" This is the gate.]

---

Keep the thesis under ${visualCraft ? '520' : '440'} words. Every line earns its place. No manifesto quoting. No strategic theory. You are setting up the generator to produce specific, relevant, non-generic concepts — that's the whole job.`;

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

  // Product truth — the recorded reasons people actually buy THIS product,
  // with frequencies, plus the claim boundary. The strategist's thesis and
  // creative bet must be built INSIDE this space; this is the fix for the
  // invented-pains failure (worst on Ankle Compression, whose recorded
  // claim space is small).
  parts.push(`# PRODUCT TRUTH — ${input.product}`);
  parts.push('');
  parts.push(getProductPurchaseTriggers(input.product as ProductCategory));
  parts.push('');
  parts.push(getProductStrategicInsights(input.product as ProductCategory));
  parts.push('');
  parts.push(getClaimBoundaryBlock(input.product));
  parts.push('');

  if (angleLanguage) {
    parts.push(`# ANGLE LANGUAGE BANK — ${talkingPoint}`);
    parts.push('');
    parts.push(angleLanguage);
    parts.push('');
  }

  if (visualCraft) {
    parts.push(`# VISUAL CRAFT GUIDE — ${input.adType}`);
    parts.push('');
    parts.push(visualCraft);
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
  // Marketing Brain — the strategist's governing sources at full depth:
  // Schwartz (angles/awareness/sophistication — the cornerstone), the Meta
  // creative-strategy masterclass (the system), Neumeier (differentiation).
  return { system: system + '\n\n' + getMarketingBrainBlock('creativeStrategist'), user };
}
