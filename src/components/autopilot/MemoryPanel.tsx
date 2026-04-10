import { useState, useRef } from 'react';
import {
  getMemoryStats,
  getBatchHistory,
  getLastCuratorBriefing,
  exportMemory,
  importMemory,
  clearMemory,
  deleteBatch,
} from '../../autopilot/memoryStore';

interface Props {
  onClose: () => void;
}

export default function MemoryPanel({ onClose }: Props) {
  const [stats, setStats] = useState(() => getMemoryStats());
  const [showHistory, setShowHistory] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [batchList, setBatchList] = useState(() => getBatchHistory());
  const lastBriefing = getLastCuratorBriefing();

  const handleDeleteBatch = (batchId: string, date: string) => {
    if (!window.confirm(`Delete batch from ${date}? This removes the batch, its briefs, and any associated feedback/redo events from memory.`)) return;
    deleteBatch(batchId);
    setBatchList(getBatchHistory());
    setStats(getMemoryStats());
  };

  const handleExport = () => {
    const json = exportMemory();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viasox-creative-memory-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importMemory(reader.result as string);
      if (result.success) {
        setStats(getMemoryStats());
        setImportError('');
      } else {
        setImportError(result.error ?? 'Import failed');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure? This will permanently delete all creative memory. Export first if you want a backup.')) {
      clearMemory();
      setStats(getMemoryStats());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Creative Memory Bank</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-slate-800">{stats.totalBatches}</div>
              <div className="text-[10px] text-slate-500">Batches</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-slate-800">{stats.totalBriefs}</div>
              <div className="text-[10px] text-slate-500">Briefs</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-slate-800">{stats.totalFeedback}</div>
              <div className="text-[10px] text-slate-500">Feedback</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-slate-800">{stats.storageSizeKB}KB</div>
              <div className="text-[10px] text-slate-500">Storage</div>
            </div>
          </div>

          {stats.oldestBatch && (
            <p className="text-xs text-slate-400">
              Memory spans {stats.oldestBatch} to {stats.newestBatch}
            </p>
          )}

          {/* Last Curator Briefing */}
          {lastBriefing && (
            <div>
              <button
                onClick={() => setShowBriefing(!showBriefing)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {showBriefing ? '\u25BC' : '\u25B6'} Last Creative Intelligence Briefing
              </button>
              {showBriefing && (
                <div className="mt-2 bg-blue-50 rounded-lg p-4 text-xs text-blue-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {lastBriefing.briefingText}
                </div>
              )}
            </div>
          )}

          {/* Batch History */}
          {batchList.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
              >
                {showHistory ? '\u25BC' : '\u25B6'} Batch History ({batchList.length})
              </button>
              {showHistory && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {batchList.map((batch) => (
                    <div key={batch.batchId} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">{batch.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{batch.taskCount} tasks</span>
                          <button
                            onClick={() => handleDeleteBatch(batch.batchId, batch.date)}
                            className="text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                            title="Delete this batch from memory"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        {batch.briefs.map((b) => (
                          <div key={b.id} className="text-[10px] text-slate-600 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${b.reviewVerdict === 'APPROVED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <span className="font-medium">{b.id}</span>
                            <span>{b.angle} / {b.product}</span>
                            <span className="text-slate-400">{b.framework}</span>
                            <span className="ml-auto">{b.reviewScore}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={handleExport}
              disabled={stats.totalBatches === 0}
              className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 disabled:opacity-50"
            >
              Export Memory
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200"
            >
              Import Memory
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              onClick={handleClear}
              disabled={stats.totalBatches === 0}
              className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 disabled:opacity-50 ml-auto"
            >
              Clear Memory
            </button>
          </div>

          {importError && (
            <p className="text-xs text-red-600">Import error: {importError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
