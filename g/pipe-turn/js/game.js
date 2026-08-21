(() => {
  "use strict";

  const N = 1, E = 2, S = 4, W = 8;
  const BIT = [N, E, S, W];
  const DC = [0, 1, 0, -1];
  const DR = [-1, 0, 1, 0];
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-pipe-turn-mute";
  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function lerpCol(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }
  function rgb(c, a) {
    return a == null ? "rgb(" + c.r + "," + c.g + "," + c.b + ")" : "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function maskOf(kind, rot) {
    rot = rot & 3;
    if (kind === "I") return (rot & 1) ? (N | S) : (E | W);
    if (kind === "L") return [N | E, E | S, S | W, W | N][rot];
    if (kind === "T") return [E | S | W, S | W | N, W | N | E, N | E | S][rot];
    if (kind === "X") return N | E | S | W;
    return 0;
  }
  function parseCell(s) {
    if (!s || s === ".." || s === ".") return { kind: ".", rot: 0, lock: false };
    let lock = false;
    if (s.charAt(0) === "*") {
      lock = true;
      s = s.slice(1);
    }
    return { kind: s.charAt(0), rot: (s.charCodeAt(1) - 48) & 3, lock: lock };
  }

  const STAGES = [
    {
      name: "直通",
      sub: "LINE",
      hint: "点管子转 90°，接通左右再放水",
      delay: 14,
      flow: 1.45,
      cols: 5,
      rows: 3,
      inlet: { c: 0, r: 1, dir: 3 },
      outlet: { c: 4, r: 1, dir: 1 },
      map: [
        "..", "..", "..", "..", "..",
        "I0", "I0", "I0", "I0", "I0",
        "..", "..", "..", "..", ".."
      ],
      spin: [
        0, 0, 0, 0, 0,
        1, 1, 0, 1, 1,
        0, 0, 0, 0, 0
      ]
    },
    {
      name: "折角",
      sub: "BEND",
      hint: "弯头要对准来水方向",
      delay: 12,
      flow: 1.5,
      cols: 5,
      rows: 3,
      inlet: { c: 0, r: 1, dir: 3 },
      outlet: { c: 4, r: 2, dir: 1 },
      map: [
        "..", "..", "..", "..", "..",
        "*I0", "I0", "L2", "..", "..",
        "..", "..", "L0", "I0", "I0"
      ],
      spin: [
        0, 0, 0, 0, 0,
        0, 1, 1, 0, 0,
        0, 0, 2, 1, 1
      ]
    },
    {
      name: "回弯",
      sub: "SNAKE",
      hint: "S 弯。先转远端，水阀快开了",
      delay: 11,
      flow: 1.6,
      cols: 5,
      rows: 3,
      inlet: { c: 0, r: 0, dir: 3 },
      outlet: { c: 4, r: 2, dir: 1 },
      map: [
        "*I0", "I0", "L2", "..", "..",
        "..", "..", "L0", "I0", "L2",
        "..", "..", "..", "..", "L0"
      ],
      spin: [
        0, 1, 3, 0, 0,
        0, 0, 1, 1, 2,
        0, 0, 0, 0, 2
      ]
    },
    {
      name: "分流",
      sub: "FORK",
      hint: "三通会分水。三条口都要接上，否则泄漏",
      delay: 10,
      flow: 1.7,
      cols: 4,
      rows: 2,
      inlet: { c: 0, r: 0, dir: 3 },
      outlet: { c: 3, r: 0, dir: 1 },
      map: [
        "I0", "T0", "T0", "I0",
        "..", "L0", "L3", ".."
      ],
      spin: [
        1, 1, 2, 1,
        0, 2, 1, 0
      ]
    },
    {
      name: "井字",
      sub: "CROSS",
      hint: "十字管四口都要接上。中心已锁",
      delay: 9,
      flow: 1.8,
      cols: 3,
      rows: 3,
      inlet: { c: 0, r: 1, dir: 3 },
      outlet: { c: 2, r: 1, dir: 1 },
      map: [
        "L1", "L2", "..",
        "T2", "*X0", "T0",
        "..", "L0", "L3"
      ],
      spin: [
        2, 1, 0,
        1, 0, 2,
        0, 3, 1
      ]
    },
    {
      name: "终管",
      sub: "FINAL",
      hint: "长路。先把弯头转正，再放水",
      delay: 8,
      flow: 1.85,
      cols: 6,
      rows: 4,
      inlet: { c: 0, r: 1, dir: 3 },
      outlet: { c: 5, r: 3, dir: 1 },
      map: [
        "..", "..", "L1", "I0", "L2", "..",
        "*I0", "I0", "L3", "..", "I1", "..",
        "..", "..", "..", "..", "L0", "L2",
        "..", "..", "..", "..", "..", "L0"
      ],
      spin: [
        0, 0, 2, 1, 1, 0,
        0, 1, 1, 0, 0, 0,
        0, 0, 0, 0, 2, 3,
        0, 0, 0, 0, 0, 1
      ]
    }
  ];

  function makeTiles(stage, scrambled) {
    const tiles = [];
    for (let i = 0; i < stage.map.length; i++) {
      const p = parseCell(stage.map[i]);
      const extra = scrambled ? (stage.spin[i] || 0) : 0;
      tiles.push({
        kind: p.kind,
        rot: (p.rot + extra) & 3,
        lock: p.lock,
        fill: 0,
        wet: false,
        entry: -1,
        spin: 0,
        pulse: 0
      });
    }
    return tiles;
  }

  function traceNetwork(stage, tiles) {
    const cols = stage.cols;
    const rows = stage.rows;
    const seen = [];
    const leaks = [];
    let reached = false;
    const start = stage.inlet;
    const si = start.r * cols + start.c;
    const st = tiles[si];
    if (!st || st.kind === ".") {
      return { reached: false, leak: true, leaks: [{ c: start.c, r: start.r, dir: start.dir }], seen: seen };
    }
    if (!(maskOf(st.kind, st.rot) & BIT[start.dir])) {
      return { reached: false, leak: true, leaks: [{ c: start.c, r: start.r, dir: start.dir }], seen: seen };
    }
    const q = [{ c: start.c, r: start.r, from: start.dir }];
    seen[si] = 1;
    while (q.length) {
      const cur = q.shift();
      const t = tiles[cur.r * cols + cur.c];
      const mask = maskOf(t.kind, t.rot);
      for (let i = 0; i < 4; i++) {
        if (!(mask & BIT[i])) continue;
        if (i === cur.from) continue;
        if (cur.c === stage.outlet.c && cur.r === stage.outlet.r && i === stage.outlet.dir) {
          reached = true;
          continue;
        }
        const nc = cur.c + DC[i];
        const nr = cur.r + DR[i];
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) {
          leaks.push({ c: cur.c, r: cur.r, dir: i });
          continue;
        }
        const nb = tiles[nr * cols + nc];
        const oi = (i + 2) & 3;
        if (!nb || nb.kind === "." || !(maskOf(nb.kind, nb.rot) & BIT[oi])) {
          leaks.push({ c: cur.c, r: cur.r, dir: i });
          continue;
        }
        const id = nr * cols + nc;
        if (!seen[id]) {
          seen[id] = 1;
          q.push({ c: nc, r: nr, from: oi });
        }
      }
    }
    return { reached: reached, leak: leaks.length > 0, leaks: leaks, seen: seen };
  }

  if (typeof document === "undefined") {
    let bad = 0;
    STAGES.forEach(function (s, i) {
      if (s.map.length !== s.cols * s.rows) {
        console.error("map size", s.name);
        bad++;
      }
      if (s.spin.length !== s.map.length) {
        console.error("spin size", s.name);
        bad++;
      }
      const solved = makeTiles(s, false);
      const a = traceNetwork(s, solved);
      if (!a.reached || a.leak) {
        console.error("unsolved layout", s.name, "reach=" + a.reached, "leaks=" + a.leaks.length);
        bad++;
      } else {
        console.log("OK", s.name, "cells=" + a.seen.filter(Boolean).length);
      }
      const scram = makeTiles(s, true);
      const b = traceNetwork(s, scram);
      if (b.reached && !b.leak) {
        console.error("already solved when scrambled", s.name);
        bad++;
      }
    });
    if (bad) {
      console.error("pipe-turn maps failed", bad);
      process.exitCode = 1;
    } else {
      console.log("pipe-turn maps ok", STAGES.length);
    }
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
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnFlow = document.getElementById("btn-flow");
  const btnUndo = document.getElementById("btn-undo");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "点管子旋转 · 接通后点「放水」 · 湿管锁定";
  }

  const view = { w: 1, h: 1, dpr: 1 };
  const board = { x: 0, y: 0, cell: 80, ox: 0, oy: 0, cols: 5, rows: 3 };

  const G = {
    mode: "title",
    phase: "wait",
    stage: 0,
    lives: LIVES,
    tiles: [],
    fronts: [],
    undo: [],
    selC: 0,
    selR: 0,
    hoverC: -1,
    hoverR: -1,
    delay: 0,
    t: 0,
    clock: 0,
    phaseT: 0,
    lock: 0,
    shake: 0,
    flash: 0,
    flashRgb: "0,240,255",
    toastT: 0,
    pathOk: false,
    reached: false,
    leaked: false,
    leakAt: null,
    paused: false,
    turns: 0
  };

  const particles = [];
  const motes = [];
  const ripples = [];
  const drops = [];

  const audio = {
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
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
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
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
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
      f.frequency.setValueAtTime(from || 420, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(80, to || 180), t + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    pulse: function (kind) {
      this.ensure();
      if (kind === "rotate") {
        this.beep(520, 0.06, "square", 0.035, 280);
        this.beep(880, 0.05, "sine", 0.03, 440);
      } else if (kind === "select") {
        this.beep(640, 0.03, "sine", 0.02);
      } else if (kind === "deny") {
        this.beep(140, 0.1, "square", 0.04, 80);
      } else if (kind === "ready") {
        this.beep(392, 0.1, "sine", 0.05, 784);
        this.beep(588, 0.16, "triangle", 0.04, 880);
      } else if (kind === "valve") {
        this.noise(0.22, 0.08, 240, 900);
        this.beep(180, 0.28, "sine", 0.07, 420);
      } else if (kind === "fill") {
        this.beep(220 + Math.random() * 80, 0.05, "sine", 0.025, 160);
      } else if (kind === "out") {
        this.beep(660, 0.16, "sine", 0.07, 1320);
        this.beep(880, 0.22, "triangle", 0.05, 1760);
      } else if (kind === "leak") {
        this.noise(0.38, 0.12, 900, 180);
        this.beep(160, 0.28, "sawtooth", 0.06, 70);
      } else if (kind === "win") {
        this.beep(523, 0.16, "sine", 0.09, 784);
        this.beep(659, 0.28, "triangle", 0.07, 1046);
        this.beep(784, 0.4, "sine", 0.05, 1174);
      } else if (kind === "lose") {
        this.beep(196, 0.5, "sawtooth", 0.09, 60);
        this.beep(98, 0.7, "square", 0.05, 40);
      } else if (kind === "start") {
        this.beep(262, 0.14, "sine", 0.07, 392);
        this.beep(392, 0.2, "triangle", 0.05, 523);
      } else if (kind === "tick") {
        this.beep(880, 0.05, "square", 0.03, 440);
      } else if (kind === "undo") {
        this.beep(300, 0.06, "sine", 0.03, 180);
      } else if (kind === "clear") {
        this.beep(440, 0.12, "triangle", 0.06, 880);
        this.beep(660, 0.2, "sine", 0.05, 1320);
      }
    },
    tickDrone: function (flowing, fillN) {
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
      this.drone.frequency.setTargetAtTime(flowing ? 48 + fillN * 6 : 52, t, 0.12);
      this.droneGain.gain.setTargetAtTime(flowing ? 0.02 + fillN * 0.004 : 0.0001, t, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + (Math.random() - 0.5) * spec.j,
        y: spec.y + (Math.random() - 0.5) * spec.j,
        vx: lerp(spec.vx0, spec.vx1, Math.random()),
        vy: lerp(spec.vy0, spec.vy1, Math.random()),
        life: spec.life * (0.7 + Math.random() * 0.45),
        max: spec.life,
        r: lerp(spec.r0, spec.r1, Math.random()),
        col: spec.col
      });
    }
  }

  function ripple(x, y, mag) {
    if (ripples.length > 16) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: mag ? 54 : 40, t: 1, mag: mag });
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.4;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 52; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.2 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.12 + 0.03
      });
    }
  }

  function stageNow() {
    return STAGES[G.stage];
  }

  function tileAt(c, r) {
    const s = stageNow();
    if (c < 0 || r < 0 || c >= s.cols || r >= s.rows) return null;
    return G.tiles[r * s.cols + c];
  }

  function cellCenter(c, r) {
    return {
      x: board.ox + (c + 0.5) * board.cell,
      y: board.oy + (r + 0.5) * board.cell
    };
  }

  function openingPos(c, r, dir, k) {
    const p = cellCenter(c, r);
    const d = board.cell * (k == null ? 0.5 : k);
    return { x: p.x + DC[dir] * d, y: p.y + DR[dir] * d };
  }

  function firstPipe() {
    const s = stageNow();
    let any = null;
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const t = tileAt(c, r);
        if (!t || t.kind === ".") continue;
        if (!any) any = { c: c, r: r };
        if (!t.lock) return { c: c, r: r };
      }
    }
    return any || { c: 0, r: 0 };
  }

  function resize() {
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    canvas.width = Math.max(1, (view.w * view.dpr) | 0);
    canvas.height = Math.max(1, (view.h * view.dpr) | 0);
    canvas.style.width = view.w + "px";
    canvas.style.height = view.h + "px";
    layoutBoard();
  }

  function layoutBoard() {
    const s = stageNow();
    board.cols = s.cols;
    board.rows = s.rows;
    const pad = 18;
    const extra = 0.78;
    const cell = Math.min(
      (view.w - pad * 2) / (s.cols + extra * 2),
      (view.h - pad * 2) / (s.rows + extra * 2)
    );
    board.cell = Math.max(36, cell);
    board.ox = (view.w - s.cols * board.cell) * 0.5;
    board.oy = (view.h - s.rows * board.cell) * 0.5;
    board.x = board.ox - board.cell * extra;
    board.y = board.oy - board.cell * extra;
  }

  function renderPips() {
    let html = "";
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives ? " on" : "";
      const warn = G.lives === 1 && i === 0 ? " warn" : "";
      html += '<i class="pip' + on + warn + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function renderHud() {
    const s = stageNow();
    stageLabel.textContent = "关卡 " + (G.stage + 1) + " / " + STAGES.length + " · " + s.name;
    timeLabel.classList.remove("warn", "flowing");
    if (G.mode !== "play") {
      timeLabel.textContent = "—";
    } else if (G.phase === "wait") {
      const d = Math.max(0, G.delay);
      timeLabel.textContent = "水阀 " + d.toFixed(1) + "s";
      if (d < 3.2) timeLabel.classList.add("warn");
    } else if (G.phase === "flow") {
      timeLabel.textContent = G.pathOk && G.reached ? "出水中" : "放水中";
      timeLabel.classList.add("flowing");
    } else if (G.phase === "clear") {
      timeLabel.textContent = "接通";
    } else if (G.phase === "leak" || G.phase === "deadend") {
      timeLabel.textContent = G.phase === "leak" ? "泄漏" : "断流";
      timeLabel.classList.add("warn");
    } else {
      timeLabel.textContent = "—";
    }
    const canFlow = G.mode === "play" && G.phase === "wait";
    btnFlow.disabled = !canFlow;
    btnFlow.classList.toggle("go", canFlow && G.pathOk);
    btnUndo.disabled = !(G.mode === "play" && G.phase === "wait" && G.undo.length);
    renderPips();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    ovOps.style.display = "";
    if (kind === "title") {
      ovKicker.textContent = "PIPES";
      ovTitle.textContent = "转管";
      ovLead.innerHTML = "旋转管子，让品红的水接到青色出口。<br />水阀会开。湿管不能再转。";
      ovOps.textContent = coarse
        ? "点管旋转 · 点「放水」开阀 · M 静音"
        : "点管旋转 · WASD 选格 · 空格旋转 · F 放水 · Z 撤销 · M 静音";
      ovBtn.textContent = "开阀";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "全线接通";
      ovLead.innerHTML = "六条管路都接到了出口。<br />品红进，青色出。";
      ovOps.textContent = "R 再来一局 · M 静音";
      ovBtn.textContent = "再来一局";
    } else if (kind === "lose") {
      panel.classList.add("lose");
      ovKicker.textContent = "LEAK";
      ovTitle.textContent = "管路崩了";
      ovLead.innerHTML = G.phase === "deadend"
        ? "水流进了死路，到不了出口。"
        : "水从没接上的管口漏了。<br />三命用尽。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再接一次";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function resetRun() {
    G.stage = 0;
    G.lives = LIVES;
    G.turns = 0;
    loadStage(0);
    G.mode = "play";
    hideOverlay();
    audio.pulse("start");
  }

  function loadStage(index, msg, warn) {
    G.stage = index;
    const s = STAGES[index];
    G.tiles = makeTiles(s, true);
    G.fronts = [];
    G.undo = [];
    G.phase = "wait";
    G.delay = s.delay;
    G.phaseT = 0;
    G.lock = 0.2;
    G.reached = false;
    G.leaked = false;
    G.leakAt = null;
    G.pathOk = false;
    G.t = 0;
    const fp = firstPipe();
    G.selC = fp.c;
    G.selR = fp.r;
    particles.length = 0;
    ripples.length = 0;
    drops.length = 0;
    layoutBoard();
    hintEl.textContent = coarse
      ? s.hint + " · 点「放水」开阀"
      : s.hint;
    toast(msg || s.hint, !!warn);
    renderHud();
  }

  function canRotate(c, r) {
    const t = tileAt(c, r);
    if (!t || t.kind === "." || t.lock) return false;
    if (t.wet || t.fill > 0) return false;
    if (G.mode !== "play" || (G.phase !== "wait" && G.phase !== "flow")) return false;
    return true;
  }

  function rotateAt(c, r) {
    if (G.lock > 0) return;
    const t = tileAt(c, r);
    if (!t || t.kind === ".") return;
    if (!canRotate(c, r)) {
      audio.pulse("deny");
      G.shake = 0.18;
      t.pulse = 1;
      return;
    }
    G.undo.push({ c: c, r: r, rot: t.rot });
    if (G.undo.length > 48) G.undo.shift();
    t.rot = (t.rot + 1) & 3;
    t.spin = 1;
    t.pulse = 1;
    G.turns += 1;
    G.selC = c;
    G.selR = r;
    const p = cellCenter(c, r);
    ripple(p.x, p.y, false);
    emit(7, {
      x: p.x, y: p.y, j: 8,
      vx0: -40, vx1: 40, vy0: -40, vy1: 40,
      life: 0.28, r0: 1, r1: 2.2, col: CYN
    });
    audio.pulse("rotate");
    checkPath();
    renderHud();
  }

  function undo() {
    if (G.mode !== "play" || G.phase !== "wait" || !G.undo.length || G.lock > 0) {
      audio.pulse("deny");
      return;
    }
    const u = G.undo.pop();
    const t = tileAt(u.c, u.r);
    if (!t || t.wet || t.fill > 0) return;
    t.rot = u.rot;
    t.spin = -1;
    G.selC = u.c;
    G.selR = u.r;
    audio.pulse("undo");
    checkPath();
    renderHud();
  }

  function checkPath() {
    const net = traceNetwork(stageNow(), G.tiles);
    const ok = net.reached && !net.leak;
    if (ok && !G.pathOk && G.phase === "wait") {
      toast("通路已成 · 可以放水");
      audio.pulse("ready");
      const s = stageNow();
      const o = openingPos(s.outlet.c, s.outlet.r, s.outlet.dir, 0.55);
      ripple(o.x, o.y, false);
    }
    G.pathOk = ok;
    return net;
  }

  function openValve() {
    if (G.mode !== "play" || G.phase !== "wait") return;
    G.phase = "flow";
    G.phaseT = 0;
    G.delay = 0;
    G.undo.length = 0;
    audio.pulse("valve");
    toast(G.pathOk ? "开阀" : "开阀 · 管路未封好", !G.pathOk);
    const s = stageNow();
    const inn = openingPos(s.inlet.c, s.inlet.r, s.inlet.dir, 0.72);
    emit(18, {
      x: inn.x, y: inn.y, j: 10,
      vx0: DC[s.inlet.dir] * -40, vx1: DC[s.inlet.dir] * 80,
      vy0: DR[s.inlet.dir] * -40, vy1: DR[s.inlet.dir] * 80,
      life: 0.45, r0: 1.2, r1: 3.2, col: MAG
    });
    const start = s.inlet;
    const t = tileAt(start.c, start.r);
    if (!t || t.kind === "." || !(maskOf(t.kind, t.rot) & BIT[start.dir])) {
      beginLeak(start.c, start.r, start.dir);
      renderHud();
      return;
    }
    t.entry = start.dir;
    G.fronts.push({ c: start.c, r: start.r, from: start.dir, t: 0, done: false });
    renderHud();
  }

  function beginLeak(c, r, dir) {
    G.phase = "leak";
    G.leaked = true;
    G.phaseT = 0;
    G.leakAt = { c: c, r: r, dir: dir };
    G.flash = 0.55;
    G.flashRgb = "255,61,184";
    G.shake = 0.42;
    audio.pulse("leak");
    toast("泄漏", true);
    const p = openingPos(c, r, dir, 0.48);
    emit(28, {
      x: p.x, y: p.y, j: 6,
      vx0: DC[dir] * 40 - 70, vx1: DC[dir] * 160 + 70,
      vy0: DR[dir] * 40 - 70, vy1: DR[dir] * 160 + 70,
      life: 0.7, r0: 1.4, r1: 3.6, col: MAG
    });
    ripple(p.x, p.y, true);
    renderHud();
  }

  function beginDead() {
    G.phase = "deadend";
    G.phaseT = 0;
    G.flash = 0.4;
    G.flashRgb = "255,61,184";
    audio.pulse("leak");
    toast("断流", true);
    renderHud();
  }

  function beginClear() {
    G.phase = "clear";
    G.phaseT = 0;
    G.flash = 0.45;
    G.flashRgb = "0,240,255";
    audio.pulse("clear");
    toast("接通");
    const s = stageNow();
    const o = openingPos(s.outlet.c, s.outlet.r, s.outlet.dir, 0.62);
    emit(26, {
      x: o.x, y: o.y, j: 8,
      vx0: -90, vx1: 90, vy0: -90, vy1: 90,
      life: 0.7, r0: 1.4, r1: 3.4, col: CYN
    });
    ripple(o.x, o.y, false);
    renderHud();
  }

  function failOrRetry() {
    G.lives -= 1;
    renderPips();
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.pulse("lose");
      showOverlay("lose");
      return;
    }
    loadStage(G.stage, "泄漏 −1 命 · 重接本关", true);
  }

  function winOrNext() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      audio.pulse("win");
      showOverlay("win");
      return;
    }
    loadStage(G.stage + 1);
  }

  function moveSel(dc, dr) {
    const s = stageNow();
    let c = G.selC + dc;
    let r = G.selR + dr;
    for (let i = 0; i < 8; i++) {
      if (c < 0 || r < 0 || c >= s.cols || r >= s.rows) return;
      const t = tileAt(c, r);
      if (t && t.kind !== ".") {
        G.selC = c;
        G.selR = r;
        audio.pulse("select");
        return;
      }
      c += dc;
      r += dr;
    }
  }

  function hitCell(cssX, cssY) {
    const c = Math.floor((cssX - board.ox) / board.cell);
    const r = Math.floor((cssY - board.oy) / board.cell);
    const t = tileAt(c, r);
    if (!t || t.kind === ".") return null;
    return { c: c, r: r };
  }

  function eventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches && e.touches[0] ? e.touches[0] : e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function stepFronts(dt) {
    if (G.phase !== "flow") return;
    const s = stageNow();
    const speed = s.flow;
    let spawned = false;
    for (let i = 0; i < G.fronts.length; i++) {
      const f = G.fronts[i];
      if (f.done) continue;
      const t = tileAt(f.c, f.r);
      if (!t) continue;
      const prev = f.t;
      f.t += dt * speed;
      t.fill = Math.max(t.fill, clamp(f.t, 0, 1));
      t.entry = f.from;
      if (f.t >= 0.52 && prev < 0.52 && Math.random() < 0.7) {
        const p = cellCenter(f.c, f.r);
        emit(3, {
          x: p.x, y: p.y, j: 4,
          vx0: -20, vx1: 20, vy0: -20, vy1: 20,
          life: 0.3, r0: 1, r1: 2, col: lerpCol(MAG, CYN, 0.45)
        });
      }
      if (f.t < 1) continue;
      f.done = true;
      t.wet = true;
      t.fill = 1;
      const mask = maskOf(t.kind, t.rot);
      for (let d = 0; d < 4; d++) {
        if (!(mask & BIT[d])) continue;
        if (d === f.from) continue;
        if (f.c === s.outlet.c && f.r === s.outlet.r && d === s.outlet.dir) {
          if (!G.reached) {
            G.reached = true;
            audio.pulse("out");
            const o = openingPos(f.c, f.r, d, 0.58);
            emit(14, {
              x: o.x, y: o.y, j: 6,
              vx0: DC[d] * 20 - 50, vx1: DC[d] * 90 + 50,
              vy0: DR[d] * 20 - 50, vy1: DR[d] * 90 + 50,
              life: 0.5, r0: 1.2, r1: 3, col: CYN
            });
          }
          continue;
        }
        const nc = f.c + DC[d];
        const nr = f.r + DR[d];
        const nb = tileAt(nc, nr);
        const oi = (d + 2) & 3;
        if (!nb || nb.kind === "." || !(maskOf(nb.kind, nb.rot) & BIT[oi])) {
          beginLeak(f.c, f.r, d);
          return;
        }
        if (nb.fill > 0 || nb.wet) continue;
        nb.entry = oi;
        G.fronts.push({ c: nc, r: nr, from: oi, t: 0, done: false });
        spawned = true;
        audio.pulse("fill");
      }
    }
    if (G.phase !== "flow") return;
    let pending = false;
    for (let i = 0; i < G.fronts.length; i++) {
      if (!G.fronts[i].done) pending = true;
    }
    if (!pending && !spawned) {
      if (G.reached) beginClear();
      else beginDead();
    }
  }

  function stepFx(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    for (let i = 0; i < G.tiles.length; i++) {
      const t = G.tiles[i];
      if (t.spin > 0) t.spin = Math.max(0, t.spin - dt / 0.12);
      else if (t.spin < 0) t.spin = Math.min(0, t.spin + dt / 0.12);
      if (t.pulse > 0) t.pulse = Math.max(0, t.pulse - dt / 0.18);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vy += 18 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.8;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.t += dt;
      if (d.t > d.life) drops.splice(i, 1);
    }
    if (G.phase === "flow" && Math.random() < dt * 8) {
      const live = G.fronts.filter(function (f) { return !f.done; });
      if (live.length) {
        const f = live[(Math.random() * live.length) | 0];
        const t = tileAt(f.c, f.r);
        if (t) {
          const p = cellCenter(f.c, f.r);
          drops.push({
            x: p.x + (Math.random() - 0.5) * board.cell * 0.2,
            y: p.y + (Math.random() - 0.5) * board.cell * 0.2,
            t: 0,
            life: 0.4 + Math.random() * 0.3,
            r: 1.2 + Math.random() * 1.6
          });
        }
      }
    }
  }

  function tick(dt) {
    if (G.paused || G.mode !== "play") {
      audio.tickDrone(false, 0);
      stepFx(dt);
      return;
    }
    if (G.phase === "wait") {
      const prev = G.delay;
      G.delay -= dt;
      if (G.delay < 3.05 && prev >= 3.05) audio.pulse("tick");
      if (G.delay < 2.05 && prev >= 2.05) audio.pulse("tick");
      if (G.delay < 1.05 && prev >= 1.05) audio.pulse("tick");
      if (G.delay <= 0) {
        G.delay = 0;
        openValve();
      }
      checkPath();
    } else if (G.phase === "flow") {
      stepFronts(dt);
    } else if (G.phase === "clear") {
      G.phaseT += dt;
      if (G.phaseT > 1.15) winOrNext();
    } else if (G.phase === "leak" || G.phase === "deadend") {
      G.phaseT += dt;
      if (G.phaseT > 1.05) failOrRetry();
    }
    let fillN = 0;
    for (let i = 0; i < G.tiles.length; i++) if (G.tiles[i].fill > 0) fillN++;
    audio.tickDrone(G.phase === "flow", fillN);
    stepFx(dt);
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) renderHud();
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

  function drawArm(cx, cy, dir, len, width, color, cap) {
    const x2 = cx + DC[dir] * len;
    const y2 = cy + DR[dir] * len;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = cap || "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function waterAmt(t, dir) {
    const f = t.fill;
    if (f <= 0) return 0;
    if (t.wet || f >= 1) return 1;
    if (dir === t.entry) return clamp(f / 0.48, 0, 1);
    if (f < 0.5) return 0;
    return clamp((f - 0.5) / 0.5, 0, 1);
  }

  function drawPort(c, r, dir, inlet) {
    const edge = openingPos(c, r, dir, 0.5);
    const far = openingPos(c, r, dir, 0.86);
    const col = inlet ? MAG : CYN;
    const pulse = 0.6 + Math.sin(G.t * (inlet ? 5.2 : 4.4) + (inlet ? 0 : 1)) * 0.4;
    ctx.save();
    ctx.strokeStyle = rgb(col, 0.28 + pulse * 0.35);
    ctx.lineWidth = board.cell * 0.16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(edge.x, edge.y);
    ctx.lineTo(far.x, far.y);
    ctx.stroke();
    ctx.strokeStyle = rgb(col, 0.85);
    ctx.lineWidth = board.cell * 0.08;
    ctx.stroke();
    ctx.fillStyle = rgb(col, 0.9);
    ctx.beginPath();
    ctx.arc(far.x, far.y, board.cell * 0.11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgb(col, 0.18 + pulse * 0.2);
    ctx.beginPath();
    ctx.arc(far.x, far.y, board.cell * (0.18 + pulse * 0.06), 0, TAU);
    ctx.fill();
    if (inlet && G.phase === "wait") {
      const drip = (G.t * 1.4) % 1;
      ctx.fillStyle = rgb(MAG, 0.55 * (1 - drip));
      ctx.beginPath();
      ctx.arc(
        lerp(far.x, edge.x, 0.2),
        lerp(far.y, edge.y, 0.2) + drip * 10,
        2.2,
        0,
        TAU
      );
      ctx.fill();
    }
    if (!inlet && G.pathOk && G.phase === "wait") {
      ctx.strokeStyle = rgb(CYN, 0.45);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(far.x, far.y, board.cell * 0.22 + pulse * 3, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    const label = inlet ? "进" : "出";
    ctx.font = "600 " + Math.max(10, board.cell * 0.16) + "px 'PingFang SC','Noto Sans SC',sans-serif";
    ctx.fillStyle = rgb(col, 0.85);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lx = far.x + DC[dir] * board.cell * 0.22;
    const ly = far.y + DR[dir] * board.cell * 0.22;
    ctx.fillText(label, lx, ly);
  }

  function drawTile(c, r) {
    const t = tileAt(c, r);
    if (!t || t.kind === ".") return;
    const p = cellCenter(c, r);
    const cell = board.cell;
    const well = cell * 0.9;
    const x = p.x - well / 2;
    const y = p.y - well / 2;
    const rad = cell * 0.16;
    const selected = G.selC === c && G.selR === r && G.mode === "play";
    const hover = G.hoverC === c && G.hoverR === r;
    const scale = 1 + t.pulse * 0.05;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.translate(-p.x, -p.y);

    ctx.fillStyle = t.wet ? "rgba(0, 40, 48, 0.7)" : "rgba(10, 8, 22, 0.72)";
    roundRect(x, y, well, well, rad);
    ctx.fill();
    ctx.strokeStyle = t.lock
      ? "rgba(255, 227, 107, 0.45)"
      : t.wet
        ? "rgba(0, 240, 255, 0.28)"
        : "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = t.lock ? 1.6 : 1;
    ctx.stroke();

    if (selected) {
      const a = 0.45 + Math.sin(G.t * 6) * 0.2;
      ctx.strokeStyle = rgb(CYN, a);
      ctx.lineWidth = 2.2;
      roundRect(x + 2, y + 2, well - 4, well - 4, rad - 2);
      ctx.stroke();
    } else if (hover) {
      ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
      ctx.lineWidth = 1.4;
      roundRect(x + 2, y + 2, well - 4, well - 4, rad - 2);
      ctx.stroke();
    }

    const mask = maskOf(t.kind, t.rot);
    const thick = cell * 0.3;
    const inner = cell * 0.16;
    const len = cell * 0.48;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-t.spin * Math.PI / 2);
    ctx.translate(-p.x, -p.y);

    for (let d = 0; d < 4; d++) {
      if (!(mask & BIT[d])) continue;
      drawArm(p.x, p.y, d, len, thick, "rgba(22, 18, 40, 0.95)", "round");
    }
    ctx.fillStyle = "rgba(22, 18, 40, 0.95)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, thick * 0.52, 0, TAU);
    ctx.fill();

    for (let d = 0; d < 4; d++) {
      if (!(mask & BIT[d])) continue;
      drawArm(p.x, p.y, d, len, inner + 4, "rgba(70, 64, 110, 0.9)", "round");
    }
    ctx.fillStyle = "rgba(70, 64, 110, 0.9)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, (inner + 4) * 0.52, 0, TAU);
    ctx.fill();

    const hue = clamp((Math.abs(c - stageNow().inlet.c) + Math.abs(r - stageNow().inlet.r)) / (stageNow().cols + stageNow().rows - 1), 0, 1);
    const idle = t.fill > 0 ? lerpCol(MAG, CYN, 0.18 + hue * 0.82) : null;
    for (let d = 0; d < 4; d++) {
      if (!(mask & BIT[d])) continue;
      const amt = waterAmt(t, d);
      if (amt <= 0.01) {
        drawArm(p.x, p.y, d, len * 0.92, inner * 0.55, "rgba(255, 61, 184, 0.14)", "round");
        continue;
      }
      const col = idle;
      const wlen = dirFillLen(t, d, amt, len);
      const fromC = dirFromCenter(t, d);
      if (fromC) {
        drawArm(p.x, p.y, d, wlen, inner * 0.72, rgb(col, 0.95), "round");
      } else {
        const edge = openingPos(c, r, d, 0.48);
        ctx.strokeStyle = rgb(col, 0.95);
        ctx.lineWidth = inner * 0.72;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(edge.x, edge.y);
        ctx.lineTo(p.x + DC[d] * (len * (1 - amt)), p.y + DR[d] * (len * (1 - amt)));
        ctx.stroke();
      }
    }
    if (t.fill > 0.42 || t.wet) {
      const col = idle || CYN;
      const glow = t.wet ? 0.95 : clamp((t.fill - 0.42) / 0.2, 0, 1);
      ctx.fillStyle = rgb(col, 0.95 * glow);
      ctx.beginPath();
      ctx.arc(p.x, p.y, inner * 0.42, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgb(col, 0.18 * glow);
      ctx.beginPath();
      ctx.arc(p.x, p.y, inner * 0.9, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255, 61, 184, 0.16)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, inner * 0.28, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    if (t.lock) {
      ctx.fillStyle = rgb(GOLD, 0.85);
      const b = cell * 0.07;
      ctx.fillRect(x + 6, y + 6, b, 2);
      ctx.fillRect(x + 6, y + 6, 2, b);
      ctx.fillRect(x + well - 6 - b, y + 6, b, 2);
      ctx.fillRect(x + well - 8, y + 6, 2, b);
      ctx.fillRect(x + 6, y + well - 8, b, 2);
      ctx.fillRect(x + 6, y + well - 6 - b, 2, b);
      ctx.fillRect(x + well - 6 - b, y + well - 8, b, 2);
      ctx.fillRect(x + well - 8, y + well - 6 - b, 2, b);
    }
    ctx.restore();
  }

  function dirFromCenter(t, dir) {
    if (t.wet || t.fill >= 1) return true;
    if (dir === t.entry) return false;
    return t.fill >= 0.5;
  }

  function dirFillLen(t, dir, amt, len) {
    if (t.wet || t.fill >= 1) return len;
    if (dir === t.entry) return len * amt;
    return len * amt;
  }

  function drawFronts() {
    if (G.phase !== "flow") return;
    for (let i = 0; i < G.fronts.length; i++) {
      const f = G.fronts[i];
      if (f.done) continue;
      const t = tileAt(f.c, f.r);
      if (!t) continue;
      const p = cellCenter(f.c, f.r);
      const len = board.cell * 0.48;
      let x, y;
      if (f.t < 0.48) {
        const k = f.t / 0.48;
        const edge = openingPos(f.c, f.r, f.from, 0.48);
        x = lerp(edge.x, p.x, k);
        y = lerp(edge.y, p.y, k);
      } else {
        const outs = [];
        const mask = maskOf(t.kind, t.rot);
        for (let d = 0; d < 4; d++) if ((mask & BIT[d]) && d !== f.from) outs.push(d);
        const k = clamp((f.t - 0.48) / 0.52, 0, 1);
        const d = outs[0] != null ? outs[0] : f.from;
        x = p.x + DC[d] * len * k;
        y = p.y + DR[d] * len * k;
      }
      ctx.fillStyle = rgb(CYN, 0.95);
      ctx.shadowColor = rgb(MAG, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3.2, board.cell * 0.055), 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function draw() {
    const w = view.w;
    const h = view.h;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, w, h);

    const g1 = ctx.createRadialGradient(w * 0.18, h * 0.08, 20, w * 0.18, h * 0.08, w * 0.55);
    g1.addColorStop(0, "rgba(255, 61, 184, 0.14)");
    g1.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createRadialGradient(w * 0.88, h * 0.12, 20, w * 0.88, h * 0.12, w * 0.5);
    g2.addColorStop(0, "rgba(0, 240, 255, 0.1)");
    g2.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = ((m.x + G.t * m.s * 0.02) % 1) * w;
      const my = ((m.y + Math.sin(G.t * 0.3 + m.p) * 0.03) % 1 + 1) % 1 * h;
      ctx.fillStyle = "rgba(200, 210, 255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, TAU);
      ctx.fill();
    }

    let sx = 0;
    let sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * 10 * G.shake;
      sy = (Math.random() - 0.5) * 10 * G.shake;
    }
    ctx.save();
    ctx.translate(sx, sy);

    const s = stageNow();
    const bw = s.cols * board.cell;
    const bh = s.rows * board.cell;
    const pad = board.cell * 0.55;
    ctx.fillStyle = "rgba(8, 6, 18, 0.55)";
    roundRect(board.ox - pad, board.oy - pad, bw + pad * 2, bh + pad * 2, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const t = tileAt(c, r);
        if (t && t.kind !== ".") continue;
        const p = cellCenter(c, r);
        const well = board.cell * 0.86;
        ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
        roundRect(p.x - well / 2, p.y - well / 2, well, well, board.cell * 0.14);
        ctx.fill();
      }
    }

    drawPort(s.inlet.c, s.inlet.r, s.inlet.dir, true);
    drawPort(s.outlet.c, s.outlet.r, s.outlet.dir, false);

    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) drawTile(c, r);
    }

    drawFronts();

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      const a = 1 - d.t / d.life;
      ctx.fillStyle = rgb(CYN, 0.55 * a);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * a, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < ripples.length; i++) {
      const rp = ripples[i];
      const a = rp.t;
      ctx.strokeStyle = rp.mag ? rgb(MAG, 0.5 * a) : rgb(CYN, 0.5 * a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, lerp(8, rp.max, 1 - rp.t), 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgb(p.col, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.4), 0, TAU);
      ctx.fill();
    }

    if (G.phase === "wait" && G.delay < 3.4 && G.mode === "play") {
      const n = Math.ceil(G.delay);
      if (n > 0) {
        ctx.font = "900 " + Math.max(42, board.cell * 0.7) + "px 'Segoe UI',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = rgb(MAG, 0.18 + (n === 1 ? 0.2 : 0));
        ctx.fillText(String(n), view.w / 2, view.h / 2);
      }
    }

    if (G.leakAt && (G.phase === "leak")) {
      const p = openingPos(G.leakAt.c, G.leakAt.r, G.leakAt.dir, 0.5);
      const burst = 10 + (1 - Math.min(1, G.phaseT * 2)) * 18;
      ctx.strokeStyle = rgb(MAG, 0.45);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, burst, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = "rgba(" + G.flashRgb + "," + (G.flash * 0.18) + ")";
      ctx.fillRect(0, 0, w, h);
    }
  }

  function onKey(e) {
    const key = e.key;
    if (key === "m" || key === "M") {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (key === "r" || key === "R") {
      e.preventDefault();
      audio.ensure();
      resetRun();
      return;
    }
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (key === " " || key === "Enter") {
        e.preventDefault();
        audio.ensure();
        resetRun();
      }
      return;
    }
    if (G.mode !== "play") return;
    if (key === "f" || key === "F") {
      e.preventDefault();
      audio.ensure();
      openValve();
      return;
    }
    if (key === "z" || key === "Z") {
      e.preventDefault();
      undo();
      return;
    }
    if (key === " " || key === "Enter") {
      e.preventDefault();
      rotateAt(G.selC, G.selR);
      return;
    }
    const k = key.toLowerCase();
    if (key === "ArrowUp" || k === "w") { e.preventDefault(); moveSel(0, -1); }
    else if (key === "ArrowDown" || k === "s") { e.preventDefault(); moveSel(0, 1); }
    else if (key === "ArrowLeft" || k === "a") { e.preventDefault(); moveSel(-1, 0); }
    else if (key === "ArrowRight" || k === "d") { e.preventDefault(); moveSel(1, 0); }
  }

  function onPointer(e) {
    if (e.target.closest && e.target.closest("button")) return;
    if (G.mode !== "play") return;
    const p = eventPos(e);
    const hit = hitCell(p.x, p.y);
    if (!hit) return;
    e.preventDefault();
    audio.ensure();
    rotateAt(hit.c, hit.r);
  }

  function onMove(e) {
    if (G.mode !== "play") return;
    const p = eventPos(e);
    const hit = hitCell(p.x, p.y);
    if (hit) {
      G.hoverC = hit.c;
      G.hoverR = hit.r;
    } else {
      G.hoverC = -1;
      G.hoverR = -1;
    }
  }

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    resetRun();
  });
  btnFlow.addEventListener("click", function () {
    audio.ensure();
    openValve();
  });
  btnUndo.addEventListener("click", function () {
    audio.ensure();
    undo();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    resetRun();
  });

  canvas.addEventListener("pointerdown", onPointer);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", function () {
    G.hoverC = -1;
    G.hoverR = -1;
  });
  window.addEventListener("keydown", onKey, { passive: false });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (G.paused) audio.tickDrone(false, 0);
  });

  makeMotes();
  G.tiles = makeTiles(STAGES[0], true);
  resize();
  renderHud();
  showOverlay("title");

  let last = 0;
  let acc = 0;
  function frame(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    while (acc >= STEP) {
      tick(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
