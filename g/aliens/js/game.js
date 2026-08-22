'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const HP_MAX = 100;
  const HP_LOW = 24;
  const GY = 328;
  const MY = 248;
  const HY = 170;
  const WALK = 208;
  const AIR = 0.9;
  const JUMP_V = 530;
  const GRAV = 1450;
  const MAX_FALL = 640;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const PH_DUCK = 16;
  const INVULN = 0.92;
  const DIE_T = 0.78;
  const COMBO_WIN = 1.4;
  const FLAME_CD = 0.062;
  const FLAME_RANGE = 108;
  const FLAME_SPREAD = 0.46;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-aliens-best';
  const MUTE_KEY = 'playbox-aliens-mute';
  const OPS = 'WASD / 方向键走跳 · 空格喷火（上抬枪）· R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [0, 255, 64];
  const HOT2 = [125, 255, 144];
  const WHT = [230, 248, 234];
  const FLAME = [255, 106, 32];
  const YEL = [255, 210, 64];
  const ACID = [184, 255, 42];
  const SLIME = [124, 255, 42];
  const OIL = [18, 24, 26];
  const TAN = [212, 196, 122];
  const OLIVE = [90, 110, 54];

  const SCORE = {
    egg: 50, hugger: 80, crawler: 100, drone: 120, warrior: 220,
    queen: 5000, stage: 2000, nest: 3000
  };

  const KIND = {
    egg: { hp: 1, r: 11, score: SCORE.egg, spd: 0, h: 16 },
    hugger: { hp: 1, r: 8, score: SCORE.hugger, spd: 96, h: 10 },
    crawler: { hp: 2, r: 11, score: SCORE.crawler, spd: 72, h: 12 },
    drone: { hp: 3, r: 13, score: SCORE.drone, spd: 62, h: 22 },
    warrior: { hp: 5, r: 15, score: SCORE.warrior, spd: 70, h: 26 },
    queen: { hp: 44, r: 34, score: SCORE.queen, spd: 26, h: 78 }
  };

  const STAGES = [
    {
      name: '殖民地',
      theme: 'colony',
      w: 2320,
      ground: [[0, 540], [640, 460], [1220, 460], [1800, 520]],
      plats: [
        [160, MY, 150], [420, MY, 170], [860, MY, 180],
        [1320, MY, 170], [1960, MY, 150],
        [500, HY, 120], [1020, HY, 140], [1580, HY, 130]
      ],
      vents: [[360, 3.0], [880, 2.6], [1440, 2.5], [1960, 2.3]],
      ents: [
        [260, GY, 'drone'], [470, MY, 'crawler'], [520, GY, 'egg'],
        [740, GY, 'drone'], [920, HY, 'crawler'], [980, GY, 'hugger'],
        [1140, MY, 'drone'], [1280, GY, 'egg'], [1400, GY, 'drone'],
        [1520, MY, 'crawler'], [1660, GY, 'warrior'], [1880, GY, 'drone'],
        [2040, MY, 'crawler'], [2140, GY, 'drone']
      ],
      kits: [[980, MY], [1740, GY]]
    },
    {
      name: '通风管',
      theme: 'vents',
      w: 2160,
      ground: [[0, 380], [460, 280], [860, 260], [1280, 300], [1720, 440]],
      plats: [
        [80, MY, 160], [280, MY, 140], [520, MY, 180], [780, MY, 150],
        [1080, MY, 170], [1380, MY, 160], [1680, MY, 180], [1960, MY, 120],
        [180, HY, 130], [460, HY, 150], [860, HY, 160], [1240, HY, 150],
        [1620, HY, 140], [1920, HY, 110]
      ],
      vents: [[220, 2.4], [640, 2.2], [1100, 2.0], [1520, 1.9], [1880, 1.8]],
      ents: [
        [200, MY, 'crawler'], [300, GY, 'drone'], [420, HY, 'crawler'],
        [560, GY, 'egg'], [640, MY, 'hugger'], [780, HY, 'crawler'],
        [900, GY, 'drone'], [1040, MY, 'crawler'], [1180, GY, 'warrior'],
        [1320, HY, 'crawler'], [1440, GY, 'egg'], [1540, MY, 'drone'],
        [1680, HY, 'crawler'], [1780, GY, 'drone'], [1920, MY, 'hugger'],
        [2020, GY, 'warrior']
      ],
      kits: [[760, HY], [1600, MY]]
    },
    {
      name: '巢穴',
      theme: 'hive',
      w: 2560,
      ground: [[0, 620], [700, 420], [1240, 520], [1880, 680]],
      plats: [
        [140, MY, 150], [400, MY, 160], [780, MY, 170], [1120, MY, 180],
        [1480, MY, 160], [1820, MY, 150], [2140, MY, 140],
        [260, HY, 120], [680, HY, 140], [1180, HY, 150], [1640, HY, 130],
        [2060, HY, 120]
      ],
      vents: [[480, 2.6], [980, 2.3], [1560, 2.1], [2080, 2.4]],
      ents: [
        [240, GY, 'drone'], [380, MY, 'crawler'], [520, GY, 'egg'],
        [640, GY, 'drone'], [820, HY, 'crawler'], [900, GY, 'egg'],
        [1020, GY, 'warrior'], [1180, MY, 'drone'], [1320, GY, 'egg'],
        [1440, GY, 'drone'], [1580, HY, 'crawler'], [1700, GY, 'warrior'],
        [1840, GY, 'egg'], [1960, MY, 'crawler'], [2080, GY, 'drone']
      ],
      kits: [[860, MY], [1760, GY]],
      queen: true
    }
  ];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }
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
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, n - 1) / 3));
  }
  function swarmMul() {
    return G.kind === 'swarm' ? 1.35 : 1;
  }
  function playerH() {
    return G.player.duck ? PH_DUCK : PH;
  }

  const G = {
    mode: 'title',
    kind: 'sweep',
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    lives: LIVES,
    hp: HP_MAX,
    t: 0,
    clock: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    invuln: 0,
    deadT: 0,
    why: '',
    stage: 0,
    worldW: 2320,
    theme: 'colony',
    camX: 0,
    camY: 0,
    dropT: 0,
    coyote: 0,
    jbuf: 0,
    ready: 0,
    lifeBank: 0,
    stingT: 0,
    lowWarned: false,
    muzzle: 0,
    lastFace: 1,
    flameTick: 0,
    flameRum: 0,
    flaming: false,
    latch: 0,
    safeX: 80,
    bossLock: false,
    winDelay: 0,
    player: {
      x: 90, y: GY, vx: 0, vy: 0, face: 1, on: true, duck: false, walk: 0
    },
    ents: [],
    vents: [],
    plats: [],
    ground: [],
    items: [],
    blobs: [],
    boss: null
  };

  const particles = [];
  const pops = [];
  const rings = [];
  const motes = [];
  const keys = { u: false, d: false, l: false, r: false, j: false };
  let fireHold = false;
  let jumpPad = false;
  let addTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  let hidden = false;
  let dpr = 1;
  let W = 1;
  let H = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;

  function selfCheck() {
    if (BEST_KEY !== 'playbox-aliens-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-aliens-mute') throw new Error('mute key');
    const jh = (JUMP_V * JUMP_V) / (2 * GRAV);
    if (jh < GY - MY - 2) throw new Error('jump too short for mid');
    if (STAGES.length !== 3) throw new Error('three stages');
  }
  selfCheck();

  if (!hasDom) return;

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const stageEl = el('stage');
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const scoreEl = el('score');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const bestEl = el('best');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const modeLabel = el('mode-label');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const hpBar = el('hp-bar');
  const hpWrap = el('hp-wrap');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeSweep = el('mode-sweep');
  const modeSwarm = el('mode-swarm');
  const btnSweep = el('btn-sweep');
  const btnSwarm = el('btn-swarm');
  const padEl = el('pad');
  const padBtns = {
    jump: el('btn-jump'),
    left: el('btn-left'),
    right: el('btn-right'),
    fire: el('btn-fire'),
    down: el('btn-down')
  };

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
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
    flame() {
      this.ensure();
      this.noise(0.09, 0.048, 280);
      this.beep(180, 0.08, 'sawtooth', 0.03, 70);
    },
    burn() {
      this.ensure();
      this.noise(0.05, 0.04, 420);
      this.beep(310, 0.05, 'square', 0.028, 140);
    },
    splat() {
      this.ensure();
      this.noise(0.12, 0.06, 220);
      this.beep(170, 0.13, 'sawtooth', 0.05, 48);
    },
    hatch() {
      this.ensure();
      this.noise(0.08, 0.04, 500);
      this.beep(280, 0.09, 'triangle', 0.032, 120);
    },
    sting() {
      this.ensure();
      this.beep(150, 0.12, 'sawtooth', 0.055, 70);
      this.beep(320, 0.08, 'square', 0.03, 90);
      this.noise(0.09, 0.04, 380);
    },
    shakeOff() {
      this.ensure();
      this.beep(420, 0.07, 'square', 0.04, 180);
      this.noise(0.06, 0.035, 600);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(160, 0.16, 'sawtooth', 0.055, 58);
      this.noise(0.12, 0.05, 300);
    },
    jump() {
      this.ensure();
      this.beep(360, 0.06, 'triangle', 0.028, 220);
    },
    kit() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.04, 784);
      this.beep(784, 0.11, 'triangle', 0.035);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'triangle', 0.035, 784);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(784, 0.18, 'sine', 0.05, 1046);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.22, 'sawtooth', 0.05, 70);
      this.beep(140, 0.28, 'triangle', 0.04, 50);
    },
    start() {
      this.ensure();
      this.beep(330, 0.07, 'square', 0.03, 440);
      this.beep(523, 0.1, 'triangle', 0.035);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04);
      this.beep(880, 0.1, 'triangle', 0.04);
      this.beep(1320, 0.12, 'sine', 0.035);
    },
    queen() {
      this.ensure();
      this.beep(90, 0.22, 'sawtooth', 0.055, 46);
      this.noise(0.16, 0.05, 180);
    }
  };

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function showOverlay(kind) {
    if (!overlay || !panel) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind !== 'title');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'title') {
      if (ovKicker) ovKicker.textContent = 'ALIEN';
      if (ovTitle) ovTitle.textContent = '异形';
      if (ovLead) ovLead.innerHTML = '侧向走跳，喷火清巢。抱脸虫会扑，工蜂会咬，酸血会溅。<br />过通风管，烧到巢穴，放倒女王。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = G.kind === 'swarm' ? '虫潮烧净了' : '巢清了';
      if (ovLead) ovLead.textContent = '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '被咬穿了';
      if (ovLead) ovLead.textContent = (G.kind === 'swarm' ? '虫潮' : '清巢') + ' · 分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
  }

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function screenFlash(rgb, a) {
    G.flash = a;
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
    const cap = REDUCE ? 80 : 240;
    n = Math.min(n, cap - particles.length);
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
  }

  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85, life: 0.85 });
  }

  function spawnRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, life: 0.42 });
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

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1600);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.remove('hot', 'warn');
    if (cls) hintEl.classList.add(cls);
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
  }

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(n) && n > 0 ? n : 0;
    } catch (err) {
      G.best = 0;
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
  }

  function addScore(n, x, y) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    G.lifeBank += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox && scoreAdd) {
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
    if (x != null) spawnPop(x, y - 18, '+' + n, GOLD);
    while (G.lifeBank >= LIFE_EVERY && G.lives < LIFE_CAP) {
      G.lifeBank -= LIFE_EVERY;
      G.lives += 1;
      audio.oneup();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMul(G.combo);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) showChain(G.mult);
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
  }

  function syncPips() {
    if (!pipsEl) return;
    pipsEl.innerHTML = '';
    const n = Math.max(LIVES, G.lives);
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'pip' + (i < G.lives ? ' on' : ' gone');
      pipsEl.appendChild(s);
    }
  }

  function leftAlive() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].alive && G.ents[i].type !== 'queen') n += 1;
    }
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (modeLabel) {
      modeLabel.textContent = G.kind === 'swarm' ? '虫潮' : '清巢';
      modeLabel.classList.toggle('swarm', G.kind === 'swarm');
    }
    const spec = STAGES[G.stage] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', !!G.boss);
    }
    if (tagLabel) {
      if (G.latch > 0) {
        tagLabel.textContent = '抱脸';
        tagLabel.className = 'warn';
      } else if (G.boss && G.boss.alive) {
        tagLabel.textContent = '女王';
        tagLabel.className = 'hot';
      } else if (G.flaming) {
        tagLabel.textContent = '喷火';
        tagLabel.className = 'hot';
      } else {
        tagLabel.textContent = '残 ' + leftAlive();
        tagLabel.className = '';
      }
    }
    if (hpBar) {
      const t = clamp(G.hp / HP_MAX, 0, 1);
      hpBar.style.transform = 'scaleX(' + t + ')';
    }
    const track = hpWrap ? hpWrap.querySelector('.fill-track') : null;
    if (track) {
      track.classList.toggle('low', G.hp <= HP_LOW);
      if (G.stingT > 0) track.classList.add('sting');
      else track.classList.remove('sting');
    }
    if (modeSweep) modeSweep.setAttribute('aria-pressed', G.kind !== 'swarm' ? 'true' : 'false');
    if (modeSwarm) modeSwarm.setAttribute('aria-pressed', G.kind === 'swarm' ? 'true' : 'false');
    syncPips();
  }

  function onGroundX(x) {
    for (let i = 0; i < G.ground.length; i++) {
      const g = G.ground[i];
      if (x >= g.x && x <= g.x + g.w) return true;
    }
    return false;
  }

  function makeEnt(type, x, y) {
    const spec = KIND[type];
    if (!spec) return null;
    let hp = spec.hp;
    if (G.kind === 'swarm') {
      if (type === 'drone' || type === 'crawler') hp += 1;
      if (type === 'warrior') hp += 1;
      if (type === 'queen') hp = Math.round(spec.hp * 1.22);
    }
    const e = {
      alive: true,
      type: type,
      x: x,
      y: y,
      vx: type === 'crawler' ? (Math.random() < 0.5 ? -1 : 1) * spec.spd * swarmMul() : 0,
      vy: 0,
      hp: hp,
      hpMax: hp,
      r: spec.r,
      h: spec.h,
      score: spec.score,
      spd: spec.spd * swarmMul(),
      face: 1,
      walk: Math.random() * TAU,
      bob: Math.random() * TAU,
      stun: 0,
      hurt: 0,
      latch: false,
      strain: 0,
      leap: 0,
      hatch: type === 'egg' ? 0.4 + Math.random() * 0.6 : 0,
      cling: type === 'crawler' ? y : 0,
      dropped: type !== 'crawler',
      atk: 0,
      phase: 'idle',
      spit: 0
    };
    G.ents.push(e);
    if (type === 'queen') G.boss = e;
    return e;
  }

  function buildStage(idx, demo) {
    const spec = STAGES[demo ? 0 : idx];
    G.stage = demo ? 0 : idx;
    G.theme = spec.theme;
    G.worldW = demo ? 980 : spec.w;
    G.ground = [];
    G.plats = [];
    G.vents = [];
    G.ents = [];
    G.items = [];
    G.blobs = [];
    G.boss = null;
    G.bossLock = false;
    G.winDelay = 0;
    G.latch = 0;

    const gsrc = demo ? [[0, 980]] : spec.ground;
    for (let i = 0; i < gsrc.length; i++) {
      G.ground.push({ x: gsrc[i][0], w: gsrc[i][1] });
    }
    G.plats.push({ x: 0, y: GY, w: G.worldW, floor: true });
    const psrc = spec.plats;
    const pmax = demo ? 3 : psrc.length;
    for (let i = 0; i < pmax; i++) {
      const p = psrc[i];
      if (demo && p[0] > 860) continue;
      G.plats.push({ x: p[0], y: p[1], w: p[2], floor: false });
    }
    const vsrc = spec.vents;
    const vmax = demo ? 2 : vsrc.length;
    for (let i = 0; i < vmax; i++) {
      G.vents.push({
        x: vsrc[i][0],
        cd: rand(0.4, vsrc[i][1]),
        every: (vsrc[i][1] / swarmMul()) * (demo ? 1.6 : 1)
      });
    }
    const esrc = spec.ents;
    const emax = demo ? 4 : esrc.length;
    for (let i = 0; i < emax; i++) {
      const e = esrc[i];
      if (demo && e[0] > 860) continue;
      makeEnt(e[2], e[0], e[1]);
    }
    if (!demo && G.kind === 'swarm') {
      const extra = spec.ents.slice(0, Math.min(6, spec.ents.length));
      for (let i = 0; i < extra.length; i++) {
        const e = extra[i];
        makeEnt(e[2], e[0] + 36 + (i % 3) * 18, e[1]);
      }
    }
    if (!demo && spec.queen) {
      makeEnt('queen', spec.w - 210, GY);
    }
    if (!demo && spec.kits) {
      for (let i = 0; i < spec.kits.length; i++) {
        G.items.push({
          alive: true,
          x: spec.kits[i][0],
          y: spec.kits[i][1],
          bob: Math.random() * TAU
        });
      }
    }
    G.player.x = demo ? 110 : 86;
    G.player.y = GY;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.face = 1;
    G.player.on = true;
    G.player.duck = false;
    G.player.walk = 0;
    G.camX = 0;
    G.camY = 0;
    G.safeX = 86;
    G.flaming = false;
    G.flameTick = 0;
    resetFx();
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'sweep';
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.deadT = 0;
    G.why = '';
    G.lifeBank = 0;
    G.lowWarned = false;
    G.invuln = 99;
    buildStage(0, true);
    showOverlay('title');
    setHint('走跳喷火 · 抱脸虫会扑 · 酸血会溅 · 三关打女王');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'swarm' ? 'swarm' : 'sweep';
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.deadT = 0;
    G.why = '';
    G.lifeBank = 0;
    G.lowWarned = false;
    G.ready = 0.35;
    buildStage(0, false);
    G.invuln = 0.85;
    keys.u = keys.d = keys.l = keys.r = keys.j = false;
    fireHold = false;
    jumpPad = false;
    hideOverlay();
    audio.start();
    toast(G.kind === 'swarm' ? '虫潮 · 更快更密' : '清巢 · 三关打女王', G.kind === 'swarm', G.kind !== 'swarm');
    setHint(G.kind === 'swarm' ? '虫潮更快 · 喷火清到女王' : '走跳喷火 · 过通风管 · 放倒女王', G.kind === 'swarm' ? 'warn' : '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('sweep');
    else startGame(G.kind);
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('sweep');
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why || '被咬穿了';
    audio.lose();
    kick('die');
    showOverlay('lose');
    setHint('R 重开', 'warn');
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    const bonus = SCORE.stage * (G.stage + 1) * G.mult + SCORE.nest + G.lives * 400 + (G.hp | 0) * 2;
    addScore(bonus, G.player.x, G.player.y - 30);
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.4);
    toast(G.kind === 'swarm' ? '虫潮烧净了' : '巢清了', false, true);
    showOverlay('win');
    setHint('巢清了 · R 再来', 'hot');
    syncHud();
  }

  function nextStage() {
    const n = G.stage + 1;
    addScore(SCORE.stage * (G.stage + 1) * G.mult, G.player.x, G.player.y - 24);
    if (n >= STAGES.length) {
      winRun();
      return;
    }
    audio.stage();
    buildStage(n, false);
    G.invuln = 1.1;
    G.ready = 0.4;
    G.hp = Math.min(HP_MAX, G.hp + 18);
    toast(STAGES[n].name, false, true);
    setHint(n === 2 ? '巢穴 · 女王在尽头' : '继续向右 · 喷火清路', n === 2 ? 'hot' : '');
    syncHud();
  }

  function killPlayer(why) {
    if (G.deadT > 0) return;
    G.why = why;
    G.deadT = DIE_T;
    G.latch = 0;
    for (let i = 0; i < G.ents.length; i++) {
      G.ents[i].latch = false;
      G.ents[i].strain = 0;
    }
    audio.hurt();
    kick('die');
    hitStop(0.08);
    screenFlash(MAG, 0.55);
    G.shake = 10;
    emit(18, {
      x: G.player.x, y: G.player.y - 12, j: 10,
      vx0: -140, vx1: 140, vy0: -220, vy1: 40,
      life: 0.45, r0: 1.6, r1: 4.2, rgb: MAG, g: 220
    });
    G.lives -= 1;
    syncPips();
  }

  function respawn() {
    G.player.x = clamp(G.safeX, 40, G.worldW - 40);
    G.player.y = GY;
    if (!onGroundX(G.player.x)) {
      let best = 80;
      let bd = 1e9;
      for (let i = 0; i < G.ground.length; i++) {
        const g = G.ground[i];
        const cx = g.x + g.w * 0.5;
        const d = Math.abs(cx - G.safeX);
        if (d < bd) {
          bd = d;
          best = clamp(cx, g.x + 20, g.x + g.w - 20);
        }
      }
      G.player.x = best;
    }
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.on = true;
    G.player.duck = false;
    G.hp = HP_MAX;
    G.invuln = INVULN;
    G.latch = 0;
    G.deadT = 0;
    G.lowWarned = false;
    syncHud();
  }

  function stingBar() {
    G.stingT = 0.18;
    const track = hpWrap ? hpWrap.querySelector('.fill-track') : null;
    if (track) {
      track.classList.remove('sting');
      void track.offsetWidth;
      track.classList.add('sting');
    }
  }

  function drainLatch(dt) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.hp -= (G.kind === 'swarm' ? 22 : 16) * dt;
    if (G.hp <= HP_LOW && !G.lowWarned) {
      G.lowWarned = true;
      toast('生命告急', true, false);
    }
    if (G.hp <= 0) {
      G.hp = 0;
      killPlayer('被抱脸了');
    }
  }

  function hurtPlayer(amt, why) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0 && why !== '抱脸') return;
    G.hp -= amt;
    G.why = why;
    stingBar();
    kick('sting');
    audio.sting();
    screenFlash(MAG, 0.32);
    G.shake = Math.max(G.shake, 6);
    if (why !== '抱脸') G.invuln = Math.max(G.invuln, 0.55);
    if (G.hp <= HP_LOW && !G.lowWarned) {
      G.lowWarned = true;
      toast('生命告急', true, false);
    }
    if (G.hp <= 0) {
      G.hp = 0;
      killPlayer(why || '生命耗尽');
    }
    syncHud();
  }

  function acidSplat(x, y, big) {
    const n = REDUCE ? 8 : (big ? 28 : 16);
    emit(n, {
      x: x, y: y - 8, j: big ? 16 : 10,
      vx0: -160, vx1: 160, vy0: -240, vy1: 40,
      life: 0.55, r0: 1.4, r1: 4.4, rgb: ACID, g: 520
    });
    emit(6, {
      x: x, y: y - 6, j: 8,
      vx0: -80, vx1: 80, vy0: -40, vy1: 80,
      life: 0.4, r0: 2, r1: 5, rgb: SLIME, g: 380
    });
    spawnRing(x, y - 8, ACID);
    audio.splat();
    const p = G.player;
    const rad = big ? 52 : 30;
    if (G.mode === 'play' && G.deadT <= 0 && hypot(p.x - x, p.y - 12 - y) < rad) {
      hurtPlayer(big ? 18 : 12, '酸血溅到了');
    }
  }

  function killEnt(e) {
    if (!e.alive) return;
    e.alive = false;
    e.latch = false;
    if (e.type === 'hugger' && G.latch > 0) G.latch = Math.max(0, G.latch - 1);
    bumpCombo();
    const pts = e.score * G.mult;
    addScore(pts, e.x, e.y);
    hitStop(e.type === 'queen' ? 0.08 : e.type === 'warrior' ? 0.07 : 0.055);
    G.shake = Math.max(G.shake, e.type === 'queen' ? 12 : 5);
    kick(e.type === 'queen' ? 'boom' : 'burn');
    if (e.type === 'queen') {
      G.invuln = 2.5;
      G.winDelay = 1.15;
      audio.queen();
      screenFlash(GOLD, 0.45);
      toast('女王倒下', false, true);
    }
    if (e.type === 'egg') {
      emit(10, {
        x: e.x, y: e.y - 8, j: 8,
        vx0: -90, vx1: 90, vy0: -140, vy1: 20,
        life: 0.35, r0: 1.4, r1: 3.2, rgb: MAG, g: 180
      });
      audio.hatch();
    } else if (e.type === 'hugger') {
      emit(10, {
        x: e.x, y: e.y - 4, j: 6,
        vx0: -110, vx1: 110, vy0: -160, vy1: 30,
        life: 0.38, r0: 1.2, r1: 3, rgb: MAG, g: 200
      });
      audio.splat();
    } else {
      acidSplat(e.x, e.y, e.type === 'queen' || e.type === 'warrior');
    }
  }

  function hatchEgg(e) {
    if (!e.alive || e.type !== 'egg') return;
    e.alive = false;
    audio.hatch();
    emit(8, {
      x: e.x, y: e.y - 8, j: 7,
      vx0: -70, vx1: 70, vy0: -120, vy1: 10,
      life: 0.3, r0: 1.2, r1: 2.8, rgb: MAG, g: 160
    });
    const h = makeEnt('hugger', e.x, e.y);
    if (h) {
      h.vy = -220;
      h.vx = (G.player.x < e.x ? -1 : 1) * 140;
      h.leap = 0.4;
    }
  }

  function flameOrigin() {
    const p = G.player;
    const h = playerH();
    return { x: p.x + p.face * 14, y: p.y - h * 0.58 };
  }

  function flameAng() {
    if (keys.u && !(keys.d && G.player.on)) return -0.5;
    if (G.player.duck) return 0.22;
    return 0;
  }

  function inFlame(ax, ay) {
    if (!G.flaming) return false;
    const o = flameOrigin();
    const p = G.player;
    const ang = flameAng();
    const dx = ax - o.x;
    const dy = ay - o.y;
    const lx = dx * p.face;
    const ly = dy;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const rx = lx * ca + ly * sa;
    const ry = -lx * sa + ly * ca;
    if (rx < 4 || rx > FLAME_RANGE) return false;
    const spread = Math.tan(FLAME_SPREAD) * rx + 7;
    return Math.abs(ry) <= spread;
  }

  function burnEnt(e) {
    if (!e.alive || e.hurt > 0.02) return;
    e.hp -= 1;
    e.hurt = 0.07;
    e.stun = Math.max(e.stun, 0.05);
    audio.burn();
    const o = flameOrigin();
    emit(4, {
      x: e.x, y: e.y - e.h * 0.5, j: 6,
      vx0: -40, vx1: 40, vy0: -90, vy1: -10,
      life: 0.22, r0: 1.2, r1: 2.8, rgb: YEL, g: 80
    });
    if (e.type !== 'queen') hitStop(0.032);
    else hitStop(0.04);
    kick('hit');
    if (e.hp <= 0) killEnt(e);
  }

  function landOnPlats(prevY) {
    const p = G.player;
    p.on = false;
    if (p.vy < 0) return;
    const feet = p.y;
    for (let i = 0; i < G.plats.length; i++) {
      const pl = G.plats[i];
      if (pl.floor) {
        if (!onGroundX(p.x)) continue;
      } else if (G.dropT > 0) continue;
      if (p.x < pl.x - 4 || p.x > pl.x + pl.w + 4) continue;
      if (prevY <= pl.y + 3 && feet >= pl.y - 2 && feet <= pl.y + 16) {
        p.y = pl.y;
        p.vy = 0;
        p.on = true;
        return;
      }
    }
  }

  function demoAI() {
    const p = G.player;
    const out = { l: false, r: false, j: false, f: false, u: false };
    let target = null;
    let best = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const a = G.ents[i];
      if (!a.alive) continue;
      const d = Math.abs(a.x - p.x) + Math.abs(a.y - p.y) * 0.4;
      if (d < best) {
        best = d;
        target = a;
      }
    }
    if (G.latch > 0) {
      out.f = true;
      out.l = ((G.t * 8) | 0) % 2 === 0;
      out.r = !out.l;
      out.j = G.t % 1.0 < 0.18;
      return out;
    }
    if (!target) {
      out.r = p.x < 520;
      out.l = p.x > 720;
      out.f = G.t % 1.2 < 0.45;
      return out;
    }
    if (target.x > p.x + 36) out.r = true;
    else if (target.x < p.x - 28) out.l = true;
    if (Math.abs(target.x - p.x) < 100) out.f = true;
    if (target.y < p.y - 40 && Math.abs(target.x - p.x) < 90) {
      out.j = p.on;
      out.u = true;
    }
    if (target.y < p.y - 70) out.u = true;
    if (!onGroundX(p.x + 40) && p.on) out.j = true;
    return out;
  }

  function updatePlayer(dt) {
    const p = G.player;
    const blocked = overlayOpen() && G.mode !== 'title';
    const demo = G.mode === 'title';
    let left = !blocked && keys.l;
    let right = !blocked && keys.r;
    let down = !blocked && keys.d;
    let jump = !blocked && (keys.u || keys.j || jumpPad);
    let fire = !blocked && fireHold;
    let aimUp = !blocked && keys.u;

    if (demo) {
      const ai = demoAI();
      left = ai.l;
      right = ai.r;
      down = false;
      jump = ai.j;
      fire = ai.f;
      aimUp = ai.u;
      keys.u = ai.u;
    }

    const standUp = fire && aimUp && !left && !right && p.on;
    if (standUp) jump = false;

    p.duck = down && p.on;
    const slow = G.latch > 0 ? 0.42 : 1;
    const spd = WALK * slow * (p.duck ? 0.55 : 1);
    let ax = 0;
    if (left) ax -= 1;
    if (right) ax += 1;
    if (ax !== 0) {
      if (p.face !== (ax < 0 ? -1 : 1) && G.latch > 0) {
        for (let i = 0; i < G.ents.length; i++) {
          if (G.ents[i].latch) G.ents[i].strain += 1.4;
        }
      }
      p.face = ax < 0 ? -1 : 1;
      G.lastFace = p.face;
    }
    const maxV = p.on ? spd : spd * AIR;
    if (ax !== 0) p.vx = lerp(p.vx, ax * maxV, p.on ? 0.28 : 0.12);
    else p.vx *= p.on ? 0.72 : 0.98;

    if (jump) G.jbuf = BUFFER;
    G.jbuf = Math.max(0, G.jbuf - dt);
    if (p.on) G.coyote = COYOTE;
    else G.coyote = Math.max(0, G.coyote - dt);

    if (G.jbuf > 0 && G.coyote > 0 && !p.duck) {
      p.vy = -JUMP_V;
      p.on = false;
      G.jbuf = 0;
      G.coyote = 0;
      jumpPad = false;
      audio.jump();
      emit(4, {
        x: p.x, y: p.y, j: 4,
        vx0: -40, vx1: 40, vy0: -20, vy1: 10,
        life: 0.2, r0: 1.2, r1: 2.6, rgb: WHT, g: 200
      });
      if (G.latch > 0) {
        for (let i = 0; i < G.ents.length; i++) {
          if (G.ents[i].latch) G.ents[i].strain += 2.0;
        }
      }
    }

    if (p.duck && down && p.on) {
      let floor = false;
      for (let i = 0; i < G.plats.length; i++) {
        const pl = G.plats[i];
        if (pl.floor && Math.abs(p.y - pl.y) < 4 && onGroundX(p.x)) floor = true;
      }
      if (!floor) G.dropT = 0.16;
    }
    G.dropT = Math.max(0, G.dropT - dt);

    const prevY = p.y;
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.y += p.vy * dt;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.worldW - 18);
    landOnPlats(prevY);
    if (Math.abs(p.vx) > 20 && p.on) p.walk += dt * 12;
    else p.walk += dt * 2;

    if (p.on && onGroundX(p.x) && G.latch <= 0) G.safeX = p.x;

    if (p.y > VH + 46) {
      if (demo) {
        p.y = GY;
        p.vy = 0;
        p.x = 90;
      } else killPlayer('坠入酸池');
    }

    G.flaming = !!fire && G.deadT <= 0 && G.ready <= 0;
    if (G.flaming) {
      G.muzzle = 0.08;
      updateFlameStream(dt);
    }

    if (G.latch > 0 && G.mode === 'play' && G.deadT <= 0) drainLatch(dt);

    G.invuln = Math.max(0, G.invuln - dt);
  }

  function updateFlameStream(dt) {
    const o = flameOrigin();
    const p = G.player;
    const ang = flameAng();
    const dirX = Math.cos(ang) * p.face;
    const dirY = Math.sin(ang);
    G.flameRum -= dt;
    if (G.flameRum <= 0) {
      audio.flame();
      G.flameRum = 0.09;
    }
    emit(REDUCE ? 1 : 3, {
      x: o.x + dirX * 10, y: o.y + dirY * 10, j: 3,
      vx0: dirX * 220 - 30, vx1: dirX * 380 + 30,
      vy0: dirY * 180 - 50, vy1: dirY * 180 + 40,
      life: 0.18, r0: 2.2, r1: 5.4, rgb: Math.random() < 0.45 ? YEL : FLAME, g: 40
    });
    if (Math.random() < 0.4) {
      emit(1, {
        x: o.x + dirX * rand(30, 90), y: o.y + dirY * rand(20, 70), j: 4,
        vx0: dirX * 40, vx1: dirX * 90, vy0: -80, vy1: -10,
        life: 0.28, r0: 1.2, r1: 2.6, rgb: WHT, g: 60
      });
    }
    G.flameTick -= dt;
    if (G.flameTick > 0) return;
    G.flameTick = FLAME_CD;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (e.latch) {
        burnEnt(e);
        continue;
      }
      const ey = e.y - e.h * 0.45;
      if (inFlame(e.x, ey) || inFlame(e.x, e.y - 4)) burnEnt(e);
    }
    for (let i = 0; i < G.blobs.length; i++) {
      const b = G.blobs[i];
      if (!b.alive) continue;
      if (inFlame(b.x, b.y)) {
        b.alive = false;
        emit(5, {
          x: b.x, y: b.y, j: 4,
          vx0: -50, vx1: 50, vy0: -80, vy1: 10,
          life: 0.22, r0: 1.4, r1: 3, rgb: ACID, g: 200
        });
      }
    }
  }

  function spawnHugger(x, y, fromVent) {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].alive && G.ents[i].type === 'hugger') n += 1;
    }
    if (n >= (G.kind === 'swarm' ? 8 : 5)) return;
    const h = makeEnt('hugger', x, y);
    if (!h) return;
    if (fromVent) {
      h.vy = 40 + Math.random() * 40;
      h.vx = (Math.random() < 0.5 ? -1 : 1) * 40;
    }
  }

  function updateVents(dt) {
    const p = G.player;
    for (let i = 0; i < G.vents.length; i++) {
      const v = G.vents[i];
      if (Math.abs(v.x - p.x) > 420) continue;
      v.cd -= dt;
      if (v.cd <= 0) {
        v.cd = v.every * (0.75 + Math.random() * 0.5);
        spawnHugger(v.x + rand(-8, 8), 56, true);
        emit(5, {
          x: v.x, y: 48, j: 6,
          vx0: -30, vx1: 30, vy0: 40, vy1: 120,
          life: 0.3, r0: 1.2, r1: 2.6, rgb: OIL, g: 80
        });
      }
    }
  }

  function attachHugger(e) {
    if (e.latch || G.mode !== 'play') return;
    e.latch = true;
    G.latch += 1;
    e.strain = 0;
    audio.sting();
    kick('sting');
    toast('抱脸虫！左右甩开或烧掉', true, false);
    hurtPlayer(8, '抱脸');
  }

  function detachHugger(e, shake) {
    e.latch = false;
    e.strain = 0;
    G.latch = Math.max(0, G.latch - 1);
    e.vx = G.player.face * -160;
    e.vy = -240;
    e.leap = 0.7;
    G.invuln = Math.max(G.invuln, 0.45);
    if (shake) {
      audio.shakeOff();
      spawnPop(G.player.x, G.player.y - 28, '甩开', CYN);
    }
  }

  function contactHit(e) {
    const p = G.player;
    const h = playerH();
    const dx = e.x - p.x;
    const dy = (e.y - e.h * 0.5) - (p.y - h * 0.5);
    const rr = e.r + (p.duck ? 8 : 10);
    return dx * dx + dy * dy < rr * rr;
  }

  function updateQueen(e, dt) {
    const p = G.player;
    e.bob += dt * 2.2;
    e.walk += dt * 3;
    e.face = p.x < e.x ? -1 : 1;
    e.atk -= dt;
    e.spit -= dt;
    if (G.bossLock) {
      const minX = G.worldW - 520;
      const maxX = G.worldW - 90;
      if (e.phase === 'idle') {
        e.vx = lerp(e.vx, e.face * e.spd * 0.4, 0.08);
        if (e.atk <= 0) {
          const r = Math.random();
          if (r < 0.34) {
            e.phase = 'swipe';
            e.atk = 0.55;
            audio.queen();
          } else if (r < 0.62) {
            e.phase = 'spit';
            e.atk = 0.4;
          } else if (r < 0.82) {
            e.phase = 'spawn';
            e.atk = 0.5;
          } else {
            e.phase = 'lunge';
            e.atk = 0.48;
            e.vx = e.face * 210;
          }
        }
      } else if (e.phase === 'swipe') {
        e.vx *= 0.85;
        if (e.atk < 0.32 && Math.abs(p.x - e.x) < 110 && Math.abs(p.y - e.y) < 40) {
          hurtPlayer(30, '被尾刺了');
          e.phase = 'idle';
          e.atk = 0.7;
        }
        if (e.atk <= 0) {
          e.phase = 'idle';
          e.atk = 0.55;
        }
      } else if (e.phase === 'spit') {
        e.vx *= 0.8;
        if (e.atk < 0.22 && e.spit <= 0) {
          e.spit = 0.3;
          G.blobs.push({
            alive: true,
            x: e.x + e.face * 28,
            y: e.y - 46,
            vx: e.face * 220,
            vy: -80,
            t: 1.6
          });
          audio.hatch();
        }
        if (e.atk <= 0) {
          e.phase = 'idle';
          e.atk = 0.6;
        }
      } else if (e.phase === 'spawn') {
        e.vx *= 0.7;
        if (e.atk < 0.2 && e.spit <= 0) {
          e.spit = 1;
          spawnHugger(e.x + e.face * 40, e.y - 10, false);
          spawnHugger(e.x + e.face * 18, e.y - 16, false);
          audio.hatch();
        }
        if (e.atk <= 0) {
          e.phase = 'idle';
          e.atk = 0.9;
        }
      } else if (e.phase === 'lunge') {
        if (contactHit(e)) {
          hurtPlayer(36, '被咬穿了');
          e.phase = 'idle';
          e.atk = 0.8;
        }
        if (e.atk <= 0) {
          e.phase = 'idle';
          e.atk = 0.7;
        }
      }
      e.x += e.vx * dt;
      e.x = clamp(e.x, minX + 80, maxX);
    } else {
      e.vx = 0;
    }
    e.y = GY;
    if (contactHit(e) && e.phase === 'idle') hurtPlayer(22, '被撞上了');
  }

  function updateEnemies(dt) {
    const p = G.player;
    const sm = swarmMul();
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      e.walk += dt * 8;
      e.bob += dt * 4;
      e.hurt = Math.max(0, e.hurt - dt);
      e.stun = Math.max(0, e.stun - dt);
      e.leap = Math.max(0, e.leap - dt);

      if (e.latch) {
        e.x = p.x + p.face * -5;
        e.y = p.y - playerH() + 6;
        if (e.strain >= 5.5) detachHugger(e, true);
        continue;
      }

      if (e.type === 'queen') {
        updateQueen(e, dt);
        continue;
      }

      if (e.type === 'egg') {
        if (Math.abs(e.x - p.x) < 150 && Math.abs(e.y - p.y) < 90) {
          e.hatch -= dt;
          if (e.hatch <= 0) hatchEgg(e);
        }
        continue;
      }

      if (e.stun > 0 && e.dropped) {
        e.vy += GRAV * dt;
        e.y += e.vy * dt;
        e.x += e.vx * dt * 0.4;
        if (e.y >= GY && onGroundX(e.x)) {
          e.y = GY;
          e.vy = 0;
        }
        e.x = clamp(e.x, 16, G.worldW - 16);
        continue;
      }

      if (e.type === 'crawler' && !e.dropped) {
        const toward = p.x < e.x ? -1 : 1;
        e.vx = lerp(e.vx, toward * e.spd, 0.1);
        e.x += e.vx * dt;
        e.y = e.cling;
        e.face = e.vx < 0 ? -1 : 1;
        if (Math.abs(e.x - p.x) < 48 && p.y > e.y + 18) {
          e.dropped = true;
          e.vy = 80;
        }
        e.x = clamp(e.x, 20, G.worldW - 20);
        continue;
      }

      if (e.type === 'hugger') {
        e.vy += GRAV * dt;
        if (e.vy > MAX_FALL) e.vy = MAX_FALL;
        const prev = e.y;
        e.y += e.vy * dt;
        e.x += e.vx * dt;
        if (e.vy > 0 && e.y >= GY && onGroundX(e.x) && prev <= GY + 4) {
          e.y = GY;
          e.vy = 0;
        }
        for (let k = 0; k < G.plats.length; k++) {
          const pl = G.plats[k];
          if (pl.floor) continue;
          if (e.x > pl.x && e.x < pl.x + pl.w && prev <= pl.y + 2 && e.y >= pl.y && e.vy > 0) {
            e.y = pl.y;
            e.vy = 0;
          }
        }
        const on = Math.abs(e.y - GY) < 3 || e.vy === 0;
        if (on && e.leap <= 0 && Math.abs(e.x - p.x) < 150 && Math.abs(e.y - p.y) < 90) {
          e.vy = -360 - Math.random() * 40;
          e.vx = (p.x < e.x ? -1 : 1) * (180 + Math.random() * 40) * sm;
          e.leap = 0.85;
        } else if (on) {
          e.vx = lerp(e.vx, (p.x < e.x ? -1 : 1) * e.spd, 0.12);
        }
        e.face = e.vx < 0 ? -1 : 1;
        e.x = clamp(e.x, 16, G.worldW - 16);
        if (contactHit(e) && G.invuln <= 0 && G.latch < 2 && e.leap <= 0) attachHugger(e);
        continue;
      }

      e.vy += GRAV * dt;
      if (e.vy > MAX_FALL) e.vy = MAX_FALL;
      const prevY = e.y;
      e.y += e.vy * dt;
      if (e.vy > 0 && e.y >= GY && onGroundX(e.x)) {
        e.y = GY;
        e.vy = 0;
      }
      for (let k = 0; k < G.plats.length; k++) {
        const pl = G.plats[k];
        if (pl.floor) continue;
        if (e.x > pl.x - 4 && e.x < pl.x + pl.w + 4 && prevY <= pl.y + 2 && e.y >= pl.y && e.vy > 0) {
          e.y = pl.y;
          e.vy = 0;
        }
      }
      const dx = p.x - e.x;
      const see = Math.abs(dx) < 320 && Math.abs(p.y - e.y) < 80;
      if (see) {
        e.vx = lerp(e.vx, (dx < 0 ? -1 : 1) * e.spd * (e.type === 'warrior' ? 1.15 : 1), 0.1);
        if (Math.abs(dx) < (e.type === 'warrior' ? 64 : 52) && Math.abs(p.y - e.y) < 28 && e.atk <= 0) {
          e.vx = (dx < 0 ? -1 : 1) * (e.type === 'warrior' ? 240 : 190);
          e.atk = 0.7;
        }
      } else {
        e.walk += dt;
        if (((e.walk * 0.4) | 0) % 2 === 0) e.vx = lerp(e.vx, e.spd * 0.5, 0.06);
        else e.vx = lerp(e.vx, -e.spd * 0.5, 0.06);
      }
      e.atk = Math.max(0, e.atk - dt);
      e.x += e.vx * dt;
      e.face = e.vx < 0 ? -1 : 1;
      e.x = clamp(e.x, 16, G.worldW - 16);
      if (e.y > VH + 50) {
        e.alive = false;
        continue;
      }
      if (contactHit(e)) {
        hurtPlayer(e.type === 'warrior' ? 28 : 20, e.type === 'warrior' ? '被撕开了' : '被咬穿了');
      }
    }
  }

  function updateBlobs(dt) {
    for (let i = 0; i < G.blobs.length; i++) {
      const b = G.blobs[i];
      if (!b.alive) continue;
      b.t -= dt;
      b.vy += GRAV * 0.55 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.t <= 0 || b.y > VH + 20) b.alive = false;
      const p = G.player;
      if (G.mode === 'play' && hypot(b.x - p.x, b.y - (p.y - 12)) < 12) {
        b.alive = false;
        hurtPlayer(16, '酸血溅到了');
        emit(8, {
          x: b.x, y: b.y, j: 6,
          vx0: -80, vx1: 80, vy0: -100, vy1: 20,
          life: 0.3, r0: 1.4, r1: 3.2, rgb: ACID, g: 400
        });
      }
    }
  }

  function updateItems(dt) {
    const p = G.player;
    for (let i = 0; i < G.items.length; i++) {
      const it = G.items[i];
      if (!it.alive) continue;
      it.bob += dt * 3;
      if (G.mode === 'play' && hypot(it.x - p.x, it.y - p.y) < 22) {
        it.alive = false;
        G.hp = Math.min(HP_MAX, G.hp + 40);
        G.lowWarned = G.hp <= HP_LOW;
        audio.kit();
        toast('急救 +40', false, true);
        spawnPop(it.x, it.y - 16, '+40', HOT);
        spawnRing(it.x, it.y - 8, HOT);
        syncHud();
      }
    }
  }

  function maybeAdvance() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.winDelay > 0) {
      G.winDelay -= STEP;
      if (G.winDelay <= 0) winRun();
      return;
    }
    if (G.boss && G.boss.alive) {
      if (G.player.x > G.worldW - 560) G.bossLock = true;
      return;
    }
    if (G.player.x > G.worldW - 64 && G.player.on) nextStage();
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - 190;
    if (G.bossLock) tx = G.worldW - VW;
    tx = clamp(tx, 0, Math.max(0, G.worldW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.001, dt));
    G.camY = 0;
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= 22 * dt;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t >= rings[i].life) rings.splice(i, 1);
    }
    if (G.theme === 'hive' && Math.random() < dt * 2.2) {
      emit(1, {
        x: G.camX + rand(40, VW - 40), y: 40, j: 8,
        vx0: -10, vx1: 10, vy0: 30, vy1: 70,
        life: 1.2, r0: 1.2, r1: 2.4, rgb: SLIME, g: 40
      });
    }
    if (G.theme === 'vents' && Math.random() < dt * 1.6) {
      emit(2, {
        x: G.camX + rand(20, VW - 20), y: rand(80, 200), j: 4,
        vx0: 20, vx1: 70, vy0: -20, vy1: 20,
        life: 0.5, r0: 1.4, r1: 3.2, rgb: WHT, g: 0
      });
    }
  }

  function update(dt) {
    G.clock += dt;
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shake = Math.max(0, G.shake - dt * 2.6);
    G.flash = Math.max(0, G.flash - dt * 2.8);
    G.stingT = Math.max(0, G.stingT - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        if (comboEl) comboEl.textContent = '×1';
      }
    }
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.3);
      return;
    }
    G.t += dt;
    if (G.ready > 0) G.ready -= dt;
    if (G.mode === 'win' || G.mode === 'lose') {
      updateFx(dt);
      updateCam(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateFx(dt);
      updateCam(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseRun(G.why || '生命耗尽');
        else respawn();
      }
      return;
    }
    updatePlayer(dt);
    if (G.ready <= 0) {
      if (!G.flaming) G.flameTick = 0;
      if (G.mode === 'play' || G.mode === 'title') {
        updateEnemies(dt);
        updateVents(dt);
        updateBlobs(dt);
        updateItems(dt);
      }
      if (G.mode === 'play') maybeAdvance();
    }
    updateCam(dt);
    updateFx(dt);
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  function wx(x) {
    return ox + (x - G.camX) * scale;
  }
  function wy(y) {
    return oy + (y - G.camY) * scale;
  }

  function seedMotes() {
    motes.length = 0;
    const n = REDUCE ? 10 : 28;
    for (let i = 0; i < n; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.6, 1.8) * dpr,
        a: rand(0.12, 0.4),
        p: rand(0.2, 1.4)
      });
    }
  }

  function drawPits() {
    for (let i = 0; i < G.ground.length - 1; i++) {
      const a = G.ground[i];
      const b = G.ground[i + 1];
      const x0 = a.x + a.w;
      const x1 = b.x;
      if (x1 - x0 < 8) continue;
      const px = wx(x0);
      const py = wy(GY);
      const pw = (x1 - x0) * scale;
      const ph = (VH - GY + 40) * scale;
      const g = ctx.createLinearGradient(0, py, 0, py + ph);
      g.addColorStop(0, rgba(ACID, 0.15));
      g.addColorStop(0.25, rgba(SLIME, 0.55));
      g.addColorStop(1, 'rgba(8,20,6,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = rgba(ACID, 0.45 + Math.sin(G.t * 4 + i) * 0.12);
      ctx.fillRect(px, py, pw, 5 * scale);
      ctx.fillStyle = rgba(YEL, 0.7);
      ctx.fillRect(px - 3 * scale, wy(GY - 8), 6 * scale, 8 * scale);
      ctx.fillRect(px + pw - 3 * scale, wy(GY - 8), 6 * scale, 8 * scale);
    }
  }

  function drawWorld() {
    const x0 = G.camX;
    const theme = G.theme;
    const top = theme === 'hive' ? '#14080c' : theme === 'vents' ? '#07140f' : '#06110c';
    const bot = theme === 'hive' ? '#1a0c10' : '#0a1a12';
    const bg = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    bg.addColorStop(0, top);
    bg.addColorStop(1, bot);
    ctx.fillStyle = bg;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const rib = theme === 'vents' ? 36 : 48;
    ctx.strokeStyle = theme === 'hive' ? 'rgba(255,61,184,0.08)' : 'rgba(0,255,64,0.07)';
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    const s0 = Math.floor(x0 / rib) * rib;
    for (let x = s0; x < x0 + VW + rib; x += rib) {
      ctx.beginPath();
      ctx.moveTo(wx(x), oy);
      ctx.lineTo(wx(x), oy + VH * scale);
      ctx.stroke();
    }

    if (theme === 'hive') {
      ctx.strokeStyle = 'rgba(124,255,42,0.12)';
      ctx.lineWidth = Math.max(2, 3 * scale);
      for (let x = s0; x < x0 + VW + 80; x += 80) {
        ctx.beginPath();
        ctx.moveTo(wx(x), wy(20));
        ctx.bezierCurveTo(wx(x + 30), wy(80), wx(x - 20), wy(180), wx(x + 10), wy(GY));
        ctx.stroke();
      }
    }

    ctx.fillStyle = theme === 'hive' ? '#1c1014' : '#0c1c14';
    ctx.fillRect(ox, wy(GY), VW * scale, (VH - GY) * scale);

    drawPits();

    ctx.fillStyle = theme === 'hive' ? rgba(MAG, 0.18) : rgba(HOT, 0.16);
    ctx.fillRect(ox, wy(GY), VW * scale, 3 * scale);

    ctx.fillStyle = 'rgba(4,12,8,0.85)';
    ctx.fillRect(ox, oy, VW * scale, 36 * scale);
    ctx.fillStyle = rgba(HOT, 0.12);
    ctx.fillRect(ox, wy(34), VW * scale, 2 * scale);
  }

  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const pl = G.plats[i];
      if (pl.floor) continue;
      if (pl.x + pl.w < G.camX - 10 || pl.x > G.camX + VW + 10) continue;
      const x = wx(pl.x);
      const y = wy(pl.y);
      const w = pl.w * scale;
      ctx.fillStyle = G.theme === 'hive' ? '#241018' : '#102418';
      ctx.fillRect(x, y, w, 8 * scale);
      ctx.fillStyle = G.theme === 'hive' ? rgba(MAG, 0.45) : rgba(HOT, 0.4);
      ctx.fillRect(x, y, w, 2 * scale);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x, y + 6 * scale, w, 2 * scale);
    }
  }

  function drawVents() {
    for (let i = 0; i < G.vents.length; i++) {
      const v = G.vents[i];
      if (v.x < G.camX - 30 || v.x > G.camX + VW + 30) continue;
      const x = wx(v.x - 16);
      const y = wy(28);
      ctx.fillStyle = '#07140c';
      ctx.strokeStyle = rgba(HOT, 0.55);
      ctx.lineWidth = Math.max(1, 1.2 * scale);
      ctx.fillRect(x, y, 32 * scale, 18 * scale);
      ctx.strokeRect(x, y, 32 * scale, 18 * scale);
      ctx.strokeStyle = rgba(HOT, 0.35);
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + (4 + k * 7) * scale, y);
        ctx.lineTo(x + (4 + k * 7) * scale, y + 18 * scale);
        ctx.stroke();
      }
      if (v.cd < 0.18) {
        ctx.fillStyle = rgba(MAG, 0.35);
        ctx.fillRect(x + 6 * scale, y + 16 * scale, 20 * scale, 6 * scale);
      }
    }
  }

  function drawEnt(e) {
    if (!e.alive) return;
    if (e.x < G.camX - 50 || e.x > G.camX + VW + 50) return;
    const px = wx(e.x);
    const py = wy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(e.face, 1);
    if (e.hurt > 0) ctx.globalAlpha = 0.55 + Math.sin(G.t * 40) * 0.25;

    if (e.type === 'egg') {
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -10 * s, 8 * s, 12 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ACID, 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -12 * s, 4 * s, 6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (e.type === 'hugger') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 8 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(ACID, 0.8);
      ctx.lineWidth = Math.max(1, 1.2 * s);
      ctx.beginPath();
      ctx.moveTo(-8 * s, -4 * s);
      ctx.lineTo(-14 * s, 2 * s);
      ctx.moveTo(8 * s, -4 * s);
      ctx.lineTo(14 * s, 2 * s);
      ctx.moveTo(-4 * s, -2 * s);
      ctx.lineTo(-8 * s, 6 * s);
      ctx.moveTo(4 * s, -2 * s);
      ctx.lineTo(8 * s, 6 * s);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(3 * s, -7 * s, 1.4 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (e.type === 'queen') {
      const bob = Math.sin(e.bob) * 3 * s;
      ctx.translate(0, bob);
      ctx.fillStyle = rgba(OIL, 0.96);
      ctx.beginPath();
      ctx.ellipse(4 * s, -28 * s, 22 * s, 30 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(SLIME, 0.55);
      ctx.beginPath();
      ctx.ellipse(-18 * s, -58 * s, 26 * s, 16 * s, -0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(OIL, 0.98);
      ctx.beginPath();
      ctx.ellipse(-8 * s, -52 * s, 18 * s, 14 * s, -0.35, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.ellipse(-22 * s, -50 * s, 6 * s, 3.2 * s, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(ACID, 0.7);
      ctx.lineWidth = Math.max(2, 2.4 * s);
      ctx.beginPath();
      ctx.moveTo(16 * s, -18 * s);
      ctx.quadraticCurveTo(48 * s, -8 * s, 62 * s, 8 * s);
      ctx.stroke();
      if (e.phase === 'swipe') {
        ctx.strokeStyle = rgba(MAG, 0.85);
        ctx.beginPath();
        ctx.moveTo(10 * s, -10 * s);
        ctx.quadraticCurveTo(-40 * s, 4 * s, -86 * s, 6 * s);
        ctx.stroke();
      }
      const ht = e.hp / e.hpMax;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-24 * s, -86 * s, 48 * s, 5 * s);
      ctx.fillStyle = rgba(ht < 0.35 ? MAG : HOT, 0.95);
      ctx.fillRect(-24 * s, -86 * s, 48 * s * ht, 5 * s);
      ctx.restore();
      return;
    }

    const tall = e.h;
    ctx.fillStyle = rgba(OIL, 0.96);
    ctx.beginPath();
    ctx.ellipse(0, -tall * 0.45 * s, e.r * 0.7 * s, tall * 0.42 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(SLIME, 0.7);
    ctx.beginPath();
    ctx.ellipse(-e.r * 0.35 * s, -tall * 0.78 * s, e.r * 0.85 * s, e.r * 0.55 * s, -0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(OIL, 0.98);
    ctx.beginPath();
    ctx.ellipse(-e.r * 0.15 * s, -tall * 0.75 * s, e.r * 0.55 * s, e.r * 0.4 * s, -0.45, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.beginPath();
    ctx.ellipse(-e.r * 0.7 * s, -tall * 0.72 * s, 2.4 * s, 1.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(ACID, 0.65);
    ctx.lineWidth = Math.max(1.4, 1.6 * s);
    ctx.beginPath();
    ctx.moveTo(e.r * 0.4 * s, -tall * 0.25 * s);
    ctx.quadraticCurveTo(e.r * 1.6 * s, -tall * 0.05 * s, e.r * 2.1 * s, 4 * s);
    ctx.stroke();
    const swing = Math.sin(e.walk) * 4 * s;
    ctx.strokeStyle = rgba(SLIME, 0.5);
    ctx.beginPath();
    ctx.moveTo(-3 * s, -6 * s);
    ctx.lineTo(-6 * s, swing);
    ctx.moveTo(3 * s, -6 * s);
    ctx.lineTo(6 * s, -swing);
    ctx.stroke();
    if (e.type === 'warrior') {
      ctx.strokeStyle = rgba(HOT, 0.5);
      ctx.strokeRect(-e.r * 0.4 * s, -tall * s, e.r * 0.8 * s, 4 * s);
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = G.player;
    if (G.deadT > 0) {
      const t = 1 - G.deadT / DIE_T;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = rgba(FLAME, 0.8);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y - 12), (8 + t * 22) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    const blink = G.invuln > 0 && G.mode === 'play' && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    const h = playerH();
    const px = wx(p.x);
    const py = wy(p.y);
    const swing = Math.sin(p.walk) * (p.on ? 1 : 0.2);
    const s = scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(p.face, 1);
    ctx.fillStyle = rgba(FLAME, 0.9);
    ctx.fillRect(-9 * s, -h * 0.55 * s, 5 * s, 9 * s);
    ctx.fillStyle = rgba(OLIVE, 0.95);
    ctx.fillRect(-5.2 * s, -h * s + 9 * s, 10.4 * s, (h - 12) * s);
    ctx.fillStyle = rgba(TAN, 0.96);
    ctx.fillRect(-4.6 * s, -h * s + 14 * s, 9.2 * s, 4 * s);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.arc(0, -h * s + 6 * s, 6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#030a06';
    ctx.fillRect(-3.4 * s, -h * s + 4 * s, 6.8 * s, 2.4 * s);
    ctx.fillStyle = rgba(TAN, 0.9);
    ctx.fillRect(-6 * s, -9 * s, 3.2 * s, 8 * s + swing * 3 * s);
    ctx.fillRect(2.4 * s, -9 * s, 3.2 * s, 8 * s - swing * 3 * s);
    const ang = flameAng();
    ctx.strokeStyle = rgba(FLAME, 0.95);
    ctx.lineWidth = Math.max(1.8, 2.2 * s);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4 * s, -h * 0.55 * s);
    ctx.lineTo((4 + Math.cos(ang) * 16) * s, (-h * 0.55 + Math.sin(ang) * 12) * s);
    ctx.stroke();
    if (G.muzzle > 0 || G.flaming) {
      ctx.fillStyle = rgba(YEL, 0.85);
      ctx.beginPath();
      ctx.arc((4 + Math.cos(ang) * 16) * s, (-h * 0.55 + Math.sin(ang) * 12) * s, 4.2 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    if (G.latch > 0) {
      ctx.save();
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = Math.max(1.4, 1.8 * s);
      ctx.beginPath();
      ctx.moveTo(px - 11 * s, py - h * 0.75 * s);
      ctx.lineTo(px + 12 * s, py - h * 0.35 * s);
      ctx.moveTo(px + 11 * s, py - h * 0.8 * s);
      ctx.lineTo(px - 10 * s, py - h * 0.3 * s);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFlameCone() {
    if (!G.flaming) return;
    const o = flameOrigin();
    const p = G.player;
    const ang = flameAng();
    const s = scale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const steps = REDUCE ? 5 : 10;
    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      const dist = 16 + u * (FLAME_RANGE - 8);
      const spr = Math.tan(FLAME_SPREAD) * dist + 4;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const fx = o.x + ca * p.face * dist;
      const fy = o.y + sa * dist;
      const flick = 0.55 + Math.sin(G.t * 48 + i) * 0.2;
      ctx.fillStyle = rgba(i < 4 ? YEL : FLAME, (1 - u) * 0.22 * flick);
      ctx.beginPath();
      ctx.ellipse(wx(fx), wy(fy), spr * s * (0.55 + flick * 0.2), (spr * 0.45) * s, ang * p.face, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBlobs() {
    for (let i = 0; i < G.blobs.length; i++) {
      const b = G.blobs[i];
      if (!b.alive) continue;
      ctx.fillStyle = rgba(ACID, 0.9);
      ctx.beginPath();
      ctx.arc(wx(b.x), wy(b.y), 5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(SLIME, 0.5);
      ctx.beginPath();
      ctx.arc(wx(b.x), wy(b.y), 8 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawItems() {
    for (let i = 0; i < G.items.length; i++) {
      const it = G.items[i];
      if (!it.alive) continue;
      const bob = Math.sin(it.bob) * 3;
      const px = wx(it.x);
      const py = wy(it.y - 10 + bob);
      ctx.save();
      ctx.fillStyle = rgba(HOT, 0.92);
      ctx.shadowColor = rgba(HOT, 0.6);
      ctx.shadowBlur = 8 * dpr;
      ctx.fillRect(px - 6 * scale, py - 6 * scale, 12 * scale, 12 * scale);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#030a06';
      ctx.fillRect(px - 1.4 * scale, py - 4.5 * scale, 2.8 * scale, 9 * scale);
      ctx.fillRect(px - 4.5 * scale, py - 1.4 * scale, 9 * scale, 2.8 * scale);
      ctx.restore();
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.t / q.life;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(wx(q.x), wy(q.y), q.r * scale * (0.6 + 0.4 * a), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = r.t / r.life;
      ctx.strokeStyle = rgba(r.rgb, 1 - u);
      ctx.lineWidth = Math.max(1, (2.2 - u * 1.6) * scale);
      ctx.beginPath();
      ctx.arc(wx(r.x), wy(r.y), (10 + u * 28) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      ctx.fillStyle = rgba(p.rgb, p.t / p.life);
      ctx.fillText(p.text, wx(p.x), wy(p.y));
    }
  }

  function drawMotes() {
    ctx.fillStyle = rgba(HOT, 0.5);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = ox + ((m.x + G.t * 0.01 * m.p) % 1) * VW * scale;
      const y = oy + ((m.y + Math.sin(G.t * 0.3 + m.p) * 0.02) % 1) * VH * scale;
      ctx.globalAlpha = m.a;
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawDoor() {
    if (G.boss && G.boss.alive) return;
    const x = G.worldW - 36;
    if (x < G.camX - 20 || x > G.camX + VW + 20) return;
    ctx.fillStyle = rgba(CYN, 0.22 + Math.sin(G.t * 3) * 0.08);
    ctx.fillRect(wx(x - 10), wy(GY - 64), 20 * scale, 64 * scale);
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.lineWidth = Math.max(1.2, 1.4 * scale);
    ctx.strokeRect(wx(x - 10), wy(GY - 64), 20 * scale, 64 * scale);
  }

  function drawBossBar() {
    if (!G.boss || !G.boss.alive || !G.bossLock) return;
    const x = ox + 80 * scale;
    const y = oy + 14 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    const t = clamp(G.boss.hp / G.boss.hpMax, 0, 1);
    ctx.fillStyle = rgba(t < 0.35 ? MAG : HOT, 0.9);
    ctx.fillRect(x, y, w * t, 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QUEEN', ox + VW * 0.5 * scale, y - 3 * scale);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#030a06';
    ctx.fillRect(0, 0, W, H);

    const shx = REDUCE ? 0 : (G.shake > 0 ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0);
    const shy = REDUCE ? 0 : (G.shake > 0 ? (Math.random() - 0.5) * G.shake * scale * 0.28 : 0);
    ox += shx;
    oy += shy;

    ctx.save();
    ctx.beginPath();
    ctx.rect(ox - shx, oy - shy, VW * scale, VH * scale);
    ctx.clip();

    drawWorld();
    drawPlats();
    drawVents();
    drawMotes();
    drawItems();
    drawDoor();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBlobs();
    drawPlayer();
    drawFlameCone();
    drawFx();
    drawBossBar();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(ox - shx, oy - shy, VW * scale, VH * scale);
    }

    ctx.restore();
    ox -= shx;
    oy -= shy;

    ctx.strokeStyle = 'rgba(0,255,64,0.18)';
    ctx.lineWidth = Math.max(2, 2 * dpr);
    ctx.strokeRect(ox + 1, oy + 1, VW * scale - 2, VH * scale - 2);
  }

  function setKey(name, down) {
    keys[name] = down;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS';
    const isLf = k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    const isJ = k === 'z' || k === 'Z' || k === 'x' || k === 'X' || k === 'j' || k === 'J' || code === 'KeyZ' || code === 'KeyX' || code === 'KeyJ';
    if (isUp || isDn || isLf || isRt || isSp || isJ) e.preventDefault();
    if (isUp) setKey('u', down);
    if (isDn) setKey('d', down);
    if (isLf) setKey('l', down);
    if (isRt) setKey('r', down);
    if (isJ) setKey('j', down);
    if (isSp) fireHold = down;
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
    if (k === '1') {
      audio.ensure();
      startGame('sweep');
      return;
    }
    if (k === '2') {
      audio.ensure();
      startGame('swarm');
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

  function bindPad(btn, dir) {
    if (!btn) return;
    const start = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (dir === 'fire') {
        fireHold = true;
        btn.classList.add('held');
        return;
      }
      if (dir === 'jump') {
        setKey('j', true);
        jumpPad = true;
        G.jbuf = BUFFER;
        btn.classList.add('held');
        return;
      }
      if (dir === 'down') {
        setKey('d', true);
        btn.classList.add('held');
        return;
      }
      setKey(dir === 'left' ? 'l' : 'r', true);
      btn.classList.add('held');
    };
    const end = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dir === 'fire') {
        fireHold = false;
        btn.classList.remove('held');
        return;
      }
      if (dir === 'jump') {
        setKey('j', false);
        jumpPad = false;
        btn.classList.remove('held');
        return;
      }
      if (dir === 'down') {
        setKey('d', false);
        btn.classList.remove('held');
        return;
      }
      setKey(dir === 'left' ? 'l' : 'r', false);
      btn.classList.remove('held');
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    seedMotes();
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    audio.ensure();
    canvas.focus();
    if (overlayOpen()) return;
    fireHold = true;
  });
  canvas.addEventListener('pointerup', function () { fireHold = false; });
  canvas.addEventListener('pointercancel', function () { fireHold = false; });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = keys.j = false;
    fireHold = false;
    jumpPad = false;
  });

  if (btnSweep) btnSweep.addEventListener('click', function () { audio.ensure(); startGame('sweep'); });
  if (btnSwarm) btnSwarm.addEventListener('click', function () { audio.ensure(); startGame('swarm'); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeSweep) modeSweep.addEventListener('click', function () {
    audio.ensure();
    startGame('sweep');
  });
  if (modeSwarm) modeSwarm.addEventListener('click', function () {
    audio.ensure();
    startGame('swarm');
  });

  bindPad(padBtns.jump, 'jump');
  bindPad(padBtns.left, 'left');
  bindPad(padBtns.right, 'right');
  bindPad(padBtns.fire, 'fire');
  bindPad(padBtns.down, 'down');

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

  loadBest();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('左走右走 · 跳 · 喷火 · 蹲下掉穿平台');
  }

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
