import { useState } from 'react';
import type { StrategySession as StrategySessionType, StrategyQuestion } from '../../engine/autopilotTypes';

interface Props {
  session: StrategySessionType;
  onSubmitAnswers: (answers: Record<string, string>) => void;
  isSynthesizing: boolean;
}

export default function StrategySession({ session, onSubmitAnswers, isSynthesizing }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of session.questions) {
      init[q.id] = q.suggestedAnswer || '';
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
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{'\uD83E\uDDE0'}</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Strategy Session</h3>
            <p className="text-xs text-slate-500">
              Your creative strategist analyzed this week's batch and has questions before generating briefs.
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{'\uD83D\uDCCB'}</span>
            <span className="text-sm font-semibold text-slate-700">Batch Strategic Analysis</span>
          </div>
          <span className="text-xs text-slate-400">{showAnalysis ? 'Collapse' : 'Read Analysis'}</span>
        </button>
        {showAnalysis && (
          <div className="border-t border-slate-100 p-5">
            <div className="prose prose-sm max-w-none text-slate-700">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed font-sans">
                {session.batchAnalysis}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800">
            Questions from Your Strategist
          </h4>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {answeredCount}/{session.questions.length} answered
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Answer as many as you'd like — the more context you give, the smarter the briefs will be.
          Skip any that don't apply. Your answers directly shape every creative decision.
        </p>

        <div className="space-y-4">
          {session.questions.map((q: StrategyQuestion, i: number) => (
            <div key={q.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800 mb-1">
                    {q.question}
                  </div>
                  {q.context && (
                    <div className="text-[10px] text-slate-400 italic mb-2">
                      Why I'm asking: {q.context}
                    </div>
                  )}
                </div>
              </div>

              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder={q.suggestedAnswer
                  ? `Suggested: ${q.suggestedAnswer}`
                  : 'Type your answer, or leave blank to let the strategist decide...'
                }
                className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />

              {q.suggestedAnswer && !answers[q.id]?.trim() && (
                <button
                  onClick={() => setAnswers({ ...answers, [q.id]: q.suggestedAnswer! })}
                  className="mt-1.5 text-[10px] text-blue-600 hover:text-blue-800 underline"
                >
                  Use suggested answer
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          {isSynthesizing ? (
            <div className="flex items-center justify-center gap-3 py-3 text-blue-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Synthesizing strategy brief...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {answeredCount > 0
                  ? `Continue with ${answeredCount} Answer${answeredCount !== 1 ? 's' : ''} — Generate Strategy Brief`
                  : 'Skip Questions — Let Strategist Decide'}
              </button>
            </div>
          )}

          <p className="text-[10px] text-slate-400 text-center mt-2">
            The strategy brief will guide all concept generation, selection, and script writing for this batch.
          </p>
        </div>
      </div>
    </div>
  );
}
