import { useState, useRef } from 'react';
import type { RawComment, CommentCsvResult } from '../../utils/commentCsv';
import { parseCommentCsv } from '../../utils/commentCsv';

interface Props {
  onCommentsReady: (comments: RawComment[]) => void;
  onBack: () => void;
}

const MAX_COMMENTS = 500;

export default function CommentUploader({ onCommentsReady, onBack }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [parseResult, setParseResult] = useState<CommentCsvResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseResult({ comments: [], errors: ['Please upload a CSV file'], detectedColumns: {}, headers: [] });
      return;
    }
    setParsing(true);
    const result = await parseCommentCsv(file);
    setParseResult(result);
    setParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleAnalyze = () => {
    if (!parseResult || parseResult.comments.length === 0) return;
    const comments = parseResult.comments.slice(0, MAX_COMMENTS);
    onCommentsReady(comments);
  };

  const comments = parseResult?.comments ?? [];
  const willTruncate = comments.length > MAX_COMMENTS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          {'\u2190'} Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-2">
            <div className="text-4xl mb-3">{'\uD83D\uDCAC'}</div>
            <h2 className="text-xl font-bold text-slate-800">Ad Comment Intelligence</h2>
            <p className="text-slate-500 text-sm mt-1">
              Upload a CSV of ad comments to categorize, analyze sentiment, and extract creative insights
            </p>
          </div>

          {/* Expected format hint */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 mt-4">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Expected CSV format</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              At minimum, a <span className="font-mono bg-slate-200 px-1 rounded">comment</span> column is required.
              Optionally include: <span className="font-mono bg-slate-200 px-1 rounded">date</span>,{' '}
              <span className="font-mono bg-slate-200 px-1 rounded">platform</span>,{' '}
              <span className="font-mono bg-slate-200 px-1 rounded">brand</span>,{' '}
              <span className="font-mono bg-slate-200 px-1 rounded">ad_name</span>,{' '}
              <span className="font-mono bg-slate-200 px-1 rounded">name</span> (commenter).
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Export from Meta Ads Manager, TikTok, or any spreadsheet tool.
            </p>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="text-3xl mb-2">{'\uD83D\uDCC4'}</div>
            <p className="text-slate-600 font-medium">
              {parsing ? 'Parsing...' : 'Drop your comment CSV here'}
            </p>
            <p className="text-slate-400 text-sm mt-1">or click to browse</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
            />
          </div>

          {/* Errors */}
          {parseResult && parseResult.errors.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              {parseResult.errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600">{err}</p>
              ))}
            </div>
          )}

          {/* Parse results */}
          {parseResult && comments.length > 0 && (
            <div className="mt-6 space-y-4">
              {/* Detected columns */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-emerald-700 mb-2">
                  {'\u2713'} {comments.length.toLocaleString()} comments found
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parseResult.detectedColumns).map(([field, col]) => (
                    <span key={field} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      {field}: <span className="font-mono">{col}</span>
                    </span>
                  ))}
                </div>
                {willTruncate && (
                  <p className="text-xs text-amber-600 mt-2">
                    {'\u26A0'} Only the first {MAX_COMMENTS} comments will be analyzed (you have {comments.length.toLocaleString()}).
                  </p>
                )}
              </div>

              {/* Preview table */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Preview (first 5 rows)</p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-600 font-semibold">#</th>
                        {parseResult.detectedColumns.date && <th className="px-3 py-2 text-left text-slate-600 font-semibold">Date</th>}
                        {parseResult.detectedColumns.platform && <th className="px-3 py-2 text-left text-slate-600 font-semibold">Platform</th>}
                        {parseResult.detectedColumns.brand && <th className="px-3 py-2 text-left text-slate-600 font-semibold">Brand</th>}
                        {parseResult.detectedColumns.adName && <th className="px-3 py-2 text-left text-slate-600 font-semibold">Ad</th>}
                        {parseResult.detectedColumns.commenterName && <th className="px-3 py-2 text-left text-slate-600 font-semibold">Name</th>}
                        <th className="px-3 py-2 text-left text-slate-600 font-semibold">Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.slice(0, 5).map((c, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                          {parseResult.detectedColumns.date && <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{c.date}</td>}
                          {parseResult.detectedColumns.platform && <td className="px-3 py-2 text-slate-600">{c.platform}</td>}
                          {parseResult.detectedColumns.brand && <td className="px-3 py-2 text-slate-600">{c.brand}</td>}
                          {parseResult.detectedColumns.adName && <td className="px-3 py-2 text-slate-600 max-w-[120px] truncate">{c.adName}</td>}
                          {parseResult.detectedColumns.commenterName && <td className="px-3 py-2 text-slate-600">{c.commenterName}</td>}
                          <td className="px-3 py-2 text-slate-800 max-w-[300px] truncate">{c.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Analyze {Math.min(comments.length, MAX_COMMENTS).toLocaleString()} Comments
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
