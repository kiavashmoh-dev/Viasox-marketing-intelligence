import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { downloadAsDoc, downloadAsPdf } from '../../utils/downloadUtils';

interface Props {
  report: string;
  onRegenerate: () => void;
  regenerating: boolean;
}

export default function CommentInsights({ report, onRegenerate, regenerating }: Props) {
  const handleCopy = () => {
    navigator.clipboard.writeText(report);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comment-intelligence-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">AI Insights Report</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Copy
          </button>
          <button
            onClick={handleDownloadMd}
            className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            .md
          </button>
          <button
            onClick={() => downloadAsDoc(report, 'Comment Intelligence Report')}
            className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            .doc
          </button>
          <button
            onClick={() => downloadAsPdf(report, 'Comment Intelligence Report')}
            className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            .pdf
          </button>
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              regenerating
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Report'}
          </button>
        </div>
      </div>

      {/* Report content */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="prose prose-slate max-w-none prose-sm">
          <Markdown remarkPlugins={[remarkGfm]}>{report}</Markdown>
        </div>
      </div>
    </div>
  );
}
