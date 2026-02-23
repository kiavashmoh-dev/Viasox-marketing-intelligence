import type { ClaudeResponse } from '../engine/types';

const PROXY_URL = 'https://viasox-claude-proxy.workers.dev';
const DIRECT_URL = 'https://api.anthropic.com/v1/messages';

/** Default timeout for API calls: 5 minutes (long persona + market analysis can generate 15K-32K tokens) */
const API_TIMEOUT_MS = 300_000;

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

  // Combine caller signal with timeout signal
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
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
    // If caller aborted, don't retry
    if (effectiveSignal.aborted) {
      cleanup();
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
        throw new Error('Request was cancelled.');
      }
      throw new Error(
        'Unable to reach the Claude API. Please check your internet connection and try again.',
      );
    }
  }

  cleanup();

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw new Error('Rate limited. Please wait a moment and try again.');
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
/*  Multi-turn chat API (for persona output assistant)                 */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Chat timeout: 2 minutes (shorter than generation — chat responses are smaller) */
const CHAT_TIMEOUT_MS = 120_000;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
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
      throw new Error('Request was cancelled.');
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
        throw new Error('Request was cancelled.');
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
