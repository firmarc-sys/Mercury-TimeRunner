import React, { useState, useRef, useEffect } from 'react';
import { CODE } from '../geo.js';
import { Dock, HomeHit, Hit } from '../components/Common.jsx';
import { taeChat } from '../api.js';

export default function CodeModule({ go, data, setData }) {
  const msgs = data.msgs || [
    { who: 'mercury', label: 'MERCURY', text: 'Welcome back, Jorge.' },
    { who: 'mercury', label: 'MERCURY', text: 'The runtime never slept. Ask, and the surface answers.' }
  ];
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length, typing]);
  const send = async () => {
    const q = input.trim(); if (!q) return;
    setInput('');
    const next = [...msgs, { who: 'user', label: 'JORGE', text: q }];
    setData({ ...data, msgs: next });
    const reply = await taeChat(q);
    let i = 0;
    const step = () => {
      i += 2 + Math.floor(Math.random() * 3);
      if (i >= reply.length) {
        setTyping(null);
        setData((d) => ({ ...d, msgs: [...next, { who: 'mercury', label: 'MERCURY', text: reply }] }));
      } else {
        setTyping(reply.slice(0, i));
        setTimeout(step, 24);
      }
    };
    step();
  };
  const C = CODE;
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets/code_bg.jpg)' }}>
      <div className="chat-plate" style={{ position: 'absolute', left: C.chat.x, top: C.chat.y, width: C.chat.w, height: C.chat.h, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/assets/code_chat_bg.jpg)', backgroundSize: 'cover' }} />
        <div ref={scrollRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingTop: 26, paddingBottom: 18 }}>
          {msgs.map((m, i) => (
            <div key={i} className={'bubble-row' + (m.who === 'user' ? ' right' : '')} style={{ marginTop: i === 0 ? 8 : 30 }}>
              <div className="bubble-label">{m.label}</div>
              <div className="avatar" />
              <div className={'bubble' + (m.who === 'user' ? ' right' : '')}>{m.text}</div>
            </div>
          ))}
          {typing !== null && (
            <div className="bubble-row" style={{ marginTop: 30 }}>
              <div className="bubble-label">MERCURY</div>
              <div className="avatar" />
              <div className="bubble">{typing}<span className="caret" /></div>
            </div>
          )}
        </div>
      </div>
      <input ref={inputRef} className="ghost"
        style={{ left: C.textRegion.x, top: C.textRegion.y, width: C.textRegion.w, height: C.textRegion.h, fontSize: 24 }}
        placeholder="Type, message" value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && send()} spellCheck={false} />
      <Hit rect={C.icons.send} onTap={send} title="send" />
      <Hit rect={C.icons.mic} onTap={() => inputRef.current && inputRef.current.focus()} title="speak" />
      <Hit rect={C.icons.wave} onTap={() => go('augment')} title="AUGMENT" />
      <Hit rect={C.icons.code} onTap={() => setInput((v) => v + '```')} title="code block" />
      <Hit rect={C.icons.cmd} onTap={() => setInput((v) => '/' + v)} title="command" />
      <HomeHit go={go} />
      <Dock tiles={C.tiles} active="code" bakedLit={C.bakedLit} go={go} pill={C.pill} />
    </div>
  );
}
