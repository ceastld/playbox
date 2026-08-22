(() => {
  "use strict";

  const VW = 480;
  const VH = 760;
  const CX = 240;
  const CY = 286;
  const R = 92;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const ROT_SPD = 2.15;
  const MUTE_KEY = "playbox-cage-key-mute";
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const FONT = '"Segoe UI","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
  const OPS = "拖笼子 / Q E 转 · 点钥或 1–5 选 · 空格插入 · M 静音";
  const NBAR = 18;
  const BODY_TOP = -86;
  const BODY_BOT = 112;

  const PROFILES = {
    fork: { id: "fork", bits: [3, 1, 3], bow: "ring" },
    stair: { id: "stair", bits: [1, 2, 3], bow: "dia" },
    gate: { id: "gate", bits: [2, 0, 2], bow: "sq" },
    crown: { id: "crown", bits: [1, 3, 1], bow: "heart" },
    comb: { id: "comb", bits: [3, 2, 3, 1], bow: "ring" },
    wave: { id: "wave", bits: [2, 3, 1, 2], bow: "dia" },
    fang: { id: "fang", bits: [3, 1, 1, 3], bow: "sq" },
    pin: { id: "pin", bits: [1, 3, 2, 1], bow: "heart" },
    twin: { id: "twin", bits: [3, 1, 2], bow: "ring" }
  };

  const STAGES = [
    { name: "初开", sub: "FIRST", true: "fork", keys: ["fork", "stair"], yaw: 0.06, snap: Math.PI / 2, tol: 0.5, time: 32, decoy: 0, drift: 0, spin: 0, blind: false, sideCost: false, hint: "选和钥口一样的钥匙，空格插入", toast: "齿口要吻合 · 空格插入" },
    { name: "侧转", sub: "TWIST", true: "stair", keys: ["fork", "stair"], yaw: Math.PI / 2, snap: Math.PI / 2, tol: 0.46, time: 30, decoy: 0, drift: 0, spin: 0, blind: false, sideCost: false, hint: "先把笼子转到锁朝你，钥口会亮金", toast: "锁在侧面 · 转到面前" },
    { name: "背面", sub: "BACK", true: "crown", keys: ["fork", "crown", "gate"], yaw: Math.PI, snap: Math.PI / 2, tol: 0.42, time: 28, decoy: 0, drift: 0, spin: 0, blind: false, sideCost: false, hint: "锁在背面 · 转到面前再选钥", toast: "转到背面那面" },
    { name: "细转", sub: "FINE", true: "gate", keys: ["gate", "crown", "stair"], yaw: Math.PI * 0.75, snap: Math.PI / 4, tol: 0.32, time: 26, decoy: 1, drift: 0, spin: 0, blind: false, sideCost: false, hint: "一次转 45° · 对准金光", toast: "细转 · 假锁不要信" },
    { name: "仿齿", sub: "TWIN", true: "fork", keys: ["fork", "twin", "stair", "gate"], yaw: Math.PI / 2, snap: Math.PI / 4, tol: 0.28, time: 26, decoy: 1, drift: 0, spin: 0, blind: false, sideCost: false, hint: "两把很像 · 看中间那一齿", toast: "仿齿 · 中间那格不一样" },
    { name: "游笼", sub: "DRIFT", true: "comb", keys: ["comb", "wave", "fork"], yaw: Math.PI / 4, snap: Math.PI / 12, tol: 0.24, time: 24, decoy: 1, drift: 0.22, spin: 0, blind: false, sideCost: false, hint: "笼子会自己转走 · 对准了立刻插", toast: "游笼 · 对准立刻插" },
    { name: "微隙", sub: "HAIR", true: "wave", keys: ["wave", "comb", "fang", "pin"], yaw: Math.PI * 0.42, snap: Math.PI / 12, tol: 0.175, time: 22, decoy: 2, drift: 0, spin: 0, blind: false, sideCost: true, hint: "缝很窄 · 金条满了再插", toast: "微隙 · 插偏会折" },
    { name: "盲口", sub: "BLIND", true: "fang", keys: ["fang", "pin", "crown", "gate"], yaw: Math.PI, snap: Math.PI / 4, tol: 0.24, time: 24, decoy: 2, drift: 0, spin: 0, blind: true, sideCost: true, hint: "钥口会藏 · 转到面前才露形", toast: "盲口 · 记住缎带在哪" },
    { name: "回旋", sub: "SPIN", true: "pin", keys: ["pin", "wave", "fang", "comb"], yaw: 0.7, snap: 0, tol: 0.21, time: 22, decoy: 1, drift: 0, spin: 0.78, blind: false, sideCost: true, hint: "笼子自己在转 · 对准窗口就插", toast: "回旋 · 窗口到了就插" },
    { name: "金笼", sub: "VAULT", true: "comb", keys: ["comb", "wave", "fang", "pin", "twin"], yaw: 2.7, snap: Math.PI / 12, tol: 0.155, time: 26, decoy: 2, drift: 0.16, spin: 0, blind: true, sideCost: true, hint: "最后一笼 · 盲口、游转、仿齿", toast: "金笼 · 最后一把" }
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
  const btnIn = document.getElementById("btn-in");
  const btnPadIn = document.getElementById("btn-pad-in");
  const btnCcw = document.getElementById("btn-ccw");
  const btnCw = document.getElementById("btn-cw");
  const stageLabel = document.getElementById("stage-label");
  const alignBar = document.getElementById("align-bar");
  const alignWrap = document.getElementById("align-wrap");
  const timeBar = document.getElementById("time-bar");
  const timeWrap = document.getElementById("time-wrap");
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

  const hold = { l: false, r: false, acc: 0 };
  const ptr = {
    x: CX,
    y: CY,
    on: false,
    down: false,
    id: null,
    grab: false,
    lastX: 0,
    moved: 0,
    hitKey: -1
  };

  const G = {
    mode: "title",
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 32,
    timeMax: 32,
    yaw: 0.4,
    yawv: 0,
    snap: Math.PI / 2,
    tol: 0.45,
    drift: 0,
    spin: 0,
    blind: false,
    sideCost: false,
    decoy: 0,
    trueId: "fork",
    keys: [],
    sel: 0,
    hover: -1,
    armed: 0,
    busy: false,
    ins: null,
    door: 0,
    bird: 0,
    fly: 0,
    shake: 0,
    flash: 0,
    flashCol: CYAN,
    toastT: 0,
    settle: 0,
    didAlign: false,
    wasAlign: false,
    kick: 0,
    pause: false,
    why: ""
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
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function normAng(a) {
    while (a <= -Math.PI) a += TAU;
    while (a > Math.PI) a -= TAU;
    return a;
  }
  function hexA(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }
  function seededShuffle(arr, seed) {
    const a = arr.slice();
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function angErr() {
    return Math.abs(normAng(G.yaw));
  }
  function isAligned() {
    return angErr() <= G.tol;
  }
  function alignAmt() {
    const e = angErr();
    const span = Math.max(G.tol * 3.4, 0.55);
    return clamp(1 - e / span, 0, 1);
  }
  function lockFacing(local) {
    return Math.cos(G.yaw + local);
  }
  function decoyInFront() {
    if (G.decoy <= 0) return false;
    const angs = decoyAngles();
    const need = Math.cos(G.tol * 1.15);
    for (let i = 0; i < angs.length; i++) {
      if (lockFacing(angs[i]) > need) return true;
    }
    return false;
  }
  function decoyAngles() {
    if (G.decoy >= 2) return [Math.PI, Math.PI / 2];
    if (G.decoy === 1) return [Math.PI];
    return [];
  }
  function selectedMatch() {
    const k = G.keys[G.sel];
    return !!(k && k.id === G.trueId);
  }
  function canUnlock() {
    return isAligned() && selectedMatch() && !G.busy && G.mode === "play";
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 56; i++) {
      motes.push({
        a: hash(i * 3.17) * TAU,
        r: 36 + hash(i * 5.9) * 200,
        s: 0.07 + hash(i * 2.2) * 0.2,
        z: 0.18 + hash(i * 8.1) * 0.8,
        tw: 0.4 + hash(i * 1.7) * 2.2,
        ph: hash(i * 11.4) * TAU,
        c: hash(i * 0.37) > 0.72 ? CYAN : hash(i * 0.61) > 0.82 ? GOLD : PINK
      });
    }
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
    tick() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastTick < 0.045) return;
      this.lastTick = now;
      this.beep(210, 0.035, "square", 0.03, 92);
      this.noise(0.025, 0.03, 1600);
    },
    select() {
      this.ensure();
      this.beep(660, 0.06, "triangle", 0.04, 880);
    },
    near() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.42) return;
      this.lastNear = now;
      this.beep(988, 0.08, "sine", 0.045, 1320);
    },
    slide() {
      this.ensure();
      this.beep(420, 0.16, "triangle", 0.05, 180);
      this.noise(0.12, 0.04, 900);
    },
    ok() {
      this.ensure();
      this.beep(523, 0.1, "triangle", 0.08, 784);
      this.beep(784, 0.22, "sine", 0.06, 1174);
    },
    chirp() {
      this.ensure();
      this.beep(1480, 0.08, "sine", 0.04, 1760);
      this.beep(1760, 0.12, "sine", 0.03, 1320);
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
    warn() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastWarn < 0.48) return;
      this.lastWarn = now;
      this.beep(880, 0.06, "square", 0.04, 440);
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
        life: rand(0.28, 0.78),
        max: 0.78,
        r: rand(1.2, 3.4),
        g: 280,
        col: col
      });
    }
    if (particles.length > 180) particles.splice(0, particles.length - 180);
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
    G.toastT = 1.4;
  }
  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle("hot", kind === "hot");
    hintEl.classList.toggle("warn", kind === "warn");
  }

  function layoutKeys() {
    const n = G.keys.length;
    const span = Math.min(410, 78 * n);
    const step = span / Math.max(1, n);
    const x0 = CX - span / 2 + step / 2;
    for (let i = 0; i < n; i++) {
      G.keys[i].x = x0 + i * step;
      G.keys[i].y = 602;
    }
  }

  function buildKeys(st) {
    const ids = seededShuffle(st.keys.slice(), 91 + G.stage * 17 + st.keys.length * 3);
    G.keys = ids.map(function (id) {
      return { id: id, profile: PROFILES[id], x: 0, y: 0, lift: 0 };
    });
    G.trueId = st.true;
    G.sel = 0;
    layoutKeys();
  }

  function syncHud() {
    const st = STAGES[Math.min(G.stage, STAGES.length - 1)];
    const al = G.mode === "title" ? 0.45 + 0.25 * Math.sin(G.clock * 0.8) : alignAmt();
    const ready = canUnlock();
    stageLabel.textContent = G.mode === "title"
      ? "十笼"
      : "第 " + (G.stage + 1) + " / " + STAGES.length + " 笼 · " + st.name;
    stageLabel.classList.toggle("hot", ready || G.mode === "win" || G.mode === "clear");
    stageLabel.classList.toggle("warn", G.mode === "play" && G.time < 5);
    alignBar.style.transform = "scaleX(" + al + ")";
    alignWrap.classList.toggle("hot", isAligned() && G.mode === "play");
    alignWrap.classList.toggle("warn", G.mode === "play" && al < 0.28);
    const tp = G.mode === "play" ? clamp(G.time / Math.max(0.01, G.timeMax), 0, 1) : 1;
    timeBar.style.transform = "scaleX(" + tp + ")";
    timeWrap.classList.toggle("warn", G.mode === "play" && G.time < 5);
    timeWrap.classList.toggle("hot", G.mode === "play" && G.time >= 5 && G.time < 10);
    pipsEl.innerHTML = "";
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement("span");
      s.className = "pip" + (i < G.lives ? " on" : " gone");
      pipsEl.appendChild(s);
    }
    btnIn.classList.toggle("ready", ready);
    if (G.mode === "play") {
      if (G.time < 5) setHint(st.hint, "warn");
      else if (ready) setHint("齿口吻合 · 空格插入", "hot");
      else if (isAligned()) setHint("钥口朝你了 · 选对的钥匙", "hot");
      else setHint(st.hint, "");
    } else if (G.mode === "title") setHint("先转笼子 · 锁朝你再插对的钥匙");
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind) panel.classList.add(kind);
    ovKicker.textContent = kicker || "CAGE";
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovOps.textContent = ops || OPS;
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
    buildKeys(st);
    G.mode = "play";
    G.t = 0;
    G.time = st.time;
    G.timeMax = st.time;
    G.yaw = st.yaw;
    G.yawv = 0;
    G.snap = st.snap;
    G.tol = st.tol;
    G.drift = st.drift;
    G.spin = st.spin;
    G.blind = st.blind;
    G.sideCost = st.sideCost;
    G.decoy = st.decoy;
    G.armed = 0.38;
    G.busy = false;
    G.ins = null;
    G.door = 0;
    G.bird = 0;
    G.fly = 0;
    G.didAlign = isAligned();
    G.wasAlign = isAligned();
    G.kick = 0;
    G.flash = 0;
    G.why = "";
    G.settle = 0;
    hideOverlay();
    if (!quiet) toast(st.toast, false, index === 0);
    setHint(st.hint);
    syncHud();
  }

  function startRun() {
    G.lives = LIVES;
    G.stage = 0;
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
    G.t = 0;
    G.yaw = 0.55;
    G.yawv = 0.22;
    G.snap = Math.PI / 2;
    G.tol = 0.45;
    G.drift = 0;
    G.spin = 0.18;
    G.blind = false;
    G.sideCost = false;
    G.decoy = 1;
    G.door = 0;
    G.bird = 0;
    G.fly = 0;
    G.busy = false;
    G.ins = null;
    buildKeys(STAGES[0]);
    G.keys.push({ id: "crown", profile: PROFILES.crown, x: 0, y: 0, lift: 0 });
    layoutKeys();
    showOverlay(
      "",
      "笼钥",
      "先把笼子转到锁朝你，钥口会亮金。<br />再选齿口吻合的钥匙插进去。",
      "开笼",
      "CAGE",
      OPS
    );
    setHint("先转笼子 · 锁朝你再插对的钥匙");
    syncHud();
  }

  function beginClear() {
    G.mode = "clear";
    G.settle = 1.35;
    G.flash = 0.5;
    G.flashCol = GOLD;
    G.door = 0.02;
    G.bird = 0.01;
    audio.clear();
    audio.chirp();
    toast("开笼", false, true);
    setHint("这只笼开了", "hot");
    const lx = CX + Math.sin(G.yaw) * 20;
    const ly = CY + 18;
    burst(lx, ly, GOLD, 18, 200);
    burst(lx, ly, CYAN, 10, 140);
    addRing(lx, ly, GOLD);
    floatAt(CX, CY - 40, "开", GOLD);
    syncHud();
  }

  function startWin() {
    G.mode = "win";
    G.door = 1;
    G.bird = 1;
    audio.win();
    burst(CX, CY, GOLD, 28, 220);
    burst(CX, CY, CYAN, 16, 170);
    showOverlay(
      "win",
      "笼开",
      "十只笼子全部打开。<br />鸟飞走了。",
      "再开一笼",
      "OPEN",
      "开满 " + STAGES.length + " 笼 · 剩 " + G.lives + " 命"
    );
    setHint("笼开了", "hot");
    syncHud();
  }

  function startLose() {
    G.mode = "lose";
    audio.lose();
    burst(CX, CY + 20, PINK, 18, 160);
    showOverlay(
      "lose",
      "钥折",
      G.why === "time"
        ? "时限耗尽，钥匙折在锁里。"
        : "钥匙折在锁里。<br />三命用尽。",
      "再来一局",
      "JAM",
      OPS
    );
    setHint("钥折了", "warn");
    syncHud();
  }

  function hurt(kind) {
    G.lives -= 1;
    G.shake = 0.58;
    G.flash = 0.42;
    G.flashCol = PINK;
    audio.miss();
    if (kind === "wrong") {
      toast("钥匙不对", true);
      floatAt(CX, CY + 8, "不对", PINK);
    } else if (kind === "fake") {
      toast("假锁 · 钥折", true);
      floatAt(CX, CY + 8, "假锁", PINK);
    } else if (kind === "time") {
      toast("时限到", true);
    } else {
      toast("钥口没对准", true);
      floatAt(CX, CY + 8, "偏了", PINK);
    }
    G.why = kind;
    syncHud();
    if (G.lives <= 0) {
      startLose();
      return;
    }
    if (kind === "time" || G.time <= 0) {
      G.mode = "timeout";
      G.settle = 0.85;
    }
  }

  function snapYaw() {
    if (G.snap < 0.04) return;
    G.yaw = Math.round(G.yaw / G.snap) * G.snap;
    G.yaw = normAng(G.yaw);
  }

  function nudge(dir) {
    if (G.mode !== "play" || G.busy) return;
    if (G.snap >= 0.04) {
      G.yaw = normAng(G.yaw + dir * G.snap);
      G.yawv = 0;
      G.kick = dir * 0.1;
      audio.tick();
    } else {
      G.yawv += dir * 0.9;
      audio.tick();
    }
  }

  function selectKey(i) {
    if (G.mode !== "play" || G.busy) return;
    if (i < 0 || i >= G.keys.length) return;
    if (G.sel === i) return;
    G.sel = i;
    audio.select();
    syncHud();
  }

  function selectShift(d) {
    if (!G.keys.length) return;
    const n = G.keys.length;
    selectKey((G.sel + d + n) % n);
  }

  function tryInsert() {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      overlayAction();
      return;
    }
    if (G.mode !== "play" || G.busy || G.armed > 0) return;
    const key = G.keys[G.sel];
    if (!key) return;
    let kind;
    if (isAligned() && key.id === G.trueId) kind = "ok";
    else if (isAligned()) kind = "wrong";
    else if (decoyInFront()) kind = "fake";
    else kind = "side";
    G.busy = true;
    G.ins = {
      t: 0,
      i: G.sel,
      kind: kind,
      fromX: key.x,
      fromY: key.y
    };
    audio.slide();
  }

  function lockPos() {
    const z = Math.cos(G.yaw);
    return {
      x: CX + Math.sin(G.yaw) * R * 0.78,
      y: CY + 22,
      z: z
    };
  }

  function resolveInsert(kind) {
    G.busy = false;
    G.ins = null;
    if (kind === "ok") {
      audio.ok();
      beginClear();
      return;
    }
    const cost = kind === "wrong" || ((kind === "side" || kind === "fake") && G.sideCost);
    if (!cost) {
      audio.deny();
      G.shake = 0.28;
      if (kind === "fake") toast("这是假锁", true);
      else toast("先把锁转到面前", true);
      syncHud();
      return;
    }
    hurt(kind);
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win") {
      startRun();
      return;
    }
    if (G.mode === "lose") startRun();
  }

  function updateFx(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.armed > 0) G.armed -= dt;
    if (G.kick) {
      G.kick *= Math.exp(-12 * dt);
      if (Math.abs(G.kick) < 0.002) G.kick = 0;
    }
    if (G.shake > 0) {
      G.shake = Math.max(0, G.shake - dt * 2.4);
    }
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    if (G.door > 0 && G.door < 1) {
      G.door = Math.min(1, G.door + dt * 1.35);
    }
    if (G.bird > 0) {
      G.bird = Math.min(1.6, G.bird + dt * 0.85);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 1.6;
      if (rings[i].t > 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].t += dt;
      if (floats[i].t > 0.9) floats.splice(i, 1);
    }
    for (let i = 0; i < G.keys.length; i++) {
      const want = G.sel === i && !(G.ins && G.ins.i === i) ? 1 : 0;
      G.keys[i].lift = lerp(G.keys[i].lift, want, 1 - Math.exp(-14 * dt));
    }
  }

  function updatePlay(dt) {
    if (G.spin) G.yawv += (G.spin - G.yawv * 0.15) * dt;
    if (G.drift && !ptr.grab) {
      const away = G.yaw >= 0 ? 1 : -1;
      G.yawv += away * G.drift * dt * 2.4;
    }
    if (G.snap < 0.04) {
      if (hold.l) G.yawv -= ROT_SPD * dt * 3.2;
      if (hold.r) G.yawv += ROT_SPD * dt * 3.2;
    } else if (hold.l || hold.r) {
      hold.acc += dt;
      if (hold.acc > 0.28) {
        hold.acc -= 0.2;
        nudge(hold.l ? -1 : 1);
      }
    } else hold.acc = 0;

    if (!ptr.grab) {
      G.yaw += G.yawv * dt;
      const fr = G.spin ? 1.8 : 6.5;
      G.yawv *= Math.exp(-fr * dt);
      if (Math.abs(G.yawv) < 0.01) G.yawv = 0;
    }
    G.yaw = normAng(G.yaw);

    const al = isAligned();
    if (al && !G.wasAlign) {
      audio.near();
      if (!G.didAlign) {
        G.didAlign = true;
        toast("钥口朝你了", false, true);
      }
      addRing(CX, CY + 18, GOLD);
    }
    G.wasAlign = al;

    if (G.ins) {
      const dur = G.ins.kind === "ok" ? 0.55 : 0.46;
      G.ins.t += dt / dur;
      if (G.ins.t >= 1) {
        resolveInsert(G.ins.kind);
        syncHud();
        return;
      }
    }

    G.time -= dt;
    if (G.time < 5 && G.time > 0) audio.warn();
    if (G.time <= 0) {
      G.time = 0;
      if (!G.busy) hurt("time");
    }
    syncHud();
  }

  function update(dt) {
    if (G.mode === "clear" || G.mode === "timeout") {
      G.settle -= dt;
      if (G.mode === "clear") {
        G.door = Math.min(1, G.door + dt * 1.4);
        G.bird = Math.min(1.6, G.bird + dt * 0.9);
      }
      updateFx(dt);
      if (G.mode === "title") return;
      if (G.settle <= 0) {
        if (G.mode === "timeout") startStage(G.stage, true);
        else if (G.stage + 1 >= STAGES.length) startWin();
        else startStage(G.stage + 1);
      }
      return;
    }
    updateFx(dt);
    if (G.mode === "title") {
      G.yaw = normAng(G.yaw + 0.22 * dt);
      syncHud();
      return;
    }
    if (G.mode === "win") {
      G.door = 1;
      G.bird = Math.min(1.8, G.bird + dt * 0.4);
      return;
    }
    if (G.mode === "lose") return;
    if (G.mode === "play") updatePlay(dt);
  }

  function bladePath(c, bits, s, y0) {
    const bladeW = 6.8 * s;
    const unit = 4.45 * s;
    const seg = 7.0 * s;
    let y = y0;
    c.moveTo(-bladeW * 0.5, y);
    c.lineTo(bladeW * 0.5, y);
    for (let i = 0; i < bits.length; i++) {
      const d = bits[i] * unit;
      c.lineTo(bladeW * 0.5 + d, y + seg * 0.1);
      c.lineTo(bladeW * 0.5 + d, y + seg * 0.86);
      c.lineTo(bladeW * 0.5, y + seg);
      y += seg;
    }
    c.lineTo(bladeW * 0.5, y + 3.4 * s);
    c.lineTo(-bladeW * 0.5, y + 3.4 * s);
    c.closePath();
  }

  function drawBow(c, type, r) {
    c.beginPath();
    if (type === "ring") {
      c.arc(0, 0, r, 0, TAU);
    } else if (type === "dia") {
      c.moveTo(0, -r);
      c.lineTo(r * 0.86, 0);
      c.lineTo(0, r);
      c.lineTo(-r * 0.86, 0);
      c.closePath();
    } else if (type === "sq") {
      roundRect(c, -r * 0.78, -r * 0.78, r * 1.56, r * 1.56, r * 0.22);
    } else {
      c.arc(-r * 0.42, -r * 0.18, r * 0.52, Math.PI * 0.9, 0.2, false);
      c.arc(r * 0.42, -r * 0.18, r * 0.52, Math.PI - 0.2, 0.1, false);
      c.lineTo(0, r * 1.08);
      c.closePath();
    }
  }

  function drawKey(c, x, y, s, profile, opt) {
    opt = opt || {};
    const col = opt.col || "#dcecff";
    const glow = opt.glow || null;
    const ghost = opt.ghost == null ? 1 : opt.ghost;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.globalAlpha *= ghost;
    if (glow) {
      c.shadowColor = glow;
      c.shadowBlur = 16;
    }

    c.save();
    c.translate(0, -28);
    drawBow(c, profile.bow, 12.2);
    c.fillStyle = "#140a1c";
    c.fill();
    c.lineWidth = 2.2;
    c.strokeStyle = glow || col;
    c.stroke();
    c.beginPath();
    c.arc(0, 0, 4.6, 0, TAU);
    c.fillStyle = "#05030c";
    c.fill();
    c.strokeStyle = hexA(CYAN, 0.5);
    c.lineWidth = 1.3;
    c.stroke();
    c.restore();

    roundRect(c, -5.4, -16, 10.8, 10, 2);
    c.fillStyle = hexA(col, 0.95);
    c.fill();
    c.strokeStyle = glow || hexA(CYAN, 0.55);
    c.lineWidth = 1.3;
    c.stroke();

    c.beginPath();
    bladePath(c, profile.bits, 1.18, -7);
    c.fillStyle = hexA(col, 0.96);
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = glow || hexA("#9ad8ff", 0.78);
    c.lineWidth = 1.35;
    c.stroke();
    c.restore();
  }

  function drawKeyholeOnPlate(c, profile, s, lit, visible) {
    if (!visible) {
      c.fillStyle = hexA("#07040e", 0.88);
      roundRect(c, -11 * s, -18 * s, 22 * s, 40 * s, 4 * s);
      c.fill();
      c.strokeStyle = hexA(CYAN, 0.18);
      c.lineWidth = 1;
      roundRect(c, -11 * s, -18 * s, 22 * s, 40 * s, 4 * s);
      c.stroke();
      return;
    }
    const edge = lit ? GOLD : hexA(CYAN, 0.82);
    c.save();
    c.fillStyle = lit ? hexA("#02010a", 0.96) : hexA("#05030c", 0.94);
    c.shadowColor = lit ? GOLD : CYAN;
    c.shadowBlur = lit ? 16 : 8;
    c.beginPath();
    c.arc(0, -11 * s, 8.4 * s, 0, TAU);
    c.fill();
    c.beginPath();
    bladePath(c, profile.bits, s, -3.2 * s);
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = edge;
    c.lineWidth = 1.4 * s;
    c.beginPath();
    c.arc(0, -11 * s, 8.4 * s, 0, TAU);
    c.stroke();
    c.beginPath();
    bladePath(c, profile.bits, s, -3.2 * s);
    c.stroke();
    c.restore();
  }

  function drawRibbon(c, sway) {
    c.beginPath();
    c.moveTo(0, 28);
    c.quadraticCurveTo(-6 + sway, 38, -2, 48);
    c.lineTo(3, 47);
    c.quadraticCurveTo(4 + sway * 0.4, 36, 3, 28);
    c.closePath();
    c.fillStyle = PINK;
    c.shadowColor = PINK;
    c.shadowBlur = 8;
    c.fill();
    c.shadowBlur = 0;
  }

  function drawPlate(c, local, profile, isTrue, z) {
    const a = G.yaw + local + (isTrue ? G.door * 1.22 : 0);
    const zz = Math.cos(a);
    const x = CX + Math.sin(a) * R * 0.97;
    const y = CY + 20;
    const sx = zz;
    const facing = zz;
    const absz = Math.abs(zz);
    if (absz < 0.04) return;
    const aligned = isTrue && isAligned() && G.mode !== "title";
    const showHole = !G.blind || absz > 0.62 || aligned;
    const gem = isTrue && (!G.blind || absz > 0.5);
    c.save();
    c.translate(x, y);
    c.scale(sx, 1);
    c.globalAlpha = 0.28 + 0.72 * clamp((facing + 0.2) / 1.2, 0, 1);
    const pw = 54;
    const ph = 70;
    roundRect(c, -pw / 2, -ph / 2, pw, ph, 7);
    const g = c.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
    g.addColorStop(0, "#1a1028");
    g.addColorStop(1, "#0a0614");
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = aligned ? GOLD : facing > 0.55 ? CYAN : hexA(PINK, 0.55);
    c.shadowColor = aligned ? GOLD : CYAN;
    c.shadowBlur = aligned ? 14 : 5;
    c.stroke();
    c.shadowBlur = 0;
    const riv = [[-20, -26], [20, -26], [-20, 26], [20, 26]];
    c.fillStyle = hexA(GOLD, 0.55);
    for (let i = 0; i < riv.length; i++) {
      c.beginPath();
      c.arc(riv[i][0], riv[i][1], 1.7, 0, TAU);
      c.fill();
    }
    if (gem) {
      c.beginPath();
      c.arc(0, -24, 3.1, 0, TAU);
      c.fillStyle = GOLD;
      c.shadowColor = GOLD;
      c.shadowBlur = 8;
      c.fill();
      c.shadowBlur = 0;
    } else {
      c.beginPath();
      c.arc(0, -24, 2.6, 0, TAU);
      c.fillStyle = hexA("#221018", 0.9);
      c.strokeStyle = hexA(PINK, 0.35);
      c.lineWidth = 1;
      c.fill();
      c.stroke();
    }
    c.save();
    c.translate(0, 4);
    drawKeyholeOnPlate(c, profile, 0.95, aligned && isTrue, showHole);
    c.restore();
    if (isTrue && gem) {
      c.save();
      drawRibbon(c, Math.sin(G.clock * 3.2) * 4);
      c.restore();
    }
    c.restore();
  }

  function drawBar(c, a, doorish) {
    const world = a + G.yaw + (doorish ? G.door * 1.22 : 0);
    const z = Math.cos(world);
    const x = CX + Math.sin(world) * R;
    const w = 1.6 + 2.4 * (z + 1) * 0.5;
    const alpha = 0.22 + 0.78 * clamp((z + 1) * 0.5, 0, 1);
    c.save();
    c.globalAlpha = alpha;
    c.strokeStyle = z > 0.15 ? CYAN : PINK;
    c.lineWidth = w;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x, CY + BODY_TOP);
    c.lineTo(x, CY + BODY_BOT);
    c.stroke();
    c.restore();
    return z;
  }

  function drawBird(c, x, y, s, rot, flap) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(s, s);
    c.save();
    c.translate(-2, 0);
    c.rotate(-0.55 - flap);
    c.beginPath();
    c.ellipse(0, 0, 12, 5.2, 0, 0, TAU);
    c.fillStyle = hexA(CYAN, 0.55);
    c.fill();
    c.restore();
    c.save();
    c.translate(-2, 1);
    c.rotate(0.55 + flap);
    c.beginPath();
    c.ellipse(0, 0, 11, 4.6, 0, 0, TAU);
    c.fillStyle = hexA(PINK, 0.42);
    c.fill();
    c.restore();
    c.beginPath();
    c.ellipse(0, 1, 8.5, 5.6, -0.15, 0, TAU);
    c.fillStyle = hexA(PINK, 0.9);
    c.shadowColor = PINK;
    c.shadowBlur = 10;
    c.fill();
    c.shadowBlur = 0;
    c.beginPath();
    c.arc(7.4, -2.4, 4.1, 0, TAU);
    c.fill();
    c.beginPath();
    c.moveTo(10.8, -2.6);
    c.lineTo(16.2, -1.4);
    c.lineTo(10.6, -0.2);
    c.closePath();
    c.fillStyle = GOLD;
    c.fill();
    c.beginPath();
    c.arc(8.6, -3.1, 0.85, 0, TAU);
    c.fillStyle = "#05030c";
    c.fill();
    c.beginPath();
    c.moveTo(-6, 4);
    c.quadraticCurveTo(-12, 10, -4, 8);
    c.strokeStyle = GOLD;
    c.lineWidth = 1.3;
    c.stroke();
    c.restore();
  }

  function drawCage(c) {
    const visYaw = G.yaw + G.kick;
    const saved = G.yaw;
    G.yaw = visYaw;

    c.save();
    c.fillStyle = hexA("#000", 0.35);
    c.beginPath();
    c.ellipse(CX, CY + BODY_BOT + 18, R * 0.92, 12, 0, 0, TAU);
    c.fill();
    c.restore();

    const glow = c.createRadialGradient(CX, CY + 10, 10, CX, CY + 10, R * 1.35);
    glow.addColorStop(0, hexA(isAligned() && G.mode === "play" ? GOLD : PINK, 0.16));
    glow.addColorStop(0.45, hexA(CYAN, 0.05));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = glow;
    c.beginPath();
    c.ellipse(CX, CY + 8, R * 1.15, R * 0.95, 0, 0, TAU);
    c.fill();

    const layers = [];
    for (let i = 0; i < NBAR; i++) {
      const local = (i / NBAR) * TAU;
      const doorish = Math.abs(normAng(local)) < 0.58;
      const world = local + G.yaw + (doorish ? G.door * 1.22 : 0);
      const z = Math.cos(world);
      layers.push({ z: z, kind: "bar", local: local, doorish: doorish });
    }
    layers.push({ z: -0.92, kind: "ringB" });
    layers.push({ z: 0.92, kind: "ringF" });
    layers.push({ z: -0.12, kind: "in" });
    layers.push({ z: Math.cos(G.yaw + G.door * 1.22), kind: "true" });
    const dA = decoyAngles();
    for (let i = 0; i < dA.length; i++) {
      layers.push({ z: Math.cos(G.yaw + dA[i]), kind: "decoy", local: dA[i], di: i });
    }
    layers.sort(function (a, b) { return a.z - b.z; });

    function ellipseRing(y, rx, ry, col, w) {
      c.beginPath();
      c.ellipse(CX, y, rx, ry, 0, 0, TAU);
      c.strokeStyle = col;
      c.lineWidth = w;
      c.stroke();
    }

    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      if (L.kind === "bar") drawBar(c, L.local, L.doorish);
      else if (L.kind === "ringB" || L.kind === "ringF") {
        c.save();
        c.shadowColor = CYAN;
        c.shadowBlur = 8;
        ellipseRing(CY + BODY_TOP, R, R * 0.26, hexA(CYAN, 0.85), 2.3);
        ellipseRing(CY + BODY_BOT, R, R * 0.28, hexA(CYAN, 0.9), 3.1);
        c.shadowBlur = 0;
        c.restore();
      } else if (L.kind === "in") {
        c.save();
        c.strokeStyle = hexA(GOLD, 0.55);
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(CX - R * 0.52, CY + 38);
        c.lineTo(CX + R * 0.52, CY + 38);
        c.stroke();
        c.fillStyle = hexA("#120814", 0.55);
        c.beginPath();
        c.ellipse(CX, CY + BODY_BOT - 4, R * 0.72, R * 0.2, 0, 0, TAU);
        c.fill();
        const bf = clamp(G.bird, 0, 1);
        const flap = Math.sin(G.clock * (bf > 0.05 ? 18 : 3.4)) * (bf > 0.05 ? 0.55 : 0.12);
        let bx = CX - 6;
        let by = CY + 24;
        let bs = 1;
        let br = -0.12;
        if (bf > 0) {
          const t = easeOut(clamp(bf, 0, 1));
          bx = lerp(bx, CX + 36, t) + Math.sin(G.clock * 7) * 10 * t;
          by = lerp(by, CY - 220, t);
          bs = lerp(1, 1.35, t);
          br = -0.4 - t * 0.5;
        }
        if (G.door < 0.72 || bf > 0.08) drawBird(c, bx, by, bs, br, flap);
        c.restore();
      } else if (L.kind === "true") {
        drawPlate(c, 0, PROFILES[G.trueId], true, L.z);
      } else if (L.kind === "decoy") {
        const ids = ["stair", "crown", "gate", "pin"];
        const pid = ids[(L.di + G.stage) % ids.length];
        drawPlate(c, L.local, PROFILES[pid], false, L.z);
      }
    }

    c.save();
    c.strokeStyle = hexA(PINK, 0.75);
    c.lineWidth = 2.2;
    c.beginPath();
    c.ellipse(CX, CY + BODY_TOP - 18, R * 0.72, R * 0.34, 0, Math.PI, TAU);
    c.stroke();
    const ribs = 5;
    for (let i = 0; i < ribs; i++) {
      const u = (i / (ribs - 1) - 0.5) * 1.2;
      c.beginPath();
      c.moveTo(CX, CY + BODY_TOP - 34);
      c.quadraticCurveTo(CX + u * R * 0.7, CY + BODY_TOP - 8, CX + u * R * 0.72, CY + BODY_TOP);
      c.strokeStyle = hexA(CYAN, 0.4);
      c.lineWidth = 1.2;
      c.stroke();
    }
    c.beginPath();
    c.arc(CX, CY + BODY_TOP - 40, 7, 0, TAU);
    c.strokeStyle = PINK;
    c.lineWidth = 2.1;
    c.stroke();
    c.restore();

    if (G.mode === "play" && !isAligned()) {
      const side = Math.sin(G.yaw);
      const ax = side > 0 ? CX + R + 28 : CX - R - 28;
      const pulse = 0.45 + 0.55 * Math.sin(G.clock * 5);
      c.save();
      c.globalAlpha = 0.25 + 0.5 * pulse;
      c.fillStyle = CYAN;
      c.beginPath();
      if (side > 0) {
        c.moveTo(ax + 8, CY);
        c.lineTo(ax - 10, CY - 14);
        c.lineTo(ax - 10, CY + 14);
      } else {
        c.moveTo(ax - 8, CY);
        c.lineTo(ax + 10, CY - 14);
        c.lineTo(ax + 10, CY + 14);
      }
      c.closePath();
      c.fill();
      c.restore();
    }

    G.yaw = saved;
  }

  function drawChain(c) {
    const top = 16;
    const bot = CY + BODY_TOP - 48;
    const sway = Math.sin(G.clock * 1.5) * 4 + G.yawv * 3 + G.kick * 18;
    c.save();
    c.strokeStyle = hexA(CYAN, 0.7);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(CX, top);
    c.quadraticCurveTo(CX + sway, (top + bot) * 0.5, CX, bot);
    c.stroke();
    const n = 5;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const mt = 1 - t;
      const x = mt * mt * CX + 2 * mt * t * (CX + sway) + t * t * CX;
      const y = mt * mt * top + 2 * mt * t * ((top + bot) * 0.5) + t * t * bot;
      c.beginPath();
      c.ellipse(x, y, 3.4, 5.2, sway * 0.02, 0, TAU);
      c.strokeStyle = i % 2 ? PINK : CYAN;
      c.lineWidth = 1.3;
      c.stroke();
    }
    c.beginPath();
    roundRect(c, CX - 16, 6, 32, 10, 3);
    c.fillStyle = "#140a1c";
    c.fill();
    c.strokeStyle = PINK;
    c.lineWidth = 1.4;
    c.stroke();
    c.restore();
  }

  function drawRack(c) {
    const y = 528;
    c.save();
    roundRect(c, 28, y, VW - 56, 16, 6);
    const g = c.createLinearGradient(0, y, 0, y + 16);
    g.addColorStop(0, "#1a1228");
    g.addColorStop(1, "#0b0714");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = hexA(CYAN, 0.35);
    c.lineWidth = 1.2;
    c.stroke();
    c.fillStyle = hexA("#c9c6e8", 0.7);
    c.font = "10px " + FONT;
    c.textAlign = "center";
    c.fillText("钥架", CX, y - 6);
    c.restore();
  }

  function keyScreenPos(i) {
    const k = G.keys[i];
    if (!k) return { x: CX, y: 602 };
    if (G.ins && G.ins.i === i) {
      const t = ease(clamp(G.ins.t, 0, 1));
      const lp = lockPos();
      let x = lerp(G.ins.fromX, lp.x, t);
      let y = lerp(G.ins.fromY - 8, lp.y + 8, t);
      if (G.ins.kind !== "ok" && G.ins.t > 0.55) {
        const b = (G.ins.t - 0.55) / 0.45;
        const kick = Math.sin(b * Math.PI) * 26;
        x += (G.ins.kind === "side" ? 18 : -8) * b;
        y += kick;
      }
      return { x: x, y: y, s: lerp(1.38, 0.82, t) };
    }
    return { x: k.x, y: k.y - k.lift * 18, s: 1.38 };
  }

  function drawKeys(c) {
    drawRack(c);
    for (let i = 0; i < G.keys.length; i++) {
      const k = G.keys[i];
      const pos = keyScreenPos(i);
      const sel = G.sel === i;
      const match = k.id === G.trueId;
      const glow = sel && isAligned() && match && G.mode === "play"
        ? GOLD
        : sel ? PINK : null;
      const hookY = 536;
      c.save();
      c.strokeStyle = hexA(CYAN, 0.55);
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(k.x, hookY);
      c.lineTo(pos.x, pos.y - 42 * pos.s);
      c.stroke();
      c.beginPath();
      c.arc(k.x, hookY, 3.2, 0, TAU);
      c.stroke();
      c.restore();
      const ghost = G.ins && G.ins.i === i && G.ins.kind === "ok" && G.ins.t > 0.72
        ? 1 - (G.ins.t - 0.72) / 0.28
        : 1;
      drawKey(c, pos.x, pos.y, pos.s, k.profile, { glow: glow, ghost: ghost });
      c.save();
      c.font = "11px " + FONT;
      c.textAlign = "center";
      c.fillStyle = sel ? GOLD : hexA("#8b90b8", 0.85);
      c.fillText(String(i + 1), k.x, 708);
      if (sel && G.mode === "play") {
        c.beginPath();
        c.arc(k.x, 718, 2.2, 0, TAU);
        c.fillStyle = GOLD;
        c.fill();
      }
      c.restore();
    }
  }

  function drawFx(c) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      c.beginPath();
      c.arc(p.x, p.y, p.r * a, 0, TAU);
      c.fillStyle = hexA(p.col, a);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      c.beginPath();
      c.arc(r.x, r.y, 12 + r.t * 70, 0, TAU);
      c.strokeStyle = hexA(r.col, 1 - r.t);
      c.lineWidth = 2.2 * (1 - r.t);
      c.stroke();
    }
    c.font = "bold 22px " + FONT;
    c.textAlign = "center";
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / 0.9;
      c.fillStyle = hexA(f.col, a);
      c.fillText(f.text, f.x, f.y - f.t * 36);
    }
  }

  function draw() {
    const shx = G.shake ? (hash(G.clock * 40) - 0.5) * 14 * G.shake : 0;
    const shy = G.shake ? (hash(G.clock * 53) - 0.5) * 10 * G.shake : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(scale, 0, 0, scale, ox + shx * scale, oy + shy * scale);

    const bg = ctx.createLinearGradient(0, 0, 0, VH);
    bg.addColorStop(0, "#0a0618");
    bg.addColorStop(0.45, "#05030c");
    bg.addColorStop(1, "#070412");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, VW, VH);

    const vg = ctx.createRadialGradient(CX, CY, 40, CX, 80, 420);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VW, VH);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = CX + Math.cos(m.a + G.clock * m.s) * m.r;
      const y = 80 + (m.z * 520 + G.clock * 8 * m.s) % 620;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(G.clock * m.tw + m.ph));
      ctx.beginPath();
      ctx.arc(x, y, 1.1 + m.z, 0, TAU);
      ctx.fillStyle = hexA(m.c, 0.12 + 0.32 * tw * m.z);
      ctx.fill();
    }

    drawChain(ctx);
    drawCage(ctx);
    drawKeys(ctx);
    drawFx(ctx);

    if (G.flash > 0) {
      ctx.fillStyle = hexA(G.flashCol, G.flash * 0.18);
      ctx.fillRect(0, 0, VW, VH);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#05030c";
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(W - ox, 0, ox + 2, H);
    }
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, H - oy, W, oy + 2);
    }
  }

  function hitKey(x, y) {
    let best = -1;
    let bd = 1e9;
    for (let i = 0; i < G.keys.length; i++) {
      const k = G.keys[i];
      if (y < 500) continue;
      const dx = Math.abs(x - k.x);
      const dy = y - (k.y - 20);
      if (dx > 34 || dy < -62 || dy > 58) continue;
      const d = hypot(dx, dy * 0.45);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  }

  function hitCage(x, y) {
    return hypot(x - CX, y - CY) < 128 && y < 500;
  }

  function toVirtual(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const cssX = cx - rect.left;
    const cssY = cy - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function resize() {
    const stage = document.getElementById("stage");
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  canvas.addEventListener("pointerdown", function (e) {
    audio.ensure();
    if (e.button && e.button !== 0) return;
    const v = toVirtual(e.clientX, e.clientY);
    ptr.x = v.x;
    ptr.y = v.y;
    ptr.on = true;
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.lastX = v.x;
    ptr.moved = 0;
    ptr.hitKey = hitKey(v.x, v.y);
    ptr.grab = ptr.hitKey < 0 && hitCage(v.x, v.y);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    canvas.classList.toggle("press", ptr.grab);
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", function (e) {
    const v = toVirtual(e.clientX, e.clientY);
    ptr.x = v.x;
    ptr.y = v.y;
    ptr.on = true;
    if (ptr.down && ptr.grab && G.mode === "play" && !G.busy) {
      const dx = v.x - ptr.lastX;
      ptr.lastX = v.x;
      ptr.moved += Math.abs(dx);
      G.yaw = normAng(G.yaw + dx * 0.016);
      G.yawv = dx * 0.12;
      if (ptr.moved > 6) audio.tick();
    }
    if (!ptr.down) G.hover = hitKey(v.x, v.y);
  });
  canvas.addEventListener("pointerup", function () {
    if (ptr.down && G.mode === "play" && !G.busy) {
      if (ptr.grab) {
        if (ptr.moved < 8) {
          if (isAligned() || hitCage(ptr.x, ptr.y)) tryInsert();
        } else {
          snapYaw();
        }
      } else if (ptr.hitKey >= 0 && ptr.moved < 10) {
        if (G.sel === ptr.hitKey) tryInsert();
        else selectKey(ptr.hitKey);
      }
    }
    ptr.down = false;
    ptr.grab = false;
    ptr.hitKey = -1;
    canvas.classList.remove("press");
  });
  canvas.addEventListener("pointerleave", function () {
    ptr.on = false;
    G.hover = -1;
  });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  canvas.addEventListener("wheel", function (e) {
    if (G.mode !== "play" || G.busy) return;
    const dir = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
    if (G.snap >= 0.04) nudge(dir);
    else G.yawv += dir * 0.7;
    e.preventDefault();
  }, { passive: false });

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
      if (G.mode === "play") {
        tryInsert();
        e.preventDefault();
      }
      return;
    }
    if (G.mode !== "play") return;
    if (k === "KeyQ" || k === "ArrowLeft" || k === "KeyA") {
      hold.l = true;
      if (!e.repeat) nudge(-1);
      e.preventDefault();
    } else if (k === "KeyE" || k === "ArrowRight" || k === "KeyD") {
      hold.r = true;
      if (!e.repeat) nudge(1);
      e.preventDefault();
    } else if (k === "ArrowUp" || k === "KeyW") {
      selectShift(-1);
      e.preventDefault();
    } else if (k === "ArrowDown" || k === "KeyS") {
      selectShift(1);
      e.preventDefault();
    } else if (k.indexOf("Digit") === 0 || k.indexOf("Numpad") === 0) {
      const n = parseInt(k.slice(-1), 10);
      if (n >= 1 && n <= G.keys.length) selectKey(n - 1);
    }
  });
  window.addEventListener("keyup", function (e) {
    const k = e.code;
    if (k === "KeyQ" || k === "ArrowLeft" || k === "KeyA") hold.l = false;
    if (k === "KeyE" || k === "ArrowRight" || k === "KeyD") hold.r = false;
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
  function bindIn(btn) {
    btn.addEventListener("click", function () {
      audio.ensure();
      tryInsert();
    });
  }
  bindIn(btnIn);
  bindIn(btnPadIn);
  function bindHold(btn, dir) {
    const set = function (v) {
      if (dir < 0) hold.l = v;
      else hold.r = v;
    };
    btn.addEventListener("pointerdown", function (e) {
      audio.ensure();
      set(true);
      if (G.mode === "play") nudge(dir);
      e.preventDefault();
    });
    btn.addEventListener("pointerup", function () { set(false); });
    btn.addEventListener("pointerleave", function () { set(false); });
    btn.addEventListener("pointercancel", function () { set(false); });
  }
  bindHold(btnCcw, -1);
  bindHold(btnCw, 1);

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
