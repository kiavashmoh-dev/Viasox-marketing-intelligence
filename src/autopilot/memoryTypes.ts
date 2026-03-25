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
  duration: string;              // "15s", "30s", "60s"
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
}

// ─── Batch Memory ───────────────────────────────────────────────────────────

export interface BatchMemoryRecord {
  batchId: string;               // ISO timestamp
  date: string;                  // Human-readable date
  taskCount: number;
  creativeDirection: string;     // The instructions field (empty string if none)
  referenceStyleSummary: string; // Summarized reference analysis (not full text)
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

// ─── Reference Style Memory ─────────────────────────────────────────────────

export interface ReferenceStyleRecord {
  date: string;
  batchId: string;
  fileNames: string[];           // Original file names of references
  styleSummary: string;          // 3-4 sentence style description
  keyTechniques: string[];       // e.g., ["fast-cut pacing", "text-heavy opens"]
  narrativeApproach: string;     // e.g., "Before-After with slow reveal"
  toneDescription: string;       // e.g., "warm, conversational, confessional"
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

// ─── Root Memory Store ──────────────────────────────────────────────────────

export interface CreativeMemoryStore {
  version: number;               // Schema version for migration
  batches: BatchMemoryRecord[];
  feedback: FeedbackRecord[];
  referenceStyles: ReferenceStyleRecord[];
  lastCuratorBriefing: CreativeIntelligenceBriefing | null;
}

// ─── Memory Stats (for UI display) ──────────────────────────────────────────

export interface MemoryStats {
  totalBatches: number;
  totalBriefs: number;
  totalFeedback: number;
  totalReferenceStyles: number;
  storageSizeKB: number;
  oldestBatch: string | null;
  newestBatch: string | null;
}
