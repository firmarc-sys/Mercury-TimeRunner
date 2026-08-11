import React, { useState, useRef, useEffect } from 'react';
import { TERM, rectStyle } from '../geo2.js';
import { Dock, Hit } from '../components/Common.jsx';
import { taeChat } from '../api.js';

const SEED = [
  { t: 'sys', lines: ['WELCOME BACK, JORGE.', 'READY WHEN YOU ARE.'] },
  { t: 'user', text: 'tell me a new perspective on time' },
  { t: 'ai', kind: 'prose', text: 'Time is not a line. It is a field of becoming.\nYou do not \u2018move\u2019 through time.\nYou select your frame of reference,\nand reality organizes around your focus.\nThe past is memory. The future is probability.\nThe present is your point of creation.\n\nYou are not running out of time.\nYou are generating more of it.', tokens: 256 },
  { t: 'user', text: 'write a python function that checks if a number is prime' },
  { t: 'ai', kind: 'code', tokens: 186, code: [
    ['kw','def '],['fn','is_prime'],['b','(n):'],['nl'],
    ['b','    '],['kw','if '],['b','n <= '],['num','1'],['b',':'],['nl'],
    ['b','        '],['kw','return '],['fn','False'],['nl'],
    ['b','    '],['kw','if '],['b','n <= '],['num','3'],['b',':'],['nl'],
    ['b','        '],['kw','return '],['fn','True'],['nl'],
    ['b','    '],['kw','if '],['b','n % '],['num','2'],['b',' == '],['num','0'],['kw',' or '],['b','n % '],['num','3'],['b',' == '],['num','0'],['b',':'],['nl'],
    ['b','        '],['kw','return '],['fn','False'],['nl'],
    ['b','    i = '],['num','5'],['nl'],
    ['b','    '],['kw','while '],['b','i * i <= n:'],['nl'],
    ['b','        '],['kw','if '],['b','n % i == '],['num','0'],['kw',' or '],['b','n % (i + '],['num','2'],['b',') == '],['num','0'],['b',':'],['nl'],
    ['b','            '],['kw','return '],['fn','False'],['nl'],
    ['b','        i += '],['num','6'],['nl'],
    ['b','    '],['kw','return '],['fn','True']
  ] }
];

function CodeBlock({ code }) {
  const cls = { kw: 'kw', num: 'num', fn: 'fn', b: 'b' };
  const colors = { kw: TERM.colors.kw, num: TERM.colors.num, fn: TERM.colors.fn, b: TERM.colors.body };
  return (
    <pre>
      {code.map((seg, i) => seg[0] === 'nl'
        ? '\n'
        : <span key={i} style={{ color: colors[seg[0]] }}>{seg[1]}</span>)}
    </pre>
  );
}

export default function CodeTerm({ go, data, setData }) {
  const msgs = data.msgs || SEED;
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [router, setRouter] = useState(true);
  const scRef = useRef(null);
  const inRef = useRef(null);

  useEffect(() => { const el = scRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length, busy]);

  const send = async () => {
    const q = input.trim(); if (!q || busy) return;
    setInput(''); setBusy(true);
    const next = [...msgs, { t: 'user', text: q }];
    setData({ ...data, msgs: next });
    const r = await taeChat(q);
    const reply = typeof r === 'string' ? { kind: 'prose', text: r, tokens: 128 } : r;
    setTimeout(() => {
      setData((d) => ({ ...d, msgs: [...next, { t: 'ai', ...reply }] }));
      setBusy(false);
    }, 500);
  };

  const I = TERM.interior;
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets2/code.jpg)' }}>
      <div ref={scRef} className="term" style={{ left: I.x - 3, top: I.y - 3, width: I.w + 6, height: I.h + 6 }}>
        {msgs.map((m, i) => {
          if (m.t === 'sys') return m.lines.map((l, j) => (
            <div key={i + '-' + j} className={j === 0 ? 'u' : 'b'} style={{ letterSpacing: 1 }}>{l}</div>
          ));
          if (m.t === 'user') return <div key={i} className="prompt-box">&gt; {m.text}</div>;
          return (
            <div key={i}>
              <div className="lbl" style={{ margin: '6px 0 10px 0' }}>JAHORIN (MERCURY AI)</div>
              {m.kind === 'code' ? <CodeBlock code={m.code} /> : <pre className="b">{m.text}</pre>}
              <div className="meta">
                <span className="u">&gt; {m.kind === 'code' ? 'CODE GENERATED' : 'RESPONSE COMPLETE'}</span>
                <span className="lbl">TOKENS: {m.tokens}</span>
              </div>
            </div>
          );
        })}
        {busy && <div className="u">&gt; ROUTING INTENT<span className="caret" /></div>}
      </div>
      <div className="term-input" style={rectStyle(TERM.inputRow)} onPointerDown={() => inRef.current && inRef.current.focus()}>
        <span>&gt;</span>
        <input ref={inRef} className="ghost" style={{ position: 'relative', flex: 1, fontSize: 18, color: '#4ade80' }}
          placeholder="type your intent..." value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()} spellCheck={false} />
        <span className="send-pill" onPointerDown={send}>&raquo;</span>
      </div>
      <Hit rect={TERM.toggle} onTap={() => setRouter(!router)} title="AGENTIC OPEN ROUTER" />
      {!router && <div style={{ position: 'absolute', ...rectStyle(TERM.toggle), borderRadius: 9, background: 'rgba(6,8,8,0.8)', border: '1.5px solid rgba(120,130,140,0.5)' }} />}
      <Hit rect={{ x: 200, y: 40, w: 320, h: 130 }} title="JAHORIN — home" onTap={() => go('mercury')} />
      <Dock tiles={TERM.tiles} active="code" bakedLit={TERM.bakedLit} go={go} />
    </div>
  );
}
