/**
 * Review Parser — Extracts structured data from batch reviewer markdown
 *
 * The reviewer outputs a well-structured markdown report with tables and headers.
 * This parser extracts per-brief scores, check results, and batch-level assessments.
 */

export interface ParsedBriefReview {
  taskName: string;
  verdict: 'APPROVED' | 'NEEDS_ATTENTION';
  score: number;
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

/**
 * Parse the reviewer's markdown output into structured data.
 * The reviewer outputs sections per brief with tables of check results.
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
  const briefSections = reviewMarkdown.split(/(?=###?\s+(?:VIASOX|Brief|Task)[\s\-]*\d*)/i);

  for (const section of briefSections) {
    const nameMatch = section.match(/###?\s+((?:VIASOX|Brief|Task)[\s\-]*\w+)/i);
    if (!nameMatch) continue;

    const taskName = nameMatch[1].trim();
    const brief: ParsedBriefReview = {
      taskName,
      verdict: 'APPROVED',
      score: 7,
      checks: [],
      strengths: [],
      weaknesses: [],
    };

    // Extract score
    const scoreMatch = section.match(/(?:score|rating|overall)[:\s]*(\d+)\s*\/\s*10/i);
    if (scoreMatch) {
      brief.score = parseInt(scoreMatch[1], 10);
    }

    // Verdict
    if (/NEEDS?\s*ATTENTION|FAIL|REJECT/i.test(section)) {
      brief.verdict = 'NEEDS_ATTENTION';
    }

    // Extract check results (PASS/FLAG/FAIL patterns)
    const checkNames = [
      'Hook Differentiation',
      'Problem Specificity',
      'Angle Alignment',
      'Data Grounding',
      'Product Accuracy',
      'Offer Integration',
      'CTA Appropriateness',
      'Framework Execution',
      'Brand Voice',
      'Completeness',
    ];

    for (const checkName of checkNames) {
      const escapedName = checkName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const checkMatch = section.match(new RegExp(`${escapedName}[^\\n]*?(PASS|FLAG|FAIL)`, 'i'));
      if (checkMatch) {
        const r = checkMatch[1].toUpperCase() as 'PASS' | 'FLAG' | 'FAIL';
        brief.checks.push({ name: checkName, result: r });
      }
    }

    // Extract strengths
    const strengthMatch = section.match(/(?:strengths?|what works)[:\s]*\n((?:[-*•]\s+[^\n]+\n?)+)/i);
    if (strengthMatch) {
      brief.strengths = strengthMatch[1]
        .split('\n')
        .map((l) => l.replace(/^[-*•]\s+/, '').trim())
        .filter(Boolean)
        .slice(0, 5);
    }

    // Extract weaknesses
    const weaknessMatch = section.match(/(?:weakness(?:es)?|issues?|concerns?|what.s weak)[:\s]*\n((?:[-*•]\s+[^\n]+\n?)+)/i);
    if (weaknessMatch) {
      brief.weaknesses = weaknessMatch[1]
        .split('\n')
        .map((l) => l.replace(/^[-*•]\s+/, '').trim())
        .filter(Boolean)
        .slice(0, 5);
    }

    result.briefs.push(brief);
  }

  // Extract batch assessment
  const batchMatch = reviewMarkdown.match(/(?:batch\s*(?:level|summary|assessment|overall))[:\s]*\n?([\s\S]{50,500}?)(?=\n##|\n\*\*|$)/i);
  if (batchMatch) {
    result.batchAssessment = batchMatch[1].trim().slice(0, 500);
  }

  // Extract strongest/weakest
  const strongestMatch = reviewMarkdown.match(/(?:strongest|best)[:\s]*(?:brief[:\s]*)?(VIASOX[\s\-]*\w+)/i);
  if (strongestMatch) {
    result.strongestBrief = strongestMatch[1].trim();
  }

  const weakestMatch = reviewMarkdown.match(/(?:weakest|needs.most.work|lowest)[:\s]*(?:brief[:\s]*)?(VIASOX[\s\-]*\w+)/i);
  if (weakestMatch) {
    result.weakestBrief = weakestMatch[1].trim();
  }

  return result;
}
