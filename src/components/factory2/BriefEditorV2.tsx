/**
 * Factory V2 — the interactive brief editor.
 *
 * Renders the standardized UGC brief as a live document. Every strategic
 * element — header fields, hooks, CTAs, script lines, shot descriptions,
 * reference screenshots, and the framework itself — can be clicked and
 * regenerated with feedback. Feedback is law: it enters the brief's ledger
 * and binds every subsequent generation. After each edit a ripple check
 * flags any lines that are now inconsistent.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScriptFramework } from '../../engine/types';
import { getFrames } from '../../inspiration/inspirationStore';
import type { UgcBriefV2, V2RegenTarget } from '../../factory2/v2Types';
import { UGC_FRAMEWORKS } from '../../factory2/v2Types';
import { applyRegen } from '../../factory2/v2Engine';
import { exportBriefDoc } from '../../factory2/v2Export';
import { INTRO_CALLOUT } from '../../factory2/templateBoilerplate';
import { getUgcStyle } from '../../factory2/ugcStyles';

interface Props {
  brief: UgcBriefV2;
  apiKey: string;
  onClose: () => void;
  onSaved: (brief: UgcBriefV2) => void;
}

interface PopoverState {
  target: V2RegenTarget;
  label: string;
}

/** Hoverable wrapper: shows a ↻ affordance and opens the feedback popover. */
function Regenable({
  label,
  onRegen,
  children,
  disabled,
}: {
  label: string;
  onRegen: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="group relative">
      {children}
      {!disabled && (
        <button
          onClick={onRegen}
          title={`Regenerate ${label}`}
          className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] bg-navy text-cream rounded px-1.5 py-0.5"
        >
          ↻
        </button>
      )}
    </div>
  );
}

export default function BriefEditorV2({ brief: initial, apiKey, onClose, onSaved }: Props) {
  const [brief, setBrief] = useState<UgcBriefV2>(initial);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [frameCache, setFrameCache] = useState<Record<string, string[]>>({});
  const [showLedger, setShowLedger] = useState(false);

  // Load frames for every referenced inspiration item.
  const referencedItemIds = useMemo(
    () =>
      Array.from(
        new Set(
          brief.storyboard
            .map((r) => (r.reference.kind === 'frame' ? r.reference.itemId : null))
            .filter((x): x is string => !!x),
        ),
      ),
    [brief.storyboard],
  );

  // Fetch frames once per item id (tracked in a ref — frameCache must NOT be
  // an effect dependency or every setFrameCache restarts the fetch loop).
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    const missing = referencedItemIds.filter((id) => !fetchedIdsRef.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => fetchedIdsRef.current.add(id));
    (async () => {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            return [id, await getFrames(id)] as const;
          } catch {
            return [id, [] as string[]] as const;
          }
        }),
      );
      if (!cancelled) {
        setFrameCache((c) => {
          const next = { ...c };
          for (const [id, frames] of results) next[id] = frames;
          return next;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [referencedItemIds]);

  // One regen at a time: concurrent regens would race on the same base brief
  // and the loser's result (and ledger entry) would be silently dropped.
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const runRegen = useCallback(
    async (target: V2RegenTarget, fb: string) => {
      if (busy) return;
      abortRef.current = new AbortController();
      setBusy(
        target.type === 'framework-switch'
          ? 'Rewriting the brief under the new framework…'
          : target.type === 'framework-regenerate'
            ? 'Restructuring the framework…'
            : 'Regenerating…',
      );
      setError('');
      setPopover(null);
      setFeedback('');
      try {
        const { brief: updated } = await applyRegen(brief, target, fb, apiKey, abortRef.current.signal);
        setBrief(updated);
        onSaved(updated);
      } catch (err) {
        if (!/cancelled/i.test(String(err))) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setBusy('');
      }
    },
    [apiKey, brief, busy, onSaved],
  );

  const openPopover = useCallback(
    (target: V2RegenTarget, label: string) => {
      if (busy) return; // one operation at a time — no concurrent regens
      setPopover({ target, label });
      setFeedback('');
    },
    [busy],
  );

  const thumbFor = useCallback(
    (rowId: string): { src?: string; label: string } => {
      const row = brief.storyboard.find((r) => r.id === rowId);
      if (!row) return { label: '' };
      if (row.reference.kind === 'same-as') return { label: `Same as clip ${row.reference.clipNumber}` };
      if (row.reference.kind === 'none') return { label: row.reference.reason };
      const frames = frameCache[row.reference.itemId];
      if (frames === undefined) return { label: 'loading…' };
      const src = frames[row.reference.frameIndex];
      return src ? { src, label: '' } : { label: 'frames unavailable' };
    },
    [brief.storyboard, frameCache],
  );

  const handleExport = useCallback(async () => {
    setBusy('Building the .doc export…');
    try {
      await exportBriefDoc(brief, frameCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy('');
    }
  }, [brief, frameCache]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-navy">{brief.taskName}</h2>
          <p className="text-xs text-slate-500">
            {brief.task.product} · {brief.task.talkingPoint} · {brief.task.awarenessLevel} ·{' '}
            <span className="text-amber-700 font-medium">{getUgcStyle(brief.task.ugcStyle).name}</span> ·{' '}
            {brief.task.duration} · v{brief.version}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLedger((s) => !s)} className="text-xs text-slate-500 hover:text-slate-700 underline">
            Feedback ledger ({brief.feedbackLedger.length})
          </button>
          <button onClick={() => void handleExport()} className="text-sm border border-slate-300 px-4 py-1.5 rounded-lg hover:bg-slate-50">
            Export .doc
          </button>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 underline">
            ← Back
          </button>
        </div>
      </div>

      {busy && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="animate-pulse">{busy}</span>
          <button onClick={() => abortRef.current?.abort()} className="text-xs text-blue-700 underline hover:text-blue-900 ml-4">
            Cancel
          </button>
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* Ripple flags */}
      {brief.rippleFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <div className="font-medium text-amber-900 mb-1">Consistency flags from the last edit</div>
          <ul className="space-y-1">
            {brief.rippleFlags.map((f) => (
              <li key={f.id} className="text-amber-800 text-xs">
                <strong>{f.target}:</strong> {f.issue} — <em>{f.suggestion}</em>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ledger */}
      {showLedger && (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-600 space-y-1">
          {brief.feedbackLedger.length === 0 && <div>No feedback yet. Everything you tell the editor lands here and binds every future generation.</div>}
          {brief.feedbackLedger.map((f) => (
            <div key={f.id}>
              <span className="text-slate-400">[{f.target}]</span> {f.feedback}
            </div>
          ))}
        </div>
      )}

      {/* Intro callout (evergreen) */}
      <div className="bg-slate-100 rounded-xl px-5 py-4 text-sm text-slate-700">💡 {INTRO_CALLOUT}</div>

      {/* Framework control */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Framework — the narrative engine</div>
            <div className="font-semibold text-slate-800">{brief.framework.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{brief.framework.rationale}</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={brief.framework.name}
              onChange={(e) => {
                const nf = e.target.value as ScriptFramework;
                if (nf !== brief.framework.name) {
                  void runRegen({ type: 'framework-switch', newFramework: nf }, '');
                }
              }}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              disabled={!!busy}
            >
              {UGC_FRAMEWORKS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <button
              onClick={() => openPopover({ type: 'framework-regenerate' }, 'the framework structure')}
              className="text-sm border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50"
              disabled={!!busy}
            >
              Restructure with feedback…
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Switching rewrites the script and storyboard under the new engine while holding the concept, product truth, and all your feedback constant.
        </p>
      </div>

      {/* Header fields */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {(
          [
            ['concept', 'Concept', brief.header.concept],
            ['angle', 'Angle', brief.header.angle],
            ['videoTonality', 'Video tonality', brief.header.videoTonality],
            ['attire', 'Attire', brief.header.attire],
          ] as const
        ).map(([field, label, value]) => (
          <Regenable key={field} label={label} onRegen={() => openPopover({ type: 'header-field', field }, label)}>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
              <div className="text-slate-700 pr-6">{value || <span className="text-slate-300">—</span>}</div>
            </div>
          </Regenable>
        ))}
        <Regenable label="Per-brief instructions" onRegen={() => openPopover({ type: 'header-field', field: 'instructions' }, 'per-brief instructions')}>
          <div className="md:col-span-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Per-brief instructions</div>
            <ul className="list-disc ml-5 text-slate-700 pr-6">
              {brief.header.instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>
        </Regenable>
      </div>

      {/* Hooks + CTAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Hooks (first = primary; alternates feed the variation matrix)</div>
          <div className="space-y-2">
            {brief.hooks.map((h, i) => (
              <Regenable key={h.id} label={`hook ${i + 1}`} onRegen={() => openPopover({ type: 'hook', lineId: h.id }, `hook ${i + 1}`)}>
                <div className={`text-sm pr-6 ${i === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                  {i + 1}. {h.text}
                </div>
              </Regenable>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">CTA options</div>
          <div className="space-y-2">
            {brief.ctas.map((c, i) => (
              <Regenable key={c.id} label={`CTA ${i + 1}`} onRegen={() => openPopover({ type: 'cta', lineId: c.id }, `CTA ${i + 1}`)}>
                <div className={`text-sm pr-6 ${i === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                  {i + 1}. {c.text}
                </div>
              </Regenable>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Concept: <span className="text-slate-600">{brief.concept.title}</span> · sells{' '}
            <span className="text-slate-600">{brief.concept.productTruth}</span>
          </div>
        </div>
      </div>

      {/* Script prose */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">
          Script — full read-through (the creator internalizes this before the shot list)
        </div>
        <Regenable label="the script prose" onRegen={() => openPopover({ type: 'script-prose' }, 'the full script prose')}>
          <p className="text-sm text-slate-700 whitespace-pre-wrap pr-6">{brief.scriptProse}</p>
        </Regenable>
      </div>

      {/* Storyboard */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 overflow-x-auto">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-3">Storyboard</div>
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-2 w-10">Clip</th>
              <th className="py-2 pr-2 w-14">Audio</th>
              <th className="py-2 pr-2 w-[26%]">Script</th>
              <th className="py-2 pr-2 w-24">Shot type</th>
              <th className="py-2 pr-2 w-[26%]">Shot description</th>
              <th className="py-2 pr-2 w-28">Reference</th>
              <th className="py-2 w-[16%]">Editor notes</th>
            </tr>
          </thead>
          <tbody>
            {brief.storyboard.map((r) => {
              const thumb = r.reference.kind === 'frame' ? thumbFor(r.id) : null;
              return (
                <tr key={r.id} className={`border-b border-slate-100 align-top ${r.clipNumber === 'end-card' ? 'bg-slate-50' : ''}`}>
                  <td className="py-2 pr-2 font-medium text-slate-700">
                    {r.clipNumber === 'end-card' ? 'End Card' : r.clipNumber}
                  </td>
                  <td className="py-2 pr-2 text-slate-500">{r.audioType}</td>
                  <td className="py-2 pr-2">
                    {r.clipNumber !== 'end-card' ? (
                      <Regenable label={`clip ${r.clipNumber} script`} onRegen={() => openPopover({ type: 'row-script', rowId: r.id }, `clip ${r.clipNumber} script line`)}>
                        <div className="text-slate-700 pr-6">{r.scriptLine}</div>
                      </Regenable>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-slate-500 text-xs font-medium">{r.shotType}</td>
                  <td className="py-2 pr-2">
                    {r.clipNumber !== 'end-card' ? (
                      <Regenable label={`clip ${r.clipNumber} shot`} onRegen={() => openPopover({ type: 'row-shot', rowId: r.id }, `clip ${r.clipNumber} shot description`)}>
                        <div className="text-slate-600 text-xs whitespace-pre-wrap pr-6">{r.shotDescription}</div>
                      </Regenable>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    {r.reference.kind === 'frame' ? (
                      <Regenable label={`clip ${r.clipNumber} reference`} onRegen={() => openPopover({ type: 'row-reference', rowId: r.id }, `clip ${r.clipNumber} reference screenshot`)}>
                        {thumb?.src ? (
                          <img src={thumb.src} alt="reference" className="w-20 rounded border border-slate-200" />
                        ) : (
                          <div className="w-20 h-32 rounded border border-dashed border-slate-200 text-[10px] text-slate-400 flex items-center justify-center">
                            loading…
                          </div>
                        )}
                      </Regenable>
                    ) : r.reference.kind === 'same-as' ? (
                      <span className="text-xs text-slate-500 italic">Same as clip {r.reference.clipNumber}</span>
                    ) : (
                      <Regenable label={`clip ${r.clipNumber} reference`} onRegen={() => openPopover({ type: 'row-reference', rowId: r.id }, `clip ${r.clipNumber} reference screenshot`)} disabled={r.clipNumber === 'end-card'}>
                        <span className="text-[10px] text-slate-400 pr-6">{r.reference.reason}</span>
                      </Regenable>
                    )}
                  </td>
                  <td className="py-2 text-xs text-slate-500">{r.editorNotes || <span className="text-slate-300">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Feedback popover */}
      {popover && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setPopover(null)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-[480px] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-slate-800 mb-1">Regenerate {popover.label}</div>
            <p className="text-xs text-slate-500 mb-3">
              Your feedback becomes law for this brief — it binds this regeneration and every one after it.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                popover.target.type === 'row-reference'
                  ? "What's wrong with this reference? (e.g. 'need a closer selfie angle', 'should show the product in hand')"
                  : "What should change? (leave empty for a fresh take)"
              }
              className="w-full h-24 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-300"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-3">
              <button onClick={() => setPopover(null)} className="text-sm text-slate-500 hover:text-slate-700 underline">
                Cancel
              </button>
              <button
                onClick={() => void runRegen(popover.target, feedback)}
                className="text-sm bg-navy text-cream px-4 py-1.5 rounded-lg hover:bg-navy-deep font-medium"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
