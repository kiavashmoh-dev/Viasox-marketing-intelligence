/**
 * Memory Vault — dedicated browser for the creative memory.
 *
 * Surfaces every past batch with its briefs, scores, reviewer feedback,
 * and (for batches produced after the briefMarkdown field was added)
 * the full brief content so it can be downloaded as .doc/.csv long
 * after the original autopilot run ended.
 *
 * Features:
 *   - Organized by batch (newest first), with collapsible per-batch sections
 *   - Each brief shows its score, verdict, framework, hooks, reasoning
 *   - Inline score override via the existing ScoreOverridePanel component
 *   - Per-brief download (Ecom .doc or AGC .csv) when the markdown is present
 *   - Batch-level feedback history threaded inline with each batch
 *   - Memory stats at the top (batches, briefs, avg score, storage KB)
 *
 * The old in-autopilot MemoryPanel remains as a lightweight management
 * interface (export/import/clear). This module is the exploration and
 * audit surface.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  getBatchHistory,
  getRecentFeedback,
  getMemoryStats,
  updateBriefScore,
  deleteBatch,
} from '../../autopilot/memoryStore';
import { recomputeAndSaveAnglePatterns } from '../../autopilot/anglePatternMiner';
import { recomputeAndSaveCalibration } from '../../autopilot/scoreCalibration';
import type {
  BatchMemoryRecord,
  BriefMemoryRecord,
  FeedbackRecord,
} from '../../autopilot/memoryTypes';
import ScoreOverridePanel from '../autopilot/ScoreOverridePanel';
import { downloadEcomBriefDoc, downloadProductionBriefCsv } from '../../utils/downloadUtils';

interface Props {
  onBack: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function scoreBadgeColor(score: number | null): string {
  if (score == null || score === 0) return 'bg-slate-100 text-slate-400';
  if (score <= 4) return 'bg-red-100 text-red-700';
  if (score <= 6) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function batchAverage(briefs: BriefMemoryRecord[]): number | null {
  const scored = briefs.filter((b) => b.reviewScore > 0);
  if (scored.length === 0) return null;
  return scored.reduce((sum, b) => sum + b.reviewScore, 0) / scored.length;
}

function downloadBrief(brief: BriefMemoryRecord): void {
  if (!brief.briefMarkdown) return;
  const isAgc = brief.adType === 'AGC (Actor Generated Content)';
  if (isAgc) {
    downloadProductionBriefCsv(brief.briefMarkdown, brief.product, brief.adType ?? 'AGC (Actor Generated Content)');
  } else {
    downloadEcomBriefDoc(brief.briefMarkdown, brief.id);
  }
}

// ─── Brief Row ──────────────────────────────────────────────────────────

function BriefRow({
  brief,
  onScoreOverride,
  onBriefDownload,
}: {
  brief: BriefMemoryRecord;
  onScoreOverride: (briefId: string, score: number, notes: string) => void;
  onBriefDownload: (brief: BriefMemoryRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMarkdown = !!brief.briefMarkdown;
  const hasScore = brief.reviewScore > 0;

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">
            {brief.id}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {brief.angle} / {brief.product} / {brief.duration} · {brief.framework}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Score badge */}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded ${scoreBadgeColor(hasScore ? brief.reviewScore : null)}`}
          >
            {hasScore ? `${brief.reviewScore.toFixed(1)}/10` : 'Not scored'}
          </span>
          {/* Verdict */}
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
              brief.reviewVerdict === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {brief.reviewVerdict === 'APPROVED' ? 'Approved' : 'Needs Attention'}
          </span>
          <span className="text-slate-400 text-xs w-3 text-center">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>

      {/* Expanded: concept + hooks + scoring + actions */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30">
          {/* Concept summary */}
          {brief.conceptSummary && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                Concept
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">{brief.conceptSummary}</div>
            </div>
          )}

          {/* Hook summaries */}
          {brief.hookSummaries.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                Hooks ({brief.hookStyles.join(' \u00B7 ')})
              </div>
              <ul className="text-xs text-slate-700 space-y-0.5 list-disc pl-4">
                {brief.hookSummaries.map((h, i) => (
                  <li key={i} className="leading-snug">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Selection reasoning */}
          {brief.selectionReasoning && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                Why This Concept Was Selected
              </div>
              <div className="text-xs text-slate-600 leading-relaxed italic">
                {brief.selectionReasoning}
              </div>
            </div>
          )}

          {/* Reviewer strengths / weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brief.reviewStrengths.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 mb-1">
                  Strengths
                </div>
                <ul className="text-xs text-slate-700 space-y-0.5 list-disc pl-4">
                  {brief.reviewStrengths.map((s, i) => (
                    <li key={i} className="leading-snug">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {brief.reviewWeaknesses.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 mb-1">
                  Weaknesses / Flags
                </div>
                <ul className="text-xs text-slate-700 space-y-0.5 list-disc pl-4">
                  {brief.reviewWeaknesses.map((w, i) => (
                    <li key={i} className="leading-snug">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Full score breakdown + override (delegates to existing panel) */}
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
              Score & Override
            </div>
            <ScoreOverridePanel
              briefId={brief.id}
              scoring={brief.scoring}
              legacyScore={brief.reviewScore}
              onOverride={(score, notes) => onScoreOverride(brief.id, score, notes)}
            />
          </div>

          {/* Download */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            {hasMarkdown ? (
              <button
                onClick={() => onBriefDownload(brief)}
                className="text-xs bg-slate-800 text-white px-4 py-1.5 rounded-lg hover:bg-slate-900 transition-colors font-medium"
              >
                {brief.adType === 'AGC (Actor Generated Content)' ? 'Download .csv' : 'Download .doc'}
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                This brief was created before full-markdown memory was added — download not available.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Batch Card ──────────────────────────────────────────────────────────

function BatchCard({
  batch,
  feedbackForBatch,
  onScoreOverride,
  onDeleteBatch,
  onDownloadBrief,
}: {
  batch: BatchMemoryRecord;
  feedbackForBatch: FeedbackRecord[];
  onScoreOverride: (briefId: string, score: number, notes: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onDownloadBrief: (brief: BriefMemoryRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const avg = batchAverage(batch.briefs);
  const unscored = batch.briefs.filter((b) => b.reviewScore === 0).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Batch header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-slate-800">
              {formatDate(batch.batchId)}
            </span>
            <span className="text-[10px] text-slate-400">
              {'\u00B7'} {batch.briefs.length} brief{batch.briefs.length !== 1 ? 's' : ''}
            </span>
            {unscored > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                {unscored} unscored
              </span>
            )}
          </div>
          {batch.creativeDirection && (
            <div className="text-[11px] text-slate-500 truncate">
              {'\u201C'}{batch.creativeDirection.slice(0, 180)}{'\u201D'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {avg != null && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded ${scoreBadgeColor(avg)}`}>
              Avg {avg.toFixed(1)}
            </span>
          )}
          <span className="text-slate-400 text-xs w-3 text-center">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>

      {/* Batch body: briefs + feedback + actions */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
          {/* Strongest / Weakest pointers */}
          {(batch.overallStrongest || batch.overallWeakest || batch.batchReviewSummary) && (
            <div className="bg-white rounded-lg border border-slate-200 p-3 text-xs space-y-1">
              {batch.batchReviewSummary && (
                <div>
                  <span className="font-semibold text-slate-600">Reviewer summary:</span>{' '}
                  <span className="text-slate-700">{batch.batchReviewSummary}</span>
                </div>
              )}
              {batch.overallStrongest && (
                <div>
                  <span className="font-semibold text-emerald-600">Strongest:</span>{' '}
                  <span className="text-slate-700">{batch.overallStrongest}</span>
                </div>
              )}
              {batch.overallWeakest && (
                <div>
                  <span className="font-semibold text-amber-600">Weakest:</span>{' '}
                  <span className="text-slate-700">{batch.overallWeakest}</span>
                </div>
              )}
            </div>
          )}

          {/* Briefs */}
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Briefs ({batch.briefs.length})
            </div>
            <div className="space-y-2">
              {batch.briefs.map((b) => (
                <BriefRow
                  key={b.id}
                  brief={b}
                  onScoreOverride={onScoreOverride}
                  onBriefDownload={onDownloadBrief}
                />
              ))}
            </div>
          </div>

          {/* Feedback tied to this batch */}
          {feedbackForBatch.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                Feedback Captured for This Batch
              </div>
              <div className="space-y-2">
                {feedbackForBatch.map((fb, i) => (
                  <div
                    key={i}
                    className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                        {fb.source.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(fb.date)}
                      </span>
                    </div>
                    <div className="text-slate-700 leading-relaxed">{fb.content}</div>
                    {fb.context && (
                      <div className="text-[10px] text-slate-400 italic mt-1">
                        {fb.context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Batch-level actions */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => {
                if (confirm(`Delete this batch (${batch.briefs.length} briefs) from memory? This cannot be undone.`)) {
                  onDeleteBatch(batch.batchId);
                }
              }}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Delete batch from memory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Module ─────────────────────────────────────────────────────────

export default function MemoryVault({ onBack }: Props) {
  // Refresh trigger — bumped on any write so the component re-reads memory
  const [refreshTick, setRefreshTick] = useState(0);
  const [angleFilter, setAngleFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'scored' | 'unscored' | 'high' | 'low'>('all');
  const [search, setSearch] = useState<string>('');

  const batches = useMemo(
    () => getBatchHistory(),
    [refreshTick],
  );
  const feedback = useMemo(
    () => getRecentFeedback(200),
    [refreshTick],
  );
  const stats = useMemo(
    () => getMemoryStats(),
    [refreshTick],
  );

  // Derived filter options
  const { angles, products } = useMemo(() => {
    const angleSet = new Set<string>();
    const productSet = new Set<string>();
    for (const batch of batches) {
      for (const brief of batch.briefs) {
        if (brief.angle) angleSet.add(brief.angle);
        if (brief.product) productSet.add(brief.product);
      }
    }
    return {
      angles: Array.from(angleSet).sort(),
      products: Array.from(productSet).sort(),
    };
  }, [batches]);

  // Apply filters to the batch list: a batch is visible if at least one
  // of its briefs passes all filters. The briefs inside are also filtered
  // so the view stays focused.
  const filteredBatches = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    const filterBrief = (b: BriefMemoryRecord): boolean => {
      if (angleFilter && b.angle !== angleFilter) return false;
      if (productFilter && b.product !== productFilter) return false;
      if (scoreFilter === 'scored' && b.reviewScore === 0) return false;
      if (scoreFilter === 'unscored' && b.reviewScore > 0) return false;
      if (scoreFilter === 'high' && b.reviewScore < 7) return false;
      if (scoreFilter === 'low' && (b.reviewScore === 0 || b.reviewScore > 5)) return false;
      if (searchLower) {
        const haystack = [
          b.id,
          b.angle,
          b.product,
          b.framework,
          b.conceptSummary,
          ...(b.hookSummaries ?? []),
          ...(b.reviewStrengths ?? []),
          ...(b.reviewWeaknesses ?? []),
        ].join(' ').toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }
      return true;
    };
    return batches
      .map((batch) => ({
        ...batch,
        briefs: batch.briefs.filter(filterBrief),
      }))
      .filter((batch) => batch.briefs.length > 0);
  }, [batches, angleFilter, productFilter, scoreFilter, search]);

  const feedbackByBatch = useMemo(() => {
    const map: Record<string, FeedbackRecord[]> = {};
    for (const fb of feedback) {
      if (!map[fb.batchId]) map[fb.batchId] = [];
      map[fb.batchId].push(fb);
    }
    return map;
  }, [feedback]);

  const handleScoreOverride = useCallback(
    (briefId: string, score: number, notes: string) => {
      // updateBriefScore ignores batchId — passing any non-empty string
      updateBriefScore('', briefId, score, notes);
      // Recompute downstream learning artifacts so the memory stays coherent.
      try { recomputeAndSaveAnglePatterns(); } catch { /* non-fatal */ }
      try { recomputeAndSaveCalibration(); } catch { /* non-fatal */ }
      setRefreshTick((t) => t + 1);
    },
    [],
  );

  const handleDeleteBatch = useCallback(
    (batchId: string) => {
      deleteBatch(batchId);
      try { recomputeAndSaveAnglePatterns(); } catch { /* non-fatal */ }
      try { recomputeAndSaveCalibration(); } catch { /* non-fatal */ }
      setRefreshTick((t) => t + 1);
    },
    [],
  );

  const handleDownloadBrief = useCallback((brief: BriefMemoryRecord) => {
    downloadBrief(brief);
  }, []);

  // Aggregate avg score across the whole memory (scored briefs only)
  const globalAvg = useMemo(() => {
    const allBriefs = batches.flatMap((b) => b.briefs);
    const scored = allBriefs.filter((b) => b.reviewScore > 0);
    if (scored.length === 0) return null;
    return scored.reduce((sum, b) => sum + b.reviewScore, 0) / scored.length;
  }, [batches]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={onBack}
              className="text-sm text-slate-500 hover:text-slate-700 mb-2 block"
            >
              {'\u2190'} Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Memory Vault</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Browse past batches, audit scores, and download historic briefs
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Batches" value={stats.totalBatches.toString()} />
          <StatCard label="Briefs" value={stats.totalBriefs.toString()} />
          <StatCard
            label="Avg Score"
            value={globalAvg != null ? globalAvg.toFixed(1) : '—'}
            tone={globalAvg != null ? (globalAvg >= 7 ? 'emerald' : globalAvg >= 5 ? 'amber' : 'red') : 'slate'}
          />
          <StatCard label="Feedback" value={stats.totalFeedback.toString()} />
          <StatCard label="Storage" value={`${stats.storageSizeKB} KB`} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search briefs..."
              className="col-span-1 md:col-span-2 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={angleFilter}
              onChange={(e) => setAngleFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All angles</option>
              {angles.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                { val: 'all', label: 'All scores' },
                { val: 'scored', label: 'Scored only' },
                { val: 'unscored', label: 'Unscored only' },
                { val: 'high', label: 'High (7+)' },
                { val: 'low', label: 'Low (1-5)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.val}
                onClick={() => setScoreFilter(opt.val)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  scoreFilter === opt.val
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {(angleFilter || productFilter || scoreFilter !== 'all' || search) && (
              <button
                onClick={() => {
                  setAngleFilter('');
                  setProductFilter('');
                  setScoreFilter('all');
                  setSearch('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 underline ml-auto"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Batches */}
        {batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <div className="text-3xl mb-3">{'\uD83D\uDCE6'}</div>
            <div className="text-sm font-semibold text-slate-700 mb-1">
              No batches in memory yet
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Run an autopilot batch first — once it finishes, every brief gets written here
              and this view lights up with scores, concept history, and downloadable briefs.
            </p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <div className="text-sm font-semibold text-slate-700 mb-1">
              No briefs match your filters
            </div>
            <p className="text-xs text-slate-500">
              Try clearing the filters above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBatches.map((batch) => (
              <BatchCard
                key={batch.batchId}
                batch={batch}
                feedbackForBatch={feedbackByBatch[batch.batchId] ?? []}
                onScoreOverride={handleScoreOverride}
                onDeleteBatch={handleDeleteBatch}
                onDownloadBrief={handleDownloadBrief}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'emerald' | 'amber' | 'red';
}) {
  const toneClass = {
    slate: 'text-slate-800',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }[tone];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
      <div className={`text-xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}
