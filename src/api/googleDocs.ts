/**
 * Google Docs renderer for the three-tab UGC creator document.
 *
 * Takes the renderer-agnostic `UgcDocument` (../factory2/ugcDocModel.ts —
 * the style spec lives in its header) and creates ONE Google Doc with three
 * real tabs (Creator Brief · Script · Strategy) through the Docs API v1,
 * using plain `fetch` and a GIS access token (googleAuth.ts). Field names
 * were verified against the Docs API reference on 2026-09-08.
 *
 * ROUND TRIPS (5, whatever the brief size):
 *   1. documents.create { title }                       → documentId, first tabId
 *   2. batchUpdate: rename tab 1, addDocumentTab ×2      → tabIds from the replies
 *   3. batchUpdate: SKELETON of all three tabs            (buildTabSkeletonRequests)
 *   4. documents.get?includeTabsContent=true              → real indexes of every cell
 *   5. batchUpdate: FILL of all three tabs                (buildTabFillRequests)
 *
 * INDEX STRATEGY — no fragile arithmetic:
 *   SKELETON (per tab). One `insertText` at index 1 carries every paragraph of
 *   the tab in order, joined by "\n" (the tab's pre-existing final newline
 *   terminates the last one). Paragraph ranges are therefore known locally and
 *   styling requests (named style + explicit overrides + bullets) use them.
 *   Table blocks contribute NO text: each table is inserted with `insertTable`
 *   at the newline of the paragraph that precedes it in the model. Google
 *   inserts a newline before a table, so the preceding paragraph keeps its own
 *   text, the table lands right after it, and the paragraph's ORIGINAL newline
 *   becomes the (unavoidable, Google-mandated) empty paragraph after the table.
 *   Tables are inserted from LAST to FIRST so the earlier, locally computed
 *   indexes stay valid. Table-level styling (column widths, borders, header /
 *   label shading, the Strategy SECTION merges, min row height) goes in the
 *   same batch right after each table's insert, addressed by the table start
 *   index = insertion index + 1 (the documented rule) — merges happen here so
 *   that the structure read back in step 4 is the merged one.
 *   FILL (per tab). From the fetched body, every cell's first-paragraph start
 *   index is read from the server. Cells are written from the LAST cell of the
 *   LAST table backward to the first, each as: [clear stray content],
 *   insertText at that index, updateTextStyle + updateParagraphStyle over
 *   [start, start+len). Because the batch only ever touches indexes BEFORE
 *   the ones already used, every index executes exactly as read. The empty
 *   paragraph after each table is restyled to body text in the same batch.
 *   RULE kept everywhere: no range ever includes a segment's final newline
 *   (Google rejects it); text styles are never applied to newline-only ranges.
 *
 * Merged cells: the covered cells stay in the fetched structure with an empty
 * paragraph (only the head cell is written). If a future API version omits
 * them, the fill maps columns from the right so the other columns still land.
 */

import type { UgcDocTab, UgcDocument, UgcDocBlock } from '../factory2/ugcDocModel';
import { clearGoogleAccessToken } from './googleAuth';

const DOCS_API = 'https://docs.googleapis.com/v1/documents';
/** Requests per batchUpdate call (Google has no hard cap; keeps payloads modest). */
const BATCH_CHUNK = 300;

// ─── Minimal API shapes ─────────────────────────────────────────────────────

/** One Docs API `Request` (the union is huge; builders return plain objects). */
export type DocsRequest = Record<string, unknown>;

interface Dimension {
  magnitude: number;
  unit: 'PT';
}
interface OptionalColor {
  color: { rgbColor: { red: number; green: number; blue: number } };
}

export interface FetchedParagraphElement {
  startIndex?: number;
  endIndex?: number;
  textRun?: { content?: string };
}
export interface FetchedElement {
  startIndex?: number;
  endIndex?: number;
  paragraph?: { elements?: FetchedParagraphElement[] };
  table?: { rows?: number; columns?: number; tableRows?: FetchedTableRow[] };
  sectionBreak?: unknown;
}
export interface FetchedTableRow {
  startIndex?: number;
  endIndex?: number;
  tableCells?: FetchedTableCell[];
}
export interface FetchedTableCell {
  startIndex?: number;
  endIndex?: number;
  content?: FetchedElement[];
}
export interface FetchedTabBody {
  content?: FetchedElement[];
}
interface FetchedTab {
  tabProperties?: { tabId?: string; title?: string; index?: number };
  childTabs?: FetchedTab[];
  documentTab?: { body?: FetchedTabBody };
}
interface FetchedDocument {
  documentId?: string;
  title?: string;
  tabs?: FetchedTab[];
}
interface BatchUpdateResponse {
  replies?: Array<{ addDocumentTab?: { tabProperties?: { tabId?: string } } }>;
}

// ─── Style constants (ugcDocModel.ts header) ────────────────────────────────

const FONT_FAMILY = 'Arial';
const pt = (magnitude: number): Dimension => ({ magnitude, unit: 'PT' });
const hex = (h: string): OptionalColor => {
  const n = parseInt(h.replace('#', ''), 16);
  return { color: { rgbColor: { red: ((n >> 16) & 255) / 255, green: ((n >> 8) & 255) / 255, blue: (n & 255) / 255 } } };
};
const COLOR = {
  black: hex('#000000'),
  white: hex('#ffffff'),
  navy: hex('#203f66'),
  labelBg: hex('#edf2fa'),
  readBg: hex('#f8f9fb'),
};
const PAGE = { width: 595.28, height: 841.89, top: 85.05, bottom: 85.05, left: 56.7, right: 56.7 };
const CELL_BORDER = { color: COLOR.black, width: pt(1), dashStyle: 'SOLID' };

interface TextSpec {
  size: number;
  bold?: boolean;
  color?: OptionalColor;
  background?: OptionalColor;
}
interface ParaSpec {
  named?: 'TITLE' | 'HEADING_1' | 'NORMAL_TEXT';
  lineSpacing: number;
  above: number;
  below: number;
  indentEnd?: number;
}

type Role = 'title' | 'heading' | 'paragraph' | 'readThroughLabel' | 'readThrough' | 'bullet';

const ROLE_STYLE: Record<Role, { para: ParaSpec; text: TextSpec }> = {
  title: { para: { named: 'TITLE', lineSpacing: 115, above: 0, below: 0 }, text: { size: 26 } },
  heading: { para: { named: 'HEADING_1', lineSpacing: 115, above: 8, below: 8 }, text: { size: 16, bold: true, color: COLOR.navy } },
  paragraph: { para: { named: 'NORMAL_TEXT', lineSpacing: 115, above: 0, below: 0 }, text: { size: 11 } },
  readThroughLabel: { para: { named: 'NORMAL_TEXT', lineSpacing: 100, above: 16.5, below: 7.5 }, text: { size: 12, bold: true } },
  readThrough: { para: { named: 'NORMAL_TEXT', lineSpacing: 150, above: 7.5, below: 19.5, indentEnd: 10.5 }, text: { size: 10, background: COLOR.readBg } },
  bullet: { para: { named: 'NORMAL_TEXT', lineSpacing: 115, above: 0, below: 0 }, text: { size: 9 } },
};
/** Inside every table cell: single spacing, no paragraph spacing. */
const CELL_PARA: ParaSpec = { lineSpacing: 100, above: 0, below: 0 };

// ─── Request helpers ────────────────────────────────────────────────────────

const range = (startIndex: number, endIndex: number, tabId: string) => ({ startIndex, endIndex, tabId });

function textStyleRequest(start: number, end: number, tabId: string, spec: TextSpec): DocsRequest {
  const textStyle: Record<string, unknown> = {
    weightedFontFamily: { fontFamily: FONT_FAMILY, weight: 400 },
    fontSize: pt(spec.size),
    bold: Boolean(spec.bold),
    foregroundColor: spec.color ?? COLOR.black,
  };
  const fields = ['weightedFontFamily', 'fontSize', 'bold', 'foregroundColor'];
  if (spec.background) {
    textStyle.backgroundColor = spec.background;
    fields.push('backgroundColor');
  }
  return { updateTextStyle: { range: range(start, end, tabId), textStyle, fields: fields.join(',') } };
}

/** Named style first (its own request), then the explicit overrides. */
function paragraphStyleRequests(start: number, end: number, tabId: string, spec: ParaSpec): DocsRequest[] {
  const out: DocsRequest[] = [];
  if (spec.named) {
    out.push({ updateParagraphStyle: { range: range(start, end, tabId), paragraphStyle: { namedStyleType: spec.named }, fields: 'namedStyleType' } });
  }
  const paragraphStyle: Record<string, unknown> = { lineSpacing: spec.lineSpacing, spaceAbove: pt(spec.above), spaceBelow: pt(spec.below) };
  const fields = ['lineSpacing', 'spaceAbove', 'spaceBelow'];
  if (spec.indentEnd !== undefined) {
    paragraphStyle.indentEnd = pt(spec.indentEnd);
    fields.push('indentEnd');
  }
  out.push({ updateParagraphStyle: { range: range(start, end, tabId), paragraphStyle, fields: fields.join(',') } });
  return out;
}

function pageSetupRequest(tabId: string): DocsRequest {
  return {
    updateDocumentStyle: {
      documentStyle: {
        pageSize: { width: pt(PAGE.width), height: pt(PAGE.height) },
        marginTop: pt(PAGE.top),
        marginBottom: pt(PAGE.bottom),
        marginLeft: pt(PAGE.left),
        marginRight: pt(PAGE.right),
      },
      fields: 'pageSize,marginTop,marginBottom,marginLeft,marginRight',
      tabId,
    },
  };
}

// ─── Table specs (model block → grid of cells + decorations) ───────────────

type TableBlock = Extract<UgcDocBlock, { kind: 'kvTable' | 'scriptTable' | 'strategyTable' }>;

interface CellSpec {
  text: string;
  style: TextSpec;
}
export interface TableSpec {
  kind: TableBlock['kind'];
  rows: number;
  cols: number;
  /** Fixed width per column, PT. */
  widths: number[];
  headerRow: boolean;
  labelColumn: boolean;
  /** SECTION column merges: header-inclusive row index + span. */
  merges: Array<{ rowIndex: number; rowSpan: number }>;
  minRowHeight?: number;
  /** cells[row][col]; null = covered by a merge (never written). */
  cells: Array<Array<CellSpec | null>>;
}

const clean = (s: string): string => s.replace(/\r/g, '');

function tableSpec(block: TableBlock): TableSpec {
  const header = (texts: readonly string[], size: number): Array<CellSpec | null> =>
    texts.map((text) => ({ text: clean(text), style: { size, bold: true, color: COLOR.white } }));
  switch (block.kind) {
    case 'kvTable':
      return {
        kind: block.kind,
        rows: block.rows.length,
        cols: 2,
        widths: [241, 241],
        headerRow: false,
        labelColumn: true,
        merges: [],
        cells: block.rows.map((r) => [
          { text: clean(r.label), style: { size: 9, bold: true } },
          { text: clean(r.value.join('\n')), style: { size: 9 } },
        ]),
      };
    case 'scriptTable':
      return {
        kind: block.kind,
        rows: 1 + block.rows.length,
        cols: 4,
        widths: [120.5, 120.5, 120.5, 120.5],
        headerRow: true,
        labelColumn: false,
        merges: [],
        cells: [
          header(block.header, 8),
          ...block.rows.map((r) => [
            { text: clean(r.label), style: { size: 8, bold: true } },
            { text: clean(r.shot), style: { size: 8, bold: true } },
            { text: clean(r.line), style: { size: 8 } },
            { text: clean(r.overlay), style: { size: 8 } },
          ]),
        ],
      };
    case 'strategyTable': {
      const cells: Array<Array<CellSpec | null>> = [header(block.header, 9)];
      const merges: TableSpec['merges'] = [];
      for (const g of block.groups) {
        const start = cells.length;
        if (g.fields.length >= 2) merges.push({ rowIndex: start, rowSpan: g.fields.length });
        g.fields.forEach((f, i) => {
          cells.push([
            i === 0 || g.fields.length < 2 ? { text: clean(g.section), style: { size: 9, bold: true } } : null,
            { text: clean(f.field), style: { size: 9, bold: true } },
            { text: clean(f.direction), style: { size: 9 } },
          ]);
        });
      }
      return { kind: block.kind, rows: cells.length, cols: 3, widths: [160.67, 160.67, 160.67], headerRow: true, labelColumn: false, merges, minRowHeight: 19, cells };
    }
  }
}

// ─── Tab layout (pure) ──────────────────────────────────────────────────────

export interface LayoutParagraph {
  role: Role;
  text: string;
  /** Index of the first character. */
  start: number;
  /** Exclusive; includes the paragraph's newline. */
  end: number;
}
export interface LayoutTable {
  /** Where `insertTable` goes: the newline of the preceding paragraph. */
  insertAt: number;
  spec: TableSpec;
}
export interface TabLayout {
  /** The single insertText payload (no trailing newline). */
  text: string;
  /** The body end index after the insert (exclusive). */
  end: number;
  paragraphs: LayoutParagraph[];
  tables: LayoutTable[];
}

/** Every paragraph of the tab with its post-insert range, and every table
 *  with its insertion point. Embedded newlines split into paragraphs of the
 *  same role; leading tabs are stripped (createParagraphBullets would
 *  otherwise remove them and shift every later index). */
export function layoutTab(tab: UgcDocTab): TabLayout {
  const paragraphs: LayoutParagraph[] = [];
  const pending: Array<{ afterParagraph: number; spec: TableSpec }> = [];
  const push = (role: Role, raw: string) => {
    for (const line of clean(raw).split('\n')) paragraphs.push({ role, text: line.replace(/^\t+/, ''), start: 0, end: 0 });
  };
  for (const block of tab.blocks) {
    switch (block.kind) {
      case 'title':
      case 'heading':
      case 'paragraph':
      case 'readThroughLabel':
      case 'readThrough':
        push(block.kind, block.text);
        break;
      case 'bullets':
        for (const item of block.items) push('bullet', item);
        break;
      case 'kvTable':
      case 'scriptTable':
      case 'strategyTable':
        pending.push({ afterParagraph: paragraphs.length - 1, spec: tableSpec(block) });
        break;
    }
  }
  let cursor = 1;
  for (const p of paragraphs) {
    p.start = cursor;
    cursor += p.text.length + 1;
    p.end = cursor;
  }
  const text = paragraphs.map((p) => p.text).join('\n');
  const tables = pending.map(({ afterParagraph, spec }) => ({
    insertAt: afterParagraph >= 0 ? paragraphs[afterParagraph].end - 1 : 1,
    spec,
  }));
  return { text, end: paragraphs.length ? cursor : 2, paragraphs, tables };
}

// ─── Skeleton batch ─────────────────────────────────────────────────────────

/** Adjacent paragraphs of one role → one styling range. */
function coalesce(paragraphs: LayoutParagraph[]): Array<{ role: Role; start: number; end: number; hasText: boolean }> {
  const runs: Array<{ role: Role; start: number; end: number; hasText: boolean }> = [];
  for (const p of paragraphs) {
    const last = runs[runs.length - 1];
    if (last && last.role === p.role) {
      last.end = p.end;
      last.hasText = last.hasText || p.text.length > 0;
    } else runs.push({ role: p.role, start: p.start, end: p.end, hasText: p.text.length > 0 });
  }
  return runs;
}

function tableRequests(t: LayoutTable, tabId: string): DocsRequest[] {
  const { spec } = t;
  const tableStartLocation = { index: t.insertAt + 1, tabId };
  const cellRange = (rowIndex: number, columnIndex: number, rowSpan: number, columnSpan: number) => ({
    tableCellLocation: { tableStartLocation, rowIndex, columnIndex },
    rowSpan,
    columnSpan,
  });
  const out: DocsRequest[] = [{ insertTable: { rows: spec.rows, columns: spec.cols, location: { index: t.insertAt, tabId } } }];
  // Column widths (one request per distinct width).
  const byWidth = new Map<number, number[]>();
  spec.widths.forEach((w, i) => byWidth.set(w, [...(byWidth.get(w) ?? []), i]));
  for (const [width, columnIndices] of byWidth) {
    out.push({
      updateTableColumnProperties: { tableStartLocation, columnIndices, tableColumnProperties: { widthType: 'FIXED_WIDTH', width: pt(width) }, fields: 'widthType,width' },
    });
  }
  // 1pt black borders on every cell (padding stays at Google's 5pt default).
  out.push({
    updateTableCellStyle: {
      tableStartLocation,
      tableCellStyle: { borderTop: CELL_BORDER, borderBottom: CELL_BORDER, borderLeft: CELL_BORDER, borderRight: CELL_BORDER },
      fields: 'borderTop,borderBottom,borderLeft,borderRight',
    },
  });
  if (spec.headerRow) {
    out.push({ updateTableCellStyle: { tableRange: cellRange(0, 0, 1, spec.cols), tableCellStyle: { backgroundColor: COLOR.navy }, fields: 'backgroundColor' } });
  }
  if (spec.labelColumn) {
    out.push({ updateTableCellStyle: { tableRange: cellRange(0, 0, spec.rows, 1), tableCellStyle: { backgroundColor: COLOR.labelBg }, fields: 'backgroundColor' } });
  }
  for (const m of spec.merges) out.push({ mergeTableCells: { tableRange: cellRange(m.rowIndex, 0, m.rowSpan, 1) } });
  if (spec.minRowHeight !== undefined && spec.rows > 1) {
    out.push({
      updateTableRowStyle: {
        tableStartLocation,
        rowIndices: Array.from({ length: spec.rows - 1 }, (_, i) => i + 1),
        tableRowStyle: { minRowHeight: pt(spec.minRowHeight) },
        fields: 'minRowHeight',
      },
    });
  }
  return out;
}

/** Page setup, the tab's whole text, paragraph/text styles, bullets, then the
 *  tables (last → first) with their table-level styling. Pure. */
export function buildTabSkeletonRequests(tab: UgcDocTab, tabId: string): DocsRequest[] {
  const layout = layoutTab(tab);
  // Google rejects any range that includes a segment's final newline
  // ("Index N must be less than the end index of the referenced segment"),
  // so every range is clamped to it. Paragraph styles apply to every
  // paragraph OVERLAPPING the range, so the clamp loses nothing — except a
  // tab-final EMPTY paragraph, which cannot be addressed and stays default.
  const limit = layout.end - 1;
  const out: DocsRequest[] = [pageSetupRequest(tabId)];
  if (layout.text.length) out.push({ insertText: { text: layout.text, location: { index: 1, tabId } } });
  const runs = coalesce(layout.paragraphs).map((run) => ({ ...run, end: Math.min(run.end, limit) })).filter((run) => run.end > run.start);
  for (const run of runs) {
    const style = ROLE_STYLE[run.role];
    out.push(...paragraphStyleRequests(run.start, run.end, tabId, style.para));
    // Never style a newline-only range.
    if (run.hasText) out.push(textStyleRequest(run.start, run.end, tabId, style.text));
  }
  for (const run of runs) {
    if (run.role === 'bullet') out.push({ createParagraphBullets: { range: range(run.start, run.end, tabId), bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE' } });
  }
  for (let i = layout.tables.length - 1; i >= 0; i--) out.push(...tableRequests(layout.tables[i], tabId));
  return out;
}

// ─── Fill batch ─────────────────────────────────────────────────────────────

/** Cell text from the LAST cell of the LAST table backward, each index read
 *  from `body` (a `documents.get?includeTabsContent=true` tab body). Pure. */
export function buildTabFillRequests(tab: UgcDocTab, tabId: string, body: FetchedTabBody): DocsRequest[] {
  const layout = layoutTab(tab);
  const content = body.content ?? [];
  const tables = content.filter((e) => e.table);
  if (tables.length !== layout.tables.length) {
    throw new Error(`Google Docs tab "${tab.title}": expected ${layout.tables.length} table(s) after the skeleton batch, found ${tables.length}.`);
  }
  const segmentEnd = content[content.length - 1]?.endIndex ?? 0;
  const out: DocsRequest[] = [];
  for (let ti = tables.length - 1; ti >= 0; ti--) {
    const el = tables[ti];
    const spec = layout.tables[ti].spec;
    const rows = el.table?.tableRows ?? [];
    if (rows.length !== spec.rows) {
      throw new Error(`Google Docs tab "${tab.title}": table ${ti + 1} has ${rows.length} rows, expected ${spec.rows}.`);
    }
    // The empty paragraph Google put after the table → body text, not the
    // preceding paragraph's (possibly heading) style. A range may never
    // include the segment's final newline, so a tab-final one is left alone
    // (it is empty and invisible).
    const after = content.find((e) => e.paragraph && e.startIndex === el.endIndex);
    if (after && after.startIndex !== undefined && after.endIndex !== undefined) {
      const end = Math.min(after.endIndex, segmentEnd - 1);
      if (end > after.startIndex) out.push(...paragraphStyleRequests(after.startIndex, end, tabId, ROLE_STYLE.paragraph.para));
    }
    for (let r = spec.rows - 1; r >= 0; r--) {
      const cells = rows[r].tableCells ?? [];
      const shift = spec.cols - cells.length; // > 0 only if covered cells were omitted
      if (shift < 0) throw new Error(`Google Docs tab "${tab.title}": table ${ti + 1} row ${r} has ${cells.length} cells, expected ${spec.cols}.`);
      for (let c = spec.cols - 1; c >= 0; c--) {
        const cellSpec = spec.cells[r][c];
        const cell = cells[c - shift];
        if (!cellSpec || !cell) continue;
        const start = cell.content?.[0]?.startIndex;
        const cellEnd = cell.endIndex;
        if (start === undefined || cellEnd === undefined) {
          throw new Error(`Google Docs tab "${tab.title}": table ${ti + 1} cell (${r},${c}) has no paragraph indexes.`);
        }
        // Defensive: a fresh cell is exactly one newline; clear anything else
        // (e.g. newlines concatenated by a merge) before writing.
        if (cellEnd - 1 > start) out.push({ deleteContentRange: { range: range(start, cellEnd - 1, tabId) } });
        const text = cellSpec.text;
        if (text.length) {
          out.push({ insertText: { text, location: { index: start, tabId } } });
          out.push(textStyleRequest(start, start + text.length, tabId, cellSpec.style));
          out.push(...paragraphStyleRequests(start, start + text.length, tabId, CELL_PARA));
        } else {
          out.push(...paragraphStyleRequests(start, start + 1, tabId, CELL_PARA));
        }
      }
    }
  }
  return out;
}

// ─── Tab setup ──────────────────────────────────────────────────────────────

/** Rename the default tab to the first tab's title, add the others. Pure. */
export function buildTabSetupRequests(doc: UgcDocument, firstTabId: string): DocsRequest[] {
  return [
    { updateDocumentTabProperties: { tabProperties: { tabId: firstTabId, title: doc.tabs[0].title }, fields: 'title' } },
    ...doc.tabs.slice(1).map((tab, i) => ({ addDocumentTab: { tabProperties: { title: tab.title, index: i + 1 } } })),
  ];
}

/** Thread the tab ids out of the setup batch's replies (index-aligned). */
export function readTabIds(replies: BatchUpdateResponse['replies'], firstTabId: string, tabCount: number): string[] {
  const ids = [firstTabId];
  for (let i = 1; i < tabCount; i++) {
    const id = replies?.[i]?.addDocumentTab?.tabProperties?.tabId;
    if (!id) throw new Error(`Google Docs did not return the id of tab ${i + 1} (addDocumentTab reply missing).`);
    ids.push(id);
  }
  return ids;
}

function flattenTabs(tabs: FetchedTab[] | undefined): FetchedTab[] {
  const out: FetchedTab[] = [];
  for (const t of tabs ?? []) {
    out.push(t);
    out.push(...flattenTabs(t.childTabs));
  }
  return out;
}

// ─── Network ────────────────────────────────────────────────────────────────

function describeDocsError(status: number, data: unknown): string {
  const err = data && typeof data === 'object' && 'error' in data ? (data as { error?: { message?: string } }).error : undefined;
  const message = err?.message ?? `HTTP ${status}`;
  if (status === 401) return `Google rejected the sign-in token (${message}). Click Export again to sign in.`;
  if (status === 403) {
    if (/not been used|disabled|SERVICE_DISABLED|accessNotConfigured|not enabled/i.test(message)) {
      return `The Google Docs API is not enabled in the Google Cloud project that owns this Client ID. Enable "Google Docs API" under APIs & Services → Library (docs/GOOGLE-DOCS-EXPORT-SETUP.md, step 3). Google said: ${message}`;
    }
    if (/scope|insufficient|permission/i.test(message)) {
      return `Google refused the request for lack of permission (${message}). Click Export again and allow the app to create files in your Drive.`;
    }
    return `Google Docs API refused the request: ${message}`;
  }
  if (status === 429) return `Google Docs rate limit reached (${message}). Wait a minute and try again.`;
  return `Google Docs API error ${status}: ${message}`;
}

async function docsFetch<T>(path: string, accessToken: string, body?: unknown): Promise<T> {
  const res = await fetch(`${DOCS_API}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) clearGoogleAccessToken();
    throw new Error(describeDocsError(res.status, data));
  }
  return data as T;
}

async function batchUpdate(documentId: string, accessToken: string, requests: DocsRequest[]): Promise<BatchUpdateResponse> {
  let merged: BatchUpdateResponse = { replies: [] };
  for (let i = 0; i < requests.length; i += BATCH_CHUNK) {
    const res = await docsFetch<BatchUpdateResponse>(`/${documentId}:batchUpdate`, accessToken, { requests: requests.slice(i, i + BATCH_CHUNK) });
    merged = { replies: [...(merged.replies ?? []), ...(res.replies ?? [])] };
  }
  return merged;
}

/**
 * Creates the three-tab Google Doc in the signed-in user's Drive.
 * `accessToken` comes from `getGoogleAccessToken()` (drive.file scope).
 */
export async function createGoogleDocFromUgcDocument(doc: UgcDocument, accessToken: string): Promise<{ documentId: string; url: string }> {
  // 1. Create.
  const created = await docsFetch<FetchedDocument>('', accessToken, { title: doc.title });
  const documentId = created.documentId;
  if (!documentId) throw new Error('Google Docs created no document (no documentId in the response).');
  let firstTabId = created.tabs?.[0]?.tabProperties?.tabId;
  if (!firstTabId) {
    const fetched = await docsFetch<FetchedDocument>(`/${documentId}?includeTabsContent=true`, accessToken);
    firstTabId = flattenTabs(fetched.tabs)[0]?.tabProperties?.tabId;
  }
  if (!firstTabId) throw new Error('Google Docs returned no tab id for the new document — the Docs API in this project may predate document tabs.');

  // 2. Tabs.
  const setup = await batchUpdate(documentId, accessToken, buildTabSetupRequests(doc, firstTabId));
  const tabIds = readTabIds(setup.replies, firstTabId, doc.tabs.length);

  // 3. Skeleton of every tab in one batch.
  await batchUpdate(documentId, accessToken, doc.tabs.flatMap((tab, i) => buildTabSkeletonRequests(tab, tabIds[i])));

  // 4. Read the real structure.
  const fetched = await docsFetch<FetchedDocument>(`/${documentId}?includeTabsContent=true`, accessToken);
  const tabsById = new Map(flattenTabs(fetched.tabs).map((t) => [t.tabProperties?.tabId ?? '', t]));

  // 5. Fill every cell, backward, from server-read indexes.
  const fill = doc.tabs.flatMap((tab, i) => {
    const body = tabsById.get(tabIds[i])?.documentTab?.body;
    if (!body) throw new Error(`Google Docs did not return the body of tab "${tab.title}".`);
    return buildTabFillRequests(tab, tabIds[i], body);
  });
  if (fill.length) await batchUpdate(documentId, accessToken, fill);

  return { documentId, url: `https://docs.google.com/document/d/${documentId}/edit` };
}
