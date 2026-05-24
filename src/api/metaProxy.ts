/**
 * Typed client for the Viasox Meta Proxy Worker.
 *
 * The Worker (deployed at META_PROXY_URL) handles OAuth, token storage in
 * Cloudflare KV, and server-side Graph API calls. The browser never sees
 * the long-lived Meta access token — it only sees connection status and
 * proxied Graph API responses.
 */

const META_PROXY_URL = 'https://viasox-meta-proxy.kiavashmoh.workers.dev';

export interface MetaStatusConnected {
  connected: true;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  expires_at: number;
  days_remaining: number;
}

export interface MetaStatusDisconnected {
  connected: false;
}

export type MetaStatus = MetaStatusConnected | MetaStatusDisconnected;

/**
 * Get current Meta connection status (does NOT expose the token).
 */
export async function getMetaStatus(signal?: AbortSignal): Promise<MetaStatus> {
  const res = await fetch(`${META_PROXY_URL}/meta/status`, {
    method: 'GET',
    signal,
    // Origin header is added by the browser automatically; Worker validates it.
  });
  if (!res.ok) {
    throw new Error(`Meta status check failed: HTTP ${res.status}`);
  }
  return (await res.json()) as MetaStatus;
}

/**
 * Start the OAuth flow. Sends the user to Meta's authorize page; after they
 * authorize, the Worker stores the token and redirects them back to
 * `returnTo` with `?meta=connected` appended.
 */
export function startMetaOauth(returnTo: string = window.location.href): void {
  const url = `${META_PROXY_URL}/meta/oauth/start?return_to=${encodeURIComponent(returnTo)}`;
  window.location.href = url;
}

/**
 * Disconnect Meta — wipes the stored token on the Worker side.
 */
export async function disconnectMeta(): Promise<void> {
  const res = await fetch(`${META_PROXY_URL}/meta/disconnect`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Meta disconnect failed: HTTP ${res.status}`);
  }
}

/**
 * Server-side Graph API proxy — READ-ONLY by design. The Worker enforces
 * GET-only at the infrastructure level; non-GET requests are rejected
 * with HTTP 405 before they reach Meta. The Worker injects the access
 * token; we just pass the path + query params.
 *
 * @example
 *   const me = await metaGraph<{ id: string; name: string }>({ path: 'me', params: { fields: 'id,name' } });
 *   const pages = await metaGraph({ path: 'me/accounts' });
 */
export async function metaGraph<T = unknown>(opts: {
  path: string;
  params?: Record<string, string | number | boolean>;
  /** When provided, the Worker uses that page's cached access token instead
   * of the user token. Required for engagement endpoints like
   * /POST_ID/comments. Call refreshPageTokens() before using this. */
  page_id?: string;
}): Promise<T> {
  const res = await fetch(`${META_PROXY_URL}/meta/graph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // method is implicitly 'GET' on the Worker side — we never send writes
    body: JSON.stringify({ ...opts, method: 'GET' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data)
      ? JSON.stringify((data as { error: unknown }).error)
      : `Graph proxy HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

/**
 * Refresh the server-side cache of page access tokens. The Worker calls
 * /me/accounts with the stored user token, then caches each page's
 * access_token in KV. Required before pulling page-post comments
 * (which need page tokens, not the user token).
 */
export async function refreshPageTokens(): Promise<{ page_count: number }> {
  const res = await fetch(`${META_PROXY_URL}/meta/page-tokens/refresh`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Page token refresh failed: ${JSON.stringify(data)}`);
  }
  return res.json();
}

/**
 * List the cached pages (id + name only — tokens never leave the Worker).
 */
export async function listCachedPages(): Promise<{ pages: Array<{ id: string; name: string | null }>; page_count: number }> {
  const res = await fetch(`${META_PROXY_URL}/meta/page-tokens`);
  if (!res.ok) throw new Error(`Page list HTTP ${res.status}`);
  return res.json();
}

/**
 * Deep diagnostic that returns: the user identity, the granted permissions
 * on the current token, the raw /me/accounts response (status + body with
 * tokens stripped), and the count of currently-cached page tokens. Used
 * to pinpoint why page-token caching fails despite proper page roles.
 */
export interface MetaDiagnostic {
  me: { id?: string; name?: string; error?: unknown };
  granted_permissions: { data?: Array<{ permission: string; status: 'granted' | 'declined' }>; error?: unknown };
  me_accounts_raw: { status: number; body: { data?: Array<{ id: string; name: string; tasks?: string[]; has_access_token: boolean }>; error?: unknown; paging?: unknown } };
  cached_pages_count: number;
}

export async function getMetaDiagnostic(): Promise<MetaDiagnostic> {
  const res = await fetch(`${META_PROXY_URL}/meta/diagnostic`);
  if (!res.ok) throw new Error(`Diagnostic HTTP ${res.status}`);
  return res.json();
}
