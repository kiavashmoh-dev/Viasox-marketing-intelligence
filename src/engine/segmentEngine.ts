/**
 * Deterministic Segment Discovery Engine
 *
 * TWO-LAYER MODEL:
 * Layer 1 — Identity (WHO they are): healthcare worker, diabetic, senior, etc.
 * Layer 2 — Motivation (WHY they buy): comfort seeker, pain relief, style, etc.
 *
 * Assigns every review to segment(s) using regex patterns.
 * The output is pure math — same input always produces same output.
 * No AI involved. Claude only enriches these segments later.
 */

import type {
  RawReview,
  OrganizedReviews,
  ProductCategory,
  SegmentProfile,
  SegmentBreakdown,
  SegmentLayer,
  CrossSegmentOverlap,
  ProductAffinityEntry,
  ProductAffinityMap,
} from './types';
import {
  IDENTITY_SEGMENT_PATTERNS,
  MOTIVATION_SEGMENT_PATTERNS,
  PAIN_PATTERNS,
  BENEFIT_PATTERNS,
  TRANSFORMATION_PATTERNS,
} from './patterns';

/** Map segment key → layer for O(1) lookup */
const SEGMENT_LAYER_MAP = new Map<string, SegmentLayer>();
for (const key of Object.keys(IDENTITY_SEGMENT_PATTERNS)) {
  SEGMENT_LAYER_MAP.set(key, 'identity');
}
for (const key of Object.keys(MOTIVATION_SEGMENT_PATTERNS)) {
  SEGMENT_LAYER_MAP.set(key, 'motivation');
}

/** Combined patterns for tagging */
const ALL_SEGMENT_PATTERNS: Record<string, RegExp> = {
  ...IDENTITY_SEGMENT_PATTERNS,
  ...MOTIVATION_SEGMENT_PATTERNS,
};

interface TaggedReview extends RawReview {
  product: ProductCategory;
  matchedSegments: string[];
}

/**
 * Tag every review with its product and matched segments.
 * This is the core deterministic assignment — same CSV always produces same tags.
 */
function tagAllReviews(organized: OrganizedReviews): TaggedReview[] {
  const tagged: TaggedReview[] = [];
  const productGroups: [ProductCategory, RawReview[]][] = [
    ['EasyStretch', organized.EasyStretch],
    ['Compression', organized.Compression],
    ['Ankle Compression', organized['Ankle Compression']],
  ];

  for (const [product, reviews] of productGroups) {
    for (const review of reviews) {
      const matchedSegments: string[] = [];
      for (const [segName, pattern] of Object.entries(ALL_SEGMENT_PATTERNS)) {
        if (pattern.test(review.review)) {
          matchedSegments.push(segName);
        }
      }
      tagged.push({ ...review, product, matchedSegments });
    }
  }

  return tagged;
}

/**
 * For a set of reviews, count which benefit/pain/transformation patterns appear
 * and return the top N sorted by frequency.
 */
function computeTopPatterns(
  reviews: TaggedReview[],
  patterns: Record<string, RegExp>,
  topN = 5,
): Array<{ name: string; count: number; percentage: number }> {
  const total = reviews.length;
  const results: Array<{ name: string; count: number; percentage: number }> = [];

  for (const [name, pattern] of Object.entries(patterns)) {
    const count = reviews.filter((r) => pattern.test(r.review)).length;
    if (count > 0) {
      results.push({
        name: name.replace(/_/g, ' '),
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      });
    }
  }

  return results.sort((a, b) => b.count - a.count).slice(0, topN);
}

/**
 * Pick representative quotes — prioritize longer, higher-rated reviews
 */
function pickQuotes(reviews: TaggedReview[], max = 5): string[] {
  const sorted = [...reviews]
    .filter((r) => r.review.length >= 60)
    .sort((a, b) => {
      // Prefer 5-star, then 4-star, then longest
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.review.length - a.review.length;
    });

  return sorted.slice(0, max).map((r) =>
    r.review.length > 300 ? r.review.slice(0, 300) + '...' : r.review,
  );
}

/**
 * Compute identity × motivation cross-segment overlaps.
 * For every (identity, motivation) pair, count reviews that match BOTH.
 * Returns sorted by reviewCount descending (top co-occurrences first).
 */
function computeCrossSegmentOverlaps(tagged: TaggedReview[]): CrossSegmentOverlap[] {
  const identityKeys = Object.keys(IDENTITY_SEGMENT_PATTERNS);
  const motivationKeys = Object.keys(MOTIVATION_SEGMENT_PATTERNS);

  // Count per-identity and per-motivation totals for percentage calcs
  const identityTotals = new Map<string, number>();
  const motivationTotals = new Map<string, number>();
  for (const review of tagged) {
    for (const seg of review.matchedSegments) {
      if (SEGMENT_LAYER_MAP.get(seg) === 'identity') {
        identityTotals.set(seg, (identityTotals.get(seg) ?? 0) + 1);
      } else {
        motivationTotals.set(seg, (motivationTotals.get(seg) ?? 0) + 1);
      }
    }
  }

  const overlaps: CrossSegmentOverlap[] = [];

  for (const idKey of identityKeys) {
    for (const motKey of motivationKeys) {
      // Find reviews that match BOTH
      const matching = tagged.filter(
        (r) => r.matchedSegments.includes(idKey) && r.matchedSegments.includes(motKey),
      );
      if (matching.length === 0) continue;

      const idTotal = identityTotals.get(idKey) ?? 1;
      const motTotal = motivationTotals.get(motKey) ?? 1;

      // Product distribution
      const productCounts = new Map<string, number>();
      const ratings: number[] = [];
      for (const r of matching) {
        productCounts.set(r.product, (productCounts.get(r.product) ?? 0) + 1);
        if (r.rating > 0) ratings.push(r.rating);
      }
      const byProduct: Record<string, { count: number; percentage: number }> = {};
      for (const [prod, cnt] of productCounts.entries()) {
        byProduct[prod] = {
          count: cnt,
          percentage: Math.round((cnt / matching.length) * 1000) / 10,
        };
      }

      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
        : 0;

      overlaps.push({
        identity: idKey.replace(/_/g, ' '),
        motivation: motKey.replace(/_/g, ' '),
        reviewCount: matching.length,
        percentOfIdentity: Math.round((matching.length / idTotal) * 1000) / 10,
        percentOfMotivation: Math.round((matching.length / motTotal) * 1000) / 10,
        avgRating,
        byProduct,
      });
    }
  }

  return overlaps.sort((a, b) => b.reviewCount - a.reviewCount);
}

/**
 * Compute product affinity: for each product, rank which segments are most dominant
 * and calculate a concentration index (over/under-index vs. overall).
 */
function computeProductAffinity(
  tagged: TaggedReview[],
  segments: SegmentProfile[],
  totalReviews: number,
): ProductAffinityMap {
  const products: ProductCategory[] = ['EasyStretch', 'Compression', 'Ankle Compression'];
  const affinityMap: ProductAffinityMap = {};

  for (const product of products) {
    const productReviews = tagged.filter((r) => r.product === product);
    const productTotal = productReviews.length;
    if (productTotal === 0) continue;

    const entries: ProductAffinityEntry[] = [];

    for (const seg of segments) {
      const productData = seg.byProduct[product];
      const segCountInProduct = productData?.count ?? 0;
      if (segCountInProduct === 0) continue;

      const shareOfProduct = Math.round((segCountInProduct / productTotal) * 1000) / 10;
      // Overall segment share across all reviews
      const overallShare = totalReviews > 0 ? seg.totalReviews / totalReviews : 0;
      // Concentration index: how much this product over/under-indexes for this segment
      const concentrationIndex = overallShare > 0
        ? Math.round(((segCountInProduct / productTotal) / overallShare) * 100) / 100
        : 0;

      entries.push({
        segmentName: seg.segmentName,
        layer: seg.layer,
        count: segCountInProduct,
        shareOfProduct,
        concentrationIndex,
      });
    }

    // Sort by share descending
    entries.sort((a, b) => b.shareOfProduct - a.shareOfProduct);
    affinityMap[product] = entries;
  }

  return affinityMap;
}

/**
 * Build the full deterministic segment breakdown.
 * This function does zero AI work — it's pure regex + math.
 */
export function buildSegmentBreakdown(organized: OrganizedReviews): SegmentBreakdown {
  const tagged = tagAllReviews(organized);
  const totalReviews = tagged.length;

  // Group reviews by segment
  const segmentMap = new Map<string, TaggedReview[]>();
  let unsegmentedCount = 0;
  let multiSegmentCount = 0;

  for (const review of tagged) {
    if (review.matchedSegments.length === 0) {
      unsegmentedCount++;
    }
    if (review.matchedSegments.length > 1) {
      multiSegmentCount++;
    }
    for (const seg of review.matchedSegments) {
      if (!segmentMap.has(seg)) segmentMap.set(seg, []);
      segmentMap.get(seg)!.push(review);
    }
  }

  // Build a profile for each segment
  const segments: SegmentProfile[] = [];

  for (const [segName, reviews] of segmentMap.entries()) {
    // Per-product breakdown
    const byProduct: Record<string, { count: number; percentage: number }> = {};
    const productCounts = new Map<string, number>();

    for (const r of reviews) {
      productCounts.set(r.product, (productCounts.get(r.product) ?? 0) + 1);
    }

    for (const [product, count] of productCounts.entries()) {
      byProduct[product] = {
        count,
        percentage: Math.round((count / reviews.length) * 1000) / 10,
      };
    }

    // Ratings
    const ratings = reviews.map((r) => r.rating).filter((r) => r > 0);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
        : 0;
    const fiveStar = ratings.filter((r) => r === 5).length;

    segments.push({
      segmentName: segName.replace(/_/g, ' '),
      layer: SEGMENT_LAYER_MAP.get(segName) ?? 'motivation',
      totalReviews: reviews.length,
      percentage: totalReviews > 0 ? Math.round((reviews.length / totalReviews) * 1000) / 10 : 0,
      byProduct,
      topBenefits: computeTopPatterns(reviews, BENEFIT_PATTERNS),
      topPains: computeTopPatterns(reviews, PAIN_PATTERNS),
      topTransformations: computeTopPatterns(reviews, TRANSFORMATION_PATTERNS),
      averageRating: avgRating,
      fiveStarPercent:
        ratings.length > 0 ? Math.round((fiveStar / ratings.length) * 1000) / 10 : 0,
      representativeQuotes: pickQuotes(reviews),
    });
  }

  // Sort: motivation segments first (bigger, more strategic), then identity
  // Within each layer, sort by size descending
  segments.sort((a, b) => {
    if (a.layer !== b.layer) return a.layer === 'motivation' ? -1 : 1;
    return b.totalReviews - a.totalReviews;
  });

  // Compute cross-segment overlaps (identity × motivation co-occurrence)
  const crossSegmentOverlap = computeCrossSegmentOverlaps(tagged);

  // Compute product affinity (which segments dominate each product)
  const productAffinity = computeProductAffinity(tagged, segments, totalReviews);

  return {
    totalReviews,
    segments,
    unsegmented: {
      count: unsegmentedCount,
      percentage: totalReviews > 0 ? Math.round((unsegmentedCount / totalReviews) * 1000) / 10 : 0,
    },
    multiSegment: {
      count: multiSegmentCount,
      percentage:
        totalReviews > 0 ? Math.round((multiSegmentCount / totalReviews) * 1000) / 10 : 0,
    },
    crossSegmentOverlap,
    productAffinity,
  };
}

/**
 * Format segment breakdown as a string for inclusion in prompts.
 * This gives Claude the deterministic data to enrich — not invent.
 *
 * @param maxSegments - cap the number of segments included (largest first).
 *   Keeps the prompt from blowing up when there are 17+ segments.
 * @param maxQuotes - quotes per segment (default 2 to save tokens)
 */
export function formatSegmentBreakdown(
  breakdown: SegmentBreakdown,
  maxSegments = 12,
  maxQuotes = 2,
): string {
  const lines: string[] = [
    '## DETERMINISTIC SEGMENT BREAKDOWN',
    `Total reviews analyzed: ${breakdown.totalReviews.toLocaleString()}`,
    `Reviews matching at least one segment: ${(breakdown.totalReviews - breakdown.unsegmented.count).toLocaleString()} (${(100 - breakdown.unsegmented.percentage).toFixed(1)}%)`,
    `Reviews matching multiple segments: ${breakdown.multiSegment.count.toLocaleString()} (${breakdown.multiSegment.percentage}%)`,
    `Unsegmented reviews: ${breakdown.unsegmented.count.toLocaleString()} (${breakdown.unsegmented.percentage}%)`,
    '',
  ];

  // Group by layer for prompt clarity
  const motivationSegs = breakdown.segments.filter((s) => s.layer === 'motivation');
  const identitySegs = breakdown.segments.filter((s) => s.layer === 'identity');

  // Respect the cap — take top motivation first, then identity
  let remaining = maxSegments;
  const includedMotivation = motivationSegs.slice(0, remaining);
  remaining -= includedMotivation.length;
  const includedIdentity = identitySegs.slice(0, Math.max(remaining, 0));

  if (includedMotivation.length > 0) {
    lines.push('## MOTIVATION SEGMENTS (Why They Buy)');
    lines.push('These broad segments capture purchase motivation. Most reviews match at least one.');
    lines.push('');
    for (const seg of includedMotivation) {
      appendSegmentToPrompt(lines, seg, maxQuotes);
    }
  }

  if (includedIdentity.length > 0) {
    lines.push('## IDENTITY SEGMENTS (Who They Are)');
    lines.push('These narrower segments capture demographic/lifestyle identity. Not every reviewer self-identifies.');
    lines.push('');
    for (const seg of includedIdentity) {
      appendSegmentToPrompt(lines, seg, maxQuotes);
    }
  }

  // Mention skipped segments briefly
  const skippedMotivation = motivationSegs.length - includedMotivation.length;
  const skippedIdentity = identitySegs.length - includedIdentity.length;
  if (skippedMotivation > 0 || skippedIdentity > 0) {
    lines.push(`(${skippedMotivation + skippedIdentity} smaller segments omitted for brevity)`);
    lines.push('');
  }

  return lines.join('\n');
}

function appendSegmentToPrompt(lines: string[], seg: SegmentProfile, maxQuotes: number): void {
  lines.push(`### ${seg.segmentName.toUpperCase()} — ${seg.totalReviews.toLocaleString()} reviews (${seg.percentage}%)`);
  lines.push(`Layer: ${seg.layer} | Rating: ${seg.averageRating}/5 | 5★: ${seg.fiveStarPercent}%`);

  // Product split — compact one-liner
  const productParts = Object.entries(seg.byProduct).map(([p, d]) => `${p}: ${d.percentage}%`);
  lines.push(`Products: ${productParts.join(' | ')}`);

  // Top benefits (compact)
  if (seg.topBenefits.length > 0) {
    const top3 = seg.topBenefits.slice(0, 3);
    lines.push(`Benefits: ${top3.map((b) => `${b.name} ${b.percentage}%`).join(', ')}`);
  }

  // Top pains (compact)
  if (seg.topPains.length > 0) {
    const top3 = seg.topPains.slice(0, 3);
    lines.push(`Pains: ${top3.map((p) => `${p.name} ${p.percentage}%`).join(', ')}`);
  }

  // Top transformations (compact)
  if (seg.topTransformations.length > 0) {
    const top3 = seg.topTransformations.slice(0, 3);
    lines.push(`Transformations: ${top3.map((t) => `${t.name} ${t.percentage}%`).join(', ')}`);
  }

  // Quotes — limited & trimmed
  const quotes = seg.representativeQuotes.slice(0, maxQuotes);
  if (quotes.length > 0) {
    lines.push('Quotes:');
    for (const q of quotes) {
      const trimmed = q.length > 180 ? q.slice(0, 180) + '...' : q;
      lines.push(`> "${trimmed}"`);
    }
  }

  lines.push('');
}
