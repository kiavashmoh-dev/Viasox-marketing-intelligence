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

/** Default per-module flags.
 *
 * All TRUE — operator chose to enable the brain across every module at once
 * (rather than the staged rollout the spec recommended) so quality impact
 * can be observed end-to-end during normal use. If quality drops at any
 * point, the operator can flip the master kill switch via
 * `window.__brain.killAll()` (instant, browser-local) or revert this file's
 * defaults (permanent, redeploy).
 *
 * History:
 *   2026-05-24 — all flags initially set to FALSE per the staged rollout
 *                in docs/superpowers/specs/2026-05-24-brain-architecture-design.md.
 *   2026-05-24 — operator opted into all-modules-on after the foundation
 *                was deployed. Per-stage validation is being deferred to
 *                "in real use" feedback rather than pre-promotion compare. */
export const BRAIN_DEFAULT_FLAGS: Record<BrainModule, boolean> = {
  // Stage 1 — Critics
  differentiationCritic: true,
  conceptEvaluator: true,
  // Stage 2 — Selectors & small producers
  hookGenerator: true,
  conceptSelector: true,
  // Stage 3 — Strategic agents
  creativeStrategist: true,
  personaPrompt: true,
  strategySession: true,
  // Stage 4 — The actual producers
  scriptWriter: true,
  briefGenerator: true,
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

/** localStorage key for the master kill switch — overrides per-module flags
 *  and the code defaults. Set via `window.__brain.killAll()`. */
const LS_KILL_SWITCH_KEY = 'viasox_brain_kill_switch';

/** Returns true if the brain is enabled for the given module. Consults, in
 *  order: the code-level master kill switch, the localStorage master kill
 *  switch, the per-module localStorage override, finally the code default. */
export function isBrainEnabledFor(module: BrainModule): boolean {
  if (BRAIN_KILL_SWITCH) return false;
  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem(LS_KILL_SWITCH_KEY) === 'on') return false;
    const override = localStorage.getItem(LS_FLAG_PREFIX + module);
    if (override === 'on') return true;
    if (override === 'off') return false;
  }
  return BRAIN_DEFAULT_FLAGS[module] ?? false;
}

/** Flip the localStorage-level master kill switch on or off. Exposed via
 *  `window.__brain.killAll()` / `window.__brain.unkillAll()`. */
export function setLocalKillSwitch(value: 'on' | null): void {
  if (typeof localStorage === 'undefined') return;
  if (value === null) localStorage.removeItem(LS_KILL_SWITCH_KEY);
  else localStorage.setItem(LS_KILL_SWITCH_KEY, value);
}

/** Read the current localStorage kill switch state (for `list()` display). */
export function getLocalKillSwitchState(): 'on' | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(LS_KILL_SWITCH_KEY) === 'on' ? 'on' : null;
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
