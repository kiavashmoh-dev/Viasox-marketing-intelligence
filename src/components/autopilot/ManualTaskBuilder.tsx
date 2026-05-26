/**
 * ManualTaskBuilder — interactive table for building an autopilot batch
 * by hand, when no Asana screenshot is available.
 *
 * Mirrors the exact column set the Asana screenshot parser extracts so the
 * downstream pipeline (PlannerView → Strategy Session → Concept → Script)
 * sees identical task shapes regardless of which entry path was used.
 *
 * Columns (in order, matching the Asana board layout):
 *   1. Name       — required text (e.g., "SOX-740")
 *   2. Product    — required dropdown
 *   3. Angle      — required text (freeform talking point)
 *   4. Medium     — required dropdown (Shortform/Mediumform/Longform)
 *   5. Ad Type    — optional dropdown (defaults to medium-based heuristic)
 *   6. Inspiration — optional dropdown of items from the Inspiration Bank
 *                    (translates to CreativeDirection.pinnedInspirations
 *                    when the batch is submitted)
 *
 * Per-row actions: Duplicate (clones the row), Delete.
 * Continue button is disabled until every row has Name, Product, Angle,
 * and Medium filled in.
 */
import { useEffect, useMemo, useState } from 'react';
import type { ParsedAsanaTask } from '../../engine/autopilotTypes';
import type { InspirationItem } from '../../engine/inspirationTypes';
import { AD_TYPE_OPTIONS } from '../../autopilot/asanaMapper';
import { getAllItems as getAllInspirationItems } from '../../inspiration/inspirationStore';

// ─── Dropdown vocabulary (matches the Asana board's canonical values) ──

const PRODUCT_OPTIONS = ['EasyStretch', 'Compression', 'Ankle Compression', 'Other'] as const;

/** Medium options use labels that match the Asana board's wording but pair
 *  them with explicit durations so the user knows what they're picking. */
const MEDIUM_OPTIONS = [
  { value: 'Shortform', label: 'Shortform (1-15 sec)' },
  { value: 'Mediumform', label: 'Mediumform (16-59 sec)' },
  { value: 'Longform', label: 'Longform (60-90 sec)' },
] as const;

/** One row in the builder — extends ParsedAsanaTask with a local id + an
 *  optional inspiration assignment. The inspiration is NOT part of
 *  ParsedAsanaTask (the screenshot parser doesn't extract it); we collect
 *  it here and pass it through to the parent for the pinnedInspirations map. */
interface DraftRow {
  id: string;
  name: string;
  product: string;
  angle: string;
  medium: string;
  adType: string; // empty string = "(auto from medium)"
  inspirationId: string; // empty string = "(none)"
}

interface Props {
  /** Called when the user clicks "Continue to Planner." Receives the parsed
   *  tasks AND the per-task inspiration pins (taskName → inspirationId)
   *  so the parent can populate CreativeDirection.pinnedInspirations. */
  onComplete: (tasks: ParsedAsanaTask[], pinnedInspirations: Record<string, string>) => void;
  /** Cancel — return to the upload/manual chooser. */
  onCancel: () => void;
}

function newRowId(): string {
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyRow(): DraftRow {
  return {
    id: newRowId(),
    name: '',
    product: '',
    angle: '',
    medium: '',
    adType: '',
    inspirationId: '',
  };
}

function rowIsComplete(r: DraftRow): boolean {
  return r.name.trim() !== '' && r.product !== '' && r.angle.trim() !== '' && r.medium !== '';
}

export default function ManualTaskBuilder({ onComplete, onCancel }: Props) {
  const [rows, setRows] = useState<DraftRow[]>(() => [emptyRow()]);
  const [inspirations, setInspirations] = useState<InspirationItem[]>([]);

  // Load inspiration items on mount — read-only; fails silently if none.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await getAllInspirationItems();
        if (!cancelled) {
          // Sort by uploadedAt desc (newest first) and starred first
          items.sort((a, b) => {
            if (a.starred !== b.starred) return a.starred ? -1 : 1;
            return (b.uploadedAt || '').localeCompare(a.uploadedAt || '');
          });
          setInspirations(items);
        }
      } catch (err) {
        console.warn('[ManualTaskBuilder] inspiration load failed', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const duplicateRow = (id: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx === -1) return prev;
      const source = prev[idx];
      // Clone but blank the name (every task should have a unique identifier)
      const clone: DraftRow = { ...source, id: newRowId(), name: '' };
      return [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
    });
  };

  const deleteRow = (id: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const allReady = useMemo(() => rows.length > 0 && rows.every(rowIsComplete), [rows]);

  // ── Name uniqueness check — task names map to per-task state downstream
  //    (e.g. CreativeDirection.pinnedInspirations is keyed by task name).
  //    Duplicate names would silently collapse two tasks into one. ──
  const duplicateNames = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const r of rows) {
      const n = r.name.trim();
      if (!n) continue;
      if (seen.has(n)) dupes.add(n);
      seen.add(n);
    }
    return dupes;
  }, [rows]);
  const hasDuplicates = duplicateNames.size > 0;

  const handleSubmit = () => {
    if (!allReady || hasDuplicates) return;
    const tasks: ParsedAsanaTask[] = rows.map((r) => ({
      name: r.name.trim(),
      product: r.product,
      angle: r.angle.trim(),
      medium: r.medium,
      adType: r.adType || undefined,
    }));
    // Build the inspiration pin map (only include rows with a selection)
    const pinned: Record<string, string> = {};
    for (const r of rows) {
      if (r.inspirationId) pinned[r.name.trim()] = r.inspirationId;
    }
    onComplete(tasks, pinned);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Build batch manually</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Add a row per brief. Same columns as your Asana board. Inspiration is optional.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-700 underline"
        >
          ← Back to chooser
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5 w-32 min-w-[8rem]">Name *</th>
              <th className="px-3 py-2.5 w-36 min-w-[9rem]">Product *</th>
              <th className="px-3 py-2.5 min-w-[10rem]">Angle / Talking Point *</th>
              <th className="px-3 py-2.5 w-44 min-w-[11rem]">Medium *</th>
              <th className="px-3 py-2.5 w-48 min-w-[12rem]">Ad Type</th>
              <th className="px-3 py-2.5 w-48 min-w-[12rem]">Inspiration</th>
              <th className="px-3 py-2.5 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isDuplicate = row.name.trim() && duplicateNames.has(row.name.trim());
              return (
                <tr key={row.id} className="border-t border-slate-200">
                  {/* Name */}
                  <td className="px-3 py-2 align-top">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, { name: e.target.value })}
                      placeholder="SOX-123"
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                        isDuplicate
                          ? 'border-red-300 focus:ring-red-200 bg-red-50'
                          : 'border-slate-300 focus:ring-blue-200 focus:border-blue-400'
                      }`}
                    />
                    {isDuplicate && (
                      <div className="text-[10px] text-red-600 mt-1">Duplicate name</div>
                    )}
                  </td>

                  {/* Product */}
                  <td className="px-3 py-2 align-top">
                    <select
                      value={row.product}
                      onChange={(e) => updateRow(row.id, { product: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                    >
                      <option value="">Select…</option>
                      {PRODUCT_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>

                  {/* Angle */}
                  <td className="px-3 py-2 align-top">
                    <input
                      type="text"
                      value={row.angle}
                      onChange={(e) => updateRow(row.id, { angle: e.target.value })}
                      placeholder="Independence / Neuropathy / etc."
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                    />
                  </td>

                  {/* Medium */}
                  <td className="px-3 py-2 align-top">
                    <select
                      value={row.medium}
                      onChange={(e) => updateRow(row.id, { medium: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                    >
                      <option value="">Select…</option>
                      {MEDIUM_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Ad Type (optional) */}
                  <td className="px-3 py-2 align-top">
                    <select
                      value={row.adType}
                      onChange={(e) => updateRow(row.id, { adType: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                    >
                      <option value="">(auto from medium)</option>
                      {AD_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>

                  {/* Inspiration (optional) */}
                  <td className="px-3 py-2 align-top">
                    <select
                      value={row.inspirationId}
                      onChange={(e) => updateRow(row.id, { inspirationId: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                      disabled={inspirations.length === 0}
                    >
                      <option value="">
                        {inspirations.length === 0 ? '(no items in bank)' : '(none)'}
                      </option>
                      {inspirations.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.starred ? '★ ' : ''}{it.title || it.filename || it.id}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Row actions */}
                  <td className="px-2 py-2 align-top">
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateRow(row.id)}
                        className="text-[10px] text-slate-500 hover:text-blue-600 underline whitespace-nowrap"
                        title="Duplicate this row"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        disabled={rows.length === 1}
                        className="text-[10px] text-slate-500 hover:text-red-600 underline disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                        title={rows.length === 1 ? 'Cannot delete the last row' : 'Delete this row'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        + Add row
      </button>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {rows.length} row{rows.length === 1 ? '' : 's'}
          {!allReady && (
            <span className="text-amber-700 ml-2">
              {' '}— fill every row's required fields (marked *) to continue
            </span>
          )}
          {hasDuplicates && (
            <span className="text-red-700 ml-2">
              {' '}— resolve duplicate names before continuing
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allReady || hasDuplicates}
          className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue to Planner →
        </button>
      </div>
    </div>
  );
}
