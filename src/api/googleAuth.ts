/**
 * Google Identity Services (GIS) token flow — browser-side, no backend.
 *
 * Used by the Google Docs export (`googleDocs.ts`). GIS's token client pops a
 * Google window, the user picks the Viasox Workspace account, and we receive
 * a short-lived (≈1 h) access token. It is cached in sessionStorage with its
 * expiry and reused while valid; once expired, the next call re-requests with
 * `prompt: ''`, which grants without a consent screen for a user who already
 * consented. The app never sees a refresh token and never logs the token.
 *
 * Scope: ONLY `https://www.googleapis.com/auth/drive.file` — files this app
 * created. Enough for documents.create / batchUpdate / get on those docs, and
 * non-sensitive, so an Internal OAuth consent screen needs no verification.
 *
 * Setup for the director: docs/GOOGLE-DOCS-EXPORT-SETUP.md. The Client ID is
 * pasted once into the export dialog and kept in localStorage under
 * `GOOGLE_CLIENT_ID_STORAGE_KEY`.
 *
 * Popup discipline: browsers only allow the GIS popup inside a user gesture.
 * Call `loadGis()` when the export dialog mounts so `getGoogleAccessToken()`
 * reaches `requestAccessToken()` without an intervening network await.
 */

// ─── Minimal ambient typing for the GIS global (no @types package) ──────────

interface GisTokenResponse {
  access_token?: string;
  /** Lifetime in seconds. */
  expires_in?: number | string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface GisClientError {
  type?: 'popup_failed_to_open' | 'popup_closed' | 'unknown';
  message?: string;
}

interface GisTokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

interface GisTokenClientConfig {
  client_id: string;
  /** Space-delimited scopes. */
  scope: string;
  /** '' = prompt only the first time; 'consent' | 'select_account' | 'none'. */
  prompt?: string;
  callback: (response: GisTokenResponse) => void;
  error_callback?: (error: GisClientError) => void;
}

interface GisOauth2 {
  initTokenClient(config: GisTokenClientConfig): GisTokenClient;
  revoke(accessToken: string, done: () => void): void;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GisOauth2 } };
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
/** The only scope the Google Docs export needs. */
export const GOOGLE_DOCS_EXPORT_SCOPES: readonly string[] = [GOOGLE_DRIVE_FILE_SCOPE];
/** localStorage key the export dialog uses for the pasted OAuth Client ID. */
export const GOOGLE_CLIENT_ID_STORAGE_KEY = 'viasox_google_client_id';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const TOKEN_STORAGE_KEY = 'viasox_google_access_token';
/** Treat a token as expired this long before Google does. */
const EXPIRY_SAFETY_MS = 60_000;
const DEFAULT_TTL_SECONDS = 3600;

// ─── Script loading ─────────────────────────────────────────────────────────

let gisLoading: Promise<void> | null = null;

/** Injects the GIS script once; resolves when `google.accounts.oauth2` exists. */
export function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoading) return gisLoading;
  gisLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      'load',
      () => {
        if (window.google?.accounts?.oauth2) resolve();
        else {
          gisLoading = null;
          reject(new Error('The Google sign-in script loaded but did not initialise. Reload the page and try again.'));
        }
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        gisLoading = null;
        script.remove();
        reject(
          new Error(
            'Could not load the Google sign-in script (accounts.google.com). Check your connection or an ad/script blocker, then try again.',
          ),
        );
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
  return gisLoading;
}

// ─── Token cache (sessionStorage) ───────────────────────────────────────────

interface CachedToken {
  token: string;
  expiresAt: number;
  scope: string;
}

function readCache(): CachedToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<CachedToken>;
    if (typeof c.token !== 'string' || typeof c.expiresAt !== 'number' || typeof c.scope !== 'string') return null;
    return { token: c.token, expiresAt: c.expiresAt, scope: c.scope };
  } catch {
    return null;
  }
}

function writeCache(c: CachedToken): void {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(c));
  } catch {
    // Storage unavailable (private mode / quota): the token simply isn't reused.
  }
}

/** Forget the cached token (call after a 401 from Google, or on "sign out"). */
export function clearGoogleAccessToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function coversScopes(granted: string, wanted: readonly string[]): boolean {
  const have = new Set(granted.split(/\s+/).filter(Boolean));
  return wanted.every((s) => have.has(s));
}

// ─── Human-readable errors ──────────────────────────────────────────────────

function describeTokenError(r: GisTokenResponse): string {
  const detail = r.error_description ? ` (${r.error_description})` : '';
  switch (r.error) {
    case 'access_denied':
      return 'Google access was denied — the permission request was declined. Click Export again and allow the app to create files in your Drive.';
    case 'invalid_client':
    case 'unauthorized_client':
      return `Google rejected the OAuth Client ID${detail}. Check the ID pasted in the export dialog and that ${window.location.origin} is listed under the client's Authorized JavaScript origins.`;
    case 'admin_policy_enforced':
      return 'Your Google Workspace admin policy blocks this app. Ask the Workspace admin to allow it (or mark it trusted) in the Admin console.';
    case 'interaction_required':
    case 'login_required':
      return 'Google needs you to sign in — click Export again and pick your Viasox account in the popup.';
    case undefined:
      return 'Google returned no access token. Click Export again.';
    default:
      return `Google sign-in failed: ${r.error}${detail}.`;
  }
}

function describeClientError(e: GisClientError): string {
  switch (e.type) {
    case 'popup_failed_to_open':
      return 'The Google sign-in popup was blocked. Allow popups for this site (icon in the address bar) and click Export again.';
    case 'popup_closed':
      return `The Google sign-in window was closed before access was granted. Click Export again and finish the sign-in. If the window showed "Error 400: origin_mismatch", add ${window.location.origin} to the OAuth client's Authorized JavaScript origins.`;
    default:
      return `Google sign-in failed: ${e.message ?? 'unknown error'}.`;
  }
}

// ─── The token ──────────────────────────────────────────────────────────────

/**
 * Returns a valid access token for `scopes`, reusing the cached one while it
 * is valid and otherwise running the GIS token flow (popup on first use,
 * silent for a user who already consented). Rejects with a human-readable
 * Error: missing client id, popup blocked/closed, access denied, bad client.
 */
export async function getGoogleAccessToken(
  clientId: string,
  scopes: readonly string[] = GOOGLE_DOCS_EXPORT_SCOPES,
): Promise<string> {
  const id = clientId.trim();
  if (!id) {
    throw new Error(
      'Missing Google OAuth Client ID. Paste the Client ID from Google Cloud Console into the export dialog once (see docs/GOOGLE-DOCS-EXPORT-SETUP.md).',
    );
  }
  const wanted = scopes.length ? [...scopes] : [...GOOGLE_DOCS_EXPORT_SCOPES];

  const cached = readCache();
  if (cached && cached.expiresAt - EXPIRY_SAFETY_MS > Date.now() && coversScopes(cached.scope, wanted)) {
    return cached.token;
  }

  await loadGis();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('Google sign-in is unavailable in this browser session. Reload the page and try again.');

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const once = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };
    const client = oauth2.initTokenClient({
      client_id: id,
      scope: wanted.join(' '),
      // '' = consent screen only the first time; silent afterwards while the
      // Google session lives (the re-prompt when our cached token expired).
      prompt: '',
      callback: (r) =>
        once(() => {
          if (r.error || !r.access_token) {
            reject(new Error(describeTokenError(r)));
            return;
          }
          const grantedScope = r.scope ?? '';
          if (!coversScopes(grantedScope, wanted)) {
            reject(
              new Error(
                'Google access was granted without the Drive file permission. Click Export again and tick the box that lets the app create files in your Drive.',
              ),
            );
            return;
          }
          const ttl = Number(r.expires_in) > 0 ? Number(r.expires_in) : DEFAULT_TTL_SECONDS;
          writeCache({ token: r.access_token, expiresAt: Date.now() + ttl * 1000, scope: grantedScope });
          resolve(r.access_token);
        }),
      error_callback: (e) => once(() => reject(new Error(describeClientError(e)))),
    });
    try {
      client.requestAccessToken();
    } catch (e) {
      once(() => reject(new Error(`Could not open the Google sign-in window: ${e instanceof Error ? e.message : String(e)}`)));
    }
  });
}
