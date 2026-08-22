(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const MOVE_T = 0.13;
  const DIE_T = 0.72;
  const CLEAR_T = 1.18;
  const MUTE_KEY = "night-gate-mute";
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const FONT = '"Segoe UI","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';

  const DIRS = {
    left: { c: -1, r: 0 },
    right: { c: 1, r: 0 },
    up: { c: 0, r: -1 },
    down: { c: 0, r: 1 }
  };
  const DIR_LIST = ["left", "right", "up", "down"];

  const PAL = {
    C: { hex: CYAN, name: "青", rgb: [0, 240, 255], note: 523, glyph: "dia" },
    P: { hex: PINK, name: "粉", rgb: [255, 61, 184], note: 392, glyph: "pet" },
    G: { hex: GOLD, name: "金", rgb: [255, 227, 107], note: 659, glyph: "star" },
    V: { hex: "#c77dff", name: "紫", rgb: [199, 125, 255], note: 330, glyph: "tri" },
    M: { hex: "#3dffb0", name: "翠", rgb: [61, 255, 176], note: 784, glyph: "hex" },
    R: { hex: "#ff7a5c", name: "霞", rgb: [255, 122, 92], note: 294, glyph: "moon" }
  };

  const STAGES = [
    {
      name: "初灯",
      sub: "FIRST",
      hint: "门上亮青，就去踩青灯 · 再踩粉",
      toast: "先看门楣的纹，再踩同样的灯",
      need: "CP",
      show: 0,
      time: 0,
      drift: 0,
      map: [
        ".C.",
        "...",
        "@.P"
      ]
    },
    {
      name: "三色",
      sub: "TRI",
      hint: "青、金、粉 · 别踩紫灯",
      toast: "三纹 · 紫是错灯",
      need: "CGP",
      show: 0,
      time: 0,
      drift: 0,
      map: [
        "VG.",
        "C.P",
        ".@."
      ]
    },
    {
      name: "绕石",
      sub: "WIND",
      hint: "石头挡住直路，绕过去",
      toast: "粉 → 青 → 金 · 绕石",
      need: "PCG",
      show: 0,
      time: 0,
      drift: 0,
      map: [
        "G#C",
        ".#.",
        "P..",
        ".@."
      ]
    },
    {
      name: "错灯",
      sub: "DECOY",
      hint: "旁边那盏粉是诱饵，先青",
      toast: "四纹 · 先青，别踩脚边的粉",
      need: "CPGV",
      show: 0,
      time: 0,
      drift: 0,
      map: [
        "V..",
        "##.",
        "C.G",
        ".@P"
      ]
    },
    {
      name: "暗纹",
      sub: "FADE",
      hint: "门纹会灭 · 先把次序记住",
      toast: "纹要灭了 · 先记再走",
      need: "CGPV",
      show: 4.2,
      time: 0,
      drift: 0,
      map: [
        ".V.",
        "C#P",
        ".G.",
        ".@."
      ]
    },
    {
      name: "密径",
      sub: "DENSE",
      hint: "窄路 · 粉青金紫，别踩翠",
      toast: "密庭 · 翠灯是错的",
      need: "PCGV",
      show: 3.6,
      time: 28,
      drift: 0,
      map: [
        ".V.M.",
        "##.#.",
        "P...G",
        "#.#.#",
        ".C.@."
      ]
    },
    {
      name: "同辉",
      sub: "TWIN",
      hint: "青会亮两次 · 先近再远",
      toast: "两盏青 · 近的那盏先踩",
      need: "CPCG",
      show: 3.4,
      time: 26,
      drift: 0,
      map: [
        "G.C",
        "##.",
        ".P.",
        "C..",
        ".@."
      ]
    },
    {
      name: "流灯",
      sub: "DRIFT",
      hint: "灯会换位 · 追颜色不追位置",
      toast: "灯在走 · 看色",
      need: "CPGVM",
      show: 4.0,
      time: 30,
      drift: 2.7,
      map: [
        "M.V.",
        ".##.",
        "C.PG",
        ".@.."
      ]
    },
    {
      name: "盲门",
      sub: "BLIND",
      hint: "纹只闪一下 · 凭记忆踩",
      toast: "几乎看不见纹了",
      need: "CPGVM",
      show: 1.35,
      time: 26,
      drift: 0,
      map: [
        ".V.M.",
        "#.#.#",
        "C...G",
        "#.#..",
        ".P.@."
      ]
    },
    {
      name: "夜启",
      sub: "OPEN",
      hint: "六纹 · 灯会换，纹会灭",
      toast: "最后一扇 · 夜启",
      need: "CPGVMR",
      show: 1.7,
      time: 32,
      drift: 3.1,
      map: [
        "R.V.M",
        "#.#.#",
        "C..P.",
        ".#.#.",
        ".@.G."
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
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const stageLabel = document.getElementById("stage-label");
  const runeBar = document.getElementById("rune-bar");
  const runeNum = document.getElementById("rune-num");
  const timeBar = document.getElementById("time-bar");
  const timeWrap = document.getElementById("time-wrap");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let hidden = false;

  const L = {
    gx: 0,
    gy: 0,
    cell: 48,
    cols: 3,
    rows: 3,
    doorX: 0,
    doorY: 0,
    doorW: 280,
    doorH: 180,
    runeY: 0
  };

  const G = {
    mode: "title",
    stage: 0,
    lives: LIVES,
    filled: 0,
    need: [],
    tiles: [],
    cols: 3,
    rows: 3,
    pc: 0,
    pr: 0,
    fromC: 0,
    fromR: 0,
    moving: 0,
    face: "up",
    lock: 0,
    hold: 0,
    shake: 0,
    flash: 0,
    flashCol: PINK,
    toastT: 0,
    open: 0,
    sing: 0,
    showT: 0,
    clock: 0,
    endT: 0,
    taught: false,
    driftT: 0,
    queue: [],
    keyHold: 0,
    lastDir: "up",
    bob: 0
  };

  const motes = [];
  const particles = [];
  const sparks = [];
  const ripples = [];
  const ribbons = [];
  const floats = [];
  const stars = [];
  const keys = Object.create(null);

  const pointer = {
    down: false,
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    id: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function hexRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function rgba(h, a) {
    const c = typeof h === "string" ? hexRgb(h) : h;
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function isLantern(t) {
    return t && t.type !== "." && t.type !== "#" && !t.spent;
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide, when) {
      if (!this.ctx || this.muted) return;
      const t = when != null ? when : this.ctx.currentTime;
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
      o.stop(t + dur + 0.04);
    },
    noise(dur, vol, freq, when) {
      if (!this.ctx || this.muted) return;
      const t = when != null ? when : this.ctx.currentTime;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq || 1800;
      f.Q.value = 0.85;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.03);
    },
    sing(col, i) {
      this.ensure();
      const p = PAL[col];
      const n = p ? p.note : 440;
      this.beep(n, 0.22, "sine", 0.055, n * 1.5);
      this.beep(n * 0.5, 0.28, "triangle", 0.03, n * 0.8);
      this.beep(110 + i * 12, 0.18, "sine", 0.02, 80);
    },
    step() {
      this.ensure();
      this.noise(0.04, 0.018, 900);
      this.beep(180, 0.05, "sine", 0.018, 90);
    },
    playCol(col) {
      this.ensure();
      const p = PAL[col];
      const n = p ? p.note : 440;
      this.beep(n, 0.18, "sine", 0.07, n * 2);
      this.beep(n * 0.5, 0.22, "triangle", 0.04, n);
      this.noise(0.05, 0.04, 1800);
    },
    miss() {
      this.ensure();
      this.beep(170, 0.32, "sawtooth", 0.08, 52);
      this.noise(0.16, 0.065, 480);
    },
    empty() {
      this.ensure();
      this.noise(0.04, 0.022, 1100);
      this.beep(220, 0.06, "square", 0.016, 80);
    },
    clear() {
      this.ensure();
      this.beep(196, 0.22, "sine", 0.06, 392);
      this.beep(392, 0.28, "triangle", 0.05, 784);
      this.beep(784, 0.4, "sine", 0.04, 1176);
      this.noise(0.2, 0.04, 420);
    },
    win() {
      this.ensure();
      this.beep(392, 0.16, "triangle", 0.08, 784);
      this.beep(523, 0.28, "sine", 0.06, 1046);
      this.beep(784, 0.5, "sine", 0.05, 1568);
      this.beep(220, 0.6, "sine", 0.04, 440);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.5, "sawtooth", 0.09, 48);
      this.beep(82, 0.7, "square", 0.05, 36);
    },
    start() {
      this.ensure();
      this.beep(110, 0.16, "sine", 0.07, 220);
      this.beep(330, 0.22, "triangle", 0.04, 660);
    },
    tickDrone() {
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
      const playing = G.mode === "play" || G.mode === "clear";
      const heat = G.need.length ? G.filled / G.need.length : 0;
      this.drone.frequency.setTargetAtTime(46 + heat * 28, t, 0.14);
      this.droneGain.gain.setTargetAtTime(
        playing ? 0.012 + heat * 0.028 : 0.0001,
        t,
        0.16
      );
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 56; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.35 + 0.05,
        p: Math.random() * TAU,
        s: Math.random() * 0.014 + 0.003,
        mag: i % 3 === 0
      });
    }
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 36; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.42,
        r: Math.random() * 1.1 + 0.3,
        a: Math.random() * 0.55 + 0.2,
        p: Math.random() * TAU
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || CYAN
      });
    }
  }

  function spark(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      if (sparks.length > 90) sparks.shift();
      const a = rand(0, TAU);
      const sp = rand(40, 220);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.16, 0.5),
        col: col
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 14) ripples.shift();
    ripples.push({ x: x, y: y, t: 1, col: col, max: max || 40 });
  }

  function floatAt(x, y, text, col) {
    if (floats.length > 10) floats.shift();
    floats.push({ x: x, y: y, text: text, col: col, t: 1 });
  }

  function ribbon(x0, y0, x1, y1, col) {
    if (ribbons.length > 8) ribbons.shift();
    ribbons.push({ x0: x0, y0: y0, x1: x1, y1: y1, t: 0, col: col, dur: 0.38 });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("gold", kind === "gold");
    toastEl.classList.remove("hidden");
    G.toastT = 2.15;
  }

  function tile(c, r) {
    if (r < 0 || c < 0 || r >= G.rows || c >= G.cols) return null;
    return G.tiles[r][c];
  }

  function inBounds(c, r) {
    return c >= 0 && r >= 0 && c < G.cols && r < G.rows;
  }

  function walkable(c, r, destC, destR) {
    const t = tile(c, r);
    if (!t || t.type === "#") return false;
    if (isLantern(t) && !(c === destC && r === destR)) return false;
    return true;
  }

  function cellCenter(c, r) {
    return {
      x: L.gx + (c + 0.5) * L.cell,
      y: L.gy + (r + 0.5) * L.cell
    };
  }

  function runePos(i) {
    const n = Math.max(1, G.need.length);
    const span = L.doorW * 0.62;
    const x0 = L.doorX + L.doorW * 0.19;
    return {
      x: x0 + (n === 1 ? span * 0.5 : (i / (n - 1)) * span),
      y: L.runeY
    };
  }

  function playerDrawPos() {
    const t = ease(1 - G.moving);
    const c = lerp(G.fromC, G.pc, t);
    const r = lerp(G.fromR, G.pr, t);
    return cellCenter(c, r);
  }

  function parseStage(st) {
    const map = st.map;
    const rows = map.length;
    const cols = map[0].length;
    const tiles = [];
    let pc = 0;
    let pr = 0;
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const ch = map[r][c];
        if (ch === "@") {
          pc = c;
          pr = r;
          row.push({ type: ".", spent: false, ox: c, oy: r, anim: 0 });
        } else if (ch === "#") {
          row.push({ type: "#", spent: false, ox: c, oy: r, anim: 0 });
        } else {
          row.push({ type: ch, spent: false, ox: c, oy: r, anim: 0 });
        }
      }
      tiles.push(row);
    }
    return { cols: cols, rows: rows, tiles: tiles, pc: pc, pr: pr };
  }

  function loadStage(i) {
    const st = STAGES[i];
    const parsed = parseStage(st);
    G.stage = i;
    G.tiles = parsed.tiles;
    G.cols = parsed.cols;
    G.rows = parsed.rows;
    G.pc = parsed.pc;
    G.pr = parsed.pr;
    G.fromC = parsed.pc;
    G.fromR = parsed.pr;
    G.moving = 0;
    G.filled = 0;
    G.need = st.need.split("");
    G.queue.length = 0;
    G.sing = 0.42 + G.need.length * 0.36;
    G.showT = 0;
    G.clock = 0;
    G.driftT = 0;
    G.open = 0;
    G.lock = 0.08;
    G.hold = 0.12;
    G.face = "up";
    G.lastDir = "up";
    resize();
    toast(st.toast, i === STAGES.length - 1 ? "gold" : st.show && st.show < 5 ? "warn" : null);
    syncHud();
  }

  function findPath(c0, r0, c1, r1) {
    if (c0 === c1 && r0 === r1) return [];
    if (!inBounds(c1, r1)) return null;
    const dest = tile(c1, r1);
    if (!dest || dest.type === "#") return null;
    const q = [[c0, r0]];
    const prev = Object.create(null);
    const seen = Object.create(null);
    seen[c0 + "," + r0] = 1;
    let qi = 0;
    while (qi < q.length) {
      const cur = q[qi++];
      const c = cur[0];
      const r = cur[1];
      if (c === c1 && r === r1) {
        const path = [];
        let k = c + "," + r;
        while (k !== c0 + "," + r0) {
          const p = prev[k];
          path.push({ c: p[2], r: p[3] });
          k = p[0] + "," + p[1];
        }
        path.reverse();
        return path;
      }
      for (let i = 0; i < 4; i++) {
        const d = DIRS[DIR_LIST[i]];
        const nc = c + d.c;
        const nr = r + d.r;
        const kk = nc + "," + nr;
        if (seen[kk]) continue;
        if (!walkable(nc, nr, c1, r1)) continue;
        seen[kk] = 1;
        prev[kk] = [c, r, nc, nr];
        q.push([nc, nr]);
      }
    }
    return null;
  }

  function tryStep(dc, dr) {
    if (G.mode !== "play") return false;
    if (G.sing > 0) return false;
    if (G.lock > 0) return false;
    const nc = G.pc + dc;
    const nr = G.pr + dr;
    const t = tile(nc, nr);
    if (!t || t.type === "#") {
      audio.empty();
      return false;
    }
    if (dc < 0) G.face = "left";
    else if (dc > 0) G.face = "right";
    else if (dr < 0) G.face = "up";
    else G.face = "down";
    G.lastDir = G.face;
    if (G.moving > 0) {
      if (G.queue.length < 1) G.queue.push({ c: nc, r: nr });
      return true;
    }
    beginMove(nc, nr);
    return true;
  }

  function beginMove(nc, nr) {
    G.fromC = G.pc;
    G.fromR = G.pr;
    G.pc = nc;
    G.pr = nr;
    G.moving = 1;
    audio.step();
  }

  function arrive() {
    const t = tile(G.pc, G.pr);
    if (!isLantern(t)) return;
    const col = t.type;
    const want = G.need[G.filled];
    const pos = cellCenter(G.pc, G.pr);
    t.spent = true;
    if (col === want) {
      const rp = runePos(G.filled);
      G.filled += 1;
      audio.playCol(col);
      emit(14, {
        x: pos.x,
        y: pos.y,
        j: 8,
        vx0: -90,
        vx1: 90,
        vy0: -180,
        vy1: -20,
        life: 0.55,
        r0: 1.2,
        r1: 3.4,
        col: PAL[col].hex
      });
      spark(pos.x, pos.y, 10, PAL[col].hex);
      ripple(pos.x, pos.y, PAL[col].hex, L.cell * 0.7);
      ribbon(pos.x, pos.y, rp.x, rp.y, PAL[col].hex);
      floatAt(pos.x, pos.y - 16, PAL[col].name, PAL[col].hex);
      G.flash = 0.18;
      G.flashCol = PAL[col].hex;
      if (!G.taught) {
        G.taught = true;
        toast("纹对上了 · 下一盏", null);
      }
      syncHud();
      if (G.filled >= G.need.length) startClear();
    } else {
      miss("错灯", pos, col);
    }
  }

  function miss(kind, pos, col) {
    G.lives -= 1;
    G.flash = 0.46;
    G.flashCol = PINK;
    G.shake = 10;
    G.queue.length = 0;
    audio.miss();
    const p = pos || playerDrawPos();
    emit(16, {
      x: p.x,
      y: p.y,
      j: 10,
      vx0: -140,
      vx1: 140,
      vy0: -160,
      vy1: 80,
      life: 0.5,
      r0: 1.2,
      r1: 3.2,
      col: PINK
    });
    spark(p.x, p.y, 12, PINK);
    const pal = col && PAL[col] ? PAL[col].name : "";
    floatAt(p.x, p.y - 12, kind === "时限" ? "迟了" : pal ? pal + "错了" : "错纹", PINK);
    toast(
      kind === "时限" ? "夜深了 · 门关上" :
        kind === "错灯" ? "这盏不是下一纹" : "纹没对上",
      "warn"
    );
    syncHud();
    if (G.lives <= 0) startLose();
    else startDie();
  }

  function startDie() {
    G.mode = "die";
    G.endT = DIE_T;
    G.queue.length = 0;
  }

  function startClear() {
    G.mode = "clear";
    G.endT = CLEAR_T;
    G.open = 0;
    G.queue.length = 0;
    audio.clear();
    const mid = { x: L.doorX + L.doorW * 0.5, y: L.doorY + L.doorH * 0.55 };
    emit(22, {
      x: mid.x,
      y: mid.y,
      j: 16,
      vx0: -120,
      vx1: 120,
      vy0: -80,
      vy1: 80,
      life: 0.7,
      r0: 1.4,
      r1: 4,
      col: GOLD
    });
    spark(mid.x, mid.y, 18, GOLD);
    toast(G.stage === STAGES.length - 1 ? "夜门尽开" : "门开了", "gold");
  }

  function startLose() {
    G.mode = "lose";
    G.endT = 0.55;
    audio.lose();
  }

  function startWin() {
    G.mode = "win";
    G.endT = 0.45;
    audio.win();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "OPEN";
      ovTitle.textContent = "夜开";
      ovLead.innerHTML = "十扇纹都对上了。<br />夜门在身后轻轻合上。";
      ovOps.textContent = "空格 / 回车再走一遍";
      ovBtn.textContent = "再入夜";
    } else if (kind === "lose") {
      panel.classList.add("lose");
      ovKicker.textContent = "SEALED";
      ovTitle.textContent = "门拒";
      ovLead.innerHTML = "纹没对上，夜门不肯开。<br />主题色还在庭里等你。";
      ovOps.textContent = "空格 / 回车再来一局";
      ovBtn.textContent = "再入夜";
    } else {
      ovKicker.textContent = "GATE";
      ovTitle.textContent = "夜门";
      ovLead.innerHTML = "门楣先把主题色唱一遍。<br />到庭里按同样次序踩灯，纹对上，夜门才开。";
      ovOps.textContent = coarse
        ? "点格子或用方向键走 · M 静音"
        : "方向键 / WASD 走 · 点格子 · M 静音";
      ovBtn.textContent = "入夜";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startPlay() {
    audio.start();
    hideOverlay();
    G.mode = "play";
    G.lives = LIVES;
    G.taught = false;
    G.shake = 0;
    G.flash = 0;
    loadStage(0);
  }

  function restartRun() {
    if (G.mode === "title") {
      startPlay();
      return;
    }
    hideOverlay();
    G.mode = "play";
    G.lives = LIVES;
    G.taught = G.taught;
    loadStage(0);
    toast("重开 · 第一扇", null);
  }

  function syncHud() {
    if (G.mode === "title") {
      stageLabel.textContent = "十扇夜门";
      stageLabel.classList.remove("hot");
      runeNum.textContent = "—";
      runeBar.style.width = "0%";
      timeWrap.classList.add("hidden");
      hintEl.textContent = coarse
        ? "门上亮什么色，就去踩什么灯"
        : "门上亮什么色，就去踩什么灯 · 方向键走";
      hintEl.classList.remove("hot", "warn");
    } else {
      const st = STAGES[G.stage];
      stageLabel.textContent = st.name + " · " + st.sub;
      stageLabel.classList.toggle("hot", G.stage >= STAGES.length - 1);
      runeNum.textContent = G.filled + "/" + G.need.length;
      runeBar.style.width = (100 * G.filled / Math.max(1, G.need.length)) + "%";
      if (st.time > 0 && (G.mode === "play" || G.mode === "die")) {
        timeWrap.classList.remove("hidden");
        const left = clamp(1 - G.clock / st.time, 0, 1);
        timeBar.style.width = (left * 100) + "%";
        timeWrap.classList.toggle("warn", left < 0.28);
      } else {
        timeWrap.classList.add("hidden");
      }
      hintEl.textContent = st.hint;
      hintEl.classList.toggle("warn", !!(st.show && st.show < 5) || st.drift > 0);
      hintEl.classList.toggle("hot", G.stage >= STAGES.length - 1);
    }
    pipsEl.innerHTML = "";
    const show = G.mode === "title" ? 0 : LIVES;
    for (let i = 0; i < show; i++) {
      const pip = document.createElement("span");
      pip.className = "pip" + (i < G.lives ? " on" : "") + (G.lives <= 1 && i < G.lives ? " warn" : "");
      pipsEl.appendChild(pip);
    }
  }

  function ghostAlpha() {
    const st = STAGES[G.stage];
    if (!st.show) return 1;
    if (G.sing > 0) return 1;
    if (G.showT < st.show) return 1;
    return clamp(1 - (G.showT - st.show) / 0.7, 0, 1);
  }

  function revealedCount() {
    if (G.sing <= 0) return G.need.length;
    const total = 0.42 + G.need.length * 0.36;
    const elapsed = total - G.sing;
    return clamp(Math.floor((elapsed - 0.28) / 0.36) + 1, 0, G.need.length);
  }

  function doDrift() {
    const st = STAGES[G.stage];
    if (!st.drift || G.mode !== "play" || G.sing > 0) return;
    const cells = [];
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        if (c === G.pc && r === G.pr) continue;
        const t = G.tiles[r][c];
        if (!isLantern(t)) continue;
        cells.push({ c: c, r: r });
      }
    }
    if (cells.length < 2) return;
    let a = cells[(Math.random() * cells.length) | 0];
    let b = cells[(Math.random() * cells.length) | 0];
    let guard = 0;
    while ((a.c === b.c && a.r === b.r) && guard++ < 8) {
      b = cells[(Math.random() * cells.length) | 0];
    }
    if (a.c === b.c && a.r === b.r) return;
    const ta = G.tiles[a.r][a.c];
    const tb = G.tiles[b.r][b.c];
    const tmpType = ta.type;
    const tmpSpent = ta.spent;
    ta.type = tb.type;
    ta.spent = tb.spent;
    ta.ox = b.c;
    ta.oy = b.r;
    ta.anim = 1;
    tb.type = tmpType;
    tb.spent = tmpSpent;
    tb.ox = a.c;
    tb.oy = a.r;
    tb.anim = 1;
  }

  function cellAt(x, y) {
    const c = Math.floor((x - L.gx) / L.cell);
    const r = Math.floor((y - L.gy) / L.cell);
    if (!inBounds(c, r)) return null;
    return { c: c, r: r };
  }

  function tapCell(c, r) {
    if (G.mode !== "play" || G.sing > 0) return;
    if (c === G.pc && r === G.pr) return;
    const dc = Math.abs(c - G.pc);
    const dr = Math.abs(r - G.pr);
    if (dc + dr === 1) {
      tryStep(c - G.pc, r - G.pr);
      return;
    }
    const path = findPath(G.pc, G.pr, c, r);
    if (!path || !path.length) {
      audio.empty();
      return;
    }
    G.queue.length = 0;
    for (let i = 0; i < path.length; i++) G.queue.push(path[i]);
    if (G.moving <= 0 && G.queue.length) {
      const n = G.queue.shift();
      if (n.c < G.pc) G.face = "left";
      else if (n.c > G.pc) G.face = "right";
      else if (n.r < G.pr) G.face = "up";
      else G.face = "down";
      beginMove(n.c, n.r);
    }
  }

  function heldDir() {
    if (keys.ArrowLeft || keys.a || keys.A) return "left";
    if (keys.ArrowRight || keys.d || keys.D) return "right";
    if (keys.ArrowUp || keys.w || keys.W) return "up";
    if (keys.ArrowDown || keys.s || keys.S) return "down";
    return null;
  }

  function dirStep(name) {
    const d = DIRS[name];
    if (!d) return;
    tryStep(d.c, d.r);
  }

  function confirmOverlay() {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startPlay();
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

    const pad = coarse ? 96 : 18;
    const cols = G.cols || 3;
    const rows = G.rows || 3;
    const doorShare = H < 520 ? 0.34 : 0.38;
    L.doorH = clamp(H * doorShare, 132, 250);
    const gridH = Math.max(80, H - L.doorH - pad);
    L.cell = clamp(Math.min((W * 0.86) / cols, (gridH * 0.92) / rows), 34, 78);
    L.cols = cols;
    L.rows = rows;
    L.gx = (W - L.cell * cols) * 0.5;
    L.gy = L.doorH + (gridH - L.cell * rows) * 0.42;
    L.doorW = clamp(Math.min(W * 0.84, L.cell * cols + 90), 220, 460);
    L.doorX = (W - L.doorW) * 0.5;
    L.doorY = clamp(L.doorH * 0.06, 8, 22);
    L.runeY = L.doorY + L.doorH * 0.2;
  }

  function drawGlyph(x, y, r, kind, col, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = Math.max(1.2, r * 0.18);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    if (kind === "dia") {
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.72, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.72, 0);
      ctx.closePath();
      ctx.stroke();
    } else if (kind === "pet") {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + Math.PI / 4;
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.cos(a) * r * 1.15,
          Math.sin(a) * r * 1.15,
          Math.cos(a + 0.7) * r * 0.2,
          Math.sin(a + 0.7) * r * 0.2
        );
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, TAU);
      ctx.fill();
    } else if (kind === "star") {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * TAU) / 5;
        const x1 = Math.cos(a) * r;
        const y1 = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        const b = a + TAU / 10;
        ctx.lineTo(Math.cos(b) * r * 0.42, Math.sin(b) * r * 0.42);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (kind === "tri") {
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.9, r * 0.72);
      ctx.lineTo(-r * 0.9, r * 0.72);
      ctx.closePath();
      ctx.stroke();
    } else if (kind === "hex") {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + Math.PI / 6;
        const x1 = Math.cos(a) * r;
        const y1 = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.arc(r * 0.12, 0, r * 0.78, 0.55, TAU - 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.18, 0, r * 0.48, -0.9, 0.9);
      ctx.stroke();
    }
    ctx.restore();
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
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#070318");
    g.addColorStop(0.42, "#05030c");
    g.addColorStop(1, "#0a0614");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.bob * 1.4 + s.p);
      ctx.fillStyle = rgba("#e8f4ff", s.a * tw);
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * L.doorH * 1.15, s.r, 0, TAU);
      ctx.fill();
    }

    const moonX = W * 0.78;
    const moonY = L.doorH * 0.22;
    ctx.fillStyle = "rgba(255,227,107,0.08)";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffe9a8";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#05030c";
    ctx.beginPath();
    ctx.arc(moonX + 3.2, moonY - 1.4, 7.2, 0, TAU);
    ctx.fill();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = (m.x * W + Math.sin(G.bob * m.s * 40 + m.p) * 10) % W;
      const y = (m.y * H + Math.cos(G.bob * m.s * 28 + m.p) * 8) % H;
      ctx.fillStyle = rgba(m.mag ? PINK : CYAN, m.a);
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawGate() {
    const x = L.doorX;
    const y = L.doorY;
    const w = L.doorW;
    const h = L.doorH * 0.92;
    const open = ease(G.open);

    ctx.save();
    if (G.shake > 0) {
      ctx.translate((hash(G.bob * 40) - 0.5) * G.shake, (hash(G.bob * 51) - 0.5) * G.shake * 0.6);
    }

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.98, w * 0.48, 10, 0, 0, TAU);
    ctx.fill();

    const pillarW = w * 0.07;
    ctx.fillStyle = "#12081c";
    ctx.strokeStyle = rgba(CYAN, 0.35);
    ctx.lineWidth = 1.2;
    roundRect(x, y + h * 0.12, pillarW, h * 0.86, 3);
    ctx.fill();
    ctx.stroke();
    roundRect(x + w - pillarW, y + h * 0.12, pillarW, h * 0.86, 3);
    ctx.fill();
    ctx.stroke();

    const lintelH = h * 0.18;
    const lg = ctx.createLinearGradient(x, y, x, y + lintelH + 8);
    lg.addColorStop(0, "#1a0d28");
    lg.addColorStop(1, "#0c0616");
    ctx.fillStyle = lg;
    roundRect(x - 6, y, w + 12, lintelH + 6, 5);
    ctx.fill();
    ctx.strokeStyle = rgba(CYAN, 0.55);
    ctx.stroke();
    ctx.strokeStyle = rgba(PINK, 0.4);
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 4);
    ctx.lineTo(x + w - 10, y + 4);
    ctx.stroke();

    const roofY = y - 6;
    ctx.fillStyle = "#0a0614";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, roofY - h * 0.12);
    ctx.lineTo(x + w + 16, roofY + 10);
    ctx.lineTo(x - 16, roofY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(PINK, 0.45);
    ctx.stroke();

    const innerX = x + pillarW + 4;
    const innerW = w - pillarW * 2 - 8;
    const innerY = y + lintelH + 4;
    const innerH = h * 0.72;
    const leafW = innerW * 0.5 - 1;

    if (open > 0.02) {
      const glow = ctx.createRadialGradient(
        x + w * 0.5, innerY + innerH * 0.4, 8,
        x + w * 0.5, innerY + innerH * 0.4, innerW * 0.7
      );
      glow.addColorStop(0, rgba(GOLD, 0.55 * open));
      glow.addColorStop(0.4, rgba(CYAN, 0.18 * open));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(innerX - 8, innerY - 8, innerW + 16, innerH + 16);
    }

    function drawLeaf(left) {
      const hinge = left ? innerX : innerX + innerW;
      const dir = left ? 1 : -1;
      const ang = open * 1.15;
      const front = Math.cos(ang);
      const depth = Math.sin(ang) * 16;
      ctx.save();
      ctx.beginPath();
      const x0 = hinge;
      const x1 = hinge + dir * leafW * Math.max(0.08, front);
      ctx.moveTo(x0, innerY);
      ctx.lineTo(x1, innerY + depth * 0.15);
      ctx.lineTo(x1, innerY + innerH - depth * 0.1);
      ctx.lineTo(x0, innerY + innerH);
      ctx.closePath();
      const fill = ctx.createLinearGradient(x0, innerY, x1, innerY);
      fill.addColorStop(0, left ? "#160a22" : "#12081c");
      fill.addColorStop(1, left ? "#0c0614" : "#180a24");
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = rgba(CYAN, 0.28 + open * 0.2);
      ctx.stroke();

      ctx.save();
      ctx.clip();
      ctx.strokeStyle = rgba(PINK, 0.22);
      ctx.lineWidth = 1;
      const bands = 4;
      for (let i = 1; i < bands; i++) {
        const yy = innerY + (innerH * i) / bands;
        ctx.beginPath();
        ctx.moveTo(x0 + dir * 8, yy);
        ctx.lineTo(x1 - dir * 8, yy + depth * 0.08);
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(CYAN, 0.18);
      ctx.beginPath();
      ctx.moveTo((x0 + x1) * 0.5, innerY + 12);
      ctx.lineTo((x0 + x1) * 0.5, innerY + innerH - 12);
      ctx.stroke();
      ctx.restore();

      const lockY = innerY + innerH * 0.48;
      ctx.fillStyle = rgba(GOLD, 0.55);
      ctx.beginPath();
      ctx.arc(hinge + dir * leafW * Math.max(0.08, front) * 0.92, lockY, 3.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawLeaf(true);
    drawLeaf(false);

    if (open < 0.15) {
      ctx.strokeStyle = rgba(GOLD, 0.35);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, innerY + innerH * 0.48, 7, 0, TAU);
      ctx.stroke();
    }

    const ga = ghostAlpha();
    const revealed = revealedCount();
    for (let i = 0; i < G.need.length; i++) {
      const rp = runePos(i);
      const col = G.need[i];
      const pal = PAL[col];
      const filled = i < G.filled;
      const shown = i < revealed;
      const a = filled ? 1 : shown ? ga : 0;
      ctx.beginPath();
      ctx.fillStyle = "rgba(6,4,14,0.85)";
      ctx.strokeStyle = rgba(filled ? pal.hex : "#8b90b8", filled ? 0.9 : 0.25 + a * 0.45);
      ctx.lineWidth = 1.3;
      ctx.arc(rp.x, rp.y, 11, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (a > 0.04) {
        if (filled) {
          ctx.fillStyle = rgba(pal.hex, 0.22);
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, 11, 0, TAU);
          ctx.fill();
        }
        drawGlyph(rp.x, rp.y, 6.2, pal.glyph, pal.hex, a);
        if (filled || (shown && ga > 0.5)) {
          ctx.fillStyle = rgba(pal.hex, 0.35 * a);
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, 14 + Math.sin(G.bob * 3 + i) * 1.2, 0, TAU);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, 1.4, 0, TAU);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawCourt() {
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        const t = G.tiles[r][c];
        const x = L.gx + c * L.cell;
        const y = L.gy + r * L.cell;
        const pad = L.cell * 0.06;
        const hsh = hash(c * 13.2 + r * 7.1 + G.stage * 3);
        if (t.type === "#") {
          ctx.fillStyle = "#0b0814";
          roundRect(x + pad, y + pad, L.cell - pad * 2, L.cell - pad * 2, 6);
          ctx.fill();
          ctx.strokeStyle = "rgba(90,70,120,0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,61,184,0.12)";
          ctx.beginPath();
          ctx.moveTo(x + pad * 2, y + L.cell * 0.35);
          ctx.lineTo(x + L.cell - pad * 2, y + L.cell * 0.62);
          ctx.stroke();
          continue;
        }
        ctx.fillStyle = hsh > 0.55 ? "#14101f" : "#120e1c";
        roundRect(x + pad, y + pad, L.cell - pad * 2, L.cell - pad * 2, 7);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,240,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        if (c === G.pc && r === G.pr && G.mode === "play") {
          ctx.strokeStyle = rgba(CYAN, 0.22);
          ctx.stroke();
        }
      }
    }

    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        const t = G.tiles[r][c];
        if (!isLantern(t) && !(t.type !== "." && t.type !== "#" && t.spent)) continue;
        const pal = PAL[t.type];
        if (!pal) continue;
        let vx = c;
        let vy = r;
        if (t.anim > 0) {
          const k = ease(1 - t.anim);
          vx = lerp(t.ox, c, k);
          vy = lerp(t.oy, r, k);
        }
        const p = cellCenter(vx, vy);
        const spent = t.spent;
        const glow = 0.35 + 0.25 * Math.sin(G.bob * 3.2 + c + r);
        if (!spent) {
          ctx.fillStyle = rgba(pal.hex, 0.16 + glow * 0.12);
          ctx.beginPath();
          ctx.arc(p.x, p.y, L.cell * 0.34, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = spent ? "#1a1524" : "#1c1028";
        ctx.strokeStyle = rgba(pal.hex, spent ? 0.18 : 0.7);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + L.cell * 0.02, L.cell * 0.22, L.cell * 0.26, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + L.cell * 0.2);
        ctx.lineTo(p.x, p.y + L.cell * 0.32);
        ctx.strokeStyle = rgba("#8b90b8", 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (!spent) drawGlyph(p.x, p.y, L.cell * 0.2, pal.glyph, pal.hex, 1);
        else {
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.6, 0, TAU);
          ctx.fill();
        }
      }
    }
  }

  function drawPlayer() {
    const p = playerDrawPos();
    const bob = Math.sin(G.bob * 5.2) * 2.2;
    const facing = G.face;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, L.cell * 0.28, L.cell * 0.16, 4.5, 0, 0, TAU);
    ctx.fill();

    const robe = ctx.createLinearGradient(0, -L.cell * 0.22, 0, L.cell * 0.22);
    robe.addColorStop(0, "#2a1840");
    robe.addColorStop(1, "#0c0814");
    ctx.fillStyle = robe;
    ctx.beginPath();
    ctx.moveTo(-L.cell * 0.13, -L.cell * 0.02);
    ctx.lineTo(L.cell * 0.13, -L.cell * 0.02);
    ctx.lineTo(L.cell * 0.17, L.cell * 0.24);
    ctx.lineTo(-L.cell * 0.17, L.cell * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(CYAN, 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#f0e6ff";
    ctx.beginPath();
    ctx.arc(0, -L.cell * 0.12, L.cell * 0.09, 0, TAU);
    ctx.fill();

    const held = G.filled > 0 ? PAL[G.need[G.filled - 1]] : null;
    const hx = facing === "left" ? -L.cell * 0.18 : facing === "right" ? L.cell * 0.18 : L.cell * 0.14;
    const hy = -L.cell * 0.08;
    const hcol = held ? held.hex : "#e8f4ff";
    ctx.fillStyle = rgba(hcol, 0.55);
    ctx.beginPath();
    ctx.arc(hx, hy, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hcol;
    ctx.beginPath();
    ctx.arc(hx, hy, 3.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFx(dt) {
    for (let i = ribbons.length - 1; i >= 0; i--) {
      const rb = ribbons[i];
      rb.t += dt / rb.dur;
      if (rb.t >= 1) {
        ribbons.splice(i, 1);
        continue;
      }
      const t = ease(rb.t);
      const mx = (rb.x0 + rb.x1) * 0.5;
      const my = (rb.y0 + rb.y1) * 0.5 - 40;
      const x = (1 - t) * (1 - t) * rb.x0 + 2 * (1 - t) * t * mx + t * t * rb.x1;
      const y = (1 - t) * (1 - t) * rb.y0 + 2 * (1 - t) * t * my + t * t * rb.y1;
      ctx.fillStyle = rgba(rb.col, 1 - t);
      ctx.beginPath();
      ctx.arc(x, y, 4.2 * (1 - t * 0.4), 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 6, y + 4, 2, 0, TAU);
      ctx.fill();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = rgba(p.col, p.life / p.max);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (p.life / p.max), 0, TAU);
      ctx.fill();
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = rgba(s.col, clamp(s.life * 3, 0, 1));
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03);
      ctx.stroke();
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.6;
      if (r.t <= 0) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = rgba(r.col, r.t * 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, (1 - r.t) * r.max, 0, TAU);
      ctx.stroke();
    }

    ctx.font = "11px " + FONT;
    ctx.textAlign = "center";
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt * 0.85;
      f.y -= 22 * dt;
      if (f.t <= 0) {
        floats.splice(i, 1);
        continue;
      }
      ctx.fillStyle = rgba(f.col, f.t);
      ctx.fillText(f.text, f.x, f.y);
    }

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashCol, G.flash * 0.18);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawTitleIdle() {
    G.need = ["C", "G", "P"];
    G.filled = 1;
    G.cols = 3;
    G.rows = 3;
    G.tiles = [
      [{ type: "C", spent: false, ox: 0, oy: 0, anim: 0 }, { type: ".", spent: false, ox: 1, oy: 0, anim: 0 }, { type: "P", spent: false, ox: 2, oy: 0, anim: 0 }],
      [{ type: ".", spent: false, ox: 0, oy: 1, anim: 0 }, { type: "G", spent: false, ox: 1, oy: 1, anim: 0 }, { type: ".", spent: false, ox: 2, oy: 1, anim: 0 }],
      [{ type: ".", spent: false, ox: 0, oy: 2, anim: 0 }, { type: ".", spent: false, ox: 1, oy: 2, anim: 0 }, { type: ".", spent: false, ox: 2, oy: 2, anim: 0 }]
    ];
    G.pc = 1;
    G.pr = 2;
    G.fromC = 1;
    G.fromR = 2;
    G.moving = 0;
    resize();
  }

  function update(dt) {
    G.bob += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.lock > 0) G.lock -= dt;
    if (G.hold > 0) G.hold -= dt;

    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        const t = G.tiles[r] && G.tiles[r][c];
        if (t && t.anim > 0) t.anim = Math.max(0, t.anim - dt / 0.42);
      }
    }

    if (G.mode === "title") {
      audio.tickDrone();
      return;
    }

    if (G.mode === "clear") {
      G.open = clamp(G.open + dt / 0.55, 0, 1);
      G.endT -= dt;
      if (G.endT <= 0) {
        if (G.stage + 1 >= STAGES.length) {
          startWin();
          showOverlay("win");
        } else {
          G.mode = "play";
          loadStage(G.stage + 1);
        }
      }
      audio.tickDrone();
      return;
    }

    if (G.mode === "die") {
      G.endT -= dt;
      if (G.endT <= 0) {
        G.mode = "play";
        loadStage(G.stage);
      }
      audio.tickDrone();
      return;
    }

    if (G.mode === "win" || G.mode === "lose") {
      if (G.mode === "win") G.open = 1;
      G.endT -= dt;
      if (G.endT <= 0 && overlay.classList.contains("hidden")) {
        showOverlay(G.mode);
      }
      audio.tickDrone();
      return;
    }

    if (G.mode !== "play") {
      audio.tickDrone();
      return;
    }

    const st = STAGES[G.stage];
    if (G.sing > 0) {
      const before = revealedCount();
      G.sing -= dt;
      if (G.sing < 0) G.sing = 0;
      const after = revealedCount();
      if (after > before && after > 0 && after <= G.need.length) {
        audio.sing(G.need[after - 1], after - 1);
      }
    } else {
      G.showT += dt;
      G.clock += dt;
      if (st.time > 0 && G.clock >= st.time) {
        miss("时限", playerDrawPos(), null);
        audio.tickDrone();
        return;
      }
      if (st.drift > 0) {
        G.driftT += dt;
        if (G.driftT >= st.drift) {
          G.driftT = 0;
          doDrift();
        }
      }
    }

    if (G.moving > 0) {
      G.moving -= dt / MOVE_T;
      if (G.moving <= 0) {
        G.moving = 0;
        G.fromC = G.pc;
        G.fromR = G.pr;
        arrive();
        if (G.mode === "play" && G.queue.length) {
          const n = G.queue.shift();
          if (n.c === G.pc && n.r === G.pr) {
            /* skip */
          } else if (Math.abs(n.c - G.pc) + Math.abs(n.r - G.pr) === 1 && tile(n.c, n.r) && tile(n.c, n.r).type !== "#") {
            if (n.c < G.pc) G.face = "left";
            else if (n.c > G.pc) G.face = "right";
            else if (n.r < G.pr) G.face = "up";
            else G.face = "down";
            beginMove(n.c, n.r);
          } else {
            G.queue.length = 0;
          }
        }
      }
    } else if (G.sing <= 0) {
      const hd = heldDir();
      if (hd) {
        G.keyHold -= dt;
        if (G.keyHold <= 0) {
          dirStep(hd);
          G.keyHold = 0.16;
        }
      } else {
        G.keyHold = 0;
      }
    }

    audio.tickDrone();
    if (st.time > 0) {
      const left = clamp(1 - G.clock / st.time, 0, 1);
      timeBar.style.width = (left * 100) + "%";
      timeWrap.classList.toggle("warn", left < 0.28);
    }
  }

  function draw(dt) {
    drawBackground();
    drawGate();
    if (G.tiles && G.tiles.length) {
      drawCourt();
      if (G.mode !== "title") drawPlayer();
    }
    drawFx(dt);

    if (G.mode === "play" && G.sing > 0.05) {
      ctx.font = "12px " + FONT;
      ctx.textAlign = "center";
      ctx.fillStyle = rgba(GOLD, 0.75);
      ctx.fillText("听门上的主题色", W * 0.5, L.gy - 10);
    }
  }

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    const raw = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!hidden) {
      acc += raw;
      while (acc >= STEP) {
        update(STEP);
        acc -= STEP;
      }
      draw(raw);
    }
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const k = e.key;
    if (down && (k === "m" || k === "M")) {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (down && (k === "r" || k === "R") && G.mode !== "title") {
      restartRun();
      e.preventDefault();
      return;
    }
    if (down && (k === " " || k === "Enter")) {
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
        confirmOverlay();
        e.preventDefault();
        return;
      }
      if (G.mode === "play" && k === " ") {
        dirStep(G.lastDir);
        e.preventDefault();
        return;
      }
    }
    if (
      k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown" ||
      k === " " || k === "a" || k === "A" || k === "d" || k === "D" ||
      k === "w" || k === "W" || k === "s" || k === "S"
    ) {
      keys[k] = down;
      if (down) {
        const map = {
          ArrowLeft: "left", a: "left", A: "left",
          ArrowRight: "right", d: "right", D: "right",
          ArrowUp: "up", w: "up", W: "up",
          ArrowDown: "down", s: "down", S: "down"
        };
        if (map[k] && G.mode === "play") {
          dirStep(map[k]);
          G.keyHold = 0.22;
        }
        e.preventDefault();
      }
    }
  }

  function ptrPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    const p = ptrPos(e);
    pointer.down = true;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.sx = p.x;
    pointer.sy = p.y;
    pointer.id = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const p = ptrPos(e);
    pointer.x = p.x;
    pointer.y = p.y;
  });

  function endPtr(e) {
    if (!pointer.down || (e.pointerId != null && e.pointerId !== pointer.id)) return;
    pointer.down = false;
    const dx = pointer.x - pointer.sx;
    const dy = pointer.y - pointer.sy;
    const dist = hypot2(dx, dy);
    if (dist > 28) {
      if (Math.abs(dx) > Math.abs(dy)) dirStep(dx > 0 ? "right" : "left");
      else dirStep(dy > 0 ? "down" : "up");
      return;
    }
    const cell = cellAt(pointer.sx, pointer.sy);
    if (cell) tapCell(cell.c, cell.r);
  }

  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);

  function bindPad(btn, dir) {
    const go = (e) => {
      e.preventDefault();
      audio.ensure();
      btn.classList.add("held");
      dirStep(dir);
    };
    const up = () => btn.classList.remove("held");
    btn.addEventListener("pointerdown", go);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
  }
  bindPad(btnUp, "up");
  bindPad(btnDown, "down");
  bindPad(btnLeft, "left");
  bindPad(btnRight, "right");

  overlay.addEventListener("click", (e) => {
    if (e.target === ovBtn) return;
    audio.ensure();
    confirmOverlay();
  });
  ovBtn.addEventListener("click", () => {
    audio.ensure();
    confirmOverlay();
  });
  btnRetry.addEventListener("click", () => {
    audio.ensure();
    restartRun();
  });
  btnMute.addEventListener("click", () => {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  makeMotes();
  makeStars();
  drawTitleIdle();
  showOverlay("title");
  syncHud();
  requestAnimationFrame(frame);
})();
