(() => {
  "use strict";

  const NUDGES = 3;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const WALK_T = 0.12;
  const PUSH_T = 0.18;
  const FALL_T = 0.42;
  const CLEAR_T = 0.78;
  const DIE_T = 0.62;
  const LOCK = 0.18;
  const MUTE_KEY = "playbox-crate-nudge-mute";
  const DIRS = [
    { k: "left", x: -1, y: 0 },
    { k: "right", x: 1, y: 0 },
    { k: "up", x: 0, y: -1 },
    { k: "down", x: 0, y: 1 }
  ];

  const STAGES = [
    {
      name: "轻触",
      sub: "TAP",
      hint: "走进箱子就是一推。走动不耗步。",
      map: [
        "#######",
        "#.....#",
        "#..G..#",
        "#..C..#",
        "#..P..#",
        "#.....#",
        "#######"
      ]
    },
    {
      name: "绕后",
      sub: "AROUND",
      hint: "推的方向不对，就绕到另一侧。",
      map: [
        "#######",
        "#.....#",
        "#..C..#",
        "#..P..#",
        "#..G..#",
        "#.....#",
        "#######"
      ]
    },
    {
      name: "折角",
      sub: "CORNER",
      hint: "箱子要拐弯。先横后纵。",
      map: [
        "#######",
        "#.....#",
        "#.C...#",
        "#.#G..#",
        "#.P...#",
        "#.....#",
        "#######"
      ]
    },
    {
      name: "深渊",
      sub: "PIT",
      hint: "虚空会吞箱。看准再推。",
      map: [
        "#######",
        "#...G.#",
        "#..C~.#",
        "#.....#",
        "#..P..#",
        "#.....#",
        "#######"
      ]
    },
    {
      name: "窄廊",
      sub: "HALL",
      hint: "三推用尽。先走到推点再推。",
      map: [
        "#######",
        "#..~.G#",
        "#..C..#",
        "#.###.#",
        "#..P..#",
        "#.....#",
        "#######"
      ]
    },
    {
      name: "落印",
      sub: "SEAL",
      hint: "朝印记直推会掉下去。",
      map: [
        "#######",
        "#....G#",
        "#..C~.#",
        "#.#...#",
        "#P....#",
        "#.....#",
        "#######"
      ]
    }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }

  function parseStage(s) {
    const map = s.map;
    const h = map.length;
    const w = map[0].length;
    const grid = [];
    let px = 0;
    let py = 0;
    let cx = 0;
    let cy = 0;
    let gx = 0;
    let gy = 0;
    for (let y = 0; y < h; y++) {
      const row = [];
      const line = map[y];
      if (line.length !== w) throw new Error("ragged " + s.name);
      for (let x = 0; x < w; x++) {
        let c = line[x];
        if (c === "P") {
          px = x;
          py = y;
          c = ".";
        } else if (c === "C") {
          cx = x;
          cy = y;
          c = ".";
        } else if (c === "G") {
          gx = x;
          gy = y;
          c = ".";
        }
        if (c !== "." && c !== "#" && c !== "~") throw new Error("bad tile " + s.name);
        row.push(c);
      }
      grid.push(row);
    }
    return { grid: grid, w: w, h: h, px: px, py: py, cx: cx, cy: cy, gx: gx, gy: gy };
  }

  function at(grid, x, y) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return "#";
    return grid[y][x];
  }

  function crateDist(grid, cx, cy, gx, gy) {
    if (cx === gx && cy === gy) return 0;
    const h = grid.length;
    const w = grid[0].length;
    const seen = new Uint8Array(w * h);
    const q = [cx, cy, 0];
    seen[cy * w + cx] = 1;
    for (let i = 0; i < q.length; ) {
      const x = q[i++];
      const y = q[i++];
      const d = q[i++];
      for (let k = 0; k < 4; k++) {
        const nx = x + DIRS[k].x;
        const ny = y + DIRS[k].y;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (grid[ny][nx] !== ".") continue;
        const id = ny * w + nx;
        if (seen[id]) continue;
        if (nx === gx && ny === gy) return d + 1;
        seen[id] = 1;
        q.push(nx, ny, d + 1);
      }
    }
    return 99;
  }

  function solveStage(s) {
    const p = parseStage(s);
    if (crateDist(p.grid, p.cx, p.cy, p.gx, p.gy) > NUDGES) return null;
    const w = p.w;
    const h = p.h;
    const cap = w * h * w * h * (NUDGES + 1);
    const seen = new Uint8Array(cap);
    function idx(px, py, cx, cy, n) {
      return ((((n * h + py) * w + px) * h + cy) * w + cx);
    }
    const q = [p.px, p.py, p.cx, p.cy, 0];
    seen[idx(p.px, p.py, p.cx, p.cy, 0)] = 1;
    let qi = 0;
    let walks = 0;
    while (qi < q.length) {
      const px = q[qi++];
      const py = q[qi++];
      const cx = q[qi++];
      const cy = q[qi++];
      const n = q[qi++];
      if (cx === p.gx && cy === p.gy) return { ok: true, nudges: n, walks: walks };
      for (let k = 0; k < 4; k++) {
        const nx = px + DIRS[k].x;
        const ny = py + DIRS[k].y;
        const tile = at(p.grid, nx, ny);
        if (tile !== ".") continue;
        let ncx = cx;
        let ncy = cy;
        let nn = n;
        if (nx === cx && ny === cy) {
          if (n >= NUDGES) continue;
          ncx = cx + DIRS[k].x;
          ncy = cy + DIRS[k].y;
          if (at(p.grid, ncx, ncy) !== ".") continue;
          nn = n + 1;
        } else {
          walks += 1;
        }
        const id = idx(nx, ny, ncx, ncy, nn);
        if (seen[id]) continue;
        seen[id] = 1;
        q.push(nx, ny, ncx, ncy, nn);
      }
    }
    return null;
  }

  if (typeof document === "undefined") {
    STAGES.forEach(function (s, i) {
      const r = solveStage(s);
      if (!r) throw new Error("unsolvable " + i + " " + s.name);
      if (r.nudges < 1 || r.nudges > NUDGES) throw new Error("nudge count " + s.name);
      console.log("OK", s.name, "nudges=" + r.nudges);
    });
    console.log("crate-nudge maps ok", STAGES.length);
    return;
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
  const stageLabel = document.getElementById("stage-label");
  const nudgePips = document.getElementById("nudge-pips");
  const lifePips = document.getElementById("life-pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnUndo = document.getElementById("btn-undo");
  const btnRetry = document.getElementById("btn-retry");
  const padEl = document.getElementById("pad");
  const padBtns = {
    left: document.getElementById("btn-left"),
    right: document.getElementById("btn-right"),
    up: document.getElementById("btn-up"),
    down: document.getElementById("btn-down")
  };

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "点邻格或滑动 · 十字键走动 · 走进箱子即推";
    padEl.style.display = "grid";
  }

  const view = { dpr: 1, cssW: 1, cssH: 1, ox: 0, oy: 0, tw: 36, th: 18, zh: 26, scale: 1 };
  const keys = { left: false, right: false, up: false, down: false };
  const pad = { left: false, right: false, up: false, down: false };
  const keyHeld = { left: 0, right: 0, up: 0, down: 0 };
  const padHeld = { left: 0, right: 0, up: 0, down: 0 };
  const pointer = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    moved: false
  };

  const particles = [];
  const motes = [];
  const stars = [];

  let mode = "title";
  let overlayKind = "title";
  let frozen = true;
  let paused = false;
  let acc = 0;
  let lastTs = 0;
  let toastT = 0;
  let flash = 0;
  let flashRgb = "0,240,255";
  let hover = null;
  let clock = 0;

  const G = {
    stage: 0,
    lives: LIVES,
    left: NUDGES,
    px: 0,
    py: 0,
    cx: 0,
    cy: 0,
    gx: 0,
    gy: 0,
    w: 7,
    h: 7,
    grid: [],
    faceX: 0,
    faceY: -1,
    anim: null,
    phase: "play",
    phaseT: 0,
    why: "",
    shake: 0,
    punch: 0,
    lock: 0,
    undo: [],
    queue: null,
    walkPath: [],
    bump: 0,
    crateSquash: 1
  };

  function burst(x, y, rgb, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = spd * (0.2 + Math.random());
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: 0.28 + Math.random() * 0.4,
        rgb: rgb,
        r: 1.1 + Math.random() * 2.2
      });
    }
  }

  function spark(x, y, dx, dy, rgb) {
    for (let i = 0; i < 7; i++) {
      const spread = (Math.random() - 0.5) * 0.9;
      const s = 50 + Math.random() * 90;
      particles.push({
        x: x,
        y: y,
        vx: (dx + -dy * spread) * s,
        vy: (dy + dx * spread) * s,
        t: 0,
        life: 0.16 + Math.random() * 0.2,
        rgb: rgb,
        r: 1 + Math.random() * 1.8
      });
    }
  }

  function seedStars() {
    stars.length = 0;
    motes.length = 0;
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.4 + Math.random() * 1.1,
        a: 0.15 + Math.random() * 0.45,
        p: Math.random() * TAU
      });
    }
    for (let i = 0; i < 18; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        s: 8 + Math.random() * 16,
        v: 4 + Math.random() * 10,
        p: Math.random() * TAU
      });
    }
  }
  seedStars();

  const SFX = {
    ctx: null,
    master: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.7;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    beep: function (freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      g.connect(this.master);
      src.start();
    },
    step: function () {
      this.ensure();
      this.beep(620, 0.05, "square", 0.028, 280);
    },
    nudge: function () {
      this.ensure();
      this.beep(180, 0.1, "sine", 0.06, 90);
      this.beep(420, 0.08, "triangle", 0.035, 220);
      this.noise(0.05, 0.05);
    },
    bump: function () {
      this.ensure();
      this.beep(140, 0.08, "square", 0.04, 80);
    },
    seal: function () {
      this.ensure();
      this.beep(523, 0.12, "sine", 0.07, 784);
      this.beep(784, 0.18, "triangle", 0.05, 1046);
    },
    die: function () {
      this.ensure();
      this.noise(0.18, 0.08);
      this.beep(240, 0.42, "sawtooth", 0.06, 60);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, "sine", 0.07, 659, 0);
      this.beep(659, 0.14, "sine", 0.07, 784, 0.09);
      this.beep(784, 0.16, "sine", 0.08, 1046, 0.2);
      this.beep(1046, 0.28, "triangle", 0.08, 1318, 0.34);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.14, "sine", 0.05, 440);
    },
    fall: function () {
      this.ensure();
      this.beep(320, 0.36, "sine", 0.06, 70);
      this.noise(0.2, 0.06);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.7;
    syncMuteBtn();
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.5;
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
  }

  function showOverlay(kind) {
    overlayKind = kind;
    frozen = true;
    G.queue = null;
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "CRATE";
      ovTitle.textContent = "微箱";
      ovLead.innerHTML = "走动免费，走进箱子才算一推。<br />三推以内，把箱子送到青色印记上。";
      ovOps.textContent = "WASD / 方向键 · 点邻格或滑动 · Z 撤销 · M 静音";
      ovBtn.textContent = "入仓";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "SEALED";
      ovTitle.textContent = "印合";
      ovLead.innerHTML = "六枚印记都亮了。箱子压上光纹，仓门开了一缝。";
      ovOps.textContent = "再来一局从第一仓开始 · M 静音";
      ovBtn.textContent = "再来一局";
      hintEl.textContent = "六仓印合 · 再来一局";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "箱毁";
      const why =
        G.why === "pit" ? "箱子掉进虚空。" :
        G.why === "fall" ? "踏进了虚空。" :
        G.why === "bias" ? "剩下的轻推送不到印记。" :
        "三推用尽，印记还空着。";
      ovLead.innerHTML = why + "<br />命数耗尽。印纹熄了。";
      ovOps.textContent = "重开从第一仓开始 · M 静音";
      ovBtn.textContent = "再来一局";
      hintEl.textContent = "印纹熄了 · 再来一局";
    }
  }

  function renderPips() {
    const n = mode === "title" ? NUDGES : G.left;
    const warn = n === 1 && mode === "play";
    let html = "";
    for (let i = 0; i < NUDGES; i++) {
      html += "<span class=\"pip" + (i < n ? " on" : "") + (warn && i < n ? " warn" : "") + "\"></span>";
    }
    nudgePips.innerHTML = html;
    const lives = mode === "title" ? LIVES : G.lives;
    html = "";
    for (let i = 0; i < LIVES; i++) {
      html += "<span class=\"pip" + (i < lives ? " on" : "") + "\"></span>";
    }
    lifePips.innerHTML = html;
  }

  function syncHud() {
    if (mode === "title") {
      stageLabel.textContent = "三步以内";
    } else {
      const s = STAGES[G.stage];
      stageLabel.textContent = G.stage + 1 + " / " + STAGES.length + "　" + s.name;
    }
    renderPips();
  }

  function snapshot() {
    return {
      px: G.px,
      py: G.py,
      cx: G.cx,
      cy: G.cy,
      left: G.left,
      faceX: G.faceX,
      faceY: G.faceY
    };
  }

  function applySnap(s) {
    G.px = s.px;
    G.py = s.py;
    G.cx = s.cx;
    G.cy = s.cy;
    G.left = s.left;
    G.faceX = s.faceX;
    G.faceY = s.faceY;
    G.anim = null;
    G.phase = "play";
    G.phaseT = 0;
    G.why = "";
    G.crateSquash = 1;
    G.walkPath.length = 0;
    G.queue = null;
  }

  function loadRoom(index, lives) {
    const parsed = parseStage(STAGES[index]);
    G.stage = index;
    G.lives = lives;
    G.left = NUDGES;
    G.grid = parsed.grid;
    G.w = parsed.w;
    G.h = parsed.h;
    G.px = parsed.px;
    G.py = parsed.py;
    G.cx = parsed.cx;
    G.cy = parsed.cy;
    G.gx = parsed.gx;
    G.gy = parsed.gy;
    G.faceX = 0;
    G.faceY = -1;
    G.anim = null;
    G.phase = "play";
    G.phaseT = 0;
    G.why = "";
    G.undo = [];
    G.queue = null;
    G.walkPath.length = 0;
    G.lock = LOCK;
    G.bump = 0;
    G.crateSquash = 1;
    G.punch = 0;
    particles.length = 0;
    syncHud();
    hintEl.textContent = coarse
      ? STAGES[index].hint
      : STAGES[index].hint + "　Z 撤销";
    showToast(STAGES[index].hint, false);
  }

  function iso(x, y) {
    return {
      x: view.ox + (x - y) * view.tw,
      y: view.oy + (x + y) * view.th
    };
  }

  function screenToCell(sx, sy) {
    const lx = sx - view.ox;
    const ly = sy - view.oy;
    const col = (lx / view.tw + ly / view.th) * 0.5;
    const row = (ly / view.th - lx / view.tw) * 0.5;
    return { x: Math.round(col), y: Math.round(row) };
  }

  function fit() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2.25, window.devicePixelRatio || 1);
    view.cssW = Math.max(1, rect.width);
    view.cssH = Math.max(1, rect.height);
    view.dpr = dpr;
    const bw = Math.round(view.cssW * dpr);
    const bh = Math.round(view.cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const cols = G.w || 7;
    const rows = G.h || 7;
    const padX = 28;
    const padY = 22;
    const availW = view.cssW - padX * 2;
    const availH = view.cssH - padY * 2 - 18;
    const isoW = (cols + rows - 2);
    const isoH = (cols + rows - 2) * 0.5;
    const tw = Math.min(56, availW / (isoW + 0.4), availH / (isoH + 1.45));
    view.tw = tw;
    view.th = tw * 0.5;
    view.zh = tw * 0.74;
    view.ox = view.cssW * 0.5;
    view.oy = view.cssH * 0.34 - ((cols + rows - 2) * view.th) * 0.18;
    if (coarse) view.oy -= 10;
  }

  function drawDiamond(x, y, tw, th, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(x, y - th);
    ctx.lineTo(x + tw, y);
    ctx.lineTo(x, y + th);
    ctx.lineTo(x - tw, y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw || 1;
      ctx.stroke();
    }
  }

  function drawBox(x, y, tw, th, zh, top, left, right, edge) {
    ctx.beginPath();
    ctx.moveTo(x - tw, y);
    ctx.lineTo(x, y + th);
    ctx.lineTo(x, y + th - zh);
    ctx.lineTo(x - tw, y - zh);
    ctx.closePath();
    ctx.fillStyle = left;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + tw, y);
    ctx.lineTo(x, y + th);
    ctx.lineTo(x, y + th - zh);
    ctx.lineTo(x + tw, y - zh);
    ctx.closePath();
    ctx.fillStyle = right;
    ctx.fill();

    drawDiamond(x, y - zh, tw, th, top, edge, 1.15);
  }

  function drawSeal(p, t, on) {
    const pulse = 0.55 + Math.sin(t * 3.2) * 0.45;
    const r = on ? 1 : pulse;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, view.tw * 0.62 * r, 0, TAU);
    ctx.fillStyle = on
      ? "rgba(255, 227, 107, 0.22)"
      : "rgba(0, 240, 255, " + (0.12 + pulse * 0.1) + ")";
    ctx.fill();
    ctx.strokeStyle = on ? "rgba(255, 227, 107, 0.9)" : "rgba(0, 240, 255, " + (0.45 + pulse * 0.35) + ")";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, view.tw * 0.34, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -view.tw * 0.22);
    ctx.lineTo(0, view.tw * 0.22);
    ctx.moveTo(-view.tw * 0.22, 0);
    ctx.lineTo(view.tw * 0.22, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawCrate(p, t, on, squash) {
    const tw = view.tw * 0.72;
    const th = view.th * 0.72;
    const zh = view.zh * 0.9 * squash;
    const bob = Math.sin(t * 2.4) * 1.1;
    const y = p.y + bob;
    const top = on ? "#ffe9a0" : "#ff5ec8";
    const left = on ? "#c9a24a" : "#9a1a6c";
    const right = on ? "#f0d36a" : "#ff3db8";
    const edge = on ? "rgba(255,227,107,0.9)" : "rgba(0,240,255,0.55)";
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + th * 0.55, tw * 0.72, th * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.shadowColor = on ? "rgba(255,227,107,0.45)" : "rgba(255,61,184,0.45)";
    ctx.shadowBlur = 16;
    drawBox(p.x, y, tw, th, zh, top, left, right, edge);
    ctx.shadowBlur = 0;
    ctx.translate(p.x, y - zh);
    ctx.scale(1, 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, tw * 0.28, 0, TAU);
    ctx.strokeStyle = on ? "rgba(5,3,12,0.55)" : "rgba(0,240,255,0.7)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -tw * 0.16);
    ctx.lineTo(0, tw * 0.16);
    ctx.moveTo(-tw * 0.16, 0);
    ctx.lineTo(tw * 0.16, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer(p, t, fx, fy) {
    const bob = Math.sin(t * 6.4) * 1.4;
    const s = view.tw * 0.22;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, view.th * 0.35, s * 1.4, s * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#7af6ff";
    ctx.shadowColor = "rgba(0,240,255,0.7)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.1, s * 0.85, s * 1.15, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx * s * 0.15, -s * 1.55, s * 0.62, 0, TAU);
    ctx.fillStyle = "#e8ffff";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(5,3,12,0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(fx * s * 0.28, -s * 1.62, 1.15, 0, TAU);
    ctx.arc(fx * s * 0.02, -s * 1.62, 1.15, 0, TAU);
    ctx.fillStyle = "#05030c";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx * s * 1.15, -s * 0.2);
    ctx.lineTo(fx * s * 1.85, fy * s * 0.2);
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawWall(p) {
    drawBox(
      p.x,
      p.y,
      view.tw * 0.96,
      view.th * 0.96,
      view.zh * 1.15,
      "#3a2458",
      "#1c102e",
      "#2a1744",
      "rgba(255,61,184,0.28)"
    );
  }

  function visPos() {
    let px = G.px;
    let py = G.py;
    let cx = G.cx;
    let cy = G.cy;
    let crateZ = 0;
    let playerZ = 0;
    let crateA = 1;
    let playerA = 1;
    if (G.anim) {
      const u = G.anim.kind === "fall" ? easeOut(G.anim.t / G.anim.dur) : ease(G.anim.t / G.anim.dur);
      px = lerp(G.anim.px0, G.anim.px1, u);
      py = lerp(G.anim.py0, G.anim.py1, u);
      cx = lerp(G.anim.cx0, G.anim.cx1, u);
      cy = lerp(G.anim.cy0, G.anim.cy1, u);
      if (G.anim.kind === "fall") {
        if (G.anim.who === "crate") {
          crateZ = u * 18 + u * u * 40;
          crateA = 1 - u;
        }
        if (G.anim.who === "player") {
          playerZ = u * 18 + u * u * 40;
          playerA = 1 - u;
        }
      }
    } else if (G.phase === "die") {
      if (G.why === "pit") {
        crateZ = 48;
        crateA = 0.08;
      }
      if (G.why === "fall") {
        playerZ = 48;
        playerA = 0.08;
      }
    }
    return {
      px: px,
      py: py,
      cx: cx,
      cy: cy,
      crateZ: crateZ,
      playerZ: playerZ,
      crateA: crateA,
      playerA: playerA
    };
  }

  function drawWorld() {
    const w = view.cssW;
    const h = view.cssH;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, w, h);

    const g1 = ctx.createRadialGradient(w * 0.28, h * 0.08, 10, w * 0.28, h * 0.08, w * 0.7);
    g1.addColorStop(0, "rgba(255,61,184,0.14)");
    g1.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createRadialGradient(w * 0.82, h * 0.12, 10, w * 0.82, h * 0.12, w * 0.65);
    g2.addColorStop(0, "rgba(0,240,255,0.1)");
    g2.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + Math.sin(clock * 1.4 + s.p) * 0.45);
      ctx.fillStyle = "rgba(230,236,255," + a + ")";
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const y = ((m.y * h + clock * m.v) % (h + 40)) - 20;
      ctx.fillStyle = "rgba(255,61,184,0.09)";
      ctx.beginPath();
      ctx.arc(m.x * w, y, m.s * 0.12, 0, TAU);
      ctx.fill();
    }

    let shx = 0;
    let shy = 0;
    if (G.shake > 0) {
      shx = (Math.random() - 0.5) * G.shake;
      shy = (Math.random() - 0.5) * G.shake;
    }
    ctx.save();
    ctx.translate(shx, shy);
    if (G.punch > 0) {
      const k = 1 + G.punch * 0.04;
      ctx.translate(w * 0.5, h * 0.5);
      ctx.scale(k, k);
      ctx.translate(-w * 0.5, -h * 0.5);
    }

    const vis = visPos();
    const onSeal = Math.hypot(vis.cx - G.gx, vis.cy - G.gy) < 0.08 && G.phase !== "die";

    for (let y = 0; y < G.h; y++) {
      for (let x = 0; x < G.w; x++) {
        const tile = G.grid[y][x];
        const p = iso(x, y);
        if (tile === "~") {
          drawDiamond(p.x, p.y, view.tw, view.th, "#07010d", "rgba(255,61,184,0.38)", 1.25);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(1, 0.5);
          ctx.beginPath();
          ctx.arc(0, 0, view.tw * 0.58, 0, TAU);
          ctx.fillStyle = "#010005";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,61,184," + (0.42 + Math.sin(clock * 2.2 + x * 1.7 + y) * 0.18) + ")";
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, view.tw * 0.26, 0, TAU);
          ctx.fillStyle = "rgba(255,61,184,0.16)";
          ctx.fill();
          ctx.restore();
        } else if (tile === ".") {
          const odd = (x + y) % 2;
          const fill = odd ? "#1a0c28" : "#11081c";
          drawDiamond(p.x, p.y, view.tw, view.th, fill, "rgba(0,240,255,0.14)", 1);
        }
      }
    }

    const gp = iso(G.gx, G.gy);
    drawSeal(gp, clock, onSeal);

    if (hover && mode === "play" && G.phase === "play") {
      const hp = iso(hover.x, hover.y);
      if (at(G.grid, hover.x, hover.y) === ".") {
        drawDiamond(hp.x, hp.y, view.tw * 0.92, view.th * 0.92, "rgba(0,240,255,0.08)", "rgba(0,240,255,0.45)", 1.2);
      }
    }

    const sprites = [];
    for (let y = 0; y < G.h; y++) {
      for (let x = 0; x < G.w; x++) {
        if (G.grid[y][x] === "#") {
          sprites.push({ d: x + y, kind: "wall", x: x, y: y });
        }
      }
    }
    sprites.push({ d: vis.cx + vis.cy + 0.2, kind: "crate", x: vis.cx, y: vis.cy, z: vis.crateZ });
    sprites.push({ d: vis.px + vis.py + 0.35, kind: "player", x: vis.px, y: vis.py, z: vis.playerZ });
    sprites.sort(function (a, b) {
      return a.d - b.d;
    });

    for (let i = 0; i < sprites.length; i++) {
      const sp = sprites[i];
      const p = iso(sp.x, sp.y);
      p.y += sp.z || 0;
      if (sp.kind === "wall") drawWall(p);
      else if (sp.kind === "crate") {
        ctx.globalAlpha = vis.crateA;
        drawCrate(p, clock, onSeal, G.crateSquash);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = vis.playerA;
        drawPlayer(p, clock, G.faceX, G.faceY);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const u = pt.t / pt.life;
      ctx.fillStyle = "rgba(" + pt.rgb + "," + (1 - u) + ")";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r * (1 - u * 0.4), 0, TAU);
      ctx.fill();
    }

    if (flash > 0) {
      ctx.fillStyle = "rgba(" + flashRgb + "," + Math.min(0.28, flash * 0.45) + ")";
      ctx.fillRect(0, 0, w, h);
    }

    if (mode === "play" && G.phase === "play") {
      ctx.font = "11px Segoe UI, PingFang SC, sans-serif";
      ctx.fillStyle = "rgba(139,144,184,0.8)";
      ctx.textAlign = "left";
      ctx.fillText("推 " + (NUDGES - G.left) + " / " + NUDGES, 14, h - 14);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(0,240,255,0.55)";
      ctx.fillText(STAGES[G.stage].sub, w - 14, h - 14);
    }
  }

  function canUndo() {
    return mode === "play" && G.undo.length && (G.phase === "play" || G.phase === "anim");
  }

  function undo() {
    if (!canUndo()) return;
    applySnap(G.undo.pop());
    G.lock = 0.05;
    SFX.bump();
    syncHud();
  }

  function fail(why) {
    G.why = why;
    G.phase = "die";
    G.phaseT = 0;
    G.shake = 7;
    flash = 0.55;
    flashRgb = "255,61,184";
    SFX.die();
  }

  function winRoom() {
    G.phase = "clear";
    G.phaseT = 0;
    flash = 0.5;
    flashRgb = "0,240,255";
    G.punch = 1;
    const p = iso(G.cx, G.cy);
    burst(p.x, p.y - view.zh, "0,240,255", 22, 90);
    burst(p.x, p.y - view.zh, "255,227,107", 10, 70);
    SFX.seal();
    showToast("印合", false);
  }

  function tryMove(dx, dy, fromQueue) {
    if (mode !== "play") return false;
    if (G.phase !== "play") return false;
    if (G.lock > 0) return false;
    if (!dx && !dy) return false;
    G.faceX = dx;
    G.faceY = dy;

    const nx = G.px + dx;
    const ny = G.py + dy;
    const tile = at(G.grid, nx, ny);
    if (tile === "#") {
      G.bump = 1;
      G.shake = 2.2;
      SFX.bump();
      return false;
    }

    const pushing = nx === G.cx && ny === G.cy;
    if (pushing) {
      const cx2 = G.cx + dx;
      const cy2 = G.cy + dy;
      const dest = at(G.grid, cx2, cy2);
      if (dest === "#") {
        G.bump = 1;
        G.shake = 3;
        G.crateSquash = 0.78;
        SFX.bump();
        return false;
      }
      G.undo.push(snapshot());
      if (G.undo.length > 48) G.undo.shift();
      const fall = dest === "~";
      G.anim = {
        t: 0,
        dur: fall ? FALL_T : PUSH_T,
        px0: G.px,
        py0: G.py,
        px1: nx,
        py1: ny,
        cx0: G.cx,
        cy0: G.cy,
        cx1: cx2,
        cy1: cy2,
        kind: fall ? "fall" : "nudge",
        who: fall ? "crate" : "",
        after: fall ? "pit" : "nudge"
      };
      G.phase = "anim";
      G.px = nx;
      G.py = ny;
      G.cx = cx2;
      G.cy = cy2;
      G.left -= 1;
      G.crateSquash = 0.72;
      G.punch = 0.7;
      G.walkPath.length = 0;
      const a = iso(nx, ny);
      spark(a.x, a.y, dx, dy, "255,61,184");
      SFX.nudge();
      syncHud();
      showToast("推 " + (NUDGES - G.left) + " / " + NUDGES, G.left <= 1);
      return true;
    }

    if (tile === "~") {
      G.undo.push(snapshot());
      G.anim = {
        t: 0,
        dur: FALL_T,
        px0: G.px,
        py0: G.py,
        px1: nx,
        py1: ny,
        cx0: G.cx,
        cy0: G.cy,
        cx1: G.cx,
        cy1: G.cy,
        kind: "fall",
        who: "player",
        after: "fall"
      };
      G.phase = "anim";
      G.px = nx;
      G.py = ny;
      G.walkPath.length = 0;
      SFX.fall();
      return true;
    }

    G.undo.push(snapshot());
    if (G.undo.length > 48) G.undo.shift();
    G.anim = {
      t: 0,
      dur: WALK_T,
      px0: G.px,
      py0: G.py,
      px1: nx,
      py1: ny,
      cx0: G.cx,
      cy0: G.cy,
      cx1: G.cx,
      cy1: G.cy,
      kind: "walk",
      who: "",
      after: fromQueue ? "walkq" : "idle"
    };
    G.phase = "anim";
    G.px = nx;
    G.py = ny;
    const p = iso(nx, ny);
    burst(p.x, p.y + view.th * 0.2, "0,240,255", 3, 22);
    SFX.step();
    return true;
  }

  function finishAnim() {
    const after = G.anim ? G.anim.after : "idle";
    G.anim = null;
    G.phase = "play";
    G.phaseT = 0;

    if (after === "pit") {
      fail("pit");
      return;
    }
    if (after === "fall") {
      fail("fall");
      return;
    }
    if (G.cx === G.gx && G.cy === G.gy) {
      winRoom();
      return;
    }
    if (after === "nudge") {
      if (G.left <= 0) {
        fail("empty");
        return;
      }
      if (crateDist(G.grid, G.cx, G.cy, G.gx, G.gy) > G.left) {
        fail("bias");
        showToast("推偏了", true);
        return;
      }
    }
    if (G.walkPath.length) {
      const step = G.walkPath.shift();
      tryMove(step.x, step.y, true);
    }
  }

  function pathTo(tx, ty) {
    if (tx === G.px && ty === G.py) return [];
    if (at(G.grid, tx, ty) !== ".") return null;
    const w = G.w;
    const h = G.h;
    const seen = new Int16Array(w * h);
    seen.fill(-1);
    const q = [G.px, G.py];
    seen[G.py * w + G.px] = 1;
    const prev = new Int16Array(w * h);
    prev.fill(-1);
    let found = false;
    for (let i = 0; i < q.length; ) {
      const x = q[i++];
      const y = q[i++];
      if (x === tx && y === ty) {
        found = true;
        break;
      }
      for (let k = 0; k < 4; k++) {
        const nx = x + DIRS[k].x;
        const ny = y + DIRS[k].y;
        if (at(G.grid, nx, ny) !== ".") continue;
        if (nx === G.cx && ny === G.cy) continue;
        const id = ny * w + nx;
        if (seen[id] !== -1) continue;
        seen[id] = 1;
        prev[id] = y * w + x;
        q.push(nx, ny);
      }
    }
    if (!found) {
      if (tx === G.cx && ty === G.cy) {
        const dx = tx - G.px;
        const dy = ty - G.py;
        if (Math.abs(dx) + Math.abs(dy) === 1) return [{ x: dx, y: dy }];
      }
      return null;
    }
    const steps = [];
    let id = ty * w + tx;
    const start = G.py * w + G.px;
    while (id !== start) {
      const p = prev[id];
      const x = id % w;
      const y = (id - x) / w;
      const px = p % w;
      const py = (p - px) / w;
      steps.push({ x: x - px, y: y - py });
      id = p;
    }
    steps.reverse();
    return steps;
  }

  function pollDir(map, held, dt) {
    let pick = null;
    for (let i = 0; i < DIRS.length; i++) {
      const d = DIRS[i];
      if (!map[d.k]) {
        held[d.k] = 0;
        continue;
      }
      const was = held[d.k];
      held[d.k] = was + dt;
      if (was === 0) pick = d;
      else if (
        !pick &&
        was >= 0.28 &&
        Math.floor((was - 0.28) / 0.15) !== Math.floor((was + dt - 0.28) / 0.15)
      ) {
        pick = d;
      }
    }
    if (!pick) return null;
    if (held[pick.k] > dt) {
      const nx = G.px + pick.x;
      const ny = G.py + pick.y;
      if (nx === G.cx && ny === G.cy) return null;
    }
    return pick;
  }

  function tick(dt) {
    clock += dt;
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }
    flash = Math.max(0, flash - dt * 2.4);
    G.shake = Math.max(0, G.shake - dt * 22);
    G.punch = Math.max(0, G.punch - dt * 3.2);
    G.bump = Math.max(0, G.bump - dt * 4);
    G.crateSquash = lerp(G.crateSquash, 1, 1 - Math.pow(0.0008, dt));
    G.lock = Math.max(0, G.lock - dt);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }

    if (mode !== "play" || paused) return;

    const dir = pollDir(keys, keyHeld, dt) || pollDir(pad, padHeld, dt);
    if (dir) G.queue = { x: dir.x, y: dir.y };

    if (G.phase === "anim") {
      G.anim.t += dt;
      if (G.anim.t >= G.anim.dur) finishAnim();
      return;
    }

    if (G.phase === "clear") {
      G.phaseT += dt;
      if (G.phaseT >= CLEAR_T) {
        if (G.stage + 1 >= STAGES.length) {
          mode = "win";
          SFX.win();
          showOverlay("win");
          syncHud();
        } else {
          loadRoom(G.stage + 1, G.lives);
        }
      }
      return;
    }

    if (G.phase === "die") {
      G.phaseT += dt;
      if (G.phaseT >= DIE_T) {
        const lives = G.lives - 1;
        if (lives <= 0) {
          mode = "lose";
          G.lives = 0;
          showOverlay("lose");
          syncHud();
        } else {
          loadRoom(G.stage, lives);
          showToast("余命 " + lives, true);
        }
      }
      return;
    }

    if (frozen) return;

    if (G.queue) {
      const q = G.queue;
      G.queue = null;
      tryMove(q.x, q.y, false);
    }
  }

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    if (acc > 0.2) acc = 0.2;
    fit();
    while (acc >= STEP) {
      tick(STEP);
      acc -= STEP;
    }
    drawWorld();
    requestAnimationFrame(frame);
  }

  function startRun() {
    SFX.start();
    mode = "play";
    hideOverlay();
    loadRoom(0, LIVES);
  }

  function onOverlayAction() {
    SFX.ensure();
    if (overlayKind === "title" || overlayKind === "lose" || overlayKind === "win") startRun();
  }

  ovBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    onOverlayAction();
  });
  btnRetry.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    SFX.ensure();
    startRun();
  });
  btnMute.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    SFX.ensure();
    setMuted(!SFX.muted);
  });
  btnUndo.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    SFX.ensure();
    undo();
  });

  function bindPad(el, key) {
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      pad[key] = true;
      el.classList.add("held");
      SFX.ensure();
    };
    const up = function () {
      pad[key] = false;
      el.classList.remove("held");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
  }
  bindPad(padBtns.left, "left");
  bindPad(padBtns.right, "right");
  bindPad(padBtns.up, "up");
  bindPad(padBtns.down, "down");

  function eventToLocal(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (frozen) return;
    e.preventDefault();
    const p = eventToLocal(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.sx = p.x;
    pointer.sy = p.y;
    pointer.moved = false;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    SFX.ensure();
  });
  canvas.addEventListener("pointermove", function (e) {
    const p = eventToLocal(e);
    const cell = screenToCell(p.x, p.y);
    if (cell.x >= 0 && cell.y >= 0 && cell.x < G.w && cell.y < G.h) hover = cell;
    else hover = null;
    if (!pointer.down || pointer.id !== e.pointerId) return;
    pointer.x = p.x;
    pointer.y = p.y;
    if (Math.abs(p.x - pointer.sx) + Math.abs(p.y - pointer.sy) > 12) pointer.moved = true;
  });
  function endPtr(e) {
    if (pointer.id !== e.pointerId && pointer.id != null) return;
    if (pointer.down && mode === "play" && G.phase === "play" && !frozen) {
      const dx = pointer.x - pointer.sx;
      const dy = pointer.y - pointer.sy;
      if (pointer.moved && Math.hypot(dx, dy) > 22) {
        const isoDir = screenSwipeToGrid(dx, dy);
        tryMove(isoDir.x, isoDir.y, false);
      } else {
        const cell = screenToCell(pointer.x, pointer.y);
        handleTapCell(cell.x, cell.y);
      }
    }
    pointer.down = false;
    pointer.id = null;
    pointer.moved = false;
  }
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);
  canvas.addEventListener("pointerleave", function () {
    hover = null;
  });

  function screenSwipeToGrid(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) return { x: dx > 0 ? 1 : -1, y: 0 };
    return { x: 0, y: dy > 0 ? 1 : -1 };
  }

  function handleTapCell(x, y) {
    if (x < 0 || y < 0 || x >= G.w || y >= G.h) return;
    const dx = x - G.px;
    const dy = y - G.py;
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      tryMove(dx, dy, false);
      return;
    }
    const path = pathTo(x, y);
    if (path && path.length) {
      const first = path.shift();
      G.walkPath = path;
      tryMove(first.x, first.y, true);
    } else if (x === G.cx && y === G.cy) {
      const adx = x - G.px;
      const ady = y - G.py;
      if (Math.abs(adx) + Math.abs(ady) === 1) tryMove(adx, ady, false);
    }
  }

  const KEYMAP = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    a: "left",
    d: "right",
    w: "up",
    s: "down",
    A: "left",
    D: "right",
    W: "up",
    S: "down"
  };

  window.addEventListener("keydown", function (e) {
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      SFX.ensure();
      setMuted(!SFX.muted);
      return;
    }
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      SFX.ensure();
      startRun();
      return;
    }
    if (e.key === "z" || e.key === "Z") {
      e.preventDefault();
      SFX.ensure();
      undo();
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      if (frozen) {
        e.preventDefault();
        onOverlayAction();
        return;
      }
    }
    const k = KEYMAP[e.key];
    if (k) {
      e.preventDefault();
      keys[k] = true;
      SFX.ensure();
    }
  });
  window.addEventListener("keyup", function (e) {
    const k = KEYMAP[e.key];
    if (k) keys[k] = false;
  });
  window.addEventListener("blur", function () {
    keys.left = keys.right = keys.up = keys.down = false;
    pad.left = pad.right = pad.up = pad.down = false;
    pointer.down = false;
  });
  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
  });
  window.addEventListener("resize", fit);

  loadRoom(0, LIVES);
  showOverlay("title");
  mode = "title";
  syncHud();
  fit();
  requestAnimationFrame(frame);
})();
