import { useState, useRef, useCallback } from 'react';
import type { AutopilotTask, CreativeDirection, ReferenceMedia } from '../../engine/autopilotTypes';
import { fileToBase64 } from '../../autopilot/screenshotParser';

interface Props {
  tasks: AutopilotTask[];
  onConfirm: (tasks: AutopilotTask[], direction: CreativeDirection) => void;
  onCancel: () => void;
}

export default function PlannerView({ tasks, onConfirm, onCancel }: Props) {
  const [included, setIncluded] = useState<boolean[]>(tasks.map(() => true));
  const [instructions, setInstructions] = useState('');
  const [referenceMedia, setReferenceMedia] = useState<ReferenceMedia[]>([]);
  const [useReferences, setUseReferences] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const toggle = (i: number) => {
    setIncluded((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const handleMediaUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: ReferenceMedia[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { base64, mediaType } = await fileToBase64(file);
        newMedia.push({ base64, mediaType, fileName: file.name });
      } catch {
        // Skip files that fail to read
      }
    }

    setReferenceMedia((prev) => [...prev, ...newMedia]);
    // Reset input so the same file can be re-uploaded
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  }, []);

  const removeMedia = (index: number) => {
    setReferenceMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedTasks = tasks.filter((_, i) => included[i]);

  const direction: CreativeDirection = {
    instructions: instructions.trim(),
    referenceMedia: useReferences ? referenceMedia : [],
  };

  return (
    <div className="space-y-5">
      {/* Task Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Task Queue</h3>
        <p className="text-sm text-slate-500 mb-4">
          Parsed {tasks.length} tasks from your Asana screenshot. Uncheck any you want to skip.
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
      </div>

      {/* Creative Direction */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Creative Direction</h3>
        <p className="text-sm text-slate-500 mb-4">
          Give specific instructions for this batch. These will directly guide how concepts are generated, selected, and scripted.
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

        {/* Reference Media Toggle */}
        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Style References</h4>
              <p className="text-xs text-slate-500">Upload example ads (images or video screenshots) to guide the creative style.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseReferences(false)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  !useReferences ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                N/A
              </button>
              <button
                onClick={() => setUseReferences(true)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  useReferences ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Add References
              </button>
            </div>
          </div>

          {useReferences && (
            <div className="space-y-3">
              {/* Uploaded media grid */}
              {referenceMedia.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {referenceMedia.map((media, i) => (
                    <div key={i} className="relative group">
                      {media.mediaType.startsWith('image/') ? (
                        <img
                          src={`data:${media.mediaType};base64,${media.base64}`}
                          alt={media.fileName}
                          className="w-24 h-24 object-cover rounded-lg border border-slate-200"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center">
                          <span className="text-lg">{'\uD83C\uDFAC'}</span>
                          <span className="text-[9px] text-slate-500 mt-1 px-1 truncate w-full text-center">{media.fileName}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <div>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  + Upload images or video screenshots
                </button>
                <p className="text-[10px] text-slate-400 mt-1">
                  These references will be analyzed by the concept and script agents to match the style, pacing, and visual approach.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
