/**
 * Factory V2 — .doc export.
 *
 * VISUAL LANGUAGE: V1's UGC Creator Brief doc (downloadUtils.ts) — navy
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
    brief.header.instructions.length
      ? brief.header.instructions.map((i) => `• ${esc(i)}`).join('<br/>')
      : '—',
  );
  html += kvRow('Duration', esc(brief.task.duration));
  html += kvRow('Deadline', '3 days after the product delivery');
  html += `</table>`;

  // 3. AUDIO + SHOT TYPE INSTRUCTIONS
  html += sectionHeader('AUDIO TYPES EXPLAINED');
  html += glossaryTable(AUDIO_TYPES);
  html += sectionHeader('SHOT TYPES EXPLAINED');
  html += glossaryTable(SHOT_TYPES);

  // 4. SCRIPT (HOOKS) — every variation; hook 1 is the primary.
  html += sectionHeader(`SCRIPT (HOOKS) — ${brief.hooks.length} Variations`);
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

export async function exportBriefDoc(brief: UgcBriefV2): Promise<void> {
  const html = buildBriefHtml(brief);
  const blob = new Blob(['﻿' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${brief.taskName.replace(/[^\w-]+/g, '_')}_UGC_Brief.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
