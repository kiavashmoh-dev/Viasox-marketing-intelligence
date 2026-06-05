/**
 * Inspiration Bank — analyzer agent runner.
 *
 * Given an InspirationItem in 'analyzing' state plus its raw inputs (frames
 * for video, text for brief/script), call Claude vision and persist the
 * resulting tags/summary/learnings back into the store.
 */

import { sendVisionMessage, sendMessage, type ContentBlock } from '../api/claude';
import type { InspirationItem, InspirationAnalysis } from '../engine/inspirationTypes';
import { getEffectiveTags } from '../engine/inspirationTypes';
import { buildInspirationAnalyzerPrompt } from './inspirationAnalyzerPrompt';
import { stripDataUrlPrefix } from './frameExtractor';
import { updateItem, getItem, getFrames, getAllItems } from './inspirationStore';
import { CREATIVE_MODEL, UTILITY_MODEL } from '../config/models';

const MAX_TOKENS = 8000;
const MODEL = CREATIVE_MODEL;
/** Cheap, fast model for the lightweight text-only naming pass. */
const NAMING_MODEL = UTILITY_MODEL;

/** True when an item's title is still just its filename (or empty) — i.e.
 *  the user never gave it a meaningful name, so we're free to auto-name it. */
export function titleIsFilenameLike(item: InspirationItem): boolean {
  const t = (item.title || '').trim();
  if (!t) return true;
  if (t === item.filename) return true;
  // Looks like a filename if it ends with a known media/doc extension.
  if (/\.(mp4|mov|webm|avi|mkv|m4v|gif|png|jpe?g|docx?|pdf|txt|md)$/i.test(t)) return true;
  return false;
}

export interface AnalyzeVideoInput {
  item: InspirationItem;
  frames: string[]; // base64 jpeg data URLs
  attachedScriptText?: string;
}

export interface AnalyzeTextInput {
  item: InspirationItem;
  textContent: string;
}

/** Run the analyzer over a video item with N frames + optional script. */
export async function analyzeVideoItem(
  input: AnalyzeVideoInput,
  apiKey: string,
  signal?: AbortSignal
): Promise<InspirationItem> {
  // Surface any explicit upload-time selections (ad type / short-form) to the
  // analyzer prompt so it anchors to them instead of guessing.
  const overrides = input.item.userTagOverrides;
  const prompt = buildInspirationAnalyzerPrompt({
    kind: 'video',
    filename: input.item.filename,
    durationSeconds: input.item.durationSeconds,
    frameCount: input.frames.length,
    attachedScriptText: input.attachedScriptText,
    knownShortForm: overrides?.duration === '1-15 sec',
    knownAdType: overrides?.adType && overrides.adType !== 'unknown' ? overrides.adType : undefined,
  });

  const content: ContentBlock[] = [];
  for (const dataUrl of input.frames) {
    const { base64, mediaType } = stripDataUrlPrefix(dataUrl);
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    });
  }
  content.push({ type: 'text', text: prompt });

  const raw = await sendVisionMessage(
    'You are the Viasox Inspiration Bank analyzer agent. Output strict JSON only.',
    content,
    apiKey,
    MAX_TOKENS,
    MODEL,
    signal
  );

  const analysis = parseAnalyzerResponse(raw);
  return persistAnalysis(input.item, analysis);
}

/** Run the analyzer over a brief (text-only). Briefs include scripts inside them. */
export async function analyzeTextItem(
  input: AnalyzeTextInput,
  apiKey: string,
  signal?: AbortSignal
): Promise<InspirationItem> {
  const overrides = input.item.userTagOverrides;
  const prompt = buildInspirationAnalyzerPrompt({
    kind: 'brief',
    filename: input.item.filename,
    textContent: input.textContent,
    knownShortForm: overrides?.duration === '1-15 sec',
    knownAdType: overrides?.adType && overrides.adType !== 'unknown' ? overrides.adType : undefined,
  });

  const content: ContentBlock[] = [{ type: 'text', text: prompt }];

  const raw = await sendVisionMessage(
    'You are the Viasox Inspiration Bank analyzer agent. Output strict JSON only.',
    content,
    apiKey,
    MAX_TOKENS,
    MODEL,
    signal
  );

  const analysis = parseAnalyzerResponse(raw);
  return persistAnalysis(input.item, analysis);
}

/** Strip markdown fences if the model added them, then JSON.parse. */
function parseAnalyzerResponse(raw: string): InspirationAnalysis {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // Find first { and last } to be defensive against any leading/trailing prose
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Analyzer returned no JSON object');
  }
  const jsonText = cleaned.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Analyzer returned invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Analyzer returned non-object JSON');
  }
  const obj = parsed as Record<string, unknown>;
  if (!obj.tags || typeof obj.tags !== 'object') {
    throw new Error('Analyzer response missing tags');
  }

  // Coerce learnings to string[]
  const learnings = Array.isArray(obj.learnings)
    ? obj.learnings.map((l) => String(l)).filter(Boolean)
    : [];

  // Coerce customTags
  const tagsObj = obj.tags as Record<string, unknown>;
  const customTags = Array.isArray(tagsObj.customTags)
    ? tagsObj.customTags.map((t) => String(t)).filter(Boolean)
    : [];

  return {
    suggestedTitle: typeof obj.suggestedTitle === 'string' ? obj.suggestedTitle.trim() : undefined,
    tags: {
      duration: (tagsObj.duration as InspirationAnalysis['tags']['duration']) ?? 'unknown',
      adType: (tagsObj.adType as InspirationAnalysis['tags']['adType']) ?? 'unknown',
      angleType: (tagsObj.angleType as InspirationAnalysis['tags']['angleType']) ?? 'unknown',
      framework: (tagsObj.framework as InspirationAnalysis['tags']['framework']) ?? 'unknown',
      hookStyle: (tagsObj.hookStyle as InspirationAnalysis['tags']['hookStyle']) ?? 'unknown',
      isFullAi: Boolean(tagsObj.isFullAi),
      fullAiSpecification:
        (tagsObj.fullAiSpecification as InspirationAnalysis['tags']['fullAiSpecification']) ?? 'unknown',
      fullAiVisualStyle:
        (tagsObj.fullAiVisualStyle as InspirationAnalysis['tags']['fullAiVisualStyle']) ?? 'unknown',
      productCategory:
        (tagsObj.productCategory as InspirationAnalysis['tags']['productCategory']) ?? 'unknown',
      emotionalEntry: typeof tagsObj.emotionalEntry === 'string' ? tagsObj.emotionalEntry : '',
      customTags,
    },
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    learnings,
    styleNotes: typeof obj.styleNotes === 'string' ? obj.styleNotes : '',
    visualBlueprint: typeof obj.visualBlueprint === 'string' ? obj.visualBlueprint : undefined,
    hookBreakdown: typeof obj.hookBreakdown === 'string' ? obj.hookBreakdown : undefined,
    narrativeArc: typeof obj.narrativeArc === 'string' ? obj.narrativeArc : undefined,
    productBridge: typeof obj.productBridge === 'string' ? obj.productBridge : undefined,
    keyLanguage: typeof obj.keyLanguage === 'string' ? obj.keyLanguage : undefined,
    lineFlowAnalysis: typeof obj.lineFlowAnalysis === 'string' ? obj.lineFlowAnalysis : undefined,
  };
}

async function persistAnalysis(
  item: InspirationItem,
  analysis: InspirationAnalysis
): Promise<InspirationItem> {
  // Auto-name: if the user never gave this item a meaningful title (it's
  // still the raw filename), adopt the analyzer's suggestedTitle so the
  // bank shows a clear, readable name instead of random characters. If the
  // user DID set a custom title, we never overwrite it.
  const shouldAutoName = titleIsFilenameLike(item) && !!analysis.suggestedTitle;
  const nextTitle = shouldAutoName ? analysis.suggestedTitle! : item.title;

  const updated: InspirationItem = {
    ...item,
    title: nextTitle,
    tags: analysis.tags,
    summary: analysis.summary,
    learnings: analysis.learnings,
    styleNotes: analysis.styleNotes,
    visualBlueprint: analysis.visualBlueprint,
    hookBreakdown: analysis.hookBreakdown,
    narrativeArc: analysis.narrativeArc,
    productBridge: analysis.productBridge,
    keyLanguage: analysis.keyLanguage,
    lineFlowAnalysis: analysis.lineFlowAnalysis,
    status: 'ready',
    analysisError: undefined,
  };
  await updateItem(updated);
  return updated;
}

// ─── Lightweight backfill naming (text-only, cheap) ─────────────────────
//
// For items already analyzed before auto-naming existed (or any item still
// showing a filename), generate a clear name WITHOUT re-running the full
// vision analysis. Uses the stored analysis (summary, tags, hook, key
// language) as context for a small text-only Claude call.

/** Generate a short clear name for ONE item from its existing analysis.
 *  Returns the new title, or null if the item has no analysis to work from. */
export async function generateInspirationTitle(
  item: InspirationItem,
  apiKey: string,
  signal?: AbortSignal,
): Promise<string | null> {
  if (item.status !== 'ready') return null;
  const tags = getEffectiveTags(item);
  const ctx: string[] = [];
  if (item.summary) ctx.push(`Summary: ${item.summary}`);
  if (tags.adType && tags.adType !== 'unknown') ctx.push(`Ad type: ${tags.adType}`);
  if (tags.duration && tags.duration !== 'unknown') ctx.push(`Duration: ${tags.duration}`);
  if (tags.angleType && tags.angleType !== 'unknown') ctx.push(`Angle: ${tags.angleType}`);
  if (tags.hookStyle && tags.hookStyle !== 'unknown') ctx.push(`Hook style: ${tags.hookStyle}`);
  if (tags.emotionalEntry) ctx.push(`Emotional entry: ${tags.emotionalEntry}`);
  if (item.hookBreakdown) ctx.push(`Hook: ${item.hookBreakdown.slice(0, 300)}`);
  if (item.keyLanguage) ctx.push(`Key language: ${item.keyLanguage.slice(0, 300)}`);
  if (ctx.length === 0) return null;

  const system = `You name advertising references for a creative team's inspiration bank. Given a short analysis of one ad, output ONLY a 4-to-7 word, Title Case name that captures the ad's SUBJECT + ANGLE + (if distinctive) FORMAT. No quotes, no punctuation at the ends, no file extensions, no preamble. Examples: "Nurse Neuropathy Bedtime Confession", "Pharmacy Compression Price Comparison", "Sock-Mark Reveal Short-Form UGC". Output the name and nothing else.`;
  const user = `Analysis of the ad:\n${ctx.join('\n')}\n\nReturn the name only.`;

  const raw = await sendMessage(system, user, apiKey, 40, NAMING_MODEL, signal);
  // Clean: strip quotes/fences/trailing punctuation, collapse whitespace.
  const name = raw
    .replace(/^```.*$/gm, '')
    .replace(/^["'\s]+|["'\s.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Guard against the model returning something silly or empty.
  if (!name || name.length > 80 || name.split(' ').length > 10) return null;
  return name;
}

/** Backfill names across the bank. Only renames items whose title still
 *  looks like a filename (so user-set names are never touched). Returns the
 *  count renamed. Runs sequentially with a tiny delay so we don't hammer the
 *  API; the naming model + tiny output make each call cheap. */
export async function generateNamesForAll(
  apiKey: string,
  signal?: AbortSignal,
  onProgress?: (done: number, total: number, title: string) => void,
): Promise<number> {
  const items = (await getAllItems()).filter(
    (i) => i.status === 'ready' && titleIsFilenameLike(i),
  );
  let renamed = 0;
  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) break;
    const item = items[i];
    onProgress?.(i, items.length, item.title);
    try {
      const name = await generateInspirationTitle(item, apiKey, signal);
      if (name) {
        await updateItem({ ...item, title: name });
        renamed++;
      }
    } catch (err) {
      console.warn(`[generateNamesForAll] failed for ${item.id}:`, err);
    }
  }
  return renamed;
}

/**
 * Re-analyze an existing item to backfill new analysis fields
 * (productBridge, keyLanguage, lineFlowAnalysis) without losing
 * existing metadata (scores, stars, user overrides, usage data).
 */
export async function reanalyzeItem(
  itemId: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<InspirationItem | null> {
  const item = await getItem(itemId);
  if (!item || item.status !== 'ready') return null;

  if (item.kind === 'video') {
    const frames = await getFrames(itemId);
    if (frames.length === 0 && !item.attachedScriptText && !item.textContent) return null;
    const result = await analyzeVideoItem(
      { item, frames, attachedScriptText: item.attachedScriptText },
      apiKey,
      signal,
    );
    // Preserve user state and performance data that persistAnalysis would overwrite
    const preserved: InspirationItem = {
      ...result,
      starred: item.starred,
      autoStarred: item.autoStarred,
      userNotes: item.userNotes,
      userTagOverrides: item.userTagOverrides,
      usageCount: item.usageCount,
      derivedScore: item.derivedScore,
      derivedScoreSampleSize: item.derivedScoreSampleSize,
      lastUsedAt: item.lastUsedAt,
      lastUsedInBatchIds: item.lastUsedInBatchIds,
      contextualScores: item.contextualScores,
    };
    await updateItem(preserved);
    return preserved;
  } else {
    const textContent = item.textContent ?? '';
    if (!textContent.trim()) return null;
    const result = await analyzeTextItem(
      { item, textContent },
      apiKey,
      signal,
    );
    const preserved: InspirationItem = {
      ...result,
      starred: item.starred,
      autoStarred: item.autoStarred,
      userNotes: item.userNotes,
      userTagOverrides: item.userTagOverrides,
      usageCount: item.usageCount,
      derivedScore: item.derivedScore,
      derivedScoreSampleSize: item.derivedScoreSampleSize,
      lastUsedAt: item.lastUsedAt,
      lastUsedInBatchIds: item.lastUsedInBatchIds,
      contextualScores: item.contextualScores,
    };
    await updateItem(preserved);
    return preserved;
  }
}

/**
 * Re-analyze ALL ready items in the bank. Returns count of successfully
 * re-analyzed items. Skips items that fail gracefully.
 */
export async function reanalyzeAllItems(
  apiKey: string,
  signal?: AbortSignal,
  onProgress?: (done: number, total: number, title: string) => void,
): Promise<number> {
  const items = (await getAllItems()).filter((i) => i.status === 'ready');
  let done = 0;

  for (const item of items) {
    if (signal?.aborted) break;
    try {
      onProgress?.(done, items.length, item.title);
      await reanalyzeItem(item.id, apiKey, signal);
      done++;
    } catch (err) {
      console.warn(`[reanalyze] Failed for ${item.title}:`, err);
    }
  }

  return done;
}

/** Mark an item as failed and persist the error. */
export async function markFailed(item: InspirationItem, err: unknown): Promise<InspirationItem> {
  const message = err instanceof Error ? err.message : String(err);
  const updated: InspirationItem = {
    ...item,
    status: 'failed',
    analysisError: message,
  };
  await updateItem(updated);
  return updated;
}
