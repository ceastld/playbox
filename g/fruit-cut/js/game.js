'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const GRAV = 1240;
  const LIVES = 3;
  const ZEN_TIME = 90;
  const COMBO_WIN = 0.4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const TRAIL_LIFE = 0.2;
  const MIN_SLICE_SPD = 240;
  const BEST_KEY = 'playbox-fruit-cut-best';
  const MUTE_KEY = 'playbox-fruit-cut-mute';
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPS_TITLE = '拖划切开 · 方向键弹斩 · 漏果或斩弹扣命 · M 静音';
  const OPS_PLAY = '拖划切开 · ←↑↓→ 弹斩 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 77, 109];
  const WHITE = [255, 255, 255];

  const KINDS = [
    {
      id: 'apple', name: '苹果', r: 27,
      skin: [232, 46, 72], flesh: [255, 198, 178], dark: [138, 16, 34],
      leaf: [72, 186, 92], stem: [96, 62, 34],
      score: 10, pitch: 1.06, juice: 22, seeds: 4
    },
    {
      id: 'watermelon', name: '西瓜', r: 40,
      skin: [42, 168, 78], flesh: [232, 42, 78], dark: [20, 92, 46],
      stripe: [28, 118, 56], pith: [236, 246, 228],
      score: 20, pitch: 0.76, juice: 36, seeds: 8
    },
    {
      id: 'orange', name: '橙', r: 28,
      skin: [255, 140, 42], flesh: [255, 198, 92], dark: [196, 88, 16],
      pith: [255, 236, 200],
      score: 10, pitch: 0.94, juice: 24, seeds: 5
    },
    {
      id: 'lemon', name: '柠檬', r: 24, rx: 22, ry: 29,
      skin: [255, 220, 64], flesh: [255, 246, 176], dark: [210, 168, 18],
      pith: [255, 252, 220],
      score: 12, pitch: 1.2, juice: 18, seeds: 3, oval: true
    },
    {
      id: 'peach', name: '桃', r: 27,
      skin: [255, 132, 154], flesh: [255, 214, 186], dark: [210, 78, 104],
      leaf: [88, 176, 86],
      score: 12, pitch: 1.0, juice: 20, seeds: 1
    },
    {
      id: 'kiwi', name: '猕猴桃', r: 24,
      skin: [148, 164, 56], flesh: [176, 210, 68], dark: [88, 104, 32],
      core: [244, 246, 220],
      score: 14, pitch: 1.12, juice: 18, seeds: 10
    },
    {
      id: 'banana', name: '香蕉', r: 22,
      skin: [255, 214, 64], flesh: [255, 242, 168], dark: [186, 142, 24],
      score: 16, pitch: 1.24, juice: 14, seeds: 0, banana: true
    }
  ];

  const BOMB = {
    id: 'bomb', name: '炸弹', r: 25,
    skin: [34, 30, 40], flesh: [80, 24, 28], dark: [12, 10, 16],
    score: 0, pitch: 0.5, juice: 18, bomb: true
  };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnZen = document.getElementById('btn-zen');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;

  const fruits = [];
  const halves = [];
  const particles = [];
  const sparks = [];
  const stains = [];
  const floats = [];
  const rings = [];
  const flashes = [];
  const blades = [];
  const trail = [];
  const motes = [];
  const pips = [];

  const ptr = {
    down: false,
    id: null,
    x: VW * 0.5,
    y: VH * 0.5,
    lx: 0,
    ly: 0,
    len: 0,
    hover: false,
    whooshT: 0
  };

  const G = {
    mode: 'title',
    kind: 'classic',
    t: 0,
    clock: 0,
    lives: LIVES,
    score: 0,
    bestC: 0,
    bestZ: 0,
    combo: 0,
    maxCombo: 0,
    lastSlice: -99,
    wave: 0,
    sliced: 0,
    time: ZEN_TIME,
    queue: [],
    spawnCd: 0.5,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    lock: 0,
    flickCd: 0,
    why: '',
    demoT: 0.4
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
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t + 0.5) | 0,
      (a[1] + (b[1] - a[1]) * t + 0.5) | 0,
      (a[2] + (b[2] - a[2]) * t + 0.5) | 0
    ];
  }
  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
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
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
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
    noise(dur, vol, freq, type) {
      if (!this.ctx || this.muted) return;
      if (!this.noiseBuf) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, (sr * 0.25) | 0, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.7 : 1.1;
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
    slice(pitch) {
      this.ensure();
      const p = pitch || 1;
      this.noise(0.055, 0.09, 520 * p, 'bandpass');
      this.noise(0.04, 0.05, 2200 * p, 'highpass');
      this.beep(160 * p, 0.08, 'sine', 0.07, 70);
      this.beep(920 * p, 0.045, 'triangle', 0.045, 380);
      this.beep(1680 * p, 0.03, 'sine', 0.028, 620);
    },
    whoosh() {
      this.ensure();
      this.noise(0.07, 0.045, 1800, 'highpass');
      this.beep(1400, 0.05, 'sine', 0.018, 280);
    },
    bomb() {
      this.ensure();
      this.noise(0.22, 0.14, 180, 'lowpass');
      this.noise(0.12, 0.08, 700, 'bandpass');
      this.beep(90, 0.24, 'sawtooth', 0.09, 38);
      this.beep(52, 0.3, 'sine', 0.11, 28);
    },
    miss() {
      this.ensure();
      this.beep(220, 0.14, 'sine', 0.05, 90);
      this.beep(140, 0.2, 'triangle', 0.04, 60);
    },
    combo(n) {
      this.ensure();
      const f = 480 + n * 70;
      this.beep(f, 0.08, 'sine', 0.05, f * 1.45);
      this.beep(f * 1.26, 0.11, 'triangle', 0.04);
    },
    start() {
      this.ensure();
      this.noise(0.08, 0.04, 1400, 'highpass');
      this.beep(392, 0.09, 'sine', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.035, 1175);
    },
    over() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    zenEnd() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.055);
      this.beep(659, 0.14, 'sine', 0.05);
      this.beep(784, 0.22, 'triangle', 0.05, 1175);
    },
    life() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.03, 90);
    }
  };

  function currentBest() {
    return G.kind === 'zen' ? G.bestZ : G.bestC;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) {
        G.bestC = 0;
        G.bestZ = 0;
      } else if (raw.charAt(0) === '{') {
        const j = JSON.parse(raw);
        G.bestC = j && isFinite(j.c) ? j.c | 0 : 0;
        G.bestZ = j && isFinite(j.z) ? j.z | 0 : 0;
      } else {
        const n = parseInt(raw, 10);
        G.bestC = isFinite(n) && n > 0 ? n : 0;
        G.bestZ = 0;
      }
    } catch (err) {
      G.bestC = 0;
      G.bestZ = 0;
    }
    bestEl.textContent = String(currentBest());
  }

  function saveBest() {
    const key = G.kind === 'zen' ? 'bestZ' : 'bestC';
    if (G.score <= G[key]) return;
    G[key] = G.score;
    bestEl.textContent = String(G[key]);
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, z: G.bestZ }));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    scoreEl.textContent = String(G.score);
    saveBest();
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

  function setComboHud() {
    comboEl.textContent = '×' + Math.max(1, G.combo);
    if (G.combo >= 2) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
  }

  function toast(msg, warn, gold) {
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 0.85;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 820);
  }

  function renderPips() {
    if (G.kind === 'zen' && G.mode === 'play') {
      pipsEl.classList.add('hidden');
      return;
    }
    pipsEl.classList.remove('hidden');
    if (pips.length !== LIVES) {
      pipsEl.innerHTML = '';
      pips.length = 0;
      for (let i = 0; i < LIVES; i++) {
        const el = document.createElement('i');
        el.className = 'pip on';
        pipsEl.appendChild(el);
        pips.push(el);
      }
    }
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      pips[i].classList.toggle('on', on);
      pips[i].classList.toggle('gone', !on);
    }
  }

  function hudPlay() {
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    setComboHud();
    if (G.kind === 'zen') {
      stageLabel.textContent = '禅 · ' + Math.ceil(Math.max(0, G.time)) + 's';
      stageLabel.classList.toggle('hot', G.time < 12);
      tagLabel.textContent = 'ZEN';
      tagLabel.className = G.time < 12 ? 'hot' : '';
      hintEl.textContent = '九十秒只追分 · 无炸弹 · 漏果不扣命';
      hintEl.className = 'hint';
    } else {
      stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.remove('hot');
      tagLabel.textContent = 'CLASSIC';
      tagLabel.className = G.lives === 1 ? 'warn' : '';
      hintEl.textContent = G.lives === 1 ? '最后一命 · 炸弹别碰' : OPS_PLAY;
      hintEl.className = G.lives === 1 ? 'hint warn' : 'hint';
    }
    renderPips();
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(nx, ny, mag) {
    if (REDUCE) return;
    G.kickX += nx * mag;
    G.kickY += ny * mag;
    G.shake = Math.max(G.shake, mag * 0.55);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.003));
    kickTok += 1;
    stageEl.classList.remove('cut');
    void stageEl.offsetWidth;
    stageEl.classList.add('cut');
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.45);
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.6, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 980 : spec.g,
        drip: !!spec.drip,
        rot: rand(0, TAU),
        spin: rand(-8, 8)
      });
    }
    capArr(particles, 420);
  }

  function spark(x, y, rgb, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(80, 420);
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.12, 0.32),
        max: 0.32,
        rgb: rgb,
        w: rand(1.2, 3.4)
      });
    }
    capArr(sparks, 180);
  }

  function ring(x, y, rgb, r0, r1, life) {
    rings.push({ x: x, y: y, rgb: rgb, r0: r0, r1: r1, t: 0, life: life || 0.28 });
  }

  function floatText(x, y, text, rgb, size, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.9 : 0.7,
      size: size || 18, gold: !!gold, vy: -70
    });
  }

  function stainAt(x, y, rgb, r) {
    stains.push({
      x: clamp(x, 16, VW - 16),
      y: clamp(y, VH - 70, VH - 18),
      rgb: rgb, r: r, a: 0.42, life: rand(1.6, 3.2)
    });
    capArr(stains, 48);
  }

  function hitRadius(kind) {
    if (kind.banana) return 34;
    if (kind.oval) return Math.max(kind.rx, kind.ry) * 0.96;
    return kind.r * 1.1;
  }

  function segHitsCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((cx - x1) * dx + (cy - y1) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const ddx = cx - px;
    const ddy = cy - py;
    return ddx * ddx + ddy * ddy <= r * r;
  }

  function sliceDir(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = hypot(dx, dy) || 1;
    const tx = dx / len;
    const ty = dy / len;
    return { tx: tx, ty: ty, nx: -ty, ny: tx, spd: len };
  }

  function launchFruit(kind, extra) {
    extra = extra || {};
    const r = kind.r;
    const edge = Math.random();
    let x;
    if (edge < 0.18) x = rand(-10, 50);
    else if (edge > 0.82) x = rand(VW - 50, VW + 10);
    else x = rand(50, VW - 50);
    const y = VH + r + rand(4, 28);
    const toward = (VW * 0.5 - x);
    const wave = extra.wave || 1;
    const spdBoost = 1 + Math.min(0.38, wave * 0.028);
    const vy = -rand(1120, 1420) * spdBoost;
    const vx = toward * rand(0.12, 0.42) + rand(-90, 90);
    fruits.push({
      kind: kind,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      rot: rand(0, TAU),
      spin: rand(-7, 7),
      r: r,
      live: true,
      bomb: !!kind.bomb,
      missed: false,
      fuse: rand(0, TAU),
      demo: !!extra.demo
    });
  }

  function queueWave() {
    G.wave += 1;
    const n = G.wave;
    const count = Math.min(6, 1 + ((n - 1) * 0.7) | 0) + (Math.random() < 0.35 ? 1 : 0);
    const bombChance = n < 3 ? 0 : Math.min(0.4, 0.1 + n * 0.018);
    for (let i = 0; i < count; i++) {
      G.queue.push({
        bomb: false,
        wait: i === 0 ? 0.05 : rand(0.07, 0.2)
      });
    }
    if (Math.random() < bombChance) {
      G.queue.push({ bomb: true, wait: rand(0.04, 0.18) });
    }
    if (n > 8 && Math.random() < 0.28) {
      G.queue.push({ bomb: true, wait: rand(0.1, 0.4) });
    }
    if (G.mode === 'play' && n > 1) toast('第 ' + n + ' 波', false, n % 5 === 0);
    hudPlay();
  }

  function spawnFromQueue() {
    if (!G.queue.length) return;
    const item = G.queue[0];
    item.wait -= STEP;
    if (item.wait > 0) return;
    G.queue.shift();
    if (item.bomb) launchFruit(BOMB, { wave: G.wave });
    else launchFruit(pick(KINDS), { wave: G.wave });
  }

  function liveFruits() {
    let n = 0;
    for (let i = 0; i < fruits.length; i++) {
      if (fruits[i].live) n += 1;
    }
    return n;
  }

  function comboName(n) {
    if (n < 2) return '';
    if (n === 2) return '双斩';
    if (n === 3) return '三连';
    if (n === 4) return '四连斩';
    if (n === 5) return '五连斩';
    return n + '连斩';
  }

  function splitFruit(f, nx, ny, spd) {
    const kind = f.kind;
    const kickSpd = 320 + Math.min(360, spd * 10);
    const cr = Math.cos(-f.rot);
    const sr = Math.sin(-f.rot);
    const lnx = nx * cr - ny * sr;
    const lny = nx * sr + ny * cr;
    for (let side = -1; side <= 1; side += 2) {
      halves.push({
        kind: kind,
        x: f.x + nx * side * 5,
        y: f.y + ny * side * 5,
        vx: f.vx + nx * side * kickSpd + -ny * rand(-50, 50),
        vy: f.vy + ny * side * kickSpd - rand(60, 160),
        rot: f.rot,
        spin: f.spin + side * (6 + spd * 0.08),
        r: f.r,
        nx: lnx,
        ny: lny,
        side: side,
        life: 2.6
      });
    }
    capArr(halves, 28);
  }

  function juiceBurst(f, nx, ny, spd, combo) {
    const kind = f.kind;
    const n = Math.max(8, kind.juice + (combo >= 3 ? 12 : 0) + (REDUCE ? -12 : 0));
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const spr = rand(-0.75, 0.75);
      const px = nx * side + -ny * spr;
      const py = ny * side + nx * spr;
      const sp = rand(110, 460);
      particles.push({
        x: f.x + nx * side * rand(2, 10),
        y: f.y + ny * side * rand(2, 10),
        vx: px * sp + f.vx * 0.28,
        vy: py * sp + f.vy * 0.28 - rand(30, 90),
        r: rand(1.4, 5.4),
        life: rand(0.38, 0.72),
        max: 0.72,
        rgb: Math.random() < 0.22 ? mix(kind.flesh, WHITE, 0.45) : kind.flesh,
        g: 1120,
        drip: true,
        rot: rand(0, TAU),
        spin: rand(-9, 9)
      });
    }
    capArr(particles, 420);
    emit(7, {
      x: f.x, y: f.y, j: 8,
      vx0: -90, vx1: 90, vy0: -200, vy1: -20,
      life: 0.4, r0: 0.8, r1: 2.2, rgb: mix(kind.flesh, WHITE, 0.4), g: 360
    });
    spark(f.x, f.y, mix(kind.flesh, WHITE, 0.55), REDUCE ? 4 : 12 + (combo >= 3 ? 8 : 0));
    ring(f.x, f.y, kind.flesh, f.r * 0.4, f.r * 2.6, 0.28);
    flashes.push({
      x: f.x, y: f.y, nx: nx, ny: ny,
      len: f.r * 2.6 + Math.min(28, spd * 1.2),
      t: 0, life: 0.16
    });
    stainAt(f.x + rand(-10, 10), VH - 28, kind.flesh, rand(8, 16));
  }

  function sliceFruit(f, dir) {
    f.live = false;
    const nx = dir.nx;
    const ny = dir.ny;
    const spd = dir.spd;
    splitFruit(f, nx, ny, spd);
    juiceBurst(f, nx, ny, spd, G.combo);
    audio.slice(f.kind.pitch * rand(0.96, 1.05));
    const stop = G.combo >= 4 ? 0.08 : G.combo >= 2 ? 0.07 : 0.055;
    hitStop(stop);
    kick(nx, ny, 8 + Math.min(12, G.combo * 1.6));
    screenFlash(mix(f.kind.flesh, WHITE, 0.35), 0.28 + Math.min(0.22, G.combo * 0.04));
  }

  function explodeBomb(f) {
    f.live = false;
    emit(28, {
      x: f.x, y: f.y, j: 12,
      vx0: -280, vx1: 280, vy0: -320, vy1: 80,
      life: 0.7, r0: 1.6, r1: 5.5, rgb: HOT, g: 600
    });
    emit(10, {
      x: f.x, y: f.y, j: 8,
      vx0: -140, vx1: 140, vy0: -180, vy1: 40,
      life: 0.5, r0: 2, r1: 6, rgb: GOLD, g: 200
    });
    spark(f.x, f.y, MAG, 18);
    ring(f.x, f.y, HOT, 8, 90, 0.4);
    ring(f.x, f.y, MAG, 4, 130, 0.5);
    audio.bomb();
    hitStop(0.08);
    kick(0, 1, 16);
    screenFlash(HOT, 0.72);
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
  }

  function applyCombo() {
    const now = G.clock;
    if (now - G.lastSlice <= COMBO_WIN) G.combo += 1;
    else G.combo = 1;
    G.lastSlice = now;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    setComboHud();
    return G.combo;
  }

  function onFruitSliced(f, dir) {
    const combo = applyCombo();
    sliceFruit(f, dir);
    const pts = f.kind.score * combo;
    addScore(pts);
    G.sliced += 1;
    floatText(f.x, f.y - f.r - 8, '+' + pts, mix(f.kind.flesh, WHITE, 0.25), 16 + Math.min(10, combo * 2), combo >= 3);
    if (combo >= 2) {
      const name = comboName(combo);
      floatText(f.x, f.y - f.r - 28, '×' + combo + (name ? ' ' + name : ''), GOLD, 22 + Math.min(18, combo * 3), true);
      if (combo === 2 || combo === 3 || combo === 5 || combo === 8) audio.combo(combo);
      if (combo === 3 || combo === 5 || combo === 8 || combo === 12) toast(name + ' ×' + combo, false, true);
    }
  }

  function loseLife(reason, x, y) {
    if (G.mode !== 'play') return;
    if (G.kind === 'zen') return;
    G.lives -= 1;
    renderPips();
    hudPlay();
    if (reason === 'miss') {
      audio.miss();
      screenFlash(MAG, 0.32);
      kick(0, 1, 6);
      floatText(x, y, '漏', MAG, 22, false);
      toast('漏果 −1', true, false);
    } else {
      audio.life();
      toast('炸弹 −1', true, false);
    }
    if (G.lives <= 0) {
      endRun(reason === 'bomb' ? 'bomb' : 'miss');
    }
  }

  function endRun(why) {
    G.mode = why === 'zen' ? 'zenend' : 'over';
    G.why = why;
    G.lock = 0.15;
    G.queue.length = 0;
    saveBest();
    showOverlay();
    if (why === 'zen') audio.zenEnd();
    else audio.over();
  }

  function trySliceSegment(x1, y1, x2, y2, spd, forced) {
    if (G.mode !== 'play' && G.mode !== 'title') return 0;
    const dist = hypot(x2 - x1, y2 - y1);
    if (!forced && dist < 3.2) return 0;
    const dir = sliceDir(x1, y1, x2, y2);
    dir.spd = Math.max(dir.spd, Math.min(40, spd * 0.02));
    let hits = 0;
    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i];
      if (!f.live) continue;
      if (G.mode === 'title' && !f.demo) continue;
      if (G.mode === 'play' && f.demo) continue;
      const r = hitRadius(f.kind);
      if (!segHitsCircle(x1, y1, x2, y2, f.x, f.y, r)) continue;
      hits += 1;
      if (f.bomb) {
        if (G.mode === 'title') {
          f.live = false;
          explodeBomb(f);
          continue;
        }
        explodeBomb(f);
        loseLife('bomb', f.x, f.y);
      } else if (G.mode === 'title') {
        f.live = false;
        G.combo = 1;
        sliceFruit(f, dir);
      } else {
        onFruitSliced(f, dir);
      }
    }
    return hits;
  }

  function addTrailPoint(x, y, w) {
    const last = trail.length ? trail[trail.length - 1] : null;
    if (last) {
      const d = hypot(x - last.x, y - last.y);
      if (d < 2.2) {
        last.x = x;
        last.y = y;
        last.t = G.clock;
        last.w = Math.max(last.w, w);
        return last;
      }
      if (d > 30) {
        const n = Math.min(6, Math.ceil(d / 16));
        for (let i = 1; i < n; i++) {
          const t = i / n;
          trail.push({
            x: last.x + (x - last.x) * t,
            y: last.y + (y - last.y) * t,
            t: G.clock,
            w: w
          });
        }
      }
    }
    trail.push({ x: x, y: y, t: G.clock, w: w });
    capArr(trail, 48);
    return trail[trail.length - 1];
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - ox) / scale,
      y: (e.clientY - rect.top - oy) / scale
    };
  }

  function onPointerDown(e) {
    if (e.target && e.target.closest && e.target.closest('button')) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (ptr.down) return;
    e.preventDefault();
    audio.ensure();
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.len = 0;
    const p = pointerWorld(e);
    ptr.x = p.x;
    ptr.y = p.y;
    ptr.lx = p.x;
    ptr.ly = p.y;
    canvas.classList.add('press');
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
    addTrailPoint(p.x, p.y, 8);
  }

  function onPointerMove(e) {
    const p = pointerWorld(e);
    ptr.x = p.x;
    ptr.y = p.y;
    ptr.hover = true;
    if (!ptr.down) return;
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    const dx = p.x - ptr.lx;
    const dy = p.y - ptr.ly;
    const dist = hypot(dx, dy);
    if (dist < 1.2) return;
    ptr.len += dist;
    const spd = dist * 60;
    addTrailPoint(p.x, p.y, clamp(6 + spd * 0.01, 5, 18));
    if (ptr.len >= 16 || spd > MIN_SLICE_SPD) {
      trySliceSegment(ptr.lx, ptr.ly, p.x, p.y, spd, true);
    }
    if (spd > 900 && G.clock - ptr.whooshT > 0.12) {
      ptr.whooshT = G.clock;
      audio.whoosh();
    }
    ptr.lx = p.x;
    ptr.ly = p.y;
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    ptr.down = false;
    ptr.id = null;
    canvas.classList.remove('press');
  }

  function pickFlickTarget(dx, dy) {
    let best = null;
    let bestS = -1e9;
    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i];
      if (!f.live || f.demo) continue;
      const cx = f.x - VW * 0.5;
      const cy = f.y - VH * 0.42;
      const along = cx * dx + cy * dy;
      const across = Math.abs(cx * -dy + cy * dx);
      const score = -across * 1.6 + along * 0.25 + (VH - f.y) * 0.08;
      if (score > bestS) {
        bestS = score;
        best = f;
      }
    }
    return best;
  }

  function fireFlick(dx, dy) {
    if (G.mode !== 'play') return;
    if (G.flickCd > 0) return;
    G.flickCd = 0.11;
    audio.ensure();
    const t = pickFlickTarget(dx, dy);
    const x = t ? t.x : VW * 0.5;
    const y = t ? t.y : VH * 0.42;
    const span = Math.max(VW, VH) * 0.72;
    const x0 = x - dx * span;
    const y0 = y - dy * span;
    const x1 = x + dx * span;
    const y1 = y + dy * span;
    blades.push({
      x0: x0, y0: y0, x1: x1, y1: y1,
      t: 0, dur: 0.085, last: 0, nx: -dy, ny: dx
    });
    spark(x, y, CYN, 8);
    audio.whoosh();
  }

  function stepBlades(dt) {
    for (let i = blades.length - 1; i >= 0; i--) {
      const b = blades[i];
      b.t += dt;
      const p = clamp(b.t / b.dur, 0, 1);
      const x1 = lerp(b.x0, b.x1, b.last);
      const y1 = lerp(b.y0, b.y1, b.last);
      const x2 = lerp(b.x0, b.x1, p);
      const y2 = lerp(b.y0, b.y1, p);
      addTrailPoint(x2, y2, 14);
      trySliceSegment(x1, y1, x2, y2, 1400, true);
      b.last = p;
      if (b.t >= b.dur) blades.splice(i, 1);
    }
  }

  function resetArrays() {
    fruits.length = 0;
    halves.length = 0;
    particles.length = 0;
    sparks.length = 0;
    stains.length = 0;
    floats.length = 0;
    rings.length = 0;
    flashes.length = 0;
    blades.length = 0;
    trail.length = 0;
    G.queue.length = 0;
  }

  function startRun(kind) {
    G.kind = kind;
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.lastSlice = -99;
    G.wave = 0;
    G.sliced = 0;
    G.time = ZEN_TIME;
    G.spawnCd = 0.55;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.flash = 0;
    G.punch = 1;
    G.lock = 0;
    G.flickCd = 0;
    G.why = '';
    resetArrays();
    scoreEl.textContent = '0';
    overlay.classList.add('hidden');
    panel.classList.remove('win', 'lose');
    audio.start();
    hudPlay();
    toast(kind === 'zen' ? '禅 · 九十秒' : '斩！', false, true);
    if (kind === 'classic') queueWave();
    decorativeSlash();
    canvas.focus();
  }

  function decorativeSlash() {
    blades.push({
      x0: 20, y0: VH * 0.62, x1: VW - 20, y1: VH * 0.28,
      t: 0, dur: 0.12, last: 0, nx: 0.4, ny: 0.9
    });
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') startRun('classic');
    else startRun(G.kind);
  }

  function backTitle() {
    G.mode = 'title';
    G.kind = 'classic';
    G.lock = 0;
    overlay.classList.remove('hidden');
    showOverlay();
    hudPlay();
  }

  function showOverlay() {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (G.mode === 'title') {
      ovKicker.textContent = 'SLASH';
      ovTitle.textContent = '斩果';
      ovLead.innerHTML = '一刀切开，果汁四溅。';
      ovOps.textContent = OPS_TITLE;
      btnClassic.textContent = '经典';
      btnZen.textContent = '禅';
      btnZen.classList.remove('hidden');
      hintEl.textContent = '经典三命 · 禅九十秒无炸弹';
      hintEl.className = 'hint';
      bestEl.textContent = String(G.bestC);
      stageLabel.textContent = '斩果';
      tagLabel.textContent = 'SLASH';
      tagLabel.className = '';
    } else if (G.mode === 'zenend') {
      panel.classList.add('win');
      ovKicker.textContent = 'ZEN';
      ovTitle.textContent = '收刀';
      ovLead.innerHTML = '九十秒斩完 · ' + G.score + ' 分<br />最大连斩 ×' + G.maxCombo + ' · 切开 ' + G.sliced;
      ovOps.textContent = G.score >= G.bestZ && G.score > 0 ? '新纪录已写入' : '最高 ' + G.bestZ;
      btnClassic.textContent = '再斩';
      btnZen.textContent = '选模式';
      btnZen.classList.remove('hidden');
      hintEl.textContent = 'R 再斩 · 禅模式';
      hintEl.className = 'hint hot';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = G.why === 'bomb' ? 'BOMB' : 'MISS';
      ovTitle.textContent = G.why === 'bomb' ? '误斩' : '命尽';
      ovLead.innerHTML = (G.why === 'bomb' ? '刀碰到了炸弹。' : '水果落地了。') +
        '<br />' + G.score + ' 分 · 最大连斩 ×' + G.maxCombo + ' · 第 ' + G.wave + ' 波';
      ovOps.textContent = G.score >= G.bestC && G.score > 0 ? '新纪录已写入' : '最高 ' + G.bestC;
      btnClassic.textContent = '再斩';
      btnZen.textContent = '选模式';
      btnZen.classList.remove('hidden');
      hintEl.textContent = 'R 再斩 · 经典';
      hintEl.className = 'hint warn';
    }
  }

  function demoSpawn(dt) {
    G.demoT -= dt;
    if (G.demoT <= 0 && liveFruits() < 3) {
      launchFruit(pick(KINDS), { demo: true, wave: 1 });
      G.demoT = rand(0.7, 1.35);
    }
    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i];
      if (!f.live || !f.demo || f.bomb) continue;
      if (f.vy > 40 && f.y < VH * 0.62 && Math.random() < 0.035) {
        const a = rand(-0.6, 0.6);
        const dir = { tx: Math.cos(a), ty: Math.sin(a), nx: -Math.sin(a), ny: Math.cos(a), spd: 18 };
        f.live = false;
        G.combo = 1;
        sliceFruit(f, dir);
      }
    }
  }

  function stepFruit(f, dt) {
    f.vy += GRAV * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.rot += f.spin * dt;
    f.fuse += dt * 14;
    if (f.bomb && f.live) {
      if (Math.random() < 0.28) {
        sparks.push({
          x: f.x + Math.cos(f.rot - 1.2) * (f.r + 8),
          y: f.y + Math.sin(f.rot - 1.2) * (f.r + 8),
          vx: rand(-30, 30),
          vy: rand(-80, -20),
          life: 0.18,
          max: 0.18,
          rgb: Math.random() < 0.5 ? GOLD : HOT,
          w: rand(1.2, 2.4)
        });
      }
    }
    if (f.live && f.y - f.r > VH + 8) {
      f.live = false;
      if (!f.bomb && !f.demo && G.mode === 'play') {
        f.missed = true;
        loseLife('miss', f.x, VH - 40);
      }
    }
    if (f.y > VH + 90 || f.x < -80 || f.x > VW + 80) f.gone = true;
  }

  function stepHalf(h, dt) {
    h.vy += GRAV * dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.rot += h.spin * dt;
    h.life -= dt;
    if (h.y > VH + 80 || h.life <= 0) h.gone = true;
  }

  function stepFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g * dt;
      p.vx *= 0.995;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      p.life -= dt;
      if (p.drip && p.y > VH - 30 && p.vy > 0) {
        stainAt(p.x, VH - 26, p.rgb, p.r * 1.8);
        particles.splice(i, 1);
        continue;
      }
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) sparks.splice(i, 1);
    }
    for (let i = stains.length - 1; i >= 0; i--) {
      stains[i].life -= dt;
      stains[i].a *= 0.997;
      if (stains[i].life <= 0) stains.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= 0.96;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t >= rings[i].life) rings.splice(i, 1);
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].t += dt;
      if (flashes[i].t >= flashes[i].life) flashes.splice(i, 1);
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      if (G.clock - trail[i].t > TRAIL_LIFE) trail.splice(i, 1);
    }
    if (G.clock - G.lastSlice > COMBO_WIN && G.combo !== 0 && G.mode === 'play') {
      G.combo = 0;
      setComboHud();
    }
    G.shake *= 0.86;
    G.kickX *= 0.82;
    G.kickY *= 0.82;
    G.flash *= 0.9;
    G.punch = lerp(G.punch, 1, 0.18);
    if (G.shake < 0.04) G.shake = 0;
    if (G.flash < 0.02) G.flash = 0;
  }

  function stepPlay(dt) {
    if (G.kind === 'classic') {
      spawnFromQueue();
      if (!G.queue.length && liveFruits() === 0) {
        G.spawnCd -= dt;
        if (G.spawnCd <= 0) {
          queueWave();
          G.spawnCd = 0.42;
        }
      }
    } else {
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        endRun('zen');
        return;
      }
      G.spawnCd -= dt;
      if (G.spawnCd <= 0 && liveFruits() < 8) {
        const t = 1 - G.time / ZEN_TIME;
        const n = Math.random() < 0.32 + t * 0.4 ? (Math.random() < 0.45 ? 3 : 2) : 1;
        for (let i = 0; i < n; i++) {
          G.queue.push({ bomb: false, wait: i * rand(0.05, 0.16) });
        }
        G.spawnCd = lerp(1.15, 0.4, t) + rand(-0.04, 0.08);
      }
      spawnFromQueue();
      if ((G.time * 10 | 0) !== ((G.time + dt) * 10 | 0)) hudPlay();
    }
  }

  function step(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.flickCd > 0) G.flickCd -= dt;
    if (G.toastT > 0) G.toastT -= dt;

    if (G.stop > 0) {
      G.stop -= dt;
      stepBlades(dt);
      stepFx(dt * 0.35);
      return;
    }

    stepBlades(dt);

    if (G.mode === 'title') demoSpawn(dt);

    if (G.mode === 'play') stepPlay(dt);

    for (let i = fruits.length - 1; i >= 0; i--) {
      stepFruit(fruits[i], dt);
      if (fruits[i].gone) fruits.splice(i, 1);
    }
    for (let i = halves.length - 1; i >= 0; i--) {
      stepHalf(halves[i], dt);
      if (halves[i].gone) halves.splice(i, 1);
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y -= m.s * dt;
      m.x += Math.sin(G.t * m.w + m.p) * 6 * dt;
      if (m.y < -10) {
        m.y = VH + 10;
        m.x = rand(10, VW - 10);
      }
    }

    stepFx(dt);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: rand(8, VW - 8),
        y: rand(0, VH),
        r: rand(0.6, 1.8),
        a: rand(0.08, 0.22),
        p: rand(0, TAU),
        s: rand(8, 22),
        w: rand(0.6, 1.6)
      });
    }
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#140814');
    g.addColorStop(0.45, '#09040e');
    g.addColorStop(1, '#07040a');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const moonX = sx(VW * 0.78);
    const moonY = sy(VH * 0.16);
    const mg = ctx.createRadialGradient(moonX, moonY, 4 * scale, moonX, moonY, 90 * scale);
    mg.addColorStop(0, 'rgba(255, 214, 196, 0.55)');
    mg.addColorStop(0.18, 'rgba(255, 120, 150, 0.12)');
    mg.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 90 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 232, 220, 0.85)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 18 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#140814';
    ctx.beginPath();
    ctx.arc(moonX + 6 * scale, moonY - 3 * scale, 14 * scale, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(8, 4, 14, 0.85)';
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(VH * 0.62));
    ctx.lineTo(sx(70), sy(VH * 0.48));
    ctx.lineTo(sx(130), sy(VH * 0.58));
    ctx.lineTo(sx(210), sy(VH * 0.42));
    ctx.lineTo(sx(300), sy(VH * 0.56));
    ctx.lineTo(sx(380), sy(VH * 0.4));
    ctx.lineTo(sx(VW), sy(VH * 0.54));
    ctx.lineTo(sx(VW), sy(VH));
    ctx.lineTo(sx(0), sy(VH));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(18, 10, 22, 0.95)';
    ctx.fillRect(sx(0), sy(VH - 54), VW * scale, 54 * scale);
    ctx.strokeStyle = 'rgba(255, 77, 109, 0.22)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(VH - 54));
    ctx.lineTo(sx(VW), sy(VH - 54));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1 * scale;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(sx(i * 80), sy(VH - 54));
      ctx.lineTo(sx(i * 80 - 10), sy(VH));
      ctx.stroke();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.t * 1.4 + m.p));
      ctx.fillStyle = rgba(i % 3 === 0 ? HOT : i % 3 === 1 ? MAG : CYN, a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawStains() {
    for (let i = 0; i < stains.length; i++) {
      const s = stains[i];
      const k = clamp(s.life / 2.2, 0, 1);
      ctx.fillStyle = rgba(s.rgb, s.a * k);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), s.r * 1.4 * scale, s.r * 0.55 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function fruitPath(c, kind, s) {
    if (kind.banana) {
      c.beginPath();
      c.moveTo(0, -36 * s);
      c.bezierCurveTo(18 * s, -22 * s, 22 * s, 12 * s, 7 * s, 34 * s);
      c.quadraticCurveTo(2 * s, 38 * s, -3 * s, 32 * s);
      c.bezierCurveTo(-20 * s, 10 * s, -16 * s, -20 * s, 0, -36 * s);
      c.closePath();
      return;
    }
    c.beginPath();
    if (kind.oval) c.ellipse(0, 0, kind.rx * s, kind.ry * s, 0, 0, TAU);
    else c.arc(0, 0, kind.r * s, 0, TAU);
  }

  function paintSkin(kind, s) {
    const r = (kind.oval ? kind.ry : kind.r) * s;
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
    g.addColorStop(0, rgba(mix(kind.skin, WHITE, 0.45), 1));
    g.addColorStop(0.45, rgba(kind.skin, 1));
    g.addColorStop(1, rgba(kind.dark, 1));
    ctx.fillStyle = g;
    fruitPath(ctx, kind, s);
    ctx.fill();
  }

  function drawFruitDetails(kind, s, rot) {
    if (kind.id === 'watermelon') {
      ctx.strokeStyle = rgba(kind.stripe, 0.85);
      ctx.lineWidth = 4.2 * s;
      ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, kind.r * 0.92 * s, kind.r * 0.42 * s, i * 0.42, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    }
    if (kind.id === 'apple' || kind.id === 'peach') {
      ctx.strokeStyle = rgba(kind.dark, 0.35);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(0, -kind.r * 0.2 * s);
      ctx.quadraticCurveTo(4 * s, 6 * s, 0, kind.r * 0.7 * s);
      ctx.stroke();
      ctx.fillStyle = rgba(kind.stem || [90, 60, 30], 1);
      ctx.fillRect(-1.2 * s, -kind.r * s - 7 * s, 2.4 * s, 9 * s);
      if (kind.leaf) {
        ctx.fillStyle = rgba(kind.leaf, 1);
        ctx.beginPath();
        ctx.ellipse(7 * s, -kind.r * s - 4 * s, 8 * s, 3.4 * s, -0.6, 0, TAU);
        ctx.fill();
      }
    }
    if (kind.id === 'orange' || kind.id === 'lemon') {
      ctx.fillStyle = rgba(mix(kind.skin, WHITE, 0.25), 0.25);
      for (let i = 0; i < 8; i++) {
        const a = i * 0.7 + rot;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * kind.r * 0.45 * s, Math.sin(a) * kind.r * 0.45 * s, 1.1 * s, 0, TAU);
        ctx.fill();
      }
    }
    if (kind.id === 'kiwi') {
      ctx.fillStyle = 'rgba(40, 36, 24, 0.28)';
      for (let i = 0; i < 12; i++) {
        const a = i * 0.52;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * kind.r * 0.7 * s, Math.sin(a) * kind.r * 0.7 * s, 1.4 * s, 0, TAU);
        ctx.fill();
      }
    }
    if (kind.id === 'banana') {
      ctx.fillStyle = rgba(kind.dark, 1);
      ctx.beginPath();
      ctx.arc(0, -36 * s, 3.2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(kind.dark, 0.35);
      ctx.beginPath();
      ctx.ellipse(6 * s, 4 * s, 2.2 * s, 1.2 * s, 0.4, 0, TAU);
      ctx.fill();
    }
    if (kind.bomb) {
      ctx.strokeStyle = rgba(MAG, 0.85);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(-7 * s, -7 * s);
      ctx.lineTo(7 * s, 7 * s);
      ctx.moveTo(7 * s, -7 * s);
      ctx.lineTo(-7 * s, 7 * s);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2.2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -kind.r * s);
      ctx.quadraticCurveTo(10 * s, -kind.r * s - 10 * s, 12 * s, -kind.r * s - 16 * s);
      ctx.stroke();
      const sparkA = 0.55 + 0.45 * Math.sin(G.t * 22);
      ctx.fillStyle = rgba(GOLD, sparkA);
      ctx.beginPath();
      ctx.arc(12 * s, -kind.r * s - 16 * s, 3.2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, sparkA);
      ctx.beginPath();
      ctx.arc(12 * s, -kind.r * s - 16 * s, 1.6 * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(-kind.r * 0.32 * s, -kind.r * 0.38 * s, kind.r * 0.22 * s, kind.r * 0.14 * s, -0.5, 0, TAU);
    ctx.fill();
  }

  function drawFleshFace(kind, s, nx, ny, side) {
    const ang = Math.atan2(ny, nx);
    ctx.save();
    ctx.rotate(ang + (side < 0 ? Math.PI : 0));
    const rr = kind.banana ? 22 * s : (kind.oval ? kind.ry : kind.r) * s * 0.96;
    ctx.beginPath();
    ctx.ellipse(2 * s, 0, 5 * s, rr, 0, 0, TAU);
    if (kind.pith) {
      ctx.fillStyle = rgba(kind.pith, 0.95);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(1.2 * s, 0, 3.2 * s, rr * 0.82, 0, 0, TAU);
    }
    ctx.fillStyle = rgba(kind.flesh, 1);
    ctx.fill();
    if (kind.id === 'kiwi') {
      ctx.fillStyle = rgba(kind.core, 0.95);
      ctx.beginPath();
      ctx.ellipse(1 * s, 0, 2.2 * s, rr * 0.28, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#2a1c12';
      for (let i = 0; i < 8; i++) {
        const yy = -rr * 0.55 + i * rr * 0.14;
        ctx.beginPath();
        ctx.arc(2.4 * s, yy, 1.1 * s, 0, TAU);
        ctx.fill();
      }
    }
    if (kind.id === 'watermelon' || kind.id === 'apple') {
      ctx.fillStyle = '#1a1208';
      const seeds = kind.seeds || 4;
      for (let i = 0; i < seeds; i++) {
        const yy = -rr * 0.62 + (i + 0.5) * (rr * 1.2 / seeds);
        ctx.beginPath();
        ctx.ellipse(2.6 * s, yy, 2.1 * s, 1.15 * s, 0.2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-1 * s, -rr, 2.2 * s, rr * 2);
    ctx.restore();
  }

  function drawWhole(f) {
    const s = scale;
    ctx.save();
    ctx.translate(sx(f.x), sy(f.y));
    ctx.rotate(f.rot);
    if (f.missed) ctx.globalAlpha = 0.72;
    paintSkin(f.kind, s);
    drawFruitDetails(f.kind, s, f.rot);
    ctx.restore();
  }

  function drawHalf(h) {
    const s = scale;
    const nx = h.nx;
    const ny = h.ny;
    const side = h.side;
    ctx.save();
    ctx.translate(sx(h.x), sy(h.y));
    ctx.rotate(h.rot);
    const big = 220 * s;
    const px = -ny;
    const py = nx;
    const oxn = nx * side * 1.5 * s;
    const oyn = ny * side * 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(oxn + px * big, oyn + py * big);
    ctx.lineTo(oxn - px * big, oyn - py * big);
    ctx.lineTo(oxn - px * big + nx * side * big, oyn - py * big + ny * side * big);
    ctx.lineTo(oxn + px * big + nx * side * big, oyn + py * big + ny * side * big);
    ctx.closePath();
    ctx.clip();
    paintSkin(h.kind, s);
    drawFruitDetails(h.kind, s, h.rot);
    ctx.restore();

    ctx.save();
    ctx.translate(sx(h.x), sy(h.y));
    ctx.rotate(h.rot);
    drawFleshFace(h.kind, s, nx, ny, side);
    ctx.restore();
  }

  function drawTrail() {
    if (trail.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      const age = clamp(1 - (G.clock - b.t) / TRAIL_LIFE, 0, 1);
      const w = (b.w || 8) * age;
      ctx.strokeStyle = rgba(WHITE, 0.22 * age);
      ctx.lineWidth = (w + 10) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(a.x), sy(a.y));
      ctx.lineTo(sx(b.x), sy(b.y));
      ctx.stroke();
      ctx.strokeStyle = rgba(CYN, 0.55 * age);
      ctx.lineWidth = (w + 3) * scale;
      ctx.stroke();
      ctx.strokeStyle = rgba(WHITE, 0.95 * age);
      ctx.lineWidth = Math.max(1.4, w * 0.45) * scale;
      ctx.stroke();
    }
    const tip = trail[trail.length - 1];
    if (G.clock - tip.t < 0.08) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(sx(tip.x), sy(tip.y), 3.4 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const k = clamp(p.life / (p.max || 0.5), 0, 1);
      ctx.fillStyle = rgba(p.rgb, 0.22 + 0.75 * k);
      ctx.beginPath();
      if (p.drip) {
        ctx.ellipse(sx(p.x), sy(p.y), p.r * 0.55 * scale, p.r * (1.2 + Math.abs(p.vy) * 0.001) * scale, Math.atan2(p.vy, p.vx), 0, TAU);
      } else {
        ctx.arc(sx(p.x), sy(p.y), p.r * k * scale, 0, TAU);
      }
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = clamp(s.life / (s.max || 0.2), 0, 1);
      ctx.strokeStyle = rgba(s.rgb, k);
      ctx.lineWidth = s.w * k * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(s.y));
      ctx.lineTo(sx(s.x - s.vx * 0.018), sy(s.y - s.vy * 0.018));
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / r.life;
      const rad = lerp(r.r0, r.r1, k);
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - k));
      ctx.lineWidth = (3.2 * (1 - k) + 0.6) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), rad * scale, 0, TAU);
      ctx.stroke();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < flashes.length; i++) {
      const f = flashes[i];
      const k = 1 - f.t / f.life;
      const px = -f.ny;
      const py = f.nx;
      ctx.strokeStyle = rgba(WHITE, 0.85 * k);
      ctx.lineWidth = 5 * k * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(f.x - px * f.len), sy(f.y - py * f.len));
      ctx.lineTo(sx(f.x + px * f.len), sy(f.y + py * f.len));
      ctx.stroke();
      ctx.strokeStyle = rgba(CYN, 0.5 * k);
      ctx.lineWidth = 10 * k * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const k = f.t / f.life;
      const pop = k < 0.18 ? lerp(0.6, 1.25, k / 0.18) : lerp(1.25, 1, (k - 0.18) / 0.82);
      const a = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1;
      ctx.save();
      ctx.translate(sx(f.x), sy(f.y));
      ctx.scale(pop, pop);
      ctx.font = '900 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.shadowColor = rgba(f.gold ? GOLD : f.rgb, 0.7 * a);
      ctx.shadowBlur = 12 * scale;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
  }

  function drawPointer() {
    if (!ptr.hover && !ptr.down) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(CYN, ptr.down ? 0.55 : 0.28);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.arc(sx(ptr.x), sy(ptr.y), (ptr.down ? 10 : 7) * scale, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = rgba(WHITE, 0.8);
    ctx.beginPath();
    ctx.arc(sx(ptr.x), sy(ptr.y), 1.6 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawLetterbox() {
    ctx.fillStyle = '#05030c';
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(W - ox, 0, ox + 2, H);
    }
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, H - oy, W, oy + 2);
    }
  }

  function draw() {
    drawBg();

    ctx.save();
    const cx = sx(VW * 0.5);
    const cy = sy(VH * 0.5);
    let shx = G.kickX;
    let shy = G.kickY;
    if (G.shake > 0 && !REDUCE) {
      shx += (Math.random() - 0.5) * G.shake * 2;
      shy += (Math.random() - 0.5) * G.shake * 2;
    }
    ctx.translate(cx, cy);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-cx + shx * scale, -cy + shy * scale);

    drawStains();

    for (let i = 0; i < halves.length; i++) drawHalf(halves[i]);
    for (let i = 0; i < fruits.length; i++) {
      if (fruits[i].live || fruits[i].missed) drawWhole(fruits[i]);
    }

    drawParticles();
    drawTrail();
    drawFloats();
    drawPointer();

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    drawLetterbox();
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = Math.min(W / VW, H / VH);
    scale = s;
    ox = (W - VW * s) / 2;
    oy = (H - VH * s) / 2;
  }

  let acc = 0;
  let last = performance.now();

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
      step(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
  }

  function onKey(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (k === 'r' || k === 'R') {
      retry();
      e.preventDefault();
      return;
    }
    audio.ensure();
    if (G.mode === 'title') {
      if (k === '1' || k === 'c' || k === 'C' || k === 'Enter') {
        startRun('classic');
        e.preventDefault();
      } else if (k === '2' || k === 'z' || k === 'Z') {
        startRun('zen');
        e.preventDefault();
      }
      return;
    }
    if (G.mode === 'over' || G.mode === 'zenend') {
      if (k === 'Enter' || k === ' ') {
        startRun(G.kind);
        e.preventDefault();
      } else if (k === 'Escape') {
        backTitle();
        e.preventDefault();
      }
      return;
    }
    if (G.mode !== 'play') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      fireFlick(-1, 0);
      e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      fireFlick(1, 0);
      e.preventDefault();
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      fireFlick(0, -1);
      e.preventDefault();
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      fireFlick(0, 1);
      e.preventDefault();
    } else if (k === ' ') {
      fireFlick(1, 0);
      e.preventDefault();
    }
  }

  btnClassic.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startRun('classic');
    else startRun(G.kind);
  });
  btnZen.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startRun('zen');
    else backTitle();
  });
  btnRetry.addEventListener('click', function () {
    retry();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', function (e) {
    ptr.hover = false;
    onPointerUp(e);
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = performance.now();
  });

  try {
    audio.setMuted(localStorage.getItem(MUTE_KEY) === '1');
  } catch (err) {
    audio.setMuted(false);
  }

  seedMotes();
  loadBest();
  renderPips();
  showOverlay();
  resize();
  requestAnimationFrame(frame);
})();
