/**
 * Home — the new dashboard landing page that replaces OutputSelector.
 *
 * Renders inside the AppShell's main content area, with the Sidebar
 * always visible to the left. Modeled after the Parker reference layout:
 *   - Page header with brand name + subtitle
 *   - A grid of status cards (top section)
 *   - Stacked "recent activity" sections (lower portion)
 *   - Shortcut row at the bottom
 *
 * Status card data is wired to the real stores where possible:
 *   - Customer Reviews → from the current FullAnalysis prop
 *   - Ad Comments → commentBank.getStats()
 *   - Inspiration → inspirationStore count
 *   - Memory Vault → memoryStore batches count
 *   - Saved Analyses → commentAnalysisStore count
 *
 * Sections with TBD content (per the design discussion) show a small
 * placeholder hint so the layout reads correctly while we wait for the
 * user's content direction.
 */
import { useEffect, useState } from 'react';
import type { FullAnalysis, ModuleId } from '../engine/types';
import { formatNumber } from '../utils/formatters';
import { getStats as getCommentBankStats } from '../comments/commentBank';
import { getAllAnalyses as getAllSavedAnalyses } from '../comments/commentAnalysisStore';

interface Props {
  analysis: FullAnalysis;
  onNavigate: (moduleId: ModuleId) => void;
}

/** Tile / status card shape — render data is pre-computed from the stores. */
interface StatusCard {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  status: 'completed' | 'pending' | 'incomplete';
  statLine: string;
  actionLabel: string;
  actionTarget: ModuleId;
}

/** Pulled-from-store counts for the status grid. Loaded once on mount;
 *  if a count fails to load, it stays at null and the card shows an
 *  appropriate placeholder. */
interface StoreCounts {
  commentCount: number | null;
  commentAds: number | null;
  commentLastPullAt: number | null;
  savedAnalysesCount: number | null;
  inspirationCount: number | null;
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

export default function Home({ analysis, onNavigate }: Props) {
  const [counts, setCounts] = useState<StoreCounts>({
    commentCount: null,
    commentAds: null,
    commentLastPullAt: null,
    savedAnalysesCount: null,
    inspirationCount: null,
  });

  // Load real counts from the data layer on mount. All loads are best-effort;
  // a failure on one doesn't block the others.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Partial<StoreCounts> = {};
      try {
        const s = await getCommentBankStats();
        if (!cancelled) {
          next.commentCount = s.totalComments;
          next.commentAds = s.uniqueAds;
          next.commentLastPullAt = s.lastPullAt;
        }
      } catch (e) {
        console.warn('[Home] commentBank stats failed', e);
      }
      try {
        const a = await getAllSavedAnalyses();
        if (!cancelled) next.savedAnalysesCount = a.length;
      } catch (e) {
        console.warn('[Home] saved analyses count failed', e);
      }
      // Inspiration count comes from a lazy dynamic import so we don't pull
      // its entire dependency tree into the Home bundle.
      try {
        const mod = await import('../inspiration/inspirationStore');
        const items = await mod.getAllItems();
        if (!cancelled) next.inspirationCount = items.length;
      } catch (e) {
        console.warn('[Home] inspiration count failed', e);
      }
      if (!cancelled) setCounts((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Status cards (top grid) ──
  const cards: StatusCard[] = [
    {
      icon: '⭐',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      title: 'Customer Reviews',
      status: 'completed',
      statLine: `${formatNumber(analysis.totalReviews)} reviews processed and ready for insights`,
      actionLabel: 'View Insights',
      actionTarget: 'segments',
    },
    {
      icon: '💬',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Ad Comments',
      status: counts.commentCount && counts.commentCount > 0 ? 'completed' : 'pending',
      statLine: counts.commentCount === null
        ? 'Loading…'
        : counts.commentCount === 0
          ? 'No comments pulled yet — connect Meta to start'
          : `${formatNumber(counts.commentCount)} comments across ${formatNumber(counts.commentAds ?? 0)} ads · last pull ${formatTimeAgo(counts.commentLastPullAt)}`,
      actionLabel: 'Open Module',
      actionTarget: 'comments',
    },
    {
      icon: '📚',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      title: 'Inspiration Bank',
      status: counts.inspirationCount && counts.inspirationCount > 0 ? 'completed' : 'pending',
      statLine: counts.inspirationCount === null
        ? 'Loading…'
        : counts.inspirationCount === 0
          ? 'No references yet — upload videos or briefs to seed the bank'
          : `${counts.inspirationCount} reference${counts.inspirationCount === 1 ? '' : 's'} tagged and ready for injection`,
      actionLabel: 'View Inspiration',
      actionTarget: 'inspiration',
    },
    {
      icon: '🧠',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      title: 'Saved Analyses',
      status: counts.savedAnalysesCount && counts.savedAnalysesCount > 0 ? 'completed' : 'pending',
      statLine: counts.savedAnalysesCount === null
        ? 'Loading…'
        : counts.savedAnalysesCount === 0
          ? 'No analyses saved yet — run your first comment analysis'
          : `${counts.savedAnalysesCount} analys${counts.savedAnalysesCount === 1 ? 'is' : 'es'} in your library`,
      actionLabel: 'Browse Library',
      actionTarget: 'comments',
    },
    {
      icon: '🗃️',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      title: 'Memory Vault',
      status: 'completed',
      statLine: 'Past brief batches with scores, grades, and download history',
      actionLabel: 'Open Vault',
      actionTarget: 'memory-vault',
    },
    {
      icon: '🏭',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      title: 'The Factory',
      status: 'completed',
      statLine: 'Generate concepts, evaluate, write briefs — end-to-end from an Asana batch or a manually-built table',
      actionLabel: 'Open The Factory',
      actionTarget: 'autopilot',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Viasox</h1>
          <p className="text-slate-500 mt-1">Your brand dashboard</p>
        </div>

        {/* Top status grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {cards.map((card, i) => (
            <StatusTile key={i} card={card} onClick={() => onNavigate(card.actionTarget)} />
          ))}
        </div>

        {/* Lower sections — placeholders the user will fill in */}
        <SectionPlaceholder
          title="Recent ad performance"
          icon="📊"
          description="[Content for this section will be added — likely recent ad runs, their KPIs, and links into the ad-level reports.]"
          viewAllTarget="comments"
          viewAllLabel="View all"
        />

        <SectionPlaceholder
          title="Dive back in to your ideas"
          icon="💡"
          description="[Content for this section will be added — likely your recent saved analyses, briefs, and concepts to pick back up from where you left off.]"
          viewAllTarget="memory-vault"
          viewAllLabel="View all"
        />

        <SectionPlaceholder
          title="Inspiration highlights"
          icon="📚"
          description="[Content for this section will be added — likely the latest references you added or top-scoring inspiration ads.]"
          viewAllTarget="inspiration"
          viewAllLabel="View all"
        />

        {/* Shortcuts row */}
        <div className="mt-10 pt-6 border-t border-slate-100">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Shortcuts
          </div>
          <div className="flex flex-wrap gap-2">
            <Shortcut label="Open The Factory" icon="🏭" onClick={() => onNavigate('autopilot')} />
            <Shortcut label="Pull new comments" icon="💬" onClick={() => onNavigate('comments')} />
            <Shortcut label="Write a script" icon="🎬" onClick={() => onNavigate('script')} />
            <Shortcut label="Add inspiration" icon="📚" onClick={() => onNavigate('inspiration')} />
            <Shortcut label="Build a persona" icon="👤" onClick={() => onNavigate('persona')} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function StatusTile({ card, onClick }: { card: StatusCard; onClick: () => void }) {
  const statusBadge =
    card.status === 'completed' ? (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Completed</span>
    ) : card.status === 'pending' ? (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
    ) : (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Not started</span>
    );

  return (
    <button
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center text-base shrink-0`}>
          <span className={card.iconColor}>{card.icon}</span>
        </div>
        {statusBadge}
      </div>
      <div className="font-semibold text-slate-800 mb-1">{card.title}</div>
      <p className="text-xs text-slate-500 leading-relaxed mb-3 min-h-[2.4rem]">{card.statLine}</p>
      <div className="text-xs font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
        {card.actionLabel}
        <span aria-hidden>→</span>
      </div>
    </button>
  );
}

function SectionPlaceholder({
  title,
  icon,
  description,
  viewAllTarget,
  viewAllLabel,
}: {
  title: string;
  icon: string;
  description: string;
  viewAllTarget: ModuleId;
  viewAllLabel: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h2>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // Note: actual nav comes from the parent — placeholder for now.
            void viewAllTarget;
          }}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          {viewAllLabel} →
        </a>
      </div>
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-5 text-sm text-slate-500 italic">
        {description}
      </div>
    </div>
  );
}

function Shortcut({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}
