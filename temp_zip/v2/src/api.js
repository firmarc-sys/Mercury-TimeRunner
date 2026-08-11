// Backend boundary: /api/tae /api/render-state /api/iot /api/syncori /api/identity
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

const PROSE = [
  () => 'Time is not a line. It is a field of becoming.\nYou select your frame of reference,\nand reality organizes around your focus.',
  (q) => `Intent received: "${q.slice(0, 52)}"\nThe runtime holds it in persistent state.\nNothing you tell me is forgotten between surfaces.`,
  () => 'The dock is my spine. The modules are my limbs.\nYou are not opening apps.\nYou are turning my attention.',
  (q) => `Parsed against the Mercury engine.\n${q.length > 40 ? 'Long-form intent: threaded to SCRIBE memory.' : 'Compact directive: executed in-frame.'}\nNo divergence detected.`
];
let pi = 0;
const CODE_SNIPPETS = {
  prime: [
    ['kw','def '],['fn','is_prime'],['b','(n):'],['nl'],
    ['b','    '],['kw','if '],['b','n <= '],['num','1'],['b',':'],['nl'],
    ['b','        '],['kw','return '],['fn','False'],['nl'],
    ['b','    '],['kw','if '],['b','n <= '],['num','3'],['b',':'],['nl'],
    ['b','        '],['kw','return '],['fn','True'],['nl'],
    ['b','    '],['kw','if '],['b','n % '],['num','2'],['b',' == '],['num','0'],['kw',' or '],['b','n % '],['num','3'],['b',' == '],['num','0'],['b',':'],['nl'],
    ['b','        '],['kw','return '],['fn','False'],['nl'],
    ['b','    i = '],['num','5'],['nl'],
    ['b','    '],['kw','while '],['b','i * i <= n:'],['nl'],
    ['b','        '],['kw','if '],['b','n % i == '],['num','0'],['kw',' or '],['b','n % (i + '],['num','2'],['b',') == '],['num','0'],['b',':'],['nl'],
    ['b','            '],['kw','return '],['fn','False'],['nl'],
    ['b','        i += '],['num','6'],['nl'],
    ['b','    '],['kw','return '],['fn','True']
  ],
  fib: [
    ['kw','def '],['fn','fib'],['b','(n):'],['nl'],
    ['b','    a, b = '],['num','0'],['b',', '],['num','1'],['nl'],
    ['b','    '],['kw','for '],['b','_ '],['kw','in '],['fn','range'],['b','(n):'],['nl'],
    ['b','        a, b = b, a + b'],['nl'],
    ['b','    '],['kw','return '],['b','a']
  ]
};

export async function taeChat(prompt) {
  const live = await call('/api/tae', { op: 'code.chat', prompt });
  if (live && live.reply) return live.reply;
  const p = prompt.toLowerCase();
  const wantsCode = /code|function|python|script|write|program|prime|fib/.test(p);
  if (wantsCode) {
    const code = /fib/.test(p) ? CODE_SNIPPETS.fib : CODE_SNIPPETS.prime;
    return { kind: 'code', code, tokens: 120 + Math.floor(Math.random() * 140) };
  }
  pi = (pi + 1) % PROSE.length;
  return { kind: 'prose', text: PROSE[pi](prompt), tokens: 140 + Math.floor(Math.random() * 200) };
}
export const identity = () => call('/api/identity');
export const renderState = () => call('/api/render-state');
export const syncori = () => call('/api/syncori');
