import { useState, useEffect, useMemo } from 'react';
import type { AutopilotTask, CreativeDirection } from '../../engine/autopilotTypes';
import type { InspirationItem } from '../../engine/inspirationTypes';
import type { AdType } from '../../engine/types';
import { getMemoryStats } from '../../autopilot/memoryStore';
import { getAllItems } from '../../inspiration/inspirationStore';
import { mapAsanaTask, AD_TYPE_OPTIONS } from '../../autopilot/asanaMapper';
import MemoryPanel from './MemoryPanel';

interface Props {
  tasks: AutopilotTask[];
  onConfirm: (tasks: AutopilotTask[], direction: CreativeDirection) => void;
  onCancel: () => void;
}

/**
 * Short, human-friendly label for each AdType — used only in the Planner
 * dropdown so the column stays compact. The canonical enum value is
 * preserved under the hood.
 */
const AD_TYPE_LABELS: Record<AdType, string> = {
  'Ecom Style': 'Ecom Style',
  'AGC (Actor Generated Content)': 'AGC',
  'UGC (User Generated Content)': 'UGC',
  'Static': 'Static',
  'Founder Style': 'Founder',
  'Fake Podcast Ads': 'Filmed Podcast',
  'AI Podcast': 'AI Podcast',
  'Spokesperson': 'Spokesperson',
  'Packaging/Employee': 'Packaging/Emp.',
  'Full AI (Documentary, story, education, etc)': 'Full AI',
};

export default function PlannerView({ tasks, onConfirm, onCancel }: Props) {
  const [included, setIncluded] = useState<boolean[]>(tasks.map(() => true));
  const [instructions, setInstructions] = useState('');
  const [showMemory, setShowMemory] = useState(false);
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [pinnedByIndex, setPinnedByIndex] = useState<Record<number, string>>({});
  // Per-task ad type override. Initialized from each task's existing mapped
  // adType (which may have come from the screenshot extraction or the
  // heuristic fallback). Changing the dropdown re-maps that task so
  // anglesParams + scriptParamsBase (including Full AI specification/visual
  // style) all stay in sync with the selected ad type.
  const [adTypeByIndex, setAdTypeByIndex] = useState<AdType[]>(() =>
    tasks.map((t) => t.scriptParamsBase.adType),
  );
  const memStats = getMemoryStats();

  // Load inspiration bank items on mount so we can offer them as pin options
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await getAllItems();
        if (cancelled) return;
        const ready = items
          .filter((it) => it.status === 'ready')
          .sort((a, b) => (a.title || a.filename).localeCompare(b.title || b.filename));
        setInspirationItems(ready);
      } catch (e) {
        console.warn('[planner] failed to load inspiration items', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (i: number) => {
    setIncluded((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const setPin = (taskIndex: number, itemId: string) => {
    setPinnedByIndex((prev) => {
      const next = { ...prev };
      if (itemId === '') {
        delete next[taskIndex];
      } else {
        next[taskIndex] = itemId;
      }
      return next;
    });
  };

  const setAdType = (taskIndex: number, adType: AdType) => {
    setAdTypeByIndex((prev) => {
      const next = [...prev];
      next[taskIndex] = adType;
      return next;
    });
  };

  /**
   * The tasks we actually pass to the pipeline. Each task is re-mapped
   * via `mapAsanaTask` with the user-selected ad type injected into
   * `parsed.adType` — this guarantees anglesParams.adType,
   * scriptParamsBase.adType, fullAiSpecification, and fullAiVisualStyle
   * all stay consistent with the dropdown selection.
   */
  const remappedTasks = useMemo(
    () =>
      tasks.map((task, i) => {
        const overrideAdType = adTypeByIndex[i];
        if (overrideAdType === task.scriptParamsBase.adType) {
          // No change — return original to preserve reference equality
          return task;
        }
        return mapAsanaTask({
          ...task.parsed,
          adType: overrideAdType,
        });
      }),
    [tasks, adTypeByIndex],
  );

  const selectedTasks = remappedTasks.filter((_, i) => included[i]);

  // Build the pinnedInspirations map keyed by task name (matching pipelineEngine lookup)
  const pinnedInspirations: Record<string, string> = {};
  remappedTasks.forEach((task, i) => {
    if (included[i] && pinnedByIndex[i]) {
      pinnedInspirations[task.parsed.name] = pinnedByIndex[i];
    }
  });

  const direction: CreativeDirection = {
    instructions: instructions.trim(),
    pinnedInspirations,
  };

  const pinnedCount = Object.keys(pinnedInspirations).length;
  const nonEcomCount = remappedTasks.reduce((acc, task, i) => {
    if (!included[i]) return acc;
    return task.scriptParamsBase.adType !== 'Ecom Style' ? acc + 1 : acc;
  }, 0);

  return (
    <div className="space-y-5">
      {/* Task Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Task Queue</h3>
        <p className="text-sm text-slate-500 mb-4">
          Parsed {tasks.length} tasks from your Asana screenshot. Uncheck any you want to skip.
          Ad Type defaults to <strong>Ecom Style</strong> for every brief unless you change it here — pick{' '}
          <strong>Full AI</strong> or any other style to reroute that task to a different creative format.
          Optionally pin a specific Inspiration Bank ad to follow for any task.
        </p>

        <div className="overflow-x-auto mb-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2 px-2 w-8"></th>
                <th className="py-2 px-2 text-slate-600 font-semibold">Task</th>
                <th className="py-2 px-2 text-slate-600 font-semibold">Product</th>
                <th className="py-2 px-2 text-slate-600 font-semibold">Angle</th>
                <th className="py-2 px-2 text-slate-600 font-semibold">Medium</th>
                <th className="py-2 px-2 text-slate-600 font-semibold">Duration</th>
                <th className="py-2 px-2 text-slate-600 font-semibold">Ad Type</th>
                <th className="py-2 px-2 text-slate-600 font-semibold">Pinned Inspiration (optional)</th>
              </tr>
            </thead>
            <tbody>
              {remappedTasks.map((task, i) => (
                <tr
                  key={i}
                  className={`border-b border-slate-100 ${!included[i] ? 'opacity-40' : ''}`}
                >
                  <td className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={included[i]}
                      onChange={() => toggle(i)}
                      className="rounded"
                    />
                  </td>
                  <td className="py-2 px-2 font-medium text-slate-800">{task.parsed.name}</td>
                  <td className="py-2 px-2 text-slate-600">{task.product}</td>
                  <td className="py-2 px-2">
                    <span className="inline-block bg-rose-100 text-rose-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {task.parsed.angle}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-slate-600">{task.parsed.medium}</td>
                  <td className="py-2 px-2 text-slate-600">{task.duration}</td>
                  <td className="py-2 px-2">
                    <select
                      value={adTypeByIndex[i]}
                      onChange={(e) => setAdType(i, e.target.value as AdType)}
                      disabled={!included[i]}
                      className={`text-xs border rounded px-2 py-1 bg-white max-w-[150px] focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        adTypeByIndex[i] === 'Ecom Style'
                          ? 'border-slate-200 text-slate-700'
                          : 'border-indigo-300 text-indigo-700 bg-indigo-50 font-medium'
                      }`}
                      title={adTypeByIndex[i]}
                    >
                      {AD_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {AD_TYPE_LABELS[opt]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    {inspirationItems.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">Bank empty</span>
                    ) : (
                      <select
                        value={pinnedByIndex[i] ?? ''}
                        onChange={(e) => setPin(i, e.target.value)}
                        disabled={!included[i]}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 max-w-[220px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">— None (use general bank) —</option>
                        {inspirationItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.starred ? '⭐ ' : ''}{item.title || item.filename}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {nonEcomCount > 0 && (
          <div className="mt-3 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-3 py-2">
            <strong>{nonEcomCount}</strong> task{nonEcomCount !== 1 ? 's have' : ' has'} a non-Ecom ad type selected. Concepts and scripts for those tasks will follow the rules of their selected ad type (e.g., Full AI ads use cinematic voiceover-driven scripts) while still being delivered in the standard Ecom brief template for consistency.
          </div>
        )}
        {pinnedCount > 0 && (
          <div className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-3 py-2">
            <strong>{pinnedCount}</strong> task{pinnedCount !== 1 ? 's have' : ' has'} a pinned inspiration. The full frames, tags, summary, learnings, and script of {pinnedCount !== 1 ? 'each pin' : 'that pin'} will guide concept and script generation for those tasks specifically.
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Instructions</h3>
        <p className="text-sm text-slate-500 mb-4">
          Give specific instructions for this batch. These will directly guide how concepts are generated, selected, and scripted across all tasks.
        </p>

        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g., Focus more on the emotional relief angle this week. Avoid opening with questions — use statements instead. For the long-form ads, lean into storytelling with a slow build. Make sure neuropathy briefs mention tingling and numbness specifically, not just general pain."
          className="w-full h-32 px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Leave empty for default behavior. Your instructions override default agent decision-making.
        </p>
      </div>

      {/* Memory Status */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={`w-2 h-2 rounded-full ${memStats.totalBatches > 0 ? 'bg-emerald-400' : 'bg-slate-300'}`} />
          <span>
            Creative Memory: {memStats.totalBatches > 0
              ? `${memStats.totalBatches} batch${memStats.totalBatches !== 1 ? 'es' : ''} / ${memStats.totalBriefs} briefs stored`
              : 'No history yet — first batch will start the memory bank'}
          </span>
        </div>
        <button
          onClick={() => setShowMemory(true)}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Manage Memory
        </button>
      </div>

      {showMemory && <MemoryPanel onClose={() => setShowMemory(false)} />}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(selectedTasks, direction)}
          disabled={selectedTasks.length === 0}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Run Batch ({selectedTasks.length} brief{selectedTasks.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}
