/**
 * Creative Memory System — Type Definitions
 *
 * Persistent memory that makes the AI marketing team get better over time.
 * Stores compact summaries (not full brief text) to stay within localStorage limits.
 */

// ─── Per-Brief Memory Record (~500-800 bytes each) ──────────────────────────

export interface BriefMemoryRecord {
  id: string;                    // e.g., "VIASOX-77"
  batchId: string;               // ISO date string of batch run
  angle: string;                 // "Neuropathy", "Swelling", etc.
  product: string;               // "EasyStretch", "Compression", etc.
  medium: string;                // "Shortform", "Midform", "Expanded"
  duration: string;              // "1-15 sec", "16-59 sec", "60-90 sec" (Asana Medium column)
  framework: string;             // e.g., "PAS (Problem-Agitate-Solution)"
  hookStyles: string[];          // e.g., ["Question", "Bold Statement", "Relatable Moment"]
  hookSummaries: string[];       // First 80 chars of each of the 3 hooks
  conceptSummary: string;        // 1-2 sentence summary of the selected concept
  selectionReasoning: string;    // Why this concept was picked
  emotionalEntry: string;        // Primary emotion targeted
  persona: string;               // Target archetype (healthcare worker, senior, etc.)
  reviewScore: number;           // 1-10 from batch reviewer
  reviewVerdict: 'APPROVED' | 'NEEDS_ATTENTION';
  reviewFlags: string[];         // Which of the 10 checks got FLAG/FAIL
  reviewStrengths: string[];     // Bullet points from reviewer
  reviewWeaknesses: string[];    // Bullet points from reviewer
  /**
   * Inspiration Bank item IDs that were injected into this brief's concept
   * and/or script generation. Used post-batch to update each item's
   * derivedScore via recordInspirationUsage. Empty array when no bank items
   * were active for this task.
   */
  inspirationIdsUsed?: string[];
}

// ─── Angle × Framework × Hook Pattern Record ────────────────────────────────
//
// Stable, structured "what works" facts derived from BriefMemoryRecord history.
// These persist between batches so the evaluator gets hard data instead of
// relying on the curator's narrative each time.
//
// Identity = (angle, product, framework, hookStyleKey). hookStyleKey is the
// sorted-joined hookStyles list, so the same combo of styles maps to one row.

export interface AnglePatternRecord {
  angle: string;
  product: string;
  framework: string;
  hookStyles: string[];          // sorted, deduplicated
  avgScore: number;              // 1-10 average review score across uses
  sampleSize: number;            // number of briefs contributing
  bestExampleBriefId: string;    // brief id of the highest scoring instance
  worstExampleBriefId: string;
  lastUpdated: string;           // ISO timestamp
}

// ─── Redo Event (for angle directive proposer) ──────────────────────────────
//
// Captured when the user redoes a concept or script regen with redo
// instructions. Used by the angle-directive proposer to detect repeated
// patterns ("the user keeps removing 'Look,' as an opener") and surface
// candidate directives.

export interface RedoEvent {
  date: string;                  // ISO timestamp
  batchId: string;
  taskName: string;              // e.g., "VIASOX-77"
  angle: string;
  product: string;
  scope: 'concept' | 'script';
  /** Free-text redo instructions provided by the user. */
  instructions: string;
}

// ─── Batch Memory ───────────────────────────────────────────────────────────

export interface BatchMemoryRecord {
  batchId: string;               // ISO timestamp
  date: string;                  // Human-readable date
  taskCount: number;
  creativeDirection: string;     // The instructions field (empty string if none)
  briefs: BriefMemoryRecord[];
  batchReviewSummary: string;    // 3-5 sentence overall batch assessment
  batchFlags: string[];          // Batch-level check results
  overallStrongest: string;      // Task name of strongest brief
  overallWeakest: string;        // Task name of weakest brief
}

// ─── Feedback Memory ────────────────────────────────────────────────────────

export interface FeedbackRecord {
  date: string;
  batchId: string;
  source: 'creative_direction' | 'manual_feedback' | 'reviewer_pattern';
  content: string;               // What was said
  context: string;               // What angle/product/batch it applied to
}

// ─── Creative Intelligence Briefing (output of Curator Agent) ───────────────

export interface CreativeIntelligenceBriefing {
  generatedAt: string;
  totalBatchesAnalyzed: number;
  totalBriefsAnalyzed: number;
  frameworkUsage: Record<string, number>;
  angleUsage: Record<string, number>;
  hookStyleUsage: Record<string, number>;
  personaUsage: Record<string, number>;
  briefingText: string;          // Curator's synthesized narrative (500-800 words)
}

// ─── Score Calibration Snapshot ────────────────────────────────────────────
//
// Cached rolling-window calibration of recent review scores. Used by the
// batch reviewer to keep raising its bar as the system matures.

export interface ScoreCalibration {
  /** Window size used to compute these stats (e.g., 30 most recent briefs). */
  windowSize: number;
  /** Number of briefs actually included in the window. */
  sampleSize: number;
  median: number;        // 50th percentile
  p25: number;           // 25th percentile
  p75: number;           // 75th percentile
  mean: number;
  /** ISO timestamp the snapshot was computed. */
  computedAt: string;
}

// ─── Root Memory Store ──────────────────────────────────────────────────────

export interface CreativeMemoryStore {
  version: number;               // Schema version for migration
  batches: BatchMemoryRecord[];
  feedback: FeedbackRecord[];
  lastCuratorBriefing: CreativeIntelligenceBriefing | null;
  /** Derived structured patterns. Recomputed after every batch. */
  anglePatterns?: AnglePatternRecord[];
  /** Captured user redo events for the angle-directive proposer. */
  redoEvents?: RedoEvent[];
  /** Cached rolling calibration for the reviewer's rising-bar logic. */
  scoreCalibration?: ScoreCalibration | null;
  /** Outstanding angle-directive proposals awaiting user approval. */
  pendingDirectiveProposals?: AngleDirectiveProposal[];
}

// ─── Angle Directive Proposal ──────────────────────────────────────────────
//
// When the proposer detects 3+ similar redo events for the same angle, it
// drafts a candidate directive and stores it here for the user to approve.

export interface AngleDirectiveProposal {
  id: string;
  proposedAt: string;            // ISO timestamp
  angle: string;
  product: string;
  /** AI-drafted directive text the user can edit and accept. */
  directiveText: string;
  /** Recurring pattern detected — what triggered the proposal. */
  pattern: string;
  /** Redo event ids (or timestamps) backing the proposal. */
  evidence: string[];
}

// ─── Memory Stats (for UI display) ──────────────────────────────────────────

export interface MemoryStats {
  totalBatches: number;
  totalBriefs: number;
  totalFeedback: number;
  storageSizeKB: number;
  oldestBatch: string | null;
  newestBatch: string | null;
}
