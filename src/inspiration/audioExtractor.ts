/**
 * Inspiration Bank — audio extraction for transcription.
 *
 * Pulls the audio track out of an uploaded video ENTIRELY IN THE BROWSER,
 * with no ffmpeg.wasm and no new dependency: an AudioContext constructed
 * at 16kHz decodes just the audio stream of an MP4/WebM/M4A and resamples
 * it in the same pass (measured: 60-150ms for a 60-second 1080p clip).
 * 16kHz mono is exactly what Whisper wants, so nothing else is needed.
 *
 * SAFARI LIMITATION (verified, reproducible): Safari's decodeAudioData
 * throws EncodingError on ANY QuickTime .mov container — every brand, both
 * H.264 and HEVC — while the identical stream inside .mp4 decodes fine.
 * Chrome handles .mov without complaint. iPhone footage is frequently
 * .MOV, so this is a real path, not a corner case: it surfaces as a typed
 * AudioExtractionError with `canRetryServerSide`, and the caller falls
 * back to shipping the original container to the Worker (see transcribe.ts).
 */

/** Whisper's native rate — resampling here means the server never has to. */
const TARGET_SAMPLE_RATE = 16000;

/** Hard cap so a mistakenly-uploaded long video can't build a 100MB body. */
const MAX_AUDIO_SECONDS = 600;

export class AudioExtractionError extends Error {
  /** True when the browser couldn't decode the container but the bytes may
   *  still be transcribable server-side. */
  readonly canRetryServerSide: boolean;

  constructor(message: string, canRetryServerSide: boolean) {
    super(message);
    this.name = 'AudioExtractionError';
    this.canRetryServerSide = canRetryServerSide;
  }
}

export interface ExtractedAudio {
  /** 16kHz mono 16-bit PCM WAV. */
  wav: Blob;
  durationSeconds: number;
  /** True when the source was longer than MAX_AUDIO_SECONDS and was cut. */
  truncated: boolean;
}

/** Interleave-free mono downmix: average all channels sample by sample. */
function toMono(buffer: AudioBuffer): Float32Array {
  const { numberOfChannels, length } = buffer;
  if (numberOfChannels === 1) return buffer.getChannelData(0).slice();
  const out = new Float32Array(length);
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) out[i] += data[i];
  }
  for (let i = 0; i < length; i++) out[i] /= numberOfChannels;
  return out;
}

/** Float32 [-1,1] → 16-bit PCM WAV (44-byte canonical header). */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM subchunk size
  view.setUint16(20, 1, true); // format = PCM
  view.setUint16(22, 1, true); // channels = mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (mono, 16-bit)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Decode a video/audio file to 16kHz mono WAV.
 * @throws AudioExtractionError — check `canRetryServerSide`.
 */
export async function extractAudioWav(file: Blob): Promise<ExtractedAudio> {
  const AudioCtor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) {
    throw new AudioExtractionError('This browser has no Web Audio support — transcription is unavailable.', false);
  }

  const bytes = await file.arrayBuffer();
  // Constructing the context AT the target rate makes decodeAudioData
  // resample for us — one pass instead of a second OfflineAudioContext.
  const ctx = new AudioCtor({ sampleRate: TARGET_SAMPLE_RATE });
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(bytes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new AudioExtractionError(
      `This browser could not read the audio track (${msg || 'decode failed'}). Safari cannot open .mov files — Chrome can.`,
      true,
    );
  } finally {
    void ctx.close().catch(() => undefined);
  }

  if (decoded.length === 0) {
    throw new AudioExtractionError('This video has no audio track to transcribe.', false);
  }

  let mono = toMono(decoded);
  const fullSeconds = decoded.length / decoded.sampleRate;
  const truncated = fullSeconds > MAX_AUDIO_SECONDS;
  if (truncated) {
    mono = mono.slice(0, Math.floor(MAX_AUDIO_SECONDS * decoded.sampleRate));
  }

  return {
    wav: encodeWav(mono, decoded.sampleRate),
    durationSeconds: truncated ? MAX_AUDIO_SECONDS : fullSeconds,
    truncated,
  };
}

/**
 * Base64 without blowing the call stack OR freezing the tab.
 *
 * Two hazards, both real at our payload sizes:
 *  - String.fromCharCode(...bigArray) throws RangeError, so walk in chunks.
 *  - The whole walk is synchronous. On the server-side fallback path the
 *    input is an entire video file (tens of MB), and a straight loop pins
 *    the main thread long enough to look like a hang. So yield to the event
 *    loop every ~2MB — the UI keeps painting and stays cancellable.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
    if (parts.length % 64 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  return btoa(parts.join(''));
}
