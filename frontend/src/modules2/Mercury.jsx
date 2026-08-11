import React from 'react';
import { MERCURY } from '../geo2.js';

export default function Mercury({ go }) {
  const p = MERCURY.plate;
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets2/mercury.jpg)' }}
         onPointerDown={() => go('interweb')}>
      <div className="sheen" style={{ left: p.x + 60, top: p.y + 60, width: p.w - 120, height: 600, borderRadius: '50%' }} />
      <div className="skip-hint" style={{ bottom: 16 }}>TAP TO ENTER</div>
    </div>
  );
}
