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
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl px-8 py-10">
        {/* Page header — Newsreader display serif gives the brand name
            visual weight without shouting. Slight italic-leaning warmth. */}
        <div className="mb-10">
          <h1 className="font-display text-5xl font-medium text-navy tracking-tight">Viasox</h1>
          <p className="text-slate-500 mt-2 text-base">Your brand dashboard</p>
        </div>

        {/* Top status grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {cards.map((card, i) => (
            <StatusTile key={i} card={card} onClick={() => onNavigate(card.actionTarget)} />
          ))}
        </div>

        {/* ── FACTORY ANATOMY SHOWCASE ───────────────────────────────────
            Curiosity-evoking promo for the visual walkthrough. Sits as
            the main focal point on the home page — designed to make a
            first-time viewer want to click through and understand the
            depth of what's been built. Uses the navy primary surface
            (inverse of the rest of the cream-themed page) so it visually
            stands apart and demands attention. */}
        <FactoryAnatomyPromo onClick={() => onNavigate('factory-tour')} />

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
        <div className="mt-12 pt-8 border-t border-cream-border">
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
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warm-sage/15 text-warm-sage">Completed</span>
    ) : card.status === 'pending' ? (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warm-amber/15 text-warm-amber">Pending</span>
    ) : (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cream-deep text-slate-600">Not started</span>
    );

  return (
    <button
      onClick={onClick}
      className="bg-white border border-cream-border rounded-xl p-5 text-left hover-lift group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center text-lg shrink-0`}>
          <span className={card.iconColor}>{card.icon}</span>
        </div>
        {statusBadge}
      </div>
      <div className="font-display text-lg font-medium text-navy mb-1.5 leading-tight">{card.title}</div>
      <p className="text-xs text-slate-500 leading-relaxed mb-4 min-h-[2.4rem]">{card.statLine}</p>
      <div className="text-xs font-semibold text-navy group-hover:text-navy-deep flex items-center gap-1.5 transition-colors">
        {card.actionLabel}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
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
        <h2 className="font-display text-xl font-medium text-navy flex items-center gap-2.5 leading-none">
          <span className="text-lg">{icon}</span>
          {title}
        </h2>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void viewAllTarget;
          }}
          className="text-xs text-navy hover:text-navy-deep font-semibold transition-colors flex items-center gap-1 group"
        >
          {viewAllLabel}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </a>
      </div>
      <div className="bg-cream-deep/50 border border-dashed border-cream-border rounded-xl px-5 py-6 text-sm text-slate-500 italic leading-relaxed">
        {description}
      </div>
    </div>
  );
}

function Shortcut({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-cream-deep border border-cream-border hover:border-navy/20 rounded-lg transition-colors"
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

/**
 * FactoryAnatomyPromo — the curiosity hook on the home page that pulls
 * the user into the Factory Anatomy walkthrough.
 *
 * Direction B visual treatment, inverted: navy background instead of
 * cream so this section visually OWNS the page when the user scrolls
 * past the status grid. Newsreader serif for the hero line, warm-amber
 * accents to call out the numbers, italic ornament for personality.
 *
 * The icon strip at the bottom is a hand-built mini-diagram showing
 * inputs → factory → output — gives the eye something to land on while
 * the headline copy does the curiosity-evoking work.
 */
function FactoryAnatomyPromo({ onClick }: { onClick: () => void }) {
  return (
    <section className="mb-12">
      <button
        onClick={onClick}
        className="group w-full relative overflow-hidden bg-navy rounded-2xl px-8 py-10 md:px-12 md:py-14 text-left hover-lift transition-transform"
      >
        {/* Decorative warm radial accent in the top-right corner */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #c89b14 0%, transparent 70%)' }}
        />
        {/* Subtle decorative dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-10 items-center">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-warm-amber mb-4">
              · A guided tour ·
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-medium text-cream leading-[1.05] tracking-tight">
              There&apos;s more happening{' '}
              <span className="italic text-warm-amber">behind</span>{' '}
              every brief.
            </h2>
            <p className="font-display italic text-lg md:text-xl text-cream/75 mt-5 leading-relaxed max-w-2xl">
              Six AI stages. Five knowledge sources. A closed-loop memory that learns from every batch
              you ship. <span className="not-italic text-cream font-medium">See how the factory operates.</span>
            </p>

            {/* Mini flow diagram — inputs → factory → output */}
            <div className="mt-8 flex items-center gap-3 text-cream/60 text-sm">
              <div className="flex items-center gap-1.5">
                <FlowIcon emoji="📋" />
                <FlowIcon emoji="⭐" />
                <FlowIcon emoji="💬" />
                <FlowIcon emoji="📚" />
                <FlowIcon emoji="🎨" />
              </div>
              <span className="text-cream/40 text-base mx-1">→</span>
              <FlowIcon emoji="🏭" big />
              <span className="text-cream/40 text-base mx-1">→</span>
              <FlowIcon emoji="📄" />
            </div>
          </div>

          {/* CTA pill on the right */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-2.5 px-5 py-3 bg-cream text-navy rounded-full font-semibold text-sm shadow-sm transition-transform group-hover:scale-[1.02]">
              <span>Take the tour</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}

function FlowIcon({ emoji, big }: { emoji: string; big?: boolean }) {
  const sizeClass = big ? 'w-10 h-10 text-xl' : 'w-7 h-7 text-sm';
  return (
    <div className={`${sizeClass} rounded-full bg-cream/10 border border-cream/20 flex items-center justify-center backdrop-blur-sm`}>
      {emoji}
    </div>
  );
}
