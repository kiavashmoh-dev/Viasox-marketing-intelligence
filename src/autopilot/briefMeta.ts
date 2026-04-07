/**
 * Brief metadata helpers.
 *
 * Pure functions that derive presentation-friendly metadata from a completed
 * autopilot task — ad type, voiceover presence, hooks/body counts, CTA, etc.
 *
 * Used by:
 *   - TaskBriefCard header badges (ad type + VO/no VO)
 *   - BatchChatPanel system prompt (so the assistant can answer
 *     "how many are non-VO?", "what are the CTAs?", etc.)
 */

import type { TaskPipelineState } from '../engine/autopilotTypes';
import { parseKvTable, parseScriptTable } from '../utils/downloadUtils';

export interface BriefMeta {
  briefName: string;
  product: string;
  angle: string;
  duration: string;
  adType: string;
  adTypeShort: string;
  isFullAi: boolean;
  fullAiSpecification?: string;
  fullAiVisualStyle?: string;
  hasVoiceover: boolean;
  voTone: string;
  framework: string;
  awarenessLevel: string;
  funnelStage: string;
  primaryEmotion: string;
  avatar: string;
  cta: string;
  hookCount: number;
  bodyRowCount: number;
  /** First hook line (handy for chat recaps) */
  firstHookLine: string;
  /** Compact one-line summary used in chat recaps */
  oneLineSummary: string;
}

const NEGATIVE_VO_VALUES = new Set([
  '',
  '—',
  '-',
  'n/a',
  'na',
  'none',
  'no',
  'no vo',
  'no voiceover',
  'no voice over',
  'no voice-over',
  'silent',
  'no audio',
  'no narration',
]);

/** Detect whether the parsed Voiceover field implies an actual VO is present. */
export function detectHasVoiceover(voiceoverField: string | undefined): boolean {
  if (!voiceoverField) return false;
  const normalized = voiceoverField.trim().toLowerCase();
  if (NEGATIVE_VO_VALUES.has(normalized)) return false;
  // Phrases like "no vo, captions only" should also count as no-VO
  if (/^no\b.*\b(vo|voice ?over|narration)/i.test(normalized)) return false;
  return normalized.length > 2;
}

/** Compact, screen-friendly label for an ad type. */
export function shortAdTypeLabel(adType: string): string {
  if (!adType) return 'Ecom';
  if (adType.startsWith('Full AI')) return 'Full AI';
  if (adType.startsWith('AGC')) return 'AGC';
  if (adType.startsWith('UGC')) return 'UGC';
  if (adType.startsWith('Ecom')) return 'Ecom';
  if (adType.startsWith('Founder')) return 'Founder';
  if (adType.startsWith('Fake Podcast')) return 'Podcast';
  if (adType.startsWith('Spokesperson')) return 'Spokesperson';
  if (adType.startsWith('Packaging')) return 'Packaging';
  if (adType === 'Static') return 'Static';
  return adType;
}

/** Try to find the brief's CTA / call-to-action across common locations. */
function extractCta(scriptResult: string, body: string[][]): string {
  // 1. Last body row often holds the CTA — check for shop/buy/get/order language
  for (let i = body.length - 1; i >= 0; i--) {
    const line = (body[i][3] ?? body[i][2] ?? '').toString();
    if (/\b(shop|buy|order|get|try|tap|swipe|link|visit|click)\b/i.test(line)) {
      return line.trim();
    }
  }
  // 2. Look for an explicit "CTA:" or "Call to Action:" mention in the markdown
  const ctaMatch = scriptResult.match(/\*\*(?:CTA|Call to Action|Call-to-Action)[:*]*\*\*\s*([^\n]+)/i);
  if (ctaMatch) return ctaMatch[1].replace(/\*\*/g, '').trim();
  // 3. Last body row regardless
  if (body.length > 0) {
    const lastLine = (body[body.length - 1][3] ?? body[body.length - 1][2] ?? '').toString();
    if (lastLine.trim()) return lastLine.trim();
  }
  return '';
}

/** Build a BriefMeta object from a completed task pipeline state. */
export function buildBriefMeta(taskState: TaskPipelineState): BriefMeta {
  const { task, scriptResult, recommendedFramework } = taskState;
  const adType = task.scriptParamsBase?.adType ?? task.anglesParams?.adType ?? 'Ecom Style';
  const isFullAi = adType === 'Full AI (Documentary, story, education, etc)';

  let editing: Record<string, string> = {};
  let strategy: Record<string, string> = {};
  let hooks: string[][] = [];
  let body: string[][] = [];

  if (scriptResult) {
    editing = parseKvTable(scriptResult, 'EDITING INSTRUCTIONS');
    strategy = parseKvTable(scriptResult, 'STRATEGY');
    hooks = parseScriptTable(scriptResult, 'SCRIPT \\(HOOKS\\)');
    body = parseScriptTable(scriptResult, 'SCRIPT \\(BODY\\)');
  }

  const voField = editing['Voiceover'] || '';
  // Full AI ads are always voiceover-dominant (per the prompt rules), so default to true
  // when the parsed editing field is missing/incomplete.
  const hasVoiceover = isFullAi ? true : detectHasVoiceover(voField);
  const voTone = voField.trim();

  const cta = scriptResult ? extractCta(scriptResult, body) : '';
  const firstHookLine = hooks.length > 0 ? (hooks[0][3] ?? hooks[0][2] ?? '').toString().trim() : '';

  const meta: BriefMeta = {
    briefName: task.parsed.name,
    product: task.product,
    angle: task.parsed.angle,
    duration: task.duration,
    adType,
    adTypeShort: shortAdTypeLabel(adType),
    isFullAi,
    fullAiSpecification: task.scriptParamsBase?.fullAiSpecification,
    fullAiVisualStyle: task.scriptParamsBase?.fullAiVisualStyle,
    hasVoiceover,
    voTone,
    framework: recommendedFramework ?? '',
    awarenessLevel: task.scriptParamsBase?.awarenessLevel ?? task.anglesParams?.awarenessLevel ?? '',
    funnelStage: task.scriptParamsBase?.funnelStage ?? task.anglesParams?.funnelStage ?? '',
    primaryEmotion: strategy['Primary Emotion'] ?? '',
    avatar: strategy['Avatar'] ?? '',
    cta,
    hookCount: hooks.length,
    bodyRowCount: body.length,
    firstHookLine,
    oneLineSummary: '',
  };

  meta.oneLineSummary =
    `${meta.briefName} — ${meta.product} / ${meta.angle} / ${meta.duration} · ${meta.adTypeShort}` +
    ` · ${meta.hasVoiceover ? 'VO' : 'No VO'}` +
    (meta.framework ? ` · ${meta.framework}` : '');

  return meta;
}
