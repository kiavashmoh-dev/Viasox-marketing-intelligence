import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { downloadAsDoc, downloadAsPdf } from '../utils/downloadUtils';
import FeedbackPanel from './ui/FeedbackPanel';

interface ExtraAction {
  label: string;
  onClick: () => void;
}

interface Props {
  content: string;
  title: string;
  onBack: () => void;
  onRegenerate: (feedback?: string) => void;
  loading?: boolean;
  error?: string | null;
  extraActions?: ExtraAction[];
  /** Optional: go back to builder/form to edit selections without leaving the module */
  onBackToBuilder?: () => void;
  /** Module-specific placeholder for the feedback textarea */
  feedbackPlaceholder?: string;
}

export default function ResultsView({
  content,
  title,
  onBack,
  onRegenerate,
  loading,
  error,
  extraActions,
  onBackToBuilder,
  feedbackPlaceholder,
}: Props) {
  const [showFeedback, setShowFeedback] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-6 animate-pulse">{'\u2699\uFE0F'}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Generating...
          </h2>
          <p className="text-slate-500">
            Claude is working on your {title.toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-6">{'\u274C'}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {onBackToBuilder && (
              <button
                onClick={onBackToBuilder}
                className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Edit Selections
              </button>
            )}
            <button
              onClick={onBack}
              className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Dashboard
            </button>
            <button
              onClick={() => onRegenerate()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onBackToBuilder && (
              <>
                <button
                  onClick={onBackToBuilder}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  {'\u2190'} Edit Selections
                </button>
                <span className="text-slate-300">|</span>
              </>
            )}
            <button
              onClick={onBack}
              className={`text-sm ${onBackToBuilder ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-700 flex items-center gap-1'}`}
            >
              {onBackToBuilder ? 'Dashboard' : '\u2190 Back to Dashboard'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              .md
            </button>
            <button
              onClick={() => downloadAsDoc(content, title)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              .doc
            </button>
            <button
              onClick={() => downloadAsPdf(content, title)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              .pdf
            </button>
            <button
              onClick={() => setShowFeedback((v) => !v)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                showFeedback
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showFeedback ? 'Cancel Feedback' : 'Regenerate'}
            </button>
            {extraActions?.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Panel */}
        {showFeedback && (
          <FeedbackPanel
            placeholder={feedbackPlaceholder}
            onRegenerateWithFeedback={(feedback) => {
              setShowFeedback(false);
              onRegenerate(feedback);
            }}
            onRegenerateFresh={() => {
              setShowFeedback(false);
              onRegenerate();
            }}
            onCancel={() => setShowFeedback(false)}
          />
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mt-4">
          <div className="prose prose-slate max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
