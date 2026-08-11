import React, { useState, useRef, useEffect } from 'react';
import { SCRIBE, rectStyle } from '../geo.js';
import { HomeHit, Hit } from '../components/Common.jsx';

export default function Scribe({ go, data, setData }) {
  const [doc, setDoc] = useState(data.doc || []);
  const [ink, setInk] = useState(data.ink ?? null);
  const [micOn, setMicOn] = useState(false);
  const undoStack = useRef(data.undo || []);
  const redoStack = useRef([]);
  const inputRef = useRef(null);
  const [draft, setDraft] = useState('');
  useEffect(() => () => setData({ doc, ink, undo: undoStack.current }), [doc, ink]);
  const commit = () => {
    const t = draft.trim(); if (!t) return;
    undoStack.current.push(doc);
    redoStack.current = [];
    setDoc([...doc, { text: t, color: SCRIBE.pots[ink ?? 4].color }]);
    setDraft('');
  };
  const undo = () => {
    if (!undoStack.current.length) return;
    redoStack.current.push(doc);
    setDoc(undoStack.current.pop());
  };
  const redo = () => {
    if (!redoStack.current.length) return;
    undoStack.current.push(doc);
    setDoc(redoStack.current.pop());
  };
  const cap = SCRIBE.capsule, gl = SCRIBE.glyphs, wa = SCRIBE.writeArea;
  const pot = SCRIBE.pots[ink ?? 4];
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets/scribe_bg.jpg)' }}>
      <div style={{ position: 'absolute', ...rectStyle(wa), overflow: 'hidden' }}
           onPointerDown={() => inputRef.current && inputRef.current.focus()}>
        {doc.map((run, i) => (
          <div key={i} className="ink-text" style={{ color: run.color }}>{run.text}</div>
        ))}
        {draft && <div className="ink-text" style={{ color: pot.color, opacity: 0.85 }}>{draft}<span className="caret" style={{ background: pot.color }} /></div>}
      </div>
      <input ref={inputRef} className="ghost"
        style={{ left: cap.x + 26, top: cap.y + 102, width: cap.w - 52, height: 38, fontSize: 18, textAlign: 'center' }}
        placeholder="Type, speak, upload, command, or code..." value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()} spellCheck={false} />
      <Hit rect={gl.wave} onTap={() => go('augment')} title="AUGMENT" />
      <Hit rect={gl.rewind} onTap={undo} title="undo" />
      <Hit rect={{ x: gl.mic.cx - gl.mic.r, y: gl.mic.cy - gl.mic.r, w: gl.mic.r * 2, h: gl.mic.r * 2 }} round
           onTap={() => setMicOn(!micOn)} title="speak" />
      {micOn && <div className="pot-ring" style={{ left: gl.mic.cx - gl.mic.r - 4, top: gl.mic.cy - gl.mic.r - 4, width: gl.mic.r * 2 + 8, height: gl.mic.r * 2 + 8 }} />}
      <Hit rect={gl.forward} onTap={redo} title="redo" />
      <Hit rect={gl.camera} onTap={() => go('optics')} title="OPTICS" />
      <Hit rect={SCRIBE.pillBelow} onTap={commit} title="scribe" />
      {SCRIBE.pots.map((p, i) => (
        <React.Fragment key={i}>
          <Hit rect={{ x: p.cx - p.r, y: p.cy - p.r, w: p.r * 2, h: p.r * 2 }} round onTap={() => setInk(i)} title={p.name} />
          {ink === i && <div className="pot-ring" style={{ left: p.cx - p.r - 5, top: p.cy - p.r - 5, width: p.r * 2 + 10, height: p.r * 2 + 10 }} />}
        </React.Fragment>
      ))}
      <HomeHit go={go} />
    </div>
  );
}
