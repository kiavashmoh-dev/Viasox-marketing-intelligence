import { sendVisionMessage } from '../api/claude';
import type { ParsedAsanaTask } from '../engine/autopilotTypes';

const EXTRACTION_SYSTEM = `You extract structured task data from Asana board screenshots. Return ONLY valid JSON — no explanation, no markdown fences, no extra text.`;

const EXTRACTION_PROMPT = `Extract all visible tasks from this Asana board screenshot. For each task row, extract these columns:

- name: The task name or VIASOX ID (e.g., "VIASOX-77" or the task title)
- product: The Product column value — must be one of: EasyStretch, Compression, Ankle Compression
- angle: The Angle column value — e.g., Neuropathy, Swelling, Diabetes, Varicose Veins
- medium: The Medium column value — must be one of: Shortform, Midform, Expanded

Return ONLY a JSON array. No markdown code fences. No explanation.
Example: [{"name":"VIASOX-77","product":"EasyStretch","angle":"Neuropathy","medium":"Shortform"}]

If a column value is not clearly visible, use your best interpretation of what's shown.`;

/**
 * Parse an Asana board screenshot into structured task data using Claude Vision.
 */
export async function parseAsanaScreenshot(
  imageBase64: string,
  mediaType: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<ParsedAsanaTask[]> {
  const result = await sendVisionMessage(
    EXTRACTION_SYSTEM,
    [
      {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: imageBase64 },
      },
      { type: 'text', text: EXTRACTION_PROMPT },
    ],
    apiKey,
    6000,
    'claude-sonnet-4-20250514',
    signal,
  );

  // Strip markdown fences if present
  const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Expected JSON array');

    return parsed.map((task: Record<string, unknown>) => ({
      name: String(task.name ?? 'Unknown'),
      product: String(task.product ?? 'EasyStretch'),
      angle: String(task.angle ?? 'Neuropathy'),
      medium: String(task.medium ?? 'Midform'),
    }));
  } catch (e) {
    throw new Error(`Failed to parse screenshot data: ${e instanceof Error ? e.message : String(e)}\n\nRaw response: ${result.slice(0, 500)}`);
  }
}

/**
 * Convert a File to base64 and media type.
 */
export function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mediaType = header.match(/data:([^;]+)/)?.[1] ?? 'image/png';
      resolve({ base64, mediaType });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
