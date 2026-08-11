/**
 * Viasox Transcribe Proxy — speech-to-text for the Inspiration Bank.
 *
 * Deploy: cd transcribe-proxy && npx wrangler deploy
 *
 * CONTRACT
 *   POST /transcribe   body = base64 audio (text/plain), returns JSON
 *                      { text, vtt, segments[], wordCount, model }
 *   GET  /             service descriptor (no origin check — no data)
 *
 * WHY THE BODY IS text/plain BASE64, NOT JSON:
 * the browser sends ~2.4MB for a 60-second clip. `request.text()` is a
 * decode; `request.json()` on the same payload is a full parse costing
 * roughly 25-30ms of CPU — over the Workers FREE plan's 10ms limit. The
 * ugly content type buys headroom. (Paid plan allows 5 min, so this is
 * belt-and-braces.)
 *
 * SECURITY: unlike proxy/worker.js — which may use a wildcard CORS header
 * precisely BECAUSE it holds no credential — this Worker spends the
 * account's Workers AI quota, so it copies meta-proxy's origin-allowlist
 * pattern instead. Note the honest limitation: Origin is enforced by
 * browsers only, so this deters casual abuse, not a determined forged
 * request. It is a metered-but-cheap endpoint with no data behind it; if
 * abuse ever shows up, add a shared secret header.
 */

const MAX_BASE64_BYTES = 24 * 1024 * 1024; // ~18MB of audio ≈ 10 min of 16kHz mono WAV

function getAllowlist(env) {
  return (env.APP_ORIGIN_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isOriginAllowed(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  return getAllowlist(env).includes(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = getAllowlist(env).includes(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
  });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method === 'GET' && path === '/') {
      return json(
        {
          service: 'viasox-transcribe-proxy',
          endpoints: ['POST /transcribe'],
          model: env.WHISPER_MODEL || '@cf/openai/whisper-large-v3-turbo',
        },
        200,
        request,
        env,
      );
    }

    if (request.method !== 'POST' || path !== '/transcribe') {
      return json({ error: 'Not found' }, 404, request, env);
    }

    if (!isOriginAllowed(request, env)) {
      return json({ error: 'Origin not allowed' }, 403, request, env);
    }

    let audioBase64;
    try {
      audioBase64 = (await request.text()).trim();
    } catch {
      return json({ error: 'Could not read request body' }, 400, request, env);
    }

    if (!audioBase64) {
      return json({ error: 'Empty audio payload' }, 400, request, env);
    }
    if (audioBase64.length > MAX_BASE64_BYTES) {
      return json(
        {
          error: `Audio too large (${Math.round(audioBase64.length / 1024 / 1024)}MB encoded). Trim the clip and try again.`,
        },
        413,
        request,
        env,
      );
    }

    const model = env.WHISPER_MODEL || '@cf/openai/whisper-large-v3-turbo';

    try {
      const result = await env.AI.run(model, {
        audio: audioBase64,
        task: 'transcribe',
        language: 'en',
        // Ad clips carry music beds and silence, which send Whisper into
        // verbatim repetition loops. These three settings are the standard
        // mitigation: never let previous text seed the next window, drop
        // non-speech, and cut hallucinated runs over silence.
        condition_on_previous_text: false,
        vad_filter: true,
        hallucination_silence_threshold: 2,
      });

      const segments = Array.isArray(result?.segments)
        ? result.segments.map((s) => ({
            start: s.start,
            end: s.end,
            text: (s.text || '').trim(),
          }))
        : [];

      return json(
        {
          text: (result?.text || '').trim(),
          vtt: result?.vtt || '',
          segments,
          wordCount: result?.word_count ?? null,
          model,
        },
        200,
        request,
        env,
      );
    } catch (err) {
      return json(
        { error: `Transcription failed: ${err && err.message ? err.message : String(err)}` },
        502,
        request,
        env,
      );
    }
  },
};
