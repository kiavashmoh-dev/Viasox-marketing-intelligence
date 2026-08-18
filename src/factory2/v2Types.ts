/**
 * Factory V2 — data model.
 *
 * THE FOUNDATIONAL DESIGN DECISION: a V2 brief is a TYPED OBJECT, never a
 * markdown blob. The AI generates and regenerates FIELDS of this object;
 * React renders it; the .doc export is just a view. One line regenerated =
 * one field replaced — nothing re-parsed, nothing else disturbed. This is
 * what makes hover-to-regenerate, framework switching, and the cohesion
 * guarantees possible (V1's markdown+regex pipeline cannot do any of it).
 *
 * V1 (src/autopilot/) is untouched. V2 shares only the universal intake
 * layer (screenshotParser, ManualTaskBuilder, asanaMapper) and the
 * knowledge modules (product truth, claim boundary, awareness guides,
 * schwartz states, UGC voice DNA, marketing brain, inspiration bank).
 */

import type { AwarenessLevel, ProductCategory, ScriptFramework } from '../engine/types';
import type { ParsedAsanaTask } from '../engine/autopilotTypes';
import type { UgcStyleId } from './ugcStyles';

// ─── Frameworks available in the V2 UGC dropdown ────────────────────────────

/**
 * The UGC-fit subset of the 20 book frameworks (production-heavy formats
 * like The Professional Authority are omitted at launch; they join when V2
 * expands past UGC). Order = dropdown order.
 */
export const UGC_FRAMEWORKS: readonly ScriptFramework[] = [
  'PAS (Problem-Agitate-Solution)',
  'Before-After-Bridge',
  'Star-Story-Solution',
  'Feel-Felt-Found',
  'Hook-Story-Offer',
  'Empathy-Education-Evidence',
  'The Contrast Framework',
  'The Skeptic Converter',
  'The Day-in-Life',
  'The Myth Buster',
  'The Discovery Narrative',
  'The Demonstration Proof',
  'The Identity Alignment',
  'The Reason-Why (Hopkins)',
  'The Gradualization (Schwartz)',
] as const;

/**
 * The ecom framework roster — every entry has a FRAMEWORK_DETAILS guide.
 * Grounded in the seed corpus: the 7 winning briefs ran Empathy-Education-
 * Evidence, The Skeptic Converter, The Myth Buster (×2), The Reason-Why,
 * Before-After-Bridge, and The Discovery Narrative; the reference cohort
 * adds the rest (PAS = the Diabetic ad, The Contrast = split-screens,
 * Problem-Promise-Proof-Push = the listicle ads, Hook-Story-Offer = the
 * short closers, The Enemy = the industry indictments).
 */
export const ECOM_FRAMEWORKS: readonly ScriptFramework[] = [
  'PAS (Problem-Agitate-Solution)',
  'Before-After-Bridge',
  'Hook-Story-Offer',
  'Problem-Promise-Proof-Push',
  'Empathy-Education-Evidence',
  'The Contrast Framework',
  'The Skeptic Converter',
  'The Day-in-Life',
  'The Myth Buster',
  'The Enemy Framework',
  'The Discovery Narrative',
  'The Demonstration Proof',
  'The Objection Crusher',
  'The Reason-Why (Hopkins)',
] as const;

// ─── Task (intake) ──────────────────────────────────────────────────────────

/** A V2 task: the shared intake output plus V2-only settings. */
export interface V2Task {
  /** Original parsed Asana/manual data (shared intake layer). */
  parsed: ParsedAsanaTask;
  product: ProductCategory;
  awarenessLevel: AwarenessLevel;
  /** The angle IS the primary talking point (hierarchy rank #1). */
  talkingPoint: string;
  duration: '1-15 sec' | '16-59 sec' | '60-90 sec';
  /**
   * 'ugc' (default when absent — every pre-ecom task/brief) or 'ecom'.
   * Set at intake ONLY from an EXPLICIT parsed 'Ecom Style' ad type, never
   * from the V1 mapper's heuristic (which defaults to Ecom Style when the
   * column is missing and would silently flip UGC batches). The director
   * can override per task in the confirm table. Read via taskAdType().
   */
  adType?: V2AdType;
  /**
   * The UGC STYLE — the taxonomy's innovation layer (Ad Type → STYLE →
   * Angle). Selected by the director per task; its guide enters the
   * immutable context pack and dictates visual grammar, register, pacing,
   * framework leanings, and hard constraints for the whole brief.
   */
  ugcStyle: UgcStyleId;
  /**
   * Pinned inspiration item id. The director pins an ad IN THE SAME STYLE
   * so generation sees a finished-project exemplar (visuals, shot angles,
   * tone, pace, frameworks, hooks, beats, CTA, product/pain positioning).
   */
  pinnedInspirationId?: string;
}

// ─── Brainstorm ─────────────────────────────────────────────────────────────

export interface V2BrainstormQuestion {
  id: string;
  question: string;
  /** Multiple-choice options; the user may also answer free-text. */
  options: string[];
}

export interface V2Brainstorm {
  /** The strategist's read of the batch (shown to the user). */
  analysis: string;
  questions: V2BrainstormQuestion[];
  /** User's answers keyed by question id (option text or free text). */
  answers: Record<string, string>;
  /** Synthesized direction produced after answers — injected downstream. */
  direction: string;
}

// ─── Concepts ───────────────────────────────────────────────────────────────

export interface V2Concept {
  id: string;
  title: string;
  /** One-paragraph creative description the user picks from. */
  summary: string;
  /** Which product-entry pattern this concept uses. */
  productEntry: 'product-forward' | 'earned-entry';
  /** The concrete product attribute this concept commits to selling. */
  productTruth: string;
  /** The 2+ concrete opening details (10-second self-selection test). */
  openingDetails: string;
  /** Self-verification the generator ran (claim grounding + concreteness). */
  verification: string;
}

// ─── The brief object ───────────────────────────────────────────────────────

/** Where a storyboard row's reference image comes from. */
export type V2Reference =
  | { kind: 'frame'; itemId: string; frameIndex: number; note?: string }
  | { kind: 'same-as'; clipNumber: number }
  | { kind: 'none'; reason: string };

export type V2AudioType = 'F2C' | 'VO' | '-';
export type V2ShotType =
  | 'Talk to Camera'
  | 'B-Roll'
  | 'Visual Hook'
  | 'End Card';

// ─── Ad type (the ecom expansion) ───────────────────────────────────────────

/** V2's second ad type. Absent on pre-ecom tasks/briefs — read via
 *  taskAdType(), never directly, so old data is 'ugc' with no migration. */
export type V2AdType = 'ugc' | 'ecom';

/** The one honest way to read a task's ad type (absent = 'ugc'). */
export function taskAdType(task: { adType?: V2AdType }): V2AdType {
  return task.adType ?? 'ugc';
}

/**
 * The ecom footage library's shot-type TAGS (V1's taxonomy, kept verbatim —
 * Kia keeps the V1 library until an updated one arrives). Source of truth
 * for the EcomShotTag type AND the footage-library prompt block; the
 * negative list lives with the prompt block in ecomFootageLibrary.ts.
 */
export const ECOM_SHOT_TAGS = {
  core: [
    'Talking Head',
    'Putting On Socks',
    'Feet Up Lifestyle',
    'Bare Legs – Condition',
    'Walking',
    'Standing Feet',
    'Before/After Reveal',
    'Studio Product Shot',
    'Animation / Motion Graphics',
    'Text/Title Card',
  ],
  supplementary: [
    'Socks With Shoes',
    'Documentary / Interview',
    'Product Flat Lay (Branded)',
    'Branded Shipping Box',
    'EGC / Warehouse',
    'Lifestyle Flat Lay',
    'Material Close-up',
    'PNG Cutout',
    'Home Environment',
    'Outdoor Setting',
  ],
  limited: [
    'Yoga / Wellness B-Roll',
    'Event / In-Person',
    'Trade Show / Booth',
    'Edutainment / Pattern Grid',
    'Car Interior',
    'Mall / Public Indoor',
    'Cafe / Seated Public',
  ],
} as const;

export type EcomShotTag =
  | (typeof ECOM_SHOT_TAGS.core)[number]
  | (typeof ECOM_SHOT_TAGS.supplementary)[number]
  | (typeof ECOM_SHOT_TAGS.limited)[number];

export interface V2Row {
  id: string;
  /** 'end-card' marks the spacer row separating the main edit from
   *  alternate-take rows (the Media Engineered convention). */
  clipNumber: number | 'end-card';
  audioType: V2AudioType;
  scriptLine: string;
  /** UGC rows use the three UGC shot types; ecom rows carry a footage-library
   *  TAG instead (grounding: the editor pulls from existing clips). */
  shotType: V2ShotType | EcomShotTag;
  shotDescription: string;
  reference: V2Reference;
  editorNotes: string;
  /** Ecom only: the on-screen text overlay for this scene (the channel that
   *  survives mute). UGC rows never set it. */
  overlayText?: string;
  /** Identity link to the hook/CTA line this row mirrors (set for the
   *  primary hook/CTA rows and every alternate-take row). Hook/CTA regens
   *  sync mirrored rows by THIS id — never by text matching. */
  mirrorsLineId?: string;
}

/** Number of hook alternatives the writer produces (first = primary). One
 *  source of truth — interpolated into the JSON shapes and the engine. */
export const V2_HOOK_COUNT = 4;

/** The CTA performance note (Media Engineered convention) — one source of
 *  truth shared by the voice DNA, the prompts, and appendAlternateTakes. */
export const CTA_PERFORMANCE_NOTE =
  'Sound welcoming and warm, not too excited, but friendly.';

export interface V2Line {
  id: string;
  text: string;
}

/** Strategic (regenerable) header fields — the parts of the template top
 *  that vary with each brief's strategy. Evergreen boilerplate lives in
 *  templateBoilerplate.ts and is never generated. */
export interface V2StrategicHeader {
  concept: string;
  angle: string;
  awarenessLevel: AwarenessLevel;
  videoTonality: string;
  /** Creator wardrobe (UGC). Ecom briefs have no creator — empty string. */
  attire: string;
  /** Per-brief filming instructions (beyond the evergreen guidelines). */
  instructions: string[];
  /** Ecom only: the editing-instructions block (V1 editing-brief lineage —
   *  pacing/music/transitions as DIRECTION, special notes as the creative
   *  mandate). UGC briefs never set it. */
  ecomEditing?: {
    pacing: string;
    music: string;
    transitions: string;
    specialNotes: string;
  };
}

export interface V2FeedbackEntry {
  id: string;
  timestamp: string;
  /** What the feedback targeted: 'hook:<id>', 'row:<id>:script',
   *  'row:<id>:shot', 'row:<id>:reference', 'cta:<id>', 'framework',
   *  'header:<field>', or 'brief' for general notes. */
  target: string;
  feedback: string;
}

export interface V2RippleFlag {
  id: string;
  /** Target path of the line that may now be inconsistent. */
  target: string;
  issue: string;
  suggestion: string;
}

export interface UgcBriefV2 {
  id: string;
  taskName: string;
  task: V2Task;
  header: V2StrategicHeader;
  framework: {
    name: ScriptFramework;
    /** One-line rationale from the framework-selection step. */
    rationale: string;
  };
  /** The approved concept this brief executes (immutable context). */
  concept: V2Concept;
  /** 3-5 alternative hooks; index 0 is the primary (clip 1). */
  hooks: V2Line[];
  /** 1-2 CTA options; index 0 is the primary. */
  ctas: V2Line[];
  /** Full script as flowing prose (the dual-presentation convention). */
  scriptProse: string;
  storyboard: V2Row[];
  /** The director's batch-level instructions (occasion, campaign context,
   *  constraints) — top-priority block in every generation AND every
   *  regeneration for this brief. */
  batchInstructions?: string;
  /** Every piece of human feedback ever given on this brief — re-injected
   *  into ALL subsequent generations (the anti-drift ledger). */
  feedbackLedger: V2FeedbackEntry[];
  /** Open consistency flags from the last ripple check. */
  rippleFlags: V2RippleFlag[];
  /** The last final-review report (persisted so findings survive refresh). */
  lastReview?: V2ReviewReport;
  /** Bumped on every mutation (used for stale-write protection in the UI). */
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Final review (the post-editing hook-flow protocol) ─────────────────────

export type V2ReviewSeverity = 'major' | 'moderate' | 'minor';

/** One finding from the final review — carries its own surgical fix. */
export interface V2ReviewFinding {
  id: string;
  severity: V2ReviewSeverity;
  /** Human-addressable target: 'hook 2' | 'cta 1' | 'clip 7 script' |
   *  'clip 7 shot' | 'general' (advisory, no apply). */
  target: string;
  issue: string;
  /** Verbatim current text of the target — verified against the brief
   *  before the finding is appliable. */
  currentText: string;
  /** The minimal replacement; empty = advisory only. */
  proposedText: string;
  rationale: string;
  resolution?: 'applied' | 'dismissed';
}

export interface V2ReviewReport {
  id: string;
  createdAt: string;
  /** brief.version this review ran against — stale once the brief moves on. */
  briefVersion: number;
  summary: string;
  findings: V2ReviewFinding[];
}

// ─── Batch/session state ────────────────────────────────────────────────────

export type V2Phase =
  | 'idle'
  | 'parsing'
  | 'confirming'
  | 'brainstorm'
  | 'concepting'
  | 'concept-review'
  | 'writing'
  | 'editor'
  | 'error';

export interface V2TaskState {
  task: V2Task;
  status: 'pending' | 'working' | 'awaiting-user' | 'complete' | 'error';
  concepts: V2Concept[];
  selectedConceptId?: string;
  brief?: UgcBriefV2;
  error?: string;
}

export interface V2SessionState {
  phase: V2Phase;
  tasks: V2TaskState[];
  brainstorm?: V2Brainstorm;
  error?: string;
}

// ─── Regeneration targets ───────────────────────────────────────────────────

/** Everything the interactive editor can regenerate. Field paths keep the
 *  engine honest about what one operation is allowed to touch. */
export type V2RegenTarget =
  | { type: 'hook'; lineId: string }
  | { type: 'cta'; lineId: string }
  | { type: 'row-script'; rowId: string }
  | { type: 'row-shot'; rowId: string }
  /** Ecom rows only: regenerate the on-screen overlay text. */
  | { type: 'row-overlay'; rowId: string }
  | { type: 'row-reference'; rowId: string }
  /** Insert a NEW clip immediately after the given row — generated to
   *  bridge the lines around it seamlessly. */
  | { type: 'row-insert'; afterRowId: string }
  | { type: 'script-prose' }
  | { type: 'header-field'; field: keyof V2StrategicHeader }
  | { type: 'framework-regenerate' }
  | { type: 'framework-switch'; newFramework: ScriptFramework };

/**
 * Human-addressable description of a regen target, resolved against the
 * brief. Used in prompts (the model must know WHICH line it regenerates —
 * internal ids appear nowhere in the rendered brief state) and stored in
 * the feedback ledger.
 */
export function describeTarget(t: V2RegenTarget, brief?: UgcBriefV2): string {
  const hookNo = (id: string) => (brief ? brief.hooks.findIndex((h) => h.id === id) + 1 : 0);
  const ctaNo = (id: string) => (brief ? brief.ctas.findIndex((c) => c.id === id) + 1 : 0);
  const clipOf = (rowId: string) => {
    const r = brief?.storyboard.find((x) => x.id === rowId);
    return r ? String(r.clipNumber) : '?';
  };
  switch (t.type) {
    case 'hook': return `hook ${hookNo(t.lineId) || '?'}`;
    case 'cta': return `CTA ${ctaNo(t.lineId) || '?'}`;
    case 'row-script': return `clip ${clipOf(t.rowId)} script line`;
    case 'row-shot': return `clip ${clipOf(t.rowId)} shot description`;
    case 'row-overlay': return `clip ${clipOf(t.rowId)} overlay text`;
    case 'row-reference': return `clip ${clipOf(t.rowId)} reference screenshot`;
    case 'row-insert': return `new clip inserted after clip ${clipOf(t.afterRowId)}`;
    case 'script-prose': return 'the full script prose';
    case 'header-field': return `header field "${t.field}"`;
    case 'framework-regenerate': return 'the framework structure';
    case 'framework-switch': return `framework switch to ${t.newFramework}`;
  }
}

/** The current text of a regen target — quoted verbatim in the regen prompt
 *  so the model knows exactly what it is replacing. */
export function currentTargetText(brief: UgcBriefV2, t: V2RegenTarget): string {
  switch (t.type) {
    case 'hook': return brief.hooks.find((h) => h.id === t.lineId)?.text ?? '';
    case 'cta': return brief.ctas.find((c) => c.id === t.lineId)?.text ?? '';
    case 'row-script': return brief.storyboard.find((r) => r.id === t.rowId)?.scriptLine ?? '';
    case 'row-shot': return brief.storyboard.find((r) => r.id === t.rowId)?.shotDescription ?? '';
    case 'row-overlay': return brief.storyboard.find((r) => r.id === t.rowId)?.overlayText ?? '';
    case 'row-insert': return '';
    case 'script-prose': return brief.scriptProse;
    case 'header-field':
      return t.field === 'instructions'
        ? brief.header.instructions.join('\n')
        : String(brief.header[t.field] ?? '');
    default: return '';
  }
}
