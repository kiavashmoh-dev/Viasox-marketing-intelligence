import type { ClaudeResponse } from '../engine/types';
import { FABLE_FALLBACK_MODEL } from '../config/models';

// ─── The universal Fable gate ───────────────────────────────────────────────
// Fable 5 is the PRIMARY model for every thinking/writing seat (director
// ruling, Aug 2026). This gate lives at the API layer so V1 and V2, text and
// vision, all share ONE fallback behavior:
//   - A genuine model-access failure on Fable (key not enabled) trips a
//     STICKY session gate: subsequent Fable calls silently run on the
//     fallback with no wasted roundtrip, and the UI can surface the state
//     via fableFallbackActive() — the fallback is never silent.
//   - Exhausted transient retries (429/529 after the full backoff ladder)
//     on a Fable call get ONE last-resort attempt on the fallback,
//     NON-sticky — the next call tries Fable again.
const FABLE_MODEL = 'claude-fable-5';
let fableGated = false;

/** True when Fable 5 failed a model-access check this session and calls are
 *  running on the fallback. Surfaced in the Factory UI. */
export function fableFallbackActive(): boolean {
  return fableGated;
}

/** A model-access failure (key not enabled for the model) — NOT a transient,
 *  NOT auth, NOT a bad request. 404 on /messages means the model itself. */
function isModelAccessFailure(status: number, errText: string): boolean {
  if (status === 404) return true;
  if (status === 403 && /model|permission/i.test(errText)) return true;
  return /not_found_error|model.*not.*(found|available)|no such model/i.test(errText);
}

const PROXY_URL = 'https://viasox-claude-proxy.workers.dev';
const DIRECT_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Compute timeout based on model and max_tokens.
 * Opus with large outputs can take 5-8+ minutes; Sonnet is faster.
 * Scale: base 3 min + 30s per 1K tokens for Opus, base 2 min + 15s per 1K tokens for Sonnet.
 */
function computeTimeout(model: string, _maxTokens: number): number {
  // Opus and Fable (the thinking tier) with massive system prompts can be
  // very slow under load — a large-budget Fable generation can legitimately
  // run past 15 minutes, and cutting it off just burns the whole wait.
  // (Fable on the 15-minute tier was half of the "Final Review never
  // finishes" spiral, Aug 2026.)
  const isSlow = model.includes('opus') || model.includes('fable');
  if (isSlow) {
    return 1_800_000; // 30 minutes
  }
  // Sonnet: fixed 15 minutes
  return 900_000;
}


/**
 * Extract the response's text block, or throw a message that names WHY there
 * wasn't one.
 *
 * A response can legitimately contain no text block: the model can spend its
 * entire output budget on reasoning and hit max_tokens before emitting a
 * single visible token. That failure is DETERMINISTIC for a given prompt —
 * retrying the identical call reproduces it forever. The Aug 2026 batch hit
 * exactly this: two tasks failed "No text in response" through ~10 manual
 * retries while other tasks recovered on the first retry. The old message
 * gave the caller nothing to act on; this one distinguishes an exhausted
 * budget (fixable by raising it) from any other empty-content case.
 */
function extractTextBlock(data: ClaudeResponse, maxTokens: number): { text: string; truncated: boolean } {
  const textBlock = data.content.find((c) => c.type === 'text');
  const stopReason = (data as unknown as Record<string, unknown>).stop_reason;
  if (textBlock) return { text: textBlock.text, truncated: stopReason === 'max_tokens' };

  const kinds =
    data.content.map((c) => (c as { type?: string }).type ?? 'unknown').join(', ') || 'none';
  if (stopReason === 'max_tokens') {
    throw new Error(
      `TOKEN_BUDGET_EXHAUSTED: the model used its entire ${maxTokens}-token output budget before writing any text ` +
        `(blocks returned: ${kinds}). Retrying identically will fail the same way — this call needs a larger budget.`,
    );
  }
  throw new Error(
    `No text in response (stop_reason: ${String(stopReason ?? 'unknown')}, blocks returned: ${kinds}).`,
  );
}

export async function sendMessage(
  system: string,
  userMessage: string,
  apiKey: string,
  maxTokens = 12000,
  model = 'claude-sonnet-4-6',
  signal?: AbortSignal,
): Promise<string> {
  // Sticky gate: once Fable is known-unavailable this session, swap silently
  // (no wasted roundtrip). fableFallbackActive() keeps it visible in the UI.
  if (model === FABLE_MODEL && fableGated) model = FABLE_FALLBACK_MODEL;
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });

  const timeoutMs = computeTimeout(model, maxTokens);

  // Track whether cancellation came from timeout vs caller
  let timedOut = false;

  // Combine caller signal with timeout signal
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  // If caller provides an abort signal, forward it to our controller
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }
  const effectiveSignal = controller.signal;
  const cleanup = () => clearTimeout(timeoutId);

  const abortError = () =>
    new Error(
      timedOut
        ? `API request timed out after ${Math.round(timeoutMs / 60000)} minutes. The API may be slow — please try again.`
        : 'Request was cancelled.',
    );

  /**
   * One send attempt: proxy first, direct API if the proxy is unreachable.
   *
   * This is a FUNCTION rather than inline code because the 429/529 retry
   * loop below must use the identical path. It previously retried through
   * the proxy only — so with the proxy Worker undeployed (which it has been
   * since launch; the app runs entirely on this direct fallback) every retry
   * threw instantly, hit `catch { break; }`, and the caller was told
   * "Rate limited after 8 retries" after making ZERO retries.
   */
  const sendOnce = async (): Promise<Response> => {
    try {
      return await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body,
        signal: effectiveSignal,
      });
    } catch {
      // If caller aborted or timed out, don't fall through to a doomed retry
      if (effectiveSignal.aborted) throw abortError();
      // Proxy unreachable - try direct API (works if CORS isn't blocking)
      return await fetch(DIRECT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body,
        signal: effectiveSignal,
      });
    }
  };

  let response: Response;
  try {
    response = await sendOnce();
  } catch (err) {
    cleanup();
    if (effectiveSignal.aborted) throw abortError();
    if (err instanceof Error && err.name === 'AbortError') throw abortError();
    throw new Error(
      'Unable to reach the Claude API. Please check your internet connection and try again.',
    );
  }

  cleanup();

  // Retry logic for 429 (rate limited) and 529 (overloaded) — up to 8 retries with exponential backoff
  if (response.status === 429 || response.status === 529) {
    const MAX_RETRIES = 8;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (effectiveSignal.aborted) {
        throw new Error(timedOut
          ? `API request timed out after ${Math.round(timeoutMs / 60000)} minutes. The API may be slow — please try again.`
          : 'Request was cancelled.');
      }
      // Exponential backoff: 15s, 30s, 60s, 120s, 180s, 180s, 180s, 180s + jitter
      const delayMs = Math.min(15000 * Math.pow(2, attempt - 1), 180_000) + Math.random() * 5000;
      console.log(`API ${response.status} — retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, delayMs));
      if (effectiveSignal.aborted) {
        throw new Error(timedOut
          ? `API request timed out after ${Math.round(timeoutMs / 60000)} minutes. The API may be slow — please try again.`
          : 'Request was cancelled.');
      }

      try {
        response = await sendOnce();
        if (response.ok || (response.status !== 429 && response.status !== 529)) break;
      } catch {
        // Network died entirely (both proxy and direct) — further retries
        // would only burn the backoff clock.
        if (effectiveSignal.aborted) throw abortError();
        break;
      }
    }
  }

  if (!response.ok) {
    const errText = await response.text();
    if (model === FABLE_MODEL) {
      if (isModelAccessFailure(response.status, errText)) {
        // The key is not enabled for Fable — gate it for the session and
        // finish THIS call on the fallback so nothing fails.
        fableGated = true;
        console.warn(`[claude] ${FABLE_MODEL} unavailable on this API key (${response.status}) — falling back to ${FABLE_FALLBACK_MODEL} for this session. Enable Fable 5 on the key to restore the primary model.`);
        return sendMessage(system, userMessage, apiKey, maxTokens, FABLE_FALLBACK_MODEL, signal);
      }
      if (response.status === 429 || response.status === 529) {
        // Extreme-reason fallback: Fable stayed congested through the whole
        // backoff ladder. One rescue attempt on the fallback, NON-sticky —
        // the next call tries Fable first again.
        console.warn(`[claude] ${FABLE_MODEL} still ${response.status} after all retries — one-off rescue on ${FABLE_FALLBACK_MODEL} (non-sticky).`);
        return sendMessage(system, userMessage, apiKey, maxTokens, FABLE_FALLBACK_MODEL, signal);
      }
    }
    if (response.status === 429) {
      throw new Error('Rate limited after 8 retries. The API is congested — please wait a few minutes and try again.');
    }
    if (response.status === 529) {
      throw new Error('API overloaded after 8 retries. Anthropic servers are at capacity — please wait a few minutes and try again.');
    }
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your Anthropic API key.');
    }
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  const data: unknown = await response.json();

  // Validate response shape before casting
  if (
    !data ||
    typeof data !== 'object' ||
    !('content' in data) ||
    !Array.isArray((data as ClaudeResponse).content)
  ) {
    throw new Error('Unexpected API response format. Please try again.');
  }

  const typedData = data as ClaudeResponse;
  const { text, truncated } = extractTextBlock(typedData, maxTokens);
  if (truncated) {
    return text + '\n\n---\n\n> **Note:** This output was truncated because it reached the token limit. Try regenerating or reducing the scope of your request.';
  }

  return text;
}

/* ------------------------------------------------------------------ */
/*  Vision API (for screenshot parsing)                                */
/* ------------------------------------------------------------------ */

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

/**
 * Send a message with mixed content (text + images) to Claude.
 * Used for screenshot parsing via vision.
 */
export async function sendVisionMessage(
  system: string,
  content: ContentBlock[],
  apiKey: string,
  maxTokens = 12000,
  model = 'claude-sonnet-4-6',
  signal?: AbortSignal,
): Promise<string> {
  // The universal Fable gate applies to vision too (V1 sends vision on the
  // ideation tier): sticky swap when gated, access-failure fallback below.
  if (model === FABLE_MODEL && fableGated) model = FABLE_FALLBACK_MODEL;
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
  });

  const timeoutMs = computeTimeout(model, maxTokens);
  let timedOut = false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const effectiveSignal = controller.signal;
  const cleanup = () => clearTimeout(timeoutId);

  let response: Response;
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body,
      signal: effectiveSignal,
    });
  } catch {
    if (effectiveSignal.aborted) {
      cleanup();
      throw new Error(timedOut
        ? `Vision API request timed out after ${Math.round(timeoutMs / 60000)} minutes.`
        : 'Request was cancelled.');
    }
    try {
      response = await fetch(DIRECT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body,
        signal: effectiveSignal,
      });
    } catch {
      cleanup();
      if (effectiveSignal.aborted) {
        throw new Error(timedOut
          ? `Vision API request timed out after ${Math.round(timeoutMs / 60000)} minutes.`
          : 'Request was cancelled.');
      }
      throw new Error('Unable to reach the Claude API.');
    }
  }

  cleanup();

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
    if (response.status === 401) throw new Error('Invalid API key.');
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('content' in data) || !Array.isArray((data as ClaudeResponse).content)) {
    throw new Error('Unexpected API response format.');
  }
  const typedData = data as ClaudeResponse;
  return extractTextBlock(typedData, maxTokens).text;
}

/* ------------------------------------------------------------------ */
/*  Multi-turn chat API (for persona output assistant)                 */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Send a multi-turn chat message to Claude.
 * Unlike sendMessage, this accepts a full conversation history.
 */
export async function sendChatMessage(
  system: string,
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 8000,
  model = 'claude-sonnet-4-6',
  signal?: AbortSignal,
): Promise<string> {
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  });

  const timeoutMs = computeTimeout(model, maxTokens);
  let timedOut = false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }
  const effectiveSignal = controller.signal;
  const cleanup = () => clearTimeout(timeoutId);

  let response: Response;

  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body,
      signal: effectiveSignal,
    });
  } catch {
    if (effectiveSignal.aborted) {
      cleanup();
      throw new Error(timedOut
        ? `Chat request timed out after ${Math.round(timeoutMs / 60000)} minutes.`
        : 'Request was cancelled.');
    }
    try {
      response = await fetch(DIRECT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body,
        signal: effectiveSignal,
      });
    } catch {
      cleanup();
      if (effectiveSignal.aborted) {
        throw new Error(timedOut
          ? `Chat request timed out after ${Math.round(timeoutMs / 60000)} minutes.`
          : 'Request was cancelled.');
      }
      throw new Error('Unable to reach the Claude API. Please check your internet connection.');
    }
  }

  cleanup();

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
    if (response.status === 401) throw new Error('Invalid API key.');
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  const data: unknown = await response.json();

  if (
    !data ||
    typeof data !== 'object' ||
    !('content' in data) ||
    !Array.isArray((data as ClaudeResponse).content)
  ) {
    throw new Error('Unexpected API response format.');
  }

  const typedData = data as ClaudeResponse;
  return extractTextBlock(typedData, maxTokens).text;
}
