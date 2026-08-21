(() => {
  "use strict";

  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-yarn-ball-mute";
  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };
  const PUR = { r: 199, g: 125, b: 255 };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgb(c, a) {
    return a == null
      ? "rgb(" + c.r + "," + c.g + "," + c.b + ")"
      : "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function angNorm(a) {
    a = a % TAU;
    if (a < 0) a += TAU;
    return a;
  }

  const STAGES = [
    {
      name: "初绕",
      sub: "FIRST",
      time: 50,
      ball: 0.2,
      fence: 0.42,
      yarn: 0.03,
      nAng: 20,
      nRad: 1,
      need: 0.46,
      loops: 1,
      length: 6.4,
      hint: "拖着线绕球一圈，不要交叉",
      toast: "绕着球走，线不要碰上自己",
      hooks: [],
      thorns: []
    },
    {
      name: "贴层",
      sub: "LAYER",
      time: 50,
      ball: 0.2,
      fence: 0.44,
      yarn: 0.02,
      nAng: 28,
      nRad: 3,
      need: 0.54,
      loops: 1,
      length: 8.2,
      hint: "一层不够。贴着球，再扫外圈",
      toast: "内外都要扫到，轻轻旋开",
      hooks: [],
      thorns: []
    },
    {
      name: "金钉",
      sub: "HOOK",
      time: 52,
      ball: 0.19,
      fence: 0.45,
      yarn: 0.018,
      nAng: 32,
      nRad: 3,
      need: 0.5,
      loops: 1,
      length: 8.8,
      hint: "绕过三枚金钉，线要擦到它们",
      toast: "金钉要擦到才算绕上",
      hooks: [
        { a: -0.35, r: 0.34 },
        { a: 1.85, r: 0.36 },
        { a: 3.95, r: 0.33 }
      ],
      thorns: []
    },
    {
      name: "避刺",
      sub: "THORN",
      time: 50,
      ball: 0.19,
      fence: 0.45,
      yarn: 0.017,
      nAng: 32,
      nRad: 3,
      need: 0.56,
      loops: 1,
      length: 9.2,
      hint: "粉刺会割线。绕开它们",
      toast: "刺会割线，贴空档走",
      hooks: [
        { a: 0.4, r: 0.34 },
        { a: 3.5, r: 0.35 }
      ],
      thorns: [
        { a: 1.85, r: 0.37, rad: 0.034 },
        { a: 4.7, r: 0.37, rad: 0.034 }
      ]
    },
    {
      name: "双旋",
      sub: "SPIRAL",
      time: 56,
      ball: 0.175,
      fence: 0.46,
      yarn: 0.015,
      nAng: 36,
      nRad: 4,
      need: 0.68,
      loops: 2,
      length: 12.4,
      hint: "绕两圈，由外向内旋进",
      toast: "两圈才成团。别回头交叉",
      hooks: [],
      thorns: [{ a: 0.2, r: 0.41, rad: 0.03 }]
    },
    {
      name: "星钉",
      sub: "STAR",
      time: 56,
      ball: 0.18,
      fence: 0.46,
      yarn: 0.014,
      nAng: 40,
      nRad: 4,
      need: 0.62,
      loops: 1,
      length: 11.5,
      hint: "五钉绕星。贴钉走，别穿心",
      toast: "五枚金钉都要擦到",
      hooks: [
        { a: 0, r: 0.36 },
        { a: TAU / 5, r: 0.36 },
        { a: (2 * TAU) / 5, r: 0.36 },
        { a: (3 * TAU) / 5, r: 0.36 },
        { a: (4 * TAU) / 5, r: 0.36 }
      ],
      thorns: []
    },
    {
      name: "游刺",
      sub: "ORBIT",
      time: 60,
      ball: 0.175,
      fence: 0.47,
      yarn: 0.013,
      nAng: 40,
      nRad: 4,
      need: 0.7,
      loops: 2,
      length: 13.6,
      hint: "刺在转。看空档再绕",
      toast: "游刺会割已绕的线",
      hooks: [
        { a: 0.55, r: 0.32 },
        { a: 2.5, r: 0.4 },
        { a: 4.4, r: 0.33 }
      ],
      thorns: [
        { a: 0.15, r: 0.42, rad: 0.03, spin: 0.52 },
        { a: Math.PI, r: 0.3, rad: 0.026, spin: -0.38 }
      ]
    },
    {
      name: "密绕",
      sub: "DENSE",
      time: 62,
      ball: 0.165,
      fence: 0.47,
      yarn: 0.012,
      nAng: 44,
      nRad: 5,
      need: 0.76,
      loops: 2,
      length: 14.8,
      hint: "线更细，空隙要补满",
      toast: "细线密绕，留下的缝再补",
      hooks: [
        { a: 0.25, r: 0.3 },
        { a: 1.7, r: 0.4 },
        { a: 3.15, r: 0.31 },
        { a: 4.75, r: 0.39 }
      ],
      thorns: [
        { a: 0.95, r: 0.35, rad: 0.028 },
        { a: 4.05, r: 0.36, rad: 0.028 }
      ]
    },
    {
      name: "织壳",
      sub: "SHELL",
      time: 64,
      ball: 0.16,
      fence: 0.475,
      yarn: 0.011,
      nAng: 48,
      nRad: 5,
      need: 0.76,
      loops: 2,
      length: 16.2,
      hint: "六钉三刺。贴着球壳补满",
      toast: "先绕外圈钉子，再补内层",
      hooks: [
        { a: 0.1, r: 0.4 },
        { a: 1.15, r: 0.3 },
        { a: 2.2, r: 0.4 },
        { a: 3.25, r: 0.3 },
        { a: 4.3, r: 0.4 },
        { a: 5.35, r: 0.3 }
      ],
      thorns: [
        { a: 0.62, r: 0.35, rad: 0.027 },
        { a: 2.72, r: 0.35, rad: 0.027 },
        { a: 4.82, r: 0.35, rad: 0.027 }
      ]
    },
    {
      name: "终团",
      sub: "FINAL",
      time: 72,
      ball: 0.155,
      fence: 0.48,
      yarn: 0.01,
      nAng: 52,
      nRad: 5,
      need: 0.82,
      loops: 3,
      length: 18.5,
      hint: "三圈绕满。刺在内外游走",
      toast: "终团：三圈、六钉、游刺",
      hooks: [
        { a: 0.2, r: 0.29 },
        { a: 1.25, r: 0.41 },
        { a: 2.3, r: 0.3 },
        { a: 3.35, r: 0.41 },
        { a: 4.4, r: 0.3 },
        { a: 5.45, r: 0.41 }
      ],
      thorns: [
        { a: 0.7, r: 0.36, rad: 0.026, spin: 0.46 },
        { a: 2.8, r: 0.44, rad: 0.028, spin: -0.34 },
        { a: 4.5, r: 0.27, rad: 0.024, spin: 0.58 },
        { a: 5.9, r: 0.36, rad: 0.026 }
      ]
    }
  ];

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
  const hookLabel = document.getElementById("hook-label");
  const lenLabel = document.getElementById("len-label");
  const timeLabel = document.getElementById("time-label");
  const fillWrap = document.getElementById("fill-wrap");
  const fillBar = document.getElementById("fill-bar");
  const fillNum = document.getElementById("fill-num");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const btnUndo = document.getElementById("btn-undo");

  const view = { w: 1, h: 1, dpr: 1 };
  const board = { x: 0, y: 0, s: 100 };
  const keys = { u: false, d: false, l: false, r: false, z: false, undoBtn: false };
  const pointer = { down: false, x: 0.5, y: 0.8, id: null };
  const particles = [];
  const motes = [];
  const ripples = [];
  const path = [];

  const G = {
    mode: "title",
    phase: "play",
    phaseT: 0,
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 50,
    ball: 0.2,
    fence: 0.42,
    yarn: 0.03,
    inner: 0.22,
    outer: 0.4,
    nAng: 20,
    nRad: 1,
    need: 0.46,
    loops: 1,
    maxLen: 6.4,
    used: 0,
    nx: 0.5,
    ny: 0.8,
    vx: 0,
    vy: 0,
    spoolX: 0.5,
    spoolY: 0.8,
    lastA: 0,
    wind: 0,
    grid: [],
    filled: 0,
    total: 20,
    cover: 0,
    hooks: [],
    thorns: [],
    hinted: false,
    layerHint: false,
    toastT: 0,
    shake: 0,
    flash: 0,
    flashRgb: "255,61,184",
    lock: 0,
    near: 0,
    suck: 0,
    why: "",
    paused: false,
    teach: 1,
    paintTone: 0,
    snapX: 0.5,
    snapY: 0.5
  };

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    drone: null,
    droneGain: null,
    droneFilter: null,
    lastPaint: 0,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (err) {
        /* ignore */
      }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    pulse(kind) {
      this.ensure();
      if (kind === "paint") {
        this.beep(420 + G.cover * 280, 0.05, "triangle", 0.03, 640);
      } else if (kind === "hook") {
        this.beep(660, 0.12, "sine", 0.08, 990);
        this.beep(880, 0.18, "triangle", 0.05, 1320);
      } else if (kind === "cross") {
        this.beep(180, 0.22, "sawtooth", 0.09, 70);
        this.beep(90, 0.3, "square", 0.05, 40);
      } else if (kind === "thorn") {
        this.beep(140, 0.16, "square", 0.08, 55);
        this.beep(320, 0.1, "sawtooth", 0.04, 90);
      } else if (kind === "near") {
        this.beep(210, 0.04, "square", 0.02, 140);
      } else if (kind === "undo") {
        this.beep(520, 0.07, "triangle", 0.035, 260);
      } else if (kind === "clear") {
        this.beep(392, 0.12, "sine", 0.07, 523);
        this.beep(523, 0.2, "triangle", 0.06, 784);
        this.beep(784, 0.28, "sine", 0.05, 988);
      } else if (kind === "win") {
        this.beep(440, 0.16, "sine", 0.09, 660);
        this.beep(660, 0.26, "triangle", 0.07, 880);
        this.beep(880, 0.4, "sine", 0.05, 1320);
      } else if (kind === "lose") {
        this.beep(196, 0.28, "sawtooth", 0.07, 80);
        this.beep(130, 0.4, "triangle", 0.05, 60);
      } else if (kind === "tick") {
        this.beep(880, 0.06, "sine", 0.035);
      } else if (kind === "stage") {
        this.beep(392, 0.1, "sine", 0.055, 523);
        this.beep(523, 0.16, "triangle", 0.04, 659);
      } else if (kind === "empty") {
        this.beep(240, 0.18, "triangle", 0.05, 90);
      }
    },
    tickDrone(on, cover) {
      if (!this.ctx || this.muted) {
        if (this.droneGain) this.droneGain.gain.setTargetAtTime(0, this.ctx ? this.ctx.currentTime : 0, 0.08);
        return;
      }
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const f = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 110;
        f.type = "lowpass";
        f.frequency.value = 420;
        g.gain.value = 0;
        o.connect(f);
        f.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneFilter = f;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const vol = on ? 0.018 + cover * 0.03 : 0;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.08);
      this.drone.frequency.setTargetAtTime(96 + cover * 80, t, 0.12);
      this.droneFilter.frequency.setTargetAtTime(320 + cover * 500, t, 0.12);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (err) {
    /* ignore */
  }

  function wx(nx) {
    return board.x + nx * board.s;
  }
  function wy(ny) {
    return board.y + ny * board.s;
  }
  function nxOf(px) {
    return (px - board.x) / board.s;
  }
  function nyOf(py) {
    return (py - board.y) / board.s;
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2.25, window.devicePixelRatio || 1);
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    view.dpr = dpr;
    const bw = Math.floor(view.w * dpr);
    const bh = Math.floor(view.h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const pad = Math.max(16, Math.min(view.w, view.h) * 0.045);
    const s = Math.min(view.w, view.h) - pad * 2;
    board.s = Math.max(80, s);
    board.x = (view.w - board.s) * 0.5;
    board.y = (view.h - board.s) * 0.5;
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.6, 1.8),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        s: rand(5, 16)
      });
    }
  }

  function startPoint(r) {
    const a = Math.PI * 0.5;
    return { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r };
  }

  function hookPos(h) {
    return { x: 0.5 + Math.cos(h.a) * h.r, y: 0.5 + Math.sin(h.a) * h.r };
  }

  function thornPos(t) {
    return { x: 0.5 + Math.cos(t.a) * t.r, y: 0.5 + Math.sin(t.a) * t.r };
  }

  function constrain(x, y) {
    const dx = x - 0.5;
    const dy = y - 0.5;
    let r = hypot(dx, dy);
    const minR = G.ball + 0.014;
    const maxR = G.fence - 0.012;
    if (r < 1e-8) return { x: 0.5, y: 0.5 + minR };
    if (r < minR) {
      return { x: 0.5 + (dx / r) * minR, y: 0.5 + (dy / r) * minR };
    }
    if (r > maxR) {
      return { x: 0.5 + (dx / r) * maxR, y: 0.5 + (dy / r) * maxR };
    }
    return { x: x, y: y };
  }

  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    if (l2 < 1e-12) return hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / l2;
    t = clamp(t, 0, 1);
    return hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function segIntersect(a, b, c, d) {
    const d1x = b.x - a.x;
    const d1y = b.y - a.y;
    const d2x = d.x - c.x;
    const d2y = d.y - c.y;
    const den = d1x * d2y - d1y * d2x;
    if (den * den < 1e-20) return null;
    const t = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / den;
    const u = ((c.x - a.x) * d1y - (c.y - a.y) * d1x) / den;
    if (t > 0.03 && t < 0.97 && u > 0.03 && u < 0.97) {
      return { x: a.x + t * d1x, y: a.y + t * d1y };
    }
    return null;
  }

  function crosses(a, b) {
    const n = path.length;
    if (n < 8) return null;
    const skipEnd = 4;
    const skipStart = 1;
    const hi = n - skipEnd - 1;
    for (let i = skipStart; i < hi; i++) {
      const hit = segIntersect(path[i], path[i + 1], a, b);
      if (hit) return hit;
    }
    return null;
  }

  function nearYarn(x, y) {
    const n = path.length;
    if (n < 16) return 1;
    let best = 1;
    const lim = G.yarn * 1.35;
    const skip = 12;
    const step = n > 400 ? 3 : 1;
    for (let i = 0; i < n - skip; i += step) {
      const p = path[i];
      const d = hypot(x - p.x, y - p.y);
      if (d < best) best = d;
      if (best < lim * 0.35) return best;
    }
    return best;
  }

  function hitThornSeg(a, b) {
    for (let i = 0; i < G.thorns.length; i++) {
      const th = G.thorns[i];
      const p = thornPos(th);
      if (distSeg(p.x, p.y, a.x, a.y, b.x, b.y) < th.rad * 0.92) return p;
    }
    return null;
  }

  function thornCutsPath() {
    const n = path.length;
    if (n < 2) return null;
    const step = n > 500 ? 2 : 1;
    for (let t = 0; t < G.thorns.length; t++) {
      const th = G.thorns[t];
      const p = thornPos(th);
      const rad = th.rad * 0.9;
      for (let i = 0; i < n - 1; i += step) {
        const a = path[i];
        const b = path[i + 1];
        if (distSeg(p.x, p.y, a.x, a.y, b.x, b.y) < rad) return p;
      }
    }
    return null;
  }

  function paintPoint(x, y) {
    const dx = x - 0.5;
    const dy = y - 0.5;
    const r = hypot(dx, dy);
    if (r < G.inner - G.yarn * 0.25 || r > G.outer + G.yarn * 0.25) return 0;
    const ang = Math.atan2(dy, dx);
    const ia = (angNorm(ang) / TAU) * G.nAng;
    const ir = ((r - G.inner) / Math.max(1e-4, G.outer - G.inner)) * G.nRad;
    const ca = clamp(ia | 0, 0, G.nAng - 1);
    const cr = clamp(ir | 0, 0, G.nRad - 1);
    const cellA = TAU / G.nAng;
    const cellR = (G.outer - G.inner) / G.nRad;
    const reachA = (G.yarn * 0.5) / (Math.max(r, 0.08) * cellA) | 0;
    const reachR = (G.yarn * 0.42) / Math.max(cellR, 1e-4) | 0;
    let added = 0;
    for (let dr = -reachR; dr <= reachR; dr++) {
      const rr = cr + dr;
      if (rr < 0 || rr >= G.nRad) continue;
      for (let da = -reachA; da <= reachA; da++) {
        const aa = (ca + da + G.nAng * 8) % G.nAng;
        const idx = rr * G.nAng + aa;
        if (!G.grid[idx]) {
          G.grid[idx] = 1;
          G.filled++;
          added++;
        }
      }
    }
    return added;
  }

  function catchHooks(x, y) {
    let n = 0;
    for (let i = 0; i < G.hooks.length; i++) {
      const h = G.hooks[i];
      if (h.got) continue;
      const p = hookPos(h);
      if (hypot(x - p.x, y - p.y) < 0.036) {
        h.got = true;
        h.pulse = 1;
        n++;
        audio.pulse("hook");
        ripple(p.x, p.y, false);
        emit(14, {
          x: p.x,
          y: p.y,
          j: 8,
          vx0: -70,
          vx1: 70,
          vy0: -80,
          vy1: 30,
          life: 0.45,
          r0: 1,
          r1: 2.6,
          col: GOLD
        });
      }
    }
    return n;
  }

  function hooksLeft() {
    let n = 0;
    for (let i = 0; i < G.hooks.length; i++) if (!G.hooks[i].got) n++;
    return n;
  }

  function noteAngle(x, y) {
    const a = Math.atan2(y - 0.5, x - 0.5);
    if (G.lastA == null) {
      G.lastA = a;
      return;
    }
    let d = a - G.lastA;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    G.wind += d;
    G.lastA = a;
  }

  function rebuildFromPath() {
    G.grid = new Array(G.total);
    for (let i = 0; i < G.total; i++) G.grid[i] = 0;
    G.filled = 0;
    G.used = 0;
    G.wind = 0;
    G.lastA = null;
    G.hinted = false;
    G.layerHint = false;
    for (let i = 0; i < G.hooks.length; i++) G.hooks[i].got = false;
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (i > 0) G.used += hypot(p.x - path[i - 1].x, p.y - path[i - 1].y);
      noteAngle(p.x, p.y);
      paintPoint(p.x, p.y);
      for (let h = 0; h < G.hooks.length; h++) {
        const hk = G.hooks[h];
        if (hk.got) continue;
        const q = hookPos(hk);
        if (hypot(p.x - q.x, p.y - q.y) < 0.036) hk.got = true;
      }
    }
    G.cover = G.total ? G.filled / G.total : 0;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j) * 0.004,
        y: spec.y + rand(-spec.j, spec.j) * 0.004,
        vx: rand(spec.vx0, spec.vx1) * 0.01,
        vy: rand(spec.vy0, spec.vy1) * 0.01,
        life: spec.life * rand(0.55, 1),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col,
        g: spec.g || 0
      });
    }
  }

  function ripple(x, y, warn) {
    ripples.push({ x: x, y: y, t: 1, warn: !!warn });
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.1;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const cover = G.mode === "title" ? G.cover : G.cover;
    const need = G.need || 1;
    const bar = clamp(cover / need, 0, 1);
    fillBar.style.transform = "scaleX(" + bar + ")";
    fillNum.textContent = Math.floor(cover * 100 + 0.0001) + "%";
    fillWrap.classList.toggle("hot", cover >= need - 0.001 && G.mode !== "title");
    fillWrap.classList.toggle("warn", G.phase === "snap");
    if (G.mode === "title") {
      stageLabel.textContent = "绕线成团";
    } else {
      stageLabel.textContent = "第 " + (G.stage + 1) + " 团 · " + (st ? st.name : "");
    }
    const got = G.hooks.length - hooksLeft();
    hookLabel.textContent = G.hooks.length ? "钉 " + got + "/" + G.hooks.length : "钉 —";
    const left = clamp(1 - G.used / Math.max(G.maxLen, 0.001), 0, 1);
    lenLabel.textContent = G.mode === "title" ? "线 —" : "线 " + Math.floor(left * 100) + "%";
    lenLabel.classList.toggle("warn", G.mode === "play" && left < 0.22);
    if (G.mode === "play") {
      const t = Math.max(0, G.time);
      timeLabel.textContent = t.toFixed(1) + "s";
      timeLabel.classList.toggle("warn", t < 8);
    } else {
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
    }
    const html = [];
    for (let i = 0; i < LIVES; i++) {
      html.push(
        '<span class="pip' +
          (i < G.lives ? " on" : "") +
          (G.lives === 1 && i === 0 ? " warn" : "") +
          '"></span>'
      );
    }
    pipsEl.innerHTML = html.join("");
    if (st && G.mode === "play") hintEl.textContent = st.hint;
    else if (G.mode === "win") hintEl.textContent = "十团绕满 · 线没打结";
    else if (G.mode === "lose") hintEl.textContent = "线断了 · 再绕一球";
    else hintEl.textContent = "绕着球走 · 线不要交叉 · 绕满就成团";
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "YARN";
      ovTitle.textContent = "绕线";
      ovLead.innerHTML = "绕着球走，线不要交叉。<br />扫过金钉，绕满就收成一团。";
      ovOps.textContent = "拖拽绕线 · WASD / 方向键移动 · Z 回抽 · M 静音";
      ovBtn.textContent = "上手";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "FULL";
      ovTitle.textContent = "成团";
      ovLead.innerHTML = "十团绕满，线没打结。";
      ovOps.textContent = "回车再来一局 · M 静音";
      ovBtn.textContent = "再绕一球";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "SNAP";
      ovTitle.textContent = "线断";
      ovLead.innerHTML = G.why || "线交叉了。";
      ovOps.textContent = "回车再来一局 · M 静音";
      ovBtn.textContent = "再绕一球";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function resetPathAt(r) {
    const p = startPoint(r);
    path.length = 0;
    path.push({ x: p.x, y: p.y });
    G.nx = p.x;
    G.ny = p.y;
    G.spoolX = p.x;
    G.spoolY = p.y;
    G.vx = 0;
    G.vy = 0;
    G.used = 0;
    G.wind = 0;
    G.lastA = Math.atan2(p.y - 0.5, p.x - 0.5);
    G.suck = 0;
  }

  function loadStage(idx, msg, warn) {
    const st = STAGES[idx];
    G.stage = idx;
    G.mode = "play";
    G.phase = "play";
    G.phaseT = 0;
    G.time = st.time;
    G.ball = st.ball;
    G.fence = st.fence;
    G.yarn = st.yarn;
    G.inner = st.ball + 0.02;
    G.outer = st.fence - 0.018;
    G.nAng = st.nAng;
    G.nRad = st.nRad;
    G.need = st.need;
    G.loops = st.loops;
    G.maxLen = st.length;
    G.total = st.nAng * st.nRad;
    G.grid = new Array(G.total);
    for (let i = 0; i < G.total; i++) G.grid[i] = 0;
    G.filled = 0;
    G.cover = 0;
    G.hinted = false;
    G.layerHint = false;
    G.lock = 0;
    G.near = 0;
    G.teach = idx === 0 ? 1 : 0;
    G.why = "";
    G.hooks = st.hooks.map(function (h) {
      return { a: h.a, r: h.r, got: false, pulse: 0 };
    });
    G.thorns = st.thorns.map(function (t) {
      return { a: t.a, r: t.r, rad: t.rad, spin: t.spin || 0 };
    });
    resetPathAt((st.ball + st.fence) * 0.5);
    hideOverlay();
    if (msg) toast(msg, warn);
    else toast(st.toast);
    audio.pulse("stage");
    syncHud();
  }

  function startRun() {
    G.lives = LIVES;
    loadStage(0);
  }

  function retryStage() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      startRun();
      return;
    }
    loadStage(G.stage, "重绕本关", false);
  }

  function winReady() {
    if (G.cover + 1e-6 < G.need) return false;
    if (hooksLeft() > 0) return false;
    if (Math.abs(G.wind) < G.loops * TAU * 0.94) return false;
    return true;
  }

  function maybeHint() {
    if (G.cover >= G.need) {
      if (!G.hinted) {
        G.hinted = true;
        if (hooksLeft() > 0) toast("还有金钉没绕到", true);
        else if (Math.abs(G.wind) < G.loops * TAU * 0.94) toast("再绕一圈", true);
      }
    } else if (!G.layerHint && Math.abs(G.wind) >= TAU * 0.94) {
      G.layerHint = true;
      toast("换一层再绕，空隙还在");
    }
  }

  function beginClear() {
    if (G.phase !== "play") return;
    G.phase = "clear";
    G.phaseT = 0;
    G.flash = 0.42;
    G.flashRgb = "0,240,255";
    G.cover = Math.max(G.cover, G.need);
    audio.pulse("clear");
    toast("成团");
    ripple(0.5, 0.5, false);
    emit(28, {
      x: 0.5,
      y: 0.5,
      j: 18,
      vx0: -90,
      vx1: 90,
      vy0: -90,
      vy1: 50,
      life: 0.7,
      r0: 1.2,
      r1: 3.2,
      col: mix(CYN, GOLD, 0.4)
    });
    syncHud();
  }

  function beginFail(kind, at) {
    if (G.phase !== "play") return;
    G.phase = kind === "time" ? "timeout" : "snap";
    G.phaseT = 0;
    G.flash = 0.55;
    G.flashRgb = "255,61,184";
    G.shake = 0.48;
    G.lock = 1;
    if (at) {
      G.snapX = at.x;
      G.snapY = at.y;
    } else {
      G.snapX = G.nx;
      G.snapY = G.ny;
    }
    const map = {
      cross: "线交叉了",
      thorn: "粉刺割断了线",
      empty: "线用尽了",
      time: "时间到"
    };
    G.why = map[kind] || "线断了";
    audio.pulse(kind === "thorn" ? "thorn" : kind === "empty" ? "empty" : kind === "time" ? "tick" : "cross");
    toast(G.why, true);
    emit(26, {
      x: G.snapX,
      y: G.snapY,
      j: 12,
      vx0: -140,
      vx1: 140,
      vy0: -140,
      vy1: 60,
      life: 0.65,
      r0: 1.2,
      r1: 3.4,
      col: MAG
    });
    ripple(G.snapX, G.snapY, true);
    syncHud();
  }

  function failOrRetry() {
    G.lives -= 1;
    if (G.lives <= 0) {
      G.mode = "lose";
      G.phase = "play";
      audio.pulse("lose");
      showOverlay("lose");
      syncHud();
      return;
    }
    const msg =
      G.phase === "timeout"
        ? "超时 −1 命 · 重绕本关"
        : G.why + " −1 命 · 重绕本关";
    loadStage(G.stage, msg, true);
  }

  function winOrNext() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      G.phase = "play";
      audio.pulse("win");
      showOverlay("win");
      syncHud();
      return;
    }
    loadStage(G.stage + 1);
  }

  function advanceTo(x, y) {
    const last = path[path.length - 1];
    const dx = x - last.x;
    const dy = y - last.y;
    const d = hypot(dx, dy);
    if (d < 0.0036) {
      G.nx = x;
      G.ny = y;
      return true;
    }
    if (G.used + d > G.maxLen + 0.01) {
      beginFail("empty", { x: x, y: y });
      return false;
    }
    const hit = crosses(last, { x: x, y: y });
    if (hit) {
      beginFail("cross", hit);
      return false;
    }
    const th = hitThornSeg(last, { x: x, y: y });
    if (th) {
      beginFail("thorn", th);
      return false;
    }
    path.push({ x: x, y: y });
    G.used += d;
    G.nx = x;
    G.ny = y;
    noteAngle(x, y);
    const added = paintPoint(x, y);
    G.cover = G.total ? G.filled / G.total : 0;
    catchHooks(x, y);
    if (added > 0 && G.t - audio.lastPaint > 0.08) {
      audio.lastPaint = G.t;
      audio.pulse("paint");
    }
    if (winReady()) beginClear();
    else maybeHint();
    return G.phase === "play";
  }

  function moveAlong(x1, y1) {
    const x0 = G.nx;
    const y0 = G.ny;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = hypot(dx, dy);
    if (dist < 1e-6) return true;
    const step = 0.0075;
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= n; i++) {
      const c = constrain(x0 + (dx * i) / n, y0 + (dy * i) / n);
      if (!advanceTo(c.x, c.y)) return false;
    }
    return true;
  }

  function rewind(dt) {
    if (path.length <= 1) return;
    const n = Math.max(1, Math.ceil(dt * 96));
    path.length = Math.max(1, path.length - n);
    const last = path[path.length - 1];
    G.nx = last.x;
    G.ny = last.y;
    rebuildFromPath();
    if (((G.clock * 12) | 0) !== (((G.clock - dt) * 12) | 0)) audio.pulse("undo");
  }

  function updateThorns(dt) {
    for (let i = 0; i < G.thorns.length; i++) {
      const t = G.thorns[i];
      if (t.spin) t.a = angNorm(t.a + t.spin * dt);
    }
  }

  function updateTitle(dt) {
    G.t += dt;
    const cycle = 7.6;
    const u = (G.t % cycle) / cycle;
    const a = Math.PI * 0.5 + G.t * 1.12;
    const r = lerp(0.38, 0.24, ease(u));
    const x = 0.5 + Math.cos(a) * r;
    const y = 0.5 + Math.sin(a) * r;
    if (u < 0.018 && path.length > 8) {
      path.length = 0;
      path.push({ x: x, y: y });
    }
    const last = path[path.length - 1];
    if (!last || hypot(x - last.x, y - last.y) > 0.01) path.push({ x: x, y: y });
    if (path.length > 520) path.splice(0, path.length - 420);
    G.nx = x;
    G.ny = y;
    G.cover = 0.22 + 0.7 * u;
    G.ball = 0.2;
    G.fence = 0.44;
    G.yarn = 0.022;
    G.inner = 0.22;
    G.outer = 0.42;
  }

  function updatePlay(dt) {
    if (G.phase === "play") {
      const prev = G.time;
      G.time -= dt;
      if (G.time < 5.05 && prev >= 5.05) audio.pulse("tick");
      if (G.time < 3.05 && prev >= 3.05) audio.pulse("tick");
      if (G.time < 1.05 && prev >= 1.05) audio.pulse("tick");
      if (G.time <= 0) {
        G.time = 0;
        beginFail("time");
        return;
      }
      updateThorns(dt);
      const cut = thornCutsPath();
      if (cut) {
        beginFail("thorn", cut);
        return;
      }

      const rewinding = keys.z || keys.undoBtn;
      btnUndo.classList.toggle("held", rewinding);
      if (rewinding) {
        rewind(dt);
        return;
      }

      if (pointer.down) {
        const t = constrain(pointer.x, pointer.y);
        moveAlong(t.x, t.y);
      } else {
        let ax = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
        let ay = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
        if (ax || ay) {
          const m = hypot(ax, ay) || 1;
          ax /= m;
          ay /= m;
          const speed = 0.4;
          const t = constrain(G.nx + ax * speed * dt, G.ny + ay * speed * dt);
          moveAlong(t.x, t.y);
        }
      }

      const dNear = nearYarn(G.nx, G.ny);
      const was = G.near;
      G.near = dNear < G.yarn * 0.9 ? 1 : lerp(G.near, 0, 1 - Math.exp(-8 * dt));
      if (dNear < G.yarn * 0.55 && was < 0.4) audio.pulse("near");
    } else if (G.phase === "clear") {
      G.phaseT += dt;
      G.suck = ease(clamp(G.phaseT / 0.85, 0, 1));
      G.cover = lerp(G.cover, 1, 1 - Math.exp(-3 * dt));
      if (G.phaseT > 1.05) winOrNext();
    } else if (G.phase === "snap" || G.phase === "timeout") {
      G.phaseT += dt;
      if (G.phaseT > 1.05) failOrRetry();
    }
  }

  function stepFx(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.2);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    for (let i = 0; i < G.hooks.length; i++) {
      if (G.hooks[i].pulse > 0) G.hooks[i].pulse = Math.max(0, G.hooks[i].pulse - dt / 0.28);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vy += (p.g || 0.35) * dt * 0.01;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].t -= dt * 1.6;
      if (ripples[i].t <= 0) ripples.splice(i, 1);
    }
  }

  function tick(dt) {
    if (G.paused) {
      audio.tickDrone(false, 0);
      stepFx(dt);
      return;
    }
    if (G.mode === "title") updateTitle(dt);
    else if (G.mode === "play") updatePlay(dt);
    audio.tickDrone(G.mode === "play" && G.phase === "play", G.cover);
    stepFx(dt);
    if (((G.clock * 8) | 0) !== (((G.clock - dt) * 8) | 0)) syncHud();
  }

  function strokePts(pts, suck) {
    if (pts.length < 2) return;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      let x = pts[i].x;
      let y = pts[i].y;
      if (suck > 0) {
        const dx = x - 0.5;
        const dy = y - 0.5;
        const r = hypot(dx, dy) || 1;
        const nr = lerp(r, G.ball * 0.9, suck);
        x = 0.5 + (dx / r) * nr;
        y = 0.5 + (dy / r) * nr;
      }
      if (i === 0) ctx.moveTo(wx(x), wy(y));
      else ctx.lineTo(wx(x), wy(y));
    }
    ctx.stroke();
  }

  function drawYarn(pts, width, suck) {
    if (pts.length < 2) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = rgb(MAG, 0.22);
    ctx.lineWidth = width * 2.4;
    ctx.shadowColor = rgb(MAG, 0.55);
    ctx.shadowBlur = 14;
    strokePts(pts, suck);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgb(mix(MAG, CYN, 0.28), 0.95);
    ctx.lineWidth = width;
    strokePts(pts, suck);
    ctx.strokeStyle = rgb(INK, 0.55);
    ctx.lineWidth = width * 0.32;
    strokePts(pts, suck);
  }

  function drawBall(cx, cy, R, cover, time) {
    const grd = ctx.createRadialGradient(
      cx - R * 0.32,
      cy - R * 0.38,
      R * 0.08,
      cx,
      cy + R * 0.1,
      R
    );
    grd.addColorStop(0, "rgba(58, 32, 72, 0.95)");
    grd.addColorStop(0.45, "rgba(18, 10, 28, 0.96)");
    grd.addColorStop(1, "rgba(6, 3, 14, 1)");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.98, 0, TAU);
    ctx.clip();
    const wraps = 5 + Math.floor(cover * 14);
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < wraps; i++) {
      const a = i * 0.61 + time * 0.08;
      const tilt = 0.22 + (i % 7) * 0.05;
      const col = i % 3 === 0 ? MAG : i % 3 === 1 ? CYN : GOLD;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.92, R * tilt, a, 0, TAU);
      ctx.strokeStyle = rgb(col, 0.08 + cover * 0.22);
      ctx.lineWidth = Math.max(1.2, R * 0.035);
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx - R * 0.28, cy - R * 0.32, R * 0.22, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.strokeStyle = rgb(mix(MAG, CYN, 0.45 + 0.4 * cover), 0.55 + cover * 0.35);
    ctx.lineWidth = 2.2;
    ctx.shadowColor = rgb(cover > 0.7 ? GOLD : CYN, 0.5);
    ctx.shadowBlur = 12 + cover * 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.18, 0, TAU);
    ctx.fillStyle = rgb(mix(MAG, GOLD, cover), 0.18 + cover * 0.35);
    ctx.fill();
  }

  function drawTicks() {
    if (G.mode !== "play" || !G.grid.length) return;
    const nA = G.nAng;
    const nR = G.nRad;
    for (let ir = 0; ir < nR; ir++) {
      const r = G.inner + ((ir + 0.5) / nR) * (G.outer - G.inner);
      for (let ia = 0; ia < nA; ia++) {
        const a = ((ia + 0.5) / nA) * TAU;
        const filled = G.grid[ir * nA + ia];
        const x = wx(0.5 + Math.cos(a) * r);
        const y = wy(0.5 + Math.sin(a) * r);
        ctx.beginPath();
        ctx.arc(x, y, filled ? 1.7 : 1.15, 0, TAU);
        ctx.fillStyle = filled
          ? rgb(mix(MAG, CYN, (ia % 5) / 5), 0.55)
          : "rgba(139,144,184,0.16)";
        ctx.fill();
      }
    }
  }

  function drawThorns(time) {
    for (let i = 0; i < G.thorns.length; i++) {
      const t = G.thorns[i];
      const p = thornPos(t);
      const x = wx(p.x);
      const y = wy(p.y);
      const rad = t.rad * board.s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t.a + time * (t.spin ? 2.4 : 0.6));
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = (k * TAU) / 3;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = rgb(MAG, 0.92);
      ctx.shadowColor = rgb(MAG, 0.8);
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = rgb(INK, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHooks(time) {
    for (let i = 0; i < G.hooks.length; i++) {
      const h = G.hooks[i];
      const p = hookPos(h);
      const x = wx(p.x);
      const y = wy(p.y);
      const rad = 0.026 * board.s * (1 + h.pulse * 0.35);
      ctx.beginPath();
      ctx.arc(x, y, rad * 1.85, 0, TAU);
      ctx.fillStyle = rgb(GOLD, h.got ? 0.12 : 0.06 + Math.sin(time * 4 + i) * 0.03);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, TAU);
      ctx.strokeStyle = rgb(GOLD, h.got ? 0.95 : 0.7);
      ctx.lineWidth = h.got ? 3.1 : 2;
      ctx.shadowColor = rgb(GOLD, 0.7);
      ctx.shadowBlur = h.got ? 12 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (h.got) {
        ctx.beginPath();
        ctx.arc(x, y, rad * 0.34, 0, TAU);
        ctx.fillStyle = rgb(GOLD, 0.95);
        ctx.fill();
      } else {
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -time * 22;
        ctx.beginPath();
        ctx.arc(x, y, rad * 1.45, 0, TAU);
        ctx.strokeStyle = rgb(GOLD, 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawNeedle(time) {
    const x = wx(G.nx);
    const y = wy(G.ny);
    const ang = Math.atan2(G.ny - 0.5, G.nx - 0.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(7, board.s * 0.016), 0, TAU);
    ctx.fillStyle = rgb(CYN, 0.12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(5.5, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5.5, 7);
    ctx.closePath();
    ctx.fillStyle = rgb(mix(CYN, INK, 0.15), 0.95);
    ctx.shadowColor = rgb(CYN, 0.8);
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 2.2, 2.3, 0, TAU);
    ctx.strokeStyle = rgb(MAG, 0.9);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    if (G.near > 0.25 && G.phase === "play") {
      ctx.beginPath();
      ctx.arc(x, y, 16 + Math.sin(time * 14) * 3, 0, TAU);
      ctx.strokeStyle = rgb(MAG, 0.35 * G.near);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawSpool() {
    const x = wx(G.spoolX);
    const y = wy(G.spoolY);
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6, 0.2, 0, TAU);
    ctx.fillStyle = "#1a1028";
    ctx.fill();
    ctx.strokeStyle = rgb(MAG, 0.8);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.2, 2.6, 0.2, 0, TAU);
    ctx.strokeStyle = rgb(CYN, 0.7);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function drawTeach(time) {
    if (!G.teach || G.stage !== 0 || path.length > 90) return;
    const r = (G.ball + G.fence) * 0.5;
    ctx.save();
    ctx.setLineDash([8, 10]);
    ctx.lineDashOffset = -time * 26;
    ctx.beginPath();
    ctx.arc(wx(0.5), wy(0.5), r * board.s, 0, TAU);
    ctx.strokeStyle = rgb(GOLD, 0.28);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);
    const a = Math.PI * 0.5 + time * 1.4;
    const gx = wx(0.5 + Math.cos(a) * r);
    const gy = wy(0.5 + Math.sin(a) * r);
    ctx.beginPath();
    ctx.arc(gx, gy, 5, 0, TAU);
    ctx.fillStyle = rgb(GOLD, 0.45 + Math.sin(time * 6) * 0.15);
    ctx.fill();
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const k = 1 - r.t;
      ctx.beginPath();
      ctx.arc(wx(r.x), wy(r.y), (0.04 + k * 0.12) * board.s, 0, TAU);
      ctx.strokeStyle = rgb(r.warn ? MAG : CYN, r.t * 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r, 0, TAU);
      ctx.fillStyle = rgb(p.col, a * 0.9);
      ctx.fill();
    }
  }

  function draw() {
    layout();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, view.w, view.h);

    const g1 = ctx.createRadialGradient(
      view.w * 0.18,
      view.h * 0.08,
      0,
      view.w * 0.18,
      view.h * 0.08,
      view.w * 0.55
    );
    g1.addColorStop(0, "rgba(255,61,184,0.08)");
    g1.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, view.w, view.h);
    const g2 = ctx.createRadialGradient(
      view.w * 0.86,
      view.h * 0.12,
      0,
      view.w * 0.86,
      view.h * 0.12,
      view.w * 0.5
    );
    g2.addColorStop(0, "rgba(0,240,255,0.07)");
    g2.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, view.w, view.h);

    ctx.save();
    if (G.shake > 0) {
      const j = G.shake * 7;
      ctx.translate((Math.random() - 0.5) * j, (Math.random() - 0.5) * j);
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = board.x + ((m.x + Math.sin(G.t * 0.12 + m.p) * 0.03) * board.s);
      const y = board.y + ((m.y + Math.cos(G.t * 0.1 + m.p) * 0.03) * board.s);
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fillStyle = rgb(i % 2 ? CYN : MAG, m.a);
      ctx.fill();
    }

    const cx = wx(0.5);
    const cy = wy(0.5);
    const fencePx = G.fence * board.s;
    const ballPx = G.ball * board.s;

    ctx.beginPath();
    ctx.arc(cx, cy, fencePx, 0, TAU);
    ctx.fillStyle = "rgba(10, 6, 22, 0.55)";
    ctx.fill();

    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -G.t * 18;
    ctx.beginPath();
    ctx.arc(cx, cy, fencePx, 0, TAU);
    ctx.strokeStyle = rgb(CYN, 0.28);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(cx, cy, G.outer * board.s, 0, TAU);
    ctx.strokeStyle = rgb(PUR, 0.12);
    ctx.lineWidth = 1;
    ctx.stroke();

    drawTicks();
    drawBall(cx, cy, ballPx, clamp(G.cover / Math.max(G.need, 0.001), 0, 1.15), G.t);
    drawTeach(G.t);
    drawThorns(G.t);
    drawYarn(path, Math.max(3.2, G.yarn * board.s), G.suck);
    drawHooks(G.t);
    if (G.mode !== "title") drawSpool();
    drawNeedle(G.t);
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = "rgba(" + G.flashRgb + "," + G.flash * 0.18 + ")";
      ctx.fillRect(0, 0, view.w, view.h);
    }

    ctx.restore();
  }

  function eventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src =
      e.touches && e.touches[0]
        ? e.touches[0]
        : e.changedTouches && e.changedTouches[0]
          ? e.changedTouches[0]
          : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (G.mode !== "play" || G.phase !== "play") return;
    audio.ensure();
    const p = eventPos(e);
    pointer.down = true;
    pointer.x = nxOf(p.x);
    pointer.y = nyOf(p.y);
    pointer.id = e.pointerId;
    if (e.pointerId != null && canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
    }
    e.preventDefault();
  }

  function onMove(e) {
    const p = eventPos(e);
    if (!pointer.down) {
      pointer.x = nxOf(p.x);
      pointer.y = nyOf(p.y);
      return;
    }
    pointer.x = nxOf(p.x);
    pointer.y = nyOf(p.y);
    e.preventDefault();
  }

  function onUp() {
    pointer.down = false;
    pointer.id = null;
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  window.addEventListener("keydown", function (e) {
    const key = e.key;
    if (key === "m" || key === "M") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (key === "r" || key === "R") {
      retryStage();
      e.preventDefault();
      return;
    }
    if (key === "ArrowLeft" || key === "a" || key === "A") keys.l = true;
    else if (key === "ArrowRight" || key === "d" || key === "D") keys.r = true;
    else if (key === "ArrowUp" || key === "w" || key === "W") keys.u = true;
    else if (key === "ArrowDown" || key === "s" || key === "S") keys.d = true;
    else if (key === "z" || key === "Z") keys.z = true;

    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (key === "Enter" || key === " ") {
        audio.ensure();
        startRun();
        e.preventDefault();
      }
      return;
    }
    if (
      key === "ArrowLeft" || key === "a" || key === "A" ||
      key === "ArrowRight" || key === "d" || key === "D" ||
      key === "ArrowUp" || key === "w" || key === "W" ||
      key === "ArrowDown" || key === "s" || key === "S" ||
      key === "z" || key === "Z"
    ) {
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", function (e) {
    const key = e.key;
    if (key === "ArrowLeft" || key === "a" || key === "A") keys.l = false;
    else if (key === "ArrowRight" || key === "d" || key === "D") keys.r = false;
    else if (key === "ArrowUp" || key === "w" || key === "W") keys.u = false;
    else if (key === "ArrowDown" || key === "s" || key === "S") keys.d = false;
    else if (key === "z" || key === "Z") keys.z = false;
  });

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function () {
    retryStage();
  });
  btnUndo.addEventListener("pointerdown", function (e) {
    if (G.mode !== "play") return;
    audio.ensure();
    keys.undoBtn = true;
    btnUndo.classList.add("held");
    if (e.pointerId != null && btnUndo.setPointerCapture) {
      try {
        btnUndo.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
    }
    e.preventDefault();
  });
  function endUndoBtn() {
    keys.undoBtn = false;
    btnUndo.classList.remove("held");
  }
  btnUndo.addEventListener("pointerup", endUndoBtn);
  btnUndo.addEventListener("pointercancel", endUndoBtn);

  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (G.paused) audio.tickDrone(false, 0);
  });

  window.addEventListener("resize", function () {
    layout();
  });

  seedMotes();
  resetPathAt(0.36);
  G.ball = 0.2;
  G.fence = 0.44;
  G.yarn = 0.022;
  showOverlay("title");
  syncHud();
  layout();

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    while (acc >= STEP) {
      tick(STEP);
      acc -= STEP;
    }
    draw();
  }
  requestAnimationFrame(frame);
})();
