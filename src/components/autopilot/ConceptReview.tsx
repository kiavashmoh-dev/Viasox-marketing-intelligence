import { useState } from 'react';
import type { TaskPipelineState, ConceptOption } from '../../engine/autopilotTypes';

interface Props {
  tasks: TaskPipelineState[];
  onApprove: (selections: Array<{ taskIndex: number; conceptIndex: number; feedback?: string }>) => void;
  onRegenerateConcepts: (taskIndex: number, feedback: string) => void;
  isRegenerating: number | null;
}

function ConceptCard({
  concept,
  isSelected,
  onSelect,
}: {
  concept: ConceptOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left border rounded-lg p-3 transition-all ${
        isSelected
          ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            #{concept.index}
          </span>
          <span className="text-xs font-semibold text-slate-800">{concept.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={`text-[10px] ${star <= concept.strengthRating ? 'text-amber-400' : 'text-slate-200'}`}>
              {'\u2605'}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-slate-600 mb-1.5 leading-relaxed">{concept.summary}</p>

      <div className="flex items-center gap-2 text-[10px]">
        <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
          {concept.recommendedFramework.split(' ')[0]}
        </span>
        {isSelected && (
          <span className="text-blue-600 font-medium">{'\u2713'} Selected</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-slate-400 hover:text-slate-600 underline ml-auto"
        >
          {expanded ? 'Less' : 'Full concept'}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-slate-600 font-sans max-h-48 overflow-auto">
            {concept.fullText}
          </pre>
        </div>
      )}

      {concept.reasoning && (
        <div className="mt-1.5 text-[10px] text-blue-700 italic">
          {concept.reasoning}
        </div>
      )}
    </button>
  );
}

function TaskConceptReview({
  taskState,
  taskIndex,
  selectedConcept,
  onSelectConcept,
  onRegenerateConcepts,
  isRegenerating,
}: {
  taskState: TaskPipelineState;
  taskIndex: number;
  selectedConcept: number | null;
  onSelectConcept: (conceptIndex: number) => void;
  onRegenerateConcepts: (taskIndex: number, feedback: string) => void;
  isRegenerating: boolean;
}) {
  const [showRegen, setShowRegen] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');
  const { task, conceptOptions } = taskState;

  if (!conceptOptions || conceptOptions.length === 0) return null;

  // Sort by strength rating (AI recommendation)
  const sorted = [...conceptOptions].sort((a, b) => b.strengthRating - a.strengthRating);
  const aiTopPick = sorted[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-slate-800">{task.parsed.name}</div>
          <div className="text-xs text-slate-500">
            {task.product} / {task.parsed.angle} / {task.duration}
          </div>
        </div>
        {selectedConcept !== null && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            Concept #{selectedConcept} selected
          </span>
        )}
      </div>

      {/* AI Recommendation */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
        <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
          Strategist's Top Pick: Concept #{aiTopPick.index}
        </div>
        <p className="text-xs text-blue-800">{aiTopPick.reasoning}</p>
      </div>

      {/* Concept Options */}
      <div className="space-y-2 mb-3">
        {sorted.map((concept) => (
          <ConceptCard
            key={concept.index}
            concept={concept}
            isSelected={selectedConcept === concept.index}
            onSelect={() => onSelectConcept(concept.index)}
          />
        ))}
      </div>

      {/* Regenerate option */}
      {!isRegenerating && (
        <div className="border-t border-slate-100 pt-3">
          {showRegen ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-amber-800 mb-1">
                What's missing? What direction should the new concepts take?
              </div>
              <textarea
                value={regenFeedback}
                onChange={(e) => setRegenFeedback(e.target.value)}
                placeholder="e.g., 'None of these feel urgent enough. I want something that hits the reader with a real problem in the first 3 seconds. Try a more aggressive, fear-based approach for this neuropathy angle.'"
                className="w-full border border-amber-300 rounded-lg p-2 text-xs text-slate-700 resize-none bg-white"
                rows={3}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => { onRegenerateConcepts(taskIndex, regenFeedback); setShowRegen(false); setRegenFeedback(''); }}
                  disabled={!regenFeedback.trim()}
                  className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-40"
                >
                  Regenerate Concepts
                </button>
                <button
                  onClick={() => setShowRegen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRegen(true)}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Not happy with these? Regenerate concepts with feedback
            </button>
          )}
        </div>
      )}

      {isRegenerating && (
        <div className="flex items-center justify-center gap-2 py-3 text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Regenerating concepts...</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ConceptReview({ tasks, onApprove, onRegenerateConcepts, isRegenerating }: Props) {
  const [selections, setSelections] = useState<Record<number, number>>(() => {
    // Pre-select AI's top picks
    const init: Record<number, number> = {};
    tasks.forEach((ts, i) => {
      if (ts.conceptOptions && ts.conceptOptions.length > 0) {
        const sorted = [...ts.conceptOptions].sort((a, b) => b.strengthRating - a.strengthRating);
        init[i] = sorted[0].index;
      }
    });
    return init;
  });

  const tasksWithConcepts = tasks.filter((ts) => ts.conceptOptions && ts.conceptOptions.length > 0);
  const allSelected = tasksWithConcepts.every((_, i) => selections[i] !== undefined);

  const handleApprove = () => {
    const result = Object.entries(selections).map(([idx, conceptIdx]) => ({
      taskIndex: parseInt(idx),
      conceptIndex: conceptIdx,
    }));
    onApprove(result);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{'\uD83C\uDFAF'}</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Concept Review</h3>
            <p className="text-xs text-slate-500">
              Review the top concepts for each brief. The strategist's picks are pre-selected, but you can change any of them or regenerate with feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Per-task concept review */}
      {tasks.map((ts, i) => (
        ts.conceptOptions && ts.conceptOptions.length > 0 ? (
          <TaskConceptReview
            key={i}
            taskState={ts}
            taskIndex={i}
            selectedConcept={selections[i] ?? null}
            onSelectConcept={(conceptIndex) => setSelections({ ...selections, [i]: conceptIndex })}
            onRegenerateConcepts={onRegenerateConcepts}
            isRegenerating={isRegenerating === i}
          />
        ) : null
      ))}

      {/* Approve & Continue */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <button
          onClick={handleApprove}
          disabled={!allSelected || isRegenerating !== null}
          className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {allSelected
            ? `Approve ${tasksWithConcepts.length} Concepts — Generate Briefs`
            : `Select concepts for all ${tasksWithConcepts.length} briefs to continue`}
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Once approved, the script writer will generate full briefs using your selected concepts and the strategy brief.
        </p>
      </div>
    </div>
  );
}
