(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const CX = 480;
  const CY = 338;
  const TABLE_Y = 468;
  const HR = 102;
  const HAND_OMEGA = 3.55;
  const HAND_FOLLOW = 11.5;
  const SHIELD_IN = 0.62;
  const SHIELD_OUT = 1.28;
  const DURATION = 42;
  const DRAIN = 18.6;
  const RECOVER = 5.2;
  const GUARD_RATE = 4.15;
  const WARN_HP = 28;
  const LOCK = 0.78;
  const DIE_T = 1.05;
  const WIN_T = 0.95;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function angNorm(a) {
    a = (a + Math.PI) % TAU;
    if (a < 0) a += TAU;
    return a - Math.PI;
  }
  function angDiff(a, b) {
    return Math.abs(angNorm(a - b));
  }
  function lerpAng(a, b, t) {
    return angNorm(a + angNorm(b - a) * t);
  }
  function env(t, t0, t1, atk, rel) {
    if (t < t0 || t > t1) return 0;
    const a = (t - t0) / Math.max(0.001, atk);
    const r = (t1 - t) / Math.max(0.001, rel);
    return Math.min(1, a, r);
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
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
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const timeLabel = document.getElementById("time-label");
  const guardLabel = document.getElementById("guard-label");
  const balWrap = document.getElementById("bal-wrap");
  const balFill = document.getElementById("bal-fill");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };

  const keys = { left: false, right: false };
  const pad = { left: false, right: false };
  const pointer = { down: false, id: null, ang: 0, valid: false };

  const particles = [];
  const gusts = [];
  const smoke = [];
  const sparks = [];
  const stars = [];
  const drips = [];

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
    t: 0,
    remain: DURATION,
    hp: 100,
    guard: 0,
    hand: -Math.PI / 2,
    handV: 0,
    windAng: 0,
    windStr: 0.18,
    gust: "",
    shield: 1,
    lock: 0,
    phase: "play",
    phaseT: 0,
    why: "",
    shake: 0,
    flash: 0,
    flashRgb: "0,240,255",
    flicker: 1,
    lean: 0,
    leanAng: 0,
    clock: 0,
    warned: false,
    taught: false,
    lastWarn: -9,
    lastCrack: -9,
    mile: 0,
    dawn: 0
  };

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 86; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * 250,
        r: Math.random() * 1.45 + 0.22,
        a: Math.random() * 0.5 + 0.08,
        p: Math.random() * TAU
      });
    }
  }
  makeStars();

  const SFX = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    windSrc: null,
    windGain: null,
    windFilt: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.ensureWind();
    },
    ensureWind: function () {
      if (!this.ctx || this.windSrc) return;
      const sr = this.ctx.sampleRate;
      const n = Math.floor(sr * 1.4);
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      let accn = 0;
      for (let i = 0; i < n; i++) {
        accn = accn * 0.96 + (Math.random() * 2 - 1) * 0.18;
        data[i] = accn + (Math.random() * 2 - 1) * 0.22;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 420;
      f.Q.value = 0.65;
      const g = this.ctx.createGain();
      g.gain.value = 0.0001;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
      this.windSrc = src;
      this.windGain = g;
      this.windFilt = f;
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
    noise: function (dur, vol, cutoff) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = cutoff || 900;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.18, "sine", 0.07, 392);
      this.beep(294, 0.24, "triangle", 0.04, 588);
    },
    gust: function () {
      this.ensure();
      this.noise(0.34, 0.09, 780);
      this.beep(160, 0.26, "sine", 0.035, 70);
    },
    block: function () {
      this.ensure();
      this.beep(420, 0.07, "triangle", 0.028, 180);
    },
    warn: function () {
      this.ensure();
      this.beep(220, 0.12, "square", 0.032, 120);
    },
    tick: function () {
      this.ensure();
      this.beep(880, 0.05, "sine", 0.028, 1240);
    },
    mile: function () {
      this.ensure();
      this.beep(520, 0.1, "triangle", 0.05, 780);
    },
    crack: function () {
      this.ensure();
      this.noise(0.05, 0.035, 1800);
    },
    out: function () {
      this.ensure();
      this.noise(0.4, 0.11, 500);
      this.beep(180, 0.55, "sawtooth", 0.08, 48);
    },
    win: function () {
      this.ensure();
      this.beep(392, 0.16, "sine", 0.08, 523);
      const self = this;
      const g = runGen;
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(523, 0.18, "sine", 0.08, 659);
      }, 95);
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(784, 0.34, "sine", 0.1, 1175);
      }, 210);
    },
    lose: function () {
      this.ensure();
      this.beep(160, 0.6, "sawtooth", 0.08, 42);
      this.beep(80, 0.78, "square", 0.045, 36);
    },
    tickBeds: function (hp01, windStr, playing) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 58;
        g.gain.value = 0.016;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const f = 52 + (1 - hp01) * 70 + windStr * 16;
      this.drone.frequency.setTargetAtTime(f, t, 0.12);
      const vol = playing ? 0.014 + (1 - hp01) * 0.028 + windStr * 0.01 : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.14);
      if (this.windGain && this.windFilt) {
        this.windGain.gain.setTargetAtTime(playing ? 0.01 + windStr * 0.042 : 0.0001, t, 0.16);
        this.windFilt.frequency.setTargetAtTime(300 + windStr * 480, t, 0.2);
      }
    },
    hushBeds: function () {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.0001, t, 0.2);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0.0001, t, 0.22);
    }
  };

  try {
    if (localStorage.getItem("candle-wind-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
    btnMute.setAttribute("aria-label", SFX.muted ? "取消静音" : "静音");
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.28;
    if (m) SFX.hushBeds();
    syncMuteBtn();
    try {
      localStorage.setItem("candle-wind-mute", m ? "1" : "0");
    } catch (_) { /* ignore */ }
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
        kind: spec.kind || 0
      });
    }
  }

  function windAt(t) {
    let ang = 0.18 * Math.sin(t * 0.37);
    let str = 0.16 + 0.07 * Math.sin(t * 1.05);
    let name = "";

    function gust(t0, t1, atk, rel, addStr, gname, angFn) {
      const e = env(t, t0, t1, atk, rel);
      if (e <= 0) return;
      str += addStr * e;
      ang = lerpAng(ang, angFn(t), clamp(e * 1.45, 0, 1));
      if (e > 0.42) name = gname;
    }

    gust(3.3, 7.1, 0.48, 0.52, 0.98, "east", function () { return 0; });
    gust(8.5, 12.3, 0.42, 0.5, 1.06, "west", function () { return Math.PI; });
    gust(13.6, 16.9, 0.38, 0.48, 1.1, "north", function () { return -Math.PI / 2; });
    gust(18.0, 23.4, 0.48, 0.55, 0.94, "swing", function (tt) {
      return Math.sin((tt - 18.0) * 1.32) * 2.28;
    });
    gust(24.8, 32.4, 0.48, 0.62, 1.14, "chaos", function (tt) {
      return (tt - 24.8) * 1.72 - 0.35;
    });
    gust(33.6, 40.2, 0.52, 0.82, 1.26, "final", function (tt) {
      return 0.35 + Math.sin((tt - 33.6) * 1.62) * 1.48 + (tt - 33.6) * 0.2;
    });

    if (t > 40.2) str *= clamp(1 - (t - 40.2) / 1.7, 0, 1);
    return { ang: angNorm(ang), str: str, name: name };
  }

  function shieldOf(hand, windAng) {
    const d = angDiff(hand, windAng);
    if (d <= SHIELD_IN) return 1;
    if (d >= SHIELD_OUT) return 0;
    return 1 - (d - SHIELD_IN) / (SHIELD_OUT - SHIELD_IN);
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.75;
  }

  function renderHud() {
    if (mode === "title") {
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
      guardLabel.textContent = "守 —";
      guardLabel.classList.remove("warn");
      balFill.style.width = "0%";
      balWrap.classList.remove("warn");
    } else {
      const t = Math.max(0, st.remain);
      timeLabel.textContent = t.toFixed(1);
      const danger = st.hp < WARN_HP && (mode === "play" || st.phase === "play");
      timeLabel.classList.toggle("warn", (t < 6.5 && mode === "play") || danger);
      guardLabel.textContent = "守 " + Math.floor(st.guard);
      guardLabel.classList.toggle("warn", danger);
      balFill.style.width = clamp(st.hp, 0, 100).toFixed(1) + "%";
      balWrap.classList.toggle("warn", danger);
    }
  }

  function setOverlay(kind) {
    overlayKind = kind;
    overlay.classList.remove("hidden");
    frozen = true;
    panel.classList.toggle("win", kind === "win");
    panel.classList.toggle("lose", kind === "lose");
    if (kind === "title") {
      ovKicker.textContent = "CANDLE";
      ovTitle.textContent = "护烛";
      ovLead.innerHTML = "把掌心转到风吹来的一侧。<br />挡住阵风，烛火不能灭。";
      ovOps.textContent = coarse
        ? "拖向风口，或按逆 / 顺绕烛转掌 · M 静音"
        : "← → / A D 绕烛转掌 · 拖向风口 · M 静音";
      ovBtn.textContent = "护烛";
    } else if (kind === "lose") {
      ovKicker.textContent = "OUT";
      ovTitle.textContent = "烛已灭";
      ovLead.textContent = "风灌进灯芯。守 " + Math.floor(st.guard) +
        " · 撑了 " + (DURATION - Math.max(0, st.remain)).toFixed(1) + " 秒。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再护一次";
    } else if (kind === "win") {
      ovKicker.textContent = "DAWN";
      ovTitle.textContent = st.why === "guard" ? "守意满" : "灯未灭";
      ovLead.textContent = st.why === "guard"
        ? "一夜风口都挡在掌心。守意加满，烛火还在。"
        : "破晓了。窗里还亮着那一簇火。";
      ovOps.textContent = "火 " + Math.floor(st.hp) + " · 守 " + Math.floor(st.guard);
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
    overlayKind = "none";
    panel.classList.remove("win", "lose");
  }

  function resetRun() {
    st.t = 0;
    st.remain = DURATION;
    st.hp = 100;
    st.guard = 0;
    st.hand = -Math.PI / 2 + rand(-0.12, 0.12);
    st.handV = 0;
    st.windAng = 0;
    st.windStr = 0.18;
    st.gust = "";
    st.shield = 1;
    st.lock = LOCK;
    st.phase = "play";
    st.phaseT = 0;
    st.why = "";
    st.shake = 0;
    st.flash = 0.3;
    st.flashRgb = "0,240,255";
    st.flicker = 1;
    st.lean = 0;
    st.leanAng = 0;
    st.warned = false;
    st.taught = false;
    st.lastWarn = -9;
    st.lastCrack = -9;
    st.mile = 0;
    st.dawn = 0;
    particles.length = 0;
    gusts.length = 0;
    smoke.length = 0;
    sparks.length = 0;
    drips.length = 0;
  }

  function loadTitle() {
    mode = "title";
    resetRun();
    st.hand = -0.55;
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "掌心对着风口 · 拖屏幕或按逆 / 顺"
      : "掌心对着风口 · ← → 绕烛转掌";
  }

  function startPlay() {
    runGen += 1;
    SFX.start();
    mode = "play";
    acc = 0;
    pointer.down = false;
    pointer.id = null;
    pointer.valid = false;
    resetRun();
    hideOverlay();
    renderHud();
    showToast("掌心对着风口");
    hintEl.textContent = coarse
      ? "转到风吹来的一侧 · 逆 / 顺或拖屏幕"
      : "转到风吹来的一侧 · ← → / A D · M 静音";
  }

  function gatherSpin() {
    let f = 0;
    if (keys.left || pad.left) f -= 1;
    if (keys.right || pad.right) f += 1;
    return f;
  }

  function spawnGustBits(dt, wAng, wStr, shielded) {
    const tries = wStr > 1.05 ? 2 : 1;
    for (let n = 0; n < tries; n++) {
      if (Math.random() > (18 + wStr * 48) * dt) continue;
      const dist = rand(210, 340);
      const jitter = rand(-0.18, 0.18);
      const a = wAng + jitter;
      const x = CX + Math.cos(a) * dist;
      const y = CY + Math.sin(a) * dist;
      const sp = rand(210, 360) * (0.55 + wStr * 0.55);
      gusts.push({
        x: x,
        y: y,
        vx: -Math.cos(a) * sp,
        vy: -Math.sin(a) * sp,
        life: rand(0.55, 1.15),
        mag: wStr > 0.95,
        hit: false
      });
      if (gusts.length > 70) gusts.shift();
    }
    if (shielded && Math.random() < 0.22) {
      const hx = CX + Math.cos(st.hand) * HR;
      const hy = CY + Math.sin(st.hand) * HR;
      sparks.push({
        x: hx + rand(-10, 10),
        y: hy + rand(-10, 10),
        vx: Math.cos(st.hand) * rand(40, 120) + rand(-40, 40),
        vy: Math.sin(st.hand) * rand(40, 120) + rand(-40, 40),
        life: rand(0.18, 0.4)
      });
      if (sparks.length > 36) sparks.shift();
    }
  }

  function spawnFlameBits(dt) {
    const alive = st.hp / 100;
    if (alive <= 0.02) return;
    if (Math.random() < (0.35 + alive * 0.4) * Math.min(1, dt * 60)) {
      const leanX = Math.cos(st.leanAng) * st.lean * 10;
      const leanY = Math.sin(st.leanAng) * st.lean * 10;
      emit(1, {
        x: CX + leanX,
        y: CY - 18 + leanY,
        j: 3,
        vx0: leanX * 4 - 8,
        vx1: leanX * 4 + 8,
        vy0: -46,
        vy1: -12,
        life: 0.42,
        r0: 0.8,
        r1: 2.2,
        kind: st.hp < WARN_HP ? 1 : 2
      });
    }
    if (st.hp < 55 && Math.random() < (0.4 + (1 - alive) * 0.7) * dt * 18) {
      smoke.push({
        x: CX + rand(-4, 4),
        y: CY - 10,
        vx: Math.cos(st.windAng + Math.PI) * st.windStr * 28 + rand(-12, 12),
        vy: rand(-40, -16),
        life: rand(0.5, 1.1),
        r: rand(4, 10)
      });
      if (smoke.length > 40) smoke.shift();
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
      p.vy += 28 * dt;
      p.vx *= 0.99;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) sparks.splice(i, 1);
    }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.r += 10 * dt;
      s.vx *= 0.98;
      if (s.life <= 0) smoke.splice(i, 1);
    }
    for (let i = gusts.length - 1; i >= 0; i--) {
      const g = gusts[i];
      g.life -= dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      const dx = g.x - CX;
      const dy = g.y - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (!g.hit && dist < HR + 10 && st.shield > 0.45) {
        const ha = Math.atan2(dy, dx);
        if (angDiff(ha, st.hand) < 0.72) {
          g.hit = true;
          g.vx = Math.cos(st.hand) * rand(90, 200) + rand(-50, 50);
          g.vy = Math.sin(st.hand) * rand(90, 200) + rand(-50, 50);
          g.life = Math.min(g.life, 0.22);
        }
      }
      if (g.life <= 0 || dist < 16) gusts.splice(i, 1);
    }
    for (let i = drips.length - 1; i >= 0; i--) {
      const d = drips[i];
      d.y += d.vy * dt;
      d.vy += 180 * dt;
      d.life -= dt;
      if (d.y > TABLE_Y - 8 || d.life <= 0) drips.splice(i, 1);
    }
  }

  function stepPhysics(dt) {
    if (st.phase !== "play") {
      st.phaseT += dt;
      st.shake = Math.max(0, st.shake - dt * 16);
      st.flash = Math.max(0, st.flash - dt);
      st.flicker = lerp(st.flicker, st.phase === "clear" ? 1.15 : 0.05, 1 - Math.pow(0.02, dt));
      if (st.phase === "die") {
        st.hp = 0;
        st.lean = lerp(st.lean, 1, 0.08);
        if (Math.random() < 0.7) {
          smoke.push({
            x: CX + rand(-6, 6),
            y: CY - 8,
            vx: rand(-18, 18),
            vy: rand(-50, -20),
            life: rand(0.5, 1.0),
            r: rand(5, 12)
          });
        }
      } else {
        st.windStr = lerp(st.windStr, 0.05, 0.08);
        spawnFlameBits(dt);
      }
      spawnGustBits(dt, st.windAng, st.windStr * 0.4, true);
      stepParticles(dt);
      return null;
    }

    st.t += dt;
    st.remain = Math.max(0, DURATION - st.t);
    st.lock = Math.max(0, st.lock - dt);
    st.shake = Math.max(0, st.shake - dt * 18);
    st.flash = Math.max(0, st.flash - dt);
    st.dawn = smooth(clamp((st.t - 34) / 8, 0, 1));

    const w = windAt(st.t);
    st.windAng = w.ang;
    st.windStr = w.str;
    if (w.name && w.name !== st.gust) {
      st.gust = w.name;
      SFX.gust();
      if (w.name === "east") showToast("东风 · 掌心转到右", true);
      else if (w.name === "west") showToast("西风 · 掌心转到左", true);
      else if (w.name === "north") showToast("北风 · 掌心转到上", true);
      else if (w.name === "swing") showToast("回风 · 跟着转");
      else if (w.name === "chaos") showToast("乱风", true);
      else if (w.name === "final") showToast("终夜 · 再挡一会");
    } else if (!w.name) {
      st.gust = "";
    }

    const spin = st.lock > 0 ? 0 : gatherSpin();
    if (spin !== 0) {
      st.handV = spin * HAND_OMEGA;
      st.hand = angNorm(st.hand + st.handV * dt);
    } else if (st.lock <= 0 && pointer.down && pointer.valid && pointer.id !== "pad") {
      const d = angNorm(pointer.ang - st.hand);
      st.handV = d * HAND_FOLLOW;
      st.hand = angNorm(st.hand + st.handV * dt);
    } else {
      st.handV *= Math.exp(-7 * dt);
      st.hand = angNorm(st.hand + st.handV * dt);
    }

    const sh = shieldOf(st.hand, st.windAng);
    st.shield = sh;
    const exposed = (1 - sh) * st.windStr;

    const wantLean = exposed * 0.85;
    st.lean = lerp(st.lean, wantLean, 1 - Math.pow(0.012, dt));
    st.leanAng = lerpAng(st.leanAng, st.windAng + Math.PI, 0.12);

    const flick = 0.82 + 0.18 * Math.sin(st.clock * 14.2) * Math.sin(st.clock * 9.1 + 1.3);
    st.flicker = flick * (0.55 + 0.45 * (st.hp / 100));

    if (st.lock <= 0) {
      st.hp -= DRAIN * exposed * dt;
      if (sh > 0.72 && st.windStr > 0.22) st.hp += RECOVER * dt;
      st.hp = clamp(st.hp, 0, 100);
      if (sh > 0.74 && st.windStr > 0.38) {
        st.guard += GUARD_RATE * dt * (0.45 + 0.55 * sh);
        if (st.guard > 100) st.guard = 100;
      }
    }

    spawnGustBits(dt, st.windAng, st.windStr, sh > 0.5);
    spawnFlameBits(dt);
    stepParticles(dt);

    if (Math.random() < 0.012) {
      drips.push({
        x: CX + (Math.random() < 0.5 ? -8 : 9),
        y: CY + 28,
        vy: 14,
        life: 1.1
      });
    }

    if (st.t - st.lastCrack > 0.55 && st.hp > 40 && sh > 0.6) {
      st.lastCrack = st.t;
      if (Math.random() < 0.35) SFX.crack();
    }

    const mile = Math.floor(st.guard / 25);
    if (mile > st.mile && mile < 4 && mile > 0) {
      st.mile = mile;
      SFX.mile();
      showToast("守 " + mile * 25);
      emit(10, {
        x: CX,
        y: CY - 16,
        j: 8,
        vx0: -50,
        vx1: 50,
        vy0: -90,
        vy1: -16,
        life: 0.5,
        r0: 1.4,
        r1: 3.2,
        kind: 2
      });
    }

    if (st.hp < WARN_HP) {
      if (!st.warned) {
        st.warned = true;
        showToast("火要灭 · 挡住风口", true);
      }
      if (st.t - st.lastWarn > 0.9) {
        st.lastWarn = st.t;
        SFX.warn();
        st.shake = Math.min(8, st.shake + 3.5);
      }
    } else if (st.hp > WARN_HP + 10) {
      st.warned = false;
    }

    if (!st.taught && st.t > 2.2 && sh < 0.35 && st.windStr > 0.4) {
      st.taught = true;
      showToast("转到风吹来的那一侧", true);
    }

    if (sh > 0.85 && st.windStr > 0.7 && Math.random() < 0.015) SFX.block();

    if (st.guard >= 100) {
      st.guard = 100;
      st.why = "guard";
      st.phase = "clear";
      st.phaseT = 0;
      st.flash = 0.55;
      st.flashRgb = "0,240,255";
      burstWin();
      return "clear";
    }
    if (st.remain <= 0 && st.hp > 0) {
      st.remain = 0;
      st.why = "time";
      st.phase = "clear";
      st.phaseT = 0;
      st.flash = 0.55;
      st.flashRgb = "255,227,107";
      burstWin();
      return "clear";
    }
    if (st.hp <= 0) {
      st.hp = 0;
      st.why = "out";
      st.phase = "die";
      st.phaseT = 0;
      st.flash = 0.5;
      st.flashRgb = "255,61,184";
      st.shake = 9;
      return "die";
    }
    return null;
  }

  function burstWin() {
    emit(28, {
      x: CX,
      y: CY - 18,
      j: 10,
      vx0: -110,
      vx1: 110,
      vy0: -160,
      vy1: 20,
      life: 0.8,
      r0: 1.6,
      r1: 4.4,
      kind: 2
    });
  }

  function onDieDone() {
    mode = "lose";
    SFX.hushBeds();
    SFX.lose();
    setOverlay("lose");
    renderHud();
  }

  function onClearDone() {
    mode = "win";
    SFX.hushBeds();
    setOverlay("win");
    renderHud();
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
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale
    };
  }

  function drawRoundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawSky() {
    const dawn = st.dawn;
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, dawn > 0.2 ? "rgb(" + (9 + dawn * 28 | 0) + "," + (6 + dawn * 18 | 0) + "," + (22 + dawn * 10 | 0) + ")" : "#090616");
    g.addColorStop(0.42, dawn > 0.15 ? "rgb(" + (18 + dawn * 50 | 0) + "," + (10 + dawn * 22 | 0) + "," + (28 + dawn * 8 | 0) + ")" : "#070412");
    g.addColorStop(0.72, "#0a0718");
    g.addColorStop(1, "#12081c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const mag = ctx.createRadialGradient(110, -10, 8, 110, -10, 320);
    mag.addColorStop(0, "rgba(255,61,184," + (0.14 + dawn * 0.08) + ")");
    mag.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, VW, VH);

    const cyan = ctx.createRadialGradient(850, 30, 8, 850, 30, 300);
    cyan.addColorStop(0, "rgba(0,240,255," + (0.1 + dawn * 0.06) + ")");
    cyan.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = cyan;
    ctx.fillRect(0, 0, VW, VH);

    if (dawn > 0.15) {
      const sun = ctx.createRadialGradient(780, 70, 4, 780, 70, 160);
      sun.addColorStop(0, "rgba(255,227,107," + (dawn * 0.28) + ")");
      sun.addColorStop(1, "rgba(255,227,107,0)");
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(780, 70, 160, 0, TAU);
      ctx.fill();
    }
  }

  function drawStars() {
    const fade = 1 - st.dawn * 0.85;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + Math.sin(st.clock * 2.1 + s.p) * 0.45;
      ctx.fillStyle = "rgba(230,236,255," + (s.a * tw * fade) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawMoon() {
    const mx = 168;
    const my = 78;
    const fade = 1 - st.dawn * 0.55;
    const rg = ctx.createRadialGradient(mx, my, 6, mx, my, 52);
    rg.addColorStop(0, "rgba(255,227,107," + (0.5 * fade) + ")");
    rg.addColorStop(0.45, "rgba(255,227,107," + (0.1 * fade) + ")");
    rg.addColorStop(1, "rgba(255,227,107,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(mx, my, 52, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,233,160," + fade + ")";
    ctx.beginPath();
    ctx.arc(mx, my, 17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(5,3,12,0.38)";
    ctx.beginPath();
    ctx.arc(mx + 7, my - 2, 13, 0, TAU);
    ctx.fill();
  }

  function drawCity() {
    ctx.fillStyle = "rgba(6,4,14,0.92)";
    const base = 268;
    const hs = [38, 62, 44, 88, 52, 70, 40, 96, 58, 46, 74, 50, 82, 42, 64, 54, 90, 48];
    let x = 36;
    for (let i = 0; i < hs.length; i++) {
      const w = 42 + (i % 3) * 8;
      ctx.fillRect(x, base - hs[i], w, hs[i] + 20);
      if (i % 2 === 0) {
        ctx.fillStyle = i % 4 === 0 ? "rgba(255,61,184,0.18)" : "rgba(0,240,255,0.14)";
        for (let wy = base - hs[i] + 8; wy < base - 6; wy += 12) {
          ctx.fillRect(x + 8, wy, 5, 4);
          ctx.fillRect(x + w - 14, wy, 5, 4);
        }
        ctx.fillStyle = "rgba(6,4,14,0.92)";
      }
      x += w + 6;
    }
  }

  function drawWindow() {
    ctx.strokeStyle = "rgba(0,240,255,0.22)";
    ctx.lineWidth = 10;
    drawRoundRect(22, 16, VW - 44, 272, 8);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.16)";
    ctx.lineWidth = 2;
    drawRoundRect(28, 22, VW - 56, 260, 6);
    ctx.stroke();
    ctx.strokeStyle = "rgba(246,243,255,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(VW * 0.5, 22);
    ctx.lineTo(VW * 0.5, 282);
    ctx.moveTo(28, 150);
    ctx.lineTo(VW - 28, 150);
    ctx.stroke();
  }

  function drawRoom() {
    ctx.fillStyle = "#0b0714";
    ctx.fillRect(0, 282, VW, TABLE_Y - 282);
    const g = ctx.createLinearGradient(0, 282, 0, TABLE_Y);
    g.addColorStop(0, "rgba(0,240,255,0.05)");
    g.addColorStop(0.5, "rgba(255,61,184,0.04)");
    g.addColorStop(1, "rgba(5,3,12,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 282, VW, TABLE_Y - 282);

    ctx.fillStyle = "#14101f";
    ctx.fillRect(18, 276, VW - 36, 16);
    ctx.strokeStyle = "rgba(0,240,255,0.28)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(22, 276);
    ctx.lineTo(VW - 22, 276);
    ctx.moveTo(22, 291);
    ctx.lineTo(VW - 22, 291);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.2)";
    ctx.beginPath();
    ctx.moveTo(40, 284);
    ctx.lineTo(VW - 40, 284);
    ctx.stroke();
  }

  function drawCurtains() {
    const wiggle = st.windStr * 18;
    function panel(x0, side) {
      const push = side * wiggle * (0.6 + 0.4 * Math.sin(st.clock * 2.4 + side));
      ctx.beginPath();
      ctx.moveTo(x0, 22);
      ctx.bezierCurveTo(x0 + side * 36 + push, 80, x0 + side * 10 - push * 0.4, 160, x0 + side * 42 + push * 0.6, 282);
      ctx.lineTo(x0 + side * 8, 282);
      ctx.lineTo(x0, 22);
      ctx.fillStyle = side < 0 ? "rgba(255,61,184,0.08)" : "rgba(0,240,255,0.07)";
      ctx.fill();
      ctx.strokeStyle = side < 0 ? "rgba(255,61,184,0.28)" : "rgba(0,240,255,0.26)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    panel(34, 1);
    panel(VW - 34, -1);
  }

  function drawTable() {
    const gy = TABLE_Y;
    ctx.fillStyle = "#12081c";
    ctx.fillRect(0, gy, VW, VH - gy);

    const g = ctx.createLinearGradient(0, gy, 0, VH);
    g.addColorStop(0, "rgba(0,240,255,0.07)");
    g.addColorStop(1, "rgba(5,3,12,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, gy, VW, VH - gy);

    ctx.strokeStyle = "rgba(0,240,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, gy + 1);
    ctx.lineTo(VW - 36, gy + 1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, gy + 7);
    ctx.lineTo(VW - 48, gy + 7);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 80; x < VW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, gy + 12);
      ctx.lineTo(x, VH);
      ctx.stroke();
    }

    const pool = 34 + st.hp * 0.12;
    const pg = ctx.createRadialGradient(CX, gy + 10, 4, CX, gy + 10, pool);
    pg.addColorStop(0, st.hp < WARN_HP ? "rgba(255,61,184,0.28)" : "rgba(255,227,107,0.32)");
    pg.addColorStop(1, "rgba(255,227,107,0)");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.ellipse(CX, gy + 10, pool, 9, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(CX, gy + 14, 28, 6, 0, 0, TAU);
    ctx.fill();
  }

  function drawRing() {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.strokeStyle = "rgba(246,243,255,0.1)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, HR, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    const labels = [
      { a: 0, t: "东" },
      { a: Math.PI / 2, t: "南" },
      { a: Math.PI, t: "西" },
      { a: -Math.PI / 2, t: "北" }
    ];
    ctx.font = "11px 'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(139,144,184,0.7)";
    for (let i = 0; i < labels.length; i++) {
      const L = labels[i];
      ctx.fillText(L.t, Math.cos(L.a) * (HR + 18), Math.sin(L.a) * (HR + 18));
    }

    const wad = 0.42 + st.windStr * 0.18;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, HR + 8, st.windAng - wad, st.windAng + wad);
    ctx.closePath();
    const wg = ctx.createRadialGradient(0, 0, 20, 0, 0, HR + 8);
    const wa = 0.04 + st.windStr * 0.12;
    wg.addColorStop(0, "rgba(0,240,255,0)");
    wg.addColorStop(0.55, "rgba(0,240,255," + (wa * 0.35) + ")");
    wg.addColorStop(1, st.shield > 0.55 ? "rgba(0,240,255," + wa + ")" : "rgba(255,61,184," + (wa + 0.06) + ")");
    ctx.fillStyle = wg;
    ctx.fill();

    ctx.strokeStyle = st.shield > 0.55 ? "rgba(0,240,255,0.55)" : "rgba(255,61,184,0.55)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, HR + 6, st.windAng - wad, st.windAng + wad);
    ctx.stroke();

    const chevR = HR + 28 + Math.sin(st.clock * 6) * 6;
    ctx.strokeStyle = st.shield > 0.55 ? "rgba(0,240,255,0.7)" : "rgba(255,61,184,0.75)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let k = -1; k <= 1; k++) {
      const a = st.windAng + k * 0.16;
      const x = Math.cos(a) * chevR;
      const y = Math.sin(a) * chevR;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      const tx = -ny;
      const ty = nx;
      ctx.beginPath();
      ctx.moveTo(x + tx * 7 - nx * 8, y + ty * 7 - ny * 8);
      ctx.lineTo(x - nx * 16, y - ny * 16);
      ctx.lineTo(x - tx * 7 - nx * 8, y - ty * 7 - ny * 8);
      ctx.stroke();
    }

    if (st.guard > 0) {
      ctx.strokeStyle = "rgba(255,227,107,0.75)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, HR - 10, -Math.PI / 2, -Math.PI / 2 + TAU * (st.guard / 100));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGusts() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < gusts.length; i++) {
      const g = gusts[i];
      const a = clamp(g.life / 0.8, 0, 1);
      ctx.strokeStyle = g.hit || g.mag === false
        ? "rgba(0,240,255," + (0.18 + a * 0.45) + ")"
        : (g.mag ? "rgba(255,61,184," + (0.16 + a * 0.5) + ")" : "rgba(0,240,255," + (0.16 + a * 0.5) + ")");
      if (st.shield > 0.55 && !g.mag) ctx.strokeStyle = "rgba(0,240,255," + (0.18 + a * 0.5) + ")";
      ctx.lineWidth = 1.5 + (g.mag ? 0.6 : 0);
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x - g.vx * 0.06, g.y - g.vy * 0.06);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCandle() {
    const baseY = TABLE_Y - 2;
    const topY = CY + 12;
    ctx.save();

    ctx.fillStyle = "#1a1428";
    ctx.beginPath();
    ctx.ellipse(CX, baseY + 2, 24, 6, 0, 0, TAU);
    ctx.fill();

    const body = ctx.createLinearGradient(CX - 16, topY, CX + 16, baseY);
    body.addColorStop(0, "#f6f3ff");
    body.addColorStop(0.42, "#d9d4f0");
    body.addColorStop(1, "#9a90c0");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(CX - 12, baseY);
    ctx.quadraticCurveTo(CX - 15, (baseY + topY) * 0.5, CX - 10, topY);
    ctx.lineTo(CX + 10, topY);
    ctx.quadraticCurveTo(CX + 15, (baseY + topY) * 0.5, CX + 12, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.35)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,227,107,0.2)";
    ctx.beginPath();
    ctx.ellipse(CX, topY, 11, 3.4, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,61,184,0.45)";
    ctx.lineWidth = 1.3;
    const mid = (baseY + topY) * 0.5;
    ctx.beginPath();
    ctx.moveTo(CX - 9, mid + 10);
    ctx.quadraticCurveTo(CX - 16, mid + 28, CX - 8, baseY - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CX + 8, mid - 6);
    ctx.quadraticCurveTo(CX + 15, mid + 18, CX + 9, baseY - 16);
    ctx.stroke();

    for (let i = 0; i < drips.length; i++) {
      const d = drips[i];
      ctx.fillStyle = "rgba(246,243,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 1.6, 2.4, 0, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = "#2a2038";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(CX, topY);
    ctx.lineTo(CX, CY + 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawFlame() {
    if (st.hp <= 0 && st.phase === "die" && st.phaseT > 0.35) {
      ctx.fillStyle = "rgba(80,70,90,0.8)";
      ctx.beginPath();
      ctx.arc(CX, CY - 6, 1.6, 0, TAU);
      ctx.fill();
      return;
    }
    const hp = clamp(st.hp / 100, 0, 1);
    const size = (0.35 + 0.65 * hp) * st.flicker;
    const leanX = Math.cos(st.leanAng) * st.lean * 14;
    const leanY = Math.sin(st.leanAng) * st.lean * 8;
    const fx = CX + leanX;
    const fy = CY + leanY;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glowR = 28 + size * 36;
    const gg = ctx.createRadialGradient(fx, fy, 2, fx, fy, glowR);
    if (hp < 0.28) {
      gg.addColorStop(0, "rgba(255,61,184," + (0.42 * st.flicker) + ")");
      gg.addColorStop(0.4, "rgba(255,61,184,0.12)");
      gg.addColorStop(1, "rgba(255,61,184,0)");
    } else {
      gg.addColorStop(0, "rgba(255,227,107," + (0.5 * st.flicker) + ")");
      gg.addColorStop(0.35, "rgba(255,140,80,0.18)");
      gg.addColorStop(1, "rgba(0,240,255,0)");
    }
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(fx, fy, glowR, 0, TAU);
    ctx.fill();

    ctx.translate(fx, fy);
    ctx.rotate(st.lean * 0.35 * Math.cos(st.leanAng));
    const h = 28 * size + 10;
    const w = 9 * size + 4;

    ctx.fillStyle = hp < 0.28 ? "rgba(255,61,184,0.55)" : "rgba(255,120,60,0.55)";
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-w, -h * 0.15, -w * 0.7, -h * 0.7, 0, -h);
    ctx.bezierCurveTo(w * 0.7, -h * 0.7, w, -h * 0.15, 0, 8);
    ctx.fill();

    ctx.fillStyle = hp < 0.28 ? "rgba(255,180,220,0.7)" : "rgba(255,227,107,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-w * 0.55, -h * 0.1, -w * 0.4, -h * 0.55, 0, -h * 0.72);
    ctx.bezierCurveTo(w * 0.4, -h * 0.55, w * 0.55, -h * 0.1, 0, 4);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.ellipse(0, -2, 2.2 * size + 0.6, 5 * size + 1.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHand() {
    const x = CX + Math.cos(st.hand) * HR;
    const y = CY + Math.sin(st.hand) * HR;
    const blocking = st.shield > 0.55;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(st.hand + Math.PI);

    const glow = ctx.createRadialGradient(0, 8, 2, 0, 8, 36);
    glow.addColorStop(0, blocking ? "rgba(0,240,255,0.28)" : "rgba(255,61,184,0.2)");
    glow.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 8, 36, 0, TAU);
    ctx.fill();

    if (blocking) {
      ctx.strokeStyle = "rgba(0,240,255,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 18, 22, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }

    ctx.fillStyle = blocking ? "rgba(10, 28, 40, 0.82)" : "rgba(28, 10, 24, 0.82)";
    ctx.strokeStyle = blocking ? "#00f0ff" : "#ff3db8";
    ctx.lineWidth = 1.7;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-13, 22);
    ctx.quadraticCurveTo(-16, 8, -11, -2);
    ctx.quadraticCurveTo(-8, -8, -5, -4);
    ctx.quadraticCurveTo(-6, -22, -2.5, -26);
    ctx.quadraticCurveTo(1, -28, 2, -18);
    ctx.quadraticCurveTo(3, -30, 7, -31);
    ctx.quadraticCurveTo(11, -30, 10, -16);
    ctx.quadraticCurveTo(13, -26, 16, -24);
    ctx.quadraticCurveTo(19, -20, 15, -10);
    ctx.quadraticCurveTo(20, -8, 18, 4);
    ctx.quadraticCurveTo(22, 2, 22, 10);
    ctx.quadraticCurveTo(18, 26, 6, 30);
    ctx.quadraticCurveTo(-8, 32, -13, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = blocking ? "rgba(0,240,255,0.35)" : "rgba(255,61,184,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.quadraticCurveTo(-1, 10, 1, 18);
    ctx.moveTo(6, -4);
    ctx.quadraticCurveTo(6, 10, 5, 18);
    ctx.stroke();

    ctx.fillStyle = blocking ? "#00f0ff" : "#ff3db8";
    ctx.beginPath();
    ctx.arc(2, 12, 2.1, 0, TAU);
    ctx.fill();
    ctx.restore();
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
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.fillStyle = "rgba(0,240,255," + clamp(s.life * 4, 0, 0.75) + ")";
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.restore();
    for (let i = 0; i < smoke.length; i++) {
      const s = smoke[i];
      const a = clamp(s.life, 0, 1) * 0.18;
      ctx.fillStyle = "rgba(160,150,180," + a + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawFlash() {
    if (st.flash <= 0) return;
    ctx.fillStyle = "rgba(" + st.flashRgb + "," + (st.flash * 0.22) + ")";
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawTitleIdle(dt) {
    st.hand = lerpAng(st.hand, Math.sin(st.clock * 0.55) * 0.9 - 0.2, 0.04);
    const w = windAt((st.clock % 18) + 3);
    st.windAng = w.ang;
    st.windStr = 0.35 + 0.15 * Math.sin(st.clock * 0.8);
    st.shield = shieldOf(st.hand, st.windAng);
    st.hp = 100;
    st.flicker = 0.85 + 0.15 * Math.sin(st.clock * 11);
    st.lean = lerp(st.lean, (1 - st.shield) * 0.35, 0.08);
    st.leanAng = lerpAng(st.leanAng, st.windAng + Math.PI, 0.1);
    spawnGustBits(dt, st.windAng, st.windStr, st.shield > 0.5);
    spawnFlameBits(dt);
    stepParticles(dt);
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
      ctx.translate(rand(-st.shake, st.shake), rand(-st.shake, st.shake) * 0.4);
    }

    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    drawSky();
    ctx.save();
    ctx.beginPath();
    drawRoundRect(28, 22, VW - 56, 260, 6);
    ctx.clip();
    drawStars();
    drawMoon();
    drawCity();
    ctx.restore();
    drawWindow();
    drawRoom();
    drawCurtains();
    drawTable();
    drawRing();
    drawGusts();
    drawCandle();
    drawFlame();
    drawHand();
    drawParticles();
    drawFlash();

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
        drawTitleIdle(STEP);
        acc -= STEP;
      }
      draw();
      return;
    }

    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      const ev = stepPhysics(STEP);
      acc -= STEP;
      steps += 1;
      if (ev === "die") SFX.out();
      if (ev === "clear") {
        SFX.hushBeds();
        SFX.win();
      }
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
    }

    SFX.tickBeds(
      clamp(st.hp / 100, 0, 1),
      Math.min(1.6, st.windStr),
      mode === "play" && st.phase === "play"
    );

    hudTick += dt;
    if (hudTick > 0.08) {
      hudTick = 0;
      renderHud();
    }
    draw();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") {
      keys.left = down;
      if (down) e.preventDefault();
    } else if (k === "ArrowRight" || k === "d" || k === "D") {
      keys.right = down;
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (k === "m" || k === "M") {
      setMuted(!SFX.muted);
      SFX.ensure();
    } else if (k === "r" || k === "R") {
      SFX.ensure();
      if (mode === "play" || mode === "win" || mode === "lose") startPlay();
    } else if (k === " " || k === "Enter") {
      e.preventDefault();
      SFX.ensure();
      if (frozen) {
        if (overlayKind === "title" || overlayKind === "win" || overlayKind === "lose") startPlay();
      }
    }
  }

  window.addEventListener("keydown", function (e) { onKey(e, true); });
  window.addEventListener("keyup", function (e) { onKey(e, false); });

  function bindPad(btn, side) {
    const set = function (v) {
      pad[side] = v;
      btn.classList.toggle("held", v);
    };
    btn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      SFX.ensure();
      set(true);
      pointer.id = "pad";
      try { btn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    const up = function (e) {
      e.stopPropagation();
      set(false);
      if (pointer.id === "pad") pointer.id = null;
    };
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", function () { set(false); });
  }
  bindPad(btnLeft, "left");
  bindPad(btnRight, "right");

  function aimFromEvent(e) {
    const w = worldFromEvent(e);
    const dx = w.x - CX;
    const dy = w.y - CY;
    if (dx * dx + dy * dy > 28 * 28) {
      pointer.ang = Math.atan2(dy, dx);
      pointer.valid = true;
    }
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (frozen) return;
    SFX.ensure();
    pointer.down = true;
    pointer.id = e.pointerId;
    aimFromEvent(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    aimFromEvent(e);
  });
  function pointerUp(e) {
    if (pointer.id !== e.pointerId) return;
    pointer.down = false;
    pointer.id = null;
    pointer.valid = false;
  }
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  ovBtn.addEventListener("click", function () {
    SFX.ensure();
    startPlay();
  });
  btnRetry.addEventListener("click", function () {
    SFX.ensure();
    startPlay();
  });
  btnMute.addEventListener("click", function () {
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (paused) {
      keys.left = false;
      keys.right = false;
      SFX.hushBeds();
    }
  });

  window.addEventListener("blur", function () {
    keys.left = false;
    keys.right = false;
    pad.left = false;
    pad.right = false;
    btnLeft.classList.remove("held");
    btnRight.classList.remove("held");
  });

  window.addEventListener("resize", fit);

  loadTitle();
  fit();
  renderHud();
  requestAnimationFrame(frame);
})();
