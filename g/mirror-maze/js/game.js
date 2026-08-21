(() => {
  "use strict";

  const LIVES = 3;
  const STEP = 1 / 60;
  const MOVE_T = 0.12;
  const DIE_T = 0.64;
  const CLEAR_T = 0.82;
  const LOCK = 0.16;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-mirror-maze-mute";
  const AXIS_NAME = { h: "左右对折", v: "上下对折", p: "中心对点" };
  const DIRS = {
    left: { c: -1, r: 0 },
    right: { c: 1, r: 0 },
    up: { c: 0, r: -1 },
    down: { c: 0, r: 1 }
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function keyOf(c, r) {
    return c + "," + r;
  }

  const STAGES = [
    {
      name: "对镜",
      sub: "GLASS",
      axis: "h",
      time: 22,
      hint: "朝你看见的门走，会撞上真墙。按相反方向。",
      map: [
        "#########",
        "#.......#",
        "#P.....E#",
        "#.......#",
        "#########"
      ]
    },
    {
      name: "折角",
      sub: "BEND",
      axis: "h",
      time: 28,
      hint: "先沿长廊走到底，再转弯。",
      map: [
        "#########",
        "#P......#",
        "#######.#",
        "#.......#",
        "#E#######",
        "#########"
      ]
    },
    {
      name: "裂晶",
      sub: "SHARD",
      axis: "h",
      time: 32,
      hint: "品红裂晶是真的。看起来在那边，踩上去即碎。",
      map: [
        "#########",
        "#P....X.#",
        "#.###...#",
        "#.....#.#",
        "##X...#E#",
        "#########"
      ]
    },
    {
      name: "倒影",
      sub: "DROP",
      axis: "v",
      time: 30,
      hint: "镜子改为上下对折。朝上看见的门，要往下走。",
      map: [
        "#######",
        "#P....#",
        "#.###.#",
        "#.#.#.#",
        "#.#E#.#",
        "#.....#",
        "#######"
      ]
    },
    {
      name: "回廊",
      sub: "HALL",
      axis: "h",
      time: 36,
      hint: "中间是诱饵。贴着你以为的反侧走。",
      map: [
        "###########",
        "#P#.......#",
        "#.#.#####.#",
        "#.#.#...#.#",
        "#...#.X.#.#",
        "#####.#.#.#",
        "#......#.E#",
        "###########"
      ]
    },
    {
      name: "对点",
      sub: "POINT",
      axis: "p",
      time: 42,
      hint: "中心对点：左右上下都反。",
      map: [
        "#########",
        "#P#.....#",
        "#.#.###.#",
        "#.#...#.#",
        "#.###.#.#",
        "#.....#E#",
        "#########"
      ]
    },
    {
      name: "深廊",
      sub: "DEEP",
      axis: "h",
      time: 42,
      hint: "外圈才是活路。别被裂晶诱进去。",
      map: [
        "#############",
        "#P..........#",
        "###########.#",
        "#...X.....#.#",
        "#.###.###.#.#",
        "#.#...#...#.#",
        "#.#.X.#.#.#.#",
        "#.....#.#..E#",
        "#############"
      ]
    },
    {
      name: "终堂",
      sub: "LAST",
      axis: "p",
      time: 48,
      hint: "最后一廊。对点折叠，躲开两颗裂晶。",
      map: [
        "###########",
        "#P#.......#",
        "#.#.#####.#",
        "#.#.#...#.#",
        "#...#.X.#.#",
        "#####.###.#",
        "#.....X.#.#",
        "#.#######.#",
        "#........E#",
        "###########"
      ]
    }
  ];

  function parseMap(spec) {
    const map = spec.map;
    const rows = map.length;
    const cols = map[0].length;
    const grid = [];
    let P = null;
    let E = null;
    const shards = [];
    for (let r = 0; r < rows; r++) {
      if (map[r].length !== cols) {
        throw new Error("ragged " + spec.name + " r" + r);
      }
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const ch = map[r][c];
        if (ch === "#") grid[r][c] = 1;
        else if (ch === ".") grid[r][c] = 0;
        else if (ch === "X") {
          grid[r][c] = 2;
          shards.push({ c: c, r: r });
        } else if (ch === "P") {
          if (P) throw new Error("dup P " + spec.name);
          grid[r][c] = 0;
          P = { c: c, r: r };
        } else if (ch === "E") {
          if (E) throw new Error("dup E " + spec.name);
          grid[r][c] = 3;
          E = { c: c, r: r };
        } else {
          throw new Error("char " + ch + " " + spec.name);
        }
      }
    }
    if (!P || !E) throw new Error("need P/E " + spec.name);
    return { cols: cols, rows: rows, grid: grid, P: P, E: E, shards: shards };
  }

  function shortest(spec) {
    const m = parseMap(spec);
    const q = [[m.P.c, m.P.r, 0]];
    const seen = {};
    seen[keyOf(m.P.c, m.P.r)] = 1;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let qi = 0;
    while (qi < q.length) {
      const cur = q[qi++];
      const c = cur[0];
      const r = cur[1];
      const d = cur[2];
      if (c === m.E.c && r === m.E.r) return d;
      for (let i = 0; i < 4; i++) {
        const nc = c + dirs[i][0];
        const nr = r + dirs[i][1];
        if (nr < 0 || nc < 0 || nr >= m.rows || nc >= m.cols) continue;
        const k = m.grid[nr][nc];
        if (k === 1 || k === 2) continue;
        const key = keyOf(nc, nr);
        if (seen[key]) continue;
        seen[key] = 1;
        q.push([nc, nr, d + 1]);
      }
    }
    return -1;
  }

  function validateStages() {
    STAGES.forEach(function (s, i) {
      if (!s.name || !s.sub || !s.map || !s.axis) throw new Error("stage meta " + i);
      if (s.axis !== "h" && s.axis !== "v" && s.axis !== "p") throw new Error("axis " + i);
      if (s.time < 12) throw new Error("time " + i);
      const m = parseMap(s);
      if (m.cols < 5 || m.rows < 3) throw new Error("tiny " + s.name);
      const d = shortest(s);
      if (d < 1) throw new Error("unsolvable " + s.name);
      if (d * MOVE_T + 4 > s.time) throw new Error("tight " + s.name + " d=" + d);
      if ((s.name === "裂晶" || s.name === "回廊" || s.name === "深廊" || s.name === "终堂") && m.shards.length < 1) {
        throw new Error("need shard " + s.name);
      }
    });
  }

  validateStages();

  if (typeof document === "undefined") {
    STAGES.forEach(function (s) {
      const d = shortest(s);
      console.log(s.name + " " + s.axis + " steps=" + d + " time=" + s.time);
    });
    console.log("mirror-maze maps ok", STAGES.length);
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
  const axisLabel = document.getElementById("axis-label");
  const timeWrap = document.getElementById("time-wrap");
  const timeFill = document.getElementById("time-fill");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const padEl = document.getElementById("pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "点镜面或滑动 · 或用真身十字 · 看见的是镜像";
  }

  const view = { tile: 48, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1, frame: 26 };
  const keys = { left: false, right: false, up: false, down: false };
  const pad = { left: false, right: false, up: false, down: false };
  const pointer = { down: false, id: null, x: 0, y: 0, sx: 0, sy: 0 };

  const particles = [];
  const motes = [];
  const trail = [];
  const cracks = [];

  let mode = "title";
  let overlayKind = "title";
  let toastT = 0;
  let acc = 0;
  let lastTs = 0;
  let paused = false;
  let lastStepAt = -9;
  let clock = 0;
  let hudTick = 0;
  let demoSi = 0;
  let demoWait = 0.9;

  const DEMO = [
    { wait: 0.85 },
    { d: [-1, 0] },
    { wait: 0.5 },
    { d: [1, 0] },
    { d: [1, 0] },
    { d: [1, 0] },
    { d: [1, 0] },
    { d: [1, 0] },
    { d: [1, 0] },
    { wait: 1.15 },
    { reset: true }
  ];

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        s: 0.4 + Math.random() * 1.5,
        a: 0.035 + Math.random() * 0.09,
        v: 0.006 + Math.random() * 0.018,
        p: Math.random() * TAU,
        mag: Math.random() < 0.4
      });
    }
  }
  makeMotes();

  const SFX = {
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
        this.master.gain.value = this.muted ? 0 : 0.26;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
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
    noise: function (dur, vol, cut) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = cut || 900;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    step: function (prog) {
      const f = 390 + prog * 380;
      this.beep(f, 0.07, "triangle", 0.032, f * 1.28);
    },
    bump: function () {
      this.beep(88, 0.09, "square", 0.03, 52);
    },
    die: function () {
      this.noise(0.3, 0.11, 700);
      this.beep(260, 0.46, "sawtooth", 0.08, 50);
    },
    gate: function () {
      this.beep(523, 0.14, "sine", 0.07, 784);
      const self = this;
      setTimeout(function () { self.beep(659, 0.16, "sine", 0.07, 880); }, 90);
      setTimeout(function () { self.beep(784, 0.28, "triangle", 0.09, 1046); }, 180);
    },
    win: function () {
      this.beep(523, 0.18, "sine", 0.08, 659);
      const self = this;
      setTimeout(function () { self.beep(659, 0.18, "sine", 0.08, 784); }, 110);
      setTimeout(function () { self.beep(784, 0.22, "sine", 0.09, 1046); }, 220);
      setTimeout(function () { self.beep(1046, 0.4, "triangle", 0.1, 1568); }, 340);
    },
    lose: function () {
      this.beep(196, 0.55, "sawtooth", 0.09, 50);
      this.beep(98, 0.72, "square", 0.05, 40);
    },
    tickDrone: function (playing) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 62;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(58 + (st.flipX && st.flipY ? 18 : 8), t, 0.14);
      const vol = playing ? 0.015 : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.18);
    },
    hushDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
    btnMute.setAttribute("aria-label", SFX.muted ? "取消静音" : "静音");
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.26;
    if (m) SFX.hushDrone();
    syncMuteBtn();
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.9;
  }

  function axisOf(spec) {
    return {
      flipX: spec.axis === "h" || spec.axis === "p",
      flipY: spec.axis === "v" || spec.axis === "p"
    };
  }

  function makeState(index, lives) {
    const spec = STAGES[index];
    const parsed = parseMap(spec);
    const ax = axisOf(spec);
    return {
      index: index,
      lives: lives == null ? LIVES : lives,
      spec: spec,
      cols: parsed.cols,
      rows: parsed.rows,
      grid: parsed.grid,
      P: parsed.P,
      E: parsed.E,
      shards: parsed.shards,
      flipX: ax.flipX,
      flipY: ax.flipY,
      phase: "play",
      t: 0,
      remain: spec.time,
      pc: parsed.P.c,
      pr: parsed.P.r,
      fromC: parsed.P.c,
      fromR: parsed.P.r,
      toC: parsed.P.c,
      toR: parsed.P.r,
      anim: 0,
      moving: false,
      buf: null,
      shake: 0,
      flash: 0,
      flashRgb: "0,240,255",
      fall: 0,
      why: "",
      face: { c: 1, r: 0 },
      lock: LOCK,
      steps: 0
    };
  }

  let st = makeState(0);

  function visC(c) {
    return st.flipX ? st.cols - 1 - c : c;
  }
  function visR(r) {
    return st.flipY ? st.rows - 1 - r : r;
  }

  function cellCenter(c, r) {
    return {
      x: view.ox + (visC(c) + 0.5) * view.tile,
      y: view.oy + (visR(r) + 0.5) * view.tile
    };
  }

  function trueCenter(c, r) {
    return {
      x: view.ox + (c + 0.5) * view.tile,
      y: view.oy + (r + 0.5) * view.tile
    };
  }

  function walkerPos() {
    const a = cellCenter(st.fromC, st.fromR);
    const b = cellCenter(st.toC, st.toR);
    const f = st.moving ? smooth(st.anim) : 1;
    return {
      x: lerp(a.x, b.x, f),
      y: lerp(a.y, b.y, f)
    };
  }

  function kindAt(c, r) {
    if (c < 0 || r < 0 || c >= st.cols || r >= st.rows) return 1;
    return st.grid[r][c];
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * (0.7 + Math.random() * 0.5),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb
      });
    }
  }

  function burstAt(x, y, rgb, n) {
    emit(n, {
      x: x,
      y: y,
      j: view.tile * 0.2,
      vx0: -90,
      vx1: 90,
      vy0: -130,
      vy1: 50,
      life: 0.55,
      r0: 1.2,
      r1: 3.6,
      rgb: rgb
    });
  }

  function spawnCracks(x, y) {
    cracks.length = 0;
    for (let i = 0; i < 7; i++) {
      const a = rand(0, TAU);
      const len = view.tile * rand(0.4, 1.35);
      cracks.push({
        x: x,
        y: y,
        x2: x + Math.cos(a) * len,
        y2: y + Math.sin(a) * len,
        life: 0.7 + Math.random() * 0.25
      });
    }
  }

  function timeAmt() {
    if (mode === "title") return 1;
    if (st.phase === "clear") return 1;
    return clamp(st.remain / st.spec.time, 0, 1);
  }

  function renderHud() {
    const spec = mode === "title" ? STAGES[0] : st.spec;
    const idx = mode === "title" ? 0 : st.index;
    const axis = AXIS_NAME[spec.axis];
    stageLabel.textContent = "关卡 " + (idx + 1) + " / " + STAGES.length + "  ·  " + spec.name;
    axisLabel.textContent = axis;
    const amt = timeAmt();
    timeFill.style.width = (amt * 100).toFixed(1) + "%";
    const warn = mode === "play" && st.phase === "play" && st.remain < 6;
    timeWrap.classList.toggle("warn", warn || (mode === "play" && st.phase === "die"));
    const lives = mode === "title" ? LIVES : st.lives;
    if (pipsEl.childNodes.length !== LIVES) {
      pipsEl.innerHTML = "";
      for (let i = 0; i < LIVES; i++) {
        const pip = document.createElement("i");
        pip.className = "pip";
        pipsEl.appendChild(pip);
      }
    }
    const pips = pipsEl.children;
    for (let i = 0; i < LIVES; i++) {
      pips[i].classList.toggle("on", i < lives);
      pips[i].classList.toggle("warn", lives === 1 && i === 0);
    }
    const playing = mode === "play" && st.phase === "play" && overlay.classList.contains("hidden");
    padEl.classList.toggle("off", !coarse || !playing);
  }

  function setHint() {
    if (mode === "title") {
      hintEl.textContent = coarse
        ? "点镜面或滑动 · 或用真身十字 · 看见的是镜像"
        : "看见的是镜像 · 实际走相反";
      return;
    }
    if (st.phase === "play") hintEl.textContent = st.spec.hint;
    else if (st.phase === "die") hintEl.textContent = st.why === "time" ? "时限耗尽" : "裂晶撕碎";
    else if (st.phase === "clear") hintEl.textContent = "穿过拱门";
  }

  function setOverlay(kind) {
    overlayKind = kind;
    panel.classList.remove("win", "lose");
    overlay.classList.remove("hidden");
    if (kind === "title") {
      ovKicker.textContent = "MAZE";
      ovTitle.textContent = "镜廊";
      ovLead.innerHTML = "你看见的是镜像。方向驱动真身，镜子里的人走相反。<br />走进金色拱门。品红裂晶会把你撕碎。";
      ovOps.textContent = "WASD / 方向键逐格 · 点镜面或滑动 · M 静音";
      ovBtn.textContent = "进廊";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "出廊";
      ovLead.textContent = "八面镜子都走通了。真身与倒影重合在金门前。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再来一局";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "碎镜";
      const why = st.why === "time"
        ? "时限耗尽，廊灯熄了。"
        : "品红裂晶把倒影撕开，真身也碎了。";
      ovLead.textContent = why + " 三次迷失，镜子不再认你。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再进一次";
    }
    renderHud();
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startRun() {
    mode = "play";
    st = makeState(0, LIVES);
    trail.length = 0;
    cracks.length = 0;
    hideOverlay();
    fit();
    showToast(st.spec.name + " · " + st.spec.hint);
    setHint();
    renderHud();
    SFX.ensure();
  }

  function loadStage(index, lives) {
    st = makeState(index, lives);
    trail.length = 0;
    cracks.length = 0;
    showToast(st.spec.name + " · " + AXIS_NAME[st.spec.axis]);
    setHint();
    renderHud();
    fit();
  }

  function heldDir() {
    const order = ["left", "right", "up", "down"];
    const faceKey =
      st.face.c < 0 ? "left" : st.face.c > 0 ? "right" : st.face.r < 0 ? "up" : "down";
    if ((keys[faceKey] || pad[faceKey]) && DIRS[faceKey]) {
      return DIRS[faceKey];
    }
    for (let i = 0; i < order.length; i++) {
      const k = order[i];
      if (keys[k] || pad[k]) return DIRS[k];
    }
    return null;
  }

  function tryStep(dc, dr, forced) {
    if (st.phase !== "play") return false;
    if (!forced && !overlay.classList.contains("hidden")) return false;
    if (st.lock > 0 && mode === "play") return false;
    if (!dc && !dr) return false;
    if (Math.abs(dc) + Math.abs(dr) !== 1) return false;
    if (st.moving) {
      st.buf = { c: dc, r: dr };
      return false;
    }
    const now = clock;
    if (now - lastStepAt < 0.05) return false;
    const nc = st.pc + dc;
    const nr = st.pr + dr;
    const k = kindAt(nc, nr);
    st.face = { c: dc, r: dr };
    if (k === 1) {
      lastStepAt = now;
      st.shake = Math.max(st.shake, 5);
      if (mode === "play") SFX.bump();
      const p = walkerPos();
      emit(5, {
        x: p.x + dc * view.tile * 0.28,
        y: p.y + dr * view.tile * 0.28,
        j: 4,
        vx0: -30,
        vx1: 30,
        vy0: -40,
        vy1: 10,
        life: 0.22,
        r0: 0.8,
        r1: 1.8,
        rgb: "0,240,255"
      });
      return false;
    }
    lastStepAt = now;
    st.fromC = st.pc;
    st.fromR = st.pr;
    st.toC = nc;
    st.toR = nr;
    st.moving = true;
    st.anim = 0;
    st.buf = null;
    st._pendingDie = k === 2;
    st._pendingClear = k === 3;
    return true;
  }

  function finishMove() {
    st.pc = st.toC;
    st.pr = st.toR;
    st.fromC = st.pc;
    st.fromR = st.pr;
    st.moving = false;
    st.anim = 0;
    st.steps += 1;
    const p = walkerPos();
    trail.push({ x: p.x, y: p.y, t: 0.38 });
    if (trail.length > 14) trail.shift();

    if (mode === "title") {
      st._pendingDie = false;
      st._pendingClear = false;
      return;
    }

    if (st._pendingDie) {
      st.phase = "die";
      st.t = 0;
      st.why = "shard";
      st.flash = 0.52;
      st.flashRgb = "255,61,184";
      st.shake = 12;
      st.fall = 0;
      burstAt(p.x, p.y, "255,61,184", 26);
      burstAt(p.x, p.y, "255,227,107", 8);
      spawnCracks(p.x, p.y);
      SFX.die();
      showToast("裂晶", true);
      setHint();
      return;
    }

    const dist =
      Math.abs(st.pc - st.E.c) + Math.abs(st.pr - st.E.r);
    const prog = 1 - dist / Math.max(1, st.cols + st.rows);
    SFX.step(clamp(prog, 0, 1));
    emit(5, {
      x: p.x,
      y: p.y,
      j: 5,
      vx0: -36,
      vx1: 36,
      vy0: -48,
      vy1: -6,
      life: 0.3,
      r0: 1,
      r1: 2.1,
      rgb: "255,61,184"
    });

    if (st._pendingClear) {
      st.phase = "clear";
      st.t = 0;
      st.flash = 0.55;
      st.flashRgb = "255,227,107";
      burstAt(p.x, p.y, "255,227,107", 22);
      burstAt(p.x, p.y, "0,240,255", 14);
      SFX.gate();
      showToast("穿过拱门");
      setHint();
      return;
    }

    const h = heldDir();
    if (h) tryStep(h.c, h.r);
    else if (st.buf) {
      const b = st.buf;
      st.buf = null;
      tryStep(b.c, b.r);
    }
  }

  function onDieDone() {
    st.lives -= 1;
    if (st.lives <= 0) {
      mode = "lose";
      SFX.hushDrone();
      SFX.lose();
      setOverlay("lose");
      return;
    }
    loadStage(st.index, st.lives);
    showToast("还剩 " + st.lives + " 命", true);
  }

  function onClearDone() {
    if (st.index >= STAGES.length - 1) {
      mode = "win";
      SFX.hushDrone();
      SFX.win();
      setOverlay("win");
      return;
    }
    loadStage(st.index + 1, st.lives);
  }

  function resetDemo() {
    st = makeState(0, LIVES);
    demoSi = 0;
    demoWait = 0.4;
    trail.length = 0;
    fit();
  }

  function tickDemo(dt) {
    if (st.moving) return;
    if (demoWait > 0) {
      demoWait -= dt;
      return;
    }
    if (demoSi >= DEMO.length) {
      resetDemo();
      return;
    }
    const item = DEMO[demoSi];
    if (item.wait) {
      demoWait = item.wait;
      demoSi += 1;
      return;
    }
    if (item.reset) {
      resetDemo();
      return;
    }
    if (item.d) {
      tryStep(item.d[0], item.d[1], true);
      demoSi += 1;
    }
  }

  function tickPlay(dt) {
    st.lock = Math.max(0, st.lock - dt);
    if (mode === "play") {
      st.remain -= dt;
      if (st.remain <= 0 && st.phase === "play") {
        st.remain = 0;
        st.why = "time";
        st.phase = "die";
        st.t = 0;
        st.flash = 0.45;
        st.flashRgb = "255,61,184";
        st.shake = 8;
        const p = walkerPos();
        burstAt(p.x, p.y, "255,61,184", 18);
        SFX.die();
        showToast("时限耗尽", true);
        setHint();
        return;
      }
    }
    if (st.moving) {
      st.anim += dt / MOVE_T;
      if (st.anim >= 1) finishMove();
    } else if (mode === "play" && st.phase === "play" && st.lock <= 0) {
      const h = heldDir();
      if (h) tryStep(h.c, h.r);
    }
  }

  function tickDie(dt) {
    st.t += dt;
    st.fall = smooth(clamp(st.t / DIE_T, 0, 1));
    if (st.t >= DIE_T) onDieDone();
  }

  function tickClear(dt) {
    st.t += dt;
    if (st.t >= CLEAR_T) onClearDone();
  }

  function step(dt) {
    clock += dt;
    st.shake = Math.max(0, st.shake - dt * 18);
    st.flash = Math.max(0, st.flash - dt);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }

    if (st.phase === "play") tickPlay(dt);
    else if (st.phase === "die") tickDie(dt);
    else if (st.phase === "clear") tickClear(dt);

    if (mode === "title") tickDemo(dt);

    SFX.tickDrone(mode === "play" || mode === "title");

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 70 * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].t -= dt;
      if (trail[i].t <= 0) trail.splice(i, 1);
    }
    for (let i = cracks.length - 1; i >= 0; i--) {
      cracks[i].life -= dt;
      if (cracks[i].life <= 0) cracks.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y -= m.v * dt * 0.22;
      m.p += dt * 0.65;
      if (m.y < -0.02) m.y = 1.02;
    }
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

  function drawWalker(x, y, faceC, faceR, scale, rgb, glow) {
    const t = view.tile;
    const s = t * 0.32 * scale;
    const vc = st.flipX ? -faceC : faceC;
    const vr = st.flipY ? -faceR : faceR;
    ctx.save();
    ctx.translate(x, y);
    const ang = Math.atan2(vr, vc);
    ctx.rotate(isNaN(ang) ? 0 : ang);
    ctx.shadowColor = glow;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(s * 1.08, 0);
    ctx.lineTo(0, s * 0.62);
    ctx.lineTo(-s * 0.7, 0);
    ctx.lineTo(0, -s * 0.62);
    ctx.closePath();
    ctx.fillStyle = rgb;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(8,6,18,0.88)";
    ctx.beginPath();
    ctx.arc(s * 0.14, 0, s * 0.16, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawExit(c, r, pulse) {
    const p = cellCenter(c, r);
    const t = view.tile;
    const w = t * 0.62;
    const h = t * 0.7;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.shadowColor = "rgba(255,227,107,0.9)";
    ctx.shadowBlur = 18 + pulse * 14;
    ctx.strokeStyle = "rgba(255,227,107,0.95)";
    ctx.lineWidth = Math.max(1.6, t * 0.05);
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, h * 0.42);
    ctx.lineTo(-w * 0.5, -h * 0.05);
    ctx.arc(0, -h * 0.05, w * 0.5, Math.PI, 0, false);
    ctx.lineTo(w * 0.5, h * 0.42);
    ctx.stroke();
    ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(0, -h * 0.4, 0, h * 0.4);
    g.addColorStop(0, "rgba(255,227,107," + (0.18 + pulse * 0.16) + ")");
    g.addColorStop(1, "rgba(0,240,255,0.05)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, h * 0.4);
    ctx.lineTo(-w * 0.42, -h * 0.02);
    ctx.arc(0, -h * 0.02, w * 0.42, Math.PI, 0, false);
    ctx.lineTo(w * 0.42, h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,227,107,0.95)";
    ctx.beginPath();
    ctx.arc(0, h * 0.08, t * 0.06, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShard(c, r, pulse) {
    const p = cellCenter(c, r);
    const t = view.tile;
    const s = t * (0.22 + pulse * 0.04);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.shadowColor = "rgba(255,61,184,0.95)";
    ctx.shadowBlur = 14 + pulse * 10;
    ctx.fillStyle = "rgba(255,61,184,0.92)";
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.25);
    ctx.lineTo(s * 0.72, s * 0.7);
    ctx.lineTo(-s * 0.72, s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,200,240,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(s * 0.28, s * 0.18);
    ctx.lineTo(-s * 0.18, s * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFrame() {
    const t = view.tile;
    const fr = view.frame;
    const x = view.ox - fr;
    const y = view.oy - fr;
    const w = st.cols * t + fr * 2;
    const h = st.rows * t + fr * 2;
    const pulse = 0.5 + 0.5 * Math.sin(clock * 1.4);

    ctx.save();
    roundRect(x, y, w, h, 14);
    ctx.strokeStyle = "rgba(0,240,255,0.55)";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "rgba(0,240,255,0.45)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    roundRect(x + 5, y + 5, w - 10, h - 10, 10);
    ctx.strokeStyle = "rgba(255,61,184,0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    function stud(sx, sy) {
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2, 0, TAU);
      ctx.fillStyle = "rgba(255,227,107,0.9)";
      ctx.shadowColor = "rgba(255,227,107,0.8)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    stud(x + 12, y + 12);
    stud(x + w - 12, y + 12);
    stud(x + 12, y + h - 12);
    stud(x + w - 12, y + h - 12);

    ctx.font = "600 10px 'Segoe UI', 'PingFang SC', 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,240,255," + (0.55 + pulse * 0.25) + ")";
    if (st.flipX) {
      ctx.save();
      ctx.translate(x + 11, y + h * 0.5);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("真 · 右", 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(x + w - 11, y + h * 0.5);
      ctx.rotate(Math.PI / 2);
      ctx.fillText("真 · 左", 0, 0);
      ctx.restore();
    }
    if (st.flipY) {
      ctx.fillText("真 · 下", x + w * 0.5, y + 11);
      ctx.fillText("真 · 上", x + w * 0.5, y + h - 11);
    }
    if (!st.flipY) {
      ctx.fillStyle = "rgba(255,61,184,0.55)";
      ctx.fillText("此为镜像", x + w * 0.5, y + 11);
    }

    const vis = walkerPos();
    const tru = trueCenter(st.pc, st.pr);
    ctx.fillStyle = "rgba(255,61,184,0.95)";
    ctx.beginPath();
    ctx.moveTo(vis.x, y + h - 7);
    ctx.lineTo(vis.x - 5, y + h - 16);
    ctx.lineTo(vis.x + 5, y + h - 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0,240,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(tru.x, y + h - 7);
    ctx.lineTo(tru.x - 5, y + h - 16);
    ctx.lineTo(tru.x + 5, y + h - 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawAxis() {
    const t = view.tile;
    const x = view.ox;
    const y = view.oy;
    const w = st.cols * t;
    const h = st.rows * t;
    ctx.save();
    ctx.strokeStyle = "rgba(0,240,255,0.16)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 6]);
    if (st.flipX) {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y + 4);
      ctx.lineTo(x + w * 0.5, y + h - 4);
      ctx.stroke();
    }
    if (st.flipY) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h * 0.5);
      ctx.lineTo(x + w - 4, y + h * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGlass() {
    const t = view.tile;
    const x = view.ox;
    const y = view.oy;
    const w = st.cols * t;
    const h = st.rows * t;
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    const u = (clock * 0.07) % 1;
    const a = 0.07;
    g.addColorStop(clamp(u - 0.1, 0, 1), "rgba(255,255,255,0)");
    g.addColorStop(clamp(u, 0, 1), "rgba(180,255,255," + a + ")");
    g.addColorStop(clamp(u + 0.1, 0, 1), "rgba(255,61,184,0.04)");
    g.addColorStop(clamp(u + 0.18, 0, 1), "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const sheen = ctx.createLinearGradient(x, y, x, y + h);
    sheen.addColorStop(0, "rgba(255,255,255,0.05)");
    sheen.addColorStop(0.45, "rgba(255,255,255,0)");
    sheen.addColorStop(1, "rgba(0,240,255,0.03)");
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, w, h);
  }

  function draw() {
    const w = view.cssW;
    const h = view.cssH;
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, w, h);

    const bg = ctx.createRadialGradient(w * 0.28, h * 0.08, 16, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
    bg.addColorStop(0, "rgba(255,61,184,0.08)");
    bg.addColorStop(0.45, "rgba(0,240,255,0.035)");
    bg.addColorStop(1, "rgba(5,3,12,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = m.mag
        ? "rgba(255,61,184," + (m.a * (0.55 + 0.45 * Math.sin(m.p))) + ")"
        : "rgba(0,240,255," + (m.a * (0.55 + 0.45 * Math.sin(m.p))) + ")";
      ctx.beginPath();
      ctx.arc(m.x * w, m.y * h, m.s, 0, TAU);
      ctx.fill();
    }

    if (st.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
    }

    const tile = view.tile;
    const inset = Math.max(1.5, tile * 0.08);
    const rr = Math.max(3, tile * 0.14);
    const pulse = 0.5 + 0.5 * Math.sin(clock * 3.1);

    roundRect(view.ox - 2, view.oy - 2, st.cols * tile + 4, st.rows * tile + 4, 8);
    ctx.fillStyle = "#070510";
    ctx.fill();

    for (let r = 0; r < st.rows; r++) {
      for (let c = 0; c < st.cols; c++) {
        const k = st.grid[r][c];
        const p = cellCenter(c, r);
        const x = p.x - tile * 0.5;
        const y = p.y - tile * 0.5;
        if (k === 1) {
          roundRect(x + 1, y + 1, tile - 2, tile - 2, rr * 0.6);
          const wg = ctx.createLinearGradient(x, y, x + tile, y + tile);
          wg.addColorStop(0, "rgba(28, 22, 48, 0.96)");
          wg.addColorStop(1, "rgba(10, 8, 22, 0.96)");
          ctx.fillStyle = wg;
          ctx.fill();
          ctx.strokeStyle = "rgba(0,240,255,0.16)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,61,184,0.08)";
          ctx.beginPath();
          ctx.moveTo(x + inset, y + inset);
          ctx.lineTo(x + tile - inset, y + inset);
          ctx.stroke();
        } else {
          const checker = (c + r) % 2 === 0;
          roundRect(x + inset, y + inset, tile - inset * 2, tile - inset * 2, rr);
          ctx.fillStyle = checker ? "rgba(18, 16, 36, 0.9)" : "rgba(14, 12, 30, 0.9)";
          ctx.fill();
          ctx.strokeStyle = "rgba(0,240,255,0.07)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    drawAxis();
    drawExit(st.E.c, st.E.r, pulse);

    for (let i = 0; i < st.shards.length; i++) {
      drawShard(st.shards[i].c, st.shards[i].r, pulse);
    }

    for (let i = 0; i < trail.length; i++) {
      const tr = trail[i];
      ctx.fillStyle = "rgba(255,61,184," + (0.18 * (tr.t / 0.38)) + ")";
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, tile * 0.1, 0, TAU);
      ctx.fill();
    }

    const wp = walkerPos();
    const fallS = st.phase === "die" ? 1 - st.fall * 0.85 : 1;
    const visFaceC = st.face.c;
    const visFaceR = st.face.r;

    if (st.phase !== "die" || st.fall < 0.85) {
      drawWalker(
        wp.x,
        wp.y,
        visFaceC,
        visFaceR,
        fallS,
        st.phase === "die" ? "rgba(255,120,190,0.7)" : "rgba(255,170,220,0.96)",
        "rgba(255,61,184,0.9)"
      );
    }

    for (let i = 0; i < cracks.length; i++) {
      const cr = cracks[i];
      ctx.strokeStyle = "rgba(255,61,184," + clamp(cr.life, 0, 1) + ")";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cr.x, cr.y);
      ctx.lineTo(cr.x2, cr.y2);
      ctx.stroke();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = "rgba(" + p.rgb + "," + a + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }

    drawGlass();
    drawFrame();

    if (st.shake > 0) ctx.restore();

    if (st.flash > 0) {
      ctx.fillStyle = "rgba(" + st.flashRgb + "," + (st.flash * 0.18) + ")";
      ctx.fillRect(0, 0, w, h);
    }
  }

  function fit() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const tw = Math.max(1, Math.round(cssW * dpr));
    const th = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    view.cssW = cssW;
    view.cssH = cssH;
    view.dpr = dpr;
    const cols = st.cols;
    const rows = st.rows;
    const margin = coarse ? 8 : 16;
    const frame = coarse ? 22 : 28;
    view.frame = frame;
    const padB = coarse ? 56 : 8;
    const tile = Math.max(
      16,
      Math.floor(Math.min(
        (cssW - margin * 2 - frame * 2) / cols,
        (cssH - margin * 2 - frame * 2 - padB) / rows
      ))
    );
    view.tile = tile;
    view.ox = (cssW - tile * cols) / 2;
    view.oy = (cssH - tile * rows - padB) / 2;
  }

  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor((x - view.ox) / view.tile);
    const r = Math.floor((y - view.oy) / view.tile);
    return { c: c, r: r, x: x, y: y };
  }

  function handleTap(vc, vr) {
    if (mode !== "play" || st.phase !== "play") return;
    const pvc = visC(st.pc);
    const pvr = visR(st.pr);
    const dc = vc - pvc;
    const dr = vr - pvr;
    if (!dc && !dr) return;
    if (Math.abs(dc) >= Math.abs(dr)) tryStep(dc > 0 ? 1 : -1, 0);
    else tryStep(0, dr > 0 ? 1 : -1);
  }

  function handleSwipe(dx, dy) {
    if (Math.abs(dx) < 22 && Math.abs(dy) < 22) return false;
    if (Math.abs(dx) > Math.abs(dy)) tryStep(dx > 0 ? 1 : -1, 0);
    else tryStep(0, dy > 0 ? 1 : -1);
    return true;
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (!overlay.classList.contains("hidden")) return;
    if (e.button != null && e.button !== 0) return;
    pointer.down = true;
    pointer.id = e.pointerId;
    const hit = cellFromEvent(e);
    pointer.x = hit.x;
    pointer.y = hit.y;
    pointer.sx = hit.x;
    pointer.sy = hit.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    const hit = cellFromEvent(e);
    pointer.x = hit.x;
    pointer.y = hit.y;
  });

  function endPointer(e) {
    if (!pointer.down || (e.pointerId != null && pointer.id !== e.pointerId)) return;
    pointer.down = false;
    const dx = pointer.x - pointer.sx;
    const dy = pointer.y - pointer.sy;
    if (!handleSwipe(dx, dy)) {
      const hit = cellFromEvent(e);
      handleTap(hit.c, hit.r);
    }
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", function () { pointer.down = false; });

  function bindPad(btn, dir, dc, dr) {
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add("held");
      pad[dir] = true;
      SFX.ensure();
      tryStep(dc, dr);
    };
    const up = function () {
      btn.classList.remove("held");
      pad[dir] = false;
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("click", function (e) { e.preventDefault(); });
  }
  bindPad(btnLeft, "left", -1, 0);
  bindPad(btnRight, "right", 1, 0);
  bindPad(btnUp, "up", 0, -1);
  bindPad(btnDown, "down", 0, 1);

  const keyMap = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    KeyA: "left",
    KeyD: "right",
    KeyW: "up",
    KeyS: "down"
  };

  window.addEventListener("keydown", function (e) {
    if (e.repeat) {
      if (keyMap[e.code] || e.code === "KeyM" || e.code === "KeyR" || e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
      }
      return;
    }
    if (e.code === "KeyM") {
      e.preventDefault();
      SFX.ensure();
      setMuted(!SFX.muted);
      return;
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      SFX.ensure();
      startRun();
      return;
    }
    if (e.code === "Space" || e.code === "Enter") {
      if (!overlay.classList.contains("hidden")) {
        e.preventDefault();
        SFX.ensure();
        ovBtn.click();
      }
      return;
    }
    const dir = keyMap[e.code];
    if (dir) {
      e.preventDefault();
      keys[dir] = true;
      SFX.ensure();
      const d = DIRS[dir];
      tryStep(d.c, d.r);
    }
  });

  window.addEventListener("keyup", function (e) {
    const dir = keyMap[e.code];
    if (dir) keys[dir] = false;
  });

  ovBtn.addEventListener("click", function () {
    SFX.ensure();
    startRun();
  });

  btnRetry.addEventListener("click", function () {
    SFX.ensure();
    startRun();
  });

  btnMute.addEventListener("click", function () {
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (paused) lastTs = 0;
  });

  window.addEventListener("resize", fit);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fit);
  }

  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (paused) dt = 0;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 6) {
      step(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
    if (steps && (hudTick += steps) >= 4) {
      hudTick = 0;
      renderHud();
    }
    requestAnimationFrame(frame);
  }

  fit();
  renderHud();
  setOverlay("title");
  requestAnimationFrame(frame);
})();
