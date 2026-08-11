'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain' };
const PROSE = [
  'Time is not a line. It is a field of becoming.\nYou select your frame of reference,\nand reality organizes around your focus.',
  'The dock is my spine. The modules are my limbs.\nYou are not opening apps. You are turning my attention.',
  'Persistent intelligence means I was listening\nbefore you pressed anything.'
];
let pi = 0;
function api(req, res, body) {
  const send = (o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  const u = req.url.split('?')[0];
  if (u === '/api/tae' && req.method === 'POST') {
    let p = {}; try { p = JSON.parse(body || '{}'); } catch {}
    if (p.op === 'code.chat') {
      const q = String(p.prompt || '');
      if (/code|function|python|script|write|program|prime|fib/i.test(q)) return send({ reply: null });
      pi = (pi + 1) % PROSE.length;
      return send({ reply: { kind: 'prose', text: PROSE[pi], tokens: 140 + Math.floor(Math.random() * 180) } });
    }
    return send({ ok: true });
  }
  if (u === '/api/render-state') return send({ state: 'ok', modules: ['mercury','interweb','augment','code','scribe','optics'], ts: Date.now() });
  if (u === '/api/identity') return send({ user: 'Jorge Delgado', gid: '399152573423', tier: 'persistent', engine: 'mercury' });
  if (u === '/api/iot') return send({ devices: [], status: 'standby' });
  if (u === '/api/syncori') return send({ sync: 'idle', bpm: 120, key: 'A minor', lastPulse: Date.now() });
  res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"not found"}');
}
http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    let body = ''; req.on('data', (d) => { body += d; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => api(req, res, body)); return;
  }
  let p; try { p = decodeURIComponent(req.url.split('?')[0]); } catch { p = '/'; }
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) { res.writeHead(400); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { file = path.join(ROOT, 'index.html'); st = fs.statSync(file); }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': type === 'video/mp4' ? 'public, max-age=86400' : 'public, max-age=300' };
    const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range.trim());
    if (range && (range[1] || range[2])) {
      let start = range[1] ? parseInt(range[1], 10) : null, end = range[2] ? parseInt(range[2], 10) : null;
      if (start === null) { start = Math.max(st.size - end, 0); end = st.size - 1; } else if (end === null) end = st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      end = Math.min(end, st.size - 1);
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, '0.0.0.0', () => console.log('JAHORIN Mercury v2 on ' + PORT));
