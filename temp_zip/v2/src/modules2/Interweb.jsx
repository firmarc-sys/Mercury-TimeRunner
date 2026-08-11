import React, { useState } from 'react';
import { WEB } from '../geo2.js';
import { Dock, FlashButton, Toast } from '../components/Common.jsx';
import { identity } from '../api.js';

export default function Interweb({ go }) {
  const [toast, setToast] = useState(null);
  const say = (t, ms = 2600) => { setToast(t); setTimeout(() => setToast(null), ms); };
  const signIn = async () => {
    const id = await identity();
    say(id && id.user ? `IDENTITY LINKED :: ${String(id.user).toUpperCase()} · GID 399152573423`
                      : 'IDENTITY LINKED :: JORGE DELGADO · GID 399152573423');
  };
  return (
    <div className="module" style={{ backgroundImage: 'url(/assets2/interweb.jpg)' }}>
      <FlashButton rect={WEB.getStarted} radius={26} onTap={() => go('code')} />
      <FlashButton rect={WEB.learnMore} radius={25} onTap={() => say('S.I.aaS :: SPACE INTELLIGENCE AS A SERVICE — MODULES ONLINE: 6')} />
      <FlashButton rect={WEB.signIn} radius={24} onTap={signIn} />
      {Object.entries(WEB.features).map(([k, r]) => (
        <FlashButton key={k} rect={r} radius={18}
          onTap={() => say(({ identity: 'IDENTITY :: SECURE. PRIVATE. ALWAYS YOURS.',
                              intelligence: 'INTELLIGENCE :: CONTEXTUAL. ADAPTIVE. ALWAYS LEARNING.',
                              ecosystem: 'ECOSYSTEM :: CONNECTED TOOLS. LIMITLESS REACH.',
                              control: 'CONTROL :: YOU ARE IN CHARGE. ALWAYS.' })[k])} />
      ))}
      <Toast text={toast} />
      <Dock tiles={WEB.tiles} active="interweb" bakedLit={WEB.bakedLit} go={go} />
    </div>
  );
}
