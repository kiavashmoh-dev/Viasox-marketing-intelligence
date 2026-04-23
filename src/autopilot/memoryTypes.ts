/**
 * Creative Memory System — Type Definitions
 *
 * Persistent memory that makes the AI marketing team get better over time.
 * Stores compact summaries (not full brief text) to stay within localStorage limits.
 */

// ─── Quality Scoring System ─────────────────────────────────────────────────
//
// 11 criteria scored 1-10 by the batch reviewer. The user can override the
// final composite score after reviewing. High scores teach the system what
// works; low scores trigger root-cause analysis to avoid repetition.

/** Names of the 11 quality criteria — used as keys throughout the scoring system. */
export const SCORING_CRITERIA = [
  'scriptVagueness',
  'confusionFactor',
  'scriptLineStrength',
  'hookQuality',
  'hookToBodyTransition',
  'adTypeAdaptation',
  'uniquenessCreativity',
  'angleSpecificity',
  'visualClarity',
  'inspirationAdherence',
  'frameworkExecution',
] as const;

export type CriterionName = typeof SCORING_CRITERIA[number];

/** Human-readable labels for each criterion (for UI display). */
export const CRITERION_LABELS: Record<CriterionName, string> = {
  scriptVagueness: 'Script Specificity',
  confusionFactor: 'Clarity for Cold Audience',
  scriptLineStrength: 'Line Strength (Read-Aloud)',
  hookQuality: 'Hook Quality',
  hookToBodyTransition: 'Hook → Body Transition',
  adTypeAdaptation: 'Ad Type Adaptation',
  uniquenessCreativity: 'Uniqueness & Creativity',
  angleSpecificity: 'Angle Specificity',
  visualClarity: 'Visual Clarity for Editors',
  inspirationAdherence: 'Inspiration Ad Adherence',
  frameworkExecution: 'Framework Execution',
};

/**
 * Criteria that carry 1.5x weight in the composite score.
 * These are the user's top concerns: hooks, confusion, and line strength.
 */
export const WEIGHTED_CRITERIA: CriterionName[] = [
  'hookQuality',
  'confusionFactor',
  'scriptLineStrength',
];

export interface CriterionScore {
  score: number;           // 1-10
  notes: string;           // Reviewer's explanation
  result: 'PASS' | 'FLAG' | 'FAIL';
}

export type ScoreBreakdown = {
  [K in CriterionName]: CriterionScore | null;
};

export interface ScoringRecord {
  reviewerBreakdown: ScoreBreakdown;
  reviewerOverallScore: number;          // Weighted composite 1-10
  userOverrideScore: number | null;      // User's override, null = accepted reviewer's
  userOverrideNotes: string | null;      // Why the user overrode
  finalScore: number;                    // userOverrideScore ?? reviewerOverallScore
  scoredAt: string;                      // ISO timestamp of reviewer scoring
  overriddenAt: string | null;           // ISO timestamp of user override
}

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
  reviewScore: number;           // Composite 1-10 (= scoring.finalScore when available)
  reviewVerdict: 'APPROVED' | 'NEEDS_ATTENTION';
  reviewFlags: string[];         // Which criteria got FLAG/FAIL
  reviewStrengths: string[];     // Bullet points from reviewer
  reviewWeaknesses: string[];    // Bullet points from reviewer
  /** Detailed per-criterion scoring. null for legacy briefs scored before v3. */
  scoring: ScoringRecord | null;
  /**
   * Inspiration Bank item IDs that were injected into this brief's concept
   * and/or script generation. Used post-batch to update each item's
   * derivedScore via recordInspirationUsage. Empty array when no bank items
   * were active for this task.
   */
  inspirationIdsUsed?: string[];
  /**
   * Full brief markdown (ts.scriptResult). Stored so the Memory Vault can
   * render past briefs and export them as .doc / .csv long after the batch
   * ends. Optional because older batches (pre-v4) didn't persist this.
   */
  briefMarkdown?: string;
  /**
   * Ad type for this brief (e.g., "Ecom Style", "AGC", "Static"). Captured
   * so the Memory Vault picks the right downloader (AGC → production CSV,
   * everything else → Ecom DOC). Optional for backwards compat.
   */
  adType?: string;
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
