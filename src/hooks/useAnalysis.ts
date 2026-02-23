import { useState, useCallback } from 'react';
import type { FullAnalysis, ProcessingProgress, RawReview } from '../engine/types';
import { parseCsv } from '../utils/csv';
import { organizeReviews } from '../engine/organizeReviews';
import { runFullAnalysis } from '../engine/analyzeReviews';

export function useAnalysis() {
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [resourceContext, setResourceContext] = useState<string>('');
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (csvFiles: File[], resourceFiles: File[]) => {
    setError(null);
    setProgress({ stage: 'organizing', currentProduct: '', percent: 0 });

    try {
      // Parse all CSVs and merge reviews
      const allReviews: RawReview[] = [];
      const allErrors: string[] = [];

      for (let i = 0; i < csvFiles.length; i++) {
        setProgress({
          stage: 'organizing',
          currentProduct: `Parsing ${csvFiles[i].name}...`,
          percent: Math.round(((i + 1) / csvFiles.length) * 10),
        });

        const { reviews, errors } = await parseCsv(csvFiles[i]);
        if (errors.length > 0) {
          allErrors.push(`${csvFiles[i].name}: ${errors.join(', ')}`);
        } else {
          allReviews.push(...reviews);
        }
      }

      if (allErrors.length > 0 && allReviews.length === 0) {
        setError(allErrors.join('. '));
        setProgress(null);
        return;
      }

      if (allReviews.length === 0) {
        setError('No reviews found in the CSV files.');
        setProgress(null);
        return;
      }

      // Read resource files as text context
      const resourceTexts: string[] = [];
      for (const file of resourceFiles) {
        try {
          const text = await file.text();
          resourceTexts.push(`--- ${file.name} ---\n${text}`);
        } catch {
          // Skip unreadable files silently
        }
      }
      setResourceContext(resourceTexts.join('\n\n'));

      setProgress({ stage: 'organizing', currentProduct: '', percent: 15 });
      const organized = organizeReviews(allReviews);

      // Map analysis progress (0-100%) to our display range (20-95%)
      // This prevents the progress bar from jumping backward
      const result = await runFullAnalysis(organized, (p) => {
        if (p.stage === 'complete') {
          setProgress({ stage: 'complete', currentProduct: '', percent: 100 });
        } else {
          setProgress({
            ...p,
            percent: 20 + Math.round((p.percent / 100) * 75),
          });
        }
      });
      setAnalysis(result);
      setProgress({ stage: 'complete', currentProduct: '', percent: 100 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
      setProgress(null);
    }
  }, []);

  return { analysis, resourceContext, progress, error, processFiles };
}
