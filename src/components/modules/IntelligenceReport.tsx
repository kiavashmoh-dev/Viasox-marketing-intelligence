import type { FullAnalysis } from '../../engine/types';
import { useClaudeApi } from '../../hooks/useClaudeApi';
import { buildReportPrompt } from '../../prompts/reportPrompt';
import { buildResourceContext } from '../../prompts/systemBase';
import ResultsView from '../ResultsView';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
}

export default function IntelligenceReport({ analysis, apiKey, resourceContext, onBack }: Props) {
  const { result, loading, error, generate, reset } = useClaudeApi(apiKey);

  const handleGenerate = () => {
    const { system, user } = buildReportPrompt(analysis);
    // Scale tokens: ~4K per product line + 2K for executive summary and cross-product insights
    const productCount = Object.values(analysis.products).filter(Boolean).length;
    const maxTokens = Math.min(Math.max(productCount * 4000 + 2000, 8000), 16000);
    generate(system + buildResourceContext(resourceContext), user, maxTokens);
  };

  if (result || loading || error) {
    return (
      <ResultsView
        content={result ?? ''}
        title="Intelligence Report"
        onBack={() => { reset(); onBack(); }}
        onRegenerate={handleGenerate}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          {'\u2190'} Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="text-5xl mb-4">{'\uD83D\uDCCA'}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Review Intelligence Report</h2>
          <p className="text-slate-500 mb-6">
            Generate a comprehensive report from your {analysis.totalReviews.toLocaleString()} reviews
            across {Object.values(analysis.products).filter(Boolean).length} product lines.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm text-left">
            <p className="font-medium text-slate-700 mb-2">This report includes:</p>
            <ul className="text-slate-500 space-y-1">
              <li>Executive summary with key metrics</li>
              <li>Pain points analysis with frequencies</li>
              <li>Benefits celebrated by customers</li>
              <li>Transformation signals and power quotes</li>
              <li>Customer segment identification</li>
              <li>Cross-product insights</li>
              <li>Strategic recommendations</li>
            </ul>
          </div>

          <button onClick={handleGenerate}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
