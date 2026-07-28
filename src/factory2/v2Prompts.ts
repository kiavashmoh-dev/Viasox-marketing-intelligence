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
Every string value is plain text (no markdown headers inside values). If a value naturally contains
a double quote, escape it. Invalid JSON is a failed generation.`;

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
The voice DNA's two product-entry patterns are constrained by this task's awareness level:
- Unaware / Problem Aware → EARNED ENTRY only, and the entry TIMING is governed by the awareness
  level's release rules above (not by "midpoint" — at Unaware the product lands in the final beats).
- Product Aware / Most Aware → PRODUCT-FORWARD only (the brand belongs in the first ~3 seconds).
- Solution Aware → either pattern, chosen for concept fit.

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
  const entryRule =
    task.awarenessLevel === 'Unaware' || task.awarenessLevel === 'Problem Aware'
      ? '"earned-entry" (mandatory at this awareness level — entry timing follows the awareness release rules)'
      : task.awarenessLevel === 'Solution Aware'
        ? '"product-forward" or "earned-entry" — pick for concept fit'
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
${task.awarenessLevel === 'Unaware' ? 'V2 has no separate persona/technique fields: name the Unaware SUB-PERSONA (Normalizer / Diagnosed Non-Searcher / Incidental Sufferer) and the technique (Scene Identification / Mundane Reframe / False Cause Flip) INSIDE the summary, and confirm them in verification.\n' : ''}${renderDirectorInstructions(instructions)}
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
): { system: string; user: string } {
  const frameworkGuide = UGC_FRAMEWORKS.map(
    (f) => FRAMEWORK_DETAILS[f] ?? `**${f}**`,
  ).join('\n\n');

  const system = `${buildV2ContextPack(task, 'concept')}

## YOUR ROLE: FACTORY V2 FRAMEWORK SELECTOR

Choose the script framework that best fits THIS concept's natural storytelling from the list below.
This is a real judgment, not a default: the framework is the plot; the awareness level is the censor
deciding what may be said when; and the UGC STYLE's FRAMEWORK LEANINGS (stated in the style guide
above) are binding influences — its leanings are strong candidates, its AVOID list is a warning that
the framework fights the style's delivery grammar. Any framework that honors both the awareness
rules and the style's grammar is valid. Do not default to one favorite — pick for fit, and say why
in one sharp line the creative director will read.

AVAILABLE FRAMEWORKS (choose exactly one, by its exact name; full craft guidance per framework):

${frameworkGuide}

${JSON_CONTRACT}

JSON shape: { "framework": "<exact name from the list>", "rationale": "one line: why this engine fits this concept" }

${getMarketingBrainBlock('v2FrameworkSelect')}`;

  const user = `# THE CHOSEN CONCEPT
${concept.title}: ${concept.summary}
Product entry: ${concept.productEntry} | Product truth: ${concept.productTruth}
Opening details: ${concept.openingDetails}

Select the framework.`;

  return { system, user };
}

// ─── Step 4: Brief writing ──────────────────────────────────────────────────

function briefJsonShape(level: AwarenessLevel): string {
  return `{
  "plan": {
    "beatMap": "one line per clip: framework stage + what happens + estimated spoken words (e.g. 'clip 1 [Problem, hook]: mirror scene — 12w'). End with 'TOTAL: Nw vs ceiling Cw' — if N exceeds the ceiling, REVISE the plan before writing the fields below",
    "talkingPointPlacement": "which clips carry the talking point — it must live in at least 3 beats, not just hook+CTA",
    "tenSecondCheck": "quote the exact words of the first ~10 seconds and name their 2+ concrete details",
    "halfwayCheck": "one sentence: what the viewer understands at the 50% mark"
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
- Execute the framework below as the narrative engine — every clip annotatable with its stage —
  while honoring the awareness level's release rules absolutely.

## THE FRAMEWORK YOU ARE EXECUTING
${frameworkDetail}

- The product beat(s) must sell the concept's committed product truth concretely (SWAP TEST applies).
- Shot descriptions: coach performance, vary camera setups, give the creator something to DO while
  talking. Every row must stand alone as a filmable unit.

${JSON_CONTRACT}

JSON shape:
${briefJsonShape(task.awarenessLevel)}

${getMarketingBrainBlock('v2Writer')}`;

  const user = `${renderDirectorInstructions(instructions)}
# BATCH DIRECTION (binding)
${direction}

# THE APPROVED CONCEPT (binding — the concept wins over everything except the awareness rules)
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

export function buildRegenPrompt(
  task: V2Task,
  brief: UgcBriefV2,
  target: V2RegenTarget,
  feedback: string,
): { system: string; user: string } {
  const targetLabel = describeTarget(target, brief);
  const isStructural =
    target.type === 'framework-regenerate' || target.type === 'framework-switch';

  const scopeRules = isStructural
    ? `You are ${target.type === 'framework-switch' ? `SWITCHING the framework to "${(target as { newFramework: string }).newFramework}"` : 'RESTRUCTURING the framework per the feedback'}. You rewrite: framework rationale, hooks, ctas, scriptProse, and the storyboard's main-edit rows. You HOLD CONSTANT: the concept, its product truth, the header fields, and every entry in the feedback ledger. Return the full JSON shape below.`
    : target.type === 'header-field' && target.field === 'instructions'
      ? `You are regenerating the per-brief filming instructions. Return 3-5 instructions, ONE PER LINE inside newValue, no bullet prefixes, no numbering. Everything else in the brief stays exactly as it is.`
      : `You are regenerating ONE element: ${targetLabel} (its current text is quoted in the user message). Everything else in the brief stays EXACTLY as it is — your output must fit seamlessly into the surrounding lines (read them; match rhythm and continuity). Return ONLY the JSON shape below.`;

  const jsonShape = isStructural
    ? `{
  "rationale": "one line on the new/restructured framework fit",
  "hooks": ["${V2_HOOK_COUNT} hooks, first = primary"],
  "ctas": ["${ctaPolicyLine(task.awarenessLevel)}"],
  "scriptProse": "...",
  "storyboard": [ { "clipNumber": 1, "audioType": "F2C"|"VO", "role": "hook"|"body"|"cta", "scriptLine": "...", "shotType": "Talk to Camera"|"B-Roll"|"Visual Hook", "shotDescription": "...", "editorNotes": "" } ]
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
${currentText ? `Current text (you are replacing exactly this):\n"""\n${currentText}\n"""\n` : ''}
# THE DIRECTOR'S FEEDBACK (LAW — this is why you were called)
${feedback || (target.type === 'framework-switch' ? '(no additional feedback — execute the framework switch faithfully)' : '(no specific feedback — produce a meaningfully better take on this element)')}

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
