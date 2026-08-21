(() => {
  "use strict";

  const TILE = 32;
  const INNER_W = 28;
  const INNER_H = 14;
  const COLS = INNER_W + 2;
  const ROWS = INNER_H + 2;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;

  const FADE = 0.72;
  const PING_SPEED = 640;
  const PING_COOL = 0.55;
  const PLAYER_R = 10;
  const PLAYER_SPEED = 158;
  const MOVER_R = 9;
  const MOVER_SPEED = 78;
  const PROX = 46;
  const EXIT_PROX = 76;
  const TAP_MS = 220;
  const TAP_PX = 14;

  const D = (n) => ".".repeat(n);
  const H = (n) => "#".repeat(n);
  const Z = (n) => "!".repeat(n);

  const STAGES = [
    {
      name: "初响",
      sub: "FIRST",
      pings: 5,
      inner: [
        "P" + D(27),
        D(28),
        H(27) + ".",
        H(27) + ".",
        H(27) + ".",
        H(27) + ".",
        H(27) + ".",
        H(27) + ".",
        D(28),
        "X" + D(27),
        H(28),
        H(28),
        H(28),
        H(28)
      ]
    },
    {
      name: "折廊",
      sub: "BEND",
      pings: 5,
      inner: [
        "P" + D(27),
        H(27) + ".",
        D(28),
        "." + H(27),
        D(28),
        H(27) + ".",
        D(28),
        "." + H(27),
        D(28),
        H(27) + ".",
        D(28),
        "." + H(27),
        D(27) + "X",
        D(28)
      ]
    },
    {
      name: "刺径",
      sub: "THORN",
      pings: 6,
      inner: [
        "P" + D(27),
        D(28),
        D(2) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(6),
        D(2) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(6),
        D(28),
        D(4) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(4),
        D(4) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(4),
        D(28),
        D(2) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(6),
        D(2) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(4) + Z(2) + D(6),
        D(28),
        D(28),
        D(27) + "X",
        D(28)
      ]
    },
    {
      name: "盲井",
      sub: "WELL",
      pings: 5,
      inner: [
        "P" + D(4) + H(3) + D(17) + H(3),
        D(5) + H(3) + D(17) + H(3),
        D(5) + H(3) + D(17) + H(3),
        D(28),
        H(3) + D(6) + H(10) + D(6) + H(3),
        H(3) + D(6) + H(10) + D(6) + H(3),
        D(3) + Z(4) + D(14) + Z(4) + D(3),
        D(3) + Z(4) + D(14) + Z(4) + D(3),
        H(3) + D(6) + H(10) + D(6) + H(3),
        H(3) + D(6) + H(10) + D(6) + H(3),
        D(28),
        D(1) + H(3) + D(17) + H(3) + D(4),
        D(1) + H(3) + D(17) + H(3) + D(3) + "X",
        D(1) + H(3) + D(17) + H(3) + D(4)
      ]
    },
    {
      name: "游影",
      sub: "DRIFT",
      pings: 7,
      inner: [
        "P" + D(12) + H(2) + D(13),
        D(13) + H(2) + D(13),
        D(1) + ">" + D(11) + H(2) + D(11) + "<" + D(1),
        D(13) + H(2) + D(13),
        D(28),
        H(5) + D(17) + H(6),
        D(28),
        D(5) + ">" + D(15) + "<" + D(6),
        D(28),
        H(6) + D(17) + H(5),
        D(28),
        D(13) + H(2) + D(13),
        D(13) + H(2) + D(12) + "X",
        D(13) + H(2) + D(13)
      ]
    },
    {
      name: "窄隙",
      sub: "GAP",
      pings: 5,
      inner: [
        "P" + D(27),
        H(27) + ".",
        D(28),
        "." + H(27),
        D(28),
        H(27) + ".",
        D(28),
        "." + H(27),
        D(28),
        H(27) + ".",
        D(28),
        "." + H(26) + "!",
        "X" + D(27),
        Z(28)
      ]
    },
    {
      name: "双潮",
      sub: "TIDE",
      pings: 6,
      inner: [
        "P" + D(12) + "#" + D(14),
        D(13) + "#" + D(14),
        D(1) + ">" + D(11) + "#" + D(1) + "<" + D(12),
        D(13) + "#" + D(14),
        D(13) + "#" + D(14),
        D(13) + "#" + D(14),
        D(13) + "#" + D(14),
        D(28),
        D(13) + "#" + D(14),
        D(13) + "#" + D(14),
        D(1) + ">" + D(11) + "#" + D(1) + "<" + D(12),
        D(13) + "#" + D(14),
        D(13) + "#" + D(13) + "X",
        D(13) + "#" + D(14)
      ]
    },
    {
      name: "终响",
      sub: "LAST",
      pings: 5,
      inner: [
        "P" + D(12) + "#" + D(4) + Z(4) + D(6),
        D(13) + "#" + D(14),
        D(1) + ">" + D(11) + "#" + D(14),
        D(13) + "#" + D(14),
        H(4) + D(5) + H(4) + "#" + D(6) + H(4) + D(4),
        D(13) + "#" + D(14),
        D(2) + "v" + D(10) + "#" + D(14),
        D(28),
        D(13) + "#" + D(14),
        D(13) + "#" + D(1) + "<" + D(12),
        D(4) + Z(4) + D(5) + "#" + D(14),
        D(13) + "#" + D(14),
        D(13) + "#" + D(9) + Z(3) + "X" + D(1),
        D(13) + "#" + D(14)
      ]
    }
  ];

  const TITLE_INNER = [
    D(6) + H(16) + D(6),
    D(4) + H(2) + D(16) + H(2) + D(4),
    D(2) + H(2) + D(20) + H(2) + D(2),
    D(1) + "#" + D(24) + "#" + D(1),
    "#" + D(8) + H(10) + D(8) + "#",
    "#" + D(7) + H(2) + D(8) + H(2) + D(7) + "#",
    D(7) + "#" + D(12) + "#" + D(7),
    D(6) + "#" + D(14) + "#" + D(6),
    D(6) + "#" + D(14) + "#" + D(6),
    D(7) + "#" + D(12) + "#" + D(7),
    "#" + D(7) + H(2) + D(8) + H(2) + D(7) + "#",
    "#" + D(8) + H(10) + D(8) + "#",
    D(1) + "#" + D(11) + "X" + D(12) + "#" + D(1),
    D(2) + H(2) + D(20) + H(2) + D(2)
  ];

  function wrapInner(inner) {
    if (inner.length !== INNER_H) throw new Error("rows " + inner.length);
    for (let i = 0; i < inner.length; i++) {
      if (inner[i].length !== INNER_W) {
        throw new Error("row " + i + " len " + inner[i].length + " " + inner[i]);
      }
    }
    const bar = H(INNER_W + 2);
    return [bar].concat(inner.map((r) => "#" + r + "#"), [bar]);
  }

  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function fadeVis(age) {
    if (age < 0 || age > FADE) return 0;
    const t = 1 - age / FADE;
    return t * t * (3 - 2 * t);
  }

  function validateStages() {
    STAGES.forEach((s, si) => {
      const grid = wrapInner(s.inner);
      let p = 0, x = 0;
      const floor = [];
      let pc = 0, pr = 0, xc = 0, xr = 0;
      for (let r = 0; r < ROWS; r++) {
        floor[r] = [];
        for (let c = 0; c < COLS; c++) {
          const ch = grid[r][c];
          const isWall = ch === "#";
          floor[r][c] = !isWall;
          if (ch === "P") { p++; pc = c; pr = r; }
          if (ch === "X") { x++; xc = c; xr = r; }
        }
      }
      if (p !== 1 || x !== 1) throw new Error("stage " + si + " P/X " + p + "/" + x);
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      function reachable(blockSpikes) {
        const seen = new Uint8Array(COLS * ROWS);
        const q = [pr * COLS + pc];
        seen[pr * COLS + pc] = 1;
        let qi = 0;
        while (qi < q.length) {
          const u = q[qi++];
          const c = u % COLS, r = (u / COLS) | 0;
          for (let d = 0; d < 4; d++) {
            const nc = c + dirs[d][0], nr = r + dirs[d][1];
            if (!inb(nc, nr) || !floor[nr][nc]) continue;
            if (blockSpikes && grid[nr][nc] === "!") continue;
            const v = nr * COLS + nc;
            if (seen[v]) continue;
            seen[v] = 1;
            q.push(v);
          }
        }
        return !!seen[xr * COLS + xc];
      }
      if (!reachable(false)) throw new Error("stage " + si + " unreachable");
      if (!reachable(true)) throw new Error("stage " + si + " no safe path");
    });
    wrapInner(TITLE_INNER);
  }

  if (typeof document === "undefined") {
    validateStages();
    console.log("echo-ping maps ok", STAGES.length);
    return;
  }

  validateStages();

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.getElementById("overlay");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovLead = document.getElementById("ov-lead");
  const ovOps = document.getElementById("ov-ops");
  const ovBtn = document.getElementById("ov-btn");
  const stageLabel = document.getElementById("stage-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnPing = document.getElementById("btn-ping");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const stageEl = document.getElementById("stage");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "拖拽移动 · 点按或点「声波」发声 · 贴墙有微光";
  }

  const keys = Object.create(null);
  const pointer = {
    down: false,
    steering: false,
    id: null,
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    t: 0
  };

  const SFX = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.85;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = this.ctx.sampleRate * dur;
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
    ping() {
      this.ensure();
      this.beep(1180, 0.38, "sine", 0.11, 180);
      this.beep(1760, 0.18, "triangle", 0.04, 420);
    },
    deny() {
      this.ensure();
      this.beep(140, 0.12, "square", 0.04, 90);
    },
    die() {
      this.ensure();
      this.noise(0.18, 0.12);
      this.beep(320, 0.45, "sawtooth", 0.08, 70);
    },
    clear() {
      this.ensure();
      this.beep(520, 0.16, "sine", 0.08, 780);
      setTimeout(() => this.beep(780, 0.22, "sine", 0.08, 1040), 90);
    },
    win() {
      this.ensure();
      this.beep(440, 0.2, "sine", 0.08, 660);
      setTimeout(() => this.beep(660, 0.22, "sine", 0.08, 880), 110);
      setTimeout(() => this.beep(880, 0.4, "sine", 0.1, 1320), 230);
    }
  };

  try {
    if (localStorage.getItem("echo-ping-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
  }
  syncMuteBtn();

  let mode = "title";
  let stageIndex = 0;
  let walls;
  let floor;
  let lastHit;
  let player = { x: 0, y: 0, trail: [] };
  let exit = { x: 0, y: 0, lastHit: -99 };
  let spikes = [];
  let movers = [];
  let pings = [];
  let particles = [];
  let pingsLeft = 0;
  let pingsMax = 0;
  let cooldown = 0;
  let time = 0;
  let shake = 0;
  let overlayKind = "title";
  let toastT = 0;
  let autoPingT = -1;
  let frozen = false;
  let runId = 0;
  let ending = null;
  let view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };

  function parseGrid(inner, spawnPlayer) {
    const grid = wrapInner(inner);
    walls = [];
    floor = [];
    lastHit = new Float32Array(COLS * ROWS);
    lastHit.fill(-99);
    spikes = [];
    movers = [];
    pings = [];
    particles = [];
    let foundP = false;
    let foundX = false;
    for (let r = 0; r < ROWS; r++) {
      walls[r] = [];
      floor[r] = [];
      for (let c = 0; c < COLS; c++) {
        const ch = grid[r][c];
        const isWall = ch === "#";
        walls[r][c] = isWall;
        floor[r][c] = !isWall;
        const cx = (c + 0.5) * TILE;
        const cy = (r + 0.5) * TILE;
        if (ch === "P") {
          foundP = true;
          if (spawnPlayer) {
            player.x = cx;
            player.y = cy;
            player.trail = [];
          }
        } else if (ch === "X") {
          foundX = true;
          exit.x = cx;
          exit.y = cy;
          exit.lastHit = -99;
        } else if (ch === "!") {
          spikes.push({ c, r, lastHit: -99 });
        } else if (ch === ">" || ch === "<" || ch === "^" || ch === "v") {
          const dir = ch === ">" ? [1, 0] : ch === "<" ? [-1, 0] : ch === "^" ? [0, -1] : [0, 1];
          movers.push({
            x: cx,
            y: cy,
            vx: dir[0],
            vy: dir[1],
            lastHit: -99
          });
        }
      }
    }
    if (!foundX) {
      exit.x = WORLD_W * 0.5;
      exit.y = WORLD_H * 0.5;
    }
    if (!foundP && spawnPlayer) {
      player.x = TILE * 2;
      player.y = TILE * 2;
    }
  }

  function buildPingField(ox, oy) {
    const n = COLS * ROWS;
    const dist = new Float32Array(n);
    dist.fill(1e10);
    const open = [];
    const inOpen = new Uint8Array(n);
    const c0 = clamp(Math.floor(ox / TILE), 0, COLS - 1);
    const r0 = clamp(Math.floor(oy / TILE), 0, ROWS - 1);
    for (let r = r0 - 1; r <= r0 + 1; r++) {
      for (let c = c0 - 1; c <= c0 + 1; c++) {
        if (!inb(c, r) || walls[r][c]) continue;
        const cx = (c + 0.5) * TILE;
        const cy = (r + 0.5) * TILE;
        const i = r * COLS + c;
        dist[i] = Math.hypot(cx - ox, cy - oy);
        open.push(i);
        inOpen[i] = 1;
      }
    }
    if (!open.length) {
      const i = r0 * COLS + c0;
      dist[i] = 0;
      open.push(i);
      inOpen[i] = 1;
    }
    while (open.length) {
      let mi = 0;
      let md = dist[open[0]];
      for (let k = 1; k < open.length; k++) {
        const dv = dist[open[k]];
        if (dv < md) { md = dv; mi = k; }
      }
      const u = open[mi];
      open[mi] = open[open.length - 1];
      open.pop();
      inOpen[u] = 0;
      const c = u % COLS;
      const r = (u / COLS) | 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nc = c + dc, nr = r + dr;
          if (!inb(nc, nr) || walls[nr][nc]) continue;
          if (dc && dr && (walls[r][nc] || walls[nr][c])) continue;
          const nd = dist[u] + Math.hypot(dc, dr) * TILE;
          const v = nr * COLS + nc;
          if (nd < dist[v] - 0.01) {
            dist[v] = nd;
            if (!inOpen[v]) {
              open.push(v);
              inOpen[v] = 1;
            }
          }
        }
      }
    }
    const wdist = new Float32Array(n);
    wdist.fill(1e10);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!walls[r][c]) continue;
        let best = 1e10;
        for (let d = 0; d < 4; d++) {
          const nc = c + dirs[d][0], nr = r + dirs[d][1];
          if (!inb(nc, nr) || walls[nr][nc]) continue;
          const dv = dist[nr * COLS + nc] + TILE * 0.45;
          if (dv < best) best = dv;
        }
        wdist[r * COLS + c] = best;
      }
    }
    const wq = [];
    for (let i = 0; i < n; i++) if (wdist[i] < 1e9) wq.push(i);
    let qi = 0;
    while (qi < wq.length) {
      const u = wq[qi++];
      const c = u % COLS, r = (u / COLS) | 0;
      for (let d = 0; d < 4; d++) {
        const nc = c + dirs[d][0], nr = r + dirs[d][1];
        if (!inb(nc, nr) || !walls[nr][nc]) continue;
        const v = nr * COLS + nc;
        const nd = wdist[u] + TILE * 0.55;
        if (nd < wdist[v]) {
          wdist[v] = nd;
          wq.push(v);
        }
      }
    }
    return { dist, wdist };
  }

  function visAt(last, t) {
    return fadeVis(t - last);
  }

  function wallVis(c, r, t) {
    let v = visAt(lastHit[r * COLS + c], t);
    const cx = (c + 0.5) * TILE;
    const cy = (r + 0.5) * TILE;
    const pd = Math.hypot(cx - player.x, cy - player.y);
    if (pd < PROX) v = Math.max(v, (1 - pd / PROX) * 0.28);
    return v;
  }

  function burst(x, y, rgb, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spd * (0.25 + Math.random());
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: 0.35 + Math.random() * 0.45,
        rgb,
        r: 1.1 + Math.random() * 2.1
      });
    }
  }

  function firePing(free) {
    if (frozen) return;
    if (mode === "title" && !free) return;
    if (mode !== "play" && mode !== "title") return;
    if (!free) {
      if (cooldown > 0) return;
      if (pingsLeft <= 0) {
        SFX.deny();
        shake = Math.max(shake, 2.5);
        return;
      }
      pingsLeft--;
      renderHud();
      cooldown = PING_COOL;
    }
    const field = buildPingField(player.x, player.y);
    pings.push({
      x: player.x,
      y: player.y,
      r: 0,
      dist: field.dist,
      wdist: field.wdist,
      maxR: 1400
    });
    SFX.ping();
    shake = Math.max(shake, 1.8);
    burst(player.x, player.y, "0,240,255", 10, 90);
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
    if (circleHitsWall(nx, ny, r)) return { x, y };
    return { x: nx, y: ny };
  }

  function hitsSpike(x, y, rad) {
    const inset = 6;
    for (let i = 0; i < spikes.length; i++) {
      const s = spikes[i];
      const x0 = s.c * TILE + inset;
      const y0 = s.r * TILE + inset;
      const x1 = (s.c + 1) * TILE - inset;
      const y1 = (s.r + 1) * TILE - inset;
      const nx = clamp(x, x0, x1);
      const ny = clamp(y, y0, y1);
      const dx = x - nx, dy = y - ny;
      if (dx * dx + dy * dy < rad * rad) return true;
    }
    return false;
  }

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove("hidden");
    toastT = 1.35;
  }

  function renderHud() {
    if (mode === "title") {
      stageLabel.textContent = "黑暗里听路";
    } else {
      const s = STAGES[stageIndex];
      stageLabel.textContent = (stageIndex + 1) + " / 8　" + s.name;
    }
    pipsEl.innerHTML = "";
    const max = Math.max(pingsMax, 1);
    for (let i = 0; i < max; i++) {
      const pip = document.createElement("span");
      pip.className = "pip";
      if (i < pingsLeft) {
        pip.classList.add("on");
        if (pingsLeft <= 2 && mode === "play") pip.classList.add("warn");
      }
      pipsEl.appendChild(pip);
    }
    if (mode === "play" && pingsLeft === 0) {
      const note = document.createElement("span");
      note.className = "pip empty-note";
      note.style.width = "auto";
      note.style.border = "0";
      note.style.fontSize = "10px";
      note.style.letterSpacing = "0.12em";
      note.style.color = "#ff3db8";
      note.textContent = "凭记忆";
      pipsEl.appendChild(note);
    }
  }

  function setOverlay(kind) {
    overlayKind = kind;
    overlay.classList.remove("hidden");
    if (kind === "title") {
      ovKicker.textContent = "PING";
      ovTitle.textContent = "回声";
      ovLead.textContent = "世界是黑的。发出声波，墙与危险亮起一瞬，随即没入暗处。在有限的回声里，走到出口。";
      ovOps.textContent = coarse
        ? "拖拽移动 · 点按或右上「声波」发声 · 共八关"
        : "WASD / 方向键移动 · 空格或点按发声波 · 拖拽也可移动 · M 静音";
      ovBtn.textContent = "开始";
    } else if (kind === "dead") {
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "被暗处吞没";
      ovLead.textContent = "尖刺与游影在看不见的地方仍旧有牙。再听一次。";
      ovOps.textContent = "本关声波会补满。";
      ovBtn.textContent = "重试本关";
    } else if (kind === "clear") {
      ovKicker.textContent = "ECHO";
      ovTitle.textContent = "回响抵达";
      ovLead.textContent = "声波撞上了门。还剩 " + (8 - stageIndex - 1) + " 关黑暗。";
      ovOps.textContent = "";
      ovBtn.textContent = "下一关";
    } else if (kind === "win") {
      ovKicker.textContent = "SILENCE";
      ovTitle.textContent = "八声落定";
      ovLead.textContent = "夜不再说话。你把路记在了骨头里。";
      ovOps.textContent = "";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function revealAll() {
    lastHit.fill(time);
    for (let i = 0; i < spikes.length; i++) spikes[i].lastHit = time;
    for (let i = 0; i < movers.length; i++) movers[i].lastHit = time;
    exit.lastHit = time;
  }

  function loadTitle() {
    runId++;
    mode = "title";
    frozen = false;
    ending = null;
    shake = 0;
    parseGrid(TITLE_INNER, true);
    player.x = WORLD_W * 0.5;
    player.y = WORLD_H * 0.5;
    pingsLeft = 0;
    pingsMax = 0;
    cooldown = 0;
    autoPingT = 0.35;
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
    parseGrid(s.inner, true);
    pingsLeft = s.pings;
    pingsMax = s.pings;
    cooldown = 0.15;
    autoPingT = i === 0 ? 0.4 : -1;
    hideOverlay();
    renderHud();
    showToast((i + 1) + " / 8　" + s.name);
  }

  function kill() {
    if (frozen || mode !== "play") return;
    frozen = true;
    ending = "dead";
    const id = runId;
    SFX.die();
    shake = 10;
    revealAll();
    burst(player.x, player.y, "255,61,184", 28, 160);
    setTimeout(() => {
      if (id !== runId) return;
      mode = "dead";
      setOverlay("dead");
    }, 520);
  }

  function reachExit() {
    if (frozen || mode !== "play") return;
    frozen = true;
    ending = "exit";
    const id = runId;
    revealAll();
    burst(exit.x, exit.y, "0,240,255", 22, 130);
    burst(player.x, player.y, "255,227,107", 10, 70);
    if (stageIndex >= STAGES.length - 1) {
      SFX.win();
      setTimeout(() => {
        if (id !== runId) return;
        mode = "win";
        setOverlay("win");
      }, 700);
    } else {
      SFX.clear();
      setTimeout(() => {
        if (id !== runId) return;
        mode = "clear";
        setOverlay("clear");
      }, 620);
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
    try { localStorage.setItem("echo-ping-mute", SFX.muted ? "1" : "0"); } catch (_) { /* ignore */ }
    if (SFX.master) SFX.master.gain.value = SFX.muted ? 0 : 0.85;
    syncMuteBtn();
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
    const scale = Math.min(cssW / WORLD_W, cssH / WORLD_H) * 0.965;
    view = {
      scale,
      ox: (cssW - WORLD_W * scale) / 2,
      oy: (cssH - WORLD_H * scale) / 2,
      cssW,
      cssH,
      dpr
    };
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale
    };
  }

  function updatePings(dt) {
    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i];
      const prev = p.r;
      p.r += PING_SPEED * dt;
      const n = COLS * ROWS;
      for (let k = 0; k < n; k++) {
        const d = walls[(k / COLS) | 0][k % COLS] ? p.wdist[k] : p.dist[k];
        if (prev < d && p.r >= d) {
          lastHit[k] = time;
          if (walls[(k / COLS) | 0][k % COLS] && Math.random() < 0.07) {
            const c = k % COLS, r = (k / COLS) | 0;
            burst((c + 0.5) * TILE, (r + 0.5) * TILE, "0,240,255", 1, 40);
          }
        }
      }
      for (let s = 0; s < spikes.length; s++) {
        const sp = spikes[s];
        const d = p.dist[sp.r * COLS + sp.c];
        if (prev < d && p.r >= d) sp.lastHit = time;
      }
      for (let m = 0; m < movers.length; m++) {
        const mv = movers[m];
        const mc = clamp(Math.floor(mv.x / TILE), 0, COLS - 1);
        const mr = clamp(Math.floor(mv.y / TILE), 0, ROWS - 1);
        const d = p.dist[mr * COLS + mc];
        if (prev < d && p.r >= d) mv.lastHit = time;
      }
      const edc = clamp(Math.floor(exit.x / TILE), 0, COLS - 1);
      const edr = clamp(Math.floor(exit.y / TILE), 0, ROWS - 1);
      const ed = p.dist[edr * COLS + edc];
      if (prev < ed && p.r >= ed) exit.lastHit = time;
      if (p.r > p.maxR) pings.splice(i, 1);
    }
  }

  function updateMovers(dt) {
    for (let i = 0; i < movers.length; i++) {
      const m = movers[i];
      const step = MOVER_SPEED * dt;
      const nx = m.x + m.vx * step;
      const ny = m.y + m.vy * step;
      if (circleHitsWall(nx, ny, MOVER_R + 1)) {
        m.vx *= -1;
        m.vy *= -1;
        const bx = m.x + m.vx * step;
        const by = m.y + m.vy * step;
        if (!circleHitsWall(bx, by, MOVER_R + 1)) {
          m.x = bx;
          m.y = by;
        }
      } else {
        m.x = nx;
        m.y = ny;
      }
    }
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
      if (len > 10) {
        ax = dx / len;
        ay = dy / len;
      }
    }
    const len = Math.hypot(ax, ay);
    if (len > 0) {
      const sp = PLAYER_SPEED * dt;
      const moved = moveCircle(player.x, player.y, (ax / len) * sp, (ay / len) * sp, PLAYER_R);
      player.x = moved.x;
      player.y = moved.y;
    }
    player.trail.push({ x: player.x, y: player.y, t: time });
    if (player.trail.length > 10) player.trail.shift();

    if (hitsSpike(player.x, player.y, PLAYER_R - 1)) {
      kill();
      return;
    }
    for (let i = 0; i < movers.length; i++) {
      const m = movers[i];
      if (Math.hypot(m.x - player.x, m.y - player.y) < PLAYER_R + MOVER_R - 1) {
        kill();
        return;
      }
    }
    if (Math.hypot(exit.x - player.x, exit.y - player.y) < PLAYER_R + 12) reachExit();
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
  }

  function drawWalls() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!walls[r][c]) continue;
        const a = wallVis(c, r, time);
        if (a < 0.02) continue;
        const x = c * TILE;
        const y = r * TILE;
        const tone = (Math.sin(c * 0.55 + r * 0.31) + 1) * 0.5;
        const cr = (255 * tone + 0 * (1 - tone)) | 0;
        const cg = (61 * tone + 240 * (1 - tone)) | 0;
        const cb = (184 * tone + 255 * (1 - tone)) | 0;
        ctx.fillStyle = "rgba(" + cr + "," + cg + "," + cb + "," + (0.16 * a) + ")";
        ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
        ctx.strokeStyle = "rgba(" + cr + "," + cg + "," + cb + "," + (0.55 + 0.45 * a) * a + ")";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        if (!inb(c, r - 1) || !walls[r - 1][c]) {
          ctx.moveTo(x + 1.5, y + 1.2);
          ctx.lineTo(x + TILE - 1.5, y + 1.2);
        }
        if (!inb(c, r + 1) || !walls[r + 1][c]) {
          ctx.moveTo(x + 1.5, y + TILE - 1.2);
          ctx.lineTo(x + TILE - 1.5, y + TILE - 1.2);
        }
        if (!inb(c - 1, r) || !walls[r][c - 1]) {
          ctx.moveTo(x + 1.2, y + 1.5);
          ctx.lineTo(x + 1.2, y + TILE - 1.5);
        }
        if (!inb(c + 1, r) || !walls[r][c + 1]) {
          ctx.moveTo(x + TILE - 1.2, y + 1.5);
          ctx.lineTo(x + TILE - 1.2, y + TILE - 1.5);
        }
        ctx.stroke();
      }
    }
  }

  function drawSpikes() {
    for (let i = 0; i < spikes.length; i++) {
      const s = spikes[i];
      let a = visAt(s.lastHit, time);
      const cx = (s.c + 0.5) * TILE;
      const cy = (s.r + 0.5) * TILE;
      const pd = Math.hypot(cx - player.x, cy - player.y);
      if (pd < PROX) a = Math.max(a, (1 - pd / PROX) * 0.22);
      if (a < 0.03) continue;
      const x = s.c * TILE;
      const y = s.r * TILE;
      ctx.fillStyle = "rgba(255,61,184," + (0.82 * a) + ")";
      ctx.beginPath();
      ctx.moveTo(x + 6, y + TILE - 5);
      ctx.lineTo(x + TILE * 0.5, y + 5);
      ctx.lineTo(x + TILE - 6, y + TILE - 5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 10, y + TILE - 5);
      ctx.lineTo(x + TILE * 0.38, y + 12);
      ctx.lineTo(x + TILE * 0.5, y + TILE - 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawMovers() {
    for (let i = 0; i < movers.length; i++) {
      const m = movers[i];
      let a = visAt(m.lastHit, time);
      const pd = Math.hypot(m.x - player.x, m.y - player.y);
      if (pd < PROX * 0.85) a = Math.max(a, (1 - pd / (PROX * 0.85)) * 0.18);
      if (a < 0.03) continue;
      ctx.beginPath();
      ctx.arc(m.x, m.y, MOVER_R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,61,184," + (0.75 * a) + ")";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,180,220," + (0.9 * a) + ")";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(m.x + m.vx * 3, m.y + m.vy * 3, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + (0.85 * a) + ")";
      ctx.fill();
    }
  }

  function drawExit() {
    let a = visAt(exit.lastHit, time);
    const pd = Math.hypot(exit.x - player.x, exit.y - player.y);
    if (pd < EXIT_PROX) a = Math.max(a, (1 - pd / EXIT_PROX) * 0.42);
    if (mode === "title") a = Math.max(a, 0.18);
    if (a < 0.03) return;
    const pulse = 0.6 + Math.sin(time * 4.2) * 0.4;
    ctx.save();
    ctx.translate(exit.x, exit.y);
    ctx.rotate(time * 0.7);
    ctx.strokeStyle = "rgba(0,240,255," + (0.85 * a) + ")";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 11 + pulse * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(-time * 1.4);
    ctx.strokeStyle = "rgba(255,227,107," + (0.7 * a) + ")";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,240,255," + (0.35 * a * pulse) + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPings() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < pings.length; i++) {
      const p = pings[i];
      const life = clamp(1 - p.r / 1100, 0, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.r), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,240,255," + (0.45 * life) + ")";
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.r * 0.86), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,61,184," + (0.22 * life) + ")";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (mode === "title") {
      ctx.beginPath();
      ctx.arc(player.x, player.y, 4 + Math.sin(time * 3) * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,240,255,0.55)";
      ctx.fill();
      return;
    }
    for (let i = 0; i < player.trail.length; i++) {
      const tr = player.trail[i];
      const a = (i + 1) / player.trail.length * 0.22;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,240,255," + a + ")";
      ctx.fill();
    }
    const g = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, 36);
    g.addColorStop(0, "rgba(0,240,255,0.28)");
    g.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
    ctx.fillStyle = frozen ? "rgba(255,61,184,0.85)" : "#e8ffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (mode === "play" && !frozen) {
      const ready = 1 - clamp(cooldown / PING_COOL, 0, 1);
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_R + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ready);
      ctx.strokeStyle = ready >= 1 ? "rgba(0,240,255,0.55)" : "rgba(255,61,184,0.55)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + p.rgb + "," + a + ")";
      ctx.fill();
    }
  }

  function draw() {
    layout();
    const { dpr, cssW, cssH, scale, ox, oy } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, cssW, cssH);

    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    ctx.save();
    ctx.translate(ox + sx, oy + sy);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.rect(0, 0, WORLD_W, WORLD_H);
    ctx.clip();
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    const lantern = ctx.createRadialGradient(player.x, player.y, 6, player.x, player.y, 52);
    lantern.addColorStop(0, "rgba(0,240,255,0.07)");
    lantern.addColorStop(1, "rgba(5,3,12,0)");
    ctx.fillStyle = lantern;
    ctx.fillRect(player.x - 60, player.y - 60, 120, 120);

    drawWalls();
    drawSpikes();
    drawMovers();
    drawExit();
    drawPings();
    drawParticles();
    drawPlayer();

    ctx.restore();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "rgba(0,240,255,0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox - 0.5, oy - 0.5, WORLD_W * scale + 1, WORLD_H * scale + 1);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    time += dt;
    cooldown = Math.max(0, cooldown - dt);
    shake *= Math.max(0, 1 - dt * 8);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }
    if (autoPingT >= 0) {
      autoPingT -= dt;
      if (autoPingT < 0) {
        firePing(true);
        if (mode === "title") autoPingT = 2.15;
      }
    }
    if (mode === "play" && !frozen) {
      updatePlayer(dt);
      updateMovers(dt);
    } else if (mode === "play" && ending === "exit") {
      player.x += (exit.x - player.x) * Math.min(1, dt * 8);
      player.y += (exit.y - player.y) * Math.min(1, dt * 8);
    } else if (mode === "title") {
      updateMovers(dt);
    }
    updatePings(dt);
    updateParticles(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
    }
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      if (e.repeat) return;
      if (!overlay.classList.contains("hidden")) overlayAction();
      else firePing(false);
    } else if (e.key === "Enter") {
      if (!overlay.classList.contains("hidden")) overlayAction();
    } else if (e.key === "m" || e.key === "M") {
      toggleMute();
    } else if (e.key === "r" || e.key === "R") {
      if (overlay.classList.contains("hidden") || overlayKind === "dead") retry();
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  function onPointerDown(e) {
    if (e.target.closest("button")) return;
    if (!overlay.classList.contains("hidden")) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    pointer.down = true;
    pointer.steering = false;
    pointer.id = e.pointerId;
    pointer.t = performance.now();
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.sx = e.clientX;
    pointer.sy = e.clientY;
    try { stageEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  }

  function onPointerMove(e) {
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    const dist = Math.hypot(e.clientX - pointer.sx, e.clientY - pointer.sy);
    if (dist > TAP_PX) pointer.steering = true;
  }

  function onPointerUp(e) {
    if (!pointer.down) return;
    if (pointer.id !== null && e.pointerId !== pointer.id) return;
    const dt = performance.now() - pointer.t;
    const dist = Math.hypot(e.clientX - pointer.sx, e.clientY - pointer.sy);
    const wasTap = !pointer.steering && dt < TAP_MS && dist < TAP_PX * 1.6;
    pointer.down = false;
    pointer.steering = false;
    pointer.id = null;
    if (wasTap) firePing(false);
  }

  stageEl.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  ovBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    overlayAction();
  });
  btnPing.addEventListener("click", (e) => {
    e.stopPropagation();
    SFX.ensure();
    firePing(false);
  });
  btnMute.addEventListener("click", (e) => {
    e.stopPropagation();
    SFX.ensure();
    toggleMute();
  });
  btnRetry.addEventListener("click", (e) => {
    e.stopPropagation();
    retry();
  });

  window.addEventListener("resize", layout);
  loadTitle();
  requestAnimationFrame(frame);
})();
