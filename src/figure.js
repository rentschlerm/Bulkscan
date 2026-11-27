// Tiny 2D skeletal animation engine for exercise demos (pure JS, no React).
// Angles in degrees: 0 = up, 90 = forward (the way the figure faces), 180 = down, -90 = back.
// A pose: { torso, aN:[upper,fore], aF, lN:[thigh,shin], lF, footN, footF, shrug, fix:[joint,x,y] }
// N = near side (drawn in front), F = far side. In front view, far limbs mirror near limbs.

export const W = 240;
export const H = 200;
export const FLOOR = 182;

const L = { torso: 52, neck: 9, head: 11, upper: 29, fore: 27, thigh: 38, shin: 37, foot: 12 };

const rad = (a) => (a * Math.PI) / 180;
const dir = (a, len) => [Math.sin(rad(a)) * len, -Math.cos(rad(a)) * len];
const add = (p, d) => [p[0] + d[0], p[1] + d[1]];

function chainFrom(start, a1, l1, a2, l2) {
  const mid = add(start, dir(a1, l1));
  return [mid, add(mid, dir(a2, l2))];
}

/** Joint positions relative to hip at (0,0). */
function rawJoints(p, front) {
  const hip = [0, 0];
  const sh = add(hip, dir(p.torso || 0, L.torso));
  const shoulder = [sh[0], sh[1] - (p.shrug || 0)];
  const head = add(shoulder, dir((p.torso || 0) + (p.headTilt || 0), L.neck + L.head));
  const aN = p.aN || [180, 180];
  const aF = p.aF || aN;
  const lN = p.lN || [180, 180];
  const lF = p.lF || lN;
  const sw = front ? 15 : 0; // shoulder half-width in front view
  const hw = front ? 8 : 0;
  const mirror = (a) => (front ? -a : a);
  const shN = [shoulder[0] + sw, shoulder[1]];
  const shF = [shoulder[0] - sw, shoulder[1]];
  const hipN = [hip[0] + hw, hip[1]];
  const hipF = [hip[0] - hw, hip[1]];
  const [elbowN, handN] = chainFrom(shN, aN[0], L.upper, aN[1], L.fore);
  const [elbowF, handF] = chainFrom(shF, mirror(aF[0]), L.upper, mirror(aF[1]), L.fore);
  const [kneeN, ankleN] = chainFrom(hipN, lN[0], L.thigh, lN[1], L.shin);
  const [kneeF, ankleF] = chainFrom(hipF, mirror(lF[0]), L.thigh, mirror(lF[1]), L.shin);
  const footRelN = p.footN ?? -90;
  const footRelF = p.footF ?? footRelN;
  const toeN = front ? [ankleN[0] + 6, ankleN[1] + 2] : add(ankleN, dir(lN[1] + footRelN, L.foot));
  const toeF = front ? [ankleF[0] - 6, ankleF[1] + 2] : add(ankleF, dir(lF[1] + footRelF, L.foot));
  return { hip, hipN, hipF, shoulder, shN, shF, head, elbowN, handN, elbowF, handF, kneeN, ankleN, kneeF, ankleF, toeN, toeF };
}

function hipPosition(p, front, fallbackFix) {
  const fix = p.fix || fallbackFix || ['ankleN', 120, FLOOR - 4];
  const j = rawJoints(p, front);
  const at = j[fix[0]] || [0, 0];
  return [fix[1] - at[0], fix[2] - at[1]];
}

const lerp = (a, b, t) => a + (b - a) * t;
const lerpAngle = (a, b, t) => {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
};
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function mixPose(a, b, t) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (k === 'fix' || k === '_hip' || k === 'ground' || k === 'solve') continue;
    const va = a[k] ?? b[k];
    const vb = b[k] ?? a[k];
    if (Array.isArray(va)) out[k] = va.map((x, i) => lerpAngle(x, vb[i], t));
    else if (typeof va === 'number') out[k] = k === 'shrug' ? lerp(va, vb, t) : lerpAngle(va, vb, t);
  }
  out._hip = [lerp(a._hip[0], b._hip[0], t), lerp(a._hip[1], b._hip[1], t)];
  return out;
}

function rotatePose(p, d) {
  const r = (arr) => arr && arr.map((x) => x + d);
  return { ...p, torso: (p.torso || 0) + d, aN: r(p.aN), aF: r(p.aF), lN: r(p.lN), lF: r(p.lF) };
}

// Rigidly tilt the whole body about the fixed joint until `ground` joint reaches height y.
function applyGround(p, front, fallbackFix) {
  if (!p.ground) return p;
  const [name, y] = p.ground;
  const yAt = (d) => {
    const q = rotatePose(p, d);
    const hip = hipPosition(q, front, fallbackFix);
    return rawJoints(q, front)[name][1] + hip[1];
  };
  let best = 0;
  let bestErr = Infinity;
  for (let d = -60; d <= 60; d += 0.5) {
    const err = Math.abs(yAt(d) - y);
    if (err < bestErr) {
      bestErr = err;
      best = d;
    }
  }
  return rotatePose(p, best);
}

// Adjust only the torso angle so `joint` reaches height y (feet stay planted via fix).
function applySolve(p, front, fallbackFix) {
  if (!p.solve) return p;
  const [joint, y] = p.solve;
  let best = p.torso || 0;
  let bestErr = Infinity;
  for (let a = -180; a <= 180; a += 0.5) {
    const q = { ...p, torso: a };
    const hip = hipPosition(q, front, fallbackFix);
    const err = Math.abs(rawJoints(q, front)[joint][1] + hip[1] - y) + Math.abs(a - (p.torso || 0)) * 0.01;
    if (err < bestErr) {
      bestErr = err;
      best = a;
    }
  }
  return { ...p, torso: best };
}

/** Prepare a demo: fill far-limb defaults and pre-compute each keyframe's hip position. */
export function prepare(demo) {
  const front = demo.view === 'front';
  const frames = demo.frames.map((f) => {
    const full = applySolve(applyGround({ ...f, aF: f.aF || f.aN, lF: f.lF || f.lN }, front, demo.fix), front, demo.fix);
    return { ...full, _hip: hipPosition(full, front, demo.fix) };
  });
  const n = frames.length;
  const times = demo.times || (n === 1 ? [1] : n === 2 ? [1.7, 1.1] : frames.map(() => 0.8));
  const holds = demo.holds || frames.map(() => 0.25);
  const total = times.reduce((a, b) => a + b, 0) + holds.reduce((a, b) => a + b, 0);
  return { ...demo, front, frames, times, holds, total };
}

/** Joints in absolute coords at time t (seconds). */
export function sample(prep, t) {
  const { frames, times, holds, total, front } = prep;
  let pose;
  if (frames.length === 1) pose = frames[0];
  else {
    let x = t % total;
    for (let i = 0; i < frames.length; i++) {
      if (x < holds[i]) {
        pose = frames[i];
        break;
      }
      x -= holds[i];
      if (x < times[i]) {
        pose = mixPose(frames[i], frames[(i + 1) % frames.length], ease(x / times[i]));
        break;
      }
      x -= times[i];
    }
    if (!pose) pose = frames[0];
  }
  const j = rawJoints(pose, front);
  const o = pose._hip;
  const abs = {};
  for (const k of Object.keys(j)) abs[k] = [j[k][0] + o[0], j[k][1] + o[1]];
  return abs;
}

/** Drawing instructions shared by the app (react-native-svg) and the preview tool. */
export function drawList(prep, j) {
  const far = '#5B6577';
  const near = '#E9EDF3';
  const gear = '#3DDC97';
  const out = [];
  const line = (a, b, color, w) => out.push({ t: 'line', a, b, color, w });
  // props behind the figure
  for (const p of prep.props || []) {
    if (p.type === 'bench') out.push({ t: 'rect', x: p.x, y: p.y, w: p.w, h: 7, color: '#39424F', r: 3 }, { t: 'rect', x: p.x + 6, y: p.y + 7, w: 5, h: FLOOR - p.y - 7, color: '#2A313C' }, { t: 'rect', x: p.x + p.w - 11, y: p.y + 7, w: 5, h: FLOOR - p.y - 7, color: '#2A313C' });
    if (p.type === 'incline') out.push({ t: 'line', a: [p.x1, p.y1], b: [p.x2, p.y2], color: '#39424F', w: 8 }, { t: 'line', a: [p.x1 + 4, p.y1], b: [p.x1 + 4, FLOOR], color: '#2A313C', w: 5 });
    if (p.type === 'bar') out.push({ t: 'line', a: [p.x1, p.y], b: [p.x2, p.y], color: '#8892A3', w: 5 });
    if (p.type === 'wall') out.push({ t: 'rect', x: p.x, y: 10, w: 8, h: FLOOR - 10, color: '#2A313C' });
    if (p.type === 'table') out.push({ t: 'rect', x: p.x, y: p.y, w: p.w, h: 6, color: '#39424F', r: 2 }, { t: 'rect', x: p.x + p.w - 10, y: p.y + 6, w: 6, h: FLOOR - p.y - 6, color: '#2A313C' });
    if (p.type === 'post') out.push({ t: 'line', a: [p.x, p.y], b: [p.x, FLOOR], color: '#2A313C', w: 5 });
  }
  // far limbs
  line(j.shF, j.elbowF, far, 8);
  line(j.elbowF, j.handF, far, 7);
  line(j.hipF, j.kneeF, far, 10);
  line(j.kneeF, j.ankleF, far, 9);
  line(j.ankleF, j.toeF, far, 6);
  // body
  line(j.hip, j.shoulder, near, 15);
  out.push({ t: 'circle', c: j.head, r: 11, color: near });
  // near limbs
  line(j.hipN, j.kneeN, near, 10);
  line(j.kneeN, j.ankleN, near, 9);
  line(j.ankleN, j.toeN, near, 6);
  line(j.shN, j.elbowN, near, 8);
  line(j.elbowN, j.handN, near, 7);
  // equipment in hands
  const hands = prep.oneHand ? [j.handN] : [j.handN, j.handF];
  if (prep.hold === 'db') for (const h of hands) out.push({ t: 'rect', x: h[0] - 8, y: h[1] - 4, w: 16, h: 8, color: gear, r: 3 });
  if (prep.hold === 'bb') out.push({ t: 'circle', c: j.handN, r: 14, color: gear, ring: true });
  if (prep.hold === 'bbBack') out.push({ t: 'circle', c: [j.shoulder[0] - 9, j.shoulder[1] + 2], r: 14, color: gear, ring: true });
  if (prep.hold === 'goblet') out.push({ t: 'rect', x: j.handN[0] - 5, y: j.handN[1] - 9, w: 10, h: 16, color: gear, r: 3 });
  if (prep.hold === 'bandPair') out.push({ t: 'line', a: j.handN, b: j.handF, color: '#FFB547', w: 3 });
  if (prep.hold === 'band') for (const h of hands) out.push({ t: 'line', a: h, b: prep.anchor || [j.ankleN[0], FLOOR], color: '#FFB547', w: 2 });
  if (prep.hold === 'cable') out.push({ t: 'line', a: j.handN, b: prep.anchor, color: '#8892A3', w: 2 });
  // props in front
  for (const p of prep.props || []) {
    if (p.type === 'box') out.push({ t: 'rect', x: p.x, y: p.y, w: p.w, h: FLOOR - p.y, color: '#39424F', r: 3 });
  }
  out.unshift({ t: 'line', a: [0, FLOOR + 1], b: [W, FLOOR + 1], color: '#2A313C', w: 2 });
  return out;
}
