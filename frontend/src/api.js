// ARI backend boundary. No provider credentials belong in this file.
const TIMEOUT = 50000;

async function call(path, body) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        'X-Request-Id': crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal: ctl.signal
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = payload.error || payload.detail || `ARI HTTP ${res.status}`;
      throw new Error(message);
    }
    return payload;
  } finally {
    clearTimeout(t);
  }
}

export async function taeChat(prompt) {
  try {
    const live = await call('/api/tae', { op: 'code.chat', prompt });
    if (live?.reply) return live.reply;
    throw new Error('ARI returned no TAE reply');
  } catch (error) {
    return {
      kind: 'prose',
      text: `ARI unavailable: ${error instanceof Error ? error.message : 'runtime request failed'}`,
      tokens: 0,
      degraded: true
    };
  }
}

export const runtime = (envelope) => call('/api/runtime', envelope);
export const identity = () => call('/api/identity');
export const renderState = (state) => state ? call('/api/render-state', { state }) : call('/api/render-state');
export const iot = (payload) => payload ? call('/api/iot', payload) : call('/api/iot');
export const syncori = (payload) => payload ? call('/api/syncori', payload) : call('/api/syncori');
export const health = () => call('/health');
export const ready = () => call('/ready');
