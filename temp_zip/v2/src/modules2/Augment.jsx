import React, { useState, useEffect, useRef } from 'react';
import { AUG } from '../geo2.js';
import { Hit, CircleHit, CircleFlash, FlashButton, Knob, Toast } from '../components/Common.jsx';
import * as A from '../audio2.js';

export default function Augment({ go, data, setData }) {
  const [masterV, setMasterV] = useState(data.masterV ?? 0.85);
  const [inputV, setInputV] = useState(data.inputV ?? 0.5);
  const [bpmV, setBpmV] = useState(data.bpmV ?? A.getBpm());
  const [levels, setLevels] = useState(data.levels ?? [0.8, 0.8, 0.8, 0.8, 0.8, 0.8]);
  const [activeTracks, setActiveTracks] = useState(A.getActive());
  const [playing, setPlaying] = useState(A.isPlaying());
  const [armed, setArmed] = useState(false);
  const [fx, setFx] = useState(false);
  const [toast, setToast] = useState(null);
  const dispCvs = useRef(null);
  const hist = useRef({ undo: [], redo: [] });
  const taps = useRef([]);

  useEffect(() => () => setData({ masterV, inputV, bpmV, levels }), [masterV, inputV, bpmV, levels]);
  useEffect(() => { A.setMaster(masterV); }, [masterV]);
  useEffect(() => { A.setBpm(bpmV); }, [bpmV]);
  useEffect(() => { levels.forEach((v, i) => A.setTrackGain(i, v)); }, [levels]);

  const say = (t) => { setToast(t); setTimeout(() => setToast(null), 2200); };

  const togglePad = (i) => {
    A.ensureAudio();
    hist.current.undo.push(A.getActive()); hist.current.redo = [];
    const on = A.toggleTrack(i);
    setActiveTracks(A.getActive());
    if (on && !A.isPlaying()) { A.play(); setPlaying(true); }
  };
  const undo = () => {
    const prev = hist.current.undo.pop(); if (!prev) return;
    hist.current.redo.push(A.getActive());
    prev.forEach((on, i) => A.setTrack(i, on)); setActiveTracks(A.getActive());
  };
  const redo = () => {
    const nxt = hist.current.redo.pop(); if (!nxt) return;
    hist.current.undo.push(A.getActive());
    nxt.forEach((on, i) => A.setTrack(i, on)); setActiveTracks(A.getActive());
  };
  const tapTempo = () => {
    A.tapClick();
    const now = performance.now();
    taps.current = taps.current.filter((t) => now - t < 3000); taps.current.push(now);
    if (taps.current.length >= 3) {
      const iv = [];
      for (let i = 1; i < taps.current.length; i++) iv.push(taps.current[i] - taps.current[i - 1]);
      setBpmV(Math.max(60, Math.min(180, Math.round(60000 / (iv.reduce((a, b) => a + b) / iv.length)))));
    }
  };

  // live LCD
  useEffect(() => {
    const c = dispCvs.current; if (!c) return;
    const ctx = c.getContext('2d');
    let raf;
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const wf = Array.from({ length: 90 }, () => 0.15 + rnd() * 0.85);
    const draw = () => {
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0d12'); bg.addColorStop(0.12, '#04060a'); bg.addColorStop(1, '#020305');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
      const gloss = ctx.createLinearGradient(0, 0, 0, H * 0.3);
      gloss.addColorStop(0, 'rgba(200,220,240,0.10)'); gloss.addColorStop(1, 'rgba(200,220,240,0)');
      ctx.fillStyle = gloss; ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H * 0.3, 16); ctx.fill();
      const act = A.getActive(); const first = act.findIndex(Boolean);
      ctx.fillStyle = '#cfd9e4'; ctx.font = '600 19px -apple-system,sans-serif';
      ctx.fillText(first >= 0 ? `LOOP ${first + 1}` : 'LOOP —', 20, 34);
      ctx.textAlign = 'right'; ctx.fillText('A MINOR', W - 20, 34); ctx.textAlign = 'left';
      const pos = A.position(), len = A.loopSeconds();
      const mm = String(Math.floor(pos / 60)).padStart(2, '0');
      const ss = String(Math.floor(pos % 60)).padStart(2, '0');
      const cs = String(Math.floor((pos % 1) * 100)).padStart(2, '0');
      ctx.fillStyle = '#f2f6fa'; ctx.font = '700 40px ui-monospace,Menlo,monospace';
      ctx.fillText(`00:${ss}.${cs}`, 20, 92);
      ctx.fillStyle = '#8d99a6'; ctx.font = '500 16px ui-monospace,monospace';
      ctx.fillText(`/ 00:${String(Math.round(len)).padStart(2, '0')}.00`, 22, 118);
      // progress ring
      const rc = { x: W - 62, y: 92, r: 38 };
      ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(200,215,230,0.18)';
      ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#e8f0f8'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r, -Math.PI / 2, -Math.PI / 2 + (pos / len) * Math.PI * 2); ctx.stroke();
      // waveform
      const wy = 158, wh = 38;
      for (let i = 0; i < wf.length; i++) {
        const x = 18 + i * ((W - 36) / wf.length);
        let h = wf[i] * wh;
        if (A.isPlaying()) h *= 0.7 + 0.5 * A.getLevel() * (1 + Math.sin(i * 0.7 + performance.now() / 90));
        h = Math.max(2, Math.min(wh, h));
        ctx.fillStyle = i / wf.length < pos / len ? '#e8f0f8' : 'rgba(200,215,230,0.45)';
        ctx.fillRect(x, wy - h / 2, 2.4, h);
      }
      ctx.fillStyle = '#cfd9e4'; ctx.font = '600 17px -apple-system,sans-serif';
      ctx.fillText(`${A.getBpm()} BPM`, 20, H - 16);
      ctx.textAlign = 'right'; ctx.fillText('4/4', W - 20, H - 16); ctx.textAlign = 'left';
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const D = AUG.display;
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets2/augment.jpg)' }}>
      <canvas ref={dispCvs} className="overlay" width={D.w - 8} height={D.h - 8}
        style={{ left: D.x + 4, top: D.y + 4, borderRadius: 18 }} />
      <Knob {...AUG.master} value={masterV} onChange={setMasterV} />
      <Knob {...AUG.input} value={inputV} onChange={setInputV} />
      <Knob {...AUG.bpmKnob} value={(bpmV - 60) / 120} onChange={(v) => setBpmV(Math.round(60 + v * 120))} />
      <Knob {...AUG.tempo} value={(bpmV - 60) / 120} onChange={(v) => setBpmV(Math.round(60 + v * 120))} />
      {AUG.trackKnobs.map((k, i) => (
        <Knob key={i} {...k} value={levels[i]} onChange={(v) => setLevels(levels.map((x, j) => (j === i ? v : x)))} />
      ))}
      <CircleFlash {...AUG.transport.undo} onTap={undo} />
      <CircleFlash {...AUG.transport.rec} sticky active={armed} onTap={() => { setArmed(!armed); A.ensureAudio(); }} />
      <CircleFlash {...AUG.transport.play} sticky active={playing} onTap={() => { A.play(); setPlaying(true); }} />
      <CircleFlash {...AUG.transport.stop} onTap={() => { A.stop(); setPlaying(false); }} />
      <CircleFlash {...AUG.transport.redo} onTap={redo} />
      {AUG.pads.map((p, i) => (
        <FlashButton key={i} rect={p} radius={26} sticky active={activeTracks[i]} onTap={() => togglePad(i)} />
      ))}
      <FlashButton rect={AUG.fxEdit} radius={16} sticky active={fx} onTap={() => setFx(!fx)} />
      <FlashButton rect={AUG.minus} radius={10} onTap={() => setBpmV((b) => Math.max(60, b - 1))} />
      <FlashButton rect={AUG.plus} radius={10} onTap={() => setBpmV((b) => Math.min(180, b + 1))} />
      <FlashButton rect={AUG.bounce} radius={20} onTap={() => say(`BOUNCED :: MIXDOWN 00:${String(Math.round(A.loopSeconds())).padStart(2, '0')}.00 @ ${A.getBpm()} BPM`)} />
      <FlashButton rect={AUG.tap} radius={20} onTap={tapTempo} />
      <Hit rect={AUG.homeHit} title="SYNCORI — home" onTap={() => go('mercury')} />
      <Toast text={toast} />
    </div>
  );
}
