/**
 * Brief preview components — only two, matching the two delivery templates.
 *
 *   - EcomBriefPreview — every editing brief (Ecom Style, Full AI, AI Podcast, Static)
 *   - AgcBriefPreview  — every production brief (AGC, Founder, Spokesperson,
 *                       Filmed Podcast, Packaging/Employee, UGC)
 *
 * The previews render the actual brief content the script writer produced
 * so the user sees what's in the file before they download. Same shape as
 * the downloaded artifact (.doc or .csv).
 */

import type { AdType } from '../../engine/types';
import { parseKvTable, parseScriptTable } from '../../utils/downloadUtils';
import { getBriefTemplateId } from '../../prompts/briefTemplates';

const NAVY = '#1b365d';
const BORDER = '#bfbfbf';

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-xs font-bold text-slate-800 mt-4 mb-1.5 uppercase tracking-wider">
      {title}
    </div>
  );
}

function KvTable({ data, fields }: { data: Record<string, string>; fields: string[] }) {
  const rows = fields.filter((f) => data[f]);
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-xs border-collapse mb-1">
      <tbody>
        {rows.map((field) => (
          <tr key={field} style={{ borderBottom: `1px solid ${BORDER}` }}>
            <td
              className="py-1.5 px-2.5 font-semibold text-white align-top"
              style={{ background: NAVY, width: 140, border: `1px solid ${BORDER}`, fontSize: 11 }}
            >
              {field}
            </td>
            <td
              className="py-1.5 px-2.5 text-slate-800 align-top"
              style={{ border: `1px solid ${BORDER}`, fontSize: 11 }}
            >
              {data[field] || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FourColTable({
  rows,
  title,
  lineHeader,
}: {
  rows: string[][];
  title: string;
  lineHeader: string;
}) {
  if (rows.length === 0) return null;
  const headers = ['LINE #', 'SHOT TYPE', 'SUGGESTED VISUAL', lineHeader];
  return (
    <>
      <SectionHeader title={title} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse mb-1">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h}
                  className="py-1.5 px-2 text-white font-semibold text-left"
                  style={{
                    background: NAVY,
                    border: `1px solid ${BORDER}`,
                    fontSize: 10,
                    width: i === 0 ? 40 : i === 1 ? 100 : i === 2 ? '32%' : undefined,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {[row[0] || '', row[1] || '', row[2] || '', row[3] || ''].map((cell, ci) => (
                  <td
                    key={ci}
                    className="py-1.5 px-2 text-slate-800 align-top"
                    style={{
                      border: `1px solid ${BORDER}`,
                      fontSize: 11,
                      textAlign: ci === 0 ? 'center' : 'left',
                    }}
                  >
                    {cell || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TenColTable({
  rows,
  title,
}: {
  rows: string[][];
  title: string;
}) {
  if (rows.length === 0) return null;
  const headers = [
    'HOOK',
    'BUILDING BLOCK',
    'SHOT TYPE',
    'SHOT ANGLE',
    'TALENT NOTES',
    'SHOT NOTES',
    'SHOT VISUAL',
    'LINES',
    'EDITING NOTES',
    'CAPTION',
  ];
  return (
    <>
      <SectionHeader title={title} />
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse mb-1" style={{ minWidth: '100%', tableLayout: 'auto' }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="py-1.5 px-2 text-white font-semibold text-left whitespace-nowrap"
                  style={{ background: NAVY, border: `1px solid ${BORDER}`, fontSize: 10 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    className="py-1.5 px-2 text-slate-800 align-top"
                    style={{ border: `1px solid ${BORDER}`, fontSize: 11 }}
                  >
                    {row[ci] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Parsing helpers for AGC tables (10-col) ────────────────────────────

function parseTenColTable(markdown: string, sectionHeader: string): string[][] {
  const rows: string[][] = [];
  const lines = markdown.split('\n');
  const pattern = new RegExp(`^#{1,4}.*${sectionHeader}`, 'i');
  const headerIdx = lines.findIndex((l) => pattern.test(l.trim()));
  if (headerIdx < 0) return rows;
  let inTable = false;
  let firstDataRowSkipped = false;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith('#')) break;
    if (!l.startsWith('|')) {
      if (inTable) break;
      continue;
    }
    if (/^\|[\s\-:|]+\|$/.test(l)) { inTable = true; continue; }
    inTable = true;
    const cells = l.split('|').slice(1, -1).map((c) => c.replace(/\*\*/g, '').trim());
    if (cells.length === 0) continue;
    // Skip the header row of the table (first row with column names)
    if (!firstDataRowSkipped && /^(#|Hook|Building Block)$/i.test(cells[0])) {
      firstDataRowSkipped = true;
      continue;
    }
    firstDataRowSkipped = true;
    while (cells.length < 10) cells.push('');
    rows.push(cells.slice(0, 10));
  }
  return rows;
}

// ─── Parser for AGC bullet-list STRATEGY block ──────────────────────────

function parseBulletKv(markdown: string, sectionHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = markdown.split('\n');
  const pattern = new RegExp(`^#{1,4}.*${sectionHeader}`, 'i');
  const idx = lines.findIndex((l) => pattern.test(l.trim()));
  if (idx < 0) return result;
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith('#')) break;
    const m = l.match(/^[-*]\s*\*\*([^:*]+?):\*\*\s*(.+)$/);
    if (m) result[m[1].trim()] = m[2].replace(/\*\*/g, '').trim();
  }
  return result;
}

// ─── Ecom Brief Preview ─────────────────────────────────────────────────

function EcomBriefPreview({ scriptResult }: { scriptResult: string }) {
  const briefInfo = parseKvTable(scriptResult, 'BRIEF INFO');
  const strategy = parseKvTable(scriptResult, 'STRATEGY');
  const offer = parseKvTable(scriptResult, 'OFFER');
  const editing = parseKvTable(scriptResult, 'EDITING INSTRUCTIONS');
  const hooks = parseScriptTable(scriptResult, 'SCRIPT \\(HOOKS\\)');
  const body = parseScriptTable(scriptResult, 'SCRIPT \\(BODY\\)');

  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">Ecom Ad Template</div>
      <SectionHeader title="Brief Info" />
      <KvTable data={briefInfo} fields={['Brief ID', 'Date', 'Product', 'Collection', 'Collection Asset', 'Format']} />
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Concept', 'Angle', 'Awareness Level', 'Primary Emotion', 'Avatar', 'Landing Page']} />
      <SectionHeader title="Offer" />
      <KvTable data={offer} fields={['Promo', 'Promo Asset', 'Value Callout', 'Urgency Element']} />
      <SectionHeader title="Editing Instructions" />
      <KvTable data={editing} fields={['Pacing', 'Resolution', 'Caption & Graphics', 'Captions', 'Transitions', 'Music', 'Voiceover', 'Asset', 'Notes']} />
      <FourColTable rows={hooks} title="Script (Hooks)" lineHeader="HOOK LINE" />
      <FourColTable rows={body} title="Script (Body)" lineHeader="SCRIPT LINE" />
    </>
  );
}

// ─── AGC Brief Preview (CSV) ────────────────────────────────────────────

function AgcBriefPreview({ scriptResult }: { scriptResult: string }) {
  const strategy = parseBulletKv(scriptResult, 'STRATEGY SECTION');
  const hooks = parseTenColTable(scriptResult, 'HOOKS.*Hook Matrix');
  const body = parseTenColTable(scriptResult, 'BODY SECTION');

  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">AGC Production Brief</div>
      <SectionHeader title="Strategy" />
      <KvTable
        data={strategy}
        fields={['Concept', 'Angle', 'Avatar', 'Location', 'Product', 'Collection', 'Promotion', 'Offer', 'Pacing', 'Music', 'Assets', 'Additional Notes']}
      />
      <TenColTable rows={hooks} title="Hooks — 9-Hook Matrix" />
      <TenColTable rows={body} title="Body" />
    </>
  );
}

// ─── Dispatcher ─────────────────────────────────────────────────────────

export default function BriefPreview({ adType, scriptResult }: { adType: AdType; scriptResult: string }) {
  const templateId = getBriefTemplateId(adType);
  return templateId === 'agc'
    ? <AgcBriefPreview scriptResult={scriptResult} />
    : <EcomBriefPreview scriptResult={scriptResult} />;
}
