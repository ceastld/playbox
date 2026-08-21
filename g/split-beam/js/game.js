(() => {
  "use strict";

  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const MUTE_KEY = "playbox-split-beam-mute";
  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const WHT = { r: 255, g: 255, b: 255 };
  const INK = { r: 246, g: 243, b: 255 };
  const COL = { mag: MAG, gold: GOLD, cyan: CYN, white: WHT };
  const NAME = { mag: "品红", gold: "金", cyan: "青", white: "白" };
  const GROW = 16;
  const FONT = '"Segoe UI", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';

  const STAGES = [
    {
      name: "初绽",
      sub: "BLOOM",
      hint: "点那面镜子，把青光折进上门",
      cols: 7,
      rows: 5,
      time: 30,
      emitter: { c: 0, r: 2 },
      prism: { c: 2, r: 2 },
      walls: [],
      gates: [
        { c: 6, r: 0, col: "cyan" },
        { c: 6, r: 2, col: "gold" },
        { c: 2, r: 4, col: "mag" }
      ],
      mirrors: [{ c: 2, r: 0, slash: false, lock: false }]
    },
    {
      name: "双折",
      sub: "BEND",
      hint: "上下两面都要转。金光已经对准",
      cols: 7,
      rows: 5,
      time: 28,
      emitter: { c: 0, r: 2 },
      prism: { c: 2, r: 2 },
      walls: [],
      gates: [
        { c: 6, r: 0, col: "cyan" },
        { c: 6, r: 2, col: "gold" },
        { c: 6, r: 4, col: "mag" }
      ],
      mirrors: [
        { c: 2, r: 0, slash: false, lock: false },
        { c: 2, r: 4, slash: true, lock: false }
      ]
    },
    {
      name: "错位",
      sub: "SHIFT",
      hint: "金门不在正东。把金光向下折一格",
      cols: 8,
      rows: 5,
      time: 32,
      emitter: { c: 0, r: 2 },
      prism: { c: 2, r: 2 },
      walls: [],
      gates: [
        { c: 7, r: 0, col: "cyan" },
        { c: 6, r: 3, col: "gold" },
        { c: 7, r: 4, col: "mag" }
      ],
      mirrors: [
        { c: 2, r: 0, slash: false, lock: false },
        { c: 6, r: 2, slash: true, lock: false },
        { c: 2, r: 4, slash: true, lock: false }
      ]
    },
    {
      name: "绕柱",
      sub: "PILLAR",
      hint: "金光被柱挡住。绕上去，别折进青门",
      cols: 8,
      rows: 5,
      time: 44,
      emitter: { c: 0, r: 2 },
      prism: { c: 2, r: 2 },
      walls: [{ c: 4, r: 2 }],
      gates: [
        { c: 7, r: 0, col: "cyan" },
        { c: 7, r: 2, col: "gold" },
        { c: 7, r: 4, col: "mag" }
      ],
      mirrors: [
        { c: 2, r: 0, slash: false, lock: false },
        { c: 3, r: 2, slash: false, lock: false },
        { c: 3, r: 1, slash: false, lock: false },
        { c: 7, r: 1, slash: true, lock: false },
        { c: 2, r: 4, slash: true, lock: false }
      ]
    },
    {
      name: "封门",
      sub: "SEAL",
      hint: "四面镜子。柱子挡金，金门在下一行",
      cols: 8,
      rows: 6,
      time: 42,
      emitter: { c: 0, r: 2 },
      prism: { c: 2, r: 2 },
      walls: [{ c: 4, r: 2 }],
      gates: [
        { c: 7, r: 0, col: "cyan" },
        { c: 7, r: 3, col: "gold" },
        { c: 7, r: 5, col: "mag" }
      ],
      mirrors: [
        { c: 2, r: 0, slash: false, lock: false },
        { c: 3, r: 2, slash: true, lock: false },
        { c: 3, r: 3, slash: true, lock: false },
        { c: 2, r: 5, slash: true, lock: false }
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
  const btnPrev = document.getElementById("btn-prev");
  const btnFlip = document.getElementById("btn-flip");
  const btnNext = document.getElementById("btn-next");
  const stageLabel = document.getElementById("stage-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const lampMag = document.getElementById("lamp-mag");
  const lampGold = document.getElementById("lamp-gold");
  const lampCyan = document.getElementById("lamp-cyan");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;
  const board = { ox: 0, oy: 0, cell: 48, bw: 1, bh: 1 };
  const particles = [];
  const sparks = [];
  const motes = [];
  const ripples = [];

  const G = {
    mode: "title",
    stage: 0,
    lives: LIVES,
    time: 30,
    t: 0,
    clock: 0,
    lock: 0,
    shake: 0,
    flash: 0,
    flashRgb: "255,61,184",
    toastT: 0,
    beamGrow: 0,
    sel: null,
    mirrors: [],
    hits: { mag: false, gold: false, cyan: false },
    was: { mag: false, gold: false, cyan: false },
    net: null,
    taught: false,
    why: "",
    phaseT: 0,
    turns: 0
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
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function rgb(c, a) {
    return a == null
      ? "rgb(" + c.r + "," + c.g + "," + c.b + ")"
      : "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function bounce(slash, dir) {
    return slash ? dir ^ 1 : dir ^ 3;
  }
  function stageNow() {
    return STAGES[G.stage];
  }
  function rotList() {
    const out = [];
    for (let i = 0; i < G.mirrors.length; i++) {
      if (!G.mirrors[i].lock) out.push(G.mirrors[i]);
    }
    return out;
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    ensure() {
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
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.26;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) { /* ignore */ }
    },
    toggle() {
      this.ensure();
      this.setMuted(!this.muted);
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
    noise(dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1800;
      f.Q.value = 0.6;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    rotate() {
      this.ensure();
      this.beep(740, 0.07, "triangle", 0.05, 420);
      this.beep(220, 0.08, "sine", 0.03, 110);
    },
    select() {
      this.ensure();
      this.beep(520, 0.04, "sine", 0.03, 680);
    },
    deny() {
      this.ensure();
      this.beep(140, 0.12, "square", 0.04, 70);
    },
    lockCol(col) {
      this.ensure();
      const f = col === "cyan" ? 880 : col === "gold" ? 660 : 520;
      this.beep(f, 0.16, "triangle", 0.07, f * 1.5);
      this.beep(f * 0.5, 0.2, "sine", 0.04, f);
    },
    clear() {
      this.ensure();
      this.beep(440, 0.14, "triangle", 0.08, 880);
      this.beep(660, 0.22, "sine", 0.06, 1320);
      this.beep(880, 0.32, "sine", 0.05, 1760);
    },
    leak() {
      this.ensure();
      this.noise(0.22, 0.09);
      this.beep(220, 0.4, "sawtooth", 0.08, 55);
    },
    win() {
      this.ensure();
      this.beep(523, 0.18, "sine", 0.08, 784);
      this.beep(659, 0.28, "triangle", 0.07, 1046);
      this.beep(784, 0.42, "sine", 0.06, 1568);
    },
    lose() {
      this.ensure();
      this.beep(180, 0.5, "sawtooth", 0.09, 48);
      this.beep(80, 0.7, "square", 0.05, 36);
    },
    start() {
      this.ensure();
      this.beep(220, 0.14, "sine", 0.07, 660);
      this.beep(440, 0.2, "triangle", 0.04, 880);
    },
    tickDrone(lit) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 58;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const playing = G.mode === "play" || G.mode === "clear";
      this.drone.frequency.setTargetAtTime(58 + lit * 10, t, 0.16);
      this.droneGain.gain.setTargetAtTime(playing ? 0.018 + lit * 0.01 : 0.0001, t, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function cellCenter(c, r) {
    return {
      x: board.ox + (c + 0.5) * board.cell,
      y: board.oy + (r + 0.5) * board.cell
    };
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
        r: rand(spec.r0, spec.r1),
        col: spec.col || WHT
      });
    }
  }

  function spark(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      if (sparks.length > 80) sparks.shift();
      const a = rand(0, TAU);
      const sp = rand(40, 190);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.16, 0.46),
        col: col || MAG
      });
    }
  }

  function ripple(x, y, mag) {
    ripples.push({ x: x, y: y, t: 0, mag: !!mag });
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.15;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.28 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 8 + 3
      });
    }
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
    layout();
  }

  function layout() {
    const s = stageNow();
    const padX = coarse ? 18 : 32;
    const padY = coarse ? 18 : 28;
    const extraBot = coarse ? 56 : 8;
    const cell = Math.min((W - padX * 2) / s.cols, (H - padY * 2 - extraBot) / s.rows);
    board.cell = Math.max(28, cell);
    board.bw = board.cell * s.cols;
    board.bh = board.cell * s.rows;
    board.ox = (W - board.bw) / 2;
    board.oy = (H - board.bh - extraBot * 0.35) / 2;
  }

  function occupancy() {
    const s = stageNow();
    const g = [];
    for (let r = 0; r < s.rows; r++) {
      g[r] = [];
      for (let c = 0; c < s.cols; c++) g[r][c] = { kind: "." };
    }
    g[s.emitter.r][s.emitter.c] = { kind: "E" };
    g[s.prism.r][s.prism.c] = { kind: "P" };
    for (let i = 0; i < s.walls.length; i++) {
      const w = s.walls[i];
      g[w.r][w.c] = { kind: "#" };
    }
    for (let i = 0; i < s.gates.length; i++) {
      const gt = s.gates[i];
      g[gt.r][gt.c] = { kind: "G", col: gt.col };
    }
    for (let i = 0; i < G.mirrors.length; i++) {
      const m = G.mirrors[i];
      g[m.r][m.c] = { kind: "/", slash: m.slash, lock: m.lock, ref: m };
    }
    return g;
  }

  function trace() {
    const s = stageNow();
    const grid = occupancy();
    const segs = [];
    const hits = { mag: false, gold: false, cyan: false };
    const hitAt = { mag: null, gold: null, cyan: null };
    let leak = null;
    let maxDist = 0;
    const seen = Object.create(null);

    function addSeg(x0, y0, x1, y1, color, d0, d1) {
      segs.push({ x0: x0, y0: y0, x1: x1, y1: y1, color: color, d0: d0, d1: d1 });
      if (d1 > maxDist) maxDist = d1;
    }

    function walk(c, r, dir, color, dist) {
      for (let step = 0; step < 56; step++) {
        const key = color + ":" + c + ":" + r + ":" + dir;
        if (seen[key]) return;
        seen[key] = 1;
        const nc = c + DX[dir];
        const nr = r + DY[dir];
        const a = cellCenter(c, r);
        if (nc < 0 || nr < 0 || nc >= s.cols || nr >= s.rows) {
          const b = {
            x: a.x + DX[dir] * board.cell * 0.48,
            y: a.y + DY[dir] * board.cell * 0.48
          };
          addSeg(a.x, a.y, b.x, b.y, color, dist, dist + 0.48);
          return;
        }
        const cell = grid[nr][nc];
        if (cell.kind === "#") {
          const b = {
            x: a.x + DX[dir] * board.cell * 0.5,
            y: a.y + DY[dir] * board.cell * 0.5
          };
          addSeg(a.x, a.y, b.x, b.y, color, dist, dist + 0.5);
          return;
        }
        const b = cellCenter(nc, nr);
        addSeg(a.x, a.y, b.x, b.y, color, dist, dist + 1);
        dist += 1;
        if (cell.kind === "G") {
          if (color === cell.col) {
            hits[color] = true;
            hitAt[color] = { x: b.x, y: b.y, dist: dist };
          } else if (color !== "white") {
            leak = { x: b.x, y: b.y, dist: dist, col: color, gate: cell.col };
          } else {
            leak = { x: b.x, y: b.y, dist: dist, col: color, gate: cell.col };
          }
          return;
        }
        if (cell.kind === "E") return;
        if (cell.kind === "/") {
          dir = bounce(cell.slash, dir);
          c = nc;
          r = nr;
          continue;
        }
        if (cell.kind === "P") {
          if (color === "white") {
            walk(nc, nr, dir, "gold", dist);
            walk(nc, nr, (dir + 3) & 3, "cyan", dist);
            walk(nc, nr, (dir + 1) & 3, "mag", dist);
            return;
          }
          c = nc;
          r = nr;
          continue;
        }
        c = nc;
        r = nr;
      }
    }

    walk(s.emitter.c, s.emitter.r, 1, "white", 0);
    return { segs: segs, hits: hits, hitAt: hitAt, leak: leak, maxDist: maxDist };
  }

  function syncHud() {
    const s = stageNow();
    stageLabel.textContent = s.name + " · " + s.sub;
    const t = Math.max(0, G.time);
    timeLabel.textContent = G.mode === "title" ? "—" : "时 " + t.toFixed(1);
    timeLabel.classList.toggle("warn", G.mode === "play" && t < 8);
    lampMag.classList.toggle("on", !!G.hits.mag);
    lampGold.classList.toggle("on", !!G.hits.gold);
    lampCyan.classList.toggle("on", !!G.hits.cyan);
    pipsEl.innerHTML = "";
    for (let i = 0; i < LIVES; i++) {
      const d = document.createElement("i");
      d.className = "pip" + (i < G.lives ? " on" : "") + (G.lives === 1 && i === 0 ? " warn" : "");
      pipsEl.appendChild(d);
    }
    if (G.mode === "play" || G.mode === "clear") hintEl.textContent = s.hint;
    else hintEl.textContent = "白光分光 · 三色归门";
  }

  function loadStage(i, msg, warn) {
    G.stage = i;
    const s = stageNow();
    layout();
    G.mirrors = s.mirrors.map(function (m) {
      const ang = m.slash ? -Math.PI / 4 : Math.PI / 4;
      return {
        c: m.c,
        r: m.r,
        slash: m.slash,
        lock: !!m.lock,
        drawA: ang,
        toA: ang,
        pulse: 0,
        hot: 0
      };
    });
    const list = rotList();
    G.sel = list[0] || null;
    G.time = s.time;
    G.beamGrow = 0;
    G.lock = 0.28;
    G.hits = { mag: false, gold: false, cyan: false };
    G.net = trace();
    G.was = {
      mag: !!G.net.hits.mag,
      gold: !!G.net.hits.gold,
      cyan: !!G.net.hits.cyan
    };
    G.phaseT = 0;
    particles.length = 0;
    sparks.length = 0;
    ripples.length = 0;
    const p = cellCenter(s.prism.c, s.prism.r);
    emit(14, {
      x: p.x, y: p.y, j: 10,
      vx0: -30, vx1: 30, vy0: -30, vy1: 30,
      life: 0.45, r0: 1, r1: 2.4, col: GOLD
    });
    if (msg) toast(msg, warn);
    else if (G.mode === "play" && !G.taught && i === 0) {
      toast(coarse ? "点镜子翻转" : "点镜子或空格翻转");
      G.taught = true;
    }
    syncHud();
  }

  function resetRun() {
    G.lives = LIVES;
    G.t = 0;
    G.turns = 0;
    G.shake = 0;
    G.flash = 0;
    G.why = "";
    loadStage(0);
  }

  function showPanel(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "PRISM";
      ovTitle.textContent = "分光";
      ovLead.innerHTML = "白光进棱镜，裂成品红、金、青。转动镜子，让三色各进各门。<br />进错门会串色，光路当场熄一段。";
      ovOps.textContent = coarse
        ? "点镜子翻转 · 底栏上一面 / 翻转 / 下一面 · M 静音"
        : "点镜子翻转 · WASD 选镜 · 空格翻转 · M 静音";
      ovBtn.textContent = "开灯";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "归位";
      ovLead.textContent = "五关三色都进了自己的门。棱镜还在嗡。";
      ovOps.textContent = "翻转 " + G.turns + " 次 · 五关全通";
      ovBtn.textContent = "再开一局";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "BREAK";
      ovTitle.textContent = "熄灭";
      ovLead.textContent = G.why || "串色，或时间耗尽。光路断了。";
      ovOps.textContent = "过关 " + G.stage + " / " + STAGES.length;
      ovBtn.textContent = "再折一次";
    }
  }

  function hidePanel() {
    overlay.classList.add("hidden");
    ovBtn.blur();
  }

  function beginClear() {
    if (G.mode !== "play") return;
    G.mode = "clear";
    G.phaseT = 0;
    G.flash = 0.42;
    G.flashRgb = "0,240,255";
    G.lock = 1;
    audio.clear();
    toast("三色归位");
    const s = stageNow();
    for (let i = 0; i < s.gates.length; i++) {
      const p = cellCenter(s.gates[i].c, s.gates[i].r);
      spark(p.x, p.y, 12, COL[s.gates[i].col]);
      ripple(p.x, p.y, false);
    }
    syncHud();
  }

  function beginLeak(leak) {
    if (G.mode !== "play") return;
    G.mode = "fail";
    G.phaseT = 0;
    G.flash = 0.55;
    G.flashRgb = "255,61,184";
    G.shake = 0.46;
    G.lock = 1;
    G.why = NAME[leak.col] + "进了" + NAME[leak.gate] + "门 · 串色";
    audio.leak();
    toast("串色", true);
    spark(leak.x, leak.y, 22, MAG);
    ripple(leak.x, leak.y, true);
    emit(22, {
      x: leak.x, y: leak.y, j: 8,
      vx0: -140, vx1: 140, vy0: -140, vy1: 140,
      life: 0.55, r0: 1.2, r1: 3.2, col: MAG
    });
    syncHud();
  }

  function beginTimeout() {
    if (G.mode !== "play") return;
    G.mode = "fail";
    G.phaseT = 0;
    G.flash = 0.45;
    G.flashRgb = "255,61,184";
    G.shake = 0.3;
    G.lock = 1;
    G.why = "时间耗尽 · 光熄了";
    audio.leak();
    toast("光熄了", true);
    syncHud();
  }

  function afterFail() {
    G.lives -= 1;
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.lose();
      showPanel("lose");
      syncHud();
      return;
    }
    G.mode = "play";
    loadStage(G.stage, "−1 命 · 重折本关", true);
  }

  function afterClear() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      audio.win();
      showPanel("win");
      syncHud();
      return;
    }
    G.mode = "play";
    loadStage(G.stage + 1);
  }

  function canPlay() {
    return G.mode === "play" && G.lock <= 0;
  }

  function flipMirror(m) {
    if (!canPlay() || !m || m.lock) {
      if (m && m.lock) audio.deny();
      return;
    }
    m.slash = !m.slash;
    m.toA = m.drawA + Math.PI / 2;
    m.pulse = 1;
    m.hot = 1;
    G.sel = m;
    G.turns += 1;
    G.beamGrow = Math.max(G.beamGrow, 12);
    G.lock = 0.1;
    const p = cellCenter(m.c, m.r);
    ripple(p.x, p.y, false);
    emit(8, {
      x: p.x, y: p.y, j: 8,
      vx0: -50, vx1: 50, vy0: -50, vy1: 50,
      life: 0.28, r0: 1, r1: 2.2, col: CYN
    });
    audio.rotate();
  }

  function cycle(dir) {
    const list = rotList();
    if (!list.length) return;
    let i = list.indexOf(G.sel);
    if (i < 0) i = 0;
    i = (i + dir + list.length) % list.length;
    G.sel = list[i];
    G.sel.pulse = Math.max(G.sel.pulse, 0.5);
    audio.select();
  }

  function moveSel(dc, dr) {
    const list = rotList();
    if (!list.length || !G.sel) return;
    let best = null;
    let score = 1e9;
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (m === G.sel) continue;
      const ac = m.c - G.sel.c;
      const ar = m.r - G.sel.r;
      if (dc && ac * dc <= 0) continue;
      if (dr && ar * dr <= 0) continue;
      const along = dc ? ac * dc : ar * dr;
      const side = dc ? Math.abs(ar) : Math.abs(ac);
      const sc = side * 2.4 + along;
      if (sc < score) {
        score = sc;
        best = m;
      }
    }
    if (best) {
      G.sel = best;
      G.sel.pulse = Math.max(G.sel.pulse, 0.5);
      audio.select();
    }
  }

  function hitMirror(cssX, cssY) {
    const c = Math.floor((cssX - board.ox) / board.cell);
    const r = Math.floor((cssY - board.oy) / board.cell);
    for (let i = 0; i < G.mirrors.length; i++) {
      const m = G.mirrors[i];
      if (m.c === c && m.r === r) return m;
    }
    return null;
  }

  function eventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches && e.touches[0]
      ? e.touches[0]
      : e.changedTouches && e.changedTouches[0]
        ? e.changedTouches[0]
        : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function startPlay() {
    audio.start();
    hidePanel();
    G.mode = "play";
    resetRun();
  }

  function retry() {
    audio.ensure();
    hidePanel();
    G.mode = "play";
    resetRun();
    toast("重开");
  }

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startPlay();
  });
  btnMute.addEventListener("click", function () {
    audio.toggle();
  });
  btnRetry.addEventListener("click", function () {
    retry();
  });
  btnPrev.addEventListener("click", function () {
    if (!canPlay()) return;
    cycle(-1);
  });
  btnNext.addEventListener("click", function () {
    if (!canPlay()) return;
    cycle(1);
  });
  btnFlip.addEventListener("click", function () {
    if (!canPlay()) return;
    flipMirror(G.sel);
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    if (!canPlay()) return;
    audio.ensure();
    const p = eventPos(e);
    const m = hitMirror(p.x, p.y);
    if (m) {
      e.preventDefault();
      flipMirror(m);
    }
  });

  window.addEventListener("keydown", function (e) {
    if (e.code === "KeyM") {
      audio.toggle();
      e.preventDefault();
      return;
    }
    if (e.code === "KeyR") {
      retry();
      e.preventDefault();
      return;
    }
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        ovBtn.click();
      }
      return;
    }
    if (e.repeat && (e.code === "Space" || e.code === "Enter")) return;
    if (!canPlay()) return;
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      flipMirror(G.sel);
      return;
    }
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      e.preventDefault();
      moveSel(-1, 0);
    } else if (e.code === "ArrowRight" || e.code === "KeyD") {
      e.preventDefault();
      moveSel(1, 0);
    } else if (e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      moveSel(0, -1);
    } else if (e.code === "ArrowDown" || e.code === "KeyS") {
      e.preventDefault();
      moveSel(0, 1);
    } else if (e.code === "KeyQ" || e.code === "BracketLeft") {
      e.preventDefault();
      cycle(-1);
    } else if (e.code === "KeyE" || e.code === "BracketRight") {
      e.preventDefault();
      cycle(1);
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && audio.droneGain && audio.ctx) {
      audio.droneGain.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.08);
    }
  });

  window.addEventListener("resize", resize);

  function drawRoundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBeams(net, grow) {
    const pulse = 0.72 + Math.sin(G.clock * 6.2) * 0.12;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < net.segs.length; i++) {
        const s = net.segs[i];
        if (grow <= s.d0) continue;
        const t = clamp((grow - s.d0) / Math.max(0.001, s.d1 - s.d0), 0, 1);
        const x1 = lerp(s.x0, s.x1, t);
        const y1 = lerp(s.y0, s.y1, t);
        const col = COL[s.color] || WHT;
        let w;
        let a;
        if (pass === 0) {
          w = board.cell * (s.color === "white" ? 0.34 : 0.3);
          a = 0.07 * pulse;
        } else if (pass === 1) {
          w = board.cell * 0.14;
          a = 0.28 * pulse;
        } else {
          w = board.cell * (s.color === "white" ? 0.055 : 0.045);
          a = s.color === "white" ? 0.9 : 0.95;
        }
        ctx.strokeStyle = rgb(col, a);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(s.x0, s.y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
    const photonSpeed = 3.4;
    for (let i = 0; i < net.segs.length; i++) {
      const s = net.segs[i];
      const vis = Math.min(grow, s.d1) - s.d0;
      if (vis <= 0.05) continue;
      const col = COL[s.color] || WHT;
      const len = s.d1 - s.d0;
      const u = ((G.clock * photonSpeed + s.d0 * 0.37) % 1);
      if (u * len <= vis) {
        const x = lerp(s.x0, s.x1, u);
        const y = lerp(s.y0, s.y1, u);
        ctx.fillStyle = rgb(col, 0.85);
        ctx.beginPath();
        ctx.arc(x, y, board.cell * 0.045, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawMirror(m) {
    const p = cellCenter(m.c, m.r);
    const cell = board.cell;
    const selected = G.sel === m && (G.mode === "play" || G.mode === "clear");
    const pulse = m.pulse;
    if (selected || pulse > 0) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, cell * 0.42 + pulse * 4, 0, TAU);
      ctx.strokeStyle = rgb(CYN, selected ? 0.45 + pulse * 0.3 : pulse * 0.35);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(m.drawA);
    const half = cell * 0.34;
    ctx.lineCap = "round";
    ctx.strokeStyle = rgb(INK, 0.18);
    ctx.lineWidth = cell * 0.16;
    ctx.beginPath();
    ctx.moveTo(-half, 0);
    ctx.lineTo(half, 0);
    ctx.stroke();
    ctx.strokeStyle = selected ? rgb(CYN, 0.95) : rgb(WHT, 0.82);
    ctx.lineWidth = cell * 0.07;
    ctx.beginPath();
    ctx.moveTo(-half, 0);
    ctx.lineTo(half, 0);
    ctx.stroke();
    ctx.strokeStyle = rgb(CYN, 0.55 + m.hot * 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-half, -cell * 0.04);
    ctx.lineTo(half, -cell * 0.04);
    ctx.stroke();
    ctx.rotate(-m.drawA);
    ctx.font = "600 " + Math.max(9, cell * 0.18) + "px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (m.lock) {
      ctx.fillStyle = rgb(GOLD, 0.7);
      ctx.fillText("锁", 0, cell * 0.34);
    } else if (selected) {
      ctx.fillStyle = rgb(CYN, 0.7);
      ctx.fillText("转", 0, cell * 0.38);
    }
    ctx.restore();
  }

  function drawPrism(s) {
    const p = cellCenter(s.prism.c, s.prism.r);
    const cell = board.cell;
    const k = cell * 0.46;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.moveTo(k * 0.95, 0);
    ctx.lineTo(-k * 0.62, -k * 0.82);
    ctx.lineTo(-k * 0.62, k * 0.82);
    ctx.closePath();
    ctx.fillStyle = "rgba(18, 12, 36, 0.92)";
    ctx.fill();
    ctx.save();
    ctx.clip();
    const g = ctx.createLinearGradient(-k, -k, k, k);
    g.addColorStop(0, rgb(CYN, 0.55));
    g.addColorStop(0.45, rgb(GOLD, 0.42));
    g.addColorStop(1, rgb(MAG, 0.55));
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55 + Math.sin(G.clock * 3.2) * 0.08;
    ctx.fillRect(-k, -k, k * 2, k * 2);
    ctx.restore();
    ctx.strokeStyle = rgb(GOLD, 0.85);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-k * 0.12, 0, cell * 0.07, 0, TAU);
    ctx.fillStyle = rgb(WHT, 0.85);
    ctx.fill();
    ctx.restore();
  }

  function drawEmitter(s) {
    const p = cellCenter(s.emitter.c, s.emitter.r);
    const cell = board.cell;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.22, 0, TAU);
    ctx.fillStyle = "rgba(12, 10, 24, 0.95)";
    ctx.fill();
    ctx.strokeStyle = rgb(WHT, 0.7);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.1, 0, TAU);
    ctx.fillStyle = rgb(WHT, 0.9);
    ctx.shadowColor = rgb(WHT, 0.8);
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgb(INK, 0.55);
    ctx.font = "600 " + Math.max(8, cell * 0.16) + "px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("源", 0, cell * 0.28);
    ctx.restore();
  }

  function drawGate(gt, lit) {
    const p = cellCenter(gt.c, gt.r);
    const cell = board.cell;
    const col = COL[gt.col];
    const w = cell * 0.72;
    const h = cell * 0.78;
    ctx.save();
    ctx.translate(p.x, p.y);
    drawRoundRect(-w / 2, -h / 2, w, h, cell * 0.12);
    ctx.fillStyle = lit ? rgb(col, 0.22) : "rgba(8, 6, 18, 0.88)";
    ctx.fill();
    ctx.strokeStyle = rgb(col, lit ? 0.95 : 0.55);
    ctx.lineWidth = lit ? 2.4 : 1.6;
    ctx.shadowColor = lit ? rgb(col, 0.7) : "transparent";
    ctx.shadowBlur = lit ? 14 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (lit) {
      ctx.beginPath();
      ctx.arc(0, 0, cell * 0.12 + Math.sin(G.clock * 5) * 1.5, 0, TAU);
      ctx.fillStyle = rgb(col, 0.85);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, cell * 0.08, 0, TAU);
      ctx.strokeStyle = rgb(col, 0.4);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.fillStyle = rgb(col, 0.9);
    ctx.font = "700 " + Math.max(9, cell * 0.2) + "px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(NAME[gt.col], 0, cell * 0.28);
    ctx.restore();
  }

  function drawWall(w) {
    const p = cellCenter(w.c, w.r);
    const cell = board.cell;
    const s = cell * 0.72;
    ctx.save();
    ctx.translate(p.x, p.y);
    drawRoundRect(-s / 2, -s / 2, s, s, 6);
    ctx.fillStyle = "rgba(16, 10, 28, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 61, 184, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.22);
    ctx.lineTo(s * 0.22, s * 0.22);
    ctx.moveTo(s * 0.22, -s * 0.22);
    ctx.lineTo(-s * 0.22, s * 0.22);
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    const s = stageNow();
    const shx = G.shake > 0 ? rand(-G.shake, G.shake) * 10 : 0;
    const shy = G.shake > 0 ? rand(-G.shake, G.shake) * 10 : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W * 0.3, H * 0.2, 20, W * 0.5, H * 0.5, Math.max(W, H));
    bg.addColorStop(0, "rgba(40, 12, 48, 0.35)");
    bg.addColorStop(1, "rgba(3, 1, 10, 0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(shx, shy);

    drawRoundRect(board.ox - 8, board.oy - 8, board.bw + 16, board.bh + 16, 14);
    ctx.fillStyle = "rgba(8, 6, 20, 0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x * W + Math.sin(G.clock * 0.4 + m.p) * m.s;
      const y = m.y * H + Math.cos(G.clock * 0.3 + m.p) * m.s * 0.6;
      ctx.fillStyle = "rgba(200, 210, 255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }

    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const p = cellCenter(c, r);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.1, 0, TAU);
        ctx.fill();
      }
    }

    for (let i = 0; i < s.walls.length; i++) drawWall(s.walls[i]);

    const net = G.net;
    if (net) drawBeams(net, G.beamGrow);

    for (let i = 0; i < s.gates.length; i++) {
      const gt = s.gates[i];
      drawGate(gt, !!(G.hits && G.hits[gt.col]));
    }
    drawEmitter(s);
    drawPrism(s);
    for (let i = 0; i < G.mirrors.length; i++) drawMirror(G.mirrors[i]);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      const u = ease(rp.t);
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, lerp(8, board.cell * 0.9, u), 0, TAU);
      ctx.strokeStyle = rp.mag ? rgb(MAG, 0.4 * (1 - u)) : rgb(CYN, 0.4 * (1 - u));
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / p.max;
      ctx.fillStyle = rgb(p.col, a * 0.85);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      ctx.strokeStyle = rgb(p.col, p.life * 2);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = "rgba(" + G.flashRgb + "," + (G.flash * 0.22) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function tickFx(dt) {
    G.clock += dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.2);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = 0; i < G.mirrors.length; i++) {
      const m = G.mirrors[i];
      if (m.drawA !== m.toA) {
        const d = m.toA - m.drawA;
        const step = Math.sign(d) * Math.min(Math.abs(d), dt * 14);
        m.drawA += step;
        if (Math.abs(m.toA - m.drawA) < 0.01) m.drawA = m.toA;
      }
      if (m.pulse > 0) m.pulse = Math.max(0, m.pulse - dt * 3.2);
      if (m.hot > 0) m.hot = Math.max(0, m.hot - dt * 2.4);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) sparks.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].t += dt * 2.4;
      if (ripples[i].t >= 1) ripples.splice(i, 1);
    }
  }

  function updatePlay(dt) {
    G.beamGrow += dt * GROW;
    const net = trace();
    G.net = net;
    const vis = {
      mag: !!(net.hitAt.mag && G.beamGrow >= net.hitAt.mag.dist),
      gold: !!(net.hitAt.gold && G.beamGrow >= net.hitAt.gold.dist),
      cyan: !!(net.hitAt.cyan && G.beamGrow >= net.hitAt.cyan.dist)
    };
    G.hits = vis;

    if (G.mode === "play") {
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        beginTimeout();
        return;
      }
      if (net.leak && G.beamGrow >= net.leak.dist && G.lock <= 0) {
        beginLeak(net.leak);
        return;
      }
      const keys = ["mag", "gold", "cyan"];
      for (let i = 0; i < 3; i++) {
        const k = keys[i];
        if (vis[k] && !G.was[k]) {
          G.was[k] = true;
          audio.lockCol(k);
          const at = net.hitAt[k];
          if (at) {
            spark(at.x, at.y, 10, COL[k]);
            ripple(at.x, at.y, k === "mag");
            toast(NAME[k] + "色入门");
          }
        }
        if (!net.hits[k]) G.was[k] = false;
      }
      if (vis.mag && vis.gold && vis.cyan) beginClear();
    }

    if (G.mode === "play" && Math.random() < dt * 8) {
      const s = stageNow();
      const p = cellCenter(s.prism.c, s.prism.r);
      emit(1, {
        x: p.x, y: p.y, j: 6,
        vx0: -12, vx1: 18, vy0: -16, vy1: 16,
        life: 0.5, r0: 0.8, r1: 1.6, col: GOLD
      });
    }
  }

  let acc = 0;
  let last = performance.now();

  function frame(now) {
    const raw = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    acc += raw;
    const dt = STEP;
    let steps = 0;
    while (acc >= dt && steps < 5) {
      acc -= dt;
      steps += 1;
      tickFx(dt);
      if (G.mode === "play" || G.mode === "clear" || G.mode === "fail" || G.mode === "title") {
        if (G.mode === "title") {
          G.beamGrow += dt * GROW;
          G.net = trace();
          G.hits = G.net.hits;
        } else if (G.mode === "play") {
          G.t += dt;
          updatePlay(dt);
        } else if (G.mode === "clear") {
          G.beamGrow += dt * GROW;
          G.net = trace();
          G.hits = G.net.hits;
          G.phaseT += dt;
          if (G.phaseT > 0.95) afterClear();
        } else if (G.mode === "fail") {
          G.phaseT += dt;
          if (G.phaseT > 0.78) afterFail();
        }
      }
    }
    const lit = (G.hits.mag ? 1 : 0) + (G.hits.gold ? 1 : 0) + (G.hits.cyan ? 1 : 0);
    audio.tickDrone(lit);
    if (G.mode === "play" || G.mode === "clear" || G.mode === "fail") {
      if ((G.t * 10 | 0) !== ((G.t - raw) * 10 | 0)) syncHud();
      else {
        timeLabel.textContent = "时 " + Math.max(0, G.time).toFixed(1);
        timeLabel.classList.toggle("warn", G.mode === "play" && G.time < 8);
      }
    }
    render();
    requestAnimationFrame(frame);
  }

  makeMotes();
  resize();
  loadStage(0);
  G.mode = "title";
  G.beamGrow = 8;
  G.net = trace();
  G.hits = G.net.hits;
  syncHud();
  showPanel("title");
  requestAnimationFrame(frame);
})();
