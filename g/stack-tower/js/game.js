(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const GOAL = 12;
  const LIVES = 3;
  const BASE_W = 248;
  const SLAB_H = 34;
  const DEPTH = 18;
  const MIN_W = 30;
  const PERFECT = 9;
  const FOUND_Y = 418;
  const CABLE = 92;
  const GAP = 70;
  const G = 3200;
  const STEP = 1 / 60;
  const LOCK = 0.2;
  const LAND_T = 0.28;
  const MISS_T = 0.72;
  const WIN_T = 0.92;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-stack-tower-mute";

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
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
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const btnDrop = document.getElementById("btn-drop");
  const floorLabel = document.getElementById("floor-label");
  const qiLabel = document.getElementById("qi-label");
  const pipsEl = document.getElementById("pips");
  const wideWrap = document.getElementById("wide-wrap");
  const wideFill = document.getElementById("wide-fill");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };

  const particles = [];
  const debris = [];
  const pops = [];
  const stars = [];
  const windows = [];
  const signs = [];

  let mode = "title";
  let overlayKind = "title";
  let frozen = true;
  let paused = false;
  let toastT = 0;
  let last = 0;
  let acc = 0;
  let hudTick = 0;
  let runGen = 0;

  const st = {
    blocks: [],
    phase: "swing",
    phaseT: 0,
    phi: 0,
    amp: 250,
    omega: 1.15,
    side: 1,
    pivotX: VW * 0.5,
    targetX: VW * 0.5,
    slabX: VW * 0.5 - BASE_W * 0.5,
    slabY: 200,
    slabW: BASE_W,
    vx: 0,
    vy: 0,
    rot: 0,
    vr: 0,
    squash: 1,
    lock: 0,
    lives: LIVES,
    livesMax: LIVES,
    placed: 0,
    combo: 0,
    bestCombo: 0,
    perfects: 0,
    why: "",
    shake: 0,
    flash: 0,
    flashRgb: "0,240,255",
    cam: 0,
    camT: 0,
    clock: 0,
    mag: true,
    taught: false,
    near: false,
    boomY: 200
  };

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 86; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * 980 - 620,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.5 + 0.08,
        p: Math.random() * TAU
      });
    }
  }

  function makeCity() {
    windows.length = 0;
    const specs = [
      { x: 18, w: 52, h: 88, hue: 0 },
      { x: 78, w: 40, h: 124, hue: 1 },
      { x: 128, w: 64, h: 72, hue: 0 },
      { x: 768, w: 48, h: 110, hue: 1 },
      { x: 826, w: 58, h: 86, hue: 0 },
      { x: 894, w: 42, h: 140, hue: 1 }
    ];
    for (let s = 0; s < specs.length; s++) {
      const b = specs[s];
      const rows = Math.max(3, (b.h / 14) | 0);
      const cols = Math.max(2, (b.w / 12) | 0);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() < 0.38) continue;
          windows.push({
            x: b.x + 6 + c * ((b.w - 12) / cols),
            y: FOUND_Y + 46 - b.h + 8 + r * 12,
            w: 4,
            h: 6,
            mag: b.hue === 0,
            p: Math.random() * TAU
          });
        }
      }
    }
    signs.length = 0;
    signs.push({ y: FOUND_Y - 220, text: "NEON", mag: true });
    signs.push({ y: FOUND_Y - 420, text: "直", mag: false });
    signs.push({ y: FOUND_Y - 640, text: "12F", mag: true });
  }

  makeStars();
  makeCity();

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
      f.frequency.value = 1400;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.14, "sine", 0.07, 392);
      this.beep(294, 0.2, "triangle", 0.045, 588);
    },
    drop: function () {
      this.ensure();
      this.beep(420, 0.08, "sine", 0.05, 180);
    },
    land: function () {
      this.ensure();
      this.noise(0.08, 0.07);
      this.beep(180, 0.12, "triangle", 0.06, 90);
    },
    chop: function () {
      this.ensure();
      this.noise(0.12, 0.09);
      this.beep(520, 0.1, "square", 0.035, 160);
    },
    perfect: function (n) {
      this.ensure();
      this.beep(660, 0.1, "sine", 0.07, 880);
      this.beep(880, 0.16, "triangle", 0.05, 1320);
      if (n >= 3) this.beep(1320, 0.22, "sine", 0.04, 1760);
    },
    miss: function () {
      this.ensure();
      this.noise(0.18, 0.1);
      this.beep(220, 0.42, "sawtooth", 0.07, 50);
    },
    warn: function () {
      this.ensure();
      this.beep(240, 0.1, "square", 0.04, 140);
    },
    win: function () {
      this.ensure();
      this.beep(392, 0.14, "sine", 0.08, 523);
      const self = this;
      const g = runGen;
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(523, 0.16, "sine", 0.08, 659);
      }, 90);
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(784, 0.32, "sine", 0.1, 1046);
      }, 200);
    },
    lose: function () {
      this.ensure();
      this.beep(174, 0.5, "sawtooth", 0.09, 50);
      this.beep(87, 0.7, "square", 0.05, 40);
    },
    tickDrone: function (placed, near, playing) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 58;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const f = 52 + placed * 6 + (near ? 18 : 0);
      this.drone.frequency.setTargetAtTime(f, t, 0.12);
      const vol = playing ? 0.016 + placed * 0.0018 + (near ? 0.012 : 0) : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.12);
    },
    hushDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") SFX.muted = true;
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
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function topBlock() {
    return st.blocks[st.blocks.length - 1];
  }

  function topY() {
    return topBlock().y;
  }

  function swingAmp(w) {
    return Math.max(w + 42, 228);
  }

  function swingOmega(n) {
    return 1.08 + n * 0.11;
  }

  function pivotY() {
    return topY() - GAP - SLAB_H - CABLE;
  }

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
        kind: spec.kind || 0
      });
    }
  }

  function pop(x, y, text, kind) {
    pops.push({ x: x, y: y, text: text, life: 0.9, kind: kind || 0 });
    if (pops.length > 8) pops.shift();
  }

  function addDebris(x, y, w, h, mag, dir) {
    if (w < 3 || h < 3) return;
    debris.push({
      x: x,
      y: y,
      w: w,
      h: h,
      vx: dir * rand(40, 140) + rand(-30, 30),
      vy: rand(-80, -10),
      rot: rand(-0.2, 0.2),
      vr: dir * rand(1.6, 4.2),
      life: 1.15,
      mag: mag
    });
    if (debris.length > 18) debris.shift();
  }

  function showToast(text, kind) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("gold", kind === "gold");
    toastEl.classList.remove("hidden");
    toastT = 1.55;
  }

  function renderHud() {
    const top = st.blocks.length ? topBlock() : null;
    const w = top ? top.w : BASE_W;
    const ratio = clamp(w / BASE_W, 0, 1);
    if (mode === "title") {
      floorLabel.textContent = "层 —";
      floorLabel.classList.remove("warn");
      qiLabel.textContent = "齐 —";
      wideFill.style.width = "100%";
      wideWrap.classList.remove("warn");
    } else {
      floorLabel.textContent = "层 " + st.placed + "/" + GOAL;
      floorLabel.classList.toggle("warn", st.placed >= GOAL - 2 && mode === "play");
      qiLabel.textContent = "齐 " + st.combo;
      wideFill.style.width = (ratio * 100).toFixed(1) + "%";
      wideWrap.classList.toggle("warn", ratio < 0.42);
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
      ovKicker.textContent = "STACK";
      ovTitle.textContent = "叠塔";
      ovLead.innerHTML = "吊臂来回荡，对齐再松手。<br />重叠留下，悬空的会碎。塔要直。";
      ovOps.textContent = coarse
        ? "点「落」或点屏幕 · 叠满 12 层 · M 静音"
        : "空格 / 点击落块 · 叠满 12 层 · M 静音";
      ovBtn.textContent = "起吊";
    } else if (kind === "lose") {
      ovKicker.textContent = st.why === "thin" ? "SNAP" : "FALL";
      ovTitle.textContent = st.why === "thin" ? "塔尖崩了" : "没接住";
      ovLead.textContent = st.why === "thin"
        ? "剩下太窄，站不住了。叠了 " + st.placed + " 层 · 齐 " + st.perfects + "。"
        : "块从塔边滑了下去。叠了 " + st.placed + " 层 · 齐 " + st.perfects + "。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再叠一次";
    } else if (kind === "win") {
      ovKicker.textContent = "PLUMB";
      ovTitle.textContent = "塔已直";
      ovLead.textContent = "12 层落地。齐 " + st.perfects +
        " · 连齐 " + st.bestCombo +
        " · 最窄还剩 " + Math.round(topBlock().w) + "。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
    overlayKind = "none";
    panel.classList.remove("win", "lose");
  }

  function makeFoundation() {
    const x = (VW - BASE_W) * 0.5;
    return {
      x: x,
      y: FOUND_Y,
      w: BASE_W,
      h: 40,
      mag: false,
      found: true,
      gold: false,
      squash: 1
    };
  }

  function resetRun() {
    st.blocks = [makeFoundation()];
    st.phase = "swing";
    st.phaseT = 0;
    st.placed = 0;
    st.combo = 0;
    st.bestCombo = 0;
    st.perfects = 0;
    st.lives = LIVES;
    st.livesMax = LIVES;
    st.why = "";
    st.shake = 0;
    st.flash = 0.3;
    st.flashRgb = "0,240,255";
    st.cam = 0;
    st.camT = 0;
    st.taught = false;
    st.near = false;
    st.mag = true;
    st.side = 1;
    st.boomY = pivotY();
    st.rot = 0;
    st.vr = 0;
    st.squash = 1;
    st.lock = LOCK;
    particles.length = 0;
    debris.length = 0;
    pops.length = 0;
    armSwing(true);
  }

  function armSwing(fresh) {
    const top = topBlock();
    st.targetX = top.x + top.w * 0.5;
    if (fresh) st.pivotX = st.targetX;
    st.amp = swingAmp(top.w);
    st.omega = swingOmega(st.placed);
    st.phi = st.side * Math.PI * 0.5;
    st.side *= -1;
    st.slabW = top.w;
    st.mag = st.placed % 2 === 0;
    st.vx = 0;
    st.vy = 0;
    st.rot = 0;
    st.vr = 0;
    st.squash = 1;
    st.phase = "swing";
    st.phaseT = 0;
    st.lock = fresh ? LOCK : 0.16;
    if (fresh) st.boomY = pivotY();
    placeSwing();
  }

  function placeSwing() {
    const py = st.boomY;
    const px = st.pivotX + st.amp * Math.sin(st.phi);
    st.slabX = px - st.slabW * 0.5;
    st.slabY = py + CABLE + 6;
  }

  function loadTitle() {
    mode = "title";
    resetRun();
    const b0 = st.blocks[0];
    const demo = [
      { dx: 14, dw: 28, mag: true, gold: false },
      { dx: 26, dw: 52, mag: false, gold: false },
      { dx: 38, dw: 76, mag: true, gold: true }
    ];
    for (let i = 0; i < demo.length; i++) {
      const d = demo[i];
      const prev = topBlock();
      st.blocks.push({
        x: b0.x + d.dx,
        y: prev.y - SLAB_H,
        w: b0.w - d.dw,
        h: SLAB_H,
        mag: d.mag,
        found: false,
        gold: d.gold,
        squash: 1
      });
    }
    const top = topBlock();
    st.targetX = top.x + top.w * 0.5;
    st.pivotX = st.targetX;
    st.slabW = top.w;
    st.amp = swingAmp(top.w);
    st.boomY = pivotY();
    st.phi = 0.4;
    placeSwing();
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "看投影对齐再松手 · 点「落」或点屏幕"
      : "看投影对齐再松手 · 空格落块 · 荡得快窗口更窄";
  }

  function startPlay() {
    runGen += 1;
    SFX.start();
    mode = "play";
    acc = 0;
    resetRun();
    st.lock = 0.42;
    hideOverlay();
    renderHud();
    showToast("对齐投影 · 再松手");
    hintEl.textContent = coarse
      ? "投影对上就落 · 点「落」或点屏幕"
      : "投影对上就落 · 空格 / 点击 · M 静音";
  }

  function overlapOf(ax, aw, bx, bw) {
    const l = Math.max(ax, bx);
    const r = Math.min(ax + aw, bx + bw);
    return { x: l, w: r - l };
  }

  function beginDrop() {
    if (mode !== "play" || st.phase !== "swing") return;
    if (st.lock > 0) return;
    st.phase = "fall";
    st.phaseT = 0;
    st.vx = 0;
    st.vy = 40;
    st.rot = 0;
    SFX.drop();
  }

  function tryAction() {
    SFX.ensure();
    if (frozen) {
      if (overlayKind === "title" || overlayKind === "win" || overlayKind === "lose") startPlay();
      return;
    }
    if (mode === "play") beginDrop();
  }

  function onLand(ov, perfect, thin) {
    const top = topBlock();
    const mag = st.mag;
    if (perfect) {
      ov = { x: top.x, w: top.w };
      st.combo += 1;
      st.perfects += 1;
      if (st.combo > st.bestCombo) st.bestCombo = st.combo;
      SFX.perfect(st.combo);
      st.flash = 0.42;
      st.flashRgb = "255,227,107";
      pop(ov.x + ov.w * 0.5, top.y - 10, st.combo >= 3 ? "齐×" + st.combo : "齐", 2);
      showToast(st.combo >= 3 ? "连齐 ×" + st.combo : "齐", "gold");
      emit(18, {
        x: ov.x + ov.w * 0.5,
        y: top.y,
        j: ov.w * 0.35,
        vx0: -90,
        vx1: 90,
        vy0: -160,
        vy1: -20,
        life: 0.55,
        r0: 1.4,
        r1: 3.6,
        kind: 2
      });
    } else {
      st.combo = 0;
      const leftW = ov.x - st.slabX;
      const rightW = st.slabX + st.slabW - (ov.x + ov.w);
      if (leftW > 2) addDebris(st.slabX, st.slabY, leftW, SLAB_H, mag, -1);
      if (rightW > 2) addDebris(ov.x + ov.w, st.slabY, rightW, SLAB_H, mag, 1);
      SFX.chop();
      st.flash = 0.28;
      st.flashRgb = "0,240,255";
      st.shake = Math.min(10, 3 + (leftW + rightW) * 0.04);
      pop(ov.x + ov.w * 0.5, top.y - 8, "削", 0);
      if (!st.taught) {
        st.taught = true;
        showToast("悬空碎了 · 只留重叠");
      }
    }
    const block = {
      x: ov.x,
      y: top.y - SLAB_H,
      w: ov.w,
      h: SLAB_H,
      mag: mag,
      found: false,
      gold: perfect,
      squash: 1.16
    };
    st.blocks.push(block);
    st.placed += 1;
    st.slabX = ov.x;
    st.slabY = block.y;
    st.slabW = ov.w;
    SFX.land();
    emit(8, {
      x: ov.x + ov.w * 0.5,
      y: block.y + SLAB_H,
      j: ov.w * 0.4,
      vx0: -40,
      vx1: 40,
      vy0: -30,
      vy1: 20,
      life: 0.35,
      r0: 1,
      r1: 2.4,
      kind: mag ? 1 : 0
    });

    if (thin) {
      st.why = "thin";
      st.phase = "crumble";
      st.phaseT = 0;
      st.flash = 0.5;
      st.flashRgb = "255,61,184";
      st.shake = 12;
      SFX.miss();
      showToast("太窄 · 站不住", "warn");
      return "thin";
    }
    if (st.placed >= GOAL) {
      st.why = "goal";
      st.phase = "clear";
      st.phaseT = 0;
      st.flash = 0.55;
      st.flashRgb = "0,240,255";
      pop(ov.x + ov.w * 0.5, block.y - 16, "直", 0);
      return "clear";
    }
    if (st.placed === 6) showToast("过半 · 再叠 6 层");
    st.phase = "land";
    st.phaseT = 0;
    return null;
  }

  function onMiss() {
    st.why = "miss";
    st.phase = "miss";
    st.phaseT = 0;
    st.combo = 0;
    st.flash = 0.45;
    st.flashRgb = "255,61,184";
    st.shake = 11;
    st.vr = (st.slabX + st.slabW * 0.5 < topBlock().x + topBlock().w * 0.5) ? -2.4 : 2.4;
    SFX.miss();
    showToast("没接住", "warn");
    emit(16, {
      x: st.slabX + st.slabW * 0.5,
      y: st.slabY + SLAB_H,
      j: 16,
      vx0: -80,
      vx1: 80,
      vy0: -40,
      vy1: 80,
      life: 0.5,
      r0: 1.2,
      r1: 3.2,
      kind: 1
    });
  }

  function finishMiss() {
    st.lives -= 1;
    if (st.lives <= 0) {
      mode = "lose";
      SFX.hushDrone();
      SFX.lose();
      setOverlay("lose");
      renderHud();
      return;
    }
    showToast("还剩 " + st.lives + " 命 · 再荡一次", "warn");
    armSwing(false);
    renderHud();
  }

  function finishThin() {
    mode = "lose";
    SFX.hushDrone();
    SFX.lose();
    setOverlay("lose");
    renderHud();
  }

  function finishWin() {
    mode = "win";
    SFX.hushDrone();
    SFX.win();
    setOverlay("win");
    renderHud();
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
      p.vy += 90 * dt;
      p.vx *= 0.99;
    }
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 980 * dt;
      d.rot += d.vr * dt;
      if (d.life <= 0 || d.y > FOUND_Y + 280) debris.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.life -= dt;
      p.y -= 28 * dt;
      if (p.life <= 0) pops.splice(i, 1);
    }
  }

  function camFollow(dt) {
    const want = topY() - 328;
    st.camT = want;
    st.cam = lerp(st.cam, st.camT, 1 - Math.pow(0.012, dt));
  }

  function stepPlay(dt) {
    st.lock = Math.max(0, st.lock - dt);
    st.shake = Math.max(0, st.shake - dt * 16);
    st.flash = Math.max(0, st.flash - dt);
    st.boomY = lerp(st.boomY, pivotY(), 1 - Math.pow(0.018, dt));
    camFollow(dt);
    stepParticles(dt);

    const top = topBlock();
    st.near = false;

    if (st.phase === "swing") {
      st.pivotX = lerp(st.pivotX, st.targetX, 1 - Math.pow(0.04, dt));
      st.phi += st.omega * dt;
      placeSwing();
      const ov = overlapOf(st.slabX, st.slabW, top.x, top.w);
      const leftGap = Math.abs(st.slabX - top.x);
      const rightGap = Math.abs(st.slabX + st.slabW - top.x - top.w);
      st.near = ov.w > 0 && leftGap < PERFECT + 10 && rightGap < PERFECT + 10;
      if (st.near && Math.random() < 0.45) {
        emit(1, {
          x: st.slabX + st.slabW * 0.5,
          y: st.slabY + SLAB_H,
          j: 8,
          vx0: -12,
          vx1: 12,
          vy0: 20,
          vy1: 60,
          life: 0.28,
          r0: 0.8,
          r1: 1.8,
          kind: 2
        });
      }
      return;
    }

    if (st.phase === "fall") {
      st.vy += G * dt;
      st.slabY += st.vy * dt;
      const land = top.y - SLAB_H;
      if (st.slabY >= land) {
        st.slabY = land;
        const ov = overlapOf(st.slabX, st.slabW, top.x, top.w);
        if (ov.w <= 2) {
          onMiss();
        } else {
          const leftGap = Math.abs(st.slabX - top.x);
          const rightGap = Math.abs(st.slabX + st.slabW - top.x - top.w);
          const perfect = leftGap <= PERFECT && rightGap <= PERFECT;
          const thin = ov.w < MIN_W && !perfect;
          const ev = onLand(ov, perfect, thin);
          if (ev === "clear") {
            /* win after settle */
          }
        }
      }
      return;
    }

    if (st.phase === "land") {
      st.phaseT += dt;
      const b = topBlock();
      const u = clamp(st.phaseT / LAND_T, 0, 1);
      const e = easeOut(u);
      b.squash = e < 0.45 ? lerp(1.16, 0.9, e / 0.45) : lerp(0.9, 1, (e - 0.45) / 0.55);
      st.slabY = b.y;
      if (st.phaseT >= LAND_T) {
        b.squash = 1;
        armSwing(false);
      }
      return;
    }

    if (st.phase === "miss") {
      st.phaseT += dt;
      st.vy += G * dt;
      st.slabY += st.vy * dt;
      st.rot += st.vr * dt;
      if (st.phaseT >= MISS_T) finishMiss();
      return;
    }

    if (st.phase === "crumble") {
      st.phaseT += dt;
      const b = topBlock();
      b.squash = lerp(1, 0.2, clamp(st.phaseT / 0.5, 0, 1));
      if (Math.random() < 0.6) {
        emit(1, {
          x: b.x + b.w * 0.5,
          y: b.y + 8,
          j: b.w * 0.4,
          vx0: -70,
          vx1: 70,
          vy0: -40,
          vy1: 40,
          life: 0.4,
          r0: 1,
          r1: 2.6,
          kind: 1
        });
      }
      if (st.phaseT >= 0.7) finishThin();
      return;
    }

    if (st.phase === "clear") {
      st.phaseT += dt;
      const b = topBlock();
      b.gold = true;
      if (Math.random() < 0.7) {
        emit(1, {
          x: b.x + rand(0, b.w),
          y: b.y,
          j: 4,
          vx0: -40,
          vx1: 40,
          vy0: -120,
          vy1: -20,
          life: 0.55,
          r0: 1.2,
          r1: 3,
          kind: 2
        });
      }
      if (st.phaseT >= WIN_T) finishWin();
    }
  }

  function stepTitle(dt) {
    st.pivotX = lerp(st.pivotX, st.targetX, 0.08);
    st.boomY = lerp(st.boomY, pivotY(), 0.08);
    st.amp = 210;
    st.omega = 0.85;
    st.phi += st.omega * dt;
    placeSwing();
    st.cam = lerp(st.cam, 8, 0.06);
    stepParticles(dt);
    if (Math.random() < 0.25) {
      emit(1, {
        x: st.slabX + st.slabW * 0.5,
        y: st.slabY + SLAB_H,
        j: 10,
        vx0: -8,
        vx1: 8,
        vy0: 10,
        vy1: 40,
        life: 0.3,
        r0: 0.7,
        r1: 1.6,
        kind: 0
      });
    }
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

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function palOf(block) {
    if (block.gold) {
      return {
        top: "#ffe9a0",
        front: "#c9a24a",
        side: "#8a6a1c",
        edge: "#ffe36b",
        glow: "rgba(255,227,107,0.5)"
      };
    }
    if (block.found) {
      return {
        top: "#2a2440",
        front: "#161022",
        side: "#0e0a18",
        edge: "#00f0ff",
        glow: "rgba(0,240,255,0.35)"
      };
    }
    if (block.mag) {
      return {
        top: "#ff8ad8",
        front: "#c42a86",
        side: "#7a1858",
        edge: "#ff3db8",
        glow: "rgba(255,61,184,0.45)"
      };
    }
    return {
      top: "#8af8ff",
      front: "#1298a8",
      side: "#0a5c6c",
      edge: "#00f0ff",
      glow: "rgba(0,240,255,0.45)"
    };
  }

  function drawSlab(x, y, w, h, pal, squash, alpha) {
    if (w <= 0.5 || h <= 0.5) return;
    const sq = squash == null ? 1 : squash;
    const a = alpha == null ? 1 : alpha;
    const d = DEPTH;
    const hh = h * sq;
    const yy = y + h - hh;
    ctx.save();
    ctx.globalAlpha = a;

    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.lineTo(x + w + d, yy - d);
    ctx.lineTo(x + d, yy - d);
    ctx.closePath();
    ctx.fillStyle = pal.top;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + w, yy);
    ctx.lineTo(x + w + d, yy - d);
    ctx.lineTo(x + w + d, yy - d + hh);
    ctx.lineTo(x + w, yy + hh);
    ctx.closePath();
    ctx.fillStyle = pal.side;
    ctx.fill();

    ctx.fillStyle = pal.front;
    ctx.fillRect(x, yy, w, hh);

    ctx.strokeStyle = pal.edge;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.lineTo(x + w + d, yy - d);
    ctx.moveTo(x, yy);
    ctx.lineTo(x, yy + hh);
    ctx.lineTo(x + w, yy + hh);
    ctx.lineTo(x + w, yy);
    ctx.stroke();

    ctx.fillStyle = pal.glow;
    ctx.fillRect(x + 4, yy + 3, Math.max(0, w - 8), 3);

    ctx.restore();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, st.cam - 40, 0, st.cam + VH);
    g.addColorStop(0, "#090616");
    g.addColorStop(0.5, "#070412");
    g.addColorStop(0.82, "#0a0718");
    g.addColorStop(1, "#12081c");
    ctx.fillStyle = g;
    ctx.fillRect(0, st.cam - 40, VW, VH + 80);

    const mag = ctx.createRadialGradient(110, st.cam + 10, 10, 110, st.cam + 10, 340);
    mag.addColorStop(0, "rgba(255,61,184,0.14)");
    mag.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, st.cam - 40, VW, VH + 80);

    const cyan = ctx.createRadialGradient(830, st.cam + 50, 8, 830, st.cam + 50, 300);
    cyan.addColorStop(0, "rgba(0,240,255,0.1)");
    cyan.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = cyan;
    ctx.fillRect(0, st.cam - 40, VW, VH + 80);
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + Math.sin(st.clock * 2.1 + s.p) * 0.45;
      ctx.fillStyle = "rgba(230,236,255," + (s.a * tw) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawMoon() {
    const mx = 802;
    const my = FOUND_Y - 330;
    const rg = ctx.createRadialGradient(mx, my, 6, mx, my, 52);
    rg.addColorStop(0, "rgba(255,227,107,0.5)");
    rg.addColorStop(0.45, "rgba(255,227,107,0.1)");
    rg.addColorStop(1, "rgba(255,227,107,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(mx, my, 52, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffe9a0";
    ctx.beginPath();
    ctx.arc(mx, my, 17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(5,3,12,0.35)";
    ctx.beginPath();
    ctx.arc(mx + 7, my - 2, 13, 0, TAU);
    ctx.fill();
  }

  function drawSigns() {
    for (let i = 0; i < signs.length; i++) {
      const s = signs[i];
      const x = i % 2 === 0 ? 56 : VW - 110;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = s.mag ? "rgba(255,61,184,0.18)" : "rgba(0,240,255,0.16)";
      roundRect(x, s.y, 54, 22, 4);
      ctx.fill();
      ctx.strokeStyle = s.mag ? "rgba(255,61,184,0.7)" : "rgba(0,240,255,0.7)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#f6f3ff";
      ctx.font = "700 11px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(s.text, x + 27, s.y + 15);
      ctx.restore();
    }
  }

  function drawCity() {
    const gy = FOUND_Y + 40;
    ctx.fillStyle = "#12081c";
    ctx.fillRect(0, gy, VW, 220);

    const fog = ctx.createLinearGradient(0, gy, 0, gy + 90);
    fog.addColorStop(0, "rgba(0,240,255,0.06)");
    fog.addColorStop(1, "rgba(5,3,12,0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, gy, VW, 90);

    const buildings = [
      { x: 14, w: 56, h: 92 },
      { x: 74, w: 44, h: 128 },
      { x: 124, w: 68, h: 76 },
      { x: 762, w: 52, h: 114 },
      { x: 822, w: 62, h: 90 },
      { x: 890, w: 46, h: 144 }
    ];
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      ctx.fillStyle = "#0b0814";
      ctx.fillRect(b.x, gy - b.h, b.w, b.h);
      ctx.strokeStyle = i % 2 ? "rgba(255,61,184,0.22)" : "rgba(0,240,255,0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, gy - b.h + 0.5, b.w - 1, b.h - 1);
    }
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const tw = 0.35 + Math.sin(st.clock * 1.7 + w.p) * 0.35;
      ctx.fillStyle = w.mag
        ? "rgba(255,61,184," + (0.25 + tw * 0.55) + ")"
        : "rgba(0,240,255," + (0.25 + tw * 0.55) + ")";
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    ctx.strokeStyle = "rgba(0,240,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, gy + 1);
    ctx.lineTo(VW - 28, gy + 1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, gy + 7);
    ctx.lineTo(VW - 40, gy + 7);
    ctx.stroke();
  }

  function drawPlumb() {
    const base = st.blocks[0];
    const cx = base.x + base.w * 0.5;
    const top = topBlock();
    ctx.save();
    ctx.setLineDash([4, 7]);
    ctx.strokeStyle = "rgba(255,227,107,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, base.y + 8);
    ctx.lineTo(cx, top.y - 24);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,227,107,0.7)";
    ctx.beginPath();
    ctx.arc(cx, top.y - 26, 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGhost() {
    if (st.phase !== "swing" || mode === "title") return;
    const top = topBlock();
    const ov = overlapOf(st.slabX, st.slabW, top.x, top.w);
    const leftGap = Math.abs(st.slabX - top.x);
    const rightGap = Math.abs(st.slabX + st.slabW - top.x - top.w);
    const perfect = ov.w > 0 && leftGap <= PERFECT && rightGap <= PERFECT;
    const miss = ov.w <= 2;

    ctx.save();
    if (ov.w > 2) {
      ctx.fillStyle = perfect ? "rgba(255,227,107,0.22)" : "rgba(0,240,255,0.14)";
      ctx.fillRect(ov.x, top.y, ov.w, 5);
    }
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = miss
      ? "rgba(255,61,184,0.7)"
      : perfect
        ? "rgba(255,227,107,0.85)"
        : "rgba(0,240,255,0.55)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(st.slabX + 0.5, top.y - SLAB_H + 0.5, st.slabW - 1, SLAB_H - 1);
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawTower() {
    const base = st.blocks[0];
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(base.x + base.w * 0.5 + DEPTH * 0.5, FOUND_Y + 52, base.w * 0.5 + 10, 11, 0, 0, TAU);
    ctx.fill();
    for (let i = 0; i < st.blocks.length; i++) {
      const b = st.blocks[i];
      const pal = palOf(b);
      const isTop = i === st.blocks.length - 1 && (st.phase === "land" || st.phase === "crumble" || st.phase === "clear");
      drawSlab(b.x, b.y, b.w, b.h, pal, isTop ? b.squash : 1, 1);
    }
  }

  function drawCrane() {
    const boomY = st.boomY;
    const trolley = st.pivotX + (st.phase === "swing" ? st.amp * Math.sin(st.phi) : (st.slabX + st.slabW * 0.5));
    ctx.save();
    ctx.strokeStyle = "rgba(0,240,255,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, boomY);
    ctx.lineTo(VW - 40, boomY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, boomY + 5);
    ctx.lineTo(VW - 48, boomY + 5);
    ctx.stroke();

    ctx.fillStyle = "#161022";
    roundRect(trolley - 18, boomY - 10, 36, 16, 4);
    ctx.fill();
    ctx.strokeStyle = "#ff3db8";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.arc(trolley, boomY - 2, 2.4, 0, TAU);
    ctx.fill();

    if (st.phase === "swing" || st.phase === "fall" || (st.phase === "miss" && st.phaseT < 0.55)) {
      const hx = st.slabX + st.slabW * 0.5;
      const hy = st.slabY + 2;
      ctx.strokeStyle = "rgba(246,243,255,0.45)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(trolley, boomY + 6);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMovingSlab() {
    if (st.phase === "land" || st.phase === "clear" || st.phase === "crumble") return;
    const pal = palOf({ mag: st.mag, gold: st.near && st.phase === "swing", found: false });
    ctx.save();
    if (st.phase === "miss") {
      ctx.translate(st.slabX + st.slabW * 0.5, st.slabY + SLAB_H * 0.5);
      ctx.rotate(st.rot);
      drawSlab(-st.slabW * 0.5, -SLAB_H * 0.5, st.slabW, SLAB_H, pal, 1, 0.92);
    } else {
      drawSlab(st.slabX, st.slabY, st.slabW, SLAB_H, pal, 1, st.phase === "swing" ? 0.92 : 1);
    }
    ctx.restore();
  }

  function drawDebris() {
    for (let i = 0; i < debris.length; i++) {
      const d = debris[i];
      const pal = palOf({ mag: d.mag, gold: false, found: false });
      ctx.save();
      ctx.translate(d.x + d.w * 0.5, d.y + d.h * 0.5);
      ctx.rotate(d.rot);
      ctx.globalAlpha = clamp(d.life * 1.4, 0, 1);
      drawSlab(-d.w * 0.5, -d.h * 0.5, d.w, d.h, pal, 1, 1);
      ctx.restore();
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
      else col = "rgba(0,240,255,";
      ctx.fillStyle = col + (0.15 + a * 0.75) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPops() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const a = clamp(p.life / 0.9, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = "900 22px Segoe UI, PingFang SC, sans-serif";
      ctx.fillStyle = p.kind === 2 ? "#ffe36b" : p.kind === 1 ? "#ff3db8" : "#00f0ff";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.restore();
  }

  function drawFlash() {
    if (st.flash <= 0) return;
    ctx.fillStyle = "rgba(" + st.flashRgb + "," + (st.flash * 0.2) + ")";
    ctx.fillRect(0, st.cam - 20, VW, VH + 40);
  }

  function drawFloorMarks() {
    ctx.save();
    ctx.font = "700 10px Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(139,144,184,0.55)";
    ctx.textAlign = "left";
    for (let n = 3; n <= GOAL; n += 3) {
      const y = FOUND_Y - n * SLAB_H;
      ctx.fillText(n + "F", 18, y + 12);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(VW - 40, y);
      ctx.stroke();
    }
    ctx.restore();
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

    ctx.save();
    ctx.translate(0, -st.cam);

    drawSky();
    drawStars();
    drawMoon();
    drawSigns();
    drawCity();
    drawFloorMarks();
    drawPlumb();
    drawTower();
    drawGhost();
    drawDebris();
    drawMovingSlab();
    drawCrane();
    drawParticles();
    drawPops();
    drawFlash();

    ctx.restore();
    ctx.restore();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    st.clock += dt;
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }

    if (paused && mode === "play") {
      draw();
      return;
    }

    if (mode === "title") {
      acc += dt;
      while (acc >= STEP) {
        stepTitle(STEP);
        acc -= STEP;
      }
      draw();
      return;
    }

    if (mode === "play") {
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 5) {
        stepPlay(STEP);
        acc -= STEP;
        steps += 1;
      }
      SFX.tickDrone(st.placed, st.near, st.phase === "swing");
    } else {
      st.flash = Math.max(0, st.flash - dt);
      st.shake = Math.max(0, st.shake - dt * 16);
      stepParticles(dt);
      SFX.tickDrone(st.placed, false, false);
    }

    hudTick += dt;
    if (hudTick > 0.08) {
      hudTick = 0;
      renderHud();
    }
    draw();
  }

  function onKey(e, down) {
    const k = e.key;
    if (!down) return;
    if (k === "m" || k === "M") {
      setMuted(!SFX.muted);
      SFX.ensure();
    } else if (k === "r" || k === "R") {
      SFX.ensure();
      if (mode === "play" || mode === "win" || mode === "lose") startPlay();
    } else if (k === " " || k === "Enter") {
      e.preventDefault();
      tryAction();
    }
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
    if (e.repeat && (e.key === " " || e.key === "Enter")) return;
    onKey(e, true);
  });
  window.addEventListener("keyup", function (e) { onKey(e, false); });

  canvas.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (frozen) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    tryAction();
  });

  btnDrop.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    btnDrop.classList.add("held");
    try { btnDrop.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    tryAction();
  });
  function dropUp(e) {
    e.stopPropagation();
    btnDrop.classList.remove("held");
  }
  btnDrop.addEventListener("pointerup", dropUp);
  btnDrop.addEventListener("pointercancel", dropUp);
  btnDrop.addEventListener("lostpointercapture", function () {
    btnDrop.classList.remove("held");
  });

  ovBtn.addEventListener("click", function () {
    tryAction();
  });
  btnRetry.addEventListener("click", function () {
    SFX.ensure();
    startPlay();
  });
  btnMute.addEventListener("click", function () {
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    last = 0;
    if (document.hidden) SFX.hushDrone();
  });

  window.addEventListener("resize", function () { fit(); draw(); });

  loadTitle();
  renderHud();
  requestAnimationFrame(frame);
})();
