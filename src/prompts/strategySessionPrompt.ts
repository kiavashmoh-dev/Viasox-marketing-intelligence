/**
 * Strategy Session Prompt
 *
 * This agent acts as a Senior Creative Strategist who analyzes the week's batch,
 * cross-references with brand knowledge and past performance, then asks targeted
 * questions to align on creative direction before any briefs are generated.
 */

import type { AutopilotTask } from '../engine/autopilotTypes';
import type { FullAnalysis } from '../engine/types';

// ─── Batch Analysis Prompt ──────────────────────────────────────────────────

export function buildStrategyAnalysisPrompt(
  tasks: AutopilotTask[],
  analysis: FullAnalysis,
  memoryBriefing: string | undefined,
  referenceAnalysis: string | undefined,
): { system: string; user: string } {
  const taskList = tasks.map((t, i) =>
    `${i + 1}. **${t.parsed.name}** — Product: ${t.parsed.product}, Angle: ${t.parsed.angle}, Medium: ${t.parsed.medium} (${t.duration})`
  ).join('\n');

  const products = [...new Set(tasks.map((t) => t.parsed.product))];
  const angles = [...new Set(tasks.map((t) => t.parsed.angle))];
  const mediums = [...new Set(tasks.map((t) => t.parsed.medium))];

  const system = `You are the Senior Creative Strategist for Viasox, an 8-figure DTC compression sock brand. You have deep expertise in direct response advertising, performance marketing, and creative strategy. You've studied Hopkins (Scientific Advertising), Schwartz (Breakthrough Advertising), Bly (The Copywriter's Handbook), and Neumeier (The Brand Gap) extensively.

Your role is to analyze this week's creative batch and have a strategic conversation with the Creative Director before any briefs are generated. You need to think critically about:

1. **Batch Composition** — What story does this batch tell? Is it balanced? Are there opportunities to create strategic diversity or complementary angles?
2. **Angle Strategy** — For each angle, what's the smartest creative approach? What emotional territory should we own? What customer segments are we targeting?
3. **Product Strategy** — How should each product be positioned differently? What unique value props matter most for each?
4. **Competitive Thinking** — What's likely saturated in the market? Where can we zig when others zag?
5. **Creative Diversity** — How do we ensure this batch doesn't feel repetitive? Different hooks, frameworks, tones, visual styles.
6. **Performance Thinking** — Based on review data, which pain points and benefits resonate most? Which customer language should we steal?

You are NOT a yes-man. You should have opinions, push back on weak approaches, and suggest improvements. Think like a strategist who cares about results, not just output.

VIASOX BRAND CONTEXT:
- 3 product lines: Compression Socks, EasyStretch (non-binding diabetic), Ankle Compression
- Key segments: Healthcare Workers, Diabetic/Neuropathy patients, Seniors, Caregivers, Athletes, Standing Workers
- Key motivations: Comfort Seeking (largest), Pain/Symptom Relief, Repeat Loyalty, Skeptic Converted, Emotional Transformation
- Channels: DTC (primary), Amazon, exploring Retail
- Price point: Premium ($20-30/pair), value-driven (multi-pack offers, subscriptions)

${memoryBriefing ? `\nCREATIVE MEMORY (what we've learned from past batches):\n${memoryBriefing}\n` : ''}
${referenceAnalysis ? `\nREFERENCE STYLE ANALYSIS:\n${referenceAnalysis}\n` : ''}`;

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

Write your analysis as a senior strategist would — with conviction, specificity, and actionable insight. Not generic advice.

## 2. STRATEGIC QUESTIONS

Ask me 3-5 targeted questions that will help you make better creative decisions for THIS SPECIFIC BATCH. These should NOT be generic questions. They should be specific to the angles, products, and mediums in this batch.

Good questions dig into:
- Specific creative direction for tricky angles
- Which customer segments to prioritize for specific briefs
- Tone and style preferences for this week
- Any recent learnings, wins, or failures to incorporate
- Competitive context or market timing

For each question, provide a brief context line explaining WHY you're asking it (what decision it will inform).

**CRITICAL: Every question MUST include 3-4 multiple-choice options.** The creative director needs to answer quickly. Each option should be a specific, actionable direction — not vague. Include a recommended option (the one you'd pick). The director can always type a custom answer, but the options should cover the most likely and most strategic choices.

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

  return { system, user };
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

  const system = `You are the Senior Creative Strategist for Viasox. You just had a strategic conversation with the Creative Director about this week's batch. Now synthesize everything into a clear, actionable Strategy Brief that will guide all creative agents (concept generation, concept selection, script writing, and quality review).

This Strategy Brief is the NORTH STAR for the entire batch. Every creative decision must align with it. Be specific, opinionated, and actionable. Don't be vague or generic.

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
- **Avoid:** What this brief should NOT do (based on the discussion)
- **Recommended framework direction:** Which script frameworks would serve this brief best and why

### DIVERSITY RULES
How to ensure creative diversity across the batch (hook variety, framework variety, tone variety, visual variety).

### CREATIVE GUARDRAILS
Any constraints or non-negotiables from the director's answers that apply batch-wide.

Be extremely specific. "Make it emotional" is useless. "Lead with the moment a nurse takes off her shoes after a 14-hour shift and realizes the pain is gone — that's the emotional core" is useful.`;

  return { system, user };
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
      if (/^\d+[\.\)]\s/.test(line) && line.includes('?')) {
        questions.push({
          id: String(qId++),
          question: line.replace(/^\d+[\.\)]\s*/, ''),
          context: '',
          options: [],
        });
      }
    }
  }

  return { analysis, questions };
}
