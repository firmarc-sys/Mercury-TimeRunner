export const CANVAS = { w: 720, h: 1280 };
export const HOME = {
  homeHit: { x: 200, y: 30, w: 320, h: 120 },
  globe: { cx: 365, cy: 633, r: 333 },
  tiles: {
    interweb: { x: 53, y: 1103, w: 118, h: 107 }, augment: { x: 182, y: 1104, w: 115, h: 105 },
    code: { x: 306, y: 1104, w: 114, h: 105 }, scribe: { x: 429, y: 1104, w: 115, h: 105 },
    optics: { x: 553, y: 1104, w: 114, h: 105 }
  },
  bakedLit: 'interweb'
};
export const WEB = {
  input: { x: 325, y: 148, w: 255, h: 48 },
  panel: { x: 21, y: 227, w: 678, h: 845, r: 28 },
  globe: { cx: 363, cy: 652, r: 322 },
  tiles: {
    interweb: { x: 55, y: 1104, w: 115, h: 105 }, augment: { x: 182, y: 1104, w: 115, h: 105 },
    code: { x: 306, y: 1104, w: 114, h: 105 }, scribe: { x: 424, y: 1102, w: 118, h: 112 },
    optics: { x: 553, y: 1104, w: 114, h: 105 }
  },
  pill: { x: 287, y: 1204, w: 146, h: 52 }
};
export const AUG = {
  wave: { x: 183, y: 282, w: 328, h: 186 },
  leds: { x: 536, y: 292, w: 40, h: 148 },
  mainVol: { cx: 103, cy: 358, r: 50 },
  k1: { cx: 240, cy: 527, r: 44 }, k2: { cx: 348, cy: 527, r: 45 }, k3: { cx: 459, cy: 527, r: 44 },
  padGrid: { x: 202, y: 627, padW: 66, padH: 63, gapX: 13, gapY: 25 },
  fader: { slotX: 100, slotY: 710, slotW: 16, slotH: 172, thumbW: 50, thumbH: 55 },
  dataKnob: { cx: 590, cy: 758, r: 44 },
  live: { x: 580, y: 168, w: 62, h: 20 },
  buttons: {
    trim: { x: 244, y: 232, w: 70, h: 36 }, tune: { x: 330, y: 232, w: 73, h: 36 }, filter: { x: 420, y: 232, w: 73, h: 36 },
    sample: { x: 53, y: 499, w: 54, h: 36 }, seq: { x: 119, y: 499, w: 53, h: 36 },
    padfx: { x: 54, y: 566, w: 53, h: 38 }, roomfx: { x: 119, y: 566, w: 53, h: 38 },
    shift: { x: 54, y: 646, w: 53, h: 40 }, padbank: { x: 119, y: 646, w: 53, h: 40 },
    erase: { x: 53, y: 900, w: 53, h: 35 }, noterep: { x: 116, y: 900, w: 56, h: 35 },
    chop: { x: 527, y: 499, w: 62, h: 37 }, mote: { x: 603, y: 499, w: 61, h: 37 },
    loop: { x: 527, y: 566, w: 62, h: 38 }, level: { x: 602, y: 566, w: 61, h: 38 },
    ssel: { x: 531, y: 646, w: 58, h: 40 }, tap: { x: 604, y: 646, w: 60, h: 40 },
    undo: { x: 531, y: 816, w: 60, h: 32 }, redo: { x: 604, y: 816, w: 60, h: 32 },
    srec: { x: 531, y: 858, w: 61, h: 42 }, qrec: { x: 604, y: 858, w: 61, h: 42 },
    stop2: { x: 531, y: 924, w: 62, h: 41 }, play2: { x: 605, y: 924, w: 61, h: 41 }
  },
  transport: {
    rec: { x: 58, y: 989, w: 110, h: 49 }, overdub: { x: 178, y: 989, w: 110, h: 49 },
    stop: { x: 298, y: 989, w: 113, h: 49 }, play: { x: 421, y: 989, w: 112, h: 49 },
    pstart: { x: 543, y: 989, w: 120, h: 49 }
  },
  tiles: {
    interweb: { x: 50, y: 1100, w: 118, h: 108 }, augment: { x: 180, y: 1102, w: 116, h: 106 },
    code: { x: 303, y: 1102, w: 116, h: 106 }, scribe: { x: 427, y: 1102, w: 116, h: 106 },
    optics: { x: 550, y: 1102, w: 116, h: 106 }
  },
  pill: { x: 287, y: 1200, w: 146, h: 55 }
};
export const CODE = {
  chat: { x: 20, y: 212, w: 680, h: 772 },
  input: { x: 28, y: 998, w: 664, h: 80 },
  textRegion: { x: 115, y: 1010, w: 295, h: 46 },
  icons: {
    image: { x: 418, y: 1013, w: 38, h: 40 }, wave: { x: 466, y: 1013, w: 40, h: 40 },
    cmd: { x: 518, y: 1013, w: 40, h: 40 }, code: { x: 568, y: 1013, w: 42, h: 40 },
    send: { x: 624, y: 1012, w: 44, h: 42 }, mic: { x: 66, y: 1008, w: 44, h: 48 }
  },
  tiles: {
    interweb: { x: 45, y: 1105, w: 130, h: 95 }, augment: { x: 178, y: 1105, w: 116, h: 95 },
    code: { x: 290, y: 1090, w: 140, h: 118 }, scribe: { x: 434, y: 1105, w: 116, h: 95 },
    optics: { x: 554, y: 1105, w: 122, h: 95 }
  },
  bakedLit: 'code',
  pill: { x: 305, y: 1200, w: 110, h: 45 }
};
export const SCRIBE = {
  writeArea: { x: 110, y: 115, w: 500, h: 460 },
  capsule: { x: 130, y: 600, w: 448, h: 165 },
  glyphs: {
    wave: { x: 170, y: 626, w: 52, h: 52 }, rewind: { x: 240, y: 632, w: 42, h: 42 },
    mic: { cx: 357, cy: 650, r: 32 }, forward: { x: 432, y: 632, w: 42, h: 42 },
    camera: { x: 490, y: 626, w: 52, h: 52 }
  },
  placeholder: { x: 178, y: 706, w: 359, h: 30 },
  pillBelow: { x: 300, y: 757, w: 115, h: 35 },
  pots: [
    { cx: 122, cy: 1128, r: 48, color: '#1e2f66', name: 'sovereign navy' },
    { cx: 242, cy: 1128, r: 48, color: '#b8860b', name: 'gilded amber' },
    { cx: 362, cy: 1128, r: 48, color: '#1c5b33', name: 'imperial green' },
    { cx: 483, cy: 1128, r: 48, color: '#8b1f33', name: 'crimson seal' },
    { cx: 604, cy: 1128, r: 48, color: '#15181a', name: 'obsidian' }
  ]
};
export const OPTICS = {
  hud1: { x: 25, y: 32, w: 675, h: 168 },
  hud2: { x: 25, y: 236, w: 675, h: 82 },
  gaugeL: { cx: 103, cy: 118, r: 60 }, gaugeR: { cx: 608, cy: 118, r: 55 },
  histogram: { x: 200, y: 118, w: 260, h: 66 },
  deck: { x: 32, y: 930, w: 663, h: 255 },
  knobs: {
    shutter: { cx: 127, cy: 1085, r: 45 }, iso: { cx: 280, cy: 1080, r: 48 },
    aperture: { cx: 433, cy: 1085, r: 45 }, wb: { cx: 593, cy: 1088, r: 45 }
  },
  wbSel: { x: 518, y: 1012, w: 150, h: 156 },
  photoTap: { x: 20, y: 340, w: 680, h: 570 },
  pill: { x: 285, y: 1183, w: 148, h: 62 }
};
export const rectStyle = (r) => ({ left: r.x, top: r.y, width: r.w, height: r.h });
