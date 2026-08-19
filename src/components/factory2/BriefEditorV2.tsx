/**
 * Factory V2 — the interactive brief editor.
 *
 * Renders the standardized UGC brief as a live document. Every strategic
 * element — header fields, hooks, CTAs, script lines, shot descriptions,
 * reference screenshots, and the framework itself — can be clicked and
 * regenerated with feedback. Feedback is law: it enters the brief's ledger
 * and binds every subsequent generation. After each edit a ripple check
 * flags any lines that are now inconsistent.
 *
 * Visual language (July 2026 polish): sectioned cards with header bands,
 * hover-highlighted editable lines, and IN-PLACE progress — the exact line
 * being regenerated/inserted/deleted carries its own spinner.
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScriptFramework } from '../../engine/types';
import { getFrames } from '../../inspiration/inspirationStore';
import type { UgcBriefV2, V2RegenTarget, V2ReviewFinding } from '../../factory2/v2Types';
import { UGC_FRAMEWORKS, ECOM_FRAMEWORKS, taskAdType } from '../../factory2/v2Types';
import { applyRegen, applyReviewFix, deleteRow, runFinalReview } from '../../factory2/v2Engine';
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

/** Small in-place progress indicator. */
function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-navy/25 border-t-navy animate-spin ${className}`}
      aria-label="working"
    />
  );
}

/** In-place "being worked on" chip shown exactly where the change lands. */
function WorkingChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-semibold px-2 py-0.5">
      <Spinner className="h-2.5 w-2.5 border-sky-300 border-t-sky-700" />
      {label}
    </span>
  );
}

/** Live elapsed-seconds counter — long thinking calls (Final Review can
 *  legitimately run several minutes) must visibly progress, not look hung. */
function Elapsed() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60);
  return <span className="text-xs text-sky-600 tabular-nums shrink-0">{m > 0 ? `${m}m ${secs % 60}s` : `${secs}s`}</span>;
}

/** Section card: a titled, visually separated block. */
function Section({
  title,
  meta,
  children,
  flush,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  /** No body padding (tables manage their own). */
  flush?: boolean;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-slate-100 bg-slate-50/60">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/70">{title}</h3>
        {meta && <div className="text-[11px] text-slate-400 text-right">{meta}</div>}
      </header>
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

/** Hoverable wrapper: highlights the line and shows a ↻ affordance; when
 *  busy, the line carries its own spinner in place of the button. */
function Regenable({
  label,
  onRegen,
  children,
  disabled,
  busy,
}: {
  label: string;
  onRegen: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div
      className={`group relative rounded-md -mx-2 px-2 py-1 transition-colors ${
        busy ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-sky-50/70 hover:ring-1 hover:ring-sky-100'
      }`}
    >
      <div className={busy ? 'opacity-60' : ''}>{children}</div>
      {busy ? (
        <span className="absolute -right-1 top-1">
          <Spinner />
        </span>
      ) : (
        !disabled && (
          <button
            onClick={onRegen}
            title={`Regenerate ${label}`}
            className="absolute -right-1 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] bg-navy text-cream rounded-md shadow-sm px-1.5 py-0.5 hover:bg-navy-deep"
          >
            ↻
          </button>
        )
      )}
    </div>
  );
}

function Chip({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'amber' | 'navy' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-100 text-amber-800',
    navy: 'bg-navy/10 text-navy',
  } as const;
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
}

export default function BriefEditorV2({ brief: initial, apiKey, onClose, onSaved }: Props) {
  const [brief, setBrief] = useState<UgcBriefV2>(initial);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState('');
  const [busyTarget, setBusyTarget] = useState<V2RegenTarget | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
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
            : target.type === 'row-insert'
              ? 'Writing the new line to bridge its neighbors…'
              : 'Regenerating…',
      );
      setBusyTarget(target);
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
        setBusyTarget(null);
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

  // Deletion is a human edit — no generation call, but the engine renumbers
  // clips, repairs references, patches the prose, and runs a ripple check.
  const runDelete = useCallback(
    async (rowId: string, clipLabel: string) => {
      if (busy) return;
      if (!window.confirm(`Delete clip ${clipLabel}? Clips renumber automatically and a ripple check will flag any continuity break.`)) return;
      abortRef.current = new AbortController();
      setBusy(`Deleting clip ${clipLabel} and checking the flow around it…`);
      setDeletingRowId(rowId);
      setError('');
      try {
        const updated = await deleteRow(brief, rowId, apiKey, abortRef.current.signal);
        setBrief(updated);
        onSaved(updated);
      } catch (err) {
        if (!/cancelled/i.test(String(err))) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setBusy('');
        setDeletingRowId(null);
      }
    },
    [apiKey, brief, busy, onSaved],
  );

  // Final review: the post-editing hook-flow protocol. Every hook variant is
  // plugged into the script and read as a finished video; findings arrive
  // with their own surgical fixes, applied deterministically below.
  const runReview = useCallback(async () => {
    if (busy) return;
    abortRef.current = new AbortController();
    setBusy('Final review — plugging every hook into the script and reading it as a finished video… (deep review; this can take a few minutes)');
    setError('');
    try {
      const report = await runFinalReview(brief, apiKey, abortRef.current.signal);
      const updated: UgcBriefV2 = { ...brief, lastReview: report };
      setBrief(updated);
      onSaved(updated);
    } catch (err) {
      if (!/cancelled/i.test(String(err))) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy('');
    }
  }, [apiKey, brief, busy, onSaved]);

  const applyFinding = useCallback(
    (f: V2ReviewFinding) => {
      if (busy) return;
      const updated = applyReviewFix(brief, f);
      setBrief(updated);
      onSaved(updated);
    },
    [brief, busy, onSaved],
  );

  const dismissFinding = useCallback(
    (f: V2ReviewFinding) => {
      if (busy || !brief.lastReview) return;
      const updated: UgcBriefV2 = {
        ...brief,
        lastReview: {
          ...brief.lastReview,
          findings: brief.lastReview.findings.map((x) =>
            x.id === f.id ? { ...x, resolution: 'dismissed' as const } : x,
          ),
        },
      };
      setBrief(updated);
      onSaved(updated);
    },
    [brief, busy, onSaved],
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
      await exportBriefDoc(brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy('');
    }
  }, [brief]);

  // ── In-place busy resolution ──────────────────────────────────────────────
  const rowBusyKind = (rowId: string): 'script' | 'shot' | 'overlay' | 'reference' | null => {
    const t = busyTarget;
    if (!t) return null;
    if (t.type === 'row-script' && t.rowId === rowId) return 'script';
    if (t.type === 'row-shot' && t.rowId === rowId) return 'shot';
    if (t.type === 'row-overlay' && t.rowId === rowId) return 'overlay';
    if (t.type === 'row-reference' && t.rowId === rowId) return 'reference';
    return null;
  };
  const insertAfterRowId = busyTarget?.type === 'row-insert' ? busyTarget.afterRowId : null;
  const hookBusyId = busyTarget?.type === 'hook' ? busyTarget.lineId : null;
  const ctaBusyId = busyTarget?.type === 'cta' ? busyTarget.lineId : null;
  const proseBusy = busyTarget?.type === 'script-prose';
  const headerBusyField = busyTarget?.type === 'header-field' ? busyTarget.field : null;

  const isEcom = taskAdType(brief.task) === 'ecom';
  const style = getUgcStyle(brief.task.ugcStyle);

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-xl font-bold font-display text-navy leading-tight">{brief.taskName}</h2>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Chip>{brief.task.product}</Chip>
            <Chip>{brief.task.awarenessLevel}</Chip>
            <Chip tone="amber">{isEcom ? 'Ecom Style (editing brief)' : style.name}</Chip>
            <Chip>{brief.task.duration}</Chip>
            <Chip tone="navy">v{brief.version}</Chip>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowLedger((s) => !s)}
            className="text-xs text-slate-500 hover:text-slate-700 underline mr-1"
          >
            Feedback ledger ({brief.feedbackLedger.length})
          </button>
          <button
            onClick={() => void runReview()}
            disabled={!!busy}
            className="text-sm bg-navy text-cream px-4 py-1.5 rounded-lg hover:bg-navy-deep font-medium disabled:opacity-40"
          >
            Final Review
          </button>
          <button
            onClick={() => void handleExport()}
            disabled={!!busy}
            className="text-sm border border-slate-300 px-4 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-40"
          >
            Export .doc
          </button>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 underline">
            ← Back
          </button>
        </div>
      </div>

      {busy && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2.5">
            <Spinner />
            {busy}
            <Elapsed />
          </span>
          <button onClick={() => abortRef.current?.abort()} className="text-xs text-sky-700 underline hover:text-sky-900">
            Cancel
          </button>
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Ripple flags */}
      {brief.rippleFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
          <div className="font-medium text-amber-900 mb-1.5">Consistency flags from the last edit</div>
          <ul className="space-y-1">
            {brief.rippleFlags.map((f) => (
              <li key={f.id} className="text-amber-800 text-xs leading-relaxed">
                <strong>{f.target}:</strong> {f.issue} — <em>{f.suggestion}</em>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ledger */}
      {showLedger && (
        <Section title="Feedback ledger — binds every future generation">
          <div className="text-xs text-slate-600 space-y-1.5">
            {brief.feedbackLedger.length === 0 && (
              <div>No feedback yet. Everything you tell the editor lands here and binds every future generation.</div>
            )}
            {brief.feedbackLedger.map((f) => (
              <div key={f.id} className="leading-relaxed">
                <span className="text-slate-400">[{f.target}]</span> {f.feedback}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Intro callout (evergreen) */}
      <div className="bg-slate-100 rounded-xl px-5 py-3.5 text-[13px] text-slate-600 leading-relaxed">💡 {INTRO_CALLOUT}</div>

      {/* Framework control */}
      <Section
        title="Framework — the narrative engine"
        meta={busyTarget?.type === 'framework-switch' || busyTarget?.type === 'framework-regenerate' ? <WorkingChip label="rebuilding" /> : undefined}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-semibold text-slate-800">{brief.framework.name}</div>
            <div className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">{brief.framework.rationale}</div>
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
              {(isEcom ? ECOM_FRAMEWORKS : UGC_FRAMEWORKS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <button
              onClick={() => openPopover({ type: 'framework-regenerate' }, 'the framework structure')}
              className="text-sm border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              disabled={!!busy}
            >
              Restructure with feedback…
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2.5">
          Switching rewrites the script and storyboard under the new engine while holding the concept, product truth, and all your feedback constant.
        </p>
      </Section>

      {/* Creative direction (header fields) */}
      <Section title="Creative direction">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {(
            [
              ['concept', 'Concept', brief.header.concept],
              ['angle', 'Angle', brief.header.angle],
              ['videoTonality', 'Video tonality', brief.header.videoTonality],
              ...(isEcom ? [] : ([['attire', 'Attire', brief.header.attire]] as const)),
            ] as const
          ).map(([field, label, value]) => (
            <Regenable
              key={field}
              label={label}
              busy={headerBusyField === field}
              onRegen={() => openPopover({ type: 'header-field', field }, label)}
            >
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy/50">{label}</div>
                <div className="text-slate-700 leading-relaxed mt-0.5 pr-6">{value || <span className="text-slate-300">—</span>}</div>
              </div>
            </Regenable>
          ))}
          {isEcom && brief.header.ecomEditing && (
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 rounded-lg bg-sky-50/60 border border-sky-100 px-4 py-3">
              {(
                [
                  ['Pacing', brief.header.ecomEditing.pacing],
                  ['Music', brief.header.ecomEditing.music],
                  ['Transitions', brief.header.ecomEditing.transitions],
                  ['Special notes', brief.header.ecomEditing.specialNotes],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700/70">{label}</div>
                  <div className="text-slate-700 text-xs leading-relaxed mt-0.5">{value || <span className="text-slate-300">—</span>}</div>
                </div>
              ))}
            </div>
          )}
          <div className="md:col-span-2">
            <Regenable
              label="Per-brief instructions"
              busy={headerBusyField === 'instructions'}
              onRegen={() => openPopover({ type: 'header-field', field: 'instructions' }, 'per-brief instructions')}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy/50">{isEcom ? 'Editor notes (per-brief)' : 'Per-brief instructions'}</div>
              <ul className="list-disc ml-5 text-slate-700 leading-relaxed mt-0.5 pr-6 space-y-0.5">
                {brief.header.instructions.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </Regenable>
          </div>
        </div>
      </Section>

      {/* Hooks + CTAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={`Hooks — ${brief.hooks.length} variations`} meta="first = primary; alternates feed the variation matrix">
          <div className="space-y-1.5">
            {brief.hooks.map((h, i) => (
              <Regenable
                key={h.id}
                label={`hook ${i + 1}`}
                busy={hookBusyId === h.id}
                onRegen={() => openPopover({ type: 'hook', lineId: h.id }, `hook ${i + 1}`)}
              >
                <div className="flex items-start gap-2.5 pr-6">
                  <span
                    className={`mt-0.5 h-5 w-5 shrink-0 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      i === 0 ? 'bg-navy text-cream' : 'bg-navy/10 text-navy'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-sm leading-relaxed ${i === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                    {h.text}
                  </span>
                </div>
              </Regenable>
            ))}
          </div>
        </Section>
        <Section
          title="CTA options"
          meta={
            <>
              sells <span className="text-slate-600 font-medium">{brief.concept.productTruth}</span>
            </>
          }
        >
          <div className="space-y-1.5">
            {brief.ctas.map((c, i) => (
              <Regenable
                key={c.id}
                label={`CTA ${i + 1}`}
                busy={ctaBusyId === c.id}
                onRegen={() => openPopover({ type: 'cta', lineId: c.id }, `CTA ${i + 1}`)}
              >
                <div className="flex items-start gap-2.5 pr-6">
                  <span
                    className={`mt-0.5 h-5 w-5 shrink-0 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      i === 0 ? 'bg-navy text-cream' : 'bg-navy/10 text-navy'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-sm leading-relaxed ${i === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                    {c.text}
                  </span>
                </div>
              </Regenable>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Concept: <span className="text-slate-600">{brief.concept.title}</span>
          </div>
        </Section>
      </div>

      {/* Script prose */}
      <Section
        title="Script — full read-through"
        meta={proseBusy ? <WorkingChip label="rewriting" /> : 'the creator internalizes this before the shot list'}
      >
        <Regenable label="the script prose" busy={proseBusy} onRegen={() => openPopover({ type: 'script-prose' }, 'the full script prose')}>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3.5">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pr-4">{brief.scriptProse}</p>
          </div>
        </Regenable>
      </Section>

      {/* Storyboard */}
      <Section title="Storyboard" meta="hover a row for line actions: ↻ regenerate · ＋ insert below · ✕ delete" flush>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200 bg-slate-50/60">
                <th className="py-2.5 pl-5 pr-2 w-14">{isEcom ? 'Scene' : 'Clip'}</th>
                <th className="py-2.5 pr-2 w-14">Audio</th>
                <th className="py-2.5 pr-3 w-[26%]">{isEcom ? 'VO line' : 'Script'}</th>
                {isEcom && <th className="py-2.5 pr-3 w-[14%]">Overlay</th>}
                <th className="py-2.5 pr-2 w-24">{isEcom ? 'Shot tag' : 'Shot type'}</th>
                <th className="py-2.5 pr-3 w-[26%]">{isEcom ? 'Visual' : 'Shot description'}</th>
                <th className="py-2.5 pr-2 w-28">Reference</th>
                <th className="py-2.5 pr-5 w-[16%]">Editor notes</th>
              </tr>
            </thead>
            <tbody>
              {brief.storyboard.map((r, i) => {
                const thumb = r.reference.kind === 'frame' ? thumbFor(r.id) : null;
                const endIdx = brief.storyboard.findIndex((x) => x.clipNumber === 'end-card');
                const isMainRow = typeof r.clipNumber === 'number' && (endIdx === -1 || i < endIdx);
                const busyKind = rowBusyKind(r.id);
                const isDeleting = deletingRowId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className={`group/row border-b border-slate-100 align-top transition-colors ${
                        r.clipNumber === 'end-card'
                          ? 'bg-slate-50'
                          : isDeleting
                            ? 'bg-red-50/60 opacity-50'
                            : busyKind
                              ? 'bg-sky-50/70'
                              : 'hover:bg-sky-50/40'
                      }`}
                    >
                      <td className="py-2.5 pl-5 pr-2 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          {r.clipNumber === 'end-card' ? <span className="text-xs">End Card</span> : r.clipNumber}
                          {isDeleting && <Spinner className="h-3 w-3" />}
                        </div>
                        {isMainRow && !isDeleting && !busyKind && (
                          <div className="flex flex-col gap-1 mt-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <button
                              onClick={() => openPopover({ type: 'row-insert', afterRowId: r.id }, `a new line after clip ${r.clipNumber}`)}
                              title={`Insert a new line after clip ${r.clipNumber} — written to bridge the lines around it`}
                              className="text-[11px] leading-none bg-navy text-cream rounded-md shadow-sm px-1.5 py-1 w-fit hover:bg-navy-deep"
                            >
                              ＋
                            </button>
                            {!r.mirrorsLineId && (
                              <button
                                onClick={() => void runDelete(r.id, String(r.clipNumber))}
                                title={`Delete clip ${r.clipNumber}`}
                                className="text-[11px] leading-none bg-white border border-slate-200 text-slate-500 rounded-md px-1.5 py-1 w-fit hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{r.audioType}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        {r.clipNumber !== 'end-card' ? (
                          <Regenable
                            label={`clip ${r.clipNumber} script`}
                            busy={busyKind === 'script'}
                            onRegen={() => openPopover({ type: 'row-script', rowId: r.id }, `clip ${r.clipNumber} script line`)}
                          >
                            <div className="text-slate-700 leading-relaxed pr-6">{r.scriptLine}</div>
                          </Regenable>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      {isEcom && (
                        <td className="py-2.5 pr-3">
                          {r.clipNumber !== 'end-card' ? (
                            <Regenable
                              label={`clip ${r.clipNumber} overlay`}
                              busy={busyKind === 'overlay'}
                              onRegen={() => openPopover({ type: 'row-overlay', rowId: r.id }, `clip ${r.clipNumber} overlay text`)}
                            >
                              <div className="text-sky-800 text-xs font-medium leading-relaxed pr-6">{r.overlayText || <span className="text-slate-300 font-normal">—</span>}</div>
                            </Regenable>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-2.5 pr-2 text-slate-500 text-xs font-medium">{r.shotType}</td>
                      <td className="py-2.5 pr-3">
                        {r.clipNumber !== 'end-card' ? (
                          <Regenable
                            label={`clip ${r.clipNumber} shot`}
                            busy={busyKind === 'shot'}
                            onRegen={() => openPopover({ type: 'row-shot', rowId: r.id }, `clip ${r.clipNumber} shot description`)}
                          >
                            <div className="text-slate-600 text-xs whitespace-pre-wrap leading-relaxed pr-6">{r.shotDescription}</div>
                          </Regenable>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-2">
                        {r.reference.kind === 'frame' ? (
                          <Regenable
                            label={`clip ${r.clipNumber} reference`}
                            busy={busyKind === 'reference'}
                            onRegen={() => openPopover({ type: 'row-reference', rowId: r.id }, `clip ${r.clipNumber} reference screenshot`)}
                          >
                            {thumb?.src ? (
                              <img src={thumb.src} alt="reference" className="w-20 rounded-md border border-slate-200 shadow-sm" />
                            ) : (
                              <div className="w-20 h-32 rounded-md border border-dashed border-slate-200 text-[10px] text-slate-400 flex items-center justify-center">
                                loading…
                              </div>
                            )}
                          </Regenable>
                        ) : r.reference.kind === 'same-as' ? (
                          <span className="text-xs text-slate-500 italic">Same as clip {r.reference.clipNumber}</span>
                        ) : (
                          <Regenable
                            label={`clip ${r.clipNumber} reference`}
                            busy={busyKind === 'reference'}
                            onRegen={() => openPopover({ type: 'row-reference', rowId: r.id }, `clip ${r.clipNumber} reference screenshot`)}
                            disabled={r.clipNumber === 'end-card'}
                          >
                            <span className="text-[10px] text-slate-400 pr-6">{r.reference.reason}</span>
                          </Regenable>
                        )}
                      </td>
                      <td className="py-2.5 pr-5 text-xs text-slate-500 leading-relaxed">
                        {r.editorNotes || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                    {insertAfterRowId === r.id && (
                      <tr className="border-b border-slate-100">
                        <td colSpan={isEcom ? 8 : 7} className="py-2.5 pl-5 pr-5">
                          <div className="flex items-center gap-2.5 border-2 border-dashed border-sky-200 bg-sky-50/60 rounded-lg px-4 py-2.5 text-sm text-sky-800">
                            <Spinner />
                            Writing the new line here — bridging clip {String(r.clipNumber)} and the line after it…
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Final review report */}
      {brief.lastReview && (
        <Section
          title={`Final review · ${new Date(brief.lastReview.createdAt).toLocaleString()}`}
          meta={
            brief.lastReview.briefVersion !== brief.version ? (
              <span className="text-amber-600 font-medium">brief has changed since this review — re-run for a fresh pass</span>
            ) : undefined
          }
        >
          <p className="text-sm text-slate-600 mb-3 leading-relaxed">{brief.lastReview.summary}</p>
          {brief.lastReview.findings.length === 0 ? (
            <p className="text-sm text-emerald-600 font-medium">Clean pass — every hook variant reads seamlessly into the script.</p>
          ) : (
            <div className="space-y-3">
              {brief.lastReview.findings.map((f) => (
                <div
                  key={f.id}
                  className={`border rounded-lg p-3.5 ${
                    f.resolution
                      ? 'opacity-50 border-slate-200'
                      : f.severity === 'major'
                        ? 'border-red-200 bg-red-50/40'
                        : f.severity === 'moderate'
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs mb-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide text-[10px] ${
                        f.severity === 'major'
                          ? 'bg-red-100 text-red-700'
                          : f.severity === 'moderate'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="font-medium text-slate-700">{f.target}</span>
                    {f.resolution && <span className="text-slate-400 italic">{f.resolution}</span>}
                  </div>
                  <p className="text-sm text-slate-700 mb-2 leading-relaxed">{f.issue}</p>
                  {f.currentText && <p className="text-xs text-slate-500 line-through mb-1 leading-relaxed">{f.currentText}</p>}
                  {f.proposedText && (
                    <p className="text-sm text-slate-800 bg-emerald-50 border border-emerald-100 rounded-md px-2.5 py-1.5 mb-1.5 leading-relaxed">
                      {f.proposedText}
                    </p>
                  )}
                  {f.rationale && <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{f.rationale}</p>}
                  {!f.resolution && (
                    <div className="flex gap-3">
                      {f.proposedText && (
                        <button
                          onClick={() => applyFinding(f)}
                          className="text-xs bg-navy text-cream px-3 py-1 rounded-md hover:bg-navy-deep font-medium"
                        >
                          Apply fix
                        </button>
                      )}
                      <button onClick={() => dismissFinding(f)} className="text-xs text-slate-500 underline hover:text-slate-700">
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Feedback popover */}
      {popover && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50" onClick={() => setPopover(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-[480px] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-slate-800 mb-1">
              {popover.target.type === 'row-insert' ? `Insert ${popover.label}` : `Regenerate ${popover.label}`}
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              {popover.target.type === 'row-insert'
                ? 'The new line is written to bridge the line before and the line after seamlessly — your note steers what it says.'
                : 'Your feedback becomes law for this brief — it binds this regeneration and every one after it.'}
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                popover.target.type === 'row-reference'
                  ? "What's wrong with this reference? (e.g. 'need a closer selfie angle', 'should show the product in hand')"
                  : popover.target.type === 'row-insert'
                    ? "What should this new line do or emphasize? (leave empty and it writes whatever most strengthens the bridge)"
                    : "What should change? (leave empty for a fresh take)"
              }
              className="w-full h-24 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-sky-300"
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
                {popover.target.type === 'row-insert' ? 'Write & insert' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
