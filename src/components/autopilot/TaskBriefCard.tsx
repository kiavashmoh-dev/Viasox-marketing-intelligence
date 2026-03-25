import { useState } from 'react';
import type { TaskPipelineState } from '../../engine/autopilotTypes';
import { downloadEcomBriefDoc } from '../../utils/downloadUtils';

interface Props {
  taskState: TaskPipelineState;
  index: number;
}

export default function TaskBriefCard({ taskState, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { task, step, selectedConceptIndex, selectionReasoning, recommendedFramework, scriptResult, error } = taskState;

  const isComplete = step === 'complete' && scriptResult;
  const isFailed = step === 'error';

  return (
    <div className={`border rounded-xl overflow-hidden ${
      isFailed ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 w-6">#{index + 1}</span>
          <div>
            <div className="text-sm font-semibold text-slate-800">{task.parsed.name}</div>
            <div className="text-xs text-slate-500">
              {task.product} / {task.parsed.angle} / {task.duration}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isComplete && selectedConceptIndex && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Concept {selectedConceptIndex} | {recommendedFramework?.split(' ')[0]}
            </span>
          )}
          {isComplete && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Complete
            </span>
          )}
          {isFailed && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              Failed
            </span>
          )}
          <span className="text-slate-400 text-xs">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 p-4">
          {/* Selection reasoning */}
          {selectionReasoning && (
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
                Why This Concept Was Selected
              </div>
              <p className="text-xs text-blue-800">{selectionReasoning}</p>
            </div>
          )}

          {/* Brief content */}
          {isComplete && scriptResult && (
            <>
              <div className="prose prose-sm max-w-none text-slate-700 overflow-auto max-h-[600px] mb-3">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed font-sans">
                  {scriptResult}
                </pre>
              </div>
              <button
                onClick={() => downloadEcomBriefDoc(scriptResult, task.parsed.name)}
                className="text-xs bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
              >
                Export .doc
              </button>
            </>
          )}

          {/* Error */}
          {isFailed && error && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-3">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
