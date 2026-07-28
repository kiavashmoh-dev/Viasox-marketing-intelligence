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

// ─── Task (intake) ──────────────────────────────────────────────────────────

/** A V2 task: the shared intake output plus V2-only settings. Ad type is
 *  implicitly UGC for every V2 task at launch. */
export interface V2Task {
  /** Original parsed Asana/manual data (shared intake layer). */
  parsed: ParsedAsanaTask;
  product: ProductCategory;
  awarenessLevel: AwarenessLevel;
  /** The angle IS the primary talking point (hierarchy rank #1). */
  talkingPoint: string;
  duration: '1-15 sec' | '16-59 sec' | '60-90 sec';
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

export interface V2Row {
  id: string;
  /** 'end-card' marks the spacer row separating the main edit from
   *  alternate-take rows (the Media Engineered convention). */
  clipNumber: number | 'end-card';
  audioType: V2AudioType;
  scriptLine: string;
  shotType: V2ShotType;
  shotDescription: string;
  reference: V2Reference;
  editorNotes: string;
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
  attire: string;
  /** Per-brief filming instructions (beyond the evergreen guidelines). */
  instructions: string[];
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
  /** Every piece of human feedback ever given on this brief — re-injected
   *  into ALL subsequent generations (the anti-drift ledger). */
  feedbackLedger: V2FeedbackEntry[];
  /** Open consistency flags from the last ripple check. */
  rippleFlags: V2RippleFlag[];
  /** Bumped on every mutation (used for stale-write protection in the UI). */
  version: number;
  createdAt: string;
  updatedAt: string;
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
  | { type: 'row-reference'; rowId: string }
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
    case 'row-reference': return `clip ${clipOf(t.rowId)} reference screenshot`;
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
    case 'script-prose': return brief.scriptProse;
    case 'header-field':
      return t.field === 'instructions'
        ? brief.header.instructions.join('\n')
        : String(brief.header[t.field] ?? '');
    default: return '';
  }
}
