(() => {
  "use strict";

  const LIVES = 3;
  const DURATION = 72;
  const NOTES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-tone-lock-mute";

  const TINES = [
    { name: "粉", sub: "MAG", key: "1", alt: "Q", freq: 262, type: "sine", r: 255, g: 61, b: 184, shape: "diamond" },
    { name: "青", sub: "CYN", key: "2", alt: "W", freq: 330, type: "triangle", r: 0, g: 240, b: 255, shape: "hex" },
    { name: "金", sub: "GLD", key: "3", alt: "E", freq: 392, type: "sine", r: 255, g: 227, b: 107, shape: "drop" },
    { name: "紫", sub: "VIO", key: "4", alt: "R", freq: 523, type: "triangle", r: 199, g: 125, b: 255, shape: "tri" },
    { name: "翠", sub: "MNT", key: "5", alt: "T", freq: 659, type: "sine", r: 61, g: 255, b: 176, shape: "circle" }
  ];

  const ROUNDS = [
    { name: "初响", sub: "FIRST", tines: 3, gap: 0.64, glow: 0.56, vis: 1.0, extras: 2, hint: "锁会唱三音 · 按同样顺序回奏" },
    { name: "重瓣", sub: "PETAL", tines: 4, gap: 0.52, glow: 0.44, vis: 0.82, extras: 2, hint: "四枚晶片 · 仍是三音" },
    { name: "密环", sub: "RING", tines: 5, gap: 0.42, glow: 0.32, vis: 0.58, extras: 1, hint: "五晶齐亮 · 凭耳朵记" },
    { name: "暗耳", sub: "DARK", tines: 5, gap: 0.34, glow: 0.16, vis: 0.2, extras: 1, hint: "光很短 · 听音高" },
    { name: "终钥", sub: "FINAL", tines: 5, gap: 0.26, glow: 0.1, vis: 0.1, extras: 1, hint: "几乎无光 · 只听顺序" }
  ];

  const canvas = document.getElementById("view");
  const ctx = canvas.getContext("2d", { alpha: false });
  const hud = document.getElementById("hud");
  const hintEl = document.getElementById("hint");
  const doorEl = document.getElementById("door");
  const progEl = document.getElementById("prog");
  const timeEl = document.getElementById("time");
  const pipsEl = document.getElementById("pips");
  const dock = document.getElementById("dock");
  const panel = document.getElementById("panel");
  const card = document.getElementById("card");
  const kickerEl = document.getElementById("panel-kicker");
  const titleEl = document.getElementById("panel-title");
  const leadEl = document.getElementById("panel-lead");
  const metaEl = document.getElementById("panel-meta");
  const footEl = document.getElementById("panel-foot");
  const btnMain = document.getElementById("btn-main");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const btnListen = document.getElementById("btn-listen");
  const toastEl = document.getElementById("toast");

  let W = 1;
  let H = 1;
  let dpr = 1;

  const L = {
    cx: 0,
    cy: 0,
    R: 120,
    tineR: 200,
    crystalR: 28,
    tines: []
  };

  const G = {
    mode: "title",
    phase: "listen",
    room: 0,
    lives: LIVES,
    remain: DURATION,
    seq: [0, 1, 2],
    progress: 0,
    listens: 2,
    listenI: 0,
    listenWait: 0,
    glow: [0, 0, 0, 0, 0],
    pulse: [0, 0, 0, 0, 0],
    hover: -1,
    openT: 0,
    hurtT: 0,
    boltShow: 0,
    doorGap: 0,
    wave: 0,
    waveF: 330,
    spin: 0,
    shake: 0,
    flash: 0,
    flashRgb: { r: 255, g: 61, b: 184 },
    toastT: 0,
    paused: false,
    clock: 0,
    t: 0,
    lock: 0,
    why: "",
    demoI: 0,
    demoWait: 1.2,
    demoSeq: [0, 2, 1]
  };

  const motes = [];
  const particles = [];
  const rings = [];

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    tickAt: 0,
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
    },
    setMuted: function (m) {
      this.muted = m;
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) {}
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? "静" : "音";
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      btnMute.classList.toggle("muted", m);
    },
    tone: function (freq, dur, type, vol, when, slide) {
      if (!this.ctx || this.muted) return;
      const t = when != null ? when : this.ctx.currentTime;
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
      o.stop(t + dur + 0.04);
    },
    strike: function (i) {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const tine = TINES[i];
      const t = this.ctx.currentTime;
      const f = tine.freq;
      this.tone(f, 0.46, tine.type, 0.17, t);
      this.tone(f * 2, 0.24, "sine", 0.05, t);
      this.tone(f * 3.02, 0.06, "square", 0.016, t);
    },
    tick: function () {
      this.ensure();
      this.tone(880, 0.05, "square", 0.035);
    },
    match: function () {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.tone(392, 0.16, "triangle", 0.09, t);
      this.tone(523, 0.22, "sine", 0.08, t + 0.08);
      this.tone(784, 0.36, "sine", 0.07, t + 0.16);
    },
    reject: function () {
      this.ensure();
      this.tone(168, 0.28, "square", 0.08, null, 70);
      this.tone(92, 0.36, "sawtooth", 0.05, null, 40);
    },
    lose: function () {
      this.ensure();
      this.tone(180, 0.55, "sawtooth", 0.1, null, 50);
      this.tone(90, 0.7, "square", 0.06, null, 40);
    },
    win: function () {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.tone(262, 0.18, "sine", 0.1, t);
      this.tone(330, 0.2, "triangle", 0.08, t + 0.12);
      this.tone(392, 0.24, "sine", 0.08, t + 0.24);
      this.tone(523, 0.5, "sine", 0.1, t + 0.38);
    },
    start: function () {
      this.ensure();
      this.tone(220, 0.16, "sine", 0.07, null, 440);
      this.tone(330, 0.22, "triangle", 0.05, null, 660);
    },
    tickDrone: function () {
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
      const listening = G.mode === "play" && G.phase === "listen";
      const f = listening ? 62 + G.waveF * 0.04 : 54;
      this.drone.frequency.setTargetAtTime(f, t, 0.18);
      const vol = G.mode === "play" && (G.phase === "listen" || G.phase === "reply") ? (listening ? 0.028 : 0.012) : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.2);
    },
    stopDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) {}

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function round() {
    return ROUNDS[G.room];
  }
  function tineCount() {
    return G.mode === "play" ? round().tines : 5;
  }
  function cssRgb(c, a) {
    if (a == null) return "rgb(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + ")";
    return "rgba(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + "," + a + ")";
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 52; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.38 + 0.05,
        p: Math.random() * TAU,
        s: 0.12 + Math.random() * 0.32
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
        rad: rand(spec.r0, spec.r1),
        r: spec.col.r,
        g: spec.col.g,
        b: spec.col.b
      });
    }
  }

  function spawnRing(x, y, col, vis) {
    if (rings.length > 18) rings.shift();
    rings.push({
      x: x,
      y: y,
      r: 8,
      life: 0.55,
      max: 0.55,
      col: col,
      vis: vis
    });
  }

  function toast(msg, bad) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("bad", !!bad);
    toastEl.classList.remove("hidden");
    G.toastT = 1.45;
  }

  function layoutTines(n) {
    L.tines.length = 0;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / n) * TAU;
      L.tines.push({
        x: L.cx + Math.cos(a) * L.tineR,
        y: L.cy + Math.sin(a) * L.tineR,
        a: a
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.min(window.innerWidth || 1, 3840));
    H = Math.max(1, Math.min(window.innerHeight || 1, 2160));
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const top = 88;
    const bot = 128;
    const availH = Math.max(160, H - top - bot);
    const m = Math.min(W, availH);
    L.R = Math.min(W * 0.22, availH * 0.3, m * 0.34, 150);
    L.crystalR = clamp(L.R * 0.26, 18, 36);
    L.cx = W * 0.5;
    L.cy = top + availH * 0.5;
    const maxOrbit = Math.min(W * 0.5 - L.crystalR - 30, availH * 0.5 - L.crystalR - 24);
    L.tineR = Math.min(L.R * 1.78, Math.max(L.R * 1.35, maxOrbit));
    const n = tineCount();
    layoutTines(n);
  }

  function makeSeq() {
    const n = round().tines;
    if (G.room === 0) {
      const a = [0, 1, 2];
      for (let i = a.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    }
    const seq = [];
    for (let i = 0; i < NOTES; i++) {
      let k = (Math.random() * n) | 0;
      if (i === 2 && seq[0] === seq[1] && k === seq[0]) k = (k + 1) % n;
      seq.push(k);
    }
    return seq;
  }

  function playVisual(i, vis) {
    const t = TINES[i];
    const p = L.tines[i];
    G.glow[i] = vis;
    G.pulse[i] = 1;
    G.wave = vis;
    G.waveF = t.freq;
    if (p) {
      spawnRing(p.x, p.y, t, vis);
      emit(8 + ((vis * 8) | 0), {
        x: p.x,
        y: p.y,
        j: 10,
        vx0: -70,
        vx1: 70,
        vy0: -90,
        vy1: 30,
        life: 0.55 + vis * 0.2,
        r0: 1.2,
        r1: 3.4,
        col: t
      });
    }
  }

  function playNote(i, vis) {
    audio.strike(i);
    playVisual(i, vis);
  }

  function beginListen() {
    G.phase = "listen";
    G.listenI = 0;
    G.listenWait = 0.32;
    G.lock = 0.05;
    syncHud();
  }

  function enterRoom(i) {
    G.room = i;
    G.progress = 0;
    G.openT = 0;
    G.hurtT = 0;
    G.doorGap = 0;
    G.listens = round().extras;
    G.seq = makeSeq();
    layoutTines(round().tines);
    beginListen();
    syncHud();
  }

  function resetRun() {
    G.t = 0;
    G.remain = DURATION;
    G.lives = LIVES;
    G.hover = -1;
    G.shake = 0;
    G.flash = 0;
    G.toastT = 0;
    G.paused = false;
    G.clock = 0;
    G.boltShow = 0;
    G.doorGap = 0;
    G.why = "";
    G.lock = 0.12;
    particles.length = 0;
    rings.length = 0;
    for (let i = 0; i < 5; i++) {
      G.glow[i] = 0;
      G.pulse[i] = 0;
    }
    enterRoom(0);
  }

  function syncHud() {
    const rm = round();
    doorEl.textContent = G.room + 1 + "/" + ROUNDS.length;
    progEl.textContent = G.progress + "/" + NOTES;
    progEl.classList.toggle("hot", G.progress >= NOTES);
    const tl = G.remain < 10 ? G.remain.toFixed(1) : String(Math.ceil(G.remain));
    timeEl.textContent = tl;
    timeEl.classList.toggle("warn", G.remain <= 10);

    btnListen.textContent = "再听 " + G.listens;
    btnListen.disabled = G.mode !== "play" || G.phase !== "reply" || G.listens <= 0;

    pipsEl.innerHTML = "";
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement("span");
      s.className = "pip" + (i < G.lives ? " on" : "") + (G.lives === 1 && i === 0 ? " warn" : "");
      pipsEl.appendChild(s);
    }

    const buttons = dock.children;
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("off", i >= rm.tines);
    }

    let h = rm.hint;
    let cls = "hint";
    if (G.phase === "listen") {
      h = "锁在唱 · 听三音";
      cls = "hint gold";
    } else if (G.phase === "reply") {
      h = G.listens > 0 ? "回奏 · 还可再听 " + G.listens + " 次" : "回奏 · 听完了";
      cls = "hint hot";
    } else if (G.phase === "open") {
      h = "门锁开了";
      cls = "hint hot";
    } else if (G.phase === "hurt") {
      h = G.lives > 0 ? "错了 · 再听一遍" : "锁芯咬死";
      cls = "hint warn";
    }
    if (G.lives === 1 && G.phase === "reply") {
      h = "最后一条命 · " + h;
      cls = "hint warn";
    }
    hintEl.textContent = h;
    hintEl.className = cls;
  }

  function showPanel(kind) {
    panel.classList.remove("hidden");
    card.classList.remove("win", "lose");
    if (kind === "title") {
      kickerEl.textContent = "TONES";
      titleEl.textContent = "听锁";
      leadEl.innerHTML = "锁会唱三音。<br />按同样顺序回奏，门才会开。";
      metaEl.textContent = "五道门锁，三条命。后关光更短，要靠听。";
      btnMain.textContent = "开锁";
      footEl.textContent = "1–5 / ASDFG 奏晶 · 空格再听 · M 静音";
    } else if (kind === "win") {
      card.classList.add("win");
      kickerEl.textContent = "OPEN";
      titleEl.textContent = "锁已尽开";
      leadEl.textContent = "五道音锁都对上了。门缝里漏出青光。";
      metaEl.textContent = "剩余 " + G.remain.toFixed(1) + " 秒 · 命 " + G.lives;
      btnMain.textContent = "再开一锁";
      footEl.textContent = "空格 / 回车 · R 重开";
    } else {
      card.classList.add("lose");
      kickerEl.textContent = "SEALED";
      titleEl.textContent = G.remain <= 0 ? "时限耗尽" : "听岔了";
      leadEl.textContent =
        G.remain <= 0 ? "三音还没回完，锁重新咬死。" : "回奏错序，锁芯合上。";
      metaEl.textContent = "开到第 " + Math.min(G.room + 1, ROUNDS.length) + " 道 · 回奏 " + G.progress + "/3";
      btnMain.textContent = "再开一锁";
      footEl.textContent = "空格 / 回车 · R 重开";
    }
  }

  function startPlay() {
    audio.start();
    resetRun();
    G.mode = "play";
    panel.classList.add("hidden");
    hud.classList.remove("hidden");
    syncHud();
  }

  function endGame(win) {
    if (G.mode !== "play") return;
    G.mode = win ? "win" : "lose";
    hud.classList.add("hidden");
    audio.stopDrone();
    if (win) {
      audio.win();
      G.doorGap = 1;
      G.boltShow = ROUNDS.length;
      emit(40, {
        x: L.cx,
        y: L.cy,
        j: 22,
        vx0: -110,
        vx1: 110,
        vy0: -140,
        vy1: 50,
        life: 1.15,
        r0: 2,
        r1: 5.5,
        col: { r: 0, g: 240, b: 255 }
      });
    } else {
      audio.lose();
      G.flash = 1;
      G.shake = 12;
      G.flashRgb = { r: 255, g: 61, b: 184 };
    }
    showPanel(G.mode);
  }

  function beginOpen() {
    G.phase = "open";
    G.openT = 0;
    G.lock = 0.2;
    audio.match();
    toast(round().name + " 开了");
    emit(22, {
      x: L.cx,
      y: L.cy,
      j: 16,
      vx0: -80,
      vx1: 80,
      vy0: -100,
      vy1: 20,
      life: 0.85,
      r0: 1.6,
      r1: 4,
      col: { r: 0, g: 240, b: 255 }
    });
    syncHud();
  }

  function beginHurt() {
    G.lives -= 1;
    G.phase = "hurt";
    G.hurtT = 0;
    G.progress = 0;
    G.shake = 10;
    G.flash = 1;
    G.flashRgb = { r: 255, g: 61, b: 184 };
    audio.reject();
    toast("错音 −1", true);
    if (G.lives <= 0) {
      endGame(false);
      return;
    }
    syncHud();
  }

  function strike(i) {
    if (G.mode !== "play" || G.phase !== "reply") return;
    if (G.lock > 0) return;
    const n = round().tines;
    if (i < 0 || i >= n) return;
    audio.ensure();
    playNote(i, 1);
    G.lock = 0.1;
    if (G.seq[G.progress] === i) {
      G.progress += 1;
      syncHud();
      if (G.progress >= NOTES) beginOpen();
    } else {
      beginHurt();
    }
  }

  function replay() {
    if (G.mode !== "play" || G.phase !== "reply") return;
    if (G.lock > 0) return;
    if (G.listens <= 0) {
      toast("听完了", true);
      return;
    }
    G.listens -= 1;
    G.progress = 0;
    audio.ensure();
    beginListen();
    toast("再听");
  }

  function updateDemo(dt) {
    G.demoWait -= dt;
    if (G.demoWait > 0) return;
    const vis = 0.7;
    playVisual(G.demoSeq[G.demoI], vis);
    if (audio.ctx && audio.ctx.state === "running") audio.strike(G.demoSeq[G.demoI]);
    G.demoI += 1;
    if (G.demoI >= 3) {
      G.demoI = 0;
      G.demoWait = 2.4;
      for (let k = 0; k < 3; k++) G.demoSeq[k] = (Math.random() * 5) | 0;
    } else {
      G.demoWait = 0.48;
    }
  }

  function updateFx(dt) {
    G.clock += dt;
    G.spin += dt * (G.phase === "listen" ? 0.55 : G.phase === "open" ? 1.6 : 0.18);
    G.shake *= Math.pow(0.001, dt);
    if (G.shake < 0.15) G.shake = 0;
    G.flash = Math.max(0, G.flash - dt * 1.8);
    G.wave = Math.max(0, G.wave - dt * 2.4);
    const glowDur = G.mode === "play" ? Math.max(0.08, round().glow) : 0.5;
    for (let i = 0; i < 5; i++) {
      G.glow[i] = Math.max(0, G.glow[i] - dt / glowDur);
      G.pulse[i] = Math.max(0, G.pulse[i] - dt * 3.6);
    }
    const wantBolt = G.mode === "play" ? G.room + (G.phase === "open" ? smooth(clamp(G.openT / 0.7, 0, 1)) : 0) : G.mode === "win" ? ROUNDS.length : G.boltShow;
    G.boltShow = lerp(G.boltShow, wantBolt, 1 - Math.pow(0.0006, dt));

    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= dt;
      r.r += 140 * dt;
      if (r.life <= 0) rings.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y -= dt * m.s * 0.028;
      if (m.y < 0) m.y += 1;
    }
  }

  function update(dt) {
    if (G.lock > 0) G.lock -= dt;
    updateFx(dt);
    audio.tickDrone();

    if (G.mode === "title") {
      updateDemo(dt);
      return;
    }
    if (G.mode !== "play" || G.paused) return;

    G.t += dt;
    if (G.phase === "listen" || G.phase === "reply") {
      G.remain -= dt;
      if (G.remain <= 0) {
        G.remain = 0;
        endGame(false);
        return;
      }
      if (G.remain <= 10 && G.remain > 0) {
        const k = Math.ceil(G.remain);
        if (k !== audio.tickAt) {
          audio.tickAt = k;
          audio.tick();
        }
      }
    }

    if (G.phase === "listen") {
      G.listenWait -= dt;
      if (G.listenWait <= 0) {
        if (G.listenI < NOTES) {
          const idx = G.seq[G.listenI];
          playNote(idx, round().vis);
          G.listenI += 1;
          G.listenWait = round().gap;
        } else {
          G.phase = "reply";
          G.lock = 0.08;
          toast("回奏");
          syncHud();
        }
      }
    } else if (G.phase === "open") {
      G.openT += dt;
      if (G.room + 1 >= ROUNDS.length) {
        G.doorGap = smooth(clamp(G.openT / 0.85, 0, 1));
      }
      if (G.openT >= 1.12) {
        if (G.room + 1 >= ROUNDS.length) {
          endGame(true);
          return;
        }
        enterRoom(G.room + 1);
      }
    } else if (G.phase === "hurt") {
      G.hurtT += dt;
      if (G.hurtT >= 0.72) beginListen();
    }

    const tl = G.remain < 10 ? G.remain.toFixed(1) : String(Math.ceil(G.remain));
    if (timeEl.textContent !== tl) {
      timeEl.textContent = tl;
      timeEl.classList.toggle("warn", G.remain <= 10);
    }
  }

  function pathRoundRect(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, rad);
      return;
    }
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function drawShape(kind, r) {
    ctx.beginPath();
    if (kind === "diamond") {
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.72, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.72, 0);
      ctx.closePath();
    } else if (kind === "hex") {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU - TAU / 12;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (kind === "drop") {
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.7, -r * 0.25, r * 0.72, r * 0.35, 0, r);
      ctx.bezierCurveTo(-r * 0.72, r * 0.35, -r * 0.7, -r * 0.25, 0, -r);
      ctx.closePath();
    } else if (kind === "tri") {
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.92, r * 0.72);
      ctx.lineTo(-r * 0.92, r * 0.72);
      ctx.closePath();
    } else {
      ctx.arc(0, 0, r, 0, TAU);
    }
  }

  function drawBg() {
    const g = ctx.createRadialGradient(W * 0.32, H * 0.08, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.85);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.48, "#080510");
    g.addColorStop(1, "#05030c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.82, H * 0.14, 0, W * 0.82, H * 0.14, W * 0.5);
    g2.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    const g3 = ctx.createRadialGradient(W * 0.16, H * 0.88, 0, W * 0.16, H * 0.88, W * 0.46);
    g3.addColorStop(0, "rgba(255, 61, 184, 0.08)");
    g3.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);

    const floor = ctx.createRadialGradient(L.cx, L.cy + L.R * 0.2, 0, L.cx, L.cy, L.tineR * 1.4);
    floor.addColorStop(0, "rgba(0, 240, 255, 0.05)");
    floor.addColorStop(0.55, "rgba(255, 61, 184, 0.03)");
    floor.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#7af6ff";
    ctx.lineWidth = 1;
    const step = 40;
    const ox = (G.clock * 5) % step;
    for (let x = -step + ox; x < W + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * 1.4 + m.p);
      ctx.fillStyle = "rgba(200, 230, 255," + m.a * tw + ")";
      ctx.beginPath();
      ctx.arc(m.x * W, m.y * H, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawSpokes(n) {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < n; i++) {
      const p = L.tines[i];
      const g = G.glow[i];
      ctx.strokeStyle = cssRgb(TINES[i], 0.16 + g * 0.5);
      ctx.beginPath();
      ctx.moveTo(L.cx + Math.cos(p.a) * L.R * 1.12, L.cy + Math.sin(p.a) * L.R * 1.12);
      ctx.lineTo(p.x - Math.cos(p.a) * L.crystalR * 0.9, p.y - Math.sin(p.a) * L.crystalR * 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLock() {
    const R = L.R;
    const cx = L.cx;
    const cy = L.cy;
    const gap = G.doorGap * R * 0.42;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, R * 0.72, R * 0.62, 0, TAU);
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, R * 1.22, 0, TAU);
    ctx.strokeStyle = "rgba(246, 243, 255, 0.08)";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, R * 1.22, 0, TAU);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(G.spin * 0.15);
    ctx.strokeStyle = "rgba(255, 61, 184, 0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      const inner = i % 5 === 0 ? R * 1.08 : R * 1.14;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * R * 1.2, Math.sin(a) * R * 1.2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.rotate(-G.spin * 0.22);
    const teeth = 14;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * TAU;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = i % 2 ? "rgba(18, 16, 32, 0.95)" : "rgba(28, 22, 44, 0.95)";
      ctx.fillRect(R * 0.9, -6, R * 0.14, 12);
      ctx.restore();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, R * 0.9, 0, TAU);
    ctx.fillStyle = "#0c0a14";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const bolts = 5;
    for (let i = 0; i < bolts; i++) {
      const a = -Math.PI / 2 + (i / bolts) * TAU + Math.PI / bolts;
      const retracted = clamp(G.boltShow - i, 0, 1);
      const dist = R * (0.78 - retracted * 0.28);
      const bx = Math.cos(a) * dist;
      const by = Math.sin(a) * dist;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a);
      ctx.fillStyle = retracted > 0.85 ? "rgba(0, 240, 255, 0.75)" : "rgba(200, 210, 230, 0.55)";
      ctx.shadowColor = retracted > 0.85 ? "rgba(0,240,255,0.8)" : "transparent";
      ctx.shadowBlur = retracted > 0.85 ? 10 : 0;
      ctx.beginPath();
      pathRoundRect(-5, -8, 18, 16, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    function leaf(side, ox) {
      ctx.save();
      ctx.translate(ox, 0);
      const lw = R * 0.78;
      const grd = ctx.createLinearGradient(side < 0 ? -lw : 0, 0, side < 0 ? 0 : lw, 0);
      if (side < 0) {
        grd.addColorStop(0, "#14101f");
        grd.addColorStop(0.7, "#1c162c");
        grd.addColorStop(1, "#0a0812");
      } else {
        grd.addColorStop(0, "#0a0812");
        grd.addColorStop(0.3, "#1c162c");
        grd.addColorStop(1, "#14101f");
      }
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.7, side < 0 ? Math.PI / 2 : -Math.PI / 2, side < 0 ? -Math.PI / 2 : Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.16)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    if (G.doorGap > 0.02) {
      const light = ctx.createLinearGradient(0, -R, 0, R);
      light.addColorStop(0, "rgba(255, 61, 184, 0.08)");
      light.addColorStop(0.5, "rgba(0, 240, 255, 0.28)");
      light.addColorStop(1, "rgba(255, 61, 184, 0.08)");
      ctx.fillStyle = light;
      ctx.fillRect(-gap, -R * 0.7, gap * 2, R * 1.4);
    }

    if (G.doorGap < 0.96) {
      ctx.save();
      ctx.globalAlpha = 1 - G.doorGap;
      leaf(-1, -gap);
      leaf(1, gap);
      ctx.restore();
    }

    const coreR = R * 0.42 * (1 - G.doorGap * 0.35);
    if (G.doorGap < 0.92) {
      ctx.save();
      ctx.globalAlpha = 1 - G.doorGap;
      ctx.rotate(G.spin * 0.08);

      const listening = G.mode === "play" && G.phase === "listen";
      const well = ctx.createRadialGradient(-coreR * 0.25, -coreR * 0.3, 2, 0, 0, coreR);
      well.addColorStop(0, listening ? "#3a2048" : "#2a2438");
      well.addColorStop(0.55, "#16121f");
      well.addColorStop(1, "#080610");
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, TAU);
      ctx.fillStyle = well;
      ctx.fill();
      ctx.strokeStyle = listening ? "rgba(255, 227, 107, 0.55)" : "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (G.wave > 0.03) {
        ctx.beginPath();
        const amp = coreR * 0.22 * G.wave;
        for (let i = 0; i <= 18; i++) {
          const x = -coreR * 0.62 + (i / 18) * coreR * 1.24;
          const y = Math.sin(i * 0.7 + G.clock * 14) * amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = cssRgb({ r: 0, g: 240, b: 255 }, 0.35 + G.wave * 0.5);
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(8,6,16,0.9)";
      ctx.beginPath();
      ctx.arc(0, coreR * 0.08, coreR * 0.16, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 61, 184, 0.7)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 61, 184, 0.55)";
      ctx.beginPath();
      pathRoundRect(-coreR * 0.045, -coreR * 0.22, coreR * 0.09, coreR * 0.28, 2);
      ctx.fill();

      const slotR = coreR * 0.78;
      for (let i = 0; i < NOTES; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.42;
        const sx = Math.cos(a) * slotR;
        const sy = Math.sin(a) * slotR;
        const filled = G.mode === "play" && G.progress > i;
        const singing = G.mode === "play" && G.phase === "listen" && G.listenI === i + 1;
        ctx.beginPath();
        ctx.arc(sx, sy, coreR * 0.11, 0, TAU);
        ctx.fillStyle = filled ? "rgba(0, 240, 255, 0.85)" : singing ? "rgba(255, 227, 107, 0.7)" : "rgba(40, 36, 56, 0.9)";
        ctx.shadowColor = filled ? "rgba(0,240,255,0.9)" : "transparent";
        ctx.shadowBlur = filled ? 8 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = filled ? "rgba(0,240,255,0.9)" : "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();

    ctx.fillStyle = "rgba(246,243,255,0.78)";
    ctx.font = "600 " + Math.max(12, R * 0.16) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = G.mode === "play" ? round().name : "听锁";
    ctx.fillText(label, cx, cy + R * 1.42);
    ctx.fillStyle = "rgba(0,240,255,0.7)";
    ctx.font = "11px Segoe UI, sans-serif";
    ctx.fillText(G.mode === "play" ? round().sub : "TONES", cx, cy + R * 1.42 + Math.max(14, R * 0.16));
  }

  function drawTines(n) {
    for (let i = 0; i < n; i++) {
      const t = TINES[i];
      const p = L.tines[i];
      const g = G.glow[i];
      const pulse = G.pulse[i];
      const r = L.crystalR * (1 + pulse * 0.14);
      const hover = G.hover === i;

      ctx.save();
      ctx.translate(p.x, p.y);

      const halo = Math.max(g, hover ? 0.25 : 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.85, 0, TAU);
      ctx.fillStyle = cssRgb(t, 0.06 + halo * 0.28);
      ctx.fill();

      ctx.save();
      ctx.shadowColor = cssRgb(t, 0.35 + g * 0.65);
      ctx.shadowBlur = 8 + g * 18;
      drawShape(t.shape, r);
      const lg = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 2, 0, 0, r * 1.15);
      lg.addColorStop(0, cssRgb({ r: Math.min(255, t.r + 50), g: Math.min(255, t.g + 50), b: Math.min(255, t.b + 50) }));
      lg.addColorStop(0.55, cssRgb(t));
      lg.addColorStop(1, "rgb(12,8,20)");
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = cssRgb(t, 0.55 + g * 0.4);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.ellipse(-r * 0.22, -r * 0.28, r * 0.22, r * 0.12, -0.5, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255," + (0.14 + g * 0.22) + ")";
      ctx.fill();

      const lx = Math.cos(p.a) * (r + 16);
      const ly = Math.sin(p.a) * (r + 16);
      ctx.fillStyle = hover || g > 0.2 ? cssRgb(t, 0.95) : "rgba(246,243,255,0.72)";
      ctx.font = "600 " + Math.max(11, L.crystalR * 0.42) + "px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.name, lx, ly);
      ctx.fillStyle = "rgba(0,240,255,0.55)";
      ctx.font = "10px Segoe UI, sans-serif";
      ctx.fillText(t.key, lx, ly + 13);

      ctx.restore();
    }
  }

  function drawRings() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = clamp(r.life / r.max, 0, 1) * r.vis;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.strokeStyle = cssRgb(r.col, 0.55 * a);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.rad, 0, TAU);
      ctx.fillStyle = "rgba(" + (p.r | 0) + "," + (p.g | 0) + "," + (p.b | 0) + "," + a + ")";
      ctx.fill();
    }
  }

  function drawScan() {
    const vg = ctx.createRadialGradient(L.cx, L.cy, H * 0.18, L.cx, L.cy, Math.max(W, H) * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    const n = tineCount();
    drawBg();
    drawSpokes(n);
    drawLock();
    drawTines(n);
    drawRings();
    drawParticles();
    drawScan();
    if (G.flash > 0) {
      ctx.fillStyle = cssRgb(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function hitAt(x, y) {
    const n = tineCount();
    const cr = L.crystalR * 1.55;
    const cr2 = cr * cr;
    for (let i = 0; i < n; i++) {
      const p = L.tines[i];
      const dx = x - p.x;
      const dy = y - p.y;
      if (dx * dx + dy * dy < cr2) return i;
    }
    const dx = x - L.cx;
    const dy = y - L.cy;
    if (dx * dx + dy * dy < (L.R * 0.55) * (L.R * 0.55)) return 9;
    return -1;
  }

  function onPointer(e) {
    if (e.button != null && e.button !== 0) return;
    if (G.mode !== "play") return;
    const hit = hitAt(e.clientX, e.clientY);
    if (hit >= 0 && hit <= 4) strike(hit);
    else if (hit === 9) replay();
  }

  function onMove(e) {
    const hit = hitAt(e.clientX, e.clientY);
    G.hover = hit >= 0 && hit <= 4 ? hit : -1;
    canvas.style.cursor = hit >= 0 ? "pointer" : "default";
  }

  function buildDock() {
    dock.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const t = TINES[i];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "t" + i;
      b.innerHTML = t.name + "<span>" + t.key + "</span>";
      b.setAttribute("aria-label", t.name);
      b.addEventListener("click", function () {
        strike(i);
      });
      dock.appendChild(b);
    }
  }

  function keyToTine(k) {
    if (k === "1" || k === "q" || k === "Q" || k === "a" || k === "A") return 0;
    if (k === "2" || k === "w" || k === "W" || k === "s" || k === "S") return 1;
    if (k === "3" || k === "e" || k === "E" || k === "d" || k === "D") return 2;
    if (k === "4" || k === "f" || k === "F") return 3;
    if (k === "5" || k === "t" || k === "T" || k === "g" || k === "G") return 4;
    return -1;
  }

  canvas.addEventListener("pointerdown", onPointer);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", function () {
    G.hover = -1;
  });

  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function () {
    if (G.mode === "title") return;
    startPlay();
  });
  btnListen.addEventListener("click", function () {
    replay();
  });
  btnMain.addEventListener("click", function () {
    startPlay();
  });

  window.addEventListener("keydown", function (e) {
    const k = e.key;
    if (k === "m" || k === "M") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (k === "r" || k === "R") {
      if (G.mode !== "title") {
        startPlay();
        e.preventDefault();
      }
      return;
    }
    if (G.mode !== "play") {
      if (k === " " || k === "Enter") {
        startPlay();
        e.preventDefault();
      }
      return;
    }
    if (k === " ") {
      e.preventDefault();
      replay();
      return;
    }
    if (e.repeat) return;
    const i = keyToTine(k);
    if (i >= 0) {
      strike(i);
      e.preventDefault();
    }
  });

  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
  });
  window.addEventListener("resize", resize);
  window.addEventListener("blur", function () {
    G.paused = true;
  });
  window.addEventListener("focus", function () {
    G.paused = false;
  });

  buildDock();
  makeMotes();
  resize();
  showPanel("title");
  audio.setMuted(audio.muted);

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    try {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      if (!isFinite(dt) || dt < 0) dt = STEP;
      acc += dt;
      if (acc > 0.2) acc = 0.2;
      while (acc >= STEP) {
        update(STEP);
        acc -= STEP;
      }
      draw();
    } catch (err) {
      console.error(err);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
