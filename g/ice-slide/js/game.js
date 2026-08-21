(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const WALL = 26;
  const PR = 12.5;
  const IMPULSE = 76;
  const TAP_CD = 0.2;
  const MAX_SPD = 348;
  const MU = 0.07;
  const REST = 0.9;
  const POST_REST = 0.96;
  const EXIT_R = 32;
  const GEM_R = 9;
  const LIVES = 3;
  const DIE_T = 0.58;
  const CLEAR_T = 0.72;
  const LOCK = 0.28;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rng(seed) {
    let s = seed % 2147483646;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  const STAGES = [
    {
      name: "初滑",
      sub: "GLIDE",
      hint: "轻点加速，没有刹车",
      time: 26,
      spawn: { x: 96, y: 270 },
      exit: { x: 828, y: 270 },
      walls: [],
      posts: [{ x: 480, y: 438, r: 30 }],
      rifts: [],
      gems: [{ x: 480, y: 132 }],
      movers: []
    },
    {
      name: "折角",
      sub: "BANK",
      hint: "撞墙改向，比连点更快",
      time: 30,
      spawn: { x: 92, y: 102 },
      exit: { x: 820, y: 400 },
      walls: [{ x: 26, y: 228, w: 702, h: 30 }],
      posts: [{ x: 878, y: 128, r: 40 }],
      rifts: [],
      gems: [
        { x: 430, y: 102 },
        { x: 170, y: 400 }
      ],
      movers: []
    },
    {
      name: "裂口",
      sub: "RIFT",
      hint: "品红裂口会把你吞掉",
      time: 32,
      spawn: { x: 90, y: 270 },
      exit: { x: 860, y: 270 },
      walls: [],
      posts: [{ x: 480, y: 438, r: 24 }],
      rifts: [
        { x: 310, y: 270, r: 64 },
        { x: 620, y: 270, r: 64 }
      ],
      gems: [
        { x: 490, y: 78 },
        { x: 490, y: 462 }
      ],
      movers: []
    },
    {
      name: "弹廊",
      sub: "BUMP",
      hint: "借移动的冰柱改向",
      time: 34,
      spawn: { x: 90, y: 270 },
      exit: { x: 860, y: 270 },
      walls: [
        { x: 300, y: 26, w: 28, h: 188 },
        { x: 300, y: 326, w: 28, h: 188 },
        { x: 632, y: 26, w: 28, h: 188 },
        { x: 632, y: 326, w: 28, h: 188 }
      ],
      posts: [],
      rifts: [
        { x: 466, y: 78, r: 36 },
        { x: 466, y: 462, r: 36 }
      ],
      gems: [{ x: 466, y: 270 }],
      movers: [{ x: 466, y: 270, r: 26, axis: "y", a: 132, b: 408, spd: 78 }]
    },
    {
      name: "深门",
      sub: "GATE",
      hint: "连撞、轻点，滑进门",
      time: 40,
      spawn: { x: 92, y: 450 },
      exit: { x: 848, y: 92 },
      walls: [
        { x: 318, y: 148, w: 28, h: 366 },
        { x: 614, y: 26, w: 28, h: 338 }
      ],
      posts: [{ x: 868, y: 456, r: 34 }],
      rifts: [
        { x: 168, y: 300, r: 40 },
        { x: 470, y: 270, r: 50 },
        { x: 760, y: 270, r: 36 }
      ],
      gems: [
        { x: 92, y: 86 },
        { x: 470, y: 86 },
        { x: 740, y: 400 }
      ],
      movers: [{ x: 760, y: 140, r: 18, axis: "x", a: 668, b: 880, spd: 86 }]
    }
  ];

  function borders() {
    return [
      { x: 0, y: 0, w: VW, h: WALL },
      { x: 0, y: VH - WALL, w: VW, h: WALL },
      { x: 0, y: 0, w: WALL, h: VH },
      { x: VW - WALL, y: 0, w: WALL, h: VH }
    ];
  }

  function moverState(m, t) {
    const span = Math.max(8, m.b - m.a);
    const period = (2 * span) / m.spd;
    let u = t % period;
    const half = period * 0.5;
    let pos;
    let vel;
    if (u < half) {
      pos = m.a + m.spd * u;
      vel = m.spd;
    } else {
      pos = m.b - m.spd * (u - half);
      vel = -m.spd;
    }
    if (m.axis === "y") return { x: m.x, y: pos, vx: 0, vy: vel, r: m.r };
    return { x: pos, y: m.y, vx: vel, vy: 0, r: m.r };
  }

  function makeState(index, lives, runGems) {
    const s = STAGES[index];
    return {
      stageIndex: index,
      lives: lives == null ? LIVES : lives,
      livesMax: LIVES,
      runGems: runGems || 0,
      px: s.spawn.x,
      py: s.spawn.y,
      vx: 0,
      vy: 0,
      spin: 0,
      squash: 1,
      remain: s.time,
      time: 0,
      tapCd: 0,
      lock: LOCK,
      phase: "play",
      phaseT: 0,
      why: "",
      rift: null,
      shake: 0,
      gems: s.gems.map(function (g) {
        return { x: g.x, y: g.y, got: false, pop: 0 };
      }),
      gemsGot: 0,
      walls: borders().concat(s.walls || []),
      posts: (s.posts || []).slice(),
      rifts: (s.rifts || []).slice(),
      movers: (s.movers || []).slice(),
      exit: { x: s.exit.x, y: s.exit.y },
      spawn: { x: s.spawn.x, y: s.spawn.y },
      taughtSlow: false,
      taughtBank: false,
      won: false,
      lost: false
    };
  }

  function capSpeed(st) {
    const sp = hypot2(st.vx, st.vy);
    if (sp > MAX_SPD) {
      const k = MAX_SPD / sp;
      st.vx *= k;
      st.vy *= k;
    }
  }

  function resolveAabb(st, w) {
    const left = w.x;
    const right = w.x + w.w;
    const top = w.y;
    const bot = w.y + w.h;
    const qx = clamp(st.px, left, right);
    const qy = clamp(st.py, top, bot);
    let dx = st.px - qx;
    let dy = st.py - qy;
    const inside = st.px > left && st.px < right && st.py > top && st.py < bot;
    const d2 = dx * dx + dy * dy;
    if (!inside && d2 >= PR * PR) return false;

    let nx;
    let ny;
    let overlap;
    if (inside || d2 < 1e-8) {
      const pl = st.px - left;
      const prr = right - st.px;
      const pt = st.py - top;
      const pb = bot - st.py;
      const min = Math.min(pl, prr, pt, pb);
      if (min === pl) {
        nx = -1;
        ny = 0;
        overlap = PR + pl;
      } else if (min === prr) {
        nx = 1;
        ny = 0;
        overlap = PR + prr;
      } else if (min === pt) {
        nx = 0;
        ny = -1;
        overlap = PR + pt;
      } else {
        nx = 0;
        ny = 1;
        overlap = PR + pb;
      }
    } else {
      const d = Math.sqrt(d2);
      nx = dx / d;
      ny = dy / d;
      overlap = PR - d;
    }
    st.px += nx * overlap;
    st.py += ny * overlap;
    const vn = st.vx * nx + st.vy * ny;
    if (vn < 0) {
      st.vx -= (1 + REST) * vn * nx;
      st.vy -= (1 + REST) * vn * ny;
      return { nx: nx, ny: ny, sp: -vn };
    }
    return false;
  }

  function resolvePost(st, post, ovx, ovy, e) {
    const dx = st.px - post.x;
    const dy = st.py - post.y;
    const min = PR + post.r;
    const d2 = dx * dx + dy * dy;
    if (d2 > min * min) return false;
    let nx;
    let ny;
    let d = Math.sqrt(d2);
    if (d < 1e-6) {
      nx = 1;
      ny = 0;
      d = 0;
    } else {
      nx = dx / d;
      ny = dy / d;
    }
    const overlap = min - d;
    st.px += nx * overlap;
    st.py += ny * overlap;
    const rvx = st.vx - (ovx || 0);
    const rvy = st.vy - (ovy || 0);
    const vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      st.vx -= (1 + e) * vn * nx;
      st.vy -= (1 + e) * vn * ny;
      return { nx: nx, ny: ny, sp: -vn };
    }
    return false;
  }

  function hitRift(st) {
    for (let i = 0; i < st.rifts.length; i++) {
      const r = st.rifts[i];
      const d = hypot2(st.px - r.x, st.py - r.y);
      if (d < r.r + PR * 0.15) return r;
    }
    return null;
  }

  function hitExit(st) {
    return hypot2(st.px - st.exit.x, st.py - st.exit.y) < EXIT_R + PR * 0.2;
  }

  function collectGems(st) {
    let n = 0;
    for (let i = 0; i < st.gems.length; i++) {
      const g = st.gems[i];
      if (g.got) continue;
      if (hypot2(st.px - g.x, st.py - g.y) < GEM_R + PR + 2) {
        g.got = true;
        g.pop = 0.28;
        st.gemsGot += 1;
        st.runGems += 1;
        n += 1;
      }
    }
    return n;
  }

  function applyImpulse(st, nx, ny) {
    if (st.tapCd > 0 || st.lock > 0 || st.phase !== "play") return false;
    st.vx += nx * IMPULSE;
    st.vy += ny * IMPULSE;
    capSpeed(st);
    st.tapCd = TAP_CD;
    st.squash = 0.78;
    return true;
  }

  function stepPhysics(st, dir, dt) {
    if (st.phase !== "play") {
      st.phaseT += dt;
      if (st.phase === "die" && st.rift) {
        st.px = lerp(st.px, st.rift.x, 0.08);
        st.py = lerp(st.py, st.rift.y, 0.08);
        st.vx *= 0.9;
        st.vy *= 0.9;
      } else {
        st.vx *= 0.96;
        st.vy *= 0.96;
      }
      st.spin += hypot2(st.vx, st.vy) * 0.04;
      st.squash = lerp(st.squash, st.phase === "die" ? 0.2 : 1.15, 0.12);
      return null;
    }

    st.time += dt;
    st.remain -= dt;
    st.tapCd = Math.max(0, st.tapCd - dt);
    st.lock = Math.max(0, st.lock - dt);
    st.shake = Math.max(0, st.shake - dt * 18);
    st.squash = lerp(st.squash, 1, 1 - Math.pow(0.001, dt));

    if (dir && applyImpulse(st, dir.x, dir.y)) {
      st._tapped = dir;
    } else {
      st._tapped = null;
    }

    const damp = Math.exp(-MU * dt);
    st.vx *= damp;
    st.vy *= damp;
    const sp0 = hypot2(st.vx, st.vy);
    if (sp0 < 5.5 && !dir) {
      st.vx = 0;
      st.vy = 0;
    }

    st.px += st.vx * dt;
    st.py += st.vy * dt;
    st.spin += hypot2(st.vx, st.vy) * 0.035;

    const hits = [];
    for (let k = 0; k < 4; k++) {
      for (let i = 0; i < st.walls.length; i++) {
        const h = resolveAabb(st, st.walls[i]);
        if (h) hits.push(h);
      }
      for (let i = 0; i < st.posts.length; i++) {
        const h = resolvePost(st, st.posts[i], 0, 0, POST_REST);
        if (h) hits.push(h);
      }
      for (let i = 0; i < st.movers.length; i++) {
        const m = moverState(st.movers[i], st.time);
        const h = resolvePost(st, m, m.vx, m.vy, POST_REST);
        if (h) hits.push(h);
      }
    }
    capSpeed(st);
    st.px = clamp(st.px, WALL + PR - 2, VW - WALL - PR + 2);
    st.py = clamp(st.py, WALL + PR - 2, VH - WALL - PR + 2);

    const gems = collectGems(st);
    st._gems = gems;
    st._hits = hits;

    if (hitExit(st)) {
      st.won = true;
      st.phase = "clear";
      st.phaseT = 0;
      return "clear";
    }
    const rift = hitRift(st);
    if (rift) {
      st.rift = rift;
      st.why = "rift";
      st.phase = "die";
      st.phaseT = 0;
      return "die";
    }
    if (st.remain <= 0) {
      st.remain = 0;
      st.why = "time";
      st.phase = "die";
      st.phaseT = 0;
      return "die";
    }
    return null;
  }

  function greedyDir(st) {
    const s = STAGES[st.stageIndex];
    let tx = s.exit.x;
    let ty = s.exit.y;
    const sp = hypot2(st.vx, st.vy);

    if (st.stageIndex === 1 && st.py < 230) {
      tx = 860;
      ty = 110;
      if (st.px > 700) {
        tx = 820;
        ty = 400;
      }
    }
    if (st.stageIndex === 2) {
      if (st.px < 720) {
        tx = 860;
        ty = 96;
      } else {
        tx = 860;
        ty = 270;
      }
    }
    if (st.stageIndex === 4) {
      if (st.px < 300) {
        tx = st.py > 150 ? 92 : 400;
        ty = 86;
      } else if (st.px < 600) {
        tx = st.py < 390 ? 400 : 760;
        ty = st.py < 390 ? 460 : 456;
      } else if (st.py > 180) {
        tx = 868;
        ty = 92;
      }
    }

    let ax = tx - st.px;
    let ay = ty - st.py;
    const ad = hypot2(ax, ay) || 1;
    ax /= ad;
    ay /= ad;

    let steerX = 0;
    let steerY = 0;
    for (let i = 0; i < st.rifts.length; i++) {
      const r = st.rifts[i];
      const dx = st.px - r.x;
      const dy = st.py - r.y;
      const d = hypot2(dx, dy);
      const danger = r.r + 70;
      if (d < danger && d > 1) {
        const w = (danger - d) / danger;
        steerX += (dx / d) * w;
        steerY += (dy / d) * w;
      }
    }
    ax += steerX * 1.4;
    ay += steerY * 1.4;

    if (sp > 210) {
      const hx = st.vx / sp;
      const hy = st.vy / sp;
      const look = 90;
      const fx = st.px + hx * look;
      const fy = st.py + hy * look;
      for (let i = 0; i < st.rifts.length; i++) {
        const r = st.rifts[i];
        if (hypot2(fx - r.x, fy - r.y) < r.r + 36) {
          ax -= hx * 1.2;
          ay -= hy * 1.2;
        }
      }
    }

    const mag = hypot2(ax, ay);
    if (mag < 0.15) return null;
    if (sp > 300 && mag < 0.4) return { x: -st.vx / sp, y: -st.vy / sp };
    if (sp > 150) {
      const hx = st.vx / sp;
      const hy = st.vy / sp;
      const lookW = 110;
      const fx = st.px + hx * lookW;
      const fy = st.py + hy * lookW;
      if (fx < WALL + 36 || fx > VW - WALL - 36 || fy < WALL + 36 || fy > VH - WALL - 36) {
        return { x: -hx, y: -hy };
      }
    }
    return { x: ax / mag, y: ay / mag };
  }

  function simulateStage(index, maxTime) {
    const st = makeState(index, 9, 0);
    const limit = maxTime || 50;
    let t = 0;
    let taps = 0;
    while (t < limit && st.phase === "play") {
      const dir = greedyDir(st);
      if (dir && st.tapCd <= 0 && st.lock <= 0) taps += 1;
      stepPhysics(st, dir, STEP);
      t += STEP;
    }
    return {
      name: STAGES[index].name,
      won: st.phase === "clear" || st.won,
      why: st.why,
      t: Math.round(t * 10) / 10,
      taps: taps,
      gems: st.gemsGot,
      x: Math.round(st.px),
      y: Math.round(st.py)
    };
  }

  if (typeof document === "undefined") {
    STAGES.forEach(function (s, i) {
      if (!s.name || !s.sub || !s.spawn || !s.exit) throw new Error("stage " + i);
      if (s.time < 12) throw new Error("time " + i);
    });
    const results = STAGES.map(function (_, i) {
      return simulateStage(i, 55);
    });
    results.forEach(function (r) {
      console.log((r.won ? "OK" : "TRY") + " " + r.name + " t=" + r.t + " taps=" + r.taps + " gems=" + r.gems + " " + r.x + "," + r.y + (r.why ? " " + r.why : ""));
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
      console.log("ice-slide maps ok", STAGES.length);
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
  const gemLabel = document.getElementById("gem-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const padEl = document.getElementById("pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "点屏幕朝向轻点 · 或用左上右下 · 没有刹车";
    padEl.style.display = "flex";
  }

  const keys = { left: false, right: false, up: false, down: false };
  const pad = { left: false, right: false, up: false, down: false };
  const pointer = { down: false, x: 0, y: 0, wx: 0, wy: 0, id: null };

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };
  const stars = [];
  const grains = [];
  const cracks = [];
  const particles = [];
  const trail = [];
  const flakes = [];

  let mode = "title";
  let overlayKind = "title";
  let st = makeState(0);
  let toastT = 0;
  let flash = 0;
  let flashRgb = "0,240,255";
  let frozen = false;
  let tapFx = null;
  let acc = 0;
  let lastTs = 0;
  let paused = false;

  function burst(x, y, rgb, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = spd * (0.25 + Math.random());
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: 0.28 + Math.random() * 0.45,
        rgb: rgb,
        r: 1.1 + Math.random() * 2.4
      });
    }
  }

  function spark(x, y, nx, ny, rgb) {
    for (let i = 0; i < 8; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const s = 90 + Math.random() * 140;
      const px = nx + -ny * spread;
      const py = ny + nx * spread;
      particles.push({
        x: x,
        y: y,
        vx: px * s,
        vy: py * s,
        t: 0,
        life: 0.18 + Math.random() * 0.22,
        rgb: rgb,
        r: 1.2 + Math.random() * 1.8
      });
    }
  }

  function makeDecor() {
    stars.length = 0;
    grains.length = 0;
    cracks.length = 0;
    flakes.length = 0;
    const r = rng(42);
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: r() * VW,
        y: r() * VH,
        rr: r() * 1.3 + 0.25,
        a: r() * 0.4 + 0.08,
        p: r() * TAU
      });
    }
    for (let i = 0; i < 90; i++) {
      grains.push({
        x: WALL + r() * (VW - WALL * 2),
        y: WALL + r() * (VH - WALL * 2),
        rr: r() * 1.6 + 0.3,
        a: r() * 0.18 + 0.04
      });
    }
    for (let i = 0; i < 7; i++) {
      const x0 = WALL + 40 + r() * (VW - WALL * 2 - 80);
      const y0 = WALL + 40 + r() * (VH - WALL * 2 - 80);
      const segs = [];
      let x = x0;
      let y = y0;
      const ang = r() * TAU;
      const n = 3 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const len = 18 + r() * 46;
        const a = ang + (r() - 0.5) * 1.4;
        const x1 = x + Math.cos(a) * len;
        const y1 = y + Math.sin(a) * len;
        segs.push({ x: x, y: y, x1: x1, y1: y1 });
        x = x1;
        y = y1;
      }
      cracks.push(segs);
    }
    for (let i = 0; i < 18; i++) {
      flakes.push({
        x: r() * VW,
        y: r() * VH,
        s: 8 + r() * 18,
        a: r() * TAU,
        v: 4 + r() * 10,
        p: r() * TAU
      });
    }
  }
  makeDecor();

  const SFX = {
    ctx: null,
    master: null,
    skate: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.72;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.ensureSkate();
    },
    ensureSkate: function () {
      if (!this.ctx || this.skate) return;
      const n = Math.floor(this.ctx.sampleRate * 0.45);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1800;
      f.Q.value = 0.6;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
      this.skate = g;
      this.skateFilter = f;
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
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      g.connect(this.master);
      src.start();
    },
    tap: function () {
      this.ensure();
      this.beep(760, 0.07, "triangle", 0.045, 420);
      this.beep(180, 0.08, "sine", 0.03, 90);
    },
    bounce: function (sp) {
      this.ensure();
      const p = clamp(sp / 280, 0.3, 1);
      this.beep(210 + p * 90, 0.09, "sine", 0.035 * p, 90);
      this.noise(0.05, 0.04 * p);
    },
    gem: function () {
      this.ensure();
      this.beep(880, 0.1, "sine", 0.06, 1320);
      this.beep(1320, 0.16, "triangle", 0.04, 1760);
    },
    die: function () {
      this.ensure();
      this.noise(0.22, 0.1);
      this.beep(240, 0.5, "sawtooth", 0.07, 50);
    },
    clear: function () {
      this.ensure();
      this.beep(520, 0.12, "sine", 0.07, 780);
      const self = this;
      setTimeout(function () {
        self.beep(780, 0.18, "sine", 0.07, 1040);
      }, 80);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, "sine", 0.08, 660);
      const self = this;
      setTimeout(function () {
        self.beep(660, 0.18, "sine", 0.08, 880);
      }, 100);
      setTimeout(function () {
        self.beep(880, 0.32, "sine", 0.1, 1320);
      }, 210);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.14, "sine", 0.06, 440);
    },
    tickSkate: function (spd) {
      if (!this.skate || this.muted || !this.ctx) return;
      const v = spd > 28 ? Math.min(0.05, ((spd - 28) / 340) * 0.05) : 0;
      const t = this.ctx.currentTime;
      this.skate.gain.setTargetAtTime(v, t, 0.08);
      if (this.skateFilter) {
        this.skateFilter.frequency.setTargetAtTime(900 + spd * 3.2, t, 0.1);
      }
    },
    hushSkate: function () {
      if (!this.skate || !this.ctx) return;
      this.skate.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
    }
  };

  try {
    if (localStorage.getItem("ice-slide-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.72;
    if (m) SFX.hushSkate();
    syncMuteBtn();
    try {
      localStorage.setItem("ice-slide-mute", m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.55;
  }

  function renderHud() {
    if (mode === "title") {
      stageLabel.textContent = "没有刹车";
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
      gemLabel.textContent = "";
    } else {
      const s = STAGES[st.stageIndex];
      stageLabel.textContent = st.stageIndex + 1 + " / " + STAGES.length + "　" + s.name;
      const t = Math.max(0, st.remain);
      timeLabel.textContent = t.toFixed(1);
      timeLabel.classList.toggle("warn", t < 6.5 && mode === "play");
      gemLabel.textContent = "晶 " + st.runGems;
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
      ovKicker.textContent = "SLIDE";
      ovTitle.textContent = "冰面";
      ovLead.innerHTML = "没有刹车。轻点加速，反向轻点减速。<br />撞墙改向。滑进青色门，躲开品红裂口。";
      ovOps.textContent = coarse
        ? "点屏幕朝向轻点 · 或用左上右下 · 五关 · M 静音"
        : "WASD / 方向键轻点 · 点向目标方向 · M 静音";
      ovBtn.textContent = "上冰";
    } else if (kind === "lose") {
      ovKicker.textContent = "CRACK";
      ovTitle.textContent = "冰面吞没";
      const why = st.why === "time" ? "时限到了，惯性还在滑。" : "裂口没有刹车，也没有岸。";
      ovLead.textContent = why + " 晶石 " + st.runGems + "。再滑一次。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再滑一次";
    } else if (kind === "win") {
      ovKicker.textContent = "STILL";
      ovTitle.textContent = "全线滑过";
      ovLead.textContent = "没有刹车，你还是滑进了最后一道门。晶石 " + st.runGems + " / 9。";
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
    st.vx = 140;
    st.vy = 70;
    st.lock = 0;
    st.gems = [];
    st.rifts = [];
    st.exit = { x: -400, y: -400 };
    particles.length = 0;
    trail.length = 0;
    tapFx = null;
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "没有刹车 · 轻点加速 · 反向轻点减速 · 撞墙改向"
      : "没有刹车 · 轻点加速 · 反向轻点减速 · 撞墙改向";
  }

  function loadStage(i, lives, runGems) {
    mode = "play";
    st = makeState(i, lives, runGems);
    particles.length = 0;
    trail.length = 0;
    tapFx = null;
    flash = 0.32;
    flashRgb = "0,240,255";
    hideOverlay();
    renderHud();
    const s = STAGES[i];
    showToast(i + 1 + " / " + STAGES.length + "　" + s.name + " · " + s.hint);
    hintEl.textContent = coarse
      ? s.hint + " · 点屏幕或左上右下"
      : s.hint + " · WASD 轻点 · M 静音";
  }

  function onDieDone() {
    st.lives -= 1;
    if (st.lives <= 0) {
      mode = "lose";
      SFX.hushSkate();
      setOverlay("lose");
      renderHud();
      return;
    }
    const keep = st.runGems - st.gemsGot;
    loadStage(st.stageIndex, st.lives, keep);
    showToast(st.why === "time" ? "时限 · 还剩 " + st.lives + " 命" : "裂口 · 还剩 " + st.lives + " 命", true);
  }

  function onClearDone() {
    const next = st.stageIndex + 1;
    if (next >= STAGES.length) {
      mode = "win";
      SFX.hushSkate();
      SFX.win();
      setOverlay("win");
      renderHud();
      return;
    }
    loadStage(next, st.lives, st.runGems);
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

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: x,
      y: y,
      wx: (x - view.ox) / view.scale,
      wy: (y - view.oy) / view.scale
    };
  }

  function gatherDir() {
    let x = 0;
    let y = 0;
    if (keys.left || pad.left) x -= 1;
    if (keys.right || pad.right) x += 1;
    if (keys.up || pad.up) y -= 1;
    if (keys.down || pad.down) y += 1;
    if (pointer.down && pointer.id !== "pad") {
      const dx = pointer.wx - st.px;
      const dy = pointer.wy - st.py;
      const d = hypot2(dx, dy);
      if (d > 10) {
        x += dx / d;
        y += dy / d;
      }
    }
    const d = hypot2(x, y);
    if (d < 0.25) return null;
    return { x: x / d, y: y / d };
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

  function drawRink() {
    const ice = ctx.createLinearGradient(0, 0, VW, VH);
    ice.addColorStop(0, "#08101c");
    ice.addColorStop(0.45, "#0a1424");
    ice.addColorStop(1, "#0c0a1c");
    ctx.fillStyle = ice;
    drawRoundRect(WALL - 2, WALL - 2, VW - WALL * 2 + 4, VH - WALL * 2 + 4, 18);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    drawRoundRect(WALL, WALL, VW - WALL * 2, VH - WALL * 2, 16);
    ctx.clip();

    ctx.strokeStyle = "rgba(0,240,255,0.045)";
    ctx.lineWidth = 1;
    for (let x = WALL + 30; x < VW - WALL; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, WALL);
      ctx.lineTo(x, VH - WALL);
      ctx.stroke();
    }
    for (let y = WALL + 30; y < VH - WALL; y += 40) {
      ctx.beginPath();
      ctx.moveTo(WALL, y);
      ctx.lineTo(VW - WALL, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(WALL + 20, WALL + 40);
    ctx.lineTo(VW - 80, VH - 90);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(90, VH - 70);
    ctx.lineTo(VW - 40, 80);
    ctx.stroke();

    ctx.strokeStyle = "rgba(180,210,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < cracks.length; i++) {
      const segs = cracks[i];
      ctx.beginPath();
      for (let k = 0; k < segs.length; k++) {
        if (k === 0) ctx.moveTo(segs[k].x, segs[k].y);
        ctx.lineTo(segs[k].x1, segs[k].y1);
      }
      ctx.stroke();
    }

    for (let i = 0; i < grains.length; i++) {
      const g = grains[i];
      ctx.fillStyle = "rgba(210,230,255," + g.a + ")";
      ctx.fillRect(g.x, g.y, g.rr, g.rr);
    }

    const t = st.time;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      const x = (f.x + Math.sin(t * 0.3 + f.p) * 12) % VW;
      const y = (f.y + t * f.v) % VH;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.a + t * 0.2);
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "rgba(0,240,255,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-f.s * 0.5, 0);
      ctx.lineTo(f.s * 0.5, 0);
      ctx.moveTo(0, -f.s * 0.5);
      ctx.lineTo(0, f.s * 0.5);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawWalls() {
    for (let i = 0; i < st.walls.length; i++) {
      const w = st.walls[i];
      const edge = i < 4;
      ctx.save();
      if (edge) {
        ctx.fillStyle = "#12081a";
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = "rgba(0,240,255,0.22)";
        if (w.h <= WALL + 2) {
          const y = w.y < VH * 0.5 ? w.y + w.h - 2 : w.y;
          ctx.fillRect(w.x, y, w.w, 2);
        } else {
          const x = w.x < VW * 0.5 ? w.x + w.w - 2 : w.x;
          ctx.fillRect(x, w.y, 2, w.h);
        }
      } else {
        ctx.fillStyle = "#141028";
        drawRoundRect(w.x, w.y, w.w, w.h, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,240,255,0.42)";
        ctx.lineWidth = 1.4;
        drawRoundRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1, 6);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,61,184,0.18)";
        ctx.fillRect(w.x + 3, w.y + 3, Math.min(4, w.w - 6), w.h - 6);
      }
      ctx.restore();
    }
  }

  function drawPost(p, moving) {
    const pulse = 0.55 + Math.sin(st.time * 3.2 + p.x * 0.01) * 0.2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 8, 0, TAU);
    ctx.fillStyle = moving
      ? "rgba(255,61,184," + (0.1 + pulse * 0.08) + ")"
      : "rgba(0,240,255," + (0.08 + pulse * 0.06) + ")";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fillStyle = "#1a1630";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = moving ? "rgba(255,61,184,0.9)" : "rgba(0,240,255,0.85)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 0.45, 0, TAU);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawRifts() {
    for (let i = 0; i < st.rifts.length; i++) {
      const r = st.rifts[i];
      const swirl = st.time * 1.4 + i;
      ctx.save();
      const g = ctx.createRadialGradient(r.x, r.y, 2, r.x, r.y, r.r + 10);
      g.addColorStop(0, "rgba(8,0,14,0.95)");
      g.addColorStop(0.55, "rgba(40,4,28,0.85)");
      g.addColorStop(1, "rgba(255,61,184,0.0)");
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + 10, 0, TAU);
      ctx.fillStyle = g;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.fillStyle = "#05030c";
      ctx.fill();

      ctx.strokeStyle = "rgba(255,61,184,0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 7]);
      ctx.lineDashOffset = -swirl * 18;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r - 2, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "rgba(255,61,184,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * 0.55, swirl, swirl + Math.PI * 1.2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawExit() {
    const e = st.exit;
    const pulse = 0.7 + Math.sin(st.time * 3.4) * 0.3;
    ctx.save();
    ctx.beginPath();
    ctx.arc(e.x, e.y, EXIT_R + 16, 0, TAU);
    ctx.fillStyle = "rgba(0,240,255," + (0.07 + pulse * 0.05) + ")";
    ctx.fill();
    ctx.translate(e.x, e.y);
    ctx.rotate(st.time * 0.9);
    ctx.strokeStyle = "rgba(0,240,255,0.95)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, EXIT_R, 0, TAU);
    ctx.stroke();
    ctx.rotate(-st.time * 1.8);
    ctx.strokeStyle = "rgba(255,61,184,0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, EXIT_R - 8, 0.2, Math.PI + 0.2);
    ctx.stroke();
    ctx.rotate(st.time * 0.6);
    ctx.fillStyle = "rgba(0,240,255,0.85)";
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGems() {
    for (let i = 0; i < st.gems.length; i++) {
      const g = st.gems[i];
      if (g.got) {
        if (g.pop > 0) {
          g.pop -= 0.016;
          ctx.save();
          ctx.globalAlpha = Math.max(0, g.pop / 0.28);
          ctx.strokeStyle = "rgba(255,227,107,0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(g.x, g.y, GEM_R + (0.28 - g.pop) * 40, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
        continue;
      }
      const bob = Math.sin(st.time * 3 + i) * 2.2;
      const rot = st.time * 1.6 + i;
      ctx.save();
      ctx.translate(g.x, g.y + bob);
      ctx.shadowColor = "rgba(255,227,107,0.7)";
      ctx.shadowBlur = 12;
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -GEM_R - 1);
      ctx.lineTo(GEM_R * 0.7, 0);
      ctx.lineTo(0, GEM_R + 1);
      ctx.lineTo(-GEM_R * 0.7, 0);
      ctx.closePath();
      ctx.fillStyle = "#ffe36b";
      ctx.fill();
      ctx.fillStyle = "#fff7c2";
      ctx.beginPath();
      ctx.moveTo(0, -GEM_R * 0.45);
      ctx.lineTo(GEM_R * 0.28, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTrail() {
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const u = i / trail.length;
      ctx.beginPath();
      ctx.arc(t.x, t.y, PR * (0.35 + u * 0.5), 0, TAU);
      ctx.fillStyle = "rgba(0,240,255," + (0.05 + u * 0.16) + ")";
      ctx.fill();
    }
  }

  function drawGhost() {
    const sp = hypot2(st.vx, st.vy);
    if (sp < 40 || st.phase !== "play") return;
    ctx.save();
    for (let i = 1; i <= 4; i++) {
      const t = i * 0.12;
      ctx.globalAlpha = 0.1 * (1 - i / 5);
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(st.px + st.vx * t, st.py + st.vy * t, PR * (0.72 - i * 0.08), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    const sp = hypot2(st.vx, st.vy);
    const ang = Math.atan2(st.vy, st.vx);
    const sq = st.squash;
    const die = st.phase === "die" ? clamp(1 - st.phaseT / DIE_T, 0, 1) : 1;
    ctx.save();
    ctx.translate(st.px, st.py);
    ctx.globalAlpha = 0.35 + die * 0.65;
    ctx.rotate(sp > 12 ? ang : st.spin * 0.2);
    ctx.scale(lerp(1, 1.25, 1 - sq) * die, sq * die);

    ctx.beginPath();
    ctx.arc(0, 0, PR + 10, 0, TAU);
    ctx.fillStyle = "rgba(0,240,255,0.14)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, PR + 1, 0, TAU);
    ctx.fillStyle = "#0c2a36";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,240,255,0.95)";
    ctx.stroke();

    ctx.rotate(st.spin);
    ctx.beginPath();
    ctx.moveTo(0, -PR * 0.72);
    ctx.lineTo(PR * 0.55, 0);
    ctx.lineTo(0, PR * 0.72);
    ctx.lineTo(-PR * 0.55, 0);
    ctx.closePath();
    ctx.fillStyle = "#ff3db8";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(3, -1);
    ctx.lineTo(-1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (tapFx && tapFx.t > 0) {
      const u = tapFx.t / 0.2;
      ctx.save();
      ctx.globalAlpha = u * 0.8;
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2;
      const x2 = st.px + tapFx.nx * (18 + (1 - u) * 22);
      const y2 = st.py + tapFx.ny * (18 + (1 - u) * 22);
      ctx.beginPath();
      ctx.moveTo(st.px + tapFx.nx * 10, st.py + tapFx.ny * 10);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const px = -tapFx.ny;
      const py = tapFx.nx;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - tapFx.nx * 8 + px * 5, y2 - tapFx.ny * 8 + py * 5);
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - tapFx.nx * 8 - px * 5, y2 - tapFx.ny * 8 - py * 5);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const u = 1 - p.t / p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * u, 0, TAU);
      ctx.fillStyle = "rgba(" + p.rgb + "," + (0.15 + u * 0.7) + ")";
      ctx.fill();
    }
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
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + Math.sin(st.time * 1.5 + s.p) * 0.45;
      ctx.fillStyle = "rgba(230,236,255," + s.a * tw + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.rr, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    drawRink();
    drawRifts();
    drawExit();
    drawWalls();

    for (let i = 0; i < st.posts.length; i++) drawPost(st.posts[i], false);
    for (let i = 0; i < st.movers.length; i++) {
      drawPost(moverState(st.movers[i], st.time), true);
    }

    drawGems();
    drawTrail();
    drawGhost();
    drawParticles();
    if (mode !== "title" || overlayKind === "title") drawPlayer();

    const vig = ctx.createRadialGradient(VW * 0.5, VH * 0.48, 70, VW * 0.5, VH * 0.5, 560);
    vig.addColorStop(0, "rgba(5,3,12,0)");
    vig.addColorStop(1, "rgba(5,3,12,0.46)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VW, VH);

    if (flash > 0) {
      ctx.fillStyle = "rgba(" + flashRgb + "," + flash * 0.26 + ")";
      ctx.fillRect(0, 0, VW, VH);
    }

    if (paused && mode === "play") {
      ctx.fillStyle = "rgba(5,3,12,0.45)";
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#c9c6e8";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("暂停", VW * 0.5, VH * 0.5);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    if (mode === "play" || mode === "title") {
      trail.push({ x: st.px, y: st.py });
      if (trail.length > 16) trail.shift();
    }
  }

  function handleHits(hits) {
    let best = 0;
    let h0 = null;
    for (let i = 0; i < hits.length; i++) {
      if (hits[i].sp > best) {
        best = hits[i].sp;
        h0 = hits[i];
      }
    }
    if (h0 && best > 28) {
      SFX.bounce(best);
      st.shake = Math.min(10, best * 0.03);
      st.squash = 0.7;
      spark(st.px, st.py, h0.nx, h0.ny, best > 140 ? "255,61,184" : "0,240,255");
      if (mode === "play" && !st.taughtBank && best > 60) {
        st.taughtBank = true;
        showToast("撞墙改向");
      }
    }
  }

  function tick(dt) {
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }
    if (flash > 0) flash = Math.max(0, flash - dt * 1.8);
    if (tapFx) {
      tapFx.t -= dt;
      if (tapFx.t <= 0) tapFx = null;
    }

    if (paused && mode === "play") {
      SFX.hushSkate();
      return;
    }

    if (mode === "title") {
      st.lock = 0;
      st.tapCd = Math.max(0, st.tapCd - dt);
      if (st.tapCd <= 0 && Math.random() < 0.035) {
        const a = Math.random() * TAU;
        applyImpulse(st, Math.cos(a), Math.sin(a));
        st.phase = "play";
      }
      st.phase = "play";
      stepPhysics(st, null, dt);
      if (st._hits && st._hits.length) handleHits(st._hits);
      st.remain = STAGES[0].time;
      if (st.phase !== "play") {
        st.phase = "play";
        st.won = false;
        st.px = STAGES[0].spawn.x;
        st.py = STAGES[0].spawn.y;
        st.vx = 120;
        st.vy = 40;
      }
      for (let i = 0; i < st.gems.length; i++) st.gems[i].got = false;
      st.gemsGot = 0;
      st.runGems = 0;
      updateParticles(dt);
      SFX.tickSkate(hypot2(st.vx, st.vy) * 0.4);
      return;
    }

    if (mode !== "play") {
      updateParticles(dt);
      SFX.hushSkate();
      return;
    }

    if (frozen) return;

    const dir = gatherDir();
    const ev = stepPhysics(st, dir, dt);

    if (st._tapped) {
      tapFx = { nx: st._tapped.x, ny: st._tapped.y, t: 0.2 };
      burst(st.px - st._tapped.x * 10, st.py - st._tapped.y * 10, "0,240,255", 4, 70);
      SFX.tap();
      const sp = hypot2(st.vx, st.vy);
      if (!st.taughtSlow && sp > 240) {
        st.taughtSlow = true;
        showToast("反向轻点减速");
      }
    }
    if (st._gems) {
      SFX.gem();
      burst(st.px, st.py, "255,227,107", 10, 120);
      renderHud();
    }
    if (st._hits && st._hits.length) handleHits(st._hits);

    SFX.tickSkate(hypot2(st.vx, st.vy));
    updateParticles(dt);

    if (ev === "die") {
      SFX.die();
      flash = 0.55;
      flashRgb = "255,61,184";
      st.shake = 9;
      burst(st.px, st.py, "255,61,184", 22, 180);
      renderHud();
    } else if (ev === "clear") {
      SFX.clear();
      flash = 0.5;
      flashRgb = "0,240,255";
      burst(st.exit.x, st.exit.y, "0,240,255", 24, 160);
      renderHud();
    }

    if (st.phase === "die" && st.phaseT >= DIE_T) onDieDone();
    if (st.phase === "clear" && st.phaseT >= CLEAR_T) onClearDone();

    if (mode === "play" && st.phase === "play") {
      const t = Math.max(0, st.remain);
      timeLabel.textContent = t.toFixed(1);
      timeLabel.classList.toggle("warn", t < 6.5);
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
    SFX.start();
    loadStage(0, LIVES, 0);
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
  bindPad(btnUp, "up");
  bindPad(btnDown, "down");

  canvas.addEventListener("pointerdown", function (e) {
    if (frozen) return;
    e.preventDefault();
    const p = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.wx = p.wx;
    pointer.wy = p.wy;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
    SFX.ensure();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    const p = worldFromEvent(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.wx = p.wx;
    pointer.wy = p.wy;
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
    if (document.hidden) SFX.hushSkate();
  });
  window.addEventListener("resize", fit);

  loadTitle();
  fit();
  requestAnimationFrame(frame);
})();
