'use strict';

(function () {
  const TW = 28;
  const TH = 14;
  const TZ = 16;
  const R = 0.3;
  const ACC = 16.5;
  const AIR = 3.6;
  const FRIC = 6.2;
  const ICE_FRIC = 0.48;
  const SLOPE = 21;
  const GRAV = 28;
  const MAX_SP = 8.4;
  const MAX_ICE = 10.8;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const VOID = -80;
  const BEST_KEY = 'playbox-marble-mad-best';
  const MUTE_KEY = 'playbox-marble-mad-mute';
  const OPS = '← → ↑ ↓ / WASD 倾斜 · 点按拖拽 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [61, 255, 168];
  const WHT = [232, 255, 246];
  const ACID = [212, 255, 61];
  const PNK = [255, 154, 212];

  const PEN = {
    practice: { fall: 4.5, acid: 5.5, smash: 5, vac: 6 },
    race: { fall: 7, acid: 8, smash: 7.5, vac: 8 }
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t) | 0,
      (a[1] + (b[1] - a[1]) * t) | 0,
      (a[2] + (b[2] - a[2]) * t) | 0
    ];
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot2(x, y) {
    return Math.hypot(x, y);
  }

  function emptyGrid(w, h) {
    const n = w * h;
    const kind = new Array(n);
    let i;
    for (i = 0; i < n; i++) kind[i] = 0;
    return {
      w: w,
      h: h,
      solid: new Uint8Array(n),
      kind: kind,
      ht: new Float32Array(n),
      vert: new Float32Array((w + 1) * (h + 1))
    };
  }

  function gi(g, x, y) {
    return y * g.w + x;
  }

  function inGrid(g, x, y) {
    return x >= 0 && y >= 0 && x < g.w && y < g.h;
  }

  function stamp(g, x, y, height, kind) {
    x = x | 0;
    y = y | 0;
    if (!inGrid(g, x, y)) return;
    const i = gi(g, x, y);
    g.solid[i] = 1;
    g.ht[i] = height;
    g.kind[i] = kind;
  }

  function stampDisk(g, cx, cy, rad, height, kind) {
    const r = Math.ceil(rad);
    let dx, dy;
    for (dy = -r; dy <= r; dy++) {
      for (dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= rad * rad + 0.15) {
          stamp(g, Math.round(cx) + dx, Math.round(cy) + dy, height, kind);
        }
      }
    }
  }

  function strokePath(g, pts, rad, h0, h1, kind) {
    const samples = [];
    let total = 0;
    let i, k, n, d, x0, y0, x1, y1, u, s;
    for (i = 1; i < pts.length; i++) {
      x0 = pts[i - 1][0];
      y0 = pts[i - 1][1];
      x1 = pts[i][0];
      y1 = pts[i][1];
      d = Math.hypot(x1 - x0, y1 - y0);
      n = Math.max(1, Math.ceil(d / 0.22));
      for (k = 0; k < n; k++) {
        u = k / n;
        samples.push({
          x: x0 + (x1 - x0) * u,
          y: y0 + (y1 - y0) * u,
          d: total + d * u
        });
      }
      total += d;
    }
    samples.push({
      x: pts[pts.length - 1][0],
      y: pts[pts.length - 1][1],
      d: total
    });
    const rr = Math.ceil(rad);
    let dx, dy, h, cx, cy;
    for (s = 0; s < samples.length; s++) {
      h = h0 + (h1 - h0) * (samples[s].d / Math.max(0.001, total));
      cx = Math.round(samples[s].x);
      cy = Math.round(samples[s].y);
      for (dy = -rr; dy <= rr; dy++) {
        for (dx = -rr; dx <= rr; dx++) {
          if (dx * dx + dy * dy <= rad * rad + 0.2) {
            stamp(g, cx + dx, cy + dy, h, kind);
          }
        }
      }
    }
    return total;
  }

  function paintKind(g, pts, rad, kind) {
    let i, k, n, d, x0, y0, x1, y1, u, dx, dy, cx, cy, ix, iy, ii;
    const rr = Math.ceil(rad);
    for (i = 1; i < pts.length; i++) {
      x0 = pts[i - 1][0];
      y0 = pts[i - 1][1];
      x1 = pts[i][0];
      y1 = pts[i][1];
      d = Math.hypot(x1 - x0, y1 - y0);
      n = Math.max(1, Math.ceil(d / 0.25));
      for (k = 0; k <= n; k++) {
        u = k / n;
        cx = Math.round(x0 + (x1 - x0) * u);
        cy = Math.round(y0 + (y1 - y0) * u);
        for (dy = -rr; dy <= rr; dy++) {
          for (dx = -rr; dx <= rr; dx++) {
            if (dx * dx + dy * dy > rad * rad + 0.2) continue;
            ix = cx + dx;
            iy = cy + dy;
            if (!inGrid(g, ix, iy)) continue;
            ii = gi(g, ix, iy);
            if (g.solid[ii]) g.kind[ii] = kind;
          }
        }
      }
    }
  }

  function bakeVerts(g) {
    const vw = g.w + 1;
    let ix, iy, dx, dy, tx, ty, s, n, i;
    for (iy = 0; iy <= g.h; iy++) {
      for (ix = 0; ix <= g.w; ix++) {
        s = 0;
        n = 0;
        for (dy = -1; dy <= 0; dy++) {
          for (dx = -1; dx <= 0; dx++) {
            tx = ix + dx;
            ty = iy + dy;
            if (tx >= 0 && ty >= 0 && tx < g.w && ty < g.h && g.solid[gi(g, tx, ty)]) {
              s += g.ht[gi(g, tx, ty)];
              n++;
            }
          }
        }
        g.vert[iy * vw + ix] = n ? s / n : 0;
      }
    }
    for (i = 0; i < g.solid.length; i++) {
      if (g.solid[i] && !g.kind[i]) g.kind[i] = 'floor';
    }
  }

  function cellKind(g, x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (!inGrid(g, ix, iy) || !g.solid[gi(g, ix, iy)]) return 0;
    return g.kind[gi(g, ix, iy)];
  }

  function isSolid(g, ix, iy) {
    return inGrid(g, ix, iy) && g.solid[gi(g, ix, iy)];
  }

  function heightAt(g, x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (!inGrid(g, ix, iy) || !g.solid[gi(g, ix, iy)]) return VOID;
    const fx = x - ix;
    const fy = y - iy;
    const vw = g.w + 1;
    const h00 = g.vert[iy * vw + ix];
    const h10 = g.vert[iy * vw + ix + 1];
    const h01 = g.vert[(iy + 1) * vw + ix];
    const h11 = g.vert[(iy + 1) * vw + ix + 1];
    return lerp(lerp(h00, h10, fx), lerp(h01, h11, fx), fy);
  }

  function gradAt(g, x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (!inGrid(g, ix, iy) || !g.solid[gi(g, ix, iy)]) return { x: 0, y: 0 };
    const fx = x - ix;
    const fy = y - iy;
    const vw = g.w + 1;
    const h00 = g.vert[iy * vw + ix];
    const h10 = g.vert[iy * vw + ix + 1];
    const h01 = g.vert[(iy + 1) * vw + ix];
    const h11 = g.vert[(iy + 1) * vw + ix + 1];
    return {
      x: lerp(h10 - h00, h11 - h01, fy),
      y: lerp(h01 - h00, h11 - h10, fx)
    };
  }

  function mark(g, x, y, kind) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!inGrid(g, x, y) || !g.solid[gi(g, x, y)]) return;
    g.kind[gi(g, x, y)] = kind;
  }

  function markArea(g, x, y, kind) {
    let dx, dy;
    for (dy = -1; dy <= 1; dy++) {
      for (dx = -1; dx <= 1; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 1) mark(g, x + dx, y + dy, kind);
      }
    }
  }

  function finalize(tr) {
    bakeVerts(tr.grid);
    tr.spawn.z = Math.max(0, heightAt(tr.grid, tr.spawn.x, tr.spawn.y));
    return tr;
  }

  function makeT1() {
    const g = emptyGrid(22, 38);
    strokePath(g, [[8, 3], [8, 14], [15, 14], [15, 24], [9, 24], [9, 33]], 2.45, 7.2, 2.1, 'floor');
    stampDisk(g, 4.2, 16.5, 2.1, 1.4, 'acid');
    mark(g, 8, 3, 'spawn');
    mark(g, 15, 20, 'check');
    markArea(g, 9, 33, 'goal');
    return finalize({
      name: '缓坡',
      tag: '入门',
      grid: g,
      spawn: { x: 8.5, y: 3.5, z: 7.2 },
      goal: { x: 9.5, y: 33.5 },
      hammers: [{ x: 15.5, y: 23.2, period: 2.55, phase: 0.08, miss: 0 }],
      vacuums: [],
      pipes: [],
      grantP: 48,
      grantR: 30,
      bonus: 700
    });
  }

  function makeT2() {
    const g = emptyGrid(24, 40);
    strokePath(g, [[6, 3], [6, 12], [17, 12], [17, 20], [7, 20], [7, 28]], 1.95, 6.6, 3.4, 'floor');
    strokePath(g, [[7, 28], [7, 30], [14, 30], [14, 36]], 1.95, 3.4, 1.8, 'floor');
    paintKind(g, [[6, 12], [17, 12], [17, 19]], 1.95, 'ice');
    stampDisk(g, 11.5, 16.2, 1.7, 1.2, 'acid');
    mark(g, 6, 3, 'spawn');
    mark(g, 7, 24, 'check');
    markArea(g, 14, 36, 'goal');
    mark(g, 7, 29, 'pipe');
    mark(g, 13, 30, 'pipe');
    return finalize({
      name: '折冰',
      tag: '弯道',
      grid: g,
      spawn: { x: 6.5, y: 3.5, z: 6.6 },
      goal: { x: 14.5, y: 36.5 },
      hammers: [
        { x: 17.5, y: 18.5, period: 2.2, phase: 0.2, miss: 0 },
        { x: 8.6, y: 27.5, period: 2.4, phase: 0.55, miss: 0 }
      ],
      vacuums: [
        { x: 18.6, y: 12.4, z: 5.2, r: 2.35, pull: 9.5, eat: 0.42, patrol: 0.55, pt: 0, ox: 18.6, oy: 12.4, miss: 0 }
      ],
      pipes: [{
        ex: 7.5, ey: 29.5,
        xx: 13.5, xy: 30.5,
        pts: [[7.5, 29.5, 3.5], [10.2, 29.2, 6.4], [13.5, 30.5, 3.2]],
        evx: 3.4, evy: 1.2
      }],
      grantP: 44,
      grantR: 28,
      bonus: 980
    });
  }

  function makeT3() {
    const g = emptyGrid(26, 40);
    strokePath(g, [[5, 3], [5, 13]], 2.05, 6.8, 4.2, 'floor');
    strokePath(g, [[18, 13], [18, 22], [10, 22], [10, 32], [16, 32], [16, 37]], 1.85, 4.2, 1.7, 'floor');
    stampDisk(g, 11.6, 13.2, 4.4, 1.05, 'acid');
    mark(g, 5, 3, 'spawn');
    mark(g, 5, 13, 'pipe');
    mark(g, 18, 13, 'pipe');
    mark(g, 10, 26, 'check');
    markArea(g, 16, 37, 'goal');
    return finalize({
      name: '管道',
      tag: '飞渡',
      grid: g,
      spawn: { x: 5.5, y: 3.5, z: 6.8 },
      goal: { x: 16.5, y: 37.5 },
      hammers: [
        { x: 18.5, y: 19.5, period: 2.05, phase: 0, miss: 0 },
        { x: 12.4, y: 22.5, period: 2.3, phase: 0.4, miss: 0 },
        { x: 10.5, y: 30.5, period: 2.15, phase: 0.7, miss: 0 }
      ],
      vacuums: [
        { x: 19.7, y: 22.2, z: 3.8, r: 2.2, pull: 10, eat: 0.4, patrol: 0.7, pt: 1.2, ox: 19.7, oy: 22.2, miss: 0 },
        { x: 8.6, y: 32.2, z: 2.6, r: 2.05, pull: 9.2, eat: 0.4, patrol: 0.5, pt: 0.4, ox: 8.6, oy: 32.2, miss: 0 }
      ],
      pipes: [{
        ex: 5.5, ey: 13.5,
        xx: 18.5, xy: 13.5,
        pts: [[5.5, 13.5, 4.4], [9.2, 12.2, 8.4], [12.2, 14.6, 8.8], [15.4, 12.4, 8.2], [18.5, 13.5, 4.3]],
        evx: 4.2, evy: 1.6
      }],
      grantP: 46,
      grantR: 30,
      bonus: 1400
    });
  }

  function makeT4() {
    const g = emptyGrid(26, 44);
    strokePath(
      g,
      [[6, 3], [6, 10], [16, 10], [16, 16], [7, 16], [7, 22], [18, 22], [18, 29], [9, 29], [9, 35], [17, 35], [17, 41]],
      1.42,
      7.4,
      1.6,
      'floor'
    );
    paintKind(g, [[16, 10], [16, 16], [7, 16]], 1.42, 'ice');
    stampDisk(g, 11.5, 13.5, 1.55, 1.1, 'acid');
    stampDisk(g, 12.8, 25.5, 1.7, 1.0, 'acid');
    stampDisk(g, 13.2, 32.5, 1.45, 0.9, 'acid');
    mark(g, 6, 3, 'spawn');
    mark(g, 7, 20, 'check');
    mark(g, 9, 33, 'check');
    markArea(g, 17, 41, 'goal');
    return finalize({
      name: '重锤',
      tag: '终轨',
      grid: g,
      spawn: { x: 6.5, y: 3.5, z: 7.4 },
      goal: { x: 17.5, y: 41.5 },
      hammers: [
        { x: 16.5, y: 12.5, period: 1.85, phase: 0.1, miss: 0 },
        { x: 10.5, y: 16.5, period: 2.0, phase: 0.45, miss: 0 },
        { x: 7.5, y: 21.2, period: 1.9, phase: 0.2, miss: 0 },
        { x: 18.5, y: 26.2, period: 1.8, phase: 0.6, miss: 0 },
        { x: 12.5, y: 29.5, period: 1.95, phase: 0.0, miss: 0 },
        { x: 17.5, y: 37.5, period: 1.75, phase: 0.3, miss: 0 }
      ],
      vacuums: [
        { x: 17.6, y: 16.4, z: 5.2, r: 2.15, pull: 11, eat: 0.4, patrol: 0.65, pt: 0.2, ox: 17.6, oy: 16.4, miss: 0 },
        { x: 6.0, y: 22.6, z: 3.6, r: 2.05, pull: 10.5, eat: 0.38, patrol: 0.5, pt: 1.1, ox: 6.0, oy: 22.6, miss: 0 },
        { x: 18.8, y: 35.4, z: 2.4, r: 2.1, pull: 10.8, eat: 0.4, patrol: 0.55, pt: 0.7, ox: 18.8, oy: 35.4, miss: 0 }
      ],
      pipes: [],
      grantP: 50,
      grantR: 32,
      bonus: 2200
    });
  }

  const BUILDERS = [makeT1, makeT2, makeT3, makeT4];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnPractice = document.getElementById('btn-practice');
  const btnRace = document.getElementById('btn-race');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timeEl = document.getElementById('time');
  const spdEl = document.getElementById('spd');
  const scoreBox = document.getElementById('score-box');
  const timeBox = document.getElementById('time-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const toastEl = document.getElementById('toast');
  const chainEl = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const timeBar = document.getElementById('time-bar');
  const timeWrap = document.getElementById('time-wrap');
  const btnUp = document.getElementById('btn-up');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnDown = document.getElementById('btn-down');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let hidden = false;
  let lastTs = 0;
  let acc = 0;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let chainTok = 0;
  let tickAcc = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pad = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, x: 0, y: 0, id: null };
  const particles = [];
  const floats = [];
  const trail = [];

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noise: null,
    rollOsc: null,
    rollGain: null,
    rollFilt: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.38;
        this.master.connect(this.ctx.destination);
        const n = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const d = n.getChannelData(0);
        let i;
        for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noise = n;
        this.makeRoll();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    makeRoll: function () {
      if (!this.ctx || this.rollOsc) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 90;
      f.Q.value = 1.1;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
      this.rollOsc = src;
      this.rollFilt = f;
      this.rollGain = g;
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.38;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    roll: function (spd, on) {
      if (!this.rollGain || !this.rollFilt) return;
      const t = on ? clamp(spd / 7.4, 0, 1) : 0;
      const now = this.ctx.currentTime;
      this.rollGain.gain.setTargetAtTime(t * 0.09, now, 0.05);
      this.rollFilt.frequency.setTargetAtTime(70 + t * 260, now, 0.05);
    }
  };

  function tone(f, dur, type, vol, f2) {
    audio.ensure();
    if (!audio.ctx || audio.muted) return;
    const t = audio.ctx.currentTime;
    const o = audio.ctx.createOscillator();
    const g = audio.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(audio.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noiseBurst(dur, vol, freq, q) {
    audio.ensure();
    if (!audio.ctx || audio.muted || !audio.noise) return;
    const t = audio.ctx.currentTime;
    const src = audio.ctx.createBufferSource();
    src.buffer = audio.noise;
    const f = audio.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q || 1.2;
    const g = audio.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(audio.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function sfx(kind, extra) {
    if (kind === 'rollHit') {
      noiseBurst(0.08, 0.16, 180 + extra * 40, 1.4);
      tone(90 + extra * 20, 0.06, 'sine', 0.08);
    } else if (kind === 'bounce') {
      tone(220, 0.07, 'triangle', 0.14, 140);
      noiseBurst(0.05, 0.12, 420, 0.8);
    } else if (kind === 'fall') {
      tone(420, 0.35, 'sawtooth', 0.16, 70);
      noiseBurst(0.28, 0.2, 200, 0.7);
    } else if (kind === 'land') {
      noiseBurst(0.1, 0.2, 110, 0.9);
      tone(140, 0.08, 'sine', 0.12, 80);
    } else if (kind === 'acid') {
      noiseBurst(0.32, 0.22, 900, 2.4);
      tone(280, 0.22, 'square', 0.08, 90);
    } else if (kind === 'hammer') {
      noiseBurst(0.16, 0.28, 90, 0.6);
      tone(70, 0.14, 'sine', 0.2, 40);
    } else if (kind === 'vac') {
      tone(180, 0.28, 'sawtooth', 0.14, 70);
      noiseBurst(0.3, 0.18, 300, 1.6);
    } else if (kind === 'pipe') {
      tone(360, 0.16, 'triangle', 0.12, 720);
      tone(540, 0.2, 'sine', 0.08, 980);
    } else if (kind === 'check') {
      tone(520, 0.08, 'square', 0.12);
      tone(780, 0.12, 'triangle', 0.1);
    } else if (kind === 'goal') {
      tone(392, 0.12, 'square', 0.14);
      tone(494, 0.14, 'square', 0.12);
      tone(587, 0.18, 'triangle', 0.12);
      tone(784, 0.28, 'sine', 0.1);
    } else if (kind === 'win') {
      tone(523, 0.12, 'square', 0.14);
      tone(659, 0.14, 'square', 0.12);
      tone(784, 0.18, 'triangle', 0.12);
      tone(1046, 0.4, 'sine', 0.1);
    } else if (kind === 'lose') {
      tone(220, 0.18, 'sawtooth', 0.14, 90);
      tone(140, 0.4, 'triangle', 0.12, 60);
    } else if (kind === 'tick') {
      tone(880, 0.04, 'square', 0.07);
    } else if (kind === 'miss') {
      tone(660 + extra * 40, 0.07, 'triangle', 0.1);
      tone(990, 0.1, 'sine', 0.06);
    } else if (kind === 'ui') {
      tone(440, 0.05, 'square', 0.08);
    } else if (kind === 'whoosh') {
      noiseBurst(0.12, 0.14, 500, 0.5);
    }
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return { p: 0, r: 0 };
      const o = JSON.parse(raw);
      return { p: o.p | 0, r: o.r | 0 };
    } catch (e) {
      return { p: 0, r: 0 };
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(G.best));
    } catch (e) { /* ignore */ }
  }

  const G = {
    mode: 'title',
    kind: 'practice',
    state: 'run',
    clock: 0,
    trackI: 0,
    track: null,
    grid: null,
    mx: 8.5,
    my: 3.5,
    mz: 7,
    vx: 0,
    vy: 0,
    vz: 0,
    on: true,
    roll: 0,
    sqx: 1,
    sqy: 1,
    spawn: { x: 8.5, y: 3.5, z: 7 },
    score: 0,
    best: loadBest(),
    time: 48,
    timeMax: 48,
    combo: 1,
    maxCombo: 1,
    camX: 8,
    camY: 10,
    camZ: 4,
    tiltX: 0,
    tiltY: 0,
    boardX: 0,
    boardY: 0,
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    flashA: 0,
    flashRgb: GOLD,
    stop: 0,
    inv: 0,
    deadT: 0,
    goalT: 0,
    pipe: null,
    pipeT: 0,
    pipeDur: 1,
    gotCheck: {},
    why: '',
    zoom: 1,
    inX: 0,
    inY: 0
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function playlist() {
    return G.kind === 'practice' ? [0, 1] : [0, 1, 2, 3];
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function playing() {
    return G.mode === 'play' && (G.state === 'run' || G.state === 'pipe' || G.state === 'fall');
  }

  function hitStop(ms) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, ms / 1000);
  }

  function kick(cls, ms) {
    if (REDUCE) return;
    stageEl.classList.remove('pop', 'stun', 'die', 'win-flash', 'warn');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    clearTimeout(kickTok);
    kickTok = setTimeout(function () { stageEl.classList.remove(cls); }, ms || 220);
  }

  function toast(msg, cls) {
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (cls ? ' ' + cls : '');
    clearTimeout(toastTok);
    toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 900);
  }

  function chainPop(txt) {
    chainEl.textContent = txt;
    chainEl.classList.remove('hidden');
    void chainEl.offsetWidth;
    chainEl.classList.add('chain-pop');
    clearTimeout(chainTok);
    chainTok = setTimeout(function () { chainEl.classList.add('hidden'); }, 680);
  }

  function bumpCombo(n) {
    G.combo = Math.min(8, G.combo + n);
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    comboEl.hidden = G.combo < 2;
    comboEl.textContent = '连稳 ×' + G.combo;
    comboEl.classList.remove('hot');
    void comboEl.offsetWidth;
    comboEl.classList.add('hot');
    if (G.combo >= 2) chainPop('×' + G.combo);
  }

  function addScore(n) {
    n = n | 0;
    if (n <= 0) return;
    G.score += n;
    scoreEl.textContent = String(G.score);
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    clearTimeout(addTok);
    addTok = setTimeout(function () { scoreAdd.hidden = true; }, 680);
    const key = G.kind === 'practice' ? 'p' : 'r';
    if (G.score > G.best[key]) {
      G.best[key] = G.score;
      bestEl.textContent = String(G.best[key]);
      saveBest();
    }
  }

  function burst(x, y, z, n, rgb, spd, up) {
    let i;
    for (i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const s = rand(spd * 0.3, spd);
      particles.push({
        x: x, y: y, z: z,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        vz: rand(up * 0.2, up),
        life: rand(0.28, 0.7),
        max: 0.7,
        rgb: rgb,
        size: rand(1.4, 3.4)
      });
    }
  }

  function floatTxt(x, y, z, text, rgb) {
    floats.push({ x: x, y: y, z: z, text: text, rgb: rgb, t: 0, life: 0.78 });
  }

  function flash(rgb, a) {
    G.flashRgb = rgb;
    G.flashA = a;
  }

  function setHud() {
    const tr = G.track;
    scoreEl.textContent = String(G.score);
    const key = G.kind === 'practice' ? 'p' : 'r';
    bestEl.textContent = String(G.best[key] || 0);
    timeEl.textContent = G.time.toFixed(1);
    const sp = Math.hypot(G.vx, G.vy);
    spdEl.textContent = String(Math.round(sp * 18));
    stageLabel.textContent = tr ? tr.name : '弹轨';
    tagLabel.textContent = G.kind === 'race' ? '竞速' : '练习';
    tagLabel.classList.toggle('warn', G.kind === 'race');
    const ratio = G.timeMax > 0 ? clamp(G.time / G.timeMax, 0, 1) : 0;
    timeBar.style.transform = 'scaleX(' + ratio + ')';
    const low = G.mode === 'play' && G.time <= 10;
    timeBox.classList.toggle('low', low);
    timeWrap.classList.toggle('low', low);
    comboEl.hidden = G.combo < 2;
    comboEl.textContent = '连稳 ×' + G.combo;
  }

  function applyTrack(tr, keepTime) {
    G.track = tr;
    G.grid = tr.grid;
    G.spawn = { x: tr.spawn.x, y: tr.spawn.y, z: tr.spawn.z };
    G.mx = tr.spawn.x;
    G.my = tr.spawn.y;
    G.mz = tr.spawn.z + 0.02;
    G.vx = 0;
    G.vy = 0;
    G.vz = 0;
    G.on = true;
    G.state = 'run';
    G.pipe = null;
    G.gotCheck = {};
    G.inv = 0.45;
    G.sqx = 1.25;
    G.sqy = 0.72;
    G.camX = tr.spawn.x;
    G.camY = tr.spawn.y + 2;
    G.camZ = tr.spawn.z;
    const grant = G.kind === 'race' ? tr.grantR : tr.grantP;
    if (keepTime) {
      G.time += grant;
    } else {
      G.time = grant;
    }
    G.timeMax = Math.max(G.time, grant);
    trail.length = 0;
    setHud();
  }

  function loadIndex(i, keepTime) {
    const list = playlist();
    const id = list[i];
    applyTrack(BUILDERS[id](), keepTime);
    G.trackI = i;
    stageLabel.classList.add('hot');
    setTimeout(function () { stageLabel.classList.remove('hot'); }, 400);
    toast(G.track.name, 'gold');
    hintEl.textContent = G.track.tag + ' · 滚到旗下 · 掉下去扣时间';
  }

  function showOverlay(kind, title, lead) {
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind !== 'title');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = 'MARBLE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    ovStart.classList.toggle('gone', kind !== 'title');
    ovEnd.classList.toggle('gone', kind === 'title');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function showTitle() {
    G.mode = 'title';
    G.state = 'run';
    G.kind = 'practice';
    G.score = 0;
    G.combo = 1;
    G.trackI = 0;
    applyTrack(BUILDERS[0](), false);
    G.time = G.kind === 'race' ? G.track.grantR : G.track.grantP;
    setHud();
    showOverlay('title', '弹轨', '倾斜赛道，把弹珠滚到旗下。掉下或酸池会扣时间并重生。');
    hintEl.textContent = '方向键倾斜 · 躲开锤子和吸尘器 · 掉下去扣时间 · R 重开';
    audio.roll(0, false);
  }

  function start(kind) {
    audio.ensure();
    sfx('ui');
    G.kind = kind;
    G.mode = 'play';
    G.score = 0;
    G.combo = 1;
    G.maxCombo = 1;
    G.clock = 0;
    G.why = '';
    hideOverlay();
    loadIndex(0, false);
    flash(HOT, 0.28);
    kick('pop', 180);
  }

  function winGame() {
    G.mode = 'win';
    G.state = 'run';
    audio.roll(0, false);
    sfx('win');
    flash(GOLD, 0.55);
    kick('win-flash', 700);
    hitStop(70);
    showOverlay('win', '全线通关', '分数 ' + G.score + ' · 最高连稳 ×' + G.maxCombo + ' · ' + (G.kind === 'race' ? '竞速' : '练习'));
    hintEl.textContent = 'R 再来一局';
  }

  function loseGame(why) {
    G.mode = 'lose';
    G.why = why || '时间到';
    audio.roll(0, false);
    sfx('lose');
    flash(MAG, 0.5);
    kick('die', 320);
    hitStop(80);
    showOverlay('lose', G.why, '分数 ' + G.score + ' · 再滚一次，时间更紧。');
    hintEl.textContent = 'R 再来一局';
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') start('practice');
    else start(G.kind);
  }

  function penalty(kind, msg, rgb) {
    const p = PEN[G.kind][kind] || 5;
    G.time = Math.max(0, G.time - p);
    setHud();
    toast(msg + ' −' + p.toFixed(0) + '秒', 'warn');
    flash(rgb || MAG, 0.4);
    G.combo = 1;
    comboEl.hidden = true;
    if (G.time <= 0) loseGame('时间到');
  }

  function beginFall(why) {
    if (G.state === 'fall' || G.state === 'dead' || G.mode !== 'play') return;
    G.state = 'fall';
    G.on = false;
    G.why = why;
    G.sqx = 0.72;
    G.sqy = 1.38;
    G.shake = 0.55;
    sfx('fall');
    hitStop(45);
    kick('die', 280);
    burst(G.mx, G.my, G.mz, 14, MAG, 3.2, 2.4);
  }

  function beginDead(kind, msg, rgb) {
    if (G.state === 'dead' || G.mode !== 'play') return;
    G.state = 'dead';
    G.deadT = 0.55;
    G.on = false;
    penalty(kind, msg, rgb);
    if (G.mode !== 'play') return;
  }

  function respawn() {
    G.mx = G.spawn.x;
    G.my = G.spawn.y;
    G.mz = G.spawn.z + 0.05;
    G.vx = 0;
    G.vy = 0;
    G.vz = 0;
    G.on = true;
    G.state = 'run';
    G.inv = 0.7;
    G.sqx = 1.45;
    G.sqy = 0.55;
    G.pipe = null;
    sfx('land');
    hitStop(32);
    kick('pop', 160);
    burst(G.mx, G.my, G.mz, 10, HOT, 2.2, 2);
  }

  function onGoal() {
    if (G.state === 'goal' || G.mode !== 'play') return;
    G.state = 'goal';
    G.goalT = 1.12;
    G.vx *= 0.3;
    G.vy *= 0.3;
    const tr = G.track;
    const sp = Math.hypot(G.vx, G.vy);
    const n = Math.floor(G.time * 80) * G.combo + tr.bonus + (sp > 4 ? 200 : 0);
    addScore(n);
    floatTxt(G.mx, G.my, G.mz + 1.2, '+' + n, GOLD);
    sfx('goal');
    flash(GOLD, 0.65);
    hitStop(70);
    kick('win-flash', 700);
    burst(G.mx, G.my, G.mz, 28, GOLD, 4.5, 4);
    burst(G.mx, G.my, G.mz, 16, CYN, 3.2, 3);
    toast(tr.name + ' 抵达', 'gold');
    bumpCombo(1);
  }

  function afterGoal() {
    const list = playlist();
    if (G.trackI + 1 >= list.length) {
      winGame();
      return;
    }
    loadIndex(G.trackI + 1, true);
    flash(HOT, 0.22);
  }

  function onCheck(ix, iy) {
    const key = ix + ',' + iy;
    if (G.gotCheck[key]) return;
    G.gotCheck[key] = 1;
    G.spawn = { x: ix + 0.5, y: iy + 0.5, z: heightAt(G.grid, ix + 0.5, iy + 0.5) };
    const n = 80 * G.combo;
    addScore(n);
    floatTxt(G.mx, G.my, G.mz + 0.8, '+' + n, CYN);
    sfx('check');
    hitStop(30);
    kick('pop', 140);
    bumpCombo(1);
    burst(G.mx, G.my, G.mz, 12, CYN, 2.8, 2.5);
    toast('存点', '');
  }

  function nearMiss() {
    const n = 40 * G.combo;
    addScore(n);
    floatTxt(G.mx, G.my, G.mz + 0.6, '险过 +' + n, PNK);
    sfx('miss', G.combo);
    hitStop(28);
    bumpCombo(1);
  }

  function hammerDown(h, t) {
    const p = (t / h.period + h.phase) % 1;
    if (p < 0.42) return 0.04;
    if (p < 0.5) return (p - 0.42) / 0.08;
    if (p < 0.62) return 1;
    return Math.max(0.04, 1 - (p - 0.62) / 0.38);
  }

  function readTilt() {
    let tx = 0;
    let ty = 0;
    if (keys.u || pad.u) { tx -= 1; ty -= 1; }
    if (keys.d || pad.d) { tx += 1; ty += 1; }
    if (keys.l || pad.l) { tx -= 1; ty += 1; }
    if (keys.r || pad.r) { tx += 1; ty -= 1; }
    if (pointer.down && G.mode === 'play') {
      const p = viewOf(G.mx, G.my, G.mz);
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const len = Math.hypot(dx, dy);
      if (len > 6) {
        const mag = clamp(len / 70, 0, 1);
        const nx = dx / len;
        const ny = dy / len;
        tx += (nx + ny) * mag;
        ty += (-nx + ny) * mag;
      }
    }
    const l = Math.hypot(tx, ty);
    if (l > 1) { tx /= l; ty /= l; }
    G.inX = tx;
    G.inY = ty;
    G.tiltX = lerp(G.tiltX, tx, 0.28);
    G.tiltY = lerp(G.tiltY, ty, 0.28);
  }

  function stepHazards(dt) {
    const tr = G.track;
    let i, h, down, dist, vac, d, f;
    const t = G.clock;
    if (G.state !== 'run' || G.inv > 0) {
      for (i = 0; i < tr.vacuums.length; i++) {
        vac = tr.vacuums[i];
        vac.x = vac.ox + Math.sin(t * 0.85 + vac.pt) * vac.patrol;
        vac.y = vac.oy + Math.cos(t * 0.7 + vac.pt) * vac.patrol * 0.6;
      }
      return;
    }
    for (i = 0; i < tr.hammers.length; i++) {
      h = tr.hammers[i];
      down = hammerDown(h, t);
      dist = Math.hypot(G.mx - h.x, G.my - h.y);
      if (down > 0.82 && dist < 0.58 && G.mz < heightAt(G.grid, h.x, h.y) + 1.1) {
        sfx('hammer');
        burst(h.x, h.y, G.mz, 18, MAG, 4, 3);
        hitStop(60);
        kick('stun', 200);
        beginDead('smash', '锤子砸中', MAG);
        return;
      }
      if (down > 0.55 && dist < 0.85 && dist > 0.58 && !h.miss) {
        h.miss = 1;
        nearMiss();
      }
      if (down < 0.2) h.miss = 0;
    }
    for (i = 0; i < tr.vacuums.length; i++) {
      vac = tr.vacuums[i];
      vac.x = vac.ox + Math.sin(t * 0.85 + vac.pt) * vac.patrol;
      vac.y = vac.oy + Math.cos(t * 0.7 + vac.pt) * vac.patrol * 0.6;
      d = Math.hypot(G.mx - vac.x, G.my - vac.y);
      if (d < vac.eat) {
        sfx('vac');
        burst(vac.x, vac.y, vac.z, 20, MAG, 3.4, 2);
        hitStop(55);
        beginDead('vac', '被吸走', MAG);
        return;
      }
      if (d < vac.r && d > 0.02 && G.on) {
        f = (1 - d / vac.r) * vac.pull;
        G.vx += (vac.x - G.mx) / d * f * dt;
        G.vy += (vac.y - G.my) / d * f * dt;
      }
      if (d < vac.r * 0.42 && d > vac.eat * 1.35 && !vac.miss) {
        vac.miss = 1;
        nearMiss();
      }
      if (d > vac.r * 0.72) vac.miss = 0;
    }
    for (i = 0; i < tr.pipes.length; i++) {
      const p = tr.pipes[i];
      if (Math.hypot(G.mx - p.ex, G.my - p.ey) < 0.5 && G.on) {
        G.state = 'pipe';
        G.pipe = p;
        G.pipeT = 0;
        let len = 0;
        let k;
        for (k = 1; k < p.pts.length; k++) {
          len += Math.hypot(p.pts[k][0] - p.pts[k - 1][0], p.pts[k][1] - p.pts[k - 1][1]);
        }
        G.pipeDur = Math.max(0.55, len / 9.5);
        sfx('pipe');
        sfx('whoosh');
        hitStop(28);
        kick('pop', 140);
        burst(G.mx, G.my, G.mz, 10, CYN, 2.4, 2);
        return;
      }
    }
    const kind = cellKind(G.grid, G.mx, G.my);
    if (kind === 'goal' && G.on) onGoal();
    else if (kind === 'check' && G.on) onCheck(Math.floor(G.mx), Math.floor(G.my));
    else if (kind === 'acid' && G.on && G.mz <= heightAt(G.grid, G.mx, G.my) + 0.18) {
      sfx('acid');
      burst(G.mx, G.my, G.mz, 22, ACID, 3.6, 3);
      hitStop(50);
      kick('warn', 200);
      beginDead('acid', '酸池融化', ACID);
    }
  }

  function followPipe(dt) {
    const p = G.pipe;
    G.pipeT += dt / G.pipeDur;
    const t = clamp(G.pipeT, 0, 1);
    const pts = p.pts;
    const n = pts.length - 1;
    const f = t * n;
    const i = Math.min(n - 1, Math.floor(f));
    const u = f - i;
    const a = pts[i];
    const b = pts[i + 1];
    G.mx = lerp(a[0], b[0], u);
    G.my = lerp(a[1], b[1], u);
    G.mz = lerp(a[2], b[2], u);
    G.vx = (b[0] - a[0]);
    G.vy = (b[1] - a[1]);
    G.on = false;
    G.sqx = 0.82;
    G.sqy = 1.18;
    if (G.pipeT >= 1) {
      G.mx = p.xx;
      G.my = p.xy;
      G.mz = heightAt(G.grid, p.xx, p.xy) + 0.05;
      G.vx = p.evx;
      G.vy = p.evy;
      G.vz = 0.8;
      G.state = 'run';
      G.on = true;
      G.pipe = null;
      G.inv = 0.12;
      burst(G.mx, G.my, G.mz, 14, CYN, 3.2, 2.6);
      sfx('whoosh');
    }
  }

  function moveAxis(dt) {
    const nx = G.mx + G.vx * dt;
    const h1 = heightAt(G.grid, nx, G.my);
    if (h1 > G.mz + 0.52) {
      if (Math.abs(G.vx) > 2.6) {
        sfx('bounce');
        burst(G.mx, G.my, G.mz, 6, WHT, 2, 1.2);
        hitStop(24);
        G.shake = Math.max(G.shake, 0.28);
      }
      G.vx *= -0.32;
    } else G.mx = nx;
    const ny = G.my + G.vy * dt;
    const h2 = heightAt(G.grid, G.mx, ny);
    if (h2 > G.mz + 0.52) {
      if (Math.abs(G.vy) > 2.6) {
        sfx('bounce');
        burst(G.mx, G.my, G.mz, 6, WHT, 2, 1.2);
        hitStop(24);
        G.shake = Math.max(G.shake, 0.28);
      }
      G.vy *= -0.32;
    } else G.my = ny;
  }

  function stepPhysics(dt) {
    const ice = cellKind(G.grid, G.mx, G.my) === 'ice';
    const g = G.grid;
    if (G.on) {
      const gr = gradAt(g, G.mx, G.my);
      G.vx += G.tiltX * (ice ? ACC * 0.72 : ACC) * dt;
      G.vy += G.tiltY * (ice ? ACC * 0.72 : ACC) * dt;
      G.vx += -SLOPE * gr.x * dt;
      G.vy += -SLOPE * gr.y * dt;
      const sp = Math.hypot(G.vx, G.vy);
      const fr = ice ? ICE_FRIC : FRIC;
      if (sp > 0.001) {
        const d = Math.min(sp, fr * dt);
        G.vx -= G.vx / sp * d;
        G.vy -= G.vy / sp * d;
      }
      const cap = ice ? MAX_ICE : MAX_SP;
      const sp2 = Math.hypot(G.vx, G.vy);
      if (sp2 > cap) {
        G.vx *= cap / sp2;
        G.vy *= cap / sp2;
      }
      moveAxis(dt);
      const surf = heightAt(g, G.mx, G.my);
      if (surf < VOID + 20) {
        beginFall('掉下去了');
      } else {
        G.mz = surf;
        G.vz = 0;
      }
    } else if (G.state === 'fall') {
      G.vx += G.tiltX * AIR * dt;
      G.vy += G.tiltY * AIR * dt;
      G.vz -= GRAV * dt;
      G.mx += G.vx * dt;
      G.my += G.vy * dt;
      G.mz += G.vz * dt;
      const surf = heightAt(g, G.mx, G.my);
      if (surf > VOID + 20 && G.mz <= surf && G.vz <= 0) {
        const k = cellKind(g, G.mx, G.my);
        G.mz = surf;
        if (k === 'acid') {
          sfx('acid');
          burst(G.mx, G.my, G.mz, 18, ACID, 3, 2.4);
          beginDead('acid', '酸池融化', ACID);
        } else {
          G.on = true;
          G.state = 'run';
          G.sqx = 1.35;
          G.sqy = 0.62;
          sfx('land');
          G.shake = 0.35;
        }
      } else if (G.mz < -10) {
        beginDead('fall', '掉下去了', MAG);
      }
    } else {
      G.vz -= GRAV * dt;
      G.mz += G.vz * dt;
    }
    G.roll += Math.hypot(G.vx, G.vy) * dt * 1.7;
    const sp = Math.hypot(G.vx, G.vy);
    if (G.on && sp > 1.4 && !REDUCE) {
      G.shake = Math.max(G.shake, sp * 0.012);
      if (Math.random() < dt * sp * 2.2) {
        particles.push({
          x: G.mx - G.vx * 0.04,
          y: G.my - G.vy * 0.04,
          z: G.mz,
          vx: rand(-0.4, 0.4),
          vy: rand(-0.4, 0.4),
          vz: rand(0.2, 1.1),
          life: 0.32,
          max: 0.32,
          rgb: ice ? CYN : HOT,
          size: rand(1.1, 2.2)
        });
      }
    }
    G.sqx = lerp(G.sqx, 1, 0.14);
    G.sqy = lerp(G.sqy, 1, 0.14);
  }

  function stepJuice(dt) {
    G.boardX = lerp(G.boardX, G.tiltX * 0.07, 0.12);
    G.boardY = lerp(G.boardY, G.tiltY * 0.07, 0.12);
    G.shake *= Math.pow(0.001, dt);
    if (REDUCE) {
      G.shake = 0;
      G.shakeX = 0;
      G.shakeY = 0;
    } else {
      G.shakeX = (Math.random() - 0.5) * G.shake * 10;
      G.shakeY = (Math.random() - 0.5) * G.shake * 8;
    }
    G.flashA *= Math.pow(0.04, dt);
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vz -= 9 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      floats[i].t += dt;
      floats[i].z += dt * 1.4;
      if (floats[i].t > floats[i].life) floats.splice(i, 1);
    }
    trail.push({ x: G.mx, y: G.my, z: G.mz, a: 1 });
    if (trail.length > 12) trail.shift();
    let lookX = G.mx + G.vx * 0.2;
    let lookY = G.my + G.vy * 0.2;
    if (G.mode === 'title') {
      lookX = G.mx + 2.4 + Math.sin(G.clock * 0.22) * 1.6;
      lookY = G.my + 8 + Math.cos(G.clock * 0.17) * 2.2;
    }
    const k = G.mode === 'title' ? 0.045 : 0.11;
    G.camX = lerp(G.camX, lookX, k);
    G.camY = lerp(G.camY, lookY, k);
    G.camZ = lerp(G.camZ, G.mz, k);
  }

  function step(dt) {
    G.clock += dt;
    if (G.inv > 0) G.inv -= dt;
    readTilt();
    if (G.mode === 'title') {
      G.mx = G.spawn.x;
      G.my = G.spawn.y;
      G.mz = G.spawn.z + Math.sin(G.clock * 2.2) * 0.05;
      stepJuice(dt);
      audio.roll(0, false);
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') {
      stepJuice(dt);
      audio.roll(0, false);
      return;
    }
    if (G.stop > 0) {
      G.stop -= dt;
      stepJuice(dt);
      return;
    }
    if (G.state === 'goal') {
      G.goalT -= dt;
      stepJuice(dt);
      if (G.goalT <= 0) afterGoal();
      return;
    }
    if (G.state === 'dead') {
      G.deadT -= dt;
      G.mz -= dt * 4;
      stepJuice(dt);
      if (G.deadT <= 0 && G.mode === 'play') respawn();
      return;
    }
    if (G.state === 'pipe') followPipe(dt);
    else stepPhysics(dt);
    if (G.mode === 'play' && G.state !== 'goal') {
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        loseGame('时间到');
      } else if (G.time <= 10) {
        tickAcc += dt;
        const gap = G.time <= 5 ? 0.32 : 0.7;
        if (tickAcc >= gap) {
          tickAcc = 0;
          sfx('tick');
        }
      }
    }
    if (G.mode === 'play') stepHazards(dt);
    stepJuice(dt);
    const sp = Math.hypot(G.vx, G.vy);
    audio.roll(sp, G.mode === 'play' && G.state === 'run' && G.on);
    setHud();
  }

  function isoRaw(x, y, z) {
    return { x: (x - y) * TW, y: (x + y) * TH - z * TZ };
  }

  function viewOf(x, y, z) {
    const p = isoRaw(x, y, z);
    const c = isoRaw(G.camX, G.camY, G.camZ);
    return {
      x: W * 0.5 + (p.x - c.x) * G.zoom + G.shakeX,
      y: H * 0.4 + (p.y - c.y) * G.zoom + G.shakeY
    };
  }

  function quad(a, b, c, d, col) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }

  function tileCols(ix, iy, kind) {
    const alt = (ix + iy) & 1;
    if (kind === 'ice') {
      return {
        top: alt ? [168, 236, 255] : [210, 248, 255],
        L: [42, 88, 118],
        R: [72, 140, 176]
      };
    }
    if (kind === 'acid') {
      return {
        top: alt ? [186, 230, 36] : [220, 255, 70],
        L: [62, 86, 12],
        R: [102, 138, 18]
      };
    }
    if (kind === 'goal') {
      return {
        top: alt ? [255, 214, 80] : [255, 240, 140],
        L: [96, 62, 12],
        R: [168, 120, 28]
      };
    }
    if (kind === 'check') {
      return {
        top: alt ? [80, 255, 210] : [180, 120, 255],
        L: [40, 70, 110],
        R: [70, 50, 120]
      };
    }
    if (kind === 'pipe') {
      return {
        top: [40, 210, 190],
        L: [18, 70, 72],
        R: [28, 120, 118]
      };
    }
    return {
      top: alt ? [28, 168, 122] : [46, 210, 150],
      L: [10, 52, 40],
      R: [16, 92, 68]
    };
  }

  function drawTile(g, ix, iy) {
    const i = gi(g, ix, iy);
    if (!g.solid[i]) return;
    const kind = g.kind[i];
    const vw = g.w + 1;
    const h00 = g.vert[iy * vw + ix];
    const h10 = g.vert[iy * vw + ix + 1];
    const h01 = g.vert[(iy + 1) * vw + ix];
    const h11 = g.vert[(iy + 1) * vw + ix + 1];
    const p00 = viewOf(ix, iy, h00);
    const p10 = viewOf(ix + 1, iy, h10);
    const p11 = viewOf(ix + 1, iy + 1, h11);
    const p01 = viewOf(ix, iy + 1, h01);
    const b10 = viewOf(ix + 1, iy, 0);
    const b11 = viewOf(ix + 1, iy + 1, 0);
    const b01 = viewOf(ix, iy + 1, 0);
    const col = tileCols(ix, iy, kind);
    quad(p10, p11, b11, b10, rgba(col.R, 1));
    quad(p01, p11, b11, b01, rgba(col.L, 1));
    quad(p00, p10, p11, p01, rgba(col.top, 1));
    if (kind === 'acid') {
      const wob = Math.sin(G.clock * 6 + ix * 0.7 + iy) * 0.08;
      const a00 = viewOf(ix + 0.12, iy + 0.12, h00 + 0.08 + wob);
      const a10 = viewOf(ix + 0.88, iy + 0.12, h10 + 0.08 + wob);
      const a11 = viewOf(ix + 0.88, iy + 0.88, h11 + 0.08 + wob);
      const a01 = viewOf(ix + 0.12, iy + 0.88, h01 + 0.08 + wob);
      quad(a00, a10, a11, a01, rgba([240, 255, 90], 0.45));
    }
    if (kind === 'ice') {
      ctx.strokeStyle = rgba([255, 255, 255], 0.28);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p00.x, p00.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.stroke();
    }
    const voidN = !isSolid(g, ix, iy - 1);
    const voidS = !isSolid(g, ix, iy + 1);
    const voidW = !isSolid(g, ix - 1, iy);
    const voidE = !isSolid(g, ix + 1, iy);
    if (voidN || voidS || voidW || voidE) {
      ctx.strokeStyle = rgba(HOT, 0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      if (voidN) { ctx.moveTo(p00.x, p00.y); ctx.lineTo(p10.x, p10.y); }
      if (voidE) { ctx.moveTo(p10.x, p10.y); ctx.lineTo(p11.x, p11.y); }
      if (voidS) { ctx.moveTo(p01.x, p01.y); ctx.lineTo(p11.x, p11.y); }
      if (voidW) { ctx.moveTo(p00.x, p00.y); ctx.lineTo(p01.x, p01.y); }
      ctx.stroke();
    }
  }

  function drawFlag(x, y, z, rgb) {
    const pole = viewOf(x, y, z);
    const top = viewOf(x, y, z + 2.3);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(pole.x, pole.y);
    ctx.lineTo(top.x, top.y);
    ctx.stroke();
    const wave = Math.sin(G.clock * 5) * 0.35;
    const f1 = viewOf(x + 0.05, y + 0.05, z + 2.25);
    const f2 = viewOf(x + 1.15 + wave, y - 0.2, z + 2.05);
    const f3 = viewOf(x + 1.05 + wave, y - 0.15, z + 1.45);
    const f4 = viewOf(x + 0.05, y + 0.05, z + 1.55);
    quad(f1, f2, f3, f4, rgba(rgb, 0.95));
  }

  function drawHammer(h) {
    const down = hammerDown(h, G.clock);
    const padH = Math.max(0, heightAt(G.grid, h.x, h.y));
    const hz = lerp(padH + 3.3, padH + 0.42, down);
    const pivot = viewOf(h.x, h.y, padH + 3.35);
    const head = viewOf(h.x, h.y, hz);
    ctx.strokeStyle = rgba([180, 200, 210], 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(head.x, head.y);
    ctx.stroke();
    const s = 0.42 * G.zoom * TW;
    ctx.fillStyle = rgba(down > 0.8 ? MAG : [220, 230, 240], 1);
    ctx.fillRect(head.x - s * 0.55, head.y - s * 0.35, s * 1.1, s * 0.7);
    ctx.strokeStyle = rgba(WHT, 0.5);
    ctx.strokeRect(head.x - s * 0.55, head.y - s * 0.35, s * 1.1, s * 0.7);
    const pad = viewOf(h.x, h.y, padH);
    ctx.fillStyle = rgba(MAG, 0.12 + down * 0.25);
    ctx.beginPath();
    ctx.ellipse(pad.x, pad.y, 10 * G.zoom, 5 * G.zoom, 0, 0, TAU);
    ctx.fill();
  }

  function drawVac(v) {
    const p = viewOf(v.x, v.y, v.z + 0.6);
    const rad = 11 * G.zoom;
    let k;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(G.clock * 3 + v.pt);
    for (k = 0; k < 3; k++) {
      ctx.strokeStyle = rgba(k ? MAG : CYN, 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, rad * (0.4 + k * 0.28), k, k + 2.2);
      ctx.stroke();
    }
    ctx.restore();
    const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, rad * 1.4);
    g.addColorStop(0, rgba([8, 0, 12], 0.85));
    g.addColorStop(0.6, rgba(MAG, 0.35));
    g.addColorStop(1, rgba(MAG, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad * 1.4, 0, TAU);
    ctx.fill();
  }

  function drawPipe(p) {
    let i;
    for (i = 0; i < p.pts.length; i++) {
      const a = p.pts[i];
      const q = viewOf(a[0], a[1], a[2]);
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, 9 * G.zoom, 5 * G.zoom, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(HOT, 0.35);
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, 6 * G.zoom, 3.4 * G.zoom, 0, 0, TAU);
      ctx.stroke();
      if (i > 0) {
        const b = p.pts[i - 1];
        const r = viewOf(b[0], b[1], b[2]);
        ctx.strokeStyle = rgba([20, 90, 86], 0.55);
        ctx.lineWidth = 8 * G.zoom;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  }

  function drawMarble() {
    const ground = Math.max(0, heightAt(G.grid, G.mx, G.my));
    const sh = viewOf(G.mx, G.my, G.on ? G.mz : ground);
    const p = viewOf(G.mx, G.my, G.mz + 0.3);
    const sp = Math.hypot(G.vx, G.vy);
    const rx = 11.5 * G.zoom * G.sqx;
    const ry = 11.5 * G.zoom * G.sqy;
    ctx.fillStyle = rgba([0, 0, 0], 0.38);
    ctx.beginPath();
    ctx.ellipse(sh.x, sh.y + 3, rx * 1.15, ry * 0.32, 0, 0, TAU);
    ctx.fill();
    let i;
    if (sp > 4) {
      for (i = 0; i < trail.length; i++) {
        const t = trail[i];
        const q = viewOf(t.x, t.y, t.z + 0.3);
        ctx.fillStyle = rgba(HOT, 0.06 * (i / trail.length));
        ctx.beginPath();
        ctx.ellipse(q.x, q.y, rx * 0.7, ry * 0.7, 0, 0, TAU);
        ctx.fill();
      }
    }
    const blink = G.inv > 0 && ((G.clock * 18) | 0) % 2 === 0;
    const grd = ctx.createRadialGradient(p.x - rx * 0.32, p.y - ry * 0.42, rx * 0.08, p.x, p.y, rx);
    grd.addColorStop(0, blink ? '#fff' : '#f4fffb');
    grd.addColorStop(0.28, rgba(HOT, 1));
    grd.addColorStop(0.72, '#0a7a58');
    grd.addColorStop(1, '#03241c');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU);
    ctx.clip();
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = 3 * G.zoom;
    const band = Math.sin(G.roll) * rx * 0.7;
    ctx.beginPath();
    ctx.ellipse(p.x + band * 0.15, p.y, rx * 0.55, ry * 0.92, G.roll * 0.2, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = rgba([255, 255, 255], 0.75);
    ctx.beginPath();
    ctx.ellipse(p.x - rx * 0.32, p.y - ry * 0.38, rx * 0.22, ry * 0.16, -0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU);
    ctx.stroke();
  }

  function drawFloats() {
    let i;
    ctx.textAlign = 'center';
    ctx.font = '700 13px "Segoe UI", "PingFang SC", sans-serif';
    for (i = 0; i < floats.length; i++) {
      const f = floats[i];
      const p = viewOf(f.x, f.y, f.z);
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, p.x, p.y - f.t * 26);
    }
    for (i = 0; i < particles.length; i++) {
      const p = particles[i];
      const q = viewOf(p.x, p.y, p.z);
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      ctx.fillRect(q.x, q.y, p.size * G.zoom, p.size * G.zoom);
    }
  }

  function drawBg() {
    const grd = ctx.createRadialGradient(W * 0.5, H * 0.28, 20, W * 0.48, H * 0.55, Math.max(W, H) * 0.72);
    grd.addColorStop(0, '#0c2e22');
    grd.addColorStop(0.45, '#071a14');
    grd.addColorStop(1, '#020a08');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = rgba(HOT, 0.05);
    ctx.lineWidth = 1;
    let i;
    for (i = -8; i < 18; i++) {
      const a = viewOf(i * 2, -6, 0);
      const b = viewOf(i * 2, 48, 0);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  function drawTiltArrow() {
    if (G.mode !== 'play' || Math.hypot(G.inX, G.inY) < 0.15) return;
    const p = viewOf(G.mx, G.my, G.mz + 0.3);
    const tx = G.inX;
    const ty = G.inY;
    const sx = (tx - ty) * TW * G.zoom;
    const sy = (tx + ty) * TH * G.zoom;
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + sx * 0.9, p.y + sy * 0.9);
    ctx.stroke();
  }

  function draw() {
    G.zoom = Math.min(W / 560, H / 420) * 1.12;
    drawBg();
    if (!G.grid) return;
    ctx.save();
    if (!REDUCE && G.mode === 'play') {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.rotate(G.boardX * 0.18);
      ctx.translate(-W * 0.5, -H * 0.5 + G.boardY * 16);
    }
    const g = G.grid;
    const cx = G.camX | 0;
    const cy = G.camY | 0;
    const rad = 16;
    const list = [];
    let ix, iy, i;
    for (iy = Math.max(0, cy - rad); iy < Math.min(g.h, cy + rad); iy++) {
      for (ix = Math.max(0, cx - rad); ix < Math.min(g.w, cx + rad); ix++) {
        if (g.solid[gi(g, ix, iy)]) list.push({ s: ix + iy, k: 'tile', x: ix, y: iy });
      }
    }
    for (i = 0; i < G.track.pipes.length; i++) {
      const p = G.track.pipes[i];
      list.push({ s: p.ex + p.ey + 0.2, k: 'pipe', o: p });
    }
    for (i = 0; i < G.track.hammers.length; i++) {
      const h = G.track.hammers[i];
      list.push({ s: h.x + h.y + 0.15, k: 'ham', o: h });
    }
    for (i = 0; i < G.track.vacuums.length; i++) {
      const v = G.track.vacuums[i];
      list.push({ s: v.x + v.y + 0.12, k: 'vac', o: v });
    }
    if (G.track.goal) {
      list.push({ s: G.track.goal.x + G.track.goal.y + 0.18, k: 'flag', o: G.track.goal });
    }
    if (G.state !== 'dead') list.push({ s: G.mx + G.my + 0.08, k: 'mar' });
    list.sort(function (a, b) { return a.s - b.s || (a.k === 'tile' ? -1 : 1); });
    for (i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.k === 'tile') drawTile(g, e.x, e.y);
      else if (e.k === 'pipe') drawPipe(e.o);
      else if (e.k === 'ham') drawHammer(e.o);
      else if (e.k === 'vac') drawVac(e.o);
      else if (e.k === 'flag') {
        const z = heightAt(g, e.o.x, e.o.y);
        drawFlag(e.o.x, e.o.y, z, G.state === 'goal' ? GOLD : MAG);
      } else if (e.k === 'mar') drawMarble();
    }
    drawTiltArrow();
    drawFloats();
    ctx.restore();

    if (G.flashA > 0.01) {
      ctx.fillStyle = rgba(G.flashRgb, G.flashA * 0.45);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (hidden) {
      requestAnimationFrame(frame);
      return;
    }
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    if (acc > 0.2) acc = 0.2;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }

  function bindPad(el, key) {
    const on = function (e) {
      e.preventDefault();
      pad[key] = true;
      el.classList.add('held');
      audio.ensure();
    };
    const off = function (e) {
      e.preventDefault();
      pad[key] = false;
      el.classList.remove('held');
    };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off);
    el.addEventListener('pointercancel', off);
  }

  bindPad(btnUp, 'u');
  bindPad(btnLeft, 'l');
  bindPad(btnRight, 'r');
  bindPad(btnDown, 'd');

  function setKey(code, down, e) {
    if (code === 'ArrowUp' || code === 'KeyW') { keys.u = down; if (e) e.preventDefault(); }
    else if (code === 'ArrowDown' || code === 'KeyS') { keys.d = down; if (e) e.preventDefault(); }
    else if (code === 'ArrowLeft' || code === 'KeyA') { keys.l = down; if (e) e.preventDefault(); }
    else if (code === 'ArrowRight' || code === 'KeyD') { keys.r = down; if (e) e.preventDefault(); }
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat && (e.code === 'KeyR' || e.code === 'KeyM')) return;
    audio.ensure();
    if (e.code === 'KeyR') {
      e.preventDefault();
      retry();
      return;
    }
    if (e.code === 'KeyM') {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      return;
    }
    if (G.mode === 'title') {
      if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
        e.preventDefault();
        start('practice');
        return;
      }
      if (e.code === 'Digit2') {
        e.preventDefault();
        start('race');
        return;
      }
    }
    if ((G.mode === 'win' || G.mode === 'lose') && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) {
      e.preventDefault();
      retry();
      return;
    }
    setKey(e.code, true, e);
  });

  window.addEventListener('keyup', function (e) {
    setKey(e.code, false, e);
  });

  canvas.addEventListener('pointerdown', function (e) {
    audio.ensure();
    if (G.mode === 'title') return;
    canvas.setPointerCapture(e.pointerId);
    pointer.down = true;
    pointer.id = e.pointerId;
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  });
  function ptrUp(e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener('pointerup', ptrUp);
  canvas.addEventListener('pointercancel', ptrUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    retry();
  });
  btnPractice.addEventListener('click', function () { start('practice'); });
  btnRace.addEventListener('click', function () { start('race'); });
  btnOvRetry.addEventListener('click', function () { retry(); });
  btnOvModes.addEventListener('click', function () {
    audio.ensure();
    sfx('ui');
    showTitle();
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      lastTs = 0;
      if (audio.ctx && audio.ctx.state === 'running') audio.ctx.suspend();
      audio.roll(0, false);
    } else if (audio.ctx && !audio.muted) audio.ctx.resume();
  });

  window.addEventListener('resize', resize);
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
