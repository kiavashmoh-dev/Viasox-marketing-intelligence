import { useState } from 'react';
import type { StrategySession as StrategySessionType, StrategyQuestion } from '../../engine/autopilotTypes';

interface Props {
  session: StrategySessionType;
  onSubmitAnswers: (answers: Record<string, string>) => void;
  isSynthesizing: boolean;
}

// ─── Markdown-like renderer for the analysis ─────────────────────────────────

function AnalysisRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={key++} className="space-y-1.5 mb-4 ml-1">
        {listBuffer.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
            <span className="text-blue-400 mt-1 shrink-0">{'\u2022'}</span>
            <span dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  const inlineMd = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
     .replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={key++} className="text-sm font-bold text-slate-800 mt-5 mb-2 uppercase tracking-wide">
          {trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '')}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-base font-bold text-slate-900 mt-6 mb-2 pb-1 border-b border-slate-200">
          {trimmed.replace(/^##\s*/, '').replace(/\*\*/g, '')}
        </h3>
      );
      continue;
    }

    // Bullet points
    if (/^[-*]\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }

    // Numbered lists
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^\d+[\.\)]\s+/, ''));
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={key++} className="text-sm text-slate-700 leading-relaxed mb-3"
         dangerouslySetInnerHTML={{ __html: inlineMd(trimmed) }}
      />
    );
  }

  flushList();
  return <div>{elements}</div>;
}

// ─── Question with Multiple Choice ───────────────────────────────────────────

function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: StrategyQuestion;
  index: number;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const hasOptions = question.options && question.options.length > 0;
  const selectedOption = hasOptions ? question.options.findIndex((o) => o === answer) : -1;

  const handleOptionClick = (option: string) => {
    setShowCustom(false);
    onAnswer(option);
  };

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onAnswer(customText.trim());
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-sm font-bold text-white bg-blue-600 w-7 h-7 rounded-full flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="flex-1">
          <div className="text-base font-semibold text-slate-800 leading-snug mb-1">
            {question.question}
          </div>
          {question.context && (
            <div className="text-xs text-slate-400 italic">
              {question.context}
            </div>
          )}
        </div>
      </div>

      {/* Multiple choice options */}
      {hasOptions && (
        <div className="space-y-2 mb-3">
          {question.options.map((option, oi) => {
            const isSelected = selectedOption === oi;
            const isRecommended = question.recommendedOption === oi;

            return (
              <button
                key={oi}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm leading-relaxed ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <span className="text-white text-[10px] font-bold">{'\u2713'}</span>
                    )}
                  </span>
                  <div className="flex-1">
                    <span>{option}</span>
                    {isRecommended && (
                      <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Custom answer toggle */}
          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="w-full text-left px-4 py-3 rounded-lg border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all text-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                  <span className="text-slate-400 text-xs">+</span>
                </span>
                <span>Other — type my own answer</span>
              </div>
            </button>
          ) : (
            <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50/50">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your custom answer..."
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customText.trim()}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium"
                >
                  Use This Answer
                </button>
                <button
                  onClick={() => { setShowCustom(false); setCustomText(''); }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback: plain textarea if no options */}
      {!hasOptions && (
        <textarea
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
        />
      )}

      {/* Selected answer indicator */}
      {answer && !showCustom && selectedOption === -1 && hasOptions && (
        <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
          <span className="font-semibold">Custom answer:</span> {answer}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StrategySession({ session, onSubmitAnswers, isSynthesizing }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of session.questions) {
      // Pre-select recommended option if available
      if (q.options && q.options.length > 0 && q.recommendedOption !== undefined) {
        init[q.id] = q.options[q.recommendedOption] || '';
      } else {
        init[q.id] = '';
      }
    }
    return init;
  });

  const [showAnalysis, setShowAnalysis] = useState(true);

  const handleSubmit = () => {
    onSubmitAnswers(answers);
  };

  const answeredCount = Object.values(answers).filter((a) => a.trim()).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{'\uD83E\uDDE0'}</span>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Strategy Session</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Your creative strategist analyzed this week's batch and has a few questions before generating briefs.
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{'\uD83D\uDCCB'}</span>
            <span className="text-base font-semibold text-slate-800">Batch Strategic Analysis</span>
          </div>
          <span className="text-xs text-blue-600 font-medium">{showAnalysis ? 'Collapse' : 'Read Analysis'}</span>
        </button>
        {showAnalysis && (
          <div className="border-t border-slate-100 px-6 py-5">
            <AnalysisRenderer text={session.batchAnalysis} />
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-base font-bold text-slate-800">
            Questions from Your Strategist
          </h4>
          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
            {answeredCount}/{session.questions.length} answered
          </span>
        </div>

        <p className="text-sm text-slate-500 px-1">
          Select an answer for each question. Your choices directly shape every creative decision in this batch.
        </p>

        {session.questions.map((q: StrategyQuestion, i: number) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            answer={answers[q.id] || ''}
            onAnswer={(value) => setAnswers({ ...answers, [q.id]: value })}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {isSynthesizing ? (
          <div className="flex items-center justify-center gap-3 py-3 text-blue-600">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Synthesizing strategy brief...</span>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            className="w-full py-3.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            {answeredCount > 0
              ? `Continue with ${answeredCount} Answer${answeredCount !== 1 ? 's' : ''} — Generate Strategy Brief`
              : 'Skip Questions — Let Strategist Decide'}
          </button>
        )}

        <p className="text-xs text-slate-400 text-center mt-2">
          The strategy brief will guide all concept generation, selection, and script writing for this batch.
        </p>
      </div>
    </div>
  );
}
