import { sendVisionMessage } from '../api/claude';
import type { ParsedAsanaTask } from '../engine/autopilotTypes';

const EXTRACTION_SYSTEM = `You extract structured task data from Asana board screenshots. Return ONLY valid JSON — no explanation, no markdown fences, no extra text.`;

const EXTRACTION_PROMPT = `Extract all visible tasks from this Asana board screenshot. For each task row, extract these columns:

- name: The task name EXACTLY as shown — preserve every character, including hyphens, underscores, casing, and any product suffix. The current naming convention is "SOX-{number}_{PRODUCT}" (e.g., "SOX-374_ES", "SOX-368_COMP", "SOX-371_ACS") — return that string verbatim, do NOT shorten it, normalize it, lowercase it, or strip the suffix. Older boards may still use "VIASOX-77" style — accept those too and return them as-is. The downloaded brief filename is built from this exact string, so any change here breaks the file name the user sees.
- product: The Product column value. The board now uses ABBREVIATIONS — translate them as you extract:
    "ACS"  → "Ankle Compression"
    "COMP" → "Compression"
    "ES"   → "EasyStretch"
    Older boards may still spell out the full names ("Ankle Compression Socks", "Compression", "EasyStretch") — accept those too. Always RETURN the canonical full name ("EasyStretch", "Compression", or "Ankle Compression"), never the abbreviation.
- angle: The Angle column value — e.g., Neuropathy, Swelling, Diabetes, Varicose Veins
- medium: The Medium column value — must be one of: Shortform, Midform, Expanded
- adType: (OPTIONAL) The Ad Type column value IF visible. Recognized values include:
    "Ecom Style", "AGC", "UGC", "Static", "Founder Style", "Fake Podcast", "Spokesperson",
    "Packaging", "Employee", "Full AI", "Documentary", "Fully AI", "AI".
    If the board does not have an Ad Type column, or the value is not visible for a row,
    OMIT this field entirely (or set it to an empty string). Do NOT guess — only include
    an adType value when it is explicitly written in the screenshot.

Return ONLY a JSON array. No markdown code fences. No explanation.
Example with abbreviation: [{"name":"VIASOX-77","product":"EasyStretch","angle":"Neuropathy","medium":"Shortform","adType":"Ecom Style"}] (input was "ES")
Example: [{"name":"VIASOX-78","product":"Compression","angle":"Swelling","medium":"Midform"}] (input was "COMP")
Example: [{"name":"VIASOX-79","product":"Ankle Compression","angle":"Plantar Fasciitis","medium":"Shortform"}] (input was "ACS")

If a standard column value (name/product/angle/medium) is not clearly visible, use your best interpretation of what's shown.`;

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

    return parsed.map((task: Record<string, unknown>) => {
      const rawAdType = task.adType;
      const adType =
        typeof rawAdType === 'string' && rawAdType.trim().length > 0
          ? rawAdType.trim()
          : undefined;
      return {
        name: String(task.name ?? 'Unknown'),
        product: String(task.product ?? 'EasyStretch'),
        angle: String(task.angle ?? 'Neuropathy'),
        medium: String(task.medium ?? 'Midform'),
        ...(adType ? { adType } : {}),
      };
    });
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
