(() => {
  "use strict";

  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROW = 1;
  const CLEAR_T = 0.82;
  const DIE_T = 0.7;
  const ENTER_STEP = 0.28;
  const MUTE_KEY = "playbox-grow-fence-mute";

  const EMPTY = 0;
  const ROCK = 1;
  const KENNEL = 2;
  const DOOR = 3;
  const INNER = 4;
  const FENCE = 5;

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };

  const DIRS = [
    { k: "right", c: 1, r: 0 },
    { k: "down", c: 0, r: 1 },
    { k: "left", c: -1, r: 0 },
    { k: "up", c: 0, r: -1 }
  ];

  const STAGES = [
    {
      name: "开篱",
      sub: "OPEN",
      hint: "篱笆每秒长一格。绕一圈，把狐关在栏门这边。",
      cols: 11,
      rows: 9,
      time: 36,
      foxStep: 1.55,
      alert: 3.4,
      wander: 2,
      fox: { c: 4, r: 4 },
      posts: [{ c: 9, r: 6 }, { c: 8, r: 6 }],
      face: 2,
      flee: false,
      kennel: { c: 9, r: 3, w: 2, h: 3, door: "w" },
      rocks: []
    },
    {
      name: "绕石",
      sub: "ROCK",
      hint: "石挡路。先拐弯，别对着石头长。",
      cols: 11,
      rows: 9,
      time: 34,
      foxStep: 1.4,
      alert: 2.6,
      wander: 2,
      fox: { c: 4, r: 4 },
      posts: [{ c: 9, r: 6 }, { c: 8, r: 6 }],
      face: 2,
      flee: true,
      kennel: { c: 9, r: 3, w: 2, h: 3, door: "w" },
      rocks: [{ c: 5, r: 6 }, { c: 3, r: 2 }]
    },
    {
      name: "疾狐",
      sub: "SWIFT",
      hint: "狐会往边上跑。先切退路，再合圈。",
      cols: 12,
      rows: 9,
      time: 38,
      foxStep: 1.05,
      alert: 3.2,
      wander: 1,
      fox: { c: 5, r: 4 },
      posts: [{ c: 10, r: 6 }, { c: 9, r: 6 }],
      face: 2,
      flee: true,
      kennel: { c: 10, r: 3, w: 2, h: 3, door: "w" },
      rocks: [{ c: 6, r: 2 }, { c: 2, r: 6 }]
    },
    {
      name: "北栏",
      sub: "NORTH",
      hint: "栏在北侧。把门圈进院子，再开门。",
      cols: 11,
      rows: 10,
      time: 36,
      foxStep: 1.12,
      alert: 3.2,
      wander: 2,
      fox: { c: 5, r: 6 },
      posts: [{ c: 7, r: 1 }, { c: 7, r: 2 }],
      face: 1,
      flee: true,
      kennel: { c: 4, r: 0, w: 3, h: 2, door: "s" },
      rocks: [{ c: 2, r: 4 }, { c: 8, r: 5 }, { c: 5, r: 8 }]
    },
    {
      name: "终篱",
      sub: "SEAL",
      hint: "石多、狐滑。贴着栏把门封死。",
      cols: 13,
      rows: 11,
      time: 42,
      foxStep: 1.0,
      alert: 3.5,
      wander: 1,
      fox: { c: 7, r: 5 },
      posts: [{ c: 1, r: 7 }, { c: 2, r: 7 }],
      face: 0,
      flee: true,
      kennel: { c: 0, r: 4, w: 2, h: 3, door: "e" },
      rocks: [
        { c: 4, r: 3 },
        { c: 4, r: 8 },
        { c: 8, r: 2 },
        { c: 9, r: 8 },
        { c: 6, r: 6 },
        { c: 10, r: 5 }
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
  const btnGate = document.getElementById("btn-gate");
  const btnLeft = document.getElementById("btn-left");
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");
  const btnRight = document.getElementById("btn-right");
  const stageLabel = document.getElementById("stage-label");
  const growLabel = document.getElementById("grow-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) hintEl.textContent = "点格转向 · 圈住后点栏门";

  const view = { w: 1, h: 1, dpr: 1, cell: 40, ox: 0, oy: 0 };
  const pointer = { down: false, id: null, x: 0, y: 0, sx: 0, sy: 0 };
  const particles = [];
  const ripples = [];
  const motes = [];

  const G = {
    mode: "title",
    stage: 0,
    t: 0,
    clock: 0,
    remain: 36,
    lives: LIVES,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: "#00f0ff",
    toastT: 0,
    clearT: 0,
    dieT: 0,
    why: "",
    paused: false,
    taught: false,
    warned: false,
    cols: 11,
    rows: 9,
    grid: [],
    fence: [],
    face: 2,
    lastDir: 2,
    growT: 0,
    ticked: false,
    doorOpen: false,
    door: { c: 0, r: 0 },
    inner: { c: 0, r: 0 },
    kennel: null,
    fox: null,
    foxT: 0,
    path: [],
    pathT: 0,
    beat: 0,
    stem: 1
  };

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
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgb(c, a) {
    return a == null
      ? "rgb(" + c.r + "," + c.g + "," + c.b + ")"
      : "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function idx(c, r) {
    return r * G.cols + c;
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < G.cols && r < G.rows;
  }
  function cellAt(c, r) {
    return inb(c, r) ? G.grid[idx(c, r)] : -1;
  }
  function isBorder(c, r) {
    return c === 0 || r === 0 || c === G.cols - 1 || r === G.rows - 1;
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }

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
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
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
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.14, "sine", 0.05, 392);
      this.beep(294, 0.22, "triangle", 0.04, 588);
    },
    tick: function () {
      this.ensure();
      this.beep(880, 0.05, "square", 0.028, 660);
    },
    grow: function () {
      this.ensure();
      this.beep(220, 0.08, "triangle", 0.05, 440);
      this.noise(0.07, 0.04, 420, 180);
    },
    bump: function () {
      this.ensure();
      this.beep(90, 0.09, "sawtooth", 0.04, 50);
    },
    turn: function () {
      this.ensure();
      this.beep(520, 0.05, "sine", 0.025, 780);
    },
    enclose: function () {
      this.ensure();
      this.beep(392, 0.14, "triangle", 0.07, 784);
      this.beep(523, 0.22, "sine", 0.055, 1046);
    },
    door: function () {
      this.ensure();
      this.noise(0.16, 0.06, 280, 120);
      this.beep(523, 0.18, "triangle", 0.06, 784);
    },
    win: function () {
      this.ensure();
      this.beep(392, 0.16, "triangle", 0.08, 784);
      this.beep(523, 0.22, "sine", 0.065, 1046);
      this.beep(784, 0.36, "sine", 0.05, 1568);
    },
    clear: function () {
      this.ensure();
      this.beep(440, 0.12, "triangle", 0.06, 660);
      this.beep(660, 0.2, "sine", 0.05, 990);
    },
    lose: function () {
      this.ensure();
      this.beep(196, 0.42, "sawtooth", 0.07, 70);
      this.beep(98, 0.58, "square", 0.04, 40);
    },
    fail: function () {
      this.ensure();
      this.beep(160, 0.28, "sawtooth", 0.055, 70);
      this.noise(0.18, 0.07, 300, 80);
    },
    time: function () {
      this.ensure();
      this.beep(880, 0.06, "square", 0.035, 440);
    },
    fox: function () {
      this.ensure();
      this.beep(310, 0.05, "sine", 0.018, 240);
    },
    tickDrone: function (play, heat) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 46;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(44 + heat * 22, t, 0.12);
      this.droneGain.gain.setTargetAtTime(play ? 0.012 + heat * 0.018 : 0.0001, t, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 130) particles.shift();
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
    ripples.push({ x: x, y: y, r: 4, max: max || 46, t: 1, col: col || "c" });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("gold", kind === "gold");
    toastEl.classList.remove("hidden");
    G.toastT = 2.2;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.18 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.6 + 0.1
      });
    }
  }

  function cellCenter(c, r) {
    return {
      x: view.ox + (c + 0.5) * view.cell,
      y: view.oy + (r + 0.5) * view.cell
    };
  }

  function blocked(c, r, doorOpen) {
    if (!inb(c, r)) return true;
    const t = G.grid[idx(c, r)];
    if (t === ROCK || t === KENNEL || t === FENCE) return true;
    if (t === DOOR && !doorOpen) return true;
    if (t === INNER && !doorOpen) return true;
    return false;
  }

  function foxBlocked(c, r) {
    return blocked(c, r, G.doorOpen);
  }

  function doorApproaches() {
    const out = [];
    const d = G.door;
    for (let i = 0; i < 4; i++) {
      const nc = d.c + DIRS[i].c;
      const nr = d.r + DIRS[i].r;
      if (!inb(nc, nr)) continue;
      const t = cellAt(nc, nr);
      if (t === EMPTY) out.push({ c: nc, r: nr });
    }
    return out;
  }

  function floodFromFox() {
    const cols = G.cols;
    const rows = G.rows;
    const fox = G.fox;
    const seen = new Uint8Array(cols * rows);
    const q = [idx(fox.c, fox.r)];
    seen[q[0]] = 1;
    let qi = 0;
    let hitsEscape = false;
    let hitsDoor = false;
    const approaches = doorApproaches();
    const ap = {};
    for (let i = 0; i < approaches.length; i++) {
      ap[idx(approaches[i].c, approaches[i].r)] = 1;
    }
    while (qi < q.length) {
      const id = q[qi++];
      const c = id % cols;
      const r = (id / cols) | 0;
      if (isBorder(c, r) && !foxBlocked(c, r)) hitsEscape = true;
      if (ap[id]) hitsDoor = true;
      for (let i = 0; i < 4; i++) {
        const nc = c + DIRS[i].c;
        const nr = r + DIRS[i].r;
        if (!inb(nc, nr) || foxBlocked(nc, nr)) continue;
        const ni = idx(nc, nr);
        if (seen[ni]) continue;
        seen[ni] = 1;
        q.push(ni);
      }
    }
    return { hitsEscape: hitsEscape, hitsDoor: hitsDoor };
  }

  function firstStepToEscape() {
    const cols = G.cols;
    const fox = G.fox;
    const start = idx(fox.c, fox.r);
    const seen = new Uint8Array(cols * G.rows);
    const parent = new Int16Array(cols * G.rows);
    parent.fill(-1);
    const q = [start];
    seen[start] = 1;
    let found = -1;
    let qi = 0;
    while (qi < q.length) {
      const id = q[qi++];
      const c = id % cols;
      const r = (id / cols) | 0;
      if (isBorder(c, r) && !(c === fox.c && r === fox.r)) {
        found = id;
        break;
      }
      for (let i = 0; i < 4; i++) {
        const nc = c + DIRS[i].c;
        const nr = r + DIRS[i].r;
        if (!inb(nc, nr) || foxBlocked(nc, nr)) continue;
        const ni = idx(nc, nr);
        if (seen[ni]) continue;
        seen[ni] = 1;
        parent[ni] = id;
        q.push(ni);
      }
    }
    if (found < 0) return null;
    let cur = found;
    let prev = parent[cur];
    while (prev >= 0 && prev !== start) {
      cur = prev;
      prev = parent[cur];
    }
    return { c: cur % cols, r: (cur / cols) | 0 };
  }

  function pathToInner() {
    const cols = G.cols;
    const fox = G.fox;
    const goal = idx(G.inner.c, G.inner.r);
    const start = idx(fox.c, fox.r);
    if (start === goal) return [];
    const seen = new Uint8Array(cols * G.rows);
    const parent = new Int16Array(cols * G.rows);
    parent.fill(-1);
    const q = [start];
    seen[start] = 1;
    let qi = 0;
    let found = false;
    while (qi < q.length) {
      const id = q[qi++];
      if (id === goal) {
        found = true;
        break;
      }
      const c = id % cols;
      const r = (id / cols) | 0;
      for (let i = 0; i < 4; i++) {
        const nc = c + DIRS[i].c;
        const nr = r + DIRS[i].r;
        if (!inb(nc, nr) || foxBlocked(nc, nr)) continue;
        const ni = idx(nc, nr);
        if (seen[ni]) continue;
        seen[ni] = 1;
        parent[ni] = id;
        q.push(ni);
      }
    }
    if (!found) return null;
    const path = [];
    let cur = goal;
    while (cur !== start) {
      path.push({ c: cur % cols, r: (cur / cols) | 0 });
      cur = parent[cur];
    }
    path.reverse();
    return path;
  }

  function tip() {
    return G.fence[G.fence.length - 1];
  }

  function nextCell() {
    const t = tip();
    const d = DIRS[G.face];
    return { c: t.c + d.c, r: t.r + d.r };
  }

  function manh(a, b) {
    return Math.abs(a.c - b.c) + Math.abs(a.r - b.r);
  }

  function threatDist() {
    const fox = G.fox;
    const t = tip();
    let best = manh(fox, t);
    for (let i = 0; i < G.fence.length; i++) {
      const d = manh(fox, G.fence[i]);
      if (d < best) best = d;
    }
    return best;
  }

  function setFace(dir) {
    if (G.mode !== "play") return false;
    if (dir < 0 || dir > 3) return false;
    if (dir === (G.lastDir + 2) % 4) return false;
    if (G.face === dir) return false;
    G.face = dir;
    audio.turn();
    return true;
  }

  function faceToward(c, r) {
    const t = tip();
    const dc = c - t.c;
    const dr = r - t.r;
    if (dc === 0 && dr === 0) return;
    let primary;
    let secondary;
    if (Math.abs(dc) >= Math.abs(dr)) {
      primary = dc > 0 ? 0 : 2;
      secondary = dr === 0 ? -1 : dr > 0 ? 1 : 3;
    } else {
      primary = dr > 0 ? 1 : 3;
      secondary = dc === 0 ? -1 : dc > 0 ? 0 : 2;
    }
    if (!setFace(primary) && secondary >= 0) setFace(secondary);
  }

  function stampKennel(spec) {
    const kc = spec.c;
    const kr = spec.r;
    const w = spec.w;
    const h = spec.h;
    for (let r = kr; r < kr + h; r++) {
      for (let c = kc; c < kc + w; c++) {
        G.grid[idx(c, r)] = KENNEL;
      }
    }
    let dc;
    let dr;
    let ic;
    let ir;
    if (spec.door === "w") {
      dc = kc;
      dr = kr + ((h / 2) | 0);
      ic = kc + 1;
      ir = dr;
    } else if (spec.door === "e") {
      dc = kc + w - 1;
      dr = kr + ((h / 2) | 0);
      ic = dc - 1;
      ir = dr;
    } else if (spec.door === "n") {
      dc = kc + ((w / 2) | 0);
      dr = kr;
      ic = dc;
      ir = kr + 1;
    } else {
      dc = kc + ((w / 2) | 0);
      dr = kr + h - 1;
      ic = dc;
      ir = dr - 1;
    }
    G.grid[idx(dc, dr)] = DOOR;
    G.grid[idx(ic, ir)] = INNER;
    G.door = { c: dc, r: dr };
    G.inner = { c: ic, r: ir };
  }

  function checkSeal() {
    const f = floodFromFox();
    if (f.hitsEscape) return "open";
    if (f.hitsDoor) return "ready";
    return "wrong";
  }

  function enterGate() {
    if (G.mode !== "play") return;
    G.mode = "gate";
    G.beat = 1;
    G.flash = 0.28;
    G.flashCol = "#00f0ff";
    toast("圈住了 · 开门", "gold");
    audio.enclose();
    const d = cellCenter(G.door.c, G.door.r);
    ripple(d.x, d.y, "g", 64);
    emit(18, {
      x: d.x, y: d.y, j: 10,
      vx0: -70, vx1: 70, vy0: -90, vy1: 30,
      life: 0.5, r0: 1.2, r1: 3.2, col: "g"
    });
    btnGate.classList.remove("hidden");
    hintEl.textContent = coarse ? "点栏门或「开门」" : "空格开门 · 或点栏门";
  }

  function openGate() {
    if (G.mode !== "gate") return;
    G.doorOpen = true;
    G.mode = "enter";
    G.pathT = 0;
    btnGate.classList.add("hidden");
    audio.door();
    const d = cellCenter(G.door.c, G.door.r);
    ripple(d.x, d.y, "g", 70);
    emit(22, {
      x: d.x, y: d.y, j: 12,
      vx0: -80, vx1: 80, vy0: -110, vy1: 40,
      life: 0.55, r0: 1.4, r1: 3.6, col: "g"
    });
    const path = pathToInner();
    G.path = path && path.length ? path : [{ c: G.inner.c, r: G.inner.r }];
    toast("栏门开了", "gold");
    hintEl.textContent = "狐进栏";
  }

  function loadStage(index, silent) {
    const s = STAGES[index];
    G.stage = index;
    G.cols = s.cols;
    G.rows = s.rows;
    G.remain = s.time;
    G.clock = 0;
    G.lock = 0.22;
    G.clearT = 0;
    G.dieT = 0;
    G.why = "";
    G.warned = false;
    G.doorOpen = false;
    G.growT = 0;
    G.ticked = false;
    G.face = s.face;
    G.lastDir = s.face;
    G.path = [];
    G.pathT = 0;
    G.kennel = s.kennel;
    G.grid = new Uint8Array(s.cols * s.rows);
    stampKennel(s.kennel);
    for (let i = 0; i < s.rocks.length; i++) {
      const rk = s.rocks[i];
      G.grid[idx(rk.c, rk.r)] = ROCK;
    }
    G.fence = [];
    G.stem = s.posts.length;
    for (let i = 0; i < s.posts.length; i++) {
      const p = s.posts[i];
      G.fence.push({ c: p.c, r: p.r, born: -1 });
      G.grid[idx(p.c, p.r)] = FENCE;
    }
    G.fox = {
      c: s.fox.c,
      r: s.fox.r,
      pc: s.fox.c,
      pr: s.fox.r,
      u: 1,
      homeC: s.fox.c,
      homeR: s.fox.r,
      heading: rand(0, TAU),
      scare: 0
    };
    G.foxT = 0;
    btnGate.classList.add("hidden");
    hintEl.textContent = coarse ? "点格转向 · 圈住后点栏门" : "每秒长一格 · 圈住狐 · 空格开门";
    layout();
    if (!silent) {
      const last = s.posts[s.posts.length - 1];
      const p = cellCenter(last.c, last.r);
      ripple(p.x, p.y, "m", 40);
      toast(s.hint);
    }
    syncHud(true);
  }

  function startRun() {
    G.lives = LIVES;
    G.taught = false;
    G.mode = "play";
    overlay.classList.add("hidden");
    loadStage(0, true);
    audio.start();
    toast("篱笆每秒长一格");
    hintEl.textContent = coarse ? "点格转向 · 圈住后点栏门" : "每秒长一格 · 圈住狐 · 空格开门";
  }

  function retry() {
    audio.ensure();
    startRun();
  }

  function onMain() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startRun();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    btnGate.classList.add("hidden");
    if (kind === "title") {
      ovKicker.textContent = "FENCE";
      ovTitle.textContent = "长篱";
      ovLead.innerHTML = "篱笆每秒长一格。把狐圈进栏门这边，<br />再开门放它进去。";
      ovOps.textContent = "WASD / 方向键转向 · 点格瞄准 · 空格开门 · M 静音";
      ovBtn.textContent = "开篱";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "合篱";
      ovLead.textContent = "五栏尽关。狐都还在篱里。";
      ovOps.textContent = "剩命 " + G.lives;
      ovBtn.textContent = "再篱一次";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "篱散";
      const why = {
        escape: "狐从篱边跑了。",
        pierce: "篱笆穿过了狐。",
        crash: "篱接到旧篱，圈是空的。",
        wrong: "圈错了。狐到不了栏门。",
        bound: "篱笆长出了地界。",
        time: "夜色压下来，篱还没合上。"
      };
      ovLead.textContent = why[G.why] || "篱没合上。";
      ovOps.textContent = STAGES[G.stage].name + " · 第 " + (G.stage + 1) + " 篱";
      ovBtn.textContent = "再篱一次";
    }
  }

  function fail(why) {
    if (G.mode !== "play" && G.mode !== "gate") return;
    G.why = why;
    G.mode = "die";
    G.dieT = DIE_T;
    G.lock = 0.4;
    G.shake = 0.55;
    G.flash = 0.32;
    G.flashCol = "#ff3db8";
    G.lives -= 1;
    btnGate.classList.add("hidden");
    audio.fail();
    const t = tip();
    const p = cellCenter(t.c, t.r);
    emit(16, {
      x: p.x, y: p.y, j: 10,
      vx0: -110, vx1: 110, vy0: -80, vy1: 70,
      life: 0.45, r0: 1.2, r1: 3.4, col: "m"
    });
    const msg = {
      escape: "狐逃了",
      pierce: "篱穿狐",
      crash: "空圈",
      wrong: "圈错了",
      bound: "篱出界",
      time: "夜深了"
    };
    toast(msg[why] || "散了", "warn");
  }

  function afterDie() {
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.lose();
      showOverlay("lose");
      return;
    }
    G.mode = "play";
    loadStage(G.stage);
    toast("还剩 " + G.lives + " 命", "warn");
  }

  function afterClear() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      audio.win();
      showOverlay("win");
      return;
    }
    G.mode = "play";
    loadStage(G.stage + 1);
  }

  function growOnce() {
    const n = nextCell();
    if (!inb(n.c, n.r)) {
      fail("bound");
      return;
    }
    if (G.fox.c === n.c && G.fox.r === n.r) {
      fail("pierce");
      return;
    }
    const t = cellAt(n.c, n.r);
    if (t === ROCK) {
      audio.bump();
      G.shake = Math.max(G.shake, 0.12);
      toast("石挡", "warn");
      const p = cellCenter(n.c, n.r);
      emit(6, {
        x: p.x, y: p.y, j: 6,
        vx0: -40, vx1: 40, vy0: -50, vy1: 20,
        life: 0.28, r0: 0.8, r1: 2.2, col: "m"
      });
      return;
    }
    if (t === FENCE || t === KENNEL || t === DOOR || t === INNER) {
      const seal = checkSeal();
      if (seal === "ready") enterGate();
      else if (seal === "wrong") fail("wrong");
      else fail("crash");
      return;
    }
    G.grid[idx(n.c, n.r)] = FENCE;
    G.fence.push({ c: n.c, r: n.r, born: G.clock });
    G.lastDir = G.face;
    const p = cellCenter(n.c, n.r);
    audio.grow();
    ripple(p.x, p.y, "m", 28);
    emit(8, {
      x: p.x, y: p.y, j: 5,
      vx0: -50, vx1: 50, vy0: -70, vy1: 20,
      life: 0.34, r0: 0.8, r1: 2.4, col: "m"
    });
    const seal = checkSeal();
    if (seal === "ready") enterGate();
    else if (seal === "wrong") fail("wrong");
  }

  function tryMoveFox() {
    const fox = G.fox;
    const s = STAGES[G.stage];
    const scared = s.flee !== false && threatDist() <= s.alert;
    fox.scare = lerp(fox.scare, scared ? 1 : 0, 0.35);
    let nc = fox.c;
    let nr = fox.r;
    if (scared) {
      const step = firstStepToEscape();
      if (!step) {
        const seal = checkSeal();
        if (seal === "ready") enterGate();
        else if (seal === "wrong") fail("wrong");
        return;
      }
      nc = step.c;
      nr = step.r;
    } else {
      const opts = [];
      for (let i = 0; i < 4; i++) {
        const c = fox.c + DIRS[i].c;
        const r = fox.r + DIRS[i].r;
        if (foxBlocked(c, r)) continue;
        if (Math.abs(c - fox.homeC) + Math.abs(r - fox.homeR) > s.wander + 0.1) continue;
        opts.push({ c: c, r: r });
      }
      if (opts.length) {
        const pick = opts[(Math.random() * opts.length) | 0];
        nc = pick.c;
        nr = pick.r;
      }
    }
    if (nc === fox.c && nr === fox.r) return;
    const nxt = nextCell();
    if (G.mode === "play" && nc === nxt.c && nr === nxt.r && G.growT > GROW - 0.12) {
      fail("pierce");
      return;
    }
    fox.pc = fox.c;
    fox.pr = fox.r;
    fox.c = nc;
    fox.r = nr;
    fox.u = 0;
    fox.heading = Math.atan2(nr - fox.pr, nc - fox.pc);
    audio.fox();
    if (isBorder(fox.c, fox.r) && !foxBlocked(fox.c, fox.r)) {
      fail("escape");
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    const fox = G.fox;
    if (!fox) return;
    fox.u = Math.min(1, fox.u + dt * 2.2);
    fox.heading += dt * 0.6;
    G.foxT += dt;
    if (G.foxT >= 1.4) {
      G.foxT = 0;
      const opts = [];
      for (let i = 0; i < 4; i++) {
        const c = fox.c + DIRS[i].c;
        const r = fox.r + DIRS[i].r;
        if (foxBlocked(c, r)) continue;
        if (Math.abs(c - fox.homeC) + Math.abs(r - fox.homeR) > 2) continue;
        opts.push({ c: c, r: r });
      }
      if (opts.length) {
        const pick = opts[(Math.random() * opts.length) | 0];
        fox.pc = fox.c;
        fox.pr = fox.r;
        fox.c = pick.c;
        fox.r = pick.r;
        fox.u = 0;
      }
    }
  }

  function updatePlay(dt) {
    if (G.lock > 0) G.lock -= dt;
    G.clock += dt;
    const fox = G.fox;
    fox.u = Math.min(1, fox.u + dt * (G.mode === "enter" ? 3.6 : 2.4));

    if (G.mode === "play") {
      G.remain -= dt;
      if (G.remain <= 8 && !G.warned) {
        G.warned = true;
        toast("夜将至", "warn");
        audio.time();
      }
      if (G.remain <= 0) {
        G.remain = 0;
        fail("time");
        return;
      }
      if (!G.taught && G.clock > 2.6) {
        G.taught = true;
        toast("转向，篱跟着长");
      }
      G.growT += dt;
      if (!G.ticked && G.growT >= GROW - 0.16) {
        G.ticked = true;
        audio.tick();
      }
      if (G.growT >= GROW) {
        G.growT -= GROW;
        G.ticked = false;
        growOnce();
        if (G.mode !== "play") return;
      }
      const s = STAGES[G.stage];
      G.foxT += dt;
      if (G.foxT >= s.foxStep) {
        G.foxT -= s.foxStep;
        tryMoveFox();
      }
    } else if (G.mode === "gate") {
      G.foxT += dt;
      if (G.foxT >= 0.7) {
        G.foxT = 0;
        const opts = [];
        for (let i = 0; i < 4; i++) {
          const c = fox.c + DIRS[i].c;
          const r = fox.r + DIRS[i].r;
          if (foxBlocked(c, r)) continue;
          opts.push({ c: c, r: r });
        }
        if (opts.length) {
          const pick = opts[(Math.random() * opts.length) | 0];
          fox.pc = fox.c;
          fox.pr = fox.r;
          fox.c = pick.c;
          fox.r = pick.r;
          fox.u = 0;
          fox.heading = Math.atan2(fox.r - fox.pr, fox.c - fox.pc);
        }
      }
    } else if (G.mode === "enter") {
      G.pathT += dt;
      if (G.pathT >= ENTER_STEP) {
        G.pathT = 0;
        if (!G.path.length) {
          G.mode = "clear";
          G.clearT = CLEAR_T;
          G.flash = 0.3;
          G.flashCol = "#00f0ff";
          audio.clear();
          toast("入栏", "gold");
          const p = cellCenter(G.inner.c, G.inner.r);
          ripple(p.x, p.y, "c", 70);
          emit(20, {
            x: p.x, y: p.y, j: 8,
            vx0: -70, vx1: 70, vy0: -100, vy1: 20,
            life: 0.5, r0: 1.2, r1: 3.4, col: "c"
          });
        } else {
          const step = G.path.shift();
          fox.pc = fox.c;
          fox.pr = fox.r;
          fox.c = step.c;
          fox.r = step.r;
          fox.u = 0;
          fox.heading = Math.atan2(fox.r - fox.pr, fox.c - fox.pc);
        }
      }
    } else if (G.mode === "clear") {
      G.clearT -= dt;
      if (G.clearT <= 0) afterClear();
    } else if (G.mode === "die") {
      G.dieT -= dt;
      if (G.dieT <= 0) afterDie();
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.4);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
    if (G.beat > 0) G.beat = Math.max(0, G.beat - dt * 1.8);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.6;
      r.r += dt * r.max * 1.4;
      if (r.t <= 0) ripples.splice(i, 1);
    }
  }

  function syncHud(force) {
    const s = STAGES[G.stage];
    const lab = "第 " + (G.stage + 1) + " 篱 · " + s.name;
    if (force || stageLabel.textContent !== lab) stageLabel.textContent = lab;
    let gtxt;
    if (G.mode === "gate") gtxt = "开门";
    else if (G.mode === "enter" || G.mode === "clear") gtxt = "入栏";
    else gtxt = "长 " + Math.max(0, G.fence.length - (G.stem || 1)) + " 格";
    if (force || growLabel.textContent !== gtxt) growLabel.textContent = gtxt;
    growLabel.classList.toggle("gate", G.mode === "gate" || G.mode === "enter");
    const sec = Math.max(0, Math.ceil(G.remain));
    const ttxt = sec + "s";
    if (force || timeLabel.textContent !== ttxt) timeLabel.textContent = ttxt;
    timeLabel.classList.toggle("warn", G.mode === "play" && G.remain <= 8);
    const n = pipsEl.children.length;
    if (force || n !== LIVES) {
      pipsEl.innerHTML = "";
      for (let i = 0; i < LIVES; i++) {
        const d = document.createElement("span");
        d.className = "pip";
        pipsEl.appendChild(d);
      }
    }
    const pips = pipsEl.children;
    for (let i = 0; i < LIVES; i++) {
      pips[i].classList.toggle("on", i < G.lives);
      pips[i].classList.toggle("warn", G.lives === 1 && i === 0);
    }
    const face = G.face;
    btnRight.classList.toggle("held", face === 0);
    btnDown.classList.toggle("held", face === 1);
    btnLeft.classList.toggle("held", face === 2);
    btnUp.classList.toggle("held", face === 3);
  }

  function layout() {
    const padTop = 10;
    const padBot = coarse ? 64 : 16;
    const padX = 16;
    const availW = Math.max(40, view.w - padX * 2);
    const availH = Math.max(40, view.h - padTop - padBot);
    view.cell = Math.max(22, Math.min(58, Math.floor(Math.min(availW / G.cols, availH / G.rows))));
    view.ox = (view.w - view.cell * G.cols) * 0.5;
    view.oy = padTop + (availH - view.cell * G.rows) * 0.5;
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
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    layout();
  }

  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      c: Math.floor((x - view.ox) / view.cell),
      r: Math.floor((y - view.oy) / view.cell),
      x: x,
      y: y
    };
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawRock(c, r, cell) {
    const p = cellCenter(c, r);
    const s = cell * 0.32;
    const h = hash(c * 31 + r * 17);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((h - 0.5) * 0.4);
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.4);
    ctx.lineTo(-s * 0.3, -s * 0.85);
    ctx.lineTo(s * 0.7, -s * 0.45);
    ctx.lineTo(s * 0.9, s * 0.55);
    ctx.lineTo(-s * 0.15, s * 0.9);
    ctx.closePath();
    ctx.fillStyle = "rgba(28, 18, 48, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.2);
    ctx.lineTo(s * 0.25, -s * 0.05);
    ctx.strokeStyle = "rgba(255, 61, 184, 0.22)";
    ctx.stroke();
    ctx.restore();
  }

  function hash(n) {
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function drawKennel(cell) {
    const k = G.kennel;
    const x = view.ox + k.c * cell;
    const y = view.oy + k.r * cell;
    const w = k.w * cell;
    const h = k.h * cell;
    ctx.save();
    ctx.shadowColor = rgb(CYN, 0.45);
    ctx.shadowBlur = 18;
    roundRect(x + 3, y + 3, w - 6, h - 6, 8);
    ctx.fillStyle = "rgba(0, 40, 52, 0.72)";
    ctx.fill();
    ctx.strokeStyle = rgb(CYN, 0.75);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    const peakX = x + w * 0.5;
    const peakY = y - cell * 0.28;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 8);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(x + w - 4, y + 8);
    ctx.strokeStyle = rgb(CYN, 0.85);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(peakX, peakY + 4);
    ctx.lineTo(peakX, y + 10);
    ctx.strokeStyle = rgb(MAG, 0.35);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const door = cellCenter(G.door.c, G.door.r);
    const ready = G.mode === "gate" || G.mode === "enter" || G.mode === "clear";
    const open = G.doorOpen;
    const pulse = ready ? 0.55 + Math.sin(G.t * 7) * 0.45 : 0.2;
    ctx.save();
    ctx.translate(door.x, door.y);
    const dw = cell * 0.42;
    const dh = cell * 0.58;
    if (open) {
      roundRect(-dw * 0.35, -dh * 0.5, dw * 0.7, dh, 6);
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fill();
      ctx.strokeStyle = rgb(GOLD, 0.7);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else {
      roundRect(-dw * 0.5, -dh * 0.5, dw, dh, 7);
      ctx.fillStyle = ready ? "rgba(40, 28, 8, 0.9)" : "rgba(8, 28, 36, 0.9)";
      ctx.fill();
      ctx.strokeStyle = ready ? rgb(GOLD, 0.55 + pulse * 0.45) : rgb(CYN, 0.55);
      ctx.lineWidth = ready ? 2.4 : 1.8;
      ctx.shadowColor = ready ? rgb(GOLD, 0.6) : "transparent";
      ctx.shadowBlur = ready ? 16 : 0;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(dw * 0.22, 0, cell * 0.05, 0, TAU);
      ctx.fillStyle = ready ? rgb(GOLD, 0.9) : rgb(CYN, 0.7);
      ctx.fill();
    }
    ctx.restore();

    const inner = cellCenter(G.inner.c, G.inner.r);
    ctx.beginPath();
    ctx.arc(inner.x, inner.y, cell * 0.16, 0, TAU);
    ctx.fillStyle = rgb(CYN, open ? 0.28 : 0.1);
    ctx.fill();

    ctx.font = "600 " + Math.max(9, cell * 0.22) + "px sans-serif";
    ctx.fillStyle = rgb(CYN, 0.7);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("栏", peakX, y + cell * 0.28);
    ctx.restore();
  }

  function drawFence(cell) {
    const list = G.fence;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const pa = cellCenter(a.c, a.r);
      for (let d = 0; d < 4; d++) {
        const nc = a.c + DIRS[d].c;
        const nr = a.r + DIRS[d].r;
        const t = cellAt(nc, nr);
        if (t !== FENCE && t !== KENNEL && t !== DOOR) continue;
        if (t === FENCE) {
          const other = idx(nc, nr);
          const self = idx(a.c, a.r);
          if (other < self) continue;
        }
        const pb = cellCenter(nc, nr);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = rgb(CYN, 0.55);
        ctx.lineWidth = Math.max(2, cell * 0.08);
        ctx.shadowColor = rgb(CYN, 0.4);
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const p = cellCenter(a.c, a.r);
      let sc = 1;
      if (a.born >= 0) sc = ease((G.clock - a.born) / 0.22);
      const isTip = i === list.length - 1;
      const isStart = i === 0;
      const rad = cell * (isTip ? 0.16 : isStart ? 0.14 : 0.11) * sc;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, TAU);
      ctx.fillStyle = isTip ? rgb(MAG, 0.95) : rgb(MAG, 0.75);
      ctx.shadowColor = rgb(MAG, 0.7);
      ctx.shadowBlur = isTip ? 14 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y - rad * 1.6, Math.max(1.2, cell * 0.035), 0, TAU);
      ctx.fillStyle = rgb(CYN, 0.55);
      ctx.fill();
      if (isStart) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - rad * 2.4);
        ctx.lineTo(p.x, p.y + rad * 0.4);
        ctx.strokeStyle = rgb(MAG, 0.45);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
  }

  function drawGhost(cell) {
    if (G.mode !== "play") return;
    const n = nextCell();
    const p = cellCenter(n.c, n.r);
    const t = inb(n.c, n.r) ? cellAt(n.c, n.r) : -1;
    const foxHit = G.fox.c === n.c && G.fox.r === n.r;
    let col = CYN;
    let a = 0.18 + G.growT * 0.22;
    if (!inb(n.c, n.r) || t === FENCE || t === KENNEL || t === DOOR || t === INNER || foxHit) {
      col = MAG;
      a = 0.28 + G.growT * 0.3;
    } else if (t === ROCK) {
      col = GOLD;
      a = 0.22;
    }
    const s = cell * 0.36;
    ctx.save();
    ctx.globalAlpha = a;
    roundRect(p.x - s, p.y - s, s * 2, s * 2, 6);
    ctx.strokeStyle = rgb(col, 1);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);
    const d = DIRS[G.face];
    ctx.beginPath();
    ctx.moveTo(p.x - d.c * s * 0.2, p.y - d.r * s * 0.2);
    ctx.lineTo(p.x + d.c * s * 0.55, p.y + d.r * s * 0.55);
    ctx.stroke();
    ctx.restore();
  }

  function drawTipRing(cell) {
    if (G.mode !== "play") return;
    const t = tip();
    const p = cellCenter(t.c, t.r);
    const u = clamp(G.growT / GROW, 0, 1);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-Math.PI / 2);
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.34, 0, TAU);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.34, 0, TAU * u);
    ctx.strokeStyle = rgb(u > 0.82 ? GOLD : CYN, 0.9);
    ctx.lineWidth = 3;
    ctx.shadowColor = rgb(u > 0.82 ? GOLD : CYN, 0.6);
    ctx.shadowBlur = 10;
    ctx.stroke();
    const pulse = 1 + Math.sin(G.t * 8) * 0.06 * u;
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.2 * pulse, 0, TAU);
    ctx.fillStyle = rgb(MAG, 0.18);
    ctx.fill();
    ctx.restore();
  }

  function drawFox(cell) {
    const fox = G.fox;
    if (!fox) return;
    const u = ease(fox.u);
    const c = lerp(fox.pc, fox.c, u);
    const r = lerp(fox.pr, fox.r, u);
    const p = {
      x: view.ox + (c + 0.5) * cell,
      y: view.oy + (r + 0.5) * cell
    };
    const bob = Math.sin(G.t * (6 + fox.scare * 4)) * cell * 0.04;
    const scare = fox.scare;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(fox.heading * 0.15);
    const s = cell * 0.38;
    ctx.beginPath();
    ctx.ellipse(s * 0.45, s * 0.1, s * 0.22, s * 0.12, 0.4, 0, TAU);
    ctx.fillStyle = rgb(MAG, 0.55);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.42, s * 0.28, 0, 0, TAU);
    ctx.fillStyle = rgb(MAG, 0.92);
    ctx.shadowColor = rgb(MAG, 0.55);
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-s * 0.28, -s * 0.08, s * 0.28, s * 0.24, 0, 0, TAU);
    ctx.fillStyle = rgb(MAG, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.22);
    ctx.lineTo(-s * 0.38, -s * 0.58);
    ctx.lineTo(-s * 0.14, -s * 0.28);
    ctx.closePath();
    ctx.moveTo(-s * 0.08, -s * 0.3);
    ctx.lineTo(-s * 0.02, -s * 0.6);
    ctx.lineTo(s * 0.14, -s * 0.22);
    ctx.closePath();
    ctx.fillStyle = rgb(MAG, 0.95);
    ctx.fill();
    ctx.fillStyle = rgb(CYN, 0.95);
    ctx.beginPath();
    ctx.arc(-s * 0.38, -s * 0.1, Math.max(1.3, cell * 0.04), 0, TAU);
    ctx.arc(-s * 0.18, -s * 0.12, Math.max(1.2, cell * 0.035), 0, TAU);
    ctx.fill();
    if (scare > 0.4) {
      ctx.strokeStyle = rgb(GOLD, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.02);
      ctx.lineTo(-s * 0.62, -s * 0.08);
      ctx.moveTo(-s * 0.48, s * 0.08);
      ctx.lineTo(-s * 0.6, s * 0.12);
      ctx.stroke();
    }
    ctx.restore();
    if (G.mode === "play" && isBorder(fox.c, fox.r)) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, cell * 0.55, 0, TAU);
      ctx.strokeStyle = rgb(MAG, 0.35);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawGrid(cell) {
    ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= G.cols; c++) {
      const x = view.ox + c * cell;
      ctx.beginPath();
      ctx.moveTo(x, view.oy);
      ctx.lineTo(x, view.oy + G.rows * cell);
      ctx.stroke();
    }
    for (let r = 0; r <= G.rows; r++) {
      const y = view.oy + r * cell;
      ctx.beginPath();
      ctx.moveTo(view.ox, y);
      ctx.lineTo(view.ox + G.cols * cell, y);
      ctx.stroke();
    }
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        if (!isBorder(c, r)) continue;
        const t = cellAt(c, r);
        if (t !== EMPTY) continue;
        const p = cellCenter(c, r);
        ctx.fillStyle = rgb(MAG, 0.035 + Math.sin(G.t * 2 + c + r) * 0.015);
        ctx.fillRect(view.ox + c * cell, view.oy + r * cell, cell, cell);
        if (cell > 28) {
          ctx.fillStyle = rgb(MAG, 0.12);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, TAU);
          ctx.fill();
        }
      }
    }
  }

  function draw() {
    const w = view.w;
    const h = view.h;
    const cell = view.cell;
    let sx = 0;
    let sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * 10 * G.shake;
      sy = (Math.random() - 0.5) * 10 * G.shake;
    }
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, w, h);
    const g1 = ctx.createRadialGradient(w * 0.18, h * 0.08, 10, w * 0.18, h * 0.08, w * 0.7);
    g1.addColorStop(0, "rgba(255,61,184,0.12)");
    g1.addColorStop(1, "rgba(5,3,12,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createRadialGradient(w * 0.92, h * 0.12, 10, w * 0.92, h * 0.12, w * 0.65);
    g2.addColorStop(0, "rgba(0,240,255,0.1)");
    g2.addColorStop(1, "rgba(5,3,12,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(sx, sy);

    const gw = G.cols * cell;
    const gh = G.rows * cell;
    roundRect(view.ox - 6, view.oy - 6, gw + 12, gh + 12, 12);
    ctx.fillStyle = "rgba(8, 6, 18, 0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    drawGrid(cell);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = view.ox + ((m.x + G.t * m.s * 0.02) % 1) * gw;
      const my = view.oy + ((m.y + Math.sin(G.t * m.s + m.p) * 0.02) % 1) * gh;
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, TAU);
      ctx.fillStyle = rgb(i % 2 ? CYN : MAG, m.a);
      ctx.fill();
    }

    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        if (cellAt(c, r) === ROCK) drawRock(c, r, cell);
      }
    }

    drawKennel(cell);
    drawFence(cell);
    drawGhost(cell);
    drawTipRing(cell);
    drawFox(cell);

    for (let i = 0; i < ripples.length; i++) {
      const rp = ripples[i];
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, TAU);
      const col = rp.col === "m" ? MAG : rp.col === "g" ? GOLD : CYN;
      ctx.strokeStyle = rgb(col, Math.max(0, rp.t) * 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const col = p.col === "m" ? MAG : p.col === "g" ? GOLD : CYN;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = rgb(col, Math.max(0, p.life / p.max));
      ctx.fill();
    }

    if (G.mode === "gate") {
      const d = cellCenter(G.door.c, G.door.r);
      ctx.font = "700 " + Math.max(11, cell * 0.28) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = rgb(GOLD, 0.7 + Math.sin(G.t * 6) * 0.25);
      ctx.shadowColor = rgb(GOLD, 0.5);
      ctx.shadowBlur = 12;
      ctx.fillText("开门", d.x, d.y - cell * 0.42);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = G.flashCol === "#ff3db8"
        ? rgb(MAG, G.flash * 0.22)
        : rgb(CYN, G.flash * 0.18);
      ctx.fillRect(0, 0, w, h);
    }
  }

  let last = 0;
  let acc = 0;
  function loop(now) {
    const t = now * 0.001;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.08) dt = 0.08;
    G.t = t;
    if (!G.paused) {
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        if (G.mode === "title") updateTitle(STEP);
        else if (
          G.mode === "play" ||
          G.mode === "gate" ||
          G.mode === "enter" ||
          G.mode === "clear" ||
          G.mode === "die"
        ) {
          updatePlay(STEP);
        }
        updateFx(STEP);
        acc -= STEP;
      }
      const heat = G.mode === "play" ? clamp(G.growT, 0, 1) : G.mode === "gate" ? 0.6 : 0.2;
      audio.tickDrone(
        G.mode === "play" || G.mode === "gate" || G.mode === "title" || G.mode === "enter",
        heat
      );
      syncHud(false);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function onKey(e, down) {
    if (e.repeat && down) return;
    if (e.code === "KeyM" && down) {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (e.code === "KeyR" && down) {
      e.preventDefault();
      retry();
      return;
    }
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (down && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        onMain();
      }
      return;
    }
    if (!down) return;
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      if (G.mode === "gate") openGate();
      return;
    }
    if (G.lock > 0) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") {
      e.preventDefault();
      setFace(2);
    } else if (e.code === "KeyD" || e.code === "ArrowRight") {
      e.preventDefault();
      setFace(0);
    } else if (e.code === "KeyW" || e.code === "ArrowUp") {
      e.preventDefault();
      setFace(3);
    } else if (e.code === "KeyS" || e.code === "ArrowDown") {
      e.preventDefault();
      setFace(1);
    }
  }

  window.addEventListener("keydown", function (e) { onKey(e, true); });
  window.addEventListener("keyup", function (e) { onKey(e, false); });

  canvas.addEventListener("pointerdown", function (e) {
    if (overlay.classList.contains("hidden") === false) return;
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const hit = cellFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = hit.x;
    pointer.y = hit.y;
    pointer.sx = hit.x;
    pointer.sy = hit.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (G.mode === "gate") {
      if (hit.c === G.door.c && hit.r === G.door.r) {
        openGate();
        return;
      }
    }
    if (G.mode === "play" && G.lock <= 0) {
      if (inb(hit.c, hit.r)) faceToward(hit.c, hit.r);
    }
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    const hit = cellFromEvent(e);
    pointer.x = hit.x;
    pointer.y = hit.y;
    if (G.mode !== "play" || G.lock > 0) return;
    const dx = hit.x - pointer.sx;
    const dy = hit.y - pointer.sy;
    if (hypot2(dx, dy) > 18) {
      if (Math.abs(dx) > Math.abs(dy)) setFace(dx > 0 ? 0 : 2);
      else setFace(dy > 0 ? 1 : 3);
      pointer.sx = hit.x;
      pointer.sy = hit.y;
    }
  });

  function endPointer(e) {
    if (pointer.id !== e.pointerId) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  function bindPad(btn, dir) {
    const go = function (e) {
      e.preventDefault();
      audio.ensure();
      if (G.mode === "play") setFace(dir);
    };
    btn.addEventListener("pointerdown", go);
  }
  bindPad(btnRight, 0);
  bindPad(btnDown, 1);
  bindPad(btnLeft, 2);
  bindPad(btnUp, 3);

  btnGate.addEventListener("click", function (e) {
    e.preventDefault();
    audio.ensure();
    openGate();
  });
  ovBtn.addEventListener("click", function () {
    onMain();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function () {
    retry();
  });

  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (!document.hidden) {
      last = performance.now() * 0.001;
      acc = 0;
    }
  });

  window.addEventListener("resize", resize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);

  makeMotes();
  resize();
  loadStage(0, true);
  hideToast();
  G.mode = "title";
  showOverlay("title");
  syncHud(true);
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
