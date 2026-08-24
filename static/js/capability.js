const SyncoriAudio = (() => {
  let ctx = null;
  let master = null;
  const buses = new Map();
  let sample = null;

  function ensure() {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) throw new Error('Web Audio is unavailable on this device.');
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = .72;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function bus(name) {
    ensure();
    if (!buses.has(name)) {
      const gain = ctx.createGain();
      gain.gain.value = .72;
      gain.connect(master);
      buses.set(name, gain);
    }
    return buses.get(name);
  }

  function setGain(name, value) {
    ensure();
    const target = name === 'master' ? master : bus(name);
    target.gain.setTargetAtTime(Number(value), ctx.currentTime, .02);
  }

  function note(freq, duration=.38, waveform='sine') {
    ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = waveform;
    o.frequency.value = Number(freq);
    g.gain.setValueAtTime(.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.16, ctx.currentTime + .012);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
    o.connect(g).connect(bus('keys'));
    o.start();
    o.stop(ctx.currentTime + duration + .02);
  }

  function drum(kind='kick') {
    ensure();
    const now = ctx.currentTime;
    if (kind === 'kick') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(145, now);
      o.frequency.exponentialRampToValueAtTime(42, now + .19);
      g.gain.setValueAtTime(.7, now);
      g.gain.exponentialRampToValueAtTime(.0001, now + .24);
      o.connect(g).connect(bus('drums')); o.start(now); o.stop(now + .25); return;
    }
    const length = Math.floor(ctx.sampleRate * .18);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<length;i++) data[i] = (Math.random()*2-1) * (1-i/length);
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = kind === 'hat' ? 'highpass' : 'bandpass';
    filter.frequency.value = kind === 'hat' ? 6500 : 1800;
    gain.gain.value = kind === 'clap' ? .28 : .22;
    source.connect(filter).connect(gain).connect(bus('drums'));
    source.start(now);
  }

  async function loadSample(file) {
    ensure();
    sample = await ctx.decodeAudioData(await file.arrayBuffer());
    return sample;
  }

  function playSample() {
    ensure();
    if (!sample) throw new Error('Load an audio sample first.');
    const source = ctx.createBufferSource();
    source.buffer = sample;
    source.connect(bus('sample'));
    source.start();
    return source;
  }

  return { ensure, setGain, note, drum, loadSample, playSample, get sample(){ return sample; } };
})();

class SyncoriCapability extends HTMLElement {
  constructor() {
    super();
    this.stream = null;
    this.mounted = false;
    this.cleanupFns = [];
  }

  connectedCallback() {
    if (this.mounted) return;
    this.mounted = true;

    const group = this.getAttribute('group') || 'syncori-audio';
    const capability = this.getAttribute('capability') || 'instrument';
    const title = this.getAttribute('title') || capability;
    const image = this.getAttribute('image') || (group === 'syncori-optics' ? '/assets2/optics.jpg' : '/assets2/augment.jpg');
    const subtitle = group === 'syncori-optics' ? 'SYNCORI · Augmented Optics' : 'SYNCORI · Augmented Audio';

    const hero = document.createElement('div');
    hero.className = 'capability-hero';
    const poster = document.createElement('img');
    poster.className = 'screen-image';
    poster.src = image;
    poster.alt = title;
    poster.dataset.poster = '';
    hero.append(poster);

    if (group === 'syncori-optics') {
      const video = document.createElement('video');
      video.className = 'camera-live hidden';
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.dataset.camera = '';
      hero.append(video);
    }

    const shade = document.createElement('div');
    shade.className = 'screen-shade';
    hero.append(shade);

    const heading = document.createElement('header');
    heading.className = 'capability-title';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const span = document.createElement('span');
    span.textContent = subtitle;
    heading.append(strong, span);

    const controls = document.createElement('section');
    controls.className = 'capability-controls';
    controls.setAttribute('aria-label', `${title} controls`);
    const readout = document.createElement('output');
    readout.className = 'capability-readout';
    readout.setAttribute('aria-live', 'polite');
    readout.textContent = `${title} ready.`;

    this.append(hero, heading, controls);

    const sync = async (action, extra={}) => {
      readout.textContent = `${action} · sending to ARI…`;
      try {
        const route = group === 'syncori-optics' ? Mercury.CONFIG.routes.iot : Mercury.CONFIG.routes.syncori;
        const result = await Mercury.request(route, {
          method: 'POST',
          body: {
            suite: 'SYNCORI', group, capability, action,
            timestamp: new Date().toISOString(), ...extra
          }
        });
        readout.textContent = result?.message || `${capability} · ${action} accepted.`;
        return result;
      } catch (error) {
        readout.textContent = error.message;
        throw error;
      }
    };

    if (group === 'syncori-optics') this.buildOpticsControls(controls, readout, sync);
    else this.buildAudioControls(capability, controls, readout, sync);

    controls.append(readout);
  }

  disconnectedCallback() {
    this.closeCamera();
    this.cleanupFns.splice(0).forEach(fn => { try { fn(); } catch {} });
  }

  makeButton(label, className='action') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
  }

  actions(...buttons) {
    const row = document.createElement('div');
    row.className = 'capability-actions';
    buttons.forEach(button => row.append(button));
    return row;
  }

  buildAudioControls(capability, controls, readout, sync) {
    try { SyncoriAudio.ensure(); }
    catch (error) { readout.textContent = error.message; }

    if (capability === 'keys') {
      const notes = [['C3',130.81],['D3',146.83],['E3',164.81],['F3',174.61],['G3',196],['A3',220],['B3',246.94],['C4',261.63],['D4',293.66],['E4',329.63]];
      const grid = document.createElement('div');
      grid.className = 'syncori-live-keys';
      notes.forEach(([name,freq]) => {
        const key = this.makeButton(name,'action');
        key.addEventListener('pointerdown',() => { SyncoriAudio.note(freq,.42,'triangle'); readout.textContent = `KEYS · ${name}`; });
        grid.append(key);
      });
      const save = this.makeButton('SAVE STATE','action secondary');
      save.addEventListener('click',() => sync('save-state',{ instrument:'keys' }).catch(()=>{}));
      controls.append(grid, this.actions(save));
      return;
    }

    if (capability === 'drums') {
      const grid = document.createElement('div');
      grid.className = 'syncori-live-pads';
      ['kick','snare','hat','clap'].forEach(kind => {
        const pad = this.makeButton(kind.toUpperCase(),'action');
        pad.addEventListener('pointerdown',() => { SyncoriAudio.drum(kind); readout.textContent = `DRUMS · ${kind.toUpperCase()}`; });
        grid.append(pad);
      });
      const save = this.makeButton('SAVE STATE','action secondary');
      save.addEventListener('click',() => sync('save-state',{ instrument:'drums' }).catch(()=>{}));
      controls.append(grid, this.actions(save));
      return;
    }

    if (capability === 'loop') {
      const pattern = [
        [1,0,0,0,1,0,0,0],
        [0,0,1,0,0,0,1,0],
        [1,1,1,1,1,1,1,1],
        [0,0,0,0,0,0,1,0]
      ];
      const sounds = ['kick','snare','hat','clap'];
      const grid = document.createElement('div');
      grid.className = 'syncori-live-sequencer';
      pattern.forEach((row,r) => row.forEach((on,c) => {
        const step = this.makeButton(String(c+1),'action');
        step.dataset.on = on ? '1' : '0';
        step.setAttribute('aria-label',`${sounds[r]} step ${c+1}`);
        step.addEventListener('click',() => {
          pattern[r][c] ^= 1;
          step.dataset.on = pattern[r][c] ? '1' : '0';
        });
        grid.append(step);
      }));
      const play = this.makeButton('PLAY','action');
      const save = this.makeButton('SAVE STATE','action secondary');
      let timer = null, tick = 0;
      const stop = () => { if (timer) clearInterval(timer); timer = null; play.textContent = 'PLAY'; };
      play.addEventListener('click',() => {
        if (timer) return stop();
        SyncoriAudio.ensure();
        play.textContent = 'STOP';
        timer = setInterval(() => {
          pattern.forEach((row,r) => { if (row[tick]) SyncoriAudio.drum(sounds[r]); });
          readout.textContent = `LOOP · STEP ${tick+1}`;
          tick = (tick+1)%8;
        },250);
      });
      save.addEventListener('click',() => sync('save-state',{ instrument:'loop', pattern }).catch(()=>{}));
      this.cleanupFns.push(stop);
      controls.append(grid, this.actions(play,save));
      return;
    }

    if (capability === 'sample') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.className = 'field';
      input.setAttribute('aria-label','Load audio sample');
      const canvas = document.createElement('canvas');
      canvas.className = 'syncori-live-wave';
      canvas.width = 720; canvas.height = 150;
      const play = this.makeButton('PLAY','action');
      play.disabled = true;
      input.addEventListener('change',async() => {
        const file = input.files?.[0];
        if (!file) return;
        readout.textContent = 'SAMPLE · decoding…';
        try {
          const buffer = await SyncoriAudio.loadSample(file);
          this.drawWaveform(canvas,buffer);
          play.disabled = false;
          readout.textContent = `SAMPLE · ${file.name} · ${buffer.duration.toFixed(2)}s`;
        } catch (error) { readout.textContent = error.message; }
      });
      play.addEventListener('click',() => {
        try { SyncoriAudio.playSample(); readout.textContent = 'SAMPLE · playing'; }
        catch (error) { readout.textContent = error.message; }
      });
      const save = this.makeButton('SAVE STATE','action secondary');
      save.addEventListener('click',() => sync('save-state',{ instrument:'sample', loaded:!!SyncoriAudio.sample }).catch(()=>{}));
      controls.append(input,canvas,this.actions(play,save));
      return;
    }

    if (capability === 'mix') {
      const bank = document.createElement('div');
      bank.className = 'syncori-live-mix';
      [['KEYS','keys'],['DRUMS','drums'],['SAMPLE','sample'],['MASTER','master']].forEach(([label,name]) => {
        const wrap = document.createElement('label');
        wrap.textContent = label;
        const range = document.createElement('input');
        range.type = 'range'; range.min='0'; range.max='1.25'; range.step='.01'; range.value='.72';
        range.addEventListener('input',() => { SyncoriAudio.setGain(name,range.value); readout.textContent = `MIX · ${label} ${Math.round(range.value*100)}%`; });
        wrap.append(range); bank.append(wrap);
      });
      const test = this.makeButton('TEST MIX','action');
      test.addEventListener('click',() => { SyncoriAudio.note(220,.22); setTimeout(()=>SyncoriAudio.drum('kick'),90); });
      const save = this.makeButton('SAVE STATE','action secondary');
      save.addEventListener('click',() => sync('save-state',{ instrument:'mix' }).catch(()=>{}));
      controls.append(bank,this.actions(test,save));
      return;
    }

    const range = document.createElement('input');
    range.className = 'capability-range'; range.type='range'; range.min='0'; range.max='100'; range.value='50';
    range.setAttribute('aria-label',`${capability} control value`);
    const activate = this.makeButton('ACTIVATE','action');
    const shape = this.makeButton('SHAPE','action secondary');
    const save = this.makeButton('SAVE STATE','action secondary');
    activate.addEventListener('click',() => {
      const freq = 110 * Math.pow(2, Number(range.value)/50);
      SyncoriAudio.note(freq,.5,capability==='synth'?'sawtooth':'sine');
      sync('activate',{ value:Number(range.value) }).catch(()=>{});
    });
    shape.addEventListener('click',() => sync('shape',{ value:Number(range.value) }).catch(()=>{}));
    save.addEventListener('click',() => sync('save-state',{ value:Number(range.value) }).catch(()=>{}));
    range.addEventListener('input',() => { readout.textContent = `${capability} · control ${range.value}`; });
    controls.append(range,this.actions(activate,shape,save));
  }

  buildOpticsControls(controls, readout, sync) {
    const range = document.createElement('input');
    range.className='capability-range'; range.type='range'; range.min='0'; range.max='100'; range.value='50';
    range.setAttribute('aria-label','Optics control value');
    const activate=this.makeButton('ACTIVATE','action');
    const camera=this.makeButton('CAMERA','action secondary');
    const close=this.makeButton('CLOSE + SYNC','action secondary');
    activate.addEventListener('click',()=>sync('activate',{value:Number(range.value)}).catch(()=>{}));
    camera.addEventListener('click',()=>this.openCamera(readout));
    close.addEventListener('click',()=>{this.closeCamera(readout);sync('sync',{value:Number(range.value)}).catch(()=>{});});
    range.addEventListener('input',()=>{readout.textContent=`OPTICS · control ${range.value}`;});
    controls.append(range,this.actions(activate,camera,close));
  }

  drawWaveform(canvas, buffer) {
    const ctx=canvas.getContext('2d'), data=buffer.getChannelData(0), step=Math.max(1,Math.floor(data.length/canvas.width));
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.strokeStyle='#eef2f4'; ctx.beginPath();
    for(let x=0;x<canvas.width;x++){
      let min=1,max=-1,start=x*step;
      for(let i=0;i<step&&start+i<data.length;i++){const v=data[start+i];min=Math.min(min,v);max=Math.max(max,v);}
      ctx.moveTo(x,(1-max)*canvas.height/2); ctx.lineTo(x,(1-min)*canvas.height/2);
    }
    ctx.stroke();
  }

  async openCamera(readout) {
    const video = this.querySelector('[data-camera]');
    if (!video || !navigator.mediaDevices?.getUserMedia) {
      if (readout) readout.textContent = 'Camera API is unavailable on this device.';
      return;
    }
    try {
      this.closeCamera();
      this.stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:{ideal:'environment'}}, audio:false });
      video.srcObject = this.stream;
      video.classList.remove('hidden');
      this.querySelector('[data-poster]')?.classList.add('hidden');
      if (readout) readout.textContent = 'Camera live.';
    } catch (error) {
      if (readout) readout.textContent = error.name === 'NotAllowedError' ? 'Camera permission denied.' : error.message;
    }
  }

  closeCamera(readout) {
    this.stream?.getTracks?.().forEach(track=>track.stop());
    this.stream=null;
    const video=this.querySelector('[data-camera]');
    if(video){video.srcObject=null;video.classList.add('hidden');}
    this.querySelector('[data-poster]')?.classList.remove('hidden');
    if(readout)readout.textContent='Camera closed.';
  }
}

if (!customElements.get('syncori-capability')) customElements.define('syncori-capability',SyncoriCapability);

export const CapabilityController = { mount(){ return () => {}; } };

document.addEventListener('DOMContentLoaded',() => {
  if (globalThis.SkillUI) return;
  const element=document.querySelector('syncori-capability');
  if(!element)return;
  Mercury.status();
  Mercury.dock(element.getAttribute('group')==='syncori-optics'?'optics':'augment');
});
