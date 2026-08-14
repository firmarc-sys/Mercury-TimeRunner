class SyncoriCapability extends HTMLElement {
  constructor() {
    super();
    this.stream = null;
    this.mounted = false;
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

    const range = document.createElement('input');
    range.className = 'capability-range';
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.value = '50';
    range.setAttribute('aria-label', `${title} control value`);

    const actions = document.createElement('div');
    actions.className = 'capability-actions';
    const primary = this.makeButton('Activate', 'action');
    const secondary = this.makeButton(group === 'syncori-optics' ? 'Camera' : 'Shape', 'action secondary');
    const tertiary = this.makeButton(group === 'syncori-optics' ? 'Close + Sync' : 'Save State', 'action secondary');
    actions.append(primary, secondary, tertiary);

    const readout = document.createElement('output');
    readout.className = 'capability-readout';
    readout.setAttribute('aria-live', 'polite');
    readout.textContent = `${title} ready.`;

    controls.append(range, actions, readout);
    this.append(hero, heading, controls);

    const sync = async action => {
      readout.textContent = `${action} · sending to ARI…`;
      try {
        const route = group === 'syncori-optics' ? Mercury.CONFIG.routes.iot : Mercury.CONFIG.routes.syncori;
        await Mercury.request(route, {
          method: 'POST',
          body: {
            suite: 'SYNCORI',
            group,
            capability,
            action,
            value: Number(range.value),
            timestamp: new Date().toISOString()
          }
        });
        readout.textContent = `${capability} · ${action} accepted.`;
      } catch (error) {
        readout.textContent = error.message;
      }
    };

    primary.addEventListener('click', () => sync('activate'));
    if (group === 'syncori-optics') {
      secondary.addEventListener('click', () => this.openCamera(readout));
      tertiary.addEventListener('click', () => {
        this.closeCamera(readout);
        sync('sync');
      });
    } else {
      secondary.addEventListener('click', () => sync('shape'));
      tertiary.addEventListener('click', () => sync('save-state'));
    }

    range.addEventListener('input', () => {
      readout.textContent = `${capability} · control ${range.value}`;
    });
  }

  disconnectedCallback() {
    this.closeCamera();
  }

  makeButton(label, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
  }

  async openCamera(readout) {
    const video = this.querySelector('[data-camera]');
    if (!video || !navigator.mediaDevices?.getUserMedia) {
      if (readout) readout.textContent = 'Camera API is unavailable on this device.';
      return;
    }
    try {
      this.closeCamera();
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      video.srcObject = this.stream;
      video.classList.remove('hidden');
      this.querySelector('[data-poster]')?.classList.add('hidden');
      if (readout) readout.textContent = 'Camera live.';
    } catch (error) {
      if (readout) readout.textContent = error.message;
    }
  }

  closeCamera(readout) {
    this.stream?.getTracks?.().forEach(track => track.stop());
    this.stream = null;
    const video = this.querySelector('[data-camera]');
    if (video) {
      video.srcObject = null;
      video.classList.add('hidden');
    }
    this.querySelector('[data-poster]')?.classList.remove('hidden');
    if (readout) readout.textContent = 'Camera closed.';
  }
}

if (!customElements.get('syncori-capability')) {
  customElements.define('syncori-capability', SyncoriCapability);
}

export const CapabilityController = {
  mount() {
    return () => {};
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (globalThis.SkillUI) return;
  const element = document.querySelector('syncori-capability');
  if (!element) return;
  Mercury.status();
  Mercury.dock(element.getAttribute('group') === 'syncori-optics' ? 'optics' : 'augment');
});
