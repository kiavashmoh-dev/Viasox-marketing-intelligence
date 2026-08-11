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

const SERVICE_URL = 'https://viasox-transcribe-proxy.kiavashmoh.workers.dev';
const TRANSCRIBE_URL = `${SERVICE_URL}/transcribe`;

/** Whisper on a long clip is slow, but nothing here may hang forever. */
const TRANSCRIBE_TIMEOUT_MS = 180_000;
/** A dead endpoint must be discovered in milliseconds, not after an upload. */
const HEALTH_TIMEOUT_MS = 8_000;
/** Don't base64 an enormous file down the server-side fallback path. */
const MAX_FALLBACK_BYTES = 25 * 1024 * 1024;

const NOT_DEPLOYED_HINT =
  'The transcription service is not reachable. It is a separate Cloudflare Worker that must be deployed once:\n\n' +
  '  cd transcribe-proxy\n  npx wrangler login\n  npx wrangler secret put APP_ORIGIN_ALLOWLIST\n  npx wrangler deploy\n\n' +
  "(If it IS deployed, this site's origin may be missing from APP_ORIGIN_ALLOWLIST.)";

/** Stages worth telling the user about — transcription is slow enough that
 *  a single unchanging "Transcribing…" reads as a freeze. */
export type TranscribeStage = 'checking' | 'extracting' | 'encoding' | 'uploading';

const STAGE_LABEL: Record<TranscribeStage, string> = {
  checking: 'Checking the transcription service…',
  extracting: 'Extracting the audio track…',
  encoding: 'Preparing the audio…',
  uploading: 'Transcribing — this can take up to a minute…',
};

export function stageLabel(stage: TranscribeStage): string {
  return STAGE_LABEL[stage];
}

/**
 * Cheap reachability probe BEFORE megabytes go over the wire. Without it, a
 * dead or unauthorised endpoint is only discovered after uploading the whole
 * payload — which is exactly what made an undeployed Worker feel like a hang
 * instead of an error.
 */
async function assertServiceReachable(signal?: AbortSignal): Promise<void> {
  try {
    const res = await fetch(SERVICE_URL, {
      method: 'GET',
      signal: signal ?? AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    if (signal?.aborted) throw new Error('Transcription was cancelled.');
    throw new Error(`${NOT_DEPLOYED_HINT}\n\n(${err instanceof Error ? err.message : String(err)})`);
  }
}

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
      signal: signal ?? AbortSignal.timeout(TRANSCRIBE_TIMEOUT_MS),
    });
  } catch (err) {
    if (signal?.aborted) throw new Error('Transcription was cancelled.');
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('Transcription timed out after 3 minutes. Try a shorter clip.');
    }
    throw new Error(
      `Could not reach the transcription service (${err instanceof Error ? err.message : String(err)}).\n\n${NOT_DEPLOYED_HINT}`,
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
export async function transcribeMedia(
  file: Blob,
  signal?: AbortSignal,
  onStage?: (stage: TranscribeStage) => void,
): Promise<TranscriptResult> {
  // Fail fast on a dead endpoint before spending time and bandwidth.
  onStage?.('checking');
  await assertServiceReachable(signal);

  try {
    onStage?.('extracting');
    const { wav, truncated } = await extractAudioWav(file);
    onStage?.('encoding');
    const base64 = await blobToBase64(wav);
    onStage?.('uploading');
    const result = await postAudio(base64, signal);
    return { ...result, truncated, via: 'browser-audio' };
  } catch (err) {
    const canFallBack = err instanceof AudioExtractionError && err.canRetryServerSide;
    if (!canFallBack) throw err;

    if (file.size > MAX_FALLBACK_BYTES) {
      throw new Error(
        `${(err as AudioExtractionError).message} The file is also too large ` +
          `(${Math.round(file.size / 1024 / 1024)}MB) to send whole — re-export it as .mp4, or open the app in Chrome.`,
      );
    }
    // Container the browser can't open — hand the raw file to Whisper.
    console.warn('[transcribe] browser audio decode failed, retrying with the original file', err);
    try {
      onStage?.('encoding');
      const base64 = await blobToBase64(file);
      onStage?.('uploading');
      const result = await postAudio(base64, signal);
      return { ...result, truncated: false, via: 'original-file' };
    } catch (fallbackErr) {
      throw new Error(
        `${(err as AudioExtractionError).message} Sending the original file also failed: ` +
          `${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
      );
    }
  }
}
