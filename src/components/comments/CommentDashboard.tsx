import type { RawComment } from '../../utils/commentCsv';

export interface CategorizedComment {
  original: RawComment;
  category: 'Engagement' | 'Question' | 'Testimonial' | 'Objection' | 'Request' | 'Complaint' | 'Spam';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  keyTheme: string;
}

export interface CommentSummary {
  totalComments: number;
  byCat: Record<string, number>;
  bySentiment: Record<string, number>;
  topThemes: { theme: string; count: number; category: string }[];
}

interface Props {
  comments: CategorizedComment[];
  summary: CommentSummary;
}

const CAT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Engagement: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
  Question: { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
  Testimonial: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  Objection: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
  Request: { bg: 'bg-violet-100', text: 'text-violet-700', bar: 'bg-violet-500' },
  Complaint: { bg: 'bg-rose-100', text: 'text-rose-700', bar: 'bg-rose-500' },
  Spam: { bg: 'bg-slate-100', text: 'text-slate-500', bar: 'bg-slate-400' },
};

const SENT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Positive: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  Neutral: { bg: 'bg-slate-100', text: 'text-slate-600', bar: 'bg-slate-400' },
  Negative: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
};

export default function CommentDashboard({ comments, summary }: Props) {
  const maxCatCount = Math.max(...Object.values(summary.byCat), 1);
  const positiveCount = summary.bySentiment['Positive'] ?? 0;
  const positivePct = Math.round((positiveCount / summary.totalComments) * 100);

  // Find top category
  const topCat = Object.entries(summary.byCat).sort((a, b) => b[1] - a[1])[0];

  // Find a sample testimonial
  const sampleTestimonial = comments.find(c => c.category === 'Testimonial')?.original.comment;

  return (
    <div className="space-y-6">
      {/* Key Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{summary.totalComments}</div>
          <div className="text-xs text-slate-500 mt-1">Total Comments</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{positivePct}%</div>
          <div className="text-xs text-slate-500 mt-1">Positive Sentiment</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{topCat?.[0] ?? '-'}</div>
          <div className="text-xs text-slate-500 mt-1">Top Category</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-violet-600">{summary.topThemes[0]?.theme ?? '-'}</div>
          <div className="text-xs text-slate-500 mt-1">Top Theme</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(summary.byCat)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
              const pct = Math.round((count / summary.totalComments) * 100);
              const barPct = Math.round((count / maxCatCount) * 100);
              const colors = CAT_COLORS[cat] ?? CAT_COLORS.Spam;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-28 text-center shrink-0 ${colors.bg} ${colors.text}`}>
                    {cat}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                      style={{ width: `${Math.max(barPct, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-20 text-right shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Sentiment Split */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Sentiment Distribution</h3>
        {/* Stacked bar */}
        <div className="h-8 rounded-full overflow-hidden flex mb-4">
          {(['Positive', 'Neutral', 'Negative'] as const).map(sent => {
            const count = summary.bySentiment[sent] ?? 0;
            const pct = (count / summary.totalComments) * 100;
            if (pct === 0) return null;
            const colors = SENT_COLORS[sent];
            return (
              <div
                key={sent}
                className={`${colors.bar} flex items-center justify-center transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${sent}: ${count} (${Math.round(pct)}%)`}
              >
                {pct > 8 && (
                  <span className="text-xs font-semibold text-white">{Math.round(pct)}%</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6">
          {(['Positive', 'Neutral', 'Negative'] as const).map(sent => {
            const count = summary.bySentiment[sent] ?? 0;
            const colors = SENT_COLORS[sent];
            return (
              <div key={sent} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colors.bar}`} />
                <span className="text-xs text-slate-600">{sent}: {count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Themes */}
      {summary.topThemes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Themes</h3>
          <div className="flex flex-wrap gap-2">
            {summary.topThemes.slice(0, 20).map((t, i) => {
              const colors = CAT_COLORS[t.category] ?? CAT_COLORS.Spam;
              return (
                <span
                  key={i}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${colors.bg} ${colors.text}`}
                >
                  {t.theme} <span className="opacity-60">({t.count})</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured testimonial */}
      {sampleTestimonial && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Featured Testimonial</div>
          <p className="text-sm text-emerald-800 italic leading-relaxed">
            &ldquo;{sampleTestimonial.length > 300 ? sampleTestimonial.slice(0, 300) + '...' : sampleTestimonial}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
