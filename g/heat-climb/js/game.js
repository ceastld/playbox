(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const LX = 408;
  const RX = 552;
  const CX = 480;
  const RUNG = 35;
  const RUNGS = 48;
  const GOAL = RUNG * RUNGS;
  const CLIMB = 78;
  const SLIP = 40;
  const LIVES = 3;
  const STEP = 1 / 60;
  const LOCK = 0.36;
  const DIE_T = 0.72;
  const WIN_T = 0.9;
  const WARN = 0.74;
  const TAU = Math.PI * 2;
  const SHAFT_L = 276;
  const SHAFT_R = 684;
  const CHECKS = [0, 420, 840, 1260];
  const ZONES = [
    { at: 0, name: "井底", sub: "WELL" },
    { at: 420, name: "烟道", sub: "FLUE" },
    { at: 840, name: "灼段", sub: "SCORCH" },
    { at: 1260, name: "天窗", sub: "HATCH" }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function heatRate(p) {
    return 0.3 + 0.18 * p + 0.72 * p * p;
  }
  function zoneAt(y) {
    let z = ZONES[0];
    for (let i = 0; i < ZONES.length; i++) {
      if (y >= ZONES[i].at) z = ZONES[i];
    }
    return z;
  }
  function lastCheck(y) {
    let c = 0;
    for (let i = 0; i < CHECKS.length; i++) {
      if (y >= CHECKS[i] - 8) c = CHECKS[i];
    }
    return c;
  }
  function stepOf(y) {
    return clamp(Math.floor(y / RUNG + 0.001), 0, RUNGS);
  }

  function makeState(lives) {
    return {
      y: 12,
      bx: CX,
      heatL: 0.04,
      heatR: 0.04,
      grip: 0,
      prevGrip: 0,
      t: 0,
      lives: lives == null ? LIVES : lives,
      livesMax: LIVES,
      phase: "play",
      phaseT: 0,
      lock: LOCK,
      why: "",
      shake: 0,
      flash: 0,
      flashRgb: "0,240,255",
      camY: 12,
      bob: 0,
      lastRung: 0,
      lastWarn: -9,
      warned: false,
      taught: false,
      switched: false,
      zoneI: 0,
      bestY: 12,
      fallRot: 0,
      clock: 0
    };
  }

  function stepClimb(st, grip, dt) {
    st.clock += dt;
    if (st.phase !== "play") {
      st.phaseT += dt;
      if (st.phase === "die") {
        st.y = Math.max(0, st.y - 260 * dt);
        st.heatL = Math.max(0, st.heatL - 1.6 * dt);
        st.heatR = Math.max(0, st.heatR - 1.6 * dt);
        st.fallRot += dt * 2.4;
        st.bx += Math.sin(st.clock * 9) * 18 * dt;
      } else if (st.phase === "clear") {
        st.heatL = Math.max(0, st.heatL - 2.4 * dt);
        st.heatR = Math.max(0, st.heatR - 2.4 * dt);
        st.y += 22 * dt;
        st.bx = lerp(st.bx, CX, 0.08);
      }
      st.camY = lerp(st.camY, st.y, 0.12);
      st.shake = Math.max(0, st.shake - dt * 18);
      st.flash = Math.max(0, st.flash - dt * 1.7);
      return null;
    }

    st.t += dt;
    st.lock = Math.max(0, st.lock - dt);
    const p = clamp(st.y / GOAL, 0, 1);
    const h = heatRate(p);
    const amb = 0.04 * p * p;
    const cool = 0.56;
    const g = st.lock > 0 ? 0 : grip;

    if (g === -1 || g === 2) st.heatL += (h * (g === 2 ? 1.25 : 1) + amb) * dt;
    else st.heatL += (amb - cool) * dt;
    if (g === 1 || g === 2) st.heatR += (h * (g === 2 ? 1.25 : 1) + amb) * dt;
    else st.heatR += (amb - cool) * dt;
    st.heatL = clamp(st.heatL, 0, 1.08);
    st.heatR = clamp(st.heatR, 0, 1.08);

    if (st.lock > 0) {
      st.bob += dt * 4;
    } else if (g === -1 || g === 1) {
      st.y += CLIMB * dt;
      st.bob += dt * 11;
    } else if (g === 2) {
      st.y += CLIMB * 0.58 * dt;
      st.bob += dt * 7;
    } else {
      st.y -= SLIP * dt;
      if (st.y < 0) st.y = 0;
    }
    if (st.y > GOAL + 10) st.y = GOAL + 10;
    if (st.y > st.bestY) st.bestY = st.y;

    const tx = CX + (g === -1 ? -22 : g === 1 ? 22 : 0);
    st.bx += (tx - st.bx) * 0.14;

    st.prevGrip = st.grip;
    st.grip = g;
    st.camY = lerp(st.camY, st.y, 0.11);
    st.shake = Math.max(0, st.shake - dt * 18);
    st.flash = Math.max(0, st.flash - dt * 1.7);
    st.fallRot = lerp(st.fallRot, 0, 0.2);

    if (st.heatL >= 1 || st.heatR >= 1) {
      st.phase = "die";
      st.phaseT = 0;
      st.why = st.heatL >= st.heatR ? "left" : "right";
      st.shake = 10;
      st.flash = 0.55;
      st.flashRgb = "255,61,184";
      return "die";
    }
    if (st.y >= GOAL) {
      st.y = GOAL;
      st.phase = "clear";
      st.phaseT = 0;
      st.why = "roof";
      st.flash = 0.55;
      st.flashRgb = "0,240,255";
      return "clear";
    }
    return null;
  }

  function botGrip(st) {
    const l = st.heatL;
    const r = st.heatR;
    if (l > 0.66 && r > 0.66) return 0;
    if (l > 0.6 && r <= l) return 1;
    if (r > 0.6 && l <= r) return -1;
    return l <= r ? -1 : 1;
  }

  function simulateRun(gripFn, lives) {
    const st = makeState(lives == null ? 1 : lives);
    st.lock = 0;
    let t = 0;
    const limit = 120;
    while (t < limit && st.phase === "play") {
      stepClimb(st, gripFn(st), STEP);
      t += STEP;
    }
    return {
      phase: st.phase,
      y: Math.round(st.y),
      t: Math.round(t * 10) / 10,
      heat: Math.round(Math.max(st.heatL, st.heatR) * 100),
      steps: stepOf(st.y)
    };
  }

  if (typeof document === "undefined") {
    const r = simulateRun(botGrip, 1);
    const stuck = simulateRun(function () { return -1; }, 1);
    const ok = r.phase === "clear" && stuck.phase === "die";
    console.log((r.phase === "clear" ? "OK" : "TRY") + " heat-climb t=" + r.t + " y=" + r.y + " steps=" + r.steps + " heat=" + r.heat);
    console.log((stuck.phase === "die" ? "OK" : "TRY") + " never-switch dies t=" + stuck.t + " y=" + stuck.y);
    if (!ok) process.exitCode = 1;
    else console.log("heat-climb climb ok");
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
  const zoneLabel = document.getElementById("zone-label");
  const heightLabel = document.getElementById("height-label");
  const fillL = document.getElementById("fill-l");
  const fillR = document.getElementById("fill-r");
  const heatLEl = document.getElementById("heat-l");
  const heatREl = document.getElementById("heat-r");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const padEl = document.getElementById("pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "按住左 / 右换手 · 抓太久会烫 · 松手会溜";
    padEl.style.display = "flex";
  }

  const keys = { left: false, right: false };
  const pad = { left: false, right: false };
  const pointers = new Map();

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };
  const stars = [];
  const windows = [];
  const motes = [];
  const particles = [];
  const embers = [];

  let mode = "title";
  let overlayKind = "title";
  let frozen = true;
  let paused = false;
  let toastT = 0;
  let last = 0;
  let acc = 0;
  let hudTick = 0;
  let runGen = 0;
  let st = makeState();
  let demoSide = -1;
  let demoT = 0;

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * (GOAL + 400),
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.4 + 0.08,
        p: Math.random() * TAU
      });
    }
  }

  function makeWindows() {
    windows.length = 0;
    for (let k = 0; k < 22; k++) {
      const y = 80 + k * 86 + (k % 3) * 10;
      windows.push({
        side: k % 2 === 0 ? -1 : 1,
        y: y,
        h: 28 + (k % 4) * 4,
        mag: k % 3 !== 1,
        p: k * 0.7
      });
    }
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: rand(SHAFT_L + 20, SHAFT_R - 20),
        y: rand(0, GOAL + 80),
        s: rand(0.8, 2.2),
        v: rand(8, 22),
        a: rand(0.06, 0.18),
        p: rand(0, TAU)
      });
    }
  }

  makeStars();
  makeWindows();
  makeMotes();

  const SFX = {
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
        this.master.gain.value = this.muted ? 0 : 0.26;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
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
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 1100;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.14, "sine", 0.07, 440);
      this.beep(330, 0.2, "triangle", 0.04, 660);
    },
    grab: function (side) {
      this.ensure();
      this.beep(side < 0 ? 240 : 360, 0.07, "triangle", 0.045, side < 0 ? 180 : 520);
    },
    switchHand: function (side) {
      this.ensure();
      this.beep(side < 0 ? 280 : 420, 0.09, "sine", 0.05, side < 0 ? 160 : 640);
      this.beep(140, 0.08, "square", 0.02);
    },
    rung: function () {
      this.ensure();
      this.beep(720, 0.04, "sine", 0.02, 980);
    },
    warn: function () {
      this.ensure();
      this.beep(220, 0.11, "square", 0.035, 130);
    },
    burn: function () {
      this.ensure();
      this.noise(0.28, 0.1);
      this.beep(320, 0.48, "sawtooth", 0.08, 60);
    },
    zone: function () {
      this.ensure();
      this.beep(480, 0.1, "triangle", 0.05, 720);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, "sine", 0.08, 660);
      const self = this;
      const g = runGen;
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(660, 0.18, "sine", 0.08, 880);
      }, 90);
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(880, 0.32, "sine", 0.1, 1320);
      }, 200);
    },
    lose: function () {
      this.ensure();
      this.beep(180, 0.55, "sawtooth", 0.09, 50);
      this.beep(90, 0.72, "square", 0.05, 40);
    },
    tickDrone: function (hot, playing) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 62;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const f = 58 + hot * 110;
      this.drone.frequency.setTargetAtTime(f, t, 0.1);
      const vol = playing ? 0.016 + hot * 0.045 : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.12);
    },
    hushDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.18);
    }
  };

  try {
    if (localStorage.getItem("heat-climb-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
    btnMute.setAttribute("aria-label", SFX.muted ? "取消静音" : "静音");
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.26;
    if (m) SFX.hushDrone();
    syncMuteBtn();
    try {
      localStorage.setItem("heat-climb-mute", m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.6, spec.j * 0.6),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        kind: spec.kind || 0
      });
    }
  }

  function burstHands(kind) {
    const sy = st.y + 8;
    const rgbKind = kind < 0 ? 1 : 0;
    emit(14, {
      x: kind < 0 ? LX : RX,
      y: sy,
      j: 6,
      vx0: kind < 0 ? -70 : 20,
      vx1: kind < 0 ? -20 : 70,
      vy0: 20,
      vy1: 90,
      life: 0.55,
      r0: 1.4,
      r1: 3.6,
      kind: rgbKind
    });
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.65;
  }

  function renderHud() {
    if (mode === "title") {
      zoneLabel.textContent = "交替冷却";
      heightLabel.textContent = "—";
      heightLabel.classList.remove("warn");
      fillL.style.width = "8%";
      fillR.style.width = "8%";
      heatLEl.classList.remove("hot");
      heatREl.classList.remove("hot");
    } else {
      const z = zoneAt(st.y);
      const n = stepOf(st.y);
      zoneLabel.textContent = z.name + " · " + z.sub;
      heightLabel.textContent = n + " / " + RUNGS;
      const hot = Math.max(st.heatL, st.heatR) > WARN && (mode === "play" || st.phase === "play");
      heightLabel.classList.toggle("warn", hot);
      fillL.style.width = clamp(st.heatL, 0, 1) * 100 + "%";
      fillR.style.width = clamp(st.heatR, 0, 1) * 100 + "%";
      heatLEl.classList.toggle("hot", st.heatL > WARN);
      heatREl.classList.toggle("hot", st.heatR > WARN);
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
      ovKicker.textContent = "HEAT";
      ovTitle.textContent = "烫梯";
      ovLead.innerHTML = "按住一侧往上爬，抓的那根会发烫。<br />另一侧冷却。烫了就换手，松手会往下溜。";
      ovOps.textContent = coarse
        ? "按住左 / 右换手 · 爬到天窗凉台 · M 静音"
        : "A D / ← → 按住换手 · 点屏幕左/右半边 · M 静音";
      ovBtn.textContent = "上梯";
    } else if (kind === "lose") {
      ovKicker.textContent = "BURN";
      ovTitle.textContent = "烫手了";
      const side = st.why === "left" ? "左侧轨道烧红。" : "右侧轨道烧红。";
      ovLead.textContent = side + " 爬到 " + stepOf(st.bestY) + " / " + RUNGS + " 阶。换手，或松手让两边都凉。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再爬一次";
    } else if (kind === "win") {
      ovKicker.textContent = "COOL";
      ovTitle.textContent = "到顶";
      ovLead.textContent = "天窗凉台到了。梯子还在发烫，手已经换够了。";
      ovOps.textContent = "用时 " + st.t.toFixed(1) + " 秒 · " + stepOf(GOAL) + " 阶";
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
    st = makeState();
    st.y = 90;
    st.camY = 90;
    st.heatL = 0.18;
    st.heatR = 0.12;
    st.lock = 0;
    demoSide = -1;
    demoT = 0;
    particles.length = 0;
    embers.length = 0;
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "抓一侧往上爬 · 烫了就换手 · 松手会往下溜"
      : "抓一侧往上爬 · 烫了就换手 · 松手会往下溜";
  }

  function startPlay() {
    runGen += 1;
    SFX.start();
    mode = "play";
    acc = 0;
    pointers.clear();
    keys.left = false;
    keys.right = false;
    pad.left = false;
    pad.right = false;
    btnLeft.classList.remove("held");
    btnRight.classList.remove("held");
    st = makeState(LIVES);
    st.flash = 0.3;
    particles.length = 0;
    embers.length = 0;
    hideOverlay();
    renderHud();
    showToast("抓一侧往上爬 · 烫了换手");
    hintEl.textContent = coarse
      ? "按住左 / 右 · 双手一起抓会两边都烫"
      : "A D / ← → 按住换手 · 点屏幕左/右 · M 静音";
  }

  function respawn() {
    const y = lastCheck(st.bestY);
    const lives = st.lives;
    const best = st.bestY;
    const taught = true;
    st = makeState(lives);
    st.y = y + 10;
    st.camY = st.y;
    st.bestY = best;
    st.taught = taught;
    st.switched = true;
    st.lock = 0.5;
    st.flash = 0.32;
    st.flashRgb = "0,240,255";
    st.zoneI = ZONES.indexOf(zoneAt(st.y));
    if (st.zoneI < 0) st.zoneI = 0;
    particles.length = 0;
    showToast("还剩 " + st.lives + " 命 · 从" + zoneAt(st.y).name + "再爬", true);
    renderHud();
  }

  function onDieDone() {
    st.lives -= 1;
    if (st.lives <= 0) {
      mode = "lose";
      SFX.hushDrone();
      SFX.lose();
      setOverlay("lose");
      renderHud();
      return;
    }
    respawn();
  }

  function onClearDone() {
    mode = "win";
    SFX.hushDrone();
    setOverlay("win");
    renderHud();
  }

  function gatherGrip() {
    let L = keys.left || pad.left;
    let R = keys.right || pad.right;
    pointers.forEach(function (side) {
      if (side < 0) L = true;
      else R = true;
    });
    if (L && R) return 2;
    if (L) return -1;
    if (R) return 1;
    return 0;
  }

  function toSY(wy) {
    return VH * 0.7 - (wy - st.camY);
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

  function railColor(heat, mag) {
    const h = clamp(heat, 0, 1);
    const coolR = mag ? 90 : 20;
    const coolG = mag ? 24 : 70;
    const coolB = mag ? 70 : 90;
    const midR = mag ? 255 : 0;
    const midG = mag ? 61 : 240;
    const midB = mag ? 184 : 255;
    const hotR = 255;
    const hotG = 236;
    const hotB = 210;
    let r;
    let g;
    let b;
    if (h < 0.55) {
      const t = h / 0.55;
      r = mix(coolR, midR, t);
      g = mix(coolG, midG, t);
      b = mix(coolB, midB, t);
    } else {
      const t = (h - 0.55) / 0.45;
      r = mix(midR, hotR, t);
      g = mix(midG, hotG, t);
      b = mix(midB, hotB, t);
    }
    return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
  }

  function drawSky() {
    const p = clamp(st.y / GOAL, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, p > 0.7 ? "#140818" : "#090616");
    g.addColorStop(0.5, "#070412");
    g.addColorStop(1, p > 0.4 ? "#1a0814" : "#0c0714");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const mag = ctx.createRadialGradient(140, VH + 40, 10, 140, VH + 40, 380);
    mag.addColorStop(0, "rgba(255,61,184," + (0.08 + p * 0.14) + ")");
    mag.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, VW, VH);

    const cyan = ctx.createRadialGradient(820, 20, 8, 820, 20, 280);
    cyan.addColorStop(0, "rgba(0,240,255," + (0.05 + (1 - p) * 0.06) + ")");
    cyan.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = cyan;
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const sy = toSY(s.y);
      if (sy < -8 || sy > VH + 8) continue;
      const tw = 0.5 + Math.sin(st.clock * 2.1 + s.p) * 0.5;
      ctx.fillStyle = "rgba(230,236,255," + (s.a * tw) + ")";
      ctx.beginPath();
      ctx.arc(s.x, sy, s.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawShaft() {
    ctx.fillStyle = "#0a0714";
    ctx.fillRect(0, 0, SHAFT_L, VH);
    ctx.fillRect(SHAFT_R, 0, VW - SHAFT_R, VH);

    ctx.fillStyle = "rgba(255,61,184,0.08)";
    ctx.fillRect(SHAFT_L - 10, 0, 10, VH);
    ctx.fillStyle = "rgba(0,240,255,0.08)";
    ctx.fillRect(SHAFT_R, 0, 10, VH);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SHAFT_L, 0);
    ctx.lineTo(SHAFT_L, VH);
    ctx.moveTo(SHAFT_R, 0);
    ctx.lineTo(SHAFT_R, VH);
    ctx.stroke();

    const back = ctx.createLinearGradient(SHAFT_L, 0, SHAFT_R, 0);
    back.addColorStop(0, "rgba(255,61,184,0.05)");
    back.addColorStop(0.5, "rgba(8,6,18,0)");
    back.addColorStop(1, "rgba(0,240,255,0.05)");
    ctx.fillStyle = back;
    ctx.fillRect(SHAFT_L, 0, SHAFT_R - SHAFT_L, VH);

    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    const y0 = st.camY - 80;
    const y1 = st.camY + VH;
    const g0 = Math.floor(y0 / 70) * 70;
    for (let gy = g0; gy < y1; gy += 70) {
      const sy = toSY(gy);
      ctx.beginPath();
      ctx.moveTo(SHAFT_L + 8, sy);
      ctx.lineTo(SHAFT_R - 8, sy);
      ctx.stroke();
    }
  }

  function drawWindows() {
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const sy = toSY(w.y);
      if (sy < -40 || sy > VH + 40) continue;
      const x = w.side < 0 ? 48 : VW - 118;
      const pulse = 0.45 + Math.sin(st.clock * 1.4 + w.p) * 0.35;
      ctx.save();
      drawRoundRect(x, sy - w.h * 0.5, 64, w.h, 5);
      ctx.fillStyle = w.mag
        ? "rgba(255,61,184," + (0.08 + pulse * 0.12) + ")"
        : "rgba(0,240,255," + (0.08 + pulse * 0.12) + ")";
      ctx.fill();
      ctx.strokeStyle = w.mag ? "rgba(255,61,184,0.35)" : "rgba(0,240,255,0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,227,107,0.12)";
      ctx.fillRect(x + 8, sy - 4, 10, 6);
      ctx.restore();
    }
  }

  function drawMarks() {
    ctx.textAlign = "right";
    ctx.font = "11px sans-serif";
    for (let k = 0; k <= RUNGS; k += 4) {
      const y = k * RUNG;
      const sy = toSY(y);
      if (sy < 8 || sy > VH - 8) continue;
      ctx.fillStyle = "rgba(139,144,184,0.55)";
      ctx.fillText(k + "", SHAFT_L - 16, sy + 4);
      ctx.strokeStyle = "rgba(139,144,184,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(SHAFT_L - 10, sy);
      ctx.lineTo(SHAFT_L, sy);
      ctx.stroke();
    }
    ctx.textAlign = "left";
    for (let i = 0; i < ZONES.length; i++) {
      const z = ZONES[i];
      const sy = toSY(z.at);
      if (sy < 18 || sy > VH - 18) continue;
      ctx.fillStyle = i % 2 ? "rgba(0,240,255,0.55)" : "rgba(255,61,184,0.55)";
      ctx.font = "10px sans-serif";
      ctx.fillText(z.name, SHAFT_R + 16, sy + 4);
    }
  }

  function drawFloor() {
    const sy = toSY(0);
    if (sy < -20 || sy > VH + 80) return;
    ctx.save();
    ctx.fillStyle = "#120818";
    drawRoundRect(SHAFT_L + 18, sy + 18, SHAFT_R - SHAFT_L - 36, 70, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,61,184,0.45)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,61,184,0.12)";
    ctx.fillRect(SHAFT_L + 40, sy + 28, SHAFT_R - SHAFT_L - 80, 4);
    ctx.restore();
  }

  function drawRoof() {
    const sy = toSY(GOAL);
    if (sy < -80 || sy > VH + 40) return;
    ctx.save();
    const pulse = 0.65 + Math.sin(st.clock * 2.6) * 0.35;
    const rg = ctx.createRadialGradient(CX, sy, 10, CX, sy, 120);
    rg.addColorStop(0, "rgba(0,240,255," + (0.16 + pulse * 0.1) + ")");
    rg.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(CX, sy - 8, 120, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#0c1a22";
    drawRoundRect(SHAFT_L + 24, sy - 22, SHAFT_R - SHAFT_L - 48, 28, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,240,255,0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(CX, sy - 8, 26, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,240,255,0.8)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("凉", CX, sy - 3);

    ctx.fillStyle = "rgba(0,240,255,0.12)";
    drawRoundRect(CX - 70, sy - 52, 140, 16, 8);
    ctx.fill();
    ctx.restore();
  }

  function drawRail(x, heat, mag) {
    const col = railColor(heat, mag);
    const glow = 6 + heat * 16;
    const top = -20;
    const bot = VH + 20;
    ctx.save();
    ctx.strokeStyle = mag
      ? "rgba(255,61,184," + (0.12 + heat * 0.35) + ")"
      : "rgba(0,240,255," + (0.12 + heat * 0.35) + ")";
    ctx.lineWidth = glow;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bot);
    ctx.stroke();

    ctx.strokeStyle = col;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bot);
    ctx.stroke();

    ctx.strokeStyle = heat > 0.8 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 1.6, top);
    ctx.lineTo(x - 1.6, bot);
    ctx.stroke();
    ctx.restore();
  }

  function drawRungs() {
    const y0 = st.camY - 60;
    const y1 = st.camY + VH * 0.85;
    const k0 = Math.max(0, Math.floor(y0 / RUNG));
    const k1 = Math.min(RUNGS, Math.ceil(y1 / RUNG));
    const avg = (st.heatL + st.heatR) * 0.5;
    for (let k = k0; k <= k1; k++) {
      const y = k * RUNG;
      const sy = toSY(y);
      const wobble = avg > 0.55 ? Math.sin(st.clock * 18 + k) * (avg - 0.55) * 1.6 : 0;
      ctx.save();
      ctx.strokeStyle = railColor(avg * 0.85, k % 2 === 0);
      ctx.globalAlpha = 0.55 + avg * 0.35;
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(LX, sy + wobble);
      ctx.lineTo(RX, sy - wobble);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawClimber() {
    const g = st.grip;
    const sy = toSY(st.y);
    const x = st.bx;
    const bob = Math.sin(st.bob) * (g === 0 ? 1.4 : 3.2);
    const bodyY = sy - 6 + bob;
    ctx.save();
    ctx.translate(x, bodyY);
    if (st.phase === "die") ctx.rotate(st.fallRot);

    const lHold = g === -1 || g === 2;
    const rHold = g === 1 || g === 2;
    const lhx = LX - x;
    const rhx = RX - x;
    const lhy = (lHold ? -16 : 14) - bob * 0.3;
    const rhy = (rHold ? -16 : 14) - bob * 0.3;

    ctx.strokeStyle = "rgba(246,243,255,0.55)";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    const phase = st.bob;
    const ll = 16 + Math.sin(phase) * 7;
    const rl = 16 - Math.sin(phase) * 7;
    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.quadraticCurveTo(-10, 18, -8, 10 + ll);
    ctx.moveTo(5, 10);
    ctx.quadraticCurveTo(10, 18, 8, 10 + rl);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.quadraticCurveTo(-12, lhy * 0.4, lhx, lhy);
    ctx.moveTo(7, -6);
    ctx.quadraticCurveTo(12, rhy * 0.4, rhx, rhy);
    ctx.stroke();

    ctx.fillStyle = "#161022";
    drawRoundRect(-13, -16, 26, 30, 8);
    ctx.fill();
    ctx.strokeStyle = g < 0 ? "#ff3db8" : g > 0 && g !== 2 ? "#00f0ff" : "#c9c6e8";
    ctx.lineWidth = 1.7;
    ctx.stroke();

    ctx.fillStyle = "#1c1428";
    ctx.beginPath();
    ctx.arc(0, -22, 11, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = "rgba(0,240,255,0.85)";
    drawRoundRect(-7, -25, 14, 6, 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,227,107,0.9)";
    ctx.beginPath();
    ctx.arc(0, -22, 1.6, 0, TAU);
    ctx.fill();

    function hand(hx, hy, hot, mag) {
      ctx.save();
      ctx.translate(hx, hy);
      const glow = 0.25 + hot * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, 7 + hot * 5, 0, TAU);
      ctx.fillStyle = mag
        ? "rgba(255,61,184," + glow * 0.35 + ")"
        : "rgba(0,240,255," + glow * 0.35 + ")";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, TAU);
      ctx.fillStyle = hot > 0.75 ? "#fff6d8" : mag ? "#ff3db8" : "#00f0ff";
      ctx.fill();
      ctx.restore();
    }
    hand(lhx, lhy, lHold ? st.heatL : st.heatL * 0.35, true);
    hand(rhx, rhy, rHold ? st.heatR : st.heatR * 0.35, false);

    ctx.restore();
  }

  function drawMotes() {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const sy = toSY(m.y);
      if (sy < -6 || sy > VH + 6) continue;
      const ox = Math.sin(st.clock * 0.7 + m.p) * 8;
      ctx.fillStyle = "rgba(255,180,140," + m.a + ")";
      ctx.beginPath();
      ctx.arc(m.x + ox, sy, m.s, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      let col;
      if (p.kind === 1) col = "rgba(255,61,184,";
      else if (p.kind === 2) col = "rgba(255,227,107,";
      else if (p.kind === 3) col = "rgba(255,255,255,";
      else col = "rgba(0,240,255,";
      const sy = toSY(p.y);
      ctx.fillStyle = col + (0.12 + a * 0.75) + ")";
      ctx.beginPath();
      ctx.arc(p.x, sy, p.r * a, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      const sy = toSY(e.y);
      ctx.fillStyle = "rgba(255,120,60," + clamp(e.life * 2, 0, 0.55) + ")";
      ctx.fillRect(e.x, sy, 2, 3);
    }
    ctx.restore();
  }

  function drawHeatBloom() {
    const maxH = Math.max(st.heatL, st.heatR);
    if (maxH < 0.35) return;
    const sy = toSY(st.y);
    const rg = ctx.createRadialGradient(CX, sy, 10, CX, sy, 160);
    rg.addColorStop(0, "rgba(255,80,40," + (maxH * 0.1) + ")");
    rg.addColorStop(1, "rgba(255,80,40,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(SHAFT_L, 0, SHAFT_R - SHAFT_L, VH);
  }

  function drawVignette() {
    const vig = ctx.createRadialGradient(VW * 0.5, VH * 0.55, 80, VW * 0.5, VH * 0.5, 520);
    vig.addColorStop(0, "rgba(5,3,12,0)");
    vig.addColorStop(1, "rgba(5,3,12,0.5)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawFlash() {
    if (st.flash <= 0) return;
    ctx.fillStyle = "rgba(" + st.flashRgb + "," + (st.flash * 0.24) + ")";
    ctx.fillRect(0, 0, VW, VH);
  }

  function spawnFx(dt) {
    const maxH = Math.max(st.heatL, st.heatR);
    if (Math.random() < (0.15 + maxH * 0.7) * dt * 18) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const heat = side < 0 ? st.heatL : st.heatR;
      if (heat > 0.28) {
        emit(1, {
          x: side < 0 ? LX : RX,
          y: st.y + rand(-20, 30),
          j: 3,
          vx0: side * 8,
          vx1: side * 28,
          vy0: 10,
          vy1: 50,
          life: 0.45 + heat * 0.3,
          r0: 1,
          r1: 2.6,
          kind: heat > 0.7 ? 2 : side < 0 ? 1 : 0
        });
      }
    }
    if (maxH > 0.55 && Math.random() < 0.4) {
      embers.push({
        x: rand(LX - 8, RX + 8),
        y: st.y - rand(10, 80),
        vy: rand(20, 50),
        life: rand(0.4, 0.9)
      });
      if (embers.length > 40) embers.shift();
    }
    for (let i = 0; i < motes.length; i++) {
      motes[i].y += motes[i].v * dt;
      if (motes[i].y > st.camY + 400) motes[i].y = st.camY - 120;
    }
  }

  function stepParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      p.vx *= 0.98;
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.life -= dt;
      e.y += e.vy * dt;
      if (e.life <= 0) embers.splice(i, 1);
    }
  }

  function playEvents(grip) {
    if (st.phase !== "play") return;
    if (grip !== st.prevGrip) {
      if (grip === -1 || grip === 1) {
        if (st.prevGrip === 0) SFX.grab(grip);
        else if (st.prevGrip === 2 || st.prevGrip === -grip) SFX.switchHand(grip);
        if (st.prevGrip !== 0 && st.prevGrip !== grip && grip !== 2) {
          st.switched = true;
          burstHands(grip);
        }
      }
    }
    const rung = stepOf(st.y);
    if (rung > st.lastRung) {
      st.lastRung = rung;
      if (rung > 0 && (grip === -1 || grip === 1 || grip === 2)) SFX.rung();
    }
    const maxH = Math.max(st.heatL, st.heatR);
    if (maxH > WARN) {
      if (!st.warned) {
        st.warned = true;
        const which = st.heatL >= st.heatR ? "左手烫了 · 换右" : "右手烫了 · 换左";
        showToast(which, true);
      }
      if (st.t - st.lastWarn > 0.9) {
        st.lastWarn = st.t;
        SFX.warn();
      }
    } else if (maxH < WARN * 0.72) {
      st.warned = false;
    }
    if (!st.taught && st.t > 1.8) {
      st.taught = true;
      showToast("烫了就换另一只手");
    }
    if (st.grip === 2 && st.t - st.lastWarn > 1.2) {
      st.lastWarn = st.t;
      showToast("双手一起抓，两边都烫", true);
    }
    const zi = ZONES.indexOf(zoneAt(st.y));
    if (zi > st.zoneI && zi > 0) {
      st.zoneI = zi;
      SFX.zone();
      showToast(ZONES[zi].name + " · 更烫了");
      emit(16, {
        x: CX,
        y: st.y + 10,
        j: 18,
        vx0: -50,
        vx1: 50,
        vy0: 10,
        vy1: 70,
        life: 0.6,
        r0: 1.4,
        r1: 3.2,
        kind: zi % 2 ? 0 : 1
      });
    }
  }

  function draw() {
    fit();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, view.cssW, view.cssH);

    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);
    if (st.shake > 0.2) {
      ctx.translate(rand(-st.shake, st.shake), rand(-st.shake, st.shake) * 0.35);
    }
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    drawSky();
    drawStars();
    drawShaft();
    drawWindows();
    drawMarks();
    drawFloor();
    drawRoof();
    drawHeatBloom();
    drawMotes();
    drawRail(LX, st.heatL, true);
    drawRail(RX, st.heatR, false);
    drawRungs();
    drawParticles();
    drawClimber();
    drawVignette();
    drawFlash();

    if (paused && mode === "play") {
      ctx.fillStyle = "rgba(5,3,12,0.45)";
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#c9c6e8";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("暂停", VW * 0.5, VH * 0.5);
    }

    ctx.restore();
  }

  function titleTick(dt) {
    demoT += dt;
    if (demoT > 1.15) {
      demoT = 0;
      demoSide = -demoSide;
    }
    const g = demoSide;
    st.lock = 0;
    st.heatL = lerp(st.heatL, g < 0 ? 0.55 : 0.12, 0.04);
    st.heatR = lerp(st.heatR, g > 0 ? 0.55 : 0.12, 0.04);
    st.grip = g;
    st.y += 22 * dt;
    if (st.y > 220) st.y = 70;
    st.camY = lerp(st.camY, st.y, 0.08);
    st.bx = lerp(st.bx, CX + g * 22, 0.1);
    st.bob += dt * 8;
    spawnFx(dt);
    stepParticles(dt);
  }

  function tickPlay(dt) {
    const grip = gatherGrip();
    const ev = stepClimb(st, grip, dt);
    playEvents(st.grip);
    spawnFx(dt);
    stepParticles(dt);
    if (ev === "die") {
      SFX.burn();
      burstHands(st.why === "left" ? -1 : 1);
      emit(22, {
        x: st.bx,
        y: st.y,
        j: 12,
        vx0: -120,
        vx1: 120,
        vy0: -40,
        vy1: 140,
        life: 0.7,
        r0: 1.6,
        r1: 4.2,
        kind: 1
      });
      renderHud();
    } else if (ev === "clear") {
      SFX.win();
      emit(28, {
        x: CX,
        y: GOAL,
        j: 22,
        vx0: -90,
        vx1: 90,
        vy0: -40,
        vy1: 80,
        life: 0.85,
        r0: 1.6,
        r1: 4.4,
        kind: 0
      });
      renderHud();
    }
    return ev;
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
    return (x - view.ox) / view.scale;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;

    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }

    if (paused && mode === "play") {
      SFX.hushDrone();
      draw();
      return;
    }

    if (mode === "title") {
      acc += dt;
      while (acc >= STEP) {
        titleTick(STEP);
        acc -= STEP;
      }
      SFX.tickDrone(0.22, false);
      draw();
      return;
    }

    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      const ev = tickPlay(STEP);
      acc -= STEP;
      steps += 1;
      if (st.phase === "die" && st.phaseT >= DIE_T) {
        onDieDone();
        acc = 0;
        break;
      }
      if (st.phase === "clear" && st.phaseT >= WIN_T) {
        onClearDone();
        acc = 0;
        break;
      }
      if (ev === "die" || ev === "clear") break;
    }

    const hot = clamp(Math.max(st.heatL, st.heatR), 0, 1);
    SFX.tickDrone(hot, mode === "play" && st.phase === "play");

    hudTick += dt;
    if (hudTick > 0.08) {
      hudTick = 0;
      renderHud();
    }
    draw();
  }

  function onOverlayAction() {
    SFX.ensure();
    if (overlayKind === "title" || overlayKind === "lose" || overlayKind === "win") {
      startPlay();
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
    startPlay();
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

  canvas.addEventListener("pointerdown", function (e) {
    if (frozen) return;
    e.preventDefault();
    const wx = worldFromEvent(e);
    pointers.set(e.pointerId, wx < VW * 0.5 ? -1 : 1);
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
    SFX.ensure();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointers.has(e.pointerId)) return;
    const wx = worldFromEvent(e);
    pointers.set(e.pointerId, wx < VW * 0.5 ? -1 : 1);
  });
  function ptrUp(e) {
    pointers.delete(e.pointerId);
  }
  canvas.addEventListener("pointerup", ptrUp);
  canvas.addEventListener("pointercancel", ptrUp);

  window.addEventListener("keydown", function (e) {
    if (e.repeat && (e.key === "m" || e.key === "M" || e.key === "r" || e.key === "R")) return;
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") {
      keys.left = true;
      e.preventDefault();
    } else if (k === "ArrowRight" || k === "d" || k === "D") {
      keys.right = true;
      e.preventDefault();
    } else if (k === "m" || k === "M") {
      e.preventDefault();
      SFX.ensure();
      setMuted(!SFX.muted);
    } else if (k === "r" || k === "R") {
      e.preventDefault();
      SFX.ensure();
      startPlay();
    } else if (k === " " || k === "Enter") {
      if (frozen) {
        e.preventDefault();
        onOverlayAction();
      }
    }
  });
  window.addEventListener("keyup", function (e) {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = false;
    else if (k === "ArrowRight" || k === "d" || k === "D") keys.right = false;
  });

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (paused) {
      keys.left = false;
      keys.right = false;
      pointers.clear();
    }
  });
  window.addEventListener("blur", function () {
    if (mode === "play") paused = true;
    keys.left = false;
    keys.right = false;
    pointers.clear();
  });
  window.addEventListener("focus", function () {
    paused = document.hidden;
  });

  window.addEventListener("resize", fit);

  loadTitle();
  renderHud();
  requestAnimationFrame(frame);
})();
