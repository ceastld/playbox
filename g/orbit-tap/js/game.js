(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const LIVES = 3;
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const MUTE_KEY = "orbit-tap-mute";
  const D_RATIO = 0.52;
  const H_RATIO = Math.sqrt(1 - D_RATIO * D_RATIO);
  const A_TOP = Math.atan2(-H_RATIO, D_RATIO);
  const A_BOT = Math.atan2(H_RATIO, D_RATIO);
  const B_TOP = Math.atan2(-H_RATIO, -D_RATIO);
  const B_BOT = Math.atan2(H_RATIO, -D_RATIO);

  const WAVES = [
    {
      name: "初合",
      sub: "MEET",
      hint: "两珠叠在交点时点射",
      toast: "等它们叠上，再拍",
      need: 4,
      wa: 0.92,
      wb: -0.92,
      meetT: 1.5,
      window: 0.5,
      gold: false
    },
    {
      name: "诱星",
      sub: "BAIT",
      hint: "金珠是诱饵 · 粉青叠上才算",
      toast: "金珠会过交点，别上当",
      need: 5,
      wa: 1.18,
      wb: -1.18,
      meetT: 1.48,
      window: 0.38,
      gold: true,
      gw: 0.88,
      g0: -Math.PI / 2 - 1.89
    },
    {
      name: "疾合",
      sub: "LOCK",
      hint: "更快更紧，粉青叠上才算",
      toast: "窗口更短，等白芯再拍",
      need: 6,
      wa: 1.48,
      wb: -1.48,
      meetT: 1.46,
      window: 0.3,
      gold: true,
      gw: 1.22,
      g0: -Math.PI / 2 - 1.4
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
  const btnFire = document.getElementById("btn-fire");
  const stageLabel = document.getElementById("stage-label");
  const hitLabel = document.getElementById("hit-label");
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
    d: 62,
    h: 100,
    ax: 0,
    ay: 0,
    bx: 0,
    by: 0,
    top: { x: 0, y: 0, aAng: A_TOP, bAng: B_TOP, key: "top" },
    bot: { x: 0, y: 0, aAng: A_BOT, bAng: B_BOT, key: "bot" }
  };

  const A = { th: 0, w: 0.92, x: 0, y: 0, trail: [] };
  const B = { th: 0, w: -0.92, x: 0, y: 0, trail: [] };
  const Gold = { th: -Math.PI / 2, w: 0.84, x: 0, y: 0, on: false };

  const motes = [];
  const particles = [];
  const sparks = [];
  const ripples = [];
  const floats = [];

  const G = {
    mode: "title",
    wave: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    hits: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    total: 0,
    hold: 0,
    lock: 0,
    shot: 0,
    shake: 0,
    flash: 0,
    flashCol: PINK,
    toastT: 0,
    meet: null,
    consumed: null,
    seals: { top: 0, bot: 0 },
    taught: false,
    demoHot: false,
    judge: "",
    judgeT: 0,
    judgeCol: CYAN,
    endT: 0,
    heat: 0,
    coreSpin: 0
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
  function wrap(a) {
    a %= TAU;
    if (a < 0) a += TAU;
    return a;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastNear: -9,
    ensure() {
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
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
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
      f.frequency.value = freq || 1600;
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    shot() {
      this.ensure();
      this.beep(720, 0.06, "triangle", 0.05, 220);
      this.noise(0.05, 0.04, 2400);
    },
    hit(perfect) {
      this.ensure();
      this.beep(perfect ? 880 : 620, 0.12, "triangle", 0.09, perfect ? 1660 : 980);
      this.beep(perfect ? 1320 : 440, 0.18, "sine", perfect ? 0.07 : 0.05, perfect ? 1980 : 880);
      if (perfect) this.beep(220, 0.1, "sine", 0.04, 90);
    },
    miss() {
      this.ensure();
      this.beep(220, 0.28, "sawtooth", 0.08, 70);
      this.noise(0.14, 0.07, 700);
    },
    empty() {
      this.ensure();
      this.beep(280, 0.07, "square", 0.03, 120);
    },
    near() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.22) return;
      this.lastNear = now;
      this.beep(1180, 0.05, "sine", 0.035, 1680);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.14, "triangle", 0.07, 784);
      this.beep(784, 0.22, "sine", 0.05, 1176);
    },
    win() {
      this.ensure();
      this.beep(440, 0.16, "triangle", 0.09, 880);
      this.beep(660, 0.28, "sine", 0.07, 1320);
      this.beep(880, 0.4, "sine", 0.05, 1760);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.5, "sawtooth", 0.09, 50);
      this.beep(90, 0.7, "square", 0.05, 40);
    },
    start() {
      this.ensure();
      this.beep(220, 0.16, "sine", 0.07, 520);
    },
    tickDrone(heat) {
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
      const playing = G.mode === "play" || G.mode === "clear";
      this.drone.frequency.setTargetAtTime(58 + heat * 36, t, 0.12);
      this.droneGain.gain.setTargetAtTime(
        playing ? 0.016 + heat * 0.038 : 0.0001,
        t,
        0.14
      );
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function timeToAngle(th, target, w) {
    if (Math.abs(w) < 1e-6) return 99;
    let d;
    if (w > 0) {
      d = (target - th) % TAU;
      if (d < 0) d += TAU;
      return d / w;
    }
    d = (th - target) % TAU;
    if (d < 0) d += TAU;
    return d / -w;
  }

  function nodeOf(key) {
    return key === "bot" ? L.bot : L.top;
  }

  function nodeClose(node) {
    return hypot(A.x - node.x, A.y - node.y) + hypot(B.x - node.x, B.y - node.y);
  }

  function distTo(bead, node) {
    return hypot(bead.x - node.x, bead.y - node.y);
  }

  function forecast(node) {
    const tA = timeToAngle(A.th, node.aAng, A.w);
    const tB = timeToAngle(B.th, node.bAng, B.w);
    return {
      node: node,
      tA: tA,
      tB: tB,
      soon: Math.min(tA, tB),
      sync: Math.abs(tA - tB)
    };
  }

  function bestForecast() {
    const top = forecast(L.top);
    const bot = forecast(L.bot);
    return top.soon + top.sync * 1.35 < bot.soon + bot.sync * 1.35 ? top : bot;
  }

  function placeBeads() {
    A.x = L.ax + Math.cos(A.th) * L.R;
    A.y = L.ay + Math.sin(A.th) * L.R;
    B.x = L.bx + Math.cos(B.th) * L.R;
    B.y = L.by + Math.sin(B.th) * L.R;
    if (Gold.on) {
      Gold.x = L.cx + Math.cos(Gold.th) * L.h;
      Gold.y = L.cy + Math.sin(Gold.th) * L.h;
    }
  }

  function pushTrail(bead) {
    bead.trail.push({ x: bead.x, y: bead.y });
    if (bead.trail.length > 16) bead.trail.shift();
  }

  function applyWave(wave, withOffset) {
    A.w = wave.wa;
    B.w = wave.wb;
    const extra = withOffset ? wave.meetT : 0;
    A.th = wrap(A_TOP - wave.wa * extra);
    B.th = wrap(B_TOP - wave.wb * extra);
    Gold.on = !!wave.gold;
    Gold.w = wave.gw || 0.8;
    Gold.th = wave.g0 != null ? wave.g0 : -Math.PI / 2;
    A.trail.length = 0;
    B.trail.length = 0;
    placeBeads();
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 72; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.34 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.012 + 0.003
      });
    }
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
        col: spec.col || CYAN
      });
    }
  }

  function spark(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      if (sparks.length > 80) sparks.shift();
      const a = rand(0, TAU);
      const sp = rand(40, 220);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.16, 0.46),
        col: col
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 10) ripples.shift();
    ripples.push({ x: x, y: y, t: 1, col: col, max: max || L.R * 0.55 });
  }

  function floatAt(x, y, text, col) {
    if (floats.length > 8) floats.shift();
    floats.push({ x: x, y: y, text: text, col: col, t: 1 });
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.15;
  }

  function judge(text, col) {
    G.judge = text;
    G.judgeCol = col;
    G.judgeT = 0.62;
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

    const pad = coarse ? 58 : 28;
    L.R = Math.min(W * 0.38, (H - pad) * 0.36);
    L.R = clamp(L.R, 78, 188);
    L.d = L.R * D_RATIO;
    L.h = L.R * H_RATIO;
    L.cx = W * 0.5;
    L.cy = H * (coarse ? 0.46 : 0.5);
    L.ax = L.cx - L.d;
    L.ay = L.cy;
    L.bx = L.cx + L.d;
    L.by = L.cy;
    L.top.x = L.cx;
    L.top.y = L.cy - L.h;
    L.bot.x = L.cx;
    L.bot.y = L.cy + L.h;
    placeBeads();
  }

  function syncHud() {
    if (G.mode === "title") {
      stageLabel.textContent = "交点点射";
      hitLabel.textContent = "锁 —";
      hitLabel.classList.remove("warn");
      hintEl.textContent = coarse
        ? "两珠叠上交点时点射"
        : "两珠叠上交点时点射 · 空格 / 点击";
    } else {
      const w = WAVES[G.wave];
      stageLabel.textContent = w.name + " · " + w.sub;
      const combo = G.combo >= 2 ? "  · " + G.combo + "连" : "";
      hitLabel.textContent = "锁 " + G.hits + "/" + w.need + combo;
      hitLabel.classList.toggle("warn", G.lives <= 1 && G.mode === "play");
      hintEl.textContent = w.hint;
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
      ovKicker.textContent = "ORBIT TAP";
      ovTitle.textContent = "轨拍";
      ovLead.innerHTML = "两颗光珠在交叉轨道上疾走。<br />它们叠在交点的瞬间，点射锁定。";
      ovOps.textContent = coarse
        ? "点「点射」或点画布 · M 静音"
        : "空格 / J 点射 · 点按画布 · M 静音";
      ovBtn.textContent = "入轨";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "锁轨";
      ovLead.textContent = "十五个交点全部锁定。轨道安静下来。";
      ovOps.textContent =
        "锁点 " + G.total + " · 完美 " + G.perfects + " · 最高连击 " + G.maxCombo;
      ovBtn.textContent = "再入一轨";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "失拍";
      ovLead.textContent = "相位耗尽。光珠擦肩而过。";
      ovOps.textContent = "已锁 " + G.total + " · 第 " + (G.wave + 1) + " 轮";
      ovBtn.textContent = "再入一轨";
    }
  }

  function hidePanel() {
    overlay.classList.add("hidden");
  }

  function resetRun() {
    G.wave = 0;
    G.t = 0;
    G.lives = LIVES;
    G.hits = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.perfects = 0;
    G.total = 0;
    G.hold = 0;
    G.lock = 0;
    G.shot = 0;
    G.shake = 0;
    G.flash = 0;
    G.meet = null;
    G.consumed = null;
    G.seals.top = 0;
    G.seals.bot = 0;
    G.taught = false;
    G.judgeT = 0;
    G.endT = 0;
    particles.length = 0;
    sparks.length = 0;
    ripples.length = 0;
    floats.length = 0;
    applyWave(WAVES[0], true);
    makeMotes();
    syncHud();
  }

  function beginWave(i) {
    G.wave = i;
    G.hits = 0;
    G.meet = null;
    G.consumed = null;
    G.hold = 1.05;
    G.lock = 0.2;
    applyWave(WAVES[i], true);
    toast(WAVES[i].toast, i >= 1);
    syncHud();
  }

  function startPlay() {
    audio.start();
    resetRun();
    G.mode = "play";
    hidePanel();
    beginWave(0);
  }

  function startClear() {
    G.mode = "clear";
    G.endT = 0.92;
    G.meet = null;
    audio.wave();
    G.flash = 0.45;
    G.flashCol = CYAN;
    const w = WAVES[G.wave];
    toast(w.name + " 锁定", false);
    ripple(L.cx, L.cy, CYAN, L.R * 1.15);
  }

  function startWin() {
    G.mode = "win";
    audio.win();
    showPanel("win");
    syncHud();
  }

  function startLose() {
    G.mode = "tolose";
    G.endT = 0.62;
    audio.lose();
    G.flash = 0.55;
    G.flashCol = PINK;
    G.shake = 10;
  }

  function burst(node, col, n) {
    emit(n, {
      x: node.x,
      y: node.y,
      j: 8,
      vx0: -140,
      vx1: 140,
      vy0: -160,
      vy1: 80,
      life: 0.55,
      r0: 1.2,
      r1: 3.4,
      col: col
    });
    spark(node.x, node.y, 8, col);
    ripple(node.x, node.y, col, L.R * 0.48);
  }

  function resolveHit() {
    const node = nodeOf(G.meet.node);
    const close = nodeClose(node);
    const perfect = close < L.R * 0.155;
    G.meet.done = true;
    G.hits += 1;
    G.total += 1;
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if (perfect) G.perfects += 1;
    G.seals[G.meet.node] += 1;
    G.flash = perfect ? 0.32 : 0.2;
    G.flashCol = perfect ? GOLD : CYAN;
    audio.hit(perfect);
    burst(node, perfect ? GOLD : CYAN, perfect ? 18 : 12);
    const label = perfect ? "完美" : G.combo >= 3 ? G.combo + " 连" : "锁点";
    floatAt(node.x, node.y - 18, label, perfect ? GOLD : CYAN);
    judge(label, perfect ? GOLD : CYAN);
    if (!G.taught) {
      G.taught = true;
      toast("锁住了 · 继续等下一拍", false);
    }
    syncHud();
    if (G.hits >= WAVES[G.wave].need) startClear();
  }

  function miss(kind) {
    G.combo = 0;
    G.lives -= 1;
    if (G.meet) G.meet.done = true;
    G.flash = 0.42;
    G.flashCol = PINK;
    G.shake = 8;
    audio.miss();
    const node = G.meet ? nodeOf(G.meet.node) : { x: L.cx, y: L.cy };
    burst(node, PINK, 14);
    const text = kind === "early" ? "抢拍" : "失拍";
    floatAt(node.x, node.y - 16, text, PINK);
    judge(text, PINK);
    toast(text === "抢拍" ? "太早了" : "交点已过", true);
    syncHud();
    if (G.lives <= 0) startLose();
  }

  function fire() {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      startPlay();
      return;
    }
    if (G.mode !== "play") return;
    if (G.hold > 0 || G.lock > 0) return;
    G.lock = 0.15;
    G.shot = 1;
    audio.shot();
    ripple(L.cx, L.cy, "rgba(255,255,255,0.9)", L.R * 0.28);

    if (G.meet && !G.meet.done) {
      resolveHit();
      return;
    }

    const up = bestForecast();
    if (up.sync < 0.18 && up.soon < 0.4 && up.soon > 0.02) {
      G.consumed = { key: up.node.key, until: G.t + up.soon + 0.42 };
      G.meet = { node: up.node.key, t: 0, done: false };
      miss("early");
      return;
    }

    G.combo = 0;
    const goldTop = Gold.on && distTo(Gold, L.top) < L.R * 0.24;
    const goldBot = Gold.on && distTo(Gold, L.bot) < L.R * 0.24;
    const bait = goldTop || goldBot;
    const at = goldTop ? L.top : goldBot ? L.bot : { x: L.cx, y: L.cy - 10 };
    floatAt(at.x, at.y - 16, bait ? "诱饵" : "空拍", bait ? GOLD : "#9aa0c8");
    audio.empty();
    syncHud();
  }

  function updateOrbits(dt) {
    A.th = wrap(A.th + A.w * dt);
    B.th = wrap(B.th + B.w * dt);
    if (Gold.on) Gold.th = wrap(Gold.th + Gold.w * dt);
    placeBeads();
    pushTrail(A);
    pushTrail(B);
  }

  function updateMeet(dt) {
    const arm = L.R * 0.28;
    const leave = L.R * 0.36;
    const wave = WAVES[G.wave];

    function stacked(node) {
      return distTo(A, node) < arm && distTo(B, node) < arm;
    }
    function parted(node) {
      return distTo(A, node) > leave || distTo(B, node) > leave;
    }

    const topOn = stacked(L.top);
    const botOn = stacked(L.bot);
    const which = topOn ? "top" : botOn ? "bot" : null;

    if (G.consumed && G.t > G.consumed.until) G.consumed = null;

    if (G.meet) {
      G.meet.t += dt;
      const node = nodeOf(G.meet.node);
      if (!G.meet.done) {
        if (parted(node) || G.meet.t > wave.window) miss("late");
      }
      if (G.meet.done && (parted(node) || G.meet.t > wave.window + 0.12)) {
        G.meet = null;
      }
      return;
    }

    if (G.hold > 0) return;
    if (!which) return;
    if (G.consumed && G.consumed.key === which) return;

    G.meet = { node: which, t: 0, done: false };
    audio.near();
    if (!G.taught) toast("就是现在", false);
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
    if (G.lock > 0) G.lock -= dt;
    if (G.hold > 0) G.hold -= dt;
    if (G.shot > 0) G.shot = Math.max(0, G.shot - dt * 3.4);
    if (G.judgeT > 0) G.judgeT -= dt;
    G.coreSpin += dt * (0.35 + G.heat * 1.4);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 48 * dt;
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

  function updateDemo(dt) {
    if (A.w === 0) applyWave(WAVES[0], true);
    updateOrbits(dt);
    const close = Math.min(nodeClose(L.top), nodeClose(L.bot));
    if (close < L.R * 0.2) {
      if (!G.demoHot) {
        G.demoHot = true;
        const n = nodeClose(L.top) < nodeClose(L.bot) ? L.top : L.bot;
        ripple(n.x, n.y, GOLD, L.R * 0.4);
        spark(n.x, n.y, 6, CYAN);
      }
    } else if (close > L.R * 0.48) {
      G.demoHot = false;
    }
  }

  function updatePlay(dt) {
    updateOrbits(dt);
    if (G.mode === "play") updateMeet(dt);
    if (G.mode === "clear") {
      G.endT -= dt;
      if (G.endT <= 0) {
        if (G.wave + 1 >= WAVES.length) startWin();
        else {
          G.mode = "play";
          beginWave(G.wave + 1);
        }
      }
    }
    if (G.mode === "tolose") {
      G.endT -= dt;
      if (G.endT <= 0) {
        G.mode = "lose";
        showPanel("lose");
      }
    }
  }

  function heatNow() {
    const top = forecast(L.top);
    const bot = forecast(L.bot);
    function h(f, close) {
      const meetish = Math.exp(-f.sync * 4.4);
      const near = Math.exp(-f.soon * 1.55);
      const prox = Math.exp(-close / (L.R * 0.5));
      return meetish * (near * 0.8 + prox * 0.5);
    }
    return clamp(Math.max(h(top, nodeClose(L.top)), h(bot, nodeClose(L.bot))), 0, 1);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.5, "#090510");
    g.addColorStop(1, "#04020c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + Math.sin(G.clock * 0.7) * 0.5;
    const mag = ctx.createRadialGradient(W * 0.22, H * 0.18, 8, W * 0.22, H * 0.18, H * 0.55);
    mag.addColorStop(0, "rgba(255, 61, 184," + (0.07 + pulse * 0.04) + ")");
    mag.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, W, H);
    const cyn = ctx.createRadialGradient(W * 0.8, H * 0.78, 8, W * 0.8, H * 0.78, H * 0.5);
    cyn.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    cyn.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = cyn;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x * W + Math.sin(G.clock * 0.35 + m.p) * m.s * W;
      const y = m.y * H;
      ctx.fillStyle = "rgba(190, 220, 255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawTracks() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    ctx.beginPath();
    ctx.arc(L.ax, L.ay, L.R, 0, TAU);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(L.bx, L.by, L.R, 0, TAU);
    ctx.fillStyle = "rgba(255, 61, 184," + (0.045 + G.heat * 0.1) + ")";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 14;
    ctx.shadowColor = PINK;
    ctx.strokeStyle = "rgba(255, 61, 184, 0.55)";
    ctx.beginPath();
    ctx.arc(L.ax, L.ay, L.R, 0, TAU);
    ctx.stroke();
    ctx.shadowColor = CYAN;
    ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(L.bx, L.by, L.R, 0, TAU);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.setLineDash([3, 10]);
    ctx.strokeStyle = "rgba(255, 227, 107," + (Gold.on ? 0.35 : 0.08) + ")";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, L.h, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + G.clock * 0.05;
      ctx.beginPath();
      ctx.arc(L.ax, L.ay, L.R, a, a + 0.08);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(L.bx, L.by, L.R, a + 0.2, a + 0.28);
      ctx.stroke();
    }
  }

  function drawNode(node) {
    const f = forecast(node);
    const close = nodeClose(node);
    const soloA = hypot(A.x - node.x, A.y - node.y);
    const soloB = hypot(B.x - node.x, B.y - node.y);
    const meetHeat = Math.exp(-f.sync * 4.2) * Math.exp(-f.soon * 1.4);
    const prox = Math.exp(-close / (L.R * 0.48));
    const live = G.meet && G.meet.node === node.key && !G.meet.done;
    const seals = G.seals[node.key];
    const goldNear = Gold.on && hypot(Gold.x - node.x, Gold.y - node.y) < L.R * 0.2;

    if (f.sync < 0.3 && f.soon < 1.2) {
      const rad = 10 + f.soon * 78;
      const a = clamp((1 - f.soon / 1.2) * (1 - f.sync / 0.3), 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = live
        ? "rgba(255, 227, 107," + (0.45 + a * 0.5) + ")"
        : "rgba(0, 240, 255," + (0.18 + a * 0.55) + ")";
      ctx.lineWidth = live ? 2.6 : 1.6;
      ctx.beginPath();
      ctx.arc(node.x, node.y, rad, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    const r = 7 + prox * 6 + (live ? 4 : 0) + Math.sin(G.clock * 8) * (live ? 1.4 : 0.3);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(node.x, node.y, 1, node.x, node.y, r * 3.2);
    const col = live
      ? GOLD
      : meetHeat > 0.35
        ? CYAN
        : soloA < L.R * 0.18
          ? PINK
          : soloB < L.R * 0.18
            ? CYAN
            : goldNear
              ? GOLD
              : "#8b90b8";
    glow.addColorStop(0, col);
    glow.addColorStop(0.2, col);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.18 + meetHeat * 0.5 + prox * 0.25;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * 3.2, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.translate(node.x, node.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = live ? GOLD : "rgba(246, 243, 255, 0.85)";
    const s = r * 0.72;
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.restore();

    if (seals > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < Math.min(seals, 8); i++) {
        const a = -Math.PI / 2 + (i / Math.max(8, seals)) * TAU + G.clock * 0.2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16, a, a + 0.28);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawTrail(bead, col) {
    if (bead.trail.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 1; i < bead.trail.length; i++) {
      const p = bead.trail[i];
      const q = bead.trail[i - 1];
      const a = (i / bead.trail.length) * 0.55;
      ctx.strokeStyle = col;
      ctx.globalAlpha = a;
      ctx.lineWidth = 1 + (i / bead.trail.length) * 3.2;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBead(x, y, col, r) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(x, y, 1, x, y, r * 3.4);
    glow.addColorStop(0, col);
    glow.addColorStop(0.22, col);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.4, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, TAU);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawTether() {
    if (G.heat < 0.22) return;
    const node = G.meet ? nodeOf(G.meet.node) : (forecast(L.top).soon < forecast(L.bot).soon ? L.top : L.bot);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255, 227, 107," + (0.12 + G.heat * 0.45) + ")";
    ctx.lineWidth = 1.2 + G.heat * 2;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(node.x, node.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawCore() {
    const s = 7 + G.shot * 10 + G.heat * 3;
    ctx.save();
    ctx.translate(L.cx, L.cy);
    ctx.rotate(G.coreSpin);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = G.shot > 0 ? GOLD : "rgba(246,243,255,0.7)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = G.heat > 0.4 ? PINK : "rgba(0, 240, 255, 0.45)";
    ctx.strokeRect(-s * 0.62, -s * 0.62, s * 1.24, s * 1.24);
    ctx.restore();
  }

  function drawGold() {
    if (!Gold.on) return;
    drawBead(Gold.x, Gold.y, GOLD, 5.5);
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const rad = (1 - r.t) * r.max;
      ctx.strokeStyle = r.col;
      ctx.globalAlpha = clamp(r.t, 0, 1) * 0.7;
      ctx.lineWidth = 2 + r.t * 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.col;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < sparks.length; i++) {
      const q = sparks[i];
      ctx.strokeStyle = q.col;
      ctx.globalAlpha = clamp(q.life * 2.4, 0, 0.9);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - q.vx * 0.04, q.y - q.vy * 0.04);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.font = "700 14px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t * 1.4, 0, 1);
      ctx.fillStyle = f.col;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawJudge() {
    if (G.judgeT <= 0 || !G.judge) return;
    const a = ease(G.judgeT / 0.62);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = G.judgeCol;
    ctx.font = "900 " + Math.round(Math.min(42, W * 0.08)) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = G.judgeCol;
    ctx.shadowBlur = 18;
    ctx.fillText(G.judge, L.cx, L.cy - L.R - 18);
    ctx.restore();
  }

  function drawHold() {
    if (G.mode !== "play" || G.hold <= 0) return;
    const t = G.hold / 1.05;
    ctx.save();
    ctx.globalAlpha = clamp(t * 1.4, 0, 0.9);
    ctx.fillStyle = "#e8faff";
    ctx.font = "700 13px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(WAVES[G.wave].name + "  " + WAVES[G.wave].sub, L.cx, L.cy + L.R + 28);
    ctx.restore();
  }

  function drawVignette() {
    const vg = ctx.createRadialGradient(L.cx, L.cy, L.R * 0.2, L.cx, L.cy, Math.max(W, H) * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(3,1,10,0.5)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (G.flash > 0) {
      const c = G.flashCol === GOLD
        ? "255, 227, 107"
        : G.flashCol === CYAN
          ? "0, 240, 255"
          : "255, 61, 184";
      ctx.fillStyle = "rgba(" + c + "," + (G.flash * 0.28) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (G.mode === "play" && G.lives <= 1) {
      ctx.fillStyle = "rgba(255, 61, 184," + (0.05 + Math.sin(G.clock * 8) * 0.03) + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawSky();
    drawTracks();
    drawNode(L.top);
    drawNode(L.bot);
    drawTrail(A, PINK);
    drawTrail(B, CYAN);
    drawTether();
    drawGold();
    drawBead(A.x, A.y, PINK, 8.5);
    drawBead(B.x, B.y, CYAN, 8.5);
    drawCore();
    drawFx();
    drawJudge();
    drawHold();
    drawVignette();
  }

  let last = 0;
  let hidden = false;

  function frame(now) {
    const t = now * 0.001;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    if (hidden) dt = 0;
    G.clock += dt;
    if (G.mode === "play" || G.mode === "clear") G.t += dt;

    if (G.mode === "title") updateDemo(dt);
    else updatePlay(dt);

    G.heat = heatNow();
    if (G.mode === "play" || G.mode === "clear") audio.tickDrone(G.heat);
    updateFx(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    if (e.repeat) return;
    const k = e.key;
    if (!down) {
      if (k === " " || k === "j" || k === "J" || k === "f" || k === "F" || k === "Enter") {
        btnFire.classList.remove("held");
      }
      return;
    }
    if (k === "m" || k === "M") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === "r" || k === "R") {
      audio.ensure();
      startPlay();
      return;
    }
    if (k === " " || k === "Enter" || k === "j" || k === "J" || k === "f" || k === "F") {
      e.preventDefault();
      audio.ensure();
      btnFire.classList.add("held");
      fire();
    }
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    fire();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  btnFire.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    audio.ensure();
    btnFire.classList.add("held");
    fire();
    try { btnFire.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  function fireUp() { btnFire.classList.remove("held"); }
  btnFire.addEventListener("pointerup", fireUp);
  btnFire.addEventListener("pointercancel", fireUp);
  btnFire.addEventListener("pointerleave", fireUp);

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    startPlay();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    startPlay();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener("keydown", function (e) { onKey(e, true); });
  window.addEventListener("keyup", function (e) { onKey(e, false); });
  window.addEventListener("blur", function () {
    btnFire.classList.remove("held");
  });
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
  });
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }

  resetRun();
  G.mode = "title";
  applyWave(WAVES[0], true);
  showPanel("title");
  resize();
  makeMotes();
  syncHud();
  requestAnimationFrame(function (t) {
    last = t * 0.001;
    requestAnimationFrame(frame);
  });
})();
