import { CapabilityController } from '/js/capability.js';

const VIEWPORT = document.querySelector('#ari-viewport');
const DOCK = document.querySelector('#liquid-dock');
const TITLE = document.querySelector('#shell-title');
const SUBTITLE = document.querySelector('#shell-subtitle');

const DOCK_ITEMS = [
  { key: 'mercury', glyph: '☿', label: 'Mercury', route: '/home/' },
  { key: 'interweb', glyph: '◎', label: 'Interweb', route: '/interweb/' },
  { key: 'augment', glyph: '◉', label: 'Syncori', route: '/syncori/' },
  { key: 'code', glyph: '⌨', label: 'Code', route: '/code/' },
  { key: 'scribe', glyph: '✒', label: 'Scribe', route: '/scribe/' },
  { key: 'optics', glyph: '◉', label: 'Optics', route: '/syncori/optics/' }
];

const STORE = {
  db: null,
  async open() {
    if (!('indexedDB' in window)) return null;
    if (this.db) return this.db;
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('jahorin-mercury-shell', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(() => null);
    return this.db;
  },
  async set(key, value) {
    const db = await this.open();
    if (!db) return;
    await new Promise(resolve => {
      const transaction = db.transaction('state', 'readwrite');
      transaction.objectStore('state').put(value, key);
      transaction.oncomplete = resolve;
      transaction.onerror = resolve;
    });
  }
};

let cleanupCurrent = () => {};
let manifest = null;
let navigationToken = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithBackoff(input, init = {}, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await window.fetch(input, { ...init, credentials: 'same-origin' });
      if (!response.ok) {
        const error = new Error(`UI route HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response;
    } catch (error) {
      lastError = error;
      const retryable = !error.status || error.status >= 500;
      if (!retryable || attempt === retries) throw error;
      await sleep(180 * (2 ** attempt));
    }
  }
  throw lastError;
}

async function loadManifest() {
  if (manifest) return manifest;
  const response = await fetchWithBackoff('/repo-pages.json', { cache: 'no-cache' }, 1);
  manifest = await response.json();
  return manifest;
}

function activeKey(route) {
  if (route.startsWith('/interweb')) return 'interweb';
  if (route.startsWith('/code')) return 'code';
  if (route.startsWith('/scribe')) return 'scribe';
  if (route.startsWith('/syncori/optics') || route.startsWith('/optics')) return 'optics';
  if (route.startsWith('/syncori') || route.startsWith('/augment')) return 'augment';
  return 'mercury';
}

function renderDock(route = '/home/') {
  DOCK.textContent = '';
  const active = activeKey(route);
  for (const item of DOCK_ITEMS) {
    const button = document.createElement('button');
    const glyph = document.createElement('span');
    glyph.className = 'glyph';
    glyph.textContent = item.glyph;
    button.type = 'button';
    button.dataset.route = item.route;
    button.setAttribute('aria-label', item.label);
    if (item.key === active) button.setAttribute('aria-current', 'page');
    button.append(glyph, document.createTextNode(item.label));
    button.addEventListener('click', () => navigate(item.route));
    DOCK.append(button);
  }
}

function setHeader(route, parsedDocument) {
  const pageBrand = parsedDocument.querySelector('.brand strong')?.textContent?.trim();
  const pageSubtitle = parsedDocument.querySelector('.brand')?.childNodes?.[1]?.textContent?.trim();
  TITLE.textContent = pageBrand || (route.startsWith('/syncori') ? 'SYNCORI' : 'Jahorin Mercury Timerunner');
  SUBTITLE.textContent = pageSubtitle || 'S.I.aaS · System Intelligence as a Service';
}

function bindHome() {
  const tae = VIEWPORT.querySelector('#tae');
  const auth = VIEWPORT.querySelector('#auth');
  tae?.addEventListener('click', async () => {
    try {
      const result = await Mercury.tae();
      Mercury.toast(result?.message || 'This is not an app. This is me.');
    } catch (error) {
      Mercury.toast(error.message);
    }
  });
  auth?.addEventListener('click', () => navigate('/gid/'));
}

function bindInterweb() {
  const input = VIEWPORT.querySelector('#q');
  const output = VIEWPORT.querySelector('#out');
  const askButton = VIEWPORT.querySelector('#ask');
  const ask = async () => {
    const query = input?.value.trim();
    if (!query) return;
    const looksUrl = /^(https?:\/\/|[\w-]+\.[a-z]{2,})(\/|$)/i.test(query);
    if (looksUrl) {
      window.open(/^https?:/.test(query) ? query : `https://${query}`, '_blank', 'noopener');
      return;
    }
    output?.classList.remove('hidden');
    if (output) output.textContent = 'Jahorin is working…';
    try {
      const result = await Mercury.dispatch('interweb', query, { prompt: query });
      if (output) output.textContent = result?.result?.text || result?.reply?.text || JSON.stringify(result, null, 2);
    } catch (error) {
      if (output) output.textContent = error.message;
    }
  };
  askButton?.addEventListener('click', ask);
  input?.addEventListener('keydown', event => {
    if (event.key === 'Enter') ask();
  });
}

function bindCode() {
  const prompt = VIEWPORT.querySelector('#prompt');
  const output = VIEWPORT.querySelector('#out');
  VIEWPORT.querySelector('#run')?.addEventListener('click', async () => {
    const value = prompt?.value.trim();
    if (!value) return;
    if (output) output.textContent = 'Executing through ARI…';
    try {
      const result = await Mercury.dispatch('code', value, { prompt: value });
      if (output) output.textContent = result?.result?.text || JSON.stringify(result, null, 2);
    } catch (error) {
      if (output) output.textContent = error.message;
    }
  });
  VIEWPORT.querySelector('#clear')?.addEventListener('click', () => {
    if (prompt) prompt.value = '';
    if (output) output.textContent = 'Ready.';
  });
}

function bindScribe() {
  const documentField = VIEWPORT.querySelector('#doc');
  const output = VIEWPORT.querySelector('#out');
  if (documentField) documentField.value = localStorage.getItem('mercury.scribe') || '';
  VIEWPORT.querySelector('#save')?.addEventListener('click', () => {
    localStorage.setItem('mercury.scribe', documentField?.value || '');
    Mercury.toast('Saved on this device.');
  });
  VIEWPORT.querySelector('#jahorin')?.addEventListener('click', async () => {
    const value = documentField?.value.trim();
    if (!value) return;
    output?.classList.remove('hidden');
    if (output) output.textContent = 'Jahorin is augmenting…';
    try {
      const result = await Mercury.dispatch('scribe', value, {
        prompt: `Help me develop this writing without losing my voice:\n\n${value}`
      });
      if (output) output.textContent = result?.result?.text || JSON.stringify(result, null, 2);
    } catch (error) {
      if (output) output.textContent = error.message;
    }
  });
}

function bindGid() {
  const input = VIEWPORT.querySelector('#code');
  VIEWPORT.querySelector('#auth')?.addEventListener('click', async () => {
    try {
      await Mercury.authenticate(input?.value || '');
      Mercury.toast('GID authenticated.');
      setTimeout(() => navigate('/home/'), 320);
    } catch (error) {
      Mercury.toast(error.message);
    }
  });
  VIEWPORT.querySelector('#public')?.addEventListener('click', () => navigate('/home/?demo=1'));
}

function bindLegacyAugment() {
  let recorder = null;
  let chunks = [];
  let blobUrl = null;
  let audioContext = null;
  const output = VIEWPORT.querySelector('#out');

  VIEWPORT.querySelector('#record')?.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => chunks.push(event.data);
      recorder.onstop = () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        blobUrl = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
        stream.getTracks().forEach(track => track.stop());
        if (output) output.textContent = 'Capture ready.';
      };
      recorder.start();
      if (output) output.textContent = 'Recording…';
    } catch (error) {
      if (output) output.textContent = error.message;
    }
  });

  VIEWPORT.querySelector('#stop')?.addEventListener('click', () => {
    if (recorder?.state === 'recording') recorder.stop();
  });

  VIEWPORT.querySelector('#play')?.addEventListener('click', () => {
    if (!blobUrl) {
      Mercury.toast('Record a clip first.');
      return;
    }
    new Audio(blobUrl).play();
  });

  VIEWPORT.querySelectorAll('.pad').forEach(button => {
    button.addEventListener('click', () => {
      audioContext ??= new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = Number(button.dataset.note);
      gain.gain.setValueAtTime(.12, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .25);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + .26);
    });
  });

  return () => {
    if (recorder?.state === 'recording') recorder.stop();
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  };
}

function bindLegacyOptics() {
  let stream = null;
  let lastData = null;
  const camera = VIEWPORT.querySelector('#cam');
  const poster = VIEWPORT.querySelector('#poster');
  const canvas = VIEWPORT.querySelector('#canvas');
  const output = VIEWPORT.querySelector('#out');

  const openCamera = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      camera.srcObject = stream;
      camera.classList.remove('hidden');
      poster?.classList.add('hidden');
      if (output) output.textContent = 'Camera live.';
    } catch (error) {
      if (output) output.textContent = error.message;
    }
  };

  const closeCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    if (camera) {
      camera.srcObject = null;
      camera.classList.add('hidden');
    }
    poster?.classList.remove('hidden');
    if (output) output.textContent = 'Camera closed.';
  };

  VIEWPORT.querySelector('#open')?.addEventListener('click', openCamera);
  VIEWPORT.querySelector('#exit')?.addEventListener('click', closeCamera);
  VIEWPORT.querySelector('#snap')?.addEventListener('click', () => {
    if (!stream) {
      Mercury.toast('Open the camera first.');
      return;
    }
    canvas.width = camera.videoWidth || 720;
    canvas.height = camera.videoHeight || 1280;
    canvas.getContext('2d').drawImage(camera, 0, 0, canvas.width, canvas.height);
    lastData = canvas.toDataURL('image/jpeg', .78);
    if (output) output.textContent = 'Frame captured.';
  });
  VIEWPORT.querySelector('#analyze')?.addEventListener('click', async () => {
    if (!lastData) {
      Mercury.toast('Capture a frame first.');
      return;
    }
    if (output) output.textContent = 'Sending visual intent to Jahorin…';
    try {
      const result = await Mercury.dispatch('vision', 'Analyze the captured camera frame contextually.', { image_data_url: lastData });
      if (output) output.textContent = result?.result?.text || JSON.stringify(result, null, 2);
    } catch (error) {
      if (output) output.textContent = error.message;
    }
  });

  return closeCamera;
}

function hydrate(route) {
  Mercury.state.surface = activeKey(route);
  Mercury.status();
  if (VIEWPORT.querySelector('syncori-capability')) return CapabilityController.mount(VIEWPORT);
  if (route.startsWith('/home')) bindHome();
  else if (route.startsWith('/interweb')) bindInterweb();
  else if (route.startsWith('/code')) bindCode();
  else if (route.startsWith('/scribe')) bindScribe();
  else if (route.startsWith('/gid') || route.startsWith('/onboarding')) bindGid();
  else if (route.startsWith('/augment')) return bindLegacyAugment();
  else if (route.startsWith('/optics')) return bindLegacyOptics();
  return () => {};
}

function wireRouteLinks() {
  VIEWPORT.querySelectorAll('[data-skillui-route]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      navigate(link.getAttribute('href'));
    });
  });
}

async function navigate(route, options = {}) {
  const target = route || '/home/';
  const token = ++navigationToken;
  cleanupCurrent();
  cleanupCurrent = () => {};
  VIEWPORT.classList.add('viewport-loading');
  VIEWPORT.setAttribute('aria-busy', 'true');

  try {
    await loadManifest().catch(() => null);
    const response = await fetchWithBackoff(target, { headers: { 'X-SkillUI-Viewport': '1' }, cache: 'no-cache' });
    const html = await response.text();
    if (token !== navigationToken) return;

    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const sourceViewport = parsed.querySelector('.viewport');
    if (!sourceViewport) throw new Error(`No viewport found for ${target}`);

    sourceViewport.querySelectorAll('.brand,.status').forEach(node => node.remove());
    VIEWPORT.replaceChildren(...Array.from(sourceViewport.childNodes).map(node => node.cloneNode(true)));
    VIEWPORT.className = sourceViewport.className.includes('viewport')
      ? `viewport shell-viewport ${sourceViewport.className.replace(/\bviewport\b/g, '').trim()}`
      : 'viewport shell-viewport';

    document.body.dataset.surface = parsed.body.dataset.surface || activeKey(target);
    setHeader(target, parsed);
    renderDock(target);
    wireRouteLinks();
    cleanupCurrent = hydrate(target);

    if (!options.popstate) history.pushState({ route: target }, '', target);
    STORE.set('lastRoute', target);
  } catch (error) {
    VIEWPORT.replaceChildren();
    const failure = document.createElement('section');
    failure.className = 'center-cta';
    const title = document.createElement('strong');
    title.textContent = 'Mercury route unavailable';
    const detail = document.createElement('p');
    detail.textContent = error.message;
    const home = document.createElement('button');
    home.type = 'button';
    home.className = 'action';
    home.textContent = 'Return Home';
    home.addEventListener('click', () => navigate('/home/'));
    failure.append(title, detail, home);
    VIEWPORT.append(failure);
  } finally {
    VIEWPORT.classList.remove('viewport-loading');
    VIEWPORT.setAttribute('aria-busy', 'false');
  }
}

function bindLanding() {
  const boot = document.querySelector('#boot');
  boot?.addEventListener('ended', () => { boot.poster = '/assets2/mercury.jpg'; });

  document.querySelector('#enter')?.addEventListener('click', async () => {
    const identity = await Mercury.identity();
    navigate(identity?.authenticated ? '/home/' : '/gid/');
  });

  document.querySelector('#demo')?.addEventListener('click', async () => {
    const message = document.querySelector('#tae-message');
    try {
      const result = await Mercury.tae();
      if (message) message.textContent = result?.message || result?.reply?.text || 'This is not an app. This is me.';
      Mercury.toast(result?.message || 'This is not an app. This is me.');
      setTimeout(() => navigate('/home/?demo=1'), 500);
    } catch (error) {
      Mercury.toast(error.message);
    }
  });
}

renderDock('/');
bindLanding();
Mercury.status();
loadManifest().catch(() => {});

globalThis.SkillUI = Object.freeze({ navigate, loadManifest, version: '1.0.0' });

window.addEventListener('popstate', event => {
  const route = event.state?.route || location.pathname + location.search;
  if (route === '/' || route === '') return;
  navigate(route, { popstate: true });
});

document.addEventListener('click', event => {
  const link = event.target.closest('a[data-skillui-route]');
  if (!link) return;
  event.preventDefault();
  navigate(link.getAttribute('href'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}), { once: true });
}
