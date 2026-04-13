/**
 * Review Parser — Extracts structured scoring data from batch reviewer output
 *
 * The reviewer outputs a JSON code fence per brief with 11 quality criteria
 * scored 1-10, plus markdown for batch-level analysis. The parser extracts
 * the JSON as the primary path with regex fallback for robustness.
 */

import type {
  ScoringRecord,
  ScoreBreakdown,
} from './memoryTypes';
import { SCORING_CRITERIA, WEIGHTED_CRITERIA } from './memoryTypes';

export interface ParsedBriefReview {
  taskName: string;
  verdict: 'APPROVED' | 'NEEDS_ATTENTION';
  score: number;
  scoring: ScoringRecord | null;
  checks: Array<{
    name: string;
    result: 'PASS' | 'FLAG' | 'FAIL';
  }>;
  strengths: string[];
  weaknesses: string[];
}

export interface ParsedBatchReview {
  briefs: ParsedBriefReview[];
  batchAssessment: string;
  strongestBrief: string;
  weakestBrief: string;
}

// ─── Weighted Score Computation ─────────────────────────────────────────────

/**
 * Compute the weighted composite score from per-criterion breakdown.
 * hookQuality, confusionFactor, scriptLineStrength get 1.5x weight.
 * inspirationAdherence is excluded when null (no inspiration provided).
 */
export function computeWeightedScore(breakdown: ScoreBreakdown): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const key of SCORING_CRITERIA) {
    const entry = breakdown[key];
    if (!entry) continue; // skip null criteria (e.g., inspirationAdherence when no inspiration)
    const weight = WEIGHTED_CRITERIA.includes(key) ? 1.5 : 1.0;
    weightedSum += entry.score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

// ─── JSON Extraction ────────────────────────────────────────────────────────

function buildScoringRecord(parsed: any): ScoringRecord | null {
  if (!parsed || typeof parsed !== 'object' || !parsed.scores) return null;

  const breakdown: ScoreBreakdown = {} as ScoreBreakdown;

  for (const key of SCORING_CRITERIA) {
    const raw = parsed.scores[key];
    if (raw && typeof raw === 'object' && typeof raw.score === 'number') {
      const score = Math.max(1, Math.min(10, Math.round(raw.score)));
      breakdown[key] = {
        score,
        notes: String(raw.notes ?? ''),
        result: score <= 4 ? 'FAIL' : score <= 6 ? 'FLAG' : 'PASS',
      };
    } else {
      breakdown[key] = null;
    }
  }

  const reviewerOverallScore = computeWeightedScore(breakdown);

  return {
    reviewerBreakdown: breakdown,
    reviewerOverallScore,
    userOverrideScore: null,
    userOverrideNotes: null,
    finalScore: reviewerOverallScore,
    scoredAt: new Date().toISOString(),
    overriddenAt: null,
  };
}

function extractJsonBlock(section: string): any | null {
  const jsonMatch = section.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]);
  } catch {
    return null;
  }
}

// ─── Main Parser ────────────────────────────────────────────────────────────

/**
 * Parse the reviewer's output into structured data.
 * Primary path: extract JSON code fence per brief.
 * Fallback: regex extraction for legacy/malformed output.
 */
export function parseReviewResult(reviewMarkdown: string): ParsedBatchReview {
  const result: ParsedBatchReview = {
    briefs: [],
    batchAssessment: '',
    strongestBrief: '',
    weakestBrief: '',
  };

  if (!reviewMarkdown) return result;

  // Extract per-brief sections — look for task name patterns
  const briefSections = reviewMarkdown.split(/(?=###?\s+(?:VIASOX|Brief|Task)[\s-]*\d*)/i);

  for (const section of briefSections) {
    const nameMatch = section.match(/###?\s+((?:VIASOX|Brief|Task)[\s-]*\w+)/i);
    if (!nameMatch) continue;

    const taskName = nameMatch[1].trim();
    const brief: ParsedBriefReview = {
      taskName,
      verdict: 'APPROVED',
      score: 0,
      scoring: null,
      checks: [],
      strengths: [],
      weaknesses: [],
    };

    // Primary: try JSON extraction
    const jsonData = extractJsonBlock(section);
    if (jsonData) {
      const scoring = buildScoringRecord(jsonData);
      if (scoring) {
        brief.scoring = scoring;
        brief.score = scoring.finalScore;

        // Build checks array from breakdown for backward compat
        for (const key of SCORING_CRITERIA) {
          const entry = scoring.reviewerBreakdown[key];
          if (entry) {
            brief.checks.push({ name: key, result: entry.result });
          }
        }
      }

      // Extract strengths/weaknesses from JSON
      if (Array.isArray(jsonData.strengths)) {
        brief.strengths = jsonData.strengths.map(String).slice(0, 5);
      }
      if (Array.isArray(jsonData.weaknesses)) {
        brief.weaknesses = jsonData.weaknesses.map(String).slice(0, 5);
      }

      // Verdict from JSON or infer from score
      if (jsonData.verdict) {
        brief.verdict = /NEEDS?\s*ATTENTION/i.test(jsonData.verdict) ? 'NEEDS_ATTENTION' : 'APPROVED';
      } else if (brief.score > 0 && brief.score < 5) {
        brief.verdict = 'NEEDS_ATTENTION';
      }
    }

    // Fallback: regex extraction if JSON didn't work
    if (!brief.scoring) {
      const scoreMatch = section.match(/(?:score|rating|overall)[:\s]*(\d+(?:\.\d)?)\s*\/\s*10/i);
      if (scoreMatch) {
        brief.score = parseFloat(scoreMatch[1]);
      }

      // Verdict from text
      if (/NEEDS?\s*ATTENTION|FAIL|REJECT/i.test(section)) {
        brief.verdict = 'NEEDS_ATTENTION';
      }

      // Legacy check extraction
      const legacyChecks = [
        'Hook Differentiation', 'Problem Specificity', 'Angle Alignment',
        'Data Grounding', 'Product Accuracy', 'Offer Integration',
        'CTA Appropriateness', 'Framework Execution', 'Brand Voice', 'Completeness',
      ];
      for (const checkName of legacyChecks) {
        const escaped = checkName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const checkMatch = section.match(new RegExp(`${escaped}[^\\n]*?(PASS|FLAG|FAIL)`, 'i'));
        if (checkMatch) {
          brief.checks.push({ name: checkName, result: checkMatch[1].toUpperCase() as 'PASS' | 'FLAG' | 'FAIL' });
        }
      }
    }

    // Strengths/weaknesses fallback (if not populated from JSON)
    if (brief.strengths.length === 0) {
      const strengthMatch = section.match(/(?:strengths?|what works)[:\s]*\n((?:[-*•]\s+[^\n]+\n?)+)/i);
      if (strengthMatch) {
        brief.strengths = strengthMatch[1].split('\n').map((l) => l.replace(/^[-*•]\s+/, '').trim()).filter(Boolean).slice(0, 5);
      }
    }
    if (brief.weaknesses.length === 0) {
      const weaknessMatch = section.match(/(?:weakness(?:es)?|issues?|concerns?|what.s weak)[:\s]*\n((?:[-*•]\s+[^\n]+\n?)+)/i);
      if (weaknessMatch) {
        brief.weaknesses = weaknessMatch[1].split('\n').map((l) => l.replace(/^[-*•]\s+/, '').trim()).filter(Boolean).slice(0, 5);
      }
    }

    result.briefs.push(brief);
  }

  // Extract batch assessment
  const batchMatch = reviewMarkdown.match(/(?:batch\s*(?:level|summary|assessment|overall))[:\s]*\n?([\s\S]{50,500}?)(?=\n##|\n\*\*|$)/i);
  if (batchMatch) {
    result.batchAssessment = batchMatch[1].trim().slice(0, 500);
  }

  // Extract strongest/weakest
  const strongestMatch = reviewMarkdown.match(/(?:strongest|best)[:\s]*(?:brief[:\s]*)?(VIASOX[\s-]*\w+)/i);
  if (strongestMatch) {
    result.strongestBrief = strongestMatch[1].trim();
  }

  const weakestMatch = reviewMarkdown.match(/(?:weakest|needs.most.work|lowest)[:\s]*(?:brief[:\s]*)?(VIASOX[\s-]*\w+)/i);
  if (weakestMatch) {
    result.weakestBrief = weakestMatch[1].trim();
  }

  return result;
}
