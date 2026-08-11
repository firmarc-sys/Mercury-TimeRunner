import React, { useState, useRef, useEffect } from 'react';
import { SCRIBE, rectStyle } from '../geo2.js';
import { Dock, Hit, CircleFlash, FlashButton } from '../components/Common.jsx';

const PAGE_TITLES = {
  p01: 'New Page', p03: 'Mercury UIX', p04: 'Runtime Flow', p05: 'Data Schema'
};
const PAGE_SEED = {
  p03: 'Mercury UIX.\n\nOne shell. Six embodiments.\nThe dock is the spine.\nEvery surface is the same runtime\nwearing a different material.',
  p04: 'Runtime Flow.\n\nintent -> identity -> capability\ncapability -> embodiment\nembodiment -> execution\nexecution -> memory -> Jahorin.',
  p05: 'Data Schema.\n\nGID 399152573423\nnotebooks{ ideas plans designs scripts builds }\npages{ concept uix flow schema }\nstate persists across all modules.'
};

export default function Scribe({ go, data, setData }) {
  const [notebook, setNotebook] = useState(data.notebook || 'ideas');
  const [page, setPage] = useState(data.page || 'p02');
  const [docs, setDocs] = useState(data.docs || {});
  const [draft, setDraft] = useState('');
  const [now, setNow] = useState(new Date());
  const inRef = useRef(null);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => () => setData({ notebook, page, docs }), [notebook, page, docs]);

  const commit = () => {
    const t = draft.trim(); if (!t) return;
    setDocs({ ...docs, [page]: (docs[page] || PAGE_SEED[page] || '') + (docs[page] || PAGE_SEED[page] ? '\n' : '') + t });
    setDraft('');
  };

  const dd = String(now.getMonth() + 1).padStart(2, '0') + ' / ' + String(now.getDate()).padStart(2, '0') + ' / ' + now.getFullYear();
  const tt = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
  const liveText = page === 'p02' ? null : (docs[page] ?? PAGE_SEED[page] ?? '');
  const C = SCRIBE.content;

  return (
    <div className="module" style={{ backgroundImage: 'url(/assets2/scribe.jpg)' }}>
      {/* live SOL clock over the baked box */}
      <div style={{ position: 'absolute', ...rectStyle({ x: SCRIBE.solBox.x + 4, y: SCRIBE.solBox.y + 20, w: SCRIBE.solBox.w - 8, h: SCRIBE.solBox.h - 24 }),
        background: '#cbb48c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "ui-monospace, Menlo, monospace", color: '#2b2013', fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>
        <div>{dd}</div><div>{tt}</div>
      </div>
      {/* live page surface for every page except the baked Core Concept */}
      {page !== 'p02' && (
        <div className="scribe-page" style={rectStyle(C)} onPointerDown={() => inRef.current && inRef.current.focus()}>
          <div className="ink-text" style={{ fontSize: 40, textDecoration: 'underline' }}>{PAGE_TITLES[page] || 'New Page'}.</div>
          <div className="ink-text" style={{ marginTop: 14 }}>{liveText}</div>
          {draft && <div className="ink-text" style={{ opacity: 0.8 }}>{draft}<span className="caret" style={{ background: '#2b2013' }} /></div>}
          {!liveText && !draft && <div className="ink-text" style={{ opacity: 0.4, marginTop: 10 }}>tap, then write...</div>}
        </div>
      )}
      <input ref={inRef} className="ghost" style={{ left: -500, top: -500, width: 10, height: 10 }} value={draft}
        onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit()} />
      {/* notebooks + pages */}
      {Object.entries(SCRIBE.notebooks).map(([k, r]) => (
        <React.Fragment key={k}>
          <Hit rect={r} onTap={() => setNotebook(k)} title={k} />
          {notebook === k && k !== 'ideas' && <div className="sel-soft" style={rectStyle(r)} />}
        </React.Fragment>
      ))}
      {Object.entries(SCRIBE.pages).map(([k, r]) => (
        <React.Fragment key={k}>
          <Hit rect={r} onTap={() => { if (k === 'add') { setPage('p01'); setDocs({ ...docs, p01: '' }); } else setPage(k); }} title={k} />
          {page === k && k !== 'p01' && <div className="sel-soft" style={rectStyle(r)} />}
        </React.Fragment>
      ))}
      {Object.entries(SCRIBE.rounds).map(([k, c]) => (
        <CircleFlash key={k} {...c} onTap={() => setNotebook(k === 'notes' ? 'ideas' : k)} />
      ))}
      <FlashButton rect={SCRIBE.gidPlate} radius={12} onTap={() => go('mercury')} />
      <Dock tiles={SCRIBE.tiles} active="scribe" bakedLit={SCRIBE.bakedLit} go={go} />
    </div>
  );
}
