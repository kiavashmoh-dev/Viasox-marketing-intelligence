/**
 * Brain — per-module flags + kill switches.
 *
 * All default values here are deliberately FALSE. A fresh build of the app
 * behaves byte-for-byte identically to today's behavior. Modules become
 * brain-enabled only when (a) their default is explicitly flipped to true
 * in this file and committed, OR (b) the user enables them in their browser
 * via `window.__brain.enable('<module>')` (persisted to localStorage, local
 * to that browser).
 *
 * The two kill switches at the bottom are the emergency cut-offs. Flipping
 * either to true short-circuits the corresponding brain behavior globally,
 * regardless of any per-module flag.
 */
import type { BrainModule } from './brainTypes';

/** Default per-module flags. All FALSE by design. Promote a module by
 *  changing its entry to `true` in a code review and deploying. */
export const BRAIN_DEFAULT_FLAGS: Record<BrainModule, boolean> = {
  // Stage 1 — Critics (safest first target)
  differentiationCritic: false,
  conceptEvaluator: false,
  // Stage 2 — Selectors & small producers
  hookGenerator: false,
  conceptSelector: false,
  // Stage 3 — Strategic agents
  creativeStrategist: false,
  personaPrompt: false,
  strategySession: false,
  // Stage 4 — The actual producers (last)
  scriptWriter: false,
  briefGenerator: false,
};

/** Global master kill switch. When true, `buildBrainAddendum` returns the
 *  empty no-op regardless of per-module flags. Flip to true and redeploy
 *  if the brain ever needs to be turned off in production. */
export const BRAIN_KILL_SWITCH = false;

/** Disables ONLY the deep-reasoning second Claude call. VoC slice retrieval
 *  still works. Useful if deep reasoning becomes noisy or expensive but the
 *  baseline brain context is still wanted. */
export const BRAIN_DEEP_REASONING_KILL = false;

// ─── localStorage override layer ──────────────────────────────────────────

/** Key prefix in localStorage. `window.__brain.enable('briefGenerator')`
 *  sets `viasox_brain_flag.briefGenerator = "on"`. Reads check localStorage
 *  first, then fall back to the code default. */
const LS_FLAG_PREFIX = 'viasox_brain_flag.';

/** Returns true if the brain is enabled for the given module. Consults the
 *  master kill switch, the per-module localStorage override, and finally
 *  the code default. */
export function isBrainEnabledFor(module: BrainModule): boolean {
  if (BRAIN_KILL_SWITCH) return false;
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem(LS_FLAG_PREFIX + module);
    if (override === 'on') return true;
    if (override === 'off') return false;
  }
  return BRAIN_DEFAULT_FLAGS[module] ?? false;
}

/** Returns true if deep reasoning is permitted globally. The per-task
 *  trigger rules in `shouldRunDeepReasoning` are checked on top of this. */
export function isDeepReasoningEnabled(): boolean {
  if (BRAIN_KILL_SWITCH) return false;
  if (BRAIN_DEEP_REASONING_KILL) return false;
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('viasox_brain_deep_reasoning');
    if (override === 'off') return false;
    if (override === 'on') return true;
  }
  return true;
}

/** Programmatic per-module override — exposed via `window.__brain.enable/disable`. */
export function setLocalBrainFlag(module: BrainModule, value: 'on' | 'off' | null): void {
  if (typeof localStorage === 'undefined') return;
  const key = LS_FLAG_PREFIX + module;
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

/** Read all current effective flag states — used by `window.__brain.list()`. */
export function getAllBrainFlagStates(): Record<BrainModule, {
  default: boolean;
  override: 'on' | 'off' | null;
  effective: boolean;
}> {
  const out = {} as Record<BrainModule, { default: boolean; override: 'on' | 'off' | null; effective: boolean }>;
  for (const mod of Object.keys(BRAIN_DEFAULT_FLAGS) as BrainModule[]) {
    const def = BRAIN_DEFAULT_FLAGS[mod];
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_FLAG_PREFIX + mod) : null;
    const override = raw === 'on' || raw === 'off' ? raw : null;
    out[mod] = { default: def, override, effective: isBrainEnabledFor(mod) };
  }
  return out;
}
