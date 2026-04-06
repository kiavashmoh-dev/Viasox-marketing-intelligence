/**
 * Plain-text extractor for brief/script uploads.
 *
 * Supports:
 *   - .txt / .md           — read directly
 *   - .docx                — mammoth (lazy-loaded)
 *   - .pdf                 — pdfjs-dist (lazy-loaded)
 *
 * Heavy parsers are dynamically imported so they don't bloat the main bundle
 * for users who never open the Inspiration Bank.
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith('.txt') || name.endsWith('.md') || type.startsWith('text/')) {
    return file.text();
  }

  if (name.endsWith('.docx')) {
    return extractDocx(file);
  }

  if (name.endsWith('.pdf') || type === 'application/pdf') {
    return extractPdf(file);
  }

  // Last-ditch: try as text
  try {
    return await file.text();
  } catch {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
}

async function extractDocx(file: File): Promise<string> {
  // @ts-expect-error — mammoth has no shipped types in this project
  const mammoth = await import('mammoth/mammoth.browser.js');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result?.value ?? '').trim();
}

async function extractPdf(file: File): Promise<string> {
  // pdfjs-dist legacy build is most compatible with Vite + browser ESM
  const pdfjs = await import('pdfjs-dist');
  // Worker: use the bundled worker via Vite's ?url import
  const workerSrcUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrcUrl;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const text = await page.getTextContent();
    const pageStr = text.items
      .map((it) => ('str' in it ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageStr) pageTexts.push(pageStr);
  }
  return pageTexts.join('\n\n');
}
