(() => {
  "use strict";

  const WORLD_W = 960;
  const WORLD_H = 540;
  const PAD = 30;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const PLAYER_R = 13;
  const GHOST_R = 20;
  const BOLT_R = 6.4;
  const SPEED = 232;
  const TAPE_SEC = 3;
  const EXIT_R = 30;
  const IFR = 0.92;
  const MUTE_KEY = "playbox-mini-rewind-mute";
  const MAG = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const INK = "#f6f3ff";

  const STAGES = [
    {
      name: "初带",
      sub: "TRACE",
      hint: "走满三秒 · 按住倒带，把旧自己留在光束上",
      toast: "先走动，把磁带录满三秒",
      tapes: 2,
      lives: 3,
      ghostHp: 64,
      spawn: { x: 96, y: 100 },
      exit: { x: 848, y: 270 },
      walls: [
        { x: 248, y: 30, w: 22, h: 96 }
      ],
      emitters: [
        { kind: "aimed", x: 910, y: 470, period: 0.9, speed: 168, warmup: 6.2 }
      ],
      lasers: [
        { x: 36, y: 270, ang: 0, len: 888, width: 12, rot: 0 }
      ]
    },
    {
      name: "交切",
      sub: "CROSS",
      hint: "横束竖束切成四格，各留一个旧自己",
      toast: "残影能截断光束。先挡一条，再挡一条",
      tapes: 3,
      lives: 3,
      ghostHp: 56,
      spawn: { x: 96, y: 96 },
      exit: { x: 848, y: 444 },
      walls: [
        { x: 30, y: 248, w: 96, h: 16 },
        { x: 834, y: 276, w: 96, h: 16 }
      ],
      emitters: [
        { kind: "aimed", x: 900, y: 96, period: 0.78, speed: 186, warmup: 4.4 }
      ],
      lasers: [
        { x: 36, y: 270, ang: 0, len: 888, width: 11, rot: 0 },
        { x: 480, y: 36, ang: Math.PI / 2, len: 468, width: 11, rot: 0 }
      ]
    },
    {
      name: "对射",
      sub: "VOLLEY",
      hint: "把旧自己丢进弹道，自己从影子后绕出去",
      toast: "新弹会瞄准你。残影吃弹，你去出口",
      tapes: 3,
      lives: 3,
      ghostHp: 22,
      spawn: { x: 88, y: 270 },
      exit: { x: 872, y: 86 },
      walls: [
        { x: 250, y: 186, w: 28, h: 168 },
        { x: 470, y: 30, w: 28, h: 168 },
        { x: 470, y: 342, w: 28, h: 168 },
        { x: 690, y: 186, w: 28, h: 168 }
      ],
      emitters: [
        { kind: "aimed", x: 910, y: 80, period: 0.56, speed: 208, warmup: 2.5 },
        { kind: "aimed", x: 910, y: 270, period: 0.62, speed: 198, warmup: 2.8 },
        { kind: "aimed", x: 910, y: 460, period: 0.7, speed: 190, warmup: 3.1 },
        { kind: "stream", x: 930, y: 270, ang: Math.PI, period: 0.26, speed: 176, jitter: 70, warmup: 3.4 }
      ],
      lasers: []
    },
    {
      name: "扫束",
      sub: "SWEEP",
      hint: "扫束碰到残影就会断。找准时机冲出口",
      toast: "扫束会被旧自己截停",
      tapes: 3,
      lives: 3,
      ghostHp: 40,
      spawn: { x: 90, y: 430 },
      exit: { x: 848, y: 92 },
      walls: [
        { x: 210, y: 210, w: 150, h: 22 },
        { x: 520, y: 308, w: 150, h: 22 }
      ],
      emitters: [
        { kind: "stream", x: 40, y: 40, ang: 0.44, period: 0.42, speed: 160, jitter: 24, warmup: 2.8 }
      ],
      lasers: [
        { x: 900, y: 270, ang: Math.PI, len: 860, width: 12, rot: 0.48 }
      ]
    },
    {
      name: "终卷",
      sub: "FINALE",
      hint: "交火、扫束、弹幕。旧自己是唯一的墙",
      toast: "最后一卷。多留几个自己",
      tapes: 4,
      lives: 3,
      ghostHp: 32,
      spawn: { x: 88, y: 454 },
      exit: { x: 860, y: 86 },
      walls: [
        { x: 210, y: 158, w: 24, h: 220 },
        { x: 430, y: 30, w: 24, h: 168 },
        { x: 430, y: 342, w: 24, h: 168 },
        { x: 650, y: 158, w: 24, h: 220 }
      ],
      emitters: [
        { kind: "aimed", x: 910, y: 270, period: 0.55, speed: 214, warmup: 2.4 },
        { kind: "aimed", x: 480, y: 40, period: 0.8, speed: 176, warmup: 3.0 }
      ],
      lasers: [
        { x: 36, y: 270, ang: 0, len: 888, width: 10, rot: 0 },
        { x: 900, y: 70, ang: Math.PI * 0.78, len: 780, width: 11, rot: 0.38 }
      ]
    }
  ];

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const stageEl = document.getElementById("stage");
  const overlay = document.getElementById("overlay");
  const panel = document.getElementById("panel");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovLead = document.getElementById("ov-lead");
  const ovOps = document.getElementById("ov-ops");
  const ovBtn = document.getElementById("ov-btn");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const btnRew = document.getElementById("btn-rew");
  const stageLabel = document.getElementById("stage-label");
  const pipsEl = document.getElementById("pips");
  const livesEl = document.getElementById("lives");
  const tapeFill = document.getElementById("tape-fill");
  const tapeTrack = tapeFill.parentElement;
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;

  const keys = { u: false, d: false, l: false, r: false, rew: false };
  const pointer = { down: false, id: null, x: 0, y: 0 };
  const rewPtr = { down: false, id: null };

  const particles = [];
  const motes = [];
  const bolts = [];
  const pops = [];

  const G = {
    mode: "title",
    stage: 0,
    clock: 0,
    px: 96,
    py: 100,
    face: 0,
    tapes: 2,
    tapesMax: 2,
    lives: 3,
    livesMax: 3,
    tape: [],
    ghosts: [],
    walls: [],
    emitters: [],
    lasers: [],
    exit: { x: 848, y: 270 },
    ghostHp: 42,
    rewinding: false,
    rewindT: 0,
    rewindClock0: 0,
    snap: null,
    pending: null,
    rewArmed: true,
    ifr: 0,
    lock: 0,
    shake: 0,
    flash: 0,
    flashC: CYAN,
    clearT: 0,
    dieT: 0,
    toastT: 0,
    blocked: 0,
    plants: 0,
    hits: 0,
    flags: {},
    why: ""
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }


  for (let i = 0; i < 64; i++) {
    motes.push({
      x: Math.random() * WORLD_W,
      y: Math.random() * WORLD_H,
      r: rand(0.6, 1.8),
      s: rand(4, 14),
      a: rand(0.08, 0.22),
      p: Math.random() * TAU
    });
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    whir: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (err) {}
    },
    beep: function (freq, dur, type, vol, slide) {
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
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      src.buffer = buf;
      f.type = "highpass";
      f.frequency.value = hp || 1200;
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    startDrone: function () {
      this.ensure();
      if (!this.ctx || this.drone) return;
      const t = this.ctx.currentTime;
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o1.type = "sine";
      o2.type = "triangle";
      o1.frequency.value = 62;
      o2.frequency.value = 93;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.6);
      o1.connect(g);
      o2.connect(g);
      g.connect(this.master);
      o1.start();
      o2.start();
      this.drone = [o1, o2];
      this.droneGain = g;
    },
    stopDrone: function () {
      if (!this.drone || !this.ctx) return;
      const t = this.ctx.currentTime;
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      this.drone[0].stop(t + 0.3);
      this.drone[1].stop(t + 0.3);
      this.drone = null;
      this.droneGain = null;
    },
    startWhir: function () {
      this.ensure();
      if (!this.ctx || this.whir) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = "sawtooth";
      o2.type = "square";
      o.frequency.setValueAtTime(420, t);
      o.frequency.exponentialRampToValueAtTime(86, t + TAPE_SEC);
      o2.frequency.setValueAtTime(210, t);
      o2.frequency.exponentialRampToValueAtTime(48, t + TAPE_SEC);
      f.type = "lowpass";
      f.frequency.value = 1100;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.07);
      o.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      this.whir = { o: o, o2: o2, g: g };
    },
    stopWhir: function (ok) {
      if (!this.whir || !this.ctx) return;
      const t = this.ctx.currentTime;
      try {
        this.whir.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        this.whir.o.stop(t + 0.12);
        this.whir.o2.stop(t + 0.12);
      } catch (err) {}
      this.whir = null;
      if (ok) {
        this.beep(720, 0.16, "triangle", 0.11, 1280);
        this.beep(1080, 0.22, "sine", 0.06, 1640);
      } else {
        this.noise(0.1, 0.05, 800);
      }
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (err) {}

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    scale = Math.min(W / WORLD_W, H / WORLD_H);
    ox = (W - WORLD_W * scale) / 2;
    oy = (H - WORLD_H * scale) / 2;
  }

  function toWorld(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (cx - r.left - ox) / scale,
      y: (cy - r.top - oy) / scale
    };
  }

  function toast(msg, mag) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("mag", !!mag);
    toastEl.classList.remove("hidden");
    G.toastT = 2.4;
  }

  function setPips() {
    pipsEl.innerHTML = "";
    for (let i = 0; i < G.tapesMax; i++) {
      const s = document.createElement("span");
      s.className = "pip" + (i < G.tapes ? (G.tapes === 1 ? " on warn" : " on") : "");
      pipsEl.appendChild(s);
    }
    livesEl.innerHTML = "";
    for (let i = 0; i < G.livesMax; i++) {
      const s = document.createElement("span");
      s.className = "hp" + (i < G.lives ? (G.lives === 1 ? " on warn" : " on") : "");
      livesEl.appendChild(s);
    }
  }

  function setTapeHud() {
    const span = tapeSpan();
    const rew = G.rewinding;
    let u;
    if (rew) u = clamp(1 - G.rewindT / TAPE_SEC, 0, 1);
    else u = clamp(span / TAPE_SEC, 0, 1);
    tapeFill.style.width = (u * 100).toFixed(1) + "%";
    tapeTrack.classList.toggle("rewinding", rew);
    tapeTrack.classList.toggle("full", !rew && u >= 0.995);
  }

  function tapeSpan() {
    if (G.tape.length < 2) return 0;
    return G.tape[G.tape.length - 1].t - G.tape[0].t;
  }

  function pushTape() {
    G.tape.push({ t: G.clock, x: G.px, y: G.py, a: G.face });
    const cut = G.clock - TAPE_SEC - 0.08;
    while (G.tape.length > 2 && G.tape[0].t < cut) G.tape.shift();
    if (G.tape.length > 220) G.tape.splice(0, G.tape.length - 200);
  }

  function poseAt(tape, t) {
    if (!tape || !tape.length) return { x: G.px, y: G.py, a: G.face };
    if (t <= tape[0].t) return tape[0];
    const last = tape[tape.length - 1];
    if (t >= last.t) return last;
    let lo = 0;
    let hi = tape.length - 1;
    while (lo + 1 < hi) {
      const m = (lo + hi) >> 1;
      if (tape[m].t < t) lo = m;
      else hi = m;
    }
    const a = tape[lo];
    const b = tape[hi];
    const u = (t - a.t) / Math.max(0.0001, b.t - a.t);
    return {
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
      a: a.a
    };
  }

  function burst(x, y, n, color, spd, life) {
    const cap = 220 - particles.length;
    const m = n < cap ? n : cap;
    for (let i = 0; i < m; i++) {
      const ang = rand(0, TAU);
      const v = rand(spd * 0.25, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
        life: rand(life * 0.45, life),
        max: life,
        r: rand(1.1, 2.8),
        color: color
      });
    }
  }

  function popup(x, y, text, color) {
    pops.push({ x: x, y: y, text: text, color: color, t: 0.7 });
  }

  function circleRect(cx, cy, r, w) {
    const px = clamp(cx, w.x, w.x + w.w);
    const py = clamp(cy, w.y, w.y + w.h);
    const dx = cx - px;
    const dy = cy - py;
    return dx * dx + dy * dy < r * r;
  }

  function resolveWalls(ent, r) {
    const walls = G.walls;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      const qx = clamp(ent.x, w.x, w.x + w.w);
      const qy = clamp(ent.y, w.y, w.y + w.h);
      let dx = ent.x - qx;
      let dy = ent.y - qy;
      let d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      if (d2 < 0.0001) {
        const left = ent.x - w.x;
        const right = w.x + w.w - ent.x;
        const top = ent.y - w.y;
        const bot = w.y + w.h - ent.y;
        const m = Math.min(left, right, top, bot);
        if (m === left) ent.x = w.x - r;
        else if (m === right) ent.x = w.x + w.w + r;
        else if (m === top) ent.y = w.y - r;
        else ent.y = w.y + w.h + r;
      } else {
        const d = Math.sqrt(d2);
        const k = (r - d) / d;
        ent.x += dx * k;
        ent.y += dy * k;
      }
    }
    ent.x = clamp(ent.x, PAD + r, WORLD_W - PAD - r);
    ent.y = clamp(ent.y, PAD + r, WORLD_H - PAD - r);
  }

  function rayHitCircle(ox, oy, dx, dy, len, cx, cy, r) {
    const t = clamp((cx - ox) * dx + (cy - oy) * dy, 0, len);
    const px = ox + dx * t;
    const py = oy + dy * t;
    const hx = px - cx;
    const hy = py - cy;
    if (hx * hx + hy * hy <= r * r) return t;
    return -1;
  }

  function distToSeg(px, py, ax, ay, bx, by) {
    const vx = bx - ax;
    const vy = by - ay;
    const d2 = vx * vx + vy * vy;
    const t = d2 < 0.0001 ? 0 : clamp(((px - ax) * vx + (py - ay) * vy) / d2, 0, 1);
    const qx = ax + vx * t;
    const qy = ay + vy * t;
    return hypot(px - qx, py - qy);
  }

  function laserReach(L) {
    const dx = Math.cos(L.ang);
    const dy = Math.sin(L.ang);
    let end = L.len;
    let hit = null;
    for (let i = 0; i < G.ghosts.length; i++) {
      const g = G.ghosts[i];
      const t = rayHitCircle(L.x, L.y, dx, dy, L.len, g.x, g.y, GHOST_R + 30);
      if (t >= 0 && t < end) {
        end = t;
        hit = g;
      }
    }
    return { end: end, dx: dx, dy: dy, hit: hit };
  }

  function spawnBolt(x, y, vx, vy) {
    bolts.push({ x: x, y: y, vx: vx, vy: vy, r: BOLT_R, age: 0 });
  }

  function fireEmitter(em) {
    if (em.kind === "column") {
      for (let y = em.y0; y <= em.y1; y += em.step) {
        spawnBolt(em.x, y, Math.cos(em.ang) * em.speed, Math.sin(em.ang) * em.speed);
      }
      return;
    }
    let ang = em.ang || 0;
    if (em.kind === "aimed") ang = Math.atan2(G.py - em.y, G.px - em.x);
    const j = em.jitter ? rand(-em.jitter, em.jitter) : 0;
    const px = em.x + Math.cos(ang + Math.PI / 2) * j * 0.02;
    const py = em.y + j;
    spawnBolt(px, py, Math.cos(ang) * em.speed, Math.sin(ang) * em.speed);
    audio.beep(em.kind === "aimed" ? 520 : 340, 0.04, "square", 0.03, 220);
  }

  function loadStage(index) {
    const s = STAGES[index];
    G.stage = index;
    G.clock = 0;
    G.px = s.spawn.x;
    G.py = s.spawn.y;
    G.face = 0;
    G.tapes = s.tapes;
    G.tapesMax = s.tapes;
    G.lives = s.lives;
    G.livesMax = s.lives;
    G.ghostHp = s.ghostHp;
    G.exit = { x: s.exit.x, y: s.exit.y };
    G.walls = s.walls.slice();
    G.ghosts = [];
    G.tape = [{ t: 0, x: G.px, y: G.py, a: 0 }];
    G.rewinding = false;
    G.rewindT = 0;
    G.snap = null;
    G.pending = null;
    G.rewArmed = true;
    G.ifr = 0.35;
    G.lock = 0.4;
    G.clearT = 0;
    G.dieT = 0;
    G.flags = {};
    G.shake = 0;
    bolts.length = 0;
    particles.length = 0;
    pops.length = 0;
    G.emitters = s.emitters.map(function (e) {
      const o = {};
      for (const k in e) o[k] = e[k];
      o.cool = 0.02;
      return o;
    });
    G.lasers = s.lasers.map(function (L) {
      return {
        x: L.x,
        y: L.y,
        ang0: L.ang,
        ang: L.ang,
        len: L.len,
        width: L.width,
        rot: L.rot || 0
      };
    });
    audio.stopWhir(false);
    stageLabel.textContent = s.name + " · " + s.sub;
    hintEl.textContent = s.hint;
    setPips();
    setTapeHud();
    toast(s.toast);
    btnRew.classList.remove("holding", "locked");
  }

  function startRun() {
    G.mode = "play";
    G.blocked = 0;
    G.plants = 0;
    G.hits = 0;
    G.flash = 0.3;
    G.flashC = CYAN;
    hideOverlay();
    stageEl.classList.add("playing");
    btnRew.hidden = false;
    loadStage(0);
    audio.startDrone();
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    stageEl.classList.remove("playing", "rewinding");
    btnRew.hidden = true;
    btnRew.classList.remove("holding");
    if (kind === "title") {
      ovKicker.textContent = "REWIND";
      ovTitle.textContent = "倒带";
      ovLead.textContent = "按住倒带满三秒。旧的自己会停在原地，替你挡住新飞来的障碍。";
      ovOps.textContent = "WASD / 方向键或拖拽移动 · 按住空格或「倒带」满三秒 · M 静音";
      ovBtn.textContent = "开始";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "带尽";
      ovLead.textContent = "五卷倒完。旧自己还站在弹道上。";
      ovOps.textContent = "挡住 " + G.blocked + " 弹 · 留下 " + G.plants + " 个自己";
      ovBtn.textContent = "再来一局";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "SNAP";
      ovTitle.textContent = "带断";
      ovLead.textContent = G.why || "新弹穿过了空位。磁带还在转。";
      ovOps.textContent = STAGES[G.stage].name + " · 挡住 " + G.blocked + " 弹";
      ovBtn.textContent = "再闯本关";
    }
  }

  function canRewind() {
    return (
      G.mode === "play" &&
      !G.rewinding &&
      G.lock <= 0 &&
      G.clearT <= 0 &&
      G.dieT <= 0 &&
      G.tapes > 0 &&
      tapeSpan() >= TAPE_SEC - 0.06
    );
  }

  function startRewind() {
    if (!canRewind()) {
      if (G.mode !== "play" || G.rewinding || G.lock > 0) return;
      if (G.tapes <= 0) toast("磁带用尽", true);
      else if (tapeSpan() < TAPE_SEC - 0.06) toast("再走一会儿，磁带要满三秒");
      return;
    }
    G.rewinding = true;
    G.rewindT = 0;
    G.rewindClock0 = G.clock;
    G.snap = G.tape.slice();
    G.pending = {
      x: G.px,
      y: G.py,
      a: G.face,
      hp: G.ghostHp,
      hpMax: G.ghostHp,
      locked: false,
      age: 0
    };
    G.ghosts.push(G.pending);
    G.rewArmed = false;
    stageEl.classList.add("rewinding");
    btnRew.classList.add("holding");
    audio.startWhir();
    burst(G.px, G.py, 10, MAG, 90, 0.4);
    popup(G.px, G.py - 22, "倒带", MAG);
  }

  function cancelRewind() {
    if (!G.rewinding) return;
    const p = G.pending;
    if (p) {
      const i = G.ghosts.indexOf(p);
      if (i >= 0) G.ghosts.splice(i, 1);
      burst(p.x, p.y, 14, MAG, 140, 0.45);
    }
    G.rewinding = false;
    G.pending = null;
    G.snap = null;
    G.tape = [{ t: G.clock, x: G.px, y: G.py, a: G.face }];
    stageEl.classList.remove("rewinding");
    btnRew.classList.remove("holding");
    audio.stopWhir(false);
    toast("倒带取消", true);
  }

  function completeRewind() {
    if (!G.rewinding) return;
    if (G.pending) {
      G.pending.locked = true;
      G.pending.flash = 1;
      burst(G.pending.x, G.pending.y, 22, CYAN, 160, 0.55);
      popup(G.pending.x, G.pending.y - 24, "定格", CYAN);
    }
    G.tapes -= 1;
    G.plants += 1;
    G.rewinding = false;
    G.pending = null;
    G.snap = null;
    G.tape = [{ t: G.clock, x: G.px, y: G.py, a: G.face }];
    G.ifr = Math.max(G.ifr, 0.28);
    G.flash = 0.28;
    G.flashC = MAG;
    G.shake = Math.max(G.shake, 5);
    stageEl.classList.remove("rewinding");
    btnRew.classList.remove("holding");
    btnRew.classList.add("locked");
    setTimeout(function () {
      btnRew.classList.remove("locked");
    }, 280);
    audio.stopWhir(true);
    setPips();
    if (!G.flags.planted) {
      G.flags.planted = true;
      toast("残影挡住新弹。走进青色出口");
    }
  }

  function hurt(fromX, fromY) {
    if (G.ifr > 0 || G.rewinding || G.mode !== "play" || G.clearT > 0) return;
    G.lives -= 1;
    G.hits += 1;
    G.ifr = IFR;
    G.flash = 0.4;
    G.flashC = MAG;
    G.shake = 10;
    audio.noise(0.16, 0.12, 400);
    audio.beep(180, 0.18, "sawtooth", 0.08, 70);
    burst(G.px, G.py, 18, MAG, 180, 0.5);
    const dx = G.px - fromX;
    const dy = G.py - fromY;
    const d = hypot(dx, dy) || 1;
    G.px += (dx / d) * 18;
    G.py += (dy / d) * 18;
    resolveWalls(G, PLAYER_R);
    setPips();
    if (G.lives <= 0) {
      G.mode = "die";
      G.dieT = 0.62;
      G.why = "新弹打中了现在的你。";
      audio.stopWhir(false);
      audio.stopDrone();
      burst(G.px, G.py, 36, CYAN, 220, 0.7);
    }
  }

  function winStage() {
    if (G.clearT > 0) return;
    G.clearT = 0.82;
    G.flash = 0.4;
    G.flashC = CYAN;
    G.shake = 6;
    audio.beep(520, 0.12, "sine", 0.1, 780);
    audio.beep(780, 0.18, "triangle", 0.08, 1180);
    burst(G.exit.x, G.exit.y, 24, CYAN, 140, 0.6);
    popup(G.exit.x, G.exit.y - 20, "过带", GOLD);
    if (G.rewinding) {
      audio.stopWhir(false);
      G.rewinding = false;
      stageEl.classList.remove("rewinding");
      btnRew.classList.remove("holding");
    }
  }

  function ghostHurt(g, dmg) {
    g.hp -= dmg;
    g.hitT = 0.12;
    if (g.hp <= 0) {
      const i = G.ghosts.indexOf(g);
      if (i >= 0) G.ghosts.splice(i, 1);
      burst(g.x, g.y, 20, MAG, 170, 0.5);
      popup(g.x, g.y - 16, "散", MAG);
      audio.noise(0.12, 0.07, 600);
      if (G.pending === g) {
        G.pending = null;
        if (G.rewinding) cancelRewind();
      }
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.ifr = Math.max(0, G.ifr - dt);
    G.clock += dt;

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) {
        if (G.stage + 1 >= STAGES.length) {
          G.mode = "win";
          audio.stopDrone();
          showOverlay("win");
        } else {
          loadStage(G.stage + 1);
        }
      }
      return;
    }

    const holding = keys.rew || rewPtr.down;
    if (!holding) G.rewArmed = true;

    if (G.rewinding) {
      if (!holding) {
        cancelRewind();
      } else {
        G.rewindT += dt;
        const t = G.rewindClock0 - G.rewindT;
        const p = poseAt(G.snap, t);
        G.px = p.x;
        G.py = p.y;
        G.face = p.a;
        if (G.rewindT >= TAPE_SEC) completeRewind();
      }
    } else if (holding && G.rewArmed && G.lock <= 0) {
      G.rewArmed = false;
      startRewind();
    }

    if (!G.rewinding) {
      let ax = 0;
      let ay = 0;
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax !== 0 || ay !== 0) {
        const inv = 1 / Math.sqrt(ax * ax + ay * ay);
        ax *= inv;
        ay *= inv;
      } else if (pointer.down) {
        const dx = pointer.x - G.px;
        const dy = pointer.y - G.py;
        const d = hypot(dx, dy);
        if (d > 10) {
          ax = dx / d;
          ay = dy / d;
        }
      }
      if (ax !== 0 || ay !== 0) G.face = Math.atan2(ay, ax);
      G.px += ax * SPEED * dt;
      G.py += ay * SPEED * dt;
      resolveWalls(G, PLAYER_R);
      pushTape();
    }

    if (!G.flags.full && tapeSpan() >= TAPE_SEC - 0.02 && !G.rewinding) {
      G.flags.full = true;
      toast("磁带满了。贴着光束按住倒带满三秒", true);
      audio.beep(880, 0.1, "sine", 0.07, 1180);
    }

    for (let i = 0; i < G.emitters.length; i++) {
      const em = G.emitters[i];
      if (G.clock < em.warmup) continue;
      em.cool -= dt;
      if (em.cool <= 0) {
        fireEmitter(em);
        em.cool = em.period;
      }
    }

    for (let i = 0; i < G.lasers.length; i++) {
      const L = G.lasers[i];
      if (L.rot) L.ang = L.ang0 + G.clock * L.rot;
      const reach = laserReach(L);
      L._end = reach.end;
      L._dx = reach.dx;
      L._dy = reach.dy;
      if (reach.hit) {
        reach.hit.hp -= dt * 3.2;
        reach.hit.hitT = 0.08;
        if (reach.hit.hp <= 0) ghostHurt(reach.hit, 0);
      }
      const x2 = L.x + reach.dx * reach.end;
      const y2 = L.y + reach.dy * reach.end;
      const d = distToSeg(G.px, G.py, L.x, L.y, x2, y2);
      if (d < PLAYER_R * 0.8 + L.width * 0.4) hurt(L.x, L.y);
    }

    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.age += dt;
      let dead = false;
      if (b.x < -20 || b.x > WORLD_W + 20 || b.y < -20 || b.y > WORLD_H + 20 || b.age > 8) dead = true;
      if (!dead) {
        for (let w = 0; w < G.walls.length; w++) {
          if (circleRect(b.x, b.y, b.r, G.walls[w])) {
            dead = true;
            burst(b.x, b.y, 4, MAG, 50, 0.25);
            break;
          }
        }
      }
      if (!dead) {
        for (let g = 0; g < G.ghosts.length; g++) {
          const gh = G.ghosts[g];
          const dx = b.x - gh.x;
          const dy = b.y - gh.y;
          const rr = b.r + GHOST_R;
          if (dx * dx + dy * dy < rr * rr) {
            dead = true;
            G.blocked += 1;
            ghostHurt(gh, 1);
            burst(b.x, b.y, 8, GOLD, 110, 0.32);
            audio.beep(1240, 0.05, "triangle", 0.035, 600);
            break;
          }
        }
      }
      if (!dead) {
        const dx = b.x - G.px;
        const dy = b.y - G.py;
        const rr = b.r + PLAYER_R;
        if (dx * dx + dy * dy < rr * rr) {
          dead = true;
          hurt(b.x, b.y);
        }
      }
      if (dead) bolts.splice(i, 1);
    }

    for (let i = 0; i < G.ghosts.length; i++) {
      const g = G.ghosts[i];
      g.age += dt;
      if (g.hitT) g.hitT = Math.max(0, g.hitT - dt);
      if (g.flash) g.flash = Math.max(0, g.flash - dt * 2.2);
    }

    const ex = G.px - G.exit.x;
    const ey = G.py - G.exit.y;
    if (ex * ex + ey * ey < (PLAYER_R + EXIT_R * 0.62) * (PLAYER_R + EXIT_R * 0.62)) winStage();
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= 18 * dt;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    if (G.mode === "die") {
      G.dieT -= dt;
      if (G.dieT <= 0) {
        G.mode = "lose";
        showOverlay("lose");
      }
    }
  }

  function rr(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function drawDiamond(x, y, r, ang) {
    ctx.beginPath();
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    function pt(lx, ly) {
      return [x + lx * c - ly * s, y + lx * s + ly * c];
    }
    const a = pt(r, 0);
    const b = pt(0, r * 0.72);
    const c2 = pt(-r * 0.78, 0);
    const d = pt(0, -r * 0.72);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c2[0], c2[1]);
    ctx.lineTo(d[0], d[1]);
    ctx.closePath();
  }

  function drawBody(x, y, r, ang, stroke, fill, glow, core) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = stroke;
      ctx.shadowBlur = glow;
    }
    drawDiamond(x, y, r, ang);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.28, 0, TAU);
    ctx.fillStyle = core;
    ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) : 0;
    ctx.save();
    ctx.translate(ox + shx, oy + shy);
    ctx.scale(scale, scale);

    ctx.fillStyle = "#080510";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, WORLD_W, WORLD_H);
    ctx.clip();

    ctx.strokeStyle = "rgba(0,240,255,0.045)";
    ctx.lineWidth = 1;
    for (let x = 40; x < WORLD_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_H);
      ctx.stroke();
    }
    for (let y = 40; y < WORLD_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_W, y);
      ctx.stroke();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const my = (m.y + G.clock * m.s) % WORLD_H;
      ctx.fillStyle = "rgba(0,240,255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(m.x, my, m.r, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(0,240,255,0.22)";
    ctx.lineWidth = 2;
    rr(PAD - 6, PAD - 6, WORLD_W - (PAD - 6) * 2, WORLD_H - (PAD - 6) * 2, 14);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.18)";
    ctx.lineWidth = 1;
    rr(PAD - 12, PAD - 12, WORLD_W - (PAD - 12) * 2, WORLD_H - (PAD - 12) * 2, 18);
    ctx.stroke();

    const corners = [
      [PAD, PAD],
      [WORLD_W - PAD, PAD],
      [PAD, WORLD_H - PAD],
      [WORLD_W - PAD, WORLD_H - PAD]
    ];
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 2;
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 8;
    for (let i = 0; i < 4; i++) {
      const cx = corners[i][0];
      const cy = corners[i][1];
      const sx = i % 2 === 0 ? 1 : -1;
      const sy = i < 2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + sx * 16, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * 16);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      rr(w.x, w.y, w.w, w.h, 8);
      ctx.fillStyle = "rgba(12, 10, 28, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,240,255,0.28)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,61,184,0.14)";
      ctx.lineWidth = 1;
      rr(w.x + 4, w.y + 4, w.w - 8, w.h - 8, 6);
      ctx.stroke();
    }

    const tape = G.rewinding && G.snap ? G.snap : G.tape;
    if (tape.length > 1) {
      ctx.beginPath();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.moveTo(tape[0].x, tape[0].y);
      for (let i = 1; i < tape.length; i++) ctx.lineTo(tape[i].x, tape[i].y);
      ctx.strokeStyle = G.rewinding ? "rgba(255,61,184,0.55)" : "rgba(0,240,255,0.28)";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
      const step = Math.max(1, (tape.length / 10) | 0);
      for (let i = 0; i < tape.length; i += step) {
        const p = tape[i];
        const u = i / tape.length;
        ctx.fillStyle = G.rewinding
          ? "rgba(255,61,184," + (0.18 + u * 0.4) + ")"
          : "rgba(0,240,255," + (0.1 + u * 0.28) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.1, 0, TAU);
        ctx.fill();
      }
    }

    const ex = G.exit;
    const pulse = 0.5 + Math.sin(G.clock * 3.2) * 0.5;
    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, EXIT_R + pulse * 4, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, EXIT_R * 0.55, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,240,255," + (0.07 + pulse * 0.08) + ")";
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, EXIT_R * 0.85, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,240,255,0.7)";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("出口", ex.x, ex.y + 4);
    ctx.restore();

    for (let i = 0; i < G.emitters.length; i++) {
      const em = G.emitters[i];
      let ang = em.ang || 0;
      if (em.kind === "aimed") ang = Math.atan2(G.py - em.y, G.px - em.x);
      ctx.save();
      ctx.translate(em.x, em.y);
      ctx.rotate(ang);
      ctx.shadowColor = MAG;
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(255,61,184,0.16)";
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, 9);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, -9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = MAG;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < G.lasers.length; i++) {
      const L = G.lasers[i];
      const dx = L._dx != null ? L._dx : Math.cos(L.ang);
      const dy = L._dy != null ? L._dy : Math.sin(L.ang);
      const end = L._end != null ? L._end : L.len;
      const x2 = L.x + dx * end;
      const y2 = L.y + dy * end;
      ctx.save();
      ctx.shadowColor = MAG;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "rgba(255,61,184,0.22)";
      ctx.lineWidth = L.width + 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = MAG;
      ctx.lineWidth = L.width;
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = Math.max(1.6, L.width * 0.28);
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = MAG;
      ctx.beginPath();
      ctx.arc(L.x, L.y, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x2, y2, 3.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      const ang = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.shadowColor = MAG;
      ctx.shadowBlur = 8;
      ctx.fillStyle = MAG;
      ctx.beginPath();
      ctx.moveTo(b.r + 2, 0);
      ctx.lineTo(-b.r, b.r * 0.7);
      ctx.lineTo(-b.r * 0.4, 0);
      ctx.lineTo(-b.r, -b.r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < G.ghosts.length; i++) {
      const g = G.ghosts[i];
      const flicker = g.locked ? 0 : Math.sin(G.clock * 22) * 1.4;
      const crack = 1 - clamp(g.hp / (g.hpMax || G.ghostHp), 0, 1);
      const fill = g.locked
        ? "rgba(255,61,184," + (0.28 + (g.flash || 0) * 0.35) + ")"
        : "rgba(255,61,184,0.16)";
      const stroke = g.hitT ? "#fff" : MAG;
      ctx.save();
      ctx.globalAlpha = g.locked ? 0.95 : 0.7;
      drawBody(g.x + flicker, g.y, GHOST_R, g.a, stroke, fill, g.locked ? 14 : 8, g.locked ? "#ffd6ef" : "rgba(255,214,239,0.5)");
      ctx.strokeStyle = "rgba(0,240,255,0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(g.x, g.y, GHOST_R + 5, 0, TAU);
      ctx.stroke();
      if (crack > 0.35) {
        ctx.strokeStyle = "rgba(5,3,12,0.7)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(g.x - 8, g.y - 6);
        ctx.lineTo(g.x + 3, g.y + 2);
        ctx.lineTo(g.x - 2, g.y + 10);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (G.mode !== "die") {
      const ph = G.rewinding || G.ifr > 0;
      ctx.globalAlpha = ph && ((G.clock * 18) | 0) % 2 === 0 ? 0.55 : 1;
      drawBody(
        G.px,
        G.py,
        PLAYER_R,
        G.face,
        G.rewinding ? MAG : CYAN,
        G.rewinding ? "rgba(255,61,184,0.22)" : "rgba(0,240,255,0.18)",
        14,
        G.rewinding ? MAG : "#fff"
      );
      ctx.globalAlpha = 1;

      if (G.rewinding || tapeSpan() > 0.2) {
        const u = G.rewinding ? clamp(G.rewindT / TAPE_SEC, 0, 1) : clamp(tapeSpan() / TAPE_SEC, 0, 1);
        ctx.beginPath();
        ctx.strokeStyle = G.rewinding ? MAG : CYAN;
        ctx.lineWidth = 2.4;
        ctx.arc(G.px, G.py, PLAYER_R + 11, -Math.PI / 2, -Math.PI / 2 + TAU * u);
        ctx.stroke();
        if (G.rewinding) {
          ctx.fillStyle = MAG;
          ctx.font = "700 11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText((TAPE_SEC - G.rewindT).toFixed(1), G.px, G.py - PLAYER_R - 18);
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      ctx.globalAlpha = clamp(p.t / 0.7, 0, 1);
      ctx.fillStyle = p.color;
      ctx.font = "700 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    if (G.rewinding) {
      ctx.fillStyle = "rgba(255,61,184,0.055)";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.strokeStyle = "rgba(255,61,184,0.25)";
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, WORLD_W - 16, WORLD_H - 16);
    }

    if (G.flash > 0) {
      ctx.fillStyle = G.flashC === MAG ? "rgba(255,61,184," + G.flash * 0.22 + ")" : "rgba(0,240,255," + G.flash * 0.18 + ")";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }

    ctx.restore();
    ctx.restore();
  }

  function update(dt) {
    if (G.mode === "play") updatePlay(dt);
    else G.clock += dt;
    updateFx(dt);
    setTapeHud();
  }

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 3) acc = 0;
    render();
    requestAnimationFrame(frame);
  }

  function setKey(code, down) {
    if (code === "KeyW" || code === "ArrowUp") keys.u = down;
    else if (code === "KeyS" || code === "ArrowDown") keys.d = down;
    else if (code === "KeyA" || code === "ArrowLeft") keys.l = down;
    else if (code === "KeyD" || code === "ArrowRight") keys.r = down;
    else if (code === "Space" || code === "KeyJ" || code === "KeyK") keys.rew = down;
  }

  window.addEventListener("keydown", function (e) {
    if (e.repeat && (e.code === "Space" || e.code === "KeyJ" || e.code === "KeyK")) {
      e.preventDefault();
      return;
    }
    if (e.code === "KeyM") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      audio.ensure();
      retry();
      return;
    }
    if ((e.code === "Enter" || e.code === "Space") && G.mode !== "play" && G.mode !== "die") {
      e.preventDefault();
      onMain();
      return;
    }
    setKey(e.code, true);
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
      e.preventDefault();
    }
    audio.ensure();
  });

  window.addEventListener("keyup", function (e) {
    setKey(e.code, false);
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (G.mode !== "play") return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointer.down = true;
    pointer.id = e.pointerId;
    const w = toWorld(e.clientX, e.clientY);
    pointer.x = w.x;
    pointer.y = w.y;
    audio.ensure();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const w = toWorld(e.clientX, e.clientY);
    pointer.x = w.x;
    pointer.y = w.y;
  });
  function endPtr(e) {
    if (e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);

  btnRew.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    btnRew.setPointerCapture(e.pointerId);
    rewPtr.down = true;
    rewPtr.id = e.pointerId;
    btnRew.classList.add("holding");
    audio.ensure();
  });
  function endRew(e) {
    if (rewPtr.id != null && e.pointerId !== rewPtr.id) return;
    rewPtr.down = false;
    rewPtr.id = null;
    btnRew.classList.remove("holding");
  }
  btnRew.addEventListener("pointerup", endRew);
  btnRew.addEventListener("pointercancel", endRew);
  btnRew.addEventListener("lostpointercapture", endRew);

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    onMain();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    retry();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  function onMain() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win") startRun();
    else if (G.mode === "lose") {
      G.mode = "play";
      hideOverlay();
      stageEl.classList.add("playing");
      btnRew.hidden = false;
      loadStage(G.stage);
      audio.startDrone();
    }
  }

  function retry() {
    audio.ensure();
    if (G.mode === "title") {
      startRun();
      return;
    }
    G.mode = "play";
    hideOverlay();
    stageEl.classList.add("playing");
    btnRew.hidden = false;
    G.blocked = 0;
    G.plants = 0;
    G.hits = 0;
    loadStage(0);
    audio.startDrone();
  }

  window.addEventListener("resize", resize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
  window.addEventListener("blur", function () {
    keys.u = keys.d = keys.l = keys.r = keys.rew = false;
    pointer.down = false;
    rewPtr.down = false;
    btnRew.classList.remove("holding");
  });

  resize();
  (function preview() {
    const s = STAGES[0];
    G.walls = s.walls.slice();
    G.emitters = s.emitters.map(function (e) {
      const o = {};
      for (const k in e) o[k] = e[k];
      return o;
    });
    G.lasers = s.lasers.map(function (L) {
      return {
        x: L.x,
        y: L.y,
        ang0: L.ang,
        ang: L.ang,
        len: L.len,
        width: L.width,
        rot: L.rot || 0
      };
    });
  })();
  showOverlay("title");
  requestAnimationFrame(frame);
})();
