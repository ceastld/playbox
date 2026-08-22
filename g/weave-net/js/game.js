(() => {
  "use strict";

  const PAD = 0.032;
  const LIVES = 3;
  const TAIL = 10;
  const SAMPLE = 0.011;
  const MUTE_KEY = "playbox-weave-net-mute";

  const COLORS = [
    { name: "粉", hex: "#ff3db8", r: 255, g: 61, b: 184 },
    { name: "青", hex: "#00f0ff", r: 0, g: 240, b: 255 },
    { name: "金", hex: "#ffe36b", r: 255, g: 227, b: 107 },
    { name: "紫", hex: "#c77dff", r: 199, g: 125, b: 255 },
    { name: "翠", hex: "#3dffa6", r: 61, g: 255, b: 166 },
    { name: "橙", hex: "#ff8a4c", r: 255, g: 138, b: 76 }
  ];

  const STAGES = [
    {
      name: "初丝",
      sub: "FIRST",
      time: 40,
      hint: "走入光点牵丝，送到同色。丝线不能相交。",
      start: [0.5, 0.5],
      pairs: [
        [[0.2, 0.28], [0.8, 0.28]],
        [[0.2, 0.72], [0.8, 0.72]]
      ]
    },
    {
      name: "交梭",
      sub: "CROSS",
      time: 45,
      hint: "直线会相交。绕开，走外围。",
      start: [0.5, 0.1],
      pairs: [
        [[0.22, 0.22], [0.78, 0.78]],
        [[0.78, 0.22], [0.22, 0.78]]
      ]
    },
    {
      name: "门经",
      sub: "GATE",
      time: 48,
      hint: "先织中间，或绕过已成的墙。",
      start: [0.12, 0.5],
      pairs: [
        [[0.2, 0.26], [0.8, 0.26]],
        [[0.2, 0.74], [0.8, 0.74]],
        [[0.5, 0.16], [0.5, 0.84]]
      ]
    },
    {
      name: "套经",
      sub: "NEST",
      time: 50,
      hint: "先织里面的短丝。小十字会互挡，外斜必须绕。",
      start: [0.5, 0.08],
      pairs: [
        [[0.42, 0.5], [0.58, 0.5]],
        [[0.5, 0.36], [0.5, 0.64]],
        [[0.18, 0.18], [0.82, 0.82]]
      ]
    },
    {
      name: "三星",
      sub: "TRIO",
      time: 50,
      hint: "三线交于一心。全部走边。",
      start: [0.5, 0.5],
      pairs: [
        [[0.18, 0.2], [0.82, 0.8]],
        [[0.82, 0.2], [0.18, 0.8]],
        [[0.5, 0.14], [0.5, 0.86]]
      ]
    },
    {
      name: "四象",
      sub: "QUAD",
      time: 54,
      hint: "十字与斜线都过中心。外围是活路。",
      start: [0.08, 0.08],
      pairs: [
        [[0.5, 0.12], [0.5, 0.88]],
        [[0.12, 0.5], [0.88, 0.5]],
        [[0.22, 0.22], [0.78, 0.78]],
        [[0.78, 0.22], [0.22, 0.78]]
      ]
    },
    {
      name: "错纬",
      sub: "SHIFT",
      time: 56,
      hint: "点位错开。从缝里穿过，别钩到旁点。",
      start: [0.5, 0.5],
      pairs: [
        [[0.16, 0.18], [0.58, 0.82]],
        [[0.42, 0.18], [0.84, 0.82]],
        [[0.16, 0.82], [0.84, 0.18]],
        [[0.84, 0.42], [0.16, 0.58]]
      ]
    },
    {
      name: "华网",
      sub: "BLOOM",
      time: 60,
      hint: "五色同织。贴边通道很窄，钩到旁点会断丝。",
      start: [0.5, 0.5],
      pairs: [
        [[0.12, 0.12], [0.88, 0.88]],
        [[0.88, 0.12], [0.12, 0.88]],
        [[0.5, 0.1], [0.12, 0.5]],
        [[0.88, 0.5], [0.5, 0.9]],
        [[0.3, 0.3], [0.7, 0.7]]
      ]
    },
    {
      name: "密纬",
      sub: "MESH",
      time: 54,
      hint: "内外五星相套。从缝里钻出去，先连近点。",
      start: [0.5, 0.5],
      pairs: [
        [[0.5, 0.12], [0.61, 0.66]],
        [[0.86, 0.36], [0.39, 0.66]],
        [[0.74, 0.86], [0.34, 0.44]],
        [[0.26, 0.86], [0.5, 0.32]],
        [[0.14, 0.36], [0.66, 0.44]]
      ]
    },
    {
      name: "囚网",
      sub: "CAGE",
      time: 56,
      hint: "内十字被外框锁死。先拆芯，再贴边走外框。",
      start: [0.08, 0.08],
      pairs: [
        [[0.5, 0.14], [0.5, 0.86]],
        [[0.14, 0.5], [0.86, 0.5]],
        [[0.16, 0.16], [0.84, 0.84]],
        [[0.84, 0.16], [0.16, 0.84]],
        [[0.4, 0.5], [0.6, 0.5]],
        [[0.5, 0.4], [0.5, 0.6]]
      ]
    },
    {
      name: "绝织",
      sub: "APEX",
      time: 48,
      hint: "六色相套。只能一层层往里织，贴边缝极窄。",
      start: [0.5, 0.5],
      pairs: [
        [[0.18, 0.15], [0.82, 0.85]],
        [[0.18, 0.29], [0.82, 0.71]],
        [[0.18, 0.43], [0.82, 0.57]],
        [[0.18, 0.57], [0.82, 0.43]],
        [[0.18, 0.71], [0.82, 0.29]],
        [[0.18, 0.85], [0.82, 0.15]]
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
  const stageLabel = document.getElementById("stage-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const btnUndo = document.getElementById("btn-undo");

  let W = 1;
  let H = 1;
  let dpr = 1;
  const board = { x: 0, y: 0, s: 100, nr: 0.04, wr: 0.016, tw: 0.01, hit: 0.02, nodePx: 16, weaverPx: 8, threadPx: 5 };

  const keys = { u: false, d: false, l: false, r: false };
  const particles = [];
  const motes = [];
  const trail = [];

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
        this.master.gain.value = this.muted ? 0 : 0.2;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.2;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) {
        /* ignore */
      }
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
      o.stop(t + dur + 0.02);
    },
    pulse(kind, col) {
      this.ensure();
      const base = col ? 280 + col * 70 : 440;
      if (kind === "pick") {
        this.beep(base, 0.12, "triangle", 0.08, base * 1.5);
      } else if (kind === "lock") {
        this.beep(base, 0.16, "sine", 0.09, base * 2);
        this.beep(base * 1.5, 0.22, "triangle", 0.05, base * 2.2);
      } else if (kind === "snap") {
        this.beep(180, 0.22, "sawtooth", 0.08, 70);
        this.beep(90, 0.28, "square", 0.05, 40);
      } else if (kind === "bump") {
        this.beep(140, 0.05, "square", 0.03, 90);
      } else if (kind === "cancel") {
        this.beep(320, 0.08, "sine", 0.04, 180);
      } else if (kind === "undo") {
        this.beep(520, 0.1, "triangle", 0.05, 260);
      } else if (kind === "tick") {
        this.beep(880, 0.06, "sine", 0.035);
      } else if (kind === "stage") {
        this.beep(392, 0.12, "sine", 0.06, 523);
        this.beep(523, 0.18, "triangle", 0.05, 784);
      } else if (kind === "win") {
        this.beep(440, 0.18, "sine", 0.09, 660);
        this.beep(660, 0.28, "triangle", 0.07, 880);
        this.beep(880, 0.4, "sine", 0.05, 1320);
      } else if (kind === "lose") {
        this.beep(220, 0.45, "sawtooth", 0.08, 70);
        this.beep(110, 0.6, "triangle", 0.06, 50);
      } else if (kind === "start") {
        this.beep(330, 0.14, "sine", 0.07, 660);
      }
    }
  };

  const G = {
    mode: "title",
    stage: 0,
    time: 0,
    lives: LIVES,
    nodes: [],
    threads: [],
    draw: null,
    wx: 0.5,
    wy: 0.5,
    pointer: null,
    shake: 0,
    flash: 0,
    flashC: 0,
    clearing: 0,
    lock: 0,
    toastT: 0,
    clock: 0,
    fail: "",
    totalTime: 0,
    totalSnags: 0,
    lastTick: 9,
    bumpT: 0,
    dying: 0,
    hudKey: "",
    hudLives: -1
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }
  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }
  function rgba(c, a) {
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function orient(ax, ay, bx, by, cx, cy) {
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  }

  function segCross(ax, ay, bx, by, cx, cy, dx, dy) {
    const o1 = orient(ax, ay, bx, by, cx, cy);
    const o2 = orient(ax, ay, bx, by, dx, dy);
    const o3 = orient(cx, cy, dx, dy, ax, ay);
    const o4 = orient(cx, cy, dx, dy, bx, by);
    return o1 * o2 < 0 && o3 * o4 < 0;
  }

  function pointSeg(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    let t = ab2 > 1e-12 ? (apx * abx + apy * aby) / ab2 : 0;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
  }

  function sc(x, y) {
    return { x: board.x + x * board.s, y: board.y + y * board.s };
  }

  function nodeById(id) {
    for (let i = 0; i < G.nodes.length; i++) {
      if (G.nodes[i].id === id) return G.nodes[i];
    }
    return null;
  }

  function twinOf(node) {
    for (let i = 0; i < G.nodes.length; i++) {
      const n = G.nodes[i];
      if (n.c === node.c && n.id !== node.id) return n;
    }
    return null;
  }

  function pairsLeft() {
    let n = 0;
    const seen = {};
    for (let i = 0; i < G.nodes.length; i++) {
      const nd = G.nodes[i];
      if (!nd.done && !seen[nd.c]) {
        seen[nd.c] = 1;
        n++;
      }
    }
    return n;
  }

  function hitNode(x, y, scale) {
    let best = null;
    let bestD = 1e9;
    const lim = board.nr * scale;
    const lim2 = lim * lim;
    for (let i = 0; i < G.nodes.length; i++) {
      const n = G.nodes[i];
      if (n.done) continue;
      const d = dist2(x, y, n.x, n.y);
      if (d < lim2 && d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 1.85;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 88) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        c: spec.c
      });
    }
  }

  function emitAlong(pts, col, n) {
    if (!pts.length) return;
    for (let i = 0; i < n; i++) {
      const p = pts[(Math.random() * pts.length) | 0];
      emit(1, {
        x: p.x,
        y: p.y,
        j: 0.01,
        vx0: -0.12,
        vx1: 0.12,
        vy0: -0.16,
        vy1: 0.08,
        life: 0.55,
        r0: 1.2,
        r1: 2.8,
        c: col
      });
    }
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 56; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.3 + 0.3,
        a: Math.random() * 0.35 + 0.06,
        p: Math.random() * Math.PI * 2,
        s: 0.15 + Math.random() * 0.35
      });
    }
  }

  function resize() {
    const host = canvas.parentElement;
    const rect = host.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const inset = Math.max(14, Math.min(W, H) * 0.04);
    const side = Math.max(48, Math.min(W, H) - inset * 2);
    board.s = side;
    board.x = (W - side) / 2;
    board.y = (H - side) / 2;
    board.nodePx = Math.max(15, side * 0.036);
    board.weaverPx = Math.max(7, side * 0.015);
    board.threadPx = Math.max(4.2, side * 0.01);
    board.nr = board.nodePx / side;
    board.wr = board.weaverPx / side;
    board.tw = board.threadPx / side;
    board.hit = board.tw * 0.52 + board.wr * 0.7;
  }

  function loadStage(index) {
    const st = STAGES[index];
    G.stage = index;
    G.time = st.time;
    G.lives = LIVES;
    G.nodes = [];
    G.threads = [];
    G.draw = null;
    G.wx = st.start[0];
    G.wy = st.start[1];
    G.clearing = 0;
    G.dying = 0;
    G.fail = "";
    G.lastTick = 9;
    G.pointer = G.pointer ? { x: G.pointer.x, y: G.pointer.y, id: G.pointer.id, stroke: false } : null;
    trail.length = 0;
    let id = 0;
    for (let c = 0; c < st.pairs.length; c++) {
      const pr = st.pairs[c];
      G.nodes.push({ id: id++, c: c, x: pr[0][0], y: pr[0][1], done: false });
      G.nodes.push({ id: id++, c: c, x: pr[1][0], y: pr[1][1], done: false });
    }
    hintEl.textContent = st.hint;
    toast(st.name + " · " + st.sub);
    syncHud();
  }

  function syncHud() {
    const st = STAGES[G.stage] || STAGES[0];
    const left = G.mode === "play" ? pairsLeft() : st.pairs.length;
    const t = G.mode === "play" ? Math.max(0, G.time) : st.time;
    const text =
      st.name +
      "  " +
      (G.stage + 1) +
      "/" +
      STAGES.length +
      "  ·  " +
      left +
      " 丝  ·  " +
      t.toFixed(1);
    const warn = G.mode === "play" && G.time < 8;
    const key = text + (warn ? (G.time < 4 ? "m" : "g") : "n");
    if (key !== G.hudKey) {
      G.hudKey = key;
      stageLabel.textContent = text;
      stageLabel.style.color = warn ? (G.time < 4 ? "#ff3db8" : "#ffe36b") : "";
    }
    const lives = G.mode === "play" ? G.lives : LIVES;
    if (lives !== G.hudLives) {
      G.hudLives = lives;
      pipsEl.innerHTML = "";
      for (let i = 0; i < LIVES; i++) {
        const p = document.createElement("span");
        p.className = "pip";
        if (i < lives) {
          p.classList.add("on");
          if (lives === 1) p.classList.add("warn");
        } else {
          p.classList.add("off");
        }
        pipsEl.appendChild(p);
      }
    }
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "WEAVE";
      ovTitle.textContent = "织网";
      ovLead.textContent =
        STAGES.length +
        " 关经纬。同色点连成丝。丝线不可相交。走入光点牵丝，送到它的孪生。";
      ovOps.textContent = "WASD / 方向键移动梭子 · 点光点拖到同色 · 空格放下 · Z 撤销 · M 静音";
      ovBtn.textContent = "开始织网";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "WOVEN";
      ovTitle.textContent = "网成";
      ovLead.textContent = STAGES.length + " 张经纬都织上了。梭停，丝亮。";
      ovOps.textContent =
        "用时 " +
        G.totalTime.toFixed(1) +
        " 秒 · 断丝 " +
        G.totalSnags +
        " 次";
      ovBtn.textContent = "再来一局";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = G.fail === "time" ? "TIME" : "TORN";
      ovTitle.textContent = G.fail === "time" ? "时辰尽了" : "丝尽";
      ovLead.textContent =
        G.fail === "time" ? "梭停丝冷。网还没织完。" : "钩到旁点，断了三次。";
      ovOps.textContent = STAGES[G.stage].name + " · 还可重织本关";
      ovBtn.textContent = "重试本关";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    ovBtn.blur();
  }

  function startRun() {
    audio.ensure();
    audio.pulse("start");
    G.mode = "play";
    G.stage = 0;
    G.totalTime = 0;
    G.totalSnags = 0;
    G.lock = 0.28;
    hideOverlay();
    loadStage(0);
  }

  function retryStage() {
    audio.ensure();
    audio.pulse("start");
    G.mode = "play";
    G.lock = 0.22;
    hideOverlay();
    loadStage(G.stage);
  }

  function endLose(why) {
    if (G.mode !== "play") return;
    G.mode = "lose";
    G.fail = why;
    G.draw = null;
    G.pointer = null;
    audio.pulse("lose");
    G.flash = 0.85;
    G.shake = 10;
    showOverlay("lose");
    syncHud();
  }

  function endWin() {
    G.mode = "win";
    G.draw = null;
    audio.pulse("win");
    G.flashC = 1;
    for (let i = 0; i < G.nodes.length; i++) {
      const n = G.nodes[i];
      emit(8, {
        x: n.x,
        y: n.y,
        j: 0.02,
        vx0: -0.22,
        vx1: 0.22,
        vy0: -0.3,
        vy1: 0.1,
        life: 0.9,
        r0: 1.5,
        r1: 3.6,
        c: COLORS[n.c]
      });
    }
    showOverlay("win");
    hintEl.textContent = "网成 · 再来一局";
    syncHud();
  }

  function stageClear() {
    G.clearing = 1.05;
    G.draw = null;
    audio.pulse("stage");
    G.flashC = 0.7;
    for (let i = 0; i < G.threads.length; i++) {
      emitAlong(G.threads[i].pts, COLORS[G.threads[i].c], 6);
    }
    toast("成网 · " + STAGES[G.stage].name);
  }

  function startDraw(node, asStroke) {
    if (!node || node.done || G.draw || G.clearing > 0) return;
    const tw = twinOf(node);
    if (!tw) return;
    G.wx = node.x;
    G.wy = node.y;
    G.draw = {
      c: node.c,
      pts: [{ x: node.x, y: node.y }],
      startId: node.id,
      targetId: tw.id,
      leftStart: false
    };
    if (G.pointer) G.pointer.stroke = !!asStroke;
    audio.pulse("pick", node.c);
    emit(8, {
      x: node.x,
      y: node.y,
      j: 0.012,
      vx0: -0.08,
      vx1: 0.08,
      vy0: -0.1,
      vy1: 0.06,
      life: 0.4,
      r0: 1.2,
      r1: 2.6,
      c: COLORS[node.c]
    });
  }

  function cancelDraw(penalize) {
    if (!G.draw) return;
    const col = COLORS[G.draw.c];
    if (penalize) {
      emitAlong(G.draw.pts, col, 10);
      G.lives--;
      G.totalSnags++;
      G.shake = 8;
      G.flash = 0.7;
      G.lock = 0.22;
      audio.pulse("snap");
      toast("钩到旁点 · 断丝", true);
      if (G.lives <= 0) G.dying = 0.35;
    } else {
      audio.pulse("cancel");
    }
    G.draw = null;
    if (G.pointer) G.pointer.stroke = false;
    syncHud();
  }

  function completeDraw() {
    if (!G.draw) return;
    const tgt = nodeById(G.draw.targetId);
    const src = nodeById(G.draw.startId);
    if (!tgt || !src) return;
    const pts = G.draw.pts.concat([{ x: tgt.x, y: tgt.y }]);
    G.threads.push({ c: G.draw.c, pts: pts });
    src.done = true;
    tgt.done = true;
    const col = COLORS[G.draw.c];
    emitAlong(pts, col, 12);
    audio.pulse("lock", G.draw.c);
    G.flashC = 0.45;
    G.draw = null;
    if (G.pointer) G.pointer.stroke = false;
    toast("成丝 · " + col.name);
    syncHud();
    if (pairsLeft() === 0) stageClear();
  }

  function undo() {
    if (G.mode !== "play" || G.clearing > 0) return;
    if (G.draw) {
      cancelDraw(false);
      return;
    }
    const last = G.threads.pop();
    if (!last) return;
    for (let i = 0; i < G.nodes.length; i++) {
      if (G.nodes[i].c === last.c) G.nodes[i].done = false;
    }
    audio.pulse("undo");
    toast("撤丝");
    syncHud();
  }

  function thickHit(ax, ay, bx, by, cx, cy, dx, dy, w) {
    if (segCross(ax, ay, bx, by, cx, cy, dx, dy)) return true;
    if (pointSeg(ax, ay, cx, cy, dx, dy) < w) return true;
    if (pointSeg(bx, by, cx, cy, dx, dy) < w) return true;
    if (pointSeg(cx, cy, ax, ay, bx, by) < w) return true;
    if (pointSeg(dx, dy, ax, ay, bx, by) < w) return true;
    return false;
  }

  function hitsPolyline(ax, ay, bx, by, pts, skipTail, w) {
    const last = pts.length - 1 - skipTail;
    for (let i = 0; i < last; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      if (thickHit(ax, ay, bx, by, p.x, p.y, q.x, q.y, w)) return true;
    }
    return false;
  }

  function sweepBlocked(ax, ay, bx, by) {
    const w = board.hit;
    for (let i = 0; i < G.threads.length; i++) {
      if (hitsPolyline(ax, ay, bx, by, G.threads[i].pts, 0, w)) return true;
    }
    if (G.draw && G.draw.pts.length > 2) {
      if (hitsPolyline(ax, ay, bx, by, G.draw.pts, TAIL, w * 0.92)) return true;
    }
    for (let i = 0; i < G.nodes.length; i++) {
      const n = G.nodes[i];
      if (!n.done) continue;
      if (G.draw && (n.id === G.draw.startId || n.id === G.draw.targetId)) continue;
      if (pointSeg(n.x, n.y, ax, ay, bx, by) < board.nr * 0.82 + board.wr) return true;
    }
    return false;
  }

  function growTrail() {
    const d = G.draw;
    if (!d) return;
    const pts = d.pts;
    const last = pts[pts.length - 1];
    const dd = dist(G.wx, G.wy, last.x, last.y);
    if (pts.length >= 2) {
      const prev = pts[pts.length - 2];
      const back = dist(G.wx, G.wy, prev.x, prev.y);
      const span = dist(last.x, last.y, prev.x, prev.y);
      if (back < span * 0.65 && back < 0.028) {
        pts.pop();
        return;
      }
    }
    if (dd > SAMPLE) {
      pts.push({ x: G.wx, y: G.wy });
      if (pts.length > 340) pts.splice(1, 48);
    }
  }

  function tryMove(nx, ny) {
    nx = clamp(nx, PAD, 1 - PAD);
    ny = clamp(ny, PAD, 1 - PAD);
    const ox = G.wx;
    const oy = G.wy;
    if (ox === nx && oy === ny) return true;
    if (G.draw) {
      if (sweepBlocked(ox, oy, nx, ny)) {
        if (G.bumpT <= 0) {
          audio.pulse("bump");
          G.bumpT = 0.12;
        }
        return false;
      }
      const start = nodeById(G.draw.startId);
      const tgt = nodeById(G.draw.targetId);
      if (tgt && dist(nx, ny, tgt.x, tgt.y) < board.nr * 1.12) {
        G.wx = nx;
        G.wy = ny;
        growTrail();
        completeDraw();
        return true;
      }
      if (start) {
        const ds = dist(nx, ny, start.x, start.y);
        if (!G.draw.leftStart) {
          if (ds > board.nr * 1.4) G.draw.leftStart = true;
        } else if (ds < board.nr * 0.95) {
          G.wx = nx;
          G.wy = ny;
          cancelDraw(false);
          return true;
        }
      }
      for (let i = 0; i < G.nodes.length; i++) {
        const n = G.nodes[i];
        if (n.done) continue;
        if (n.id === G.draw.startId || n.id === G.draw.targetId) continue;
        if (dist(nx, ny, n.x, n.y) < board.nr * 0.78) {
          G.wx = nx;
          G.wy = ny;
          cancelDraw(true);
          return false;
        }
      }
    }
    G.wx = nx;
    G.wy = ny;
    if (G.draw) growTrail();
    return true;
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.18 * dt;
    }
  }

  function overlayOpen() {
    return !overlay.classList.contains("hidden");
  }

  function handleOverlayAction() {
    if (G.mode === "title" || G.mode === "win") startRun();
    else if (G.mode === "lose") retryStage();
  }

  function update(dt) {
    G.clock += dt;
    G.shake *= Math.exp(-dt * 7.5);
    G.flash *= Math.exp(-dt * 4.8);
    G.flashC *= Math.exp(-dt * 4.2);
    if (G.bumpT > 0) G.bumpT -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    updateParticles(dt);

    if (G.mode !== "play") return;

    if (G.dying > 0) {
      G.dying -= dt;
      if (G.dying <= 0) endLose("snag");
      return;
    }

    if (G.clearing > 0) {
      G.clearing -= dt;
      if (G.clearing <= 0) {
        if (G.stage + 1 >= STAGES.length) endWin();
        else {
          loadStage(G.stage + 1);
          G.lock = 0.18;
        }
      }
      return;
    }

    G.time -= dt;
    G.totalTime += dt;
    if (G.time <= 0) {
      G.time = 0;
      endLose("time");
      return;
    }
    if (G.time < 8) {
      const sec = Math.ceil(G.time);
      if (sec < G.lastTick) {
        G.lastTick = sec;
        audio.pulse("tick");
      }
    }

    if (G.lock > 0) {
      syncHud();
      return;
    }

    const speed = G.draw ? 0.5 : 0.64;
    let nx = G.wx;
    let ny = G.wy;
    if (G.pointer) {
      const dx = G.pointer.x - G.wx;
      const dy = G.pointer.y - G.wy;
      const d = Math.hypot(dx, dy);
      if (d > 0.0008) {
        const boost = d > 0.12 ? 1.28 : 1;
        const m = Math.min(d, speed * boost * dt);
        nx = G.wx + (dx / d) * m;
        ny = G.wy + (dy / d) * m;
      }
    } else {
      let kx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      let ky = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
      if (kx && ky) {
        kx *= 0.7071;
        ky *= 0.7071;
      }
      nx = G.wx + kx * speed * dt;
      ny = G.wy + ky * speed * dt;
    }

    if (nx !== G.wx || ny !== G.wy) {
      const dx = nx - G.wx;
      const dy = ny - G.wy;
      const len = Math.hypot(dx, dy);
      const maxStep = 0.01;
      const steps = Math.max(1, Math.ceil(len / maxStep));
      for (let s = 0; s < steps; s++) {
        const ox = G.wx;
        const oy = G.wy;
        if (!tryMove(ox + dx / steps, oy + dy / steps)) {
          if (!tryMove(ox + dx / steps, oy)) tryMove(ox, oy + dy / steps);
          break;
        }
      }
    }

    if (!G.draw && !G.pointer) {
      const n = hitNode(G.wx, G.wy, 0.92);
      if (n) startDraw(n, false);
    }

    trail.push({ x: G.wx, y: G.wy });
    if (trail.length > 10) trail.shift();
    syncHud();
  }

  function drawFrame() {
    const t = G.clock;
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, W, H);

    const sx = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    const sy = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    const g = ctx.createRadialGradient(
      board.x + board.s * 0.5,
      board.y + board.s * 0.42,
      board.s * 0.1,
      board.x + board.s * 0.5,
      board.y + board.s * 0.5,
      board.s * 0.78
    );
    g.addColorStop(0, "rgba(255, 61, 184, 0.05)");
    g.addColorStop(0.45, "rgba(0, 240, 255, 0.03)");
    g.addColorStop(1, "rgba(3, 1, 10, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = (m.x + Math.sin(t * m.s + m.p) * 0.02) * W;
      const my = ((m.y + t * 0.012 * m.s) % 1) * H;
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? "rgba(0,240,255," + m.a + ")" : "rgba(255,61,184," + m.a + ")";
      ctx.fill();
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(board.x, board.y, board.s, board.s);
    ctx.clip();

    for (let i = 1; i <= 9; i++) {
      const u = i / 10;
      const wave = Math.sin(t * 0.7 + i * 0.6) * 3.5;
      ctx.beginPath();
      ctx.moveTo(board.x + u * board.s + wave, board.y);
      ctx.lineTo(board.x + u * board.s - wave, board.y + board.s);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.045)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(board.x, board.y + u * board.s + wave);
      ctx.lineTo(board.x + board.s, board.y + u * board.s - wave);
      ctx.strokeStyle = "rgba(255, 61, 184, 0.04)";
      ctx.stroke();
    }

    if (G.mode === "title") drawTitleNet(t);

    for (let i = 0; i < G.threads.length; i++) {
      drawThread(G.threads[i].pts, COLORS[G.threads[i].c], board.threadPx, t, true);
    }

    if (G.draw) {
      const live = G.draw.pts.concat([{ x: G.wx, y: G.wy }]);
      drawThread(live, COLORS[G.draw.c], board.threadPx * 1.05, t, false);
    }

    for (let i = 0; i < G.nodes.length; i++) drawNode(G.nodes[i], t);

    if (G.mode === "play" || G.mode === "lose" || G.mode === "win") drawShuttle(t);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / p.max;
      const q = sc(p.x, p.y);
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.r * (0.5 + a), 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.c, 0.15 + a * 0.8);
      ctx.fill();
    }

    ctx.restore();

    drawFrameOrnament(t);

    if (G.flash > 0.02) {
      ctx.fillStyle = "rgba(255, 61, 184, " + G.flash * 0.28 + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (G.flashC > 0.02) {
      ctx.fillStyle = "rgba(0, 240, 255, " + G.flashC * 0.18 + ")";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  function drawTitleNet(t) {
    const pairs = [
      { c: 0, a: [0.18, 0.22], b: [0.82, 0.22] },
      { c: 1, a: [0.18, 0.78], b: [0.82, 0.78] },
      { c: 2, a: [0.22, 0.18], b: [0.22, 0.82] },
      { c: 3, a: [0.78, 0.18], b: [0.78, 0.82] }
    ];
    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      const col = COLORS[p.c];
      const u = (Math.sin(t * 0.6 + i) + 1) * 0.5;
      const pts = [
        { x: p.a[0], y: p.a[1] },
        { x: p.a[0] + (p.b[0] - p.a[0]) * u, y: p.a[1] + (p.b[1] - p.a[1]) * u }
      ];
      drawThread(pts, col, board.threadPx * 0.9, t, false);
      const A = sc(p.a[0], p.a[1]);
      const B = sc(p.b[0], p.b[1]);
      glowDot(A.x, A.y, col, 1);
      glowDot(B.x, B.y, col, 0.7 + u * 0.3);
    }
  }

  function glowDot(x, y, col, a) {
    ctx.beginPath();
    ctx.arc(x, y, board.nodePx * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = rgba(col, 0.18 * a);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, board.nodePx * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = rgba(col, 0.9 * a);
    ctx.fill();
  }

  function drawThread(pts, col, width, t, locked) {
    if (pts.length < 2) return;
    ctx.beginPath();
    const p0 = sc(pts[0].x, pts[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < pts.length; i++) {
      const p = sc(pts[i].x, pts[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = rgba(col, 0.13);
    ctx.lineWidth = width * 3.1;
    ctx.stroke();
    ctx.strokeStyle = rgba(col, 0.42);
    ctx.lineWidth = width * 1.45;
    ctx.stroke();
    ctx.strokeStyle = col.hex;
    ctx.lineWidth = width * 0.52;
    ctx.stroke();
    if (locked) {
      ctx.save();
      ctx.setLineDash([6, 18]);
      ctx.lineDashOffset = -t * 38;
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = width * 0.28;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawNode(n, t) {
    const p = sc(n.x, n.y);
    const col = COLORS[n.c];
    const carrying = G.draw && G.draw.c === n.c;
    const pulse = 1 + Math.sin(t * 3.1 + n.id * 1.3) * (n.done ? 0.02 : carrying ? 0.1 : 0.055);
    const R = board.nodePx * pulse;
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * 1.85, 0, Math.PI * 2);
    ctx.fillStyle = rgba(col, n.done ? 0.06 : carrying ? 0.2 : 0.12);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(col, n.done ? 0.4 : 0.95);
    ctx.lineWidth = n.done ? 1.5 : 2.2;
    if (!n.done) {
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -t * 18;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * (n.done ? 0.32 : 0.42), 0, Math.PI * 2);
    ctx.fillStyle = n.done ? rgba(col, 0.35) : col.hex;
    ctx.fill();
    if (n.done) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, R * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(col, 0.5);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }

  function drawShuttle(t) {
    const col = G.draw ? COLORS[G.draw.c] : { r: 0, g: 240, b: 255, hex: "#00f0ff" };
    for (let i = 0; i < trail.length; i++) {
      const p = sc(trail[i].x, trail[i].y);
      const a = (i + 1) / trail.length;
      ctx.beginPath();
      ctx.arc(p.x, p.y, board.weaverPx * 0.35 * a, 0, Math.PI * 2);
      ctx.fillStyle = rgba(col, 0.12 * a);
      ctx.fill();
    }
    const p = sc(G.wx, G.wy);
    const R = board.weaverPx;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(t * 2.4) * 0.12);
    ctx.beginPath();
    ctx.moveTo(0, -R * 1.7);
    ctx.lineTo(R * 1.05, 0);
    ctx.lineTo(0, R * 1.7);
    ctx.lineTo(-R * 1.05, 0);
    ctx.closePath();
    ctx.fillStyle = rgba(col, 0.92);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }

  function drawFrameOrnament(t) {
    const x = board.x;
    const y = board.y;
    const s = board.s;
    const L = Math.max(14, s * 0.045);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.45)";
    ctx.lineWidth = 1.4;
    corners(x, y, L, 1, 1);
    ctx.strokeStyle = "rgba(255, 61, 184, 0.5)";
    corners(x + s, y, L, -1, 1);
    ctx.strokeStyle = "rgba(255, 61, 184, 0.5)";
    corners(x, y + s, L, 1, -1);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.45)";
    corners(x + s, y + s, L, -1, -1);
    ctx.strokeStyle = "rgba(255,255,255," + (0.06 + Math.sin(t * 1.4) * 0.03) + ")";
    ctx.strokeRect(x - 4, y - 4, s + 8, s + 8);

    function corners(cx, cy, len, sx, sy) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + sy * len);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + sx * len, cy);
      ctx.stroke();
    }
  }

  function eventToBoard(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - board.x) / board.s,
      y: (e.clientY - r.top - board.y) / board.s
    };
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (overlayOpen()) return;
    if (G.mode !== "play" || G.lock > 0 || G.clearing > 0 || G.dying > 0) return;
    e.preventDefault();
    const pos = eventToBoard(e);
    G.pointer = { x: pos.x, y: pos.y, id: e.pointerId, stroke: false };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
    if (!G.draw) {
      const n = hitNode(pos.x, pos.y, 1.65);
      if (n) startDraw(n, true);
    }
    audio.ensure();
  }

  function onPointerMove(e) {
    if (!G.pointer || G.pointer.id !== e.pointerId) return;
    const pos = eventToBoard(e);
    G.pointer.x = pos.x;
    G.pointer.y = pos.y;
  }

  function onPointerUp(e) {
    if (!G.pointer || G.pointer.id !== e.pointerId) return;
    if (G.draw && G.pointer.stroke) {
      const tgt = nodeById(G.draw.targetId);
      if (tgt && dist(G.wx, G.wy, tgt.x, tgt.y) < board.nr * 1.5) completeDraw();
      else cancelDraw(false);
    }
    G.pointer = null;
  }

  function keyDir(code, down) {
    if (code === "ArrowUp" || code === "KeyW") keys.u = down;
    else if (code === "ArrowDown" || code === "KeyS") keys.d = down;
    else if (code === "ArrowLeft" || code === "KeyA") keys.l = down;
    else if (code === "ArrowRight" || code === "KeyD") keys.r = down;
    else return false;
    return true;
  }

  function onKeyDown(e) {
    if (e.repeat && (e.code === "Space" || e.code === "Enter" || e.code === "KeyM" || e.code === "KeyZ" || e.code === "KeyR")) return;
    if (keyDir(e.code, true)) {
      e.preventDefault();
      return;
    }
    if (e.code === "KeyM") {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      audio.ensure();
      return;
    }
    if (overlayOpen()) {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleOverlayAction();
      }
      if (e.code === "KeyR" && G.mode === "lose") {
        e.preventDefault();
        retryStage();
      }
      return;
    }
    if (G.mode !== "play") return;
    if (e.code === "Space") {
      e.preventDefault();
      if (G.lock > 0 || G.clearing > 0) return;
      if (G.draw) cancelDraw(false);
      else {
        const n = hitNode(G.wx, G.wy, 1.25);
        if (n) startDraw(n, false);
      }
    } else if (e.code === "KeyZ" || e.code === "Backspace") {
      e.preventDefault();
      undo();
    } else if (e.code === "KeyR") {
      e.preventDefault();
      retryStage();
    } else if (e.code === "Escape") {
      e.preventDefault();
      if (G.draw) cancelDraw(false);
    }
  }

  function onKeyUp(e) {
    keyDir(e.code, false);
  }

  ovBtn.addEventListener("click", function () {
    handleOverlayAction();
    ovBtn.blur();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    if (G.mode === "title") startRun();
    else if (G.mode === "win") startRun();
    else retryStage();
    btnRetry.blur();
  });
  btnUndo.addEventListener("click", function () {
    undo();
    btnUndo.blur();
  });
  btnMute.addEventListener("click", function () {
    audio.setMuted(!audio.muted);
    audio.ensure();
    btnMute.blur();
  });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", function () {
    keys.u = keys.d = keys.l = keys.r = false;
    G.pointer = null;
  });
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) {
    /* ignore */
  }

  makeMotes();
  resize();
  showOverlay("title");
  syncHud();

  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    drawFrame();
  }
  requestAnimationFrame(frame);
})();
