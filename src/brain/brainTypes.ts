/**
 * Brain — shared types.
 *
 * The brain is an internal context-assembly layer that all existing prompt
 * builders can opt into. It pre-computes a structured Voice-of-Audience index
 * from reviews + saved comment analyses, then exposes a single entry point
 * (`buildBrainAddendum`) that returns text to be APPENDED to the existing
 * system prompt — never replacing it.
 *
 * See docs/superpowers/specs/2026-05-24-brain-architecture-design.md for the
 * full design rationale and rollout plan.
 */

// ─── Module identity (used by per-module flag system) ────────────────────

/** Every module that can opt into brain integration. Stages match the
 *  rollout order in the design doc (critics → small producers → strategists
 *  → producers). Adding a new module here also requires a default entry in
 *  brainConfig.BRAIN_DEFAULT_FLAGS. */
export type BrainModule =
  | 'differentiationCritic'      // Stage 1
  | 'conceptEvaluator'           // Stage 1
  | 'hookGenerator'              // Stage 2
  | 'conceptSelector'            // Stage 2
  | 'creativeStrategist'         // Stage 3
  | 'personaPrompt'              // Stage 3
  | 'strategySession'            // Stage 3
  | 'scriptWriter'               // Stage 4
  | 'briefGenerator';            // Stage 4

/** Brief sub-template. Currently only `briefGenerator` and `scriptWriter` use
 *  this. Other modules may set to undefined. */
export type BrainBriefTemplate = 'agc' | 'ecom' | 'aidoc' | 'ugc' | 'editing';

/** Product line — used to select product-specific VoC slices. */
export type BrainProduct = 'compression' | 'easystretch' | 'ankle';

/** Named persona — used to select persona-specific VoC slices. */
export type BrainPersona = 'beth' | 'linda' | 'other';

// ─── Task descriptor (what callers pass in) ──────────────────────────────

/** A `BrainTaskDescriptor` describes what's about to be generated. It drives
 *  two decisions inside the assembler: (1) which slices of the VoC index to
 *  include, (2) whether to run the optional deep-reasoning Claude call. */
export interface BrainTaskDescriptor {
  /** Which module is asking — drives the per-module flag check + slice selection. */
  module: BrainModule;
  /** Brief sub-template, if applicable. */
  template?: BrainBriefTemplate;
  /** Product line target, if known. */
  product?: BrainProduct;
  /** Named persona target, if known. */
  persona?: BrainPersona;
  /** Free-text angle / theme the user specified (informs slice selection). */
  angle?: string;
  /** Output format / duration, if applicable. */
  format?: '15s' | '30s' | '60s' | 'longform';
  /** True if this generation is one of N being produced in a single batch. */
  isBatch?: boolean;
  /** Number of outputs in the batch (used to decide if deep reasoning fires). */
  batchCount?: number;
  /** Manual override — force the deep-reasoning Claude call regardless of
   *  other heuristics. Escape hatch for debug + edge cases. */
  forceDeepReasoning?: boolean;
}

// ─── Brain output ────────────────────────────────────────────────────────

/** What `buildBrainAddendum` returns. The caller appends `addendum` to its
 *  existing system prompt verbatim; metadata is for logging / observability. */
export interface BrainContext {
  /** Text to APPEND verbatim to the existing system prompt. Empty string
   *  when the brain is disabled for this module — making the integration a
   *  strict no-op in that case. */
  addendum: string;
  /** Diagnostics — never required to consume, useful for logging and the
   *  side-by-side compare tool. */
  metadata: BrainMetadata;
}

export interface BrainMetadata {
  enabled: boolean;
  vocIndexBuiltAt: number | null;
  /** Names of the VoC index slices that fed into the addendum. */
  slicesUsed: string[];
  /** Whether a deep-reasoning Claude call ran on THIS call (fresh). */
  deepReasoningRan: boolean;
  /** Whether the deep-reasoning output was reused from a session cache
   *  (set by an earlier call in the same autopilot session). */
  deepReasoningCacheHit: boolean;
  /** Approximate token count of the deep-reasoning output (whether ran or cached). */
  deepReasoningTokens?: number;
  /** Channel names that fed into the addendum (e.g. 'voc', 'brandFacts'). */
  channelsConsulted: string[];
  /** Non-fatal issues — e.g. 'VoC index empty' or 'Deep reasoning failed'. */
  warnings: string[];
  /** Total wall-clock time spent inside `buildBrainAddendum`. */
  latencyMs: number;
}

// ─── Voice-of-Audience index types ───────────────────────────────────────

/** A single piece of customer-voice evidence — a theme appearing across
 *  reviews and/or comments, plus a handful of verbatim quotes. */
export interface VoCItem {
  /** Short handle (2-5 words) — e.g. "price concern", "30-inch stretch". */
  theme: string;
  /** Aggregate count across the underlying sources. */
  frequency: number;
  /** Which channel(s) this surfaced through. */
  source: 'reviews' | 'comments' | 'both';
  /** Verbatim quotes (3-5), ordered by clarity / strength. */
  sampleQuotes: string[];
  /** Optional sentiment tag. */
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  /** Original category tag from the comment categorizer, if applicable. */
  category?: string;
}

/** The full pre-computed Voice-of-Audience index. Stored in IndexedDB as a
 *  single record. Rebuilt lazily when underlying data changes. */
export interface VoCIndex {
  /** Wall-clock when this index was built (ms epoch). */
  builtAt: number;
  /** Provenance of this index — what fed into it. */
  sources: {
    reviewCount: number;
    commentAnalysisIds: string[];
    commentCount: number;
  };
  /** Customer objections — what holds people back. */
  topObjections: VoCItem[];
  /** Strongest positive endorsements — candidates for repurposing in ads. */
  topTestimonials: VoCItem[];
  /** Questions people keep asking — content / FAQ gaps. */
  recurringQuestions: VoCItem[];
  /** Pain points being expressed (overlaps with objections; pain is broader). */
  painPoints: VoCItem[];
  /** What people say they want / wish for. */
  desires: VoCItem[];
  /** Quality / service / delivery issues. */
  complaints: VoCItem[];
  /** Per-persona voice reinforcement. */
  personaSignals: {
    beth: VoCItem[];
    linda: VoCItem[];
    other: VoCItem[];
  };
  /** High-frequency themes not yet codified into a category. */
  emergingThemes: VoCItem[];
  /** Per-product issues + praise. */
  productSignals: {
    compression: VoCItem[];
    easystretch: VoCItem[];
    ankle: VoCItem[];
  };
}

/** Subset of the index selected for a particular task (chosen by sliceSelector). */
export interface SelectedSlices {
  topObjections?: VoCItem[];
  topTestimonials?: VoCItem[];
  recurringQuestions?: VoCItem[];
  painPoints?: VoCItem[];
  desires?: VoCItem[];
  complaints?: VoCItem[];
  personaSignals?: VoCItem[];
  emergingThemes?: VoCItem[];
  productSignals?: VoCItem[];
  /** Slice names included — populated for metadata.slicesUsed. */
  sliceNames: string[];
}
