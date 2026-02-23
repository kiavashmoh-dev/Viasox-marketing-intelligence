import type { PersonaParams, PersonaChannel, FullAnalysis } from '../engine/types';
import { buildSystemBase, getProductAnalysis } from './systemBase';
import { buildMarketContext } from '../data/marketIntelligence';

/* ------------------------------------------------------------------ */
/*  Cross-segment analytics formatter (for prompt injection)           */
/* ------------------------------------------------------------------ */

function formatCrossSegmentData(analysis: FullAnalysis, product: string): string {
  const sb = analysis.segmentBreakdown;
  if (!sb) return '';

  const sections: string[] = [];

  // ── Product Affinity: Which segments dominate this specific product ──
  const affinity = sb.productAffinity?.[product as keyof typeof sb.productAffinity];
  if (affinity && affinity.length > 0) {
    sections.push('## SEGMENT WEIGHT & SIGNIFICANCE (This Product)');
    sections.push(`Segments ranked by share of ${product} reviews:\n`);
    sections.push('| Segment | Layer | Count | % of Product | Concentration Index |');
    sections.push('|---------|-------|-------|-------------|-------------------|');
    for (const entry of affinity.slice(0, 12)) {
      const ci = entry.concentrationIndex;
      const ciLabel = ci > 1.2 ? `${ci} ↑ over-indexed` : ci < 0.8 ? `${ci} ↓ under-indexed` : `${ci} ≈ balanced`;
      sections.push(`| ${entry.segmentName} | ${entry.layer} | ${entry.count.toLocaleString()} | ${entry.shareOfProduct}% | ${ciLabel} |`);
    }
    sections.push('');
    sections.push('Concentration Index: >1.0 = this segment is MORE concentrated in this product than across all products. <1.0 = LESS concentrated. High CI = this product uniquely serves this segment.');
    sections.push('');
  }

  // ── Cross-product segment distribution ──
  if (sb.segments.length > 0) {
    sections.push('## CROSS-PRODUCT SEGMENT DISTRIBUTION');
    sections.push('How each segment distributes across product lines (which personas buy which products):\n');
    for (const seg of sb.segments.slice(0, 10)) {
      const parts = Object.entries(seg.byProduct).map(([p, d]) => `${p}: ${d.count} (${d.percentage}%)`);
      sections.push(`**${seg.segmentName}** (${seg.layer}): ${parts.join(' | ')}`);
    }
    sections.push('');
  }

  // ── Top identity × motivation overlaps ──
  const overlaps = sb.crossSegmentOverlap;
  if (overlaps && overlaps.length > 0) {
    sections.push('## SEGMENT CROSS-OVER ANALYSIS (Identity × Motivation Overlap)');
    sections.push('Top co-occurring segment pairs — these represent the most common real persona intersections:\n');
    sections.push('| Identity Segment | Motivation Segment | Co-occurrence | % of Identity | % of Motivation | Avg Rating |');
    sections.push('|-----------------|-------------------|---------------|--------------|----------------|------------|');
    for (const ov of overlaps.slice(0, 15)) {
      sections.push(`| ${ov.identity} | ${ov.motivation} | ${ov.reviewCount.toLocaleString()} | ${ov.percentOfIdentity}% | ${ov.percentOfMotivation}% | ${ov.avgRating}/5 |`);
    }
    sections.push('');
    sections.push('Use this data to understand: Which identity groups are driven by which motivations? Where is cross-over strongest? Which combinations represent the highest-value intersection personas?');
    sections.push('');
  }

  return sections.length > 0 ? sections.join('\n') : '';
}

/* ------------------------------------------------------------------ */
/*  Channel-specific persona frameworks                                */
/* ------------------------------------------------------------------ */

function buildChannelFramework(channel: PersonaChannel): string {
  if (channel === 'DTC') {
    return `## CHANNEL: DIRECT-TO-CONSUMER (DTC)

You are building personas for the END CONSUMER — the person who will see an ad, click, and buy. These are the people who wear Viasox.

### DTC PERSONA STRUCTURE (Required for each persona)

**1. Persona Name & Archetype**
A memorable, emotionally resonant name (e.g., "The Determined Nurse," "The Worried Daughter"). The archetype should capture their ROLE in their own story.

**2. Snapshot**
- Age range, gender tendency, life stage
- Daily reality in 2-3 sentences — what does a typical day look like?
- The ONE sentence that would stop this person mid-scroll

**3. The Inner World** (Schwartz's Three Dimensions)
- **Desires:** What does comfort REPRESENT to them? Independence? Dignity? Freedom from worry? Go one level deeper than the surface need.
- **Identifications:** How do they see themselves? "I'm the strong one." "I refuse to let this slow me down." "I'm still ME."
- **Beliefs:** What do they believe about their condition, about medical products, about aging? Which beliefs does messaging need to align with vs. gently challenge?

**4. The Four Fears** (rate each 1-5)
- Loss of Independence — "If I can't put on my own socks, what's next?"
- Becoming a Burden — Requiring help for basic tasks
- Physical Decline — The sock struggle as symbol of larger trajectory
- Medical Device Stigma — "I refuse to look sick"

**5. Pain Story** (narrative, NOT bullet points)
Write the STORY of this person's daily struggle. The specific moment that made them realize they needed something different. What they've tried. What failed. The daily indignity. Use actual customer language.

**6. Transformation Arc**
- BEFORE: The specific daily struggle (grounded in pain data)
- TURNING POINT: The discovery moment
- AFTER: The specific daily joy (grounded in benefit data)
- Include real review quotes as narrative anchors

**7. Purchase Psychology**
- **Trigger Moment:** What event pushes them from passive suffering to active searching?
- **Decision Drivers:** Ranked (comfort? style? ease? medical need? price? social proof?)
- **Objections:** What holds them back?
- **Proof Points:** What evidence converts them? (peer testimonials? data? professional endorsements?)

**8. Messaging Blueprint**
- **Primary Message:** The ONE sentence for this persona
- **Message Hierarchy:** Which of the 5 brand messages resonates most? (Comfort > No Marks > Style > Easy > Compression)
- **Emotional Hook:** The feeling to target
- **Awareness Level:** Where they sit on Schwartz's scale, and what moves them to the next stage
- **Ad Creative Direction:** What format stops their scroll? (UGC? Lifestyle? Testimonial? Problem-solution?)

**9. Customer Quotes Bank**
3-5 real review quotes that represent this persona, tagged with the emotional theme.`;
  }

  if (channel === 'Retail') {
    return `## CHANNEL: RETAIL

You are building personas for RETAIL BUYERS — the merchandisers, category managers, and buyers at chains (pharmacies, big box, specialty) who decide whether to stock Viasox. The consumer review data becomes SELL-THROUGH PROOF.

### RETAIL PERSONA STRUCTURE (Required for each persona)

**1. Consumer Persona Name & Archetype**
Same consumer persona (the end wearer), but framed through the lens of: "This is who your retail customers' shoppers are."

**2. Consumer Snapshot**
- Demographics, life stage, shopping behavior
- WHERE they currently buy socks and medical/compression products
- What brings them into the retailer's store or category

**3. The Category Problem**
NOT the consumer's personal pain — instead, the SHELF problem:
- What's currently failing on the sock/compression shelf for this shopper type?
- What gap exists in the current planogram that this consumer falls through?
- Why does this shopper type leave the aisle empty-handed or buy something that disappoints them?

**4. Consumer Demand Proof** (from review data)
- Review volume and average rating for this segment
- Specific satisfaction metrics (% mentioning comfort, style, ease-of-use)
- Repeat purchase signals ("buying more," "replaced entire drawer," "third order")
- Gift/multi-pack buying patterns (signals for basket size)

**5. Sell-Through Story**
Instead of a personal pain story, tell the RETAIL story:
- What this shopper type is currently buying (and why it underperforms)
- The conversion moment: what makes them switch to Viasox
- The loyalty loop: why they come back (and buy multiples)
- Competitive differentiation: what Viasox offers that the current shelf doesn't

**6. Category & Margin Positioning**
- Where does this product fit on the shelf? (Medical? Fashion? Everyday?)
- Price tier justification from consumer willingness-to-pay signals in reviews
- Cross-sell and basket-building opportunities for this persona type
- Seasonal and promotional angles

**7. Retail Buyer Messaging**
- **Pitch Headline:** The ONE sentence that makes a buyer take a meeting
- **Demand Proof Points:** 3-5 data-backed claims for the line review
- **Planogram Story:** How this fills a gap vs. current offerings
- **Differentiation Angle:** What makes this unforgettable vs. the competition

**8. Consumer Quotes as Sell-Through Evidence**
3-5 real reviews reframed as consumer demand proof (tag each with the retail insight it provides).`;
  }

  // Wholesale
  return `## CHANNEL: WHOLESALE / B2B

You are building personas for INSTITUTIONAL DECISION MAKERS — hospital purchasing managers, senior living facility administrators, corporate wellness buyers, group purchasing organizations, home health agencies. Consumer reviews become OUTCOMES EVIDENCE.

### WHOLESALE PERSONA STRUCTURE (Required for each persona)

**1. End-User Persona Name & Archetype**
The person who WEARS the product in the institutional setting. Frame as: "This is who your buyer's patients/residents/employees are."

**2. Institutional Context**
- Where this end-user exists: hospital, senior living, home health, corporate, rehab
- Volume of this persona type in a typical facility (how many beds, residents, employees fit this profile?)
- Current product in use and its shortcomings
- Who ACTUALLY makes the purchase decision vs. who influences it

**3. Institutional Pain** (NOT personal pain — operational pain)
- Staff time wasted on current products (helping patients/residents put on tight compression socks)
- Patient/resident complaints with current products
- Skin integrity concerns from sock marks, tightness, poor fit
- Non-compliance with compression therapy due to difficulty
- Procurement complexity and vendor fatigue

**4. Outcomes Evidence** (from review data, reframed for institutions)
The SAME review data, translated into institutional language:
- "My mom can put them on herself" → Reduced staff assistance time per resident/patient
- "No more red marks on my legs" → Fewer skin integrity incidents to document
- "I actually WEAR these every day" → Higher compression therapy compliance rate
- "Replaced all my old socks" → Standardization potential (one product, multiple use cases)
- Include specific percentages from the data

**5. ROI Narrative**
- Cost-per-unit vs. staff time saved
- Reduced complaint rates (projected from satisfaction data)
- Compliance improvement (from ease-of-use data)
- Standardization benefits (from range of conditions served)
- Patient/resident satisfaction metrics (star ratings, NPS proxy)

**6. Procurement Psychology**
- **Budget Cycle:** When do institutional buyers evaluate new products?
- **Committee Dynamics:** Who needs to approve? (purchasing, clinical, admin)
- **Pilot Pathway:** How do they typically trial new products?
- **Risk Tolerance:** What evidence reduces perceived risk? (certifications, volume discounts, satisfaction guarantees)
- **Competitive Displacement:** What makes them switch from current vendor?

**7. Institutional Messaging**
- **Pitch Headline:** The ONE sentence for this institutional buyer type
- **Outcomes Proof Points:** 3-5 evidence-backed claims for the sales presentation
- **Operational Benefit:** Time, cost, and compliance improvements
- **Scaling Story:** How one facility's success becomes a regional/national rollout

**8. Review Quotes as Outcomes Evidence**
3-5 real reviews translated into institutional value language (tag each with the operational metric it supports).`;
}

/* ------------------------------------------------------------------ */
/*  US vs CA and Citation Instructions                                  */
/* ------------------------------------------------------------------ */

function buildUsVsCaInstructions(markets: ('US' | 'CA')[]): string {
  if (markets.length < 2) return '';
  return `**7. US vs. CA Market Comparison**

For this persona, provide a SIDE-BY-SIDE comparison of how this segment plays out in the United States vs. Canada. Use the heading "### US vs. CA:" to start this section.

For EACH market (US and Canada), cover:
- **Market Size & Penetration:** How large is this persona's segment in each country? (Use exact numbers with citations.)
- **Key Demographics:** Population stats relevant to this persona (diabetic population, seniors, healthcare workers, etc.) for each country
- **Competitive Landscape:** Who are the main competitors for this persona in each market? What's the key differentiator?
- **Retail/Distribution:** Which retailers or channels are most important for reaching this persona in each market?
- **Pricing & Positioning:** Any differences in price sensitivity, willingness-to-pay, or positioning between the two markets?
- **Strategic Differences:** What should Viasox do DIFFERENTLY in US vs. Canada for this persona? Be specific.

Format this as a clear side-by-side comparison. Use 🇺🇸 and 🇨🇦 emoji flags to visually separate the two markets.`;
}

function buildCitationInstructions(): string {
  return `**8. Source Citations**

CRITICAL: Every market data point MUST include a source citation in the format: [Source: Name, Year]

Examples:
- "The US compression sock market is valued at ~$850M–$1.1B [Source: Mordor Intelligence, 2025]"
- "37M diagnosed diabetics in the US [Source: CDC, 2024]"
- "Canadian sock market is ~CAD $1.1B [Source: Statistics Canada, 2024]"

Use the market context data provided above for specific figures and their sources. Do NOT invent statistics. Every number that comes from market research (not from the review data) must have a citation.`;
}

/* ------------------------------------------------------------------ */
/*  Market Analysis Instructions (per channel)                         */
/* ------------------------------------------------------------------ */

function buildMarketAnalysisInstructions(channel: PersonaChannel, markets: ('US' | 'CA')[]): string {
  const marketLabel = markets.length === 2 ? 'US & Canadian' : markets[0] === 'US' ? 'US' : 'Canadian';

  const base = `## MARKET POSITIONING & OPPORTUNITY ANALYSIS

After building each persona, add a **Market Opportunity** section that connects this persona to the broader ${marketLabel} market:

### For Each Persona, Include:

**1. TAM Connection & Segment Weight**
- How large is this persona's addressable segment in the ${marketLabel} market?
- Use the market context data above to estimate: what percentage of the total market does this persona represent?
- What is the growth trajectory for this segment? (aging population, diabetic growth, healthcare worker demand, etc.)
- **Viasox Weight:** What percentage of Viasox reviews does this persona represent? How does this compare to the market weight?
- **Significance Score:** Based on review volume, rating, and concentration index — how strategically important is this persona to each product line?

**2. Market vs. Viasox Comparison** (CRITICAL — use the Segment Benchmark data)
- Compare Viasox's internal segment share against the market benchmark share
- If Viasox over-indexes: Is this a strength to protect or a sign of saturation?
- If Viasox under-indexes: Is this untapped opportunity? What would it take to capture more?
- Is this segment growing faster or slower in the market than in Viasox's data?
- Classify as: "Established Core" / "Growth Engine" / "Emerging Opportunity" / "Niche Strength" / "Underserved Whitespace" (see Segment Comparison Framework)

**3. Cross-Purchase & Overlap Insights** (from cross-segment data)
- Which OTHER segments does this persona overlap with most? (use the identity × motivation overlap data)
- Is there cross-over in purchase behavior between this persona and others?
- Which product lines does this persona buy across? Is there a dominant product?
- Use the concentration index: does this persona over-index in one product line?

**4. Market Positioning**
- Where does Viasox sit for this persona relative to the market? (price tier, positioning, differentiation)
- What is the "medical-fashion gap" opportunity for this specific persona?
- What white space exists that Viasox can own?
- What are competitors doing in this segment? Where are they weak?

**5. Growth & Emerging Signals**
- Is this a NEW or EMERGING segment for Viasox? (small but growing fast)
- Where is Viasox growth coming from — which segments are accelerating?
- Are there demographic groups weighted heavily in the market that Viasox is NOT serving today?
- Is Viasox's growth in this segment outpacing the market?

**6. Expansion Opportunities**
- What adjacent segments could be captured by messaging tailored to this persona?
- What seasonal, promotional, or trend-based opportunities exist?
- Are there underserved sub-segments within this persona type?
- Which competitive product segments are growing in the market that Viasox doesn't play in?`;

  if (channel === 'Retail') {
    return `${base}

**4. Retail Channel Fit Analysis** (CRITICAL for Retail channel)
For each persona, analyze which retailers are the best fit:

- **Score each relevant retailer** on: demographic alignment, price fit, category positioning, promotional alignment, purchase behavior match, competition intensity (1-5 each)
- **Identify the priority retailers** (top 2-3) for this specific persona
- **Explain the strategic overlap**: Why does this persona's profile match this retailer's shopper base?
  - Example format: "The Senior + Pain Relief persona aligns strongly with Shoppers Drug Mart (Score: 27/30) because: SDM's median shopper age (55+) matches our senior segment, the pharmacy-adjacent positioning normalizes the health purchase, PC Optimum points drive the repeat purchase behavior we see in reviews (X% mention buying again), and the weekly flyer reaches this demographic's promotion-responsive behavior."
- **Identify gaps**: Which retailers are NOT a fit for this persona, and why?
- **Cross-retailer strategy**: If this persona shops at multiple retailers, what's the differentiated positioning for each?

**5. Planogram & Shelf Strategy**
- Where should the product sit on the shelf at each priority retailer?
- What's the category adjacency opportunity? (placed next to diabetic supplies? fashion socks? foot care?)
- Endcap and seasonal opportunities for this persona

${buildUsVsCaInstructions(markets)}

${buildCitationInstructions()}

IMPORTANT: Clearly distinguish between data from reviews (labeled "From Review Data") and market context (labeled "Market Context"). Do not present market estimates as if they came from the review data.`;
  }

  if (channel === 'Wholesale') {
    return `${base}

**4. Institutional Channel Opportunity**
- Which institutional settings have the highest concentration of this persona type?
- What's the typical procurement pathway for these institutions?
- What's the volume opportunity per facility?
- How does this persona's outcomes evidence translate into institutional purchasing criteria?

${buildUsVsCaInstructions(markets)}

${buildCitationInstructions()}

IMPORTANT: Clearly distinguish between data from reviews (labeled "From Review Data") and market context (labeled "Market Context"). Do not present market estimates as if they came from the review data.`;
  }

  // DTC
  return `${base}

**4. DTC Channel Strategy**
- Where can this persona be reached most efficiently? (platform, ad format, placement)
- What's the estimated acquisition cost trajectory for this segment?
- How does this persona's segment size in our data suggest untapped demand in the broader market?
- What look-alike audiences could be built from this persona?

${buildUsVsCaInstructions(markets)}

${buildCitationInstructions()}

IMPORTANT: Clearly distinguish between data from reviews (labeled "From Review Data") and market context (labeled "Market Context"). Do not present market estimates as if they came from the review data.`;
}

/* ------------------------------------------------------------------ */
/*  Core persona system prompt                                         */
/* ------------------------------------------------------------------ */

function buildPersonaSystem(
  params: PersonaParams,
  analysis: FullAnalysis,
): string {
  return `${buildSystemBase()}

## PERSONA GENERATION ENGINE

You create deeply researched customer personas based on actual review data, behavioral psychology, and marketing expertise. Each persona must feel like a REAL human being — not a demographic slide.

${buildChannelFramework(params.channel)}

## PERSONA CONSTRUCTION METHOD

Each persona is built at the INTERSECTION of a motivation segment (WHY they buy) and an identity segment (WHO they are). The user has selected specific personas from the actual data. Build EACH selected persona using this method:

1. **Start with the data.** Look at the segment frequencies, pain points, benefits, transformation patterns, and quotes for this intersection.
2. **Find the human.** Behind every data point is a person. What specific daily moment captures this persona's experience?
3. **Apply the frameworks.** Use Schwartz (desires, identifications, beliefs), Hopkins (specificity, service), Neumeier (gut feeling, trust), and Bly (benefits over features, internal dialogue) to add psychological depth.
4. **Ground every claim.** No invented statistics. Every frequency, quote, and pattern must come from the actual data.

## EXPERTISE PRINCIPLES (Apply Throughout)

### From Breakthrough Advertising (Schwartz)
- Copy cannot create desire — only channel existing desire onto a product
- Three dimensions of the prospect's mind: Desires, Identifications, Beliefs
- Awareness level determines approach: Most Aware→price. Product Aware→differentiation. Solution Aware→proof. Problem Aware→crystallize desire. Unaware→identification.

### From Scientific Advertising (Hopkins)
- Specificity IS credibility. Ground every claim in exact data.
- The best advertising is built on service — show how the product serves their specific need
- Address one person's self-interest, not a crowd

### From The Brand Gap (Neumeier)
- Brand = gut feeling. Not what YOU say it is — what THEY say it is.
- Trust = Reliability + Delight
- Charismatic brands: people believe there's no substitute

### From The Copywriter's Handbook (Bly)
- Write to ONE person. Benefits beat features. The REAL benefit is one level deeper than you think.
- Specifics beat generalities. The best copy mirrors the prospect's own internal dialogue.

## TWO-LAYER SEGMENTATION MODEL

### MOTIVATION SEGMENTS (Why They Buy)
Comfort Seeker, Pain & Symptom Relief, Style Conscious, Quality & Value, Daily Wear Convert, Skeptic Converted, Emotional Transformer, Repeat Loyalist

### IDENTITY SEGMENTS (Who They Are)
Healthcare Worker, Caregiver/Gift Buyer, Diabetic/Neuropathy, Standing Worker, Accessibility/Mobility, Traveler, Senior, Pregnant/Postpartum, Medical/Therapeutic

${formatCrossSegmentData(analysis, params.product)}

${params.includeMarketAnalysis ? buildMarketContext(params.channel === 'Retail', params.markets) : ''}

${params.includeMarketAnalysis ? buildMarketAnalysisInstructions(params.channel, params.markets) : ''}

## PRODUCT DATA
${getProductAnalysis(analysis, params.product)}`;
}

/* ------------------------------------------------------------------ */
/*  User prompt                                                        */
/* ------------------------------------------------------------------ */

function buildPersonaUser(params: PersonaParams): string {
  const personaList = params.selectedPersonas.map((p, i) => `${i + 1}. ${p}`).join('\n');

  const channelNote = params.channel === 'DTC'
    ? 'Each persona should be immediately actionable — a team member should be able to read it and write an ad, email, or landing page for this exact person.'
    : params.channel === 'Retail'
      ? 'Each persona should be reframed as sell-through evidence for retail buyers. The consumer data becomes proof of demand.'
      : 'Each persona should be translated into institutional outcomes evidence. Consumer reviews become operational ROI proof.';

  const marketNote = params.includeMarketAnalysis
    ? `\n\nINCLUDE MARKET ANALYSIS: After each persona's core profile, add a comprehensive "Market Opportunity" section that:
1. Compares this persona's weight in Viasox data vs. the total market (using segment benchmarks above)
2. Identifies whether Viasox is over-indexed or under-indexed for this segment
3. Uses the cross-segment overlap data to show which other personas this one overlaps with
4. Uses the product affinity / concentration index to show which products this persona dominates
5. Classifies as Established Core / Growth Engine / Emerging Opportunity / Niche Strength / Underserved Whitespace
6. ${
        params.channel === 'Retail'
          ? 'Include retailer fit scoring with specific overlap analysis between our customer data and each retailer\'s shopper base.'
          : params.channel === 'Wholesale'
            ? 'Include institutional channel opportunity analysis with volume estimates and procurement pathway insights.'
            : 'Include DTC channel strategy with platform targeting and look-alike audience recommendations.'
      }
${params.markets.length >= 2 ? `7. Add a **US vs. CA** subsection (heading: "### US vs. CA:") comparing this persona across both markets — demographics, market size, retailers, strategic differences. Use 🇺🇸 and 🇨🇦 flags.` : ''}

DEPTH REQUIREMENTS: For every market finding, structure your analysis as:
- **What:** The data point or insight (with [Source: Name, Year] citation)
- **Why It Matters:** Why this is strategically relevant for Viasox specifically
- **How to Act:** A specific, actionable recommendation Viasox can implement

Do NOT just list bullet points. Provide the REASONING and strategic IMPLICATIONS behind each data point. Executives need the "so what" — not just the "what."

SOURCE CITATIONS: Every market data point that comes from external research MUST include an inline citation: [Source: Name, Year]. Use the source data provided in the market context.

IMPORTANT: Clearly label what comes from "Review Data" vs. "Market Context" so executives can distinguish between our proprietary insights and market estimates.`
    : '';

  return `Generate the following customer personas for ${params.product}, optimized for the ${params.channel} channel:

${personaList}

${channelNote}${marketNote}

## OUTPUT FORMAT

For each persona, use the full structure defined in the channel framework. Separate each persona with a clear divider.${params.includeMarketAnalysis ? ' Include the Market Opportunity section after each persona\'s core profile.' : ''}

## CRITICAL RULES
- Ground EVERY claim in actual review data — specific frequencies, percentages, and real quotes
- Each persona must feel like a REAL person, not a marketing slide
- Do NOT reproduce known persona stereotypes — build entirely from the data
- Use customer language, not marketing speak
- The output will be shared with executives — make it polished, insightful, and presentation-ready
- Every insight should be specific enough that someone unfamiliar with the brand could immediately understand and act on it
- Use the SEGMENT WEIGHT data and CONCENTRATION INDEX to show each persona's strategic importance to this specific product line
- Use the CROSS-OVER ANALYSIS to explain which personas overlap and what this means for targeting${params.includeMarketAnalysis ? '\n- When referencing market data, always distinguish "From Review Data" vs. "Market Context"\n- When comparing Viasox segments to market benchmarks, explicitly state the Viasox % vs. market % and what the gap means\n- Identify at least one EMERGING OPPORTUNITY and one UNDERSERVED WHITESPACE if the data supports it\n- For EVERY market insight, provide the What → Why It Matters → How to Act structure. Do NOT list shallow bullet points.\n- Include [Source: Name, Year] inline citations on all external market data\n- Write each market section with enough depth that someone could build a strategy deck from it' : ''}`;
}

/* ------------------------------------------------------------------ */
/*  Public export                                                      */
/* ------------------------------------------------------------------ */

export function buildPersonaPrompt(
  params: PersonaParams,
  analysis: FullAnalysis,
): { system: string; user: string } {
  return {
    system: buildPersonaSystem(params, analysis),
    user: buildPersonaUser(params),
  };
}
