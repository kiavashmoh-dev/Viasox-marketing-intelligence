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
import { listCachedPages, refreshPageTokens, getMetaDiagnostic, type MetaDiagnostic, type PageTokenRefreshResult } from '../../api/metaProxy';

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
  const [diagnostic, setDiagnostic] = useState<{
    pages: Array<{ id: string; name: string | null }>;
    refreshed: boolean;
    deep?: MetaDiagnostic;
    refreshResult?: PageTokenRefreshResult;
  } | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

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

  const handleDiagnose = async () => {
    setDiagnosing(true);
    setDiagnostic(null);
    try {
      // Force a fresh refresh and capture its result, then deep diagnostic + cached list
      let refreshResult: PageTokenRefreshResult | undefined;
      try {
        refreshResult = await refreshPageTokens();
      } catch (err) {
        console.warn('refreshPageTokens failed', err);
      }
      const [deep, list] = await Promise.all([
        getMetaDiagnostic().catch((err) => { console.warn('Deep diagnostic failed', err); return null; }),
        listCachedPages().catch(() => ({ pages: [], page_count: 0 })),
      ]);
      setDiagnostic({ pages: list.pages, refreshed: true, deep: deep ?? undefined, refreshResult });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setDiagnostic({ pages: [], refreshed: false });
      setError(msg);
    } finally {
      setDiagnosing(false);
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
      {summary && !pulling && (() => {
        const errors = summary.perAd.filter((a) => a.error);
        const errorRatio = summary.adsScanned > 0 ? errors.length / summary.adsScanned : 0;
        const allFailed = errors.length > 0 && errors.length === summary.adsScanned;
        const tone = allFailed
          ? 'bg-red-50 border-red-200 text-red-900'
          : summary.newCommentsCount > 0
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-slate-50 border-slate-200 text-slate-700';

        // Group errors by message so we don't show 2032 identical lines
        const errorGroups = new Map<string, number>();
        for (const e of errors) {
          if (!e.error) continue;
          errorGroups.set(e.error, (errorGroups.get(e.error) ?? 0) + 1);
        }
        const topErrors = Array.from(errorGroups.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        return (
          <div className={`border rounded-lg p-3 text-xs ${tone}`}>
            <div className="font-semibold">
              {summary.newCommentsCount > 0
                ? `Pulled ${summary.newCommentsCount.toLocaleString()} new comments from ${summary.adsScanned} ads`
                : allFailed
                  ? `Every ad errored (${summary.adsScanned} of ${summary.adsScanned}) — see error details below`
                  : `No new comments — ${summary.adsScanned} ads scanned`}
            </div>
            {summary.isInitialBackfill && !allFailed && (
              <div className="mt-1 text-[10px] opacity-75">
                Initial 90-day backfill complete. Future pulls will only fetch new comments.
              </div>
            )}
            {topErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
                  {errors.length} of {summary.adsScanned} ad{summary.adsScanned !== 1 ? 's' : ''} errored ({Math.round(errorRatio * 100)}%)
                </div>
                {topErrors.map(([msg, count], i) => (
                  <div key={i} className="text-[10px] font-mono break-all bg-white/50 rounded px-2 py-1">
                    <span className="opacity-60">[{count}×]</span> {msg.slice(0, 400)}{msg.length > 400 ? '…' : ''}
                  </div>
                ))}
                {errorGroups.size > 3 && (
                  <div className="text-[10px] opacity-60">+{errorGroups.size - 3} other error type{errorGroups.size - 3 !== 1 ? 's' : ''} — full list in browser console</div>
                )}
              </div>
            )}
          </div>
        );
      })()}

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

      {/* Diagnostic — what pages do we have access to? */}
      {!pulling && (
        <details className="border-t border-slate-100 pt-3">
          <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-700">
            Diagnose page access (which Pages can I pull comments from?)
          </summary>
          <div className="mt-2 space-y-2">
            <button
              onClick={handleDiagnose}
              disabled={diagnosing}
              className="text-xs border border-slate-300 text-slate-700 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              {diagnosing ? 'Checking…' : 'Refresh + list my Pages'}
            </button>
            {diagnostic && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-3">
                {/* Deep diagnostic — what Meta actually says */}
                {diagnostic.deep && (
                  <div className="space-y-2 pb-2 border-b border-slate-200">
                    <div className="font-semibold text-slate-700">Token diagnostic from Meta</div>

                    {/* Identity */}
                    <div>
                      <span className="text-slate-500">User:</span>{' '}
                      <span className="font-mono">{diagnostic.deep.me.name || '?'} ({diagnostic.deep.me.id || '?'})</span>
                    </div>

                    {/* Granted permissions */}
                    {diagnostic.deep.granted_permissions.data && (() => {
                      const granted = diagnostic.deep.granted_permissions.data!.filter((p) => p.status === 'granted').map((p) => p.permission);
                      const declined = diagnostic.deep.granted_permissions.data!.filter((p) => p.status === 'declined').map((p) => p.permission);
                      const expected = ['public_profile', 'pages_show_list', 'pages_read_engagement', 'pages_read_user_content', 'ads_read'];
                      const missing = expected.filter((s) => !granted.includes(s));
                      return (
                        <div>
                          <div className="text-slate-500 mb-1">Permissions granted:</div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {granted.map((p) => (
                              <span key={p} className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">{p}</span>
                            ))}
                          </div>
                          {declined.length > 0 && (
                            <>
                              <div className="text-slate-500 mb-1">Permissions DECLINED by user:</div>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {declined.map((p) => (
                                  <span key={p} className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono">{p}</span>
                                ))}
                              </div>
                            </>
                          )}
                          {missing.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                              <div className="font-semibold text-amber-900">⚠ Missing required scope{missing.length !== 1 ? 's' : ''}:</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {missing.map((p) => (
                                  <span key={p} className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono">{p}</span>
                                ))}
                              </div>
                              <div className="text-[10px] text-amber-800 mt-1">
                                Disconnect Meta in the panel above, then re-authorize — make sure to leave all permissions checked on Facebook's prompt.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* /me/accounts raw response */}
                    <div>
                      <div className="text-slate-500">
                        /me/accounts response (HTTP {diagnostic.deep.me_accounts_raw.status}):
                      </div>
                      {diagnostic.deep.me_accounts_raw.body.error ? (
                        <pre className="bg-red-50 border border-red-200 rounded p-2 text-[10px] overflow-x-auto mt-1">
                          {JSON.stringify(diagnostic.deep.me_accounts_raw.body.error, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-[10px] mt-0.5">
                          Returned <strong>{diagnostic.deep.me_accounts_raw.body.data?.length ?? 0}</strong> page{(diagnostic.deep.me_accounts_raw.body.data?.length ?? 0) !== 1 ? 's' : ''}
                          {diagnostic.deep.me_accounts_raw.body.data && diagnostic.deep.me_accounts_raw.body.data.length > 0 && (
                            <span> — with tokens: {diagnostic.deep.me_accounts_raw.body.data.filter((p) => p.has_access_token).length}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Discovery breakdown — counts from the 3-strategy refresh */}
                {diagnostic.refreshResult && (
                  <div className="space-y-1 pb-2 border-b border-slate-200">
                    <div className="font-semibold text-slate-700">Page discovery results</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded p-2 border border-slate-200">
                        <div className="text-lg font-bold text-slate-800">{diagnostic.refreshResult.pages_discovered_total ?? 0}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500">Discovered total</div>
                      </div>
                      <div className="bg-white rounded p-2 border border-slate-200">
                        <div className="text-lg font-bold text-slate-800">{diagnostic.refreshResult.pages_discovered_via_business ?? 0}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500">Via business graph</div>
                      </div>
                      <div className={`rounded p-2 border ${diagnostic.refreshResult.page_count > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`text-lg font-bold ${diagnostic.refreshResult.page_count > 0 ? 'text-emerald-800' : 'text-red-800'}`}>{diagnostic.refreshResult.page_count}</div>
                        <div className="text-[9px] uppercase tracking-wider opacity-75">Tokens cached</div>
                      </div>
                    </div>
                    {diagnostic.refreshResult.failed_pages && diagnostic.refreshResult.failed_pages.length > 0 && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2">
                        <div className="font-semibold text-amber-900 text-[11px] mb-1">
                          {diagnostic.refreshResult.failed_pages.length} Page{diagnostic.refreshResult.failed_pages.length !== 1 ? 's' : ''} discovered but missing tokens:
                        </div>
                        <ul className="space-y-0.5">
                          {diagnostic.refreshResult.failed_pages.map((p) => (
                            <li key={p.id} className="flex gap-2 text-[10px]">
                              <span className="font-mono text-amber-700 w-32 shrink-0 truncate" title={p.id}>{p.id}</span>
                              <span className="text-amber-900 truncate">{p.name || '(unknown name)'}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-[10px] text-amber-800 leading-relaxed border-t border-amber-200 pt-2">
                          <strong>Fix:</strong> In Business Settings → <strong>Users</strong> → click your user → <strong>Assets</strong> → <strong>Pages</strong> → <strong>Add Assets</strong> → assign each of these Pages with the <strong>Manage Page</strong> or <strong>Create Content</strong> task.
                          A classic Page Role (via facebook.com/yourpage/settings) also works.
                        </div>
                      </div>
                    )}
                    {diagnostic.refreshResult.errors && diagnostic.refreshResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-700">
                          {diagnostic.refreshResult.errors.length} raw discovery error{diagnostic.refreshResult.errors.length !== 1 ? 's' : ''} (click to expand)
                        </summary>
                        <pre className="text-[10px] mt-1 overflow-x-auto bg-red-50 border border-red-200 rounded p-2">
                          {JSON.stringify(diagnostic.refreshResult.errors.slice(0, 5), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="font-semibold text-slate-700">
                  Cached access tokens for {diagnostic.pages.length} Page{diagnostic.pages.length !== 1 ? 's' : ''}
                </div>
                {diagnostic.pages.length === 0 ? (
                  <div className="text-amber-700 leading-relaxed">
                    <strong>Meta returned zero pages.</strong> Your Meta user needs a direct <strong>Page Role</strong> (Admin / Editor / Moderator / Analyst) on the pages that own your ads.
                    Business-Manager-level access alone is NOT enough — Meta requires explicit page-level assignment.
                    <div className="mt-2">
                      <strong>Fix:</strong> Business Manager → Pages → select your Page → People → Add → assign your user as Admin or Editor.
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {diagnostic.pages.map((p) => (
                      <li key={p.id} className="flex gap-2">
                        <span className="font-mono text-[10px] text-slate-500 w-32 shrink-0 truncate" title={p.id}>{p.id}</span>
                        <span className="truncate">{p.name || '(no name)'}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {summary && summary.perAd.some((a) => a.error?.includes('No cached page token')) && (() => {
                  // Cross-reference: pages the ads asked for vs pages we cached
                  const missingPageIds = new Set<string>();
                  for (const a of summary.perAd) {
                    const match = a.error?.match(/page_id=(\d+)/);
                    if (match) missingPageIds.add(match[1]);
                  }
                  const cachedIds = new Set(diagnostic.pages.map((p) => p.id));
                  const stillMissing = Array.from(missingPageIds).filter((id) => !cachedIds.has(id));
                  if (stillMissing.length === 0) return null;
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <div className="font-semibold text-amber-900">
                        {stillMissing.length} Page{stillMissing.length !== 1 ? 's' : ''} referenced by your ads but NOT in /me/accounts:
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {stillMissing.slice(0, 10).map((id) => (
                          <li key={id} className="font-mono text-[10px] text-amber-800">{id}</li>
                        ))}
                        {stillMissing.length > 10 && (
                          <li className="text-[10px] text-amber-700">+{stillMissing.length - 10} more</li>
                        )}
                      </ul>
                      <div className="mt-2 text-[10px] text-amber-800 leading-relaxed">
                        Assign your user as Admin/Editor on each of these Pages in Business Manager, then re-run the pull.
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </details>
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
