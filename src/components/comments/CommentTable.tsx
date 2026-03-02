import { useState, useMemo } from 'react';
import type { CategorizedComment } from './CommentDashboard';

interface Props {
  comments: CategorizedComment[];
}

type SortKey = 'date' | 'category' | 'sentiment';
type SortDir = 'asc' | 'desc';

const CATEGORIES = ['Engagement', 'Question', 'Testimonial', 'Objection', 'Request', 'Complaint', 'Spam'] as const;
const SENTIMENTS = ['Positive', 'Neutral', 'Negative'] as const;

const CAT_BADGE: Record<string, string> = {
  Engagement: 'bg-blue-100 text-blue-700',
  Question: 'bg-amber-100 text-amber-700',
  Testimonial: 'bg-emerald-100 text-emerald-700',
  Objection: 'bg-red-100 text-red-700',
  Request: 'bg-violet-100 text-violet-700',
  Complaint: 'bg-rose-100 text-rose-700',
  Spam: 'bg-slate-100 text-slate-500',
};

const SENT_BADGE: Record<string, string> = {
  Positive: 'bg-emerald-100 text-emerald-700',
  Neutral: 'bg-slate-100 text-slate-600',
  Negative: 'bg-red-100 text-red-700',
};

export default function CommentTable({ comments }: Props) {
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [sentFilter, setSentFilter] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const toggleCat = (cat: string) => {
    setCatFilter(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const toggleSent = (sent: string) => {
    setSentFilter(prev => {
      const next = new Set(prev);
      if (next.has(sent)) next.delete(sent); else next.add(sent);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = comments;
    if (catFilter.size > 0) {
      result = result.filter(c => catFilter.has(c.category));
    }
    if (sentFilter.size > 0) {
      result = result.filter(c => sentFilter.has(c.sentiment));
    }
    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date': cmp = a.original.date.localeCompare(b.original.date); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
        case 'sentiment': cmp = a.sentiment.localeCompare(b.sentiment); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [comments, catFilter, sentFilter, sortKey, sortDir]);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '\u2195';
    return sortDir === 'asc' ? '\u2191' : '\u2193';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <div>
          <span className="text-xs text-slate-500 font-medium mr-2">Filter by category:</span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            {CATEGORIES.map(cat => {
              const active = catFilter.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                    active
                      ? `${CAT_BADGE[cat]} ring-2 ring-offset-1 ring-current`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
            {catFilter.size > 0 && (
              <button onClick={() => setCatFilter(new Set())} className="text-xs text-slate-400 hover:text-slate-600 ml-1">
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-500 font-medium mr-2">Filter by sentiment:</span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            {SENTIMENTS.map(sent => {
              const active = sentFilter.has(sent);
              return (
                <button
                  key={sent}
                  onClick={() => toggleSent(sent)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                    active
                      ? `${SENT_BADGE[sent]} ring-2 ring-offset-1 ring-current`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {sent}
                </button>
              );
            })}
            {sentFilter.size > 0 && (
              <button onClick={() => setSentFilter(new Set())} className="text-xs text-slate-400 hover:text-slate-600 ml-1">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="text-xs text-slate-500">
        Showing {filtered.length} of {comments.length} comments
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2.5 text-left text-slate-600 font-semibold w-8">#</th>
              <th
                className="px-3 py-2.5 text-left text-slate-600 font-semibold cursor-pointer hover:text-slate-800 whitespace-nowrap"
                onClick={() => handleSort('date')}
              >
                Date {sortIcon('date')}
              </th>
              {comments.some(c => c.original.platform) && (
                <th className="px-3 py-2.5 text-left text-slate-600 font-semibold">Platform</th>
              )}
              {comments.some(c => c.original.brand) && (
                <th className="px-3 py-2.5 text-left text-slate-600 font-semibold">Brand</th>
              )}
              {comments.some(c => c.original.adName) && (
                <th className="px-3 py-2.5 text-left text-slate-600 font-semibold">Ad</th>
              )}
              {comments.some(c => c.original.commenterName) && (
                <th className="px-3 py-2.5 text-left text-slate-600 font-semibold">Name</th>
              )}
              <th className="px-3 py-2.5 text-left text-slate-600 font-semibold min-w-[200px]">Comment</th>
              <th
                className="px-3 py-2.5 text-left text-slate-600 font-semibold cursor-pointer hover:text-slate-800 whitespace-nowrap"
                onClick={() => handleSort('category')}
              >
                Category {sortIcon('category')}
              </th>
              <th
                className="px-3 py-2.5 text-left text-slate-600 font-semibold cursor-pointer hover:text-slate-800 whitespace-nowrap"
                onClick={() => handleSort('sentiment')}
              >
                Sentiment {sortIcon('sentiment')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((c, i) => {
              const isExpanded = expandedRow === i;
              return (
                <tr
                  key={i}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedRow(isExpanded ? null : i)}
                >
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{c.original.date || '-'}</td>
                  {comments.some(x => x.original.platform) && (
                    <td className="px-3 py-2 text-slate-600">{c.original.platform || '-'}</td>
                  )}
                  {comments.some(x => x.original.brand) && (
                    <td className="px-3 py-2 text-slate-600">{c.original.brand || '-'}</td>
                  )}
                  {comments.some(x => x.original.adName) && (
                    <td className="px-3 py-2 text-slate-600 max-w-[120px] truncate">{c.original.adName || '-'}</td>
                  )}
                  {comments.some(x => x.original.commenterName) && (
                    <td className="px-3 py-2 text-slate-600">{c.original.commenterName || '-'}</td>
                  )}
                  <td className="px-3 py-2 text-slate-800">
                    {isExpanded
                      ? c.original.comment
                      : c.original.comment.length > 80
                        ? c.original.comment.slice(0, 80) + '...'
                        : c.original.comment
                    }
                    {!isExpanded && c.original.comment.length > 80 && (
                      <span className="text-blue-500 ml-1 text-[10px]">more</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${CAT_BADGE[c.category] ?? ''}`}>
                      {c.category}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${SENT_BADGE[c.sentiment] ?? ''}`}>
                      {c.sentiment}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 200 && (
          <div className="text-center py-3 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
            Showing first 200 of {filtered.length} results. Use filters to narrow down.
          </div>
        )}
      </div>
    </div>
  );
}
