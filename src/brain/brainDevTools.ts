/**
 * Brain — dev tools exposed on `window.__brain`.
 *
 * These helpers let you (and only you, locally) test brain behavior without
 * a deploy. Everything here is read-only or per-browser persistent via
 * localStorage. None of it ships any data anywhere.
 *
 * Quick reference (paste in browser console):
 *
 *   window.__brain.list()                        // current flag state
 *   window.__brain.enable('differentiationCritic')   // local override on
 *   window.__brain.disable('differentiationCritic')  // local override off
 *   window.__brain.reset('differentiationCritic')    // remove override
 *   window.__brain.resetAll()                    // clear all overrides
 *
 *   await window.__brain.preview({
 *     module: 'briefGenerator',
 *     product: 'compression',
 *     persona: 'beth',
 *   })  // logs the addendum the brain WOULD produce, no flag flipped
 *
 *   await window.__brain.snapshotCurrent()       // downloads current
 *                                                // prompt-builder outputs
 *                                                // as JSON for the baseline
 *
 *   await window.__brain.rebuildVoCIndex()       // force-rebuild + log stats
 *   await window.__brain.showVoCIndex()          // log the current index
 *   await window.__brain.invalidateVoCIndex()    // clear cached index
 *
 *   await window.__brain.deepReasoningEnable()   // turn deep reasoning on
 *   await window.__brain.deepReasoningDisable()  // turn it off
 */
import type { BrainModule, BrainTaskDescriptor } from './brainTypes';
import {
  BRAIN_DEFAULT_FLAGS,
  getAllBrainFlagStates,
  isBrainEnabledFor,
  setLocalBrainFlag,
} from './brainConfig';
import { buildBrainAddendum } from './contextAssembler';
import {
  ensureFreshVoCIndex,
  getCachedVoCIndex,
  invalidateVoCIndex,
  rebuildVoCIndex,
} from './vocIndex';

interface BrainDevTools {
  list(): void;
  enable(module: BrainModule): void;
  disable(module: BrainModule): void;
  reset(module: BrainModule): void;
  resetAll(): void;
  preview(task: BrainTaskDescriptor, opts?: { apiKey?: string }): Promise<void>;
  rebuildVoCIndex(): Promise<void>;
  showVoCIndex(): Promise<void>;
  invalidateVoCIndex(): Promise<void>;
  snapshotCurrent(): Promise<void>;
  deepReasoningEnable(): void;
  deepReasoningDisable(): void;
  deepReasoningReset(): void;
}

declare global {
  interface Window {
    __brain?: BrainDevTools;
  }
}

const ALL_MODULES = Object.keys(BRAIN_DEFAULT_FLAGS) as BrainModule[];

function assertKnownModule(m: string): asserts m is BrainModule {
  if (!ALL_MODULES.includes(m as BrainModule)) {
    throw new Error(`Unknown brain module: "${m}". Known: ${ALL_MODULES.join(', ')}`);
  }
}

/** Install `window.__brain.*` — call once at app startup (in main.tsx). */
export function installBrainDevTools(): void {
  if (typeof window === 'undefined') return;
  if (window.__brain) return; // already installed

  const tools: BrainDevTools = {
    list() {
      const state = getAllBrainFlagStates();
      // eslint-disable-next-line no-console
      console.table(state);
      // eslint-disable-next-line no-console
      console.info('[brain] Use enable("module") / disable("module") / reset("module") to override.');
    },

    enable(module) {
      assertKnownModule(module);
      setLocalBrainFlag(module, 'on');
      // eslint-disable-next-line no-console
      console.info(`[brain] ${module} → ON (browser override). Refresh not required.`);
    },

    disable(module) {
      assertKnownModule(module);
      setLocalBrainFlag(module, 'off');
      // eslint-disable-next-line no-console
      console.info(`[brain] ${module} → OFF (browser override). Refresh not required.`);
    },

    reset(module) {
      assertKnownModule(module);
      setLocalBrainFlag(module, null);
      // eslint-disable-next-line no-console
      console.info(`[brain] ${module} override removed — now using code default (${BRAIN_DEFAULT_FLAGS[module] ? 'on' : 'off'}).`);
    },

    resetAll() {
      for (const m of ALL_MODULES) setLocalBrainFlag(m, null);
      // eslint-disable-next-line no-console
      console.info('[brain] All overrides cleared. Now using code defaults for every module.');
    },

    async preview(task, opts) {
      // Force-enable the requested module for THIS call only — by temporarily
      // setting the override, calling, then restoring the prior state.
      const originalState = localStorage.getItem(`viasox_brain_flag.${task.module}`);
      setLocalBrainFlag(task.module, 'on');
      try {
        const result = await buildBrainAddendum(task, { apiKey: opts?.apiKey });
        // eslint-disable-next-line no-console
        console.info(`[brain.preview] ${task.module} — addendum:\n${result.addendum}`);
        // eslint-disable-next-line no-console
        console.info('[brain.preview] metadata:', result.metadata);
      } finally {
        // Restore prior state — leave the user's actual config untouched.
        if (originalState === 'on') setLocalBrainFlag(task.module, 'on');
        else if (originalState === 'off') setLocalBrainFlag(task.module, 'off');
        else setLocalBrainFlag(task.module, null);
      }
    },

    async rebuildVoCIndex() {
      // eslint-disable-next-line no-console
      console.info('[brain] rebuilding VoC index from current saved analyses (no reviews context — pass reviews via the actual call site)…');
      const index = await rebuildVoCIndex(null);
      // eslint-disable-next-line no-console
      console.info('[brain] rebuilt:', {
        builtAt: new Date(index.builtAt).toISOString(),
        sources: index.sources,
        sliceSizes: {
          topObjections: index.topObjections.length,
          topTestimonials: index.topTestimonials.length,
          recurringQuestions: index.recurringQuestions.length,
          painPoints: index.painPoints.length,
          desires: index.desires.length,
          complaints: index.complaints.length,
          emergingThemes: index.emergingThemes.length,
          personaBeth: index.personaSignals.beth.length,
          personaLinda: index.personaSignals.linda.length,
          productCompression: index.productSignals.compression.length,
          productEasystretch: index.productSignals.easystretch.length,
          productAnkle: index.productSignals.ankle.length,
        },
      });
    },

    async showVoCIndex() {
      const idx = await getCachedVoCIndex();
      if (!idx) {
        // eslint-disable-next-line no-console
        console.info('[brain] no cached VoC index — call rebuildVoCIndex() or run a brain-enabled module first.');
        return;
      }
      // eslint-disable-next-line no-console
      console.info('[brain] VoC index:', idx);
    },

    async invalidateVoCIndex() {
      await invalidateVoCIndex();
      // eslint-disable-next-line no-console
      console.info('[brain] VoC index invalidated — next consumer call will rebuild.');
    },

    async snapshotCurrent() {
      // We don't have a centralized registry of all prompt builders, so for
      // v1 the snapshot helper records the brain's OWN output state plus
      // the current VoC index. This catches the things the brain changes.
      // For ABSOLUTE prompt-builder snapshots, see the design's
      // "verify-against-snapshot" workflow — run individual prompt builders
      // and diff their output manually.
      await ensureFreshVoCIndex(null);
      const snapshot = {
        snapshotAt: new Date().toISOString(),
        defaultFlags: BRAIN_DEFAULT_FLAGS,
        currentFlagState: getAllBrainFlagStates(),
        vocIndex: await getCachedVoCIndex(),
        effectiveEnabledModules: ALL_MODULES.filter((m) => isBrainEnabledFor(m)),
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brain-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // eslint-disable-next-line no-console
      console.info('[brain] snapshot downloaded.');
    },

    deepReasoningEnable() {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('viasox_brain_deep_reasoning', 'on');
      // eslint-disable-next-line no-console
      console.info('[brain] deep reasoning → ON (browser override).');
    },

    deepReasoningDisable() {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('viasox_brain_deep_reasoning', 'off');
      // eslint-disable-next-line no-console
      console.info('[brain] deep reasoning → OFF (browser override).');
    },

    deepReasoningReset() {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem('viasox_brain_deep_reasoning');
      // eslint-disable-next-line no-console
      console.info('[brain] deep reasoning override removed.');
    },
  };

  window.__brain = tools;
  // eslint-disable-next-line no-console
  console.info('[brain] dev tools installed — type window.__brain.list() to start.');
}
