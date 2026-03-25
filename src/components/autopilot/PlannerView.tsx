import { useState } from 'react';
import type { AutopilotTask } from '../../engine/autopilotTypes';

interface Props {
  tasks: AutopilotTask[];
  onConfirm: (tasks: AutopilotTask[]) => void;
  onCancel: () => void;
}

export default function PlannerView({ tasks, onConfirm, onCancel }: Props) {
  const [included, setIncluded] = useState<boolean[]>(tasks.map(() => true));

  const toggle = (i: number) => {
    setIncluded((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const selectedTasks = tasks.filter((_, i) => included[i]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Task Queue</h3>
      <p className="text-sm text-slate-500 mb-4">
        Parsed {tasks.length} tasks from your Asana screenshot. Uncheck any you want to skip.
      </p>

      <div className="overflow-x-auto mb-5">
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
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
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
                <td className="py-2 px-2 text-slate-500 text-xs">Ecom / TOF / B2G3</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(selectedTasks)}
          disabled={selectedTasks.length === 0}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Run Batch ({selectedTasks.length} brief{selectedTasks.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}
