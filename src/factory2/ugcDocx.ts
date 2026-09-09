/**
 * UgcDocument → .docx, cloned from the example's own WordprocessingML.
 *
 * `docxTemplate/EXAMPLE-UGC-brief.docx` (a Google Docs export) is the ground
 * truth. Its package parts (styles, numbering, settings, fonts, theme, rels,
 * content types) ship verbatim from `docxTemplate/`; only `word/document.xml`
 * is generated here, by filling the example's own paragraph / run / table
 * fragments with the document's text. Every property below is copied from
 * the example's XML — nothing is invented — minus the revision ids, paraIds,
 * bookmarks, grid-change records and empty runs, which do not render.
 * Section layout is the example's too: each tab's Title paragraph closes a
 * section (the first carries the page setup, the others a nextPage break)
 * and an empty paragraph with a nextPage break closes each tab's body.
 *
 * `buildUgcDocumentXml` is pure and deterministic (snapshot-testable);
 * `buildUgcDocxBlob` zips it with the template parts. Verified against the
 * example by `scripts/render-ugc-docx.mjs`.
 */

import JSZip from 'jszip';
import type { UgcDocBlock, UgcDocument, UgcDocTab, UgcKvRow, UgcScriptRow, UgcStrategyGroup } from './ugcDocModel';
import contentTypesXml from './docxTemplate/content-types.xml?raw';
import relsXml from './docxTemplate/rels.xml?raw';
import documentRelsXml from './docxTemplate/document.xml.rels?raw';
import stylesXml from './docxTemplate/styles.xml?raw';
import numberingXml from './docxTemplate/numbering.xml?raw';
import settingsXml from './docxTemplate/settings.xml?raw';
import fontTableXml from './docxTemplate/fontTable.xml?raw';
import themeXml from './docxTemplate/theme1.xml?raw';

export const UGC_DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// ─── XML text ───────────────────────────────────────────────────────────────

/** Characters XML 1.0 forbids in text: control characters other than tab / newline, and U+FFFE–FFFF. */
const INVALID_XML_CHARS = /[^\P{Cc}\t\n\r]|[\uFFFE\uFFFF]/gu;

/** Escape for element text / attribute values; drop characters XML 1.0 forbids. */
function esc(text: string): string {
  return text
    .replace(INVALID_XML_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Run content: newlines become the example's soft line breaks. */
function textContent(text: string): string {
  return text
    .split(/\r\n|\r|\n/)
    .map((seg) => `<w:t xml:space="preserve">${esc(seg)}</w:t>`)
    .join('<w:br w:type="textWrapping"/>');
}

function run(rPr: string, text: string): string {
  return `<w:r><w:rPr>${rPr}<w:rtl w:val="0"/></w:rPr>${textContent(text)}</w:r>`;
}

// ─── The example's fragments ────────────────────────────────────────────────

const DOCUMENT_OPEN =
  '<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:sl="http://schemas.openxmlformats.org/schemaLibrary/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:lc="http://schemas.openxmlformats.org/drawingml/2006/lockedCanvas" xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns="http://schemas.microsoft.com/office/tasks/2019/documenttasks" xmlns:cr="http://schemas.microsoft.com/office/comments/2020/reactions">';

const PAGE_SETUP =
  '<w:pgSz w:h="16838" w:w="11906" w:orient="portrait"/>' +
  '<w:pgMar w:bottom="1700.7874015748032" w:top="1700.7874015748032" w:left="1133.8582677165355" w:right="1133.8582677165355" w:header="720" w:footer="720"/>' +
  '<w:pgNumType w:start="1"/>';

/** The first section (the document's page setup) has no explicit type; every later break is nextPage. */
function sectPr(first: boolean): string {
  return `<w:sectPr>${first ? '' : '<w:type w:val="nextPage"/>'}${PAGE_SETUP}</w:sectPr>`;
}

const TITLE_RUN_RPR_BASE =
  '<w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/><w:b w:val="0"/><w:bCs w:val="0"/><w:i w:val="0"/><w:iCs w:val="0"/><w:smallCaps w:val="0"/><w:strike w:val="0"/><w:color w:val="000000"/>';
const TITLE_RUN_RPR_TAIL = '<w:u w:val="none"/><w:shd w:fill="auto" w:val="clear"/><w:vertAlign w:val="baseline"/>';
const TITLE_MARK_RPR = `<w:rPr>${TITLE_RUN_RPR_BASE}<w:sz w:val="22"/><w:szCs w:val="22"/>${TITLE_RUN_RPR_TAIL}</w:rPr>`;
const TITLE_RUN_RPR = `${TITLE_RUN_RPR_BASE}<w:sz w:val="52"/><w:szCs w:val="52"/>${TITLE_RUN_RPR_TAIL}`;

/** The tab title (Title style, 26 pt). Closes a section when `section` is given. */
function titleParagraph(text: string, section: 'first' | 'next' | null): string {
  const mark = section === 'first' ? TITLE_MARK_RPR : '<w:rPr/>';
  const sect = section === null ? '' : sectPr(section === 'first');
  return (
    '<w:p><w:pPr><w:pStyle w:val="Title"/><w:keepNext w:val="0"/><w:keepLines w:val="0"/><w:pageBreakBefore w:val="0"/><w:widowControl w:val="0"/>' +
    '<w:pBdr><w:top w:space="0" w:sz="0" w:val="nil"/><w:left w:space="0" w:sz="0" w:val="nil"/><w:bottom w:space="0" w:sz="0" w:val="nil"/><w:right w:space="0" w:sz="0" w:val="nil"/><w:between w:space="0" w:sz="0" w:val="nil"/></w:pBdr>' +
    '<w:shd w:fill="auto" w:val="clear"/><w:spacing w:after="0" w:before="0" w:line="276" w:lineRule="auto"/><w:ind w:left="0" w:right="0" w:firstLine="0"/><w:jc w:val="left"/>' +
    `${mark}${sect}</w:pPr>${run(TITLE_RUN_RPR, text)}</w:p>`
  );
}

const HEADING_RPR = '<w:b w:val="1"/><w:bCs w:val="1"/><w:color w:val="203f66"/><w:sz w:val="32"/><w:szCs w:val="32"/>';

function headingParagraph(text: string): string {
  return `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:after="160" w:before="160" w:lineRule="auto"/><w:rPr/></w:pPr>${run(HEADING_RPR, text)}</w:p>`;
}

function normalParagraph(text: string): string {
  return `<w:p><w:pPr><w:rPr/></w:pPr>${text ? run('', text) : ''}</w:p>`;
}

const READ_LABEL_RPR = '<w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="24"/><w:szCs w:val="24"/>';

function readThroughLabelParagraph(text: string): string {
  return (
    '<w:p><w:pPr><w:widowControl w:val="0"/><w:spacing w:after="150" w:before="330" w:line="240" w:lineRule="auto"/><w:ind w:right="150"/>' +
    `<w:rPr>${READ_LABEL_RPR}</w:rPr></w:pPr>${run(READ_LABEL_RPR, text)}</w:p>`
  );
}

const READ_THROUGH_RPR = '<w:sz w:val="20"/><w:szCs w:val="20"/><w:shd w:fill="f8f9fb" w:val="clear"/>';

function readThroughParagraph(text: string): string {
  return (
    '<w:p><w:pPr><w:widowControl w:val="0"/><w:spacing w:after="390" w:before="150" w:line="360" w:lineRule="auto"/><w:ind w:right="210"/><w:rPr/></w:pPr>' +
    `${run(READ_THROUGH_RPR, text)}</w:p>`
  );
}

const BULLET_RPR = '<w:sz w:val="18"/><w:szCs w:val="18"/>';

function bulletParagraph(text: string): string {
  return (
    '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:ind w:left="720" w:hanging="360"/>' +
    `<w:rPr>${BULLET_RPR}</w:rPr></w:pPr>${run(BULLET_RPR, text)}</w:p>`
  );
}

/** Closes a tab's body with the example's empty paragraph + nextPage break. */
function sectionEndParagraph(): string {
  return `<w:p><w:pPr><w:rPr/>${sectPr(false)}</w:pPr></w:p>`;
}

// ─── Tables ─────────────────────────────────────────────────────────────────

const TABLE_BORDERS =
  '<w:tblBorders><w:top w:color="000000" w:space="0" w:sz="8" w:val="single"/><w:left w:color="000000" w:space="0" w:sz="8" w:val="single"/><w:bottom w:color="000000" w:space="0" w:sz="8" w:val="single"/><w:right w:color="000000" w:space="0" w:sz="8" w:val="single"/><w:insideH w:color="000000" w:space="0" w:sz="8" w:val="single"/><w:insideV w:color="000000" w:space="0" w:sz="8" w:val="single"/></w:tblBorders>';

/** Column widths exactly as the example writes them (9640 twips total). */
const KV_GRID = ['4820', '4820'];
const SCRIPT_GRID = ['2410', '2410', '2410', '2410'];
const STRATEGY_GRID = ['3213.3333333333335', '3213.3333333333335', '3213.3333333333335'];

function table(styleId: string, grid: string[], rows: string): string {
  return (
    `<w:tbl><w:tblPr><w:tblStyle w:val="${styleId}"/><w:tblW w:w="9640.0" w:type="dxa"/><w:jc w:val="left"/>${TABLE_BORDERS}<w:tblLayout w:type="fixed"/><w:tblLook w:val="0600"/></w:tblPr>` +
    `<w:tblGrid>${grid.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows}</w:tbl>`
  );
}

const ROW_PR = '<w:trPr><w:cantSplit w:val="0"/><w:tblHeader w:val="0"/></w:trPr>';
const STRATEGY_ROW_PR = '<w:trPr><w:cantSplit w:val="0"/><w:trHeight w:val="380" w:hRule="atLeast"/><w:tblHeader w:val="0"/></w:trPr>';

const SHD_HEADER = '<w:shd w:fill="203f66" w:val="clear"/>';
const SHD_LABEL = '<w:shd w:fill="edf2fa" w:val="clear"/>';

const BOLD = '<w:b w:val="1"/><w:bCs w:val="1"/>';
const WHITE = '<w:color w:val="ffffff"/>';
const SZ16 = '<w:sz w:val="16"/><w:szCs w:val="16"/>';
const SZ18 = '<w:sz w:val="18"/><w:szCs w:val="18"/>';

/** Cell paragraph: single-spaced, widow control off; the mark carries the cell's run properties. */
function cellParagraph(text: string, rPr: string): string {
  return `<w:p><w:pPr><w:widowControl w:val="0"/><w:spacing w:line="240" w:lineRule="auto"/><w:rPr>${rPr}</w:rPr></w:pPr>${text ? run(rPr, text) : ''}</w:p>`;
}

function cell(tcPr: string, paragraphs: string): string {
  return `<w:tc>${tcPr ? `<w:tcPr>${tcPr}</w:tcPr>` : '<w:tcPr/>'}${paragraphs}</w:tc>`;
}

function headerRow(labels: readonly string[], rPr: string): string {
  return `<w:tr>${ROW_PR}${labels.map((l) => cell(SHD_HEADER, cellParagraph(l, rPr))).join('')}</w:tr>`;
}

function kvTable(rows: UgcKvRow[]): string {
  const body = rows
    .map((r) => {
      const values = r.value.length ? r.value : [''];
      return `<w:tr>${ROW_PR}${cell(SHD_LABEL, cellParagraph(r.label, BOLD + SZ18))}${cell('', values.map((v) => cellParagraph(v, SZ18)).join(''))}</w:tr>`;
    })
    .join('');
  return table('Table1', KV_GRID, body);
}

function scriptTable(header: readonly string[], rows: UgcScriptRow[]): string {
  const body = rows
    .map(
      (r) =>
        `<w:tr>${ROW_PR}` +
        cell('', cellParagraph(r.label, BOLD + SZ16)) +
        cell('', cellParagraph(r.shot, BOLD + SZ16)) +
        cell('', cellParagraph(r.line, SZ16)) +
        cell('', cellParagraph(r.overlay, SZ16)) +
        '</w:tr>',
    )
    .join('');
  return table('Table2', SCRIPT_GRID, headerRow(header, BOLD + WHITE + SZ16) + body);
}

function strategyTable(header: readonly string[], groups: UgcStrategyGroup[]): string {
  const body = groups
    .map((g) => {
      const merged = g.fields.length > 1;
      return g.fields
        .map((f, i) => {
          const sectionCell =
            i === 0
              ? cell(merged ? '<w:vMerge w:val="restart"/>' : '', cellParagraph(g.section, BOLD + SZ18))
              : cell('<w:vMerge w:val="continue"/>', cellParagraph('', BOLD + SZ18));
          return `<w:tr>${STRATEGY_ROW_PR}${sectionCell}${cell('', cellParagraph(f.field, BOLD + SZ18))}${cell('', cellParagraph(f.direction, SZ18))}</w:tr>`;
        })
        .join('');
    })
    .join('');
  return table('Table3', STRATEGY_GRID, headerRow(header, BOLD + WHITE + SZ18) + body);
}

// ─── Document ───────────────────────────────────────────────────────────────

function renderBlock(block: UgcDocBlock): string {
  switch (block.kind) {
    case 'title':
      return titleParagraph(block.text, null);
    case 'heading':
      return headingParagraph(block.text);
    case 'paragraph':
      return normalParagraph(block.text);
    case 'readThroughLabel':
      return readThroughLabelParagraph(block.text);
    case 'readThrough':
      return readThroughParagraph(block.text);
    case 'bullets':
      return block.items.map(bulletParagraph).join('');
    case 'kvTable':
      return kvTable(block.rows);
    case 'scriptTable':
      return scriptTable(block.header, block.rows);
    case 'strategyTable':
      return strategyTable(block.header, block.groups);
  }
}

/** A tab = its Title paragraph at the TOP of its own page run + its blocks;
 *  tabs 1 and 2 close with a nextPage section break so the next tab starts
 *  on a fresh page (the Google Docs export put the break ON the title, which
 *  leaves every title alone on a page — a reader wants title + content). */
function renderTab(tab: UgcDocTab, last: boolean): string {
  const titleIdx = tab.blocks.findIndex((b) => b.kind === 'title');
  const titleText = titleIdx === -1 ? tab.title : (tab.blocks[titleIdx] as { text: string }).text;
  const rest = titleIdx === -1 ? tab.blocks : tab.blocks.filter((_, i) => i !== titleIdx);
  const body = rest.map(renderBlock).join('');
  return titleParagraph(titleText, null) + body + (last ? normalParagraph('') : sectionEndParagraph());
}

/** The complete `word/document.xml` — pure and deterministic. */
export function buildUgcDocumentXml(doc: UgcDocument): string {
  const tabs = doc.tabs.map((tab, i) => renderTab(tab, i === doc.tabs.length - 1)).join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `${DOCUMENT_OPEN}<w:background w:color="FFFFFF"/><w:body>${tabs}${sectPr(false)}</w:body></w:document>`
  );
}

/** The .docx: the example's package parts verbatim + the generated document part. */
export async function buildUgcDocxBlob(doc: UgcDocument): Promise<Blob> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', buildUgcDocumentXml(doc));
  zip.file('word/_rels/document.xml.rels', documentRelsXml);
  zip.file('word/styles.xml', stylesXml);
  zip.file('word/numbering.xml', numberingXml);
  zip.file('word/settings.xml', settingsXml);
  zip.file('word/fontTable.xml', fontTableXml);
  zip.file('word/theme/theme1.xml', themeXml);
  return zip.generateAsync({ type: 'blob', mimeType: UGC_DOCX_MIME, compression: 'DEFLATE' });
}
