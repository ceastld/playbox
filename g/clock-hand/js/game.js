(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const LIVES = 3;
  const STEP = 1 / 60;
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const MUTE_KEY = "clock-hand-mute";

  const WAVES = [
    {
      name: "初漏",
      sub: "FIRST",
      hint: "两针都要对上落下的时刻 · 粉时 · 青分",
      toast: "粉是时针，青是分针",
      travel: 3.2,
      gap: 2.42,
      window: 0.38,
      times: [
        { h: 3, m: 0 },
        { h: 9, m: 0 },
        { h: 12, m: 20 },
        { h: 6, m: 10 },
        { h: 4, m: 45 }
      ]
    },
    {
      name: "叠时",
      sub: "TWIN",
      hint: "两针都要动 · 窗口更紧",
      toast: "两针都要动 · 窗口更紧",
      travel: 2.22,
      gap: 1.66,
      window: 0.24,
      times: [
        { h: 1, m: 25 },
        { h: 5, m: 40 },
        { h: 8, m: 15 },
        { h: 10, m: 50 },
        { h: 3, m: 35 },
        { h: 7, m: 5 },
        { h: 11, m: 20 }
      ]
    },
    {
      name: "夜钟",
      sub: "NIGHT",
      hint: "夜钟 · 落得更快，对得更准",
      toast: "夜钟到了 · 盯下一刻",
      travel: 1.58,
      gap: 1.16,
      window: 0.155,
      times: [
        { h: 2, m: 10 },
        { h: 9, m: 46 },
        { h: 6, m: 32 },
        { h: 11, m: 8 },
        { h: 4, m: 22 },
        { h: 8, m: 41 },
        { h: 1, m: 53 },
        { h: 5, m: 17 }
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
  const btnHCcw = document.getElementById("btn-h-ccw");
  const btnHCw = document.getElementById("btn-h-cw");
  const btnMCcw = document.getElementById("btn-m-ccw");
  const btnMCw = document.getElementById("btn-m-cw");
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
    tokR: 28
  };

  const hour = { th: 0 };
  const minute = { th: 0 };

  const keys = { hccw: false, hcw: false, mccw: false, mcw: false };
  const pad = { hccw: false, hcw: false, mccw: false, mcw: false };
  const ptrs = [];

  const motes = [];
  const particles = [];
  const sparks = [];
  const ripples = [];
  const floats = [];
  const tokens = [];

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
    hHeld: 0,
    mHeld: 0,
    aimH: null,
    aimM: null,
    shake: 0,
    flash: 0,
    flashCol: PINK,
    toastT: 0,
    taught: false,
    judge: "",
    judgeT: 0,
    judgeCol: CYAN,
    endT: 0,
    heat: 0,
    tickAcc: 0,
    hubSpin: 0,
    demoT: 0,
    demoP: 0,
    demoFlash: false,
    demoTok: null
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
  function clockAng(th) {
    return th - Math.PI / 2;
  }
  function angFromPoint(x, y) {
    return wrap(Math.atan2(y - L.cy, x - L.cx) + Math.PI / 2);
  }
  function angDelta(aim, cur) {
    let d = wrap(aim - cur);
    if (d > Math.PI) d -= TAU;
    return d;
  }
  function angDist(a, b) {
    return Math.abs(angDelta(a, b));
  }
  function chase(cur, aim, dt, spd) {
    const d = angDelta(aim, cur);
    const max = spd * dt;
    if (Math.abs(d) <= max) return wrap(aim);
    return wrap(cur + (d < 0 ? -max : max));
  }
  function hourAngle(h, m) {
    return wrap(((h % 12) / 12) * TAU + (m / 60) * (TAU / 12));
  }
  function minuteAngle(m) {
    return wrap((m / 60) * TAU);
  }
  function fmtTime(h, m) {
    return h + ":" + (m < 10 ? "0" : "") + m;
  }
  function keyRate(held) {
    return lerp(2.2, 3.55, clamp(held / 0.42, 0, 1));
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
    tick() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastTick < 0.85) return;
      this.lastTick = now;
      this.beep(980, 0.03, "square", 0.02, 420);
      this.beep(196, 0.05, "sine", 0.018);
    },
    near() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.28) return;
      this.lastNear = now;
      this.beep(1180, 0.06, "sine", 0.04, 1680);
    },
    hit(perfect) {
      this.ensure();
      this.beep(perfect ? 784 : 523, 0.12, "triangle", 0.09, perfect ? 1568 : 1046);
      this.beep(perfect ? 1174 : 659, 0.22, "sine", perfect ? 0.07 : 0.05);
      if (perfect) this.beep(1568, 0.32, "sine", 0.045, 2093);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.32, "sawtooth", 0.08, 55);
      this.noise(0.16, 0.07, 520);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.14, "triangle", 0.07, 784);
      this.beep(784, 0.24, "sine", 0.05, 1176);
    },
    win() {
      this.ensure();
      this.beep(523, 0.16, "sine", 0.08, 784);
      this.beep(659, 0.28, "triangle", 0.07, 988);
      this.beep(784, 0.42, "sine", 0.06, 1174);
      this.beep(1046, 0.55, "sine", 0.045, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.55, "sawtooth", 0.09, 48);
      this.beep(82, 0.78, "square", 0.05, 36);
    },
    start() {
      this.ensure();
      this.beep(220, 0.16, "sine", 0.07, 523);
      this.beep(330, 0.22, "triangle", 0.05, 660);
    },
    tickDrone(heat) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 55;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const playing = G.mode === "play" || G.mode === "clear";
      this.drone.frequency.setTargetAtTime(55 + heat * 42, t, 0.12);
      this.droneGain.gain.setTargetAtTime(
        playing ? 0.014 + heat * 0.036 : 0.0001,
        t,
        0.14
      );
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.32 + 0.04,
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
    G.judgeT = 0.7;
  }

  function burst(x, y, col, n) {
    emit(n, {
      x: x,
      y: y,
      j: 10,
      vx0: -160,
      vx1: 160,
      vy0: -180,
      vy1: 70,
      life: 0.58,
      r0: 1.2,
      r1: 3.6,
      col: col
    });
    spark(x, y, 10, col);
    ripple(x, y, col, L.R * 0.62);
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function usedGrab(which) {
    for (let i = 0; i < ptrs.length; i++) {
      if (ptrs[i].grab === which) return true;
    }
    return false;
  }

  function pickGrab(x, y) {
    const dist = hypot(x - L.cx, y - L.cy);
    const ha = clockAng(hour.th);
    const ma = clockAng(minute.th);
    const hx = L.cx + Math.cos(ha) * L.R * 0.52;
    const hy = L.cy + Math.sin(ha) * L.R * 0.52;
    const mx = L.cx + Math.cos(ma) * L.R * 0.78;
    const my = L.cy + Math.sin(ma) * L.R * 0.78;
    const distH = hypot(x - hx, y - hy);
    const distM = hypot(x - mx, y - my);
    let grab;
    if (distH < distM * 0.78) grab = "h";
    else if (distM < distH * 0.78) grab = "m";
    else grab = dist < L.R * 0.5 ? "h" : "m";
    if (usedGrab(grab)) grab = grab === "h" ? "m" : "h";
    return grab;
  }

  function ptrById(id) {
    for (let i = 0; i < ptrs.length; i++) {
      if (ptrs[i].id === id) return ptrs[i];
    }
    return null;
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

    const bottomPad = coarse ? 64 : 16;
    L.R = clamp(Math.min(W * 0.36, (H - bottomPad) * 0.34), 86, 196);
    L.cx = W * 0.5;
    L.cy = (H - bottomPad) * (coarse ? 0.54 : 0.58);
    if (L.cy + L.R > H - bottomPad - 6) L.cy = H - bottomPad - 6 - L.R;
    if (L.cy - L.R < 40) L.R = Math.max(70, L.cy - 40);
    L.tokR = clamp(L.R * 0.17, 22, 36);
  }

  function syncHud() {
    if (G.mode === "title") {
      stageLabel.textContent = "对针时刻";
      hitLabel.textContent = "对 —";
      hitLabel.classList.remove("warn", "hot");
      hintEl.textContent = coarse
        ? "两针都要对上掉落的时刻 · 拖钟面或按底栏"
        : "两针都要对上掉落的时刻 · 粉时 · 青分";
    } else {
      const w = WAVES[G.wave];
      stageLabel.textContent = w.name + " · " + w.sub;
      const combo = G.combo >= 2 ? "  · " + G.combo + "连" : "";
      hitLabel.textContent = "对 " + G.hits + "/" + w.times.length + combo;
      hitLabel.classList.toggle("warn", G.lives <= 1 && G.mode === "play");
      hitLabel.classList.toggle("hot", G.combo >= 4);
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
      ovKicker.textContent = "CLOCK";
      ovTitle.textContent = "对针";
      ovLead.innerHTML = "粉时针、青分针。<br />时刻落到钟心时，两根针都要对上。";
      ovOps.textContent = coarse
        ? "拖内环转时针、外环转分针 · 底栏时分键 · M 静音"
        : "A/D 转时针 · J/L 转分针 · 拖内环/外环 · M 静音";
      ovBtn.textContent = "上弦";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "钟准";
      ovLead.textContent = "三漏走完。时辰归位。";
      ovOps.textContent =
        "对准 " + G.total + " · 完美 " + G.perfects + " · 最高连击 " + G.maxCombo;
      ovBtn.textContent = "再上一弦";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "错时";
      ovLead.textContent = "相位耗尽。时辰溜走了。";
      ovOps.textContent = "已对 " + G.total + " · 第 " + (G.wave + 1) + " 漏";
      ovBtn.textContent = "再上一弦";
    }
  }

  function hidePanel() {
    overlay.classList.add("hidden");
  }

  function spawnWave(wave) {
    tokens.length = 0;
    let t = 0.92;
    for (let i = 0; i < wave.times.length; i++) {
      const tm = wave.times[i];
      tokens.push({
        h: tm.h,
        m: tm.m,
        hAng: hourAngle(tm.h, tm.m),
        mAng: minuteAngle(tm.m),
        due: t,
        state: "wait",
        p: 0,
        fade: 1,
        x: L.cx,
        y: 0,
        spawnX: L.cx,
        near: false,
        judged: false
      });
      t += wave.gap;
    }
  }

  function nearestFly() {
    let best = null;
    let bestP = -1;
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.state !== "fly") continue;
      if (tok.p > bestP) {
        bestP = tok.p;
        best = tok;
      }
    }
    return best;
  }

  function waveResolved() {
    for (let i = 0; i < tokens.length; i++) {
      if (!tokens[i].judged) return false;
    }
    return tokens.length > 0;
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
    G.hHeld = 0;
    G.mHeld = 0;
    G.shake = 0;
    G.flash = 0;
    G.judgeT = 0;
    G.endT = 0;
    G.taught = false;
    G.tickAcc = 0;
    hour.th = 0;
    minute.th = 0;
    particles.length = 0;
    sparks.length = 0;
    ripples.length = 0;
    floats.length = 0;
    makeMotes();
    spawnWave(WAVES[0]);
    syncHud();
  }

  function beginWave(i) {
    G.wave = i;
    G.t = 0;
    G.hits = 0;
    G.tickAcc = 0;
    spawnWave(WAVES[i]);
    toast(WAVES[i].toast, i >= 2);
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
    if (G.mode !== "play") return;
    G.mode = "clear";
    G.endT = 0.95;
    audio.wave();
    G.flash = 0.42;
    G.flashCol = CYAN;
    toast(WAVES[G.wave].name + " 对准", false);
    ripple(L.cx, L.cy, CYAN, L.R * 1.1);
  }

  function startWin() {
    G.mode = "win";
    audio.win();
    showPanel("win");
    syncHud();
  }

  function startLose() {
    G.mode = "tolose";
    G.endT = 0.68;
    audio.lose();
    G.flash = 0.55;
    G.flashCol = PINK;
    G.shake = 11;
  }

  function resolveToken(tok) {
    if (tok.judged) return;
    tok.judged = true;
    const w = WAVES[G.wave];
    const hErr = angDist(hour.th, tok.hAng);
    const mErr = angDist(minute.th, tok.mAng);
    const hOk = hErr <= w.window;
    const mOk = mErr <= w.window;
    const perf = hErr <= w.window * 0.42 && mErr <= w.window * 0.42;

    if (hOk && mOk) {
      tok.state = "caught";
      tok.fade = 1;
      G.hits += 1;
      G.total += 1;
      G.combo += 1;
      if (G.combo > G.maxCombo) G.maxCombo = G.combo;
      if (perf) G.perfects += 1;
      G.flash = perf ? 0.32 : 0.18;
      G.flashCol = perf ? GOLD : CYAN;
      audio.hit(perf);
      burst(L.cx, L.cy, perf ? GOLD : CYAN, perf ? 18 : 12);
      const label = perf ? "完美" : G.combo >= 3 ? G.combo + " 连" : "对准";
      floatAt(L.cx, L.cy - L.R * 0.2, label, perf ? GOLD : CYAN);
      judge(label, perf ? GOLD : CYAN);
      if (!G.taught) {
        G.taught = true;
        toast("对准了 · 看下一刻", false);
      }
    } else {
      tok.state = "miss";
      tok.fade = 1;
      G.combo = 0;
      G.lives -= 1;
      G.flash = 0.42;
      G.flashCol = PINK;
      G.shake = 8;
      audio.miss();
      burst(tok.x, tok.y, PINK, 14);
      let why = "两针都偏";
      if (hOk && !mOk) why = "分针偏了";
      else if (!hOk && mOk) why = "时针偏了";
      floatAt(L.cx, L.cy - L.R * 0.18, why, PINK);
      judge(why, PINK);
      toast(why, true);
    }
    syncHud();
    if (G.lives <= 0) startLose();
    else if (waveResolved()) startClear();
  }

  function updateHands(dt) {
    G.aimH = null;
    G.aimM = null;
    for (let i = 0; i < ptrs.length; i++) {
      const p = ptrs[i];
      const aim = angFromPoint(p.x, p.y);
      if (p.grab === "h") G.aimH = aim;
      else G.aimM = aim;
    }

    const hDir = (keys.hcw || pad.hcw ? 1 : 0) - (keys.hccw || pad.hccw ? 1 : 0);
    const mDir = (keys.mcw || pad.mcw ? 1 : 0) - (keys.mccw || pad.mccw ? 1 : 0);

    if (G.aimH != null) {
      hour.th = chase(hour.th, G.aimH, dt, 12);
      G.hHeld = 0;
    } else if (hDir !== 0) {
      G.hHeld += dt;
      hour.th = wrap(hour.th + hDir * keyRate(G.hHeld) * dt);
    } else {
      G.hHeld = 0;
    }

    if (G.aimM != null) {
      minute.th = chase(minute.th, G.aimM, dt, 12);
      G.mHeld = 0;
    } else if (mDir !== 0) {
      G.mHeld += dt;
      minute.th = wrap(minute.th + mDir * keyRate(G.mHeld) * dt);
    } else {
      G.mHeld = 0;
    }
  }

  function placeToken(tok, p) {
    const e = ease(p);
    tok.x = lerp(tok.spawnX, L.cx, e);
    tok.y = lerp(12 + L.tokR, L.cy, e);
    tok.p = p;
  }

  function updateTokens(dt) {
    const w = WAVES[G.wave];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.state === "wait") {
        if (G.t >= tok.due) {
          tok.state = "fly";
          tok.spawnX = L.cx + ((i % 2 === 0 ? -1 : 1) * L.R * 0.16);
          placeToken(tok, 0);
        }
        continue;
      }
      if (tok.state === "fly") {
        const age = G.t - tok.due;
        const p = clamp(age / w.travel, 0, 1);
        placeToken(tok, p);
        if (!tok.near && p > 0.42) {
          if (angDist(hour.th, tok.hAng) <= w.window && angDist(minute.th, tok.mAng) <= w.window) {
            tok.near = true;
            audio.near();
          }
        }
        if (p >= 1) resolveToken(tok);
        continue;
      }
      if (tok.state === "caught" || tok.state === "miss") {
        tok.fade -= dt * 2.3;
        if (tok.state === "caught") {
          tok.x = lerp(tok.x, L.cx, 1 - Math.exp(-10 * dt));
          tok.y = lerp(tok.y, L.cy, 1 - Math.exp(-10 * dt));
        } else {
          tok.y += 48 * dt;
        }
      }
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
    if (G.judgeT > 0) G.judgeT -= dt;
    G.hubSpin += dt * (0.35 + G.heat * 1.6);
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

  function heatNow() {
    const tok = G.mode === "title" ? G.demoTok : nearestFly();
    if (!tok) return G.combo >= 4 ? 0.22 : 0.05;
    const w = G.mode === "title" ? WAVES[0] : WAVES[G.wave];
    const hErr = angDist(hour.th, tok.hAng) / w.window;
    const mErr = angDist(minute.th, tok.mAng) / w.window;
    const both = clamp(1 - (hErr + mErr) * 0.5, 0, 1);
    return clamp(both * (0.28 + tok.p * 0.72), 0, 1);
  }

  function updateDemo(dt) {
    G.demoT += dt;
    const travel = 3.35;
    const cycle = travel + 0.7;
    const u = G.demoT % cycle;
    const th = hourAngle(3, 0);
    const tm = minuteAngle(0);
    if (u < 0.08) {
      G.demoFlash = false;
      hour.th = wrap(2.4);
      minute.th = wrap(4.1);
    }
    if (u < travel) {
      hour.th = chase(hour.th, th, dt, 1.7);
      minute.th = chase(minute.th, tm, dt, 2.1);
      G.demoP = u / travel;
    } else {
      G.demoP = 1;
      if (!G.demoFlash) {
        G.demoFlash = true;
        ripple(L.cx, L.cy, GOLD, L.R * 0.85);
        spark(L.cx, L.cy, 10, GOLD);
      }
    }
    const e = ease(clamp(G.demoP, 0, 1));
    G.demoTok = {
      h: 3,
      m: 0,
      hAng: th,
      mAng: tm,
      p: clamp(G.demoP, 0, 1),
      x: lerp(L.cx - L.R * 0.14, L.cx, e),
      y: lerp(14 + L.tokR, L.cy, e),
      state: "fly",
      fade: 1,
      judged: false
    };
  }

  function updatePlay(dt) {
    updateHands(dt);
    if (G.mode === "play" || G.mode === "clear" || G.mode === "tolose") {
      updateTokens(dt);
    }
    if (G.mode === "play") {
      G.tickAcc += dt;
      if (G.tickAcc >= 1) {
        G.tickAcc -= 1;
        audio.tick();
      }
    }
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

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.55, "#090510");
    g.addColorStop(1, "#04020c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + Math.sin(G.clock * 0.7) * 0.5;
    const mag = ctx.createRadialGradient(W * 0.2, H * 0.12, 8, W * 0.2, H * 0.12, H * 0.55);
    mag.addColorStop(0, "rgba(255, 61, 184," + (0.07 + pulse * 0.04) + ")");
    mag.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, W, H);
    const cyn = ctx.createRadialGradient(W * 0.82, H * 0.82, 8, W * 0.82, H * 0.82, H * 0.5);
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

  function drawLane() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(L.cx, 0, L.cx, L.cy);
    g.addColorStop(0, "rgba(0, 240, 255, 0)");
    g.addColorStop(0.4, "rgba(0, 240, 255, 0.05)");
    g.addColorStop(1, "rgba(255, 61, 184, 0.08)");
    ctx.fillStyle = g;
    const w = L.R * 0.42;
    ctx.beginPath();
    ctx.moveTo(L.cx - w * 0.35, 0);
    ctx.lineTo(L.cx + w * 0.35, 0);
    ctx.lineTo(L.cx + w, L.cy);
    ctx.lineTo(L.cx - w, L.cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFace() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, L.R + 10, 0, TAU);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.lineWidth = 12;
    ctx.stroke();

    const g = ctx.createRadialGradient(L.cx, L.cy - L.R * 0.18, L.R * 0.08, L.cx, L.cy, L.R);
    g.addColorStop(0, "#160a22");
    g.addColorStop(0.62, "#0a0614");
    g.addColorStop(1, "#05030c");
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, L.R, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.42)";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(L.cx, L.cy, L.R * 0.48, 0, TAU);
    ctx.strokeStyle = G.aimH != null ? "rgba(255, 61, 184, 0.7)" : "rgba(255, 61, 184, 0.22)";
    ctx.lineWidth = G.aimH != null ? 2.4 : 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(L.cx, L.cy, L.R * 0.92, 0, TAU);
    ctx.strokeStyle = G.aimM != null ? "rgba(0, 240, 255, 0.55)" : "rgba(0, 240, 255, 0.12)";
    ctx.lineWidth = G.aimM != null ? 2.2 : 1;
    ctx.stroke();

    for (let i = 0; i < 60; i++) {
      const th = clockAng((i / 60) * TAU);
      const major = i % 5 === 0;
      const r0 = L.R * (major ? 0.86 : 0.925);
      const r1 = L.R * 0.97;
      ctx.beginPath();
      ctx.moveTo(L.cx + Math.cos(th) * r0, L.cy + Math.sin(th) * r0);
      ctx.lineTo(L.cx + Math.cos(th) * r1, L.cy + Math.sin(th) * r1);
      ctx.strokeStyle = major ? "rgba(246, 243, 255, 0.72)" : "rgba(139, 144, 184, 0.32)";
      ctx.lineWidth = major ? 2.2 : 1;
      ctx.stroke();
    }

    const nums = [
      [12, 0],
      [3, 0.25],
      [6, 0.5],
      [9, 0.75]
    ];
    ctx.fillStyle = "#e8e6ff";
    ctx.font = "600 " + Math.max(13, (L.R * 0.145) | 0) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < nums.length; i++) {
      const n = nums[i][0];
      const f = nums[i][1];
      const th = clockAng(f * TAU);
      const r = L.R * 0.73;
      ctx.fillText(String(n), L.cx + Math.cos(th) * r, L.cy + Math.sin(th) * r);
    }

    ctx.font = "700 " + Math.max(9, (L.R * 0.075) | 0) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.fillStyle = "rgba(255, 61, 184, 0.55)";
    ctx.fillText("时", L.cx - L.R * 0.22, L.cy + L.R * 0.16);
    ctx.fillStyle = "rgba(0, 240, 255, 0.5)";
    ctx.fillText("分", L.cx + L.R * 0.22, L.cy + L.R * 0.16);

    ctx.restore();
  }

  function drawTickMark(th, col, inner, outer, wide, alpha) {
    const a = clockAng(th);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col;
    ctx.lineWidth = wide;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(L.cx + Math.cos(a) * inner, L.cy + Math.sin(a) * inner);
    ctx.lineTo(L.cx + Math.cos(a) * outer, L.cy + Math.sin(a) * outer);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(L.cx + Math.cos(a) * outer, L.cy + Math.sin(a) * outer, wide * 0.7, 0, TAU);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.restore();
  }

  function drawGhosts(tok) {
    if (!tok) return;
    const w = G.mode === "title" ? WAVES[0] : WAVES[G.wave];
    const a = 0.22 + tok.p * 0.7;
    const hOk = angDist(hour.th, tok.hAng) <= w.window;
    const mOk = angDist(minute.th, tok.mAng) <= w.window;
    drawTickMark(tok.hAng, PINK, L.R * 0.58, L.R * 0.98, hOk ? 5 : 3, hOk ? a : a * 0.7);
    drawTickMark(tok.mAng, CYAN, L.R * 0.62, L.R * 0.99, mOk ? 4.2 : 2.4, mOk ? a : a * 0.7);

    if (hOk && mOk) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = 0.22 + Math.sin(G.clock * 10) * 0.12;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, L.R * 1.02, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHand(th, len, width, col, grabbed) {
    const a = clockAng(th);
    const x0 = L.cx - Math.cos(a) * len * 0.18;
    const y0 = L.cy - Math.sin(a) * len * 0.18;
    const x1 = L.cx + Math.cos(a) * len;
    const y1 = L.cy + Math.sin(a) * len;
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = width + 7;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = width;
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x1, y1, width * 0.42 + (grabbed ? 1.4 : 0), 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHub() {
    const s = 6.5 + G.heat * 3.2;
    ctx.save();
    ctx.translate(L.cx, L.cy);
    ctx.rotate(G.hubSpin);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = G.heat > 0.55 ? GOLD : "rgba(246,243,255,0.75)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = G.heat > 0.4 ? PINK : "rgba(0, 240, 255, 0.5)";
    ctx.strokeRect(-s * 0.62, -s * 0.62, s * 1.24, s * 1.24);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, 1.8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawMiniClock(x, y, r, tok, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = "rgba(10, 6, 20, 0.88)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.strokeStyle = "rgba(246,243,255,0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = clockAng((i / 12) * TAU);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
      ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
      ctx.stroke();
    }

    const ha = clockAng(tok.hAng);
    const ma = clockAng(tok.mAng);
    ctx.lineCap = "round";
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ha) * r * 0.5, y + Math.sin(ha) * r * 0.5);
    ctx.stroke();
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ma) * r * 0.78, y + Math.sin(ma) * r * 0.78);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#e8faff";
    ctx.font = "700 " + Math.max(10, (r * 0.42) | 0) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(fmtTime(tok.h, tok.m), x, y + r + 4);
    ctx.restore();
  }

  function drawTokens() {
    const list = G.mode === "title" && G.demoTok ? [G.demoTok] : tokens;
    for (let i = 0; i < list.length; i++) {
      const tok = list[i];
      if (tok.state === "wait") continue;
      const fade = tok.fade == null ? 1 : clamp(tok.fade, 0, 1);
      if (fade <= 0.02) continue;
      const shrink = tok.state === "caught" ? fade : tok.p > 0.88 ? lerp(1, 0.55, (tok.p - 0.88) / 0.12) : 1;
      const r = L.tokR * shrink * (tok.state === "miss" ? fade : 1);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.35 * fade;
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.arc(tok.x, tok.y, r * 1.55, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawMiniClock(tok.x, tok.y, r, tok, fade);
    }
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
    const a = ease(G.judgeT / 0.7);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = G.judgeCol;
    ctx.font = "900 " + Math.round(Math.min(40, W * 0.075)) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(G.judge, L.cx, Math.max(36, L.cy - L.R - 48));
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
    drawLane();
    drawFace();
    const tok = G.mode === "title" ? G.demoTok : nearestFly();
    drawGhosts(tok);
    drawTokens();
    drawHand(hour.th, L.R * 0.54, 7.2, PINK, G.aimH != null);
    drawHand(minute.th, L.R * 0.82, 3.6, CYAN, G.aimM != null);
    drawHub();
    drawFx();
    drawJudge();
    drawVignette();
  }

  let acc = 0;
  let last = 0;
  let hidden = false;

  function frame(now) {
    const t = now * 0.001;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    if (hidden) dt = 0;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      G.clock += STEP;
      if (G.mode === "play" || G.mode === "clear") G.t += STEP;
      if (G.mode === "title") updateDemo(STEP);
      else if (G.mode === "win" || G.mode === "lose") updateHands(STEP);
      else updatePlay(STEP);
      G.heat = heatNow();
      if (G.mode === "play" || G.mode === "clear") audio.tickDrone(G.heat);
      updateFx(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
    canvas.classList.toggle("grabbing", ptrs.length > 0);
    requestAnimationFrame(frame);
  }

  function bindHold(el, key) {
    const on = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      pad[key] = true;
      el.classList.add("held");
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    };
    const off = function () {
      pad[key] = false;
      el.classList.remove("held");
    };
    el.addEventListener("pointerdown", on);
    el.addEventListener("pointerup", off);
    el.addEventListener("pointercancel", off);
    el.addEventListener("lostpointercapture", off);
  }

  bindHold(btnHCcw, "hccw");
  bindHold(btnHCw, "hcw");
  bindHold(btnMCcw, "mccw");
  bindHold(btnMCw, "mcw");

  function setKey(code, down) {
    if (code === "KeyA" || code === "ArrowLeft") keys.hccw = down;
    if (code === "KeyD" || code === "ArrowRight") keys.hcw = down;
    if (code === "KeyJ" || code === "KeyQ") keys.mccw = down;
    if (code === "KeyL" || code === "KeyE") keys.mcw = down;
  }

  function onKey(e, down) {
    const code = e.code;
    if (code === "ArrowLeft" || code === "ArrowRight" || code === "Space" || code === "ArrowUp" || code === "ArrowDown") {
      e.preventDefault();
    }
    setKey(code, down);
    if (!down) return;
    if (e.repeat) return;
    if (code === "KeyM") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === "KeyR") {
      audio.ensure();
      startPlay();
      return;
    }
    if (code === "Space" || code === "Enter") {
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
        audio.ensure();
        startPlay();
      }
    }
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    const p = canvasPos(e);
    const grab = pickGrab(p.x, p.y);
    ptrs.push({ id: e.pointerId, x: p.x, y: p.y, grab: grab });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", function (e) {
    const it = ptrById(e.pointerId);
    if (!it) return;
    const p = canvasPos(e);
    it.x = p.x;
    it.y = p.y;
  });
  function ptrUp(e) {
    for (let i = ptrs.length - 1; i >= 0; i--) {
      if (ptrs[i].id === e.pointerId) ptrs.splice(i, 1);
    }
  }
  canvas.addEventListener("pointerup", ptrUp);
  canvas.addEventListener("pointercancel", ptrUp);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

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
    keys.hccw = keys.hcw = keys.mccw = keys.mcw = false;
    pad.hccw = pad.hcw = pad.mccw = pad.mcw = false;
    ptrs.length = 0;
    btnHCcw.classList.remove("held");
    btnHCw.classList.remove("held");
    btnMCcw.classList.remove("held");
    btnMCw.classList.remove("held");
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
  showPanel("title");
  resize();
  makeMotes();
  syncHud();
  requestAnimationFrame(function (t) {
    last = t * 0.001;
    requestAnimationFrame(frame);
  });
})();
