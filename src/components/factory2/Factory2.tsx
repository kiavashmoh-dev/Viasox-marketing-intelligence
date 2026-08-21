/**
 * Factory V2 — module root.
 *
 * UGC-only interactive brief production. Reuses the universal intake layer
 * (Asana screenshot parser + ManualTaskBuilder + asanaMapper heuristics)
 * and runs the lean V2 pipeline: brainstorm → your answers → concepts →
 * your pick → structured brief → the interactive editor.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FullAnalysis, AwarenessLevel, ProductCategory } from '../../engine/types';
import type { ParsedAsanaTask } from '../../engine/autopilotTypes';
import { parseAsanaScreenshot, fileToBase64 } from '../../autopilot/screenshotParser';
import { mapAsanaTask, AWARENESS_OPTIONS } from '../../autopilot/asanaMapper';
import ManualTaskBuilder from '../autopilot/ManualTaskBuilder';
import type { InspirationItem } from '../../engine/inspirationTypes';
import { getAllItems } from '../../inspiration/inspirationStore';
import type {
  UgcBriefV2,
  V2AdType,
  V2Brainstorm,
  V2SessionState,
  V2Task,
  V2TaskState,
} from '../../factory2/v2Types';
import { taskAdType } from '../../factory2/v2Types';
import { fableFallbackActive } from '../../api/claude';
import {
  generateConcepts,
  runBrainstorm,
  selectFramework,
  synthesizeDirection,
  writeBrief,
  matchReferencesSafe,
  interCallDelay,
} from '../../factory2/v2Engine';
import { saveBrief, getAllBriefs, deleteBrief } from '../../factory2/v2Store';
import { UGC_STYLE_IDS, getUgcStyle, type UgcStyleId } from '../../factory2/ugcStyles';
import BriefEditorV2 from './BriefEditorV2';

const PRODUCTS: ProductCategory[] = ['EasyStretch', 'Compression', 'Ankle Compression'];
const DURATIONS: V2Task['duration'][] = ['1-15 sec', '16-59 sec', '60-90 sec'];

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  onBack: () => void;
}

function toV2Task(parsed: ParsedAsanaTask, pinned?: string): V2Task {
  const mapped = mapAsanaTask(parsed);
  return {
    parsed,
    product: mapped.product,
    awarenessLevel: mapped.scriptParamsBase.awarenessLevel,
    talkingPoint: parsed.angle,
    duration: mapped.duration,
    // Ecom ONLY on an EXPLICIT parsed ad type — the V1 mapper's heuristic
    // defaults to 'Ecom Style' when the column is absent, which would
    // silently flip UGC batches. Explicit or nothing; override in confirm.
    adType: parsed.adType && mapped.scriptParamsBase.adType === 'Ecom Style' ? 'ecom' : 'ugc',
    // W1 flagship as the default — the director picks the real style per
    // task in the confirm table (it's the taxonomy's innovation layer).
    // Ignored (and hidden) for ecom tasks.
    ugcStyle: 'ugc_yap',
    pinnedInspirationId: pinned,
  };
}

export default function Factory2({ apiKey, onBack }: Props) {
  const [session, setSession] = useState<V2SessionState>({ phase: 'idle', tasks: [] });
  const [instructions, setInstructions] = useState('');
  const [entryMode, setEntryMode] = useState<'chooser' | 'manual'>('chooser');
  const [inspirations, setInspirations] = useState<InspirationItem[]>([]);
  const [direction, setDirection] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openBriefId, setOpenBriefId] = useState<string | null>(null);
  const [library, setLibrary] = useState<UgcBriefV2[]>([]);
  const [busyLabel, setBusyLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshLibrary = useCallback(async () => {
    try {
      setLibrary(await getAllBriefs());
    } catch (err) {
      console.error('[factory2] brief library failed to load', err);
    }
  }, []);
  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const loadInspirations = useCallback(async () => {
    try {
      const items = await getAllItems();
      setInspirations(items.filter((it) => it.status === 'ready'));
    } catch {
      /* bank unavailable — pins just won't be offered */
    }
  }, []);

  // ── Intake ─────────────────────────────────────────────────────────────

  const startWithTasks = useCallback(
    (parsedTasks: ParsedAsanaTask[], pins: Record<string, string>) => {
      const tasks: V2TaskState[] = parsedTasks.map((p) => ({
        task: toV2Task(p, pins[p.name]),
        status: 'pending',
        concepts: [],
      }));
      setSession({ phase: 'confirming', tasks });
      void loadInspirations();
    },
    [loadInspirations],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setSession((s) => ({ ...s, error: 'Please upload an image file (PNG, JPG, etc.)' }));
        return;
      }
      setSession({ phase: 'parsing', tasks: [] });
      try {
        const { base64, mediaType } = await fileToBase64(file);
        const parsed = await parseAsanaScreenshot(base64, mediaType, apiKey);
        if (parsed.length === 0) {
          setSession({ phase: 'idle', tasks: [], error: 'No tasks found in the screenshot.' });
          return;
        }
        startWithTasks(parsed, {});
      } catch (err) {
        setSession({ phase: 'idle', tasks: [], error: err instanceof Error ? err.message : String(err) });
      }
    },
    [apiKey, startWithTasks],
  );

  const updateTask = useCallback((i: number, patch: Partial<V2Task>) => {
    setSession((s) => ({
      ...s,
      tasks: s.tasks.map((t, idx) => (idx === i ? { ...t, task: { ...t.task, ...patch } } : t)),
    }));
  }, []);

  const removeTask = useCallback((i: number) => {
    setSession((s) => ({ ...s, tasks: s.tasks.filter((_, idx) => idx !== i) }));
  }, []);

  // ── Pipeline ───────────────────────────────────────────────────────────

  const startBrainstorm = useCallback(async () => {
    abortRef.current = new AbortController();
    setBusyLabel('The strategist is reading your batch…');
    setSession((s) => ({ ...s, phase: 'brainstorm', error: undefined }));
    try {
      const { analysis, questions } = await runBrainstorm(
        session.tasks.map((t) => t.task),
        apiKey,
        abortRef.current.signal,
        instructions,
      );
      setAnswers({});
      setSession((s) => ({
        ...s,
        brainstorm: { analysis, questions, answers: {}, direction: '' },
      }));
    } catch (err) {
      setSession((s) => ({ ...s, phase: 'confirming', error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusyLabel('');
    }
  }, [apiKey, instructions, session.tasks]);

  const submitAnswers = useCallback(async () => {
    if (!session.brainstorm) return;
    abortRef.current = new AbortController();
    setBusyLabel('Synthesizing your direction…');
    const brainstorm: V2Brainstorm = { ...session.brainstorm, answers };
    try {
      const dir = await synthesizeDirection(
        session.tasks.map((t) => t.task),
        brainstorm,
        apiKey,
        abortRef.current.signal,
        instructions,
      );
      setDirection(dir);
      setSession((s) => ({ ...s, phase: 'concepting', brainstorm: { ...brainstorm, direction: dir } }));
      // Generate concepts per task, sequentially with spacing (rate-limit friendly).
      for (let i = 0; i < session.tasks.length; i++) {
        if (abortRef.current?.signal.aborted) break;
        if (i > 0) await interCallDelay(abortRef.current?.signal);
        setBusyLabel(`Generating concepts for ${session.tasks[i].task.parsed.name} (${i + 1}/${session.tasks.length})…`);
        setSession((s) => ({
          ...s,
          tasks: s.tasks.map((t, idx) => (idx === i ? { ...t, status: 'working' } : t)),
        }));
        try {
          const concepts = await generateConcepts(session.tasks[i].task, dir, apiKey, abortRef.current?.signal, instructions);
          setSession((s) => ({
            ...s,
            tasks: s.tasks.map((t, idx) => (idx === i ? { ...t, status: 'awaiting-user', concepts } : t)),
          }));
        } catch (err) {
          setSession((s) => ({
            ...s,
            tasks: s.tasks.map((t, idx) =>
              idx === i ? { ...t, status: 'error', error: err instanceof Error ? err.message : String(err) } : t,
            ),
          }));
        }
      }
      setSession((s) => ({ ...s, phase: 'concept-review' }));
    } catch (err) {
      setSession((s) => ({ ...s, error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusyLabel('');
    }
  }, [answers, apiKey, instructions, session.brainstorm, session.tasks]);

  const pickConcept = useCallback((taskIdx: number, conceptId: string) => {
    setSession((s) => ({
      ...s,
      tasks: s.tasks.map((t, idx) => (idx === taskIdx ? { ...t, selectedConceptId: conceptId } : t)),
    }));
  }, []);

  /** Framework → write → save IMMEDIATELY → match references (non-fatal) →
   *  save again. A vision failure can never discard a completed brief. */
  const produceBriefForTask = useCallback(
    async (i: number, ts: V2TaskState, signal?: AbortSignal) => {
      const concept = ts.concepts.find((c) => c.id === ts.selectedConceptId);
      if (!concept) return;
      setSession((s) => ({
        ...s,
        tasks: s.tasks.map((t, idx) => (idx === i ? { ...t, status: 'working', error: undefined } : t)),
      }));
      try {
        setBusyLabel(`Selecting framework for ${ts.task.parsed.name}…`);
        const framework = await selectFramework(ts.task, concept, apiKey, signal);
        setBusyLabel(`Writing brief for ${ts.task.parsed.name}…`);
        let brief = await writeBrief(ts.task, concept, framework, direction, apiKey, signal, instructions);
        await saveBrief(brief);
        void refreshLibrary();
        setBusyLabel(`Matching storyboard references for ${ts.task.parsed.name}…`);
        brief = await matchReferencesSafe(brief, apiKey, signal);
        await saveBrief(brief);
        void refreshLibrary();
        setSession((s) => ({
          ...s,
          tasks: s.tasks.map((t, idx) => (idx === i ? { ...t, status: 'complete', brief } : t)),
        }));
      } catch (err) {
        setSession((s) => ({
          ...s,
          tasks: s.tasks.map((t, idx) =>
            idx === i ? { ...t, status: 'error', error: err instanceof Error ? err.message : String(err) } : t,
          ),
        }));
      }
    },
    [apiKey, direction, instructions, refreshLibrary],
  );

  const writeBriefs = useCallback(async () => {
    abortRef.current = new AbortController();
    setSession((s) => ({ ...s, phase: 'writing' }));
    for (let i = 0; i < session.tasks.length; i++) {
      if (abortRef.current?.signal.aborted) break;
      if (i > 0) await interCallDelay(abortRef.current?.signal);
      await produceBriefForTask(i, session.tasks[i], abortRef.current?.signal);
    }
    setBusyLabel('');
    setSession((s) => ({ ...s, phase: 'editor' }));
  }, [produceBriefForTask, session.tasks]);

  /** Per-task retry after an error — reuses the stored direction/concepts. */
  const retryTask = useCallback(
    async (i: number) => {
      const ts = session.tasks[i];
      abortRef.current = new AbortController();
      if (ts.selectedConceptId) {
        await produceBriefForTask(i, ts, abortRef.current.signal);
      } else if (direction) {
        // Concept generation failed earlier — retry that step.
        setSession((s) => ({
          ...s,
          tasks: s.tasks.map((t, idx) => (idx === i ? { ...t, status: 'working', error: undefined } : t)),
        }));
        try {
          setBusyLabel(`Generating concepts for ${ts.task.parsed.name}…`);
          const concepts = await generateConcepts(ts.task, direction, apiKey, abortRef.current.signal, instructions);
          setSession((s) => ({
            ...s,
            phase: 'concept-review',
            tasks: s.tasks.map((t, idx) => (idx === i ? { ...t, status: 'awaiting-user', concepts } : t)),
          }));
        } catch (err) {
          setSession((s) => ({
            ...s,
            tasks: s.tasks.map((t, idx) =>
              idx === i ? { ...t, status: 'error', error: err instanceof Error ? err.message : String(err) } : t,
            ),
          }));
        }
      }
      setBusyLabel('');
    },
    [apiKey, direction, instructions, produceBriefForTask, session.tasks],
  );

  const cancelWork = useCallback(() => {
    abortRef.current?.abort();
    setBusyLabel('');
  }, []);

  // Abort in-flight work when the module unmounts (navigation away).
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── Open brief in editor ───────────────────────────────────────────────
  // Resolve from the library state; fall back to the in-session task briefs
  // (a brief completed seconds ago may not be in the refreshed library yet).

  const openBrief =
    library.find((b) => b.id === openBriefId) ??
    session.tasks.find((t) => t.brief?.id === openBriefId)?.brief ??
    null;
  if (openBrief) {
    return (
      <BriefEditorV2
        brief={openBrief}
        apiKey={apiKey}
        onClose={() => {
          setOpenBriefId(null);
          refreshLibrary();
        }}
        onSaved={(b) => {
          void (async () => {
            try {
              await saveBrief(b);
              await refreshLibrary();
            } catch (err) {
              window.alert(err instanceof Error ? err.message : String(err));
            }
          })();
        }}
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-navy">The Factory V2</h2>
          {fableFallbackActive() && (
            <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-900 align-middle ml-2" title="This API key is not enabled for Fable 5 — generations are running on the Opus 5 fallback. Enable Fable 5 on the key to restore the primary model.">
              ⚠ Fallback model: Opus 5
            </span>
          )}
          <p className="text-sm text-slate-500">
            Interactive UGC brief production — brainstorm, concepts, and a brief you can edit line by line.
          </p>
        </div>
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 underline">
          ← Dashboard
        </button>
      </div>

      {session.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">{session.error}</div>
      )}
      {busyLabel && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="animate-pulse">{busyLabel}</span>
          <button onClick={cancelWork} className="text-xs text-blue-700 underline hover:text-blue-900 ml-4">
            Cancel
          </button>
        </div>
      )}

      {/* Phase: idle — chooser + library */}
      {session.phase === 'idle' && entryMode === 'chooser' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
            >
              <div className="text-3xl mb-2">📸</div>
              <div className="font-semibold text-slate-700">Upload Asana screenshot</div>
              <div className="text-xs text-slate-500 mt-1">Same parser as V1 — tasks extracted automatically</div>
            </button>
            <button
              onClick={() => setEntryMode('manual')}
              className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
            >
              <div className="text-3xl mb-2">⌨️</div>
              <div className="font-semibold text-slate-700">Build tasks manually</div>
              <div className="text-xs text-slate-500 mt-1">Same table builder as V1</div>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
          />

          {library.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Saved V2 briefs</h3>
              <div className="space-y-2">
                {library.map((b) => (
                  <div key={b.id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-slate-700">{b.taskName}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {taskAdType(b.task) === 'ecom' ? 'Ecom' : getUgcStyle(b.task.ugcStyle).shortLabel} · {b.framework.name} · {b.task.awarenessLevel} · v{b.version}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setOpenBriefId(b.id)} className="text-xs text-blue-600 hover:underline">
                        Open editor
                      </button>
                      <button
                        onClick={() => {
                          void (async () => {
                            try {
                              await deleteBrief(b.id);
                            } catch (err) {
                              console.error('[factory2] delete failed', err);
                            }
                            await refreshLibrary();
                          })();
                        }}
                        className="text-xs text-slate-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {session.phase === 'idle' && entryMode === 'manual' && (
        <ManualTaskBuilder
          onComplete={(tasks, pins) => {
            setEntryMode('chooser');
            startWithTasks(tasks, pins);
          }}
          onCancel={() => setEntryMode('chooser')}
        />
      )}

      {session.phase === 'parsing' && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 animate-pulse">
          Reading your Asana screenshot…
        </div>
      )}

      {/* Phase: confirming — the V2 planner (UGC-locked) */}
      {session.phase === 'confirming' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800">Confirm your UGC tasks</h3>
            <p className="text-xs text-slate-500">
              Every V2 task is UGC. The <strong>UGC style</strong> is the innovation layer — it dictates the
              whole delivery: visuals, shots, register, pacing, framework leanings. Pin a bank ad{' '}
              <strong>in the same style</strong> as the exemplar of what finished looks like (strongly
              recommended — generation studies its hooks, beats, pace, and product positioning).
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">Task</th>
                <th className="py-2 pr-2">Talking point / angle</th>
                <th className="py-2 pr-2">Product</th>
                <th className="py-2 pr-2">Awareness</th>
                <th className="py-2 pr-2">Ad type / style</th>
                <th className="py-2 pr-2">Duration</th>
                <th className="py-2 pr-2">Exemplar (pin)</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {session.tasks.map((t, i) => (
                <tr key={t.task.parsed.name + i} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-2 font-medium text-slate-700">{t.task.parsed.name}</td>
                  <td className="py-2 pr-2">
                    <input
                      value={t.task.talkingPoint}
                      onChange={(e) => updateTask(i, { talkingPoint: e.target.value })}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={t.task.product}
                      onChange={(e) => updateTask(i, { product: e.target.value as ProductCategory })}
                      className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                    >
                      {PRODUCTS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={t.task.awarenessLevel}
                      onChange={(e) => updateTask(i, { awarenessLevel: e.target.value as AwarenessLevel })}
                      className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                    >
                      {AWARENESS_OPTIONS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex flex-col gap-1">
                      <select
                        value={taskAdType(t.task)}
                        onChange={(e) => updateTask(i, { adType: e.target.value as V2AdType })}
                        className={`border rounded px-2 py-1 text-xs font-semibold max-w-[170px] ${taskAdType(t.task) === 'ecom' ? 'border-sky-400 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-700'}`}
                        title={taskAdType(t.task) === 'ecom' ? 'Editing brief — built from the footage library + AI voiceover, read verbatim' : 'Creator brief — a real person films it on their phone'}
                      >
                        <option value="ugc">UGC (creator)</option>
                        <option value="ecom">Ecom (editing)</option>
                      </select>
                      {taskAdType(t.task) === 'ugc' && (
                        <select
                          value={t.task.ugcStyle}
                          onChange={(e) => updateTask(i, { ugcStyle: e.target.value as UgcStyleId })}
                          className="border border-amber-300 bg-amber-50/50 rounded px-2 py-1 text-xs font-medium text-slate-800 max-w-[170px]"
                          title={getUgcStyle(t.task.ugcStyle).oneLiner}
                        >
                          {UGC_STYLE_IDS.map((id) => {
                            const s = getUgcStyle(id);
                            return (
                              <option key={id} value={id}>
                                {s.shortLabel}{s.tier === 'week' ? '' : s.tier === 'bench' ? ' (bench)' : ' (bank)'}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={t.task.duration}
                      onChange={(e) => updateTask(i, { duration: e.target.value as V2Task['duration'] })}
                      className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                    >
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={t.task.pinnedInspirationId ?? ''}
                      onChange={(e) => updateTask(i, { pinnedInspirationId: e.target.value || undefined })}
                      className="border border-slate-200 rounded px-2 py-1 text-xs bg-white max-w-[160px]"
                      disabled={inspirations.length === 0}
                    >
                      <option value="">{inspirations.length === 0 ? '(bank empty)' : '(none)'}</option>
                      {inspirations.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.starred ? '★ ' : ''}{it.title || it.filename}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeTask(i)} className="text-xs text-slate-400 hover:text-red-600">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Batch instructions <span className="text-slate-400 font-normal">(campaign context, occasion, constraints)</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., These are for our Labor Day sale — the last long weekend of summer. We want ads that live inside how people actually celebrate (backyard, barbecue, family), not a sale announcement with a flag on it."
              className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Highest-priority context for every step, including line regenerations. Name an occasion here and the
              whole pipeline treats it as creative fuel — storytelling, visuals, casting, environment, and framework
              choices connect to it at the deepest level (never just &ldquo;buy during our sale&rdquo;).
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSession({ phase: 'idle', tasks: [] })}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Cancel
            </button>
            <button
              onClick={() => void startBrainstorm()}
              disabled={session.tasks.length === 0}
              className="text-sm bg-navy text-cream px-5 py-2 rounded-lg hover:bg-navy-deep font-medium disabled:opacity-40"
            >
              Start brainstorm →
            </button>
          </div>
        </div>
      )}

      {/* Phase: brainstorm — analysis + questions */}
      {session.phase === 'brainstorm' && session.brainstorm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">The strategist's read</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{session.brainstorm.analysis}</p>
          </div>
          <div className="space-y-4">
            {session.brainstorm.questions.map((q) => (
              <div key={q.id} className="border border-slate-100 rounded-lg p-4">
                <div className="text-sm font-medium text-slate-700 mb-2">{q.question}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        answers[q.id] === opt
                          ? 'bg-navy text-cream border-navy'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  placeholder="…or answer in your own words"
                  value={q.options.includes(answers[q.id] ?? '') ? '' : (answers[q.id] ?? '')}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => void submitAnswers()}
              disabled={!!busyLabel}
              className="text-sm bg-navy text-cream px-5 py-2 rounded-lg hover:bg-navy-deep font-medium disabled:opacity-40"
            >
              Submit answers → generate concepts
            </button>
          </div>
        </div>
      )}

      {/* Phase: concepting/concept-review */}
      {(session.phase === 'concepting' || session.phase === 'concept-review') && (
        <div className="space-y-4">
          {session.tasks.map((t, i) => (
            <div key={t.task.parsed.name + i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{t.task.parsed.name}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">{t.task.product}</span>
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">{t.task.awarenessLevel}</span>
                    {taskAdType(t.task) === 'ecom' ? (
                      <span className="rounded-full bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-semibold">Ecom</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-medium">{getUgcStyle(t.task.ugcStyle).shortLabel}</span>
                    )}
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">{t.task.duration}</span>
                  </div>
                </div>
                {t.status === 'working' && (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-sky-700 shrink-0">
                    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
                    generating concepts…
                  </span>
                )}
              </div>
              <div className="p-5">
                {t.error && <div className="text-xs text-red-600 mb-3">{t.error}</div>}
                {t.concepts.length === 0 && t.status === 'working' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[0, 1, 2].map((k) => (
                      <div key={k} className="rounded-xl border border-slate-200 p-4 animate-pulse space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-6 w-6 rounded-full bg-slate-200" />
                          <div className="h-4 w-24 rounded-full bg-slate-100" />
                        </div>
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-2.5 rounded bg-slate-100" />
                          <div className="h-2.5 rounded bg-slate-100" />
                          <div className="h-2.5 w-2/3 rounded bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {t.concepts.map((c, ci) => {
                      const selected = t.selectedConceptId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => pickConcept(i, c.id)}
                          className={`relative flex flex-col text-left rounded-xl border p-4 transition-all duration-150 ${
                            selected
                              ? 'border-navy ring-2 ring-navy/60 bg-cream/40 shadow-md'
                              : 'border-slate-200 bg-white hover:border-navy/40 hover:shadow-md hover:-translate-y-0.5'
                          }`}
                        >
                          {selected && (
                            <span className="absolute -top-2.5 right-3 bg-navy text-cream text-[10px] font-bold rounded-full px-2.5 py-0.5 shadow-sm">
                              ✓ SELECTED
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-2.5">
                            <span
                              className={`h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                                selected ? 'bg-navy text-cream' : 'bg-navy/10 text-navy'
                              }`}
                            >
                              {ci + 1}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                                c.productEntry === 'product-forward' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {c.productEntry === 'product-forward' ? 'Product-forward' : 'Earned entry'}
                            </span>
                          </div>
                          <div className="font-display font-bold text-navy text-sm leading-snug mb-2">{c.title}</div>
                          <p className="text-xs text-slate-600 leading-relaxed flex-1">{c.summary}</p>
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                            <div>
                              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-navy/50 mb-0.5">Sells</div>
                              <div className="text-[11px] text-slate-700 leading-snug">{c.productTruth}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-navy/50 mb-0.5">Opens on</div>
                              <div className="text-[11px] text-slate-600 leading-snug line-clamp-2" title={c.openingDetails}>
                                {c.openingDetails}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {session.phase === 'concept-review' && (
            <div className="flex justify-end">
              <button
                onClick={() => void writeBriefs()}
                disabled={!session.tasks.some((t) => t.selectedConceptId)}
                className="text-sm bg-navy text-cream px-5 py-2 rounded-lg hover:bg-navy-deep font-medium disabled:opacity-40"
              >
                Write briefs for selected concepts →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase: writing / editor — task cards linking into the editor */}
      {(session.phase === 'writing' || session.phase === 'editor') && (
        <div className="space-y-3">
          {session.tasks.map((t, i) => (
            <div key={t.task.parsed.name} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800">{t.task.parsed.name}</div>
                <div className={`text-xs ${t.status === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
                  {t.status === 'complete' && t.brief ? (
                    `${t.brief.framework.name} · ${t.brief.storyboard.length} clips${t.brief.rippleFlags.length > 0 ? ` · ${t.brief.rippleFlags.length} QA flag${t.brief.rippleFlags.length === 1 ? '' : 's'}` : ''}`
                  ) : t.status === 'error' ? (
                    t.error
                  ) : t.status === 'working' ? (
                    <span className="inline-flex items-center gap-1.5 text-sky-700 font-medium">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
                      writing the brief…
                    </span>
                  ) : !t.selectedConceptId ? (
                    'no concept selected — skipped'
                  ) : (
                    'queued…'
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {t.status === 'error' && (
                  <button
                    onClick={() => void retryTask(i)}
                    disabled={!!busyLabel}
                    className="text-sm border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                  >
                    Retry
                  </button>
                )}
                {session.phase === 'editor' && !t.selectedConceptId && t.concepts.length > 0 && (
                  <button
                    onClick={() => setSession((s) => ({ ...s, phase: 'concept-review' }))}
                    className="text-sm border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Pick concept
                  </button>
                )}
                {t.brief && (
                  <button
                    onClick={() => setOpenBriefId(t.brief!.id)}
                    className="text-sm bg-navy text-cream px-4 py-1.5 rounded-lg hover:bg-navy-deep"
                  >
                    Open editor
                  </button>
                )}
              </div>
            </div>
          ))}
          {session.phase === 'editor' && (
            <div className="flex justify-end">
              <button
                onClick={() => setSession({ phase: 'idle', tasks: [] })}
                className="text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Start a new batch
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
