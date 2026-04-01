import type { ClaudeResponse } from '../engine/types';

const PROXY_URL = 'https://viasox-claude-proxy.workers.dev';
const DIRECT_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Compute timeout based on model and max_tokens.
 * Opus with large outputs can take 5-8+ minutes; Sonnet is faster.
 * Scale: base 3 min + 30s per 1K tokens for Opus, base 2 min + 15s per 1K tokens for Sonnet.
 */
function computeTimeout(model: string, _maxTokens: number): number {
  const isOpus = model.includes('opus');
  if (isOpus) {
    // Opus with massive system prompts can be very slow under load.
    // Fixed 30 minutes for all Opus calls
    return 1_800_000;
  }
  // Sonnet: fixed 15 minutes
  return 900_000;
}

export async function sendMessage(
  system: string,
  userMessage: string,
  apiKey: string,
  maxTokens = 4096,
  model = 'claude-sonnet-4-20250514',
  signal?: AbortSignal,
): Promise<string> {
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

  // Try proxy first, fall back to direct API
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
  } catch (proxyError) {
    // If caller aborted or timed out, don't retry
    if (effectiveSignal.aborted) {
      cleanup();
      if (timedOut) {
        throw new Error(`API request timed out after ${Math.round(timeoutMs / 60000)} minutes. The API may be slow — please try again.`);
      }
      throw new Error('Request was cancelled.');
    }
    // Proxy unreachable - try direct API (works if CORS isn't blocking)
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
    } catch (directError) {
      cleanup();
      if (effectiveSignal.aborted) {
        if (timedOut) {
          throw new Error(`API request timed out after ${Math.round(timeoutMs / 60000)} minutes. The API may be slow — please try again.`);
        }
        throw new Error('Request was cancelled.');
      }
      throw new Error(
        'Unable to reach the Claude API. Please check your internet connection and try again.',
      );
    }
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
        response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
          body,
          signal: effectiveSignal,
        });
        if (response.ok || (response.status !== 429 && response.status !== 529)) break;
      } catch { break; }
    }
  }

  if (!response.ok) {
    const errText = await response.text();
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
  const textBlock = typedData.content.find((c) => c.type === 'text');
  if (!textBlock) throw new Error('No text in response');

  // Warn if output was truncated due to max_tokens
  const stopReason = (data as Record<string, unknown>).stop_reason;
  if (stopReason === 'max_tokens') {
    return textBlock.text + '\n\n---\n\n> **Note:** This output was truncated because it reached the token limit. Try regenerating or reducing the scope of your request.';
  }

  return textBlock.text;
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
  maxTokens = 2048,
  model = 'claude-sonnet-4-20250514',
  signal?: AbortSignal,
): Promise<string> {
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
  const textBlock = typedData.content.find((c) => c.type === 'text');
  if (!textBlock) throw new Error('No text in response');
  return textBlock.text;
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
  maxTokens = 2048,
  model = 'claude-sonnet-4-20250514',
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
  const textBlock = typedData.content.find((c) => c.type === 'text');
  if (!textBlock) throw new Error('No text in response');

  return textBlock.text;
}
