'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 214;
  const AIR = 0.92;
  const JUMP_V = 490;
  const JUMP_HI = 560;
  const GRAV = 1500;
  const MAX_FALL = 560;
  const COYOTE = 0.08;
  const BUFFER = 0.1;
  const FW = 14;
  const FH = 26;
  const FD = 16;
  const INVULN = 1.22;
  const DIE_T = 0.86;
  const FLIP_T = 0.48;
  const BEST_KEY = 'playbox-thunder-fox-best';
  const MUTE_KEY = 'playbox-thunder-fox-mute';
  const OPS = '方向 / WASD 走瞄 · 空格射击 · Shift / Z 跳 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 98, 20];
  const HOT2 = [255, 176, 112];
  const WHT = [255, 244, 232];
  const STL = [86, 52, 42];
  const IRON = [42, 22, 18];
  const RUST = [186, 72, 36];
  const LEAF = [61, 255, 122];
  const FOX = [255, 122, 48];
  const PANE = [168, 232, 255];
  const RAIN = [48, 92, 128];

  const SCORE = {
    grunt: 80, runner: 110, flyer: 100, glass: 60,
    turret: 160, brute: 200, smash: 40, boss: 3600, stage: 1400
  };

  const AMMO = { pistol: 20, rifle: 30, bolt: 3 };
  const AMMO_CAP = { pistol: 24, rifle: 36, bolt: 5 };
  const GUN_NAME = { knife: '刃', pistol: '手枪', rifle: '步枪', bolt: '雷弹' };

  const STAGES = [
    {
      name: '雨镇', boss: '铁兽', w: 1580, hp: 24, theme: 'rain',
      ground: [[0, 430], [500, 200], [770, 230], [1070, 510]],
      plats: [
        [120, MY, 140], [320, MY, 150], [540, MY, 140],
        [820, MY, 150], [1120, MY, 160], [1360, MY, 140],
        [600, HY, 120], [980, HY, 130]
      ],
      ents: [
        [200, GY, 'grunt', 20, 400],
        [300, GY, 'glass', 0, 0],
        [360, GY, 'grunt', 40, 410],
        [420, MY, 'turret', 0, 0],
        [560, GY, 'runner', 500, 680],
        [620, GY, 'pistol', 0, 0],
        [640, HY, 'flyer', 560, 820],
        [660, MY, 'grunt', 540, 690],
        [860, GY, 'glass', 0, 0],
        [920, GY, 'grunt', 770, 980],
        [960, MY, 'turret', 0, 0],
        [1040, HY, 'flyer', 940, 1180],
        [1180, GY, 'brute', 1070, 1380],
        [1240, GY, 'rifle', 0, 0],
        [1280, MY, 'glass', 0, 0],
        [1340, HY, 'flyer', 1240, 1480],
        [1420, GY, 'runner', 1280, 1540],
        [1480, MY, 'turret', 0, 0]
      ]
    },
    {
      name: '空堡', boss: '堡心', w: 1800, hp: 34, theme: 'sky',
      ground: [[0, 400], [470, 200], [740, 210], [1020, 220], [1310, 490]],
      plats: [
        [80, MY, 130], [280, MY, 150], [520, MY, 140],
        [780, MY, 150], [1060, MY, 150], [1380, MY, 160], [1620, MY, 140],
        [200, HY, 120], [640, HY, 130], [1100, HY, 140], [1500, HY, 130]
      ],
      ents: [
        [180, GY, 'grunt', 20, 360],
        [260, GY, 'glass', 0, 0],
        [320, MY, 'turret', 0, 0],
        [360, HY, 'flyer', 220, 480],
        [540, GY, 'runner', 470, 660],
        [580, GY, 'pistol', 0, 0],
        [600, MY, 'grunt', 520, 680],
        [680, HY, 'flyer', 620, 840],
        [820, GY, 'glass', 0, 0],
        [880, GY, 'brute', 740, 1000],
        [940, MY, 'turret', 0, 0],
        [1020, HY, 'flyer', 940, 1200],
        [1160, GY, 'grunt', 1020, 1280],
        [1220, GY, 'rifle', 0, 0],
        [1280, MY, 'glass', 0, 0],
        [1340, HY, 'flyer', 1220, 1500],
        [1420, GY, 'runner', 1310, 1680],
        [1500, MY, 'turret', 0, 0],
        [1580, GY, 'bolt', 0, 0],
        [1660, GY, 'brute', 1500, 1760]
      ]
    },
    {
      name: '王座', boss: '雷首', w: 2020, hp: 46, theme: 'throne',
      ground: [[0, 380], [450, 190], [710, 200], [980, 200], [1250, 210], [1530, 490]],
      plats: [
        [70, MY, 130], [260, MY, 140], [500, MY, 150],
        [760, MY, 150], [1040, MY, 160], [1320, MY, 150],
        [1600, MY, 160], [1840, MY, 140],
        [180, HY, 120], [600, HY, 130], [980, HY, 140],
        [1400, HY, 140], [1760, HY, 130]
      ],
      ents: [
        [160, GY, 'grunt', 20, 340],
        [220, GY, 'glass', 0, 0],
        [280, MY, 'turret', 0, 0],
        [320, HY, 'flyer', 180, 460],
        [500, GY, 'runner', 450, 620],
        [540, GY, 'pistol', 0, 0],
        [560, MY, 'glass', 0, 0],
        [640, HY, 'flyer', 560, 800],
        [820, GY, 'brute', 710, 940],
        [880, GY, 'rifle', 0, 0],
        [900, MY, 'turret', 0, 0],
        [980, HY, 'flyer', 900, 1160],
        [1120, GY, 'grunt', 980, 1220],
        [1140, GY, 'glass', 0, 0],
        [1240, MY, 'brute', 1040, 1400],
        [1320, HY, 'flyer', 1220, 1480],
        [1400, GY, 'runner', 1250, 1500],
        [1580, GY, 'bolt', 0, 0],
        [1560, MY, 'turret', 0, 0],
        [1640, GY, 'glass', 0, 0],
        [1720, HY, 'flyer', 1600, 1900],
        [1800, GY, 'brute', 1530, 1980],
        [1880, MY, 'turret', 0, 0]
      ]
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
  function jumpHeight(v) {
    const j = v == null ? JUMP_V : v;
    return (j * j) / (2 * GRAV);
  }
  function airDist() {
    return WALK * AIR * (2 * JUMP_V / GRAV);
  }
  function maxPit(spec) {
    const segs = spec.ground.slice().sort(function (a, b) { return a[0] - b[0]; });
    let cover = 0;
    let gap = 0;
    let i;
    for (i = 0; i < segs.length; i++) {
      if (segs[i][0] > cover) gap = Math.max(gap, segs[i][0] - cover);
      cover = Math.max(cover, segs[i][0] + segs[i][1]);
    }
    return gap;
  }
  function isAlley() {
    return G.kind === 'alley';
  }
  function spdMul(alley, stage) {
    return (alley ? 1.26 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
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
  function isDrop(kind) {
    return kind === 'pistol' || kind === 'rifle' || kind === 'bolt';
  }
  function smashable(kind) {
    return kind === 'grunt' || kind === 'runner' || kind === 'flyer' || kind === 'glass';
  }
  function solidish(kind) {
    return kind === 'turret' || kind === 'brute';
  }
  function hpOf(kind) {
    if (kind === 'turret' || kind === 'brute') return 3;
    if (isDrop(kind)) return 99;
    return 1;
  }
  function sizeOf(kind) {
    if (kind === 'glass') return { w: 10, h: 46 };
    if (kind === 'brute') return { w: 20, h: 28 };
    if (kind === 'turret') return { w: 18, h: 16 };
    if (kind === 'flyer') return { w: 16, h: 12 };
    if (kind === 'runner') return { w: 14, h: 20 };
    if (isDrop(kind)) return { w: 14, h: 12 };
    return { w: 14, h: 18 };
  }
  function onGroundSeg(spec, x) {
    const segs = spec.ground;
    let k;
    for (k = 0; k < segs.length; k++) {
      if (x >= segs[k][0] + 8 && x <= segs[k][0] + segs[k][1] - 8) return true;
    }
    return false;
  }
  function gunRate(gun) {
    if (gun === 'rifle') return 0.07;
    if (gun === 'bolt') return 0.32;
    if (gun === 'pistol') return 0.12;
    return 0.14;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-thunder-fox-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-thunder-fox-mute') throw new Error('mute key');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 90) throw new Error('jump height ' + h);
    const hi = jumpHeight(JUMP_HI);
    if (hi <= h) throw new Error('high jump');
    if (hi < 96 || hi > 120) throw new Error('high jump ' + hi);
    const ad = airDist();
    if (ad < 110) throw new Error('air ' + ad);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('alley faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (!smashable('grunt') || smashable('turret') || smashable('brute')) throw new Error('smash rules');
    if (!smashable('glass')) throw new Error('glass smash');
    let i, j;
    for (i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      if (maxPit(s) + 16 > ad) throw new Error('pit too wide ' + s.name);
      let glass = 0;
      let drop = 0;
      for (j = 0; j < s.ents.length; j++) {
        const e = s.ents[j];
        if (e[2] === 'glass') glass += 1;
        if (isDrop(e[2])) drop += 1;
        if (e[1] !== GY) continue;
        if (e[2] === 'flyer') continue;
        if (!onGroundSeg(s, e[0])) throw new Error('ent in pit ' + s.name + ' ' + e[0]);
      }
      if (glass < 2) throw new Error('glass ' + s.name);
      if (drop < 1) throw new Error('drop ' + s.name);
    }
    return true;
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
    shot(gun) {
      this.ensure();
      if (gun === 'bolt') {
        this.beep(220, 0.08, 'sawtooth', 0.048, 90);
        this.beep(880, 0.06, 'square', 0.03, 240);
        this.noise(0.06, 0.03, 500);
      } else if (gun === 'rifle') {
        this.beep(880, 0.03, 'square', 0.034, 320);
        this.noise(0.016, 0.018, 1600);
      } else {
        this.beep(1040, 0.036, 'square', 0.036, 380);
        this.noise(0.018, 0.016, 1800);
      }
    },
    knife() {
      this.ensure();
      this.beep(1480, 0.04, 'triangle', 0.038, 620);
      this.noise(0.02, 0.016, 2200);
    },
    hop() {
      this.ensure();
      this.beep(280, 0.06, 'square', 0.038, 620);
    },
    thunder() {
      this.ensure();
      this.beep(180, 0.1, 'sawtooth', 0.05, 80);
      this.beep(920, 0.12, 'square', 0.04, 1400);
      this.noise(0.08, 0.04, 900);
    },
    land() {
      this.ensure();
      this.noise(0.05, 0.03, 360);
      this.beep(108, 0.06, 'triangle', 0.026, 58);
    },
    smash() {
      this.ensure();
      this.noise(0.09, 0.055, 280);
      this.beep(180, 0.1, 'sawtooth', 0.046, 52);
      this.beep(740, 0.05, 'square', 0.03, 220);
    },
    glass() {
      this.ensure();
      this.noise(0.08, 0.05, 1800);
      this.beep(1680, 0.08, 'triangle', 0.04, 420);
      this.beep(2200, 0.05, 'sine', 0.028, 800);
    },
    pickup() {
      this.ensure();
      this.beep(440, 0.07, 'square', 0.04, 660);
      this.beep(880, 0.1, 'triangle', 0.038, 1320);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.032, 0.03, 1100);
      this.beep(540 * lift, 0.055, 'square', 0.038, 880 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(170, 0.16, 'sawtooth', 0.05, 48);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(260, 0.22, 'sawtooth', 0.05, 64);
      this.beep(130, 0.34, 'sine', 0.045, 40);
    },
    boss() {
      this.ensure();
      this.beep(108, 0.2, 'sawtooth', 0.06, 52);
      this.beep(320, 0.16, 'square', 0.04, 170);
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
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
    }
  };

  if (!hasDom) {
    selfCheck();
    return;
  }

  selfCheck();

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnRaid = el('btn-raid');
  const btnAlley = el('btn-alley');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const modeRaid = el('mode-raid');
  const modeAlley = el('mode-alley');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const gunLabel = el('gun-label');
  const boltWrap = el('bolt-wrap');
  const boltBar = el('bolt-bar');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainEl = el('chain-pop');
  const hintEl = el('hint');
  const stageEl = el('stage');

  const keys = { l: false, r: false, u: false, d: false, fire: false, jump: false };
  const demo = { l: false, r: false, u: false, d: false, fire: false, jump: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trails = [];
  const slashes = [];

  let uid = 1;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let chainTok = 0;
  let ptrFire = false;
  let jumpQueued = false;
  let jumpHeldPrev = false;
  let hidden = false;
  let dpr = 1;
  let W = 1;
  let H = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 1580,
    plats: [],
    ents: [],
    shots: [],
    player: null,
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    fireCd: 0,
    checkX: 70,
    checkY: GY,
    jumpBuf: 0,
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
    muzzle: 0,
    slashT: 0,
    bolt: 0
  };

  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
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
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    if (G.mode === 'title') return demo.fire;
    if (overlayBlocksPlay()) return false;
    return keys.fire || ptrFire;
  }
  function jumpHeld() {
    if (G.mode === 'title') return demo.jump;
    if (overlayBlocksPlay()) return false;
    return keys.jump || jumpQueued;
  }
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
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
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
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
      const node = document.createElement('span');
      node.className = 'pip';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    while (pips.length > n) {
      const node = pips.pop();
      if (node && node.parentNode) node.parentNode.removeChild(node);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }
  function syncModes() {
    const a = isAlley();
    if (modeRaid) modeRaid.setAttribute('aria-pressed', a ? 'false' : 'true');
    if (modeAlley) modeAlley.setAttribute('aria-pressed', a ? 'true' : 'false');
  }
  function gunText() {
    const p = G.player;
    if (!p) return '刃';
    if (p.gun === 'knife' || p.ammo <= 0) return '刃';
    return GUN_NAME[p.gun] + ' ' + p.ammo;
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const p = G.player;
    if (stageLabel) {
      stageLabel.textContent = isAlley() ? '狐巷 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isAlley() ? '狐巷' : '雷狐';
      tagLabel.classList.toggle('warn', isAlley());
      tagLabel.classList.toggle('hot', !isAlley() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = gunText();
      const g = p && p.ammo > 0 ? p.gun : 'knife';
      gunLabel.classList.toggle('knife', g === 'knife');
      gunLabel.classList.toggle('bolt', g === 'bolt');
      gunLabel.classList.toggle('hot', g === 'rifle');
    }
    if (boltBar) {
      const v = clamp(G.bolt, 0, 1);
      boltBar.style.transform = 'scaleX(' + v + ')';
      boltBar.classList.toggle('hot', v >= 1);
      boltBar.classList.toggle('low', v < 0.22);
    }
    if (boltWrap) boltWrap.classList.toggle('off', G.bolt < 0.08);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 贴身会撞死', 'warn');
    else if (G.mode === 'win') setHint('王座捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空翻碾敌 · 贴身会撞死', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else if (G.bolt >= 1) setHint('雷翻已满 · 起跳带电碾', 'hot');
    else if (p && p.ammo <= 0) setHint('没弹了 · 近斩或空翻', '');
    else setHint('空翻碾敌 · 贴身撞死 · 碎玻璃', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TFOX';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = '换模式';
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
      }
    }, 380);
  }
  function screenFlash(rgb, a) {
    if (REDUCE) return;
    G.flash = Math.max(G.flash, a || 0.3);
    G.flashRgb = rgb || HOT;
  }
  function emit(n, spec) {
    if (REDUCE) n = Math.max(2, (n * 0.35) | 0);
    const cap = REDUCE ? 70 : 220;
    let i;
    for (i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.4, spec.j * 0.4),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.6, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 220
      });
    }
    capArr(particles, cap);
  }
  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb || HOT, r: rad || 10 });
    capArr(sparks, 28);
  }
  function popRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb || CYN });
    capArr(rings, 16);
  }
  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, t: 0, life: 0.7, vy: 42,
      text: text, rgb: rgb || HOT, gold: !!gold
    });
    capArr(floats, 24);
  }
  function boomAt(x, y, power, rgb) {
    const col = rgb || HOT;
    emit((14 * power) | 0, {
      x: x, y: y, j: 12 * power,
      vx0: -220 * power, vx1: 220 * power, vy0: -280 * power, vy1: 40,
      life: 0.32, r0: 1.4, r1: 4.2 * power, rgb: col, g: 260
    });
    popSpark(x, y, col, 16 * power);
    popRing(x, y, col);
    kick(3.2 * power, power > 1.2 ? 'boom' : 'hit');
  }
  function showChain(n) {
    if (!chainEl || n < 2) return;
    chainTok += 1;
    chainEl.textContent = '×' + n;
    chainEl.classList.remove('hidden');
    chainEl.style.animation = 'none';
    void chainEl.offsetWidth;
    chainEl.style.animation = '';
    const tok = chainTok;
    setTimeout(function () {
      if (tok === chainTok) chainEl.classList.add('hidden');
    }, 700);
  }
  function fillBolt(n) {
    const was = G.bolt;
    G.bolt = clamp(G.bolt + n, 0, 1);
    if (was < 1 && G.bolt >= 1) {
      toast('雷翻已满', false, true);
      audio.combo(3);
    }
    syncHud();
  }
  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.04);
    }
    syncHud();
  }

  function applySize(p) {
    p.w = FW;
    p.h = p.duck ? FD : FH;
  }
  function makePlayer(x, y) {
    const p = {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: FW, h: FH,
      grounded: true, coyote: 0,
      squash: 1, run: 0,
      duck: false, flip: 0, spin: 0, thunder: 0,
      gun: 'knife', ammo: 0, smashed: 0
    };
    applySize(p);
    return p;
  }
  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }
  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const sz = sizeOf(kind);
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, homeY: y,
      t: rand(0, 1), fire: rand(0.2, 1.1),
      grounded: kind !== 'flyer',
      dead: false, hitN: 0,
      w: sz.w, h: sz.h
    };
  }
  function makeBoss(spec) {
    const hp = (spec.hp * (isAlley() ? 1.22 : 1)) | 0;
    const kind = spec.boss;
    return {
      id: uid++,
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: kind,
      t: 0, fire: 1.15, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0,
      w: kind === '堡心' ? 44 : kind === '雷首' ? 28 : 52,
      h: kind === '堡心' ? 44 : kind === '雷首' ? 42 : 40,
      name: kind
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = spec.w;
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
    if (isAlley() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'glass' || e[2] === 'turret' || isDrop(e[2])) continue;
        G.ents.push(makeEnt(e[0] + 36, e[1], e[2], e[3], e[4]));
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    const keepGun = G.player && playing() ? G.player.gun : 'knife';
    const keepAmmo = G.player && playing() ? G.player.ammo : 0;
    G.player = makePlayer(70, GY);
    if (!attract && keepAmmo > 0 && keepGun !== 'knife') {
      G.player.gun = keepGun;
      G.player.ammo = keepAmmo;
    }
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.4;
    G.clearT = 0;
    G.lock = 0;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.slashT = 0;
    jumpQueued = false;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
      trails.length = 0;
      slashes.length = 0;
    }
    syncHud();
  }

  function platUnder(x, fy, ignore) {
    let best = null;
    let i;
    for (i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 4 || x > p.x + p.w - 4) continue;
      if (p.y < fy - 2) continue;
      if (!best || p.y < best.y) best = p;
    }
    return best;
  }
  function landOn(x, y0, y1, ignore) {
    const plat = platUnder(x, y0 + 2, ignore);
    if (plat && y1 >= plat.y && y0 <= plat.y + 10) return plat;
    return null;
  }
  function standAt(x, y) {
    const plat = platUnder(x, y - 8, null);
    return plat ? plat.y : GY;
  }
  function pitAhead(x, y, face) {
    const nx = x + face * 18;
    const plat = platUnder(nx, y - 4, null);
    return !plat || plat.y > y + 8;
  }
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.5, y: p.y - p.h, w: p.w, h: p.h };
  }
  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > -40 && y < VH + 40;
  }
  function countShots(from) {
    let n = 0;
    let i;
    for (i = 0; i < G.shots.length; i++) if (G.shots[i].from === from) n += 1;
    return n;
  }
  function spawnShot(s) {
    G.shots.push(s);
    capArr(G.shots, 48);
  }
  function enemyShoot(e, dx, dy, spd, kind) {
    const len = hypot(dx, dy) || 1;
    spawnShot({
      x: e.x, y: e.y - e.h * 0.55,
      vx: dx / len * spd, vy: dy / len * spd,
      life: 2.4, from: 'e', kind: kind || 'e',
      dmg: 1, pierce: false, hit: [], grav: kind === 'bomb' ? 420 : 0,
      w: kind === 'bomb' ? 7 : 4
    });
  }
  function aimDir(p) {
    if (inU() && !(p.grounded && p.duck)) return { x: 0, y: -1 };
    if (inD() && !p.grounded) return { x: 0, y: 1 };
    return { x: p.face, y: 0 };
  }
  function meleeTarget() {
    const p = G.player;
    const reach = 30;
    const x0 = p.face > 0 ? p.x : p.x - reach;
    const box = { x: x0, y: p.y - p.h - 4, w: reach, h: p.h + 8 };
    let best = null;
    let bestD = 999;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead || isDrop(e.kind)) continue;
      if (!overlap(box.x, box.y, box.w, box.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) continue;
      const d = Math.abs(e.x - p.x);
      if (d < bestD) { best = e; bestD = d; }
    }
    const b = G.boss;
    if (b && b.active && !b.dead) {
      if (overlap(box.x, box.y, box.w, box.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h)) {
        if (Math.abs(b.x - p.x) < bestD) best = b;
      }
    }
    return best;
  }

  function doSlash() {
    const p = G.player;
    if (G.fireCd > 0) return;
    G.fireCd = 0.14;
    G.slashT = 0.12;
    slashes.push({ x: p.x, y: p.y - p.h * 0.45, face: p.face, t: 0 });
    capArr(slashes, 8);
    audio.knife();
    const x0 = p.face > 0 ? p.x : p.x - 32;
    const box = { x: x0, y: p.y - p.h - 6, w: 32, h: p.h + 10 };
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead || isDrop(e.kind)) continue;
      if (!overlap(box.x, box.y, box.w, box.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) continue;
      if (e.kind === 'glass') smashEnt(e, 'slash');
      else hurtEnt(e, 1, null, 'slash');
    }
    const b = G.boss;
    if (b && b.active && !b.dead) {
      if (overlap(box.x, box.y, box.w, box.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h)) {
        hurtBoss(1, null);
      }
    }
  }

  function tryShoot() {
    const p = G.player;
    if (!p || G.deadT > 0 || G.lock > 0) return;
    if (G.fireCd > 0) return;
    const near = meleeTarget();
    const empty = p.gun === 'knife' || p.ammo <= 0;
    if (empty || (near && near.kind !== 'turret' && p.gun !== 'bolt')) {
      doSlash();
      return;
    }
    const cap = p.gun === 'rifle' ? 8 : p.gun === 'bolt' ? 3 : 5;
    if (countShots('p') >= cap) return;
    const dir = aimDir(p);
    const gun = p.gun;
    const bolt = gun === 'bolt';
    const spd = bolt ? 280 : gun === 'rifle' ? 600 : 540;
    spawnShot({
      x: p.x + p.face * 12,
      y: p.y - p.h * (p.duck ? 0.55 : 0.62),
      vx: dir.x * spd, vy: dir.y * spd,
      life: bolt ? 1.6 : 0.9,
      from: 'p', kind: gun,
      dmg: bolt ? 3 : 1,
      pierce: gun === 'rifle',
      hit: [], grav: bolt ? 180 : 0,
      w: bolt ? 8 : 4
    });
    p.ammo -= 1;
    if (p.ammo <= 0) {
      p.gun = 'knife';
      p.ammo = 0;
      if (playing()) toast('没弹了', true, false);
    }
    G.fireCd = gunRate(gun);
    G.muzzle = bolt ? 0.08 : 0.045;
    audio.shot(gun);
    syncHud();
  }

  function grabDrop(e) {
    if (!e || e.dead || !isDrop(e.kind)) return;
    const p = G.player;
    e.dead = true;
    const keep = p.gun === e.kind ? p.ammo : 0;
    p.gun = e.kind;
    p.ammo = Math.min(AMMO_CAP[e.kind], keep + AMMO[e.kind]);
    if (playing()) {
      bumpCombo();
      addScore((80 * G.mult) | 0);
      floatText(p.x, p.y - 40, GUN_NAME[e.kind], GOLD, true);
      toast('捡到' + GUN_NAME[e.kind], false, true);
      audio.pickup();
      popSpark(e.x, e.y - 8, GOLD, 12);
      hitStop(0.04);
      kick(2.4, 'pickup');
      screenFlash(GOLD, 0.18);
    }
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    const p = G.player;
    if (p.flip > 0 || p.thunder > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    p.vy = -160;
    p.flip = 0;
    p.thunder = 0;
    boomAt(p.x, p.y - 16, why === 'crash' ? 1.6 : 1.3, MAG);
    audio.death();
    hitStop(0.074);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    syncHud();
  }
  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    toast('重生', true, false);
    syncHud();
  }
  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入裂隙了'
      : G.why === 'crash' || G.why === 'touch' ? '撞上了'
        : '中弹了';
    showOverlay('lose', '雷狐折了', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }
  function goWin() {
    addScore(isAlley() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isAlley() ? '狐巷得手' : '王座捣毁了',
      (isAlley() ? '狐巷打穿三关。' : '雷狐打穿王座。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }
  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepGun = G.player ? G.player.gun : 'knife';
    const keepAmmo = G.player ? G.player.ammo : 0;
    loadStage(G.stage + 1, false);
    G.player.gun = keepGun;
    G.player.ammo = keepAmmo;
    G.invuln = 1.05;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }
  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'alley' ? 'alley' : 'raid';
    G.lives = LIVES;
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
    G.bolt = 0;
    keys.fire = false;
    ptrFire = false;
    jumpQueued = false;
    G.player = makePlayer(70, GY);
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isAlley() ? '狐巷' : STAGES[0].name, false, !isAlley());
    syncHud();
  }
  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.bolt = 0;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '雷狐', '向右跑、开火、空翻。空翻能碾兵碎玻璃，贴上去会撞死。短关之后是关底。');
    syncHud();
  }
  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }
  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function smashEnt(e, how) {
    if (!e || e.dead) return;
    e.dead = true;
    e.hp = 0;
    bumpCombo();
    const glass = e.kind === 'glass';
    const smash = how === 'smash' || how === 'thunder';
    const base = SCORE[e.kind] || 80;
    const mul = smash ? 1.5 : 1;
    const n = (base * mul * G.mult) | 0;
    addScore(n);
    const tag = glass ? '碎' : smash ? '碾' : how === 'slash' ? '斩' : String(n);
    floatText(e.x, e.y - e.h, tag + (smash || glass ? ' ' + n : ''), glass ? CYN : smash ? GOLD : HOT, smash || glass);
    boomAt(e.x, e.y - e.h * 0.5, glass ? 0.7 : smash ? 1.1 : 0.85, glass ? CYN : smash ? GOLD : HOT);
    if (glass) audio.glass();
    else if (smash) audio.smash();
    else audio.boom();
    hitStop(smash ? 0.07 : glass ? 0.05 : 0.046);
    fillBolt(glass ? 0.16 : smash ? 0.22 : 0.1);
    if (how === 'thunder') {
      emit(8, {
        x: e.x, y: e.y - 10, j: 10,
        vx0: -160, vx1: 160, vy0: -240, vy1: 20,
        life: 0.24, r0: 1, r1: 2.6, rgb: CYN, g: 80
      });
    }
  }

  function hurtEnt(e, dmg, shot, how) {
    if (!e || e.dead || isDrop(e.kind)) return;
    if (e.kind === 'glass') {
      smashEnt(e, how || 'shot');
      return;
    }
    e.hp -= dmg;
    e.hitN = 0.08;
    const px = shot ? shot.x : e.x;
    const py = shot ? shot.y : e.y - e.h * 0.5;
    emit(6, {
      x: px, y: py, j: 5,
      vx0: -140, vx1: 140, vy0: -180, vy1: 20,
      life: 0.2, r0: 1, r1: 2.4, rgb: HOT, g: 200
    });
    popSpark(px, py, HOT, 10);
    if (e.hp <= 0) {
      smashEnt(e, how || 'shot');
    } else {
      bumpCombo();
      audio.hit(G.combo);
      hitStop(0.034 + Math.min(0.04, G.combo * 0.004));
      kick(1.6, 'hit');
      addScore((20 * G.mult) | 0);
    }
  }
  function hurtBoss(dmg, shot) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.1;
    bumpCombo();
    audio.hit(G.combo);
    const px = shot ? shot.x : b.x;
    const py = shot ? shot.y : b.y - 24;
    emit(8, {
      x: px, y: py, j: 8,
      vx0: -160, vx1: 160, vy0: -200, vy1: 20,
      life: 0.24, r0: 1.2, r1: 3, rgb: GOLD, g: 180
    });
    hitStop(0.042);
    kick(2.2, 'hit');
    fillBolt(0.06);
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      boomAt(b.x, b.y - 22, 1.8, GOLD);
      audio.boom();
      addScore((SCORE.boss * G.mult) | 0);
      addScore((SCORE.stage * G.stage * G.mult) | 0);
      floatText(b.x, b.y - 50, '击破', GOLD, true);
      toast(b.name + ' 击破', false, true);
      G.clearT = 1.35;
      G.lock = 0.4;
      screenFlash(GOLD, 0.4);
      hitStop(0.08);
    }
  }

  function explodeBolt(s) {
    boomAt(s.x, s.y, 1.25, CYN);
    audio.boom();
    hitStop(0.06);
    const rad = 38;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead || isDrop(e.kind)) continue;
      if (hypot(e.x - s.x, e.y - e.h * 0.5 - s.y) > rad) continue;
      hurtEnt(e, 2, s, 'shot');
    }
    const b = G.boss;
    if (b && b.active && !b.dead && hypot(b.x - s.x, b.y - 20 - s.y) < rad + 10) {
      hurtBoss(3, s);
    }
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.d = false;
    demo.fire = true;
    demo.jump = (pitAhead(p.x, p.y, 1) && p.grounded) || (!p.grounded && p.vy < 40);
    demo.u = false;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'glass' && e.x > p.x && e.x - p.x < 70 && p.grounded) demo.jump = true;
      if (e.kind === 'flyer' && e.x > p.x && e.x - p.x < 160) demo.u = true;
    }
    if (p.x > G.levelW - 280 || p.y > VH + 20) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.bolt = 0;
    }
  }

  function resolveGlassX(prevX) {
    const p = G.player;
    const smashNow = p.flip > 0 || p.thunder > 0;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead || e.kind !== 'glass') continue;
      if (!overlap(p.x - p.w * 0.5, p.y - p.h, p.w, p.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) continue;
      if (smashNow) {
        smashEnt(e, p.thunder > 0 ? 'thunder' : 'smash');
        continue;
      }
      if (prevX < e.x) p.x = e.x - e.w * 0.5 - p.w * 0.5 - 0.2;
      else p.x = e.x + e.w * 0.5 + p.w * 0.5 + 0.2;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.4;
      p.squash = 1.16;
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

    p.duck = p.grounded && inD() && !inU() && p.flip <= 0;
    applySize(p);

    const wantJump = jumpHeld();
    if (wantJump) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump) {
      const hi = inU();
      const thunder = G.bolt >= 1;
      p.vy = -(hi || thunder ? JUMP_HI : JUMP_V);
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      jumpQueued = false;
      p.duck = false;
      applySize(p);
      p.squash = 0.78;
      p.flip = thunder ? 0.62 : FLIP_T;
      p.spin = 0;
      p.smashed = 0;
      if (thunder) {
        p.thunder = 0.58;
        G.bolt = 0;
        G.invuln = Math.max(G.invuln, 0.58);
        if (playing()) {
          toast('雷翻', false, true);
          audio.thunder();
          screenFlash(CYN, 0.28);
          popRing(p.x, p.y - 18, CYN);
          hitStop(0.05);
        }
        syncHud();
      } else if (playing()) audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.2, r0: 1, r1: 2.2, rgb: thunder ? CYN : WHT, g: 200
      });
      hitStop(0.026);
    }
    if (!wantJump && jumpHeldPrev && p.vy < -80 && G.mode !== 'title') p.vy *= 0.42;
    jumpHeldPrev = wantJump;

    const spd = WALK * (p.grounded ? 1 : AIR) * (p.thunder > 0 ? 1.18 : 1);
    p.vx = ax * spd;
    const prevX = p.x;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }
    resolveGlassX(prevX);

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, null);
      if (plat) {
        y1 = plat.y;
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
        if (p.squash < 1) p.squash = 1.12;
        if (playing() && y0 < plat.y - 8) audio.land();
        if (playing() && plat.base) {
          G.checkX = p.x;
          G.checkY = plat.y;
        }
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.flip > 0) {
      p.flip -= dt;
      p.spin += 16 * dt * p.face;
      if (p.grounded && p.flip < 0.12) p.flip = 0;
    }
    if (p.thunder > 0) p.thunder -= dt;

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0008, dt));
    if (ax && p.grounded) p.run += dt * 10;
    else p.run *= Math.pow(0.2, dt * 8);

    if (p.flip > 0 || p.thunder > 0) {
      trails.push({
        x: p.x, y: p.y, t: 0, face: p.face,
        squash: p.squash, spin: p.spin, thunder: p.thunder > 0, h: p.h
      });
      capArr(trails, 14);
    }

    if (p.y > VH + 36) die('fall');

    if (fireHeld()) tryShoot();
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (isDrop(e.kind)) {
      e.t += dt;
      e.y = e.homeY - 4 - Math.sin(e.t * 4) * 3;
      return;
    }
    if (e.kind === 'glass') {
      e.t += dt;
      return;
    }
    if (!onScreen(e.x, e.y, 80)) {
      e.fire = Math.max(e.fire, 0.2);
      return;
    }
    e.t += dt;
    e.fire -= dt;
    e.hitN = Math.max(0, e.hitN - dt);
    const mul = spdMul(isAlley(), G.stage);
    const p = G.player;
    if (e.kind === 'flyer') {
      e.x += Math.sin(e.t * 1.4) * 28 * dt * (e.face || 1);
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = e.homeY + Math.sin(e.t * 2.2) * 16;
      if (e.fire <= 0 && playing()) {
        enemyShoot(e, p.x - e.x, p.y - 16 - e.y, 150 * mul, 'e');
        e.fire = (isAlley() ? 1.05 : 1.45) / mul;
      }
      return;
    }
    if (e.kind === 'turret') {
      if (e.fire <= 0 && playing()) {
        enemyShoot(e, p.x - e.x, p.y - 18 - (e.y - e.h * 0.4), 170 * mul, 'e');
        e.fire = (isAlley() ? 0.85 : 1.2) / mul;
      }
      return;
    }
    let spd = e.kind === 'brute' ? 38 : e.kind === 'runner' ? 92 : 48;
    spd *= mul;
    if (e.kind === 'runner' && p && Math.abs(p.x - e.x) < 240) {
      e.face = p.x < e.x ? -1 : 1;
      spd = 132 * mul;
    } else if (e.a !== e.b) {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    e.x += e.face * spd * dt;
    if (e.kind !== 'runner' && pitAhead(e.x, e.y, e.face)) e.face *= -1;
    if (e.fire <= 0 && playing() && e.kind !== 'runner') {
      const aimX = p.x - e.x;
      const aimY = p.y - 16 - (e.y - e.h * 0.5);
      enemyShoot(e, aimX, e.kind === 'brute' ? 0 : aimY * 0.4, (e.kind === 'brute' ? 180 : 160) * mul, 'e');
      e.fire = ((e.kind === 'brute' ? 1.1 : 1.35) * (isAlley() ? 0.78 : 1)) / mul;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    if (!b.active) {
      if (p.x > G.levelW - VW + 70) {
        b.active = true;
        b.state = 'fight';
        b.fire = 0.6;
        toast(b.name, false, true);
        audio.boss();
        kick(3.6, 'thump');
      }
      return;
    }
    b.t += dt;
    b.fire -= dt;
    b.hitN = Math.max(0, b.hitN - dt);
    const mul = spdMul(isAlley(), G.stage);
    const low = b.hp < b.max * 0.5;
    const left = G.levelW - VW + 70;
    const right = G.levelW - 70;

    if (b.kind === '堡心') {
      b.x = lerp(b.x, G.levelW - 160 + Math.sin(b.t * 1.1) * 70, 1 - Math.pow(0.2, dt * 3));
      b.y = GY - 90 + Math.sin(b.t * 1.7) * 36;
      if (b.fire <= 0) {
        const n = low ? 6 : 4;
        let i;
        for (i = 0; i < n; i++) {
          const ang = (i / n) * TAU + b.t;
          enemyShoot(b, Math.cos(ang), Math.sin(ang), 160 * mul, 'e');
        }
        if (low) enemyShoot(b, p.x - b.x, p.y - 18 - b.y, 210 * mul, 'e');
        b.fire = (low ? 0.7 : 1.02) / mul;
      }
    } else if (b.kind === '雷首') {
      if (b.x < left) b.face = 1;
      if (b.x > right) b.face = -1;
      b.x += b.face * 62 * mul * dt;
      b.y = GY;
      if (b.fire <= 0) {
        enemyShoot(b, p.x - b.x, p.y - 20 - (b.y - 24), 200 * mul, 'e');
        enemyShoot(b, -b.face, -0.35, 190 * mul, 'e');
        if (low) {
          enemyShoot(b, p.x - b.x, -70, 150 * mul, 'bomb');
          let living = 0;
          let k;
          for (k = 0; k < G.ents.length; k++) {
            if (!G.ents[k].dead && G.ents[k].kind === 'grunt') living += 1;
          }
          if (living < 4 && Math.random() < 0.4) {
            G.ents.push(makeEnt(b.x - 40, GY, 'grunt', left, right));
          }
        }
        b.fire = (low ? 0.68 : 0.96) / mul;
      }
    } else {
      b.x = lerp(b.x, G.levelW - 130, 1 - Math.pow(0.2, dt * 3));
      b.y = GY;
      if (b.fire <= 0) {
        enemyShoot({ x: b.x - 22, y: GY, h: 36 }, -1, 0, 210 * mul, 'e');
        enemyShoot(b, -0.9, -0.42, 190 * mul, 'e');
        if (low) enemyShoot(b, p.x - b.x, -80, 150 * mul, 'bomb');
        b.fire = (low ? 0.7 : 1.0) / mul;
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y > VH + 40 || s.x < G.camX - 40 || s.x > G.camX + VW + 80) {
        if (s.from === 'p' && s.kind === 'bolt') explodeBolt(s);
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let consumed = false;
        if (G.boss && G.boss.active && !G.boss.dead) {
          const b = G.boss;
          if (overlap(s.x - 3, s.y - 3, 6, 6, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h)) {
            if (s.hit.indexOf(b.id) < 0) {
              s.hit.push(b.id);
              if (s.kind === 'bolt') {
                explodeBolt(s);
                G.shots.splice(i, 1);
                continue;
              }
              hurtBoss(s.dmg, s);
              if (!s.pierce) consumed = true;
            }
          }
        }
        if (!consumed) {
          for (let j = 0; j < G.ents.length; j++) {
            const e = G.ents[j];
            if (e.dead || isDrop(e.kind)) continue;
            if (!overlap(s.x - 3, s.y - 3, 6, 6, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) continue;
            if (s.hit.indexOf(e.id) >= 0) continue;
            s.hit.push(e.id);
            if (s.kind === 'bolt') {
              explodeBolt(s);
              consumed = true;
              break;
            }
            hurtEnt(e, s.dmg, s, 'shot');
            if (!s.pierce) {
              consumed = true;
              break;
            }
          }
        }
        if (consumed) G.shots.splice(i, 1);
      } else if (playing() && G.deadT <= 0) {
        const p = G.player;
        const pb = pBox();
        let hitY = pb.y;
        let hitH = pb.h;
        if (s.kind !== 'bomb' && p.duck && p.grounded && s.y < p.y - 18) {
          hitY = p.y - 8;
          hitH = 8;
        }
        if (overlap(s.x - 3, s.y - 3, 6, 6, pb.x, hitY, pb.w, hitH)) {
          G.shots.splice(i, 1);
          die('hit');
        }
      }
    }
  }

  function collideBodies() {
    if (!playing() || G.deadT > 0 || G.lock > 0) return;
    const p = G.player;
    const pb = pBox();
    const flipping = p.flip > 0 || p.thunder > 0;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (!overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) continue;
      if (isDrop(e.kind)) {
        grabDrop(e);
        continue;
      }
      if (e.kind === 'glass') continue;
      if (flipping && smashable(e.kind)) {
        smashEnt(e, p.thunder > 0 ? 'thunder' : 'smash');
        continue;
      }
      if (flipping && solidish(e.kind) && p.thunder > 0) {
        hurtEnt(e, 2, null, 'thunder');
        continue;
      }
      if (flipping && solidish(e.kind)) {
        hurtEnt(e, 1, null, 'smash');
        p.vy = -220;
        p.flip = Math.max(p.flip, 0.18);
        continue;
      }
      die('crash');
      return;
    }
    const b = G.boss;
    if (b && b.active && !b.dead) {
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h)) {
        if (flipping && p.thunder > 0 && p.smashed !== b.id) {
          p.smashed = b.id;
          hurtBoss(2, null);
          p.vy = -240;
        } else if (flipping) {
          p.vy = -200;
          if (p.smashed !== b.id) {
            p.smashed = b.id;
            hurtBoss(1, null);
          }
        } else {
          die('crash');
        }
      }
    }
  }

  function updateFx(dt) {
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.28) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > 0.16) trails.splice(i, 1);
    }
    for (i = slashes.length - 1; i >= 0; i--) {
      slashes[i].t += dt;
      if (slashes[i].t > 0.16) slashes.splice(i, 1);
    }
    if (G.slashT > 0) G.slashT -= dt;
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - 180;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    G.camY = 0;
    if (G.shake > 0 && !REDUCE) {
      G.camX += rand(-G.shake, G.shake) * 0.35;
      G.camY += rand(-G.shake, G.shake) * 0.22;
      G.shake *= Math.pow(0.04, dt * 8);
      if (G.shake < 0.08) G.shake = 0;
    }
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.002, dt));
  }

  function tick(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.flash > 0) G.flash -= dt * 1.8;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    collideBodies();
    updateFx(dt);
    updateCam(dt);
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0 && playing()) nextStage();
    }
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'sky') {
      g.addColorStop(0, '#1a1428');
      g.addColorStop(0.5, '#12081a');
      g.addColorStop(1, '#0c0610');
    } else if (spec.theme === 'throne') {
      g.addColorStop(0, '#241008');
      g.addColorStop(0.5, '#160806');
      g.addColorStop(1, '#0c0404');
    } else {
      g.addColorStop(0, '#1a1018');
      g.addColorStop(0.5, '#14080c');
      g.addColorStop(1, '#0c0608');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }
  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.22;
    let i;
    for (i = 0; i < 18; i++) {
      const hsh = hash2(i * 17 + spec.w);
      const x = sx((i * 220 - par + spec.w) % (G.levelW + 200) - 40);
      const h = (40 + hsh * 90) * scale;
      const w = (28 + hsh * 50) * scale;
      ctx.fillStyle = spec.theme === 'throne'
        ? rgba([52, 24, 16], 0.62)
        : spec.theme === 'sky'
          ? rgba([36, 22, 48], 0.55)
          : rgba(IRON, 0.58);
      ctx.fillRect(x, sy(GY) - h, w, h);
      ctx.fillStyle = rgba(i % 2 ? CYN : HOT, 0.14 + hsh * 0.18);
      ctx.fillRect(x + w * 0.2, sy(GY) - h + 10 * scale, w * 0.22, 8 * scale);
      ctx.fillRect(x + w * 0.55, sy(GY) - h + 22 * scale, w * 0.22, 8 * scale);
    }
    if (spec.theme === 'sky') {
      for (i = 0; i < 7; i++) {
        const x = sx(140 + i * 280 - par * 0.5);
        ctx.strokeStyle = rgba(CYN, 0.16);
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(x, sy(60));
        ctx.lineTo(x, sy(GY));
        ctx.stroke();
        ctx.fillStyle = rgba(STL, 0.4);
        ctx.fillRect(x - 22 * scale, sy(80), 80 * scale, 8 * scale);
      }
    }
    if (spec.theme === 'throne') {
      for (i = 0; i < 6; i++) {
        const x = sx(200 + i * 320 - par * 0.4);
        ctx.fillStyle = rgba(GOLD, 0.12);
        ctx.fillRect(x, sy(90), 18 * scale, (GY - 90) * scale);
        ctx.fillStyle = rgba(HOT, 0.18);
        ctx.fillRect(x + 4 * scale, sy(110), 10 * scale, 22 * scale);
      }
    }
    if (spec.theme === 'rain' && !REDUCE) {
      ctx.strokeStyle = rgba(PANE, 0.22);
      ctx.lineWidth = 1 * scale;
      for (i = 0; i < 28; i++) {
        const rx = ((i * 47 + G.clock * 220 + G.camX * 0.4) % (VW + 40));
        const ry = ((i * 73 + G.clock * 340) % (VH + 20));
        ctx.beginPath();
        ctx.moveTo(ox + rx * scale, oy + ry * scale);
        ctx.lineTo(ox + (rx + 4) * scale, oy + (ry + 14) * scale);
        ctx.stroke();
      }
    }
    ctx.fillStyle = spec.theme === 'sky' ? rgba([24, 16, 36], 0.45) : rgba(RAIN, 0.28);
    ctx.fillRect(ox, sy(GY + 6), VW * scale, (VH - GY) * scale);
    const segs = spec.ground;
    ctx.fillStyle = rgba(CYN, 0.1);
    for (i = 0; i < segs.length - 1; i++) {
      const a = segs[i];
      const b = segs[i + 1];
      const x0 = a[0] + a[1];
      const x1 = b[0];
      if (x1 > x0 + 8) {
        ctx.fillStyle = rgba(MAG, 0.18);
        ctx.fillRect(sx(x0), sy(GY + 2), (x1 - x0) * scale, 40 * scale);
        ctx.fillStyle = rgba(CYN, 0.1 + 0.06 * Math.sin(G.clock * 2 + i));
        ctx.fillRect(sx(x0), sy(GY + 8), (x1 - x0) * scale, 6 * scale);
      }
    }
  }
  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      if (p.base) {
        ctx.fillStyle = rgba(IRON, 1);
        ctx.fillRect(x, y, w, 42 * scale);
        ctx.fillStyle = rgba(HOT, 0.55);
        ctx.fillRect(x, y, w, 4 * scale);
        ctx.fillStyle = rgba(RUST, 0.45);
        let k;
        for (k = 0; k < p.w; k += 18) {
          ctx.fillRect(x + k * scale, y + 8 * scale, 10 * scale, 6 * scale);
        }
      } else {
        ctx.fillStyle = rgba(STL, 0.95);
        roundRect(x, y, w, 10 * scale, 3 * scale);
        ctx.fill();
        ctx.fillStyle = rgba(CYN, 0.3);
        ctx.fillRect(x, y, w, 2 * scale);
      }
    }
  }

  function drawFox(p, ghost) {
    const f = p.face || 1;
    const s = scale * (ghost ? 0.9 : 1);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(f, p.squash || 1);
    if (p.spin) ctx.rotate(p.spin);
    const h = (p.h || FH) * s;
    const blink = G.invuln > 0 && ((G.clock * 18) | 0) % 2 === 0;
    if (blink && !ghost && playing()) ctx.globalAlpha = 0.42;
    if (p.thunder > 0 && !ghost) {
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, -h * 0.5, 16 * s, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(FOX, ghost ? 0.45 : 1);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -h - 2 * s);
    ctx.lineTo(-2 * s, -h + 6 * s);
    ctx.lineTo(-8 * s, -h + 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT2, ghost ? 0.5 : 1);
    ctx.beginPath();
    ctx.moveTo(6 * s, -h - 2 * s);
    ctx.lineTo(8 * s, -h + 6 * s);
    ctx.lineTo(1 * s, -h + 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, ghost ? 0.45 : 1);
    ctx.fillRect(-5 * s, -h + 4 * s, 10 * s, h * 0.48);
    ctx.fillStyle = rgba(GOLD, ghost ? 0.5 : 1);
    ctx.beginPath();
    ctx.arc(0, -h + 6 * s, 5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.fillRect(0, -h + 4 * s, 5.4 * s, 3.2 * s);
    ctx.fillStyle = rgba(p.gun === 'bolt' ? GOLD : HOT2, 1);
    ctx.fillRect(4 * s, -h * 0.55, ghost ? 0 : 12 * s, 2.2 * s);
    if (G.muzzle > 0 && !ghost) {
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(14 * s, -h * 0.6, 8 * s, 4 * s);
    }
    if (G.slashT > 0 && !ghost) {
      ctx.strokeStyle = rgba(CYN, 0.85);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(8 * s, -h * 0.4, 14 * s, -0.8, 0.6);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(IRON, 1);
    const leg = Math.sin(p.run || 0) * 4 * s;
    ctx.fillRect(-5 * s, -h * 0.38, 4 * s, h * 0.38 + leg);
    ctx.fillRect(1 * s, -h * 0.38, 4 * s, h * 0.38 - leg);
    ctx.restore();
  }

  function drawPlayer() {
    const p = G.player;
    if (!p) return;
    if (G.deadT > 0) ctx.globalAlpha = clamp(G.deadT / DIE_T, 0, 1);
    drawFox(p, false);
    ctx.globalAlpha = 1;
  }

  function drawEnt(e) {
    if (e.dead || !onScreen(e.x, e.y, 30)) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    if (e.hitN > 0) {
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.fillRect(x - e.w * 0.6 * s, y - e.h * s, e.w * 1.2 * s, e.h * s);
    }
    if (isDrop(e.kind)) {
      ctx.save();
      ctx.translate(x, y - 6 * s);
      ctx.fillStyle = rgba(e.kind === 'bolt' ? GOLD : e.kind === 'rifle' ? HOT : LEAF, 0.95);
      roundRect(-8 * s, -6 * s, 16 * s, 10 * s, 3 * s);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(-2 * s, -3 * s, 10 * s, 2 * s);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(GUN_NAME[e.kind], 0, -10 * s);
      ctx.restore();
      return;
    }
    if (e.kind === 'glass') {
      const shine = 0.35 + 0.2 * Math.sin(G.clock * 3 + e.x * 0.02);
      ctx.fillStyle = rgba(PANE, shine);
      ctx.fillRect(x - 5 * s, y - e.h * s, 10 * s, e.h * s);
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.4 * s;
      ctx.strokeRect(x - 5 * s, y - e.h * s, 10 * s, e.h * s);
      ctx.fillStyle = rgba(WHT, 0.35);
      ctx.fillRect(x - 2 * s, y - e.h * s + 6 * s, 3 * s, 10 * s);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    if (e.kind === 'flyer') {
      ctx.fillStyle = rgba(MAG, 1);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 10 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(-12 * s, -8 * s, 24 * s, 2 * s);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(-3 * s, -10 * s, 6 * s, 3 * s);
    } else if (e.kind === 'turret') {
      ctx.fillStyle = rgba(STL, 1);
      ctx.fillRect(-9 * s, -16 * s, 18 * s, 16 * s);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(-9 * s, -16 * s, 18 * s, 3 * s);
      ctx.fillStyle = rgba(IRON, 1);
      ctx.fillRect(0, -12 * s, 12 * s, 3 * s);
    } else if (e.kind === 'brute') {
      ctx.fillStyle = rgba(RUST, 1);
      roundRect(-10 * s, -28 * s, 20 * s, 20 * s, 3 * s);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 4 * s);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(-5 * s, -22 * s, 8 * s, 5 * s);
      ctx.fillStyle = rgba(IRON, 1);
      ctx.fillRect(-8 * s, -10 * s, 6 * s, 10 * s);
      ctx.fillRect(2 * s, -10 * s, 6 * s, 10 * s);
    } else if (e.kind === 'runner') {
      ctx.fillStyle = rgba(MAG, 1);
      ctx.fillRect(-5 * s, -20 * s, 10 * s, 14 * s);
      ctx.fillStyle = rgba(HOT2, 1);
      ctx.beginPath();
      ctx.arc(0, -22 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(IRON, 1);
      const lg = Math.sin(e.t * 14) * 3 * s;
      ctx.fillRect(-5 * s, -8 * s, 4 * s, 8 * s + lg);
      ctx.fillRect(1 * s, -8 * s, 4 * s, 8 * s - lg);
    } else {
      ctx.fillStyle = rgba([120, 48, 48], 1);
      ctx.fillRect(-5 * s, -18 * s, 10 * s, 12 * s);
      ctx.fillStyle = rgba(HOT2, 1);
      ctx.beginPath();
      ctx.arc(0, -20 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(STL, 1);
      ctx.fillRect(2 * s, -14 * s, 8 * s, 2 * s);
      ctx.fillStyle = rgba(IRON, 1);
      ctx.fillRect(-5 * s, -8 * s, 4 * s, 8 * s);
      ctx.fillRect(1 * s, -8 * s, 4 * s, 8 * s);
    }
    ctx.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || !onScreen(b.x, b.y, 80)) return;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale;
    if (b.hitN > 0) {
      ctx.fillStyle = rgba(WHT, 0.4);
      ctx.fillRect(x - b.w * 0.6 * s, y - b.h * s, b.w * 1.2 * s, b.h * s);
    }
    ctx.save();
    ctx.translate(x, y);
    if (b.kind === '堡心') {
      ctx.fillStyle = rgba(CYN, 0.25);
      ctx.beginPath();
      ctx.arc(0, -22 * s, 28 * s + Math.sin(G.clock * 4) * 3 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([48, 24, 72], 1);
      ctx.beginPath();
      ctx.arc(0, -22 * s, 20 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, -22 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.8);
      ctx.lineWidth = 2 * s;
      ctx.stroke();
    } else if (b.kind === '雷首') {
      ctx.fillStyle = rgba(HOT, 1);
      ctx.fillRect(-10 * s, -40 * s, 20 * s, 24 * s);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.arc(0, -44 * s, 7 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(FOX, 1);
      ctx.beginPath();
      ctx.moveTo(-8 * s, -50 * s);
      ctx.lineTo(-2 * s, -42 * s);
      ctx.lineTo(-9 * s, -42 * s);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(1 * s, -47 * s, 6 * s, 3 * s);
      ctx.fillStyle = rgba(IRON, 1);
      ctx.fillRect(-8 * s, -16 * s, 6 * s, 16 * s);
      ctx.fillRect(2 * s, -16 * s, 6 * s, 16 * s);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.fillRect(8 * s, -30 * s, 16 * s, 3 * s);
    } else {
      ctx.fillStyle = rgba(RUST, 1);
      roundRect(-26 * s, -40 * s, 52 * s, 28 * s, 4 * s);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-26 * s, -40 * s, 52 * s, 5 * s);
      ctx.fillStyle = rgba(IRON, 1);
      ctx.fillRect(-22 * s, -14 * s, 12 * s, 14 * s);
      ctx.fillRect(8 * s, -14 * s, 12 * s, 14 * s);
      ctx.fillStyle = rgba(STL, 1);
      ctx.fillRect(-30 * s, -28 * s, 16 * s, 8 * s);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(-32 * s, -26 * s, 8 * s, 4 * s);
      if (b.active) {
        ctx.fillStyle = rgba(WHT, 0.7);
        ctx.fillRect(-6 * s, -36 * s, 8 * s, 6 * s);
      }
    }
    ctx.restore();
    if (b.active) {
      const ratio = clamp(b.hp / b.max, 0, 1);
      ctx.fillStyle = rgba(IRON, 0.7);
      ctx.fillRect(sx(b.x - 28), sy(b.y - b.h - 12), 56 * s, 5 * s);
      ctx.fillStyle = rgba(ratio < 0.35 ? MAG : GOLD, 0.95);
      ctx.fillRect(sx(b.x - 28), sy(b.y - b.h - 12), 56 * s * ratio, 5 * s);
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale;
    if (s.from === 'p') {
      if (s.kind === 'bolt') {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.arc(x, y, 5 * sc, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(CYN, 0.8);
        ctx.beginPath();
        ctx.arc(x, y, 2.4 * sc, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(s.kind === 'rifle' ? HOT : WHT, 1);
        ctx.fillRect(x - 4 * sc, y - 1.4 * sc, 8 * sc, 2.8 * sc);
      }
    } else {
      ctx.fillStyle = rgba(s.kind === 'bomb' ? MAG : HOT2, 1);
      ctx.beginPath();
      ctx.arc(x, y, (s.w || 3) * sc * 0.5, 0, TAU);
      ctx.fill();
    }
  }

  function drawFx() {
    let i;
    for (i = 0; i < trails.length; i++) {
      const t = trails[i];
      ctx.globalAlpha = 0.28 * (1 - t.t / 0.16);
      drawFox(t, true);
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const a = 1 - sp.t / 0.22;
      ctx.strokeStyle = rgba(sp.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(sp.x), sy(sp.y), (sp.r + sp.t * 40) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.28;
      ctx.strokeStyle = rgba(r.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < slashes.length; i++) {
      const sl = slashes[i];
      const a = 1 - sl.t / 0.16;
      ctx.strokeStyle = rgba(CYN, a);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(sl.x + sl.face * 10), sy(sl.y), (12 + sl.t * 40) * scale, sl.face > 0 ? -0.9 : Math.PI - 0.6, sl.face > 0 ? 0.7 : Math.PI + 0.9);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    for (i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + ((f.gold ? 13 : 11) * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.textAlign = 'left';
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#160806';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.punch !== 1) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W / 2, -H / 2);
    }
    drawSky();
    drawBackdrop();
    drawPlats();
    let i;
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawFx();
    drawPlayer();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash, 0, 0.5));
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
    ctx.fillStyle = '#160806';
    ctx.fillRect(0, 0, W, oy);
    ctx.fillRect(0, oy + VH * scale, W, H);
    ctx.fillRect(0, 0, ox, H);
    ctx.fillRect(ox + VW * scale, 0, W, H);
  }

  function resize() {
    if (!canvas || !canvas.parentElement) return;
    const wrap = canvas.parentElement;
    const rw = Math.max(1, wrap.clientWidth);
    const rh = Math.max(1, wrap.clientHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, (rw * dpr) | 0);
    canvas.height = Math.max(1, (rh * dpr) | 0);
    W = canvas.width;
    H = canvas.height;
    const fit = Math.min(rw / VW, rh / VH);
    scale = fit * dpr;
    ox = (W - VW * scale) / 2;
    oy = (H - VH * scale) / 2;
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    if (hidden) {
      last = now;
      requestAnimationFrame(frame);
      return;
    }
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      acc -= STEP;
      steps += 1;
      if (G.stop > 0) G.stop -= STEP;
      else tick(STEP);
    }
    draw();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const code = e.code || '';
    const key = e.key || '';
    if (code === 'KeyR' || key === 'r' || key === 'R') {
      if (down) {
        e.preventDefault();
        restart();
      }
      return;
    }
    if (code === 'KeyM' || key === 'm' || key === 'M') {
      if (down) {
        e.preventDefault();
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    }
    if (down && (code === 'Enter' || code === 'NumpadEnter' || code === 'Digit1' || code === 'Numpad1')) {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title') startGame('raid');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      return;
    }
    if (down && (code === 'Digit2' || code === 'Numpad2')) {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title') startGame('alley');
      return;
    }
    if (code === 'Space') {
      e.preventDefault();
      if (down && overlayBlocksPlay()) {
        primaryAction();
        return;
      }
      keys.fire = down;
      return;
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ') {
      e.preventDefault();
      keys.jump = down;
      if (down) jumpQueued = true;
      return;
    }
    if (code === 'ArrowLeft' || code === 'KeyA') {
      e.preventDefault();
      keys.l = down;
      return;
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      e.preventDefault();
      keys.r = down;
      return;
    }
    if (code === 'ArrowUp' || code === 'KeyW') {
      e.preventDefault();
      keys.u = down;
      return;
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      e.preventDefault();
      keys.d = down;
    }
  }

  function bindPad(id, key) {
    const n = el(id);
    if (!n) return;
    const set = function (v) {
      keys[key] = v;
      n.classList.toggle('held', v);
    };
    n.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      n.setPointerCapture(e.pointerId);
      audio.ensure();
      set(true);
      if (key === 'jump') jumpQueued = true;
    });
    n.addEventListener('pointerup', function (e) {
      e.preventDefault();
      set(false);
    });
    n.addEventListener('pointercancel', function () { set(false); });
    n.addEventListener('lostpointercapture', function () { set(false); });
  }

  function bootMute() {
    try {
      audio.setMuted(localStorage.getItem(MUTE_KEY) === '1');
    } catch (err) {
      audio.setMuted(false);
    }
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      audio.ensure();
      ptrFire = true;
      if (overlayBlocksPlay()) primaryAction();
    });
    window.addEventListener('pointerup', function () { ptrFire = false; });
    window.addEventListener('pointercancel', function () { ptrFire = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = keys.fire = keys.jump = false;
    ptrFire = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.u = keys.d = keys.l = keys.r = keys.fire = keys.jump = false;
      ptrFire = false;
    }
  });
  window.addEventListener('resize', resize);

  if (btnRaid) btnRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
  if (btnAlley) btnAlley.addEventListener('click', function () { audio.ensure(); startGame('alley'); });
  if (modeRaid) modeRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
  if (modeAlley) modeAlley.addEventListener('click', function () { audio.ensure(); startGame('alley'); });
  if (ovAgain) ovAgain.addEventListener('click', function () { audio.ensure(); startGame(G.kind); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); goTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  bindPad('btn-left', 'l');
  bindPad('btn-right', 'r');
  bindPad('btn-jump', 'jump');
  bindPad('btn-fire', 'fire');
  bindPad('btn-duck', 'd');

  loadBest();
  bootMute();
  resize();
  goTitle();
  requestAnimationFrame(frame);
})();
