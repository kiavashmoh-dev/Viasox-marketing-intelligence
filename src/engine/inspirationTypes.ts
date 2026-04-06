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

export type InspirationDuration = '15s' | '30s' | '60s' | '90s' | 'unknown';

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

  // User state
  starred: boolean;
  userNotes: string;
  status: InspirationStatus;
  analysisError?: string;
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
