/**
 * Persona Parser — Splits Claude's markdown output into structured persona blocks.
 *
 * DESIGN PRINCIPLE: Every extraction has a fallback.
 * If regex fails, sections render as plain markdown. The UI never breaks.
 */

export type ChannelType = 'DTC' | 'Retail' | 'Wholesale';

/* ── Data Structures ────────────────────────────────────────────────────── */

export interface ParsedPersona {
  rawMarkdown: string;
  personaName: string;
  sections: ParsedSection[];
  fourFears?: FourFearsData;
  transformationArc?: TransformationArcData;
  quotes: string[];
}

export interface ParsedSection {
  heading: string;
  sectionKey: string;
  content: string;
  isQuoteSection: boolean;
}

export interface FourFearsData {
  lossOfIndependence: number;
  becomingBurden: number;
  physicalDecline: number;
  medicalDeviceStigma: number;
}

export interface TransformationArcData {
  before: string;
  turningPoint: string;
  after: string;
}

/* ── Section Key Normalization ──────────────────────────────────────────── */

/**
 * Maps partial heading text (lowercased) → normalized section key.
 * Covers all 3 channels. Checked via substring matching, so partial matches work.
 */
const SECTION_KEY_MATCHERS: [RegExp, string][] = [
  // DTC
  [/persona name|archetype/i, 'name_archetype'],
  [/snapshot/i, 'snapshot'],
  [/inner world|schwartz|three dimensions/i, 'inner_world'],
  [/four fears/i, 'four_fears'],
  [/pain story/i, 'pain_story'],
  [/transformation arc|transformation\b/i, 'transformation_arc'],
  [/purchase psychology/i, 'purchase_psychology'],
  [/messaging blueprint/i, 'messaging_blueprint'],
  [/customer quotes|quotes bank/i, 'quotes'],
  // Retail
  [/category problem/i, 'category_problem'],
  [/consumer demand|demand proof/i, 'demand_proof'],
  [/sell.?through story/i, 'sell_through'],
  [/category.*margin|margin.*positioning/i, 'margin_positioning'],
  [/retail buyer messaging/i, 'retail_messaging'],
  [/sell.?through evidence/i, 'quotes'],
  // Wholesale
  [/institutional context/i, 'institutional_context'],
  [/institutional pain/i, 'institutional_pain'],
  [/outcomes evidence/i, 'outcomes_evidence'],
  [/roi narrative/i, 'roi_narrative'],
  [/procurement psychology/i, 'procurement_psychology'],
  [/institutional messaging/i, 'institutional_messaging'],
  [/outcomes.*quotes|quotes.*outcomes/i, 'quotes'],
  // US vs CA geographic comparison (MUST come before market_opportunity to catch "Market Analysis: US vs CA")
  [/us\s*vs\.?\s*ca|geo.*comparison|united states.*canada|market.*comparison.*us|market.*comparison.*ca/i, 'us_vs_ca_comparison'],
  // Market (all channels)
  [/market opportunity|market positioning|market analysis/i, 'market_opportunity'],
];

function normalizeSectionKey(heading: string): string {
  for (const [pattern, key] of SECTION_KEY_MATCHERS) {
    if (pattern.test(heading)) return key;
  }
  // Fallback: slugify the heading
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/* ── Section Styling Map ────────────────────────────────────────────────── */

export interface SectionStyle {
  icon: string;
  color: string;
  label: string;
}

export const SECTION_STYLES: Record<string, SectionStyle> = {
  name_archetype: { icon: '\uD83C\uDFAD', color: 'blue', label: 'Persona' },
  snapshot: { icon: '\uD83D\uDCCB', color: 'blue', label: 'Snapshot' },
  inner_world: { icon: '\uD83E\uDDE0', color: 'violet', label: 'Inner World' },
  four_fears: { icon: '\u26A0\uFE0F', color: 'amber', label: 'Four Fears' },
  pain_story: { icon: '\uD83D\uDCA2', color: 'rose', label: 'Pain Story' },
  transformation_arc: { icon: '\u2728', color: 'emerald', label: 'Transformation' },
  purchase_psychology: { icon: '\uD83D\uDED2', color: 'cyan', label: 'Purchase Psychology' },
  messaging_blueprint: { icon: '\uD83D\uDCE3', color: 'indigo', label: 'Messaging' },
  quotes: { icon: '\uD83D\uDCAC', color: 'slate', label: 'Customer Voice' },
  // Retail
  category_problem: { icon: '\uD83D\uDEA8', color: 'rose', label: 'Category Problem' },
  demand_proof: { icon: '\uD83D\uDCCA', color: 'emerald', label: 'Demand Proof' },
  sell_through: { icon: '\uD83D\uDED2', color: 'blue', label: 'Sell-Through Story' },
  margin_positioning: { icon: '\uD83D\uDCB0', color: 'amber', label: 'Margin Positioning' },
  retail_messaging: { icon: '\uD83D\uDCE3', color: 'indigo', label: 'Retail Messaging' },
  // Wholesale
  institutional_context: { icon: '\uD83C\uDFE5', color: 'blue', label: 'Context' },
  institutional_pain: { icon: '\uD83D\uDCA2', color: 'rose', label: 'Institutional Pain' },
  outcomes_evidence: { icon: '\u2705', color: 'emerald', label: 'Outcomes Evidence' },
  roi_narrative: { icon: '\uD83D\uDCB0', color: 'amber', label: 'ROI Narrative' },
  procurement_psychology: { icon: '\uD83E\uDDE0', color: 'violet', label: 'Procurement' },
  institutional_messaging: { icon: '\uD83D\uDCE3', color: 'indigo', label: 'Messaging' },
  // Market
  market_opportunity: { icon: '\uD83D\uDCCA', color: 'teal', label: 'Market Opportunity' },
  us_vs_ca_comparison: { icon: '\uD83C\uDF0E', color: 'teal', label: 'US vs CA Comparison' },
};

export function getSectionStyle(sectionKey: string): SectionStyle {
  return SECTION_STYLES[sectionKey] ?? { icon: '\uD83D\uDCC4', color: 'slate', label: sectionKey.replace(/_/g, ' ') };
}

/* ── Step 1: Split into Persona Blocks ──────────────────────────────────── */

export function splitIntoPersonaBlocks(content: string): string[] {
  if (!content || content.trim().length === 0) return [];

  // Strategy 1: Numbered level-1 headings — "# 1." or "# PERSONA 1:"
  const byNumbered = content.split(/(?=^# (?:PERSONA\s+\d|\d+\.))/mi);
  const numbered = byNumbered.filter(b => b.trim().length > 100);
  if (numbered.length >= 2) return numbered;

  // Strategy 2: Level-1 headings (not utility headers like MARKET, SEGMENT, etc.)
  const byH1 = content.split(/(?=^# (?!MARKET|Market|TAM|CROSS|Cross|SEGMENT|Segment|DETERMINISTIC|---)[A-Z\u{1F300}-\u{1FAFF}])/mu);
  const h1Blocks = byH1.filter(b => b.trim().length > 100);
  if (h1Blocks.length >= 2) return h1Blocks;

  // Strategy 3: Horizontal rule separators
  const byHr = content.split(/\n-{3,}\n/);
  const hrBlocks = byHr.filter(b => b.trim().length > 200);
  if (hrBlocks.length >= 2) return hrBlocks;

  // Strategy 4: Fallback — single block
  return [content];
}

/* ── Step 2: Parse a Persona Block into Sections ────────────────────────── */

function extractPersonaName(block: string): string {
  // Try to find the first heading
  const headingMatch = block.match(/^#+\s+(?:\d+\.\s*)?(?:PERSONA\s*\d*:?\s*)?(.+)/mi);
  if (headingMatch) {
    let name = headingMatch[1].trim();
    // Remove trailing markdown decorators
    name = name.replace(/\*+$/g, '').replace(/^["']|["']$/g, '').trim();
    // Remove "Consumer Persona:" or similar prefix
    name = name.replace(/^(?:Consumer\s+)?Persona:?\s*/i, '').trim();
    name = name.replace(/^End.?User\s+Persona:?\s*/i, '').trim();
    return name || 'Unnamed Persona';
  }
  return 'Unnamed Persona';
}

export function parsePersonaBlock(block: string, channel: ChannelType): ParsedPersona {
  const personaName = extractPersonaName(block);

  // Split on section headers: "## N." or "### N." or "## Title" or "**N."
  const sectionSplitPattern = /(?=^(?:#{2,3}\s+\**\d+\.\s*|#{2,3}\s+(?!\s*$)))/m;
  const rawParts = block.split(sectionSplitPattern);

  const sections: ParsedSection[] = [];
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (trimmed.length < 15) continue;

    // Extract heading from the first line
    const headingMatch = trimmed.match(/^#{2,3}\s+\**(?:\d+\.\s*)?(.+?)(?:\**\s*)?$/m);
    if (!headingMatch) continue;

    const heading = headingMatch[1].trim().replace(/\*+$/g, '');
    const sectionKey = normalizeSectionKey(heading);
    const content = trimmed.slice(headingMatch[0].length).trim();

    if (content.length < 5) continue;

    sections.push({
      heading,
      sectionKey,
      content,
      isQuoteSection: sectionKey === 'quotes',
    });
  }

  // Extract structured data
  const fourFears = channel === 'DTC'
    ? extractFourFears(sections.find(s => s.sectionKey === 'four_fears')?.content)
    : undefined;

  const transformationArc = channel === 'DTC'
    ? extractTransformationArc(sections.find(s => s.sectionKey === 'transformation_arc')?.content)
    : undefined;

  const quotes = extractQuotes(
    sections.find(s => s.isQuoteSection)?.content ?? ''
  );

  return {
    rawMarkdown: block,
    personaName,
    sections,
    fourFears,
    transformationArc,
    quotes,
  };
}

/* ── Step 3: Extract Structured Sub-Data ────────────────────────────────── */

function extractFourFears(content: string | undefined): FourFearsData | undefined {
  if (!content) return undefined;

  const extract = (patterns: RegExp[]): number => {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val >= 1 && val <= 5) return val;
      }
    }
    return 0; // 0 = not found (different from 1-5)
  };

  const data: FourFearsData = {
    lossOfIndependence: extract([
      /(?:loss of independence|independence)[^0-9]*(\d)\s*(?:\/\s*5|out of 5)?/i,
      /independence[:\s—-]+\**(\d)/i,
    ]),
    becomingBurden: extract([
      /(?:becoming a burden|burden)[^0-9]*(\d)\s*(?:\/\s*5|out of 5)?/i,
      /burden[:\s—-]+\**(\d)/i,
    ]),
    physicalDecline: extract([
      /(?:physical decline|decline)[^0-9]*(\d)\s*(?:\/\s*5|out of 5)?/i,
      /decline[:\s—-]+\**(\d)/i,
    ]),
    medicalDeviceStigma: extract([
      /(?:medical device stigma|stigma)[^0-9]*(\d)\s*(?:\/\s*5|out of 5)?/i,
      /stigma[:\s—-]+\**(\d)/i,
    ]),
  };

  // If we didn't extract ANY fears, return undefined so the gauge doesn't render
  const found = Object.values(data).filter(v => v > 0).length;
  return found >= 2 ? data : undefined;
}

function extractTransformationArc(content: string | undefined): TransformationArcData | undefined {
  if (!content) return undefined;

  // Try multiple patterns for BEFORE / TURNING POINT / AFTER
  const beforeMatch = content.match(
    /\*?\*?BEFORE\*?\*?\s*[:\s—\-]+\s*([\s\S]+?)(?=\*?\*?TURNING|\*?\*?AFTER|$)/i
  );
  const turningMatch = content.match(
    /\*?\*?TURNING\s*POINT\*?\*?\s*[:\s—\-]+\s*([\s\S]+?)(?=\*?\*?AFTER|$)/i
  );
  const afterMatch = content.match(
    /\*?\*?AFTER\*?\*?\s*[:\s—\-]+\s*([\s\S]*?)$/i
  );

  const before = beforeMatch?.[1]?.trim() ?? '';
  const turning = turningMatch?.[1]?.trim() ?? '';
  const after = afterMatch?.[1]?.trim() ?? '';

  // Need at least 2 of 3 parts to render the visual
  const parts = [before, turning, after].filter(p => p.length > 5);
  return parts.length >= 2
    ? { before, turningPoint: turning, after }
    : undefined;
}

function extractQuotes(content: string): string[] {
  if (!content || content.trim().length === 0) return [];
  const quotes: string[] = [];

  // Pattern 1: Markdown blockquotes
  const blockquoteMatches = content.matchAll(/^>\s*[""]?(.+?)[""]?\s*$/gm);
  for (const m of blockquoteMatches) {
    const q = m[1].trim();
    if (q.length > 15) quotes.push(q);
  }

  // Pattern 2: Quoted strings with double quotes
  if (quotes.length === 0) {
    const quotedMatches = content.matchAll(/"([^"]{20,})"/g);
    for (const m of quotedMatches) {
      quotes.push(m[1].trim());
    }
  }

  // Pattern 3: Italic blocks that look like quotes
  if (quotes.length === 0) {
    const italicMatches = content.matchAll(/\*"?([^*]{20,})"?\*/g);
    for (const m of italicMatches) {
      quotes.push(m[1].trim());
    }
  }

  return quotes.slice(0, 5);
}

/* ── Market Comparison Extraction ───────────────────────────────────────── */

export interface MarketComparisonData {
  viasoxPercent?: number;
  marketPercent?: number;
  classification?: string;
}

export function extractMarketComparison(content: string): MarketComparisonData | undefined {
  if (!content) return undefined;

  // Look for "Viasox ... X%" and "Market ... Y%" patterns
  const viasoxMatch = content.match(/(?:viasox|review data|our data)[^0-9]*?(\d+\.?\d*)\s*%/i);
  const marketMatch = content.match(/(?:market\s+(?:context|benchmark|share|data|estimate))[^0-9]*?(\d+\.?\d*)\s*%/i);

  // Look for classification label
  const classMatch = content.match(
    /[""\*]*(Established Core|Growth Engine|Emerging Opportunity|Niche Strength|Underserved Whitespace)[""\*]*/i
  );

  const result: MarketComparisonData = {
    viasoxPercent: viasoxMatch ? parseFloat(viasoxMatch[1]) : undefined,
    marketPercent: marketMatch ? parseFloat(marketMatch[1]) : undefined,
    classification: classMatch?.[1],
  };

  // Only return if we got at least one useful piece of data
  return (result.viasoxPercent != null || result.marketPercent != null || result.classification)
    ? result
    : undefined;
}

/* ── Source Citation Extraction ─────────────────────────────────────────── */

export interface SourceCitation {
  source: string;
  year?: string;
  fullMatch: string;
}

/**
 * Extracts [Source: Name, Year] citations from content.
 * Returns unique citations found.
 */
export function extractSourceCitations(content: string): SourceCitation[] {
  if (!content) return [];
  const citations: SourceCitation[] = [];
  const seen = new Set<string>();

  const pattern = /\[Source:\s*([^\],]+?)(?:,\s*(\d{4}))?\]/gi;
  for (const match of content.matchAll(pattern)) {
    const source = match[1].trim();
    const year = match[2] ?? undefined;
    const key = `${source}|${year ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({ source, year, fullMatch: match[0] });
    }
  }
  return citations;
}

/**
 * Styles [Source: Name, Year] citations into visually distinct inline elements.
 * Converts to markdown bold-italic for react-markdown rendering.
 */
export function styleCitationMarkers(content: string): string {
  return content.replace(
    /\[Source:\s*([^\],]+?)(?:,\s*(\d{4}))?\]/gi,
    (_match, source: string, year?: string) => {
      const yearPart = year ? `, ${year}` : '';
      return `***[${source.trim()}${yearPart}]***`;
    }
  );
}

/* ── Main Public Entry Point ────────────────────────────────────────────── */

export function parsePersonaOutput(
  content: string,
  channel: ChannelType,
): ParsedPersona[] {
  const blocks = splitIntoPersonaBlocks(content);
  return blocks.map(block => parsePersonaBlock(block, channel));
}
