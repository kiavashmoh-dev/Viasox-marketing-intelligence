import { useState, useCallback } from 'react';
import type { FullAnalysis } from '../../engine/types';
import type { RawComment } from '../../utils/commentCsv';
import { exportCommentsCsv } from '../../utils/commentCsv';
import { useClaudeApi } from '../../hooks/useClaudeApi';
import { buildCommentCategorizationPrompt, buildCommentInsightsPrompt } from '../../prompts/commentPrompt';
import type { CategorizedCommentData } from '../../prompts/commentPrompt';
import CommentUploader from '../comments/CommentUploader';
import CommentDashboard from '../comments/CommentDashboard';
import type { CategorizedComment, CommentSummary } from '../comments/CommentDashboard';
import CommentTable from '../comments/CommentTable';
import CommentInsights from '../comments/CommentInsights';

interface Props {
  analysis: FullAnalysis;
  apiKey: string;
  resourceContext: string;
  onBack: () => void;
}

type Phase = 'upload' | 'categorizing' | 'generating-insights' | 'results';
type ResultTab = 'dashboard' | 'feed' | 'report';

function buildSummary(categorized: CategorizedComment[]): CommentSummary {
  const byCat: Record<string, number> = {};
  const bySentiment: Record<string, number> = {};
  const themeMap = new Map<string, { count: number; category: string }>();

  for (const c of categorized) {
    byCat[c.category] = (byCat[c.category] ?? 0) + 1;
    bySentiment[c.sentiment] = (bySentiment[c.sentiment] ?? 0) + 1;

    const key = c.keyTheme.toLowerCase();
    const existing = themeMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      themeMap.set(key, { count: 1, category: c.category });
    }
  }

  const topThemes = Array.from(themeMap.entries())
    .map(([theme, data]) => ({ theme, ...data }))
    .sort((a, b) => b.count - a.count);

  return {
    totalComments: categorized.length,
    byCat,
    bySentiment,
    topThemes,
  };
}

function getSamplesByCategory(categorized: CategorizedComment[]): Record<string, string[]> {
  const samples: Record<string, string[]> = {};
  for (const c of categorized) {
    if (!samples[c.category]) samples[c.category] = [];
    if (samples[c.category].length < 5) {
      samples[c.category].push(c.original.comment);
    }
  }
  return samples;
}

export default function CommentIntelligence({ apiKey, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [rawComments, setRawComments] = useState<RawComment[]>([]);
  const [categorized, setCategorized] = useState<CategorizedComment[]>([]);
  const [summary, setSummary] = useState<CommentSummary | null>(null);
  const [insightsReport, setInsightsReport] = useState('');
  const [activeTab, setActiveTab] = useState<ResultTab>('dashboard');
  const [error, setError] = useState<string | null>(null);

  const categorizationApi = useClaudeApi(apiKey);
  const insightsApi = useClaudeApi(apiKey);

  const handleCommentsReady = useCallback(async (comments: RawComment[]) => {
    setRawComments(comments);
    setPhase('categorizing');
    setError(null);

    // Phase 1: Categorization
    const { system, user } = buildCommentCategorizationPrompt(comments);
    const catResult = await categorizationApi.generate(system, user, 16000);

    if (!catResult) {
      setError(categorizationApi.error ?? 'Categorization failed');
      setPhase('upload');
      return;
    }

    // Parse the JSON response
    let parsed: CategorizedCommentData[];
    try {
      // Extract JSON from response — handle possible markdown wrapping
      let jsonStr = catResult.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const data = JSON.parse(jsonStr);
      parsed = data.results ?? data;
    } catch {
      setError('Failed to parse categorization response. Please try again.');
      setPhase('upload');
      return;
    }

    // Map parsed results to CategorizedComment objects
    const categorizedComments: CategorizedComment[] = comments.map((original, i) => {
      const match = parsed.find((p: CategorizedCommentData) => p.i === i);
      return {
        original,
        category: (match?.cat as CategorizedComment['category']) ?? 'Engagement',
        sentiment: (match?.sent as CategorizedComment['sentiment']) ?? 'Neutral',
        keyTheme: match?.theme ?? '',
      };
    });

    setCategorized(categorizedComments);
    const commentSummary = buildSummary(categorizedComments);
    setSummary(commentSummary);

    // Phase 2: Generate insights
    setPhase('generating-insights');
    const samples = getSamplesByCategory(categorizedComments);
    const insightsPrompt = buildCommentInsightsPrompt(commentSummary, samples);
    const insightsResult = await insightsApi.generate(
      insightsPrompt.system,
      insightsPrompt.user,
      8000,
    );

    if (insightsResult) {
      setInsightsReport(insightsResult);
    }

    setPhase('results');
  }, [categorizationApi, insightsApi]);

  const handleRegenerateInsights = useCallback(async () => {
    if (!summary) return;
    const samples = getSamplesByCategory(categorized);
    const { system, user } = buildCommentInsightsPrompt(summary, samples);
    const result = await insightsApi.generate(system, user, 8000);
    if (result) {
      setInsightsReport(result);
    }
  }, [summary, categorized, insightsApi]);

  const handleReset = useCallback(() => {
    setPhase('upload');
    setRawComments([]);
    setCategorized([]);
    setSummary(null);
    setInsightsReport('');
    setError(null);
    categorizationApi.reset();
    insightsApi.reset();
  }, [categorizationApi, insightsApi]);

  const handleExportCsv = useCallback(() => {
    exportCommentsCsv(categorized);
  }, [categorized]);

  // Upload phase
  if (phase === 'upload') {
    return (
      <>
        <CommentUploader onCommentsReady={handleCommentsReady} onBack={onBack} />
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg text-sm max-w-md text-center">
            {error}
          </div>
        )}
      </>
    );
  }

  // Processing phases
  if (phase === 'categorizing' || phase === 'generating-insights') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-6 animate-pulse">
            {phase === 'categorizing' ? '\uD83D\uDD0D' : '\uD83E\uDDE0'}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {phase === 'categorizing' ? 'Categorizing Comments...' : 'Generating Insights...'}
          </h2>
          <p className="text-slate-500 text-sm">
            {phase === 'categorizing'
              ? `Claude is analyzing ${rawComments.length} comments — assigning categories, sentiment, and themes`
              : 'Claude is generating your insights report with actionable recommendations'
            }
          </p>
          <div className="mt-6">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: phase === 'categorizing' ? '40%' : '80%' }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {phase === 'categorizing' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Results phase
  const TABS: { id: ResultTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '\uD83D\uDCCA' },
    { id: 'feed', label: 'Comment Feed', icon: '\uD83D\uDCDD' },
    { id: 'report', label: 'Report', icon: '\uD83D\uDCCB' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              {'\u2190'} New Analysis
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onBack}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              Dashboard
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Title bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg shrink-0">
              {'\uD83D\uDCAC'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Ad Comment Intelligence</h1>
              <p className="text-sm text-slate-500">
                {summary?.totalComments} comments analyzed
                {' \u2022 '}
                {summary ? Math.round(((summary.bySentiment['Positive'] ?? 0) / summary.totalComments) * 100) : 0}% positive
                {' \u2022 '}
                {Object.keys(summary?.byCat ?? {}).length} categories
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-1.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'dashboard' && summary && (
          <CommentDashboard comments={categorized} summary={summary} />
        )}

        {activeTab === 'feed' && (
          <CommentTable comments={categorized} />
        )}

        {activeTab === 'report' && (
          insightsReport ? (
            <CommentInsights
              report={insightsReport}
              onRegenerate={handleRegenerateInsights}
              regenerating={insightsApi.loading}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-500">No insights report generated yet.</p>
              <button
                onClick={handleRegenerateInsights}
                disabled={insightsApi.loading}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Generate Report
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
