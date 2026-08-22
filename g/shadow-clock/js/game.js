(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const LIVES = 3;
  const STEP = 1 / 60;
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const MUTE_KEY = "playbox-shadow-clock-mute";
  const BRANCH = [
    { h: 0, t: "子" },
    { h: 3, t: "卯" },
    { h: 6, t: "午" },
    { h: 9, t: "酉" }
  ];

  const STAGES = [
    {
      name: "初影",
      sub: "FIRST",
      hint: "转木棍，看黑影扫过青色刻度",
      toast: "灯在上，影子在下 · 扫过就亮",
      need: [5, 6, 7],
      ban: [],
      start: 3.15,
      light: 0,
      lightR: 1.46,
      thick: 0.084,
      len: 0.66,
      spin: 0,
      inertia: 0,
      time: 32
    },
    {
      name: "连扫",
      sub: "SWEEP",
      hint: "一口气扫过底下四刻",
      toast: "顺着转，四刻会一颗颗亮",
      need: [4, 5, 6, 7],
      ban: [],
      start: 2.1,
      light: 0,
      lightR: 1.46,
      thick: 0.074,
      len: 0.64,
      spin: 0,
      inertia: 0,
      time: 28
    },
    {
      name: "忌刻",
      sub: "FORBID",
      hint: "粉色刻度碰不得 · 扫完青刻就停",
      toast: "青要扫，粉要躲 · 别转过头",
      need: [5, 6, 7],
      ban: [8],
      start: 3.1,
      light: 0,
      lightR: 1.45,
      thick: 0.062,
      len: 0.64,
      spin: 0,
      inertia: 0,
      time: 26
    },
    {
      name: "偏灯",
      sub: "SIDE",
      hint: "灯在右边。影子改落在左半圈",
      toast: "别对木棍 · 看影子落哪",
      need: [9, 10, 11],
      ban: [],
      start: 6.2,
      light: 3,
      lightR: 1.44,
      thick: 0.06,
      len: 0.64,
      spin: 0,
      inertia: 0,
      time: 24
    },
    {
      name: "夹缝",
      sub: "SLIT",
      hint: "两颗粉夹一缝。从缝里扫过去",
      toast: "四和八是粉 · 只扫五六七",
      need: [5, 6, 7],
      ban: [4, 8],
      start: 3.7,
      light: 0,
      lightR: 1.45,
      thick: 0.05,
      len: 0.62,
      spin: 0,
      inertia: 0,
      time: 22
    },
    {
      name: "绕灯",
      sub: "ORBIT",
      hint: "灯会绕走。先扫能扫的，换边再扫对面",
      toast: "先扫六点 · 灯转到下面再扫十二",
      need: [0, 6],
      ban: [],
      start: 3.2,
      light: 0,
      lightR: 1.42,
      thick: 0.058,
      len: 0.64,
      spin: 0.38,
      inertia: 0,
      time: 30
    },
    {
      name: "细影",
      sub: "THIN",
      hint: "木棍更细。贴着影子中心慢慢扫",
      toast: "影窄了 · 对准再转",
      need: [5, 6, 7, 8],
      ban: [4],
      start: 3.7,
      light: 0,
      lightR: 1.44,
      thick: 0.04,
      len: 0.6,
      spin: 0,
      inertia: 0,
      time: 22
    },
    {
      name: "对径",
      sub: "ACROSS",
      hint: "子午卯酉四刻都要。灯转时躲开粉刻",
      toast: "扫一簇就躲开，等灯转到另一边",
      need: [0, 3, 6, 9],
      ban: [1, 7],
      start: 4.2,
      light: 0,
      lightR: 1.4,
      thick: 0.048,
      len: 0.62,
      spin: 0.34,
      inertia: 0.7,
      time: 32
    },
    {
      name: "追影",
      sub: "CHASE",
      hint: "灯转得快。影子扫到哪，你跟到哪",
      toast: "跟着灯走 · 粉刻转过来之前躲开",
      need: [0, 2, 4, 6, 8, 10],
      ban: [1, 7],
      start: 5.7,
      light: 0,
      lightR: 1.4,
      thick: 0.05,
      len: 0.62,
      spin: 0.42,
      inertia: 0.85,
      time: 30
    },
    {
      name: "子夜",
      sub: "MIDNIGHT",
      hint: "灯狂转，棍有惯性。粉刻夹缝",
      toast: "惯性 · 绕灯 · 细影。子夜到了",
      need: [0, 3, 6, 9],
      ban: [1, 7],
      start: 5.5,
      light: 0,
      lightR: 1.38,
      thick: 0.036,
      len: 0.58,
      spin: 0.42,
      inertia: 1.55,
      time: 30
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
  const btnCcw = document.getElementById("btn-ccw");
  const btnCw = document.getElementById("btn-cw");
  const stageLabel = document.getElementById("stage-label");
  const fitLabel = document.getElementById("fit-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;

  const L = { cx: 0, cy: 0, R: 120, lantern: 16 };

  const keys = { ccw: false, cw: false, fine: false };
  const pad = { ccw: false, cw: false };
  const ptrs = [];

  const stars = [];
  const motes = [];
  const particles = [];
  const sparks = [];
  const ripples = [];
  const floats = [];

  const G = {
    mode: "title",
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    stick: 3.15,
    prevStick: 3.15,
    spinVel: 0,
    light: 0,
    timeLeft: 32,
    armed: 0,
    swept: 0,
    perfects: 0,
    total: 0,
    shake: 0,
    flash: 0,
    flashCol: PINK,
    toastT: 0,
    judge: "",
    judgeT: 0,
    judgeCol: CYAN,
    endT: 0,
    heat: 0,
    held: 0,
    demoT: 0,
    pause: false,
    flashT: 0,
    ticks: [],
    nearBan: false,
    lastPerfect: false,
    flick: 1
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function wrapHour(h) {
    h %= 12;
    if (h < 0) h += 12;
    return h;
  }
  function hourToAng(h) {
    return -Math.PI / 2 + (h / 12) * TAU;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function hexA(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  function stageNow() {
    return STAGES[G.mode === "title" ? 0 : G.stage] || STAGES[0];
  }
  function needCount() {
    return G.ticks.reduce((n, tk) => n + (tk.kind === "need" ? 1 : 0), 0);
  }
  function sweptCount() {
    return G.ticks.reduce((n, tk) => n + (tk.kind === "need" && tk.on ? 1 : 0), 0);
  }

  function distSegSeg(ax, ay, bx, by, cx, cy, dx, dy) {
    const ux = bx - ax;
    const uy = by - ay;
    const vx = dx - cx;
    const vy = dy - cy;
    const wx = ax - cx;
    const wy = ay - cy;
    const aa = ux * ux + uy * uy;
    const bb = ux * vx + uy * vy;
    const cc = vx * vx + vy * vy;
    const dd = ux * wx + uy * wy;
    const ee = vx * wx + vy * wy;
    const det = aa * cc - bb * bb;
    let sc;
    if (det < 1e-8) sc = 0;
    else sc = clamp((bb * ee - cc * dd) / det, 0, 1);
    let tc = cc > 1e-8 ? clamp((bb * sc + ee) / cc, 0, 1) : 0;
    sc = aa > 1e-8 ? clamp((tc * bb - dd) / aa, 0, 1) : 0;
    const px = ax + sc * ux;
    const py = ay + sc * uy;
    const qx = cx + tc * vx;
    const qy = cy + tc * vy;
    return hypot(px - qx, py - qy);
  }

  function stickGeomAt(stickH, st) {
    const a = hourToAng(stickH);
    const dirx = Math.cos(a);
    const diry = Math.sin(a);
    const px = -diry;
    const py = dirx;
    const r0 = L.R * 0.16;
    const r1 = L.R * st.len;
    const hw = L.R * st.thick;
    return {
      ax: L.cx + dirx * r0,
      ay: L.cy + diry * r0,
      bx: L.cx + dirx * r1,
      by: L.cy + diry * r1,
      hw: hw,
      dirx: dirx,
      diry: diry,
      px: px,
      py: py
    };
  }

  function lightPosAt(lightH, st) {
    const a = hourToAng(lightH);
    const d = L.R * st.lightR;
    return { x: L.cx + Math.cos(a) * d, y: L.cy + Math.sin(a) * d };
  }

  function coverDist(stickH, lightH, tickH, st) {
    const g = stickGeomAt(stickH, st);
    const lp = lightPosAt(lightH, st);
    const a = hourToAng(tickH);
    let best = 1e9;
    const samples = [0.9, 0.96, 1.0];
    for (let i = 0; i < samples.length; i++) {
      const fr = samples[i];
      const tx = L.cx + Math.cos(a) * L.R * fr;
      const ty = L.cy + Math.sin(a) * L.R * fr;
      const d = distSegSeg(g.ax, g.ay, g.bx, g.by, lp.x, lp.y, tx, ty);
      if (d < best) best = d;
    }
    return best;
  }

  function isCoveredAt(stickH, lightH, tickH, st) {
    return coverDist(stickH, lightH, tickH, st) < stickGeomAt(stickH, st).hw + L.R * 0.016;
  }

  function silhouette(lp, g) {
    const pts = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = g.ax + (g.bx - g.ax) * t;
      const y = g.ay + (g.by - g.ay) * t;
      pts.push({ x: x + g.px * g.hw, y: y + g.py * g.hw });
      pts.push({ x: x - g.px * g.hw, y: y - g.py * g.hw });
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const c = Math.cos(a) * g.hw;
      const s = Math.sin(a) * g.hw;
      pts.push({ x: g.ax + c, y: g.ay + s });
      pts.push({ x: g.bx + c, y: g.by + s });
    }
    const items = pts.map(function (p) {
      return { p: p, a: Math.atan2(p.y - lp.y, p.x - lp.x) };
    });
    items.sort(function (u, v) {
      return u.a - v.a;
    });
    let best = -1;
    let bi = 0;
    for (let i = 0; i < items.length; i++) {
      const a0 = items[i].a;
      const a1 = items[(i + 1) % items.length].a;
      let gap = a1 - a0;
      if (gap < 0) gap += TAU;
      if (gap > best) {
        best = gap;
        bi = i;
      }
    }
    const p0 = items[(bi + 1) % items.length].p;
    const p1 = items[bi].p;
    const a0 = items[(bi + 1) % items.length].a;
    let a1 = items[bi].a;
    let span = a1 - a0;
    if (span > Math.PI) span -= TAU;
    if (span < -Math.PI) span += TAU;
    return { p0: p0, p1: p1, a0: a0, span: span };
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: hash(i * 3.17),
        y: hash(i * 5.91 + 2.2),
        r: 0.35 + hash(i * 8.3) * 1.4,
        a: 0.12 + hash(i * 1.7) * 0.55,
        p: hash(i * 11.4) * TAU,
        s: 0.5 + hash(i * 2.8) * 2.2,
        c: hash(i * 0.37) > 0.8 ? CYAN : hash(i * 0.61) > 0.88 ? GOLD : "#f4f0ff"
      });
    }
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        t: hash(i * 4.4),
        s: 0.22 + hash(i * 2.1) * 0.7,
        r: 0.5 + hash(i * 7.7) * 1.5,
        w: (hash(i * 1.3) - 0.5) * 0.35
      });
    }
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    drone2: null,
    droneGain: null,
    muted: false,
    lastNear: -9,
    lastTick: -9,
    ensure() {
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
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.26;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) { /* ignore */ }
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
      o.stop(t + dur + 0.03);
    },
    noise(dur, vol, freq) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq || 900;
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    tick() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastTick < 0.042) return;
      this.lastTick = now;
      this.beep(540, 0.026, "square", 0.016, 240);
    },
    sweep(perfect) {
      this.ensure();
      this.beep(perfect ? 784 : 494, 0.1, "triangle", 0.08, perfect ? 1176 : 740);
      this.beep(perfect ? 1174 : 659, 0.22, "sine", perfect ? 0.06 : 0.045);
    },
    miss() {
      this.ensure();
      this.beep(164, 0.34, "sawtooth", 0.08, 52);
      this.noise(0.18, 0.06, 420);
    },
    win() {
      this.ensure();
      this.beep(523, 0.16, "sine", 0.08, 784);
      this.beep(659, 0.28, "triangle", 0.07, 988);
      this.beep(784, 0.42, "sine", 0.06, 1174);
      this.beep(1046, 0.58, "sine", 0.045, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.55, "sawtooth", 0.09, 48);
      this.beep(82, 0.78, "square", 0.05, 36);
    },
    start() {
      this.ensure();
      this.beep(196, 0.16, "sine", 0.07, 392);
      this.beep(294, 0.28, "triangle", 0.05, 588);
    },
    clear() {
      this.ensure();
      this.beep(660, 0.12, "sine", 0.07, 880);
      this.beep(880, 0.28, "triangle", 0.055, 1320);
    },
    warn() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.5) return;
      this.lastNear = now;
      this.beep(220, 0.08, "square", 0.03, 140);
    },
    tickDrone(heat) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o2.type = "triangle";
        o.frequency.value = 49;
        o2.frequency.value = 73.4;
        g.gain.value = 0.0001;
        o.connect(g);
        o2.connect(g);
        g.connect(this.master);
        o.start();
        o2.start();
        this.drone = o;
        this.drone2 = o2;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const playing = G.mode === "play" || G.mode === "flash";
      this.drone.frequency.setTargetAtTime(46 + heat * 28, t, 0.14);
      this.droneGain.gain.setTargetAtTime(
        playing ? 0.01 + heat * 0.028 : 0.0035,
        t,
        0.16
      );
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || CYAN
      });
    }
  }

  function spark(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      if (sparks.length > 90) sparks.shift();
      const a = rand(0, TAU);
      const sp = rand(40, 240);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.16, 0.5),
        col: col
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 12) ripples.shift();
    ripples.push({ x: x, y: y, t: 1, col: col, max: max || L.R * 0.5 });
  }

  function floatAt(x, y, text, col) {
    if (floats.length > 8) floats.shift();
    floats.push({ x: x, y: y, text: text, col: col, t: 1 });
  }

  function burst(x, y, col, n) {
    emit(n, {
      x: x,
      y: y,
      j: 10,
      vx0: -150,
      vx1: 150,
      vy0: -200,
      vy1: 50,
      life: 0.62,
      r0: 1.1,
      r1: 3.4,
      col: col
    });
    spark(x, y, 12, col);
    ripple(x, y, col, L.R * 0.42);
  }

  function tickPos(hour) {
    const a = hourToAng(hour);
    return {
      x: L.cx + Math.cos(a) * L.R,
      y: L.cy + Math.sin(a) * L.R,
      a: a
    };
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.3;
  }

  function judge(text, col) {
    G.judge = text;
    G.judgeCol = col;
    G.judgeT = 0.72;
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDisc(x, y) {
    return hypot(x - L.cx, y - L.cy) <= L.R * 1.22;
  }

  function ptrById(id) {
    for (let i = 0; i < ptrs.length; i++) {
      if (ptrs[i].id === id) return ptrs[i];
    }
    return null;
  }

  function angAt(x, y) {
    return Math.atan2(y - L.cy, x - L.cx);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const showPad = coarse || W < 720;
    document.body.classList.toggle("with-pad", showPad);
    const bottomPad = showPad ? 76 : 16;
    const usable = Math.max(120, H - bottomPad);
    const k = 1.78;
    L.R = clamp(Math.min(W, usable) / (2 * k), 64, 196);
    L.cx = W * 0.5;
    L.cy = usable * 0.5 + 2;
    L.lantern = clamp(L.R * 0.11, 10, 20);
  }

  function syncHud() {
    if (G.mode === "title") {
      stageLabel.textContent = "十面影钟";
      fitLabel.textContent = "影 —";
      fitLabel.classList.remove("warn", "hot");
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
      hintEl.textContent = coarse
        ? "转木棍让影子扫过青刻 · 底栏左右转"
        : "转木棍让影子扫过青刻 · A/D 转棍";
    } else {
      const st = stageNow();
      stageLabel.textContent = st.name + " · " + st.sub;
      const need = needCount();
      const got = sweptCount();
      let fit = "影 " + got + "/" + need;
      let hot = false;
      let warn = false;
      if (G.mode === "flash") {
        fit = G.lastPerfect ? "完美" : "合影";
        hot = true;
      } else if (G.nearBan) {
        fit = "躲开";
        warn = true;
      } else if (got === need && need > 0) {
        fit = "扫尽";
        hot = true;
      } else if (got > 0) {
        hot = true;
      }
      fitLabel.textContent = fit;
      fitLabel.classList.toggle("hot", hot);
      fitLabel.classList.toggle("warn", warn);
      const tl = Math.ceil(Math.max(0, G.timeLeft));
      timeLabel.textContent = G.mode === "play" ? tl + "s" : "—";
      timeLabel.classList.toggle("warn", G.mode === "play" && G.timeLeft < 5);
      hintEl.textContent = st.hint;
    }
    pipsEl.innerHTML = "";
    const show = G.mode === "title" ? 0 : LIVES;
    for (let i = 0; i < show; i++) {
      const pip = document.createElement("span");
      pip.className = "pip";
      if (i < G.lives) {
        pip.classList.add("on");
        if (G.lives <= 1 && G.mode === "play") pip.classList.add("warn");
      }
      pipsEl.appendChild(pip);
    }
  }

  function showPanel(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "SHADOW";
      ovTitle.textContent = "影钟";
      ovLead.innerHTML = "转木棍，让影子扫过刻度。<br />灯在哪，影就在对面。青要扫，粉要躲。";
      ovOps.textContent = coarse
        ? "拖钟面或按底栏 ◀ ▶ · M 静音"
        : "A/D 转棍 · 拖钟面 · 滚轮微调 · M 静音";
      ovBtn.textContent = "拨影";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "钟满";
      ovLead.textContent = "十面刻度都亮了。影扫尽了。";
      ovOps.textContent = "扫过 " + G.total + " 刻 · 完美 " + G.perfects;
      ovBtn.textContent = "再拨一轮";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "影断";
      ovLead.textContent = "灯灭了。这一面没扫完。";
      ovOps.textContent = "已扫 " + G.total + " 刻 · 停在「" + stageNow().name + "」";
      ovBtn.textContent = "再拨一轮";
    }
  }

  function hidePanel() {
    overlay.classList.add("hidden");
  }

  function loadTicks(st) {
    G.ticks = [];
    for (let i = 0; i < st.need.length; i++) {
      G.ticks.push({ hour: st.need[i], kind: "need", on: false, flash: 0, perfect: false });
    }
    for (let i = 0; i < st.ban.length; i++) {
      G.ticks.push({ hour: st.ban[i], kind: "ban", on: false, flash: 0 });
    }
  }

  function beginStage(quiet) {
    const st = STAGES[G.stage];
    G.mode = "play";
    G.t = 0;
    G.stick = st.start;
    G.prevStick = st.start;
    G.spinVel = 0;
    G.light = st.light;
    G.timeLeft = st.time;
    G.armed = 0.55;
    G.nearBan = false;
    G.flashT = 0;
    loadTicks(st);
    if (!quiet) toast(st.toast);
    syncHud();
  }

  function resetRun() {
    G.stage = 0;
    G.lives = LIVES;
    G.swept = 0;
    G.perfects = 0;
    G.total = 0;
    G.shake = 0;
    G.flash = 0;
    G.endT = 0;
    beginStage(false);
    hidePanel();
    audio.start();
  }

  function startWin() {
    G.mode = "win";
    G.endT = 0;
    audio.win();
    burst(L.cx, L.cy, GOLD, 28);
    const lp = lightPosAt(G.light, stageNow());
    burst(lp.x, lp.y, CYAN, 16);
    showPanel("win");
    syncHud();
  }

  function startLose() {
    G.mode = "lose";
    G.endT = 0;
    audio.lose();
    burst(L.cx, L.cy, PINK, 22);
    showPanel("lose");
    syncHud();
  }

  function failStage(why) {
    G.lives -= 1;
    G.flash = 0.46;
    G.flashCol = PINK;
    G.shake = 9;
    G.nearBan = false;
    audio.miss();
    burst(L.cx, L.cy, PINK, 16);
    floatAt(L.cx, L.cy - L.R * 0.18, why, PINK);
    judge(why, PINK);
    toast(why, true);
    syncHud();
    if (G.lives <= 0) {
      startLose();
      return;
    }
    beginStage(true);
  }

  function afterFlash() {
    if (G.stage + 1 >= STAGES.length) {
      startWin();
      return;
    }
    G.stage += 1;
    beginStage(false);
  }

  function markTick(tk, perfect) {
    if (tk.on) return;
    tk.on = true;
    tk.flash = 1;
    tk.perfect = perfect;
    G.total += 1;
    G.swept += 1;
    if (perfect) G.perfects += 1;
    G.lastPerfect = perfect;
    const p = tickPos(tk.hour);
    const col = perfect ? GOLD : CYAN;
    audio.sweep(perfect);
    burst(p.x, p.y, col, perfect ? 16 : 10);
    floatAt(p.x, p.y - 12, perfect ? "完美" : "扫中", col);
    judge(perfect ? "完美" : "扫中", col);
  }

  function sampleHours(a, b, n) {
    let dh = b - a;
    if (dh > 6) dh -= 12;
    if (dh < -6) dh += 12;
    const out = [];
    const steps = Math.max(n, 1 + ((Math.abs(dh) * 18) | 0));
    for (let i = 0; i <= steps; i++) out.push(wrapHour(a + dh * (i / steps)));
    return out;
  }

  function checkSweeps() {
    if (G.mode !== "play" || G.armed > 0) return;
    const st = stageNow();
    const samples = sampleHours(G.prevStick, G.stick, 5);
    G.nearBan = false;

    function sweptHit(tk) {
      let hit = false;
      let best = 1e9;
      for (let s = 0; s < samples.length; s++) {
        const d = coverDist(samples[s], G.light, tk.hour, st);
        if (d < best) best = d;
        if (isCoveredAt(samples[s], G.light, tk.hour, st)) hit = true;
      }
      return { hit: hit, best: best };
    }

    for (let i = 0; i < G.ticks.length; i++) {
      const tk = G.ticks[i];
      if (tk.kind !== "ban") continue;
      if (!sweptHit(tk).hit) continue;
      const p = tickPos(tk.hour);
      burst(p.x, p.y, PINK, 14);
      failStage("擦粉");
      return;
    }
    for (let i = 0; i < G.ticks.length; i++) {
      const tk = G.ticks[i];
      if (tk.kind !== "need" || tk.on) continue;
      const sh = sweptHit(tk);
      if (!sh.hit) continue;
      const g = stickGeomAt(G.stick, st);
      markTick(tk, sh.best < g.hw * 0.48);
    }

    let coveringBan = false;
    for (let i = 0; i < G.ticks.length; i++) {
      const tk = G.ticks[i];
      if (tk.kind !== "ban") continue;
      if (isCoveredAt(G.stick, G.light, tk.hour, st)) coveringBan = true;
    }
    G.nearBan = coveringBan;
    if (coveringBan) audio.warn();

    if (sweptCount() >= needCount()) {
      G.mode = "flash";
      G.flashT = 0.78;
      G.flash = 0.4;
      G.flashCol = GOLD;
      G.spinVel = 0;
      audio.clear();
      burst(L.cx, L.cy, GOLD, 18);
      toast("合影");
      judge("合影", GOLD);
    }
  }

  function keyRate(held) {
    return lerp(1.12, 2.55, clamp(held / 0.48, 0, 1));
  }

  function applySpin(dh) {
    const prev = G.stick;
    G.stick = wrapHour(G.stick + dh);
    const qPrev = Math.floor(prev * 24);
    const qNow = Math.floor(G.stick * 24);
    if (qNow !== qPrev) audio.tick();
  }

  function updateSpin(dt) {
    G.prevStick = G.stick;
    if (G.mode !== "play") {
      G.held = 0;
      if (G.mode === "flash") G.spinVel *= Math.exp(-dt * 8);
      return;
    }
    const st = stageNow();
    let dragging = false;
    for (let i = 0; i < ptrs.length; i++) {
      if (ptrs[i].grab) dragging = true;
    }
    const dir = (keys.cw || pad.cw ? 1 : 0) - (keys.ccw || pad.ccw ? 1 : 0);
    if (dragging) {
      G.held = 0;
    } else if (dir !== 0) {
      G.held += dt;
      let spd = keyRate(G.held);
      if (keys.fine) spd *= 0.28;
      G.spinVel = dir * spd;
      applySpin(G.spinVel * dt);
    } else if (st.inertia > 0 && Math.abs(G.spinVel) > 0.02) {
      applySpin(G.spinVel * dt);
      G.spinVel *= Math.exp(-dt / st.inertia);
      if (Math.abs(G.spinVel) < 0.02) G.spinVel = 0;
    } else {
      G.held = 0;
      if (st.inertia <= 0) G.spinVel = 0;
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.judgeT > 0) G.judgeT -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = 0; i < G.ticks.length; i++) {
      if (G.ticks[i].flash > 0) G.ticks[i].flash = Math.max(0, G.ticks[i].flash - dt * 1.6);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 52 * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const q = sparks[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 0.9;
      q.vy *= 0.9;
      if (q.life <= 0) sparks.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.35;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt * 0.85;
      f.y -= 28 * dt;
      if (f.t <= 0) floats.splice(i, 1);
    }
  }

  function heatNow() {
    const n = needCount();
    if (n <= 0) return 0.12;
    return sweptCount() / n;
  }

  function updatePlay(dt) {
    const st = stageNow();
    G.t += dt;
    if (G.armed > 0) G.armed = Math.max(0, G.armed - dt);
    if (st.spin) G.light = wrapHour(G.light + st.spin * dt);
    G.timeLeft -= dt;
    if (G.timeLeft <= 0) {
      G.timeLeft = 0;
      failStage("时尽");
      return;
    }
    checkSweeps();
  }

  function updateDemo(dt) {
    G.demoT += dt;
    G.stick = wrapHour(3.2 + G.demoT * 0.22 + Math.sin(G.demoT * 0.55) * 0.35);
    G.prevStick = G.stick;
    G.light = 0;
  }

  function update(dt) {
    if (G.pause) {
      updateFx(dt * 0.15);
      return;
    }
    G.clock += dt;
    G.flick = 0.86 + 0.1 * Math.sin(G.clock * 11.3) + 0.05 * Math.sin(G.clock * 23.1);
    updateSpin(dt);
    if (G.mode === "title") updateDemo(dt);
    else if (G.mode === "play") updatePlay(dt);
    else if (G.mode === "flash") {
      G.flashT -= dt;
      if (G.flashT <= 0) afterFlash();
    }
    G.heat = heatNow();
    audio.tickDrone(G.heat);
    updateFx(dt);
    syncHud();
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * s.s + s.p);
      ctx.beginPath();
      ctx.fillStyle = hexA(s.c, s.a * tw);
      ctx.arc(s.x * W, s.y * H, s.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawClockFace() {
    const cx = L.cx;
    const cy = L.cy;
    const R = L.R;

    const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.28);
    halo.addColorStop(0, "rgba(20, 12, 40, 0.0)");
    halo.addColorStop(0.7, "rgba(0, 240, 255, 0.04)");
    halo.addColorStop(1, "rgba(255, 61, 184, 0.05)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.28, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    const face = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.1, cx, cy, R);
    face.addColorStop(0, "#1a1430");
    face.addColorStop(0.55, "#100c1c");
    face.addColorStop(1, "#07050f");
    ctx.fillStyle = face;
    ctx.fill();

    ctx.strokeStyle = hexA(CYAN, 0.55);
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.78, 0, TAU);
    ctx.strokeStyle = hexA(PINK, 0.12);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.22, 0, TAU);
    ctx.strokeStyle = "rgba(201, 163, 106, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    for (let i = 0; i < 60; i++) {
      const a = hourToAng(i / 5);
      const major = i % 5 === 0;
      const r0 = R * (major ? 0.86 : 0.92);
      const r1 = R * 0.97;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.strokeStyle = major ? hexA(CYAN, 0.42) : "rgba(200, 210, 240, 0.16)";
      ctx.lineWidth = major ? 2 : 1;
      ctx.stroke();
    }

    ctx.font = "600 " + Math.max(10, R * 0.09) + "px 'Segoe UI', 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < BRANCH.length; i++) {
      const b = BRANCH[i];
      const a = hourToAng(b.h);
      const x = cx + Math.cos(a) * R * 0.7;
      const y = cy + Math.sin(a) * R * 0.7;
      ctx.fillStyle = "rgba(180, 190, 220, 0.42)";
      ctx.fillText(b.t, x, y);
    }
  }

  function drawLightAndShadow() {
    const st = stageNow();
    const lp = lightPosAt(G.light, st);
    const g = stickGeomAt(G.stick, st);
    const sil = silhouette(lp, g);
    const cx = L.cx;
    const cy = L.cy;
    const R = L.R;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 1.2, 0, TAU);
    ctx.clip();

    const beam = ctx.createRadialGradient(lp.x, lp.y, 4, lp.x, lp.y, R * 2.2);
    beam.addColorStop(0, hexA(GOLD, 0.22 * G.flick));
    beam.addColorStop(0.25, hexA(GOLD, 0.1 * G.flick));
    beam.addColorStop(0.7, hexA(CYAN, 0.03));
    beam.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = beam;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    const steps = 16;
    const reach = R * 4.2;
    ctx.beginPath();
    ctx.moveTo(sil.p0.x, sil.p0.y);
    for (let i = 0; i <= steps; i++) {
      const a = sil.a0 + sil.span * (i / steps);
      ctx.lineTo(lp.x + Math.cos(a) * reach, lp.y + Math.sin(a) * reach);
    }
    ctx.lineTo(sil.p1.x, sil.p1.y);
    ctx.closePath();
    ctx.fillStyle = "rgba(4, 2, 14, 0.62)";
    ctx.fill();

    ctx.strokeStyle = hexA(GOLD, 0.12 * G.flick);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sil.p0.x, sil.p0.y);
    ctx.lineTo(lp.x + Math.cos(sil.a0) * reach * 0.35, lp.y + Math.sin(sil.a0) * reach * 0.35);
    ctx.moveTo(sil.p1.x, sil.p1.y);
    ctx.lineTo(
      lp.x + Math.cos(sil.a0 + sil.span) * reach * 0.35,
      lp.y + Math.sin(sil.a0 + sil.span) * reach * 0.35
    );
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = hexA(GOLD, 0.22 + 0.12 * G.flick);
    ctx.lineWidth = 4;
    ctx.beginPath();
    let rimStarted = false;
    const ox = lp.x - cx;
    const oy = lp.y - cy;
    for (let i = 0; i <= 18; i++) {
      const a = sil.a0 + sil.span * (i / 18);
      const dirx = Math.cos(a);
      const diry = Math.sin(a);
      const b = ox * dirx + oy * diry;
      const c = ox * ox + oy * oy - R * R;
      const disc = b * b - c;
      if (disc < 0) continue;
      const s = Math.sqrt(disc);
      const t1 = -b - s;
      const t2 = -b + s;
      const tHit = t2 > 2 ? t2 : t1 > 2 ? t1 : -1;
      if (tHit <= 0) continue;
      const x = lp.x + dirx * tHit;
      const y = lp.y + diry * tHit;
      if (!rimStarted) {
        ctx.moveTo(x, y);
        rimStarted = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawMotes() {
    const st = stageNow();
    const lp = lightPosAt(G.light, st);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const u = (m.t + G.clock * m.s * 0.12) % 1;
      const a = hourToAng(G.light) + Math.PI + m.w;
      const dist = L.R * (0.1 + u * 1.7);
      const x = lp.x + Math.cos(a) * dist;
      const y = lp.y + Math.sin(a) * dist;
      if (hypot(x - L.cx, y - L.cy) > L.R * 1.05) continue;
      ctx.beginPath();
      ctx.fillStyle = hexA(GOLD, 0.12 + 0.28 * (1 - u) * G.flick);
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawTicks() {
    for (let i = 0; i < G.ticks.length; i++) {
      const tk = G.ticks[i];
      const p = tickPos(tk.hour);
      const a = p.a;
      const R = L.R;
      const inner = R * 0.8;
      const outer = R * 1.045;
      const half = 0.055;
      const x0 = L.cx + Math.cos(a - half) * inner;
      const y0 = L.cy + Math.sin(a - half) * inner;
      const x1 = L.cx + Math.cos(a + half) * inner;
      const y1 = L.cy + Math.sin(a + half) * inner;
      const x2 = L.cx + Math.cos(a + half) * outer;
      const y2 = L.cy + Math.sin(a + half) * outer;
      const x3 = L.cx + Math.cos(a - half) * outer;
      const y3 = L.cy + Math.sin(a - half) * outer;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();

      if (tk.kind === "need") {
        const pulse = 0.55 + 0.45 * Math.sin(G.clock * 4.2 + tk.hour);
        if (tk.on) {
          ctx.fillStyle = hexA(GOLD, 0.78 + tk.flash * 0.2);
          ctx.shadowColor = GOLD;
          ctx.shadowBlur = 14;
        } else {
          ctx.fillStyle = hexA(CYAN, 0.42 + 0.28 * pulse);
          ctx.shadowColor = CYAN;
          ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, tk.on ? 4.2 : 3.4 + pulse * 0.8, 0, TAU);
        ctx.fillStyle = tk.on ? GOLD : CYAN;
        ctx.fill();
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(G.clock * 6.1 + tk.hour);
        ctx.fillStyle = hexA(PINK, 0.38 + 0.28 * pulse);
        ctx.shadowColor = PINK;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        const spike = 5.2;
        ctx.moveTo(p.x + Math.cos(a) * spike, p.y + Math.sin(a) * spike);
        ctx.lineTo(p.x + Math.cos(a + 2.3) * 4.2, p.y + Math.sin(a + 2.3) * 4.2);
        ctx.lineTo(p.x + Math.cos(a - 2.3) * 4.2, p.y + Math.sin(a - 2.3) * 4.2);
        ctx.closePath();
        ctx.fillStyle = PINK;
        ctx.fill();
      }
    }
  }

  function drawStick() {
    const st = stageNow();
    const g = stickGeomAt(G.stick, st);
    ctx.save();
    ctx.lineCap = "round";

    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = g.hw * 2.35;
    ctx.beginPath();
    ctx.moveTo(g.ax + 2, g.ay + 3.5);
    ctx.lineTo(g.bx + 2, g.by + 3.5);
    ctx.stroke();

    const gx = g.ax - g.px * g.hw;
    const gy = g.ay - g.py * g.hw;
    const hx = g.ax + g.px * g.hw;
    const hy = g.ay + g.py * g.hw;
    const grad = ctx.createLinearGradient(gx, gy, hx, hy);
    grad.addColorStop(0, "#3a1c10");
    grad.addColorStop(0.22, "#8a5230");
    grad.addColorStop(0.48, "#d4a06a");
    grad.addColorStop(0.7, "#a56a3c");
    grad.addColorStop(1, "#4a2816");
    ctx.strokeStyle = grad;
    ctx.lineWidth = g.hw * 2;
    ctx.beginPath();
    ctx.moveTo(g.ax, g.ay);
    ctx.lineTo(g.bx, g.by);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 230, 190, 0.28)";
    ctx.lineWidth = Math.max(1, g.hw * 0.28);
    ctx.beginPath();
    ctx.moveTo(g.ax + g.px * g.hw * 0.35, g.ay + g.py * g.hw * 0.35);
    ctx.lineTo(g.bx + g.px * g.hw * 0.35, g.by + g.py * g.hw * 0.35);
    ctx.stroke();

    ctx.strokeStyle = "rgba(40, 18, 10, 0.35)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const x = lerp(g.ax, g.bx, t);
      const y = lerp(g.ay, g.by, t);
      ctx.beginPath();
      ctx.moveTo(x - g.px * g.hw * 0.7, y - g.py * g.hw * 0.7);
      ctx.lineTo(x + g.px * g.hw * 0.7, y + g.py * g.hw * 0.7);
      ctx.stroke();
    }

    ctx.fillStyle = "#b08a4a";
    ctx.beginPath();
    ctx.arc(g.bx, g.by, g.hw * 1.08, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#f0d090";
    ctx.lineWidth = 1;
    ctx.stroke();

    const cwx = L.cx - g.dirx * L.R * 0.11;
    const cwy = L.cy - g.diry * L.R * 0.11;
    ctx.fillStyle = "#7a5a32";
    ctx.beginPath();
    ctx.arc(cwx, cwy, g.hw * 0.72, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawHub() {
    const r = L.R * 0.11;
    const grd = ctx.createRadialGradient(L.cx - r * 0.3, L.cy - r * 0.35, 2, L.cx, L.cy, r);
    grd.addColorStop(0, "#f0d48a");
    grd.addColorStop(0.45, "#c9a36a");
    grd.addColorStop(1, "#6a4a22");
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, r, 0, TAU);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = hexA(GOLD, 0.55);
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(L.cx, L.cy, r * 0.38, 0, TAU);
    ctx.fillStyle = "#3a2410";
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const a = i * TAU / 4 + 0.5;
      ctx.beginPath();
      ctx.arc(L.cx + Math.cos(a) * r * 0.68, L.cy + Math.sin(a) * r * 0.68, r * 0.09, 0, TAU);
      ctx.fillStyle = "#5a3a14";
      ctx.fill();
    }
  }

  function drawLantern() {
    const st = stageNow();
    const lp = lightPosAt(G.light, st);
    const r = L.lantern;
    const glow = ctx.createRadialGradient(lp.x, lp.y, 1, lp.x, lp.y, r * 4.2);
    glow.addColorStop(0, hexA(GOLD, 0.55 * G.flick));
    glow.addColorStop(0.35, hexA(GOLD, 0.16 * G.flick));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lp.x, lp.y, r * 4.2, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(lp.x, lp.y);
    ctx.rotate(hourToAng(G.light) + Math.PI / 2);

    ctx.fillStyle = "#8a6230";
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.15);
    ctx.lineTo(-r * 0.7, r * 0.85);
    ctx.lineTo(r * 0.7, r * 0.85);
    ctx.lineTo(r * 0.55, -r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hexA(GOLD, 0.55 + 0.3 * G.flick);
    ctx.beginPath();
    ctx.ellipse(0, r * 0.22, r * 0.28, r * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hexA("#fff6c8", 0.7 * G.flick);
    ctx.beginPath();
    ctx.ellipse(0, r * 0.08, r * 0.14, r * 0.26, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#c9a36a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.15);
    ctx.lineTo(0, -r * 0.62);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -r * 0.78, r * 0.16, 0, TAU);
    ctx.stroke();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(lp.x, lp.y, 2.2, 0, TAU);
    ctx.fillStyle = "#fff6c8";
    ctx.fill();
  }

  function drawFx() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.max * (1 - r.t), 0, TAU);
      ctx.strokeStyle = hexA(r.col, r.t * 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.beginPath();
      ctx.fillStyle = hexA(q.col, (q.life / q.max) * 0.9);
      ctx.arc(q.x, q.y, q.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const q = sparks[i];
      ctx.beginPath();
      ctx.strokeStyle = hexA(q.col, Math.min(1, q.life * 3));
      ctx.lineWidth = 1.4;
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - q.vx * 0.02, q.y - q.vy * 0.02);
      ctx.stroke();
    }
    ctx.font = "700 " + Math.max(12, L.R * 0.1) + "px 'Segoe UI', 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = hexA(f.col, f.t);
      ctx.fillText(f.text, f.x, f.y);
    }
    if (G.judgeT > 0) {
      ctx.save();
      ctx.font = "900 " + Math.max(22, L.R * 0.22) + "px 'Segoe UI', 'PingFang SC', sans-serif";
      ctx.fillStyle = hexA(G.judgeCol, clamp(G.judgeT * 1.4, 0, 1));
      ctx.shadowColor = G.judgeCol;
      ctx.shadowBlur = 18;
      ctx.fillText(G.judge, L.cx, L.cy - L.R * 0.28);
      ctx.restore();
    }
  }

  function draw() {
    const sx = G.shake ? rand(-G.shake, G.shake) : 0;
    const sy = G.shake ? rand(-G.shake, G.shake) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W * 0.5, H * 0.2, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    bg.addColorStop(0, "#120818");
    bg.addColorStop(1, "#05030c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawStars();

    ctx.save();
    ctx.translate(sx, sy);
    drawClockFace();
    drawLightAndShadow();
    drawMotes();
    drawTicks();
    drawStick();
    drawHub();
    drawLantern();
    drawFx();
    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = hexA(G.flashCol, G.flash * 0.18);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function loop(now) {
    const t = now * 0.001;
    if (!loop.last) loop.last = t;
    let dt = t - loop.last;
    loop.last = t;
    if (dt > 0.08) dt = 0.08;
    loop.bag += dt;
    while (loop.bag >= STEP) {
      update(STEP);
      loop.bag -= STEP;
    }
    draw();
    requestAnimationFrame(loop);
  }
  loop.bag = 0;
  loop.last = 0;

  function onKey(e, down) {
    const k = e.key;
    if (k === " " || k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault();
    }
    if (k === "a" || k === "A" || k === "ArrowLeft" || k === "q" || k === "Q") {
      keys.ccw = down;
    }
    if (k === "d" || k === "D" || k === "ArrowRight" || k === "e" || k === "E") {
      keys.cw = down;
    }
    if (k === "Shift") keys.fine = down;
    if (!down) return;
    if (e.repeat) return;
    if (k === "m" || k === "M") {
      audio.ensure();
      audio.setMuted(!audio.muted);
    } else if (k === "r" || k === "R") {
      audio.ensure();
      resetRun();
    } else if (k === " " || k === "Enter") {
      e.preventDefault();
      audio.ensure();
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") resetRun();
    }
  }

  function bindHold(el, flag) {
    const start = (e) => {
      e.preventDefault();
      pad[flag] = true;
      el.classList.add("held");
      audio.ensure();
    };
    const end = () => {
      pad[flag] = false;
      el.classList.remove("held");
    };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointerleave", end);
    el.addEventListener("pointercancel", end);
  }

  bindHold(btnCcw, "ccw");
  bindHold(btnCw, "cw");

  btnMute.addEventListener("click", () => {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", () => {
    audio.ensure();
    resetRun();
  });
  ovBtn.addEventListener("click", () => {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") resetRun();
  });

  canvas.addEventListener("pointerdown", (e) => {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    const p = canvasPos(e);
    if (!onDisc(p.x, p.y)) return;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("grabbing");
    ptrs.push({
      id: e.pointerId,
      x: p.x,
      y: p.y,
      ang: angAt(p.x, p.y),
      grab: true
    });
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = ptrById(e.pointerId);
    if (!p || !p.grab) return;
    const pos = canvasPos(e);
    const ang = angAt(pos.x, pos.y);
    let d = ang - p.ang;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    const dh = (d * 12) / TAU;
    if (G.mode === "play") {
      applySpin(dh);
      const v = clamp(dh / 0.016, -6, 6);
      G.spinVel = G.spinVel * 0.5 + v * 0.5;
    }
    p.ang = ang;
    p.x = pos.x;
    p.y = pos.y;
  });

  function endPtr(e) {
    const p = ptrById(e.pointerId);
    if (!p) return;
    for (let i = ptrs.length - 1; i >= 0; i--) {
      if (ptrs[i].id === e.pointerId) ptrs.splice(i, 1);
    }
    if (ptrs.length === 0) canvas.classList.remove("grabbing");
  }
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);

  canvas.addEventListener("wheel", (e) => {
    if (G.mode !== "play") return;
    e.preventDefault();
    audio.ensure();
    const fine = e.shiftKey || keys.fine;
    const step = (e.deltaY > 0 ? 1 : -1) * (fine ? 0.035 : 0.1);
    applySpin(step);
    G.spinVel = 0;
  }, { passive: false });

  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));
  window.addEventListener("blur", () => {
    keys.ccw = keys.cw = keys.fine = false;
    pad.ccw = pad.cw = false;
  });
  document.addEventListener("visibilitychange", () => {
    G.pause = document.hidden;
    if (!G.pause) loop.last = 0;
  });
  window.addEventListener("resize", resize);

  makeStars();
  makeMotes();
  loadTicks(STAGES[0]);
  resize();
  showPanel("title");
  syncHud();
  requestAnimationFrame(loop);
})();
