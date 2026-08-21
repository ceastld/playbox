(() => {
  "use strict";

  const TILE = 32;
  const INNER_W = 24;
  const INNER_H = 14;
  const COLS = INNER_W + 2;
  const ROWS = INNER_H + 2;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;
  const TAU = Math.PI * 2;
  const PLAYER_R = 9;
  const GUARD_R = 10;
  const PLAYER_SPEED = 132;
  const STEP_DIST = 20;
  const PRINT_GROW = 205;
  const PRINT_MAX = 286;
  const PRINT_LIFE = 1.7;
  const EXIT_R = 16;
  const DIE_T = 0.58;
  const CLEAR_T = 0.62;

  function t(ch, n) {
    return ch.repeat(n);
  }
  function row() {
    let s = "";
    for (let i = 0; i < arguments.length; i++) s += arguments[i];
    return s;
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, k) {
    return a + (b - a) * k;
  }
  function lerpAng(a, b, k) {
    let d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return a + d * k;
  }
  function hash(c, r) {
    const n = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  const STAGES = [
    {
      name: "绒径",
      sub: "RUG",
      hint: "地毯无声 · 石面会开花",
      inner: [
        row("P", t("~", 22), "X"),
        t("~", 24),
        t("~", 24),
        row(t("~", 5), t(".", 14), t("~", 5)),
        row(t("~", 5), t(".", 14), t("~", 5)),
        row(t("~", 5), t(".", 14), t("~", 5)),
        row(t("~", 5), t(".", 14), t("~", 5)),
        row(t("~", 5), t(".", 14), t("~", 5)),
        row(t("~", 5), t(".", 14), t("~", 5)),
        row(t("~", 5), t(".", 14), t("~", 5)),
        row(t("~", 5), t(".", 14), t("~", 5)),
        t("~", 24),
        t("~", 24),
        t("~", 24)
      ],
      guards: [
        { c: 12, r: 7, facing: Math.PI / 2, waypoints: [[12, 7]], sweep: 0.42, range: 152, fov: 0.5 }
      ]
    },
    {
      name: "石隙",
      sub: "GAP",
      hint: "等灯转走，再踏过去",
      inner: [
        row("P", t("~", 23)),
        t("~", 24),
        t("~", 24),
        row(t("#", 8), t(".", 6), t("#", 10)),
        row(t("~", 8), t(".", 6), t("~", 10)),
        row(t("~", 8), t(".", 6), t("~", 10)),
        row(t("~", 8), t(".", 6), t("~", 5), "X", t("~", 4)),
        row(t("~", 8), t(".", 6), t("~", 10)),
        row(t("#", 8), t(".", 6), t("#", 10)),
        t("~", 24),
        t("~", 24),
        t("~", 24),
        t("~", 24),
        t("~", 24)
      ],
      guards: [
        { c: 11, r: 4, facing: Math.PI / 2, waypoints: [[11, 4], [11, 7]], speed: 54, range: 148, fov: 0.52 }
      ]
    },
    {
      name: "双岗",
      sub: "PAIR",
      hint: "两道灯，两道石",
      inner: [
        row("P", t("~", 23)),
        t("~", 24),
        row(t("#", 8), t(".", 6), t("#", 10)),
        row(t("~", 8), t(".", 6), t("~", 10)),
        row(t("~", 8), t(".", 6), t("~", 10)),
        row(t("#", 8), t(".", 6), t("#", 10)),
        row(t("~", 8), t(".", 6), t("~", 10)),
        row(t("~", 8), t(".", 6), t("~", 10)),
        row(t("~", 8), t(".", 6), t("~", 5), "X", t("~", 4)),
        row(t("#", 8), t(".", 6), t("#", 10)),
        t("~", 24),
        t("~", 24),
        t("~", 24),
        t("~", 24)
      ],
      guards: [
        { c: 11, r: 3, facing: Math.PI / 2, waypoints: [[11, 3], [11, 4]], speed: 56, range: 142, fov: 0.5 },
        { c: 11, r: 8, facing: -Math.PI / 2, waypoints: [[11, 6], [11, 8]], speed: 52, range: 142, fov: 0.5 }
      ]
    },
    {
      name: "折毯",
      sub: "FOLD",
      hint: "贴着绒毯走，灯在石面上扫",
      inner: [
        row("P", t("~", 4), t(".", 19)),
        row(t("~", 5), t(".", 19)),
        row(t("~", 5), t("#", 5), t(".", 14)),
        row(t("~", 5), "#", t("~", 3), "#", t(".", 14)),
        row(t("~", 5), "#", t("~", 3), t("#", 5), t(".", 10)),
        row(t("~", 5), "#", t("~", 7), "#", t(".", 10)),
        row(t(".", 10), t("~", 3), "#", t(".", 10)),
        row(t(".", 10), t("~", 3), t("#", 5), t(".", 6)),
        row(t(".", 10), t("~", 7), "#", t(".", 6)),
        row(t(".", 14), t("~", 3), "#", t(".", 6)),
        row(t(".", 14), t("~", 3), "#", t("~", 3), "X", t("~", 2)),
        row(t(".", 14), t("#", 5), t("~", 5)),
        t(".", 24),
        t(".", 24)
      ],
      guards: [
        {
          c: 20, r: 3, facing: Math.PI,
          waypoints: [[20, 2], [20, 6], [16, 12], [20, 10]],
          speed: 58, range: 150, fov: 0.48
        }
      ]
    },
    {
      name: "金库",
      sub: "VAULT",
      hint: "毯上有缺口，声纹会把你交出去",
      inner: [
        row("P", t("~", 4), t(".", 19)),
        row(t("~", 5), t(".", 19)),
        row(t("~", 5), t("#", 5), t(".", 14)),
        row(t("~", 5), "#", t("~", 3), "#", t(".", 14)),
        row(t("~", 5), "#", t("~", 3), t("#", 5), t(".", 10)),
        row(t("~", 5), "#", t("~", 3), t(".", 2), t("~", 2), "#", t(".", 10)),
        row(t(".", 10), t("~", 3), "#", t(".", 10)),
        row(t(".", 10), t("~", 3), t("#", 5), t(".", 6)),
        row(t(".", 10), t("~", 3), t(".", 2), t("~", 2), "#", t(".", 6)),
        row(t(".", 14), t("~", 3), "#", t(".", 6)),
        row(t(".", 14), t("~", 3), "#", t("~", 3), "X", t("~", 2)),
        row(t(".", 14), t("#", 5), t("~", 5)),
        t(".", 24),
        row(t("~", 4), t(".", 16), t("~", 4))
      ],
      guards: [
        { c: 16, r: 3, facing: Math.PI, waypoints: [[18, 2], [16, 4]], speed: 50, range: 138, fov: 0.46 },
        { c: 12, r: 8, facing: 0, waypoints: [[8, 6], [14, 8], [8, 12]], speed: 60, range: 140, fov: 0.48 },
        { c: 20, r: 12, facing: -Math.PI / 2, waypoints: [[20, 12], [18, 9]], speed: 52, range: 132, fov: 0.46 }
      ]
    }
  ];

  const TITLE_INNER = STAGES[0].inner;

  function wrap(inner) {
    if (inner.length !== INNER_H) throw new Error("h " + inner.length);
    const bar = t("#", COLS);
    const out = [bar];
    for (let i = 0; i < inner.length; i++) {
      if (inner[i].length !== INNER_W) {
        throw new Error("row " + i + " " + inner[i].length + " " + inner[i]);
      }
      out.push("#" + inner[i] + "#");
    }
    out.push(bar);
    return out;
  }

  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }

  function parseGrid(inner) {
    const grid = wrap(inner);
    const walls = [];
    const carpet = [];
    let px = TILE * 2, py = TILE * 2, ex = WORLD_W - TILE * 2, ey = TILE * 2;
    let pc = 1, pr = 1, xc = COLS - 2, xr = 1;
    let np = 0, nx = 0;
    for (let r = 0; r < ROWS; r++) {
      walls[r] = [];
      carpet[r] = [];
      for (let c = 0; c < COLS; c++) {
        const ch = grid[r][c];
        walls[r][c] = ch === "#";
        carpet[r][c] = ch === "~" || ch === "P" || ch === "X";
        if (ch === "P") {
          np++;
          pc = c;
          pr = r;
          px = (c + 0.5) * TILE;
          py = (r + 0.5) * TILE;
        } else if (ch === "X") {
          nx++;
          xc = c;
          xr = r;
          ex = (c + 0.5) * TILE;
          ey = (r + 0.5) * TILE;
        }
      }
    }
    return { walls, carpet, grid, px, py, ex, ey, pc, pr, xc, xr, np, nx };
  }

  function reachable(walls, pc, pr, xc, xr) {
    const seen = new Uint8Array(COLS * ROWS);
    const q = [pr * COLS + pc];
    seen[pr * COLS + pc] = 1;
    let qi = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (qi < q.length) {
      const u = q[qi++];
      const c = u % COLS;
      const r = (u / COLS) | 0;
      for (let d = 0; d < 4; d++) {
        const nc = c + dirs[d][0], nr = r + dirs[d][1];
        if (!inb(nc, nr) || walls[nr][nc]) continue;
        const v = nr * COLS + nc;
        if (seen[v]) continue;
        seen[v] = 1;
        q.push(v);
      }
    }
    return !!seen[xr * COLS + xc];
  }

  function walkableInner(inner, c, r) {
    if (c < 0 || r < 0 || c >= INNER_W || r >= INNER_H) return false;
    const ch = inner[r][c];
    return ch !== "#";
  }

  function validate() {
    STAGES.forEach((s, si) => {
      const g = parseGrid(s.inner);
      if (g.np !== 1 || g.nx !== 1) throw new Error("stage " + si + " P/X " + g.np + "/" + g.nx);
      if (!reachable(g.walls, g.pc, g.pr, g.xc, g.xr)) throw new Error("stage " + si + " unreachable");
      s.guards.forEach((gd, gi) => {
        gd.waypoints.forEach((wp, wi) => {
          if (!walkableInner(s.inner, wp[0], wp[1])) {
            throw new Error("stage " + si + " guard " + gi + " wp " + wi);
          }
        });
        if (!walkableInner(s.inner, gd.c, gd.r)) throw new Error("stage " + si + " guard spawn " + gi);
        const gx = (gd.c + 1.5) * TILE;
        const gy = (gd.r + 1.5) * TILE;
        const dx = g.px - gx, dy = g.py - gy;
        const dist = Math.hypot(dx, dy);
        if (dist < PLAYER_R + GUARD_R + 4) throw new Error("stage " + si + " spawn bump " + gi);
        const range = gd.range || 148;
        const fov = gd.fov || 0.5;
        if (dist <= range) {
          const ang = Math.atan2(dy, dx);
          let da = ang - gd.facing;
          while (da > Math.PI) da -= TAU;
          while (da < -Math.PI) da += TAU;
          if (Math.abs(da) <= fov) {
            throw new Error("stage " + si + " spawn in cone " + gi);
          }
        }
      });
    });
    parseGrid(TITLE_INNER);
  }

  if (typeof document === "undefined") {
    validate();
    console.log("quiet-step maps ok", STAGES.length);
    return;
  }

  validate();

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.getElementById("overlay");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovLead = document.getElementById("ov-lead");
  const ovOps = document.getElementById("ov-ops");
  const ovBtn = document.getElementById("ov-btn");
  const stageLabel = document.getElementById("stage-label");
  const noiseFill = document.getElementById("noise-fill");
  const noiseWrap = document.getElementById("noise-wrap");
  const surfaceLabel = document.getElementById("surface-label");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) hintEl.textContent = "按住或拖动画布移动 · 地毯无声 · 石面留纹";

  const keys = Object.create(null);
  const pointer = { down: false, steering: false, id: null, x: 0, y: 0 };
  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };

  const SFX = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    stepAt: 0,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.72;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
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
    noise(dur, vol, cut) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = cut || 1400;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    marble() {
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.stepAt < 0.08) return;
      this.stepAt = now;
      this.ensure();
      this.noise(0.09, 0.07, 2200);
      this.beep(980, 0.07, "triangle", 0.045, 420);
    },
    rug() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      if (now - this.stepAt < 0.16) return;
      this.stepAt = now;
      this.beep(140, 0.05, "sine", 0.012, 80);
    },
    hmm() {
      this.ensure();
      this.beep(220, 0.18, "sine", 0.05, 340);
      this.beep(330, 0.22, "triangle", 0.03, 180);
    },
    spot() {
      this.ensure();
      this.noise(0.22, 0.12, 900);
      this.beep(520, 0.42, "sawtooth", 0.09, 70);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.14, "sine", 0.07, 784);
      const self = this;
      setTimeout(function () { self.beep(659, 0.18, "sine", 0.07, 880); }, 90);
    },
    win() {
      this.ensure();
      this.beep(523, 0.16, "sine", 0.08, 659);
      const self = this;
      setTimeout(function () { self.beep(659, 0.16, "sine", 0.08, 784); }, 110);
      setTimeout(function () { self.beep(784, 0.2, "sine", 0.09, 1046); }, 220);
      setTimeout(function () { self.beep(1046, 0.38, "triangle", 0.1, 1568); }, 340);
    },
    tickDrone(busy) {
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
      const target = busy ? 0.035 : 0.012;
      const g = this.droneGain.gain;
      const t0 = this.ctx.currentTime;
      g.cancelScheduledValues(t0);
      g.linearRampToValueAtTime(target, t0 + 0.12);
    }
  };

  try {
    if (localStorage.getItem("quiet-step-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
  }
  syncMuteBtn();

  let mode = "title";
  let overlayKind = "title";
  let stageIndex = 0;
  let walls = [];
  let carpet = [];
  let player = { x: 0, y: 0, vx: 0, vy: 0, facing: 0, bob: 0, acc: 0, moving: false };
  let exit = { x: 0, y: 0 };
  let guards = [];
  let prints = [];
  let particles = [];
  let motes = [];
  let time = 0;
  let shake = 0;
  let flash = 0;
  let noisePulse = 0;
  let toastT = 0;
  let frozen = false;
  let runId = 0;
  let ending = null;
  let caughtWhy = "seen";
  let taught = false;
  let heardToast = false;
  let phantomT = 0;
  let phantomI = 0;
  let wasCarpet = true;
  let rugAcc = 0;
  let paused = false;

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        s: 0.5 + Math.random() * 1.4,
        a: 0.04 + Math.random() * 0.08,
        v: 4 + Math.random() * 10,
        p: Math.random() * TAU
      });
    }
  }
  makeMotes();

  function tileAt(x, y) {
    return {
      c: clamp(Math.floor(x / TILE), 0, COLS - 1),
      r: clamp(Math.floor(y / TILE), 0, ROWS - 1)
    };
  }

  function isCarpet(x, y) {
    const t0 = tileAt(x, y);
    return carpet[t0.r][t0.c];
  }

  function los(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const steps = Math.ceil(dist / 5);
    for (let i = 1; i < steps; i++) {
      const k = i / steps;
      const x = x0 + dx * k;
      const y = y0 + dy * k;
      const c = Math.floor(x / TILE);
      const r = Math.floor(y / TILE);
      if (!inb(c, r) || walls[r][c]) return false;
    }
    return true;
  }

  function march(x, y, ang, max) {
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const step = 4;
    let d = 0;
    let px = x, py = y;
    while (d < max) {
      d += step;
      const nx = x + ca * d;
      const ny = y + sa * d;
      const c = Math.floor(nx / TILE);
      const r = Math.floor(ny / TILE);
      if (!inb(c, r) || walls[r][c]) return { x: px, y: py, d: d - step };
      px = nx;
      py = ny;
    }
    return { x: px, y: py, d: max };
  }

  function circleHitsWall(x, y, r) {
    const c0 = Math.floor((x - r) / TILE);
    const c1 = Math.floor((x + r) / TILE);
    const r0 = Math.floor((y - r) / TILE);
    const r1 = Math.floor((y + r) / TILE);
    for (let ry = r0; ry <= r1; ry++) {
      for (let cx = c0; cx <= c1; cx++) {
        if (!inb(cx, ry) || !walls[ry][cx]) continue;
        const nx = clamp(x, cx * TILE, (cx + 1) * TILE);
        const ny = clamp(y, ry * TILE, (ry + 1) * TILE);
        const dx = x - nx, dy = y - ny;
        if (dx * dx + dy * dy < r * r) return true;
      }
    }
    return false;
  }

  function moveCircle(x, y, dx, dy, r) {
    let nx = x + dx;
    if (circleHitsWall(nx, y, r)) nx = x;
    let ny = y + dy;
    if (circleHitsWall(nx, ny, r)) ny = y;
    if (circleHitsWall(nx, ny, r)) return { x: x, y: y };
    return { x: nx, y: ny };
  }

  function buildFlood(tx, ty) {
    const tc = clamp(Math.floor(tx / TILE), 0, COLS - 1);
    const tr = clamp(Math.floor(ty / TILE), 0, ROWS - 1);
    const dist = new Int16Array(COLS * ROWS);
    dist.fill(32767);
    let sc = tc, sr = tr;
    if (walls[sr][sc]) {
      let found = false;
      for (let rad = 1; rad < 7 && !found; rad++) {
        for (let dr = -rad; dr <= rad && !found; dr++) {
          for (let dc = -rad; dc <= rad && !found; dc++) {
            const nc = tc + dc, nr = tr + dr;
            if (inb(nc, nr) && !walls[nr][nc]) {
              sc = nc;
              sr = nr;
              found = true;
            }
          }
        }
      }
    }
    const q = [sr * COLS + sc];
    dist[sr * COLS + sc] = 0;
    let qi = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (qi < q.length) {
      const u = q[qi++];
      const c = u % COLS, r = (u / COLS) | 0;
      const nd = dist[u] + 1;
      for (let i = 0; i < 4; i++) {
        const nc = c + dirs[i][0], nr = r + dirs[i][1];
        if (!inb(nc, nr) || walls[nr][nc]) continue;
        const v = nr * COLS + nc;
        if (nd < dist[v]) {
          dist[v] = nd;
          q.push(v);
        }
      }
    }
    return dist;
  }

  function steerTo(x, y, tx, ty, field, speed, dt, rad) {
    const dx = tx - x;
    const dy = ty - y;
    const d = Math.hypot(dx, dy);
    if (d < 5) return { x: x, y: y, ang: null, arrived: true };
    const c = clamp(Math.floor(x / TILE), 0, COLS - 1);
    const r = clamp(Math.floor(y / TILE), 0, ROWS - 1);
    const tc = clamp(Math.floor(tx / TILE), 0, COLS - 1);
    const tr = clamp(Math.floor(ty / TILE), 0, ROWS - 1);
    let ax = dx, ay = dy;
    if (c !== tc || r !== tr) {
      let bestC = c, bestR = r, best = field[r * COLS + c];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nc = c + dc, nr = r + dr;
          if (!inb(nc, nr) || walls[nr][nc]) continue;
          const dv = field[nr * COLS + nc];
          if (dv < best) {
            best = dv;
            bestC = nc;
            bestR = nr;
          }
        }
      }
      ax = (bestC + 0.5) * TILE - x;
      ay = (bestR + 0.5) * TILE - y;
    }
    const len = Math.hypot(ax, ay);
    if (len < 0.4) return { x: x, y: y, ang: null, arrived: false };
    const step = Math.min(speed * dt, d);
    const moved = moveCircle(x, y, (ax / len) * step, (ay / len) * step, rad);
    return { x: moved.x, y: moved.y, ang: Math.atan2(ay, ax), arrived: false };
  }

  function burst(x, y, rgb, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = spd * (0.25 + Math.random());
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: 0.32 + Math.random() * 0.5,
        rgb: rgb,
        r: 1.1 + Math.random() * 2.2
      });
    }
  }

  function emitPrint(x, y, amp, quiet) {
    prints.push({
      x: x,
      y: y,
      r: 12,
      age: 0,
      life: PRINT_LIFE,
      amp: amp == null ? 1 : amp,
      phase: Math.random() * TAU
    });
    if (!quiet) {
      SFX.marble();
      noisePulse = Math.max(noisePulse, 1);
      shake = Math.max(shake, 1.4);
      burst(x, y, "0,240,255", 5, 70);
    }
    if (!taught && mode === "play") {
      taught = true;
      showToast("声纹！石面会出卖你", false);
    }
  }

  function wpWorld(wp) {
    return { x: (wp[0] + 1.5) * TILE, y: (wp[1] + 1.5) * TILE };
  }

  function makeGuard(def) {
    const start = wpWorld([def.c, def.r]);
    const wps = def.waypoints.map(wpWorld);
    const g = {
      x: start.x,
      y: start.y,
      facing: def.facing,
      baseFacing: def.facing,
      state: "patrol",
      stateT: 0,
      waypoints: wps,
      wi: 0,
      wait: def.wait || 0.65,
      waitT: 0,
      speed: def.speed || 50,
      chaseSpeed: (def.speed || 50) * 1.38,
      range: def.range || 148,
      fov: def.fov || 0.5,
      sweep: def.sweep || 0,
      targetX: start.x,
      targetY: start.y,
      flood: null,
      mark: "",
      markT: 0,
      suspicion: 0,
      bob: Math.random() * TAU
    };
    g.flood = buildFlood(wps[0].x, wps[0].y);
    return g;
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.8;
  }

  function renderHud() {
    if (mode === "title") {
      stageLabel.textContent = "贴毯而行";
    } else {
      const s = STAGES[stageIndex];
      stageLabel.textContent = (stageIndex + 1) + " / " + STAGES.length + "　" + s.name;
    }
    const hot = noisePulse > 0.35;
    noiseWrap.querySelector(".noise-track").classList.toggle("hot", hot);
    noiseFill.style.width = Math.round(clamp(noisePulse, 0, 1) * 100) + "%";
    const rug = isCarpet(player.x, player.y);
    surfaceLabel.textContent = rug ? "绒" : "石";
    surfaceLabel.classList.toggle("stone", !rug);
  }

  function setOverlay(kind) {
    overlayKind = kind;
    overlay.classList.remove("hidden");
    if (kind === "title") {
      ovKicker.textContent = "STEALTH";
      ovTitle.textContent = "轻足";
      ovLead.innerHTML = "石面会开出声纹，守卫循纹而来。<br />贴着地毯走，别让灯罩扫到你。";
      ovOps.textContent = coarse
        ? "按住或拖动画布移动 · 共五关 · M 静音"
        : "WASD / 方向键移动 · 拖拽或按住朝向 · M 静音";
      ovBtn.textContent = "潜入";
    } else if (kind === "dead") {
      ovKicker.textContent = "HEARD";
      ovTitle.textContent = caughtWhy === "bump" ? "贴上了守卫" : "灯罩咬住了你";
      ovLead.textContent = caughtWhy === "bump"
        ? "呼吸都碰到了铁衣。退回绒毯，再走一遍。"
        : "声纹把他们唤到灯下。石面不是路，是告密者。";
      ovOps.textContent = "本关重开，守卫回到原位。";
      ovBtn.textContent = "再潜一次";
    } else if (kind === "clear") {
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "门开了一道缝";
      ovLead.textContent = "楼里还剩 " + (STAGES.length - stageIndex - 1) + " 道岗。";
      ovOps.textContent = "";
      ovBtn.textContent = "下一关";
    } else if (kind === "win") {
      ovKicker.textContent = "SILENCE";
      ovTitle.textContent = "整座楼都没听见";
      ovLead.textContent = "你把脚步留在了绒里。金库的门在青色里开着。";
      ovOps.textContent = "";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function loadWorld(inner, defs, spawnPlayer) {
    const g = parseGrid(inner);
    walls = g.walls;
    carpet = g.carpet;
    if (spawnPlayer) {
      player.x = g.px;
      player.y = g.py;
      player.facing = 0;
      player.acc = 0;
      player.bob = 0;
      player.moving = false;
    }
    exit.x = g.ex;
    exit.y = g.ey;
    prints = [];
    particles = [];
    guards = defs.map(makeGuard);
    wasCarpet = isCarpet(player.x, player.y);
    rugAcc = 0;
  }

  function loadTitle() {
    runId++;
    mode = "title";
    frozen = false;
    ending = null;
    shake = 0;
    flash = 0;
    noisePulse = 0;
    phantomT = 0;
    phantomI = 0;
    heardToast = false;
    taught = false;
    loadWorld(TITLE_INNER, STAGES[0].guards, true);
    setOverlay("title");
    renderHud();
  }

  function loadStage(i) {
    runId++;
    stageIndex = i;
    const s = STAGES[i];
    mode = "play";
    frozen = false;
    ending = null;
    shake = 0;
    flash = 0;
    noisePulse = 0;
    heardToast = false;
    caughtWhy = "seen";
    loadWorld(s.inner, s.guards, true);
    hideOverlay();
    renderHud();
    showToast((i + 1) + " / " + STAGES.length + "　" + s.hint, false);
  }

  function catchPlayer(why) {
    if (frozen || mode !== "play") return;
    frozen = true;
    ending = "dead";
    caughtWhy = why;
    const id = runId;
    SFX.spot();
    shake = 11;
    flash = 1;
    burst(player.x, player.y, "255,61,184", 26, 150);
    setTimeout(function () {
      if (id !== runId) return;
      mode = "dead";
      setOverlay("dead");
    }, DIE_T * 1000);
  }

  function reachExit() {
    if (frozen || mode !== "play") return;
    frozen = true;
    ending = "exit";
    const id = runId;
    burst(exit.x, exit.y, "0,240,255", 22, 130);
    burst(player.x, player.y, "255,227,107", 10, 70);
    if (stageIndex >= STAGES.length - 1) {
      SFX.win();
      setTimeout(function () {
        if (id !== runId) return;
        mode = "win";
        setOverlay("win");
      }, 720);
    } else {
      SFX.clear();
      setTimeout(function () {
        if (id !== runId) return;
        mode = "clear";
        setOverlay("clear");
      }, CLEAR_T * 1000);
    }
  }

  function overlayAction() {
    if (overlay.classList.contains("hidden")) return;
    SFX.ensure();
    if (overlayKind === "title" || overlayKind === "win") loadStage(0);
    else if (overlayKind === "dead") loadStage(stageIndex);
    else if (overlayKind === "clear") loadStage(stageIndex + 1);
  }

  function retry() {
    SFX.ensure();
    if (mode === "title") return;
    if (mode === "win") loadStage(0);
    else loadStage(stageIndex);
  }

  function toggleMute() {
    SFX.muted = !SFX.muted;
    try { localStorage.setItem("quiet-step-mute", SFX.muted ? "1" : "0"); } catch (_) { /* ignore */ }
    if (SFX.master) SFX.master.gain.value = SFX.muted ? 0 : 0.72;
    if (SFX.muted && SFX.droneGain) SFX.droneGain.gain.value = 0.0001;
    syncMuteBtn();
  }

  function hearGuard(g, px, py) {
    if (g.state === "spot") return;
    g.targetX = px;
    g.targetY = py;
    g.flood = buildFlood(px, py);
    if (g.state === "chase" || g.state === "hear") return;
    g.state = "hear";
    g.stateT = 0;
    g.mark = "?";
    g.markT = 1.25;
    g.suspicion = Math.min(1, g.suspicion + 0.55);
    SFX.hmm();
    if (mode === "play" && !heardToast) {
      heardToast = true;
      showToast("他们听见了", true);
    }
  }

  function canSee(g, x, y) {
    const dx = x - g.x;
    const dy = y - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 16) return true;
    if (d > g.range) return false;
    const ang = Math.atan2(dy, dx);
    let da = ang - g.facing;
    while (da > Math.PI) da -= TAU;
    while (da < -Math.PI) da += TAU;
    if (Math.abs(da) > g.fov) return false;
    return los(g.x, g.y, x, y);
  }

  function updatePlayer(dt) {
    if (frozen || mode !== "play") return;
    let ax = 0, ay = 0;
    if (keys.ArrowLeft || keys.a || keys.A) ax -= 1;
    if (keys.ArrowRight || keys.d || keys.D) ax += 1;
    if (keys.ArrowUp || keys.w || keys.W) ay -= 1;
    if (keys.ArrowDown || keys.s || keys.S) ay += 1;
    if (ax === 0 && ay === 0 && pointer.steering) {
      const dx = pointer.x - player.x;
      const dy = pointer.y - player.y;
      const len = Math.hypot(dx, dy);
      if (len > 12) {
        ax = dx / len;
        ay = dy / len;
      }
    }
    const len = Math.hypot(ax, ay);
    player.moving = len > 0;
    if (len > 0) {
      const sp = PLAYER_SPEED * dt;
      const nx = (ax / len) * sp;
      const ny = (ay / len) * sp;
      const moved = moveCircle(player.x, player.y, nx, ny, PLAYER_R);
      const dist = Math.hypot(moved.x - player.x, moved.y - player.y);
      player.x = moved.x;
      player.y = moved.y;
      player.facing = Math.atan2(ay, ax);
      player.bob += dt * 11;
      const rug = isCarpet(player.x, player.y);
      if (rug) {
        player.acc = 0;
        rugAcc += dist;
        if (rugAcc > 28) {
          rugAcc = 0;
          SFX.rug();
        }
        if (!wasCarpet) wasCarpet = true;
      } else {
        if (wasCarpet) {
          emitPrint(player.x, player.y, 1, false);
          player.acc = 0;
          wasCarpet = false;
        }
        player.acc += dist;
        if (player.acc >= STEP_DIST) {
          player.acc = 0;
          emitPrint(player.x, player.y, 1, false);
        }
      }
    } else {
      player.bob += dt * 2.2;
    }
    if (Math.hypot(exit.x - player.x, exit.y - player.y) < PLAYER_R + EXIT_R) reachExit();
  }

  function updatePrints(dt) {
    for (let i = prints.length - 1; i >= 0; i--) {
      const p = prints[i];
      p.age += dt;
      p.r += PRINT_GROW * dt;
      if (p.r > PRINT_MAX) p.r = PRINT_MAX;
      const live = 1 - p.age / p.life;
      if (live <= 0) {
        prints.splice(i, 1);
        continue;
      }
      const amp = p.amp * live;
      if (amp < 0.15) continue;
      for (let gi = 0; gi < guards.length; gi++) {
        const g = guards[gi];
        if (Math.hypot(g.x - p.x, g.y - p.y) <= p.r + 8 && los(p.x, p.y, g.x, g.y)) {
          hearGuard(g, p.x, p.y);
        }
      }
    }
  }

  function updateGuards(dt) {
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      g.bob += dt * 6;
      g.markT = Math.max(0, g.markT - dt);
      g.suspicion = Math.max(0, g.suspicion - dt * 0.12);
      g.stateT += dt;

      if (mode === "play" && !frozen) {
        if (Math.hypot(g.x - player.x, g.y - player.y) < PLAYER_R + GUARD_R - 1) {
          g.state = "spot";
          g.mark = "!";
          g.markT = 2;
          catchPlayer("bump");
          continue;
        }
        if (canSee(g, player.x, player.y)) {
          g.state = "spot";
          g.mark = "!";
          g.markT = 2;
          g.facing = Math.atan2(player.y - g.y, player.x - g.x);
          catchPlayer("seen");
          continue;
        }
      }

      if (g.state === "spot") continue;

      if (g.state === "patrol") {
        const wp = g.waypoints[g.wi];
        if (g.waypoints.length === 1) {
          if (g.sweep) {
            g.facing = g.baseFacing + Math.sin(time * 0.7 + i) * g.sweep;
          }
          continue;
        }
        if (!g.flood) g.flood = buildFlood(wp.x, wp.y);
        if (g.waitT > 0) {
          g.waitT -= dt;
          if (g.sweep) g.facing = g.baseFacing + Math.sin(time * 0.8) * g.sweep;
          continue;
        }
        const st = steerTo(g.x, g.y, wp.x, wp.y, g.flood, g.speed, dt, GUARD_R);
        g.x = st.x;
        g.y = st.y;
        if (st.ang != null) g.facing = lerpAng(g.facing, st.ang, clamp(dt * 8, 0, 1));
        if (st.arrived || Math.hypot(g.x - wp.x, g.y - wp.y) < 8) {
          g.waitT = g.wait;
          g.wi = (g.wi + 1) % g.waypoints.length;
          g.flood = buildFlood(g.waypoints[g.wi].x, g.waypoints[g.wi].y);
          g.baseFacing = Math.atan2(g.waypoints[g.wi].y - g.y, g.waypoints[g.wi].x - g.x);
        }
      } else if (g.state === "hear") {
        const look = Math.atan2(g.targetY - g.y, g.targetX - g.x);
        g.facing = lerpAng(g.facing, look, clamp(dt * 10, 0, 1));
        if (g.stateT > 0.38) {
          g.state = "chase";
          g.stateT = 0;
          g.mark = "!";
          g.markT = 0.8;
        }
      } else if (g.state === "chase") {
        const st = steerTo(g.x, g.y, g.targetX, g.targetY, g.flood, g.chaseSpeed, dt, GUARD_R);
        g.x = st.x;
        g.y = st.y;
        if (st.ang != null) g.facing = lerpAng(g.facing, st.ang, clamp(dt * 8, 0, 1));
        if (st.arrived || g.stateT > 3.4) {
          g.state = "look";
          g.stateT = 0;
          g.mark = "?";
          g.markT = 1.4;
        }
      } else if (g.state === "look") {
        g.facing += dt * 2.4;
        if (g.stateT > 1.55) {
          g.state = "return";
          g.stateT = 0;
          const wp = g.waypoints[g.wi];
          g.flood = buildFlood(wp.x, wp.y);
        }
      } else if (g.state === "return") {
        const wp = g.waypoints[g.wi];
        const st = steerTo(g.x, g.y, wp.x, wp.y, g.flood, g.speed, dt, GUARD_R);
        g.x = st.x;
        g.y = st.y;
        if (st.ang != null) g.facing = lerpAng(g.facing, st.ang, clamp(dt * 7, 0, 1));
        if (st.arrived) {
          g.state = "patrol";
          g.stateT = 0;
          g.waitT = g.wait * 0.4;
          g.mark = "";
        }
      }
    }
  }

  function updateTitle(dt) {
    phantomT += dt;
    if (phantomT > 0.26) {
      phantomT = 0;
      phantomI++;
      const cols = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
      const span = cols.length - 1;
      const trip = phantomI % (span * 2);
      const idx = trip <= span ? trip : span * 2 - trip;
      const x = (cols[idx] + 1.5) * TILE;
      const y = (7 + 1.5) * TILE;
      emitPrint(x, y, 0.72, true);
      noisePulse = Math.max(noisePulse, 0.45);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.p += dt * 0.35;
      m.y -= m.v * dt * 0.12;
      if (m.y < 0) m.y += WORLD_H;
    }
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const bw = Math.round(cssW * dpr);
    const bh = Math.round(cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const scale = Math.min(cssW / WORLD_W, cssH / WORLD_H) * 0.97;
    view.scale = scale;
    view.ox = (cssW - WORLD_W * scale) / 2;
    view.oy = (cssH - WORLD_H * scale) / 2;
    view.cssW = cssW;
    view.cssH = cssH;
    view.dpr = dpr;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale
    };
  }

  function drawFloor() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (walls[r][c]) continue;
        const x = c * TILE;
        const y = r * TILE;
        if (carpet[r][c]) {
          const h = hash(c, r);
          ctx.fillStyle = h > 0.5 ? "#2a0820" : "#23061b";
          ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
          ctx.strokeStyle = "rgba(255,61,184,0.09)";
          ctx.lineWidth = 1;
          const off = (h * 4) | 0;
          for (let k = 3; k < TILE; k += 4) {
            ctx.beginPath();
            ctx.moveTo(x + 2, y + k + (off % 2));
            ctx.lineTo(x + TILE - 2, y + k + (off % 2));
            ctx.stroke();
          }
          const fringe = "rgba(255,61,184,0.28)";
          ctx.fillStyle = fringe;
          if (r === 0 || !carpet[r - 1][c] || walls[r - 1][c]) ctx.fillRect(x + 1, y, TILE - 2, 2);
          if (r === ROWS - 1 || !carpet[r + 1][c] || walls[r + 1][c]) ctx.fillRect(x + 1, y + TILE - 2, TILE - 2, 2);
          if (c === 0 || !carpet[r][c - 1] || walls[r][c - 1]) ctx.fillRect(x, y + 1, 2, TILE - 2);
          if (c === COLS - 1 || !carpet[r][c + 1] || walls[r][c + 1]) ctx.fillRect(x + TILE - 2, y + 1, 2, TILE - 2);
        } else {
          const h = hash(c + 3, r + 1);
          ctx.fillStyle = h > 0.62 ? "#0c0a16" : "#090712";
          ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
          ctx.strokeStyle = "rgba(0,240,255,0.055)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
          if (h > 0.82) {
            ctx.strokeStyle = "rgba(0,240,255,0.06)";
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 6);
            ctx.lineTo(x + TILE - 6, y + TILE - 5);
            ctx.stroke();
          }
        }
      }
    }
  }

  function drawWalls() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!walls[r][c]) continue;
        const x = c * TILE;
        const y = r * TILE;
        const tone = hash(c, r);
        ctx.fillStyle = tone > 0.5 ? "#140818" : "#100614";
        ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
        ctx.fillStyle = "rgba(8,4,14,0.55)";
        ctx.fillRect(x, y + TILE - 6, TILE + 0.5, 6);
        const mag = 0.18 + tone * 0.12;
        ctx.strokeStyle = "rgba(255,61,184," + mag + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (r === 0 || !walls[r - 1][c]) {
          ctx.moveTo(x + 1, y + 1.4);
          ctx.lineTo(x + TILE - 1, y + 1.4);
        }
        if (c === 0 || !walls[r][c - 1]) {
          ctx.moveTo(x + 1.4, y + 1);
          ctx.lineTo(x + 1.4, y + TILE - 1);
        }
        ctx.stroke();
        ctx.strokeStyle = "rgba(0,240,255,0.12)";
        ctx.beginPath();
        if (r === ROWS - 1 || !walls[r + 1][c]) {
          ctx.moveTo(x + 1, y + TILE - 1.4);
          ctx.lineTo(x + TILE - 1, y + TILE - 1.4);
        }
        ctx.stroke();
      }
    }
  }

  function drawExit() {
    const pulse = 0.6 + Math.sin(time * 4.1) * 0.4;
    ctx.save();
    ctx.translate(exit.x, exit.y);
    ctx.rotate(time * 0.55);
    ctx.strokeStyle = "rgba(0,240,255,0.85)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 12 + pulse * 2, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(-time * 1.3);
    ctx.strokeStyle = "rgba(255,227,107,0.65)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, 7.2, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,240,255," + (0.28 + 0.22 * pulse) + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(0,240,255,0.08)";
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, 22 + pulse * 6, 0, TAU);
    ctx.fill();
  }

  function drawPrints() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < prints.length; i++) {
      const p = prints[i];
      const fade = clamp(1 - p.age / p.life, 0, 1);
      const a0 = fade * p.amp;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2, p.r), 0, TAU);
      ctx.fillStyle = "rgba(0,240,255," + (0.08 * a0) + ")";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,240,255," + (0.82 * a0) + ")";
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.r * 0.7), 0, TAU);
      ctx.strokeStyle = "rgba(255,61,184," + (0.4 * a0) + ")";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      const n = 48;
      ctx.beginPath();
      let pen = false;
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * TAU + p.phase;
        const wob = Math.sin(a * 8 + p.phase * 3.2) * (4.2 * fade);
        const want = p.r + wob;
        const hit = march(p.x, p.y, a, want);
        if (hit.d < want - 5) {
          pen = false;
          continue;
        }
        if (!pen) {
          ctx.moveTo(hit.x, hit.y);
          pen = true;
        } else ctx.lineTo(hit.x, hit.y);
      }
      ctx.strokeStyle = "rgba(180,255,255," + (0.55 * a0) + ")";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCones() {
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      const alert = g.state === "spot" || g.state === "chase" || g.state === "hear";
      const rays = 26;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      for (let k = 0; k <= rays; k++) {
        const a = g.facing - g.fov + (k / rays) * g.fov * 2;
        const hit = march(g.x, g.y, a, g.range);
        ctx.lineTo(hit.x, hit.y);
      }
      ctx.closePath();
      const grd = ctx.createRadialGradient(g.x, g.y, 6, g.x, g.y, g.range);
      if (g.state === "spot") {
        grd.addColorStop(0, "rgba(255,61,184,0.34)");
        grd.addColorStop(1, "rgba(255,61,184,0.0)");
      } else if (alert) {
        grd.addColorStop(0, "rgba(255,227,107,0.26)");
        grd.addColorStop(1, "rgba(255,227,107,0.0)");
      } else {
        grd.addColorStop(0, "rgba(0,240,255,0.16)");
        grd.addColorStop(1, "rgba(0,240,255,0.0)");
      }
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.strokeStyle = alert ? "rgba(255,61,184,0.22)" : "rgba(0,240,255,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawGuards() {
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      const bob = Math.sin(g.bob) * 1.2;
      ctx.save();
      ctx.translate(g.x, g.y + bob);
      ctx.rotate(g.facing);
      ctx.fillStyle = "rgba(255,61,184,0.18)";
      ctx.beginPath();
      ctx.ellipse(2, 8, 7, 3.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#1a0a18";
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, 7);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, -7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = g.state === "spot" ? "#ff3db8" : "#00f0ff";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = g.state === "spot" ? "#ff3db8" : "#7af6ff";
      ctx.beginPath();
      ctx.arc(6, 0, 3.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#05030c";
      ctx.beginPath();
      ctx.arc(7.2, 0, 1.3, 0, TAU);
      ctx.fill();
      ctx.restore();

      if (g.markT > 0 && g.mark) {
        const a = clamp(g.markT / 0.4, 0, 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = g.mark === "!" ? "#ff3db8" : "#ffe36b";
        ctx.font = "700 14px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(g.mark, g.x, g.y - 20);
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawPlayer() {
    if (mode === "title") return;
    const bob = Math.sin(player.bob) * (player.moving ? 2.1 : 0.6);
    ctx.save();
    ctx.translate(player.x, player.y + bob);
    ctx.rotate(player.facing);
    ctx.fillStyle = "rgba(0,240,255,0.16)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 8, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ff3db8";
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_R - 1.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#05030c";
    ctx.beginPath();
    ctx.arc(3.2, 0, 2.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e8faff";
    ctx.beginPath();
    ctx.moveTo(PLAYER_R - 1, 0);
    ctx.lineTo(PLAYER_R + 5, -3);
    ctx.lineTo(PLAYER_R + 5, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (ending === "dead") {
      ctx.strokeStyle = "rgba(255,61,184,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_R + 6 + Math.sin(time * 18) * 2, 0, TAU);
      ctx.stroke();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = "rgba(" + p.rgb + "," + (0.85 * a) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = "rgba(0,240,255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(m.x + Math.sin(m.p) * 8, m.y, m.s, 0, TAU);
      ctx.fill();
    }
  }

  function drawVignette() {
    const grd = ctx.createRadialGradient(
      WORLD_W * 0.5, WORLD_H * 0.5, WORLD_H * 0.28,
      WORLD_W * 0.5, WORLD_H * 0.5, WORLD_H * 0.78
    );
    grd.addColorStop(0, "rgba(5,3,12,0)");
    grd.addColorStop(1, "rgba(5,3,12,0.46)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    if (flash > 0) {
      ctx.fillStyle = "rgba(255,61,184," + (0.22 * flash) + ")";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
  }

  function draw() {
    layout();
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, view.cssW, view.cssH);

    ctx.save();
    ctx.translate(view.ox, view.oy);
    if (shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    ctx.scale(view.scale, view.scale);

    ctx.fillStyle = "#07050f";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    drawFloor();
    drawPrints();
    drawCones();
    drawWalls();
    drawExit();
    drawGuards();
    drawPlayer();
    drawParticles();
    drawVignette();
    ctx.restore();
  }

  function update(dt) {
    if (paused) return;
    time += dt;
    shake = Math.max(0, shake - dt * 26);
    flash = Math.max(0, flash - dt * 1.8);
    noisePulse = Math.max(0, noisePulse - dt * 1.55);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }
    if (mode === "title") updateTitle(dt);
    updatePlayer(dt);
    updatePrints(dt);
    updateGuards(dt);
    updateParticles(dt);
    SFX.tickDrone(noisePulse > 0.2 || mode === "play");
    renderHud();
  }

  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function overlayActionKey(e) {
    if (e.repeat) return;
    overlayAction();
  }

  window.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    keys[e.key] = true;
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      toggleMute();
      return;
    }
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      retry();
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!overlay.classList.contains("hidden")) overlayActionKey(e);
      return;
    }
    const move = e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight" ||
      e.key === "w" || e.key === "a" || e.key === "s" || e.key === "d" ||
      e.key === "W" || e.key === "A" || e.key === "S" || e.key === "D";
    if (move) e.preventDefault();
  });

  window.addEventListener("keyup", function (e) {
    keys[e.key] = false;
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (mode !== "play" || frozen) return;
    if (e.button && e.button !== 0) return;
    pointer.down = true;
    pointer.steering = true;
    pointer.id = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.steering) return;
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
  });

  function endPointer(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.steering = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("lostpointercapture", endPointer);

  ovBtn.addEventListener("click", function () {
    SFX.ensure();
    overlayAction();
  });
  btnRetry.addEventListener("click", function () {
    SFX.ensure();
    retry();
  });
  btnMute.addEventListener("click", function () {
    SFX.ensure();
    toggleMute();
  });

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (!paused) last = performance.now();
  });

  window.addEventListener("resize", layout);

  loadTitle();
  layout();
  requestAnimationFrame(frame);
})();
