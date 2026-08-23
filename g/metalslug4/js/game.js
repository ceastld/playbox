'use strict';

/* 金弹4 — Metal Slug 4 remake.
   Rain city + ninja temple, Bradley APC, rocket/chaser, chute.
   Distinct from 金弹 (camel/flyer), 金弹3 (slug/swim/snow), 合金 (HP + eject). */

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 224;
  const AIR = 0.9;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const CHUTE_FALL = 95;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const INVULN = 1.2;
  const DIE_T = 0.82;
  const NADE_MAX = 20;
  const NADE_STAGE = 8;
  const NADE_CORE = 6;
  const BEST_KEY = 'playbox-metalslug4-best';
  const MUTE_KEY = 'playbox-metalslug4-mute';
  const OPS = '方向 / WASD 走跳 · 空格开火 · Shift/Z 手雷 · 空中↑伞降 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 138, 26];
  const HOT2 = [255, 192, 64];
  const WHT = [246, 236, 220];
  const LEAF = [61, 255, 122];
  const ORG = [255, 168, 64];
  const SKIN = [244, 214, 176];
  const NAVY = [36, 72, 140];
  const KHAKI = [196, 148, 58];
  const RUST = [168, 72, 36];
  const OLIVE = [72, 96, 48];
  const WINE = [120, 36, 72];
  const NEON = [255, 72, 160];
  const INK = [28, 16, 32];
  const LAB = [48, 64, 96];

  const GUN_NAME = { pistol: '手枪', R: '火箭', C: '追弹', bradley: '布雷德' };
  const WEAPONS = {
    pistol: { cd: 0.15, max: 4, spd: 560, dmg: 1, pierce: 0, life: 0.7, rgb: GOLD, grav: 0 },
    R: { cd: 0.28, max: 3, spd: 380, dmg: 2, pierce: 0, life: 0.82, rgb: HOT, grav: 210 },
    C: { cd: 0.22, max: 5, spd: 320, dmg: 1, pierce: 0, life: 1.18, rgb: CYN, grav: 0 },
    bradley: { cd: 0.16, max: 6, spd: 520, dmg: 2, pierce: 1, life: 0.68, rgb: NEON, grav: 0 }
  };

  const SCORE = {
    grunt: 100, slash: 150, turret: 250, mortar: 200,
    copter: 200, bike: 250, crate: 80,
    para: 160, ninja: 180, sci: 170,
    boss: 5000, stage: 2000
  };

  const STAGES = [
    {
      name: '欧巷', boss: '巷闸', theme: 'city', w: 2580, hp: 0,
      forkX: 780, highName: '屋脊', lowName: '雨街',
      ground: [[0, 740], [800, 700], [1620, 960]],
      plats: [
        [160, MY, 140], [420, MY, 150],
        [780, MY, 200], [1060, MY, 190], [1320, MY, 170], [1540, MY, 140],
        [500, HY, 110], [940, HY, 130], [1260, HY, 120],
        [1880, MY, 150], [2200, MY, 140],
        [2040, HY, 120]
      ],
      ents: [
        [260, GY, 'grunt', 40, 520],
        [430, GY, 'slash', 80, 540],
        [520, MY, 'turret', 0, 0],
        [680, GY, 'bike', 620, 860],
        [920, MY, 'para', 780, 1240],
        [1100, MY, 'grunt', 1080, 1280],
        [1240, HY, 'mortar', 0, 0],
        [980, GY, 'slash', 860, 1400],
        [1180, GY, 'grunt', 900, 1500],
        [1460, GY, 'bike', 1200, 1640],
        [1860, GY, 'slash', 1760, 2200],
        [2040, GY, 'turret', 0, 0],
        [2180, MY, 'para', 1880, 2340],
        [2320, GY, 'slash', 2000, 2460]
      ],
      rides: [[500, GY, 'bradley']],
      crates: [[700, GY, 'nade'], [1160, MY, 'R'], [1420, GY, 'R']],
      drops: [[1020, HY, 'R'], [2100, MY, 'nade']]
    },
    {
      name: '雨寺', boss: '寺闸', theme: 'temple', w: 2700, hp: 0,
      forkX: 700, highName: '廊上', lowName: '庭下',
      ground: [[0, 640], [720, 1080], [1900, 800]],
      plats: [
        [120, MY, 130], [380, MY, 140],
        [700, MY, 180], [980, MY, 180], [1260, MY, 170], [1540, MY, 150],
        [280, HY, 110], [880, HY, 130], [1360, HY, 140],
        [2040, MY, 160], [2360, MY, 140],
        [2200, HY, 120]
      ],
      ents: [
        [220, GY, 'sci', 20, 500],
        [400, GY, 'slash', 80, 560],
        [520, MY, 'ninja', 380, 620],
        [760, MY, 'ninja', 700, 1100],
        [980, MY, 'turret', 0, 0],
        [1180, HY, 'copter', 1080, 1420],
        [840, GY, 'sci', 720, 1200],
        [1060, GY, 'slash', 760, 1500],
        [1280, GY, 'ninja', 900, 1700],
        [1480, GY, 'turret', 0, 0],
        [1640, MY, 'sci', 1520, 1760],
        [1980, GY, 'slash', 1880, 2360],
        [2140, GY, 'ninja', 1960, 2400],
        [2280, MY, 'para', 2040, 2500],
        [2460, GY, 'mortar', 0, 0]
      ],
      rides: [[440, GY, 'bradley']],
      crates: [[580, GY, 'nade'], [1100, MY, 'C'], [1600, GY, 'C']],
      drops: [[1320, HY, 'C'], [2280, MY, 'nade']]
    },
    {
      name: '智核', boss: '智核坦', theme: 'lab', w: 2140, hp: 58,
      forkX: 0, highName: '', lowName: '',
      ground: [[0, 460], [560, 380], [1060, 1080]],
      plats: [
        [80, MY, 130], [320, MY, 150], [620, MY, 160],
        [980, MY, 170], [1360, MY, 180], [1720, MY, 150],
        [220, HY, 120], [720, HY, 140], [1220, HY, 150], [1580, HY, 140]
      ],
      ents: [
        [200, GY, 'grunt', 20, 400],
        [340, MY, 'sci', 80, 520],
        [480, GY, 'slash', 420, 720],
        [640, HY, 'copter', 560, 820],
        [820, GY, 'bike', 760, 1000],
        [980, GY, 'ninja', 920, 1280],
        [1140, MY, 'turret', 0, 0],
        [1280, GY, 'slash', 1100, 1540],
        [1440, HY, 'copter', 1280, 1640],
        [1600, MY, 'sci', 1480, 1760]
      ],
      rides: [[460, GY, 'bradley']],
      crates: [[700, GY, 'R'], [1240, MY, 'C']],
      drops: [[1080, HY, 'R']]
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
  function spdMul(core, stage) {
    return (core ? 1.26 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function norm8(dx, dy) {
    if (!dx && !dy) return { dx: 1, dy: 0 };
    const len = Math.sqrt(dx * dx + dy * dy);
    return { dx: dx / len, dy: dy / len };
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (NADE_CORE >= NADE_STAGE) throw new Error('core fewer nades');
    if (!WEAPONS.R || !WEAPONS.R.grav) throw new Error('rocket arc');
    if (!WEAPONS.C || WEAPONS.C.spd >= WEAPONS.pistol.spd) throw new Error('chaser slow');
    if (!WEAPONS.bradley) throw new Error('bradley gun');
    if (CHUTE_FALL >= 180) throw new Error('chute slow');
    if (BEST_KEY !== 'playbox-metalslug4-best') throw new Error('best key');
    if (STAGES[0].name !== '欧巷' || STAGES[1].name !== '雨寺' || STAGES[2].name !== '智核') {
      throw new Error('stage names');
    }
    if (!STAGES[0].forkX || !STAGES[1].forkX) throw new Error('routes');
    if (STAGES[0].theme !== 'city' || STAGES[1].theme !== 'temple') throw new Error('themes');
    if (STAGES[2].theme !== 'lab' || STAGES[2].hp < 40) throw new Error('tank boss');
    if (!STAGES[0].rides.length || STAGES[0].rides[0][2] !== 'bradley') throw new Error('bradley');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      if (!s.rides.length) throw new Error('ride ' + s.name);
      if (s.water) throw new Error('no swim ' + s.name);
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
  const btnStage = document.getElementById('btn-stage');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeStage = document.getElementById('mode-stage');
  const modeCore = document.getElementById('mode-core');
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
  const routeLabel = document.getElementById('route-label');
  const nadeLabel = document.getElementById('nade-label');
  const gunLabel = document.getElementById('gun-label');
  const rideLabel = document.getElementById('ride-label');
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
  let uid = 1;

  const keys = { l: false, r: false, u: false, d: false, fire: false, nade: false };
  const demo = { l: false, r: true, u: false, fire: true, nade: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const rain = [];

  const G = {
    mode: 'title',
    kind: 'stage',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2580,
    plats: [],
    ents: [],
    shots: [],
    nades: [],
    pickups: [],
    rides: [],
    player: null,
    boss: null,
    lives: LIVES,
    nadeAmmo: NADE_STAGE,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    weapon: 'pistol',
    ride: '',
    route: '',
    fireCd: 0,
    nadeCd: 0,
    checkX: 70,
    checkY: GY,
    jumpBuf: 0,
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
    muzzle: 0,
    chute: false,
    bolt: 0
  };

  function isCore() {
    return G.kind === 'core';
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
  function fireHeld() {
    return G.mode === 'title' ? demo.fire : keys.fire;
  }
  function nadeHeld() {
    return G.mode === 'title' ? demo.nade : keys.nade;
  }
  function nadeStart() {
    return isCore() ? NADE_CORE : NADE_STAGE;
  }
  function riding() {
    return G.ride === 'bradley';
  }

  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }

  function specNow() {
    return STAGES[G.stage - 1] || STAGES[0];
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
    chute() {
      this.ensure();
      this.noise(0.09, 0.036, 420);
      this.beep(320, 0.12, 'sine', 0.032, 180);
    },
    shot(kind) {
      this.ensure();
      if (kind === 'R') {
        this.beep(140, 0.12, 'sawtooth', 0.05, 70);
        this.noise(0.07, 0.04, 260);
      } else if (kind === 'C') {
        this.beep(740, 0.08, 'triangle', 0.042, 1180);
        this.beep(420, 0.06, 'sine', 0.03, 880);
      } else if (kind === 'bradley') {
        this.beep(180, 0.1, 'square', 0.05, 80);
        this.noise(0.06, 0.038, 240);
      } else if (kind === 'nade') {
        this.beep(240, 0.08, 'square', 0.04, 90);
        this.noise(0.05, 0.03, 400);
      } else {
        this.beep(880, 0.045, 'square', 0.04, 360);
        this.noise(0.02, 0.02, 1800);
      }
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.036, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.044, 880 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 55);
    },
    crash() {
      this.ensure();
      this.noise(0.2, 0.085, 160);
      this.beep(110, 0.26, 'sawtooth', 0.065, 40);
      this.beep(70, 0.32, 'sine', 0.05, 32);
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
    laser() {
      this.ensure();
      this.beep(880, 0.16, 'sawtooth', 0.045, 220);
      this.noise(0.12, 0.05, 900);
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
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    mount() {
      this.ensure();
      this.beep(196, 0.08, 'square', 0.04, 392);
      this.beep(392, 0.12, 'triangle', 0.04, 784);
      this.noise(0.06, 0.03, 200);
    },
    route() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 520);
      this.beep(520, 0.12, 'triangle', 0.035, 780);
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
    const c = isCore();
    if (modeStage) modeStage.setAttribute('aria-pressed', c ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', c ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = specNow();
    if (stageLabel) {
      stageLabel.textContent = (isCore() ? '弹核 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '弹核' : '金弹4';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (routeLabel) {
      const rn = G.route === 'low' ? spec.lowName : G.route === 'high' ? spec.highName : '';
      routeLabel.hidden = !rn;
      routeLabel.textContent = rn;
      routeLabel.classList.toggle('low', G.route === 'low');
    }
    if (nadeLabel) {
      nadeLabel.textContent = '雷 ' + G.nadeAmmo;
      nadeLabel.classList.toggle('low', G.nadeAmmo <= 2);
    }
    const gun = riding() ? 'bradley' : G.weapon;
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[gun] || '手枪';
      gunLabel.className = 'gun' + (gun === 'R' ? ' rocket' : gun === 'C' ? ' chase' : gun === 'bradley' ? ' hot' : '');
    }
    if (rideLabel) {
      rideLabel.hidden = !riding();
      rideLabel.textContent = '布雷德';
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞上即死，载具撞毁丢命', 'warn');
    else if (G.mode === 'win') setHint('智核坦拆了 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift/Z 丢雷', 'warn');
    else if (riding()) setHint('布雷德 · 跳更沉 · 炮管双伤 · 撞毁丢命', 'hot');
    else if (G.chute) setHint('伞降 · 落得慢 · 可左右', 'hot');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss + ' · 激光蹲躲', 'hot');
    else setHint('走跳开火 · Shift/Z 手雷 · 分路 · 走过上车 · 空中↑伞降', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MSL4';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '弹核' : '换模式';
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
    G.mult = 1 + Math.min(4, floorCombo(G.combo));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) audio.combo(G.mult);
    syncHud();
  }

  function floorCombo(c) {
    return Math.min(4, Math.floor((c - 1) / 3));
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH, duck: false,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0, chute: false
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'turret') return 4;
    if (kind === 'mortar') return 3;
    if (kind === 'bike') return 4;
    if (kind === 'crate') return 2;
    if (kind === 'copter') return 1;
    if (kind === 'ninja') return 2;
    if (kind === 'sci') return 2;
    if (kind === 'para') return 1;
    return 1;
  }

  function makeEnt(x, y, kind, a, b, extra) {
    const hp = hpOf(kind);
    const w = kind === 'bike' ? 28 : kind === 'turret' || kind === 'mortar' ? 18
      : kind === 'crate' ? 16 : kind === 'ninja' ? 13 : 14;
    const h = kind === 'bike' ? 16 : kind === 'turret' || kind === 'mortar' ? 18
      : kind === 'copter' ? 12 : kind === 'crate' ? 16 : kind === 'para' ? 22 : 24;
    const air = kind === 'para' || kind === 'copter';
    return {
      id: uid++,
      x: x, y: air && kind === 'para' ? HY - 36 : y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 1), fire: rand(0.3, 1.1),
      grounded: !air,
      dead: false, hitN: 0, w: w, h: h,
      drop: extra || (kind === 'crate' ? 'nade' : null)
    };
  }

  function makeBoss(spec) {
    const hp = spec.hp > 0 ? ((spec.hp * (isCore() ? 1.24 : 1)) | 0) : 0;
    return {
      id: uid++,
      x: spec.w - 160, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.2, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 76, h: 58, name: spec.boss
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = isCore() ? (spec.w * 0.92) | 0 : spec.w;
    G.plats = [];
    let i, g, p;
    const stretch = G.levelW / spec.w;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0] * stretch, GY, g[1] * stretch, true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0] * stretch, p[1], p[2] * (isCore() ? 0.94 : 1), false));
    }
    if (isCore()) {
      for (i = 0; i < spec.plats.length; i++) {
        if (i % 2) continue;
        p = spec.plats[i];
        const yy = p[1] === HY ? MY : HY;
        G.plats.push(makePlat(p[0] * stretch + 70, yy, 88, false));
      }
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0] * stretch, e[1], e[2], e[3] * stretch, e[4] * stretch));
    }
    if (isCore() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'turret' || e[2] === 'mortar' || e[2] === 'copter' || e[2] === 'bike') continue;
        G.ents.push(makeEnt(e[0] * stretch + 42, e[1], e[2], e[3] * stretch, e[4] * stretch));
      }
    }
    if (spec.crates) {
      for (i = 0; i < spec.crates.length; i++) {
        const c = spec.crates[i];
        G.ents.push(makeEnt(c[0] * stretch, c[1], 'crate', 0, 0, c[2]));
      }
    }
    G.rides = [];
    for (i = 0; i < spec.rides.length; i++) {
      const sl = spec.rides[i];
      G.rides.push({ x: sl[0] * stretch, y: sl[1], kind: sl[2], taken: false, t: 0 });
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0] * stretch, y: d[1] - 20, kind: d[2], taken: false, t: 0 });
      }
    }
    G.shots = [];
    G.nades = [];
    G.boss = makeBoss({
      name: spec.boss, boss: spec.boss, w: G.levelW, hp: spec.hp
    });
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.ride = '';
    G.route = '';
    G.chute = false;
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.nadeCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.lock = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.bolt = 0;
    if (!attract) {
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
    return standAt(x, y) && !standAt(x + face * 36, y);
  }

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function pBox() {
    const p = G.player;
    if (riding()) {
      return { x: p.x - 24, y: p.y - 24, w: 48, h: 24 };
    }
    const h = p.duck ? 14 : p.h;
    return { x: p.x - p.w * 0.42, y: p.y - h, w: p.w * 0.84, h: h * 0.92 };
  }

  function getAim(p) {
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (p.grounded) {
      if (p.duck && !riding()) {
        dy = 0;
        if (!dx) dx = p.face;
      } else if (inU() && !riding() && !p.chute) {
        dy = -1;
      }
    } else if (!riding()) {
      if (inU() && !p.chute) dy -= 1;
      if (inD()) dy += 1;
    }
    if (!dx && !dy) dx = p.face;
    return norm8(dx, dy);
  }

  function countShots(from) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === from && G.shots[i].life > 0) n += 1;
    }
    return n;
  }

  function spawnShot(s) {
    s.id = uid++;
    s.hit = s.hit || [];
    G.shots.push(s);
    if (G.shots.length > 96) {
      for (let i = 0; i < G.shots.length && G.shots.length > 80; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 96);
  }

  function fireOne(kind, x, y, dx, dy, extra) {
    const wpn = WEAPONS[kind] || WEAPONS.pistol;
    const n = norm8(dx, dy);
    const s = {
      x: x, y: y,
      vx: n.dx * wpn.spd,
      vy: n.dy * wpn.spd,
      from: 'p',
      kind: kind,
      dmg: wpn.dmg,
      pierce: wpn.pierce,
      life: wpn.life,
      rgb: wpn.rgb,
      hit: [],
      grav: wpn.grav || 0,
      bounces: 0
    };
    if (extra) {
      for (const k in extra) s[k] = extra[k];
    }
    spawnShot(s);
    return s;
  }

  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const kind = riding() ? 'bradley' : G.weapon;
    const wpn = WEAPONS[kind] || WEAPONS.pistol;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = getAim(p);
    const ox0 = p.x + aim.dx * (riding() ? 26 : 16);
    const oy0 = p.y - (riding() ? 14 : (p.duck ? 11 : 18)) + aim.dy * 6;
    if (kind === 'bradley') {
      fireOne('bradley', ox0, oy0, aim.dx, aim.dy);
      fireOne('bradley', ox0, oy0 - 5, aim.dx, aim.dy - 0.1);
    } else {
      fireOne(kind, ox0, oy0, aim.dx, aim.dy);
    }
    G.fireCd = wpn.cd;
    G.muzzle = 0.05;
    p.pose = 0.1;
    if (playing()) audio.shot(kind);
    emit(kind === 'R' ? 8 : kind === 'bradley' ? 7 : 4, {
      x: ox0, y: oy0, j: 4,
      vx0: aim.dx * 40, vx1: aim.dx * 180,
      vy0: aim.dy * 80 - 40, vy1: aim.dy * 80 + 40,
      life: kind === 'R' ? 0.22 : 0.16, r0: 1, r1: kind === 'R' || kind === 'bradley' ? 3.2 : 2.2,
      rgb: wpn.rgb, g: 80
    });
  }

  function throwNade() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!playing() && G.mode !== 'title') return;
    if (G.nadeCd > 0) return;
    if (G.nadeAmmo <= 0 && playing()) {
      toast('没雷了', true, false);
      G.nadeCd = 0.35;
      return;
    }
    const p = G.player;
    const face = p.face;
    G.nades.push({
      x: p.x + face * 10,
      y: p.y - (riding() ? 16 : (p.duck ? 12 : 18)),
      vx: face * (riding() ? 210 : 190),
      vy: riding() ? -220 : -280,
      life: 0.62,
      from: 'p',
      rgb: GOLD
    });
    if (playing()) {
      G.nadeAmmo = Math.max(0, G.nadeAmmo - 1);
      audio.shot('nade');
      syncHud();
    }
    G.nadeCd = 0.42;
    emit(4, {
      x: p.x + face * 10, y: p.y - 16, j: 3,
      vx0: face * 20, vx1: face * 80, vy0: -60, vy1: -10,
      life: 0.16, r0: 1, r1: 2, rgb: GOLD, g: 120
    });
  }

  function enemyShoot(e, dx, dy, spd, kind) {
    const n = norm8(dx, dy);
    spawnShot({
      x: e.x + n.dx * 10,
      y: e.y - e.h * 0.55 + n.dy * 6,
      vx: n.dx * spd,
      vy: n.dy * spd,
      from: 'e',
      kind: kind || 'e',
      dmg: 1,
      pierce: 0,
      life: 1.35,
      rgb: MAG,
      hit: []
    });
  }

  function giveGun(kind) {
    if (kind === 'R') {
      G.weapon = 'R';
      audio.ping();
      toast('火箭', false, true);
      kick(2.4, 'pickup');
      screenFlash(HOT, 0.28);
    } else if (kind === 'C') {
      G.weapon = 'C';
      audio.ping();
      toast('追弹', false, true);
      kick(2.4, 'pickup');
      screenFlash(CYN, 0.28);
    } else {
      G.nadeAmmo = Math.min(NADE_MAX, G.nadeAmmo + (isCore() ? 3 : 4));
      audio.ping();
      toast('手雷 +', false, true);
    }
    syncHud();
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({ x: x, y: y, kind: kind, taken: false, t: 0 });
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    giveGun(u.kind);
    juice(u.x, u.y, GOLD, 0.9);
    const name = u.kind === 'R' ? '火箭' : u.kind === 'C' ? '追弹' : '手雷';
    floatText(u.x, u.y - 18, name, GOLD, true);
  }

  function boomAt(x, y, power, rgb) {
    const p = power || 1;
    emit(12 + (p * 14) | 0, {
      x: x, y: y, j: 8 + p * 8,
      vx0: -260 * p, vx1: 260 * p, vy0: -340 * p, vy1: 40 * p,
      life: 0.34 + p * 0.16, r0: 1.4, r1: 3.4 + p, rgb: rgb || ORG
    });
    popSpark(x, y, rgb || HOT, 14 + p * 12);
    screenFlash(rgb || HOT, 0.16 + p * 0.12);
    kick(2.8 + p * 3.2, p >= 1.4 ? 'boom' : 'hit');
    if (playing()) audio.boom();
    hitStop(0.045 + p * 0.025);
  }

  function explode(x, y, r, dmg, from) {
    boomAt(x, y, 1.15, from === 'p' ? GOLD : ORG);
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - x, (e.y - e.h * 0.5) - y) < r) hurtEnt(e, dmg);
    }
    if (G.boss && !G.boss.dead && G.boss.active && G.boss.max > 0) {
      e = G.boss;
      if (hypot(e.x - x, (e.y - e.h * 0.5) - y) < r + 14) {
        e.hp -= dmg;
        e.hitN = 0.08;
        if (e.hp <= 0) killBoss();
      }
    }
    if (from !== 'p' && playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const cx = pb.x + pb.w * 0.5;
      const cy = pb.y + pb.h * 0.5;
      if (hypot(cx - x, cy - y) < r * 0.85) die(riding() ? 'crash' : 'shot');
    }
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    bumpCombo();
    const base = SCORE[e.kind] || SCORE.grunt;
    const sc = base * G.mult;
    addScore(sc);
    floatText(e.x, e.y - 22, '+' + sc, e.kind === 'crate' ? GOLD : HOT2, e.kind === 'crate');
    juice(e.x, e.y - 10, e.kind === 'turret' || e.kind === 'bike' ? ORG : HOT, e.kind === 'bike' ? 1.3 : 0.85);
    audio.hit(G.combo);
    hitStop(e.kind === 'turret' || e.kind === 'bike' ? 0.055 : 0.038);
    if (e.kind === 'turret' || e.kind === 'bike' || e.kind === 'mortar') boomAt(e.x, e.y - 8, 1.1, ORG);
    if (e.kind === 'crate') spawnPickup(e.x, e.y - 18, e.drop || 'nade');
  }

  function hurtEnt(e, dmg) {
    if (!e || e.dead) return false;
    if (e.hitN > 0 && e.kind !== 'turret' && e.kind !== 'mortar' && e.kind !== 'crate' && e.kind !== 'bike' && e.kind !== 'ninja') return false;
    e.hp -= dmg;
    e.hitN = 0.06;
    emit(4, {
      x: e.x, y: e.y - 12, j: 5,
      vx0: -80, vx1: 80, vy0: -160, vy1: -20,
      life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
    });
    if (e.hp <= 0) {
      killEnt(e);
      return true;
    }
    return false;
  }

  function killBoss() {
    const e = G.boss;
    if (!e || e.dead) return;
    e.dead = true;
    e.active = false;
    bumpCombo();
    const sc = SCORE.boss * G.mult;
    addScore(sc);
    addScore(SCORE.stage * G.stage);
    floatText(e.x, e.y - 40, '+' + sc, GOLD, true);
    boomAt(e.x, e.y - 20, 1.9, GOLD);
    juice(e.x, e.y - 16, CYN, 1.7);
    hitStop(0.08);
    toast(e.name + ' 击破', false, true);
    G.lock = 0.2;
    G.clearT = 2.05;
  }

  function mountRide(sl) {
    if (riding() || sl.taken || G.deadT > 0) return;
    sl.taken = true;
    G.ride = sl.kind;
    G.player.duck = false;
    G.player.h = PH;
    G.player.chute = false;
    G.chute = false;
    audio.mount();
    toast('布雷德 · 炮管双伤', false, true);
    kick(2.6, 'pickup');
    screenFlash(NEON, 0.28);
    juice(sl.x, sl.y - 10, NEON, 1.0);
    floatText(sl.x, sl.y - 24, 'BRADLEY', GOLD, true);
    syncHud();
  }

  function markRoute() {
    const spec = specNow();
    if (!spec.forkX || G.route || G.mode !== 'play') return;
    const p = G.player;
    const fx = spec.forkX * (G.levelW / spec.w);
    if (p.x < fx) return;
    G.route = p.y < GY - 18 ? 'high' : 'low';
    const name = G.route === 'low' ? spec.lowName : spec.highName;
    if (name) {
      toast(name, false, true);
      audio.route();
      floatText(p.x, p.y - 36, name, G.route === 'low' ? MAG : CYN, true);
      syncHud();
    }
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    const wasRide = riding();
    G.why = why || 'hit';
    if (wasRide && why !== 'fall') G.why = 'crash';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.weapon = 'pistol';
    G.ride = '';
    G.chute = false;
    G.combo = 0;
    G.mult = 1;
    G.player.vy = -180;
    G.player.chute = false;
    boomAt(G.player.x, G.player.y - 16, wasRide ? 1.8 : 1.35, wasRide ? ORG : MAG);
    if (wasRide) audio.crash();
    else audio.death();
    hitStop(wasRide ? 0.078 : 0.072);
    kick(7, 'die');
    screenFlash(wasRide ? ORG : MAG, 0.45);
    if (wasRide) floatText(G.player.x, G.player.y - 30, '撞毁', ORG, true);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.weapon = 'pistol';
    G.ride = '';
    G.chute = false;
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    toast('重生', true, false);
    syncHud();
  }

  function loseWhy() {
    if (G.why === 'fall') return '坠入坑里了';
    if (G.why === 'touch') return '撞上了';
    if (G.why === 'crash') return '载具撞毁了';
    if (G.why === 'shot') return '中弹了';
    return '被击中了';
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '被击中了', loseWhy() + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isCore() ? 6000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isCore() ? '弹核清场' : '智核坦拆了',
      (isCore() ? '弹核打穿三关。' : '金弹4打穿智核坦。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    const keepN = G.nadeAmmo;
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.nadeAmmo = keepN;
    G.ride = '';
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'core' ? 'core' : 'stage';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'pistol';
    G.nadeAmmo = nadeStart();
    G.ride = '';
    G.route = '';
    G.chute = false;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isCore() ? '弹核' : STAGES[0].name, false, !isCore());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'stage';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'pistol';
    G.nadeAmmo = NADE_STAGE;
    G.ride = '';
    G.route = '';
    G.chute = false;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '金弹4', '侧向跑跳开火。欧巷分屋脊 / 雨街，雨寺分廊上 / 庭下。<br />开布雷德、丢雷、空中按上伞降，打到智核坦。撞上即死。载具撞毁丢一条命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('stage');
    else startGame(G.kind || 'stage');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('stage');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.fire = true;
    demo.nade = ((G.clock * 2) | 0) % 7 === 0 && G.nadeCd <= 0;
    demo.u = (pitAhead(p.x, p.y, 1) && p.grounded) || (!p.grounded && p.vy > 80);
    if (p.x > G.levelW - 280 || p.y > GY + 40) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.camY = 0;
      G.ride = '';
      G.weapon = 'pistol';
      G.route = '';
      G.chute = false;
    }
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

    p.duck = !!(p.grounded && inD() && !inU() && !riding());
    p.h = p.duck ? 14 : PH;
    const walk = riding() ? 196 : WALK;
    const airMul = p.chute ? 0.72 : AIR;
    const spd = walk * (p.grounded ? (p.duck ? 0.55 : 1) : airMul);
    p.vx = (p.duck ? 0 : ax * spd);
    if (!p.duck) p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    if (G.boss && G.boss.active && !G.boss.dead && G.boss.max > 0) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (inU() && !p.duck) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = (p.grounded || p.coyote > 0) && !p.duck;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = riding() ? -JUMP_V * 0.78 : -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      p.chute = false;
      G.chute = false;
      if (playing()) audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.032);
    }
    if (!inU() && p.vy < -80 && !p.chute) p.vy *= Math.pow(0.42, dt * 8);

    const wantChute = !riding() && !p.grounded && p.vy > 70 && inU();
    if (wantChute && !p.chute) {
      p.chute = true;
      G.chute = true;
      if (playing()) audio.chute();
      emit(8, {
        x: p.x, y: p.y - 20, j: 10,
        vx0: -40, vx1: 40, vy0: -10, vy1: 40,
        life: 0.28, r0: 1.4, r1: 3.2, rgb: CYN, g: 40
      });
      syncHud();
    } else if (!wantChute && p.chute) {
      p.chute = false;
      G.chute = false;
      syncHud();
    }

    p.vy += GRAV * dt;
    if (p.chute) p.vy = Math.min(p.vy, CHUTE_FALL);
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, G.dropPlat);
      if (plat) {
        y1 = plat.y;
        if (p.vy > 220 && playing()) {
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
        p.chute = false;
        if (G.chute) {
          G.chute = false;
          syncHud();
        }
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded && !p.duck) p.run += dt * (riding() ? 8 : 10);
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (p.y > GY + 90) die('fall');

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    markRoute();

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.nadeCd > 0) G.nadeCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;

    if (fireHeld()) tryShoot();
    if (nadeHeld() && G.nadeCd <= 0) throwNade();

    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (hypot(p.x - u.x, (p.y - 14) - u.y) < 22) takePickup(u);
    }
    if (!riding()) {
      for (i = 0; i < G.rides.length; i++) {
        const sl = G.rides[i];
        if (sl.taken) continue;
        sl.t += dt;
        if (hypot(p.x - sl.x, p.y - sl.y) < 28) mountRide(sl);
      }
    }

    if (G.invuln > 0) return;

    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'copter' || e.kind === 'crate') continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        die(e.kind === 'bike' || riding() ? 'crash' : 'touch');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active && G.boss.max > 0) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h * 0.9)) {
        die(riding() ? 'crash' : 'touch');
      }
    }
  }

  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function aimAtPlayer(e) {
    const p = G.player;
    return { dx: p.x - e.x, dy: (p.y - 16) - (e.y - e.h * 0.5) };
  }

  function walkEnt(e, dt, mul, baseWalk, chase) {
    const p = G.player;
    const walk = baseWalk * mul;
    if (chase && Math.abs(p.x - e.x) < 240 && playing()) {
      e.face = p.x < e.x ? -1 : 1;
    } else {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    const step = walk * dt;
    if (!standAt(e.x + e.face * 14, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * step;
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isCore(), G.stage);
    const p = G.player;
    if (!onScreen(e.x, e.y, 80) && e.kind !== 'copter' && e.kind !== 'para') return;

    if (e.kind === 'crate') return;

    if (e.kind === 'copter') {
      e.x += (e.face || -1) * 52 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = HY - 28 + Math.sin(e.t * 2.4) * 16;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0) {
        e.fire = (isCore() ? 1.05 : 1.45) / mul;
        enemyShoot(e, 0, 1, 220, 'e');
      }
      return;
    }

    if (e.kind === 'para') {
      if (!e.grounded) {
        e.vy = 78 * mul;
        const y0 = e.y;
        const y1 = e.y + e.vy * dt;
        const plat = landOn(e.x, y0, y1, null);
        if (plat) {
          e.y = plat.y;
          e.vy = 0;
          e.grounded = true;
        } else e.y = y1;
        e.x += e.face * 18 * dt;
        return;
      }
      walkEnt(e, dt, mul, 42, true);
      e.fire -= dt;
      if (playing() && G.deadT <= 0 && e.fire <= 0 && Math.abs(p.x - e.x) < 260) {
        e.fire = (isCore() ? 1.1 : 1.55) / mul;
        e.face = p.x < e.x ? -1 : 1;
        enemyShoot(e, e.face, 0, 240, 'e');
      }
      return;
    }

    if (e.kind === 'turret' || e.kind === 'mortar') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 360) {
        const aim = aimAtPlayer(e);
        if (e.kind === 'turret') {
          e.fire = (isCore() ? 0.78 : 1.05) / mul;
          enemyShoot(e, aim.dx, aim.dy, 250, 'e');
        } else {
          e.fire = (isCore() ? 1.25 : 1.7) / mul;
          spawnShot({
            x: e.x, y: e.y - 16,
            vx: e.face * 150,
            vy: -260,
            from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
            life: 1.6, rgb: ORG, hit: [], grav: 520
          });
        }
      }
      return;
    }

    if (e.kind === 'ninja') {
      const dash = e.fire < 0.22 && Math.abs(p.x - e.x) < 240 && playing();
      if (dash) e.x += e.face * 280 * mul * dt;
      else walkEnt(e, dt, mul, 70, true);
      e.fire -= dt;
      if (playing() && G.deadT <= 0 && e.fire <= 0 && Math.abs(p.x - e.x) < 300) {
        e.fire = (isCore() ? 1.05 : 1.5) / mul;
        e.face = p.x < e.x ? -1 : 1;
        spawnShot({
          x: e.x, y: e.y - 16,
          vx: e.face * 280,
          vy: -40,
          from: 'e', kind: 'star', dmg: 1, pierce: 0,
          life: 1.15, rgb: MAG, hit: []
        });
      }
      return;
    }

    if (e.kind === 'sci') {
      walkEnt(e, dt, mul, 38, false);
      e.fire -= dt;
      if (playing() && G.deadT <= 0 && e.fire <= 0 && Math.abs(p.x - e.x) < 300) {
        e.fire = (isCore() ? 1.2 : 1.7) / mul;
        e.face = p.x < e.x ? -1 : 1;
        spawnShot({
          x: e.x, y: e.y - 16,
          vx: e.face * 140,
          vy: -240,
          from: 'e', kind: 'flask', dmg: 1, pierce: 0,
          life: 1.5, rgb: LEAF, hit: [], grav: 500
        });
      }
      return;
    }

    if (e.kind === 'bike') {
      if (e.grounded && e.fire < 0.18 && Math.abs(p.x - e.x) < 220) {
        e.vy = -280;
        e.grounded = false;
      }
      e.vy += GRAV * dt;
      const y0 = e.y;
      const y1 = e.y + e.vy * dt;
      const plat = e.vy >= 0 ? landOn(e.x, y0, y1, null) : null;
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else {
        e.y = y1;
        e.grounded = false;
      }
    }

    const walk = (e.kind === 'slash' ? 102 : e.kind === 'bike' ? 118 : 48) * mul;
    if ((e.kind === 'slash' || e.kind === 'bike') && Math.abs(p.x - e.x) < 240 && playing()) {
      e.face = p.x < e.x ? -1 : 1;
    } else {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    const step = walk * (e.kind === 'slash' && Math.abs(p.x - e.x) < 220 ? 1.4 : 1) * dt;
    if (!standAt(e.x + e.face * 14, e.y) && standAt(e.x, e.y) && e.grounded !== false) e.face *= -1;
    else e.x += e.face * step;
    e.fire -= dt;
    if (playing() && G.deadT <= 0 && e.fire <= 0) {
      if (e.kind === 'grunt' && Math.abs(p.x - e.x) < 280 && Math.abs(p.y - e.y) < 50) {
        e.fire = (isCore() ? 1.05 : 1.5) / mul;
        e.face = p.x < e.x ? -1 : 1;
        enemyShoot(e, e.face, 0, 260, 'e');
      } else if (e.kind === 'bike' && Math.abs(p.x - e.x) < 300) {
        e.fire = (isCore() ? 1.15 : 1.6) / mul;
        enemyShoot(e, e.face, -0.12, 240, 'e');
      } else e.fire = 0.35;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead || b.max <= 0) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.levelW - 420) {
        b.active = true;
        audio.boss();
        toast(b.name + ' 现身', false, true);
        screenFlash(CYN, 0.3);
        kick(3.2, 'boom');
      }
      return;
    }
    b.t += dt;
    const mul = spdMul(isCore(), G.stage);
    const low = b.hp / b.max < 0.45;
    b.x = G.levelW - 176 + Math.sin(b.t * 0.5) * 40;
    b.y = GY;
    b.fire -= dt;
    if (b.fire <= 0 && playing() && G.deadT <= 0) {
      const pulse = ((b.t * 1.7) | 0) % 4;
      if (pulse === 0) {
        b.fire = (low ? 0.55 : 0.82) / mul;
        spawnShot({
          x: b.x - 70, y: GY - 24,
          vx: -90, vy: 0,
          from: 'e', kind: 'laser', dmg: 1, pierce: 0,
          life: 0.72, rgb: MAG, hit: []
        });
        audio.laser();
        screenFlash(MAG, 0.18);
      } else if (pulse === 1) {
        b.fire = (low ? 0.42 : 0.64) / mul;
        spawnShot({
          x: b.x - 32, y: b.y - (low ? 18 : 44),
          vx: -320, vy: low ? 14 : -28,
          from: 'e', kind: 'cannon', dmg: 1, pierce: 0,
          life: 1.5, rgb: ORG, hit: []
        });
        enemyShoot(b, p.x - b.x, (p.y - 16) - (b.y - 24), 240, 'e');
      } else if (pulse === 2) {
        b.fire = (low ? 0.5 : 0.78) / mul;
        spawnShot({
          x: b.x - 16, y: b.y - 20,
          vx: -150, vy: -300,
          from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
          life: 1.7, rgb: CYN, hit: [], grav: 520
        });
      } else {
        b.fire = (low ? 0.4 : 0.7) / mul;
        enemyShoot(b, p.x - b.x, (p.y - 16) - (b.y - 24), 260, 'e');
        if (low || isCore()) {
          const n = isCore() ? 8 : 6;
          let i;
          for (i = 0; i < n; i++) {
            const a = Math.PI + i * (Math.PI / (n - 1)) * 0.7 - 0.35;
            spawnShot({
              x: b.x - 22, y: b.y - 30,
              vx: Math.cos(a) * 220,
              vy: Math.sin(a) * 220,
              from: 'e', kind: 'e', dmg: 1, pierce: 0,
              life: 1.5, rgb: CYN, hit: []
            });
          }
        }
      }
    }
  }

  function updateNades(dt) {
    let i, n, j, e;
    for (i = G.nades.length - 1; i >= 0; i--) {
      n = G.nades[i];
      n.life -= dt;
      n.vy += 780 * dt;
      n.x += n.vx * dt;
      const y0 = n.y;
      const y1 = n.y + n.vy * dt;
      let boom = n.life <= 0;
      const plat = landOn(n.x, y0, y1, null);
      if (plat) {
        n.y = plat.y - 4;
        boom = true;
      } else n.y = y1;
      if (!boom && n.from === 'p') {
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (hypot(e.x - n.x, (e.y - e.h * 0.5) - n.y) < 16) {
            boom = true;
            break;
          }
        }
        if (!boom && G.boss && G.boss.active && !G.boss.dead && G.boss.max > 0) {
          if (hypot(G.boss.x - n.x, (G.boss.y - 20) - n.y) < 28) boom = true;
        }
      }
      if (boom) {
        explode(n.x, n.y, n.from === 'p' ? 46 : 38, n.from === 'p' ? 3 : 1, n.from);
        G.nades.splice(i, 1);
      } else if (!onScreen(n.x, n.y, 80)) {
        G.nades.splice(i, 1);
      }
    }
  }

  function nearestTarget(x, y) {
    let best = null;
    let bestD = 340;
    let i, e, d;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      d = hypot(e.x - x, (e.y - e.h * 0.5) - y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active && G.boss.max > 0) {
      e = G.boss;
      d = hypot(e.x - x, (e.y - e.h * 0.5) - y);
      if (d < bestD) best = e;
    }
    return best;
  }

  function shotHits(s, x, y, w, h) {
    const r = s.kind === 'cannon' || s.kind === 'bradley' || s.kind === 'R' ? 9
      : s.kind === 'laser' ? 7 : 5;
    if (s.kind === 'laser') {
      return overlap(s.x - 40, s.y - 5, 80, 10, x - w * 0.5, y - h, w, h);
    }
    return overlap(s.x - r, s.y - r, r * 2, r * 2, x - w * 0.5, y - h, w, h);
  }

  function updateShots(dt) {
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      if (s.kind === 'C' && s.from === 'p') {
        const tgt = nearestTarget(s.x, s.y);
        if (tgt) {
          const n = norm8(tgt.x - s.x, (tgt.y - tgt.h * 0.5) - s.y);
          const spd = WEAPONS.C.spd;
          const k = 1 - Math.pow(0.12, dt * 60);
          s.vx = lerp(s.vx, n.dx * spd, k);
          s.vy = lerp(s.vy, n.dy * spd, k);
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if ((s.kind === 'C' || s.kind === 'bradley' || s.kind === 'R') && playing()) {
        emit(1, {
          x: s.x, y: s.y, j: 2,
          vx0: -16, vx1: 16, vy0: -16, vy1: 10,
          life: 0.1, r0: 1.2, r1: s.kind === 'R' ? 2.8 : 1.8,
          rgb: s.rgb, g: 40
        });
      }
      if (s.kind === 'R' && s.from === 'p') {
        const plat = landOn(s.x, s.y - 8, s.y + 6, null);
        if (plat || s.life <= 0) {
          explode(s.x, s.y, 36, 2, 'p');
          G.shots.splice(i, 1);
          continue;
        }
      }
      if (s.life <= 0 || !onScreen(s.x, s.y, 100)) {
        G.shots.splice(i, 1);
        continue;
      }

      if (s.from === 'p') {
        let hit = false;
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          if (shotHits(s, e.x, e.y, e.w, e.h)) {
            s.hit.push(e.id);
            if (s.kind === 'R') {
              explode(s.x, s.y, 36, 2, 'p');
              hit = true;
              s.pierce = 0;
              break;
            }
            hurtEnt(e, s.dmg);
            hit = true;
            hitStop(0.032);
            if (!s.pierce) break;
            s.pierce -= 1;
            if (s.pierce < 0) break;
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active && G.boss.max > 0 && s.hit.indexOf(G.boss.id) < 0) {
          e = G.boss;
          if (shotHits(s, e.x, e.y, e.w + 10, e.h + 6)) {
            s.hit.push(e.id);
            if (s.kind === 'R') {
              explode(s.x, s.y, 36, 2, 'p');
              hit = true;
            } else {
              e.hp -= s.dmg;
              e.hitN = 0.07;
              audio.hit(G.combo);
              emit(6, {
                x: s.x, y: s.y, j: 6,
                vx0: -120, vx1: 120, vy0: -180, vy1: -20,
                life: 0.2, r0: 1, r1: 2.6, rgb: GOLD, g: 200
              });
              hitStop(0.04);
              hit = true;
              if (e.hp <= 0) killBoss();
            }
          }
        }
        if (hit && !s.pierce) {
          G.shots.splice(i, 1);
          continue;
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        const r = s.kind === 'bomb' || s.kind === 'cannon' || s.kind === 'flask' ? 8
          : s.kind === 'laser' ? 6 : 4.5;
        let hitP = false;
        if (s.kind === 'laser') {
          hitP = overlap(s.x - 48, s.y - 5, 96, 10, pb.x, pb.y, pb.w, pb.h);
        } else {
          hitP = overlap(s.x - r, s.y - r, r * 2, r * 2, pb.x, pb.y, pb.w, pb.h);
        }
        if (hitP) {
          G.shots.splice(i, 1);
          die(riding() ? 'crash' : 'shot');
        }
      }
    }
  }

  function updateRides(dt) {
    for (let i = 0; i < G.rides.length; i++) G.rides[i].t += dt;
  }

  function updateRain(dt) {
    const need = REDUCE ? 10 : 36;
    while (rain.length < need) {
      rain.push({
        x: G.camX + rand(-30, VW + 40),
        y: G.camY + rand(-20, VH),
        v: rand(280, 420),
        len: rand(8, 16)
      });
    }
    let i, o;
    for (i = 0; i < rain.length; i++) {
      o = rain[i];
      o.y += o.v * dt;
      o.x += 28 * dt;
      if (o.y > G.camY + VH + 10) {
        o.y = G.camY - 16;
        o.x = G.camX + rand(-20, VW + 30);
      }
    }
    if (specNow().theme !== 'lab' && !REDUCE && Math.random() < dt * 0.18) {
      G.bolt = 0.08;
      screenFlash(CYN, 0.12);
    }
    if (G.bolt > 0) G.bolt -= dt;
  }

  function updateFx(dt) {
    if (G.invuln > 0 && G.mode === 'play') G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.flash > 0) G.flash -= dt * 2.4;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));

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
    updateRain(dt);
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.36;
    if (G.boss && G.boss.active && !G.boss.dead && G.boss.max > 0) {
      tx = G.levelW - VW;
    }
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    let ty = p.y - VH * 0.68;
    ty = clamp(ty, -40, 24);
    const k = 1 - Math.pow(0.0008, dt);
    G.camX = lerp(G.camX, tx, k);
    G.camY = lerp(G.camY, ty, k * 0.85);
  }

  function maybeClearRun() {
    if (!playing() || G.clearT > 0) return;
    if (G.boss && G.boss.max > 0 && !G.boss.dead) return;
    if (G.stage < STAGES.length) {
      const p = G.player;
      if (p && p.x > G.levelW - 90 && p.grounded) {
        addScore(SCORE.stage * G.stage);
        toast(STAGES[G.stage - 1].name + ' 打穿', false, true);
        G.clearT = 1.45;
        G.lock = 0.2;
        audio.stage();
        kick(2.8, 'win-flash');
      }
    }
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
    updateRides(dt);
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateNades(dt);
    maybeClearRun();
    updateCam(dt);
  }

  function drawSky() {
    const spec = specNow();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'lab') {
      g.addColorStop(0, '#0c1018');
      g.addColorStop(0.5, '#10141c');
      g.addColorStop(1, '#141018');
    } else if (spec.theme === 'temple') {
      g.addColorStop(0, '#100818');
      g.addColorStop(0.5, '#140c18');
      g.addColorStop(1, '#1a1014');
    } else {
      g.addColorStop(0, '#120818');
      g.addColorStop(0.45, '#18101c');
      g.addColorStop(1, '#1c1014');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 42);
    ctx.fillStyle = rgba(spec.theme === 'lab' ? CYN : GOLD, spec.theme === 'lab' ? 0.22 : 0.32);
    ctx.beginPath();
    ctx.arc(mx, my, 18 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.theme === 'lab' ? CYN : MAG, 0.12);
    ctx.beginPath();
    ctx.arc(mx, my, 32 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBackdrop() {
    const spec = specNow();
    const par = G.camX * 0.32;
    const base = sy(GY + 6);
    let i, x, h, w;
    for (i = -2; i < 24; i++) {
      x = sx((Math.floor((G.camX + par) / 64) + i) * 64 - par);
      h = (36 + hash2(i + 17 + G.stage * 9) * 110) * scale;
      w = (22 + hash2(i + 5) * 28) * scale;
      if (spec.theme === 'lab') {
        ctx.fillStyle = i % 2 ? '#141820' : '#10141c';
        ctx.fillRect(x, base - h, w * 1.15, h + 40 * scale);
        ctx.fillStyle = rgba(CYN, 0.18 + (i % 3 === 0 ? 0.12 : 0));
        ctx.fillRect(x + 4 * scale, base - h + 8 * scale, 5 * scale, 7 * scale);
        ctx.fillRect(x + 12 * scale, base - h + 20 * scale, 5 * scale, 7 * scale);
      } else if (spec.theme === 'temple') {
        ctx.fillStyle = i % 2 ? '#1c1018' : '#18101c';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.15, base - h * 0.55);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w * 0.85, base - h * 0.55);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(HOT, 0.35);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, base - h * 0.42, 4 * scale, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = i % 2 ? '#1a1018' : '#161018';
        ctx.fillRect(x, base - h, w * 1.1, h + 40 * scale);
        ctx.fillStyle = rgba(i % 4 === 0 ? MAG : i % 3 === 0 ? CYN : GOLD, 0.22);
        ctx.fillRect(x + 4 * scale, base - h * 0.7, 4 * scale, 5 * scale);
        ctx.fillRect(x + 12 * scale, base - h * 0.45, 4 * scale, 5 * scale);
        if (i % 5 === 0) {
          ctx.fillStyle = rgba(NEON, 0.35);
          ctx.fillRect(x + 2 * scale, base - h - 6 * scale, w * 0.8, 3 * scale);
        }
      }
    }
    drawRain();
  }

  function drawRain() {
    if (specNow().theme === 'lab') return;
    ctx.strokeStyle = rgba(CYN, 0.22);
    ctx.lineWidth = 1 * scale;
    let i, o;
    ctx.beginPath();
    for (i = 0; i < rain.length; i++) {
      o = rain[i];
      const x = sx(o.x);
      const y = sy(o.y);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2 * scale, y + o.len * scale);
    }
    ctx.stroke();
    if (G.bolt > 0) {
      ctx.fillStyle = rgba(WHT, G.bolt * 1.4);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
  }

  function drawPit() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 10);
    ctx.fillStyle = 'rgba(20,8,16,0.4)';
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    let x, covered;
    for (x = G.camX; x < G.camX + VW; x += 18) {
      covered = false;
      for (let i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w && bases[i].y <= GY + 4) {
          covered = true;
        }
      }
      if (covered) continue;
      ctx.fillStyle = rgba(HOT, 0.16);
      ctx.fillRect(sx(x), sy(GY + 4), 14 * scale, 8 * scale);
    }
  }

  function drawPlats() {
    const spec = specNow();
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      const h = p.h * scale;
      ctx.fillStyle = p.base
        ? (spec.theme === 'lab' ? '#141820' : spec.theme === 'temple' ? '#1c1418' : '#20141c')
        : (spec.theme === 'lab' ? '#1c2430' : '#24141c');
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? (spec.theme === 'lab' ? CYN : spec.theme === 'temple' ? HOT : NEON) : HOT, p.base ? 0.8 : 0.65);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.18);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.18) : rgba(MAG, 0.16);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 5 * scale);
        }
      }
    }
  }

  function drawForkSign() {
    const spec = specNow();
    if (!spec.forkX || spec.highName === '') return;
    const fx = spec.forkX * (G.levelW / spec.w);
    if (fx < G.camX - 40 || fx > G.camX + VW + 40) return;
    const x = sx(fx);
    const y = sy(GY - 64);
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(x - 3 * scale, y, 6 * scale, 48 * scale);
    ctx.fillStyle = rgba(GOLD, 0.92);
    ctx.fillRect(x - 30 * scale, y - 22 * scale, 60 * scale, 24 * scale);
    ctx.fillStyle = '#140810';
    ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.highName + '↑  ' + spec.lowName + '→', x, y - 10 * scale);
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    if (s.kind === 'laser') {
      ctx.fillStyle = rgba(MAG, 0.35);
      ctx.fillRect(x - 52 * scale, y - 6 * scale, 104 * scale, 12 * scale);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(x - 52 * scale, y - 2 * scale, 104 * scale, 4 * scale);
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.fillRect(x - 52 * scale, y - 1 * scale, 104 * scale, 2 * scale);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    const a = Math.atan2(s.vy, s.vx);
    ctx.rotate(a);
    if (s.kind === 'bradley' || s.kind === 'R') {
      ctx.fillStyle = rgba(s.rgb || HOT, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * scale, 3.4 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(2 * scale, 0, 4 * scale, 2 * scale, 0, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'C') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 3.8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 6 * scale, 0, TAU);
      ctx.stroke();
    } else if (s.kind === 'cannon' || s.kind === 'bomb' || s.kind === 'flask') {
      ctx.fillStyle = rgba(s.rgb || ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, (s.kind === 'cannon' ? 5.6 : 4.4) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(-1 * scale, -1 * scale, 2.2 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'star') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.rotate(G.clock * 8);
      for (let k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-1.4 * scale, -5 * scale, 2.8 * scale, 10 * scale);
      }
    } else {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-3.5 * scale, -1.6 * scale, 10 * scale, 3.2 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(1 * scale, -0.8 * scale, 5 * scale, 1.6 * scale);
    }
    ctx.restore();
  }

  function drawNade(n) {
    const x = sx(n.x);
    const y = sy(n.y);
    ctx.fillStyle = rgba(n.rgb || GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 4.4 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x - 1.2 * scale, y - 7 * scale, 2.4 * scale, 3.2 * scale);
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(x - 1.2 * scale, y - 1.2 * scale, 1.4 * scale, 0, TAU);
    ctx.fill();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 4 + u.t) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    const rgb = u.kind === 'R' ? HOT : u.kind === 'C' ? CYN : GOLD;
    const label = u.kind === 'R' ? 'R' : u.kind === 'C' ? 'C' : 'G';
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.fillStyle = '#140810';
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5 * scale);
  }

  function drawSoldier(p, rgb, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    const sq = opt.squash || 1;
    const duck = opt.duck;
    const aim = opt.aim || { dx: p.face, dy: 0 };
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const leg = Math.sin(opt.run || 0) * (duck ? 1 : 5) * s;
    const bodyH = duck ? 12 : 16;
    ctx.strokeStyle = rgba(opt.leg || NAVY, 0.95);
    ctx.lineWidth = 2.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -6 * s);
    ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -6 * s);
    ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, bodyH * s);
    ctx.fillStyle = rgba(GOLD, 0.4);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, 2 * s);
    ctx.fillStyle = rgba(opt.headRgb || SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 12) * s, 5.2 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(opt.helm || KHAKI, 0.95);
    ctx.fillRect(-5.6 * s, -(bodyH + 16) * s, 11.2 * s, 4.2 * s);
    if (opt.scarf) {
      ctx.strokeStyle = rgba(MAG, 0.95);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(-5 * s, -(bodyH + 8) * s);
      ctx.lineTo(-10 * s, -(bodyH + 2) * s);
      ctx.stroke();
    }
    if (opt.chute) {
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 1.1 * s;
      ctx.beginPath();
      ctx.moveTo(-4 * s, -(bodyH + 16) * s);
      ctx.lineTo(-12 * s, -(bodyH + 34) * s);
      ctx.moveTo(4 * s, -(bodyH + 16) * s);
      ctx.lineTo(12 * s, -(bodyH + 34) * s);
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, -(bodyH + 36) * s, 16 * s, 6 * s, 0, Math.PI, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.stroke();
    }
    const ldx = aim.dx * p.face;
    const ldy = aim.dy;
    ctx.strokeStyle = rgba(WHT, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -(bodyH + 2) * s);
    ctx.lineTo((2 + ldx * 11) * s, (-(bodyH + 2) + ldy * 11) * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(HOT, 0.95);
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo((2 + ldx * 8) * s, (-(bodyH + 2) + ldy * 8) * s);
    ctx.lineTo((2 + ldx * 18) * s, (-(bodyH + 2) + ldy * 18) * s);
    ctx.stroke();
    if (opt.muzzle) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc((2 + ldx * 20) * s, (-(bodyH + 2) + ldy * 20) * s, 4.2 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBradley(x, y, face, opt) {
    const s = scale;
    const flash = opt.hit && ((G.t * 24) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(face, 1);
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(WINE, 0.96);
    ctx.fillRect(-22 * s, -20 * s, 44 * s, 14 * s);
    ctx.fillStyle = rgba(NEON, 0.9);
    ctx.fillRect(-22 * s, -24 * s, 44 * s, 4 * s);
    ctx.fillStyle = rgba(LAB, 0.95);
    ctx.fillRect(2 * s, -18 * s, 24 * s, 6 * s);
    ctx.fillStyle = rgba(CYN, 0.45);
    ctx.fillRect(8 * s, -16 * s, 10 * s, 3 * s);
    ctx.fillStyle = '#1a140c';
    const bob = Math.sin(opt.run || 0) * 1.1;
    let k;
    for (k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc((-16 + k * 11) * s, (-2 + (k % 2 ? bob : -bob)) * s, 5.2 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT2, 0.55);
      ctx.lineWidth = 1.2 * s;
      ctx.stroke();
    }
    if (opt.head) {
      ctx.fillStyle = rgba(SKIN, 0.95);
      ctx.beginPath();
      ctx.arc(-4 * s, -28 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(KHAKI, 0.95);
      ctx.fillRect(-8 * s, -33 * s, 8 * s, 3 * s);
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(-8 * s, -24 * s);
      ctx.lineTo(-14 * s, -20 * s);
      ctx.stroke();
    }
    if (opt.muzzle) {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.arc(28 * s, -16 * s, 5 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRideParked(sl) {
    if (sl.taken) return;
    const bob = Math.sin(G.clock * 3 + sl.t) * 1.2;
    drawBradley(sl.x, sl.y + bob, 1, { run: sl.t * 2, head: false, muzzle: false, hit: false });
    ctx.fillStyle = rgba(HOT, 0.7 + Math.sin(G.clock * 6) * 0.2);
    ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('布雷德', sx(sl.x), sy(sl.y - 36));
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    if (e.kind === 'crate') {
      ctx.fillStyle = rgba([160, 90, 50], 0.95);
      ctx.fillRect(x - 9 * scale, y - 16 * scale, 18 * scale, 16 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.strokeRect(x - 9 * scale, y - 16 * scale, 18 * scale, 16 * scale);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 8 * scale, y - 10 * scale, 16 * scale, 2 * scale);
      return;
    }
    if (e.kind === 'turret' || e.kind === 'mortar') {
      ctx.fillStyle = '#2a1820';
      ctx.fillRect(x - 10 * scale, y - 14 * scale, 20 * scale, 14 * scale);
      ctx.fillStyle = rgba(WINE, 0.85);
      ctx.fillRect(x - 12 * scale, y - 6 * scale, 24 * scale, 6 * scale);
      ctx.fillStyle = rgba(NEON, 0.85);
      ctx.fillRect(x - 10 * scale, y - 16 * scale, 20 * scale, 2.2 * scale);
      ctx.fillStyle = '#6a7080';
      const a = Math.atan2((G.player.y - 16) - (e.y - 10), G.player.x - e.x);
      ctx.save();
      ctx.translate(x, y - 10 * scale);
      ctx.rotate(a);
      ctx.fillRect(0, -2 * scale, 16 * scale, 4 * scale);
      ctx.restore();
      return;
    }
    if (e.kind === 'copter') {
      ctx.fillStyle = rgba(WINE, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * scale, 12 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(NEON, 0.8);
      ctx.fillRect(x - 4 * scale, y - 8 * scale, 14 * scale, 2.4 * scale);
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.fillRect(x - 2 * scale, y - 10 * scale, 5 * scale, 3 * scale);
      return;
    }
    if (e.kind === 'bike') {
      ctx.fillStyle = rgba(RUST, 0.95);
      ctx.fillRect(x - 16 * scale, y - 14 * scale, 32 * scale, 10 * scale);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 16 * scale, y - 16 * scale, 32 * scale, 2.2 * scale);
      ctx.fillStyle = '#1a140c';
      ctx.beginPath();
      ctx.arc(x - 10 * scale, y - 2 * scale, 4.4 * scale, 0, TAU);
      ctx.arc(x + 10 * scale, y - 2 * scale, 4.4 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.5);
      ctx.fillRect(x + (e.face > 0 ? 4 : -10) * scale, y - 12 * scale, 8 * scale, 4 * scale);
      return;
    }
    if (e.kind === 'para' && !e.grounded) {
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 3 * scale, y - 22 * scale);
      ctx.lineTo(x - 10 * scale, y - 36 * scale);
      ctx.moveTo(x + 3 * scale, y - 22 * scale);
      ctx.lineTo(x + 10 * scale, y - 36 * scale);
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.beginPath();
      ctx.ellipse(x, y - 38 * scale, 12 * scale, 5 * scale, 0, Math.PI, TAU);
      ctx.fill();
    }
    let rgb = OLIVE;
    let helm = OLIVE;
    let headRgb = SKIN;
    if (e.kind === 'slash') rgb = HOT2;
    else if (e.kind === 'ninja') {
      rgb = INK;
      helm = MAG;
      headRgb = [48, 28, 36];
    } else if (e.kind === 'sci') {
      rgb = WHT;
      helm = WHT;
      headRgb = SKIN;
    } else if (e.kind === 'para') {
      rgb = NAVY;
      helm = KHAKI;
    }
    drawSoldier(e, rgb, {
      run: e.t * 8, grounded: e.grounded, squash: 1,
      duck: false, aim: { dx: e.face, dy: 0 }, size: 0.92,
      helm: helm, headRgb: headRgb,
      leg: e.kind === 'ninja' ? INK : NAVY
    });
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || b.max <= 0) return;
    if (!b.active && G.mode !== 'title') {
      if (b.x < G.camX - 20 || b.x > G.camX + VW + 40) return;
    }
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#181420';
    ctx.fillRect(x - 48 * scale, y - 52 * scale, 96 * scale, 40 * scale);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(x - 48 * scale, y - 58 * scale, 96 * scale, 6 * scale);
    ctx.fillStyle = rgba(MAG, 0.45 + Math.sin(G.clock * 6) * 0.15);
    ctx.fillRect(x - 18 * scale, y - 50 * scale, 36 * scale, 14 * scale);
    ctx.fillStyle = '#141008';
    let k;
    const spin = G.clock * 6;
    for (k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.arc(x + (-34 + k * 13) * scale, y - 6 * scale, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.5);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(x + (-34 + k * 13) * scale, y - 6 * scale, 4 * scale, spin, spin + 2);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(WINE, 0.95);
    ctx.fillRect(x - 62 * scale, y - 36 * scale, 34 * scale, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.8 + Math.sin(G.clock * 8) * 0.15);
    ctx.fillRect(x - 10 * scale, y - 46 * scale, 16 * scale, 10 * scale);
    ctx.fillStyle = rgba(MAG, 0.75);
    ctx.fillRect(x - 38 * scale, y - 24 * scale, 18 * scale, 5 * scale);
    ctx.fillRect(x + 12 * scale, y - 24 * scale, 18 * scale, 5 * scale);
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing() || b.max <= 0) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.name, x, y - 3 * scale);
  }

  function drawFx() {
    let i, o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const k = o.t / 0.4;
      ctx.strokeStyle = rgba(o.rgb, 1 - k);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + k * 22) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      const k = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, k);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * k * 0.4) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      ctx.fillStyle = rgba(o.rgb, clamp(o.life / o.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      const a = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140810';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const shx = G.shake && !REDUCE ? (hash2((G.t * 80) | 0) - 0.5) * G.shake : 0;
    const shy = G.shake && !REDUCE ? (hash2((G.t * 80 + 9) | 0) - 0.5) * G.shake : 0;
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }

    drawSky();
    drawBackdrop();
    drawPit();
    drawPlats();
    drawForkSign();

    let i;
    for (i = 0; i < G.rides.length; i++) drawRideParked(G.rides[i]);
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    for (i = 0; i < G.nades.length; i++) drawNade(G.nades[i]);

    if (G.player && G.deadT <= 0) {
      const blink = G.invuln > 0 && G.mode === 'play';
      const hit = blink && ((G.t * 18) | 0) % 2 === 0;
      if (riding()) {
        drawBradley(G.player.x, G.player.y, G.player.face, {
          run: G.player.run, head: true, muzzle: G.muzzle > 0, hit: hit
        });
      } else {
        drawSoldier(G.player, NAVY, {
          run: G.player.run,
          grounded: G.player.grounded,
          squash: G.player.squash,
          duck: G.player.duck,
          aim: getAim(G.player),
          muzzle: G.muzzle > 0,
          blink: blink,
          scarf: true,
          helm: KHAKI,
          chute: G.player.chute
        });
      }
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
    const nadeKey = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;
    if (nadeKey) keys.nade = down;

    if (down && (isMove || space || nadeKey || k === 'Enter')) e.preventDefault();
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
      startGame('stage');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('core');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (!space) keys.fire = false;
        return;
      }
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
    hold(document.getElementById('btn-duck'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    hold(document.getElementById('btn-nade'), function () { keys.nade = true; }, function () { keys.nade = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      keys.fire = true;
    });
    canvas.addEventListener('pointerup', function () { keys.fire = false; });
    canvas.addEventListener('pointercancel', function () { keys.fire = false; });
    canvas.addEventListener('pointerleave', function () { keys.fire = false; });
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

  if (btnStage) {
    btnStage.addEventListener('click', function () {
      audio.ensure();
      startGame('stage');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
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
      if (G.mode === 'win') startGame('core');
      else goTitle();
    });
  }
  if (modeStage) {
    modeStage.addEventListener('click', function () {
      audio.ensure();
      startGame('stage');
    });
  }
  if (modeCore) {
    modeCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
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
      keys.fire = false;
      keys.nade = false;
    }
  });

  requestAnimationFrame(frame);
})();
