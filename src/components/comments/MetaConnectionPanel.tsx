/**
 * MetaConnectionPanel — UI for connecting/disconnecting the Meta account.
 *
 * Renders one of three states:
 *   - loading   → checking current status
 *   - disconnected → "Connect Meta" CTA
 *   - connected → account name + days remaining + Disconnect button
 *
 * Also auto-detects the post-OAuth landing (URL has ?meta=connected) and
 * refreshes status / strips the query param.
 */

import { useEffect, useState, useCallback } from 'react';
import { getMetaStatus, startMetaOauth, disconnectMeta, type MetaStatus } from '../../api/metaProxy';

interface Props {
  /** Optional callback fired whenever the connection state changes (e.g., to refresh dependent UI). */
  onChange?: (status: MetaStatus) => void;
}

export default function MetaConnectionPanel({ onChange }: Props) {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getMetaStatus();
      setStatus(s);
      onChange?.(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  // On mount: load status. Also detect post-OAuth landing (?meta=connected)
  // and clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('meta')) {
      params.delete('meta');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = () => {
    startMetaOauth(window.location.href);
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Meta? You will need to re-authorize to pull new comments.')) return;
    setBusy(true);
    setError(null);
    try {
      await disconnectMeta();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-600">Checking Meta connection…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-red-800">Meta connection error</div>
            <div className="text-xs text-red-700 mt-1 break-words">{error}</div>
          </div>
          <button
            onClick={refresh}
            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors font-medium shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status?.connected) {
    const daysLeft = status.days_remaining;
    const tone =
      daysLeft <= 7 ? 'text-red-700 bg-red-50 border-red-200'
      : daysLeft <= 14 ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-emerald-700 bg-emerald-50 border-emerald-200';

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-base shrink-0">
              {'🔗'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">
                Connected to Meta as {status.user_name || 'unknown account'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${tone}`}>
                  {daysLeft}d token remaining
                </span>
                {status.user_email && <span className="truncate">{status.user_email}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refresh}
              disabled={busy}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 disabled:opacity-40"
              title="Refresh status"
            >
              {'↻'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={busy}
              className="text-xs border border-slate-300 text-slate-700 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Disconnected
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800">Connect your Meta account</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Authorize Viasox Intelligence to pull comments and performance data from your Facebook Pages and ad accounts.
            We store the access token securely on the server — never in your browser.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="text-sm bg-navy text-cream px-4 py-2 rounded-lg hover:bg-navy-deep transition-colors font-medium shrink-0"
        >
          Connect Meta
        </button>
      </div>
    </div>
  );
}
