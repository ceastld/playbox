'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const HP_MAX = 2;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 226;
  const AIR = 0.9;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 560;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const MELEE = 44;
  const ATK_CD = 0.2;
  const SLASH_T = 0.18;
  const INVULN = 1.35;
  const DIE_T = 0.8;
  const BEST_KEY = 'playbox-green-raid-best';
  const MUTE_KEY = 'playbox-green-raid-mute';
  const OPS = '方向键 / WASD 走跳 · Z 近刺远射 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [61, 255, 122];
  const HOT2 = [138, 255, 176];
  const WHT = [246, 243, 239];
  const LEAF = [40, 168, 90];
  const ORG = [255, 168, 64];
  const RED = [255, 72, 72];
  const BRN = [196, 92, 64];
  const SKIN = [232, 192, 144];

  const WEP_NAME = { knife: '匕首', gun: '步枪', rocket: '火箭' };
  const WEAPONS = {
    gun: { cd: 0.15, max: 4, spd: 560, dmg: 1, blast: 0, life: 0.7, ammo: 8, rgb: CYN },
    rocket: { cd: 0.34, max: 2, spd: 340, dmg: 3, blast: 52, life: 1.05, ammo: 3, rgb: GOLD }
  };

  const SCORE = {
    grunt: 100, flank: 150, dog: 150, mortar: 200,
    tower: 250, runner: 120, officer: 300, boss: 5000, stage: 1800
  };

  const STAGES = [
    {
      name: '哨所', boss: '', w: 2100, hp: 0, theme: 'camp',
      ground: [[0, 540], [600, 500], [1180, 440], [1700, 400]],
      plats: [
        [160, MY, 150], [420, MY, 170], [860, MY, 160],
        [1320, MY, 180], [1760, MY, 150],
        [480, HY, 120], [980, HY, 140], [1480, HY, 130]
      ],
      ents: [
        [300, GY, 'grunt', 40, 520],
        [460, GY, 'grunt', 80, 540],
        [500, MY, 'mortar', 420, 590],
        [780, GY, 'tower', 0, 0],
        [920, GY, 'runner', 700, 1100],
        [940, MY, 'grunt', 860, 1020],
        [1280, GY, 'flank', 1180, 1600],
        [1400, GY, 'dog', 1200, 1620],
        [1400, MY, 'mortar', 1320, 1500],
        [1780, GY, 'grunt', 1700, 2050],
        [1860, GY, 'officer', 1720, 2060]
      ],
      drops: [[980, MY, 'gun']]
    },
    {
      name: '港口', boss: '', w: 2360, hp: 0, theme: 'port',
      ground: [[0, 480], [560, 360], [1020, 400], [1520, 340], [1960, 400]],
      plats: [
        [120, MY, 140], [380, MY, 150], [720, MY, 170],
        [1140, MY, 160], [1580, MY, 180], [2000, MY, 150],
        [300, HY, 120], [820, HY, 140], [1360, HY, 150], [1880, HY, 140]
      ],
      ents: [
        [240, GY, 'grunt', 20, 460],
        [400, MY, 'mortar', 380, 530],
        [640, GY, 'tower', 0, 0],
        [780, GY, 'runner', 580, 900],
        [880, MY, 'flank', 720, 890],
        [1080, GY, 'dog', 1020, 1400],
        [1200, GY, 'grunt', 1040, 1400],
        [1420, HY, 'mortar', 1360, 1510],
        [1480, GY, 'tower', 0, 0],
        [1640, MY, 'grunt', 1580, 1760],
        [1760, GY, 'runner', 1540, 1880],
        [1980, GY, 'flank', 1960, 2300],
        [2100, MY, 'officer', 2000, 2150],
        [2180, GY, 'dog', 1980, 2320]
      ],
      drops: [[820, HY, 'rocket'], [1680, MY, 'gun']]
    },
    {
      name: '铁桥', boss: '', w: 2580, hp: 0, theme: 'bridge',
      ground: [[0, 420], [500, 300], [920, 360], [1400, 320], [1820, 340], [2260, 320]],
      plats: [
        [80, MY, 130], [320, MY, 150], [640, MY, 160],
        [980, MY, 150], [1320, MY, 180], [1720, MY, 160],
        [2080, MY, 170], [2400, MY, 140],
        [360, HY, 120], [880, HY, 140], [1480, HY, 150], [2140, HY, 140]
      ],
      ents: [
        [220, GY, 'grunt', 20, 400],
        [360, MY, 'mortar', 320, 470],
        [560, GY, 'tower', 0, 0],
        [700, GY, 'runner', 520, 800],
        [940, HY, 'flank', 880, 1020],
        [1040, GY, 'dog', 940, 1240],
        [1060, MY, 'grunt', 980, 1130],
        [1500, GY, 'mortar', 1400, 1640],
        [1500, HY, 'tower', 0, 0],
        [1680, GY, 'runner', 1400, 1760],
        [1860, GY, 'flank', 1800, 2100],
        [1800, MY, 'dog', 1720, 1880],
        [2140, GY, 'officer', 1820, 2120],
        [2280, GY, 'grunt', 2240, 2540],
        [2160, MY, 'mortar', 2080, 2250],
        [2480, GY, 'runner', 2260, 2540]
      ],
      drops: [[1000, MY, 'gun'], [1760, MY, 'rocket']]
    },
    {
      name: '监狱', boss: '狱长', w: 2800, hp: 20, theme: 'prison',
      ground: [[0, 440], [520, 360], [980, 400], [1480, 360], [1920, 420], [2420, 380]],
      plats: [
        [100, MY, 140], [360, MY, 150], [700, MY, 160],
        [1060, MY, 150], [1420, MY, 180], [1840, MY, 160],
        [2200, MY, 180], [2520, MY, 150],
        [280, HY, 120], [780, HY, 140], [1540, HY, 150], [2260, HY, 160]
      ],
      ents: [
        [240, GY, 'grunt', 20, 420],
        [380, MY, 'officer', 360, 510],
        [600, GY, 'tower', 0, 0],
        [760, GY, 'runner', 540, 880],
        [880, HY, 'mortar', 780, 920],
        [1100, GY, 'flank', 1000, 1340],
        [1220, GY, 'dog', 1000, 1460],
        [1480, MY, 'officer', 1420, 1600],
        [1580, GY, 'tower', 0, 0],
        [1720, GY, 'grunt', 1500, 1780],
        [1880, MY, 'flank', 1840, 2000],
        [2040, GY, 'runner', 1960, 2280],
        [2160, GY, 'dog', 1960, 2400],
        [2320, HY, 'mortar', 2260, 2420],
        [2560, GY, 'officer', 2440, 2720],
        [2580, MY, 'flank', 2520, 2670]
      ],
      drops: [[1100, MY, 'gun'], [1880, MY, 'rocket']]
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function spdMul(night, stage) {
    return (night ? 1.32 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function flankWait(night, stage) {
    return night ? Math.max(1.15, 1.7 - stage * 0.12) : Math.max(3.6, 5.4 - stage * 0.35);
  }

  function selfCheck() {
    if (STAGES.length !== 4) throw new Error('4 camps');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX !== 2) throw new Error('hp pips');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('night faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (MELEE < 36) throw new Error('melee range');
    if (STAGES[0].w >= STAGES[1].w || STAGES[2].w >= STAGES[3].w) throw new Error('wider later');
    if (STAGES[3].boss !== '狱长' || STAGES[3].hp < 16) throw new Error('prison boss');
    if (BEST_KEY !== 'playbox-green-raid-best') throw new Error('best key');
    if (flankWait(true, 1) >= flankWait(false, 1)) throw new Error('night more flanking');
    if (!WEAPONS.gun.ammo || !WEAPONS.rocket.ammo) throw new Error('limited shots');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length) throw new Error('ground');
      if (!s.drops || !s.drops.length) throw new Error('drops');
    }
  }

  selfCheck();

  if (typeof document === 'undefined') return;

  const REDUCE = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

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
  const btnBreak = document.getElementById('btn-break');
  const btnNight = document.getElementById('btn-night');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeBreak = document.getElementById('mode-break');
  const modeNight = document.getElementById('mode-night');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wepLabel = document.getElementById('wep-label');
  const hpLabel = document.getElementById('hp-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');

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
  let chainTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const demo = { l: false, r: true, u: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const rain = [];

  const G = {
    mode: 'title',
    kind: 'break',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2100,
    theme: 'camp',
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_MAX,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    wep: 'knife',
    ammo: 0,
    checkX: 70,
    checkY: GY,
    atkCd: 0,
    slashT: 0,
    slashHit: 0,
    muzzle: 0,
    jumpBuf: 0,
    dropT: 0,
    dropPlat: null,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    lock: 0,
    why: '',
    gate: 1980,
    rainT: 0,
    flankT: 2.4,
    search: 0
  };

  function isNight() {
    return G.kind === 'night';
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'play' || G.mode === 'title';
  }
  function inL() {
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    return G.mode === 'play' && keys.d;
  }

  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
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
    hop() {
      this.ensure();
      this.beep(280, 0.06, 'square', 0.045, 620);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.028, 500);
      this.beep(140, 0.05, 'triangle', 0.025, 80);
    },
    knife() {
      this.ensure();
      this.noise(0.05, 0.042, 1600);
      this.beep(480, 0.08, 'sawtooth', 0.05, 160);
    },
    stab(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.04, 900);
      this.beep(560 * lift, 0.08, 'square', 0.048, 920 * lift);
    },
    bark() {
      this.ensure();
      this.noise(0.055, 0.07, 400);
      this.beep(220, 0.09, 'square', 0.055, 70);
      this.beep(90, 0.07, 'sawtooth', 0.03, 50);
    },
    boom() {
      this.ensure();
      this.noise(0.18, 0.08, 180);
      this.beep(140, 0.22, 'sawtooth', 0.06, 48);
      this.beep(70, 0.28, 'sine', 0.04, 36);
    },
    ping(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.05);
      this.beep(1180 * lift, 0.07, 'triangle', 0.05, 1760 * lift);
    },
    pickup() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.042, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1046);
    },
    hurt() {
      this.ensure();
      this.noise(0.08, 0.04, 500);
      this.beep(240, 0.12, 'sawtooth', 0.04, 90);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.045, 42);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 90);
      this.beep(110, 0.3, 'square', 0.04, 64);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.18, 'sawtooth', 0.04, 80);
      this.beep(120, 0.3, 'sine', 0.05, 44);
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
    },
    empty() {
      this.ensure();
      this.beep(160, 0.08, 'square', 0.03, 90);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
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
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (!playing() || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
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
    G.toastT = 1.35;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1350);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
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
    while (pips.length > n) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }

  function syncModes() {
    const night = isNight();
    if (modeBreak) modeBreak.setAttribute('aria-pressed', night ? 'false' : 'true');
    if (modeNight) modeNight.setAttribute('aria-pressed', night ? 'true' : 'false');
  }

  function wepText() {
    if (G.wep === 'knife' || G.ammo <= 0) return '匕首';
    return WEP_NAME[G.wep] + ' ' + G.ammo;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = isNight() ? '夜袭 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 4 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isNight() ? '夜袭' : '突围';
      tagLabel.classList.toggle('warn', isNight());
      tagLabel.classList.toggle('hot', !isNight() && G.stage >= 4);
    }
    if (wepLabel) {
      wepLabel.textContent = wepText();
      wepLabel.classList.toggle('gun', G.wep === 'gun' && G.ammo > 0);
      wepLabel.classList.toggle('rocket', G.wep === 'rocket' && G.ammo > 0);
    }
    if (hpLabel) {
      hpLabel.textContent = '体 ' + G.hp;
      hpLabel.classList.toggle('low', G.hp <= 1 && G.mode === 'play');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 背后偷袭、中弹、坠河都丢命', 'warn');
    else if (G.mode === 'win') setHint('监狱已破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 正面用刀 · 背后即死', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('狱长 · 近刺远射 · 火箭能削血', 'hot');
    else setHint('走跳 · Z 近刺远射 · 背后偷袭丢命', '');
    syncPips();
    syncModes();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind === 'win' || kind === 'lose');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) {
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RAID';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '夜袭' : '换模式';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump');
      }
    }, 380);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
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
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 280);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 40);
    capArr(rings, 24);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? 90 : 72
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -200 * p, vx1: 200 * p, vy0: -280 * p, vy1: -20 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.8 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.14 + p * 0.1);
    kick(2.1 + p * 2.4);
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
      if (tok === chainTok && chainPop) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) audio.combo(G.mult);
    syncHud();
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = kind === 'tower' || kind === 'officer' ? 2 : 1;
    const h = kind === 'dog' ? 14 : kind === 'tower' ? 28 : 24;
    const w = kind === 'tower' ? 18 : kind === 'dog' ? 16 : 14;
    return {
      x: x, y: y, vx: 0, vy: 0, face: kind === 'flank' ? -1 : 1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, t: rand(0, 1),
      fire: rand(0.5, 1.4),
      grounded: true, dead: false,
      hitN: 0, w: w, h: h
    };
  }

  function makeBoss(spec) {
    if (!spec.boss) return null;
    const hp = spec.hp + (isNight() ? 4 : 0);
    return {
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: 'boss',
      t: 0, fire: 1.0, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 22, h: 34, name: spec.boss
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.theme = spec.theme;
    G.plats = [];
    let i, g, p;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2], false));
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isNight() && !attract) {
      const extra = spec.ents.filter(function (e, idx) { return idx % 2 === 0; });
      for (i = 0; i < extra.length; i++) {
        const e = extra[i];
        const nx = e[0] - 70;
        if (nx < 40) continue;
        if (!platUnder(nx, e[1], null)) continue;
        G.ents.push(makeEnt(nx, e[1], e[2] === 'tower' ? 'flank' : (e[2] === 'mortar' ? 'dog' : 'flank'), e[3], e[4]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0], y: d[1] - 18, kind: d[2], taken: false });
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.gate = spec.w - 90;
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.slashT = 0;
    G.slashHit = 0;
    G.atkCd = 0;
    G.muzzle = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.4;
    G.clearT = 0;
    G.lock = 0;
    G.dropT = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    G.flankT = isNight() ? 1.4 : 3.8;
    if (!attract) {
      G.wep = 'knife';
      G.ammo = 0;
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    }
    syncHud();
  }

  function platUnder(x, fy, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (fy >= p.y - 3 && fy <= p.y + 8) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function landOn(x, y0, y1, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 4 || x > p.x + p.w - 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    return !!platUnder(x, y, null);
  }

  function pitAhead(x, y, face) {
    return standAt(x, y) && !standAt(x + face * 34, y);
  }

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.45, y: p.y - p.h, w: p.w * 0.9, h: p.h * 0.92 };
  }

  function slashBox() {
    const p = G.player;
    const x0 = p.face > 0 ? p.x : p.x - MELEE;
    return { x: x0, y: p.y - 30, w: MELEE, h: 32 };
  }

  function inSlash(ex, ey, ew, eh) {
    const s = slashBox();
    return overlap(s.x, s.y, s.w, s.h, ex - ew * 0.5, ey - eh, ew, eh);
  }

  function meleeEnemy() {
    const p = G.player;
    let i, e, dx, best = null, bd = 99;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      dx = (e.x - p.x) * p.face;
      if (dx > 4 && dx < MELEE + 6 && Math.abs(e.y - p.y) < 26) {
        if (dx < bd) { bd = dx; best = e; }
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      e = G.boss;
      dx = (e.x - p.x) * p.face;
      if (dx > 4 && dx < MELEE + 10 && Math.abs(e.y - p.y) < 30) {
        if (dx < bd) best = e;
      }
    }
    return best;
  }

  function countShots(from, kind) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === from && (!kind || G.shots[i].kind === kind) && G.shots[i].life > 0) n++;
    }
    return n;
  }

  function doKnife() {
    const p = G.player;
    G.slashT = SLASH_T;
    G.slashHit += 1;
    G.atkCd = 0.22;
    p.pose = 0.18;
    audio.knife();
    emit(6, {
      x: p.x + p.face * 22, y: p.y - 16, j: 8,
      vx0: p.face * 40, vx1: p.face * 220, vy0: -160, vy1: 40,
      life: 0.22, r0: 1, r1: 2.4, rgb: GOLD
    });
    hitStop(0.032);
  }

  function fireWep() {
    const spec = WEAPONS[G.wep];
    if (!spec || G.ammo <= 0) {
      doKnife();
      return;
    }
    if (countShots('p', G.wep) >= spec.max) {
      audio.empty();
      return;
    }
    const p = G.player;
    G.ammo -= 1;
    G.atkCd = spec.cd;
    G.muzzle = 0.08;
    p.pose = 0.12;
    G.shots.push({
      x: p.x + p.face * 16,
      y: p.y - 16,
      vx: p.face * spec.spd,
      vy: 0,
      g: 0,
      from: 'p',
      kind: G.wep,
      life: spec.life,
      dmg: spec.dmg,
      blast: spec.blast,
      rgb: spec.rgb,
      face: p.face
    });
    emit(5, {
      x: p.x + p.face * 18, y: p.y - 16, j: 3,
      vx0: p.face * 80, vx1: p.face * 240, vy0: -50, vy1: 50,
      life: 0.16, r0: 1, r1: 2.2, rgb: spec.rgb
    });
    if (G.wep === 'rocket') {
      audio.boom();
      kick(2.4, 'thump');
    } else {
      audio.bark();
      kick(1.4, 'hit');
    }
    if (G.ammo <= 0) {
      G.wep = 'knife';
      toast('匕首', false, false);
    }
    syncHud();
  }

  function attack() {
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.atkCd > 0) return;
    if (meleeEnemy()) doKnife();
    else if (G.ammo > 0 && WEAPONS[G.wep]) fireWep();
    else doKnife();
  }

  function explode(x, y, r, dmg, from) {
    juice(x, y, GOLD, 1.5);
    audio.boom();
    hitStop(0.06);
    kick(5.2, 'boom');
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - x, (e.y - 12) - y) < r) hurtEnt(e, dmg, from);
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      if (hypot(G.boss.x - x, (G.boss.y - 16) - y) < r + 8) hurtEnt(G.boss, dmg, from);
    }
  }

  function hurtEnt(e, dmg, src) {
    if (e.dead || e.hp <= 0) return;
    if (src === 'slash' && e.hitN === G.slashHit) return;
    if (src === 'slash') e.hitN = G.slashHit;
    e.hp -= dmg;
    const rgb = e === G.boss ? MAG : (src === 'gun' || src === 'rocket' ? CYN : GOLD);
    juice(e.x, e.y - 14, rgb, e === G.boss ? 1.4 : src === 'slash' ? 1.15 : 0.85);
    if (src === 'slash') {
      hitStop(0.058);
      kick(3.4, 'hit');
      audio.stab(G.combo);
    } else if (src === 'gun') {
      hitStop(0.036);
      kick(2.0, 'thump');
      audio.ping(G.combo);
    } else if (src === 'rocket') {
      hitStop(0.07);
      kick(5.0, 'boom');
    } else {
      hitStop(0.05);
      kick(3.2, 'boom');
    }
    if (e.hp <= 0) {
      e.dead = true;
      e.hp = 0;
      bumpCombo();
      const kind = e === G.boss ? 'boss' : e.kind;
      const sc = (SCORE[kind] || 100) * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 28, '+' + sc, GOLD, e === G.boss || G.mult > 1);
      if (e === G.boss) {
        G.clearT = 1.9;
        audio.boss();
        screenFlash(GOLD, 0.45);
        kick(7.4, 'boom');
        toast('狱长 击破', false, true);
      }
    } else if (e === G.boss) {
      floatText(e.x, e.y - 30, String(e.hp), MAG, false);
    }
  }

  function die(why) {
    if (!playing()) {
      if (G.mode === 'title') {
        G.player = makePlayer(70, GY);
        G.camX = 0;
      }
      return;
    }
    if (G.deadT > 0 || G.invuln > 0 || G.lock > 0) return;
    G.why = why;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.hp = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.wep = 'knife';
    G.ammo = 0;
    audio.death();
    juice(G.player.x, G.player.y - 14, MAG, 1.6);
    screenFlash(MAG, 0.5);
    hitStop(0.08);
    kick(7, 'die');
    syncHud();
  }

  function takeHp(why) {
    if (!playing()) return;
    if (G.deadT > 0 || G.invuln > 0 || G.lock > 0) return;
    G.hp -= 1;
    audio.hurt();
    juice(G.player.x, G.player.y - 14, ORG, 1.05);
    kick(3.6, 'hit');
    hitStop(0.045);
    if (G.hp <= 0) {
      die(why);
      return;
    }
    G.invuln = 0.9;
    toast('挨了一刀', true, false);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.face = 1;
    G.deadT = 0;
    G.hp = HP_MAX;
    G.invuln = INVULN;
    G.wep = 'knife';
    G.ammo = 0;
    G.shots = G.shots.filter(function (s) { return s.from === 'p'; });
    G.slashT = 0;
    syncHud();
  }

  function loseWhy() {
    if (G.why === 'fall') return '坠入河里了';
    if (G.why === 'shot') return '中弹了';
    if (G.why === 'back') return '背后偷袭了';
    return '被刺中了';
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    showOverlay('lose', '命尽', loseWhy() + ' · ' + G.score + ' 分 · 连击最高 ×' + Math.max(1, G.maxCombo || 1));
    audio.lose();
    syncHud();
  }

  function goWin() {
    addScore(8000);
    saveBest();
    G.mode = 'win';
    if (stageEl) {
      stageEl.classList.remove('win-flash');
      void stageEl.offsetWidth;
      stageEl.classList.add('win-flash');
    }
    const title = isNight() ? '夜袭得手' : '监狱已破';
    showOverlay('win', title, (isNight() ? '夜色里杀穿四营。 ' : '四营突围，狱长倒下。 ') + G.score + ' 分');
    audio.win();
    syncHud();
  }

  function nextStage() {
    addScore(SCORE.stage * G.stage);
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    const keepWep = G.wep;
    const keepAmmo = G.ammo;
    loadStage(G.stage, false);
    G.wep = keepWep;
    G.ammo = keepAmmo;
    G.invuln = 0.8;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'night' ? 'night' : 'break';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.wep = 'knife';
    G.ammo = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isNight() ? '夜袭' : STAGES[0].name, false, !isNight());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'break';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.wep = 'knife';
    G.ammo = 0;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '绿兵', '侧向突围，匕首一击。背后偷袭即死。捡步枪、火箭，弹药有限。监狱见狱长。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('break');
    else startGame(G.kind || 'break');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('break');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    if (G.atkCd <= 0 && (G.clock * 2 | 0) % 3 === 0) {
      if (meleeEnemy() || G.ammo > 0) attack();
      else if ((G.clock * 4 | 0) % 5 === 0) doKnife();
    }
    if (p.x > 520) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
    }
  }

  function giveWep(kind) {
    const spec = WEAPONS[kind];
    if (!spec) return;
    G.wep = kind;
    G.ammo = spec.ammo;
    toast(WEP_NAME[kind] + ' ×' + spec.ammo, false, true);
    audio.pickup();
    syncHud();
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.4;
      p.squash = 1.15;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.lock > 0) return;

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;
    const spd = WALK * (p.grounded ? 1 : AIR);
    p.vx = ax * spd;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);

    if (inU()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    if (p.grounded && inD() && G.dropT <= 0) {
      const under = platUnder(p.x, p.y, null);
      if (under && !under.base) {
        G.dropPlat = under;
        G.dropT = 0.18;
        p.vy = 80;
        p.grounded = false;
      }
    }
    if (G.dropT > 0) G.dropT -= dt;
    else G.dropPlat = null;

    const canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.03);
    }
    if (!inU() && p.vy < -80) p.vy *= Math.pow(0.42, dt * 8);

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, G.dropPlat);
      if (plat) {
        y1 = plat.y;
        if (p.vy > 220) {
          audio.land();
          p.squash = 0.82;
          emit(6, {
            x: p.x, y: p.y, j: 10,
            vx0: -80, vx1: 80, vy0: -30, vy1: 10,
            life: 0.2, r0: 1, r1: 2.4, rgb: HOT2, g: 180
          });
          kick(1.6, 'thump');
        }
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.y > VH + 90) die('fall');

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded) p.run += dt * 9;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (playing() && p.grounded && p.x > G.checkX + 48) {
      G.checkX = p.x;
      G.checkY = p.y;
    }

    let i;
    if (G.slashT > 0 && G.slashT > 0.04) {
      let e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (inSlash(e.x, e.y, e.w, e.h)) hurtEnt(e, 9, 'slash');
      }
      if (G.boss && !G.boss.dead && G.boss.active && inSlash(G.boss.x, G.boss.y, G.boss.w, G.boss.h)) {
        hurtEnt(G.boss, 1, 'slash');
      }
      for (i = G.shots.length - 1; i >= 0; i--) {
        const s = G.shots[i];
        if (s.from === 'e' && inSlash(s.x, s.y + 8, 10, 10)) {
          popSpark(s.x, s.y, GOLD, 10);
          G.shots.splice(i, 1);
        }
      }
    }

    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      if (hypot(p.x - u.x, (p.y - 16) - u.y) < 22) {
        u.taken = true;
        giveWep(u.kind);
        juice(u.x, u.y, u.kind === 'rocket' ? GOLD : CYN, 0.95);
        screenFlash(u.kind === 'rocket' ? GOLD : CYN, 0.28);
      }
    }

    if (playing() && G.clearT <= 0 && p.x > G.gate) {
      if (G.boss && !G.boss.dead) {
        if (!G.boss.active) {
          G.boss.active = true;
          audio.boss();
          toast('狱长现身', false, true);
          screenFlash(MAG, 0.32);
          p.x = G.gate;
        } else {
          p.x = G.gate;
        }
      } else {
        G.clearT = 1.15;
        G.lock = 1.15;
        toast(STAGES[G.stage - 1].name + ' 突围', false, true);
        audio.stage();
        screenFlash(GOLD, 0.3);
      }
    }
  }

  function spawnFlank() {
    const p = G.player;
    let n = 0;
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if ((e.kind === 'flank' || e.kind === 'dog') && Math.abs(e.x - p.x) < 280) n += 1;
    }
    const cap = isNight() ? 3 : 1;
    if (n >= cap) return;
    const behind = p.x - p.face * rand(120, 190);
    let y = p.y;
    if (!standAt(behind, y)) {
      y = GY;
      if (!standAt(behind, y)) return;
    }
    if (behind < 30 || behind > G.levelW - 40) return;
    const kind = Math.random() < 0.42 ? 'dog' : 'flank';
    G.ents.push(makeEnt(behind, y, kind, behind - 40, behind + 240));
    capArr(G.ents, 48);
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isNight(), G.stage);
    const p = G.player;
    e.t += dt;
    if (!e.grounded) {
      e.vy += GRAV * dt;
      const y0 = e.y;
      const y1 = e.y + e.vy * dt;
      const plat = landOn(e.x, y0, y1, null);
      if (plat && e.vy >= 0) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else e.y = y1;
    }

    if (e.kind === 'tower') {
      e.face = p.x >= e.x ? 1 : -1;
    } else if (e.kind === 'mortar') {
      e.face = p.x >= e.x ? 1 : -1;
    } else if (e.kind === 'dog' || e.kind === 'flank' || e.kind === 'runner' || e.kind === 'grunt' || e.kind === 'officer') {
      let dir = e.face;
      const see = Math.abs(p.x - e.x) < (e.kind === 'flank' || e.kind === 'dog' ? 340 : 240)
        && Math.abs(p.y - e.y) < 56;
      if (e.kind === 'flank' && see) {
        const back = p.x - p.face * 36;
        dir = e.x < back ? 1 : -1;
        if (Math.abs(e.x - p.x) < 40) dir = p.x > e.x ? 1 : -1;
      } else if ((e.kind === 'dog' || e.kind === 'runner' || e.kind === 'officer') && see) {
        dir = p.x > e.x ? 1 : -1;
      }
      const spd = (e.kind === 'dog' ? 168 : e.kind === 'runner' ? 132 : e.kind === 'flank' ? 96 : e.kind === 'officer' ? 78 : 62) * mul;
      const nx = e.x + dir * spd * dt;
      if (e.kind === 'grunt' || e.kind === 'officer') {
        if (nx < e.a || nx > e.b || !standAt(nx + dir * 8, e.y)) {
          e.face = -e.face;
        } else {
          e.x = nx;
          e.face = dir;
        }
      } else if (!standAt(nx + dir * 8, e.y) && e.grounded) {
        if (see && p.y < e.y - 20) {
          e.face = dir;
        } else {
          e.face = -dir;
        }
      } else {
        e.x = nx;
        e.face = dir;
      }
      e.x = clamp(e.x, 16, G.levelW - 16);
    }

    if (e.kind === 'mortar') {
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 420) {
        G.shots.push({
          x: e.x + e.face * 8, y: e.y - 20,
          vx: e.face * (90 + Math.abs(p.x - e.x) * 0.12),
          vy: -320,
          g: 540,
          from: 'e', kind: 'mortar', life: 2.1, dmg: 1, blast: 0, rgb: ORG, face: e.face
        });
        e.fire = (isNight() ? 1.15 : 1.55) / (1 + (G.stage - 1) * 0.08);
        audio.beep(180, 0.06, 'square', 0.025, 70);
      }
    }

    if (e.kind === 'tower') {
      e.fire -= dt;
      const dx = p.x - e.x;
      if (e.fire <= 0 && Math.abs(p.y - e.y) < 50 && Math.abs(dx) < 380 && playing() && G.deadT <= 0) {
        G.shots.push({
          x: e.x + e.face * 12, y: e.y - 20,
          vx: e.face * 260 * (isNight() ? 1.12 : 1),
          vy: 0, g: 0,
          from: 'e', kind: 'bullet', life: 1.1, dmg: 1, blast: 0, rgb: RED, face: e.face
        });
        e.fire = (isNight() ? 0.92 : 1.32) / (1 + (G.stage - 1) * 0.08);
        audio.beep(520, 0.04, 'square', 0.02, 220);
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const slashing = G.slashT > 0.05 && inSlash(e.x, e.y, e.w, e.h);
      if (!slashing && overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        const fromBack = (e.x - p.x) * p.face < -2;
        if (fromBack) die('back');
        else takeHp('stab');
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active) {
      if (playing() && G.player && G.player.x > G.levelW - VW - 40) {
        b.active = true;
        audio.boss();
        toast('狱长现身', false, true);
        screenFlash(MAG, 0.3);
      }
      return;
    }
    const p = G.player;
    const mul = spdMul(isNight(), G.stage);
    b.t += dt;
    b.fire -= dt;
    if (!b.grounded) {
      b.vy += GRAV * dt;
      const y0 = b.y;
      const y1 = b.y + b.vy * dt;
      const plat = landOn(b.x, y0, y1, null);
      if (plat && b.vy >= 0) {
        b.y = plat.y;
        b.vy = 0;
        b.grounded = true;
      } else b.y = y1;
    }
    const dx = p.x - b.x;
    b.face = dx > 0 ? 1 : -1;
    const dist = Math.abs(dx);
    if (b.grounded) {
      if (dist > 64) b.x += b.face * 78 * mul * dt;
      else if (dist < 40 && b.t > 0.45) {
        b.vy = -340;
        b.vx = -b.face * 110;
        b.grounded = false;
        b.t = 0;
      }
    } else b.x += (b.vx || 0) * dt;
    b.x = clamp(b.x, G.levelW - VW + 40, G.levelW - 40);

    const low = b.hp < b.max * 0.5;
    const rate = (low ? 0.7 : 1.05) / mul;
    if (b.fire <= 0 && playing() && G.deadT <= 0) {
      G.shots.push({
        x: b.x + b.face * 16, y: b.y - 22,
        vx: b.face * 280, vy: 0, g: 0,
        from: 'e', kind: 'bullet', life: 1.2, dmg: 1, blast: 0, rgb: MAG, face: b.face
      });
      if (low) {
        G.shots.push({
          x: b.x + b.face * 12, y: b.y - 28,
          vx: b.face * 240, vy: -50, g: 0,
          from: 'e', kind: 'bullet', life: 1.1, dmg: 1, blast: 0, rgb: MAG, face: b.face
        });
      }
      b.fire = rate;
      audio.beep(200, 0.08, 'sawtooth', 0.03, 70);
    }

    if (b.t > (low ? 1.8 : 2.6) && playing()) {
      spawnFlank();
      b.t = 0;
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const slashing = G.slashT > 0.05 && inSlash(b.x, b.y, b.w, b.h);
      if (!slashing && overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        const fromBack = (b.x - p.x) * p.face < -2;
        if (fromBack) die('back');
        else takeHp('stab');
      }
    }
  }

  function updateShots(dt) {
    const p = G.player;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      if (s.g) s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x < G.camX - 50 || s.x > G.camX + VW + 50 || s.y > GY + 40) {
        if (s.kind === 'rocket' && s.from === 'p') explode(s.x, s.y, s.blast || 48, s.dmg, 'rocket');
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        let k, e;
        for (k = 0; k < G.ents.length; k++) {
          e = G.ents[k];
          if (e.dead) continue;
          if (hypot(s.x - e.x, s.y - (e.y - 14)) < 14) {
            if (s.kind === 'rocket') explode(s.x, s.y, s.blast || 48, s.dmg, 'rocket');
            else hurtEnt(e, s.dmg, 'gun');
            hit = true;
            break;
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active) {
          if (hypot(s.x - G.boss.x, s.y - (G.boss.y - 18)) < 18) {
            if (s.kind === 'rocket') explode(s.x, s.y, s.blast || 48, s.dmg, 'rocket');
            else hurtEnt(G.boss, s.dmg, 'gun');
            hit = true;
          }
        }
        if (hit) {
          popSpark(s.x, s.y, s.rgb || CYN, s.kind === 'rocket' ? 22 : 12);
          G.shots.splice(i, 1);
        }
      } else if (playing() && G.deadT <= 0) {
        if (G.invuln <= 0 && hypot(s.x - p.x, s.y - (p.y - 16)) < 12) {
          G.shots.splice(i, 1);
          die('shot');
        }
      }
    }
  }

  function updateFx(dt) {
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.slashT > 0) G.slashT -= dt;
    if (G.atkCd > 0) G.atkCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));
    G.search += dt;

    let i, o;
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.life -= dt;
      o.vy += o.g * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= o.vy * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
    if (isNight()) {
      G.rainT += dt;
      if (rain.length < 50) {
        rain.push({
          x: G.camX + rand(-40, VW + 40),
          y: G.camY + rand(-20, VH),
          l: rand(10, 18),
          v: rand(280, 420)
        });
      }
      for (i = rain.length - 1; i >= 0; i--) {
        o = rain[i];
        o.y += o.v * dt;
        o.x += 40 * dt;
        if (o.y > G.camY + VH + 10) {
          o.y = G.camY - 10;
          o.x = G.camX + rand(-40, VW + 40);
        }
      }
    } else rain.length = 0;
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * (p.face > 0 ? 0.38 : 0.52);
    if (G.boss && G.boss.active && !G.boss.dead && p.x > G.levelW - VW) {
      tx = G.levelW - VW;
    }
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    let ty = p.y - VH * 0.72;
    ty = clamp(ty, -80, 12);
    const k = 1 - Math.pow(0.0008, dt);
    G.camX = lerp(G.camX, tx, k);
    G.camY = lerp(G.camY, ty, k * 0.85);
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'title' || G.mode === 'play') G.clock += dt;
    updateFx(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateCam(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (!live()) return;
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    if (playing() && G.deadT <= 0) {
      G.flankT -= dt;
      if (G.flankT <= 0) {
        G.flankT = flankWait(isNight(), G.stage);
        spawnFlank();
      }
    }
    updateCam(dt);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (isNight()) {
      g.addColorStop(0, '#02080c');
      g.addColorStop(0.55, '#06140e');
      g.addColorStop(1, '#0a1a10');
    } else if (G.theme === 'port') {
      g.addColorStop(0, '#061018');
      g.addColorStop(0.5, '#0a1814');
      g.addColorStop(1, '#102018');
    } else if (G.theme === 'prison') {
      g.addColorStop(0, '#080c08');
      g.addColorStop(0.5, '#10140c');
      g.addColorStop(1, '#16180e');
    } else {
      g.addColorStop(0, '#04140c');
      g.addColorStop(0.5, '#0a1c10');
      g.addColorStop(1, '#122414');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 48);
    ctx.fillStyle = rgba(GOLD, isNight() ? 0.22 : 0.48);
    ctx.beginPath();
    ctx.arc(mx, my, 22 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.16);
    ctx.beginPath();
    ctx.arc(mx - 6 * scale, my - 4 * scale, 10 * scale, 0, TAU);
    ctx.fill();
  }

  function drawFar() {
    const par = G.camX * 0.3;
    const base = sy(GY + 8);
    let i, x, h, w;
    for (i = -2; i < 24; i++) {
      x = sx((Math.floor((G.camX + par) / 72) + i) * 72 - par);
      h = (32 + hash2(i + 17 + G.stage * 5) * 88) * scale;
      w = (30 + hash2(i + 3) * 30) * scale;
      if (G.theme === 'port') {
        ctx.fillStyle = i % 3 === 0 ? '#0a1418' : '#081018';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = rgba(CYN, 0.18);
        ctx.fillRect(x + 4 * scale, base - h, 3 * scale, h);
      } else if (G.theme === 'prison') {
        ctx.fillStyle = i % 2 ? '#10140c' : '#0c100a';
        ctx.fillRect(x, base - h, w + 8 * scale, h + 40 * scale);
        ctx.strokeStyle = rgba(HOT, 0.18);
        ctx.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.moveTo(x + (4 + k * 6) * scale, base - h + 8 * scale);
          ctx.lineTo(x + (4 + k * 6) * scale, base - h + 28 * scale);
          ctx.stroke();
        }
      } else if (G.theme === 'bridge') {
        ctx.fillStyle = '#0c1410';
        ctx.fillRect(x, base - 18 * scale, w, 18 * scale);
        ctx.fillStyle = rgba(HOT, 0.2);
        ctx.fillRect(x + w * 0.45, base - h * 0.7, 3 * scale, h * 0.7);
      } else {
        ctx.fillStyle = i % 3 === 0 ? '#0c1a10' : '#08140c';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = hash2(i + 11) > 0.6 ? rgba(HOT, 0.28) : rgba(GOLD, 0.12);
        ctx.fillRect(x + 6 * scale, base - h + 10 * scale, 5 * scale, 6 * scale);
        ctx.fillRect(x + 16 * scale, base - h + 10 * scale, 5 * scale, 6 * scale);
      }
    }
  }

  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      const h = p.h * scale;
      ctx.fillStyle = p.base ? '#102010' : '#142414';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(HOT, p.base ? 0.85 : 0.7);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(CYN, 0.22);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        ctx.fillStyle = rgba(LEAF, 0.22);
        ctx.fillRect(x, y + h - 6 * scale, w, 6 * scale);
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.22) : rgba(GOLD, 0.16);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 5 * scale);
        }
      }
    }
  }

  function drawFlag() {
    if (G.boss && !G.boss.dead) return;
    const x = sx(G.gate);
    const y = sy(GY);
    const s = scale;
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(x, y - 46 * s, 2.2 * s, 46 * s);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.moveTo(x + 2 * s, y - 46 * s);
    ctx.lineTo(x + 18 * s, y - 38 * s);
    ctx.lineTo(x + 2 * s, y - 28 * s);
    ctx.closePath();
    ctx.fill();
  }

  function drawFigure(x, y, face, t, rgb, size, opt) {
    const s = scale * (size || 1);
    const run = opt.run || 0;
    const sq = opt.squash || 1;
    const pose = opt.pose || 0;
    const slash = opt.slash || 0;
    const blink = opt.blink;
    if (blink && ((G.t * 18) | 0) % 2 === 0) return;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(face, sq);
    const leg = Math.sin(run) * 5 * s;
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -8 * s);
    ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -8 * s);
    ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -10 * s);
    ctx.lineTo(7 * s, -11 * s);
    ctx.lineTo(5 * s, -24 * s);
    ctx.lineTo(-5 * s, -23 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(opt.belt || GOLD, 0.9);
    ctx.fillRect(-6 * s, -13 * s, 12 * s, 2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -28 * s, 5.6 * s, 6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(opt.beret || HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(-1 * s, -32 * s, 7.2 * s, 3.2 * s, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillRect(-6.4 * s, -32 * s, 12 * s, 2.2 * s);
    if (opt.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.4 * s;
      ctx.strokeRect(-5 * s, -34 * s, 10 * s, 5 * s);
    }
    ctx.strokeStyle = rgba(WHT, 0.85);
    ctx.lineWidth = 1.8 * s;
    const arm = pose > 0 ? 10 * s : (slash > 0 ? 16 * s : 5 * s);
    const armY = pose > 0 ? -22 * s : (slash > 0 ? -18 * s : -16 * s);
    ctx.beginPath();
    ctx.moveTo(2 * s, -18 * s);
    ctx.lineTo(arm, armY);
    ctx.stroke();
    if (slash > 0) {
      ctx.strokeStyle = rgba(GOLD, 0.92);
      ctx.lineWidth = 2.6 * s;
      ctx.beginPath();
      ctx.arc(8 * s, -16 * s, 16 * s, -0.95, 0.72);
      ctx.stroke();
      ctx.strokeStyle = rgba(HOT, 0.75);
      ctx.lineWidth = 1.3 * s;
      ctx.beginPath();
      ctx.arc(8 * s, -16 * s, 12 * s, -0.85, 0.55);
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.95);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(14 * s, -18 * s);
      ctx.lineTo(24 * s, -14 * s);
      ctx.stroke();
    } else if (opt.gun) {
      ctx.strokeStyle = rgba(CYN, 0.95);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(4 * s, -17 * s);
      ctx.lineTo(16 * s, -17 * s);
      ctx.stroke();
      if (opt.muzzle) {
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.arc(18 * s, -17 * s, 4 * s, 0, TAU);
        ctx.fill();
      }
    } else if (opt.rocket) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(4 * s, -20 * s, 14 * s, 4 * s);
    }
    ctx.restore();
  }

  function drawDog(e) {
    const s = scale;
    const x = sx(e.x);
    const y = sy(e.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(BRN, 0.95);
    ctx.fillRect(-10 * s, -10 * s, 18 * s, 8 * s);
    ctx.fillRect(6 * s, -14 * s, 8 * s, 7 * s);
    ctx.fillStyle = rgba(RED, 0.8);
    ctx.fillRect(12 * s, -12 * s, 4 * s, 2 * s);
    ctx.strokeStyle = rgba(BRN, 0.9);
    ctx.lineWidth = 1.8 * s;
    const lg = Math.sin(G.clock * 14) * 3 * s;
    ctx.beginPath();
    ctx.moveTo(-6 * s, -3 * s);
    ctx.lineTo(-8 * s, lg);
    ctx.moveTo(4 * s, -3 * s);
    ctx.lineTo(6 * s, -lg);
    ctx.stroke();
    ctx.restore();
  }

  function drawTower(e) {
    const s = scale;
    const x = sx(e.x);
    const y = sy(e.y);
    ctx.fillStyle = '#1a2418';
    ctx.fillRect(x - 12 * s, y - 30 * s, 24 * s, 30 * s);
    ctx.fillStyle = rgba(HOT, 0.7);
    ctx.fillRect(x - 12 * s, y - 32 * s, 24 * s, 3 * s);
    ctx.fillStyle = rgba(RED, 0.5);
    ctx.fillRect(x - 4 * s, y - 24 * s, 8 * s, 6 * s);
    ctx.strokeStyle = rgba(ORG, 0.9);
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(x, y - 20 * s);
    ctx.lineTo(x + e.face * 16 * s, y - 18 * s);
    ctx.stroke();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(G.clock * 4) * 3);
    const s = scale;
    const rgb = u.kind === 'rocket' ? GOLD : CYN;
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 11 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.9);
    ctx.fillRect(x - 7 * s, y - 5 * s, 14 * s, 10 * s);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.font = 'bold ' + (8 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(u.kind === 'rocket' ? 'R' : 'G', x, y + 3 * s);
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale;
    if (s.kind === 'rocket') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(s.vy, s.vx));
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(-6 * sc, -2.2 * sc, 12 * sc, 4.4 * sc);
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.beginPath();
      ctx.moveTo(-6 * sc, 0);
      ctx.lineTo(-12 * sc, -3 * sc);
      ctx.lineTo(-12 * sc, 3 * sc);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (s.kind === 'mortar') {
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 4 * sc, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb || CYN, 0.95);
      ctx.fillRect(x - 4 * sc, y - 1.4 * sc, 8 * sc, 2.8 * sc);
    }
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, ox + VW * 0.5 * scale, y - 3 * scale);
  }

  function drawSearch() {
    if (!isNight()) return;
    const s = scale;
    const ang = Math.sin(G.search * 0.7) * 0.45;
    const x = ox + VW * 0.72 * s;
    const y = oy + 8 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, 0, 0, 220 * s);
    g.addColorStop(0, 'rgba(255,227,107,0.16)');
    g.addColorStop(1, 'rgba(255,227,107,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-70 * s, 240 * s);
    ctx.lineTo(70 * s, 240 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFx() {
    let i, o, a;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      a = 1 - o.t / 0.4;
      ctx.strokeStyle = rgba(o.rgb, 0.55 * a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + o.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      a = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, 0.55 * a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      a = o.life / o.max;
      ctx.fillStyle = rgba(o.rgb, 0.85 * a);
      ctx.fillRect(sx(o.x), sy(o.y), o.r * scale, o.r * scale);
    }
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      a = 1 - o.t / o.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(o.rgb, 1);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
      ctx.globalAlpha = 1;
    }
    if (isNight()) {
      ctx.strokeStyle = 'rgba(180,220,200,0.2)';
      ctx.lineWidth = 1;
      for (i = 0; i < rain.length; i++) {
        o = rain[i];
        ctx.beginPath();
        ctx.moveTo(sx(o.x), sy(o.y));
        ctx.lineTo(sx(o.x + 3), sy(o.y + o.l));
        ctx.stroke();
      }
    }
  }

  function entRgb(kind) {
    if (kind === 'flank') return MAG;
    if (kind === 'mortar') return ORG;
    if (kind === 'runner') return RED;
    if (kind === 'officer') return GOLD;
    if (kind === 'dog') return BRN;
    return BRN;
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#040c08';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const sh = REDUCE ? 0 : G.shake;
    if (sh > 0) {
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh * 0.7);
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawFar();
    drawSearch();
    drawPlats();
    drawFlag();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'dog') drawDog(e);
      else if (e.kind === 'tower') drawTower(e);
      else {
        drawFigure(e.x, e.y, e.face, G.clock, entRgb(e.kind), e.kind === 'officer' ? 1.05 : 0.92, {
          run: G.clock * (e.kind === 'runner' ? 12 : 8),
          grounded: e.grounded, squash: 1, pose: e.kind === 'mortar' ? 0.1 : 0,
          slash: 0, boss: false, beret: e.kind === 'officer' ? GOLD : RED
        });
      }
    }
    if (G.boss && !G.boss.dead) {
      ctx.globalAlpha = G.boss.active ? 1 : 0.45;
      drawFigure(G.boss.x, G.boss.y, G.boss.face, G.clock, MAG, 1.32, {
        run: G.clock * 5, grounded: G.boss.grounded, squash: 1,
        pose: G.boss.fire < 0.2 ? 0.12 : 0, slash: 0, boss: true, beret: GOLD, gun: true
      });
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const p = G.player;
    if (p) {
      const blink = playing() && G.invuln > 0 && G.deadT <= 0;
      drawFigure(p.x, p.y, p.face, G.clock, LEAF, 1, {
        run: p.run, grounded: p.grounded, squash: p.squash,
        pose: p.pose, slash: G.slashT, blink: blink, boss: false,
        beret: HOT, gun: G.wep === 'gun' && G.ammo > 0 && G.slashT <= 0,
        rocket: G.wep === 'rocket' && G.ammo > 0 && G.slashT <= 0,
        muzzle: G.muzzle > 0
      });
    }

    drawFx();
    drawBossBar();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const knife = k === 'z' || k === 'Z' || k === 'x' || k === 'X';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;

    if (down && (isMove || space || knife || k === 'Enter')) e.preventDefault();
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
    if (k === '1' && G.mode === 'title') {
      startGame('break');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('night');
      return;
    }
    if (knife) {
      if (overlayOpen() && G.mode !== 'play') return;
      attack();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (playing()) attack();
    }
  }

  function bindPad() {
    function hold(el, on, off) {
      if (!el) return;
      const down = function (e) {
        e.preventDefault();
        audio.ensure();
        el.classList.add('held');
        on();
      };
      const up = function (e) {
        e.preventDefault();
        el.classList.remove('held');
        if (off) off();
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
    }
    hold(document.getElementById('btn-left'), function () { keys.l = true; }, function () { keys.l = false; });
    hold(document.getElementById('btn-right'), function () { keys.r = true; }, function () { keys.r = false; });
    hold(document.getElementById('btn-jump'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-knife'), function () {
      if (playing()) attack();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      if (playing()) attack();
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
  bindPad();

  if (btnBreak) {
    btnBreak.addEventListener('click', function () {
      audio.ensure();
      startGame('break');
    });
  }
  if (btnNight) {
    btnNight.addEventListener('click', function () {
      audio.ensure();
      startGame('night');
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win') startGame('night');
      else goTitle();
    });
  }
  if (modeBreak) {
    modeBreak.addEventListener('click', function () {
      audio.ensure();
      startGame('break');
    });
  }
  if (modeNight) {
    modeNight.addEventListener('click', function () {
      audio.ensure();
      startGame('night');
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
    }
  });

  requestAnimationFrame(frame);
})();
