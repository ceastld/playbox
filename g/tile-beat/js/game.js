'use strict';

(function () {
  const N = 3;
  const LIVES = 3;
  const COUNT_IN = 4;
  const HIT_WIN = 0.11;
  const PERFECT = 0.055;
  const HOP_DUR = 0.1;
  const MUTE_KEY = 'tile-beat-mute';
  const PINK = '#ff3db8';
  const CYAN = '#00f0ff';
  const GOLD = '#ffe36b';
  const TOTAL = 48;

  const PHRASES = [
    { name: '起踏', sub: 'OPEN', bpm: 96, n: 16, style: 'adj' },
    { name: '斜步', sub: 'CROSS', bpm: 110, n: 16, style: 'mix' },
    { name: '碎格', sub: 'BREAK', bpm: 124, n: 16, style: 'far' }
  ];

  const KEY_TILE = {
    '7': [0, 0], '8': [1, 0], '9': [2, 0],
    '4': [0, 1], '5': [1, 1], '6': [2, 1],
    '1': [0, 2], '2': [1, 2], '3': [2, 2],
    q: [0, 0], e: [2, 0],
    z: [0, 2], x: [1, 2], c: [2, 2]
  };

  const CODE_TILE = {
    Numpad7: [0, 0], Numpad8: [1, 0], Numpad9: [2, 0],
    Numpad4: [0, 1], Numpad5: [1, 1], Numpad6: [2, 1],
    Numpad1: [0, 2], Numpad2: [1, 2], Numpad3: [2, 2]
  };

  const PITCH = [523, 587, 659, 698, 784, 880, 988, 1047, 1175];

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hud = document.getElementById('hud');
  const hintEl = document.getElementById('hint');
  const phraseEl = document.getElementById('phrase');
  const comboEl = document.getElementById('combo');
  const beatEl = document.getElementById('beat');
  const livesEl = document.getElementById('lives');
  const panel = document.getElementById('panel');
  const card = document.getElementById('card');
  const kickerEl = document.getElementById('panel-kicker');
  const titleEl = document.getElementById('panel-title');
  const leadEl = document.getElementById('panel-lead');
  const metaEl = document.getElementById('panel-meta');
  const footEl = document.getElementById('panel-foot');
  const legendEl = document.getElementById('legend');
  const btnMain = document.getElementById('btn-main');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');

  let W = 1;
  let H = 1;
  let dpr = 1;

  const layout = {
    cx: 0,
    cy: 0,
    size: 90,
    gap: 12,
    depth: 12,
    cells: []
  };

  const stars = [];
  const motes = [];
  const particles = [];
  const shards = [];
  const floats = [];
  const ripples = [];
  const stamps = [];
  const cracks = [];

  const cells = [];
  let notes = [];
  let pulses = [];
  let songStart = 0;
  let songEnd = 0;

  const player = {
    x: 1,
    y: 1,
    fx: 1,
    fy: 1,
    fromX: 1,
    fromY: 1,
    hop: 0,
    z: 0,
    queued: null,
    fall: 0
  };

  const G = {
    mode: 'title',
    songT: 0,
    clock: 0,
    lives: LIVES,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    resolved: 0,
    pulse: 0,
    shake: 0,
    flash: 0,
    flashCol: PINK,
    pause: false,
    ending: '',
    endT: 0,
    judge: '',
    judgeT: 0,
    countN: 0,
    phrase: 0,
    hintLock: 0,
    lastHint: '',
    target: null,
    demoI: 4,
    demoT: 0,
    land: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hexRgb(h) {
    return [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16)
    ];
  }
  function rgba(h, a) {
    const c = hexRgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }
  function idx(x, y) {
    return y * N + x;
  }
  function inBound(x, y) {
    return x >= 0 && y >= 0 && x < N && y < N;
  }
  function intact(x, y) {
    return inBound(x, y) && cells[idx(x, y)].ok;
  }

  const audio = {
    ctx: null,
    master: null,
    noiseBuf: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.ctx.destination);
        const n = (this.ctx.sampleRate * 0.28) | 0;
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
      btnMute.textContent = m ? '静音' : '声开';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) {}
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
    noise: function (dur, vol, freq) {
      if (!this.ctx || this.muted || !this.noiseBuf) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq || 1800;
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    click: function (accent) {
      this.beep(accent ? 1480 : 1100, 0.03, 'sine', accent ? 0.07 : 0.035, 700);
      this.beep(accent ? 180 : 90, 0.07, 'sine', accent ? 0.08 : 0.04, 50);
    },
    kick: function () {
      this.beep(140, 0.14, 'sine', 0.11, 42);
    },
    hat: function () {
      this.noise(0.035, 0.03, 7000);
    },
    snare: function () {
      this.noise(0.09, 0.07, 2200);
      this.beep(210, 0.08, 'triangle', 0.03, 90);
    },
    hop: function (x, y) {
      const p = PITCH[idx(x, y)];
      this.beep(p, 0.09, 'triangle', 0.055, p * 1.5);
      this.beep(p * 0.5, 0.07, 'sine', 0.03, p * 0.25);
    },
    land: function (perfect, x, y) {
      const p = PITCH[idx(x, y)];
      this.beep(p, 0.12, 'sine', perfect ? 0.08 : 0.055, p * 2);
      this.beep(p * 0.5, 0.1, 'triangle', 0.04, p);
      if (perfect) this.beep(p * 2, 0.08, 'sine', 0.035, p * 2.4);
    },
    deny: function () {
      this.beep(180, 0.08, 'square', 0.04, 80);
      this.noise(0.05, 0.03, 900);
    },
    shatter: function () {
      this.beep(220, 0.22, 'sawtooth', 0.09, 70);
      this.noise(0.16, 0.1, 900);
      this.beep(90, 0.28, 'sine', 0.06, 40);
    },
    win: function () {
      this.beep(523, 0.18, 'triangle', 0.09, 784);
      this.beep(659, 0.22, 'sine', 0.07, 1047);
      this.beep(784, 0.36, 'triangle', 0.06, 1568);
    },
    lose: function () {
      this.beep(330, 0.45, 'sawtooth', 0.1, 60);
      this.beep(110, 0.7, 'square', 0.06, 40);
      this.noise(0.4, 0.08, 600);
    },
    start: function () {
      this.beep(220, 0.16, 'sine', 0.07, 440);
      this.beep(440, 0.2, 'triangle', 0.05, 880);
    },
    onPulse: function (p) {
      if (!this.ctx || this.muted) return;
      const accent = p.bar === 0;
      this.click(accent);
      if (p.type === 'count') return;
      if (p.bar === 0) this.kick();
      else if (p.bar === 2) this.snare();
      this.hat();
    }
  };

  try {
    audio.muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {}

  function makeStars() {
    stars.length = 0;
    motes.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.42 + 0.06,
        p: Math.random() * Math.PI * 2,
        s: 0.25 + Math.random() * 0.9
      });
    }
    for (let i = 0; i < 18; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        vx: rand(-0.015, 0.015),
        vy: rand(-0.02, -0.004),
        r: rand(1.2, 2.6),
        a: rand(0.06, 0.16),
        col: i % 2 ? PINK : CYAN
      });
    }
  }

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
        col: spec.col,
        g: spec.g || 0
      });
    }
  }

  function floatText(x, y, text, col) {
    floats.push({ x: x, y: y, vy: -46, life: 0.72, max: 0.72, text: text, col: col });
  }

  function stamp(x, y, col) {
    stamps.push({ x: x, y: y, life: 0.42, max: 0.42, col: col });
  }

  function ripple(x, y, col) {
    ripples.push({ x: x, y: y, life: 0.5, max: 0.5, col: col });
  }

  function spawnShards(cell) {
    const L = layout.cells[idx(cell.x, cell.y)];
    if (!L) return;
    const cx = L.x + L.w * 0.5;
    const cy = L.y + L.h * 0.5;
    for (let i = 0; i < 9; i++) {
      if (shards.length > 48) shards.shift();
      const a = (i / 9) * Math.PI * 2 + rand(-0.25, 0.25);
      shards.push({
        x: cx + Math.cos(a) * rand(2, 10),
        y: cy + Math.sin(a) * rand(2, 8),
        vx: Math.cos(a) * rand(70, 220),
        vy: Math.sin(a) * rand(20, 140) - 80,
        rot: rand(0, Math.PI),
        vr: rand(-10, 10),
        w: rand(8, 22),
        h: rand(6, 14),
        life: rand(0.7, 1.15),
        max: 1.15,
        col: i % 2 ? PINK : CYAN
      });
    }
    cracks.push({
      x: cx,
      y: cy,
      w: L.w,
      h: L.h,
      life: 0.55,
      max: 0.55
    });
    emit(22, {
      x: cx,
      y: cy,
      j: 14,
      vx0: -180,
      vx1: 180,
      vy0: -160,
      vy1: 80,
      life: 0.55,
      r0: 1.4,
      r1: 3.8,
      col: PINK,
      g: 90
    });
  }

  function rr(x, y, w, h, r) {
    const rad = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, rad);
      return;
    }
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function cellCenter(x, y) {
    const L = layout.cells[idx(x, y)];
    if (!L) return { x: layout.cx, y: layout.cy };
    return { x: L.x + L.w * 0.5, y: L.y + L.h * 0.42 };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const m = Math.min(W, H);
    const topPad = H < 520 ? 64 : 86;
    const botPad = H < 520 ? 52 : 70;
    const board = Math.min(m * 0.78, W * 0.84, H - topPad - botPad);
    layout.size = clamp(board / 3.45, 64, 128);
    layout.gap = clamp(layout.size * 0.12, 8, 16);
    layout.depth = clamp(layout.size * 0.14, 8, 16);
    const span = N * layout.size + (N - 1) * layout.gap;
    layout.cx = W * 0.5;
    layout.cy = mix(topPad + span * 0.5, H - botPad - span * 0.5, 0.56);
    layout.cells = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const tw = layout.size;
        const th = layout.size * 0.92;
        layout.cells.push({
          x: layout.cx - span * 0.5 + x * (layout.size + layout.gap),
          y: layout.cy - span * 0.5 + y * (layout.size * 0.92 + layout.gap),
          w: tw,
          h: th,
          gx: x,
          gy: y
        });
      }
    }
  }

  function pickNext(px, py, avoidX, avoidY, style, okMap) {
    const opts = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (x === px && y === py) continue;
        if (okMap && !okMap[idx(x, y)]) continue;
        const md = Math.abs(x - px) + Math.abs(y - py);
        const cheb = Math.max(Math.abs(x - px), Math.abs(y - py));
        const diag = cheb === 1 && md === 2;
        const adj4 = md === 1;
        let w = 0;
        if (style === 'adj') {
          if (adj4) w = 4;
          else if (diag) w = 0.15;
        } else if (style === 'mix') {
          if (adj4) w = 5;
          else if (diag) w = 2.2;
          else if (md === 2) w = 1.1;
        } else {
          if (adj4) w = 2.2;
          else if (diag) w = 3.2;
          else if (md === 2) w = 2.6;
          else w = 0.35;
        }
        if (x === avoidX && y === avoidY) w *= 0.12;
        if (w > 0) opts.push({ x: x, y: y, w: w });
      }
    }
    if (!opts.length) {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          if (x === px && y === py) continue;
          if (okMap && !okMap[idx(x, y)]) continue;
          opts.push({ x: x, y: y, w: 1 });
        }
      }
    }
    if (!opts.length) return { x: px, y: py };
    let sum = 0;
    for (let i = 0; i < opts.length; i++) sum += opts[i].w;
    let r = Math.random() * sum;
    for (let i = 0; i < opts.length; i++) {
      r -= opts[i].w;
      if (r <= 0) return opts[i];
    }
    return opts[opts.length - 1];
  }

  function okMapNow() {
    const m = [];
    for (let i = 0; i < cells.length; i++) m[i] = cells[i].ok;
    return m;
  }

  function compile() {
    notes = [];
    pulses = [];
    let t = 0;
    const bpm0 = PHRASES[0].bpm;
    const cd = 60 / bpm0;
    for (let i = 0; i < COUNT_IN; i++) {
      pulses.push({ t: t, type: 'count', n: COUNT_IN - i, bar: i % 4, ph: 0, fired: false });
      t += cd;
    }
    songStart = t;
    let px = 1;
    let py = 1;
    let ax = 1;
    let ay = 1;
    let ni = 0;
    const full = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    for (let p = 0; p < PHRASES.length; p++) {
      const ph = PHRASES[p];
      const d = 60 / ph.bpm;
      for (let k = 0; k < ph.n; k++) {
        const nxt = pickNext(px, py, ax, ay, ph.style, full);
        ax = px;
        ay = py;
        px = nxt.x;
        py = nxt.y;
        notes.push({
          t: t,
          gx: px,
          gy: py,
          i: ni,
          ph: p,
          bar: k % 4,
          state: 'open',
          dur: d
        });
        pulses.push({ t: t, type: 'hit', n: 0, bar: k % 4, ph: p, fired: false });
        t += d;
        ni += 1;
      }
    }
    songEnd = t;
  }

  function resetCells() {
    cells.length = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        cells.push({
          x: x,
          y: y,
          ok: true,
          press: 0,
          heat: 0,
          glow: 0
        });
      }
    }
  }

  function resetRun() {
    compile();
    resetCells();
    player.x = 1;
    player.y = 1;
    player.fx = 1;
    player.fy = 1;
    player.fromX = 1;
    player.fromY = 1;
    player.hop = 0;
    player.z = 0;
    player.queued = null;
    player.fall = 0;
    G.songT = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.maxCombo = 0;
    G.perfects = 0;
    G.resolved = 0;
    G.pulse = 0;
    G.shake = 0;
    G.flash = 0;
    G.ending = '';
    G.endT = 0;
    G.judge = '';
    G.judgeT = 0;
    G.countN = COUNT_IN;
    G.phrase = 0;
    G.hintLock = 0;
    G.lastHint = '';
    G.target = notes[0] || null;
    G.land = 0;
    particles.length = 0;
    shards.length = 0;
    floats.length = 0;
    ripples.length = 0;
    stamps.length = 0;
    cracks.length = 0;
    cells[idx(1, 1)].heat = 0.8;
    cells[idx(1, 1)].press = 0.4;
  }

  function syncHud() {
    const cur = currentNote();
    const ph = PHRASES[(cur && cur.ph) || G.phrase] || PHRASES[0];
    phraseEl.textContent = ph.name;
    comboEl.textContent = String(G.combo);
    beatEl.textContent = G.resolved + '/' + TOTAL;
    const pips = livesEl.querySelectorAll('i');
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('off', i >= G.lives);
    }
  }

  function setHint(text, cls) {
    const key = text + '|' + (cls || '');
    if (G.lastHint === key) return;
    G.lastHint = key;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
  }

  function nextHint() {
    if (G.hintLock > 0) return;
    if (G.songT < songStart - 0.02) {
      setHint('听拍 · ' + (G.countN > 0 ? G.countN : '起'), 'gold');
      return;
    }
    const cur = currentNote();
    if (!cur) {
      setHint('收势', 'gold');
      return;
    }
    if (player.x === cur.gx && player.y === cur.gy) setHint('稳住 · 拍点落地', 'cool');
    else setHint('踩到粉格 · 拍点落地', 'warn');
  }

  function currentNote() {
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].state === 'open' || notes[i].state === 'late') return notes[i];
    }
    return null;
  }

  function ensureTarget(note) {
    if (!note) return;
    if (intact(note.gx, note.gy) && (note.gx !== player.x || note.gy !== player.y)) return;
    const ph = PHRASES[note.ph] || PHRASES[0];
    const nxt = pickNext(player.x, player.y, -1, -1, ph.style, okMapNow());
    note.gx = nxt.x;
    note.gy = nxt.y;
  }

  function buzz(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  function onTile(x, y) {
    return player.x === x && player.y === y;
  }

  function succeed(note, ad) {
    note.state = 'done';
    G.resolved += 1;
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.phrase = note.ph;
    const perfect = ad <= PERFECT;
    if (perfect) G.perfects += 1;
    G.judge = perfect ? '完美' : '踏';
    G.flashCol = perfect ? '#ffffff' : CYAN;
    G.flash = perfect ? 0.26 : 0.14;
    G.judgeT = 0.55;
    G.land = 1;
    const cell = cells[idx(note.gx, note.gy)];
    if (cell) {
      cell.press = 1;
      cell.heat = 1;
    }
    audio.land(perfect, note.gx, note.gy);
    const p = cellCenter(note.gx, note.gy);
    stamp(p.x, p.y, perfect ? GOLD : CYAN);
    ripple(p.x, p.y, perfect ? GOLD : CYAN);
    emit(perfect ? 16 : 10, {
      x: p.x,
      y: p.y,
      j: 10,
      vx0: -90,
      vx1: 90,
      vy0: -140,
      vy1: -20,
      life: 0.45,
      r0: 1.3,
      r1: 3.2,
      col: perfect ? GOLD : CYAN,
      g: 40
    });
    floatText(p.x, p.y - 18, G.judge, perfect ? GOLD : CYAN);
    buzz(perfect ? 8 : 12);
    G.target = currentNote();
    if (G.target) ensureTarget(G.target);
    syncHud();
    nextHint();
    if (G.resolved >= TOTAL) beginEnd('win');
  }

  function fail(note, why) {
    if (note) {
      note.state = 'done';
      G.resolved += 1;
      G.phrase = note.ph;
    }
    G.combo = 0;
    G.lives -= 1;
    G.shake = 0.55;
    G.flash = 0.42;
    G.flashCol = PINK;
    G.judge = why;
    G.judgeT = 0.7;
    const sx = player.x;
    const sy = player.y;
    const cell = cells[idx(sx, sy)];
    if (cell && cell.ok) {
      cell.ok = false;
      spawnShards(cell);
    }
    audio.shatter();
    const p = cellCenter(sx, sy);
    floatText(p.x, p.y - 16, why, PINK);
    buzz(28);
    G.target = currentNote();
    if (G.target) ensureTarget(G.target);
    syncHud();
    G.hintLock = 0.7;
    setHint('脚下碎了', 'warn');
    if (G.lives <= 0) {
      beginEnd('lose');
      return;
    }
    if (G.target && intact(G.target.gx, G.target.gy)) {
      startHop(G.target.gx, G.target.gy, true);
    } else if (!intact(player.x, player.y)) {
      rescuePlayer();
    }
    if (G.resolved >= TOTAL) beginEnd('win');
  }

  function rescuePlayer() {
    const t = G.target || currentNote();
    if (t && intact(t.gx, t.gy)) {
      startHop(t.gx, t.gy, true);
      return;
    }
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].ok) {
        startHop(cells[i].x, cells[i].y, true);
        return;
      }
    }
  }

  function beginEnd(kind) {
    if (G.ending) return;
    G.ending = kind;
    G.endT = 0;
    G.mode = 'ending';
    if (kind === 'win') {
      audio.win();
      for (let i = 0; i < cells.length; i++) {
        if (!cells[i].ok) continue;
        const p = cellCenter(cells[i].x, cells[i].y);
        emit(8, {
          x: p.x,
          y: p.y,
          j: 8,
          vx0: -60,
          vx1: 60,
          vy0: -120,
          vy1: -20,
          life: 0.8,
          r0: 1.5,
          r1: 3.4,
          col: i % 2 ? CYAN : GOLD,
          g: 20
        });
        cells[i].heat = 1;
      }
    } else {
      audio.lose();
      player.fall = 1;
      for (let i = 0; i < cells.length; i++) {
        if (!cells[i].ok) continue;
        cells[i].ok = false;
        spawnShards(cells[i]);
      }
    }
  }

  function showPanel(kind) {
    panel.classList.remove('hidden');
    card.classList.remove('win', 'lose');
    hud.classList.add('hidden');
    if (kind === 'title') {
      kickerEl.textContent = 'TILE BEAT';
      titleEl.textContent = '踏格';
      leadEl.innerHTML = '粉格按拍点亮。<br />踩错，脚下就碎。';
      metaEl.textContent = '拍点必须站在亮格上。碎三次则坠。';
      btnMain.textContent = '起踏';
      footEl.textContent = 'WASD 邻格 · 点格直踏 · 1–9 九键 · M 静音';
      if (legendEl) legendEl.style.display = '';
    } else if (kind === 'win') {
      card.classList.add('win');
      kickerEl.textContent = 'HOLD';
      titleEl.textContent = '格未碎';
      leadEl.textContent = '这一曲，地板还在。';
      metaEl.textContent =
        TOTAL +
        ' 拍 · 连击 ' +
        G.maxCombo +
        ' · 完美 ' +
        G.perfects +
        ' · 余命 ' +
        G.lives;
      btnMain.textContent = '再来一曲';
      footEl.textContent = '空格 / 回车 · R 重开';
      if (legendEl) legendEl.style.display = 'none';
    } else {
      card.classList.add('lose');
      kickerEl.textContent = 'BROKEN';
      titleEl.textContent = '踏空';
      leadEl.textContent = '格子碎光了。';
      metaEl.textContent =
        '收于第 ' +
        G.resolved +
        ' 拍 · 最高连击 ' +
        G.maxCombo;
      btnMain.textContent = '重铺';
      footEl.textContent = '空格 / 回车 · R 重开';
      if (legendEl) legendEl.style.display = 'none';
    }
  }

  function startPlay() {
    audio.ensure();
    audio.start();
    resetRun();
    G.mode = 'play';
    G.pause = false;
    panel.classList.add('hidden');
    hud.classList.remove('hidden');
    syncHud();
    nextHint();
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }

  function startHop(x, y, forced) {
    if (!inBound(x, y)) return false;
    if (!forced && !intact(x, y)) {
      audio.deny();
      G.shake = Math.max(G.shake, 0.18);
      const p = cellCenter(x, y);
      floatText(p.x, p.y - 8, '空', PINK);
      return false;
    }
    if (x === player.x && y === player.y && player.hop <= 0) return false;
    if (player.hop > 0 && !forced) {
      player.queued = { x: x, y: y };
      return true;
    }
    player.fromX = player.fx;
    player.fromY = player.fy;
    player.x = x;
    player.y = y;
    player.hop = 1;
    player.queued = null;
    if (!forced) audio.hop(x, y);
    return true;
  }

  function tryHop(x, y) {
    if (G.mode !== 'play' || G.ending) return;
    startHop(x, y, false);
    const cur = currentNote();
    if (cur && cur.state === 'late' && onTile(cur.gx, cur.gy)) {
      const ad = Math.abs(G.songT - cur.t);
      succeed(cur, ad);
    } else {
      nextHint();
    }
  }

  function hopDir(dx, dy) {
    tryHop(player.x + dx, player.y + dy);
  }

  function hitCell(px, py) {
    for (let y = N - 1; y >= 0; y--) {
      for (let x = 0; x < N; x++) {
        const L = layout.cells[idx(x, y)];
        if (!L) continue;
        if (px >= L.x && px <= L.x + L.w && py >= L.y && py <= L.y + L.h + layout.depth) {
          return { x: x, y: y };
        }
      }
    }
    return null;
  }

  function firePulses() {
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      if (p.fired) continue;
      if (G.songT >= p.t) {
        p.fired = true;
        G.pulse = 1;
        audio.onPulse(p);
        if (p.type === 'count') {
          G.countN = p.n;
          nextHint();
        }
      }
    }
  }

  function resolveNotes() {
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state === 'done') continue;
      if (n.state === 'open') {
        if (G.songT >= n.t) {
          if (onTile(n.gx, n.gy)) {
            const ad = 0;
            succeed(n, ad);
            if (G.ending) return;
          } else {
            n.state = 'late';
          }
        }
      } else if (n.state === 'late') {
        if (onTile(n.gx, n.gy) && G.songT <= n.t + HIT_WIN) {
          succeed(n, G.songT - n.t);
          if (G.ending) return;
        } else if (G.songT > n.t + HIT_WIN) {
          fail(n, '踏空');
          if (G.ending) return;
        }
      }
    }
  }

  function stepHop(dt) {
    if (player.hop > 0) {
      player.hop -= dt / HOP_DUR;
      if (player.hop <= 0) {
        player.hop = 0;
        player.fx = player.x;
        player.fy = player.y;
        player.z = 0;
        const cell = cells[idx(player.x, player.y)];
        if (cell) cell.press = Math.max(cell.press, 0.7);
        if (player.queued && G.mode === 'play' && !G.ending) {
          const q = player.queued;
          player.queued = null;
          startHop(q.x, q.y, false);
        }
      } else {
        const u = 1 - player.hop;
        const e = smooth(u);
        player.fx = mix(player.fromX, player.x, e);
        player.fy = mix(player.fromY, player.y, e);
        player.z = Math.sin(u * Math.PI) * 1.15;
      }
    } else {
      player.fx = player.x;
      player.fy = player.y;
      player.z = 0.08 * Math.sin(G.clock * 3.2);
    }
    if (player.fall > 0) {
      player.fall += dt * 1.4;
      player.z -= dt * 8;
    }
  }

  function stepFx(dt) {
    G.clock += dt;
    if (G.pulse > 0) G.pulse = Math.max(0, G.pulse - dt * 4.2);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.4);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.8);
    if (G.judgeT > 0) G.judgeT = Math.max(0, G.judgeT - dt);
    if (G.land > 0) G.land = Math.max(0, G.land - dt * 5);
    if (G.hintLock > 0) {
      G.hintLock -= dt;
      if (G.hintLock <= 0) {
        G.hintLock = 0;
        G.lastHint = '';
        nextHint();
      }
    }
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (c.press > 0) c.press = Math.max(0, c.press - dt * 3.6);
      if (c.heat > 0) c.heat = Math.max(0, c.heat - dt * 0.55);
      const tgt = G.target;
      const isT = tgt && tgt.gx === c.x && tgt.gy === c.y && (tgt.state === 'open' || tgt.state === 'late');
      const want = isT ? 1 : 0;
      c.glow = mix(c.glow, want, 1 - Math.pow(0.0008, dt));
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 420 * dt;
      s.rot += s.vr * dt;
      if (s.life <= 0) shards.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life -= dt;
      if (r.life <= 0) ripples.splice(i, 1);
    }
    for (let i = stamps.length - 1; i >= 0; i--) {
      const s = stamps[i];
      s.life -= dt;
      if (s.life <= 0) stamps.splice(i, 1);
    }
    for (let i = cracks.length - 1; i >= 0; i--) {
      const c = cracks[i];
      c.life -= dt;
      if (c.life <= 0) cracks.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y < -0.05) {
        m.y = 1.05;
        m.x = Math.random();
      }
      if (m.x < -0.05) m.x = 1.05;
      if (m.x > 1.05) m.x = -0.05;
    }
  }

  function stepDemo(dt) {
    G.demoT += dt;
    if (G.demoT > 0.52) {
      G.demoT = 0;
      const cur = cells[G.demoI] || cells[4];
      const nxt = pickNext(cur.x, cur.y, player.x, player.y, 'mix', okMapNow());
      G.demoI = idx(nxt.x, nxt.y);
    }
    const d = cells[G.demoI];
    for (let i = 0; i < cells.length; i++) {
      const want = d && d.x === cells[i].x && d.y === cells[i].y ? 1 : 0;
      cells[i].glow = mix(cells[i].glow, want, 1 - Math.pow(0.002, dt));
    }
    G.pulse = 0.35 + 0.65 * Math.abs(Math.sin(G.clock * 3.6));
  }

  function playerScreen() {
    const L00 = layout.cells[0];
    const L20 = layout.cells[2];
    const L02 = layout.cells[6];
    const x = mix(L00.x + L00.w * 0.5, L20.x + L20.w * 0.5, player.fx / 2);
    const y = mix(L00.y + L00.h * 0.42, L02.y + L02.h * 0.42, player.fy / 2);
    return { x: x, y: y - player.z * layout.size * 0.22 };
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(layout.cx, layout.cy, 20, layout.cx, layout.cy, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(40, 8, 48, 0.55)');
    g.addColorStop(0.5, 'rgba(8, 6, 22, 0.18)');
    g.addColorStop(1, 'rgba(5, 3, 12, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const vg = ctx.createRadialGradient(layout.cx, H * 0.08, 0, layout.cx, H * 0.08, W * 0.55);
    vg.addColorStop(0, 'rgba(255, 61, 184, 0.1)');
    vg.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    const cg = ctx.createRadialGradient(W * 0.86, H * 0.18, 0, W * 0.86, H * 0.18, W * 0.5);
    cg.addColorStop(0, 'rgba(0, 240, 255, 0.07)');
    cg.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * (1.2 + s.s) + s.p);
      ctx.beginPath();
      ctx.fillStyle = rgba(i % 3 === 0 ? PINK : CYAN, s.a * tw + G.pulse * 0.06);
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.beginPath();
      ctx.fillStyle = rgba(m.col, m.a);
      ctx.arc(m.x * W, m.y * H, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlate() {
    const c0 = layout.cells[0];
    const c8 = layout.cells[8];
    const pad = layout.gap + 18;
    const x = c0.x - pad;
    const y = c0.y - pad;
    const w = c8.x + c8.w + pad - x;
    const h = c8.y + c8.h + layout.depth + pad - y;
    ctx.save();
    rr(x, y + 8, w, h, 22);
    ctx.fillStyle = 'rgba(4, 2, 12, 0.7)';
    ctx.fill();
    rr(x, y, w, h, 22);
    ctx.fillStyle = 'rgba(10, 6, 22, 0.55)';
    ctx.fill();
    ctx.strokeStyle = rgba(CYAN, 0.16 + G.pulse * 0.12);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    if (G.mode === 'play' || G.mode === 'ending') {
      const prog = TOTAL ? G.resolved / TOTAL : 0;
      const bx = x + 22;
      const by = y + h - 11;
      const bw = w - 44;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      rr(bx, by, bw, 4, 2);
      ctx.fill();
      if (prog > 0) {
        ctx.fillStyle = rgba(GOLD, 0.75);
        rr(bx, by, bw * prog, 4, 2);
        ctx.fill();
      }
    }
  }

  function drawLink() {
    const tgt = G.mode === 'play' ? G.target : null;
    if (!tgt || (tgt.state !== 'open' && tgt.state !== 'late')) return;
    if (onTile(tgt.gx, tgt.gy)) return;
    const a = playerScreen();
    const b = cellCenter(tgt.gx, tgt.gy);
    const t = 0.45 + 0.55 * G.pulse;
    ctx.save();
    ctx.strokeStyle = rgba(PINK, 0.22 + t * 0.35);
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 7]);
    ctx.lineDashOffset = -G.clock * 38;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + 10);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawTile(c) {
    const L = layout.cells[idx(c.x, c.y)];
    if (!L) return;
    const d = layout.depth;
    const press = c.press * 5;
    const x = L.x;
    const y = L.y + press;
    const w = L.w;
    const h = L.h;
    const tgt = G.mode === 'title'
      ? (cells[G.demoI] && cells[G.demoI].x === c.x && cells[G.demoI].y === c.y)
      : (G.target && G.target.gx === c.x && G.target.gy === c.y && G.target.state !== 'done');
    const here = G.mode !== 'title' && player.x === c.x && player.y === c.y;
    const rad = Math.max(10, w * 0.16);

    if (!c.ok) {
      ctx.save();
      rr(x + 6, y + 6, w - 12, h - 10, rad);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    rr(x + 3, y + d, w - 2, h - 2, rad);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    rr(x, y + d * 0.55, w, h, rad);
    ctx.fillStyle = tgt ? 'rgba(70, 12, 48, 0.95)' : 'rgba(18, 12, 36, 0.96)';
    ctx.fill();

    rr(x, y, w, h, rad);
    const glow = c.glow;
    const heat = c.heat;
    let fill;
    if (tgt && here) {
      fill = ctx.createLinearGradient(x, y, x, y + h);
      fill.addColorStop(0, 'rgba(255, 250, 230, 0.55)');
      fill.addColorStop(0.45, rgba(GOLD, 0.28 + glow * 0.25));
      fill.addColorStop(1, rgba(CYAN, 0.22));
    } else if (tgt) {
      fill = ctx.createLinearGradient(x, y, x, y + h);
      fill.addColorStop(0, rgba(PINK, 0.22 + glow * 0.45 + G.pulse * 0.12));
      fill.addColorStop(0.5, 'rgba(48, 10, 36, 0.92)');
      fill.addColorStop(1, 'rgba(18, 6, 24, 0.96)');
    } else {
      fill = ctx.createLinearGradient(x, y, x, y + h);
      fill.addColorStop(0, 'rgba(28, 22, 52, 0.95)');
      fill.addColorStop(1, 'rgba(10, 8, 22, 0.98)');
    }
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.strokeStyle = tgt
      ? rgba(PINK, 0.55 + glow * 0.4 + G.pulse * 0.25)
      : here
        ? rgba(CYAN, 0.55 + heat * 0.25)
        : rgba(CYAN, 0.14 + heat * 0.3);
    ctx.lineWidth = tgt ? 2.4 : 1.4;
    ctx.stroke();

    rr(x + 8, y + 7, w - 16, h * 0.34, rad * 0.6);
    ctx.fillStyle = tgt ? rgba('#ffffff', 0.08 + glow * 0.1) : 'rgba(255,255,255,0.05)';
    ctx.fill();

    if (tgt && G.mode === 'play' && G.target) {
      const note = G.target;
      const remain = note.t - G.songT;
      const prevT = note.i > 0 ? notes[note.i - 1].t : songStart - (note.dur || 0.5);
      const span = Math.max(0.22, note.t - prevT);
      const k = clamp(1 - remain / span, 0, 1);
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      const R = Math.min(w, h) * 0.34;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(PINK, 0.18);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, mix(R * 1.35, R * 0.15, k), 0, Math.PI * 2);
      ctx.strokeStyle = rgba(k > 0.85 ? GOLD : PINK, 0.7);
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }

    if (G.mode === 'play' && W > 560) {
      const labels = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
      ctx.fillStyle = 'rgba(200, 210, 255, 0.18)';
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(labels[idx(c.x, c.y)], x + w - 8, y + h - 7);
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (G.mode === 'title' && player.fall <= 0) {
      const p = cellCenter(1, 1);
      const bob = Math.sin(G.clock * 3.2) * 3;
      drawPawn(p.x, p.y - 8 + bob, 1);
      return;
    }
    const p = playerScreen();
    const a = player.fall > 0 ? Math.max(0, 1 - (player.fall - 1) * 1.2) : 1;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    drawPawn(p.x, p.y, 1 + Math.max(0, player.z) * 0.08);
    ctx.restore();
  }

  function drawPawn(x, y, sc) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    ctx.beginPath();
    ctx.ellipse(0, 16, 16, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    const g = ctx.createRadialGradient(0, -6, 2, 0, 0, 28);
    g.addColorStop(0, rgba(CYAN, 0.55));
    g.addColorStop(1, rgba(CYAN, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -4, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-7, 10);
    ctx.quadraticCurveTo(0, 16, 7, 10);
    ctx.quadraticCurveTo(8, 0, 0, -2);
    ctx.quadraticCurveTo(-8, 0, -7, 10);
    ctx.closePath();
    ctx.fillStyle = '#d8fff9';
    ctx.fill();
    ctx.strokeStyle = rgba(CYAN, 0.9);
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -10, 8.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f7fbff';
    ctx.fill();
    ctx.strokeStyle = rgba(PINK, 0.85);
    ctx.lineWidth = 1.7;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-2.2, -11.5, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < stamps.length; i++) {
      const s = stamps[i];
      const k = 1 - s.life / s.max;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 10 + k * 28, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(s.col, (1 - k) * 0.7);
      ctx.lineWidth = 3 - k * 2;
      ctx.stroke();
    }
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const k = 1 - r.life / r.max;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 18 + k * 46, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(r.col, (1 - k) * 0.45);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (let i = 0; i < cracks.length; i++) {
      const c = cracks[i];
      const a = c.life / c.max;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(c.x - c.w * 0.22, c.y - c.h * 0.1);
      ctx.lineTo(c.x, c.y + 4);
      ctx.lineTo(c.x + c.w * 0.2, c.y - c.h * 0.16);
      ctx.moveTo(c.x, c.y + 4);
      ctx.lineTo(c.x + 6, c.y + c.h * 0.22);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const a = Math.max(0, s.life / s.max);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = s.col;
      ctx.fillRect(-s.w * 0.5, -s.h * 0.5, s.w, s.h);
      ctx.restore();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.beginPath();
      ctx.fillStyle = rgba(p.col, a);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = Math.max(0, f.life / f.max);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = f.col;
      ctx.font = '800 18px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = f.col;
      ctx.shadowBlur = 12;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  function drawCount() {
    if (G.mode !== 'play') return;
    if (G.songT >= songStart) {
      if (G.judgeT > 0 && G.judge) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, G.judgeT * 2);
        ctx.fillStyle = G.judge === '完美' ? GOLD : G.judge === '踏' ? CYAN : PINK;
        ctx.font = '800 28px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(G.judge, layout.cx, layout.cells[0].y - 28);
        ctx.restore();
      }
      return;
    }
    const n = G.countN > 0 ? String(G.countN) : '起';
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = GOLD;
    ctx.font = '900 56px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 18;
    ctx.fillText(n, layout.cx, layout.cells[0].y - 30);
    ctx.restore();
  }

  function drawBeats() {
    if (G.mode !== 'play') return;
    const cur = currentNote();
    const bar = cur ? cur.bar : (Math.max(0, G.countN) % 4);
    const y = layout.cells[8].y + layout.cells[8].h + layout.depth + 18;
    const gap = 16;
    const x0 = layout.cx - gap * 1.5;
    for (let i = 0; i < 4; i++) {
      const on = i === bar;
      ctx.beginPath();
      ctx.arc(x0 + i * gap, y, on ? 4.2 : 3, 0, Math.PI * 2);
      ctx.fillStyle = on ? rgba(i === 0 ? PINK : CYAN, 0.85) : 'rgba(255,255,255,0.16)';
      ctx.fill();
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashCol, G.flash * 0.14);
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    ctx.save();
    if (G.shake > 0) {
      const m = G.shake * 7;
      ctx.translate(rand(-m, m), rand(-m, m));
    }
    drawBg();
    drawPlate();
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) drawTile(cells[idx(x, y)]);
    }
    drawLink();
    drawPlayer();
    drawFx();
    drawCount();
    drawBeats();
    drawFlash();
    ctx.restore();
  }

  function update(dt) {
    if (G.mode === 'title') {
      stepDemo(dt);
      stepHop(dt);
      stepFx(dt);
      return;
    }
    if (G.mode === 'play' && !G.pause && !G.ending) {
      G.songT += dt;
      firePulses();
      if (G.songT >= songStart - 0.01) resolveNotes();
    }
    if (G.mode === 'ending') {
      G.endT += dt;
      if (G.ending === 'win' && G.endT > 0.9) {
        G.mode = 'win';
        showPanel('win');
      } else if (G.ending === 'lose' && G.endT > 1.05) {
        G.mode = 'lose';
        showPanel('lose');
      }
    }
    stepHop(dt);
    stepFx(dt);
  }

  let last = 0;
  function frame(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function primary() {
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startPlay();
  }

  function onPtr(e) {
    if (e.target && e.target.closest && e.target.closest('button')) return;
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    if (G.mode !== 'play' || G.ending) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitCell(x, y);
    if (hit) tryHop(hit.x, hit.y);
  }

  function onKey(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      startPlay();
      return;
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      primary();
      return;
    }
    if (G.mode !== 'play' || G.ending) return;
    if (e.repeat) return;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      hopDir(0, -1);
      return;
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S') {
      e.preventDefault();
      hopDir(0, 1);
      return;
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      e.preventDefault();
      hopDir(-1, 0);
      return;
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      e.preventDefault();
      hopDir(1, 0);
      return;
    }
    const tile = KEY_TILE[k] || (k && KEY_TILE[k.toLowerCase()]) || CODE_TILE[e.code];
    if (tile) {
      e.preventDefault();
      tryHop(tile[0], tile[1]);
    }
  }

  btnMain.addEventListener('click', function (e) {
    e.stopPropagation();
    primary();
  });
  card.addEventListener('click', function (e) {
    if (e.target === btnMain || (e.target.closest && e.target.closest('button'))) return;
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') primary();
  });
  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    startPlay();
  });
  btnMute.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    onPtr(e);
  }, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    G.pause = document.hidden;
    last = 0;
  });

  resetCells();
  makeStars();
  resize();
  audio.setMuted(audio.muted);
  showPanel('title');
  G.demoI = 4;
  requestAnimationFrame(frame);
})();
