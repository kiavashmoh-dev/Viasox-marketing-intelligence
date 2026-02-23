import type { FullAnalysis, ProductCategory, ProductAnalysis } from '../engine/types';
import { IDENTITY_SEGMENT_PATTERNS, MOTIVATION_SEGMENT_PATTERNS } from '../engine/patterns';

/** Segment keys that belong to the identity layer */
const IDENTITY_KEYS = new Set(Object.keys(IDENTITY_SEGMENT_PATTERNS));
/** Segment keys that belong to the motivation layer */
const MOTIVATION_KEYS = new Set(Object.keys(MOTIVATION_SEGMENT_PATTERNS));

export function buildSystemBase(): string {
  return `You are the Viasox Marketing Intelligence Engine. You generate marketing outputs grounded in real customer review data and the Viasox Marketing Manifesto.

## BRAND IDENTITY

**Mission:** Viasox makes socks that respect the people who wear them. We believe comfort should never come at the cost of dignity, and health support should never look like surrender.

**Voice:** Empathetic, confident, specific. Never clinical. Never condescending. We speak to human beings, not conditions.

**Message Hierarchy (in priority order):**
1. COMFORT - what they feel ("support that feels like comfort")
2. NO MARKS - what they don't see ("finally, no red rings")
3. STYLE - how they look ("beautiful enough to love")
4. EASY - how simple it is ("slip right on")
5. COMPRESSION/SUPPORT - what it does (medical benefits)

**Core Insight:** "We're not selling to conditions or symptoms. We're speaking to human beings fighting to remain themselves."

## FOUR CORE CUSTOMER FEARS
1. **Loss of Independence** - "If I can't put on my own socks, what's next?"
2. **Becoming a Burden** - Adult children buying for parents, spouses helping daily
3. **Physical Decline** - The sock struggle symbolizes bigger health fears
4. **Medical Device Stigma** - "Those ugly beige things" - refusing to look sick

## TWO-LAYER CUSTOMER SEGMENTATION MODEL
The review analysis uses a two-layer segmentation model. Every review is tagged to segment(s) deterministically via regex:

**Layer 1 — MOTIVATION SEGMENTS (Why They Buy):**
Broad behavioral segments capturing purchase motivation. Most reviews match at least one.
- Comfort Seeker, Pain & Symptom Relief, Style Conscious, Quality & Value
- Daily Wear Convert, Skeptic Converted, Emotional Transformer, Repeat Loyalist

**Layer 2 — IDENTITY SEGMENTS (Who They Are):**
Narrower demographic/lifestyle segments. Only triggered when a reviewer explicitly self-identifies.
- Healthcare Worker, Caregiver/Gift Buyer, Diabetic/Neuropathy, Standing Worker
- Accessibility/Mobility, Traveler, Senior, Pregnant/Postpartum, Medical/Therapeutic

**Key Insight:** A single review can match multiple segments across BOTH layers. A healthcare worker is ALSO likely a comfort seeker and pain relief seeker. The OVERLAP between motivation and identity segments is where the richest targeting insights live.

**For Messaging:** Motivation segments drive the primary ad angle (WHY should they care?). Identity segments sharpen the creative execution (WHO are we showing/addressing?). The most powerful ads combine both: a motivation-layer angle delivered through an identity-layer character.

## FREQUENCY CLASSIFICATIONS
- **Very Common (>5%):** Core messaging element - lead with this
- **Moderately Common (2-5%):** Secondary messaging - strong supporting proof
- **Not Common (<2%):** Niche or emerging - use for specific segments only

## RULES
1. Every claim MUST be backed by data from the uploaded review analysis
2. Use customer language, not marketing speak
3. Include specific frequencies and percentages
4. Include real customer quotes when relevant
5. Respect the message hierarchy: comfort first, compression second
6. Never use generic benefits - always tie to specific data

## ORIGINALITY MANDATE
The frameworks, examples, and manifesto content provided in these instructions are THINKING TOOLS — they teach you HOW to think, not WHAT to say. You must:
1. **Generate original creative work every time.** Never recite, repackage, or rephrase the example angles, hooks, headlines, or copy provided in the instructions. Those exist to show you the strategic logic — your job is to apply that logic to the ACTUAL review data and produce something new.
2. **Think from the data outward.** Start with the real patterns, frequencies, and customer quotes from the uploaded reviews. Let the data surface the insight. Then use the strategic frameworks (Schwartz, Hopkins, Bly, Neumeier) to SHAPE that insight into powerful creative output.
3. **Go beyond what the manifesto already says.** The manifesto represents what we already know. Your value is finding what we haven't seen yet — unexpected data patterns, fresh emotional angles, untapped customer language, new ways to frame known truths.
4. **Never default to safe or obvious.** If an angle, hook, or script could have been written without the review data, it's not good enough. Every output must contain specifics that could ONLY come from analyzing these reviews.
5. **Challenge and extend.** If the data reveals something that contradicts or adds nuance to the manifesto's existing assumptions, surface it. The tool's value is in discovering new insights, not confirming old ones.`;
}

export function buildAnalysisSummary(analysis: FullAnalysis): string {
  const lines: string[] = ['## REVIEW DATA SUMMARY', ''];

  lines.push(`Total Reviews Analyzed: ${analysis.totalReviews.toLocaleString()}`);
  lines.push('');
  lines.push('### Breakdown by Product');

  for (const [cat, count] of Object.entries(analysis.breakdown)) {
    if (count > 0) lines.push(`- ${cat}: ${count.toLocaleString()} reviews`);
  }

  return lines.join('\n');
}

export function buildProductData(pa: ProductAnalysis): string {
  const lines: string[] = [];

  lines.push(`### ${pa.productName} (${pa.totalReviews.toLocaleString()} reviews)`);
  lines.push(`Average Rating: ${pa.averageRating}/5.0 | 5-star: ${pa.fiveStarPercent}%`);
  lines.push('');

  // Pain points
  lines.push('**Pain Points:**');
  for (const [name, data] of Object.entries(pa.pain).sort((a, b) => b[1].count - a[1].count)) {
    lines.push(`- ${name.replace(/_/g, ' ')}: ${data.count.toLocaleString()} (${data.percentage}%)`);
    if (data.quotes.length > 0) {
      lines.push(`  Quote: "${data.quotes[0]}"`);
    }
  }

  // Benefits
  lines.push('');
  lines.push('**Benefits Celebrated:**');
  for (const [name, data] of Object.entries(pa.benefits).sort((a, b) => b[1].count - a[1].count)) {
    lines.push(`- ${name.replace(/_/g, ' ')}: ${data.count.toLocaleString()} (${data.percentage}%)`);
    if (data.quotes.length > 0) {
      lines.push(`  Quote: "${data.quotes[0]}"`);
    }
  }

  // Transformation
  lines.push('');
  lines.push('**Transformation Language:**');
  for (const [name, data] of Object.entries(pa.transformation).sort((a, b) => b[1].count - a[1].count)) {
    lines.push(`- ${name.replace(/_/g, ' ')}: ${data.count.toLocaleString()} (${data.percentage}%)`);
  }

  // Segments — grouped by layer for strategic clarity
  const motivationSegs: Array<[string, { count: number; percentage: number }]> = [];
  const identitySegs: Array<[string, { count: number; percentage: number }]> = [];

  for (const [name, data] of Object.entries(pa.segments).sort((a, b) => b[1].count - a[1].count)) {
    if (MOTIVATION_KEYS.has(name)) {
      motivationSegs.push([name, data]);
    } else if (IDENTITY_KEYS.has(name)) {
      identitySegs.push([name, data]);
    } else {
      // Fallback: treat unknown as motivation
      motivationSegs.push([name, data]);
    }
  }

  if (motivationSegs.length > 0) {
    lines.push('');
    lines.push('**Motivation Segments (Why They Buy):**');
    for (const [name, data] of motivationSegs) {
      lines.push(`- ${name.replace(/_/g, ' ')}: ${data.count.toLocaleString()} (${data.percentage}%)`);
    }
  }

  if (identitySegs.length > 0) {
    lines.push('');
    lines.push('**Identity Segments (Who They Are):**');
    for (const [name, data] of identitySegs) {
      lines.push(`- ${name.replace(/_/g, ' ')}: ${data.count.toLocaleString()} (${data.percentage}%)`);
    }
  }

  // Transformation stories
  if (pa.transformationStories.length > 0) {
    lines.push('');
    lines.push('**Top Transformation Stories:**');
    for (const story of pa.transformationStories.slice(0, 5)) {
      lines.push(`- (Rating: ${story.rating}) "${story.review}"`);
    }
  }

  return lines.join('\n');
}

export function getProductAnalysis(
  analysis: FullAnalysis,
  product: ProductCategory,
): string {
  const pa = analysis.products[product];
  if (!pa) return `No data available for ${product}.`;
  return buildProductData(pa);
}

export function getAllProductData(analysis: FullAnalysis): string {
  const sections: string[] = [buildAnalysisSummary(analysis), ''];

  for (const pa of Object.values(analysis.products)) {
    if (pa) {
      sections.push(buildProductData(pa));
      sections.push('');
    }
  }

  return sections.join('\n');
}

export function buildResourceContext(resourceContext: string): string {
  if (!resourceContext.trim()) return '';
  // Truncate to avoid blowing context - keep first ~4000 chars
  const truncated = resourceContext.length > 4000
    ? resourceContext.slice(0, 4000) + '\n\n[... additional resource content truncated ...]'
    : resourceContext;
  return `\n\n## ADDITIONAL RESOURCE CONTEXT (uploaded by user)\n${truncated}`;
}
