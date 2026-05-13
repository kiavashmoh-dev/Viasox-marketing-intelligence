/**
 * Per-template brief preview components.
 *
 * Each ad type has its own brief template (see briefTemplates.ts), so the
 * in-card preview must render the sections that template actually produces.
 * Previously TaskBriefCard hardcoded the Ecom layout for every brief, which
 * showed empty sections for AGC / Single-Talent / Filmed Podcast / etc.
 *
 * This module exposes BriefPreview as a dispatcher that picks the right
 * sub-component based on adType.
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

function ScriptTablePreview({
  rows,
  title,
  headers,
}: {
  rows: string[][];
  title: string;
  headers: string[];
}) {
  if (rows.length === 0) return null;
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
            {rows.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    className="py-1.5 px-2 text-slate-800 align-top"
                    style={{
                      border: `1px solid ${BORDER}`,
                      fontSize: 11,
                      textAlign: ci === 0 ? 'center' : 'left',
                    }}
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

/**
 * Parse a section that uses bullet-list key-value pairs:
 *   - **Concept:** [value]
 *   - **Angle:** [value]
 * The new production templates (AGC, Single-Talent, Filmed Podcast,
 * Packaging) use this format instead of the markdown table KV.
 */
function parseBulletKv(markdown: string, sectionHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = markdown.split('\n');
  const pattern = new RegExp(`^#{1,4}.*${sectionHeader}`, 'i');
  let idx = lines.findIndex((l) => pattern.test(l.trim()));
  if (idx < 0) return result;
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith('#')) break;
    const m = l.match(/^[-*]\s*\*\*([^:*]+?):\*\*\s*(.+)$/);
    if (m) result[m[1].trim()] = m[2].replace(/\*\*/g, '').trim();
  }
  return result;
}

/**
 * Parse a markdown table after a specific section header. Accepts loose
 * header matching to handle LLM rephrasing.
 */
function parseTableAfterHeader(markdown: string, sectionHeader: string, expectedColumns: number): string[][] {
  const rows: string[][] = [];
  const lines = markdown.split('\n');
  const pattern = new RegExp(`^#{1,4}.*${sectionHeader}`, 'i');
  const headerIdx = lines.findIndex((l) => pattern.test(l.trim()));
  if (headerIdx < 0) return rows;
  let inTable = false;
  let firstRowSkipped = false;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith('#')) break;
    if (!l.startsWith('|')) {
      if (inTable) break;
      continue;
    }
    // Separator row
    if (/^\|[\s\-:|]+\|$/.test(l)) { inTable = true; continue; }
    const cells = l.split('|').slice(1, -1).map((c) => c.replace(/\*\*/g, '').trim());
    if (cells.length === 0) continue;
    inTable = true;
    // Skip header row (first data-looking row when no separator was hit yet,
    // or when first cell matches a column-header word like `#`, `Hook`, etc.)
    if (!firstRowSkipped && /^(#|Hook|Line\s*#|Building Block|Speaker)$/i.test(cells[0])) {
      firstRowSkipped = true;
      continue;
    }
    firstRowSkipped = true;
    // Pad/trim to expected columns
    while (cells.length < expectedColumns) cells.push('');
    rows.push(cells.slice(0, expectedColumns));
  }
  return rows;
}

/**
 * Extract the blockquote lines from a section. Used for VO scripts (Full AI)
 * and dialogue (AI Podcast).
 */
function parseBlockquotes(markdown: string, sectionHeader: string): string[] {
  const lines = markdown.split('\n');
  const pattern = new RegExp(`^#{1,4}.*${sectionHeader}`, 'i');
  const headerIdx = lines.findIndex((l) => pattern.test(l.trim()));
  if (headerIdx < 0) return [];
  const out: string[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim().startsWith('#')) break;
    if (l.trim().startsWith('>')) {
      const cleaned = l.replace(/^\s*>\s?/, '').replace(/\*\*/g, '').trim();
      if (cleaned) out.push(cleaned);
    }
  }
  return out;
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
      <ScriptTablePreview rows={hooks} title="Script (Hooks)" headers={['LINE #', 'SHOT TYPE', 'SUGGESTED VISUAL', 'HOOK LINE']} />
      <ScriptTablePreview rows={body} title="Script (Body)" headers={['LINE #', 'SHOT TYPE', 'SUGGESTED VISUAL', 'SCRIPT LINE']} />
    </>
  );
}

// ─── Full AI Visual Brief Preview ───────────────────────────────────────

function FullAiBriefPreview({ scriptResult }: { scriptResult: string }) {
  const briefInfo = parseKvTable(scriptResult, 'BRIEF INFO');
  const strategy = parseKvTable(scriptResult, 'STRATEGY');
  const offer = parseKvTable(scriptResult, 'OFFER');
  const character = parseKvTable(scriptResult, 'CHARACTER PROFILE');
  const editing = parseKvTable(scriptResult, 'EDITING INSTRUCTIONS');
  const endCard = parseKvTable(scriptResult, 'END CARD');
  const vo = parseBlockquotes(scriptResult, 'VOICEOVER SCRIPT');
  const scenes = parseTableAfterHeader(scriptResult, 'SCENE TABLE', 4);

  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">Full AI Visual Brief</div>
      <SectionHeader title="Brief Info" />
      <KvTable data={briefInfo} fields={['Brief ID', 'Date', 'Product', 'Format']} />
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Concept', 'Angle', 'Awareness Level', 'Primary Emotion', 'Avatar', 'Landing Page']} />
      <SectionHeader title="Offer" />
      <KvTable data={offer} fields={['Promo', 'Value Callout', 'Urgency Element']} />
      <SectionHeader title="Character Profile (paste-ready)" />
      <KvTable data={character} fields={['Appearance', 'Wardrobe', 'Voice Tone (for VO)', 'Energy / Vibe']} />
      <SectionHeader title="Editing Instructions" />
      <KvTable data={editing} fields={['Pacing', 'Resolution', 'Music', 'Voiceover', 'Transitions', 'Notes']} />
      {vo.length > 0 && (
        <>
          <SectionHeader title="Voiceover Script" />
          <div className="space-y-1 mb-2">
            {vo.map((l, i) => (
              <blockquote key={i} className="text-xs text-slate-700 border-l-4 px-3 py-1 bg-slate-50" style={{ borderColor: NAVY }}>
                {l}
              </blockquote>
            ))}
          </div>
        </>
      )}
      <ScriptTablePreview rows={scenes} title="Scene Table" headers={['SCENE #', 'AI GENERATION PROMPT', 'VO LINE', 'DURATION']} />
      <SectionHeader title="End Card" />
      <KvTable data={endCard} fields={['Visual', 'Text on Screen']} />
    </>
  );
}

// ─── AI Podcast Brief Preview ───────────────────────────────────────────

function AiPodcastBriefPreview({ scriptResult }: { scriptResult: string }) {
  const briefInfo = parseKvTable(scriptResult, 'BRIEF INFO');
  const strategy = parseKvTable(scriptResult, 'STRATEGY');
  const offer = parseKvTable(scriptResult, 'OFFER');
  const hostA = parseKvTable(scriptResult, 'AVATAR PROFILE.*HOST A');
  const hostB = parseKvTable(scriptResult, 'AVATAR PROFILE.*HOST B');
  const setDesc = parseKvTable(scriptResult, 'SET DESCRIPTION');
  const editing = parseKvTable(scriptResult, 'EDITING INSTRUCTIONS');
  const dialogue = parseBlockquotes(scriptResult, 'DIALOGUE SCRIPT');

  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">AI Podcast Brief</div>
      <SectionHeader title="Brief Info" />
      <KvTable data={briefInfo} fields={['Brief ID', 'Date', 'Product', 'Format']} />
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Concept', 'Angle', 'Awareness Level', 'Primary Emotion', 'Avatar', 'Landing Page']} />
      <SectionHeader title="Offer" />
      <KvTable data={offer} fields={['Promo', 'Value Callout', 'Urgency Element']} />
      <SectionHeader title="Avatar Profile — Host A" />
      <KvTable data={hostA} fields={['Appearance', 'Wardrobe', 'Voice', 'Personality / Role']} />
      <SectionHeader title="Avatar Profile — Host B" />
      <KvTable data={hostB} fields={['Appearance', 'Wardrobe', 'Voice', 'Personality / Role']} />
      <SectionHeader title="Set Description" />
      <KvTable data={setDesc} fields={['Environment', 'Lighting', 'Camera Framing']} />
      <SectionHeader title="Editing Instructions" />
      <KvTable data={editing} fields={['Pacing', 'Resolution', 'Music', 'Captions', 'Transitions', 'Notes']} />
      {dialogue.length > 0 && (
        <>
          <SectionHeader title="Dialogue Script" />
          <div className="space-y-1 mb-2">
            {dialogue.map((l, i) => {
              const isMarker = /^\[PRODUCT DISCOVERY MOMENT\]/i.test(l);
              const isSpeaker = /^HOST [AB]:/.test(l);
              const display = isMarker ? l : isSpeaker ? l.replace(/^(HOST [AB]:)/, (m) => `__BOLD__${m}__/BOLD__`) : l;
              const parts = display.split(/__BOLD__|__\/BOLD__/);
              return (
                <blockquote
                  key={i}
                  className="text-xs text-slate-700 border-l-4 px-3 py-1 bg-slate-50"
                  style={{ borderColor: isMarker ? '#dc2626' : NAVY, color: isMarker ? '#dc2626' : undefined, fontWeight: isMarker ? 600 : undefined }}
                >
                  {parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : <span key={j}>{p}</span>))}
                </blockquote>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ─── AGC Brief Preview (CSV) ────────────────────────────────────────────

function AgcBriefPreview({ scriptResult }: { scriptResult: string }) {
  const strategy = parseBulletKv(scriptResult, 'STRATEGY SECTION');
  const production = parseBulletKv(scriptResult, 'PRODUCTION NOTES');
  const hooks = parseTableAfterHeader(scriptResult, 'HOOKS.*6-Hook Matrix', 8);
  const body = parseTableAfterHeader(scriptResult, 'BODY SECTION', 8);
  const extraBroll = parseTableAfterHeader(scriptResult, 'EXTRA B-ROLL', 4);

  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">AGC Production Brief</div>
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Concept', 'Angle', 'Avatar', 'Location', 'Product', 'Collection', 'Promotion', 'Offer', 'Pacing', 'Music']} />
      <SectionHeader title="Production Notes" />
      <KvTable data={production} fields={['Wardrobe', 'Lighting', 'Props', 'Additional Notes']} />
      <ScriptTablePreview rows={hooks} title="Hooks — 6-Hook Matrix" headers={['HOOK', 'BUILDING BLOCK', 'SHOT TYPE', 'TALENT', 'VISUAL', 'LINES', 'EDITING', 'CAPTION']} />
      <ScriptTablePreview rows={body} title="Body" headers={['#', 'BUILDING BLOCK', 'SHOT TYPE', 'TALENT', 'VISUAL', 'LINES', 'EDITING', 'CAPTION']} />
      <ScriptTablePreview rows={extraBroll} title="Extra B-Roll" headers={['#', 'SHOT TYPE', 'VISUAL', 'EDITING NOTES']} />
    </>
  );
}

// ─── Single-Talent Brief Preview (CSV) ──────────────────────────────────

function SingleTalentBriefPreview({ scriptResult }: { scriptResult: string }) {
  const strategy = parseBulletKv(scriptResult, 'STRATEGY SECTION');
  const talent = parseBulletKv(scriptResult, 'TALENT PROFILE');
  const setting = parseBulletKv(scriptResult, 'SETTING.*PRODUCTION NOTES');
  const hooks = parseTableAfterHeader(scriptResult, 'HOOKS.*3 Variations', 5);
  const body = parseTableAfterHeader(scriptResult, 'BODY SECTION', 6);

  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">Single-Talent Production Brief</div>
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Concept', 'Angle', 'Talent Type', 'Tonal Direction', 'Product', 'Offer', 'Pacing', 'Music']} />
      <SectionHeader title="Talent Profile" />
      <KvTable data={talent} fields={['Talent', 'Wardrobe', 'Demeanor']} />
      <SectionHeader title="Setting & Production Notes" />
      <KvTable data={setting} fields={['Setting', 'Polish Target', 'Camera', 'Notes']} />
      <ScriptTablePreview rows={hooks} title="Hooks — 3 Variations" headers={['#', 'BUILDING BLOCK', 'VISUAL', 'LINE', 'CAPTION']} />
      <ScriptTablePreview rows={body} title="Body" headers={['#', 'BUILDING BLOCK', 'VISUAL', 'LINE', 'CAPTION', 'EDITING']} />
    </>
  );
}

// ─── Filmed Podcast Brief Preview (CSV) ─────────────────────────────────

function FilmedPodcastBriefPreview({ scriptResult }: { scriptResult: string }) {
  const strategy = parseBulletKv(scriptResult, 'STRATEGY SECTION');
  const hostA = parseBulletKv(scriptResult, 'HOST A PROFILE');
  const hostB = parseBulletKv(scriptResult, 'HOST B PROFILE');
  const production = parseBulletKv(scriptResult, 'PRODUCTION NOTES');
  const dialogue = parseTableAfterHeader(scriptResult, 'DIALOGUE SCRIPT', 7);

  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">Filmed Podcast Production Brief</div>
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Concept', 'Angle', 'Product', 'Offer', 'Pacing', 'Music', 'The Moment']} />
      <SectionHeader title="Host A Profile" />
      <KvTable data={hostA} fields={['Talent', 'Role in conversation', 'Wardrobe']} />
      <SectionHeader title="Host B Profile" />
      <KvTable data={hostB} fields={['Talent', 'Role in conversation', 'Wardrobe']} />
      <SectionHeader title="Production Notes" />
      <KvTable data={production} fields={['Set', 'Lighting', 'Cameras', 'Audio', 'Notes']} />
      <ScriptTablePreview rows={dialogue} title="Dialogue Script" headers={['#', 'BUILDING BLOCK', 'SPEAKER', 'LINE', 'VISUAL CUE', 'CAPTION', 'EDITING']} />
    </>
  );
}

// ─── Packaging / Employee Brief Preview (CSV) ───────────────────────────

function PackagingBriefPreview({ scriptResult }: { scriptResult: string }) {
  const strategy = parseBulletKv(scriptResult, 'STRATEGY SECTION');
  const talent = parseBulletKv(scriptResult, 'TALENT PROFILE');
  const setting = parseBulletKv(scriptResult, 'SETTING.*ZONES');
  const production = parseBulletKv(scriptResult, 'PRODUCTION NOTES');
  const body = parseTableAfterHeader(scriptResult, 'BODY SECTION', 7);

  return (
    <>
      <div className="text-center text-sm font-bold text-slate-800 mb-3">Packaging / Employee Production Brief</div>
      <SectionHeader title="Strategy" />
      <KvTable data={strategy} fields={['Concept', 'Angle', 'Product', 'Offer', 'Pacing', 'Music']} />
      <SectionHeader title="Talent Profile (actors playing employees)" />
      <KvTable data={talent} fields={['Number of talent', 'Casting', 'Wardrobe']} />
      <SectionHeader title="Setting & Zones" />
      <KvTable data={setting} fields={['Primary Zone', 'Secondary Zone', 'Tertiary Zone', 'Aesthetic Target']} />
      <SectionHeader title="Production Notes" />
      <KvTable data={production} fields={['Lighting', 'Cameras', 'Sound', 'Notes']} />
      <ScriptTablePreview rows={body} title="Body" headers={['#', 'BUILDING BLOCK', 'ZONE', 'ACTION', 'LINE', 'CAPTION', 'EDITING']} />
    </>
  );
}

// ─── Dispatcher ─────────────────────────────────────────────────────────

export default function BriefPreview({ adType, scriptResult }: { adType: AdType; scriptResult: string }) {
  const templateId = getBriefTemplateId(adType);
  switch (templateId) {
    case 'ecom': return <EcomBriefPreview scriptResult={scriptResult} />;
    case 'fullai': return <FullAiBriefPreview scriptResult={scriptResult} />;
    case 'aipodcast': return <AiPodcastBriefPreview scriptResult={scriptResult} />;
    case 'agc': return <AgcBriefPreview scriptResult={scriptResult} />;
    case 'singletalent': return <SingleTalentBriefPreview scriptResult={scriptResult} />;
    case 'filmedpodcast': return <FilmedPodcastBriefPreview scriptResult={scriptResult} />;
    case 'packaging': return <PackagingBriefPreview scriptResult={scriptResult} />;
    default: return <EcomBriefPreview scriptResult={scriptResult} />;
  }
}
