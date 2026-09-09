#!/usr/bin/env node
/**
 * Renders `exampleUgcDocument()` through the real `src/factory2/ugcDocx.ts`
 * (esbuild-bundled, `?raw` template parts inlined) and verifies the result
 * against the ground truth `src/factory2/docxTemplate/EXAMPLE-UGC-brief.docx`:
 *
 *   (a) text diff — paragraph texts of both document.xml parts, whitespace-
 *       normalized (the example's "BRIEF INFo" typo is normalized away),
 *   (b) OOXML validation — the docx skill's validate.py with --original,
 *   (c) PDF render of BOTH files via LibreOffice + page JPEGs (pdftoppm) for
 *       a side-by-side visual comparison.
 *
 *   PATH="$HOME/local/node/bin:$PATH" node scripts/render-ugc-docx.mjs
 *
 * Output lands in scratch-out/ (git-ignored by its own .gitignore):
 *   example-render.docx, render/example-N.jpg, render/ours-N.jpg
 *
 * Needs: LibreOffice.app, pdftoppm (poppler), and a Python >= 3.10 with
 * lxml + defusedxml (or `uv`, which provisions one on the fly). Override the
 * interpreter with PYTHON=... and the skill scripts dir with DOCX_SKILL_SCRIPTS=...
 */
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const JSZip = require('jszip');

const EXAMPLE = path.join(ROOT, 'src/factory2/docxTemplate/EXAMPLE-UGC-brief.docx');
const OUT_DIR = path.join(ROOT, 'scratch-out');
const OUT_DOCX = path.join(OUT_DIR, 'example-render.docx');
const RENDER_DIR = path.join(OUT_DIR, 'render');
const SKILL_SCRIPTS =
  process.env.DOCX_SKILL_SCRIPTS ??
  path.join(
    homedir(),
    'Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/b1547028-59a7-4a0d-9562-25bc6348d011/0141dcc9-8bf1-450f-819f-aab2f29e1926/skills/docx/scripts',
  );
const VALIDATE_PY = path.join(SKILL_SCRIPTS, 'office/validate.py');
const SOFFICE_PY = path.join(SKILL_SCRIPTS, 'office/soffice.py');
const LIBREOFFICE_BIN = '/Applications/LibreOffice.app/Contents/MacOS';

let failed = false;
const section = (t) => console.log(`\n══ ${t} ${'═'.repeat(Math.max(0, 70 - t.length))}`);

// ── 1. Bundle + render ──────────────────────────────────────────────────────
mkdirSync(RENDER_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, '.gitignore'), '*\n');

const rawPlugin = {
  name: 'raw-suffix',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'rawfile',
    }));
    b.onLoad({ filter: /.*/, namespace: 'rawfile' }, (args) => ({
      contents: readFileSync(args.path, 'utf8'),
      loader: 'text',
    }));
  },
};

const ENTRY = `
export { buildUgcDocxBlob, buildUgcDocumentXml } from './src/factory2/ugcDocx';
export { exampleUgcDocument } from './src/factory2/ugcDocModel';
`;
const tmp = mkdtempSync(path.join(tmpdir(), 'ugcdocx-'));
const outfile = path.join(tmp, 'entry.cjs');
await build({
  stdin: { contents: ENTRY, resolveDir: ROOT, loader: 'ts' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  plugins: [rawPlugin],
  logLevel: 'silent',
});
const { buildUgcDocxBlob, buildUgcDocumentXml, exampleUgcDocument } = require(outfile);

section('RENDER');
const doc = exampleUgcDocument();
const xml1 = buildUgcDocumentXml(doc);
const xml2 = buildUgcDocumentXml(exampleUgcDocument());
console.log(`buildUgcDocumentXml deterministic: ${xml1 === xml2 ? 'yes' : 'NO'} (${xml1.length} chars)`);
if (xml1 !== xml2) failed = true;
const blob = await buildUgcDocxBlob(doc);
const buf = Buffer.from(await blob.arrayBuffer());
writeFileSync(OUT_DOCX, buf);
console.log(`wrote ${path.relative(ROOT, OUT_DOCX)} (${buf.length} bytes, type ${blob.type})`);

// ── 2. Text diff ────────────────────────────────────────────────────────────
section('TEXT DIFF (example → ours)');

function unescapeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
async function paragraphTexts(docxBuffer) {
  const zip = await JSZip.loadAsync(docxBuffer);
  const xml = await zip.file('word/document.xml').async('string');
  const paras = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
  return paras
    .map((p) => (p.match(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g) ?? []).map((t) => unescapeXml(t.replace(/^<w:t[^>]*>/, '').replace(/<\/w:t>$/, ''))).join(''))
    .map((t) => t.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
function lcsDiff(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push(['=', a[i]]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push(['-', a[i++]]);
    else ops.push(['+', b[j++]]);
  }
  while (i < n) ops.push(['-', a[i++]]);
  while (j < m) ops.push(['+', b[j++]]);
  return ops;
}
const exampleTexts = (await paragraphTexts(readFileSync(EXAMPLE))).map((t) => t.replace(/^BRIEF INFo$/, 'BRIEF INFO'));
const ourTexts = await paragraphTexts(buf);
const ops = lcsDiff(exampleTexts, ourTexts);
const same = ops.filter((o) => o[0] === '=').length;
const changed = ops.filter((o) => o[0] !== '=');
console.log(`${exampleTexts.length} example paragraphs / ${ourTexts.length} ours — ${same} identical, ${changed.length} differing`);
for (const [op, t] of changed) console.log(`  ${op} ${t.length > 140 ? t.slice(0, 140) + '…' : t}`);
if (!changed.length) console.log('  (identical)');

// ── 3. Validate ─────────────────────────────────────────────────────────────
section('VALIDATE');

function findPython() {
  const probe = 'import sys; assert sys.version_info >= (3, 10); import lxml, defusedxml';
  const candidates = [process.env.PYTHON, 'python3', '/opt/homebrew/bin/python3.13', '/opt/homebrew/bin/python3', 'python'].filter(Boolean);
  for (const p of candidates) {
    const r = spawnSync(p, ['-c', probe], { encoding: 'utf8' });
    if (r.status === 0) return [p];
  }
  for (const uv of ['uv', path.join(homedir(), '.local/bin/uv')]) {
    const r = spawnSync(uv, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return [uv, 'run', '--python', '3.13', '--with', 'lxml', '--with', 'defusedxml', 'python'];
  }
  return null;
}
const python = findPython();
if (!python) {
  console.log('no Python >= 3.10 with lxml + defusedxml found (and no uv) — skipping validation');
  failed = true;
} else if (!existsSync(VALIDATE_PY)) {
  console.log(`validate.py not found at ${VALIDATE_PY} — set DOCX_SKILL_SCRIPTS`);
  failed = true;
} else {
  console.log(`python: ${python.join(' ')}`);
  const r = spawnSync(python[0], [...python.slice(1), VALIDATE_PY, OUT_DOCX, '--original', EXAMPLE], { encoding: 'utf8', cwd: ROOT });
  process.stdout.write((r.stdout ?? '') + (r.stderr ?? ''));
  console.log(`validator exit code: ${r.status}`);
  if (r.status !== 0) failed = true;
}

// ── 4. PDF + page images ────────────────────────────────────────────────────
section('PDF RENDER');

const env = { ...process.env };
if (existsSync(LIBREOFFICE_BIN) && spawnSync('which', ['soffice']).status !== 0) env.PATH = `${LIBREOFFICE_BIN}:${env.PATH}`;
const exampleCopy = path.join(RENDER_DIR, 'example.docx');
const oursCopy = path.join(RENDER_DIR, 'ours.docx');
copyFileSync(EXAMPLE, exampleCopy);
copyFileSync(OUT_DOCX, oursCopy);
for (const f of readdirSync(RENDER_DIR)) if (/\.(pdf|jpg)$/.test(f)) rmSync(path.join(RENDER_DIR, f));

function toPdf(file) {
  if (python && existsSync(SOFFICE_PY)) {
    const r = spawnSync(python[0], [...python.slice(1), SOFFICE_PY, '--headless', '--convert-to', 'pdf', '--outdir', RENDER_DIR, file], { encoding: 'utf8', env, cwd: RENDER_DIR });
    if (r.status === 0 && existsSync(file.replace(/\.docx$/, '.pdf'))) return true;
    process.stdout.write((r.stdout ?? '') + (r.stderr ?? ''));
  }
  const soffice = existsSync(path.join(LIBREOFFICE_BIN, 'soffice')) ? path.join(LIBREOFFICE_BIN, 'soffice') : 'soffice';
  const profile = mkdtempSync(path.join(tmpdir(), 'lo-profile-'));
  const r = spawnSync(soffice, [`-env:UserInstallation=file://${profile}`, '--headless', '--norestore', '--convert-to', 'pdf', '--outdir', RENDER_DIR, file], { encoding: 'utf8', env, cwd: RENDER_DIR });
  if (r.status !== 0) process.stdout.write((r.stdout ?? '') + (r.stderr ?? ''));
  return existsSync(file.replace(/\.docx$/, '.pdf'));
}
function pageCount(pdf) {
  const r = spawnSync('pdfinfo', [pdf], { encoding: 'utf8' });
  return r.status === 0 ? (r.stdout.match(/Pages:\s+(\d+)/) ?? [])[1] : '?';
}
for (const [name, file] of [['example', exampleCopy], ['ours', oursCopy]]) {
  const ok = toPdf(file);
  if (!ok) { console.log(`${name}: PDF conversion FAILED`); failed = true; continue; }
  const pdf = file.replace(/\.docx$/, '.pdf');
  const r = spawnSync('pdftoppm', ['-jpeg', '-r', '80', pdf, path.join(RENDER_DIR, name)], { encoding: 'utf8' });
  if (r.status !== 0) { console.log(`${name}: pdftoppm failed — ${r.stderr}`); failed = true; continue; }
  console.log(`${name}: ${pageCount(pdf)} pages → ${path.relative(ROOT, RENDER_DIR)}/${name}-N.jpg`);
}

section('SUMMARY');
console.log(failed ? 'FAILED — see above' : 'OK — now compare render/example-N.jpg with render/ours-N.jpg page by page');
process.exit(failed ? 1 : 0);
