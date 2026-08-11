import React, { useState } from 'react';
import { WEB } from '../geo.js';
import { Dock, HomeHit } from '../components/Common.jsx';
import { taeFetch } from '../api.js';

export default function Interweb({ go, data, setData }) {
  const [url, setUrl] = useState(data.url || '');
  const [busy, setBusy] = useState(false);
  const result = data.result;
  const navigate = async () => {
    const target = url.trim(); if (!target || busy) return;
    setBusy(true);
    const r = await taeFetch(target.startsWith('http') ? target : 'https://' + target);
    setData({ ...data, url: target, result: r });
    setBusy(false);
  };
  const g = WEB.globe, p = WEB.panel;
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets/web_bg.jpg)' }}>
      <div className="sheen" style={{ left: g.cx - g.r + 30, top: g.cy - g.r + 30, width: (g.r - 30) * 2, height: (g.r - 30) * 2 }} />
      <input className="ghost"
        style={{ left: WEB.input.x, top: WEB.input.y, width: WEB.input.w - 20, height: WEB.input.h, fontSize: 21 }}
        placeholder="search interweb" value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && navigate()}
        spellCheck={false} autoCapitalize="off" autoCorrect="off" />
      {result && (
        <div style={{ position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h, borderRadius: p.r, overflow: 'hidden' }}
             onPointerDown={() => setData({ ...data, result: null })}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,12,0.45)' }} />
          <div className="fetch-card">
            <div className="hd">{busy ? 'MERCURY FETCH // RESOLVING' : result.status}</div>
            <div className="url">{result.url}</div>
            {result.lines.map((l, i) => <div className="ln" key={i}>{l}</div>)}
            <div className="ln" style={{ marginTop: 14, opacity: 0.55 }}>tap to release surface</div>
          </div>
        </div>
      )}
      <HomeHit go={go} />
      <Dock tiles={WEB.tiles} active="interweb" go={go} pill={WEB.pill} />
    </div>
  );
}
