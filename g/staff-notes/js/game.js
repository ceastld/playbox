(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const HIT = 0.46;
  const PERFECT = 0.2;
  const CATCH_SPEED = 18.5;
  const MUTE_KEY = "staff-notes-mute";
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";

  const PITCH = [
    { name: "E", hz: 329.63, line: true },
    { name: "F", hz: 349.23, line: false },
    { name: "G", hz: 392.0, line: true },
    { name: "A", hz: 440.0, line: false },
    { name: "B", hz: 493.88, line: true },
    { name: "C", hz: 523.25, line: false },
    { name: "D", hz: 587.33, line: true },
    { name: "E", hz: 659.25, line: false },
    { name: "F", hz: 698.46, line: true }
  ];

  function seq(list, beat, start) {
    const out = [];
    let t = start;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const p = typeof item === "number" ? item : item.p;
      const d = typeof item === "number" ? 1 : item.d;
      out.push({ p: p, t: t, eighth: d < 0.86 });
      t += d * beat;
    }
    return out;
  }

  const MOVES = [
    {
      name: "慢板",
      sub: "ADAGIO",
      hint: "音落到线上 · 把拾音对准高低",
      toast: "慢板 · 对准高低",
      travel: 2.28,
      ghost: 1,
      drop: 0.42,
      notes: seq([2, 4, 5, 4, 2, 0, 2, 4], 0.7, 0.85)
    },
    {
      name: "行板",
      sub: "ANDANTE",
      hint: "高低跳得更大 · 提前对准",
      toast: "行板 · 跳线要快",
      travel: 1.68,
      ghost: 0.45,
      drop: 0.32,
      notes: seq([4, 5, 6, 7, 6, 5, 4, 2, 3, 4, 5, 4], 0.48, 0.62)
    },
    {
      name: "急板",
      sub: "PRESTO",
      hint: "急板 · 密音大跳",
      toast: "急板到了 · 盯着下一音",
      travel: 1.18,
      ghost: 0,
      drop: 0.22,
      notes: seq(
        [
          { p: 8, d: 0.95 },
          { p: 6, d: 0.95 },
          { p: 4, d: 1.2 },
          { p: 7, d: 0.85 },
          { p: 5, d: 0.85 },
          { p: 3, d: 1.2 },
          { p: 6, d: 0.9 },
          { p: 2, d: 1.25 },
          { p: 8, d: 1.15 },
          { p: 4, d: 1.2 },
          { p: 0, d: 1.05 },
          { p: 3, d: 1.15 },
          { p: 7, d: 0.9 },
          { p: 5, d: 0.9 },
          { p: 2, d: 1.15 },
          { p: 6, d: 0.9 },
          { p: 4, d: 1.15 },
          { p: 8, d: 1.2 }
        ],
        0.38,
        0.5
      )
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
  const stageLabel = document.getElementById("stage-label");
  const hitLabel = document.getElementById("hit-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;

  const L = {
    x0: 0,
    x1: 1,
    y0: 0,
    y1: 1,
    catchX: 0,
    gap: 20,
    boardX: 0,
    boardY: 0,
    boardW: 1,
    boardH: 1,
    hitW: 36,
    clefX: 0
  };

  function yAt(p) {
    return L.y1 - p * L.gap;
  }
  function pAt(y) {
    return (L.y1 - y) / L.gap;
  }

  const G = {
    mode: "title",
    wave: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    catcher: 4,
    snap: null,
    hits: 0,
    need: 8,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    total: 0,
    lock: 0,
    hold: 0,
    shake: 0,
    flash: 0,
    flashCol: PINK,
    toastT: 0,
    judge: "",
    judgeCol: CYAN,
    judgeT: 0,
    endT: 0,
    taught: false,
    paused: false,
    pulse: 0
  };

  const keys = { up: false, down: false };
  const pointer = { active: false, id: null, pitch: 4, hover: false };

  const notes = [];
  const motes = [];
  const particles = [];
  const sparks = [];
  const ripples = [];
  const floats = [];
  const stamps = [];
  const trails = [];
  const picked = [];

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
  function hexRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function rgba(h, a) {
    const c = hexRgb(h);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }
  function pitchCol(p) {
    const t = clamp(p / 8, 0, 1);
    const a = hexRgb(PINK);
    const b = hexRgb(CYAN);
    return {
      r: (a[0] + (b[0] - a[0]) * t) | 0,
      g: (a[1] + (b[1] - a[1]) * t) | 0,
      b: (a[2] + (b[2] - a[2]) * t) | 0
    };
  }
  function cssRgb(c, a) {
    if (a == null) return "rgb(" + c.r + "," + c.g + "," + c.b + ")";
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function move() {
    return MOVES[G.wave] || MOVES[0];
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
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) {}
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      btnMute.textContent = m ? "静" : "声";
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      btnMute.classList.toggle("muted", m);
    },
    tone: function (freq, dur, type, vol, when, slide) {
      if (!this.ctx || this.muted) return;
      const t = when != null ? when : this.ctx.currentTime;
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
    catch: function (p, perfect) {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const hz = PITCH[p].hz;
      const t = this.ctx.currentTime;
      this.tone(hz, 0.52, "sine", perfect ? 0.18 : 0.14, t);
      this.tone(hz * 2, 0.22, "triangle", perfect ? 0.07 : 0.04, t);
      if (perfect) this.tone(hz * 3, 0.12, "sine", 0.03, t + 0.02);
    },
    miss: function () {
      this.ensure();
      this.tone(164, 0.28, "square", 0.07, null, 70);
      this.tone(88, 0.4, "sawtooth", 0.05, null, 42);
    },
    drop: function (p) {
      this.ensure();
      this.tone(PITCH[p].hz * 0.5, 0.08, "sine", 0.03);
    },
    wave: function () {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.tone(392, 0.14, "sine", 0.08, t);
      this.tone(523, 0.18, "triangle", 0.07, t + 0.1);
      this.tone(784, 0.32, "sine", 0.08, t + 0.2);
    },
    win: function () {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const scale = [392, 494, 523, 587, 784];
      for (let i = 0; i < scale.length; i++) {
        this.tone(scale[i], 0.28, i % 2 ? "triangle" : "sine", 0.09, t + i * 0.11);
      }
    },
    lose: function () {
      this.ensure();
      this.tone(196, 0.5, "sawtooth", 0.09, null, 70);
      this.tone(110, 0.7, "square", 0.05, null, 48);
    },
    start: function () {
      this.ensure();
      this.tone(196, 0.16, "sine", 0.07, null, 392);
      this.tone(330, 0.22, "triangle", 0.05, null, 659);
    },
    tickDrone: function () {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 98;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const play = G.mode === "play" || G.mode === "clear";
      this.drone.frequency.setTargetAtTime(play ? 110 : 92, t, 0.25);
      this.droneGain.gain.setTargetAtTime(play ? 0.018 : 0.008, t, 0.25);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) {}

  function makeMotes() {
    motes.length = 0;
    const n = 56;
    for (let i = 0; i < n; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.6 + 0.25,
        a: Math.random() * 0.38 + 0.05,
        p: Math.random() * TAU,
        s: 0.08 + Math.random() * 0.28,
        note: i % 5 === 0
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 110) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        rad: rand(spec.r0, spec.r1),
        r: spec.col.r,
        g: spec.col.g,
        b: spec.col.b
      });
    }
  }

  function spark(x, y, n, col) {
    const rgb = typeof col === "string" ? hexRgb(col) : [col.r, col.g, col.b];
    for (let i = 0; i < n; i++) {
      if (sparks.length > 80) sparks.shift();
      const a = rand(0, TAU);
      const sp = rand(50, 240);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.16, 0.5),
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 12) ripples.shift();
    ripples.push({ x: x, y: y, t: 1, col: col, max: max || L.gap * 3 });
  }

  function floatAt(x, y, text, col) {
    if (floats.length > 10) floats.shift();
    floats.push({ x: x, y: y, text: text, col: col, t: 1 });
  }

  function stampAt(x, y, p) {
    if (stamps.length > 24) stamps.shift();
    stamps.push({ x: x, y: y, p: p, t: 1 });
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.05;
  }

  function judge(text, col) {
    G.judge = text;
    G.judgeCol = col;
    G.judgeT = 0.62;
  }

  function spawnWaveNotes(spec, demo) {
    notes.length = 0;
    const src = spec.notes;
    for (let i = 0; i < src.length; i++) {
      notes.push({
        p: src[i].p,
        t: src[i].t,
        eighth: src[i].eighth,
        state: "wait",
        drop: 1,
        bounce: 0,
        fade: 0,
        x: 0,
        y: 0,
        trailCd: 0,
        demo: !!demo
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

    const padX = Math.max(12, W * 0.035);
    const padY = Math.max(14, Math.min(H * 0.07, 40));
    L.boardX = padX;
    L.boardY = padY;
    L.boardW = W - padX * 2;
    L.boardH = H - padY * 2;
    L.gap = clamp(Math.min(L.boardH / 10.4, L.boardW / 9.2), 14, 52);
    const staffH = L.gap * 8;
    L.y0 = L.boardY + (L.boardH - staffH) * 0.36;
    L.y1 = L.y0 + staffH;
    const leftPad = clamp(Math.min(L.gap * 2.35, L.boardW * 0.17), 32, 108);
    L.x0 = L.boardX + leftPad;
    L.x1 = L.boardX + L.boardW - Math.max(8, L.gap * 0.45);
    L.catchX = L.x0 + clamp(Math.min(L.gap * 3.45, L.boardW * 0.24), 48, 136);
    L.clefX = L.x0 + L.gap * 0.08;
    L.hitW = clamp(L.gap * 1.25, 22, 44);
  }

  function syncHud() {
    if (G.mode === "title") {
      stageLabel.textContent = "五线拾音";
      hitLabel.textContent = "拾 —";
      hitLabel.classList.remove("warn", "hot");
      hintEl.textContent = coarse
        ? "按住画布上下滑 · 对准谱面高低"
        : "W/S 或拖动 · 对准谱面高低接住落下的音";
    } else {
      const mv = move();
      stageLabel.textContent = mv.name + " · " + mv.sub;
      const combo = G.combo >= 2 ? "  · " + G.combo + "连" : "";
      hitLabel.textContent = "拾 " + G.hits + "/" + G.need + combo;
      hitLabel.classList.toggle("warn", G.lives <= 1 && G.mode === "play");
      hitLabel.classList.toggle("hot", G.combo >= 4);
      hintEl.textContent = mv.hint;
    }
    pipsEl.innerHTML = "";
    const show = G.mode === "title" ? 0 : LIVES;
    for (let i = 0; i < show; i++) {
      const pip = document.createElement("span");
      pip.className = "pip";
      if (i < G.lives) {
        pip.classList.add("on");
        if (G.lives <= 1 && G.mode === "play") pip.classList.add("warn");
      }
      pipsEl.appendChild(pip);
    }
  }

  function showPanel(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "STAFF";
      ovTitle.textContent = "拾谱";
      ovLead.innerHTML = "音从右侧落到五线上。<br />把拾音对准高低，接住它们。";
      ovOps.textContent = coarse
        ? "按住画布上下滑对准音高 · M 静音"
        : "W/S 或 ↑↓ 高低 · 拖动画布 · 1–9 跳线 · M 静音";
      ovBtn.textContent = "拾谱";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "谱已齐";
      ovLead.textContent = "三乐章都拾起了。五线还亮着。";
      ovOps.textContent =
        "拾 " + G.total + " · 完美 " + G.perfects + " · 最高连击 " + G.maxCombo;
      ovBtn.textContent = "再拾一谱";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "音落空";
      ovLead.textContent = "谱散了。高低没对准，音就掉下去。";
      ovOps.textContent = "已拾 " + G.total + " · 第 " + (G.wave + 1) + " 乐章";
      ovBtn.textContent = "再拾一谱";
    }
  }

  function hidePanel() {
    overlay.classList.add("hidden");
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    ripples.length = 0;
    floats.length = 0;
    stamps.length = 0;
    trails.length = 0;
    picked.length = 0;
  }

  function seedDemo() {
    spawnWaveNotes(MOVES[0], true);
    G.catcher = 4;
    G.t = 0;
  }

  function beginWave(i) {
    G.wave = i;
    G.t = 0;
    G.hits = 0;
    G.need = MOVES[i].notes.length;
    G.hold = 0.28;
    G.lock = 0.12;
    spawnWaveNotes(MOVES[i], false);
    toast(MOVES[i].toast, i >= 2);
    syncHud();
  }

  function resetRun() {
    G.wave = 0;
    G.t = 0;
    G.lives = LIVES;
    G.catcher = 4;
    G.snap = null;
    G.hits = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.perfects = 0;
    G.total = 0;
    G.lock = 0;
    G.hold = 0;
    G.shake = 0;
    G.flash = 0;
    G.judgeT = 0;
    G.endT = 0;
    G.taught = false;
    G.paused = false;
    clearFx();
    beginWave(0);
  }

  function startPlay() {
    audio.start();
    hidePanel();
    G.mode = "play";
    resetRun();
  }

  function startClear() {
    G.mode = "clear";
    G.endT = 0.95;
    audio.wave();
    G.flash = 0.4;
    G.flashCol = CYAN;
    toast(move().name + " 拾齐", false);
    ripple(L.catchX, yAt(G.catcher), CYAN, L.gap * 6);
  }

  function startWin() {
    G.mode = "win";
    audio.win();
    seedDemo();
    showPanel("win");
    syncHud();
  }

  function startLose() {
    G.mode = "tolose";
    G.endT = 0.7;
    audio.lose();
    G.flash = 0.55;
    G.flashCol = PINK;
    G.shake = 11;
  }

  function nearestIncoming() {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== "fly" && n.state !== "wait") continue;
      const x = noteX(n);
      if (x < L.catchX - L.hitW) continue;
      const d = x - L.catchX;
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function noteX(n) {
    const mv = move();
    const travel = n.demo ? MOVES[0].travel : mv.travel;
    const age = G.t - n.t;
    const span = L.x1 + L.gap * 0.6 - L.catchX;
    return L.catchX + span - (age / travel) * (L.x1 + L.gap * 0.6 - L.x0);
  }

  function catchNote(n, perfect) {
    n.state = "caught";
    n.fade = 1;
    const y = yAt(n.p);
    const rgb = perfect ? { r: 255, g: 227, b: 107 } : pitchCol(n.p);
    G.hits += 1;
    G.total += 1;
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if (perfect) G.perfects += 1;
    G.flash = perfect ? 0.28 : 0.16;
    G.flashCol = perfect ? GOLD : CYAN;
    audio.catch(n.p, perfect);
    emit(perfect ? 16 : 10, {
      x: L.catchX,
      y: y,
      j: 8,
      vx0: -40,
      vx1: 160,
      vy0: -140,
      vy1: 80,
      life: 0.5,
      r0: 1.1,
      r1: 3.2,
      col: rgb
    });
    spark(L.catchX, y, perfect ? 10 : 6, perfect ? GOLD : rgb);
    ripple(L.catchX, y, perfect ? GOLD : CYAN, L.gap * (perfect ? 4.2 : 3.1));
    stampAt(L.catchX, y, n.p);
    if (picked.length < 48) picked.push({ p: n.p, k: picked.length });
    const label = perfect ? "完美" : G.combo >= 3 ? G.combo + " 连" : "接住";
    floatAt(L.catchX, y - 16, label, perfect ? GOLD : CYAN);
    judge(label, perfect ? GOLD : CYAN);
    if (!G.taught) {
      G.taught = true;
      toast("接住了 · 盯着下一音的高低", false);
    }
    syncHud();
    if (G.mode === "play" && notesResolved()) startClear();
  }

  function missNote(n) {
    n.state = "miss";
    n.fade = 1;
    const y = yAt(n.p);
    G.combo = 0;
    G.lives -= 1;
    G.flash = 0.42;
    G.flashCol = PINK;
    G.shake = 8;
    audio.miss();
    emit(14, {
      x: L.catchX,
      y: y,
      j: 10,
      vx0: -80,
      vx1: 80,
      vy0: 40,
      vy1: 220,
      life: 0.55,
      r0: 1.2,
      r1: 3.4,
      col: { r: 255, g: 61, b: 184 }
    });
    spark(L.catchX, y, 8, PINK);
    const err = Math.abs(G.catcher - n.p);
    const text = err < 0.85 ? "擦过" : "落空";
    floatAt(L.catchX, y - 16, text, PINK);
    judge(text, PINK);
    toast(err < 0.85 ? "差一点 · 高低再贴紧" : "高低没对准", true);
    syncHud();
    if (G.lives <= 0) startLose();
    else if (notesResolved() && G.mode === "play") startClear();
  }

  function notesResolved() {
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].state === "wait" || notes[i].state === "fly") return false;
    }
    return true;
  }

  function updateCatcher(dt) {
    if (pointer.active) {
      G.catcher = lerp(G.catcher, pointer.pitch, 1 - Math.pow(0.00055, dt));
      G.snap = null;
    } else if (keys.up || keys.down) {
      const dir = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
      G.catcher += dir * CATCH_SPEED * dt;
      G.snap = null;
    } else if (G.snap != null) {
      G.catcher = lerp(G.catcher, G.snap, 1 - Math.pow(0.00012, dt));
      if (Math.abs(G.catcher - G.snap) < 0.03) G.snap = null;
    } else if (pointer.hover) {
      G.catcher = lerp(G.catcher, pointer.pitch, 1 - Math.pow(0.0012, dt));
    }
    G.catcher = clamp(G.catcher, 0, 8);
  }

  function updateDemo(dt) {
    G.t += dt;
    const spec = MOVES[0];
    const loop = spec.notes[spec.notes.length - 1].t + spec.travel + 0.9;
    if (G.t > loop) {
      G.t = 0;
      spawnWaveNotes(spec, true);
    }
    const incoming = nearestIncoming();
    if (incoming) {
      G.catcher = lerp(G.catcher, incoming.p, 1 - Math.pow(0.012, dt));
    }
    updateNotes(dt, true);
  }

  function updateNotes(dt, demo) {
    const spec = demo ? MOVES[0] : move();
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state === "gone") continue;
      if (n.state === "wait" && G.t >= n.t) {
        n.state = "fly";
        n.drop = 1;
      }
      if (n.state === "fly") {
        n.x = noteX(n);
        if (n.drop > 0) {
          n.drop = Math.max(0, n.drop - dt / spec.drop);
          if (n.drop === 0) {
            n.bounce = 1;
            if (!demo) audio.drop(n.p);
          }
        }
        if (n.bounce > 0) n.bounce = Math.max(0, n.bounce - dt * 3.4);
        const lift = smooth(n.drop) * L.gap * 3.4 - Math.sin(n.bounce * Math.PI) * L.gap * 0.22;
        n.y = yAt(n.p) - lift;
        n.trailCd -= dt;
        if (n.trailCd <= 0 && trails.length < 64) {
          n.trailCd = 0.045;
          trails.push({ x: n.x, y: n.y, p: n.p, t: 0.3 });
        }
        if (!demo && G.mode === "play") {
          const dx = n.x - L.catchX;
          if (dx <= L.hitW && dx >= -L.hitW) {
            const err = Math.abs(G.catcher - n.p);
            if (err <= HIT) {
              catchNote(n, err <= PERFECT);
              continue;
            }
          }
          if (n.x < L.catchX - L.hitW) {
            missNote(n);
            continue;
          }
        } else if (demo) {
          if (n.x < L.catchX - 8) {
            n.state = "caught";
            n.fade = 1;
            ripple(L.catchX, yAt(n.p), CYAN, L.gap * 2.4);
          }
        }
      }
      if (n.state === "caught" || n.state === "miss") {
        n.fade -= dt * (n.state === "caught" ? 1.6 : 1.35);
        n.y += (n.state === "miss" ? 90 : -20) * dt;
        n.x += (n.state === "miss" ? 30 : 18) * dt;
        if (n.fade <= 0) n.state = "gone";
      }
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.lock > 0) G.lock -= dt;
    if (G.hold > 0) G.hold -= dt;
    if (G.judgeT > 0) G.judgeT -= dt;
    G.pulse += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 70 * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const q = sparks[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 0.9;
      q.vy *= 0.9;
      if (q.life <= 0) sparks.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.35;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt * 0.85;
      f.y -= 28 * dt;
      if (f.t <= 0) floats.splice(i, 1);
    }
    for (let i = stamps.length - 1; i >= 0; i--) {
      stamps[i].t -= dt * 0.55;
      if (stamps[i].t <= 0) stamps.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
  }

  function updatePlay(dt) {
    updateCatcher(dt);
    if (G.mode === "play" && G.hold <= 0) G.t += dt;
    if (G.mode === "clear") G.t += dt * 0.35;
    updateNotes(dt, false);
    if (G.mode === "clear") {
      G.endT -= dt;
      if (G.endT <= 0) {
        if (G.wave + 1 >= MOVES.length) startWin();
        else {
          G.mode = "play";
          beginWave(G.wave + 1);
        }
      }
    }
    if (G.mode === "tolose") {
      G.endT -= dt;
      if (G.endT <= 0) {
        G.mode = "lose";
        seedDemo();
        showPanel("lose");
        syncHud();
      }
    }
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

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.55, "#090510");
    g.addColorStop(1, "#04020c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + Math.sin(G.clock * 0.7) * 0.5;
    const mag = ctx.createRadialGradient(W * 0.18, H * 0.2, 8, W * 0.18, H * 0.2, H * 0.6);
    mag.addColorStop(0, "rgba(255, 61, 184," + (0.07 + pulse * 0.04) + ")");
    mag.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, W, H);
    const cyn = ctx.createRadialGradient(W * 0.82, H * 0.78, 8, W * 0.82, H * 0.78, H * 0.55);
    cyn.addColorStop(0, "rgba(0, 240, 255, 0.08)");
    cyn.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = cyn;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x * W + Math.sin(G.clock * 0.32 + m.p) * m.s * W;
      const y = ((m.y + G.clock * 0.018) % 1) * H;
      if (m.note) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.4);
        ctx.fillStyle = "rgba(200, 220, 255," + m.a * 0.7 + ")";
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.2, 2.2, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(190, 220, 255," + m.a + ")";
        ctx.beginPath();
        ctx.arc(x, y, m.r, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawBoard() {
    ctx.save();
    roundRect(L.boardX, L.boardY, L.boardW, L.boardH, 18);
    ctx.fillStyle = "rgba(8, 5, 18, 0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawStaff() {
    const ghostN = G.mode === "play" ? nearestIncoming() : null;
    const ghostAmt = G.mode === "play" ? move().ghost : 0.55;

    ctx.save();
    for (let p = 0; p <= 8; p += 2) {
      const y = yAt(p);
      const onCatch = Math.abs(G.catcher - p) < 0.35;
      const ghost =
        ghostN && ghostN.p === p ? ghostAmt * clamp(1.15 - (ghostN.x - L.catchX) / (L.x1 - L.catchX), 0, 1) : 0;
      ctx.beginPath();
      ctx.moveTo(L.x0, y);
      ctx.lineTo(L.x1, y);
      ctx.strokeStyle = onCatch
        ? rgba(PINK, 0.55 + Math.sin(G.clock * 6) * 0.12)
        : ghost > 0.05
          ? rgba(CYAN, 0.28 + ghost * 0.5)
          : "rgba(0, 240, 255, 0.28)";
      ctx.lineWidth = onCatch ? 2.4 : ghost > 0.2 ? 2.1 : 1.35;
      ctx.shadowColor = onCatch ? PINK : CYAN;
      ctx.shadowBlur = onCatch ? 14 : ghost > 0.15 ? 10 : 0;
      ctx.stroke();
    }
    ctx.restore();

    if (ghostN && ghostAmt > 0 && ghostN.p % 2 === 1) {
      const y = yAt(ghostN.p);
      const a = ghostAmt * 0.18 * clamp(1.1 - (ghostN.x - L.catchX) / (L.x1 - L.catchX), 0, 1);
      ctx.fillStyle = rgba(CYAN, a);
      ctx.fillRect(L.x0, y - L.gap * 0.42, L.x1 - L.x0, L.gap * 0.84);
    }

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(L.x0, yAt(8));
    ctx.lineTo(L.x0, yAt(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(L.x0 + 4, yAt(8));
    ctx.lineTo(L.x0 + 4, yAt(0));
    ctx.stroke();
    ctx.restore();

    if (G.mode === "play" && move().ghost > 0.5 && L.x0 - L.boardX > 50) {
      ctx.save();
      ctx.font = "600 " + Math.max(9, L.gap * 0.38) + "px Segoe UI, sans-serif";
      ctx.fillStyle = "rgba(139, 144, 184, 0.55)";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const labels = ["E", "G", "B", "D", "F"];
      for (let i = 0; i < 5; i++) {
        ctx.fillText(labels[i], L.x0 - 8, yAt(i * 2));
      }
      ctx.restore();
    }
  }

  function drawClef() {
    const yG = yAt(2);
    const s = L.gap;
    ctx.save();
    ctx.translate(L.clefX + s * 0.5, yG);
    ctx.scale(s / 14.6, s / 14.6);
    ctx.strokeStyle = rgba(CYAN, 0.85);
    ctx.fillStyle = rgba(CYAN, 0.85);
    ctx.lineWidth = 2.15;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(4, 30);
    ctx.bezierCurveTo(-2, 22, 0, 6, 10, 2);
    ctx.bezierCurveTo(22, -4, 24, 12, 12, 16);
    ctx.bezierCurveTo(2, 20, 2, 34, 14, 38);
    ctx.bezierCurveTo(26, 42, 20, 54, 8, 50);
    ctx.bezierCurveTo(-6, 44, 2, 20, 16, 4);
    ctx.bezierCurveTo(24, -6, 16, -18, 7, -12);
    ctx.bezierCurveTo(0, -8, 2, 2, 8, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, 52, 2.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPicked() {
    const topSpace = L.y0 - L.boardY;
    if (topSpace < 48 || picked.length === 0) return;
    const h = Math.min(topSpace * 0.62, L.gap * 2.4);
    const gap2 = h / 8;
    const y1 = L.boardY + topSpace * 0.22 + h;
    const x0 = L.x0;
    const x1 = L.x1;
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let p = 0; p <= 8; p += 2) {
      const y = y1 - p * gap2;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.22)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    const span = Math.max(1, picked.length);
    const step = Math.min((x1 - x0 - 8) / Math.max(span, 10), 18);
    for (let i = 0; i < picked.length; i++) {
      const n = picked[i];
      const x = x0 + 6 + i * step;
      const y = y1 - n.p * gap2;
      const c = pitchCol(n.p);
      ctx.fillStyle = cssRgb(c, 0.85);
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(2.2, gap2 * 0.42), Math.max(1.5, gap2 * 0.28), -0.35, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCatchRail() {
    const y = yAt(G.catcher);
    ctx.save();
    ctx.strokeStyle = "rgba(255, 61, 184, 0.22)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(L.catchX, yAt(8) - L.gap * 0.5);
    ctx.lineTo(L.catchX, yAt(0) + L.gap * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = rgba(PINK, 0.55);
    ctx.shadowColor = PINK;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(L.catchX, y - L.gap * 1.15);
    ctx.lineTo(L.catchX, y + L.gap * 1.15);
    ctx.stroke();

    ctx.lineWidth = 2.6;
    ctx.strokeStyle = rgba(PINK, 0.9);
    ctx.beginPath();
    ctx.moveTo(L.catchX - 10, y - L.gap * 0.95);
    ctx.lineTo(L.catchX - 16, y - L.gap * 0.95);
    ctx.lineTo(L.catchX - 16, y + L.gap * 0.95);
    ctx.lineTo(L.catchX - 10, y + L.gap * 0.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(L.catchX + 10, y - L.gap * 0.95);
    ctx.lineTo(L.catchX + 16, y - L.gap * 0.95);
    ctx.lineTo(L.catchX + 16, y + L.gap * 0.95);
    ctx.lineTo(L.catchX + 10, y + L.gap * 0.95);
    ctx.stroke();

    ctx.fillStyle = rgba(PINK, 0.12 + Math.sin(G.clock * 5) * 0.04);
    ctx.beginPath();
    ctx.ellipse(L.catchX, y, L.gap * 0.72, L.gap * 0.5, -0.35, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(PINK, 0.95);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(L.catchX, y, 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawNoteHead(x, y, scale, col, alpha, eighth, stemUp) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, 0, L.gap * 0.52 * scale, L.gap * 0.36 * scale, -0.38, 0, TAU);
    ctx.fill();
    const stemH = L.gap * 2.55 * scale;
    ctx.lineWidth = Math.max(1.4, L.gap * 0.08);
    ctx.beginPath();
    if (stemUp) {
      ctx.moveTo(L.gap * 0.46 * scale, -L.gap * 0.08 * scale);
      ctx.lineTo(L.gap * 0.46 * scale, -stemH);
    } else {
      ctx.moveTo(-L.gap * 0.46 * scale, L.gap * 0.08 * scale);
      ctx.lineTo(-L.gap * 0.46 * scale, stemH);
    }
    ctx.stroke();
    if (eighth) {
      ctx.beginPath();
      if (stemUp) {
        const sx = L.gap * 0.46 * scale;
        const sy = -stemH;
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx + L.gap * 0.7 * scale, sy + L.gap * 0.2 * scale, sx + L.gap * 0.55 * scale, sy + L.gap * 0.9 * scale, sx + L.gap * 0.12 * scale, sy + L.gap * 1.05 * scale);
      } else {
        const sx = -L.gap * 0.46 * scale;
        const sy = stemH;
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx - L.gap * 0.7 * scale, sy - L.gap * 0.2 * scale, sx - L.gap * 0.55 * scale, sy - L.gap * 0.9 * scale, sx - L.gap * 0.12 * scale, sy - L.gap * 1.05 * scale);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawNotes() {
    for (let i = 0; i < trails.length; i++) {
      const tr = trails[i];
      const c = pitchCol(tr.p);
      ctx.fillStyle = cssRgb(c, (tr.t / 0.35) * 0.22);
      ctx.beginPath();
      ctx.ellipse(tr.x, tr.y, L.gap * 0.28, L.gap * 0.18, -0.38, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < stamps.length; i++) {
      const s = stamps[i];
      const c = pitchCol(s.p);
      drawNoteHead(s.x, s.y, 0.82, cssRgb(c, s.t * 0.35), 1, false, s.p < 4);
    }

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== "fly" && n.state !== "caught" && n.state !== "miss") continue;
      const c = n.state === "miss" ? { r: 255, g: 61, b: 184 } : pitchCol(n.p);
      const a = n.state === "fly" ? 1 : clamp(n.fade, 0, 1);
      const col = n.state === "caught" ? GOLD : cssRgb(c, 1);
      const scale = n.state === "caught" ? 1.08 + (1 - a) * 0.35 : n.drop > 0.2 ? 0.86 + (1 - n.drop) * 0.14 : 1;
      drawNoteHead(n.x, n.y, scale, col, a, n.eighth, n.p < 4);
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.fillStyle = "rgba(" + q.r + "," + q.g + "," + q.b + "," + (q.life / q.max) + ")";
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.rad, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const q = sparks[i];
      ctx.strokeStyle = "rgba(" + q.r + "," + q.g + "," + q.b + "," + clamp(q.life * 3, 0, 1) + ")";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03);
      ctx.stroke();
    }
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.strokeStyle = typeof r.col === "string" ? r.col : cssRgb(r.col, r.t);
      if (typeof r.col === "string") ctx.globalAlpha = r.t;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, (1 - r.t) * r.max, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + Math.max(12, L.gap * 0.55) + "px Segoe UI, PingFang SC, sans-serif";
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = rgba(f.col, clamp(f.t * 1.4, 0, 1));
      ctx.shadowColor = f.col;
      ctx.shadowBlur = 12;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();

    if (G.judgeT > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(G.judgeT * 2.2, 0, 0.9);
      ctx.fillStyle = G.judgeCol;
      ctx.textAlign = "center";
      ctx.font = "900 " + Math.max(22, L.gap * 1.1) + "px Segoe UI, PingFang SC, sans-serif";
      ctx.shadowColor = G.judgeCol;
      ctx.shadowBlur = 18;
      ctx.fillText(G.judge, W * 0.58, L.boardY + 28);
      ctx.restore();
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashCol, G.flash * 0.16);
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    const sx = G.shake > 0 ? rand(-G.shake, G.shake) : 0;
    const sy = G.shake > 0 ? rand(-G.shake, G.shake) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
    drawSky();
    drawBoard();
    drawPicked();
    drawStaff();
    drawClef();
    drawCatchRail();
    drawNotes();
    drawFx();
    drawFlash();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pitchFromClient(clientY) {
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    return clamp(pAt(y), 0, 8);
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    pointer.active = true;
    pointer.id = e.pointerId;
    pointer.pitch = pitchFromClient(e.clientY);
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    e.preventDefault();
  }

  function onPointerMove(e) {
    pointer.pitch = pitchFromClient(e.clientY);
    if (e.pointerType === "mouse") pointer.hover = true;
    if (pointer.active && pointer.id != null && e.pointerId !== pointer.id) return;
  }

  function onPointerUp(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.active = false;
    pointer.id = null;
  }

  function isTyping() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  }

  function onKey(e, down) {
    if (isTyping()) return;
    const k = e.key;
    const code = e.code;
    if (
      k === "ArrowUp" ||
      k === "ArrowDown" ||
      k === " " ||
      k === "w" ||
      k === "W" ||
      k === "s" ||
      k === "S" ||
      k === "m" ||
      k === "M" ||
      k === "r" ||
      k === "R"
    ) {
      e.preventDefault();
    }
    if (k === "ArrowUp" || k === "w" || k === "W" || code === "KeyW") keys.up = down;
    if (k === "ArrowDown" || k === "s" || k === "S" || code === "KeyS") keys.down = down;

    if (!down) return;
    audio.ensure();

    if (k === "m" || k === "M") {
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === "r" || k === "R") {
      if (G.mode === "title") startPlay();
      else startPlay();
      return;
    }
    if (k === " " || k === "Enter") {
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startPlay();
      return;
    }
    if (G.mode !== "play" && G.mode !== "clear") return;
    if (k >= "1" && k <= "9") {
      G.snap = k.charCodeAt(0) - 49;
      pointer.active = false;
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", function () {
    pointer.hover = false;
  });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", function (e) {
    onKey(e, true);
  });
  window.addEventListener("keyup", function (e) {
    onKey(e, false);
  });
  ovBtn.addEventListener("click", function () {
    audio.ensure();
    startPlay();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    startPlay();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (!document.hidden) last = 0;
  });

  window.addEventListener("resize", resize);

  makeMotes();
  resize();
  seedDemo();
  showPanel("title");
  syncHud();

  let last = 0;
  let acc = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    if (G.paused) {
      draw();
      return;
    }
    acc += dt;
    G.clock += dt;
    const steps = Math.min(5, Math.floor(acc / STEP));
    for (let i = 0; i < steps; i++) {
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") updateDemo(STEP);
      else updatePlay(STEP);
      updateFx(STEP);
      acc -= STEP;
    }
    audio.tickDrone();
    draw();
  }

  requestAnimationFrame(frame);
})();
