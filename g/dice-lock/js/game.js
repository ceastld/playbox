(() => {
  "use strict";

  const VW = 480;
  const VH = 720;
  const CX = 240;
  const CY = 348;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-dice-lock-mute";
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const VIEW_X = 0.52;
  const VIEW_Y = -0.68;
  const FACE_N = {
    f: [0, 0, 1],
    b: [0, 0, -1],
    t: [0, 1, 0],
    bot: [0, -1, 0],
    r: [1, 0, 0],
    l: [-1, 0, 0]
  };
  const MOVES = ["x", "x", "y", "x", "x", "y"];
  const FONT = '"Segoe UI","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';

  const PIPS = [
    null,
    [[0.5, 0.5]],
    [[0.28, 0.28], [0.72, 0.72]],
    [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
    [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
    [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
    [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]]
  ];

  const FACE_GEO = [
    { key: "f", v: [[-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]] },
    { key: "b", v: [[1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]] },
    { key: "t", v: [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]] },
    { key: "bot", v: [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]] },
    { key: "r", v: [[1, 1, 1], [1, 1, -1], [1, -1, -1], [1, -1, 1]] },
    { key: "l", v: [[-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [-1, -1, -1]] }
  ];

  const STAGES = [
    { name: "双面", sub: "TWO", n: 2, period: 2.4, hold: 0.74, time: 30, hide: 0, slip: 0, rev: 0, mix: false, hint: "点数对上、停稳，再锁", toast: "对准那一面 · 停稳再锁" },
    { name: "三码", sub: "TRI", n: 3, period: 2.18, hold: 0.66, time: 28, hide: 0, slip: 0, rev: 0, mix: false, hint: "三枚一起看，逐个锁", toast: "三枚密码 · 一枚一枚锁" },
    { name: "错速", sub: "MIX", n: 3, period: 1.95, hold: 0.6, time: 26, hide: 0, slip: 0, rev: 0, mix: true, hint: "快慢不同，别跟错拍", toast: "每枚转速不同" },
    { name: "四栓", sub: "FOUR", n: 4, period: 1.86, hold: 0.54, time: 26, hide: 0, slip: 0, rev: 0, mix: true, hint: "四枚栓，锁满才开", toast: "四枚都要对上" },
    { name: "隐码", sub: "HIDE", n: 3, period: 1.76, hold: 0.52, time: 24, hide: 4.2, slip: 0, rev: 0, mix: false, hint: "密码会藏，先把点数记住", toast: "先看清密码，马上要藏" },
    { name: "回流", sub: "BACK", n: 4, period: 1.7, hold: 0.48, time: 22, hide: 0, slip: 0, rev: 0.5, mix: true, hint: "有的骰往回转", toast: "注意反转的那几枚" },
    { name: "松扣", sub: "SLIP", n: 4, period: 1.64, hold: 0.46, time: 26, hide: 0, slip: 7.2, rev: 0, mix: true, hint: "锁上还会松开，盯紧", toast: "锁会自己松 · 再锁一次" },
    { name: "快门", sub: "SNAP", n: 4, period: 1.26, hold: 0.36, time: 20, hide: 0, slip: 0, rev: 0.25, mix: true, hint: "停的时间更短", toast: "窗口很短 · 看准就锁" },
    { name: "盲库", sub: "BLIND", n: 5, period: 1.4, hold: 0.4, time: 24, hide: 3.2, slip: 0, rev: 0.4, mix: true, hint: "五枚密码只闪一下", toast: "记住五枚，马上要藏" },
    { name: "金库", sub: "VAULT", n: 5, period: 1.2, hold: 0.33, time: 26, hide: 2.6, slip: 6.0, rev: 0.5, mix: true, hint: "全技巧 · 锁满金库", toast: "最后一锁 · 松扣、隐码、快门" }
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
  const btnPadLock = document.getElementById("btn-pad-lock");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const stageLabel = document.getElementById("stage-label");
  const codeBar = document.getElementById("code-bar");
  const codeNum = document.getElementById("code-num");
  const timeBar = document.getElementById("time-bar");
  const timeWrap = document.getElementById("time-wrap");
  const codeWrap = document.getElementById("code-wrap");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;

  const motes = [];
  const particles = [];
  const floats = [];
  const rings = [];
  const rivets = [];

  const ptr = { x: CX, y: CY, on: false, down: false };

  const G = {
    mode: "title",
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 30,
    timeMax: 30,
    dice: [],
    sel: 0,
    hover: -1,
    armed: 0,
    shake: 0,
    flash: 0,
    flashCol: CYAN,
    toastT: 0,
    hideLeft: 0,
    hidden: false,
    hidOnce: false,
    door: 0,
    bolts: 0,
    settle: 0,
    warnAt: 5,
    spin: 0,
    why: "",
    pause: false
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
  function wrapFace(n) {
    n = ((n - 1) % 6 + 6) % 6;
    return n + 1;
  }
  function hexA(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  function rotX(p, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }
  function rotY(p, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }
  function lerpP(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 64; i++) {
      motes.push({
        a: hash(i * 3.17) * TAU,
        r: 40 + hash(i * 5.9) * 210,
        s: 0.08 + hash(i * 2.2) * 0.22,
        z: 0.2 + hash(i * 8.1) * 0.8,
        tw: 0.4 + hash(i * 1.7) * 2.2,
        ph: hash(i * 11.4) * TAU,
        c: hash(i * 0.37) > 0.78 ? CYAN : hash(i * 0.61) > 0.86 ? GOLD : PINK
      });
    }
    rivets.length = 0;
    for (let i = 0; i < 18; i++) {
      rivets.push((i + 0.5) / 18 * TAU);
    }
  }

  function applyPitch(d, s) {
    const f = d.f;
    const t = d.t;
    const b = d.b;
    const bot = d.bot;
    if (s > 0) {
      d.f = t;
      d.t = b;
      d.b = bot;
      d.bot = f;
    } else {
      d.f = bot;
      d.bot = b;
      d.b = t;
      d.t = f;
    }
  }

  function applyYaw(d, s) {
    const f = d.f;
    const r = d.r;
    const b = d.b;
    const l = d.l;
    if (s > 0) {
      d.f = l;
      d.l = b;
      d.b = r;
      d.r = f;
    } else {
      d.f = r;
      d.r = b;
      d.b = l;
      d.l = f;
    }
  }

  function applyMove(d) {
    const axis = MOVES[d.moveI % 6];
    if (axis === "x") applyPitch(d, d.sign);
    else applyYaw(d, d.sign);
    d.moveI += 1;
  }

  function peekFront(d) {
    const t = {
      f: d.f,
      t: d.t,
      b: d.b,
      bot: d.bot,
      r: d.r,
      l: d.l,
      moveI: d.moveI,
      sign: d.sign
    };
    applyMove(t);
    return t.f;
  }

  function currentAxis(d) {
    return MOVES[d.moveI % 6];
  }

  function isResting(d) {
    if (d.locked) return true;
    return d.timer < d.holdDur;
  }

  function tumbleT(d) {
    if (d.locked) return 0;
    if (d.timer < d.holdDur) return 0;
    return clamp((d.timer - d.holdDur) / Math.max(0.05, d.tumbleDur), 0, 1);
  }

  function layoutDice(n) {
    const cage = n <= 2 ? 118 : n === 3 ? 104 : n === 4 ? 88 : 74;
    const gap = n <= 3 ? 16 : 10;
    const total = n * cage + (n - 1) * gap;
    const x0 = CX - total / 2 + cage / 2;
    const s = n <= 2 ? 40 : n === 3 ? 36 : n === 4 ? 30 : 25;
    return { cage: cage, gap: gap, x0: x0, s: s, y: 408 };
  }

  function makeDie(i, n, st, code) {
    const lay = layoutDice(n);
    const mixMul = st.mix ? [1.1, 0.82, 1.0, 0.9, 1.16][i % 5] : 1;
    const period = st.period * mixMul;
    const holdDur = period * st.hold;
    const nRev = Math.round(st.rev * n);
    const d = {
      i: i,
      code: code,
      f: 1,
      t: 2,
      b: 6,
      bot: 5,
      r: 3,
      l: 4,
      sign: i < nRev ? -1 : 1,
      moveI: 0,
      period: period,
      holdDur: holdDur,
      tumbleDur: period - holdDur,
      timer: (i * 0.37 * period) % period,
      locked: false,
      hold: 0,
      glow: 0,
      flash: 0,
      cool: 0,
      x: lay.x0 + i * (lay.cage + lay.gap),
      y: lay.y,
      s: lay.s,
      cage: lay.cage,
      wob: rand(0, TAU),
      nearOn: false
    };
    const teach = !st.hide && !st.slip && n <= 3 && !st.mix;
    if (teach) {
      let g = 0;
      while (peekFront(d) !== d.code && g < 12) {
        applyMove(d);
        g += 1;
      }
      d.timer = d.holdDur * (0.18 + i * 0.22);
    } else {
      const kicks = 2 + ((i * 3 + n + ((Math.random() * 3) | 0)) % 5);
      for (let k = 0; k < kicks; k++) applyMove(d);
      let guard = 0;
      while (d.f === d.code && guard < 8) {
        applyMove(d);
        guard += 1;
      }
    }
    return d;
  }

  function makeCode(n) {
    const a = [];
    for (let i = 0; i < n; i++) a.push(1 + ((Math.random() * 6) | 0));
    let same = true;
    for (let i = 1; i < n; i++) if (a[i] !== a[0]) same = false;
    if (same) a[n - 1] = wrapFace(a[0] + 2);
    return a;
  }

  function buildDice(st, demo) {
    const n = st.n;
    const code = demo ? [2, 5, 3] : makeCode(n);
    G.dice = [];
    for (let i = 0; i < n; i++) G.dice.push(makeDie(i, n, st, code[i]));
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastTick: -9,
    lastNear: -9,
    lastWarn: -9,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
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
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    clack() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastTick < 0.05) return;
      this.lastTick = now;
      this.beep(180, 0.04, "square", 0.03, 90);
      this.noise(0.03, 0.04, 1400);
    },
    near() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.38) return;
      this.lastNear = now;
      this.beep(1180, 0.06, "sine", 0.035, 1680);
    },
    lockOk() {
      this.ensure();
      this.beep(523, 0.1, "triangle", 0.08, 784);
      this.beep(784, 0.22, "sine", 0.06, 1174);
    },
    miss() {
      this.ensure();
      this.beep(170, 0.32, "sawtooth", 0.08, 56);
      this.noise(0.16, 0.05, 380);
    },
    deny() {
      this.ensure();
      this.beep(240, 0.08, "square", 0.04, 140);
    },
    slip() {
      this.ensure();
      this.beep(392, 0.12, "triangle", 0.05, 196);
      this.noise(0.1, 0.04, 700);
    },
    warn() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastWarn < 0.48) return;
      this.lastWarn = now;
      this.beep(880, 0.06, "square", 0.04, 440);
    },
    hide() {
      this.ensure();
      this.beep(520, 0.18, "sine", 0.05, 220);
    },
    win() {
      this.ensure();
      this.beep(523, 0.14, "sine", 0.08, 784);
      this.beep(659, 0.26, "triangle", 0.07, 988);
      this.beep(784, 0.4, "sine", 0.06, 1174);
      this.beep(1046, 0.55, "sine", 0.045, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.5, "sawtooth", 0.09, 52);
      this.beep(90, 0.72, "square", 0.05, 36);
    },
    clear() {
      this.ensure();
      this.beep(659, 0.12, "sine", 0.07, 988);
      this.beep(880, 0.28, "triangle", 0.06, 1320);
    }
  };

  function burst(x, y, col, n, mag) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(40, mag || 180);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(20, 80),
        life: rand(0.28, 0.7),
        max: 0.7,
        r: rand(1.2, 3.4),
        g: 280,
        col: col
      });
    }
    if (particles.length > 160) particles.splice(0, particles.length - 160);
  }

  function addRing(x, y, col) {
    rings.push({ x: x, y: y, t: 0, col: col });
  }

  function floatAt(x, y, text, col) {
    floats.push({ x: x, y: y, text: text, col: col, t: 0 });
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.toggle("gold", !!gold);
    toastEl.classList.remove("hidden");
    G.toastT = 1.35;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle("hot", kind === "hot");
    hintEl.classList.toggle("warn", kind === "warn");
  }

  function lockedCount() {
    let n = 0;
    for (let i = 0; i < G.dice.length; i++) if (G.dice[i].locked) n += 1;
    return n;
  }

  function syncHud() {
    const st = STAGES[Math.min(G.stage, STAGES.length - 1)];
    const n = G.dice.length || st.n;
    const got = lockedCount();
    stageLabel.textContent = G.mode === "title"
      ? "十锁"
      : "第 " + (G.stage + 1) + " / " + STAGES.length + " 锁 · " + st.name;
    stageLabel.classList.toggle("hot", got === n && n > 0);
    stageLabel.classList.toggle("warn", G.mode === "play" && G.time < 5);
    codeNum.textContent = got + "/" + n;
    codeBar.style.transform = "scaleX(" + (n ? got / n : 0) + ")";
    const tp = G.mode === "play" ? clamp(G.time / Math.max(0.01, G.timeMax), 0, 1) : 1;
    timeBar.style.transform = "scaleX(" + tp + ")";
    timeWrap.classList.toggle("warn", G.mode === "play" && G.time < 5);
    timeWrap.classList.toggle("hot", G.mode === "play" && G.time >= 5 && G.time < 10);
    codeWrap.classList.toggle("hot", got === n && n > 0 && G.mode !== "title");
    pipsEl.innerHTML = "";
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement("span");
      s.className = "pip" + (i < G.lives ? " on" : " gone");
      pipsEl.appendChild(s);
    }
    if (G.mode === "play") setHint(st.hint, G.time < 5 ? "warn" : G.hidden ? "hot" : "");
    else if (G.mode === "title") setHint("对准点数 · 停稳再锁");
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind) panel.classList.add(kind);
    ovKicker.textContent = kicker || "DICE";
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovOps.textContent = ops || "点骰锁定 · ← → 选 · 空格锁 · 1–5 · M 静音";
    ovBtn.textContent = btn;
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    ovBtn.blur();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function startStage(index, quiet) {
    G.stage = index;
    const st = STAGES[index];
    buildDice(st, false);
    G.mode = "play";
    G.t = 0;
    G.time = st.time;
    G.timeMax = st.time;
    G.hideLeft = st.hide;
    G.hidden = false;
    G.hidOnce = false;
    G.armed = 0.42;
    G.sel = 0;
    G.door = 0;
    G.bolts = 0;
    G.settle = 0;
    G.warnAt = Math.min(5, st.time - 0.2);
    G.flash = 0;
    G.why = "";
    hideOverlay();
    if (!quiet) toast(st.toast);
    setHint(st.hint);
    syncHud();
  }

  function startRun() {
    G.lives = LIVES;
    G.stage = 0;
    G.door = 0;
    particles.length = 0;
    floats.length = 0;
    rings.length = 0;
    startStage(0);
    audio.ensure();
  }

  function beginTitle() {
    G.mode = "title";
    G.lives = LIVES;
    G.stage = 0;
    G.door = 0;
    G.t = 0;
    buildDice({ n: 3, period: 2.2, hold: 0.62, mix: true, rev: 0.33, slip: 0, hide: 0, time: 30 }, true);
    showOverlay(
      "",
      "锁骰",
      "骰子在转。对准密码那一面，<br />停稳再锁住，组成开库密码。",
      "开锁",
      "DICE",
      "点骰锁定 · ← → 选 · 空格锁 · 1–5 · M 静音"
    );
    setHint("对准点数 · 停稳再锁");
    syncHud();
  }

  function beginClear() {
    G.mode = "clear";
    G.settle = 1.15;
    G.flash = 0.55;
    G.flashCol = GOLD;
    audio.clear();
    toast("开锁", false, true);
    setHint("这道锁开了", "hot");
    for (let i = 0; i < G.dice.length; i++) {
      const d = G.dice[i];
      burst(d.x, d.y, i % 2 ? CYAN : GOLD, 12, 160);
      addRing(d.x, d.y, GOLD);
    }
    burst(CX, CY + 90, GOLD, 16, 140);
    syncHud();
  }

  function startWin() {
    G.mode = "win";
    G.door = 0.2;
    audio.win();
    burst(CX, CY, GOLD, 28, 220);
    burst(CX, CY, CYAN, 18, 180);
    showOverlay(
      "win",
      "库开",
      "十道锁全部对上。<br />金库门开了。",
      "再锁一库",
      "OPEN",
      "锁满 " + STAGES.length + " 道 · 剩 " + G.lives + " 命"
    );
    setHint("金库开了", "hot");
    syncHud();
  }

  function startLose() {
    G.mode = "lose";
    audio.lose();
    burst(CX, CY + 40, PINK, 22, 200);
    const why = G.why === "time" ? "时限到了，骰面没锁满。" : "锁错点数，三条命用尽。";
    showOverlay(
      "lose",
      G.why === "time" ? "时尽" : "锁错",
      why + "<br />停在「" + STAGES[G.stage].name + "」。",
      "再来一局",
      "SEALED",
      "已过 " + G.stage + " 锁"
    );
    setHint("金库没开", "warn");
    syncHud();
  }

  function failLife(why) {
    G.lives -= 1;
    G.why = why;
    G.flash = 0.46;
    G.flashCol = PINK;
    G.shake = 10;
    audio.miss();
    syncHud();
    if (G.lives <= 0) {
      startLose();
      return;
    }
    if (why === "time") {
      G.mode = "timeout";
      G.settle = 0.9;
      toast("时限到 · 还剩 " + G.lives + " 次", true);
      setHint("时限到了，重来本锁", "warn");
    } else {
      toast("点数不对 · 还剩 " + G.lives + " 次", true);
    }
  }

  function tryLock(index) {
    if (G.mode !== "play") return;
    if (G.armed > 0) return;
    if (index < 0 || index >= G.dice.length) return;
    const d = G.dice[index];
    G.sel = index;
    if (d.cool > 0) return;
    d.cool = 0.16;
    if (d.locked) {
      toast("已锁");
      audio.deny();
      return;
    }
    if (!isResting(d)) {
      d.flash = 0.28;
      audio.deny();
      toast("停稳再锁", true);
      floatAt(d.x, d.y - d.s * 1.6, "转着", PINK);
      return;
    }
    if (d.f !== d.code) {
      d.flash = 0.55;
      G.shake = 7;
      burst(d.x, d.y, PINK, 10, 120);
      floatAt(d.x, d.y - d.s * 1.6, "错", PINK);
      failLife("miss");
      return;
    }
    d.locked = true;
    d.hold = 0;
    d.glow = 1;
    d.flash = 0.4;
    audio.lockOk();
    burst(d.x, d.y, CYAN, 14, 150);
    addRing(d.x, d.y, CYAN);
    floatAt(d.x, d.y - d.s * 1.7, "锁", GOLD);
    toast("锁上");
    syncHud();
    if (lockedCount() >= G.dice.length) beginClear();
  }

  function selectShift(dir) {
    if (!G.dice.length) return;
    G.sel = (G.sel + dir + G.dice.length) % G.dice.length;
    audio.clack();
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      startRun();
      return;
    }
  }

  function transformVert(x, y, z, axis, ang, wx, wy) {
    let p = { x: x, y: y, z: z };
    if (axis === "x") p = rotX(p, ang);
    else if (axis === "y") p = rotY(p, ang);
    p = rotX(p, VIEW_X + wx);
    p = rotY(p, VIEW_Y + wy);
    const persp = 1 / (1 + p.z * 0.16);
    return { x: p.x * persp, y: p.y * persp, z: p.z, wx: p.x, wy: p.y, wz: p.z };
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

  function drawMiniDie(x, y, s, n, locked, hidden, match) {
    const col = locked ? CYAN : hidden ? "#3a3558" : match ? GOLD : "#d8d2f8";
    roundRect(x - s, y - s, s * 2, s * 2, s * 0.22);
    ctx.fillStyle = locked ? "rgba(0, 240, 255, 0.12)" : hidden ? "rgba(8, 6, 20, 0.9)" : "rgba(18, 12, 32, 0.92)";
    ctx.fill();
    ctx.strokeStyle = hexA(col, locked ? 0.95 : hidden ? 0.28 : 0.8);
    ctx.lineWidth = locked ? 1.7 : 1.2;
    ctx.stroke();
    if (hidden && !locked) {
      ctx.fillStyle = "rgba(139, 144, 184, 0.45)";
      ctx.font = "700 " + (s * 0.9) + "px " + FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", x, y + 0.5);
      return;
    }
    const layout = PIPS[n] || PIPS[1];
    const pr = s * (n === 1 ? 0.2 : 0.155);
    ctx.fillStyle = locked ? CYAN : GOLD;
    for (let i = 0; i < layout.length; i++) {
      const u = layout[i][0];
      const v = layout[i][1];
      const px = x - s + u * s * 2;
      const py = y - s + v * s * 2;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, TAU);
      ctx.fill();
    }
  }

  function drawDie3D(d) {
    const tt = ease(tumbleT(d));
    const axis = currentAxis(d);
    const ang = d.locked ? 0 : d.sign * tt * (Math.PI * 0.5);
    const useAxis = d.locked ? "x" : axis;
    const wx = Math.sin(G.clock * 1.4 + d.wob) * (d.locked ? 0.012 : 0.04);
    const wy = Math.cos(G.clock * 1.1 + d.wob) * (d.locked ? 0.016 : 0.04);
    const bounce = d.locked ? Math.sin(Math.min(1, d.glow) * Math.PI) * 4 : 0;
    const faces = [];
    for (let f = 0; f < FACE_GEO.length; f++) {
      const geo = FACE_GEO[f];
      const nrm = FACE_N[geo.key];
      const nn = transformVert(nrm[0], nrm[1], nrm[2], useAxis, ang, wx, wy);
      if (nn.wz < 0.1) continue;
      const pts = [];
      let cz = 0;
      for (let k = 0; k < 4; k++) {
        const v = geo.v[k];
        const p = transformVert(v[0], v[1], v[2], useAxis, ang, wx, wy);
        pts.push(p);
        cz += p.z;
      }
      const bri = 0.34 + 0.66 * Math.max(0, nn.wx * 0.22 + nn.wy * 0.58 + nn.wz * 0.55);
      faces.push({
        pts: pts,
        z: cz / 4,
        n: d[geo.key],
        bri: bri,
        nz: nn.wz,
        key: geo.key
      });
    }
    faces.sort(function (a, b) { return a.z - b.z; });

    const match = !d.locked && d.f === d.code && isResting(d);
    ctx.save();
    ctx.translate(d.x, d.y - bounce);
    if (d.flash > 0) {
      ctx.shadowColor = hexA(d.locked || match ? CYAN : PINK, d.flash);
      ctx.shadowBlur = 18;
    } else if (d.locked) {
      ctx.shadowColor = hexA(CYAN, 0.55);
      ctx.shadowBlur = 16;
    } else if (match) {
      ctx.shadowColor = hexA(GOLD, 0.5);
      ctx.shadowBlur = 16;
    }

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      const pts = face.pts;
      const s = d.s;
      ctx.beginPath();
      ctx.moveTo(pts[0].x * s, -pts[0].y * s);
      for (let k = 1; k < 4; k++) ctx.lineTo(pts[k].x * s, -pts[k].y * s);
      ctx.closePath();
      let r = 36 + face.bri * 44;
      let g = 26 + face.bri * 34;
      let b = 62 + face.bri * 58;
      if (d.locked) {
        r = 10 + face.bri * 22;
        g = 48 + face.bri * 70;
        b = 62 + face.bri * 72;
      } else if (d.flash > 0.2 && !d.locked) {
        r = lerp(r, 180, d.flash);
        g = lerp(g, 30, d.flash);
        b = lerp(b, 90, d.flash);
      }
      ctx.fillStyle = "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
      ctx.fill();
      ctx.strokeStyle = hexA(d.locked ? CYAN : match ? GOLD : "#c8f6ff", 0.28 + face.bri * 0.4);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (face.nz < 0.22) continue;
      const layout = PIPS[face.n];
      if (!layout) continue;
      const tl = { x: pts[0].x * s, y: -pts[0].y * s };
      const tr = { x: pts[1].x * s, y: -pts[1].y * s };
      const br = { x: pts[2].x * s, y: -pts[2].y * s };
      const bl = { x: pts[3].x * s, y: -pts[3].y * s };
      const edge = hypot(tr.x - tl.x, tr.y - tl.y);
      if (edge < 10) continue;
      const pr = edge * (face.n === 1 ? 0.115 : 0.09);
      const pipCol = d.locked ? CYAN : match && face.key === "f" ? GOLD : "#fff6d8";
      ctx.fillStyle = pipCol;
      ctx.shadowBlur = 0;
      for (let p = 0; p < layout.length; p++) {
        const u = layout[p][0];
        const v = layout[p][1];
        const top = { x: tl.x + (tr.x - tl.x) * u, y: tl.y + (tr.y - tl.y) * u };
        const bot = { x: bl.x + (br.x - bl.x) * u, y: bl.y + (br.y - bl.y) * u };
        const qx = top.x + (bot.x - top.x) * v;
        const qy = top.y + (bot.y - top.y) * v;
        ctx.beginPath();
        ctx.arc(qx, qy, pr, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawCage(d, selected, hover) {
    const w = d.cage * 0.92;
    const h = d.s * 2.7 + 36;
    const x = d.x - w / 2;
    const y = d.y - d.s * 1.55 - 8;
    const match = !d.locked && d.f === d.code && isResting(d);
    const slipSoon = d.locked && STAGES[G.stage] && STAGES[G.stage].slip > 0 && (STAGES[G.stage].slip - d.hold) < 1.6;
    ctx.save();
    roundRect(x, y, w, h, 12);
    ctx.fillStyle = "rgba(6, 4, 14, 0.35)";
    ctx.fill();
    ctx.strokeStyle = hexA(
      d.locked ? CYAN : slipSoon ? PINK : match ? GOLD : selected || hover ? CYAN : "#5a6088",
      d.locked ? 0.85 : match ? 0.7 : selected ? 0.7 : 0.28
    );
    ctx.lineWidth = selected || d.locked ? 1.8 : 1.15;
    ctx.stroke();

    if (selected && G.mode === "play") {
      ctx.strokeStyle = hexA(CYAN, 0.35 + Math.sin(G.clock * 6) * 0.12);
      ctx.lineWidth = 1;
      roundRect(x - 3, y - 3, w + 6, h + 6, 14);
      ctx.stroke();
    }

    const pinY = y + h - 11;
    const pinW = w * 0.62;
    const pinX = d.x - pinW / 2;
    roundRect(pinX, pinY, pinW, 7, 3);
    ctx.fillStyle = "#0b0814";
    ctx.fill();
    const inAmt = d.locked ? 1 : 0.12;
    roundRect(pinX + 2, pinY + 1.5, (pinW - 4) * inAmt, 4, 2);
    ctx.fillStyle = d.locked ? CYAN : "rgba(0, 240, 255, 0.18)";
    ctx.fill();

    ctx.fillStyle = hexA(d.locked ? CYAN : "#8b90b8", 0.7);
    ctx.font = "600 10px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(String(d.i + 1), d.x, y + h + 4);
    ctx.restore();
  }

  function drawPassword() {
    const n = G.dice.length;
    if (!n) return;
    const s = n >= 5 ? 13 : 16;
    const gap = n >= 5 ? 10 : 14;
    const total = n * (s * 2) + (n - 1) * gap;
    const x0 = CX - total / 2 + s;
    const y = 168;
    const pw = total + 36;
    const ph = s * 2 + 38;
    roundRect(CX - pw / 2, y - ph / 2 - 2, pw, ph, 14);
    ctx.fillStyle = "rgba(8, 6, 18, 0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 240, 255, 0.55)";
    ctx.font = "600 10px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(G.hidden ? "密 码 已 藏" : "库 门 密 码", CX, y - ph / 2 + 6);

    for (let i = 0; i < n; i++) {
      const d = G.dice[i];
      const match = !d.locked && d.f === d.code && isResting(d);
      drawMiniDie(x0 + i * (s * 2 + gap), y + 6, s, d.code, d.locked, G.hidden, match);
    }
  }

  function drawVault() {
    const open = G.door;
    const R = 214;
    ctx.save();
    ctx.translate(CX, CY);

    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.ellipse(0, R * 0.92, R * 0.78, 18, 0, 0, TAU);
    ctx.fill();

    const grd = ctx.createRadialGradient(-40, -60, 20, 0, 0, R);
    grd.addColorStop(0, "#1a102c");
    grd.addColorStop(0.55, "#0c0818");
    grd.addColorStop(1, "#06040e");
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.strokeStyle = hexA(CYAN, 0.55 + open * 0.35);
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, R - 10, 0, TAU);
    ctx.strokeStyle = hexA(PINK, 0.35);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, R - 22, 0, TAU);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.save();
    ctx.rotate(G.spin * 0.15);
    ctx.beginPath();
    ctx.arc(0, 0, R - 34, 0, TAU);
    ctx.setLineDash([6, 10]);
    ctx.strokeStyle = "rgba(255, 61, 184, 0.18)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const boltN = 8;
    const boltsIn = G.bolts;
    for (let i = 0; i < boltN; i++) {
      const a = -Math.PI / 2 + i * TAU / boltN + 0.08;
      const inThis = clamp(boltsIn * boltN - i, 0, 1);
      const rad = R - 8 - inThis * 16;
      const bx = Math.cos(a) * rad;
      const by = Math.sin(a) * rad;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a);
      roundRect(-11, -5, 22 - inThis * 8, 10, 3);
      ctx.fillStyle = inThis > 0.7 ? "#0a1820" : "#161022";
      ctx.fill();
      ctx.strokeStyle = hexA(inThis > 0.7 ? CYAN : GOLD, 0.45 + inThis * 0.4);
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < rivets.length; i++) {
      const a = rivets[i] + G.spin * 0.02;
      const rx = Math.cos(a) * (R - 16);
      const ry = Math.sin(a) * (R - 16);
      ctx.beginPath();
      ctx.arc(rx, ry, 2.1, 0, TAU);
      ctx.fillStyle = "#2a2438";
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    if (open > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createLinearGradient(-30, -R, 30, R);
      glow.addColorStop(0, hexA(CYAN, 0));
      glow.addColorStop(0.5, hexA(GOLD, 0.12 + open * 0.35));
      glow.addColorStop(1, hexA(PINK, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(-18 - open * 24, -R, 36 + open * 48, R * 2);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(0, -R + 28);
    ctx.lineTo(0, R - 28);
    ctx.strokeStyle = hexA(CYAN, 0.08 + open * 0.25);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function drawKeyhole() {
    const x = CX;
    const y = 548;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.ellipse(0, -6, 14, 16, 0, 0, TAU);
    ctx.fillStyle = "#080510";
    ctx.fill();
    ctx.strokeStyle = hexA(lockedCount() === G.dice.length && G.dice.length ? GOLD : CYAN, 0.55);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    roundRect(-7, 4, 14, 16, 3);
    ctx.fillStyle = "#080510";
    ctx.fill();
    ctx.stroke();
    if (G.mode === "clear" || G.mode === "win") {
      ctx.fillStyle = hexA(GOLD, 0.55 + Math.sin(G.clock * 8) * 0.2);
      ctx.beginPath();
      ctx.arc(0, -6, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 12 + r.t * 52, 0, TAU);
      ctx.strokeStyle = hexA(r.col, 0.55 * a);
      ctx.lineWidth = 2 * a;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = hexA(p.col, 0.15 + a * 0.75);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / 0.7;
      ctx.font = "800 16px " + FONT;
      ctx.fillStyle = hexA(f.col, a);
      ctx.fillText(f.text, f.x, f.y - f.t * 28);
    }

    if (ptr.on && (G.mode === "play" || G.mode === "title")) {
      const over = G.hover >= 0;
      ctx.save();
      ctx.translate(ptr.x, ptr.y);
      ctx.strokeStyle = hexA(over ? GOLD : CYAN, 0.75);
      ctx.lineWidth = 1.3;
      const r = over ? 11 : 8;
      ctx.beginPath();
      ctx.moveTo(-r, -r + 4);
      ctx.lineTo(-r, -r);
      ctx.lineTo(-r + 4, -r);
      ctx.moveTo(r, -r + 4);
      ctx.lineTo(r, -r);
      ctx.lineTo(r - 4, -r);
      ctx.moveTo(-r, r - 4);
      ctx.lineTo(-r, r);
      ctx.lineTo(-r + 4, r);
      ctx.moveTo(r, r - 4);
      ctx.lineTo(r, r);
      ctx.lineTo(r - 4, r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, TAU);
      ctx.fillStyle = hexA(over ? GOLD : PINK, 0.9);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBg() {
    const g = ctx.createRadialGradient(CX - 40, CY - 80, 10, CX, CY, 420);
    g.addColorStop(0, "#12081c");
    g.addColorStop(0.55, "#07040f");
    g.addColorStop(1, "#05030c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a + G.clock * m.s * 0.15;
      const x = CX + Math.cos(a) * m.r * 0.55;
      const y = CY + Math.sin(a * 0.85) * m.r * 0.42;
      const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(G.clock * m.tw + m.ph));
      ctx.fillStyle = hexA(m.c, 0.12 * m.z * tw);
      ctx.beginPath();
      ctx.arc(x, y, 1.1 + m.z, 0, TAU);
      ctx.fill();
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake ? (hash(G.t * 40) - 0.5) * G.shake : 0;
    const shy = G.shake ? (hash(G.t * 40 + 2) - 0.5) * G.shake : 0;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + shx), dpr * (oy + shy));

    drawBg();
    drawVault();
    drawPassword();

    for (let i = 0; i < G.dice.length; i++) {
      drawCage(G.dice[i], i === G.sel, i === G.hover);
    }
    for (let i = 0; i < G.dice.length; i++) {
      drawDie3D(G.dice[i]);
    }
    drawKeyhole();
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = hexA(G.flashCol, G.flash * 0.18);
      ctx.fillRect(-20, -20, VW + 40, VH + 40);
    }

    const vg = ctx.createRadialGradient(CX, CY, 160, CX, CY, 420);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(5,3,12,0.45)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VW, VH);
  }

  function hitDie(x, y) {
    let best = -1;
    let bd = 1e9;
    for (let i = 0; i < G.dice.length; i++) {
      const d = G.dice[i];
      const w = d.cage * 0.5;
      const h = d.s * 1.85;
      if (Math.abs(x - d.x) <= w && Math.abs(y - d.y) <= h) {
        const dist = hypot(x - d.x, y - d.y);
        if (dist < bd) {
          bd = dist;
          best = i;
        }
      }
    }
    return best;
  }

  function toVirtual(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (cx - r.left - ox) / scale,
      y: (cy - r.top - oy) / scale
    };
  }

  function updateDice(dt) {
    const playing = G.mode === "play" || G.mode === "title";
    for (let i = 0; i < G.dice.length; i++) {
      const d = G.dice[i];
      d.wob += dt;
      d.glow = Math.max(0, d.glow - dt * 1.2);
      d.flash = Math.max(0, d.flash - dt * 2.4);
      d.cool = Math.max(0, d.cool - dt);
      if (d.locked) {
        d.hold += dt;
        const st = STAGES[G.stage];
        if (G.mode === "play" && st && st.slip > 0 && d.hold >= st.slip) {
          d.locked = false;
          d.hold = 0;
          d.flash = 0.5;
          d.timer = d.holdDur * 0.85;
          audio.slip();
          toast("松了", true);
          floatAt(d.x, d.y - d.s * 1.6, "松", PINK);
          burst(d.x, d.y, PINK, 8, 90);
          syncHud();
        }
        continue;
      }
      if (!playing) continue;
      d.timer += dt;
      if (d.timer >= d.period) {
        d.timer -= d.period;
        applyMove(d);
        audio.clack();
      }
      const rest = d.timer < d.holdDur;
      const match = rest && d.f === d.code;
      if (match && !d.nearOn && G.mode === "play") {
        d.nearOn = true;
        audio.near();
      }
      if (!match) d.nearOn = false;
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    G.armed = Math.max(0, G.armed - dt);
    G.spin += dt;
    const wantBolts = G.dice.length ? lockedCount() / G.dice.length : 0;
    const doorWant = G.mode === "win" ? 1 : G.mode === "clear" ? 0.42 : wantBolts * 0.12;
    G.bolts = lerp(G.bolts, wantBolts, 1 - Math.exp(-6 * dt));
    G.door = lerp(G.door, doorWant, 1 - Math.exp(-5 * dt));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.5) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].t += dt;
      if (floats[i].t > 0.7) floats.splice(i, 1);
    }
  }

  function updatePlay(dt) {
    const st = STAGES[G.stage];
    if (G.hideLeft > 0) {
      G.hideLeft -= dt;
      if (G.hideLeft <= 0 && !G.hidOnce) {
        G.hidden = true;
        G.hidOnce = true;
        audio.hide();
        toast("密码藏了", false, true);
        setHint(st.hint, "hot");
      }
    }
    G.time -= dt;
    if (G.time < G.warnAt) {
      audio.warn();
      G.warnAt = G.time < 2 ? G.time - 0.45 : G.time - 1;
    }
    if (G.time <= 0) {
      G.time = 0;
      failLife("time");
      return;
    }
    const tp = clamp(G.time / Math.max(0.01, G.timeMax), 0, 1);
    timeBar.style.transform = "scaleX(" + tp + ")";
    const warn = G.time < 5;
    timeWrap.classList.toggle("warn", warn);
    timeWrap.classList.toggle("hot", !warn && G.time < 10);
    stageLabel.classList.toggle("warn", warn);
    if (warn) hintEl.classList.add("warn");
  }

  function updateHover() {
    if (!ptr.on || (G.mode !== "play" && G.mode !== "title")) {
      G.hover = -1;
      return;
    }
    G.hover = hitDie(ptr.x, ptr.y);
    if (G.hover >= 0 && G.mode === "play") G.sel = G.hover;
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === "clear" || G.mode === "timeout") {
      G.settle -= dt;
      updateDice(dt);
      updateFx(dt);
      if (G.settle <= 0) {
        if (G.mode === "timeout") startStage(G.stage, true);
        else if (G.stage + 1 >= STAGES.length) startWin();
        else startStage(G.stage + 1);
      }
      return;
    }
    updateDice(dt);
    updateFx(dt);
    updateHover();
    if (G.mode === "play") updatePlay(dt);
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function onPtr(e) {
    const v = toVirtual(e.clientX, e.clientY);
    ptr.x = v.x;
    ptr.y = v.y;
    ptr.on = true;
  }

  canvas.addEventListener("pointerdown", function (e) {
    audio.ensure();
    if (e.button && e.button !== 0) return;
    onPtr(e);
    ptr.down = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (G.mode === "play") {
      const i = hitDie(ptr.x, ptr.y);
      if (i >= 0) tryLock(i);
    }
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", function (e) {
    onPtr(e);
  });
  canvas.addEventListener("pointerup", function () {
    ptr.down = false;
  });
  canvas.addEventListener("pointerleave", function () {
    ptr.on = false;
    ptr.down = false;
    G.hover = -1;
  });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  window.addEventListener("keydown", function (e) {
    audio.ensure();
    const k = e.code;
    if (k === "KeyM") {
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (k === "KeyR") {
      startRun();
      e.preventDefault();
      return;
    }
    if (k === "Space" || k === "Enter") {
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
        overlayAction();
        e.preventDefault();
        return;
      }
    }
    if (G.mode !== "play") return;
    if (k === "ArrowLeft" || k === "KeyA") {
      selectShift(-1);
      e.preventDefault();
    } else if (k === "ArrowRight" || k === "KeyD") {
      selectShift(1);
      e.preventDefault();
    } else if (k === "Space" || k === "Enter") {
      tryLock(G.sel);
      e.preventDefault();
    } else if (k.indexOf("Digit") === 0 || k.indexOf("Numpad") === 0) {
      const n = parseInt(k.slice(-1), 10);
      if (n >= 1 && n <= G.dice.length) tryLock(n - 1);
    }
  });

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    overlayAction();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnLock.addEventListener("click", function () {
    audio.ensure();
    tryLock(G.sel);
  });
  btnPadLock.addEventListener("click", function () {
    audio.ensure();
    tryLock(G.sel);
  });
  btnPrev.addEventListener("click", function () {
    audio.ensure();
    if (G.mode === "play") selectShift(-1);
  });
  btnNext.addEventListener("click", function () {
    audio.ensure();
    if (G.mode === "play") selectShift(1);
  });

  document.addEventListener("visibilitychange", function () {
    G.pause = document.hidden;
  });

  window.addEventListener("resize", resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
    else audio.setMuted(false);
  } catch (e) {
    audio.setMuted(false);
  }

  makeMotes();
  beginTitle();
  resize();

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (G.pause || document.hidden) dt = 0;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
