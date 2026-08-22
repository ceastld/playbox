'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const CY = VH * 0.5;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LAPS = 4;
  const BEST_KEY = 'playbox-super-sprint-best';
  const MUTE_KEY = 'playbox-super-sprint-mute';
  const OPS = '← → / A D 转向 · ↑ W 油门 · 空格刹车 · 点按加油靠左/右打方向 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const SUN = [255, 72, 32];
  const COR = [255, 58, 50];
  const WHT = [255, 244, 234];
  const PNK = [255, 154, 196];
  const GRN = [80, 230, 140];
  const PUR = [160, 90, 255];

  const NAMES = ['你', '赤狐', '青隼', '银鲨'];
  const COLS = [CYN, MAG, GOLD, GRN];
  const PTS = [5, 3, 2, 1];

  const TRACKS = [
    {
      name: '环湾',
      sub: 'OVAL',
      theme: 'bay',
      half: 22,
      oils: [0.18, 0.52, 0.79],
      wrenches: [0.33, 0.68],
      ctrl: ovalCtrl()
    },
    {
      name: '8字',
      sub: 'EIGHT',
      theme: 'eight',
      half: 19,
      oils: [0.12, 0.38, 0.62, 0.88],
      wrenches: [0.22, 0.72],
      ctrl: eightCtrl()
    },
    {
      name: '夜城',
      sub: 'CITY',
      theme: 'city',
      half: 18,
      oils: [0.16, 0.44, 0.71],
      wrenches: [0.28, 0.58, 0.86],
      ctrl: cityCtrl()
    }
  ];

  function ovalCtrl() {
    const c = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU - Math.PI / 2;
      const rx = 302 + Math.cos(a * 2) * 26 + Math.cos(a * 3) * 8;
      const ry = 158 + Math.sin(a * 2) * 10;
      c.push({ x: 400 + Math.cos(a) * rx, y: 226 + Math.sin(a) * ry });
    }
    return c;
  }

  function eightCtrl() {
    const c = [];
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * TAU + Math.PI / 2;
      c.push({
        x: 400 + 268 * Math.sin(t),
        y: 226 + 292 * Math.sin(t) * Math.cos(t)
      });
    }
    return c;
  }

  function cityCtrl() {
    return [
      { x: 168, y: 352 },
      { x: 300, y: 368 },
      { x: 460, y: 366 },
      { x: 610, y: 348 },
      { x: 702, y: 292 },
      { x: 728, y: 210 },
      { x: 692, y: 132 },
      { x: 590, y: 92 },
      { x: 520, y: 102 },
      { x: 468, y: 168 },
      { x: 400, y: 216 },
      { x: 332, y: 168 },
      { x: 274, y: 100 },
      { x: 196, y: 88 },
      { x: 96, y: 122 },
      { x: 70, y: 206 },
      { x: 84, y: 298 },
      { x: 122, y: 346 }
    ];
  }

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovPick = document.getElementById('ov-pick');
  const ovNext = document.getElementById('ov-next');
  const ovEnd = document.getElementById('ov-end');
  const btnGp = document.getElementById('btn-gp');
  const btnTime = document.getElementById('btn-time');
  const btnT0 = document.getElementById('btn-t0');
  const btnT1 = document.getElementById('btn-t1');
  const btnT2 = document.getElementById('btn-t2');
  const btnOvGo = document.getElementById('ov-go');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnGas = document.getElementById('btn-gas');
  const btnBrake = document.getElementById('btn-brake');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timeEl = document.getElementById('time');
  const spdEl = document.getElementById('spd');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const placeLabel = document.getElementById('place-label');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const gearEl = document.getElementById('gear-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const lapBar = document.getElementById('lap-bar');
  const lapEl = document.getElementById('lap');

  const trackCvs = document.createElement('canvas');
  trackCvs.width = VW;
  trackCvs.height = VH;
  const tctx = trackCvs.getContext('2d');
  const skidCvs = document.createElement('canvas');
  skidCvs.width = VW;
  skidCvs.height = VH;
  const sctx = skidCvs.getContext('2d');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let comboTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: CX, y: CY, id: null };
  const particles = [];
  const floats = [];
  const cars = [];
  const oils = [];
  const wrenches = [];

  const trk = {
    i: 0,
    pts: [],
    segs: [],
    cum: [],
    len: 1,
    n: 0,
    half: 22,
    theme: 'bay',
    name: '环湾'
  };

  const G = {
    mode: 'title',
    kind: 'gp',
    trackI: 0,
    t: 0,
    clock: 0,
    score: 0,
    best: { gp: 0, t: [0, 0, 0] },
    combo: 0,
    comboT: 0,
    driftHold: 0,
    raceT: 0,
    go: 0,
    goPhase: -1,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    place: 4,
    pts: [0, 0, 0, 0],
    gpScore: 0,
    interT: 0,
    why: '',
    kmh: 0,
    ahead: [false, false, false, false]
  };

  let inputSrc = 'key';

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function wrap01(s) {
    s = s % 1;
    if (s < 0) s += 1;
    return s;
  }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function mix(a, b, t) {
    const k = t < 0 ? 0 : t > 1 ? 1 : t;
    return [
      (a[0] + (b[0] - a[0]) * k) | 0,
      (a[1] + (b[1] - a[1]) * k) | 0,
      (a[2] + (b[2] - a[2]) * k) | 0
    ];
  }
  function rgba(rgb, a) {
    if (a == null || a >= 0.995) return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function def() {
    return TRACKS[G.trackI] || TRACKS[0];
  }
  function isTime() {
    return G.kind === 'time';
  }
  function isPlay() {
    return G.mode === 'play';
  }
  function racing() {
    return G.mode === 'play' && G.go <= 0 && !cars[0].done;
  }

  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  }

  function closedSpline(ctrl, steps) {
    const n = ctrl.length;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const p0 = ctrl[(i - 1 + n) % n];
      const p1 = ctrl[i];
      const p2 = ctrl[(i + 1) % n];
      const p3 = ctrl[(i + 2) % n];
      for (let s = 0; s < steps; s++) pts.push(catmull(p0, p1, p2, p3, s / steps));
    }
    return pts;
  }

  function resample(src, spacing) {
    const out = [{ x: src[0].x, y: src[0].y }];
    let carry = 0;
    for (let i = 0; i < src.length; i++) {
      const a = src[i];
      const b = src[(i + 1) % src.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.0001) continue;
      const ux = dx / dist;
      const uy = dy / dist;
      let used = 0;
      while (carry + dist - used >= spacing) {
        const take = spacing - carry;
        used += take;
        out.push({ x: a.x + ux * used, y: a.y + uy * used });
        carry = 0;
      }
      carry += dist - used;
    }
    if (out.length < 24) return src.slice();
    return out;
  }

  function palette() {
    const theme = trk.theme;
    if (theme === 'eight') {
      return {
        grass: [16, 6, 22], grass2: [28, 10, 34],
        road: [44, 36, 52], road2: [54, 44, 62],
        curb: MAG, curb2: CYN, glow: MAG,
        infield: [22, 8, 28]
      };
    }
    if (theme === 'city') {
      return {
        grass: [10, 8, 16], grass2: [16, 12, 24],
        road: [36, 34, 44], road2: [46, 44, 56],
        curb: CYN, curb2: SUN, glow: CYN,
        infield: [14, 10, 22]
      };
    }
    return {
      grass: [16, 26, 12], grass2: [28, 40, 16],
      road: [42, 36, 38], road2: [52, 44, 46],
      curb: SUN, curb2: WHT, glow: SUN,
      infield: [22, 32, 16]
    };
  }

  function buildTrack(index) {
    const d = TRACKS[index] || TRACKS[0];
    G.trackI = index;
    trk.i = index;
    trk.half = d.half;
    trk.theme = d.theme;
    trk.name = d.name;
    const raw = closedSpline(d.ctrl, 8);
    const pts = resample(raw, 10);
    trk.pts = pts;
    trk.n = pts.length;
    trk.segs = [];
    trk.cum = [0];
    let len = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const sl = Math.sqrt(dx * dx + dy * dy) || 1;
      const tx = dx / sl;
      const ty = dy / sl;
      trk.segs.push({ len: sl, tx: tx, ty: ty, nx: -ty, ny: tx });
      len += sl;
      trk.cum.push(len);
    }
    trk.len = len;
    paintTrack();
    sctx.clearRect(0, 0, VW, VH);
    placePickups(d);
  }

  function strokeCenter(g, width, rgb, dash) {
    g.beginPath();
    g.moveTo(trk.pts[0].x, trk.pts[0].y);
    for (let i = 1; i < trk.pts.length; i++) g.lineTo(trk.pts[i].x, trk.pts[i].y);
    g.closePath();
    g.strokeStyle = rgba(rgb, 1);
    g.lineWidth = width;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    if (dash) g.setLineDash(dash);
    g.stroke();
    g.setLineDash([]);
  }

  function paintTrack() {
    const pal = palette();
    const g = tctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = rgba(pal.grass, 1);
    g.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 90; i++) {
      const hx = hash2(i * 17 + trk.i * 9);
      const hy = hash2(i * 29 + 4 + trk.i);
      g.fillStyle = rgba(hash2(i) > 0.5 ? pal.grass2 : pal.infield, 0.45 + hash2(i + 3) * 0.4);
      g.beginPath();
      g.ellipse(hx * VW, hy * VH, 8 + hash2(i + 5) * 22, 6 + hash2(i + 7) * 16, hx * 3, 0, TAU);
      g.fill();
    }
    if (trk.theme === 'city') {
      for (let i = 0; i < 28; i++) {
        const hx = hash2(80 + i * 11);
        const hy = hash2(90 + i * 13);
        const x = 40 + hx * (VW - 80);
        const y = 30 + hy * (VH - 60);
        const loc = locate(x, y, (hx * trk.n) | 0);
        if (loc.dist < trk.half + 22) continue;
        const w = 10 + hash2(i + 2) * 16;
        const h = 14 + hash2(i + 5) * 22;
        g.fillStyle = rgba(mix(pal.infield, CYN, 0.12 + hash2(i) * 0.2), 0.85);
        g.fillRect(x - w * 0.5, y - h * 0.5, w, h);
        g.fillStyle = rgba(GOLD, 0.18 + hash2(i + 8) * 0.25);
        g.fillRect(x - w * 0.2, y - h * 0.3, w * 0.18, h * 0.18);
      }
    }
    g.save();
    g.shadowColor = rgba(pal.glow, 0.55);
    g.shadowBlur = 18;
    strokeCenter(g, trk.half * 2 + 16, pal.glow, null);
    g.restore();
    strokeCenter(g, trk.half * 2 + 9, pal.curb, null);
    const rumbleN = trk.n;
    g.lineWidth = 5;
    g.lineCap = 'butt';
    for (let i = 0; i < rumbleN; i++) {
      const a = trk.pts[i];
      const sg = trk.segs[i];
      const alt = (i & 1) === 0;
      g.strokeStyle = rgba(alt ? pal.curb : pal.curb2, 1);
      const o = trk.half + 2;
      g.beginPath();
      g.moveTo(a.x + sg.nx * o, a.y + sg.ny * o);
      const b = trk.pts[(i + 1) % rumbleN];
      g.lineTo(b.x + sg.nx * o, b.y + sg.ny * o);
      g.stroke();
      g.beginPath();
      g.moveTo(a.x - sg.nx * o, a.y - sg.ny * o);
      g.lineTo(b.x - sg.nx * o, b.y - sg.ny * o);
      g.stroke();
    }
    strokeCenter(g, trk.half * 2, pal.road, null);
    g.save();
    g.globalAlpha = 0.35;
    strokeCenter(g, trk.half * 1.15, pal.road2, null);
    g.restore();
    strokeCenter(g, 1.6, GOLD, [9, 11]);
    const p0 = trk.pts[0];
    const n0 = trk.segs[0];
    const w = trk.half;
    for (let k = -4; k < 4; k++) {
      const u0 = (k / 4);
      const u1 = ((k + 1) / 4);
      const dark = ((k + 4) & 1) === 0;
      g.fillStyle = dark ? '#111014' : '#f4f0ea';
      g.beginPath();
      g.moveTo(p0.x + n0.nx * w * u0 - n0.tx * 5, p0.y + n0.ny * w * u0 - n0.ty * 5);
      g.lineTo(p0.x + n0.nx * w * u1 - n0.tx * 5, p0.y + n0.ny * w * u1 - n0.ty * 5);
      g.lineTo(p0.x + n0.nx * w * u1 + n0.tx * 5, p0.y + n0.ny * w * u1 + n0.ty * 5);
      g.lineTo(p0.x + n0.nx * w * u0 + n0.tx * 5, p0.y + n0.ny * w * u0 + n0.ty * 5);
      g.closePath();
      g.fill();
    }
    for (let i = 0; i < trk.n; i += 7) {
      const a = trk.pts[i];
      const sg = trk.segs[i];
      const px = a.x + sg.nx * (trk.half + 11);
      const py = a.y + sg.ny * (trk.half + 11);
      g.fillStyle = rgba(pal.glow, 0.55);
      g.beginPath();
      g.arc(px, py, 2.1, 0, TAU);
      g.fill();
    }
  }

  function locate(x, y, hint) {
    const n = trk.n;
    if (!n) return { i: 0, t: 0, x: x, y: y, dist: 0, s: 0, nx: 0, ny: 1, tx: 1, ty: 0 };
    let best = 1e12;
    let bi = ((hint % n) + n) % n;
    let bt = 0;
    let bx = x;
    let by = y;
    const win = trk.theme === 'eight' ? 10 : 16;
    const base = bi;
    for (let k = -win; k <= win; k++) {
      const i = (base + k + n * 8) % n;
      const a = trk.pts[i];
      const b = trk.pts[(i + 1) % n];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((x - a.x) * dx + (y - a.y) * dy) / len2;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      const ddx = x - px;
      const ddy = y - py;
      const d = ddx * ddx + ddy * ddy;
      if (d < best) {
        best = d;
        bi = i;
        bt = t;
        bx = px;
        by = py;
      }
    }
    const sg = trk.segs[bi];
    const s = (trk.cum[bi] + sg.len * bt) / trk.len;
    return { i: bi, t: bt, x: bx, y: by, dist: Math.sqrt(best), s: wrap01(s), nx: sg.nx, ny: sg.ny, tx: sg.tx, ty: sg.ty };
  }

  function pointAt(s) {
    s = wrap01(s);
    const d = s * trk.len;
    const cum = trk.cum;
    let lo = 0;
    let hi = trk.n - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (cum[m + 1] < d) lo = m + 1;
      else hi = m;
    }
    const i = lo;
    const sl = trk.segs[i].len || 1;
    const t = clamp((d - cum[i]) / sl, 0, 1);
    const a = trk.pts[i];
    const b = trk.pts[(i + 1) % trk.n];
    const sg = trk.segs[i];
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      a: Math.atan2(sg.ty, sg.tx),
      i: i,
      nx: sg.nx,
      ny: sg.ny,
      tx: sg.tx,
      ty: sg.ty
    };
  }

  function placePickups(d) {
    oils.length = 0;
    wrenches.length = 0;
    for (let i = 0; i < d.oils.length; i++) {
      const s = d.oils[i];
      const p = pointAt(s);
      const side = hash2((s * 100) | 0) > 0.5 ? 1 : -1;
      oils.push({
        x: p.x + p.nx * side * (trk.half * 0.28),
        y: p.y + p.ny * side * (trk.half * 0.28),
        s: s,
        r: 13
      });
    }
    for (let i = 0; i < d.wrenches.length; i++) {
      spawnWrench(d.wrenches[i], 0);
    }
  }

  function spawnWrench(s, delay) {
    const p = pointAt(s);
    const side = hash2((s * 77) | 0) > 0.45 ? 1 : -1;
    wrenches.push({
      x: p.x + p.nx * side * (trk.half * 0.42),
      y: p.y + p.ny * side * (trk.half * 0.42),
      s: s,
      live: delay <= 0,
      wait: delay,
      pulse: rand(0, TAU)
    });
  }

  function maxSpd(car) {
    return (172 + car.gear * 34) * (car.ai ? (0.74 + car.skill * 0.2) : 1);
  }
  function accelOf(car) {
    return 150 + car.gear * 28;
  }

  function makeCar(id, ai) {
    return {
      id: id,
      name: NAMES[id],
      rgb: COLS[id],
      x: CX,
      y: CY,
      a: 0,
      spd: 0,
      drift: 0,
      s: 0,
      idx: 0,
      laps: 0,
      gear: 0,
      oil: 0,
      oilCd: 0,
      bumpT: 0,
      stuck: 0,
      done: false,
      finishT: 0,
      ai: ai,
      skill: ai ? (0.7 + id * 0.1) : 1,
      side: id % 2 === 0 ? -1 : 1,
      isP: id === 0,
      armed: false,
      lastS: 0
    };
  }

  function gridCar(car, slot, nCars) {
    const back = 0.018 + slot * 0.014;
    const p = pointAt(wrap01(1 - back));
    const lat = ((slot % 2 === 0) ? -1 : 1) * (7 + (nCars > 2 ? 2 : 0));
    car.x = p.x + p.nx * lat;
    car.y = p.y + p.ny * lat;
    car.a = p.a;
    car.s = wrap01(1 - back);
    car.lastS = car.s;
    car.idx = p.i;
    car.spd = 0;
    car.drift = 0;
    car.laps = 0;
    car.oil = 0;
    car.oilCd = 0;
    car.bumpT = 0;
    car.stuck = 0;
    car.done = false;
    car.finishT = 0;
    car.armed = false;
  }

  function spawnField(keepGear) {
    const gp = G.kind === 'gp';
    const n = (G.mode === 'title' || gp) ? 4 : 1;
    const oldGear = cars[0] ? cars[0].gear : 0;
    cars.length = 0;
    for (let i = 0; i < n; i++) {
      const c = makeCar(i, i !== 0 || G.mode === 'title');
      if (keepGear && i === 0) c.gear = oldGear;
      if (G.mode === 'title') c.ai = true;
      if (i === 0 && G.mode !== 'title') c.ai = false;
      gridCar(c, i, n);
      cars.push(c);
    }
    G.ahead = [false, false, false, false];
    G.place = n;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    eng: null,
    eng2: null,
    eng3: null,
    engG: null,
    engF: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(Math.max(40, freq), t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 700;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    startEngine() {
      if (!this.ctx || this.eng) return;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const o2 = this.ctx.createOscillator();
      o2.type = 'square';
      const o3 = this.ctx.createOscillator();
      o3.type = 'triangle';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 880;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(f);
      o2.connect(f);
      o3.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      o3.start();
      this.eng = o;
      this.eng2 = o2;
      this.eng3 = o3;
      this.engG = g;
      this.engF = f;
    },
    tickEngine(spd01, on, drift) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const wob = Math.abs(drift || 0) * 18;
      const pulse = Math.sin(G.t * (16 + spd01 * 20)) * (4 + spd01 * 9);
      const f = 64 + spd01 * 172 + pulse + wob;
      this.eng.frequency.setTargetAtTime(f, t, 0.04);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
      this.eng3.frequency.setTargetAtTime(f * 2.02, t, 0.04);
      this.engF.frequency.setTargetAtTime(380 + spd01 * 1500 + wob * 8, t, 0.07);
      const oilMul = cars[0] && cars[0].oil > 0 ? 0.45 : 1;
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.026 + spd01 * 0.068) * oilMul, t, 0.05);
    },
    sting() {
      this.beep(392, 0.08, 'square', 0.07, 784);
      this.beep(523, 0.12, 'triangle', 0.05);
      this.beep(784, 0.16, 'square', 0.045);
    },
    count(n) {
      if (n <= 0) {
        this.beep(784, 0.12, 'square', 0.09);
        this.beep(1046, 0.18, 'triangle', 0.07);
      } else {
        this.beep(330 + (3 - n) * 40, 0.1, 'square', 0.08);
      }
    },
    lap() {
      this.beep(523, 0.08, 'square', 0.08);
      this.beep(659, 0.12, 'triangle', 0.06);
      this.beep(784, 0.16, 'square', 0.05, 1046);
    },
    bump() {
      this.noise(0.16, 0.22, 280);
      this.beep(140, 0.14, 'sawtooth', 0.1, 52);
    },
    oil() {
      this.beep(180, 0.22, 'sawtooth', 0.08, 70);
      this.beep(420, 0.16, 'triangle', 0.05, 180);
    },
    wrench() {
      this.beep(660, 0.08, 'square', 0.08, 990);
      this.beep(880, 0.12, 'triangle', 0.06);
      this.beep(1320, 0.16, 'square', 0.045);
    },
    overtake(n) {
      const f = 440 + Math.min(8, n) * 58;
      this.beep(f, 0.08, 'square', 0.065, f * 1.75);
      this.beep(f * 0.5, 0.1, 'triangle', 0.03);
    },
    carHit() {
      this.beep(210, 0.07, 'square', 0.06, 90);
      this.noise(0.08, 0.1, 600);
    },
    win() {
      this.beep(523, 0.12, 'square', 0.08);
      this.beep(659, 0.14, 'triangle', 0.07);
      this.beep(784, 0.18, 'square', 0.07);
      this.beep(1046, 0.28, 'triangle', 0.06);
    },
    lose() {
      this.beep(220, 0.3, 'sawtooth', 0.085, 70);
      this.noise(0.2, 0.12, 380);
    }
  };

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
      }
    }, 360);
  }
  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function bumpScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n | 0;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + (n | 0);
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    maybeBest();
    hud();
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85 });
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.5, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
    if (particles.length > 260) particles.splice(0, particles.length - 260);
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    const kick =
      kind === 'win' ? 'FINISH' :
        kind === 'lose' ? 'RESULT' :
          kind === 'pick' ? 'TIME' :
            kind === 'inter' ? ('第' + (G.trackI + 2) + '/3站') :
              'SPRT';
    ovKicker.textContent = kick;
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovPick) ovPick.classList.toggle('gone', kind !== 'pick');
    if (ovNext) ovNext.classList.toggle('gone', kind !== 'inter');
    if (ovEnd) ovEnd.classList.toggle('gone', kind !== 'win' && kind !== 'lose');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.best.gp = o.gp | 0;
        if (o.t && o.t.length) {
          G.best.t[0] = +o.t[0] || 0;
          G.best.t[1] = +o.t[1] || 0;
          G.best.t[2] = +o.t[2] || 0;
        }
      }
    } catch (err) { /* ignore */ }
  }

  function saveBest() {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (err) { /* ignore */ }
  }

  function maybeBest() {
    if (G.kind === 'gp' && G.score > G.best.gp) {
      G.best.gp = G.score | 0;
      saveBest();
    }
  }

  function maybeTimeBest() {
    const i = G.trackI;
    const t = G.raceT;
    if (!(t > 0)) return false;
    if (!G.best.t[i] || t < G.best.t[i]) {
      G.best.t[i] = t;
      saveBest();
      return true;
    }
    return false;
  }

  function fmtTime(t) {
    if (!(t > 0) && t !== 0) return '—';
    const s = Math.max(0, t);
    const m = Math.floor(s / 60);
    const rest = s - m * 60;
    const w = Math.floor(rest);
    const c = Math.floor((rest - w) * 100);
    return m + ':' + (w < 10 ? '0' : '') + w + '.' + (c < 10 ? '0' : '') + c;
  }

  function rankKey(c) {
    if (c.done) return 20 - c.finishT * 0.001;
    return c.laps + c.s;
  }

  function placeOf(id) {
    const order = cars.slice().sort(function (a, b) { return rankKey(b) - rankKey(a); });
    for (let i = 0; i < order.length; i++) if (order[i].id === id) return i + 1;
    return cars.length;
  }

  function hudBestText() {
    if (isTime()) {
      const t = G.best.t[G.trackI];
      return t > 0 ? fmtTime(t) : '—';
    }
    return String(G.best.gp | 0);
  }

  function hud() {
    const p = cars[0];
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = hudBestText();
    if (timeEl) timeEl.textContent = fmtTime(G.mode === 'title' ? 0 : G.raceT);
    if (spdEl) spdEl.textContent = String(G.kmh | 0);
    const lapShow = p ? Math.min(LAPS, p.laps + (p.done ? 0 : 1)) : 1;
    if (lapEl) lapEl.textContent = lapShow + '/' + LAPS;
    if (lapBar) {
      const u = p ? (p.done ? 1 : clamp(p.s, 0, 1)) : 0;
      lapBar.style.transform = 'scaleX(' + u + ')';
    }
    if (placeLabel) {
      const n = Math.max(1, cars.length);
      const pl = G.place || placeOf(0);
      placeLabel.textContent = isTime() ? '单人' : ('第' + pl + '/' + n);
      placeLabel.classList.toggle('hot', (isTime() && G.mode === 'play') || (pl === 1 && !isTime()));
    }
    if (stageLabel) {
      stageLabel.textContent = def().name + (G.kind === 'gp' ? (' · ' + (G.trackI + 1) + '/3') : '');
      stageLabel.classList.toggle('hot', G.trackI === 2 && G.kind === 'gp');
    }
    if (tagLabel) {
      tagLabel.textContent = isTime() ? '计时' : (G.kind === 'gp' ? ('积分 ' + (G.pts[0] | 0)) : '大奖赛');
      tagLabel.classList.toggle('time', isTime());
    }
    if (gearEl) {
      const g = p ? p.gear : 0;
      gearEl.textContent = '扳手 ' + g;
      gearEl.classList.toggle('on', g > 0);
    }
    if (comboEl) {
      const show = G.mode === 'play' && G.combo > 1;
      comboEl.hidden = !show;
      if (show) comboEl.textContent = '连漂 ×' + G.combo;
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'pick') setHint('选赛道 · 四圈比时间 · 无幽灵', '');
    else if (G.mode === 'inter') setHint('R 重开大奖赛 · 或等下一站', 'hot');
    else if (G.mode === 'win') setHint('R 再赛 · 一键重开', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 抢线还得少撞墙', 'warn');
    else if (p && p.oil > 0) setHint('打滑 · 别猛打方向', 'warn');
    else if (G.go > 0.9) setHint('预备 · 绿灯再冲', '');
    else setHint('↑ 油门 · ← → 漂移过弯 · 空格刹车 · 抢扳手', '');
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'gp';
    G.trackI = 0;
    G.score = 0;
    G.pts = [0, 0, 0, 0];
    G.raceT = 0;
    G.go = 0;
    G.combo = 0;
    particles.length = 0;
    floats.length = 0;
    buildTrack(0);
    spawnField(false);
    for (let i = 0; i < cars.length; i++) cars[i].spd = maxSpd(cars[i]) * 0.55;
    showOverlay('title', '超赛', '俯视漂移，四圈抢先。撞墙减速，机油打滑，扳手加速。');
    hud();
  }

  function showPick() {
    G.mode = 'pick';
    G.kind = 'time';
    showOverlay('pick', '计时', '选一条赛道，四圈比时间。没有幽灵，就你和圈速。');
    hud();
  }

  function beginRace(kind, trackI, keepGear) {
    audio.ensure();
    G.kind = kind === 'time' ? 'time' : 'gp';
    G.mode = 'play';
    G.trackI = trackI | 0;
    if (!keepGear) {
      G.score = kind === 'gp' ? G.gpScore : 0;
      if (kind !== 'gp') G.pts = [0, 0, 0, 0];
    }
    G.combo = 0;
    G.comboT = 0;
    G.driftHold = 0;
    G.raceT = 0;
    G.go = 3.55;
    G.goPhase = -1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.4;
    G.flashRgb = kind === 'time' ? CYN : SUN;
    G.why = '';
    particles.length = 0;
    floats.length = 0;
    buildTrack(G.trackI);
    spawnField(keepGear && kind === 'gp');
    hideOverlay();
    audio.sting();
    toast(def().name + (kind === 'time' ? ' · 计时四圈' : ' · 大奖赛'), false, true);
    hud();
  }

  function startGP() {
    G.gpScore = 0;
    G.pts = [0, 0, 0, 0];
    G.score = 0;
    beginRace('gp', 0, false);
  }

  function startTime(i) {
    G.pts = [0, 0, 0, 0];
    G.score = 0;
    beginRace('time', i, false);
  }

  function nextGpRace() {
    if (G.mode !== 'inter') return;
    const nxt = G.trackI + 1;
    if (nxt >= 3) {
      champFinish();
      return;
    }
    G.gpScore = G.score;
    beginRace('gp', nxt, true);
  }

  function popCombo(why) {
    G.combo += 1;
    G.comboT = 2.3;
    const n = 22 * G.combo;
    bumpScore(n);
    const p = cars[0];
    floatText(p.x, p.y - 16, why + ' ×' + G.combo, GOLD);
    if (comboEl) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
    }
    if (G.combo === 3) toast('连漂 ×3', false, true);
    if (G.combo === 6) toast('连漂 ×6 · 飘了', false, true);
    if (G.combo === 10) toast('连漂 ×10 · 贴地飞行', false, true);
  }

  function onOvertake(other) {
    if (!racing()) return;
    popCombo('超');
    audio.overtake(G.combo);
    hitStop(0.032);
    kick(3);
    screenFlash(CYN, 0.16);
    emit(10, {
      x: other.x, y: other.y, j: 10,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 1.2, r1: 2.8, life: 0.3, rgb: other.rgb
    });
  }

  function wallHit(car, loc) {
    car.bumpT = 0.2;
    car.stuck = 0;
    const hard = car.spd > 55;
    car.spd *= hard ? 0.46 : 0.62;
    car.drift = 0;
    if (!car.isP || G.mode !== 'play') return;
    G.combo = 0;
    G.driftHold = 0;
    audio.bump();
    if (hard) {
      hitStop(0.055);
      kick(7);
      screenFlash(SUN, 0.42);
    } else {
      hitStop(0.03);
      kick(3.2);
    }
    emit(hard ? 18 : 8, {
      x: car.x, y: car.y, j: 8,
      vx0: -180, vx1: 180, vy0: -180, vy1: 180,
      r0: 1.2, r1: 3.4, life: 0.38, rgb: GOLD, g: 0
    });
    emit(6, {
      x: car.x, y: car.y, j: 4,
      vx0: loc.nx * -40, vx1: loc.nx * 90, vy0: loc.ny * -40, vy1: loc.ny * 90,
      r0: 1, r1: 2.2, life: 0.28, rgb: CYN
    });
  }

  function smearSkid(car) {
    if (REDUCE || Math.abs(car.drift) < 0.28 || car.spd < 40) return;
    const back = car.a + Math.PI;
    const lx = Math.cos(car.a + Math.PI * 0.5);
    const ly = Math.sin(car.a + Math.PI * 0.5);
    sctx.strokeStyle = 'rgba(12,8,10,0.28)';
    sctx.lineWidth = 1.6;
    sctx.lineCap = 'round';
    for (let s = -1; s <= 1; s += 2) {
      const x = car.x + Math.cos(back) * 6 + lx * s * 3.4;
      const y = car.y + Math.sin(back) * 6 + ly * s * 3.4;
      sctx.beginPath();
      sctx.moveTo(x, y);
      sctx.lineTo(x + Math.cos(back) * 3, y + Math.sin(back) * 3);
      sctx.stroke();
    }
  }

  function fadeSkid(dt) {
    sctx.globalCompositeOperation = 'destination-out';
    sctx.fillStyle = 'rgba(0,0,0,' + clamp(dt * 0.55, 0.01, 0.08) + ')';
    sctx.fillRect(0, 0, VW, VH);
    sctx.globalCompositeOperation = 'source-over';
  }

  function readInput() {
    let steer = 0;
    if (keys.l) steer -= 1;
    if (keys.r) steer += 1;
    let gas = keys.u ? 1 : 0;
    let brake = keys.d ? 1 : 0;
    if (inputSrc === 'ptr' && pointer.down) {
      const tx = (pointer.x - CX) / (CX * 0.62);
      steer = clamp(tx * 1.35, -1, 1);
      if (pointer.y > VH * 0.84) {
        brake = 1;
        gas = 0;
      } else {
        gas = 1;
      }
    }
    return { steer: clamp(steer, -1, 1), gas: gas, brake: brake };
  }

  function aiInput(car) {
    const look = 0.048 + car.skill * 0.04;
    const now = pointAt(car.s);
    const ahead = pointAt(car.s + look);
    const ahead2 = pointAt(car.s + look * 1.55);
    const bend = Math.abs(wrapAng(ahead2.a - now.a));
    const off = car.side * (trk.half - 10) * (0.18 + (1 - clamp(bend * 1.4, 0, 1)) * 0.22);
    const tx = ahead.x + ahead.nx * off;
    const ty = ahead.y + ahead.ny * off;
    const err = wrapAng(Math.atan2(ty - car.y, tx - car.x) - car.a);
    const steer = clamp(err * 1.55, -1, 1);
    const cap = maxSpd(car);
    let gas = 1;
    let brake = 0;
    if (car.oil > 0) {
      gas = 0.15;
      return { steer: steer * 0.25, gas: gas, brake: 0 };
    }
    if (bend > 0.62 && car.spd > cap * 0.58) {
      brake = 1;
      gas = 0;
    } else if (bend > 0.4 && car.spd > cap * 0.78) {
      gas = 0.2;
    }
    if (Math.abs(err) > 0.9) gas *= 0.4;
    if (G.mode === 'title') {
      gas = 0.85;
      brake = bend > 0.7 ? 1 : 0;
    }
    return { steer: steer, gas: gas, brake: brake };
  }

  function applyDrive(car, inp, dt) {
    const demo = G.mode === 'title';
    const frozen = G.mode === 'play' && G.go > 0 && !demo;
    const cap = maxSpd(car);
    const spd01 = clamp(car.spd / cap, 0, 1);
    let steer = inp.steer;
    let gas = inp.gas;
    let brake = inp.brake;
    if (frozen) {
      car.spd = 0;
      car.drift = 0;
      return;
    }
    if (car.oil > 0) {
      steer += Math.sin(G.t * 13 + car.id) * 0.85;
      car.a += Math.sin(G.t * 11 + car.id * 2) * 5.5 * dt;
      gas *= 0.2;
    }
    const tr = (2.15 + spd01 * 2.55) * (car.oil > 0 ? 0.22 : 1);
    car.a += steer * tr * dt;
    const wantDrift = (Math.abs(steer) > 0.3 && spd01 > 0.44 && car.oil <= 0) ? steer * spd01 : 0;
    car.drift = lerp(car.drift, wantDrift, 1 - Math.pow(wantDrift ? 0.02 : 0.00035, dt));
    car.a += car.drift * 1.9 * dt;

    if (brake) {
      car.spd = Math.max(0, car.spd - 248 * dt);
    } else if (gas) {
      car.spd += accelOf(car) * (car.oil > 0 ? 0.35 : 1) * dt;
    } else {
      car.spd = Math.max(0, car.spd - 52 * dt);
    }
    if (car.oil > 0) car.spd = Math.max(0, car.spd - 70 * dt);
    car.spd = clamp(car.spd, 0, cap);

    const lat = car.drift * (20 + spd01 * 30);
    const ca = Math.cos(car.a);
    const sa = Math.sin(car.a);
    car.x += ca * car.spd * dt + Math.cos(car.a + Math.PI * 0.5) * lat * dt;
    car.y += sa * car.spd * dt + Math.sin(car.a + Math.PI * 0.5) * lat * dt;
  }

  function collideWall(car) {
    const loc = locate(car.x, car.y, car.idx);
    car.idx = loc.i;
    const prevS = car.lastS;
    car.s = loc.s;
    const half = trk.half - 6.2;
    if (loc.dist > half) {
      const d = loc.dist || 1;
      const nx = (car.x - loc.x) / d;
      const ny = (car.y - loc.y) / d;
      car.x = loc.x + nx * half;
      car.y = loc.y + ny * half;
      let tang = Math.atan2(loc.ty, loc.tx);
      if (Math.cos(car.a - tang) < 0) tang += Math.PI;
      car.a = car.a + wrapAng(tang - car.a) * 0.62;
      if (car.spd > 32 && car.bumpT <= 0) wallHit(car, loc);
      car.spd = Math.min(car.spd, maxSpd(car) * 0.5);
      car.stuck += STEP;
      if (car.stuck > 1.35) {
        const p = pointAt(car.s);
        car.x = p.x;
        car.y = p.y;
        car.a = p.a;
        car.spd = 40;
        car.stuck = 0;
      }
    } else {
      car.stuck = 0;
    }
    const ds = car.s - prevS;
    if (ds < -0.55 && car.armed) {
      car.laps += 1;
      car.armed = false;
      if (car.isP && G.mode === 'play' && G.go <= 0) onLap(car);
    } else if (ds > 0.55) {
      /* going backwards over line */
    }
    if (car.s > 0.42 && car.s < 0.9) car.armed = true;
    car.lastS = car.s;
    if (car.laps >= LAPS && !car.done) {
      car.done = true;
      car.laps = LAPS;
      car.finishT = G.raceT;
      if (car.isP && G.mode === 'play') onPlayerFinish();
    }
  }

  function onLap(car) {
    if (car.laps >= LAPS) return;
    const bonus = 360 + G.combo * 40 + car.gear * 80;
    bumpScore(bonus);
    audio.lap();
    screenFlash(GOLD, 0.45);
    hitStop(0.04);
    kick(4);
    floatText(car.x, car.y - 18, '圈 ' + car.laps, GOLD);
    emit(22, {
      x: car.x, y: car.y, j: 16,
      vx0: -120, vx1: 120, vy0: -120, vy1: 120,
      r0: 1.6, r1: 4, life: 0.45, rgb: GOLD
    });
    if (car.laps === LAPS - 1) {
      toast('最后一圈', false, true);
      screenFlash(MAG, 0.35);
    } else {
      toast('第 ' + car.laps + ' 圈', false, true);
    }
  }

  function carsCollide(dt) {
    const n = cars.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = cars[i];
        const b = cars[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        const min = 15;
        if (d2 > min * min || d2 < 0.01) continue;
        const d = Math.sqrt(d2);
        const ux = dx / d;
        const uy = dy / d;
        const push = (min - d) * 0.52;
        a.x -= ux * push;
        a.y -= uy * push;
        b.x += ux * push;
        b.y += uy * push;
        const rel = (b.spd - a.spd);
        a.spd = Math.max(20, a.spd + rel * 0.18);
        b.spd = Math.max(20, b.spd - rel * 0.18);
        a.spd *= 0.92;
        b.spd *= 0.92;
        if (a.isP || b.isP) {
          const p = a.isP ? a : b;
          const o = a.isP ? b : a;
          if (p.bumpT <= 0 && G.mode === 'play' && G.go <= 0) {
            p.bumpT = 0.14;
            audio.carHit();
            hitStop(0.028);
            kick(2.4);
            emit(8, {
              x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5, j: 6,
              vx0: -90, vx1: 90, vy0: -90, vy1: 90,
              r0: 1, r1: 2.4, life: 0.24, rgb: WHT
            });
            const pa = rankKey(p);
            const oa = rankKey(o);
            if (pa > oa && !G.ahead[o.id]) {
              G.ahead[o.id] = true;
              onOvertake(o);
            }
          }
        }
      }
    }
    const p = cars[0];
    if (p) {
      for (let i = 1; i < cars.length; i++) {
        if (rankKey(p) <= rankKey(cars[i])) G.ahead[cars[i].id] = false;
      }
    }
  }

  function pickups(dt) {
    const p = cars[0];
    for (let i = 0; i < oils.length; i++) {
      const o = oils[i];
      o._w = (o._w || 0) + dt;
      for (let c = 0; c < cars.length; c++) {
        const car = cars[c];
        if (car.oil > 0 || car.oilCd > 0) continue;
        const dx = car.x - o.x;
        const dy = car.y - o.y;
        if (dx * dx + dy * dy < (o.r + 6) * (o.r + 6)) {
          car.oil = 0.72;
          car.oilCd = 1.1;
          car.drift = (Math.random() > 0.5 ? 1 : -1) * 0.9;
          if (car.isP && G.mode === 'play') {
            audio.oil();
            kick(4);
            screenFlash(PUR, 0.35);
            toast('打滑', true, false);
            emit(16, {
              x: o.x, y: o.y, j: 10,
              vx0: -70, vx1: 70, vy0: -70, vy1: 70,
              r0: 1.4, r1: 3.2, life: 0.4, rgb: PUR
            });
          }
        }
      }
    }
    for (let i = wrenches.length - 1; i >= 0; i--) {
      const w = wrenches[i];
      w.pulse += dt * 4;
      if (!w.live) {
        w.wait -= dt;
        if (w.wait <= 0) w.live = true;
        continue;
      }
      for (let c = 0; c < cars.length; c++) {
        const car = cars[c];
        const dx = car.x - w.x;
        const dy = car.y - w.y;
        if (dx * dx + dy * dy > 14 * 14) continue;
        w.live = false;
        w.wait = 7.2;
        if (car.gear < 3) car.gear += 1;
        if (car.isP && G.mode === 'play') {
          audio.wrench();
          bumpScore(180 + car.gear * 40);
          hitStop(0.04);
          kick(3.6);
          screenFlash(GOLD, 0.5);
          floatText(car.x, car.y - 14, '加速 +' + car.gear, GOLD);
          toast('扳手 · 提速 ' + car.gear, false, true);
          emit(20, {
            x: w.x, y: w.y, j: 12,
            vx0: -110, vx1: 110, vy0: -110, vy1: 110,
            r0: 1.5, r1: 3.6, life: 0.48, rgb: GOLD
          });
        } else if (G.mode === 'play') {
          toast(car.name + ' 抢到扳手', true, false);
        }
        const ns = wrap01(w.s + 0.17 + hash2((G.t * 10) | 0) * 0.2);
        const p2 = pointAt(ns);
        const side = hash2((ns * 40) | 0) > 0.5 ? 1 : -1;
        w.x = p2.x + p2.nx * side * (trk.half * 0.4);
        w.y = p2.y + p2.ny * side * (trk.half * 0.4);
        w.s = ns;
        break;
      }
    }
  }

  function onPlayerFinish() {
    if (G.why) return;
    G.why = 'wait';
    G.place = placeOf(0);
    bumpScore(G.place === 1 ? 2200 : G.place === 2 ? 1200 : G.place === 3 ? 700 : 320);
    bumpScore(((Math.max(0, 80 - G.raceT) * 18) | 0));
    audio.lap();
    screenFlash(GOLD, 0.7);
    hitStop(0.08);
    kick(5);
    toast(isTime() ? '完圈' : ('冲线 · 第' + G.place), false, true);
    setTimeout(function () {
      if (G.mode !== 'play' || G.why !== 'wait') return;
      settleRace();
    }, 720);
  }

  function settleRace() {
    if (G.mode !== 'play') return;
    G.why = 'done';
    G.place = placeOf(0);
    if (G.kind === 'gp') {
      const order = cars.slice().sort(function (a, b) { return rankKey(b) - rankKey(a); });
      for (let i = 0; i < order.length; i++) {
        G.pts[order[i].id] += PTS[i] || 0;
      }
      maybeBest();
      if (G.trackI >= 2) {
        champFinish();
        return;
      }
      G.mode = 'inter';
      G.interT = 2.4;
      const lead = '本站第' + G.place + '　·　积分 ' + G.pts[0] + '　·　下一站 ' + TRACKS[G.trackI + 1].name;
      showOverlay('inter', def().name, lead);
      hud();
      return;
    }
    const pb = maybeTimeBest();
    maybeBest();
    G.mode = pb ? 'win' : 'win';
    if (pb) audio.win();
    else audio.sting();
    showOverlay(pb ? 'win' : 'win', pb ? '新纪录' : '完赛', def().name + '　·　' + fmtTime(G.raceT) + (pb ? '　破纪录' : '') + '　·　' + (G.score | 0) + ' 分');
    hud();
  }

  function champFinish() {
    maybeBest();
    const mine = G.pts[0];
    let best = mine;
    let bestId = 0;
    for (let i = 1; i < 4; i++) {
      if (G.pts[i] > best) {
        best = G.pts[i];
        bestId = i;
      }
    }
    const win = bestId === 0;
    G.mode = win ? 'win' : 'lose';
    if (win) audio.win();
    else audio.lose();
    const board = '积分 ' + mine + '　·　' + (G.score | 0) + ' 分　·　赤狐' + G.pts[1] + ' 青隼' + G.pts[2] + ' 银鲨' + G.pts[3];
    showOverlay(win ? 'win' : 'lose', win ? '冠军' : ('第' + (1 + [0, 1, 2, 3].filter(function (i) { return G.pts[i] > mine; }).length) + '名'), board);
    hud();
  }

  function updateJuice(dt) {
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0003, dt));
    G.shake = Math.max(0, G.shake - dt * 26);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.comboT = Math.max(0, G.comboT - dt);
    if (G.comboT <= 0) G.combo = 0;
    for (let i = 0; i < cars.length; i++) {
      cars[i].bumpT = Math.max(0, cars[i].bumpT - dt);
      cars[i].oil = Math.max(0, cars[i].oil - dt);
      cars[i].oilCd = Math.max(0, cars[i].oilCd - dt);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].t -= dt;
      floats[i].y -= 22 * dt;
      if (floats[i].t <= 0) floats.splice(i, 1);
    }
    fadeSkid(dt);
  }

  function updateGo(dt) {
    if (G.mode !== 'play' || G.go <= 0) return;
    const prev = G.go;
    G.go -= dt;
    const phase = G.go > 2.6 ? 3 : G.go > 1.7 ? 2 : G.go > 0.8 ? 1 : 0;
    if (phase !== G.goPhase) {
      G.goPhase = phase;
      audio.count(phase);
      if (phase === 0) toast('冲！', false, true);
    }
    if (prev > 0 && G.go <= 0) {
      G.go = 0;
      G.raceT = 0;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    const p = cars[0];
    const cap = p ? maxSpd(p) : 180;
    const spd01 = p ? clamp(p.spd / cap, 0, 1) : 0;
    G.kmh = spd01 * (210 + (p ? p.gear * 42 : 0));
    const engOn = (G.mode === 'play' || G.mode === 'title' || G.mode === 'inter') && p && (p.spd > 8 || (G.go > 0 && keys.u));
    audio.tickEngine(spd01, engOn, p ? p.drift : 0);

    if (G.stop > 0) {
      G.stop -= dt;
      updateJuice(dt * 0.35);
      return;
    }

    updateJuice(dt);

    if (G.mode === 'inter') {
      G.interT -= dt;
      if (G.interT <= 0) nextGpRace();
      for (let i = 0; i < cars.length; i++) {
        cars[i].spd = Math.max(0, cars[i].spd - 80 * dt);
      }
      return;
    }

    if (G.mode === 'win' || G.mode === 'lose' || G.mode === 'pick') {
      for (let i = 0; i < cars.length; i++) {
        const c = cars[i];
        c.spd = Math.max(0, c.spd - 70 * dt);
        if (c.spd > 8) {
          applyDrive(c, c.ai ? aiInput(c) : { steer: 0, gas: 0, brake: 1 }, dt);
          collideWall(c);
        }
      }
      return;
    }

    updateGo(dt);

    const demo = G.mode === 'title';
    const play = G.mode === 'play';

    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      const inp = (c.ai || demo) ? aiInput(c) : readInput();
      applyDrive(c, inp, dt);
      collideWall(c);
      if (play && c.isP && !c.ai && Math.abs(c.drift) > 0.38 && c.spd > 50 && c.oil <= 0 && G.go <= 0 && !c.done) {
        G.driftHold += dt;
        smearSkid(c);
        if (Math.random() < 0.5) {
          emit(1, {
            x: c.x - Math.cos(c.a) * 8, y: c.y - Math.sin(c.a) * 8, j: 3,
            vx0: -20, vx1: 20, vy0: -20, vy1: 20,
            r0: 1.2, r1: 2.6, life: 0.28, rgb: [80, 80, 90], g: 0
          });
        }
        if (G.driftHold >= 0.36) {
          G.driftHold = 0;
          popCombo('漂');
          audio.overtake(G.combo);
        }
      } else if (c.isP) {
        G.driftHold = 0;
      }
    }

    carsCollide(dt);
    if (play && G.go <= 0) pickups(dt);

    if (play && G.go <= 0 && p && !p.done) {
      G.raceT += dt;
      G.score += p.spd * dt * 0.045 * (1 + G.combo * 0.08);
      G.place = placeOf(0);
    }

    if (demo) {
      for (let i = 0; i < cars.length; i++) {
        if (cars[i].laps >= 2) {
          gridCar(cars[i], i, cars.length);
          cars[i].spd = maxSpd(cars[i]) * 0.55;
        }
      }
    }

    if (G.clock > 0.1) {
      G.clock = 0;
      if (play) maybeBest();
      hud();
    }
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function drawCar(car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.a + car.drift * 0.32);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(1.2, 1.6, 9, 4.6, 0, 0, TAU);
    ctx.fill();
    if (car.isP && G.mode === 'play') {
      ctx.shadowColor = rgba(CYN, 0.7);
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = rgba(car.rgb, 1);
    roundRect(ctx, -8.2, -4.6, 16.4, 9.2, 2.2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(mix(car.rgb, [20, 16, 24], 0.35), 1);
    roundRect(ctx, -3.2, -3.5, 8.4, 7, 1.4);
    ctx.fill();
    ctx.fillStyle = rgba([180, 230, 255], 0.7);
    roundRect(ctx, 1.4, -2.6, 4.2, 5.2, 1);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(6.4, -3.4, 1.6, 1.8);
    ctx.fillRect(6.4, 1.6, 1.6, 1.8);
    ctx.fillStyle = rgba(COR, 0.85);
    ctx.fillRect(-8.2, -3.2, 1.4, 1.6);
    ctx.fillRect(-8.2, 1.6, 1.4, 1.6);
    if (Math.abs(car.drift) > 0.4 && car.spd > 40) {
      ctx.fillStyle = rgba(WHT, 0.18);
      ctx.fillRect(-11, -4, 4, 8);
    }
    ctx.restore();
  }

  function drawOil(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(0.4);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, o.r);
    g.addColorStop(0, 'rgba(40,20,60,0.55)');
    g.addColorStop(0.5, 'rgba(90,40,130,0.4)');
    g.addColorStop(1, 'rgba(20,10,30,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, o.r, o.r * 0.62, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,120,255,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawWrench(w) {
    if (!w.live) return;
    const s = 1 + Math.sin(w.pulse) * 0.12;
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(0.5 + w.pulse * 0.12);
    ctx.scale(s, s);
    ctx.shadowColor = rgba(GOLD, 0.85);
    ctx.shadowBlur = 9;
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.fillRect(-1.1, -5.6, 2.2, 11);
    ctx.fillRect(-3.6, -7.2, 7.2, 3.4);
    ctx.fillStyle = rgba([22, 8, 10], 1);
    ctx.fillRect(-1.5, -6.4, 3, 1.8);
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.fillRect(-2.4, 4.4, 4.8, 2.2);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawLights() {
    if (G.mode !== 'play' || G.go <= 0) return;
    const y = 28;
    const xs = [CX - 22, CX, CX + 22];
    const phase = G.goPhase;
    for (let i = 0; i < 3; i++) {
      const on = phase >= 0 && (phase === 0 || i < (4 - phase));
      const green = phase === 0;
      ctx.beginPath();
      ctx.fillStyle = on ? (green ? rgba(GRN, 0.95) : rgba(COR, 0.95)) : 'rgba(20,10,12,0.8)';
      ctx.strokeStyle = 'rgba(255,244,234,0.25)';
      ctx.lineWidth = 1.2;
      ctx.arc(xs[i], y, 8, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.font = 'bold 22px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(phase === 0 ? '冲' : String(Math.max(1, phase)), CX, y + 32);
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#100806';
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake : 0;
    const shy = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake * 0.6 : 0;
    ctx.save();
    ctx.translate(ox + shx, oy + shy);
    ctx.scale(scale * G.punch, scale * G.punch);
    if (G.punch !== 1) {
      ctx.translate(CX * (1 / G.punch - 1) * 0.5, CY * (1 / G.punch - 1) * 0.5);
    }
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    ctx.drawImage(trackCvs, 0, 0);
    ctx.drawImage(skidCvs, 0, 0);

    for (let i = 0; i < oils.length; i++) drawOil(oils[i]);
    for (let i = 0; i < wrenches.length; i++) drawWrench(wrenches[i]);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / (p.max || 0.4), 0, 1));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }

    const order = cars.slice().sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < order.length; i++) drawCar(order[i]);

    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t * 1.4, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold 14px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }

    drawLights();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.5);
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl) return;
    W = Math.max(1, stageEl.clientWidth);
    H = Math.max(1, stageEl.clientHeight);
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerVirtX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerVirtY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGP();
    else if (G.mode === 'pick') startTime(0);
    else if (G.kind === 'time') startTime(G.trackI);
    else startGP();
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGP();
    else if (G.mode === 'pick') startTime(0);
    else if (G.mode === 'inter') nextGpRace();
    else if (G.mode === 'lose' || G.mode === 'win') {
      if (G.kind === 'time') startTime(G.trackI);
      else startGP();
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    if (k === ' ' || k === 'Spacebar' || e.code === 'Space') {
      if (down && overlayOpen()) {
        e.preventDefault();
        primaryAction();
        return;
      }
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Enter')) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1') {
      startGP();
      return;
    }
    if (k === '2') {
      audio.ensure();
      showPick();
      return;
    }
    if (k === 'Enter') primaryAction();
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindHold(el, set) {
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      set(true);
      el.classList.add('held');
      inputSrc = 'key';
      audio.ensure();
    };
    const up = function (e) {
      e.preventDefault();
      set(false);
      el.classList.remove('held');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now * 0.001;
      return;
    }
    const t = now * 0.001;
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindHold(btnLeft, function (v) { keys.l = v; });
  bindHold(btnRight, function (v) { keys.r = v; });
  bindHold(btnGas, function (v) { keys.u = v; });
  bindHold(btnBrake, function (v) { keys.d = v; });

  if (btnGp) {
    btnGp.addEventListener('click', function () {
      audio.ensure();
      startGP();
    });
  }
  if (btnTime) {
    btnTime.addEventListener('click', function () {
      audio.ensure();
      showPick();
    });
  }
  if (btnT0) btnT0.addEventListener('click', function () { startTime(0); });
  if (btnT1) btnT1.addEventListener('click', function () { startTime(1); });
  if (btnT2) btnT2.addEventListener('click', function () { startTime(2); });
  if (btnOvGo) {
    btnOvGo.addEventListener('click', function () {
      audio.ensure();
      nextGpRace();
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      if (G.kind === 'time') startTime(G.trackI);
      else startGP();
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.u = false;
      keys.d = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
