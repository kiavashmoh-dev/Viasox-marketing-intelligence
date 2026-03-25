/**
 * Memory Extractor — Converts pipeline state into compact memory records
 *
 * Runs after batch completion. Extracts the minimal data needed
 * from each brief to build the memory bank without storing full text.
 */

import type { AutopilotState, CreativeDirection } from '../engine/autopilotTypes';
import type { BatchMemoryRecord, BriefMemoryRecord, ReferenceStyleRecord } from './memoryTypes';
import { parseReviewResult } from './reviewParser';
import { saveBatchToMemory, addReferenceStyle } from './memoryStore';

// ─── Hook Style Classification ──────────────────────────────────────────────

function classifyHookStyle(hookLine: string): string {
  const l = hookLine.toLowerCase().trim();
  if (l.endsWith('?') || l.startsWith('have you') || l.startsWith('do you') || l.startsWith('what if') || l.startsWith('did you know')) {
    return 'Question';
  }
  if (l.startsWith('stop') || l.startsWith('warning') || l.startsWith('alert') || l.startsWith('don\'t') || /^\d/.test(l)) {
    return 'Bold Statement';
  }
  if (l.startsWith('i ') || l.startsWith('my ') || l.startsWith('when i') || l.startsWith('i\'ve')) {
    return 'First Person Story';
  }
  if (l.startsWith('imagine') || l.startsWith('picture this') || l.startsWith('what if you')) {
    return 'Scenario Paint';
  }
  if (/\d+%|studies show|research|according to|scientists/.test(l)) {
    return 'Stat/Fact Lead';
  }
  if (l.startsWith('you ') || l.startsWith('your ') || l.startsWith('if you')) {
    return 'Direct Address';
  }
  return 'Statement';
}

// ─── Persona Extraction ─────────────────────────────────────────────────────

function extractPersona(conceptText: string, scriptText: string): string {
  const combined = (conceptText + ' ' + scriptText).toLowerCase();
  if (/healthcare|nurse|doctor|hospital|medical\s+worker|shift/.test(combined)) return 'Healthcare Worker';
  if (/senior|elderly|aging|retired|grandm|grandp|older\s+adult/.test(combined)) return 'Senior';
  if (/caregiver|gift|buying\s+for|loved\s+one|parent|daughter|son/.test(combined)) return 'Caregiver/Gift Buyer';
  if (/diabetic|diabetes|blood\s+sugar|neuropathy/.test(combined)) return 'Diabetic';
  if (/active|athlete|runner|exercise|gym|sport|hik/.test(combined)) return 'Active Lifestyle';
  if (/teacher|retail|server|wait(?:ress|er)|stand(?:ing|s)\s+all\s+day/.test(combined)) return 'Standing Worker';
  if (/pregnant|pregnancy|postpartum|expecti/.test(combined)) return 'Pregnant/Postpartum';
  if (/style|fashion|look|outfit|match/.test(combined)) return 'Style Conscious';
  if (/skeptic|didn.t\s+believe|thought\s+it/.test(combined)) return 'Skeptical First-Timer';
  return 'General Consumer';
}

// ─── Emotional Entry Extraction ─────────────────────────────────────────────

function extractEmotionalEntry(conceptText: string): string {
  const l = conceptText.toLowerCase();
  if (/frustrat|annoy|fed\s+up|sick\s+of|tired\s+of/.test(l)) return 'Frustration';
  if (/fear|scar|worried|anxious|what\s+if/.test(l)) return 'Fear/Anxiety';
  if (/hope|finally|discover|found/.test(l)) return 'Hope/Discovery';
  if (/pain|hurt|ache|throb|burn/.test(l)) return 'Pain/Suffering';
  if (/embarrass|ashamed|self-conscious|hide/.test(l)) return 'Embarrassment';
  if (/relief|free|comfort|ahh/.test(l)) return 'Relief/Comfort';
  if (/surprise|shock|didn.t\s+expect|amazed/.test(l)) return 'Surprise';
  if (/identity|who\s+i\s+am|define|refuse\s+to/.test(l)) return 'Identity/Defiance';
  return 'General';
}

// ─── Extract Hook Summaries ─────────────────────────────────────────────────

function extractHookSummaries(scriptResult: string): string[] {
  const summaries: string[] = [];
  // Look for hook lines in the script table
  const hookSection = scriptResult.match(/SCRIPT\s*\(HOOKS?\)([\s\S]*?)(?=SCRIPT\s*\(BODY\)|$)/i);
  if (!hookSection) return summaries;

  // Extract from table rows — look for the hook line column (last column)
  const rows = hookSection[1].split('\n').filter((l) => l.includes('|'));
  for (const row of rows) {
    const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 4) {
      const hookLine = cells[cells.length - 1];
      // Skip header rows
      if (hookLine.toLowerCase().includes('hook line') || hookLine.includes('---')) continue;
      summaries.push(hookLine.slice(0, 80));
    }
  }

  return summaries.slice(0, 3);
}

// ─── Extract Concept Summary ────────────────────────────────────────────────

function extractConceptSummary(conceptText: string): string {
  // Take the first 2 non-empty lines, truncated
  const lines = conceptText
    .split('\n')
    .map((l) => l.replace(/^[#*\-\s]+/, '').trim())
    .filter((l) => l.length > 10 && !l.startsWith('Concept') && !l.startsWith('---'));
  return lines.slice(0, 2).join(' ').slice(0, 200);
}

// ─── Reference Style Extraction ─────────────────────────────────────────────

function extractReferenceStyleRecord(
  batchId: string,
  referenceAnalysis: string,
  direction: CreativeDirection,
): ReferenceStyleRecord | null {
  if (!referenceAnalysis || referenceAnalysis.startsWith('[Reference analysis failed')) return null;

  // Extract key techniques from analysis
  const techniques: string[] = [];
  const techniquePatterns = [
    /fast[- ]cut/i, /slow[- ]?(?:pacing|reveal|build)/i, /text[- ]heavy/i, /text\s+overlay/i,
    /close[- ]?up/i, /wide\s+shot/i, /ugc[- ]?(?:style|feel)/i, /cinematic/i, /testimonial/i,
    /before[- ]?after/i, /split\s+screen/i, /countdown/i, /list[- ]?style/i, /voiceover/i,
  ];
  for (const pat of techniquePatterns) {
    if (pat.test(referenceAnalysis)) {
      const m = referenceAnalysis.match(pat);
      if (m) techniques.push(m[0].toLowerCase());
    }
  }

  // Extract narrative approach
  const narrativeMatch = referenceAnalysis.match(/narrative\s+arc[:\s]*([^\n.]+)/i)
    || referenceAnalysis.match(/framework[:\s]*([^\n.]+)/i);
  const narrative = narrativeMatch ? narrativeMatch[1].trim().slice(0, 100) : '';

  // Extract tone
  const toneMatch = referenceAnalysis.match(/tone[:\s]*([^\n.]+)/i);
  const tone = toneMatch ? toneMatch[1].trim().slice(0, 100) : '';

  return {
    date: new Date().toISOString().split('T')[0],
    batchId,
    fileNames: direction.referenceMedia.map((m) => m.fileName),
    styleSummary: referenceAnalysis.slice(0, 300),
    keyTechniques: techniques.slice(0, 8),
    narrativeApproach: narrative,
    toneDescription: tone,
  };
}

// ─── Main Extractor ─────────────────────────────────────────────────────────

export function saveCompletedBatchToMemory(
  state: AutopilotState,
  direction: CreativeDirection,
  referenceAnalysis: string,
): void {
  const batchId = new Date().toISOString();
  const date = new Date().toISOString().split('T')[0];

  // Parse reviewer output
  const parsedReview = state.reviewResult ? parseReviewResult(state.reviewResult) : null;

  // Build brief records
  const briefRecords: BriefMemoryRecord[] = [];
  const completedTasks = state.tasks.filter((t) => t.step === 'complete' && t.scriptResult);

  for (const ts of completedTasks) {
    const hookSummaries = extractHookSummaries(ts.scriptResult ?? '');
    const hookStyles = hookSummaries.map(classifyHookStyle);
    const conceptSummary = extractConceptSummary(ts.selectedConceptText ?? '');
    const persona = extractPersona(ts.selectedConceptText ?? '', ts.scriptResult ?? '');
    const emotionalEntry = extractEmotionalEntry(ts.selectedConceptText ?? '');

    // Find matching review for this task
    const reviewMatch = parsedReview?.briefs.find(
      (b) => b.taskName.toLowerCase().includes(ts.task.parsed.name.toLowerCase())
    );

    briefRecords.push({
      id: ts.task.parsed.name,
      batchId,
      angle: ts.task.parsed.angle,
      product: ts.task.parsed.product,
      medium: ts.task.parsed.medium,
      duration: ts.task.duration,
      framework: ts.recommendedFramework ?? 'Unknown',
      hookStyles,
      hookSummaries,
      conceptSummary,
      selectionReasoning: ts.selectionReasoning ?? '',
      emotionalEntry,
      persona,
      reviewScore: reviewMatch?.score ?? 7,
      reviewVerdict: reviewMatch?.verdict ?? 'APPROVED',
      reviewFlags: reviewMatch?.checks
        .filter((c) => c.result !== 'PASS')
        .map((c) => c.name) ?? [],
      reviewStrengths: reviewMatch?.strengths ?? [],
      reviewWeaknesses: reviewMatch?.weaknesses ?? [],
    });
  }

  // Build batch record
  const batchRecord: BatchMemoryRecord = {
    batchId,
    date,
    taskCount: state.tasks.length,
    creativeDirection: direction.instructions,
    referenceStyleSummary: referenceAnalysis ? referenceAnalysis.slice(0, 300) : '',
    briefs: briefRecords,
    batchReviewSummary: parsedReview?.batchAssessment ?? '',
    batchFlags: [],
    overallStrongest: parsedReview?.strongestBrief ?? '',
    overallWeakest: parsedReview?.weakestBrief ?? '',
  };

  // Save to memory
  saveBatchToMemory(batchRecord);

  // Save reference style if analysis exists
  const styleRecord = extractReferenceStyleRecord(batchId, referenceAnalysis, direction);
  if (styleRecord) {
    addReferenceStyle(styleRecord);
  }
}
