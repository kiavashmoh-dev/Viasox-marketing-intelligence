/**
 * Factory V2 — prompt builders.
 *
 * Every builder returns { system, user } for the V2 engine. Design rules:
 *
 * 1. THE CONTEXT PACK IS IMMUTABLE. Every generation and regeneration call
 *    receives the same frozen foundation (brand truth, awareness gates,
 *    claim boundary, product truth, UGC voice DNA, framework spec). Lines
 *    change; the truth they serve cannot.
 * 2. THE FEEDBACK LEDGER RIDES ALONG. Every piece of human feedback ever
 *    given on a brief is re-injected into every subsequent call for that
 *    brief. Newest feedback is law; older feedback remains binding context.
 * 3. STRUCTURED OUTPUT ONLY. All generation steps emit strict JSON matching
 *    the V2 data model — no markdown parsing, no regex archaeology.
 * 4. TARGETS ARE HUMAN-ADDRESSABLE. Regen prompts name the target the way
 *    a human would ("clip 4 script line") and quote its current text —
 *    internal ids never reach the model.
 */

import type { AwarenessLevel, ScriptFramework } from '../engine/types';
import { buildSystemBase } from './../prompts/systemBase';
import { getAwarenessScriptGuide, getAwarenessConceptGuide } from './../prompts/awarenessGuide';
import { getSchwartzStateBlock } from './../prompts/schwartzStates';
import { getProductTruthBlock } from './../prompts/productTruth';
import { getClaimBoundaryBlock } from './../prompts/claimBoundary';
import { getUgcVoiceDna } from './../prompts/ugcVoiceDna';
import { getMarketingBrainBlock } from './../prompts/marketingBrain';
import { DURATION_TARGETS } from './../prompts/creativeConstraints';
import { FRAMEWORK_DETAILS } from './../prompts/scriptPrompt';
import type {
  UgcBriefV2,
  V2Brainstorm,
  V2Concept,
  V2RegenTarget,
  V2Task,
} from './v2Types';
import {
  UGC_FRAMEWORKS,
  ECOM_FRAMEWORKS,
  V2_HOOK_COUNT,
  CTA_PERFORMANCE_NOTE,
  describeTarget,
  currentTargetText,
  taskAdType,
} from './v2Types';
import { getUgcStyle, getUgcStyleBlock } from './ugcStyles';
import { getEcomCraftDna } from './../prompts/ecomCraftDna';
import { getEcomFootageLibraryBlock } from './../prompts/ecomFootageLibrary';
import { getPainBankBlock } from './../prompts/painBank';
import { getAuthorityPlaybookBlock } from './../prompts/authorityPlaybook';
import { getSalesArgumentBlock, productArgumentBlock } from './../prompts/salesArgument';
import { getTasteFileBlock } from './../prompts/tasteFile';
import { getEcomSystemBase } from './../prompts/ecomSystemBase';
import { getCmoReviewProtocolBlock } from './../prompts/cmoReviewProtocol';
import { getAiLifestyleSpecBlock } from './../prompts/aiLifestyleSpec';
import { getAiAnimationSpecBlock } from './../prompts/aiAnimationSpec';
import { taskEcomProduction, type V2EcomProduction } from './v2Types';

// ─── Shared fragments ───────────────────────────────────────────────────────

/**
 * The director's batch instructions as a top-priority block, with the
 * OCCASION-AS-CREATIVE-FUEL doctrine attached. The doctrine is self-gating
 * ("whenever the instructions name an occasion…") so it costs nothing on
 * occasion-free batches and binds hard on occasion batches.
 */
export function renderDirectorInstructions(instructions?: string): string {
  const trimmed = (instructions ?? '').trim();
  if (!trimmed) return '';
  return `
## CREATIVE DIRECTOR'S BATCH INSTRUCTIONS — HIGHEST PRIORITY

<creative_direction>
${trimmed}
</creative_direction>

## OCCASION AS CREATIVE FUEL (binding whenever the instructions name a holiday, occasion, sale event, or cultural moment)

Surface-level occasion marketing is BANNED. "Buy these during our [occasion] sale" with a themed
sticker on an ordinary ad is an automatic failure. When an occasion is in play, you connect to it at
the DEEPEST level available — the goal is RAPPORT with people who celebrate it, through every layer
you control:
- **STORYTELLING:** the concept's story happens INSIDE the occasion's real rituals and meaning — the
  day's moments are the plot, not a backdrop mentioned once.
- **VISUALS & ENVIRONMENT:** scenes, settings, and props from how people ACTUALLY celebrate (the
  backyard barbecue, the flag on the porch, the folding chairs, the last long weekend of summer) —
  this is licensed scene territory: shot descriptions should place the creator in the occasion's
  world.
- **CREATORS / CASTING:** who the creator IS on that day (the host who's been on her feet since 6am,
  the nurse finally off shift for the long weekend, the grandmother running the family cookout) —
  write the persona as a participant in the occasion, and say so in the creator-facing directions.
- **SCRIPT FRAMEWORKS:** choose and execute the framework that lets the occasion breathe as a story
  (a day-in-life through the holiday, a confession at the cookout) rather than one that reduces it
  to an announcement.
- **MEANING:** mine what the occasion HONORS and fuse it with our truths where they genuinely
  connect (a holiday honoring workers belongs to people who spend their lives on their feet — our
  exact customers). Meaning-level connection beats decoration-level connection every time.

RULES: the occasion innovates the SCENE, STORY, CASTING, and MEANING. The claims stay inside the
claim boundary; the awareness level still governs brand/offer timing; the UGC style still governs
delivery grammar. THE TEST: someone who celebrates that day should feel the ad UNDERSTANDS the day —
never that a sale was stapled to it.
`;
}

const JSON_CONTRACT = `## OUTPUT CONTRACT — STRICT JSON ONLY

Respond with ONE JSON object and nothing else: no markdown fences, no commentary before or after.
Every string value is plain text (no markdown headers inside values). Inside string values use
single quotes for quoted speech or product names — never an unescaped double quote (if you must
write one, escape it as \\"). Never put a raw line break inside a string value. Put a comma between
every array element and every property; no trailing commas. Emit the COMPLETE object — never stop
mid-array or mid-string. Invalid JSON is a failed generation.`;

function durationBudget(duration: V2Task['duration']): string {
  const t = DURATION_TARGETS[duration];
  if (!t) return '';
  // V2 is UGC-only and UGC speaks: override the generic short-form "text-only
  // allowed" VO rule, which the V2 output contract cannot express.
  const voRule =
    duration === '1-15 sec'
      ? 'Short-form UGC still SPEAKS: one creator, spoken lines — no silent text-only cuts in V2.'
      : t.voRule;
  return `Duration: ${duration}. Word budget: sweet spot ${t.sweetSpot}, HARD ceiling ${t.hardCeiling} words of spoken content, max runtime ${t.maxSeconds}s. ${voRule} (The tool historically overshoots 20-30% — write tight. TIGHT MEANS FEWER THOUGHTS, never amputated sentences: dropping "so/and/that's/I've" to save words produces telegraphic written-copy fragments a creator cannot speak naturally. Cut a beat, never the connective tissue.)`;
}

/** Ecom long-form: the '60-90 sec' selection is the LONG-FORM tier for ecom
 *  (CMO ruling, Aug 2026 — the story needs 90+ seconds to establish a person,
 *  real stakes, and an earned reveal). Single source of truth for the prompt
 *  line AND validateBrief's ceiling. ~2.3 spoken words/sec. */
export const ECOM_LONGFORM = { sweetSpot: '260-330 words', hardCeiling: 360, maxSeconds: 150 } as const;

/** Ecom duration line: same budgets and the same anti-telegraphese rule, but
 *  the UGC "still SPEAKS" short-form override is replaced by the ecom mode
 *  rule — overlay-carried IS native ecom short-form. */
function ecomDurationBudget(duration: V2Task['duration']): string {
  const t = DURATION_TARGETS[duration];
  if (!t) return '';
  if (duration === '60-90 sec') {
    return `Duration: LONG-FORM (the '60-90 sec' selection runs 90-150s for ecom — this cycle's mainline format). Word budget: sweet spot ${ECOM_LONGFORM.sweetSpot}, HARD ceiling ${ECOM_LONGFORM.hardCeiling} words of spoken VO, max runtime ${ECOM_LONGFORM.maxSeconds}s. THIS LINE IS THE ONLY CEILING FOR THIS BRIEF — it supersedes any generic length-calibration table elsewhere in this prompt (plan.beatMap's 'ceiling Cw' means THIS ceiling). Mode rule: VO-NARRATED — one narrator carries the whole runtime. Length is leverage AND exposure: every beat must escalate, and the word budget is spent on the VALLEY and the seams, never on padding. (TIGHT MEANS FEWER THOUGHTS, never amputated sentences: this VO is read VERBATIM by an AI voice, and a telegraphic line comes out sounding like a robot. Cut a beat, never the connective tissue.)`;
  }
  const modeRule =
    duration === '1-15 sec'
      ? 'Mode rule: at this length OVERLAY-CARRIED is native (the on-screen text does the selling, minimal or no VO) — VO-NARRATED remains legal when the concept needs a narrator.'
      : 'Mode rule: VO-NARRATED is the default at this length; the word budget is the VOICEOVER budget.';
  return `Duration: ${duration}. Word budget: sweet spot ${t.sweetSpot}, HARD ceiling ${t.hardCeiling} words of spoken VO, max runtime ${t.maxSeconds}s. THIS LINE IS THE ONLY CEILING FOR THIS BRIEF (plan.beatMap's 'ceiling Cw' means this ceiling). ${modeRule} (The tool historically overshoots 20-30% — write tight. TIGHT MEANS FEWER THOUGHTS, never amputated sentences: this VO is read VERBATIM by an AI voice, and a telegraphic line comes out sounding like a robot. Cut a beat, never the connective tissue.)`;
}

/** Per-awareness-level CTA policy — keeps the JSON shape from contradicting
 *  the awareness doctrine composed into the same prompt. */
function ctaPolicyLine(level: AwarenessLevel): string {
  switch (level) {
    case 'Unaware':
      return `exactly 2 CTA options, BOTH soft discovery CTAs per the Unaware rules — no price, no offer, no "buy" (e.g. "See what 107K people found." / "See if it's for you.")`;
    case 'Problem Aware':
      return `exactly 2 CTA options: one medium-soft solution-led CTA ("Try your first pair"), one soft alternative — the offer may be mentioned but is never the driver`;
    default:
      return `exactly 2 CTA options: one offer + risk-reversal CTA, one soft alternative path`;
  }
}

/** Ecom CTA policy — CMO ruling 2026-08-28 (supersedes the old Unaware
 *  exception, confirmed across four brief reviews): the offer rides EVERY
 *  ecom close, Unaware included — an offer-less "go see what reviewers
 *  found" close is a weak CTA at any level. The Unaware release order still
 *  governs everything BEFORE the close (no early brand/category), and the
 *  close must never undercut its own bundle. */
function ecomCtaPolicyLine(level: AwarenessLevel): string {
  switch (level) {
    case 'Unaware':
      return `exactly 2 CTA options, BOTH carrying THE OFFER stated plainly (Buy 2 Get 3 Free — five pairs for sixty dollars, twelve a pair) + a DIRECT action, arriving only AT the close (the release order still governs everything before it) — in the narrator's voice, never an announcer's, never undercutting the bundle (no bare "start with one"; low-commitment framing lives INSIDE the offer: "start with one pair tomorrow and see why you'll be glad you have four more")`;
    default:
      return `exactly 2 CTA options, BOTH carrying THE OFFER stated plainly (offer math verbatim from the brand facts) + a DIRECT action, closed in the narrator's voice at the story's pace (the seam rule binds — no announcer switch); a thesis echo is one proven close, not a requirement — close the way THIS story closes; never undercut the bundle (low-commitment framing lives INSIDE the offer, per the sales-argument doctrine)`;
  }
}

/**
 * THE ECOM AWARENESS CORE — the complete awareness doctrine for ecom, as one
 * compact block (Sep 2026 writer-diet rewrite). This REPLACES the full V1-era
 * awareness guide + the Schwartz state block + the "CMO corrections" override
 * layer in the ecom pack: the old stack forced the model to resolve
 * contradictions between the guide's machinery (elimination rules, hook-style
 * rosters, release-gate sequences, entry zones) and the CMO's rulings — and
 * it resolved them to a vague, flat middle. Deletion, not override: what
 * binds is written once, here. (UGC packs still use the full guide —
 * zero-diff untouched.)
 */
function ecomAwarenessCore(level: AwarenessLevel): string {
  const perLevel: Record<AwarenessLevel, string> = {
    Unaware: `THIS TASK IS UNAWARE: only LABELS wait — the condition name, the product category, and the
brand stay out of the OPENING and release in that order as the argument earns them, with the brand
named in the VO by the reveal (never end-card-only). Everything else is as concrete as any other
ad: the symptom, the scene, the stakes, and the value of watching land IMMEDIATELY ("heavy,
swollen legs" is a symptom, not a label — it belongs in the hook). Delay is BOUNDED: it must be
paid for beat-by-beat in curiosity that connects to the coming reveal — never hide the product for
ten scenes, and never starve the product half (the proportion law binds here like everywhere).
The OFFER belongs in the close (the release order governs everything before the close, not the
close itself). (Translation note: where any block below says product language lives in "Beats
3-5" or refers to "the opening's elimination rules", read it as: the LABELS — brand, category,
condition name — wait until the release order opens; ecom has no numbered beat scheme and the
symptom is never eliminated.)`,
    'Problem Aware': `THIS TASK IS PROBLEM AWARE: she knows the pain; she has NOT connected it to its everyday
source. Name her exact symptom in her own words immediately, then do the ad's real job —
identify the everyday source of the problem and argue the mechanism. Never assume she already
understands the product category or knows Viasox. No price or offer in the hook (the offer lives
in the close).`,
    'Solution Aware': `THIS TASK IS SOLUTION AWARE: she knows the category; she doesn't know why OURS. Differentiation
leads — acknowledge the problem in a breath, then name what she has already tried or considered
and answer that skepticism with a concrete mechanism (never a bare "we're better"; never name a
competitor). Proof density high. No offer in the hook.`,
    'Product Aware': `THIS TASK IS PRODUCT AWARE: she knows Viasox — give her something NEW, fast. Brand up front,
one deep proof point or story argued fully (one powerful story beats five bullets), direct CTA.
Never re-introduce the product from zero.`,
    'Most Aware': `THIS TASK IS MOST AWARE: she's ready — the offer IS the message. Product, brand, and the exact
deal up front; the body only removes friction; the most direct CTA of any level. No education, no
problem re-opening.`,
  };
  return `## THE AWARENESS CORE (ecom — the complete awareness doctrine; nothing above or below overrides it)
CONCRETENESS IS UNIVERSAL: "TOF" describes the AUDIENCE we target — it never means the writing is
vague. At every level the hook names a recognizable problem in the viewer's world and opens a
concrete loop; within ~10 seconds the right viewer thinks "this is about me" from at least two
concrete, showable details.
${perLevel[level]}`;
}

/**
 * The immutable ECOM context pack — the ecom sibling of the UGC pack below.
 * Same censors, same product truth; the UGC style layer and voice DNA are
 * replaced by the ecom craft DNA + production law, the full awareness guide
 * is replaced by the compact AWARENESS CORE, and the reviewer's thought
 * process rides along as the TASTE FILE (Sep 2026 writer diet: the writer
 * carries the censors, the argument laws, and the taste — the exhaustive
 * rule net lives in the Final Review critic).
 */
function buildEcomContextPack(task: V2Task, _stage: 'concept' | 'script' = 'script'): string {
  const production = taskEcomProduction(task);
  const adTypeLine =
    production === 'ai-lifestyle'
      ? `- AD TYPE: ECOM (editing brief), PRODUCTION: AI LIFESTYLE — every scene is GENERATED
  (nothing filmed, nothing pulled from the library) yet must be indistinguishable from real UGC:
  real-looking people, phone-camera grammar. The AI VOICE reads the script VERBATIM; each row's
  visual cell is a GENERATION PROMPT. The brief must declare its MODE (VO-narrated or
  overlay-carried) via its rows.`
      : production === 'ai-animation'
        ? `- AD TYPE: ECOM (editing brief), PRODUCTION: AI ANIMATION — every scene is a GENERATED
  ANIMATION in ONE declared style (claymation etc. — no real faces, no pretend-UGC). The SCRIPT
  is unchanged: one person's story, read VERBATIM by the AI voice; each row's visual cell is a
  GENERATION PROMPT for an animated scene. The brief must declare its MODE (VO-narrated or
  overlay-carried) via its rows.`
        : `- AD TYPE: ECOM (editing brief) — built ENTIRELY from existing library footage + AI voiceover.
  Nothing gets filmed; no creator performs it. The EDITOR assembles it and the AI VOICE reads the
  script VERBATIM. The brief must declare its MODE (VO-narrated or overlay-carried) via its rows.`;
  return `${getEcomSystemBase()}

# ═══ FACTORY V2 ECOM CONTEXT PACK (IMMUTABLE — every generation obeys all of it) ═══

## THIS TASK
- Task: ${task.parsed.name}
- Product line: ${task.product}
- Talking point / angle (hierarchy rank #1 — the subject of the ad): ${task.talkingPoint}
- Awareness level: ${task.awarenessLevel}
${adTypeLine}
- ${ecomDurationBudget(task.duration)}

${getSalesArgumentBlock(task.product)}

${getTasteFileBlock()}

${ecomAwarenessCore(task.awarenessLevel)}

${getProductTruthBlock(task.product)}

${getClaimBoundaryBlock(task.product)}

${getPainBankBlock(task.product)}

${getEcomCraftDna()}

${getAuthorityPlaybookBlock()}

${production === 'ai-lifestyle' ? getAiLifestyleSpecBlock() : production === 'ai-animation' ? getAiAnimationSpecBlock() : getEcomFootageLibraryBlock()}

## PRODUCT ENTRY (binding)
There are no percentage zones: THE ARGUMENT decides when the product enters, and the PROPORTION
LAW binds — the product argument gets equal or more time than the problem build, at every
awareness level. Visual presence may run ahead of verbal entry — EXCEPT at Unaware, where the
release ORDER governs both channels (see the Awareness Core).
${task.pinnedInspirationId ? task.exemplarRole === 'remake' ? `- 🎬 REMAKE MODE: this brief REMAKES the governing example. When its "REMAKE SOURCE — THE
  GOVERNING EXAMPLE" block is present in the conversation (if it is absent, the pin could not be
  loaded — write as a normal brief and flag it in the plan), the example's argument order, claim cadence, proof
  placement, structure, hook shape, and register ARE the spec — mirrored nearly 1:1 with Viasox
  truth substituted. Where any craft guidance in this pack disagrees with the example, THE EXAMPLE
  WINS. Never yields: brand facts, the claim boundary, the Awareness Core's label/offer rules, the
  verbatim-to-VO law, and the production law.` : `- ⭐ PINNED-EXEMPLAR EXCEPTION: a finished-project exemplar is pinned for this task. When its
  "PINNED EXEMPLAR — THE STRUCTURAL AUTHORITY" block is present in the conversation, that
  exemplar's dissected beat map GOVERNS structure, framework choice, product-entry timing, and
  product-talk share. The censors never yield: brand facts, the claim boundary, and the awareness
  level's label/offer rules bind in full.` : ''}

## THE PRODUCT PAYOFF ARC (binding at every awareness level)
From the moment the product verbally enters until the CTA, the script is in its PAYOFF ARC — the
stretch the entire script was walking toward. Four stations, NONE skipped, at any level or duration:
1. ENTRY MOMENT — the product arrives as an EVENT in the argument (the bridge line + a reveal
   visual), never a name-drop in passing.
2. MECHANISM — show HOW it answers the exact pain this script named. In-bank attributes only.
3. SHOWN PROOF — demonstrated on camera AND believable: outcomes felt-scale and scene-specific,
   the demonstration doing its work BEFORE the result is stated so the result feels earned —
   never a manufactured absolute.
4. PAYOFF LINE — the line that lands the product as THE answer, placed before the CTA.
The concept's committed product truth is the SPINE of the arc; up to 2-3 additional in-bank
attributes may reinforce it — never an invented claim, never a swap of the spine.

## THE CRAFT LICENSE — THE MEDIUM IS NOT THE CEILING
Everything above is the MEDIUM: modes, registers, pacing guidance, structural defaults. The medium
serves the script — never the reverse. When you can build a DEMONSTRABLY better ad by stepping
slightly outside a register norm, a pacing default, or a structural convention, build the better ad
and name the deviation in your plan in one line ("deviating from X because Y"). "Better" means: a
more gripping opening, harder shown proof, tighter line-to-line flow, and above all a MORE
SATISFYING PRODUCT PAYOFF. A late verbal entry is legitimate strategy; a starved payoff is a failed
script at EVERY awareness level.
NEVER flexible, at any quality bar: brand facts, the claim boundary, the Awareness Core's
label/offer rules, the Unaware release ORDER, banned phrases, the hard duration ceiling, and
${production === 'ai-lifestyle' ? 'the AI-lifestyle casting law (demographic-exact faces, persona consistency)' : production === 'ai-animation' ? 'the AI-animation style/character laws (one declared style, character model consistency, dignified never mocking)' : "the footage library's negative list"}.

# ═══ END ECOM CONTEXT PACK ═══`;
}

/**
 * The immutable context pack. `stage` picks the right awareness guide so
 * concept generation doesn't carry the full script architecture on top of
 * the concept doctrine (they were previously stacked — pure token waste).
 * Branches per ad type: ecom tasks get the ecom pack; the UGC path below is
 * byte-identical to the pre-ecom build (zero-diff guarantee).
 */
export function buildV2ContextPack(task: V2Task, stage: 'concept' | 'script' = 'script'): string {
  if (taskAdType(task) === 'ecom') return buildEcomContextPack(task, stage);
  const awarenessGuide =
    stage === 'concept'
      ? getAwarenessConceptGuide(task.awarenessLevel)
      : getAwarenessScriptGuide(task.awarenessLevel);
  return `${buildSystemBase()}

# ═══ FACTORY V2 CONTEXT PACK (IMMUTABLE — every generation obeys all of it) ═══

## THIS TASK
- Task: ${task.parsed.name}
- Product line: ${task.product}
- Talking point / angle (hierarchy rank #1 — the subject of the ad): ${task.talkingPoint}
- Awareness level: ${task.awarenessLevel}
- UGC STYLE: ${getUgcStyle(task.ugcStyle).name} — the delivery grammar for this entire brief (full guide below)
- ${durationBudget(task.duration)}
- Ad type: UGC (User Generated Content) — a real creator filming themselves on their phone.

${getUgcStyleBlock(task.ugcStyle)}

${awarenessGuide}

${getSchwartzStateBlock(task.awarenessLevel)}

${getProductTruthBlock(task.product)}

${getClaimBoundaryBlock(task.product)}

${getUgcVoiceDna()}

## PRODUCT-ENTRY × AWARENESS (binding)
The voice DNA's two product-entry patterns are constrained by this task's awareness level. The
entry ZONES below are the defaults for unpinned tasks — a pinned exemplar's beat map overrides
the zones, and the CRAFT LICENSE may justify a small NAMED deviation:
- Unaware → EARNED ENTRY only; the product lands in the final beats per the release order (the
  release ORDER itself is hard doctrine, never a default).
- Problem Aware → earned entry by DEFAULT, with the product entering MID-SCRIPT — inside the
  ~30-45% zone of runtime — followed by a full mechanism + proof cascade. PRODUCT-FORWARD is also
  LEGAL here when the style, pinned exemplar, or concept genuinely calls for the brand in the
  opening. A product that first appears one line before the CTA is a FAILED Problem Aware script,
  not a cautious one.
- Solution Aware → either pattern; the product enters inside the first ~30% of runtime.
- Product Aware / Most Aware → PRODUCT-FORWARD only (the brand belongs in the first ~3 seconds).
${task.pinnedInspirationId ? `- ⭐ PINNED-EXEMPLAR EXCEPTION: a finished-project exemplar is pinned for this task. When its
  "PINNED EXEMPLAR — THE STRUCTURAL AUTHORITY" block is present in the conversation, that
  exemplar's dissected beat map GOVERNS structure, framework choice, product-entry timing, and
  product-talk share — the timing defaults above and the style guide's pacing norms yield to it.
  The censors never yield: brand facts, the claim boundary, and the awareness level's
  vocabulary/offer bans bind in full.` : ''}

## THE PRODUCT PAYOFF ARC (binding at every awareness level)
From the moment the product enters until the CTA, the script is in its PAYOFF ARC — the stretch
the entire script was walking toward (Schwartz: the product is the goal-conclusion of the
gradualized argument). The arc has four stations and NONE may be skipped, at any level or duration:
1. ENTRY MOMENT — the product arrives as an EVENT in the story (shown, discovered, handed over),
   never a name-drop in passing.
2. MECHANISM — show HOW it answers the exact pain this script named. In-bank attributes only.
3. LIVED PROOF — the creator's own before/after moment, timeline, or on-camera demonstration.
4. PAYOFF LINE — the line that lands the product as THE answer, placed before the CTA.
Minimum PRODUCT AIRTIME (share of total runtime from the entry moment to the end of the ad):
Unaware ≥15% · Problem Aware ≥45% · Solution Aware ≥60% · Product/Most Aware ≥80%.
The concept's committed product truth is the SPINE of the arc. The writer may reinforce it with up
to 2-3 additional attributes from the product truth bank when the arc needs them — never an
invented claim, never a swap of the spine.

## THE CRAFT LICENSE — THE MEDIUM IS NOT THE CEILING
Everything above is the MEDIUM: styles, pacing guidance, framework leanings, structural defaults.
The medium serves the script — never the reverse. When you can write a DEMONSTRABLY better script
by stepping slightly outside a style norm, a pacing default, or a structural convention, write the
better script and name the deviation in your plan in one line ("deviating from X because Y").
"Better" means: a more gripping opening, more concrete lived scenes, tighter line-to-line flow, and
above all a MORE SATISFYING PRODUCT PAYOFF — once the product enters, it must get established as
THE clear answer the whole script was walking toward (Schwartz: the product is the goal-conclusion
of the gradualized argument; proof is placed exactly where the viewer is begging for it; the close
lands as a payoff). A late entry is legitimate strategy; a starved payoff is a failed script at
EVERY awareness level.
NEVER flexible, at any quality bar: brand facts, the claim boundary, the awareness level's
vocabulary/offer bans, the Unaware release ORDER, banned phrases, and the hard duration ceiling.

# ═══ END CONTEXT PACK ═══`;
}

/** Serialize the ledger for prompt injection. Newest last (= most binding). */
export function renderLedger(brief: UgcBriefV2): string {
  if (brief.feedbackLedger.length === 0) return '';
  const lines = brief.feedbackLedger
    .map((f, i) => `${i + 1}. [on ${f.target}] ${f.feedback}`)
    .join('\n');
  return `\n## FEEDBACK LEDGER — EVERY ENTRY IS BINDING ON EVERY LINE YOU WRITE\n\nThe human has given the following feedback on this brief. ALL of it applies to everything you generate from now on (not just the line it originally targeted). Later entries take precedence when entries conflict.\n\n${lines}\n`;
}

/** Compact, complete serialization of the current brief for regeneration calls. */
export function renderBriefState(brief: UgcBriefV2): string {
  const isEcom = taskAdType(brief.task) === 'ecom';
  const rows = brief.storyboard
    .map((r) => {
      const ref =
        r.reference.kind === 'frame'
          ? 'reference frame assigned'
          : r.reference.kind === 'same-as'
            ? `Same as clip ${r.reference.clipNumber}`
            : `none (${r.reference.reason})`;
      return isEcom
        ? `| ${r.clipNumber} | ${r.scriptLine} | ${r.overlayText || '-'} | ${r.shotType} | ${r.shotDescription} | ${ref} | ${r.editorNotes || '-'} |`
        : `| ${r.clipNumber} | ${r.audioType} | ${r.scriptLine} | ${r.shotType} | ${r.shotDescription} | ${ref} | ${r.editorNotes || '-'} |`;
    })
    .join('\n');
  if (isEcom) {
    return `## CURRENT BRIEF STATE (complete)

- Task: ${brief.taskName} | Product: ${brief.task.product} | Talking point: ${brief.task.talkingPoint}
- Awareness: ${brief.task.awarenessLevel} | Ad type: ECOM (editing brief — the VO is read verbatim by an AI voice)${taskEcomProduction(brief.task) === 'ai-lifestyle' ? ' | Production: AI LIFESTYLE (generated, must look like real UGC — visual cells are generation prompts)' : taskEcomProduction(brief.task) === 'ai-animation' ? ' | Production: AI ANIMATION (generated animation in one declared style — visual cells are generation prompts)' : ''} | ${ecomDurationBudget(brief.task.duration)}
- Framework: ${brief.framework.name} — ${brief.framework.rationale}
- Concept: ${brief.concept.title} — ${brief.concept.summary}
- Product entry pattern: ${brief.concept.productEntry}
- Product truth being sold: ${brief.concept.productTruth}
- Tonality: ${brief.header.videoTonality}${brief.header.ecomEditing ? ` | Pacing: ${brief.header.ecomEditing.pacing} | Music: ${brief.header.ecomEditing.music} | Transitions: ${brief.header.ecomEditing.transitions} | Special notes: ${brief.header.ecomEditing.specialNotes}` : ''}${brief.header.ecomEditing?.casting ? `
- ${taskEcomProduction(brief.task) === 'ai-animation' ? 'STYLE + CHARACTER SPEC' : 'CASTING SPEC'} (the tool prepends this verbatim to every visual cell at export — judge and write cells as if it precedes them): ${brief.header.ecomEditing.casting}` : ''}
- Per-brief instructions: ${brief.header.instructions.join(' · ') || '-'}

Hooks (alternatives, first = primary):
${brief.hooks.map((h, i) => `${i + 1}. ${h.text}`).join('\n')}

CTAs (first = primary):
${brief.ctas.map((c, i) => `${i + 1}. ${c.text}`).join('\n')}

Script prose (the exact VO):
${brief.scriptProse}

Storyboard (| Scene | VO line | Overlay | Shot tag | Visual | Reference | Editor notes |):
${rows}`;
  }
  return `## CURRENT BRIEF STATE (complete)

- Task: ${brief.taskName} | Product: ${brief.task.product} | Talking point: ${brief.task.talkingPoint}
- Awareness: ${brief.task.awarenessLevel} | UGC style: ${getUgcStyle(brief.task.ugcStyle).name} | ${durationBudget(brief.task.duration)}
- Framework: ${brief.framework.name} — ${brief.framework.rationale}
- Concept: ${brief.concept.title} — ${brief.concept.summary}
- Product entry pattern: ${brief.concept.productEntry}
- Product truth being sold: ${brief.concept.productTruth}
- Tonality: ${brief.header.videoTonality} | Attire: ${brief.header.attire}
- Per-brief instructions: ${brief.header.instructions.join(' · ') || '-'}

Hooks (alternatives, first = primary):
${brief.hooks.map((h, i) => `${i + 1}. ${h.text}`).join('\n')}

CTAs (first = primary):
${brief.ctas.map((c, i) => `${i + 1}. ${c.text}`).join('\n')}

Script prose:
${brief.scriptProse}

Storyboard (| Clip | Audio | Script | Shot | Description | Reference | Editor notes |):
${rows}`;
}

// ─── Step 1: Brainstorm ─────────────────────────────────────────────────────

export function buildBrainstormPrompt(
  tasks: V2Task[],
  inspirationSummary: string,
  instructions?: string,
): { system: string; user: string } {
  const taskList = tasks
    .map(
      (t, i) =>
        taskAdType(t) === 'ecom'
          ? `${i + 1}. ${t.parsed.name} — ${t.product} | angle: ${t.talkingPoint} | awareness: ${t.awarenessLevel} | AD TYPE: ECOM (editing brief) | ${t.duration}${t.pinnedInspirationId ? ' | has PINNED exemplar' : ''}`
          : `${i + 1}. ${t.parsed.name} — ${t.product} | angle: ${t.talkingPoint} | awareness: ${t.awarenessLevel} | STYLE: ${getUgcStyle(t.ugcStyle).name} | ${t.duration}${t.pinnedInspirationId ? ' | has PINNED style exemplar' : ''}`,
    )
    .join('\n');
  const hasUgc = tasks.some((t) => taskAdType(t) === 'ugc');
  const hasEcom = tasks.some((t) => taskAdType(t) === 'ecom');

  const ecomTasks = tasks.filter((t) => taskAdType(t) === 'ecom');
  const system = `${hasEcom && !hasUgc ? getEcomSystemBase() : buildSystemBase()}

## YOUR ROLE: FACTORY V2 ${hasEcom && !hasUgc ? 'ECOM' : 'UGC'} CREATIVE STRATEGIST — BRAINSTORM

You open every V2 batch by thinking with the creative director, not for them. You receive a batch of
${hasEcom && hasUgc ? 'UGC and ECOM' : hasEcom ? 'ECOM' : 'UGC'} tasks and produce: (1) a sharp strategic read of the batch, and (2) 3-5 questions whose answers
will genuinely change what gets made. This is a collaboration step — ask what you actually need to
know, not ceremony questions.
${hasUgc ? `
${hasEcom ? 'UGC tasks' : 'Everything is UGC'}: real creators, phones, first-person authenticity. Each ${hasEcom ? 'UGC task' : 'task'} carries a UGC STYLE —
the taxonomy's innovation layer (Ad Type → STYLE → Angle): the style is the visual delivery grammar
that breaks creative bundling, and each style has its own register, shot vocabulary, pacing, and
constraints. Think about: how each task's angle can live inside its assigned style; which concepts
suit product-forward vs earned-entry patterns (per each task's awareness level); where the batch
risks monotony (avatars, emotional registers, opening techniques); which tasks are near-duplicates
needing differentiation; what the inspiration bank offers; and what only the human knows (business
priorities, what's been run recently, creator constraints).
` : ''}${hasEcom ? `
ECOM tasks are EDITING BRIEFS: a script read VERBATIM by an AI voice over edited footage — no
creator, no filming. Think ARGUMENT-FIRST, per task, the way the reviewer thinks (his calibration
file is below): who is the viewer and why would she care in the first breath; what is the ONE
sayable law this ad could argue; what is the REAL pain this person lives with and what is truly at
stake; what does she already know (the awareness level describes what she knows — never how vague
to be: concreteness is universal); which product truth carries the argument (this task's product
only — never another product's pain, feature, or mechanism); which objections her buyer will raise
and how the ad could close them on screen; why THIS product over the alternatives; whether a pinned
example governs the task (then its argument is the spine); and where the batch risks the SAME
argument in different costumes — the reviewer's central complaint. Production (footage library or
AI mode) is a constraint to respect, never the starting point.
` : ''}${renderDirectorInstructions(instructions)}
${(instructions ?? '').trim() ? `OCCASION MANDATE FOR YOUR ANALYSIS: if the instructions name an occasion, your analysis MUST mine it on both levels — the ICONOGRAPHY (the real rituals, settings, and props of how people celebrate) as scene territory for the batch, and the MEANING (what the day honors) fused with our brand truths. Propose the occasion-native lane per task, and make at least ONE of your questions an occasion question (which rituals to lean into, how offer-forward vs story-forward the director wants each task).` : ''}
${hasUgc ? `
${getUgcVoiceDna()}
` : ''}${hasEcom ? `
## THE ECOM STRATEGIST'S DOCTRINE (the reviewer's laws — the concepts and scripts downstream obey them; so does your analysis)
- THE ARGUMENT IS THE PRODUCT: every brief argues ONE sayable law; a brief without an argument fails regardless of craft.
- WHY DOES ANYONE CARE: the opening lives in the viewer's world, names her symptom, and promises value — at EVERY awareness level. "TOF" describes the audience, never vague writing.
- THE PRODUCT ARGUMENT GETS EQUAL OR MORE TIME THAN THE PROBLEM — at every level, Unaware included; the product enters when the argument earns it, never "as late as possible."
- DIFFERENT ARGUMENT PER BRIEF: same template is fine; same thesis, chain, device, or claim structure in a new costume is the failure he named.
- PRODUCT-PERSONA ISOLATION: each task's pain, benefit, feature, and persona material comes only from its own product — never a batch-wide pain carried across products.
- EXAMPLES GOVERN: where a task is pinned, the example's argument is the spine; where it is a REMAKE, the example IS the brief.
- CONCEPTS MUST NOT BE STITCHED: no element welded to another by an invented bridge line; the story must collapse if the narrator's career is deleted.

${getTasteFileBlock()}

${[...new Set(ecomTasks.map((t) => t.awarenessLevel))].map((lvl) => `### AWARENESS CORE FOR THE ${lvl.toUpperCase()} TASKS (${ecomTasks.filter((t) => t.awarenessLevel === lvl).map((t) => t.parsed.name).join(', ')}) — each core governs only its own tasks:
${ecomAwarenessCore(lvl)}`).join('\n\n')}

## THE RECORDED MATERIAL PER PRODUCT (your thinking draws ONLY from this — never from general knowledge)
${[...new Set(ecomTasks.map((t) => t.product))].map((prod) => `${getProductTruthBlock(prod)}

${productArgumentBlock(prod)}`).join('\n\n')}

${getEcomCraftDna()}
` : ''}
${JSON_CONTRACT}

JSON shape:
{
  "analysis": "your strategic read of the batch as flowing text, 150-300 words, specific to THESE tasks${hasEcom ? ' — for ecom tasks, ARGUMENT-first: name each task\'s candidate thesis-law and the viewer\'s stake in one clause each' : ''}",
  "questions": [
    { "id": "q1", "question": "...", "options": ["...", "...", "..."] }
  ]
}
3-5 questions. Each question offers 2-4 concrete options (the human can also answer free-text).

${hasEcom ? '' : getMarketingBrainBlock('v2Brainstorm')}`;

  const user = `# THIS BATCH (${tasks.length} ${hasEcom && hasUgc ? 'tasks — UGC + ECOM' : hasEcom ? 'ecom tasks' : 'UGC tasks'})

${taskList}

# INSPIRATION BANK SNAPSHOT
${inspirationSummary || '(bank summary unavailable)'}

Produce the strategic analysis and your questions.`;

  return { system, user };
}

export function buildDirectionSynthesisPrompt(
  tasks: V2Task[],
  brainstorm: V2Brainstorm,
  instructions?: string,
): { system: string; user: string } {
  const qa = brainstorm.questions
    .map((q) => `Q: ${q.question}\nA: ${brainstorm.answers[q.id] ?? '(no answer)'}`)
    .join('\n\n');

  const hasEcomDir = tasks.some((t) => taskAdType(t) === 'ecom');
  const system = hasEcomDir
    ? `${getEcomSystemBase()}

## YOUR ROLE: FACTORY V2 STRATEGIST — DIRECTION SYNTHESIS (ECOM)

Turn your batch analysis plus the creative director's answers into the working direction for this
batch. It is injected into EVERY downstream concept and script as binding context — so it must carry
an ARGUMENT for every task, not a batch-wide posture. For EACH ecom task write a PER-TASK ARGUMENT
SPEC (60-120 words each, plain text under the task's name):
- THESIS-LAW: the one sayable sentence this ad argues (any shape — declarative, condition, reversal,
  discovery; not the same shape for every task).
- THE VIEWER AND HER STAKE: who she is, what she already knows (the awareness level is what she
  knows, never how vague to be), and why she cares in the first breath.
- THE REAL PAIN AND ITS TRUE STAKES: the pain she'd name herself, walked as far as this argument
  needs (never a quota).
- THE PRODUCT TRUTH THAT CARRIES IT — from THIS task's product only (product-persona isolation).
- 2-4 OBJECTIONS this story will raise and must close on screen; WHY THIS PRODUCT over the
  alternatives, in this story's terms.
- IF PINNED: what makes the example sell (its argument in one sentence) and what governs — the
  example's argument as spine, or (REMAKE) the example as the brief.
Then a BATCH CHECK in 3-5 lines: no two tasks share a thesis shape, belief chain, through-line
device, story event, or objection set; each product's material stays inside its own tasks. If a
director instruction names an occasion or theme, decide PER TASK whether it is essential to that
task's argument — the bridge-line test: a theme that would need an invented line to connect is
left out of that task. Be specific and directive; no generic advice. These specs SEED the
concepts; the human-approved concept's thesis governs the script — where they differ, the
approved concept wins.
${renderDirectorInstructions(instructions)}

${getTasteFileBlock()}

## THE RECORDED MATERIAL PER PRODUCT (every pain, objection, and product truth in your specs comes ONLY from here)
${[...new Set(tasks.filter((t) => taskAdType(t) === 'ecom').map((t) => t.product))].map((prod) => `${getProductTruthBlock(prod)}

${getPainBankBlock(prod)}

${productArgumentBlock(prod)}`).join('\n\n')}

${JSON_CONTRACT}

JSON shape: { "direction": "the per-task argument specs + the batch check, as plain text with the task names as headings" }`
    : `${buildSystemBase()}

## YOUR ROLE: FACTORY V2 STRATEGIST — DIRECTION SYNTHESIS

Turn your batch analysis plus the creative director's answers into a tight working direction for
this batch. It will be injected into every downstream generation. Be specific and directive; no
generic advice. Include per-task notes where tasks need individual direction (differentiation
between near-duplicates, persona/emotion spread, product-entry pattern leanings). If an occasion is
in play, the direction MUST carry the occasion lane per task: the ritual/scene each brief lives in,
the casting posture, and how offer-forward vs story-forward each task runs. 200-400 words of plain
text.
${renderDirectorInstructions(instructions)}
${JSON_CONTRACT}

JSON shape: { "direction": "..." }`;

  const user = `# TASKS
${tasks.map((t, i) => `${i + 1}. ${t.parsed.name} — ${t.product} | ${t.talkingPoint} | ${t.awarenessLevel} | ${taskAdType(t) === 'ecom' ? 'ECOM (editing brief)' : `style: ${getUgcStyle(t.ugcStyle).shortLabel}`} | ${t.duration}${taskAdType(t) === 'ecom' && t.pinnedInspirationId ? (t.exemplarRole === 'remake' ? ' | REMAKE of a pinned example (the example IS the brief)' : ' | pinned example (its argument is the spine)') : ''}`).join('\n')}

# YOUR EARLIER ANALYSIS
${brainstorm.analysis}

# THE DIRECTOR'S ANSWERS
${qa}

Synthesize the batch direction.`;

  return { system, user };
}

// ─── Step 2: Concepts ───────────────────────────────────────────────────────

export function buildConceptsPrompt(
  task: V2Task,
  direction: string,
  inspirationContext: string,
  instructions?: string,
): { system: string; user: string } {
  const isEcom = taskAdType(task) === 'ecom';
  const hasPinnedExemplar = inspirationContext.includes('THE STRUCTURAL AUTHORITY');
  const isRemake = isEcom && inspirationContext.includes('THE GOVERNING EXAMPLE');
  const entryRule = isEcom
    ? isRemake
      ? 'whatever MATCHES THE REMAKE SOURCE\'s product-entry pattern and timing — the example governs (the Awareness Core\'s label/offer rules still bind in full)'
      : hasPinnedExemplar
      ? 'whatever MATCHES THE PINNED EXEMPLAR\'s product-entry pattern and timing — the exemplar is the structural authority for this task (the Awareness Core\'s label/offer rules still bind in full)'
      : task.awarenessLevel === 'Product Aware' || task.awarenessLevel === 'Most Aware'
        ? '"product-forward" (the brand belongs in the opening at this awareness level)'
        : '"earned-entry" or "product-forward" — a REAL choice made for the ARGUMENT\'s sake, never by habit: the proportion law binds either way (the product argument gets equal or more time than the problem build), and at Unaware the release order governs the opening'
    : hasPinnedExemplar
      ? 'whatever MATCHES THE PINNED EXEMPLAR\'s product-entry pattern and timing — the exemplar is the structural authority for this task (the awareness level\'s vocabulary/offer rules still bind in full)'
      : task.awarenessLevel === 'Unaware'
        ? '"earned-entry" (mandatory at this awareness level — entry timing follows the awareness release rules)'
        : task.awarenessLevel === 'Problem Aware'
          ? `"earned-entry" (default — the product enters mid-script, inside the ~30-45% zone of runtime) OR "product-forward" when the style or the concept genuinely calls for the brand in the opening. This is a REAL choice — pick for concept fit, not by habit`
          : task.awarenessLevel === 'Solution Aware'
            ? '"product-forward" or "earned-entry" — pick for concept fit (the product enters inside the first ~30% either way)'
            : '"product-forward" (mandatory at this awareness level — the brand belongs in the opening)';

  const system = `${buildV2ContextPack(task, 'concept')}

## YOUR ROLE: FACTORY V2 ${isEcom ? 'ECOM' : 'UGC'} CONCEPT GENERATOR

${isRemake ? `REMAKE MODE: this task remakes the GOVERNING EXAMPLE in the user message. Generate exactly 3
ADAPTATIONS of that example for Viasox — the example's argument shape and structure held constant
in all three, adapted three genuinely different ways: e.g. a different Viasox product-truth at the
center, a different narrator who fits the example's role, a different angle-keyword emphasis. These
are adaptation choices for the director to pick between — never three new ads, and never a drift
away from what makes the example sell. Each concept
must pass its own verification before you emit it:` : isEcom ? `Generate exactly 3 genuinely different ecom concepts for this task. Different means three different
SALES ARGUMENTS — a different thesis-law, a different belief chain, different proof — never one
argument wearing three costumes, and never the same idea with three hooks. Keep story devices
MINIMAL: at most ONE through-line device per concept, and no concept welded together from two
unrelated ideas (the bridge-line tell fails the necessity test). If a third HONEST argument does
not exist inside this product's recorded claim space, emit TWO and say so in the second
concept's verification — a strained third argument is worse than none. Each concept
must pass its own verification before you emit it:` : `Generate exactly 3 genuinely different UGC concepts for this task. Different means different
narrative engines and different emotional worlds — not the same idea with three hooks. Each concept
must pass its own verification before you emit it:`}

1. CLAIM GROUNDING: the central pain/benefit exists in the approved claim space (recorded triggers,
   review data, or the assigned talking point). An invented claim invalidates the concept.
2. 10-SECOND SELF-SELECTION: the opening contains 2+ concrete, ${isEcom ? 'showable' : 'filmable'} details such that the right
   viewer thinks "this is about me" within ~10 seconds${task.awarenessLevel === 'Unaware' ? (isEcom ? ' — concrete scenes, behaviors, and SYMPTOMS (always legal); only the condition label, product category, and brand stay out of an Unaware opening' : ' — as SCENES and BEHAVIORS (product/category/symptom labels stay banned in an Unaware opening)') : ''}.
3. PRODUCT CONVICTION: the concept commits to one concrete product attribute from the bank and would
   fail the SWAP TEST if that attribute were removed.
${isEcom ? `4. ${taskEcomProduction(task) === 'ai-lifestyle' ? `GENERATION FEASIBILITY (AI LIFESTYLE production): every scene will be GENERATED as
   indistinguishable-from-real UGC — name the concept's MODE (vo-narrated or overlay-carried),
   its SHOWN-PROOF device (ladder / timeline / instrument / demo / split-screen), its
   through-line visual IF it has one, and its NARRATOR (who she is, her age, and — when the concept uses an
   authority — her vantage point in one clause), all inside the summary. The casting law
   binds: demographic-exact faces, UGC-native camera grammar. The claim boundary still limits
   what a scene may imply.` : taskEcomProduction(task) === 'ai-animation' ? `ANIMATION FEASIBILITY (AI ANIMATION production): every scene will be a GENERATED ANIMATION —
   name, inside the summary: the concept's MODE (vo-narrated or overlay-carried), its ONE
   declared ANIMATION STYLE and why it fits this story (claymation / felt miniature / paper
   cutout / stylized 3D / painterly 2D), its NARRATOR AVATAR (who she is, translated into the
   style with dignity), and its CENTRAL VISUAL METAPHOR (the mechanism or pain made visible in a
   way real footage can't). The script is still one person's story with full stakes — the
   contrast between warm visuals and hard truth is the engine. The claim boundary still limits
   what a scene may imply: exaggeration expresses felt experience, never a measurable promise.` : `FOOTAGE FEASIBILITY: the whole story must be buildable from the footage library + graphics —
   name the concept's MODE (vo-narrated or overlay-carried), its SHOWN-PROOF device (ladder /
   timeline / instrument / demo / split-screen), and its through-line visual IF it has one, all
   inside the summary. A concept needing footage from the negative list invalidates itself.`}
5. PAIN DEPTH (CMO gate): name the ONE-PERSON narrator and, in one clause, the REAL pain this
   person lives with and what is truly at stake for her — the pain she'd name herself, not a
   surface annoyance. Surface pains (tired legs, sock marks, rings) are legal only as the doorway
   INTO it; a concept whose deepest moment is an inconvenience invalidates itself. Depth is
   argument-driven (the Stakes License governs how stakes are spoken).
6. AUTHORITY (when the instructions, direction, or the concept itself invoke an authority
   narrator): name the narrator's vantage point in one clause inside the summary, and confirm in
   verification that her witnessed-volume testimony maps to recorded material. Apply the
   ESSENTIALITY TEST (delete the career — if the story survives, the authority is stapled) and
   the NECESSITY TEST (no element welded to another by an invented bridge line: a waitress +
   menopause + veins with "I watched the older waitresses" as the only connective is a stitched
   concept and invalidates itself). Skip this gate only when no authority is invoked.
7. THE SEVEN CONCEPT QUESTIONS (CMO — every concept must answer them inside its summary +
   verification, in substance): Why is THIS character telling THIS story? What did her experience
   teach her that is valuable to the viewer? Why should someone continue watching? What problem or
   outcome are we promising? How does each section logically lead to the next? What objections are
   we overcoming? Why is Viasox the solution? A concept that cannot answer all seven plainly
   invalidates itself.
8. A DIFFERENT SALES ARGUMENT (batch law): each concept states its THESIS AS ONE SAYABLE LAW in
   its thesis field. Across the 3 concepts — and against the other tasks' theses in the BATCH
   DIRECTION's per-task specs — the theses must be genuinely different ARGUMENTS (different chain,
   different proof, different thesis SHAPE), not one argument in different costumes.` : `4. UGC FEASIBILITY: one creator, one phone, their home/car/daily life. No production crew, no sets.`}

productEntry for this task must be ${entryRule}.
${isRemake ? `REMAKE GOVERNANCE: the source's dissection and transcript are in the INSPIRATION CONTEXT of the
user message. Every summary must answer, in one clause each: WHY the example sells (its argument
stated as one sentence), and WHAT this adaptation substitutes (which Viasox product truth carries
the example's central claim role). Gate 8 is replaced for remakes: the three adaptations share the
example's argument by design — they must differ in the SUBSTITUTION, never drift from the source.
` : hasPinnedExemplar ? `EXEMPLAR SKELETON MANDATE: a finished-project exemplar is pinned for this task (its dissection is in
the INSPIRATION CONTEXT of the user message). All 3 concepts must be conceived INSIDE the exemplar's
structural skeleton — same beat arc, same product-entry position, same product-talk share, same
payoff shape — and differ in STORY: the lived situation, the angle execution, the casting, the
emotional world. Each summary must name, in one clause, how the concept maps onto the exemplar's
arc. Concepts that abandon the exemplar's architecture fail verification.
` : ''}${task.awarenessLevel === 'Unaware' && !isEcom ? 'V2 has no separate persona/technique fields: name the Unaware SUB-PERSONA (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer) and the technique (Scene Identification / Mundane Reframe / False Cause Flip) INSIDE the summary, and confirm them in verification.\n' : ''}${renderDirectorInstructions(instructions)}
${(instructions ?? '').trim() ? 'OCCASION MANDATE FOR CONCEPTS: if the instructions name an occasion, EVERY concept must plant the occasion in its OPENING SCENE (the ritual, the setting, the day itself — as concrete filmable details), cast the creator as a participant in the occasion, and connect at the meaning level where genuine. A concept whose occasion presence is only in the CTA or a mentioned sale = automatic verification failure.\n' : ''}
${JSON_CONTRACT}

JSON shape:
${isEcom ? `{
  "concepts": [
    {
      "title": "3-6 word concept name",
      "thesis": "the ad's argument as ONE sayable law — the sentence a viewer could repeat (any shape; three concepts = three different laws, and not the batch direction's other tasks' laws either)",
      "argumentChain": "the belief chain in 3-5 causal links, walked to a felt endpoint: what the viewer believes after each beat and how it sets up the next, ending at 'so this product is the answer for me'",
      "hookLine": "a sample primary hook, written exactly as it would be spoken — it names her symptom, stakes her, and promises the value of watching, in HER world",
      "narrator": "who tells it — a SUFFERER telling her own story (no career; often the stronger narrator) or an authority-adjacent figure; only if she has a career: why it gives her standing on THIS problem, and confirm the story collapses without it. Never hand a narrator a job so the story can borrow credibility",
      "productTruth": "the ONE concrete attribute this concept sells, from THIS product's bank",
      "objections": "the 2-4 buyer objections THIS story naturally raises, each with the scene that will close it on screen",
      "whyViasox": "why THIS product over the alternatives, in this story's terms (portfolio-safe: never a verdict on a sibling product)",
      "summary": "one vivid paragraph: the story in one breath — who we see, what happens, how the product enters, why it sells — written so a human can pick between concepts at a glance",
      "productEntry": "product-forward" | "earned-entry",
      "openingDetails": "the 2+ concrete showable opening details",
      "verification": "1-2 sentences: how this passes claim grounding + the 10-second test"
    }
  ]
}` : `{
  "concepts": [
    {
      "title": "3-6 word concept name",
      "summary": "one vivid paragraph: who we see, what happens, the emotional world, how the product enters, why it will work — written so a human can pick between concepts at a glance",
      "productEntry": "product-forward" | "earned-entry",
      "productTruth": "the ONE concrete attribute this concept sells, from the bank",
      "openingDetails": "the 2+ concrete filmable opening details",
      "verification": "1-2 sentences: how this passes claim grounding + the 10-second test"
    }
  ]
}`}

${isEcom ? '' : getMarketingBrainBlock('conceptGeneration')}`;

  const user = `# BATCH DIRECTION (from the brainstorm — binding)
${direction}

${inspirationContext ? `# INSPIRATION CONTEXT\n${inspirationContext}\n` : ''}
Generate the 3 concepts for task "${task.parsed.name}" (${task.product} / ${task.talkingPoint} / ${task.awarenessLevel} / ${isEcom ? (taskEcomProduction(task) === 'ai-lifestyle' ? 'ECOM editing brief, AI LIFESTYLE production' : taskEcomProduction(task) === 'ai-animation' ? 'ECOM editing brief, AI ANIMATION production' : 'ECOM editing brief') : `style: ${getUgcStyle(task.ugcStyle).name}`} / ${task.duration}). ${isEcom ? (taskEcomProduction(task) === 'ai-lifestyle' ? 'Every scene will be GENERATED and must be indistinguishable from real UGC — the AI-lifestyle visual law\'s casting law and the ecom craft DNA\'s modes, registers, and proof engine are binding.' : taskEcomProduction(task) === 'ai-animation' ? 'Every scene will be a GENERATED ANIMATION in one declared style — the AI-animation visual law (style declaration, character design, metaphor engine) and the ecom craft DNA\'s modes, registers, and proof engine are binding; the script keeps full stakes.' : 'Every concept must be buildable from the footage library and carried by VO + overlays — the ecom craft DNA\'s modes, registers, and proof engine are binding.') : 'Every concept must live natively inside the assigned UGC style — its visual grammar, register, and constraints are binding.'}`;

  return { system, user };
}

// ─── Step 3: Framework selection ────────────────────────────────────────────

export function buildFrameworkSelectPrompt(
  task: V2Task,
  concept: V2Concept,
  inspirationContext = '',
): { system: string; user: string } {
  const isEcom = taskAdType(task) === 'ecom';
  const frameworkGuide = (isEcom ? ECOM_FRAMEWORKS : UGC_FRAMEWORKS).map(
    (f) => FRAMEWORK_DETAILS[f] ?? `**${f}**`,
  ).join('\n\n');
  const hasPinnedExemplar = inspirationContext.includes('THE STRUCTURAL AUTHORITY');

  const system = `${buildV2ContextPack(task, 'concept')}

## YOUR ROLE: FACTORY V2 FRAMEWORK SELECTOR

Choose the script framework that best fits THIS concept's natural storytelling from the list below.
This is a real judgment, not a default: the framework is the plot; the awareness level is the censor
deciding what may be said when; and ${isEcom ? `the ecom craft DNA's registers and proof engine are binding
influences — the framework must let the concept's SHOWN-PROOF device (ladder / timeline /
instrument / demo) breathe as the argument's spine, and it must survive the Verbatim-to-VO law as
one continuous spoken read` : `the UGC STYLE's FRAMEWORK LEANINGS (stated in the style guide
above) are binding influences — its leanings are strong candidates, its AVOID list is a warning that
the framework fights the style's delivery grammar`}. Any framework that honors both the awareness
rules and ${isEcom ? "the DNA's craft" : "the style's grammar"} is valid. Do not default to one favorite — pick for fit, and say why
in one sharp line the creative director will read.
${hasPinnedExemplar ? `
⭐ A PINNED EXEMPLAR is the structural authority for this task (its dissection is in the user
message). Dissect its actual arc first, then choose the framework whose stages most closely MATCH
that arc — the exemplar outranks the style leanings and any default preference. Your rationale must
name the correspondence ("matches the exemplar's X → Y → Z arc").
` : ''}
AVAILABLE FRAMEWORKS (choose exactly one, by its exact name; full craft guidance per framework):

${frameworkGuide}

${JSON_CONTRACT}

JSON shape: { "framework": "<exact name from the list>", "rationale": "one line: why this engine fits this concept" }

${isEcom ? '' : getMarketingBrainBlock('v2FrameworkSelect')}`;

  const user = `# THE CHOSEN CONCEPT
${concept.title}: ${concept.summary}
Product entry: ${concept.productEntry} | Product truth: ${concept.productTruth}
Opening details: ${concept.openingDetails}

${inspirationContext ? `# INSPIRATION CONTEXT\n${inspirationContext}\n\n` : ''}Select the framework.`;

  return { system, user };
}

// ─── Step 4: Brief writing ──────────────────────────────────────────────────

function briefJsonShape(level: AwarenessLevel, hasPinnedExemplar = false): string {
  return `{
  "plan": {
    "beatMap": "one line per clip: framework stage + what happens + estimated spoken words (e.g. 'clip 1 [Problem, hook]: mirror scene — 12w'). End with 'TOTAL: Nw vs ceiling Cw' — if N exceeds the ceiling, REVISE the plan before writing the fields below",
    "talkingPointPlacement": "which clips carry the talking point — it must live in at least 3 beats, not just hook+CTA",
    "tenSecondCheck": "quote the exact words of the first ~10 seconds and name their 2+ concrete details",
    "halfwayCheck": "one sentence: what the viewer understands at the 50% mark",
    "productEntryCheck": "clip N — the product first enters at ~X% of runtime. State whether that is inside this awareness level's entry zone, matches the pinned exemplar's entry position, or is a named Craft-License deviation — an unjustified out-of-zone entry means REVISE",
    "payoffArc": "map the four stations to clips (entry moment=clip N / mechanism=clip N / lived proof=clip N / payoff line=clip N) + product airtime ≈X% vs this level's minimum. A missing station or under-minimum airtime means REVISE before writing the fields below",
    "hookFlowCheck": "for EACH alternate hook (2..${V2_HOOK_COUNT}): one clause on how it hands off into clip 2 WITHOUT restating clip 2-3's content, WITHOUT pre-telling a later beat, and WITHOUT naming the brand when the body stages a later first-mention moment. A hook that fails is rewritten before the fields below",
    "speakabilityCheck": "run the READ-ALOUD TEST on the planned script: name any line where sentences would lose their subject/verb/connectives to fit the budget, or where clipped fragments would chain back-to-back ('X. Y. Z.'). State 'all lines read as natural speech' or name the lines to fix — a failed read-aloud means the LINE is rewritten (or a beat is cut for room), never shipped telegraphic"${hasPinnedExemplar ? `,
    "exemplarFidelity": "beat-by-beat: exemplar beat → our clip(s). Confirm same beat order, proportional timing, product-entry position, product-talk share, and payoff shape — or name the licensed deviation"` : ''}
  },
  "header": {
    "concept": "short concept label for the Brand Overview table",
    "angle": "one-line angle statement",
    "videoTonality": "the register(s), specific — name shifts if the arc changes register",
    "attire": "wardrobe guidance for the creator",
    "instructions": ["3-5 per-brief filming instructions beyond the evergreen guidelines"]
  },
  "hooks": ["${V2_HOOK_COUNT} alternative hooks, each a DIFFERENT shape from the voice DNA hook list; first = primary"],
  "ctas": ["${ctaPolicyLine(level)}"],
  "scriptProse": "the full script as flowing spoken prose (hook 1 + body + CTA 1), written exactly as the creator would say it — this is the read-through the creator internalizes before seeing the shot list",
  "storyboard": [
    {
      "clipNumber": 1,
      "audioType": "F2C" | "VO",
      "role": "hook" | "body" | "cta",
      "scriptLine": "the exact line for this clip (split prose at clause level; one thought per clip)",
      "shotType": "Talk to Camera" | "B-Roll" | "Visual Hook",
      "shotDescription": "second-person imperative coaching: camera placement + setting + action + PERFORMANCE. Use the anti-monotony rule between consecutive talk-to-camera clips. For complex shots use 'Setting: ... Action: ...' labels. The CTA clip's description must include: ${CTA_PERFORMANCE_NOTE}",
      "editorNotes": "editor-facing instruction, or empty string"
    }
  ]
}
Role rules: the clip(s) speaking hook 1 get role "hook"; the clip(s) speaking CTA 1 get role "cta"; everything else "body". Keep hook 1 on ONE clip whenever possible.`;
}

/** Ecom JSON shape — THINK → WRITE → DERIVE → SELF-REVIEW (Sep 2026 audit #2).
 *  The plan holds only the thinking (mode, argument, beat map); the script is
 *  written next, while the argument is hot — the way a writer works in chat;
 *  hooks/CTAs/header/storyboard derive from it; the gates run LAST as a
 *  self-review whose failures send the writer back to the script, never to
 *  a defensive rewrite of the plan. Field examples are deliberately abstract:
 *  sample values in a schema become the batch's fingerprints. */
function ecomBriefJsonShape(
  level: AwarenessLevel,
  exemplarKind: 'none' | 'reference' | 'remake' = 'none',
  production: V2EcomProduction = 'library',
): string {
  const lifestyle = production === 'ai-lifestyle';
  const animation = production === 'ai-animation';
  const aiMode = lifestyle || animation;
  const hasPinnedExemplar = exemplarKind === 'reference';
  const isRemake = exemplarKind === 'remake';
  return `{
  "plan": {
    "mode": "'vo-narrated' or 'overlay-carried' — declared once, never mixed",
    "argumentMap": "FIRST. State the ad's THESIS AS ONE SAYABLE LAW (the APPROVED CONCEPT's thesis governs — the batch direction's spec was only its seed; where they differ, the approved concept wins; sharpen it if needed, any shape, in this story's words). Then walk the argument beat by beat: for each beat, what the viewer now BELIEVES and how that belief sets up the next one, ending at 'so this product is the answer for me'. Any beat that advances no belief is decoration — cut it before writing",
    "beatMap": "one line per scene: the beat's job + what happens in THIS story + estimated spoken VO words. End with 'TOTAL: Nw vs ceiling Cw' (C = the ceiling in THIS TASK's duration line) — if N exceeds C, rebalance before writing, cutting setup never the product argument",
    "proportionPlan": "the planned word split — PROBLEM BUILD vs PRODUCT ARGUMENT (entry through CTA) — as two numbers that satisfy the proportion law (product ≥ problem). Write to this split",
    "objectionsPlan": "the 2-4 objections this script WILL raise (the approved concept's list, adjusted) and the scene that will close each on screen — commit before writing"
  },
  "scriptProse": "WRITE THE SCRIPT NOW, while the argument is hot: the full VO as ONE continuous spoken argument (hook 1 + body + CTA 1) — EXACTLY what the AI voice will read, word for word, in the narrator's voice from first word to last",
  "hooks": ["${V2_HOOK_COUNT} alternative VO hooks derived from the script, genuinely different SHAPES from each other — every one names the symptom and promises the viewer value in the viewer's own world, references nothing not yet named, and hands cleanly into scene 1 over the SAME opening visual without restating it; first = primary (the one scriptProse opens with)"],
  "ctas": ["${ecomCtaPolicyLine(level)}"],
  "header": {
    "concept": "short concept label for the Brand Overview table",
    "angle": "one-line angle statement",
    "videoTonality": "the register ARC of THIS script as a from → to, in this story's words",
    "attire": "",
    "instructions": ["3-5 per-brief notes for the editor beyond the evergreen guidelines"],
    "ecomEditing": {
      "pacing": "pacing as DIRECTION with intent, specific to this script's beats",
      "music": "music as a REGISTER that follows this script's arc",
      "transitions": "transitions serving this concept's reveals",
      "specialNotes": "the creative mandate in one breath — the one thing the editor must protect in this ad"${lifestyle ? `,
      "casting": "the FULL persona/casting spec (the single source every generation prompt restates): narrator's age, face description, hair, wardrobe incl. the one occupational detail, home setting with its life props — plus any second person's full identity if the concept has one"` : ''}${animation ? `,
      "casting": "the FULL style + character spec (the single source every generation prompt restates): the declared animation style with its full texture description, then the narrator avatar's character model — proportions, palette, wardrobe, the 2-3 fixed anchors, and the in-style occupational detail when the concept uses an authority"` : ''}
    }
  },
  "storyboard": [
    {
      "clipNumber": 1,
      "audioType": "VO",
      "role": "hook" | "body" | "cta",
      "scriptLine": "the exact VO line for this scene, split from scriptProse (empty string ONLY in overlay-carried mode)",
      "shotType": "ONE scene-type TAG from the available lists${aiMode ? ' (vocabulary only in AI production — nothing is limited to a library)' : ''}",
      "shotDescription": ${lifestyle ? `"the SCENE HALF of this scene's generation prompt — the tool prepends header.ecomEditing.casting verbatim at export, so write the cell to read as ONE prompt after that persona block: [action] + [setting + life props] + [wardrobe delta if it changes] + [camera register + framing/distance] + [light] + [imperfection note]. Refer to her as 'she'; never re-describe the persona, never contradict an anchor"` : animation ? `"the SCENE HALF of this scene's generation prompt — the tool prepends header.ecomEditing.casting (the style + character spec) verbatim at export, so write the cell to read as ONE prompt after that block: [action] + [set + handmade props] + [camera + motion cadence] + [light] + [craft-texture note]. Refer to the character as 'she'; never re-describe the style or the character, never contradict an anchor"` : `"short CONVERSATIONAL description of what the viewer sees — telling the editor what you're picturing, never a label"`},
      "overlayText": "the on-screen text for this scene, or empty string (in vo-narrated mode overlays are fragments OF the spoken line; in overlay-carried mode this IS the script${aiMode ? '; overlays are added in POST — never baked into the generation prompt' : ''})",
      "editorNotes": "editor-facing instruction (${aiMode ? 'generation retries to expect, continuity with the neighboring scenes, post overlays/graphics, timing' : 'graphics, timing, missing-footage replacements'}), or empty string"
    }
  ],
  "selfReview": {
    "talkingPointPlacement": "which scenes carry the talking point — it must live in at least 3 beats, not just hook+CTA",
    "proportionCheck": "split the script's words into PROBLEM BUILD vs PRODUCT ARGUMENT (entry through CTA). State both counts. The product argument must be EQUAL OR GREATER — if it is not, report the shortfall honestly",
    "objectionsCheck": "name the objections THIS story raised (the approved concept's list, adjusted to what was actually written) and, for each, the scene that CLOSES it with a demonstration — an assertion is not closure; report any objection raised but never closed",
    "payoffCheck": "map the four payoff stations to scenes (entry moment=scene N / mechanism=scene N / shown proof=scene N / payoff line=scene N) and name the SHOWN-PROOF device. Report any missing station",
    "flowCheck": "read the ENTIRE VO aloud in your head, hook 1 → every line → CTA 1, as ONE continuous spoken argument. Name any baton break, any vague reference the audience couldn't place, and any line that would sound telegraphic read by an AI voice. Then read the STORY→OFFER SEAM twice on its own: the turn must happen inside the narrator's voice — quote the seam lines and confirm no register switch to announcer-speak. State 'the full read flows clean and the seam holds' or name the lines that do not",
    "ctaOfferCheck": "quote each CTA's offer text verbatim and confirm the direct action lands in the narrator's voice (the seam rule — no announcer switch). Report a CTA missing the offer (exact brand-facts math) or undercutting the bundle",
    "fingerprintCheck": "name every line, hook shape, story event, device, and outcome scene in this script that resembles a model or example quoted anywhere in this prompt, or that another brief on this product would plausibly also contain — and report honestly which ones you could not rewrite into THIS story's own words. The never-copy fence is censor rank"${lifestyle ? `,
    "castingCheck": "state the narrator's exact age and how her face/wardrobe/setting match the buyer demographic (50-75, real texture, lived-in home) and where her occupation shows in ONE worn detail — confirm header.ecomEditing.casting captures ALL of it (age, face, hair, the 2-3 fixed anchors, wardrobe incl. the occupational detail, home setting), because the tool prepends that spec to every visual cell at export. Then read 2-3 sample cells WITH the spec in front of them: each must read as one coherent prompt — no re-description, no anchor contradiction, wardrobe deltas named diegetically. An incomplete spec, a narrator younger than the demographic, a costume-level occupation, or a cell that contradicts the spec means fix it"` : ''}${animation ? `,
    "animationCheck": "name the ONE declared animation style and why it fits this story, describe the narrator avatar's character model (demographic-true, dignified, with its 2-3 fixed anchors), and map EVERY knife beat + the mechanism beat to its named visual metaphor. Confirm header.ecomEditing.casting captures the FULL style texture description AND the full character model, because the tool prepends that spec to every visual cell at export. Then read 2-3 sample cells WITH the spec in front of them: each must read as one coherent prompt — no re-description, no anchor or style contradiction. An incomplete spec, a mocking/caricatured avatar, a mid-ad style break, or a metaphor that implies a claim outside the bank means fix it"` : ''}${hasPinnedExemplar ? `,
    "exemplarFidelity": "beat-by-beat: exemplar beat → our scene(s). Confirm same beat order, proportional timing, product-entry position, product-talk share, and payoff shape — or report the deviation and whether it was licensed"` : ''}${isRemake ? `,
    "remakeFidelity": "passage-by-passage: source passage → our scene(s). For each, name the SUBSTITUTION in one clause (their claim/fact → our bank truth) and confirm the argument shape, proof placement, and register carried over. Name every censor-forced deviation in one clause. Report any drift from the source's argument that no censor forced"` : ''}
  }
}
Role rules: the scene(s) speaking hook 1 get role "hook"; the scene(s) speaking CTA 1 get role "cta"; everything else "body". Keep hook 1 on ONE scene whenever possible.`;
}

export function buildBriefWritePrompt(
  task: V2Task,
  concept: V2Concept,
  framework: { name: ScriptFramework; rationale: string },
  direction: string,
  inspirationContext: string,
  instructions?: string,
): { system: string; user: string } {
  if (taskAdType(task) === 'ecom') {
    return buildEcomBriefWritePrompt(task, concept, framework, direction, inspirationContext, instructions);
  }
  const frameworkDetail = FRAMEWORK_DETAILS[framework.name] ?? `**${framework.name}**`;
  const system = `${buildV2ContextPack(task, 'script')}

## YOUR ROLE: FACTORY V2 UGC BRIEF WRITER

Write the complete UGC brief for the approved concept, as structured data. You are writing for TWO
readers at once: a real creator who will film this on their phone (voice DNA rules apply to every
line), and an editor who will assemble the RAW clips (editorNotes, clip structure).

STRUCTURAL RULES:
- Emit the "plan" FIRST and honor it: the beat map is your Step-0 — framework stages labeled per
  clip, word counts summed against the hard ceiling, talking point threaded through ≥3 beats,
  10-second and halfway checks passed BEFORE the fields below are written.
- The storyboard's main edit = hook 1 + body + CTA 1, split one-thought-per-clip. Alternate hooks
  and CTA 2 are NOT storyboard rows — the engine appends them as alternate-take rows automatically.
  Write ONLY the main edit rows.
- Execute the framework below as the narrative engine — every clip annotatable with its stage.
  The awareness level's HARD rules (vocabulary bans, offer bans, the Unaware release ORDER) bind
  absolutely; its pacing guidance is a default that yields to a pinned exemplar's beat map and to
  the CRAFT LICENSE.
${inspirationContext.includes('THE STRUCTURAL AUTHORITY') ? `- ⭐ A PINNED EXEMPLAR GOVERNS THIS BRIEF'S STRUCTURE. Your plan.beatMap must OPEN by dissecting
  the exemplar into numbered beats — each beat's JOB, its proportional share of runtime, the
  product-entry position (as % into the ad), the product-talk share after entry, the payoff shape,
  and the building block of each line (hook / escalation / pivot / discovery / demo / proof /
  reveal / close). Then map EVERY clip you write to its exemplar beat: same beat order, same
  proportional timing, same product-entry position, same product-talk share, same payoff shape.
  OUR story, THEIR architecture. Framework stages annotate WITHIN that map, never against it.
` : ''}

## THE FRAMEWORK YOU ARE EXECUTING
${frameworkDetail}

- The product beat(s) must sell the concept's committed product truth concretely (SWAP TEST applies),
  through the full PRODUCT PAYOFF ARC (entry moment → mechanism → lived proof → payoff line) at or
  above this level's minimum product airtime.
- plan.productEntryCheck, plan.payoffArc, plan.hookFlowCheck, and plan.speakabilityCheck are REAL
  GATES (as is plan.exemplarFidelity when present): a failed check means the plan is wrong — revise
  the plan, never write fields that fail their own plan.
- Shot descriptions: coach performance, vary camera setups, give the creator something to DO while
  talking. Every row must stand alone as a filmable unit.

${JSON_CONTRACT}

JSON shape:
${briefJsonShape(task.awarenessLevel, inspirationContext.includes('THE STRUCTURAL AUTHORITY'))}

${getMarketingBrainBlock('v2Writer')}`;

  const user = `${renderDirectorInstructions(instructions)}
# BATCH DIRECTION (binding)
${direction}

# THE APPROVED CONCEPT (binding — the concept wins over everything except the hard censors: brand facts, claim boundary, awareness vocabulary/offer bans)
${concept.title}: ${concept.summary}
Product entry: ${concept.productEntry} | Product truth to sell: ${concept.productTruth}
Opening details: ${concept.openingDetails}

# FRAMEWORK (binding)
${framework.name} — ${framework.rationale}

${inspirationContext ? `# INSPIRATION CONTEXT\n${inspirationContext}\n` : ''}
Write the brief for "${task.parsed.name}".`;

  return { system, user };
}

/** The ecom writer — two readers: the EDITOR who assembles, the AI VOICE
 *  that reads verbatim. The verbatim-to-VO law's gates are REAL gates. */
function buildEcomBriefWritePrompt(
  task: V2Task,
  concept: V2Concept,
  framework: { name: ScriptFramework; rationale: string },
  direction: string,
  inspirationContext: string,
  instructions?: string,
): { system: string; user: string } {
  const hasPinned = inspirationContext.includes('THE STRUCTURAL AUTHORITY');
  const isRemake = inspirationContext.includes('THE GOVERNING EXAMPLE');
  const production = taskEcomProduction(task);
  const system = `${buildV2ContextPack(task, 'script')}

## YOUR ROLE: FACTORY V2 ECOM BRIEF WRITER

Write the complete ECOM editing brief for the approved concept, as structured data. You are
writing for TWO readers at once, and NEITHER is a creator: ${
    production === 'ai-lifestyle'
      ? `the EDITOR who GENERATES every
scene from your visual cells (the tool prepends your casting spec to each cell at export, so
every cell + spec reads as one complete generation prompt obeying the AI-lifestyle visual law —
casting demographic-exact), and the AI VOICE that reads your script VERBATIM — there is no
performer to smooth a clumsy line. The Verbatim-to-VO law binds every line you write.`
      : production === 'ai-animation'
        ? `the EDITOR who GENERATES every
scene from your visual cells as ANIMATION (the tool prepends your style + character spec to
each cell at export, so every cell + spec reads as one complete generation prompt obeying the
AI-animation visual law — one declared style, anchors that never flicker), and the AI VOICE
that reads your script VERBATIM — the script is still one person's story with full stakes; the
animation is the instrument that carries it. The Verbatim-to-VO law binds every line you write.`
        : `the EDITOR who assembles the ad from
existing library footage (every visual must be pullable; graphics are buildable), and the AI
VOICE that reads your script VERBATIM — there is no performer to smooth a clumsy line. The
Verbatim-to-VO law binds every line you write.`
  }

HOW TO WORK (the order matters — it is how a writer works, not how a checklist works):
1. THINK: emit "plan" first — the mode, the argumentMap (thesis as one sayable law + the belief
   chain), and the beatMap summed against THIS TASK's ceiling. This is the argument. Everything
   serves it.
2. WRITE: then write "scriptProse" immediately, while the argument is hot — the whole VO as one
   continuous spoken piece in the narrator's voice, the way the calibration file's AFTER examples
   think. Do not write it defensively; write it to sell.
3. DERIVE: hooks, CTAs, header, and storyboard come FROM the script you just wrote.
4. SELF-REVIEW: fill "selfReview" last as an HONEST REPORT on what you actually wrote — measured
   counts, real gaps, named lines. A truthfully reported shortfall is NOT a failed generation: the
   engine's Final Review and rework loop consume it. A false "clean" is the failure. Your job here
   is to write the way the reviewer thinks, not to satisfy a checklist.
- The storyboard's main edit = hook 1 + body + CTA 1, split one-thought-per-scene. Alternate
  hooks and CTA 2 are NOT storyboard rows — the engine appends them as alternate-take rows
  automatically (they swap over scene 1's visual, which is why every hook must hand off over the
  SAME opening visual). Write ONLY the main edit rows.
- The framework below is a LENS on the beats, never a stage order to execute. The Awareness
  Core's HARD rules (label rules, offer rules, the Unaware release ORDER on both channels) bind
  absolutely; pacing guidance yields to a pinned exemplar's beat map and the CRAFT LICENSE.
- A through-line visual device is a strong craft move when THIS story has one — name it in the
  beatMap if so (and never default to the same device as the last brief).
${isRemake ? `- 🎬 THIS BRIEF IS A REMAKE. The GOVERNING EXAMPLE (dissection + transcript in the user message)
  IS the spec: your plan.beatMap must OPEN by walking the source passage by passage — what each
  passage does, why it works — and then map every scene you write to its source passage. Mirror
  the argument order, claim cadence, proof placement, hook shape, and register nearly 1:1, with
  every claim/fact/offer substituted from OUR banks (plan.remakeFidelity is the gate). Deviate
  only where a censor forces it, and name each forced deviation. THEIR craft, OUR truth.
` : hasPinned ? `- ⭐ A PINNED EXEMPLAR GOVERNS THIS BRIEF'S STRUCTURE. Your plan.beatMap must OPEN by dissecting
  the exemplar into numbered beats — each beat's JOB, its proportional share of runtime, the
  product-entry position (as % into the ad), the product-talk share after entry, the payoff
  shape, and the building block of each line. Then map EVERY scene you write to its exemplar
  beat. OUR story, THEIR architecture. REGISTER CAVEAT: exemplar transcripts are often
  caption-fragmented — mirror structure and energy; OUR lines still pass the read-aloud test.
` : ''}
## THE FRAMEWORK — A LENS, NOT A STRUCTURE
${framework.name} — chosen because: ${framework.rationale}
The framework names the KINDS of beats this argument needs; it does not order them, time them, or
supply their content. The canon blocks are ingredients, not a march. Structure comes from the
argument (and from the example when one governs); timing comes from the proportion law; every
mechanism comes from THIS product's bank only.

- The product beats must sell the concept's committed product truth concretely (SWAP TEST
  applies), through the full PRODUCT PAYOFF ARC (entry moment → mechanism → shown proof → payoff
  line), with the PROPORTION LAW satisfied: the product argument gets equal or more words than
  the problem build.

${JSON_CONTRACT}

JSON shape:
${ecomBriefJsonShape(task.awarenessLevel, isRemake ? 'remake' : hasPinned ? 'reference' : 'none', production)}`;

  const user = `${renderDirectorInstructions(instructions)}
# BATCH DIRECTION (binding)
${direction}

# THE APPROVED CONCEPT (binding — the concept wins over everything except the hard censors: brand facts, claim boundary, the Awareness Core's label/offer rules)
${concept.title}: ${concept.summary}${concept.thesis ? `
THESIS-LAW (the argument this script makes — every beat serves it): ${concept.thesis}` : ''}${concept.argumentChain ? `
BELIEF CHAIN: ${concept.argumentChain}` : ''}${concept.hookLine ? `
SAMPLE HOOK (the approved shape and stake — write the real hooks in the same spirit, not the same words): ${concept.hookLine}` : ''}${concept.narrator ? `
NARRATOR: ${concept.narrator}` : ''}${concept.objections ? `
OBJECTIONS TO CLOSE ON SCREEN: ${concept.objections}` : ''}${concept.whyViasox ? `
WHY THIS PRODUCT: ${concept.whyViasox}` : ''}
Product entry: ${concept.productEntry} | Product truth to sell: ${concept.productTruth}
Opening details: ${concept.openingDetails}

# FRAMEWORK (binding)
${framework.name} — ${framework.rationale}

${inspirationContext ? `# INSPIRATION CONTEXT\n${inspirationContext}\n` : ''}
Write the ecom editing brief for "${task.parsed.name}".`;

  return { system, user };
}

// ─── Step 5: Regeneration (the interactive editor's engine) ─────────────────

/** Main-edit rows: numeric clips before the End Card spacer (alternate-take
 *  rows are excluded — they are variation coverage, not the script's flow). */
export function mainEditRows(brief: UgcBriefV2) {
  const endIdx = brief.storyboard.findIndex((r) => r.clipNumber === 'end-card');
  const rows = endIdx >= 0 ? brief.storyboard.slice(0, endIdx) : brief.storyboard;
  return rows.filter((r) => typeof r.clipNumber === 'number');
}

/**
 * THE FLOW CONTEXT — the line before and the line after the target, quoted
 * front and center. The regenerating model must see its neighbors as
 * first-class inputs, not buried in the full serialization: a regenerated
 * or inserted line receives the baton from the line before and hands it to
 * the line after.
 */
function renderNeighborContext(brief: UgcBriefV2, target: V2RegenTarget): string {
  const rows = mainEditRows(brief);
  let idx = -1;
  let mode: 'rewrite' | 'insert' | 'shot' | null = null;

  if (target.type === 'row-script') {
    idx = rows.findIndex((r) => r.id === target.rowId);
    mode = 'rewrite';
  } else if (target.type === 'row-shot') {
    idx = rows.findIndex((r) => r.id === target.rowId);
    mode = 'shot';
  } else if (target.type === 'row-insert') {
    idx = rows.findIndex((r) => r.id === target.afterRowId);
    mode = 'insert';
  } else if (target.type === 'hook') {
    const hookIdx = brief.hooks.findIndex((h) => h.id === target.lineId);
    if (hookIdx === 0) {
      idx = rows.findIndex((r) => r.mirrorsLineId === target.lineId);
      if (idx === -1) idx = 0;
      mode = 'rewrite';
    }
  } else if (target.type === 'cta') {
    const ctaIdx = brief.ctas.findIndex((c) => c.id === target.lineId);
    if (ctaIdx === 0) {
      idx = rows.findIndex((r) => r.mirrorsLineId === target.lineId);
      mode = idx >= 0 ? 'rewrite' : null;
    }
  }
  if (mode === null || idx === -1) return '';

  const before = mode === 'insert' ? rows[idx] : rows[idx - 1];
  const current = mode === 'insert' ? undefined : rows[idx];
  const after = rows[idx + 1];

  const line = (r: (typeof rows)[number] | undefined, fallback: string) =>
    r ? `clip ${r.clipNumber} [${r.audioType}/${r.shotType}]: "${mode === 'shot' ? r.shotDescription : r.scriptLine}"` : fallback;

  const header =
    mode === 'insert'
      ? 'YOU ARE WRITING ONE NEW LINE BETWEEN THESE TWO LINES — it must bridge them seamlessly:'
      : mode === 'shot'
        ? 'THE SHOT DESCRIPTIONS AROUND THE TARGET (vary the camera setup vs both neighbors):'
        : 'THE LINES AROUND THE TARGET:';

  return `
## FLOW CONTEXT — CRITICAL. ${header}

- THE LINE BEFORE: ${line(before, '— none: this is the OPENING of the script (it must work as the first thing the viewer hears)')}
${current ? `- THE LINE YOU ARE REWRITING: ${line(current, '')}` : ''}
- THE LINE AFTER: ${line(after, '— none: this is the CLOSE of the script (it must land as the final word)')}

**MANDATORY FLOW SELF-CHECK before you answer:** read LINE BEFORE → YOUR NEW LINE → LINE AFTER as
one spoken sequence. Your line must take the baton from the line before and hand it to the line
after: continuity of scene, props, tense, pronouns, and emotional register; no repeated
information, no leaps, no disconnect, no vagueness — and no telegraphic chop: the line must sound
like a person talking, connective tissue intact (READ-ALOUD TEST). This is ONE script — the ${mode === 'insert' ? 'inserted' : 'rewritten'}
line must sit in its place as if it had always been there. If the sequence does not flow
seamlessly, rewrite it until it does — only then answer.
`;
}

export function buildRegenPrompt(
  task: V2Task,
  brief: UgcBriefV2,
  target: V2RegenTarget,
  feedback: string,
): { system: string; user: string } {
  const targetLabel = describeTarget(target, brief);
  const isStructural =
    target.type === 'framework-regenerate' ||
    target.type === 'framework-switch' ||
    target.type === 'story-rework';
  const isInsert = target.type === 'row-insert';

  const scopeRules =
    target.type === 'story-rework'
      ? `You are REWORKING THE WHOLE STORY AND ARGUMENT of this brief — the CMO-feedback control for
when the concept is right but the story is not. You HOLD CONSTANT: the task, the framework
("${brief.framework.name}"), the concept's INGREDIENTS — the narrator/authority figure, the angle,
and the committed product truth — the header fields, and every entry in the feedback ledger. You
REBUILD EVERYTHING ELSE from the ground up: a new thesis (state it as one sayable law in the
rationale), a new belief-by-belief argument, new hooks, new CTAs, new prose, a new storyboard. The
CURRENT version below is the FAILED ATTEMPT — study it only to avoid repeating its story, its
structure tics, and its recited phrases; do not reuse its lines. The director's feedback is law and
describes what was wrong at the story level. The sales-argument doctrine in the context pack governs
the rebuild in full: argument first, symptom in the hook, authority earned and bounded, proportion
law, objections closed with demonstration, scene-specific outcomes, offer in the close. Return the
full JSON shape below (put the new thesis-law + one-line story logic in "rationale").`
      : isStructural
      ? `You are ${target.type === 'framework-switch' ? `SWITCHING the framework to "${(target as { newFramework: string }).newFramework}"` : 'RESTRUCTURING the framework per the feedback'}. You rewrite: framework rationale, hooks, ctas, scriptProse, and the storyboard's main-edit rows. You HOLD CONSTANT: the concept, its product truth, the header fields, and every entry in the feedback ledger. Return the full JSON shape below.`
    : isInsert
      ? taskAdType(task) === 'ecom'
        ? `You are writing ONE NEW scene to be inserted between the two lines quoted in the FLOW CONTEXT below, following the director's instructions for what it should do. It must BRIDGE those lines seamlessly — as if the VO had always contained it (this voiceover is read VERBATIM by an AI voice; the new line must take the baton and hand it on as natural speech). Keep it to one thought (hard word ceiling; tight means ONE thought spoken naturally, never a telegraphic fragment). ${taskEcomProduction(task) === 'ai-lifestyle' ? 'Its visual cell is the SCENE HALF of a generation prompt obeying the AI-lifestyle visual law — the tool prepends the casting spec at export, so write it to read as one prompt after that persona block (no re-description, no anchor contradiction), varying the visual modality vs its neighbors.' : taskEcomProduction(task) === 'ai-animation' ? 'Its visual cell is the SCENE HALF of a generation prompt obeying the AI-animation visual law — the tool prepends the style + character spec at export, so write it to read as one prompt after that block (no re-description, no anchor or style contradiction), varying the visual modality vs its neighbors.' : 'Its visual must be pullable from the footage library (tag + conversational description), varying the visual modality vs its neighbors.'} Return ONLY the JSON shape below.`
        : `You are writing ONE NEW clip to be inserted between the two lines quoted in the FLOW CONTEXT below, following the director's instructions for what it should do. It must BRIDGE those lines seamlessly — as if the script had always contained it. Keep it to one thought (this script has a hard word ceiling; a new line must earn its words — but tight means ONE thought spoken naturally, never a telegraphic fragment with its subject/verb/connectives amputated). Also write its filming direction in the same coaching voice as the surrounding shot descriptions, varying the camera setup vs its neighbors. Return ONLY the JSON shape below.`
      : target.type === 'header-field' && target.field === 'instructions'
        ? `You are regenerating the per-brief filming instructions. Return 3-5 instructions, ONE PER LINE inside newValue, no bullet prefixes, no numbering. Everything else in the brief stays exactly as it is.`
        : `You are regenerating ONE element: ${targetLabel} (its current text is quoted in the user message). Everything else in the brief stays EXACTLY as it is — your output must fit seamlessly into the surrounding lines per the FLOW CONTEXT below. Return ONLY the JSON shape below.`;

  const jsonShape = isStructural
    ? taskAdType(task) === 'ecom'
      ? `{
  "rationale": "${target.type === 'story-rework' ? 'the new THESIS stated as one sayable law + one line of story logic' : 'one line on the new/restructured framework fit'}",
  "hooks": ["${V2_HOOK_COUNT} VO hooks per the hook laws (symptom + viewer stake), first = primary"],
  "ctas": ["${ecomCtaPolicyLine(task.awarenessLevel)}"],
  "scriptProse": "the full VO as ONE continuous spoken argument — exactly what the AI voice reads",
  "storyboard": [ { "clipNumber": 1, "audioType": "VO", "role": "hook"|"body"|"cta", "scriptLine": "...", "shotType": "ONE scene-type TAG from the available lists", "shotDescription": ${taskEcomProduction(task) === 'ai-lifestyle' ? '"the scene half of the generation prompt (casting spec is prepended at export)"' : taskEcomProduction(task) === 'ai-animation' ? '"the scene half of the generation prompt (style + character spec is prepended at export)"' : '"short conversational description, pullable from the library"'}, "overlayText": "verbatim fragment of the spoken line, or empty", "editorNotes": "" } ]
}`
      : `{
  "rationale": "one line on the new/restructured framework fit",
  "hooks": ["${V2_HOOK_COUNT} hooks, first = primary"],
  "ctas": ["${ctaPolicyLine(task.awarenessLevel)}"],
  "scriptProse": "...",
  "storyboard": [ { "clipNumber": 1, "audioType": "F2C"|"VO", "role": "hook"|"body"|"cta", "scriptLine": "...", "shotType": "Talk to Camera"|"B-Roll"|"Visual Hook", "shotDescription": "...", "editorNotes": "" } ]
}`
    : isInsert
      ? taskAdType(task) === 'ecom'
        ? `{
  "scriptLine": "the new VO line (one thought, spoken naturally — read verbatim by the AI voice, never a clipped fragment)",
  "audioType": "VO",
  "shotType": "ONE scene-type TAG from the available lists",
  "shotDescription": ${taskEcomProduction(task) === 'ai-lifestyle' ? '"the scene half of the generation prompt (the casting spec is prepended at export): action + setting + wardrobe delta + camera register + light + imperfection note"' : taskEcomProduction(task) === 'ai-animation' ? '"the scene half of the generation prompt (the style + character spec is prepended at export): action + set + camera/motion cadence + light + craft-texture note"' : '"short conversational description of what the viewer sees — pullable from the library"'},
  "overlayText": "on-screen text for this scene, or empty string",
  "editorNotes": "editor-facing instruction, or empty string"
}`
        : `{
  "scriptLine": "the new spoken line (one thought, spoken naturally — a complete utterance, never a clipped fragment)",
  "audioType": "F2C" | "VO",
  "shotType": "Talk to Camera" | "B-Roll" | "Visual Hook",
  "shotDescription": "second-person coaching for filming this clip — vary the camera setup vs the neighboring clips",
  "editorNotes": "editor-facing instruction, or empty string"
}`
      : `{ "newValue": "the regenerated ${target.type === 'header-field' ? 'field value' : 'text'} as plain text" }`;

  const system = `${buildV2ContextPack(task, 'script')}

## YOUR ROLE: FACTORY V2 INTERACTIVE REGENERATOR

The creative director clicked a specific part of a live brief and gave feedback. THE FEEDBACK IS
LAW — it outranks every stylistic default you have. But it operates INSIDE the immutable context
pack above and INSIDE the feedback ledger below: regenerations must never drift the brief away from
the concept's truth, the claim boundary, the awareness rules, or earlier feedback.

${scopeRules}

${JSON_CONTRACT}

JSON shape:
${jsonShape}

${taskAdType(task) === 'ecom' ? '' : getMarketingBrainBlock('v2Regen')}`;

  const currentText = currentTargetText(brief, target);
  const user = `${renderDirectorInstructions(brief.batchInstructions)}
${renderBriefState(brief)}
${renderLedger(brief)}
# THE TARGET: ${targetLabel}
${currentText ? `Current text (you are replacing exactly this):\n"""\n${currentText}\n"""\n` : ''}${renderNeighborContext(brief, target)}
# THE DIRECTOR'S ${isInsert ? 'INSTRUCTIONS FOR THE NEW LINE' : 'FEEDBACK'} (LAW — this is why you were called)
${feedback || (target.type === 'framework-switch' ? '(no additional feedback — execute the framework switch faithfully)' : isInsert ? '(no specific instructions — write the line that most strengthens the bridge between its neighbors)' : '(no specific feedback — produce a meaningfully better take on this element)')}

Produce the output.`;

  return { system, user };
}

// ─── Step 6: Ripple check ───────────────────────────────────────────────────

export function buildRippleCheckPrompt(
  brief: UgcBriefV2,
  changedTarget: string,
): { system: string; user: string } {
  const system = `${buildSystemBase()}

## YOUR ROLE: FACTORY V2 CONSISTENCY CHECKER

A line of this UGC brief was just changed (${changedTarget}). Read the WHOLE brief and flag any
OTHER lines that are now inconsistent with it: continuity breaks (a scene/prop/wardrobe referenced
that no longer exists), rhythm collisions (two adjacent lines now saying the same thing), framework
stage gaps, product-truth contradictions, scriptProse↔storyboard divergence, or word-budget
overruns against the hard ceiling stated in the brief state. Flag ONLY real inconsistencies — an
empty list is the expected result for most edits. Do NOT flag stylistic preferences.

${JSON_CONTRACT}

JSON shape:
{ "flags": [ { "target": "clip <n> script" | "clip <n> shot" | "hook <n>" | "CTA <n>" | "script prose", "issue": "what is now inconsistent", "suggestion": "the minimal fix" } ] }`;

  const user = `${renderBriefState(brief)}

The just-changed element: ${changedTarget}. Report ripple flags.`;

  return { system, user };
}

// ─── Step 7: Storyboard reference matching (vision) ─────────────────────────

export interface FrameCandidate {
  itemId: string;
  itemTitle: string;
  frameIndex: number;
  /** base64 data-url JPEG from the inspiration store. */
  dataUrl: string;
}

export interface FrameMatchOptions {
  /** When set, ONLY this clip is being (re)matched — with the director's
   *  feedback about what was wrong with the previous reference. */
  onlyClipNumber?: number;
  feedback?: string;
  /** The frame the director just rejected (excluded from consideration). */
  rejected?: { itemId: string; frameIndex: number };
}

export function buildFrameMatchInstruction(
  brief: UgcBriefV2,
  candidates: FrameCandidate[],
  opts: FrameMatchOptions = {},
): string {
  const matchableRows = brief.storyboard.filter(
    (r) =>
      typeof r.clipNumber === 'number' &&
      r.shotType !== 'End Card' &&
      r.reference.kind !== 'same-as' &&
      (opts.onlyClipNumber === undefined || r.clipNumber === opts.onlyClipNumber),
  );
  const rows = matchableRows
    .map((r) => `- clip ${r.clipNumber}: [${r.shotType}] ${r.shotDescription}`)
    .join('\n');
  const cands = candidates
    .map((c, i) => `Image ${i + 1}: from "${c.itemTitle}"`)
    .join('\n');

  return `You are assigning REFERENCE SCREENSHOTS to a UGC brief's storyboard rows. The attached
images are frames from the team's inspiration bank (real UGC ads). A reference communicates CAMERA
ANGLE, FRAMING, DISTANCE, SETTING, and ENERGY — never literal content. Rules:
1. For each storyboard clip below, choose the IMAGE NUMBER whose framing best matches the shot
   description — or "same-as:<clipNumber>" when this clip repeats an earlier clip's setup, or
   "none" when no image is a genuinely good framing match (a bad reference is worse than none).
2. Consecutive talk-to-camera clips in one continuous setup should share one image via same-as.
${opts.onlyClipNumber !== undefined ? `3. You are RE-matching ONLY clip ${opts.onlyClipNumber}. The director rejected its previous reference${opts.feedback ? ` with this feedback (binding): "${opts.feedback}"` : ''}. Choose a DIFFERENT image that satisfies the feedback${opts.rejected ? ' — the previously assigned image must not be chosen again' : ''}.` : ''}
Respond with STRICT JSON only, using IMAGE NUMBERS exactly as labeled (Image 1 = 1):
{ "assignments": [ { "clipNumber": ${opts.onlyClipNumber ?? 1}, "choice": <image number> | "same-as:<clipNumber>" | "none" } ] }

STORYBOARD CLIP${matchableRows.length === 1 ? '' : 'S'} TO MATCH:
${rows}

CANDIDATE IMAGES (in attachment order):
${cands}`;
}

// ─── Exemplar fidelity audit (post-write gate for pinned tasks) ─────────────

/**
 * Structural audit of a finished brief against its pinned exemplar's
 * dissected architecture. Non-fatal: mismatches surface as ripple flags in
 * the editor, one hover-regen away from a fix.
 */
export function buildExemplarFidelityPrompt(
  brief: UgcBriefV2,
  exemplarBlock: string,
): { system: string; user: string } {
  const system = `You are Factory V2's structural auditor. A UGC brief was written under a PINNED
EXEMPLAR that is the brief's structural authority: same beat order, proportional beat timing,
product-entry position, product-talk share, and payoff shape. Claims, brand facts, and literal
lines are OUT of scope — never compare those; the exemplar governs architecture only.

Compare the brief's actual storyboard against the exemplar's structure and flag ONLY real
structural mismatches (max 6): a reordered or missing beat, a product entry far from the
exemplar's position, a starved product-talk share, a payoff shape that does not match. If the
brief is faithful, return zero flags. Judge structure, not taste.

${JSON_CONTRACT}

JSON shape: { "flags": [ { "target": "which part of the brief", "issue": "the structural mismatch vs the exemplar", "suggestion": "the smallest edit that restores fidelity" } ] }`;

  const user = `${exemplarBlock}

${renderBriefState(brief)}

Audit the brief's structure against the exemplar.`;

  return { system, user };
}

// ─── Final review — the post-editing hook-flow protocol ─────────────────────

/**
 * The director's review protocol, codified from the July 2026 ACS Labor Day
 * batch review: simulate the finished video once per hook variant and once
 * per CTA option, hunting a fixed taxonomy of failure classes — and ship
 * every finding WITH its surgical fix.
 */
export function buildFinalReviewPrompt(brief: UgcBriefV2): { system: string; user: string } {
  if (taskAdType(brief.task) === 'ecom') return buildEcomFinalReviewPrompt(brief);
  const system = `${buildV2ContextPack(brief.task, 'script')}

## YOUR ROLE: FACTORY V2 FINAL REVIEW — THE HOOK-FLOW AUDIT

The director has finished editing this brief and wants the last-mile audit before it ships to a
creator. You run THE SIMULATION METHOD, then report findings that each carry their own minimal fix.

### THE SIMULATION METHOD
The storyboard's main edit IS the video. The alternate hooks are ALTERNATE OPENERS: in the edit,
the first clip's spoken line is swapped for hook k (same shot setup). So:
1. For EACH hook variant k: read hook k → clip 2 → clip 3 → … → CTA as ONE continuous spoken
   video, holding each clip's shot visual in your head as you read its line.
2. For EACH CTA option: read the final body beats → that CTA as the video's actual ending.
3. Read the body once more end-to-end (lines + visuals back-to-back) with the primary hook.
4. Read each BODY line under EVERY hook variant: any name, day, place, or fact the line leans on
   must be established by ALL the hooks (or by the shared visual), not just by hook 1 — a
   reference that only one opener sets up breaks every other variant.

### THE FAILURE CLASSES (this exact taxonomy — hunt each one deliberately)
1. HOOK↔BODY DUPLICATION — a hook restates an early body line's content nearly verbatim, so the
   viewer hears the same sentence twice within seconds. (Belief-challenge hooks are the repeat
   offender: they tend to restate the script's first problem line.) ALSO counts as this class: a
   DISTINCTIVE word or phrase from the hook re-appearing in body lines 1-2 ("thirty seconds" into
   "thirty seconds", a "Here's…" opener straight into another "Here's…") — adjacency makes even a
   small echo read as a stutter.
2. ORPHANED PROMISE — a hook frames the video as something the body never delivers (e.g. a
   'how I restocked' frame on a first-discovery story).
3. SPOILED REVEAL — a hook names the brand/product while the body stages a later first-mention or
   discovery event, deflating the staged moment.
4. PRE-TOLD BEAT — a hook gives away a mid-script turn, so that beat replays as a rerun.
5. MISSING PIVOT — a hook's last words cannot hand off into clip 2's first words; it needs a gear
   ('Let me back up.') or a rewrite.
6. REGISTER MISMATCH — a device foreign to this UGC style's delivery grammar (e.g. a spoken
   'POV:' line in a talk-to-camera style — POV framing is native ONLY to overlay/faceless styles).
7. BODY FLOW BREAK — between consecutive clips: repeated information, leaps, tense/scene/pronoun
   breaks, or a shot visual that contradicts its line.
8. WORLD CONTRADICTION — any line (CTAs especially) contradicting the depicted world or timeline
   (e.g. the body shows the holiday happening while the CTA says 'before the weekend'), plus any
   brand-fact or offer-math drift.
9. TELEGRAPHIC LINE — a line in written-copy register: subjects, verbs, or connective tissue
   amputated to save words, leaving chained clipped fragments ("Every sock I've worn there,
   ranked. Five kinds, worst to best.") that fail the READ-ALOUD TEST — no creator can deliver
   them as natural speech, and a voiceover of them sounds robotic. The fix restores the
   connective tissue as one flowing sentence with the SAME facts and beat ("I've worn five kinds
   of socks out there, so let me rank them — worst to best"), staying inside the word ceiling by
   cutting a lesser beat if needed. A single deliberate punch beat ("Sound familiar?") is NOT
   this failure — the failure is chop as texture, or any bare stub ("One.") doing a sentence's job.
   Overlay-text lines in an overlay-script style (Faceless POV, where the on-screen text IS the
   script) follow the written-overlay register and are EXEMPT from this class.
10. DANGLING REFERENT — a body line that leans on information only ONE hook variant establishes
   (a day, a name, a place, a promise), so under every other hook the reference points at
   nothing ("So I got him these before Thursday" when only hook 1 ever says Thursday). Prefer
   fixing the BODY line to stand under all hooks over rewriting three hooks around it — this is
   the one class where the body-side fix is usually the minimal one.
11. CONDITIONAL-CLAIM DRIFT — on Ankle Compression and Compression, an absolute mark or dig-in
   promise missing its condition: "nothing digs in", "no marks", "never digs in" are ILLEGAL on
   those products — the approved phrasing is "no dig-in when sized right". (Absolute no-mark
   claims are EasyStretch-only, where they are true and encouraged.) The fix inserts the
   condition, never deletes the benefit.

### FIX DOCTRINE (every finding ships its fix)
- MINIMAL SURGERY: change one hook, one CTA, or one line — prefer fixing the VARIANT over the
  body; touch a body line only when the body line itself is the defect.
- Every proposedText must: fit the concept, framework, and style register; obey the awareness
  level's vocabulary/offer rules; stay inside the claim boundary and brand facts (exact offer
  math); keep the hook set SHAPE-DIVERSE (never make two hooks the same shape); and pass the flow
  self-check — read line-before → your text → line-after as one spoken sequence before proposing.
- Craft bar: Bly's 4 U's and you-orientation for hooks; Schwartz's open loop must close — a hook
  may only promise what the body pays off.

### WHAT NOT TO FLAG
Taste-level rewrites, style choices the ledger shows the director already approved, legal claims,
and anything a fix would make WORSE. A finished brief may genuinely pass: if the simulations read
clean, return ZERO findings — do not invent problems to look useful.

Severity: major = a viewer would notice the break; moderate = weakens the ad; minor = polish.
Return at most 10 findings, ordered most severe first.

${JSON_CONTRACT}

JSON shape:
{
  "summary": "2-3 sentences: overall verdict across all hook simulations",
  "findings": [
    {
      "severity": "major" | "moderate" | "minor",
      "target": "hook 2" | "cta 1" | "clip 7 script" | "clip 7 shot" | "general",
      "issue": "the failure class + what exactly breaks, quoting the colliding words",
      "currentText": "the target's text VERBATIM as it appears in the brief (empty for general)",
      "proposedText": "the minimal replacement (empty for advisory-only findings)",
      "rationale": "one line: why this fix fits the concept/framework/style/awareness"
    }
  ]
}

${getMarketingBrainBlock('v2Review')}`;

  const user = `${renderLedger(brief)}
${renderBriefState(brief)}

Run the full protocol: ${brief.hooks.length} hook simulations, ${brief.ctas.length} CTA simulations, one body pass. Report findings with fixes.`;

  return { system, user };
}

/** The ecom Final Review — the same last-mile discipline, adapted to a script
 *  that is read VERBATIM by an AI voice and assembled from library footage. */
function buildEcomFinalReviewPrompt(brief: UgcBriefV2): { system: string; user: string } {
  const production = taskEcomProduction(brief.task);
  const lifestyle = production === 'ai-lifestyle';
  const animation = production === 'ai-animation';
  const system = `${buildV2ContextPack(brief.task, 'script')}

## YOUR ROLE: FACTORY V2 ECOM FINAL REVIEW — THE CMO SIMULATION + VERBATIM-VO AUDIT

The director wants this brief reviewed EXACTLY as the CMO reviews it, before it ships. You run TWO
passes and merge the findings: (1) THE CMO REVIEW PROTOCOL below — his thirteen checkpoints, his
verdict; (2) THE SIMULATION METHOD — the mechanical verbatim-VO audit (this VO is read VERBATIM by
an AI voice; the read-through IS the ad). Every finding carries its own minimal fix.

${getCmoReviewProtocolBlock()}

### THE SIMULATION METHOD
The storyboard's main edit IS the video. The alternate hooks are ALTERNATE OPENERS over the SAME
scene-1 visual. So:
1. For EACH hook variant k: read hook k → scene 2 → scene 3 → … → CTA as ONE continuous voiceover,
   holding each scene's visual AND overlay in your head as you read its line.
2. For EACH CTA option: read the final body beats → that CTA as the video's actual ending.
3. Read the body once more end-to-end with the primary hook — lines, visuals, and overlays
   together, watching the VO and the on-screen text as two synchronized channels.
4. Read each BODY line under EVERY hook variant: any name, day, place, or fact the line leans on
   must be established by ALL the hooks (or by the shared scene-1 visual), not just by hook 1.

### THE FAILURE CLASSES (this exact taxonomy — hunt each one deliberately)
1. HOOK↔BODY DUPLICATION — a hook restates an early body line's content nearly verbatim, so the
   viewer hears the same sentence twice within seconds.
2. ORPHANED PROMISE — a hook frames the video as something the body never delivers.
3. SPOILED REVEAL — the brand is NAMED (VO or overlay) before the script's own staged
   first-mention moment; at Unaware this applies to BOTH channels including the product appearing
   on screen (the release order).
4. PRE-TOLD BEAT — a hook gives away a mid-script turn, so that beat replays as a rerun.
5. BROKEN HANDOFF — a hook's last words cannot hand off into scene 2's first words as one spoken
   sequence; or any body line fails to take the baton from the line before (a leap, a reset, a
   subject the audience can't place). ALSO this class: a DISTINCTIVE word or phrase from the hook
   re-appearing in the first 1-2 body lines ("ninety dollars worth" into "ninety dollars worth",
   "five o'clock" into "By five o'clock") — the AI voice reads the stutter exactly as written.
6. ROBOT-READ LINE — a line that fails the read-aloud test: telegraphic chop, amputated
   connectives, or vague reference that presumes knowledge. The AI voice will read it exactly as
   written; if it sounds like a caption, it ships as a robot. (A single cut-synced fragment at an
   engineered reveal is legal; chop as texture is not.)
7. VO↔OVERLAY COLLISION — an overlay that competes with the VO as a second script, contradicts
   the spoken line, or carries a claim the VO never earns. In vo-narrated mode overlays are
   fragments OF the spoken line.
8. UNGROUNDED VISUAL — ${lifestyle ? `a visual cell that reads wrong with the casting spec in front of it
   (re-describes the persona, contradicts an anchor), implies a scene the claim boundary bans,
   or is too vague to generate consistently ("B-roll of feet"). ALSO this class: a visual that
   promises WEAKER proof than the VO claims over it (generic review cards under a VO about
   sensitive-feet reviewers; a measurement the shot never shows) — the visual must show the
   exact thing the line is claiming.` : animation ? `a visual cell that reads wrong with the style + character spec in front
   of it (re-describes either, contradicts an anchor), a visual metaphor that implies a claim
   outside the bank (a medical outcome, an invented mechanism), or a cell too vague to generate
   consistently. ALSO this class: a visual that promises WEAKER proof than the VO claims over
   it — the animated image must show the exact thing the line is claiming, in metaphor or
   literally.` : `a visual implying footage from the negative list or outside the library's
   tags, or a description too vague for the editor to pull ("B-roll of feet"). ALSO this class:
   a visual that promises WEAKER proof than the VO claims over it (generic review cards under a
   VO about sensitive-feet reviewers; a measurement the shot never shows) — the visual must show
   the exact thing the line is claiming.`}
9. MODALITY MONOTONY — three or more consecutive scenes with the same visual modality (e.g. three
   Talking Head pulls in a row), or a missing through-line device the brief promised.
10. WORLD CONTRADICTION — any line contradicting the depicted world or timeline, plus any
    brand-fact or offer-math drift (exact offer math only).
11. OFFER-MISSING CTA — a CTA without the offer stated plainly (exact brand-facts math) plus a
    direct action, at ANY awareness level INCLUDING Unaware (CMO ruling: the offer belongs in
    every close); or a close that undercuts its own bundle (bare "start with one"); or a
    register switch to announcer-speak at the seam; or a close that ends on the price alone.
    (A thesis echo is one proven close, never a requirement — its absence is NOT a finding.)
12. CONDITIONAL-CLAIM DRIFT — on Ankle Compression and Compression, an absolute mark or dig-in
    promise missing its condition: "nothing digs in", "no marks", "never digs in" are ILLEGAL on
    those products in VO and overlays alike — the approved phrasing is "no dig-in when sized
    right". (Absolute no-mark claims are EasyStretch-only.) The fix inserts the condition, never
    deletes the benefit.
13. SHALLOW VALLEY — the script's deepest pain is an inconvenience (tired legs, marks, tugging),
    or the pain is named once and abandoned with no knife beats driving it home, or the stakes
    line breaks the Stakes License (a product promise wearing the disease's clothes). The fix
    deepens the valley with RECORDED material (condition, consequence, identity wound) or adds
    the missing escalation beats — never by inventing new horror.
14. BRAND-VOICE DRIFT — a line the ONE narrator could not plausibly say: announcer copy
    ("Introducing…", "Order now!"), brand-POV statements ("At Viasox we…"), or a register switch
    at the offer that breaks the story's voice. The fix rewrites the line in the narrator's own
    vocabulary — the offer arrives as HER telling you what to do about it.
15. AUTHORITY BREAK (when the brief's concept uses an authority narrator) — the credential
    arrives mid-script instead of the first line, becomes the centerpiece instead of a passing
    clause, or the narrator reports witnessing something the recorded material doesn't support;
    ALSO a "doctors recommend"-style endorsement claim (a doctor may exist inside the story as
    an event, never as an endorsement). The fix moves or trims the credential, or re-grounds
    the testimony in recorded material.${lifestyle ? `
16. CASTING/DEMOGRAPHIC DRIFT (AI Lifestyle production) — a storyboard cell that contradicts
    the casting spec (the tool prepends that spec to every cell at export — judge each cell
    WITH the spec in front of it): a changed identity without an explicit diegetic time jump,
    anyone cast outside the buyer demographic, the occupation dressed as a costume (staged
    clinic, whiteboard), a cell that re-describes the persona instead of continuing it, or
    on-screen text baked into a generated scene instead of a post overlay. The fix corrects the
    drifted detail so the cell reads clean after the spec.` : ''}${animation ? `
16. STYLE/CHARACTER DRIFT (AI Animation production) — a storyboard cell that contradicts the
    style + character spec (the tool prepends that spec to every cell at export — judge each
    cell WITH the spec in front of it): a mid-ad style break (the only legal break is the
    real-product end card), an avatar that reads as a caricature or a joke at the narrator's
    expense, a cell that re-describes the style or character instead of continuing them,
    generated in-scene text beyond a 1-2 word handcrafted prop, or a visual metaphor drifting
    into a claim the bank doesn't hold. The fix corrects the drifted detail so the cell reads
    clean after the spec.` : ''}
17. ARGUMENT INCOHERENCE (CMO master class) — the script has no discernible thesis, or beats that
    advance no belief toward "this product is the answer for me". Test: state the ad's argument as
    one sayable law, then walk the beats — any beat you cannot place in the chain is decoration;
    a sequence that reads as word-jumble aloud despite clean sentences fails here. The fix names
    the thesis and cuts or re-orders the beats that serve nothing.
18. UNEARNED CLAIM — a heavy or extreme claim whose earning chain is missing or truncated (probe
    every causal claim: "from what? so what? and then what?" — "legs can't heal" with no answer to
    "heal from what?" fails). The fix walks the chain to its endpoint, conditionally framed,
    witnessed at the endpoint — never by softening the claim.
19. OBJECTION UNCLOSED — an objection raised anywhere (or a top-menu objection for this product
    ignored) without on-screen demonstration closing it. An assertion is not closure. The fix adds
    the demonstration beat or cuts the raised-and-abandoned objection.
20. FEATURE IRRELEVANCE — a product feature recited that answers no problem THIS story
    established (a seamless toe in a pooling story). The fix cuts the feature or wires it to a
    problem the script actually raised.
21. TEMPLATE FINGERPRINT — banned recited parameters: the morning-vs-afternoon comparison as the
    insight, "real enough to feel the difference by evening", a close that recites the review
    count, or the stock skeleton (adjacent authority → day-contrast → late reveal → 12-15 →
    patterns → reviews → offer) visible beneath the costume. The fix re-expresses the material
    through THIS narrator's world.
22. SELF-UNDERMINING PITCH — the argument indicts its own product unresolved (warning about
    pressure, then selling compression without distinguishing concentrated vs distributed), or
    frames the problem at a scope that argues for a DIFFERENT product (pooling "throughout the
    lower legs" argues for knee-highs in an ankle-sock ad). The fix adds the resolving
    distinction or reframes the problem where this product acts.
23. STARVED PRODUCT ARGUMENT — the story, metaphor, or valley consumes the runtime and the
    product section arrives as a rushed afterthought. The product argument must get equal or more
    time than the problem build, each mechanism developed with its own beat. The fix compresses
    the device/setup and expands the product argument — never the reverse.
24. NARRATOR-WORLD HOOK — a hook that lives in the narrator's job or world with no viewer stake,
    no named symptom, and no promised value ("why does a home care worker dread 5:00?"). The fix
    rewrites per the hook laws: symptom + viewer's body or promised value + credential.

### FIX DOCTRINE (every finding ships its fix)
- MINIMAL SURGERY: change one hook, one CTA, one line, or one overlay — prefer fixing the VARIANT
  over the body; touch a body line only when the body line itself is the defect.
- Every proposedText must: fit the concept, framework, and declared mode; obey the Awareness
  Core's label/offer rules on both channels (screen and VO); stay inside the claim boundary, brand facts, and
  ${lifestyle ? 'the AI-lifestyle visual law (any rewritten visual cell must read clean with the casting spec prepended)' : animation ? 'the AI-animation visual law (any rewritten visual cell must read clean with the style + character spec prepended)' : 'footage library'}; keep the hooks genuinely different from each other; and pass the read-aloud test — read
  line-before → your text → line-after as one spoken sequence before proposing.
- Craft bar: Bly's 4 U's and you-orientation for hooks; Schwartz's open loop must close — a hook
  may only promise what the body pays off; the CTA closes in the narrator's voice with the offer.

### WHAT NOT TO FLAG
Taste-level rewrites, choices the ledger shows the director already approved, legal claims, and
anything a fix would make WORSE. A finished brief may genuinely pass: if the simulations read
clean, return ZERO findings — do not invent problems to look useful.

Severity: major = a viewer would notice the break; moderate = weakens the ad; minor = polish.
Return at most 10 findings, ordered most severe first.

${JSON_CONTRACT}

JSON shape:
{
  "verdict": "approvable" | "revision" | "unfit" — the CMO tier per the protocol's verdict rules, calibrated to his base rate; never 'approvable' with open major findings,
  "summary": "the CMO's read, 3-5 sentences: the brief's THESIS as you understood it, the checkpoint(s) that decide the verdict, and what stands between this brief and 'approvable' — written the way he writes feedback: direct, specific, quoting the brief's own words where they prove the point",
  "findings": [
    {
      "severity": "major" | "moderate" | "minor" — major = would drive his 'unfit' or block approval, moderate = a revision-driver, minor = polish,
      "target": "hook 2" | "cta 1" | "clip 7 script" | "clip 7 shot" | "clip 7 overlay" | "general",
      "issue": "the checkpoint or failure class + what exactly breaks, quoting the colliding words",
      "currentText": "the target's text VERBATIM as it appears in the brief (empty for general)",
      "proposedText": "the minimal replacement (empty for advisory-only findings)",
      "rationale": "one line: why this fix fits the concept/framework/mode/awareness"
    }
  ]
}

${getMarketingBrainBlock('v2Review')}`;

  const user = `${renderLedger(brief)}
${renderBriefState(brief)}

Run the full protocol: ${brief.hooks.length} hook simulations, ${brief.ctas.length} CTA simulations, one body+overlay pass. Report findings with fixes.`;

  return { system, user };
}
