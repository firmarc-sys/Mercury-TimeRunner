// v2 geometry — measured from the approved app pages (720x1556 canvas).
export const CANVAS = { w: 720, h: 1556 };

export const MERCURY = { plate: { x: 0, y: 53, w: 720, h: 1450 } };

export const WEB = {
  getStarted: { x: 443, y: 734, w: 202, h: 52 },
  learnMore: { x: 443, y: 812, w: 200, h: 50 },
  signIn: { x: 455, y: 1200, w: 183, h: 48 },
  features: {
    identity: { x: 80, y: 950, w: 130, h: 130 },
    intelligence: { x: 235, y: 950, w: 130, h: 130 },
    ecosystem: { x: 385, y: 950, w: 130, h: 130 },
    control: { x: 540, y: 950, w: 130, h: 130 }
  },
  tiles: {
    mercury: { x: 45, y: 1390, w: 112, h: 126 },
    interweb: { x: 172, y: 1384, w: 113, h: 132 },
    augment: { x: 305, y: 1390, w: 112, h: 126 },
    code: { x: 437, y: 1390, w: 112, h: 126 },
    optics: { x: 568, y: 1388, w: 115, h: 128 }
  },
  bakedLit: 'interweb'
};

export const AUG = {
  master: { cx: 95, cy: 146, r: 76 },
  input: { cx: 88, cy: 358, r: 56 },
  bpmKnob: { cx: 628, cy: 142, r: 74 },
  fxEdit: { x: 600, y: 458, w: 68, h: 34 },
  display: { x: 205, y: 232, w: 340, h: 258 },
  transport: {
    undo: { cx: 150, cy: 596, r: 47 }, rec: { cx: 260, cy: 596, r: 52 },
    play: { cx: 370, cy: 596, r: 47 }, stop: { cx: 480, cy: 596, r: 47 },
    redo: { cx: 588, cy: 596, r: 47 }
  },
  pads: [
    { x: 18, y: 683, w: 218, h: 188 }, { x: 250, y: 683, w: 218, h: 188 }, { x: 483, y: 683, w: 219, h: 188 },
    { x: 18, y: 890, w: 218, h: 192 }, { x: 250, y: 890, w: 218, h: 192 }, { x: 483, y: 890, w: 219, h: 192 }
  ],
  trackKnobs: [
    { cx: 72, cy: 1245, r: 44 }, { cx: 186, cy: 1245, r: 44 }, { cx: 301, cy: 1245, r: 44 },
    { cx: 415, cy: 1245, r: 44 }, { cx: 530, cy: 1245, r: 44 }, { cx: 644, cy: 1245, r: 44 }
  ],
  tempo: { cx: 360, cy: 1445, r: 68 },
  minus: { x: 222, y: 1452, w: 32, h: 30 }, plus: { x: 450, y: 1450, w: 32, h: 32 },
  bounce: { x: 78, y: 1405, w: 72, h: 92 }, tap: { x: 568, y: 1398, w: 62, h: 98 },
  homeHit: { x: 200, y: 40, w: 320, h: 120 }
};

export const SCRIBE = {
  gidPlate: { x: 197, y: 120, w: 325, h: 52 },
  solBox: { x: 524, y: 226, w: 136, h: 72 },
  notebooks: {
    ideas: { x: 76, y: 360, w: 117, h: 43 }, plans: { x: 80, y: 417, w: 100, h: 40 },
    designs: { x: 80, y: 470, w: 110, h: 40 }, scripts: { x: 80, y: 524, w: 112, h: 40 },
    builds: { x: 80, y: 576, w: 100, h: 40 }
  },
  pages: {
    p01: { x: 76, y: 704, w: 117, h: 38 }, p02: { x: 78, y: 746, w: 118, h: 24 },
    p03: { x: 78, y: 784, w: 112, h: 24 }, p04: { x: 78, y: 820, w: 118, h: 24 },
    p05: { x: 78, y: 854, w: 115, h: 24 }, add: { x: 78, y: 892, w: 102, h: 24 }
  },
  content: { x: 228, y: 328, w: 440, h: 582 },
  rounds: {
    plans: { cx: 106, cy: 1247, r: 48 }, designs: { cx: 231, cy: 1247, r: 48 },
    notes: { cx: 357, cy: 1247, r: 48 }, scripts: { cx: 483, cy: 1247, r: 48 },
    builds: { cx: 609, cy: 1247, r: 48 }
  },
  tiles: {
    mercury: { x: 38, y: 1388, w: 100, h: 122 }, interweb: { x: 170, y: 1392, w: 92, h: 118 },
    augment: { x: 305, y: 1398, w: 98, h: 112 }, code: { x: 450, y: 1400, w: 85, h: 110 },
    optics: { x: 580, y: 1390, w: 95, h: 120 }
  },
  bakedLit: null
};

export const OPT = {
  view: { x: 35, y: 265, w: 650, h: 880 },
  hamburger: { x: 52, y: 216, w: 34, h: 30 },
  chips: { k4: { x: 609, y: 229, w: 57, h: 51 }, ratio: { x: 609, y: 289, w: 57, h: 51 }, raw: { x: 609, y: 349, w: 57, h: 50 } },
  evScale: { x: 55, y: 485, w: 45, h: 310 },
  rightSlider: { x: 628, y: 495, w: 40, h: 345 },
  sideBtns: {
    brightness: { x: 55, y: 832, w: 50, h: 50 }, awb: { x: 55, y: 905, w: 50, h: 52 },
    afs: { x: 55, y: 970, w: 50, h: 46 }, focus: { x: 55, y: 1030, w: 50, h: 48 },
    mountain: { x: 612, y: 908, w: 53, h: 50 }
  },
  zoom: { x: 215, y: 1042, w: 290, h: 25 },
  shutter: { cx: 360, cy: 1205, r: 55 },
  bottomBar: { x: 45, y: 1155, w: 630, h: 100 },
  reticle: { cx: 359, cy: 702 },
  tiles: {
    mercury: { x: 42, y: 1350, w: 80, h: 138 }, interweb: { x: 150, y: 1350, w: 80, h: 138 },
    augment: { x: 258, y: 1350, w: 84, h: 138 }, code: { x: 368, y: 1350, w: 84, h: 138 },
    scribe: { x: 478, y: 1350, w: 82, h: 138 }, optics: { x: 583, y: 1342, w: 100, h: 150 }
  },
  bakedLit: 'optics'
};

export const TERM = {
  interior: { x: 45, y: 245, w: 620, h: 975 },
  titleBar: { x: 42, y: 212, w: 636, h: 33 },
  toggle: { x: 610, y: 220, w: 32, h: 16 },
  inputRow: { x: 60, y: 1230, w: 600, h: 42 },
  send: { x: 568, y: 1234, w: 58, h: 32 },
  tiles: {
    mercury: { x: 45, y: 1365, w: 95, h: 138 }, interweb: { x: 175, y: 1365, w: 95, h: 138 },
    augment: { x: 308, y: 1365, w: 95, h: 138 }, code: { x: 428, y: 1352, w: 128, h: 150 },
    optics: { x: 572, y: 1365, w: 108, h: 138 }
  },
  bakedLit: 'code',
  colors: {
    green: '#4ade80', label: '#818cf8', body: '#d8d8dc',
    kw: '#c084fc', num: '#fbbf24', fn: '#60a5fa'
  }
};

export const rectStyle = (r) => ({ left: r.x, top: r.y, width: r.w, height: r.h });
