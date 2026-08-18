#!/usr/bin/env node
/**
 * V2 UGC prompt snapshot — the zero-diff guarantee for the ecom expansion.
 *
 * Assembles every UGC prompt surface (context packs, brainstorm, writer,
 * regen, final review) for FIXED reference tasks and hashes each section.
 * The committed baseline (v2-prompt-baseline.json) is the contract: after
 * any ecom-expansion phase, `--check` must pass with zero mismatches,
 * proving the UGC pipeline's assembled prompts are byte-identical.
 *
 *   node scripts/snapshot-v2-prompts.mjs --write-baseline   # (re)establish
 *   node scripts/snapshot-v2-prompts.mjs --check            # verify zero-diff
 *
 * On mismatch, full prompt text for both runs is written next to the repo
 * (v2-prompt-snapshot.txt) so the drift is diffable line-by-line.
 * Uses esbuild (already a Vite dependency) with a ?raw plugin so the
 * marketing-brain markdown imports resolve exactly as Vite resolves them.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(ROOT, 'scripts', 'v2-prompt-baseline.json');
const DUMP = join(ROOT, 'v2-prompt-snapshot.txt'); // gitignored working artifact

const rawPlugin = {
  name: 'vite-raw',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-text',
    }));
    b.onLoad({ filter: /.*/, namespace: 'raw-text' }, (args) => ({
      contents: readFileSync(args.path, 'utf8'),
      loader: 'text',
    }));
  },
};

// The snapshot entry: constructs deterministic reference tasks/briefs and
// returns { sectionName: promptText }. Everything is fixed — no Date.now,
// no randomness — so hashes are stable across runs and machines.
const ENTRY = `
import {
  buildV2ContextPack,
  buildBrainstormPrompt,
  buildBriefWritePrompt,
  buildRegenPrompt,
  buildFinalReviewPrompt,
} from '${ROOT.replace(/\\/g, '/')}/src/factory2/v2Prompts';

const mkTask = (over = {}) => ({
  parsed: { name: 'SNAPSHOT-TASK', rawText: 'snapshot', product: 'Ankle Compression Socks' },
  product: 'Ankle Compression',
  awarenessLevel: 'Problem Aware',
  talkingPoint: 'Deep sock marks at the end of the day',
  duration: '16-59 sec',
  ugcStyle: 'ugc_yap',
  ...over,
});

const yapPA = mkTask();
const povUnaware = mkTask({ awarenessLevel: 'Unaware', ugcStyle: 'ugc_pov', duration: '1-15 sec' });
const listMA = mkTask({ awarenessLevel: 'Most Aware', ugcStyle: 'ugc_list', duration: '60-90 sec', pinnedInspirationId: 'insp_snapshot_fixed' });

const row = (n, line, mirrors) => ({
  id: 'row_' + n,
  clipNumber: n,
  audioType: 'F2C',
  role: n === 1 ? 'hook' : n === 4 ? 'cta' : 'body',
  scriptLine: line,
  shotType: 'Talk to Camera',
  shotDescription: 'Snapshot shot description ' + n + ' — camera at counter height, coach the performance.',
  editorNotes: '',
  reference: { kind: 'none', reason: 'snapshot fixture' },
  mirrorsLineId: mirrors,
});

const brief = {
  id: 'brief_snapshot',
  taskName: 'SNAPSHOT-TASK',
  task: yapPA,
  header: {
    concept: 'Snapshot concept',
    angle: 'Deep sock marks at the end of the day',
    awarenessLevel: 'Problem Aware',
    videoTonality: 'Empathetic to relieved',
    attire: 'Casual home wear',
    instructions: ['Film in natural light', 'Keep HDR off'],
  },
  framework: { name: 'PAS', rationale: 'Snapshot rationale' },
  concept: {
    id: 'concept_snapshot',
    title: 'Snapshot concept',
    summary: 'A fixed concept summary used only for prompt snapshotting.',
    productEntry: 'earned entry',
    productTruth: 'No dig-in when sized right',
    openingDetails: 'The 6pm shoe-off moment at the door',
  },
  hooks: [
    { id: 'hook_1', text: 'Snapshot hook one about the 6pm shoe-off.' },
    { id: 'hook_2', text: 'Snapshot hook two, a different shape.' },
  ],
  ctas: [
    { id: 'cta_1', text: 'Snapshot CTA one.' },
    { id: 'cta_2', text: 'Snapshot CTA two.' },
  ],
  scriptProse: 'Snapshot prose: the whole script as one continuous read.',
  storyboard: [
    row(1, 'Snapshot hook one about the 6pm shoe-off.', 'hook_1'),
    row(2, 'Snapshot body line two that hands the baton.'),
    row(3, 'Snapshot body line three that receives it.'),
    row(4, 'Snapshot CTA one.', 'cta_1'),
  ],
  feedbackLedger: [{ target: 'clip 2 script', feedback: 'Snapshot ledger entry — keep it concrete.' }],
  rippleFlags: [],
  batchInstructions: undefined,
  version: 3,
  createdAt: '2026-08-17T00:00:00.000Z',
  updatedAt: '2026-08-17T00:00:00.000Z',
};

const PIN_MARKER = '## PINNED EXEMPLAR — THE STRUCTURAL AUTHORITY for this task\\n(snapshot fixture block)';
const j = (p) => p.system + '\\n════ USER ════\\n' + p.user;

export const sections = {
  ctx_concept_yapPA: buildV2ContextPack(yapPA, 'concept'),
  ctx_script_yapPA: buildV2ContextPack(yapPA, 'script'),
  ctx_script_povUnaware: buildV2ContextPack(povUnaware, 'script'),
  ctx_script_listMA_pinned: buildV2ContextPack(listMA, 'script'),
  brainstorm: j(buildBrainstormPrompt([yapPA, povUnaware, listMA], 'Snapshot inspiration summary.', 'Snapshot batch instructions naming Labor Day.')),
  write_yapPA_unpinned: j(buildBriefWritePrompt(yapPA, brief.concept, brief.framework, 'Snapshot direction.', '', 'Snapshot batch instructions naming Labor Day.')),
  write_listMA_pinned: j(buildBriefWritePrompt(listMA, brief.concept, brief.framework, 'Snapshot direction.', PIN_MARKER, undefined)),
  regen_row_script: j(buildRegenPrompt(yapPA, brief, { type: 'row-script', rowId: 'row_2' }, 'Make it more concrete.')),
  final_review: j(buildFinalReviewPrompt(brief)),
};
`;

const tmp = mkdtempSync(join(tmpdir(), 'v2snap-'));
const outfile = join(tmp, 'snapshot.mjs');
try {
  await build({
    stdin: { contents: ENTRY, resolveDir: ROOT, loader: 'ts', sourcefile: 'snapshot-entry.ts' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
    plugins: [rawPlugin],
    logLevel: 'silent',
  });
  const { sections } = await import(pathToFileURL(outfile).href);

  const hashes = {};
  let dump = '';
  for (const [name, text] of Object.entries(sections)) {
    hashes[name] = { sha256: createHash('sha256').update(text).digest('hex'), bytes: text.length };
    dump += `\n\n████████████████ ${name} (${text.length} bytes) ████████████████\n\n${text}`;
  }
  writeFileSync(DUMP, dump.trimStart());

  const mode = process.argv[2] ?? '--check';
  if (mode === '--write-baseline') {
    writeFileSync(BASELINE, JSON.stringify({ writtenAt: 'ecom-expansion phase 0', sections: hashes }, null, 2));
    console.log(`baseline written: ${Object.keys(hashes).length} sections`);
    for (const [n, h] of Object.entries(hashes)) console.log(`  ${n.padEnd(26)} ${h.bytes.toString().padStart(7)}B  ${h.sha256.slice(0, 16)}`);
  } else {
    const base = JSON.parse(readFileSync(BASELINE, 'utf8')).sections;
    let bad = 0;
    for (const [n, h] of Object.entries(hashes)) {
      const b = base[n];
      const ok = b && b.sha256 === h.sha256;
      if (!ok) bad++;
      console.log(`  ${ok ? 'OK  ' : 'DIFF'} ${n.padEnd(26)} ${h.bytes}B${ok ? '' : b ? ` (baseline ${b.bytes}B)` : ' (missing from baseline)'}`);
    }
    for (const n of Object.keys(base)) if (!(n in hashes)) { bad++; console.log(`  GONE ${n}`); }
    if (bad) {
      console.error(`\nZERO-DIFF VIOLATION: ${bad} section(s) drifted. Full text in v2-prompt-snapshot.txt — diff it against a stash of the baseline run.`);
      process.exit(1);
    }
    console.log('\nzero-diff: UGC prompt output is byte-identical to baseline.');
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
