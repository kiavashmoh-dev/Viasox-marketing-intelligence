import type { AnglesParams, ScriptParams, ProductCategory } from './types';

// ─── Parsed from Asana Screenshot ────────────────────────────────────────────

export interface ParsedAsanaTask {
  name: string;       // e.g., "VIASOX-77"
  product: string;    // e.g., "EasyStretch"
  angle: string;      // e.g., "Neuropathy"
  medium: string;     // e.g., "Shortform"
}

// ─── Mapped Task ─────────────────────────────────────────────────────────────

export interface AutopilotTask {
  /** Original parsed data */
  parsed: ParsedAsanaTask;
  /** Mapped product category */
  product: ProductCategory;
  /** Mapped duration from medium */
  duration: '15s' | '30s' | '60s' | '90s';
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
}

// ─── Creative Direction ──────────────────────────────────────────────────

export interface ReferenceMedia {
  /** base64-encoded image/video thumbnail */
  base64: string;
  mediaType: string;
  fileName: string;
}

export interface CreativeDirection {
  /** Free-text instructions: "Focus on X", "Avoid Y", "This week lean into Z" */
  instructions: string;
  /** Uploaded reference images/videos — style guides for the batch */
  referenceMedia: ReferenceMedia[];
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
