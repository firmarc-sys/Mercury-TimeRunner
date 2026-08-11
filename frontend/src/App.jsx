import React, { useState, useEffect, useRef, useCallback } from 'react';
import Mercury from './modules2/Mercury.jsx';
import Interweb from './modules2/Interweb.jsx';
import Augment from './modules2/Augment.jsx';
import CodeTerm from './modules2/CodeTerm.jsx';
import Scribe from './modules2/Scribe.jsx';
import Optics from './modules2/Optics.jsx';
import { CANVAS } from './geo2.js';
import { renderState } from './api.js';

const STATES = ['mercury', 'interweb', 'augment', 'code', 'scribe', 'optics'];

export default function App() {
  const [booted, setBooted] = useState(false);
  const [mode, setMode] = useState('mercury');
  const [morphing, setMorphing] = useState(false);
  const [fitState, setFitState] = useState({ s: 1, anchorBottom: false });
  const appData = useRef({ interweb: {}, augment: {}, code: {}, scribe: {}, optics: {} });
  const pending = useRef(null);

  useEffect(() => {
    const fit = () => {
      const vw = window.innerWidth;
      const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
      const sw = vw / CANVAS.w, sh = vh / CANVAS.h;
      const params = new URLSearchParams(window.location.search);
      if (params.get('fit') === 'contain' || sw <= 0 || sh <= 0) {
        setFitState({ s: Math.min(sw, sh), anchorBottom: false }); return;
      }
      if (sh >= sw) {
        const s = Math.min(sh, sw * 1.07);
        setFitState({ s, anchorBottom: s < sh - 0.001 });
      } else {
        setFitState({ s: Math.min(sw, sh), anchorBottom: false });
      }
    };
    fit();
    window.addEventListener('resize', fit);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
    renderState();
    return () => {
      window.removeEventListener('resize', fit);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', fit);
    };
  }, []);

  const go = useCallback((next) => {
    if (!STATES.includes(next)) return;
    setMode((cur) => {
      if (next === cur) return cur;
      pending.current = next;
      setMorphing(true);
      setTimeout(() => setMode(pending.current), 210);
      setTimeout(() => setMorphing(false), 560);
      return cur;
    });
  }, []);

  useEffect(() => {
    const key = (e) => { const i = parseInt(e.key, 10); if (i >= 1 && i <= 6 && document.activeElement.tagName !== 'INPUT') go(STATES[i - 1]); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go]);

  const setDataFor = (k) => (u) => { appData.current[k] = typeof u === 'function' ? u(appData.current[k]) : u; };

  const mod = () => {
    switch (mode) {
      case 'interweb': return <Interweb go={go} />;
      case 'augment': return <Augment go={go} data={appData.current.augment} setData={setDataFor('augment')} />;
      case 'code': return <CodeTerm go={go} data={appData.current.code} setData={setDataFor('code')} />;
      case 'scribe': return <Scribe go={go} data={appData.current.scribe} setData={setDataFor('scribe')} />;
      case 'optics': return <Optics go={go} data={appData.current.optics} setData={setDataFor('optics')} />;
      default: return <Mercury go={go} />;
    }
  };

  const { s, anchorBottom } = fitState;
  return (
    <div className="stage-wrap" style={{ alignItems: anchorBottom ? 'flex-end' : 'center' }}>
      <div className="stage" data-scale={s}
        style={{ transform: `scale(${s})`, transformOrigin: anchorBottom ? 'center bottom' : 'center center' }}>
        {!booted ? (
          <>
            <video className="boot-video" src="/assets2/boot.mp4" autoPlay muted playsInline
              onEnded={() => setBooted(true)} onError={() => setBooted(true)}
              onPointerDown={() => setBooted(true)} />
            <div className="skip-hint">TAP TO ENTER</div>
          </>
        ) : (
          <>
            {mod()}
            <div className={'morph' + (morphing ? ' run' : '')} />
          </>
        )}
      </div>
    </div>
  );
}
