(() => {
  'use strict';

  const ACCESS_TOKEN_KEY = 'mercury.supabase.access_token';
  const REFRESH_TOKEN_KEY = 'mercury.supabase.refresh_token';

  const CONFIG = Object.freeze({
    version: '4.1.0-skillui-billing',
    system: 'jahorin-mercury',
    ownerGid: '399152573423',
    ownerMode: 'Prime Orchestrator',
    ari: 'https://ari-689058655022.us-west1.run.app',
    runtime: 'https://agentic-mercury-runtime-689058655022.us-west1.run.app',
    routes: {
      health: '/api/health',
      ready: '/api/ready',
      identity: '/api/identity',
      session: '/api/identity/session',
      authSignup: '/api/auth/signup',
      authLogin: '/api/auth/login',
      authRefresh: '/api/auth/refresh',
      authMe: '/api/auth/me',
      billingStatus: '/api/billing/status',
      billingCheckout: '/api/billing/checkout',
      billingPortal: '/api/billing/portal',
      render: '/api/render-state',
      iot: '/api/iot',
      syncori: '/api/syncori',
      tae: '/api/tae',
      runtime: '/api/runtime'
    },
    pages: {
      mercury: '/home/',
      interweb: '/interweb/',
      augment: '/syncori/',
      syncori: '/syncori/',
      code: '/code/',
      scribe: '/scribe/',
      optics: '/syncori/optics/',
      gid: '/gid/'
    }
  });

  const state = {
    surface: document.body?.dataset?.surface || 'unknown',
    identity: null,
    billing: null,
    online: navigator.onLine,
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || '',
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || ''
  };

  const apiBase = () => location.protocol === 'file:' ? CONFIG.ari : '';
  const url = path => /^https?:/i.test(path) ? path : `${apiBase()}${path}`;
  const uuid = () => crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function setTokens(accessToken = '', refreshToken = '') {
    state.accessToken = accessToken || '';
    state.refreshToken = refreshToken || state.refreshToken || '';
    if (state.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, state.accessToken);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
    if (state.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, state.refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  function clearTokens() {
    state.accessToken = '';
    state.refreshToken = '';
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async function request(path, options = {}) {
    const retries = Number.isInteger(options.retries) ? options.retries : 2;
    const baseDelay = options.baseDelay || 240;
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeout || 30000);

      try {
        const headers = {
          Accept: 'application/json',
          'X-Request-ID': uuid(),
          ...(options.headers || {})
        };
        if (options.body) headers['Content-Type'] = 'application/json';
        if (!options.public && state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;

        const response = await window.fetch(url(path), {
          method: options.method || (options.body ? 'POST' : 'GET'),
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal
        });

        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('json') ? await response.json() : await response.text();

        if (!response.ok) {
          const error = new Error(data?.error || data?.detail || `ARI HTTP ${response.status}`);
          error.status = response.status;
          throw error;
        }

        state.online = true;
        return data;
      } catch (error) {
        lastError = error;
        state.online = false;
        const retryable = error.name === 'AbortError' || !error.status || error.status >= 500;
        if (!retryable || attempt === retries) throw error;
        await sleep(baseDelay * (2 ** attempt));
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError;
  }

  async function signup({ email, password, display_name = '' }) {
    const result = await request(CONFIG.routes.authSignup, {
      method: 'POST',
      public: true,
      body: { email, password, display_name }
    });
    if (result?.access_token) setTokens(result.access_token, result.refresh_token || '');
    state.identity = null;
    state.billing = null;
    return result;
  }

  async function login({ email, password }) {
    const result = await request(CONFIG.routes.authLogin, {
      method: 'POST',
      public: true,
      body: { email, password }
    });
    setTokens(result?.access_token || '', result?.refresh_token || '');
    state.identity = null;
    state.billing = null;
    return result;
  }

  async function refreshAuth() {
    if (!state.refreshToken) throw new Error('No refresh token available');
    const result = await request(CONFIG.routes.authRefresh, {
      method: 'POST',
      public: true,
      body: { refresh_token: state.refreshToken }
    });
    setTokens(result?.access_token || '', result?.refresh_token || state.refreshToken);
    return result;
  }

  async function me() {
    return request(CONFIG.routes.authMe, { timeout: 7000, retries: 1 });
  }

  async function identity() {
    try {
      state.identity = await request(CONFIG.routes.identity, { timeout: 7000, retries: 1 });
      return state.identity;
    } catch {
      state.identity = { authenticated: false };
      return state.identity;
    }
  }

  async function authenticate(accessCode) {
    const output = await request(CONFIG.routes.session, {
      method: 'POST',
      public: true,
      body: { access_code: accessCode }
    });
    await identity();
    return output;
  }

  async function signOut() {
    clearTokens();
    state.identity = { authenticated: false };
    state.billing = null;
    try {
      return await request(CONFIG.routes.session, { method: 'DELETE', public: true });
    } catch {
      return { ok: true, authenticated: false };
    }
  }

  async function billingStatus() {
    state.billing = await request(CONFIG.routes.billingStatus, { timeout: 10000, retries: 1 });
    return state.billing;
  }

  async function billingCheckout(tier, { redirect = true } = {}) {
    const result = await request(CONFIG.routes.billingCheckout, {
      method: 'POST',
      body: { tier }
    });
    if (redirect && result?.url) location.assign(result.url);
    return result;
  }

  async function billingPortal({ redirect = true } = {}) {
    const result = await request(CONFIG.routes.billingPortal, { method: 'POST', body: {} });
    if (redirect && result?.url) location.assign(result.url);
    return result;
  }

  async function dispatch(capability, intent, payload = {}) {
    return request(CONFIG.routes.runtime, {
      method: 'POST',
      body: {
        gid: state.identity?.authenticated ? state.identity.gid : null,
        intent,
        capability,
        module: state.surface,
        payload,
        request_id: uuid(),
        context: {
          href: location.href,
          locale: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }
    });
  }

  async function tae(prompt = 'TAE, enter Demo Mode') {
    return request(CONFIG.routes.tae, {
      method: 'POST',
      body: { prompt, request_id: uuid() }
    });
  }

  function go(surface) {
    const target = CONFIG.pages[surface] || surface;
    if (globalThis.SkillUI?.navigate) {
      globalThis.SkillUI.navigate(target);
      return;
    }
    location.href = target;
  }

  function toast(message) {
    let element = document.querySelector('.toast');
    if (!element) {
      element = document.createElement('div');
      element.className = 'toast';
      document.querySelector('.app')?.append(element);
    }
    element.textContent = String(message);
    element.classList.add('show');
    clearTimeout(element._t);
    element._t = setTimeout(() => element.classList.remove('show'), 2600);
  }

  function dock(active) {
    const element = document.querySelector('.dock');
    if (!element) return;
    const items = [
      ['mercury', '☿', 'Mercury'],
      ['interweb', '◎', 'Interweb'],
      ['augment', '◉', 'Syncori'],
      ['code', '⌨', 'Code'],
      ['scribe', '✒', 'Scribe'],
      ['optics', '◉', 'Optics']
    ];
    element.textContent = '';
    for (const [key, glyph, label] of items) {
      const button = document.createElement('button');
      const glyphNode = document.createElement('span');
      glyphNode.className = 'glyph';
      glyphNode.textContent = glyph;
      button.append(glyphNode, document.createTextNode(label));
      if (key === active) button.classList.add('active');
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.addEventListener('click', () => go(key));
      element.append(button);
    }
  }

  async function status() {
    const element = document.querySelector('.status');
    if (!element) return null;
    try {
      const [health, ready] = await Promise.all([
        request(CONFIG.routes.health, { timeout: 5000, retries: 1, public: true }),
        request(CONFIG.routes.ready, { timeout: 5000, retries: 1, public: true })
      ]);
      element.dataset.online = 'true';
      const billing = health?.billing_configured ? 'billing ready' : 'billing configuring';
      element.textContent = `ARI · ${ready?.ok === false ? 'configuring' : 'online'} · ${billing}`;
      return { h: health, r: ready };
    } catch {
      element.dataset.online = 'false';
      element.textContent = 'ARI · offline';
      return null;
    }
  }

  globalThis.Mercury = {
    CONFIG,
    state,
    request,
    identity,
    authenticate,
    signOut,
    dispatch,
    tae,
    go,
    toast,
    dock,
    status,
    auth: {
      signup,
      login,
      refresh: refreshAuth,
      me,
      setTokens,
      clearTokens
    },
    billing: {
      status: billingStatus,
      checkout: billingCheckout,
      portal: billingPortal
    }
  };
})();
