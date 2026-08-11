import React, { useState, useRef, useEffect } from 'react';
import { rectStyle } from '../geo.js';

export function Hit({ rect, onTap, title, round }) {
  return (
    <div className="hit" title={title}
      style={{ ...rectStyle(rect), borderRadius: round ? '50%' : 12 }}
      onPointerDown={(e) => { e.preventDefault(); onTap && onTap(); }} />
  );
}
export function FlashButton({ rect, onTap, sticky, active, radius = 14 }) {
  const [flash, setFlash] = useState(false);
  const tap = () => {
    onTap && onTap();
    if (!sticky) { setFlash(true); setTimeout(() => setFlash(false), 180); }
  };
  return (
    <>
      <div className="hit" style={{ ...rectStyle(rect), borderRadius: radius }} onPointerDown={(e) => { e.preventDefault(); tap(); }} />
      {sticky
        ? active && <div className="sticky-glow" style={{ ...rectStyle(rect), borderRadius: radius }} />
        : <div className={'press-flash' + (flash ? ' on' : '')} style={{ ...rectStyle(rect), borderRadius: radius }} />}
    </>
  );
}
export function Knob({ cx, cy, r, value, onChange }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const angle = -135 + value * 270;
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const down = (e) => { drag.current = { y: e.clientY, v: value }; el.setPointerCapture(e.pointerId); e.preventDefault(); };
    const move = (e) => {
      if (!drag.current) return;
      const scale = parseFloat(document.querySelector('.stage')?.dataset.scale || '1');
      const dv = (drag.current.y - e.clientY) / scale / 180;
      onChange(Math.max(0, Math.min(1, drag.current.v + dv)));
    };
    const up = () => { drag.current = null; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, [value, onChange]);
  return (
    <>
      <div ref={ref} className="hit" style={{ left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', touchAction: 'none' }} />
      <div className="knob-ind" style={{ left: cx - r, top: cy - r, width: r * 2, height: r * 2, transform: `rotate(${angle}deg)` }}>
        <div className="dot" />
      </div>
    </>
  );
}
export function StatusPill({ rect }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(t); }, []);
  let h = now.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  const mm = String(now.getMinutes()).padStart(2, '0');
  return (
    <div className="pill" style={rectStyle(rect)}>
      <div className="time">{h}:{mm} {ap}</div>
      <div className="glyphs">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 11.2 6.2 8.9a3.4 3.4 0 0 1 4.6 0L8.5 11.2Zm4-4.5a6.8 6.8 0 0 0-8 0L2.8 5A9.3 9.3 0 0 1 14.2 5l-1.7 1.7ZM17 2.8A13.6 13.6 0 0 0 0 2.8l1.7 1.7a11.2 11.2 0 0 1 13.6 0L17 2.8Z" fill="#dfe8f0"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="7" width="3" height="4" rx="0.8" fill="#dfe8f0"/><rect x="4.3" y="5" width="3" height="6" rx="0.8" fill="#dfe8f0"/><rect x="8.6" y="2.6" width="3" height="8.4" rx="0.8" fill="#dfe8f0"/><rect x="12.9" y="0" width="3" height="11" rx="0.8" fill="#dfe8f0" opacity="0.45"/></svg>
        <svg width="21" height="11" viewBox="0 0 21 11"><rect x="0.5" y="0.5" width="17" height="10" rx="2.6" stroke="#dfe8f0" opacity="0.6" fill="none"/><rect x="2" y="2" width="11" height="7" rx="1.4" fill="#dfe8f0"/><path d="M19.3 3.6v3.8c0.9-0.2 1.5-1 1.5-1.9s-0.6-1.7-1.5-1.9Z" fill="#dfe8f0" opacity="0.6"/></svg>
      </div>
    </div>
  );
}
export function Dock({ tiles, active, bakedLit, go, pill }) {
  return (
    <>
      {Object.entries(tiles).map(([k, r]) => <Hit key={k} rect={r} title={k} onTap={() => go(k)} />)}
      {active && tiles[active] && active !== bakedLit && <div className="tile-glow" style={rectStyle(tiles[active])} />}
      {pill && <StatusPill rect={pill} />}
    </>
  );
}
export function HomeHit({ go }) {
  return <Hit rect={{ x: 200, y: 20, w: 320, h: 130 }} title="JA.I — home" onTap={() => go('idle')} />;
}
