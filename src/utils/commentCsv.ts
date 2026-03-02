import Papa from 'papaparse';

export interface RawComment {
  date: string;
  platform: string;
  brand: string;
  adName: string;
  commenterName: string;
  comment: string;
}

export interface CommentCsvResult {
  comments: RawComment[];
  errors: string[];
  detectedColumns: Record<string, string>;
  headers: string[];
}

/** Column aliases — first match wins */
const COLUMN_MAP: Record<keyof RawComment, string[]> = {
  comment: ['comment', 'text', 'body', 'message', 'content', 'comment_text', 'comment_message'],
  date: ['date', 'created_at', 'timestamp', 'created', 'time', 'posted_at', 'created_time'],
  platform: ['platform', 'source', 'network', 'channel', 'media'],
  brand: ['brand', 'page', 'account', 'page_name', 'account_name'],
  adName: ['ad_name', 'ad', 'post', 'ad_title', 'post_name', 'ad_id', 'post_title', 'campaign'],
  commenterName: ['name', 'commenter', 'author', 'user', 'from', 'username', 'commenter_name', 'user_name'],
};

function detectColumn(headers: string[], aliases: string[]): string | null {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export function parseCommentCsv(file: File): Promise<CommentCsvResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const errors: string[] = [];
        const headers = results.meta.fields ?? [];

        const detected: Record<string, string> = {};
        for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
          const col = detectColumn(headers, aliases);
          if (col) detected[field] = col;
        }

        if (!detected.comment) {
          errors.push('Could not find a comment/text column. Expected one of: comment, text, body, message');
          resolve({ comments: [], errors, detectedColumns: detected, headers });
          return;
        }

        const comments: RawComment[] = results.data
          .map(row => ({
            comment: (row[detected.comment] ?? '').trim(),
            date: detected.date ? (row[detected.date] ?? '').trim() : '',
            platform: detected.platform ? (row[detected.platform] ?? '').trim() : '',
            brand: detected.brand ? (row[detected.brand] ?? '').trim() : '',
            adName: detected.adName ? (row[detected.adName] ?? '').trim() : '',
            commenterName: detected.commenterName ? (row[detected.commenterName] ?? '').trim() : '',
          }))
          .filter(c => c.comment.length > 0);

        if (comments.length === 0) {
          errors.push('No non-empty comments found in the CSV');
        }

        resolve({ comments, errors, detectedColumns: detected, headers });
      },
      error(err) {
        resolve({ comments: [], errors: [err.message], detectedColumns: {}, headers: [] });
      },
    });
  });
}

export function exportCommentsCsv(
  comments: Array<{
    original: RawComment;
    category: string;
    sentiment: string;
    keyTheme: string;
  }>,
): void {
  const header = ['Date', 'Platform', 'Brand', 'Ad', 'Commenter', 'Comment', 'Category', 'Sentiment', 'Theme'];
  const rows = comments.map(c => [
    c.original.date,
    c.original.platform,
    c.original.brand,
    c.original.adName,
    c.original.commenterName,
    `"${c.original.comment.replace(/"/g, '""')}"`,
    c.category,
    c.sentiment,
    c.keyTheme,
  ]);

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comment-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
