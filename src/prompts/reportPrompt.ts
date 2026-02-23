import type { FullAnalysis } from '../engine/types';
import { buildSystemBase, getAllProductData } from './systemBase';

export function buildReportPrompt(
  analysis: FullAnalysis,
): { system: string; user: string } {
  const system = `${buildSystemBase()}

## REPORT FRAMEWORK

Generate a comprehensive Review Intelligence Report that covers:

### 1. EXECUTIVE SUMMARY
- Total reviews analyzed
- Breakdown by product
- Average ratings
- Key headline findings

### 2. PAIN POINTS ANALYSIS
For each product:
- Top pain points ranked by frequency
- Frequency classification (Very Common / Moderately Common / Not Common)
- Representative customer quotes
- Strategic implications

### 3. BENEFITS CELEBRATED
For each product:
- Top benefits ranked by frequency
- What customers love most
- Customer language patterns
- Messaging opportunities

### 4. TRANSFORMATION SIGNALS
- "Game changer" and "life changing" frequencies
- Before/after language patterns
- Specific metrics customers cite
- Power quotes for ads

### 5. CUSTOMER SEGMENTS (Two-Layer Analysis)
The data uses a two-layer segmentation model. Analyze BOTH layers:

**5a. Motivation Segments (Why They Buy)**
- Rank all motivation segments by frequency per product
- What purchase desire does each segment represent?
- Which motivation segments are growing or underserved?
- Cross-product comparison: do motivation patterns differ by product line?

**5b. Identity Segments (Who They Are)**
- Rank all identity segments by frequency per product
- Which identity groups are most vocal? Highest rated?
- Which identity segments are underrepresented but high-value?
- Caregiver/gift buyer patterns — what does this mean for marketing?

**5c. Cross-Layer Insights (The Overlap)**
- Which motivation × identity combinations are most common?
- Where do the richest targeting opportunities lie at the intersection?
- Which identity segments skew toward which motivations?
- Recommend top 3-5 motivation + identity pairs for ad targeting

### 6. CROSS-PRODUCT INSIGHTS
- What's consistent across all products
- What's unique to each product
- Message hierarchy validation
- Competitive positioning insights

### 7. STRATEGIC RECOMMENDATIONS
- Top 5 immediate marketing actions
- Messaging to amplify
- Messaging to add
- Messaging to reconsider

## ANALYSIS METHODOLOGY
- Pattern matching using regex patterns across 5 categories: Pain (10 patterns), Benefit (10 patterns), Transformation (11 patterns), Motivation Segments (8 patterns), Identity Segments (9 patterns)
- Two-layer segmentation: Motivation Segments (why they buy) + Identity Segments (who they are)
- A single review can match multiple segments across BOTH layers — the overlap IS the insight
- Frequency = (pattern matches / total reviews) * 100
- Very Common >5%, Moderately Common 2-5%, Not Common <2%
- Quotes selected for specificity, emotion, and transformation language

## ALL PRODUCT DATA
${getAllProductData(analysis)}`;

  const user = `Generate a comprehensive Review Intelligence Report from the analysis data provided.

This report should be:
1. Data-dense but readable
2. Actionable for a marketing team
3. Organized by the framework above
4. Full of specific frequencies, percentages, and customer quotes
5. Include clear "so what" for each finding

Make this the kind of report a marketing director would read and immediately know what to do next.`;

  return { system, user };
}
