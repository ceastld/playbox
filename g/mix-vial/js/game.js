(() => {
  "use strict";

  const UNIT = 4;
  const LIVES = 3;
  const DURATION = 90;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-mix-vial-mute";

  const PRIM = {
    r: { r: 255, g: 48, b: 88, name: "红", key: "Q" },
    g: { r: 40, g: 255, b: 110, name: "绿", key: "W" },
    b: { r: 48, g: 160, b: 255, name: "蓝", key: "E" }
  };
  const CHS = ["r", "g", "b"];

  const ROOMS = [
    { name: "赤锁", sub: "RED", r: 4, g: 0, b: 0, cap: 4, dumps: 2, hint: "门锁是红的 · 点红滴管" },
    { name: "绛门", sub: "MAG", r: 3, g: 0, b: 2, cap: 5, dumps: 2, hint: "红加蓝，往品红靠" },
    { name: "青钥", sub: "CYAN", r: 0, g: 3, b: 3, cap: 6, dumps: 2, hint: "绿与蓝等量，会出青色" },
    { name: "琥珀", sub: "AMBER", r: 4, g: 2, b: 0, cap: 6, dumps: 2, hint: "红多绿少，调出琥珀" },
    { name: "霓虹", sub: "NEON", r: 3, g: 1, b: 4, cap: 8, dumps: 1, hint: "三色都要，蓝略多" }
  ];

  const canvas = document.getElementById("view");
  const ctx = canvas.getContext("2d", { alpha: false });
  const hud = document.getElementById("hud");
  const hintEl = document.getElementById("hint");
  const doorEl = document.getElementById("door");
  const fitEl = document.getElementById("fit");
  const timeEl = document.getElementById("time");
  const pipsEl = document.getElementById("pips");
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
  const btnDump = document.getElementById("btn-dump");
  const btnR = document.getElementById("btn-r");
  const btnG = document.getElementById("btn-g");
  const btnB = document.getElementById("btn-b");
  const toastEl = document.getElementById("toast");

  let W = 1;
  let H = 1;
  let dpr = 1;

  const L = {
    portrait: false,
    vialX: 0,
    vialY: 0,
    vialS: 0,
    doorX: 0,
    doorY: 0,
    doorW: 0,
    doorH: 0,
    lockX: 0,
    lockY: 0,
    lockR: 0,
    tapX: 0,
    tapY: 0,
    drop: [
      { x: 0, y: 0, ch: "r" },
      { x: 0, y: 0, ch: "g" },
      { x: 0, y: 0, ch: "b" }
    ]
  };

  const G = {
    mode: "title",
    phase: "mix",
    room: 0,
    r: 0,
    g: 0,
    b: 0,
    dumps: 2,
    lives: LIVES,
    remain: DURATION,
    sel: 0,
    hover: -1,
    squeeze: [0, 0, 0],
    fillShow: 0,
    show: { r: 18, g: 16, b: 28 },
    swirl: 0,
    openT: 0,
    doorGap: 0,
    drainT: 0,
    drainCol: { r: 18, g: 16, b: 28 },
    hurtT: 0,
    rejectIn: -1,
    shake: 0,
    flash: 0,
    flashRgb: { r: 255, g: 61, b: 184 },
    toastT: 0,
    paused: false,
    clock: 0,
    t: 0,
    lock: 0
  };

  const motes = [];
  const drops = [];
  const particles = [];
  const bubbles = [];
  const splashes = [];

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
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) {}
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
      btnMute.textContent = m ? "静" : "音";
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      btnMute.classList.toggle("muted", m);
    },
    beep: function (freq, dur, type, vol, slide) {
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
    drip: function (ch) {
      this.ensure();
      const f = ch === "r" ? 520 : ch === "g" ? 640 : 760;
      this.beep(f, 0.09, "sine", 0.09, f * 0.55);
      this.beep(f * 0.5, 0.12, "triangle", 0.04, f * 0.3);
    },
    land: function (ch) {
      this.ensure();
      const f = ch === "r" ? 180 : ch === "g" ? 210 : 240;
      this.beep(f, 0.14, "sine", 0.05, 90);
    },
    dump: function () {
      this.ensure();
      this.beep(240, 0.28, "triangle", 0.07, 70);
      this.beep(90, 0.32, "sine", 0.05, 40);
    },
    overflow: function () {
      this.ensure();
      this.beep(160, 0.45, "sawtooth", 0.1, 50);
      this.beep(70, 0.55, "square", 0.06, 36);
    },
    match: function () {
      this.ensure();
      this.beep(392, 0.18, "triangle", 0.09, 784);
      this.beep(523, 0.28, "sine", 0.07, 1046);
      this.beep(784, 0.4, "sine", 0.05, 1175);
    },
    reject: function () {
      this.ensure();
      this.beep(140, 0.22, "square", 0.07, 90);
    },
    lose: function () {
      this.ensure();
      this.beep(180, 0.55, "sawtooth", 0.1, 50);
      this.beep(90, 0.7, "square", 0.06, 40);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.2, "triangle", 0.1, 880);
      this.beep(660, 0.35, "sine", 0.07, 1320);
      this.beep(880, 0.5, "sine", 0.05, 1760);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.16, "sine", 0.07, 440);
      this.beep(330, 0.22, "triangle", 0.05, 660);
    },
    tick: function () {
      this.ensure();
      this.beep(880, 0.06, "square", 0.04);
    },
    tickDrone: function () {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 62;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const tot = G.r + G.g + G.b;
      const f = 58 + G.r * 8 + G.b * 6 + G.g * 4;
      this.drone.frequency.setTargetAtTime(f, t, 0.12);
      const vol = G.mode === "play" && G.phase !== "open" ? 0.018 + tot * 0.004 : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.15);
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
  function room() {
    return ROOMS[G.room];
  }
  function cssRgb(c, a) {
    if (a == null) return "rgb(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + ")";
    return "rgba(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + "," + a + ")";
  }
  function mixRgb(nr, ng, nb) {
    if (nr + ng + nb <= 0) return { r: 18, g: 16, b: 28 };
    return {
      r: Math.min(255, Math.round((nr * 255) / UNIT)),
      g: Math.min(255, Math.round((ng * 255) / UNIT)),
      b: Math.min(255, Math.round((nb * 255) / UNIT))
    };
  }
  function targetRgb() {
    const rm = room();
    return mixRgb(rm.r, rm.g, rm.b);
  }
  function distMan() {
    const rm = room();
    return Math.abs(G.r - rm.r) + Math.abs(G.g - rm.g) + Math.abs(G.b - rm.b);
  }
  function fit01() {
    const rm = room();
    const max = rm.r + rm.g + rm.b;
    return 1 - distMan() / max;
  }
  function isMatch() {
    const rm = room();
    return G.r === rm.r && G.g === rm.g && G.b === rm.b;
  }
  function filledLanded() {
    return G.r + G.g + G.b;
  }
  function inFlight() {
    let n = 0;
    for (let i = 0; i < drops.length; i++) if (drops[i].live) n++;
    return n;
  }
  function totNow() {
    return filledLanded() + inFlight();
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 56; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.4 + 0.06,
        p: Math.random() * TAU,
        s: 0.15 + Math.random() * 0.35
      });
    }
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
        rad: rand(spec.r0, spec.r1),
        r: spec.col.r,
        g: spec.col.g,
        b: spec.col.b
      });
    }
  }

  function toast(msg, bad) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("bad", !!bad);
    toastEl.classList.remove("hidden");
    G.toastT = 1.55;
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

    L.portrait = H > W * 1.08;
    const m = Math.min(W, H);
    if (L.portrait) {
      L.doorW = Math.min(W * 0.68, m * 0.62);
      L.doorH = Math.min(H * 0.26, m * 0.44);
      L.doorX = W * 0.5;
      L.doorY = Math.max(H * 0.23, 104);
      L.vialS = Math.min(m * 0.42, H * 0.28);
      L.vialX = W * 0.5;
      L.vialY = Math.min(H * 0.6, H - 198);
    } else {
      L.vialS = Math.min(m * 0.52, W * 0.36);
      L.vialX = W * 0.3;
      L.vialY = H * 0.54;
      L.doorW = Math.min(W * 0.34, m * 0.62);
      L.doorH = Math.min(H * 0.6, m * 0.76);
      L.doorX = W * 0.73;
      L.doorY = H * 0.52;
    }
    L.lockX = L.doorX;
    L.lockY = L.doorY - L.doorH * 0.04;
    L.lockR = Math.min(L.doorW, L.doorH) * 0.22;
    L.tapX = L.vialX;
    L.tapY = L.vialY + L.vialS * 0.48;
    const spread = L.vialS * 0.42;
    for (let i = 0; i < 3; i++) {
      L.drop[i].x = L.vialX + (i - 1) * spread;
      L.drop[i].y = L.vialY - L.vialS * 0.78;
      L.drop[i].ch = CHS[i];
    }
  }

  function resetMix() {
    G.r = 0;
    G.g = 0;
    G.b = 0;
    G.fillShow = 0;
    G.show = { r: 18, g: 16, b: 28 };
    G.swirl = 0;
    G.rejectIn = -1;
    drops.length = 0;
    bubbles.length = 0;
  }

  function enterRoom(i) {
    G.room = i;
    G.phase = "mix";
    G.openT = 0;
    G.doorGap = 0;
    G.drainT = 0;
    G.hurtT = 0;
    G.lock = 0.18;
    G.dumps = room().dumps;
    resetMix();
    syncHud();
  }

  function resetRun() {
    G.t = 0;
    G.remain = DURATION;
    G.lives = LIVES;
    G.sel = 0;
    G.hover = -1;
    G.squeeze = [0, 0, 0];
    G.shake = 0;
    G.flash = 0;
    G.toastT = 0;
    G.paused = false;
    G.clock = 0;
    particles.length = 0;
    splashes.length = 0;
    enterRoom(0);
  }

  function syncHud() {
    const rm = room();
    doorEl.textContent = G.room + 1 + "/" + ROOMS.length;
    const pct = Math.round(fit01() * 100);
    fitEl.textContent = pct + "%";
    fitEl.classList.toggle("hot", pct >= 100);
    fitEl.classList.toggle("warn", filledLanded() >= rm.cap && pct < 100);
    const tl = G.remain < 10 ? G.remain.toFixed(1) : String(Math.ceil(G.remain));
    timeEl.textContent = tl;
    timeEl.classList.toggle("warn", G.remain <= 10);
    btnDump.textContent = "倾倒 " + G.dumps;
    btnDump.disabled = G.dumps <= 0 || G.phase !== "mix";

    pipsEl.innerHTML = "";
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement("span");
      s.className = "pip" + (i < G.lives ? " on" : "") + (G.lives === 1 && i === 0 ? " warn" : "");
      pipsEl.appendChild(s);
    }

    let h = rm.hint;
    let cls = "hint";
    if (G.phase === "open") {
      h = "门锁开了";
      cls = "hint hot";
    } else if (G.phase === "drain") {
      h = "倒掉重调";
      cls = "hint gold";
    } else if (filledLanded() >= rm.cap && !isMatch()) {
      h = G.dumps > 0 ? "满了但对不上 · 倾倒再调" : "倾倒用尽 · 再滴会溢";
      cls = "hint warn";
    } else if (pct >= 70 && pct < 100) {
      h = "很接近了";
      cls = "hint gold";
    } else if (filledLanded() === 0) {
      h = G.room === 0 ? rm.hint : "Q 红 · W 绿 · E 蓝 · X 倾倒";
    }
    hintEl.textContent = h;
    hintEl.className = cls;
  }

  function showPanel(kind) {
    panel.classList.remove("hidden");
    card.classList.remove("win", "lose");
    if (kind === "title") {
      kickerEl.textContent = "MIX";
      titleEl.textContent = "调色";
      leadEl.innerHTML = "三原色滴入瓶中。<br />调到门锁的颜色，门才会开。";
      metaEl.textContent = "五扇门，三瓶命。溢满或超时则败。";
      btnMain.textContent = "开锁";
      footEl.textContent = "QWE 滴色 · X 倾倒 · M 静音";
    } else if (kind === "win") {
      card.classList.add("win");
      kickerEl.textContent = "OPEN";
      titleEl.textContent = "门已尽开";
      leadEl.textContent = "五道色锁都对上了。走廊那头亮起来。";
      metaEl.textContent =
        "剩余 " + G.remain.toFixed(1) + " 秒 · 命 " + G.lives;
      btnMain.textContent = "再调一瓶";
      footEl.textContent = "空格 / 回车 · R 重开";
    } else {
      card.classList.add("lose");
      kickerEl.textContent = "SEALED";
      titleEl.textContent = G.remain <= 0 ? "时限耗尽" : "瓶子碎了";
      leadEl.textContent =
        G.remain <= 0 ? "颜色还没对上，锁重新咬死。" : "溢液溅上锁芯，这一室作废。";
      metaEl.textContent =
        "开到第 " +
        Math.min(G.room + 1, ROOMS.length) +
        " 扇 · 契合 " +
        Math.round(fit01() * 100) +
        "%";
      btnMain.textContent = "再调一瓶";
      footEl.textContent = "空格 / 回车 · R 重开";
    }
  }

  function startPlay() {
    audio.start();
    resetRun();
    G.mode = "play";
    panel.classList.add("hidden");
    hud.classList.remove("hidden");
    toast(room().name + " · " + room().sub);
    syncHud();
  }

  function endGame(win) {
    if (G.mode !== "play") return;
    G.mode = win ? "win" : "lose";
    G.phase = "mix";
    hud.classList.add("hidden");
    audio.stopDrone();
    if (win) {
      audio.win();
      emit(36, {
        x: L.lockX,
        y: L.lockY,
        j: 18,
        vx0: -90,
        vx1: 90,
        vy0: -110,
        vy1: 40,
        life: 1.1,
        r0: 2,
        r1: 5,
        col: { r: 0, g: 240, b: 255 }
      });
    } else {
      audio.lose();
      G.flash = 1;
      G.shake = 12;
    }
    showPanel(G.mode);
  }

  function loseLife(why) {
    if (G.phase !== "mix") return;
    G.lives -= 1;
    G.shake = 10;
    G.flash = 1;
    G.flashRgb = { r: 255, g: 61, b: 184 };
    G.rejectIn = -1;
    drops.length = 0;
    if (why === "overflow") {
      audio.overflow();
      toast("溢满 −1", true);
      const col = mixRgb(Math.max(G.r, 1), G.g, G.b);
      emit(28, {
        x: L.vialX,
        y: L.vialY - L.vialS * 0.05,
        j: 10,
        vx0: -120,
        vx1: 120,
        vy0: -80,
        vy1: 90,
        life: 0.7,
        r0: 2,
        r1: 5,
        col: col
      });
    } else {
      audio.reject();
      toast("锁拒绝 −1", true);
    }
    if (G.lives <= 0) {
      endGame(false);
      return;
    }
    G.phase = "hurt";
    G.hurtT = 0;
    syncHud();
  }

  function requestDrip(ch) {
    if (G.mode !== "play" || G.phase !== "mix" || G.lock > 0) return;
    audio.ensure();
    const idx = CHS.indexOf(ch);
    if (idx < 0) return;
    G.sel = idx;
    const rm = room();
    if (filledLanded() >= rm.cap) {
      loseLife("overflow");
      return;
    }
    if (totNow() >= rm.cap) return;
    const d = L.drop[idx];
    drops.push({
      ch: ch,
      x: d.x,
      y: d.y + L.vialS * 0.28,
      x1: L.vialX + rand(-4, 4),
      y1: L.vialY - L.vialS * 0.22,
      t: 0,
      dur: 0.28 + Math.random() * 0.06,
      live: true
    });
    G.squeeze[idx] = 1;
    audio.drip(ch);
  }

  function dump() {
    if (G.mode !== "play" || G.phase !== "mix" || G.lock > 0) return;
    if (filledLanded() === 0 && inFlight() === 0) return;
    if (G.dumps <= 0) {
      audio.reject();
      toast("倾倒用尽", true);
      return;
    }
    audio.dump();
    G.dumps -= 1;
    G.drainCol = { r: G.show.r, g: G.show.g, b: G.show.b };
    G.phase = "drain";
    G.drainT = 0;
    G.rejectIn = -1;
    drops.length = 0;
    const col = mixRgb(Math.max(G.r, 0), G.g, G.b);
    emit(14, {
      x: L.tapX,
      y: L.tapY,
      j: 6,
      vx0: -30,
      vx1: 30,
      vy0: 40,
      vy1: 110,
      life: 0.5,
      r0: 1.5,
      r1: 3.2,
      col: col.r + col.g + col.b < 80 ? PRIM.b : col
    });
    toast("倾倒");
    syncHud();
  }

  function startOpen() {
    G.phase = "open";
    G.openT = 0;
    G.rejectIn = -1;
    audio.match();
    toast("门锁开了");
    const tgt = targetRgb();
    emit(22, {
      x: L.lockX,
      y: L.lockY,
      j: 12,
      vx0: -70,
      vx1: 70,
      vy0: -80,
      vy1: 30,
      life: 0.85,
      r0: 2,
      r1: 4.5,
      col: tgt
    });
    emit(12, {
      x: L.vialX,
      y: L.vialY,
      j: 8,
      vx0: -40,
      vx1: 40,
      vy0: -90,
      vy1: -10,
      life: 0.7,
      r0: 1.6,
      r1: 3.4,
      col: tgt
    });
    syncHud();
  }

  function landDrop(d) {
    d.live = false;
    if (G.phase !== "mix") return;
    G[d.ch] += 1;
    G.swirl = Math.min(1.4, G.swirl + 0.55);
    audio.land(d.ch);
    const col = mixRgb(G.r, G.g, G.b);
    emit(8, {
      x: d.x1,
      y: d.y1 + 8,
      j: 5,
      vx0: -35,
      vx1: 35,
      vy0: -50,
      vy1: 10,
      life: 0.4,
      r0: 1.2,
      r1: 2.6,
      col: col
    });
    splashes.push({ x: d.x1, y: d.y1 + 6, t: 0, col: col });
    if (bubbles.length < 18) {
      bubbles.push({
        x: rand(-0.35, 0.35),
        y: rand(0.15, 0.7),
        r: rand(1.4, 3.2),
        vy: rand(8, 16),
        a: rand(0.25, 0.55)
      });
    }
    if (isMatch()) startOpen();
    else if (filledLanded() >= room().cap && G.dumps <= 0) G.rejectIn = 0.9;
    syncHud();
  }

  function updateDrops(dt) {
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (!d.live) continue;
      d.t += dt;
      const u = clamp(d.t / d.dur, 0, 1);
      const e = u * u;
      d.x = lerp(L.drop[CHS.indexOf(d.ch)].x, d.x1, e);
      d.y = lerp(L.drop[CHS.indexOf(d.ch)].y + L.vialS * 0.28, d.y1, e);
      if (u >= 1) landDrop(d);
    }
    for (let i = drops.length - 1; i >= 0; i--) if (!drops[i].live) drops.splice(i, 1);
  }

  function updateFx(dt) {
    G.clock += dt;
    for (let i = 0; i < 3; i++) {
      G.squeeze[i] = Math.max(0, G.squeeze[i] - dt * 3.2);
    }
    G.shake *= Math.pow(0.001, dt);
    if (G.shake < 0.15) G.shake = 0;
    G.flash = Math.max(0, G.flash - dt * 1.8);
    G.swirl = Math.max(0, G.swirl - dt * 0.55);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }

    const targetFill = G.phase === "drain" ? 0 : filledLanded() / Math.max(1, room().cap);
    G.fillShow = lerp(G.fillShow, targetFill, 1 - Math.pow(0.0008, dt));
    let want;
    if (G.phase === "drain") {
      const u = smooth(G.drainT / 0.46);
      want = {
        r: lerp(G.drainCol.r, 18, u),
        g: lerp(G.drainCol.g, 16, u),
        b: lerp(G.drainCol.b, 28, u)
      };
    } else if (filledLanded() === 0) {
      want = { r: 18, g: 16, b: 28 };
    } else {
      want = mixRgb(G.r, G.g, G.b);
    }
    G.show.r = lerp(G.show.r, want.r, 1 - Math.pow(0.0004, dt));
    G.show.g = lerp(G.show.g, want.g, 1 - Math.pow(0.0004, dt));
    G.show.b = lerp(G.show.b, want.b, 1 - Math.pow(0.0004, dt));

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 140 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      splashes[i].t += dt;
      if (splashes[i].t > 0.35) splashes.splice(i, 1);
    }
    if (G.fillShow > 0.08 && G.mode === "play" && Math.random() < dt * 2.2 && bubbles.length < 16) {
      bubbles.push({
        x: rand(-0.4, 0.4),
        y: rand(0.55, 0.92),
        r: rand(1.2, 2.8),
        vy: rand(10, 22),
        a: rand(0.2, 0.5)
      });
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.vy * dt * 0.018;
      b.x += Math.sin(G.clock * 3 + b.y * 8) * dt * 0.08;
      if (b.y < 0.06) bubbles.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y -= dt * m.s * 0.03;
      if (m.y < 0) m.y += 1;
    }
  }

  function update(dt) {
    if (G.lock > 0) G.lock -= dt;
    updateFx(dt);
    if (G.mode !== "play" || G.paused) {
      audio.tickDrone();
      return;
    }
    G.t += dt;
    if (G.phase === "mix" || G.phase === "drain" || G.phase === "hurt") {
      G.remain -= dt;
      if (G.remain <= 0) {
        G.remain = 0;
        endGame(false);
        return;
      }
      if (G.remain <= 10 && G.remain > 0) {
        const k = Math.ceil(G.remain);
        if (k !== audio.tickAt && G.phase === "mix") {
          audio.tickAt = k;
          audio.tick();
        }
      }
    }

    if (G.phase === "mix") {
      updateDrops(dt);
      if (G.rejectIn >= 0) {
        G.rejectIn -= dt;
        if (G.rejectIn <= 0) loseLife("reject");
      }
    } else if (G.phase === "drain") {
      G.drainT += dt;
      if (G.drainT >= 0.46) {
        resetMix();
        G.phase = "mix";
        G.lock = 0.08;
        syncHud();
      }
    } else if (G.phase === "hurt") {
      G.hurtT += dt;
      if (G.hurtT >= 0.62) {
        G.dumps = room().dumps;
        resetMix();
        G.phase = "mix";
        G.lock = 0.12;
        syncHud();
      }
    } else if (G.phase === "open") {
      G.openT += dt;
      G.doorGap = smooth(clamp(G.openT / 0.78, 0, 1));
      if (G.openT >= 1.18) {
        if (G.room + 1 >= ROOMS.length) {
          endGame(true);
          return;
        }
        enterRoom(G.room + 1);
        toast(room().name + " · " + room().sub);
      }
    }
    audio.tickDrone();
    if (G.mode === "play") {
      const tl = G.remain < 10 ? G.remain.toFixed(1) : String(Math.ceil(G.remain));
      if (timeEl.textContent !== tl) {
        timeEl.textContent = tl;
        timeEl.classList.toggle("warn", G.remain <= 10);
      }
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

  function flaskPath(cx, cy, s) {
    const neckW = s * 0.145;
    const mouthW = s * 0.2;
    const mouthY = cy - s * 0.58;
    const neckBot = cy - s * 0.26;
    const br = s * 0.34;
    ctx.beginPath();
    ctx.moveTo(cx - mouthW, mouthY);
    ctx.lineTo(cx + mouthW, mouthY);
    ctx.lineTo(cx + neckW, mouthY + s * 0.07);
    ctx.lineTo(cx + neckW, neckBot);
    ctx.bezierCurveTo(cx + br, neckBot + s * 0.04, cx + br, cy + br * 0.98, cx, cy + br);
    ctx.bezierCurveTo(cx - br, cy + br * 0.98, cx - br, neckBot + s * 0.04, cx - neckW, neckBot);
    ctx.lineTo(cx - neckW, mouthY + s * 0.07);
    ctx.closePath();
  }

  function drawBg() {
    const g = ctx.createRadialGradient(W * 0.3, H * 0.1, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.85);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.45, "#080510");
    g.addColorStop(1, "#05030c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.78, H * 0.18, 0, W * 0.78, H * 0.18, W * 0.5);
    g2.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    const g3 = ctx.createRadialGradient(W * 0.18, H * 0.85, 0, W * 0.18, H * 0.85, W * 0.45);
    g3.addColorStop(0, "rgba(255, 61, 184, 0.07)");
    g3.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = "#7af6ff";
    ctx.lineWidth = 1;
    const step = 36;
    const ox = (G.clock * 6) % step;
    const xMax = W + step;
    const yMax = H + step;
    if (isFinite(xMax) && isFinite(yMax) && step > 0) {
      for (let x = -step + ox; x < xMax; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < yMax; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
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

  function drawDoor() {
    const x = L.doorX;
    const y = L.doorY;
    const w = L.doorW;
    const h = L.doorH;
    const gap = G.doorGap * w * 0.46;
    const tgt = targetRgb();
    const fit = G.mode === "play" ? fit01() : 0.15 + 0.1 * Math.sin(G.clock);

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    pathRoundRect(-w * 0.56, -h * 0.54, w * 1.12, h * 1.12, 18);
    ctx.fill();

    function leaf(side, ox) {
      ctx.save();
      ctx.translate(ox, 0);
      const lw = w * 0.5 - 1;
      const grd = ctx.createLinearGradient(-lw, 0, lw, 0);
      if (side < 0) {
        grd.addColorStop(0, "#14101f");
        grd.addColorStop(0.7, "#1c162c");
        grd.addColorStop(1, "#0c0a14");
      } else {
        grd.addColorStop(0, "#0c0a14");
        grd.addColorStop(0.3, "#1c162c");
        grd.addColorStop(1, "#14101f");
      }
      ctx.fillStyle = grd;
      ctx.beginPath();
      pathRoundRect(side < 0 ? -lw : 0, -h * 0.5, lw, h, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.18)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.04)";
      for (let i = 0; i < 5; i++) {
        const ry = -h * 0.38 + i * (h * 0.16);
        ctx.fillRect(side < 0 ? -lw + 10 : 10, ry, lw - 20, 3);
      }
      ctx.fillStyle = "rgba(0, 240, 255, 0.22)";
      const riv = 4;
      for (let i = 0; i < 6; i++) {
        const ry = -h * 0.42 + i * (h * 0.15);
        ctx.beginPath();
        ctx.arc(side < 0 ? -lw + 14 : lw - 14, ry, riv, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    if (G.doorGap > 0.02) {
      const light = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
      light.addColorStop(0, cssRgb(tgt, 0.05));
      light.addColorStop(0.5, "rgba(0, 240, 255, 0.22)");
      light.addColorStop(1, cssRgb(tgt, 0.08));
      ctx.fillStyle = light;
      ctx.fillRect(-gap, -h * 0.5, gap * 2, h);
    }

    leaf(-1, -gap);
    leaf(1, gap);

    ctx.restore();

    const lx = L.lockX;
    const ly = L.lockY;
    const lr = L.lockR * (1 - G.doorGap * 0.35);
    if (G.doorGap < 0.92) {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.globalAlpha = 1 - G.doorGap;

      ctx.beginPath();
      ctx.arc(0, 0, lr * 1.55, 0, TAU);
      ctx.fillStyle = cssRgb(tgt, 0.09 + fit * 0.12);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, lr * 1.18, 0, TAU);
      ctx.strokeStyle = "rgba(246, 243, 255, 0.16)";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, lr * 1.18, -Math.PI / 2, -Math.PI / 2 + TAU * fit);
      ctx.strokeStyle = cssRgb(tgt, 0.85);
      ctx.shadowColor = cssRgb(tgt, 0.8);
      ctx.shadowBlur = 14;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.shadowBlur = 0;

      const well = ctx.createRadialGradient(-lr * 0.25, -lr * 0.3, lr * 0.1, 0, 0, lr);
      well.addColorStop(0, cssRgb({ r: Math.min(255, tgt.r + 40), g: Math.min(255, tgt.g + 40), b: Math.min(255, tgt.b + 40) }));
      well.addColorStop(0.55, cssRgb(tgt));
      well.addColorStop(1, "rgb(8,6,16)");
      ctx.beginPath();
      ctx.arc(0, 0, lr * 0.86, 0, TAU);
      ctx.fillStyle = well;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-lr * 0.28, -lr * 0.32, lr * 0.28, lr * 0.14, -0.5, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fill();

      const bolts = 4;
      const retract = fit * lr * 0.42;
      for (let i = 0; i < bolts; i++) {
        const a = (i / bolts) * TAU + Math.PI / 4;
        const bx = Math.cos(a) * (lr * 1.02 + 10 - retract);
        const by = Math.sin(a) * (lr * 1.02 + 10 - retract);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(a);
        ctx.fillStyle = fit > 0.98 ? "rgba(0,240,255,0.7)" : "rgba(200,210,230,0.55)";
        ctx.fillRect(-5, -7, 16, 14);
        ctx.restore();
      }

      ctx.fillStyle = "rgba(246,243,255,0.8)";
      ctx.font = "600 " + Math.max(11, lr * 0.22) + "px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(room().name, 0, lr * 1.48);
      ctx.fillStyle = "rgba(0,240,255,0.7)";
      ctx.font = "10px Segoe UI, sans-serif";
      ctx.fillText(room().sub, 0, lr * 1.72);
      ctx.restore();
    }
  }

  function drawDroppers() {
    const s = L.vialS;
    ctx.save();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(L.drop[0].x - s * 0.16, L.drop[0].y - s * 0.16);
    ctx.lineTo(L.drop[2].x + s * 0.16, L.drop[2].y - s * 0.16);
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      const d = L.drop[i];
      const ch = CHS[i];
      const col = PRIM[ch];
      const sq = G.squeeze[i];
      const sel = G.sel === i || G.hover === i;
      const bulbR = s * (0.095 - sq * 0.025);
      const bulbH = s * (0.12 - sq * 0.04);

      ctx.save();
      ctx.translate(d.x, d.y);

      if (sel) {
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.2, 0, TAU);
        ctx.fillStyle = cssRgb(col, 0.1);
        ctx.fill();
      }

      ctx.fillStyle = "#2a2438";
      ctx.fillRect(-2, -s * 0.16, 4, s * 0.1);

      ctx.beginPath();
      ctx.ellipse(0, 0, bulbR * (1 + sq * 0.35), bulbH, 0, 0, TAU);
      const bg = ctx.createRadialGradient(-bulbR * 0.3, -bulbH * 0.3, 2, 0, 0, bulbR * 1.2);
      bg.addColorStop(0, cssRgb({ r: Math.min(255, col.r + 40), g: Math.min(255, col.g + 40), b: Math.min(255, col.b + 40) }));
      bg.addColorStop(1, cssRgb(col));
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const tubeH = s * 0.32 + sq * s * 0.02;
      ctx.fillStyle = "rgba(180, 220, 255, 0.14)";
      ctx.strokeStyle = "rgba(200, 230, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      pathRoundRect(-s * 0.028, bulbH * 0.7, s * 0.056, tubeH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = cssRgb(col, 0.65);
      ctx.fillRect(-s * 0.016, bulbH * 0.75, s * 0.032, tubeH * 0.72);

      ctx.beginPath();
      ctx.moveTo(-s * 0.022, bulbH * 0.7 + tubeH);
      ctx.lineTo(s * 0.022, bulbH * 0.7 + tubeH);
      ctx.lineTo(0, bulbH * 0.7 + tubeH + s * 0.05);
      ctx.closePath();
      ctx.fillStyle = cssRgb(col, 0.9);
      ctx.fill();

      ctx.fillStyle = sel ? cssRgb(col, 0.95) : "rgba(246,243,255,0.7)";
      ctx.font = "600 " + Math.max(11, s * 0.07) + "px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(col.name, 0, -bulbH - 8);
      ctx.fillStyle = "rgba(0,240,255,0.55)";
      ctx.font = "10px Segoe UI, sans-serif";
      ctx.fillText(col.key, 0, -bulbH - 8 - Math.max(12, s * 0.08));

      ctx.restore();
    }
    ctx.restore();
  }

  function drawVial() {
    const cx = L.vialX;
    const cy = L.vialY;
    const s = L.vialS;
    const fill = clamp(G.fillShow, 0, 1);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.42, s * 0.28, s * 0.05, 0, 0, TAU);
    ctx.fill();

    flaskPath(cx, cy, s);
    ctx.fillStyle = "rgba(40, 70, 110, 0.08)";
    ctx.fill();

    if (fill > 0.02) {
      ctx.save();
      flaskPath(cx, cy, s);
      ctx.clip();
      const liquidTop = lerp(cy + s * 0.34, cy - s * 0.22, fill);
      const wave = Math.sin(G.clock * 3.2 + G.swirl * 4) * (2.2 + G.swirl * 4);
      ctx.fillStyle = cssRgb(G.show, 0.92);
      ctx.beginPath();
      ctx.moveTo(cx - s, liquidTop + wave);
      for (let i = 0; i <= 8; i++) {
        const px = cx - s * 0.4 + (i / 8) * s * 0.8;
        const py = liquidTop + Math.sin(G.clock * 3.4 + i * 0.7 + G.swirl * 5) * (2 + G.swirl * 3.5);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(cx + s, liquidTop - wave);
      ctx.lineTo(cx + s, cy + s);
      ctx.lineTo(cx - s, cy + s);
      ctx.closePath();
      ctx.fill();

      const lg = ctx.createLinearGradient(cx, liquidTop, cx, cy + s * 0.34);
      lg.addColorStop(0, cssRgb({ r: Math.min(255, G.show.r + 50), g: Math.min(255, G.show.g + 50), b: Math.min(255, G.show.b + 50) }, 0.35));
      lg.addColorStop(1, cssRgb(G.show, 0.05));
      ctx.fillStyle = lg;
      ctx.fill();

      ctx.save();
      ctx.translate(cx, lerp(liquidTop, cy + s * 0.1, 0.45));
      ctx.rotate(G.clock * 0.8 + G.swirl * 2);
      ctx.globalAlpha = 0.18 + G.swirl * 0.2;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.16, s * 0.07, 0.4, 0, TAU);
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        const bx = cx + b.x * s * 0.28;
        const by = lerp(liquidTop, cy + s * 0.32, b.y);
        if (by < liquidTop + 2) continue;
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, TAU);
        ctx.strokeStyle = "rgba(255,255,255," + b.a + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    flaskPath(cx, cy, s);
    ctx.strokeStyle = "rgba(180, 230, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, cy - s * 0.58);
    ctx.lineTo(cx + s * 0.2, cy - s * 0.58);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - s * 0.18, cy - s * 0.46);
    ctx.lineTo(cx - s * 0.12, cy + s * 0.02);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 5;
    ctx.stroke();

    const cap = room().cap;
    ctx.strokeStyle = "rgba(246,243,255,0.22)";
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= cap; i++) {
      const fy = lerp(cy + s * 0.3, cy - s * 0.2, i / cap);
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.18, fy);
      ctx.lineTo(cx + s * 0.26, fy);
      ctx.stroke();
    }

    const now = filledLanded();
    ctx.fillStyle = "rgba(246,243,255,0.72)";
    ctx.font = "600 " + Math.max(12, s * 0.075) + "px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(now + " / " + cap, cx, cy + s * 0.38);

    ctx.fillStyle = "rgba(139,144,184,0.9)";
    ctx.font = "10px Segoe UI, PingFang SC, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("现", cx - s * 0.58, cy - s * 0.08);
    ctx.fillText("标", cx + s * 0.58, cy - s * 0.08);

    ctx.beginPath();
    ctx.arc(cx - s * 0.58, cy + s * 0.08, s * 0.072, 0, TAU);
    ctx.fillStyle = cssRgb(filledLanded() ? G.show : { r: 22, g: 20, b: 32 });
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + s * 0.58, cy + s * 0.08, s * 0.072, 0, TAU);
    ctx.fillStyle = cssRgb(targetRgb());
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.45)";
    ctx.stroke();

    const tapHot = G.hover === 9;
    ctx.beginPath();
    ctx.arc(L.tapX, L.tapY, s * 0.055, 0, TAU);
    ctx.fillStyle = tapHot ? "rgba(255, 227, 107, 0.35)" : "rgba(40, 36, 56, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 227, 107, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#ffe36b";
    ctx.font = "9px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("倒", L.tapX, L.tapY);

    ctx.restore();
  }

  function drawDrops() {
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (!d.live) continue;
      const col = PRIM[d.ch];
      const rad = L.vialS * 0.038;
      ctx.beginPath();
      ctx.arc(d.x, d.y, rad, 0, TAU);
      ctx.fillStyle = cssRgb(col);
      ctx.shadowColor = cssRgb(col, 0.9);
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(d.x - rad * 0.25, d.y - rad * 0.3, rad * 0.28, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fill();
    }
    for (let i = 0; i < splashes.length; i++) {
      const s = splashes[i];
      const u = s.t / 0.35;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6 + u * 16, 0, TAU);
      ctx.strokeStyle = cssRgb(s.col, 0.45 * (1 - u));
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
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
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
    drawBg();
    drawDoor();
    drawVial();
    drawDroppers();
    drawDrops();
    drawParticles();
    drawScan();
    if (G.flash > 0) {
      ctx.fillStyle = cssRgb(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function hitAt(x, y) {
    const s = L.vialS;
    for (let i = 0; i < 3; i++) {
      const d = L.drop[i];
      const dx = x - d.x;
      const dy = y - d.y;
      if (dx * dx + dy * dy < (s * 0.2) * (s * 0.2)) return i;
      if (Math.abs(dx) < s * 0.08 && y > d.y && y < d.y + s * 0.42) return i;
    }
    const tx = x - L.tapX;
    const ty = y - L.tapY;
    if (tx * tx + ty * ty < (s * 0.14) * (s * 0.14)) return 9;
    return -1;
  }

  function onPointer(e) {
    if (e.button != null && e.button !== 0) return;
    if (G.mode !== "play") return;
    const hit = hitAt(e.clientX, e.clientY);
    if (hit >= 0 && hit <= 2) requestDrip(CHS[hit]);
    else if (hit === 9) dump();
  }

  function onMove(e) {
    const hit = hitAt(e.clientX, e.clientY);
    G.hover = hit;
    if (hit >= 0 && hit <= 2) G.sel = hit;
    canvas.style.cursor = hit >= 0 ? "pointer" : "default";
  }

  canvas.addEventListener("pointerdown", onPointer);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", function () {
    G.hover = -1;
  });

  btnR.addEventListener("click", function () {
    requestDrip("r");
  });
  btnG.addEventListener("click", function () {
    requestDrip("g");
  });
  btnB.addEventListener("click", function () {
    requestDrip("b");
  });
  btnDump.addEventListener("click", function () {
    dump();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function () {
    if (G.mode === "title") return;
    startPlay();
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
    if (k === " " ) e.preventDefault();
    if (e.repeat) return;
    if (k === "q" || k === "Q" || k === "1" || k === "a" || k === "A") requestDrip("r");
    else if (k === "w" || k === "W" || k === "2" || k === "s" || k === "S") requestDrip("g");
    else if (k === "e" || k === "E" || k === "3" || k === "d" || k === "D") requestDrip("b");
    else if (k === "ArrowLeft") G.sel = (G.sel + 2) % 3;
    else if (k === "ArrowRight") G.sel = (G.sel + 1) % 3;
    else if (k === " ") requestDrip(CHS[G.sel]);
    else if (k === "x" || k === "X" || k === "Backspace" || k === "Delete") {
      dump();
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
