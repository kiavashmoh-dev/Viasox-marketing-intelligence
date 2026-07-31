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
  V2_HOOK_COUNT,
  CTA_PERFORMANCE_NOTE,
  describeTarget,
  currentTargetText,
} from './v2Types';
import { getUgcStyle, getUgcStyleBlock } from './ugcStyles';

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
  return `Duration: ${duration}. Word budget: sweet spot ${t.sweetSpot}, HARD ceiling ${t.hardCeiling} words of spoken content, max runtime ${t.maxSeconds}s. ${voRule} (The tool historically overshoots 20-30% — write tight.)`;
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

/**
 * The immutable context pack. `stage` picks the right awareness guide so
 * concept generation doesn't carry the full script architecture on top of
 * the concept doctrine (they were previously stacked — pure token waste).
 */
export function buildV2ContextPack(task: V2Task, stage: 'concept' | 'script' = 'script'): string {
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
  const rows = brief.storyboard
    .map((r) => {
      const ref =
        r.reference.kind === 'frame'
          ? 'reference frame assigned'
          : r.reference.kind === 'same-as'
            ? `Same as clip ${r.reference.clipNumber}`
            : `none (${r.reference.reason})`;
      return `| ${r.clipNumber} | ${r.audioType} | ${r.scriptLine} | ${r.shotType} | ${r.shotDescription} | ${ref} | ${r.editorNotes || '-'} |`;
    })
    .join('\n');
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
        `${i + 1}. ${t.parsed.name} — ${t.product} | angle: ${t.talkingPoint} | awareness: ${t.awarenessLevel} | STYLE: ${getUgcStyle(t.ugcStyle).name} | ${t.duration}${t.pinnedInspirationId ? ' | has PINNED style exemplar' : ''}`,
    )
    .join('\n');

  const system = `${buildSystemBase()}

## YOUR ROLE: FACTORY V2 UGC CREATIVE STRATEGIST — BRAINSTORM

You open every V2 batch by thinking with the creative director, not for them. You receive a batch of
UGC tasks and produce: (1) a sharp strategic read of the batch, and (2) 3-5 questions whose answers
will genuinely change what gets made. This is a collaboration step — ask what you actually need to
know, not ceremony questions.

Everything is UGC: real creators, phones, first-person authenticity. Each task carries a UGC STYLE —
the taxonomy's innovation layer (Ad Type → STYLE → Angle): the style is the visual delivery grammar
that breaks creative bundling, and each style has its own register, shot vocabulary, pacing, and
constraints. Think about: how each task's angle can live inside its assigned style; which concepts
suit product-forward vs earned-entry patterns (per each task's awareness level); where the batch
risks monotony (avatars, emotional registers, opening techniques); which tasks are near-duplicates
needing differentiation; what the inspiration bank offers; and what only the human knows (business
priorities, what's been run recently, creator constraints).
${renderDirectorInstructions(instructions)}
${(instructions ?? '').trim() ? `OCCASION MANDATE FOR YOUR ANALYSIS: if the instructions name an occasion, your analysis MUST mine it on both levels — the ICONOGRAPHY (the real rituals, settings, and props of how people celebrate) as scene territory for the batch, and the MEANING (what the day honors) fused with our brand truths. Propose the occasion-native lane per task, and make at least ONE of your questions an occasion question (which rituals to lean into, how offer-forward vs story-forward the director wants each task).` : ''}

${getUgcVoiceDna()}

${JSON_CONTRACT}

JSON shape:
{
  "analysis": "your strategic read of the batch as flowing text, 150-300 words, specific to THESE tasks",
  "questions": [
    { "id": "q1", "question": "...", "options": ["...", "...", "..."] }
  ]
}
3-5 questions. Each question offers 2-4 concrete options (the human can also answer free-text).

${getMarketingBrainBlock('v2Brainstorm')}`;

  const user = `# THIS BATCH (${tasks.length} UGC tasks)

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

  const system = `${buildSystemBase()}

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
${tasks.map((t, i) => `${i + 1}. ${t.parsed.name} — ${t.product} | ${t.talkingPoint} | ${t.awarenessLevel} | style: ${getUgcStyle(t.ugcStyle).shortLabel} | ${t.duration}`).join('\n')}

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
  const hasPinnedExemplar = inspirationContext.includes('THE STRUCTURAL AUTHORITY');
  const entryRule = hasPinnedExemplar
    ? 'whatever MATCHES THE PINNED EXEMPLAR\'s product-entry pattern and timing — the exemplar is the structural authority for this task (the awareness level\'s vocabulary/offer rules still bind in full)'
    : task.awarenessLevel === 'Unaware'
      ? '"earned-entry" (mandatory at this awareness level — entry timing follows the awareness release rules)'
      : task.awarenessLevel === 'Problem Aware'
        ? '"earned-entry" (default — the product enters mid-script, inside the ~30-45% zone of runtime) OR "product-forward" when the style or the concept genuinely calls for the brand in the opening. This is a REAL choice — pick for concept fit, not by habit'
        : task.awarenessLevel === 'Solution Aware'
          ? '"product-forward" or "earned-entry" — pick for concept fit (the product enters inside the first ~30% either way)'
          : '"product-forward" (mandatory at this awareness level — the brand belongs in the opening)';

  const system = `${buildV2ContextPack(task, 'concept')}

## YOUR ROLE: FACTORY V2 UGC CONCEPT GENERATOR

Generate exactly 3 genuinely different UGC concepts for this task. Different means different
narrative engines and different emotional worlds — not the same idea with three hooks. Each concept
must pass its own verification before you emit it:

1. CLAIM GROUNDING: the central pain/benefit exists in the approved claim space (recorded triggers,
   review data, or the assigned talking point). An invented claim invalidates the concept.
2. 10-SECOND SELF-SELECTION: the opening contains 2+ concrete, filmable details such that the right
   viewer thinks "this is about me" within ~10 seconds${task.awarenessLevel === 'Unaware' ? ' — as SCENES and BEHAVIORS (product/category/symptom labels stay banned in an Unaware opening)' : ''}.
3. PRODUCT CONVICTION: the concept commits to one concrete product attribute from the bank and would
   fail the SWAP TEST if that attribute were removed.
4. UGC FEASIBILITY: one creator, one phone, their home/car/daily life. No production crew, no sets.

productEntry for this task must be ${entryRule}.
${hasPinnedExemplar ? `EXEMPLAR SKELETON MANDATE: a finished-project exemplar is pinned for this task (its dissection is in
the INSPIRATION CONTEXT of the user message). All 3 concepts must be conceived INSIDE the exemplar's
structural skeleton — same beat arc, same product-entry position, same product-talk share, same
payoff shape — and differ in STORY: the lived situation, the angle execution, the casting, the
emotional world. Each summary must name, in one clause, how the concept maps onto the exemplar's
arc. Concepts that abandon the exemplar's architecture fail verification.
` : ''}${task.awarenessLevel === 'Unaware' ? 'V2 has no separate persona/technique fields: name the Unaware SUB-PERSONA (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer) and the technique (Scene Identification / Mundane Reframe / False Cause Flip) INSIDE the summary, and confirm them in verification.\n' : ''}${renderDirectorInstructions(instructions)}
${(instructions ?? '').trim() ? 'OCCASION MANDATE FOR CONCEPTS: if the instructions name an occasion, EVERY concept must plant the occasion in its OPENING SCENE (the ritual, the setting, the day itself — as concrete filmable details), cast the creator as a participant in the occasion, and connect at the meaning level where genuine. A concept whose occasion presence is only in the CTA or a mentioned sale = automatic verification failure.\n' : ''}
${JSON_CONTRACT}

JSON shape:
{
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
}

${getMarketingBrainBlock('conceptGeneration')}`;

  const user = `# BATCH DIRECTION (from the brainstorm — binding)
${direction}

${inspirationContext ? `# INSPIRATION CONTEXT\n${inspirationContext}\n` : ''}
Generate the 3 concepts for task "${task.parsed.name}" (${task.product} / ${task.talkingPoint} / ${task.awarenessLevel} / style: ${getUgcStyle(task.ugcStyle).name} / ${task.duration}). Every concept must live natively inside the assigned UGC style — its visual grammar, register, and constraints are binding.`;

  return { system, user };
}

// ─── Step 3: Framework selection ────────────────────────────────────────────

export function buildFrameworkSelectPrompt(
  task: V2Task,
  concept: V2Concept,
  inspirationContext = '',
): { system: string; user: string } {
  const frameworkGuide = UGC_FRAMEWORKS.map(
    (f) => FRAMEWORK_DETAILS[f] ?? `**${f}**`,
  ).join('\n\n');
  const hasPinnedExemplar = inspirationContext.includes('THE STRUCTURAL AUTHORITY');

  const system = `${buildV2ContextPack(task, 'concept')}

## YOUR ROLE: FACTORY V2 FRAMEWORK SELECTOR

Choose the script framework that best fits THIS concept's natural storytelling from the list below.
This is a real judgment, not a default: the framework is the plot; the awareness level is the censor
deciding what may be said when; and the UGC STYLE's FRAMEWORK LEANINGS (stated in the style guide
above) are binding influences — its leanings are strong candidates, its AVOID list is a warning that
the framework fights the style's delivery grammar. Any framework that honors both the awareness
rules and the style's grammar is valid. Do not default to one favorite — pick for fit, and say why
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

${getMarketingBrainBlock('v2FrameworkSelect')}`;

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
    "hookFlowCheck": "for EACH alternate hook (2..${V2_HOOK_COUNT}): one clause on how it hands off into clip 2 WITHOUT restating clip 2-3's content, WITHOUT pre-telling a later beat, and WITHOUT naming the brand when the body stages a later first-mention moment. A hook that fails is rewritten before the fields below"${hasPinnedExemplar ? `,
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

export function buildBriefWritePrompt(
  task: V2Task,
  concept: V2Concept,
  framework: { name: ScriptFramework; rationale: string },
  direction: string,
  inspirationContext: string,
  instructions?: string,
): { system: string; user: string } {
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
- plan.productEntryCheck, plan.payoffArc, and plan.hookFlowCheck are REAL GATES (as is
  plan.exemplarFidelity when present): a failed check means the plan is wrong — revise the plan,
  never write fields that fail their own plan.
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
information, no leaps, no disconnect, no vagueness. This is ONE script — the ${mode === 'insert' ? 'inserted' : 'rewritten'}
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
    target.type === 'framework-regenerate' || target.type === 'framework-switch';
  const isInsert = target.type === 'row-insert';

  const scopeRules = isStructural
    ? `You are ${target.type === 'framework-switch' ? `SWITCHING the framework to "${(target as { newFramework: string }).newFramework}"` : 'RESTRUCTURING the framework per the feedback'}. You rewrite: framework rationale, hooks, ctas, scriptProse, and the storyboard's main-edit rows. You HOLD CONSTANT: the concept, its product truth, the header fields, and every entry in the feedback ledger. Return the full JSON shape below.`
    : isInsert
      ? `You are writing ONE NEW clip to be inserted between the two lines quoted in the FLOW CONTEXT below, following the director's instructions for what it should do. It must BRIDGE those lines seamlessly — as if the script had always contained it. Keep it to one thought (this script has a hard word ceiling; a new line must earn its words — write tight). Also write its filming direction in the same coaching voice as the surrounding shot descriptions, varying the camera setup vs its neighbors. Return ONLY the JSON shape below.`
      : target.type === 'header-field' && target.field === 'instructions'
        ? `You are regenerating the per-brief filming instructions. Return 3-5 instructions, ONE PER LINE inside newValue, no bullet prefixes, no numbering. Everything else in the brief stays exactly as it is.`
        : `You are regenerating ONE element: ${targetLabel} (its current text is quoted in the user message). Everything else in the brief stays EXACTLY as it is — your output must fit seamlessly into the surrounding lines per the FLOW CONTEXT below. Return ONLY the JSON shape below.`;

  const jsonShape = isStructural
    ? `{
  "rationale": "one line on the new/restructured framework fit",
  "hooks": ["${V2_HOOK_COUNT} hooks, first = primary"],
  "ctas": ["${ctaPolicyLine(task.awarenessLevel)}"],
  "scriptProse": "...",
  "storyboard": [ { "clipNumber": 1, "audioType": "F2C"|"VO", "role": "hook"|"body"|"cta", "scriptLine": "...", "shotType": "Talk to Camera"|"B-Roll"|"Visual Hook", "shotDescription": "...", "editorNotes": "" } ]
}`
    : isInsert
      ? `{
  "scriptLine": "the new spoken line (one thought, tight)",
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

${getMarketingBrainBlock('v2Regen')}`;

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

### THE FAILURE CLASSES (this exact taxonomy — hunt each one deliberately)
1. HOOK↔BODY DUPLICATION — a hook restates an early body line's content nearly verbatim, so the
   viewer hears the same sentence twice within seconds. (Belief-challenge hooks are the repeat
   offender: they tend to restate the script's first problem line.)
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
