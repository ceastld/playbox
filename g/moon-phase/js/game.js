(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const LIVES = 3;
  const STEP = 1 / 60;
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const MUTE_KEY = "playbox-moon-phase-mute";
  const LIT = "#f3e6c4";
  const DARK = "#14102a";
  const MARKS = [
    { p: 0, name: "朔" },
    { p: 0.25, name: "上弦" },
    { p: 0.5, name: "望" },
    { p: 0.75, name: "下弦" }
  ];
  const PHASE_BANDS = [
    { max: 0.045, name: "朔" },
    { max: 0.17, name: "蛾眉" },
    { max: 0.295, name: "上弦" },
    { max: 0.42, name: "盈凸" },
    { max: 0.545, name: "望" },
    { max: 0.67, name: "亏凸" },
    { max: 0.795, name: "下弦" },
    { max: 0.92, name: "残月" },
    { max: 1.01, name: "朔" }
  ];

  const NIGHTS = [
    {
      name: "朔夜",
      sub: "NEW",
      hint: "转到全暗，对准朔月 · 空格落锁",
      toast: "仪月全暗才是朔 · 落锁",
      goals: [0],
      start: 0.28,
      tol: 0.078,
      time: 28,
      drift: 0,
      inertia: 0,
      clouds: 0
    },
    {
      name: "上弦",
      sub: "FIRST",
      hint: "右边亮着才是上弦",
      toast: "光从右边来 · 半轮即可",
      goals: [0.25],
      start: 0.02,
      tol: 0.068,
      time: 26,
      drift: 0,
      inertia: 0,
      clouds: 0
    },
    {
      name: "望月",
      sub: "FULL",
      hint: "转到全亮，对准望月",
      toast: "一轮满月 · 转过上弦继续",
      goals: [0.5],
      start: 0.14,
      tol: 0.06,
      time: 24,
      drift: 0,
      inertia: 0,
      clouds: 0
    },
    {
      name: "下弦",
      sub: "LAST",
      hint: "左边亮才是下弦，别对成上弦",
      toast: "光在左边 · 和上弦是镜像",
      goals: [0.75],
      start: 0.28,
      tol: 0.052,
      time: 22,
      drift: 0,
      inertia: 0,
      clouds: 0
    },
    {
      name: "蛾眉",
      sub: "SLIVER",
      hint: "蛾眉在右。左边亮的是残月",
      toast: "细钩在右才是蛾眉",
      goals: [0.1],
      start: 0.9,
      tol: 0.038,
      time: 20,
      drift: 0,
      inertia: 0,
      clouds: 0
    },
    {
      name: "盈凸",
      sub: "GIBBOUS",
      hint: "今夜会慢慢亏 · 锁之前再看一眼",
      toast: "月在走 · 对准再锁",
      goals: [0.38],
      start: 0.62,
      tol: 0.03,
      time: 18,
      drift: 0.0075,
      inertia: 0,
      clouds: 0
    },
    {
      name: "残月",
      sub: "ASH",
      hint: "云会挡住今夜。看清再锁",
      toast: "钩在左边 · 云散再看",
      goals: [0.88],
      start: 0.14,
      tol: 0.026,
      time: 16,
      drift: 0,
      inertia: 0,
      clouds: 1
    },
    {
      name: "既望",
      sub: "AFTER",
      hint: "刚过望月。差一线，方向反了",
      toast: "盘有惯性 · 缺在右边才是既望",
      goals: [0.58],
      start: 0.41,
      tol: 0.018,
      time: 14,
      drift: 0.01,
      inertia: 1.7,
      clouds: 0
    },
    {
      name: "连夜",
      sub: "TWIN",
      hint: "先对黄昏，再对黎明 · 两次都要准",
      toast: "黄昏月 · 锁完还有黎明",
      goals: [0.22, 0.78],
      start: 0.48,
      tol: 0.022,
      time: 22,
      drift: 0,
      inertia: 0.9,
      clouds: 1
    },
    {
      name: "中秋",
      sub: "MID",
      hint: "中秋差一线满。盯着缺的那边",
      toast: "一线之差 · 云、飘、惯性都在",
      goals: [0.492],
      start: 0.72,
      tol: 0.012,
      time: 13,
      drift: 0.011,
      inertia: 2.1,
      clouds: 1.25
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
  const btnLock = document.getElementById("btn-lock");
  const btnCcw = document.getElementById("btn-ccw");
  const btnCw = document.getElementById("btn-cw");
  const btnPadLock = document.getElementById("btn-pad-lock");
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

  const L = {
    cx: 0,
    cy: 0,
    R: 120,
    mR: 52,
    sx: 0,
    sy: 0,
    sR: 36,
    landscape: false
  };

  const keys = { ccw: false, cw: false, fine: false };
  const pad = { ccw: false, cw: false };
  const ptrs = [];

  const stars = [];
  const craters = [];
  const clouds = [];
  const particles = [];
  const sparks = [];
  const ripples = [];
  const floats = [];
  const shoots = [];

  const G = {
    mode: "title",
    night: 0,
    goal: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    phase: 0.18,
    spinVel: 0,
    target: 0,
    timeLeft: 28,
    armed: 0,
    locks: 0,
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
    cover: 0,
    lastTickP: 0,
    nearOn: false,
    pause: false,
    lockFlash: 0,
    flashT: 0,
    lastPerfect: false
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
  function wrap01(p) {
    p %= 1;
    if (p < 0) p += 1;
    return p;
  }
  function wrapDelta(d) {
    d %= 1;
    if (d > 0.5) d -= 1;
    if (d < -0.5) d += 1;
    return d;
  }
  function phaseDist(a, b) {
    return Math.abs(wrapDelta(a - b));
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
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
  function phaseName(p) {
    p = wrap01(p);
    for (let i = 0; i < PHASE_BANDS.length; i++) {
      if (p < PHASE_BANDS[i].max) return PHASE_BANDS[i].name;
    }
    return "朔";
  }
  function nightNow() {
    return NIGHTS[G.night];
  }
  function goalNow() {
    const n = nightNow();
    return n.goals[Math.min(G.goal, n.goals.length - 1)];
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 86; i++) {
      stars.push({
        x: hash(i * 3.17),
        y: hash(i * 5.91 + 2.2),
        r: 0.35 + hash(i * 8.3) * 1.35,
        a: 0.12 + hash(i * 1.7) * 0.55,
        p: hash(i * 11.4) * TAU,
        s: 0.6 + hash(i * 2.8) * 2.4,
        c: hash(i * 0.37) > 0.82 ? CYAN : hash(i * 0.61) > 0.9 ? GOLD : "#f4f0ff"
      });
    }
  }

  function makeCraters() {
    craters.length = 0;
    for (let i = 0; i < 16; i++) {
      const ang = hash(i * 17.13) * TAU;
      const rad = Math.sqrt(hash(i * 9.7 + 3)) * 0.78;
      craters.push({
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad,
        r: 0.035 + hash(i * 4.2 + 1.1) * 0.09,
        d: 0.22 + hash(i * 6.1) * 0.5
      });
    }
  }

  function resetClouds(intensity) {
    clouds.length = 0;
    if (intensity <= 0) return;
    const n = intensity > 1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      clouds.push({
        x: -2.4 + i * 1.9 + hash(i * 4.4) * 0.5,
        y: (hash(i * 2.2) - 0.5) * 0.7,
        vx: (0.28 + hash(i * 7.1) * 0.18) * (0.7 + intensity * 0.35),
        w: 1.15 + hash(i * 3.3) * 0.7,
        h: 0.48 + hash(i * 5.5) * 0.22,
        a: 0.55 + intensity * 0.18
      });
    }
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
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
      if (now - this.lastTick < 0.046) return;
      this.lastTick = now;
      this.beep(620, 0.028, "square", 0.018, 280);
    },
    near() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.42) return;
      this.lastNear = now;
      this.beep(1240, 0.07, "sine", 0.04, 1860);
    },
    lockOk(perfect) {
      this.ensure();
      this.beep(perfect ? 784 : 523, 0.12, "triangle", 0.09, perfect ? 1568 : 988);
      this.beep(perfect ? 1174 : 659, 0.26, "sine", perfect ? 0.07 : 0.05);
      if (perfect) this.beep(1568, 0.38, "sine", 0.045, 2093);
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
      this.beep(220, 0.16, "sine", 0.07, 440);
      this.beep(330, 0.28, "triangle", 0.05, 660);
    },
    tickDrone(heat) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o2.type = "triangle";
        o.frequency.value = 55;
        o2.frequency.value = 82.4;
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
      this.drone.frequency.setTargetAtTime(52 + heat * 36, t, 0.14);
      this.droneGain.gain.setTargetAtTime(
        playing ? 0.012 + heat * 0.03 : 0.004,
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
      if (particles.length > 130) particles.shift();
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
    if (ripples.length > 10) ripples.shift();
    ripples.push({ x: x, y: y, t: 1, col: col, max: max || L.R * 0.6 });
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
    ripple(x, y, col, L.mR * 1.8);
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.2;
  }

  function judge(text, col) {
    G.judge = text;
    G.judgeCol = col;
    G.judgeT = 0.78;
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDisc(x, y) {
    return hypot(x - L.cx, y - L.cy) <= L.R * 1.08;
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
    const bottomPad = showPad ? 72 : 18;
    const usable = Math.max(120, H - bottomPad);
    L.landscape = W > H * 1.18;
    if (L.landscape) {
      L.sR = clamp(Math.min(usable * 0.2, W * 0.11), 28, 54);
      L.R = clamp(Math.min(W * 0.28, usable * 0.38), 88, 188);
      L.sx = W * 0.22;
      L.cx = W * 0.64;
      L.sy = usable * 0.46;
      L.cy = usable * 0.52;
    } else {
      L.sR = clamp(Math.min(W * 0.11, usable * 0.09), 26, 50);
      const gap = clamp(usable * 0.055, 30, 52);
      L.R = clamp(Math.min(W * 0.4, usable * 0.34), 86, 200);
      let stack = L.sR * 2 + gap + L.R * 2 + 6;
      if (stack > usable - 12) {
        const s = (usable - 12) / stack;
        L.sR = Math.max(22, L.sR * s);
        L.R = Math.max(70, L.R * s);
        stack = L.sR * 2 + gap + L.R * 2 + 6;
      }
      const top = Math.max(10, (usable - stack) * 0.36);
      L.sx = W * 0.5;
      L.sy = top + L.sR;
      L.cx = W * 0.5;
      L.cy = L.sy + L.sR + gap + L.R;
    }
    L.mR = L.R * 0.42;
  }

  function syncHud() {
    const ready = G.mode === "play" && inWindow();
    btnLock.classList.toggle("ready", ready);
    btnPadLock.classList.toggle("ready", ready);

    if (G.mode === "title") {
      stageLabel.textContent = "观月十夜";
      fitLabel.textContent = "对 —";
      fitLabel.classList.remove("warn", "hot");
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
      hintEl.textContent = coarse
        ? "转圆盘对上今夜月相 · 底栏落锁"
        : "转圆盘对上今夜月相 · 空格落锁";
    } else {
      const n = nightNow();
      const extra = n.goals.length > 1 ? " · " + (G.goal + 1) + "/" + n.goals.length : "";
      stageLabel.textContent = n.name + " · " + n.sub + extra;
      const dist = phaseDist(G.phase, G.target);
      let fit = "偏了";
      let hot = false;
      let warn = false;
      if (G.mode === "flash") {
        fit = G.lastPerfect ? "完美" : "合相";
        hot = true;
      } else if (dist <= n.tol * 0.38) {
        fit = "完美";
        hot = true;
      } else if (dist <= n.tol) {
        fit = "可锁";
        hot = true;
      } else if (dist <= n.tol * 2.4) {
        fit = "近了";
      } else {
        warn = dist > 0.18;
      }
      fitLabel.textContent = fit;
      fitLabel.classList.toggle("hot", hot);
      fitLabel.classList.toggle("warn", warn && !hot);
      const tl = Math.ceil(Math.max(0, G.timeLeft));
      timeLabel.textContent = G.mode === "play" ? tl + "s" : "—";
      timeLabel.classList.toggle("warn", G.mode === "play" && G.timeLeft < 5);
      hintEl.textContent = n.hint;
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
      ovKicker.textContent = "MOON";
      ovTitle.textContent = "月相";
      ovLead.innerHTML = "转圆盘，让仪月对上今夜月相。<br />差一线都不算，看清缺的那边再落锁。";
      ovOps.textContent = coarse
        ? "拖圆盘或按底栏 ◀ ▶ · 落锁 · M 静音"
        : "A/D 转盘 · 拖圆盘 · 滚轮微调 · 空格落锁 · M 静音";
      ovBtn.textContent = "观月";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "月满";
      ovLead.textContent = "十夜都对准了。西楼月满。";
      ovOps.textContent = "落锁 " + G.total + " · 完美 " + G.perfects;
      ovBtn.textContent = "再观一轮";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "月沉";
      ovLead.textContent = "今夜走失。相位耗尽。";
      ovOps.textContent = "已对 " + G.total + " 夜 · 停在「" + nightNow().name + "」";
      ovBtn.textContent = "再观一轮";
    }
  }

  function hidePanel() {
    overlay.classList.add("hidden");
  }

  function inWindow() {
    if (G.mode !== "play") return false;
    return phaseDist(G.phase, G.target) <= nightNow().tol;
  }

  function beginNight(resetPhase, quiet) {
    const n = nightNow();
    G.mode = "play";
    G.t = 0;
    G.goal = 0;
    G.target = n.goals[0];
    if (resetPhase) {
      G.phase = n.start;
      G.spinVel = 0;
    }
    G.timeLeft = n.time;
    G.armed = 0.38;
    G.nearOn = false;
    G.lockFlash = 0;
    G.flashT = 0;
    resetClouds(n.clouds);
    if (!quiet) toast(n.toast);
    syncHud();
  }

  function resetRun() {
    G.night = 0;
    G.lives = LIVES;
    G.locks = 0;
    G.perfects = 0;
    G.total = 0;
    G.shake = 0;
    G.flash = 0;
    G.endT = 0;
    beginNight(true);
    hidePanel();
    audio.start();
  }

  function startWin() {
    G.mode = "win";
    G.endT = 0;
    audio.win();
    burst(L.cx, L.cy, GOLD, 28);
    burst(L.sx, L.sy, CYAN, 18);
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

  function failNight(why) {
    G.lives -= 1;
    G.flash = 0.46;
    G.flashCol = PINK;
    G.shake = 9;
    G.nearOn = false;
    audio.miss();
    burst(L.cx, L.cy, PINK, 16);
    if (why.length <= 4) {
      floatAt(L.cx, L.cy - L.mR * 0.2, why, PINK);
      judge(why, PINK);
    }
    toast(why, true);
    syncHud();
    if (G.lives <= 0) {
      startLose();
      return;
    }
    beginNight(true, true);
  }

  function missReason() {
    const n = nightNow();
    const dist = phaseDist(G.phase, G.target);
    if (G.timeLeft <= 0) return "月落了";
    const mine = phaseName(G.phase);
    const theirs = phaseName(G.target);
    if (mine !== theirs) return "这是" + mine + "，今夜" + theirs;
    if (dist <= n.tol * 1.6) return "差一线";
    const d = wrapDelta(G.phase - G.target);
    return d > 0 ? "过了" : "还没到";
  }

  function tryLock() {
    if (G.mode !== "play") return;
    if (G.armed > 0) return;
    const n = nightNow();
    const dist = phaseDist(G.phase, G.target);
    if (dist <= n.tol) {
      const perfect = dist <= n.tol * 0.38;
      G.total += 1;
      G.locks += 1;
      if (perfect) G.perfects += 1;
      G.lastPerfect = perfect;
      G.flash = 0.4;
      G.flashCol = perfect ? GOLD : CYAN;
      G.lockFlash = 1;
      G.flashT = 0.72;
      G.spinVel = 0;
      audio.lockOk(perfect);
      burst(L.cx, L.cy, perfect ? GOLD : CYAN, perfect ? 22 : 14);
      burst(L.sx, L.sy, CYAN, 10);
      const word = perfect ? "完美" : "合相";
      floatAt(L.cx, L.cy - L.mR * 0.15, word, perfect ? GOLD : CYAN);
      judge(word, perfect ? GOLD : CYAN);
      toast(word);
      G.mode = "flash";
      syncHud();
    } else {
      failNight(missReason());
    }
  }

  function afterFlash() {
    const n = nightNow();
    if (G.goal + 1 < n.goals.length) {
      G.goal += 1;
      G.target = n.goals[G.goal];
      G.mode = "play";
      G.armed = 0.28;
      G.nearOn = false;
      G.lockFlash = 0;
      G.flashT = 0;
      toast(G.goal === 1 ? "黄昏已锁 · 再对黎明" : "下一相");
      syncHud();
      return;
    }
    if (G.night + 1 >= NIGHTS.length) {
      startWin();
      return;
    }
    G.night += 1;
    beginNight(true);
  }

  function keyRate(held) {
    return lerp(0.16, 0.34, clamp(held / 0.45, 0, 1));
  }

  function applySpin(delta) {
    const prev = G.phase;
    G.phase = wrap01(G.phase + delta);
    const qPrev = Math.floor(prev * 32);
    const qNow = Math.floor(G.phase * 32);
    if (qNow !== qPrev) audio.tick();
  }

  function updateSpin(dt) {
    if (G.mode !== "play") {
      G.held = 0;
      return;
    }
    const n = nightNow();
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
    } else if (n.inertia > 0 && Math.abs(G.spinVel) > 0.002) {
      applySpin(G.spinVel * dt);
      const decay = Math.exp(-dt / n.inertia);
      G.spinVel *= decay;
      if (Math.abs(G.spinVel) < 0.003) G.spinVel = 0;
    } else {
      G.held = 0;
      if (n.inertia <= 0) G.spinVel = 0;
    }
  }

  function updateClouds(dt) {
    const n = G.mode === "title" ? NIGHTS[0] : nightNow();
    if (!n || n.clouds <= 0) {
      G.cover = 0;
      return;
    }
    let cover = 0;
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x += c.vx * dt;
      if (c.x > 3.2) c.x = -3.1;
      const dx = c.x;
      const dy = c.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const reach = c.w * 0.55;
      if (d < reach) cover = Math.max(cover, 1 - d / reach);
    }
    G.cover = clamp(cover * (0.55 + n.clouds * 0.35), 0, 0.92);
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.judgeT > 0) G.judgeT -= dt;
    if (G.lockFlash > 0) G.lockFlash = Math.max(0, G.lockFlash - dt * 1.15);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
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
    for (let i = shoots.length - 1; i >= 0; i--) {
      const s = shoots[i];
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.t > s.life) shoots.splice(i, 1);
    }
    if (G.mode === "play" && Math.random() < dt * 0.08) {
      shoots.push({
        x: rand(0.05, 0.9) * W,
        y: rand(0.04, 0.28) * H,
        vx: rand(90, 170),
        vy: rand(40, 90),
        t: 0,
        life: rand(0.35, 0.7)
      });
    }
  }

  function heatNow() {
    if (G.mode === "title") return 0.12 + 0.12 * Math.sin(G.demoT * 0.7);
    const n = nightNow();
    const dist = phaseDist(G.phase, G.target);
    const close = 1 - clamp(dist / Math.max(0.04, n.tol * 3.2), 0, 1);
    return close;
  }

  function updatePlay(dt) {
    const n = nightNow();
    G.t += dt;
    if (G.armed > 0) G.armed = Math.max(0, G.armed - dt);
    G.target = wrap01(G.target + n.drift * dt);
    G.timeLeft -= dt;
    if (G.timeLeft <= 0) {
      G.timeLeft = 0;
      failNight("月落了");
      return;
    }
    const dist = phaseDist(G.phase, G.target);
    if (dist <= n.tol) {
      if (!G.nearOn) {
        G.nearOn = true;
        audio.near();
      }
    } else if (dist > n.tol * 1.35) {
      G.nearOn = false;
    }
  }

  function updateDemo(dt) {
    G.demoT += dt;
    G.phase = wrap01(0.08 + G.demoT * 0.045);
    G.target = wrap01(0.5 + Math.sin(G.demoT * 0.33) * 0.22);
  }

  function update(dt) {
    if (G.pause) {
      updateFx(dt * 0.15);
      return;
    }
    G.clock += dt;
    updateSpin(dt);
    updateClouds(dt);
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

  function drawMoon(cx, cy, r, phase, opts) {
    phase = wrap01(phase);
    const alpha = phase * TAU;
    const sinA = Math.sin(alpha);
    const cosA = Math.cos(alpha);
    const n = 40;

    ctx.save();
    ctx.translate(cx, cy);

    if (opts.glow) {
      const halo = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 2.1);
      halo.addColorStop(0, hexA(opts.halo || GOLD, 0.22 * opts.glow));
      halo.addColorStop(0.45, hexA(CYAN, 0.07 * opts.glow));
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.1, 0, TAU);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = opts.dark || DARK;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.clip();

    ctx.fillStyle = "rgba(180, 170, 220, 0.09)";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    ctx.fillStyle = opts.lit || LIT;
    if (Math.abs(sinA) < 1e-5) {
      if (cosA < 0) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
      }
    } else if (sinA > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
      for (let i = 0; i <= n; i++) {
        const yy = r * (1 - 2 * (i / n));
        const s2 = r * r - yy * yy;
        const s = s2 > 0 ? Math.sqrt(s2) : 0;
        ctx.lineTo(s * cosA, yy);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true);
      for (let i = 0; i <= n; i++) {
        const yy = r * (1 - 2 * (i / n));
        const s2 = r * r - yy * yy;
        const s = s2 > 0 ? Math.sqrt(s2) : 0;
        ctx.lineTo(-s * cosA, yy);
      }
      ctx.closePath();
      ctx.fill();
    }

    const lx = sinA;
    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      const x = c.x * r;
      const y = c.y * r;
      const cr = c.r * r;
      ctx.beginPath();
      ctx.arc(x - lx * cr * 0.35, y, cr, 0, TAU);
      ctx.fillStyle = "rgba(8, 6, 22, " + (0.22 + c.d * 0.25) + ")";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + lx * cr * 0.28, y - cr * 0.12, cr * 0.78, 0, TAU);
      ctx.fillStyle = "rgba(255, 244, 214, 0.1)";
      ctx.fill();
    }

    const shade = ctx.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.08, 0, 0, r * 1.05);
    shade.addColorStop(0, "rgba(255,255,240,0.28)");
    shade.addColorStop(0.42, "rgba(255,220,160,0.05)");
    shade.addColorStop(1, "rgba(10, 6, 28, 0.38)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.strokeStyle = hexA(opts.rim || GOLD, 0.35);
    ctx.lineWidth = Math.max(1, r * 0.025);
    ctx.stroke();

    ctx.restore();
  }

  function drawClouds() {
    if (clouds.length === 0) return;
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const x = L.sx + c.x * L.sR;
      const y = L.sy + c.y * L.sR;
      const w = c.w * L.sR;
      for (let b = 0; b < 5; b++) {
        const bx = x + (b - 2) * w * 0.22;
        const by = y + Math.sin(b * 1.7 + i) * c.h * L.sR * 0.35;
        const br = (0.34 + (b % 3) * 0.12) * w;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, "rgba(92, 80, 140," + c.a + ")");
        g.addColorStop(0.5, "rgba(36, 28, 72," + (c.a * 0.72) + ")");
        g.addColorStop(1, "rgba(12, 8, 28, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawDisc() {
    const heat = G.heat;
    const ring = heat > 0.78 ? GOLD : heat > 0.45 ? CYAN : PINK;
    const pulse = 0.55 + 0.45 * Math.sin(G.clock * (3 + heat * 4));

    ctx.save();
    ctx.translate(L.cx, L.cy);

    const aura = ctx.createRadialGradient(0, 0, L.R * 0.4, 0, 0, L.R * 1.25);
    aura.addColorStop(0, "rgba(0,0,0,0)");
    aura.addColorStop(0.7, hexA(ring, 0.05 + heat * 0.08));
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, L.R * 1.25, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, L.R, 0, TAU);
    ctx.fillStyle = "rgba(8, 6, 20, 0.72)";
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = hexA(ring, 0.35 + heat * 0.45 * pulse);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, L.R * 0.86, 0, TAU);
    ctx.strokeStyle = hexA(CYAN, 0.18 + heat * 0.25);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (G.mode === "play") {
      const n = nightNow();
      const frac = clamp(G.timeLeft / n.time, 0, 1);
      ctx.beginPath();
      ctx.arc(0, 0, L.R * 0.93, -Math.PI / 2, -Math.PI / 2 + TAU * frac, false);
      ctx.strokeStyle = hexA(frac < 0.22 ? PINK : CYAN, 0.7);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    for (let i = 0; i < 32; i++) {
      const p = i / 32;
      const ang = (p - G.phase) * TAU - Math.PI / 2;
      const major = i % 8 === 0;
      const inner = major ? L.R * 0.74 : L.R * 0.8;
      const outer = L.R * 0.96;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
      ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer);
      ctx.strokeStyle = major ? hexA(GOLD, 0.55) : hexA(CYAN, 0.22);
      ctx.lineWidth = major ? 2 : 1;
      ctx.stroke();
    }

    ctx.font = "600 " + Math.max(10, L.R * 0.09) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < MARKS.length; i++) {
      const m = MARKS[i];
      const ang = (m.p - G.phase) * TAU - Math.PI / 2;
      const rr = L.R * 0.66;
      ctx.fillStyle = hexA(GOLD, 0.82);
      ctx.fillText(m.name, Math.cos(ang) * rr, Math.sin(ang) * rr);
    }

    ctx.restore();

    ctx.save();
    ctx.translate(L.cx, L.cy - L.R - 2);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-8, -6);
    ctx.lineTo(8, -6);
    ctx.closePath();
    ctx.fillStyle = heat > 0.78 ? GOLD : PINK;
    ctx.shadowColor = heat > 0.78 ? GOLD : PINK;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();

    drawMoon(L.cx, L.cy, L.mR, G.phase, {
      glow: 0.45 + G.heat * 0.8,
      halo: G.heat > 0.78 ? GOLD : CYAN,
      rim: G.heat > 0.78 ? GOLD : CYAN,
      lit: LIT,
      dark: DARK
    });
  }

  function drawSkyMoon() {
    const vis = 1 - G.cover;
    ctx.save();
    ctx.globalAlpha = 0.12 + vis * 0.88;
    drawMoon(L.sx, L.sy, L.sR, G.target, {
      glow: (0.7 + G.heat * 0.5) * vis,
      halo: GOLD,
      rim: GOLD,
      lit: "#f7edd0",
      dark: "#0e0b1c"
    });
    ctx.restore();

    ctx.save();
    const fontA = "600 " + Math.max(10, L.sR * 0.28) + "px Segoe UI, PingFang SC, sans-serif";
    const fontB = "700 " + Math.max(11, L.sR * 0.32) + "px Segoe UI, PingFang SC, sans-serif";
    if (L.landscape) {
      ctx.textAlign = "center";
      ctx.font = fontA;
      ctx.fillStyle = hexA(CYAN, 0.85);
      ctx.fillText("今夜", L.sx, L.sy - L.sR - 10);
      ctx.font = fontB;
      ctx.fillStyle = hexA(GOLD, 0.92);
      ctx.fillText(phaseName(G.target), L.sx, L.sy + L.sR + 16);
    } else {
      ctx.textAlign = "left";
      ctx.font = fontA;
      ctx.fillStyle = hexA(CYAN, 0.85);
      ctx.fillText("今夜", L.sx + L.sR + 10, L.sy - 6);
      ctx.font = fontB;
      ctx.fillStyle = hexA(GOLD, 0.92);
      ctx.fillText(phaseName(G.target), L.sx + L.sR + 10, L.sy + 12);
    }
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, (1 - r.t) * r.max + 8, 0, TAU);
      ctx.strokeStyle = hexA(r.col, r.t * 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, TAU);
      ctx.fillStyle = hexA(q.col, q.life / q.max);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const q = sparks[i];
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - q.vx * 0.018, q.y - q.vy * 0.018);
      ctx.strokeStyle = hexA(q.col, clamp(q.life * 2.2, 0, 1));
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.font = "700 16px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = hexA(f.col, clamp(f.t * 1.4, 0, 1));
      ctx.fillText(f.text, f.x, f.y);
    }
    if (G.judgeT > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(G.judgeT * 1.6, 0, 1);
      ctx.font = "800 " + Math.max(22, L.R * 0.22) + "px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = G.judgeCol;
      ctx.shadowColor = G.judgeCol;
      ctx.shadowBlur = 18;
      ctx.fillText(G.judge, L.cx, L.cy);
      ctx.restore();
    }
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#070414");
    g.addColorStop(0.55, "#05030c");
    g.addColorStop(1, "#0a0618");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const milky = ctx.createLinearGradient(0, H * 0.1, W, H * 0.7);
    milky.addColorStop(0, "rgba(0,0,0,0)");
    milky.addColorStop(0.45, "rgba(80, 60, 140, 0.07)");
    milky.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = milky;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * s.s + s.p);
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r * tw, 0, TAU);
      ctx.fillStyle = hexA(s.c, s.a * tw);
      ctx.fill();
    }
    for (let i = 0; i < shoots.length; i++) {
      const s = shoots[i];
      const a = 1 - s.t / s.life;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      ctx.strokeStyle = hexA(GOLD, a * 0.7);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }

  function draw() {
    const sx = G.shake ? rand(-G.shake, G.shake) : 0;
    const sy = G.shake ? rand(-G.shake, G.shake) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.translate(sx, sy);
    drawBg();
    drawSkyMoon();
    drawClouds();
    drawDisc();
    drawFx();
    if (G.flash > 0) {
      ctx.fillStyle = hexA(G.flashCol, G.flash * 0.16);
      ctx.fillRect(-sx, -sy, W, H);
    }
    if (G.pause) {
      ctx.fillStyle = "rgba(5, 3, 12, 0.35)";
      ctx.fillRect(-sx, -sy, W, H);
      ctx.fillStyle = hexA(CYAN, 0.8);
      ctx.font = "700 14px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("暂停", W * 0.5, 28);
    }
    ctx.restore();
  }

  function loop(now) {
    if (!loop.last) loop.last = now;
    let acc = (now - loop.last) / 1000;
    loop.last = now;
    if (acc > 0.08) acc = 0.08;
    loop.bag += acc;
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
      else tryLock();
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

  btnPadLock.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    audio.ensure();
    tryLock();
  });
  btnLock.addEventListener("click", () => {
    audio.ensure();
    tryLock();
  });
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
      grab: true,
      moved: 0
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
    const delta = d / TAU;
    p.moved += Math.abs(delta);
    if (G.mode === "play") {
      applySpin(delta);
      const v = clamp(delta / 0.016, -0.9, 0.9);
      G.spinVel = G.spinVel * 0.55 + v * 0.45;
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
    const step = (e.deltaY > 0 ? 1 : -1) * (fine ? 0.004 : 0.012);
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
  makeCraters();
  resize();
  showPanel("title");
  syncHud();
  requestAnimationFrame(loop);
})();
