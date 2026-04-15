/**
 * Inspiration Bank — type definitions.
 *
 * The Inspiration Bank stores reference ads (videos, briefs, scripts) that an
 * expert agent has watched/read, tagged, and summarized. The bank is queried
 * by the generation pipelines (autopilot + standalone) to inject style
 * references into prompts.
 */

import type {
  AdType,
  AngleType,
  ScriptFramework,
  HookStyle,
  ProductCategory,
  FullAiSpecification,
  FullAiVisualStyle,
} from './types';

export type InspirationKind = 'video' | 'brief';

export type InspirationStatus = 'analyzing' | 'ready' | 'failed';

export type InspirationDuration = '1-15 sec' | '16-59 sec' | '60-90 sec' | 'unknown';

/** Tag schema — mirrors the existing dropdowns used elsewhere in the app. */
export interface InspirationTags {
  duration: InspirationDuration;
  adType: AdType | 'unknown';
  angleType: AngleType | 'unknown';
  framework?: ScriptFramework | 'unknown';
  hookStyle?: HookStyle | 'unknown';
  isFullAi: boolean;
  fullAiSpecification?: FullAiSpecification | 'unknown';
  fullAiVisualStyle?: FullAiVisualStyle | 'unknown';
  productCategory?: ProductCategory | 'unknown';
  /** Free-text emotional entry point — Frustration, Hope, Fear, Relief, etc. */
  emotionalEntry?: string;
  /** User-added free-form tags */
  customTags: string[];
}

/** Output of the analyzer agent for a single inspiration item. */
export interface InspirationAnalysis {
  tags: InspirationTags;
  /** Why this is good — 2-4 sentences */
  summary: string;
  /** Concrete techniques to apply — 3-5 bullets */
  learnings: string[];
  /** Visual / tonal patterns — 2-4 sentences */
  styleNotes: string;
  /** Analysis of the opening 3 seconds */
  hookBreakdown?: string;
  /** Structure breakdown — narrative arc */
  narrativeArc?: string;
  /** When and how the product is introduced — the "bridge" moment */
  productBridge?: string;
  /** Specific language, words, phrases, and pain points that make this ad effective */
  keyLanguage?: string;
  /** How the script lines build on each other — rhythm, momentum, transitions */
  lineFlowAnalysis?: string;
}

// ─── Contextual Performance Scoring ──────────────────────────────────────────
//
// Instead of a single flat derivedScore, track performance per (angleType,
// duration) context. An inspiration can be a 9/10 for Neuropathy + short-form
// but a 4/10 for Diabetes + expanded — the system should know the difference.

/** Key for context-specific scoring — serialized as "angleType|duration". */
export interface ContextualScoreEntry {
  angleType: string;
  duration: string;
  avgScore: number;
  sampleSize: number;
  /** Per-criterion average scores (built from the 11-criterion reviewer data). */
  criterionAvgs?: Partial<Record<string, number>>;
}

/** Persisted record for a single inspiration item. */
export interface InspirationItem {
  id: string;
  kind: InspirationKind;
  /** User-editable; defaults to filename */
  title: string;
  filename: string;
  /** ISO timestamp */
  uploadedAt: string;
  fileSize: number;
  mimeType: string;

  // Video-only metadata
  durationSeconds?: number;
  /** Base64 jpeg data URL, ~320px wide */
  thumbnailDataUrl?: string;
  frameCount?: number;

  /** Optional script/voiceover text the user pasted alongside a video upload */
  attachedScriptText?: string;

  /** For brief/script kind: the extracted plain text */
  textContent?: string;

  // Analyzer output
  tags: InspirationTags;
  /** Manual tag overrides applied on top of analyzer-generated tags */
  userTagOverrides?: Partial<InspirationTags>;

  summary: string;
  learnings: string[];
  styleNotes: string;
  hookBreakdown?: string;
  narrativeArc?: string;
  /** When and how the product is introduced — the "bridge" moment. */
  productBridge?: string;
  /** Specific language, words, phrases, and pain points used. */
  keyLanguage?: string;
  /** How script lines build on each other — rhythm, momentum, transitions. */
  lineFlowAnalysis?: string;

  // User state
  starred: boolean;
  /** True when starred automatically by the auto-star pass (vs. manual user star). */
  autoStarred?: boolean;
  userNotes: string;
  status: InspirationStatus;
  analysisError?: string;

  // ── Performance tracking (closed feedback loop) ─────────────────────────
  /**
   * Total number of times this item has been injected into a generated brief
   * (concept and/or script phase). Updated post-batch by recordInspirationUsage.
   */
  usageCount?: number;
  /**
   * Average review score (1-10) of all completed briefs that used this item
   * as inspiration. null until the item has been used at least once.
   */
  derivedScore?: number | null;
  /** Number of scored uses contributing to derivedScore. */
  derivedScoreSampleSize?: number;
  /** ISO timestamp of the most recent batch that used this item. */
  lastUsedAt?: string | null;
  /** Most recent batch IDs that used this item (capped to last 20). */
  lastUsedInBatchIds?: string[];
  /**
   * Performance scores broken down by (angleType, duration) context.
   * Keyed as "angleType|duration" → ContextualScoreEntry.
   * Falls back to flat derivedScore when no context match exists.
   */
  contextualScores?: Record<string, ContextualScoreEntry>;
}

/** Aggregated stats over the bank. */
export interface InspirationStats {
  total: number;
  byKind: Record<InspirationKind, number>;
  byAdType: Record<string, number>;
  byAngle: Record<string, number>;
  byProduct: Record<string, number>;
  starredCount: number;
  totalSizeMB: number;
  oldest: string | null;
  newest: string | null;
}

/** Filter shape for queryItems */
export interface InspirationFilter {
  kind?: InspirationKind;
  adType?: string;
  angleType?: string;
  productCategory?: string;
  isFullAi?: boolean;
  starredOnly?: boolean;
  searchText?: string;
}

/** Parameters for selecting inspiration items relevant to a brief. */
export interface InspirationSelectionParams {
  adType: AdType;
  angleType?: AngleType;
  productCategory?: ProductCategory;
  duration?: string;
  isFullAi?: boolean;
  fullAiSpec?: FullAiSpecification;
  fullAiVisualStyle?: FullAiVisualStyle;
}

/** Returns the effective tag set, applying user overrides on top of analyzer tags. */
export function getEffectiveTags(item: InspirationItem): InspirationTags {
  if (!item.userTagOverrides) return item.tags;
  return { ...item.tags, ...item.userTagOverrides };
}
