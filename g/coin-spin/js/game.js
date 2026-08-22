(() => {
  "use strict";

  const VW = 480;
  const VH = 700;
  const CX = 240;
  const DROP_Y = 158;
  const BASE_Y = 548;
  const TABLE_Y = 586;
  const R = 86;
  const SQUASH = 0.37;
  const THICK = 13;
  const LIFT = 15;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const FALL = 0.3;
  const MUTE_KEY = "playbox-coin-spin-mute";
  const OPS = "空格 / 点击落下 · 孔亮青再叠 · M 静音";

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];

  const STAGES = [
    {
      name: "初旋", sub: "FIRST", need: 2, omega: 1.08, peg: 0, tol: 0.34, fold: 4,
      ghost: true, hint: "方孔对上立柱，亮青再落", toast: "孔亮了就落"
    },
    {
      name: "连叠", sub: "CHAIN", need: 3, omega: 1.38, peg: 0, tol: 0.26, fold: 4,
      hint: "连叠三枚，节奏一样", toast: "三枚都要对孔"
    },
    {
      name: "紧口", sub: "TIGHT", need: 3, omega: 1.72, peg: 0, tol: 0.17, fold: 4,
      hint: "窗口更窄，等正中", toast: "亮得更短了"
    },
    {
      name: "逆转", sub: "BACK", need: 3, omega: -1.88, peg: 0, tol: 0.16, fold: 4,
      hint: "反过来旋，别跟旧方向", toast: "方向反了"
    },
    {
      name: "疾转", sub: "SWIFT", need: 4, omega: 2.28, peg: 0, tol: 0.135, fold: 4,
      hint: "转得更快，看亮再落", toast: "四枚，别抢"
    },
    {
      name: "柱转", sub: "PEG", need: 3, omega: 1.92, peg: 0.62, tol: 0.14, fold: 4,
      hint: "立柱也在转，两孔都要对", toast: "柱在转"
    },
    {
      name: "长孔", sub: "SLIT", need: 3, omega: 2.05, peg: 0, tol: 0.155, fold: 2,
      hint: "长孔一圈只对两次", toast: "变成一条缝"
    },
    {
      name: "偏心", sub: "WOB", need: 4, omega: 2.22, peg: 0, tol: 0.12, fold: 4, wob: 13,
      hint: "币会晃，看孔不要看边", toast: "盯着方孔"
    },
    {
      name: "薄缝", sub: "HAIR", need: 4, omega: 2.35, peg: -0.72, tol: 0.115, fold: 2,
      hint: "柱逆转，长孔要对准", toast: "缝更薄，柱在逆行"
    },
    {
      name: "满贯", sub: "FULL", need: 5, omega: 2.52, peg: 0.82, tol: 0.1, fold: 2, wob: 9,
      hint: "五枚金旋，一次都别歪", toast: "最后一柱"
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
  const btnDrop = document.getElementById("btn-drop");
  const fillWrap = document.getElementById("fill-wrap");
  const fillBar = document.getElementById("fill-bar");
  const fillNum = document.getElementById("fill-num");
  const stageLabel = document.getElementById("stage-label");
  const tagLabel = document.getElementById("tag-label");
  const qiLabel = document.getElementById("qi-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const particles = [];
  const rings = [];
  const flies = [];
  const floats = [];
  const motes = [];
  const pips = [];

  const G = {
    mode: "title",
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    fill: 0,
    need: 2,
    combo: 0,
    bestCombo: 0,
    perfects: 0,
    total: 0,
    omega: 1.08,
    pegW: 0,
    tol: 0.34,
    fold: 4,
    wob: 0,
    ghost: false,
    hx: 16.5,
    hy: 16.5,
    px: 12,
    py: 12,
    th: 0.4,
    pegTh: 0,
    stack: [],
    drop: {
      y: DROP_Y,
      falling: false,
      t: 0,
      fromY: DROP_Y,
      toY: DROP_Y,
      ok: false,
      perfect: false,
      squash: 1
    },
    lock: 0,
    cool: 0,
    settle: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    heat: 0,
    inWin: false,
    wasHot: false,
    taught: false,
    demoWait: 0.9,
    wantDrop: false,
    why: "",
    judge: "",
    judgeT: 0,
    judgeCol: CYN
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
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
  }
  function holeSpec(fold) {
    if (fold === 2) return { hx: 22, hy: 8.2 };
    return { hx: 16.6, hy: 16.6 };
  }
  function angErr(th, peg, fold) {
    const period = TAU / fold;
    let d = th - peg;
    d = ((d % period) + period) % period;
    return Math.min(d, period - d);
  }
  function nearestMatch(th, peg, fold) {
    const period = TAU / fold;
    let d = th - peg;
    d = ((d % period) + period) % period;
    if (d > period * 0.5) d -= period;
    return th - d;
  }
  function quadAt(cx, cy, th, hx, hy) {
    const c = Math.cos(th);
    const s = Math.sin(th);
    const loc = [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]];
    const out = [];
    for (let i = 0; i < 4; i++) {
      const x = loc[i][0];
      const y = loc[i][1];
      out.push({
        x: cx + x * c - y * s,
        y: cy + (x * s + y * c) * SQUASH
      });
    }
    return out;
  }
  function pathQuad(pts) {
    ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (let i = 1; i < 4; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
    ctx.closePath();
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastNear: -9,
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
      f.frequency.value = freq || 1400;
      f.Q.value = 0.85;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    start() {
      this.ensure();
      this.beep(196, 0.14, "sine", 0.07, 392);
      this.beep(294, 0.22, "triangle", 0.045, 588);
    },
    drop() {
      this.ensure();
      this.beep(440, 0.07, "sine", 0.05, 180);
      this.noise(0.05, 0.03, 2200);
    },
    land(perfect) {
      this.ensure();
      this.noise(0.07, 0.06, 900);
      this.beep(perfect ? 784 : 494, 0.12, "triangle", 0.07, perfect ? 1176 : 740);
      this.beep(perfect ? 1176 : 330, 0.2, "sine", perfect ? 0.06 : 0.04, perfect ? 1568 : 494);
    },
    miss() {
      this.ensure();
      this.noise(0.16, 0.09, 700);
      this.beep(220, 0.38, "sawtooth", 0.08, 55);
    },
    near() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.2) return;
      this.lastNear = now;
      this.beep(1240, 0.05, "sine", 0.032, 1760);
    },
    empty() {
      this.ensure();
      this.beep(260, 0.06, "square", 0.03, 110);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.12, "triangle", 0.06, 784);
      this.beep(588, 0.2, "sine", 0.045, 880);
    },
    win() {
      this.ensure();
      this.beep(392, 0.14, "sine", 0.08, 523);
      this.beep(523, 0.22, "sine", 0.07, 784);
      this.beep(784, 0.36, "triangle", 0.08, 1176);
    },
    lose() {
      this.ensure();
      this.beep(174, 0.5, "sawtooth", 0.09, 50);
      this.beep(87, 0.7, "square", 0.05, 40);
    },
    tickDrone(heat, spinning) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 52;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const spd = Math.abs(G.omega);
      this.drone.frequency.setTargetAtTime(48 + spd * 10 + heat * 28, t, 0.12);
      this.droneGain.gain.setTargetAtTime(
        spinning ? 0.012 + heat * 0.03 + spd * 0.002 : 0.0001,
        t,
        0.14
      );
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.45, spec.j * 0.45),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        gold: !!spec.gold,
        mag: !!spec.mag,
        g: spec.g == null ? 420 : spec.g
      });
    }
  }

  function addRing(x, y, gold, r0) {
    rings.push({ x: x, y: y, t: 0, gold: !!gold, r0: r0 || 18 });
    if (rings.length > 14) rings.shift();
  }

  function floatAt(x, y, text, col) {
    floats.push({ x: x, y: y, text: text, col: col, t: 1 });
    if (floats.length > 8) floats.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.toggle("gold", !!gold && !warn);
    toastEl.classList.remove("hidden");
    G.toastT = 1.55;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle("hot", kind === "hot");
    hintEl.classList.toggle("warn", kind === "warn");
  }

  function judge(text, col) {
    G.judge = text;
    G.judgeCol = col;
    G.judgeT = 0.62;
  }

  function syncPips() {
    while (pips.length < LIVES) {
      const el = document.createElement("i");
      el.className = "pip on";
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      const on = i < G.lives;
      pips[i].className = "pip" + (on ? " on" : " gone") + (on && G.lives <= 1 && G.mode === "play" ? " warn" : "");
    }
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const k = G.need ? clamp(G.fill / G.need, 0, 1) : 0;
    fillBar.style.transform = "scaleX(" + k + ")";
    fillNum.textContent = G.fill + "/" + G.need;
    const almost = G.mode === "play" && G.fill === G.need - 1 && G.fill < G.need;
    fillWrap.classList.toggle("hot", G.mode === "play" && G.fill >= G.need);
    fillWrap.classList.toggle("warn", almost);
    fillWrap.classList.toggle("ready", G.mode === "play" && G.inWin && !G.drop.falling);
    if (G.mode === "title") {
      stageLabel.textContent = "十柱";
      tagLabel.textContent = "旋币";
      qiLabel.textContent = "齐 —";
    } else {
      stageLabel.textContent = "第 " + (G.stage + 1) + " 柱 · " + (st ? st.name : "");
      tagLabel.textContent = st ? st.sub : "";
      qiLabel.textContent = "齐 " + G.combo;
    }
    const hot = G.mode === "play" && G.fill >= G.need;
    stageLabel.classList.toggle("hot", hot);
    tagLabel.classList.toggle("hot", G.mode === "win" || hot);
    tagLabel.classList.toggle("warn", G.mode === "fail" || G.mode === "lose");
    qiLabel.classList.toggle("hot", G.combo >= 3);
    btnDrop.classList.toggle("hot", G.mode === "play" && G.inWin && !G.drop.falling);
    syncPips();
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove("hidden");
    panel.classList.toggle("win", kind === "win");
    panel.classList.toggle("lose", kind === "lose");
    ovKicker.textContent = kicker;
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovOps.textContent = ops || (coarse ? "点「落」或点屏幕 · M 静音" : OPS);
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    panel.classList.remove("win", "lose");
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.32 + 0.05,
        p: Math.random() * TAU,
        s: Math.random() * 14 + 4
      });
    }
  }

  function stackY(i) {
    return BASE_Y - i * LIFT;
  }

  function makeCoin(found, gold, mag) {
    return {
      th: G.pegTh,
      found: !!found,
      gold: !!gold,
      mag: !!mag,
      squash: 1
    };
  }

  function applyStage(st) {
    G.need = st.need;
    G.fill = 0;
    G.omega = st.omega;
    G.pegW = st.peg || 0;
    G.tol = st.tol;
    G.fold = st.fold;
    G.wob = st.wob || 0;
    G.ghost = !!st.ghost;
    const h = holeSpec(st.fold);
    G.hx = h.hx;
    G.hy = h.hy;
    G.px = h.hx * 0.7;
    G.py = h.hy * 0.7;
    G.th = rand(0, TAU);
    G.pegTh = 0;
    G.stack = [makeCoin(true, true, false)];
    G.drop.y = DROP_Y;
    G.drop.falling = false;
    G.drop.t = 0;
    G.drop.squash = 1;
    G.drop.ok = false;
    G.drop.perfect = false;
    G.why = "";
    G.wasHot = false;
    G.heat = 0;
    G.inWin = false;
    G.cool = 0;
  }

  function startStage(i) {
    G.mode = "play";
    G.stage = i;
    G.lock = 0.18;
    G.clock = 0;
    applyStage(STAGES[i]);
    hideOverlay();
    setHint(STAGES[i].hint, "");
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    flies.length = 0;
    floats.length = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.bestCombo = 0;
    G.perfects = 0;
    G.total = 0;
    G.taught = false;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    flies.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = "title";
    G.clock = 0;
    G.combo = 0;
    G.demoWait = 0.85;
    applyStage(STAGES[0]);
    G.ghost = true;
    showOverlay(
      "title",
      "旋币",
      "方孔旋着，对准立柱再叠上去。<br />孔亮青的瞬间落下。",
      "开旋",
      "SPIN",
      coarse ? "点「开旋」· 点「落」或点屏幕落下 · M 静音" : OPS
    );
    setHint("方孔对上立柱再落 · 空格 / 点击", "");
    syncHud();
  }

  function overlayAction() {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startRun();
  }

  function dropperCenter() {
    if (!G.wob) return { x: CX, y: G.drop.y };
    const a = G.clock * 1.75;
    return {
      x: CX + Math.cos(a) * G.wob,
      y: G.drop.y + Math.sin(a * 1.35) * G.wob * 0.32
    };
  }

  function sampleAlign() {
    const err = angErr(G.th, G.pegTh, G.fold);
    const inWin = err < G.tol;
    const perfect = err < G.tol * 0.38;
    let heat = 0;
    const near = G.tol * 1.55;
    if (err < near) {
      if (inWin) heat = 0.55 + 0.45 * (1 - err / G.tol);
      else heat = 0.4 * (1 - (err - G.tol) / (near - G.tol));
    }
    return { err: err, inWin: inWin, perfect: perfect, heat: heat };
  }

  function canDrop() {
    if (G.drop.falling) return false;
    if (G.cool > 0) return false;
    if (G.lock > 0) return false;
    if (G.mode !== "play" && G.mode !== "title") return false;
    if (G.why) return false;
    if (G.mode === "play" && G.fill >= G.need) return false;
    return true;
  }

  function spawnDropper() {
    G.drop.falling = false;
    G.drop.y = DROP_Y;
    G.drop.t = 0;
    G.drop.squash = 1;
    G.th = wrap(G.th + rand(-0.4, 0.4));
    G.cool = 0.12;
  }

  function landCoin(perfect) {
    const gold = perfect || G.stack.length % 2 === 0;
    G.stack.push(makeCoin(false, gold || perfect, !gold));
    G.stack[G.stack.length - 1].squash = 1.22;
    G.drop.falling = false;
    G.drop.y = DROP_Y;
    G.drop.squash = 1;
    const top = stackY(G.stack.length - 1);
    addRing(CX, top, perfect, 28);
    emit(perfect ? 16 : 10, {
      x: CX, y: top, j: 22,
      vx0: -90, vx1: 90, vy0: -160, vy1: -20,
      life: 0.55, r0: 1.2, r1: 3.2, gold: perfect, mag: !perfect, g: 260
    });
    audio.land(perfect);
    if (G.mode !== "play") {
      G.fill = Math.min(G.need, G.fill + 1);
      if (G.stack.length > 5) {
        G.stack.length = 1;
        G.fill = 0;
      }
      spawnDropper();
      return;
    }
    G.fill += 1;
    G.total += 1;
    if (perfect) {
      G.perfects += 1;
      G.combo += 1;
      if (G.combo > G.bestCombo) G.bestCombo = G.combo;
      G.goldFlash = 0.28;
      judge("齐", GOLD);
      floatAt(CX, top - 28, "齐", rgba(GOLD, 1));
    } else {
      G.combo = 0;
      judge("入柱", CYN);
      floatAt(CX, top - 26, "入柱", rgba(CYN, 1));
    }
    if (G.fill >= G.need) {
      G.mode = "clear";
      G.settle = 0.78;
      toast(STAGES[G.stage].name + " 满柱", false, true);
      audio.stage();
    } else {
      spawnDropper();
    }
    syncHud();
  }

  function missDrop() {
    const p = dropperCenter();
    const dir = G.omega >= 0 ? 1 : -1;
    flies.push({
      x: p.x,
      y: p.y,
      vx: dir * rand(90, 170) + rand(-40, 40),
      vy: rand(-80, -10),
      vr: dir * rand(6, 11),
      th: G.th,
      life: 0.85,
      hx: G.hx,
      hy: G.hy,
      mag: true
    });
    if (flies.length > 6) flies.shift();
    emit(14, {
      x: p.x, y: p.y, j: 16,
      vx0: -140, vx1: 140, vy0: -80, vy1: 40,
      life: 0.5, r0: 1, r1: 2.8, mag: true, g: 380
    });
    addRing(p.x, p.y, false, 22);
    G.drop.falling = false;
    G.drop.y = DROP_Y;
    G.shake = 7;
    G.magFlash = 0.32;
    G.combo = 0;
    audio.miss();
    judge("歪了", MAG);
    floatAt(p.x, p.y - 18, "飞了", rgba(MAG, 1));
    if (G.mode !== "play") {
      spawnDropper();
      return;
    }
    G.lives -= 1;
    syncHud();
    if (G.lives <= 0) {
      G.mode = "tolose";
      G.settle = 0.72;
      G.why = "miss";
      toast("没对上", true);
      return;
    }
    toast("偏了", true);
    spawnDropper();
    G.cool = 0.28;
  }

  function dropNow() {
    if (!canDrop()) {
      if (G.mode === "play" && !G.drop.falling && G.lock <= 0 && G.cool <= 0) audio.empty();
      return;
    }
    const a = sampleAlign();
    audio.drop();
    G.drop.falling = true;
    G.drop.t = 0;
    G.drop.fromY = G.drop.y;
    G.drop.toY = stackY(G.stack.length);
    G.drop.ok = a.inWin;
    G.drop.perfect = a.perfect;
    addRing(dropperCenter().x, G.drop.y + 8, a.inWin, 16);
    if (G.mode === "play" && !a.inWin && !G.taught) {
      toast("要对准方孔", true);
    }
  }

  function finishDrop() {
    if (G.drop.ok) landCoin(G.drop.perfect);
    else missDrop();
  }

  function startWin() {
    G.mode = "win";
    audio.win();
    showOverlay(
      "win",
      "柱已满",
      "十柱金旋都叠上了。齐 " + G.perfects + " · 连齐 " + G.bestCombo + " · 共 " + G.total + " 枚。",
      "再来一局",
      "FULL",
      "R 重开 · M 静音"
    );
    setHint("十柱都满了", "hot");
    syncHud();
  }

  function startLose() {
    G.mode = "lose";
    audio.lose();
    const st = STAGES[G.stage];
    showOverlay(
      "lose",
      "币飞了",
      "方孔没对上立柱。走到第 " + (G.stage + 1) + " 柱「" + (st ? st.name : "") + "」· 齐 " + G.perfects + "。",
      "再旋一次",
      "SPIN OUT",
      "R 重开 · M 静音"
    );
    setHint("没对上 · 再来", "warn");
    syncHud();
  }

  function updateDrop(dt) {
    if (!G.drop.falling) return;
    G.drop.t += dt / FALL;
    const u = clamp(G.drop.t, 0, 1);
    G.drop.y = lerp(G.drop.fromY, G.drop.toY, easeOut(u));
    if (G.drop.ok) {
      G.th = lerp(G.th, nearestMatch(G.th, G.pegTh, G.fold), 1 - Math.exp(-10 * dt));
    }
    if (u >= 1) finishDrop();
  }

  function updateStack(dt) {
    for (let i = 0; i < G.stack.length; i++) {
      const c = G.stack[i];
      c.th = G.pegTh;
      c.squash = lerp(c.squash, 1, 1 - Math.exp(-14 * dt));
    }
  }

  function updateFlies(dt) {
    for (let i = flies.length - 1; i >= 0; i--) {
      const f = flies[i];
      f.life -= dt;
      f.vy += 980 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.th += f.vr * dt;
      f.vx *= Math.exp(-dt * 0.4);
      if (f.life <= 0 || f.y > VH + 80) flies.splice(i, 1);
    }
  }

  function updateFx(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.cool = Math.max(0, G.cool - dt);
    G.shake *= Math.exp(-dt * 9);
    G.magFlash = Math.max(0, G.magFlash - dt);
    G.goldFlash = Math.max(0, G.goldFlash - dt);
    G.judgeT = Math.max(0, G.judgeT - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0) toastEl.classList.add("hidden");
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.3);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.55) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt * 0.9;
      f.y -= 26 * dt;
      if (f.t <= 0) floats.splice(i, 1);
    }
  }

  function spin(dt) {
    G.pegTh = wrap(G.pegTh + G.pegW * dt);
    if (G.drop.falling && G.drop.ok) return;
    if (!G.drop.falling) G.th = wrap(G.th + G.omega * dt);
    else G.th = wrap(G.th + G.omega * dt * 0.35);
  }

  function demoTick(dt) {
    G.demoWait -= dt;
    if (G.demoWait > 0) return;
    if (!canDrop()) {
      G.demoWait = 0.2;
      return;
    }
    if (sampleAlign().heat >= 0.82) {
      dropNow();
      G.demoWait = 1.35;
    } else {
      G.demoWait = 0.05;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    spin(dt);
    const al = sampleAlign();
    G.heat = al.heat;
    G.inWin = al.inWin;

    if (G.inWin && !G.wasHot && !G.drop.falling) {
      audio.near();
      const p = dropperCenter();
      addRing(p.x, p.y, false, 34);
      if (G.mode === "play" && !G.taught) {
        G.taught = true;
        toast("就是现在");
      }
    }
    G.wasHot = G.inWin;
    if (!G.drop.falling) {
      G.drop.squash = lerp(G.drop.squash, G.inWin ? 1.05 : 1, 1 - Math.exp(-12 * dt));
    }

    if (G.mode === "play") {
      if (G.inWin && !G.drop.falling) setHint("就是现在", "hot");
      else if (STAGES[G.stage]) setHint(STAGES[G.stage].hint, "");
    }

    if (G.mode === "clear") {
      G.settle -= dt;
      updateDrop(dt);
      updateStack(dt);
      updateFlies(dt);
      updateFx(dt);
      if (G.settle <= 0) {
        if (G.stage + 1 >= STAGES.length) startWin();
        else startStage(G.stage + 1);
      }
      return;
    }

    if (G.mode === "tolose") {
      G.settle -= dt;
      updateDrop(dt);
      updateStack(dt);
      updateFlies(dt);
      updateFx(dt);
      if (G.settle <= 0) startLose();
      return;
    }

    if (G.mode === "win" || G.mode === "lose") {
      updateStack(dt);
      updateFlies(dt);
      updateFx(dt);
      return;
    }

    if (G.mode === "title") demoTick(dt);
    if (G.wantDrop) {
      G.wantDrop = false;
      if (overlay.classList.contains("hidden")) dropNow();
    }
    updateDrop(dt);
    updateStack(dt);
    updateFlies(dt);
    updateFx(dt);
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, "#120818");
    g.addColorStop(0.45, "#070410");
    g.addColorStop(1, "#04020c");
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + Math.sin(G.clock * 0.7) * 0.5;
    const mag = ctx.createRadialGradient(sx(90), sy(80), 8 * scale, sx(90), sy(80), 280 * scale);
    mag.addColorStop(0, "rgba(255,61,184," + (0.07 + pulse * 0.04) + ")");
    mag.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = mag;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const cyn = ctx.createRadialGradient(sx(390), sy(560), 8 * scale, sx(390), sy(560), 260 * scale);
    cyn.addColorStop(0, "rgba(0,240,255,0.07)");
    cyn.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = cyn;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * 1.3 + m.p));
      ctx.fillStyle = rgba(i % 3 === 0 ? MAG : i % 3 === 1 ? CYN : GOLD, a);
      ctx.beginPath();
      ctx.arc(
        sx(m.x + Math.sin(G.t * 0.4 + m.p) * m.s * 0.15),
        sy(m.y),
        m.r * scale,
        0,
        TAU
      );
      ctx.fill();
    }
  }

  function drawTable() {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(sx(CX + 6), sy(TABLE_Y + 18), 168 * scale, 28 * scale, 0, 0, TAU);
    ctx.fill();

    const felt = ctx.createRadialGradient(sx(CX), sy(TABLE_Y), 10 * scale, sx(CX), sy(TABLE_Y), 170 * scale);
    felt.addColorStop(0, "#1a1028");
    felt.addColorStop(0.55, "#0c0816");
    felt.addColorStop(1, "#06040e");
    ctx.fillStyle = felt;
    ctx.beginPath();
    ctx.ellipse(sx(CX), sy(TABLE_Y), 162 * scale, 36 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.45)";
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.28)";
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.ellipse(sx(CX), sy(TABLE_Y), 128 * scale, 26 * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,227,107,0.16)";
    ctx.beginPath();
    ctx.ellipse(sx(CX), sy(TABLE_Y), 88 * scale, 17 * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawPeg(topY, botY, glow) {
    const top = quadAt(CX, topY, G.pegTh, G.px, G.py);
    const bot = quadAt(CX, botY, G.pegTh, G.px * 1.05, G.py * 1.05);
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const midY = (top[i].y + top[j].y) * 0.5;
      ctx.fillStyle = midY > top[(i + 2) % 4].y
        ? "rgba(8, 36, 44, 0.95)"
        : "rgba(4, 18, 24, 0.8)";
      ctx.beginPath();
      ctx.moveTo(sx(top[i].x), sy(top[i].y));
      ctx.lineTo(sx(top[j].x), sy(top[j].y));
      ctx.lineTo(sx(bot[j].x), sy(bot[j].y));
      ctx.lineTo(sx(bot[i].x), sy(bot[i].y));
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    pathQuad(top);
    ctx.fillStyle = glow ? "rgba(0,240,255,0.55)" : "rgba(0, 160, 180, 0.32)";
    ctx.fill();
    ctx.strokeStyle = glow ? rgba(CYN, 0.95) : "rgba(0,240,255,0.55)";
    ctx.lineWidth = (glow ? 2.2 : 1.4) * scale;
    ctx.shadowColor = rgba(CYN, glow ? 0.8 : 0.3);
    ctx.shadowBlur = (glow ? 16 : 6) * scale;
    ctx.stroke();
    ctx.restore();
  }

  function drawGlyphs(cx, cy, th, r, col, alpha) {
    ctx.save();
    ctx.fillStyle = col;
    ctx.globalAlpha = alpha;
    for (let n = 0; n < 4; n++) {
      const a = th + n * Math.PI * 0.5;
      const d = r * 0.62;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d * SQUASH;
      const px = -Math.sin(a);
      const py = Math.cos(a) * SQUASH;
      const fx = Math.cos(a);
      const fy = Math.sin(a) * SQUASH;
      ctx.beginPath();
      ctx.moveTo(sx(x + fx * 5), sy(y + fy * 5));
      ctx.lineTo(sx(x - fx * 3 + px * 5), sy(y - fy * 3 + py * 5));
      ctx.lineTo(sx(x - fx * 1), sy(y - fy * 1));
      ctx.lineTo(sx(x - fx * 3 - px * 5), sy(y - fy * 3 - py * 5));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCoin(cx, cy, th, hx, hy, opt) {
    const r = opt.r || R;
    const thick = (opt.thick || THICK) * (opt.squash || 1);
    const gold = !!opt.gold;
    const mag = !!opt.mag;
    const hot = !!opt.hot;
    const alpha = opt.alpha == null ? 1 : opt.alpha;
    const squashFace = SQUASH;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(sx(cx + 5), sy(cy + thick + 10), r * 0.9 * scale, r * squashFace * 0.62 * scale, 0, 0, TAU);
    ctx.fill();

    for (let i = thick | 0; i >= 1; i--) {
      const k = i / thick;
      ctx.fillStyle = gold
        ? "rgb(" + (48 + k * 50) + "," + (28 + k * 28) + "," + (8 + k * 10) + ")"
        : mag
          ? "rgb(" + (42 + k * 40) + "," + (8 + k * 10) + "," + (28 + k * 24) + ")"
          : "rgb(" + (12 + k * 18) + "," + (28 + k * 36) + "," + (36 + k * 40) + ")";
      const sideHole = quadAt(cx, cy + i, th, hx, hy);
      ctx.beginPath();
      ctx.ellipse(sx(cx), sy(cy + i), r * scale, r * squashFace * scale, 0, 0, TAU);
      pathQuad(sideHole);
      ctx.fill("evenodd");
    }

    const hole = quadAt(cx, cy, th, hx, hy);
    const g = ctx.createRadialGradient(
      sx(cx - r * 0.28), sy(cy - r * squashFace * 0.35), r * 0.08 * scale,
      sx(cx), sy(cy), r * scale
    );
    if (gold) {
      g.addColorStop(0, "#fff4c2");
      g.addColorStop(0.35, "#ffe36b");
      g.addColorStop(0.72, "#c4922a");
      g.addColorStop(1, "#6a4a12");
    } else if (mag) {
      g.addColorStop(0, "#ffd0ec");
      g.addColorStop(0.4, "#ff3db8");
      g.addColorStop(0.78, "#8a1860");
      g.addColorStop(1, "#3a0a24");
    } else {
      g.addColorStop(0, "#e8ffff");
      g.addColorStop(0.4, "#00f0ff");
      g.addColorStop(0.78, "#12707a");
      g.addColorStop(1, "#062428");
    }
    ctx.beginPath();
    ctx.ellipse(sx(cx), sy(cy), r * scale, r * squashFace * scale, 0, 0, TAU);
    pathQuad(hole);
    ctx.fillStyle = g;
    ctx.fill("evenodd");

    ctx.beginPath();
    ctx.ellipse(sx(cx), sy(cy), r * scale, r * squashFace * scale, 0, 0, TAU);
    ctx.strokeStyle = gold ? "rgba(255,227,107,0.85)" : mag ? "rgba(255,61,184,0.85)" : "rgba(0,240,255,0.8)";
    ctx.lineWidth = 2.1 * scale;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = (hot ? 18 : 8) * scale;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.ellipse(sx(cx), sy(cy), r * 0.78 * scale, r * squashFace * 0.78 * scale, 0, 0, TAU);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();

    drawGlyphs(
      cx, cy, th, r,
      gold ? "rgba(90,60,10,0.55)" : mag ? "rgba(40,8,24,0.5)" : "rgba(6,30,34,0.5)",
      1
    );

    ctx.beginPath();
    pathQuad(hole);
    ctx.strokeStyle = hot ? rgba(CYN, 0.95) : gold ? "rgba(255,227,107,0.55)" : "rgba(0,240,255,0.45)";
    ctx.lineWidth = (hot ? 2.4 : 1.5) * scale;
    ctx.shadowColor = rgba(CYN, hot ? 0.9 : 0.2);
    ctx.shadowBlur = (hot ? 14 : 0) * scale;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const lip = quadAt(cx, cy + Math.min(4, thick * 0.45), th, hx * 0.92, hy * 0.92);
    ctx.beginPath();
    pathQuad(hole);
    pathQuad(lip);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fill("evenodd");

    ctx.restore();
  }

  function drawGhostHole(cx, cy) {
    const pts = quadAt(cx, cy, G.pegTh, G.hx, G.hy);
    ctx.save();
    ctx.beginPath();
    pathQuad(pts);
    const hot = G.inWin;
    ctx.strokeStyle = hot ? rgba(CYN, 0.95) : rgba(CYN, G.ghost ? 0.55 : 0.28);
    ctx.lineWidth = (hot ? 3 : 1.6) * scale;
    ctx.setLineDash(hot ? [] : [5 * scale, 4 * scale]);
    ctx.shadowColor = rgba(CYN, hot ? 0.8 : 0.25);
    ctx.shadowBlur = (hot ? 16 : 4) * scale;
    ctx.stroke();
    ctx.restore();
  }

  function drawRingHolder(cx, cy) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,61,184,0.45)";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.ellipse(sx(cx), sy(cy - 16), (R + 18) * scale, (R * SQUASH + 8) * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,240,255,0.35)";
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.ellipse(sx(cx), sy(cy - 16), (R + 26) * scale, (R * SQUASH + 12) * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,240,255,0.55)";
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx(cx - R - 22), sy(40));
    ctx.lineTo(sx(cx - R - 18), sy(cy - 18));
    ctx.moveTo(sx(cx + R + 22), sy(40));
    ctx.lineTo(sx(cx + R + 18), sy(cy - 18));
    ctx.stroke();
    ctx.restore();
  }

  function drawHotPulse(cx, cy) {
    if (!G.inWin || G.drop.falling) return;
    const a = 0.35 + 0.25 * Math.sin(G.clock * 10);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(CYN, a);
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.ellipse(sx(cx), sy(cy), (R + 10 + a * 8) * scale, (R * SQUASH + 6 + a * 4) * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawStack() {
    for (let i = 0; i < G.stack.length; i++) {
      const c = G.stack[i];
      const y = stackY(i);
      drawCoin(CX, y, c.th, G.hx, G.hy, {
        gold: c.gold || c.found,
        mag: c.mag && !c.found,
        squash: c.squash,
        r: R - (c.found ? 2 : 0)
      });
    }
  }

  function drawDropper() {
    if (G.mode === "clear" && !G.drop.falling) return;
    const p = dropperCenter();
    const gold = G.stack.length % 2 === 0;
    const mag = !gold;
    if (!G.drop.falling) drawRingHolder(p.x, DROP_Y);
    drawGhostHole(p.x, p.y);
    drawCoin(p.x, p.y, G.th, G.hx, G.hy, {
      gold: gold,
      mag: mag,
      hot: G.inWin && !G.drop.falling,
      squash: G.drop.squash,
      alpha: G.drop.falling && !G.drop.ok ? 0.92 : 1
    });
    drawHotPulse(p.x, p.y);
  }

  function drawFlies() {
    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      drawCoin(f.x, f.y, f.th, f.hx, f.hy, {
        mag: true,
        alpha: clamp(f.life * 1.4, 0, 1),
        r: R * 0.92
      });
    }
  }

  function drawRings() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = r.t / 0.55;
      ctx.strokeStyle = r.gold ? rgba(GOLD, 1 - u) : rgba(CYN, 1 - u);
      ctx.lineWidth = (2.2 - u) * scale;
      ctx.beginPath();
      ctx.ellipse(
        sx(r.x), sy(r.y),
        (r.r0 + u * 46) * scale,
        (r.r0 * SQUASH + u * 18) * scale,
        0, 0, TAU
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.gold ? rgba(GOLD, a) : q.mag ? rgba(MAG, a) : rgba(CYN, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + Math.round(16 * scale) + "px Segoe UI, PingFang SC, sans-serif";
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t * 1.4, 0, 1);
      ctx.fillStyle = f.col;
      ctx.shadowColor = f.col;
      ctx.shadowBlur = 12 * scale;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawJudge() {
    if (G.judgeT <= 0 || !G.judge) return;
    const a = ease(G.judgeT / 0.62);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = G.judgeCol === GOLD ? rgba(GOLD, 1) : G.judgeCol === MAG ? rgba(MAG, 1) : rgba(CYN, 1);
    ctx.font = "900 " + Math.round(34 * scale) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 18;
    ctx.fillText(G.judge, sx(CX), sy(DROP_Y - 52));
    ctx.restore();
  }

  function drawVignette() {
    const vg = ctx.createRadialGradient(sx(CX), sy(360), 80 * scale, sx(CX), sy(360), 420 * scale);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(3,1,10,0.5)");
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    if (G.goldFlash > 0) {
      ctx.fillStyle = rgba(GOLD, G.goldFlash * 0.12);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.magFlash > 0) {
      ctx.fillStyle = rgba(MAG, G.magFlash * 0.14);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.mode === "play" && G.lives <= 1) {
      ctx.fillStyle = "rgba(255,61,184," + (0.05 + Math.sin(G.clock * 8) * 0.03) + ")";
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, W, H);
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawBg();
    drawTable();
    const pegTop = G.drop.falling && G.drop.ok
      ? G.drop.y - 6
      : stackY(G.stack.length) - 18;
    drawPeg(Math.min(pegTop, DROP_Y + 8), TABLE_Y + 8, G.inWin);
    drawStack();
    drawDropper();
    drawFlies();
    drawRings();
    drawParticles();
    drawFloats();
    drawJudge();
    drawVignette();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function onKey(e, down) {
    const k = e.key;
    if (down && e.repeat) {
      if (k === " " || k === "Spacebar" || k === "Enter" || k === "j" || k === "J" || k === "f" || k === "F") {
        e.preventDefault();
      }
      return;
    }
    if (k === " " || k === "Spacebar" || k === "j" || k === "J" || k === "f" || k === "F") {
      if (down) {
        e.preventDefault();
        audio.ensure();
        btnDrop.classList.add("held");
        if (!overlay.classList.contains("hidden")) overlayAction();
        else G.wantDrop = true;
      } else {
        btnDrop.classList.remove("held");
      }
    }
    if (!down) return;
    if (k === "m" || k === "M") {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === "r" || k === "R") {
      audio.ensure();
      startRun();
    }
    if (k === "Enter") {
      e.preventDefault();
      audio.ensure();
      if (!overlay.classList.contains("hidden")) overlayAction();
      else G.wantDrop = true;
    }
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    canvas.classList.add("press");
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (!overlay.classList.contains("hidden")) return;
    G.wantDrop = true;
    e.preventDefault();
  });
  canvas.addEventListener("pointerup", function () {
    canvas.classList.remove("press");
  });
  canvas.addEventListener("pointercancel", function () {
    canvas.classList.remove("press");
  });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  btnDrop.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    audio.ensure();
    btnDrop.classList.add("held");
    if (!overlay.classList.contains("hidden")) overlayAction();
    else G.wantDrop = true;
    try { btnDrop.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  function dropUp() { btnDrop.classList.remove("held"); }
  btnDrop.addEventListener("pointerup", dropUp);
  btnDrop.addEventListener("pointercancel", dropUp);
  btnDrop.addEventListener("pointerleave", dropUp);

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    overlayAction();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener("keydown", function (e) { onKey(e, true); });
  window.addEventListener("keyup", function (e) { onKey(e, false); });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  seedMotes();
  resize();
  bootTitle();
  syncHud();

  let last = performance.now();
  let acc = 0;
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
    if (acc > STEP * 5) acc = 0;
    const playing = G.mode === "play" || G.mode === "clear" || G.mode === "title";
    audio.tickDrone(G.heat, playing && !audio.muted);
    if ((steps & 1) === 0) syncHud();
    draw();
  }
  requestAnimationFrame(frame);
})();
