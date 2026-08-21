(() => {
  "use strict";

  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-fold-path-mute";
  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK_DIM = { r: 92, g: 64, b: 140 };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  function rgb(c, a) {
    return a == null
      ? "rgb(" + c.r + "," + c.g + "," + c.b + ")"
      : "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }
  function hash(n) {
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function cloneCell(a) {
    return { ink: a.ink, s: a.s, e: a.e };
  }
  function unionCell(a, b) {
    return { ink: a.ink | b.ink, s: a.s | b.s, e: a.e | b.e };
  }

  const STAGES = [
    {
      name: "对折",
      sub: "HALF",
      hint: "点中间虚线，把一页折到另一页",
      time: 24,
      folds: 1,
      map: ["S#..", "..#E"],
      creases: [{ axis: 0, at: 1 }]
    },
    {
      name: "横折",
      sub: "CREASE",
      hint: "沿横虚线对折",
      time: 22,
      folds: 1,
      map: ["S#..", "#...", ".##E", "...."],
      creases: [{ axis: 1, at: 1 }]
    },
    {
      name: "折翼",
      sub: "FLAP",
      hint: "窄边才折得上，把右翼折过来",
      time: 20,
      folds: 1,
      map: ["S#...", "...#E", "#...."],
      creases: [{ axis: 0, at: 2 }]
    },
    {
      name: "双折",
      sub: "TWICE",
      hint: "要折两次：底边和右缘",
      time: 26,
      folds: 2,
      map: ["S#...", ".....", "###.E"],
      creases: [{ axis: 0, at: 3 }, { axis: 1, at: 1 }]
    },
    {
      name: "诱痕",
      sub: "BAIT",
      hint: "中间那条是诱痕，折靠右的一条",
      time: 18,
      folds: 1,
      map: ["S##...", "..#...", "....#E"],
      creases: [{ axis: 0, at: 2 }, { axis: 0, at: 3 }],
      bait: { axis: 0, at: 2 }
    },
    {
      name: "终纸",
      sub: "ORIGAMI",
      hint: "底边与右翼各一折",
      time: 28,
      folds: 2,
      map: ["S#....", ".##...", "......", "#...#E"],
      creases: [{ axis: 1, at: 2 }, { axis: 0, at: 3 }]
    }
  ];

  function parseMap(map) {
    const rows = map.length;
    const cols = map[0].length;
    const cells = [];
    let s = 0;
    let e = 0;
    for (let r = 0; r < rows; r++) {
      if (map[r].length !== cols) throw new Error("ragged " + map[r]);
      for (let c = 0; c < cols; c++) {
        const ch = map[r][c];
        const cell = { ink: 0, s: 0, e: 0 };
        if (ch === "#") cell.ink = 1;
        else if (ch === "S") {
          cell.ink = 1;
          cell.s = 1;
          s++;
        } else if (ch === "E") {
          cell.ink = 1;
          cell.e = 1;
          e++;
        } else if (ch !== ".") throw new Error("bad " + ch);
        cells.push(cell);
      }
    }
    if (s !== 1 || e !== 1) throw new Error("need one S and one E");
    return { cols: cols, rows: rows, cells: cells };
  }

  function makeState(stage) {
    const g = parseMap(stage.map);
    return {
      cols: g.cols,
      rows: g.rows,
      cells: g.cells,
      creases: stage.creases.map(function (c) {
        return { axis: c.axis, at: c.at };
      })
    };
  }

  function cloneState(s) {
    return {
      cols: s.cols,
      rows: s.rows,
      cells: s.cells.map(cloneCell),
      creases: s.creases.map(function (c) {
        return { axis: c.axis, at: c.at };
      })
    };
  }

  function foldGrid(state, axis, at, dir) {
    const cols = state.cols;
    const rows = state.rows;
    const cells = state.cells;
    if (axis === 0) {
      const leftW = at + 1;
      const rightW = cols - leftW;
      if (dir === 0) {
        if (leftW > rightW) return null;
        const nC = rightW;
        const next = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < nC; c++) next.push(cloneCell(cells[r * cols + (c + leftW)]));
        }
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < leftW; c++) {
            const dest = leftW - 1 - c;
            const i = r * nC + dest;
            next[i] = unionCell(next[i], cells[r * cols + c]);
          }
        }
        return { cols: nC, rows: rows, cells: next };
      }
      if (rightW > leftW) return null;
      const nC = leftW;
      const next = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < nC; c++) next.push(cloneCell(cells[r * cols + c]));
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < rightW; c++) {
          const dest = at - c;
          const i = r * nC + dest;
          next[i] = unionCell(next[i], cells[r * cols + (leftW + c)]);
        }
      }
      return { cols: nC, rows: rows, cells: next };
    }
    const topH = at + 1;
    const botH = rows - topH;
    if (dir === 0) {
      if (topH > botH) return null;
      const nR = botH;
      const next = [];
      for (let r = 0; r < nR; r++) {
        for (let c = 0; c < cols; c++) next.push(cloneCell(cells[(r + topH) * cols + c]));
      }
      for (let r = 0; r < topH; r++) {
        const dest = topH - 1 - r;
        for (let c = 0; c < cols; c++) {
          const i = dest * cols + c;
          next[i] = unionCell(next[i], cells[r * cols + c]);
        }
      }
      return { cols: cols, rows: nR, cells: next };
    }
    if (botH > topH) return null;
    const nR = topH;
    const next = [];
    for (let r = 0; r < nR; r++) {
      for (let c = 0; c < cols; c++) next.push(cloneCell(cells[r * cols + c]));
    }
    for (let r = 0; r < botH; r++) {
      const dest = at - r;
      for (let c = 0; c < cols; c++) {
        const i = dest * cols + c;
        next[i] = unionCell(next[i], cells[(topH + r) * cols + c]);
      }
    }
    return { cols: cols, rows: nR, cells: next };
  }

  function shiftCreases(creases, axis, at, dir, cols, rows) {
    const left = at + 1;
    const newN = dir === 0
      ? (axis === 0 ? cols : rows) - left
      : left;
    const next = [];
    for (let i = 0; i < creases.length; i++) {
      const cr = creases[i];
      if (cr.axis !== axis) {
        next.push({ axis: cr.axis, at: cr.at });
        continue;
      }
      let nat = -1;
      if (dir === 0) {
        if (cr.at > at) nat = cr.at - left;
      } else if (cr.at < at) nat = cr.at;
      if (nat >= 0 && nat < newN - 1) next.push({ axis: cr.axis, at: nat });
    }
    return next;
  }

  function foldState(state, axis, at, dir) {
    const grid = foldGrid(state, axis, at, dir);
    if (!grid) return null;
    return {
      cols: grid.cols,
      rows: grid.rows,
      cells: grid.cells,
      creases: shiftCreases(state.creases, axis, at, dir, state.cols, state.rows)
    };
  }

  function dirsFor(state, cr) {
    const n = cr.axis === 0 ? state.cols : state.rows;
    if (cr.at < 0 || cr.at >= n - 1) return [];
    const low = cr.at + 1;
    const high = n - low;
    const d = [];
    if (low <= high) d.push(0);
    if (high <= low) d.push(1);
    return d;
  }

  function hasSE(state) {
    let s = 0;
    let e = 0;
    for (let i = 0; i < state.cells.length; i++) {
      if (state.cells[i].s) s = 1;
      if (state.cells[i].e) e = 1;
    }
    return !!(s && e);
  }

  function flood(state, pred) {
    const cols = state.cols;
    const rows = state.rows;
    const cells = state.cells;
    const seen = [];
    const q = [];
    for (let i = 0; i < cells.length; i++) {
      if (pred(cells[i])) {
        seen[i] = 1;
        q.push(i);
      }
    }
    const dc = [1, -1, 0, 0];
    const dr = [0, 0, 1, -1];
    while (q.length) {
      const i = q.pop();
      const c = i % cols;
      const r = (i / cols) | 0;
      for (let k = 0; k < 4; k++) {
        const nc = c + dc[k];
        const nr = r + dr[k];
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const j = nr * cols + nc;
        if (seen[j] || !cells[j].ink) continue;
        seen[j] = 1;
        q.push(j);
      }
    }
    return seen;
  }

  function connected(state) {
    if (!hasSE(state)) return false;
    const fromS = flood(state, function (c) { return c.s; });
    for (let i = 0; i < state.cells.length; i++) {
      if (state.cells[i].e && fromS[i]) return true;
    }
    return false;
  }

  function shortestPath(state) {
    const cols = state.cols;
    const rows = state.rows;
    const cells = state.cells;
    const q = [];
    const prev = [];
    const seen = [];
    for (let i = 0; i < cells.length; i++) {
      prev[i] = -1;
      if (cells[i].s) {
        seen[i] = 1;
        q.push(i);
      }
    }
    const dc = [1, -1, 0, 0];
    const dr = [0, 0, 1, -1];
    let hit = -1;
    let qi = 0;
    while (qi < q.length) {
      const i = q[qi++];
      if (cells[i].e) {
        hit = i;
        break;
      }
      const c = i % cols;
      const r = (i / cols) | 0;
      for (let k = 0; k < 4; k++) {
        const nc = c + dc[k];
        const nr = r + dr[k];
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const j = nr * cols + nc;
        if (seen[j] || !cells[j].ink) continue;
        seen[j] = 1;
        prev[j] = i;
        q.push(j);
      }
    }
    if (hit < 0) return [];
    const path = [];
    for (let i = hit; i >= 0; i = prev[i]) path.push(i);
    path.reverse();
    return path;
  }

  function keyOf(state) {
    let s = state.cols + "x" + state.rows + "|";
    for (let i = 0; i < state.cells.length; i++) {
      const c = state.cells[i];
      s += c.s ? "S" : c.e ? "E" : c.ink ? "#" : ".";
    }
    s += "|";
    for (let i = 0; i < state.creases.length; i++) {
      s += state.creases[i].axis + ":" + state.creases[i].at + ",";
    }
    return s;
  }

  function solve(stage) {
    const start = makeState(stage);
    if (connected(start)) return { error: "already", wins: [] };
    const q = [{ state: start, path: [] }];
    const seen = {};
    seen[keyOf(start)] = 1;
    const wins = [];
    while (q.length) {
      const cur = q.shift();
      if (cur.path.length >= stage.folds) continue;
      for (let i = 0; i < cur.state.creases.length; i++) {
        const cr = cur.state.creases[i];
        const dirs = dirsFor(cur.state, cr);
        for (let d = 0; d < dirs.length; d++) {
          const ns = foldState(cur.state, cr.axis, cr.at, dirs[d]);
          if (!ns || !hasSE(ns)) continue;
          const path = cur.path.concat([{ axis: cr.axis, at: cr.at, dir: dirs[d] }]);
          if (connected(ns)) {
            wins.push(path);
            continue;
          }
          const k = keyOf(ns);
          if (seen[k]) continue;
          seen[k] = 1;
          q.push({ state: ns, path: path });
        }
      }
    }
    return { wins: wins };
  }

  if (typeof document === "undefined") {
    let bad = 0;
    STAGES.forEach(function (s, idx) {
      try {
        parseMap(s.map);
      } catch (err) {
        console.error("parse", s.name, err.message);
        bad++;
        return;
      }
      const st = makeState(s);
      if (connected(st)) {
        console.error("already connected", s.name);
        bad++;
      }
      const r = solve(s);
      if (r.error || !r.wins.length) {
        console.error("unsolvable", s.name, r.error || "0 wins");
        bad++;
      } else {
        console.log("OK", s.name, "wins=" + r.wins.length, "min=" + Math.min.apply(null, r.wins.map(function (p) { return p.length; })));
      }
      if (s.bait) {
        const dirs = dirsFor(st, s.bait);
        let baitWin = false;
        for (let d = 0; d < dirs.length; d++) {
          const ns = foldState(st, s.bait.axis, s.bait.at, dirs[d]);
          if (ns && connected(ns)) baitWin = true;
        }
        if (baitWin) {
          console.error("bait connects", s.name);
          bad++;
        }
      }
      if (!s.creases.length) {
        console.error("no creases", s.name);
        bad++;
      }
    });
    if (bad) {
      console.error("fold-path maps failed", bad);
      process.exitCode = 1;
    } else {
      console.log("fold-path maps ok", STAGES.length);
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
  const foldLabel = document.getElementById("fold-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnUndo = document.getElementById("btn-undo");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const stageEl = document.getElementById("stage");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) hintEl.textContent = "点虚线折页 · 墨迹接到出口即通";

  const view = { w: 1, h: 1, dpr: 1 };
  const board = { x: 0, y: 0, cell: 72, cols: 4, rows: 2 };

  const G = {
    mode: "title",
    phase: "wait",
    stage: 0,
    lives: LIVES,
    state: makeState(STAGES[0]),
    undo: [],
    foldsLeft: 1,
    clock: 0,
    sel: 0,
    hover: -1,
    foldDir: 1,
    t: 0,
    lock: 0,
    stuckT: 0,
    shake: 0,
    flash: 0,
    flashRgb: "0,240,255",
    toastT: 0,
    paused: false,
    anim: null,
    flowPath: [],
    flowT: 0,
    crumple: 0,
    layoutT: 0
  };

  const particles = [];
  const motes = [];
  const sparks = [];

  const ptr = { id: null, x: 0, y: 0, sx: 0, sy: 0, down: false, used: false };

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
        const o1 = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o1.type = "sine";
        o2.type = "triangle";
        o1.frequency.value = 98;
        o2.frequency.value = 147;
        g.gain.value = 0.028;
        o1.connect(g);
        o2.connect(g);
        g.connect(this.master);
        o1.start();
        o2.start();
        this.drone = o1;
        this.droneGain = g;
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
      f.frequency.setValueAtTime(from || 680, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(80, to || 220), t + dur);
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
      if (kind === "fold") {
        this.noise(0.22, 0.1, 1400, 280);
        this.beep(220, 0.18, "sine", 0.05, 90);
        this.beep(880, 0.08, "triangle", 0.03, 440);
      } else if (kind === "select") {
        this.beep(720, 0.04, "sine", 0.025);
      } else if (kind === "deny") {
        this.beep(150, 0.12, "square", 0.04, 70);
      } else if (kind === "hover") {
        this.beep(980, 0.03, "sine", 0.016);
      } else if (kind === "miss") {
        this.noise(0.16, 0.06, 500, 160);
        this.beep(196, 0.2, "triangle", 0.04, 110);
      } else if (kind === "flow") {
        this.beep(392, 0.12, "sine", 0.05, 784);
        this.beep(523, 0.28, "triangle", 0.04, 1046);
      } else if (kind === "clear") {
        this.beep(523, 0.12, "sine", 0.06, 784);
        this.beep(784, 0.22, "triangle", 0.05, 1174);
      } else if (kind === "win") {
        this.beep(523, 0.16, "sine", 0.09, 784);
        this.beep(659, 0.28, "triangle", 0.07, 1046);
        this.beep(784, 0.42, "sine", 0.05, 1318);
      } else if (kind === "lose") {
        this.noise(0.4, 0.1, 400, 80);
        this.beep(174, 0.55, "sawtooth", 0.08, 50);
      } else if (kind === "fail") {
        this.noise(0.28, 0.09, 900, 140);
        this.beep(130, 0.32, "sine", 0.06, 55);
      } else if (kind === "start") {
        this.beep(262, 0.12, "sine", 0.06, 392);
        this.beep(392, 0.2, "triangle", 0.05, 523);
      } else if (kind === "undo") {
        this.beep(320, 0.08, "sine", 0.03, 180);
      } else if (kind === "tick") {
        this.beep(980, 0.05, "square", 0.03, 420);
      }
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
    else audio.setMuted(false);
  } catch (e) {
    audio.setMuted(false);
  }

  function spawnMotes() {
    motes.length = 0;
    const n = 42;
    for (let i = 0; i < n; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.6 + Math.random() * 1.6,
        s: 0.04 + Math.random() * 0.1,
        a: 0.08 + Math.random() * 0.18,
        p: Math.random() * TAU,
        cyan: Math.random() > 0.45
      });
    }
  }
  spawnMotes();

  function burst(x, y, col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = 40 + Math.random() * 160;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 20,
        t: 0,
        life: 0.35 + Math.random() * 0.45,
        r: 1.4 + Math.random() * 2.4,
        col: col
      });
    }
  }

  function sparkLine(x1, y1, x2, y2, col) {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      sparks.push({
        x: lerp(x1, x2, t),
        y: lerp(y1, y2, t),
        t: 0,
        life: 0.22 + Math.random() * 0.18,
        col: col
      });
    }
  }

  function toast(msg, kind, dur) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("ok", kind === "ok");
    toastEl.classList.remove("hidden");
    G.toastT = dur || 1.15;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function setPips() {
    pipsEl.innerHTML = "";
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement("span");
      s.className = "pip" + (i < G.lives ? " on" : "") + (G.lives === 1 && i === 0 ? " warn" : "");
      pipsEl.appendChild(s);
    }
  }

  let hudSig = "";
  function hud() {
    const st = STAGES[G.stage];
    const t = Math.max(0, G.clock);
    const sig = [
      G.mode, G.phase, G.stage, G.foldsLeft, G.lives,
      G.undo.length, t.toFixed(1), G.paused ? 1 : 0
    ].join("|");
    if (sig === hudSig) return;
    hudSig = sig;
    if (G.mode === "title") {
      stageLabel.textContent = "折径";
      foldLabel.textContent = "—";
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
    } else {
      stageLabel.textContent = st.name + " · " + (G.stage + 1) + "/" + STAGES.length;
      foldLabel.textContent = "折 " + G.foldsLeft;
      timeLabel.textContent = t.toFixed(1);
      timeLabel.classList.toggle("warn", t <= 5 && (G.phase === "play" || G.phase === "fold"));
    }
    btnUndo.disabled = !(G.mode === "play" && (G.phase === "play") && G.undo.length);
    setPips();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "FOLD";
      ovTitle.textContent = "折径";
      ovLead.innerHTML = "沿虚线折叠纸面，让品红墨迹接到青色出口。<br />折页叠上，路径会合。";
      ovOps.textContent = "点虚线折叠 · 方向键选折痕 · 空格折 · 滑过折痕 · Z 撤销 · M 静音";
      ovBtn.textContent = "开折";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "PATH CLOSED";
      ovTitle.textContent = "折通";
      ovLead.textContent = "六纸墨迹皆接到出口。纸页合上，径亮了。";
      ovOps.textContent = "回车再折一局 · M 静音";
      ovBtn.textContent = "再折一局";
    } else if (kind === "lose") {
      panel.classList.add("lose");
      ovKicker.textContent = "CRUMPLED";
      ovTitle.textContent = "纸碎";
      ovLead.textContent = "时尽、折尽，或墨迹没接到出口。三命用完。";
      ovOps.textContent = "回车再折一次 · M 静音";
      ovBtn.textContent = "再折一次";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function fit() {
    const r = stageEl.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.w = Math.max(1, r.width);
    view.h = Math.max(1, r.height);
    view.dpr = dpr;
    canvas.width = (view.w * dpr) | 0;
    canvas.height = (view.h * dpr) | 0;
    canvas.style.width = view.w + "px";
    canvas.style.height = view.h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutBoard(G.anim && G.anim.from ? G.anim.from : G.state);
  }

  function layoutBoard(state) {
    const stg = STAGES[G.stage];
    const oc = stg.map[0].length;
    const orows = stg.map.length;
    const padX = 36;
    const padY = 28;
    const cell = Math.max(
      36,
      Math.min((view.w - padX * 2) / Math.max(2, oc), (view.h - padY * 2) / Math.max(2, orows), 108)
    );
    board.cell = cell;
    board.cols = state.cols;
    board.rows = state.rows;
    board.x = (view.w - state.cols * cell) * 0.5;
    board.y = (view.h - state.rows * cell) * 0.48;
  }

  function cellAt(state, c, r) {
    return state.cells[r * state.cols + c];
  }

  function isFlap(c, r, axis, at, dir) {
    if (axis === 0) return dir === 0 ? c <= at : c > at;
    return dir === 0 ? r <= at : r > at;
  }

  function creaseHinge(state, cr, b) {
    if (cr.axis === 0) {
      return { x: b.x + (cr.at + 1) * b.cell, y: b.y, l: b.rows * b.cell };
    }
    return { x: b.x, y: b.y + (cr.at + 1) * b.cell, l: b.cols * b.cell };
  }

  function pickCrease(x, y, state) {
    const slop = Math.max(16, board.cell * 0.22);
    let best = -1;
    let bd = slop;
    for (let i = 0; i < state.creases.length; i++) {
      const cr = state.creases[i];
      if (!dirsFor(state, cr).length) continue;
      const h = creaseHinge(state, cr, board);
      let d;
      if (cr.axis === 0) {
        if (y < board.y - 8 || y > board.y + board.rows * board.cell + 8) continue;
        d = Math.abs(x - h.x);
      } else {
        if (x < board.x - 8 || x > board.x + board.cols * board.cell + 8) continue;
        d = Math.abs(y - h.y);
      }
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  }

  function dirFromPoint(state, cr, x, y) {
    const dirs = dirsFor(state, cr);
    if (!dirs.length) return 0;
    const h = creaseHinge(state, cr, board);
    const want = cr.axis === 0 ? (x < h.x ? 0 : 1) : (y < h.y ? 0 : 1);
    if (dirs.indexOf(want) >= 0) return want;
    return dirs[0];
  }

  function preferredDir(state, cr) {
    const dirs = dirsFor(state, cr);
    if (!dirs.length) return 0;
    if (dirs.length === 1) return dirs[0];
    return 0;
  }

  function canPlay() {
    return G.mode === "play" && G.phase === "play" && !G.paused && !G.anim && G.lock <= 0;
  }

  function anyLegal(state) {
    for (let i = 0; i < state.creases.length; i++) {
      if (dirsFor(state, state.creases[i]).length) return true;
    }
    return false;
  }

  function resetRun() {
    G.mode = "play";
    G.lives = LIVES;
    G.stage = 0;
    loadStage(0);
    hideOverlay();
    audio.pulse("start");
    hud();
  }

  function loadStage(i) {
    const stg = STAGES[i];
    G.stage = i;
    G.state = makeState(stg);
    G.foldsLeft = stg.folds;
    G.clock = stg.time;
    G.undo = [];
    G.sel = 0;
    G.hover = -1;
    G.foldDir = G.state.creases[0] ? preferredDir(G.state, G.state.creases[0]) : 0;
    G.phase = "play";
    G.anim = null;
    G.flowPath = [];
    G.flowT = 0;
    G.crumple = 0;
    G.lock = 0;
    G.flash = 0;
    G.stuckT = 0;
    hintEl.textContent = coarse ? stg.hint : stg.hint + " · 空格折 · Z 撤销";
    layoutBoard(G.state);
    hideToast();
    hud();
  }

  function beginFold(axis, at, dir) {
    if (!canPlay()) return;
    if (G.foldsLeft <= 0) {
      audio.pulse("deny");
      toast("没有折次了 · 撤销", "warn", 0.9);
      return;
    }
    G.stuckT = 0;
    const ns = foldState(G.state, axis, at, dir);
    if (!ns) {
      audio.pulse("deny");
      toast("这一页折不过去", "warn", 0.9);
      return;
    }
    G.undo.push({ state: cloneState(G.state), folds: G.foldsLeft });
    if (G.undo.length > 12) G.undo.shift();
    G.foldsLeft = Math.max(0, G.foldsLeft - 1);
    G.phase = "fold";
    G.anim = {
      kind: "fold",
      t: 0,
      dur: 0.5,
      axis: axis,
      at: at,
      dir: dir,
      from: cloneState(G.state),
      to: ns
    };
    G.state = ns;
    audio.pulse("fold");
    const h = creaseHinge(G.anim.from, { axis: axis, at: at }, board);
    if (axis === 0) sparkLine(h.x, board.y, h.x, board.y + board.rows * board.cell, MAG);
    else sparkLine(board.x, h.y, board.x + board.cols * board.cell, h.y, MAG);
    const cx = board.x + board.cols * board.cell * 0.5;
    const cy = board.y + board.rows * board.cell * 0.5;
    burst(cx, cy, MAG, 10);
    hud();
  }

  function foldSelected() {
    if (!canPlay()) return;
    const st = G.state;
    if (!st.creases.length) {
      audio.pulse("deny");
      return;
    }
    G.sel = ((G.sel % st.creases.length) + st.creases.length) % st.creases.length;
    const cr = st.creases[G.sel];
    const dirs = dirsFor(st, cr);
    if (!dirs.length) {
      audio.pulse("deny");
      return;
    }
    let dir = G.foldDir;
    if (dirs.indexOf(dir) < 0) dir = dirs[0];
    beginFold(cr.axis, cr.at, dir);
  }

  function tryFoldAt(x, y) {
    if (!canPlay()) return false;
    const i = pickCrease(x, y, G.state);
    if (i < 0) return false;
    const cr = G.state.creases[i];
    G.sel = i;
    const dir = dirFromPoint(G.state, cr, x, y);
    G.foldDir = dir;
    beginFold(cr.axis, cr.at, dir);
    return true;
  }

  function undo() {
    if (!canPlay() || !G.undo.length) return;
    const u = G.undo.pop();
    G.state = u.state;
    G.foldsLeft = u.folds;
    G.sel = 0;
    G.stuckT = 0;
    G.foldDir = G.state.creases[0] ? preferredDir(G.state, G.state.creases[0]) : 0;
    layoutBoard(G.state);
    audio.pulse("undo");
    toast("已展开", null, 0.7);
    hud();
  }

  function startFlow() {
    G.phase = "flow";
    G.anim = { kind: "flow", t: 0, dur: 0.9 };
    G.flowPath = shortestPath(G.state);
    G.flowT = 0;
    G.flash = 0.5;
    G.flashRgb = "0,240,255";
    audio.pulse("flow");
    toast("折通", "ok", 0.9);
    const path = G.flowPath;
    if (path.length) {
      const a = path[0];
      const b = path[path.length - 1];
      const cell = board.cell;
      burst(board.x + (a % G.state.cols + 0.5) * cell, board.y + (((a / G.state.cols) | 0) + 0.5) * cell, MAG, 14);
      burst(board.x + (b % G.state.cols + 0.5) * cell, board.y + (((b / G.state.cols) | 0) + 0.5) * cell, CYN, 16);
    }
  }

  function fail(reason) {
    if (G.phase === "fail" || G.phase === "over" || G.mode !== "play") return;
    G.phase = "fail";
    G.anim = { kind: "crumple", t: 0, dur: 0.62 };
    G.crumple = 0;
    G.shake = 10;
    G.flash = 0.45;
    G.flashRgb = "255,61,184";
    G.lives -= 1;
    audio.pulse("fail");
    toast(reason || "墨迹未接", "warn", 1.1);
    hud();
  }

  function afterFold() {
    layoutBoard(G.state);
    G.anim = null;
    if (connected(G.state)) {
      startFlow();
      return;
    }
    G.phase = "play";
    G.sel = 0;
    if (G.state.creases[0]) G.foldDir = preferredDir(G.state, G.state.creases[0]);
    audio.pulse("miss");
    if (G.foldsLeft <= 0 || !anyLegal(G.state)) {
      G.stuckT = 1.7;
      toast("墨迹未接 · 撤销重折", "warn", 1.4);
    } else {
      G.stuckT = 0;
      toast("墨迹未接", "warn", 0.85);
    }
    hud();
  }

  function afterFlow() {
    G.anim = null;
    audio.pulse("clear");
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      G.phase = "over";
      showOverlay("win");
      audio.pulse("win");
      hud();
      return;
    }
    loadStage(G.stage + 1);
  }

  function afterFail() {
    G.anim = null;
    if (G.lives <= 0) {
      G.mode = "lose";
      G.phase = "over";
      showOverlay("lose");
      audio.pulse("lose");
      hud();
      return;
    }
    loadStage(G.stage);
  }

  function pointerPos(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", function (ev) {
    if (ev.button && ev.button !== 0) return;
    audio.ensure();
    if (G.mode !== "play") return;
    ev.preventDefault();
    canvas.setPointerCapture(ev.pointerId);
    const p = pointerPos(ev);
    ptr.id = ev.pointerId;
    ptr.x = p.x;
    ptr.y = p.y;
    ptr.sx = p.x;
    ptr.sy = p.y;
    ptr.down = true;
    ptr.used = false;
    const i = pickCrease(p.x, p.y, G.state);
    if (i >= 0) {
      if (G.sel !== i) audio.pulse("select");
      G.sel = i;
      G.hover = i;
      G.foldDir = dirFromPoint(G.state, G.state.creases[i], p.x, p.y);
    }
  });

  canvas.addEventListener("pointermove", function (ev) {
    const p = pointerPos(ev);
    ptr.x = p.x;
    ptr.y = p.y;
    if (!ptr.down || ptr.id !== ev.pointerId) {
      if (canPlay()) {
        const i = pickCrease(p.x, p.y, G.state);
        if (i !== G.hover) {
          G.hover = i;
          if (i >= 0) {
            G.foldDir = dirFromPoint(G.state, G.state.creases[i], p.x, p.y);
            audio.pulse("hover");
          }
        } else if (i >= 0) {
          G.foldDir = dirFromPoint(G.state, G.state.creases[i], p.x, p.y);
        }
      }
      return;
    }
    if (!canPlay() || ptr.used) return;
    const i = G.hover >= 0 ? G.hover : pickCrease(ptr.sx, ptr.sy, G.state);
    if (i < 0) return;
    const cr = G.state.creases[i];
    const dx = p.x - ptr.sx;
    const dy = p.y - ptr.sy;
    const across = cr.axis === 0 ? Math.abs(dx) : Math.abs(dy);
    if (across > Math.max(22, board.cell * 0.28)) {
      const dir = dirFromPoint(G.state, cr, ptr.sx, ptr.sy);
      ptr.used = true;
      G.sel = i;
      G.foldDir = dir;
      beginFold(cr.axis, cr.at, dir);
    }
  });

  function endPtr(ev) {
    if (ptr.id !== ev.pointerId) return;
    if (ptr.down && !ptr.used) {
      const dist = Math.hypot(ptr.x - ptr.sx, ptr.y - ptr.sy);
      if (dist < 14) {
        if (!tryFoldAt(ptr.sx, ptr.sy) && canPlay()) {
          const inside =
            ptr.sx >= board.x &&
            ptr.sy >= board.y &&
            ptr.sx <= board.x + board.cols * board.cell &&
            ptr.sy <= board.y + board.rows * board.cell;
          if (inside) {
            audio.pulse("deny");
            toast("点虚线折页", "warn", 0.8);
          }
        }
      }
    }
    ptr.down = false;
    ptr.id = null;
    ptr.used = false;
  }
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);
  canvas.addEventListener("pointerleave", function () {
    if (!ptr.down) G.hover = -1;
  });

  window.addEventListener("keydown", function (ev) {
    const k = ev.key;
    if (k === "m" || k === "M") {
      ev.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === "r" || k === "R") {
      ev.preventDefault();
      audio.ensure();
      resetRun();
      return;
    }
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (k === "Enter" || k === " " || k === "Spacebar") {
        ev.preventDefault();
        audio.ensure();
        resetRun();
      }
      return;
    }
    if (k === "z" || k === "Z") {
      ev.preventDefault();
      undo();
      return;
    }
    if (!canPlay()) {
      if (k === " " || k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") ev.preventDefault();
      return;
    }
    if (k === " " || k === "Spacebar" || k === "Enter") {
      ev.preventDefault();
      foldSelected();
      return;
    }
    if (k === "ArrowLeft" || k === "ArrowUp" || k === "a" || k === "A" || k === "w" || k === "W") {
      ev.preventDefault();
      if (!G.state.creases.length) return;
      G.sel = (G.sel - 1 + G.state.creases.length) % G.state.creases.length;
      G.foldDir = preferredDir(G.state, G.state.creases[G.sel]);
      audio.pulse("select");
      return;
    }
    if (k === "ArrowRight" || k === "ArrowDown" || k === "d" || k === "D" || k === "s" || k === "S") {
      ev.preventDefault();
      if (!G.state.creases.length) return;
      G.sel = (G.sel + 1) % G.state.creases.length;
      G.foldDir = preferredDir(G.state, G.state.creases[G.sel]);
      audio.pulse("select");
      return;
    }
    if (k === "q" || k === "Q" || k === "Tab") {
      if (k === "Tab") ev.preventDefault();
      const cr = G.state.creases[G.sel];
      if (!cr) return;
      const dirs = dirsFor(G.state, cr);
      if (dirs.length > 1) {
        G.foldDir = G.foldDir ? 0 : 1;
        audio.pulse("select");
      }
    }
  });

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    resetRun();
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

  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (!document.hidden && audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
  });
  window.addEventListener("resize", fit);
  canvas.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });

  function inkColor(cell, i, reachS, reachE, flowLit) {
    if (flowLit) return mix(MAG, CYN, 0.55);
    const s = reachS[i];
    const e = reachE[i];
    if (s && e) return GOLD;
    if (s) return MAG;
    if (e) return CYN;
    return INK_DIM;
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawPaperBody(c, x, y, w, h, back, alpha) {
    c.save();
    c.globalAlpha *= alpha;
    roundRect(c, x, y, w, h, Math.min(12, w * 0.04));
    const g = c.createLinearGradient(x, y, x + w, y + h);
    if (back) {
      g.addColorStop(0, "#1a0c28");
      g.addColorStop(1, "#0e0718");
    } else {
      g.addColorStop(0, "#2c1a4a");
      g.addColorStop(0.45, "#1c1130");
      g.addColorStop(1, "#140a24");
    }
    c.fillStyle = g;
    c.fill();
    c.save();
    c.clip();
    c.strokeStyle = "rgba(255,255,255,0.035)";
    c.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const yy = y + hash(i * 17 + (w | 0)) * h;
      c.beginPath();
      c.moveTo(x, yy);
      c.lineTo(x + w, yy + (hash(i * 9) - 0.5) * 8);
      c.stroke();
    }
    for (let i = 0; i < 28; i++) {
      const px = x + hash(i * 31 + 3) * w;
      const py = y + hash(i * 19 + 7) * h;
      c.fillStyle = "rgba(255,255,255," + (0.015 + hash(i) * 0.03) + ")";
      c.fillRect(px, py, 1.2, 1.2);
    }
    c.restore();
    c.strokeStyle = back ? "rgba(255,61,184,0.28)" : "rgba(0,240,255,0.22)";
    c.lineWidth = 1.4;
    roundRect(c, x, y, w, h, Math.min(12, w * 0.04));
    c.stroke();
    c.restore();
  }

  function drawInk(c, state, b, reachS, reachE, flowSet, mask, alpha) {
    const cell = b.cell;
    const cols = state.cols;
    const rows = state.rows;
    const thick = Math.max(6, cell * 0.22);
    c.save();
    c.globalAlpha *= alpha;
    c.lineCap = "round";
    c.lineJoin = "round";
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const i = r * cols + col;
        if (mask && !mask(col, r)) continue;
        const celld = state.cells[i];
        if (!celld.ink) continue;
        const x = b.x + (col + 0.5) * cell;
        const y = b.y + (r + 0.5) * cell;
        const colr = inkColor(celld, i, reachS, reachE, flowSet && flowSet[i]);
        const glow = flowSet && flowSet[i] ? 0.85 : reachS[i] && reachE[i] ? 0.7 : 0.45;
        if (col + 1 < cols) {
          const j = i + 1;
          if (state.cells[j].ink && (!mask || mask(col + 1, r))) {
            const col2 = inkColor(state.cells[j], j, reachS, reachE, flowSet && flowSet[j]);
            const mid = mix(colr, col2, 0.5);
            c.strokeStyle = rgb(mid, 0.18);
            c.lineWidth = thick + 10;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x + cell, y);
            c.stroke();
            c.strokeStyle = rgb(mid, 0.95);
            c.lineWidth = thick;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x + cell, y);
            c.stroke();
          }
        }
        if (r + 1 < rows) {
          const j = i + cols;
          if (state.cells[j].ink && (!mask || mask(col, r + 1))) {
            const col2 = inkColor(state.cells[j], j, reachS, reachE, flowSet && flowSet[j]);
            const mid = mix(colr, col2, 0.5);
            c.strokeStyle = rgb(mid, 0.18);
            c.lineWidth = thick + 10;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x, y + cell);
            c.stroke();
            c.strokeStyle = rgb(mid, 0.95);
            c.lineWidth = thick;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x, y + cell);
            c.stroke();
          }
        }
        c.shadowColor = rgb(colr, glow);
        c.shadowBlur = 14;
        c.fillStyle = rgb(colr, 0.95);
        c.beginPath();
        c.arc(x, y, thick * 0.46, 0, TAU);
        c.fill();
        c.shadowBlur = 0;
        if (celld.s) {
          c.strokeStyle = rgb(MAG, 0.95);
          c.lineWidth = 2.2;
          c.beginPath();
          c.arc(x, y, cell * 0.22, 0, TAU);
          c.stroke();
          c.fillStyle = rgb(MAG, 0.35 + 0.2 * Math.sin(G.t * 4));
          c.beginPath();
          c.arc(x, y, cell * 0.12, 0, TAU);
          c.fill();
        }
        if (celld.e) {
          const rr = cell * 0.2;
          c.strokeStyle = rgb(CYN, 0.95);
          c.lineWidth = 2.2;
          c.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = G.t * 0.6 + k * TAU / 6;
            const px = x + Math.cos(a) * rr;
            const py = y + Math.sin(a) * rr;
            if (k === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          c.closePath();
          c.stroke();
          c.fillStyle = rgb(CYN, 0.28 + 0.16 * Math.sin(G.t * 3.2));
          c.fill();
        }
      }
    }
    c.restore();
  }

  function drawCreases(c, state, b, hover, sel) {
    const t = G.t;
    for (let i = 0; i < state.creases.length; i++) {
      const cr = state.creases[i];
      const dirs = dirsFor(state, cr);
      if (!dirs.length) continue;
      const h = creaseHinge(state, cr, b);
      const on = i === sel || i === hover;
      const bait = STAGES[G.stage].bait && STAGES[G.stage].bait.axis === cr.axis && STAGES[G.stage].bait.at === cr.at;
      c.save();
      c.setLineDash(on ? [10, 7] : [7, 9]);
      c.lineDashOffset = -t * (on ? 28 : 16);
      c.strokeStyle = on ? rgb(GOLD, 0.95) : bait ? rgb(MAG, 0.42) : rgb(CYN, 0.55);
      c.lineWidth = on ? 2.6 : 1.6;
      c.shadowColor = on ? rgb(GOLD, 0.55) : rgb(CYN, 0.25);
      c.shadowBlur = on ? 12 : 6;
      c.beginPath();
      if (cr.axis === 0) {
        c.moveTo(h.x, b.y + 6);
        c.lineTo(h.x, b.y + b.rows * b.cell - 6);
      } else {
        c.moveTo(b.x + 6, h.y);
        c.lineTo(b.x + b.cols * b.cell - 6, h.y);
      }
      c.stroke();
      c.shadowBlur = 0;
      c.setLineDash([]);
      const dir = on ? G.foldDir : preferredDir(state, cr);
      const use = dirs.indexOf(dir) >= 0 ? dir : dirs[0];
      c.fillStyle = on ? rgb(GOLD, 0.9) : rgb(CYN, 0.55);
      if (cr.axis === 0) {
        const midY = b.y + b.rows * b.cell * 0.5;
        const s = use === 0 ? -1 : 1;
        c.beginPath();
        c.moveTo(h.x + s * 6, midY);
        c.lineTo(h.x + s * 17, midY - 7);
        c.lineTo(h.x + s * 17, midY + 7);
        c.closePath();
        c.fill();
      } else {
        const midX = b.x + b.cols * b.cell * 0.5;
        const s = use === 0 ? -1 : 1;
        c.beginPath();
        c.moveTo(midX, h.y + s * 6);
        c.lineTo(midX - 7, h.y + s * 17);
        c.lineTo(midX + 7, h.y + s * 17);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
  }

  function drawPreview(c, state, cr, dir, b) {
    const ns = foldState(state, cr.axis, cr.at, dir);
    if (!ns) return;
    const cell = b.cell;
    let ox = b.x;
    let oy = b.y;
    if (cr.axis === 0 && dir === 0) ox = b.x + (cr.at + 1) * cell;
    if (cr.axis === 1 && dir === 0) oy = b.y + (cr.at + 1) * cell;
    const ghostBoard = { x: ox, y: oy, cell: cell, cols: ns.cols, rows: ns.rows };
    const reachS = flood(ns, function (celld) { return celld.s; });
    const reachE = flood(ns, function (celld) { return celld.e; });
    c.save();
    c.globalAlpha = 0.38;
    drawInk(c, ns, ghostBoard, reachS, reachE, null, null, 1);
    roundRect(c, ox, oy, ns.cols * cell, ns.rows * cell, 8);
    c.strokeStyle = rgb(GOLD, 0.35);
    c.setLineDash([4, 6]);
    c.lineWidth = 1.2;
    c.stroke();
    c.restore();
  }

  function drawScene(c) {
    const w = view.w;
    const h = view.h;
    c.fillStyle = "#03010a";
    c.fillRect(0, 0, w, h);
    const bg = c.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    bg.addColorStop(0, "rgba(40, 16, 64, 0.35)");
    bg.addColorStop(1, "rgba(3, 1, 10, 0)");
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = (m.x * w + Math.sin(G.t * m.s * 3 + m.p) * 18);
      const my = ((m.y + G.t * m.s * 0.04) % 1.12) * h - 20;
      c.fillStyle = m.cyan ? rgb(CYN, m.a) : rgb(MAG, m.a);
      c.beginPath();
      c.arc(mx, my, m.r, 0, TAU);
      c.fill();
    }

    const folding = G.anim && G.anim.kind === "fold";
    const stateDraw = folding ? G.anim.from : G.state;
    layoutBoard(stateDraw);

    let sx = 0;
    let sy = 0;
    if (G.shake > 0) {
      sx = (hash((G.t * 40) | 0) - 0.5) * G.shake * 1.4;
      sy = (hash((G.t * 40 + 9) | 0) - 0.5) * G.shake * 1.4;
    }
    c.save();
    c.translate(sx, sy);

    const crumple = G.anim && G.anim.kind === "crumple" ? ease(clamp(G.anim.t / G.anim.dur, 0, 1)) : 0;
    if (crumple > 0) {
      const cx = board.x + board.cols * board.cell * 0.5;
      const cy = board.y + board.rows * board.cell * 0.5;
      c.translate(cx, cy);
      c.rotate((hash(3) - 0.5) * crumple * 0.5);
      c.scale(1 - crumple * 0.55, 1 - crumple * 0.7);
      c.translate(-cx, -cy);
    }

    const pw = board.cols * board.cell;
    const ph = board.rows * board.cell;
    if (!folding) {
      c.save();
      c.shadowColor = "rgba(0,0,0,0.55)";
      c.shadowBlur = 28;
      c.shadowOffsetY = 14;
      roundRect(c, board.x, board.y, pw, ph, 12);
      c.fillStyle = "#000";
      c.fill();
      c.restore();
    }

    const reachS = flood(stateDraw, function (celld) { return celld.s; });
    const reachE = flood(stateDraw, function (celld) { return celld.e; });
    let flowSet = null;
    if (G.anim && G.anim.kind === "flow" && G.flowPath.length) {
      flowSet = [];
      const n = G.flowPath.length;
      const lit = Math.ceil(clamp(G.anim.t / G.anim.dur, 0, 1) * n);
      for (let i = 0; i < lit; i++) flowSet[G.flowPath[i]] = 1;
    } else if (connected(G.state) && G.phase === "flow") {
      flowSet = [];
      for (let i = 0; i < G.flowPath.length; i++) flowSet[G.flowPath[i]] = 1;
    }

    if (folding) {
      const a = G.anim;
      const k = ease(clamp(a.t / a.dur, 0, 1));
      const ang = k * Math.PI;
      const cos = Math.cos(ang);
      const back = cos < 0;
      const hinge = creaseHinge(a.from, { axis: a.axis, at: a.at }, board);

      function remainMask(cc, rr) {
        return !isFlap(cc, rr, a.axis, a.at, a.dir);
      }
      function flapMask(cc, rr) {
        return isFlap(cc, rr, a.axis, a.at, a.dir);
      }

      let rx = board.x;
      let ry = board.y;
      let rw = pw;
      let rh = ph;
      if (a.axis === 0) {
        if (a.dir === 0) {
          rx = hinge.x;
          rw = (a.from.cols - a.at - 1) * board.cell;
        } else rw = (a.at + 1) * board.cell;
      } else if (a.dir === 0) {
        ry = hinge.y;
        rh = (a.from.rows - a.at - 1) * board.cell;
      } else rh = (a.at + 1) * board.cell;
      c.save();
      c.shadowColor = "rgba(0,0,0,0.5)";
      c.shadowBlur = 24;
      c.shadowOffsetY = 12;
      roundRect(c, rx, ry, rw, rh, 12);
      c.fillStyle = "#000";
      c.fill();
      c.restore();
      drawPaperBody(c, rx, ry, rw, rh, false, 1);
      drawInk(c, a.from, board, reachS, reachE, null, remainMask, 1);

      c.save();
      if (a.axis === 0) {
        const shw = Math.abs(cos) * (a.dir === 0 ? (a.at + 1) * board.cell : (a.from.cols - a.at - 1) * board.cell);
        const sx0 = a.dir === 0 ? hinge.x - shw : hinge.x;
        const grd = c.createLinearGradient(hinge.x, 0, a.dir === 0 ? hinge.x - shw : hinge.x + shw, 0);
        grd.addColorStop(0, "rgba(0,0,0," + (0.35 * k) + ")");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = grd;
        c.fillRect(sx0, board.y, shw, ph);
        c.translate(hinge.x, 0);
        c.scale(Math.max(0.012, Math.abs(cos)) * (cos >= 0 ? 1 : -1), 1);
        c.translate(-hinge.x, 0);
      } else {
        const shh = Math.abs(cos) * (a.dir === 0 ? (a.at + 1) * board.cell : (a.from.rows - a.at - 1) * board.cell);
        const sy0 = a.dir === 0 ? hinge.y - shh : hinge.y;
        const grd = c.createLinearGradient(0, hinge.y, 0, a.dir === 0 ? hinge.y - shh : hinge.y + shh);
        grd.addColorStop(0, "rgba(0,0,0," + (0.35 * k) + ")");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = grd;
        c.fillRect(board.x, sy0, pw, shh);
        c.translate(0, hinge.y);
        c.scale(1, Math.max(0.012, Math.abs(cos)) * (cos >= 0 ? 1 : -1));
        c.translate(0, -hinge.y);
      }

      let fx = board.x;
      let fy = board.y;
      let fw = pw;
      let fh = ph;
      if (a.axis === 0) {
        if (a.dir === 0) fw = (a.at + 1) * board.cell;
        else {
          fx = hinge.x;
          fw = (a.from.cols - a.at - 1) * board.cell;
        }
      } else if (a.dir === 0) fh = (a.at + 1) * board.cell;
      else {
        fy = hinge.y;
        fh = (a.from.rows - a.at - 1) * board.cell;
      }
      drawPaperBody(c, fx, fy, fw, fh, back, 1);
      drawInk(c, a.from, board, reachS, reachE, null, flapMask, back ? 0.72 : 1);
      c.restore();

      c.strokeStyle = rgb(GOLD, 0.85);
      c.lineWidth = 2.4;
      c.shadowColor = rgb(MAG, 0.6);
      c.shadowBlur = 12;
      c.beginPath();
      if (a.axis === 0) {
        c.moveTo(hinge.x, board.y);
        c.lineTo(hinge.x, board.y + ph);
      } else {
        c.moveTo(board.x, hinge.y);
        c.lineTo(board.x + pw, hinge.y);
      }
      c.stroke();
      c.shadowBlur = 0;
    } else {
      drawPaperBody(c, board.x, board.y, pw, ph, false, 1 - crumple * 0.2);
      drawInk(c, stateDraw, board, reachS, reachE, flowSet, null, 1);
      if (G.phase === "play" || G.mode === "title") {
        const hi = G.hover >= 0 ? G.hover : G.sel;
        if (G.phase === "play" && hi >= 0 && stateDraw.creases[hi]) {
          const cr = stateDraw.creases[hi];
          const dirs = dirsFor(stateDraw, cr);
          if (dirs.length) {
            const dir = dirs.indexOf(G.foldDir) >= 0 ? G.foldDir : dirs[0];
            drawPreview(c, stateDraw, cr, dir, board);
          }
        }
        drawCreases(c, stateDraw, board, G.hover, G.sel);
      }
    }

    if (G.mode === "title") {
      c.fillStyle = "rgba(3,1,10,0.18)";
      c.fillRect(0, 0, w, h);
    }

    c.restore();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const u = p.t / p.life;
      c.fillStyle = rgb(p.col, 1 - u);
      c.beginPath();
      c.arc(p.x, p.y, p.r * (1 - u * 0.5), 0, TAU);
      c.fill();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      const u = p.t / p.life;
      c.fillStyle = rgb(p.col, 1 - u);
      c.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4);
    }

    if (G.flash > 0) {
      c.fillStyle = "rgba(" + G.flashRgb + "," + (G.flash * 0.22) + ")";
      c.fillRect(0, 0, w, h);
    }
  }

  function tick(dt) {
    G.t += dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t >= sparks[i].life) sparks.splice(i, 1);
    }

    if (G.paused || G.mode === "title" || G.mode === "win" || G.mode === "lose") return;

    if (G.anim) {
      G.anim.t += dt;
      if (G.anim.t >= G.anim.dur) {
        const kind = G.anim.kind;
        if (kind === "fold") afterFold();
        else if (kind === "flow") afterFlow();
        else if (kind === "crumple") afterFail();
      }
      return;
    }

    if (G.phase === "play") {
      G.clock -= dt;
      if (G.clock <= 5.05 && G.clock + dt > 5.05) audio.pulse("tick");
      if (G.clock <= 0) {
        G.clock = 0;
        fail("时间到");
        hud();
        return;
      }
      if (G.stuckT > 0) {
        G.stuckT -= dt;
        if (G.stuckT <= 0) fail("墨迹未接");
      }
      hud();
    }
  }

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    const raw = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += raw;
    while (acc >= STEP) {
      tick(STEP);
      acc -= STEP;
    }
    drawScene(ctx);
    requestAnimationFrame(frame);
  }

  fit();
  hud();
  showOverlay("title");
  requestAnimationFrame(frame);
})();
