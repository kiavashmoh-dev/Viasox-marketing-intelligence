import Papa from 'papaparse';
import type { RawReview } from '../engine/types';

export interface CsvParseResult {
  reviews: RawReview[];
  errors: string[];
}

export function parseCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const errors: string[] = [];

        // Check for required columns
        const headers = results.meta.fields ?? [];
        const hasHandle = headers.some(h => h.toLowerCase() === 'handle');
        const hasReview = headers.some(h => h.toLowerCase() === 'review' || h.toLowerCase() === 'body');

        if (!hasHandle) errors.push('Missing "handle" column');
        if (!hasReview) errors.push('Missing "review" or "body" column');

        if (errors.length > 0) {
          resolve({ reviews: [], errors });
          return;
        }

        // Normalize column names and extract reviews
        const reviewCol = headers.find(h => h.toLowerCase() === 'review')
          ?? headers.find(h => h.toLowerCase() === 'body')!;
        const handleCol = headers.find(h => h.toLowerCase() === 'handle')!;
        const ratingCol = headers.find(h => h.toLowerCase() === 'rating');
        const dateCol = headers.find(h => h.toLowerCase() === 'date')
          ?? headers.find(h => h.toLowerCase() === 'created_at');

        const reviews: RawReview[] = results.data.map(row => ({
          handle: row[handleCol] ?? '',
          review: row[reviewCol] ?? '',
          rating: ratingCol ? Number(row[ratingCol]) || 0 : 0,
          date: dateCol ? row[dateCol] ?? '' : '',
        }));

        resolve({ reviews, errors: [] });
      },
      error(err) {
        resolve({ reviews: [], errors: [err.message] });
      },
    });
  });
}
