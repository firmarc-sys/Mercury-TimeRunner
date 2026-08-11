import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AUG } from '../geo.js';
import { Dock, HomeHit, FlashButton, Knob } from '../components/Common.jsx';
import { ensureAudio, playPad, setMasterVolume, setParam, getLevel } from '../audio.js';

const LOOP_LEN = 4.0;

export default function Augment({ go, data, setData }) {
  const [vol, setVol] = useState(data.vol ?? 0.8);
  const [k, setK] = useState(data.k ?? { k1: 0.7, k2: 0.5, k3: 0.3 });
  const [fader, setFader] = useState(data.fader ?? 0.5);
  const [dataKnob, setDataKnob] = useState(data.dataKnob ?? 0.5);
  const [litPads, setLitPads] = useState({});
  const [toggles, setToggles] = useState(data.toggles ?? { loop: true, sample: true });
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const waveCvs = useRef(null); const ledCvs = useRef(null);
  const loopEvents = useRef(data.loopEvents || []);
  const recStart = useRef(0);
  const playState = useRef({ on: false, t0: 0, timer: null });

  useEffect(() => () => setData({ vol, k, fader, dataKnob, toggles, loopEvents: loopEvents.current }), [vol, k, fader, dataKnob, toggles]);
  useEffect(() => { setMasterVolume(vol); }, [vol]);
  useEffect(() => { setParam('cutoff', k.k1); setParam('pitch', k.k2 * 0.6 + fader * 0.4); setParam('space', k.k3); }, [k, fader]);

  const hitPad = useCallback((i) => {
    ensureAudio(); playPad(i);
    setLitPads((p) => ({ ...p, [i]: true }));
    setTimeout(() => setLitPads((p) => { const n = { ...p }; delete n[i]; return n; }), 160);
    if (recording) loopEvents.current.push({ t: ((performance.now() - recStart.current) / 1000) % LOOP_LEN, pad: i });
  }, [recording]);

  const startPlay = () => {
    if (playState.current.on) return;
    ensureAudio(); playState.current.on = true; playState.current.t0 = performance.now();
    setPlaying(true);
    const tick = () => {
      if (!playState.current.on) return;
      const now = performance.now();
      const pos = ((now - playState.current.t0) / 1000) % LOOP_LEN;
      for (const ev of loopEvents.current) {
        const d = ev.t - pos;
        if (d >= 0 && d < 0.05 && !ev.f) { playPad(ev.pad, d); ev.f = true; setTimeout(() => { ev.f = false; }, 300); }
      }
      playState.current.timer = requestAnimationFrame(tick);
    };
    tick();
  };
  const stopAll = () => {
    playState.current.on = false;
    if (playState.current.timer) cancelAnimationFrame(playState.current.timer);
    setPlaying(false); setRecording(false);
  };
  useEffect(() => () => stopAll(), []);

  useEffect(() => {
    const c = waveCvs.current; if (!c) return;
    const ctx = c.getContext('2d');
    let seed = 99; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const bars = Array.from({ length: 120 }, (_, i) => {
      const env = Math.sin((i / 120) * Math.PI) * 0.75 + 0.25;
      return env * (0.25 + rnd() * 0.75);
    });
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = 'rgba(8,12,18,0.72)';
      ctx.beginPath(); ctx.roundRect(0, 0, c.width, c.height, 8); ctx.fill();
      const y0 = c.height / 2;
      for (let i = 0; i < bars.length; i++) {
        const x = 8 + (i / bars.length) * (c.width - 16);
        const h = bars[i] * (c.height / 2 - 8);
        const g = ctx.createLinearGradient(0, y0 - h, 0, y0 + h);
        g.addColorStop(0, '#60cbff'); g.addColorStop(0.5, '#3779d8'); g.addColorStop(1, '#2a5dab');
        ctx.fillStyle = g;
        ctx.fillRect(x, y0 - h, 2.2, h * 2);
      }
      if (playState.current.on) {
        const pos = (((performance.now() - playState.current.t0) / 1000) % LOOP_LEN) / LOOP_LEN;
        const px = 8 + pos * (c.width - 16);
        ctx.shadowColor = '#60cbff'; ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(240,248,255,0.9)'; ctx.fillRect(px, 4, 2, c.height - 8);
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const c = ledCvs.current; if (!c) return;
    const ctx = c.getContext('2d');
    let raf, smooth = 0;
    const draw = () => {
      const lv = getLevel(); smooth = smooth * 0.8 + lv * 0.2;
      ctx.clearRect(0, 0, c.width, c.height);
      const segs = 12;
      for (let ch = 0; ch < 2; ch++) {
        const jitter = ch ? 0.92 : 1;
        const lit = Math.round(segs * Math.min(1, smooth * 2.4 * jitter));
        for (let s = 0; s < segs; s++) {
          const y = c.height - 8 - s * (c.height - 12) / segs;
          const on = s < lit;
          ctx.fillStyle = !on ? 'rgba(60,70,60,0.5)' : s > segs - 3 ? '#fe7f5e' : s > segs - 6 ? '#fdb24f' : '#7ddc7a';
          ctx.globalAlpha = on ? 1 : 0.35;
          ctx.fillRect(4 + ch * 20, y - 7, 12, 8);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const faderRef = useRef(null);
  useEffect(() => {
    const el = faderRef.current; if (!el) return;
    let drag = null;
    const down = (e) => { drag = { y: e.clientY, v: fader }; el.setPointerCapture(e.pointerId); e.preventDefault(); };
    const move = (e) => {
      if (!drag) return;
      const scale = parseFloat(document.querySelector('.stage')?.dataset.scale || '1');
      setFader(Math.max(0, Math.min(1, drag.v - (drag.y - e.clientY) / scale / (AUG.fader.slotH - AUG.fader.thumbH))));
    };
    const up = () => { drag = null; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, [fader]);

  const pads = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const i = row * 4 + col;
    const x = AUG.padGrid.x + col * (AUG.padGrid.padW + AUG.padGrid.gapX);
    const y = AUG.padGrid.y + row * (AUG.padGrid.padH + AUG.padGrid.gapY);
    pads.push({ i, x, y });
  }
  const B = AUG.buttons, T = AUG.transport;
  const fy = AUG.fader.slotY + (1 - fader) * (AUG.fader.slotH - AUG.fader.thumbH);
  const toggle = (key) => setToggles((t) => ({ ...t, [key]: !t[key] }));

  return (
    <div className="module" style={{ backgroundImage: 'url(/assets/aug_bg.jpg)' }}>
      <canvas ref={waveCvs} className="overlay" width={AUG.wave.w - 30} height={AUG.wave.h - 92}
        style={{ left: AUG.wave.x + 15, top: AUG.wave.y + 42, borderRadius: 8 }} />
      <canvas ref={ledCvs} className="overlay" width={AUG.leds.w + 8} height={AUG.leds.h}
        style={{ left: AUG.leds.x - 4, top: AUG.leds.y }} />
      {recording && (
        <div style={{ position: 'absolute', left: AUG.live.x - 14, top: AUG.live.y + 2, width: 12, height: 12, borderRadius: '50%', background: '#fe4f3e', boxShadow: '0 0 12px 3px rgba(254,80,60,0.8)', animation: 'blink 0.8s steps(1) infinite' }} />
      )}
      <Knob {...AUG.mainVol} value={vol} onChange={setVol} />
      <Knob {...AUG.k1} value={k.k1} onChange={(v) => setK({ ...k, k1: v })} />
      <Knob {...AUG.k2} value={k.k2} onChange={(v) => setK({ ...k, k2: v })} />
      <Knob {...AUG.k3} value={k.k3} onChange={(v) => setK({ ...k, k3: v })} />
      <Knob {...AUG.dataKnob} value={dataKnob} onChange={setDataKnob} />
      <div className="knob-ring" style={{ left: AUG.dataKnob.cx - AUG.dataKnob.r - 3, top: AUG.dataKnob.cy - AUG.dataKnob.r - 3, width: AUG.dataKnob.r * 2 + 6, height: AUG.dataKnob.r * 2 + 6 }} />
      {pads.map(({ i, x, y }) => (
        <React.Fragment key={i}>
          <div className="hit" style={{ left: x, top: y, width: AUG.padGrid.padW, height: AUG.padGrid.padH, borderRadius: 10, touchAction: 'none' }}
            onPointerDown={(e) => { e.preventDefault(); hitPad(i); }} />
          {litPads[i] && <div className="pad-lit" style={{ left: x, top: y, width: AUG.padGrid.padW, height: AUG.padGrid.padH }} />}
        </React.Fragment>
      ))}
      <div ref={faderRef} className="fader-thumb"
        style={{ left: AUG.fader.slotX - (AUG.fader.thumbW - AUG.fader.slotW) / 2, top: fy, width: AUG.fader.thumbW, height: AUG.fader.thumbH }} />
      {['trim','tune','filter','sample','seq','padfx','roomfx','shift','padbank','erase','noterep','chop','mote','ssel','tap','undo','redo','stop2'].map((key) => (
        <FlashButton key={key} rect={B[key]} onTap={() => {
          if (key === 'erase') { loopEvents.current = []; }
          if (key === 'undo') { loopEvents.current.pop(); }
          if (key === 'tap') { ensureAudio(); playPad(13); }
        }} />
      ))}
      <FlashButton rect={B.loop} sticky active={toggles.loop} onTap={() => toggle('loop')} />
      <FlashButton rect={B.level} sticky active={!!toggles.level} onTap={() => toggle('level')} />
      <FlashButton rect={B.srec} sticky active={recording} onTap={() => { setRecording(!recording); if (!recording) { recStart.current = performance.now(); } }} />
      <FlashButton rect={B.qrec} sticky active={!!toggles.qrec} onTap={() => toggle('qrec')} />
      <FlashButton rect={B.play2} onTap={startPlay} />
      <FlashButton rect={T.rec} sticky active={recording} radius={22}
        onTap={() => { setRecording(!recording); if (!recording) { recStart.current = performance.now(); startPlay(); } }} />
      <FlashButton rect={T.overdub} radius={22} onTap={() => { setRecording(true); recStart.current = performance.now() - (playState.current.on ? (performance.now() - playState.current.t0) % (LOOP_LEN * 1000) : 0); startPlay(); }} />
      <FlashButton rect={T.stop} radius={22} onTap={stopAll} />
      <FlashButton rect={T.play} sticky active={playing} radius={22} onTap={startPlay} />
      <FlashButton rect={T.pstart} radius={22} onTap={() => { playState.current.t0 = performance.now(); startPlay(); }} />
      <HomeHit go={go} />
      <Dock tiles={AUG.tiles} active="augment" go={go} pill={AUG.pill} />
    </div>
  );
}
