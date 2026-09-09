#!/usr/bin/env node
/**
 * Google Docs export — offline test of the pure request builders.
 *
 *   PATH="$HOME/local/node/bin:$PATH" node scripts/test-google-docs-requests.mjs
 *
 * esbuild-bundles `src/api/googleDocs.ts` (same pattern as smoke-v2-ecom.mjs),
 * runs the builders on `exampleUgcDocument()` and replays the requests
 * against a tiny simulator of a Docs tab body that applies insertText /
 * insertTable / deleteContentRange to a virtual index model using Google's
 * documented layout (section break at 0; paragraph = text + "\n"; table =
 * 1 + rows × (1 + cells × (1 + paragraphs)) + 1; insertTable puts a newline
 * before the table, whose start is location + 1). The simulated body is what
 * `documents.get?includeTabsContent=true` would return, and the fill batch is
 * replayed against it. Assumption (documented in googleDocs.ts): merged-away
 * cells stay in the structure with one empty paragraph.
 */
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const ENTRY = `
export * from './src/api/googleDocs';
export { exampleUgcDocument } from './src/factory2/ugcDocModel';
`;
const tmp = mkdtempSync(path.join(tmpdir(), 'gdocs-test-'));
const outfile = path.join(tmp, 'entry.cjs');
await build({ stdin: { contents: ENTRY, resolveDir: ROOT, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent' });
const { buildTabSkeletonRequests, buildTabFillRequests, buildTabSetupRequests, readTabIds, exampleUgcDocument } = require(outfile);

// ─── Simulator ──────────────────────────────────────────────────────────────

class TabSim {
  constructor() {
    // Body starts at index 1 (index 0 is the section break) with one empty paragraph.
    this.elements = [{ type: 'p', text: '' }];
  }
  /** Assign indexes exactly as the Docs API does. */
  layout() {
    let cursor = 1;
    const items = [];
    for (const el of this.elements) {
      if (el.type === 'p') {
        const start = cursor;
        cursor += el.text.length + 1;
        items.push({ el, start, end: cursor });
      } else {
        const start = cursor;
        cursor += 1;
        const rows = [];
        for (const row of el.cells) {
          const rs = cursor;
          cursor += 1;
          const cells = [];
          for (const cell of row) {
            const cs = cursor;
            cursor += 1;
            const paras = [];
            for (const t of cell.paras) {
              const ps = cursor;
              cursor += t.length + 1;
              paras.push({ start: ps, end: cursor, text: t });
            }
            cells.push({ start: cs, end: cursor, paras, cell });
          }
          rows.push({ start: rs, end: cursor, cells });
        }
        cursor += 1;
        items.push({ el, start, end: cursor, rows });
      }
    }
    return { items, end: cursor };
  }
  /** Find the paragraph (top-level or in a cell) holding `index`. */
  locate(index) {
    for (const item of this.layout().items) {
      if (item.el.type === 'p') {
        if (index >= item.start && index < item.end) return { container: this.elements, list: null, el: item.el, start: item.start, inCell: false };
      } else if (index >= item.start && index < item.end) {
        for (const row of item.rows) for (const c of row.cells) for (let i = 0; i < c.paras.length; i++) {
          const p = c.paras[i];
          if (index >= p.start && index < p.end) return { container: null, list: c.cell.paras, at: i, start: p.start, inCell: true, cellStart: c.paras[0].start };
        }
        throw new Error(`index ${index} falls on table structure, not inside a cell paragraph`);
      }
    }
    throw new Error(`index ${index} out of bounds (body end ${this.layout().end})`);
  }
  insertText(index, text) {
    const loc = this.locate(index);
    if (loc.inCell) {
      const cur = loc.list[loc.at];
      const off = index - loc.start;
      const parts = (cur.slice(0, off) + text + cur.slice(off)).split('\n');
      loc.list.splice(loc.at, 1, ...parts);
    } else {
      const off = index - loc.start;
      const parts = (loc.el.text.slice(0, off) + text + loc.el.text.slice(off)).split('\n').map((t) => ({ type: 'p', text: t }));
      this.elements.splice(this.elements.indexOf(loc.el), 1, ...parts);
    }
    return loc;
  }
  insertTable(index, rows, cols) {
    const loc = this.locate(index);
    if (loc.inCell) throw new Error('nested tables not supported');
    const off = index - loc.start;
    const before = { type: 'p', text: loc.el.text.slice(0, off) };
    const after = { type: 'p', text: loc.el.text.slice(off) };
    const table = { type: 'table', rows, cols, cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ paras: [''] }))), merges: [] };
    this.elements.splice(this.elements.indexOf(loc.el), 1, before, table, after);
    return table;
  }
  deleteContentRange(start, end) {
    const loc = this.locate(start);
    if (!loc.inCell) throw new Error('simulator only deletes inside cells');
    const joined = loc.list.join('\n');
    const base = loc.cellStart;
    loc.list.splice(0, loc.list.length, ...(joined.slice(0, start - base) + joined.slice(end - base)).split('\n'));
  }
  tableAt(index) {
    const item = this.layout().items.find((i) => i.el.type === 'table' && i.start === index);
    if (!item) throw new Error(`no table starts at ${index}`);
    return item;
  }
  /** What documents.get would return for this tab. */
  toBody() {
    const para = (p) => ({ startIndex: p.start, endIndex: p.end, paragraph: { elements: [{ startIndex: p.start, endIndex: p.end, textRun: { content: p.text + '\n' } }] } });
    const content = [{ startIndex: 0, endIndex: 1, sectionBreak: {} }];
    for (const item of this.layout().items) {
      if (item.el.type === 'p') content.push(para({ start: item.start, end: item.end, text: item.el.text }));
      else {
        content.push({
          startIndex: item.start,
          endIndex: item.end,
          table: {
            rows: item.el.rows,
            columns: item.el.cols,
            tableRows: item.rows.map((r) => ({ startIndex: r.start, endIndex: r.end, tableCells: r.cells.map((c) => ({ startIndex: c.start, endIndex: c.end, content: c.paras.map(para) })) })),
          },
        });
      }
    }
    return { content };
  }
}

// ─── Assertions ─────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
}
const rgbOf = (h) => {
  const n = parseInt(h.slice(1), 16);
  return { red: ((n >> 16) & 255) / 255, green: ((n >> 8) & 255) / 255, blue: (n & 255) / 255 };
};
const sameColor = (c, h) => {
  const want = rgbOf(h);
  const got = c?.color?.rgbColor ?? {};
  return ['red', 'green', 'blue'].every((k) => Math.abs((got[k] ?? 0) - want[k]) < 1e-6);
};
const kindOf = (req) => Object.keys(req)[0];

/** Every tabId inside a request (location / range / tableStartLocation / updateDocumentStyle). */
function tabIdsIn(obj, acc = []) {
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'tabId') acc.push(v);
      else tabIdsIn(v, acc);
    }
  }
  return acc;
}

/** Expected top-level paragraphs after the export (model blocks + the empty paragraph Google mandates after each table). */
function expectedParagraphs(tab) {
  const out = [];
  for (const b of tab.blocks) {
    if (b.kind === 'bullets') out.push(...b.items);
    else if (b.kind === 'kvTable' || b.kind === 'scriptTable' || b.kind === 'strategyTable') out.push({ table: b });
    else out.push(b.text);
  }
  return out;
}
function expectedCells(block) {
  if (block.kind === 'kvTable') return block.rows.map((r) => [r.label, r.value.join('\n')]);
  if (block.kind === 'scriptTable') return [block.header, ...block.rows.map((r) => [r.label, r.shot, r.line, r.overlay])];
  const rows = [block.header];
  for (const g of block.groups) g.fields.forEach((f, i) => rows.push([i === 0 || g.fields.length < 2 ? g.section : '', f.field, f.direction]));
  return rows;
}

// ─── Run ────────────────────────────────────────────────────────────────────

const doc = exampleUgcDocument();
const TAB_IDS = ['t.creator', 't.script', 't.strategy'];
const NAVY = '#203f66';
const LABEL_BG = '#edf2fa';
const WIDTHS = { kvTable: [241, 241], scriptTable: [120.5, 120.5, 120.5, 120.5], strategyTable: [160.67, 160.67, 160.67] };

// Tab setup + reply threading.
const setup = buildTabSetupRequests(doc, 'first');
check('setup: rename first tab + add two', kindOf(setup[0]) === 'updateDocumentTabProperties' && setup[0].updateDocumentTabProperties.tabProperties.tabId === 'first' && setup[0].updateDocumentTabProperties.tabProperties.title === 'Creator Brief' && setup.length === 3 && setup[1].addDocumentTab.tabProperties.title === 'Script' && setup[1].addDocumentTab.tabProperties.index === 1 && setup[2].addDocumentTab.tabProperties.title === 'Strategy' && setup[2].addDocumentTab.tabProperties.index === 2);
const ids = readTabIds([{}, { addDocumentTab: { tabProperties: { tabId: 'b' } } }, { addDocumentTab: { tabProperties: { tabId: 'c' } } }], 'a', 3);
check('setup: tab ids read from index-aligned replies', JSON.stringify(ids) === '["a","b","c"]');
let threw = false;
try { readTabIds([{}, {}], 'a', 3); } catch { threw = true; }
check('setup: missing addDocumentTab reply throws', threw);

doc.tabs.forEach((tab, ti) => {
  const tabId = TAB_IDS[ti];
  const label = `[${tab.title}]`;
  const sim = new TabSim();
  const skeleton = buildTabSkeletonRequests(tab, tabId);

  // ── Replay the skeleton, validating every index against the live model ──
  let skeletonOk = true;
  let skeletonErr = '';
  const tables = [];
  const shading = [];
  const merges = [];
  const widths = [];
  const rowStyles = [];
  const bullets = [];
  const styles = [];
  // The paragraph layout the styling requests were computed against: after
  // the text insert, before any table insert shifts what follows a table.
  let preTable = null;
  for (const req of skeleton) {
    const k = kindOf(req);
    const r = req[k];
    try {
      if (k === 'insertText') {
        sim.insertText(r.location.index, r.text);
        preTable = sim.layout();
      } else if (k === 'insertTable') tables.push({ req: r, table: sim.insertTable(r.location.index, r.rows, r.columns), start: r.location.index + 1 });
      else if (k === 'updateParagraphStyle' || k === 'updateTextStyle' || k === 'createParagraphBullets') {
        const { startIndex, endIndex } = r.range;
        const end = sim.layout().end;
        // Google rejects a range that reaches the segment's final newline.
        if (!(startIndex >= 1 && startIndex < endIndex && endIndex <= end - 1)) throw new Error(`${k} range [${startIndex},${endIndex}) outside [1,${end - 1}]`);
        if (k === 'createParagraphBullets') bullets.push(r);
        else styles.push({ k, ...r, start: startIndex, end: endIndex });
      } else if (k === 'updateTableColumnProperties') {
        const t = sim.tableAt(r.tableStartLocation.index);
        for (const ci of r.columnIndices) if (ci < 0 || ci >= t.el.cols) throw new Error('column index out of range');
        widths.push({ start: r.tableStartLocation.index, cols: r.columnIndices, width: r.tableColumnProperties.width.magnitude, type: r.tableColumnProperties.widthType, fields: r.fields });
      } else if (k === 'updateTableCellStyle') {
        if (r.tableStartLocation) sim.tableAt(r.tableStartLocation.index);
        else {
          const loc = r.tableRange.tableCellLocation;
          const t = sim.tableAt(loc.tableStartLocation.index);
          if (loc.rowIndex + r.tableRange.rowSpan > t.el.rows || loc.columnIndex + r.tableRange.columnSpan > t.el.cols) throw new Error('cell range out of table');
          shading.push({ start: loc.tableStartLocation.index, ...loc, rowSpan: r.tableRange.rowSpan, columnSpan: r.tableRange.columnSpan, bg: r.tableCellStyle.backgroundColor, fields: r.fields });
        }
      } else if (k === 'mergeTableCells') {
        const loc = r.tableRange.tableCellLocation;
        const t = sim.tableAt(loc.tableStartLocation.index);
        if (loc.rowIndex + r.tableRange.rowSpan > t.el.rows || r.tableRange.rowSpan < 2) throw new Error('bad merge span');
        t.el.merges.push({ row: loc.rowIndex, span: r.tableRange.rowSpan, col: loc.columnIndex });
        merges.push({ start: loc.tableStartLocation.index, row: loc.rowIndex, span: r.tableRange.rowSpan, col: loc.columnIndex });
      } else if (k === 'updateTableRowStyle') {
        const t = sim.tableAt(r.tableStartLocation.index);
        for (const ri of r.rowIndices) if (ri < 0 || ri >= t.el.rows) throw new Error('row index out of range');
        rowStyles.push({ start: r.tableStartLocation.index, rows: r.rowIndices, min: r.tableRowStyle.minRowHeight?.magnitude, fields: r.fields });
      } else if (k === 'updateDocumentStyle') {
        if (r.tabId !== tabId) throw new Error('page setup missing tabId');
      } else throw new Error(`unexpected request kind ${k}`);
    } catch (e) {
      skeletonOk = false;
      skeletonErr = `${k}: ${e.message}`;
      break;
    }
  }
  check(`${label} skeleton: every request replays with in-bounds indexes`, skeletonOk, skeletonErr);
  check(`${label} skeleton: page setup first (A4 + 3cm/2cm margins, tabId)`, kindOf(skeleton[0]) === 'updateDocumentStyle' && skeleton[0].updateDocumentStyle.documentStyle.pageSize.width.magnitude === 595.28 && skeleton[0].updateDocumentStyle.documentStyle.marginTop.magnitude === 85.05 && skeleton[0].updateDocumentStyle.documentStyle.marginLeft.magnitude === 56.7 && skeleton[0].updateDocumentStyle.fields.includes('pageSize'));
  check(`${label} skeleton: tables inserted last → first`, tables.every((t, i) => i === 0 || t.req.location.index < tables[i - 1].req.location.index));
  const modelTables = tab.blocks.filter((b) => b.kind.endsWith('Table'));
  const docOrder = [...tables].reverse();
  check(`${label} skeleton: table count = model`, docOrder.length === modelTables.length, `${docOrder.length} vs ${modelTables.length}`);
  docOrder.forEach((t, i) => {
    const block = modelTables[i];
    const exp = expectedCells(block);
    check(`${label} ${block.kind}: rows×cols = ${exp.length}×${exp[0].length}`, t.req.rows === exp.length && t.req.columns === exp[0].length, `${t.req.rows}×${t.req.columns}`);
    const w = widths.filter((x) => x.start === t.start);
    const coveredCols = w.flatMap((x) => x.cols).sort();
    check(`${label} ${block.kind}: fixed column widths ${WIDTHS[block.kind].join('/')}pt`, w.every((x) => x.type === 'FIXED_WIDTH' && x.fields === 'widthType,width' && x.cols.every((ci) => WIDTHS[block.kind][ci] === x.width)) && JSON.stringify(coveredCols) === JSON.stringify(WIDTHS[block.kind].map((_, i) => i)));
    const borders = skeleton.find((q) => kindOf(q) === 'updateTableCellStyle' && q.updateTableCellStyle.tableStartLocation?.index === t.start);
    const b = borders?.updateTableCellStyle.tableCellStyle;
    check(`${label} ${block.kind}: 1pt solid black borders on all four sides of every cell`, Boolean(b) && ['borderTop', 'borderBottom', 'borderLeft', 'borderRight'].every((s) => b[s].width.magnitude === 1 && b[s].dashStyle === 'SOLID' && sameColor(b[s].color, '#000000')) && borders.updateTableCellStyle.fields === 'borderTop,borderBottom,borderLeft,borderRight');
    const sh = shading.filter((x) => x.start === t.start);
    if (block.kind === 'kvTable') {
      check(`${label} kvTable: label column shaded ${LABEL_BG}, no header shading`, sh.length === 1 && sh[0].rowIndex === 0 && sh[0].columnIndex === 0 && sh[0].rowSpan === exp.length && sh[0].columnSpan === 1 && sameColor(sh[0].bg, LABEL_BG) && sh[0].fields === 'backgroundColor');
    } else {
      check(`${label} ${block.kind}: header row shaded ${NAVY} across all ${exp[0].length} columns`, sh.length === 1 && sh[0].rowIndex === 0 && sh[0].columnIndex === 0 && sh[0].rowSpan === 1 && sh[0].columnSpan === exp[0].length && sameColor(sh[0].bg, NAVY));
    }
    const m = merges.filter((x) => x.start === t.start);
    if (block.kind === 'strategyTable') {
      const expMerges = [];
      let row = 1;
      for (const g of block.groups) {
        if (g.fields.length >= 2) expMerges.push({ row, span: g.fields.length });
        row += g.fields.length;
      }
      check(`${label} strategyTable: SECTION merges = ${expMerges.map((x) => `r${x.row}+${x.span}`).join(' ')}`, m.length === expMerges.length && m.every((x, i) => x.row === expMerges[i].row && x.span === expMerges[i].span && x.col === 0), JSON.stringify(m));
      const rs = rowStyles.find((x) => x.start === t.start);
      check(`${label} strategyTable: body rows min height 19pt`, Boolean(rs) && rs.min === 19 && rs.fields === 'minRowHeight' && JSON.stringify(rs.rows) === JSON.stringify(exp.map((_, i) => i).slice(1)));
    } else {
      check(`${label} ${block.kind}: no merges, no min row height`, m.length === 0 && !rowStyles.some((x) => x.start === t.start));
    }
  });

  // ── Paragraph styling (checked against the pre-table layout the requests used) ──
  const topParas = preTable.items.filter((i) => i.el.type === 'p');
  // Text styles must cover the paragraph's characters (its newline may be excluded);
  // paragraph styles apply to every paragraph overlapping the range.
  const covers = (kind, s, p) => (kind === 'updateTextStyle' ? p.start >= s.start && p.end - 1 <= s.end : p.start < s.end && p.end > s.start);
  const findStyle = (kind, text, pick) => styles.find((s) => s.k === kind && topParas.some((p) => p.el.text === text && covers(kind, s, p)) && pick(s));
  check(`${label} title: TITLE named style + 26pt regular + spacing 0`, Boolean(findStyle('updateParagraphStyle', tab.title, (s) => s.paragraphStyle.namedStyleType === 'TITLE')) && Boolean(findStyle('updateTextStyle', tab.title, (s) => s.textStyle.fontSize.magnitude === 26 && s.textStyle.bold === false && s.textStyle.weightedFontFamily.fontFamily === 'Arial')) && Boolean(findStyle('updateParagraphStyle', tab.title, (s) => s.paragraphStyle.spaceAbove?.magnitude === 0 && s.paragraphStyle.spaceBelow?.magnitude === 0)));
  const headingText = tab.blocks.find((b) => b.kind === 'heading').text;
  check(`${label} heading: HEADING_1 + bold 16pt ${NAVY} + 8pt before/after`, Boolean(findStyle('updateParagraphStyle', headingText, (s) => s.paragraphStyle.namedStyleType === 'HEADING_1')) && Boolean(findStyle('updateParagraphStyle', headingText, (s) => s.paragraphStyle.spaceAbove?.magnitude === 8 && s.paragraphStyle.spaceBelow?.magnitude === 8)) && Boolean(findStyle('updateTextStyle', headingText, (s) => s.textStyle.fontSize.magnitude === 16 && s.textStyle.bold === true && sameColor(s.textStyle.foregroundColor, NAVY))));
  if (tab.title === 'Script') {
    const rt = tab.blocks.find((b) => b.kind === 'readThrough').text;
    const rtl = tab.blocks.find((b) => b.kind === 'readThroughLabel').text;
    check(`${label} read-through label: bold 12pt, 16.5/7.5pt, single spacing`, Boolean(findStyle('updateTextStyle', rtl, (s) => s.textStyle.fontSize.magnitude === 12 && s.textStyle.bold === true)) && Boolean(findStyle('updateParagraphStyle', rtl, (s) => s.paragraphStyle.lineSpacing === 100 && s.paragraphStyle.spaceAbove?.magnitude === 16.5 && s.paragraphStyle.spaceBelow?.magnitude === 7.5)));
    check(`${label} read-through: 10pt on #f8f9fb, line spacing 150, 7.5/19.5pt, right indent 10.5`, Boolean(findStyle('updateTextStyle', rt, (s) => s.textStyle.fontSize.magnitude === 10 && sameColor(s.textStyle.backgroundColor, '#f8f9fb') && s.fields.includes('backgroundColor'))) && Boolean(findStyle('updateParagraphStyle', rt, (s) => s.paragraphStyle.lineSpacing === 150 && s.paragraphStyle.spaceAbove?.magnitude === 7.5 && s.paragraphStyle.spaceBelow?.magnitude === 19.5 && s.paragraphStyle.indentEnd?.magnitude === 10.5)));
    const items = tab.blocks.find((b) => b.kind === 'bullets').items;
    const first = topParas.find((p) => p.el.text === items[0]);
    const last = topParas.find((p) => p.el.text === items[items.length - 1]);
    check(`${label} bullets: one createParagraphBullets over exactly the ${items.length} items, disc preset`, bullets.length === 1 && bullets[0].bulletPreset === 'BULLET_DISC_CIRCLE_SQUARE' && bullets[0].range.startIndex === first.start && bullets[0].range.endIndex === Math.min(last.end, preTable.end - 1));
    check(`${label} bullets: 9pt text`, Boolean(findStyle('updateTextStyle', items[0], (s) => s.textStyle.fontSize.magnitude === 9)));
  }
  const body = sim.toBody();

  // ── Fill ──
  let fill;
  try {
    fill = buildTabFillRequests(tab, tabId, body);
  } catch (e) {
    check(`${label} fill: builder ran on the fetched body`, false, e.message);
    return;
  }
  const inserts = fill.filter((q) => kindOf(q) === 'insertText').map((q) => q.insertText.location.index);
  check(`${label} fill: insertText indexes strictly decreasing (backward fill)`, inserts.every((x, i) => i === 0 || x < inserts[i - 1]));
  const touched = fill.map((q) => { const r = q[kindOf(q)]; return r.location?.index ?? r.range?.startIndex; });
  check(`${label} fill: every request touches an index ≤ the previous one`, touched.every((x, i) => i === 0 || x <= touched[i - 1]));
  let fillOk = true;
  let fillErr = '';
  let cellStyleOk = true;
  for (let i = 0; i < fill.length; i++) {
    const req = fill[i];
    const k = kindOf(req);
    const r = req[k];
    try {
      if (k === 'insertText') {
        const loc = sim.insertText(r.location.index, r.text);
        if (!loc.inCell || loc.start !== r.location.index || loc.at !== 0) throw new Error(`insert at ${r.location.index} is not a cell's first-paragraph start`);
        const ts = fill[i + 1]?.updateTextStyle;
        const ps = fill[i + 2]?.updateParagraphStyle;
        if (!ts || ts.range.startIndex !== r.location.index || ts.range.endIndex !== r.location.index + r.text.length) cellStyleOk = false;
        if (!ps || ps.paragraphStyle.lineSpacing !== 100 || ps.paragraphStyle.spaceAbove.magnitude !== 0 || ps.paragraphStyle.spaceBelow.magnitude !== 0) cellStyleOk = false;
      } else if (k === 'deleteContentRange') sim.deleteContentRange(r.range.startIndex, r.range.endIndex);
      else if (k === 'updateTextStyle' || k === 'updateParagraphStyle') {
        const { startIndex, endIndex } = r.range;
        const end = sim.layout().end;
        if (!(startIndex >= 1 && startIndex < endIndex && endIndex <= end - 1)) throw new Error(`${k} range [${startIndex},${endIndex}) outside [1,${end - 1}]`);
        if (k === 'updateTextStyle') sim.locate(startIndex);
      } else throw new Error(`unexpected request kind ${k}`);
    } catch (e) {
      fillOk = false;
      fillErr = `#${i} ${k}: ${e.message}`;
      break;
    }
  }
  check(`${label} fill: every request replays with in-bounds, server-read indexes`, fillOk, fillErr);
  check(`${label} fill: each insert followed by its text style + single-spaced paragraph style`, cellStyleOk);

  // ── Final document = model ──
  const final = sim.layout();
  const finalTables = final.items.filter((i) => i.el.type === 'table');
  let cellsOk = true;
  let cellErr = '';
  finalTables.forEach((t, i) => {
    const exp = expectedCells(modelTables[i]);
    t.el.cells.forEach((row, r) => row.forEach((cell, c) => {
      const got = cell.paras.join('\n');
      if (cellsOk && got !== exp[r][c]) { cellsOk = false; cellErr = `table ${i + 1} cell (${r},${c}): ${JSON.stringify(got).slice(0, 60)} ≠ ${JSON.stringify(exp[r][c]).slice(0, 60)}`; }
    }));
  });
  check(`${label} result: every cell holds exactly the model's text`, cellsOk, cellErr);
  const expected = expectedParagraphs(tab);
  const got = final.items.map((i) => (i.el.type === 'p' ? i.el.text : { table: true }));
  // Google mandates an (empty) paragraph after every table; the model has none there.
  const expectedWithTrailing = expected.flatMap((e) => (typeof e === 'string' ? [e] : [{ table: true }, '']));
  check(`${label} result: paragraph sequence = model blocks (+ the mandatory empty paragraph after each table)`, JSON.stringify(got) === JSON.stringify(expectedWithTrailing), JSON.stringify(got).slice(0, 200));
  // Text styles on well-known cells (request right after the insert).
  const styleAfterInsert = (text) => { const i = fill.findIndex((q) => q.insertText?.text === text); return i >= 0 ? fill[i + 1]?.updateTextStyle?.textStyle : undefined; };
  if (tab.title === 'Creator Brief') {
    const l = styleAfterInsert('Brief ID');
    const v = styleAfterInsert(doc.title);
    check(`${label} kv cells: label bold 9pt, value regular 9pt`, l?.bold === true && l?.fontSize.magnitude === 9 && v?.bold === false && v?.fontSize.magnitude === 9);
    const note = fill.find((q) => q.insertText?.text.includes('\n\n'));
    check(`${label} kv multi-paragraph value joined with newlines`, Boolean(note) && note.insertText.text.split('\n').length === 7);
  }
  if (tab.title === 'Script') {
    const h = styleAfterInsert('LINE / SECTION');
    const s = styleAfterInsert('HOOK 1');
    const line = styleAfterInsert(modelTables[0].rows[0].line);
    check(`${label} script cells: header bold white 8pt; LINE/SECTION bold 8pt; SCRIPT LINE regular 8pt`, h?.bold === true && h?.fontSize.magnitude === 8 && sameColor(h?.foregroundColor, '#ffffff') && s?.bold === true && s?.fontSize.magnitude === 8 && line?.bold === false && line?.fontSize.magnitude === 8);
  }
  if (tab.title === 'Strategy') {
    const h = styleAfterInsert('SECTION');
    const sec = styleAfterInsert('Strategy');
    const f = styleAfterInsert('Awareness Level');
    const d = styleAfterInsert(modelTables[0].groups[0].fields[0].direction);
    check(`${label} strategy cells: header bold white 9pt; SECTION/FIELD bold 9pt; DIRECTION regular 9pt`, h?.bold === true && h?.fontSize.magnitude === 9 && sameColor(h?.foregroundColor, '#ffffff') && sec?.bold === true && f?.bold === true && f?.fontSize.magnitude === 9 && d?.bold === false && d?.fontSize.magnitude === 9);
    const sectionInserts = fill.filter((q) => q.insertText && ['Strategy', 'Offer', 'Production', 'Editing', 'Reference'].includes(q.insertText.text)).length;
    check(`${label} strategy: SECTION written once per group (head cell only)`, sectionInserts === modelTables[0].groups.length, String(sectionInserts));
  }
  // The paragraph after a table is restyled to body text — unless it is the
  // tab's final (empty) paragraph, whose newline no range may include.
  const preFillEnd = body.content[body.content.length - 1].endIndex;
  const preFillTableEnds = body.content.filter((e) => e.table).map((e) => e.endIndex);
  const expectRestyle = preFillTableEnds.filter((e) => e + 1 <= preFillEnd - 1).length;
  const afterTable = fill.filter((q) => q.updateParagraphStyle?.paragraphStyle?.namedStyleType === 'NORMAL_TEXT' && preFillTableEnds.includes(q.updateParagraphStyle.range.startIndex));
  check(`${label} fill: paragraph after each mid-tab table restyled to body text (${expectRestyle}/${preFillTableEnds.length} tables qualify)`, afterTable.length === expectRestyle, `${afterTable.length}`);

  // ── Tab id threading ──
  const all = [...skeleton, ...fill];
  const ids = all.flatMap((q) => tabIdsIn(q));
  check(`${label} every request carries tabId "${tabId}" (${all.length} requests, ${ids.length} tab refs)`, all.every((q) => tabIdsIn(q).length > 0) && ids.every((x) => x === tabId));
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
