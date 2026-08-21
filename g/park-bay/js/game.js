(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const MW = 960;
  const MH = 640;
  const LEN = 56;
  const WID = 22;
  const THRUST = 172;
  const DRAG_F = 1.72;
  const DRAG_S = 7.2;
  const YAW0 = 1.42;
  const YAW1 = 2.28;
  const OM_DAMP = 4.4;
  const PARK_SPD = 28;
  const PARK_ANG = 0.22;
  const PARK_HOLD = 0.78;
  const LIVES = 3;
  const STEP = 1 / 60;
  const LOCK = 0.34;
  const DIE_T = 0.64;
  const CLEAR_T = 0.82;
  const TAU = Math.PI * 2;
  const WALL_T = 16;

  const ML = { x: 18, y: 14, w: 262, h: 172 };
  const MR = { x: 680, y: 14, w: 262, h: 172 };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function wrap(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function angDiff(a, b) {
    return wrap(a - b);
  }

  const STAGES = [
    {
      name: "正坞",
      sub: "SQUARE",
      hint: "看镜像倒车。左右是反的",
      time: 32,
      dock: { x: 480, y: 196, w: 108, d: 162, open: Math.PI / 2 },
      spawn: { x: 480, y: 506, h: Math.PI / 2 },
      current: { x: 0, y: 0 },
      posts: [],
      boats: []
    },
    {
      name: "偏角",
      sub: "SKEW",
      hint: "先把船尾甩正，再倒入",
      time: 38,
      dock: { x: 508, y: 188, w: 94, d: 156, open: Math.PI / 2 },
      spawn: { x: 398, y: 512, h: Math.PI / 2 + 0.48 },
      current: { x: 0, y: 0 },
      posts: [],
      boats: [{ x: 780, y: 250, h: Math.PI / 2, len: 70, wid: 22 }]
    },
    {
      name: "窄桩",
      sub: "POSTS",
      hint: "桩只在镜像里，别擦到",
      time: 40,
      dock: { x: 456, y: 192, w: 78, d: 154, open: Math.PI / 2 },
      spawn: { x: 546, y: 520, h: Math.PI / 2 - 0.34 },
      current: { x: 0, y: 0 },
      posts: [
        { x: 390, y: 168, r: 10, mag: true },
        { x: 522, y: 168, r: 10, mag: false }
      ],
      boats: [{ x: 200, y: 300, h: 0.15, len: 64, wid: 20 }]
    },
    {
      name: "横流",
      sub: "DRIFT",
      hint: "水在推你，用舵顶住",
      time: 42,
      dock: { x: 500, y: 186, w: 90, d: 158, open: Math.PI / 2 },
      spawn: { x: 420, y: 510, h: Math.PI / 2 + 0.16 },
      current: { x: 12, y: 0 },
      posts: [],
      boats: [
        { x: 180, y: 310, h: Math.PI / 2, len: 68, wid: 21 },
        { x: 800, y: 250, h: -0.2, len: 60, wid: 20 }
      ]
    },
    {
      name: "斜坞",
      sub: "SLANT",
      hint: "坞是斜的，镜像里找平行",
      time: 46,
      dock: { x: 500, y: 214, w: 76, d: 160, open: Math.PI / 2 + 0.36 },
      spawn: { x: 392, y: 500, h: Math.PI / 2 + 0.22 },
      current: { x: -8, y: 3 },
      posts: [],
      boats: [{ x: 200, y: 290, h: 0.55, len: 72, wid: 22 }]
    }
  ];

  function dockAxes(d) {
    const fx = Math.cos(d.open);
    const fy = Math.sin(d.open);
    return { fx: fx, fy: fy, rx: -fy, ry: fx };
  }

  function dockPoint(d, along, across) {
    const a = dockAxes(d);
    return {
      x: d.x + a.fx * along * d.d * 0.5 + a.rx * across * d.w * 0.5,
      y: d.y + a.fy * along * d.d * 0.5 + a.ry * across * d.w * 0.5
    };
  }

  function makeWalls(d) {
    const T = WALL_T;
    const a = dockAxes(d);
    const walls = [];
    walls.push({
      x: d.x - a.fx * (d.d * 0.5 + T * 0.5),
      y: d.y - a.fy * (d.d * 0.5 + T * 0.5),
      hw: T * 0.5,
      hh: d.w * 0.5 + T,
      rot: d.open,
      kind: "back"
    });
    walls.push({
      x: d.x - a.rx * (d.w * 0.5 + T * 0.5),
      y: d.y - a.ry * (d.w * 0.5 + T * 0.5),
      hw: d.d * 0.5 + T * 0.5,
      hh: T * 0.5,
      rot: d.open,
      kind: "left"
    });
    walls.push({
      x: d.x + a.rx * (d.w * 0.5 + T * 0.5),
      y: d.y + a.ry * (d.w * 0.5 + T * 0.5),
      hw: d.d * 0.5 + T * 0.5,
      hh: T * 0.5,
      rot: d.open,
      kind: "right"
    });
    const wing = 46;
    walls.push({
      x: d.x + a.fx * (d.d * 0.5 - T * 0.1) - a.rx * (d.w * 0.5 + T + wing * 0.5),
      y: d.y + a.fy * (d.d * 0.5 - T * 0.1) - a.ry * (d.w * 0.5 + T + wing * 0.5),
      hw: T * 0.45,
      hh: wing * 0.5,
      rot: d.open,
      kind: "deco"
    });
    walls.push({
      x: d.x + a.fx * (d.d * 0.5 - T * 0.1) + a.rx * (d.w * 0.5 + T + wing * 0.5),
      y: d.y + a.fy * (d.d * 0.5 - T * 0.1) + a.ry * (d.w * 0.5 + T + wing * 0.5),
      hw: T * 0.45,
      hh: wing * 0.5,
      rot: d.open,
      kind: "deco"
    });
    return walls;
  }

  function borderWalls() {
    const T = 22;
    return [
      { x: MW * 0.5, y: T * 0.5, hw: T * 0.5, hh: MW * 0.5, rot: Math.PI / 2, kind: "rim" },
      { x: MW * 0.5, y: MH - T * 0.5, hw: T * 0.5, hh: MW * 0.5, rot: Math.PI / 2, kind: "rim" },
      { x: T * 0.5, y: MH * 0.5, hw: MH * 0.5, hh: T * 0.5, rot: Math.PI / 2, kind: "rim" },
      { x: MW - T * 0.5, y: MH * 0.5, hw: MH * 0.5, hh: T * 0.5, rot: Math.PI / 2, kind: "rim" }
    ];
  }

  function boatAsOBB(b) {
    return {
      x: b.x,
      y: b.y,
      hw: b.len * 0.5,
      hh: b.wid * 0.5,
      rot: b.h,
      kind: "boat"
    };
  }

  function mouthPylons(d) {
    const L = dockPoint(d, 0.9, -1.2);
    const R = dockPoint(d, 0.9, 1.2);
    return [
      { x: L.x, y: L.y, r: 8, mag: true },
      { x: R.x, y: R.y, r: 8, mag: false }
    ];
  }

  function buildLevel(spec) {
    const dock = {
      x: spec.dock.x,
      y: spec.dock.y,
      w: spec.dock.w,
      d: spec.dock.d,
      open: spec.dock.open
    };
    const walls = makeWalls(dock).concat(borderWalls());
    const posts = mouthPylons(dock).concat(spec.posts.map(function (p) {
      return { x: p.x, y: p.y, r: p.r, mag: p.mag };
    }));
    const boats = spec.boats.map(function (b) {
      return { x: b.x, y: b.y, h: b.h, len: b.len, wid: b.wid };
    });
    return {
      name: spec.name,
      sub: spec.sub,
      hint: spec.hint,
      time: spec.time,
      dock: dock,
      spawn: { x: spec.spawn.x, y: spec.spawn.y, h: spec.spawn.h },
      current: { x: spec.current.x, y: spec.current.y },
      walls: walls,
      posts: posts,
      boats: boats
    };
  }

  function makeState(index, lives) {
    const spec = STAGES[index];
    const lv = buildLevel(spec);
    return {
      stageIndex: index,
      lv: lv,
      x: lv.spawn.x,
      y: lv.spawn.y,
      h: lv.spawn.h,
      vx: 0,
      vy: 0,
      om: 0,
      thr: 0,
      rud: 0,
      t: 0,
      remain: spec.time,
      lives: lives == null ? LIVES : lives,
      livesMax: LIVES,
      lock: LOCK,
      phase: "play",
      phaseT: 0,
      why: "",
      parkU: 0,
      shake: 0,
      flash: 0,
      flashRgb: "0,240,255",
      taught: false,
      taughtSteer: false,
      clock: 0,
      prop: 0
    };
  }

  const HULL = [
    { t: -0.40, r: 10.2 },
    { t: -0.18, r: 11.0 },
    { t: 0.04, r: 11.0 },
    { t: 0.24, r: 10.0 },
    { t: 0.42, r: 7.6 }
  ];

  function circleHitOBB(cx, cy, cr, w) {
    const dx = cx - w.x;
    const dy = cy - w.y;
    const c = Math.cos(w.rot);
    const s = Math.sin(w.rot);
    const lx = dx * c + dy * s;
    const ly = -dx * s + dy * c;
    const qx = clamp(lx, -w.hw, w.hw);
    const qy = clamp(ly, -w.hh, w.hh);
    const ex = lx - qx;
    const ey = ly - qy;
    return ex * ex + ey * ey < cr * cr;
  }

  function hullHit(st) {
    const lv = st.lv;
    const c = Math.cos(st.h);
    const s = Math.sin(st.h);
    for (let i = 0; i < HULL.length; i++) {
      const px = st.x + c * HULL[i].t * LEN;
      const py = st.y + s * HULL[i].t * LEN;
      const r = HULL[i].r;
      if (px < 28 || px > MW - 28 || py < 24 || py > MH - 24) return "out";
      for (let k = 0; k < lv.walls.length; k++) {
        if (lv.walls[k].kind === "deco") continue;
        if (circleHitOBB(px, py, r, lv.walls[k])) {
          return lv.walls[k].kind === "rim" ? "out" : "wall";
        }
      }
      for (let k = 0; k < lv.posts.length; k++) {
        const p = lv.posts[k];
        const dx = px - p.x;
        const dy = py - p.y;
        if (dx * dx + dy * dy < (r + p.r) * (r + p.r)) return "post";
      }
      for (let k = 0; k < lv.boats.length; k++) {
        if (circleHitOBB(px, py, r, boatAsOBB(lv.boats[k]))) return "boat";
      }
    }
    return null;
  }

  function hullCorners(x, y, h) {
    const c = Math.cos(h);
    const s = Math.sin(h);
    const hl = LEN * 0.5;
    const hw = WID * 0.5;
    return [
      [x + c * hl - s * hw, y + s * hl + c * hw],
      [x + c * hl + s * hw, y + s * hl - c * hw],
      [x - c * hl - s * hw, y - s * hl + c * hw],
      [x - c * hl + s * hw, y - s * hl - c * hw]
    ];
  }

  function bodyInSlip(st, inset) {
    const d = st.lv.dock;
    const a = dockAxes(d);
    const hw = d.d * 0.5 - inset;
    const hh = d.w * 0.5 - inset;
    const pts = hullCorners(st.x, st.y, st.h);
    for (let i = 0; i < 4; i++) {
      const dx = pts[i][0] - d.x;
      const dy = pts[i][1] - d.y;
      const along = dx * a.fx + dy * a.fy;
      const across = dx * a.rx + dy * a.ry;
      if (along < -hw || along > hw || across < -hh || across > hh) return false;
    }
    return true;
  }

  function parkReady(st) {
    const spd = hypot2(st.vx, st.vy);
    const hErr = Math.abs(angDiff(st.h, st.lv.dock.open));
    return bodyInSlip(st, 3) && spd < PARK_SPD && hErr < PARK_ANG;
  }

  function stepBoat(st, thr, rud, dt, collide) {
    if (st.phase !== "play") {
      st.phaseT += dt;
      st.shake = Math.max(0, st.shake - dt * 16);
      st.flash = Math.max(0, st.flash - dt);
      st.vx *= Math.exp(-2.4 * dt);
      st.vy *= Math.exp(-2.4 * dt);
      st.om *= Math.exp(-3.2 * dt);
      st.x += st.vx * dt;
      st.y += st.vy * dt;
      st.h = wrap(st.h + st.om * dt);
      if (st.phase === "clear") st.parkU = 1;
      return null;
    }

    st.t += dt;
    st.remain = Math.max(0, st.remain - dt);
    st.lock = Math.max(0, st.lock - dt);
    st.shake = Math.max(0, st.shake - dt * 18);
    st.flash = Math.max(0, st.flash - dt);
    st.clock += dt;
    st.prop += dt * (8 + Math.abs(st.thr) * 18);

    const force = st.lock > 0 ? 0 : 1;
    const tThr = clamp(thr, -1, 1) * force;
    const tRud = clamp(rud, -1, 1) * force;
    const kT = 1 - Math.exp(-11 * dt);
    const kR = 1 - Math.exp(-10 * dt);
    st.thr = lerp(st.thr, tThr, kT);
    st.rud = lerp(st.rud, tRud, kR);

    const c = Math.cos(st.h);
    const s = Math.sin(st.h);
    const cur = st.lv.current;
    let along = (st.vx - cur.x) * c + (st.vy - cur.y) * s;
    let side = -(st.vx - cur.x) * s + (st.vy - cur.y) * c;
    along += st.thr * THRUST * dt;
    along *= Math.exp(-DRAG_F * dt);
    side *= Math.exp(-DRAG_S * dt);
    st.vx = along * c - side * s + cur.x;
    st.vy = along * s + side * c + cur.y;

    const invert = along <= -10 ? -1 : 1;
    st.om += st.rud * invert * (YAW0 + YAW1 * Math.abs(st.thr)) * dt;
    st.om *= Math.exp(-OM_DAMP * dt);
    st.h = wrap(st.h + st.om * dt);

    st.x += st.vx * dt;
    st.y += st.vy * dt;

    if (collide) {
      const hit = hullHit(st);
      if (hit) {
        st.why = hit;
        st.phase = "die";
        st.phaseT = 0;
        st.flash = 0.5;
        st.flashRgb = "255,61,184";
        st.shake = 10;
        return "die";
      }
    }

    if (parkReady(st)) {
      st.parkU = Math.min(1, st.parkU + dt / PARK_HOLD);
      if (st.parkU >= 1) {
        st.why = "park";
        st.phase = "clear";
        st.phaseT = 0;
        st.flash = 0.52;
        st.flashRgb = "0,240,255";
        return "clear";
      }
    } else {
      st.parkU = Math.max(0, st.parkU - dt * 1.6);
    }

    if (st.remain <= 0) {
      st.remain = 0;
      st.why = "time";
      st.phase = "die";
      st.phaseT = 0;
      st.flash = 0.45;
      st.flashRgb = "255,61,184";
      return "die";
    }
    return null;
  }

  function autoPilot(st) {
    const d = st.lv.dock;
    const a = dockAxes(d);
    const cur = st.lv.current;
    const dx = st.x - d.x;
    const dy = st.y - d.y;
    const along = dx * a.fx + dy * a.fy;
    const across = dx * a.rx + dy * a.ry;
    const spd = hypot2(st.vx, st.vy);
    const c = Math.cos(st.h);
    const s = Math.sin(st.h);
    const alongSpd = st.vx * c + st.vy * s;
    const curAcross = cur.x * a.rx + cur.y * a.ry;
    const crab = clamp(curAcross * 0.03, -0.42, 0.42);
    const setup = clamp(across * 0.02, -0.62, 0.62);
    const desiredH = d.open + setup + crab;
    const hErr = angDiff(st.h, desiredH);
    const alongT = -d.d * 0.05;
    const alongErr = along - alongT;
    const reversing = alongSpd < -8;
    const sign = reversing ? 1 : -1;

    let thr = 0;
    let rud = 0;

    if (along > d.d * 0.5 && Math.abs(hErr) > 0.22) {
      rud = -hErr * 2.8;
      if (Math.abs(alongSpd) > 10) thr = alongSpd > 0 ? -0.2 : 0.26;
      return { thr: clamp(thr, -1, 1), rud: clamp(rud, -1, 1) };
    }

    if (Math.abs(across) > d.w * 0.5 + 16 && along < d.d * 1.05) {
      thr = along < d.d * 0.75 ? 0.35 : -0.45;
      rud = sign * hErr * 2.6;
      return { thr: clamp(thr, -1, 1), rud: clamp(rud, -1, 1) };
    }

    const hOpen = angDiff(st.h, d.open);
    const waterAlong = (st.vx - cur.x) * c + (st.vy - cur.y) * s;
    const inv = waterAlong <= -10 ? -1 : 1;

    if (along > -d.d * 0.02 && along < d.d * 0.6 && Math.abs(hOpen) > 0.18) {
      rud = -hOpen * 3.1 * inv;
      thr = along < d.d * 0.28 ? 0.22 : -0.12;
      return { thr: clamp(thr, -1, 1), rud: clamp(rud, -1, 1) };
    }

    if (along < d.d * 0.18) {
      rud = -hOpen * 3.2 * inv;
      const curAlong = cur.x * c + cur.y * s;
      thr = clamp(-alongErr * 0.05 - curAlong * 0.05, -0.45, 0.45);
      if (alongErr > 8) thr = Math.min(thr, -0.24);
      if (alongErr < -14) thr = Math.max(thr, 0.22);
      return { thr: clamp(thr, -1, 1), rud: clamp(rud, -1, 1) };
    }

    if (alongErr > 14) thr = -0.88;
    else if (alongErr > 3) thr = spd > 16 ? -0.08 : -0.34;
    else if (alongErr < -18) thr = 0.4;
    else if (spd > 10) thr = alongSpd > 0 ? -0.12 : 0.16;

    rud = sign * (hErr * 2.4 + clamp(across * 0.028, -0.55, 0.55));
    return { thr: clamp(thr, -1, 1), rud: clamp(rud, -1, 1) };
  }

  function simulateStage(index, maxTime) {
    const st = makeState(index, 9);
    const limit = maxTime || 50;
    let t = 0;
    while (t < limit && st.phase === "play") {
      const inp = autoPilot(st);
      stepBoat(st, inp.thr, inp.rud, STEP, true);
      t += STEP;
    }
    const d = st.lv.dock;
    const ax = dockAxes(d);
    const along = (st.x - d.x) * ax.fx + (st.y - d.y) * ax.fy;
    const across = (st.x - d.x) * ax.rx + (st.y - d.y) * ax.ry;
    return {
      name: STAGES[index].name,
      won: st.phase === "clear",
      why: st.why,
      t: Math.round(t * 10) / 10,
      x: Math.round(st.x),
      y: Math.round(st.y),
      h: Math.round(st.h * 100) / 100,
      along: Math.round(along),
      across: Math.round(across),
      park: Math.round(st.parkU * 100)
    };
  }

  if (typeof document === "undefined") {
    STAGES.forEach(function (s, i) {
      if (!s.name || !s.sub || !s.dock || !s.spawn) throw new Error("stage " + i);
      if (s.time < 12) throw new Error("time " + i);
    });
    const results = STAGES.map(function (_, i) {
      return simulateStage(i, 55);
    });
    results.forEach(function (r) {
      console.log((r.won ? "OK" : "TRY") + " " + r.name + " t=" + r.t + " " + r.x + "," + r.y + " h=" + r.h + " al=" + r.along + " ac=" + r.across + " p=" + r.park + (r.why ? " " + r.why : ""));
    });
    const failed = results.filter(function (r) {
      return !r.won;
    });
    if (failed.length) {
      console.error("unreachable", failed.map(function (f) {
        return f.name;
      }).join(","));
      process.exitCode = 1;
    } else {
      console.log("park-bay maps ok", STAGES.length);
    }
    return;
  }

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.getElementById("overlay");
  const panel = document.getElementById("panel");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovLead = document.getElementById("ov-lead");
  const ovOps = document.getElementById("ov-ops");
  const ovBtn = document.getElementById("ov-btn");
  const stageLabel = document.getElementById("stage-label");
  const timeLabel = document.getElementById("time-label");
  const gearLabel = document.getElementById("gear-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const padEl = document.getElementById("pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnFwd = document.getElementById("btn-fwd");
  const btnRev = document.getElementById("btn-rev");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "下拉倒车 · 看上面两面镜子 · 左右是反的";
    padEl.style.display = "flex";
  }

  const keys = { left: false, right: false, up: false, down: false };
  const pad = { left: false, right: false, up: false, down: false };
  const pointer = { down: false, vx: 0, vy: 0, id: null };

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };
  const particles = [];
  const wake = [];
  const motes = [];
  const lanterns = [];

  let mode = "title";
  let overlayKind = "title";
  let st = makeState(0);
  let toastT = 0;
  let frozen = true;
  let acc = 0;
  let lastTs = 0;
  let paused = false;
  let runGen = 0;
  let hudTick = 0;

  function seedDecor() {
    motes.length = 0;
    for (let i = 0; i < 56; i++) {
      motes.push({
        x: Math.random() * MW,
        y: Math.random() * MH,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.28 + 0.04,
        p: Math.random() * TAU,
        v: 6 + Math.random() * 10
      });
    }
    lanterns.length = 0;
    const spots = [
      { x: 86, y: 72, mag: true },
      { x: 168, y: 48, mag: false },
      { x: 780, y: 64, mag: true },
      { x: 872, y: 92, mag: false },
      { x: 70, y: 420, mag: false },
      { x: 890, y: 400, mag: true },
      { x: 120, y: 560, mag: true },
      { x: 840, y: 560, mag: false }
    ];
    for (let i = 0; i < spots.length; i++) {
      lanterns.push({
        x: spots[i].x,
        y: spots[i].y,
        mag: spots[i].mag,
        p: i * 0.8,
        s: 0.8 + (i % 3) * 0.14
      });
    }
  }
  seedDecor();

  const SFX = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastShift: 0,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.26;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, freq) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = freq || 700;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.16, "sine", 0.07, 392);
      this.beep(294, 0.22, "triangle", 0.045, 588);
    },
    shift: function () {
      this.ensure();
      this.beep(140, 0.08, "square", 0.03, 90);
    },
    parkTick: function () {
      this.ensure();
      this.beep(660, 0.06, "sine", 0.035, 880);
    },
    splash: function () {
      this.ensure();
      this.noise(0.22, 0.09, 900);
      this.beep(180, 0.28, "sine", 0.05, 70);
    },
    die: function () {
      this.ensure();
      this.noise(0.28, 0.11, 500);
      this.beep(220, 0.5, "sawtooth", 0.08, 55);
    },
    clear: function () {
      this.ensure();
      this.beep(392, 0.12, "sine", 0.07, 523);
      const self = this;
      const g = runGen;
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(523, 0.14, "sine", 0.07, 659);
      }, 90);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, "sine", 0.08, 660);
      const self = this;
      const g = runGen;
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(660, 0.18, "sine", 0.08, 880);
      }, 90);
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(880, 0.32, "sine", 0.1, 1320);
      }, 200);
    },
    lose: function () {
      this.ensure();
      this.beep(180, 0.55, "sawtooth", 0.09, 50);
      this.beep(90, 0.72, "square", 0.05, 40);
    },
    tickEngine: function (thr, spd, playing) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sawtooth";
        o.frequency.value = 58;
        g.gain.value = 0.0001;
        const f = this.ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 420;
        o.connect(f);
        f.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const f = 52 + Math.abs(thr) * 70 + spd * 0.22;
      this.drone.frequency.setTargetAtTime(f, t, 0.08);
      const vol = playing ? 0.012 + Math.abs(thr) * 0.028 + spd * 0.00012 : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.1);
    },
    hushEngine: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.16);
    }
  };

  try {
    if (localStorage.getItem("park-bay-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
    btnMute.setAttribute("aria-label", SFX.muted ? "取消静音" : "静音");
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.26;
    if (m) SFX.hushEngine();
    syncMuteBtn();
    try {
      localStorage.setItem("park-bay-mute", m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 120) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        kind: spec.kind || 0
      });
    }
  }

  function burst(x, y, kind, n) {
    emit(n, {
      x: x,
      y: y,
      j: 10,
      vx0: -120,
      vx1: 120,
      vy0: -120,
      vy1: 120,
      life: 0.55,
      r0: 1.4,
      r1: 4.2,
      kind: kind
    });
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.7;
  }

  function renderHud() {
    if (mode === "title") {
      stageLabel.textContent = "没有雷达";
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
      gearLabel.textContent = "空挡";
      gearLabel.className = "";
    } else {
      const s = STAGES[st.stageIndex];
      stageLabel.textContent = st.stageIndex + 1 + " / " + STAGES.length + "　" + s.name;
      const t = Math.max(0, st.remain);
      timeLabel.textContent = t.toFixed(1);
      timeLabel.classList.toggle("warn", t < 7 && mode === "play");
      if (st.thr < -0.18) {
        gearLabel.textContent = "倒车";
        gearLabel.className = "rev";
      } else if (st.thr > 0.18) {
        gearLabel.textContent = "前进";
        gearLabel.className = "fwd";
      } else {
        gearLabel.textContent = "空挡";
        gearLabel.className = "";
      }
    }
    pipsEl.innerHTML = "";
    const max = mode === "title" ? 0 : st.livesMax;
    for (let i = 0; i < max; i++) {
      const pip = document.createElement("span");
      pip.className = "pip";
      if (i < st.lives) {
        pip.classList.add("on");
        if (st.lives <= 1 && mode === "play") pip.classList.add("warn");
      }
      pipsEl.appendChild(pip);
    }
  }

  function setOverlay(kind) {
    overlayKind = kind;
    overlay.classList.remove("hidden");
    frozen = true;
    panel.classList.toggle("win", kind === "win");
    panel.classList.toggle("lose", kind === "lose");
    if (kind === "title") {
      ovKicker.textContent = "PARK";
      ovTitle.textContent = "入位";
      ovLead.innerHTML = "没有倒车雷达。坞在船尾后面，只看左右镜像。<br />镜像左右是反的。把船尾倒进青色坞位，停稳。";
      ovOps.textContent = coarse
        ? "下拉倒车 · 左右打舵 · 五坞 · M 静音"
        : "WASD / 方向键 · 点按拖动油门与舵 · M 静音";
      ovBtn.textContent = "启航";
    } else if (kind === "lose") {
      ovKicker.textContent = "SCRAPE";
      ovTitle.textContent = "没入位";
      const why =
        st.why === "time" ? "时限到了，坞口还空着。" :
        st.why === "post" ? "擦到桩了。镜像里的距离要自己估。" :
        st.why === "boat" ? "蹭上邻船。窄航道里没有雷达。" :
        st.why === "out" ? "漂出码头了。" :
        "撞上坞壁。没有滴滴声提醒你。";
      ovLead.textContent = why + " 再倒一次。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再倒一次";
    } else if (kind === "win") {
      ovKicker.textContent = "DOCKED";
      ovTitle.textContent = "五坞入位";
      ovLead.textContent = "没有雷达，只靠镜像，五条船都停进了坞。";
      ovOps.textContent = "";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
    overlayKind = "none";
    panel.classList.remove("win", "lose");
  }

  function loadTitle() {
    mode = "title";
    st = makeState(0);
    st.lock = 0;
    particles.length = 0;
    wake.length = 0;
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "没有雷达 · 看上面两面镜子 · 左右是反的"
      : "没有雷达 · 看上面两面镜子 · 左右是反的";
  }

  function loadStage(i, lives) {
    mode = "play";
    st = makeState(i, lives);
    particles.length = 0;
    wake.length = 0;
    hideOverlay();
    renderHud();
    const s = STAGES[i];
    showToast(i + 1 + " / " + STAGES.length + "　" + s.name + " · " + s.hint);
    hintEl.textContent = coarse
      ? s.hint + " · 下拉倒车"
      : s.hint + " · S 倒车 · M 静音";
  }

  function onDieDone() {
    st.lives -= 1;
    if (st.lives <= 0) {
      mode = "lose";
      SFX.hushEngine();
      SFX.lose();
      setOverlay("lose");
      renderHud();
      return;
    }
    const keep = st.lives;
    const why = st.why;
    loadStage(st.stageIndex, keep);
    const msg =
      why === "time" ? "时限 · 还剩 " + keep + " 艘" :
      why === "post" ? "擦桩 · 还剩 " + keep + " 艘" :
      why === "out" ? "漂出 · 还剩 " + keep + " 艘" :
      why === "boat" ? "撞船 · 还剩 " + keep + " 艘" :
      "撞坞 · 还剩 " + keep + " 艘";
    showToast(msg, true);
  }

  function onClearDone() {
    const next = st.stageIndex + 1;
    if (next >= STAGES.length) {
      mode = "win";
      SFX.hushEngine();
      SFX.win();
      setOverlay("win");
      renderHud();
      return;
    }
    loadStage(next, st.lives);
  }

  function fit() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const tw = Math.max(1, Math.round(cssW * dpr));
    const th = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    const scale = Math.min(cssW / VW, cssH / VH);
    view.scale = scale;
    view.ox = (cssW - VW * scale) / 2;
    view.oy = (cssH - VH * scale) / 2;
    view.cssW = cssW;
    view.cssH = cssH;
    view.dpr = dpr;
  }

  function viewFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      vx: (x - view.ox) / view.scale,
      vy: (y - view.oy) / view.scale
    };
  }

  function gatherInput() {
    let thr = 0;
    let rud = 0;
    if (keys.up || pad.up) thr += 1;
    if (keys.down || pad.down) thr -= 1;
    if (keys.left || pad.left) rud -= 1;
    if (keys.right || pad.right) rud += 1;
    if (pointer.down && pointer.id !== "pad") {
      const dx = (pointer.vx - VW * 0.5) / 220;
      const dy = (pointer.vy - VH * 0.78) / 150;
      rud += clamp(dx, -1, 1);
      thr += clamp(-dy, -1, 1);
    }
    return { thr: clamp(thr, -1, 1), rud: clamp(rud, -1, 1) };
  }

  function drawRoundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawWater(t) {
    const g = ctx.createLinearGradient(0, 0, 0, MH);
    g.addColorStop(0, "#071422");
    g.addColorStop(0.42, "#060b18");
    g.addColorStop(1, "#0a0714");
    ctx.fillStyle = g;
    ctx.fillRect(-80, -80, MW + 160, MH + 160);

    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.15;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      for (let x = -40; x <= MW + 40; x += 10) {
        const y = 36 + i * 68 + Math.sin(x * 0.018 + t * 0.7 + i * 0.9) * 9 +
          Math.sin(x * 0.05 + t * 1.15 + i) * 4;
        if (x === -40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const tw = 0.5 + Math.sin(t * 1.4 + m.p) * 0.5;
      ctx.fillStyle = "rgba(190, 230, 255," + (m.a * tw) + ")";
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawLanterns(t) {
    for (let i = 0; i < lanterns.length; i++) {
      const L = lanterns[i];
      const tw = 0.55 + Math.sin(t * 2.2 + L.p) * 0.45;
      const col = L.mag ? "255,61,184" : "0,240,255";
      const rg = ctx.createRadialGradient(L.x, L.y, 1, L.x, L.y, 26 * L.s);
      rg.addColorStop(0, "rgba(" + col + "," + (0.55 * tw) + ")");
      rg.addColorStop(1, "rgba(" + col + ",0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(L.x, L.y, 26 * L.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = L.mag ? "#ff3db8" : "#00f0ff";
      ctx.beginPath();
      ctx.arc(L.x, L.y, 2.4, 0, TAU);
      ctx.fill();
    }
  }

  function drawOBB(w, fill, stroke, lw) {
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.rot);
    drawRoundRect(-w.hw, -w.hh, w.hw * 2, w.hh * 2, 5);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw || 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDock(lv, t) {
    const d = lv.dock;
    const a = dockAxes(d);
    const pulse = 0.5 + Math.sin(t * 2.6) * 0.5;
    const ready = st.parkU > 0.02;

    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.open);
    const glow = ctx.createLinearGradient(-d.d * 0.5, 0, d.d * 0.5, 0);
    glow.addColorStop(0, ready ? "rgba(0,240,255,0.22)" : "rgba(255,61,184,0.10)");
    glow.addColorStop(0.55, "rgba(0,240,255,0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    drawRoundRect(-d.d * 0.5, -d.w * 0.5, d.d, d.w, 8);
    ctx.fill();

    ctx.strokeStyle = ready
      ? "rgba(0,240,255," + (0.45 + pulse * 0.35) + ")"
      : "rgba(0,240,255,0.28)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = t * 18;
    ctx.strokeRect(-d.d * 0.28, -d.w * 0.22, d.d * 0.5, d.w * 0.44);
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(0,240,255,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-d.d * 0.38, -d.w * 0.28);
    ctx.lineTo(-d.d * 0.38, d.w * 0.28);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,240,255,0.22)";
    ctx.font = "900 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.translate(-d.d * 0.42, 0);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("坞", 0, 0);
    ctx.restore();
    ctx.restore();

    for (let i = 0; i < lv.walls.length; i++) {
      const w = lv.walls[i];
      if (w.kind === "rim") {
        drawOBB(w, "#0c0818", "rgba(0,240,255,0.18)", 1);
      } else if (w.kind === "back") {
        drawOBB(w, "#161022", ready ? "rgba(0,240,255,0.85)" : "rgba(255,61,184,0.7)", 1.8);
      } else if (w.kind === "deco") {
        drawOBB(w, "#12101c", "rgba(0,240,255,0.25)", 1.2);
      } else {
        drawOBB(w, "#14101f", w.kind === "left" ? "rgba(255,61,184,0.7)" : "rgba(0,240,255,0.7)", 1.6);
      }
    }

    for (let i = 0; i < lv.posts.length; i++) {
      const p = lv.posts[i];
      const tw = 0.55 + Math.sin(t * 3 + i) * 0.25;
      const col = p.mag ? "255,61,184" : "0,240,255";
      const rg = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r + 14);
      rg.addColorStop(0, "rgba(" + col + "," + (0.35 * tw) + ")");
      rg.addColorStop(1, "rgba(" + col + ",0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 14, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = "#1a1630";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.mag ? "#ff3db8" : "#00f0ff";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.38, 0, TAU);
      ctx.fillStyle = p.mag ? "#ff3db8" : "#00f0ff";
      ctx.fill();
    }

    for (let i = 0; i < lv.boats.length; i++) {
      drawOtherBoat(lv.boats[i], t);
    }

    if (Math.abs(lv.current.x) + Math.abs(lv.current.y) > 2) {
      const cx = lv.current.x;
      const cy = lv.current.y;
      const mag = hypot2(cx, cy) || 1;
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#7af6ff";
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 7; k++) {
        const bx = 80 + (k * 137 + t * 40 * cx) % (MW - 160);
        const by = 80 + ((k * 97 + t * 40 * cy) % (MH - 160));
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (cx / mag) * 22, by + (cy / mag) * 22);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawOtherBoat(b, t) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.h);
    ctx.fillStyle = "rgba(8, 10, 22, 0.9)";
    drawHullPath(b.len, b.wid);
    ctx.fill();
    ctx.strokeStyle = "rgba(180, 190, 220, 0.35)";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 61, 184, 0.28)";
    drawRoundRect(-b.len * 0.08, -b.wid * 0.28, b.len * 0.28, b.wid * 0.56, 3);
    ctx.fill();
    const tw = 0.4 + Math.sin(t * 2 + b.x) * 0.3;
    ctx.fillStyle = "rgba(255,227,107," + tw + ")";
    ctx.beginPath();
    ctx.arc(b.len * 0.28, 0, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHullPath(len, wid) {
    const hl = len * 0.5;
    const hw = wid * 0.5;
    ctx.beginPath();
    ctx.moveTo(hl, 0);
    ctx.quadraticCurveTo(hl * 0.55, -hw, -hl * 0.55, -hw);
    ctx.quadraticCurveTo(-hl * 0.92, -hw * 0.7, -hl, 0);
    ctx.quadraticCurveTo(-hl * 0.92, hw * 0.7, -hl * 0.55, hw);
    ctx.quadraticCurveTo(hl * 0.55, hw, hl, 0);
    ctx.closePath();
  }

  function drawPlayerBoat() {
    const ready = st.parkU > 0.04;
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.h);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(4, 6, LEN * 0.42, WID * 0.55, 0, 0, TAU);
    ctx.fill();

    drawHullPath(LEN, WID);
    ctx.fillStyle = "#14101f";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ready ? "#00f0ff" : "#ff3db8";
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,61,184,0.9)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-LEN * 0.18, -WID * 0.42);
    ctx.lineTo(LEN * 0.22, -WID * 0.28);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,240,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(-LEN * 0.18, WID * 0.42);
    ctx.lineTo(LEN * 0.22, WID * 0.28);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,240,255,0.16)";
    drawRoundRect(-LEN * 0.06, -WID * 0.26, LEN * 0.28, WID * 0.52, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.7)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#ffe36b";
    ctx.beginPath();
    ctx.arc(LEN * 0.36, 0, 2.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#ff3db8";
    ctx.beginPath();
    ctx.arc(-LEN * 0.4, -4.2, 1.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.arc(-LEN * 0.4, 4.2, 1.6, 0, TAU);
    ctx.fill();

    const spin = st.prop;
    ctx.strokeStyle = "rgba(246,243,255,0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-LEN * 0.5, Math.sin(spin) * 5);
    ctx.lineTo(-LEN * 0.5, Math.sin(spin + Math.PI) * 5);
    ctx.stroke();

    if (st.parkU > 0) {
      ctx.strokeStyle = "rgba(0,240,255," + (0.35 + st.parkU * 0.6) + ")";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, LEN * 0.62, -Math.PI / 2, -Math.PI / 2 + TAU * st.parkU);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticlesWorld() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      const col = p.kind === 1 ? "255,61,184" : p.kind === 2 ? "0,240,255" : "180,230,255";
      ctx.fillStyle = "rgba(" + col + "," + (0.12 + a * 0.7) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < wake.length; i++) {
      const w = wake[i];
      const a = clamp(w.life / w.max, 0, 1);
      ctx.strokeStyle = "rgba(0,240,255," + (0.08 + a * 0.22) + ")";
      ctx.lineWidth = 1.2 * a;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, 7 + (1 - a) * 10, 3.2 + (1 - a) * 4, w.h, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawScene() {
    drawWater(st.clock);
    drawLanterns(st.clock);
    drawDock(st.lv, st.clock);
    drawParticlesWorld();
    drawPlayerBoat();
  }

  function applyCam(kind) {
    const c = Math.cos(st.h);
    const s = Math.sin(st.h);
    if (kind === "main") {
      ctx.translate(VW * 0.5, VH * 0.80);
      ctx.rotate(-st.h - Math.PI / 2);
      ctx.scale(1.02, 1.02);
      ctx.translate(-st.x - c * 36, -st.y - s * 36);
    } else {
      const side = kind === "left" ? -1 : 1;
      const rx = -s;
      const ry = c;
      const ox = st.x - c * 8 + rx * side * 16;
      const oy = st.y - s * 8 + ry * side * 16;
      ctx.scale(-1, 1);
      ctx.rotate(-st.h - 3 * Math.PI / 2);
      ctx.scale(0.5, 0.5);
      ctx.translate(-ox, -oy);
    }
  }

  function drawMirror(box, side, label) {
    ctx.save();
    drawRoundRect(box.x, box.y, box.w, box.h, 16);
    ctx.clip();

    ctx.save();
    ctx.translate(box.x + box.w * 0.5, box.y + box.h * 0.72);
    applyCam(side);
    drawScene();
    ctx.restore();

    const glass = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    glass.addColorStop(0, "rgba(255,255,255,0.07)");
    glass.addColorStop(0.45, "rgba(255,255,255,0)");
    glass.addColorStop(1, "rgba(0,240,255,0.05)");
    ctx.fillStyle = glass;
    ctx.fillRect(box.x, box.y, box.w, box.h);

    ctx.strokeStyle = "rgba(246,243,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x + box.w * 0.5, box.y + 26);
    ctx.lineTo(box.x + box.w * 0.5, box.y + box.h - 10);
    ctx.stroke();

    ctx.fillStyle = "rgba(5,3,12,0.35)";
    ctx.fillRect(box.x, box.y, box.w, 22);
    ctx.fillStyle = side === "left" ? "#ff9ad4" : "#7af6ff";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, box.x + 12, box.y + 12);
    ctx.fillStyle = "rgba(200,210,230,0.55)";
    ctx.textAlign = "right";
    ctx.fillText("镜像 · 左右相反", box.x + box.w - 12, box.y + 12);
    ctx.restore();

    ctx.save();
    drawRoundRect(box.x, box.y, box.w, box.h, 16);
    ctx.strokeStyle = side === "left" ? "rgba(255,61,184,0.8)" : "rgba(0,240,255,0.8)";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(246,243,255,0.18)";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  }

  function drawHood() {
    ctx.fillStyle = "rgba(8,6,18,0.94)";
    ctx.beginPath();
    ctx.moveTo(0, VH);
    ctx.lineTo(0, VH * 0.905);
    ctx.quadraticCurveTo(VW * 0.5, VH * 0.845, VW, VH * 0.905);
    ctx.lineTo(VW, VH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, VH * 0.905);
    ctx.quadraticCurveTo(VW * 0.5, VH * 0.845, VW, VH * 0.905);
    ctx.stroke();

    ctx.fillStyle = "#8b90b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("船首朝上 · 倒车看镜像", VW * 0.5, VH * 0.975);

    const rx = VW * 0.5 + st.rud * 54;
    const ry = VH * 0.93;
    ctx.strokeStyle = "rgba(246,243,255,0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(VW * 0.5 - 54, ry);
    ctx.lineTo(VW * 0.5 + 54, ry);
    ctx.stroke();
    ctx.fillStyle = st.rud < 0 ? "#ff3db8" : st.rud > 0 ? "#00f0ff" : "#c9c6e8";
    ctx.beginPath();
    ctx.arc(rx, ry, 4.2, 0, TAU);
    ctx.fill();
  }

  function drawWorld() {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, view.cssW, view.cssH);

    const shx = st.shake ? (Math.random() - 0.5) * st.shake : 0;
    const shy = st.shake ? (Math.random() - 0.5) * st.shake : 0;
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);

    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, VW, VH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    ctx.save();
    applyCam("main");
    drawScene();
    ctx.restore();

    const vig = ctx.createRadialGradient(VW * 0.5, VH * 0.62, 40, VW * 0.5, VH * 0.55, 520);
    vig.addColorStop(0, "rgba(5,3,12,0)");
    vig.addColorStop(1, "rgba(5,3,12,0.5)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VW, VH);

    drawHood();
    drawMirror(ML, "left", "左镜");
    drawMirror(MR, "right", "右镜");

    if (st.flash > 0) {
      ctx.fillStyle = "rgba(" + st.flashRgb + "," + (st.flash * 0.24) + ")";
      ctx.fillRect(0, 0, VW, VH);
    }

    if (paused && mode === "play") {
      ctx.fillStyle = "rgba(5,3,12,0.5)";
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#c9c6e8";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("暂停", VW * 0.5, VH * 0.58);
    }

    ctx.restore();
  }

  function stepFx(dt) {
    const c = Math.cos(st.h);
    const s = Math.sin(st.h);
    const spd = hypot2(st.vx, st.vy);
    if ((mode === "play" || mode === "title") && spd > 12 && Math.random() < 0.55) {
      wake.push({
        x: st.x - c * LEN * 0.42 + rand(-4, 4),
        y: st.y - s * LEN * 0.42 + rand(-4, 4),
        h: st.h,
        life: 0.55,
        max: 0.55
      });
      if (wake.length > 40) wake.shift();
    }
    if (Math.abs(st.thr) > 0.2 && Math.random() < 0.4) {
      emit(1, {
        x: st.x - c * LEN * 0.48,
        y: st.y - s * LEN * 0.48,
        j: 3,
        vx0: -c * 20 - 10,
        vx1: -c * 20 + 10,
        vy0: -s * 20 - 10,
        vy1: -s * 20 + 10,
        life: 0.28,
        r0: 0.8,
        r1: 2.1,
        kind: st.thr < 0 ? 1 : 2
      });
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = wake.length - 1; i >= 0; i--) {
      wake[i].life -= dt;
      if (wake[i].life <= 0) wake.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.x += Math.sin(st.clock * 0.4 + m.p) * m.v * dt * 0.2 + st.lv.current.x * dt * 0.4;
      m.y += Math.cos(st.clock * 0.3 + m.p) * 4 * dt + st.lv.current.y * dt * 0.4;
      if (m.x < 0) m.x += MW;
      if (m.x > MW) m.x -= MW;
      if (m.y < 0) m.y += MH;
      if (m.y > MH) m.y -= MH;
    }
  }

  function tick(dt) {
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }

    if (paused && mode === "play") {
      SFX.hushEngine();
      return;
    }

    if (mode === "title") {
      st.lock = 0;
      st.clock += dt;
      const sway = Math.sin(st.clock * 0.35);
      stepBoat(st, -0.18 + sway * 0.08, sway * 0.35, dt, false);
      if (st.x < 200 || st.x > 760 || st.y < 140 || st.y > 560) {
        st.x = lerp(st.x, 480, 0.04);
        st.y = lerp(st.y, 430, 0.04);
        st.h = lerp(st.h, Math.PI / 2, 0.04);
      }
      st.remain = STAGES[0].time;
      st.parkU = 0;
      if (st.phase !== "play") {
        st = makeState(0);
        st.lock = 0;
      }
      stepFx(dt);
      SFX.tickEngine(st.thr, hypot2(st.vx, st.vy) * 0.4, false);
      return;
    }

    if (mode !== "play") {
      stepFx(dt);
      SFX.hushEngine();
      return;
    }

    if (frozen) return;

    const inp = gatherInput();
    const prevThr = st.thr;
    const ev = stepBoat(st, inp.thr, inp.rud, dt, true);

    if (!st.taught && st.thr < -0.35) {
      st.taught = true;
      showToast("看镜像 · 左右是反的");
    }
    if (!st.taughtSteer && Math.abs(st.rud) > 0.55 && st.stageIndex >= 1) {
      st.taughtSteer = true;
      showToast("倒车时，舵往船尾要去的方向打");
    }

    if (prevThr >= -0.12 && st.thr < -0.35 && st.t - SFX.lastShift > 0.4) {
      SFX.lastShift = st.t;
      SFX.shift();
    }

    if (st.parkU > 0.15 && st.parkU < 1 && Math.floor(st.parkU * 8) !== Math.floor((st.parkU - dt / PARK_HOLD) * 8)) {
      SFX.parkTick();
    }

    const spd = hypot2(st.vx, st.vy);
    SFX.tickEngine(st.thr, spd, st.phase === "play");
    stepFx(dt);

    if (ev === "die") {
      SFX.die();
      burst(st.x, st.y, 1, 22);
      renderHud();
    } else if (ev === "clear") {
      SFX.clear();
      burst(st.x, st.y, 2, 24);
      showToast("入位");
      renderHud();
    }

    if (st.phase === "die" && st.phaseT >= DIE_T) onDieDone();
    if (st.phase === "clear" && st.phaseT >= CLEAR_T) onClearDone();

    hudTick += dt;
    if (hudTick > 0.12) {
      hudTick = 0;
      if (mode === "play" && st.phase === "play") {
        const t = Math.max(0, st.remain);
        timeLabel.textContent = t.toFixed(1);
        timeLabel.classList.toggle("warn", t < 7);
        if (st.thr < -0.18) {
          gearLabel.textContent = "倒车";
          gearLabel.className = "rev";
        } else if (st.thr > 0.18) {
          gearLabel.textContent = "前进";
          gearLabel.className = "fwd";
        } else {
          gearLabel.textContent = "空挡";
          gearLabel.className = "";
        }
      }
    }
  }

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    if (acc > 0.2) acc = 0.2;
    fit();
    while (acc >= STEP) {
      tick(STEP);
      acc -= STEP;
    }
    drawWorld();
    requestAnimationFrame(frame);
  }

  function startRun() {
    runGen += 1;
    SFX.start();
    loadStage(0, LIVES);
  }

  function onOverlayAction() {
    SFX.ensure();
    if (overlayKind === "title" || overlayKind === "lose" || overlayKind === "win") {
      startRun();
    }
  }

  ovBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    onOverlayAction();
  });

  btnRetry.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    SFX.ensure();
    startRun();
  });

  btnMute.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  function bindPad(el, key) {
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      pad[key] = true;
      el.classList.add("held");
      SFX.ensure();
    };
    const up = function (e) {
      e.preventDefault();
      pad[key] = false;
      el.classList.remove("held");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
  }
  bindPad(btnLeft, "left");
  bindPad(btnRight, "right");
  bindPad(btnFwd, "up");
  bindPad(btnRev, "down");

  canvas.addEventListener("pointerdown", function (e) {
    if (frozen) return;
    e.preventDefault();
    const p = viewFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.vx = p.vx;
    pointer.vy = p.vy;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
    SFX.ensure();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    const p = viewFromEvent(e);
    pointer.vx = p.vx;
    pointer.vy = p.vy;
  });
  function endPtr(e) {
    if (pointer.id !== e.pointerId && pointer.id != null) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);

  const KEYMAP = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    a: "left",
    d: "right",
    w: "up",
    s: "down",
    A: "left",
    D: "right",
    W: "up",
    S: "down"
  };

  window.addEventListener("keydown", function (e) {
    if (e.repeat) {
      const k = KEYMAP[e.key];
      if (k) keys[k] = true;
      return;
    }
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      SFX.ensure();
      setMuted(!SFX.muted);
      return;
    }
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      SFX.ensure();
      startRun();
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      if (frozen) {
        e.preventDefault();
        onOverlayAction();
        return;
      }
    }
    const k = KEYMAP[e.key];
    if (k) {
      e.preventDefault();
      keys[k] = true;
      SFX.ensure();
    }
  });
  window.addEventListener("keyup", function (e) {
    const k = KEYMAP[e.key];
    if (k) keys[k] = false;
  });
  window.addEventListener("blur", function () {
    keys.left = keys.right = keys.up = keys.down = false;
    pad.left = pad.right = pad.up = pad.down = false;
    pointer.down = false;
  });
  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (document.hidden) SFX.hushEngine();
  });
  window.addEventListener("resize", fit);

  loadTitle();
  fit();
  requestAnimationFrame(frame);
})();
