import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { downloadAsDoc, downloadAsPdf } from '../utils/downloadUtils';
import FeedbackPanel from './ui/FeedbackPanel';

interface Props {
  content: string;
  title: string;
  onBack: () => void;
  onRegenerate: (feedback?: string) => void;
  loading?: boolean;
  error?: string | null;
  onWriteScript?: (conceptContent: string) => void;
  onBackToBuilder?: () => void;
  /** Module-specific placeholder for the feedback textarea */
  feedbackPlaceholder?: string;
}

/** Parse the generated markdown into individual concept blocks using "## Concept N:" headers */
function parseConceptBlocks(content: string): { full: string; title: string }[] {
  const blocks: { full: string; title: string }[] = [];
  // Split on "## Concept" headers — the prompt forces "## Concept 1:", "## Concept 2:", etc.
  const parts = content.split(/(?=^## Concept \d)/m);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || !trimmed.startsWith('## Concept')) continue;
    // Extract the title from the first line
    const firstLine = trimmed.split('\n')[0] ?? '';
    const titleMatch = firstLine.match(/^## Concept \d+:\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : firstLine.replace(/^##\s*/, '').trim();
    blocks.push({ full: trimmed, title });
  }
  return blocks;
}

export default function AnglesResultsView({
  content,
  title,
  onBack,
  onRegenerate,
  loading,
  error,
  onWriteScript,
  onBackToBuilder,
  feedbackPlaceholder,
}: Props) {
  const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
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
          <h2 className="text-xl font-bold text-slate-800 mb-2">Generating...</h2>
          <p className="text-slate-500">Claude is working on your {title.toLowerCase()}</p>
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
              <button onClick={onBackToBuilder} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                Edit Selections
              </button>
            )}
            <button onClick={onBack} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Dashboard
            </button>
            <button onClick={() => onRegenerate()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const concepts = parseConceptBlocks(content);
  // Any preamble content before the first concept header
  const preambleEnd = content.indexOf('## Concept');
  const preamble = preambleEnd > 0 ? content.slice(0, preambleEnd).trim() : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onBackToBuilder && (
              <>
                <button onClick={onBackToBuilder} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                  {'\u2190'} Edit Selections
                </button>
                <span className="text-slate-300">|</span>
              </>
            )}
            <button onClick={onBack} className={`text-sm ${onBackToBuilder ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-700 flex items-center gap-1'}`}>
              {onBackToBuilder ? 'Dashboard' : '\u2190 Back to Dashboard'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={handleCopy} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Copy All
            </button>
            <button onClick={handleDownload} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              .md
            </button>
            <button onClick={() => downloadAsDoc(content, title)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              .doc
            </button>
            <button onClick={() => downloadAsPdf(content, title)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
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

        {/* Instructions */}
        {onWriteScript && concepts.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4 text-sm text-emerald-800">
            {'\u2728'} Click <strong>"Write Script"</strong> on any concept below to send it to the Ad Script Writer.
          </div>
        )}

        {/* Preamble (if any text before concepts) */}
        {preamble && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-4">
            <div className="prose prose-slate max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{preamble}</Markdown>
            </div>
          </div>
        )}

        {/* Concept Cards */}
        {concepts.length > 0 ? (
          <div className="space-y-4">
            {concepts.map((concept, index) => {
              const isSelected = selectedConcept === index;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-sm border transition-all ${
                    isSelected ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'
                  }`}
                >
                  {/* Concept Header Bar */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-slate-800">{concept.title}</h3>
                    </div>
                    {onWriteScript && (
                      <button
                        onClick={() => {
                          setSelectedConcept(index);
                          onWriteScript(concept.full);
                        }}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {isSelected ? '\u2713 Selected — Writing Script...' : '\u270F\uFE0F Write Script'}
                      </button>
                    )}
                  </div>
                  {/* Concept Content */}
                  <div className="px-6 py-5">
                    <div className="prose prose-slate prose-sm max-w-none">
                      <Markdown remarkPlugins={[remarkGfm]}>{concept.full}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback: If parsing fails, show raw content */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="prose prose-slate max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
