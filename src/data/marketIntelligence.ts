/**
 * Market Intelligence Data — Embedded Secondary Research
 *
 * This module contains publicly available market data about the sock/compression
 * market, retailer profiles, and channel characteristics for US and Canadian markets.
 *
 * Sources: Industry reports, retailer investor presentations, publicly available
 * demographic data. All figures are approximate and should be labeled as
 * "market context" (not proprietary Viasox data) in outputs.
 *
 * Last updated: February 2026
 */

/* ------------------------------------------------------------------ */
/*  Structured Market Data (for deterministic UI components)           */
/* ------------------------------------------------------------------ */

export interface MarketDataPoint {
  label: string;
  value: string;
  source: string;
  sourceYear: number;
}

export interface GeoMarketData {
  country: 'US' | 'CA';
  flag: string;
  countryName: string;
  currency: string;
  marketSize: MarketDataPoint;
  compressionSegment: MarketDataPoint;
  medicalCompression?: MarketDataPoint;
  fashionLifestyle?: MarketDataPoint;
  dtcBrands?: MarketDataPoint;
  avgHouseholdSpend?: MarketDataPoint;
  compressionPriceRange?: MarketDataPoint;
  diabeticPopulation: MarketDataPoint;
  seniorPopulation: MarketDataPoint;
  healthcareWorkers: MarketDataPoint;
  standingWorkers: MarketDataPoint;
  keyRetailers: string[];
  keyDifferences: string[];
}

export const US_MARKET_DATA: GeoMarketData = {
  country: 'US',
  flag: '\uD83C\uDDFA\uD83C\uDDF8',
  countryName: 'United States',
  currency: 'USD',
  marketSize: { label: 'Total Sock Market', value: '~$9.5B', source: 'Grand View Research', sourceYear: 2025 },
  compressionSegment: { label: 'Compression Segment', value: '~$850M\u2013$1.1B', source: 'Mordor Intelligence', sourceYear: 2025 },
  medicalCompression: { label: 'Medical Compression', value: '~$450M', source: 'Mordor Intelligence', sourceYear: 2025 },
  fashionLifestyle: { label: 'Fashion/Lifestyle Compression', value: '~$400M', source: 'Allied Market Research', sourceYear: 2024 },
  dtcBrands: { label: 'DTC Sock Brands', value: '~$1.2B', source: 'eMarketer', sourceYear: 2025 },
  avgHouseholdSpend: { label: 'Avg Household Spend (Socks)', value: '~$120/yr', source: 'Bureau of Labor Statistics', sourceYear: 2024 },
  compressionPriceRange: { label: 'Compression Price Range', value: '$15\u201345 med, $8\u201325 lifestyle', source: 'Industry Average', sourceYear: 2025 },
  diabeticPopulation: { label: 'Diabetic Population', value: '37M diagnosed', source: 'CDC', sourceYear: 2024 },
  seniorPopulation: { label: 'Seniors (65+)', value: '58M', source: 'US Census Bureau', sourceYear: 2024 },
  healthcareWorkers: { label: 'Healthcare Workers', value: '4.2M+', source: 'Bureau of Labor Statistics', sourceYear: 2024 },
  standingWorkers: { label: 'Standing Workforce', value: '15M+', source: 'Bureau of Labor Statistics', sourceYear: 2024 },
  keyRetailers: ['CVS Health', 'Walgreens', 'Walmart', 'Target', 'Amazon', 'Costco'],
  keyDifferences: [
    'Larger DTC sock market ($1.2B, growing 12\u201315% YoY)',
    'Price-competitive pharmacy channel (CVS, Walgreens)',
    'Amazon dominates discovery with 10,000+ compression listings',
    'Higher competitive intensity across all segments',
  ],
};

export const CA_MARKET_DATA: GeoMarketData = {
  country: 'CA',
  flag: '\uD83C\uDDE8\uD83C\uDDE6',
  countryName: 'Canada',
  currency: 'CAD',
  marketSize: { label: 'Total Sock Market', value: '~$1.1B CAD', source: 'Statistics Canada / Industry Est.', sourceYear: 2025 },
  compressionSegment: { label: 'Compression Segment', value: '~$120M\u2013$150M CAD', source: 'Industry Estimates', sourceYear: 2025 },
  diabeticPopulation: { label: 'Diabetic Population', value: '3.4M diagnosed', source: 'Diabetes Canada', sourceYear: 2024 },
  seniorPopulation: { label: 'Seniors (65+)', value: '7M', source: 'Statistics Canada', sourceYear: 2024 },
  healthcareWorkers: { label: 'Healthcare Workers', value: '450K+', source: 'Statistics Canada', sourceYear: 2024 },
  standingWorkers: { label: 'Standing Workforce', value: '1.8M+', source: 'Statistics Canada', sourceYear: 2024 },
  keyRetailers: ['Shoppers Drug Mart', 'Rexall', 'Walmart Canada', 'Canadian Tire', 'Amazon.ca', 'Well.ca'],
  keyDifferences: [
    'Pharmacy channel stronger (Shoppers Drug Mart, Rexall)',
    'Consumers spend ~15% more per pair on premium socks',
    'Bilingual packaging required for national distribution',
    'Less crowded Amazon compression category vs. US',
    'PC Optimum loyalty program drives repeat purchase behavior',
  ],
};

/* ------------------------------------------------------------------ */
/*  Market Size & TAM Context                                          */
/* ------------------------------------------------------------------ */

export const MARKET_CONTEXT = `## MARKET CONTEXT (Secondary Research \u2014 Label as "Market Context" in output)

### North American Sock & Compression Market

**US Market:**
- Total US sock market: ~$9.5B annually [Source: Grand View Research, 2025]
- Compression sock/hosiery segment: ~$850M\u2013$1.1B (growing 6-8% YoY) [Source: Mordor Intelligence, 2025]
- Medical compression category: ~$450M (prescription + OTC) [Source: Mordor Intelligence, 2025]
- Fashion/lifestyle compression: ~$400M (fastest growing sub-segment) [Source: Allied Market Research, 2024]
- DTC sock brands collectively: ~$1.2B (growing 12-15% YoY) [Source: eMarketer, 2025]
- Average household spend on socks: ~$120/year [Source: Bureau of Labor Statistics, 2024]
- Average compression sock price: $15-45/pair (medical), $8-25/pair (lifestyle) [Source: Industry Average, 2025]

**Canadian Market:**
- Total Canadian sock market: ~$1.1B CAD annually [Source: Statistics Canada / Industry Estimates, 2025]
- Compression segment: ~$120M\u2013$150M CAD [Source: Industry Estimates, 2025]
- Key difference: pharmacy channel is stronger in Canada (Shoppers Drug Mart, Rexall, Jean Coutu)
- Canadian consumers spend ~15% more per pair on premium socks vs. US [Source: NPD Group Canada, 2024]
- Bilingual packaging requirements for national distribution

**Key Market Trends:**
- "Wellness from the ground up" \u2014 socks moving from commodity to wellness category
- Medical-fashion convergence: products that work AND look good (Viasox's positioning)
- Aging population: 65+ demographic growing 3% annually in both US/CA [Source: US Census Bureau / Statistics Canada, 2024]
- Remote/hybrid work hasn't reduced demand \u2014 comfort at home is now a category
- Subscription and bundle models growing in DTC sock space
- Compression awareness increasing via social media (TikTok/Instagram wellness content)

**Viasox Positioning Context:**
- Price point ($20-35/pair) positions in premium-accessible tier
- Above mass-market ($5-12) but below medical-grade ($40-80)
- Sweet spot: consumers who NEED support but want style \u2014 the "medical-fashion gap"
- Key differentiator: Non-binding wide-calf, no-mark design with fashion-forward patterns
- The "medical-fashion gap" is the most underserved segment in both US and CA markets

### Category Growth Drivers
1. **Aging population** \u2014 Baby Boomers entering peak compression need (65-80) [Source: US Census Bureau, 2024]
2. **Diabetic population growth** \u2014 37M Americans [Source: CDC, 2024], 3.4M Canadians diagnosed [Source: Diabetes Canada, 2024]
3. **Healthcare worker demand** \u2014 4.2M+ nurses in US [Source: Bureau of Labor Statistics, 2024], 450K+ in Canada [Source: Statistics Canada, 2024]
4. **Standing workforce** \u2014 Retail, hospitality, warehouse (growing with e-commerce fulfillment)
5. **Travel recovery** \u2014 Post-pandemic travel driving compression awareness
6. **Style-conscious health** \u2014 Millennials/Gen-X refusing "medical look" products`;

/* ------------------------------------------------------------------ */
/*  Retailer Profiles \u2014 US                                             */
/* ------------------------------------------------------------------ */

export const US_RETAILERS = `### US RETAILER PROFILES

**CVS Health**
- 9,000+ locations nationwide
- Shopper demographics: 55% female, median age 52, health-conscious, insurance-driven
- Price positioning: Mid to premium, strong private label (Gold Emblem, CVS Health brand)
- Compression/sock category: Currently dominated by Dr. Scholl's, Copper Fit, and medical brands
- Strategic fit signals: Strong pharmacy-adjacent placement, health & wellness focus, ExtraCare loyalty program drives repeat purchases
- Key insight: CVS shoppers are already in a "health mindset" when shopping \u2014 lower barrier to compression discovery
- Promotional behavior: Weekly circulars, ExtraCare coupons, seasonal health promotions

**Walgreens**
- 8,600+ locations
- Shopper demographics: 58% female, median age 50, convenience-driven, slightly lower income than CVS
- Price positioning: Mid-range, heavy promotional calendar
- Compression/sock category: Similar assortment to CVS, strong private label (Walgreens brand)
- Strategic fit signals: Neighborhood accessibility, health & wellness positioning, Balance Rewards program
- Key insight: Walgreens shoppers are more promotion-responsive \u2014 BOGO and percentage-off promotions drive trial
- Promotional behavior: Weekly ad, points-based rewards, seasonal endcap opportunities

**Walmart**
- 4,700+ US locations
- Shopper demographics: Broad, price-sensitive, 56% female, median household income ~$76K
- Price positioning: Everyday low price, strong private label (Equate, George), resists premium
- Compression/sock category: Mass-market brands dominate, low shelf price expectation ($5-15)
- Strategic fit signals: Volume potential but price pressure is intense
- Key insight: Viasox's $20-35 price point is a challenging fit unless positioned in Health & Wellness (not hosiery). The "medical device aisle" positioning could justify premium.
- Promotional behavior: Rollback pricing, online-to-store, limited circular activity

**Target**
- 1,950+ locations
- Shopper demographics: 60% female, median age 42, higher income ($80K+), style-conscious
- Price positioning: "Expect More, Pay Less" \u2014 premium-accessible, design-forward
- Compression/sock category: Limited compression, strong in fashion socks
- Strategic fit signals: Target shoppers value design + function \u2014 aligns with Viasox's "style meets support" positioning. Target's wellness expansion (partnership with CVS in-store pharmacies) is opening health-adjacent categories.
- Key insight: Best US mass-retail fit for Viasox's brand positioning. Style-forward packaging could command premium shelf space.
- Promotional behavior: Target Circle deals, seasonal resets, strong digital/social presence

**Amazon**
- 310M+ active customer accounts
- Shopper demographics: Broadest possible, 51% female, median age 37, convenience-first
- Price positioning: Algorithmic, comparison-driven, reviews are king
- Compression/sock category: Highly competitive, 10,000+ compression sock listings
- Strategic fit signals: Review count and star rating are the #1 conversion driver \u2014 Viasox's review volume is a major asset here
- Key insight: Amazon is a "proof engine" \u2014 high ratings + review volume = organic discovery. But margin pressure is real. Best used as acquisition channel that drives to DTC for repeat.
- Promotional behavior: Lightning Deals, Subscribe & Save, Prime Day, A+ Content

**Costco**
- 600+ US locations
- Shopper demographics: Higher income ($105K+ median), 52% female, value-oriented but quality-conscious
- Price positioning: Premium brands at warehouse pricing, limited SKU strategy
- Compression/sock category: Limited but growing \u2014 Kirkland brand socks are a top seller
- Strategic fit signals: Costco shoppers will pay for quality but expect volume value. Bundle packs (3-pair, 6-pair) at compelling per-unit price could work.
- Key insight: Costco requires proven sell-through before expanding. Roadshow (demo events) are the best entry point. The gift-buying segment in reviews suggests multi-pack appeal.
- Promotional behavior: Limited promotional activity, Costco Connection magazine, roadshow/demo events`;

/* ------------------------------------------------------------------ */
/*  Retailer Profiles \u2014 Canada                                         */
/* ------------------------------------------------------------------ */

export const CA_RETAILERS = `### CANADIAN RETAILER PROFILES

**Shoppers Drug Mart (Loblaw-owned)**
- 1,350+ locations across Canada
- Shopper demographics: 62% female, median age 55+, health-focused, loyalty-driven (PC Optimum)
- Price positioning: Premium pharmacy, higher price tolerance than US drugstores
- Compression/sock category: Strong medical/wellness aisle, pharmacist recommendations carry weight
- Strategic fit signals: STRONGEST Canadian fit for Viasox. Older demographic matches our core review segments. PC Optimum points drive repeat purchases. Pharmacist endorsement pathway. Premium price tolerance.
- Key insight: Shoppers Drug Mart customers are promotion-responsive through the FLYER specifically \u2014 weekly flyer inclusion drives significant traffic. The "Beauty Boutique" and wellness section expansion shows appetite for premium health products.
- Promotional behavior: Weekly flyer is CRITICAL (the CEO specifically noted this), PC Optimum points multiplier events (20x points = ~equivalent to 30% off), seasonal health awareness campaigns

**Rexall (McKesson Canada)**
- 400+ locations, concentrated in Ontario and Western Canada
- Shopper demographics: Similar to Shoppers but slightly younger (median 48), more convenience-driven
- Price positioning: Mid-premium, pharmacy-forward
- Compression/sock category: Smaller assortment but pharmacist-led recommendations
- Strategic fit signals: Smaller chain = easier to get meetings, pharmacist relationship matters
- Key insight: Rexall is a good "pilot market" for Canadian retail \u2014 prove sell-through here before approaching Shoppers
- Promotional behavior: Digital coupons, loyalty program, pharmacist recommendations

**Canadian Tire**
- 500+ locations
- Shopper demographics: 55% male, broad age range, value-oriented, "Canadian lifestyle" brand
- Price positioning: Mid-range, heavy promotional calendar
- Compression/sock category: Work socks, outdoor socks, limited medical
- Strategic fit signals: Weaker fit \u2014 male skew and utility positioning doesn't align with Viasox's core review demographic. However, the "Standing Worker" segment could be addressed here.
- Key insight: Only consider if targeting the work/standing/outdoor segment specifically
- Promotional behavior: Canadian Tire money (loyalty), weekly flyer, seasonal events

**Walmart Canada**
- 400+ locations
- Shopper demographics: Similar to US Walmart but slightly higher income floor (Canadian market dynamics)
- Price positioning: EDLP but slightly more accepting of premium than US Walmart
- Compression/sock category: Mass-market dominated
- Strategic fit signals: Same price pressure concerns as US. Health & Wellness aisle positioning is the only viable path.
- Key insight: Better fit than US Walmart due to higher Canadian willingness to pay for health products, but still challenging
- Promotional behavior: Rollback, Great Value private label pressure

**Amazon.ca**
- Growing rapidly in Canada, ~15M active shoppers
- Strategic fit signals: Same dynamics as Amazon US but less competition in compression category
- Key insight: Canadian Amazon compression category is less crowded \u2014 faster path to page-1 ranking

**Well.ca (Online-only, health-focused)**
- Canada's largest online health & wellness retailer
- Shopper demographics: 70% female, 30-55, health-conscious, premium-willing
- Strategic fit signals: Strong alignment with Viasox positioning. Lower barrier to entry than brick-and-mortar.
- Key insight: Good Canadian DTC complement \u2014 drives awareness among health-forward shoppers`;

/* ------------------------------------------------------------------ */
/*  Retail Fit Scoring Framework                                       */
/* ------------------------------------------------------------------ */

export const RETAIL_FIT_FRAMEWORK = `### RETAIL FIT SCORING FRAMEWORK

When analyzing fit between Viasox's customer data and a retailer, evaluate on these dimensions:

1. **Demographic Alignment** (from review data)
   - Does the retailer's shopper age/gender match our review demographics?
   - Do our identity segments (Healthcare Worker, Senior, Caregiver, etc.) overlap with their shopper base?

2. **Price Point Fit**
   - Does Viasox's $20-35 price point align with the retailer's category price architecture?
   - Are their shoppers willing to pay premium for quality/health products?

3. **Category Positioning**
   - Where would Viasox sit: Medical aisle? Fashion/lifestyle? Hosiery? Wellness?
   - Does the retailer have an existing wellness/health expansion strategy?

4. **Promotional Alignment**
   - Do Viasox's margin economics support the retailer's promotional expectations?
   - Does the retailer's promotional style (flyer, digital, points) reach our target segments?

5. **Purchase Behavior Match**
   - Do our repeat purchase signals (from reviews) match the retailer's basket building strategy?
   - Does the gift-buying segment align with the retailer's gifting category?

6. **Competition Intensity**
   - How crowded is the compression/specialty sock shelf at this retailer?
   - Is there white space Viasox can own?

Score each dimension 1-5 and provide a total fit score with strategic recommendation:
- 25-30: "Priority Target" \u2014 pursue aggressively
- 18-24: "Strong Opportunity" \u2014 pursue with tailored strategy
- 12-17: "Conditional Fit" \u2014 pursue only for specific segments
- Below 12: "Not Recommended" \u2014 resource better spent elsewhere`;

/* ------------------------------------------------------------------ */
/*  Market Segment Benchmarks \u2014 For Segment vs. Market Comparison       */
/* ------------------------------------------------------------------ */

export const MARKET_SEGMENT_BENCHMARKS = `### MARKET SEGMENT BENCHMARKS (Secondary Research \u2014 Label as "Market Context")

Use this data to compare Viasox's internal segment weights against the broader market.
When Viasox's segment share EXCEEDS the market share \u2192 we are over-indexed (strength or saturation).
When Viasox's segment share is BELOW the market share \u2192 untapped opportunity.

**Consumer Motivation Segments in the Compression/Specialty Sock Market (North America, 2025 est.):**

| Segment | Est. Market Share | Growth Rate (YoY) | Notes |
|---------|-------------------|-------------------|-------|
| Comfort/Wellness | ~35% | 8-10% | Largest and fastest growing \u2014 driven by aging + remote work comfort [Source: Grand View Research, 2025] |
| Pain & Symptom Relief | ~25% | 5-7% | Stable, medical-driven \u2014 tied to diabetic + neuropathy population growth [Source: Mordor Intelligence, 2025] |
| Style/Fashion-Forward | ~12% | 15-20% | Fastest growing sub-segment \u2014 driven by Gen-X/Millennial rejection of "medical look" [Source: Allied Market Research, 2024] |
| Quality & Value Seekers | ~15% | 3-5% | Steady, loyalty-driven \u2014 premium brands gaining vs. commodity [Source: NPD Group, 2024] |
| Daily Wear / Habitual | ~8% | 4-6% | Growing with subscription model adoption [Source: eMarketer, 2025] |
| Skeptic / First-Time Compression | ~5% | 10-12% | Growing fast as awareness increases via social media [Source: Industry Estimates, 2025] |

**Consumer Identity Segments in the Market:**

| Segment | US Population | CA Population | Compression Penetration | Growth Driver |
|---------|---------------|---------------|------------------------|---------------|
| Seniors (65+) | 58M | 7M | ~18% | Aging Boomers, 3% pop growth/yr [Source: US Census / Statistics Canada, 2024] |
| Diabetic/Neuropathy | 37M | 3.4M | ~12% | 5% new diagnoses/yr, LOW penetration = huge upside [Source: CDC / Diabetes Canada, 2024] |
| Healthcare Workers | 4.2M | 450K | ~25% | Highest penetration, nursing demand growing [Source: BLS / Statistics Canada, 2024] |
| Standing Workers | 15M+ | 1.8M | ~5% | Massively underpenetrated \u2014 awareness is barrier [Source: BLS / Statistics Canada, 2024] |
| Caregivers/Gift Buyers | ~53M | ~8M | ~3% (buying for others) | Growing as aging population increases caregiver load [Source: AARP / Statistics Canada, 2024] |
| Travelers | ~90M frequent | ~8M | ~4% | Post-pandemic surge, DVT awareness growing [Source: US Travel Association, 2024] |
| Pregnant/Postpartum | ~3.6M | ~350K | ~8% | Stable, growing compression awareness during pregnancy [Source: CDC / Statistics Canada, 2024] |
| Accessibility/Mobility | ~61M | ~6.2M | ~7% | Large underserved population, growing with aging [Source: CDC / Statistics Canada, 2024] |

**Product Segment Growth (Compression/Specialty Sock Market):**

| Product Type | Est. Market Share | Growth Rate | Competitive Landscape |
|-------------|-------------------|-------------|----------------------|
| Medical-grade compression | ~40% | 3-4% | Mature, dominated by Sigvaris, Jobst, Juzo \u2014 prescription channel [Source: Mordor Intelligence, 2025] |
| Lifestyle compression | ~25% | 12-15% | Fast growth, fragmented \u2014 Bombas, Comrad, VIM & VIGR, Viasox [Source: Allied Market Research, 2024] |
| Non-binding / diabetic socks | ~15% | 8-10% | Growing with diabetic population \u2014 Dr. Comfort, Viasox, Sockwell [Source: Mordor Intelligence, 2025] |
| Athletic/recovery compression | ~12% | 6-8% | Saturating, dominated by CEP, 2XU, Nike [Source: Grand View Research, 2025] |
| Fashion socks (premium) | ~8% | 10-12% | Growing DTC segment \u2014 Stance, Bombas, Happy Socks [Source: eMarketer, 2025] |

**Key Competitors by Segment:**
- **Medical Compression:** Sigvaris, Jobst/BSN, Juzo, Therafirm \u2014 pharmacy and medical supply channels
- **Lifestyle Compression:** Bombas (mass appeal), Comrad (millennial DTC), VIM & VIGR (fashion-forward)
- **Diabetic/Non-Binding:** Dr. Comfort, Thorlos, Gentle Grip, Viasox
- **Premium/Fashion:** Stance, Happy Socks, Bombas, Smartwool

**Viasox Competitive Positioning Notes:**
- Viasox uniquely spans non-binding diabetic + compression + fashion \u2014 no single competitor owns this trifecta
- Bombas is the closest DTC comparison but lacks medical/compression credibility
- Medical brands (Sigvaris, Jobst) lack style appeal \u2014 Viasox fills the gap
- The "medical-fashion gap" remains the most defensible positioning in the market`;

/* ------------------------------------------------------------------ */
/*  Segment Comparison Prompt Framework                                 */
/* ------------------------------------------------------------------ */

export const SEGMENT_COMPARISON_FRAMEWORK = `### SEGMENT VS. MARKET COMPARISON FRAMEWORK

When comparing Viasox's segment data against market benchmarks, analyze:

**1. Opportunity Index**
For each segment, calculate: (Market % - Viasox %) = Opportunity Gap
- Positive gap = untapped opportunity (market is larger than our share)
- Negative gap = over-indexed strength (we dominate this segment vs. market)
- Flag any segment where market growth rate > 10% AND Viasox is under-indexed

**2. Growth Alignment**
- Which of Viasox's top segments are growing fastest in the market? (momentum alignment)
- Which segments are Viasox growing in that the market is flat/declining? (risk signal)
- Which high-growth market segments is Viasox NOT present in? (whitespace opportunity)

**3. Product-Market Fit Score**
For each product line (EasyStretch, Compression, Ankle Compression):
- Which market segments does this product serve best?
- Is the product positioned in a growing or declining market segment?
- Where is there product-segment mismatch (product could serve a segment but messaging doesn't target it)?

**4. Competitive Vulnerability**
- Where do competitors have strongholds that Viasox should avoid?
- Where are competitors weak that Viasox can exploit?
- Which segments have low competitive intensity + high growth = best opportunity?

**5. Emerging vs. Established**
Flag segments as:
- "Established Core" \u2014 >5% of Viasox reviews AND >15% market share
- "Growth Engine" \u2014 Growing >10% in market AND Viasox over-indexes
- "Emerging Opportunity" \u2014 <3% of Viasox reviews BUT >5% market share AND growing
- "Niche Strength" \u2014 <5% market share BUT Viasox over-indexes heavily (concentration index >1.5)
- "Underserved Whitespace" \u2014 Large market segment where Viasox has minimal presence

IMPORTANT: When presenting comparisons, always state:
- "From Review Data: Viasox [segment] represents X% of reviews"
- "Market Context: This segment represents ~Y% of the total market, growing Z% YoY"
- "Gap Analysis: [interpretation]"`;

/* ------------------------------------------------------------------ */
/*  Combined export for prompts                                        */
/* ------------------------------------------------------------------ */

export function buildMarketContext(includeRetailers: boolean, markets: ('US' | 'CA')[]): string {
  const sections = [MARKET_CONTEXT];

  // Always include segment benchmarks when market analysis is on
  sections.push(MARKET_SEGMENT_BENCHMARKS);
  sections.push(SEGMENT_COMPARISON_FRAMEWORK);

  if (includeRetailers) {
    if (markets.includes('US')) sections.push(US_RETAILERS);
    if (markets.includes('CA')) sections.push(CA_RETAILERS);
    sections.push(RETAIL_FIT_FRAMEWORK);
  }

  return sections.join('\n\n');
}
