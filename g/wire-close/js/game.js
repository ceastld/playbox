(() => {
  "use strict";

  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SAMPLE = 0.016;
  const REWIND = 0.022;
  const PAD = 0.034;
  const SRC_X = 0.168;
  const DST_X = 0.832;
  const MUTE_KEY = "playbox-wire-close-mute";

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const COLORS = [
    { name: "粉", c: MAG },
    { name: "青", c: CYN },
    { name: "金", c: GOLD },
    { name: "紫", c: { r: 199, g: 125, b: 255 } },
    { name: "翠", c: { r: 61, g: 255, b: 166 } }
  ];

  const STAGES = [
    {
      name: "直通",
      sub: "LINE",
      time: 36,
      hint: "从左岸拖到同色右岸。对准颜色即可。",
      left: [{ c: 0, y: 0.36 }, { c: 1, y: 0.64 }],
      right: [{ c: 0, y: 0.36 }, { c: 1, y: 0.64 }],
      posts: []
    },
    {
      name: "错位",
      sub: "SWAP",
      time: 48,
      hint: "直线必交叉。一条走顶边，一条走底边。",
      left: [{ c: 0, y: 0.32 }, { c: 1, y: 0.68 }],
      right: [{ c: 1, y: 0.32 }, { c: 0, y: 0.68 }],
      posts: [{ x: 0.5, y: 0.5, r: 0.09 }]
    },
    {
      name: "三色",
      sub: "TRIO",
      time: 54,
      hint: "先接能绕开的。外圈边路始终可走。",
      left: [{ c: 0, y: 0.24 }, { c: 1, y: 0.5 }, { c: 2, y: 0.76 }],
      right: [{ c: 1, y: 0.24 }, { c: 2, y: 0.5 }, { c: 0, y: 0.76 }],
      posts: [
        { x: 0.5, y: 0.34, r: 0.072 },
        { x: 0.5, y: 0.66, r: 0.072 }
      ]
    },
    {
      name: "闸门",
      sub: "GATE",
      time: 58,
      hint: "中间有门。粉可以直通，别堵死缝。",
      left: [{ c: 0, y: 0.2 }, { c: 1, y: 0.4 }, { c: 2, y: 0.6 }, { c: 3, y: 0.8 }],
      right: [{ c: 0, y: 0.2 }, { c: 3, y: 0.4 }, { c: 1, y: 0.6 }, { c: 2, y: 0.8 }],
      posts: [
        { x: 0.5, y: 0.3, r: 0.062 },
        { x: 0.5, y: 0.5, r: 0.062 },
        { x: 0.5, y: 0.7, r: 0.062 }
      ]
    },
    {
      name: "双列",
      sub: "COLS",
      time: 64,
      hint: "两排瓷柱。先看右岸颜色再下线。",
      left: [{ c: 0, y: 0.18 }, { c: 1, y: 0.4 }, { c: 2, y: 0.6 }, { c: 3, y: 0.82 }],
      right: [{ c: 2, y: 0.18 }, { c: 3, y: 0.4 }, { c: 0, y: 0.6 }, { c: 1, y: 0.82 }],
      posts: [
        { x: 0.38, y: 0.3, r: 0.058 },
        { x: 0.38, y: 0.7, r: 0.058 },
        { x: 0.62, y: 0.22, r: 0.052 },
        { x: 0.62, y: 0.5, r: 0.06 },
        { x: 0.62, y: 0.78, r: 0.052 }
      ]
    },
    {
      name: "终路",
      sub: "FINAL",
      time: 76,
      hint: "五色终接。贴边通道很窄，交叉即熔。",
      left: [
        { c: 0, y: 0.14 }, { c: 1, y: 0.32 }, { c: 2, y: 0.5 },
        { c: 3, y: 0.68 }, { c: 4, y: 0.86 }
      ],
      right: [
        { c: 4, y: 0.14 }, { c: 0, y: 0.32 }, { c: 3, y: 0.5 },
        { c: 1, y: 0.68 }, { c: 2, y: 0.86 }
      ],
      posts: [
        { x: 0.34, y: 0.26, r: 0.05 },
        { x: 0.34, y: 0.5, r: 0.05 },
        { x: 0.34, y: 0.74, r: 0.05 },
        { x: 0.5, y: 0.18, r: 0.048 },
        { x: 0.5, y: 0.38, r: 0.05 },
        { x: 0.5, y: 0.62, r: 0.05 },
        { x: 0.5, y: 0.82, r: 0.048 },
        { x: 0.66, y: 0.3, r: 0.05 },
        { x: 0.66, y: 0.7, r: 0.05 }
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
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const btnUndo = document.getElementById("btn-undo");
  const btnDrop = document.getElementById("btn-drop");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const view = { w: 1, h: 1, dpr: 1 };
  const board = { x: 0, y: 0, s: 100 };
  const keys = { u: false, d: false, l: false, r: false };
  const particles = [];
  const motes = [];
  const ripples = [];
  const sparks = [];

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    drone: null,
    droneGain: null,
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
      btnMute.classList.toggle("muted", m);
      btnMute.textContent = m ? "静" : "声";
      try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch (e) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol, from, to) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const n = this.ctx.createBuffer(1, (this.ctx.sampleRate * dur) | 0, this.ctx.sampleRate);
      const d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = n;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(from, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(80, to), t + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    pulse(kind) {
      this.ensure();
      if (kind === "pick") {
        this.beep(420, 0.06, "square", 0.04, 720);
        this.beep(880, 0.05, "sine", 0.03);
      } else if (kind === "pin") {
        this.beep(280, 0.04, "triangle", 0.025, 180);
      } else if (kind === "tick") {
        this.beep(760, 0.03, "sine", 0.012);
      } else if (kind === "deny") {
        this.beep(140, 0.1, "square", 0.045, 80);
      } else if (kind === "drop") {
        this.beep(300, 0.07, "sine", 0.03, 160);
      } else if (kind === "connect") {
        this.beep(523, 0.12, "sine", 0.07, 784);
        this.beep(784, 0.2, "triangle", 0.05, 1174);
      } else if (kind === "short") {
        this.noise(0.36, 0.14, 1400, 180);
        this.beep(180, 0.32, "sawtooth", 0.07, 60);
      } else if (kind === "hot") {
        this.beep(210, 0.05, "square", 0.03, 90);
      } else if (kind === "undo") {
        this.beep(300, 0.07, "sine", 0.03, 180);
      } else if (kind === "clear") {
        this.beep(440, 0.12, "triangle", 0.06, 880);
        this.beep(660, 0.22, "sine", 0.05, 1320);
      } else if (kind === "win") {
        this.beep(523, 0.16, "sine", 0.09, 784);
        this.beep(659, 0.28, "triangle", 0.07, 1046);
        this.beep(784, 0.4, "sine", 0.05, 1174);
      } else if (kind === "lose") {
        this.beep(196, 0.5, "sawtooth", 0.09, 60);
        this.beep(98, 0.7, "square", 0.05, 40);
      } else if (kind === "start") {
        this.beep(262, 0.14, "sine", 0.07, 392);
        this.beep(392, 0.2, "triangle", 0.05, 523);
      } else if (kind === "warn") {
        this.beep(880, 0.05, "square", 0.03, 440);
      }
    },
    tickDrone(holding, hot) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 58;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(holding ? (hot ? 86 : 58) : 48, t, 0.12);
      this.droneGain.gain.setTargetAtTime(holding ? (hot ? 0.028 : 0.016) : 0.0001, t, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  const G = {
    mode: "title",
    stage: 0,
    lives: LIVES,
    time: 36,
    t: 0,
    paused: false,
    shake: 0,
    flash: 0,
    flashRgb: "255,61,184",
    toastT: 0,
    lock: 0,
    probe: { x: 0.5, y: 0.5 },
    hold: null,
    wires: [],
    left: [],
    right: [],
    posts: [],
    hover: null,
    pointer: { down: false, id: null, moved: false, sx: 0, sy: 0 },
    follow: false,
    clearT: 0,
    hotWarn: 0,
    tickAcc: 0,
    hudAcc: 0,
    hudKey: ""
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function rgb(c, a) {
    return a == null
      ? "rgb(" + c.r + "," + c.g + "," + c.b + ")"
      : "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function colOf(i) { return COLORS[i % COLORS.length].c; }
  function nameOf(i) { return COLORS[i % COLORS.length].name; }

  function toPx(p) {
    return { x: board.x + p.x * board.s, y: board.y + p.y * board.s };
  }
  function toN(x, y) {
    return { x: (x - board.x) / board.s, y: (y - board.y) / board.s };
  }

  function cross(ax, ay, bx, by) { return ax * by - ay * bx; }

  function segHit(a, b, c, d, eps) {
    const rx = b.x - a.x, ry = b.y - a.y;
    const sx = d.x - c.x, sy = d.y - c.y;
    const den = rx * sy - ry * sx;
    if (Math.abs(den) < 1e-10) return null;
    const qx = c.x - a.x, qy = c.y - a.y;
    const t = (qx * sy - qy * sx) / den;
    const u = (qx * ry - qy * rx) / den;
    const e = eps == null ? 0.004 : eps;
    if (t > e && t < 1 - e && u > e && u < 1 - e) {
      return { x: a.x + t * rx, y: a.y + t * ry };
    }
    return null;
  }

  function segHitsCircle(a, b, cx, cy, r) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const fx = a.x - cx, fy = a.y - cy;
    const A = dx * dx + dy * dy;
    if (A < 1e-12) return fx * fx + fy * fy < r * r ? 0 : null;
    const B = 2 * (fx * dx + fy * dy);
    const C = fx * fx + fy * fy - r * r;
    let disc = B * B - 4 * A * C;
    if (disc < 0) return null;
    disc = Math.sqrt(disc);
    const t1 = (-B - disc) / (2 * A);
    const t2 = (-B + disc) / (2 * A);
    if (t1 > 0.03 && t1 < 0.97) return t1;
    if (t2 > 0.03 && t2 < 0.97) return t2;
    return null;
  }

  function firstPostHit(a, b, skipId) {
    let bestT = 1;
    let best = null;
    const posts = G.posts;
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      if (p.id === skipId) continue;
      const t = segHitsCircle(a, b, p.x, p.y, p.r + 0.014);
      if (t != null && t < bestT) {
        bestT = t;
        best = p;
      }
    }
    return best;
  }

  function wrapPoint(post, from, to) {
    const wind = Math.sign(cross(post.x - from.x, post.y - from.y, to.x - from.x, to.y - from.y)) || 1;
    const vx = to.x - from.x, vy = to.y - from.y;
    const len = Math.hypot(vx, vy) || 1;
    const r = post.r + 0.016;
    return {
      x: post.x + (-vy / len) * wind * r,
      y: post.y + (vx / len) * wind * r,
      postId: post.id
    };
  }

  function separateProbe(p) {
    p.x = clamp(p.x, PAD, 1 - PAD);
    p.y = clamp(p.y, PAD, 1 - PAD);
    const posts = G.posts;
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const dx = p.x - post.x;
      const dy = p.y - post.y;
      const min = post.r + 0.02;
      const d = Math.hypot(dx, dy);
      if (d < min) {
        const k = d < 1e-6 ? min : min / d;
        p.x = post.x + dx * k;
        p.y = post.y + dy * k;
      }
    }
    p.x = clamp(p.x, PAD, 1 - PAD);
    p.y = clamp(p.y, PAD, 1 - PAD);
    return p;
  }

  function blockedMove(from, to) {
    const dest = { x: to.x, y: to.y };
    separateProbe(dest);
    const hit = firstPostHit(from, dest, -1);
    if (!hit) return dest;
    const t = segHitsCircle(from, dest, hit.x, hit.y, hit.r + 0.02);
    if (t == null) return dest;
    const nx = from.x + (dest.x - from.x) * Math.max(0, t - 0.02);
    const ny = from.y + (dest.y - from.y) * Math.max(0, t - 0.02);
    return separateProbe({ x: nx, y: ny });
  }

  function pathOfHold() {
    if (!G.hold) return null;
    const pts = G.hold.pts;
    const out = pts.slice();
    const last = out[out.length - 1];
    const pr = G.probe;
    if (!last || dist(last, pr) > 0.001) out.push({ x: pr.x, y: pr.y });
    return out;
  }

  function pathCross(pts, skipTail) {
    if (!pts || pts.length < 2) return null;
    const skip = skipTail == null ? 7 : skipTail;
    const wires = G.wires;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      for (let w = 0; w < wires.length; w++) {
        const wp = wires[w].pts;
        for (let j = 0; j < wp.length - 1; j++) {
          const hit = segHit(a, b, wp[j], wp[j + 1]);
          if (hit) return hit;
        }
      }
      const last = i + skip;
      for (let j = 0; j < pts.length - 1 && j < last && j < i - 2; j++) {
        const hit = segHit(a, b, pts[j], pts[j + 1], 0.01);
        if (hit) return hit;
      }
    }
    return null;
  }

  function termR() {
    return coarse ? 0.042 : 0.036;
  }

  function hitTerm(p, side) {
    const list = side === "left" ? G.left : G.right;
    const x = side === "left" ? SRC_X : DST_X;
    const r = termR() * (coarse ? 1.25 : 1.15);
    let best = null;
    let bestD = r;
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      const d = Math.hypot(p.x - x, p.y - t.y);
      if (d < bestD) {
        bestD = d;
        best = { side: side, i: i, term: t, d: d };
      }
    }
    return best;
  }

  function nearestFreeSource(p) {
    const r = termR() * (coarse ? 1.35 : 1.2);
    let best = null;
    let bestD = r;
    for (let i = 0; i < G.left.length; i++) {
      const t = G.left[i];
      if (t.on) continue;
      const d = Math.hypot(p.x - SRC_X, p.y - t.y);
      if (d < bestD) {
        bestD = d;
        best = { i: i, term: t, d: d };
      }
    }
    return best;
  }

  function matchingSink(color) {
    for (let i = 0; i < G.right.length; i++) {
      if (G.right[i].c === color) return { i: i, term: G.right[i] };
    }
    return null;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + (Math.random() - 0.5) * spec.j,
        y: spec.y + (Math.random() - 0.5) * spec.j,
        vx: lerp(spec.vx0, spec.vx1, Math.random()),
        vy: lerp(spec.vy0, spec.vy1, Math.random()),
        life: spec.life * (0.65 + Math.random() * 0.5),
        max: spec.life,
        r: lerp(spec.r0, spec.r1, Math.random()),
        col: spec.col
      });
    }
  }

  function ripple(x, y, mag) {
    if (ripples.length > 14) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: mag ? 58 : 36, t: 1, mag: mag });
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.3;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 48; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.3 + 0.3,
        a: Math.random() * 0.18 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.1 + 0.03
      });
    }
  }

  function stageNow() { return STAGES[G.stage]; }

  function renderPips() {
    let html = "";
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives ? " on" : "";
      const warn = G.lives === 1 && i === 0 ? " warn" : "";
      html += '<i class="pip' + on + warn + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function renderHud() {
    const s = stageNow();
    const n = G.left.length;
    let done = 0;
    for (let i = 0; i < G.left.length; i++) if (G.left[i].on) done += 1;
    let timeText = "—";
    let warn = false;
    let live = false;
    if (G.mode === "play") {
      if (G.clearT > 0) {
        timeText = "闭合";
        live = true;
      } else {
        const d = Math.max(0, G.time);
        timeText = "过热 " + d.toFixed(1) + "s";
        warn = d < 8;
        live = !!G.hold && !warn;
      }
    }
    const key = G.mode + "|" + G.stage + "|" + done + "|" + n + "|" + G.lives + "|" + timeText + "|" + !!G.hold + "|" + G.wires.length + "|" + (G.lock > 0);
    if (key === G.hudKey) return;
    G.hudKey = key;
    stageLabel.textContent = "关卡 " + (G.stage + 1) + " / " + STAGES.length + " · " + s.name + " · " + done + "/" + n;
    timeLabel.textContent = timeText;
    timeLabel.classList.toggle("warn", warn);
    timeLabel.classList.toggle("live", live);
    btnUndo.disabled = !(G.mode === "play" && G.wires.length && !G.lock);
    btnDrop.disabled = !(G.mode === "play" && G.hold);
    renderPips();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    ovOps.style.display = "";
    if (kind === "title") {
      ovKicker.textContent = "WIRE";
      ovTitle.textContent = "通电";
      ovLead.innerHTML = "从左岸拖出火线，接到同色右岸。<br />线交叉就会短路。绕开瓷柱，走边路。";
      ovOps.textContent = coarse
        ? "点端子拖到同色 · 点空白放下 · M 静音"
        : "点端子拖到同色 · WASD 移探针 · 空格接驳 · 1-5 选左岸 · Z 撤销 · M 静音";
      ovBtn.textContent = "通电";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLOSED";
      ovTitle.textContent = "全线闭合";
      ovLead.innerHTML = "六块板都接上了。火线进，载端亮。<br />没有一根交叉。";
      ovOps.textContent = "R 再来一局 · M 静音";
      ovBtn.textContent = "再来一局";
    } else if (kind === "lose") {
      panel.classList.add("lose");
      ovKicker.textContent = "SHORT";
      ovTitle.textContent = G.time <= 0 ? "过热熔断" : "短路熔断";
      ovLead.innerHTML = G.time <= 0
        ? "板子过热，保险丝烧了。"
        : "火线交叉，整板短路。<br />三根保险丝用尽。";
      ovOps.textContent = "R 再来一局 · M 静音";
      ovBtn.textContent = "再接一次";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function loadStage(index, msg, warn) {
    const s = STAGES[index];
    G.stage = index;
    G.time = s.time;
    G.hold = null;
    G.follow = false;
    G.wires = [];
    G.clearT = 0;
    G.lock = 0.15;
    G.left = s.left.map(function (t) { return { c: t.c, y: t.y, on: false, pulse: 0 }; });
    G.right = s.right.map(function (t) { return { c: t.c, y: t.y, on: false, pulse: 0 }; });
    G.posts = s.posts.map(function (p, i) {
      return { x: p.x, y: p.y, r: p.r, id: i, glow: 0 };
    });
    G.probe.x = SRC_X + 0.08;
    G.probe.y = G.left[0] ? G.left[0].y : 0.5;
    separateProbe(G.probe);
    hintEl.textContent = s.hint;
    if (msg) toast(msg, warn);
    else toast(s.hint);
    renderHud();
  }

  function resetRun() {
    G.stage = 0;
    G.lives = LIVES;
    G.mode = "play";
    G.shake = 0;
    G.flash = 0;
    hideOverlay();
    loadStage(0, "通电 · 拖到同色右岸");
    audio.pulse("start");
  }

  function pickup(index) {
    if (G.mode !== "play" || G.lock > 0 || G.clearT > 0) return false;
    const t = G.left[index];
    if (!t || t.on) {
      audio.pulse("deny");
      return false;
    }
    if (G.hold) dropLive(false);
    const src = { x: SRC_X, y: t.y };
    G.hold = { color: t.c, src: index, pts: [{ x: src.x, y: src.y }], hot: false, hotAt: null };
    G.probe.x = src.x + 0.02;
    G.probe.y = src.y;
    separateProbe(G.probe);
    t.pulse = 1;
    const px = toPx(src);
    emit(10, {
      x: px.x, y: px.y, j: 8,
      vx0: 20, vx1: 90, vy0: -40, vy1: 40,
      life: 0.35, r0: 1.2, r1: 2.6, col: colOf(t.c)
    });
    ripple(px.x, px.y, false);
    audio.pulse("pick");
    toast("火线 " + nameOf(t.c) + " · 接到右岸同色");
    renderHud();
    return true;
  }

  function dropLive(silent) {
    if (!G.hold) return;
    G.hold = null;
    G.follow = false;
    if (!silent) audio.pulse("drop");
    renderHud();
  }

  function rewindTrail(pr) {
    const pts = G.hold.pts;
    const r2 = REWIND * REWIND;
    for (let i = pts.length - 2; i >= 1; i--) {
      const dx = pts[i].x - pr.x;
      const dy = pts[i].y - pr.y;
      if (dx * dx + dy * dy < r2) {
        pts.length = i + 1;
        return true;
      }
    }
    return false;
  }

  function appendTrail(pr) {
    const pts = G.hold.pts;
    let from = pts[pts.length - 1];
    if (!from) {
      pts.push({ x: pr.x, y: pr.y });
      return;
    }
    if (rewindTrail(pr)) from = pts[pts.length - 1];
    let guard = 0;
    let skip = -1;
    while (guard++ < 8) {
      const hit = firstPostHit(from, pr, skip);
      if (!hit) break;
      if (from.postId === hit.id) break;
      const wrap = wrapPoint(hit, from, pr);
      if (dist(from, wrap) < 0.01) break;
      pts.push(wrap);
      from = wrap;
      skip = hit.id;
      G.posts[hit.id].glow = 1;
      audio.pulse("pin");
    }
    if (dist(from, pr) >= SAMPLE) {
      pts.push({ x: pr.x, y: pr.y });
      if (pts.length > 420) pts.splice(1, 40);
    }
  }

  function tryConnect() {
    if (!G.hold || G.mode !== "play" || G.lock > 0) return false;
    const sink = matchingSink(G.hold.color);
    if (!sink || sink.term.on) return false;
    const pr = G.probe;
    const target = { x: DST_X, y: sink.term.y };
    const reach = termR() * (coarse ? 2.05 : 1.75);
    if (dist(pr, target) > reach) return false;

    const pts = pathOfHold();
    pts.push({ x: target.x, y: target.y });
    const hit = pathCross(pts, 6);
    if (hit) {
      shortAt(hit);
      return true;
    }

    const src = G.left[G.hold.src];
    src.on = true;
    src.pulse = 1;
    sink.term.on = true;
    sink.term.pulse = 1;
    G.wires.push({
      color: G.hold.color,
      pts: pts,
      flow: Math.random(),
      glow: 1
    });
    G.hold = null;
    G.follow = false;

    const px = toPx(target);
    emit(18, {
      x: px.x, y: px.y, j: 10,
      vx0: -80, vx1: 40, vy0: -70, vy1: 70,
      life: 0.5, r0: 1.3, r1: 3.2, col: colOf(src.c)
    });
    ripple(px.x, px.y, false);
    audio.pulse("connect");
    G.flash = 0.22;
    G.flashRgb = "0,240,255";

    let done = 0;
    for (let i = 0; i < G.left.length; i++) if (G.left[i].on) done += 1;
    if (done >= G.left.length) {
      G.clearT = 0.001;
      toast("全线接通");
      audio.pulse("clear");
    } else {
      toast("通电 " + nameOf(src.c) + " · " + done + "/" + G.left.length);
    }
    renderHud();
    return true;
  }

  function shortAt(hit) {
    const n = hit || { x: G.probe.x, y: G.probe.y };
    const px = toPx(n);
    emit(28, {
      x: px.x, y: px.y, j: 8,
      vx0: -140, vx1: 140, vy0: -140, vy1: 140,
      life: 0.55, r0: 1.4, r1: 3.6, col: MAG
    });
    ripple(px.x, px.y, true);
    G.shake = 0.42;
    G.flash = 0.5;
    G.flashRgb = "255,61,184";
    G.hold = null;
    G.follow = false;
    G.lock = 0.45;
    audio.pulse("short");
    toast("短路", true);
    G.lives -= 1;
    renderHud();
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.pulse("lose");
      audio.tickDrone(false, false);
      showOverlay("lose");
    }
  }

  function undo() {
    if (G.mode !== "play" || G.lock > 0 || G.clearT > 0) {
      audio.pulse("deny");
      return;
    }
    if (G.hold) {
      dropLive(false);
      toast("火线收回");
      return;
    }
    if (!G.wires.length) {
      audio.pulse("deny");
      return;
    }
    const w = G.wires.pop();
    for (let i = 0; i < G.left.length; i++) {
      if (G.left[i].c === w.color) G.left[i].on = false;
    }
    for (let i = 0; i < G.right.length; i++) {
      if (G.right[i].c === w.color) G.right[i].on = false;
    }
    audio.pulse("undo");
    toast("撤销 " + nameOf(w.color));
    renderHud();
  }

  function actAtProbe() {
    if (G.mode !== "play" || G.lock > 0) return;
    if (G.hold) {
      if (tryConnect()) return;
      const wrong = hitTerm(G.probe, "right");
      if (wrong && !wrong.term.on && wrong.term.c !== G.hold.color) {
        audio.pulse("deny");
        toast("极性不符 · " + nameOf(G.hold.color) + " 接 " + nameOf(wrong.term.c), true);
        wrong.term.pulse = 1;
        G.shake = 0.12;
        return;
      }
      audio.pulse("deny");
      return;
    }
    const src = nearestFreeSource(G.probe);
    if (src) pickup(src.i);
    else audio.pulse("deny");
  }

  function winOrNext() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      audio.pulse("win");
      audio.tickDrone(false, false);
      showOverlay("win");
      return;
    }
    loadStage(G.stage + 1, STAGES[G.stage + 1].name);
    audio.pulse("start");
  }

  function timeoutFail() {
    G.lives -= 1;
    G.shake = 0.3;
    G.flash = 0.4;
    G.flashRgb = "255,61,184";
    audio.pulse("short");
    renderPips();
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.pulse("lose");
      audio.tickDrone(false, false);
      showOverlay("lose");
      return;
    }
    loadStage(G.stage, "过热 −1 命 · 重接本关", true);
  }

  function moveProbeToward(nx, ny, dt, keyed) {
    const from = { x: G.probe.x, y: G.probe.y };
    let dest;
    if (keyed) {
      const spd = G.hold ? 0.58 : 0.78;
      dest = {
        x: from.x + nx * spd * dt,
        y: from.y + ny * spd * dt
      };
    } else {
      dest = { x: nx, y: ny };
    }
    const next = blockedMove(from, dest);
    G.probe.x = next.x;
    G.probe.y = next.y;
    if (G.hold) appendTrail(G.probe);
  }

  function eventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches && e.touches[0]
      ? e.touches[0]
      : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : e);
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function pointerNorm(e) {
    const p = eventPos(e);
    return toN(p.x, p.y);
  }

  function updateHover(p) {
    G.hover = hitTerm(p, "left") || hitTerm(p, "right");
  }

  function tick(dt) {
    G.t += dt;
    if (G.paused) return;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.4);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);
    if (G.hotWarn > 0) G.hotWarn = Math.max(0, G.hotWarn - dt);

    for (let i = 0; i < G.left.length; i++) G.left[i].pulse = Math.max(0, G.left[i].pulse - dt * 2.2);
    for (let i = 0; i < G.right.length; i++) G.right[i].pulse = Math.max(0, G.right[i].pulse - dt * 2.2);
    for (let i = 0; i < G.posts.length; i++) G.posts[i].glow = Math.max(0, G.posts[i].glow - dt * 2);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.6;
      r.r += dt * r.max * 1.8;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t -= dt;
      if (sparks[i].t <= 0) sparks.splice(i, 1);
    }

    if (G.mode !== "play") {
      audio.tickDrone(false, false);
      return;
    }

    if (G.clearT > 0) {
      G.clearT += dt;
      audio.tickDrone(false, false);
      if (G.clearT > 0.9) {
        G.clearT = 0;
        winOrNext();
      }
      return;
    }

    G.time -= dt;
    if (G.time <= 0) {
      G.time = 0;
      timeoutFail();
      return;
    }
    if (G.time < 8 && ((G.time * 2) | 0) !== (((G.time + dt) * 2) | 0)) audio.pulse("warn");
    G.hudAcc += dt;
    if (G.hudAcc > 0.1) {
      G.hudAcc = 0;
      renderHud();
    }

    if (!G.follow) {
      let dx = 0, dy = 0;
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx || dy) {
        const n = Math.hypot(dx, dy) || 1;
        moveProbeToward(dx / n, dy / n, dt, true);
      }
    }

    if (G.hold) {
      const pts = pathOfHold();
      const hit = pathCross(pts, 7);
      const was = G.hold.hot;
      G.hold.hot = !!hit;
      G.hold.hotAt = hit;
      if (hit && !was) {
        audio.pulse("hot");
        G.hotWarn = 1.2;
        toast("交叉 · 松开会短路", true);
        const px = toPx(hit);
        emit(8, {
          x: px.x, y: px.y, j: 6,
          vx0: -50, vx1: 50, vy0: -50, vy1: 50,
          life: 0.28, r0: 1, r1: 2.2, col: MAG
        });
      }
      G.tickAcc += dt;
      if (G.tickAcc > 0.16) {
        G.tickAcc = 0;
        const tip = toPx(G.probe);
        emit(1, {
          x: tip.x, y: tip.y, j: 3,
          vx0: -8, vx1: 8, vy0: -8, vy1: 8,
          life: 0.22, r0: 1, r1: 1.8, col: G.hold.hot ? MAG : colOf(G.hold.color)
        });
      }
    }
    audio.tickDrone(!!G.hold, !!(G.hold && G.hold.hot));

    for (let i = 0; i < G.wires.length; i++) {
      G.wires[i].flow += dt * 0.35;
      G.wires[i].glow = Math.max(0, G.wires[i].glow - dt);
    }
  }

  function polyLen(pts) {
    let n = 0;
    for (let i = 0; i < pts.length - 1; i++) n += dist(pts[i], pts[i + 1]);
    return n;
  }

  function pointAlong(pts, t) {
    const L = polyLen(pts);
    if (L < 1e-6) return pts[0];
    let d = ((t % 1) + 1) % 1 * L;
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = dist(pts[i], pts[i + 1]);
      if (d <= seg) {
        const k = seg < 1e-6 ? 0 : d / seg;
        return { x: lerp(pts[i].x, pts[i + 1].x, k), y: lerp(pts[i].y, pts[i + 1].y, k) };
      }
      d -= seg;
    }
    return pts[pts.length - 1];
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

  function strokePoly(pts, width, color, glow) {
    if (pts.length < 2) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (glow) {
      ctx.strokeStyle = rgb(color, 0.18);
      ctx.lineWidth = width * 3.2;
      ctx.beginPath();
      const p0 = toPx(pts[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < pts.length; i++) {
        const p = toPx(pts[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = rgb(color, 0.95);
    ctx.lineWidth = width;
    ctx.beginPath();
    const a = toPx(pts[0]);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < pts.length; i++) {
      const p = toPx(pts[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function drawTerm(term, side) {
    const x = side === "left" ? SRC_X : DST_X;
    const p = toPx({ x: x, y: term.y });
    const r = termR() * board.s;
    const col = colOf(term.c);
    const pulse = term.pulse;
    const hover = G.hover && G.hover.term === term;
    const target = G.hold && side === "right" && G.hold.color === term.c && !term.on;
    const srcLive = G.hold && side === "left" && G.left[G.hold.src] === term;

    ctx.save();
    ctx.fillStyle = rgb(col, 0.12 + pulse * 0.18 + (target || srcLive ? 0.12 : 0));
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * (1.7 + pulse * 0.35 + (target ? Math.sin(G.t * 7) * 0.12 : 0)), 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgb(col, hover || target || srcLive ? 0.95 : 0.7);
    ctx.lineWidth = term.on ? 3.2 : 2.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = term.on ? rgb(col, 0.88) : "rgba(8, 6, 16, 0.92)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.52, 0, TAU);
    ctx.fill();

    if (term.on) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(p.x - r * 0.12, p.y - r * 0.12, r * 0.16, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = rgb(col, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.28, 0, TAU);
      ctx.stroke();
    }

    ctx.font = "600 " + Math.max(10, r * 0.55) + "px 'PingFang SC','Noto Sans SC',sans-serif";
    ctx.fillStyle = rgb(col, 0.9);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lx = p.x + (side === "left" ? -r * 1.85 : r * 1.85);
    ctx.fillText(nameOf(term.c), lx, p.y);
    ctx.restore();
  }

  function drawPost(post) {
    const p = toPx(post);
    const r = post.r * board.s;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(p.x + 2, p.y + r * 0.55, r * 0.9, r * 0.28, 0, 0, TAU);
    ctx.fill();

    const body = ctx.createLinearGradient(p.x - r, p.y, p.x + r, p.y);
    body.addColorStop(0, "#2a2740");
    body.addColorStop(0.45, "#d8d4e8");
    body.addColorStop(1, "#3a3554");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r * 0.12, r * 0.78, r * 0.92, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgb(CYN, 0.35 + post.glow * 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - r * 0.28, r * 0.72, r * 0.32, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgb(MAG, 0.28 + post.glow * 0.4);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r * 0.22, r * 0.7, r * 0.3, 0, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.ellipse(p.x - r * 0.18, p.y - r * 0.35, r * 0.22, r * 0.12, -0.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const w = view.w;
    const h = view.h;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, w, h);

    const g1 = ctx.createRadialGradient(w * 0.16, h * 0.08, 20, w * 0.16, h * 0.08, w * 0.55);
    g1.addColorStop(0, "rgba(255, 61, 184, 0.14)");
    g1.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createRadialGradient(w * 0.86, h * 0.1, 20, w * 0.86, h * 0.1, w * 0.5);
    g2.addColorStop(0, "rgba(0, 240, 255, 0.1)");
    g2.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = ((m.x + G.t * m.s * 0.02) % 1) * w;
      const my = (((m.y + Math.sin(G.t * 0.3 + m.p) * 0.03) % 1) + 1) % 1 * h;
      ctx.fillStyle = "rgba(200, 210, 255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, TAU);
      ctx.fill();
    }

    let sx = 0, sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * 10 * G.shake;
      sy = (Math.random() - 0.5) * 10 * G.shake;
    }
    ctx.save();
    ctx.translate(sx, sy);

    const bx = board.x, by = board.y, bs = board.s;
    roundRect(bx, by, bs, bs, 18);
    ctx.fillStyle = "rgba(12, 10, 24, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.16)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.save();
    roundRect(bx, by, bs, bs, 18);
    ctx.clip();

    ctx.strokeStyle = "rgba(0, 240, 255, 0.045)";
    ctx.lineWidth = 1;
    const step = bs / 18;
    ctx.beginPath();
    for (let i = 1; i < 18; i++) {
      ctx.moveTo(bx + i * step, by);
      ctx.lineTo(bx + i * step, by + bs);
      ctx.moveTo(bx, by + i * step);
      ctx.lineTo(bx + bs, by + i * step);
    }
    ctx.stroke();

    const screws = [
      [0.045, 0.045], [0.955, 0.045], [0.045, 0.955], [0.955, 0.955]
    ];
    for (let i = 0; i < screws.length; i++) {
      const q = toPx({ x: screws[i][0], y: screws[i][1] });
      ctx.fillStyle = "rgba(40, 36, 60, 0.9)";
      ctx.beginPath();
      ctx.arc(q.x, q.y, 6, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 227, 107, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(q.x - 3, q.y);
      ctx.lineTo(q.x + 3, q.y);
      ctx.stroke();
    }

    ctx.font = "700 " + Math.max(11, bs * 0.028) + "px 'Segoe UI','PingFang SC',sans-serif";
    ctx.fillStyle = "rgba(0, 240, 255, 0.28)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("源", bx + bs * 0.04, by + bs * 0.08);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 61, 184, 0.3)";
    ctx.fillText("载", bx + bs * 0.96, by + bs * 0.08);

    const busL = toPx({ x: SRC_X - 0.07, y: 0.08 });
    const busLB = toPx({ x: SRC_X - 0.07, y: 0.92 });
    ctx.strokeStyle = rgb(MAG, 0.35);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(busL.x, busL.y);
    ctx.lineTo(busLB.x, busLB.y);
    ctx.stroke();
    const busR = toPx({ x: DST_X + 0.07, y: 0.08 });
    const busRB = toPx({ x: DST_X + 0.07, y: 0.92 });
    ctx.strokeStyle = rgb(CYN, 0.35);
    ctx.beginPath();
    ctx.moveTo(busR.x, busR.y);
    ctx.lineTo(busRB.x, busRB.y);
    ctx.stroke();

    for (let i = 0; i < G.posts.length; i++) drawPost(G.posts[i]);

    const wireW = Math.max(3.2, bs * 0.012);
    for (let i = 0; i < G.wires.length; i++) {
      const wr = G.wires[i];
      const col = colOf(wr.color);
      strokePoly(wr.pts, wireW + wr.glow * 2, col, true);
      const nSpark = 3;
      for (let k = 0; k < nSpark; k++) {
        const t = (wr.flow + k / nSpark) % 1;
        const q = toPx(pointAlong(wr.pts, t));
        ctx.fillStyle = rgb(col, 0.95);
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.arc(q.x, q.y, 1.1, 0, TAU);
        ctx.fill();
      }
    }

    if (G.hold) {
      const pts = pathOfHold();
      const col = G.hold.hot ? MAG : colOf(G.hold.color);
      strokePoly(pts, wireW + 1.2, col, true);
      if (G.hold.hot && G.hold.hotAt) {
        const hp = toPx(G.hold.hotAt);
        ctx.strokeStyle = rgb(MAG, 0.7 + Math.sin(G.t * 18) * 0.25);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 8 + Math.sin(G.t * 22) * 2, 0, TAU);
        ctx.stroke();
      }
      const sink = matchingSink(G.hold.color);
      if (sink && !sink.term.on) {
        const ghost = [{ x: G.probe.x, y: G.probe.y }, { x: DST_X, y: sink.term.y }];
        ctx.save();
        ctx.setLineDash([6, 7]);
        ctx.strokeStyle = rgb(colOf(G.hold.color), 0.22);
        ctx.lineWidth = 1.6;
        const ga = toPx(ghost[0]);
        const gb = toPx(ghost[1]);
        ctx.beginPath();
        ctx.moveTo(ga.x, ga.y);
        ctx.lineTo(gb.x, gb.y);
        ctx.stroke();
        ctx.restore();
      }
      const along = pointAlong(pts, (G.t * 0.55) % 1);
      const ap = toPx(along);
      ctx.fillStyle = rgb(col, 0.9);
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, 2.6, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < G.left.length; i++) drawTerm(G.left[i], "left");
    for (let i = 0; i < G.right.length; i++) drawTerm(G.right[i], "right");

    const pr = toPx(G.probe);
    const prR = Math.max(5, board.s * 0.016);
    ctx.fillStyle = rgb(G.hold ? (G.hold.hot ? MAG : colOf(G.hold.color)) : CYN, 0.18);
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, prR * 2.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgb(G.hold ? (G.hold.hot ? MAG : GOLD) : CYN, 0.95);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, prR, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, prR * 0.35, 0, TAU);
    ctx.fill();

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.strokeStyle = r.mag ? rgb(MAG, r.t * 0.7) : rgb(CYN, r.t * 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgb(p.col, Math.max(0, p.life / p.max));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = "rgba(" + G.flashRgb + "," + (G.flash * 0.22) + ")";
      ctx.fillRect(0, 0, w, h);
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
    const pad = 16;
    const side = Math.min(view.w - pad * 2, view.h - pad * 2);
    board.s = Math.max(80, side);
    board.x = (view.w - board.s) * 0.5;
    board.y = (view.h - board.s) * 0.5;
  }

  function onPointerDown(e) {
    if (e.target.closest && e.target.closest("button")) return;
    if (G.mode !== "play") return;
    e.preventDefault();
    audio.ensure();
    const n = pointerNorm(e);
    G.pointer.down = true;
    G.pointer.id = e.pointerId;
    G.pointer.moved = false;
    G.pointer.sx = n.x;
    G.pointer.sy = n.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

    G.probe.x = n.x;
    G.probe.y = n.y;
    separateProbe(G.probe);
    updateHover(G.probe);

    if (G.lock > 0 || G.clearT > 0) return;

    if (G.hold) {
      G.follow = true;
      if (tryConnect()) return;
      const empty = !hitTerm(G.probe, "left") && !hitTerm(G.probe, "right");
      if (empty && dist(n, { x: G.pointer.sx, y: G.pointer.sy }) < 0.01) {
        /* tap handled on up */
      }
      return;
    }
    const src = nearestFreeSource(G.probe);
    if (src) {
      pickup(src.i);
      G.follow = true;
    }
  }

  function onPointerMove(e) {
    if (G.mode !== "play") return;
    const n = pointerNorm(e);
    updateHover(n);
    if (!G.pointer.down && !G.follow) {
      if (!keys.u && !keys.d && !keys.l && !keys.r) {
        G.probe.x = n.x;
        G.probe.y = n.y;
        separateProbe(G.probe);
      }
      return;
    }
    if (G.pointer.down && dist(n, { x: G.pointer.sx, y: G.pointer.sy }) > 0.02) G.pointer.moved = true;
    if (G.follow || G.pointer.down) {
      const from = { x: G.probe.x, y: G.probe.y };
      const next = blockedMove(from, n);
      G.probe.x = next.x;
      G.probe.y = next.y;
      if (G.hold) appendTrail(G.probe);
    }
  }

  function onPointerUp(e) {
    if (!G.pointer.down) return;
    G.pointer.down = false;
    if (G.mode !== "play") {
      G.follow = false;
      return;
    }
    const n = pointerNorm(e);
    G.probe.x = n.x;
    G.probe.y = n.y;
    separateProbe(G.probe);
    const wasMoved = G.pointer.moved;

    if (G.lock > 0 || G.clearT > 0) {
      G.follow = false;
      return;
    }
    if (G.hold) {
      if (tryConnect()) {
        G.follow = false;
        return;
      }
      const wrong = hitTerm(G.probe, "right");
      if (wrong && !wrong.term.on && wrong.term.c !== G.hold.color) {
        audio.pulse("deny");
        toast("极性不符", true);
        G.follow = true;
        return;
      }
      if (!wasMoved) {
        const srcHit = hitTerm(G.probe, "left");
        const dstHit = hitTerm(G.probe, "right");
        if (!srcHit && !dstHit) {
          dropLive(false);
          toast("火线收回");
        }
      } else {
        G.follow = true;
      }
      return;
    }
    G.follow = false;
  }

  function onKey(e) {
    const key = e.key;
    if (key === "m" || key === "M") {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (key === "r" || key === "R") {
      e.preventDefault();
      audio.ensure();
      resetRun();
      return;
    }
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (key === " " || key === "Enter") {
        e.preventDefault();
        audio.ensure();
        resetRun();
      }
      return;
    }
    if (G.mode !== "play") return;
    if (key === "z" || key === "Z") {
      e.preventDefault();
      undo();
      return;
    }
    if (key === "x" || key === "X" || key === "Escape") {
      e.preventDefault();
      if (G.hold) {
        dropLive(false);
        toast("火线收回");
      }
      return;
    }
    if (key === " " || key === "Enter") {
      e.preventDefault();
      audio.ensure();
      actAtProbe();
      return;
    }
    if (key >= "1" && key <= "5") {
      e.preventDefault();
      audio.ensure();
      const i = key.charCodeAt(0) - 49;
      if (G.left[i]) pickup(i);
      return;
    }
    const k = key.toLowerCase();
    if (key === "ArrowUp" || k === "w") { e.preventDefault(); keys.u = true; G.follow = false; }
    else if (key === "ArrowDown" || k === "s") { e.preventDefault(); keys.d = true; G.follow = false; }
    else if (key === "ArrowLeft" || k === "a") { e.preventDefault(); keys.l = true; G.follow = false; }
    else if (key === "ArrowRight" || k === "d") { e.preventDefault(); keys.r = true; G.follow = false; }
  }

  function onKeyUp(e) {
    const key = e.key;
    const k = key.toLowerCase();
    if (key === "ArrowUp" || k === "w") keys.u = false;
    else if (key === "ArrowDown" || k === "s") keys.d = false;
    else if (key === "ArrowLeft" || k === "a") keys.l = false;
    else if (key === "ArrowRight" || k === "d") keys.r = false;
  }

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    resetRun();
  });
  btnUndo.addEventListener("click", function () {
    audio.ensure();
    undo();
  });
  btnDrop.addEventListener("click", function () {
    audio.ensure();
    if (G.hold) {
      dropLive(false);
      toast("火线收回");
    }
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    resetRun();
  });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  window.addEventListener("keydown", onKey, { passive: false });
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (G.paused) audio.tickDrone(false, false);
  });

  makeMotes();
  loadStage(0);
  G.mode = "title";
  resize();
  renderHud();
  showOverlay("title");

  let last = 0;
  let acc = 0;
  function frame(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    while (acc >= STEP) {
      tick(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
