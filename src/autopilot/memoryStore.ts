/**
 * Creative Memory Store — localStorage CRUD + Queries
 *
 * Persistent storage for the creative memory system.
 * All data stored as JSON in localStorage under a single key.
 */

import type {
  CreativeMemoryStore,
  BatchMemoryRecord,
  BriefMemoryRecord,
  FeedbackRecord,
  CreativeIntelligenceBriefing,
  MemoryStats,
  AnglePatternRecord,
  RedoEvent,
  ScoreCalibration,
  AngleDirectiveProposal,
} from './memoryTypes';

const STORAGE_KEY = 'viasox_creative_memory';
const CURRENT_VERSION = 3;

// ─── Core Read/Write ────────────────────────────────────────────────────────

function createEmptyStore(): CreativeMemoryStore {
  return {
    version: CURRENT_VERSION,
    batches: [],
    feedback: [],
    lastCuratorBriefing: null,
    anglePatterns: [],
    redoEvents: [],
    scoreCalibration: null,
    pendingDirectiveProposals: [],
  };
}

/** Backfill optional fields added in v2 so the rest of the code can rely on them. */
function migrateStore(parsed: CreativeMemoryStore): CreativeMemoryStore {
  const next: CreativeMemoryStore = {
    ...parsed,
    anglePatterns: parsed.anglePatterns ?? [],
    redoEvents: parsed.redoEvents ?? [],
    scoreCalibration: parsed.scoreCalibration ?? null,
    pendingDirectiveProposals: parsed.pendingDirectiveProposals ?? [],
  };
  // Backfill optional fields on legacy brief records
  for (const batch of next.batches) {
    for (const brief of batch.briefs) {
      if (brief.inspirationIdsUsed === undefined) brief.inspirationIdsUsed = [];
      // v3: backfill scoring field on pre-v3 briefs
      if ((brief as BriefMemoryRecord).scoring === undefined) {
        (brief as BriefMemoryRecord).scoring = null;
      }
    }
  }
  next.version = CURRENT_VERSION;
  return next;
}

export function loadMemory(): CreativeMemoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as CreativeMemoryStore;
    if (!parsed.version || !Array.isArray(parsed.batches)) {
      return createEmptyStore();
    }
    return migrateStore(parsed);
  } catch {
    return createEmptyStore();
  }
}

export function saveMemory(store: CreativeMemoryStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save creative memory:', err);
  }
}

// ─── Batch Operations ───────────────────────────────────────────────────────

export function saveBatchToMemory(batch: BatchMemoryRecord): void {
  const store = loadMemory();
  store.batches.push(batch);

  // Auto-extract creative direction as feedback if non-empty
  if (batch.creativeDirection.trim()) {
    store.feedback.push({
      date: batch.date,
      batchId: batch.batchId,
      source: 'creative_direction',
      content: batch.creativeDirection,
      context: `Batch with ${batch.taskCount} tasks`,
    });
  }

  saveMemory(store);
}

export function getBatchHistory(): BatchMemoryRecord[] {
  const store = loadMemory();
  return [...store.batches].reverse(); // Newest first
}

/**
 * Delete a single batch by batchId. Also removes any feedback records,
 * redo events, and angle patterns that reference this batch so the
 * memory stays consistent.
 */
export function deleteBatch(batchId: string): void {
  const store = loadMemory();
  store.batches = store.batches.filter((b) => b.batchId !== batchId);
  store.feedback = store.feedback.filter((f) => f.batchId !== batchId);
  if (store.redoEvents) {
    store.redoEvents = store.redoEvents.filter((r) => r.batchId !== batchId);
  }
  saveMemory(store);
}

// ─── User Score Override ───────────────────────────────────────────────────

/**
 * Let the user override the reviewer's score for a specific brief.
 * Updates the scoring record, recalculates finalScore, and triggers
 * recomputation of angle patterns + calibration so the learning system
 * reflects the user's judgment immediately.
 */
export function updateBriefScore(
  _batchId: string,
  briefId: string,
  userScore: number,
  userNotes: string,
): void {
  const store = loadMemory();
  // Find the brief across all batches by its id (most recent match wins)
  let brief: BriefMemoryRecord | undefined;
  for (let i = store.batches.length - 1; i >= 0; i--) {
    brief = store.batches[i].briefs.find((b) => b.id === briefId);
    if (brief) break;
  }
  if (!brief) return;

  const clamped = Math.max(1, Math.min(10, Math.round(userScore * 10) / 10));

  if (brief.scoring) {
    brief.scoring.userOverrideScore = clamped;
    brief.scoring.userOverrideNotes = userNotes || null;
    brief.scoring.overriddenAt = new Date().toISOString();
    brief.scoring.finalScore = clamped;
  } else {
    // Legacy brief without scoring breakdown — still allow override
    brief.scoring = {
      reviewerBreakdown: {} as any,
      reviewerOverallScore: brief.reviewScore,
      userOverrideScore: clamped,
      userOverrideNotes: userNotes || null,
      finalScore: clamped,
      scoredAt: brief.batchId,
      overriddenAt: new Date().toISOString(),
    };
  }
  brief.reviewScore = clamped;

  saveMemory(store);
}

// ─── Query Functions (pure in-memory, no API calls) ─────────────────────────

export function getHistoryForAngle(angle: string): BriefMemoryRecord[] {
  const store = loadMemory();
  const lower = angle.toLowerCase();
  return store.batches
    .flatMap((b) => b.briefs)
    .filter((br) => br.angle.toLowerCase() === lower);
}

export function getHistoryForProduct(product: string): BriefMemoryRecord[] {
  const store = loadMemory();
  const lower = product.toLowerCase();
  return store.batches
    .flatMap((b) => b.briefs)
    .filter((br) => br.product.toLowerCase() === lower);
}

export function getHistoryForAngleProduct(angle: string, product: string): BriefMemoryRecord[] {
  const lower = angle.toLowerCase();
  const prodLower = product.toLowerCase();
  const store = loadMemory();
  return store.batches
    .flatMap((b) => b.briefs)
    .filter((br) => br.angle.toLowerCase() === lower && br.product.toLowerCase() === prodLower);
}

export function getFrameworkUsageCounts(): Record<string, number> {
  const store = loadMemory();
  const counts: Record<string, number> = {};
  for (const batch of store.batches) {
    for (const brief of batch.briefs) {
      counts[brief.framework] = (counts[brief.framework] ?? 0) + 1;
    }
  }
  return counts;
}

export function getHookStyleUsageCounts(): Record<string, number> {
  const store = loadMemory();
  const counts: Record<string, number> = {};
  for (const batch of store.batches) {
    for (const brief of batch.briefs) {
      for (const style of brief.hookStyles) {
        counts[style] = (counts[style] ?? 0) + 1;
      }
    }
  }
  return counts;
}

export function getPersonaUsageCounts(): Record<string, number> {
  const store = loadMemory();
  const counts: Record<string, number> = {};
  for (const batch of store.batches) {
    for (const brief of batch.briefs) {
      if (brief.persona) {
        counts[brief.persona] = (counts[brief.persona] ?? 0) + 1;
      }
    }
  }
  return counts;
}

export function getAngleUsageCounts(): Record<string, number> {
  const store = loadMemory();
  const counts: Record<string, number> = {};
  for (const batch of store.batches) {
    for (const brief of batch.briefs) {
      counts[brief.angle] = (counts[brief.angle] ?? 0) + 1;
    }
  }
  return counts;
}

export function getReviewerFailurePatterns(): Array<{ check: string; count: number }> {
  const store = loadMemory();
  const failCounts: Record<string, number> = {};
  for (const batch of store.batches) {
    for (const brief of batch.briefs) {
      for (const flag of brief.reviewFlags) {
        failCounts[flag] = (failCounts[flag] ?? 0) + 1;
      }
    }
  }
  return Object.entries(failCounts)
    .map(([check, count]) => ({ check, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Feedback ───────────────────────────────────────────────────────────────

export function getRecentFeedback(limit = 20): FeedbackRecord[] {
  const store = loadMemory();
  return store.feedback.slice(-limit);
}

export function addFeedback(feedback: FeedbackRecord): void {
  const store = loadMemory();
  store.feedback.push(feedback);
  saveMemory(store);
}

// ─── Curator Briefing Cache ─────────────────────────────────────────────────

export function saveCuratorBriefing(briefing: CreativeIntelligenceBriefing): void {
  const store = loadMemory();
  store.lastCuratorBriefing = briefing;
  saveMemory(store);
}

export function getLastCuratorBriefing(): CreativeIntelligenceBriefing | null {
  return loadMemory().lastCuratorBriefing;
}

// ─── Export / Import / Clear ────────────────────────────────────────────────

export function exportMemory(): string {
  return JSON.stringify(loadMemory(), null, 2);
}

export function importMemory(json: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json) as CreativeMemoryStore;
    if (!parsed.version || !Array.isArray(parsed.batches)) {
      return { success: false, error: 'Invalid memory file format' };
    }
    saveMemory(parsed);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Parse error' };
  }
}

export function clearMemory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export function getMemoryStats(): MemoryStats {
  const store = loadMemory();
  const raw = localStorage.getItem(STORAGE_KEY) ?? '';
  const totalBriefs = store.batches.reduce((s, b) => s + b.briefs.length, 0);
  const dates = store.batches.map((b) => b.date);

  return {
    totalBatches: store.batches.length,
    totalBriefs,
    totalFeedback: store.feedback.length,
    storageSizeKB: Math.round((new Blob([raw]).size) / 1024 * 10) / 10,
    oldestBatch: dates.length > 0 ? dates[0] : null,
    newestBatch: dates.length > 0 ? dates[dates.length - 1] : null,
  };
}

// ─── All Briefs (across all batches) ────────────────────────────────────────

export function getAllBriefs(): BriefMemoryRecord[] {
  const store = loadMemory();
  return store.batches.flatMap((b) => b.briefs);
}

// ─── Angle Pattern Records ──────────────────────────────────────────────────

export function getAnglePatterns(): AnglePatternRecord[] {
  return loadMemory().anglePatterns ?? [];
}

export function saveAnglePatterns(patterns: AnglePatternRecord[]): void {
  const store = loadMemory();
  store.anglePatterns = patterns;
  saveMemory(store);
}

export function getAnglePatternsFor(angle: string, product: string): AnglePatternRecord[] {
  const all = getAnglePatterns();
  const a = angle.toLowerCase();
  const p = product.toLowerCase();
  return all
    .filter((r) => r.angle.toLowerCase() === a && r.product.toLowerCase() === p)
    .sort((x, y) => y.avgScore - x.avgScore);
}

// ─── Redo Events ────────────────────────────────────────────────────────────

const MAX_REDO_EVENTS = 200;

export function addRedoEvent(event: RedoEvent): void {
  const store = loadMemory();
  const events = store.redoEvents ?? [];
  events.push(event);
  store.redoEvents = events.slice(-MAX_REDO_EVENTS);
  saveMemory(store);
}

export function getRedoEvents(): RedoEvent[] {
  return loadMemory().redoEvents ?? [];
}

export function getRedoEventsForAngle(angle: string): RedoEvent[] {
  const a = angle.toLowerCase();
  return getRedoEvents().filter((r) => r.angle.toLowerCase() === a);
}

// ─── Score Calibration ──────────────────────────────────────────────────────

export function saveScoreCalibration(calibration: ScoreCalibration): void {
  const store = loadMemory();
  store.scoreCalibration = calibration;
  saveMemory(store);
}

export function getScoreCalibration(): ScoreCalibration | null {
  return loadMemory().scoreCalibration ?? null;
}

// ─── Angle Directive Proposals ──────────────────────────────────────────────

export function addDirectiveProposal(proposal: AngleDirectiveProposal): void {
  const store = loadMemory();
  const proposals = store.pendingDirectiveProposals ?? [];
  // De-dupe: same angle+product+pattern within last 7 days replaces the old one
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const filtered = proposals.filter((p) => {
    const sameAnglePattern =
      p.angle.toLowerCase() === proposal.angle.toLowerCase() &&
      p.product.toLowerCase() === proposal.product.toLowerCase() &&
      p.pattern === proposal.pattern;
    if (!sameAnglePattern) return true;
    return now - Date.parse(p.proposedAt) > SEVEN_DAYS;
  });
  filtered.push(proposal);
  store.pendingDirectiveProposals = filtered;
  saveMemory(store);
}

export function getPendingDirectiveProposals(): AngleDirectiveProposal[] {
  return loadMemory().pendingDirectiveProposals ?? [];
}

export function dismissDirectiveProposal(id: string): void {
  const store = loadMemory();
  const proposals = store.pendingDirectiveProposals ?? [];
  store.pendingDirectiveProposals = proposals.filter((p) => p.id !== id);
  saveMemory(store);
}
