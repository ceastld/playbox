"use strict";

(function () {
  const VW = 480;
  const VH = 800;
  const FAR = 112;
  const NEAR = 688;
  const PR = 11;
  const SPEED = 168;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GRACE = 0.22;
  const DROP_FALL = 0.42;
  const MUTE_KEY = "playbox-ripple-step-mute";
  const GOLD = "#ffe36b";
  const CYAN = "#00f0ff";
  const MAG = "#ff3db8";

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
  function normAng(a) {
    while (a <= -Math.PI) a += TAU;
    while (a > Math.PI) a -= TAU;
    return a;
  }
  function inArc(ang, a0, a1) {
    if (a0 == null || a1 == null) return true;
    ang = normAng(ang);
    a0 = normAng(a0);
    a1 = normAng(a1);
    if (a0 <= a1) return ang >= a0 && ang <= a1;
    return ang >= a0 || ang <= a1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  const STAGES = [
    {
      name: "岸浪",
      sub: "SHORE",
      hint: "浪会把你推过河 · 贴着亮环走",
      spawn: { x: 240, y: 742 },
      sources: [
        { x: 240, y: 770, speed: 86, thick: 54, maxR: 680, period: 8.6, delay: 0.45 }
      ]
    },
    {
      name: "偏心",
      sub: "SKEW",
      hint: "环从侧面推来，贴着亮边往对岸走",
      spawn: { x: 278, y: 742 },
      sources: [
        { x: 186, y: 770, speed: 88, thick: 50, maxR: 680, period: 8.4, delay: 0.45 }
      ]
    },
    {
      name: "双涟",
      sub: "PAIR",
      hint: "第一圈会散，叠上时走上第二圈",
      spawn: { x: 240, y: 742 },
      sources: [
        { x: 240, y: 770, speed: 84, thick: 50, maxR: 330, period: 9.2, delay: 0.4 },
        { x: 240, y: 490, speed: 86, thick: 48, maxR: 420, period: 9.2, delay: 3.74 }
      ]
    },
    {
      name: "矶石",
      sub: "ROCK",
      hint: "先踩石头歇脚，再等下一滴",
      spawn: { x: 240, y: 742 },
      rocks: [{ x: 240, y: 430, r: 50 }],
      sources: [
        { x: 240, y: 770, speed: 90, thick: 48, maxR: 340, period: 7.6, delay: 0.4 },
        { x: 240, y: 418, speed: 88, thick: 46, maxR: 350, period: 5.6, delay: 3.9 }
      ]
    },
    {
      name: "细环",
      sub: "THIN",
      hint: "环更窄，贴着亮线别走丢",
      spawn: { x: 240, y: 742 },
      sources: [
        { x: 240, y: 770, speed: 118, thick: 26, maxR: 680, period: 7.4, delay: 0.4 }
      ]
    },
    {
      name: "裂弧",
      sub: "ARC",
      hint: "只有朝向对岸的半圈是路",
      spawn: { x: 240, y: 742 },
      sources: [
        {
          x: 240, y: 770, speed: 96, thick: 42, maxR: 680, period: 7.8, delay: 0.42,
          a0: -2.52, a1: -0.62
        }
      ]
    },
    {
      name: "暗潮",
      sub: "RIPTIDE",
      hint: "品红会吞人，只踩青环",
      spawn: { x: 240, y: 742 },
      sources: [
        { x: 240, y: 770, speed: 100, thick: 40, maxR: 680, period: 7.6, delay: 0.4 },
        { x: 78, y: 520, speed: 62, thick: 34, maxR: 240, period: 3.6, delay: 1.15, hazard: true },
        { x: 402, y: 430, speed: 70, thick: 32, maxR: 220, period: 4.0, delay: 2.0, hazard: true }
      ]
    },
    {
      name: "连跳",
      sub: "CHAIN",
      hint: "三圈相接，叠上就换环，别停空水",
      spawn: { x: 240, y: 742 },
      sources: [
        { x: 240, y: 770, speed: 90, thick: 46, maxR: 220, period: 8.0, delay: 0.4 },
        { x: 240, y: 610, speed: 90, thick: 44, maxR: 220, period: 8.0, delay: 2.18 },
        { x: 240, y: 450, speed: 92, thick: 42, maxR: 380, period: 8.0, delay: 3.97 }
      ]
    },
    {
      name: "游源",
      sub: "DRIFT",
      hint: "水滴在走，看落点再踩",
      spawn: { x: 240, y: 742 },
      sources: [
        {
          x: 240, y: 770, speed: 104, thick: 36, maxR: 680, period: 6.6, delay: 0.5,
          move: { amp: 118, period: 5.6, ph: 0 }
        }
      ]
    },
    {
      name: "暴雨",
      sub: "STORM",
      hint: "乱雨里找青环 · 石头能躲",
      spawn: { x: 240, y: 742 },
      rocks: [{ x: 240, y: 430, r: 48 }],
      sources: [
        { x: 240, y: 770, speed: 108, thick: 28, maxR: 350, period: 6.4, delay: 0.4 },
        { x: 240, y: 418, speed: 102, thick: 26, maxR: 350, period: 5.2, delay: 3.55 },
        { x: 70, y: 560, speed: 72, thick: 28, maxR: 200, period: 3.2, delay: 0.9, hazard: true },
        { x: 410, y: 500, speed: 76, thick: 26, maxR: 190, period: 3.5, delay: 1.6, hazard: true },
        {
          x: 120, y: 250, speed: 80, thick: 22, maxR: 170, period: 4.4, delay: 2.4, hazard: true,
          move: { amp: 70, period: 4.8, ph: 1.2 }
        }
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
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const stageLabel = document.getElementById("stage-label");
  const leftLabel = document.getElementById("left-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const stageEl = document.getElementById("stage");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, x: VW * 0.5, y: VH * 0.5, id: null };
  let heldLock = false;

  const particles = [];
  const motes = [];
  const pips = [];
  const splashes = [];

  const G = {
    mode: "title",
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    lock: 0,
    wet: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    settle: 0,
    ridePulse: 0
  };

  const player = {
    x: 240,
    y: 742,
    trail: [],
    riding: null,
    bob: 0,
    sink: 0,
    face: -Math.PI / 2
  };

  let sources = [];
  let rocks = [];
  let rings = [];
  let droplets = [];
  let bankJag = [];

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
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
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
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
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const sr = this.ctx.sampleRate;
      const n = Math.max(1, Math.floor(sr * Math.min(dur, 0.28)));
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = hp || 700;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    drop(hazard) {
      this.ensure();
      this.noise(0.1, hazard ? 0.05 : 0.04, hazard ? 400 : 1100);
      this.beep(hazard ? 160 : 280, 0.14, "sine", 0.05, hazard ? 70 : 120);
    },
    ride() {
      this.ensure();
      this.beep(620, 0.08, "sine", 0.045, 980);
    },
    warn() {
      this.ensure();
      this.beep(180, 0.08, "triangle", 0.035, 90);
    },
    sink() {
      this.ensure();
      this.noise(0.22, 0.08, 320);
      this.beep(220, 0.32, "sine", 0.06, 60);
    },
    hazard() {
      this.ensure();
      this.noise(0.16, 0.07, 280);
      this.beep(140, 0.28, "sawtooth", 0.05, 50);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.12, "sine", 0.055, 523);
      this.beep(659, 0.16, "sine", 0.05, 784);
      this.beep(784, 0.28, "triangle", 0.055, 1175);
    },
    win() {
      this.ensure();
      this.beep(523, 0.14, "sine", 0.06);
      this.beep(659, 0.16, "sine", 0.055);
      this.beep(784, 0.18, "sine", 0.055);
      this.beep(1046, 0.4, "triangle", 0.07, 1560);
    },
    start() {
      this.ensure();
      this.beep(392, 0.12, "sine", 0.045, 784);
    },
    tick() {
      this.ensure();
      this.beep(880, 0.03, "sine", 0.018);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.muted = true;
  } catch (err) { /* ignore */ }
  audio.setMuted(audio.muted);

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 170) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.45, spec.j * 0.45),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        g: spec.g == null ? 80 : spec.g
      });
    }
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.toggle("gold", !!gold && !warn);
    toastEl.classList.remove("hidden");
    G.toastT = 1.7;
  }

  function syncPips() {
    while (pips.length < LIVES) {
      const el = document.createElement("i");
      el.className = "pip on";
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = "pip" + (i < G.lives ? " on" : " gone");
    }
  }

  function syncHud() {
    const st = STAGES[G.stage];
    if (G.mode === "title") {
      stageLabel.textContent = "十岸";
      leftLabel.textContent = "踏环过河";
    } else {
      stageLabel.textContent = "第 " + (G.stage + 1) + " 岸 · " + (st ? st.name : "");
      let foot = st ? st.sub : "RIPPLE";
      if (G.mode === "play") {
        if (G.wet > 0.06) foot = "危险";
        else if (player.riding) foot = "环上";
        else if (onRockAt(player.x, player.y)) foot = "石上";
        else if (onNear(player.x, player.y) || onFar(player.x, player.y)) foot = "岸上";
      }
      leftLabel.textContent = foot;
    }
    const wetWarn = G.mode === "play" && G.wet > 0.08 && !player.sink;
    stageLabel.classList.toggle("hot", G.mode === "clear" || G.mode === "win");
    leftLabel.classList.toggle("warn", wetWarn);
    syncPips();
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle("hot", kind === "hot");
    hintEl.classList.toggle("warn", kind === "warn");
  }

  const OPS_KB = "WASD / 方向键移动 · 按住拖向落点 · M 静音";
  const OPS_TOUCH = "按住拖向落点 · 点「重开」再来 · M 静音";

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove("hidden");
    panel.classList.toggle("win", kind === "win");
    panel.classList.toggle("lose", kind === "lose");
    ovKicker.textContent = kicker;
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovOps.textContent = ops || (coarse ? OPS_TOUCH : OPS_KB);
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function srcPos(src, t) {
    let x = src.x;
    let y = src.y;
    if (src.move) {
      x += Math.sin((t * TAU) / src.move.period + src.move.ph) * src.move.amp;
    }
    return { x: x, y: y };
  }

  function buildBankJag() {
    bankJag = [];
    for (let i = 0; i <= 24; i++) {
      bankJag.push((hash(i * 3.17) - 0.5) * 10);
    }
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(FAR + 10, NEAR - 10),
        r: rand(0.6, 1.7),
        a: rand(0.04, 0.14),
        p: rand(0, TAU),
        s: rand(5, 16)
      });
    }
  }

  function resetPlayer(st) {
    player.x = st.spawn.x;
    player.y = st.spawn.y;
    player.trail.length = 0;
    player.riding = null;
    player.sink = 0;
    player.face = -Math.PI / 2;
    player.bob = 0;
    G.wet = 0;
  }

  function applyStage(st) {
    sources = st.sources.map(function (s) {
      return {
        x: s.x,
        y: s.y,
        speed: s.speed,
        thick: s.thick,
        maxR: s.maxR,
        period: s.period,
        delay: s.delay,
        hazard: !!s.hazard,
        a0: s.a0,
        a1: s.a1,
        move: s.move || null,
        next: s.delay,
        armed: false
      };
    });
    rocks = (st.rocks || []).map(function (r) {
      return { x: r.x, y: r.y, r: r.r };
    });
    rings.length = 0;
    droplets.length = 0;
    splashes.length = 0;
  }

  function startStage(i, fromFail) {
    G.mode = "play";
    G.stage = i;
    G.t = 0;
    G.lock = fromFail ? 0.55 : 0.12;
    G.settle = 0;
    G.ridePulse = 0;
    heldLock = !!fromFail;
    applyStage(STAGES[i]);
    resetPlayer(STAGES[i]);
    hideOverlay();
    setHint(STAGES[i].hint, "");
    toast(STAGES[i].name);
    syncHud();
    if (!fromFail) audio.start();
  }

  function startRun() {
    particles.length = 0;
    G.lives = LIVES;
    G.flash = 0;
    G.magFlash = 0;
    G.goldFlash = 0;
    startStage(0, false);
  }

  function spawnDroplet(src, impactT) {
    const p = srcPos(src, impactT);
    droplets.push({
      x: p.x,
      y: p.y - 78,
      tx: p.x,
      ty: p.y,
      t: 0,
      dur: DROP_FALL,
      hazard: src.hazard,
      src: src,
      impactT: impactT
    });
  }

  function spawnRing(src, x, y) {
    rings.push({
      x: x,
      y: y,
      r: 4,
      speed: src.speed,
      thick: src.thick,
      maxR: src.maxR,
      hazard: src.hazard,
      a0: src.a0,
      a1: src.a1,
      fade: 1,
      age: 0
    });
    if (rings.length > 22) rings.shift();
    splashes.push({ x: x, y: y, t: 0, hazard: src.hazard });
    if (splashes.length > 12) splashes.shift();
    emit(src.hazard ? 10 : 14, {
      x: x, y: y, j: 8,
      vx0: -70, vx1: 70, vy0: -90, vy1: -10,
      life: 0.45, r0: 1.1, r1: 2.4, mag: src.hazard, g: 220
    });
    audio.drop(src.hazard);
  }

  function onFar(x, y) {
    return y < FAR + 6;
  }
  function onNear(x, y) {
    return y > NEAR - 6;
  }
  function onRockAt(x, y) {
    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      if (hypot(x - r.x, y - r.y) < r.r + PR * 0.35) return true;
    }
    return false;
  }
  function onSolid(x, y) {
    return onFar(x, y) || onNear(x, y) || onRockAt(x, y);
  }

  function ringHalf(ring) {
    return ring.thick * 0.5 * ring.fade + PR * 0.8;
  }

  function covers(px, py, ring) {
    if (ring.fade <= 0.06) return false;
    const dx = px - ring.x;
    const dy = py - ring.y;
    const d = hypot(dx, dy);
    if (Math.abs(d - ring.r) > ringHalf(ring)) return false;
    return inArc(Math.atan2(dy, dx), ring.a0, ring.a1);
  }

  function bestRing(px, py, hazard) {
    let best = null;
    let bestErr = 1e9;
    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      if (!!ring.hazard !== !!hazard) continue;
      if (!covers(px, py, ring)) continue;
      const err = Math.abs(hypot(px - ring.x, py - ring.y) - ring.r);
      if (err < bestErr) {
        bestErr = err;
        best = ring;
      }
    }
    return best;
  }

  function inputDir() {
    let ix = 0;
    let iy = 0;
    if (heldLock) {
      if (!keys.l && !keys.r && !keys.u && !keys.d && !pointer.down) heldLock = false;
      else return { x: 0, y: 0 };
    }
    if (pointer.down && G.mode === "play") {
      const dx = pointer.x - player.x;
      const dy = pointer.y - player.y;
      const d = hypot(dx, dy);
      if (d > 8) {
        ix = dx / d;
        iy = dy / d;
      }
    } else {
      if (keys.l) ix -= 1;
      if (keys.r) ix += 1;
      if (keys.u) iy -= 1;
      if (keys.d) iy += 1;
      const d = hypot(ix, iy);
      if (d > 1) {
        ix /= d;
        iy /= d;
      }
    }
    return { x: ix, y: iy };
  }

  function demoDir() {
    if (onFar(player.x, player.y)) return { x: 0, y: 0 };
    if (bestRing(player.x, player.y, false)) return { x: 0, y: -0.12 };
    if (onNear(player.x, player.y)) return { x: 0, y: 0 };
    return { x: 0, y: -0.4 };
  }

  function die(why) {
    if (player.sink > 0) return;
    if (G.mode !== "play" && G.mode !== "title") return;
    player.sink = 0.72;
    G.lock = 0.72;
    G.shake = why === "hazard" ? 14 : 10;
    player.riding = null;
    if (why === "hazard") {
      G.magFlash = 0.55;
      audio.hazard();
      emit(22, {
        x: player.x, y: player.y, j: 10,
        vx0: -120, vx1: 120, vy0: -80, vy1: 40,
        life: 0.55, r0: 1.4, r1: 3.2, mag: true, g: 160
      });
      if (G.mode === "play") toast("暗潮吞没", true);
    } else {
      audio.sink();
      emit(18, {
        x: player.x, y: player.y, j: 9,
        vx0: -90, vx1: 90, vy0: -70, vy1: 30,
        life: 0.5, r0: 1.2, r1: 2.8, mag: true, g: 180
      });
      if (G.mode === "play") toast("掉进空水", true);
    }
    if (G.mode === "play") setHint("空水会吞人", "warn");
  }

  function afterDeath() {
    G.lives -= 1;
    if (G.lives <= 0) {
      G.mode = "lose";
      G.lives = 0;
      showOverlay(
        "lose",
        "沉河",
        "三命都喂给空水了。<br />只踩亮着的涟漪环，岸与石头才能歇脚。",
        "再来一局",
        "SUNK",
        coarse ? OPS_TOUCH : OPS_KB
      );
      setHint("点再来，或按 R", "warn");
      syncHud();
      return;
    }
    startStage(G.stage, true);
    toast("还剩 " + G.lives + " 命", true);
  }

  function clearStage() {
    if (G.mode !== "play") return;
    G.mode = "clear";
    G.settle = 0.78;
    G.goldFlash = 0.7;
    G.flash = 0.35;
    player.riding = null;
    audio.clear();
    emit(26, {
      x: player.x, y: player.y, j: 14,
      vx0: -70, vx1: 70, vy0: -120, vy1: -20,
      life: 0.7, r0: 1.4, r1: 3.2, gold: true, g: 40
    });
    toast(STAGES[G.stage].name + " · 靠岸", false, true);
    setHint("靠岸了", "hot");
  }

  function winRun() {
    G.mode = "win";
    G.goldFlash = 1;
    audio.win();
    showOverlay(
      "win",
      "河开",
      "十岸涟漪都踩过来了。<br />浪还在扩，河面已是路。",
      "再走一回",
      "CROSS",
      coarse ? OPS_TOUCH : OPS_KB
    );
    setHint("十岸已渡", "hot");
    syncHud();
  }

  function updateSources(dt) {
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      if (!src.armed && G.t + DROP_FALL >= src.next - 0.001) {
        src.armed = true;
        spawnDroplet(src, src.next);
        if (G.mode === "play") audio.tick();
      }
      if (G.t >= src.next) {
        src.next += src.period;
        src.armed = false;
      }
    }

    for (let i = droplets.length - 1; i >= 0; i--) {
      const d = droplets[i];
      d.t += dt;
      const k = clamp(d.t / d.dur, 0, 1);
      const ease = k * k;
      d.x = lerp(d.x, d.tx, 0.08);
      d.y = lerp(d.ty - 78, d.ty, ease);
      if (d.t >= d.dur) {
        spawnRing(d.src, d.tx, d.ty);
        droplets.splice(i, 1);
      }
    }
  }

  function updateRings(dt) {
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      ring.age += dt;
      ring.r = 4 + ring.age * ring.speed;
      if (ring.r >= ring.maxR) {
        ring.r = ring.maxR;
        ring.fade -= dt * 1.35;
        if (ring.fade <= 0) {
          rings.splice(i, 1);
          if (player.riding === ring) player.riding = null;
        }
      }
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      splashes[i].t += dt;
      if (splashes[i].t > 0.55) splashes.splice(i, 1);
    }
  }

  function movePlayer(dt, dir) {
    if (player.sink > 0) return;
    if (G.lock > 0 && G.mode === "play") return;

    if (G.mode === "play" && onFar(player.x, player.y)) {
      clearStage();
      return;
    }

    const onRk = onRockAt(player.x, player.y);
    const onBank = onFar(player.x, player.y) || onNear(player.x, player.y);
    const rest = onRk;
    const hazard = !rest && !onBank && bestRing(player.x, player.y, true);
    if (hazard) {
      die("hazard");
      return;
    }

    let ring = player.riding && rings.indexOf(player.riding) >= 0 && covers(player.x, player.y, player.riding)
      ? player.riding
      : null;
    if (!rest) {
      const other = bestRing(player.x, player.y, false);
      if (!ring) ring = other;
      else if (other && other !== ring) {
        const dx = player.x - ring.x;
        const dy = player.y - ring.y;
        const d = hypot(dx, dy) || 1;
        const ux = dx / d;
        const uy = dy / d;
        const rad = dir.x * ux + dir.y * uy;
        const odx = other.x - player.x;
        const ody = other.y - player.y;
        const toward = dir.x * odx + dir.y * ody;
        if (rad > 0.35 || toward > 0) ring = other;
      }
    } else {
      ring = null;
    }

    if (ring) {
      if (player.riding !== ring) {
        player.riding = ring;
        G.ridePulse = 1;
        if (G.mode === "play") audio.ride();
        emit(6, {
          x: player.x, y: player.y, j: 5,
          vx0: -40, vx1: 40, vy0: -30, vy1: 10,
          life: 0.3, r0: 1, r1: 2, gold: true, g: 20
        });
      }
      const dx = player.x - ring.x;
      const dy = player.y - ring.y;
      const d = hypot(dx, dy) || 0.001;
      const ux = dx / d;
      const uy = dy / d;
      const tx = -uy;
      const ty = ux;
      const tang = dir.x * tx + dir.y * ty;
      let ang = Math.atan2(dy, dx);
      ang += (tang * SPEED * dt) / Math.max(48, ring.r);
      if (ring.a0 != null && ring.a1 != null && !inArc(ang, ring.a0, ring.a1)) {
        const d0 = Math.abs(normAng(ang - ring.a0));
        const d1 = Math.abs(normAng(ang - ring.a1));
        ang = d0 < d1 ? ring.a0 : ring.a1;
      }
      player.x = ring.x + Math.cos(ang) * ring.r;
      player.y = ring.y + Math.sin(ang) * ring.r;
      player.face = ang + (tang >= 0 ? Math.PI / 2 : -Math.PI / 2);
      G.wet = 0;
      if (!onSolid(player.x, player.y) && bestRing(player.x, player.y, true)) {
        die("hazard");
        return;
      }
      if (Math.random() < dt * 18) {
        emit(1, {
          x: player.x, y: player.y, j: 3,
          vx0: -20, vx1: 20, vy0: -10, vy1: 8,
          life: 0.35, r0: 0.8, r1: 1.6, g: 30
        });
      }
    } else {
      const wasRiding = player.riding;
      player.riding = null;
      player.x += dir.x * SPEED * dt;
      player.y += dir.y * SPEED * dt;
      if (dir.x || dir.y) player.face = Math.atan2(dir.y, dir.x);
      const nowSolid = onSolid(player.x, player.y);
      const nowSafe = bestRing(player.x, player.y, false);
      const nowHaz = !nowSolid && bestRing(player.x, player.y, true);
      if (nowHaz) {
        die("hazard");
        return;
      }
      if (!nowSolid && !nowSafe) {
        if (G.wet <= 0 && wasRiding && G.mode === "play") audio.warn();
        G.wet += dt;
        if (G.wet > GRACE) {
          die("sink");
          return;
        }
      } else {
        G.wet = 0;
        if (!nowSolid && nowSafe) player.riding = nowSafe;
      }
    }

    player.x = clamp(player.x, PR + 4, VW - PR - 4);
    player.y = clamp(player.y, PR + 8, VH - PR - 6);

    if (!onSolid(player.x, player.y) && (player.x <= PR + 5 || player.x >= VW - PR - 5)) {
      if (!bestRing(player.x, player.y, false)) {
        G.wet += dt * 1.4;
        if (G.wet > GRACE) die("sink");
      }
    }

    if (G.mode === "play" && onFar(player.x, player.y)) clearStage();
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 26);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.3);
    G.ridePulse = Math.max(0, G.ridePulse - dt * 3.2);
    G.lock = Math.max(0, G.lock - dt);
    player.bob += dt;
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
    player.trail.push({ x: player.x, y: player.y, a: 1 });
    if (player.trail.length > 12) player.trail.shift();
    for (let i = 0; i < player.trail.length; i++) player.trail[i].a *= 0.84;
  }

  function updateTitle(dt) {
    if (!sources.length) applyStage(STAGES[0]);
    if (G.t > 11 || (onFar(player.x, player.y) && G.t > 2)) {
      G.t = 0;
      applyStage(STAGES[0]);
      resetPlayer(STAGES[0]);
    }
    updateSources(dt);
    updateRings(dt);
    movePlayer(dt, demoDir());
    if (player.sink > 0) {
      player.sink -= dt;
      if (player.sink <= 0) {
        applyStage(STAGES[0]);
        resetPlayer(STAGES[0]);
        G.t = 0;
      }
    }
  }

  function updatePlay(dt) {
    updateSources(dt);
    updateRings(dt);
    if (player.sink > 0) {
      player.sink -= dt;
      player.y += dt * 28;
      if (player.sink <= 0) afterDeath();
      return;
    }
    movePlayer(dt, inputDir());
  }

  function update(dt) {
    G.clock += dt;
    if (G.mode === "title") {
      G.t += dt;
      updateTitle(dt);
    } else if (G.mode === "play") {
      G.t += dt;
      updatePlay(dt);
    } else if (G.mode === "clear") {
      G.settle -= dt;
      updateRings(dt);
      if (G.settle <= 0) {
        if (G.stage + 1 >= STAGES.length) winRun();
        else startStage(G.stage + 1, false);
      }
    } else {
      updateRings(dt);
    }
    updateFx(dt);
    syncHud();
  }

  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function bankLine(y0, sign) {
    ctx.beginPath();
    ctx.moveTo(sx(-80), sy(y0));
    const n = bankJag.length - 1;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * VW;
      const y = y0 + bankJag[i] * sign;
      ctx.lineTo(sx(x), sy(y));
    }
    ctx.lineTo(sx(VW + 80), sy(y0));
  }

  function drawWater() {
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, W, H);

    const grd = ctx.createLinearGradient(sx(0), sy(FAR), sx(0), sy(NEAR));
    grd.addColorStop(0, "rgba(0, 240, 255, 0.05)");
    grd.addColorStop(0.5, "rgba(8, 10, 32, 0.0)");
    grd.addColorStop(1, "rgba(255, 61, 184, 0.05)");
    ctx.fillStyle = grd;
    ctx.fillRect(sx(-40), sy(FAR - 8), (VW + 80) * scale, (NEAR - FAR + 16) * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(-40), sy(FAR), (VW + 80) * scale, (NEAR - FAR) * scale);
    ctx.clip();
    const t = G.clock;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      const base = FAR + 30 + i * 72;
      ctx.moveTo(sx(-20), sy(base));
      for (let x = 0; x <= VW; x += 16) {
        const y = base + Math.sin(x * 0.028 + t * (0.7 + i * 0.11) + i) * 5.5
          + Math.sin(x * 0.01 - t * 0.4 + i * 2) * 3;
        ctx.lineTo(sx(x), sy(y));
      }
      ctx.strokeStyle = i % 2 === 0 ? "rgba(0, 240, 255, 0.06)" : "rgba(255, 61, 184, 0.05)";
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = m.x + Math.sin(t * 0.4 + m.p) * 6;
      const my = m.y + Math.cos(t * 0.25 + m.p) * 4;
      ctx.beginPath();
      ctx.arc(sx(mx), sy(my), m.r * scale, 0, TAU);
      ctx.fillStyle = "rgba(180, 230, 255," + m.a + ")";
      ctx.fill();
    }
  }

  function drawBanks() {
    ctx.fillStyle = "#0a0714";
    ctx.beginPath();
    ctx.rect(sx(-80), sy(-40), (VW + 160) * scale, (FAR + 48) * scale);
    bankLine(FAR, 1);
    ctx.lineTo(sx(VW + 80), sy(-40));
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    bankLine(NEAR, -1);
    ctx.lineTo(sx(VW + 80), sy(VH + 40));
    ctx.lineTo(sx(-80), sy(VH + 40));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
    ctx.lineWidth = 2.2 * scale;
    ctx.shadowColor = "rgba(0, 240, 255, 0.4)";
    ctx.shadowBlur = 10 * scale;
    bankLine(FAR, 1);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255, 61, 184, 0.55)";
    ctx.shadowColor = "rgba(255, 61, 184, 0.4)";
    ctx.shadowBlur = 10 * scale;
    bankLine(NEAR, -1);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
    ctx.fillRect(sx(-80), sy(FAR - 18), (VW + 160) * scale, 18 * scale);
    ctx.fillStyle = "rgba(255, 61, 184, 0.08)";
    ctx.fillRect(sx(-80), sy(NEAR), (VW + 160) * scale, 18 * scale);

    for (let i = 0; i < 18; i++) {
      const x = 16 + i * 26 + hash(i + 2) * 8;
      const h = 6 + hash(i * 4) * 8;
      ctx.strokeStyle = "rgba(255, 61, 184, 0.28)";
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(NEAR + 8));
      ctx.quadraticCurveTo(sx(x + 3), sy(NEAR + 8 + h * 0.5), sx(x - 2), sy(NEAR + 8 + h));
      ctx.stroke();
    }

    drawLantern(150, 58);
    drawLantern(330, 58);
    ctx.beginPath();
    ctx.arc(sx(240), sy(64), 16 * scale, 0, TAU);
    ctx.strokeStyle = "rgba(255, 227, 107, 0.55)";
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(240), sy(64), 5 * scale, 0, TAU);
    ctx.fillStyle = GOLD;
    ctx.fill();
  }

  function drawLantern(x, y) {
    const flick = 0.72 + Math.sin(G.clock * 7 + x) * 0.18;
    ctx.fillStyle = "rgba(200, 220, 255, 0.35)";
    ctx.fillRect(sx(x - 1.5), sy(y), 3 * scale, 28 * scale);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 6.5 * scale, 0, TAU);
    ctx.fillStyle = "rgba(0, 240, 255," + (0.55 * flick) + ")";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 3.2 * scale, 0, TAU);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fill();
  }

  function drawRocks() {
    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + 6) * scale, 0, TAU);
      ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), r.r * scale, 0, TAU);
      ctx.fillStyle = "#12101c";
      ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
      ctx.lineWidth = 2 * scale;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx(r.x - r.r * 0.25), sy(r.y - r.r * 0.2), r.r * 0.28 * scale, 0, TAU);
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fill();
    }
  }

  function drawSources() {
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const p = srcPos(src, G.t);
      const until = src.next - G.t;
      const pulse = until < 1.2 ? (1 - until / 1.2) : 0.15;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), (5 + pulse * 7) * scale, 0, TAU);
      ctx.fillStyle = src.hazard
        ? "rgba(255, 61, 184," + (0.18 + pulse * 0.35) + ")"
        : "rgba(0, 240, 255," + (0.16 + pulse * 0.35) + ")";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 2.4 * scale, 0, TAU);
      ctx.fillStyle = src.hazard ? MAG : CYAN;
      ctx.fill();
    }
  }

  function drawDroplets() {
    for (let i = 0; i < droplets.length; i++) {
      const d = droplets[i];
      const k = clamp(d.t / d.dur, 0, 1);
      ctx.beginPath();
      ctx.ellipse(sx(d.x), sy(d.y), 3.2 * scale, (5.2 - k * 1.4) * scale, 0, 0, TAU);
      ctx.fillStyle = d.hazard ? MAG : CYAN;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx(d.tx), sy(d.ty), (6 + k * 4) * scale, 0, TAU);
      ctx.strokeStyle = d.hazard ? "rgba(255, 61, 184, 0.35)" : "rgba(0, 240, 255, 0.35)";
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
    }
  }

  function drawRings() {
    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      const a0 = ring.a0 == null ? 0 : ring.a0;
      const a1 = ring.a1 == null ? TAU : ring.a1;
      const alpha = 0.22 + 0.55 * ring.fade;
      const col = ring.hazard ? MAG : CYAN;
      const w = Math.max(2, ring.thick * ring.fade);

      ctx.beginPath();
      ctx.arc(sx(ring.x), sy(ring.y), ring.r * scale, a0, a1, false);
      ctx.strokeStyle = ring.hazard ? "rgba(255, 61, 184," + (alpha * 0.35) + ")" : "rgba(0, 240, 255," + (alpha * 0.28) + ")";
      ctx.lineWidth = (w + 10) * scale;
      ctx.lineCap = "round";
      if (ring.hazard) ctx.setLineDash([8 * scale, 7 * scale]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(sx(ring.x), sy(ring.y), ring.r * scale, a0, a1, false);
      ctx.strokeStyle = ring.hazard
        ? "rgba(255, 61, 184," + alpha + ")"
        : "rgba(0, 240, 255," + alpha + ")";
      ctx.lineWidth = w * scale;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx(ring.x), sy(ring.y), ring.r * scale, a0, a1, false);
      ctx.strokeStyle = ring.hazard
        ? "rgba(255, 180, 230," + (0.35 * ring.fade) + ")"
        : "rgba(255, 255, 255," + (0.45 * ring.fade) + ")";
      ctx.lineWidth = Math.max(1.2, w * 0.18) * scale;
      ctx.stroke();
    }

    for (let i = 0; i < splashes.length; i++) {
      const s = splashes[i];
      const k = s.t / 0.55;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (8 + k * 28) * scale, 0, TAU);
      ctx.strokeStyle = s.hazard
        ? "rgba(255, 61, 184," + (1 - k) * 0.5 + ")"
        : "rgba(0, 240, 255," + (1 - k) * 0.5 + ")";
      ctx.lineWidth = (3 - k * 2) * scale;
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fillStyle = p.gold
        ? "rgba(255, 227, 107," + a + ")"
        : p.mag
          ? "rgba(255, 61, 184," + a + ")"
          : "rgba(0, 240, 255," + a + ")";
      ctx.fill();
    }
  }

  function drawPlayer() {
    for (let i = 0; i < player.trail.length; i++) {
      const tr = player.trail[i];
      ctx.beginPath();
      ctx.arc(sx(tr.x), sy(tr.y), (3 + i * 0.25) * scale, 0, TAU);
      ctx.fillStyle = "rgba(255, 227, 107," + (tr.a * 0.25) + ")";
      ctx.fill();
    }

    const sinkK = player.sink > 0 ? 1 - player.sink / 0.72 : 0;
    const bob = Math.sin(player.bob * 6) * 1.2;
    const px = player.x;
    const py = player.y + bob + sinkK * 10;
    const pr = PR * (1 - sinkK * 0.45);
    const wet = G.wet > 0.05 && !player.sink;
    const flicker = wet && ((G.clock * 18) % 1 > 0.45);

    ctx.beginPath();
    ctx.ellipse(sx(px), sy(py + 8), 9 * scale, 4 * scale, 0, 0, TAU);
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fill();

    if (player.riding && !player.sink) {
      ctx.beginPath();
      ctx.arc(sx(px), sy(py), (pr + 7 + G.ridePulse * 6) * scale, 0, TAU);
      ctx.strokeStyle = "rgba(255, 227, 107," + (0.35 + G.ridePulse * 0.4) + ")";
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(sx(px), sy(py), pr * scale, 0, TAU);
    ctx.fillStyle = flicker ? MAG : GOLD;
    ctx.fill();
    ctx.strokeStyle = flicker ? "rgba(255, 61, 184, 0.9)" : CYAN;
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    const ex = Math.cos(player.face) * 3.4;
    const ey = Math.sin(player.face) * 3.4;
    ctx.beginPath();
    ctx.arc(sx(px + ex - 1.6), sy(py + ey - 1.2), 1.15 * scale, 0, TAU);
    ctx.arc(sx(px + ex + 1.6), sy(py + ey - 1.2), 1.15 * scale, 0, TAU);
    ctx.fillStyle = "#1a1028";
    ctx.fill();

    if (pointer.down && G.mode === "play" && !player.sink) {
      ctx.beginPath();
      ctx.arc(sx(pointer.x), sy(pointer.y), 7 * scale, 0, TAU);
      ctx.strokeStyle = "rgba(255, 227, 107, 0.45)";
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
  }

  function drawVignette() {
    if (G.flash > 0) {
      ctx.fillStyle = "rgba(255, 255, 255," + (G.flash * 0.12) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = "rgba(255, 227, 107," + (G.goldFlash * 0.08) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (G.magFlash > 0) {
      ctx.fillStyle = "rgba(255, 61, 184," + (G.magFlash * 0.12) + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    const shx = G.shake ? (hash(G.clock * 40) - 0.5) * G.shake * scale : 0;
    const shy = G.shake ? (hash(G.clock * 40 + 8) - 0.5) * G.shake * scale : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawWater();
    drawBanks();
    drawRings();
    drawRocks();
    drawSources();
    drawDroplets();
    drawParticles();
    drawPlayer();
    drawVignette();
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    return {
      x: (cssX * dpr - ox) / scale,
      y: (cssY * dpr - oy) / scale
    };
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (overlay.contains(e.target) || e.target.closest("button")) return;
    audio.ensure();
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  }

  function onPointerMove(e) {
    const w = worldFromEvent(e);
    if (pointer.down && (pointer.id == null || e.pointerId === pointer.id)) {
      pointer.x = w.x;
      pointer.y = w.y;
    } else {
      pointer.x = w.x;
      pointer.y = w.y;
    }
  }

  function onPointerUp(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
  }

  function toggleMute() {
    audio.ensure();
    audio.setMuted(!audio.muted);
  }

  function retry() {
    audio.ensure();
    if (G.mode === "title") {
      startRun();
      return;
    }
    startRun();
  }

  function onOverlayConfirm() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "lose" || G.mode === "win") startRun();
  }

  function keyDown(e) {
    const k = e.key;
    if (k === "m" || k === "M") {
      toggleMute();
      e.preventDefault();
      return;
    }
    if (k === "r" || k === "R") {
      retry();
      e.preventDefault();
      return;
    }
    if (k === " " || k === "Enter") {
      if (G.mode === "title" || G.mode === "lose" || G.mode === "win") {
        onOverlayConfirm();
        e.preventDefault();
        return;
      }
    }
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.l = true;
    if (k === "ArrowRight" || k === "d" || k === "D") keys.r = true;
    if (k === "ArrowUp" || k === "w" || k === "W") keys.u = true;
    if (k === "ArrowDown" || k === "s" || k === "S") keys.d = true;
    if (
      k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown" ||
      k === " " || k === "a" || k === "A" || k === "d" || k === "D" ||
      k === "w" || k === "W" || k === "s" || k === "S"
    ) {
      e.preventDefault();
      audio.ensure();
    }
  }

  function keyUp(e) {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.l = false;
    if (k === "ArrowRight" || k === "d" || k === "D") keys.r = false;
    if (k === "ArrowUp" || k === "w" || k === "W") keys.u = false;
    if (k === "ArrowDown" || k === "s" || k === "S") keys.d = false;
  }

  ovBtn.addEventListener("click", onOverlayConfirm);
  btnMute.addEventListener("click", function () {
    audio.ensure();
    toggleMute();
  });
  btnRetry.addEventListener("click", retry);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
  });

  if (coarse) {
    hintEl.textContent = "按住拖向落点 · 浪到岸边再踩";
    ovOps.textContent = OPS_TOUCH;
  }

  buildBankJag();
  seedMotes();
  applyStage(STAGES[0]);
  resetPlayer(STAGES[0]);
  showOverlay(
    "title",
    "涟步",
    "只踩在扩散的涟漪环上过河。<br />空水会吞人，岸与石头能站。",
    "踏浪",
    "RIPPLE",
    coarse ? OPS_TOUCH : OPS_KB
  );
  syncHud();
  resize();

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
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
    draw();
  }
  requestAnimationFrame(frame);
})();
