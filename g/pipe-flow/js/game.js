'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const QLEN = 5;
  const N = 1;
  const E = 2;
  const S = 4;
  const W = 8;
  const BIT = [N, E, S, W];
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OPP = [2, 3, 0, 1];
  const BEST_KEY = 'playbox-pipe-flow-best';
  const MUTE_KEY = 'playbox-pipe-flow-mute';
  const OPS = '点格放下一段 · 覆盖扣分 · 方向键选格 · 空格放置 · R 重开 · M 静音';
  const NOTES = [523, 587, 659, 784, 880, 1046, 1175];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MINT = [0, 255, 204];
  const TEAL = [20, 224, 176];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const MAG = [255, 61, 184];
  const HOT = [255, 90, 42];
  const WHT = [232, 255, 248];

  const PIECES = [
    { id: 'h', m: E | W, w: 4 },
    { id: 'v', m: N | S, w: 4 },
    { id: 'ne', m: N | E, w: 3 },
    { id: 'nw', m: N | W, w: 3 },
    { id: 'se', m: S | E, w: 3 },
    { id: 'sw', m: S | W, w: 3 },
    { id: 'tn', m: N | E | W, w: 2 },
    { id: 'te', m: N | E | S, w: 2 },
    { id: 'ts', m: E | S | W, w: 2 },
    { id: 'tw', m: N | S | W, w: 2 },
    { id: 'x', m: N | E | S | W, w: 3 }
  ];

  const BAG = [];
  for (let i = 0; i < PIECES.length; i++) {
    for (let k = 0; k < PIECES[i].w; k++) BAG.push(i);
  }

  const STAGES = [
    {
      name: '初接', sub: 'LINK', cols: 6, rows: 6, delay: 15, flow: 0.48,
      sr: 2, sc: 0, sd: 1, er: 3, ec: 5, ed: 3, walls: []
    },
    {
      name: '绕柱', sub: 'POST', cols: 7, rows: 7, delay: 12, flow: 0.58,
      sr: 3, sc: 0, sd: 1, er: 3, ec: 6, ed: 3,
      walls: [[2, 3], [3, 3], [4, 3]]
    },
    {
      name: '折角', sub: 'BEND', cols: 7, rows: 7, delay: 9.5, flow: 0.7,
      sr: 0, sc: 1, sd: 2, er: 6, ec: 5, ed: 0,
      walls: [[2, 2], [2, 3], [4, 4], [4, 5], [3, 1]]
    },
    {
      name: '密格', sub: 'MESH', cols: 8, rows: 8, delay: 7.5, flow: 0.84,
      sr: 1, sc: 0, sd: 1, er: 6, ec: 7, ed: 3,
      walls: [[1, 3], [2, 3], [3, 3], [3, 5], [4, 5], [5, 5], [5, 2], [6, 2]]
    },
    {
      name: '急潮', sub: 'RUSH', cols: 8, rows: 8, delay: 5.5, flow: 1.02,
      sr: 7, sc: 2, sd: 0, er: 0, ec: 6, ed: 2,
      walls: [[2, 1], [2, 2], [2, 4], [3, 4], [4, 4], [5, 3], [5, 6], [6, 6], [4, 1]]
    },
    {
      name: '终管', sub: 'LAST', cols: 8, rows: 8, delay: 4, flow: 1.2,
      sr: 0, sc: 0, sd: 1, er: 7, ec: 7, ed: 3,
      walls: [[0, 3], [1, 3], [1, 5], [2, 5], [3, 1], [3, 2], [4, 4], [4, 6], [5, 2], [6, 2], [6, 5]]
    }
  ];

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const btnCampaign = el('btn-campaign');
  const btnEndless = el('btn-endless');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const hintEl = el('hint');
  const stageEl = el('stage');

  let cssW = 1;
  let cssH = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let CS = 52;
  let gx = 40;
  let gy = 52;
  let gridW = 312;
  let gridH = 312;
  let qy = 620;

  const pips = [];
  const particles = [];
  const pops = [];
  const motes = [];
  const rings = [];

  const ptr = { down: false, hover: false, x: 240, y: 360, id: null, r: -1, c: -1 };

  const G = {
    mode: 'title',
    kind: 'campaign',
    t: 0,
    clock: 0,
    stage: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    grid: [],
    cols: 6,
    rows: 6,
    queue: [],
    heads: [],
    delay: 15,
    delayMax: 15,
    flow: 0.48,
    flowing: false,
    reached: false,
    rush: 0,
    filled: 0,
    loops: 0,
    crosses: 0,
    selR: 2,
    selC: 1,
    freeze: 0,
    shake: 0,
    flash: 0,
    flashRgb: MINT,
    zoom: 1,
    toastT: 0,
    qSlide: 0,
    lock: 0,
    demo: false,
    waterHue: 0
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function bitCount(m) {
    m = m & 15;
    return (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);
  }
  function isCross(mask) {
    return mask === 15;
  }
  function stageCfg() {
    if (G.kind === 'endless') {
      return {
        name: '无尽', sub: 'ENDLESS', cols: 7, rows: 7,
        delay: Math.max(1.2, 10 * Math.pow(0.72, G.wave - 1)),
        flow: Math.min(2.4, 0.62 * Math.pow(1.16, G.wave - 1)),
        sr: 3, sc: 0, sd: 1, er: 3, ec: 6, ed: 3,
        walls: G.wave % 2 === 0 ? [[2, 3], [4, 3]] : [[1, 3], [5, 3], [3, 4]]
      };
    }
    return STAGES[G.stage] || STAGES[0];
  }
  function at(r, c) {
    if (r < 0 || c < 0 || r >= G.rows || c >= G.cols) return null;
    return G.grid[r * G.cols + c];
  }
  function center(r, c) {
    return { x: gx + c * CS + CS * 0.5, y: gy + r * CS + CS * 0.5 };
  }
  function edgePt(r, c, dir) {
    const p = center(r, c);
    const h = CS * 0.5;
    return { x: p.x + DX[dir] * h, y: p.y + DY[dir] * h };
  }
  function manhattan(st) {
    return Math.abs(st.er - st.sr) + Math.abs(st.ec - st.sc);
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    dripT: 0,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
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
    noise(dur, vol, hp, lp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = hp ? 'highpass' : 'lowpass';
      f.frequency.value = hp || lp || 900;
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
    whoosh() {
      if (!this.ctx || this.muted) return;
      const sr = this.ctx.sampleRate;
      const n = (sr * 0.42) | 0;
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      const t = this.ctx.currentTime;
      f.frequency.setValueAtTime(420, t);
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.28);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + 0.45);
    },
    place() {
      this.ensure();
      this.beep(740, 0.045, 'triangle', 0.045, 1180);
      this.noise(0.04, 0.028, 1800);
    },
    replace() {
      this.ensure();
      this.beep(220, 0.07, 'square', 0.03, 140);
      this.noise(0.05, 0.03, 700);
    },
    deny() {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 90);
    },
    water(combo) {
      this.ensure();
      const note = NOTES[combo % NOTES.length];
      this.beep(note, 0.09, 'sine', 0.04 + Math.min(0.03, combo * 0.003), note * 1.5);
      if (combo > 0 && combo % 4 === 0) this.beep(note * 1.5, 0.12, 'triangle', 0.03);
    },
    loop() {
      this.ensure();
      this.beep(988, 0.1, 'sine', 0.05, 1480);
      this.beep(1318, 0.14, 'triangle', 0.035);
    },
    warn() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.03);
    },
    valve() {
      this.ensure();
      this.noise(0.08, 0.04, 0, 600);
      this.beep(196, 0.16, 'sine', 0.05, 392);
    },
    leak() {
      this.ensure();
      this.noise(0.22, 0.09, 400);
      this.beep(180, 0.22, 'sawtooth', 0.045, 70);
    },
    rush() {
      this.ensure();
      this.whoosh();
      this.beep(523, 0.16, 'sine', 0.06, 784);
      this.beep(659, 0.2, 'sine', 0.05, 988);
      this.beep(784, 0.28, 'triangle', 0.055, 1175);
      this.beep(1046, 0.36, 'sine', 0.04, 1568);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.055);
      this.beep(659, 0.14, 'sine', 0.05);
      this.beep(784, 0.18, 'sine', 0.05);
      this.beep(1046, 0.32, 'triangle', 0.055, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.28, 'sine', 0.05, 50);
    },
    life() {
      this.ensure();
      this.beep(330, 0.1, 'sine', 0.04, 180);
    },
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
    }
  };

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(n) && n > 0 ? n : 0;
    } catch (err) {
      G.best = 0;
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function loadMute() {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) {
      return false;
    }
  }

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n, x, y, rgb) {
    if (n === 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.mode === 'title') return;
    G.score = Math.max(0, G.score + n);
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (n > 0 && scoreBox && scoreAdd) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
      addTok += 1;
      const tok = addTok;
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      scoreAdd.style.animation = 'none';
      void scoreAdd.offsetWidth;
      scoreAdd.style.animation = '';
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    if (x != null && n !== 0) {
      pops.push({
        x: x, y: y, t: 0, life: 0.7,
        text: (n > 0 ? '+' : '') + n,
        rgb: rgb || (n > 0 ? GOLD : MAG)
      });
    }
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const show = G.kind === 'campaign' && G.mode !== 'title';
    pipsEl.style.display = show ? 'flex' : 'none';
    if (!show) return;
    while (pips.length < LIVES) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (!stageLabel || !tagLabel) return;
    if (G.mode === 'title') {
      stageLabel.textContent = '通管';
      tagLabel.textContent = 'PIPE';
    } else if (G.kind === 'endless') {
      stageLabel.textContent = '无尽';
      tagLabel.textContent = G.combo >= 3 ? '连 ×' + G.combo : '第 ' + G.wave + ' 波';
    } else {
      const st = STAGES[G.stage];
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 关';
      tagLabel.textContent = G.combo >= 3 ? '连 ×' + G.combo : (st ? st.name : 'PIPE');
    }
    if (G.mode === 'play' && !G.flowing && G.delay > 0) {
      tagLabel.textContent = G.delay.toFixed(1) + '″';
    }
    const win = G.mode === 'win';
    const lose = G.mode === 'lose';
    stageLabel.classList.toggle('hot', win || G.rush > 0);
    tagLabel.classList.toggle('hot', win || G.combo >= 5 || G.rush > 0);
    tagLabel.classList.toggle('warn', lose || (G.mode === 'play' && !G.flowing && G.delay < 3));
    syncPips();
  }

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }

  function showOverlay(kind, title, lead, primary, showEndless) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'LEAK' : 'PIPE';
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovOps.textContent = OPS;
    btnCampaign.textContent = primary;
    btnEndless.classList.toggle('hidden', !showEndless);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function layoutBoard() {
    const st = G.demo ? { cols: G.cols, rows: G.rows } : stageCfg();
    G.cols = st.cols;
    G.rows = st.rows;
    const qh = 92;
    const top = 50;
    CS = Math.min(56, Math.floor(424 / G.cols), Math.floor((VH - top - qh - 18) / G.rows));
    CS = Math.max(36, CS);
    gridW = G.cols * CS;
    gridH = G.rows * CS;
    gx = (VW - gridW) * 0.5;
    gy = top + Math.max(0, (VH - top - qh - 18 - gridH) * 0.12);
    qy = gy + gridH + 16;
  }

  function emptyCell() {
    return {
      kind: 'empty', mask: 0, piece: -1,
      fill: [0, 0, 0, 0], filled: 0,
      squash: 0, pulse: 0, flash: 0, glow: 0,
      locked: false, flowing: false, axes: 0
    };
  }

  function resetCellFx(c) {
    c.fill[0] = c.fill[1] = c.fill[2] = c.fill[3] = 0;
    c.filled = 0;
    c.squash = 0;
    c.pulse = 0;
    c.flash = 0;
    c.glow = 0;
    c.locked = false;
    c.flowing = false;
    c.axes = 0;
  }

  function randPiece() {
    return BAG[(Math.random() * BAG.length) | 0];
  }

  function fillQueue() {
    while (G.queue.length < QLEN) G.queue.push(randPiece());
  }

  function buildGrid(st, prefill) {
    G.cols = st.cols;
    G.rows = st.rows;
    G.grid = [];
    for (let r = 0; r < st.rows; r++) {
      for (let c = 0; c < st.cols; c++) {
        G.grid.push(emptyCell());
      }
    }
    const walls = st.walls || [];
    for (let i = 0; i < walls.length; i++) {
      const cell = at(walls[i][0], walls[i][1]);
      if (cell) cell.kind = 'wall';
    }
    const s = at(st.sr, st.sc);
    if (s) {
      s.kind = 'start';
      s.mask = BIT[st.sd];
      s.piece = -2;
      s.locked = true;
    }
    const e = at(st.er, st.ec);
    if (e) {
      e.kind = 'end';
      e.mask = BIT[st.ed];
      e.piece = -3;
      e.locked = true;
    }
    if (prefill) {
      for (let i = 0; i < prefill.length; i++) {
        const p = prefill[i];
        const cell = at(p[0], p[1]);
        if (!cell || cell.kind !== 'empty') continue;
        cell.kind = 'pipe';
        cell.piece = p[2];
        cell.mask = PIECES[p[2]].m;
      }
    }
    layoutBoard();
  }

  function demoPrefill() {
    return [
      [1, 1, 0], [1, 2, 0], [1, 3, 5],
      [2, 3, 1], [3, 3, 1], [4, 3, 2], [4, 4, 0]
    ];
  }

  function seedBoard(keepScore) {
    const st = stageCfg();
    if (!keepScore) {
      G.score = 0;
      if (scoreEl) scoreEl.textContent = '0';
    }
    G.combo = 0;
    G.heads = [];
    G.flowing = false;
    G.reached = false;
    G.rush = 0;
    G.filled = 0;
    G.loops = 0;
    G.crosses = 0;
    G.delayMax = st.delay;
    G.delay = st.delay;
    G.flow = st.flow;
    G.queue = [];
    fillQueue();
    G.qSlide = 0;
    G.freeze = 0;
    G.selR = clamp(st.sr + DY[st.sd], 0, st.rows - 1);
    G.selC = clamp(st.sc + DX[st.sd], 0, st.cols - 1);
    buildGrid(st, null);
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
  }

  function burst(x, y, n, rgb, spd, life, grav, cone, dir) {
    if (REDUCE) n = Math.min(n, 6);
    const base = dir == null ? 0 : Math.atan2(DY[dir], DX[dir]);
    for (let i = 0; i < n; i++) {
      const a = cone != null ? base + rand(-cone, cone) : rand(0, TAU);
      const s = rand(spd * 0.25, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life, max: life,
        r: rand(1.1, 3.4),
        rgb: rgb,
        g: grav == null ? 90 : grav
      });
    }
  }

  function ring(x, y, rgb) {
    if (REDUCE) return;
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
  }

  function hitStop(ms) {
    if (REDUCE) return;
    G.freeze = Math.max(G.freeze, ms / 1000);
  }

  function bumpShake(n) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
  }

  function placeAt(r, c) {
    if (G.mode !== 'play' || G.reached) return false;
    const cell = at(r, c);
    if (!cell) {
      audio.deny();
      return false;
    }
    if (cell.kind === 'start' || cell.kind === 'end' || cell.kind === 'wall') {
      audio.deny();
      bumpShake(2);
      cell.flash = 0.12;
      return false;
    }
    if (cell.locked || cell.flowing) {
      audio.deny();
      bumpShake(2);
      return false;
    }
    const pid = G.queue[0];
    const p = center(r, c);
    const replacing = cell.kind === 'pipe';
    cell.kind = 'pipe';
    cell.piece = pid;
    cell.mask = PIECES[pid].m;
    resetCellFx(cell);
    cell.squash = 1;
    cell.flash = 0.16;
    G.queue.shift();
    fillQueue();
    G.qSlide = 1;
    G.selR = r;
    G.selC = c;
    if (replacing) {
      addScore(-50, p.x, p.y - 8, MAG);
      audio.replace();
      burst(p.x, p.y, 10, MAG, 140, 0.38, 40);
      hitStop(36);
      bumpShake(3);
      toast('换管 −50', true, false);
    } else {
      addScore(8, p.x, p.y - 8, MINT);
      audio.place();
      burst(p.x, p.y, 8, MINT, 110, 0.32, 20);
      ring(p.x, p.y, MINT);
      hitStop(28);
    }
    return true;
  }

  function exitsOf(mask, enter, cross) {
    if (cross) return [OPP[enter]];
    const out = [];
    for (let d = 0; d < 4; d++) {
      if (d === enter) continue;
      if (mask & BIT[d]) out.push(d);
    }
    out.sort(function (a, b) {
      const pa = a === OPP[enter] ? 0 : 1;
      const pb = b === OPP[enter] ? 0 : 1;
      return pa - pb;
    });
    return out;
  }

  function spawnHead(r, c, enter) {
    G.heads.push({
      r: r, c: c, enter: enter, prog: 0, dead: false, drip: 0
    });
  }

  function startWater() {
    if (G.flowing) return;
    G.flowing = true;
    G.delay = 0;
    const st = G.demo ? demoStage() : stageCfg();
    spawnHead(st.sr, st.sc, OPP[st.sd]);
    const p = center(st.sr, st.sc);
    burst(p.x, p.y, 14, CYN, 130, 0.4, 10);
    ring(p.x, p.y, GOLD);
    if (!G.demo) {
      audio.valve();
      toast('通水', false, true);
    }
    syncHud();
  }

  function demoStage() {
    return {
      name: '演示', cols: 6, rows: 6, delay: 0.8, flow: 0.7,
      sr: 1, sc: 0, sd: 1, er: 4, ec: 5, ed: 3, walls: []
    };
  }

  function startDemo() {
    G.demo = true;
    G.mode = 'title';
    G.kind = 'campaign';
    G.stage = 0;
    G.combo = 0;
    G.heads = [];
    G.flowing = false;
    G.reached = false;
    G.rush = 0;
    G.filled = 0;
    G.loops = 0;
    G.crosses = 0;
    const st = demoStage();
    G.delayMax = st.delay;
    G.delay = st.delay;
    G.flow = st.flow;
    G.queue = [];
    fillQueue();
    buildGrid(st, demoPrefill());
    G.selR = 1;
    G.selC = 1;
  }

  function extraLen() {
    const st = G.demo ? demoStage() : stageCfg();
    return Math.max(0, G.filled - manhattan(st) - 1);
  }

  function beginRush() {
    if (G.reached) return;
    G.reached = true;
    const extra = extraLen();
    const long = extra >= 4 || G.filled >= 10 || G.loops >= 1;
    G.rush = long ? 1.35 : 0.55;
    G.zoom = REDUCE ? 1 : 1.045;
    G.flash = long ? 0.42 : 0.22;
    G.flashRgb = long ? GOLD : MINT;
    hitStop(long ? 70 : 42);
    bumpShake(long ? 8 : 4);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('rush');
      void stageEl.offsetWidth;
      stageEl.classList.add('rush');
    }
    const st = stageCfg();
    const p = center(st.er, st.ec);
    burst(p.x, p.y, long ? 28 : 16, GOLD, 180, 0.55, 30);
    burst(p.x, p.y, 12, MINT, 90, 0.5, 0);
    ring(p.x, p.y, GOLD);
    addScore(250, p.x, p.y - 12, GOLD);
    if (extra > 0) addScore(extra * 35, p.x + 12, p.y + 10, CYN);
    if (G.loops) addScore(G.loops * 40, p.x - 10, p.y + 18, GOLD);
    if (long) {
      audio.rush();
      toast(extra >= 4 ? '长管冲水！' : '通了 · 绕路加分', false, true);
    } else {
      audio.win();
      toast('通了', false, true);
    }
    setHint(long ? '长管冲水' : '通了', 'hot');
    for (let i = 0; i < G.grid.length; i++) {
      if (G.grid[i].filled) G.grid[i].glow = 1;
    }
  }

  function winBoard() {
    if (G.mode !== 'play') return;
    const extra = extraLen();
    addScore(300);
    if (G.kind === 'endless') {
      G.wave += 1;
      toast('第 ' + G.wave + ' 波  流速↑', false, true);
      setHint('水更快了 · 继续铺', 'hot');
      G.combo = 0;
      G.heads = [];
      G.flowing = false;
      G.reached = false;
      G.rush = 0;
      G.filled = 0;
      G.loops = 0;
      G.crosses = 0;
      const st = stageCfg();
      G.delayMax = st.delay;
      G.delay = st.delay;
      G.flow = st.flow;
      G.queue = [];
      fillQueue();
      buildGrid(st, null);
      G.selR = clamp(st.sr + DY[st.sd], 0, st.rows - 1);
      G.selC = clamp(st.sc + DX[st.sd], 0, st.cols - 1);
      addScore(200 + G.wave * 40);
      syncHud();
      return;
    }
    const last = G.stage >= STAGES.length - 1;
    if (last) addScore(1200);
    G.mode = 'win';
    audio.win();
    const lead = last
      ? '六关全通。这一管走了 ' + G.filled + ' 格，绕路 +' + extra + '。得分 ' + G.score + '。'
      : '这一管走了 ' + G.filled + ' 格，绕路 +' + extra + '。得分 ' + G.score + '。';
    showOverlay('win', last ? '全通了' : '通了', lead, last ? '重开' : '下一关', false);
    setHint(last ? '六关全通' : '通了', 'hot');
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    audio.lose();
    G.flash = 0.5;
    G.flashRgb = MAG;
    bumpShake(10);
    if (stageEl) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      if (!REDUCE) stageEl.classList.add('die');
    }
    showOverlay('lose', '漏了', '水管漏了。得分 ' + G.score + '。', '重开', false);
    setHint('漏了', 'warn');
    syncHud();
  }

  function missLife(x, y, dir) {
    if (G.mode !== 'play') return;
    burst(x, y, 22, MAG, 200, 0.5, 120, 0.8, dir);
    burst(x, y, 8, CYN, 80, 0.35, 40);
    G.flash = 0.28;
    G.flashRgb = MAG;
    bumpShake(8);
    hitStop(80);
    audio.leak();
    if (G.kind === 'endless') {
      loseRun();
      return;
    }
    G.lives -= 1;
    syncPips();
    if (G.lives <= 0) {
      loseRun();
      return;
    }
    audio.life();
    toast('还剩 ' + G.lives + ' 管', true, false);
    setHint('漏了一截 · 再铺', 'warn');
    G.lock = 0.45;
    G.combo = 0;
    G.heads = [];
    G.flowing = false;
    G.reached = false;
    G.rush = 0;
    G.filled = 0;
    G.loops = 0;
    G.crosses = 0;
    const st = stageCfg();
    G.delayMax = st.delay;
    G.delay = st.delay;
    G.flow = st.flow;
    G.queue = [];
    fillQueue();
    buildGrid(st, null);
    G.selR = clamp(st.sr + DY[st.sd], 0, st.rows - 1);
    G.selC = clamp(st.sc + DX[st.sd], 0, st.cols - 1);
    syncHud();
  }

  function tryAdvance(head) {
    const cell = at(head.r, head.c);
    if (!cell) return;
    const st = G.demo ? demoStage() : stageCfg();
    const enter = head.enter;
    let mask = cell.mask;
    if (cell.kind === 'start') mask = BIT[st.sd];
    if (cell.kind === 'end') mask = BIT[st.ed];

    if (cell.kind === 'end') {
      if (enter === st.ed) {
        cell.fill[enter] = 1;
        cell.filled |= BIT[enter];
        cell.glow = 1;
        if (G.demo) {
          G.rush = 0.8;
          G.reached = true;
        } else {
          beginRush();
        }
      } else if (!G.reached) {
        const e = edgePt(head.r, head.c, enter);
        if (G.demo) {
          head.dead = true;
        } else {
          missLife(e.x, e.y, enter);
        }
      }
      head.dead = true;
      return;
    }

    const cross = isCross(mask);
    const exits = cell.kind === 'start' ? [st.sd] : exitsOf(mask, enter, cross);
    if (exits.length === 0) {
      const p = center(head.r, head.c);
      if (G.reached || G.demo) {
        head.dead = true;
        burst(p.x, p.y, 6, MINT, 70, 0.3, 20);
      } else {
        missLife(p.x, p.y, enter);
      }
      head.dead = true;
      return;
    }

    if (cross) {
      const axis = (enter === 0 || enter === 2) ? 1 : 2;
      if ((cell.axes & axis) === 0) {
        cell.axes |= axis;
        if (cell.axes === 3) {
          G.crosses += 1;
          G.loops += 1;
          const p = center(head.r, head.c);
          if (!G.demo) {
            addScore(80, p.x, p.y, GOLD);
            audio.loop();
            toast('交汇', false, true);
            burst(p.x, p.y, 16, GOLD, 160, 0.45, 20);
            ring(p.x, p.y, GOLD);
          }
        }
      }
    }

    for (let i = 0; i < exits.length; i++) {
      const d = exits[i];
      const extra = i > 0;
      const nr = head.r + DY[d];
      const nc = head.c + DX[d];
      const nxt = at(nr, nc);
      const ep = edgePt(head.r, head.c, d);
      const leakHere = function () {
        if (extra) return false;
        if (G.reached || G.demo) {
          burst(ep.x, ep.y, 8, MINT, 90, 0.3, 40, 0.5, d);
          return false;
        }
        missLife(ep.x, ep.y, d);
        return true;
      };
      if (!nxt || nxt.kind === 'wall' || nxt.kind === 'empty') {
        if (leakHere()) {
          head.dead = true;
          return;
        }
        continue;
      }
      const need = BIT[OPP[d]];
      const nmask = nxt.kind === 'start' ? BIT[st.sd] : nxt.kind === 'end' ? BIT[st.ed] : nxt.mask;
      if ((nmask & need) === 0) {
        if (leakHere()) {
          head.dead = true;
          return;
        }
        continue;
      }
      if (nxt.flowing || (nxt.filled & need)) {
        G.loops += 1;
        G.combo += 1;
        if (!G.demo) {
          addScore(40, ep.x, ep.y, GOLD);
          audio.loop();
          burst(ep.x, ep.y, 10, GOLD, 120, 0.36, 10);
          ring(ep.x, ep.y, GOLD);
        }
        continue;
      }
      if (extra) {
        G.loops += 1;
        if (!G.demo) {
          addScore(40, ep.x, ep.y, GOLD);
          audio.loop();
          burst(ep.x, ep.y, 8, GOLD, 100, 0.32, 10);
        }
      }
      spawnHead(nr, nc, OPP[d]);
    }
    head.dead = true;
  }

  function enterCell(head) {
    const cell = at(head.r, head.c);
    const st = G.demo ? demoStage() : stageCfg();
    if (!cell || cell.kind === 'wall' || cell.kind === 'empty') {
      const p = head.c >= 0 ? center(clamp(head.r, 0, G.rows - 1), clamp(head.c, 0, G.cols - 1)) : { x: VW * 0.5, y: VH * 0.4 };
      if (G.reached || G.demo) {
        head.dead = true;
        return;
      }
      missLife(p.x, p.y, head.enter);
      head.dead = true;
      return;
    }
    const mask = cell.kind === 'start' ? BIT[st.sd] : cell.kind === 'end' ? BIT[st.ed] : cell.mask;
    if (cell.kind !== 'start' && (mask & BIT[head.enter]) === 0) {
      const e = edgePt(head.r, head.c, head.enter);
      if (G.reached || G.demo) {
        head.dead = true;
        return;
      }
      missLife(e.x, e.y, head.enter);
      head.dead = true;
      return;
    }
    if (cell.flowing || (cell.filled & BIT[head.enter])) {
      G.loops += 1;
      if (!G.demo) {
        const p = center(head.r, head.c);
        addScore(40, p.x, p.y, GOLD);
        audio.loop();
      }
      head.dead = true;
      return;
    }
    cell.flowing = true;
    cell.locked = true;
    cell.pulse = 1;
    G.combo += 1;
    const p = center(head.r, head.c);
    if (!G.demo) {
      const n = 12 + G.combo * 6;
      addScore(n, p.x, p.y - 6, G.combo >= 5 ? GOLD : MINT);
      audio.water(G.combo);
      if (G.combo === 5 || G.combo === 8 || G.combo === 12) {
        toast('连 ×' + G.combo, false, true);
        burst(p.x, p.y, 14, GOLD, 150, 0.4, 10);
      }
    }
    burst(p.x, p.y, 5, MINT, 60, 0.28, 8);
    G.filled += 1;
    G.waterHue = (G.waterHue + 1) % NOTES.length;
    if (G.combo >= 6 && !REDUCE) G.zoom = Math.max(G.zoom, 1.012);
    syncHud();
  }

  function fillArms(cell, head, prog) {
    const st = G.demo ? demoStage() : stageCfg();
    let mask = cell.mask;
    if (cell.kind === 'start') mask = BIT[st.sd];
    if (cell.kind === 'end') mask = BIT[st.ed];
    const cross = isCross(mask);
    const enter = head.enter;
    const exits = cell.kind === 'start' ? [st.sd] : exitsOf(mask, enter, cross);
    if (cell.kind === 'start') {
      cell.fill[st.sd] = Math.max(cell.fill[st.sd], prog);
      return;
    }
    if (cross) {
      const a = enter;
      const b = OPP[enter];
      if (prog < 0.5) {
        cell.fill[a] = Math.max(cell.fill[a], prog / 0.5);
      } else {
        cell.fill[a] = 1;
        cell.fill[b] = Math.max(cell.fill[b], (prog - 0.5) / 0.5);
      }
      return;
    }
    if (prog < 0.5) {
      cell.fill[enter] = Math.max(cell.fill[enter], prog / 0.5);
    } else {
      cell.fill[enter] = 1;
      const t = (prog - 0.5) / 0.5;
      for (let i = 0; i < exits.length; i++) {
        cell.fill[exits[i]] = Math.max(cell.fill[exits[i]], t);
      }
    }
  }

  function finishCell(cell, head) {
    const st = G.demo ? demoStage() : stageCfg();
    let mask = cell.mask;
    if (cell.kind === 'start') mask = BIT[st.sd];
    if (cell.kind === 'end') mask = BIT[st.ed];
    const cross = isCross(mask);
    if (cell.kind === 'start') {
      cell.fill[st.sd] = 1;
      cell.filled |= BIT[st.sd];
    } else if (cross) {
      cell.fill[head.enter] = 1;
      cell.fill[OPP[head.enter]] = 1;
      cell.filled |= BIT[head.enter] | BIT[OPP[head.enter]];
    } else {
      for (let d = 0; d < 4; d++) {
        if (mask & BIT[d]) {
          cell.fill[d] = 1;
          cell.filled |= BIT[d];
        }
      }
    }
    cell.flowing = false;
    cell.glow = Math.max(cell.glow, 0.7);
  }

  function updateHeads(dt) {
    if (!G.flowing && G.rush <= 0) return;
    const speed = G.flow * (G.rush > 0 ? 1.55 + G.combo * 0.02 : 1);
    const heads = G.heads;
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      if (h.dead) continue;
      if (G.mode === 'lose' || (!G.flowing && !G.reached)) return;
      const cell = at(h.r, h.c);
      if (!cell) {
        h.dead = true;
        continue;
      }
      if (h.prog === 0 && !cell.flowing && !(cell.filled & BIT[h.enter])) {
        enterCell(h);
        if (h.dead) continue;
        if (G.mode === 'lose' || (!G.flowing && !G.reached)) return;
      }
      h.prog += speed * dt;
      if (cell && !h.dead) fillArms(cell, h, clamp(h.prog, 0, 1));
      h.drip -= dt;
      if (h.drip <= 0 && cell) {
        h.drip = 0.05;
        const p = center(h.r, h.c);
        if (!REDUCE) {
          particles.push({
            x: p.x + rand(-4, 4),
            y: p.y + rand(-4, 4),
            vx: rand(-12, 12),
            vy: rand(-30, -8),
            life: 0.28, max: 0.28,
            r: rand(0.8, 1.6),
            rgb: G.rush > 0 ? GOLD : MINT,
            g: 40
          });
        }
      }
      if (h.prog >= 1 && !h.dead) {
        if (cell) finishCell(cell, h);
        tryAdvance(h);
        if (G.mode === 'lose' || (!G.flowing && !G.reached)) return;
      }
    }
    const live = [];
    for (let i = 0; i < G.heads.length; i++) {
      if (!G.heads[i].dead) live.push(G.heads[i]);
    }
    G.heads = live;
  }

  function startCampaign() {
    G.demo = false;
    G.mode = 'play';
    G.kind = 'campaign';
    G.stage = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    hideOverlay();
    seedBoard(false);
    audio.start();
    setHint('点格铺管 · 水要来了', '');
    syncHud();
  }

  function startEndless() {
    G.demo = false;
    G.mode = 'play';
    G.kind = 'endless';
    G.stage = 0;
    G.wave = 1;
    G.lives = 1;
    G.score = 0;
    hideOverlay();
    seedBoard(false);
    audio.start();
    setHint('一盘铺到底 · 水会越来越快', '');
    syncHud();
  }

  function nextStage() {
    if (G.kind === 'campaign' && G.stage < STAGES.length - 1) {
      G.stage += 1;
      G.mode = 'play';
      hideOverlay();
      seedBoard(true);
      setHint('第 ' + (G.stage + 1) + ' 关 · 倒计时更短', '');
      syncHud();
      audio.start();
      return;
    }
    restart();
  }

  function restart() {
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    if (G.kind === 'endless') {
      startEndless();
      return;
    }
    startCampaign();
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    if (G.mode === 'win') {
      nextStage();
      return;
    }
    if (G.mode === 'lose') restart();
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 9);
    G.flash = Math.max(0, G.flash - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    G.qSlide = Math.max(0, G.qSlide - dt * 3.4);
    G.zoom = lerp(G.zoom, 1, 1 - Math.exp(-dt * 6));
    G.lock = Math.max(0, G.lock - dt);
    for (let i = 0; i < G.grid.length; i++) {
      const c = G.grid[i];
      c.squash = Math.max(0, c.squash - dt * 4.2);
      c.pulse = Math.max(0, c.pulse - dt * 2.4);
      c.flash = Math.max(0, c.flash - dt);
      if (c.glow > 0.7 && G.rush <= 0) c.glow = Math.max(0.55, c.glow - dt * 0.15);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.4);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t += dt;
      if (pops[i].t > pops[i].life) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.45) rings.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y += Math.sin(G.t * 0.7 + m.p) * 5 * dt;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.freeze = Math.max(0, G.freeze - dt);
    updateFx(dt);

    if (G.mode === 'title') {
      if (!G.flowing) {
        G.delay -= dt;
        if (G.delay <= 0) startWater();
      } else if (G.freeze <= 0) {
        updateHeads(dt);
        if (G.reached) {
          G.rush -= dt;
          if (G.rush <= 0) startDemo();
        } else if (G.heads.length === 0) {
          startDemo();
        }
      }
      return;
    }

    if (G.mode === 'win' || G.mode === 'lose') return;
    if (G.mode !== 'play') return;

    if (!G.flowing) {
      const before = G.delay;
      G.delay = Math.max(0, G.delay - dt);
      if (before > 3 && G.delay <= 3) {
        audio.warn();
        toast('水要来了', true, false);
      }
      if (G.delay <= 0) startWater();
      syncHud();
    }

    if (G.freeze <= 0) {
      updateHeads(dt);
      if (G.mode === 'lose') return;
      if (G.reached) {
        G.rush -= dt;
        if (G.rush <= 0) winBoard();
      } else if (G.flowing && G.heads.length === 0) {
        const st = stageCfg();
        const p = center(st.sr, st.sc);
        missLife(p.x, p.y, st.sd);
      }
    }
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(x, y, w, h, rr);
      return;
    }
    c.moveTo(x + rr, y);
    c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr);
    c.quadraticCurveTo(x, y, x + rr, y);
    c.closePath();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#071510');
    g.addColorStop(0.5, '#05030c');
    g.addColorStop(1, '#04030a');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(220), 20 * scale, sx(240), sy(280), 380 * scale);
    vg.addColorStop(0, 'rgba(0, 255, 204, 0.07)');
    vg.addColorStop(0.55, 'rgba(0, 240, 255, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.45 + 0.55 * Math.sin(G.t * 1.2 + m.p));
      ctx.fillStyle = rgba(i % 3 === 0 ? MINT : i % 3 === 1 ? CYN : GOLD, a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function armEnd(cx, cy, dir, len) {
    return { x: cx + DX[dir] * len, y: cy + DY[dir] * len };
  }

  function strokeArm(cx, cy, dir, len, width, rgb, a, glow) {
    const p = armEnd(cx, cy, dir, len);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = width * scale;
    if (glow) {
      ctx.shadowColor = rgba(rgb, 0.7);
      ctx.shadowBlur = glow * scale;
    }
    ctx.beginPath();
    ctx.moveTo(sx(cx), sy(cy));
    ctx.lineTo(sx(p.x), sy(p.y));
    ctx.stroke();
    ctx.restore();
  }

  function drawPipeGeom(cx, cy, s, mask, opt) {
    const len = s * 0.5;
    const body = s * (opt.body || 0.3);
    const inner = s * (opt.inner || 0.14);
    const fill = opt.fill || [0, 0, 0, 0];
    const metal = opt.metal || [18, 42, 40];
    const rim = opt.rim || TEAL;
    const water = opt.water || MINT;
    const a = opt.a == null ? 1 : opt.a;
    const rush = opt.rush || 0;

    for (let d = 0; d < 4; d++) {
      if (mask & BIT[d]) strokeArm(cx, cy, d, len, body + 3.2, metal, 0.95 * a, 0);
    }
    for (let d = 0; d < 4; d++) {
      if (mask & BIT[d]) strokeArm(cx, cy, d, len, body, rim, 0.55 * a, 0);
    }
    ctx.save();
    ctx.fillStyle = rgba(metal, 0.98 * a);
    ctx.beginPath();
    ctx.arc(sx(cx), sy(cy), (body * 0.52) * scale, 0, TAU);
    ctx.fill();
    ctx.restore();

    for (let d = 0; d < 4; d++) {
      if (!(mask & BIT[d])) continue;
      const f = clamp(fill[d], 0, 1);
      if (f <= 0.02) {
        strokeArm(cx, cy, d, len, inner, [6, 16, 18], 0.7 * a, 0);
        continue;
      }
      const col = rush > 0 ? GOLD : water;
      strokeArm(cx, cy, d, len * f, inner + 1.6, col, 0.35 * a, 8);
      strokeArm(cx, cy, d, len * f, inner, WHT, 0.55 * a, 0);
      if (!REDUCE && f > 0.15) {
        const dash = armEnd(cx, cy, d, len * f * 0.72);
        ctx.fillStyle = rgba(WHT, 0.45 * a);
        ctx.beginPath();
        ctx.arc(sx(dash.x), sy(dash.y), 1.1 * scale, 0, TAU);
        ctx.fill();
      }
    }
    const any = fill[0] + fill[1] + fill[2] + fill[3];
    if (any > 0.05) {
      const col = rush > 0 ? GOLD : water;
      ctx.save();
      ctx.fillStyle = rgba(col, 0.85 * a);
      ctx.shadowColor = rgba(col, 0.8);
      ctx.shadowBlur = 8 * scale;
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), (inner * 0.7) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = rgba(rim, 0.35 * a);
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), (inner * 0.45) * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawCell(r, c) {
    const cell = at(r, c);
    if (!cell) return;
    const x = gx + c * CS;
    const y = gy + r * CS;
    const sq = cell.squash > 0 ? 1 - Math.sin(cell.squash * Math.PI) * 0.1 : 1;
    const pulse = cell.pulse * 0.08;
    const s = CS * (sq + pulse);
    const cx = x + CS * 0.5;
    const cy = y + CS * 0.5;

    ctx.save();
    if (cell.kind === 'wall') {
      roundRect(ctx, sx(x + 3), sy(y + 3), (CS - 6) * scale, (CS - 6) * scale, 7 * scale);
      ctx.fillStyle = 'rgba(28, 10, 24, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.22)';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      ctx.restore();
      return;
    }

    roundRect(ctx, sx(x + 2), sy(y + 2), (CS - 4) * scale, (CS - 4) * scale, 8 * scale);
    ctx.fillStyle = 'rgba(8, 18, 16, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.08)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    if (cell.kind === 'empty') {
      ctx.fillStyle = 'rgba(0, 255, 204, 0.07)';
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), 2.2 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    const glow = Math.max(cell.glow, cell.pulse);
    if (glow > 0) {
      ctx.shadowColor = rgba(G.rush > 0 ? GOLD : MINT, 0.45 * glow);
      ctx.shadowBlur = (10 + glow * 14) * scale;
      roundRect(ctx, sx(x + 4), sy(y + 4), (CS - 8) * scale, (CS - 8) * scale, 8 * scale);
      ctx.fillStyle = rgba(G.rush > 0 ? GOLD : MINT, 0.08 * glow);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    let mask = cell.mask;
    const st = G.demo && G.mode === 'title' ? demoStage() : stageCfg();
    if (cell.kind === 'start') mask = BIT[st.sd];
    if (cell.kind === 'end') mask = BIT[st.ed];

    drawPipeGeom(cx, cy, s, mask, {
      fill: cell.fill,
      a: 1,
      rush: G.rush,
      water: G.combo >= 8 ? GOLD : MINT,
      rim: cell.kind === 'start' ? GOLD : cell.kind === 'end' ? CYN : TEAL
    });

    if (cell.kind === 'start') {
      const beat = 0.7 + 0.3 * Math.sin(G.t * (G.flowing ? 8 : 3));
      ctx.save();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.shadowColor = rgba(GOLD, 0.7);
      ctx.shadowBlur = 12 * scale;
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), (CS * 0.16 * beat) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      if (!G.flowing && G.mode === 'play') {
        const tank = 1 - G.delay / Math.max(0.01, G.delayMax);
        ctx.strokeStyle = rgba(GOLD, 0.45);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(sx(cx), sy(cy), CS * 0.22 * scale, -Math.PI / 2, -Math.PI / 2 + tank * TAU);
        ctx.stroke();
      }
    }
    if (cell.kind === 'end') {
      ctx.save();
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 2 * scale;
      ctx.shadowColor = rgba(CYN, 0.6);
      ctx.shadowBlur = 8 * scale;
      roundRect(ctx, sx(cx - CS * 0.14), sy(cy - CS * 0.14), CS * 0.28 * scale, CS * 0.28 * scale, 4 * scale);
      ctx.stroke();
      ctx.fillStyle = rgba(CYN, G.reached ? 0.7 : 0.25);
      ctx.fill();
      ctx.restore();
    }

    if (cell.flash > 0) {
      roundRect(ctx, sx(x + 2), sy(y + 2), (CS - 4) * scale, (CS - 4) * scale, 8 * scale);
      ctx.fillStyle = 'rgba(255,255,255,' + (cell.flash * 2.2) + ')';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGhost() {
    if (G.mode !== 'play') return;
    const r = ptr.hover || ptr.down ? ptr.r : G.selR;
    const c = ptr.hover || ptr.down ? ptr.c : G.selC;
    if (r < 0 || c < 0) return;
    const cell = at(r, c);
    if (!cell) return;
    const pid = G.queue[0];
    const p = PIECES[pid];
    const cx = gx + c * CS + CS * 0.5;
    const cy = gy + r * CS + CS * 0.5;
    const ok = cell.kind === 'empty' || (cell.kind === 'pipe' && !cell.locked && !cell.flowing);
    ctx.save();
    if (ok) {
      roundRect(ctx, sx(gx + c * CS + 1), sy(gy + r * CS + 1), (CS - 2) * scale, (CS - 2) * scale, 8 * scale);
      ctx.strokeStyle = rgba(MINT, 0.55 + 0.25 * Math.sin(G.t * 6));
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      drawPipeGeom(cx, cy, CS * 0.92, p.m, { a: 0.42, fill: [0, 0, 0, 0], rim: MINT, water: MINT });
    } else {
      roundRect(ctx, sx(gx + c * CS + 1), sy(gy + r * CS + 1), (CS - 2) * scale, (CS - 2) * scale, 8 * scale);
      ctx.strokeStyle = rgba(MAG, 0.45);
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTimer() {
    const x = gx;
    const y = gy - 22;
    const w = gridW;
    const h = 8;
    roundRect(ctx, sx(x), sy(y), w * scale, h * scale, 4 * scale);
    ctx.fillStyle = 'rgba(8, 16, 18, 0.7)';
    ctx.fill();
    const t = G.flowing || G.reached
      ? 1
      : 1 - G.delay / Math.max(0.01, G.delayMax);
    const warn = !G.flowing && G.delay < 3;
    const col = G.reached ? GOLD : G.flowing ? MINT : warn ? MAG : CYN;
    if (t > 0) {
      roundRect(ctx, sx(x), sy(y), Math.max(4, w * t) * scale, h * scale, 4 * scale);
      ctx.fillStyle = rgba(col, 0.85);
      ctx.fill();
    }
    ctx.strokeStyle = rgba(col, 0.35);
    ctx.lineWidth = 1 * scale;
    roundRect(ctx, sx(x), sy(y), w * scale, h * scale, 4 * scale);
    ctx.stroke();

    ctx.font = '700 ' + (11 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(col, 0.9);
    const label = G.reached
      ? '冲水'
      : G.flowing
        ? (G.combo >= 2 ? '连 ×' + G.combo : '通水')
        : '倒计时 ' + G.delay.toFixed(1) + '″';
    ctx.fillText(label, sx(x), sy(y - 10));
    ctx.textAlign = 'right';
    ctx.fillStyle = rgba(WHT, 0.55);
    const st = G.demo && G.mode === 'title' ? demoStage() : stageCfg();
    ctx.fillText(st.sub || '', sx(x + w), sy(y - 10));
  }

  function drawQueue() {
    const nextS = 64;
    const small = 42;
    const gap = 8;
    const total = nextS + gap + (QLEN - 1) * (small + gap) - gap;
    let x = (VW - total) * 0.5;
    const y = qy + 6;
    const slide = ease(G.qSlide) * 18;

    ctx.font = '700 ' + (10 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = rgba(MINT, 0.7);
    ctx.fillText('即将', sx(x + nextS * 0.5), sy(y - 14));

    for (let i = 0; i < G.queue.length; i++) {
      const s = i === 0 ? nextS : small;
      const px = x + (i === 0 ? 0 : nextS + gap + (i - 1) * (small + gap)) + (i > 0 ? slide : 0);
      const py = y + (i === 0 ? 0 : (nextS - small) * 0.5);
      roundRect(ctx, sx(px), sy(py), s * scale, s * scale, 10 * scale);
      ctx.fillStyle = i === 0 ? 'rgba(0, 40, 36, 0.85)' : 'rgba(8, 16, 18, 0.7)';
      ctx.fill();
      ctx.strokeStyle = i === 0 ? rgba(MINT, 0.55) : 'rgba(0, 255, 204, 0.18)';
      ctx.lineWidth = (i === 0 ? 2 : 1) * scale;
      ctx.stroke();
      const pid = G.queue[i];
      drawPipeGeom(px + s * 0.5, py + s * 0.5, s * 0.86, PIECES[pid].m, {
        a: i === 0 ? 1 : 0.72,
        fill: [0, 0, 0, 0],
        rim: i === 0 ? MINT : TEAL,
        body: 0.28,
        inner: 0.12
      });
      if (i === 0 && !REDUCE) {
        const pulse = 0.35 + 0.25 * Math.sin(G.t * 5);
        ctx.strokeStyle = rgba(MINT, pulse * 0.5);
        ctx.lineWidth = 2 * scale;
        roundRect(ctx, sx(px - 2), sy(py - 2), (s + 4) * scale, (s + 4) * scale, 12 * scale);
        ctx.stroke();
      }
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.45;
      ctx.strokeStyle = rgba(r.rgb, 0.55 * (1 - k));
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 28) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.life / q.max;
      ctx.fillStyle = rgba(q.rgb, 0.85 * a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * a * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.font = '800 ' + (13 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const k = p.t / p.life;
      ctx.fillStyle = rgba(p.rgb, 1 - k);
      ctx.fillText(p.text, sx(p.x), sy(p.y - k * 22));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.save();
    const shx = G.shake ? Math.sin(G.t * 62) * G.shake : 0;
    const shy = G.shake ? Math.cos(G.t * 54) * G.shake * 0.6 : 0;
    const z = G.zoom;
    const cx = VW * 0.5;
    const cy = VH * 0.42;
    ctx.translate(sx(cx + shx), sy(cy + shy));
    ctx.scale(z, z);
    ctx.translate(-sx(cx), -sy(cy));

    drawBg();

    roundRect(ctx, sx(gx - 10), sy(gy - 32), (gridW + 20) * scale, (gridH + 44) * scale, 16 * scale);
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.22)';
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();

    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) drawCell(r, c);
    }
    drawGhost();
    drawTimer();
    drawQueue();
    drawFx();
    drawFlash();
    ctx.restore();
  }

  function cellFromWorld(x, y) {
    const c = Math.floor((x - gx) / CS);
    const r = Math.floor((y - gy) / CS);
    if (r < 0 || c < 0 || r >= G.rows || c >= G.cols) return { r: -1, c: -1 };
    return { r: r, c: c };
  }

  function worldPos(e) {
    const rec = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rec.left - ox) / scale,
      y: (e.clientY - rec.top - oy) / scale
    };
  }

  function fit() {
    if (!canvas || !ctx) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cssW = canvas.clientWidth || 1;
    cssH = canvas.clientHeight || 1;
    canvas.width = Math.max(1, (cssW * dpr) | 0);
    canvas.height = Math.max(1, (cssH * dpr) | 0);
    const fitS = Math.min(cssW / VW, cssH / VH);
    scale = fitS;
    ox = (cssW - VW * scale) * 0.5;
    oy = (cssH - VH * scale) * 0.5;
  }

  function onKey(e, down) {
    const k = e.key;
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      restart();
      e.preventDefault();
      return;
    }
    if (k === 'Enter' && overlayOpen()) {
      e.preventDefault();
      primaryAction();
      return;
    }
    if (G.mode !== 'play' || overlayOpen()) return;
    let nr = G.selR;
    let nc = G.selC;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') nr -= 1;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') nr += 1;
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') nc -= 1;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') nc += 1;
    else if (k === ' ' || k === 'Spacebar' || k === 'Enter') {
      e.preventDefault();
      audio.ensure();
      placeAt(G.selR, G.selC);
      return;
    } else {
      return;
    }
    e.preventDefault();
    G.selR = clamp(nr, 0, G.rows - 1);
    G.selC = clamp(nc, 0, G.cols - 1);
    ptr.hover = false;
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: rand(20, VW - 20),
        y: rand(20, VH - 20),
        r: rand(0.6, 1.8),
        a: rand(0.04, 0.14),
        p: rand(0, TAU)
      });
    }
  }

  function selfCheck() {
    if (PIECES.length !== 11) throw new Error('expected 11 pipe pieces');
    if ((PIECES[0].m !== (E | W)) || (PIECES[10].m !== 15)) throw new Error('pipe masks');
    const seen = {};
    for (let i = 0; i < PIECES.length; i++) {
      const m = PIECES[i].m;
      if (seen[m]) throw new Error('duplicate mask ' + m);
      seen[m] = 1;
      if (bitCount(m) < 2) throw new Error('piece must have 2+ arms');
    }
    startDemo();
    G.delay = 0;
    startWater();
    let steps = 0;
    while (steps < 800 && !G.reached) {
      updateHeads(STEP);
      steps += 1;
      if (G.heads.length === 0 && !G.reached) break;
    }
    if (!G.reached) throw new Error('demo snake should reach the end');
    if (G.filled < 8) throw new Error('demo should fill a long path');

    G.demo = false;
    G.mode = 'play';
    G.kind = 'campaign';
    G.stage = 0;
    G.lives = LIVES;
    G.score = 0;
    seedBoard(false);
    startWater();
    steps = 0;
    const lives0 = G.lives;
    while (steps < 400 && G.lives === lives0 && G.mode === 'play') {
      updateHeads(STEP);
      if (G.freeze > 0) G.freeze = 0;
      steps += 1;
      if (!G.flowing) break;
    }
    if (G.lives >= lives0 && G.mode !== 'lose') {
      throw new Error('open start should leak into empty');
    }

    G.demo = false;
    G.mode = 'play';
    G.kind = 'campaign';
    G.stage = 0;
    G.lives = LIVES;
    seedBoard(false);
    G.delay = 30;
    G.flowing = false;
    const path = [[2, 1, 0], [2, 2, 0], [2, 3, 0], [2, 4, 5], [3, 4, 2]];
    for (let i = 0; i < path.length; i++) {
      G.queue[0] = path[i][2];
      if (!placeAt(path[i][0], path[i][1])) {
        throw new Error('should place pipe at ' + path[i][0] + ',' + path[i][1]);
      }
    }
    G.freeze = 0;
    if (placeAt(2, 0)) throw new Error('cannot place on start');
    const scoreBefore = G.score;
    G.queue[0] = 1;
    if (!placeAt(2, 1)) throw new Error('replace should work on unfilled pipe');
    if (G.score >= scoreBefore) throw new Error('replace should cost score');
    G.queue[0] = 0;
    if (!placeAt(2, 1)) throw new Error('restore horizontal after replace');
    G.freeze = 0;
    startWater();
    steps = 0;
    while (steps < 1200 && !G.reached && G.mode === 'play' && G.lives === LIVES) {
      G.freeze = 0;
      updateHeads(STEP);
      steps += 1;
      if (!G.flowing && !G.reached) break;
    }
    if (!G.reached) throw new Error('laid path should reach the end');
  }

  if (!hasDom) {
    selfCheck();
    return;
  }

  try {
    audio.setMuted(loadMute());
  } catch (err) { /* ignore */ }
  loadBest();
  seedMotes();
  startDemo();
  showOverlay('title', '通管', '点格铺管，让水从源头流到出口。<br />绕路越长越爽，漏了就输。', '闯关', true);
  syncHud();
  fit();

  let last = performance.now();
  let acc = 0;

  function frame(now) {
    fit();
    const raw = hidden ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += raw;
    if (acc > 0.12) acc = 0.12;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (overlayOpen()) return;
    const w = worldPos(e);
    const cell = cellFromWorld(w.x, w.y);
    ptr.down = true;
    ptr.hover = true;
    ptr.id = e.pointerId;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.r = cell.r;
    ptr.c = cell.c;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (G.mode === 'play' && cell.r >= 0) placeAt(cell.r, cell.c);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const w = worldPos(e);
    ptr.x = w.x;
    ptr.y = w.y;
    const cell = cellFromWorld(w.x, w.y);
    ptr.r = cell.r;
    ptr.c = cell.c;
    if (e.pointerType === 'mouse') ptr.hover = true;
  });
  function endPtr(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    ptr.down = false;
    ptr.id = null;
    if (e.pointerType !== 'mouse') ptr.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') ptr.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('resize', fit);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  btnCampaign.addEventListener('click', function () {
    primaryAction();
  });
  btnEndless.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startEndless();
    else if (G.mode === 'win' || G.mode === 'lose') restart();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
})();
