'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const ROAD = 336;
  const GY = 354;
  const CRASH_Y = 322;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const WPN_MAX = 4;
  const BEST_KEY = 'playbox-silkworm-best';
  const MUTE_KEY = 'playbox-silkworm-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 投弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const LIME = [180, 240, 60];
  const CHART = [214, 255, 82];
  const GOLD = [255, 227, 107];
  const WHT = [238, 252, 224];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const RUST = [200, 106, 56];
  const OLIVE = [90, 128, 48];
  const STEEL = [128, 148, 112];
  const SAND = [186, 168, 92];
  const ASPH = [28, 34, 18];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const SCORE = {
    jet: 50,
    dive: 80,
    heli: 120,
    worm: 90,
    truck: 80,
    tank: 180,
    aa: 140,
    launcher: 200,
    turret: 150,
    carrier: 300,
    mid: 2000,
    boss: [4000, 6000, 9000],
    clear: 2000,
    all: 8000
  };

  const STAGES = [
    {
      name: '第 1 关 · 沙道',
      biome: 'sand',
      mid: '运兵卡',
      boss: '沙甲',
      midHp: 42,
      bossHp: 96,
      waves: [
        { x: 40, kind: 'convoy', n: 4 },
        { x: 180, kind: 'helis', n: 3 },
        { x: 300, kind: 'tanks', n: 2 },
        { x: 420, kind: 'stream', n: 5 },
        { x: 540, kind: 'aa', n: 2 },
        { x: 660, kind: 'carrier' },
        { x: 780, kind: 'convoy', n: 5 },
        { x: 900, kind: 'dive', n: 4 },
        { x: 1020, kind: 'mid' },
        { x: 1280, kind: 'helis', n: 4 },
        { x: 1400, kind: 'tanks', n: 3 },
        { x: 1520, kind: 'worms', n: 3 },
        { x: 1640, kind: 'convoy', n: 4 },
        { x: 1760, kind: 'aa', n: 2 },
        { x: 1880, kind: 'carrier' },
        { x: 2050, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 夜高',
      biome: 'night',
      mid: '高射车',
      boss: '雷车',
      midHp: 54,
      bossHp: 124,
      waves: [
        { x: 30, kind: 'stream', n: 6 },
        { x: 160, kind: 'convoy', n: 5 },
        { x: 280, kind: 'helis', n: 4 },
        { x: 400, kind: 'tanks', n: 3 },
        { x: 520, kind: 'turrets' },
        { x: 640, kind: 'dive', n: 5 },
        { x: 760, kind: 'launcher', n: 2 },
        { x: 880, kind: 'carrier' },
        { x: 1000, kind: 'mid' },
        { x: 1260, kind: 'worms', n: 4 },
        { x: 1380, kind: 'convoy', n: 6 },
        { x: 1500, kind: 'helis', n: 5 },
        { x: 1620, kind: 'tanks', n: 3 },
        { x: 1740, kind: 'aa', n: 3 },
        { x: 1860, kind: 'turrets' },
        { x: 1980, kind: 'carrier' },
        { x: 2140, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 蚕堡',
      biome: 'fort',
      mid: '堡门',
      boss: '蚕甲',
      midHp: 68,
      bossHp: 168,
      waves: [
        { x: 20, kind: 'helis', n: 5 },
        { x: 140, kind: 'tanks', n: 3 },
        { x: 260, kind: 'stream', n: 7 },
        { x: 380, kind: 'launcher', n: 3 },
        { x: 500, kind: 'turrets' },
        { x: 620, kind: 'convoy', n: 6 },
        { x: 740, kind: 'worms', n: 4 },
        { x: 860, kind: 'dive', n: 6 },
        { x: 980, kind: 'carrier' },
        { x: 1100, kind: 'mid' },
        { x: 1360, kind: 'tanks', n: 4 },
        { x: 1480, kind: 'helis', n: 6 },
        { x: 1600, kind: 'aa', n: 3 },
        { x: 1720, kind: 'launcher', n: 3 },
        { x: 1840, kind: 'worms', n: 5 },
        { x: 1960, kind: 'turrets' },
        { x: 2080, kind: 'carrier' },
        { x: 2240, kind: 'boss' }
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
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnGuard = document.getElementById('btn-guard');
  const btnRain = document.getElementById('btn-rain');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPadBomb = document.getElementById('btn-pad-bomb');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const jeepLabel = document.getElementById('jeep-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const bmbBar = document.getElementById('bmb-bar');
  const bmbWrap = document.getElementById('bmb-wrap');

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
  let comboTok = 0;
  let wpnTok = 0;

  const keys = { l: false, r: false, u: false, d: false, bmb: false };
  const pointer = { down: false, hover: false, x: 110, y: 180, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'guard',
    t: 0,
    clock: 0,
    stage: 1,
    cam: 0,
    spawnI: 0,
    px: 110,
    py: 180,
    pvx: 0,
    pvy: 0,
    bank: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    powLv: 0,
    ents: [],
    shots: [],
    bombs: [],
    eShots: [],
    pick: [],
    jeep: { alive: false, x: 96, y: GY, hp: 8, maxHp: 8, fireCd: 0, flash: 0, bob: 0, ramCd: 0 },
    fireCd: 0,
    bombCd: 0,
    fireHold: false,
    bombHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    why: '',
    rotorT: 0,
    rotorAng: 0,
    jeepT: 0,
    mid: false,
    boss: false
  };

  let inputSrc = 'key';

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function isRain() {
    return G.kind === 'rain';
  }
  function stageInfo() {
    return STAGES[Math.min(2, G.stage - 1)];
  }
  function biome() {
    return stageInfo().biome;
  }
  function hpMul() {
    return isRain() ? 1.22 : 1;
  }
  function plySpd() {
    return (isRain() ? 308 : 268) + G.powLv * 8;
  }
  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.alive && (e.type === 'boss' || e.type === 'mid')) return true;
    }
    return false;
  }
  function scrollSpd() {
    if (hasBig()) return isRain() ? 36 : 24;
    const base = isRain() ? 148 : 108;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isRain() ? 12 : 8);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isRain() ? 160 : 108;
  }
  function fireMaxCd() {
    return (isRain() ? 0.098 : 0.11) - G.powLv * 0.01;
  }
  function bombMaxCd() {
    return (isRain() ? 0.34 : 0.4) - G.powLv * 0.028;
  }
  function bombReady() {
    return G.bombCd <= 0 ? 1 : clamp(1 - G.bombCd / bombMaxCd(), 0, 1);
  }

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
      o.type = type || 'square';
      o.frequency.setValueAtTime(Math.max(40, freq), t);
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
    shoot() {
      this.ensure();
      this.beep(680 + G.powLv * 36, 0.046, 'square', 0.03, 1420);
    },
    jeepShot() {
      this.ensure();
      this.beep(420, 0.04, 'square', 0.022, 760);
    },
    bombDrop() {
      this.ensure();
      this.beep(320, 0.08, 'triangle', 0.03, 180);
    },
    bombBoom() {
      this.ensure();
      this.noise(0.12, 0.058, 280);
      this.beep(180, 0.16, 'sawtooth', 0.05, 58);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (kind === 'ground') {
        this.noise(0.055, 0.04, 420);
        this.beep(210 * lift, 0.1, 'sawtooth', 0.04, 70);
      } else {
        this.noise(0.036, 0.032, 1200);
        this.beep(540 * lift, 0.066, 'square', 0.042, 920 * lift);
      }
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.1, big ? 0.076 : 0.048, big ? 220 : 460);
      this.beep(big ? 160 : 250, big ? 0.26 : 0.14, 'sawtooth', 0.05, 52);
    },
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    rotor() {
      this.ensure();
      this.noise(0.028, 0.014, 150);
      this.beep(68, 0.034, 'sine', 0.018, 46);
    },
    jeepHum() {
      this.ensure();
      this.beep(92, 0.036, 'sawtooth', 0.01, 64);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.058, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 72);
      this.beep(150, 0.32, 'sine', 0.045, 42);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 96);
      this.beep(130, 0.3, 'square', 0.04, 70);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
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

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    } else if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
    }
    if (!scoreBox || !scoreAdd) return;
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

  function toast(msg, warn, gold) {
    G.toastT = 1.28;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1280);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function wpnText() {
    if (G.powLv >= WPN_MAX) return '宽 MAX';
    if (G.powLv <= 0) return '宽';
    return '宽 ' + WPN_ROMAN[G.powLv];
  }

  function flashWpn() {
    if (!wpnLabel) return;
    wpnLabel.classList.remove('hot');
    void wpnLabel.offsetWidth;
    wpnLabel.classList.add('hot');
    wpnTok += 1;
    const tok = wpnTok;
    setTimeout(function () {
      if (tok === wpnTok && wpnLabel) wpnLabel.classList.remove('hot');
    }, 280);
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('span');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && i < LIVES);
      pips[i].style.display = i < n ? '' : 'none';
    }
  }

  function syncHud() {
    if (stageLabel) {
      stageLabel.textContent = G.mode === 'title' ? '蚕战' : stageInfo().name.replace('第 ', '');
      stageLabel.classList.toggle('hot', G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isRain() ? '弹雨' : '护路';
      tagLabel.classList.toggle('warn', isRain());
      tagLabel.classList.toggle('hot', G.mode === 'win');
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    if (jeepLabel) {
      jeepLabel.textContent = G.jeep.alive ? '吉普' : '无吉普';
      jeepLabel.classList.toggle('off', !G.jeep.alive);
    }
    if (bmbBar) {
      const r = G.mode === 'play' ? bombReady() : 1;
      bmbBar.style.transform = 'scaleX(' + r + ')';
    }
    if (bmbWrap) bmbWrap.classList.toggle('hot', G.mode === 'play' && G.bombCd <= 0);
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞地、撞机、中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint('公路肃清 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格打空 投弹砸车队', 'warn');
    else setHint('空格打空 · Shift 投弹砸车队 · 吉普上路助攻', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SILK';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovRetry) ovRetry.textContent = '再来';
    if (ovModes) {
      if (kind === 'win' && !isRain()) ovModes.textContent = '弹雨';
      else ovModes.textContent = '换模式';
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6.5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
      }
    }, 360);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    while (arr.length > n) arr.shift();
  }

  function emit(n, o) {
    if (REDUCE) n = Math.min(n, 5);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: o.x + rand(-o.j, o.j),
        y: o.y + rand(-o.j, o.j),
        vx: rand(o.vx0, o.vx1),
        vy: rand(o.vy0, o.vy1),
        t: 0,
        life: o.life || 0.38,
        r: rand(o.r0, o.r1),
        rgb: o.rgb,
        g: o.g || 0
      });
    }
    capArr(particles, 220);
  }

  function explode(x, y, rgb, n) {
    emit(n || 18, {
      x: x, y: y, j: 8,
      vx0: -180, vx1: 180, vy0: -220, vy1: 80,
      r0: 1.4, r1: 4.2, life: 0.46, rgb: rgb, g: 280
    });
    popSpark(x, y, rgb, 18 + (n || 0) * 0.4);
    popRing(x, y, rgb, 10);
  }

  function sandBurst(x, y) {
    emit(10, {
      x: x, y: y, j: 10,
      vx0: -90, vx1: 90, vy0: -140, vy1: -20,
      r0: 1.2, r1: 3.4, life: 0.42, rgb: SAND, g: 420
    });
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rad: rad || 14, rgb: rgb });
    capArr(sparks, 28);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, r: r || 8, rgb: rgb });
    capArr(rings, 18);
  }

  function floatText(x, y, text, rgb, big) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: 0.72, size: big ? 16 : 12, vy: -42
    });
    capArr(floats, 24);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      toast(G.mult + ' 倍', false, true);
    }
    if (comboEl && G.combo >= 2) {
      comboEl.hidden = false;
      comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
      const tok = comboTok;
      setTimeout(function () {
        if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
      }, 280);
    }
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.bombs.length = 0;
    G.eShots.length = 0;
    G.pick.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.mid = false;
    G.boss = false;
  }

  function mkEnt(o) {
    const e = {
      type: o.type,
      x: o.x,
      y: o.y,
      vx: o.vx || 0,
      vy: o.vy || 0,
      w: o.w || 22,
      h: o.h || 14,
      hp: o.hp,
      maxHp: o.hp,
      ground: !!o.ground,
      rgb: o.rgb || LIME,
      alive: true,
      flash: 0,
      t: 0,
      shotT: o.shotT != null ? o.shotT : rand(0.35, 1.1),
      shotCd: o.shotCd || 1.35,
      name: o.name || '',
      drop: o.drop || '',
      phase: o.phase != null ? o.phase : rand(0, TAU),
      segs: o.segs || null,
      ang: o.ang || 0
    };
    G.ents.push(e);
    return e;
  }

  function spawnConvoy(n) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      mkEnt({
        type: 'truck',
        x: G.cam + VW + 36 + i * 52,
        y: GY,
        vx: 32 + i * 3,
        w: 34,
        h: 16,
        hp: Math.max(1, Math.ceil(2 * hpMul())),
        ground: true,
        rgb: RUST,
        shotCd: 99
      });
    }
  }

  function spawnTanks(n) {
    n = n || 2;
    for (let i = 0; i < n; i++) {
      mkEnt({
        type: 'tank',
        x: G.cam + VW + 50 + i * 70,
        y: GY + 2,
        vx: 22,
        w: 36,
        h: 18,
        hp: Math.ceil(6 * hpMul()),
        ground: true,
        rgb: OLIVE,
        shotCd: isRain() ? 0.72 : 1.05
      });
    }
  }

  function spawnAa(n) {
    n = n || 2;
    for (let i = 0; i < n; i++) {
      mkEnt({
        type: 'aa',
        x: G.cam + VW + 40 + i * 58,
        y: GY,
        vx: 40,
        w: 28,
        h: 14,
        hp: Math.ceil(4 * hpMul()),
        ground: true,
        rgb: STEEL,
        shotCd: isRain() ? 0.55 : 0.82
      });
    }
  }

  function spawnLauncher(n) {
    n = n || 2;
    for (let i = 0; i < n; i++) {
      mkEnt({
        type: 'launcher',
        x: G.cam + VW + 48 + i * 76,
        y: GY,
        vx: 18,
        w: 40,
        h: 18,
        hp: Math.ceil(5 * hpMul()),
        ground: true,
        rgb: RED,
        shotCd: isRain() ? 0.9 : 1.28
      });
    }
  }

  function spawnTurrets() {
    for (let i = 0; i < 2; i++) {
      mkEnt({
        type: 'turret',
        x: G.cam + VW + 80 + i * 110,
        y: GY + 6,
        vx: 0,
        w: 22,
        h: 16,
        hp: Math.ceil(5 * hpMul()),
        ground: true,
        rgb: GOLD,
        shotCd: isRain() ? 0.62 : 0.92
      });
    }
  }

  function spawnHelis(n) {
    n = n || 3;
    for (let i = 0; i < n; i++) {
      mkEnt({
        type: 'heli',
        x: G.cam + VW + 30 + i * 46,
        y: 70 + i * 36 + rand(-10, 10),
        vx: -16,
        w: 30,
        h: 14,
        hp: Math.ceil(3 * hpMul()),
        rgb: CHART,
        shotCd: isRain() ? 0.85 : 1.2
      });
    }
  }

  function spawnStream(n) {
    n = n || 5;
    for (let i = 0; i < n; i++) {
      mkEnt({
        type: 'jet',
        x: G.cam + VW + 20 + i * 34,
        y: 60 + (i % 3) * 42,
        vx: -90,
        w: 22,
        h: 10,
        hp: Math.ceil(1 * hpMul()),
        rgb: PNK,
        shotCd: isRain() ? 1.1 : 1.8,
        phase: i * 0.7
      });
    }
  }

  function spawnDive(n) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      mkEnt({
        type: 'dive',
        x: G.cam + VW + 24 + i * 40,
        y: 36 + i * 8,
        vx: -40,
        vy: 40,
        w: 20,
        h: 12,
        hp: Math.ceil(2 * hpMul()),
        rgb: MAG,
        shotCd: 1.6
      });
    }
  }

  function spawnWorms(n) {
    n = n || 3;
    for (let i = 0; i < n; i++) {
      mkEnt({
        type: 'worm',
        x: G.cam + VW + 16 + i * 28,
        y: 80 + i * 30,
        vx: -70,
        w: 16,
        h: 10,
        hp: Math.ceil(2 * hpMul()),
        rgb: GOLD,
        shotCd: 99,
        phase: i * 1.1
      });
    }
  }

  function countType(t) {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].alive && G.ents[i].type === t) n += 1;
    }
    return n;
  }

  function spawnCarrier() {
    G.dropI += 1;
    const kind = G.dropI % 2 === 0 ? 'J' : 'P';
    mkEnt({
      type: 'carrier',
      x: G.cam + VW + 40,
      y: 90 + rand(0, 80),
      vx: -28,
      w: 26,
      h: 14,
      hp: Math.ceil(3 * hpMul()),
      rgb: GOLD,
      drop: kind,
      shotCd: 99
    });
  }

  function spawnMid() {
    const st = stageInfo();
    G.mid = true;
    mkEnt({
      type: 'mid',
      x: G.cam + VW + 80,
      y: GY,
      vx: 80,
      w: 64,
      h: 26,
      hp: Math.ceil(st.midHp * hpMul()),
      ground: true,
      rgb: GOLD,
      name: st.mid,
      shotCd: isRain() ? 0.48 : 0.7
    });
    toast(st.mid + ' 来了', false, true);
    audio.boss();
  }

  function spawnBoss() {
    const st = stageInfo();
    G.boss = true;
    const segs = [];
    if (st.biome === 'fort') {
      for (let i = 0; i < 6; i++) segs.push({ x: 0, y: GY });
    }
    mkEnt({
      type: 'boss',
      x: G.cam + VW + 90,
      y: GY,
      vx: 70,
      w: st.biome === 'fort' ? 52 : 78,
      h: st.biome === 'fort' ? 28 : 30,
      hp: Math.ceil(st.bossHp * hpMul()),
      ground: true,
      rgb: st.biome === 'fort' ? LIME : ORG,
      name: st.boss,
      shotCd: isRain() ? 0.38 : 0.55,
      segs: segs.length ? segs : null
    });
    toast(st.boss + ' 来了', true, false);
    audio.boss();
    screenFlash(MAG, 0.28);
  }

  function spawnWave(w) {
    if (w.kind === 'convoy') spawnConvoy(w.n);
    else if (w.kind === 'tanks') spawnTanks(w.n);
    else if (w.kind === 'aa') spawnAa(w.n);
    else if (w.kind === 'launcher') spawnLauncher(w.n);
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'helis') spawnHelis(w.n);
    else if (w.kind === 'stream') spawnStream(w.n);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'worms') spawnWorms(w.n);
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
    if (isRain() && (w.kind === 'convoy' || w.kind === 'tanks')) spawnAa(1);
  }

  function maybeSpawn() {
    const waves = stageInfo().waves;
    while (G.spawnI < waves.length) {
      const w = waves[G.spawnI];
      if (G.cam + VW < w.x) break;
      if ((G.mid || G.boss) && w.kind !== 'mid' && w.kind !== 'boss') break;
      G.spawnI += 1;
      spawnWave(w);
    }
  }

  function spawnPickup(wx, wy, kind) {
    G.pick.push({
      x: wx,
      y: wy,
      vx: -24,
      t: 0,
      life: 9.5,
      kind: kind || 'P'
    });
    capArr(G.pick, 8);
  }

  function enemyShot(x, y, vx, vy, fat) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: fat ? 6.2 : 3.2,
      life: fat ? 2.6 : 3.1,
      fat: !!fat
    });
  }

  function aimShot(sx0, sy0, spd, spread, fat) {
    const dx = G.px - sx0;
    const dy = G.py - sy0;
    const d = hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx) + (spread || 0);
    enemyShot(sx0, sy0, Math.cos(ang) * spd, Math.sin(ang) * spd, fat);
  }

  function fanShot(sx0, sy0, n, spd, spread) {
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) * 0.5) * spread;
      aimShot(sx0, sy0, spd, a, false);
    }
  }

  function ringShot(sx0, sy0, n, spd, off) {
    for (let i = 0; i < n; i++) {
      const a = off + i * (TAU / n);
      enemyShot(sx0, sy0, Math.cos(a) * spd, Math.sin(a) * spd, false);
    }
  }

  function fireGuns() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.powLv;
    G.fireCd = fireMaxCd();
    G.muzzle = 0.05;
    const rgb = lv >= 3 ? GOLD : lv >= 1 ? LIME : WHT;
    const spd = 680;
    function add(ox, oy, vx, vy) {
      if (G.shots.length > 64) return;
      G.shots.push({
        x: G.px + 22 + ox,
        y: G.py + oy,
        vx: vx == null ? spd : vx,
        vy: vy || 0,
        r: 3.1,
        rgb: rgb,
        dmg: 1,
        life: 1.05,
        kind: 'gun'
      });
    }
    if (lv <= 0) {
      add(0, 0);
    } else if (lv === 1) {
      add(0, -6);
      add(0, 6);
    } else if (lv === 2) {
      add(0, -8, spd, -70);
      add(2, 0);
      add(0, 8, spd, 70);
    } else if (lv === 3) {
      add(0, -12, spd, -110);
      add(0, -5, spd, -36);
      add(3, 0);
      add(0, 5, spd, 36);
      add(0, 12, spd, 110);
    } else {
      add(0, -16, spd, -150);
      add(0, -9, spd, -80);
      add(0, -3);
      add(4, 0);
      add(0, 3);
      add(0, 9, spd, 80);
      add(0, 16, spd, 150);
    }
    audio.shoot();
    emit(3, {
      x: G.px + 24, y: G.py, j: 2.2,
      vx0: 80, vx1: 180, vy0: -22, vy1: 22,
      life: 0.12, r0: 1, r1: 2.2, rgb: rgb, g: 0
    });
  }

  function dropBombs() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombCd > 0) return;
    G.bombCd = bombMaxCd();
    const n = G.powLv >= 3 ? 3 : G.powLv >= 1 ? 2 : 1;
    const splash = 36 + G.powLv * 7;
    const dmg = 3 + (G.powLv >= 3 ? 2 : G.powLv >= 1 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const side = i - (n - 1) * 0.5;
      G.bombs.push({
        x: G.px + 8 + side * 11,
        y: G.py + 10,
        vx: 200 + G.powLv * 12,
        vy: 96 + Math.abs(side) * 18,
        r: 4.4,
        dmg: dmg,
        splash: splash,
        life: 1.9,
        rgb: GOLD
      });
    }
    capArr(G.bombs, 18);
    audio.bombDrop();
    emit(4, {
      x: G.px + 6, y: G.py + 10, j: 3,
      vx0: 40, vx1: 120, vy0: 40, vy1: 110,
      life: 0.16, r0: 1.2, r1: 2.6, rgb: ORG, g: 0
    });
  }

  function bombExplode(b) {
    const x = b.x;
    const y = b.y;
    explode(x, y, GOLD, 22);
    sandBurst(x, ROAD + 10);
    popSpark(x, y, ORG, 22);
    screenFlash(GOLD, 0.38);
    hitStop(0.056);
    kick(4.8);
    audio.bombBoom();
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
      setTimeout(function () {
        if (stageEl) stageEl.classList.remove('bomb');
      }, 200);
    }
    const rad = b.splash;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || !e.ground) continue;
      const ex = e.x - G.cam;
      const ey = e.y;
      if (hypot(ex - x, ey - y) < rad + Math.max(e.w, e.h) * 0.35) {
        hurtEnt(e, b.dmg, ex, ey, true);
      }
    }
  }

  function jeepFire() {
    const j = G.jeep;
    if (!j.alive || G.mode !== 'play') return;
    if (j.fireCd > 0) return;
    j.fireCd = isRain() ? 0.2 : 0.24;
    G.shots.push({
      x: j.x + 16,
      y: j.y - 4,
      vx: 520,
      vy: 0,
      r: 2.8,
      rgb: GOLD,
      dmg: 1,
      life: 0.9,
      kind: 'jeep'
    });
    audio.jeepShot();
    emit(2, {
      x: j.x + 16, y: j.y - 4, j: 1.6,
      vx0: 40, vx1: 90, vy0: -10, vy1: 10,
      life: 0.1, r0: 1, r1: 1.8, rgb: GOLD, g: 0
    });
  }

  function hurtEnt(e, dmg, hx, hy, fromBomb) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    bumpCombo();
    const ground = !!e.ground;
    audio.hit(ground ? 'ground' : 'air', G.combo);
    popSpark(hx, hy, fromBomb ? GOLD : (ground ? ORG : LIME), e.type === 'boss' ? 12 : 8);
    emit(5, {
      x: hx, y: hy, j: 4,
      vx0: -90, vx1: 90, vy0: -90, vy1: 90,
      r0: 1.2, r1: 2.8, life: 0.22,
      rgb: fromBomb ? GOLD : PNK, g: 70
    });
    if (e.type === 'boss' || e.type === 'mid') {
      hitStop(fromBomb ? 0.048 : 0.036);
      kick(2.6);
    } else {
      hitStop(fromBomb ? 0.046 : 0.034);
    }
    if (e.hp <= 0) killEnt(e, hx, hy);
  }

  function killEnt(e, hx, hy) {
    e.alive = false;
    e.hp = 0;
    let pts = SCORE.jet;
    let rgb = LIME;
    let pow = 16;
    if (e.type === 'dive') { pts = SCORE.dive; rgb = PNK; pow = 16; }
    else if (e.type === 'heli') { pts = SCORE.heli; rgb = CHART; pow = 20; }
    else if (e.type === 'worm') { pts = SCORE.worm; rgb = GOLD; pow = 14; }
    else if (e.type === 'truck') { pts = SCORE.truck; rgb = RUST; pow = 16; }
    else if (e.type === 'tank') { pts = SCORE.tank; rgb = OLIVE; pow = 22; }
    else if (e.type === 'aa') { pts = SCORE.aa; rgb = STEEL; pow = 18; }
    else if (e.type === 'launcher') { pts = SCORE.launcher; rgb = RED; pow = 22; }
    else if (e.type === 'turret') { pts = SCORE.turret; rgb = GOLD; pow = 18; }
    else if (e.type === 'carrier') { pts = SCORE.carrier; rgb = GOLD; pow = 22; }
    else if (e.type === 'mid') { pts = SCORE.mid; rgb = GOLD; pow = 36; }
    else if (e.type === 'boss') {
      pts = SCORE.boss[G.stage - 1] || 4000;
      rgb = GOLD;
      pow = 50;
    }
    const n = Math.round(pts * G.mult);
    addScore(n);
    floatText(hx, hy, '+' + n, rgb, e.type === 'boss' || e.type === 'mid' || G.mult >= 3);
    explode(hx, hy, rgb, pow);
    if (e.ground) sandBurst(hx, hy);
    if (e.type === 'carrier' && e.drop) {
      spawnPickup(e.x, e.y, e.drop === 'J' ? 'J' : 'P');
    }
    if (e.type === 'mid') {
      hitStop(0.07);
      kick(6.4);
      screenFlash(GOLD, 0.42);
      G.mid = false;
      spawnPickup(e.x, e.y, 'P');
      toast(e.name + '击破', false, true);
      syncHud();
    } else if (e.type === 'boss') {
      hitStop(0.082);
      kick(7.4);
      screenFlash(GOLD, 0.58);
      for (let k = 0; k < 5; k++) {
        explode(hx + rand(-32, 32), hy + rand(-26, 26), k % 2 ? ORG : GOLD, 26);
      }
      onBossDown();
    } else {
      hitStop(0.042);
      kick(2.4);
    }
  }

  function onBossDown() {
    G.boss = false;
    G.stageClearT = 1.55;
    addScore(SCORE.clear);
    toast(stageInfo().boss + '击破', false, true);
    audio.wave();
    syncHud();
  }

  function nextStage() {
    G.stage += 1;
    G.cam = 0;
    G.spawnI = 0;
    G.stageClearT = 0;
    G.invuln = 1.15;
    clearField();
    toast(stageInfo().name, false, true);
    audio.wave();
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(SCORE.all);
    showOverlay(
      'win',
      '公路肃清',
      '三关车队打穿。蚕甲残骸还在冒烟。R 再来，或切弹雨加密度。'
    );
    audio.win();
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    showOverlay(
      'lose',
      '机毁了',
      G.why === 'ground' ? '撞上公路。护路机不能贴地。R 重开。'
        : G.why === 'crash' ? '空中相撞。R 重开。'
          : '中弹坠机。R 重开。'
    );
    audio.lose();
    syncHud();
  }

  function restoreJeep() {
    G.jeep.alive = true;
    G.jeep.x = 96;
    G.jeep.y = GY;
    G.jeep.hp = 8;
    G.jeep.maxHp = 8;
    G.jeep.fireCd = 0;
    G.jeep.flash = 0.4;
    G.jeep.ramCd = 0.4;
    syncHud();
  }

  function killJeep() {
    if (!G.jeep.alive) return;
    explode(G.jeep.x, G.jeep.y, GOLD, 18);
    sandBurst(G.jeep.x, G.jeep.y);
    audio.boom(false);
    G.jeep.alive = false;
    toast('吉普没了', true, false);
    syncHud();
  }

  function hurtJeep(dmg) {
    if (!G.jeep.alive) return;
    G.jeep.hp -= dmg;
    G.jeep.flash = 0.12;
    if (G.jeep.hp <= 0) killJeep();
  }

  function diePlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.why = why || 'shot';
    G.deadT = 0.95;
    G.lives -= 1;
    explode(G.px, G.py, MAG, 36);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    kick(7.2);
    audio.death();
    G.eShots.length = 0;
    if (G.powLv > 0) {
      spawnPickup(G.cam + G.px, G.py, 'P');
      G.powLv = 0;
      flashWpn();
    }
    syncHud();
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      stageEl.classList.add('die');
    }
  }

  function respawn() {
    G.px = 110;
    G.py = 170;
    G.pvx = 0;
    G.pvy = 0;
    G.deadT = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    syncHud();
  }

  function collectPick(p) {
    p.life = 0;
    if (p.kind === 'J') {
      if (G.jeep.alive) {
        addScore(400 * G.mult);
        floatText(G.px, G.py - 16, '+400', GOLD, false);
      } else {
        restoreJeep();
        toast('吉普上路', false, true);
      }
      audio.pow();
      screenFlash(GOLD, 0.32);
      if (stageEl && !REDUCE) {
        stageEl.classList.remove('pow');
        void stageEl.offsetWidth;
        stageEl.classList.add('pow');
        setTimeout(function () {
          if (stageEl) stageEl.classList.remove('pow');
        }, 280);
      }
    } else {
      if (G.powLv < WPN_MAX) {
        G.powLv += 1;
        flashWpn();
        toast(wpnText(), false, true);
      } else {
        addScore(500 * G.mult);
        floatText(G.px, G.py - 16, '+500', GOLD, true);
      }
      audio.pow();
      screenFlash(GOLD, 0.32);
      if (stageEl && !REDUCE) {
        stageEl.classList.remove('pow');
        void stageEl.offsetWidth;
        stageEl.classList.add('pow');
        setTimeout(function () {
          if (stageEl) stageEl.classList.remove('pow');
        }, 280);
      }
    }
    syncHud();
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const spd = plySpd();
    let ax = 0;
    let ay = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      ax = pointer.x - G.px;
      ay = pointer.y - G.py;
      const d = hypot(ax, ay);
      if (d > 8) {
        G.px += (ax / d) * Math.min(d, spd * dt * 1.15);
        G.py += (ay / d) * Math.min(d, spd * dt * 1.15);
      }
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax && ay) {
        ax *= 0.707;
        ay *= 0.707;
      }
      G.px += ax * spd * dt;
      G.py += ay * spd * dt;
    }
    G.px = clamp(G.px, 28, 360);
    G.py = clamp(G.py, 24, CRASH_Y + 8);
    G.bank = lerp(G.bank, (keys.d ? 0.12 : 0) - (keys.u ? 0.12 : 0), 0.18);
    if (G.py > CRASH_Y && G.invuln <= 0) diePlayer('ground');
  }

  function updateJeep(dt) {
    const j = G.jeep;
    if (!j.alive) return;
    j.bob += dt;
    const tx = clamp(G.px * 0.42 + 70, 70, 210);
    j.x = lerp(j.x, tx, 1 - Math.pow(0.012, dt));
    j.y = GY + Math.sin(j.bob * 10) * 1.2;
    j.fireCd = Math.max(0, j.fireCd - dt);
    j.ramCd = Math.max(0, j.ramCd - dt);
    if (j.flash > 0) j.flash -= dt;
    let target = null;
    let best = 9999;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || !e.ground) continue;
      const ex = e.x - G.cam;
      if (ex < j.x - 8) continue;
      const d = ex - j.x;
      if (d < best && Math.abs(e.y - j.y) < 40) {
        best = d;
        target = e;
      }
    }
    if (target && best < 420) jeepFire();
    else if (!target && j.fireCd <= 0 && Math.random() < 0.4) jeepFire();

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || !e.ground) continue;
      const ex = e.x - G.cam;
      if (j.ramCd <= 0 && Math.abs(ex - j.x) < (e.w * 0.4 + 14) && Math.abs(e.y - j.y) < 16) {
        j.ramCd = 0.35;
        hurtJeep(1);
        hurtEnt(e, 1, ex, e.y, false);
      }
    }
  }

  function updateEnts(dt) {
    const scr = scrollSpd();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.type === 'mid' || e.type === 'boss') {
        const tx = G.cam + VW * 0.68;
        e.x += (tx - e.x) * Math.min(1, dt * 1.6);
        e.y = GY + Math.sin(e.t * 1.6) * (e.type === 'boss' && e.segs ? 6 : 3);
        if (e.segs) {
          let px = e.x;
          let py = e.y;
          for (let s = 0; s < e.segs.length; s++) {
            const sg = e.segs[s];
            if (sg.x === 0 && sg.y === GY) {
              sg.x = e.x - (s + 1) * 22;
              sg.y = e.y;
            }
            const dx = px - sg.x;
            const dy = py - sg.y;
            const d = hypot(dx, dy) || 1;
            const want = 20;
            sg.x += dx / d * (d - want) * Math.min(1, dt * 14);
            sg.y += dy / d * (d - want) * Math.min(1, dt * 14);
            sg.y = lerp(sg.y, GY + Math.sin(e.t * 4 - s * 0.7) * 8, 0.12);
            px = sg.x;
            py = sg.y;
          }
        }
      } else if (e.type === 'jet') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 5 + e.phase) * 42 * dt;
      } else if (e.type === 'dive') {
        e.x += e.vx * dt;
        if (e.t < 1.1) e.y += 90 * dt;
        else e.y -= 40 * dt;
        e.x -= 30 * dt;
      } else if (e.type === 'worm') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 8 + e.phase) * 110 * dt;
        const dx = (G.cam + G.px) - e.x;
        const dy = G.py - e.y;
        const d = hypot(dx, dy) || 1;
        e.x += (dx / d) * 18 * dt;
        e.y += (dy / d) * 22 * dt;
      } else if (e.type === 'heli') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 2.4 + e.phase) * 28 * dt;
      } else {
        e.x += e.vx * dt;
      }

      const esx = e.x - G.cam;
      if (esx < -80 || e.y < -40 || e.y > VH + 40) {
        e.alive = false;
        continue;
      }

      e.shotT -= dt;
      if (e.shotT <= 0 && esx > 40 && esx < VW - 10) {
        e.shotT = e.shotCd * (0.85 + Math.random() * 0.3);
        const spd = (isRain() ? 168 : 132) + G.stage * 8;
        if (e.type === 'tank' || e.type === 'aa' || e.type === 'turret') {
          aimShot(esx, e.y - 10, spd, rand(-0.08, 0.08), false);
          if (isRain() && Math.random() < 0.45) aimShot(esx, e.y - 10, spd * 0.9, rand(-0.18, 0.18), false);
        } else if (e.type === 'launcher') {
          aimShot(esx, e.y - 14, spd * 0.75, 0, true);
        } else if (e.type === 'heli') {
          aimShot(esx, e.y, spd * 0.85, rand(-0.1, 0.1), false);
        } else if (e.type === 'jet' && Math.random() < 0.55) {
          enemyShot(esx, e.y, -spd, 0, false);
        } else if (e.type === 'mid') {
          fanShot(esx - 10, e.y - 16, isRain() ? 5 : 3, spd, 0.18);
        } else if (e.type === 'boss') {
          const st = stageInfo();
          if (st.biome === 'fort') {
            fanShot(esx, e.y - 18, isRain() ? 5 : 4, spd, 0.16);
            if (e.hp < e.maxHp * 0.5) {
              ringShot(esx, e.y - 20, isRain() ? 12 : 8, spd * 0.7, e.t);
              if (countType('worm') < 5) spawnWorms(1);
            } else if (Math.random() < 0.35 && countType('worm') < 4) {
              spawnWorms(1);
            }
          } else if (st.biome === 'night') {
            fanShot(esx - 8, e.y - 16, 5, spd, 0.14);
            if (e.hp < e.maxHp * 0.5) ringShot(esx, e.y - 18, 10, spd * 0.72, e.t * 1.3);
          } else {
            fanShot(esx - 6, e.y - 14, isRain() ? 4 : 3, spd, 0.2);
            if (e.hp < e.maxHp * 0.5) aimShot(esx, e.y - 16, spd * 0.9, 0, true);
          }
        }
      }

      if (!e.ground && G.deadT <= 0 && G.invuln <= 0) {
        if (Math.abs(esx - G.px) < e.w * 0.38 + 12 && Math.abs(e.y - G.py) < e.h * 0.4 + 8) {
          diePlayer('crash');
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 30 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        if (s.kind === 'jeep' && !e.ground) continue;
        const ex = e.x - G.cam;
        if (Math.abs(s.x - ex) < e.w * 0.45 + s.r && Math.abs(s.y - e.y) < e.h * 0.45 + s.r) {
          hurtEnt(e, s.dmg, s.x, s.y, false);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      b.vy += 460 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      let boom = b.y >= ROAD + 8 || b.life <= 0;
      if (!boom) {
        for (let k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (!e.alive || !e.ground) continue;
          const ex = e.x - G.cam;
          if (Math.abs(b.x - ex) < e.w * 0.45 + 8 && Math.abs(b.y - e.y) < e.h * 0.5 + 8) {
            boom = true;
            break;
          }
        }
      }
      if (boom) {
        bombExplode(b);
        G.bombs.splice(i, 1);
      }
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < -20 || s.x > VW + 30 || s.y < -20 || s.y > VH + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.jeep.alive && Math.abs(s.x - G.jeep.x) < 16 + s.r && Math.abs(s.y - G.jeep.y) < 10 + s.r && s.y > ROAD - 24) {
        hurtJeep(s.fat ? 2 : 1);
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && G.invuln <= 0) {
        if (Math.abs(s.x - G.px) < 12 + s.r && Math.abs(s.y - G.py) < 8 + s.r) {
          diePlayer('shot');
          G.eShots.splice(i, 1);
        }
      }
    }
  }

  function updatePick(dt) {
    for (let i = G.pick.length - 1; i >= 0; i--) {
      const p = G.pick[i];
      p.t += dt;
      p.life -= dt;
      p.x += p.vx * dt;
      const psx = p.x - G.cam;
      const psy = p.y + Math.sin(p.t * 6) * 7;
      if (p.life <= 0 || psx < -40) {
        G.pick.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && Math.abs(psx - G.px) < 22 && Math.abs(psy - G.py) < 20) {
        collectPick(p);
        G.pick.splice(i, 1);
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.2;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.4;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 0.18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'title') {
      G.cam += 46 * dt;
      G.rotorAng += dt * (REDUCE ? 4 : 28);
      return;
    }
    if (G.stop > 0) {
      G.stop -= dt;
      G.rotorAng += dt * (REDUCE ? 4 : 18);
      updateFx(dt * 0.35);
      return;
    }
    G.rotorAng += dt * (REDUCE ? 6 : 28);
    G.rotorT -= dt;
    if (G.mode === 'play' && G.deadT <= 0 && G.rotorT <= 0) {
      G.rotorT = 0.086;
      audio.rotor();
    }
    G.jeepT -= dt;
    if (G.mode === 'play' && G.jeep.alive && G.jeepT <= 0) {
      G.jeepT = 0.14;
      audio.jeepHum();
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.cam += 20 * dt;
      updateEnts(dt);
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnts(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.bombCd = Math.max(0, G.bombCd - dt);
    G.cam += scrollSpd() * dt;
    maybeSpawn();
    updatePlayer(dt);
    updateJeep(dt);
    if (G.fireHold) fireGuns();
    if (G.bombHold || keys.bmb) dropBombs();
    updateEnts(dt);
    updateShots(dt);
    updatePick(dt);
    updateFx(dt);

    if (G.stageClearT > 0) {
      G.stageClearT -= dt;
      if (G.stageClearT <= 0) {
        if (G.stage >= 3) winGame();
        else nextStage();
      }
    }
    if (bmbBar) bmbBar.style.transform = 'scaleX(' + bombReady() + ')';
    if (bmbWrap) bmbWrap.classList.toggle('hot', G.bombCd <= 0);
    if (G.clock % 8 === 0) syncHud();
    G.clock += 1;
  }

  function drawSky() {
    const bio = biome();
    let c0;
    let c1;
    if (bio === 'night') {
      c0 = '#06080c';
      c1 = '#12181a';
    } else if (bio === 'fort') {
      c0 = '#0c1008';
      c1 = '#1a2210';
    } else {
      c0 = '#101806';
      c1 = '#2a3418';
    }
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(ROAD));
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, ROAD * scale);

    if (bio === 'night') {
      for (let i = 0; i < 28; i++) {
        const hx = hash2(i * 19 + 3);
        const hy = hash2(i * 31 + 7);
        ctx.fillStyle = rgba(WHT, 0.35 + hx * 0.4);
        ctx.fillRect(sx(hx * VW), sy(20 + hy * 160), 1.4 * scale, 1.4 * scale);
      }
    }

    const gap = 220;
    const start = Math.floor(G.cam / gap) - 1;
    for (let i = start; i < start + 8; i++) {
      const wx = i * gap;
      const x = wx - G.cam;
      const h = 40 + hash2(i * 17) * 70;
      ctx.fillStyle = bio === 'night' ? 'rgba(18,28,32,0.9)' : bio === 'fort' ? 'rgba(32,42,22,0.92)' : 'rgba(48,62,28,0.9)';
      ctx.beginPath();
      ctx.moveTo(sx(x - 40), sy(ROAD));
      ctx.lineTo(sx(x + 40 + hash2(i) * 80), sy(ROAD - h));
      ctx.lineTo(sx(x + 180), sy(ROAD));
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawGround() {
    const bio = biome();
    ctx.fillStyle = bio === 'night' ? '#14181c' : bio === 'fort' ? '#1a2012' : '#2a2818';
    ctx.fillRect(sx(0), sy(ROAD - 8), VW * scale, 14 * scale);

    ctx.fillStyle = rgba(ASPH, 1);
    ctx.fillRect(sx(0), sy(ROAD), VW * scale, (VH - ROAD) * scale);

    ctx.fillStyle = bio === 'night' ? 'rgba(80, 90, 70, 0.5)' : 'rgba(90, 110, 48, 0.55)';
    ctx.fillRect(sx(0), sy(ROAD), VW * scale, 4 * scale);

    ctx.strokeStyle = rgba(LIME, bio === 'night' ? 0.55 : 0.38);
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([18 * scale, 16 * scale]);
    ctx.lineDashOffset = -((G.cam * scale) % (34 * scale));
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(ROAD + 28));
    ctx.lineTo(sx(VW), sy(ROAD + 28));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = rgba(GOLD, 0.18);
    ctx.fillRect(sx(0), sy(ROAD + 56), VW * scale, 3 * scale);

    const poleGap = 160;
    const p0 = Math.floor(G.cam / poleGap) - 1;
    for (let i = p0; i < p0 + 9; i++) {
      const x = i * poleGap - G.cam;
      if (x < -20 || x > VW + 20) continue;
      ctx.fillStyle = rgba(STEEL, 0.7);
      ctx.fillRect(sx(x), sy(ROAD - 52), 3 * scale, 52 * scale);
      ctx.fillStyle = bio === 'night' ? rgba(ORG, 0.85) : rgba(SAND, 0.5);
      ctx.fillRect(sx(x - 8), sy(ROAD - 56), 20 * scale, 4 * scale);
      if (bio === 'night') {
        ctx.fillStyle = rgba(GOLD, 0.22);
        ctx.beginPath();
        ctx.arc(sx(x + 1), sy(ROAD - 48), 10 * scale, 0, TAU);
        ctx.fill();
      }
      if (bio === 'sand' && hash2(i * 9) > 0.55) {
        ctx.fillStyle = rgba(OLIVE, 0.8);
        ctx.beginPath();
        ctx.moveTo(sx(x + 22), sy(ROAD));
        ctx.lineTo(sx(x + 26), sy(ROAD - 22));
        ctx.lineTo(sx(x + 30), sy(ROAD));
        ctx.fill();
      }
    }
  }

  function drawHeli(x, y, enemy, flashHit, alpha) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(enemy ? 0 : (G.bank || 0));
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    const body = enemy ? CHART : LIME;
    const flash = flashHit || (!enemy && G.muzzle > 0);
    ctx.shadowColor = rgba(body, 0.55);
    ctx.shadowBlur = 12;
    const ra = enemy ? (G.t * 22) : G.rotorAng;
    ctx.strokeStyle = rgba(WHT, REDUCE ? 0.22 : 0.32);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(2, -11, 18, 3.6, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(body, 0.9);
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(2 + Math.cos(ra) * 17, -11 + Math.sin(ra) * 2.8);
    ctx.lineTo(2 + Math.cos(ra + Math.PI) * 17, -11 + Math.sin(ra + Math.PI) * 2.8);
    ctx.moveTo(2 + Math.cos(ra + 1.57) * 17, -11 + Math.sin(ra + 1.57) * 2.8);
    ctx.lineTo(2 + Math.cos(ra + 4.71) * 17, -11 + Math.sin(ra + 4.71) * 2.8);
    ctx.stroke();

    ctx.fillStyle = flash ? '#f6ffe8' : rgba(body, 0.96);
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-8, -5);
    ctx.lineTo(10, -6);
    ctx.lineTo(20, -2);
    ctx.lineTo(22, 2);
    ctx.lineTo(10, 6);
    ctx.lineTo(-6, 6);
    ctx.lineTo(-20, 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(WHT, 0.72);
    ctx.beginPath();
    ctx.ellipse(10, -1, 6, 3.4, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(STEEL, 0.9);
    ctx.fillRect(-22, -2, 14, 3);
    ctx.beginPath();
    ctx.ellipse(-24, -1, 3.2, 3.2, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-24, -4);
    ctx.lineTo(-24, 2);
    ctx.stroke();

    ctx.strokeStyle = rgba(STEEL, 0.85);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-8, 6);
    ctx.lineTo(-12, 12);
    ctx.lineTo(12, 12);
    ctx.lineTo(8, 6);
    ctx.stroke();

    if (!enemy && G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(22, -2);
      ctx.lineTo(34, 0);
      ctx.lineTo(22, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawJeep(x, y, flash) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 16, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
    ctx.shadowColor = rgba(GOLD, 0.45);
    ctx.shadowBlur = 8;
    ctx.fillRect(-16, -8, 30, 12);
    ctx.fillRect(-6, -14, 12, 8);
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.fillRect(-4, -12, 8, 5);
    ctx.fillStyle = flash ? '#fff' : rgba(LIME, 0.9);
    ctx.fillRect(10, -12, 8, 3);
    ctx.fillStyle = '#101008';
    ctx.beginPath();
    ctx.arc(-10, 6, 4, 0, TAU);
    ctx.arc(10, 6, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(STEEL, 0.8);
    ctx.beginPath();
    ctx.arc(-10, 6, 1.6, 0, TAU);
    ctx.arc(10, 6, 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnt(e) {
    const flash = e.flash > 0;
    const esx = e.x - G.cam;
    if (e.type === 'heli') {
      drawHeli(esx, e.y, true, flash, 1);
      return;
    }
    ctx.save();
    ctx.translate(sx(esx), sy(e.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(e.rgb, 0.95);
    ctx.shadowColor = rgba(e.rgb, 0.5);
    ctx.shadowBlur = 10;
    if (e.ground) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(1, 10, e.w * 0.42, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(e.rgb, 0.95);
      ctx.shadowBlur = 10;
    }
    if (e.type === 'jet' || e.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-6, -8);
      ctx.lineTo(-10, -2);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 2);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'worm') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.8);
      ctx.beginPath();
      ctx.ellipse(-6, 0, 6, 4, 0, 0, TAU);
      ctx.fill();
    } else if (e.type === 'truck') {
      ctx.fillRect(-18, -8, 14, 12);
      ctx.fillRect(-4, -12, 22, 16);
      ctx.fillStyle = '#101008';
      ctx.beginPath();
      ctx.arc(-10, 6, 3.4, 0, TAU);
      ctx.arc(10, 6, 3.4, 0, TAU);
      ctx.fill();
    } else if (e.type === 'tank') {
      ctx.fillRect(-18, -6, 36, 14);
      ctx.fillRect(-12, -12, 18, 8);
      const dx = G.px - esx;
      const dy = G.py - e.y;
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.85);
      ctx.save();
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillRect(4, -1.6, 14, 3.2);
      ctx.restore();
    } else if (e.type === 'aa') {
      ctx.fillRect(-14, -6, 28, 12);
      ctx.fillRect(-4, -14, 8, 10);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(0, -16, 12, 3);
    } else if (e.type === 'launcher') {
      ctx.fillRect(-20, -6, 40, 14);
      ctx.fillRect(-8, -16, 10, 12);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(4, -14, 16, 5);
    } else if (e.type === 'turret') {
      ctx.fillStyle = 'rgba(28, 34, 18, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(e.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, TAU);
      ctx.fill();
      ctx.rotate(Math.atan2(G.py - e.y, G.px - esx));
      ctx.fillRect(4, -2.1, 14, 4.2);
    } else if (e.type === 'carrier') {
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-4, -8);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#101806';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(e.drop === 'J' ? 'J' : 'P', 0, 0);
    } else if (e.type === 'mid') {
      ctx.fillRect(-32, -10, 64, 22);
      ctx.fillRect(-20, -18, 24, 10);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-4, -22, 18, 6);
      ctx.fillStyle = '#101008';
      ctx.beginPath();
      ctx.arc(-18, 10, 5, 0, TAU);
      ctx.arc(8, 10, 5, 0, TAU);
      ctx.arc(22, 10, 5, 0, TAU);
      ctx.fill();
    } else if (e.type === 'boss') {
      if (e.segs) {
        ctx.restore();
        for (let s = e.segs.length - 1; s >= 0; s--) {
          const sg = e.segs[s];
          ctx.save();
          ctx.translate(sx(sg.x - G.cam), sy(sg.y));
          ctx.scale(scale, scale);
          ctx.fillStyle = flash ? '#fff' : rgba(LIME, 0.85 - s * 0.08);
          ctx.shadowColor = rgba(LIME, 0.4);
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.ellipse(0, 0, 14 - s * 0.6, 10 - s * 0.4, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ctx.save();
        ctx.translate(sx(esx), sy(e.y));
        ctx.scale(scale, scale);
        ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
        ctx.shadowColor = rgba(GOLD, 0.5);
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(4, 0, 22, 14, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(MAG, 0.85);
        ctx.beginPath();
        ctx.arc(18, -4, 3, 0, TAU);
        ctx.arc(18, 4, 3, 0, TAU);
        ctx.fill();
        ctx.restore();
        return;
      }
      ctx.fillRect(-38, -12, 76, 26);
      ctx.fillRect(-16, -22, 36, 14);
      ctx.fillStyle = rgba(GOLD, 0.75);
      ctx.fillRect(8, -18, 28, 8);
      ctx.fillStyle = '#101008';
      ctx.beginPath();
      ctx.arc(-24, 12, 6, 0, TAU);
      ctx.arc(0, 12, 6, 0, TAU);
      ctx.arc(24, 12, 6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.7);
      ctx.shadowBlur = 8;
      if (!REDUCE) {
        ctx.fillRect(sx(s.x - 7), sy(s.y - 1.2), 10 * scale, 2.4 * scale);
      }
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.shadowColor = rgba(ORG, 0.7);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(sx(b.x), sy(b.y), 4.4 * scale, 3.2 * scale, 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.8);
      ctx.fillRect(sx(b.x - 1), sy(b.y - 6), 2 * scale, 5 * scale);
    }
    ctx.shadowBlur = 0;
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = rgba(s.fat ? ORG : MAG, 0.95);
      ctx.shadowColor = rgba(MAG, 0.6);
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawPicks() {
    for (let i = 0; i < G.pick.length; i++) {
      const p = G.pick[i];
      const x = p.x - G.cam;
      const y = p.y + Math.sin(p.t * 6) * 7;
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.scale(scale, scale);
      ctx.rotate(p.t * 2);
      ctx.fillStyle = p.kind === 'J' ? rgba(GOLD, 0.95) : rgba(LIME, 0.95);
      ctx.shadowColor = p.kind === 'J' ? rgba(GOLD, 0.6) : rgba(LIME, 0.6);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#101806';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(p.kind, 0, 0.5);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.6, p.r * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = 3 * (1 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = rgba(f.rgb, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0 && G.ents[i].alive) {
        boss = G.ents[i];
        if (t === 'boss') break;
      }
    }
    if (!boss) return;
    const x = 40;
    const y = 16;
    const w = VW - 80;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : LIME, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : LIME, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.font = 'bold ' + (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name || '', sx(VW * 0.5), sy(y - 6));
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a1206';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (!REDUCE && G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = W * 0.5;
      const cy = H * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawSky();
    drawGround();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    if (G.jeep.alive && G.mode !== 'title') {
      const blink = G.jeep.flash > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawJeep(G.jeep.x, G.jeep.y, G.jeep.flash > 0);
    } else if (G.mode === 'title') {
      drawJeep(96, GY, false);
    }
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPicks();
    drawParticles();
    drawFloats();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawHeli(G.px, G.py, false, false, G.mode === 'title' ? 0.95 : 1);
    }

    drawBossBar();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.5);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - ox) / scale,
      y: (e.clientY - rect.top - oy) / scale
    };
  }

  function setBombHeld(on) {
    G.bombHold = !!on;
    keys.bmb = !!on;
    if (btnBomb) btnBomb.classList.toggle('held', !!on);
    if (btnPadBomb) btnPadBomb.classList.toggle('held', !!on);
  }

  function startGame(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'guard';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.stage = 1;
    G.cam = 0;
    G.spawnI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.powLv = 0;
    G.px = 110;
    G.py = 180;
    G.pvx = 0;
    G.pvy = 0;
    G.bank = 0;
    G.fireCd = 0;
    G.bombCd = 0;
    G.fireHold = false;
    G.bombHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.dropI = 0;
    G.rotorT = 0;
    G.why = '';
    G.mid = false;
    G.boss = false;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    restoreJeep();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRain() ? '弹雨 · 车队更密' : '护路 · 第 1 关', false, !isRain());
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'guard';
    G.stage = 1;
    G.lives = LIVES;
    G.powLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.px = 110;
    G.py = 180;
    G.cam = 0;
    clearField();
    G.jeep.alive = true;
    G.jeep.x = 96;
    G.jeep.y = GY;
    showOverlay(
      'title',
      '蚕战',
      '侧视直升机打公路车队。机枪清空，炸弹砸卡车坦克。吉普可上路助攻。撞地、撞机、中弹都扣命。别当成救升或飞鲨——这是侧视护路，不是救人，也不是纵向扫海。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('guard');
    else startGame(G.kind || 'guard');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('guard');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('rain');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isRain()) goTitle();
      else startGame('rain');
    }
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const bomb = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }

    if (down && (isMove || space || bomb || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (bomb) setBombHeld(false);
      return;
    }
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '2') {
      if (overlayOpen()) secondaryAction();
      return;
    }
    if (bomb) {
      setBombHeld(true);
      if (G.mode === 'play' && !overlayOpen()) dropBombs();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play') G.fireHold = true;
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fireGuns();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fireGuns();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) G.fireHold = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  }

  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      e.stopPropagation();
      setBombHeld(true);
      if (G.mode === 'play') dropBombs();
    });
    function up(e) {
      e.preventDefault();
      setBombHeld(false);
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', function () { setBombHeld(false); });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now * 0.001;
      return;
    }
    const t = now * 0.001;
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindBombBtn(btnBomb);
  bindBombBtn(btnPadBomb);

  if (btnGuard) {
    btnGuard.addEventListener('click', function () {
      audio.ensure();
      startGame('guard');
    });
  }
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
    });
  }
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
      audio.ensure();
      secondaryAction();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.u = false;
      keys.d = false;
      G.fireHold = false;
      setBombHeld(false);
    }
  });

  requestAnimationFrame(frame);
})();
