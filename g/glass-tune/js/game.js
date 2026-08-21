(() => {
  "use strict";

  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const ACTIVE = 0.32;
  const MUTE_KEY = "playbox-glass-tune-mute";

  const GLASSES = [
    { name: "粉", sub: "PINK", key: "1", alt: "A", freq: 261.63, fill: 0.78, r: 255, g: 61, b: 184 },
    { name: "桃", sub: "ROSE", key: "2", alt: "S", freq: 293.66, fill: 0.70, r: 255, g: 120, b: 168 },
    { name: "金", sub: "GOLD", key: "3", alt: "D", freq: 329.63, fill: 0.62, r: 255, g: 227, b: 107 },
    { name: "翠", sub: "MINT", key: "4", alt: "F", freq: 392.0, fill: 0.52, r: 61, g: 255, b: 176 },
    { name: "青", sub: "CYAN", key: "5", alt: "J", freq: 440.0, fill: 0.44, r: 0, g: 240, b: 255 },
    { name: "靛", sub: "ICE", key: "6", alt: "K", freq: 523.25, fill: 0.36, r: 140, g: 200, b: 255 },
    { name: "紫", sub: "VIO", key: "7", alt: "L", freq: 587.33, fill: 0.26, r: 199, g: 125, b: 255 },
    { name: "焰", sub: "FIRE", key: "8", alt: ";", freq: 659.25, fill: 0.16, r: 255, g: 90, b: 110 }
  ];

  const STAGES = [
    {
      name: "初碰",
      sub: "FIRST",
      glasses: 3,
      target: [0, 2],
      decay: 2.8,
      hold: 0.2,
      time: 22,
      hintGlow: 1,
      hintFade: 0,
      listens: 3,
      sting: false,
      hint: "敲两只亮着的杯子，让它们一起响"
    },
    {
      name: "对盏",
      sub: "PAIR",
      glasses: 4,
      target: [1, 3],
      decay: 2.4,
      hold: 0.22,
      time: 20,
      hintGlow: 0.82,
      hintFade: 0,
      listens: 2,
      sting: false,
      hint: "两音齐鸣才算碰杯 · 多敲一只要等它散"
    },
    {
      name: "三和",
      sub: "TRIAD",
      glasses: 4,
      target: [0, 2, 3],
      decay: 2.15,
      hold: 0.24,
      time: 20,
      hintGlow: 0.55,
      hintFade: 0,
      listens: 2,
      sting: false,
      hint: "三只杯子一起响"
    },
    {
      name: "余韵",
      sub: "RING",
      glasses: 5,
      target: [0, 2, 4],
      decay: 1.85,
      hold: 0.26,
      time: 18,
      hintGlow: 0.7,
      hintFade: 2.6,
      listens: 2,
      sting: false,
      hint: "光会淡 · 趁余音还在"
    },
    {
      name: "密弦",
      sub: "CHORD",
      glasses: 5,
      target: [1, 2, 4],
      decay: 1.62,
      hold: 0.28,
      time: 16,
      hintGlow: 0,
      hintFade: 0,
      listens: 2,
      sting: false,
      hint: "凭耳朵认杯子 · 空格再听"
    },
    {
      name: "快碰",
      sub: "SNAP",
      glasses: 6,
      target: [0, 2, 3, 5],
      decay: 1.32,
      hold: 0.28,
      time: 16,
      hintGlow: 0,
      hintFade: 0,
      listens: 1,
      sting: false,
      hint: "余音短 · 要连敲"
    },
    {
      name: "错盏",
      sub: "DECOY",
      glasses: 7,
      target: [1, 3, 5],
      decay: 1.26,
      hold: 0.3,
      time: 15,
      hintGlow: 0,
      hintFade: 0,
      listens: 1,
      sting: true,
      hint: "错杯会破弦 · 只敲目标"
    },
    {
      name: "满席",
      sub: "TOAST",
      glasses: 7,
      target: [0, 2, 3, 4, 6],
      decay: 1.2,
      hold: 0.3,
      time: 16,
      hintGlow: 0,
      hintFade: 0,
      listens: 1,
      sting: true,
      hint: "五音齐鸣 · 错盏即破"
    },
    {
      name: "终响",
      sub: "FINALE",
      glasses: 8,
      target: [0, 2, 3, 5, 7],
      decay: 1.08,
      hold: 0.28,
      time: 15,
      hintGlow: 0,
      hintFade: 0,
      listens: 1,
      sting: true,
      hint: "满席碰杯 · 余音极短"
    }
  ];

  const canvas = document.getElementById("view");
  const ctx = canvas.getContext("2d", { alpha: false });
  const hud = document.getElementById("hud");
  const hintEl = document.getElementById("hint");
  const doorEl = document.getElementById("door");
  const fitEl = document.getElementById("fit");
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
    barY: 400,
    plaqueY: 140,
    glasses: [],
    left: 0,
    right: 0,
    scale: 1
  };

  const G = {
    mode: "title",
    phase: "listen",
    room: 0,
    lives: LIVES,
    remain: 22,
    listens: 2,
    listenI: 0,
    listenWait: 0,
    listenKind: "arp",
    ring: [0, 0, 0, 0, 0, 0, 0, 0],
    pulse: [0, 0, 0, 0, 0, 0, 0, 0],
    flash: [0, 0, 0, 0, 0, 0, 0, 0],
    hover: -1,
    matchT: 0,
    toastT: 0,
    toastMsgT: 0,
    hurtT: 0,
    lean: 0,
    spark: 0,
    alive: 0,
    shake: 0,
    flashScr: 0,
    flashRgb: { r: 255, g: 61, b: 184 },
    paused: false,
    clock: 0,
    t: 0,
    lock: 0,
    why: "",
    extras: 0,
    hits: 0,
    need: 2,
    muddy: false,
    holdFrac: 0,
    demoWait: 0.8,
    demoStep: 0
  };

  const motes = [];
  const particles = [];
  const ripples = [];

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    tickAt: 0,
    ensure: function () {
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
    setMuted: function (m) {
      this.muted = m;
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) {}
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
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
      o.stop(t + dur + 0.05);
    },
    chime: function (i, vol) {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const f = GLASSES[i].freq;
      const t = this.ctx.currentTime;
      const v = vol != null ? vol : 0.15;
      this.tone(f, 1.22, "sine", v, t);
      this.tone(f * 2.03, 0.58, "sine", v * 0.26, t);
      this.tone(f * 4.86, 0.1, "sine", v * 0.2, t);
      this.tone(f * 6.72, 0.05, "triangle", v * 0.05, t);
    },
    chord: function (indices, vol) {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const v = vol != null ? vol : 0.1;
      for (let k = 0; k < indices.length; k++) {
        const f = GLASSES[indices[k]].freq;
        this.tone(f, 0.85, "sine", v, t + k * 0.012);
        this.tone(f * 2.02, 0.4, "sine", v * 0.18, t + k * 0.012);
      }
    },
    tick: function () {
      this.ensure();
      this.tone(880, 0.05, "square", 0.03);
    },
    clink: function () {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.tone(1320, 0.08, "sine", 0.09, t);
      this.tone(1980, 0.12, "sine", 0.05, t);
      this.tone(880, 0.22, "triangle", 0.06, t + 0.04);
    },
    match: function (indices) {
      this.clink();
      this.chord(indices, 0.11);
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.tone(523, 0.18, "sine", 0.07, t + 0.12);
      this.tone(659, 0.22, "sine", 0.07, t + 0.2);
      this.tone(784, 0.4, "sine", 0.08, t + 0.3);
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
      this.tone(261, 0.18, "sine", 0.1, t);
      this.tone(329, 0.2, "triangle", 0.08, t + 0.1);
      this.tone(392, 0.24, "sine", 0.08, t + 0.2);
      this.tone(523, 0.5, "sine", 0.1, t + 0.34);
    },
    start: function () {
      this.ensure();
      this.tone(220, 0.16, "sine", 0.07, null, 440);
      this.tone(330, 0.22, "triangle", 0.05, null, 660);
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
  function stage() {
    return STAGES[G.room];
  }
  function glassCount() {
    if (G.mode === "play") return stage().glasses;
    return 5;
  }
  function cssRgb(c, a) {
    if (a == null) return "rgb(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + ")";
    return "rgba(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + "," + a + ")";
  }
  function isTarget(i) {
    const t = G.mode === "play" ? stage().target : [0, 2];
    for (let k = 0; k < t.length; k++) if (t[k] === i) return true;
    return false;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 56; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.38 + 0.05,
        p: Math.random() * TAU,
        s: 0.1 + Math.random() * 0.28
      });
    }
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
        rad: rand(spec.r0, spec.r1),
        r: spec.col.r,
        g: spec.col.g,
        b: spec.col.b
      });
    }
  }

  function spawnRipple(x, y, col, vis) {
    if (ripples.length > 20) ripples.shift();
    ripples.push({
      x: x,
      y: y,
      r: 6,
      life: 0.62,
      max: 0.62,
      col: col,
      vis: vis
    });
  }

  function toast(msg, bad) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("bad", !!bad);
    toastEl.classList.remove("hidden");
    G.toastMsgT = 1.4;
  }

  function layoutGlasses(n) {
    L.glasses.length = 0;
    const top = 86;
    const bot = 118;
    const playH = Math.max(160, H - top - bot);
    L.plaqueY = top + clamp(playH * 0.16, 36, 72);
    const plaqueBottom = L.plaqueY + 42;
    L.barY = top + playH * 0.84;
    const room = Math.max(64, L.barY - plaqueBottom - 6);
    const maxW = Math.min(W - 28, 860);
    const gap = maxW / Math.max(n, 2.6);
    L.scale = clamp(Math.min(gap / 72, room / 108, playH / 260), 0.42, 1.14);
    const start = W * 0.5 - ((n - 1) * gap) * 0.5;
    L.left = start;
    L.right = start + (n - 1) * gap;
    for (let i = 0; i < n; i++) {
      const g = GLASSES[i];
      const s = L.scale * (1.06 - i * 0.016);
      const bw = (34 + (1 - g.fill) * 8) * s;
      const bh = 54 * s;
      const stem = 34 * s;
      L.glasses.push({
        i: i,
        x: start + i * gap,
        y: L.barY,
        s: s,
        bw: bw,
        bh: bh,
        stem: stem,
        foot: 22 * s,
        rimY: L.barY - stem - bh
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
    layoutGlasses(glassCount());
  }

  function clearRings() {
    for (let i = 0; i < 8; i++) {
      G.ring[i] = 0;
      G.pulse[i] = 0;
      G.flash[i] = 0;
    }
    G.matchT = 0;
    G.holdFrac = 0;
    G.lean = 0;
    G.spark = 0;
  }

  function beginListen() {
    const st = stage();
    G.phase = "listen";
    G.listenI = 0;
    G.listenWait = 0.22;
    G.listenKind = "arp";
    G.lock = 0.05;
    clearRings();
    G.alive = 0;
    G.remain = st.time;
    syncHud();
  }

  function enterRoom(i) {
    G.room = i;
    G.toastT = 0;
    G.hurtT = 0;
    G.lean = 0;
    G.spark = 0;
    G.listens = stage().listens;
    G.need = stage().target.length;
    layoutGlasses(stage().glasses);
    beginListen();
  }

  function resetRun() {
    G.t = 0;
    G.lives = LIVES;
    G.hover = -1;
    G.shake = 0;
    G.flashScr = 0;
    G.toastMsgT = 0;
    G.paused = false;
    G.clock = 0;
    G.why = "";
    G.lock = 0.1;
    G.demoStep = 0;
    particles.length = 0;
    ripples.length = 0;
    enterRoom(0);
  }

  function chordState() {
    const st = G.mode === "play" ? stage() : null;
    const n = glassCount();
    const target = st ? st.target : [0, 2];
    let hits = 0;
    let extras = 0;
    for (let i = 0; i < n; i++) {
      const on = G.ring[i] >= ACTIVE;
      if (!on) continue;
      let want = false;
      for (let k = 0; k < target.length; k++) if (target[k] === i) want = true;
      if (want) hits += 1;
      else extras += 1;
    }
    const perfect = hits === target.length && extras === 0;
    return { hits: hits, extras: extras, need: target.length, perfect: perfect, muddy: extras > 0 };
  }

  function syncHud() {
    const st = stage();
    const cs = chordState();
    G.hits = cs.hits;
    G.extras = cs.extras;
    G.need = cs.need;
    G.muddy = cs.muddy;

    doorEl.textContent = G.room + 1 + "/" + STAGES.length;
    fitEl.textContent = cs.hits + "/" + cs.need;
    fitEl.classList.toggle("hot", cs.perfect);
    fitEl.classList.toggle("mud", cs.muddy);
    fitEl.classList.toggle("warn", false);

    const tl = G.remain < 10 ? G.remain.toFixed(1) : String(Math.ceil(G.remain));
    timeEl.textContent = tl;
    timeEl.classList.toggle("warn", G.remain <= 8);

    btnListen.textContent = "再听 " + G.listens;
    btnListen.disabled = G.mode !== "play" || G.phase !== "ring" || G.listens <= 0;

    pipsEl.innerHTML = "";
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement("span");
      s.className = "pip" + (i < G.lives ? " on" : "") + (G.lives === 1 && i === 0 ? " warn" : "");
      pipsEl.appendChild(s);
    }

    const buttons = dock.children;
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("off", i >= st.glasses);
    }

    let h = st.hint;
    let cls = "hint";
    if (G.phase === "listen") {
      h = "席上在唱目标和弦 · 听";
      cls = "hint gold";
    } else if (G.phase === "ring") {
      if (cs.muddy) {
        h = "杂音 · 等错杯余音散掉";
        cls = "hint warn";
      } else if (cs.perfect) {
        h = "对上了 · 稳住";
        cls = "hint hot";
      } else if (G.lives === 1) {
        h = "最后一条命 · " + st.hint;
        cls = "hint warn";
      } else {
        h = st.hint;
        cls = cs.hits > 0 ? "hint gold" : "hint";
      }
    } else if (G.phase === "toast") {
      h = st.name + " · 碰上了";
      cls = "hint hot";
    } else if (G.phase === "hurt") {
      h = G.why || "弦散了";
      cls = "hint warn";
    }
    hintEl.textContent = h;
    hintEl.className = cls;
  }

  function showPanel(kind) {
    panel.classList.remove("hidden");
    card.classList.remove("win", "lose");
    if (kind === "title") {
      kickerEl.textContent = "TUNE";
      titleEl.textContent = "碰杯";
      leadEl.innerHTML = "敲杯子凑出目标和弦。<br />要一起响，多敲一只都不算。";
      metaEl.textContent = "九席碰杯，三条命。余音会散，后席要连敲。";
      btnMain.textContent = "入席";
      footEl.textContent = "1–8 / ASDFJKL; 敲杯 · 空格再听 · M 静音";
    } else if (kind === "win") {
      card.classList.add("win");
      kickerEl.textContent = "FULL TOAST";
      titleEl.textContent = "满席都碰上了";
      leadEl.textContent = "九席和弦都齐了。杯沿还在发光。";
      metaEl.textContent = "命 " + G.lives + " · 终席余音极短";
      btnMain.textContent = "再入一席";
      footEl.textContent = "空格 / 回车 · R 重开";
    } else {
      card.classList.add("lose");
      kickerEl.textContent = "SHATTER";
      titleEl.textContent = G.why === "余音散了" ? "席散了" : "杯子碎了";
      leadEl.textContent =
        G.why === "余音散了" ? "时限里没凑齐和弦，余音散尽。" : "敲错盏，弦断了。";
      metaEl.textContent = "碰到第 " + Math.min(G.room + 1, STAGES.length) + " 席 · 契合 " + G.hits + "/" + G.need;
      btnMain.textContent = "再入一席";
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
    if (win) {
      audio.win();
      const mid = L.glasses[Math.floor(L.glasses.length / 2)];
      if (mid) {
        emit(42, {
          x: mid.x,
          y: mid.rimY,
          j: 28,
          vx0: -120,
          vx1: 120,
          vy0: -150,
          vy1: 40,
          life: 1.2,
          r0: 2,
          r1: 5.5,
          col: { r: 0, g: 240, b: 255 }
        });
      }
    } else {
      audio.lose();
      G.flashScr = 1;
      G.shake = 12;
      G.flashRgb = { r: 255, g: 61, b: 184 };
    }
    showPanel(G.mode);
  }

  function beginToast() {
    G.phase = "toast";
    G.toastT = 0;
    G.lock = 0.2;
    G.lean = 0;
    G.spark = 0;
    audio.match(stage().target);
    toast(stage().name + " 碰上了");
    const tgs = stage().target;
    for (let k = 0; k < tgs.length; k++) {
      const g = L.glasses[tgs[k]];
      if (!g) continue;
      emit(14, {
        x: g.x,
        y: g.rimY,
        j: 10,
        vx0: -70,
        vx1: 70,
        vy0: -110,
        vy1: 10,
        life: 0.8,
        r0: 1.4,
        r1: 3.8,
        col: GLASSES[tgs[k]]
      });
    }
    syncHud();
  }

  function beginHurt(why) {
    G.lives -= 1;
    G.phase = "hurt";
    G.hurtT = 0;
    G.why = why;
    G.shake = 10;
    G.flashScr = 1;
    G.flashRgb = { r: 255, g: 61, b: 184 };
    audio.reject();
    toast(why + " −1", true);
    if (G.lives <= 0) {
      endGame(false);
      return;
    }
    syncHud();
  }

  function strikeVisual(i, vis) {
    const g = L.glasses[i];
    const col = GLASSES[i];
    G.pulse[i] = 1;
    G.flash[i] = Math.max(G.flash[i], vis);
    if (g) {
      spawnRipple(g.x, g.rimY, col, vis);
      emit(7 + ((vis * 6) | 0), {
        x: g.x,
        y: g.rimY,
        j: 8,
        vx0: -55,
        vx1: 55,
        vy0: -80,
        vy1: 8,
        life: 0.5 + vis * 0.2,
        r0: 1.1,
        r1: 3.1,
        col: col
      });
    }
  }

  function strike(i) {
    if (G.mode !== "play" || G.phase !== "ring") return;
    if (G.lock > 0) return;
    const n = stage().glasses;
    if (i < 0 || i >= n) return;
    audio.ensure();
    const sting = stage().sting && !isTarget(i);
    G.ring[i] = 1;
    strikeVisual(i, 1);
    audio.chime(i, sting ? 0.1 : 0.16);
    G.lock = 0.045;
    if (sting) {
      beginHurt("错盏破弦");
      return;
    }
    syncHud();
  }

  function replay() {
    if (G.mode !== "play" || G.phase !== "ring") return;
    if (G.lock > 0) return;
    if (G.listens <= 0) {
      toast("听完了", true);
      return;
    }
    G.listens -= 1;
    audio.ensure();
    G.phase = "listen";
    G.listenI = 0;
    G.listenWait = 0.16;
    G.listenKind = "arp";
    G.lock = 0.05;
    toast("再听");
    syncHud();
  }

  function hintAmt(i) {
    const flash = G.flash[i];
    if (G.mode !== "play") return Math.max(flash, isTarget(i) ? 0.35 : 0);
    if (!isTarget(i)) return flash;
    const st = stage();
    let h = st.hintGlow;
    if (st.hintFade > 0) h *= clamp(1 - G.alive / st.hintFade, 0, 1);
    return Math.max(h, flash);
  }

  function updateDemo(dt) {
    G.demoWait -= dt;
    if (G.demoWait > 0) return;
    const step = G.demoStep % 6;
    if (step === 0) {
      strikeVisual(0, 0.75);
      G.ring[0] = 0.9;
      if (audio.ctx && audio.ctx.state === "running") audio.chime(0, 0.1);
      G.demoWait = 0.42;
    } else if (step === 1) {
      strikeVisual(2, 0.75);
      G.ring[2] = 0.9;
      if (audio.ctx && audio.ctx.state === "running") audio.chime(2, 0.1);
      G.demoWait = 0.55;
    } else if (step === 2) {
      G.lean = 0.01;
      G.spark = 1;
      if (audio.ctx && audio.ctx.state === "running") audio.clink();
      G.demoWait = 0.7;
    } else if (step === 3) {
      G.lean = 0;
      G.spark = 0;
      G.ring[0] = 0;
      G.ring[2] = 0;
      G.demoWait = 1.6;
    } else {
      G.demoWait = 0.4;
    }
    G.demoStep += 1;
  }

  function updateFx(dt) {
    G.clock += dt;
    G.shake *= Math.pow(0.001, dt);
    if (G.shake < 0.15) G.shake = 0;
    G.flashScr = Math.max(0, G.flashScr - dt * 1.8);
    G.spark = Math.max(0, G.spark - dt * 1.4);

    const st = G.mode === "play" ? stage() : null;
    const decay = st ? st.decay : 2.2;
    for (let i = 0; i < 8; i++) {
      G.ring[i] = Math.max(0, G.ring[i] - dt / decay);
      G.pulse[i] = Math.max(0, G.pulse[i] - dt * 3.4);
      G.flash[i] = Math.max(0, G.flash[i] - dt * 1.7);
    }

    if (G.phase === "toast") {
      G.lean = smooth(clamp(G.toastT / 0.38, 0, 1)) * (1 - smooth(clamp((G.toastT - 0.55) / 0.4, 0, 1)));
    } else if (G.mode === "title") {
      if (G.lean > 0) G.lean = Math.min(1, G.lean + dt * 2.4);
    } else {
      G.lean = Math.max(0, G.lean - dt * 2.2);
    }

    if (G.toastMsgT > 0) {
      G.toastMsgT -= dt;
      if (G.toastMsgT <= 0) toastEl.classList.add("hidden");
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 110 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life -= dt;
      r.r += 130 * dt;
      if (r.life <= 0) ripples.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y -= dt * m.s * 0.03;
      if (m.y < 0) m.y += 1;
    }
  }

  function updateListen(dt) {
    const st = stage();
    const tgs = st.target;
    G.listenWait -= dt;
    if (G.listenWait > 0) return;
    if (G.listenKind === "arp") {
      if (G.listenI < tgs.length) {
        const idx = tgs[G.listenI];
        strikeVisual(idx, 0.85);
        audio.chime(idx, 0.13);
        G.listenI += 1;
        G.listenWait = 0.2;
      } else {
        G.listenKind = "chord";
        G.listenWait = 0.18;
      }
    } else if (G.listenKind === "chord") {
      audio.chord(tgs, 0.1);
      for (let k = 0; k < tgs.length; k++) strikeVisual(tgs[k], 1);
      G.listenKind = "done";
      G.listenWait = 0.42;
    } else {
      G.phase = "ring";
      G.lock = 0.08;
      toast("敲吧");
      syncHud();
    }
  }

  function update(dt) {
    if (G.lock > 0) G.lock -= dt;
    updateFx(dt);

    if (G.mode === "title") {
      updateDemo(dt);
      return;
    }
    if (G.mode !== "play" || G.paused) return;

    G.t += dt;

    if (G.phase === "listen") {
      updateListen(dt);
      return;
    }

    if (G.phase === "toast") {
      G.toastT += dt;
      if (G.toastT > 0.34 && G.spark < 0.2) G.spark = 1;
      if (G.toastT >= 1.05) {
        if (G.room + 1 >= STAGES.length) {
          endGame(true);
          return;
        }
        enterRoom(G.room + 1);
      }
      return;
    }

    if (G.phase === "hurt") {
      G.hurtT += dt;
      if (G.hurtT >= 0.7) beginListen();
      return;
    }

    if (G.phase !== "ring") return;

    G.alive += dt;
    G.remain -= dt;
    if (G.remain <= 0) {
      G.remain = 0;
      G.why = "余音散了";
      beginHurt("余音散了");
      return;
    }
    if (G.remain <= 8 && G.remain > 0) {
      const k = Math.ceil(G.remain);
      if (k !== audio.tickAt) {
        audio.tickAt = k;
        audio.tick();
      }
    }

    const cs = chordState();
    G.hits = cs.hits;
    G.extras = cs.extras;
    G.muddy = cs.muddy;
    if (cs.perfect) {
      G.matchT += dt;
      G.holdFrac = clamp(G.matchT / stage().hold, 0, 1);
      if (G.matchT >= stage().hold) beginToast();
    } else {
      G.matchT = Math.max(0, G.matchT - dt * 2.4);
      G.holdFrac = clamp(G.matchT / stage().hold, 0, 1);
    }

    const tl = G.remain < 10 ? G.remain.toFixed(1) : String(Math.ceil(G.remain));
    if (timeEl.textContent !== tl) {
      timeEl.textContent = tl;
      timeEl.classList.toggle("warn", G.remain <= 8);
    }
    const fit = cs.hits + "/" + cs.need;
    if (fitEl.textContent !== fit) fitEl.textContent = fit;
    fitEl.classList.toggle("hot", cs.perfect);
    fitEl.classList.toggle("mud", cs.muddy);

    let h;
    let cls;
    if (cs.muddy) {
      h = "杂音 · 等错杯余音散掉";
      cls = "hint warn";
    } else if (cs.perfect) {
      h = "对上了 · 稳住";
      cls = "hint hot";
    } else if (G.lives === 1) {
      h = "最后一条命 · " + stage().hint;
      cls = "hint warn";
    } else {
      h = stage().hint;
      cls = cs.hits > 0 ? "hint gold" : "hint";
    }
    if (hintEl.textContent !== h) {
      hintEl.textContent = h;
      hintEl.className = cls;
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

  function drawBg() {
    const g = ctx.createRadialGradient(W * 0.3, H * 0.06, 0, W * 0.5, H * 0.55, Math.max(W, H) * 0.88);
    g.addColorStop(0, "#14081c");
    g.addColorStop(0.5, "#080510");
    g.addColorStop(1, "#05030c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.84, H * 0.12, 0, W * 0.84, H * 0.12, W * 0.5);
    g2.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    const g3 = ctx.createRadialGradient(W * 0.18, H * 0.9, 0, W * 0.18, H * 0.9, W * 0.48);
    g3.addColorStop(0, "rgba(255, 61, 184, 0.08)");
    g3.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = "#7af6ff";
    ctx.lineWidth = 1;
    const step = 42;
    const ox = (G.clock * 6) % step;
    for (let x = -step + ox; x < W + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H * 0.04, H);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * 1.35 + m.p);
      ctx.fillStyle = "rgba(200, 230, 255," + m.a * tw + ")";
      ctx.beginPath();
      ctx.arc(m.x * W, m.y * H, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawBar() {
    const y = L.barY + 10;
    const pad = Math.max(36, L.scale * 40);
    const x0 = L.left - pad;
    const x1 = L.right + pad;
    ctx.beginPath();
    pathRoundRect(x0, y - 10, x1 - x0, 24, 10);
    const grd = ctx.createLinearGradient(0, y - 10, 0, y + 14);
    grd.addColorStop(0, "rgba(0, 240, 255, 0.14)");
    grd.addColorStop(0.35, "rgba(22, 14, 34, 0.92)");
    grd.addColorStop(1, "rgba(5, 3, 12, 0.15)");
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 61, 184, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x0 + 16, y - 6);
    ctx.lineTo(x1 - 16, y - 6);
    ctx.strokeStyle = "rgba(255, 227, 107, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function bowlPath(g) {
    const joinY = -g.stem;
    const rimY = joinY - g.bh;
    const bw = g.bw;
    ctx.beginPath();
    ctx.moveTo(0, joinY);
    ctx.bezierCurveTo(-bw * 0.58, joinY - g.bh * 0.22, -bw * 0.55, rimY + 11 * g.s, -bw * 0.46, rimY);
    ctx.lineTo(bw * 0.46, rimY);
    ctx.bezierCurveTo(bw * 0.55, rimY + 11 * g.s, bw * 0.58, joinY - g.bh * 0.22, 0, joinY);
    ctx.closePath();
  }

  function drawWineGlass(g, ring, hover, hinted, lean) {
    const col = GLASSES[g.i];
    const s = g.s;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(lean || 0);
    const lift = hover ? -5 : ring * -2;
    ctx.translate(0, lift);

    ctx.beginPath();
    ctx.ellipse(0, 7, g.foot * 0.72, 3.6 * s, 0, 0, TAU);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, g.foot * 0.52, 3.1 * s, 0, 0, TAU);
    ctx.fillStyle = "rgba(220,230,255,0.16)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.32)";
    ctx.lineWidth = 1.15;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(0, -g.stem);
    ctx.strokeStyle = "rgba(210, 225, 255, 0.58)";
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = "round";
    ctx.stroke();

    const joinY = -g.stem;
    const rimY = joinY - g.bh;
    const bw = g.bw;

    if (ring > 0.04 || hinted > 0.2) {
      ctx.beginPath();
      ctx.ellipse(0, rimY, bw * (0.7 + ring * 0.25), 10 * s, 0, 0, TAU);
      ctx.fillStyle = cssRgb(col, 0.06 + ring * 0.16 + hinted * 0.08);
      ctx.fill();
    }

    bowlPath(g);
    const glassGrad = ctx.createLinearGradient(-bw, rimY, bw, joinY);
    glassGrad.addColorStop(0, "rgba(0,240,255,0.09)");
    glassGrad.addColorStop(0.48, "rgba(255,255,255,0.07)");
    glassGrad.addColorStop(1, "rgba(255,61,184,0.08)");
    ctx.fillStyle = glassGrad;
    ctx.fill();
    ctx.strokeStyle = cssRgb(col, 0.4 + ring * 0.5 + (hover ? 0.2 : 0));
    ctx.lineWidth = 1.45;
    ctx.stroke();

    const fill = col.fill;
    const liqTop = joinY - g.bh * fill;
    ctx.save();
    bowlPath(g);
    ctx.clip();
    ctx.fillStyle = cssRgb(col, 0.36 + ring * 0.38);
    ctx.fillRect(-bw, liqTop, bw * 2, joinY - liqTop + 6);
    const amp = (1.4 + ring * 5.5) * s;
    ctx.beginPath();
    ctx.moveTo(-bw, joinY + 4);
    ctx.lineTo(-bw, liqTop);
    const waves = 12;
    for (let k = 0; k <= waves; k++) {
      const x = -bw + (k / waves) * bw * 2;
      const y = liqTop + Math.sin(x * 0.22 + G.clock * (5.5 + ring * 9) + g.i * 1.7) * amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(bw, joinY + 4);
    ctx.closePath();
    const liq = ctx.createLinearGradient(0, liqTop, 0, joinY);
    liq.addColorStop(0, cssRgb(col, 0.55 + ring * 0.25));
    liq.addColorStop(1, cssRgb({ r: col.r * 0.35, g: col.g * 0.35, b: col.b * 0.45 }, 0.5));
    ctx.fillStyle = liq;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, liqTop, bw * 0.42, 3.2 * s + amp * 0.15, 0, 0, TAU);
    ctx.fillStyle = cssRgb({ r: Math.min(255, col.r + 40), g: Math.min(255, col.g + 40), b: Math.min(255, col.b + 40) }, 0.28 + ring * 0.25);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(0, rimY, bw * 0.46, 3.3 * s, 0, 0, TAU);
    ctx.strokeStyle = cssRgb(col, 0.72 + ring * 0.28);
    ctx.lineWidth = 1.5 + ring * 1.5;
    ctx.shadowColor = cssRgb(col, 0.35 + ring * 0.65);
    ctx.shadowBlur = 5 + ring * 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(-bw * 0.26, rimY + 7 * s);
    ctx.quadraticCurveTo(-bw * 0.36, joinY - g.bh * 0.42, -3, joinY - 3);
    ctx.strokeStyle = "rgba(255,255,255," + (0.16 + ring * 0.22) + ")";
    ctx.lineWidth = 1.15;
    ctx.stroke();

    if (hinted > 0.05) {
      bowlPath(g);
      ctx.strokeStyle = "rgba(255,227,107," + (0.2 + hinted * 0.65) + ")";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = hover || ring > 0.22 ? cssRgb(col, 0.95) : "rgba(246,243,255,0.88)";
    ctx.font = "700 " + Math.max(11, 13 * s) + "px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(5,3,12,0.9)";
    ctx.shadowBlur = 6;
    ctx.fillText(col.key, 0, rimY + g.bh * 0.42);
    ctx.shadowBlur = 0;
    ctx.fillStyle = hover || ring > 0.22 ? cssRgb(col, 0.9) : "rgba(246,243,255,0.62)";
    ctx.font = "600 " + Math.max(9, 10 * s) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(col.name, 0, 8 * s);

    ctx.restore();
  }

  function toastLeanFor(g) {
    if (G.lean <= 0.01) return 0;
    if (G.mode === "play" && !isTarget(g.i)) return 0;
    if (G.mode === "title" && g.i !== 0 && g.i !== 2) return 0;
    const n = L.glasses.length;
    let sx = 0;
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (G.mode === "title") {
        if (i === 0 || i === 2) {
          sx += L.glasses[i].x;
          c += 1;
        }
      } else if (isTarget(i)) {
        sx += L.glasses[i].x;
        c += 1;
      }
    }
    if (!c) return 0;
    const mid = sx / c;
    const dir = g.x < mid ? 1 : g.x > mid ? -1 : 0;
    return dir * G.lean * 0.22;
  }

  function drawGlasses() {
    const n = L.glasses.length;
    for (let i = 0; i < n; i++) {
      const g = L.glasses[i];
      drawWineGlass(g, clamp(G.ring[i] + G.pulse[i] * 0.25, 0, 1), G.hover === i, hintAmt(i), toastLeanFor(g));
    }
    if (G.spark > 0.04 && n > 1) {
      let sx = 0;
      let sy = 0;
      let c = 0;
      for (let i = 0; i < n; i++) {
        const use = G.mode === "title" ? i === 0 || i === 2 : isTarget(i);
        if (!use) continue;
        sx += L.glasses[i].x;
        sy += L.glasses[i].rimY;
        c += 1;
      }
      if (c) {
        sx /= c;
        sy /= c;
        ctx.save();
        ctx.globalAlpha = G.spark;
        ctx.fillStyle = "#ffe36b";
        ctx.shadowColor = "#ffe36b";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sx, sy - 6, 4.5 + (1 - G.spark) * 6, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawPlaque() {
    const target = G.mode === "play" ? stage().target : [0, 2];
    const n = target.length;
    const cell = clamp(L.scale * 34, 22, 38);
    const w = cell * n + 56;
    const h = 78;
    const x = W * 0.5 - w * 0.5;
    const y = L.plaqueY - h * 0.5;
    const cs = chordState();
    const glow = cs.perfect ? 0.55 : 0.22;

    ctx.save();
    ctx.beginPath();
    pathRoundRect(x, y, w, h, 14);
    ctx.fillStyle = "rgba(8, 6, 18, 0.55)";
    ctx.fill();
    ctx.strokeStyle = cs.muddy
      ? "rgba(255, 61, 184, 0.5)"
      : cs.perfect
        ? "rgba(0, 240, 255, 0.55)"
        : "rgba(255, 227, 107, 0.28)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = "rgba(0,240,255,0.7)";
    ctx.font = "10px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(G.mode === "play" ? "目标和弦" : "碰杯", W * 0.5, y + 8);

    for (let k = 0; k < n; k++) {
      const idx = target[k];
      const col = GLASSES[idx];
      const cx = x + 28 + k * cell + cell * 0.15;
      const on = G.ring[idx] >= ACTIVE;
      const gy = y + 50;
      const ms = 0.42;
      ctx.save();
      ctx.translate(cx, gy);
      ctx.scale(ms, ms);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-22, -12, -20, -48, -16, -54);
      ctx.lineTo(16, -54);
      ctx.bezierCurveTo(20, -48, 22, -12, 0, 0);
      ctx.closePath();
      ctx.fillStyle = on ? cssRgb(col, 0.45 + glow * 0.3) : "rgba(255,255,255,0.05)";
      ctx.fill();
      ctx.strokeStyle = cssRgb(col, on ? 0.95 : 0.45);
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    const meterW = w - 28;
    const meterX = x + 14;
    const meterY = y + h - 12;
    ctx.beginPath();
    pathRoundRect(meterX, meterY, meterW, 4, 2);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    if (G.holdFrac > 0.01) {
      ctx.beginPath();
      pathRoundRect(meterX, meterY, meterW * G.holdFrac, 4, 2);
      ctx.fillStyle = cs.perfect ? "rgba(0,240,255,0.85)" : "rgba(255,227,107,0.7)";
      ctx.fill();
    }

    if (cs.muddy) {
      ctx.fillStyle = "rgba(255,61,184,0.9)";
      ctx.font = "10px Segoe UI, PingFang SC, sans-serif";
      ctx.fillText("杂音", W * 0.5, y + h + 6);
    }

    if (G.mode === "play") {
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(246,243,255,0.78)";
      ctx.font = "600 " + Math.max(12, L.scale * 14) + "px Segoe UI, PingFang SC, sans-serif";
      ctx.fillText(stage().name, W * 0.5, y - 16);
      ctx.fillStyle = "rgba(0,240,255,0.62)";
      ctx.font = "10px Segoe UI, sans-serif";
      ctx.fillText(stage().sub, W * 0.5, y - 4);
    }

    ctx.restore();
  }

  function drawRipples() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
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
    const vg = ctx.createRadialGradient(W * 0.5, L.barY - 40, H * 0.16, W * 0.5, H * 0.5, Math.max(W, H) * 0.74);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawBg();
    drawBar();
    drawPlaque();
    drawGlasses();
    drawRipples();
    drawParticles();
    drawScan();
    if (G.flashScr > 0) {
      ctx.fillStyle = cssRgb(G.flashRgb, G.flashScr * 0.22);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function hitAt(px, py) {
    let best = -1;
    let bestD = 1e9;
    const n = L.glasses.length;
    for (let i = 0; i < n; i++) {
      const g = L.glasses[i];
      const cx = g.x;
      const cy = g.y - g.stem - g.bh * 0.45;
      const dx = px - cx;
      const dy = py - cy;
      const rx = g.bw * 0.95;
      const ry = (g.bh + g.stem) * 0.72;
      const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (d < 1.2 && d < bestD) {
        best = i;
        bestD = d;
      }
    }
    return best;
  }

  function onPointer(e) {
    if (e.button != null && e.button !== 0) return;
    if (G.mode !== "play") return;
    const hit = hitAt(e.clientX, e.clientY);
    if (hit >= 0) {
      strike(hit);
      if (e.cancelable) e.preventDefault();
    }
  }

  function onMove(e) {
    const hit = hitAt(e.clientX, e.clientY);
    G.hover = hit;
    canvas.style.cursor = hit >= 0 ? "pointer" : "default";
  }

  function buildDock() {
    dock.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      const t = GLASSES[i];
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

  function keyToGlass(k) {
    if (k === "1" || k === "a" || k === "A" || k === "q" || k === "Q") return 0;
    if (k === "2" || k === "s" || k === "S" || k === "w" || k === "W") return 1;
    if (k === "3" || k === "d" || k === "D" || k === "e" || k === "E") return 2;
    if (k === "4" || k === "f" || k === "F") return 3;
    if (k === "5" || k === "j" || k === "J" || k === "t" || k === "T") return 4;
    if (k === "6" || k === "k" || k === "K" || k === "y" || k === "Y") return 5;
    if (k === "7" || k === "l" || k === "L" || k === "u" || k === "U") return 6;
    if (k === "8" || k === ";" || k === "i" || k === "I") return 7;
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
    const i = keyToGlass(k);
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
