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
} from './memoryTypes';

const STORAGE_KEY = 'viasox_creative_memory';
const CURRENT_VERSION = 1;

// ─── Core Read/Write ────────────────────────────────────────────────────────

function createEmptyStore(): CreativeMemoryStore {
  return {
    version: CURRENT_VERSION,
    batches: [],
    feedback: [],
    lastCuratorBriefing: null,
  };
}

export function loadMemory(): CreativeMemoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as CreativeMemoryStore;
    if (!parsed.version || !Array.isArray(parsed.batches)) {
      return createEmptyStore();
    }
    // Future: run migrations if parsed.version < CURRENT_VERSION
    return parsed;
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
