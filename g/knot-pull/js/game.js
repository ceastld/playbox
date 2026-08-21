(() => {
  "use strict";

  const LIVES = 3;
  const MAX_TEN = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-knot-pull-mute";
  const SAMPLES = 80;
  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };
  const PAL = [
    { r: 255, g: 61, b: 184 },
    { r: 0, g: 240, b: 255 },
    { r: 255, g: 227, b: 107 },
    { r: 199, g: 125, b: 255 },
    { r: 61, g: 255, b: 166 },
    { r: 255, g: 154, b: 86 }
  ];

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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgb(c, a) {
    return a == null
      ? "rgb(" + c.r + "," + c.g + "," + c.b + ")"
      : "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }
  function hash(n) {
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  const STAGES = [
    {
      name: "初结",
      sub: "FIRST",
      time: 40,
      hint: "抓住发光的结，往外抽出",
      toast: "向外拖出这个结，或按空格抽取",
      knots: [
        { x: 0.50, y: 0.52, rx: 0.30, ry: 0.20, twist: -0.55, col: 0 }
      ]
    },
    {
      name: "双叠",
      sub: "TWO",
      time: 38,
      hint: "交叉处完整的绳在上。先抽上面那根",
      toast: "青色在下：断开处是被压住的",
      knots: [
        { x: 0.57, y: 0.40, rx: 0.25, ry: 0.16, twist: 0.2, col: 0 },
        { x: 0.41, y: 0.61, rx: 0.25, ry: 0.16, twist: 0.15, col: 1 }
      ]
    },
    {
      name: "三环",
      sub: "CHAIN",
      time: 42,
      hint: "一层压一层，从最上面抽起",
      toast: "粉压青，青压金。先抽最完整的那根",
      knots: [
        { x: 0.22, y: 0.50, rx: 0.20, ry: 0.15, twist: 0.05, col: 0 },
        { x: 0.50, y: 0.50, rx: 0.20, ry: 0.15, twist: 0.05, col: 1 },
        { x: 0.78, y: 0.50, rx: 0.20, ry: 0.15, twist: 0.05, col: 2 }
      ]
    },
    {
      name: "双松",
      sub: "FORK",
      time: 42,
      hint: "两根都压着底下。先抽任意一根面结",
      toast: "粉和青都不互相压，谁先抽都行",
      knots: [
        { x: 0.27, y: 0.32, rx: 0.19, ry: 0.14, twist: 0.1, col: 0 },
        { x: 0.73, y: 0.32, rx: 0.19, ry: 0.14, twist: -0.1, col: 1 },
        { x: 0.50, y: 0.64, rx: 0.26, ry: 0.18, twist: 0.05, col: 2 }
      ]
    },
    {
      name: "菱压",
      sub: "DIAMOND",
      time: 48,
      hint: "顶结松开后，左右都能抽",
      toast: "先抽顶上的粉结，再解左右",
      knots: [
        { x: 0.50, y: 0.24, rx: 0.19, ry: 0.14, twist: 0.0, col: 0 },
        { x: 0.26, y: 0.50, rx: 0.19, ry: 0.14, twist: 0.05, col: 1 },
        { x: 0.74, y: 0.50, rx: 0.19, ry: 0.14, twist: -0.05, col: 2 },
        { x: 0.50, y: 0.76, rx: 0.19, ry: 0.14, twist: 0.0, col: 3 }
      ]
    },
    {
      name: "内扣",
      sub: "NEST",
      time: 48,
      hint: "圈在里面的不一定能抽。看出头的绳",
      toast: "金环最大，却压着其余。先抽金",
      knots: [
        { x: 0.50, y: 0.48, rx: 0.32, ry: 0.23, twist: -0.4, col: 2 },
        { x: 0.33, y: 0.48, rx: 0.17, ry: 0.13, twist: 0.15, col: 0 },
        { x: 0.70, y: 0.34, rx: 0.16, ry: 0.12, twist: -0.2, col: 1 },
        { x: 0.50, y: 0.72, rx: 0.17, ry: 0.13, twist: 0.0, col: 3 }
      ]
    },
    {
      name: "双链",
      sub: "SPLIT",
      time: 52,
      hint: "两条链汇到一处。勒两下就会发烫",
      toast: "左右各一条链，都压着底结",
      knots: [
        { x: 0.24, y: 0.26, rx: 0.17, ry: 0.13, twist: 0.12, col: 0 },
        { x: 0.30, y: 0.50, rx: 0.18, ry: 0.13, twist: 0.08, col: 1 },
        { x: 0.76, y: 0.26, rx: 0.17, ry: 0.13, twist: -0.12, col: 2 },
        { x: 0.70, y: 0.50, rx: 0.18, ry: 0.13, twist: -0.08, col: 4 },
        { x: 0.50, y: 0.74, rx: 0.21, ry: 0.14, twist: 0.0, col: 3 }
      ]
    },
    {
      name: "错纬",
      sub: "WEAVE",
      time: 50,
      hint: "面结可能有两颗。看清所有交叉再抽",
      toast: "粉和青都不被压。抽错会勒紧它们",
      knots: [
        { x: 0.28, y: 0.26, rx: 0.19, ry: 0.15, twist: 0.1, col: 0 },
        { x: 0.72, y: 0.26, rx: 0.19, ry: 0.15, twist: -0.1, col: 1 },
        { x: 0.50, y: 0.48, rx: 0.18, ry: 0.13, twist: 0.05, col: 2 },
        { x: 0.30, y: 0.62, rx: 0.18, ry: 0.14, twist: 0.08, col: 3 },
        { x: 0.70, y: 0.62, rx: 0.18, ry: 0.14, twist: -0.08, col: 4 }
      ]
    },
    {
      name: "六绞",
      sub: "HEX",
      time: 55,
      hint: "六结绞在一起。先找完全不被压的那颗",
      toast: "从外到内剥。勒三下就会崩",
      knots: [
        { x: 0.50, y: 0.24, rx: 0.18, ry: 0.13, twist: 0.0, col: 0 },
        { x: 0.28, y: 0.40, rx: 0.17, ry: 0.13, twist: 0.1, col: 1 },
        { x: 0.72, y: 0.40, rx: 0.17, ry: 0.13, twist: -0.1, col: 2 },
        { x: 0.28, y: 0.64, rx: 0.17, ry: 0.13, twist: 0.05, col: 3 },
        { x: 0.72, y: 0.64, rx: 0.17, ry: 0.13, twist: -0.05, col: 4 },
        { x: 0.50, y: 0.80, rx: 0.18, ry: 0.13, twist: 0.0, col: 5 }
      ]
    },
    {
      name: "终抽",
      sub: "FINAL",
      time: 60,
      hint: "最后一结。交叉会骗人，跟完整的绳走",
      toast: "顶结一松，左右才能动。别抽被压的",
      knots: [
        { x: 0.50, y: 0.22, rx: 0.20, ry: 0.15, twist: 0.0, col: 0 },
        { x: 0.32, y: 0.40, rx: 0.19, ry: 0.14, twist: 0.08, col: 1 },
        { x: 0.68, y: 0.40, rx: 0.19, ry: 0.14, twist: -0.08, col: 2 },
        { x: 0.32, y: 0.62, rx: 0.19, ry: 0.14, twist: 0.06, col: 3 },
        { x: 0.68, y: 0.62, rx: 0.19, ry: 0.14, twist: -0.06, col: 4 },
        { x: 0.50, y: 0.82, rx: 0.20, ry: 0.15, twist: 0.0, col: 5 }
      ]
    }
  ];

  function isDag(n, pins) {
    const adj = [];
    const indeg = [];
    for (let i = 0; i < n; i++) {
      adj[i] = [];
      indeg[i] = 0;
    }
    for (let i = 0; i < pins.length; i++) {
      const a = pins[i][0];
      const b = pins[i][1];
      adj[a].push(b);
      indeg[b] += 1;
    }
    const q = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
    let seen = 0;
    while (q.length) {
      const u = q.pop();
      seen += 1;
      for (let i = 0; i < adj[u].length; i++) {
        const v = adj[u][i];
        indeg[v] -= 1;
        if (indeg[v] === 0) q.push(v);
      }
    }
    return seen === n;
  }

  function mapBoard(def, w, h) {
    const side = Math.min(w, h) * 0.84;
    const ox = (w - side) * 0.5;
    const oy = (h - side) * 0.5;
    const lcx = ox + def.x * side;
    const lcy = oy + def.y * side;
    const rot = Math.atan2(def.y - 0.5, def.x - 0.5) + (def.twist || 0);
    return {
      lcx: lcx,
      lcy: lcy,
      rx: def.rx * side,
      ry: def.ry * side,
      rot: rot,
      side: side
    };
  }

  function ellipsePoint(geo, t, scale) {
    scale = scale == null ? 1 : scale;
    const lx = geo.rx * scale * Math.cos(t);
    const ly = geo.ry * scale * Math.sin(t);
    const ca = Math.cos(geo.rot);
    const sa = Math.sin(geo.rot);
    return {
      x: geo.lcx + lx * ca - ly * sa,
      y: geo.lcy + lx * sa + ly * ca
    };
  }

  function sampleRest(geo, n) {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(ellipsePoint(geo, (i / n) * TAU, 1));
    return pts;
  }

  function pairMinDist(a, b) {
    const pa = sampleRest(a, SAMPLES);
    const pb = sampleRest(b, SAMPLES);
    let best = 1e9;
    for (let i = 0; i < pa.length; i++) {
      for (let j = 0; j < pb.length; j++) {
        const d = hypot(pa[i].x - pb[j].x, pa[i].y - pb[j].y);
        if (d < best) best = d;
      }
    }
    return best;
  }

  function pinsFor(st) {
    if (st._pins) return st._pins;
    const W = 800;
    const H = 800;
    const n = st.knots.length;
    const geos = [];
    for (let i = 0; i < n; i++) geos.push(mapBoard(st.knots[i], W, H));
    const side = Math.min(W, H) * 0.84;
    const th = side * 0.028;
    const pins = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = pairMinDist(geos[i], geos[j]);
        if (d < th) {
          const zi = st.knots[i].z != null ? st.knots[i].z : i;
          const zj = st.knots[j].z != null ? st.knots[j].z : j;
          if (zi <= zj) pins.push([i, j]);
          else pins.push([j, i]);
        }
      }
    }
    st._pins = pins;
    return pins;
  }

  function findCrossings(a, b, n) {
    const pa = sampleRest(a, n);
    const pb = sampleRest(b, n);
    const dA = [];
    for (let i = 0; i < n; i++) {
      let best = 1e9;
      let bj = 0;
      for (let j = 0; j < n; j++) {
        const d = hypot(pa[i].x - pb[j].x, pa[i].y - pb[j].y);
        if (d < best) {
          best = d;
          bj = j;
        }
      }
      dA.push({ d: best, j: bj });
    }
    const raw = [];
    for (let i = 0; i < n; i++) {
      const prev = dA[(i - 1 + n) % n].d;
      const cur = dA[i].d;
      const next = dA[(i + 1) % n].d;
      if (cur <= prev && cur <= next && cur < 36) {
        const j = dA[i].j;
        raw.push({
          x: (pa[i].x + pb[j].x) * 0.5,
          y: (pa[i].y + pb[j].y) * 0.5,
          d: cur
        });
      }
    }
    const hits = [];
    for (let i = 0; i < raw.length; i++) {
      let keep = true;
      for (let j = 0; j < hits.length; j++) {
        if (hypot(raw[i].x - hits[j].x, raw[i].y - hits[j].y) < 18) {
          if (raw[i].d < hits[j].d) hits[j] = raw[i];
          keep = false;
          break;
        }
      }
      if (keep) hits.push(raw[i]);
    }
    return hits;
  }

  function validateStages() {
    const errs = [];
    if (STAGES.length < 8) errs.push("need 8+ stages");
    for (let s = 0; s < STAGES.length; s++) {
      const st = STAGES[s];
      const n = st.knots.length;
      const pins = pinsFor(st);
      if (!isDag(n, pins)) errs.push("cycle " + s + " " + st.name);
      if (s > 0 && pins.length < 1) errs.push("no pins " + s);
      const geos = [];
      for (let i = 0; i < n; i++) geos.push(mapBoard(st.knots[i], 800, 800));
      for (let i = 0; i < pins.length; i++) {
        const hits = findCrossings(geos[pins[i][0]], geos[pins[i][1]], SAMPLES);
        if (!hits.length) errs.push("no viz " + s + " " + pins[i][0] + ">" + pins[i][1]);
      }
      let free = 0;
      const held = [];
      for (let i = 0; i < n; i++) held[i] = 0;
      for (let i = 0; i < pins.length; i++) held[pins[i][1]] += 1;
      for (let i = 0; i < n; i++) if (!held[i]) free += 1;
      if (free < 1) errs.push("no free " + s);
      const seen = {};
      for (let i = 0; i < n; i++) {
        const k = st.knots[i];
        if (k.x < 0.12 || k.x > 0.88 || k.y < 0.12 || k.y > 0.88) {
          errs.push("out of board " + s + " knot " + i);
        }
      }
      for (let i = 0; i < pins.length; i++) {
        const key = pins[i][0] + ">" + pins[i][1];
        if (seen[key]) errs.push("dup pin " + s + " " + key);
        seen[key] = 1;
      }
    }
    return errs;
  }

  if (typeof document === "undefined") {
    const errs = validateStages();
    if (errs.length) {
      console.error(errs.join("\n"));
      throw new Error("stage validation failed (" + errs.length + ")");
    }
    for (let s = 0; s < STAGES.length; s++) {
      const pins = pinsFor(STAGES[s]);
      const held = [];
      const n = STAGES[s].knots.length;
      for (let i = 0; i < n; i++) held[i] = 0;
      for (let i = 0; i < pins.length; i++) held[pins[i][1]] += 1;
      const free = [];
      for (let i = 0; i < n; i++) if (!held[i]) free.push(i);
      console.log(
        s + " " + STAGES[s].name + " n=" + n + " pins=" + pins.length +
        " free=[" + free.join(",") + "] " +
        pins.map(function (p) { return p[0] + ">" + p[1]; }).join(" ")
      );
    }
    console.log("knot-pull ok", STAGES.length);
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
  const leftLabel = document.getElementById("left-label");
  const tenLabel = document.getElementById("ten-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const btnPull = document.getElementById("btn-pull");

  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  const view = { w: 1, h: 1, dpr: 1 };
  const particles = [];
  const motes = [];
  const ripples = [];
  const sparks = [];

  const G = {
    mode: "title",
    stage: 0,
    lives: LIVES,
    time: 0,
    knots: [],
    sel: 0,
    lock: 0,
    t: 0,
    clock: 0,
    shake: 0,
    flash: 0,
    flashRgb: "0,240,255",
    toastT: 0,
    paused: false,
    phase: "play",
    phaseT: 0,
    dragId: -1,
    dragAmt: 0,
    keyPull: 0,
    snapId: -1,
    wasSel: false
  };

  const ptr = { id: null, x: 0, y: 0, down: false };

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
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
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
      o.stop(t + dur + 0.02);
    },
    noise: function (dur, vol, from, to) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const n = this.ctx.createBuffer(1, (this.ctx.sampleRate * dur) | 0, this.ctx.sampleRate);
      const d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = n;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(from, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    pulse: function (kind) {
      this.ensure();
      if (kind === "select") {
        this.beep(640, 0.03, "sine", 0.02);
      } else if (kind === "deny") {
        this.beep(140, 0.1, "square", 0.04, 80);
      } else if (kind === "stretch") {
        this.beep(180 + Math.random() * 40, 0.05, "sine", 0.02, 260);
      } else if (kind === "free") {
        this.beep(392, 0.08, "sine", 0.05, 784);
        this.beep(588, 0.16, "triangle", 0.04, 980);
        this.noise(0.12, 0.04, 900, 400);
      } else if (kind === "cinch") {
        this.beep(220, 0.16, "sawtooth", 0.05, 90);
        this.beep(140, 0.22, "square", 0.035, 70);
        this.noise(0.14, 0.05, 400, 120);
      } else if (kind === "snap") {
        this.noise(0.28, 0.1, 1200, 80);
        this.beep(90, 0.45, "sawtooth", 0.08, 40);
      } else if (kind === "win") {
        this.beep(523, 0.16, "sine", 0.09, 784);
        this.beep(659, 0.28, "triangle", 0.07, 1046);
        this.beep(784, 0.4, "sine", 0.05, 1174);
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
        this.beep(660, 0.2, "sine", 0.05, 1320);
      } else if (kind === "spark") {
        this.beep(740 + Math.random() * 200, 0.04, "sine", 0.016, 420);
      }
    },
    tickDrone: function (play, ten) {
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
      this.drone.frequency.setTargetAtTime(play ? 46 + ten * 9 : 44, t, 0.14);
      this.droneGain.gain.setTargetAtTime(play ? 0.016 + ten * 0.01 : 0.0001, t, 0.2);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + (Math.random() - 0.5) * spec.j,
        y: spec.y + (Math.random() - 0.5) * spec.j,
        vx: lerp(spec.vx0, spec.vx1, Math.random()),
        vy: lerp(spec.vy0, spec.vy1, Math.random()),
        life: spec.life * (0.7 + Math.random() * 0.45),
        max: spec.life,
        r: lerp(spec.r0, spec.r1, Math.random()),
        col: spec.col
      });
    }
  }

  function ripple(x, y, mag) {
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: mag ? 64 : 42, t: 1, mag: mag });
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.5;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 56; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.22 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.12 + 0.03
      });
    }
  }

  function stageNow() {
    return STAGES[G.stage];
  }

  function active(k) {
    return k && !k.gone && k.extract <= 0;
  }

  function holdersOf(k) {
    const pins = pinsFor(stageNow());
    const out = [];
    for (let i = 0; i < pins.length; i++) {
      const p = pins[i];
      if (p[1] === k.id && active(G.knots[p[0]])) out.push(p[0]);
    }
    return out;
  }

  function isFree(k) {
    return active(k) && holdersOf(k).length === 0;
  }

  function remaining() {
    let n = 0;
    for (let i = 0; i < G.knots.length; i++) if (!G.knots[i].gone) n += 1;
    return n;
  }

  function maxTension() {
    let m = 0;
    for (let i = 0; i < G.knots.length; i++) {
      const k = G.knots[i];
      if (active(k) && k.tension > m) m = k.tension;
    }
    return m;
  }

  function firstFree() {
    for (let i = 0; i < G.knots.length; i++) if (isFree(G.knots[i])) return i;
    for (let i = 0; i < G.knots.length; i++) if (active(G.knots[i])) return i;
    return 0;
  }

  function knotScale(k) {
    const ten = 1 - k.tension * 0.1 - k.yank * 0.05;
    const ext = k.extract > 0 ? 1 - ease(k.extract) : 1;
    return Math.max(0.08, ten * ext);
  }

  function beadOf(k) {
    const sc = knotScale(k);
    const rest = ellipsePoint(k, 0, sc);
    const ca = Math.cos(k.rot);
    const sa = Math.sin(k.rot);
    const pull = k.pull + (k.extract > 0 ? ease(k.extract) * k.side * 0.18 : 0);
    return {
      x: rest.x + ca * pull,
      y: rest.y + sa * pull
    };
  }

  function layoutKnots() {
    const st = stageNow();
    const knots = [];
    for (let i = 0; i < st.knots.length; i++) {
      const def = st.knots[i];
      const geo = mapBoard(def, view.w, view.h);
      const k = {
        id: i,
        col: PAL[def.col % PAL.length],
        phase: hash(i * 17 + G.stage * 9) * TAU,
        lcx: geo.lcx,
        lcy: geo.lcy,
        rx: geo.rx,
        ry: geo.ry,
        rot: geo.rot,
        side: geo.side,
        tension: 0,
        yank: 0,
        cinch: 0,
        extract: 0,
        gone: false,
        bounce: 0,
        pulse: 0,
        pull: 0,
        alpha: 1,
        crosses: []
      };
      knots.push(k);
    }
    const pins = pinsFor(st);
    for (let i = 0; i < pins.length; i++) {
      const a = knots[pins[i][0]];
      const b = knots[pins[i][1]];
      const hits = findCrossings(a, b, SAMPLES);
      const gap = Math.max(11, Math.min(a.side * 0.028, 16));
      for (let h = 0; h < hits.length; h++) {
        b.crosses.push({
          x: hits[h].x,
          y: hits[h].y,
          gap: gap,
          over: a.id
        });
      }
    }
    G.knots = knots;
  }

  function sampleKnot(k, n, time) {
    const pts = [];
    const free = isFree(k);
    const slack = free && k.tension === 0 ? 1 : 0.16;
    const sc = knotScale(k);
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * TAU;
      const protect = 0.5 - 0.5 * Math.cos(t);
      const wob =
        (Math.sin(t * 3 + k.phase) * 0.055 + Math.sin(t * 5 + k.phase * 1.37) * 0.028) *
        (0.25 + 0.75 * slack) *
        protect;
      const br = Math.sin(time * 2.15 + k.phase) * 0.028 * slack * protect;
      const p = ellipsePoint(k, t, sc * (1 + wob + br));
      p.t = t;
      pts.push(p);
    }
    const bead = beadOf(k);
    pts[0].x = bead.x;
    pts[0].y = bead.y;
    pts[pts.length - 1].x = bead.x;
    pts[pts.length - 1].y = bead.y;
    return pts;
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
    if (G.knots.length) {
      const tens = G.knots.map(function (k) {
        return { tension: k.tension, gone: k.gone, extract: k.extract };
      });
      const sel = G.sel;
      layoutKnots();
      for (let i = 0; i < G.knots.length; i++) {
        G.knots[i].tension = tens[i].tension;
        G.knots[i].gone = tens[i].gone;
        G.knots[i].extract = tens[i].extract;
      }
      G.sel = sel;
    }
  }

  function renderPips() {
    let html = "";
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives ? " on" : "";
      const warn = G.lives === 1 && i === 0 ? " warn" : "";
      html += '<i class="pip' + on + warn + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function renderHud() {
    const s = stageNow();
    stageLabel.textContent = "关卡 " + (G.stage + 1) + " / " + STAGES.length + " · " + s.name;
    const left = remaining();
    leftLabel.textContent = "结 " + left;
    const ten = maxTension();
    tenLabel.textContent = "勒 " + ten + "/" + (MAX_TEN - 1);
    tenLabel.classList.toggle("hot", ten >= 2);
    timeLabel.classList.remove("warn");
    if (G.mode !== "play") {
      timeLabel.textContent = "—";
    } else if (G.phase === "clear") {
      timeLabel.textContent = "松开";
    } else if (G.phase === "snap") {
      timeLabel.textContent = "崩结";
      timeLabel.classList.add("warn");
    } else if (G.phase === "timeout") {
      timeLabel.textContent = "超时";
      timeLabel.classList.add("warn");
    } else {
      timeLabel.textContent = Math.max(0, G.time).toFixed(1) + "s";
      if (G.time < 8) timeLabel.classList.add("warn");
    }
    const can = G.mode === "play" && G.phase === "play" && G.lock <= 0;
    btnPull.disabled = !can;
    const k = G.knots[G.sel];
    btnPull.classList.toggle("go", !!(can && k && k.pull > 4));
    renderPips();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    ovOps.style.display = "";
    if (kind === "title") {
      ovKicker.textContent = "KNOT";
      ovTitle.textContent = "抽结";
      ovLead.innerHTML = "抽对的绳结会整根松开。抽错，压在它上面的结会被勒紧。<br />交叉处，完整的绳在上，断开的在下。";
      ovOps.textContent = coarse
        ? "拖结向外抽出 · 点「抽」抽取 · M 静音"
        : "拖结向外抽出 · 方向键选择 · 空格抽取 · M 静音";
      ovBtn.textContent = "上手";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "结尽绳开";
      ovLead.innerHTML = "十团绳结都被抽开了。<br />松的抽，紧的留。";
      ovOps.textContent = "R 再来一局 · M 静音";
      ovBtn.textContent = "再来一局";
    } else if (kind === "lose") {
      panel.classList.add("lose");
      ovKicker.textContent = "CINCH";
      ovTitle.textContent = "勒断了";
      ovLead.innerHTML = G.phase === "timeout"
        ? "时间耗尽，绳结还绞在一起。<br />三命用尽。"
        : "有结被勒死崩开。<br />三命用尽。";
      ovOps.textContent = "R 再来一局 · M 静音";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function loadStage(idx, msg, warn) {
    G.stage = idx;
    G.mode = "play";
    G.phase = "play";
    G.phaseT = 0;
    G.lock = 0.12;
    G.dragId = -1;
    G.dragAmt = 0;
    G.keyPull = 0;
    G.snapId = -1;
    G.time = stageNow().time;
    G.shake = 0;
    G.flash = 0.28;
    G.flashRgb = "0,240,255";
    layoutKnots();
    G.sel = firstFree();
    hideOverlay();
    hintEl.textContent = stageNow().hint;
    if (msg) toast(msg, warn);
    else toast(stageNow().toast);
    renderHud();
  }

  function startRun() {
    G.lives = LIVES;
    G.stage = 0;
    audio.pulse("start");
    loadStage(0);
  }

  function retryStage() {
    if (G.mode === "title") {
      startRun();
      return;
    }
    if (G.mode === "win" || G.mode === "lose") {
      G.mode = "title";
      showOverlay("title");
      startRun();
      return;
    }
    loadStage(G.stage, "重抽本关", false);
    audio.pulse("select");
  }

  function failOrRetry() {
    G.lives -= 1;
    renderPips();
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.pulse("lose");
      showOverlay("lose");
      return;
    }
    loadStage(G.stage, (G.phase === "timeout" ? "超时 −1 命 · 重抽本关" : "崩结 −1 命 · 重抽本关"), true);
  }

  function winOrNext() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      audio.pulse("win");
      showOverlay("win");
      return;
    }
    loadStage(G.stage + 1);
  }

  function beginClear() {
    G.phase = "clear";
    G.phaseT = 0;
    G.flash = 0.42;
    G.flashRgb = "0,240,255";
    audio.pulse("clear");
    toast("绳开");
    renderHud();
  }

  function beginSnap(k) {
    G.phase = "snap";
    G.phaseT = 0;
    G.snapId = k.id;
    G.flash = 0.55;
    G.flashRgb = "255,61,184";
    G.shake = 0.5;
    G.lock = 1;
    audio.pulse("snap");
    toast("崩了", true);
    const b = beadOf(k);
    emit(32, {
      x: b.x, y: b.y, j: 10,
      vx0: -160, vx1: 160, vy0: -160, vy1: 80,
      life: 0.7, r0: 1.4, r1: 3.6, col: MAG
    });
    ripple(b.x, b.y, true);
    renderHud();
  }

  function beginTimeout() {
    G.phase = "timeout";
    G.phaseT = 0;
    G.flash = 0.4;
    G.flashRgb = "255,61,184";
    G.shake = 0.3;
    audio.pulse("cinch");
    toast("时间到", true);
    renderHud();
  }

  function startExtract(k) {
    if (!active(k) || G.phase !== "play") return;
    k.extract = 0.001;
    k.pull = 0;
    G.lock = 0.55;
    G.dragId = -1;
    audio.pulse("free");
    const b = beadOf(k);
    ripple(b.x, b.y, false);
    emit(18, {
      x: b.x, y: b.y, j: 8,
      vx0: -80, vx1: 80, vy0: -90, vy1: 40,
      life: 0.5, r0: 1.2, r1: 3, col: mix(k.col, CYN, 0.35)
    });
    toast("抽出");
    if (G.sel === k.id) G.sel = firstFree();
    renderHud();
  }

  function startCinch(k) {
    if (!active(k) || G.phase !== "play") return;
    const hs = holdersOf(k);
    k.bounce = 1;
    k.pull = 0;
    G.dragId = -1;
    G.lock = 0.38;
    G.shake = 0.28;
    let snapped = null;
    for (let i = 0; i < hs.length; i++) {
      const h = G.knots[hs[i]];
      h.tension = Math.min(MAX_TEN, h.tension + 1);
      h.yank = 1;
      h.cinch = 1;
      h.pulse = 1;
      const b = beadOf(h);
      emit(10, {
        x: b.x, y: b.y, j: 6,
        vx0: -50, vx1: 50, vy0: -40, vy1: 20,
        life: 0.35, r0: 1, r1: 2.4, col: MAG
      });
      if (h.tension >= MAX_TEN) snapped = h;
    }
    audio.pulse("cinch");
    if (snapped) {
      beginSnap(snapped);
      return;
    }
    G.flash = 0.22;
    G.flashRgb = "255,61,184";
    toast("勒紧了", true);
    renderHud();
  }

  function commitPull(k) {
    if (!k || G.mode !== "play" || G.phase !== "play" || G.lock > 0) return;
    if (k.extract > 0 || k.gone) return;
    if (isFree(k)) startExtract(k);
    else startCinch(k);
  }

  function cycleSel(dir) {
    const ids = [];
    for (let i = 0; i < G.knots.length; i++) if (active(G.knots[i])) ids.push(i);
    if (!ids.length) return;
    ids.sort(function (a, b) {
      return G.knots[a].rot - G.knots[b].rot;
    });
    let idx = ids.indexOf(G.sel);
    if (idx < 0) idx = 0;
    idx = (idx + dir + ids.length) % ids.length;
    if (ids[idx] !== G.sel) {
      G.sel = ids[idx];
      G.knots[G.sel].pulse = 1;
      audio.pulse("select");
      renderHud();
    }
  }

  function hitKnot(x, y) {
    let best = -1;
    let bestD = 1e9;
    for (let i = 0; i < G.knots.length; i++) {
      const k = G.knots[i];
      if (!active(k)) continue;
      const b = beadOf(k);
      const d = hypot(x - b.x, y - b.y);
      const rad = Math.max(22, k.side * 0.048);
      if (d < rad + 8 && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) return best;
    for (let i = 0; i < G.knots.length; i++) {
      const k = G.knots[i];
      if (!active(k)) continue;
      const pts = sampleKnot(k, 48, G.t);
      for (let j = 0; j < pts.length; j++) {
        const d = hypot(x - pts[j].x, y - pts[j].y);
        if (d < 12 && d < bestD) {
          bestD = d;
          best = i;
        }
      }
    }
    return best;
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

  function stretchToward(k, x, y) {
    const rest = ellipsePoint(k, 0, knotScale(k));
    const ca = Math.cos(k.rot);
    const sa = Math.sin(k.rot);
    const dx = x - rest.x;
    const dy = y - rest.y;
    let amt = dx * ca + dy * sa;
    const free = isFree(k);
    const max = free ? k.side * 0.11 : k.side * 0.07;
    amt = clamp(amt, 0, max);
    k.pull = amt;
    G.dragAmt = amt;
    return { amt: amt, max: max, free: free };
  }

  function onDown(e) {
    if (G.mode !== "play" || G.phase !== "play") return;
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const p = eventPos(e);
    ptr.down = true;
    ptr.x = p.x;
    ptr.y = p.y;
    const id = hitKnot(p.x, p.y);
    if (id < 0) return;
    G.wasSel = G.sel === id;
    if (G.sel !== id) {
      G.sel = id;
      audio.pulse("select");
      renderHud();
    }
    G.dragId = id;
    G.knots[id].pulse = 1;
    if (e.pointerId != null && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    e.preventDefault();
  }

  function onMove(e) {
    if (!ptr.down || G.dragId < 0) return;
    const p = eventPos(e);
    ptr.x = p.x;
    ptr.y = p.y;
    const k = G.knots[G.dragId];
    if (!active(k) || G.lock > 0) return;
    stretchToward(k, p.x, p.y);
    e.preventDefault();
  }

  function onUp(e) {
    if (!ptr.down) return;
    ptr.down = false;
    const id = G.dragId;
    G.dragId = -1;
    if (id < 0) return;
    const k = G.knots[id];
    if (!k || !active(k) || G.lock > 0 || G.phase !== "play") {
      if (k) k.pull = 0;
      return;
    }
    const thresh = isFree(k) ? k.side * 0.055 : k.side * 0.05;
    const amt = k.pull;
    k.pull = 0;
    if (amt >= thresh) commitPull(k);
    else if (amt < 8 && (G.wasSel || remaining() === 1)) commitPull(k);
    e.preventDefault();
  }

  function drawRope(pts, k, width, color, alpha, gaps) {
    ctx.strokeStyle = rgb(color, alpha);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      let gap = false;
      if (gaps) {
        for (let g = 0; g < gaps.length; g++) {
          const c = gaps[g];
          if (!active(G.knots[c.over])) continue;
          if (hypot(p.x - c.x, p.y - c.y) < c.gap) {
            gap = true;
            break;
          }
        }
      }
      if (gap) {
        pen = false;
        continue;
      }
      if (!pen) {
        ctx.moveTo(p.x, p.y);
        pen = true;
      } else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function drawBead(k, time) {
    const b = beadOf(k);
    const free = isFree(k);
    const rad = Math.max(11, k.side * 0.028) * (1 + k.pulse * 0.12 + (free ? 0.06 : 0));
    const col = free ? mix(k.col, CYN, 0.25) : mix(k.col, MAG, 0.12 + k.tension * 0.12);
    ctx.save();
    ctx.translate(b.x, b.y);
    if (k.bounce > 0) {
      const j = Math.sin(k.bounce * 22) * k.bounce * 3;
      ctx.translate(j, -j * 0.4);
    }
    ctx.beginPath();
    ctx.arc(0, 0, rad * 2.1, 0, TAU);
    ctx.fillStyle = rgb(col, 0.1 + (free ? 0.08 : 0));
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, rad * 1.15, 0, TAU);
    ctx.strokeStyle = rgb(col, 0.95);
    ctx.lineWidth = 3.2;
    ctx.shadowColor = rgb(col, 0.8);
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.42, 0, TAU);
    ctx.fillStyle = rgb(mix(col, INK, 0.35), 0.95);
    ctx.fill();
    if (G.sel === k.id) {
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -time * 28;
      ctx.arc(0, 0, rad * 1.7, 0, TAU);
      ctx.strokeStyle = rgb(free ? CYN : GOLD, 0.7);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (let i = 0; i < MAX_TEN - 1; i++) {
      const a = -Math.PI * 0.7 + i * 0.42;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rad * 1.85, Math.sin(a) * rad * 1.85, 2.1, 0, TAU);
      ctx.fillStyle = i < k.tension ? rgb(MAG, 0.95) : rgb(INK, 0.18);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTeach(k, label, time) {
    const b = beadOf(k);
    const ca = Math.cos(k.rot);
    const sa = Math.sin(k.rot);
    const x = b.x + ca * 26;
    const y = b.y + sa * 26;
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(time * 3) * 0.15;
    ctx.fillStyle = rgb(INK, 0.9);
    ctx.font = "12px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y);
    ctx.beginPath();
    ctx.moveTo(b.x + ca * 14, b.y + sa * 14);
    ctx.lineTo(b.x + ca * 22, b.y + sa * 22);
    ctx.strokeStyle = rgb(GOLD, 0.7);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const w = view.w;
    const h = view.h;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const sx = G.shake > 0 ? (hash((G.t * 60) | 0) - 0.5) * 10 * G.shake : 0;
    const sy = G.shake > 0 ? (hash(((G.t * 60) | 0) + 3) - 0.5) * 10 * G.shake : 0;
    ctx.translate(sx, sy);

    ctx.fillStyle = "#03010a";
    ctx.fillRect(-12, -12, w + 24, h + 24);

    const g1 = ctx.createRadialGradient(w * 0.18, h * 0.08, 0, w * 0.18, h * 0.08, w * 0.7);
    g1.addColorStop(0, "rgba(255,61,184,0.10)");
    g1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createRadialGradient(w * 0.86, h * 0.12, 0, w * 0.86, h * 0.12, w * 0.6);
    g2.addColorStop(0, "rgba(0,240,255,0.08)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.6 + 0.4 * Math.sin(G.t * m.s * 6 + m.p));
      ctx.beginPath();
      ctx.arc(m.x * w, m.y * h, m.r, 0, TAU);
      ctx.fillStyle = rgb(i & 1 ? MAG : CYN, a);
      ctx.fill();
    }

    const alive = remaining();
    const coreR = Math.min(w, h) * (0.08 + alive * 0.018);
    const cg = ctx.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.5, coreR * 2.2);
    cg.addColorStop(0, "rgba(255,61,184,0.10)");
    cg.addColorStop(0.5, "rgba(0,240,255,0.05)");
    cg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, coreR * 2.2, 0, TAU);
    ctx.fill();

    const order = [];
    for (let i = 0; i < G.knots.length; i++) if (!G.knots[i].gone) order.push(i);
    order.sort(function (a, b) {
      const ha = holdersOf(G.knots[a]).length;
      const hb = holdersOf(G.knots[b]).length;
      if (hb !== ha) return hb - ha;
      return a - b;
    });

    const samples = [];
    for (let i = 0; i < G.knots.length; i++) {
      const k = G.knots[i];
      samples[i] = k.gone ? null : sampleKnot(k, SAMPLES, G.t);
    }

    for (let n = 0; n < order.length; n++) {
      const k = G.knots[order[n]];
      const pts = samples[k.id];
      const a = (k.extract > 0 ? 1 - ease(k.extract) : 1) * k.alpha;
      const col = k.tension >= 2 ? mix(k.col, MAG, 0.45) : k.col;
      const free = isFree(k);
      drawRope(pts, k, 11, col, 0.1 * a, k.crosses);
      drawRope(pts, k, 6.2, col, 0.55 * a, k.crosses);
      drawRope(pts, k, 2.4, mix(col, INK, free ? 0.35 : 0.12), 0.95 * a, k.crosses);
      if (G.sel === k.id) {
        const hs = holdersOf(k);
        if (hs.length) {
          for (let i = 0; i < k.crosses.length; i++) {
            const c = k.crosses[i];
            if (!active(G.knots[c.over])) continue;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.gap * 0.55, 0, TAU);
            ctx.fillStyle = rgb(MAG, 0.18 + Math.sin(G.t * 6) * 0.08);
            ctx.fill();
          }
        }
      }
    }

    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fillStyle = rgb(s.col, s.life / s.max);
      ctx.fill();
    }

    for (let n = 0; n < order.length; n++) {
      drawBead(G.knots[order[n]], G.t);
    }

    if (G.mode === "play" && G.phase === "play" && G.stage <= 1) {
      if (G.stage === 0 && G.knots[0] && active(G.knots[0])) drawTeach(G.knots[0], "向外抽", G.t);
      if (G.stage === 1) {
        if (G.knots[0] && active(G.knots[0])) drawTeach(G.knots[0], "上", G.t);
        if (G.knots[1] && active(G.knots[1]) && remaining() > 1) drawTeach(G.knots[1], "下", G.t);
      }
    }

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.max * (1 - r.t) + 8, 0, TAU);
      ctx.strokeStyle = rgb(r.mag ? MAG : CYN, r.t * 0.45);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = rgb(p.col, Math.max(0, p.life / p.max));
      ctx.fill();
    }

    if (G.flash > 0) {
      ctx.fillStyle = "rgba(" + G.flashRgb + "," + (G.flash * 0.16) + ")";
      ctx.fillRect(-12, -12, w + 24, h + 24);
    }

    const sel = G.knots[G.sel];
    if (G.mode === "play" && G.phase === "play" && sel && active(sel) && !isFree(sel)) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = rgb(MAG, 0.9);
      ctx.font = "11px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      const b = beadOf(sel);
      ctx.fillText("会勒紧上面", b.x, b.y - 28);
      ctx.restore();
    }
  }

  function spawnSparks(dt) {
    if (G.mode !== "play" || Math.random() > dt * 3.2) return;
    const live = [];
    for (let i = 0; i < G.knots.length; i++) if (active(G.knots[i])) live.push(G.knots[i]);
    if (!live.length) return;
    const k = live[(Math.random() * live.length) | 0];
    const t = Math.random() * TAU;
    const p = ellipsePoint(k, t, knotScale(k));
    sparks.push({
      x: p.x,
      y: p.y,
      r: 1.2 + Math.random() * 1.4,
      life: 0.45,
      max: 0.45,
      col: isFree(k) ? mix(k.col, CYN, 0.4) : mix(k.col, MAG, 0.3)
    });
    if (sparks.length > 28) sparks.shift();
  }

  function stepFx(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    for (let i = 0; i < G.knots.length; i++) {
      const k = G.knots[i];
      if (k.yank > 0) k.yank = Math.max(0, k.yank - dt / 0.28);
      if (k.cinch > 0) k.cinch = Math.max(0, k.cinch - dt / 0.34);
      if (k.bounce > 0) k.bounce = Math.max(0, k.bounce - dt / 0.32);
      if (k.pulse > 0) k.pulse = Math.max(0, k.pulse - dt / 0.22);
      if (k.extract > 0 && !k.gone) {
        k.extract += dt / 0.48;
        if (k.extract >= 1) {
          k.extract = 1;
          k.gone = true;
          const b = beadOf(k);
          emit(14, {
            x: b.x, y: b.y, j: 12,
            vx0: -70, vx1: 70, vy0: -50, vy1: 30,
            life: 0.4, r0: 1, r1: 2.6, col: mix(k.col, GOLD, 0.3)
          });
        }
      }
      if (G.dragId !== k.id && k.extract <= 0) {
        k.pull *= Math.max(0, 1 - dt * 10);
        if (k.pull < 0.4) k.pull = 0;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vy += 28 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.7;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].life -= dt;
      if (sparks[i].life <= 0) sparks.splice(i, 1);
    }
    spawnSparks(dt);
  }

  function tick(dt) {
    if (G.paused || G.mode !== "play") {
      audio.tickDrone(false, 0);
      stepFx(dt);
      return;
    }
    if (G.phase === "play") {
      const prev = G.time;
      G.time -= dt;
      if (G.time < 5.05 && prev >= 5.05) audio.pulse("tick");
      if (G.time < 3.05 && prev >= 3.05) audio.pulse("tick");
      if (G.time < 1.05 && prev >= 1.05) audio.pulse("tick");
      let extracting = false;
      for (let i = 0; i < G.knots.length; i++) {
        if (!G.knots[i].gone && G.knots[i].extract > 0) extracting = true;
      }
      if (remaining() === 0) {
        beginClear();
      } else if (G.time <= 0) {
        G.time = 0;
        if (!extracting) beginTimeout();
      }
      if (G.keyPull > 0 && G.knots[G.sel] && active(G.knots[G.sel])) {
        const k = G.knots[G.sel];
        const max = isFree(k) ? k.side * 0.11 : k.side * 0.07;
        k.pull = Math.min(max, k.pull + dt * max * 6);
        if (k.pull >= max * 0.92) {
          G.keyPull = 0;
          commitPull(k);
        }
      }
    } else if (G.phase === "clear") {
      G.phaseT += dt;
      if (G.phaseT > 1.05) winOrNext();
    } else if (G.phase === "snap" || G.phase === "timeout") {
      G.phaseT += dt;
      if (G.phaseT > 1.1) failOrRetry();
    }
    audio.tickDrone(G.phase === "play", maxTension());
    stepFx(dt);
    if (((G.clock * 8) | 0) !== (((G.clock - dt) * 8) | 0)) renderHud();
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    while (acc >= STEP) {
      tick(STEP);
      acc -= STEP;
    }
    draw();
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  window.addEventListener("keydown", function (e) {
    const key = e.key;
    if (key === "m" || key === "M") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (key === "r" || key === "R") {
      audio.ensure();
      retryStage();
      e.preventDefault();
      return;
    }
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (key === "Enter" || key === " ") {
        audio.ensure();
        if (G.mode === "title") startRun();
        else {
          G.mode = "title";
          startRun();
        }
        e.preventDefault();
      }
      return;
    }
    if (G.mode !== "play" || G.phase !== "play") return;
    if (key === "ArrowLeft" || key === "a" || key === "A") {
      cycleSel(-1);
      e.preventDefault();
    } else if (key === "ArrowRight" || key === "d" || key === "D") {
      cycleSel(1);
      e.preventDefault();
    } else if (key === "ArrowUp" || key === "w" || key === "W") {
      cycleSel(-1);
      e.preventDefault();
    } else if (key === "ArrowDown" || key === "s" || key === "S") {
      cycleSel(1);
      e.preventDefault();
    } else if (key === " " || key === "Enter") {
      if (!e.repeat) {
        audio.ensure();
        G.keyPull = 1;
      }
      e.preventDefault();
    } else if (key >= "1" && key <= "9") {
      const n = key.charCodeAt(0) - 49;
      if (G.knots[n] && active(G.knots[n])) {
        G.sel = n;
        G.knots[n].pulse = 1;
        audio.pulse("select");
        renderHud();
      }
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", function (e) {
    if (e.key === " " || e.key === "Enter") {
      if (G.keyPull && G.knots[G.sel] && G.phase === "play") {
        const k = G.knots[G.sel];
        G.keyPull = 0;
        k.pull = 0;
        commitPull(k);
      }
      G.keyPull = 0;
    }
  });

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    startRun();
  });

  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  btnRetry.addEventListener("click", function () {
    audio.ensure();
    retryStage();
  });

  btnPull.addEventListener("click", function () {
    audio.ensure();
    if (G.mode !== "play" || G.phase !== "play") return;
    const k = G.knots[G.sel];
    if (k) commitPull(k);
  });

  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (document.hidden && audio.droneGain && audio.ctx) {
      audio.droneGain.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.08);
    }
  });

  window.addEventListener("resize", resize);

  makeMotes();
  G.stage = 0;
  resize();
  layoutKnots();
  G.sel = 0;
  showOverlay("title");
  renderHud();
  requestAnimationFrame(frame);
})();
