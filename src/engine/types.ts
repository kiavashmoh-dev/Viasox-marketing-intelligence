// ─── Review Data ───────────────────────────────────────────────────────────

export interface RawReview {
  handle: string;
  review: string;
  rating: number;
  date: string;
  [key: string]: unknown;
}

export type ProductCategory = 'EasyStretch' | 'Compression' | 'Ankle Compression' | 'Other';

export interface OrganizedReviews {
  EasyStretch: RawReview[];
  Compression: RawReview[];
  'Ankle Compression': RawReview[];
  Other: RawReview[];
}

// ─── Pattern Analysis ──────────────────────────────────────────────────────

export interface PatternResult {
  count: number;
  percentage: number;
  quotes: string[];
}

export interface CategoryAnalysis {
  [patternName: string]: PatternResult;
}

export interface TransformationStory {
  review: string;
  rating: number | string;
  date: string;
}

export interface ProductAnalysis {
  productName: ProductCategory;
  totalReviews: number;
  averageRating: number;
  fiveStarPercent: number;
  oneStarPercent: number;
  pain: CategoryAnalysis;
  benefits: CategoryAnalysis;
  transformation: CategoryAnalysis;
  segments: CategoryAnalysis;
  transformationStories: TransformationStory[];
}

export interface FullAnalysis {
  totalReviews: number;
  breakdown: Record<ProductCategory, number>;
  products: Partial<Record<ProductCategory, ProductAnalysis>>;
  segmentBreakdown?: SegmentBreakdown;
  /** Year-over-year trends per product and overall (consultant feedback item 4) */
  yearlyTrends?: YearlyTrends;
}

// ─── Deterministic Segment Discovery ──────────────────────────────────────

export type SegmentLayer = 'identity' | 'motivation';

export interface SegmentProfile {
  segmentName: string;
  layer: SegmentLayer;
  totalReviews: number;
  percentage: number;
  byProduct: Record<string, { count: number; percentage: number }>;
  topBenefits: Array<{ name: string; count: number; percentage: number }>;
  topPains: Array<{ name: string; count: number; percentage: number }>;
  topTransformations: Array<{ name: string; count: number; percentage: number }>;
  averageRating: number;
  fiveStarPercent: number;
  representativeQuotes: string[];
}

export interface SegmentBreakdown {
  totalReviews: number;
  segments: SegmentProfile[];
  unsegmented: { count: number; percentage: number };
  multiSegment: { count: number; percentage: number };
  /** Cross-segment overlap: which identity × motivation pairs co-occur most */
  crossSegmentOverlap?: CrossSegmentOverlap[];
  /** Product affinity: which segments dominate each product line */
  productAffinity?: ProductAffinityMap;
}

// ─── Cross-Segment Analytics (Consultant Request) ─────────────────────────

/** Tracks how often an identity segment overlaps with a motivation segment */
export interface CrossSegmentOverlap {
  identity: string;
  motivation: string;
  reviewCount: number;
  /** Percentage of the identity segment that also matches this motivation */
  percentOfIdentity: number;
  /** Percentage of the motivation segment that also matches this identity */
  percentOfMotivation: number;
  /** Average rating for reviews in this overlap */
  avgRating: number;
  /** Product distribution for this overlap pair */
  byProduct: Record<string, { count: number; percentage: number }>;
}

/** Per-product: ranked segments with share-of-product and concentration index */
export interface ProductAffinityEntry {
  segmentName: string;
  layer: SegmentLayer;
  /** How many of this product's reviews match this segment */
  count: number;
  /** Percentage of this product's reviews that match this segment */
  shareOfProduct: number;
  /** Concentration index: (segment % in this product) / (segment % across all products).
   *  >1.0 = this segment over-indexes in this product. <1.0 = under-indexes. */
  concentrationIndex: number;
}

/** Map of product → ranked segment affinity data */
export type ProductAffinityMap = Partial<Record<ProductCategory, ProductAffinityEntry[]>>;

// ─── Yearly Trends (Consultant Feedback: YOY Changes) ────────────────────

export interface YearlyProductData {
  year: string;
  totalReviews: number;
  avgRating: number;
  fiveStarPct: number;
  /** Segment counts for this year — key is segment name */
  segments: Record<string, number>;
}

export interface YearlyTrends {
  /** Sorted list of years present in the data */
  years: string[];
  /** Per-product yearly data */
  byProduct: Partial<Record<ProductCategory, YearlyProductData[]>>;
  /** All products combined */
  overall: YearlyProductData[];
}

// ─── App State ─────────────────────────────────────────────────────────────

export type AppView =
  | 'auth'
  | 'apikey'
  | 'upload'
  | 'processing'
  | 'dashboard'
  | 'module';

export type ModuleId =
  | 'persona'
  | 'segments'
  | 'angles'
  | 'hooks'
  | 'script'
  | 'comments'
  | 'product-intelligence'
  | 'autopilot'
  | 'inspiration'
  | 'memory-vault';

export interface AppState {
  view: AppView;
  activeModule: ModuleId | null;
  apiKey: string;
  analysis: FullAnalysis | null;
}

// ─── Module Params ─────────────────────────────────────────────────────────

export type PersonaChannel = 'DTC' | 'Retail' | 'Wholesale';

export type MarketRegion = 'US' | 'CA';

export interface PersonaParams {
  product: ProductCategory;
  channel: PersonaChannel;
  /** Selected persona intersections to generate (identity × motivation pairs, or standalone segments) */
  selectedPersonas: string[];
  /** Include market positioning & TAM analysis */
  includeMarketAnalysis: boolean;
  /** Which markets to analyze (US, CA, or both) */
  markets: MarketRegion[];
}

export type AwarenessLevel =
  | 'Unaware'
  | 'Problem Aware'
  | 'Solution Aware'
  | 'Product Aware'
  | 'Most Aware';

export type FunnelStage = 'TOF' | 'MOF' | 'BOF';

export type AdType =
  | 'AGC (Actor Generated Content)'
  | 'UGC (User Generated Content)'
  | 'Ecom Style'
  | 'Static'
  | 'Founder Style'
  | 'Fake Podcast Ads'
  | 'Spokesperson'
  | 'Packaging/Employee'
  | 'Full AI (Documentary, story, education, etc)';

export type FullAiSpecification =
  | 'Documentary'
  | 'Historical'
  | 'Educational'
  | 'Emotional Story'
  | 'Aspirational';

export type FullAiVisualStyle =
  | 'Story with cohesive characters'
  | 'Fully Voice Over'
  | 'Includes Talking To Camera'
  | 'No Humans Shown (Perspective of the feet or socks)'
  | 'Historical Visuals and Claims';

export type AngleType =
  | 'Problem-Based'
  | 'Emotion-Based'
  | 'Solution-Based'
  | 'Identity-Based'
  | 'Comparison-Based'
  | 'Testimonial-Based'
  | 'Seasonal/Situational'
  | 'Fear-Based'
  | 'Aspiration-Based'
  | 'Education-Based'
  | '3 Reasons/Signs Why'
  | 'Negative Marketing';

export interface AnglesParams {
  product: ProductCategory;
  awarenessLevel: AwarenessLevel;
  angleType: AngleType;
  funnelStage: FunnelStage;
  adType: AdType;
  /** Primary talking point — the specific condition, topic, or focus (e.g., "Diabetes", "Neuropathy", "Swelling", "Sock Marks") */
  primaryTalkingPoint?: string;
  /** Optional duration hint — used by Full AI skill context to scope the concept's runtime ambition. Matches Asana medium column. */
  duration?: '1-15 sec' | '16-59 sec' | '60-90 sec';
  /** Full AI-specific: narrative specification (only relevant when adType is 'Full AI') */
  fullAiSpecification?: FullAiSpecification;
  /** Full AI-specific: visual style (only relevant when adType is 'Full AI') */
  fullAiVisualStyle?: FullAiVisualStyle;
}

export type HookStyle =
  | 'Question Hook'
  | 'Bold Claim'
  | 'Pattern Interrupt'
  | 'Story Opening'
  | 'Curiosity Gap'
  | 'Social Proof'
  | 'Contrarian / Myth Buster'
  | 'Identity Callout'
  | 'Pain Agitation'
  | 'Transformation Reveal'
  | 'Permission Hook'
  | 'Insider / Secret'
  | 'Comparison / Versus'
  | 'Warning / Urgency'
  | 'Emotional Trigger'
  | 'Direct Address'
  | 'Shock Value'
  | 'Relatable Moment'
  | 'Enemy Callout'
  | 'Aspirational Vision';

export interface HooksParams {
  product: ProductCategory;
  awarenessLevel: AwarenessLevel;
  format: 'Video' | 'Static' | 'Text';
  count: 10 | 20 | 30;
  hookStyles: HookStyle[];
  scriptContext?: string; // Pasted or uploaded script to generate hooks for
}

export type ScriptFramework =
  // --- Original 12 ---
  | 'PAS (Problem-Agitate-Solution)'
  | 'AIDA-R (Attention-Interest-Desire-Action-Retention)'
  | 'Before-After-Bridge'
  | 'Star-Story-Solution'
  | 'Feel-Felt-Found'
  | 'Problem-Promise-Proof-Push'
  | 'Hook-Story-Offer'
  | 'Empathy-Education-Evidence'
  | 'The Contrast Framework'
  | 'The Skeptic Converter'
  | 'The Day-in-Life'
  | 'The Myth Buster'
  // --- Added from Manifesto 4.3 + Marketing Books ---
  | 'The Enemy Framework'
  | 'The Discovery Narrative'
  | 'The Professional Authority'
  | 'The Demonstration Proof'
  | 'The Objection Crusher'
  | 'The Identity Alignment'
  | 'The Reason-Why (Hopkins)'
  | 'The Gradualization (Schwartz)'
  // --- Short-form experimental ---
  | 'No Framework (Pure Moment)'
  | 'No Framework';

export type MarketingBookReference =
  | 'Scientific Advertising (Hopkins)'
  | 'Breakthrough Advertising (Schwartz)'
  | 'The Brand Gap (Neumeier)'
  | 'The Copywriter\'s Handbook (Bly)'
  | 'All Four Books';

export type OfferType = 'B2G3' | 'B1G1' | 'None';
export type HookVariationCount = 3 | 5 | 7 | 10;

export type AgcBodyFormat = 'pov' | 'face-to-camera';
export type AgcPacing = 'fast' | 'standard' | 'deliberate';

export interface ScriptParams {
  product: ProductCategory;
  persona: string;
  framework: ScriptFramework;
  duration: '1-15 sec' | '16-59 sec' | '60-90 sec';
  funnelStage: FunnelStage;
  awarenessLevel: AwarenessLevel;
  adType: AdType;
  promoPeriod: string;
  offer: OfferType;
  hookVariations: HookVariationCount;
  bookReference: MarketingBookReference;
  /** Primary talking point — the specific condition, topic, or focus (e.g., "Diabetes", "Neuropathy") */
  primaryTalkingPoint?: string;
  conceptAngleContext?: string; // Pre-generated concept/angle to script from

  // AGC-specific (only relevant when adType is 'AGC (Actor Generated Content)')
  agcBodyFormat?: AgcBodyFormat;
  agcLocation?: string;
  agcPacing?: AgcPacing;
  agcMusicDirection?: string;
  agcTalentDescription?: string;

  // Full AI-specific (only relevant when adType is 'Full AI (Documentary, story, education, etc)')
  fullAiSpecification?: FullAiSpecification;
  fullAiVisualStyle?: FullAiVisualStyle;
}

/** Bundled context passed from Concepts & Angles → Script Writer */
export interface ConceptContext {
  /** The full concept markdown content */
  content: string;
  /** The product line selected when generating the concept */
  product: ProductCategory;
  /** The awareness level selected when generating the concept */
  awarenessLevel: AwarenessLevel;
  /** The funnel stage selected when generating the concept */
  funnelStage: FunnelStage;
  /** The ad type selected when generating the concept */
  adType: AdType;
  /** Full AI-specific: narrative specification */
  fullAiSpecification?: FullAiSpecification;
  /** Full AI-specific: visual style */
  fullAiVisualStyle?: FullAiVisualStyle;
}

// ─── Claude API ────────────────────────────────────────────────────────────

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: ClaudeMessage[];
}

export interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  usage: { input_tokens: number; output_tokens: number };
}

// ─── Processing Progress ───────────────────────────────────────────────────

export interface ProcessingProgress {
  stage: 'organizing' | 'analyzing' | 'complete';
  currentProduct: string;
  percent: number;
}
