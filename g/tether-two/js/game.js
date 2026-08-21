(() => {
  "use strict";

  const TILE = 40;
  const COLS = 24;
  const ROWS = 13;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const SPEED = 176;
  const PLAYER_R = 11.4;
  const HOLD = 0.68;
  const DIE_T = 0.7;
  const CLEAR_T = 0.82;
  const MUTE_KEY = "tether-two-mute";
  const MAG = "#ff3db8";
  const CYN = "#00f0ff";
  const GOLD = "#ffe36b";

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function hash(c, r) {
    const n = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function rows() {
    const out = [];
    for (let i = 0; i < arguments.length; i++) out.push(arguments[i]);
    if (out.length !== ROWS) throw new Error("rows " + out.length);
    for (let i = 0; i < out.length; i++) {
      if (out[i].length !== COLS) {
        throw new Error("row " + i + " len " + out[i].length);
      }
    }
    return out;
  }

  const STAGES = [
    {
      name: "初系",
      sub: "BIND",
      hint: "粉走粉板，青走青板。Tab 换人，或两手一起走",
      toast: "把两人都带到自己颜色的灯板",
      time: 50,
      rope: 250,
      map: rows(
        "########################",
        "#......................#",
        "#......................#",
        "#......................#",
        "#.P..................a.#",
        "#......................#",
        "#......................#",
        "#.C..................b.#",
        "#......................#",
        "#......................#",
        "#......................#",
        "#......................#",
        "########################"
      )
    },
    {
      name: "拉满",
      sub: "SPAN",
      hint: "绳不够绕远，绕开石柱再拉满",
      toast: "灯板隔着柱子，对准再拉开",
      time: 50,
      rope: 292,
      map: rows(
        "########################",
        "#......................#",
        "#.........a............#",
        "#......................#",
        "#.........###..........#",
        "#.....P...###..........#",
        "#.....C...###..........#",
        "#.........###..........#",
        "#......................#",
        "#.........b............#",
        "#......................#",
        "#......................#",
        "########################"
      )
    },
    {
      name: "深渊",
      sub: "ABYSS",
      hint: "先一起过桥，再分头上板。拽人会掉进洞",
      toast: "深渊会吞人。绷直之前先把两人都带过桥",
      time: 55,
      rope: 236,
      map: rows(
        "########################",
        "#........        ......#",
        "#........        ......#",
        "#........        .a....#",
        "#.P......        ......#",
        "#......................#",
        "#......................#",
        "#.C......        ......#",
        "#........        .b....#",
        "#........        ......#",
        "#........        ......#",
        "#........        ......#",
        "########################"
      )
    },
    {
      name: "回廊",
      sub: "HALL",
      hint: "通道弯，一次只能走远一点。把另一个人带上",
      toast: "跟着绳走完回廊，灯板在尽头并排",
      time: 60,
      rope: 196,
      map: rows(
        "########################",
        "#.PC...................#",
        "#......................#",
        "#......................#",
        "##########.............#",
        "##########.............#",
        "#.............##########",
        "#.............##########",
        "#......................#",
        "#......................#",
        "#..................a.b.#",
        "#......................#",
        "########################"
      )
    },
    {
      name: "旋刃",
      sub: "SAWS",
      hint: "贴紧走，等刃转开再一起过",
      toast: "三道旋刃。被拽到刃上也会断",
      time: 55,
      rope: 210,
      map: rows(
        "########################",
        "#......................#",
        "#......................#",
        "#.P..................a.#",
        "#......................#",
        "#......................#",
        "#......................#",
        "#.C..................b.#",
        "#......................#",
        "#......................#",
        "#......................#",
        "#......................#",
        "########################"
      ),
      saws: [
        { c: 7.5, r: 3.2, toR: 9.6, spd: 1.35, rad: 15 },
        { c: 12.5, r: 9.6, toR: 3.2, spd: 1.48, rad: 15 },
        { c: 17.5, r: 3.2, toR: 9.6, spd: 1.22, rad: 15 }
      ]
    },
    {
      name: "双栖",
      sub: "NEST",
      hint: "过桥躲刃，上岛再拉开站板",
      toast: "最后一系。桥上有刃，岛上要拉满",
      time: 70,
      rope: 292,
      map: rows(
        "########################",
        "#......          ......#",
        "#......          .a....#",
        "#..P...          ......#",
        "#......          ......#",
        "#......................#",
        "#......................#",
        "#......          ......#",
        "#..C...          ......#",
        "#......          .b....#",
        "#......          ......#",
        "#......          ......#",
        "########################"
      ),
      saws: [
        { c: 8.2, r: 5.5, toC: 15.8, toR: 5.5, spd: 1.55, rad: 14 }
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
  const btnSwap = document.getElementById("btn-swap");
  const btnPadSwap = document.getElementById("btn-pad-swap");
  const btnMag = document.getElementById("btn-mag");
  const btnCyn = document.getElementById("btn-cyn");
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const stageLabel = document.getElementById("stage-label");
  const whoLabel = document.getElementById("who-label");
  const timeLabel = document.getElementById("time-label");
  const meterEl = document.getElementById("meter");
  const meterFill = document.getElementById("meter-fill");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = {
    w: false, a: false, s: false, d: false,
    up: false, down: false, left: false, right: false
  };
  const pad = { up: false, down: false, left: false, right: false };
  const pointer = {
    down: false,
    id: null,
    wx: 0,
    wy: 0,
    follow: false
  };

  const particles = [];
  const sparks = [];
  const motes = [];
  const pulses = [];

  const G = {
    mode: "title",
    stage: 0,
    t: 0,
    clock: 0,
    remain: 50,
    lives: LIVES,
    active: 0,
    taut: 0,
    ropeLen: 240,
    hold: 0,
    shake: 0,
    flash: 0,
    lock: 0,
    iframe: 0,
    dieT: 0,
    toastT: 0,
    why: "",
    taught: false,
    switched: 0,
    yanks: 0,
    pads: 0,
    cells: [],
    walls: [],
    voids: [],
    saws: [],
    padA: { x: 0, y: 0, on: false },
    padB: { x: 0, y: 0, on: false },
    mag: makeActor(true),
    cyn: makeActor(false),
    paused: false
  };

  function makeActor(mag) {
    return {
      mag: mag,
      x: 80,
      y: 200,
      r: PLAYER_R,
      facing: 0,
      step: 0,
      bob: 0,
      moving: false,
      moved: false,
      wishX: 0,
      wishY: 0,
      falling: false,
      fallT: 0,
      onPad: false,
      tilt: 0,
      squash: 1,
      trail: []
    };
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastTaut: -9,
    lastPad: -9,
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
      f.frequency.value = 1400;
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    swap() {
      this.ensure();
      this.beep(520, 0.07, "triangle", 0.06, 880);
      this.beep(880, 0.1, "sine", 0.04, 420);
    },
    padOn() {
      this.ensure();
      this.beep(660, 0.12, "sine", 0.06, 990);
    },
    hold() {
      this.ensure();
      this.beep(440, 0.14, "triangle", 0.07, 880);
      this.beep(660, 0.22, "sine", 0.05, 1320);
    },
    taut() {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      if (now - this.lastTaut < 0.42) return;
      this.lastTaut = now;
      this.beep(140, 0.16, "sawtooth", 0.03, 90);
    },
    hit() {
      this.ensure();
      this.noise(0.22, 0.1);
      this.beep(220, 0.38, "sawtooth", 0.08, 55);
    },
    fall() {
      this.ensure();
      this.beep(280, 0.46, "sine", 0.07, 70);
      this.noise(0.18, 0.06);
    },
    win() {
      this.ensure();
      this.beep(440, 0.16, "triangle", 0.09, 880);
      this.beep(660, 0.28, "sine", 0.07, 1320);
      this.beep(880, 0.4, "sine", 0.05, 1760);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.5, "sawtooth", 0.09, 50);
      this.beep(90, 0.7, "square", 0.05, 40);
    },
    start() {
      this.ensure();
      this.beep(220, 0.14, "sine", 0.07, 520);
      this.beep(330, 0.18, "triangle", 0.05, 660);
    },
    tickDrone(taut) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 58;
        g.gain.value = 0.018;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const playing = G.mode === "play";
      this.drone.frequency.setTargetAtTime(58 + taut * 36, t, 0.12);
      this.droneGain.gain.setTargetAtTime(
        playing ? 0.016 + taut * taut * 0.034 : 0.0001,
        t,
        0.14
      );
    },
    stopDrone() {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

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
        mag: spec.mag || false,
        gold: spec.gold || false
      });
    }
  }

  function spark(x, y, n, mag) {
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
        mag: mag !== false
      });
    }
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.4;
  }

  function cellAt(x, y) {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return "#";
    return G.cells[r][c];
  }

  function isWall(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
    return G.cells[r][c] === "#";
  }

  function isVoidAt(x, y) {
    const ch = cellAt(x, y);
    return ch === " ";
  }

  function separateCircleRect(ent, rx, ry, rw, rh) {
    const cx = clamp(ent.x, rx, rx + rw);
    const cy = clamp(ent.y, ry, ry + rh);
    let dx = ent.x - cx;
    let dy = ent.y - cy;
    const d2 = dx * dx + dy * dy;
    const rad = ent.r;
    if (d2 >= rad * rad) return false;
    if (d2 < 1e-8) {
      const left = ent.x - rx;
      const right = rx + rw - ent.x;
      const top = ent.y - ry;
      const bot = ry + rh - ent.y;
      const m = Math.min(left, right, top, bot);
      if (m === left) ent.x = rx - rad;
      else if (m === right) ent.x = rx + rw + rad;
      else if (m === top) ent.y = ry - rad;
      else ent.y = ry + rh + rad;
      return true;
    }
    const d = Math.sqrt(d2);
    const o = rad - d;
    ent.x += (dx / d) * o;
    ent.y += (dy / d) * o;
    return true;
  }

  function collideWalls(ent) {
    const rad = ent.r;
    const minC = Math.floor((ent.x - rad) / TILE);
    const maxC = Math.floor((ent.x + rad) / TILE);
    const minR = Math.floor((ent.y - rad) / TILE);
    const maxR = Math.floor((ent.y + rad) / TILE);
    for (let k = 0; k < 2; k++) {
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (!isWall(c, r)) continue;
          separateCircleRect(ent, c * TILE, r * TILE, TILE, TILE);
        }
      }
    }
  }

  function tryMove(ent, dx, dy) {
    if (dx === 0 && dy === 0) return;
    ent.x += dx;
    collideWalls(ent);
    ent.y += dy;
    collideWalls(ent);
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.28 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 9 + 3,
        voidy: Math.random() < 0.45
      });
    }
  }

  function parseStage(s) {
    G.cells = s.map.slice();
    G.walls = [];
    G.voids = [];
    let px = 80;
    let py = 200;
    let cx = 80;
    let cy = 280;
    G.padA.x = 400;
    G.padA.y = 200;
    G.padB.x = 400;
    G.padB.y = 300;
    for (let r = 0; r < ROWS; r++) {
      const line = s.map[r];
      for (let c = 0; c < COLS; c++) {
        const ch = line[c];
        const x = c * TILE + TILE * 0.5;
        const y = r * TILE + TILE * 0.5;
        if (ch === "#") G.walls.push({ c: c, r: r });
        else if (ch === " ") G.voids.push({ c: c, r: r });
        if (ch === "P") {
          px = x;
          py = y;
        } else if (ch === "C") {
          cx = x;
          cy = y;
        } else if (ch === "a") {
          G.padA.x = x;
          G.padA.y = y;
        } else if (ch === "b") {
          G.padB.x = x;
          G.padB.y = y;
        }
      }
    }
    resetActor(G.mag, px, py);
    resetActor(G.cyn, cx, cy);
    G.saws = [];
    const list = s.saws || [];
    for (let i = 0; i < list.length; i++) {
      const sw = list[i];
      const x = sw.c * TILE;
      const y = sw.r * TILE;
      const x2 = (sw.toC != null ? sw.toC : sw.c) * TILE;
      const y2 = (sw.toR != null ? sw.toR : sw.r) * TILE;
      G.saws.push({
        x: x,
        y: y,
        x0: x,
        y0: y,
        x1: x2,
        y1: y2,
        u: 0,
        dir: 1,
        spd: sw.spd || 1,
        r: sw.rad || 15,
        spin: rand(0, TAU),
        spinSpd: rand(3.4, 5.2) * (Math.random() < 0.5 ? -1 : 1)
      });
    }
  }

  function resetActor(p, x, y) {
    p.x = x;
    p.y = y;
    p.facing = 0;
    p.step = 0;
    p.bob = rand(0, TAU);
    p.moving = false;
    p.moved = false;
    p.wishX = 0;
    p.wishY = 0;
    p.falling = false;
    p.fallT = 0;
    p.onPad = false;
    p.tilt = 0;
    p.squash = 1;
    p.trail.length = 0;
  }

  function loadStage(index, silent) {
    const s = STAGES[index];
    G.stage = index;
    G.remain = s.time;
    G.clock = 0;
    G.lock = 0.32;
    G.iframe = 0.2;
    G.hold = 0;
    G.dieT = 0;
    G.why = "";
    G.taught = false;
    G.ropeLen = s.rope;
    G.taut = 0;
    G.shake = 0;
    G.flash = 0;
    parseStage(s);
    particles.length = 0;
    sparks.length = 0;
    pulses.length = 0;
    makeMotes();
    pointer.down = false;
    pointer.follow = false;
    syncWho();
    syncHud();
    if (!silent) {
      toast(s.toast);
      hintEl.textContent = coarse
        ? "点角色或「切」换人 · 拖屏幕 / 方向键走"
        : s.hint;
    }
  }

  function syncWho() {
    whoLabel.textContent = G.active === 0 ? "控 粉" : "控 青";
    whoLabel.classList.toggle("cyn", G.active === 1);
    btnMag.classList.toggle("on", G.active === 0);
    btnCyn.classList.toggle("on", G.active === 1);
  }

  function syncHud() {
    const s = STAGES[G.stage];
    stageLabel.textContent = s.name + " · " + s.sub + "  " + (G.stage + 1) + "/" + STAGES.length;
    const t = Math.ceil(Math.max(0, G.remain));
    timeLabel.textContent = t + "s";
    timeLabel.classList.toggle("warn", G.remain < 9 && G.mode === "play");
    const taut = clamp(G.taut, 0, 1.12);
    meterFill.style.width = Math.min(100, taut * 100) + "%";
    meterEl.classList.toggle("hot", taut > 0.86);
    pipsEl.innerHTML = "";
    for (let i = 0; i < LIVES; i++) {
      const el = document.createElement("i");
      el.className = "pip" + (i < G.lives ? " on" : "") + (G.lives === 1 && i === 0 ? " warn" : "");
      pipsEl.appendChild(el);
    }
  }

  function setActive(i) {
    if (i === G.active) return;
    G.active = i;
    G.switched += 1;
    syncWho();
    audio.swap();
    const p = i === 0 ? G.mag : G.cyn;
    emit(8, {
      x: p.x,
      y: p.y,
      j: 10,
      vx0: -40,
      vx1: 40,
      vy0: -50,
      vy1: 20,
      life: 0.38,
      r0: 1.2,
      r1: 2.8,
      mag: i === 0
    });
  }

  function swapActive() {
    setActive(G.active === 0 ? 1 : 0);
  }

  function showPanel(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "TETHER";
      ovTitle.textContent = "双系";
      ovLead.innerHTML = "两人被一根霓虹绳拴着。绳有极限，绷直就会把另一个人拽走。<br />粉站粉板，青站青板，同时亮起才算过关。";
      ovOps.textContent = coarse
        ? "点角色或「切」换人 · 拖屏幕或方向键走 · M 静音"
        : "WASD 粉 · 方向键 青 · Tab / 点角色切换 · 拖屏幕 · M 静音";
      ovBtn.textContent = "系上";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "解系";
      ovLead.textContent = "六关都站上了。绳子还亮着，没断过。";
      ovOps.textContent = "换人 " + G.switched + " · 拽动 " + G.yanks + " · 剩命 " + G.lives;
      ovBtn.textContent = "再系一次";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "SNAP";
      ovTitle.textContent = "断系";
      let why = "绳子还在，人已经不在板上。";
      if (G.why === "void") why = "有人被拽进深渊。绳还连着，人已经没了。";
      else if (G.why === "saw") why = "旋刃削过。系绳救不了贴上去的人。";
      else if (G.why === "time") why = "时间耗尽，灯板没来得及一起亮。";
      ovLead.textContent = why;
      ovOps.textContent = STAGES[G.stage].name + " · 换人 " + G.switched;
      ovBtn.textContent = "再系一次";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startRun() {
    audio.start();
    G.mode = "play";
    G.lives = LIVES;
    G.switched = 0;
    G.yanks = 0;
    G.pads = 0;
    G.active = 0;
    hideOverlay();
    loadStage(0);
  }

  function restartRun() {
    if (G.mode === "title") {
      startRun();
      return;
    }
    audio.start();
    G.mode = "play";
    G.lives = LIVES;
    G.switched = 0;
    G.yanks = 0;
    G.pads = 0;
    G.active = 0;
    hideOverlay();
    loadStage(0);
  }

  function endGame(win, why) {
    if (G.mode !== "play" && G.mode !== "clearing") return;
    G.why = why || "";
    if (win) {
      G.mode = "winning";
      G.dieT = CLEAR_T + 0.4;
      toastEl.classList.add("hidden");
      G.toastT = 0;
      audio.win();
      emit(40, {
        x: (G.mag.x + G.cyn.x) * 0.5,
        y: (G.mag.y + G.cyn.y) * 0.5,
        j: 28,
        vx0: -90,
        vx1: 90,
        vy0: -110,
        vy1: 40,
        life: 0.9,
        r0: 1.4,
        r1: 4.6,
        mag: false,
        gold: true
      });
    } else {
      G.mode = "dying";
      G.dieT = DIE_T;
      G.flash = 0.9;
      G.shake = 11;
      toastEl.classList.add("hidden");
      G.toastT = 0;
      audio.lose();
    }
    audio.stopDrone();
  }

  function kill(why, victim) {
    if (G.mode !== "play") return;
    G.why = why;
    if (why === "void") audio.fall();
    else audio.hit();
    G.flash = 0.75;
    G.shake = 10;
    const p = victim || G.mag;
    emit(24, {
      x: p.x,
      y: p.y,
      j: 8,
      vx0: -100,
      vx1: 100,
      vy0: -90,
      vy1: 70,
      life: 0.55,
      r0: 1.2,
      r1: 3.8,
      mag: p.mag
    });
    spark(p.x, p.y, 12, p.mag);
    G.lives -= 1;
    if (G.lives <= 0) {
      endGame(false, why);
      return;
    }
    G.mode = "dying";
    G.dieT = DIE_T;
    toast(why === "void" ? "坠入深渊 · 还剩 " + G.lives : why === "saw" ? "被刃削到 · 还剩 " + G.lives : "时间到 · 还剩 " + G.lives, true);
    syncHud();
  }

  function beginFall(p) {
    if (p.falling || G.mode !== "play") return;
    p.falling = true;
    p.fallT = 0;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    return {
      x: (sx - view.ox) / view.scale,
      y: (sy - view.oy) / view.scale
    };
  }

  function pickActor(x, y) {
    const dm = hypot(x - G.mag.x, y - G.mag.y);
    const dc = hypot(x - G.cyn.x, y - G.cyn.y);
    const hit = 28;
    if (dm < hit && dm <= dc) return 0;
    if (dc < hit) return 1;
    return -1;
  }

  function gatherWish() {
    const mag = G.mag;
    const cyn = G.cyn;
    mag.wishX = 0;
    mag.wishY = 0;
    cyn.wishX = 0;
    cyn.wishY = 0;

    const wasdX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const wasdY = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    const arrX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const arrY = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const padX = (pad.right ? 1 : 0) - (pad.left ? 1 : 0);
    const padY = (pad.down ? 1 : 0) - (pad.up ? 1 : 0);
    const wasd = wasdX !== 0 || wasdY !== 0;
    const arr = arrX !== 0 || arrY !== 0;

    if (wasd && arr) {
      mag.wishX += wasdX;
      mag.wishY += wasdY;
      cyn.wishX += arrX;
      cyn.wishY += arrY;
    } else {
      const x = wasd ? wasdX : arrX;
      const y = wasd ? wasdY : arrY;
      if (x || y) {
        if (G.active === 0) {
          mag.wishX += x;
          mag.wishY += y;
        } else {
          cyn.wishX += x;
          cyn.wishY += y;
        }
      }
    }

    if (padX || padY) {
      const t = G.active === 0 ? mag : cyn;
      t.wishX += padX;
      t.wishY += padY;
    }

    if (pointer.down && pointer.follow && G.mode === "play") {
      const t = G.active === 0 ? mag : cyn;
      const dx = pointer.wx - t.x;
      const dy = pointer.wy - t.y;
      const d = hypot(dx, dy);
      if (d > 10) {
        t.wishX += dx / d;
        t.wishY += dy / d;
      }
    }
  }

  function normWish(p) {
    const d = hypot(p.wishX, p.wishY);
    if (d > 1) {
      p.wishX /= d;
      p.wishY /= d;
    }
  }

  function solveTether() {
    const mag = G.mag;
    const cyn = G.cyn;
    const max = G.ropeLen;
    const prev = G.taut;
    for (let i = 0; i < 5; i++) {
      const dx = cyn.x - mag.x;
      const dy = cyn.y - mag.y;
      const dist = hypot(dx, dy) || 0.0001;
      G.taut = dist / max;
      if (dist <= max) break;
      const nx = dx / dist;
      const ny = dy / dist;
      const extra = dist - max;
      let wM = 0.5;
      let wC = 0.5;
      if (mag.moved && !cyn.moved) {
        wM = 0.14;
        wC = 0.86;
      } else if (cyn.moved && !mag.moved) {
        wM = 0.86;
        wC = 0.14;
      }
      mag.x += nx * extra * wM;
      mag.y += ny * extra * wM;
      cyn.x -= nx * extra * wC;
      cyn.y -= ny * extra * wC;
      collideWalls(mag);
      collideWalls(cyn);
    }
    const dx = cyn.x - mag.x;
    const dy = cyn.y - mag.y;
    G.taut = hypot(dx, dy) / max;
    if (G.taut > 0.97 && prev <= 0.97 && (mag.moved || cyn.moved)) {
      G.yanks += 1;
      audio.taut();
      const mx = (mag.x + cyn.x) * 0.5;
      const my = (mag.y + cyn.y) * 0.5;
      spark(mx, my, 4, G.active === 0);
    } else if (G.taut > 0.9) {
      audio.taut();
    }
  }

  function actorStep(p, dt) {
    if (p.falling) {
      p.fallT += dt;
      p.moving = false;
      p.moved = false;
      if (p.fallT > 0.42 && G.mode === "play") kill("void", p);
      return;
    }
    normWish(p);
    const spd = SPEED * dt;
    const dx = p.wishX * spd;
    const dy = p.wishY * spd;
    p.moved = Math.abs(dx) + Math.abs(dy) > 0.02;
    if (p.moved) {
      const ox = p.x;
      const oy = p.y;
      tryMove(p, dx, dy);
      if (Math.abs(p.x - ox) + Math.abs(p.y - oy) < 0.02) p.moved = false;
    }
    p.moving = p.moved;
    if (p.moved) {
      p.facing = Math.atan2(p.wishY, p.wishX);
      p.step += hypot(p.wishX, p.wishY) * dt * 14;
      p.trail.push({ x: p.x, y: p.y, a: 1 });
      if (p.trail.length > 10) p.trail.shift();
      if (Math.random() < dt * 14) {
        emit(1, {
          x: p.x,
          y: p.y + 6,
          j: 3,
          vx0: -12,
          vx1: 12,
          vy0: -8,
          vy1: 4,
          life: 0.28,
          r0: 0.8,
          r1: 1.8,
          mag: p.mag
        });
      }
    } else if (p.trail.length) {
      p.trail.shift();
    }
    p.bob += dt * (p.moving ? 11 : 5.2);
    p.tilt = lerp(p.tilt, p.wishX * 0.18, 1 - Math.pow(0.001, dt));
    p.squash = lerp(p.squash, p.moving ? 0.92 : 1, 1 - Math.pow(0.002, dt));
  }

  function checkPads(dt) {
    const mag = G.mag;
    const cyn = G.cyn;
    const ra = 18;
    mag.onPad = !mag.falling && hypot(mag.x - G.padA.x, mag.y - G.padA.y) < ra;
    cyn.onPad = !cyn.falling && hypot(cyn.x - G.padB.x, cyn.y - G.padB.y) < ra;
    G.padA.on = mag.onPad;
    G.padB.on = cyn.onPad;
    if (mag.onPad && cyn.onPad) {
      if (G.hold === 0) audio.padOn();
      G.hold += dt;
      if (G.hold > 0.16 && pulses.length < 3 && Math.random() < dt * 6) {
        pulses.push({
          x: (G.padA.x + G.padB.x) * 0.5,
          y: (G.padA.y + G.padB.y) * 0.5,
          r: 8,
          a: 1,
          mag: false
        });
      }
      if (G.hold >= HOLD) {
        G.pads += 1;
        clearStage();
      }
    } else {
      if (G.hold > 0.12 && (mag.onPad || cyn.onPad) && audio.ctx) {
        const now = audio.ctx.currentTime;
        if (now - audio.lastPad > 0.5) {
          audio.lastPad = now;
          audio.beep(320, 0.08, "sine", 0.03, 180);
        }
      }
      G.hold = Math.max(0, G.hold - dt * 1.8);
    }
  }

  function clearStage() {
    if (G.mode !== "play") return;
    G.mode = "clearing";
    G.dieT = CLEAR_T;
    G.flash = 0.35;
    audio.hold();
    emit(28, {
      x: G.padA.x,
      y: G.padA.y,
      j: 12,
      vx0: -60,
      vx1: 60,
      vy0: -80,
      vy1: 20,
      life: 0.7,
      r0: 1.2,
      r1: 3.4,
      mag: true
    });
    emit(28, {
      x: G.padB.x,
      y: G.padB.y,
      j: 12,
      vx0: -60,
      vx1: 60,
      vy0: -80,
      vy1: 20,
      life: 0.7,
      r0: 1.2,
      r1: 3.4,
      mag: false
    });
    toast(G.stage === STAGES.length - 1 ? "双板同亮" : "过关 · 下一系");
  }

  function checkHazards() {
    if (G.iframe > 0) return;
    const mag = G.mag;
    const cyn = G.cyn;
    if (!mag.falling && isVoidAt(mag.x, mag.y)) beginFall(mag);
    if (!cyn.falling && isVoidAt(cyn.x, cyn.y)) beginFall(cyn);
    for (let i = 0; i < G.saws.length; i++) {
      const sw = G.saws[i];
      if (!mag.falling && hypot(mag.x - sw.x, mag.y - sw.y) < mag.r + sw.r - 2) {
        kill("saw", mag);
        return;
      }
      if (!cyn.falling && hypot(cyn.x - sw.x, cyn.y - sw.y) < cyn.r + sw.r - 2) {
        kill("saw", cyn);
        return;
      }
    }
  }

  function updateSaws(dt) {
    for (let i = 0; i < G.saws.length; i++) {
      const sw = G.saws[i];
      sw.spin += sw.spinSpd * dt;
      const dx = sw.x1 - sw.x0;
      const dy = sw.y1 - sw.y0;
      const len = hypot(dx, dy);
      if (len > 1) {
        sw.u += sw.dir * (sw.spd * TILE) * dt / len;
        if (sw.u >= 1) {
          sw.u = 1;
          sw.dir = -1;
        } else if (sw.u <= 0) {
          sw.u = 0;
          sw.dir = 1;
        }
        sw.x = sw.x0 + dx * sw.u;
        sw.y = sw.y0 + dy * sw.u;
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 22);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life <= 0) sparks.splice(i, 1);
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.r += dt * 90;
      p.a -= dt * 1.6;
      if (p.a <= 0) pulses.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.p += dt * 0.7;
      m.y += Math.sin(m.p) * dt * m.s * 0.15;
      if (m.voidy) m.y += dt * 8;
      if (m.y > WORLD_H + 8) m.y = -6;
    }
  }

  function updateDemo(dt) {
    G.clock += dt;
    const t = G.clock;
    const mag = G.mag;
    const cyn = G.cyn;
    mag.x = 210 + Math.sin(t * 0.7) * 90;
    mag.y = 200 + Math.cos(t * 0.55) * 46;
    cyn.x = 310 + Math.sin(t * 0.7 + 1.1) * 86;
    cyn.y = 318 + Math.cos(t * 0.5) * 40;
    collideWalls(mag);
    collideWalls(cyn);
    mag.moved = true;
    cyn.moved = true;
    solveTether();
    mag.facing = Math.atan2(Math.cos(t * 0.7) * 40, Math.cos(t * 0.7) * 90);
    cyn.facing = mag.facing + 0.4;
    mag.step += dt * 10;
    cyn.step += dt * 10;
    mag.bob += dt * 8;
    cyn.bob += dt * 8;
    mag.onPad = hypot(mag.x - G.padA.x, mag.y - G.padA.y) < 18;
    cyn.onPad = hypot(cyn.x - G.padB.x, cyn.y - G.padB.y) < 18;
    updateSaws(dt);
    updateFx(dt);
    G.taut = hypot(cyn.x - mag.x, cyn.y - mag.y) / G.ropeLen;
  }

  function updatePlay(dt) {
    const playing = G.mode === "play";
    G.clock += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.iframe > 0) G.iframe -= dt;

    gatherWish();
    if (!playing || G.lock > 0) {
      G.mag.wishX = 0;
      G.mag.wishY = 0;
      G.cyn.wishX = 0;
      G.cyn.wishY = 0;
    }

    actorStep(G.mag, dt);
    actorStep(G.cyn, dt);
    solveTether();
    updateSaws(dt);

    if (playing) {
      G.remain -= dt;
      if (G.remain <= 0) {
        G.remain = 0;
        kill("time", G.mag);
      } else {
        checkHazards();
        if (G.mode === "play") checkPads(dt);
      }
      if (!G.taught && G.clock > 7) {
        const one = (G.mag.onPad && !G.cyn.onPad) || (G.cyn.onPad && !G.mag.onPad);
        if (one) {
          G.taught = true;
          toast("换另一个人 · Tab 或点角色", true);
        }
      }
    }

    updateFx(dt);
    audio.tickDrone(clamp(G.taut, 0, 1));
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
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
    const s = Math.min(view.w / WORLD_W, view.h / WORLD_H);
    view.scale = s;
    view.ox = (view.w - WORLD_W * s) * 0.5;
    view.oy = (view.h - WORLD_H * s) * 0.5;
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

  function drawBackground() {
    ctx.fillStyle = "#05030c";
    ctx.fillRect(-view.ox / view.scale - 4, -view.oy / view.scale - 4, view.w / view.scale + 8, view.h / view.scale + 8);

    ctx.fillStyle = "#0a0718";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = G.cells[r][c];
        const x = c * TILE;
        const y = r * TILE;
        if (ch === " ") {
          const h = hash(c, r);
          ctx.fillStyle = "rgba(4, 2, 12, " + (0.92 + h * 0.08) + ")";
          ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
          ctx.strokeStyle = "rgba(80, 30, 120, 0.16)";
          ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        } else if (ch !== "#") {
          const h = hash(c + 3, r + 1);
          ctx.fillStyle = h > 0.62 ? "#100a22" : "#0d081c";
          ctx.fillRect(x, y, TILE + 0.4, TILE + 0.4);
          if (h > 0.84) {
            ctx.fillStyle = "rgba(0, 240, 255, 0.035)";
            ctx.fillRect(x + 8, y + 8, 6, 6);
          }
        }
      }
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      if (m.voidy && cellAt(m.x, m.y) !== " ") continue;
      ctx.fillStyle = m.voidy
        ? "rgba(255, 61, 184, " + m.a * 0.55 + ")"
        : "rgba(0, 240, 255, " + m.a + ")";
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      const x = w.c * TILE;
      const y = w.r * TILE;
      ctx.fillStyle = "#161022";
      ctx.fillRect(x, y, TILE + 0.4, TILE + 0.4);
      ctx.fillStyle = "rgba(0, 240, 255, 0.07)";
      ctx.fillRect(x, y, TILE, 3);
      ctx.fillStyle = "rgba(255, 61, 184, 0.05)";
      ctx.fillRect(x, y + TILE - 3, TILE, 3);
    }

    ctx.strokeStyle = "rgba(0, 240, 255, 0.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1.2, 1.2, WORLD_W - 2.4, WORLD_H - 2.4);
  }

  function drawPad(p, mag) {
    const col = mag ? MAG : CYN;
    const pulse = 0.5 + 0.5 * Math.sin(G.clock * 3.2 + (mag ? 0 : 1.2));
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, TAU);
    ctx.fillStyle = mag ? "rgba(255, 61, 184, 0.1)" : "rgba(0, 240, 255, 0.1)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulse * 2, 0, TAU);
    ctx.strokeStyle = col;
    ctx.globalAlpha = p.on ? 0.95 : 0.45 + pulse * 0.2;
    ctx.lineWidth = p.on ? 3.2 : 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (p.on) {
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, TAU);
      ctx.fillStyle = mag ? "rgba(255, 61, 184, 0.45)" : "rgba(0, 240, 255, 0.45)";
      ctx.fill();
    }
    if (G.hold > 0 && p.on) {
      ctx.beginPath();
      ctx.arc(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(G.hold / HOLD, 0, 1));
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRope() {
    const a = G.mag;
    const b = G.cyn;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = hypot(dx, dy) || 0.0001;
    const taut = clamp(G.taut, 0, 1.2);
    const sag = (1 - Math.min(1, taut) * Math.min(1, taut)) * Math.min(26, dist * 0.14);
    const segs = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function point(i) {
      const t = i / segs;
      const wave = Math.sin(t * Math.PI * 3 + G.clock * 5) * (1 - Math.min(1, taut)) * 2.4;
      return {
        x: a.x + dx * t,
        y: a.y + dy * t + Math.sin(t * Math.PI) * sag + wave
      };
    }

    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const p = point(i);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = taut > 0.88 ? "rgba(255, 227, 107, 0.22)" : "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = taut > 0.88 ? 10 : 7;
    ctx.stroke();

    const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    grad.addColorStop(0, MAG);
    grad.addColorStop(0.5, taut > 0.9 ? GOLD : "#ffffff");
    grad.addColorStop(1, CYN);
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const p = point(i);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = grad;
    ctx.globalAlpha = 0.55 + taut * 0.4;
    ctx.lineWidth = taut > 0.9 ? 3.4 : 2.2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    const pulseT = (G.clock * 0.55) % 1;
    const q = point(Math.round(pulseT * segs));
    ctx.beginPath();
    ctx.arc(q.x, q.y, 2.4, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;

    if (G.mode === "play" || G.mode === "title") {
      const anchor = G.active === 0 ? b : a;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, G.ropeLen, 0, TAU);
      ctx.strokeStyle = G.active === 0 ? "rgba(0, 240, 255, 0.12)" : "rgba(255, 61, 184, 0.12)";
      ctx.lineWidth = taut > 0.86 ? 2.2 : 1.2;
      ctx.setLineDash([6, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawSaw(sw) {
    ctx.save();
    ctx.translate(sw.x, sw.y);
    ctx.rotate(sw.spin);
    ctx.beginPath();
    ctx.arc(0, 0, sw.r + 4, 0, TAU);
    ctx.fillStyle = "rgba(255, 61, 184, 0.1)";
    ctx.fill();
    const teeth = 8;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * TAU;
      const a1 = ((i + 0.5) / teeth) * TAU;
      const a2 = ((i + 1) / teeth) * TAU;
      ctx.lineTo(Math.cos(a0) * sw.r * 0.62, Math.sin(a0) * sw.r * 0.62);
      ctx.lineTo(Math.cos(a1) * sw.r, Math.sin(a1) * sw.r);
      ctx.lineTo(Math.cos(a2) * sw.r * 0.62, Math.sin(a2) * sw.r * 0.62);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, sw.r);
    g.addColorStop(0, "#ffe6fb");
    g.addColorStop(0.45, MAG);
    g.addColorStop(1, "#4a1038");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = CYN;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 3.4, 0, TAU);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }

  function drawActor(p) {
    const col = p.mag ? MAG : CYN;
    const s = p.falling ? Math.max(0.15, 1 - p.fallT * 1.7) : 1;
    ctx.save();
    for (let i = 0; i < p.trail.length; i++) {
      const tr = p.trail[i];
      ctx.globalAlpha = (i / p.trail.length) * 0.28;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 5, 0, TAU);
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.translate(p.x, p.y + (p.falling ? p.fallT * 22 : 0));
    ctx.rotate(p.tilt);
    ctx.scale(s * (2 - p.squash), s * p.squash);

    ctx.beginPath();
    ctx.ellipse(0, 11, 8, 3.2, 0, 0, TAU);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fill();

    const swing = Math.sin(p.step) * (p.moving ? 6.5 : 1.6);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-3, 4);
    ctx.lineTo(-3 - swing * 0.15, 11);
    ctx.moveTo(3, 4);
    ctx.lineTo(3 + swing * 0.15, 11);
    ctx.stroke();

    roundRect(-7.2, -6, 14.4, 13, 5);
    ctx.fillStyle = p.mag ? "rgba(255, 61, 184, 0.85)" : "rgba(0, 240, 255, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(0, -10, p.mag ? 6.2 : 5.8, 0, TAU);
    ctx.fillStyle = p.mag ? "#ff7ad0" : "#7af6ff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.mag ? 1.6 : 1.4, -11.2, 1.6, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -1, 4.6, 0, TAU);
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;

    const active = (G.active === 0) === p.mag;
    if (active && (G.mode === "play" || G.mode === "title")) {
      ctx.beginPath();
      ctx.arc(0, -2, 16, G.clock * 2.4, G.clock * 2.4 + 1.8);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -2, 16, G.clock * 2.4 + Math.PI, G.clock * 2.4 + Math.PI + 1.8);
      ctx.stroke();
    }

    ctx.restore();

    ctx.font = "600 10px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.85;
    ctx.fillText(p.mag ? "粉" : "青", p.x, p.y + 22 + (p.falling ? p.fallT * 22 : 0));
    ctx.globalAlpha = 1;
  }

  function drawFx() {
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.strokeStyle = p.mag ? MAG : CYN;
      ctx.globalAlpha = Math.max(0, p.a) * 0.55;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = p.gold ? GOLD : p.mag ? MAG : CYN;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      ctx.strokeStyle = p.mag ? MAG : CYN;
      ctx.globalAlpha = clamp(p.life * 3, 0, 1);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) * 0.7 : 0;
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);

    drawBackground();
    drawPad(G.padA, true);
    drawPad(G.padB, false);
    drawRope();
    for (let i = 0; i < G.saws.length; i++) drawSaw(G.saws[i]);
    drawActor(G.active === 0 ? G.cyn : G.mag);
    drawActor(G.active === 0 ? G.mag : G.cyn);
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = "rgba(255, 61, 184, " + G.flash * 0.28 + ")";
      ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === "title") {
      updateDemo(dt);
      return;
    }
    if (G.mode === "play" || G.mode === "clearing" || G.mode === "dying" || G.mode === "winning") {
      updatePlay(dt);
    }
    if (G.mode === "clearing") {
      G.dieT -= dt;
      if (G.dieT <= 0) {
        if (G.stage >= STAGES.length - 1) {
          endGame(true, "clear");
        } else {
          G.mode = "play";
          loadStage(G.stage + 1);
        }
      }
    } else if (G.mode === "dying") {
      G.dieT -= dt;
      if (G.dieT <= 0) {
        if (G.lives <= 0) {
          G.mode = "lose";
          showPanel("lose");
        } else {
          G.mode = "play";
          loadStage(G.stage, true);
          toast("再系一次", true);
        }
      }
    } else if (G.mode === "winning") {
      G.dieT -= dt;
      if (G.dieT <= 0) {
        G.mode = "win";
        showPanel("win");
      }
    }
  }

  let last = 0;
  let acc = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (G.paused) {
      requestAnimationFrame(frame);
      return;
    }
    dt = Math.min(dt, 0.05);
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const k = e.key;
    let used = true;
    if (k === "w" || k === "W") keys.w = down;
    else if (k === "a" || k === "A") keys.a = down;
    else if (k === "s" || k === "S") keys.s = down;
    else if (k === "d" || k === "D") keys.d = down;
    else if (k === "ArrowUp") keys.up = down;
    else if (k === "ArrowDown") keys.down = down;
    else if (k === "ArrowLeft") keys.left = down;
    else if (k === "ArrowRight") keys.right = down;
    else used = false;

    if (!down) {
      if (used) e.preventDefault();
      return;
    }
    if (e.repeat && (k === "Tab" || k === " " || k === "Enter" || k === "m" || k === "M" || k === "r" || k === "R")) {
      e.preventDefault();
      return;
    }

    if (k === "m" || k === "M") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (k === "r" || k === "R") {
      restartRun();
      e.preventDefault();
      return;
    }
    if (k === "Tab") {
      if (G.mode === "play") swapActive();
      e.preventDefault();
      return;
    }
    if (k === " " || k === "Enter") {
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startRun();
      else if (G.mode === "play") swapActive();
      e.preventDefault();
      return;
    }
    if (used) e.preventDefault();
  }

  function bindHold(btn, key) {
    const go = function (e) {
      e.preventDefault();
      pad[key] = true;
      btn.classList.add("held");
      audio.ensure();
    };
    const stop = function (e) {
      e.preventDefault();
      pad[key] = false;
      btn.classList.remove("held");
    };
    btn.addEventListener("pointerdown", go);
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointerleave", stop);
    btn.addEventListener("pointercancel", stop);
  }

  bindHold(btnUp, "up");
  bindHold(btnDown, "down");
  bindHold(btnLeft, "left");
  bindHold(btnRight, "right");

  canvas.addEventListener("pointerdown", function (e) {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    const w = worldFromEvent(e);
    const who = pickActor(w.x, w.y);
    if (who >= 0) setActive(who);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.wx = w.x;
    pointer.wy = w.y;
    pointer.follow = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const w = worldFromEvent(e);
    pointer.wx = w.x;
    pointer.wy = w.y;
  });

  function endPointer(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    pointer.follow = false;
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    startRun();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    restartRun();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnSwap.addEventListener("click", function () {
    audio.ensure();
    if (G.mode === "play") swapActive();
  });
  btnPadSwap.addEventListener("click", function () {
    audio.ensure();
    if (G.mode === "play") swapActive();
  });
  btnMag.addEventListener("click", function () {
    audio.ensure();
    if (G.mode === "play") setActive(0);
  });
  btnCyn.addEventListener("click", function () {
    audio.ensure();
    if (G.mode === "play") setActive(1);
  });

  window.addEventListener("keydown", function (e) { onKey(e, true); });
  window.addEventListener("keyup", function (e) { onKey(e, false); });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  window.addEventListener("blur", function () {
    keys.w = keys.a = keys.s = keys.d = false;
    keys.up = keys.down = keys.left = keys.right = false;
    pad.up = pad.down = pad.left = pad.right = false;
  });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      G.paused = true;
      if (audio.ctx) audio.ctx.suspend();
    } else {
      G.paused = false;
      last = 0;
      if (audio.ctx && !audio.muted) audio.ctx.resume();
    }
  });

  loadStage(0, true);
  G.mode = "title";
  showPanel("title");
  hintEl.textContent = "一次牵一个 · 绷直会拽人 · 两人上板";
  resize();
  syncHud();
  requestAnimationFrame(frame);
})();
