import React, { useState, useRef, useEffect } from 'react';
import { rectStyle } from '../geo2.js';

export function Hit({ rect, onTap, title, round }) {
  return (
    <div className="hit" title={title}
      style={{ ...rectStyle(rect), borderRadius: round ? '50%' : 12 }}
      onPointerDown={(e) => { e.preventDefault(); onTap && onTap(); }} />
  );
}

export function CircleHit({ cx, cy, r, onTap, title }) {
  return <Hit rect={{ x: cx - r, y: cy - r, w: r * 2, h: r * 2 }} round onTap={onTap} title={title} />;
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

export function CircleFlash({ cx, cy, r, onTap, sticky, active }) {
  return <FlashButton rect={{ x: cx - r, y: cy - r, w: r * 2, h: r * 2 }} radius={r} onTap={onTap} sticky={sticky} active={active} />;
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
      const dv = (drag.current.y - e.clientY) / scale / 200;
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

export function Dock({ tiles, active, bakedLit, go }) {
  return (
    <>
      {Object.entries(tiles).map(([k, r]) => <Hit key={k} rect={r} title={k} onTap={() => go(k)} />)}
      {active && tiles[active] && active !== bakedLit && <div className="tile-glow" style={rectStyle(tiles[active])} />}
    </>
  );
}

export function Toast({ text }) {
  return text ? <div className="toast" style={{ top: 190 }}>{text}</div> : null;
}
