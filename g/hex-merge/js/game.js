(() => {
  "use strict";

  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SQRT3 = Math.sqrt(3);
  const LIVES = 3;
  const LOCK = 0.36;
  const MERGE_T = 0.58;
  const MUTE_KEY = "playbox-hex-merge-mute";
  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };
  const GLYPH = ["", "一", "二", "三", "四", "合"];
  const DIRS = [
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [0, -1],
    [1, -1]
  ];

  const STAGES = [
    {
      name: "初吻",
      sub: "KISS",
      hint: "点右边那枚转到开口相对 · 同阶才会融",
      target: 3,
      time: 78,
      radius: 2,
      voids: [],
      gems: [
        { q: 0, r: 0, rank: 1, rot: 0 },
        { q: 1, r: 0, rank: 1, rot: 2 },
        { q: -1, r: 1, rank: 1, rot: 4 }
      ],
      spawnMax: 1,
      spawn2: 0
    },
    {
      name: "对棱",
      sub: "FACE",
      hint: "融完的晶会占一格 · 开口决定跟谁合",
      target: 3,
      time: 70,
      radius: 2,
      voids: [
        { q: 2, r: -2 },
        { q: -2, r: 2 }
      ],
      gems: [
        { q: -1, r: 0, rank: 1, rot: 5 },
        { q: 0, r: -1, rank: 1, rot: 1 },
        { q: 1, r: -1, rank: 1, rot: 3 },
        { q: 0, r: 1, rank: 1, rot: 0 },
        { q: 1, r: 0, rank: 2, rot: 4 }
      ],
      spawnMax: 1,
      spawn2: 0
    },
    {
      name: "三曜",
      sub: "TRIAD",
      hint: "先做成两枚「三」，再让它们对吻成「四」",
      target: 4,
      time: 88,
      radius: 2,
      voids: [
        { q: 2, r: 0 },
        { q: -2, r: 0 }
      ],
      gems: [
        { q: 0, r: 0, rank: 2, rot: 0 },
        { q: 1, r: 0, rank: 2, rot: 1 },
        { q: -1, r: 1, rank: 1, rot: 2 },
        { q: 0, r: -1, rank: 1, rot: 5 },
        { q: -1, r: 0, rank: 1, rot: 3 }
      ],
      spawnMax: 1,
      spawn2: 0.08
    },
    {
      name: "合核",
      sub: "CORE",
      hint: "炉更挤了。落点要为下一吻留边",
      target: 4,
      time: 76,
      radius: 2,
      voids: [
        { q: 2, r: -2 },
        { q: -2, r: 2 },
        { q: 0, r: 2 },
        { q: 0, r: -2 }
      ],
      gems: [
        { q: 0, r: 0, rank: 2, rot: 1 },
        { q: 1, r: -1, rank: 2, rot: 4 },
        { q: -1, r: 0, rank: 1, rot: 0 },
        { q: 1, r: 0, rank: 1, rot: 3 },
        { q: -1, r: 1, rank: 1, rot: 5 }
      ],
      spawnMax: 2,
      spawn2: 0.16
    },
    {
      name: "六合",
      sub: "UNITY",
      hint: "合成「合」。边要对齐，盘满就熄炉",
      target: 5,
      time: 96,
      radius: 2,
      voids: [
        { q: 2, r: -2 },
        { q: -2, r: 2 },
        { q: 2, r: 0 },
        { q: -2, r: 0 }
      ],
      gems: [
        { q: 0, r: 0, rank: 3, rot: 0 },
        { q: 1, r: -1, rank: 2, rot: 2 },
        { q: 0, r: 1, rank: 2, rot: 5 },
        { q: -1, r: 0, rank: 1, rot: 1 },
        { q: 1, r: 0, rank: 1, rot: 4 },
        { q: 0, r: -1, rank: 1, rot: 3 }
      ],
      spawnMax: 2,
      spawn2: 0.2
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
  const btnCcw = document.getElementById("btn-ccw");
  const btnCw = document.getElementById("btn-cw");
  const stageLabel = document.getElementById("stage-label");
  const goalLabel = document.getElementById("goal-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const view = { w: 1, h: 1, dpr: 1 };
  const layout = {
    ox: 0,
    oy: 0,
    size: 40,
    portrait: true,
    heldX: 0,
    heldY: 0,
    heldS: 36,
    nextX: 0,
    nextY: 0,
    nextS: 22
  };

  const G = {
    mode: "title",
    overlay: "title",
    stage: 0,
    lives: LIVES,
    remain: 78,
    cells: {},
    order: [],
    held: { rank: 1, rot: 0 },
    next: { rank: 1, rot: 2 },
    cq: 0,
    cr: 0,
    hoverQ: null,
    hoverR: null,
    hoverHeld: false,
    actorQ: 0,
    actorR: 0,
    lock: null,
    merge: null,
    combo: 0,
    comboT: 0,
    best: 1,
    fuses: 0,
    placed: 0,
    t: 0,
    clock: 0,
    toastT: 0,
    shake: 0,
    flash: 0,
    flashRgb: "0,240,255",
    paused: false,
    frozen: true,
    pending: "",
    pendingT: 0,
    why: "",
    inputLock: 0,
    hudTick: 0
  };

  const particles = [];
  const motes = [];
  const pops = [];

  const ptr = { id: null, x: 0, y: 0, sx: 0, sy: 0, down: false };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function easeInOut(t) {
    t = clamp(t, 0, 1);
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function irand(n) {
    return (Math.random() * n) | 0;
  }
  function rgb(c, a) {
    return a == null
      ? "rgb(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + ")"
      : "rgba(" + (c.r | 0) + "," + (c.g | 0) + "," + (c.b | 0) + "," + a + ")";
  }
  function lerpCol(a, b, t) {
    return {
      r: lerp(a.r, b.r, t),
      g: lerp(a.g, b.g, t),
      b: lerp(a.b, b.b, t)
    };
  }
  function key(q, r) {
    return q + ":" + r;
  }
  function stageNow() {
    return STAGES[G.stage];
  }

  function rankCol(rank) {
    if (rank <= 1) return MAG;
    if (rank === 2) return CYN;
    if (rank === 3) return GOLD;
    if (rank === 4) return { r: 255, g: 150, b: 220 };
    return { r: 210, g: 250, b: 255 };
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
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
      if (m) this.hushDrone();
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
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 1400;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    pulse: function (kind, rank) {
      this.ensure();
      if (kind === "rotate") {
        this.beep(540, 0.05, "square", 0.03, 280);
        this.beep(880, 0.04, "sine", 0.025, 440);
      } else if (kind === "place") {
        this.beep(220, 0.09, "triangle", 0.05, 140);
        this.noise(0.05, 0.04);
      } else if (kind === "select") {
        this.beep(640, 0.03, "sine", 0.02);
      } else if (kind === "deny") {
        this.beep(140, 0.12, "square", 0.05, 80);
      } else if (kind === "lock") {
        this.beep(392, 0.12, "sine", 0.05, 784);
      } else if (kind === "merge") {
        const f = 330 + (rank || 1) * 90;
        this.beep(f, 0.16, "triangle", 0.08, f * 2);
        this.beep(f * 1.5, 0.28, "sine", 0.05, f * 2.2);
        this.noise(0.08, 0.05);
      } else if (kind === "win") {
        this.beep(523, 0.16, "sine", 0.09, 784);
        this.beep(659, 0.28, "triangle", 0.07, 1046);
        this.beep(784, 0.42, "sine", 0.05, 1174);
      } else if (kind === "lose") {
        this.beep(196, 0.5, "sawtooth", 0.09, 60);
        this.beep(98, 0.7, "square", 0.05, 40);
      } else if (kind === "start") {
        this.beep(262, 0.14, "sine", 0.07, 392);
        this.beep(392, 0.2, "triangle", 0.05, 523);
      } else if (kind === "tick") {
        this.beep(880, 0.05, "square", 0.03, 440);
      } else if (kind === "clear") {
        this.beep(440, 0.12, "triangle", 0.06, 880);
        this.beep(660, 0.22, "sine", 0.05, 1320);
      } else if (kind === "fail") {
        this.noise(0.18, 0.08);
        this.beep(180, 0.32, "sawtooth", 0.07, 70);
      }
    },
    tickDrone: function (playing, best) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 54;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(50 + best * 8, t, 0.14);
      this.droneGain.gain.setTargetAtTime(playing ? 0.016 + best * 0.003 : 0.0001, t, 0.18);
    },
    hushDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
    else audio.setMuted(false);
  } catch (e) {
    audio.setMuted(false);
  }

  function hexPixel(q, r, size) {
    return {
      x: size * SQRT3 * (q + r / 2),
      y: size * 1.5 * r
    };
  }

  function hexRound(q, r) {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;
    return { q: rq, r: rr };
  }

  function pixelToHex(x, y, size) {
    const r = ((2 / 3) * y) / size;
    const q = x / (size * SQRT3) - r / 2;
    return hexRound(q, r);
  }

  function cellAt(q, r) {
    return G.cells[key(q, r)] || null;
  }

  function gemAt(q, r) {
    const c = cellAt(q, r);
    return c && c.gem ? c.gem : null;
  }

  function inRadius(q, r, rad) {
    return Math.abs(q) <= rad && Math.abs(r) <= rad && Math.abs(q + r) <= rad;
  }

  function worldOf(q, r) {
    const p = hexPixel(q, r, layout.size);
    return { x: layout.ox + p.x, y: layout.oy + p.y };
  }

  function edgeMid(x, y, size, d, k) {
    const a = (d * 60) * Math.PI / 180;
    const dist = size * (k == null ? SQRT3 * 0.5 : k);
    return { x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist };
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 48; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.22 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.12 + 0.03,
        hex: Math.random() < 0.35
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 150) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * (0.7 + Math.random() * 0.45),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col
      });
    }
  }

  function pop(x, y, text, kind) {
    pops.push({ x: x, y: y, text: text, life: 0.95, kind: kind || 0 });
    if (pops.length > 8) pops.shift();
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("gold", kind === "gold");
    toastEl.classList.remove("hidden");
    G.toastT = kind === "warn" ? 2.2 : 1.7;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function spawnPiece(maxRank, p2) {
    const rank = Math.random() < p2 ? 2 : 1;
    return { rank: Math.min(rank, maxRank), rot: irand(6) };
  }

  function buildBoard(st) {
    G.cells = {};
    G.order = [];
    const rad = st.radius;
    for (let q = -rad; q <= rad; q++) {
      for (let r = Math.max(-rad, -q - rad); r <= Math.min(rad, -q + rad); r++) {
        const k = key(q, r);
        G.cells[k] = { q: q, r: r, void: false, gem: null };
        G.order.push(k);
      }
    }
    for (let i = 0; i < st.voids.length; i++) {
      const v = st.voids[i];
      const c = cellAt(v.q, v.r);
      if (c) c.void = true;
    }
    for (let i = 0; i < st.gems.length; i++) {
      const g = st.gems[i];
      const c = cellAt(g.q, g.r);
      if (!c || c.void) continue;
      c.gem = {
        rank: g.rank,
        rot: g.rot % 6,
        spin: 0,
        pulse: 0.4,
        busy: false,
        born: 0.5 + Math.random() * 0.2
      };
    }
  }

  function highestRank() {
    let h = 0;
    for (let i = 0; i < G.order.length; i++) {
      const g = G.cells[G.order[i]].gem;
      if (g && g.rank > h) h = g.rank;
    }
    return h;
  }

  function emptyCount() {
    let n = 0;
    for (let i = 0; i < G.order.length; i++) {
      const c = G.cells[G.order[i]];
      if (!c.void && !c.gem) n++;
    }
    return n;
  }

  function adjacentSameRank() {
    for (let i = 0; i < G.order.length; i++) {
      const c = G.cells[G.order[i]];
      if (!c.gem || c.gem.busy) continue;
      for (let d = 0; d < 6; d++) {
        const n = gemAt(c.q + DIRS[d][0], c.r + DIRS[d][1]);
        if (n && !n.busy && n.rank === c.gem.rank) return true;
      }
    }
    return false;
  }

  function visRot(gem) {
    return gem.rot - gem.spin;
  }

  function wouldKiss(q, r, rank, rot) {
    const d = ((rot % 6) + 6) % 6;
    const nq = q + DIRS[d][0];
    const nr = r + DIRS[d][1];
    const g = gemAt(nq, nr);
    if (!g || g.busy || g.rank !== rank) return null;
    if (g.rot !== (d + 3) % 6) return null;
    return { q: nq, r: nr, gem: g, d: d };
  }

  function findKisses() {
    const seen = {};
    const pairs = [];
    for (let i = 0; i < G.order.length; i++) {
      const c = G.cells[G.order[i]];
      const a = c.gem;
      if (!a || a.busy || Math.abs(a.spin) > 0.12) continue;
      const d = ((a.rot % 6) + 6) % 6;
      const b = gemAt(c.q + DIRS[d][0], c.r + DIRS[d][1]);
      if (!b || b.busy || Math.abs(b.spin) > 0.12) continue;
      if (b.rank !== a.rank) continue;
      if (b.rot !== (d + 3) % 6) continue;
      const ka = key(c.q, c.r);
      const kb = key(c.q + DIRS[d][0], c.r + DIRS[d][1]);
      const id = ka < kb ? ka + "|" + kb : kb + "|" + ka;
      if (seen[id]) continue;
      seen[id] = true;
      pairs.push({
        aq: c.q,
        ar: c.r,
        bq: c.q + DIRS[d][0],
        br: c.r + DIRS[d][1],
        id: id,
        rank: a.rank,
        d: d
      });
    }
    return pairs;
  }

  function preferPair(pairs) {
    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      if ((p.aq === G.actorQ && p.ar === G.actorR) || (p.bq === G.actorQ && p.br === G.actorR)) {
        return p;
      }
    }
    return pairs[0];
  }

  function startMerge(p) {
    const keepActor = (p.aq === G.actorQ && p.ar === G.actorR) || (p.bq === G.actorQ && p.br === G.actorR);
    let kq = p.aq;
    let kr = p.ar;
    let dq = p.bq;
    let dr = p.br;
    if (keepActor) {
      kq = G.actorQ;
      kr = G.actorR;
      if (kq === p.aq && kr === p.ar) {
        dq = p.bq;
        dr = p.br;
      } else {
        dq = p.aq;
        dr = p.ar;
      }
    }
    const a = gemAt(p.aq, p.ar);
    const b = gemAt(p.bq, p.br);
    if (!a || !b) return;
    a.busy = true;
    b.busy = true;
    const nr = Math.min(5, p.rank + 1);
    G.merge = {
      aq: p.aq,
      ar: p.ar,
      bq: p.bq,
      br: p.br,
      kq: kq,
      kr: kr,
      dq: dq,
      dr: dr,
      rank0: p.rank,
      rank: nr,
      rot: irand(6),
      t: 0,
      d: p.d
    };
    G.lock = null;
    G.comboT = 0.85;
    G.combo += 1;
    G.fuses += 1;
    audio.pulse("merge", nr);
    const pa = worldOf(p.aq, p.ar);
    const pb = worldOf(p.bq, p.br);
    const mx = (pa.x + pb.x) * 0.5;
    const my = (pa.y + pb.y) * 0.5;
    const col = rankCol(nr);
    emit(22, {
      x: mx,
      y: my,
      j: 10,
      vx0: -90,
      vx1: 90,
      vy0: -90,
      vy1: 90,
      life: 0.55,
      r0: 1.2,
      r1: 3.4,
      col: col
    });
    const word = nr >= 5 ? "六合" : nr >= 4 ? "合核" : "融";
    pop(mx, my - 8, G.combo > 1 ? "连融 ×" + G.combo : word, nr >= 5 ? 2 : G.combo > 1 ? 1 : 0);
    G.flash = nr >= 5 ? 0.55 : 0.28;
    G.flashRgb = col.r + "," + (col.g | 0) + "," + (col.b | 0);
    if (G.combo > 1) toast("连融 ×" + G.combo, "gold");
  }

  function finishMerge() {
    const m = G.merge;
    if (!m) return;
    const keepC = cellAt(m.kq, m.kr);
    const dropC = cellAt(m.dq, m.dr);
    if (dropC) dropC.gem = null;
    if (keepC) {
      keepC.gem = {
        rank: m.rank,
        rot: m.rot,
        spin: 0,
        pulse: 1,
        busy: false,
        born: 1
      };
    }
    G.actorQ = m.kq;
    G.actorR = m.kr;
    G.cq = m.kq;
    G.cr = m.kr;
    G.merge = null;
    G.best = Math.max(G.best, highestRank());
    renderHud();
    const pk = worldOf(m.kq, m.kr);
    emit(14, {
      x: pk.x,
      y: pk.y,
      j: 8,
      vx0: -50,
      vx1: 50,
      vy0: -70,
      vy1: 20,
      life: 0.4,
      r0: 1,
      r1: 2.6,
      col: rankCol(m.rank)
    });
    afterSettle();
  }

  function afterSettle() {
    if (highestRank() >= stageNow().target) {
      G.pending = "win";
      G.pendingT = 0.72;
      return;
    }
    if (emptyCount() === 0 && !G.lock && !G.merge) {
      if (!adjacentSameRank()) {
        G.pending = "stuck";
        G.pendingT = 0.45;
      } else {
        toast("盘满 · 先转开口", "warn");
      }
    }
  }

  function rotateHeld(dir) {
    if (G.mode !== "play" || G.frozen) return;
    G.held.rot = (G.held.rot + dir + 6) % 6;
    audio.pulse("rotate");
    const p = { x: layout.heldX, y: layout.heldY };
    emit(6, {
      x: p.x,
      y: p.y,
      j: 8,
      vx0: -30,
      vx1: 30,
      vy0: -30,
      vy1: 30,
      life: 0.22,
      r0: 1,
      r1: 2,
      col: rankCol(G.held.rank)
    });
  }

  function rotateGem(q, r, dir) {
    if (G.mode !== "play" || G.frozen) return false;
    const g = gemAt(q, r);
    if (!g || g.busy) {
      audio.pulse("deny");
      G.shake = 0.12;
      return false;
    }
    g.rot = (g.rot + dir + 6) % 6;
    g.spin += dir;
    g.pulse = 1;
    G.actorQ = q;
    G.actorR = r;
    G.cq = q;
    G.cr = r;
    audio.pulse("rotate");
    const p = worldOf(q, r);
    const m = edgeMid(p.x, p.y, layout.size, g.rot, layout.size * 0.52);
    emit(8, {
      x: m.x,
      y: m.y,
      j: 5,
      vx0: -40,
      vx1: 40,
      vy0: -40,
      vy1: 40,
      life: 0.28,
      r0: 1,
      r1: 2.2,
      col: rankCol(g.rank)
    });
    return true;
  }

  function placeAt(q, r) {
    if (G.mode !== "play" || G.frozen || G.inputLock > 0) return false;
    const c = cellAt(q, r);
    if (!c || c.void) {
      audio.pulse("deny");
      G.shake = 0.14;
      return false;
    }
    if (c.gem) {
      rotateGem(q, r, 1);
      return true;
    }
    if (G.merge && (key(q, r) === key(G.merge.aq, G.merge.ar) || key(q, r) === key(G.merge.bq, G.merge.br))) {
      audio.pulse("deny");
      return false;
    }
    c.gem = {
      rank: G.held.rank,
      rot: G.held.rot,
      spin: 0,
      pulse: 1,
      busy: false,
      born: 1
    };
    G.actorQ = q;
    G.actorR = r;
    G.cq = q;
    G.cr = r;
    G.placed += 1;
    G.inputLock = 0.1;
    const p = worldOf(q, r);
    emit(10, {
      x: p.x,
      y: p.y,
      j: 8,
      vx0: -40,
      vx1: 40,
      vy0: -50,
      vy1: 10,
      life: 0.32,
      r0: 1,
      r1: 2.4,
      col: rankCol(G.held.rank)
    });
    audio.pulse("place");
    G.held.rank = G.next.rank;
    G.held.rot = G.next.rot;
    const st = stageNow();
    G.next = spawnPiece(st.spawnMax, st.spawn2);
    G.best = Math.max(G.best, highestRank());
    renderHud();
    if (emptyCount() === 0 && !wouldKiss(q, r, c.gem.rank, c.gem.rot) && !adjacentSameRank()) {
      G.pending = "stuck";
      G.pendingT = 0.4;
    }
    return true;
  }

  function moveCursor(dq, dr) {
    if (G.mode !== "play" || G.frozen) return;
    let q = G.cq + dq;
    let r = G.cr + dr;
    for (let i = 0; i < 8; i++) {
      const c = cellAt(q, r);
      if (!c) return;
      if (!c.void) {
        G.cq = q;
        G.cr = r;
        G.hoverQ = q;
        G.hoverR = r;
        audio.pulse("select");
        return;
      }
      q += dq;
      r += dr;
    }
  }

  function renderPips() {
    let html = "";
    const max = G.mode === "title" ? 0 : LIVES;
    for (let i = 0; i < max; i++) {
      const on = i < G.lives ? " on" : "";
      const warn = G.lives === 1 && i === 0 ? " warn" : "";
      html += '<i class="pip' + on + warn + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function renderHud() {
    const st = stageNow();
    if (G.mode === "title") {
      stageLabel.textContent = "";
      goalLabel.textContent = "";
      timeLabel.textContent = "";
      timeLabel.classList.remove("warn");
    } else {
      stageLabel.textContent = (G.stage + 1) + "/" + STAGES.length + " " + st.name + " · " + GLYPH[st.target];
      const nowG = GLYPH[Math.min(5, Math.max(1, G.best))];
      goalLabel.textContent = nowG === GLYPH[st.target]
        ? "目标 " + GLYPH[st.target]
        : "目标 " + GLYPH[st.target] + " · " + nowG;
      const t = Math.max(0, G.remain);
      timeLabel.textContent = t.toFixed(1);
      timeLabel.classList.toggle("warn", t <= 10 && G.mode === "play");
    }
    renderPips();
    const hints = {
      title: "同阶 · 开口相对 · 才会融",
      play: st.hint,
      win: "六合已成 · 再来一局",
      lose: "炉冷了 · 可重开"
    };
    if (G.mode === "play") hintEl.textContent = st.hint;
    else if (G.mode === "win") hintEl.textContent = hints.win;
    else if (G.mode === "lose") hintEl.textContent = hints.lose;
    else hintEl.textContent = hints.title;
  }

  function opsText() {
    return coarse
      ? "点空位落晶 · 点场上晶石旋转 · 左 / 右 转手牌"
      : "点空位落晶 · 点晶石旋转 · WASD 选格 · 空格落/转 · Q/E 转手牌 · M 静音";
  }

  function showOverlay(kind) {
    G.overlay = kind;
    G.frozen = true;
    hideToast();
    overlay.classList.remove("hidden");
    panel.classList.toggle("win", kind === "win");
    panel.classList.toggle("lose", kind === "lose");
    if (kind === "title") {
      ovKicker.textContent = "HEX";
      ovTitle.textContent = "六合";
      ovLead.innerHTML = "同阶晶石要开口对上才会融合。<br />转一转，让亮边吻上。";
      ovOps.textContent = opsText();
      ovBtn.textContent = "开炉";
    } else if (kind === "lose") {
      ovKicker.textContent = G.why === "time" ? "COLD" : "JAM";
      ovTitle.textContent = G.why === "time" ? "炉冷了" : "盘面堵死";
      ovLead.textContent = (G.why === "time"
        ? "时限到了，熔流停了。"
        : "格子满了，没有同阶邻晶可转吻。") +
        " 合了 " + G.fuses + " 次 · 最高 " + GLYPH[Math.min(5, Math.max(1, G.best))] + "。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再熔一次";
    } else if (kind === "win") {
      ovKicker.textContent = "UNITY";
      ovTitle.textContent = "六合已成";
      ovLead.textContent = "五炉都炼出了目标晶。融合 " + G.fuses + " 次 · 命还剩 " + G.lives + "。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    G.frozen = false;
    G.overlay = "";
    ovBtn.blur();
    try { canvas.focus(); } catch (e) { /* ignore */ }
  }

  function loadStage(i, msg, warn) {
    G.stage = i;
    const st = STAGES[i];
    buildBoard(st);
    G.remain = st.time;
    G.held = spawnPiece(st.spawnMax, st.spawn2);
    G.next = spawnPiece(st.spawnMax, st.spawn2);
    G.cq = 0;
    G.cr = 0;
    if (!cellAt(0, 0) || cellAt(0, 0).void) {
      G.cq = st.gems[0] ? st.gems[0].q : 0;
      G.cr = st.gems[0] ? st.gems[0].r : 0;
    }
    G.lock = null;
    G.merge = null;
    G.combo = 0;
    G.comboT = 0;
    G.best = Math.max(1, highestRank());
    G.pending = "";
    G.pendingT = 0;
    G.flash = 0.2;
    G.flashRgb = "0,240,255";
    G.hoverQ = null;
    G.hoverR = null;
    if (G.mode === "play") {
      if (msg) toast(msg, warn ? "warn" : "");
      else toast(st.hint);
    } else {
      hideToast();
    }
    hintEl.textContent = st.hint;
    renderHud();
    relayout();
  }

  function beginRun() {
    G.mode = "play";
    G.lives = LIVES;
    G.fuses = 0;
    G.placed = 0;
    G.best = 1;
    hideOverlay();
    loadStage(0);
    audio.pulse("start");
    renderHud();
  }

  function failRound(why) {
    if (G.mode !== "play") return;
    G.why = why;
    G.shake = 0.4;
    G.flash = 0.45;
    G.flashRgb = "255,61,184";
    audio.pulse("fail");
    G.lives -= 1;
    renderPips();
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.pulse("lose");
      audio.hushDrone();
      showOverlay("lose");
      renderHud();
      return;
    }
    const msg = why === "time" ? "超时 −1 命 · 重炼本炉" : "堵死 −1 命 · 重炼本炉";
    loadStage(G.stage, msg, true);
  }

  function winStage() {
    if (G.mode !== "play") return;
    audio.pulse("clear");
    G.flash = 0.4;
    G.flashRgb = "0,240,255";
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      audio.pulse("win");
      audio.hushDrone();
      showOverlay("win");
      renderHud();
      return;
    }
    toast(STAGES[G.stage].name + " 成 · 下一炉", "gold");
    loadStage(G.stage + 1);
    audio.pulse("start");
  }

  function relayout() {
    layout.portrait = view.h > view.w * 1.02;
    const margin = 14;
    const st = stageNow();
    const rad = st.radius;
    const spanX = SQRT3 * (2 * rad + 1.15);
    const spanY = 1.5 * (2 * rad) + 2.15;
    if (layout.portrait) {
      const tray = Math.max(92, Math.min(132, view.h * 0.2));
      const bw = view.w - margin * 2;
      const bh = view.h - tray - margin * 2;
      layout.size = Math.max(16, Math.min(bw / spanX, bh / spanY));
      layout.ox = view.w * 0.5;
      layout.oy = (view.h - tray) * 0.48 + 4;
      layout.heldS = Math.min(tray * 0.28, 38);
      layout.heldX = view.w * 0.58;
      layout.heldY = view.h - layout.heldS * 1.72;
      layout.nextS = layout.heldS * 0.64;
      layout.nextX = view.w * 0.24;
      layout.nextY = layout.heldY;
    } else {
      const tray = Math.max(108, Math.min(170, view.w * 0.2));
      const bw = view.w - tray - margin * 2;
      const bh = view.h - margin * 2;
      layout.size = Math.max(16, Math.min(bw / spanX, bh / spanY));
      layout.ox = (view.w - tray) * 0.5;
      layout.oy = view.h * 0.52;
      layout.heldS = Math.min(tray * 0.3, 50);
      layout.heldX = view.w - tray * 0.5;
      layout.heldY = view.h * 0.6;
      layout.nextS = layout.heldS * 0.64;
      layout.nextX = layout.heldX;
      layout.nextY = view.h * 0.28;
    }
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
    relayout();
  }

  function pickAt(x, y) {
    const hd = (x - layout.heldX) * (x - layout.heldX) + (y - layout.heldY) * (y - layout.heldY);
    if (hd < layout.heldS * layout.heldS * 2.4) return { type: "held" };
    const nd = (x - layout.nextX) * (x - layout.nextX) + (y - layout.nextY) * (y - layout.nextY);
    if (nd < layout.nextS * layout.nextS * 2.2) return { type: "next" };
    const h = pixelToHex(x - layout.ox, y - layout.oy, layout.size);
    const c = cellAt(h.q, h.r);
    if (!c) return null;
    return { type: "cell", q: h.q, r: h.r, cell: c };
  }

  function eventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches && e.touches[0]
      ? e.touches[0]
      : e.changedTouches && e.changedTouches[0]
        ? e.changedTouches[0]
        : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function hexPath(c, x, y, size) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (60 * i - 30) * Math.PI / 180;
      const px = x + size * Math.cos(a);
      const py = y + size * Math.sin(a);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawWell(x, y, size, voided, hover, cursor) {
    hexPath(ctx, x, y, size * 0.96);
    if (voided) {
      ctx.fillStyle = "rgba(8, 4, 16, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 61, 184, 0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - size * 0.28, y - size * 0.18);
      ctx.lineTo(x + size * 0.28, y + size * 0.18);
      ctx.moveTo(x + size * 0.28, y - size * 0.18);
      ctx.lineTo(x - size * 0.28, y + size * 0.18);
      ctx.strokeStyle = "rgba(255, 61, 184, 0.28)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      return;
    }
    ctx.fillStyle = hover ? "rgba(0, 240, 255, 0.07)" : "rgba(12, 10, 28, 0.7)";
    ctx.fill();
    ctx.strokeStyle = cursor
      ? "rgba(0, 240, 255, 0.85)"
      : hover
        ? "rgba(0, 240, 255, 0.45)"
        : "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = cursor ? 2.2 : 1;
    ctx.stroke();
    if (cursor) {
      ctx.shadowColor = "rgba(0, 240, 255, 0.55)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawGem(x, y, size, rank, rot, opts) {
    opts = opts || {};
    const col = rankCol(rank);
    const alpha = opts.alpha == null ? 1 : opts.alpha;
    const pulse = opts.pulse || 0;
    const t = G.t;
    const s = size * (0.9 + pulse * 0.06) * (opts.scale || 1);
    const light = 0.18 + pulse * 0.12;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (opts.bob) ctx.translate(0, Math.sin(t * 2.1 + opts.bob) * 1.1);

    hexPath(ctx, 0, 0, s);
    ctx.fillStyle = rgb({ r: col.r * 0.18, g: col.g * 0.16, b: col.b * 0.22 }, 0.95);
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const a0 = (60 * i - 30) * Math.PI / 180;
      const a1 = (60 * (i + 1) - 30) * Math.PI / 180;
      const shade = 0.38 + 0.42 * (0.5 + 0.5 * Math.cos(a0 - 0.9)) + light;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a0) * s, Math.sin(a0) * s);
      ctx.lineTo(Math.cos(a1) * s, Math.sin(a1) * s);
      ctx.closePath();
      const k = i === ((Math.round(rot) % 6) + 6) % 6 ? 1.18 : 1;
      ctx.fillStyle = rgb(
        {
          r: Math.min(255, col.r * shade * k),
          g: Math.min(255, col.g * shade * k),
          b: Math.min(255, col.b * shade * k)
        },
        0.92
      );
      ctx.fill();
    }

    hexPath(ctx, 0, 0, s * 0.58);
    const ig = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 0.58);
    ig.addColorStop(0, rgb(INK, rank >= 5 ? 0.28 : 0.14));
    ig.addColorStop(1, rgb(col, 0.12));
    ctx.fillStyle = ig;
    ctx.fill();

    hexPath(ctx, 0, 0, s);
    ctx.strokeStyle = rgb(col, 0.85);
    ctx.lineWidth = rank >= 5 ? 2.4 : 1.6;
    ctx.shadowColor = rgb(col, 0.7);
    ctx.shadowBlur = 10 + pulse * 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (rank >= 5) {
      hexPath(ctx, 0, 0, s * (0.72 + Math.sin(t * 4) * 0.04));
      ctx.strokeStyle = rgb(MAG, 0.55);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.rotate(t * 0.4);
      hexPath(ctx, 0, 0, s * 0.34);
      ctx.strokeStyle = rgb(CYN, 0.7);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.rotate(-t * 0.4);
    }

    const vr = visRot({ rot: rot, spin: opts.spin || 0 });
    const a = vr * TAU / 6;
    const er = s * SQRT3 * 0.5;
    const mx = Math.cos(a) * er;
    const my = Math.sin(a) * er;
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    const tx = -ny;
    const ty = nx;
    const mouth = rank >= 5 ? CYN : col;
    const a0 = a - Math.PI / 6;
    const a1 = a + Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a0) * s, Math.sin(a0) * s);
    ctx.lineTo(Math.cos(a1) * s, Math.sin(a1) * s);
    ctx.strokeStyle = rgb(mouth, 0.95);
    ctx.lineWidth = Math.max(3, s * 0.11);
    ctx.lineCap = "round";
    ctx.shadowColor = rgb(mouth, 1);
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(mx + tx * s * 0.3, my + ty * s * 0.3);
    ctx.lineTo(mx + nx * s * 0.26, my + ny * s * 0.26);
    ctx.lineTo(mx - tx * s * 0.3, my - ty * s * 0.3);
    ctx.closePath();
    ctx.fillStyle = rgb(mouth, 0.96);
    ctx.shadowColor = rgb(mouth, 1);
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgb(INK, 0.55);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(mx * 0.55, my * 0.55, Math.max(2.2, s * 0.08), 0, TAU);
    ctx.fillStyle = rgb(INK, 0.8);
    ctx.fill();

    ctx.fillStyle = rgb(INK, 0.92);
    ctx.font = "700 " + Math.max(11, s * 0.42) + "px 'Segoe UI', 'PingFang SC', 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = rgb(col, 0.8);
    ctx.shadowBlur = 8;
    ctx.fillText(GLYPH[rank] || String(rank), 0, 1);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function drawKissHint(q, r, d, hot, col) {
    const p = worldOf(q, r);
    const m = edgeMid(p.x, p.y, layout.size, d, layout.size * SQRT3 * 0.5);
    ctx.beginPath();
    ctx.arc(m.x, m.y, hot ? 7 : 4, 0, TAU);
    ctx.fillStyle = rgb(hot ? GOLD : col, hot ? 0.85 : 0.35);
    if (hot) {
      ctx.shadowColor = rgb(GOLD, 0.9);
      ctx.shadowBlur = 12;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawBoard() {
    const st = stageNow();
    const rad = st.radius;
    for (let q = -rad - 1; q <= rad + 1; q++) {
      for (let r = Math.max(-rad - 1, -q - rad - 1); r <= Math.min(rad + 1, -q + rad + 1); r++) {
        if (inRadius(q, r, rad)) continue;
        if (!inRadius(q, r, rad + 1)) continue;
        const p = worldOf(q, r);
        hexPath(ctx, p.x, p.y, layout.size * 0.9);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.045)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    for (let i = 0; i < G.order.length; i++) {
      const c = G.cells[G.order[i]];
      const p = worldOf(c.q, c.r);
      const hover = G.hoverQ === c.q && G.hoverR === c.r;
      const cur = G.mode === "play" && G.cq === c.q && G.cr === c.r;
      drawWell(p.x, p.y, layout.size, c.void, hover, cur && !c.void);
    }

    for (let i = 0; i < G.order.length; i++) {
      const c = G.cells[G.order[i]];
      if (!c.gem || (G.merge && ((c.q === G.merge.aq && c.r === G.merge.ar) || (c.q === G.merge.bq && c.r === G.merge.br)))) continue;
      const g = c.gem;
      const p = worldOf(c.q, c.r);
      const d = ((g.rot % 6) + 6) % 6;
      const nb = gemAt(c.q + DIRS[d][0], c.r + DIRS[d][1]);
      if (nb && nb.rank === g.rank) {
        const facing = nb.rot === (d + 3) % 6;
        drawKissHint(c.q, c.r, d, facing, rankCol(g.rank));
      }
      for (let k = 0; k < 6; k++) {
        if (k === d) continue;
        const n = gemAt(c.q + DIRS[k][0], c.r + DIRS[k][1]);
        if (n && n.rank === g.rank && n.rot === (k + 3) % 6) {
          drawKissHint(c.q, c.r, k, false, rankCol(g.rank));
        }
      }
    }

    if (G.lock) {
      const pa = worldOf(G.lock.aq, G.lock.ar);
      const pb = worldOf(G.lock.bq, G.lock.br);
      const u = easeInOut(G.lock.t / LOCK);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = rgb(GOLD, 0.25 + u * 0.55);
      ctx.lineWidth = 3 + u * 4;
      ctx.shadowColor = rgb(GOLD, 0.8);
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (let i = 0; i < G.order.length; i++) {
      const c = G.cells[G.order[i]];
      if (!c.gem) continue;
      if (G.merge && ((c.q === G.merge.aq && c.r === G.merge.ar) || (c.q === G.merge.bq && c.r === G.merge.br))) continue;
      const g = c.gem;
      const p = worldOf(c.q, c.r);
      drawGem(p.x, p.y, layout.size, g.rank, visRot(g), {
        pulse: g.pulse,
        spin: 0,
        scale: 0.82 + g.born * 0.08,
        bob: c.q * 1.7 + c.r
      });
    }

    if (G.merge) {
      const m = G.merge;
      const pa = worldOf(m.aq, m.ar);
      const pb = worldOf(m.bq, m.br);
      const pk = worldOf(m.kq, m.kr);
      const u = easeInOut(clamp(m.t / MERGE_T, 0, 1));
      const mx = lerp((pa.x + pb.x) * 0.5, pk.x, Math.max(0, (u - 0.55) / 0.45));
      const my = lerp((pa.y + pb.y) * 0.5, pk.y, Math.max(0, (u - 0.55) / 0.45));
      const pull = Math.min(1, u / 0.55);
      const ax = lerp(pa.x, (pa.x + pb.x) * 0.5, pull * 0.55);
      const ay = lerp(pa.y, (pa.y + pb.y) * 0.5, pull * 0.55);
      const bx = lerp(pb.x, (pa.x + pb.x) * 0.5, pull * 0.55);
      const by = lerp(pb.y, (pa.y + pb.y) * 0.5, pull * 0.55);
      const ga = gemAt(m.aq, m.ar);
      const gb = gemAt(m.bq, m.br);
      if (u < 0.62 && ga && gb) {
        drawGem(ax, ay, layout.size, ga.rank, visRot(ga), { pulse: 1, scale: 0.86 * (1 - pull * 0.25), alpha: 1 - pull * 0.2 });
        drawGem(bx, by, layout.size, gb.rank, visRot(gb), { pulse: 1, scale: 0.86 * (1 - pull * 0.25), alpha: 1 - pull * 0.2 });
      }
      const popS = u < 0.55 ? 0 : easeOut((u - 0.55) / 0.45);
      if (u > 0.4) {
        drawGem(mx, my, layout.size, m.rank, m.rot, {
          pulse: 1,
          scale: 0.4 + popS * 0.55,
          alpha: clamp((u - 0.4) / 0.25, 0, 1)
        });
      }
    }

    if (G.mode === "play" && !G.frozen) {
      const hq = G.cq;
      const hr = G.cr;
      const hc = cellAt(hq, hr);
      if (hc && !hc.void && !hc.gem && !(G.merge && ((hq === G.merge.aq && hr === G.merge.ar) || (hq === G.merge.bq && hr === G.merge.br)))) {
        const p = worldOf(hq, hr);
        drawGem(p.x, p.y, layout.size, G.held.rank, G.held.rot, { alpha: 0.42, pulse: 0.4, scale: 0.86 });
        const kiss = wouldKiss(hq, hr, G.held.rank, G.held.rot);
        if (kiss) {
          drawKissHint(hq, hr, kiss.d, true, GOLD);
          const np = worldOf(kiss.q, kiss.r);
          hexPath(ctx, np.x, np.y, layout.size * 0.98);
          ctx.strokeStyle = rgb(GOLD, 0.55 + Math.sin(G.t * 8) * 0.2);
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          const d = G.held.rot;
          const n = gemAt(hq + DIRS[d][0], hr + DIRS[d][1]);
          if (n && n.rank === G.held.rank) drawKissHint(hq, hr, d, false, rankCol(G.held.rank));
        }
      }
    }
  }

  function drawTray() {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "600 11px 'Segoe UI', 'PingFang SC', 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("下一枚", layout.nextX, layout.nextY - layout.nextS - 6);
    ctx.fillStyle = "rgba(0,240,255,0.7)";
    ctx.fillText("手牌", layout.heldX, layout.heldY - layout.heldS - 6);
    ctx.restore();

    hexPath(ctx, layout.nextX, layout.nextY, layout.nextS * 1.25);
    ctx.fillStyle = "rgba(8,8,20,0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.stroke();
    drawGem(layout.nextX, layout.nextY, layout.nextS, G.next.rank, G.next.rot, { alpha: 0.7, pulse: 0.15, scale: 0.92 });

    hexPath(ctx, layout.heldX, layout.heldY, layout.heldS * 1.35);
    ctx.fillStyle = G.hoverHeld ? "rgba(0,240,255,0.08)" : "rgba(8,8,20,0.55)";
    ctx.fill();
    ctx.strokeStyle = rgb(CYN, G.hoverHeld ? 0.55 : 0.22);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    drawGem(layout.heldX, layout.heldY, layout.heldS, G.held.rank, G.held.rot, {
      pulse: 0.35 + Math.sin(G.t * 3) * 0.1,
      scale: 0.95,
      bob: 0.2
    });
  }

  function drawFx() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const u = p.life / p.max;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * u, 0, TAU);
      ctx.fillStyle = rgb(p.col, 0.15 + u * 0.7);
      ctx.fill();
    }
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const u = p.life;
      ctx.save();
      ctx.globalAlpha = clamp(u * 1.4, 0, 1);
      ctx.fillStyle = p.kind === 2 ? rgb(GOLD) : p.kind === 1 ? rgb(CYN) : rgb(INK);
      ctx.font = "800 " + (16 + (1 - u) * 8) + "px 'Segoe UI', 'PingFang SC', 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = p.kind === 2 ? rgb(GOLD, 0.8) : rgb(CYN, 0.7);
      ctx.shadowBlur = 12;
      ctx.fillText(p.text, p.x, p.y - (1 - u) * 28);
      ctx.restore();
    }
  }

  function drawBg() {
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, view.w, view.h);
    const g1 = ctx.createRadialGradient(view.w * 0.2, view.h * 0.05, 10, view.w * 0.2, 0, view.w * 0.7);
    g1.addColorStop(0, "rgba(255,61,184,0.13)");
    g1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, view.w, view.h);
    const g2 = ctx.createRadialGradient(view.w * 0.9, view.h * 0.1, 10, view.w, 0, view.w * 0.65);
    g2.addColorStop(0, "rgba(0,240,255,0.1)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, view.w, view.h);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = ((m.x + Math.sin(G.t * m.s + m.p) * 0.03) * view.w + view.w) % view.w;
      const y = ((m.y + G.t * m.s * 0.04) % 1) * view.h;
      if (m.hex) {
        hexPath(ctx, x, y, 4 + m.r * 2);
        ctx.strokeStyle = "rgba(0,240,255," + m.a * 0.45 + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, m.r, 0, TAU);
        ctx.fillStyle = "rgba(255,61,184," + m.a + ")";
        ctx.fill();
      }
    }
  }

  function draw() {
    drawBg();
    const shx = G.shake > 0 ? (Math.random() - 0.5) * 10 * G.shake : 0;
    const shy = G.shake > 0 ? (Math.random() - 0.5) * 10 * G.shake : 0;
    ctx.save();
    ctx.translate(shx, shy);
    drawBoard();
    drawTray();
    drawFx();
    ctx.restore();
    if (G.flash > 0) {
      ctx.fillStyle = "rgba(" + G.flashRgb + "," + (G.flash * 0.22) + ")";
      ctx.fillRect(0, 0, view.w, view.h);
    }
    if (G.paused && G.mode === "play" && !G.frozen) {
      ctx.fillStyle = "rgba(3,1,10,0.45)";
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.fillStyle = rgb(CYN, 0.9);
      ctx.font = "700 18px 'Segoe UI', 'PingFang SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("暂停", view.w * 0.5, view.h * 0.48);
    }
  }

  function tickMouthSparks() {
    if (Math.random() > 0.45) return;
    for (let i = 0; i < G.order.length; i++) {
      const c = G.cells[G.order[i]];
      if (!c.gem || Math.random() > 0.08) continue;
      const p = worldOf(c.q, c.r);
      const m = edgeMid(p.x, p.y, layout.size, visRot(c.gem), layout.size * 0.48);
      emit(1, {
        x: m.x,
        y: m.y,
        j: 2,
        vx0: -12,
        vx1: 12,
        vy0: -18,
        vy1: 6,
        life: 0.4,
        r0: 0.8,
        r1: 1.6,
        col: rankCol(c.gem.rank)
      });
    }
  }

  function step(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.4);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.inputLock > 0) G.inputLock = Math.max(0, G.inputLock - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) G.combo = 0;
    }

    for (let i = 0; i < G.order.length; i++) {
      const g = G.cells[G.order[i]].gem;
      if (!g) continue;
      if (g.pulse > 0) g.pulse = Math.max(0, g.pulse - dt * 1.6);
      if (g.born > 0) g.born = Math.max(0, g.born - dt * 2.2);
      if (g.spin > 0) g.spin = Math.max(0, g.spin - dt * 8);
      else if (g.spin < 0) g.spin = Math.min(0, g.spin + dt * 8);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].life -= dt;
      if (pops[i].life <= 0) pops.splice(i, 1);
    }

    const live = G.mode === "play" && !G.frozen && !G.paused;
    audio.tickDrone(live, G.best || 1);
    G.hudTick += dt;
    if (G.hudTick >= 0.12) {
      G.hudTick = 0;
      if (G.mode !== "title") renderHud();
    }

    if (!live) return;

    G.remain -= dt;
    if (G.remain <= 10.05 && G.remain + dt > 10.05) audio.pulse("tick");
    if (G.remain <= 5.02 && G.remain + dt > 5.02) audio.pulse("tick");
    if (G.remain <= 0) {
      G.remain = 0;
      const winning = G.pending === "win" ||
        highestRank() >= stageNow().target ||
        (G.merge && G.merge.rank >= stageNow().target);
      if (!winning) {
        failRound("time");
        return;
      }
    }

    tickMouthSparks();

    if (G.merge) {
      G.merge.t += dt;
      if (G.merge.t >= MERGE_T) finishMerge();
    } else if (G.pending) {
      G.pendingT -= dt;
      if (G.pendingT <= 0) {
        const p = G.pending;
        G.pending = "";
        if (p === "win") winStage();
        else if (p === "stuck") failRound("stuck");
      }
    } else {
      const pairs = findKisses();
      if (G.lock) {
        let still = false;
        for (let i = 0; i < pairs.length; i++) {
          if (pairs[i].id === G.lock.id) {
            still = true;
            break;
          }
        }
        if (!still) G.lock = null;
        else {
          G.lock.t += dt;
          if (G.lock.t >= LOCK) startMerge(G.lock);
        }
      } else if (pairs.length) {
        const p = preferPair(pairs);
        G.lock = p;
        G.lock.t = 0;
        audio.pulse("lock");
      }
    }
  }

  let last = 0;
  let acc = 0;
  function loop(now) {
    const t = now * 0.001;
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    if (acc > 0.2) acc = 0.2;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(loop);
  }

  function onCanvasDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.frozen) return;
    const p = eventPos(e);
    ptr.down = true;
    ptr.x = p.x;
    ptr.y = p.y;
    ptr.sx = p.x;
    ptr.sy = p.y;
    if (e.pointerId != null && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }

  function onCanvasMove(e) {
    const p = eventPos(e);
    ptr.x = p.x;
    ptr.y = p.y;
    const hit = pickAt(p.x, p.y);
    G.hoverHeld = !!(hit && hit.type === "held");
    if (hit && hit.type === "cell" && !hit.cell.void) {
      G.hoverQ = hit.q;
      G.hoverR = hit.r;
      if (G.mode === "play" && !G.frozen) {
        G.cq = hit.q;
        G.cr = hit.r;
      }
    } else if (!hit || hit.type !== "cell") {
      G.hoverQ = null;
      G.hoverR = null;
    }
  }

  function onCanvasUp(e) {
    if (!ptr.down) return;
    ptr.down = false;
    if (G.frozen) return;
    const p = eventPos(e);
    const dist = Math.hypot(p.x - ptr.sx, p.y - ptr.sy);
    if (dist > 18) return;
    if (e.button === 2) return;
    const hit = pickAt(p.x, p.y);
    if (!hit) return;
    if (hit.type === "held" || hit.type === "next") {
      rotateHeld(1);
      return;
    }
    if (hit.type === "cell") placeAt(hit.q, hit.r);
  }

  function onWheel(e) {
    if (G.mode !== "play" || G.frozen) return;
    e.preventDefault();
    rotateHeld(e.deltaY > 0 ? 1 : -1);
  }

  function onKey(e) {
    const k = e.key;
    if (k === "m" || k === "M") {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === "r" || k === "R") {
      e.preventDefault();
      audio.ensure();
      beginRun();
      return;
    }
    if (G.frozen) {
      if (k === "Enter" || k === " " || k === "Spacebar") {
        e.preventDefault();
        audio.ensure();
        if (G.overlay === "title" || G.overlay === "lose" || G.overlay === "win") beginRun();
      }
      return;
    }
    if (G.mode !== "play") return;
    if (k === "q" || k === "Q" || k === "[" || k === "z" || k === "Z") {
      e.preventDefault();
      rotateHeld(-1);
    } else if (k === "e" || k === "E" || k === "]" || k === "x" || k === "X") {
      e.preventDefault();
      rotateHeld(1);
    } else if (k === " " || k === "Spacebar" || k === "Enter") {
      e.preventDefault();
      placeAt(G.cq, G.cr);
    } else if (k === "a" || k === "A" || k === "ArrowLeft") {
      e.preventDefault();
      moveCursor(-1, 0);
    } else if (k === "d" || k === "D" || k === "ArrowRight") {
      e.preventDefault();
      moveCursor(1, 0);
    } else if (k === "w" || k === "W" || k === "ArrowUp") {
      e.preventDefault();
      moveCursor(0, -1);
    } else if (k === "s" || k === "S" || k === "ArrowDown") {
      e.preventDefault();
      moveCursor(0, 1);
    } else if (k === "Home" || k === "q") {
      /* handled */
    }
  }

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    beginRun();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    beginRun();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnCcw.addEventListener("click", function () {
    audio.ensure();
    rotateHeld(-1);
  });
  btnCw.addEventListener("click", function () {
    audio.ensure();
    rotateHeld(1);
  });

  canvas.addEventListener("pointerdown", onCanvasDown);
  canvas.addEventListener("pointermove", onCanvasMove);
  canvas.addEventListener("pointerup", onCanvasUp);
  canvas.addEventListener("pointercancel", function () { ptr.down = false; });
  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    if (G.frozen) return;
    const p = eventPos(e);
    const hit = pickAt(p.x, p.y);
    if (!hit) {
      rotateHeld(-1);
      return;
    }
    if (hit.type === "held" || hit.type === "next") rotateHeld(-1);
    else if (hit.type === "cell" && hit.cell.gem) rotateGem(hit.q, hit.r, -1);
    else rotateHeld(-1);
  });
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (document.hidden) audio.hushDrone();
  });

  makeMotes();
  loadStage(0);
  G.mode = "title";
  showOverlay("title");
  renderHud();
  resize();
  requestAnimationFrame(loop);
})();
