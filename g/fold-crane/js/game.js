'use strict';

(function () {
  const VW = 720;
  const VH = 900;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-fold-crane-mute';
  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };
  const PAPER = { r: 28, g: 18, b: 48 };
  const BACK = { r: 8, g: 36, b: 52 };

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
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function rgb(c, a) {
    if (a == null) return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function poly() {
    const a = [];
    for (let i = 0; i < arguments.length; i += 2) {
      a.push({ x: arguments[i], y: arguments[i + 1] });
    }
    return a;
  }
  function clonePoly(p) {
    const o = [];
    for (let i = 0; i < p.length; i++) o.push({ x: p[i].x, y: p[i].y });
    return o;
  }

  const SH = {
    sq: poly(0.16, 0.14, 0.84, 0.14, 0.84, 0.82, 0.16, 0.82),
    tri: poly(0.50, 0.14, 0.84, 0.82, 0.16, 0.82),
    kite: poly(0.50, 0.12, 0.84, 0.50, 0.50, 0.88, 0.16, 0.50),
    dia: poly(0.50, 0.16, 0.80, 0.50, 0.50, 0.84, 0.20, 0.50),
    bird: poly(0.50, 0.10, 0.74, 0.36, 0.88, 0.50, 0.50, 0.90, 0.12, 0.50, 0.26, 0.36),
    long: poly(0.20, 0.32, 0.48, 0.12, 0.58, 0.22, 0.84, 0.44, 0.74, 0.78, 0.50, 0.90, 0.24, 0.72, 0.14, 0.50),
    neck: poly(0.14, 0.28, 0.26, 0.14, 0.36, 0.22, 0.50, 0.16, 0.80, 0.38, 0.88, 0.54, 0.72, 0.78, 0.50, 0.90, 0.26, 0.70, 0.16, 0.50),
    wing: poly(0.16, 0.36, 0.28, 0.14, 0.40, 0.24, 0.52, 0.12, 0.64, 0.26, 0.90, 0.40, 0.70, 0.50, 0.80, 0.78, 0.50, 0.90, 0.20, 0.70, 0.08, 0.50),
    crane: poly(
      0.46, 0.10,
      0.58, 0.18,
      0.52, 0.26,
      0.64, 0.34,
      0.92, 0.40,
      0.64, 0.48,
      0.72, 0.72,
      0.88, 0.84,
      0.54, 0.70,
      0.42, 0.90,
      0.38, 0.62,
      0.08, 0.48,
      0.38, 0.42,
      0.34, 0.30,
      0.42, 0.20
    )
  };

  const STAGES = [
    {
      name: '初折',
      sub: 'FIRST',
      hint: '拖过青虚线，把一页折过去',
      toast: '沿虚线对折',
      time: 26,
      anyDir: true,
      numbered: true,
      guide: true,
      tapFold: true,
      mark: 'num',
      glow: 99,
      steps: [
        { poly: 'sq', crease: [0.16, 0.14, 0.84, 0.82], dir: 1 }
      ]
    },
    {
      name: '再折',
      sub: 'TWICE',
      hint: '先对折三角，再沿中线折一次',
      toast: '按 1、2 的顺序折',
      time: 24,
      anyDir: true,
      numbered: true,
      guide: true,
      tapFold: true,
      mark: 'num',
      glow: 99,
      steps: [
        { poly: 'tri', crease: [0.50, 0.14, 0.50, 0.82], dir: 1 },
        { poly: 'kite', crease: [0.50, 0.12, 0.50, 0.88], dir: 1 }
      ]
    },
    {
      name: '纸鸢',
      sub: 'KITE',
      hint: '菱形三折，先竖再横再斜',
      toast: '跟着编号走',
      time: 22,
      anyDir: true,
      numbered: true,
      guide: true,
      mark: 'num',
      glow: 8,
      steps: [
        { poly: 'kite', crease: [0.50, 0.12, 0.50, 0.88], dir: 1 },
        { poly: 'kite', crease: [0.16, 0.50, 0.84, 0.50], dir: 1 },
        {
          poly: 'dia',
          crease: [0.16, 0.16, 0.84, 0.84],
          dir: 1,
          decoys: [[0.84, 0.16, 0.16, 0.84]]
        }
      ]
    },
    {
      name: '诱痕',
      sub: 'BAIT',
      hint: '粉虚线是诱痕，只折带号的青线',
      toast: '别折粉色诱痕',
      time: 22,
      anyDir: true,
      numbered: true,
      mark: 'num',
      glow: 4,
      steps: [
        {
          poly: 'dia',
          crease: [0.50, 0.16, 0.50, 0.84],
          dir: 1,
          decoys: [[0.32, 0.24, 0.68, 0.76]]
        },
        {
          poly: 'dia',
          crease: [0.20, 0.50, 0.80, 0.50],
          dir: -1,
          decoys: [[0.28, 0.28, 0.72, 0.72], [0.30, 0.20, 0.80, 0.70]]
        },
        {
          poly: 'bird',
          crease: [0.50, 0.10, 0.50, 0.90],
          dir: 1,
          decoys: [[0.12, 0.50, 0.88, 0.50], [0.26, 0.36, 0.74, 0.36]]
        }
      ]
    },
    {
      name: '谷折',
      sub: 'VALLEY',
      hint: '方向也要对：沿青箭头拖过折痕',
      toast: '顺着青箭头折',
      time: 20,
      anyDir: false,
      numbered: true,
      mark: 'num',
      glow: 3,
      steps: [
        { poly: 'bird', crease: [0.50, 0.10, 0.50, 0.90], dir: 1 },
        {
          poly: 'bird',
          crease: [0.12, 0.50, 0.88, 0.50],
          dir: -1,
          decoys: [[0.26, 0.36, 0.74, 0.36]]
        },
        {
          poly: 'long',
          crease: [0.48, 0.12, 0.50, 0.90],
          dir: 1,
          decoys: [[0.14, 0.50, 0.84, 0.44]]
        }
      ]
    },
    {
      name: '双翼',
      sub: 'WINGS',
      hint: '四次折，翼线别跟诱痕搞混',
      toast: '翼、身、尾按序',
      time: 20,
      anyDir: false,
      numbered: true,
      mark: 'num',
      glow: 2.2,
      steps: [
        {
          poly: 'long',
          crease: [0.48, 0.12, 0.50, 0.90],
          dir: 1,
          decoys: [[0.20, 0.32, 0.74, 0.78]]
        },
        {
          poly: 'long',
          crease: [0.14, 0.50, 0.84, 0.44],
          dir: -1,
          decoys: [[0.24, 0.72, 0.58, 0.22]]
        },
        {
          poly: 'neck',
          crease: [0.26, 0.14, 0.50, 0.90],
          dir: 1,
          decoys: [[0.16, 0.50, 0.88, 0.54]]
        },
        {
          poly: 'neck',
          crease: [0.16, 0.50, 0.80, 0.38],
          dir: 1,
          decoys: [[0.26, 0.70, 0.72, 0.78], [0.14, 0.28, 0.88, 0.54]]
        }
      ]
    },
    {
      name: '头尾',
      sub: 'NECK',
      hint: '没有编号了，青线才是下一折',
      toast: '只认青色，粉色是诱',
      time: 18,
      anyDir: false,
      numbered: false,
      mark: 'color',
      glow: 2,
      steps: [
        {
          poly: 'neck',
          crease: [0.26, 0.14, 0.72, 0.78],
          dir: 1,
          decoys: [[0.16, 0.50, 0.50, 0.16]]
        },
        {
          poly: 'neck',
          crease: [0.14, 0.28, 0.88, 0.54],
          dir: -1,
          decoys: [[0.26, 0.70, 0.50, 0.16], [0.36, 0.22, 0.72, 0.78]]
        },
        {
          poly: 'wing',
          crease: [0.52, 0.12, 0.50, 0.90],
          dir: 1,
          decoys: [[0.08, 0.50, 0.90, 0.40]]
        },
        {
          poly: 'wing',
          crease: [0.08, 0.50, 0.90, 0.40],
          dir: -1,
          decoys: [[0.28, 0.14, 0.80, 0.78], [0.20, 0.70, 0.64, 0.26]]
        }
      ]
    },
    {
      name: '隐号',
      sub: 'BLIND',
      hint: '下一折只会亮一下，看清再拖',
      toast: '亮过的那条才折',
      time: 18,
      anyDir: false,
      numbered: false,
      mark: 'glow',
      glow: 1.45,
      steps: [
        {
          poly: 'wing',
          crease: [0.52, 0.12, 0.50, 0.90],
          dir: 1,
          decoys: [[0.16, 0.36, 0.80, 0.78], [0.08, 0.50, 0.70, 0.50]]
        },
        {
          poly: 'wing',
          crease: [0.28, 0.14, 0.80, 0.78],
          dir: -1,
          decoys: [[0.40, 0.24, 0.90, 0.40], [0.20, 0.70, 0.64, 0.26]]
        },
        {
          poly: 'wing',
          crease: [0.08, 0.50, 0.90, 0.40],
          dir: 1,
          decoys: [[0.16, 0.36, 0.52, 0.12], [0.50, 0.90, 0.90, 0.40]]
        },
        {
          poly: 'crane',
          crease: [0.50, 0.12, 0.50, 0.88],
          dir: 1,
          decoys: [[0.12, 0.50, 0.88, 0.50], [0.16, 0.16, 0.84, 0.84]]
        }
      ]
    },
    {
      name: '默折',
      sub: 'MEMORY',
      hint: '亮得更短，五折连着来',
      toast: '记住闪光再折',
      time: 22,
      anyDir: false,
      numbered: false,
      mark: 'glow',
      glow: 0.78,
      steps: [
        {
          poly: 'crane',
          crease: [0.50, 0.12, 0.50, 0.88],
          dir: 1,
          decoys: [[0.12, 0.50, 0.88, 0.50], [0.16, 0.16, 0.84, 0.84]]
        },
        {
          poly: 'crane',
          crease: [0.12, 0.50, 0.88, 0.50],
          dir: -1,
          decoys: [[0.20, 0.30, 0.80, 0.80], [0.84, 0.16, 0.16, 0.84]]
        },
        {
          poly: 'crane',
          crease: [0.16, 0.16, 0.84, 0.84],
          dir: 1,
          decoys: [[0.30, 0.20, 0.80, 0.70], [0.18, 0.40, 0.82, 0.62]]
        },
        {
          poly: 'crane',
          crease: [0.84, 0.16, 0.16, 0.84],
          dir: 1,
          decoys: [[0.15, 0.55, 0.85, 0.35], [0.40, 0.12, 0.60, 0.88]]
        },
        {
          poly: 'crane',
          crease: [0.18, 0.40, 0.82, 0.62],
          dir: -1,
          decoys: [[0.25, 0.75, 0.85, 0.25], [0.22, 0.22, 0.70, 0.85]]
        }
      ]
    },
    {
      name: '成鹤',
      sub: 'CRANE',
      hint: '最后六折。闪光一眨眼，谷向别反',
      toast: '折完它就会飞',
      time: 28,
      anyDir: false,
      numbered: false,
      mark: 'glow',
      glow: 0.42,
      steps: [
        {
          poly: 'crane',
          crease: [0.50, 0.12, 0.50, 0.88],
          dir: 1,
          decoys: [[0.12, 0.50, 0.88, 0.50], [0.16, 0.16, 0.84, 0.84], [0.30, 0.20, 0.80, 0.70]]
        },
        {
          poly: 'crane',
          crease: [0.12, 0.50, 0.88, 0.50],
          dir: -1,
          decoys: [[0.18, 0.40, 0.82, 0.62], [0.84, 0.16, 0.16, 0.84]]
        },
        {
          poly: 'crane',
          crease: [0.16, 0.16, 0.84, 0.84],
          dir: 1,
          decoys: [[0.22, 0.22, 0.70, 0.85], [0.15, 0.55, 0.85, 0.35]]
        },
        {
          poly: 'crane',
          crease: [0.84, 0.16, 0.16, 0.84],
          dir: 1,
          decoys: [[0.25, 0.75, 0.85, 0.25], [0.40, 0.12, 0.60, 0.88]]
        },
        {
          poly: 'crane',
          crease: [0.18, 0.40, 0.82, 0.62],
          dir: -1,
          decoys: [[0.20, 0.30, 0.80, 0.80], [0.12, 0.62, 0.88, 0.62]]
        },
        {
          poly: 'crane',
          crease: [0.40, 0.12, 0.60, 0.88],
          dir: 1,
          decoys: [[0.30, 0.20, 0.80, 0.70], [0.15, 0.55, 0.85, 0.35], [0.22, 0.22, 0.70, 0.85]]
        }
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
  const stageLabel = document.getElementById('stage-label');
  const foldLabel = document.getElementById('fold-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const fillWrap = document.getElementById('fill-wrap');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const particles = [];
  const motes = [];
  const rings = [];

  const ptr = {
    down: false,
    id: null,
    x: VW * 0.5,
    y: VH * 0.5,
    sx: 0,
    sy: 0,
    px: 0.5,
    py: 0.5,
    moved: 0
  };

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    step: 0,
    lives: LIVES,
    time: 26,
    timeMax: 26,
    poly: clonePoly(SH.sq),
    creases: [],
    sel: 0,
    selDir: 1,
    foldKind: '',
    foldT: 0,
    foldCrease: null,
    foldDir: 1,
    morphT: 0,
    morphFrom: null,
    morphTo: null,
    pendingNext: false,
    pendingWin: false,
    shake: 0,
    gold: 0,
    mag: 0,
    glowT: 0,
    toastT: 0,
    why: '',
    crumple: 0,
    flyT: 0,
    taught: false,
    lock: 0,
    ps: 460,
    pcx: 360,
    pcy: 478
  };

  for (let i = 0; i < 28; i++) {
    motes.push({
      x: Math.random() * VW,
      y: Math.random() * VH,
      r: rand(0.6, 1.8),
      s: rand(6, 18),
      p: Math.random() * TAU,
      mag: i % 3 === 0
    });
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.min(0.28, Math.max(0.03, dur));
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 900;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    fold: function () {
      this.ensure();
      this.noise(0.09, 0.055, 700);
      this.beep(420, 0.1, 'triangle', 0.04, 180);
    },
    good: function () {
      this.ensure();
      this.beep(659, 0.09, 'sine', 0.045);
      this.beep(880, 0.16, 'triangle', 0.05, 1320);
    },
    crumple: function () {
      this.ensure();
      this.noise(0.22, 0.1, 280);
      this.beep(180, 0.18, 'sawtooth', 0.05, 60);
    },
    deny: function () {
      this.ensure();
      this.beep(196, 0.07, 'square', 0.03, 90);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.055);
      this.beep(659, 0.14, 'sine', 0.05);
      this.beep(784, 0.18, 'sine', 0.05);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.04, 784);
    },
    tick: function () {
      this.ensure();
      this.beep(220, 0.05, 'sine', 0.028, 110);
    },
    rustle: function () {
      this.ensure();
      this.noise(0.05, 0.03, 1400);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  function sideOf(p, a, b) {
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  }

  function distToSeg(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const ab2 = abx * abx + aby * aby;
    let t = ab2 > 0 ? (apx * abx + apy * aby) / ab2 : 0;
    t = clamp(t, 0, 1);
    return hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
  }

  function creasePerp(c) {
    const ux = c.b.x - c.a.x;
    const uy = c.b.y - c.a.y;
    const len = hypot(ux, uy) || 1;
    return { x: -uy / len, y: ux / len };
  }

  function creaseMid(c) {
    return { x: (c.a.x + c.b.x) * 0.5, y: (c.a.y + c.b.y) * 0.5 };
  }

  function extendCrease(c) {
    const ux = c.b.x - c.a.x;
    const uy = c.b.y - c.a.y;
    const len = hypot(ux, uy) || 1;
    const k = 3;
    return {
      a: { x: c.a.x - (ux / len) * k, y: c.a.y - (uy / len) * k },
      b: { x: c.b.x + (ux / len) * k, y: c.b.y + (uy / len) * k }
    };
  }

  function lineHit(p, q, a, b) {
    const sp = sideOf(p, a, b);
    const sq = sideOf(q, a, b);
    const den = sp - sq;
    if (Math.abs(den) < 1e-12) return { x: q.x, y: q.y };
    const t = sp / den;
    return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
  }

  function clipPoly(poly, a, b, keepSign) {
    const out = [];
    const n = poly.length;
    if (n < 3) return out;
    const EPS = 1e-8;
    for (let i = 0; i < n; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % n];
      const sp = sideOf(p, a, b);
      const sq = sideOf(q, a, b);
      const pin = sp * keepSign >= -EPS;
      const qin = sq * keepSign >= -EPS;
      if (pin && qin) {
        out.push({ x: q.x, y: q.y });
      } else if (pin && !qin) {
        out.push(lineHit(p, q, a, b));
      } else if (!pin && qin) {
        out.push(lineHit(p, q, a, b));
        out.push({ x: q.x, y: q.y });
      }
    }
    return out;
  }

  function cleanPoly(p) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      if (out.length) {
        const b = out[out.length - 1];
        if (hypot(a.x - b.x, a.y - b.y) < 1e-5) continue;
      }
      out.push({ x: a.x, y: a.y });
    }
    if (out.length > 1) {
      const a = out[0];
      const b = out[out.length - 1];
      if (hypot(a.x - b.x, a.y - b.y) < 1e-5) out.pop();
    }
    return out;
  }

  function splitFold(poly, crease, swipeDir) {
    const ext = extendCrease(crease);
    const keep = cleanPoly(clipPoly(poly, ext.a, ext.b, swipeDir));
    const move = cleanPoly(clipPoly(poly, ext.a, ext.b, -swipeDir));
    return { keep: keep, move: move, ext: ext };
  }

  function rotateFold(p, a, b, angle) {
    const ax = b.x - a.x;
    const ay = b.y - a.y;
    const len = hypot(ax, ay) || 1;
    const ux = ax / len;
    const uy = ay / len;
    const vx = -uy;
    const vy = ux;
    const dx = p.x - a.x;
    const dy = p.y - a.y;
    const along = dx * ux + dy * uy;
    const perp = dx * vx + dy * vy;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
      x: a.x + ux * along + vx * (perp * c),
      y: a.y + uy * along + vy * (perp * c),
      z: Math.abs(perp) * s
    };
  }

  function peri(poly) {
    let L = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      L += hypot(b.x - a.x, b.y - a.y);
    }
    return L;
  }

  function rotateToTop(poly) {
    let k = 0;
    for (let i = 1; i < poly.length; i++) {
      if (poly[i].y < poly[k].y - 1e-6 || (Math.abs(poly[i].y - poly[k].y) < 1e-6 && poly[i].x < poly[k].x)) {
        k = i;
      }
    }
    return poly.slice(k).concat(poly.slice(0, k));
  }

  function resample(poly, n) {
    const src = rotateToTop(poly);
    const L = peri(src);
    const out = [];
    if (L < 1e-6 || src.length < 3) {
      for (let i = 0; i < n; i++) out.push({ x: 0.5, y: 0.5 });
      return out;
    }
    for (let i = 0; i < n; i++) {
      let d = (i / n) * L;
      let placed = false;
      for (let j = 0; j < src.length; j++) {
        const a = src[j];
        const b = src[(j + 1) % src.length];
        const e = hypot(b.x - a.x, b.y - a.y);
        if (d <= e || j === src.length - 1) {
          const t = e > 0 ? d / e : 0;
          out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
          placed = true;
          break;
        }
        d -= e;
      }
      if (!placed) out.push({ x: src[0].x, y: src[0].y });
    }
    return out;
  }

  function morphPoly(a, b, t) {
    const A = resample(a, 48);
    const B = resample(b, 48);
    const o = [];
    for (let i = 0; i < 48; i++) {
      o.push({ x: lerp(A[i].x, B[i].x, t), y: lerp(A[i].y, B[i].y, t) });
    }
    return o;
  }

  function makeCrease(arr, decoy, dir) {
    return {
      a: { x: arr[0], y: arr[1] },
      b: { x: arr[2], y: arr[3] },
      decoy: !!decoy,
      dir: dir == null ? 1 : dir
    };
  }

  function stepData() {
    return STAGES[G.stage].steps[G.step];
  }

  function buildCreases() {
    const st = stepData();
    const list = [];
    list.push(makeCrease(st.crease, false, st.dir));
    const d = st.decoys || [];
    for (let i = 0; i < d.length; i++) list.push(makeCrease(d[i], true, d[i][4] || 1));
    list.sort(function (a, b) {
      const ma = a.a.x + a.b.x + a.a.y * 0.3;
      const mb = b.a.x + b.b.x + b.a.y * 0.3;
      return ma - mb;
    });
    G.creases = list;
    G.sel = 0;
    if (STAGES[G.stage].guide) {
      for (let i = 0; i < list.length; i++) {
        if (!list[i].decoy) {
          G.sel = i;
          break;
        }
      }
    }
    const cur = list[G.sel];
    G.selDir = cur ? cur.dir : 1;
  }

  function world(p) {
    return {
      x: G.pcx + (p.x - 0.5) * G.ps,
      y: G.pcy + (p.y - 0.5) * G.ps
    };
  }

  function worldZ(p) {
    const w = world(p);
    const lift = (p.z || 0) * G.ps * 0.42;
    return { x: w.x, y: w.y - lift };
  }

  function paperPt(wx, wy) {
    return {
      x: (wx - G.pcx) / G.ps + 0.5,
      y: (wy - G.pcy) / G.ps + 0.5
    };
  }

  function eventToVirtual(e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function toast(msg, warn, ok) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('ok', !!ok);
    toastEl.classList.remove('hidden');
    G.toastT = 1.35;
  }

  function setHint(text, cls) {
    hintEl.textContent = text;
    hintEl.classList.toggle('warn', cls === 'warn');
    hintEl.classList.toggle('hot', cls === 'hot');
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove('hidden');
    panel.className = 'panel';
    if (kind === 'win') panel.classList.add('win');
    if (kind === 'lose' || kind === 'fail') panel.classList.add('lose');
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovKicker.textContent = kicker || 'CRANE';
    if (ops != null) ovOps.textContent = ops;
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const n = st.steps.length;
    const doneStages = G.mode === 'win' || G.mode === 'fly' ? STAGES.length : G.stage;
    const frac = (doneStages + (G.mode === 'win' || G.mode === 'fly' ? 0 : G.step / Math.max(1, n))) / STAGES.length;
    stageLabel.textContent = '第 ' + (G.stage + 1) + ' 折 · ' + st.name;
    foldLabel.textContent = '痕 ' + Math.min(n, G.step + 1) + '/' + n;
    const sec = Math.max(0, Math.ceil(G.time));
    timeLabel.textContent = sec + 's';
    timeLabel.classList.toggle('warn', G.time <= 5 && (G.mode === 'play' || G.foldKind !== ''));
    fillNum.textContent = doneStages + '/' + STAGES.length;
    fillBar.style.transform = 'scaleX(' + clamp(frac, 0, 1) + ')';
    fillWrap.classList.toggle('hot', frac >= 0.999 || G.mode === 'win' || G.mode === 'fly');
    fillWrap.classList.toggle('warn', G.lives <= 1 && G.mode !== 'win' && G.mode !== 'title');
    pipsEl.innerHTML = '';
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement('span');
      s.className = 'pip' + (i < G.lives ? ' on' : '') + (G.lives === 1 && i === 0 ? ' warn' : '');
      pipsEl.appendChild(s);
    }
  }

  function emit(n, opt) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: opt.x + rand(-opt.j, opt.j),
        y: opt.y + rand(-opt.j, opt.j),
        vx: rand(opt.vx0, opt.vx1),
        vy: rand(opt.vy0, opt.vy1),
        life: opt.life * rand(0.55, 1.15),
        max: opt.life,
        r: rand(opt.r0, opt.r1),
        mag: !!opt.mag,
        gold: !!opt.gold,
        g: opt.g || 0,
        rot: rand(0, TAU),
        vr: rand(-8, 8)
      });
    }
  }

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag });
  }

  function loadStepPoly() {
    const st = stepData();
    G.poly = clonePoly(SH[st.poly]);
  }

  function beginStage(freshTime) {
    const st = STAGES[G.stage];
    G.step = 0;
    G.foldKind = '';
    G.foldT = 0;
    G.foldCrease = null;
    G.crumple = 0;
    G.why = '';
    G.pendingNext = false;
    G.pendingWin = false;
    G.morphFrom = null;
    G.morphTo = null;
    G.morphT = 0;
    loadStepPoly();
    buildCreases();
    G.glowT = st.glow || 0;
    if (freshTime) {
      G.time = st.time;
      G.timeMax = st.time;
    }
    G.mode = 'play';
    G.lock = 0.12;
    setHint(st.hint, '');
    toast(st.toast, false, true);
    syncHud();
  }

  function startRun() {
    G.lives = LIVES;
    G.stage = 0;
    G.t = 0;
    G.taught = false;
    G.flyT = 0;
    particles.length = 0;
    rings.length = 0;
    audio.start();
    hideOverlay();
    beginStage(true);
  }

  function canFold() {
    return G.mode === 'play' && G.foldKind === '' && G.lock <= 0;
  }

  function nearestCrease(p, maxd) {
    let best = -1;
    let bd = maxd;
    for (let i = 0; i < G.creases.length; i++) {
      const d = distToSeg(p, G.creases[i].a, G.creases[i].b);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  }

  function pickCreaseFromDrag(p0, p1) {
    let best = -1;
    let bestScore = 1e9;
    for (let i = 0; i < G.creases.length; i++) {
      const c = G.creases[i];
      const d0 = distToSeg(p0, c.a, c.b);
      const mid = { x: (p0.x + p1.x) * 0.5, y: (p0.y + p1.y) * 0.5 };
      const dm = distToSeg(mid, c.a, c.b);
      const d1 = distToSeg(p1, c.a, c.b);
      const score = Math.min(d0, dm) * 0.7 + d1 * 0.3;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (bestScore > 0.16) return -1;
    return best;
  }

  function beginPull(c, dir) {
    G.foldCrease = c;
    G.foldDir = dir;
    G.foldKind = 'pull';
    G.foldT = 0.02;
    audio.rustle();
  }

  function beginAutoFold() {
    if (!canFold()) return;
    const c = G.creases[G.sel];
    if (!c) return;
    const st = STAGES[G.stage];
    const dir = st.anyDir ? (c.decoy ? G.selDir : c.dir) : G.selDir;
    G.foldCrease = c;
    G.foldDir = dir;
    G.foldT = 0.02;
    G.foldKind = 'go';
    audio.fold();
  }

  function commitPull() {
    if (G.foldT < 0.7) {
      G.foldKind = 'back';
      return;
    }
    G.foldKind = 'go';
    audio.fold();
  }

  function foldIsCorrect() {
    const c = G.foldCrease;
    if (!c || c.decoy) return false;
    const st = STAGES[G.stage];
    if (st.anyDir) return true;
    return G.foldDir === c.dir;
  }

  function burstAtCrease(c, gold, mag) {
    const m = creaseMid(c);
    const w = world(m);
    emit(gold ? 16 : 10, {
      x: w.x,
      y: w.y,
      j: 18,
      vx0: -140,
      vx1: 140,
      vy0: -180,
      vy1: 40,
      life: 0.55,
      r0: 1.4,
      r1: 3.4,
      mag: mag,
      gold: gold,
      g: 380
    });
    addRing(w.x, w.y, mag);
  }

  function succeedFold() {
    const c = G.foldCrease;
    const split = splitFold(G.poly, c, G.foldDir);
    const kept = split.keep.length >= 3 ? split.keep : G.poly;
    G.poly = kept;
    G.foldKind = '';
    G.foldT = 0;
    G.gold = 0.45;
    burstAtCrease(c, true, false);
    audio.good();
    G.taught = true;
    G.step += 1;
    const st = STAGES[G.stage];
    G.morphFrom = clonePoly(G.poly);
    if (G.step >= st.steps.length) {
      if (G.stage >= STAGES.length - 1) {
        G.morphTo = clonePoly(SH.crane);
        G.pendingWin = true;
        G.pendingNext = false;
        toast('鹤成', false, true);
      } else {
        G.morphTo = clonePoly(SH[STAGES[G.stage + 1].steps[0].poly]);
        G.pendingNext = true;
        G.pendingWin = false;
        toast('折好了', false, true);
      }
    } else {
      G.morphTo = clonePoly(SH[st.steps[G.step].poly]);
      G.pendingNext = false;
      G.pendingWin = false;
    }
    G.morphT = 0;
    G.mode = 'morph';
    G.foldCrease = null;
    syncHud();
  }

  function failReasonText(why) {
    if (why === 'time') return '时限到，纸皱了';
    if (why === 'bait') return '折到诱痕了';
    if (why === 'dir') return '折反了';
    return '折错了';
  }

  function startFail(why) {
    if (G.mode !== 'play' && G.foldKind === '') return;
    G.why = why;
    G.foldKind = 'snap';
    G.shake = 12;
    G.mag = 0.7;
    G.crumple = 0;
    audio.crumple();
    toast(failReasonText(why), true);
    setHint(failReasonText(why), 'warn');
    if (G.foldCrease) burstAtCrease(G.foldCrease, false, true);
  }

  function finishFail() {
    G.foldKind = '';
    G.foldCrease = null;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const why = G.why;
    showOverlay(
      'fail',
      why === 'time' ? '时尽' : '纸皱',
      more
        ? failReasonText(why) + '。<br />还剩 ' + G.lives + ' 张纸。'
        : '纸皱完了，鹤还没折成。',
      more ? '再折本关' : '再来一局',
      why === 'time' ? 'LATE' : 'CREASE'
    );
    G.mode = 'fail';
  }

  function afterMorph() {
    G.morphFrom = null;
    G.morphTo = null;
    G.morphT = 0;
    if (G.pendingWin) {
      G.mode = 'fly';
      G.flyT = 0;
      G.gold = 1;
      audio.win();
      setHint('鹤飞起来了', 'hot');
      syncHud();
      return;
    }
    if (G.pendingNext) {
      G.stage += 1;
      G.pendingNext = false;
      beginStage(true);
      return;
    }
    G.poly = clonePoly(SH[stepData().poly]);
    buildCreases();
    G.glowT = STAGES[G.stage].glow || 0;
    G.mode = 'play';
    G.lock = 0.08;
    syncHud();
  }

  function startFlyWin() {
    G.mode = 'win';
    showOverlay(
      'win',
      '鹤成',
      '十道折痕都对上了，纸鹤飞走了。',
      '再折一只',
      'ORIZURU'
    );
    setHint('按顺序折完一只鹤', 'hot');
    syncHud();
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      if (G.lives > 0) {
        hideOverlay();
        beginStage(true);
      } else {
        startRun();
      }
    }
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      overlayAction();
      return;
    }
    if (G.mode === 'fly') return;
    beginStage(true);
  }

  function showTitle() {
    G.mode = 'title';
    G.stage = 0;
    G.step = 0;
    G.lives = LIVES;
    G.poly = clonePoly(SH.sq);
    G.foldKind = '';
    G.foldT = 0;
    G.flyT = 0;
    buildCreases();
    showOverlay(
      'title',
      '折鹤',
      '按折痕顺序，把一张纸折成一只鹤。<br />拖过虚线折叠。粉线是诱痕，折错会皱。',
      '开折',
      'CRANE',
      '拖过虚线折叠 · ←→ 选折痕 · ↑↓ 选方向 · 空格折 · M 静音'
    );
    setHint('拖过青虚线对折 · 按顺序折完一只鹤', '');
    syncHud();
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.rot += p.vr * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 1.7;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.gold > 0) G.gold = Math.max(0, G.gold - dt);
    if (G.mag > 0) G.mag = Math.max(0, G.mag - dt);
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    if (G.glowT > 0 && G.glowT < 90 && G.mode === 'play') G.glowT = Math.max(0, G.glowT - dt);
    updateParticles(dt);

    if (G.mode === 'title') return;

    if (G.mode === 'morph') {
      G.morphT += dt * 1.35;
      if (G.morphT >= 1) {
        G.poly = clonePoly(G.morphTo);
        afterMorph();
      } else {
        G.poly = morphPoly(G.morphFrom, G.morphTo, ease(G.morphT));
      }
      return;
    }

    if (G.mode === 'fly') {
      G.flyT += dt;
      if (G.flyT > 1.55) startFlyWin();
      return;
    }

    if (G.foldKind === 'go') {
      G.foldT = Math.min(1, G.foldT + dt * 2.6);
      if (G.foldT >= 1) {
        if (foldIsCorrect()) succeedFold();
        else startFail(G.foldCrease && G.foldCrease.decoy ? 'bait' : 'dir');
      }
      return;
    }

    if (G.foldKind === 'back') {
      G.foldT = Math.max(0, G.foldT - dt * 3.4);
      if (G.foldT <= 0) {
        G.foldKind = '';
        G.foldCrease = null;
      }
      return;
    }

    if (G.foldKind === 'snap') {
      G.crumple += dt;
      if (G.crumple < 0.22) G.foldT = lerp(G.foldT, 0.42, 0.2);
      else G.foldT = Math.max(0, G.foldT - dt * 2.2);
      if (G.crumple > 0.72) finishFail();
      return;
    }

    if (G.mode === 'play') {
      const prev = G.time;
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        startFail('time');
      } else if (G.time <= 5 && Math.ceil(G.time) < Math.ceil(prev)) {
        audio.tick();
      }
      syncHud();
    }
  }

  function pathPoly(ctx, verts, proj) {
    ctx.beginPath();
    for (let i = 0; i < verts.length; i++) {
      const p = proj(verts[i]);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
  }

  function crumpleOffset(p, i) {
    if (G.crumple <= 0) return p;
    const k = ease(clamp(G.crumple * 1.4, 0, 1)) * 0.045;
    const n = Math.sin(i * 2.7 + G.t * 18) * k;
    const m = Math.cos(i * 1.9 + G.t * 14) * k;
    return { x: p.x + n, y: p.y + m, z: p.z };
  }

  function drawPaperFace(ctx, verts, back, alpha) {
    if (!verts || verts.length < 3) return;
    const proj = function (p) { return worldZ(p); };
    pathPoly(ctx, verts, proj);
    const b = boundsOf(verts, proj);
    const g = ctx.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
    if (back) {
      g.addColorStop(0, rgb(BACK, alpha));
      g.addColorStop(0.5, rgb(mix(BACK, CYN, 0.35), alpha));
      g.addColorStop(1, rgb(mix(BACK, MAG, 0.2), alpha));
    } else {
      g.addColorStop(0, rgb(mix(PAPER, MAG, 0.35), alpha));
      g.addColorStop(0.45, rgb(mix(PAPER, INK, 0.22), alpha));
      g.addColorStop(1, rgb(mix(PAPER, CYN, 0.28), alpha));
    }
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = back ? rgb(CYN, 0.75 * alpha) : rgb(mix(MAG, INK, 0.35), 0.85 * alpha);
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgb(INK, 0.05 * alpha);
    ctx.lineWidth = 1;
    for (let i = -4; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(b.x0 - 20, b.y0 + i * 28 + 8);
      ctx.lineTo(b.x1 + 40, b.y0 + i * 28 - 40);
      ctx.stroke();
    }
    ctx.restore();
  }

  function boundsOf(verts, proj) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < verts.length; i++) {
      const p = proj(verts[i]);
      if (p.x < x0) x0 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.x > x1) x1 = p.x;
      if (p.y > y1) y1 = p.y;
    }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  function currentFoldSplit() {
    if (!G.foldCrease || G.foldT <= 0.001) return null;
    const split = splitFold(G.poly, G.foldCrease, G.foldDir);
    if (split.move.length < 3 || split.keep.length < 3) return split;
    const ang = G.foldT * Math.PI;
    const moved = [];
    for (let i = 0; i < split.move.length; i++) {
      moved.push(rotateFold(split.move[i], split.ext.a, split.ext.b, ang));
    }
    return { keep: split.keep, move: moved, ang: ang };
  }

  function drawArrow(ctx, mid, perp, sign, col, strong) {
    const d = { x: perp.x * sign, y: perp.y * sign };
    const p0 = world({ x: mid.x - d.x * 0.11, y: mid.y - d.y * 0.11 });
    const p1 = world({ x: mid.x + d.x * 0.13, y: mid.y + d.y * 0.13 });
    ctx.strokeStyle = rgb(col, strong ? 0.95 : 0.45);
    ctx.fillStyle = rgb(col, strong ? 0.95 : 0.45);
    ctx.lineWidth = strong ? 3 : 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    const nx = -d.y;
    const ny = d.x;
    const ax = p1.x;
    const ay = p1.y;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - d.x * 14 + nx * 7, ay - d.y * 14 + ny * 7);
    ctx.lineTo(ax - d.x * 14 - nx * 7, ay - d.y * 14 - ny * 7);
    ctx.closePath();
    ctx.fill();
  }

  function drawCreases(ctx) {
    if (G.mode === 'morph' || G.mode === 'fly' || G.mode === 'win') return;
    const st = STAGES[G.stage];
    const list = G.mode === 'title' ? [makeCrease([0.16, 0.14, 0.84, 0.82], false, 1)] : G.creases;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      const a = world(c.a);
      const b = world(c.b);
      const sel = G.mode !== 'title' && i === G.sel;
      const correct = !c.decoy;
      const glowing = correct && (G.glowT > 0 || st.mark === 'num' || st.mark === 'color');
      let col = mix(INK, CYN, 0.35);
      let alpha = 0.28;
      if (st.mark === 'num' || st.mark === 'color' || G.mode === 'title') {
        if (correct) {
          col = CYN;
          alpha = 0.95;
        } else {
          col = MAG;
          alpha = sel ? 0.7 : 0.38;
        }
      } else if (st.mark === 'glow') {
        if (glowing) {
          col = CYN;
          alpha = 0.4 + 0.6 * clamp(G.glowT / Math.max(0.2, st.glow), 0, 1);
        } else {
          col = mix(INK, MAG, sel ? 0.45 : 0.2);
          alpha = sel ? 0.7 : 0.32;
        }
      }
      if (sel) alpha = Math.max(alpha, 0.85);
      ctx.save();
      if (G.mode !== 'title' && G.poly && G.poly.length >= 3) {
        pathPoly(ctx, G.poly, world);
        ctx.clip();
      }
      ctx.lineCap = 'round';
      ctx.lineWidth = sel ? 4.2 : correct && glowing ? 3.2 : 2;
      ctx.strokeStyle = rgb(col, alpha);
      ctx.shadowColor = rgb(col, 0.45);
      ctx.shadowBlur = sel || glowing ? 12 : 0;
      ctx.setLineDash(c.decoy ? [5, 8] : [10, 8]);
      ctx.lineDashOffset = -G.t * 28;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.restore();

      if (st.numbered && correct && G.mode === 'play') {
        const m = world(creaseMid(c));
        ctx.beginPath();
        ctx.arc(m.x, m.y, 11, 0, TAU);
        ctx.fillStyle = rgb({ r: 8, g: 6, b: 18 }, 0.85);
        ctx.fill();
        ctx.strokeStyle = rgb(GOLD, 0.9);
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = rgb(GOLD, 1);
        ctx.font = '700 12px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(G.step + 1), m.x, m.y + 0.5);
      }

      const showArrow = (sel || (st.guide && correct)) && G.mode === 'play' && G.foldKind === '';
      if (showArrow) {
        const perp = creasePerp(c);
        const mid = creaseMid(c);
        if (st.anyDir) {
          drawArrow(ctx, mid, perp, 1, CYN, sel);
          drawArrow(ctx, mid, perp, -1, CYN, false);
        } else {
          const dir = sel ? G.selDir : c.dir;
          drawArrow(ctx, mid, perp, dir, dir === c.dir ? CYN : MAG, true);
          if (sel && dir !== c.dir) drawArrow(ctx, mid, perp, c.dir, MAG, false);
        }
      }
    }
  }

  function drawTeach(ctx) {
    if (G.mode !== 'play' || G.taught || G.stage !== 0 || G.foldKind !== '') return;
    const c = G.creases[G.sel] || G.creases[0];
    if (!c) return;
    const t = (G.t % 1.7) / 1.7;
    const e = ease(t);
    const perp = creasePerp(c);
    const mid = creaseMid(c);
    const dir = c.dir;
    const p = {
      x: mid.x - perp.x * dir * 0.16 + perp.x * dir * 0.34 * e,
      y: mid.y - perp.y * dir * 0.16 + perp.y * dir * 0.34 * e
    };
    const w = world(p);
    ctx.beginPath();
    ctx.arc(w.x, w.y, 9, 0, TAU);
    ctx.fillStyle = rgb(CYN, 0.18 + 0.35 * (1 - t));
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w.x, w.y, 4.2, 0, TAU);
    ctx.fillStyle = rgb(CYN, 0.85);
    ctx.fill();
  }

  function drawGhostCrane(ctx) {
    const prog = (G.stage + (G.mode === 'win' || G.mode === 'fly' ? 1 : G.step / Math.max(1, STAGES[G.stage].steps.length))) / STAGES.length;
    const a = 0.05 + 0.16 * clamp(prog, 0, 1);
    const verts = SH.crane;
    ctx.save();
    pathPoly(ctx, verts, world);
    ctx.strokeStyle = rgb(GOLD, a);
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawOrizuru(ctx, x, y, s, t, alpha) {
    const flap = Math.sin(t * 7.1) * 0.34;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.35 + Math.sin(t * 1.4) * 0.1);
    ctx.scale(s, s);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(10, -26);
    ctx.lineTo(5, -14);
    ctx.lineTo(16, -2);
    ctx.lineTo(58, 8 + flap * 36);
    ctx.lineTo(18, 12);
    ctx.lineTo(30, 42);
    ctx.lineTo(52, 58);
    ctx.lineTo(10, 30);
    ctx.lineTo(-8, 52);
    ctx.lineTo(-12, 18);
    ctx.lineTo(-58, 2 - flap * 36);
    ctx.lineTo(-16, -2);
    ctx.lineTo(-8, -16);
    ctx.lineTo(-2, -30);
    ctx.closePath();
    const g = ctx.createLinearGradient(-40, -40, 40, 50);
    g.addColorStop(0, rgb(MAG, 0.9));
    g.addColorStop(0.5, rgb(INK, 0.95));
    g.addColorStop(1, rgb(CYN, 0.9));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgb(GOLD, 0.85);
    ctx.lineWidth = 1.8 / Math.max(0.4, s);
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(4, 22);
    ctx.strokeStyle = rgb(MAG, 0.7);
    ctx.lineWidth = 1.2 / Math.max(0.4, s);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles(ctx) {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const rad = 12 + r.t * 70;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, TAU);
      ctx.strokeStyle = rgb(r.mag ? MAG : GOLD, (1 - r.t) * 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = rgb(p.gold ? GOLD : p.mag ? MAG : CYN, a);
      ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
      ctx.restore();
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, W, H);
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    const shx = G.shake ? Math.sin(G.t * 62) * G.shake : 0;
    const shy = G.shake ? Math.cos(G.t * 51) * G.shake * 0.7 : 0;
    ctx.translate(shx, shy);

    const grd = ctx.createRadialGradient(VW * 0.5, VH * 0.42, 40, VW * 0.5, VH * 0.5, 520);
    grd.addColorStop(0, 'rgba(255,61,184,0.07)');
    grd.addColorStop(0.45, 'rgba(0,240,255,0.04)');
    grd.addColorStop(1, 'rgba(3,1,10,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VW, VH);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const y = (m.y + G.t * m.s) % (VH + 20);
      const x = m.x + Math.sin(G.t * 0.4 + m.p) * 16;
      ctx.beginPath();
      ctx.arc(x, y - 10, m.r, 0, TAU);
      ctx.fillStyle = rgb(m.mag ? MAG : CYN, 0.14);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(G.pcx, G.pcy + G.ps * 0.42, G.ps * 0.42, 22, 0, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    if (G.mode !== 'fly' && G.mode !== 'win') drawGhostCrane(ctx);

    let keep = G.poly;
    let move = null;
    let ang = 0;
    const skipPaper = G.mode === 'fly' || G.mode === 'win';
    if (G.mode === 'title') {
      const demoC = makeCrease([0.16, 0.14, 0.84, 0.82], false, 1);
      const tt = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(G.t * 1.15));
      const split = splitFold(SH.sq, demoC, 1);
      keep = split.keep;
      ang = tt * Math.PI;
      move = [];
      for (let i = 0; i < split.move.length; i++) {
        move.push(rotateFold(split.move[i], split.ext.a, split.ext.b, ang));
      }
    } else {
      const f = currentFoldSplit();
      if (f) {
        keep = f.keep.length >= 3 ? f.keep : G.poly;
        move = f.move;
        ang = f.ang || 0;
      }
    }

    if (!skipPaper) {
      const kdraw = [];
      for (let i = 0; i < keep.length; i++) kdraw.push(crumpleOffset(keep[i], i));

      pathPoly(ctx, kdraw, function (p) {
        const w = world(p);
        return { x: w.x + 10, y: w.y + 14 };
      });
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fill();

      drawPaperFace(ctx, kdraw, false, 1);

      if (move && move.length >= 3) {
        const back = ang > Math.PI * 0.5;
        const md = [];
        for (let i = 0; i < move.length; i++) md.push(crumpleOffset(move[i], i + 7));
        drawPaperFace(ctx, md, back, 1);
      }

      if (G.gold > 0) {
        pathPoly(ctx, kdraw, world);
        ctx.strokeStyle = rgb(GOLD, G.gold * 0.8);
        ctx.lineWidth = 5;
        ctx.stroke();
      }
      if (G.mag > 0) {
        pathPoly(ctx, kdraw, world);
        ctx.strokeStyle = rgb(MAG, G.mag * 0.7);
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      drawCreases(ctx);
      drawTeach(ctx);
    }

    drawParticles(ctx);

    if (G.mode === 'fly' || G.mode === 'win') {
      const t = G.mode === 'win' ? Math.max(G.flyT, 1.55) : G.flyT;
      const y = G.pcy - t * 220;
      const x = G.pcx + Math.sin(t * 2.2) * 40;
      const s = 1.15 + t * 0.25;
      drawOrizuru(ctx, x, y, s, t * 2.4, G.mode === 'win' ? 0.55 : clamp(1.2 - t * 0.15, 0.4, 1));
      if (G.mode === 'fly' && t > 0.2) {
        emit(1, {
          x: x - 20,
          y: y + 10,
          j: 8,
          vx0: -20,
          vx1: 20,
          vy0: 10,
          vy1: 40,
          life: 0.7,
          r0: 1,
          r1: 2.4,
          gold: true,
          g: 0
        });
      }
    }

    const st = STAGES[G.stage];
    if (G.mode === 'play' && !st.anyDir) {
      ctx.font = '600 12px Segoe UI, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgb(CYN, 0.55);
      ctx.fillText('谷  →  青箭头', VW * 0.5, 36);
    }
  }

  function onPtrDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (G.mode === 'title' || G.mode === 'fail' || G.mode === 'win') return;
    audio.ensure();
    const v = eventToVirtual(e);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = v.x;
    ptr.y = v.y;
    ptr.sx = v.x;
    ptr.sy = v.y;
    ptr.moved = 0;
    const p = paperPt(v.x, v.y);
    ptr.px = p.x;
    ptr.py = p.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  }

  function onPtrMove(e) {
    const v = eventToVirtual(e);
    ptr.x = v.x;
    ptr.y = v.y;
    const p = paperPt(v.x, v.y);
    if (!ptr.down) {
      if (canFold()) {
        const i = nearestCrease(p, 0.07);
        if (i >= 0 && i !== G.sel) G.sel = i;
      }
      return;
    }
    const dx = v.x - ptr.sx;
    const dy = v.y - ptr.sy;
    ptr.moved = hypot(dx, dy);
    if (!canFold() && G.foldKind !== 'pull') return;
    const p0 = paperPt(ptr.sx, ptr.sy);
    if (G.foldKind === '' && ptr.moved > 10) {
      const idx = pickCreaseFromDrag(p0, p);
      if (idx >= 0) {
        G.sel = idx;
        const c = G.creases[idx];
        const perp = creasePerp(c);
        const along = (p.x - p0.x) * perp.x + (p.y - p0.y) * perp.y;
        const dir = along >= 0 ? 1 : -1;
        beginPull(c, dir);
      }
    }
    if (G.foldKind === 'pull' && G.foldCrease) {
      const perp = creasePerp(G.foldCrease);
      const along = (p.x - p0.x) * perp.x + (p.y - p0.y) * perp.y;
      G.foldDir = along >= 0 ? 1 : -1;
      G.foldT = clamp(Math.abs(along) / 0.28, 0, 0.96);
    }
  }

  function onPtrUp(e) {
    if (!ptr.down) return;
    ptr.down = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (G.foldKind === 'pull') {
      commitPull();
      return;
    }
    if (!canFold()) return;
    if (ptr.moved < 10) {
      const p = paperPt(ptr.x, ptr.y);
      const i = nearestCrease(p, 0.08);
      if (i >= 0) {
        G.sel = i;
        const st = STAGES[G.stage];
        if (st.tapFold && !G.creases[i].decoy) {
          G.selDir = G.creases[i].dir;
          beginAutoFold();
        }
      }
    }
  }

  function cycleSel(dir) {
    if (!canFold() || G.creases.length === 0) return;
    G.sel = (G.sel + dir + G.creases.length) % G.creases.length;
    const c = G.creases[G.sel];
    if (c && STAGES[G.stage].guide) G.selDir = c.dir;
    audio.rustle();
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
      retry();
      e.preventDefault();
      return;
    }
    if (G.mode === 'title' || G.mode === 'fail' || G.mode === 'win') {
      if (k === ' ' || k === 'Enter') {
        overlayAction();
        e.preventDefault();
      }
      return;
    }
    if (k === 'Escape') {
      if (G.foldKind === 'pull') {
        G.foldKind = 'back';
        e.preventDefault();
      }
      return;
    }
    if (!canFold() && k !== ' ') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      cycleSel(-1);
      e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      cycleSel(1);
      e.preventDefault();
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      G.selDir = 1;
      e.preventDefault();
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      G.selDir = -1;
      e.preventDefault();
    } else if (k === ' ' || k === 'Enter') {
      beginAutoFold();
      e.preventDefault();
    }
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      draw();
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
  }

  canvas.addEventListener('pointerdown', onPtrDown);
  canvas.addEventListener('pointermove', onPtrMove);
  canvas.addEventListener('pointerup', onPtrUp);
  canvas.addEventListener('pointercancel', onPtrUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = performance.now();
  });
  ovBtn.addEventListener('click', function () {
    audio.ensure();
    overlayAction();
  });
  btnRetry.addEventListener('click', function () {
    retry();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
