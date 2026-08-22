(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const COLS = 12;
  const TILE = 56;
  const OX = (VW - COLS * TILE) * 0.5;
  const OY = 404;
  const PLANK_H = 15;
  const ROW_MAX = 6;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-bridge-plank-mute";
  const MAG = "#ff3db8";
  const CYN = "#00f0ff";
  const GOLD = "#ffe36b";

  const OPS_KB = "方向键移板 · 空格放下 · [ ] 换板 · Z 收回 · M 静音";
  const OPS_TOUCH = "拖两端搭板 · 点库存换板 · 点「收」收回 · M 静音";

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
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function easeIn(t) {
    t = clamp(t, 0, 1);
    return t * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  const STAGES = [
    {
      name: "两岸",
      sub: "SPAN",
      hint: "木板两端都要搁在实处。对准两岸放下。",
      toast: "板要搭在两边的石台上",
      kind: "LLL....RRRRR",
      heights: [2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2],
      planks: [6],
      ghost: [2, 2]
    },
    {
      name: "中墩",
      sub: "PIER",
      hint: "一块板不够长。借中间石墩接过去。",
      toast: "两截短板，中墩是支点",
      kind: "LL..P..RRRRR",
      heights: [2, 2, 0, 0, 2, 0, 0, 2, 2, 2, 2, 2],
      planks: [4, 4]
    },
    {
      name: "平渡",
      sub: "LEVEL",
      hint: "板只搁得平。矮墩够不着两岸。",
      toast: "找同一高度的两端",
      kind: "LLL.P...RRRR",
      heights: [2, 2, 2, 0, 1, 0, 0, 0, 2, 2, 2, 2],
      planks: [7]
    },
    {
      name: "台阶",
      sub: "STAIR",
      hint: "对岸更高。先搭低的，再迈上高台。",
      toast: "灯人能迈一格高差",
      kind: "LL.PP..RRRRR",
      heights: [2, 2, 0, 2, 3, 0, 0, 3, 3, 3, 3, 3],
      planks: [3, 4]
    },
    {
      name: "余墩",
      sub: "DECOY",
      hint: "矮墩是诱饵。长板直接搁上对岸。",
      toast: "别往矮墩上搁",
      kind: "LL.P.P.P.RRR",
      heights: [3, 3, 0, 1, 0, 2, 0, 1, 0, 3, 3, 3],
      planks: [9]
    },
    {
      name: "双涧",
      sub: "TWIN",
      hint: "两道涧，三块板。先铺平，再上台阶。",
      toast: "中段两墩同高，右边再升一格",
      kind: "LL.P.PP.RRRR",
      heights: [2, 2, 0, 2, 0, 2, 3, 0, 3, 3, 3, 3],
      planks: [3, 3, 3]
    },
    {
      name: "叠梁",
      sub: "STACK",
      hint: "下板也能当支点。先搭低梁，再搁上板。",
      toast: "上板的一头要搁在下板上",
      kind: "LL...P..RRRR",
      heights: [3, 3, 0, 0, 0, 2, 0, 0, 2, 2, 2, 2],
      planks: [4, 5]
    },
    {
      name: "潮柱",
      sub: "TIDE",
      hint: "石柱在涨落。等高的时候再搭。",
      toast: "等中柱升到和两岸一样高",
      kind: "LL...P...RRR",
      heights: [2, 2, 0, 0, 0, 2, 0, 0, 0, 2, 2, 2],
      planks: [5, 5],
      move: [{ c: 5, lo: 1, hi: 2, period: 3.2, phase: 0 }]
    },
    {
      name: "层台",
      sub: "TIER",
      hint: "先铺低梁，再叠中梁，最后接上高岸。",
      toast: "从最低的涧开始搭",
      kind: "LL.P.P...RRR",
      heights: [4, 4, 0, 2, 0, 2, 0, 0, 0, 4, 4, 4],
      planks: [3, 3, 3, 5]
    },
    {
      name: "深涧",
      sub: "GORGE",
      hint: "潮柱要等它升起。先低梁，再接高岸。",
      toast: "先搭左边，再等潮柱升起来",
      kind: "LL.P.P.P.PRR",
      heights: [3, 3, 0, 2, 0, 2, 0, 3, 0, 3, 3, 3],
      planks: [3, 3, 3, 4],
      move: [{ c: 7, lo: 2, hi: 3, period: 3.6, phase: 0.2 }]
    }
  ];

  for (let i = 0; i < STAGES.length; i++) {
    const s = STAGES[i];
    if (s.kind.length !== COLS) throw new Error("kind " + s.name);
    if (s.heights.length !== COLS) throw new Error("h " + s.name);
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
  const btnMute = document.getElementById("btn-mute");
  const btnUndo = document.getElementById("btn-undo");
  const btnRetry = document.getElementById("btn-retry");
  const stageLabel = document.getElementById("stage-label");
  const leftLabel = document.getElementById("left-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const stageEl = document.getElementById("stage");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let last = 0;
  let acc = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const hold = { l: 0, r: 0, u: 0, d: 0 };
  const pointer = {
    down: false,
    x: 0,
    y: 0,
    sc: -1,
    sr: -1,
    dragged: false,
    id: null
  };

  const particles = [];
  const motes = [];
  const stars = [];
  const pipEls = [];
  const splashes = [];

  const G = {
    mode: "title",
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    lock: 0,
    shake: 0,
    flash: 0,
    flashRgb: "0,240,255",
    toastT: 0,
    kind: "",
    baseH: [],
    h: [],
    visH: [],
    moveBy: [],
    bag: [],
    sel: 0,
    boards: [],
    idSeq: 1,
    gc: 0,
    gr: 2,
    dragLen: 0,
    walk: null,
    settle: 0,
    placed: 0,
    falls: 0,
    why: "",
    hoverInv: -1,
    hoverBoard: -1
  };

  for (let i = 0; i < 72; i++) {
    stars.push({
      x: hash(i * 3.1) * VW,
      y: hash(i * 8.7 + 2) * (OY - 80),
      r: 0.5 + hash(i * 1.7) * 1.4,
      a: 0.18 + hash(i * 4.4) * 0.55,
      p: hash(i * 2.2) * TAU
    });
  }
  for (let i = 0; i < 36; i++) {
    motes.push({
      x: rand(0, VW),
      y: rand(40, OY),
      r: rand(0.6, 1.8),
      a: rand(0.04, 0.14),
      p: rand(0, TAU),
      s: rand(6, 16)
    });
  }

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
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (err) { /* ignore */ }
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
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const sr = this.ctx.sampleRate;
      const n = Math.max(1, Math.floor(sr * Math.min(dur, 0.28)));
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = hp || 700;
      const g = this.ctx.createGain();
      const t0 = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    },
    tick() {
      this.ensure();
      this.beep(680, 0.05, "square", 0.02, 420);
    },
    place() {
      this.ensure();
      this.beep(240, 0.08, "triangle", 0.05, 140);
      this.noise(0.07, 0.04, 400);
      this.beep(520, 0.09, "sine", 0.03);
    },
    creak() {
      this.ensure();
      this.beep(180, 0.18, "sawtooth", 0.03, 70);
      this.noise(0.2, 0.06, 220);
    },
    splash() {
      this.ensure();
      this.noise(0.18, 0.07, 300);
      this.beep(140, 0.22, "sine", 0.045, 50);
    },
    undo() {
      this.ensure();
      this.beep(360, 0.08, "triangle", 0.03, 220);
    },
    step() {
      this.ensure();
      this.beep(490, 0.05, "sine", 0.025, 620);
    },
    rumble() {
      this.ensure();
      this.beep(110, 0.12, "sine", 0.04, 70);
      this.noise(0.08, 0.03, 180);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.12, "sine", 0.055, 523);
      this.beep(659, 0.16, "sine", 0.05, 784);
      this.beep(784, 0.28, "triangle", 0.055, 1175);
    },
    win() {
      this.ensure();
      this.beep(523, 0.14, "sine", 0.06);
      this.beep(659, 0.16, "sine", 0.055);
      this.beep(784, 0.18, "sine", 0.055);
      this.beep(1046, 0.4, "triangle", 0.07, 1560);
    },
    start() {
      this.ensure();
      this.beep(392, 0.12, "sine", 0.045, 784);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.07, "square", 0.025, 90);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.muted = true;
  } catch (err) { /* ignore */ }
  audio.setMuted(audio.muted);

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.4, spec.j * 0.4),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        hue: spec.hue || 0,
        g: spec.g == null ? 90 : spec.g
      });
    }
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.toggle("gold", !!gold && !warn);
    toastEl.classList.remove("hidden");
    G.toastT = 1.8;
  }

  function syncPips() {
    while (pipEls.length < LIVES) {
      const el = document.createElement("i");
      el.className = "pip on";
      pipsEl.appendChild(el);
      pipEls.push(el);
    }
    for (let i = 0; i < pipEls.length; i++) {
      pipEls[i].className = "pip" + (i < G.lives ? " on" : " gone");
    }
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle("hot", kind === "hot");
    hintEl.classList.toggle("warn", kind === "warn");
  }

  function bagLabel() {
    if (!G.bag.length) return "无板";
    const len = G.bag[G.sel] || G.bag[0];
    return "余 " + G.bag.length + " · 长 " + len;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    if (G.mode === "title") {
      stageLabel.textContent = "十涧";
      leftLabel.textContent = "两端都要有支撑";
    } else if (st) {
      stageLabel.textContent = "第 " + (G.stage + 1) + " 涧 · " + st.name;
      let foot = bagLabel();
      if (G.walk) foot = "过桥";
      else if (G.boards.some(function (b) { return b.state === "fall"; })) foot = "翻板";
      else if (G.mode === "clear") foot = "桥成";
      else if (G.mode === "win") foot = "抵岸";
      leftLabel.textContent = foot;
    }
    const warn = G.mode === "play" && (footIsWarn());
    stageLabel.classList.toggle("hot", G.mode === "clear" || G.mode === "win");
    leftLabel.classList.toggle("warn", warn);
    const canUndo = G.mode === "play" && !busy() && lastSetBoard() != null;
    btnUndo.disabled = !canUndo;
    syncPips();
  }

  function footIsWarn() {
    for (let i = 0; i < G.boards.length; i++) {
      if (G.boards[i].state === "fall") return true;
    }
    return false;
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove("hidden");
    panel.classList.toggle("win", kind === "win");
    panel.classList.toggle("lose", kind === "lose");
    ovKicker.textContent = kicker;
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovOps.textContent = ops || (coarse ? OPS_TOUCH : OPS_KB);
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function cellX(c) {
    return OX + c * TILE;
  }
  function cellTop(r) {
    return OY - (r + 1) * TILE;
  }
  function surfY(r) {
    return OY - r * TILE;
  }
  function cx(c) {
    return OX + (c + 0.5) * TILE;
  }

  function colH(c) {
    if (c < 0 || c >= COLS) return 0;
    return G.h[c] || 0;
  }

  function visColH(c) {
    if (c < 0 || c >= COLS) return 0;
    return G.visH[c] == null ? colH(c) : G.visH[c];
  }

  function isStone(c, r) {
    return r >= 0 && r < colH(c);
  }

  function plankAt(c, r, ignoreId) {
    for (let i = 0; i < G.boards.length; i++) {
      const b = G.boards[i];
      if (ignoreId && b.id === ignoreId) continue;
      if (b.state !== "set" && b.state !== "drop") continue;
      if (b.row !== r) continue;
      if (c >= b.c0 && c <= b.c1) return b;
    }
    return null;
  }

  function isBlock(c, r, ignoreId) {
    return isStone(c, r) || !!plankAt(c, r, ignoreId);
  }

  function probe(c0, c1, row, ignoreId) {
    if (c0 > c1) {
      const t = c0;
      c0 = c1;
      c1 = t;
    }
    const len = c1 - c0 + 1;
    const left = isBlock(c0, row - 1, ignoreId);
    const right = isBlock(c1, row - 1, ignoreId);
    if (len < 2 || row < 1 || row > ROW_MAX || c0 < 0 || c1 >= COLS) {
      return { ok: false, left: left, right: right, why: "range" };
    }
    for (let c = c0; c <= c1; c++) {
      if (isStone(c, row)) return { ok: false, left: left, right: right, why: "stone" };
      const hit = plankAt(c, row, ignoreId);
      if (hit && colH(c) !== row) {
        return { ok: false, left: left, right: right, why: "overlap" };
      }
    }
    if (!left || !right) return { ok: false, left: left, right: right, why: "hang" };
    return { ok: true, left: true, right: true, why: "" };
  }

  function findPath() {
    const walk = {};
    function mark(c, r) {
      if (c < 0 || c >= COLS || r < 0 || r > ROW_MAX) return;
      walk[c + (r << 4)] = 1;
    }
    for (let c = 0; c < COLS; c++) {
      const h = colH(c);
      if (h > 0) mark(c, h);
    }
    for (let i = 0; i < G.boards.length; i++) {
      const b = G.boards[i];
      if (b.state !== "set") continue;
      for (let c = b.c0; c <= b.c1; c++) mark(c, b.row);
    }
    const q = [];
    const seen = {};
    const prev = {};
    for (let c = 0; c < COLS; c++) {
      if (G.kind[c] !== "L") continue;
      const h = colH(c);
      const k = c + (h << 4);
      if (walk[k] && !seen[k]) {
        seen[k] = 1;
        q.push(c + (h << 4));
      }
    }
    const goals = {};
    for (let c = 0; c < COLS; c++) {
      if (G.kind[c] !== "R") continue;
      const h = colH(c);
      goals[c + (h << 4)] = 1;
    }
    let found = -1;
    let qi = 0;
    while (qi < q.length) {
      const cur = q[qi++];
      if (goals[cur]) {
        found = cur;
        break;
      }
      const cc = cur & 15;
      const rr = cur >> 4;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nc = cc + dc;
          const nr = rr + dr;
          if (nc < 0 || nc >= COLS || nr < 0 || nr > ROW_MAX) continue;
          const nk = nc + (nr << 4);
          if (!walk[nk] || seen[nk]) continue;
          seen[nk] = 1;
          prev[nk] = cur;
          q.push(nk);
        }
      }
    }
    if (found < 0) return null;
    const path = [];
    let k = found;
    let guard = 0;
    while (guard++ < 80) {
      path.push({ c: k & 15, r: k >> 4 });
      if (prev[k] == null) break;
      k = prev[k];
    }
    path.reverse();
    return path;
  }

  function startCell() {
    for (let c = 0; c < COLS; c++) {
      if (G.kind[c] === "L") return { c: c, r: colH(c) };
    }
    return { c: 0, r: 2 };
  }

  function lastSetBoard() {
    for (let i = G.boards.length - 1; i >= 0; i--) {
      if (G.boards[i].state === "set") return G.boards[i];
    }
    return null;
  }

  function busy() {
    if (G.mode !== "play") return true;
    if (G.lock > 0) return true;
    if (G.walk) return true;
    for (let i = 0; i < G.boards.length; i++) {
      const s = G.boards[i].state;
      if (s === "drop" || s === "fall") return true;
    }
    return false;
  }

  function ghostLen() {
    if (G.dragLen >= 2) return G.dragLen;
    if (!G.bag.length) return 0;
    return G.bag[G.sel] || 0;
  }

  function ghostProbe() {
    const len = ghostLen();
    if (len < 2) return { ok: false, left: false, right: false, why: "none" };
    const p = probe(G.gc, G.gc + len - 1, G.gr);
    if (p.ok && G.dragLen >= 2 && G.bag.indexOf(len) < 0) {
      return { ok: false, left: p.left, right: p.right, why: "bag" };
    }
    return p;
  }

  function resetGhost() {
    const st = STAGES[G.stage];
    G.dragLen = 0;
    G.sel = 0;
    if (st && st.ghost && G.bag.length) {
      G.gc = st.ghost[0];
      G.gr = st.ghost[1];
      return;
    }
    G.gc = 0;
    G.gr = Math.max(1, colH(0) || 2);
    const len = ghostLen();
    if (len >= 2 && G.gc + len > COLS) G.gc = Math.max(0, COLS - len);
  }

  function loadStage(index, fromFail) {
    const st = STAGES[index];
    G.stage = index;
    G.kind = st.kind;
    G.baseH = st.heights.slice();
    G.h = st.heights.slice();
    G.visH = st.heights.slice();
    G.moveBy = new Array(COLS);
    if (st.move) {
      for (let i = 0; i < st.move.length; i++) {
        const m = st.move[i];
        G.moveBy[m.c] = m;
        const wave = Math.sin((G.clock * TAU) / m.period + m.phase);
        G.h[m.c] = wave > 0 ? m.hi : m.lo;
        G.visH[m.c] = G.h[m.c];
      }
    }
    G.bag = st.planks.slice();
    G.boards = [];
    G.walk = null;
    G._path = null;
    G.settle = 0;
    G.lock = fromFail ? 0.45 : 0.18;
    G.sel = 0;
    resetGhost();
    pointer.down = false;
    pointer.dragged = false;
    setHint(st.hint, "");
    toast(fromFail ? "还剩 " + G.lives + " 命" : st.toast, !!fromFail, !fromFail);
    syncHud();
    if (!fromFail) audio.start();
  }

  function startRun() {
    particles.length = 0;
    splashes.length = 0;
    G.lives = LIVES;
    G.placed = 0;
    G.falls = 0;
    G.clock = 0;
    G.flash = 0;
    G.mode = "play";
    hideOverlay();
    loadStage(0, false);
  }

  function winRun() {
    G.mode = "win";
    G.walk = null;
    audio.win();
    showOverlay(
      "win",
      "桥成",
      "十涧都通了。灯还在对岸亮着。",
      "再搭一次",
      "CLEAR",
      "放下 " + G.placed + " 块 · 翻落 " + G.falls + " 次"
    );
    setHint("十涧灯都过去了", "hot");
    syncHud();
  }

  function loseRun(why) {
    G.mode = "lose";
    G.walk = null;
    G.why = why || "板尽";
    audio.splash();
    showOverlay(
      "lose",
      "涧吞",
      "木板掉进涧里。灯还停在这边。",
      "再来一局",
      "FALL",
      STAGES[G.stage].name + " · " + G.why
    );
    setHint("三命用尽", "warn");
    syncHud();
  }

  function beginWalk(path) {
    if (!path || path.length < 2) return;
    G.walk = {
      path: path,
      i: 0,
      t: 0,
      x: cx(path[0].c),
      y: surfY(path[0].r),
      bob: 0
    };
    G.settle = 0;
    setHint("灯人过桥", "hot");
  }

  function tryBeginWalk() {
    if (busy() && !G.settle) return;
    if (G.walk) return;
    const path = findPath();
    if (path && path.length >= 2) {
      G.settle = 0.28;
      G._path = path;
    } else {
      G._path = null;
    }
  }

  function cycleBag(dir) {
    if (G.bag.length < 2) return;
    G.sel = (G.sel + dir + G.bag.length) % G.bag.length;
    G.dragLen = 0;
    audio.tick();
    syncHud();
  }

  function moveGhost(dc, dr) {
    const len = ghostLen() || 2;
    G.gc = clamp(G.gc + dc, 0, COLS - 1);
    G.gr = clamp(G.gr + dr, 1, ROW_MAX);
    if (G.gc + len > COLS) G.gc = Math.max(0, COLS - len);
    G.dragLen = 0;
  }

  function pickInvAt(wx, wy) {
    const items = invLayout();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (wx >= it.x - 6 && wx <= it.x + it.w + 6 && wy >= it.y - 10 && wy <= it.y + it.h + 10) {
        return i;
      }
    }
    return -1;
  }

  function invLayout() {
    const items = [];
    const n = G.bag.length;
    if (!n) return items;
    let total = 0;
    for (let i = 0; i < n; i++) total += G.bag[i] * 13 + 28;
    let x = VW * 0.5 - total * 0.5;
    const y = 462;
    for (let i = 0; i < n; i++) {
      const w = G.bag[i] * 13 + 10;
      items.push({ i: i, x: x, y: y, w: w, h: 22, len: G.bag[i] });
      x += w + 18;
    }
    return items;
  }

  function pickBoardAt(wx, wy) {
    for (let i = G.boards.length - 1; i >= 0; i--) {
      const b = G.boards[i];
      if (b.state !== "set") continue;
      const x0 = cellX(b.c0) + 4;
      const x1 = cellX(b.c1 + 1) - 4;
      const y0 = surfY(b.row) - PLANK_H - 8;
      const y1 = surfY(b.row) + 10;
      if (wx >= x0 && wx <= x1 && wy >= y0 && wy <= y1) return b;
    }
    return null;
  }

  function cellAt(wx, wy) {
    const c = Math.floor((wx - OX) / TILE);
    const r = Math.floor((OY - wy) / TILE);
    return { c: c, r: r };
  }

  function undoBoard(b) {
    if (!b || b.state !== "set" || busy()) return;
    G.bag.push(b.len);
    G.sel = G.bag.length - 1;
    for (let i = 0; i < G.boards.length; i++) {
      if (G.boards[i].id === b.id) {
        G.boards.splice(i, 1);
        break;
      }
    }
    G.placed = Math.max(0, G.placed - 1);
    G.settle = 0;
    G._path = null;
    audio.undo();
    emit(8, {
      x: (cellX(b.c0) + cellX(b.c1 + 1)) * 0.5,
      y: surfY(b.row) - 6,
      j: 18,
      vx0: -40, vx1: 40, vy0: -80, vy1: -10,
      life: 0.45, r0: 1.2, r1: 2.6, hue: 2, g: 40
    });
    syncHud();
  }

  function undoLast() {
    const b = lastSetBoard();
    if (b) undoBoard(b);
    else audio.miss();
  }

  function placeAt(c0, row, len, fromBag) {
    if (busy()) return false;
    if (len < 2) return false;
    const c1 = c0 + len - 1;
    const p = probe(c0, c1, row);
    if (!p.ok && p.why !== "hang") {
      audio.miss();
      if (p.why === "overlap") toast("这里已经有板", true);
      else if (p.why === "stone") toast("石柱挡住了", true);
      else toast("搁不到那里", true);
      return false;
    }
    if (fromBag) {
      const idx = G.bag.indexOf(len);
      if (idx < 0) {
        audio.miss();
        toast("没有这长的板", true);
        return false;
      }
      G.bag.splice(idx, 1);
      if (G.sel >= G.bag.length) G.sel = Math.max(0, G.bag.length - 1);
    }
    const board = {
      id: G.idSeq++,
      c0: c0,
      c1: c1,
      row: row,
      len: len,
      state: p.ok ? "drop" : "fall",
      t: 0,
      ang: 0,
      fallY: 0,
      dropY: p.ok ? 16 : 0,
      squash: 1,
      left: p.left,
      right: p.right
    };
    G.boards.push(board);
    G.dragLen = 0;
    if (p.ok) {
      G.placed += 1;
      audio.place();
      const mx = (cellX(c0) + cellX(c1 + 1)) * 0.5;
      emit(14, {
        x: mx, y: surfY(row) - 4, j: 22,
        vx0: -50, vx1: 50, vy0: -120, vy1: -20,
        life: 0.5, r0: 1.4, r1: 3.2, hue: 0, g: 70
      });
    } else {
      G.falls += 1;
      audio.creak();
      G.shake = 0.45;
      G.flash = 0.28;
      G.flashRgb = "255,61,184";
      toast("只搁住一头，板翻了", true);
    }
    syncHud();
    return true;
  }

  function placeGhost() {
    const len = ghostLen();
    if (len < 2) {
      audio.miss();
      toast("没有板了", true);
      return;
    }
    if (G.gc + len > COLS) {
      audio.miss();
      return;
    }
    placeAt(G.gc, G.gr, len, true);
  }

  function onFallDone() {
    G.lives -= 1;
    if (G.lives <= 0) {
      loseRun("翻板");
      return;
    }
    const hasSet = G.boards.some(function (b) { return b.state === "set"; });
    if (!G.bag.length && !hasSet) {
      loadStage(G.stage, true);
      return;
    }
    if (!G.bag.length && !findPath()) {
      toast("走不通，点木板收回", true);
    }
    syncHud();
  }

  function clearStage() {
    G.mode = "clear";
    G.flash = 0.4;
    G.flashRgb = "255,227,107";
    audio.clear();
    const st = STAGES[G.stage];
    toast(st.name + " · 桥成", false, true);
    setHint("灯到了对岸", "hot");
    G.lock = 0.95;
    syncHud();
  }

  function advance() {
    if (G.stage + 1 >= STAGES.length) {
      winRun();
      return;
    }
    G.mode = "play";
    loadStage(G.stage + 1, false);
  }

  function updateHeights() {
    for (let c = 0; c < COLS; c++) {
      const mv = G.moveBy[c];
      if (!mv) {
        G.h[c] = G.baseH[c];
        continue;
      }
      const wave = Math.sin((G.clock * TAU) / mv.period + mv.phase);
      let next = G.h[c];
      if (wave > 0.34) next = mv.hi;
      else if (wave < -0.34) next = mv.lo;
      if (next !== G.h[c]) {
        G.h[c] = next;
        if (G.mode === "play") {
          audio.rumble();
          emit(10, {
            x: cx(c), y: surfY(next) + 8, j: 10,
            vx0: -20, vx1: 20, vy0: -40, vy1: 10,
            life: 0.4, r0: 1, r1: 2.4, hue: next >= mv.hi ? 0 : 1, g: 30
          });
        }
      }
    }
    for (let c = 0; c < COLS; c++) {
      const target = G.h[c];
      G.visH[c] += (target - G.visH[c]) * 0.16;
      if (Math.abs(G.visH[c] - target) < 0.02) G.visH[c] = target;
    }
  }

  function updateBoards(dt) {
    for (let i = G.boards.length - 1; i >= 0; i--) {
      const b = G.boards[i];
      if (b.state === "drop") {
        b.t += dt;
        const u = clamp(b.t / 0.2, 0, 1);
        b.dropY = (1 - easeOut(u)) * 16;
        b.squash = 1 + Math.sin(u * Math.PI) * 0.08;
        if (u >= 1) {
          b.state = "set";
          b.dropY = 0;
          b.squash = 1;
          tryBeginWalk();
        }
      } else if (b.state === "fall") {
        b.t += dt;
        const u = clamp(b.t / 0.78, 0, 1);
        const e = easeIn(u);
        if (b.left && !b.right) b.ang = e * 1.42;
        else if (b.right && !b.left) b.ang = -e * 1.42;
        else {
          b.ang = e * 0.5;
          b.fallY = e * e * 240;
        }
        if (u > 0.55 && u < 0.58) {
          emit(6, {
            x: (cellX(b.c0) + cellX(b.c1 + 1)) * 0.5,
            y: surfY(b.row) + b.fallY + 20,
            j: 16, vx0: -80, vx1: 80, vy0: -40, vy1: 80,
            life: 0.5, r0: 1.5, r1: 3.4, hue: 1, g: 40
          });
        }
        if (u >= 1) {
          G.boards.splice(i, 1);
          audio.splash();
          splashes.push({ x: (cellX(b.c0) + cellX(b.c1 + 1)) * 0.5, t: 0 });
          onFallDone();
        }
      }
    }
  }

  function updateWalk(dt) {
    const w = G.walk;
    if (!w) return;
    w.bob += dt;
    const path = w.path;
    w.t += dt / 0.26;
    if (w.t >= 1) {
      w.t -= 1;
      w.i += 1;
      audio.step();
      const node = path[Math.min(w.i, path.length - 1)];
      emit(3, {
        x: cx(node.c), y: surfY(node.r) - 8, j: 6,
        vx0: -12, vx1: 12, vy0: -40, vy1: -4,
        life: 0.4, r0: 1, r1: 2.2, hue: 2, g: 20
      });
      if (w.i >= path.length - 1) {
        w.i = path.length - 1;
        w.t = 1;
        const lastN = path[path.length - 1];
        w.x = cx(lastN.c);
        w.y = surfY(lastN.r);
        G.walk = w;
        if (G.mode === "play") clearStage();
        return;
      }
    }
    const a = path[w.i];
    const b = path[Math.min(w.i + 1, path.length - 1)];
    const u = ease(clamp(w.t, 0, 1));
    w.x = lerp(cx(a.c), cx(b.c), u);
    w.y = lerp(surfY(a.r), surfY(b.r), u);
    const hop = Math.sin(u * Math.PI) * (a.r !== b.r ? 10 : 3);
    w.y -= hop;
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      splashes[i].t += dt;
      if (splashes[i].t > 0.7) splashes.splice(i, 1);
    }
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    G.shake = Math.max(0, G.shake - dt * 2.4);
    G.flash = Math.max(0, G.flash - dt * 2.2);
  }

  function keyRepeat(dt) {
    if (busy() || G.mode !== "play") return;
    const map = [
      ["l", -1, 0],
      ["r", 1, 0],
      ["u", 0, 1],
      ["d", 0, -1]
    ];
    for (let i = 0; i < map.length; i++) {
      const k = map[i][0];
      if (!keys[k]) {
        hold[k] = 0;
        continue;
      }
      hold[k] += dt;
      if (hold[k] === dt || hold[k] > 0.32 && ((hold[k] * 12) | 0) !== (((hold[k] - dt) * 12) | 0)) {
        moveGhost(map[i][1], map[i][2]);
      }
    }
  }

  function updatePlay(dt) {
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    updateHeights();
    updateBoards(dt);
    if (G.settle > 0) {
      G.settle -= dt;
      if (G.settle <= 0 && G._path && G.mode === "play") beginWalk(G._path);
    }
    if (G.walk) updateWalk(dt);
    keyRepeat(dt);
    if (G.mode === "clear" && G.lock <= 0) advance();
  }

  function updateTitle(dt) {
    G.clock += dt;
    if (!G.kind) {
      G.stage = 0;
      const st = STAGES[0];
      G.kind = st.kind;
      G.baseH = st.heights.slice();
      G.h = st.heights.slice();
      G.visH = st.heights.slice();
      G.moveBy = new Array(COLS);
      G.bag = st.planks.slice();
      G.boards = [];
      G.gc = 2;
      G.gr = 2;
    }
    updateHeights();
    G.gc = 2;
    G.gr = 2;
  }

  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function ss(n) {
    return n * scale;
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

  function drawSky() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, "#070414");
    g.addColorStop(0.55, "#05030c");
    g.addColorStop(1, "#0a0618");
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), ss(VW), ss(VH));

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), ss(VW), ss(VH));
    ctx.clip();
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.t * 2.2 + s.p);
      ctx.fillStyle = "rgba(200,240,255," + (s.a * tw) + ")";
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), ss(s.r), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = m.x + Math.sin(G.t * 0.3 + m.p) * m.s;
      const my = (m.y + G.t * 6) % (OY + 40);
      ctx.fillStyle = "rgba(255,61,184," + m.a + ")";
      ctx.beginPath();
      ctx.arc(sx(mx), sy(my), ss(m.r), 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    const glow = ctx.createRadialGradient(sx(VW * 0.5), sy(OY + 10), ss(20), sx(VW * 0.5), sy(OY + 10), ss(340));
    glow.addColorStop(0, "rgba(255,61,184,0.16)");
    glow.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sx(0), sy(OY - 80), ss(VW), ss(VH - OY + 80));
  }

  function drawWater() {
    const top = OY + 6;
    const grd = ctx.createLinearGradient(sx(0), sy(top), sx(0), sy(VH));
    grd.addColorStop(0, "rgba(18, 6, 28, 0.2)");
    grd.addColorStop(0.15, "rgba(40, 8, 36, 0.85)");
    grd.addColorStop(1, "#05030c");
    ctx.fillStyle = grd;
    ctx.fillRect(sx(0), sy(top), ss(VW), ss(VH - top));

    for (let layer = 0; layer < 3; layer++) {
      const amp = 3.5 + layer * 1.6;
      const spd = 1.1 + layer * 0.35;
      const y0 = top + 6 + layer * 9;
      ctx.beginPath();
      ctx.moveTo(sx(-10), sy(VH));
      ctx.lineTo(sx(-10), sy(y0));
      for (let x = 0; x <= VW; x += 10) {
        const y = y0 + Math.sin(x * 0.02 + G.t * spd + layer) * amp;
        ctx.lineTo(sx(x), sy(y));
      }
      ctx.lineTo(sx(VW + 10), sy(VH));
      ctx.closePath();
      ctx.fillStyle = layer === 0
        ? "rgba(255,61,184,0.08)"
        : layer === 1
          ? "rgba(0,240,255,0.05)"
          : "rgba(8,4,18,0.35)";
      ctx.fill();
    }

    for (let i = 0; i < splashes.length; i++) {
      const s = splashes[i];
      const u = s.t / 0.7;
      ctx.strokeStyle = "rgba(0,240,255," + (0.45 * (1 - u)) + ")";
      ctx.lineWidth = ss(1.4);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(OY + 10), ss(12 + u * 38), ss(4 + u * 8), 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawColumn(c) {
    const h = visColH(c);
    if (h <= 0.02) return;
    const x = cellX(c);
    const top = surfY(h);
    const bot = OY + 8;
    const kind = G.kind[c];
    const moving = !!G.moveBy[c];
    const j0 = hash(c * 4.2) * 3;
    const j1 = hash(c * 7.7) * 3;

    ctx.beginPath();
    ctx.moveTo(sx(x + 6 + j0), sy(bot));
    ctx.lineTo(sx(x + 5), sy(top + 8));
    ctx.lineTo(sx(x + 8), sy(top));
    ctx.lineTo(sx(x + TILE - 8), sy(top));
    ctx.lineTo(sx(x + TILE - 5), sy(top + 8));
    ctx.lineTo(sx(x + TILE - 6 - j1), sy(bot));
    ctx.closePath();
    const fill = ctx.createLinearGradient(sx(x), sy(top), sx(x + TILE), sy(bot));
    if (kind === "R") {
      fill.addColorStop(0, "#1a2030");
      fill.addColorStop(1, "#0c101c");
    } else if (kind === "L") {
      fill.addColorStop(0, "#1a1630");
      fill.addColorStop(1, "#0c0818");
    } else {
      fill.addColorStop(0, "#161022");
      fill.addColorStop(1, "#0a0714");
    }
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.strokeStyle = moving ? "rgba(255,61,184,0.7)" : "rgba(0,240,255,0.38)";
    ctx.lineWidth = ss(1.4);
    ctx.beginPath();
    ctx.moveTo(sx(x + 8), sy(top));
    ctx.lineTo(sx(x + TILE - 8), sy(top));
    ctx.stroke();

    ctx.fillStyle = moving ? "rgba(255,61,184,0.22)" : "rgba(0,240,255,0.12)";
    ctx.fillRect(sx(x + 8), sy(top), ss(TILE - 16), ss(6));

    if (kind === "R") {
      ctx.fillStyle = "rgba(255,227,107,0.35)";
      ctx.fillRect(sx(x + 10), sy(top), ss(TILE - 20), ss(3));
    }

    for (let k = 0; k < 3; k++) {
      const cy = top + 18 + k * 22 + hash(c + k) * 8;
      if (cy > bot - 16) continue;
      ctx.strokeStyle = "rgba(0,240,255,0.07)";
      ctx.lineWidth = ss(1);
      ctx.beginPath();
      ctx.moveTo(sx(x + 12), sy(cy));
      ctx.lineTo(sx(x + TILE - 14), sy(cy + 6));
      ctx.stroke();
    }

    if (moving) {
      const pulse = 0.35 + 0.25 * Math.sin(G.t * 6);
      ctx.strokeStyle = "rgba(255,61,184," + pulse + ")";
      ctx.lineWidth = ss(2);
      ctx.strokeRect(sx(x + 10), sy(top - 3), ss(TILE - 20), ss(8));
    }
  }

  function drawSupportDots() {
    for (let c = 0; c < COLS; c++) {
      const h = colH(c);
      if (h <= 0) continue;
      const moving = !!G.moveBy[c];
      ctx.beginPath();
      ctx.arc(sx(cx(c)), sy(surfY(h) - 3), ss(3.2), 0, TAU);
      ctx.fillStyle = moving ? MAG : CYN;
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(G.t * 3 + c);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function plankRect(b) {
    return {
      x: cellX(b.c0) + 5,
      y: surfY(b.row) - PLANK_H + (b.dropY || 0) + (b.fallY || 0),
      w: (b.c1 - b.c0 + 1) * TILE - 10,
      h: PLANK_H * (b.squash || 1)
    };
  }

  function drawPlankBody(x, y, w, h, ok, ghost, ang, px, py) {
    ctx.save();
    if (ang) {
      ctx.translate(sx(px), sy(py));
      ctx.rotate(ang);
      ctx.translate(-sx(px), -sy(py));
    }
    const fill = ok ? "#c9a24a" : ghost ? "rgba(255,61,184,0.35)" : "#8a3a5c";
    ctx.fillStyle = ghost && ok ? "rgba(0,240,255,0.28)" : fill;
    roundRect(sx(x), sy(y), ss(w), ss(h), ss(3));
    ctx.fill();
    ctx.strokeStyle = ghost
      ? (ok ? "rgba(0,240,255,0.9)" : "rgba(255,61,184,0.9)")
      : ok
        ? "rgba(255,227,107,0.7)"
        : "rgba(255,61,184,0.7)";
    ctx.lineWidth = ss(ghost ? 2 : 1.3);
    ctx.stroke();

    if (!ghost || ok) {
      ctx.strokeStyle = "rgba(80,40,20,0.28)";
      ctx.lineWidth = ss(1);
      for (let i = 1; i < 4; i++) {
        const yy = y + h * (i / 4);
        ctx.beginPath();
        ctx.moveTo(sx(x + 6), sy(yy));
        ctx.lineTo(sx(x + w - 6), sy(yy + 1));
        ctx.stroke();
      }
    }

    const cap = ghost ? (ok ? CYN : MAG) : GOLD;
    ctx.fillStyle = cap;
    ctx.fillRect(sx(x + 2), sy(y + 3), ss(5), ss(h - 6));
    ctx.fillRect(sx(x + w - 7), sy(y + 3), ss(5), ss(h - 6));
    ctx.restore();
  }

  function drawBoards() {
    for (let i = 0; i < G.boards.length; i++) {
      const b = G.boards[i];
      const rc = plankRect(b);
      let ang = b.ang || 0;
      let px = rc.x;
      let py = rc.y + rc.h;
      if (b.state === "fall") {
        if (b.left && !b.right) {
          px = rc.x + 6;
          py = rc.y + rc.h;
        } else if (b.right && !b.left) {
          px = rc.x + rc.w - 6;
          py = rc.y + rc.h;
        } else {
          px = rc.x + rc.w * 0.5;
          py = rc.y + rc.h;
        }
      }
      drawPlankBody(rc.x, rc.y, rc.w, rc.h, b.state !== "fall", false, ang, px, py);
    }
  }

  function drawGhost() {
    if (G.mode !== "play" && G.mode !== "title") return;
    if (G.walk) return;
    const len = ghostLen();
    if (len < 2) return;
    const p = ghostProbe();
    const x = cellX(G.gc) + 5;
    const y = surfY(G.gr) - PLANK_H;
    const w = len * TILE - 10;
    ctx.globalAlpha = G.mode === "title" ? 0.55 + 0.2 * Math.sin(G.t * 2) : 0.92;
    drawPlankBody(x, y, w, PLANK_H, p.ok, true, 0, x, y);
    ctx.globalAlpha = 1;

    const marks = [
      { c: G.gc, ok: p.left },
      { c: G.gc + len - 1, ok: p.right }
    ];
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i];
      const mx = cx(m.c);
      const my = surfY(G.gr) - PLANK_H - 10;
      ctx.beginPath();
      if (m.ok) {
        ctx.strokeStyle = CYN;
        ctx.lineWidth = ss(2);
        ctx.moveTo(sx(mx - 5), sy(my));
        ctx.lineTo(sx(mx), sy(my + 6));
        ctx.lineTo(sx(mx + 5), sy(my - 2));
        ctx.stroke();
      } else {
        ctx.strokeStyle = MAG;
        ctx.lineWidth = ss(2);
        ctx.moveTo(sx(mx - 5), sy(my - 4));
        ctx.lineTo(sx(mx + 5), sy(my + 6));
        ctx.moveTo(sx(mx + 5), sy(my - 4));
        ctx.lineTo(sx(mx - 5), sy(my + 6));
        ctx.stroke();
      }
    }
  }

  function drawWalker() {
    let x;
    let y;
    if (G.walk) {
      x = G.walk.x;
      y = G.walk.y - 12 + Math.sin(G.walk.bob * 8) * 1.6;
    } else {
      const s = startCell();
      x = cx(s.c);
      y = surfY(s.r) - 12 + Math.sin(G.t * 4) * 1.8;
    }
    if (G.mode === "lose") y += 4;

    const glow = ctx.createRadialGradient(sx(x), sy(y), ss(2), sx(x), sy(y), ss(22));
    glow.addColorStop(0, "rgba(255,227,107,0.55)");
    glow.addColorStop(1, "rgba(255,227,107,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), ss(22), 0, TAU);
    ctx.fill();

    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), ss(6.2), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = CYN;
    ctx.lineWidth = ss(1.4);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,227,107,0.9)";
    roundRect(sx(x - 3), sy(y + 6), ss(6), ss(7), ss(1.5));
    ctx.fill();

    ctx.fillStyle = MAG;
    ctx.beginPath();
    ctx.arc(sx(x + 0.5), sy(y - 1), ss(1.4), 0, TAU);
    ctx.fill();
  }

  function drawPathGlow() {
    const path = G.walk ? G.walk.path : G._path;
    if (!path || G.mode === "title") return;
    ctx.strokeStyle = "rgba(255,227,107,0.28)";
    ctx.lineWidth = ss(3);
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const x = cx(p.c);
      const y = surfY(p.r) - 2;
      if (i === 0) ctx.moveTo(sx(x), sy(y));
      else ctx.lineTo(sx(x), sy(y));
    }
    ctx.stroke();
  }

  function drawInventory() {
    const items = invLayout();
    ctx.font = ss(11) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(139,144,184,0.85)";
    ctx.fillText(G.bag.length ? "库存" : "板已用尽 · Z 收回", sx(VW * 0.5), sy(448));

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const sel = i === G.sel;
      const hover = i === G.hoverInv;
      ctx.fillStyle = sel ? "rgba(255,227,107,0.14)" : "rgba(255,255,255,0.04)";
      roundRect(sx(it.x - 6), sy(it.y - 6), ss(it.w + 12), ss(it.h + 12), ss(8));
      ctx.fill();
      ctx.strokeStyle = sel ? GOLD : hover ? CYN : "rgba(255,255,255,0.12)";
      ctx.lineWidth = ss(sel ? 1.8 : 1);
      ctx.stroke();
      drawPlankBody(it.x, it.y + 4, it.w, 12, true, false, 0, it.x, it.y);
      ctx.fillStyle = sel ? GOLD : "#c9c6e8";
      ctx.font = ss(10) + "px Segoe UI, sans-serif";
      ctx.fillText("" + it.len, sx(it.x + it.w * 0.5), sy(it.y + it.h + 2));
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      const col = p.hue === 1 ? "255,61,184" : p.hue === 2 ? "255,227,107" : "0,240,255";
      ctx.fillStyle = "rgba(" + col + "," + a + ")";
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), ss(p.r), 0, TAU);
      ctx.fill();
    }
  }

  function draw() {
    const shx = G.shake ? Math.sin(G.t * 58) * G.shake * 5 : 0;
    const shy = G.shake ? Math.cos(G.t * 47) * G.shake * 3 : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(1, 0, 0, 1, shx * scale, shy * scale);
    drawSky();
    drawWater();

    for (let c = 0; c < COLS; c++) drawColumn(c);
    drawSupportDots();
    drawPathGlow();
    drawBoards();
    drawGhost();
    drawWalker();
    drawParticles();
    if (G.mode === "play" || G.mode === "clear") drawInventory();

    if (G.flash > 0) {
      ctx.fillStyle = "rgba(" + G.flashRgb + "," + (G.flash * 0.18) + ")";
      ctx.fillRect(sx(0), sy(0), ss(VW), ss(VH));
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vig = ctx.createRadialGradient(
      W * 0.5, H * 0.48, Math.min(W, H) * 0.25,
      W * 0.5, H * 0.5, Math.max(W, H) * 0.72
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const cxp = (("clientX" in e) ? e.clientX : 0) - rect.left;
    const cyp = (("clientY" in e) ? e.clientY : 0) - rect.top;
    return {
      x: (cxp * dpr - ox) / scale,
      y: (cyp * dpr - oy) / scale
    };
  }

  function hoverAt(wx, wy) {
    G.hoverInv = pickInvAt(wx, wy);
    G.hoverBoard = -1;
    const b = pickBoardAt(wx, wy);
    if (b) G.hoverBoard = b.id;
    if (G.mode !== "play" || busy()) return;
    if (G.hoverInv >= 0) {
      canvas.style.cursor = "pointer";
      return;
    }
    const cell = cellAt(wx, wy);
    if (cell.c >= 0 && cell.c < COLS && cell.r >= 0 && cell.r <= ROW_MAX) {
      canvas.style.cursor = "grab";
    } else {
      canvas.style.cursor = "default";
    }
  }

  function applyHoverGhost(wx, wy) {
    if (busy() || G.mode !== "play") return;
    if (pickInvAt(wx, wy) >= 0) return;
    const cell = cellAt(wx, wy);
    if (cell.c < 0 || cell.c >= COLS) return;
    const len = G.bag[G.sel] || ghostLen() || 2;
    G.gc = clamp(cell.c, 0, COLS - 1);
    G.gr = clamp(cell.r, 1, ROW_MAX);
    if (G.gr < 1) G.gr = 1;
    if (G.gc + len > COLS) G.gc = Math.max(0, COLS - len);
  }

  function pointerDown(e) {
    audio.ensure();
    if (e.button != null && e.button !== 0) return;
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (e.target === ovBtn) return;
      return;
    }
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.dragged = false;
    pointer.id = e.pointerId;
    const inv = pickInvAt(w.x, w.y);
    if (inv >= 0) {
      G.sel = inv;
      G.dragLen = 0;
      audio.tick();
      pointer.sc = -2;
      syncHud();
      return;
    }
    if (busy()) return;
    const cell = cellAt(w.x, w.y);
    pointer.sc = cell.c;
    pointer.sr = clamp(cell.r, 1, ROW_MAX);
    applyHoverGhost(w.x, w.y);
  }

  function pointerMove(e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    hoverAt(w.x, w.y);
    if (!pointer.down || busy() || G.mode !== "play") {
      if (!pointer.down && G.mode === "play" && !busy()) applyHoverGhost(w.x, w.y);
      return;
    }
    if (pointer.sc === -2) return;
    const cell = cellAt(w.x, w.y);
    if (pointer.sc < 0) return;
    const dc = Math.abs(cell.c - pointer.sc);
    if (dc >= 1 || Math.abs(w.x - cellX(pointer.sc) - TILE * 0.5) > 10) pointer.dragged = true;
    if (pointer.dragged) {
      const c0 = Math.min(pointer.sc, clamp(cell.c, 0, COLS - 1));
      const c1 = Math.max(pointer.sc, clamp(cell.c, 0, COLS - 1));
      const len = c1 - c0 + 1;
      G.gc = c0;
      G.gr = pointer.sr;
      G.dragLen = len;
      const idx = G.bag.indexOf(len);
      if (idx >= 0) G.sel = idx;
    }
  }

  function pointerUp(e) {
    if (!pointer.down) return;
    pointer.down = false;
    if (G.mode !== "play" || busy()) {
      pointer.sc = -1;
      G.dragLen = 0;
      return;
    }
    const w = worldFromEvent(e);
    if (pointer.sc === -2) {
      pointer.sc = -1;
      return;
    }
    if (pointer.dragged && G.dragLen >= 2) {
      const len = G.dragLen;
      const c0 = G.gc;
      const row = G.gr;
      G.dragLen = 0;
      if (G.bag.indexOf(len) >= 0) placeAt(c0, row, len, true);
      else {
        audio.miss();
        toast("没有长 " + len + " 的板", true);
      }
      pointer.sc = -1;
      return;
    }
    const b = pickBoardAt(w.x, w.y);
    const p = ghostProbe();
    if (b && !p.ok) {
      undoBoard(b);
      pointer.sc = -1;
      G.dragLen = 0;
      return;
    }
    if (pickInvAt(w.x, w.y) < 0) placeGhost();
    pointer.sc = -1;
    G.dragLen = 0;
  }

  function onMain() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startRun();
  }

  function retry() {
    audio.ensure();
    startRun();
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function loop(now) {
    const t = now * 0.001;
    G.t = t;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.08) dt = 0.08;
    if (!hidden) {
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        if (G.mode === "title") updateTitle(STEP);
        else if (G.mode === "play" || G.mode === "clear") updatePlay(STEP);
        updateFx(STEP);
        acc -= STEP;
      }
      syncHud();
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    if (
      e.code === "ArrowLeft" || e.code === "ArrowRight" ||
      e.code === "ArrowUp" || e.code === "ArrowDown" ||
      e.code === "Space"
    ) {
      e.preventDefault();
    }
    if (e.code === "KeyM") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      retry();
      return;
    }
    if (e.code === "Enter" || e.code === "Space") {
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
        e.preventDefault();
        onMain();
        return;
      }
    }
    if (G.mode !== "play") return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") {
      keys.l = true;
      if (!busy() && hold.l <= 0) {
        moveGhost(-1, 0);
        hold.l = 0.001;
      }
    }
    if (e.code === "KeyD" || e.code === "ArrowRight") {
      keys.r = true;
      if (!busy() && hold.r <= 0) {
        moveGhost(1, 0);
        hold.r = 0.001;
      }
    }
    if (e.code === "KeyW" || e.code === "ArrowUp") {
      keys.u = true;
      if (!busy() && hold.u <= 0) {
        moveGhost(0, 1);
        hold.u = 0.001;
      }
    }
    if (e.code === "KeyS" || e.code === "ArrowDown") {
      keys.d = true;
      if (!busy() && hold.d <= 0) {
        moveGhost(0, -1);
        hold.d = 0.001;
      }
    }
    if (e.code === "Space") {
      e.preventDefault();
      if (!busy()) placeGhost();
    }
    if (e.code === "KeyZ" || e.code === "Backspace") {
      e.preventDefault();
      undoLast();
    }
    if (e.code === "BracketLeft" || e.code === "KeyQ" || e.code === "Tab") {
      e.preventDefault();
      cycleBag(-1);
    }
    if (e.code === "BracketRight" || e.code === "KeyE") {
      e.preventDefault();
      cycleBag(1);
    }
    if (e.code >= "Digit1" && e.code <= "Digit9") {
      const n = e.code.charCodeAt(5) - 49;
      if (n >= 0 && n < G.bag.length) {
        G.sel = n;
        audio.tick();
        syncHud();
      }
    }
  });

  window.addEventListener("keyup", function (e) {
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.l = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.r = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") keys.u = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") keys.d = false;
  });

  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  canvas.addEventListener("pointerdown", pointerDown);
  window.addEventListener("pointermove", pointerMove);
  window.addEventListener("pointerup", pointerUp);
  window.addEventListener("pointercancel", pointerUp);

  ovBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    onMain();
  });
  btnRetry.addEventListener("click", function (e) {
    e.stopPropagation();
    retry();
  });
  btnUndo.addEventListener("click", function (e) {
    e.stopPropagation();
    audio.ensure();
    undoLast();
  });
  btnMute.addEventListener("click", function (e) {
    e.stopPropagation();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    last = 0;
    acc = 0;
  });

  showOverlay(
    "title",
    "搭板",
    "木板两端都要有支撑。对准石台放下，灯人就会过桥。<br />只搁住一头，板会翻进涧里。",
    "开搭",
    "PLANK",
    coarse ? OPS_TOUCH : OPS_KB
  );
  setHint("木板两端都要搁在实处");
  resize();
  updateTitle(0);
  syncHud();
  requestAnimationFrame(loop);
})();
