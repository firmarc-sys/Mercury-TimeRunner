import React, { useEffect, useRef } from 'react';
import { HOME } from '../geo.js';
import { Dock, HomeHit } from '../components/Common.jsx';

export default function Home({ go }) {
  const cvs = useRef(null);
  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext('2d');
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const stars = [];
    while (stars.length < 110) {
      const x = rnd() * 720, y = rnd() * 1060;
      const dx = x - HOME.globe.cx, dy = y - HOME.globe.cy;
      if (Math.hypot(dx, dy) > HOME.globe.r + 24 && !(y > 20 && y < 160 && x > 190 && x < 530)) {
        stars.push({ x, y, p: rnd() * Math.PI * 2, s: 0.6 + rnd() * 1.4 });
      }
    }
    let raf, t = 0;
    const draw = () => {
      t += 0.016; ctx.clearRect(0, 0, 720, 1280);
      for (const st of stars) {
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.4 + st.p));
        ctx.globalAlpha = a; ctx.fillStyle = '#dfe9f5';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.s, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  const g = HOME.globe;
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets/home_bg.jpg)' }}>
      <canvas ref={cvs} className="overlay" width="720" height="1280" style={{ left: 0, top: 0 }} />
      <div className="sheen" style={{ left: g.cx - g.r, top: g.cy - g.r, width: g.r * 2, height: g.r * 2 }} />
      <HomeHit go={go} />
      <Dock tiles={HOME.tiles} active={null} bakedLit={HOME.bakedLit} go={go} />
    </div>
  );
}
