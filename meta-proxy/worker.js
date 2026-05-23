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
const KV_STATE_PREFIX = 'meta:state:';
const STATE_TTL_SECONDS = 600; // 10 min — OAuth dance must finish in this window

// Scopes the app requests. Trimmed to the minimum needed for Facebook ad
// comment pulling + ad metadata. Instagram scopes (instagram_business_basic,
// instagram_business_manage_comments) require the "Instagram Graph API"
// product to be added to the Meta app and approved separately — we'll add
// those when we extend the puller to Instagram ads.
//   - public_profile: required, returned automatically with any FB login
//   - pages_show_list / pages_read_engagement / pages_read_user_content:
//     list pages you manage + read their posts and comments
//   - business_management: access business assets (ad account links etc.)
//   - ads_read: read ad metadata + insights (used in Phase 2)
const OAUTH_SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'business_management',
  'ads_read',
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
}

// Wrap a Graph API call so the token stays server-side and we get useful errors
async function graphCall(env, path, { method = 'GET', params = {}, body = null } = {}) {
  const token = await loadToken(env);
  if (!token?.access_token) {
    return { ok: false, status: 401, error: 'Meta not connected' };
  }
  const baseUrl = `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;
  const search = new URLSearchParams({ ...params, access_token: token.access_token });
  const url = `${baseUrl}/${path.replace(/^\//, '')}?${search.toString()}`;
  const init = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') init.body = JSON.stringify(body);
  const res = await fetch(url, init);
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
  const { path, method = 'GET', params = {}, body = null } = payload || {};
  if (!path || typeof path !== 'string') {
    return jsonResponse({ error: 'Missing "path" in body' }, 400);
  }
  const result = await graphCall(env, path, { method, params, body });
  return jsonResponse(result.data ?? {}, result.status || (result.ok ? 200 : 500));
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
    } else if (request.method === 'GET' && path === '/') {
      response = jsonResponse({ ok: true, service: 'viasox-meta-proxy', endpoints: ['/meta/oauth/start', '/meta/oauth/callback', '/meta/status', '/meta/disconnect', '/meta/graph'] });
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
