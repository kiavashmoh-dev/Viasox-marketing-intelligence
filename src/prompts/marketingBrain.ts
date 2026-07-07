/**
 * MARKETING BRAIN — deep studied-source knowledge, routed per pipeline step.
 *
 * The knowledge base lives in src/knowledge/brain/*.md — full-depth
 * distillations produced by completely studying six sources (four marketing
 * books read cover-to-cover + two long video masterclasses consumed via
 * complete transcripts):
 *
 *   01  Schwartz, Breakthrough Advertising — THE CORNERSTONE: mass desire,
 *       5 awareness states, 5 sophistication stages, 38 verbalization
 *       patterns, 13 intensification devices, complete-ad architecture
 *   02  Hopkins, Scientific Advertising — testing discipline, specificity,
 *       offers, cost-per-result judgment
 *   03a Bly, Copywriter's Handbook (1st half) — headlines, 4 U's, BDF,
 *       motivating sequence, readability
 *   03b Bly (2nd half) — VSL spec, online creative, landing pages, emails
 *   04  Neumeier, The Brand Gap — differentiation, focus test, zig/zag
 *   05  Meta Ads Creative Strategy masterclass (140 min) — the full system:
 *       structure, testing, iteration, hit rates, fatigue, analysis
 *   06  "8 Years of Marketing Advice" (71 min) — 49 operator lessons:
 *       contrast, economics floors, hook time allocation
 *
 * ROUTING (mirrors the Brain's own Master Trigger Map): each Factory step
 * receives ONLY the sources that govern its craft, at FULL depth — not
 * summaries. Injecting all ~55k tokens into every call would be wasteful;
 * injecting shallow summaries would defeat the point. Every injection is
 * prefixed with the cross-source synthesis (the "one machine" decision
 * order + tension resolutions) and the grounding protocol (cite section-
 * level frameworks, not vague book names).
 *
 * To update the knowledge: re-study, then replace the .md files in
 * src/knowledge/brain/ — no code changes needed.
 */

import masterIndex from '../knowledge/brain/00_master-index.md?raw';
import schwartz from '../knowledge/brain/01_breakthrough-advertising.md?raw';
import hopkins from '../knowledge/brain/02_scientific-advertising.md?raw';
import blyPart1 from '../knowledge/brain/03a_copywriters-handbook_part1.md?raw';
import blyPart2 from '../knowledge/brain/03b_copywriters-handbook_part2.md?raw';
import brandGap from '../knowledge/brain/04_brand-gap.md?raw';
import metaMasterclass from '../knowledge/brain/05_video-meta-ads-creative-strategy-2026.md?raw';
import operatorLessons from '../knowledge/brain/06_video-8-years-of-marketing-advice.md?raw';

/** Steps that can request brain knowledge. */
export type BrainKnowledgeStep =
  | 'strategySession'
  | 'creativeStrategist'
  | 'conceptGeneration'
  | 'differentiationCritic'
  | 'conceptEvaluator'
  | 'scriptWriter'
  | 'hookGenerator';

// ─── Cross-source synthesis (extracted from the master index) ────────────
// The "one machine" decision order + where sources tension and how to
// resolve. Compact (~800 words) — prepended to every injection so each
// agent sees how its governing sources fit into the whole.
const SYNTHESIS: string = (() => {
  const start = masterIndex.indexOf('## CROSS-SOURCE SYNTHESIS');
  const end = masterIndex.indexOf('### Known source caveats');
  if (start === -1) return '';
  return masterIndex.slice(start, end === -1 ? undefined : end).trim();
})();

// ─── The grounding protocol (adapted from the Brain's operating protocol) ─
const PROTOCOL = `## HOW TO USE THIS KNOWLEDGE (mandatory)

The sections below are FULL-DEPTH distillations of completely studied sources
— not summaries from memory. They are your governing craft knowledge for this
step. Rules:

1. GROUND EVERY SIGNIFICANT DECISION in a specific framework/section/rule
   from these sources — cite it at SECTION level in your reasoning (e.g.
   "Schwartz: Stage-3 sophistication → lead with the mechanism", "Bly 4 U's:
   this hook scores low on Ultra-specific", "Meta masterclass: iterate hooks
   before killing the angle"), never a vague "per the books".
2. If sources tension on a point, apply the resolution logic in the
   CROSS-SOURCE SYNTHESIS below — don't silently pick one.
3. If you deliberately contradict the sources (sometimes right — the brand
   context or data can override), state the contradiction and the reason.
4. This knowledge SHAPES decisions; the review data, customer language, and
   brand manifesto still supply the raw material. Data first, frameworks to
   shape — never framework-first output that could have been written without
   the data.`;

// ─── Per-step source routing (mirrors the Master Trigger Map) ─────────────

interface SourceDoc {
  title: string;
  body: string;
}

const DOCS: Record<string, SourceDoc> = {
  schwartz: { title: 'SCHWARTZ — BREAKTHROUGH ADVERTISING (the cornerstone: mass desire, awareness states, sophistication stages, hook strategy, ad architecture)', body: schwartz },
  hopkins: { title: 'HOPKINS — SCIENTIFIC ADVERTISING (testing discipline, specificity, offers, cost-per-result judgment)', body: hopkins },
  blyPart1: { title: "BLY — COPYWRITER'S HANDBOOK PART 1 (headlines, 4 U's, BDF, motivating sequence, readability)", body: blyPart1 },
  blyPart2: { title: "BLY — COPYWRITER'S HANDBOOK PART 2 (VSL spec, online creative, landing pages, email)", body: blyPart2 },
  brandGap: { title: 'NEUMEIER — THE BRAND GAP (differentiation, focus test, zig/zag, validation)', body: brandGap },
  metaMasterclass: { title: 'META ADS CREATIVE STRATEGY MASTERCLASS 2026 (the full system: structure, testing, iteration, hit rates, fatigue, analysis)', body: metaMasterclass },
  operatorLessons: { title: '8 YEARS OF MARKETING ADVICE (49 operator lessons: contrast, economics, hook time allocation, offer thinking)', body: operatorLessons },
};

/**
 * Which sources govern which step. Full files, per the Brain's trigger map:
 *  - Strategy Session  → Meta system (05) + operator judgment (06)
 *  - Creative Strategist → Schwartz (01) + Meta (05) + Brand Gap (04)
 *  - Concept Generation → Schwartz (01) + Bly pt1 (03a)
 *  - Differentiation Critic → Brand Gap (04) + operator contrast (06)
 *  - Concept Evaluator → Hopkins (02) + Meta judgment (05)
 *  - Script Writer → Bly pt1+pt2 (03a/03b) + Schwartz architecture (01)
 *  - Hook Generator → Schwartz (01) + Bly pt1 (03a) + Meta hooks (05)
 */
const ROUTING: Record<BrainKnowledgeStep, (keyof typeof DOCS)[]> = {
  strategySession: ['metaMasterclass', 'operatorLessons'],
  creativeStrategist: ['schwartz', 'metaMasterclass', 'brandGap'],
  conceptGeneration: ['schwartz', 'blyPart1'],
  differentiationCritic: ['brandGap', 'operatorLessons'],
  conceptEvaluator: ['hopkins', 'metaMasterclass'],
  scriptWriter: ['blyPart1', 'blyPart2', 'schwartz'],
  hookGenerator: ['schwartz', 'blyPart1', 'metaMasterclass'],
};

/**
 * Build the Marketing Brain knowledge block for a pipeline step.
 * Returns the protocol + synthesis + the step's governing sources at full
 * depth, ready to append to a system prompt or inject as a user-part block.
 */
export function getMarketingBrainBlock(step: BrainKnowledgeStep): string {
  const sources = ROUTING[step]
    .map((key) => {
      const doc = DOCS[key];
      return `\n\n---\n\n# SOURCE: ${doc.title}\n\n${doc.body.trim()}`;
    })
    .join('');

  return `# ═══ MARKETING BRAIN — STUDIED SOURCE KNOWLEDGE ═══

${PROTOCOL}

${SYNTHESIS}${sources}

---
# ═══ END MARKETING BRAIN ═══`;
}
