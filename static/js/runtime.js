(() => {
  'use strict';

  const CONFIG = Object.freeze({
    version: '4.0.0-skillui',
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
    online: navigator.onLine
  };

  const apiBase = () => location.protocol === 'file:' ? CONFIG.ari : '';
  const url = path => /^https?:/i.test(path) ? path : `${apiBase()}${path}`;
  const uuid = () => crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
      body: { access_code: accessCode }
    });
    await identity();
    return output;
  }

  async function signOut() {
    try {
      return await request(CONFIG.routes.session, { method: 'DELETE' });
    } finally {
      state.identity = { authenticated: false };
    }
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
        request(CONFIG.routes.health, { timeout: 5000, retries: 1 }),
        request(CONFIG.routes.ready, { timeout: 5000, retries: 1 })
      ]);
      element.dataset.online = 'true';
      element.textContent = `ARI · ${ready?.ok === false ? 'configuring' : 'online'} · GID ${CONFIG.ownerGid}`;
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
    status
  };
})();
