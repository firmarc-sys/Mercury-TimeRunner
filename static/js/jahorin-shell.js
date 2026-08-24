/* JAHORIN TRISMEGISTUS — persistent intent-first shell controller */
(() => {
  'use strict';

  const GID = '399152573423';
  const PRIMARY = [
    ['interweb','INTERWEB','◎','/interweb/'],
    ['augment','AUGMENT','♫','/syncori/'],
    ['code','CODE','⌨','/code/'],
    ['scribe','SCRIBE','✒','/scribe/'],
    ['optics','OPTICS','◉','/syncori/optics/']
  ];
  const OPTICS = [['SEE','◉'],['CAPTURE','●'],['ANALYZE','⌁'],['MACRO','◎'],['EDITOR','✦']];

  const viewport = document.querySelector('#ari-viewport');
  const dock = document.querySelector('#liquid-dock');
  const wakeLayer = document.querySelector('#jahorin-wake');
  const wakeButton = document.querySelector('#jahorin-orb');
  const canvas = document.querySelector('#jahorin-mercury');
  const responseNode = document.querySelector('#jahorin-response');
  const intentShell = document.querySelector('#jahorin-intent-shell');
  const intentInput = document.querySelector('#jahorin-intent');
  const micButton = document.querySelector('#jahorin-mic');

  const state = {
    awake:false, runtime:'BOOT', speech:'IDLE', recognizer:null,
    listening:false, speaking:false, micStream:null, optics:null,
    lastIntent:null
  };

  const setRuntime = value => {
    state.runtime = value;
    document.body.dataset.runtime = value;
  };
  const setSpeech = (value, detail='') => {
    state.speech = value;
    document.body.dataset.speech = value;
    if (intentShell) {
      intentShell.dataset.speech = value;
      intentShell.dataset.detail = detail;
    }
  };
  const showResponse = (text, persistent=false) => {
    if (!responseNode || !text) return;
    responseNode.textContent = String(text);
    responseNode.classList.add('present');
    clearTimeout(responseNode._jtTimer);
    if (!persistent) responseNode._jtTimer = setTimeout(() => responseNode.classList.remove('present'), 7000);
  };

  function canonicalHeader() {
    const title = document.querySelector('#shell-title');
    const subtitle = document.querySelector('#shell-subtitle');
    if (title) title.textContent = 'JAHORIN TRISMEGISTUS';
    if (subtitle) subtitle.textContent = 'SYSTEM INTELLIGENCE AS A SERVICE';
    document.title = 'Jahorin Trismegistus — System Intelligence as a Service';
  }

  function primaryActive() {
    const path = location.pathname;
    if (path.startsWith('/interweb')) return 'interweb';
    if (path.startsWith('/code')) return 'code';
    if (path.startsWith('/scribe')) return 'scribe';
    if (path.startsWith('/syncori/optics') || path.startsWith('/optics')) return 'optics';
    if (path.startsWith('/syncori') || path.startsWith('/augment')) return 'augment';
    return null;
  }

  function makeButton(label, glyph, action, active=false) {
    const element = document.createElement('button');
    element.type = 'button';
    element.setAttribute('aria-label', label);
    if (active) element.setAttribute('aria-current','page');
    const g = document.createElement('span');
    g.className = 'glyph';
    g.textContent = glyph;
    element.append(g, document.createTextNode(label));
    element.addEventListener('click', action);
    return element;
  }

  function expectedDockSignature() {
    return state.optics?.stream ? 'optics-live' : `primary:${primaryActive() || 'home'}`;
  }

  function currentDockLabels() {
    return [...(dock?.querySelectorAll('button') || [])].map(b => b.getAttribute('aria-label')).join('|');
  }

  function renderDock(force=false) {
    if (!dock) return;
    const signature = expectedDockSignature();
    const expectedLabels = state.optics?.stream ? OPTICS.map(x=>x[0]).join('|') : PRIMARY.map(x=>x[1]).join('|');
    if (!force && dock.dataset.jtSignature === signature && dock.children.length === 5 && currentDockLabels() === expectedLabels) return;

    const fragment = document.createDocumentFragment();
    if (state.optics?.stream) {
      OPTICS.forEach(([label,glyph]) => fragment.append(makeButton(label,glyph,() => opticsAction(label))));
    } else {
      const active = primaryActive();
      PRIMARY.forEach(([key,label,glyph,route]) => {
        fragment.append(makeButton(label,glyph,() => {
          materialPulse();
          globalThis.SkillUI?.navigate?.(route);
        },key===active));
      });
    }
    dock.replaceChildren(fragment);
    dock.dataset.jtSignature = signature;
  }

  function materialPulse(x='50%', y='80%') {
    if (!viewport) return;
    viewport.style.setProperty('--reform-x', typeof x === 'number' ? `${x}px` : x);
    viewport.style.setProperty('--reform-y', typeof y === 'number' ? `${y}px` : y);
    viewport.classList.remove('jt-reforming');
    void viewport.offsetWidth;
    viewport.classList.add('jt-reforming');
    setTimeout(() => viewport.classList.remove('jt-reforming'), 820);
  }

  const field = { ctx:null,dpr:1,w:0,h:0,t:0,ripples:[],raf:0 };
  function resizeField() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    field.dpr = Math.min(2,devicePixelRatio||1);
    field.w = Math.max(1,rect.width); field.h = Math.max(1,rect.height);
    canvas.width = Math.round(field.w*field.dpr); canvas.height = Math.round(field.h*field.dpr);
    field.ctx = canvas.getContext('2d');
    field.ctx.setTransform(field.dpr,0,0,field.dpr,0,0);
  }
  function chromeGradient(ctx,x,y,r) {
    const g = ctx.createRadialGradient(x-r*.24,y-r*.3,r*.03,x,y,r);
    [['0','#fff'],['.09','#747a7f'],['.22','#090b0c'],['.39','#eef0f1'],['.54','#2a2e31'],['.68','#f5f6f6'],['.83','#0b0c0d'],['1','#777c80']]
      .forEach(([p,c]) => g.addColorStop(Number(p),c));
    return g;
  }
  function drawField(now=0) {
    if (!field.ctx || !canvas?.isConnected) return;
    const ctx=field.ctx,w=field.w,h=field.h,t=now*.001;
    ctx.clearRect(0,0,w,h); ctx.fillStyle='#000'; ctx.fillRect(0,0,w,h);
    const poolY=h*.78;
    const pool=ctx.createLinearGradient(0,poolY-h*.16,0,h);
    [['0','rgba(0,0,0,0)'],['.28','rgba(220,224,226,.10)'],['.46','rgba(30,33,35,.72)'],['.62','rgba(235,237,238,.19)'],['.78','rgba(7,8,9,.94)'],['1','rgba(160,164,167,.22)']]
      .forEach(([p,c])=>pool.addColorStop(Number(p),c));
    ctx.fillStyle=pool; ctx.beginPath(); ctx.moveTo(0,h);
    for(let x=0;x<=w;x+=8) ctx.lineTo(x,poolY+Math.sin(x*.019+t*1.2)*5+Math.sin(x*.047-t*.7)*2.5);
    ctx.lineTo(w,h); ctx.closePath(); ctx.fill();
    const ox=w*.5+Math.sin(t*.48)*3,oy=h*.45+Math.cos(t*.41)*2,r=Math.min(w,h)*.115*(1+Math.sin(t*1.25)*.025);
    ctx.save(); ctx.shadowBlur=42; ctx.shadowColor='rgba(255,255,255,.12)'; ctx.fillStyle=chromeGradient(ctx,ox,oy,r);
    ctx.beginPath(); ctx.arc(ox,oy,r,0,Math.PI*2); ctx.fill(); ctx.restore();
    field.ripples=field.ripples.filter(rp=>now-rp.started<1200);
    field.ripples.forEach(rp=>{
      const age=Math.max(0,(now-rp.started)/1200),radius=18+age*Math.max(w,h)*.44;
      ctx.strokeStyle=`rgba(235,238,240,${(1-age)*.46})`; ctx.lineWidth=Math.max(.5,2-age*1.5);
      ctx.beginPath(); ctx.ellipse(rp.x,rp.y,radius,radius*.32,0,0,Math.PI*2); ctx.stroke();
    });
    field.raf=requestAnimationFrame(drawField);
  }
  function ripple(clientX,clientY) {
    if (!canvas) return;
    const rect=canvas.getBoundingClientRect();
    field.ripples.push({x:clientX-rect.left,y:clientY-rect.top,started:performance.now()});
  }

  const SpeechCtor = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
  function restartRecognition() {
    if (!state.listening || state.speaking || !state.recognizer) return;
    try { state.recognizer.start(); }
    catch(error) { if(error?.name!=='InvalidStateError') setSpeech('ERROR',error?.message||'speech start failed'); }
  }
  async function beginVoice() {
    const SR=SpeechCtor();
    if(!SR || !navigator.mediaDevices?.getUserMedia) {
      setSpeech('FALLBACK','Speech recognition unavailable'); intentInput?.focus(); return false;
    }
    try {
      state.micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    } catch(error) {
      setSpeech(error?.name==='NotAllowedError'?'FALLBACK':'ERROR',error?.message||'Microphone unavailable');
      showResponse(error?.name==='NotAllowedError'?'Microphone permission denied. Type your intent instead.':'Microphone unavailable. Type your intent instead.');
      return false;
    }
    state.listening=true;
    const recognizer=state.recognizer=new SR();
    recognizer.lang='en-US'; recognizer.continuous=true; recognizer.interimResults=true;
    recognizer.onstart=()=>setSpeech('LISTENING');
    recognizer.onspeechstart=()=>setSpeech('HEARING');
    recognizer.onresult=event=>{
      const result=event.results[event.results.length-1],text=result?.[0]?.transcript?.trim();
      if(!text)return; setSpeech('HEARING'); if(result.isFinal)handleIntent(text,'voice');
    };
    recognizer.onerror=event=>{
      if(event.error==='aborted'&&state.speaking)return;
      if(event.error==='not-allowed'||event.error==='service-not-allowed'){
        state.listening=false; setSpeech('FALLBACK',event.error); showResponse('Voice permission is unavailable. Type your intent instead.');
      } else if(event.error==='no-speech') setSpeech('LISTENING');
      else setSpeech('ERROR',event.error||'speech error');
    };
    recognizer.onend=()=>{if(state.listening&&!state.speaking)setTimeout(restartRecognition,160);};
    restartRecognition(); return true;
  }
  function stopVoice() {
    state.listening=false; try{state.recognizer?.abort();}catch{} state.recognizer=null;
    state.micStream?.getTracks?.().forEach(track=>track.stop()); state.micStream=null; setSpeech('IDLE');
  }
  function chooseVoice() {
    if(!('speechSynthesis'in window))return null;
    const voices=speechSynthesis.getVoices();
    return voices.find(v=>/en[-_]GB/i.test(v.lang)&&/Daniel|George|Male|Arthur|Oliver/i.test(v.name))
      ||voices.find(v=>/en[-_]GB/i.test(v.lang))||voices.find(v=>/en/i.test(v.lang))||voices[0]||null;
  }
  function speak(text) {
    if(!text||!('speechSynthesis'in window))return;
    state.speaking=true; setSpeech('SPEAKING'); try{state.recognizer?.abort();}catch{} speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(String(text)),voice=chooseVoice(); if(voice)u.voice=voice; u.rate=.98;u.pitch=.78;
    const done=()=>{state.speaking=false;if(state.listening){setSpeech('LISTENING');setTimeout(restartRecognition,140);}else setSpeech('IDLE');};
    u.onend=done;u.onerror=done;speechSynthesis.speak(u);
  }
  const resultText=result=>result?.speech?.text||result?.message||result?.reply?.text||result?.result?.text||result?.result?.content||null;
  function resultRoute(result) {
    const explicit=result?.render?.route||result?.manifest?.route||result?.route;
    if(typeof explicit==='string'&&explicit.startsWith('/'))return explicit;
    const raw=String(result?.render?.scene||result?.render_state?.scene||result?.capability||result?.machine||result?.orchestration?.machine||result?.orchestration?.capability||result?.orchestration?.plan?.[0]?.machine||'').toLowerCase();
    if(/horus|optic|vision/.test(raw))return'/syncori/optics/';
    if(/hathor|syncori|augment|audio/.test(raw))return'/syncori/';
    if(/ptah|code/.test(raw))return'/code/';
    if(/thoth|scribe|write/.test(raw))return'/scribe/';
    if(/wepwawet|interweb|search|web/.test(raw))return'/interweb/';
    return null;
  }
  async function demoMode() {
    setRuntime('MANIFESTING');materialPulse();showResponse(`This is not an app. This is me. · GID ${GID} · PRIME ORCHESTRATOR`,true);
    try {
      const [tae,render]=await Promise.allSettled([
        Mercury.tae('TAE, enter Demo Mode'),
        Mercury.request(Mercury.CONFIG.routes.render,{method:'POST',body:{gid:GID,scene:'trismegistus',state:'active',material:'mercury',mode:'Prime Orchestrator',demo_mode:true}})
      ]);
      if(tae.status==='rejected'&&render.status==='rejected')throw tae.reason;
      const payload=tae.status==='fulfilled'?tae.value:render.value,text=resultText(payload)||'This is not an app. This is me.';
      showResponse(`${text} · GID ${GID} · PRIME ORCHESTRATOR`,true);speak(text);globalThis.SkillUI?.navigate?.('/home/?demo=1');
    } catch(error) { showResponse(`TAE is unavailable: ${error.message}`); }
    finally { setRuntime('ACTIVE'); }
  }
  async function handleIntent(text,modality='text') {
    if(!text||state.runtime==='EXECUTING')return;
    state.lastIntent=text;
    if(/^\s*tae[\s,:-]+enter\s+demo\s+mode[.!]?\s*$/i.test(text))return demoMode();
    setRuntime('UNDERSTANDING');showResponse(text);materialPulse();
    try {
      setRuntime('ORCHESTRATING');
      const request=Mercury.dispatch('auto',text,{modality,source:'jahorin-shell',gid:GID});
      setRuntime('EXECUTING');
      const result=await request;
      setRuntime('MANIFESTING');const speech=resultText(result),route=resultRoute(result);
      if(speech){showResponse(speech);speak(speech);} if(route)globalThis.SkillUI?.navigate?.(route); setRuntime('ACTIVE');
    } catch(error) { setRuntime('ERROR');showResponse(`ARI could not execute that intention: ${error.message}`,true); }
  }

  async function wake(event) {
    if(state.awake)return;
    state.awake=true;document.body.classList.add('jahorin-awake');setRuntime('ACTIVE');
    const rect=wakeLayer?.getBoundingClientRect();
    if(rect&&event){const x=event.clientX-rect.left,y=event.clientY-rect.top;wakeLayer.style.setProperty('--wake-x',`${x}px`);wakeLayer.style.setProperty('--wake-y',`${y}px`);ripple(event.clientX,event.clientY);}
    try {
      const AudioCtor=window.AudioContext||window.webkitAudioContext;
      if(AudioCtor){const ctx=new AudioCtor(),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=440;g.gain.value=.0001;o.connect(g).connect(ctx.destination);g.gain.exponentialRampToValueAtTime(.055,ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.6);o.start();o.stop(ctx.currentTime+.62);o.onended=()=>ctx.close();}
    }catch{}
    beginVoice();canonicalHeader();renderDock(true);showResponse('This is not an app. This is me.');
    if(location.pathname==='/'||location.pathname==='')globalThis.SkillUI?.navigate?.('/home/');
    setTimeout(()=>wakeLayer?.classList.add('dissolving'),420);setTimeout(()=>wakeLayer?.remove(),1350);
  }

  const activeOpticsComponent=()=>state.optics||viewport?.querySelector('syncori-capability[group="syncori-optics"]')||null;
  function opticsReadout(component,text){const out=component?.querySelector('.capability-readout');if(out)out.textContent=text;showResponse(text);}
  function captureOptics(component){
    const video=component?.querySelector('[data-camera]');
    if(!video?.videoWidth){opticsReadout(component,'Open the live optic feed first.');return null;}
    const scale=Math.min(1,1024/Math.max(video.videoWidth,video.videoHeight)),c=document.createElement('canvas');
    c.width=Math.round(video.videoWidth*scale);c.height=Math.round(video.videoHeight*scale);c.getContext('2d').drawImage(video,0,0,c.width,c.height);
    component.__jtFrame={canvas:c,dataUrl:c.toDataURL('image/jpeg',.8)};opticsReadout(component,`Frame captured · ${c.width}×${c.height}`);materialPulse();return component.__jtFrame;
  }
  function openEditor(component){
    const frame=component?.__jtFrame||captureOptics(component);if(!frame)return;
    component.querySelector('.jt-optics-editor')?.remove();
    const editor=document.createElement('section');editor.className='jt-optics-editor';
    const c=document.createElement('canvas');c.width=frame.canvas.width;c.height=frame.canvas.height;
    const controls=document.createElement('div');controls.className='jt-editor-controls';controls.innerHTML='<label>BRIGHTNESS<input data-b type="range" min="50" max="160" value="100"></label><label>CONTRAST<input data-c type="range" min="50" max="180" value="100"></label><button type="button">SAVE</button>';
    editor.append(c,controls);component.append(editor);
    const draw=()=>{const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.filter=`brightness(${controls.querySelector('[data-b]').value}%) contrast(${controls.querySelector('[data-c]').value}%)`;x.drawImage(frame.canvas,0,0);};
    controls.querySelectorAll('input').forEach(input=>input.addEventListener('input',draw));
    controls.querySelector('button').addEventListener('click',()=>{const a=document.createElement('a');a.download='jahorin-optics-frame.png';a.href=c.toDataURL('image/png');a.click();});
    draw();opticsReadout(component,'Optics editor active.');
  }
  async function opticsAction(action){
    const component=activeOpticsComponent();if(!component){state.optics=null;renderDock(true);return;}
    if(action==='SEE'){if(!component.stream)await component.openCamera(component.querySelector('.capability-readout'));return;}
    if(action==='CAPTURE')return captureOptics(component);
    if(action==='ANALYZE'){
      const frame=component.__jtFrame||captureOptics(component);if(!frame)return;opticsReadout(component,'ARI · analyzing captured frame…');
      try{const result=await Mercury.dispatch('vision','Analyze the captured frame contextually.',{image_data_url:frame.dataUrl,modality:'camera'}),text=resultText(result)||'Visual analysis returned.';opticsReadout(component,text);speak(text);}catch(error){opticsReadout(component,error.message);}return;
    }
    if(action==='MACRO'){
      const track=component.stream?.getVideoTracks?.()[0],caps=track?.getCapabilities?.()||{};if(!caps.zoom)return opticsReadout(component,'Macro zoom is not supported by this camera.');
      const zoom=Math.min(caps.zoom.max||2,Math.max(caps.zoom.min||1,2));try{await track.applyConstraints({advanced:[{zoom}]});opticsReadout(component,`Macro lens · ${zoom.toFixed(1)}×`);}catch(error){opticsReadout(component,`Macro control failed: ${error.message}`);}return;
    }
    if(action==='EDITOR')openEditor(component);
  }
  function patchOpticsElement(){
    const Ctor=customElements.get('syncori-capability');if(!Ctor||Ctor.prototype.__jtPatched)return;Ctor.prototype.__jtPatched=true;
    const open=Ctor.prototype.openCamera,close=Ctor.prototype.closeCamera;
    Ctor.prototype.openCamera=async function(readout){await open.call(this,readout);if(this.stream){state.optics=this;renderDock(true);}};
    Ctor.prototype.closeCamera=function(readout){const wasActive=state.optics===this;close.call(this,readout);if(wasActive){state.optics=null;renderDock(true);}};
  }

  function reconcile(){
    canonicalHeader();if(!state.optics?.isConnected)state.optics=null;renderDock();materialPulse();
  }
  let reconcileTimer=0;
  const scheduleReconcile=()=>{clearTimeout(reconcileTimer);reconcileTimer=setTimeout(reconcile,30);};
  new MutationObserver(scheduleReconcile).observe(viewport,{childList:true});
  new MutationObserver(()=>{if(currentDockLabels()!== (state.optics?.stream?OPTICS.map(x=>x[0]).join('|'):PRIMARY.map(x=>x[1]).join('|')))scheduleReconcile();}).observe(dock,{childList:true});

  intentShell?.addEventListener('submit',event=>{event.preventDefault();const value=intentInput?.value.trim();if(!value)return;intentInput.value='';handleIntent(value,'text');});
  micButton?.addEventListener('click',()=>state.listening?stopVoice():beginVoice());
  wakeButton?.addEventListener('pointerdown',event=>wake(event),{once:true});
  wakeButton?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();wake({clientX:innerWidth/2,clientY:innerHeight/2});}},{once:true});
  window.addEventListener('resize',resizeField);
  window.addEventListener('online',()=>Mercury.status());
  window.addEventListener('offline',()=>{const status=document.querySelector('.shell-status');if(status){status.dataset.online='false';status.textContent='ARI · offline';}});
  window.addEventListener('beforeunload',stopVoice,{once:true});
  if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=chooseVoice;

  customElements.whenDefined('syncori-capability').then(patchOpticsElement).catch(()=>{});
  canonicalHeader();renderDock(true);resizeField();field.raf=requestAnimationFrame(drawField);setSpeech('IDLE');setRuntime('BOOT');

  globalThis.Jahorin=Object.freeze({wake,handleIntent,demoMode,beginVoice,stopVoice,state:()=>({awake:state.awake,runtime:state.runtime,speech:state.speech,listening:state.listening,lastIntent:state.lastIntent})});
})();
