#!/usr/bin/env node
/**
 * Factory V2 ECOM smoke harness — asserts the composed prompt surfaces carry
 * what the current doctrine says they carry, and NOT what was removed.
 *
 * Lives in the repo (its predecessor lived in a session scratchpad and was
 * lost to tmp cleanup — never again). Run after any prompt/engine change:
 *
 *   PATH="$HOME/local/node/bin:$PATH" node scripts/smoke-v2-ecom.mjs
 *
 * It esbuild-bundles the real prompt builders (with a ?raw plugin for the
 * marketing-brain markdown imports), generates every major surface for the
 * three ecom production modes + UGC, and runs marker checks. The UGC surface
 * has its own byte-exact guard (snapshot-v2-prompts.mjs) — here UGC is only
 * checked for "ecom-only changes did not leak in".
 */
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const ENTRY = `
import {
  buildV2ContextPack,
  buildConceptsPrompt,
  buildBriefWritePrompt,
  buildFinalReviewPrompt,
  buildRegenPrompt,
  buildBrainstormPrompt,
  buildDirectionSynthesisPrompt,
} from './src/factory2/v2Prompts';
import { ECOM_FRAMEWORKS } from './src/factory2/v2Types';

const parsed: any = {
  name: 'Smoke Task', product: 'EasyStretch', adType: 'Ecom Style',
  talkingPoint: 'diabetic swelling', duration: '60-90 sec', status: 'Planning',
};
const base: any = {
  parsed, product: 'EasyStretch', talkingPoint: 'diabetic swelling',
  awarenessLevel: 'Problem Aware', adType: 'ecom', ugcStyle: 'ugc_yap', duration: '60-90 sec',
};
const libTask: any = { ...base };
const lifeTask: any = { ...base, ecomProduction: 'ai-lifestyle' };
const animTask: any = { ...base, ecomProduction: 'ai-animation' };
const unawareTask: any = { ...base, awarenessLevel: 'Unaware' };
const ugcTask: any = { ...base, adType: 'ugc', duration: '16-59 sec' };
const ugcUnaware: any = { ...ugcTask, awarenessLevel: 'Unaware' };

const concept: any = {
  title: 'Smoke Concept',
  summary: 'A nurse of thirty years explains the ring.',
  productEntry: 'earned-entry',
  productTruth: 'no elastic band anywhere; stretches to 30 inches',
  openingDetails: 'kitchen at 7am; her thumb tracing a red ring on her calf',
  verification: 'grounded in recorded sock-mark pain; concrete opening details',
};
const fw: any = { name: ECOM_FRAMEWORKS[0], rationale: 'smoke' };

function mkBrief(task: any, casting?: string): any {
  const hook = (i: number) => ({ id: 'h' + i, text: 'Hook ' + i + ' about swollen evening ankles.' });
  const cta = (i: number) => ({ id: 'c' + i, text: 'CTA ' + i + ': Buy 2 Get 3 Free — five pairs for sixty dollars.' });
  const row = (n: number, role: string, mirrors?: string): any => ({
    id: 'r' + n, clipNumber: n, audioType: 'VO', role,
    scriptLine: 'Line ' + n + ' of the spoken argument.',
    shotType: 'Talking Head', shotDescription: 'She speaks to camera at her kitchen table.',
    reference: { kind: 'none', reason: 'smoke' }, editorNotes: '', overlayText: 'swollen by 5pm',
    ...(mirrors ? { mirrorsLineId: mirrors } : {}),
  });
  return {
    id: 'brief_smoke', taskName: 'Smoke Task', task,
    header: {
      concept: 'Smoke Concept', angle: 'the ring is the evidence', awarenessLevel: task.awarenessLevel,
      videoTonality: 'calm testimony to vindicated turn', attire: '', instructions: ['keep it warm'],
      ecomEditing: {
        pacing: 'measured', music: 'warm', transitions: 'clean cuts', specialNotes: 'the ring is the through-line',
        ...(casting ? { casting } : {}),
      },
    },
    framework: fw, concept,
    hooks: [hook(1), hook(2), hook(3), hook(4)],
    ctas: [cta(1), cta(2)],
    scriptProse: 'Hook 1 about swollen evening ankles. Line 2 of the spoken argument. CTA 1: Buy 2 Get 3 Free — five pairs for sixty dollars.',
    storyboard: [row(1, 'hook', 'h1'), row(2, 'body'), row(3, 'cta', 'c1')],
    feedbackLedger: [], rippleFlags: [], version: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

const out: Record<string, string> = {};
out.packLib = buildV2ContextPack(libTask, 'script');
out.packLife = buildV2ContextPack(lifeTask, 'script');
out.packAnim = buildV2ContextPack(animTask, 'script');
out.packUnaware = buildV2ContextPack(unawareTask, 'script');
out.packUgc = buildV2ContextPack(ugcTask, 'script');
out.conceptsLib = buildConceptsPrompt(libTask, 'dir', '').system;
out.conceptsUnaware = buildConceptsPrompt(unawareTask, 'dir', '').system;
out.conceptsUgc = buildConceptsPrompt(ugcTask, 'dir', '').system;
out.conceptsUgcUnaware = buildConceptsPrompt(ugcUnaware, 'dir', '').system;
const REMAKE_CTX = '## REMAKE SOURCE — THE GOVERNING EXAMPLE for this task\\nsmoke remake source dissection';
const remakeTask: any = { ...base, pinnedInspirationId: 'smoke-pin', exemplarRole: 'remake' };
const refTask: any = { ...base, pinnedInspirationId: 'smoke-pin', exemplarRole: 'reference' };
const pinNoRole: any = { ...base, pinnedInspirationId: 'smoke-pin' };
out.packPinDefault = buildV2ContextPack(pinNoRole, 'script');
const revRemake = buildFinalReviewPrompt(mkBrief(remakeTask), REMAKE_CTX);
out.reviewRemake = revRemake.system; out.reviewRemakeUser = revRemake.user;
out.brainstormDigestsUser = buildBrainstormPrompt([libTask], 'bank', '', { 'Smoke Task': 'DIGEST-MARKER summary of the pinned ad' }).user;
out.brainstormNoDigestsUser = buildBrainstormPrompt([libTask], 'bank', '').user;
out.directionDigestsUser = buildDirectionSynthesisPrompt([libTask], { analysis: 'a', questions: [], answers: {} } as any, '', { 'Smoke Task': 'DIGEST-MARKER' }).user;
out.packRemake = buildV2ContextPack(remakeTask, 'script');
out.packRef = buildV2ContextPack(refTask, 'script');
out.conceptsRemake = buildConceptsPrompt(remakeTask, 'dir', REMAKE_CTX).system;
out.writeRemake = buildBriefWritePrompt(remakeTask, concept, fw, 'dir', REMAKE_CTX).system;
out.writeLib = buildBriefWritePrompt(libTask, concept, fw, 'dir', '').system;
out.brainstormEcom = buildBrainstormPrompt([libTask, unawareTask], 'bank', '').system;
out.brainstormUgc = buildBrainstormPrompt([ugcTask], 'bank', '').system;
const bsStub: any = { analysis: 'a', questions: [], answers: {} };
out.directionEcom = buildDirectionSynthesisPrompt([libTask], bsStub, '').system;
out.directionUgc = buildDirectionSynthesisPrompt([ugcTask], bsStub, '').system;
out.writeLife = buildBriefWritePrompt(lifeTask, concept, fw, 'dir', '').system;
out.writeUnaware = buildBriefWritePrompt(unawareTask, concept, fw, 'dir', '').system;
out.writeUgc = buildBriefWritePrompt(ugcTask, concept, fw, 'dir', '').system;
const revLib = buildFinalReviewPrompt(mkBrief(libTask));
out.reviewLib = revLib.system; out.reviewLibUser = revLib.user;
out.reviewUgc = buildFinalReviewPrompt(mkBrief(ugcTask)).system;
const noted: any = mkBrief(libTask); noted.writerNotes = { plan: 'PLAN-MARKER', selfReview: 'SELFREVIEW-MARKER' };
out.reviewNotesUser = buildFinalReviewPrompt(noted).user;
const notedUgc: any = mkBrief(ugcTask); notedUgc.writerNotes = { plan: 'PLAN-MARKER' };
out.reviewNotedUgcUser = buildFinalReviewPrompt(notedUgc).user;
// UGC three-tab creator document (Sep 2026)
const docBrief: any = mkBrief(ugcTask);
docBrief.creatorDoc = { briefInfo: { collection: 'EasyStretch', socks: 'SOCKS-MARKER', format: 'f', creatorRequirement: 'REQ-MARKER', creatorNote: ['n1', 'n2'] }, scriptNote: 'SCRIPTNOTE-MARKER', beforeYouSubmit: ['b1', 'b2'], strategy: { awarenessLevel: 'a', primaryEmotion: 'e', avatar: 'AVATAR-MARKER', hypothesis: 'h', coreCreativeIdea: 'c', production: { format: 'f', creator: 'c', props: 'p', locations: 'l' }, editing: { pacing: 'p', graphics: 'g', audio: 'a' } } };
out.regenDocField = buildRegenPrompt(ugcTask, docBrief, { type: 'doc-field', path: 'beforeYouSubmit' }, 'tighter').system;
out.regenDocFieldUser = buildRegenPrompt(ugcTask, docBrief, { type: 'doc-field', path: 'briefInfo.creatorRequirement' }, 'tighter').user;
out.reviewUgcDocUser = buildFinalReviewPrompt(docBrief).user;
out.reworkLife = buildRegenPrompt(lifeTask, mkBrief(lifeTask, 'a warm nurse in her 60s'), { type: 'story-rework' } as any, 'the story is not right').system;
console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, String(v)]))));
`;

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

const tmp = mkdtempSync(path.join(tmpdir(), 'v2smoke-'));
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

// The entry logs one JSON line; capture it by intercepting console.log.
let captured = '';
const origLog = console.log;
console.log = (s) => { captured = s; };
require(outfile);
console.log = origLog;
const out = JSON.parse(captured);

const checks = [
  // ── The taste file (Sep 2026): writer calibration, ecom-only ──
  ['taste file in all three ecom packs', ['packLib', 'packLife', 'packAnim'].every((k) => out[k].includes('HOW THE REVIEWER THINKS'))],
  ['taste file carries the 17th move', out.packLib.includes('MOVE 17')],
  ['taste file verbatim anchors', out.packLib.includes('OK but heal from what?') && out.packLib.includes('Why would anybody care to watch this?')],
  ['taste file NOT in UGC pack', !out.packUgc.includes('HOW THE REVIEWER THINKS')],
  // ── The awareness core replaces the old stack (ecom only) ──
  ['awareness core present (PA)', out.packLib.includes('THE AWARENESS CORE (ecom') && out.packLib.includes('PROBLEM AWARE: she knows the pain')],
  ['awareness core present (Unaware)', out.packUnaware.includes('only LABELS wait')],
  ['TOF-is-not-vague ruling in core', out.packLib.includes('describes the AUDIENCE we target')],
  ['old awareness guide gone from ecom pack', !out.packLib.includes('INFORMATION-RELEASE GATES') && !out.packUnaware.includes('Three Elimination Rules')],
  ['Schwartz state block gone from ecom pack', !out.packLib.includes('SCHWARTZ STATE DOCTRINE')],
  ['UGC pack keeps awareness guide + Schwartz', out.packUgc.includes('SCHWARTZ STATE DOCTRINE')],
  // ── Zones / minimums / two clocks removed ──
  ['TWO CLOCKS gone from ecom pack', !out.packLib.includes('TWO CLOCKS')],
  ['entry-zone percentages gone', !out.packLib.includes('~30-45% zone') && !out.conceptsLib.includes('~30-45% zone')],
  ['airtime minimums gone', !out.packLib.includes('Unaware ≥15%') && !out.writeLib.includes("this level's minimum")],
  ['proportion law governs entry', out.packLib.includes('THE ARGUMENT decides when the product enters')],
  ['payoff arc four stations kept', out.packLib.includes('THE PRODUCT PAYOFF ARC') && out.packLib.includes('PAYOFF LINE')],
  // ── Doctrine spine intact (never lost) ──
  ['sales argument doctrine present', out.packLib.includes('THE SALES ARGUMENT DOCTRINE')],
  ['claim boundary present', out.packLib.includes('CLAIM BOUNDARY')],
  ['pain bank present', out.packLib.includes('THE PAIN BANK')],
  ['craft DNA present (verbatim-VO)', out.packLib.includes('VERBATIM-TO-VO')],
  ['production law per mode', out.packLife.includes('AI LIFESTYLE PRODUCTION — THE VISUAL LAW') && out.packAnim.includes('AI ANIMATION PRODUCTION — THE VISUAL LAW') && out.packLib.includes('THE FOOTAGE LIBRARY — THE VISUAL CLAIM BOUNDARY')],
  ['earning probe still writer-side', out.writeLib.includes('from what? so what?')],
  // ── Craft DNA recalibrations ──
  ['believability outranks extremity', out.packLib.includes('BELIEVABILITY OUTRANKS EXTREMITY')],
  ['L3-L4 quota gone (craft DNA AND pain-bank ladders)', !out.packLib.includes('must sit at L3-L4') && !out.packLib.includes('center of gravity at L3-L4')],
  ['knife-beat quota gone', !out.packLib.includes('2-3 ESCALATION BEATS')],
  ['thesis-echo mandate gone everywhere', !out.packLib.includes('The thesis echo is the last word') && !out.packLib.includes('thesis echo lands as the final word') && !out.writeLib.includes('a THESIS ECHO that reframes') && !out.reviewLib.includes('thesis echo lands as the final word')],
  ['seam rule kept', out.packLib.includes('THE SEAM RULE')],
  ['shared rhythm-arc fingerprint gone', !out.packLib.includes('provocation → escalating frustration')],
  // ── Authority playbook slimmed ──
  ['six modes now a menu', out.packLib.includes('a menu of proven shapes')],
  ['skeleton percentages gone', !out.packLib.includes('0-5%: credential')],
  ['essentiality test kept', out.packLib.includes('ESSENTIALITY TEST')],
  // ── Writer plan diet ──
  ['argumentMap still first', out.writeLib.includes('"argumentMap": "FIRST.')],
  ['kept gates present (now in selfReview)', ['"proportionCheck"', '"objectionsCheck"', '"payoffCheck"', '"flowCheck"', '"ctaOfferCheck"', '"fingerprintCheck"'].every((g) => out.writeLib.includes(g)) && out.writeLib.includes('"selfReview"')],
  ['think → write → review order', out.writeLib.indexOf('"argumentMap": "FIRST.') < out.writeLib.indexOf('"scriptProse": "WRITE THE SCRIPT NOW') && out.writeLib.indexOf('"scriptProse": "WRITE THE SCRIPT NOW') < out.writeLib.indexOf('"selfReview": {')],
  ['dropped gates absent (ecom)', ['"stakesCheck"', '"hookHandoffCheck"', '"tenSecondCheck"', '"authorityCheck"', '"productEntryCheck"', '"payoffArc"'].every((g) => !out.writeLib.includes(g))],
  ['UGC write keeps its own gates', out.writeUgc.includes('"tenSecondCheck"') && out.writeUgc.includes('"hookFlowCheck"')],
  ['casting/animation checks kept in AI modes', out.writeLife.includes('"castingCheck"')],
  // ── CTA policy ──
  ['Unaware CTA carries the offer', out.writeUnaware.includes('carrying THE OFFER stated plainly (Buy 2 Get 3 Free')],
  ['non-Unaware CTA: echo optional', out.writeLib.includes('a thesis echo is one proven close, not a requirement')],
  // ── Concepts prompt ──
  ['ecom concepts demand different ARGUMENTS', out.conceptsLib.includes('SALES ARGUMENTS') && out.conceptsLib.includes('at most ONE through-line device')],
  ['seven questions gate kept', out.conceptsLib.includes('THE SEVEN CONCEPT QUESTIONS')],
  ['batch thesis-diversity gate kept', out.conceptsLib.includes('DIFFERENT SALES ARGUMENT')],
  ['ecom Unaware concepts: symptom legal, sub-persona machinery gone', out.conceptsUnaware.includes('SYMPTOMS (always legal)') && !out.conceptsUnaware.includes('Normalizer / Diagnosed Non-Searcher')],
  ['UGC Unaware concepts unchanged', out.conceptsUgcUnaware.includes('Normalizer / Diagnosed Non-Searcher')],
  ['UGC concepts wording unchanged', out.conceptsUgc.includes('different emotional worlds')],
  // ── Review (critic) untouched: keeps the full net ──
  ['CMO protocol intact in review', out.reviewLib.includes('THE CMO REVIEW PROTOCOL') && out.reviewLib.includes('CHECKPOINT 13')],
  ['review classes 17-24 intact', out.reviewLib.includes('17. ARGUMENT INCOHERENCE') && out.reviewLib.includes('24. NARRATOR-WORLD HOOK')],
  ['review verdict tiers intact', out.reviewLib.includes('"verdict": "approvable" | "revision" | "unfit"')],
  ['UGC review untouched (no protocol/verdict)', !out.reviewUgc.includes('THE CMO REVIEW PROTOCOL') && !out.reviewUgc.includes('"verdict"')],
  // ── Rework path alive ──
  ['story-rework prompt intact', out.reworkLife.includes('REWORKING THE WHOLE STORY')],
  // ── Remake mode (Sep 2026) ──
  ['remake pack: example governs', out.packRemake.includes('🎬 REMAKE MODE')],
  ['pinned-reference pack keeps the classic exception', out.packRef.includes('PINNED-EXEMPLAR EXCEPTION') && !out.packRef.includes('🎬 REMAKE MODE')],
  ['unpinned pack has neither exemplar line', !out.packLib.includes('PINNED-EXEMPLAR EXCEPTION') && !out.packLib.includes('🎬 REMAKE MODE')],
  ['remake concepts = faithful adaptation + narrow variants', out.conceptsRemake.includes('FAITHFUL adaptation') && out.conceptsRemake.includes('never a different product truth') && !out.conceptsRemake.includes('ADAPTATIONS of that example')],
  ['remake concepts replace gate 8', out.conceptsRemake.includes('Gate 8 is replaced for remakes')],
  ['remake writer gets remakeFidelity gate', out.writeRemake.includes('"remakeFidelity"') && out.writeRemake.includes('THIS BRIEF IS A REMAKE')],
  ['non-remake writer has no remakeFidelity field', !out.writeLib.includes('"remakeFidelity"')],
  // ── Coherence-review fixes (Sep 2026 verification pass) ──
  ['amputation ruling renders clean (no mid-word cut)', !out.packLib.includes('in their own r…') && out.packLib.includes('what customers DO say, in their own recorded')],
  ['one ceiling declared per brief', out.packLib.includes('THIS LINE IS THE ONLY CEILING')],
  ['never-transfers ban scoped to product promises', out.packLib.includes('PRODUCT-PROMISE medical chains') && out.packLib.includes('the Stakes License is OUR doctrine')],
  ['guarantee ban pre-empts every source', /pre-empts\s+EVERY source, reference, and example/.test(out.packLib)],
  ['ctaOfferCheck no longer mandates the echo', !out.writeLib.includes('missing the echo means REVISE')],
  ['censors named; preamble ranked', out.packLib.includes('THE CENSORS, by name')],
  ['framework percentage markers descoped', !out.writeLib.includes('0-20%') && !out.writeLib.includes('temporal language')],
  ['Beats 3-5 translation note at Unaware', /wait\s+until\s+the\s+release\s+order\s+opens/.test(out.packUnaware)],
  // ── Disposition-audit fixes (Opus audit, Sep 2026) ──
  ['review class 11: offer at every level incl. Unaware', out.reviewLib.includes('at ANY awareness level INCLUDING Unaware') && !out.reviewLib.includes('flag an offer that appears')],
  ['review class 11: echo absence is not a finding', out.reviewLib.includes('its absence is NOT a finding')],
  ['stale clock references gone from ecom surfaces', !out.reviewLib.includes('verbal clock') && !out.reviewLib.includes('BOTH clocks') && !out.packLife.includes('visual clock')],
  ['craft DNA law 5: offer at Unaware, echo optional', out.packLib.includes('Unaware included (CMO ruling — the release order governs') && out.packLib.includes('one proven final\n   word, not a requirement')],
  ['vocabulary-ban phrasing gone from ecom surfaces', !out.packLib.includes("awareness level's\nvocabulary/offer bans") && !out.reviewLib.includes('vocabulary/offer rules on BOTH clocks')],
  ['Stakes Engine name retired in rendered text', !out.packLib.includes("Stakes Engine's fuel")],
  ['remake pack line hedged', out.packRemake.includes('if it is absent, the pin could not be')],
  ['never the price restored', out.packLib.includes('ends the ad on the price alone')],
  // ── Audit #2 (Sep 2026): the foundation rebuild ──
  ['ecom pack opens with the ecom base, not the V1 preamble', out.packLib.includes('writing an ECOM editing brief') && !out.packLib.includes('You generate marketing outputs grounded')],
  ['V1 creative mandates gone from ecom pack', !out.packLib.includes('TRANSFORMATION METRICS') && !out.packLib.includes('ORIGINALITY MANDATE') && !out.packLib.includes('LENGTH CALIBRATION') && !out.packLib.includes('Message Hierarchy')],
  ['brand facts intact in ecom base', out.packLib.includes('Stretches up to **30 inches**') && out.packLib.includes('12-15 mmHg') && out.packLib.includes('5 pairs total for $60') && out.packLib.includes('107,993 reviews')],
  ['product-persona isolation is a named censor', out.packLib.includes('PRODUCT-PERSONA ISOLATION — NON-NEGOTIABLE') && out.packLib.includes('PRODUCT-PERSONA ISOLATION (every pain')],
  ['never-copy fence at censor rank', out.packLib.includes('THE NEVER-COPY FENCE (censor rank)')],
  ['claim-space vs argument-space resolved', out.packLib.includes('THE CLAIM SPACE AND THE ARGUMENT SPACE')],
  ['Marketing Brain gone from ecom writer', !out.writeLib.includes('GROUND EVERY SIGNIFICANT DECISION')],
  ['Marketing Brain gone from ecom concepts + brainstorm', !out.conceptsLib.includes('GROUND EVERY SIGNIFICANT DECISION') && !out.brainstormEcom.includes('GROUND EVERY SIGNIFICANT DECISION')],
  ['Marketing Brain kept for UGC only (gone from the ecom critic too)', out.writeUgc.includes('GROUND EVERY SIGNIFICANT DECISION') && out.brainstormUgc.includes('GROUND EVERY SIGNIFICANT DECISION') && out.reviewUgc.includes('GROUND EVERY SIGNIFICANT DECISION') && !out.reviewLib.includes('GROUND EVERY SIGNIFICANT DECISION') && !out.reviewRemake.includes('GROUND EVERY SIGNIFICANT DECISION')],
  ['ecom concepts carry argument fields', ['"thesis"', '"argumentChain"', '"hookLine"', '"narrator"', '"objections"', '"whyViasox"'].every((f) => out.conceptsLib.includes(f))],
  ['UGC concepts shape unchanged', !out.conceptsUgc.includes('"argumentChain"')],
  ['brainstorm ecom carries the doctrine + taste + cores', out.brainstormEcom.includes("THE ECOM STRATEGIST'S DOCTRINE") && out.brainstormEcom.includes('HOW THE REVIEWER THINKS') && out.brainstormEcom.includes('THIS TASK IS UNAWARE') && out.brainstormEcom.includes('THIS TASK IS PROBLEM AWARE')],
  ['brainstorm ecom thinks argument-first', out.brainstormEcom.includes('Think ARGUMENT-FIRST') && !out.brainstormEcom.includes('proof-device\nmonotony')],
  ['direction ecom demands per-task argument specs', out.directionEcom.includes('PER-TASK ARGUMENT\nSPEC') || out.directionEcom.includes('PER-TASK ARGUMENT SPEC')],
  ['direction UGC unchanged', out.directionUgc.includes('persona/emotion spread') && !out.directionUgc.includes('ARGUMENT SPEC')],
  ['brainstorm UGC unchanged', out.brainstormUgc.includes('UGC STYLE') && !out.brainstormUgc.includes("THE ECOM STRATEGIST'S DOCTRINE") && !out.brainstormUgc.includes('HOW THE REVIEWER THINKS')],
  ['model lines live ONCE (taste file only)', (out.packLib.match(/Start\s+with\s+one\s+pair\s+tomorrow\s+morning/g) || []).length === 1 && (out.packLib.match(/Can\s+you\s+feel\s+all\s+ten\s+of\s+your\s+toes/g) || []).length === 1],
  ['nurse-friend relay literal gone', !out.packLib.includes("my friend's a nurse") && !out.packLib.includes('until the nurse told me')],
  ['schema field examples stripped', !out.writeLib.includes("e.g. 'Frustrated investigation") && !out.writeLib.includes("e.g. 'Quick, punchy") && !out.writeLib.includes('swollen-ankle close-up')],
  ['pain bank L4 speak/never-speak resolved', !out.packLib.includes('never say it in their voice, they never did')],
  ['timeline device de-fingerprinted', !out.packLib.includes('Hour 1 / Hour 4 / Hour 8') && out.packLib.includes('a timeline that merely relabels it is the same fingerprint')],
  // ── Confirmation pass (audit #2, round 2) ──
  ['framework injected as a lens, not stages', !out.writeLib.includes('Problem (0-20%)') && out.writeLib.includes('A LENS, NOT A STRUCTURE')],
  ['plan pre-commitments present', out.writeLib.includes('"proportionPlan"') && out.writeLib.includes('"objectionsPlan"')],
  ['selfReview is an honest report', out.writeLib.includes('HONEST REPORT') && !out.writeLib.includes('go back to scriptProse')],
  ["argumentMap: approved concept wins", out.writeLib.includes("the APPROVED CONCEPT's thesis governs")],
  ['narrator field allows a sufferer', out.conceptsLib.includes('a SUFFERER telling her own story')],
  ['two honest arguments beat a strained third', out.conceptsLib.includes('emit TWO')],
  ['brainstorm ecom-only: ecom base + labeled cores + product material', out.brainstormEcom.includes('writing an ECOM editing brief') && out.brainstormEcom.includes("THIS PRODUCT'S ARGUMENT MATERIAL") && out.brainstormEcom.includes('AWARENESS CORE FOR THE UNAWARE TASKS')],
  ['direction carries the recorded pain bank + precedence', out.directionEcom.includes('THE PAIN BANK') && /approved\s+concept\s+wins/.test(out.directionEcom)],
  ['model chain lives once (pain bank de-duplicated)', (out.packLib.match(/when\s+your\s+feet\s+go\s+numb/g) || []).length === 1],
  ['watch-your-socks line gone from pain bank', !out.packLib.includes('Nobody told you to watch your socks') && !out.packLib.includes('nobody said watch your socks')],
  ['through-line device optional', out.packLib.includes('is a strong move WHEN this story')],
  ['footage GOOD examples de-literalized', !out.packLib.includes('five colorful pairs fanned out')],
  ['hook shapes widened + rotated', out.packLib.includes('a myth she believed') && out.packLib.includes('never the same four as the last brief')],
  ['Unaware translation covers elimination rules', /symptom\s+is\s+never\s+eliminated/.test(out.packUnaware)],
  // ── Example-first (audit #2, round 3): the pinned example is priority #1 ──
  ['pin without a role defaults to FOLLOW (remake) on ecom', out.packPinDefault.includes('🎬 REMAKE MODE') && !out.packPinDefault.includes('PINNED-EXEMPLAR EXCEPTION')],
  ['explicit structure-only role still available', out.packRef.includes('PINNED-EXEMPLAR EXCEPTION')],
  ['review gets checkpoint 14 + class 25 for remake briefs', out.reviewRemake.includes('CHECKPOINT 14 — EXAMPLE FIDELITY') && out.reviewRemake.includes('25. REMAKE DRIFT')],
  ['review user carries the source for remake briefs', out.reviewRemakeUser.includes('THE PINNED EXAMPLE THIS BRIEF FOLLOWS') && out.reviewRemakeUser.includes('THE GOVERNING EXAMPLE')],
  ['non-remake review has no fidelity checkpoint', !out.reviewLib.includes('CHECKPOINT 14') && !out.reviewLib.includes('25. REMAKE DRIFT')],
  ['UGC review untouched by the fidelity checkpoint', !out.reviewUgc.includes('CHECKPOINT 14')],
  ['brainstorm renders example digests when given', out.brainstormDigestsUser.includes('# PINNED EXAMPLES') && out.brainstormDigestsUser.includes('DIGEST-MARKER')],
  ['brainstorm user unchanged without digests', !out.brainstormNoDigestsUser.includes('PINNED EXAMPLES')],
  ['direction renders example digests when given', out.directionDigestsUser.includes('# PINNED EXAMPLES') && out.directionDigestsUser.includes('DIGEST-MARKER')],
  // ── Round 4 (final retest residuals): the example outranks doctrine; the critic reads the writer ──
  ['doctrine: remake outranks craft guidance, censors outrank the example', out.packRemake.includes('REMAKE EXCEPTION: when a pinned example GOVERNS') && /only\s+the\s+censors\s+outrank\s+the\s+example/.test(out.packRemake)],
  ['fence bans LINES never SHAPES; governing example exempt', /bans\s+LINES,\s+never\s+SHAPES/.test(out.packLib) && out.packLib.includes('THE FENCE DOES NOT APPLY TO A GOVERNING EXAMPLE')],
  ['carry vs substitute + protection→obstacle-removal translation', out.packRemake.includes('CARRY vs SUBSTITUTE') && out.packRemake.includes('TRANSLATION RULE') && /sells\s+obstacle-removal/.test(out.packRemake)],
  ['remake: source length + register govern', /register,\s+and\s+LENGTH\s+ARE\s+the\s+spec/.test(out.packRemake) && /never\s+invent\s+a\s+first-person\s+witness\s+persona/.test(out.packRemake) && /source's\s+runtime\s+governs/.test(out.packRemake)],
  ['remake: product-persona isolation never yields', /product-persona\s+isolation,\s+the\s+Awareness\s+Core/.test(out.packRemake)],
  ['craft rule 4 yields texture to the source in remake', /source's\s+own\s+sentence\s+rhythm/.test(out.packLib)],
  ['writer: exampleDissection + hook 1 mirrors the source (remake only)', out.writeRemake.includes('"exampleDissection"') && out.writeRemake.includes('hook 1 MIRRORS') && !out.writeLib.includes('"exampleDissection"') && !out.writeLib.includes('hook 1 MIRRORS')],
  ['writer: fingerprintCheck exempts the governing example', out.writeRemake.includes('NOT the governing example') && !out.writeLib.includes('NOT the governing example')],
  ['writer selfReview: isolation + runtime + library production checks', out.writeLib.includes('"isolationCheck"') && out.writeLib.includes('"runtimeCheck"') && out.writeLib.includes('"productionCheck"') && !out.writeLife.includes('"productionCheck"') && out.writeRemake.includes("governing example's runtime")],
  ['concept narrator may be the example\'s own voice', out.conceptsRemake.includes("the example's own voice")],
  ['review: remake exemption for classes 14/21 + checkpoint 8', out.reviewRemake.includes('REMAKE EXEMPTION') && !out.reviewLib.includes('REMAKE EXEMPTION') && !out.reviewUgc.includes('REMAKE EXEMPTION')],
  ['review: class 25 flags padding; class 26 product-persona leak', out.reviewRemake.includes("pads the source's runtime") && out.reviewLib.includes('26. PRODUCT-PERSONA LEAK') && !out.reviewUgc.includes('PRODUCT-PERSONA LEAK')],
  ['review reads the writer\'s plan + self-review when present (ecom only)', out.reviewNotesUser.includes('PLAN: PLAN-MARKER') && out.reviewNotesUser.includes('SELF-REVIEW: SELFREVIEW-MARKER') && !out.reviewLibUser.includes("Writer's declared plan") && !out.reviewNotedUgcUser.includes('PLAN-MARKER')],
  ['CTA undercut override names the claim boundary list', out.packLib.includes("NOTE ON THE CLAIM BOUNDARY'S") && /UNDERCUTS\s+when\s+spoken\s+in\s+the\s+close/.test(out.packLib)],
  ['Unaware: marks nameable; pressure-map parenthetical gone', !out.packLib.includes('reframe, never name marks') && out.packLib.includes('legal, concrete symptom to NAME')],
  ['amputation ruling: MAY, any recorded rung, flexible witness marker', !out.packLib.includes('the chain may — and should') && /ANY\s+recorded\s+rung/.test(out.packLib) && /educator\s+voice,\s+its\s+register\s+governs/.test(out.packLib)],
  ['educator register equal; ad-blindness = announcer copy', /an\s+equal\s+winning\s+register/.test(out.packLib) && out.packLib.includes('ANNOUNCER copy')],
  // ── UGC three-tab creator document (Sep 2026) ──
  ['UGC writer ships the creator document contract', out.writeUgc.includes('THE CREATOR DOCUMENT — THE ONLY FORMAT') && out.writeUgc.includes('"creatorDoc"') && out.writeUgc.includes('"hookShots"') && out.writeUgc.includes('"onScreenText"') && out.writeUgc.includes('"reveal" | "offer"')],
  ['UGC writer calibrates on the example, fenced', out.writeUgc.includes("THE DIRECTOR'S EXAMPLE (level of information per field)") && out.writeUgc.includes('THE EXAMPLE IS CALIBRATION, NEVER MATERIAL')],
  ['UGC writer no longer asks for tonality / attire / instructions', !out.writeUgc.includes('"videoTonality"') && !out.writeUgc.includes('"attire"') && !out.writeUgc.includes('"instructions": [')],
  ['ecom writer untouched by the UGC document format', !out.writeLib.includes('"creatorDoc"') && !out.writeLib.includes('THE CREATOR DOCUMENT') && !out.writeLib.includes('"hookShots"')],
  ['doc-field regen: list fields one per line, plain fields same length band', out.regenDocField.includes('three-tab CREATOR DOCUMENT') && out.regenDocField.includes('one item per line') && out.regenDocFieldUser.includes('REQ-MARKER')],
  ['brief state renders the creator document for regen + review', out.regenDocFieldUser.includes('Creator document fields (the three-tab export') && out.regenDocFieldUser.includes('AVATAR-MARKER') && out.reviewUgcDocUser.includes('SCRIPTNOTE-MARKER') && out.reviewUgcDocUser.includes('(no promotion in this batch)')],
  ['direction: fence + claims-never-transfer + claim boundary', out.directionEcom.includes('THE NEVER-COPY FENCE BINDS YOUR SPECS') && out.directionEcom.includes('CLAIMS NEVER TRANSFER FROM AN EXAMPLE') && /CLAIM BOUNDARY/i.test(out.directionEcom) && !out.directionUgc.includes('NEVER-COPY FENCE')],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(` OK   ${name}`);
  else { console.log(` FAIL ${name}`); failed++; }
}
console.log(failed === 0 ? `\nALL ${checks.length} CHECKS PASSED` : `\n${failed}/${checks.length} CHECKS FAILED`);
process.exit(failed === 0 ? 0 : 1);
