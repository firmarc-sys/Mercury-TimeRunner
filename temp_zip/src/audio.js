let ctx = null, master = null, analyser = null;
export function ensureAudio() {
  if (ctx) return true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.8;
    analyser = ctx.createAnalyser(); analyser.fftSize = 256;
    master.connect(analyser); analyser.connect(ctx.destination);
    return true;
  } catch { return false; }
}
export function setMasterVolume(v) { if (master) master.gain.value = Math.max(0, Math.min(1, v)); }
export function getLevel() {
  if (!analyser) return 0;
  const a = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(a);
  let s = 0; for (const v of a) s += v;
  return s / a.length / 255;
}
let params = { cutoff: 0.7, pitch: 0.5, space: 0.3 };
export function setParam(k, v) { params[k] = v; }
export function playPad(i, when = 0) {
  if (!ensureAudio()) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + when;
  const out = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = 300 + params.cutoff * 12000;
  out.connect(filt); filt.connect(master);
  const pr = 0.5 + params.pitch;
  const row = Math.floor(i / 4), col = i % 4;
  if (row === 3) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.setValueAtTime((col === 0 ? 160 : 120 + col * 25) * pr, t);
    o.frequency.exponentialRampToValueAtTime(35 * pr, t + 0.18);
    g.gain.setValueAtTime(1.0, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
  } else if (row === 2) {
    const dur = 0.22;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let n = 0; n < d.length; n++) d[n] = (Math.random() * 2 - 1) * Math.pow(1 - n / d.length, 1.6);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = (1200 + col * 500) * pr;
    const g = ctx.createGain(); g.gain.value = 0.85;
    src.connect(bp); bp.connect(g); g.connect(out); src.start(t);
  } else if (row === 1) {
    const dur = col % 2 ? 0.3 : 0.08;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let n = 0; n < d.length; n++) d[n] = (Math.random() * 2 - 1) * Math.pow(1 - n / d.length, 3);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = ctx.createGain(); g.gain.value = 0.5;
    src.connect(hp); hp.connect(g); g.connect(out); src.start(t);
  } else {
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const o2 = ctx.createOscillator(); o2.type = 'square';
    const base = [220, 262, 330, 392][col] * pr;
    o.frequency.setValueAtTime(base, t); o2.frequency.setValueAtTime(base * 1.005, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass';
    f2.frequency.setValueAtTime(3500, t); f2.frequency.exponentialRampToValueAtTime(500, t + 0.25);
    o.connect(g); o2.connect(g); g.connect(f2); f2.connect(out);
    o.start(t); o2.start(t); o.stop(t + 0.3); o2.stop(t + 0.3);
  }
  if (params.space > 0.05) {
    const dl = ctx.createDelay(); dl.delayTime.value = 0.16;
    const fb = ctx.createGain(); fb.gain.value = params.space * 0.5;
    const wet = ctx.createGain(); wet.gain.value = params.space * 0.4;
    filt.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
  }
}
export function shutterClick() {
  if (!ensureAudio()) return;
  const t = ctx.currentTime;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let n = 0; n < d.length; n++) d[n] = (Math.random() * 2 - 1) * Math.pow(1 - n / d.length, 8);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = 0.4;
  src.connect(g); g.connect(master); src.start(t);
}
