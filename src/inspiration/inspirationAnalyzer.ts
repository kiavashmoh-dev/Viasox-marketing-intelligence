/**
 * Inspiration Bank — analyzer agent runner.
 *
 * Given an InspirationItem in 'analyzing' state plus its raw inputs (frames
 * for video, text for brief/script), call Claude vision and persist the
 * resulting tags/summary/learnings back into the store.
 */

import { sendVisionMessage, type ContentBlock } from '../api/claude';
import type { InspirationItem, InspirationAnalysis } from '../engine/inspirationTypes';
import { buildInspirationAnalyzerPrompt } from './inspirationAnalyzerPrompt';
import { stripDataUrlPrefix } from './frameExtractor';
import { updateItem } from './inspirationStore';

const MAX_TOKENS = 8000;
const MODEL = 'claude-opus-4-6';

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
  const prompt = buildInspirationAnalyzerPrompt({
    kind: 'video',
    filename: input.item.filename,
    durationSeconds: input.item.durationSeconds,
    frameCount: input.frames.length,
    attachedScriptText: input.attachedScriptText,
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
  const prompt = buildInspirationAnalyzerPrompt({
    kind: 'brief',
    filename: input.item.filename,
    textContent: input.textContent,
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
  const updated: InspirationItem = {
    ...item,
    tags: analysis.tags,
    summary: analysis.summary,
    learnings: analysis.learnings,
    styleNotes: analysis.styleNotes,
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
  const { getItem, getFrames } = await import('./inspirationStore');
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
  const { getAllItems } = await import('./inspirationStore');
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
