import type { RawReview, ProductCategory, OrganizedReviews } from './types';

export function categorizeProduct(handle: string): ProductCategory {
  if (!handle) return 'Other';
  const h = handle.toLowerCase();
  if (h.includes('easystretch')) return 'EasyStretch';
  // Check ankle-compression BEFORE compression to avoid mis-categorization
  if (h.includes('ankle-compression')) return 'Ankle Compression';
  if (h.includes('compression')) return 'Compression';
  return 'Other';
}

export function organizeReviews(reviews: RawReview[]): OrganizedReviews {
  const result: OrganizedReviews = {
    EasyStretch: [],
    Compression: [],
    'Ankle Compression': [],
    Other: [],
  };

  for (const review of reviews) {
    const category = categorizeProduct(review.handle);
    result[category].push(review);
  }

  return result;
}
