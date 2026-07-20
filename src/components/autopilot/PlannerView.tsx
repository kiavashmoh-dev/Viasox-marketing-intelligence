import { useState, useEffect, useMemo } from 'react';
import type { AutopilotTask, CreativeDirection } from '../../engine/autopilotTypes';
import type { InspirationItem } from '../../engine/inspirationTypes';
import type { AdType, AwarenessLevel } from '../../engine/types';
import { getMemoryStats } from '../../autopilot/memoryStore';
import { getAllItems } from '../../inspiration/inspirationStore';
import { mapAsanaTask, AD_TYPE_OPTIONS, AWARENESS_OPTIONS } from '../../autopilot/asanaMapper';
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
/** Compact labels for the Planner's Awareness dropdown. */
const AWARENESS_LABELS: Record<AwarenessLevel, string> = {
  'Unaware': 'Unaware',
  'Problem Aware': 'Problem Aw.',
  'Solution Aware': 'Solution Aw.',
  'Product Aware': 'Product Aw.',
  'Most Aware': 'Most Aware',
};

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
  // Batch-wide technique ban (CMO-audit feature: "ban the reframe for one
  // batch to force new structures"). Injected as a hard constraint into every
  // generation prompt and auto-flagged by the batch reviewer.
  const [banReframe, setBanReframe] = useState(false);
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
  // Per-task awareness override. Initialized from each task's heuristic-mapped
  // level (condition angles → Problem Aware, else Unaware). Changing the
  // dropdown re-maps the task so anglesParams + scriptParamsBase (including
  // the awareness-derived funnelStage) stay in sync — same pattern as adType.
  const [awarenessByIndex, setAwarenessByIndex] = useState<AwarenessLevel[]>(() =>
    tasks.map((t) => t.scriptParamsBase.awarenessLevel),
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

  const setAwareness = (taskIndex: number, level: AwarenessLevel) => {
    setAwarenessByIndex((prev) => {
      const next = [...prev];
      next[taskIndex] = level;
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
        const overrideAwareness = awarenessByIndex[i];
        if (
          overrideAdType === task.scriptParamsBase.adType &&
          overrideAwareness === task.scriptParamsBase.awarenessLevel
        ) {
          // No change — return original to preserve reference equality
          return task;
        }
        return mapAsanaTask({
          ...task.parsed,
          adType: overrideAdType,
          awarenessLevel: overrideAwareness,
        });
      }),
    [tasks, adTypeByIndex, awarenessByIndex],
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
    ...(banReframe && {
      bannedTechniques: [
        'The "it\'s not X, it\'s Y" reframe — any opening or beat whose move is overturning a false attribution ("it\'s not your shoes, it\'s your socks", "that isn\'t age, that\'s circulation"). Use a different structural engine this batch: confession arc, skeptic journey, contrast/split, day-in-the-life, demonstration, testimonial.',
      ],
    }),
  };

  const pinnedCount = Object.keys(pinnedInspirations).length;
  const nonEcomCount = remappedTasks.reduce((acc, task, i) => {
    if (!included[i]) return acc;
    return task.scriptParamsBase.adType !== 'Ecom Style' ? acc + 1 : acc;
  }, 0);

  // Portfolio-composition summary: counts by awareness level over INCLUDED
  // tasks. A batch that runs one level end-to-end is a legitimate choice,
  // but it should be a choice — a 100%-Unaware batch never speaks the
  // brand's name, so we surface the composition rather than silently
  // defaulting into it.
  const awarenessComposition = remappedTasks.reduce<Record<string, number>>((acc, task, i) => {
    if (!included[i]) return acc;
    const lv = task.scriptParamsBase.awarenessLevel;
    acc[lv] = (acc[lv] ?? 0) + 1;
    return acc;
  }, {});
  const adTypeComposition = remappedTasks.reduce<Record<string, number>>((acc, task, i) => {
    if (!included[i]) return acc;
    const at = AD_TYPE_LABELS[task.scriptParamsBase.adType] ?? task.scriptParamsBase.adType;
    acc[at] = (acc[at] ?? 0) + 1;
    return acc;
  }, {});
  const includedCount = included.filter(Boolean).length;
  // Warn when one level dominates (≥70%) or the whole batch is brand-withholding
  // TOF (Unaware + Problem Aware both hide the brand until late).
  const awarenessEntries = Object.entries(awarenessComposition).sort((a, b) => b[1] - a[1]);
  const dominant = awarenessEntries[0];
  const tofOnly =
    includedCount >= 4 &&
    awarenessEntries.every(([lv]) => lv === 'Unaware' || lv === 'Problem Aware');
  const dominantWarning =
    includedCount >= 4 && dominant && dominant[1] / includedCount >= 0.7 ? dominant[0] : null;
  // Deterministic near-duplicate detection: same angle + product would brief
  // the same ad twice — a past 44-script backlog shipped 4 identical gas-price
  // ads because nothing surfaced this at planning time.
  const duplicateGroups = (() => {
    const groups: Record<string, string[]> = {};
    remappedTasks.forEach((task, i) => {
      if (!included[i]) return;
      const key = `${task.parsed.angle.trim().toLowerCase()}|${task.product}`;
      (groups[key] ??= []).push(task.parsed.name);
    });
    return Object.entries(groups)
      .filter(([, names]) => names.length >= 2)
      .map(([key, names]) => ({ label: key.split('|')[0], names }));
  })();

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
                <th className="py-2 px-2 text-slate-600 font-semibold">Awareness</th>
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
                    <select
                      value={awarenessByIndex[i]}
                      onChange={(e) => setAwareness(i, e.target.value as AwarenessLevel)}
                      disabled={!included[i]}
                      className={`text-xs border rounded px-2 py-1 bg-white max-w-[120px] focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        awarenessByIndex[i] === tasks[i].scriptParamsBase.awarenessLevel
                          ? 'border-slate-200 text-slate-700'
                          : 'border-amber-300 text-amber-800 bg-amber-50 font-medium'
                      }`}
                      title={`${awarenessByIndex[i]} — funnel: ${task.scriptParamsBase.funnelStage}`}
                    >
                      {AWARENESS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {AWARENESS_LABELS[opt]}
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
        {includedCount > 0 && (
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <div>
              Awareness mix:{' '}
              {awarenessEntries.map(([lv, n]) => `${n}× ${lv}`).join(' · ')}
              {'  ·  '}Format mix:{' '}
              {Object.entries(adTypeComposition)
                .map(([at, n]) => `${n}× ${at}`)
                .join(' · ')}
            </div>
            {(dominantWarning || tofOnly) && (
              <div className="text-amber-700">
                {dominantWarning && (
                  <>⚠ {awarenessComposition[dominantWarning]} of {includedCount} tasks run {dominantWarning}. </>
                )}
                {tofOnly && (
                  <>This batch is 100% TOF (Unaware/Problem Aware) — every ad withholds the brand until its final beats, and nothing serves warm or retargeting audiences. </>
                )}
                A concentrated batch is a valid choice — but make it a choice: the Awareness dropdown per task changes this.
              </div>
            )}
            {duplicateGroups.length > 0 && (
              <div className="text-amber-700">
                ⚠ Near-duplicate tasks (same angle + product):{' '}
                {duplicateGroups
                  .map((g) => `"${g.label}" ×${g.names.length} (${g.names.join(', ')})`)
                  .join(' · ')}
                {' '}— these will brief essentially the same ad. Differentiate them in the strategy session or drop extras.
              </div>
            )}
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
        <label className="flex items-start gap-2 mt-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={banReframe}
            onChange={(e) => setBanReframe(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-slate-600">
            <strong>Ban the &ldquo;it&rsquo;s not X, it&rsquo;s Y&rdquo; reframe for this batch.</strong>{' '}
            Hard-bans the reframe opening in every concept and script this round and tells the reviewer
            to flag any brief that sneaks it in — forces new structures when the technique is worn out.
          </span>
        </label>
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
          className="px-5 py-2.5 bg-navy text-cream rounded-lg font-medium hover:bg-navy-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Run Batch ({selectedTasks.length} brief{selectedTasks.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}
