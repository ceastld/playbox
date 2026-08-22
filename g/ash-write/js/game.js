'use strict';

(function () {
  const VW = 480;
  const VH = 660;
  const TAB = { x: 40, y: 84, w: 400, h: 400 };
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-ash-write-mute';
  const OPS = '按住拖动画灰 · WASD 移笔 · 空格落灰 · M 静音';
  const SPEED = 200;

  const STAGES = [
    {
      name: '一', sub: 'ONE',
      hint: '按住，沿着这一横拖过去。写满就会定着',
      toast: '沿淡横拖过去',
      time: 32, ash: 100, brush: 32, deposit: 4.8, seal: 0.60,
      wind: 0.03, gust: 1.7, gap: 10, first: 10.2, tele: 0.95, blast: 0.78,
      ang: 0, spin: 0,
      strokes: [[[0.14, 0.50], [0.86, 0.50]]]
    },
    {
      name: '丨', sub: 'STEM',
      hint: '风从右边来。一竖写满再停笔',
      toast: '从上往下写这一竖',
      time: 30, ash: 96, brush: 30, deposit: 4.9, seal: 0.64,
      wind: 0.05, gust: 1.72, gap: 8.6, first: 7.6, tele: 0.9, blast: 0.78,
      ang: 0, spin: 0,
      strokes: [[[0.50, 0.14], [0.50, 0.86]]]
    },
    {
      name: '十', sub: 'CROSS',
      hint: '横竖都要写满。定着的笔，风吹不走',
      toast: '先横后竖，写满再换笔',
      time: 30, ash: 92, brush: 28, deposit: 5.0, seal: 0.67,
      wind: 0.065, gust: 1.78, gap: 7.2, first: 6.5, tele: 0.88, blast: 0.76,
      ang: 0.15, spin: 0,
      strokes: [
        [[0.16, 0.48], [0.84, 0.48]],
        [[0.50, 0.14], [0.50, 0.86]]
      ]
    },
    {
      name: '人', sub: 'PERSON',
      hint: '两斜。风来前回完一笔',
      toast: '撇捺都要定着',
      time: 28, ash: 88, brush: 26, deposit: 5.2, seal: 0.70,
      wind: 0.08, gust: 1.85, gap: 6.4, first: 5.6, tele: 0.84, blast: 0.74,
      ang: 0.55, spin: 0,
      strokes: [
        [[0.54, 0.14], [0.20, 0.86]],
        [[0.46, 0.40], [0.82, 0.86]]
      ]
    },
    {
      name: '口', sub: 'GATE',
      hint: '先左边，再横折，最后封底',
      toast: '三笔围成口',
      time: 30, ash: 90, brush: 24, deposit: 5.35, seal: 0.72,
      wind: 0.095, gust: 1.9, gap: 5.8, first: 5.0, tele: 0.8, blast: 0.72,
      ang: Math.PI, spin: 0,
      strokes: [
        [[0.24, 0.20], [0.24, 0.80]],
        [[0.24, 0.20], [0.76, 0.20], [0.76, 0.80]],
        [[0.24, 0.80], [0.76, 0.80]]
      ]
    },
    {
      name: '山', sub: 'PEAK',
      hint: '三峰一座。一笔一笔定着',
      toast: '中峰最高，底边也要写',
      time: 30, ash: 86, brush: 22, deposit: 5.5, seal: 0.74,
      wind: 0.11, gust: 1.98, gap: 5.3, first: 4.6, tele: 0.78, blast: 0.7,
      ang: Math.PI * 1.15, spin: 0,
      strokes: [
        [[0.22, 0.80], [0.22, 0.42]],
        [[0.50, 0.80], [0.50, 0.16]],
        [[0.78, 0.80], [0.78, 0.42]],
        [[0.22, 0.80], [0.78, 0.80]]
      ]
    },
    {
      name: '水', sub: 'WATER',
      hint: '水会散。趁风歇着写，一笔写实',
      toast: '先竖钩，再左右',
      time: 28, ash: 82, brush: 20, deposit: 5.7, seal: 0.76,
      wind: 0.13, gust: 2.08, gap: 4.8, first: 4.1, tele: 0.74, blast: 0.68,
      ang: 0.35, spin: 0.22,
      strokes: [
        [[0.50, 0.12], [0.50, 0.70], [0.40, 0.82]],
        [[0.22, 0.38], [0.50, 0.38]],
        [[0.38, 0.48], [0.16, 0.80]],
        [[0.58, 0.46], [0.84, 0.82]]
      ]
    },
    {
      name: '火', sub: 'FIRE',
      hint: '火怕风。短笔先定着，再写长撇捺',
      toast: '两点先落，再写撇捺',
      time: 26, ash: 78, brush: 19, deposit: 6.0, seal: 0.78,
      wind: 0.15, gust: 2.2, gap: 4.3, first: 3.6, tele: 0.7, blast: 0.72,
      ang: -0.4, spin: 0.38,
      strokes: [
        [[0.28, 0.24], [0.40, 0.44]],
        [[0.72, 0.24], [0.60, 0.44]],
        [[0.50, 0.14], [0.22, 0.86]],
        [[0.50, 0.38], [0.80, 0.86]]
      ]
    },
    {
      name: '风', sub: 'GALE',
      hint: '风向会转。看箭头，风来时先停笔',
      toast: '外框先定着',
      time: 26, ash: 74, brush: 18, deposit: 6.6, seal: 0.76,
      wind: 0.17, gust: 2.3, gap: 3.9, first: 3.2, tele: 0.66, blast: 0.7,
      ang: 0.2, spin: 0.7,
      strokes: [
        [[0.30, 0.14], [0.16, 0.82]],
        [[0.30, 0.14], [0.78, 0.14], [0.78, 0.62], [0.62, 0.84], [0.48, 0.74]],
        [[0.50, 0.30], [0.36, 0.62]],
        [[0.56, 0.36], [0.70, 0.54]]
      ]
    },
    {
      name: '书', sub: 'BOOK',
      hint: '灰少风急。每笔都要写实，别在风里硬写',
      toast: '一笔定着再写下笔',
      time: 24, ash: 72, brush: 17, deposit: 7.0, seal: 0.78,
      wind: 0.19, gust: 2.42, gap: 3.5, first: 2.9, tele: 0.62, blast: 0.68,
      ang: 2.4, spin: 0.95,
      strokes: [
        [[0.26, 0.18], [0.74, 0.18]],
        [[0.50, 0.18], [0.50, 0.82]],
        [[0.24, 0.40], [0.50, 0.40]],
        [[0.24, 0.58], [0.70, 0.58], [0.70, 0.82]],
        [[0.32, 0.82], [0.80, 0.82]]
      ]
    }
  ];

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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function nhash(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  function angNorm(a) {
    a = (a + Math.PI) % TAU;
    if (a < 0) a += TAU;
    return a - Math.PI;
  }

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
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const stageLabel = document.getElementById('stage-label');
  const ashLabel = document.getElementById('ash-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const keys = { l: false, r: false, u: false, d: false, write: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH * 0.5, id: null };
  const particles = [];
  const motes = [];
  const streaks = [];
  const pips = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    ash: 100,
    ashMax: 100,
    remain: 32,
    bx: VW * 0.5,
    by: VH * 0.5,
    tx: VW * 0.5,
    ty: VH * 0.5,
    writing: false,
    strokes: [],
    brushR: 28,
    deposit: 3.2,
    sealNeed: 0.7,
    windBase: 0.05,
    gustAmt: 1.6,
    gap: 8,
    first: 8,
    tele: 0.9,
    blast: 0.75,
    windAng: 0,
    windSpin: 0,
    gustPhase: 'lull',
    gustT: 0,
    gustStr: 0,
    writeMul: 1,
    cover: 0,
    sealedN: 0,
    lock: 0,
    settle: 0,
    toastT: 0,
    shake: 0,
    flash: 0,
    flashRgb: '0,240,255',
    why: '',
    warnTime: false,
    warnAsh: false,
    wrote: false,
    pulse: 0,
    demoT: 0,
    demoPhase: 0,
    demoU: 0
  };

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    windSrc: null,
    windFilt: null,
    windGain: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
        this.bootWind();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    bootWind: function () {
      if (!this.ctx || this.windSrc) return;
      const sr = this.ctx.sampleRate;
      const n = Math.max(1, sr | 0);
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = last * 0.7 + (Math.random() * 2 - 1) * 0.3;
        data[i] = last;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 380;
      f.Q.value = 0.6;
      const g = this.ctx.createGain();
      g.gain.value = 0.0001;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
      this.windSrc = src;
      this.windFilt = f;
      this.windGain = g;
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
      const n = Math.max(1, (this.ctx.sampleRate * Math.min(dur, 0.45)) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(from || 700, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    tickWind: function (str, play) {
      if (!this.ctx || !this.windGain) return;
      const t = this.ctx.currentTime;
      const on = play && !this.muted;
      this.windGain.gain.setTargetAtTime(on ? 0.012 + str * 0.05 : 0.0001, t, 0.12);
      if (this.windFilt) {
        this.windFilt.frequency.setTargetAtTime(280 + str * 900, t, 0.1);
      }
    },
    write: function () {
      if (G.clock - this.lastW < 0.07) return;
      this.lastW = G.clock;
      this.ensure();
      this.noise(0.06, 0.03, 900, 280);
      this.beep(180 + Math.random() * 40, 0.05, 'triangle', 0.018, 90);
    },
    lastW: -9,
    seal: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.07, 784);
      this.beep(784, 0.22, 'triangle', 0.05, 1175);
    },
    gust: function () {
      this.ensure();
      this.noise(0.32, 0.09, 500, 160);
      this.beep(110, 0.28, 'sine', 0.04, 50);
    },
    warn: function () {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 280);
    },
    start: function () {
      this.ensure();
      this.beep(262, 0.12, 'sine', 0.05, 392);
      this.beep(392, 0.18, 'triangle', 0.04, 523);
    },
    fail: function () {
      this.ensure();
      this.beep(196, 0.4, 'sawtooth', 0.07, 70);
      this.noise(0.22, 0.05, 400, 80);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.07);
      this.beep(659, 0.14, 'sine', 0.06);
      this.beep(784, 0.16, 'sine', 0.06);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    },
    clear: function () {
      this.ensure();
      this.beep(440, 0.1, 'triangle', 0.055, 880);
      this.beep(660, 0.2, 'sine', 0.05, 1320);
    },
    life: function () {
      this.ensure();
      this.beep(180, 0.22, 'sawtooth', 0.055, 70);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 2.15;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    while (pips.length < LIVES) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone') + (G.lives === 1 && i === 0 ? ' warn' : '');
    }
  }

  function fmtTime(s) {
    const n = Math.max(0, Math.ceil(s));
    return n < 10 ? '0:' + '0' + n : '0:' + n;
  }

  function syncHud() {
    const k = clamp(G.cover, 0, 1);
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = String(Math.round(k * 100));
    const gusting = G.mode === 'play' && G.gustPhase !== 'lull';
    const low = G.mode === 'play' && k < 0.18 && G.wrote;
    fillWrap.classList.toggle('warn', gusting || low);
    fillWrap.classList.toggle('hot', (G.mode === 'play' || G.mode === 'clear' || G.mode === 'win') && G.sealedN === G.strokes.length && G.strokes.length > 0);
    const st = STAGES[G.stage];
    if (G.mode === 'title') {
      stageLabel.textContent = '十页';
      ashLabel.textContent = '灰 —';
      ashLabel.className = '';
      timeLabel.textContent = '—';
      timeLabel.className = '';
      stageLabel.className = '';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 页 · ' + (st ? st.name : '');
      stageLabel.classList.toggle('hot', G.sealedN > 0);
      ashLabel.textContent = '灰 ' + Math.round(Math.max(0, G.ash));
      ashLabel.classList.toggle('warn', G.ash < G.ashMax * 0.22);
      timeLabel.textContent = fmtTime(G.remain);
      timeLabel.classList.toggle('warn', G.remain < 6);
    }
    syncPips();
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove('hidden');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kicker;
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovOps.textContent = ops || OPS;
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: lerp(spec.vx0, spec.vx1, Math.random()),
        vy: lerp(spec.vy0, spec.vy1, Math.random()),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: lerp(spec.r0, spec.r1, Math.random()),
        mag: !!spec.mag,
        gold: !!spec.gold,
        cyan: !!spec.cyan,
        ash: spec.ash !== false
      });
    }
  }

  function glyphBox() {
    const pad = 0.14;
    return {
      x: TAB.x + TAB.w * pad,
      y: TAB.y + TAB.h * pad,
      w: TAB.w * (1 - pad * 2),
      h: TAB.h * (1 - pad * 2)
    };
  }

  function buildStrokes(spec) {
    const box = glyphBox();
    const strokes = [];
    for (let s = 0; s < spec.strokes.length; s++) {
      const raw = spec.strokes[s];
      const pts = [];
      for (let i = 0; i < raw.length; i++) {
        pts.push({
          x: box.x + raw[i][0] * box.w,
          y: box.y + raw[i][1] * box.h
        });
      }
      const samples = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const ax = pts[i].x;
        const ay = pts[i].y;
        const bx = pts[i + 1].x;
        const by = pts[i + 1].y;
        const len = hypot(bx - ax, by - ay);
        const n = Math.max(1, Math.ceil(len / 7.2));
        for (let k = 0; k < n; k++) {
          if (k === 0 && i > 0) continue;
          const t = k / n;
          samples.push({
            x: ax + (bx - ax) * t,
            y: ay + (by - ay) * t,
            cover: 0
          });
        }
      }
      const last = pts[pts.length - 1];
      samples.push({ x: last.x, y: last.y, cover: 0 });
      strokes.push({
        pts: pts,
        samples: samples,
        sealed: false,
        sealT: 0,
        mean: 0
      });
    }
    return strokes;
  }

  function meanCover(stroke) {
    const sm = stroke.samples;
    if (!sm.length) return 0;
    let s = 0;
    for (let i = 0; i < sm.length; i++) s += sm[i].cover;
    return s / sm.length;
  }

  function totalCover() {
    let s = 0;
    let n = 0;
    for (let i = 0; i < G.strokes.length; i++) {
      const sm = G.strokes[i].samples;
      for (let k = 0; k < sm.length; k++) {
        s += G.strokes[i].sealed ? 1 : sm[k].cover;
        n += 1;
      }
    }
    return n ? s / n : 0;
  }

  function sealedCount() {
    let n = 0;
    for (let i = 0; i < G.strokes.length; i++) if (G.strokes[i].sealed) n += 1;
    return n;
  }

  function applyStage(spec) {
    G.strokes = buildStrokes(spec);
    G.ashMax = spec.ash;
    G.ash = spec.ash;
    G.remain = spec.time;
    G.brushR = spec.brush;
    G.deposit = spec.deposit;
    G.sealNeed = spec.seal;
    G.windBase = spec.wind;
    G.gustAmt = spec.gust;
    G.gap = spec.gap;
    G.first = spec.first;
    G.tele = spec.tele;
    G.blast = spec.blast;
    G.windAng = spec.ang;
    G.windSpin = spec.spin;
    G.gustPhase = 'lull';
    G.gustT = 0;
    G.gustStr = 0;
    G.writeMul = 1;
    G.cover = 0;
    G.sealedN = 0;
    G.warnTime = false;
    G.warnAsh = false;
    G.wrote = false;
    G.why = '';
    G.pulse = 0;
    const sm0 = G.strokes[0] && G.strokes[0].samples[0];
    G.tx = sm0 ? sm0.x - 18 : TAB.x + 40;
    G.ty = sm0 ? sm0.y : TAB.y + TAB.h * 0.5;
    G.bx = G.tx;
    G.by = G.ty;
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.18;
    applyStage(STAGES[i]);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    streaks.length = 0;
    G.lives = LIVES;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    streaks.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.demoT = 0;
    G.demoPhase = 0;
    G.demoU = 0;
    applyStage(STAGES[0]);
    showOverlay(
      'title',
      '灰书',
      '用灰写字，风会吹散。沿淡影落灰，写满一笔就会定着。赶在风来之前。',
      '落灰',
      'ASH',
      OPS
    );
    setHint('沿淡影落灰 · 写满定着 · 风来会散', '');
    syncHud();
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    let title = '风散了';
    let kicker = 'SCATTER';
    let lead;
    if (why === 'time') {
      title = '时辰到';
      kicker = 'LATE';
      lead = more
        ? '字还没定着，时辰已经过了。一笔写实再换。<br />还剩 ' + G.lives + ' 次。'
        : '时辰尽了。十页未成。';
    } else if (why === 'ash') {
      title = '灰尽了';
      kicker = 'EMPTY';
      lead = more
        ? '灰洒在格子外了。贴着淡影写。<br />还剩 ' + G.lives + ' 次。'
        : '灰尽了。十页未成。';
    } else {
      lead = more ? '还剩 ' + G.lives + ' 次。' : '十页未成。';
    }
    showOverlay('lose', title, lead, more ? '再写这页' : '再来一局', kicker);
    setHint(why === 'ash' ? '贴着淡影写，别浪费灰' : '风来前写满定着', 'warn');
    audio.fail();
    if (!more) audio.life();
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.9;
    G.flash = 0.7;
    G.flashRgb = '255,227,107';
    audio.clear();
    toast(STAGES[G.stage].name + ' · 定着', 'gold');
    burstSealed();
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay('win', '字定着了', '十页灰都写成了字。风再也吹不散。', '再写一巡', 'CLEAR');
      setHint('十页皆成', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 0.95;
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      if (G.lives > 0) startStage(G.stage);
      else startRun();
    }
  }

  function burstSealed() {
    for (let s = 0; s < G.strokes.length; s++) {
      const st = G.strokes[s];
      if (!st.sealed && G.mode === 'play') continue;
      const sm = st.samples;
      const step = Math.max(1, (sm.length / 8) | 0);
      for (let i = 0; i < sm.length; i += step) {
        emit(2, {
          x: sm[i].x, y: sm[i].y, j: 6,
          vx0: -40, vx1: 40, vy0: -80, vy1: -10,
          life: 0.7, r0: 1.2, r1: 3.2, gold: true, ash: false
        });
      }
    }
  }

  function spawnGustStreaks() {
    const ca = Math.cos(G.windAng);
    const sa = Math.sin(G.windAng);
    for (let i = 0; i < 14; i++) {
      if (streaks.length > 28) streaks.shift();
      const along = rand(-0.45, 0.45);
      const px = TAB.x + TAB.w * 0.5 - ca * 230 + -sa * along * TAB.h;
      const py = TAB.y + TAB.h * 0.5 - sa * 230 + ca * along * TAB.w;
      streaks.push({
        x: px,
        y: py,
        vx: ca * rand(520, 860),
        vy: sa * rand(520, 860),
        life: rand(0.28, 0.5),
        max: 0.5,
        w: rand(18, 42)
      });
    }
  }

  function blowFromSamples(amt) {
    const ca = Math.cos(G.windAng);
    const sa = Math.sin(G.windAng);
    for (let s = 0; s < G.strokes.length; s++) {
      const st = G.strokes[s];
      if (st.sealed) continue;
      const sm = st.samples;
      const step = Math.max(1, (sm.length / 10) | 0);
      for (let i = 0; i < sm.length; i += step) {
        if (sm[i].cover < 0.08) continue;
        emit(1, {
          x: sm[i].x, y: sm[i].y, j: 4,
          vx0: ca * 80, vx1: ca * 260, vy0: sa * 80 - 20, vy1: sa * 220,
          life: 0.55, r0: 1.4, r1: 3.4, cyan: Math.random() > 0.55, ash: true
        });
      }
    }
    if (amt > 0.4) {
      G.shake = Math.max(G.shake, 0.55 + amt * 0.25);
      G.flash = Math.max(G.flash, 0.28);
      G.flashRgb = '0,240,255';
    }
  }

  function depositAt(x, y, dt) {
    const r = G.brushR;
    const r2 = r * r;
    let used = 0;
    for (let s = 0; s < G.strokes.length; s++) {
      const st = G.strokes[s];
      if (st.sealed) continue;
      const sm = st.samples;
      for (let i = 0; i < sm.length; i++) {
        const dx = sm[i].x - x;
        const dy = sm[i].y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const d = Math.sqrt(d2);
        const fall = Math.pow(1 - d / r, 1.12);
        const add = G.deposit * fall * dt * G.writeMul;
        const room = 1 - sm[i].cover;
        const got = add < room ? add : room;
        sm[i].cover += got;
        used += got;
      }
    }
    return used;
  }

  function erode(dt) {
    const rate = G.windBase + G.gustStr * G.gustAmt;
    if (rate <= 0.0001) return 0;
    let lost = 0;
    for (let s = 0; s < G.strokes.length; s++) {
      const st = G.strokes[s];
      if (st.sealed) continue;
      const sm = st.samples;
      for (let i = 0; i < sm.length; i++) {
        if (sm[i].cover <= 0) continue;
        const before = sm[i].cover;
        sm[i].cover = Math.max(0, sm[i].cover - rate * dt);
        lost += before - sm[i].cover;
      }
    }
    return lost;
  }

  function trySeal() {
    let news = false;
    for (let s = 0; s < G.strokes.length; s++) {
      const st = G.strokes[s];
      if (st.sealed) continue;
      const sm = st.samples;
      let sum = 0;
      let ok = 0;
      for (let i = 0; i < sm.length; i++) {
        sum += sm[i].cover;
        if (sm[i].cover >= 0.4) ok += 1;
      }
      const mean = sm.length ? sum / sm.length : 0;
      st.mean = mean;
      if (mean >= G.sealNeed && ok / sm.length >= 0.8) {
        st.sealed = true;
        st.sealT = 0;
        for (let i = 0; i < sm.length; i++) sm[i].cover = 1;
        news = true;
        emit(10, {
          x: sm[(sm.length * 0.5) | 0].x,
          y: sm[(sm.length * 0.5) | 0].y,
          j: 16,
          vx0: -70, vx1: 70, vy0: -90, vy1: -8,
          life: 0.65, r0: 1.4, r1: 3.6, gold: true, ash: false
        });
      }
    }
    if (news) {
      audio.seal();
      G.pulse = 1;
      const n = sealedCount();
      if (n < G.strokes.length) toast('定着 ' + n + '/' + G.strokes.length, 'gold');
    }
  }

  function updateGust(dt) {
    G.windAng = angNorm(G.windAng + G.windSpin * dt);
    G.gustT += dt;
    if (G.gustPhase === 'lull') {
      const wait = G.first > 0 ? G.first : G.gap;
      G.gustStr = lerp(G.gustStr, 0, 1 - Math.exp(-6 * dt));
      G.writeMul = lerp(G.writeMul, 1, 1 - Math.exp(-8 * dt));
      if (G.gustT >= wait) {
        G.gustPhase = 'tele';
        G.gustT = 0;
        G.first = 0;
        toast('风来了', 'warn');
        setHint('快定着，或先停笔', 'warn');
        audio.warn();
      }
    } else if (G.gustPhase === 'tele') {
      const u = clamp(G.gustT / Math.max(0.05, G.tele), 0, 1);
      G.gustStr = lerp(G.gustStr, 0.22 + u * 0.28, 1 - Math.exp(-7 * dt));
      G.writeMul = lerp(G.writeMul, 0.62, 1 - Math.exp(-6 * dt));
      if (G.gustT >= G.tele) {
        G.gustPhase = 'blast';
        G.gustT = 0;
        G.gustStr = 1;
        G.writeMul = 0.22;
        spawnGustStreaks();
        blowFromSamples(1);
        setHint('风里写不实 · 停笔等歇', 'warn');
        audio.gust();
      }
    } else {
      G.gustStr = 1 - ease(clamp(G.gustT / Math.max(0.05, G.blast), 0, 1)) * 0.15;
      G.writeMul = 0.2;
      if (G.gustT > 0.08 && (G.t * 60 | 0) % 4 === 0) blowFromSamples(0.2);
      if (G.gustT >= G.blast) {
        G.gustPhase = 'lull';
        G.gustT = 0;
        G.gustStr = 0.08;
        G.writeMul = 1;
        setHint(STAGES[G.stage].hint, '');
      }
    }
  }

  function moveBrush(dt, canMove) {
    let ax = 0;
    let ay = 0;
    let keying = false;
    if (canMove) {
      if (keys.l) { ax -= 1; keying = true; }
      if (keys.r) { ax += 1; keying = true; }
      if (keys.u) { ay -= 1; keying = true; }
      if (keys.d) { ay += 1; keying = true; }
      const m = hypot(ax, ay);
      if (m > 1) { ax /= m; ay /= m; }
    }
    if (canMove && pointer.down) {
      G.tx = pointer.x;
      G.ty = pointer.y;
    } else if (canMove && keying) {
      const spd = SPEED * (keys.write ? 0.64 : 1);
      G.tx += ax * spd * dt;
      G.ty += ay * spd * dt;
    } else if (canMove && pointer.hover) {
      G.tx = pointer.x;
      G.ty = pointer.y;
    }
    G.tx = clamp(G.tx, 12, VW - 12);
    G.ty = clamp(G.ty, 12, VH - 12);
    const k = 1 - Math.exp(-16 * dt);
    G.bx = lerp(G.bx, G.tx, k);
    G.by = lerp(G.by, G.ty, k);
  }

  function updatePlay(dt) {
    if (G.lock > 0) G.lock -= dt;
    updateGust(dt);
    const can = G.lock <= 0;
    moveBrush(dt, can);
    G.writing = can && G.ash > 0 && (pointer.down || keys.write);
    if (G.writing) {
      G.wrote = true;
      const used = depositAt(G.bx, G.by, dt);
      G.ash = Math.max(0, G.ash - (1.55 * dt + used * 0.22));
      if (used > 0.002) {
        audio.write();
        if (Math.random() < 0.55) {
          emit(1, {
            x: G.bx, y: G.by, j: G.brushR * 0.35,
            vx0: Math.cos(G.windAng) * 8, vx1: Math.cos(G.windAng) * 40,
            vy0: Math.sin(G.windAng) * 8 - 12, vy1: Math.sin(G.windAng) * 30,
            life: 0.4, r0: 1.1, r1: 2.6, ash: true
          });
        }
      } else if (Math.random() < 0.4) {
        emit(1, {
          x: G.bx, y: G.by, j: 6,
          vx0: Math.cos(G.windAng) * 30, vx1: Math.cos(G.windAng) * 90,
          vy0: Math.sin(G.windAng) * 20 - 8, vy1: Math.sin(G.windAng) * 70,
          life: 0.35, r0: 0.8, r1: 2.1, mag: true, ash: true
        });
      }
    }
    const lost = erode(dt);
    if (lost > 0.35 && G.gustPhase === 'blast') G.shake = Math.max(G.shake, 0.4);
    trySeal();
    G.sealedN = sealedCount();
    G.cover = totalCover();
    G.remain -= dt;
    if (G.remain < 6 && !G.warnTime) {
      G.warnTime = true;
      toast('时辰将尽', 'warn');
      audio.warn();
    }
    if (G.ash < G.ashMax * 0.2 && !G.warnAsh && G.ash > 0) {
      G.warnAsh = true;
      toast('灰快尽了', 'warn');
      audio.warn();
    }
    if (G.sealedN >= G.strokes.length && G.strokes.length) {
      clearStage();
      return;
    }
    if (G.remain <= 0) {
      G.remain = 0;
      failStage('time');
      return;
    }
    if (G.ash <= 0) {
      G.ash = 0;
      let leftover = 0;
      for (let s = 0; s < G.strokes.length; s++) {
        if (!G.strokes[s].sealed) leftover += meanCover(G.strokes[s]);
      }
      if (leftover < 0.12) failStage('ash');
    }
  }

  function updateDemo(dt) {
    G.demoT += dt;
    const st = G.strokes[0];
    if (!st) return;
    const sm = st.samples;
    G.gustStr = 0;
    G.writeMul = 1;
    if (G.demoPhase === 0) {
      G.demoU += dt * 0.42;
      const u = ease(clamp(G.demoU, 0, 1));
      const i = clamp((u * (sm.length - 1)), 0, sm.length - 1);
      const i0 = i | 0;
      const i1 = Math.min(sm.length - 1, i0 + 1);
      const f = i - i0;
      G.tx = lerp(sm[i0].x, sm[i1].x, f);
      G.ty = lerp(sm[i0].y, sm[i1].y, f);
      G.bx = lerp(G.bx, G.tx, 1 - Math.exp(-10 * dt));
      G.by = lerp(G.by, G.ty, 1 - Math.exp(-10 * dt));
      depositAt(G.bx, G.by, dt * 1.15);
      if (Math.random() < 0.5) {
        emit(1, {
          x: G.bx, y: G.by, j: 8,
          vx0: -8, vx1: 18, vy0: -10, vy1: 8,
          life: 0.4, r0: 1, r1: 2.4, ash: true
        });
      }
      if (G.demoU >= 1.05) {
        G.demoPhase = 1;
        G.demoT = 0;
      }
    } else if (G.demoPhase === 1) {
      if (G.demoT > 0.55) {
        G.demoPhase = 2;
        G.demoT = 0;
        G.gustPhase = 'blast';
        G.gustStr = 1;
        G.windAng = 0;
        spawnGustStreaks();
        blowFromSamples(1);
      }
    } else if (G.demoPhase === 2) {
      G.gustStr = 1;
      erode(dt * 8);
      G.bx += dt * 40;
      if (G.demoT > 0.85) {
        G.demoPhase = 3;
        G.demoT = 0;
        G.gustStr = 0;
        G.gustPhase = 'lull';
      }
    } else {
      erode(dt * 2);
      if (G.demoT > 1.15) {
        for (let i = 0; i < sm.length; i++) sm[i].cover = 0;
        G.demoPhase = 0;
        G.demoU = 0;
        G.demoT = 0;
        G.tx = sm[0].x - 10;
        G.ty = sm[0].y;
      }
    }
    G.cover = totalCover();
    moveBrush(dt, false);
  }

  function updateFx(dt) {
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    G.shake = Math.max(0, G.shake - dt * 2.4);
    G.flash = Math.max(0, G.flash - dt * 1.8);
    G.pulse = Math.max(0, G.pulse - dt * 1.6);
    for (let i = 0; i < G.strokes.length; i++) {
      if (G.strokes[i].sealed) {
        G.strokes[i].sealT = Math.min(1, G.strokes[i].sealT + dt * 2.8);
      }
    }
    const ca = Math.cos(G.windAng);
    const sa = Math.sin(G.windAng);
    const spd = 22 + G.gustStr * 240;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.x += ca * spd * m.s * dt;
      m.y += sa * spd * m.s * dt + Math.sin(G.t * m.p + m.x * 0.02) * 8 * dt;
      if (m.x < -20) m.x += VW + 40;
      if (m.x > VW + 20) m.x -= VW + 40;
      if (m.y < -20) m.y += VH + 40;
      if (m.y > VH + 20) m.y -= VH + 40;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx += ca * (18 + G.gustStr * 140) * dt;
      p.vy += sa * (18 + G.gustStr * 140) * dt + 18 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) streaks.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateDemo(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      moveBrush(dt, false);
      G.cover = 1;
      if (G.settle <= 0) startStage(G.stage + 1);
    } else {
      moveBrush(dt, false);
      erode(dt * (G.mode === 'fail' ? 1.8 : 0.2));
      G.cover = totalCover();
    }
    updateFx(dt);
    const playWind = G.mode === 'play' || G.mode === 'title' || G.mode === 'clear';
    audio.tickWind(0.15 + G.gustStr * 0.85, playWind && (G.mode !== 'title' || G.demoPhase === 2));
    syncHud();
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function strokePath(st) {
    const pts = st.pts;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  }

  function drawMiGrid() {
    const x = TAB.x + 18;
    const y = TAB.y + 18;
    const w = TAB.w - 36;
    const h = TAB.h - 36;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.moveTo(x, y + h * 0.5);
    ctx.lineTo(x + w, y + h * 0.5);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.08)';
    ctx.stroke();
    ctx.restore();
  }

  function drawGhosts() {
    let focus = -1;
    let worst = 2;
    for (let i = 0; i < G.strokes.length; i++) {
      if (G.strokes[i].sealed) continue;
      const m = G.strokes[i].mean || meanCover(G.strokes[i]);
      if (m < worst) {
        worst = m;
        focus = i;
      }
    }
    for (let i = 0; i < G.strokes.length; i++) {
      const st = G.strokes[i];
      if (st.sealed) continue;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      strokePath(st);
      ctx.strokeStyle = i === focus ? 'rgba(255, 61, 184, 0.38)' : 'rgba(255, 61, 184, 0.18)';
      ctx.lineWidth = 15;
      ctx.stroke();
      strokePath(st);
      ctx.strokeStyle = i === focus ? 'rgba(0, 240, 255, 0.42)' : 'rgba(0, 240, 255, 0.16)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawAsh() {
    for (let s = 0; s < G.strokes.length; s++) {
      const st = G.strokes[s];
      if (st.sealed) continue;
      const sm = st.samples;
      for (let i = 0; i < sm.length; i++) {
        const c = sm[i].cover;
        if (c < 0.04) continue;
        const r = 6.4 + c * 4.2;
        ctx.beginPath();
        ctx.arc(sm[i].x, sm[i].y, r, 0, TAU);
        ctx.fillStyle = 'rgba(' + Math.round(188 + c * 40) + ',' + Math.round(184 + c * 30) + ',' + Math.round(204) + ',' + (0.28 + c * 0.62) + ')';
        ctx.fill();
      }
    }
  }

  function drawSealed() {
    for (let s = 0; s < G.strokes.length; s++) {
      const st = G.strokes[s];
      if (!st.sealed) continue;
      const u = ease(st.sealT);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255, 227, 107,' + (0.35 + u * 0.45) + ')';
      ctx.shadowBlur = 16 + G.pulse * 10;
      strokePath(st);
      ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.55 + u * 0.4) + ')';
      ctx.lineWidth = 16;
      ctx.stroke();
      strokePath(st);
      ctx.strokeStyle = 'rgba(255, 227, 107,' + (0.35 + u * 0.55) + ')';
      ctx.lineWidth = 8;
      ctx.stroke();
      strokePath(st);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 250, 230,' + (0.5 + u * 0.4) + ')';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTablet() {
    roundRect(ctx, TAB.x, TAB.y, TAB.w, TAB.h, 18);
    const g = ctx.createLinearGradient(TAB.x, TAB.y, TAB.x, TAB.y + TAB.h);
    g.addColorStop(0, '#1a1024');
    g.addColorStop(0.5, '#120818');
    g.addColorStop(1, '#0c0614');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.38)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    roundRect(ctx, TAB.x + 6, TAB.y + 6, TAB.w - 12, TAB.h - 12, 14);
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    roundRect(ctx, TAB.x, TAB.y, TAB.w, TAB.h, 18);
    ctx.clip();
    for (let i = 0; i < 70; i++) {
      const hx = nhash(i, 3.1);
      const hy = nhash(i, 9.7);
      const x = TAB.x + 12 + hx * (TAB.w - 24);
      const y = TAB.y + 12 + hy * (TAB.h - 24);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.015 + nhash(i, 1.2) * 0.04) + ')';
      ctx.fillRect(x, y, 2 + nhash(i, 4) * 5, 1);
    }
    ctx.restore();
  }

  function drawLedge() {
    const y = TAB.y + TAB.h + 18;
    roundRect(ctx, 56, y, VW - 112, 86, 12);
    ctx.fillStyle = '#0a0612';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();
    const k = clamp(G.ash / Math.max(1, G.ashMax), 0, 1);
    const px = 108;
    const py = y + 58;
    ctx.beginPath();
    ctx.moveTo(px - 28 * k - 8, py);
    ctx.quadraticCurveTo(px, py - 22 - 26 * k, px + 28 * k + 8, py);
    ctx.closePath();
    ctx.fillStyle = 'rgba(176, 170, 188,' + (0.35 + k * 0.45) + ')';
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.beginPath();
    ctx.arc(px - 6, py - 10 * k - 6, 2.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(140, 150, 170, 0.55)';
    ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('余灰', 150, y + 38);
    const ang = G.windAng;
    ctx.save();
    ctx.translate(VW * 0.72, y + 44);
    ctx.rotate(ang);
    const pulse = G.gustPhase === 'tele' ? 0.55 + 0.45 * Math.sin(G.t * 14) : 0.7 + G.gustStr * 0.3;
    ctx.strokeStyle = G.gustPhase === 'lull'
      ? 'rgba(0, 240, 255,' + (0.45 + pulse * 0.2) + ')'
      : 'rgba(255, 61, 184,' + (0.55 + pulse * 0.4) + ')';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(18, 0);
    ctx.moveTo(8, -8);
    ctx.lineTo(18, 0);
    ctx.lineTo(8, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(4, 0);
    ctx.lineTo(-6, 6);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = G.gustPhase === 'lull' ? 'rgba(0, 240, 255, 0.55)' : 'rgba(255, 61, 184, 0.75)';
    ctx.textAlign = 'center';
    ctx.font = '10px "Segoe UI", "PingFang SC", sans-serif';
    const windWord = G.gustPhase === 'blast' ? '狂风' : G.gustPhase === 'tele' ? '风起' : '风歇';
    ctx.fillText(windWord, VW * 0.72, y + 72);
  }

  function drawVane() {
    const cx = TAB.x + TAB.w * 0.5;
    const cy = TAB.y - 28;
    const pulse = G.gustPhase === 'tele' ? 0.6 + 0.4 * Math.sin(G.t * 16) : 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(G.windAng);
    ctx.globalAlpha = 0.35 + pulse * 0.45;
    ctx.strokeStyle = G.gustPhase === 'lull' ? '#00f0ff' : '#ff3db8';
    ctx.fillStyle = G.gustPhase === 'lull' ? 'rgba(0,240,255,0.12)' : 'rgba(255,61,184,0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(-8, -11);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-8, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (G.gustPhase === 'tele') {
      const u = clamp(G.gustT / Math.max(0.05, G.tele), 0, 1);
      ctx.beginPath();
      ctx.arc(cx, cy, 16, -Math.PI / 2, -Math.PI / 2 + u * TAU);
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
  }

  function drawBrush() {
    const x = G.bx;
    const y = G.by;
    const r = G.brushR;
    const on = G.writing;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createRadialGradient(x, y, 2, x, y, r * 1.35);
    rg.addColorStop(0, on ? 'rgba(255, 61, 184, 0.22)' : 'rgba(0, 240, 255, 0.12)');
    rg.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.35, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.strokeStyle = on ? 'rgba(255, 61, 184, 0.7)' : 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, TAU);
    ctx.fillStyle = G.ash > 0 ? '#c8c0d4' : '#3a3044';
    ctx.fill();
    ctx.strokeStyle = '#ff3db8';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    if (G.ash <= 0) {
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 7);
      ctx.lineTo(x + 7, y + 7);
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.8)';
      ctx.stroke();
    }
  }

  function drawMotes() {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fillStyle = 'rgba(' + (m.mag ? '255,61,184,' : '0,240,255,') + m.a + ')';
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      if (p.gold) ctx.fillStyle = 'rgba(255,227,107,' + a + ')';
      else if (p.mag) ctx.fillStyle = 'rgba(255,61,184,' + a + ')';
      else if (p.cyan) ctx.fillStyle = 'rgba(0,240,255,' + a + ')';
      else ctx.fillStyle = 'rgba(198,192,210,' + (a * 0.9) + ')';
      ctx.fill();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      const a = clamp(s.life / s.max, 0, 1);
      ctx.strokeStyle = 'rgba(0, 240, 255,' + (a * 0.55) + ')';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.04, s.y - s.vy * 0.04);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = 'rgba(' + G.flashRgb + ',' + (G.flash * 0.12) + ')';
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawBackdrop() {
    const bg = ctx.createLinearGradient(0, 0, 0, VH);
    bg.addColorStop(0, '#080414');
    bg.addColorStop(0.5, '#05030c');
    bg.addColorStop(1, '#0a0614');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, VW, VH);
    const vg = ctx.createRadialGradient(VW * 0.5, TAB.y + TAB.h * 0.45, 40, VW * 0.5, TAB.y + TAB.h * 0.5, 340);
    vg.addColorStop(0, 'rgba(255, 61, 184, 0.05)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VW, VH);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = G.shake > 0 ? (Math.random() - 0.5) * 10 * G.shake : 0;
    const shy = G.shake > 0 ? (Math.random() - 0.5) * 8 * G.shake : 0;
    ctx.save();
    ctx.translate(ox + shx, oy + shy);
    ctx.scale(scale, scale);
    drawBackdrop();
    drawMotes();
    drawTablet();
    drawMiGrid();
    drawGhosts();
    drawAsh();
    drawSealed();
    drawParticles();
    drawLedge();
    drawVane();
    drawBrush();
    drawFlash();
    ctx.restore();
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * W;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function resize() {
    const stage = document.getElementById('stage');
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function seedFx() {
    motes.length = 0;
    for (let i = 0; i < 54; i++) {
      motes.push({
        x: rand(0, VW),
        y: rand(0, VH),
        r: rand(0.5, 1.8),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        s: rand(0.35, 1.15),
        mag: Math.random() > 0.72
      });
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (k === ' ' || k === 'Spacebar' || k === 'Shift') keys.write = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar')) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      if (!overlay.classList.contains('hidden')) {
        e.preventDefault();
        overlayAction();
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const p = pointerWorld(e);
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
    if (e.pointerType === 'mouse') pointer.hover = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    if (e.pointerType !== 'mouse') pointer.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') pointer.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.write = false;
  });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    overlayAction();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);

  for (let s = 0; s < STAGES.length; s++) {
    const st = STAGES[s];
    if (!st.strokes || !st.strokes.length) throw new Error('stage ' + s);
    for (let i = 0; i < st.strokes.length; i++) {
      if (st.strokes[i].length < 2) throw new Error('stroke ' + s + ':' + i);
    }
  }

  seedFx();
  resize();
  bootTitle();
  syncHud();

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
