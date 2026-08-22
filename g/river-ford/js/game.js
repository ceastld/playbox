"use strict";

(function () {
  const VW = 480;
  const VH = 800;
  const NEAR_Y = 748;
  const FAR_Y = 66;
  const FAR_EDGE = 96;
  const NEAR_EDGE = 704;
  const PR = 10;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const HOP_DUR = 0.3;
  const SINK_DUR = 0.56;
  const ARC = 48;
  const MUTE_KEY = "playbox-river-ford-mute";
  const GOLD = "#ffe36b";
  const CYAN = "#00f0ff";
  const MAG = "#ff3db8";

  const OPS_KB = "WASD / 方向键起跳 · 点选落石 · M 静音";
  const OPS_TOUCH = "点选落石起跳 · 点「重开」再来 · M 静音";

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
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function ease(t) {
    return t * t * (3 - 2 * t);
  }

  const STAGES = [
    {
      name: "浅滩",
      sub: "SHOAL",
      hint: "跳上石头过河 · 离开后石会沉",
      toast: "走了就沉，不能回头",
      jump: 200,
      stones: [
        { x: 240, y: 620 },
        { x: 240, y: 490 },
        { x: 240, y: 360 },
        { x: 240, y: 230 }
      ]
    },
    {
      name: "岔口",
      sub: "FORK",
      hint: "错石是死路 · 往上的那侧才通",
      toast: "左边是沉途，靠右涉",
      jump: 190,
      stones: [
        { x: 240, y: 640 },
        { x: 118, y: 518 },
        { x: 362, y: 498 },
        { x: 350, y: 348 },
        { x: 236, y: 198 }
      ]
    },
    {
      name: "绕行",
      sub: "BEND",
      hint: "中间过不去，从左侧绕",
      toast: "右侧是孤石",
      jump: 186,
      stones: [
        { x: 240, y: 650 },
        { x: 240, y: 522 },
        { x: 124, y: 388 },
        { x: 128, y: 268 },
        { x: 248, y: 148 },
        { x: 372, y: 392 }
      ]
    },
    {
      name: "缺心",
      sub: "GAP",
      hint: "中线断了，借左侧踏过去",
      toast: "别跳到右边那颗",
      jump: 178,
      stones: [
        { x: 240, y: 652 },
        { x: 240, y: 522 },
        { x: 112, y: 404 },
        { x: 112, y: 272 },
        { x: 248, y: 158 },
        { x: 378, y: 518 }
      ]
    },
    {
      name: "折线",
      sub: "SNAKE",
      hint: "只有左岸那颗能靠岸",
      toast: "右半岛走不通",
      jump: 176,
      stones: [
        { x: 240, y: 658 },
        { x: 240, y: 536 },
        { x: 112, y: 422 },
        { x: 104, y: 300 },
        { x: 128, y: 176 },
        { x: 368, y: 430 },
        { x: 380, y: 300 }
      ]
    },
    {
      name: "漂石",
      sub: "DRIFT",
      hint: "石在走，等两颗靠近再跳",
      toast: "对漂时落脚",
      jump: 170,
      stones: [
        { x: 240, y: 650 },
        { x: 240, y: 508 },
        { x: 240, y: 366, move: { amp: 108, period: 3.0, ph: 0 } },
        { x: 240, y: 224, move: { amp: 108, period: 3.0, ph: Math.PI * 0.5 } }
      ]
    },
    {
      name: "连环",
      sub: "CHAIN",
      hint: "沿折线走，两侧的刺是死路",
      toast: "别去边角孤石",
      jump: 172,
      stones: [
        { x: 240, y: 668 },
        { x: 132, y: 548 },
        { x: 128, y: 418 },
        { x: 292, y: 414 },
        { x: 318, y: 278 },
        { x: 196, y: 170 },
        { x: 36, y: 590 },
        { x: 430, y: 278 }
      ]
    },
    {
      name: "潮石",
      sub: "TIDE",
      hint: "乘左潮跳上，趁还靠左就离开",
      toast: "漂到右侧会没路",
      jump: 168,
      stones: [
        { x: 240, y: 658 },
        { x: 176, y: 528, move: { amp: 32, period: 3.2, ph: 0 } },
        { x: 328, y: 380, move: { amp: 88, period: 3.2, ph: Math.PI } },
        { x: 210, y: 236 },
        { x: 424, y: 300 }
      ]
    },
    {
      name: "乱矶",
      sub: "SCATTER",
      hint: "第一跳决定生死，靠左那串",
      toast: "右侧是沉岛",
      jump: 160,
      stones: [
        { x: 240, y: 668 },
        { x: 158, y: 546 },
        { x: 78, y: 424 },
        { x: 86, y: 298 },
        { x: 196, y: 186 },
        { x: 342, y: 550 },
        { x: 412, y: 416 }
      ]
    },
    {
      name: "深涉",
      sub: "ABYSS",
      hint: "跳上渡石，等它漂到右侧再下",
      toast: "渡石是桥，别等过站",
      jump: 156,
      stones: [
        { x: 240, y: 672 },
        { x: 136, y: 562 },
        { x: 132, y: 442 },
        { x: 236, y: 318, move: { amp: 102, period: 3.0, ph: 0 } },
        { x: 348, y: 214 },
        { x: 352, y: 568 },
        { x: 40, y: 452 }
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
  const ripples = [];

  const G = {
    mode: "title",
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    jump: 200,
    lock: 0,
    landLock: 0,
    stuck: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    settle: 0,
    demoWait: 0.55,
    hover: null
  };

  const player = {
    x: 240,
    y: NEAR_Y,
    seat: "near",
    sid: -1,
    hop: 0,
    fromX: 240,
    fromY: NEAR_Y,
    toKind: "",
    toId: -1,
    trail: [],
    sink: 0,
    face: -Math.PI / 2,
    bob: 0
  };

  let stones = [];
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
      const t0 = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t0);
      o.stop(t0 + dur + 0.03);
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
      const t0 = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    },
    hop() {
      this.ensure();
      this.beep(520, 0.09, "sine", 0.045, 820);
    },
    land() {
      this.ensure();
      this.beep(340, 0.08, "triangle", 0.04, 180);
      this.noise(0.06, 0.03, 900);
    },
    stoneDown() {
      this.ensure();
      this.noise(0.16, 0.055, 280);
      this.beep(180, 0.22, "sine", 0.05, 70);
    },
    stuck() {
      this.ensure();
      this.beep(220, 0.1, "triangle", 0.04, 110);
    },
    sink() {
      this.ensure();
      this.noise(0.22, 0.08, 320);
      this.beep(220, 0.32, "sine", 0.06, 60);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.07, "square", 0.025, 90);
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
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.muted = true;
  } catch (err) { /* ignore */ }
  audio.setMuted(audio.muted);

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
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
      stageLabel.textContent = "十渡";
      leftLabel.textContent = "踏石过河";
    } else {
      stageLabel.textContent = "第 " + (G.stage + 1) + " 渡 · " + (st ? st.name : "");
      let foot = st ? st.sub : "FORD";
      if (G.mode === "play") {
        if (player.sink > 0) foot = "没顶";
        else if (player.hop > 0) foot = "起跳";
        else if (player.seat === "far") foot = "抵岸";
        else if (player.seat === "stone") foot = G.stuck > 0.2 ? "无路" : "石上";
        else foot = "岸上";
      }
      leftLabel.textContent = foot;
    }
    const warn = G.mode === "play" && (G.stuck > 0.15 || player.sink > 0);
    stageLabel.classList.toggle("hot", G.mode === "clear" || G.mode === "win");
    leftLabel.classList.toggle("warn", warn);
    syncPips();
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle("hot", kind === "hot");
    hintEl.classList.toggle("warn", kind === "warn");
  }

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

  function buildBankJag() {
    bankJag = [];
    for (let i = 0; i <= 28; i++) {
      bankJag.push((hash(i * 3.17) - 0.5) * 11);
    }
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 48; i++) {
      motes.push({
        x: rand(12, VW - 12),
        y: rand(FAR_EDGE + 8, NEAR_EDGE - 8),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.15),
        p: rand(0, TAU),
        s: rand(8, 22)
      });
    }
  }

  function liveStone(s, t) {
    if (s.state === "gone") return;
    if (s.state === "sinking") {
      return;
    }
    s.x = s.bx;
    s.y = s.by;
    if (s.move) {
      s.x += Math.sin((t * TAU) / s.move.period + s.move.ph) * s.move.amp;
    }
  }

  function applyStage(st) {
    G.jump = st.jump;
    stones = st.stones.map(function (s, i) {
      return {
        id: i,
        bx: s.x,
        by: s.y,
        x: s.x,
        y: s.y,
        r: s.r || (i % 3 === 0 ? 26 : 23),
        move: s.move || null,
        state: "idle",
        sink: 0,
        bob: hash(i * 9.1) * TAU
      };
    });
    splashes.length = 0;
    ripples.length = 0;
    for (let i = 0; i < stones.length; i++) liveStone(stones[i], 0);
  }

  function resetPlayer() {
    player.x = 240;
    player.y = NEAR_Y;
    player.seat = "near";
    player.sid = -1;
    player.hop = 0;
    player.sink = 0;
    player.face = -Math.PI / 2;
    player.bob = 0;
    player.trail.length = 0;
    player.toKind = "";
    player.toId = -1;
  }

  function startStage(i, fromFail) {
    G.mode = "play";
    G.stage = i;
    G.t = 0;
    G.lock = fromFail ? 0.5 : 0.14;
    G.landLock = 0;
    G.stuck = 0;
    G.settle = 0;
    heldLock = !!fromFail;
    applyStage(STAGES[i]);
    resetPlayer();
    hideOverlay();
    setHint(STAGES[i].hint, "");
    toast(fromFail ? "还剩 " + G.lives + " 命" : STAGES[i].toast, !!fromFail, !fromFail);
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

  function canReach(x1, y1, x2, y2) {
    const d = hypot(x2 - x1, y2 - y1);
    return d >= 40 && d <= G.jump + 0.6;
  }

  function seatPos() {
    if (player.hop > 0) return { x: player.x, y: player.y };
    if (player.seat === "stone" && player.sid >= 0) {
      const s = stones[player.sid];
      return { x: s.x, y: s.y - 7 };
    }
    if (player.seat === "far") return { x: player.x, y: FAR_Y };
    return { x: player.x, y: NEAR_Y };
  }

  function gatherTargets() {
    const from = seatPos();
    const list = [];
    for (let i = 0; i < stones.length; i++) {
      const s = stones[i];
      if (s.state !== "idle") continue;
      if (player.seat === "stone" && player.sid === i && player.hop <= 0) continue;
      if (player.hop > 0 && player.toKind === "stone" && player.toId === i) continue;
      if (canReach(from.x, from.y, s.x, s.y - 7)) {
        list.push({ kind: "stone", id: i, x: s.x, y: s.y - 7, d: hypot(s.x - from.x, s.y - 7 - from.y) });
      }
    }
    if (player.seat !== "far" && canReach(from.x, from.y, from.x, FAR_Y)) {
      list.push({ kind: "far", id: -1, x: from.x, y: FAR_Y, d: Math.abs(from.y - FAR_Y) });
    }
    return list;
  }

  function pickByDir(dx, dy) {
    const mag = hypot(dx, dy);
    if (mag < 2) return null;
    dx /= mag;
    dy /= mag;
    const from = seatPos();
    const list = gatherTargets();
    let best = null;
    let bestScore = -1e9;
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      const fx = t.x - from.x;
      const fy = t.y - from.y;
      const d = hypot(fx, fy) || 1;
      const dot = (fx / d) * dx + (fy / d) * dy;
      if (dot < 0.26) continue;
      const score = dot * 2.2 - (d / G.jump) * 0.2 - t.y * 0.0004;
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best;
  }

  function pickByPoint(wx, wy) {
    const list = gatherTargets();
    if (wy < FAR_EDGE + 28) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].kind === "far") return list[i];
      }
    }
    let nearest = null;
    let nearestD = 1e9;
    for (let i = 0; i < stones.length; i++) {
      const s = stones[i];
      const d = hypot(wx - s.x, wy - s.y);
      if (d < s.r + 22 && d < nearestD) {
        nearestD = d;
        nearest = s;
      }
    }
    if (nearest) {
      if (nearest.state !== "idle") return { kind: "no", why: "sunk" };
      if (player.seat === "stone" && player.sid === nearest.id) return null;
      for (let i = 0; i < list.length; i++) {
        if (list[i].kind === "stone" && list[i].id === nearest.id) return list[i];
      }
      return { kind: "no", why: "far" };
    }
    let best = null;
    let bestD = 58;
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (t.kind !== "stone") continue;
      const s = stones[t.id];
      const d = hypot(wx - s.x, wy - s.y);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    if (best) return best;
    const from = seatPos();
    return pickByDir(wx - from.x, wy - from.y);
  }

  function beginHop(target) {
    if (!target) return false;
    if (player.hop > 0 || player.sink > 0) return false;
    if (G.lock > 0 && G.mode === "play") return false;
    if (G.mode !== "play" && G.mode !== "title") return false;

    if (player.seat === "stone" && player.sid >= 0) {
      const s = stones[player.sid];
      if (s.state === "idle") {
        s.state = "sinking";
        s.sink = 0;
        splashes.push({ x: s.x, y: s.y, t: 0, mag: true });
        if (splashes.length > 14) splashes.shift();
        ripples.push({ x: s.x, y: s.y, t: 0 });
        emit(12, {
          x: s.x, y: s.y, j: 10,
          vx0: -50, vx1: 50, vy0: -30, vy1: 40,
          life: 0.48, r0: 1.1, r1: 2.6, mag: true, g: 40
        });
        if (G.mode === "play") audio.stoneDown();
      }
    }

    player.fromX = player.x;
    player.fromY = player.y;
    player.toKind = target.kind;
    player.toId = target.id;
    player.hop = 0.0001;
    player.seat = "air";
    player.sid = -1;
    player.face = Math.atan2(target.y - player.fromY, target.x - player.fromX);
    G.stuck = 0;
    G.landLock = 0;
    if (G.mode === "play") audio.hop();
    emit(6, {
      x: player.fromX, y: player.fromY, j: 5,
      vx0: -30, vx1: 30, vy0: -70, vy1: -10,
      life: 0.32, r0: 1, r1: 2.1, gold: true, g: 90
    });
    return true;
  }

  function land() {
    player.hop = 0;
    if (player.toKind === "far") {
      player.seat = "far";
      player.x = player.fromX;
      player.y = FAR_Y;
      player.sid = -1;
      if (G.mode === "play") clearStage();
      else if (G.mode === "title") G.demoWait = 1.15;
      return;
    }
    const s = stones[player.toId];
    if (!s || s.state !== "idle") {
      die("miss");
      return;
    }
    player.seat = "stone";
    player.sid = s.id;
    player.x = s.x;
    player.y = s.y - 7;
    G.landLock = 0.1;
    if (G.mode === "play") audio.land();
    emit(8, {
      x: player.x, y: s.y + 4, j: 7,
      vx0: -40, vx1: 40, vy0: -20, vy1: 16,
      life: 0.3, r0: 0.8, r1: 1.8, g: 30
    });
    splashes.push({ x: s.x, y: s.y, t: 0, mag: false });
    if (splashes.length > 14) splashes.shift();
  }

  function die(why) {
    if (player.sink > 0) return;
    if (G.mode !== "play" && G.mode !== "title") return;
    player.sink = 0.76;
    player.hop = 0;
    G.lock = 0.76;
    G.shake = 12;
    G.magFlash = 0.5;
    if (player.seat === "stone" && player.sid >= 0) {
      const s = stones[player.sid];
      if (s && s.state === "idle") {
        s.state = "sinking";
        s.sink = 0;
      }
    }
    player.seat = "air";
    audio.sink();
    emit(20, {
      x: player.x, y: player.y, j: 10,
      vx0: -100, vx1: 100, vy0: -60, vy1: 40,
      life: 0.52, r0: 1.2, r1: 3, mag: true, g: 160
    });
    if (G.mode === "play") {
      toast(why === "stuck" ? "石已沉 · 无路" : "没顶", true);
      setHint("回头的路已经沉了", "warn");
    }
  }

  function afterDeath() {
    G.lives -= 1;
    if (G.lives <= 0) {
      G.mode = "lose";
      G.lives = 0;
      showOverlay(
        "lose",
        "没顶",
        "三命都沉进河里了。<br />石头离开就沉，走错一步便无回头路。",
        "再来一局",
        "SUNK",
        coarse ? OPS_TOUCH : OPS_KB
      );
      setHint("点再来，或按 R", "warn");
      syncHud();
      return;
    }
    startStage(G.stage, true);
  }

  function clearStage() {
    if (G.mode !== "play") return;
    G.mode = "clear";
    G.settle = 0.82;
    G.goldFlash = 0.7;
    G.flash = 0.32;
    audio.clear();
    emit(28, {
      x: player.x, y: player.y, j: 16,
      vx0: -70, vx1: 70, vy0: -130, vy1: -16,
      life: 0.72, r0: 1.4, r1: 3.2, gold: true, g: 40
    });
    toast(STAGES[G.stage].name + " · 抵岸", false, true);
    setHint("抵岸了", "hot");
  }

  function winRun() {
    G.mode = "win";
    G.goldFlash = 1;
    audio.win();
    showOverlay(
      "win",
      "抵岸",
      "十渡石头都沉在身后。<br />河还在流，人已在对岸。",
      "再走一回",
      "CROSS",
      coarse ? OPS_TOUCH : OPS_KB
    );
    setHint("十渡已涉", "hot");
    syncHud();
  }

  function inputDir() {
    let ix = 0;
    let iy = 0;
    if (keys.l) ix -= 1;
    if (keys.r) ix += 1;
    if (keys.u) iy -= 1;
    if (keys.d) iy += 1;
    return { x: ix, y: iy };
  }

  function tryKeyHop() {
    if (heldLock) {
      const wait = inputDir();
      if (wait.x || wait.y) return;
      heldLock = false;
    }
    const d = inputDir();
    if (!d.x && !d.y) return;
    const t = pickByDir(d.x, d.y);
    if (t) beginHop(t);
  }

  function tryPointerHop() {
    const t = pickByPoint(pointer.x, pointer.y);
    if (t && (t.kind === "stone" || t.kind === "far")) {
      beginHop(t);
      return;
    }
    if (G.mode !== "play") return;
    if (t && t.kind === "no") {
      audio.miss();
      toast(t.why === "sunk" ? "已沉" : "太远", true);
      return;
    }
    const list = gatherTargets();
    if (!list.length) return;
    audio.miss();
    toast("够不着", true);
  }

  function updateStones(dt) {
    for (let i = 0; i < stones.length; i++) {
      const s = stones[i];
      if (s.state === "gone") continue;
      if (s.state === "idle") liveStone(s, G.t);
      if (s.state === "sinking") {
        s.sink += dt / SINK_DUR;
        if (s.sink >= 1) s.state = "gone";
      }
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      splashes[i].t += dt;
      if (splashes[i].t > 0.6) splashes.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].t += dt;
      if (ripples[i].t > 0.9) ripples.splice(i, 1);
    }
  }

  function updateHop(dt) {
    if (player.hop <= 0) return;
    player.hop += dt;
    const t = clamp(player.hop / HOP_DUR, 0, 1);
    const e = ease(t);
    let tx = player.fromX;
    let ty = FAR_Y;
    if (player.toKind === "stone") {
      const s = stones[player.toId];
      if (s && s.state === "idle") {
        tx = s.x;
        ty = s.y - 7;
      } else {
        tx = player.fromX;
        ty = player.fromY + 20;
      }
    }
    player.x = lerp(player.fromX, tx, e);
    player.y = lerp(player.fromY, ty, e) - Math.sin(t * Math.PI) * ARC;
    if (t >= 1) land();
  }

  function followSeat() {
    if (player.hop > 0 || player.sink > 0) return;
    if (player.seat === "stone" && player.sid >= 0) {
      const s = stones[player.sid];
      if (s && s.state === "idle") {
        player.x = s.x;
        player.y = s.y - 7;
      }
    } else if (player.seat === "near") {
      player.y = NEAR_Y;
    } else if (player.seat === "far") {
      player.y = FAR_Y;
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 1.8);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.3);
    G.lock = Math.max(0, G.lock - dt);
    G.landLock = Math.max(0, G.landLock - dt);
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
    if (player.trail.length > 11) player.trail.shift();
    for (let i = 0; i < player.trail.length; i++) player.trail[i].a *= 0.82;

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.x += m.s * dt * 0.35;
      if (m.x > VW + 8) m.x = -8;
    }
  }

  function demoHop() {
    if (player.hop > 0 || player.sink > 0) return;
    const list = gatherTargets();
    if (!list.length) {
      die("stuck");
      return;
    }
    let best = list[0];
    for (let i = 1; i < list.length; i++) {
      if (list[i].kind === "far") {
        best = list[i];
        break;
      }
      if (list[i].y < best.y) best = list[i];
    }
    beginHop(best);
  }

  function updateTitle(dt) {
    if (!stones.length) applyStage(STAGES[0]);
    updateStones(dt);
    followSeat();
    updateHop(dt);
    if (player.sink > 0) {
      player.sink -= dt;
      player.y += dt * 26;
      if (player.sink <= 0) {
        applyStage(STAGES[0]);
        resetPlayer();
        G.t = 0;
        G.demoWait = 0.4;
      }
      return;
    }
    if (player.seat === "far") {
      G.demoWait -= dt;
      if (G.demoWait <= 0) {
        applyStage(STAGES[0]);
        resetPlayer();
        G.t = 0;
        G.demoWait = 0.45;
      }
      return;
    }
    G.demoWait -= dt;
    if (G.demoWait <= 0 && player.hop <= 0) {
      demoHop();
      G.demoWait = 0.46;
    }
  }

  function updatePlay(dt) {
    updateStones(dt);
    if (player.sink > 0) {
      player.sink -= dt;
      player.y += dt * 28;
      if (player.sink <= 0) afterDeath();
      return;
    }
    followSeat();
    updateHop(dt);
    if (player.hop > 0) return;
    if (G.mode !== "play") return;
    if (player.seat === "far") return;

    if (G.lock <= 0 && G.landLock <= 0) tryKeyHop();

    const list = gatherTargets();
    if (player.seat === "stone" && list.length === 0 && player.hop <= 0) {
      if (G.stuck === 0 && G.mode === "play") audio.stuck();
      G.stuck += dt;
      if (G.stuck > 0.7) die("stuck");
    } else {
      G.stuck = 0;
    }
  }

  function update(dt) {
    G.clock += dt;
    G.hover = null;
    if (G.mode === "play" || G.mode === "title") {
      if (player.hop <= 0 && player.sink <= 0) {
        const h = pickByPoint(pointer.x, pointer.y);
        G.hover = h && (h.kind === "stone" || h.kind === "far") ? h : null;
      }
    }
    if (G.mode === "title") {
      G.t += dt;
      updateTitle(dt);
    } else if (G.mode === "play") {
      G.t += dt;
      updatePlay(dt);
    } else if (G.mode === "clear") {
      G.settle -= dt;
      updateStones(dt);
      followSeat();
      if (G.settle <= 0) {
        if (G.stage + 1 >= STAGES.length) winRun();
        else startStage(G.stage + 1, false);
      }
    } else {
      updateStones(dt);
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

  function rockPath(s, extra) {
    const n = 8;
    const k = extra || 0;
    const sinkK = s.state === "sinking" ? s.sink : 0;
    const rr = s.r * (1 - sinkK * 0.55) + k;
    const y = s.y + sinkK * 16;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const ang = (i / n) * TAU + hash(s.id * 3.7) * 0.5;
      const rad = rr * (0.84 + hash(s.id * 11 + i) * 0.22);
      const px = s.x + Math.cos(ang) * rad;
      const py = y + Math.sin(ang) * rad * 0.62;
      if (i === 0) ctx.moveTo(sx(px), sy(py));
      else ctx.lineTo(sx(px), sy(py));
    }
    ctx.closePath();
  }

  function drawWater() {
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, W, H);

    const grd = ctx.createLinearGradient(sx(0), sy(FAR_EDGE), sx(0), sy(NEAR_EDGE));
    grd.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    grd.addColorStop(0.45, "rgba(8, 12, 36, 0.0)");
    grd.addColorStop(1, "rgba(255, 61, 184, 0.07)");
    ctx.fillStyle = grd;
    ctx.fillRect(sx(-40), sy(FAR_EDGE - 8), (VW + 80) * scale, (NEAR_EDGE - FAR_EDGE + 16) * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(-40), sy(FAR_EDGE), (VW + 80) * scale, (NEAR_EDGE - FAR_EDGE) * scale);
    ctx.clip();
    const t = G.clock;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const base = FAR_EDGE + 26 + i * 68;
      ctx.moveTo(sx(-20), sy(base));
      for (let x = 0; x <= VW; x += 14) {
        const y = base
          + Math.sin(x * 0.03 + t * (0.65 + i * 0.1) + i) * 5.2
          + Math.sin(x * 0.011 - t * 0.35 + i * 1.7) * 3.1;
        ctx.lineTo(sx(x), sy(y));
      }
      ctx.strokeStyle = i % 2 === 0 ? "rgba(0, 240, 255, 0.07)" : "rgba(255, 61, 184, 0.055)";
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = m.x + Math.sin(t * 0.4 + m.p) * 5;
      const my = m.y + Math.cos(t * 0.22 + m.p) * 3.5;
      ctx.beginPath();
      ctx.arc(sx(mx), sy(my), m.r * scale, 0, TAU);
      ctx.fillStyle = "rgba(180, 230, 255," + m.a + ")";
      ctx.fill();
    }
  }

  function drawLantern(x, y) {
    const flick = 0.72 + Math.sin(G.clock * 7 + x) * 0.18;
    ctx.fillStyle = "rgba(200, 220, 255, 0.35)";
    ctx.fillRect(sx(x - 1.4), sy(y), 2.8 * scale, 26 * scale);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 6.4 * scale, 0, TAU);
    ctx.fillStyle = "rgba(0, 240, 255," + (0.55 * flick) + ")";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 3.1 * scale, 0, TAU);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fill();
  }

  function drawBanks() {
    ctx.fillStyle = "#0a0714";
    ctx.beginPath();
    ctx.rect(sx(-80), sy(-40), (VW + 160) * scale, (FAR_EDGE + 50) * scale);
    bankLine(FAR_EDGE, 1);
    ctx.lineTo(sx(VW + 80), sy(-40));
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    bankLine(NEAR_EDGE, -1);
    ctx.lineTo(sx(VW + 80), sy(VH + 40));
    ctx.lineTo(sx(-80), sy(VH + 40));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
    ctx.lineWidth = 2.2 * scale;
    ctx.shadowColor = "rgba(0, 240, 255, 0.4)";
    ctx.shadowBlur = 10 * scale;
    bankLine(FAR_EDGE, 1);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255, 61, 184, 0.55)";
    ctx.shadowColor = "rgba(255, 61, 184, 0.4)";
    ctx.shadowBlur = 10 * scale;
    bankLine(NEAR_EDGE, -1);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
    ctx.fillRect(sx(-80), sy(FAR_EDGE - 18), (VW + 160) * scale, 18 * scale);
    ctx.fillStyle = "rgba(255, 61, 184, 0.08)";
    ctx.fillRect(sx(-80), sy(NEAR_EDGE), (VW + 160) * scale, 18 * scale);

    for (let i = 0; i < 18; i++) {
      const x = 16 + i * 26 + hash(i + 2) * 8;
      const h = 6 + hash(i * 4) * 9;
      ctx.strokeStyle = "rgba(255, 61, 184, 0.3)";
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(NEAR_EDGE + 8));
      ctx.quadraticCurveTo(sx(x + 3), sy(NEAR_EDGE + 8 + h * 0.5), sx(x - 2), sy(NEAR_EDGE + 8 + h));
      ctx.stroke();
    }

    drawLantern(142, 50);
    drawLantern(338, 50);

    const farOk = G.hover && G.hover.kind === "far";
    const pulse = 0.45 + Math.sin(G.clock * 3.2) * 0.12 + (farOk ? 0.2 : 0);
    ctx.beginPath();
    ctx.arc(sx(240), sy(52), 17 * scale, 0, TAU);
    ctx.strokeStyle = "rgba(255, 227, 107," + pulse + ")";
    ctx.lineWidth = 2.1 * scale;
    ctx.shadowColor = "rgba(255, 227, 107, 0.45)";
    ctx.shadowBlur = farOk ? 16 * scale : 8 * scale;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(sx(240), sy(52), 5.2 * scale, 0, TAU);
    ctx.fillStyle = GOLD;
    ctx.fill();
  }

  function drawRipples() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const k = r.t / 0.9;
      ctx.beginPath();
      ctx.ellipse(sx(r.x), sy(r.y + 4), (10 + k * 38) * scale, (5 + k * 14) * scale, 0, 0, TAU);
      ctx.strokeStyle = "rgba(255, 61, 184," + (1 - k) * 0.45 + ")";
      ctx.lineWidth = (2.4 - k * 1.6) * scale;
      ctx.stroke();
    }
    for (let i = 0; i < splashes.length; i++) {
      const s = splashes[i];
      const k = s.t / 0.6;
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y + 2), (8 + k * 22) * scale, (4 + k * 10) * scale, 0, 0, TAU);
      ctx.strokeStyle = s.mag
        ? "rgba(255, 61, 184," + (1 - k) * 0.5 + ")"
        : "rgba(0, 240, 255," + (1 - k) * 0.45 + ")";
      ctx.lineWidth = (2.2 - k * 1.4) * scale;
      ctx.stroke();
    }
  }

  function drawStones() {
    const hoverId = G.hover && G.hover.kind === "stone" ? G.hover.id : -1;
    const reachable = {};
    if ((G.mode === "play" || G.mode === "title") && player.hop <= 0 && player.sink <= 0) {
      const list = gatherTargets();
      for (let i = 0; i < list.length; i++) {
        if (list[i].kind === "stone") reachable[list[i].id] = true;
      }
    }

    for (let i = 0; i < stones.length; i++) {
      const s = stones[i];
      if (s.state === "gone") continue;
      const sinkK = s.state === "sinking" ? s.sink : 0;
      const bob = Math.sin(G.clock * 1.6 + s.bob) * 1.1;
      const occ = player.seat === "stone" && player.sid === i && player.hop <= 0;
      const can = !!reachable[i];
      const alpha = 1 - sinkK;

      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y + 8 + bob + sinkK * 10), (s.r * 0.95) * scale, (s.r * 0.38) * scale, 0, 0, TAU);
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.fill();

      if (can && sinkK === 0) {
        const pulse = 0.28 + Math.sin(G.clock * 5 + i) * 0.1;
        ctx.beginPath();
        ctx.ellipse(sx(s.x), sy(s.y + bob), (s.r + 7) * scale, (s.r * 0.62 + 5) * scale, 0, 0, TAU);
        ctx.strokeStyle = hoverId === i
          ? "rgba(255, 227, 107," + (0.55 + pulse) + ")"
          : "rgba(0, 240, 255," + (0.28 + pulse) + ")";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
      }

      rockPath({ id: s.id, x: s.x, y: s.y + bob, r: s.r, state: s.state, sink: s.sink }, 3);
      ctx.fillStyle = sinkK > 0 ? "rgba(48, 10, 28, 0.5)" : "rgba(8, 18, 32, 0.55)";
      ctx.fill();

      rockPath({ id: s.id, x: s.x, y: s.y + bob, r: s.r, state: s.state, sink: s.sink }, 0);
      ctx.fillStyle = sinkK > 0 ? "#2a1020" : "#121826";
      ctx.fill();
      ctx.strokeStyle = sinkK > 0
        ? "rgba(255, 61, 184," + (0.7 * alpha) + ")"
        : occ
          ? GOLD
          : can
            ? CYAN
            : "rgba(0, 240, 255, 0.42)";
      ctx.lineWidth = (occ ? 2.4 : 1.7) * scale;
      if (occ) {
        ctx.shadowColor = "rgba(255, 227, 107, 0.55)";
        ctx.shadowBlur = 12 * scale;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.ellipse(
        sx(s.x - s.r * 0.22),
        sy(s.y + bob - s.r * 0.12),
        s.r * 0.28 * scale,
        s.r * 0.14 * scale,
        -0.4,
        0,
        TAU
      );
      ctx.fillStyle = "rgba(255, 255, 255," + (0.09 * alpha) + ")";
      ctx.fill();

      ctx.restore();
    }
  }

  function drawPreview() {
    if (player.hop > 0 || player.sink > 0) return;
    if (!(G.mode === "play" || G.mode === "title")) return;
    const from = seatPos();
    if (G.mode === "play") {
      ctx.beginPath();
      ctx.arc(sx(from.x), sy(from.y), G.jump * scale, 0, TAU);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.07)";
      ctx.setLineDash([6 * scale, 8 * scale]);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (G.hover) {
      ctx.beginPath();
      ctx.moveTo(sx(from.x), sy(from.y));
      ctx.lineTo(sx(G.hover.x), sy(G.hover.y));
      ctx.strokeStyle = G.hover.kind === "far"
        ? "rgba(255, 227, 107, 0.45)"
        : "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 1.4 * scale;
      ctx.setLineDash([5 * scale, 5 * scale]);
      ctx.stroke();
      ctx.setLineDash([]);
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
      ctx.arc(sx(tr.x), sy(tr.y), (2.6 + i * 0.22) * scale, 0, TAU);
      ctx.fillStyle = "rgba(255, 227, 107," + (tr.a * 0.28) + ")";
      ctx.fill();
    }

    const sinkK = player.sink > 0 ? 1 - player.sink / 0.76 : 0;
    const hopK = player.hop > 0 ? Math.sin(clamp(player.hop / HOP_DUR, 0, 1) * Math.PI) : 0;
    const bob = player.hop > 0 ? 0 : Math.sin(player.bob * 5.5) * 1.15;
    const px = player.x;
    const py = player.y + bob + sinkK * 12;
    const pr = PR * (1 - sinkK * 0.5) * (1 + hopK * 0.08);
    const stuckFlash = G.stuck > 0.25 && ((G.clock * 14) % 1 > 0.45);

    ctx.beginPath();
    ctx.ellipse(sx(px), sy(py + 9), 8.5 * scale, 3.6 * scale, 0, 0, TAU);
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx(px), sy(py), (pr + 5) * scale, 0, TAU);
    ctx.strokeStyle = stuckFlash
      ? "rgba(255, 61, 184, 0.55)"
      : "rgba(255, 227, 107," + (0.28 + hopK * 0.35) + ")";
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sx(px), sy(py), pr * scale, 0, TAU);
    ctx.fillStyle = stuckFlash ? MAG : GOLD;
    ctx.fill();
    ctx.strokeStyle = stuckFlash ? "rgba(255, 61, 184, 0.9)" : CYAN;
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    const ex = Math.cos(player.face) * 3.3;
    const ey = Math.sin(player.face) * 3.3;
    ctx.beginPath();
    ctx.arc(sx(px + ex - 1.55), sy(py + ey - 1.15), 1.12 * scale, 0, TAU);
    ctx.arc(sx(px + ex + 1.55), sy(py + ey - 1.15), 1.12 * scale, 0, TAU);
    ctx.fillStyle = "#1a1028";
    ctx.fill();

    const lx = px + Math.cos(player.face - 0.9) * 7;
    const ly = py + Math.sin(player.face - 0.9) * 7 - 6;
    ctx.beginPath();
    ctx.moveTo(sx(px), sy(py - 2));
    ctx.lineTo(sx(lx), sy(ly));
    ctx.strokeStyle = "rgba(220, 230, 255, 0.45)";
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(lx), sy(ly), 2.3 * scale, 0, TAU);
    ctx.fillStyle = "rgba(0, 240, 255, 0.7)";
    ctx.fill();
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
    drawRipples();
    drawStones();
    drawPreview();
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
    if (overlay.contains(e.target) || (e.target.closest && e.target.closest("button"))) return;
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
    const wasDown = pointer.down;
    pointer.down = false;
    pointer.id = null;
    if (!wasDown) return;
    if (heldLock) {
      heldLock = false;
      return;
    }
    if (G.mode === "play" && player.hop <= 0 && player.sink <= 0) tryPointerHop();
  }

  function toggleMute() {
    audio.ensure();
    audio.setMuted(!audio.muted);
  }

  function retry() {
    audio.ensure();
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
    hintEl.textContent = "点选落石起跳 · 离开后石会沉";
    ovOps.textContent = OPS_TOUCH;
  }

  buildBankJag();
  seedMotes();
  applyStage(STAGES[0]);
  resetPlayer();
  showOverlay(
    "title",
    "涉水",
    "石头你离开后会沉。踏石过河，走到对岸金门。<br />走错一步，回头的路就没了。",
    "涉河",
    "FORD",
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
