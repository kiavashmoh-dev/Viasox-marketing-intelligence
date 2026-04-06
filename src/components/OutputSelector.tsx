import type { FullAnalysis, ModuleId } from '../engine/types';
import { formatNumber } from '../utils/formatters';

interface Props {
  analysis: FullAnalysis;
  onSelect: (moduleId: ModuleId) => void;
  onReset: () => void;
}

type Module = { id: ModuleId; title: string; description: string; icon: string };

const creativeModules: Module[] = [
  {
    id: 'angles',
    title: 'Concepts & Angles',
    description: 'Brainstorm new angles grounded in review data',
    icon: '\uD83D\uDCA1',
  },
  {
    id: 'script',
    title: 'Ad Script Writer',
    description: 'Write full scripts using proven frameworks',
    icon: '\uD83C\uDFAC',
  },
  {
    id: 'hooks',
    title: 'Hook Generator',
    description: 'Generate hooks by awareness level and format',
    icon: '\uD83C\uDFA3',
  },
  {
    id: 'comments',
    title: 'Ad Comment Intelligence',
    description: 'Analyze ad comments \u2014 categorize, extract insights, find angles',
    icon: '\uD83D\uDCAC',
  },
  {
    id: 'autopilot',
    title: 'Autopilot Brief Generator',
    description: 'Upload Asana screenshot, auto-generate concepts, select the best, write Ecom briefs, and review quality',
    icon: '\uD83E\uDD16',
  },
  {
    id: 'inspiration',
    title: 'Inspiration Bank',
    description: 'Upload reference videos and briefs \u2014 auto-tagged and injected as style guidance into every generation',
    icon: '\uD83D\uDCDA',
  },
];

const insightModules: Module[] = [
  {
    id: 'segments',
    title: 'Customer Segments',
    description: 'See exactly who your customers are — segmented by data, enriched by AI',
    icon: '\uD83E\uDDE9',
  },
  {
    id: 'persona',
    title: 'Persona Builder',
    description: 'Generate detailed customer personas by product and channel',
    icon: '\uD83D\uDC64',
  },
  {
    id: 'product-intelligence',
    title: 'Product & Customer Intelligence',
    description: 'Revenue by product, new vs repeat customers, segment-level growth drivers, and Comfort Seeker deep-dive',
    icon: '\uD83D\uDCB0',
  },
];

export default function OutputSelector({ analysis, onSelect, onReset }: Props) {
  const { totalReviews, breakdown, products } = analysis;

  // Get top insight from the data — find first product with actual data
  const topProduct = Object.values(products).find((p): p is NonNullable<typeof p> => p != null && Object.keys(p.benefits).length > 0);
  const topBenefit = topProduct
    ? Object.entries(topProduct.benefits).sort(
        (a, b) => b[1].count - a[1].count,
      )[0]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Marketing Intelligence Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Choose an output to generate from your review data
            </p>
          </div>
          <button
            onClick={onReset}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Upload new data
          </button>
        </div>

        {/* Analysis Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Analysis Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {formatNumber(totalReviews)}
              </p>
              <p className="text-sm text-slate-500">Total Reviews</p>
            </div>
            {(['EasyStretch', 'Compression', 'Ankle Compression'] as const).map(
              (cat) => (
                <div key={cat}>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatNumber(breakdown[cat])}
                  </p>
                  <p className="text-sm text-slate-500">{cat}</p>
                </div>
              ),
            )}
            {topBenefit && (
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {topBenefit[1].percentage}%
                </p>
                <p className="text-sm text-slate-500">
                  Top: {topBenefit[0].replace(/_/g, ' ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Creatives Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent" />
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap">
              Creatives
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-blue-200 to-transparent" />
          </div>
          <p className="text-sm text-slate-500 mb-5 text-center">
            Generate ad creative — concepts, scripts, hooks, and full briefs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creativeModules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => onSelect(mod.id)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-left hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="text-3xl mb-3">{mod.icon}</div>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Insights Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent" />
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest whitespace-nowrap">
              Insights
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-emerald-200 to-transparent" />
          </div>
          <p className="text-sm text-slate-500 mb-5 text-center">
            Understand your customers — segments, personas, and product intelligence
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insightModules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => onSelect(mod.id)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-left hover:shadow-md hover:border-emerald-300 transition-all group"
              >
                <div className="text-3xl mb-3">{mod.icon}</div>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
