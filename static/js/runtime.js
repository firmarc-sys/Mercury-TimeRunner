(() => {
  'use strict';
  const CONFIG = Object.freeze({
    version:'3.1.0', system:'jahorin-mercury', ownerGid:'399152573423', ownerMode:'Prime Orchestrator',
    ari:'https://ari-689058655022.us-west1.run.app', runtime:'https://agentic-mercury-runtime-689058655022.us-west1.run.app',
    routes:{health:'/api/health',ready:'/api/ready',identity:'/api/identity',session:'/api/identity/session',render:'/api/render-state',iot:'/api/iot',syncori:'/api/syncori',tae:'/api/tae',runtime:'/api/runtime'},
    pages:{mercury:'/home/',interweb:'/interweb/',augment:'/augment/',code:'/code/',scribe:'/scribe/',optics:'/optics/'}
  });
  const state={surface:document.body?.dataset?.surface||'unknown',identity:null,online:navigator.onLine};
  const apiBase=()=>location.protocol==='file:'?CONFIG.ari:'';
  const url=p=>/^https?:/i.test(p)?p:`${apiBase()}${p}`;
  const uuid=()=>crypto?.randomUUID?.()||`req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  async function request(path, options={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),options.timeout||30000);try{const headers={Accept:'application/json','X-Request-ID':uuid(),...(options.headers||{})};if(options.body)headers['Content-Type']='application/json';const res=await fetch(url(path),{method:options.method||(options.body?'POST':'GET'),headers,body:options.body?JSON.stringify(options.body):undefined,credentials:'include',cache:'no-store',signal:controller.signal});const ct=res.headers.get('content-type')||'';const data=ct.includes('json')?await res.json():await res.text();if(!res.ok)throw new Error(data?.error||data?.detail||`ARI HTTP ${res.status}`);state.online=true;return data}finally{clearTimeout(timer)}}
  async function identity(){try{state.identity=await request(CONFIG.routes.identity,{timeout:7000});return state.identity}catch{state.identity={authenticated:false};return state.identity}}
  async function authenticate(accessCode){const out=await request(CONFIG.routes.session,{method:'POST',body:{access_code:accessCode}});await identity();return out}
  async function signOut(){try{return await request(CONFIG.routes.session,{method:'DELETE'})}finally{state.identity={authenticated:false}}}
  async function dispatch(capability,intent,payload={}){return request(CONFIG.routes.runtime,{method:'POST',body:{gid:state.identity?.authenticated?state.identity.gid:null,intent,capability,module:state.surface,payload,request_id:uuid(),context:{href:location.href,locale:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone}}})}
  async function tae(prompt='TAE, enter Demo Mode'){return request(CONFIG.routes.tae,{method:'POST',body:{prompt,request_id:uuid()}})}
  function go(surface){location.href=CONFIG.pages[surface]||surface}
  function toast(message){let el=document.querySelector('.toast');if(!el){el=document.createElement('div');el.className='toast';document.querySelector('.app')?.append(el)}el.textContent=String(message);el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2600)}
  function dock(active){const el=document.querySelector('.dock');if(!el)return;const items=[['mercury','☿','Mercury'],['interweb','◎','Interweb'],['augment','◉','Augment'],['code','⌨','Code'],['scribe','✒','Scribe'],['optics','◉','Optics']];el.innerHTML='';for(const [k,g,l] of items){const b=document.createElement('button');b.className=k===active?'active':'';b.innerHTML=`<span class="glyph">${g}</span>${l}`;b.onclick=()=>go(k);el.append(b)}}
  async function status(){const el=document.querySelector('.status');if(!el)return;try{const [h,r]=await Promise.all([request(CONFIG.routes.health,{timeout:5000}),request(CONFIG.routes.ready,{timeout:5000})]);el.dataset.online='true';el.textContent=`ARI · ${r?.ok===false?'configuring':'online'} · GID ${CONFIG.ownerGid}`;return{h,r}}catch(e){el.dataset.online='false';el.textContent='ARI · offline';return null}}
  globalThis.Mercury={CONFIG,state,request,identity,authenticate,signOut,dispatch,tae,go,toast,dock,status};
})();