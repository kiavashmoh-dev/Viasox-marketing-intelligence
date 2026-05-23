/**
 * CommentPullPanel — UI for triggering the Meta comment pull and
 * surfacing the resulting bank state. Renders inline once Meta is
 * connected (driven by the parent CommentUploader).
 *
 *   - "Pull Now" button (90-day backfill first run, delta after)
 *   - Live progress: which ad / how many comments so far
 *   - Stats from the bank: total comments, ads, last pull time
 *   - "Analyze Comments" CTA → hands the bank's contents to the parent
 *     for the categorization + insights pipeline (same one CSVs use)
 */

import { useCallback, useEffect, useState } from 'react';
import { pullAllAdComments } from '../../comments/commentPuller';
import { getStats, getAllComments, clearAllComments } from '../../comments/commentBank';
import type { CommentBankStats, PullProgress, PullSummary } from '../../comments/commentBankTypes';
import type { CommentRecord } from '../../comments/commentBankTypes';
import type { RawComment } from '../../utils/commentCsv';

interface Props {
  /** Called when the user clicks "Analyze N Comments" so the parent can
   * fan out the bank contents into the existing categorization pipeline. */
  onAnalyzeBank: (rawComments: RawComment[]) => void;
}

function formatTimeAgo(ts: number | null): string {
  if (!ts) return 'never';
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function commentRecordToRaw(c: CommentRecord): RawComment {
  return {
    comment: c.text,
    date: new Date(c.createdAt).toISOString(),
    platform: c.platform,
    brand: c.pageName || 'Viasox',
    adName: c.adName,
    commenterName: c.authorName || '',
  };
}

export default function CommentPullPanel({ onAnalyzeBank }: Props) {
  const [stats, setStats] = useState<CommentBankStats | null>(null);
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState<PullProgress | null>(null);
  const [summary, setSummary] = useState<PullSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      const s = await getStats();
      setStats(s);
    } catch (err) {
      console.warn('[CommentPullPanel] getStats failed', err);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handlePull = async () => {
    setPulling(true);
    setError(null);
    setSummary(null);
    setProgress({ phase: 'discovering-ads', currentAd: 0, totalAds: 0, pulledSoFar: 0 });
    try {
      const result = await pullAllAdComments((p) => setProgress(p));
      setSummary(result);
      await refreshStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setProgress((p) => p ? { ...p, phase: 'error', error: msg } : null);
    } finally {
      setPulling(false);
    }
  };

  const handleAnalyzeBank = async () => {
    setBusy(true);
    try {
      const comments = await getAllComments();
      const raw = comments.map(commentRecordToRaw);
      onAnalyzeBank(raw);
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Wipe ALL pulled comments and per-ad sync cursors? Next pull will do a fresh 90-day backfill.')) return;
    setBusy(true);
    try {
      await clearAllComments();
      setSummary(null);
      await refreshStats();
    } finally {
      setBusy(false);
    }
  };

  const hasBank = (stats?.totalComments ?? 0) > 0;
  const showProgress = pulling && progress;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-800">Pull comments from Meta</div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {hasBank
              ? `Refresh pulls only NEW comments per ad since the last run.`
              : `First run does a 90-day backfill across every active ad. Subsequent runs only pull new comments.`}
          </p>
        </div>
        <button
          onClick={handlePull}
          disabled={pulling || busy}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shrink-0 disabled:opacity-40"
        >
          {pulling ? 'Pulling…' : hasBank ? 'Refresh Comments' : 'Pull Last 90 Days'}
        </button>
      </div>

      {/* Stats */}
      {stats && hasBank && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Comments" value={stats.totalComments.toLocaleString()} />
          <Stat label="Ads" value={stats.uniqueAds.toString()} />
          <Stat label="Campaigns" value={stats.uniqueCampaigns.toString()} />
          <Stat label="Last pull" value={formatTimeAgo(stats.lastPullAt)} />
        </div>
      )}

      {/* Live progress */}
      {showProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-semibold text-blue-900 capitalize">
              {progress.phase.replace(/-/g, ' ')}…
            </div>
          </div>
          {progress.phase === 'pulling-comments' && progress.totalAds > 0 && (
            <>
              <div className="text-[11px] text-blue-800 truncate">
                Ad {progress.currentAd} of {progress.totalAds}
                {progress.currentAdName ? ` — ${progress.currentAdName}` : ''}
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all"
                  style={{ width: `${(progress.currentAd / Math.max(1, progress.totalAds)) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-blue-700">
                {progress.pulledSoFar} new comments pulled so far
              </div>
            </>
          )}
        </div>
      )}

      {/* Last pull summary */}
      {summary && !pulling && (
        <div className={`border rounded-lg p-3 text-xs ${summary.newCommentsCount > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          <div className="font-semibold">
            {summary.newCommentsCount > 0
              ? `Pulled ${summary.newCommentsCount.toLocaleString()} new comments from ${summary.adsScanned} ads`
              : `No new comments — ${summary.adsScanned} ads scanned`}
          </div>
          {summary.isInitialBackfill && (
            <div className="mt-1 text-[10px] opacity-75">
              Initial 90-day backfill complete. Future pulls will only fetch new comments.
            </div>
          )}
          {summary.perAd.some((a) => a.error) && (
            <div className="mt-1 text-[10px] opacity-75">
              {summary.perAd.filter((a) => a.error).length} ad{summary.perAd.filter((a) => a.error).length !== 1 ? 's' : ''} errored (see browser console).
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && !pulling && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
          <div className="font-semibold text-red-800">Pull failed</div>
          <div className="text-red-700 mt-1 break-words">{error}</div>
        </div>
      )}

      {/* Analysis CTA */}
      {hasBank && !pulling && (
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={handleClear}
            disabled={busy}
            className="text-[11px] text-slate-500 hover:text-red-600 underline disabled:opacity-40"
          >
            Wipe bank
          </button>
          <button
            onClick={handleAnalyzeBank}
            disabled={busy}
            className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-40"
          >
            Analyze {(stats?.totalComments ?? 0).toLocaleString()} Comments →
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <div className="text-sm font-bold text-slate-800">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
