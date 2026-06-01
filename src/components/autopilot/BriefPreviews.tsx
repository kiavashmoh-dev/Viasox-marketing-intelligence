/**
 * Brief preview components — one per delivery template. Picks the right
 * preview based on the brief's ad type, exactly mirroring the download
 * router so the in-app preview ALWAYS matches what gets downloaded.
 *
 *   - EcomBriefPreview   — Ecom Style · AI Podcast · Static
 *   - AgcBriefPreview    — AGC · Founder · Spokesperson · Fake Podcast · Packaging
 *   - UgcBriefPreview    — UGC (3-col body, no LINE # column)
 *   - FullAiBriefPreview — Full AI (3-col body, # / Visual / Voiceover)
 *
 * Every preview uses the same defensive `normalizeBodyRow` helper that the
 * downloaders use, so LLM column-shape drift is caught and corrected in
 * BOTH the preview AND the downloaded file. The preview never disagrees
 * with the downloaded artifact.
 */

import type { AdType } from '../../engine/types';
import { parseKvTable, parseScriptTable, normalizeBodyRow, type NormalizedScriptRow } from '../../utils/downloadUtils';
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
  // Defensive: every row goes through the shared normalizer so LLM
  // column-shape drift (UGC-shaped data inside an Ecom-typed brief etc.)
  // gets re-aligned identically to how the download exporter handles it.
  // Leaked-header rows are dropped. The preview ALWAYS matches the
  // downloaded artifact.
  const normalized: NormalizedScriptRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = normalizeBodyRow(rows[i], i, 'ecom4');
    if (r) normalized.push(r);
  }
  if (normalized.length === 0) return null;
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
            {normalized.map((row, ri) => (
              <tr key={ri}>
                {[row.num, row.shotType, row.visual, row.line].map((cell, ci) => (
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

// ─── UGC Brief Preview (Doc — 3-col body: Shot Visuals | Shot Type | Lines) ─

/** Renders the body / hooks tables using the UGC 3-column schema. Skips
 *  leaked-header rows and re-aligns any drifted shape exactly the same
 *  way the downloadUgcBriefDoc exporter does. */
function ThreeColUgcTable({
  rows,
  title,
  lineHeader,
}: {
  rows: string[][];
  title: string;
  lineHeader: string;
}) {
  const normalized: NormalizedScriptRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = normalizeBodyRow(rows[i], i, 'ugc3');
    if (r) normalized.push(r);
  }
  if (normalized.length === 0) return null;
  const headers = ['SHOT VISUALS', 'SHOT TYPE', lineHeader];
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
                    width: i === 1 ? 110 : undefined,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalized.map((row, ri) => (
              <tr key={ri}>
                {[row.visual, row.shotType, row.line].map((cell, ci) => (
                  <td
                    key={ci}
                    className="py-1.5 px-2 text-slate-800 align-top"
                    style={{
                      border: `1px solid ${BORDER}`,
                      fontSize: 11,
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

function UgcBriefPreview({ scriptResult }: { scriptResult: string }) {
  const briefInfo = parseKvTable(scriptResult, 'BRIEF INFO');
  const strategy = parseKvTable(scriptResult, 'STRATEGY');
  const hooks = parseScriptTable(scriptResult, 'SCRIPT \\(HOOKS\\)');
  const body = parseScriptTable(scriptResult, 'SCRIPT \\(BODY\\)');
  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">UGC Creator Brief</div>
      <SectionHeader title="Brief Info" />
      <KvTable data={briefInfo} fields={['Brief ID', 'Date', 'Product', 'Angle', 'Persona', 'Length', 'Talent', 'Location']} />
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Awareness Level', 'Primary Emotion', 'Avatar']} />
      <ThreeColUgcTable rows={hooks} title="Script (Hooks) — 5 Variations" lineHeader="HOOK LINE" />
      <ThreeColUgcTable rows={body} title="Script (Body)" lineHeader="LINES" />
    </>
  );
}

// ─── Full AI Brief Preview (Doc — 3-col body: # | Suggested Visual | Voiceover) ─

/** Renders the body / hooks tables for Full AI briefs — # column on the
 *  left, then Suggested Visual + Voiceover. No Shot Type column (this
 *  matches the downloadFullAiBriefDoc exporter shape exactly). */
function ThreeColFullAiTable({
  rows,
  title,
  lineHeader,
}: {
  rows: string[][];
  title: string;
  lineHeader: string;
}) {
  // For Full AI tables, the LLM may emit 3 cells (# | Visual | Voiceover)
  // or drift into a 4-col Ecom shape. Use the same normalizer; map its
  // four-slot output to our three columns (drop the synthesized shotType
  // since Full AI doesn't have one).
  const normalized: NormalizedScriptRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = normalizeBodyRow(rows[i], i, 'ecom4');
    if (r) normalized.push(r);
  }
  if (normalized.length === 0) return null;
  const headers = ['#', 'SUGGESTED VISUAL', lineHeader];
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
                    width: i === 0 ? 40 : undefined,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalized.map((row, ri) => {
              // For Full AI, the "line" slot is the Voiceover. If the body
              // came in as a 3-col Visual | ShotType | Line shape, the
              // normalizer puts ShotType in the shotType slot — but Full AI
              // doesn't have one. Merge any non-empty shotType inline into
              // the visual so no content is lost.
              const visual = row.shotType && row.shotType !== row.visual
                ? `${row.visual}${row.visual ? ' · ' : ''}${row.shotType}`
                : row.visual;
              return (
                <tr key={ri}>
                  {[row.num, visual, row.line].map((cell, ci) => (
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
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FullAiBriefPreview({ scriptResult }: { scriptResult: string }) {
  const briefInfo = parseKvTable(scriptResult, 'BRIEF INFO');
  const strategy = parseKvTable(scriptResult, 'STRATEGY');
  const editing = parseKvTable(scriptResult, 'EDITING INSTRUCTIONS');
  const hooks = parseScriptTable(scriptResult, 'SCRIPT \\(HOOKS\\)');
  const body = parseScriptTable(scriptResult, 'SCRIPT \\(BODY\\)');
  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">Full AI Brief</div>
      <SectionHeader title="Brief Info" />
      <KvTable data={briefInfo} fields={['Brief ID', 'Date', 'Product', 'Collection', 'Collection Asset', 'Format']} />
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Awareness Level', 'Primary Emotion', 'Avatar', 'Landing Page']} />
      <SectionHeader title="Editing Instructions" />
      <KvTable data={editing} fields={['Pacing', 'Resolution', 'Caption & Graphics', 'Transitions', 'Music', 'Voiceover', 'Asset', 'Notes']} />
      <ThreeColFullAiTable rows={hooks} title="Script (Hooks) — 3 Variations" lineHeader="VOICEOVER" />
      <ThreeColFullAiTable rows={body} title="Script (Body)" lineHeader="VOICEOVER" />
    </>
  );
}

// ─── Dispatcher ─────────────────────────────────────────────────────────
//
// Mirrors src/utils/downloadUtils.ts exactly — picks the preview by
// template id so the on-page preview is GUARANTEED to match the
// downloaded file's shape. If the download exporter changes, this
// switch must change too.

export default function BriefPreview({ adType, scriptResult }: { adType: AdType; scriptResult: string }) {
  const templateId = getBriefTemplateId(adType);
  if (templateId === 'agc') return <AgcBriefPreview scriptResult={scriptResult} />;
  if (templateId === 'ugc') return <UgcBriefPreview scriptResult={scriptResult} />;
  if (templateId === 'fullai') return <FullAiBriefPreview scriptResult={scriptResult} />;
  return <EcomBriefPreview scriptResult={scriptResult} />;
}
