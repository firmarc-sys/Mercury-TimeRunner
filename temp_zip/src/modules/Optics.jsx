import React, { useState, useRef, useEffect } from 'react';
import { OPTICS, rectStyle } from '../geo.js';
import { HomeHit, Hit, Knob, StatusPill } from '../components/Common.jsx';
import { shutterClick } from '../audio.js';

export default function Optics({ go, data, setData }) {
  const [knobs, setKnobs] = useState(data.knobs ?? { shutter: 0.45, iso: 0.35, aperture: 0.6, wb: 0.5 });
  const [wbOn, setWbOn] = useState(data.wbOn ?? true);
  const [flash, setFlash] = useState(false);
  const [shots, setShots] = useState(data.shots ?? 0);
  const [liveCam, setLiveCam] = useState(false);
  const videoRef = useRef(null);
  const hudCvs = useRef(null);
  useEffect(() => () => setData({ knobs, wbOn, shots }), [knobs, wbOn, shots]);
  useEffect(() => {
    let stream = null, dead = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (dead) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (videoRef.current) { videoRef.current.srcObject = stream; setLiveCam(true); }
      } catch { }
    })();
    return () => { dead = true; if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);
  useEffect(() => {
    const c = hudCvs.current; if (!c) return;
    const ctx = c.getContext('2d');
    const A = '#fedb61';
    let seed = 31; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const bars = Array.from({ length: 26 }, () => 0.2 + rnd() * 0.8);
    let raf, t = 0;
    const G1 = OPTICS.hud1, G2 = OPTICS.hud2;
    const gauge = (cx, cy, r, frac, big, label) => {
      ctx.strokeStyle = 'rgba(254,219,97,0.25)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(cx, cy, r - 8, -Math.PI * 0.75, Math.PI * 0.75); ctx.stroke();
      ctx.strokeStyle = A; ctx.shadowColor = A; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(cx, cy, r - 8, -Math.PI * 0.75, -Math.PI * 0.75 + frac * Math.PI * 1.5); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = A; ctx.font = `700 ${big ? 30 : 26}px -apple-system, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy + 10); ctx.textAlign = 'left';
    };
    const txt = (s, x, y, size = 15, dim = false) => {
      ctx.fillStyle = dim ? 'rgba(254,219,97,0.55)' : A;
      ctx.font = `${dim ? 500 : 700} ${size}px -apple-system, sans-serif`;
      ctx.fillText(s, x, y);
    };
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, c.width, c.height);
      const j = (a, b) => (a + Math.sin(t * b) * a * 0.015).toFixed(2);
      gauge(OPTICS.gaugeL.cx - G1.x, OPTICS.gaugeL.cy - G1.y, OPTICS.gaugeL.r, 0.55 + 0.05 * Math.sin(t), true, '138');
      gauge(OPTICS.gaugeR.cx - G1.x, OPTICS.gaugeR.cy - G1.y, OPTICS.gaugeR.r, 0.5 + 0.04 * Math.cos(t * 0.8), false, '50');
      txt('NODE', 172, 28, 13, true); txt(j(13.24, 1.1) + ' MPH', 172, 52, 18);
      txt('DISTANCE', 322, 28, 13, true); txt(j(12.54, 0.7) + ' KM', 322, 52, 18);
      txt('ALTITUDE', 468, 28, 13, true); txt('82 RAYS', 468, 52, 18);
      const hx = OPTICS.histogram.x - G1.x, hy = OPTICS.histogram.y - G1.y;
      for (let i = 0; i < bars.length; i++) {
        const h = bars[i] * OPTICS.histogram.h * (0.85 + 0.15 * Math.sin(t * 2 + i));
        ctx.fillStyle = 'rgba(254,219,97,0.85)';
        ctx.fillRect(hx + i * 10, hy + OPTICS.histogram.h - h, 6, h);
      }
      for (let s5 = 1; s5 <= 5; s5++) txt(String(s5 * 100), hx - 30, hy + OPTICS.histogram.h - s5 * (OPTICS.histogram.h / 5) + 8, 10, true);
      txt('0', hx, hy + OPTICS.histogram.h + 16, 11, true);
      txt('300', hx + 120, hy + OPTICS.histogram.h + 16, 11, true);
      txt('600', hx + 246, hy + OPTICS.histogram.h + 16, 11, true);
      const y2 = G2.y - G1.y + 34;
      for (let l = 0; l < 3; l++) {
        ctx.fillStyle = 'rgba(254,219,97,0.7)';
        ctx.fillRect(14, y2 - 18 + l * 14, 62 - l * 16, 3.5);
      }
      const vals = [['RATE', j(11.1, 0.9) + 'k'], ['BIAS', j(10.3, 1.3) + '%'], ['AMB', j(30.0, 0.5) + '\u00B0C'], ['CORE', j(33.3, 0.4) + '\u00B0C'], ['WAVE', j(452.9, 0.6) + 'nm'], ['RNG', j(6519.5, 0.3) + 'm']];
      const vals2 = [['', j(12.5, 0.8) + '%'], ['', j(42.0, 0.4) + '\u00B0F'], ['', j(23.6, 0.6) + '%'], ['', j(118.9, 0.3) + 'm'], ['', j(88.2, 0.5) + 'dB'], ['', j(6533.0, 0.2) + 'm']];
      vals.forEach(([lab, v], i) => {
        const x = 100 + i * 93;
        txt(lab, x, y2 - 14, 11, true); txt(v, x, y2 + 6, 16);
      });
      vals2.forEach(([lab, v], i) => {
        const x = 100 + i * 93;
        txt(v, x, y2 + 30, 13, true);
      });
      ctx.strokeStyle = 'rgba(254,219,97,0.8)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(636, 10, 24, 11); ctx.fillStyle = 'rgba(254,219,97,0.9)';
      ctx.fillRect(638, 12, 15, 7); ctx.fillRect(661, 12.5, 3, 6);
      txt('00', 530, 168, 11, true); txt('3100', 636, 168, 11, true);
      txt('18286', 14, 168, 11, true); txt('246', 66, 168, 11, true);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  const capture = () => {
    shutterClick();
    setFlash(true); setShots((s) => s + 1);
    setTimeout(() => setFlash(false), 300);
  };
  const K = OPTICS.knobs;
  const hudH = OPTICS.hud2.y + OPTICS.hud2.h - OPTICS.hud1.y + 30;
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets/optics_bg.jpg)' }}>
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: liveCam ? 'block' : 'none' }} />
      <div className="hud" style={rectStyle(OPTICS.hud1)} />
      <div className="hud" style={rectStyle(OPTICS.hud2)} />
      <canvas ref={hudCvs} className="overlay" width={OPTICS.hud1.w} height={hudH}
        style={{ left: OPTICS.hud1.x, top: OPTICS.hud1.y }} />
      {shots > 0 && (
        <div style={{ position: 'absolute', right: 34, top: OPTICS.hud2.y + OPTICS.hud2.h + 18, fontSize: 15, letterSpacing: 2, color: 'rgba(254,219,97,0.85)', textShadow: '0 1px 3px #000' }}>
          {String(shots).padStart(3, '0')} CAPTURED
        </div>
      )}
      <Hit rect={OPTICS.photoTap} onTap={capture} title="capture" />
      <Knob {...K.shutter} value={knobs.shutter} onChange={(v) => setKnobs({ ...knobs, shutter: v })} />
      <Knob {...K.iso} value={knobs.iso} onChange={(v) => setKnobs({ ...knobs, iso: v })} />
      <Knob {...K.aperture} value={knobs.aperture} onChange={(v) => setKnobs({ ...knobs, aperture: v })} />
      <Knob {...K.wb} value={knobs.wb} onChange={(v) => setKnobs({ ...knobs, wb: v })} />
      {!wbOn && <div style={{ position: 'absolute', ...rectStyle(OPTICS.wbSel), borderRadius: 24, background: 'rgba(5,8,12,0.45)' }} onPointerDown={() => setWbOn(true)} />}
      <div className={'flash' + (flash ? ' go' : '')} />
      <HomeHit go={go} />
      <StatusPill rect={OPTICS.pill} />
    </div>
  );
}
