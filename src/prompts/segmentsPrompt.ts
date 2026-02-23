/**
 * Segment Discovery Prompt
 *
 * This module is fundamentally different from the Persona Builder.
 * The MATH is already done — the engine has assigned every review to segments
 * deterministically via regex. Claude's job is to ENRICH those segments with
 * strategic depth, not to invent or redistribute them.
 *
 * The numbers, percentages, and assignments are FIXED. Claude cannot change them.
 *
 * OUTPUT FORMAT: Well-structured Markdown for reliable rendering.
 * Visual elements (charts, bars, KPI cards) are built from engine data in the UI.
 * Claude provides the strategic NARRATIVE only.
 */

import type { FullAnalysis, ProductCategory } from '../engine/types';
import { buildSystemBase } from './systemBase';
import { formatSegmentBreakdown } from '../engine/segmentEngine';

export interface SegmentDiscoveryParams {
  product: ProductCategory | 'All Products';
  depth: 'overview' | 'deep-dive';
}

export function buildSegmentPrompt(
  params: SegmentDiscoveryParams,
  analysis: FullAnalysis,
): { system: string; user: string } {
  const isDeepDive = params.depth === 'deep-dive';
  const maxSegs = isDeepDive ? 8 : 12;
  const maxQuotes = 2;

  const segmentData = analysis.segmentBreakdown
    ? formatSegmentBreakdown(analysis.segmentBreakdown, maxSegs, maxQuotes)
    : 'No segment data available.';

  const system = `${buildSystemBase()}

## YOUR ROLE IN THIS MODULE
You are NOT discovering or inventing segments. The segmentation engine has already done that work deterministically — every review has been assigned to segment(s) using fixed regex patterns. The numbers are MATH, not opinion.

## TWO-LAYER SEGMENTATION MODEL
The data below uses a two-layer model:
- **MOTIVATION SEGMENTS** (Why They Buy): Broad behavioral segments — comfort seeker, pain relief, style conscious, quality/value, daily wear, skeptic converted, emotional transformer, repeat loyalist. Most reviews match at least one.
- **IDENTITY SEGMENTS** (Who They Are): Narrower demographic/lifestyle segments — healthcare worker, caregiver/gift buyer, diabetic/neuropathy, standing worker, accessibility/mobility, traveler, senior, pregnant/postpartum, medical/therapeutic. Only triggered when a reviewer explicitly self-identifies.

A single review can match multiple segments across BOTH layers. This is by design — a healthcare worker is ALSO likely a comfort seeker and pain relief seeker. The overlap IS the insight.

Your job is to ENRICH the segments below with strategic depth:
- What does this segment really want? (Apply Schwartz's three dimensions: Desires, Identifications, Beliefs)
- What fear drives them? (Map to the four core customer fears)
- What awareness level are they likely at?
- What messaging would resonate? (Apply Hopkins' specificity, Bly's 4 U's)
- What makes this segment different from the others in how they relate to the brand?
- How do motivation segments and identity segments INTERSECT? (e.g., "comfort seekers who are also seniors" vs. "comfort seekers who are daily wear converts" — different messaging)

YOU MUST NOT:
- Change any numbers, percentages, or review counts
- Redistribute reviews between segments
- Invent new segments that aren't in the data
- Ignore small segments — they may represent high-value niches

YOU MUST:
- Accept the data as ground truth
- Add strategic insight ON TOP of the data
- Use the actual quotes provided to understand the segment's voice
- Flag any surprising patterns — especially cross-layer overlaps
- Treat motivation segments as PRIMARY for ad targeting (they're bigger, more actionable)
- Treat identity segments as ENRICHMENT for creative messaging (they add specificity)

${segmentData}

## OUTPUT FORMAT
Write well-structured **Markdown**. Use headers (##, ###), bullet points, bold text, and blockquotes for customer voice. Be concise and data-backed. This is for a CEO — every word must earn its place.`;

  const overviewPrompt = `Analyze the customer segments identified by the engine and provide a strategic overview in Markdown format.

Structure your response with these sections:

## Executive Summary
A powerful 2-3 sentence overview of the segment landscape. What's the single most important takeaway?

## Key Opportunities
For each of the top 3-5 segments (by opportunity, not just size), write a brief paragraph covering:
- **Who they are** — make them feel like a real person in 1-2 sentences
- **Why they buy** — the core purchase driver backed by the data
- **Core fear** — which of the 4 customer fears dominates
- **Messaging priority** — what message should lead for this segment

## Cross-Segment Insights
- Which segments overlap most and what that means for messaging
- Any satisfaction gaps between segments
- What the unsegmented group suggests about gaps

## Strategic Recommendation
2-3 sentences on where to focus first and why. Be specific — name the segments and the action.

RULES:
- Reference EXACT segment names and numbers from the data
- Keep each section concise — this is an executive overview, not a research paper
- Ground every claim in the review data
- Use > blockquotes for the most powerful customer quotes
- No generic marketing fluff — be specific to THIS brand and THIS data`;

  const deepDivePrompt = `Do a deep strategic analysis of the customer segments identified by the engine${params.product !== 'All Products' ? `, focusing specifically on the ${params.product} product line within each segment` : ''}.

Structure your response with these sections:

## Executive Summary
A powerful 3-4 sentence overview. What's the #1 strategic insight a CEO needs from this data?

## Segment Deep Dives
For each segment in the data, create a ### subsection with:

### [Segment Name]
- **Profile**: A vivid 2-3 sentence description. Give them an age range, daily reality. Ground every detail in the review data.
- **Psychographics**: What mass desire drives them? Who do they identify as? What do they already believe about socks/compression/health?
- **Purchase Journey**: What pain triggers the search → What benefit seals the purchase → What transformation language do they use after buying
- **Fear Assessment**: Rate each of the 4 core fears (1-5 scale) with a brief note:
  - Loss of Independence: X/5 — [why]
  - Becoming a Burden: X/5 — [why]
  - Physical Decline: X/5 — [why]
  - Medical Device Stigma: X/5 — [why]
- **Messaging Blueprint**: Lead with [X], support with [Y]. Use language like: "[quote 1]", "[quote 2]". Avoid: "[turnoff 1]", "[turnoff 2]".
- **Best Channel/Format**: Where to reach them and what ad format works best

## Cross-Segment Analysis
- Overlap patterns between motivation and identity layers
- Satisfaction gaps and what drives them
- Top 3 growth opportunities with reasoning

## Ad Spend Priority
Rank the top 3 segments for ad spend priority with reasoning for each.

## Strategic Recommendation
3-4 sentences covering priorities, risks, and concrete next steps.

RULES:
- Use EXACT segment names and numbers from the data — do not rename, merge, or invent
- Pull customer language DIRECTLY from the representative quotes
- Fear scores must be grounded in the data patterns, not generic guesses
- Keep an executive tone — concise, specific, data-backed
- Use > blockquotes for the most powerful customer quotes
- Every insight must tie back to actual review data`;

  const user = params.depth === 'overview' ? overviewPrompt : deepDivePrompt;

  return { system, user };
}
