/**
 * Browser-side video frame extractor.
 *
 * Claude vision can't ingest video, so we sample N frames evenly along the
 * video timeline, render them to a Canvas, and return base64 jpegs that can
 * be sent to the vision API as image content blocks.
 *
 * We also generate a small thumbnail (320px wide) for the bank UI.
 */

export interface ExtractedFrames {
  /** N base64 jpeg data URLs */
  frames: string[];
  /** Single small thumbnail data URL (~320px wide) */
  thumbnailDataUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
}

const DEFAULT_FRAME_COUNT = 8;
const DEFAULT_MAX_WIDTH = 768;
const THUMBNAIL_WIDTH = 320;
const FRAME_QUALITY = 0.78;
const THUMB_QUALITY = 0.7;

/** Extract evenly-spaced frames + a thumbnail from a video file. */
export async function extractVideoFrames(
  file: File,
  frameCount: number = DEFAULT_FRAME_COUNT,
  maxWidth: number = DEFAULT_MAX_WIDTH
): Promise<ExtractedFrames> {
  const url = URL.createObjectURL(file);
  try {
    const video = await loadVideo(url);
    const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const targetCount = Math.max(2, Math.min(frameCount, 16));

    // Compute frame timestamps — skip the very first and very last 2% so we
    // don't capture black title cards.
    const margin = duration * 0.02;
    const start = margin;
    const end = duration - margin;
    const step = (end - start) / (targetCount - 1);
    const timestamps = Array.from({ length: targetCount }, (_, i) => start + step * i);

    // Compute scaled dimensions.
    const aspect = video.videoWidth / video.videoHeight || 16 / 9;
    const fw = Math.min(maxWidth, video.videoWidth || maxWidth);
    const fh = Math.round(fw / aspect);

    const canvas = document.createElement('canvas');
    canvas.width = fw;
    canvas.height = fh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    const frames: string[] = [];
    for (const t of timestamps) {
      await seekVideo(video, t);
      ctx.drawImage(video, 0, 0, fw, fh);
      frames.push(canvas.toDataURL('image/jpeg', FRAME_QUALITY));
    }

    // Thumbnail = downscaled middle frame.
    const thumbCanvas = document.createElement('canvas');
    const tw = THUMBNAIL_WIDTH;
    const th = Math.round(tw / aspect);
    thumbCanvas.width = tw;
    thumbCanvas.height = th;
    const tctx = thumbCanvas.getContext('2d');
    if (!tctx) throw new Error('Thumbnail canvas context unavailable');
    await seekVideo(video, duration / 2);
    tctx.drawImage(video, 0, 0, tw, th);
    const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', THUMB_QUALITY);

    return {
      frames,
      thumbnailDataUrl,
      durationSeconds: duration,
      width: video.videoWidth,
      height: video.videoHeight,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = src;
    video.onloadedmetadata = () => {
      // Some browsers don't expose videoWidth until loadeddata
      if (video.readyState >= 1) {
        video.currentTime = 0;
        resolve(video);
      }
    };
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error('Failed to load video file'));
  });
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      reject(new Error(`Seek to ${time}s failed`));
    };
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    try {
      video.currentTime = Math.max(0, Math.min(time, video.duration || time));
    } catch (e) {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      reject(e instanceof Error ? e : new Error('Seek failed'));
    }
  });
}

/** Strip the `data:image/jpeg;base64,` prefix to get raw base64 bytes. */
export function stripDataUrlPrefix(dataUrl: string): { base64: string; mediaType: string } {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error('Invalid data URL');
  return { mediaType: m[1], base64: m[2] };
}
