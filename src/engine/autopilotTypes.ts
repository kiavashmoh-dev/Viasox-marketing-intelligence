import type { AnglesParams, ScriptParams, ProductCategory } from './types';

// ─── Parsed from Asana Screenshot ────────────────────────────────────────────

export interface ParsedAsanaTask {
  name: string;       // e.g., "VIASOX-77"
  product: string;    // e.g., "EasyStretch"
  angle: string;      // e.g., "Neuropathy"
  medium: string;     // e.g., "Shortform"
  /**
   * Optional explicit ad type. When present (either extracted from the Asana board's
   * Ad Type column, or manually overridden by the user in the Planner dropdown), this
   * value is normalized and used directly instead of the medium/angle heuristic.
   * When absent, the mapper falls back to the heuristic which defaults to Ecom Style.
   */
  adType?: string;
}

// ─── Mapped Task ─────────────────────────────────────────────────────────────

export interface AutopilotTask {
  /** Original parsed data */
  parsed: ParsedAsanaTask;
  /** Mapped product category */
  product: ProductCategory;
  /** Mapped duration from medium column */
  duration: '1-15 sec' | '16-59 sec' | '60-90 sec';
  /** Params for the Angles Generator */
  anglesParams: AnglesParams;
  /** Partial ScriptParams — framework filled by concept selector */
  scriptParamsBase: Omit<ScriptParams, 'framework' | 'conceptAngleContext'>;
}

// ─── Pipeline Step Status ────────────────────────────────────────────────────

export type PipelineStep =
  | 'pending'
  | 'generating-concepts'
  | 'selecting-concept'
  | 'awaiting-concept-approval'
  | 'generating-script'
  | 'complete'
  | 'error';

// ─── Concept Selection for Interactive Review ────────────────────────────────

export interface ConceptOption {
  index: number;
  title: string;
  summary: string;
  fullText: string;
  recommendedFramework: string;
  reasoning: string;
  /** 1-5 strategic strength rating */
  strengthRating: number;
}

export interface TaskPipelineState {
  task: AutopilotTask;
  step: PipelineStep;
  /** Raw markdown from the Angles Generator */
  conceptsRaw?: string;
  /** Parsed concept options for interactive review */
  conceptOptions?: ConceptOption[];
  /** Which concept (1-5) was selected */
  selectedConceptIndex?: number;
  /** The selected concept's full text */
  selectedConceptText?: string;
  /** Why this concept was chosen */
  selectionReasoning?: string;
  /** The recommended framework from the selector */
  recommendedFramework?: string;
  /** Final brief markdown */
  scriptResult?: string;
  /** Error message if step failed */
  error?: string;
  /**
   * Inspiration Bank item IDs that were injected into this task's concept and/or
   * script generation. Captured by the pipeline so post-batch we can update each
   * item's derivedScore via recordInspirationUsage.
   */
  inspirationIdsUsed?: string[];
}

// ─── Creative Direction ──────────────────────────────────────────────────

export interface CreativeDirection {
  /** Free-text instructions: "Focus on X", "Avoid Y", "This week lean into Z" */
  instructions: string;
  /**
   * Optional per-task pinned inspiration overrides.
   * Keyed by AutopilotTask.parsed.name → InspirationItem.id.
   * When set for a task, that exact inspiration's full frames + script + tags + learnings + summary
   * are injected into the concept and script generation calls for that task only.
   * Other tasks proceed with the normal selector-based inspiration query.
   */
  pinnedInspirations: Record<string, string>;
}

// ─── Strategy Session ───────────────────────────────────────────────────────

export interface StrategyQuestion {
  id: string;
  question: string;
  context: string;
  /** Multiple-choice options — user picks one or types custom */
  options: string[];
  /** Which option the strategist recommends (index into options) */
  recommendedOption?: number;
  suggestedAnswer?: string;
}

export interface StrategySession {
  /** Initial strategic analysis of the batch */
  batchAnalysis: string;
  /** Targeted questions for the creative director */
  questions: StrategyQuestion[];
  /** User's answers (keyed by question id) */
  answers: Record<string, string>;
  /** Final strategy brief synthesized from analysis + answers */
  strategyBrief?: string;
}

// ─── Batch State ─────────────────────────────────────────────────────────────

export type BatchPhase =
  | 'idle'
  | 'parsing'
  | 'confirming'
  | 'strategy-session'
  | 'strategy-synthesizing'
  | 'generating-concepts'
  | 'concept-review'
  | 'running'
  | 'reviewing'
  | 'complete'
  | 'error';

export interface AutopilotState {
  phase: BatchPhase;
  tasks: TaskPipelineState[];
  currentTaskIndex: number;
  /** Batch review output from the reviewer agent */
  reviewResult?: string;
  /** Error during screenshot parsing or batch review */
  error?: string;
  /** Memory curator's briefing (if memory exists) */
  memoryBriefing?: string;
  /** Strategy session data */
  strategySession?: StrategySession;
}
