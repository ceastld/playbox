(() => {
  "use strict";

  const WORLD_W = 960;
  const WORLD_H = 540;
  const WALL = 38;
  const FLOOR_Y = 508;
  const CEIL_Y = 32;
  const RAIL_Y = 494;
  const MAG_Y = 456;
  const MAG_R = 26;
  const CORE_R = 15.5;
  const SLOT_W = 56;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const MAG_K = 11000000;
  const MAG_EPS = 2800;
  const MAG_MAX = 980;
  const STICK = MAG_R + CORE_R + 28;
  const GRAV = 48;
  const DAMP = 1.55;
  const MAX_SPD = 440;
  const MAG_SPD = 390;
  const MUTE_KEY = "playbox-magnet-row-mute";

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };

  const STAGES = [
    {
      name: "底吸",
      sub: "PULL",
      hint: "异极相吸。把青核拖进青色底槽",
      toast: "磁头是南极，会吸住北极铁核",
      time: 34,
      mag: { x: 210, p: -1 },
      cores: [{ x: 390, y: 248, p: 1 }],
      slots: [{ x: 730, side: "floor", p: 1 }],
      posts: []
    },
    {
      name: "顶斥",
      sub: "LIFT",
      hint: "同极相斥。把粉核顶进头顶的槽",
      toast: "同极会弹开，用来顶进顶槽",
      time: 32,
      mag: { x: 480, p: -1 },
      cores: [{ x: 480, y: 276, p: -1 }],
      slots: [{ x: 480, side: "ceil", p: -1 }],
      posts: []
    },
    {
      name: "双路",
      sub: "TWIN",
      hint: "先吸青核入底槽，再把粉核顶上去",
      toast: "一颗吸进底槽，一颗弹进顶槽",
      time: 42,
      mag: { x: 200, p: -1 },
      cores: [
        { x: 330, y: 236, p: 1 },
        { x: 700, y: 258, p: -1 }
      ],
      slots: [
        { x: 250, side: "floor", p: 1 },
        { x: 720, side: "ceil", p: -1 }
      ],
      posts: []
    },
    {
      name: "并槽",
      sub: "ROW",
      hint: "一次只能吸住异极。别送错槽",
      toast: "错槽会炸核。先送一颗再翻极",
      time: 44,
      mag: { x: 480, p: 1 },
      cores: [
        { x: 340, y: 228, p: 1 },
        { x: 640, y: 250, p: -1 }
      ],
      slots: [
        { x: 170, side: "floor", p: 1 },
        { x: 790, side: "floor", p: -1 }
      ],
      posts: []
    },
    {
      name: "绕柱",
      sub: "POST",
      hint: "绕过磁柱。三核三槽，翻极要看准",
      toast: "柱会挡核。先顶左边，再吸右边",
      time: 50,
      mag: { x: 480, p: 1 },
      cores: [
        { x: 188, y: 214, p: 1 },
        { x: 508, y: 268, p: 1 },
        { x: 772, y: 242, p: -1 }
      ],
      slots: [
        { x: 196, side: "ceil", p: 1 },
        { x: 500, side: "floor", p: 1 },
        { x: 786, side: "floor", p: -1 }
      ],
      posts: [
        { x: 338, y: 292, r: 24 },
        { x: 648, y: 214, r: 20 }
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
  const btnFlip = document.getElementById("btn-flip");
  const btnFlipPad = document.getElementById("btn-flip-pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const stageLabel = document.getElementById("stage-label");
  const polLabel = document.getElementById("pol-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false };
  const pad = { l: false, r: false };
  const pointer = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    sx: 0,
    moved: false,
    t: 0
  };

  const particles = [];
  const ripples = [];
  const motes = [];
  const arcs = [];

  const G = {
    mode: "title",
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    remain: 30,
    mag: { x: 480, y: MAG_Y, prevX: 480, p: -1, target: 480, spin: 0, glow: 0, flipT: 0 },
    cores: [],
    slots: [],
    posts: [],
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: "#00f0ff",
    toastT: 0,
    clearT: 0,
    dieT: 0,
    why: "",
    docked: 0,
    total: 0,
    dockedAll: 0,
    warned: false,
    hud: "",
    nearHold: 0
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
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgb(c, a) {
    return a == null
      ? "rgb(" + c.r + "," + c.g + "," + c.b + ")"
      : "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function polCol(p) {
    return p === 1 ? CYN : MAG;
  }
  function polHex(p) {
    return p === 1 ? "#00f0ff" : "#ff3db8";
  }
  function polName(p) {
    return p === 1 ? "北" : "南";
  }
  function magMin() {
    return WALL + 46;
  }
  function magMax() {
    return WORLD_W - WALL - 46;
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    hum: null,
    humGain: null,
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
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.26;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) { /* ignore */ }
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
    noise: function (dur, vol, from, to) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(from || 700, t);
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    flip: function (p) {
      this.ensure();
      this.noise(0.08, 0.05, 400, 1800);
      if (p === 1) {
        this.beep(420, 0.1, "square", 0.04, 880);
        this.beep(880, 0.16, "triangle", 0.05, 1320);
      } else {
        this.beep(520, 0.1, "square", 0.04, 220);
        this.beep(180, 0.18, "triangle", 0.055, 90);
      }
    },
    dock: function (p) {
      this.ensure();
      const base = p === 1 ? 520 : 390;
      this.beep(base, 0.12, "triangle", 0.08, base * 2);
      this.beep(base * 1.5, 0.22, "sine", 0.055, base * 2.4);
      this.noise(0.1, 0.04, 900, 400);
    },
    zap: function () {
      this.ensure();
      this.noise(0.22, 0.1, 1400, 180);
      this.beep(240, 0.28, "sawtooth", 0.07, 70);
    },
    time: function () {
      this.ensure();
      this.beep(880, 0.08, "square", 0.045, 440);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, "triangle", 0.09, 880);
      this.beep(660, 0.24, "sine", 0.07, 1320);
      this.beep(880, 0.38, "sine", 0.055, 1760);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.42, "sawtooth", 0.08, 55);
      this.beep(90, 0.64, "square", 0.045, 40);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.14, "sine", 0.06, 520);
      this.beep(330, 0.18, "triangle", 0.045, 880);
    },
    tickDrone: function (play, hold, pol) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 48;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      if (!this.hum) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "triangle";
        o.frequency.value = 110;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.hum = o;
        this.humGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(pol === 1 ? 56 : 42, t, 0.12);
      this.droneGain.gain.setTargetAtTime(play ? 0.018 : 0.0001, t, 0.18);
      this.hum.frequency.setTargetAtTime(pol === 1 ? 148 : 92, t, 0.08);
      this.humGain.gain.setTargetAtTime(play && hold > 0.2 ? 0.01 + hold * 0.03 : 0.0001, t, 0.08);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 120) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || "c"
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 8, max: max || 54, t: 1, col: col || "c" });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.remove("hidden");
    G.toastT = 2.5;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.2 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.7 + 0.12
      });
    }
  }

  function slotRest(slot) {
    if (slot.side === "floor") return { x: slot.x, y: FLOOR_Y - 22 };
    return { x: slot.x, y: CEIL_Y + 22 };
  }

  function inMouth(c, slot, pad) {
    const rest = slotRest(slot);
    return hypot2(c.x - rest.x, c.y - rest.y) < 34 + (pad || 0);
  }

  function bounceCircle(p, cx, cy, r) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = hypot2(dx, dy);
    const min = r + p.r;
    if (d === 0 || d >= min) return 0;
    const nx = dx / d;
    const ny = dy / d;
    const overlap = min - d;
    p.x += nx * overlap;
    p.y += ny * overlap;
    const vn = p.vx * nx + p.vy * ny;
    if (vn < 0) {
      p.vx -= nx * vn * 1.62;
      p.vy -= ny * vn * 1.62;
    }
    return -vn;
  }

  function cloneCores(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      out.push({
        x: s.x,
        y: s.y,
        vx: rand(-8, 8),
        vy: rand(-6, 6),
        r: CORE_R,
        p: s.p,
        docked: false,
        dead: false,
        pop: 0,
        spin: rand(0, TAU),
        wob: rand(0, TAU),
        stretch: 1,
        trail: [],
        held: 0,
        home: null
      });
    }
    return out;
  }

  function loadStage(index, silent) {
    const s = STAGES[index];
    G.stage = index;
    G.remain = s.time;
    G.clock = 0;
    G.lock = silent ? 0 : 0.28;
    G.clearT = 0;
    G.dieT = 0;
    G.why = "";
    G.warned = false;
    G.mag.x = s.mag.x;
    G.mag.y = MAG_Y;
    G.mag.prevX = s.mag.x;
    G.mag.target = s.mag.x;
    G.mag.p = s.mag.p;
    G.mag.glow = 1;
    G.mag.flipT = 0;
    G.cores = cloneCores(s.cores);
    G.slots = [];
    for (let i = 0; i < s.slots.length; i++) {
      const sl = s.slots[i];
      G.slots.push({
        x: sl.x,
        side: sl.side,
        p: sl.p,
        filled: false,
        glow: 0,
        pulse: 0
      });
    }
    G.posts = [];
    for (let i = 0; i < s.posts.length; i++) {
      const p = s.posts[i];
      G.posts.push({ x: p.x, y: p.y, r: p.r, spin: rand(0, TAU) });
    }
    G.total = G.slots.length;
    G.docked = 0;
    particles.length = 0;
    ripples.length = 0;
    arcs.length = 0;
    syncFlipBtns();
    if (!silent) {
      toast(s.toast);
      hintEl.textContent = coarse ? "拖磁头左右 · 点按翻极 · 对色入槽" : s.hint;
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "MAGNET";
      ovTitle.textContent = "磁列";
      ovLead.innerHTML = "青为北极，粉为南极。异极相吸，同极相斥。<br />滑动磁头，翻极性，把铁核送进同色的槽。";
      ovOps.textContent = "A / D 或 ← → 移动 · 空格翻极 · 拖屏幕 · 点按翻极 · M 静音";
      ovBtn.textContent = "通电";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "合闸";
      ovLead.textContent = "五列尽收。铁核都还亮着，线圈没有过热。";
      ovOps.textContent = "入槽 " + G.dockedAll + " · 剩命 " + G.lives;
      ovBtn.textContent = "再通一次";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "失磁";
      let why = "铁核没能归槽。";
      if (G.why === "time") why = "线圈过热，磁场塌了。";
      else if (G.why === "zap") why = "铁核进了错槽，炸开了。";
      ovLead.textContent = why;
      ovOps.textContent = STAGES[G.stage].name + " · 入槽 " + G.docked + "/" + G.total;
      ovBtn.textContent = "再通一次";
    }
  }

  function startRun() {
    G.mode = "play";
    G.lives = LIVES;
    G.dockedAll = 0;
    G.shake = 0;
    G.flash = 0;
    hideOverlay();
    loadStage(0);
    audio.start();
    canvas.focus();
  }

  function retryRun() {
    if (G.mode === "title") {
      startRun();
      return;
    }
    hideOverlay();
    startRun();
  }

  function syncFlipBtns() {
    const north = G.mag.p === 1;
    btnFlip.classList.toggle("north", north);
    btnFlip.classList.toggle("south", !north);
    btnFlipPad.classList.toggle("north", north);
    btnFlipPad.classList.toggle("south", !north);
  }

  function flipPolarity() {
    if (G.mode !== "play" && G.mode !== "title") return;
    if (G.mode === "play" && G.lock > 0) return;
    if (G.mag.flipT > 0) return;
    G.mag.p = G.mag.p === 1 ? -1 : 1;
    G.mag.flipT = 0.16;
    G.mag.glow = 1;
    G.flash = 0.18;
    G.flashCol = polHex(G.mag.p);
    syncFlipBtns();
    audio.flip(G.mag.p);
    ripple(G.mag.x, G.mag.y - 8, G.mag.p === 1 ? "c" : "m", 70);
    emit(14, {
      x: G.mag.x,
      y: G.mag.y - 6,
      j: 10,
      vx0: -90,
      vx1: 90,
      vy0: -140,
      vy1: -20,
      life: 0.38,
      r0: 1.2,
      r1: 3.2,
      col: G.mag.p === 1 ? "c" : "m"
    });
  }

  function fail(why) {
    if (G.mode !== "play") return;
    G.mode = "die";
    G.why = why;
    G.dieT = 0.72;
    G.lives -= 1;
    G.shake = 11;
    G.flash = 0.45;
    G.flashCol = "#ff3db8";
    if (why === "zap") audio.zap();
    else audio.zap();
    if (why === "time") toast("线圈过热", "warn");
    else toast("错槽炸核", "warn");
  }

  function finishDie() {
    if (G.lives <= 0) {
      G.mode = "lose";
      showOverlay("lose");
      audio.lose();
    } else {
      loadStage(G.stage);
      G.mode = "play";
      toast("磁场重建", "warn");
    }
  }

  function dockCore(core, slot) {
    if (slot.filled || core.docked) return;
    core.docked = true;
    core.home = slot;
    core.vx = 0;
    core.vy = 0;
    slot.filled = true;
    slot.glow = 1;
    G.docked += 1;
    G.dockedAll += 1;
    G.flash = 0.22;
    G.flashCol = polHex(core.p);
    const rest = slotRest(slot);
    ripple(rest.x, rest.y, core.p === 1 ? "c" : "m", 64);
    emit(16, {
      x: rest.x,
      y: rest.y,
      j: 8,
      vx0: -70,
      vx1: 70,
      vy0: slot.side === "floor" ? -160 : 40,
      vy1: slot.side === "floor" ? -40 : 160,
      life: 0.45,
      r0: 1.2,
      r1: 3.4,
      col: core.p === 1 ? "c" : "m"
    });
    audio.dock(core.p);
    if (G.docked >= G.total && G.mode === "play") {
      G.mode = "clear";
      G.clearT = 0.92;
      toast("列满", "");
    }
  }

  function nextStage() {
    if (G.stage + 1 >= STAGES.length) {
      G.mode = "win";
      showOverlay("win");
      audio.win();
      return;
    }
    loadStage(G.stage + 1);
    G.mode = "play";
  }

  function shatter(core) {
    core.dead = true;
    emit(22, {
      x: core.x,
      y: core.y,
      j: 10,
      vx0: -180,
      vx1: 180,
      vy0: -200,
      vy1: 80,
      life: 0.5,
      r0: 1.4,
      r1: 4,
      col: "m"
    });
    ripple(core.x, core.y, "m", 72);
  }

  function updateMagnet(dt, demo) {
    const mag = G.mag;
    mag.prevX = mag.x;
    let steer = 0;
    if (!demo) {
      if (keys.l || pad.l) steer -= 1;
      if (keys.r || pad.r) steer += 1;
      if (steer) mag.target += steer * MAG_SPD * dt;
      if (pointer.down && pointer.moved) mag.target = pointer.x;
    }
    mag.target = clamp(mag.target, magMin(), magMax());
    mag.x = lerp(mag.x, mag.target, 1 - Math.exp(-14 * dt));
    mag.spin += (mag.x - mag.prevX) * 0.085;
    mag.glow = Math.max(0, mag.glow - dt * 2.4);
    mag.flipT = Math.max(0, mag.flipT - dt);
  }

  function updateCores(dt, demo) {
    const mag = G.mag;
    const cores = G.cores;
    let hold = 0;
    let zap = false;

    for (let i = 0; i < cores.length; i++) {
      const c = cores[i];
      if (c.dead) continue;
      if (c.docked) {
        const rest = c.home ? slotRest(c.home) : { x: c.x, y: c.y };
        c.x = lerp(c.x, rest.x, 1 - Math.exp(-12 * dt));
        c.y = lerp(c.y, rest.y, 1 - Math.exp(-12 * dt));
        c.vx *= 0.8;
        c.vy *= 0.8;
        c.spin += dt * 0.4;
        c.pop = Math.min(1, c.pop + dt * 3);
        continue;
      }

      const dx = c.x - mag.x;
      const dy = c.y - mag.y;
      const d = hypot2(dx, dy) || 0.001;
      const nx = dx / d;
      const ny = dy / d;
      const attract = mag.p !== c.p;
      let ax = 0;
      let ay = GRAV;
      const stuck = attract && (d < STICK || (c.held > 0.22 && d < STICK + 46));

      if (stuck) {
        c.x += mag.x - mag.prevX;
        const holdX = mag.x;
        const holdY = mag.y - MAG_R - c.r + 2;
        ax += (holdX - c.x) * 92;
        ay += (holdY - c.y) * 92;
        c.held = Math.min(1, c.held + dt * 6);
        hold = Math.max(hold, 1 - d / (STICK + 20));
      } else {
        const acc = Math.min(MAG_MAX, MAG_K / (d * d + MAG_EPS));
        const sign = attract ? -1 : 1;
        ax += nx * acc * sign;
        ay += ny * acc * sign;
        c.held = Math.max(0, c.held - dt * 3);
      }

      for (let s = 0; s < G.slots.length; s++) {
        const slot = G.slots[s];
        if (slot.filled) continue;
        const rest = slotRest(slot);
        const sdx = rest.x - c.x;
        const sdy = rest.y - c.y;
        const sd = hypot2(sdx, sdy) || 0.001;
        if (slot.p === c.p) {
          if (sd < 96) {
            const u = 1 - sd / 96;
            ax += (sdx / sd) * 340 * u * u;
            ay += (sdy / sd) * 340 * u * u;
            slot.pulse = Math.max(slot.pulse, u);
          }
        } else if (sd < 44) {
          const u = 1 - sd / 44;
          ax -= (sdx / sd) * 520 * u;
          ay -= (sdy / sd) * 520 * u;
        }
      }

      ax += Math.sin(G.t * 1.4 + c.wob) * 10;
      ay += Math.cos(G.t * 1.1 + c.wob) * 6;

      c.vx += ax * dt;
      c.vy += ay * dt;
      const sp = hypot2(c.vx, c.vy);
      if (sp > MAX_SPD) {
        c.vx = (c.vx / sp) * MAX_SPD;
        c.vy = (c.vy / sp) * MAX_SPD;
      }
      const damp = stuck ? DAMP + 3.4 : DAMP;
      c.vx *= Math.exp(-damp * dt);
      c.vy *= Math.exp(-damp * dt);
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.spin += dt * (0.5 + c.held);
      c.stretch = lerp(c.stretch, 1 + Math.min(0.22, sp / 520), 0.2);

      bounceCircle(c, mag.x, mag.y, MAG_R - 2);

      for (let p = 0; p < G.posts.length; p++) {
        bounceCircle(c, G.posts[p].x, G.posts[p].y, G.posts[p].r);
      }

      const minX = WALL + c.r + 4;
      const maxX = WORLD_W - WALL - c.r - 4;
      if (c.x < minX) {
        c.x = minX;
        c.vx = Math.abs(c.vx) * 0.55;
      } else if (c.x > maxX) {
        c.x = maxX;
        c.vx = -Math.abs(c.vx) * 0.55;
      }

      const deck = FLOOR_Y - 10;
      if (c.y > deck - c.r) {
        c.y = deck - c.r;
        if (c.vy > 0) c.vy = -c.vy * 0.34;
      }
      const roof = CEIL_Y + 10;
      if (c.y < roof + c.r) {
        c.y = roof + c.r;
        if (c.vy < 0) c.vy = -c.vy * 0.34;
      }

      for (let s = 0; s < G.slots.length; s++) {
        const slot = G.slots[s];
        const rest = slotRest(slot);
        const near = hypot2(c.x - rest.x, c.y - rest.y);
        if (slot.filled) {
          if (near < 26) bounceCircle(c, rest.x, rest.y, c.r + 6);
          continue;
        }
        const overFloor = slot.side === "floor" && stuck && Math.abs(mag.x - slot.x) < 42;
        const overCeil = slot.side === "ceil" && !stuck && c.y < CEIL_Y + 70 && Math.abs(c.x - slot.x) < 30;
        if (slot.p === c.p && (inMouth(c, slot, 4) || overFloor || overCeil)) {
          dockCore(c, slot);
          break;
        }
        if (slot.p !== c.p && near < 18 && !stuck) {
          shatter(c);
          zap = true;
          break;
        }
      }

      c.trail.push({ x: c.x, y: c.y });
      if (c.trail.length > 8) c.trail.shift();

      if (attract && d < STICK + 10 && Math.random() < dt * 10) {
        if (arcs.length > 18) arcs.shift();
        arcs.push({
          ax: mag.x + rand(-8, 8),
          ay: mag.y - 8,
          bx: c.x + rand(-6, 6),
          by: c.y + rand(-6, 6),
          t: 1,
          col: mag.p === 1 ? "c" : "m"
        });
      }
    }

    for (let i = 0; i < cores.length; i++) {
      if (cores[i].docked || cores[i].dead) continue;
      for (let j = i + 1; j < cores.length; j++) {
        if (cores[j].docked || cores[j].dead) continue;
        const a = cores[i];
        const b = cores[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = hypot2(dx, dy) || 0.001;
        const min = a.r + b.r + 1.4;
        if (dist < min) {
          const nx = dx / dist;
          const ny = dy / dist;
          const ov = (min - dist) * 0.5;
          a.x -= nx * ov;
          a.y -= ny * ov;
          b.x += nx * ov;
          b.y += ny * ov;
          const dv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (dv < 0) {
            const imp = dv * 0.82;
            a.vx += nx * imp;
            a.vy += ny * imp;
            b.vx -= nx * imp;
            b.vy -= ny * imp;
          }
        }
      }
    }

    G.nearHold = hold;
    if (zap && !demo) fail("zap");
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 140 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.55;
      r.r += (r.max - r.r) * 6.2 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = arcs.length - 1; i >= 0; i--) {
      arcs[i].t -= dt * 4.5;
      if (arcs[i].t <= 0) arcs.splice(i, 1);
    }
    for (let i = 0; i < G.slots.length; i++) {
      G.slots[i].glow = Math.max(0, G.slots[i].glow - dt * 1.4);
      G.slots[i].pulse = Math.max(0, G.slots[i].pulse - dt * 1.8);
    }
    for (let i = 0; i < G.posts.length; i++) G.posts[i].spin += dt * 0.7;
    G.shake = Math.max(0, G.shake - dt * 16);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    if (G.mode === "play") {
      if (G.lock <= 0) G.remain -= dt;
      if (G.remain < 8 && !G.warned) {
        G.warned = true;
        toast("线圈要过热了", "warn");
        audio.time();
      }
      if (G.remain <= 0) {
        G.remain = 0;
        fail("time");
      }
    }
    updateMagnet(dt, false);
    if (G.mode === "play" || G.mode === "clear" || G.mode === "die") {
      updateCores(dt, G.mode !== "play");
    }
    if (G.mode === "clear") {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
    if (G.mode === "die") {
      G.dieT -= dt;
      if (G.dieT <= 0) finishDie();
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    if (!G.slots.length) loadStage(0, true);
    G.remain = STAGES[0].time;
    G.mag.target = 480 + Math.sin(G.t * 0.42) * 240;
    if ((G.clock * 0.35 | 0) !== ((G.clock - dt) * 0.35 | 0)) {
      G.mag.p = G.mag.p === 1 ? -1 : 1;
      G.mag.glow = 1;
      syncFlipBtns();
    }
    updateMagnet(dt, true);
    updateCores(dt, true);
    let live = 0;
    for (let i = 0; i < G.cores.length; i++) {
      if (!G.cores[i].dead) live += 1;
      if (G.cores[i].docked) {
        loadStage(0, true);
        return;
      }
    }
    if (live === 0) loadStage(0, true);
  }

  function update(dt) {
    if (G.mode === "title") updateTitle(dt);
    else updatePlay(dt);
    updateFx(dt);
    const play = G.mode === "play" || G.mode === "clear";
    audio.tickDrone(play, G.nearHold, G.mag.p);
    syncHud();
  }

  function syncHud(force) {
    const key = G.mode + ":" + G.stage + ":" + G.lives + ":" + G.docked + ":" + (G.remain | 0) + ":" + G.mag.p;
    if (!force && key === G.hud) return;
    G.hud = key;
    if (G.mode === "title") {
      stageLabel.textContent = "磁列";
      polLabel.textContent = "极 —";
      polLabel.classList.remove("south");
      timeLabel.textContent = "";
      timeLabel.classList.remove("warn");
    } else {
      const s = STAGES[G.stage];
      stageLabel.textContent = "关卡 " + (G.stage + 1) + "/" + STAGES.length + " · " + s.name + " " + s.sub;
      polLabel.textContent = G.mag.p === 1 ? "北极" : "南极";
      polLabel.classList.toggle("south", G.mag.p !== 1);
      timeLabel.textContent = Math.ceil(Math.max(0, G.remain)) + "″";
      timeLabel.classList.toggle("warn", G.remain < 8 && G.mode === "play");
    }
    let html = "";
    const show = G.mode === "title" ? 0 : LIVES;
    for (let i = 0; i < show; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 && G.mode === "play" ? " on warn" : " on") : "") + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function colOf(c) {
    if (c === "m") return "#ff3db8";
    if (c === "g") return "#ffe36b";
    return "#00f0ff";
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.5, "#090510");
    g.addColorStop(1, "#04020c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + Math.sin(G.clock * 0.7) * 0.5;
    const mag = ctx.createRadialGradient(WORLD_W * 0.18, 40, 10, WORLD_W * 0.18, 40, 280);
    mag.addColorStop(0, "rgba(255, 61, 184," + (0.08 + pulse * 0.04) + ")");
    mag.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const cyn = ctx.createRadialGradient(WORLD_W * 0.82, WORLD_H - 40, 10, WORLD_W * 0.82, WORLD_H - 40, 260);
    cyn.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    cyn.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = cyn;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.045)";
    ctx.lineWidth = 1;
    for (let x = 48; x < WORLD_W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, CEIL_Y + 8);
      ctx.lineTo(x, FLOOR_Y - 12);
      ctx.stroke();
    }
    for (let y = 64; y < FLOOR_Y; y += 48) {
      ctx.beginPath();
      ctx.moveTo(WALL + 8, y);
      ctx.lineTo(WORLD_W - WALL - 8, y);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x + Math.sin(G.clock * 0.35 + m.p) * 10 * m.s;
      const y = m.y + Math.cos(G.clock * 0.22 + m.p) * 6;
      ctx.fillStyle = "rgba(190, 220, 255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawChamber() {
    ctx.save();
    ctx.fillStyle = "rgba(10, 8, 22, 0.92)";
    ctx.fillRect(0, 0, WORLD_W, CEIL_Y + 8);
    ctx.fillRect(0, FLOOR_Y - 6, WORLD_W, WORLD_H - (FLOOR_Y - 6));
    ctx.fillRect(0, 0, WALL, WORLD_H);
    ctx.fillRect(WORLD_W - WALL, 0, WALL, WORLD_H);

    ctx.strokeStyle = "rgba(0, 240, 255, 0.22)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(WALL, CEIL_Y + 8);
    ctx.lineTo(WALL, FLOOR_Y - 8);
    ctx.moveTo(WORLD_W - WALL, CEIL_Y + 8);
    ctx.lineTo(WORLD_W - WALL, FLOOR_Y - 8);
    ctx.stroke();

    ctx.shadowColor = "#ff3db8";
    ctx.strokeStyle = "rgba(255, 61, 184, 0.28)";
    ctx.beginPath();
    ctx.moveTo(WALL, CEIL_Y + 8);
    ctx.lineTo(WORLD_W - WALL, CEIL_Y + 8);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(WALL + 10, RAIL_Y);
    ctx.lineTo(WORLD_W - WALL - 10, RAIL_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 61, 184, 0.18)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(WALL + 10, RAIL_Y + 7);
    ctx.lineTo(WORLD_W - WALL - 10, RAIL_Y + 7);
    ctx.stroke();
    ctx.strokeStyle = "rgba(246, 243, 255, 0.12)";
    ctx.lineWidth = 1;
    for (let x = WALL + 28; x < WORLD_W - WALL; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, RAIL_Y - 4);
      ctx.lineTo(x, RAIL_Y + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSlot(slot) {
    const rest = slotRest(slot);
    const col = polCol(slot.p);
    const hex = polHex(slot.p);
    const w = SLOT_W;
    const h = 36;
    const pulse = 0.35 + slot.pulse * 0.65 + slot.glow * 0.5;
    ctx.save();
    ctx.translate(slot.x, rest.y);
    ctx.shadowColor = hex;
    ctx.shadowBlur = 12 + pulse * 10;
    if (slot.side === "floor") {
      roundRect(-w * 0.5, -8, w, h, 8);
    } else {
      roundRect(-w * 0.5, -h + 8, w, h, 8);
    }
    ctx.fillStyle = slot.filled ? rgb(col, 0.2) : "rgba(6, 4, 14, 0.88)";
    ctx.fill();
    ctx.strokeStyle = rgb(col, 0.35 + pulse * 0.45);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgb(col, 0.18);
    ctx.lineWidth = 1;
    const dir = slot.side === "floor" ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.32, dir * (6 + i * 7));
      ctx.lineTo(w * 0.32, dir * (6 + i * 7));
      ctx.stroke();
    }
    ctx.fillStyle = hex;
    ctx.globalAlpha = 0.55 + pulse * 0.4;
    ctx.font = "700 13px Segoe UI, Noto Sans SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(polName(slot.p) + "槽", 0, slot.side === "floor" ? 18 : -18);
    ctx.restore();
  }

  function drawPost(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin * 0.15);
    ctx.fillStyle = "#141022";
    ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 61, 184, 0.45)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.55, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-p.r * 0.4, 0);
    ctx.lineTo(p.r * 0.4, 0);
    ctx.moveTo(0, -p.r * 0.4);
    ctx.lineTo(0, p.r * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  function drawField(mag) {
    const hex = polHex(mag.p);
    const t = G.t;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(mag.x, mag.y - 6, 6, mag.x, mag.y - 6, 210);
    glow.addColorStop(0, rgb(polCol(mag.p), 0.16 + mag.glow * 0.12));
    glow.addColorStop(0.45, rgb(polCol(mag.p), 0.05));
    glow.addColorStop(1, rgb(polCol(mag.p), 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mag.x, mag.y - 6, 210, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = hex;
    ctx.lineWidth = 1.35;
    ctx.shadowColor = hex;
    ctx.shadowBlur = 8;
    const loops = 8;
    for (let i = 0; i < loops; i++) {
      const u = i / (loops - 1);
      const spread = (u - 0.5) * 2;
      const side = spread < 0 ? -1 : 1;
      const amp = 46 + Math.abs(spread) * 118;
      const h = 78 + Math.abs(spread) * 148;
      const phase = t * (mag.p === 1 ? 1.55 : 1.2) + i * 0.45;
      ctx.globalAlpha = 0.14 + 0.12 * (0.5 + 0.5 * Math.sin(phase));
      const x0 = mag.x + spread * 10;
      const y0 = mag.y - 10;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(
        x0 + side * amp * 0.15,
        y0 - h * 0.32,
        x0 + side * amp,
        y0 - h * 0.62,
        x0 + side * amp * 0.72,
        y0 - h
      );
      ctx.bezierCurveTo(
        x0 + side * amp * 0.22,
        y0 - h * 1.05,
        x0 + side * 10,
        y0 - 28,
        x0,
        y0 - 2
      );
      ctx.stroke();

      const flow = mag.p === 1 ? (phase * 0.12) % 1 : 1 - ((phase * 0.12) % 1);
      const px = x0 + side * amp * Math.sin(flow * Math.PI) * 0.85;
      const py = y0 - h * (0.15 + flow * 0.75);
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(px, py, 2.1, 0, TAU);
      ctx.fillStyle = hex;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMagnet(mag) {
    const hex = polHex(mag.p);
    const col = polCol(mag.p);
    ctx.save();
    ctx.translate(mag.x, mag.y);

    ctx.fillStyle = "rgba(12, 10, 24, 0.95)";
    ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
    ctx.lineWidth = 1.4;
    roundRect(-34, 18, 20, 12, 4);
    ctx.fill();
    ctx.stroke();
    roundRect(14, 18, 20, 12, 4);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(-24, 24);
    ctx.rotate(mag.spin);
    ctx.strokeStyle = hex;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0.2, 2.4);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(24, 24);
    ctx.rotate(mag.spin);
    ctx.strokeStyle = hex;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0.2, 2.4);
    ctx.stroke();
    ctx.restore();

    ctx.shadowColor = hex;
    ctx.shadowBlur = 16 + mag.glow * 14;
    for (let i = 0; i < 5; i++) {
      const y = -18 + i * 7;
      ctx.fillStyle = i % 2 ? rgb(col, 0.28) : "rgba(18, 14, 36, 0.95)";
      ctx.strokeStyle = rgb(col, 0.45);
      ctx.lineWidth = 1.4;
      roundRect(-22, y, 44, 8, 3);
      ctx.fill();
      ctx.stroke();
    }
    ctx.shadowBlur = 18;
    ctx.fillStyle = rgb(col, 0.85);
    ctx.beginPath();
    ctx.arc(0, -2, 11, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#05030c";
    ctx.font = "800 13px Segoe UI, Noto Sans SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(polName(mag.p), 0, -1);
    ctx.restore();
  }

  function drawCore(c) {
    const hex = polHex(c.p);
    const col = polCol(c.p);
    if (c.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = rgb(col, 0.28);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.trail[0].x, c.trail[0].y);
      for (let i = 1; i < c.trail.length; i++) ctx.lineTo(c.trail[i].x, c.trail[i].y);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.spin * 0.15);
    const s = c.r * (c.docked ? 0.88 : c.stretch);
    ctx.scale(s / c.r, (2 - (s / c.r)) * 0.96);
    ctx.shadowColor = hex;
    ctx.shadowBlur = 12 + c.held * 10;
    roundRect(-c.r, -c.r, c.r * 2, c.r * 2, 6);
    const g = ctx.createLinearGradient(-c.r, -c.r, c.r, c.r);
    g.addColorStop(0, "#2a2438");
    g.addColorStop(0.45, "#16121f");
    g.addColorStop(1, "#0c0a14");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgb(col, 0.55 + c.held * 0.35);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(246, 243, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-c.r + 5, -c.r + 6);
    ctx.lineTo(c.r - 8, -c.r + 6);
    ctx.stroke();
    ctx.fillStyle = hex;
    ctx.globalAlpha = 0.9;
    ctx.font = "800 14px Segoe UI, Noto Sans SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(polName(c.p), 0, 0.5);
    ctx.restore();
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = colOf(p.col);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.globalAlpha = Math.max(0, r.t) * 0.45;
      ctx.strokeStyle = colOf(r.col);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      ctx.globalAlpha = Math.max(0, a.t) * 0.7;
      ctx.strokeStyle = colOf(a.col);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(a.ax, a.ay);
      const mx = (a.ax + a.bx) * 0.5 + (a.ay - a.by) * 0.12;
      const my = (a.ay + a.by) * 0.5;
      ctx.quadraticCurveTo(mx, my, a.bx, a.by);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHeat() {
    if (G.mode === "title") return;
    const s = STAGES[G.stage];
    const u = clamp(G.remain / s.time, 0, 1);
    const x = WALL + 18;
    const y = CEIL_Y + 14;
    const w = WORLD_W - WALL * 2 - 36;
    ctx.save();
    roundRect(x, y, w, 5, 3);
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fill();
    roundRect(x, y, w * u, 5, 3);
    ctx.fillStyle = u < 0.22 ? "#ff3db8" : u < 0.45 ? "#ffe36b" : "#00f0ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) * 0.45 : 0;
    ctx.save();
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);

    drawBg();
    drawField(G.mag);
    drawChamber();
    for (let i = 0; i < G.slots.length; i++) drawSlot(G.slots[i]);
    for (let i = 0; i < G.posts.length; i++) drawPost(G.posts[i]);
    drawMagnet(G.mag);
    for (let i = 0; i < G.cores.length; i++) {
      if (!G.cores[i].dead) drawCore(G.cores[i]);
    }
    drawFx();
    drawHeat();

    if (G.flash > 0) {
      ctx.fillStyle = G.flashCol;
      ctx.globalAlpha = G.flash * 0.16;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function toWorld(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const x = cx - rect.left;
    const y = cy - rect.top;
    return {
      x: (x - view.ox) / view.scale,
      y: (y - view.oy) / view.scale
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    view.dpr = Math.min(2, window.devicePixelRatio || 1);
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    canvas.width = Math.max(1, (view.w * view.dpr) | 0);
    canvas.height = Math.max(1, (view.h * view.dpr) | 0);
    view.scale = Math.min(view.w / WORLD_W, view.h / WORLD_H);
    view.ox = (view.w - WORLD_W * view.scale) / 2;
    view.oy = (view.h - WORLD_H * view.scale) / 2;
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (G.mode !== "play") return;
    e.preventDefault();
    const w = toWorld(e.clientX, e.clientY);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.sx = w.x;
    pointer.moved = false;
    pointer.t = G.t;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }

  function onPointerMove(e) {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const w = toWorld(e.clientX, e.clientY);
    pointer.x = w.x;
    pointer.y = w.y;
    if (Math.abs(w.x - pointer.sx) > 12) pointer.moved = true;
    if (pointer.moved && G.mode === "play") {
      G.mag.target = clamp(w.x, magMin(), magMax());
    }
  }

  function onPointerUp(e) {
    if (!pointer.down || (e.pointerId != null && e.pointerId !== pointer.id)) return;
    const tap = !pointer.moved && (G.t - pointer.t) < 0.35;
    pointer.down = false;
    pointer.id = null;
    if (tap && G.mode === "play") flipPolarity();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function bindHold(btn, side) {
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      pad[side] = true;
      btn.classList.add("held");
      audio.ensure();
    };
    const up = function (e) {
      e.preventDefault();
      pad[side] = false;
      btn.classList.remove("held");
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
  }
  bindHold(btnLeft, "l");
  bindHold(btnRight, "r");

  function onFlipClick(e) {
    e.preventDefault();
    e.stopPropagation();
    audio.ensure();
    if (G.mode === "title") startRun();
    else flipPolarity();
  }
  btnFlip.addEventListener("click", onFlipClick);
  btnFlipPad.addEventListener("click", onFlipClick);

  btnMute.addEventListener("click", function (e) {
    e.preventDefault();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function (e) {
    e.preventDefault();
    audio.ensure();
    retryRun();
  });
  ovBtn.addEventListener("click", function (e) {
    e.preventDefault();
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startRun();
  });

  window.addEventListener("keydown", function (e) {
    if (e.repeat && (e.code === "Space" || e.code === "KeyM" || e.code === "KeyR")) return;
    const overlayOn = G.mode === "title" || G.mode === "win" || G.mode === "lose";
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      keys.l = true;
      e.preventDefault();
    } else if (e.code === "ArrowRight" || e.code === "KeyD") {
      keys.r = true;
      e.preventDefault();
    } else if (e.code === "Space" || e.code === "KeyF" || e.code === "KeyW" || e.code === "ArrowUp") {
      e.preventDefault();
      audio.ensure();
      if (overlayOn) startRun();
      else flipPolarity();
    } else if (e.code === "Enter") {
      e.preventDefault();
      audio.ensure();
      if (overlayOn) startRun();
    } else if (e.code === "KeyM") {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
    } else if (e.code === "KeyR") {
      e.preventDefault();
      audio.ensure();
      retryRun();
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.l = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.r = false;
  });

  let hidden = false;
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener("resize", resize);
  window.addEventListener("blur", function () {
    keys.l = keys.r = false;
    pad.l = pad.r = false;
  });

  makeMotes();
  loadStage(0, true);
  showOverlay("title");
  syncHud(true);
  resize();

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    if (!hidden) {
      acc += dt;
      G.t += dt;
      if (acc > 0.25) acc = 0.25;
      while (acc >= STEP) {
        update(STEP);
        acc -= STEP;
      }
      draw();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__MR = G;
})();
