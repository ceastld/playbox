(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const PIVOT_Y = 454;
  const POLE_LEN = 268;
  const XMIN = 86;
  const XMAX = 874;
  const CART_ACCEL = 780;
  const CART_MAX_V = 440;
  const CART_DRAG = 2.6;
  const G_POLE = 2.08;
  const COUPLE = 0.0054;
  const DAMP = 0.58;
  const FALL = 0.84;
  const WARN = 0.46;
  const DURATION = 42;
  const LIVES = 3;
  const STEP = 1 / 60;
  const LOCK = 0.42;
  const DIE_T = 0.78;
  const WIN_T = 0.86;
  const TAU = Math.PI * 2;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function env(t, t0, t1, atk, rel) {
    if (t < t0 || t > t1) return 0;
    const a = (t - t0) / Math.max(0.001, atk);
    const r = (t1 - t) / Math.max(0.001, rel);
    return Math.min(1, a, r);
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
  const pipsEl = document.getElementById("pips");
  const balWrap = document.getElementById("bal-wrap");
  const balFill = document.getElementById("bal-fill");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };

  const keys = { left: false, right: false };
  const pad = { left: false, right: false };
  const pointer = { down: false, id: null, wx: VW * 0.5 };

  const particles = [];
  const ribbons = [];
  const sparks = [];
  const stars = [];
  const lanterns = [];

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
    x: VW * 0.5,
    vx: 0,
    th: 0,
    w: 0,
    ax: 0,
    t: 0,
    remain: DURATION,
    bal: 0,
    lives: LIVES,
    livesMax: LIVES,
    lock: 0,
    phase: "play",
    phaseT: 0,
    why: "",
    shake: 0,
    flash: 0,
    flashRgb: "0,240,255",
    wind: 0,
    gust: "",
    warned: false,
    taught: false,
    nearT: 0,
    lastWarn: -9,
    lastTick: -9,
    mile: 0,
    clock: 0
  };

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * 320,
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.45 + 0.08,
        p: Math.random() * TAU
      });
    }
  }

  function makeLanterns() {
    lanterns.length = 0;
    const spots = [
      { x: 78, y: 72, mag: true },
      { x: 168, y: 48, mag: false },
      { x: 262, y: 86, mag: true },
      { x: 690, y: 58, mag: false },
      { x: 784, y: 92, mag: true },
      { x: 872, y: 44, mag: false },
      { x: 430, y: 36, mag: false }
    ];
    for (let i = 0; i < spots.length; i++) {
      lanterns.push({
        x: spots[i].x,
        y: spots[i].y,
        mag: spots[i].mag,
        p: i * 0.9,
        s: 0.85 + (i % 3) * 0.12
      });
    }
  }

  makeStars();
  makeLanterns();

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
      f.frequency.value = 900;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.16, "sine", 0.07, 440);
      this.beep(330, 0.22, "triangle", 0.04, 660);
    },
    gust: function () {
      this.ensure();
      this.noise(0.28, 0.08);
      this.beep(180, 0.22, "sine", 0.04, 90);
    },
    warn: function () {
      this.ensure();
      this.beep(240, 0.12, "square", 0.035, 140);
    },
    tick: function () {
      this.ensure();
      this.beep(880, 0.06, "sine", 0.03, 1320);
    },
    mile: function () {
      this.ensure();
      this.beep(520, 0.1, "triangle", 0.05, 780);
    },
    fall: function () {
      this.ensure();
      this.noise(0.22, 0.1);
      this.beep(240, 0.5, "sawtooth", 0.08, 50);
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
    tickDrone: function (lean, windAbs, playing) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 64;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const f = 58 + lean * 90 + windAbs * 18;
      this.drone.frequency.setTargetAtTime(f, t, 0.1);
      const vol = playing ? 0.018 + lean * 0.04 + windAbs * 0.012 : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.12);
    },
    hushDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.18);
    }
  };

  try {
    if (localStorage.getItem("pole-balance-mute") === "1") SFX.muted = true;
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
      localStorage.setItem("pole-balance-mute", m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 110) particles.shift();
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

  function burstLantern(x, y, kind) {
    emit(22, {
      x: x,
      y: y,
      j: 8,
      vx0: -90,
      vx1: 90,
      vy0: -140,
      vy1: 40,
      life: 0.7,
      r0: 1.4,
      r1: 4.2,
      kind: kind
    });
  }

  function tipPos() {
    return {
      x: st.x + Math.sin(st.th) * POLE_LEN,
      y: PIVOT_Y - Math.cos(st.th) * POLE_LEN
    };
  }

  function windAt(t) {
    let w = 0.11 * Math.sin(t * 1.37) + 0.06 * Math.sin(t * 2.83 + 0.7);
    w += 1.38 * env(t, 8.0, 11.1, 0.45, 0.5);
    w += -1.52 * env(t, 13.4, 16.7, 0.4, 0.55);
    w += 1.72 * Math.sin((t - 19.2) * 2.15) * env(t, 19.2, 24.4, 0.5, 0.55);
    w += (1.15 * Math.sin(t * 2.05) + 0.78 * Math.sin(t * 3.35 + 1.1) + 0.28 * Math.sin(t * 6.1)) *
      env(t, 26.0, 32.4, 0.55, 0.6);
    w += (1.55 * Math.sin(t * 1.72) + 0.48 * Math.sin(t * 4.15 + 0.4)) * env(t, 33.6, 40.6, 0.5, 0.7);
    return w;
  }

  function gustName(t) {
    if (t >= 8.0 && t < 11.1) return "east";
    if (t >= 13.4 && t < 16.7) return "west";
    if (t >= 19.2 && t < 24.4) return "swing";
    if (t >= 26.0 && t < 32.4) return "chaos";
    if (t >= 33.6 && t < 40.6) return "final";
    return "";
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.7;
  }

  function renderHud() {
    if (mode === "title") {
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
      balFill.style.width = "0%";
      balWrap.classList.remove("warn");
    } else {
      const t = Math.max(0, st.remain);
      timeLabel.textContent = t.toFixed(1);
      const danger = Math.abs(st.th) > WARN && (mode === "play" || st.phase === "play");
      timeLabel.classList.toggle("warn", (t < 6.5 && mode === "play") || danger);
      balFill.style.width = clamp(st.bal, 0, 100).toFixed(1) + "%";
      balWrap.classList.toggle("warn", danger);
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
      ovKicker.textContent = "POLE";
      ovTitle.textContent = "长竿";
      ovLead.innerHTML = "左右微调掌心，别让长竿倒下。<br />倒向哪边，掌心就跟过去。侧风会推灯笼。";
      ovOps.textContent = coarse
        ? "拖屏幕或按左 / 右 · 撑过乱风或加满衡槽 · M 静音"
        : "← → / A D 平移 · 拖屏幕跟掌心 · M 静音";
      ovBtn.textContent = "起竿";
    } else if (kind === "lose") {
      ovKicker.textContent = "FALLEN";
      ovTitle.textContent = "竿已倾";
      ovLead.textContent = "灯笼灭了。衡 " + Math.floor(st.bal) + " · 撑了 " +
        (DURATION - Math.max(0, st.remain)).toFixed(1) + " 秒。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再扶一次";
    } else if (kind === "win") {
      ovKicker.textContent = "STILL";
      ovTitle.textContent = st.why === "bal" ? "衡满" : "风停竿立";
      ovLead.textContent = st.why === "bal"
        ? "灯芯一直在正中。衡槽加满，长竿没有倒。"
        : "乱风过了，掌心还在灯下。竿没有倒。";
      ovOps.textContent = "衡 " + Math.floor(st.bal) + " · 剩余 " + Math.max(0, st.remain).toFixed(1) + " 秒";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
    overlayKind = "none";
    panel.classList.remove("win", "lose");
  }

  function resetPole(keepLives) {
    st.x = VW * 0.5 + rand(-18, 18);
    st.vx = 0;
    st.th = rand(-0.038, 0.038);
    st.w = rand(-0.05, 0.05);
    st.ax = 0;
    st.lock = keepLives ? 0.58 : LOCK;
    st.phase = "play";
    st.phaseT = 0;
    st.shake = 0;
    st.flash = 0.28;
    st.flashRgb = "0,240,255";
    st.warned = false;
    st.nearT = 0;
    if (!keepLives) {
      st.t = 0;
      st.remain = DURATION;
      st.bal = 0;
      st.lives = LIVES;
      st.livesMax = LIVES;
      st.why = "";
      st.gust = "";
      st.taught = false;
      st.lastWarn = -9;
      st.lastTick = -9;
      st.mile = 0;
    }
    particles.length = 0;
    ribbons.length = 0;
    sparks.length = 0;
  }

  function loadTitle() {
    mode = "title";
    resetPole(false);
    st.th = 0.18;
    st.x = VW * 0.5;
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "倒向哪边，掌心就跟过去 · 拖屏幕或按左 / 右"
      : "倒向哪边，掌心就跟过去 · ← → 平移 · 侧风会推竿";
  }

  function startPlay() {
    runGen += 1;
    SFX.start();
    mode = "play";
    acc = 0;
    pointer.down = false;
    pointer.id = null;
    resetPole(false);
    hideOverlay();
    renderHud();
    showToast("掌心微调 · 倒哪边跟哪边");
    hintEl.textContent = coarse
      ? "倒向哪边就跟过去 · 左 / 右或拖屏幕"
      : "倒向哪边就跟过去 · ← → / A D · M 静音";
  }

  function gatherForce() {
    let f = 0;
    if (keys.left || pad.left) f -= 1;
    if (keys.right || pad.right) f += 1;
    return f;
  }

  function spawnRibbons(dt, wind) {
    const rate = 8 + Math.abs(wind) * 22;
    if (Math.random() > rate * dt) return;
    const dir = wind === 0 ? (Math.random() < 0.5 ? -1 : 1) : (wind > 0 ? 1 : -1);
    ribbons.push({
      x: dir > 0 ? rand(-40, 120) : rand(VW - 120, VW + 40),
      y: rand(70, 360),
      vx: dir * rand(140, 280) * (0.65 + Math.abs(wind) * 0.4),
      len: rand(28, 64),
      a: rand(0.08, 0.28),
      mag: Math.abs(wind) > 0.8,
      life: rand(0.7, 1.4)
    });
    if (ribbons.length > 48) ribbons.shift();
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
      p.vy += 80 * dt;
      p.vx *= 0.99;
    }
    for (let i = ribbons.length - 1; i >= 0; i--) {
      const r = ribbons[i];
      r.life -= dt;
      r.x += r.vx * dt;
      r.y += Math.sin(st.clock * 3 + r.y) * 12 * dt;
      if (r.life <= 0 || r.x < -80 || r.x > VW + 80) ribbons.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) sparks.splice(i, 1);
    }
  }

  function stepPhysics(dt) {
    if (st.phase !== "play") {
      st.phaseT += dt;
      if (st.phase === "die") {
        st.w += (G_POLE * 2.4) * Math.sin(st.th) * dt;
        st.th += st.w * dt;
        st.th = clamp(st.th, -1.22, 1.22);
        st.vx *= Math.exp(-3 * dt);
        st.x = clamp(st.x + st.vx * dt, XMIN, XMAX);
        const tip = tipPos();
        if (Math.random() < 0.55) {
          emit(1, {
            x: tip.x,
            y: tip.y,
            j: 4,
            vx0: -40,
            vx1: 40,
            vy0: -30,
            vy1: 50,
            life: 0.4,
            r0: 1,
            r1: 2.6,
            kind: 1
          });
        }
      } else if (st.phase === "clear") {
        st.th = lerp(st.th, 0, 1 - Math.pow(0.001, dt));
        st.w *= Math.exp(-6 * dt);
        st.vx *= Math.exp(-4 * dt);
        st.x = clamp(st.x + st.vx * dt, XMIN, XMAX);
        const tip = tipPos();
        if (Math.random() < 0.7) {
          emit(1, {
            x: tip.x,
            y: tip.y,
            j: 6,
            vx0: -50,
            vx1: 50,
            vy0: -90,
            vy1: -10,
            life: 0.55,
            r0: 1.2,
            r1: 3.2,
            kind: 2
          });
        }
      }
      st.shake = Math.max(0, st.shake - dt * 16);
      st.flash = Math.max(0, st.flash - dt);
      return null;
    }

    st.t += dt;
    st.remain = Math.max(0, DURATION - st.t);
    st.lock = Math.max(0, st.lock - dt);
    st.shake = Math.max(0, st.shake - dt * 18);
    st.flash = Math.max(0, st.flash - dt);

    const wind = windAt(st.t);
    st.wind = wind;
    const gname = gustName(st.t);
    if (gname && gname !== st.gust) {
      st.gust = gname;
      SFX.gust();
      if (gname === "east") showToast("东风 · 竿往右倒", true);
      else if (gname === "west") showToast("西风 · 竿往左倒", true);
      else if (gname === "swing") showToast("回风 · 来回推");
      else if (gname === "chaos") showToast("乱风", true);
      else if (gname === "final") showToast("终式 · 再撑一会");
    } else if (!gname) {
      st.gust = "";
    }

    spawnRibbons(dt, wind);

    let ax = 0;
    const force = st.lock > 0 ? 0 : gatherForce();
    const usingKeys = force !== 0;
    if (usingKeys) {
      ax = force * CART_ACCEL;
    } else if (st.lock <= 0 && pointer.down && pointer.id !== "pad") {
      const dx = pointer.wx - st.x;
      ax = dx * 7.2 - st.vx * 5.0;
      ax = clamp(ax, -CART_ACCEL, CART_ACCEL);
    } else {
      ax = -st.vx * 1.8;
    }

    if ((st.x <= XMIN && ax < 0) || (st.x >= XMAX && ax > 0)) ax = 0;

    st.vx += ax * dt;
    st.vx *= Math.exp(-CART_DRAG * dt);
    st.vx = clamp(st.vx, -CART_MAX_V, CART_MAX_V);

    let impact = 0;
    st.x += st.vx * dt;
    if (st.x < XMIN) {
      if (st.vx < -40) {
        impact = (-st.vx) / Math.max(dt, STEP) * 0.28;
        st.shake = Math.min(11, st.shake + Math.abs(st.vx) * 0.018);
      }
      st.x = XMIN;
      st.vx = 0;
    } else if (st.x > XMAX) {
      if (st.vx > 40) {
        impact = -st.vx / Math.max(dt, STEP) * 0.28;
        st.shake = Math.min(11, st.shake + Math.abs(st.vx) * 0.018);
      }
      st.x = XMAX;
      st.vx = 0;
    }

    const effAx = ax + impact;
    st.ax = effAx;

    const grav = G_POLE * Math.sin(st.th);
    const inert = -COUPLE * effAx * Math.cos(st.th);
    st.w += (grav + inert + wind) * dt;
    st.w *= Math.exp(-DAMP * dt);
    st.th += st.w * dt;

    if (Math.abs(st.vx) > 80 && Math.random() < 0.35) {
      sparks.push({
        x: st.x + rand(-18, 18),
        y: PIVOT_Y + 10,
        vx: -st.vx * 0.12 + rand(-20, 20),
        vy: rand(-40, -8),
        life: rand(0.15, 0.32)
      });
      if (sparks.length > 28) sparks.shift();
    }

    const absTh = Math.abs(st.th);
    if (absTh < 0.12) st.bal += 7.4 * dt;
    else if (absTh < 0.22) st.bal += 4.6 * dt;
    else if (absTh < 0.32) st.bal += 1.6 * dt;
    else if (absTh > 0.58) st.bal -= 3.5 * dt;
    st.bal = clamp(st.bal, 0, 100);

    if (absTh < 0.16) {
      st.nearT += dt;
      if (st.t - st.lastTick > 1.15) {
        st.lastTick = st.t;
        SFX.tick();
      }
    } else {
      st.nearT = 0;
    }

    const mile = Math.floor(st.bal / 25);
    if (mile > st.mile && mile < 4 && mile > 0) {
      st.mile = mile;
      SFX.mile();
      showToast("衡 " + mile * 25);
      const tip = tipPos();
      emit(8, {
        x: tip.x,
        y: tip.y,
        j: 6,
        vx0: -40,
        vx1: 40,
        vy0: -80,
        vy1: -10,
        life: 0.45,
        r0: 1.4,
        r1: 3,
        kind: 2
      });
    }

    if (absTh > WARN) {
      if (!st.warned) {
        st.warned = true;
        showToast("要倒 · 跟过去", true);
      }
      if (st.t - st.lastWarn > 0.85) {
        st.lastWarn = st.t;
        SFX.warn();
      }
    } else if (absTh < WARN * 0.72) {
      st.warned = false;
    }

    if (!st.taught && st.t > 2.4 && absTh > 0.2) {
      st.taught = true;
      showToast(st.th > 0 ? "往右跟" : "往左跟");
    }

    const tip = tipPos();
    if (Math.random() < 0.35 + (1 - absTh / FALL) * 0.25) {
      emit(1, {
        x: tip.x + rand(-3, 3),
        y: tip.y - 10,
        j: 2,
        vx0: wind * 18 - 8,
        vx1: wind * 18 + 8,
        vy0: -28,
        vy1: -6,
        life: 0.38,
        r0: 0.8,
        r1: 2.1,
        kind: absTh > WARN ? 1 : 2
      });
    }

    if (st.bal >= 100) {
      st.bal = 100;
      st.why = "bal";
      st.phase = "clear";
      st.phaseT = 0;
      st.flash = 0.55;
      st.flashRgb = "0,240,255";
      burstLantern(tip.x, tip.y, 2);
      return "clear";
    }
    if (st.remain <= 0 && absTh < FALL) {
      st.remain = 0;
      st.why = "time";
      st.phase = "clear";
      st.phaseT = 0;
      st.flash = 0.55;
      st.flashRgb = "0,240,255";
      burstLantern(tip.x, tip.y, 2);
      return "clear";
    }
    if (absTh > FALL) {
      st.why = "fall";
      st.phase = "die";
      st.phaseT = 0;
      st.flash = 0.5;
      st.flashRgb = "255,61,184";
      st.shake = 9;
      burstLantern(tip.x, tip.y, 1);
      return "die";
    }
    return null;
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
    const keepBal = st.bal;
    const keepT = st.t;
    const keepRemain = st.remain;
    const keepLives = st.lives;
    resetPole(true);
    st.lives = keepLives;
    st.bal = keepBal;
    st.t = keepT;
    st.remain = keepRemain;
    st.mile = Math.floor(st.bal / 25);
    showToast("还剩 " + st.lives + " 命 · 重新起竿", true);
    renderHud();
  }

  function onClearDone() {
    mode = "win";
    SFX.hushDrone();
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
    const x = e.clientX - rect.left;
    return (x - view.ox) / view.scale;
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

  function leanTint(absTh) {
    const u = clamp(absTh / FALL, 0, 1);
    const r = mix(0, 255, u);
    const g = mix(240, 61, u);
    const b = mix(255, 184, u);
    return { r: r, g: g, b: b, u: u };
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#090616");
    g.addColorStop(0.45, "#070412");
    g.addColorStop(0.78, "#0a0718");
    g.addColorStop(1, "#12081c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const mag = ctx.createRadialGradient(120, -20, 10, 120, -20, 340);
    mag.addColorStop(0, "rgba(255,61,184,0.16)");
    mag.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, VW, VH);

    const cyan = ctx.createRadialGradient(840, 40, 8, 840, 40, 300);
    cyan.addColorStop(0, "rgba(0,240,255,0.1)");
    cyan.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = cyan;
    ctx.fillRect(0, 0, VW, VH);
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
    const mx = 798;
    const my = 88;
    const rg = ctx.createRadialGradient(mx, my, 6, mx, my, 52);
    rg.addColorStop(0, "rgba(255,227,107,0.55)");
    rg.addColorStop(0.45, "rgba(255,227,107,0.12)");
    rg.addColorStop(1, "rgba(255,227,107,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(mx, my, 52, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffe9a0";
    ctx.beginPath();
    ctx.arc(mx, my, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(5,3,12,0.35)";
    ctx.beginPath();
    ctx.arc(mx + 7, my - 2, 14, 0, TAU);
    ctx.fill();
  }

  function drawHanging() {
    for (let i = 0; i < lanterns.length; i++) {
      const L = lanterns[i];
      const swing = Math.sin(st.clock * 1.15 + L.p) * 0.18 + st.wind * 0.04;
      const x = L.x + Math.sin(swing) * 16;
      const y = L.y + 22;
      ctx.strokeStyle = "rgba(246,243,255,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(L.x, L.y - 18);
      ctx.lineTo(x, y - 8);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(swing);
      ctx.fillStyle = L.mag ? "rgba(255,61,184,0.22)" : "rgba(0,240,255,0.18)";
      drawRoundRect(-6 * L.s, -8 * L.s, 12 * L.s, 14 * L.s, 2);
      ctx.fill();
      ctx.strokeStyle = L.mag ? "rgba(255,61,184,0.7)" : "rgba(0,240,255,0.7)";
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,227,107,0.75)";
      ctx.beginPath();
      ctx.arc(0, -1, 1.6 * L.s, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawGround() {
    const gy = 472;
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

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(st.x, gy + 16, 46 + Math.abs(st.vx) * 0.04, 7, 0, 0, TAU);
    ctx.fill();
  }

  function drawFan() {
    const px = st.x;
    const py = PIVOT_Y;
    ctx.save();
    ctx.translate(px, py);
    const tint = leanTint(Math.abs(st.th));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, POLE_LEN + 8, -Math.PI / 2 - FALL, -Math.PI / 2 + FALL, false);
    ctx.closePath();
    const grd = ctx.createRadialGradient(0, 0, 20, 0, 0, POLE_LEN + 8);
    grd.addColorStop(0, "rgba(0,240,255,0.03)");
    grd.addColorStop(0.7, "rgba(" + (tint.r | 0) + "," + (tint.g | 0) + "," + (tint.b | 0) + ",0.05)");
    grd.addColorStop(1, "rgba(255,61,184,0.07)");
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.strokeStyle = "rgba(0,240,255,0.18)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, POLE_LEN + 6, -Math.PI / 2 - FALL, -Math.PI / 2 + FALL);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.45)";
    ctx.beginPath();
    ctx.arc(0, 0, POLE_LEN + 6, -Math.PI / 2 - FALL, -Math.PI / 2 - FALL + 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, POLE_LEN + 6, -Math.PI / 2 + FALL - 0.08, -Math.PI / 2 + FALL);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -POLE_LEN);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawRibbons() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < ribbons.length; i++) {
      const r = ribbons[i];
      const a = r.a * clamp(r.life, 0, 1);
      ctx.strokeStyle = r.mag
        ? "rgba(255,61,184," + a + ")"
        : "rgba(0,240,255," + a + ")";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.vx * 0.08, r.y + Math.sin(r.x * 0.04) * 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPole() {
    const px = st.x;
    const py = PIVOT_Y;
    const tx = px + Math.sin(st.th) * POLE_LEN;
    const ty = py - Math.cos(st.th) * POLE_LEN;
    const nx = Math.cos(st.th);
    const ny = Math.sin(st.th);
    const tint = leanTint(Math.abs(st.th));
    const glow = "rgba(" + (tint.r | 0) + "," + (tint.g | 0) + "," + (tint.b | 0) + ",";

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = glow + "0.22)";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px + nx * 3.2, py + ny * 3.2);
    ctx.lineTo(tx + nx * 1.4, ty + ny * 1.4);
    ctx.lineTo(tx - nx * 1.4, ty - ny * 1.4);
    ctx.lineTo(px - nx * 3.2, py - ny * 3.2);
    ctx.closePath();
    const sg = ctx.createLinearGradient(px, py, tx, ty);
    sg.addColorStop(0, "#7af6ff");
    sg.addColorStop(0.55, "#f6f3ff");
    sg.addColorStop(1, tint.u > 0.55 ? "#ff3db8" : "#ffe36b");
    ctx.fillStyle = sg;
    ctx.fill();

    ctx.strokeStyle = glow + "0.85)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();

    return { x: tx, y: ty };
  }

  function drawLantern(tip) {
    const absTh = Math.abs(st.th);
    const windLean = clamp(st.wind * 0.12, -0.35, 0.35);
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(st.th * 0.35 + windLean);

    const pulse = 0.7 + Math.sin(st.clock * 6.2) * 0.3;
    const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
    if (absTh > WARN) {
      rg.addColorStop(0, "rgba(255,61,184," + (0.4 * pulse) + ")");
      rg.addColorStop(1, "rgba(255,61,184,0)");
    } else {
      rg.addColorStop(0, "rgba(255,227,107," + (0.38 * pulse) + ")");
      rg.addColorStop(1, "rgba(0,240,255,0)");
    }
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 80, 170, 0.18)";
    drawRoundRect(-13, -16, 26, 30, 5);
    ctx.fill();
    ctx.strokeStyle = absTh > WARN ? "#ff3db8" : "#00f0ff";
    ctx.lineWidth = 1.8;
    drawRoundRect(-13, -16, 26, 30, 5);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,227,107,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.lineTo(9, -4);
    ctx.moveTo(-9, 6);
    ctx.lineTo(9, 6);
    ctx.stroke();

    ctx.fillStyle = "#ffe36b";
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(-4, -8, 0, -12);
    ctx.quadraticCurveTo(4, -8, 0, 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,61,184,0.7)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.quadraticCurveTo(6 + windLean * 10, 22, 0, 30);
    ctx.stroke();
    ctx.fillStyle = "#ff3db8";
    ctx.beginPath();
    ctx.arc(0, 31, 2.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawCart() {
    const x = st.x;
    const y = PIVOT_Y;
    const squash = 1 + Math.min(0.08, Math.abs(st.vx) * 0.00018);
    ctx.save();
    ctx.translate(x, y + 8);
    ctx.scale(squash, 1 / squash);

    ctx.fillStyle = "rgba(0,240,255,0.1)";
    drawRoundRect(-52, -10, 104, 22, 10);
    ctx.fill();

    ctx.fillStyle = "#161022";
    drawRoundRect(-46, -8, 92, 18, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.85)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,61,184,0.35)";
    drawRoundRect(-14, -16, 28, 12, 6);
    ctx.fill();
    ctx.strokeStyle = "#ff3db8";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.arc(0, -12, 3.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(246,243,255,0.55)";
    ctx.beginPath();
    ctx.arc(-28, 6, 3.4, 0, TAU);
    ctx.arc(28, 6, 3.4, 0, TAU);
    ctx.fill();

    if (Math.abs(st.ax) > 120) {
      ctx.strokeStyle = st.ax > 0 ? "rgba(0,240,255,0.45)" : "rgba(255,61,184,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const dir = st.ax > 0 ? 1 : -1;
      ctx.moveTo(dir * 54, 0);
      ctx.lineTo(dir * 70, -4);
      ctx.moveTo(dir * 54, 0);
      ctx.lineTo(dir * 70, 4);
      ctx.stroke();
    }
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
      ctx.fillStyle = "rgba(0,240,255," + clamp(s.life * 4, 0, 0.7) + ")";
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.restore();
  }

  function drawFlash() {
    if (st.flash <= 0) return;
    ctx.fillStyle = "rgba(" + st.flashRgb + "," + (st.flash * 0.22) + ")";
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawTitleSway(dt) {
    const sway = Math.sin(st.clock * 0.72) * 0.2;
    st.th = sway;
    st.w = Math.cos(st.clock * 0.72) * 0.2 * 0.72;
    st.x = lerp(st.x, VW * 0.5 + Math.sin(st.clock * 0.72) * 70, 0.08);
    st.vx = (VW * 0.5 + Math.sin(st.clock * 0.72) * 70 - st.x) * 8;
    st.wind = 0.35 * Math.sin(st.clock * 0.9);
    spawnRibbons(dt, st.wind);
    stepParticles(dt);
    const tip = tipPos();
    if (Math.random() < 0.4) {
      emit(1, {
        x: tip.x,
        y: tip.y - 10,
        j: 2,
        vx0: -10,
        vx1: 10,
        vy0: -24,
        vy1: -4,
        life: 0.4,
        r0: 0.8,
        r1: 2,
        kind: 2
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
      ctx.translate(rand(-st.shake, st.shake), rand(-st.shake, st.shake) * 0.4);
    }

    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    drawSky();
    drawStars();
    drawMoon();
    drawHanging();
    drawGround();
    drawFan();
    drawRibbons();
    const tip = drawPole();
    drawCart();
    drawLantern(tip);
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
        drawTitleSway(STEP);
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
      if (ev === "die") SFX.fall();
      if (ev === "clear") {
        SFX.hushDrone();
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

    const lean = clamp(Math.abs(st.th) / FALL, 0, 1);
    SFX.tickDrone(lean, Math.min(1, Math.abs(st.wind) / 2), mode === "play" && st.phase === "play");

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

  canvas.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (frozen) return;
    SFX.ensure();
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.wx = clamp(worldFromEvent(e), XMIN, XMAX);
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    pointer.wx = clamp(worldFromEvent(e), XMIN, XMAX);
  });
  function pointerUp(e) {
    if (pointer.id !== e.pointerId) return;
    pointer.down = false;
    pointer.id = null;
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
      SFX.hushDrone();
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
