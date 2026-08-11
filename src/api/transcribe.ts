/**
 * Typed client for the Viasox Transcribe Proxy Worker.
 *
 * Two-stage strategy, because browsers disagree about containers:
 *   1. Decode the audio in-browser to 16kHz mono WAV and send that — small
 *      (~1.8MB/min vs a 20MB source), and the Worker does no media work.
 *   2. If the browser cannot decode the container (Safari + .mov), send the
 *      ORIGINAL file bytes and let Whisper's own decoder try. Unverified
 *      against every container, so it is a fallback, not the happy path —
 *      when it also fails the user gets the real reason, not a generic error.
 *
 * The Worker holds no API key (Workers AI is a native binding), so there is
 * no credential in this path at all.
 */

import { extractAudioWav, blobToBase64, AudioExtractionError } from '../inspiration/audioExtractor';

const TRANSCRIBE_URL = 'https://viasox-transcribe-proxy.kiavashmoh.workers.dev/transcribe';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptResult {
  text: string;
  /** WebVTT with timings, when the model returns it. */
  vtt: string;
  segments: TranscriptSegment[];
  wordCount: number | null;
  /** True when the clip exceeded the local duration cap and was cut. */
  truncated: boolean;
  /** Which path produced this — useful when debugging odd transcripts. */
  via: 'browser-audio' | 'original-file';
}

async function postAudio(base64: string, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      // text/plain, not JSON: the Worker reads this with request.text() to
      // stay inside Cloudflare's per-request CPU budget on multi-MB bodies.
      headers: { 'Content-Type': 'text/plain' },
      body: base64,
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw new Error('Transcription was cancelled.');
    throw new Error(
      `Could not reach the transcription service (${err instanceof Error ? err.message : String(err)}). ` +
        'If this is the first run, the Worker may not be deployed yet: cd transcribe-proxy && npx wrangler deploy',
    );
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      detail = body.error ?? '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    if (res.status === 403) {
      throw new Error(
        'The transcription service rejected this origin. Add this site to APP_ORIGIN_ALLOWLIST on the transcribe-proxy Worker.',
      );
    }
    throw new Error(`Transcription failed (HTTP ${res.status})${detail ? `: ${detail}` : ''}`);
  }

  return (await res.json()) as Omit<TranscriptResult, 'truncated' | 'via'>;
}

/**
 * Transcribe a video/audio file. Throws with a human-readable reason.
 */
export async function transcribeMedia(file: Blob, signal?: AbortSignal): Promise<TranscriptResult> {
  try {
    const { wav, truncated } = await extractAudioWav(file);
    const result = await postAudio(await blobToBase64(wav), signal);
    return { ...result, truncated, via: 'browser-audio' };
  } catch (err) {
    const canFallBack = err instanceof AudioExtractionError && err.canRetryServerSide;
    if (!canFallBack) throw err;

    // Container the browser can't open — hand the raw file to Whisper.
    console.warn('[transcribe] browser audio decode failed, retrying with the original file', err);
    try {
      const result = await postAudio(await blobToBase64(file), signal);
      return { ...result, truncated: false, via: 'original-file' };
    } catch (fallbackErr) {
      throw new Error(
        `${(err as AudioExtractionError).message} Sending the original file also failed: ` +
          `${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
      );
    }
  }
}
