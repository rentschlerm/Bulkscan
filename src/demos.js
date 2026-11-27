// Movement definitions for each exercise (see figure.js for the angle convention).
import { FLOOR as F } from './figure';

const G = F - 4; // ankle height when the foot is flat
const T = F - 3; // toe/knee/hand resting on the floor

const standFix = ['ankleN', 112, G];
const stand = (o = {}) => ({ torso: 0, aN: [180, 180], lN: [180, 180], ...o });

// ---------- building blocks ----------
const pushupFrames = (o = {}) => [
  { torso: 79, aN: [180, 180], lN: [-101, -101], fix: ['toeN', 38, T], ground: ['handN', T], ...o.top },
  { torso: 89, aN: [-128, 182], lN: [-91, -91], fix: ['toeN', 38, T], ground: ['handN', T], ...o.bottom },
];

const benchLie = { torso: 90, lN: [-128, 178], lF: [-128, 178] };
const seat = (o = {}) => ({ torso: 0, lN: [90, 180], aN: [180, 180], fix: ['hip', 100, 128], ...o });
const hang = (o = {}) => ({ torso: 0, aN: [0, 0], lN: [170, 232], fix: ['handN', 122, 8], ...o });
const supine = (o = {}) => ({ torso: 90, aN: [-90, -90], lN: [-45, -160], fix: ['hip', 100, F - 7], ...o });
const prone = (o = {}) => ({ torso: 87, aN: [95, 95], lN: [-93, -93], fix: ['hip', 110, F - 7], ...o });
const benchProp = { type: 'bench', x: 70, y: 132, w: 110 };

const squat = (hold, arms, armsDown) => ({
  hold,
  fix: standFix,
  frames: [stand({ aN: arms }), { torso: 38, aN: armsDown || arms, lN: [97, 207] }],
});

const hinge = (hold, deep) => ({
  hold,
  fix: standFix,
  frames: [stand({ aN: [178, 178] }), { torso: deep ? 52 : 74, aN: [182, 182], lN: deep ? [145, 196] : [165, 188] }],
});

const lunge = (hold, back = false, rearOnBench = false) => ({
  hold,
  fix: ['ankleN', 140, G],
  props: rearOnBench ? [{ type: 'bench', x: 20, y: 152, w: 62 }] : [],
  frames: rearOnBench
    ? [
        { torso: 4, aN: [180, 180], lN: [158, 180], lF: [205, 252], footF: 8 },
        { torso: 12, aN: [182, 182], lN: [100, 188], lF: [182, 305], footF: -45 },
      ]
    : [
        { torso: 2, aN: [180, 180], lN: [160, 180], lF: [200, 180] },
        { torso: 4, aN: [180, 180], lN: [98, 182], lF: [178, 268], footF: -150 },
      ],
  times: back ? [1.3, 1.1] : undefined,
});

const curl = (hold, extra = {}) => ({
  hold,
  fix: standFix,
  ...extra,
  frames: [stand({ aN: [182, 182], aF: [178, 178] }), stand({ aN: [178, 25], aF: [176, 20] })],
});

const press = (hold, seated) => ({
  hold,
  fix: seated ? ['hip', 100, 128] : standFix,
  props: seated ? [{ type: 'bench', x: 70, y: 132, w: 60 }] : [],
  frames: [
    { ...(seated ? seat() : stand()), aN: [158, 8] },
    { ...(seated ? seat() : stand()), aN: [2, 0] },
  ],
});

const benchPress = (hold, incline) => ({
  hold,
  props: incline ? [{ type: 'incline', x1: 82, y1: 138, x2: 140, y2: 98 }, benchProp] : [benchProp],
  fix: ['hip', 96, 125],
  frames: [
    { ...benchLie, torso: incline ? 55 : 90, aN: incline ? [-25, -20] : [0, 0] },
    { ...benchLie, torso: incline ? 55 : 90, aN: incline ? [-150, 0] : [-160, 5] },
  ],
});

const row = (hold, oneArm) => ({
  hold,
  oneHand: oneArm,
  fix: ['ankleN', 92, G],
  props: oneArm ? [{ type: 'bench', x: 135, y: 128, w: 70 }] : [],
  frames: oneArm
    ? [
        { torso: 78, aN: [182, 182], aF: [178, 178], lN: [172, 182], lF: [195, 182] },
        { torso: 78, aN: [-60, 182], aF: [178, 178], lN: [172, 182], lF: [195, 182] },
      ]
    : [
        { torso: 62, aN: [182, 182], lN: [158, 198] },
        { torso: 62, aN: [-48, 178], lN: [158, 198] },
      ],
});

const cableRowFrames = [
  { torso: 2, aN: [88, 90], lN: [82, 98], fix: ['hip', 95, 150] },
  { torso: -6, aN: [-125, 92], lN: [82, 98], fix: ['hip', 95, 150] },
];

// ---------- per exercise ----------
export const DEMOS = {
  // Chest
  pushup: { frames: pushupFrames() },
  'diamond-pushup': { frames: pushupFrames({ bottom: { aN: [-150, 178] } }) },
  'knee-pushup': {
    frames: [
      { torso: 72, aN: [180, 180], lN: [-108, -18], fix: ['kneeN', 75, T], ground: ['handN', T] },
      { torso: 86, aN: [-128, 182], lN: [-94, -18], fix: ['kneeN', 75, T], ground: ['handN', T] },
    ],
  },
  'incline-pushup': {
    props: [{ type: 'box', x: 118, y: 124, w: 70 }],
    frames: [
      { torso: 55, aN: [165, 165], lN: [-125, -125], fix: ['handN', 132, 122], ground: ['toeN', T] },
      { torso: 62, aN: [-140, 160], lN: [-118, -118], fix: ['handN', 132, 122], ground: ['toeN', T] },
    ],
  },
  'decline-pushup': {
    props: [{ type: 'box', x: 10, y: 140, w: 40 }],
    frames: [
      { torso: 100, aN: [180, 180], lN: [-80, -80], fix: ['toeN', 35, 138], ground: ['handN', T] },
      { torso: 106, aN: [-128, 182], lN: [-74, -74], fix: ['toeN', 35, 138], ground: ['handN', T] },
    ],
  },
  'pike-pushup': {
    frames: [
      { torso: 135, aN: [135, 135], lN: [-140, -140], fix: ['toeN', 50, T], ground: ['handN', T] },
      { torso: 150, aN: [-150, 150], lN: [-150, -150], fix: ['toeN', 50, T], ground: ['handN', T] },
    ],
  },
  'db-bench': benchPress('db'),
  'bb-bench': benchPress('bb'),
  'db-incline': benchPress('db', true),
  'bb-incline': benchPress('bb', true),
  'db-floor-press': {
    hold: 'db',
    fix: ['hip', 92, F - 8],
    frames: [
      { torso: 90, lN: [-40, -160], aN: [0, 0] },
      { torso: 90, lN: [-40, -160], aN: [-95, 5] },
    ],
  },
  'db-fly': {
    hold: 'db',
    props: [benchProp],
    fix: ['hip', 96, 125],
    frames: [
      { ...benchLie, aN: [0, 5] },
      { ...benchLie, aN: [-140, -118] },
    ],
  },
  'db-floor-fly': {
    hold: 'db',
    fix: ['hip', 92, F - 8],
    frames: [
      { torso: 90, lN: [-40, -160], aN: [0, 5] },
      { torso: 90, lN: [-40, -160], aN: [-95, 35] },
    ],
  },
  'machine-chest': {
    hold: 'cable',
    anchor: [60, 95],
    props: [{ type: 'bench', x: 70, y: 132, w: 60 }, { type: 'post', x: 62, y: 60 }],
    frames: [seat({ aN: [-128, 90] }), seat({ aN: [88, 90] })],
  },
  'pec-deck': {
    hold: 'cable',
    anchor: [60, 95],
    props: [{ type: 'bench', x: 70, y: 132, w: 60 }, { type: 'post', x: 62, y: 60 }],
    frames: [seat({ aN: [-100, 60] }), seat({ aN: [75, 100] })],
  },
  dips: {
    props: [{ type: 'bar', x1: 95, x2: 160, y: 72 }, { type: 'post', x: 150, y: 72 }],
    frames: [
      { torso: 10, aN: [182, 182], lN: [172, 228], fix: ['handN', 128, 72] },
      { torso: 24, aN: [-82, 172], lN: [172, 228], fix: ['handN', 128, 72] },
    ],
  },

  // Back
  pullup: { props: [{ type: 'bar', x1: 70, x2: 175, y: 8 }], frames: [hang(), hang({ aN: [198, 12] })] },
  chinup: { props: [{ type: 'bar', x1: 70, x2: 175, y: 8 }], frames: [hang(), hang({ aN: [190, 5] })] },
  'negative-pullup': {
    props: [{ type: 'bar', x1: 70, x2: 175, y: 8 }],
    frames: [hang({ aN: [198, 12] }), hang()],
    times: [3.5, 0.8],
  },
  'hanging-leg-raise': {
    props: [{ type: 'bar', x1: 70, x2: 175, y: 8 }],
    frames: [hang({ lN: [172, 196] }), hang({ lN: [88, 92] })],
  },
  'table-row': {
    props: [{ type: 'table', x: 122, y: 96, w: 115 }],
    frames: [
      { torso: 72, aN: [8, 8], lN: [-108, -108], fix: ['handN', 128, 99], ground: ['ankleN', G] },
      { torso: 58, aN: [-140, 20], lN: [-122, -122], fix: ['handN', 128, 99], ground: ['ankleN', G] },
    ],
  },
  superman: { frames: [prone(), prone({ torso: 76, aN: [80, 80], lN: [-80, -82] })] },
  'db-row': row('db', true),
  'bb-row': row('bb'),
  'band-row': { hold: 'band', anchor: [228, 110], fix: standFix, frames: [stand({ aN: [88, 90] }), stand({ aN: [-130, 90] })] },
  'cable-row': { hold: 'cable', anchor: [230, 140], props: [{ type: 'post', x: 230, y: 120 }], frames: cableRowFrames },
  'lat-pulldown': {
    hold: 'cable',
    anchor: [112, 0],
    props: [{ type: 'bench', x: 70, y: 132, w: 60 }],
    frames: [seat({ aN: [6, 4] }), seat({ aN: [-158, 20] })],
  },
  'face-pull': {
    hold: 'cable',
    anchor: [230, 52],
    props: [{ type: 'post', x: 230, y: 40 }],
    fix: standFix,
    frames: [stand({ aN: [70, 72] }), stand({ aN: [-98, 30] })],
  },
  'db-pullover': {
    hold: 'goblet',
    props: [benchProp],
    fix: ['hip', 96, 125],
    frames: [{ ...benchLie, aN: [0, 4] }, { ...benchLie, aN: [102, 98] }],
  },
  'db-shrug': { view: 'front', hold: 'db', fix: ['hip', 120, 102], frames: [stand({ aN: [178, 178] }), stand({ aN: [178, 178], shrug: 8 })] },
  'band-pullapart': {
    view: 'front',
    hold: 'bandPair',
    fix: ['hip', 120, 102],
    frames: [stand({ aN: [125, 125] }), stand({ aN: [92, 92] })],
  },
  deadlift: hinge('bb', true),

  // Shoulders
  'db-ohp': press('db', true),
  ohp: press('bb'),
  'db-lateral': { view: 'front', hold: 'db', fix: ['hip', 120, 102], frames: [stand({ aN: [172, 172] }), stand({ aN: [92, 96] })] },
  'band-lateral': { view: 'front', hold: 'band', fix: ['hip', 120, 102], frames: [stand({ aN: [172, 172] }), stand({ aN: [92, 96] })] },
  'db-reardelt': {
    hold: 'db',
    fix: standFix,
    frames: [
      { torso: 72, aN: [180, 180], lN: [165, 190] },
      { torso: 72, aN: [-12, -12], lN: [165, 190] },
    ],
  },

  // Arms
  'db-curl': curl('db'),
  'hammer-curl': curl('db'),
  'band-curl': curl('band', { anchor: [112, F] }),
  'bb-curl': curl('bb'),
  'bench-dip': {
    props: [{ type: 'bench', x: 28, y: 120, w: 60 }],
    frames: [
      { torso: 2, aN: [198, 180], lN: [88, 175], fix: ['handN', 82, 120] },
      { torso: 4, aN: [-100, 172], lN: [70, 160], fix: ['handN', 82, 120] },
    ],
  },
  'db-oh-ext': {
    hold: 'goblet',
    fix: standFix,
    frames: [stand({ aN: [8, 4] }), stand({ aN: [12, 205] })],
  },
  'db-skull': {
    hold: 'db',
    props: [benchProp],
    fix: ['hip', 96, 125],
    frames: [{ ...benchLie, aN: [10, 8] }, { ...benchLie, aN: [12, 128] }],
  },
  pushdown: {
    hold: 'cable',
    anchor: [140, 10],
    props: [{ type: 'post', x: 150, y: 10 }],
    fix: standFix,
    frames: [stand({ torso: 6, aN: [178, 80] }), stand({ torso: 6, aN: [176, 172] })],
  },

  // Legs & glutes
  'squat-bw': squat(null, [90, 90]),
  'goblet-squat': squat('goblet', [160, 30]),
  'back-squat': squat('bbBack', [-140, -15]),
  'jump-squat': {
    fix: standFix,
    frames: [
      { torso: 38, aN: [200, 200], lN: [97, 207] },
      { torso: 0, aN: [10, 10], lN: [180, 182], footN: -40, fix: ['ankleN', 112, G - 18] },
    ],
    times: [0.6, 0.9],
  },
  lunge: lunge(null),
  'reverse-lunge': lunge(null, true),
  bss: lunge(null, false, true),
  'db-lunge': lunge('db'),
  'db-bss': lunge('db', false, true),
  stepup: {
    props: [{ type: 'box', x: 120, y: 152, w: 60 }],
    frames: [
      { torso: 6, aN: [180, 180], lN: [108, 188], lF: [182, 180], fix: ['ankleN', 140, 148] },
      { torso: 2, aN: [180, 180], lN: [180, 180], lF: [150, 185], fix: ['ankleN', 140, 148] },
    ],
  },
  'wall-sit': {
    props: [{ type: 'wall', x: 52 }],
    frames: [{ torso: 0, aN: [180, 180], lN: [90, 180], fix: ['hip', 70, 128] }],
  },
  'calf-raise': { fix: ['toeN', 124, T], frames: [stand(), stand({ footN: -30 })] },
  'db-calf': { hold: 'db', fix: ['toeN', 124, T], frames: [stand(), stand({ footN: -30 })] },
  'db-rdl': hinge('db'),
  'bb-rdl': hinge('bb'),
  'leg-press': {
    props: [{ type: 'incline', x1: 60, y1: 150, x2: 95, y2: 100 }],
    frames: [
      { torso: -35, aN: [150, 150], lN: [35, 145], fix: ['hip', 90, 140] },
      { torso: -35, aN: [150, 150], lN: [62, 72], fix: ['hip', 90, 140] },
    ],
  },
  'leg-ext': { props: [{ type: 'bench', x: 70, y: 132, w: 60 }], frames: [seat(), seat({ lN: [90, 92] })] },
  'leg-curl': { props: [{ type: 'bench', x: 70, y: 132, w: 60 }], frames: [seat({ lN: [90, 100] }), seat({ lN: [90, 205] })] },
  'glute-bridge': {
    fix: ['ankleN', 150, G],
    frames: [
      { torso: -90, aN: [92, 92], lN: [45, 160], solve: ['shoulder', F - 8] },
      { torso: -112, aN: [96, 96], lN: [72, 172], headTilt: 25, solve: ['shoulder', F - 8] },
    ],
  },
  'sl-bridge': {
    fix: ['ankleN', 150, G],
    frames: [
      { torso: -90, aN: [92, 92], lN: [45, 160], lF: [50, 70], solve: ['shoulder', F - 8] },
      { torso: -112, aN: [96, 96], lN: [72, 172], lF: [72, 80], headTilt: 25, solve: ['shoulder', F - 8] },
    ],
  },
  'hip-thrust': {
    hold: 'bb',
    props: [{ type: 'bench', x: 40, y: 147, w: 60 }],
    fix: ['ankleN', 160, G],
    frames: [
      { torso: -128, aN: [130, 130], lN: [40, 150], headTilt: -10, solve: ['shoulder', 141] },
      { torso: -92, aN: [100, 100], lN: [80, 176], headTilt: 10, solve: ['shoulder', 141] },
    ],
  },

  // Core
  plank: { frames: [{ torso: 84, aN: [180, 90], lN: [-96, -96], fix: ['toeN', 40, T], ground: ['handN', T] }] },
  'side-plank': { frames: [{ torso: 78, aN: [180, 90], aF: [0, 0], lN: [-102, -102], fix: ['toeN', 40, T], ground: ['handN', T] }] },
  crunch: { frames: [supine({ aN: [30, 170] }), supine({ torso: 62, aN: [20, 160] })] },
  'leg-raise': { frames: [supine({ lN: [-86, -86] }), supine({ lN: [-5, -5] })] },
  'dead-bug': {
    frames: [
      supine({ aN: [0, 0], lN: [0, -90] }),
      supine({ aN: [95, 95], aF: [0, 0], lN: [-80, -86], lF: [0, -90] }),
      supine({ aN: [0, 0], lN: [0, -90] }),
      supine({ aN: [0, 0], aF: [95, 95], lN: [0, -90], lF: [-80, -86] }),
    ],
    times: [1, 1, 1, 1],
  },
  'hollow-hold': { frames: [supine({ torso: 72, aN: [100, 100], lN: [-72, -72] })] },
  'cable-crunch': {
    hold: 'cable',
    anchor: [150, 0],
    frames: [
      { torso: 15, aN: [20, 200], lN: [180, -90], fix: ['kneeN', 100, T] },
      { torso: 100, aN: [110, 290], lN: [180, -90], fix: ['kneeN', 100, T] },
    ],
  },

  // Cardio
  'jumping-jacks': {
    view: 'front',
    fix: ['hip', 120, 104],
    frames: [stand({ aN: [175, 175], lN: [178, 178] }), stand({ aN: [25, 18], lN: [160, 165], fix: ['hip', 120, 100] })],
    times: [0.35, 0.35],
    holds: [0.05, 0.05],
  },
  'mountain-climbers': {
    frames: [
      { torso: 80, aN: [180, 180], lN: [150, -80], lF: [-100, -100], fix: ['handN', 150, T], ground: ['toeF', T] },
      { torso: 80, aN: [180, 180], lN: [-100, -100], lF: [150, -80], fix: ['handN', 150, T], ground: ['toeN', T] },
    ],
    times: [0.35, 0.35],
    holds: [0.05, 0.05],
  },
  'high-knees': {
    fix: ['hip', 112, 100],
    frames: [
      stand({ aN: [140, 60], aF: [210, 180], lN: [85, 175], lF: [182, 182] }),
      stand({ aN: [210, 180], aF: [140, 60], lN: [182, 182], lF: [85, 175] }),
    ],
    times: [0.3, 0.3],
    holds: [0.02, 0.02],
  },
  burpees: {
    frames: [
      stand({ aN: [5, 5], fix: ['ankleN', 112, G - 18], footN: -40 }),
      { torso: 60, aN: [180, 180], lN: [70, 215], fix: ['ankleN', 112, G] },
      { torso: 80, aN: [180, 180], lN: [-100, -100], fix: ['handN', 140, T], ground: ['toeN', T] },
      { torso: 60, aN: [180, 180], lN: [70, 215], fix: ['ankleN', 112, G] },
    ],
    times: [0.6, 0.5, 0.5, 0.6],
  },
};
