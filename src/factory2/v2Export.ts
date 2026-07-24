/**
 * Factory V2 — .doc export.
 *
 * Renders the full standardized UGC brief (Media Engineered layout: intro
 * callout → brand/brief overview → evergreen guidelines + glossaries →
 * script prose → storyboard table WITH embedded reference screenshots) as
 * a Word-compatible HTML .doc, mirroring V1's downloadUtils approach but
 * driven by the structured brief object instead of parsed markdown.
 */

import type { UgcBriefV2 } from './v2Types';
import { getFrames } from '../inspiration/inspirationStore';
import { AUDIO_TYPES, GUIDELINES, INTRO_CALLOUT, SHOT_TYPES, type BoilerplateRow } from './templateBoilerplate';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function kvTable(title: string, rows: Array<[string, string]>): string {
  return `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;margin:12px 0;">
  <tr><th colspan="2" style="background:#e8e8e8;text-align:center;">${esc(title)}</th></tr>
  ${rows.map(([k, v]) => `<tr><td style="background:#d6e6f7;width:180px;"><b>${esc(k)}</b></td><td>${v}</td></tr>`).join('\n')}
</table>`;
}

function bulletTable(title: string, rows: BoilerplateRow[]): string {
  return `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;margin:12px 0;">
  <tr><th colspan="2" style="background:#e8e8e8;text-align:center;">${esc(title)}</th></tr>
  ${rows
    .map(
      (r) =>
        `<tr><td style="background:#d6e6f7;width:180px;"><b>${esc(r.label)}</b></td><td><ul style="margin:0;padding-left:18px;">${r.bullets
          .map((b) => `<li>${esc(b)}</li>`)
          .join('')}</ul></td></tr>`,
    )
    .join('\n')}
</table>`;
}

export async function exportBriefDoc(
  brief: UgcBriefV2,
  frameCache: Record<string, string[]> = {},
): Promise<void> {
  // Resolve every referenced frame to a data URL (cache-first, store-fallback).
  const imgByRow = new Map<string, string>();
  for (const row of brief.storyboard) {
    if (row.reference.kind !== 'frame') continue;
    const { itemId, frameIndex } = row.reference;
    let frames = frameCache[itemId];
    if (!frames) {
      try {
        frames = await getFrames(itemId);
      } catch {
        frames = [];
      }
    }
    const src = frames?.[frameIndex];
    if (src) imgByRow.set(row.id, src);
  }

  const storyboardRows = brief.storyboard
    .map((r) => {
      const clip = r.clipNumber === 'end-card' ? 'End Card' : String(r.clipNumber);
      const img = imgByRow.get(r.id);
      const refCell =
        r.reference.kind === 'same-as'
          ? `<i>Same as clip ${r.reference.clipNumber}</i>`
          : img
            ? `<img src="${img}" width="110" style="border:1px solid #ccc;" />${r.reference.kind === 'frame' && r.reference.note ? `<br/><i>${esc(r.reference.note)}</i>` : ''}`
            : r.reference.kind === 'none' && r.clipNumber !== 'end-card'
              ? `<i>${esc(r.reference.reason)}</i>`
              : '-';
      return `<tr>
  <td style="text-align:center;"><b>${esc(clip)}</b></td>
  <td style="text-align:center;">${esc(r.audioType)}</td>
  <td>${r.clipNumber === 'end-card' ? '-' : esc(r.scriptLine)}</td>
  <td style="text-align:center;"><b>${esc(r.shotType)}</b></td>
  <td>${r.clipNumber === 'end-card' ? '-' : esc(r.shotDescription)}</td>
  <td style="text-align:center;">${refCell}</td>
  <td>${esc(r.editorNotes || '')}</td>
  <td></td>
  <td></td>
</tr>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(brief.taskName)} — UGC Creator Brief</title></head>
<body style="font-family:Segoe UI,Arial,sans-serif;font-size:11pt;color:#1a1a1a;max-width:900px;">
<h1 style="text-align:center;">Viasox UGC Creator Brief — ${esc(brief.taskName)}</h1>

<div style="background:#f0f0f0;border-radius:8px;padding:14px;margin:14px 0;">💡 <b>${esc(INTRO_CALLOUT)}</b></div>

${kvTable('Brand Overview', [
  ['Brand Name', 'Viasox'],
  ['Product', esc(brief.task.product)],
  ['Concept', esc(brief.header.concept)],
  ['Angle', esc(brief.header.angle)],
  ['Awareness level', esc(brief.header.awarenessLevel)],
  ['Framework', `${esc(brief.framework.name)} — <i>${esc(brief.framework.rationale)}</i>`],
  ['Website', '<a href="https://viasox.com">https://viasox.com</a>'],
])}

${kvTable('Brief Overview', [
  ['Video Tonality', esc(brief.header.videoTonality)],
  ['Attire', esc(brief.header.attire)],
  ['Instructions', brief.header.instructions.length ? `<ul style="margin:0;padding-left:18px;">${brief.header.instructions.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '-'],
  ['Duration', esc(brief.task.duration)],
  ['Deadline', '3 days after the product delivery'],
])}

${bulletTable('Please read these guidelines before you get started', GUIDELINES)}
${bulletTable('Audio Types Explained', AUDIO_TYPES)}
${bulletTable('Shot Types Explained', SHOT_TYPES)}

<table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse;width:100%;margin:12px 0;">
  <tr><th style="background:#d6e6f7;">Script</th></tr>
  <tr><td>
    ${brief.hooks.map((h) => `<p><b>• ${esc(h.text)}</b></p>`).join('')}
    <p style="white-space:pre-wrap;">${esc(brief.scriptProse)}</p>
    ${brief.ctas.map((c) => `<p><b>• ${esc(c.text)}</b></p>`).join('')}
  </td></tr>
</table>

<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;margin:12px 0;">
  <tr style="background:#d6e6f7;">
    <th>Clip<br/>Number</th><th>Audio<br/>Type</th><th>Script</th><th>Shot<br/>Type</th>
    <th>Shot Description</th><th>Storyboard</th><th>Video Editor<br/>Notes</th>
    <th>Reshoot<br/>Needed?</th><th>Reshoot<br/>Description</th>
  </tr>
  ${storyboardRows}
</table>

<p style="color:#888;font-size:9pt;">© Viasox ${new Date().getFullYear()} — Factory V2</p>
</body></html>`;

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
