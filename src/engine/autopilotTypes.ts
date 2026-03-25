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
  duration: '15s' | '30s' | '60s';
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
  | 'generating-script'
  | 'complete'
  | 'error';

export interface TaskPipelineState {
  task: AutopilotTask;
  step: PipelineStep;
  /** Raw markdown from the Angles Generator */
  conceptsRaw?: string;
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

// ─── Batch State ─────────────────────────────────────────────────────────────

export type BatchPhase =
  | 'idle'
  | 'parsing'
  | 'confirming'
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
}
