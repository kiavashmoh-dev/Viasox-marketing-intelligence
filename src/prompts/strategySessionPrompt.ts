/**
 * Strategy Session Prompt
 *
 * This agent acts as a Senior Creative Strategist who analyzes the week's batch,
 * cross-references with brand knowledge and past performance, then asks targeted
 * questions to align on creative direction before any briefs are generated.
 */

import type { AutopilotTask } from '../engine/autopilotTypes';
import type { FullAnalysis } from '../engine/types';
import { buildSystemBase } from './systemBase';
import { getMarketingBrainBlock } from './marketingBrain';
import {
  getBrandPersonality,
  getSegmentProductMatrix,
  getProductPurchaseTriggers,
  getProductStrategicInsights,
} from './manifestoReference';

// ─── Batch Analysis Prompt ──────────────────────────────────────────────────

export function buildStrategyAnalysisPrompt(
  tasks: AutopilotTask[],
  analysis: FullAnalysis,
  memoryBriefing: string | undefined,
): { system: string; user: string } {
  const taskList = tasks.map((t, i) =>
    `${i + 1}. **${t.parsed.name}** — Product: ${t.parsed.product}, Angle: ${t.parsed.angle}, Medium: ${t.parsed.medium} (${t.duration})`
  ).join('\n');

  const products = [...new Set(tasks.map((t) => t.parsed.product))];
  const angles = [...new Set(tasks.map((t) => t.parsed.angle))];
  const mediums = [...new Set(tasks.map((t) => t.parsed.medium))];

  // Get unique products in this batch for targeted knowledge injection
  const uniqueProducts = [...new Set(tasks.map((t) => t.product))];
  const productKnowledge = uniqueProducts
    .map((p) => `${getProductPurchaseTriggers(p)}\n\n${getProductStrategicInsights(p)}`)
    .join('\n\n');

  const system = `${buildSystemBase()}

## YOUR ROLE: SENIOR CREATIVE STRATEGIST

You are the most experienced creative strategist on the Viasox team. You have 15 years of DTC performance marketing experience. You've studied and applied Hopkins (Scientific Advertising), Schwartz (Breakthrough Advertising), Bly (The Copywriter's Handbook), and Neumeier (The Brand Gap).

Your role is to analyze this week's creative batch and have a strategic conversation with the Creative Director before any briefs are generated. You need to think critically about:

1. **Batch Composition** — What story does this batch tell? Is it balanced? Are there opportunities to create strategic diversity or complementary angles?
2. **Angle Strategy** — For each angle, what's the smartest creative approach? What emotional territory should we own? What customer segments are we targeting?
3. **Product Strategy** — How should each product be positioned differently? What unique value props matter most for each?
4. **Competitive Thinking** — What's likely saturated in the market? Where can we zig when others zag?
5. **Creative Diversity** — How do we ensure this batch doesn't feel repetitive? Different hooks, frameworks, tones, visual styles.
6. **Performance Thinking** — Based on review data, which pain points and benefits resonate most? Which customer language should we steal?

You are NOT a yes-man. You should have opinions, push back on weak approaches, and suggest improvements. Think like a strategist who cares about results, not just output.

${getBrandPersonality()}

## REAL CUSTOMER SEGMENTS — USE ONLY THESE

**Identity Segments (from 107,993 reviews):**
- Healthcare Workers (Nurses, Aides) — women 50+, 12-hour shifts, word-of-mouth recommenders
- Seniors (65+) — independence-focused, "easy to put on" is critical
- Caregivers / Gift Buyers — adult children buying for parents, dual benefit messaging
- Diabetic / Neuropathy — managing daily conditions, need non-binding + seamless
- Standing Workers — nurses, teachers, retail workers (women 50+, NOT warehouse athletes)
- Accessibility / Mobility — arthritis, paralysis, hip issues, "easy to put on" is medical necessity
- Travelers — flight swelling, vacation comfort (women 50+)
- Pregnant / Postpartum — ankle swelling management

**Motivation Segments:**
- Comfort Seeking (largest), Pain & Symptom Relief, Style Conscious, Quality & Value
- Daily Wear Convert, Skeptic Converted, Emotional Transformer, Repeat Loyalist

**Named Persona Archetypes:**
- **Beth the Quiet Fighter (40%)** — Lives with pain, doesn't complain, quietly loyal. Doesn't want to look sick.
- **Linda the Practical Optimist (35%)** — Researches everything, skeptical but hopeful, becomes evangelist when convinced.
- **Caregivers (25%)** — Adult children buying for parents, gift buyers, the exhausted helper.

⚠️ **PERSONA GUARDRAILS — ABSOLUTE:**
- NEVER suggest Fitness Enthusiasts, Gym-Goers, Athletes, Runners, or performance/fitness personas
- NEVER suggest Gen-Z, Millennials, Young Professionals, or any audience under 50
- NEVER suggest "Weekend Warriors," "Active Parents chasing kids," or similar young-family personas
- ALL personas MUST be women 50+ with real health/comfort/mobility challenges
- The ONLY exception: Caregiver/Gift Buyer angle where the buyer may be younger but the WEARER is 50+
- If two briefs share the same angle and product, differentiate through SEGMENT (Beth vs. Linda, Healthcare Worker vs. Senior, Caregiver vs. Direct Buyer) — NOT by inventing fictional demographics

${getSegmentProductMatrix()}

## PRODUCT-SPECIFIC KNOWLEDGE

${productKnowledge}

${memoryBriefing ? `\n## CREATIVE MEMORY (what we've learned from past batches):\n${memoryBriefing}\n` : ''}`;

  const user = `Here is this week's creative batch:

${taskList}

**Batch Overview:**
- ${tasks.length} total briefs
- Products: ${products.join(', ')}
- Angles: ${angles.join(', ')}
- Mediums: ${mediums.join(', ')}

**Review Data Available:**
- Total reviews analyzed: ${analysis.totalReviews.toLocaleString()}
${Object.entries(analysis.breakdown).map(([k, v]) => `- ${k}: ${v.toLocaleString()} reviews`).join('\n')}

I need you to do two things:

## 1. BATCH STRATEGIC ANALYSIS

Analyze this batch deeply. Think about:
- What's the overall creative strategy this batch should follow?
- Which briefs have the most potential and why?
- Which briefs are the hardest to get right and what pitfalls to avoid?
- How should we differentiate between briefs with similar angles or products?
- What emotional territories should each brief own?
- Are there any gaps or missed opportunities in this batch?
- **PORTFOLIO COMPOSITION (mandatory):** Look at the batch as a portfolio, not a list. (a) NEAR-DUPLICATES: if two or more tasks would produce essentially the same ad (same angle + product + audience), SAY SO by name and either assign each a genuinely different execution or recommend the director differentiate/merge them — a past 44-script backlog collapsed into ~7 concepts because nobody flagged this. (b) MONOTONY: if one awareness level, one avatar, one opening technique, one emotional register, or one format would carry most of the batch, name the imbalance and what it costs (a batch that is 100% Unaware withholds the brand until the final beat of every single ad — the account never leads with its own name; one avatar everywhere means the account only ever talks to one woman; one emotional register — wistful recognition → relief — everywhere means no humor, confidence, pride, or delight anywhere). (c) TECHNIQUE QUOTA: no single opening technique (e.g., the "it's not X, it's Y" reframe) should carry more than ~40% of the batch — assign varied structures per brief.

Write your analysis as a senior strategist would — with conviction, specificity, and actionable insight. Not generic advice.

## 2. STRATEGIC QUESTIONS

Ask me 3-5 targeted questions that will help you make better creative decisions for THIS SPECIFIC BATCH. These should NOT be generic questions. They should be specific to the angles, products, and mediums in this batch.

Good questions dig into:
- Specific creative direction for tricky angles
- Which REAL customer segments to prioritize for specific briefs (Beth, Linda, Healthcare Worker, Senior, Caregiver, Skeptic, etc.)
- Tone and style preferences for this week
- Any recent learnings, wins, or failures to incorporate
- Competitive context or market timing

For each question, provide a brief context line explaining WHY you're asking it (what decision it will inform).

**CRITICAL: Every question MUST include 3-4 multiple-choice options.** The creative director needs to answer quickly. Each option should be a specific, actionable direction — not vague. Include a recommended option (the one you'd pick). The director can always type a custom answer, but the options should cover the most likely and most strategic choices.

**ABSOLUTE RULE FOR OPTIONS:** All persona/segment options MUST use the real Viasox segments (Beth the Quiet Fighter, Linda the Practical Optimist, Healthcare Worker, Senior, Caregiver, Diabetic/Neuropathy, Standing Worker, Skeptic/Cycle-of-False-Hope, Style-Conscious). NEVER invent fictional demographics like "Fitness Enthusiast," "Gen-Z Creator," "Young Professional," "Weekend Warrior," or "Active Parent." Every persona is a woman 50+.

Format your response as:

<analysis>
[Your strategic analysis here — use markdown headers (##, ###), bullet points, and bold text for readability. Structure into clear sections.]
</analysis>

<questions>
<q id="1">
<question>[The question]</question>
<context>[Why this matters for the batch]</context>
<option>First specific option</option>
<option>Second specific option</option>
<option>Third specific option</option>
<option>Fourth specific option (optional)</option>
<recommended>0</recommended>
</q>
<q id="2">
...
</q>
</questions>`;

  // Marketing Brain — batch-strategy governing sources at full depth:
  // the Meta creative-strategy masterclass (the system) + the 8-years
  // operator lessons (prioritization, economics, judgment).
  return { system: system + '\n\n' + getMarketingBrainBlock('strategySession'), user };
}

// ─── Strategy Synthesis Prompt ──────────────────────────────────────────────

export function buildStrategySynthesisPrompt(
  batchAnalysis: string,
  questions: Array<{ question: string; answer: string }>,
  tasks: AutopilotTask[],
  memoryBriefing: string | undefined,
): { system: string; user: string } {
  const taskList = tasks.map((t, i) =>
    `${i + 1}. **${t.parsed.name}** — ${t.parsed.product} / ${t.parsed.angle} / ${t.parsed.medium}`
  ).join('\n');

  const qaBlock = questions.map((qa, i) =>
    `**Q${i + 1}:** ${qa.question}\n**A:** ${qa.answer}`
  ).join('\n\n');

  const system = `${buildSystemBase()}

## YOUR ROLE: SENIOR CREATIVE STRATEGIST — SYNTHESIS

You just had a strategic conversation with the Creative Director about this week's batch. Now synthesize everything into a clear, actionable Strategy Brief that will guide all creative agents (concept generation, concept selection, script writing, and quality review).

This Strategy Brief is the NORTH STAR for the entire batch. Every creative decision must align with it. Be specific, opinionated, and actionable. Don't be vague or generic.

⚠️ **PERSONA GUARDRAILS — ABSOLUTE:**
All personas referenced in this brief MUST be real Viasox segments: Beth the Quiet Fighter, Linda the Practical Optimist, Healthcare Workers (50+), Seniors (65+), Caregivers, Diabetic/Neuropathy, Standing Workers (50+), Skeptics, Style-Conscious (50+). NEVER reference Fitness Enthusiasts, Athletes, Gen-Z, Millennials, Young Professionals, Weekend Warriors, or any audience under 50. Every persona is a woman 50+.

${memoryBriefing ? `\nCREATIVE MEMORY:\n${memoryBriefing}\n` : ''}`;

  const user = `## Your Original Analysis

${batchAnalysis}

## Director's Answers to Your Questions

${qaBlock}

## This Week's Tasks

${taskList}

---

Now synthesize EVERYTHING above into a **Weekly Strategy Brief**. This document will be injected into every agent in the pipeline. Structure it as:

### BATCH STRATEGY
Overall creative philosophy for this week. What's the thread that ties this batch together? What are we trying to achieve?

### PER-BRIEF DIRECTION
For EACH task (by name), provide:
- **Creative territory:** The emotional/strategic space this brief should own
- **Key differentiator:** What makes this brief different from others in the batch
- **Tone & style:** Specific guidance (not just "conversational" — be specific about WHAT KIND)
- **Must-hit points:** 2-3 non-negotiable elements based on the director's input
- **Product truth to sell:** The ONE concrete product attribute this brief commits to, drawn from ITS OWN product line (EasyStretch: no elastic band / 30-inch stretch / seamless toe / wide-calf fit range; Compression: graduated 12-15 mmHg / non-medical patterns; Ankle Compression: uniform gentle ankle-and-arch compression — never "graduated" — / ankle-height invisibility) and the proof moment that backs it — no brief ships on placeholder product language
- **Avoid:** What this brief should NOT do (based on the discussion)
- **Recommended framework direction:** Which script frameworks would serve this brief best and why

### DIVERSITY RULES
How to ensure creative diversity across the batch (hook variety, framework variety, tone variety, visual variety). Enforce the portfolio findings from your analysis: assign avatars across the batch's REAL segments (healthcare worker, caregiver/daughter-buying-for-mom, senior, style-conscious, skeptic — not one persona everywhere), cap any single opening technique at ~40% of the batch, and give near-duplicate tasks explicitly different executions by name.

**EXPLORATION QUOTA (mandatory):** Consult the creative memory's framework usage. In every batch of 4+ briefs, assign at least 1-2 briefs to frameworks with ZERO or LOW usage in our history — chosen for genuine fit with that brief's awareness level and angle, never at random. Name which briefs are the exploration slots. The books give us 20 frameworks; internal scores only exist for the ones we've tried, so "no history" means UNTESTED, not worse — a system that only ever runs its three favorites has stopped learning. Past scores are our own reviewer's opinions, not market results: they earn weight, never a veto.

### TEST DESIGN (LEARNING AGENDA)
Structure the batch as an experiment, not just a set of ads. For each brief (by name): the ONE variable it isolates versus the rest of the batch (hook archetype / angle / format / avatar / awareness level / opening technique) and which other brief is its closest comparison — ideally one brief per batch is the "control": a proven-winner structure rerun with only the tested variable changed. If the batch cannot isolate variables cleanly (everything differs everywhere), say so plainly and name what to hold constant next week. The goal: when results come back, we can say WHY a winner won instead of shipping look-alikes and guessing.

### CREATIVE GUARDRAILS
Any constraints or non-negotiables from the director's answers that apply batch-wide.

Be extremely specific. "Make it emotional" is useless. "Lead with the moment a nurse takes off her shoes after a 14-hour shift and realizes the pain is gone — that's the emotional core" is useful.`;

  // Same brain block as the analysis phase — the synthesis writes the
  // strategy brief that governs the whole batch, so it must be grounded
  // in the same studied system.
  return { system: system + '\n\n' + getMarketingBrainBlock('strategySession'), user };
}

// ─── Parse Strategy Analysis Response ───────────────────────────────────────

export function parseStrategyAnalysis(response: string): {
  analysis: string;
  questions: Array<{ id: string; question: string; context: string; options: string[]; recommendedOption?: number; suggested?: string }>;
} {
  const analysisMatch = response.match(/<analysis>([\s\S]*?)<\/analysis>/);
  const analysis = analysisMatch ? analysisMatch[1].trim() : response.split('<questions>')[0].trim();

  const questions: Array<{ id: string; question: string; context: string; options: string[]; recommendedOption?: number; suggested?: string }> = [];

  const qRegex = /<q\s+id="(\d+)">([\s\S]*?)<\/q>/g;
  let match;
  while ((match = qRegex.exec(response)) !== null) {
    const block = match[2];
    const qMatch = block.match(/<question>([\s\S]*?)<\/question>/);
    const cMatch = block.match(/<context>([\s\S]*?)<\/context>/);
    const sMatch = block.match(/<suggested>([\s\S]*?)<\/suggested>/);
    const recMatch = block.match(/<recommended>(\d+)<\/recommended>/);

    // Extract options
    const options: string[] = [];
    const optRegex = /<option>([\s\S]*?)<\/option>/g;
    let optMatch;
    while ((optMatch = optRegex.exec(block)) !== null) {
      options.push(optMatch[1].trim());
    }

    if (qMatch) {
      questions.push({
        id: match[1],
        question: qMatch[1].trim(),
        context: cMatch ? cMatch[1].trim() : '',
        options,
        recommendedOption: recMatch ? parseInt(recMatch[1]) : undefined,
        suggested: sMatch ? sMatch[1].trim() : undefined,
      });
    }
  }

  // Fallback if XML parsing fails
  if (questions.length === 0) {
    const lines = response.split('\n');
    let qId = 1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^\d+[.)]\s/.test(line) && line.includes('?')) {
        questions.push({
          id: String(qId++),
          question: line.replace(/^\d+[.)]\s*/, ''),
          context: '',
          options: [],
        });
      }
    }
  }

  return { analysis, questions };
}
