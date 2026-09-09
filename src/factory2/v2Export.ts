/**
 * Factory V2 — brief export.
 *
 * UGC (Sep 2026): the THREE-TAB CREATOR DOCUMENT — `exportUgcBriefDocx`
 * downloads a real .docx cloned from Kia's example (ugcDocx.ts) and
 * `exportUgcBriefToGoogleDoc` creates a new Google Doc with three real tabs
 * through the Docs API (api/googleDocs.ts). Both render the same model
 * (ugcDocModel.buildUgcDocument). The legacy UGC HTML .doc below is kept
 * only as the ecom path's sibling and for briefs written before the document
 * layer existed.
 *
 * ECOM: unchanged — V1's Ecom Ad Template as Word-compatible HTML.
 *
 * VISUAL LANGUAGE (legacy/ecom): V1's UGC Creator Brief doc (downloadUtils.ts) — navy
 * #1b365d label cells and table headers, #bfbfbf light-gray borders, Arial
 * throughout, 12pt black section-header bars, the gray prose box — because
 * that layout is proven to import cleanly into Google Docs. The old Media
 * Engineered 9-column layout crammed badly there (July 2026); this export
 * keeps V1's styling EXACTLY and carries only the V2 content sections:
 *
 *   BRAND OVERVIEW → BRIEF OVERVIEW → AUDIO TYPES → SHOT TYPES →
 *   SCRIPT (HOOKS) → CTA OPTIONS → SCRIPT full read-through box →
 *   SCRIPT (BODY): LINES | SHOT TYPE | SHOT VISUAL | EDITOR NOTES
 *
 * Deliberately NOT in the doc (per the July 2026 redesign): the intro
 * callout, the evergreen filming-guidelines block, storyboard reference
 * screenshots, reshoot columns, and the per-row audio column (VO rows are
 * flagged inline in LINES instead). Alternate-take rows are covered by the
 * hooks/CTA tables, so the body table stays main-edit only — like V1's.
 */

import type { UgcBriefV2, V2Row } from './v2Types';
import { taskAdType, taskEcomProduction } from './v2Types';
import { buildUgcDocument } from './ugcDocModel';
import { buildUgcDocxBlob } from './ugcDocx';
import { GOOGLE_CLIENT_ID_STORAGE_KEY, GOOGLE_DOCS_EXPORT_SCOPES, getGoogleAccessToken } from '../api/googleAuth';
import { createGoogleDocFromUgcDocument } from '../api/googleDocs';
import { AUDIO_TYPES, SHOT_TYPES, type BoilerplateRow } from './templateBoilerplate';
import { getUgcStyle } from './ugcStyles';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── V1's exact style vocabulary (downloadUtils.ts) ──────────────────────────
const NAVY = '#1b365d';
const BORDER = '#bfbfbf';
const sectionHeaderStyle = `padding:6px 10px;font-weight:bold;font-size:12pt;color:#000;font-family:Arial,sans-serif;`;
const labelCellStyle = `background:${NAVY};padding:6px 10px;font-weight:bold;font-size:10pt;color:#ffffff;border:1px solid ${BORDER};width:160px;vertical-align:top;font-family:Arial,sans-serif;`;
const valueCellStyle = `padding:6px 10px;font-size:10pt;color:#000;border:1px solid ${BORDER};vertical-align:top;font-family:Arial,sans-serif;`;
const scriptHeaderStyle = `background:${NAVY};padding:6px 10px;font-weight:bold;font-size:10pt;color:#ffffff;border:1px solid ${BORDER};text-align:left;font-family:Arial,sans-serif;`;
const scriptCellStyle = `padding:6px 10px;font-size:10pt;color:#000;border:1px solid ${BORDER};vertical-align:top;font-family:Arial,sans-serif;`;

const sectionHeader = (title: string) =>
  `<p style="${sectionHeaderStyle}margin:16px 0 4px 0;">${title}</p>`;

/** Label/value row — value may carry pre-escaped inline HTML. */
const kvRow = (label: string, valueHtml: string) =>
  `<tr><td style="${labelCellStyle}">${esc(label)}</td><td style="${valueCellStyle}">${valueHtml || '—'}</td></tr>`;

/** Boilerplate glossary rows (Audio/Shot types) as plain br-joined lines —
 *  the safest list rendering for a Google Docs import. */
const glossaryTable = (rows: BoilerplateRow[]) =>
  `<table>${rows
    .map((r) => kvRow(r.label, r.bullets.map((b) => esc(b)).join('<br/>')))
    .join('')}</table>`;

/** Main-edit rows (through the End Card, excluding alternate takes — those
 *  are covered by the hooks/CTA tables). */
function mainEditWithEndCard(brief: UgcBriefV2): V2Row[] {
  const endIdx = brief.storyboard.findIndex((r) => r.clipNumber === 'end-card');
  return endIdx === -1 ? brief.storyboard : brief.storyboard.slice(0, endIdx + 1);
}

/** The full doc as Word-compatible HTML (pure — exported for tests). */
export function buildBriefHtml(brief: UgcBriefV2): string {
  const style = getUgcStyle(brief.task.ugcStyle);
  const date = (brief.createdAt || '').slice(0, 10);

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(brief.taskName)}</title>
<style>
@page { margin: 0.75in; }
body { font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; padding: 30px; color: #000; font-size: 11pt; }
table { border-collapse: collapse; width: 100%; margin-bottom: 16px; page-break-inside: avoid; }
h1 { text-align: center; }
.script-box { padding:10px 14px;border:1px solid ${BORDER};font-size:10.5pt;color:#000;line-height:1.5;background:#f8f9fb;font-family:Arial,sans-serif;margin-bottom:16px;white-space:pre-wrap; }
</style></head><body>`;

  html += `<h1 style="font-size:16pt;color:#000;margin:0 0 20px 0;font-weight:bold;font-family:Arial,sans-serif;">UGC Creator Brief</h1>`;

  // 1. BRAND OVERVIEW
  html += sectionHeader('BRAND OVERVIEW');
  html += `<table>`;
  html += kvRow('Brand Name', 'Viasox');
  html += kvRow('Product', esc(brief.task.product));
  html += kvRow('Concept', esc(brief.header.concept));
  html += kvRow('Angle', esc(brief.header.angle));
  html += kvRow('UGC Style', `<b>${esc(style.name)}</b> — ${esc(style.oneLiner)}`);
  html += kvRow('Awareness Level', esc(brief.header.awarenessLevel));
  html += kvRow('Framework', `<b>${esc(brief.framework.name)}</b> — ${esc(brief.framework.rationale)}`);
  html += kvRow('Website', 'https://viasox.com');
  html += `</table>`;

  // 2. BRIEF OVERVIEW
  html += sectionHeader('BRIEF OVERVIEW');
  html += `<table>`;
  html += kvRow('Brief', esc(brief.taskName));
  html += kvRow('Date', esc(date));
  html += kvRow('Video Tonality', esc(brief.header.videoTonality));
  html += kvRow('Attire', esc(brief.header.attire));
  html += kvRow(
    'Instructions',
    [...brief.header.instructions.map((i) => `• ${esc(i)}`),
      `• Record ALL ${brief.hooks.length} hooks as separate takes of the opening — see the SCRIPT (HOOKS) section below.`,
    ].join('<br/>'),
  );
  html += kvRow('Duration', esc(brief.task.duration));
  html += kvRow('Deadline', '3 days after the product delivery');
  html += `</table>`;

  // 3. AUDIO + SHOT TYPE INSTRUCTIONS
  html += sectionHeader('AUDIO TYPES EXPLAINED');
  html += glossaryTable(AUDIO_TYPES);
  html += sectionHeader('SHOT TYPES EXPLAINED');
  html += glossaryTable(SHOT_TYPES);

  // 4. SCRIPT (HOOKS) — every variation; hook 1 is the primary. The
  // recording note exists because creators otherwise film only the main
  // edit and never realize the alternate hooks are separate takes
  // (director feedback, Week-1 yapper batch, Aug 2026).
  html += sectionHeader(`SCRIPT (HOOKS) — ${brief.hooks.length} Variations`);
  html += `<div style="padding:8px 12px;border:1px solid ${BORDER};background:#f8f9fb;font-size:10pt;color:#000;font-family:Arial,sans-serif;margin:0 0 8px 0;line-height:1.45;"><b>&#9888;&#65039; CREATOR &mdash; RECORD EVERY HOOK BELOW:</b> film EACH hook as its OWN separate short clip, in the exact same setup, framing, and energy as your main video&rsquo;s opening. Deliver just that hook line (let it run one beat into the next line if it feels natural, then stop). Your MAIN video uses Hook 1 as its opening; the extra hook clips are swapped in by our editor to create ad variations. Name the extra clips <b>H2, H3, H4</b> when you submit.</div>`;
  html += `<table>`;
  html += `<tr><th style="${scriptHeaderStyle}width:40px;">#</th><th style="${scriptHeaderStyle}">HOOK LINE</th></tr>`;
  brief.hooks.forEach((h, i) => {
    html += `<tr><td style="${scriptCellStyle}text-align:center;width:40px;">${i + 1}</td><td style="${scriptCellStyle}">${esc(h.text)}</td></tr>`;
  });
  html += `</table>`;

  // 5. CTA OPTIONS
  if (brief.ctas.length > 0) {
    html += sectionHeader('CTA OPTIONS');
    html += `<table>`;
    html += `<tr><th style="${scriptHeaderStyle}width:40px;">#</th><th style="${scriptHeaderStyle}">CTA LINE</th></tr>`;
    brief.ctas.forEach((c, i) => {
      html += `<tr><td style="${scriptCellStyle}text-align:center;width:40px;">${i + 1}</td><td style="${scriptCellStyle}">${esc(c.text)}</td></tr>`;
    });
    html += `</table>`;
  }

  // 6. SCRIPT — the full read-through box, before the breakdown table.
  html += sectionHeader('SCRIPT — FULL READ-THROUGH');
  html += `<div class="script-box">${esc(brief.scriptProse)}</div>`;

  // 7. SCRIPT (BODY) — LINES | SHOT TYPE | SHOT VISUAL | EDITOR NOTES.
  html += sectionHeader('SCRIPT (BODY)');
  html += `<table>`;
  html += `<tr>` +
    `<th style="${scriptHeaderStyle}">LINES</th>` +
    `<th style="${scriptHeaderStyle}width:110px;">SHOT TYPE</th>` +
    `<th style="${scriptHeaderStyle}">SHOT VISUAL</th>` +
    `<th style="${scriptHeaderStyle}width:170px;">EDITOR NOTES</th>` +
    `</tr>`;
  for (const r of mainEditWithEndCard(brief)) {
    const isEndCard = r.clipNumber === 'end-card';
    const line = isEndCard
      ? '—'
      : `${r.audioType === 'VO' ? '<i>(VO)</i> ' : ''}${esc(r.scriptLine)}`;
    const visual = isEndCard || !r.shotDescription || r.shotDescription === '-' ? '—' : esc(r.shotDescription);
    html += `<tr>` +
      `<td style="${scriptCellStyle}">${line}</td>` +
      `<td style="${scriptCellStyle}width:110px;">${esc(String(r.shotType))}</td>` +
      `<td style="${scriptCellStyle}">${visual}</td>` +
      `<td style="${scriptCellStyle}width:170px;">${esc(r.editorNotes || '')}</td>` +
      `</tr>`;
  }
  html += `</table>`;

  html += `<p style="margin-top:30px;font-size:9pt;color:#999;border-top:1px solid #ddd;padding-top:8px;font-family:Arial,sans-serif;">Generated by Viasox Marketing Intelligence</p>`;
  html += `</body></html>`;
  return html;
}

/**
 * The ecom editing-brief doc — V1's "Ecom Ad Template" anatomy (Kia's
 * decision: the editors keep receiving the format they know), filled from
 * V2's typed brief. Same navy/Arial visual language; the body table gains an
 * OVERLAY column, with the script line kept RIGHTMOST (the V1 invariant).
 */
export function buildEcomBriefHtml(brief: UgcBriefV2): string {
  const date = (brief.createdAt || '').slice(0, 10);
  const ed = brief.header.ecomEditing;
  const production = taskEcomProduction(brief.task);
  const aiMode = production !== 'library';
  const visualHeader = aiMode ? 'GENERATION PROMPT' : 'SUGGESTED VISUAL';
  // AI production: the writer authors the casting/style spec ONCE and cells
  // carry only the scene half — the export COMPOSES the full self-contained
  // generation prompt here, so the editor can copy any cell straight into a
  // generator. (This is the redundancy fix: the spec is no longer emitted
  // per-row by the model, it is prepended per-row by the tool.)
  const specPrefix = aiMode && ed?.casting
    ? `<span style="color:#666;font-style:italic;">[${production === 'ai-animation' ? 'STYLE + CHARACTER' : 'PERSONA'}: ${esc(ed.casting)}]</span><br/>`
    : '';
  const composedVisual = (cell: string) =>
    cell ? `${specPrefix}${esc(cell)}` : specPrefix ? `${specPrefix}—` : '—';
  const rows = mainEditWithEndCard(brief).filter((r) => r.clipNumber !== 'end-card');
  // The scene carrying hook 1 (identity link, never text matching).
  const hookRow = rows.find((r) => r.mirrorsLineId === brief.hooks[0]?.id) ?? rows[0];

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(brief.taskName)}</title>
<style>
@page { margin: 0.75in; }
body { font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; padding: 30px; color: #000; font-size: 11pt; }
table { border-collapse: collapse; width: 100%; margin-bottom: 16px; page-break-inside: avoid; }
h1 { text-align: center; }
.script-box { padding:10px 14px;border:1px solid ${BORDER};font-size:10.5pt;color:#000;line-height:1.5;background:#f8f9fb;font-family:Arial,sans-serif;margin-bottom:16px;white-space:pre-wrap; }
</style></head><body>`;

  html += `<h1 style="font-size:16pt;color:#000;margin:0 0 20px 0;font-weight:bold;font-family:Arial,sans-serif;">Ecom Ad Template</h1>`;

  // 1. BRIEF INFO
  html += sectionHeader('BRIEF INFO');
  html += `<table>`;
  html += kvRow('Brief ID', esc(brief.taskName));
  html += kvRow('Date', esc(date));
  html += kvRow('Product', esc(brief.task.product));
  html += kvRow('Format', `${esc(brief.task.duration)} &mdash; 9x16 vertical`);
  html += kvRow(
    'Production',
    production === 'ai-lifestyle'
      ? '<b>AI LIFESTYLE (fully AI-generated)</b> — every scene is generated and must look like REAL UGC (a viewer cannot tell). Each row’s visual cell is the GENERATION PROMPT for that scene; the CASTING spec below is restated in every prompt.'
      : production === 'ai-animation'
        ? '<b>AI ANIMATION (fully AI-generated)</b> — every scene is a generated ANIMATION in ONE declared style (no real faces). Each row’s visual cell is the GENERATION PROMPT for that scene; the STYLE + CHARACTER spec below is restated in every prompt. The only legal style break is the real-product end card.'
        : 'Footage library — the editor assembles from existing clips.',
  );
  html += `</table>`;

  // 2. STRATEGY
  html += sectionHeader('STRATEGY');
  html += `<table>`;
  html += kvRow('Awareness Level', esc(brief.header.awarenessLevel));
  html += kvRow('Concept', esc(brief.header.concept));
  html += kvRow('Angle', esc(brief.header.angle));
  html += kvRow('Framework', `<b>${esc(brief.framework.name)}</b> — ${esc(brief.framework.rationale)}`);
  html += kvRow('Tonality (arc)', esc(brief.header.videoTonality));
  html += `</table>`;

  // 3. EDITING INSTRUCTIONS — the V1 block, as DIRECTION.
  html += sectionHeader('EDITING INSTRUCTIONS');
  html += `<table>`;
  html += kvRow('Pacing', esc(ed?.pacing || ''));
  html += kvRow('Resolution', '9x16');
  html += kvRow('Caption & Graphics', aiMode
    ? 'Subtitles on. Per-scene text overlays are in the OVERLAY column of the script body — overlays are added in POST, never generated in-scene (generated in-scene text is the #1 AI tell).'
    : 'Subtitles on. Per-scene text overlays are in the OVERLAY column of the script body.');
  html += kvRow('Transitions', esc(ed?.transitions || ''));
  html += kvRow('Music', esc(ed?.music || ''));
  html += kvRow('Voiceover', 'AI voiceover — reads the SCRIPT below VERBATIM. Do not paraphrase any line.');
  if (aiMode && ed?.casting) {
    html += production === 'ai-animation'
      ? kvRow('Style & Character', `<b>${esc(ed.casting)}</b><br/>This spec is already prepended to every GENERATION PROMPT cell below — generate every scene with it in full. The declared style and the avatar's fixed anchors must never flicker between scenes.`)
      : kvRow('Casting', `<b>${esc(ed.casting)}</b><br/>This spec is already prepended to every GENERATION PROMPT cell below — generate every scene with it in full. Identity anchors (glasses, jewelry, signature garment) must never flicker between scenes.`);
  }
  html += kvRow('Special Notes', esc(ed?.specialNotes || ''));
  html += kvRow(
    'Notes',
    brief.header.instructions.map((i) => `• ${esc(i)}`).join('<br/>') || '—',
  );
  html += `</table>`;

  // 4. SCRIPT (HOOKS) — each hook is an alternate opener over scene 1's visual.
  html += sectionHeader(`SCRIPT (HOOKS) — ${brief.hooks.length} Variations`);
  html += `<div style="padding:8px 12px;border:1px solid ${BORDER};background:#f8f9fb;font-size:10pt;color:#000;font-family:Arial,sans-serif;margin:0 0 8px 0;line-height:1.45;"><b>EDITOR:</b> every hook below is an ALTERNATE OPENER for the same video — record each as its own VO take over the scene-1 visual, and cut one variation per hook. Hook 1 is the primary edit.</div>`;
  html += `<table>`;
  html += `<tr><th style="${scriptHeaderStyle}width:40px;">LINE #</th><th style="${scriptHeaderStyle}width:110px;">SHOT TYPE</th><th style="${scriptHeaderStyle}width:220px;">${visualHeader}</th><th style="${scriptHeaderStyle}">HOOK LINE</th></tr>`;
  brief.hooks.forEach((h, i) => {
    html += `<tr><td style="${scriptCellStyle}text-align:center;width:40px;">${i + 1}</td><td style="${scriptCellStyle}width:110px;">${esc(String(hookRow?.shotType ?? ''))}</td><td style="${scriptCellStyle}width:220px;">${composedVisual(hookRow?.shotDescription ?? '')}</td><td style="${scriptCellStyle}">${esc(h.text)}</td></tr>`;
  });
  html += `</table>`;

  // 5. CTA OPTIONS
  if (brief.ctas.length > 0) {
    html += sectionHeader('CTA OPTIONS');
    html += `<table>`;
    html += `<tr><th style="${scriptHeaderStyle}width:40px;">#</th><th style="${scriptHeaderStyle}">CTA LINE</th></tr>`;
    brief.ctas.forEach((c, i) => {
      html += `<tr><td style="${scriptCellStyle}text-align:center;width:40px;">${i + 1}</td><td style="${scriptCellStyle}">${esc(c.text)}</td></tr>`;
    });
    html += `</table>`;
  }

  // 6. THE FULL VOICEOVER — the verbatim contract.
  html += sectionHeader('SCRIPT — FULL VOICEOVER (read verbatim)');
  html += `<div class="script-box">${esc(brief.scriptProse)}</div>`;

  // 7. SCRIPT (BODY) — V1's 4-col shape + the OVERLAY column; the script
  //    line stays RIGHTMOST (the V1 ecom invariant).
  html += sectionHeader('SCRIPT (BODY)');
  html += `<table>`;
  html += `<tr>` +
    `<th style="${scriptHeaderStyle}width:40px;">LINE #</th>` +
    `<th style="${scriptHeaderStyle}width:110px;">SHOT TYPE</th>` +
    `<th style="${scriptHeaderStyle}width:200px;">${visualHeader}</th>` +
    `<th style="${scriptHeaderStyle}width:140px;">OVERLAY</th>` +
    `<th style="${scriptHeaderStyle}">SCRIPT LINE</th>` +
    `</tr>`;
  rows.forEach((r) => {
    html += `<tr>` +
      `<td style="${scriptCellStyle}text-align:center;width:40px;">${esc(String(r.clipNumber))}</td>` +
      `<td style="${scriptCellStyle}width:110px;">${esc(String(r.shotType))}</td>` +
      `<td style="${scriptCellStyle}width:200px;">${composedVisual(r.shotDescription || '')}</td>` +
      `<td style="${scriptCellStyle}width:140px;">${esc(r.overlayText || '—')}</td>` +
      `<td style="${scriptCellStyle}">${esc(r.scriptLine || '—')}</td>` +
      `</tr>`;
  });
  html += `</table>`;

  html += `<p style="margin-top:30px;font-size:9pt;color:#999;border-top:1px solid #ddd;padding-top:8px;font-family:Arial,sans-serif;">Generated by Viasox Marketing Intelligence</p>`;
  html += `</body></html>`;
  return html;
}

/** localStorage key for the Google OAuth client id (pasted once by the director). */
export const GOOGLE_CLIENT_ID_KEY = GOOGLE_CLIENT_ID_STORAGE_KEY;

function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'brief';
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** UGC: download the three-tab creator document as a .docx named after the task. */
export async function exportUgcBriefDocx(brief: UgcBriefV2): Promise<void> {
  const doc = buildUgcDocument(brief);
  const blob = await buildUgcDocxBlob(doc);
  triggerDownload(blob, `${safeFileName(doc.title)}.docx`);
}

/** UGC: create a NEW Google Doc (three real tabs) in the signed-in user's
 *  Drive, named after the task. Returns the document URL. */
export async function exportUgcBriefToGoogleDoc(brief: UgcBriefV2, clientId: string): Promise<string> {
  const doc = buildUgcDocument(brief);
  const token = await getGoogleAccessToken(clientId, GOOGLE_DOCS_EXPORT_SCOPES);
  const { url } = await createGoogleDocFromUgcDocument(doc, token);
  return url;
}

export async function exportBriefDoc(brief: UgcBriefV2): Promise<void> {
  const isEcom = taskAdType(brief.task) === 'ecom';
  const html = isEcom ? buildEcomBriefHtml(brief) : buildBriefHtml(brief);
  const blob = new Blob(['﻿' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${brief.taskName.replace(/[^\w-]+/g, '_')}_${isEcom ? 'Ecom' : 'UGC'}_Brief.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
