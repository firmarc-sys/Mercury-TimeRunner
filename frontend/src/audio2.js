// SYNCORI loop engine — six synthesized stem loops, tempo-synced WebAudio scheduler.
let ctx = null, master = null, analyser = null;
const tracks = [];            // per-track gain nodes
let bpm = 120;
let playing = false;
let startTime = 0;
let nextStep = 0;
let timer = null;
const STEPS = 32;             // 2 bars of 16ths
const active = [false, false, false, false, false, false];

export function ensureAudio() {
  if (ctx) return true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.85;
    analyser = ctx.createAnalyser(); analyser.fftSize = 256;
    master.connect(analyser); analyser.connect(ctx.destination);
    for (let i = 0; i < 6; i++) {
      const g = ctx.createGain(); g.gain.value = 0.8; g.connect(master); tracks.push(g);
    }
    return true;
  } catch { return false; }
}
export const setMaster = (v) => { if (master) master.gain.value = v; };
export const setTrackGain = (i, v) => { if (tracks[i]) tracks[i].gain.value = v; };
export const setBpm = (v) => { bpm = Math.max(60, Math.min(180, Math.round(v))); };
export const getBpm = () => bpm;
export const toggleTrack = (i) => { active[i] = !active[i]; return active[i]; };
export const setTrack = (i, on) => { active[i] = on; };
export const getActive = () => [...active];
export const isPlaying = () => playing;
export const loopSeconds = () => STEPS * (60 / bpm / 4);
export const position = () => (!playing || !ctx) ? 0 : ((ctx.currentTime - startTime) % loopSeconds());
export function getLevel() {
  if (!analyser) return 0;
  const a = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(a);
  let s = 0; for (const v of a) s += v;
  return s / a.length / 255;
}

function noise(dur) {
  const buf = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let n = 0; n < d.length; n++) d[n] = (Math.random() * 2 - 1) * Math.pow(1 - n / d.length, 2);
  const s = ctx.createBufferSource(); s.buffer = buf; return s;
}

const BASS = [55, 0, 55, 0, 82.4, 0, 55, 0, 65.4, 0, 55, 0, 49, 0, 55, 0];
const ARP = [220, 261.6, 329.6, 440, 329.6, 261.6];

function schedule(track, step, t) {
  const out = tracks[track];
  if (track === 0) { // kick
    if (step % 4 !== 0) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.15);
    g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.32);
  } else if (track === 1) { // snare + hats
    if (step % 8 === 4) {
      const s = noise(0.18), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      bp.type = 'bandpass'; bp.frequency.value = 1800; g.gain.value = 0.7;
      s.connect(bp); bp.connect(g); g.connect(out); s.start(t);
    }
    if (step % 2 === 0) {
      const s = noise(0.05), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      hp.type = 'highpass'; hp.frequency.value = 7000; g.gain.value = step % 4 === 2 ? 0.35 : 0.2;
      s.connect(hp); hp.connect(g); g.connect(out); s.start(t);
    }
  } else if (track === 2) { // bass
    const f = BASS[step % 16]; if (!f) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 420;
    g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.24);
  } else if (track === 3) { // Am chord stabs
    if (step % 16 !== 0 && step % 16 !== 10) return;
    for (const f of [220, 261.6, 329.6]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.36);
    }
  } else if (track === 4) { // arp
    const f = ARP[step % ARP.length];
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f * 2; lp.type = 'lowpass'; lp.frequency.value = 3600;
    g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.15);
  } else if (track === 5) { // pad swell each bar
    if (step % 16 !== 0) return;
    const dur = 60 / bpm * 4;
    for (const f of [110, 164.8, 220]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f;
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(200, t); lp.frequency.linearRampToValueAtTime(2400, t + dur / 2);
      lp.frequency.linearRampToValueAtTime(300, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + dur / 3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    }
  }
}

export function play() {
  if (!ensureAudio()) return;
  if (ctx.state === 'suspended') ctx.resume();
  if (playing) return;
  playing = true;
  startTime = ctx.currentTime + 0.06;
  nextStep = 0;
  timer = setInterval(() => {
    const stepDur = 60 / bpm / 4;
    const horizon = ctx.currentTime + 0.14;
    while (startTime + nextStep * stepDur < horizon) {
      const t = startTime + nextStep * stepDur;
      const s = nextStep % STEPS;
      for (let i = 0; i < 6; i++) if (active[i]) schedule(i, s, t);
      nextStep++;
    }
  }, 25);
}
export function stop() {
  playing = false;
  if (timer) { clearInterval(timer); timer = null; }
}
export function tapClick() {
  if (!ensureAudio()) return;
  const t = ctx.currentTime;
  const s = noise(0.03), g = ctx.createGain(); g.gain.value = 0.3;
  s.connect(g); g.connect(master); s.start(t);
}
