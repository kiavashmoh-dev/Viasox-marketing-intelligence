import { useState, useRef } from 'react';

interface UploadedFile {
  name: string;
  size: number;
  type: 'csv' | 'other';
  file: File;
}

interface Props {
  onFiles: (csvFiles: File[], resourceFiles: File[]) => void;
  error: string | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CsvUploader({ onFiles, error }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      // Skip duplicates
      if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'other',
        file,
      });
    }
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleSubmit = () => {
    const csvFiles = files.filter((f) => f.type === 'csv').map((f) => f.file);
    const resourceFiles = files.filter((f) => f.type === 'other').map((f) => f.file);
    onFiles(csvFiles, resourceFiles);
  };

  const csvCount = files.filter((f) => f.type === 'csv').length;
  const otherCount = files.filter((f) => f.type === 'other').length;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Upload Resources</h1>
          <p className="text-slate-500 mt-2">
            Drop your review CSVs and any other relevant files
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-4xl mb-3">{'\uD83D\uDCC1'}</div>
          <p className="text-slate-600 font-medium">Drop files here</p>
          <p className="text-slate-400 text-sm mt-1">CSVs, docs, text files - anything relevant</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.md,.json,.xlsx,.pdf,.doc,.docx"
          multiple
          onChange={handleChange}
          className="hidden"
        />

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {files.length} file{files.length !== 1 ? 's' : ''} added
              {csvCount > 0 && ` \u00B7 ${csvCount} CSV${csvCount !== 1 ? 's' : ''}`}
              {otherCount > 0 && ` \u00B7 ${otherCount} resource${otherCount !== 1 ? 's' : ''}`}
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">
                      {f.type === 'csv' ? '\uD83D\uDCCA' : '\uD83D\uDCC4'}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{formatSize(f.size)}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="text-slate-400 hover:text-red-500 text-sm ml-2 shrink-0"
                  >
                    {'\u2715'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={csvCount === 0}
          className="w-full mt-5 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {csvCount === 0
            ? 'Add at least one CSV to continue'
            : `Analyze ${csvCount} CSV${csvCount !== 1 ? 's' : ''}${otherCount > 0 ? ` + ${otherCount} resource${otherCount !== 1 ? 's' : ''}` : ''}`}
        </button>

        <div className="mt-4 text-xs text-slate-400">
          <p className="font-medium text-slate-500 mb-1">CSV columns expected:</p>
          <p>handle, review (or body), rating, date</p>
          <p className="mt-2">Other files (txt, md, docs) will be included as context for AI generation.</p>
        </div>
      </div>
    </div>
  );
}
