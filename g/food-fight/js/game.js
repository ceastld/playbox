'use strict';

(function () {
  const VW = 720;
  const VH = 480;
  const WALL = 22;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_R = 11;
  const P_SPD = 176;
  const COMBO_WIN = 1.28;
  const PICK_R = 18;
  const CONE_R = 13;
  const PEEL_R = 12;
  const BEST_KEY = 'playbox-food-fight-best';
  const MUTE_KEY = 'playbox-food-fight-mute';
  const OPS = 'WASD / 方向键跑 · 空格砸 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 41];
  const HOT2 = [255, 192, 120];
  const WHT = [255, 244, 232];
  const WOOD = [92, 48, 28];
  const WOOD2 = [140, 78, 42];

  const FOODS = [
    { id: 'tomato', name: '番茄', rgb: [255, 72, 64], r: 7.5, spd: 365, peel: false },
    { id: 'pie', name: '蛋挞', rgb: [255, 186, 74], r: 8, spd: 315, peel: false },
    { id: 'melon', name: '西瓜', rgb: [72, 214, 118], r: 9, spd: 285, peel: false },
    { id: 'banana', name: '香蕉', rgb: [255, 220, 64], r: 7, spd: 385, peel: true },
    { id: 'pea', name: '豌豆', rgb: [150, 230, 80], r: 5.6, spd: 415, peel: false },
    { id: 'cake', name: '蛋糕', rgb: [255, 132, 186], r: 8, spd: 305, peel: false },
    { id: 'dog', name: '热狗', rgb: [255, 118, 64], r: 7.2, spd: 345, peel: false }
  ];

  const CHEF_KIND = [
    { name: '胖厨', rgb: [255, 92, 72], spd: 90 },
    { name: '火厨', rgb: [255, 64, 140], spd: 110 },
    { name: '冷厨', rgb: [80, 196, 255], spd: 100 },
    { name: '瘦厨', rgb: [168, 255, 92], spd: 124 },
    { name: '辣厨', rgb: [255, 158, 48], spd: 106 },
    { name: '醋厨', rgb: [196, 118, 255], spd: 114 },
    { name: '糖厨', rgb: [255, 210, 90], spd: 102 },
    { name: '盐厨', rgb: [220, 230, 240], spd: 118 }
  ];

  const FAN_WAVES = [
    { name: '头盘', chefs: 2, time: 44, piles: 5, throw: 1.08 },
    { name: '热炒', chefs: 3, time: 42, piles: 5, throw: 0.98 },
    { name: '硬菜', chefs: 3, time: 40, piles: 6, throw: 0.9 },
    { name: '大席', chefs: 4, time: 38, piles: 6, throw: 0.84 },
    { name: '加辣', chefs: 4, time: 36, piles: 7, throw: 0.76 },
    { name: '满桌', chefs: 5, time: 34, piles: 7, throw: 0.7 },
    { name: '加钟', chefs: 5, time: 32, piles: 8, throw: 0.64 },
    { name: '打烊', chefs: 6, time: 30, piles: 8, throw: 0.58 }
  ];

  const TABLES = [
    { x: 118, y: 96, w: 112, h: 46 },
    { x: 490, y: 96, w: 112, h: 46 },
    { x: 118, y: 338, w: 112, h: 46 },
    { x: 490, y: 338, w: 112, h: 46 },
    { x: 210, y: 28, w: 300, h: 26 }
  ];

  const PILE_SPOTS = [
    [78, 78], [360, 72], [642, 78],
    [78, 240], [642, 240],
    [78, 402], [360, 408], [642, 402],
    [248, 240], [472, 240],
    [360, 168], [360, 312],
    [200, 168], [520, 168],
    [200, 312], [520, 312]
  ];

  const CONE_SPOTS = [
    [360, 240], [220, 200], [500, 200],
    [220, 290], [500, 290], [360, 150],
    [360, 330], [160, 240], [560, 240]
  ];

  const CHEF_SPAWNS = [
    [52, 52], [668, 52], [52, 428], [668, 428],
    [360, 80], [360, 400], [52, 240], [668, 240]
  ];

  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function irand(a, b) {
    return (a + Math.random() * (b - a + 1)) | 0;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function norm(x, y) {
    const l = hypot(x, y);
    if (l < 0.0001) return { x: 0, y: 0, l: 0 };
    return { x: x / l, y: y / l, l: l };
  }
  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function waveSpec(kind, wave) {
    if (kind === 'smash') {
      const w = Math.max(1, wave);
      return {
        name: '乱砸 ' + w,
        chefs: Math.min(8, 3 + w),
        time: Math.max(22, 40 - w * 2),
        piles: Math.min(10, 6 + w),
        throw: Math.max(0.38, 0.62 - w * 0.03)
      };
    }
    if (wave <= FAN_WAVES.length) return FAN_WAVES[wave - 1];
    const extra = wave - FAN_WAVES.length;
    return {
      name: '加桌 ' + extra,
      chefs: Math.min(8, 6 + extra),
      time: 28,
      piles: 8,
      throw: 0.55
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastThrow: 0,
    lastSplat: 0,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.36;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.36;
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
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 700;
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
    throw() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastThrow < 0.04) return;
      this.lastThrow = now;
      this.beep(420, 0.07, 'square', 0.03, 180);
      this.noise(0.05, 0.028, 900);
    },
    splat() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastSplat < 0.028) return;
      this.lastSplat = now;
      this.noise(0.09, 0.055, 280);
      this.beep(180, 0.08, 'sawtooth', 0.04, 70);
    },
    pick() {
      this.ensure();
      this.beep(720, 0.05, 'triangle', 0.035, 980);
    },
    cone() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.05);
      this.beep(784, 0.12, 'triangle', 0.045);
      this.beep(1046, 0.16, 'sine', 0.04);
    },
    slip() {
      this.ensure();
      this.beep(640, 0.16, 'sawtooth', 0.04, 140);
      this.noise(0.12, 0.04, 600);
    },
    ko() {
      this.ensure();
      this.noise(0.12, 0.07, 220);
      this.beep(210, 0.14, 'square', 0.05, 70);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(170, 0.18, 'sawtooth', 0.06, 64);
      this.noise(0.14, 0.055, 380);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.08, 'sine', 0.05);
      this.beep(1046, 0.16, 'triangle', 0.05);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.26, 'triangle', 0.05, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.045, 90);
      this.beep(140, 0.3, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    }
  };

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
  const btnFan = document.getElementById('btn-fan');
  const btnSmash = document.getElementById('btn-smash');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeFan = document.getElementById('mode-fan');
  const modeSmash = document.getElementById('mode-smash');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnThrow = document.getElementById('btn-throw');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const timeLabel = document.getElementById('time-label');
  const heldLabel = document.getElementById('held-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');
  const vpad = document.getElementById('vpad');
  const knob = document.getElementById('vpad-knob');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  let fireHold = false;
  let last = 0;
  let acc = 0;

  const keys = { u: false, d: false, l: false, r: false };
  const mouse = { x: VW * 0.5, y: VH * 0.5, down: false };
  const stick = { on: false, id: null, x: 0, y: 0 };
  const demo = { x: 0, y: 0, fire: false, t: 0 };
  const pips = [];
  const particles = [];
  const pops = [];
  const rings = [];
  const stains = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'fan',
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    bestFan: 0,
    bestSmash: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: LIFE_EVERY,
    t: 0,
    remain: 44,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: HOT,
    ready: 0,
    invuln: 0,
    deadT: 0,
    clearT: 0,
    throwCd: 0,
    why: '',
    waveName: '头盘',
    throwGap: 1.08,
    player: {
      x: VW * 0.5, y: VH * 0.5, fx: 1, fy: 0,
      r: P_R, walk: 0, held: null,
      slip: 0, vx: 0, vy: 0,
      squash: 1, stretch: 1, rot: 0
    },
    chefs: [],
    piles: [],
    shots: [],
    peels: [],
    cone: { alive: false, x: 360, y: 240, wait: 0.4, pulse: 0 }
  };

  function sx(x) { return ox + x * scale; }
  function sy(y) { return oy + y * scale; }

  function worldFromPtr(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const sxr = r.width > 0 ? canvas.width / r.width : dpr;
    const syr = r.height > 0 ? canvas.height / r.height : dpr;
    return {
      x: ((cx - r.left) * sxr - ox) / scale,
      y: ((cy - r.top) * syr - oy) / scale
    };
  }

  function inArena(x, y, r) {
    return x >= WALL + r && x <= VW - WALL - r && y >= WALL + r && y <= VH - WALL - r;
  }

  function clampArena(ent) {
    ent.x = clamp(ent.x, WALL + ent.r, VW - WALL - ent.r);
    ent.y = clamp(ent.y, WALL + ent.r, VH - WALL - ent.r);
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, Math.min(0.08, sec));
  }

  function screenFlash(rgb, a) {
    G.flash = a;
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        t: spec.life,
        life: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
    if (particles.length > 240) particles.splice(0, particles.length - 240);
  }

  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85, life: 0.85 });
    if (pops.length > 48) pops.shift();
  }

  function spawnRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 10 });
    if (rings.length > 28) rings.shift();
  }

  function spawnStain(x, y, rgb, r) {
    stains.push({ x: x, y: y, rgb: rgb, r: r || 10, t: 2.1, life: 2.1 });
    if (stains.length > 64) stains.shift();
  }

  function showChain(n) {
    if (!chainPop || REDUCE) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function toast(text, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = text;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (warn) toastEl.classList.add('warn');
    if (gold) toastEl.classList.add('gold');
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1400);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.remove('hot', 'warn');
    if (cls) hintEl.classList.add(cls);
  }

  function circleRect(x, y, r, t) {
    const cx = clamp(x, t.x, t.x + t.w);
    const cy = clamp(y, t.y, t.y + t.h);
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy < r * r;
  }

  function hitTable(x, y, r) {
    for (let i = 0; i < TABLES.length; i++) {
      if (circleRect(x, y, r, TABLES[i])) return TABLES[i];
    }
    return null;
  }

  function resolveTable(ent) {
    for (let k = 0; k < TABLES.length; k++) {
      const t = TABLES[k];
      const cx = clamp(ent.x, t.x, t.x + t.w);
      const cy = clamp(ent.y, t.y, t.y + t.h);
      const dx = ent.x - cx;
      const dy = ent.y - cy;
      const d2 = dx * dx + dy * dy;
      const r = ent.r;
      if (d2 < r * r) {
        const d = Math.sqrt(d2) || 0.001;
        ent.x = cx + (dx / d) * r;
        ent.y = cy + (dy / d) * r;
      }
    }
  }

  function moveEnt(ent, dx, dy) {
    if (dx !== 0) {
      ent.x += dx;
      resolveTable(ent);
      clampArena(ent);
    }
    if (dy !== 0) {
      ent.y += dy;
      resolveTable(ent);
      clampArena(ent);
    }
  }

  function currentBest() {
    return G.kind === 'smash' ? G.bestSmash : G.bestFan;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          G.bestFan = o.fan | 0;
          G.bestSmash = o.smash | 0;
        }
      }
    } catch (err) { /* ignore */ }
    G.best = currentBest();
  }

  function saveBest() {
    if (G.kind === 'smash') {
      if (G.score > G.bestSmash) G.bestSmash = G.score;
    } else if (G.score > G.bestFan) {
      G.bestFan = G.score;
    }
    G.best = currentBest();
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ fan: G.bestFan, smash: G.bestSmash }));
    } catch (err) { /* ignore */ }
  }

  function resetCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(5, Math.max(0, G.combo - 1));
    if (G.combo >= 2) {
      audio.combo(G.combo);
      showChain(G.mult);
    }
  }

  function addScore(n, x, y, rgb) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        audio.extra();
        toast('1UP', false, true);
      }
    }
    if (G.score > currentBest()) saveBest();
    else G.best = currentBest();
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      addTok += 1;
      const tok = addTok;
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    if (x != null) spawnPop(x, y, '+' + n, rgb || GOLD);
  }

  function foodById(id) {
    for (let i = 0; i < FOODS.length; i++) {
      if (FOODS[i].id === id) return FOODS[i];
    }
    return FOODS[0];
  }

  function standingChefs() {
    let n = 0;
    for (let i = 0; i < G.chefs.length; i++) {
      if (G.chefs[i].stun <= 0) n += 1;
    }
    return n;
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    if (panel) panel.classList.remove('win', 'lose');
  }

  function showOverlay(kind) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind === 'win' || kind === 'lose');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'title') {
      ovKicker.textContent = 'FOOD';
      ovTitle.textContent = '食堂';
      ovLead.innerHTML = '捡食物砸追来的厨子，偷吃甜筒得分。<br />香蕉皮会滑倒。全打倒或撑过倒计时进下一桌。';
      ovOps.textContent = OPS;
    } else if (kind === 'win') {
      ovKicker.textContent = 'FOOD';
      ovTitle.textContent = '打烊了';
      ovLead.textContent = '食堂清完 · ' + G.score + ' 分';
      ovOps.textContent = 'R 再来一桌 · 最高 ' + currentBest();
    } else {
      ovKicker.textContent = 'FOOD';
      ovTitle.textContent = '被撵出去了';
      ovLead.textContent = (G.why || '挨砸了') + ' · ' + G.score + ' 分';
      ovOps.textContent = 'R 重开随时可用 · 最高 ' + currentBest();
    }
  }

  function syncModes() {
    const smash = G.kind === 'smash';
    if (modeFan) modeFan.setAttribute('aria-pressed', smash ? 'false' : 'true');
    if (modeSmash) modeSmash.setAttribute('aria-pressed', smash ? 'true' : 'false');
  }

  function syncPips() {
    if (!pipsEl) return;
    const cap = LIFE_CAP;
    while (pips.length < cap) {
      const el = document.createElement('i');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2);
    if (stageLabel) {
      stageLabel.textContent = G.waveName;
      stageLabel.classList.toggle('hot', G.kind === 'smash');
    }
    const live = standingChefs();
    if (tagLabel) {
      tagLabel.textContent = '厨 ' + live;
      tagLabel.classList.toggle('warn', live <= 1 && G.chefs.length > 0);
    }
    if (timeLabel) {
      const s = Math.max(0, Math.ceil(G.remain));
      timeLabel.textContent = s + '″';
      timeLabel.classList.toggle('low', G.mode === 'play' && s <= 8);
      timeLabel.classList.toggle('hot', G.mode === 'play' && s > 8);
    }
    if (heldLabel) {
      const f = G.player.held ? foodById(G.player.held) : null;
      heldLabel.textContent = f ? f.name : '空手';
      heldLabel.classList.toggle('empty', !f);
    }
    syncPips();
    syncModes();
  }

  function splatAt(x, y, rgb, peel) {
    audio.splat();
    spawnStain(x, y, rgb, rand(10, 16));
    spawnRing(x, y, rgb, 8);
    emit(14, {
      x: x, y: y, j: 6,
      vx0: -180, vx1: 180, vy0: -220, vy1: 80,
      life: 0.42, r0: 2, r1: 5, rgb: rgb, g: 420
    });
    if (peel) dropPeel(x, y);
  }

  function dropPeel(x, y) {
    let px = x;
    let py = y;
    if (!inArena(px, py, PEEL_R)) {
      px = clamp(px, WALL + PEEL_R, VW - WALL - PEEL_R);
      py = clamp(py, WALL + PEEL_R, VH - WALL - PEEL_R);
    }
    if (hitTable(px, py, PEEL_R)) {
      py = clamp(py + 22, WALL + PEEL_R, VH - WALL - PEEL_R);
      if (hitTable(px, py, PEEL_R)) return;
    }
    G.peels.push({ x: px, y: py, r: PEEL_R, t: 8.5, spin: rand(0, TAU) });
    if (G.peels.length > 18) G.peels.shift();
  }

  function tryThrow(ent, from) {
    if (!ent.held) return false;
    if (from === 'p' && G.throwCd > 0) return false;
    if (from === 'c' && ent.throwCd > 0) return false;
    const food = foodById(ent.held);
    const n = norm(ent.fx, ent.fy);
    const fx = n.l < 0.2 ? 1 : n.x;
    const fy = n.l < 0.2 ? 0 : n.y;
    ent.fx = fx;
    ent.fy = fy;
    const spd = food.spd * (from === 'c' ? 0.78 : 1);
    G.shots.push({
      x: ent.x + fx * (ent.r + 6),
      y: ent.y + fy * (ent.r + 6),
      vx: fx * spd,
      vy: fy * spd,
      r: food.r,
      rgb: food.rgb,
      id: food.id,
      peel: food.peel,
      from: from,
      rot: 0,
      spin: rand(-14, 14),
      life: 1.45
    });
    ent.held = null;
    if (from === 'p') {
      G.throwCd = 0.11;
      G.punch = 1.03;
      ent.squash = 0.86;
      ent.stretch = 1.14;
    } else {
      ent.throwCd = G.throwGap;
    }
    audio.throw();
    emit(5, {
      x: ent.x + fx * 10, y: ent.y + fy * 10, j: 3,
      vx0: fx * 40, vx1: fx * 120, vy0: fy * 40, vy1: fy * 120,
      life: 0.18, r0: 1.2, r1: 2.6, rgb: food.rgb
    });
    return true;
  }

  function tryPickup(ent) {
    if (ent.held) return;
    for (let i = 0; i < G.piles.length; i++) {
      const p = G.piles[i];
      if (p.count <= 0) continue;
      if (hypot(p.x - ent.x, p.y - ent.y) < PICK_R + 6) {
        p.count -= 1;
        ent.held = p.id;
        if (p.count <= 0) p.respawn = 3.1 + rand(0, 0.8);
        if (ent === G.player && G.mode === 'play') audio.pick();
        return;
      }
    }
  }

  function beginSlip(ent, dirx, diry) {
    if (ent.slip > 0) return;
    const n = norm(dirx, diry);
    const fx = n.l < 0.15 ? ent.fx : n.x;
    const fy = n.l < 0.15 ? ent.fy : n.y;
    ent.slip = 0.72;
    ent.vx = fx * 230;
    ent.vy = fy * 230;
    ent.squash = 0.48;
    ent.stretch = 1.42;
    ent.held = null;
    audio.slip();
    kick('slip');
    emit(10, {
      x: ent.x, y: ent.y, j: 8,
      vx0: -80, vx1: 80, vy0: -40, vy1: 40,
      life: 0.32, r0: 1.5, r1: 3.4, rgb: GOLD
    });
  }

  function knockChef(c, nx, ny, food) {
    const n = norm(nx, ny);
    const first = c.stun <= 0;
    c.stun = 2.85;
    c.vx = n.x * 260;
    c.vy = n.y * 260;
    c.held = null;
    c.squash = 0.4;
    c.stretch = 1.55;
    c.rot = rand(-0.8, 0.8);
    c.flash = 0.12;
    splatAt(c.x, c.y, food.rgb, food.peel);
    audio.ko();
    kick('splat');
    hitStop(first ? 0.062 : 0.04);
    G.shake = Math.max(G.shake, first ? 7 : 4);
    G.punch = 1.045;
    if (G.mode !== 'play') return;
    bumpCombo();
    const pts = (first ? 150 : 50) * G.mult;
    addScore(pts, c.x, c.y - 16, food.rgb);
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
  }

  function spawnPiles(n) {
    G.piles = [];
    const spots = PILE_SPOTS.slice();
    for (let i = spots.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = spots[i];
      spots[i] = spots[j];
      spots[j] = tmp;
    }
    const count = Math.min(n, spots.length);
    for (let i = 0; i < count; i++) {
      const food = pick(FOODS);
      G.piles.push({
        x: spots[i][0],
        y: spots[i][1],
        id: food.id,
        count: irand(6, 10),
        respawn: 0
      });
    }
  }

  function spawnCone() {
    let best = CONE_SPOTS[0];
    let bestD = -1;
    const p = G.player;
    for (let i = 0; i < CONE_SPOTS.length; i++) {
      const s = CONE_SPOTS[i];
      if (hitTable(s[0], s[1], CONE_R + 4)) continue;
      const d = hypot(s[0] - p.x, s[1] - p.y);
      if (d < 70) continue;
      const jitter = rand(0, 40);
      if (d + jitter > bestD) {
        bestD = d + jitter;
        best = s;
      }
    }
    G.cone.alive = true;
    G.cone.x = best[0];
    G.cone.y = best[1];
    G.cone.wait = 0;
    G.cone.pulse = 0;
  }

  function spawnChefs(n) {
    G.chefs = [];
    const px = G.player.x;
    const py = G.player.y;
    for (let i = 0; i < n; i++) {
      const sp = CHEF_SPAWNS[i % CHEF_SPAWNS.length];
      let x = sp[0];
      let y = sp[1];
      if (hypot(x - px, y - py) < 90) {
        x = VW - x;
        y = VH - y;
      }
      const kind = CHEF_KIND[i % CHEF_KIND.length];
      const spdMul = G.kind === 'smash' ? 1.12 : 1;
      G.chefs.push({
        name: kind.name,
        rgb: kind.rgb,
        spd: kind.spd * spdMul,
        x: x,
        y: y,
        fx: 0,
        fy: 1,
        r: 12,
        held: null,
        stun: 0,
        slip: 0,
        vx: 0,
        vy: 0,
        throwCd: rand(0.4, 1.1),
        wind: 0,
        walk: rand(0, 10),
        squash: 1,
        stretch: 1,
        rot: 0,
        flash: 0,
        think: rand(0, 0.3)
      });
    }
  }

  function spawnWave(spec) {
    G.waveName = spec.name;
    G.remain = spec.time;
    G.throwGap = spec.throw;
    G.clearT = 0;
    G.ready = 0.35;
    G.player.x = VW * 0.5;
    G.player.y = VH * 0.55;
    G.player.fx = 0;
    G.player.fy = -1;
    G.player.held = null;
    G.player.slip = 0;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.squash = 1;
    G.player.stretch = 1;
    G.shots = [];
    G.peels = [];
    spawnPiles(spec.piles);
    spawnChefs(spec.chefs);
    G.cone.alive = false;
    G.cone.wait = 0.55;
    G.invuln = Math.max(G.invuln, 0.55);
  }

  function nearestPile(x, y) {
    let best = null;
    let d = 1e9;
    for (let i = 0; i < G.piles.length; i++) {
      const p = G.piles[i];
      if (p.count <= 0) continue;
      const dd = hypot(p.x - x, p.y - y);
      if (dd < d) {
        d = dd;
        best = p;
      }
    }
    return best;
  }

  function nearestChef(x, y, ignoreStun) {
    let best = null;
    let d = 1e9;
    for (let i = 0; i < G.chefs.length; i++) {
      const c = G.chefs[i];
      if (!ignoreStun && c.stun > 0) continue;
      const dd = hypot(c.x - x, c.y - y);
      if (dd < d) {
        d = dd;
        best = c;
      }
    }
    return best;
  }

  function incomingShot(ent, dist) {
    let best = null;
    let d = dist;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from === 'p' && ent === G.player) continue;
      const dd = hypot(s.x - ent.x, s.y - ent.y);
      if (dd < d) {
        d = dd;
        best = s;
      }
    }
    return best;
  }

  function seek(ent, tx, ty, spd, dt) {
    const n = norm(tx - ent.x, ty - ent.y);
    if (n.l < 0.4) return;
    ent.fx = n.x;
    ent.fy = n.y;
    moveEnt(ent, n.x * spd * dt, n.y * spd * dt);
    ent.walk += dt * 10;
  }

  function springBody(ent, dt) {
    ent.squash += (1 - ent.squash) * Math.min(1, dt * 10);
    ent.stretch += (1 - ent.stretch) * Math.min(1, dt * 10);
    ent.rot += (0 - ent.rot) * Math.min(1, dt * 6);
    ent.flash = Math.max(0, ent.flash - dt);
  }

  function updatePeels(dt) {
    for (let i = G.peels.length - 1; i >= 0; i--) {
      const p = G.peels[i];
      p.t -= dt;
      if (p.t <= 0) {
        G.peels.splice(i, 1);
        continue;
      }
    }
  }

  function checkPeel(ent) {
    if (ent.slip > 0 || (ent === G.player && G.invuln > 0 && G.deadT > 0)) return;
    for (let i = 0; i < G.peels.length; i++) {
      const p = G.peels[i];
      if (hypot(p.x - ent.x, p.y - ent.y) < p.r + ent.r * 0.55) {
        beginSlip(ent, ent.fx, ent.fy);
        G.peels.splice(i, 1);
        return;
      }
    }
  }

  function updatePiles(dt) {
    for (let i = 0; i < G.piles.length; i++) {
      const p = G.piles[i];
      if (p.count <= 0) {
        p.respawn -= dt;
        if (p.respawn <= 0) {
          const food = pick(FOODS);
          p.id = food.id;
          p.count = irand(6, 10);
        }
      }
    }
  }

  function eatCone() {
    if (!G.cone.alive) return;
    G.cone.alive = false;
    G.cone.wait = 1.15;
    spawnRing(G.cone.x, G.cone.y, GOLD, 14);
    emit(18, {
      x: G.cone.x, y: G.cone.y, j: 8,
      vx0: -140, vx1: 140, vy0: -240, vy1: -20,
      life: 0.55, r0: 2, r1: 5, rgb: GOLD, g: 80
    });
    emit(8, {
      x: G.cone.x, y: G.cone.y, j: 4,
      vx0: -80, vx1: 80, vy0: -80, vy1: 40,
      life: 0.4, r0: 1.5, r1: 3, rgb: WHT
    });
    if (G.mode !== 'play') return;
    bumpCombo();
    const pts = 500 * G.mult;
    addScore(pts, G.cone.x, G.cone.y - 18, GOLD);
    audio.cone();
    hitStop(0.038);
    G.punch = 1.03;
    kick('boom');
    toast('甜筒！', false, true);
  }

  function updateCone(dt) {
    G.cone.pulse += dt;
    if (G.cone.alive) {
      if (G.deadT <= 0 && hypot(G.cone.x - G.player.x, G.cone.y - G.player.y) < CONE_R + G.player.r) {
        eatCone();
      }
      return;
    }
    G.cone.wait -= dt;
    if (G.cone.wait <= 0) spawnCone();
  }

  function getMove() {
    let x = 0;
    let y = 0;
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    if (keys.u) y -= 1;
    if (keys.d) y += 1;
    if (stick.on) {
      x += stick.x;
      y += stick.y;
    }
    if (G.mode === 'title') {
      x += demo.x;
      y += demo.y;
    }
    const n = norm(x, y);
    return n;
  }

  function updatePlayer(dt) {
    const p = G.player;
    springBody(p, dt);
    G.throwCd = Math.max(0, G.throwCd - dt);
    if (G.deadT > 0) return;
    checkPeel(p);
    if (p.slip > 0) {
      p.slip -= dt;
      moveEnt(p, p.vx * dt, p.vy * dt);
      p.vx *= Math.pow(0.12, dt);
      p.vy *= Math.pow(0.12, dt);
      p.walk += dt * 14;
      return;
    }
    const mv = getMove();
    if (mv.l > 0.12) {
      p.fx = mv.x;
      p.fy = mv.y;
      const spd = P_SPD * (G.kind === 'smash' ? 1.04 : 1);
      moveEnt(p, mv.x * spd * dt, mv.y * spd * dt);
      p.walk += dt * 11;
    }
    tryPickup(p);
    const wantThrow = fireHold || demo.fire;
    if (wantThrow && !overlayBlocksPlay()) tryThrow(p, 'p');
    if (!p.held) tryPickup(p);
  }

  function chefBrain(c, dt) {
    if (c.stun > 0 || c.slip > 0) return;
    c.think -= dt;
    const p = G.player;
    const shot = incomingShot(c, 70);
    if (shot) {
      const n = norm(shot.x - c.x, shot.y - c.y);
      const px = -n.y;
      const py = n.x;
      seek(c, c.x + px * 40, c.y + py * 40, c.spd * 1.15, dt);
      return;
    }
    if (!c.held) {
      const pile = nearestPile(c.x, c.y);
      const dPlayer = hypot(p.x - c.x, p.y - c.y);
      if (pile && (hypot(pile.x - c.x, pile.y - c.y) < 130 || dPlayer > 170)) {
        seek(c, pile.x, pile.y, c.spd, dt);
        tryPickup(c);
        return;
      }
    }
    seek(c, p.x, p.y, c.spd, dt);
    if (c.held) {
      const n = norm(p.x - c.x, p.y - c.y);
      c.fx = n.x;
      c.fy = n.y;
      const d = n.l;
      if (d < 210 && d > 28 && c.throwCd <= 0) {
        if (c.wind <= 0) c.wind = 0.16;
      }
      if (c.wind > 0) {
        c.wind -= dt;
        if (c.wind <= 0) tryThrow(c, 'c');
      }
    }
  }

  function updateChefs(dt) {
    for (let i = 0; i < G.chefs.length; i++) {
      const c = G.chefs[i];
      springBody(c, dt);
      c.throwCd = Math.max(0, c.throwCd - dt);
      checkPeel(c);
      if (c.stun > 0) {
        c.stun -= dt;
        moveEnt(c, c.vx * dt, c.vy * dt);
        c.vx *= Math.pow(0.08, dt);
        c.vy *= Math.pow(0.08, dt);
        if (c.stun <= 0) {
          c.squash = 1.2;
          c.stretch = 0.85;
          c.rot = 0;
        }
        continue;
      }
      if (c.slip > 0) {
        c.slip -= dt;
        moveEnt(c, c.vx * dt, c.vy * dt);
        c.vx *= Math.pow(0.12, dt);
        c.vy *= Math.pow(0.12, dt);
        continue;
      }
      chefBrain(c, dt);
      tryPickup(c);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.spin * dt;
      s.life -= dt;
      const food = foodById(s.id);
      if (s.life <= 0 || !inArena(s.x, s.y, s.r)) {
        splatAt(clamp(s.x, WALL, VW - WALL), clamp(s.y, WALL, VH - WALL), s.rgb, s.peel);
        G.shots.splice(i, 1);
        continue;
      }
      if (hitTable(s.x, s.y, s.r)) {
        splatAt(s.x, s.y, s.rgb, s.peel);
        hitStop(0.03);
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      if (s.from === 'p' || s.from === 'c') {
        for (let k = 0; k < G.chefs.length; k++) {
          const c = G.chefs[k];
          if (s.from === 'c' && hypot(c.x - s.x, c.y - s.y) < 4) continue;
          if (hypot(c.x - s.x, c.y - s.y) < c.r + s.r - 1) {
            knockChef(c, s.vx, s.vy, food);
            G.shots.splice(i, 1);
            hit = true;
            break;
          }
        }
      }
      if (hit) continue;
      if (s.from === 'c' && G.deadT <= 0 && G.mode === 'play') {
        const p = G.player;
        if (G.invuln <= 0 && hypot(p.x - s.x, p.y - s.y) < p.r + s.r - 1) {
          splatAt(s.x, s.y, s.rgb, s.peel);
          G.shots.splice(i, 1);
          hurtPlayer('被砸中了');
          continue;
        }
      }
    }
  }

  function collidePlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    const p = G.player;
    for (let i = 0; i < G.chefs.length; i++) {
      const c = G.chefs[i];
      if (c.stun > 0) continue;
      if (hypot(c.x - p.x, c.y - p.y) < c.r + p.r - 2.2) {
        hurtPlayer('撞上厨子了');
        return;
      }
    }
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.deadT = 0.82;
    G.lives -= 1;
    G.why = why;
    G.shots = [];
    G.player.held = null;
    resetCombo();
    audio.hurt();
    kick('die');
    screenFlash(MAG, 0.48);
    hitStop(0.075);
    G.shake = Math.max(G.shake, 9);
    splatAt(G.player.x, G.player.y, MAG, false);
    emit(18, {
      x: G.player.x, y: G.player.y, j: 8,
      vx0: -220, vx1: 220, vy0: -220, vy1: 220,
      life: 0.5, r0: 2, r1: 5, rgb: MAG
    });
  }

  function finishDeath() {
    if (G.lives <= 0) {
      loseRun(G.why);
      return;
    }
    G.player.x = VW * 0.5;
    G.player.y = VH * 0.55;
    G.player.slip = 0;
    G.invuln = 1.4;
    G.ready = 0.2;
    G.deadT = 0;
    toast('还有 ' + G.lives + ' 命', true, false);
  }

  function checkClear() {
    if (G.mode !== 'play' || G.clearT > 0 || G.deadT > 0) return;
    if (standingChefs() <= 0 && G.chefs.length > 0) {
      beginClear(true);
      return;
    }
    if (G.remain <= 0) beginClear(false);
  }

  function beginClear(ko) {
    G.clearT = 1.05;
    const bonus = ko ? (800 + 200 * G.wave) : (400 + 100 * G.wave);
    addScore(bonus * G.mult, G.player.x, G.player.y - 22, GOLD);
    audio.wave();
    toast(ko ? '全打倒了' : '撑住了', false, true);
    kick('boom');
    screenFlash(HOT, 0.28);
    hitStop(0.06);
  }

  function nextWave() {
    if (G.kind === 'fan' && G.wave >= FAN_WAVES.length) {
      addScore(5000, G.player.x, G.player.y, GOLD);
      winRun();
      return;
    }
    G.wave += 1;
    const spec = waveSpec(G.kind, G.wave);
    spawnWave(spec);
    toast(spec.name, false, G.kind !== 'smash');
    audio.start();
    syncHud();
  }

  function demoThink(dt) {
    demo.t += dt;
    demo.fire = false;
    const p = G.player;
    G.invuln = 99;
    const shot = incomingShot(p, 80);
    let tx = p.x;
    let ty = p.y;
    if (shot) {
      const n = norm(shot.x - p.x, shot.y - p.y);
      tx = p.x - n.y * 80;
      ty = p.y + n.x * 80;
    } else if (G.cone.alive && hypot(G.cone.x - p.x, G.cone.y - p.y) < 220) {
      tx = G.cone.x;
      ty = G.cone.y;
    } else if (!p.held) {
      const pile = nearestPile(p.x, p.y);
      if (pile) {
        tx = pile.x;
        ty = pile.y;
      }
    } else {
      const c = nearestChef(p.x, p.y, false) || nearestChef(p.x, p.y, true);
      if (c) {
        tx = c.x;
        ty = c.y;
        const n = norm(c.x - p.x, c.y - p.y);
        p.fx = n.x;
        p.fy = n.y;
        if (n.l < 240) demo.fire = true;
      }
    }
    const n = norm(tx - p.x, ty - p.y);
    demo.x = n.x;
    demo.y = n.y;
  }

  function startGame(kind) {
    G.kind = kind === 'smash' ? 'smash' : 'fan';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.nextLife = LIFE_EVERY;
    resetCombo();
    G.deadT = 0;
    G.clearT = 0;
    G.why = '';
    G.best = currentBest();
    G.invuln = 0.6;
    demo.fire = false;
    demo.x = 0;
    demo.y = 0;
    const spec = waveSpec(G.kind, 1);
    spawnWave(spec);
    hideOverlay();
    audio.start();
    toast(G.kind === 'smash' ? '乱砸 · 厨子更多更快' : ('开饭 · ' + spec.name), false, G.kind === 'smash');
    setHint(G.kind === 'smash' ? '多厨快砸 · 吃甜筒 · 香蕉皮会滑' : '捡了就砸 · 吃甜筒 · 香蕉皮会滑', G.kind === 'smash' ? 'hot' : '');
    syncHud();
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'fan';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    resetCombo();
    G.deadT = 0;
    G.clearT = 0;
    spawnWave(waveSpec('fan', 2));
    G.invuln = 99;
    G.ready = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH * 0.55;
    showOverlay('title');
    setHint('WASD 跑 · 空格砸 · 吃甜筒 · 香蕉皮会滑');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('fan');
      return;
    }
    startGame(G.kind);
  }

  function winRun() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.45);
    hitStop(0.08);
    showOverlay('win');
    setHint('打烊了 · R 再来', 'hot');
    saveBest();
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play' && G.mode !== 'lose') return;
    G.mode = 'lose';
    G.why = why;
    fireHold = false;
    audio.lose();
    kick('die');
    screenFlash(MAG, 0.5);
    hitStop(0.08);
    showOverlay('lose');
    setHint('R 重开随时可用', 'warn');
    saveBest();
    syncHud();
  }

  function updateFx(dt) {
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch += (1 - G.punch) * Math.min(1, dt * 14);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t -= dt;
      p.y -= 28 * dt;
      if (p.t <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt * 2.6;
      if (r.t >= 1) rings.splice(i, 1);
    }
    for (let i = stains.length - 1; i >= 0; i--) {
      stains[i].t -= dt;
      if (stains[i].t <= 0) stains.splice(i, 1);
    }
  }

  function playSim(dt) {
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.ready > 0) G.ready -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) resetCombo();
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      updatePlayer(dt);
      updateChefs(dt);
      updateShots(dt);
      updatePiles(dt);
      updatePeels(dt);
      updateCone(dt);
      collidePlayer();
      if (G.clearT <= 0) nextWave();
      return;
    }
    if (G.ready <= 0) G.remain = Math.max(0, G.remain - dt);
    updatePlayer(dt);
    updateChefs(dt);
    updateShots(dt);
    updatePiles(dt);
    updatePeels(dt);
    updateCone(dt);
    collidePlayer();
    checkClear();
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.45);
      return;
    }
    if (G.mode === 'title') {
      demoThink(dt);
      updatePlayer(dt);
      updateChefs(dt);
      updateShots(dt);
      updatePiles(dt);
      updatePeels(dt);
      updateCone(dt);
      if (standingChefs() <= 0) {
        for (let i = 0; i < G.chefs.length; i++) G.chefs[i].stun = 0;
      }
      updateFx(dt);
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateChefs(dt);
      updateShots(dt);
      updatePiles(dt);
      updatePeels(dt);
      if (G.deadT <= 0) finishDeath();
      updateFx(dt);
      syncHud();
      return;
    }
    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function drawFood(x, y, id, rot, sc) {
    const food = foodById(id);
    const px = sx(x);
    const py = sy(y);
    const s = (sc || 1) * scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot || 0);
    ctx.shadowColor = rgba(food.rgb, 0.7);
    ctx.shadowBlur = 8 * dpr;
    ctx.fillStyle = rgba(food.rgb, 0.95);
    if (id === 'banana') {
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(food.rgb, 0.95);
      ctx.lineWidth = 3.4 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 6 * s, 0.4, 2.6);
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.45);
      ctx.lineWidth = 1.2 * s;
      ctx.stroke();
    } else if (id === 'pie') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 7.2 * s, -0.5, 1.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WOOD2, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 7.2 * s, -0.5, 1.4);
      ctx.strokeStyle = rgba(WOOD2, 0.9);
      ctx.lineWidth = 1.6 * s;
      ctx.stroke();
    } else if (id === 'dog') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * s, 3.2 * s, 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8.4 * s, 2.1 * s, 0.4, 0, TAU);
      ctx.fill();
    } else if (id === 'cake') {
      ctx.fillRect(-5.5 * s, -3.5 * s, 11 * s, 8 * s);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(-5.5 * s, -5.2 * s, 11 * s, 2.4 * s);
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(0, -6.2 * s, 1.8 * s, 0, TAU);
      ctx.fill();
    } else if (id === 'pea') {
      ctx.beginPath();
      ctx.arc(-2.4 * s, 0, 3 * s, 0, TAU);
      ctx.arc(2.2 * s, 1.2 * s, 2.6 * s, 0, TAU);
      ctx.arc(0.4 * s, -2.4 * s, 2.4 * s, 0, TAU);
      ctx.fill();
    } else if (id === 'melon') {
      ctx.beginPath();
      ctx.arc(0, 0, 7.4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([40, 140, 70], 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 7.4 * s, 0.4, 2.6);
      ctx.lineTo(0, 0);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 6.6 * s, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.beginPath();
      ctx.arc(-2 * s, -2 * s, 1.8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(40,120,40,0.95)';
      ctx.fillRect(-1 * s, -7.4 * s, 2 * s, 2.4 * s);
    }
    ctx.restore();
  }

  function drawPile(p) {
    if (p.count <= 0) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = rgba(HOT2, 0.5);
      ctx.lineWidth = 1 * scale;
      ctx.setLineDash([3 * scale, 3 * scale]);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 10 * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
      return;
    }
    const n = Math.min(4, p.count);
    for (let i = 0; i < n; i++) {
      drawFood(p.x + (i % 2) * 5 - 2, p.y - i * 4, p.id, 0.2 * i, 1);
    }
  }

  function drawCone() {
    if (!G.cone.alive) return;
    const px = sx(G.cone.x);
    const py = sy(G.cone.y);
    const pulse = 1 + Math.sin(G.cone.pulse * 6) * 0.06;
    const s = scale * pulse;
    ctx.save();
    ctx.shadowColor = rgba(GOLD, 0.85);
    ctx.shadowBlur = 16 * dpr;
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(px, py + 12 * s);
    ctx.lineTo(px - 7 * s, py - 2 * s);
    ctx.lineTo(px + 7 * s, py - 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(px, py - 6 * s, 7.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.beginPath();
    ctx.arc(px + 3 * s, py - 11 * s, 4.2 * s, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(WHT, 0.5);
    ctx.beginPath();
    ctx.arc(px - 2 * s, py - 8 * s, 1.8 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPeel(p) {
    const a = clamp(p.t / 8.5, 0, 1);
    const px = sx(p.x);
    const py = sy(p.y);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.spin);
    ctx.globalAlpha = 0.45 + a * 0.55;
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 3.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 7 * scale, 0.4, 2.7);
    ctx.stroke();
    ctx.strokeStyle = rgba([255, 170, 40], 0.9);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.arc(-2 * scale, 1 * scale, 6 * scale, 0.5, 2.4);
    ctx.stroke();
    ctx.restore();
  }

  function drawTable(t) {
    const x = sx(t.x);
    const y = sy(t.y);
    const w = t.w * scale;
    const h = t.h * scale;
    ctx.save();
    ctx.fillStyle = rgba(WOOD, 0.92);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10 * dpr;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(HOT, 0.55);
    ctx.lineWidth = Math.max(1.4, 2 * scale);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = rgba(WOOD2, 0.5);
    ctx.fillRect(x + 4 * scale, y + 3 * scale, w - 8 * scale, 4 * scale);
    const plates = t.w > 160 ? 4 : 2;
    for (let i = 0; i < plates; i++) {
      const px = x + w * (0.22 + i * (0.56 / Math.max(1, plates - 1)));
      const py = y + h * 0.58;
      ctx.fillStyle = rgba(WHT, 0.18);
      ctx.beginPath();
      ctx.arc(px, py, 6 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT2, 0.25);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawKid(p, ghost) {
    const px = sx(p.x);
    const py = sy(p.y);
    const s = scale;
    const a = ghost ? 0.42 + 0.38 * Math.sin(G.t * 18) : 1;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.rot);
    ctx.scale(p.stretch, p.squash);
    ctx.globalAlpha = a;
    const swing = Math.sin(p.walk) * 3 * s;
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.shadowColor = rgba(HOT, 0.7);
    ctx.shadowBlur = 12 * dpr;
    ctx.fillRect(-4.2 * s, -1 * s, 8.4 * s, 9 * s);
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.fillRect(-5 * s, 7.2 * s, 3.4 * s, 6 * s + swing);
    ctx.fillRect(1.6 * s, 7.2 * s, 3.4 * s, 6 * s - swing);
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba([255, 210, 170], 0.98);
    ctx.beginPath();
    ctx.arc(0, -8.2 * s, 6.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(1.5 * s, -14.5 * s);
    ctx.quadraticCurveTo(6 * s, -16 * s, 4.2 * s, -11 * s);
    ctx.fill();
    ctx.fillStyle = '#1a0a06';
    ctx.beginPath();
    ctx.arc(-2.2 * s, -8.4 * s, 1.15 * s, 0, TAU);
    ctx.arc(2.2 * s, -8.4 * s, 1.15 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (p.held) {
      drawFood(p.x + p.fx * 12, p.y + p.fy * 12 - 4, p.held, G.t * 2, 0.9);
    }
  }

  function drawChef(c) {
    const px = sx(c.x);
    const py = sy(c.y);
    const s = scale;
    const rgb = c.flash > 0 ? WHT : c.rgb;
    const ghost = c.stun > 0 ? 0.7 : 1;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(c.rot);
    ctx.scale(c.stretch, c.squash);
    ctx.globalAlpha = ghost;
    ctx.shadowColor = rgba(rgb, 0.7);
    ctx.shadowBlur = 10 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-6.2 * s, -4 * s, 12.4 * s, 12 * s);
    const swing = Math.sin(c.walk) * 2.4 * s;
    ctx.fillRect(-5.6 * s, 7 * s, 4 * s, 7 * s + swing);
    ctx.fillRect(1.6 * s, 7 * s, 4 * s, 7 * s - swing);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(-5.4 * s, -8.5 * s, 10.8 * s, 5.5 * s);
    ctx.fillRect(-3.2 * s, -16 * s, 6.4 * s, 8.2 * s);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0a06';
    ctx.fillRect(-3.4 * s, -3.2 * s, 2.4 * s, 2.2 * s);
    ctx.fillRect(1 * s, -3.2 * s, 2.4 * s, 2.2 * s);
    ctx.strokeStyle = '#1a0a06';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.arc(0, 0.6 * s, 3.4 * s, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.restore();
    if (c.held && c.stun <= 0) {
      drawFood(c.x + c.fx * 13, c.y + c.fy * 13 - 2, c.held, 0, 0.85);
    }
  }

  function drawShot(s) {
    drawFood(s.x, s.y, s.id, s.rot, 1.05);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = rgba(s.rgb, 0.5);
    ctx.beginPath();
    ctx.arc(sx(s.x - s.vx * 0.03), sy(s.y - s.vy * 0.03), 3 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawArena() {
    ctx.fillStyle = '#160a06';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    const tile = 24 * scale;
    for (let y = sy(WALL); y < sy(VH - WALL); y += tile) {
      for (let x = sx(WALL); x < sx(VW - WALL); x += tile) {
        const ix = ((x - sx(WALL)) / tile) | 0;
        const iy = ((y - sy(WALL)) / tile) | 0;
        ctx.fillStyle = (ix + iy) % 2 === 0 ? '#1c0e08' : '#140905';
        ctx.fillRect(x, y, tile + 0.5, tile + 0.5);
      }
    }

    ctx.strokeStyle = 'rgba(255,122,41,0.045)';
    ctx.lineWidth = 1;
    for (let x = sx(WALL); x < sx(VW - WALL); x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, sy(WALL));
      ctx.lineTo(x, sy(VH - WALL));
      ctx.stroke();
    }

    const pulse = 0.45 + 0.25 * Math.sin(G.t * 3.4);
    ctx.strokeStyle = rgba(HOT, 0.35 + pulse * 0.25);
    ctx.lineWidth = Math.max(3, 5 * scale);
    ctx.strokeRect(sx(WALL * 0.45), sy(WALL * 0.45), (VW - WALL * 0.9) * scale, (VH - WALL * 0.9) * scale);
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = Math.max(1.4, 2.2 * scale);
    ctx.strokeRect(sx(WALL * 0.55), sy(WALL * 0.55), (VW - WALL * 1.1) * scale, (VH - WALL * 1.1) * scale);

    ctx.fillStyle = rgba(HOT, 0.12);
    ctx.fillRect(sx(210), sy(8), 300 * scale, 22 * scale);
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.font = '700 ' + (11 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('今日甜筒', sx(360), sy(18));

    ctx.restore();
  }

  function drawStains() {
    for (let i = 0; i < stains.length; i++) {
      const s = stains[i];
      const a = clamp(s.t / s.life, 0, 1) * 0.35;
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), s.r * scale, s.r * 0.62 * scale, 0.3, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = (2.6 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 26) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawPops() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.font = '700 ' + (13 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText(p.text, sx(p.x), sy(p.y));
    }
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 18; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.6, 1.8) * dpr,
        a: rand(0.04, 0.14),
        p: Math.random()
      });
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0c0603';
    ctx.fillRect(0, 0, W, H);

    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake) * dpr * 0.35;
      shy = rand(-G.shake, G.shake) * dpr * 0.35;
    }
    ctx.save();
    ctx.translate(shx, shy);
    const punch = REDUCE ? 1 : G.punch;
    if (punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(punch, punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(HOT, m.a);
      ctx.beginPath();
      ctx.arc(m.x * W, ((m.y + G.t * 0.018 + m.p) % 1) * H, m.r, 0, TAU);
      ctx.fill();
    }

    drawArena();
    drawStains();
    for (let i = 0; i < TABLES.length; i++) drawTable(TABLES[i]);
    for (let i = 0; i < G.peels.length; i++) drawPeel(G.peels[i]);
    for (let i = 0; i < G.piles.length; i++) drawPile(G.piles[i]);
    drawCone();
    for (let i = 0; i < G.chefs.length; i++) drawChef(G.chefs[i]);
    const ghost = G.invuln > 0 && G.mode === 'play';
    if (G.deadT <= 0) drawKid(G.player, ghost);
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawParticles();
    drawPops();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const padPx = 10 * dpr;
    scale = Math.max(0.4, Math.min((W - padPx * 2) / VW, (H - padPx * 2) / VH));
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    seedMotes();
  }

  function setStickKnob(x, y) {
    if (!knob) return;
    const m = 28;
    knob.style.transform = 'translate(' + (x * m) + 'px,' + (y * m) + 'px)';
  }

  function stickFromEvent(el, e) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;
    const nx = (e.clientX - cx) / (r.width * 0.42);
    const ny = (e.clientY - cy) / (r.height * 0.42);
    const n = norm(nx, ny);
    const mag = Math.min(1, n.l);
    stick.x = n.x * mag;
    stick.y = n.y * mag;
  }

  function bindStick(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      stick.on = true;
      stick.id = e.pointerId;
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
      stickFromEvent(el, e);
      setStickKnob(stick.x, stick.y);
    });
    el.addEventListener('pointermove', function (e) {
      if (!stick.on || e.pointerId !== stick.id) return;
      e.preventDefault();
      stickFromEvent(el, e);
      setStickKnob(stick.x, stick.y);
    });
    const end = function (e) {
      if (stick.id != null && e.pointerId !== stick.id) return;
      stick.on = false;
      stick.id = null;
      stick.x = 0;
      stick.y = 0;
      setStickKnob(0, 0);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', function (e) {
      if (stick.on && e.pointerId === stick.id) end(e);
    });
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    audio.ensure();
    const w = worldFromPtr(e.clientX, e.clientY);
    mouse.x = w.x;
    mouse.y = w.y;
    if (overlayBlocksPlay()) return;
    mouse.down = true;
    fireHold = true;
    const p = G.player;
    const n = norm(w.x - p.x, w.y - p.y);
    if (n.l > 4) {
      p.fx = n.x;
      p.fy = n.y;
    }
    tryThrow(p, 'p');
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    const w = worldFromPtr(e.clientX, e.clientY);
    mouse.x = w.x;
    mouse.y = w.y;
    if (mouse.down && G.mode === 'play' && !overlayBlocksPlay()) {
      const p = G.player;
      const n = norm(w.x - p.x, w.y - p.y);
      if (n.l > 4) {
        p.fx = n.x;
        p.fy = n.y;
      }
    }
  }

  function onPointerUp() {
    mouse.down = false;
    fireHold = false;
  }

  function setMoveKey(dir, down) {
    if (dir === 'up') keys.u = down;
    if (dir === 'down') keys.d = down;
    if (dir === 'left') keys.l = down;
    if (dir === 'right') keys.r = down;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('fan');
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS';
    const isLf = k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (isUp || isDn || isLf || isRt || isSp) e.preventDefault();
    if (overlayBlocksPlay() && (isUp || isDn || isLf || isRt || isSp)) {
      if (!down) {
        if (isUp) setMoveKey('up', false);
        if (isDn) setMoveKey('down', false);
        if (isLf) setMoveKey('left', false);
        if (isRt) setMoveKey('right', false);
        if (isSp) fireHold = false;
      }
    } else {
      if (isUp) setMoveKey('up', down);
      if (isDn) setMoveKey('down', down);
      if (isLf) setMoveKey('left', down);
      if (isRt) setMoveKey('right', down);
      if (isSp) fireHold = down;
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (e.repeat) return;
    if (k === '1' && G.mode === 'title') {
      startGame('fan');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('smash');
      return;
    }
    if (isSp || k === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON') return;
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
    }
  }

  function selfCheck() {
    if (clamp(3, 0, 2) !== 2) throw new Error('clamp');
    if (hypot(3, 4) !== 5) throw new Error('hypot');
    const w1 = waveSpec('fan', 1);
    if (w1.chefs < 2 || w1.piles < 1) throw new Error('wave1');
    const s1 = waveSpec('smash', 1);
    if (s1.chefs <= w1.chefs) throw new Error('smash chefs');
    if (s1.throw >= w1.throw) throw new Error('smash throw');
    const t = TABLES[0];
    if (!circleRect(t.x + 4, t.y + 4, 8, t)) throw new Error('table hit');
    if (circleRect(0, 0, 2, t)) throw new Error('table miss');
    if (foodById('banana').peel !== true) throw new Error('banana');
    return true;
  }

  function loop(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (hidden) {
      requestAnimationFrame(loop);
      return;
    }
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = false;
    fireHold = false;
    mouse.down = false;
    stick.on = false;
    stick.x = stick.y = 0;
    setStickKnob(0, 0);
  });

  if (btnFan) btnFan.addEventListener('click', function () { audio.ensure(); startGame('fan'); });
  if (btnSmash) btnSmash.addEventListener('click', function () { audio.ensure(); startGame('smash'); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeFan) modeFan.addEventListener('click', function () {
    audio.ensure();
    startGame('fan');
  });
  if (modeSmash) modeSmash.addEventListener('click', function () {
    audio.ensure();
    startGame('smash');
  });
  if (btnThrow) {
    btnThrow.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      fireHold = true;
      tryThrow(G.player, 'p');
    });
    const throwEnd = function (e) {
      e.preventDefault();
      fireHold = false;
    };
    btnThrow.addEventListener('pointerup', throwEnd);
    btnThrow.addEventListener('pointercancel', throwEnd);
    btnThrow.addEventListener('pointerleave', throwEnd);
  }

  bindStick(vpad);

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  selfCheck();
  loadBest();
  resize();
  bootTitle();
  syncHud();
  requestAnimationFrame(loop);
})();
