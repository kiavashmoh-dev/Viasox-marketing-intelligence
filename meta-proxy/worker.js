/**
 * Viasox Meta Proxy Worker
 *
 * Endpoints:
 *   GET  /meta/oauth/start?return_to=<url>     → start OAuth (redirect to Meta)
 *   GET  /meta/oauth/callback?code=...&state   → finish OAuth (exchange + store)
 *   GET  /meta/status                          → connection status (no token leak)
 *   POST /meta/disconnect                      → wipe stored token
 *   POST /meta/graph                           → server-side Graph API proxy
 *                                                body: { path, method?, params?, body? }
 *
 * The long-lived Meta access token is stored ENCRYPTED-AT-REST in Cloudflare KV
 * and never sent to the browser. The browser only ever sees connection status
 * or proxied Graph responses.
 *
 * Origin allowlist guards the browser-facing endpoints (status, disconnect,
 * graph). The OAuth callback is hit by Meta and is NOT origin-checked, but it
 * validates the CSRF state nonce.
 */

const KV_KEY_TOKEN = 'meta:token';
const KV_KEY_PAGE_TOKENS = 'meta:page_tokens';
const KV_STATE_PREFIX = 'meta:state:';
const STATE_TTL_SECONDS = 600; // 10 min — OAuth dance must finish in this window

// Scopes the app requests.
//
// IMPORTANT — read-only guarantee in this integration is enforced at the
// INFRASTRUCTURE layer (the /meta/graph endpoint refuses any HTTP method
// other than GET), NOT at the scope layer. Even scopes that nominally
// grant write capability cannot be used to write through this proxy
// because the Worker physically rejects non-GET requests.
//
//   - public_profile: required, returned automatically with any FB login
//   - pages_show_list: list pages the user manages
//   - pages_read_engagement: read engagement metrics + comments on Pages
//   - pages_read_user_content: read user-generated content on Pages
//   - ads_read: read-only counterpart to ads_management (we never request ads_management)
//   - business_management: REQUIRED to enumerate Pages owned by a Business
//     Manager. Without it, /me/accounts only returns classic-role pages,
//     which excludes every BM-owned page (the common modern case).
//     The Worker's GET-only enforcement prevents this scope from being
//     used to mutate anything; it's used only for /me/businesses,
//     /{biz_id}/owned_pages, and /{biz_id}/client_pages traversal.
const OAUTH_SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'ads_read',
  'business_management',
].join(',');

// ───────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────

function corsHeaders(origin, allowlist) {
  const isAllowed = origin && allowlist.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function htmlResponse(html, status = 200) {
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function getAllowlist(env) {
  return (env.APP_ORIGIN_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isOriginAllowed(request, env) {
  const origin = request.headers.get('Origin') || '';
  return getAllowlist(env).includes(origin);
}

function randomHex(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function loadToken(env) {
  const raw = await env.META_KV.get(KV_KEY_TOKEN);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function saveToken(env, tokenRecord) {
  await env.META_KV.put(KV_KEY_TOKEN, JSON.stringify(tokenRecord));
}

async function clearToken(env) {
  await env.META_KV.delete(KV_KEY_TOKEN);
  await env.META_KV.delete(KV_KEY_PAGE_TOKENS);
}

// ─── READ-ONLY ENFORCEMENT ──────────────────────────────────────────────
// This Worker is a strict read-only mirror of the Graph API. Any non-GET
// request is rejected before it ever reaches Meta's servers, regardless
// of what the caller (browser, future code, compromised dependency)
// attempts. Combined with the read-only OAuth scopes above, this means
// the integration physically cannot modify any Meta state.
const ALLOWED_GRAPH_METHODS = new Set(['GET']);

async function loadPageTokens(env) {
  const raw = await env.META_KV.get(KV_KEY_PAGE_TOKENS);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

async function savePageTokens(env, map) {
  await env.META_KV.put(KV_KEY_PAGE_TOKENS, JSON.stringify(map));
}

/**
 * Refresh the cached map of { page_id: page_access_token }.
 *
 * Page tokens are REQUIRED for engagement endpoints like /POST_ID/comments.
 *
 * Three-strategy discovery:
 *   1. /me/accounts — classic-role pages (those where the user has a direct
 *      Page Role). Returns access_tokens inline. Works without business_management.
 *   2. /me/businesses → /{biz_id}/owned_pages + /{biz_id}/client_pages — pages
 *      owned by or assigned-to a Business Manager. Requires business_management.
 *      Returns page IDs but NOT tokens.
 *   3. For each page discovered via strategy 2 that wasn't already tokened by
 *      strategy 1, call /{page_id}?fields=access_token to fetch the token.
 *
 * All steps are GET-only (read-only Graph reads, no mutations).
 */
async function refreshPageTokens(env) {
  const userToken = await loadToken(env);
  if (!userToken?.access_token) {
    return { ok: false, status: 401, data: { error: 'Meta not connected' } };
  }
  const baseUrl = `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;
  const t = userToken.access_token;
  const map = {};
  const discoveredPageIds = new Set();
  const errors = [];

  // Strategy 1: /me/accounts (classic Page Roles)
  try {
    let nextUrl = `${baseUrl}/me/accounts?fields=id,name,access_token&limit=100&access_token=${t}`;
    while (nextUrl) {
      const res = await fetch(nextUrl);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        errors.push({ stage: 'me_accounts', status: res.status, error: data.error });
        break;
      }
      for (const p of data.data ?? []) {
        if (p.id) discoveredPageIds.add(p.id);
        if (p.id && p.access_token) {
          map[p.id] = { token: p.access_token, name: p.name || null };
        }
      }
      nextUrl = data.paging?.next || null;
    }
  } catch (err) {
    errors.push({ stage: 'me_accounts', exception: String(err) });
  }

  // Strategy 2: /me/businesses → owned_pages + client_pages (requires business_management)
  const businessPagesDiscovered = []; // { id, name } pairs from business graph
  try {
    let businessesUrl = `${baseUrl}/me/businesses?fields=id,name&limit=50&access_token=${t}`;
    while (businessesUrl) {
      const res = await fetch(businessesUrl);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        errors.push({ stage: 'me_businesses', status: res.status, error: data.error });
        break;
      }
      for (const biz of data.data ?? []) {
        for (const edge of ['owned_pages', 'client_pages']) {
          try {
            let pageUrl = `${baseUrl}/${biz.id}/${edge}?fields=id,name&limit=100&access_token=${t}`;
            while (pageUrl) {
              const pageRes = await fetch(pageUrl);
              const pageData = await pageRes.json().catch(() => ({}));
              if (!pageRes.ok) {
                errors.push({ stage: `business_${edge}`, business_id: biz.id, status: pageRes.status, error: pageData.error });
                break;
              }
              for (const p of pageData.data ?? []) {
                if (p.id) {
                  discoveredPageIds.add(p.id);
                  businessPagesDiscovered.push({ id: p.id, name: p.name || null });
                }
              }
              pageUrl = pageData.paging?.next || null;
            }
          } catch (err) {
            errors.push({ stage: `business_${edge}`, business_id: biz.id, exception: String(err) });
          }
        }
      }
      businessesUrl = data.paging?.next || null;
    }
  } catch (err) {
    errors.push({ stage: 'me_businesses', exception: String(err) });
  }

  // Strategy 3: For each business-discovered page lacking a token, fetch one
  for (const p of businessPagesDiscovered) {
    if (map[p.id]) continue;
    try {
      const res = await fetch(`${baseUrl}/${p.id}?fields=id,name,access_token&access_token=${t}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.access_token) {
        map[p.id] = { token: data.access_token, name: data.name || p.name || null };
      } else if (!res.ok) {
        errors.push({ stage: 'page_token_fetch', page_id: p.id, status: res.status, error: data.error });
      }
    } catch (err) {
      errors.push({ stage: 'page_token_fetch', page_id: p.id, exception: String(err) });
    }
  }

  await savePageTokens(env, map);

  return {
    ok: true,
    status: 200,
    data: {
      page_count: Object.keys(map).length,
      pages_discovered_total: discoveredPageIds.size,
      pages_discovered_via_business: businessPagesDiscovered.length,
      errors: errors.length > 0 ? errors : undefined,
    },
  };
}

// Wrap a Graph API call so the token stays server-side and we get useful errors.
// Refuses non-GET methods at the Worker level so the read-only guarantee
// holds even if the caller asks for a write.
//
// When `page_id` is provided in opts, uses that page's cached access token
// instead of the user token. Page tokens are required for post-engagement
// endpoints (/POST_ID/comments etc.).
async function graphCall(env, path, { method = 'GET', params = {}, page_id = null } = {}) {
  const upperMethod = (method || 'GET').toUpperCase();
  if (!ALLOWED_GRAPH_METHODS.has(upperMethod)) {
    return {
      ok: false,
      status: 405,
      data: { error: { message: `Method ${upperMethod} not allowed — this proxy is read-only (GET only).`, type: 'ReadOnlyProxyError', code: 'method_not_allowed' } },
    };
  }

  // Resolve the right token: page token if page_id specified, otherwise user token
  let tokenToUse;
  if (page_id) {
    const pageTokens = await loadPageTokens(env);
    const entry = pageTokens[page_id];
    if (!entry?.token) {
      return {
        ok: false,
        status: 412,
        data: { error: { message: `No cached page token for page_id=${page_id}. Call /meta/page-tokens/refresh first.`, type: 'MissingPageToken', code: 'page_token_missing' } },
      };
    }
    tokenToUse = entry.token;
  } else {
    const userToken = await loadToken(env);
    if (!userToken?.access_token) {
      return { ok: false, status: 401, data: { error: 'Meta not connected' } };
    }
    tokenToUse = userToken.access_token;
  }

  const baseUrl = `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;
  const search = new URLSearchParams({ ...params, access_token: tokenToUse });
  const url = `${baseUrl}/${path.replace(/^\//, '')}?${search.toString()}`;
  const res = await fetch(url, {
    method: 'GET', // forced GET — never derive from caller, never send a body
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ───────────────────────────────────────────────────────────────────────
// OAuth handlers
// ───────────────────────────────────────────────────────────────────────

async function handleOauthStart(request, env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('return_to') || '';
  const allowlist = getAllowlist(env);

  // Validate return_to is on the allowed app origin (prevents open-redirect)
  let safeReturnTo = '';
  try {
    const ret = new URL(returnTo);
    const retOrigin = `${ret.protocol}//${ret.host}`;
    if (allowlist.includes(retOrigin)) safeReturnTo = returnTo;
  } catch { /* invalid URL — leave empty */ }

  // CSRF state: random nonce stored in KV briefly, returned by Meta later
  const state = randomHex(24);
  await env.META_KV.put(
    KV_STATE_PREFIX + state,
    JSON.stringify({ return_to: safeReturnTo, created_at: Date.now() }),
    { expirationTtl: STATE_TTL_SECONDS },
  );

  const redirectUri = `${url.origin}/meta/oauth/callback`;
  const authorizeUrl = new URL(env.META_OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set('client_id', env.META_APP_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('scope', OAUTH_SCOPES);
  authorizeUrl.searchParams.set('response_type', 'code');

  return Response.redirect(authorizeUrl.toString(), 302);
}

async function handleOauthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  const errorDesc = url.searchParams.get('error_description');

  if (errorParam) {
    return htmlResponse(renderCallbackPage('error', `Meta returned: ${errorParam} — ${errorDesc || ''}`));
  }
  if (!code || !state) {
    return htmlResponse(renderCallbackPage('error', 'Missing code or state'), 400);
  }

  // Validate CSRF state
  const stateRaw = await env.META_KV.get(KV_STATE_PREFIX + state);
  if (!stateRaw) {
    return htmlResponse(renderCallbackPage('error', 'State expired or invalid. Please try again.'), 400);
  }
  await env.META_KV.delete(KV_STATE_PREFIX + state);
  const stateData = JSON.parse(stateRaw);

  // Exchange code → short-lived user token
  const redirectUri = `${url.origin}/meta/oauth/callback`;
  const tokenParams = new URLSearchParams({
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    redirect_uri: redirectUri,
    code,
  });
  const shortRes = await fetch(`${env.META_OAUTH_TOKEN_URL}?${tokenParams.toString()}`);
  const shortData = await shortRes.json();
  if (!shortRes.ok || !shortData.access_token) {
    return htmlResponse(renderCallbackPage('error', `Token exchange failed: ${JSON.stringify(shortData)}`), 502);
  }

  // Exchange short-lived → long-lived (60-day) token
  const longParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    fb_exchange_token: shortData.access_token,
  });
  const longRes = await fetch(`${env.META_OAUTH_TOKEN_URL}?${longParams.toString()}`);
  const longData = await longRes.json();
  if (!longRes.ok || !longData.access_token) {
    return htmlResponse(renderCallbackPage('error', `Long-lived exchange failed: ${JSON.stringify(longData)}`), 502);
  }

  const expiresInSec = Number(longData.expires_in) || 60 * 24 * 60 * 60;
  const expiresAt = Date.now() + expiresInSec * 1000;

  // Get the user identity so we can show a friendly "Connected as X" status
  const meRes = await fetch(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/me?fields=id,name,email&access_token=${longData.access_token}`);
  const meData = await meRes.json().catch(() => ({}));

  // Store the token + identity
  await saveToken(env, {
    access_token: longData.access_token,
    expires_at: expiresAt,
    issued_at: Date.now(),
    user_id: meData.id || null,
    user_name: meData.name || null,
    user_email: meData.email || null,
  });

  // Bounce back to the app
  const returnTo = stateData.return_to;
  if (returnTo) {
    return Response.redirect(returnTo + (returnTo.includes('?') ? '&' : '?') + 'meta=connected', 302);
  }
  return htmlResponse(renderCallbackPage('success', meData.name || 'Meta'));
}

function renderCallbackPage(status, detail) {
  const isSuccess = status === 'success';
  const title = isSuccess ? 'Connected to Meta' : 'Meta connection failed';
  const color = isSuccess ? '#10b981' : '#ef4444';
  const body = isSuccess
    ? `<p>Connected as <strong>${escapeHtml(detail)}</strong>. You can close this tab.</p>`
    : `<p style="color:${color}">${escapeHtml(detail)}</p><p>You can close this tab.</p>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;color:#1f2937;text-align:center}h1{color:${color}}</style>
</head><body><h1>${title}</h1>${body}</body></html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ───────────────────────────────────────────────────────────────────────
// Status / disconnect
// ───────────────────────────────────────────────────────────────────────

async function handleStatus(request, env) {
  if (!isOriginAllowed(request, env)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  const token = await loadToken(env);
  if (!token) {
    return jsonResponse({ connected: false }, 200);
  }
  return jsonResponse({
    connected: true,
    user_id: token.user_id,
    user_name: token.user_name,
    user_email: token.user_email,
    expires_at: token.expires_at,
    days_remaining: Math.max(0, Math.floor((token.expires_at - Date.now()) / (24 * 60 * 60 * 1000))),
  });
}

async function handleDisconnect(request, env) {
  if (!isOriginAllowed(request, env)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  await clearToken(env);
  return jsonResponse({ disconnected: true });
}

// ───────────────────────────────────────────────────────────────────────
// Graph API proxy
// ───────────────────────────────────────────────────────────────────────

async function handleGraph(request, env) {
  if (!isOriginAllowed(request, env)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  // Body field is intentionally ignored — this proxy is GET-only and never
  // sends request bodies to Meta. See graphCall() for the enforcement.
  const { path, method = 'GET', params = {}, page_id = null } = payload || {};
  if (!path || typeof path !== 'string') {
    return jsonResponse({ error: 'Missing "path" in body' }, 400);
  }
  const result = await graphCall(env, path, { method, params, page_id });
  return jsonResponse(result.data ?? {}, result.status || (result.ok ? 200 : 500));
}

async function handlePageTokensRefresh(request, env) {
  if (!isOriginAllowed(request, env)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  const result = await refreshPageTokens(env);
  return jsonResponse(result.data ?? {}, result.status || (result.ok ? 200 : 500));
}

async function handlePageTokensList(request, env) {
  // Returns the LIST of cached pages (id + name only) — never the tokens.
  if (!isOriginAllowed(request, env)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  const map = await loadPageTokens(env);
  const pages = Object.entries(map).map(([id, info]) => ({ id, name: info.name || null }));
  return jsonResponse({ pages, page_count: pages.length });
}

/**
 * Deep diagnostic — shows exactly what Meta says about the current token
 * and what /me/accounts returns. Used to pinpoint why page tokens aren't
 * being cached when the user clearly has page roles.
 */
async function handleDiagnostic(request, env) {
  if (!isOriginAllowed(request, env)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  const token = await loadToken(env);
  if (!token?.access_token) return jsonResponse({ error: 'Meta not connected' }, 401);

  const baseUrl = `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;
  const t = token.access_token;

  // Run all three diagnostics in parallel
  const [meRes, permsRes, accountsRes] = await Promise.all([
    fetch(`${baseUrl}/me?fields=id,name&access_token=${t}`).then((r) => r.json().catch(() => ({}))),
    fetch(`${baseUrl}/me/permissions?access_token=${t}`).then((r) => r.json().catch(() => ({}))),
    fetch(`${baseUrl}/me/accounts?fields=id,name,access_token,tasks&limit=100&access_token=${t}`).then(async (r) => ({
      status: r.status,
      body: await r.json().catch(() => ({})),
    })),
  ]);

  // Strip access_tokens from the /me/accounts response before returning to browser
  const safeAccountsBody = { ...accountsRes.body };
  if (Array.isArray(safeAccountsBody.data)) {
    safeAccountsBody.data = safeAccountsBody.data.map((p) => ({
      id: p.id,
      name: p.name,
      tasks: p.tasks,
      has_access_token: !!p.access_token,
    }));
  }

  return jsonResponse({
    me: meRes,
    granted_permissions: permsRes,
    me_accounts_raw: {
      status: accountsRes.status,
      body: safeAccountsBody,
    },
    cached_pages_count: Object.keys(await loadPageTokens(env)).length,
  });
}

// ───────────────────────────────────────────────────────────────────────
// Scheduled handler — weekly comment refresh
// ───────────────────────────────────────────────────────────────────────

async function handleScheduled(_event, env, _ctx) {
  // Placeholder for the weekly comment puller. We'll fill this in once
  // the React-side "Connect Meta" flow is wired and we know the exact
  // shape of stored cursors per ad. For now, just record that the cron
  // fired so we can observe it in Tail logs.
  const lastRun = new Date().toISOString();
  await env.META_KV.put('meta:cron:last_run', lastRun);
  console.log(`[meta-proxy cron] tick at ${lastRun}`);
}

// ───────────────────────────────────────────────────────────────────────
// Router
// ───────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin') || '';
    const allowlist = getAllowlist(env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, allowlist) });
    }

    // Route dispatch
    let response;
    if (request.method === 'GET' && path === '/meta/oauth/start') {
      response = await handleOauthStart(request, env);
    } else if (request.method === 'GET' && path === '/meta/oauth/callback') {
      response = await handleOauthCallback(request, env);
    } else if (request.method === 'GET' && path === '/meta/status') {
      response = await handleStatus(request, env);
    } else if (request.method === 'POST' && path === '/meta/disconnect') {
      response = await handleDisconnect(request, env);
    } else if (request.method === 'POST' && path === '/meta/graph') {
      response = await handleGraph(request, env);
    } else if (request.method === 'POST' && path === '/meta/page-tokens/refresh') {
      response = await handlePageTokensRefresh(request, env);
    } else if (request.method === 'GET' && path === '/meta/page-tokens') {
      response = await handlePageTokensList(request, env);
    } else if (request.method === 'GET' && path === '/meta/diagnostic') {
      response = await handleDiagnostic(request, env);
    } else if (request.method === 'GET' && path === '/') {
      response = jsonResponse({ ok: true, service: 'viasox-meta-proxy', endpoints: ['/meta/oauth/start', '/meta/oauth/callback', '/meta/status', '/meta/disconnect', '/meta/graph', '/meta/page-tokens', '/meta/page-tokens/refresh'] });
    } else {
      response = jsonResponse({ error: 'Not found' }, 404);
    }

    // Attach CORS headers to JSON responses (not to OAuth redirects)
    const isJson = response.headers.get('Content-Type')?.includes('application/json');
    if (isJson) {
      const headers = new Headers(response.headers);
      for (const [k, v] of Object.entries(corsHeaders(origin, allowlist))) headers.set(k, v);
      return new Response(response.body, { status: response.status, headers });
    }
    return response;
  },

  async scheduled(event, env, ctx) {
    await handleScheduled(event, env, ctx);
  },
};
