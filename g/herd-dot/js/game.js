(() => {
  "use strict";

  const WORLD_W = 960;
  const WORLD_H = 540;
  const WALL = 22;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const RING_R = 46;
  const RING_VIS = 52;
  const DOT_R = 8.6;
  const RING_SPD = 258;
  const RING_ACC = 1480;
  const RING_DAMP = 5.6;
  const DOT_MAX = 198;
  const CLEAR_T = 0.86;
  const DIE_T = 0.62;
  const MUTE_KEY = "herd-dot-mute";

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

  const STAGES = [
    {
      name: "初栏",
      sub: "FIRST",
      hint: "贴在点后面推，从栏口送进去",
      toast: "用光圈把散点赶进右边青栏",
      time: 36,
      ring: { x: 188, y: 418 },
      pen: { x: 714, y: 138, w: 198, h: 256, open: "w", gate: 120 },
      dots: [
        { x: 286, y: 228 },
        { x: 338, y: 292 },
        { x: 252, y: 318 }
      ],
      rifts: [],
      posts: [],
      jitter: 26,
      flee: 1
    },
    {
      name: "散群",
      sub: "SCATTER",
      hint: "先收成一群，再往栏口推",
      toast: "点散了，拢到一起再赶",
      time: 40,
      ring: { x: 480, y: 430 },
      pen: { x: 358, y: 32, w: 244, h: 148, open: "s", gate: 104 },
      dots: [
        { x: 132, y: 318 },
        { x: 228, y: 468 },
        { x: 486, y: 286 },
        { x: 768, y: 372 },
        { x: 828, y: 214 }
      ],
      rifts: [],
      posts: [],
      jitter: 38,
      flee: 1.08
    },
    {
      name: "裂口",
      sub: "RIFT",
      hint: "品红裂口会吞点，绕着走",
      toast: "裂口会吞散点，别从上面推过去",
      time: 42,
      ring: { x: 812, y: 428 },
      pen: { x: 38, y: 146, w: 184, h: 244, open: "e", gate: 100 },
      dots: [
        { x: 628, y: 176 },
        { x: 708, y: 258 },
        { x: 792, y: 196 },
        { x: 646, y: 368 },
        { x: 868, y: 318 }
      ],
      rifts: [{ x: 478, y: 268, r: 48 }],
      posts: [],
      jitter: 34,
      flee: 1.14
    },
    {
      name: "桩径",
      sub: "POSTS",
      hint: "桩会挡点。从缝里挤进栏",
      toast: "绕过光桩，从窄缝送入",
      time: 44,
      ring: { x: 150, y: 150 },
      pen: { x: 678, y: 318, w: 226, h: 176, open: "n", gate: 88 },
      dots: [
        { x: 176, y: 286 },
        { x: 258, y: 198 },
        { x: 198, y: 408 },
        { x: 428, y: 156 },
        { x: 132, y: 478 },
        { x: 352, y: 348 }
      ],
      rifts: [],
      posts: [
        { x: 548, y: 214, r: 22 },
        { x: 624, y: 398, r: 26 },
        { x: 496, y: 338, r: 18 }
      ],
      jitter: 32,
      flee: 1.1
    },
    {
      name: "夜牧",
      sub: "NIGHT",
      hint: "两边都有裂口。收拢，再送进窄门",
      toast: "最后一栏。裂口两边守着",
      time: 50,
      ring: { x: 480, y: 488 },
      pen: { x: 388, y: 26, w: 184, h: 126, open: "s", gate: 74 },
      dots: [
        { x: 118, y: 208 },
        { x: 176, y: 392 },
        { x: 304, y: 486 },
        { x: 668, y: 468 },
        { x: 828, y: 348 },
        { x: 846, y: 186 },
        { x: 520, y: 312 }
      ],
      rifts: [
        { x: 248, y: 132, r: 36 },
        { x: 712, y: 132, r: 36 },
        { x: 480, y: 352, r: 30 }
      ],
      posts: [
        { x: 352, y: 248, r: 15 },
        { x: 608, y: 248, r: 15 }
      ],
      jitter: 46,
      flee: 1.22
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
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const stageLabel = document.getElementById("stage-label");
  const herdLabel = document.getElementById("herd-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) hintEl.textContent = "拖动光圈赶点 · 送到青栏口";

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, id: null, x: 0, y: 0, wx: 480, wy: 270 };

  const particles = [];
  const ripples = [];
  const motes = [];
  const trails = [];

  const G = {
    mode: "title",
    stage: 0,
    t: 0,
    clock: 0,
    remain: 36,
    lives: LIVES,
    penned: 0,
    total: 0,
    pennedAll: 0,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: "#00f0ff",
    toastT: 0,
    clearT: 0,
    dieT: 0,
    why: "",
    paused: false,
    hud: "",
    ring: { x: 240, y: 360, vx: 0, vy: 0, spin: 0, pulse: 0 },
    dots: [],
    pen: null,
    rifts: [],
    posts: [],
    flee: 1,
    jitter: 30,
    warned: false
  };

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) { /* ignore */ }
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
    noise: function (dur, vol, from, to) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(from || 700, t);
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      f.Q.value = 0.75;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.14, "sine", 0.055, 392);
      this.beep(294, 0.2, "triangle", 0.04, 588);
    },
    pen: function (n, total) {
      this.ensure();
      const u = n / Math.max(1, total);
      this.beep(420 + u * 220, 0.12, "triangle", 0.08, 840 + u * 260);
      this.beep(630 + u * 180, 0.2, "sine", 0.05, 1260);
    },
    clear: function () {
      this.ensure();
      this.beep(392, 0.12, "triangle", 0.07, 784);
      this.beep(523, 0.18, "sine", 0.06, 1046);
    },
    win: function () {
      this.ensure();
      this.beep(392, 0.16, "triangle", 0.08, 784);
      this.beep(523, 0.22, "sine", 0.065, 1046);
      this.beep(784, 0.36, "sine", 0.05, 1568);
    },
    lose: function () {
      this.ensure();
      this.beep(196, 0.42, "sawtooth", 0.07, 70);
      this.beep(98, 0.58, "square", 0.04, 40);
    },
    rift: function () {
      this.ensure();
      this.noise(0.22, 0.12, 420, 90);
      this.beep(140, 0.28, "sawtooth", 0.06, 50);
    },
    time: function () {
      this.ensure();
      this.beep(880, 0.06, "square", 0.035, 440);
    },
    bump: function (str) {
      this.ensure();
      this.beep(90 + str * 40, 0.05, "sine", 0.02 + str * 0.02, 60);
    },
    tickDrone: function (play, spd) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 48;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(46 + spd * 18, t, 0.12);
      this.droneGain.gain.setTargetAtTime(play ? 0.012 + spd * 0.02 : 0.0001, t, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 120) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || "c"
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: max || 52, t: 1, col: col || "c" });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("gold", kind === "gold");
    toastEl.classList.remove("hidden");
    G.toastT = 2.35;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.2 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.7 + 0.12
      });
    }
  }

  function gateCenter(pen) {
    const cx = pen.x + pen.w * 0.5;
    const cy = pen.y + pen.h * 0.5;
    if (pen.open === "w") return { x: pen.x, y: cy };
    if (pen.open === "e") return { x: pen.x + pen.w, y: cy };
    if (pen.open === "n") return { x: cx, y: pen.y };
    return { x: cx, y: pen.y + pen.h };
  }

  function penInside(x, y, pen, pad) {
    const p = pad || 10;
    return x > pen.x + p && x < pen.x + pen.w - p && y > pen.y + p && y < pen.y + pen.h - p;
  }

  function inGateSlot(x, y, pen, extra) {
    const e = extra || 0;
    const g = pen.gate * 0.5 + e;
    const cx = pen.x + pen.w * 0.5;
    const cy = pen.y + pen.h * 0.5;
    const t = 14 + e;
    if (pen.open === "w") return Math.abs(y - cy) < g && x > pen.x - 8 - e && x < pen.x + t + 10;
    if (pen.open === "e") return Math.abs(y - cy) < g && x < pen.x + pen.w + 8 + e && x > pen.x + pen.w - t - 10;
    if (pen.open === "n") return Math.abs(x - cx) < g && y > pen.y - 8 - e && y < pen.y + t + 10;
    return Math.abs(x - cx) < g && y < pen.y + pen.h + 8 + e && y > pen.y + pen.h - t - 10;
  }

  function nearGate(x, y, pen) {
    const g = gateCenter(pen);
    const inward = penInward(pen);
    const lx = x - g.x;
    const ly = y - g.y;
    const along = -lx * inward.x + -ly * inward.y;
    const across = lx * inward.y - ly * inward.x;
    return along > -16 && along < 92 && Math.abs(across) < pen.gate * 0.55 + 8;
  }

  function penInward(pen) {
    if (pen.open === "w") return { x: 1, y: 0 };
    if (pen.open === "e") return { x: -1, y: 0 };
    if (pen.open === "n") return { x: 0, y: 1 };
    return { x: 0, y: -1 };
  }

  function bounceCircle(p, cx, cy, r) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = hypot2(dx, dy);
    const min = r + p.r;
    if (d === 0 || d >= min) return false;
    const nx = dx / d;
    const ny = dy / d;
    const overlap = min - d;
    p.x += nx * overlap;
    p.y += ny * overlap;
    const vn = p.vx * nx + p.vy * ny;
    if (vn < 0) {
      p.vx -= nx * vn * 1.55;
      p.vy -= ny * vn * 1.55;
    }
    return true;
  }

  function bounceWalls(p) {
    const minX = WALL + p.r;
    const maxX = WORLD_W - WALL - p.r;
    const minY = WALL + p.r;
    const maxY = WORLD_H - WALL - p.r;
    if (p.x < minX) {
      p.x = minX;
      p.vx = Math.abs(p.vx) * 0.62;
    } else if (p.x > maxX) {
      p.x = maxX;
      p.vx = -Math.abs(p.vx) * 0.62;
    }
    if (p.y < minY) {
      p.y = minY;
      p.vy = Math.abs(p.vy) * 0.62;
    } else if (p.y > maxY) {
      p.y = maxY;
      p.vy = -Math.abs(p.vy) * 0.62;
    }
  }

  function bouncePen(p, pen, trapped) {
    const t = 9;
    const x0 = pen.x;
    const y0 = pen.y;
    const x1 = pen.x + pen.w;
    const y1 = pen.y + pen.h;
    const cx = (x0 + x1) * 0.5;
    const cy = (y0 + y1) * 0.5;
    const g = pen.gate * 0.5;

    function hitSeg(ax, ay, bx, by) {
      const abx = bx - ax;
      const aby = by - ay;
      const apx = p.x - ax;
      const apy = p.y - ay;
      const ab2 = abx * abx + aby * aby;
      let u = ab2 > 0 ? (apx * abx + apy * aby) / ab2 : 0;
      u = clamp(u, 0, 1);
      bounceCircle(p, ax + abx * u, ay + aby * u, t * 0.5);
    }

    if (trapped) {
      const inset = t + p.r - 1;
      if (p.x < x0 + inset) {
        p.x = x0 + inset;
        p.vx = Math.abs(p.vx) * 0.4;
      }
      if (p.x > x1 - inset) {
        p.x = x1 - inset;
        p.vx = -Math.abs(p.vx) * 0.4;
      }
      if (p.y < y0 + inset) {
        p.y = y0 + inset;
        p.vy = Math.abs(p.vy) * 0.4;
      }
      if (p.y > y1 - inset) {
        p.y = y1 - inset;
        p.vy = -Math.abs(p.vy) * 0.4;
      }
      return;
    }

    if (pen.open === "n") {
      hitSeg(x0, y0, cx - g, y0);
      hitSeg(cx + g, y0, x1, y0);
    } else {
      hitSeg(x0, y0, x1, y0);
    }
    if (pen.open === "s") {
      hitSeg(x0, y1, cx - g, y1);
      hitSeg(cx + g, y1, x1, y1);
    } else {
      hitSeg(x0, y1, x1, y1);
    }
    if (pen.open === "w") {
      hitSeg(x0, y0, x0, cy - g);
      hitSeg(x0, cy + g, x0, y1);
    } else {
      hitSeg(x0, y0, x0, y1);
    }
    if (pen.open === "e") {
      hitSeg(x1, y0, x1, cy - g);
      hitSeg(x1, cy + g, x1, y1);
    } else {
      hitSeg(x1, y0, x1, y1);
    }
  }

  function cloneDots(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      out.push({
        x: s.x,
        y: s.y,
        vx: rand(-12, 12),
        vy: rand(-12, 12),
        r: DOT_R,
        heading: rand(0, TAU),
        spin: rand(0.6, 1.6) * (Math.random() < 0.5 ? -1 : 1),
        penned: false,
        pop: 0,
        trail: [],
        phase: rand(0, TAU)
      });
    }
    return out;
  }

  function loadStage(index, silent) {
    const s = STAGES[index];
    G.stage = index;
    G.remain = s.time;
    G.clock = 0;
    G.lock = 0.28;
    G.clearT = 0;
    G.dieT = 0;
    G.why = "";
    G.warned = false;
    G.flee = s.flee;
    G.jitter = s.jitter;
    G.pen = {
      x: s.pen.x,
      y: s.pen.y,
      w: s.pen.w,
      h: s.pen.h,
      open: s.pen.open,
      gate: s.pen.gate,
      glow: 0
    };
    G.rifts = [];
    for (let i = 0; i < s.rifts.length; i++) {
      const r = s.rifts[i];
      G.rifts.push({ x: r.x, y: r.y, r: r.r, spin: rand(0, TAU) });
    }
    G.posts = [];
    for (let i = 0; i < s.posts.length; i++) {
      const p = s.posts[i];
      G.posts.push({ x: p.x, y: p.y, r: p.r });
    }
    G.dots = cloneDots(s.dots);
    G.total = G.dots.length;
    G.penned = 0;
    G.ring.x = s.ring.x;
    G.ring.y = s.ring.y;
    G.ring.vx = 0;
    G.ring.vy = 0;
    G.ring.pulse = 0;
    pointer.wx = s.ring.x;
    pointer.wy = s.ring.y;
    particles.length = 0;
    ripples.length = 0;
    trails.length = 0;
    if (!silent) {
      toast(s.toast);
      hintEl.textContent = coarse ? "拖动光圈赶点 · 送到青栏口" : s.hint;
    }
  }

  function startRun() {
    G.mode = "play";
    G.lives = LIVES;
    G.pennedAll = 0;
    G.shake = 0;
    G.flash = 0;
    hideOverlay();
    loadStage(0);
    audio.start();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "HERD";
      ovTitle.textContent = "牧点";
      ovLead.innerHTML = "用一圈光把散点赶进栏。<br />贴在后面推，冲太猛会从两侧漏走。";
      ovOps.textContent = "WASD / 方向键赶圈 · 拖拽跟随 · M 静音";
      ovBtn.textContent = "开牧";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "归栏";
      ovLead.textContent = "五栏尽牧。散点都还亮着。";
      ovOps.textContent = "入栏 " + G.pennedAll + " · 剩命 " + G.lives;
      ovBtn.textContent = "再牧一次";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "走失";
      let why = "点散了，栏是空的。";
      if (G.why === "rift") why = "裂口把点吞了。";
      else if (G.why === "time") why = "夜色压下来，来不及了。";
      ovLead.textContent = why;
      ovOps.textContent = STAGES[G.stage].name + " · 入栏 " + G.penned + "/" + G.total;
      ovBtn.textContent = "再牧一次";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function retry() {
    audio.ensure();
    startRun();
  }

  function onMain() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startRun();
  }

  function fail(why) {
    if (G.mode !== "play") return;
    G.why = why;
    G.mode = "die";
    G.dieT = DIE_T;
    G.lock = 1;
    G.shake = why === "rift" ? 9 : 6;
    G.flash = 0.36;
    G.flashCol = "#ff3db8";
    if (why === "rift") {
      audio.rift();
      toast("吞没", "warn");
    } else {
      audio.beep(180, 0.2, "sawtooth", 0.05, 70);
      toast("超时", "warn");
    }
  }

  function finishDie() {
    G.lives -= 1;
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.lose();
      showOverlay("lose");
      return;
    }
    G.mode = "play";
    loadStage(G.stage);
    toast("还剩 " + G.lives + " 命", "warn");
  }

  function penDot(d) {
    if (d.penned) return;
    d.penned = true;
    d.pop = 0.001;
    d.vx *= 0.35;
    d.vy *= 0.35;
    G.penned += 1;
    G.pennedAll += 1;
    G.pen.glow = 1;
    if (G.mode === "play") audio.pen(G.penned, G.total);
    G.flash = 0.22;
    G.flashCol = "#00f0ff";
    ripple(d.x, d.y, "c", 46);
    emit(14, {
      x: d.x, y: d.y, j: 6,
      vx0: -90, vx1: 90, vy0: -120, vy1: 40,
      life: 0.42, r0: 1.2, r1: 3.4, col: "c"
    });
    if (G.mode !== "play") return;
    if (G.penned >= G.total) {
      toast("入栏", "gold");
      G.mode = "clear";
      G.clearT = CLEAR_T;
      G.lock = 1;
      audio.clear();
    } else {
      toast("入栏 " + G.penned + "/" + G.total);
    }
  }

  function nextStage() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      audio.win();
      showOverlay("win");
      return;
    }
    G.mode = "play";
    loadStage(G.stage + 1);
  }

  function herdPoint() {
    const pen = G.pen;
    const gate = gateCenter(pen);
    let cx = 0;
    let cy = 0;
    let n = 0;
    for (let i = 0; i < G.dots.length; i++) {
      const d = G.dots[i];
      if (d.penned) continue;
      cx += d.x;
      cy += d.y;
      n += 1;
    }
    if (!n) return { x: G.ring.x, y: G.ring.y };
    cx /= n;
    cy /= n;
    const dx = cx - gate.x;
    const dy = cy - gate.y;
    const dist = hypot2(dx, dy) || 1;
    const behind = RING_R + 36;
    return {
      x: clamp(cx + (dx / dist) * behind, WALL + RING_R, WORLD_W - WALL - RING_R),
      y: clamp(cy + (dy / dist) * behind, WALL + RING_R, WORLD_H - WALL - RING_R)
    };
  }

  function moveRing(dt, ai) {
    const r = G.ring;
    let ax = 0;
    let ay = 0;
    if (ai) {
      const t = herdPoint();
      ax = t.x - r.x;
      ay = t.y - r.y;
      const d = hypot2(ax, ay) || 1;
      const spd = Math.min(RING_SPD * 0.42, d * 2.2);
      const tvx = (ax / d) * spd;
      const tvy = (ay / d) * spd;
      r.vx = lerp(r.vx, tvx, 1 - Math.exp(-4.2 * dt));
      r.vy = lerp(r.vy, tvy, 1 - Math.exp(-4.2 * dt));
    } else if (pointer.down) {
      const dx = pointer.wx - r.x;
      const dy = pointer.wy - r.y;
      const d = hypot2(dx, dy);
      if (d > 1) {
        const spd = Math.min(RING_SPD, d * 6.5);
        const tvx = (dx / d) * spd;
        const tvy = (dy / d) * spd;
        r.vx = lerp(r.vx, tvx, 1 - Math.exp(-14 * dt));
        r.vy = lerp(r.vy, tvy, 1 - Math.exp(-14 * dt));
      } else {
        r.vx *= Math.exp(-RING_DAMP * dt);
        r.vy *= Math.exp(-RING_DAMP * dt);
      }
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax || ay) {
        const m = hypot2(ax, ay);
        ax /= m;
        ay /= m;
        r.vx += ax * RING_ACC * dt;
        r.vy += ay * RING_ACC * dt;
      } else {
        r.vx *= Math.exp(-RING_DAMP * dt);
        r.vy *= Math.exp(-RING_DAMP * dt);
      }
      const sp = hypot2(r.vx, r.vy);
      if (sp > RING_SPD) {
        r.vx = (r.vx / sp) * RING_SPD;
        r.vy = (r.vy / sp) * RING_SPD;
      }
    }
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    const minX = WALL + RING_R * 0.35;
    const maxX = WORLD_W - WALL - RING_R * 0.35;
    const minY = WALL + RING_R * 0.35;
    const maxY = WORLD_H - WALL - RING_R * 0.35;
    if (r.x < minX) {
      r.x = minX;
      r.vx = 0;
    }
    if (r.x > maxX) {
      r.x = maxX;
      r.vx = 0;
    }
    if (r.y < minY) {
      r.y = minY;
      r.vy = 0;
    }
    if (r.y > maxY) {
      r.y = maxY;
      r.vy = 0;
    }
    r.spin += dt * (1.1 + hypot2(r.vx, r.vy) * 0.008);
    if (r.pulse > 0) r.pulse = Math.max(0, r.pulse - dt * 2.4);
    if (hypot2(r.vx, r.vy) > 40 && Math.random() < 0.35) {
      if (trails.length > 28) trails.shift();
      trails.push({ x: r.x, y: r.y, t: 1, r: RING_VIS * 0.92 });
    }
  }

  function updateDots(dt) {
    const ring = G.ring;
    const dots = G.dots;
    const pen = G.pen;
    const fleeMul = G.flee;
    let bump = 0;

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      if (d.pop > 0) d.pop += dt;
      if (d.penned) {
        d.heading += d.spin * dt * 0.4;
        d.vx += Math.cos(d.heading) * 18 * dt;
        d.vy += Math.sin(d.heading) * 18 * dt;
        const pcx = pen.x + pen.w * 0.5;
        const pcy = pen.y + pen.h * 0.5;
        d.vx += (pcx - d.x) * 0.55 * dt;
        d.vy += (pcy - d.y) * 0.55 * dt;
        d.vx *= Math.exp(-2.4 * dt);
        d.vy *= Math.exp(-2.4 * dt);
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        bouncePen(d, pen, true);
        continue;
      }

      d.heading += wrap(rand(-1, 1) * G.jitter * 0.018 + d.spin * dt * 0.2);
      let fx = Math.cos(d.heading) * 46;
      let fy = Math.sin(d.heading) * 46;

      const rdx = d.x - ring.x;
      const rdy = d.y - ring.y;
      const rd = hypot2(rdx, rdy) || 0.001;
      const nx = rdx / rd;
      const ny = rdy / rd;
      const range = RING_R + 118;
      if (rd < range) {
        const u = 1 - rd / range;
        const str = u * u * 620 * fleeMul;
        fx += nx * str;
        fy += ny * str;
      }

      if (nearGate(d.x, d.y, pen) || inGateSlot(d.x, d.y, pen, 8)) {
        const inn = penInward(pen);
        fx += inn.x * 210;
        fy += inn.y * 210;
        const g = gateCenter(pen);
        fx += (g.x + inn.x * 36 - d.x) * 2.4;
        fy += (g.y + inn.y * 36 - d.y) * 2.4;
      }

      let sx = 0;
      let sy = 0;
      let cx = 0;
      let cy = 0;
      let axv = 0;
      let ayv = 0;
      let nC = 0;
      for (let j = 0; j < dots.length; j++) {
        if (j === i) continue;
        const o = dots[j];
        if (o.penned) continue;
        const dx = d.x - o.x;
        const dy = d.y - o.y;
        const dist = hypot2(dx, dy) || 0.001;
        if (dist < 22) {
          sx += (dx / dist) * (22 - dist);
          sy += (dy / dist) * (22 - dist);
        }
        if (dist < 86) {
          cx += o.x;
          cy += o.y;
          axv += o.vx;
          ayv += o.vy;
          nC += 1;
        }
      }
      fx += sx * 18;
      fy += sy * 18;
      if (nC) {
        cx = cx / nC - d.x;
        cy = cy / nC - d.y;
        fx += cx * 0.55;
        fy += cy * 0.55;
        fx += (axv / nC - d.vx) * 0.35;
        fy += (ayv / nC - d.vy) * 0.35;
      }

      d.vx += fx * dt;
      d.vy += fy * dt;
      const sp = hypot2(d.vx, d.vy);
      const max = DOT_MAX * (0.82 + fleeMul * 0.18);
      if (sp > max) {
        d.vx = (d.vx / sp) * max;
        d.vy = (d.vy / sp) * max;
      }
      d.vx *= Math.exp(-1.15 * dt);
      d.vy *= Math.exp(-1.15 * dt);
      d.x += d.vx * dt;
      d.y += d.vy * dt;

      const minD = RING_R + d.r;
      const rdx2 = d.x - ring.x;
      const rdy2 = d.y - ring.y;
      const rd2 = hypot2(rdx2, rdy2) || 0.001;
      if (rd2 < minD) {
        const nx2 = rdx2 / rd2;
        const ny2 = rdy2 / rd2;
        const ov = minD - rd2;
        d.x += nx2 * ov;
        d.y += ny2 * ov;
        const rvn = d.vx * nx2 + d.vy * ny2;
        const ringVn = ring.vx * nx2 + ring.vy * ny2;
        const rel = rvn - ringVn;
        if (rel < 0) {
          d.vx -= nx2 * rel * 1.72;
          d.vy -= ny2 * rel * 1.72;
          d.vx += ring.vx * 0.28;
          d.vy += ring.vy * 0.28;
          bump = Math.max(bump, Math.min(1, -rel / 180));
        }
        ring.pulse = Math.max(ring.pulse, 0.35);
      }

      bounceWalls(d);
      bouncePen(d, pen, false);
      for (let p = 0; p < G.posts.length; p++) {
        bounceCircle(d, G.posts[p].x, G.posts[p].y, G.posts[p].r);
      }
      for (let k = 0; k < G.rifts.length; k++) {
        const rf = G.rifts[k];
        if (hypot2(d.x - rf.x, d.y - rf.y) < rf.r - 2) {
          emit(22, {
            x: d.x, y: d.y, j: 8,
            vx0: -160, vx1: 160, vy0: -180, vy1: 80,
            life: 0.5, r0: 1.2, r1: 3.8, col: "m"
          });
          ripple(rf.x, rf.y, "m", 70);
          d.x = -999;
          fail("rift");
          return;
        }
      }

      if (penInside(d.x, d.y, pen, 4)) {
        const inn = penInward(pen);
        d.vx += inn.x * 80 * dt;
        d.vy += inn.y * 80 * dt;
      }
      if (penInside(d.x, d.y, pen, 16)) penDot(d);

      d.trail.push({ x: d.x, y: d.y });
      if (d.trail.length > 7) d.trail.shift();
    }

    for (let i = 0; i < dots.length; i++) {
      if (dots[i].penned) continue;
      for (let j = i + 1; j < dots.length; j++) {
        if (dots[j].penned) continue;
        const a = dots[i];
        const b = dots[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = hypot2(dx, dy) || 0.001;
        const min = a.r + b.r + 1.2;
        if (dist < min) {
          const nx = dx / dist;
          const ny = dy / dist;
          const ov = (min - dist) * 0.5;
          a.x -= nx * ov;
          a.y -= ny * ov;
          b.x += nx * ov;
          b.y += ny * ov;
        }
      }
    }

    if (bump > 0.35 && Math.random() < 0.12) audio.bump(bump);
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 70 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.55;
      r.r += (r.max - r.r) * 6.2 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt * 2.4;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
    for (let i = 0; i < G.rifts.length; i++) G.rifts[i].spin += dt * 1.6;
    if (G.pen) G.pen.glow = Math.max(0, G.pen.glow - dt * 1.8);
    G.shake = Math.max(0, G.shake - dt * 16);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    if (G.mode === "play") {
      if (G.lock <= 0) G.remain -= dt;
      if (G.remain < 8 && !G.warned) {
        G.warned = true;
        toast("时间不多", "warn");
        audio.time();
      }
      if (G.remain <= 0) {
        G.remain = 0;
        fail("time");
      }
    }
    if (G.mode === "play" || G.mode === "clear" || G.mode === "die") {
      moveRing(dt, false);
      if (G.mode === "play") updateDots(dt);
    }
    if (G.mode === "clear") {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
    if (G.mode === "die") {
      G.dieT -= dt;
      if (G.dieT <= 0) finishDie();
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    if (!G.pen) loadStage(0);
    G.remain = STAGES[0].time;
    moveRing(dt, true);
    updateDots(dt);
    if (G.penned >= G.total) loadStage(0, true);
  }

  function syncHud(force) {
    const key = G.mode + ":" + G.stage + ":" + G.lives + ":" + G.penned + ":" + (G.remain | 0);
    if (!force && key === G.hud) return;
    G.hud = key;
    if (G.mode === "title") {
      stageLabel.textContent = "牧点";
      herdLabel.textContent = "HERD";
      timeLabel.textContent = "";
      timeLabel.classList.remove("warn");
    } else {
      const s = STAGES[G.stage];
      stageLabel.textContent = "关卡 " + (G.stage + 1) + "/" + STAGES.length + " · " + s.name + " " + s.sub;
      herdLabel.textContent = "入栏 " + G.penned + "/" + G.total;
      const t = Math.max(0, G.remain);
      timeLabel.textContent = t.toFixed(1);
      timeLabel.classList.toggle("warn", t < 8 && G.mode === "play");
    }
    let html = "";
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? " on warn" : " on") : "") + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function glowDot(x, y, r, col, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = r * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function colOf(c) {
    if (c === "m") return "#ff3db8";
    if (c === "g") return "#ffe36b";
    return "#00f0ff";
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.045)";
    ctx.lineWidth = 1;
    for (let x = WALL; x < WORLD_W - WALL; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, WALL);
      ctx.lineTo(x, WORLD_H - WALL);
      ctx.stroke();
    }
    for (let y = WALL; y < WORLD_H - WALL; y += 40) {
      ctx.beginPath();
      ctx.moveTo(WALL, y);
      ctx.lineTo(WORLD_W - WALL, y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(255, 61, 184, 0.22)";
    ctx.shadowColor = "#ff3db8";
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    roundRect(WALL - 4, WALL - 4, WORLD_W - WALL * 2 + 8, WORLD_H - WALL * 2 + 8, 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawPen(pen) {
    const g = gateCenter(pen);
    const inn = penInward(pen);
    const glow = 0.55 + pen.glow * 0.45;
    ctx.save();
    ctx.fillStyle = "rgba(0, 240, 255, " + (0.05 + pen.glow * 0.08) + ")";
    roundRect(pen.x, pen.y, pen.w, pen.h, 10);
    ctx.fill();

    const hatch = ctx.createLinearGradient(pen.x, pen.y, pen.x + inn.x * 80, pen.y + inn.y * 80);
    hatch.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    hatch.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = hatch;
    roundRect(pen.x, pen.y, pen.w, pen.h, 10);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 240, 255, " + (0.55 * glow) + ")";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 14 + pen.glow * 10;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const x0 = pen.x;
    const y0 = pen.y;
    const x1 = pen.x + pen.w;
    const y1 = pen.y + pen.h;
    const cx = (x0 + x1) * 0.5;
    const cy = (y0 + y1) * 0.5;
    const half = pen.gate * 0.5;

    ctx.beginPath();
    if (pen.open === "n") {
      ctx.moveTo(x0, y0);
      ctx.lineTo(cx - half, y0);
      ctx.moveTo(cx + half, y0);
      ctx.lineTo(x1, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x0, y1);
      ctx.lineTo(x0, y0);
    } else if (pen.open === "s") {
      ctx.moveTo(x0, y1);
      ctx.lineTo(cx - half, y1);
      ctx.moveTo(cx + half, y1);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x1, y0);
      ctx.lineTo(x0, y0);
      ctx.lineTo(x0, y1);
    } else if (pen.open === "w") {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, cy - half);
      ctx.moveTo(x0, cy + half);
      ctx.lineTo(x0, y1);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x1, y0);
      ctx.lineTo(x0, y0);
    } else {
      ctx.moveTo(x1, y0);
      ctx.lineTo(x1, cy - half);
      ctx.moveTo(x1, cy + half);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x0, y1);
      ctx.lineTo(x0, y0);
      ctx.lineTo(x1, y0);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (pen.open === "w" || pen.open === "e") {
      ctx.moveTo(g.x, g.y - half);
      ctx.lineTo(g.x, g.y + half);
    } else {
      ctx.moveTo(g.x - half, g.y);
      ctx.lineTo(g.x + half, g.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (let k = 0; k < 3; k++) {
      const t = (k + 1) / 4;
      const px = g.x + inn.x * (12 + t * 28);
      const py = g.y + inn.y * (12 + t * 28);
      ctx.globalAlpha = 0.25 + t * 0.35;
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const ox = -inn.y * 7;
      const oy = inn.x * 7;
      ctx.moveTo(px - ox - inn.x * 5, py - oy - inn.y * 5);
      ctx.lineTo(px, py);
      ctx.lineTo(px + ox - inn.x * 5, py + oy - inn.y * 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const corners = [
      [x0, y0], [x1, y0], [x0, y1], [x1, y1]
    ];
    for (let i = 0; i < 4; i++) {
      glowDot(corners[i][0], corners[i][1], 3.2, "#00f0ff", 0.7);
    }
    ctx.restore();
  }

  function drawRift(rf) {
    ctx.save();
    ctx.translate(rf.x, rf.y);
    ctx.rotate(rf.spin);
    const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, rf.r + 8);
    grd.addColorStop(0, "rgba(20, 4, 16, 0.92)");
    grd.addColorStop(0.45, "rgba(255, 61, 184, 0.28)");
    grd.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, rf.r + 10, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#ff3db8";
    ctx.shadowColor = "#ff3db8";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, rf.r * 0.92, 0, TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 61, 184, 0.45)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const a0 = (i / 5) * TAU;
      ctx.beginPath();
      ctx.arc(0, 0, rf.r * (0.28 + i * 0.12), a0, a0 + 1.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPost(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const grd = ctx.createRadialGradient(-p.r * 0.3, -p.r * 0.3, 2, 0, 0, p.r);
    grd.addColorStop(0, "#2a1840");
    grd.addColorStop(1, "#12081c");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#00f0ff";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 61, 184, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.45, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawDot(d) {
    const penned = d.penned;
    const col = penned ? "#00f0ff" : "#ff3db8";
    const pulse = 0.85 + 0.15 * Math.sin(G.t * (penned ? 3.2 : 7) + d.phase);
    if (!penned) {
      for (let i = 0; i < d.trail.length; i++) {
        const tr = d.trail[i];
        glowDot(tr.x, tr.y, 1.6, col, (i / d.trail.length) * 0.28);
      }
    }
    const pop = d.pop > 0 ? Math.min(0.4, d.pop * 0.8) : 0;
    glowDot(d.x, d.y, (DOT_R - 0.4 + pop * 4) * pulse, col, penned ? 0.96 : 0.92);
    ctx.save();
    ctx.strokeStyle = penned ? "rgba(232,255,255,0.7)" : "rgba(255,208,236,0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(d.x, d.y, DOT_R + 0.6, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = penned ? "#e8ffff" : "#ffd0ec";
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(d.x - 2, d.y - 2.2, 2.4 * pulse, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawRing() {
    const r = G.ring;
    const spd = hypot2(r.vx, r.vy);
    const pulse = RING_VIS + r.pulse * 8 + Math.sin(G.t * 5.5) * 1.4;
    for (let i = 0; i < trails.length; i++) {
      const tr = trails[i];
      ctx.save();
      ctx.globalAlpha = tr.t * 0.18;
      ctx.strokeStyle = "#ff3db8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, tr.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.spin * 0.35);
    const fill = ctx.createRadialGradient(0, 0, 8, 0, 0, pulse);
    fill.addColorStop(0, "rgba(255, 61, 184, 0.08)");
    fill.addColorStop(0.72, "rgba(255, 61, 184, 0.05)");
    fill.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#ff3db8";
    ctx.shadowColor = "#ff3db8";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, TAU);
    ctx.stroke();

    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, pulse - 5.5, 0, TAU);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 0, pulse + 1.2, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      const r0 = pulse - 8;
      const r1 = pulse + 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }

    if (spd > 18) {
      const ang = Math.atan2(r.vy, r.vx);
      ctx.rotate(-r.spin * 0.35 + ang);
      ctx.strokeStyle = "rgba(255, 227, 107, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(pulse - 6, -8);
      ctx.lineTo(pulse + 8, 0);
      ctx.lineTo(pulse - 6, 8);
      ctx.stroke();
    }
    ctx.restore();

    glowDot(r.x, r.y, 3.4, "#ffe36b", 0.55 + Math.sin(G.t * 6) * 0.12);
  }

  function drawWorld() {
    const grd = ctx.createRadialGradient(WORLD_W * 0.35, WORLD_H * 0.2, 20, WORLD_W * 0.6, WORLD_H * 0.7, 740);
    grd.addColorStop(0, "#0a0618");
    grd.addColorStop(1, "#05030c");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb = ctx.createRadialGradient(80, 40, 10, 80, 40, 360);
    neb.addColorStop(0, "rgba(255, 61, 184, 0.13)");
    neb.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb2 = ctx.createRadialGradient(860, 70, 10, 860, 70, 340);
    neb2.addColorStop(0, "rgba(0, 240, 255, 0.1)");
    neb2.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawGrid();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * m.s + m.p));
      glowDot(m.x, (m.y + G.t * 8 * m.s) % WORLD_H, m.r, i % 3 === 0 ? "#ff3db8" : "#00f0ff", a);
    }

    if (G.pen) drawPen(G.pen);
    for (let i = 0; i < G.posts.length; i++) drawPost(G.posts[i]);
    for (let i = 0; i < G.rifts.length; i++) drawRift(G.rifts[i]);

    for (let i = 0; i < G.dots.length; i++) {
      if (G.dots[i].x > -100) drawDot(G.dots[i]);
    }
    drawRing();

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.t) * 0.7;
      ctx.strokeStyle = colOf(r.col);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      glowDot(p.x, p.y, p.r * (p.life / p.max), colOf(p.col), Math.max(0, p.life / p.max));
    }
  }

  function draw() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) : 0;

    ctx.save();
    ctx.beginPath();
    const rw = WORLD_W * view.scale;
    const rh = WORLD_H * view.scale;
    roundRect(view.ox, view.oy, rw, rh, 14);
    ctx.clip();
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);
    drawWorld();
    ctx.restore();

    if (G.flash > 0) {
      ctx.save();
      ctx.globalAlpha = G.flash * 0.26;
      ctx.fillStyle = G.flashCol;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    }
  }

  function resize() {
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    canvas.width = Math.max(1, (view.w * view.dpr) | 0);
    canvas.height = Math.max(1, (view.h * view.dpr) | 0);
    canvas.style.width = view.w + "px";
    canvas.style.height = view.h + "px";
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    view.scale = Math.min(view.w / WORLD_W, view.h / WORLD_H);
    view.ox = (view.w - WORLD_W * view.scale) * 0.5;
    view.oy = (view.h - WORLD_H * view.scale) * 0.5;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale
    };
  }

  let last = 0;
  let acc = 0;
  function loop(now) {
    const t = now * 0.001;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.08) dt = 0.08;
    G.t = t;
    if (!G.paused) {
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        if (G.mode === "title") updateTitle(STEP);
        else if (G.mode === "play" || G.mode === "clear" || G.mode === "die") updatePlay(STEP);
        updateFx(STEP);
        acc -= STEP;
      }
      const spd = hypot2(G.ring.vx, G.ring.vy) / RING_SPD;
      audio.tickDrone(G.mode === "play" || G.mode === "clear" || G.mode === "title", spd);
      syncHud(false);
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "Space") {
      e.preventDefault();
    }
    if (e.code === "KeyM") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      retry();
      return;
    }
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onMain();
      }
      return;
    }
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.l = true;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.r = true;
    if (e.code === "KeyW" || e.code === "ArrowUp") keys.u = true;
    if (e.code === "KeyS" || e.code === "ArrowDown") keys.d = true;
  });

  window.addEventListener("keyup", function (e) {
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.l = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.r = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") keys.u = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") keys.d = false;
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (G.mode !== "play") return;
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.wx = w.x;
    pointer.wy = w.y;
    canvas.classList.add("herding");
  });

  canvas.addEventListener("pointermove", function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
    pointer.wx = w.x;
    pointer.wy = w.y;
  });

  function endPointer() {
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove("herding");
  }

  canvas.addEventListener("pointerup", function (e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    endPointer();
  });
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    onMain();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function () {
    retry();
  });

  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (!document.hidden) {
      last = performance.now() * 0.001;
      acc = 0;
    }
  });

  window.addEventListener("resize", resize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);

  makeMotes();
  resize();
  loadStage(0, true);
  hideToast();
  G.mode = "title";
  showOverlay("title");
  syncHud(true);
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
