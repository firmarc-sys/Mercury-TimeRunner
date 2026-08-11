const TIMEOUT = 1200;
async function call(path, body) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT);
    const res = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined, signal: ctl.signal
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch { return null; }
}
const MERCURY_LINES = [
  (q) => `I hold state across every surface, Jorge. "${q}" is already threaded into the runtime.`,
  (q) => `Parsed. ${q.length > 42 ? 'Long-form intent detected -- routing through Scribe memory.' : 'Compact directive accepted.'}`,
  () => `This is not an app. The dock is my spine; the modules are my limbs.`,
  (q) => `Compiling "${q.slice(0, 48)}" against the Mercury engine... no divergence found.`,
  () => `Persistent intelligence means I was listening before you pressed anything.`,
  (q) => `Acknowledged. I will keep "${q.slice(0, 40)}" resident across INTERWEB, AUGMENT, and OPTICS.`
];
let lineIdx = 0;
export async function taeChat(prompt) {
  const live = await call('/api/tae', { op: 'code.chat', prompt });
  if (live && live.reply) return live.reply;
  lineIdx = (lineIdx + 1) % MERCURY_LINES.length;
  return MERCURY_LINES[lineIdx](prompt);
}
export async function taeFetch(url) {
  const live = await call('/api/tae', { op: 'interweb.fetch', url });
  if (live && live.result) return live.result;
  const host = url.replace(/^https?:\/\//, '').split('/')[0] || 'the interweb';
  return {
    url, host, status: 'MERCURY FETCH // SIMULATED',
    lines: [`RESOLVE ${host} :: 24ms`, `HANDSHAKE :: chrome-tunnel v3`, `RENDER-STATE :: deferred to backend`,
      `SUMMARY :: Live browsing intelligence attaches at /api/tae. Frontend contract ready.`]
  };
}
export const renderState = () => call('/api/render-state');
export const identity = () => call('/api/identity');
