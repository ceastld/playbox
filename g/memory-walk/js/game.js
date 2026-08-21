(() => {
  "use strict";

  const LIVES = 3;
  const STEP = 1 / 60;
  const MOVE_T = 0.13;
  const FADE_T = 0.72;
  const HOLD = 0.92;
  const DIE_T = 0.62;
  const CLEAR_T = 0.78;
  const LOCK = 0.18;
  const TAU = Math.PI * 2;
  const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5];

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
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function keyOf(c, r) {
    return c + "," + r;
  }

  const STAGES = [
    {
      name: "初记",
      sub: "GLIMMER",
      hint: "灯灭后，从灯下走回品红的家",
      cols: 7,
      rows: 6,
      showDt: 0.42,
      walkTime: 18,
      path: [[1, 2], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [5, 4]],
      decoys: [[5, 2], [5, 3], [3, 3], [2, 3], [1, 3], [3, 1], [2, 1], [4, 1]]
    },
    {
      name: "分叉",
      sub: "FORK",
      hint: "岔路看起来一样，记住转弯",
      cols: 8,
      rows: 7,
      showDt: 0.36,
      walkTime: 20,
      path: [[1, 1], [2, 1], [3, 1], [3, 2], [3, 3], [4, 3], [5, 3], [5, 4], [5, 5], [6, 5]],
      decoys: [[4, 1], [5, 1], [6, 1], [6, 2], [4, 2], [2, 2], [2, 3], [1, 3], [6, 3], [6, 4], [4, 4], [4, 5], [3, 5]]
    },
    {
      name: "回廊",
      sub: "HALL",
      hint: "中间的空地不是路",
      cols: 9,
      rows: 7,
      showDt: 0.32,
      walkTime: 22,
      path: [[1, 1], [2, 1], [3, 1], [4, 1], [4, 2], [4, 3], [3, 3], [2, 3], [2, 4], [2, 5], [3, 5], [4, 5], [5, 5]],
      decoys: [[3, 2], [2, 2], [5, 1], [6, 1], [5, 2], [6, 2], [5, 3], [6, 3], [1, 2], [1, 3], [1, 4], [1, 5], [3, 4], [4, 4], [5, 4], [6, 4], [6, 5], [7, 5]]
    },
    {
      name: "折角",
      sub: "KNIT",
      hint: "连续转弯，别抄近道",
      cols: 9,
      rows: 8,
      showDt: 0.28,
      walkTime: 24,
      path: [[1, 1], [2, 1], [3, 1], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [4, 4], [3, 4], [2, 4], [2, 5], [2, 6], [3, 6], [4, 6], [5, 6]],
      decoys: [[4, 1], [5, 1], [6, 1], [6, 2], [7, 2], [6, 3], [6, 4], [7, 4], [3, 3], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [3, 5], [4, 5], [5, 5], [6, 6], [7, 6]]
    },
    {
      name: "盲弯",
      sub: "BLIND",
      hint: "三道平行廊，认准起伏",
      cols: 10,
      rows: 8,
      showDt: 0.26,
      walkTime: 26,
      path: [[1, 2], [2, 2], [3, 2], [3, 3], [3, 4], [4, 4], [5, 4], [5, 3], [5, 2], [6, 2], [7, 2], [7, 3], [7, 4], [7, 5], [8, 5], [8, 6]],
      decoys: [[4, 2], [4, 3], [6, 3], [6, 4], [2, 3], [2, 4], [1, 3], [1, 4], [3, 1], [4, 1], [5, 1], [6, 1], [8, 2], [8, 3], [8, 4], [4, 5], [5, 5], [6, 5], [6, 6], [9, 5], [9, 6], [3, 5]]
    },
    {
      name: "归巢",
      sub: "NEST",
      hint: "环心是陷阱，贴着亮过的边走",
      cols: 10,
      rows: 9,
      showDt: 0.24,
      walkTime: 28,
      path: [[1, 1], [2, 1], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [1, 4], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [5, 4], [5, 3], [6, 3], [7, 3], [7, 4], [7, 5], [8, 5]],
      decoys: [[2, 2], [1, 2], [4, 1], [4, 2], [4, 3], [4, 4], [2, 4], [3, 4], [6, 4], [6, 5], [6, 2], [7, 2], [8, 2], [8, 3], [8, 4], [5, 2], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [7, 6], [8, 6], [6, 6]]
    }
  ];

  function pathIndexOf(path, c, r) {
    for (let i = 0; i < path.length; i++) {
      if (path[i][0] === c && path[i][1] === r) return i;
    }
    return -1;
  }

  function validateStages() {
    STAGES.forEach(function (s, si) {
      if (!s.name || !s.sub || !s.path || s.path.length < 5) {
        throw new Error("stage " + si + " short");
      }
      if (s.cols < 5 || s.rows < 5) throw new Error("grid " + si);
      const seen = {};
      for (let i = 0; i < s.path.length; i++) {
        const c = s.path[i][0];
        const r = s.path[i][1];
        if (c < 1 || r < 1 || c > s.cols - 2 || r > s.rows - 2) {
          throw new Error("path oob " + si + " " + i);
        }
        const k = keyOf(c, r);
        if (seen[k]) throw new Error("dup " + si + " " + k);
        seen[k] = 1;
        if (i > 0) {
          const pc = s.path[i - 1][0];
          const pr = s.path[i - 1][1];
          if (Math.abs(c - pc) + Math.abs(r - pr) !== 1) {
            throw new Error("gap " + si + " " + i);
          }
        }
      }
      for (let i = 0; i < s.path.length; i++) {
        for (let j = i + 2; j < s.path.length; j++) {
          const man = Math.abs(s.path[i][0] - s.path[j][0]) + Math.abs(s.path[i][1] - s.path[j][1]);
          if (man === 1) throw new Error("chord " + si + " " + i + "-" + j);
        }
      }
      const decoySet = {};
      (s.decoys || []).forEach(function (d) {
        const k = keyOf(d[0], d[1]);
        if (seen[k]) throw new Error("decoy on path " + si + " " + k);
        if (d[0] < 0 || d[1] < 0 || d[0] >= s.cols || d[1] >= s.rows) {
          throw new Error("decoy oob " + si);
        }
        decoySet[k] = 1;
      });
      let forks = 0;
      for (let i = 0; i < s.path.length; i++) {
        const c = s.path[i][0];
        const r = s.path[i][1];
        const nbs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (let k = 0; k < 4; k++) {
          if (decoySet[keyOf(c + nbs[k][0], r + nbs[k][1])]) forks += 1;
        }
      }
      if (forks < 2) throw new Error("no forks " + si);
    });
  }

  validateStages();

  if (typeof document === "undefined") {
    STAGES.forEach(function (s, si) {
      let c = s.path[s.path.length - 1][0];
      let r = s.path[s.path.length - 1][1];
      for (let i = s.path.length - 2; i >= 0; i--) {
        const nc = s.path[i][0];
        const nr = s.path[i][1];
        if (Math.abs(nc - c) + Math.abs(nr - r) !== 1) {
          throw new Error("cannot walk back " + si + " " + i);
        }
        c = nc;
        r = nr;
      }
      if (c !== s.path[0][0] || r !== s.path[0][1]) throw new Error("home miss " + si);
    });
    console.log("memory-walk maps ok", STAGES.length);
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
  const memWrap = document.getElementById("mem-wrap");
  const memFill = document.getElementById("mem-fill");
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
    hintEl.textContent = "点邻格或滑动 · 或用十字键 · 错格即坠";
  }

  const view = { tile: 48, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };
  const keys = { left: false, right: false, up: false, down: false };
  const pointer = { down: false, id: null, x: 0, y: 0, sx: 0, sy: 0 };

  const particles = [];
  const motes = [];

  let mode = "title";
  let overlayKind = "title";
  let toastT = 0;
  let acc = 0;
  let lastTs = 0;
  let paused = false;
  let lastStepAt = -9;
  let clock = 0;

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 48; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        s: 0.4 + Math.random() * 1.4,
        a: 0.04 + Math.random() * 0.1,
        v: 0.008 + Math.random() * 0.02,
        p: Math.random() * TAU
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
    light: function (i, n) {
      const note = NOTES[i % NOTES.length];
      this.beep(note, 0.16, "sine", 0.045, note * 1.18);
      if (i === n - 1) this.beep(note * 1.5, 0.28, "triangle", 0.05, note * 2);
    },
    fade: function () {
      this.noise(0.42, 0.07, 700);
      this.beep(220, 0.4, "sine", 0.04, 70);
    },
    step: function (prog) {
      const f = 420 + prog * 420;
      this.beep(f, 0.07, "triangle", 0.035, f * 1.3);
    },
    bump: function () {
      this.beep(90, 0.08, "square", 0.03, 60);
    },
    die: function () {
      this.noise(0.28, 0.1, 600);
      this.beep(240, 0.45, "sawtooth", 0.08, 55);
    },
    home: function () {
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
    tickDrone: function (dark, playing) {
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
      this.drone.frequency.setTargetAtTime(54 + dark * 28, t, 0.12);
      const vol = playing ? 0.016 + dark * 0.03 : 0.0001;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.18);
    },
    hushDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  };

  try {
    if (localStorage.getItem("memory-walk-mute") === "1") SFX.muted = true;
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
      localStorage.setItem("memory-walk-mute", m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.85;
  }

  function buildGrid(spec) {
    const grid = [];
    for (let r = 0; r < spec.rows; r++) {
      grid[r] = [];
      for (let c = 0; c < spec.cols; c++) grid[r][c] = 0;
    }
    (spec.decoys || []).forEach(function (d) {
      if (d[1] >= 0 && d[1] < spec.rows && d[0] >= 0 && d[0] < spec.cols) {
        grid[d[1]][d[0]] = 1;
      }
    });
    spec.path.forEach(function (p) {
      grid[p[1]][p[0]] = 2;
    });
    return grid;
  }

  function makeState(index, lives) {
    const spec = STAGES[index];
    const path = spec.path;
    const visited = {};
    visited[keyOf(path[path.length - 1][0], path[path.length - 1][1])] = 1;
    return {
      index: index,
      lives: lives == null ? LIVES : lives,
      spec: spec,
      cols: spec.cols,
      rows: spec.rows,
      grid: buildGrid(spec),
      path: path,
      phase: "show",
      t: 0,
      lit: -1,
      remain: spec.walkTime,
      pc: path[0][0],
      pr: path[0][1],
      fromC: path[0][0],
      fromR: path[0][1],
      toC: path[0][0],
      toR: path[0][1],
      anim: 0,
      moving: false,
      buf: null,
      visited: visited,
      shake: 0,
      flash: 0,
      flashRgb: "0,240,255",
      fall: 0,
      why: "",
      face: { c: 1, r: 0 },
      lock: LOCK
    };
  }

  let st = makeState(0);

  function cellCenter(c, r) {
    return {
      x: view.ox + (c + 0.5) * view.tile,
      y: view.oy + (r + 0.5) * view.tile
    };
  }

  function walkerPos() {
    if (st.phase === "show") {
      const u = clamp(st.t / st.spec.showDt, 0, st.path.length - 1);
      const i = Math.floor(u);
      const f = u - i;
      const a = st.path[i];
      const b = st.path[Math.min(st.path.length - 1, i + 1)];
      const ca = cellCenter(a[0], a[1]);
      const cb = cellCenter(b[0], b[1]);
      return { x: lerp(ca.x, cb.x, f), y: lerp(ca.y, cb.y, f), c: b[0] - a[0], r: b[1] - a[1] };
    }
    const a = cellCenter(st.fromC, st.fromR);
    const b = cellCenter(st.toC, st.toR);
    const f = st.moving ? smooth(st.anim) : 1;
    return {
      x: lerp(a.x, b.x, f),
      y: lerp(a.y, b.y, f),
      c: st.face.c,
      r: st.face.r
    };
  }

  function kindAt(c, r) {
    if (c < 0 || r < 0 || c >= st.cols || r >= st.rows) return 0;
    return st.grid[r][c];
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
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

  function burstCell(c, r, rgb, n) {
    const p = cellCenter(c, r);
    emit(n, {
      x: p.x,
      y: p.y,
      j: view.tile * 0.18,
      vx0: -80,
      vx1: 80,
      vy0: -120,
      vy1: 40,
      life: 0.55,
      r0: 1.2,
      r1: 3.4,
      rgb: rgb
    });
  }

  function pathGlow(idx) {
    const n = st.path.length;
    if (st.phase === "show") {
      const k = st.t / st.spec.showDt;
      if (idx + 1 < k) return 1;
      if (idx > k) return 0;
      return smooth(clamp(k - idx, 0, 1));
    }
    if (st.phase === "fade") return 1 - smooth(st.t / FADE_T);
    return 0;
  }

  function memoryAmt() {
    if (mode === "title") {
      const n = STAGES[0].path.length;
      const cycle = (n - 1) * STAGES[0].showDt + HOLD + FADE_T + 0.6;
      const u = clock % cycle;
      const showEnd = (n - 1) * STAGES[0].showDt + HOLD;
      if (u < showEnd) return clamp(u / showEnd, 0, 1);
      if (u < showEnd + FADE_T) return 1 - (u - showEnd) / FADE_T;
      return 0;
    }
    if (st.phase === "show") {
      const need = (st.path.length - 1) * st.spec.showDt + HOLD;
      return clamp(st.t / need, 0, 1);
    }
    if (st.phase === "fade") return 1;
    if (st.phase === "walk") return clamp(st.remain / st.spec.walkTime, 0, 1);
    if (st.phase === "clear") return 1;
    if (st.phase === "die") return 0;
    return 0;
  }

  function phaseName() {
    if (mode === "title") return "看路";
    if (st.phase === "show") return "记路";
    if (st.phase === "fade") return "灭灯";
    if (st.phase === "walk") return "走回";
    if (st.phase === "die") return "踏空";
    if (st.phase === "clear") return "归巢";
    return "—";
  }

  function renderHud() {
    const spec = mode === "title" ? STAGES[0] : st.spec;
    const idx = mode === "title" ? 0 : st.index;
    stageLabel.textContent = "关卡 " + (idx + 1) + " / " + STAGES.length + "  ·  " + spec.name + "  ·  " + phaseName();
    const mem = memoryAmt();
    memFill.style.width = (mem * 100).toFixed(1) + "%";
    const warn = (st.phase === "walk" && st.remain < 6) || st.phase === "die";
    memWrap.classList.toggle("warn", mode === "play" && warn);
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
    const walking = mode === "play" && st.phase === "walk" && overlay.classList.contains("hidden");
    padEl.classList.toggle("off", !coarse || !walking);
  }

  function setHint() {
    if (mode === "title") {
      hintEl.textContent = coarse
        ? "点邻格或滑动 · 或用十字键 · 错格即坠"
        : "亮一次路径 · 灭灯后原路走回品红的家";
      return;
    }
    if (st.phase === "show") hintEl.textContent = "看路 · 只亮一次";
    else if (st.phase === "fade") hintEl.textContent = "灭灯";
    else if (st.phase === "walk") hintEl.textContent = "原路走回品红的家 · 错格即坠";
    else if (st.phase === "die") hintEl.textContent = "踏空";
    else if (st.phase === "clear") hintEl.textContent = "归巢";
  }

  function setOverlay(kind) {
    overlayKind = kind;
    panel.classList.remove("win", "lose");
    overlay.classList.remove("hidden");
    if (kind === "title") {
      ovKicker.textContent = "RECALL";
      ovTitle.textContent = "记路";
      ovLead.innerHTML = "灯亮一次。灭灯后，凭记忆走回家。<br />岔路上的地砖看起来一样，踏空即坠。";
      ovOps.textContent = "WASD / 方向键逐格 · 点邻格或滑动 · M 静音";
      ovBtn.textContent = "看路";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "HOME";
      ovTitle.textContent = "归巢";
      ovLead.textContent = "六次灭灯，六次走回。路还在记忆里。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再来一局";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "路没了";
      const why = st.why === "time" ? "记忆耗尽，灯下的路散成暗砖。" : "踏进未曾亮过的地砖，坠落。";
      ovLead.textContent = why + " 三次走丢，路从记忆里抽走了。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再走一次";
    }
    renderHud();
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startRun() {
    mode = "play";
    st = makeState(0, LIVES);
    hideOverlay();
    fit();
    showToast("记路 · " + st.spec.hint);
    setHint();
    renderHud();
    SFX.ensure();
  }

  function loadStage(index, lives) {
    st = makeState(index, lives);
    showToast("记路 · " + st.spec.hint);
    setHint();
    renderHud();
    fit();
  }

  function beginWalk() {
    const last = st.path[st.path.length - 1];
    st.phase = "walk";
    st.t = 0;
    st.pc = last[0];
    st.pr = last[1];
    st.fromC = last[0];
    st.fromR = last[1];
    st.toC = last[0];
    st.toR = last[1];
    st.moving = false;
    st.anim = 0;
    st.buf = null;
    st.lock = 0.12;
    st.remain = st.spec.walkTime;
    st.visited = {};
    st.visited[keyOf(last[0], last[1])] = 1;
    st.face = {
      c: last[0] - st.path[st.path.length - 2][0],
      r: last[1] - st.path[st.path.length - 2][1]
    };
    showToast("你在灯下 · 走回去");
    setHint();
  }

  function tryStep(dc, dr) {
    if (mode !== "play" || st.phase !== "walk") return false;
    if (st.lock > 0) return false;
    if (!dc && !dr) return false;
    if (Math.abs(dc) + Math.abs(dr) !== 1) return false;
    if (st.moving) {
      st.buf = { c: dc, r: dr };
      return false;
    }
    const now = clock;
    if (now - lastStepAt < 0.07) return false;
    const nc = st.pc + dc;
    const nr = st.pr + dr;
    const k = kindAt(nc, nr);
    if (k === 0) {
      lastStepAt = now;
      st.shake = Math.max(st.shake, 4);
      SFX.bump();
      st.face = { c: dc, r: dr };
      return false;
    }
    lastStepAt = now;
    st.fromC = st.pc;
    st.fromR = st.pr;
    st.toC = nc;
    st.toR = nr;
    st.moving = true;
    st.anim = 0;
    st.face = { c: dc, r: dr };
    st.buf = null;
    if (k === 1) {
      st.why = "decoy";
      st._pendingDie = true;
    } else {
      st._pendingDie = false;
      const home = st.path[0];
      st._pendingClear = nc === home[0] && nr === home[1];
    }
    return true;
  }

  function finishMove() {
    st.pc = st.toC;
    st.pr = st.toR;
    st.fromC = st.pc;
    st.fromR = st.pr;
    st.moving = false;
    st.anim = 0;
    st.visited[keyOf(st.pc, st.pr)] = 1;
    const p = cellCenter(st.pc, st.pr);
    if (st._pendingDie) {
      st.phase = "die";
      st.t = 0;
      st.flash = 0.5;
      st.flashRgb = "255,61,184";
      st.shake = 10;
      st.fall = 0;
      burstCell(st.pc, st.pr, "255,61,184", 22);
      SFX.die();
      setHint();
      return;
    }
    const prog = 1 - pathIndexOf(st.path, st.pc, st.pr) / Math.max(1, st.path.length - 1);
    SFX.step(clamp(prog, 0, 1));
    emit(6, {
      x: p.x,
      y: p.y,
      j: 6,
      vx0: -40,
      vx1: 40,
      vy0: -50,
      vy1: -8,
      life: 0.32,
      r0: 1,
      r1: 2.2,
      rgb: "255,61,184"
    });
    if (st._pendingClear) {
      st.phase = "clear";
      st.t = 0;
      st.flash = 0.55;
      st.flashRgb = "0,240,255";
      burstCell(st.pc, st.pr, "0,240,255", 26);
      burstCell(st.pc, st.pr, "255,61,184", 10);
      SFX.home();
      showToast("归巢");
      setHint();
      return;
    }
    if (st.buf) {
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
    const lives = st.lives;
    const index = st.index;
    loadStage(index, lives);
    showToast("还剩 " + lives + " 命 · 再看一次", true);
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

  function tickShow(dt) {
    const prevLit = st.lit;
    st.t += dt;
    const u = st.t / st.spec.showDt;
    const lit = Math.min(st.path.length - 1, Math.floor(u));
    if (lit > prevLit) {
      st.lit = lit;
      const cell = st.path[lit];
      burstCell(cell[0], cell[1], "0,240,255", 8);
      if (mode === "play") SFX.light(lit, st.path.length);
    }
    const showEnd = (st.path.length - 1) * st.spec.showDt + HOLD;
    if (st.t >= showEnd) {
      if (mode === "title") {
        st.phase = "fade";
        st.t = 0;
        return;
      }
      st.phase = "fade";
      st.t = 0;
      SFX.fade();
      showToast("灭灯", true);
      setHint();
    }
  }

  function tickFade(dt) {
    st.t += dt;
    if (st.t >= FADE_T) {
      if (mode === "title") {
        st = makeState(0, LIVES);
        return;
      }
      beginWalk();
    }
  }

  function tickWalk(dt) {
    st.lock = Math.max(0, st.lock - dt);
    st.remain -= dt;
    if (st.moving) {
      st.anim += dt / MOVE_T;
      if (st.anim >= 1) finishMove();
    }
    if (st.phase !== "walk") return;
    if (st.remain <= 0) {
      st.remain = 0;
      st.why = "time";
      st.phase = "die";
      st.t = 0;
      st.flash = 0.45;
      st.flashRgb = "255,61,184";
      st.shake = 8;
      const p = walkerPos();
      emit(18, {
        x: p.x,
        y: p.y,
        j: 10,
        vx0: -70,
        vx1: 70,
        vy0: -90,
        vy1: 30,
        life: 0.5,
        r0: 1.2,
        r1: 3,
        rgb: "255,61,184"
      });
      SFX.die();
      showToast("记忆耗尽", true);
      setHint();
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

    if (mode === "title") {
      if (st.phase === "show") tickShow(dt);
      else if (st.phase === "fade") tickFade(dt);
    } else if (mode === "play") {
      if (st.phase === "show") tickShow(dt);
      else if (st.phase === "fade") tickFade(dt);
      else if (st.phase === "walk") tickWalk(dt);
      else if (st.phase === "die") tickDie(dt);
      else if (st.phase === "clear") tickClear(dt);
    }

    const dark = (mode === "play" && (st.phase === "walk" || st.phase === "fade" || st.phase === "die")) ? 1 : (st.phase === "show" ? 0.25 : 0);
    SFX.tickDrone(dark, mode === "play" || mode === "title");

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 70 * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y -= m.v * dt * 0.25;
      m.p += dt * 0.7;
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

  function drawWalker(x, y, faceC, faceR, cyanMix, scale) {
    const t = view.tile;
    const s = t * 0.34 * scale;
    ctx.save();
    ctx.translate(x, y);
    const ang = Math.atan2(faceR, faceC);
    ctx.rotate(isNaN(ang) ? 0 : ang);
    ctx.shadowColor = cyanMix > 0.5 ? "rgba(0,240,255,0.85)" : "rgba(255,61,184,0.85)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(s * 1.05, 0);
    ctx.lineTo(0, s * 0.62);
    ctx.lineTo(-s * 0.72, 0);
    ctx.lineTo(0, -s * 0.62);
    ctx.closePath();
    const g = ctx.createLinearGradient(-s, 0, s, 0);
    g.addColorStop(0, "rgba(255,61,184,0.95)");
    g.addColorStop(1, "rgba(0,240,255,0.95)");
    ctx.fillStyle = cyanMix > 0.55
      ? "rgba(190,255,255,0.96)"
      : cyanMix < 0.45
        ? "rgba(255,170,220,0.96)"
        : g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(8,6,18,0.85)";
    ctx.beginPath();
    ctx.arc(s * 0.12, 0, s * 0.16, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHearth(c, r, pulse) {
    const p = cellCenter(c, r);
    const t = view.tile;
    const rad = t * (0.18 + pulse * 0.06);
    ctx.save();
    ctx.shadowColor = "rgba(255,61,184,0.9)";
    ctx.shadowBlur = 22 + pulse * 16;
    ctx.fillStyle = "rgba(255,61,184,0.28)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad * 1.7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,227,107,0.85)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad * 0.55, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,61,184,0.95)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawLantern(c, r, on) {
    const p = cellCenter(c, r);
    const t = view.tile;
    ctx.save();
    ctx.strokeStyle = on ? "rgba(0,240,255,0.85)" : "rgba(0,240,255,0.22)";
    ctx.lineWidth = Math.max(1.4, t * 0.04);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + t * 0.18);
    ctx.lineTo(p.x, p.y - t * 0.16);
    ctx.stroke();
    ctx.shadowColor = on ? "rgba(0,240,255,0.9)" : "rgba(0,240,255,0.2)";
    ctx.shadowBlur = on ? 16 : 4;
    ctx.fillStyle = on ? "rgba(180,255,255,0.95)" : "rgba(0,240,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - t * 0.28);
    ctx.lineTo(p.x + t * 0.1, p.y - t * 0.16);
    ctx.lineTo(p.x, p.y - t * 0.06);
    ctx.lineTo(p.x - t * 0.1, p.y - t * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const w = view.cssW;
    const h = view.cssH;
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, w, h);

    const bg = ctx.createRadialGradient(w * 0.3, h * 0.1, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    bg.addColorStop(0, "rgba(255,61,184,0.07)");
    bg.addColorStop(0.45, "rgba(0,240,255,0.03)");
    bg.addColorStop(1, "rgba(5,3,12,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = "rgba(0,240,255," + (m.a * (0.6 + 0.4 * Math.sin(m.p))) + ")";
      ctx.beginPath();
      ctx.arc(m.x * w, m.y * h, m.s, 0, TAU);
      ctx.fill();
    }

    if (st.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
    }

    const tile = view.tile;
    const pad = tile * 0.1;
    const rr = Math.max(4, tile * 0.16);
    const home = st.path[0];
    const lamp = st.path[st.path.length - 1];
    const showish = st.phase === "show" || (mode === "title" && st.phase !== "fade");
    const fadeAmt = st.phase === "fade" ? 1 - smooth(st.t / FADE_T) : (st.phase === "show" ? 1 : 0);
    const walkDark = st.phase === "walk" || st.phase === "die" || (st.phase === "clear");

    for (let r = 0; r < st.rows; r++) {
      for (let c = 0; c < st.cols; c++) {
        const x = view.ox + c * tile;
        const y = view.oy + r * tile;
        const k = st.grid[r][c];
        if (k === 0) {
          const sheen = ((c * 13 + r * 7) % 5) / 5;
          ctx.fillStyle = "rgba(7, 5, 16, 0.55)";
          ctx.fillRect(x, y, tile, tile);
          ctx.fillStyle = "rgba(12, 10, 26, 0.9)";
          roundRect(x + pad * 0.15, y + pad * 0.15, tile - pad * 0.3, tile - pad * 0.3, rr * 0.45);
          ctx.fill();
          ctx.strokeStyle = sheen > 0.5
            ? "rgba(0,240,255," + (0.04 + sheen * 0.04) + ")"
            : "rgba(255,61,184," + (0.03 + sheen * 0.04) + ")";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          roundRect(x + pad * 0.55, y + pad * 0.55, tile - pad * 1.1, tile - pad * 1.1, rr);
          ctx.fillStyle = "rgba(28, 24, 52, 0.96)";
          ctx.fill();
          ctx.strokeStyle = "rgba(180, 200, 255, 0.22)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          roundRect(x + pad * 1.15, y + pad * 1.15, tile - pad * 2.3, tile - pad * 2.3, rr * 0.7);
          ctx.fillStyle = "rgba(14, 12, 32, 0.9)";
          ctx.fill();

          const idx = pathIndexOf(st.path, c, r);
          let glow = idx >= 0 ? pathGlow(idx) : 0;
          if (idx >= 0 && walkDark && st.visited[keyOf(c, r)]) {
            roundRect(x + pad * 1.2, y + pad * 1.2, tile - pad * 2.4, tile - pad * 2.4, rr * 0.85);
            ctx.fillStyle = "rgba(255,61,184," + (0.22 + 0.12 * Math.sin(clock * 4 + idx)) + ")";
            ctx.fill();
          }
          if (glow > 0.02) {
            roundRect(x + pad * 0.8, y + pad * 0.8, tile - pad * 1.6, tile - pad * 1.6, rr);
            ctx.fillStyle = "rgba(0,240,255," + (0.12 + glow * 0.42) + ")";
            ctx.fill();
            ctx.shadowColor = "rgba(0,240,255,0.8)";
            ctx.shadowBlur = 12 * glow;
            ctx.strokeStyle = "rgba(160,255,255," + (0.25 + glow * 0.65) + ")";
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }
    }

    const hearthPulse = 0.5 + 0.5 * Math.sin(clock * 3.2);
    drawHearth(home[0], home[1], hearthPulse);
    const lampOn = showish || fadeAmt > 0.2 || (st.phase === "walk" && st.pc === lamp[0] && st.pr === lamp[1]);
    drawLantern(lamp[0], lamp[1], st.phase === "show" || (lampOn && fadeAmt > 0.15));

    if (st.phase === "show") {
      const u = clamp(st.t / st.spec.showDt, 0, st.path.length - 1);
      const segs = Math.floor(u);
      ctx.save();
      ctx.strokeStyle = "rgba(0,240,255,0.55)";
      ctx.lineWidth = Math.max(2, tile * 0.06);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(0,240,255,0.7)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const p = cellCenter(st.path[i][0], st.path[i][1]);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      if (segs < st.path.length - 1) {
        const a = cellCenter(st.path[segs][0], st.path[segs][1]);
        const b = cellCenter(st.path[segs + 1][0], st.path[segs + 1][1]);
        const f = u - segs;
        ctx.lineTo(lerp(a.x, b.x, f), lerp(a.y, b.y, f));
      }
      ctx.stroke();
      ctx.restore();
    }

    const wp = walkerPos();
    let cyanMix = 1;
    if (st.phase === "fade") cyanMix = 1 - smooth(st.t / FADE_T);
    else if (st.phase === "walk" || st.phase === "die" || st.phase === "clear") cyanMix = 0;
    let scale = 1;
    if (st.phase === "die") scale = Math.max(0.05, 1 - st.fall);
    if (st.phase === "clear") scale = 1 + 0.12 * Math.sin(st.t * 12);
    if (st.phase === "walk" || st.phase === "clear") {
      ctx.save();
      ctx.strokeStyle = "rgba(255,61,184,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, tile * 0.38, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (!(st.phase === "die" && st.fall > 0.98)) {
      const fc = wp.c || st.face.c;
      const fr = wp.r || st.face.r;
      drawWalker(wp.x, wp.y, fc, fr, cyanMix, scale);
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = "rgba(" + p.rgb + "," + (a * 0.9) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }

    if (st.shake > 0) ctx.restore();

    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    if (st.flash > 0) {
      ctx.fillStyle = "rgba(" + st.flashRgb + "," + (st.flash * 0.22) + ")";
      ctx.fillRect(0, 0, w, h);
    }

    if (mode === "play" && st.phase === "walk") {
      ctx.font = "600 11px Segoe UI, PingFang SC, sans-serif";
      ctx.fillStyle = st.remain < 6 ? "rgba(255,61,184,0.85)" : "rgba(200,240,255,0.45)";
      ctx.textAlign = "right";
      ctx.fillText(st.remain.toFixed(1) + " ″", w - 14, 18);
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
    const margin = coarse ? 10 : 18;
    const tile = Math.max(16, Math.floor(Math.min((cssW - margin * 2) / cols, (cssH - margin * 2) / rows)));
    view.tile = tile;
    view.ox = (cssW - tile * cols) / 2;
    view.oy = (cssH - tile * rows) / 2;
  }

  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor((x - view.ox) / view.tile);
    const r = Math.floor((y - view.oy) / view.tile);
    return { c: c, r: r, x: x, y: y };
  }

  function handleTap(c, r) {
    if (mode !== "play" || st.phase !== "walk") return;
    const dc = c - st.pc;
    const dr = r - st.pr;
    if (Math.abs(dc) + Math.abs(dr) === 1) tryStep(dc, dr);
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
    pointer.sc = hit.c;
    pointer.sr = hit.r;
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

  function bindPad(btn, dc, dr) {
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add("held");
      SFX.ensure();
      tryStep(dc, dr);
    };
    const up = function () { btn.classList.remove("held"); };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("click", function (e) { e.preventDefault(); });
  }
  bindPad(btnLeft, -1, 0);
  bindPad(btnRight, 1, 0);
  bindPad(btnUp, 0, -1);
  bindPad(btnDown, 0, 1);

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
  let hudTick = 0;

  fit();
  renderHud();
  setOverlay("title");
  requestAnimationFrame(frame);
})();
