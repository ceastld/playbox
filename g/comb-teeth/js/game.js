'use strict';

(function () {
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const FREE_T = 0.52;
  const MUTE_KEY = 'playbox-comb-teeth-mute';

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };
  const PAL = [
    { r: 255, g: 61, b: 184, name: '粉' },
    { r: 0, g: 240, b: 255, name: '青' },
    { r: 255, g: 227, b: 107, name: '金' },
    { r: 199, g: 125, b: 255, name: '紫' },
    { r: 61, g: 255, b: 166, name: '翠' }
  ];

  const STAGES = [
    {
      name: '初梳', sub: 'FIRST', time: 40,
      hint: '拖中间那根齿，让粉线圈成一条横线',
      toast: '往下拉中间的梳齿',
      n: 3, maxSlot: 3, maxDelta: 3, start: [0, 0, 0],
      threads: [{ c: 0, beads: [1, 0, 1] }]
    },
    {
      name: '齐齿', sub: 'EVEN', time: 40,
      hint: '三根齿都要对齐。粉线要拉成一条',
      toast: '左右两齿也要动',
      n: 3, maxSlot: 4, maxDelta: 3, start: [0, 0, 0],
      threads: [{ c: 0, beads: [0, 2, 1] }]
    },
    {
      name: '双丝', sub: 'TWO', time: 42,
      hint: '粉线和青线各梳平。可以一起齐',
      toast: '左右两条线都要横',
      n: 4, maxSlot: 3, maxDelta: 3, start: [0, 0, 0, 0],
      threads: [
        { c: 0, beads: [1, 0, -1, -1] },
        { c: 1, beads: [-1, -1, 0, 1] }
      ]
    },
    {
      name: '交叠', sub: 'OVER', time: 48,
      hint: '先齐粉线。松开后，再齐青线',
      toast: '粉线先梳平，青线后梳',
      n: 4, maxSlot: 4, maxDelta: 2, start: [0, 0, 0, 0],
      threads: [
        { c: 0, beads: [1, 0, 1, -1] },
        { c: 1, beads: [-1, 1, 0, 1] }
      ]
    },
    {
      name: '绷丝', sub: 'TAUT', time: 52,
      hint: '邻齿最多差一格。一排一排往下梳',
      toast: '齿距绷到头会卡住，隔着走',
      n: 4, maxSlot: 4, maxDelta: 1, start: [0, 0, 0, 0],
      threads: [{ c: 2, beads: [0, 1, 2, 1] }]
    },
    {
      name: '三色', sub: 'TRIO', time: 55,
      hint: '三条线。先近的短线，再梳两端金线',
      toast: '粉、青、金都要滑脱',
      n: 5, maxSlot: 4, maxDelta: 2, start: [0, 0, 0, 0, 0],
      threads: [
        { c: 0, beads: [1, 0, 1, -1, -1] },
        { c: 1, beads: [-1, -1, 0, 1, 0] },
        { c: 2, beads: [2, -1, -1, -1, 0] }
      ]
    },
    {
      name: '密齿', sub: 'DENSE', time: 58,
      hint: '六齿。邻齿只差一格，先解短线',
      toast: '短线先脱，长线最后',
      n: 6, maxSlot: 4, maxDelta: 1, start: [0, 0, 0, 0, 0, 0],
      threads: [
        { c: 0, beads: [1, 0, 1, -1, -1, -1] },
        { c: 1, beads: [-1, -1, 1, 0, 1, -1] },
        { c: 2, beads: [-1, -1, -1, -1, 0, 1] },
        { c: 3, beads: [0, -1, -1, 2, -1, 0] }
      ]
    },
    {
      name: '错起', sub: 'SHIFT', time: 55,
      hint: '齿已经错位。先把已接近的粉线齐平',
      toast: '粉线只差一齿',
      n: 5, maxSlot: 5, maxDelta: 2, start: [0, 2, 0, 1, 1],
      threads: [
        { c: 0, beads: [1, 1, 1, -1, -1] },
        { c: 1, beads: [-1, -1, 0, 0, 1] },
        { c: 2, beads: [2, -1, -1, -1, 0] }
      ]
    },
    {
      name: '深梳', sub: 'DEEP', time: 62,
      hint: '齿程更深。先清中间，再拉两端',
      toast: '中间短线先脱，紫线跨两端',
      n: 6, maxSlot: 5, maxDelta: 2, start: [0, 2, 0, 2, 0, 2],
      threads: [
        { c: 0, beads: [0, 0, 1, -1, -1, -1] },
        { c: 1, beads: [-1, -1, 0, 0, 1, -1] },
        { c: 2, beads: [-1, -1, -1, 1, 0, 0] },
        { c: 3, beads: [3, -1, -1, -1, -1, 0] }
      ]
    },
    {
      name: '终丝', sub: 'FINAL', time: 70,
      hint: '七齿密梳。邻齿只差一格，一条一条解',
      toast: '从短线解到长线',
      n: 7, maxSlot: 5, maxDelta: 1, start: [0, 0, 0, 0, 0, 0, 0],
      threads: [
        { c: 0, beads: [1, 0, 1, -1, -1, -1, -1] },
        { c: 1, beads: [-1, -1, 1, 0, 1, -1, -1] },
        { c: 2, beads: [-1, -1, -1, -1, 0, 1, 0] },
        { c: 3, beads: [-1, 2, -1, -1, 1, -1, -1] },
        { c: 4, beads: [0, -1, -1, 2, -1, -1, 0] }
      ]
    }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovBtn = document.getElementById('ov-btn');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnUndo = document.getElementById('btn-undo');
  const stageLabel = document.getElementById('stage-label');
  const silkLabel = document.getElementById('silk-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');

  const view = { w: 1, h: 1, dpr: 1 };
  const keys = { l: false, r: false, u: false, d: false };
  const hold = { dir: 0, t: 0, first: true };
  const ptr = {
    down: false, id: null, x: 0, y: 0,
    tooth: -1, startSlot: 0, startY: 0, moved: 0, recorded: false
  };

  const particles = [];
  const motes = [];
  const ripples = [];

  const G = {
    mode: 'title',
    stage: 0,
    lives: LIVES,
    time: 0,
    t: 0,
    clock: 0,
    n: 3,
    maxSlot: 3,
    maxDelta: 3,
    maxLocal: 2,
    slots: [],
    vis: [],
    bump: [],
    threads: [],
    sel: 1,
    undo: [],
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: '0,240,255',
    toastT: 0,
    paused: false,
    clearT: 0,
    total: 1,
    freed: 0,
    denyT: 0,
    teach: true,
    hud: '',
    spec: STAGES[0],
    silkDone: 0
  };

  const lay = {
    x0: 0, x1: 0, spineY: 0, baseY: 0, pitch: 0,
    toothW: 16, gripR: 10, handleX: 0, handleW: 0
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgb(c, a) {
    return a == null
      ? 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')'
      : 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }
  function pal(i) {
    return PAL[i % PAL.length];
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    taut: null,
    tautGain: null,
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
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
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
      f.type = 'bandpass';
      f.frequency.setValueAtTime(from || 700, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);
      f.Q.value = 0.75;
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
      if (kind === 'select') {
        this.beep(620, 0.04, 'sine', 0.02);
      } else if (kind === 'slide') {
        this.beep(240 + Math.random() * 40, 0.05, 'triangle', 0.03, 180);
        this.noise(0.05, 0.025, 500, 220);
      } else if (kind === 'deny') {
        this.beep(140, 0.1, 'square', 0.04, 80);
      } else if (kind === 'free') {
        this.beep(392, 0.09, 'sine', 0.055, 784);
        this.beep(588, 0.18, 'triangle', 0.04, 980);
        this.noise(0.1, 0.035, 1100, 420);
      } else if (kind === 'near') {
        this.beep(740, 0.04, 'sine', 0.018, 520);
      } else if (kind === 'win') {
        this.beep(523, 0.16, 'sine', 0.09, 784);
        this.beep(659, 0.28, 'triangle', 0.07, 1046);
        this.beep(784, 0.4, 'sine', 0.05, 1174);
      } else if (kind === 'lose') {
        this.beep(196, 0.5, 'sawtooth', 0.09, 60);
        this.beep(98, 0.7, 'square', 0.05, 40);
      } else if (kind === 'start') {
        this.beep(262, 0.14, 'sine', 0.07, 392);
        this.beep(392, 0.2, 'triangle', 0.05, 523);
      } else if (kind === 'tick') {
        this.beep(880, 0.05, 'square', 0.03, 440);
      } else if (kind === 'clear') {
        this.beep(440, 0.12, 'triangle', 0.06, 880);
        this.beep(660, 0.2, 'sine', 0.05, 1320);
      } else if (kind === 'life') {
        this.beep(180, 0.22, 'sawtooth', 0.06, 70);
        this.noise(0.14, 0.06, 400, 90);
      }
    },
    tickDrone: function (play, ten) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 46;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      if (!this.taut) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 90;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.taut = o;
        this.tautGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(play ? 46 + ten * 8 : 44, t, 0.14);
      this.droneGain.gain.setTargetAtTime(play ? 0.012 + ten * 0.01 : 0.0001, t, 0.2);
      this.taut.frequency.setTargetAtTime(70 + ten * 220, t, 0.1);
      this.tautGain.gain.setTargetAtTime(play && ten > 0.55 ? 0.008 + ten * 0.02 : 0.0001, t, 0.08);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + (Math.random() - 0.5) * spec.j,
        y: spec.y + (Math.random() - 0.5) * spec.j,
        vx: lerp(spec.vx0, spec.vx1, Math.random()),
        vy: lerp(spec.vy0, spec.vy1, Math.random()),
        life: spec.life * (0.65 + Math.random() * 0.5),
        max: spec.life,
        r: lerp(spec.r0, spec.r1, Math.random()),
        col: spec.col
      });
    }
  }

  function ripple(x, y, mag, col) {
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: mag ? 64 : 42, t: 1, mag: mag, col: col || CYN });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 2.4;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 58; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.22 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.12 + 0.03
      });
    }
  }

  function toothX(i) {
    const n = Math.max(1, G.n);
    return lay.x0 + (i + 0.5) * (lay.x1 - lay.x0) / n;
  }

  function rowY(row) {
    return lay.baseY + row * lay.pitch;
  }

  function tipY(vis) {
    return rowY(vis + G.maxLocal + 1.15);
  }

  function layout() {
    const w = view.w;
    const h = view.h;
    const n = Math.max(2, G.n);
    lay.handleW = Math.min(78, w * 0.1);
    lay.x0 = w * 0.14;
    lay.x1 = w * 0.82;
    lay.handleX = lay.x1 + w * 0.018;
    lay.spineY = h * 0.13;
    lay.baseY = h * 0.205;
    const rows = Math.max(5, G.maxSlot + G.maxLocal + 2);
    lay.pitch = (h * 0.86 - lay.baseY) / rows;
    const gap = (lay.x1 - lay.x0) / n;
    lay.toothW = clamp(gap * 0.34, 10, 26);
    lay.gripR = clamp(gap * 0.22, 8, 14);
  }

  function maxLocalOf(spec) {
    let m = 1;
    for (let t = 0; t < spec.threads.length; t++) {
      const b = spec.threads[t].beads;
      for (let i = 0; i < b.length; i++) if (b[i] > m) m = b[i];
    }
    return m;
  }

  function copySlots(a) {
    const o = [];
    for (let i = 0; i < a.length; i++) o[i] = a[i];
    return o;
  }

  function remaining() {
    let n = 0;
    for (let i = 0; i < G.threads.length; i++) {
      if (G.threads[i].alive) n += 1;
    }
    return n;
  }

  function threadRows(th, slots) {
    const rows = [];
    for (let i = 0; i < th.beads.length; i++) {
      if (th.beads[i] < 0) continue;
      rows.push(slots[i] + th.beads[i]);
    }
    return rows;
  }

  function spreadOf(th, slots) {
    const rows = threadRows(th, slots);
    if (!rows.length) return 0;
    let min = rows[0];
    let max = rows[0];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] < min) min = rows[i];
      if (rows[i] > max) max = rows[i];
    }
    return max - min;
  }

  function isAligned(th, slots) {
    if (!th.alive || th.freeing) return false;
    const rows = threadRows(th, slots);
    if (rows.length < 2) return false;
    const a = rows[0];
    for (let i = 1; i < rows.length; i++) if (rows[i] !== a) return false;
    return true;
  }

  function maxTension() {
    let m = 0;
    for (let i = 0; i < G.n - 1; i++) {
      const d = Math.abs(G.slots[i] - G.slots[i + 1]);
      if (d > m) m = d;
    }
    return m;
  }

  function clampSlot(i, slot) {
    slot = clamp(slot | 0, 0, G.maxSlot);
    if (i > 0) {
      const lo = G.slots[i - 1] - G.maxDelta;
      const hi = G.slots[i - 1] + G.maxDelta;
      slot = clamp(slot, lo, hi);
    }
    if (i < G.n - 1) {
      const lo = G.slots[i + 1] - G.maxDelta;
      const hi = G.slots[i + 1] + G.maxDelta;
      slot = clamp(slot, lo, hi);
    }
    return clamp(slot, 0, G.maxSlot);
  }

  function pushUndo() {
    G.undo.push(copySlots(G.slots));
    if (G.undo.length > 80) G.undo.shift();
  }

  function doUndo() {
    if (G.mode !== 'play' || G.lock > 0) return;
    if (!G.undo.length) {
      audio.pulse('deny');
      return;
    }
    const prev = G.undo.pop();
    for (let i = 0; i < G.n; i++) G.slots[i] = prev[i] || 0;
    audio.pulse('select');
    G.teach = false;
    syncHud(true);
  }

  function setSlot(i, slot, record) {
    const next = clampSlot(i, slot);
    if (next === G.slots[i]) {
      if (slot !== G.slots[i] && (slot | 0) !== G.slots[i]) {
        G.bump[i] = 1;
        G.denyT = 0.18;
        audio.pulse('deny');
        G.shake = 2.2;
      }
      return false;
    }
    if (record) pushUndo();
    G.slots[i] = next;
    G.teach = false;
    audio.pulse('slide');
    return true;
  }

  function nudge(i, dir) {
    if (G.mode !== 'play' || G.lock > 0) return;
    const want = G.slots[i] + dir;
    if (want < 0 || want > G.maxSlot) {
      G.bump[i] = 1;
      audio.pulse('deny');
      return;
    }
    const next = clampSlot(i, want);
    if (next === G.slots[i]) {
      G.bump[i] = 1;
      G.denyT = 0.22;
      audio.pulse('deny');
      toast('邻齿绷住了', 'warn');
      G.shake = 2.4;
      return;
    }
    setSlot(i, want, true);
  }

  function beadPoints(th, useVis) {
    const pts = [];
    for (let i = 0; i < th.beads.length; i++) {
      if (th.beads[i] < 0) continue;
      const slot = useVis ? G.vis[i] : G.slots[i];
      pts.push({
        i: i,
        x: toothX(i),
        y: rowY(slot + th.beads[i]),
        local: th.beads[i]
      });
    }
    return pts;
  }

  function hairPath(th) {
    const beads = beadPoints(th, true);
    if (!beads.length) return [];
    const w = view.w;
    const first = beads[0];
    const last = beads[beads.length - 1];
    const spread = spreadOf(th, G.vis);
    const tangle = Math.min(1.6, spread * 0.55);
    const sway = G.mode === 'title' ? 0.35 : 0;
    const left = {
      x: w * 0.055,
      y: first.y + Math.sin(G.t * 1.3 + th.c) * 3 * (tangle + 0.2 + sway)
    };
    const right = {
      x: Math.min(w * 0.97, lay.handleX - 8),
      y: last.y + 8 + Math.sin(G.t * 1.1 + th.c * 1.7) * 6 * (0.4 + tangle + sway)
    };
    const raw = [left];
    for (let i = 0; i < beads.length; i++) raw.push(beads[i]);
    raw.push(right);
    if (th.freeing) {
      const k = ease(th.freeT / FREE_T);
      for (let i = 0; i < raw.length; i++) {
        raw[i] = {
          x: raw[i].x + k * (w * 0.22 + i * 6),
          y: raw[i].y + k * 10 + Math.sin(i + G.t * 4) * k * 8
        };
      }
    }
    const waved = [];
    for (let i = 0; i < raw.length; i++) {
      const amp = (i === 0 || i === raw.length - 1) ? tangle * 4 : tangle * 7;
      waved.push({
        x: raw[i].x + Math.sin(G.t * 2.1 + i * 0.9 + th.c) * amp * 0.35,
        y: raw[i].y + Math.sin(G.t * 1.7 + i * 1.1 + th.c * 0.6) * amp * 0.45
      });
    }
    return catmull(waved, 8);
  }

  function catmull(pts, steps) {
    if (pts.length < 2) return pts;
    const p = [pts[0]];
    for (let i = 0; i < pts.length; i++) p.push(pts[i]);
    p.push(pts[pts.length - 1]);
    const out = [];
    for (let i = 0; i < p.length - 3; i++) {
      const p0 = p[i];
      const p1 = p[i + 1];
      const p2 = p[i + 2];
      const p3 = p[i + 3];
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const t2 = t * t;
        const t3 = t2 * t;
        out.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function startFree(th) {
    th.freeing = true;
    th.freeT = 0;
    th.pulse = 1;
    G.silkDone += 1;
    const col = pal(th.c);
    audio.pulse('free');
    G.flash = 0.22;
    G.flashCol = col.r + ',' + col.g + ',' + col.b;
    const beads = beadPoints(th, true);
    for (let i = 0; i < beads.length; i++) {
      emit(10, {
        x: beads[i].x, y: beads[i].y, j: 8,
        vx0: 40, vx1: 180, vy0: -80, vy1: 40,
        life: 0.48, r0: 1.2, r1: 3.4, col: col
      });
      ripple(beads[i].x, beads[i].y, false, col);
    }
    toast(col.name + '线滑脱', 'gold');
  }

  function tryFree() {
    if (G.mode !== 'play' || G.lock > 0) return;
    for (let i = 0; i < G.threads.length; i++) {
      const th = G.threads[i];
      if (th.freeing) return;
    }
    for (let i = 0; i < G.threads.length; i++) {
      const th = G.threads[i];
      if (isAligned(th, G.slots)) {
        startFree(th);
        return;
      }
    }
  }

  function loadStage(index, keepLives) {
    const s = STAGES[index];
    G.stage = index;
    G.spec = s;
    G.n = s.n;
    G.maxSlot = s.maxSlot;
    G.maxDelta = s.maxDelta;
    G.maxLocal = maxLocalOf(s);
    G.slots = copySlots(s.start);
    G.vis = copySlots(s.start);
    G.bump = [];
    for (let i = 0; i < G.n; i++) G.bump[i] = 0;
    G.threads = [];
    for (let t = 0; t < s.threads.length; t++) {
      const src = s.threads[t];
      G.threads.push({
        c: src.c,
        beads: src.beads.slice(),
        alive: true,
        freeing: false,
        freeT: 0,
        pulse: 0,
        near: 0
      });
    }
    G.total = s.threads.length;
    G.freed = 0;
    G.silkDone = 0;
    G.undo = [];
    G.sel = Math.min(G.sel, G.n - 1);
    if (G.sel < 0) G.sel = (G.n / 2) | 0;
    G.time = s.time;
    G.lock = 0.28;
    G.clearT = 0;
    G.teach = index === 0;
    ptr.down = false;
    ptr.tooth = -1;
    canvas.classList.remove('press');
    layout();
    toast(s.toast);
    hintEl.textContent = s.hint;
    hintEl.classList.remove('hot', 'warn');
    if (!keepLives) {
      /* lives handled by caller */
    }
    syncHud(true);
  }

  function startRun() {
    G.mode = 'play';
    G.lives = LIVES;
    G.shake = 0;
    G.flash = 0;
    G.silkDone = 0;
    hideOverlay();
    loadStage(0);
    audio.pulse('start');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function showOverlay(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'COMB';
      ovTitle.textContent = '梳齿';
      ovLead.innerHTML = '滑动梳齿，让同色缠线圈成一条横线。<br />齐了就会滑脱。邻齿不要拉太开。';
      ovOps.textContent = '拖动梳齿 · ←→ 选齿 · ↑↓ 滑动 · Z 撤销 · M 静音';
      ovBtn.textContent = '开梳';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'CLEAR';
      ovTitle.textContent = '丝尽';
      ovLead.textContent = '十条缠线都从梳齿上滑脱了。';
      ovOps.textContent = '梳开 ' + STAGES.length + ' 梳 · 命余 ' + G.lives;
      ovBtn.textContent = '再梳一次';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'TANGLE';
      ovTitle.textContent = '还缠着';
      ovLead.textContent = '时间到了，丝还绕在齿上。';
      ovOps.textContent = STAGES[G.stage].name + ' · 已梳 ' + G.stage + ' 梳';
      ovBtn.textContent = '再来一局';
    }
  }

  function stageClear() {
    G.mode = 'clear';
    G.clearT = 0.9;
    G.lock = 1;
    audio.pulse('clear');
    G.flash = 0.3;
    G.flashCol = '255,227,107';
    hintEl.classList.add('hot');
    hintEl.classList.remove('warn');
    toast('梳开', 'gold');
    const w = view.w;
    const h = view.h;
    emit(28, {
      x: w * 0.5, y: h * 0.4, j: 90,
      vx0: -160, vx1: 160, vy0: -140, vy1: 40,
      life: 0.7, r0: 1.4, r1: 4.2, col: GOLD
    });
  }

  function loseLife() {
    G.lives -= 1;
    audio.pulse('life');
    G.flash = 0.35;
    G.flashCol = '255,61,184';
    G.shake = 7;
    if (G.lives <= 0) {
      G.mode = 'lose';
      showOverlay('lose');
      audio.pulse('lose');
      return;
    }
    toast('还缠着 · 命 -1', 'warn');
    loadStage(G.stage, true);
  }

  function tickTime(dt) {
    if (G.mode !== 'play' || G.lock > 0 || G.paused) return;
    const prev = G.time;
    G.time -= dt;
    if (G.time <= 10 && (prev | 0) !== (G.time | 0) && G.time > 0) audio.pulse('tick');
    if (G.time <= 0) {
      G.time = 0;
      loseLife();
    }
  }

  function syncHud(force) {
    const left = remaining();
    const ten = maxTension();
    const taut = G.maxDelta > 0 ? ten / G.maxDelta : 0;
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + left + ':' + (G.time | 0) + ':' + G.sel + ':' + ten;
    if (!force && key === G.hud) return;
    G.hud = key;
    const s = G.spec || STAGES[0];
    if (G.mode === 'title') {
      stageLabel.textContent = '梳齿';
      silkLabel.textContent = 'COMB';
      silkLabel.classList.remove('warn');
      timeLabel.textContent = '—';
      timeLabel.classList.remove('warn');
      fillNum.textContent = '—';
      fillBar.style.transform = 'scaleX(0)';
      fillWrap.classList.remove('hot', 'warn');
    } else {
      stageLabel.textContent = (G.stage + 1) + '/' + STAGES.length + ' · ' + s.name;
      stageLabel.classList.toggle('hot', G.mode === 'clear');
      silkLabel.textContent = '丝 ' + left;
      silkLabel.classList.toggle('warn', taut >= 1 && left > 0);
      const sec = Math.max(0, Math.ceil(G.time));
      timeLabel.textContent = sec + 's';
      timeLabel.classList.toggle('warn', G.mode === 'play' && sec <= 8);
      const done = G.silkDone / Math.max(1, G.total);
      fillBar.style.transform = 'scaleX(' + clamp(done, 0, 1) + ')';
      fillNum.textContent = G.silkDone + '/' + G.total;
      fillWrap.classList.toggle('hot', G.mode === 'clear' || done >= 1);
      fillWrap.classList.toggle('warn', taut >= 1 && G.mode === 'play');
    }
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? ' on warn' : ' on') : '') + '"></i>';
    }
    pipsEl.innerHTML = html;
    btnUndo.disabled = G.mode !== 'play' || G.undo.length === 0;
  }

  function hitTooth(x, y) {
    let best = -1;
    let bestD = 1e9;
    const hitW = Math.max(lay.toothW * 1.6, 28);
    for (let i = 0; i < G.n; i++) {
      const tx = toothX(i);
      const gy = lay.spineY;
      const dGrip = hypot(x - tx, y - gy);
      if (dGrip < lay.gripR * 2.1 && dGrip < bestD) {
        bestD = dGrip;
        best = i;
      }
      const y0 = lay.spineY - 8;
      const y1 = tipY(G.vis[i]) + 18;
      if (y >= y0 && y <= y1 && Math.abs(x - tx) < hitW * 0.55) {
        const d = Math.abs(x - tx);
        if (d < bestD) {
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

  function onDown(e) {
    if (G.mode !== 'play') return;
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const p = eventPos(e);
    ptr.down = true;
    ptr.x = p.x;
    ptr.y = p.y;
    ptr.moved = 0;
    ptr.recorded = false;
    const id = hitTooth(p.x, p.y);
    ptr.tooth = id;
    if (id >= 0) {
      if (G.sel !== id) {
        G.sel = id;
        audio.pulse('select');
      }
      ptr.startSlot = G.slots[id];
      ptr.startY = p.y;
      canvas.classList.add('press');
      if (e.pointerId != null && canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    }
    e.preventDefault();
  }

  function onMove(e) {
    if (!ptr.down || ptr.tooth < 0 || G.mode !== 'play') return;
    const p = eventPos(e);
    ptr.moved += hypot(p.x - ptr.x, p.y - ptr.y);
    ptr.x = p.x;
    ptr.y = p.y;
    if (G.lock > 0) return;
    const dy = p.y - ptr.startY;
    const want = Math.round(ptr.startSlot + dy / lay.pitch);
    if (want !== G.slots[ptr.tooth]) {
      if (!ptr.recorded) {
        pushUndo();
        ptr.recorded = true;
      }
      const next = clampSlot(ptr.tooth, want);
      if (next !== G.slots[ptr.tooth]) {
        G.slots[ptr.tooth] = next;
        G.teach = false;
        audio.pulse('slide');
      } else if (want !== G.slots[ptr.tooth]) {
        G.bump[ptr.tooth] = 1;
        if (G.denyT <= 0) {
          G.denyT = 0.2;
          audio.pulse('deny');
          toast('邻齿绷住了', 'warn');
        }
      }
    }
    e.preventDefault();
  }

  function onUp() {
    if (!ptr.down) return;
    ptr.down = false;
    ptr.tooth = -1;
    canvas.classList.remove('press');
  }

  function onKey(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      if (G.mode === 'play' || G.mode === 'clear') {
        loadStage(G.stage, true);
      } else {
        startRun();
      }
      e.preventDefault();
      return;
    }
    if (k === 'z' || k === 'Z') {
      audio.ensure();
      doUndo();
      e.preventDefault();
      return;
    }
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
      if (k === ' ' || k === 'Enter') {
        audio.ensure();
        startRun();
        e.preventDefault();
      }
      return;
    }
    if (G.mode !== 'play') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      G.sel = (G.sel + G.n - 1) % G.n;
      audio.pulse('select');
      e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      G.sel = (G.sel + 1) % G.n;
      audio.pulse('select');
      e.preventDefault();
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      keys.u = true;
      if (hold.dir !== -1) {
        hold.dir = -1;
        hold.t = 0;
        hold.first = true;
        nudge(G.sel, -1);
      }
      e.preventDefault();
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      keys.d = true;
      if (hold.dir !== 1) {
        hold.dir = 1;
        hold.t = 0;
        hold.first = true;
        nudge(G.sel, 1);
      }
      e.preventDefault();
    } else if (k === 'Home') {
      G.sel = 0;
      audio.pulse('select');
      e.preventDefault();
    } else if (k === 'End') {
      G.sel = G.n - 1;
      audio.pulse('select');
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = false;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = false;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = false;
    if (!keys.u && !keys.d) hold.dir = 0;
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.denyT > 0) G.denyT = Math.max(0, G.denyT - dt);
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);

    if (G.mode === 'title') {
      for (let i = 0; i < G.n; i++) {
        const wave = 0.35 + 0.35 * Math.sin(G.t * 0.9 + i * 0.8);
        G.vis[i] = lerp(G.vis[i], G.slots[i] + wave, 1 - Math.pow(0.02, dt));
      }
    } else {
      for (let i = 0; i < G.n; i++) {
        G.vis[i] = lerp(G.vis[i], G.slots[i], 1 - Math.pow(0.0003, dt));
        if (Math.abs(G.vis[i] - G.slots[i]) < 0.01) G.vis[i] = G.slots[i];
        if (G.bump[i] > 0) G.bump[i] = Math.max(0, G.bump[i] - dt * 4);
      }
    }

    if (hold.dir && G.mode === 'play' && G.lock <= 0) {
      hold.t += dt;
      const wait = hold.first ? 0.32 : 0.09;
      if (hold.t >= wait) {
        hold.t = 0;
        hold.first = false;
        nudge(G.sel, hold.dir);
      }
    }

    for (let i = 0; i < G.threads.length; i++) {
      const th = G.threads[i];
      if (th.pulse > 0) th.pulse = Math.max(0, th.pulse - dt * 2.2);
      if (th.alive && !th.freeing) {
        const sp = spreadOf(th, G.slots);
        const was = th.near;
        th.near = sp === 1 ? 1 : 0;
        if (th.near && !was && G.mode === 'play') audio.pulse('near');
      }
      if (th.freeing) {
        th.freeT += dt;
        if (th.freeT >= FREE_T) {
          th.freeing = false;
          th.alive = false;
        }
      }
    }

    if (G.mode === 'play') {
      tickTime(dt);
      tryFree();
      if (G.mode === 'play' && remaining() === 0) stageClear();
    }

    if (G.mode === 'clear') {
      G.clearT -= dt;
      if (G.clearT <= 0) {
        if (G.stage + 1 >= STAGES.length) {
          G.mode = 'win';
          showOverlay('win');
          audio.pulse('win');
        } else {
          G.mode = 'play';
          loadStage(G.stage + 1);
        }
      }
    }

    const ten = G.maxDelta > 0 ? maxTension() / G.maxDelta : 0;
    audio.tickDrone(G.mode === 'play' && !G.paused, ten);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.6;
      r.r += dt * r.max * 1.4;
      if (r.t <= 0) ripples.splice(i, 1);
    }

    syncHud(false);
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

  function glowDot(x, y, r, col, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = r * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function strokePts(pts, width, color, alpha) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = rgb(color, alpha);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = rgb(color, 0.7);
    ctx.shadowBlur = width * 2.4;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function drawBg() {
    const w = view.w;
    const h = view.h;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a0616');
    g.addColorStop(0.55, '#05030c');
    g.addColorStop(1, '#070314');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const rg = ctx.createRadialGradient(w * 0.2, h * 0.05, 10, w * 0.2, h * 0.05, w * 0.55);
    rg.addColorStop(0, 'rgba(255,61,184,0.12)');
    rg.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
    const rg2 = ctx.createRadialGradient(w * 0.85, h * 0.1, 8, w * 0.85, h * 0.1, w * 0.5);
    rg2.addColorStop(0, 'rgba(0,240,255,0.1)');
    rg2.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = rg2;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.045)';
    ctx.lineWidth = 1;
    const rows = G.maxSlot + G.maxLocal + 2;
    for (let r = 0; r <= rows; r++) {
      const y = rowY(r);
      ctx.beginPath();
      ctx.moveTo(lay.x0 - 8, y);
      ctx.lineTo(lay.x1 + 8, y);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = (m.x + Math.sin(G.t * m.s + m.p) * 0.02) * w;
      const y = ((m.y + G.t * m.s * 0.04) % 1) * h;
      ctx.fillStyle = rgb(i % 2 ? MAG : CYN, m.a * (0.6 + 0.4 * Math.sin(G.t + m.p)));
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawScalp() {
    const w = view.w;
    const h = view.h;
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, w * 0.12, 0);
    g.addColorStop(0, 'rgba(255,61,184,0.1)');
    g.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, lay.baseY - 20, w * 0.12, h * 0.7);
    ctx.strokeStyle = 'rgba(255,61,184,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.032, lay.baseY - 8);
    ctx.quadraticCurveTo(w * 0.018, h * 0.5, w * 0.036, h * 0.88);
    ctx.stroke();
    ctx.restore();
  }

  function drawHandle() {
    const x = lay.handleX;
    const y = lay.spineY - 22;
    const w = lay.handleW;
    const h = 44;
    ctx.save();
    roundRect(x, y, w, h, 14);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#2a1436');
    g.addColorStop(0.5, '#141022');
    g.addColorStop(1, '#1a2040');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.55)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.22, 8, 0, 0, TAU);
    ctx.strokeStyle = 'rgba(255,61,184,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, 3.2, 3.2, 0, 0, TAU);
    ctx.fillStyle = '#ffe36b';
    ctx.fill();
    ctx.restore();
  }

  function drawSpine() {
    const x = lay.x0 - 14;
    const y = lay.spineY - 11;
    const w = lay.handleX - x + 8;
    ctx.save();
    roundRect(x, y, w, 22, 8);
    const g = ctx.createLinearGradient(x, y, x, y + 22);
    g.addColorStop(0, '#2a2238');
    g.addColorStop(0.5, '#141022');
    g.addColorStop(1, '#0c0818');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.45)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,61,184,0.18)';
    roundRect(x + 8, y + 4, w - 16, 4, 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTaut() {
    for (let i = 0; i < G.n - 1; i++) {
      const d = Math.abs(G.vis[i] - G.vis[i + 1]);
      if (d < G.maxDelta - 0.05) continue;
      const taut = clamp(d / Math.max(0.001, G.maxDelta), 0, 1.4);
      if (taut < 0.72) continue;
      const x0 = toothX(i);
      const x1 = toothX(i + 1);
      const y0 = (rowY(G.vis[i]) + tipY(G.vis[i])) * 0.5;
      const y1 = (rowY(G.vis[i + 1]) + tipY(G.vis[i + 1])) * 0.5;
      const hot = taut >= 0.98;
      const col = hot ? MAG : mix(CYN, MAG, 0.7);
      ctx.save();
      ctx.strokeStyle = rgb(col, 0.25 + taut * 0.4);
      ctx.lineWidth = 2 + taut * 2;
      ctx.shadowColor = rgb(col, 0.8);
      ctx.shadowBlur = hot ? 16 : 8;
      ctx.setLineDash([5, 6]);
      ctx.lineDashOffset = -G.t * 40;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) * 0.5, (y0 + y1) * 0.5 + 10 * Math.sin(G.t * 8), x1, y1);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTooth(i) {
    const x = toothX(i);
    const vis = G.vis[i] + Math.sin(G.t * 22) * G.bump[i] * 0.12;
    const y0 = lay.spineY;
    const y1 = tipY(vis);
    const tw = lay.toothW;
    const sel = G.sel === i && G.mode === 'play';
    const col = sel ? GOLD : CYN;
    ctx.save();
    const stub = 16 + (G.maxSlot - vis) * 2.2;
    roundRect(x - tw * 0.22, y0 - stub, tw * 0.44, stub + 6, 3);
    ctx.fillStyle = '#1a1428';
    ctx.fill();
    ctx.strokeStyle = rgb(col, 0.35);
    ctx.lineWidth = 1;
    ctx.stroke();

    const grd = ctx.createLinearGradient(x - tw, y0, x + tw, y0);
    grd.addColorStop(0, '#0c0814');
    grd.addColorStop(0.35, '#241834');
    grd.addColorStop(0.5, '#3a3058');
    grd.addColorStop(0.65, '#241834');
    grd.addColorStop(1, '#0c0814');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.5, y0);
    ctx.lineTo(x + tw * 0.5, y0);
    ctx.lineTo(x + tw * 0.28, y1 - 8);
    ctx.quadraticCurveTo(x, y1 + 6, x - tw * 0.28, y1 - 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgb(col, sel ? 0.9 : 0.45);
    ctx.shadowColor = rgb(col, 0.8);
    ctx.shadowBlur = sel ? 14 : 6;
    ctx.lineWidth = sel ? 2 : 1.3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.12, y0 + 8);
    ctx.lineTo(x - tw * 0.06, y1 - 16);
    ctx.stroke();
    ctx.restore();
  }

  function drawGrip(i) {
    const x = toothX(i);
    const y = lay.spineY;
    const sel = G.sel === i && (G.mode === 'play' || G.mode === 'clear');
    const r = lay.gripR * (sel ? 1.12 : 1) * (1 + (G.bump[i] || 0) * 0.08);
    const col = sel ? GOLD : CYN;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, TAU);
    ctx.fillStyle = rgb(col, 0.08 + (sel ? 0.08 : 0));
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
    g.addColorStop(0, '#3a3050');
    g.addColorStop(1, '#12081c');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgb(col, 0.95);
    ctx.lineWidth = sel ? 2.3 : 1.6;
    ctx.shadowColor = rgb(col, 0.9);
    ctx.shadowBlur = sel ? 14 : 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y - 1, r * 0.35, 0, TAU);
    ctx.fillStyle = rgb(mix(col, INK, 0.4), 0.9);
    ctx.fill();
    if (sel) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -G.t * 28;
      ctx.arc(x, y, r + 6, 0, TAU);
      ctx.strokeStyle = rgb(GOLD, 0.7);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawBeads(th) {
    if (!th.alive && !th.freeing) return;
    const col = pal(th.c);
    const beads = beadPoints(th, true);
    const aligned = spreadOf(th, G.slots) === 0 && th.alive;
    const a = th.freeing ? 1 - ease(th.freeT / FREE_T) : 1;
    for (let i = 0; i < beads.length; i++) {
      const b = beads[i];
      const rad = (6.2 + lay.toothW * 0.18) * (1 + th.pulse * 0.15) * (aligned ? 1.08 : 1);
      const x = b.x + (th.freeing ? ease(th.freeT / FREE_T) * 40 : 0);
      const y = b.y;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(x, y, rad * 1.7, 0, TAU);
      ctx.fillStyle = rgb(col, 0.1 + (aligned ? 0.1 : 0));
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, TAU);
      ctx.strokeStyle = rgb(aligned ? mix(col, GOLD, 0.45) : col, 0.95);
      ctx.lineWidth = 2.6;
      ctx.shadowColor = rgb(col, 0.85);
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x - rad * 0.15, y - rad * 0.2, rad * 0.28, 0, TAU);
      ctx.fillStyle = rgb(INK, 0.55);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawThread(th) {
    if (!th.alive && !th.freeing) return;
    const col = pal(th.c);
    const pts = hairPath(th);
    const sp = spreadOf(th, G.vis);
    const aligned = sp < 0.12 && th.alive;
    const near = sp < 1.05 && th.alive;
    const a = th.freeing ? 1 - ease(th.freeT / FREE_T) : 1;
    const w0 = aligned ? 5.2 : near ? 4.2 : 3.2;
    strokePts(pts, w0 + 3, col, 0.12 * a);
    strokePts(pts, w0, aligned ? mix(col, GOLD, 0.35) : col, (0.72 + (near ? 0.18 : 0)) * a);
    if (aligned) strokePts(pts, 1.4, INK, 0.45 * a);

    const beads = beadPoints(th, true);
    if (beads.length) {
      const root = beads[0];
      const end = beads[beads.length - 1];
      glowDot(view.w * 0.055, root.y, 4.2, rgb(col), 0.85 * a);
      ctx.save();
      ctx.globalAlpha = 0.55 * a;
      ctx.strokeStyle = rgb(col, 0.7);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      const hx = Math.min(view.w * 0.97, lay.handleX - 8);
      ctx.quadraticCurveTo(hx - 10, end.y + 10, hx, end.y + 16);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTeach() {
    if (!G.teach || G.mode !== 'play' || G.stage !== 0) return;
    const i = 1;
    const x = toothX(i);
    const y = lay.spineY + 28 + Math.sin(G.t * 3.2) * 6;
    ctx.save();
    ctx.globalAlpha = 0.7 + Math.sin(G.t * 3.2) * 0.2;
    ctx.fillStyle = rgb(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.lineTo(x - 7, y);
    ctx.lineTo(x + 7, y);
    ctx.closePath();
    ctx.fill();
    ctx.font = '12px Segoe UI, PingFang SC, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = rgb(INK, 0.85);
    ctx.fillText('下滑', x, y + 30);
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.strokeStyle = rgb(r.col, r.t * 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgb(p.col);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    const w = view.w;
    const h = view.h;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawBg();
    drawScalp();
    drawHandle();
    drawTaut();

    for (let i = 0; i < G.threads.length; i++) drawThread(G.threads[i]);
    for (let i = 0; i < G.n; i++) drawTooth(i);
    drawSpine();
    for (let i = 0; i < G.n; i++) drawGrip(i);
    for (let i = 0; i < G.threads.length; i++) drawBeads(G.threads[i]);
    drawTeach();
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(' + G.flashCol + ',' + (G.flash * 0.18) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    view.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = (view.w * view.dpr) | 0;
    canvas.height = (view.h * view.dpr) | 0;
    layout();
  }

  function bootBoard() {
    loadStage(0);
    G.mode = 'title';
    G.time = STAGES[0].time;
    hideToast();
    hintEl.textContent = '同色缠线要齐平 · 齐了就滑脱 · 邻齿不要拉太开';
    showOverlay('title');
    syncHud(true);
    if (location.hash === '#play') startRun();
  }

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'play' || G.mode === 'clear') loadStage(G.stage, true);
    else startRun();
  });
  btnUndo.addEventListener('click', function () {
    audio.ensure();
    doUndo();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  let acc = 0;
  let last = performance.now() / 1000;

  canvas.addEventListener('pointerdown', onDown, { passive: false });
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (!document.hidden) last = performance.now() / 1000;
  });

  makeMotes();
  resize();
  bootBoard();
  function frame(now) {
    const t = now / 1000;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    if (acc > 0.2) acc = 0.2;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
