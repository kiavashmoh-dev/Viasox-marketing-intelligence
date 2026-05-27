/**
 * CommentAnalysisList — landing view for the Comment Intelligence module.
 *
 * Shows every saved analysis as a card:
 *   - Title (auto-named from batch index or "Combined")
 *   - Comment count + date range + when analyzed
 *   - View / Delete
 *   - Multi-select via checkbox
 *
 * Top-of-page controls:
 *   - "Run new analysis" → goes to the upload/pull phase
 *   - "Combine N selected" → merges + regenerates insights into a new card
 *
 * When the list is empty, prompts the user toward "Run your first analysis".
 */
import { useMemo, useState } from 'react';
import type { SavedAnalysis } from '../../comments/commentAnalysisStore';

interface Props {
  analyses: SavedAnalysis[];
  onRunNew: () => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onCombine: (ids: string[]) => void;
  onBack: () => void;
  combining: boolean;
}

function formatDateRange(range: { oldest: number | null; newest: number | null }): string {
  if (!range.oldest && !range.newest) return 'no dates';
  const fmt = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (range.oldest && range.newest) {
    if (range.oldest === range.newest) return fmt(range.newest);
    return `${fmt(range.oldest)} – ${fmt(range.newest)}`;
  }
  return fmt(range.newest ?? range.oldest!);
}

function formatTimeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function typeIcon(type: SavedAnalysis['type']): string {
  if (type === 'csv') return '📄';
  if (type === 'combined') return '🧩';
  return '📦'; // batch
}

export default function CommentAnalysisList({
  analyses,
  onRunNew,
  onView,
  onDelete,
  onCombine,
  onBack,
  combining,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;
  const canCombine = selectedCount >= 2;
  const combinedCommentCount = useMemo(() => {
    let n = 0;
    for (const a of analyses) if (selected.has(a.id)) n += a.commentCount;
    return n;
  }, [analyses, selected]);

  const handleCombineClick = () => {
    if (!canCombine) return;
    onCombine(Array.from(selected));
  };

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            {'←'} Back to Dashboard
          </button>
          <button
            onClick={onRunNew}
            className="text-sm bg-navy text-cream px-4 py-2 rounded-lg hover:bg-navy-deep transition-colors font-medium"
          >
            Run new analysis
          </button>
        </div>

        {/* Title */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg shrink-0">
              💬
            </div>
            <div>
              <h1 className="font-display text-xl font-medium text-navy">Ad Comment Intelligence</h1>
              <p className="text-sm text-slate-500">
                {analyses.length === 0
                  ? 'No saved analyses yet — run your first one to start the library.'
                  : `${analyses.length} saved analys${analyses.length === 1 ? 'is' : 'es'} in your library. The module opens by default to your largest analysis; click any below to view a specific one, or select 2+ to combine.`}
              </p>
            </div>
          </div>
        </div>

        {/* Combine action bar — only when selection is meaningful */}
        {selectedCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <div className="text-sm text-emerald-900">
              <strong>{selectedCount}</strong> analys{selectedCount === 1 ? 'is' : 'es'} selected
              {' '}({combinedCommentCount.toLocaleString()} comments total, before dedupe)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                disabled={combining}
                className="text-xs text-emerald-700 hover:text-emerald-900 underline disabled:opacity-40"
              >
                Clear
              </button>
              <button
                onClick={handleCombineClick}
                disabled={!canCombine || combining}
                className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-40"
                title={canCombine ? '' : 'Select at least 2 analyses to combine'}
              >
                {combining ? 'Combining…' : `Combine ${selectedCount} into one →`}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {analyses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-5xl mb-3">💬</div>
            <h2 className="text-lg font-bold text-slate-800">No analyses saved yet</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Pull comments from Meta or upload a CSV, then analyze a batch of 500 — it'll show up here.
            </p>
            <button
              onClick={onRunNew}
              className="text-sm bg-navy text-cream px-5 py-2.5 rounded-lg hover:bg-navy-deep transition-colors font-medium"
            >
              Run your first analysis →
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {analyses.map((a) => {
              const isSelected = selected.has(a.id);
              const posPct = a.summary.totalComments > 0
                ? Math.round(((a.summary.bySentiment['Positive'] ?? 0) / a.summary.totalComments) * 100)
                : 0;
              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                    isSelected ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Checkbox */}
                  <label className="shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(a.id)}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                      aria-label={`Select ${a.name} for combining`}
                    />
                  </label>

                  {/* Type icon */}
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-lg shrink-0">
                    {typeIcon(a.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{a.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{a.commentCount.toLocaleString()} comments</span>
                      <span className="text-slate-300">•</span>
                      <span>{posPct}% positive</span>
                      <span className="text-slate-300">•</span>
                      <span>{Object.keys(a.summary.byCat).length} categories</span>
                      <span className="text-slate-300">•</span>
                      <span title={`Created ${new Date(a.createdAt).toLocaleString()}`}>
                        {formatTimeAgo(a.createdAt)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Comment dates: {formatDateRange(a.dateRange)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onView(a.id)}
                      className="text-sm bg-navy text-cream px-4 py-1.5 rounded-lg hover:bg-navy-deep transition-colors font-medium"
                    >
                      View {'▸'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${a.name}"? This can't be undone.`)) {
                          onDelete(a.id);
                          setSelected((prev) => {
                            const next = new Set(prev);
                            next.delete(a.id);
                            return next;
                          });
                        }
                      }}
                      className="text-xs text-slate-400 hover:text-red-600 px-2 py-1.5"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
