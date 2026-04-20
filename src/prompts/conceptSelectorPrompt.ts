/**
 * Concept Selector Agent — FULL EXPERT evaluator.
 *
 * This is a senior creative strategist with complete Viasox brand knowledge,
 * marketing book mastery, review data context, and production feasibility awareness.
 * Uses Opus for deep, nuanced reasoning.
 */

import type { FullAnalysis, ProductCategory, AdType, AwarenessLevel, FullAiSpecification, FullAiVisualStyle } from '../engine/types';
import { buildSystemBase, getProductAnalysis } from './systemBase';
import { buildAdTypeGuideCompact } from './adTypeGuides';
import { buildFullAiSkillContext, type FullAiDuration } from './fullAiSkillContext';
import { buildBriefConstraintsBlock, getDurationTarget, isShortFormDuration } from './creativeConstraints';
import { getAwarenessConceptGuide } from './awarenessGuide';
import {
  getProductPurchaseTriggers,
  getProductStrategicInsights,
  getCoreFearsDeepDive,
  getEmotionalPainPatterns,
  getTransformationJourney,
  getScriptFrameworks,
  getAwarenessMessagingTechniques,
} from './manifestoReference';

export function buildConceptSelectorPrompt(
  concepts: string,
  taskName: string,
  angle: string,
  product: string,
  productCategory: ProductCategory,
  medium: string,
  duration: string,
  analysis: FullAnalysis,
  usedFrameworks: string[],
  memoryBriefing?: string,
  angleHistory?: string,
  adType: AdType = 'Ecom Style',
  fullAiSpecification?: FullAiSpecification,
  fullAiVisualStyle?: FullAiVisualStyle,
  inspirationContext?: string,
  awarenessLevel: AwarenessLevel = 'Problem Aware',
  funnelStage: string = 'TOF',
): { system: string; user: string } {
  const isUnaware = awarenessLevel === 'Unaware';
  const isFullAi = adType === 'Full AI (Documentary, story, education, etc)';
  const normalizedFullAiDuration: FullAiDuration = (['1-15 sec', '16-59 sec', '60-90 sec'] as const).includes(
    duration as FullAiDuration,
  )
    ? (duration as FullAiDuration)
    : '60-90 sec';
  const fullAiSkillBlock = isFullAi
    ? `\n\n${buildFullAiSkillContext({
        specification: fullAiSpecification,
        visualStyle: fullAiVisualStyle,
        duration: normalizedFullAiDuration,
        mode: 'compact',
      })}`
    : '';

  // Duration-specific constraints — enforces the VO-by-length rule and the
  // length calibration warning at selection time so we never lock in a
  // concept that sets the downstream script writer up to fail.
  const durationTarget = getDurationTarget(duration);
  const shortForm = isShortFormDuration(duration);
  const briefConstraints = buildBriefConstraintsBlock(duration);

  const hasInspiration = !!inspirationContext;

  // ─── TOP-PRIORITY USER DIRECTIVES (SELECTOR) ───────────────────────────
  // Mirror of the directives block in the concept generator prompt. Ensures
  // the selector applies the same hierarchy when evaluating: user choices
  // override manifesto patterns when they conflict.
  const userPrimaryDirectives = `## ⚠️⚠️⚠️ TOP-PRIORITY USER DIRECTIVES — APPLY FIRST WHEN EVALUATING

The user chose specific creative parameters for this brief. Any concept that
doesn't serve these directives — no matter how "strategically deep" or
"manifesto-aligned" it otherwise appears — is a failure.

**Primary Talking Point:** "${angle}" — every selected concept must be unmistakably ABOUT this.
**Angle Type:** ${angle} structural architecture (not a blend, not whatever the manifesto suggests)
**Duration / Medium:** ${medium} (${duration}) — the concept must fit this format${shortForm ? ' (short-form experimental lane)' : ''}
${hasInspiration ? `**Inspiration Reference:** The user pinned a reference ad — the selected concept MUST visibly mirror it (hook archetype, narrative shape, product-bridge timing, language register).` : ''}

**HIERARCHY OF AUTHORITY** (when criteria conflict, the higher rule wins):
1. User directives above (angle, duration${hasInspiration ? ', inspiration reference' : ''})
2. Awareness level rules (Schwartz, Unaware/Problem Aware/etc.)
3. Ad type format rules (UGC vs AGC vs Static, etc.)
4. Funnel stage pacing
5. Manifesto background (emotional patterns, voice of customer, winning ad bank)
6. General marketing principles

When evaluating, if Concept A flaunts manifesto theory but drifts from the angle/inspiration
and Concept B stays laser-focused on the angle/inspiration with simpler psychology,
**Concept B wins.** This is the exact failure mode the user has flagged: concepts
that ignore their choices in favor of generic manifesto patterns.
`;

  const system = `${buildSystemBase()}

${userPrimaryDirectives}

${briefConstraints}

## YOUR ROLE: SENIOR CREATIVE STRATEGIST — CONCEPT EVALUATOR

You are the most experienced creative strategist on the Viasox team. You have been doing DTC performance marketing for 15 years. You have deep expertise in direct response advertising, having studied and applied the principles of Hopkins (Scientific Advertising), Schwartz (Breakthrough Advertising), Bly (The Copywriter's Handbook), and Neumeier (The Brand Gap).

Your job is NOT to create — it is to EVALUATE and SELECT. You have been given 5 creative concepts generated for a specific ad brief. You must choose the single best concept by deeply analyzing each one against the brief requirements, the brand's strategic positioning, the available review data, and production feasibility.

**Take your time.** Read each concept multiple times. Think about who will see this ad, what they're feeling, what will stop their scroll, and what will make them click. ${isFullAi ? 'Think about whether this concept can actually be generated by AI text-to-video models — is the visual world feasible, are the characters describable in an identity-consistent way, does it lean into what AI uniquely does well?' : 'Think about whether this concept can actually be produced as an Ecom editing-style video with the footage Viasox has available.'}

${getCoreFearsDeepDive()}

${getEmotionalPainPatterns()}

${getProductPurchaseTriggers(productCategory)}

${getProductStrategicInsights(productCategory)}

${getTransformationJourney()}

## AD TYPE CONTEXT: ${adType.toUpperCase()}
${buildAdTypeGuideCompact(adType)}

${isFullAi ? `**FULL AI PRODUCTION REALITY:**
Full AI ads are 100% generated by text-to-video models (Veo / Sora / Runway). There is NO live filming, NO real talent, NO Viasox stock clips. Every visual is synthesized from a generation prompt. The concept must work with:
- AI-generated scenes feasible for current text-to-video models
- Voiceover-dominant audio (the script's voiceover does the heavy lifting)
- Identity-consistent characters described the same way across shots (so the model can reproduce them)
- Cinematic / documentary / surreal / historical / educational visual territories that AI excels at
- Minimal product presence — symbolic product beat near the end, logo card

Concepts requiring tight branded product close-ups, multi-person dialogue with lip-sync, complex hand-product manipulation, or real-world brand-accurate locations score LOWER because they break AI generation feasibility. Concepts that lean into what AI uniquely can do — impossible scale, time travel, surreal metaphor, dreamlike imagery, historical worlds, anatomical visualizations — score HIGHER.` : `**ECOM PRODUCTION REALITY:**
Ecom ads are built in post-production from existing footage, product shots, lifestyle imagery, and text overlays. There are NO new shoots. The concept must work with:
- Existing product footage and lifestyle clips
- Text overlays, captions, and graphics
- AI voiceover narration
- Stock-style B-roll (feet, hands, daily life moments)
- Product close-ups and unboxing footage

Concepts requiring specific actors, custom locations, or complex multi-scene narratives score LOWER because they cannot be executed in Ecom format.`}
${fullAiSkillBlock}

## ANGLE-SPECIFIC KNOWLEDGE

**What "${angle}" means for Viasox:**
${getAngleContext(angle)}

## AWARENESS LEVEL CONTEXT — ${awarenessLevel.toUpperCase()}

${getAwarenessConceptGuide(awarenessLevel)}
${isUnaware ? `

## UNAWARE MESSAGING TECHNIQUES (Viasox Manifesto 4.4 — April 2026 update)

${getAwarenessMessagingTechniques()}` : ''}

## FRAMEWORK DIVERSITY REQUIREMENT
${usedFrameworks.length > 0 ? `The following frameworks have ALREADY been used for other briefs in this batch: ${usedFrameworks.join(', ')}. You MUST suggest a DIFFERENT framework to maintain creative diversity across the batch. Do NOT suggest any of the above.` : 'This is the first brief in the batch. Choose the framework that best serves the selected concept.'}

## ALL AVAILABLE FRAMEWORKS
${getScriptFrameworks()}

## FORMAT & LENGTH GATE — HARD REJECTION FILTER

Before scoring any concept on the weighted criteria below, apply this hard filter first:

${shortForm
  ? `**SHORT-FORM (${duration}) RULES — THIS IS THE EXPERIMENTAL LANE:**
- VO is OPTIONAL at ${duration}. Concepts with VO AND concepts with pure text-only/silent b-roll/native style are EQUALLY valid. Do not penalize either.
- LENGTH GATE: any concept that pitches more than ${durationTarget.hardCeiling} words of implied spoken content or more than 3-4 distinct story beats is TOO BIG for ${duration}. Do NOT select it — it will force the script writer to overshoot length. Only select concepts that fit tightly within the ${durationTarget.sweetSpot} budget.
- **NO FRAMEWORK REQUIRED.** Concepts that work as a single powerful moment, a visual punch, a provocative question, or a native-style clip are JUST AS VALID as concepts with a formal narrative arc. Do NOT penalize a concept for lacking a traditional framework.
- **NOT EVERY SHORT-FORM AD MUST SELL.** Concepts aimed at engagement (comments, shares, reactions), awareness (brand recall, scroll-stop), or native content are VALID goals for short-form. Do not reject a concept just because it doesn't have a conversion CTA.
- **NATIVE STYLE IS VALUED.** Concepts that look and feel like organic social content (not polished ads) score HIGHER for short-form, not lower. If a concept would blend into a TikTok/Reels feed, that's a strength.
- **REWARD CREATIVE RISK.** Short-form is where we experiment. Unusual hooks, unexpected formats, bold creative choices should be rewarded, not penalized for being "unconventional."
- Remember: the tool has historically overshot length by 20-30%. Pick the tightest, sharpest concept, not the most ambitious.`
  : `**MEDIUM/EXPANDED (${duration}) RULES — VO IS MANDATORY:**
- This is a ${duration} brief. VOICEOVER OR SPOKEN DIALOGUE IS MANDATORY per the VO-by-length rule. Any concept that relies on text-only/silent b-roll, pure visual montage with no spoken words, or on-screen text as the sole verbal channel must be REJECTED — do not select it.
- If a concept's description does not clearly indicate a voice (VO narrator, UGC creator talking, founder on camera, podcast hosts, spokesperson), treat it as a format violation and do not select it. Select a different concept from the pool.
- If ALL concepts in the pool have this problem, pick the one CLOSEST to having a clear voice and in your reasoning explicitly note that the script writer must add VO to make it shippable at ${duration}.
- LENGTH GATE: any concept that pitches more spoken content than ${durationTarget.hardCeiling} words will break the length budget. Downrate and prefer concepts that fit ${durationTarget.sweetSpot}.
- Remember: the tool has historically overshot length by 20-30%. Do not select sprawling concepts.`}
${isUnaware ? `

## UNAWARE GATE — HARD REJECTION FILTER (applied BEFORE scoring)

This is an **UNAWARE** brief. The audience does NOT know they have a problem worth solving — they've normalized sock marks, puffy ankles, and tingling feet as "just life" or "just getting older." You MUST reject any concept that reads like a Problem Aware ad. Apply Schwartz's Three Elimination Rules (Breakthrough Advertising pp. 36-38) as hard rejection criteria:

**RULE 1 — NO PRICE.** Any concept that references price, offers, discounts, deals, "B2G3", "5 pairs for $60", "free shipping", or money language in Beats 1–4 = REJECT.

**RULE 2 — NO PRODUCT NAME.** Any concept whose hook, identification beat, or agitation beat names "Viasox," "the sock," "our sock," "these socks," "compression socks," or describes a branded sock product visually in Beats 1–2 = REJECT. Product appears only in Beat 5 (Category Reveal → Product Reveal) at the END.

**RULE 3 — NO DIRECT PROBLEM OR SOLUTION STATEMENT IN THE OPENING.** Any concept whose hook directly names a medical condition ("neuropathy," "edema," "swelling," "varicose veins," "diabetic neuropathy"), directly tells the viewer they have a problem ("Do you suffer from X?", "If you have Y..."), or promises a solution in the first beat = REJECT. The opening must feel like a SCENE the viewer sees themselves in, not a pitch.

**RULE 4 — MUST MAP TO THE 5-BEAT UNAWARE BODY STRUCTURE:**
1. **Identification** — a specific sensory moment the Unaware viewer recognizes as "me" (sock marks, ankles tight by 3pm, morning numbness, line across the calf).
2. **Reframe** — reveal that the normalized moment isn't normal, or isn't caused by what they think. This is the "wait, what?" beat.
3. **Mechanism** — the invisible physiological cause (circulation, elastic compression, nerve pressure) — brief, credible, curiosity-building.
4. **Category Reveal** — "There's a type of sock built to prevent this" — the CATEGORY appears, not the brand.
5. **Product Reveal** — Viasox appears ONLY here, at the end. Soft CTA.

If a concept cannot cleanly map to these 5 beats OR if it compresses identification into "you have neuropathy" → REJECT.

**RULE 5 — MUST TARGET ONE OF THE 3 UNAWARE SUB-PERSONAS:**
- **The Normalizer** — "my ankles have always been like that" / "sock marks are just what happens"
- **The Diagnosed Non-Searcher** — has a condition (diabetes, pregnancy) but doesn't connect it to sock choice
- **The Incidental Sufferer** — has symptoms but attributes them to wrong cause (age, the weather, long days)

If no sub-persona is identifiable, the concept is not actually Unaware. REJECT.

**RULE 6 — DO NOT PULL HOOKS VERBATIM FROM REVIEW DATA.** Review quotes are POST-education — they're written by customers who already understand the problem and solution. Unaware viewers haven't had that education yet. A hook that says "finally no sock marks!" reads as resolved — it assumes the problem is already recognized. Reject concepts whose hook is lifted from review language without reframing it into a scene the viewer can identify with BEFORE recognition.

**RULE 7 — NO BANNED UNAWARE WORDS IN HOOK OR BEAT 1:** "neuropathy", "diabetic neuropathy", "edema", "varicose veins", "compression sock", "Viasox", "our socks", "these socks", "buy", "offer", "discount", "shop now", "B2G3", "sale", "solution", "treatment", "cure", "symptoms", "condition", "suffer from", "if you have". If any of these words appear in the opening hook or identification beat = REJECT.

**HOW TO APPLY:** For each concept, ask "Does the first line sound like a documentary cold open or an infomercial pitch?" — if it sounds like a pitch, reject it. If zero concepts pass the Unaware gate, pick the one CLOSEST to passing and in your REASONING explicitly flag the failures so the script writer can fix them downstream. But prefer concepts that naturally pass the gate.` : ''}

## EVALUATION CRITERIA (weighted):

${isUnaware ? `**UNAWARE WEIGHTING (applies because this is an Unaware brief):**

1. **Schwartz Compliance & 5-Beat Structure (30%)** — Does the concept strictly obey Schwartz's Three Elimination Rules (no price, no product name, no direct problem/solution statement in opening) AND map cleanly to the 5-Beat Unaware Body Structure (Identification → Reframe → Mechanism → Category Reveal → Product Reveal)? Is one of the 3 Unaware Sub-Personas (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer) clearly targeted? This is the single most important criterion — any concept that violates the Schwartz rules is automatically B-tier or worse, no matter how creative.

2. **Identification Power (20%)** — Does the IDENTIFICATION beat create "that's me" recognition for an Unaware viewer who hasn't yet connected the dots? Is it a sensory, specific, mundane scene (sock marks after taking off socks, the line across the calf, the 3pm ankle ache, the tingling at night) — NOT a medical vocabulary statement? The test: would a viewer who has NEVER heard of Viasox, neuropathy, or compression socks still see themselves in the opening?

3. **Production Feasibility (15%)** — ${isFullAi ? 'Can this concept actually be generated by current AI text-to-video models? Does it work with voiceover-led storytelling, identity-consistent characters, and AI-friendly visual territories (cinematic, surreal, documentary, educational)?' : 'Can this concept actually be built in post-production? Does it work with text overlays, existing footage, voiceover, and product shots?'} Unaware concepts that require tight product close-ups in the opening beats violate Rule 2 and are infeasible anyway.

4. **Reframe & Mechanism Quality (15%)** — Does the concept have a GENUINE "wait, what?" reframe (the normalized thing isn't normal) and a credible MECHANISM beat (the invisible physiological cause) that educates without lecturing? Concepts that jump from Identification directly to "buy Viasox" have no reframe — they're Problem Aware ads mislabeled.

5. **Data Grounding (10%)** — Does the concept cite specific review data (percentages, customer language, measurable claims)? BUT: Unaware concepts must TRANSFORM review language into pre-recognition framing — not paste customer quotes verbatim. A concept that uses "90% reported sock marks disappeared" as a Beat 3 Mechanism insight beats one that opens with "finally no sock marks!"

6. **Creative Freshness (10%)** — Does the concept find a unique, scene-first entry point? A fresh identification moment into the "${angle}" territory that hasn't been done a thousand times? Originality in the mundane moment, the reframe twist, the mechanism visualization, or the "category reveal" setup.` : shortForm ? `**SHORT-FORM WEIGHTING (applies because this is a 1-15 sec brief):**

1. **Scroll-Stop Power (25%)** — Would this stop a fast-scrolling thumb in the first 1-1.5 seconds? Short-form lives or dies by the opening frame. The concept must create instant visual or emotional impact — recognition ("that's me"), shock ("wait, what?"), curiosity, or pattern interrupt.

2. **Angle Authenticity (25%)** — Does the concept specifically serve the "${angle}" angle? For short-form, the angle can be expressed through a single vivid moment rather than a full narrative argument — but that moment MUST be about ${angle}, not generic comfort or lifestyle. A concept that's generic short-form content with ${angle} stapled on scores LOW. A concept whose single moment IS the ${angle} experience scores HIGH.${inspirationContext ? `

**+ INSPIRATION MIRRORING (critical sub-criterion):** If a reference ad was injected, the concept MUST visibly mirror the reference's hook archetype, format, and pacing. Concepts that ignore the reference score LOW even if they're otherwise strong.` : ''}

3. **Native Feel & Format Fit (15%)** — Does this concept feel like organic social content that belongs in a TikTok/Reels/Shorts feed? Raw, authentic, native-feeling concepts score HIGHER than polished commercial concepts. Also: does the concept fit in ${duration}? A concept with 4+ beats is too big.

4. **Creative Boldness (15%)** — Is this concept doing something DIFFERENT? Unusual hook, unexpected format, emotional gut-punch, humor, meme-adjacent, or genuinely experimental? Short-form is the creative playground — reward risk-taking over safe formulas.

5. **Goal Clarity (10%)** — Is the concept's goal clear (engagement / awareness / conversion)? All three are valid for short-form; pick concepts that serve ONE clearly, not ones that try to do everything in 15 seconds.

6. **Production Feasibility (10%)** — ${isFullAi ? 'Can this concept actually be generated by current AI text-to-video models? Does it work within the visual constraints of AI generation?' : 'Can this concept actually be built in post-production? Native-style concepts that need only existing footage + text overlays are easiest to produce — reward simplicity.'}` : `1. **Angle-Task Alignment (35%)** — MOST CRITICAL. Does this concept EXCLUSIVELY serve the "${angle}" angle? Not surface-level mention, but structural alignment where the angle IS the concept's core. A ${angle} brief must be ABOUT ${angle} — the specific symptoms, language, fears, and daily reality of that condition. A concept that could work for "comfortable socks in general" with ${angle} stapled on is a REJECTED concept. If you're not certain the concept would FAIL without ${angle}, downrank it.${inspirationContext ? `

**+ INSPIRATION MIRRORING (critical sub-criterion):** A reference ad has been injected by the user for THIS brief. The concept MUST visibly mirror the reference's hook archetype, emotional entry, narrative shape, pacing, and product-bridge timing. A concept that ignores the reference in favor of generic manifesto patterns scores LOW — no matter how "strategically deep" it otherwise feels. The reference is the blueprint, not optional guidance.` : ''}

2. **Hook Strength & Scroll-Stop Power (20%)** — Would the opening 3 seconds stop a scroller who is NOT looking for socks? The hook must create instant recognition ("that's me"), curiosity ("wait, what?"), or emotional response ("I feel that"). Generic health claims or product features do NOT stop scrolls.

3. **Production Feasibility (15%)** — ${isFullAi ? 'Can this concept actually be generated by current AI text-to-video models? Does it work with voiceover-led storytelling, identity-consistent characters, and AI-friendly visual territories? Concepts requiring tight branded product close-ups, multi-person lip-sync, or real-world brand-accurate locations score LOW.' : 'Can this concept actually be built in post-production? Does it work with text overlays, existing footage, voiceover, and product shots? Concepts requiring specific talent, locations, or complex multi-scene narratives score LOW.'}

4. **Creative Freshness (15%)** — Does the concept find a unique entry point? A fresh angle into the "${angle}" territory that hasn't been done a thousand times? Originality in the hook, the metaphor, the scenario, or the emotional frame. If the memory briefing flags recent repetition of this angle, freshness becomes critical.

5. **Strategic Depth (8%)** — Does the concept apply sound marketing psychology (Schwartz awareness architecture, Hopkins specificity, Neumeier differentiation)? Note: this criterion is intentionally lower-weighted. A concept that nails the angle with basic psychology beats a concept that ignores the angle but flaunts theory.

6. **Data Grounding (7%)** — Does the concept cite specific review data (percentages, customer language, measurable claims)? Specific beats generic. But do NOT select a concept JUST because it cites review data if it fails on angle alignment — that's the failure mode we're correcting against.`}

## RESPONSE FORMAT — STRICT:

SELECTED: [number 1-5]

${isUnaware ? `UNAWARE_GATE_CHECK: [For each of the 5 concepts, write one line: "Concept N: PASS" or "Concept N: FAIL — [which Schwartz rule violated OR which beat is missing]". Do this for ALL 5 concepts before stating your selection.]

SUB_PERSONA: [Name the Unaware sub-persona the selected concept targets: "The Normalizer" OR "The Diagnosed Non-Searcher" OR "The Incidental Sufferer"]

UNAWARE_TECHNIQUE: [Name the Unaware technique the selected concept uses: "Scene Identification" OR "The Mundane Reframe" OR "The False Cause Flip"]

FIVE_BEAT_MAPPING: [One line per beat showing how the selected concept maps to the 5-beat Unaware Body Structure:
- Beat 1 (Identification): [what the viewer sees in the opening 0-3s]
- Beat 2 (Reframe): [the "wait, what?" moment]
- Beat 3 (Mechanism): [the invisible cause revealed]
- Beat 4 (Category Reveal): [when/how "a type of sock built for this" appears]
- Beat 5 (Product Reveal): [when Viasox actually appears]
]

REASONING: [5-7 sentences of deep analysis. Explain WHY this concept wins AND why it passes Schwartz's Three Elimination Rules. Reference the specific identification beat, the reframe, and how it avoids the banned Unaware vocabulary. Be specific about why the others failed the Unaware gate — did they name the condition in the hook? Did they open with the product? Did they skip the mechanism beat?]` : `REASONING: [4-6 sentences of deep analysis. Explain WHY this concept wins on the criteria. Reference specific elements of the concept. Explain why the others fell short. Be specific — "Concept 3's hook about morning numbness is stronger than Concept 1's generic pain opening because it names the EXACT sensation and time of day, which creates instant recognition for neuropathy sufferers."]`}

FRAMEWORK_SUGGESTION: [Full framework name from the list above — e.g., "The Contrast Framework"${isUnaware ? '. NOTE: For Unaware briefs, strongly prefer "The Gradualization (Schwartz)" framework — it maps natively to the 5-beat Unaware structure.' : ''}${shortForm ? '. NOTE: For short-form (1-15 sec), you may suggest "No Framework (Pure Moment)" if the concept works better without a traditional narrative arc. This is a valid choice for short-form only.' : ''}]

FRAMEWORK_REASONING: [2-3 sentences explaining why this specific framework best serves the selected concept's narrative arc and the "${angle}" angle${isUnaware ? ', AND how it supports the 5-beat Unaware body structure' : ''}${shortForm ? '. For short-form, if you chose "No Framework", explain what structural approach the concept uses instead (single moment, visual contrast, provocation, native clip, etc.)' : ''}]`;

  const productData = getProductAnalysis(analysis, productCategory);
  const user = `## BRIEF CONTEXT
- Task: ${taskName}
- Health Angle: ${angle}
- Product: ${product} (${productCategory})
- Medium: ${medium} (${duration})
- Funnel: ${funnelStage} | Awareness: ${awarenessLevel} | Ad Type: ${adType}
- Offer: Buy 2, Get 3 Free (5 pairs for $60)
${isUnaware ? `
## CRITICAL: THIS IS AN UNAWARE BRIEF

The audience does NOT know they have a problem. They've normalized sock marks, tight ankles, tingling, and circulation issues as "just life," "just getting older," or "just a long day." You are evaluating concepts that must obey Schwartz's Three Elimination Rules and map to the 5-beat Unaware body structure.

**Remember — review data is POST-education.** Reviews are written by customers who already understand the problem AND the solution. Unaware viewers haven't had that education yet. A hook that says "finally no sock marks!" reads as resolved — it's a Problem Aware/Solution Aware hook, NOT an Unaware hook. When evaluating concepts, look for:
- Hooks that show a SCENE the viewer recognizes BEFORE recognition ("the line across your calf when you take off your socks")
- Reframes that overturn a normalized assumption ("you thought that was just what your ankles looked like")
- Mechanism beats that reveal an invisible cause ("your socks are compressing the exact veins that drain your ankles")
- Category reveals BEFORE product reveals ("there's a type of sock built to prevent this")

Reject pitchy openings. Reject medical vocabulary in Beat 1. Reject any concept where the product appears before Beat 5.` : ''}

## PRODUCT REVIEW DATA
${productData}

## THE 5 CONCEPTS TO EVALUATE

${concepts}

## YOUR TASK

Take your time. Read each concept carefully — twice.${isUnaware ? ` Apply the **UNAWARE GATE** first to reject concepts that violate Schwartz's Three Elimination Rules. Then think about:
1. Which concept's IDENTIFICATION beat most strongly triggers "that's me" recognition WITHOUT naming the condition?
2. Which concept has the cleanest 5-beat mapping (Identification → Reframe → Mechanism → Category Reveal → Product Reveal)?
3. Which concept cleanly targets one of the 3 Unaware sub-personas (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer)?
4. Which concept can actually be ${isFullAi ? 'generated by AI text-to-video' : 'PRODUCED as an Ecom editing-style ad'} — with the product held back until the final beat?
5. Which concept avoids the review-language trap (no "finally no marks!" hooks, no resolved-problem openings)?` : ` Think about:
1. Which concept OWNS the "${angle}" angle most deeply?
2. Which concept can actually be PRODUCED as an Ecom editing-style ad?
3. Which concept has the strongest scroll-stopping hook?
4. Which concept demonstrates the deepest strategic thinking?
5. Which concept uses the most specific, data-grounded proof points?`}

Then select the SINGLE best concept.`;

  // Inject memory briefing if available
  let memorySection = '';
  if (memoryBriefing) {
    memorySection += `\n\n## CREATIVE INTELLIGENCE — INSTITUTIONAL MEMORY\n\n**RELEVANCE RULE:** The memory below is a reference library, not a blacklist. Favor concepts that genuinely serve THIS brief's talking point, duration, product, and inspiration. A concept that mirrors recent territory is FINE if it serves the current parameters well — the failure mode you're guarding against is IRRELEVANCE (generic manifesto patterns with the talking point stapled on), not repetition. When you see past approaches that underperformed (scores ≤5), use that as a signal to prefer concepts that do something meaningfully better on similar parameters.\n\n${memoryBriefing}`;
  }
  if (angleHistory) {
    memorySection += `\n\n## PAST CREATIVE DECISIONS FOR "${angle}" ANGLE\n\nThe following table shows every brief previously produced for the "${angle}" angle. Use this for context on what's been tried and how it performed. Concepts that worked before (high scores) can inform your selection — similar territory is OK if it serves the current brief. Concepts that underperformed are worth rethinking. Do NOT downrank a concept just because it shares territory with a recent brief; only downrank if it fails the relevance test for THIS brief's specific parameters.\n\n${angleHistory}`;
  }

  // Inject inspiration bank context if available
  const inspirationSection = inspirationContext ? `\n\n${inspirationContext}` : '';

  return { system: system + memorySection + inspirationSection, user };
}

function getAngleContext(angle: string): string {
  const contexts: Record<string, string> = {
    'Neuropathy': `Neuropathy is nerve damage — most commonly diabetic peripheral neuropathy. Customers describe: tingling, numbness, burning sensation in feet, "pins and needles," loss of feeling, hypersensitivity to touch/pressure. The fear is PROGRESSION — will I lose feeling entirely? Will I need amputation? The daily reality: can't feel their feet properly, afraid of injury they won't notice, struggle with tight socks that compress damaged nerves. Viasox's value: non-binding comfort that doesn't aggravate nerve pain, gentle compression that supports without squeezing damaged tissue. Key customer language: "numbness," "tingling," "burning," "neuropathy," "nerve pain," "diabetic," "can finally feel comfortable," "doesn't squeeze."`,

    'Swelling': `Swelling (edema) is fluid retention in legs, ankles, and feet. Customers describe: puffy ankles by end of day, shoes getting tight, visible indentation when pressing skin, legs feeling heavy and tight. Common causes: pregnancy, standing jobs, heart conditions, medication side effects, long flights. The fear is VISIBILITY — swollen ankles are noticeable, embarrassing, and signal declining health. The daily reality: can't wear favorite shoes, legs ache by afternoon, sock marks that take hours to fade. Viasox's value: graduated compression that helps circulation, non-binding tops that don't create marks on already-swollen legs. Key customer language: "swelling," "edema," "puffy," "fluid retention," "heavy legs," "sock marks," "no marks," "finally no indentation."`,

    'Diabetes': `Diabetes foot care is a critical medical concern. Customers describe: need for non-binding socks that don't restrict circulation, fear of foot ulcers and infections, need for seamless toe construction, moisture management. The fear is MEDICAL CONSEQUENCES — diabetic foot complications lead to amputation more than any other cause. The daily reality: checking feet daily for wounds they can't feel, avoiding anything that restricts blood flow, doctors telling them to wear specific socks. Viasox's value: diabetic-safe design (non-binding, seamless, moisture-wicking) that also looks and feels like normal socks — not medical devices. Key customer language: "diabetic," "blood sugar," "circulation," "non-binding," "doctor recommended," "seamless," "foot care," "safe for diabetics."`,

    'Varicose Veins': `Varicose veins are enlarged, twisted veins visible through the skin — most commonly in legs. Customers describe: visible blue/purple veins, aching and heaviness in legs, self-consciousness about appearance, spider veins spreading. The fear is both COSMETIC and MEDICAL — they look bad AND signal circulatory problems. The daily reality: avoiding shorts/skirts, legs aching after standing, compression stockings that are ugly and uncomfortable. Viasox's value: compression support that helps circulation AND looks stylish — medical function without medical-device appearance. Key customer language: "varicose veins," "spider veins," "visible veins," "heavy legs," "aching," "appearance," "finally look normal," "support without the ugly."`,
  };

  return contexts[angle] ?? `Health condition: ${angle}. Focus on the specific symptoms, daily impact, fears, and customer language associated with this condition. The concept must demonstrate deep understanding of what living with ${angle} actually feels like — not just surface-level awareness.`;
}

/**
 * Parse the selector's response into structured data.
 *
 * When the brief is Unaware the selector emits extra fields:
 * - UNAWARE_GATE_CHECK
 * - SUB_PERSONA
 * - UNAWARE_TECHNIQUE
 * - FIVE_BEAT_MAPPING
 *
 * These are surfaced for memory / downstream prompting; callers that don't
 * care can ignore them.
 */
export function parseSelectorResponse(response: string): {
  selectedIndex: number;
  reasoning: string;
  framework: string;
  unawareGateCheck?: string;
  unawareSubPersona?: string;
  unawareTechnique?: string;
  fiveBeatMapping?: string;
} {
  const selectedMatch = response.match(/SELECTED:\s*(\d)/);
  const reasoningMatch = response.match(/REASONING:\s*([\s\S]+?)(?=FRAMEWORK_SUGGESTION|$)/);
  const frameworkMatch = response.match(/FRAMEWORK_SUGGESTION:\s*(.+)/);
  const gateMatch = response.match(/UNAWARE_GATE_CHECK:\s*([\s\S]+?)(?=\n(?:SUB_PERSONA|UNAWARE_TECHNIQUE|FIVE_BEAT_MAPPING|REASONING|FRAMEWORK_SUGGESTION|$))/);
  const subPersonaMatch = response.match(/SUB_PERSONA:\s*(.+)/);
  const techniqueMatch = response.match(/UNAWARE_TECHNIQUE:\s*(.+)/);
  const beatsMatch = response.match(/FIVE_BEAT_MAPPING:\s*([\s\S]+?)(?=\n(?:REASONING|FRAMEWORK_SUGGESTION|$))/);

  return {
    selectedIndex: selectedMatch ? parseInt(selectedMatch[1], 10) : 1,
    reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'Selected as the strongest overall concept.',
    framework: frameworkMatch ? frameworkMatch[1].trim() : 'PAS (Problem-Agitate-Solution)',
    unawareGateCheck: gateMatch ? gateMatch[1].trim() : undefined,
    unawareSubPersona: subPersonaMatch ? subPersonaMatch[1].trim() : undefined,
    unawareTechnique: techniqueMatch ? techniqueMatch[1].trim() : undefined,
    fiveBeatMapping: beatsMatch ? beatsMatch[1].trim() : undefined,
  };
}
