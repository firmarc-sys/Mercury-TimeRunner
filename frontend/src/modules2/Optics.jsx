import React, { useState, useRef, useEffect } from 'react';
import { OPT, rectStyle } from '../geo2.js';
import { Dock, Hit, FlashButton, Toast } from '../components/Common.jsx';

function shutterSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let n = 0; n < d.length; n++) d[n] = (Math.random() * 2 - 1) * Math.pow(1 - n / d.length, 8);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const g = ctx.createGain(); g.gain.value = 0.4;
    s.connect(g); g.connect(ctx.destination); s.start();
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

export default function Optics({ go, data, setData }) {
  const [chips, setChips] = useState(data.chips ?? { k4: true, ratio: false, raw: false });
  const [ev, setEv] = useState(data.ev ?? 0);
  const [zoom, setZoom] = useState(data.zoom ?? 1);
  const [shots, setShots] = useState(data.shots ?? 0);
  const [flash, setFlash] = useState(false);
  const [live, setLive] = useState(false);
  const [toast, setToast] = useState(null);
  const vidRef = useRef(null);

  useEffect(() => () => setData({ chips, ev, zoom, shots }), [chips, ev, zoom, shots]);
  useEffect(() => {
    let stream = null, dead = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (dead) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (vidRef.current) { vidRef.current.srcObject = stream; setLive(true); }
      } catch { /* simulated camera: approved reference frame */ }
    })();
    return () => { dead = true; if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  const capture = () => {
    shutterSound(); setFlash(true); setShots((s) => s + 1);
    setTimeout(() => setFlash(false), 300);
  };
  const say = (t) => { setToast(t); setTimeout(() => setToast(null), 1800); };
  const V = OPT.view;

  const dragSlider = (e, rect, set, lo, hi) => {
    const scale = parseFloat(document.querySelector('.stage')?.dataset.scale || '1');
    const stageEl = document.querySelector('.stage').getBoundingClientRect();
    const y = (e.clientY - stageEl.top) / scale;
    const f = Math.max(0, Math.min(1, (y - rect.y) / rect.h));
    set(hi - f * (hi - lo));
  };

  return (
    <div className="module" style={{ backgroundImage: 'url(/assets2/optics.jpg)' }}>
      {live && (
        <>
          <div style={{ position: 'absolute', ...rectStyle(V), overflow: 'hidden', borderRadius: 28, background: '#05070a' }}>
            <video ref={vidRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                       transform: `scale(${zoom})`, filter: `brightness(${1 + ev * 0.25})` }} />
            {/* rebuilt HUD furniture over live feed */}
            <svg width={V.w} height={V.h} style={{ position: 'absolute', inset: 0 }}>
              <g stroke="#f2f5f7" strokeWidth="2" fill="none" opacity="0.9">
                <circle cx={OPT.reticle.cx - V.x} cy={OPT.reticle.cy - V.y} r="34" />
                <path d={`M${OPT.reticle.cx - V.x - 14} ${OPT.reticle.cy - V.y} h28 M${OPT.reticle.cx - V.x} ${OPT.reticle.cy - V.y - 14} v28`} />
                {(() => { const bx = OPT.reticle.cx - V.x, by = OPT.reticle.cy - V.y, o = 92, l = 26;
                  return <path d={`M${bx - o} ${by - o + l} v-${l} h${l} M${bx + o - l} ${by - o} h${l} v${l} M${bx + o} ${by + o - l} v${l} h-${l} M${bx - o + l} ${by + o} h-${l} v-${l}`} />; })()}
              </g>
            </svg>
            <div className="cam-el" style={{ left: 20, top: 8, fontSize: 20, fontWeight: 600 }}>IMAGENARY</div>
            <div className="cam-el" style={{ left: 20, top: 34, fontSize: 11, letterSpacing: 1, opacity: 0.8 }}>VISION &amp; VISION MODELS</div>
            <div className="cam-el" style={{ left: V.w / 2 - 40, top: 12, fontSize: 14, letterSpacing: 1 }}>▲ 3260M</div>
          </div>
          {['k4', 'ratio', 'raw'].map((k) => {
            const r = OPT.chips[k];
            return <div key={k} className={'cam-chip' + (chips[k] ? ' on' : '')} style={{ ...rectStyle(r) }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{{ k4: '4K', ratio: '16:9', raw: 'RAW' }[k]}</div>
              <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.8 }}>{{ k4: 'ULTRA', ratio: 'RATIO', raw: 'MODE' }[k]}</div>
            </div>;
          })}
        </>
      )}
      {/* chip toggles (both modes) */}
      {['k4', 'ratio', 'raw'].map((k) => (
        <React.Fragment key={k}>
          <Hit rect={OPT.chips[k]} onTap={() => { setChips({ ...chips, [k]: !chips[k] }); say(`${{ k4: '4K ULTRA', ratio: '16:9 RATIO', raw: 'RAW MODE' }[k]} ${!chips[k] ? 'ON' : 'OFF'}`); }} />
          {!live && chips[k] && k !== 'k4' && <div className="sticky-glow" style={{ ...rectStyle(OPT.chips[k]), borderRadius: 10 }} />}
        </React.Fragment>
      ))}
      {/* EV + zoom drag zones */}
      <div className="hit" style={{ ...rectStyle(OPT.evScale), touchAction: 'none' }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragSlider(e, OPT.evScale, setEv, -2, 2); }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && dragSlider(e, OPT.evScale, setEv, -2, 2)} />
      <div className="hit" style={{ ...rectStyle(OPT.zoom), touchAction: 'none' }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragSlider(e, { x: OPT.zoom.x, y: OPT.zoom.y, w: OPT.zoom.w, h: OPT.zoom.w }, () => {}, 0, 1); const scale = parseFloat(document.querySelector('.stage')?.dataset.scale || '1'); const st = document.querySelector('.stage').getBoundingClientRect(); const x = (e.clientX - st.left) / scale; setZoom(1 + 3 * Math.max(0, Math.min(1, (x - OPT.zoom.x) / OPT.zoom.w))); }}
        onPointerMove={(e) => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; const scale = parseFloat(document.querySelector('.stage')?.dataset.scale || '1'); const st = document.querySelector('.stage').getBoundingClientRect(); const x = (e.clientX - st.left) / scale; setZoom(1 + 3 * Math.max(0, Math.min(1, (x - OPT.zoom.x) / OPT.zoom.w))); }} />
      {/* live readouts over the bottom bar values */}
      <div className="cam-el" style={{ left: 552, top: 1185, fontSize: 15, opacity: 0.001 }}>.</div>
      {(ev !== 0 || zoom !== 1 || shots > 0) && (
        <div className="cam-el" style={{ left: 60, top: 1128, fontSize: 15, letterSpacing: 1.5, color: '#e8f0f8' }}>
          {zoom.toFixed(1)}x · EV {ev >= 0 ? '+' : ''}{ev.toFixed(1)}{shots > 0 ? ` · ${String(shots).padStart(3, '0')} CAPTURED` : ''}
        </div>
      )}
      {Object.entries(OPT.sideBtns).map(([k, r]) => (
        <FlashButton key={k} rect={r} radius={12} onTap={() => say(({ brightness: 'EXPOSURE LOCK', awb: 'AWB 5600K', afs: 'AF-S SINGLE', focus: 'FOCUS PEAKING', mountain: 'SCENE :: LANDSCAPE' })[k])} />
      ))}
      <Hit rect={OPT.hamburger} onTap={() => say('IMAGENARY :: VISION & VISION MODELS')} />
      <FlashButton rect={{ x: OPT.shutter.cx - OPT.shutter.r, y: OPT.shutter.cy - OPT.shutter.r, w: OPT.shutter.r * 2, h: OPT.shutter.r * 2 }} radius={OPT.shutter.r} onTap={capture} />
      <Hit rect={{ x: 200, y: 40, w: 320, h: 130 }} title="JAHORIN — home" onTap={() => go('mercury')} />
      <div className={'flash' + (flash ? ' go' : '')} />
      <Toast text={toast} />
      <Dock tiles={OPT.tiles} active="optics" bakedLit={OPT.bakedLit} go={go} />
    </div>
  );
}
