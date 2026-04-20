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

  // Extract per-brief sections — look for task name patterns.
  // Accept H2 or H3, with optional bold markers, and multiple prefix words.
  // Falls back to splitting on any JSON code fence if no headings match.
  let briefSections = reviewMarkdown.split(/(?=##?#?\s*\**\s*(?:VIASOX|Brief|Task|Ad|Viasox|#)[\s#-]*\d+)/i);

  // Fallback: if the split produced one big chunk (no heading matched),
  // split on JSON code fences instead so each fence becomes its own section.
  if (briefSections.length <= 1 && reviewMarkdown.includes('```json')) {
    console.warn('[reviewParser] No brief headings matched — falling back to JSON fence split');
    briefSections = reviewMarkdown.split(/(?=```json)/);
  }

  console.log(`[reviewParser] Split review into ${briefSections.length} section(s); total length ${reviewMarkdown.length}`);

  for (const section of briefSections) {
    // Try JSON extraction first — its `taskName` field is authoritative
    const jsonData = extractJsonBlock(section);

    // Resolve task name with cascading fallbacks:
    // 1. JSON's taskName field (most reliable)
    // 2. Any VIASOX-\d+ identifier anywhere in the section
    // 3. The heading text up to em-dash or colon
    let taskName = '';
    if (jsonData?.taskName && typeof jsonData.taskName === 'string') {
      taskName = jsonData.taskName.trim();
    } else {
      const viasoxMatch = section.match(/VIASOX[\s-]*\d+/i);
      if (viasoxMatch) {
        taskName = viasoxMatch[0].replace(/\s+/g, '-').toUpperCase();
      } else {
        const headingMatch = section.match(/###?\s+([^\n]+)/);
        if (headingMatch) {
          taskName = headingMatch[1].split(/[—:]/)[0].trim();
        }
      }
    }

    if (!taskName) {
      // Skip section but log why so we can diagnose
      if (section.trim().length > 100) {
        console.warn(`[reviewParser] Skipping section: no task name extracted (first 80 chars): ${section.slice(0, 80)}`);
      }
      continue;
    }

    const brief: ParsedBriefReview = {
      taskName,
      verdict: 'APPROVED',
      score: 0,
      scoring: null,
      checks: [],
      strengths: [],
      weaknesses: [],
    };

    console.log(`[reviewParser] Processing brief section: taskName="${taskName}", hasJson=${!!jsonData}`);

    // Primary: use the JSON data we already extracted
    if (jsonData) {
      const scoring = buildScoringRecord(jsonData);
      if (scoring) {
        brief.scoring = scoring;
        brief.score = scoring.finalScore;
        console.log(`[reviewParser]   → built scoring record: finalScore=${scoring.finalScore}`);

        // Build checks array from breakdown for backward compat
        for (const key of SCORING_CRITERIA) {
          const entry = scoring.reviewerBreakdown[key];
          if (entry) {
            brief.checks.push({ name: key, result: entry.result });
          }
        }
      } else {
        console.warn(`[reviewParser]   → JSON extracted but buildScoringRecord returned null. JSON keys: ${Object.keys(jsonData).join(', ')}`);
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

  // Final diagnostic summary
  const withScoring = result.briefs.filter((b) => b.scoring != null).length;
  console.log(`[reviewParser] Done. Extracted ${result.briefs.length} brief(s), ${withScoring} with scoring records. Task names: [${result.briefs.map((b) => b.taskName).join(', ')}]`);
  if (result.briefs.length === 0 && reviewMarkdown.length > 200) {
    console.warn(`[reviewParser] ⚠️ PARSE FAILURE — zero briefs extracted from ${reviewMarkdown.length}-char review. First 500 chars:\n${reviewMarkdown.slice(0, 500)}`);
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
