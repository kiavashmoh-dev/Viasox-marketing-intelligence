/**
 * Brain — session-scoped cache for deep-reasoning outputs.
 *
 * The brain's deep-reasoning call (a Sonnet pass that interrogates the VoC
 * index for task-relevant gaps) costs 10-25 seconds per fire. Inside an
 * autopilot batch, the previous wiring fired it PER BRIEF for the Creative
 * Strategist module — N briefs = N deep-reasoning calls, adding minutes
 * of wall-clock that the design intended to avoid.
 *
 * This module is the fix: a session-scoped cache. The autopilot generates
 * one session ID at the start of a batch and threads it through every
 * brain call. The first brain call that fires deep reasoning (typically
 * the strategy session) caches the output under that session ID. Every
 * subsequent brain call in the same batch retrieves the cached output
 * instead of making a fresh Claude call.
 *
 * Storage is in-memory only (Map), so sessions die on page reload — which
 * is correct: an autopilot batch always lives within a single page session.
 * Cleanup is explicit (`clearBrainSession`) but not strictly required —
 * stale sessions consume O(1KB) each and bound is the user starting many
 * autopilot batches without reloading (extremely rare).
 */

interface BrainSessionRecord {
  /** Cached deep-reasoning markdown output (raw, ready to be rendered). */
  deepReasoning: string;
  /** When the cache entry was populated (ms epoch). */
  cachedAt: number;
  /** Approximate token count of the cached output (for telemetry). */
  approxTokens: number;
}

const sessionCache = new Map<string, BrainSessionRecord>();

/** Create a fresh session ID. The autopilot calls this once at the start
 *  of a batch and threads the returned ID through every brain call. */
export function createBrainSession(): string {
  return `brain-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Store a deep-reasoning output for a given session. Idempotent — calling
 *  twice with the same sessionId overwrites the prior cache. */
export function cacheDeepReasoning(sessionId: string, output: string): void {
  sessionCache.set(sessionId, {
    deepReasoning: output,
    cachedAt: Date.now(),
    approxTokens: Math.round(output.length / 4),
  });
}

/** Look up a cached deep-reasoning output for a session. Returns null if
 *  the session doesn't exist or has no cached output yet. */
export function getCachedDeepReasoning(sessionId: string): BrainSessionRecord | null {
  return sessionCache.get(sessionId) ?? null;
}

/** Remove a session's cache entry. Called by the autopilot when the batch
 *  finishes (success or error). Safe to call on unknown sessionIds. */
export function clearBrainSession(sessionId: string): void {
  sessionCache.delete(sessionId);
}

/** Telemetry / debug: how many sessions are currently cached. */
export function getActiveSessionCount(): number {
  return sessionCache.size;
}

/** Debug: dump all session state. Used by window.__brain.showSessions(). */
export function getAllSessions(): Array<{ sessionId: string } & BrainSessionRecord> {
  return Array.from(sessionCache.entries()).map(([sessionId, rec]) => ({
    sessionId,
    ...rec,
  }));
}

// ─── Module-scoped "current session" helpers ─────────────────────────────
//
// The autopilot's brain calls are spread across multiple files
// (pipelineEngine.ts, differentiationCritic.ts, creativeStrategist.ts). To
// avoid threading sessionId through every function signature, these helpers
// maintain a single "current autopilot session" at module scope. Any
// autopilot file calls ensureCurrentBrainSession() before invoking the
// brain — same ID returned across all callers until endCurrentBrainSession()
// fires.

let currentBrainSessionId: string | null = null;

/** Get the currently-active brain session ID, creating one if none exists.
 *  Idempotent — calling repeatedly within a batch returns the same ID. */
export function ensureCurrentBrainSession(): string {
  if (!currentBrainSessionId) {
    currentBrainSessionId = createBrainSession();
    // eslint-disable-next-line no-console
    console.info(`[brain] new autopilot session: ${currentBrainSessionId}`);
  }
  return currentBrainSessionId;
}

/** Return the current session ID without creating one. Returns null if
 *  no session is active. Useful for guard checks. */
export function getCurrentBrainSession(): string | null {
  return currentBrainSessionId;
}

/** End the current autopilot session — clears the deep-reasoning cache.
 *  Safe to call when no session exists (no-op). Called at the end of the
 *  autopilot batch (success or error path). */
export function endCurrentBrainSession(): void {
  if (currentBrainSessionId) {
    clearBrainSession(currentBrainSessionId);
    // eslint-disable-next-line no-console
    console.info(`[brain] ended autopilot session: ${currentBrainSessionId}`);
    currentBrainSessionId = null;
  }
}
