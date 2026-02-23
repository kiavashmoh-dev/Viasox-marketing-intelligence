import type {
  RawReview,
  ProductCategory,
  CategoryAnalysis,
  TransformationStory,
  ProductAnalysis,
  FullAnalysis,
  OrganizedReviews,
  ProcessingProgress,
} from './types';
import {
  PAIN_PATTERNS,
  BENEFIT_PATTERNS,
  TRANSFORMATION_PATTERNS,
  SEGMENT_PATTERNS,
  TRANSFORMATION_STORY_PATTERN,
} from './patterns';
import { buildSegmentBreakdown } from './segmentEngine';

function countPattern(
  reviews: RawReview[],
  pattern: RegExp,
): { count: number; matches: RawReview[] } {
  const matches = reviews.filter((r) => pattern.test(r.review));
  return { count: matches.length, matches };
}

function extractQuotes(
  matches: RawReview[],
  maxQuotes = 5,
  minLength = 50,
): string[] {
  const quotes: string[] = [];
  for (const row of matches) {
    const review = row.review;
    if (review.length >= minLength && quotes.length < maxQuotes) {
      quotes.push(review.length > 300 ? review.slice(0, 300) + '...' : review);
    }
  }
  return quotes;
}

function analyzeCategory(
  reviews: RawReview[],
  patterns: Record<string, RegExp>,
): CategoryAnalysis {
  const total = reviews.length;
  const results: CategoryAnalysis = {};

  for (const [name, pattern] of Object.entries(patterns)) {
    const { count, matches } = countPattern(reviews, pattern);
    const percentage = total > 0 ? Math.round(((count / total) * 100) * 100) / 100 : 0;
    const quotes = extractQuotes(matches);
    results[name] = { count, percentage, quotes };
  }

  return results;
}

function findTransformationStories(
  reviews: RawReview[],
  minLength = 100,
): TransformationStory[] {
  const stories: TransformationStory[] = [];

  const beforeAfter = reviews.filter((r) =>
    TRANSFORMATION_STORY_PATTERN.test(r.review),
  );

  for (const row of beforeAfter) {
    const review = row.review;
    if (review.length >= minLength) {
      stories.push({
        review: review.length > 500 ? review.slice(0, 500) + '...' : review,
        rating: row.rating ?? 'N/A',
        date: row.date ?? 'N/A',
      });
      if (stories.length >= 20) break;
    }
  }

  return stories;
}

function analyzeProduct(
  reviews: RawReview[],
  productName: ProductCategory,
): ProductAnalysis {
  const total = reviews.length;
  const ratings = reviews.map((r) => r.rating).filter((r) => r > 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const fiveStar = ratings.filter((r) => r === 5).length;
  const oneStar = ratings.filter((r) => r === 1).length;

  return {
    productName,
    totalReviews: total,
    averageRating: Math.round(avgRating * 100) / 100,
    fiveStarPercent: ratings.length > 0 ? Math.round(((fiveStar / ratings.length) * 100) * 10) / 10 : 0,
    oneStarPercent: ratings.length > 0 ? Math.round(((oneStar / ratings.length) * 100) * 10) / 10 : 0,
    pain: analyzeCategory(reviews, PAIN_PATTERNS),
    benefits: analyzeCategory(reviews, BENEFIT_PATTERNS),
    transformation: analyzeCategory(reviews, TRANSFORMATION_PATTERNS),
    segments: analyzeCategory(reviews, SEGMENT_PATTERNS),
    transformationStories: findTransformationStories(reviews),
  };
}

// Yield to the UI between products to prevent freezing
function yieldToUI(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export async function runFullAnalysis(
  organized: OrganizedReviews,
  onProgress?: (progress: ProcessingProgress) => void,
): Promise<FullAnalysis> {
  const totalReviews =
    organized.EasyStretch.length +
    organized.Compression.length +
    organized['Ankle Compression'].length +
    organized.Other.length;

  const breakdown: FullAnalysis['breakdown'] = {
    EasyStretch: organized.EasyStretch.length,
    Compression: organized.Compression.length,
    'Ankle Compression': organized['Ankle Compression'].length,
    Other: organized.Other.length,
  };

  const products: FullAnalysis['products'] = {};
  const productEntries: [ProductCategory, RawReview[]][] = [
    ['EasyStretch', organized.EasyStretch],
    ['Compression', organized.Compression],
    ['Ankle Compression', organized['Ankle Compression']],
  ];

  for (let i = 0; i < productEntries.length; i++) {
    const [name, reviews] = productEntries[i];
    if (reviews.length === 0) continue;

    onProgress?.({
      stage: 'analyzing',
      currentProduct: name,
      percent: Math.round(((i + 1) / productEntries.length) * 100),
    });

    products[name] = analyzeProduct(reviews, name);
    await yieldToUI();
  }

  // Build deterministic segment breakdown (pure math, no AI)
  const segmentBreakdown = buildSegmentBreakdown(organized);

  onProgress?.({ stage: 'complete', currentProduct: '', percent: 100 });

  return { totalReviews, breakdown, products, segmentBreakdown };
}
