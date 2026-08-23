'use strict';

/* 魂斗3 — Contra III remake.
   Overhead raid then side-scroll, machine gun + bombs, crash = lose a life.
   Distinct from 魂斗 (jungle M/S/L/F, jump=up), 魂斗2 (alley, Shift/Z jump, S/L),
   超魂 (HP + presses + rotary cannon). */

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 224;
  const OVER_SPD = 228;
  const AIR = 0.9;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const PR = 10;
  const INVULN = 1.2;
  const DIE_T = 0.82;
  const BOMBS0 = 3;
  const BOMB_CAP = 9;
  const BOMB_R = 158;
  const BOMB_DMG = 8;
  const BEST_KEY = 'playbox-contra3-best';
  const MUTE_KEY = 'playbox-contra3-mute';
  const OPS = '方向 / WASD 走 · 空格开火 · Shift/Z 炸弹 · 侧向 ↑ 跳 ↓ 蹲 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 92, 18];
  const HOT2 = [255, 138, 58];
  const WHT = [246, 239, 230];
  const LEAF = [61, 255, 122];
  const ORG = [255, 168, 64];
  const STEEL = [92, 104, 118];
  const BLU = [64, 150, 255];

  const GUN_NAME = { gun: '机枪', H: '追踪' };
  const WEAPONS = {
    gun: { cd: 0.085, max: 6, spd: 640, dmg: 1, pierce: 0, spread: 1, fan: 0, life: 0.62, rgb: GOLD, homing: 0 },
    H: { cd: 0.16, max: 5, spd: 420, dmg: 2, pierce: 1, spread: 1, fan: 0, life: 0.95, rgb: CYN, homing: 1 }
  };

  const SCORE = {
    grunt: 100, rush: 150, jeep: 200, copter: 200,
    turret: 250, tank: 300, wreck: 200, pod: 300,
    gunner: 200, nest: 250, boss: 5000, stage: 2000
  };

  const STAGES = [
    {
      name: '废路', boss: '路闸', view: 'over', w: 1920, h: 1200, hp: 28,
      start: [180, 1080],
      walls: [
        [0, 0, 1920, 40], [0, 1160, 1920, 40], [0, 0, 40, 1200], [1880, 0, 40, 1200],
        [280, 820, 210, 150], [620, 900, 190, 130], [1020, 780, 170, 170],
        [140, 480, 230, 170], [540, 420, 150, 210], [880, 520, 210, 140],
        [1220, 460, 180, 190], [1520, 580, 210, 150],
        [80, 90, 250, 150], [480, 60, 170, 170], [820, 140, 210, 130],
        [1180, 50, 150, 190], [1480, 120, 160, 140]
      ],
      ents: [
        [300, 1040, 'grunt', 220, 420],
        [460, 1000, 'grunt', 360, 560],
        [700, 1060, 'jeep', 560, 920],
        [860, 960, 'grunt', 760, 980],
        [520, 720, 'turret', 0, 0],
        [980, 720, 'tank', 860, 1120],
        [1180, 880, 'wreck', 0, 0],
        [360, 360, 'grunt', 220, 520],
        [700, 340, 'jeep', 560, 860],
        [1060, 380, 'turret', 0, 0],
        [1320, 700, 'grunt', 1180, 1480],
        [1500, 820, 'tank', 1380, 1680],
        [1640, 480, 'wreck', 0, 0],
        [420, 200, 'grunt', 280, 620],
        [980, 260, 'jeep', 820, 1160],
        [1280, 320, 'turret', 0, 0],
        [1540, 300, 'grunt', 1400, 1720],
        [720, 180, 'pod', 0, 0, 'H'],
        [1600, 700, 'pod', 0, 0, 'B']
      ]
    },
    {
      name: '残城', boss: '城闸', view: 'side', w: 2520, h: 360, hp: 20,
      ground: [[0, 500], [620, 380], [1120, 420], [1680, 360], [2140, 380]],
      plats: [
        [160, MY, 150], [420, MY, 160], [780, MY, 150],
        [1160, MY, 170], [1540, MY, 160], [1960, MY, 170], [2280, MY, 130],
        [480, HY, 120], [920, HY, 140], [1380, HY, 150], [1840, HY, 140]
      ],
      ents: [
        [260, GY, 'grunt', 40, 480],
        [440, GY, 'rush', 360, 620],
        [500, MY, 'gunner', 0, 0],
        [760, GY, 'grunt', 640, 980],
        [1020, MY, 'nest', 0, 0],
        [1100, 118, 'pod', 0, 0, 'H'],
        [1280, GY, 'rush', 1140, 1500],
        [1460, HY, 'copter', 1320, 1620],
        [1640, GY, 'grunt', 1500, 1860],
        [1820, MY, 'gunner', 0, 0],
        [1980, GY, 'nest', 0, 0],
        [2140, HY, 'copter', 1980, 2320],
        [2280, GY, 'rush', 2100, 2440],
        [1760, HY, 'pod', 0, 0, 'B']
      ],
      crash: [
        [380, GY, 2.25, 0.1, 'wall'],
        [860, GY, 2.4, 0.55, 'slab'],
        [520, MY, 2.2, 0.35, 'wall'],
        [1420, GY, 2.1, 0.2, 'slab'],
        [1900, GY, 2.05, 0.7, 'wall']
      ],
      drops: [[1240, HY, 'H'], [2080, MY, 'B']]
    },
    {
      name: '基核', boss: '基核', view: 'side', w: 1760, h: 360, hp: 52,
      ground: [[0, 420], [500, 360], [980, 780]],
      plats: [
        [80, MY, 130], [320, MY, 150], [640, MY, 160],
        [980, MY, 170], [1320, MY, 160], [1560, MY, 130],
        [240, HY, 120], [720, HY, 140], [1160, HY, 150]
      ],
      ents: [
        [220, GY, 'grunt', 20, 400],
        [380, MY, 'nest', 0, 0],
        [520, GY, 'rush', 420, 760],
        [700, HY, 'copter', 560, 860],
        [860, 112, 'pod', 0, 0, 'H'],
        [1040, GY, 'nest', 0, 0],
        [1180, MY, 'gunner', 0, 0],
        [1320, GY, 'rush', 1160, 1540]
      ],
      crash: [
        [480, GY, 2.15, 0.2, 'wall'],
        [980, MY, 2.3, 0.5, 'slab'],
        [1280, GY, 2.05, 0.35, 'wall']
      ],
      drops: [[1080, HY, 'B']]
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
    return (core ? 1.26 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
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
  function dirs8() {
    const o = [];
    let x, y;
    for (y = -1; y <= 1; y++) {
      for (x = -1; x <= 1; x++) {
        if (!x && !y) continue;
        o.push(norm8(x, y));
      }
    }
    return o;
  }
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BOMBS0 < 2) throw new Error('bombs');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!WEAPONS.gun || !WEAPONS.H) throw new Error('weapons');
    if (!WEAPONS.H.homing) throw new Error('homing');
    if (WEAPONS.gun.cd >= 0.14) throw new Error('mg too slow');
    if (dirs8().length !== 8) throw new Error('8 dirs');
    if (BEST_KEY !== 'playbox-contra3-best') throw new Error('best key');
    if (STAGES[0].name !== '废路' || STAGES[1].name !== '残城' || STAGES[2].name !== '基核') {
      throw new Error('stage names');
    }
    if (STAGES[0].view !== 'over') throw new Error('overhead first');
    if (STAGES[1].view !== 'side' || STAGES[2].view !== 'side') throw new Error('then side');
    if (STAGES[2].hp < 40) throw new Error('base boss');
    if (!STAGES[0].walls || STAGES[0].walls.length < 4) throw new Error('over walls');
    if (!STAGES[1].crash.length || !STAGES[2].crash.length) throw new Error('crash walls');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ents.length) throw new Error('stage ' + s.name);
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
  const viewLabel = document.getElementById('view-label');
  const gunLabel = document.getElementById('gun-label');
  const bombLabel = document.getElementById('bomb-label');
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

  const keys = { l: false, r: false, u: false, d: false, fire: false, bomb: false };
  const demo = { l: false, r: true, u: true, d: false, fire: true };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'stage',
    view: 'over',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 1920,
    levelH: 1200,
    walls: [],
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    crash: [],
    player: null,
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    weapon: 'gun',
    bombs: BOMBS0,
    bombCd: 0,
    fireCd: 0,
    checkX: 180,
    checkY: 1080,
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
    muzzle: 0,
    bombFlash: 0
  };

  function isCore() {
    return G.kind === 'core';
  }
  function isOver() {
    return G.view === 'over';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function inL() {
    if (G.mode === 'title') return demo.l;
    if (overlayOpen()) return false;
    return keys.l;
  }
  function inR() {
    if (G.mode === 'title') return demo.r;
    if (overlayOpen()) return false;
    return keys.r;
  }
  function inU() {
    if (G.mode === 'title') return demo.u;
    if (overlayOpen()) return false;
    return keys.u;
  }
  function inD() {
    if (G.mode === 'title') return demo.d;
    if (overlayOpen()) return false;
    return keys.d;
  }
  function fireHeld() {
    if (G.mode === 'title') return demo.fire;
    if (overlayOpen()) return false;
    return keys.fire;
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
    shot(kind) {
      this.ensure();
      if (kind === 'H') {
        this.beep(520, 0.08, 'sawtooth', 0.04, 220);
        this.beep(980, 0.06, 'sine', 0.03, 440);
      } else {
        this.beep(920, 0.04, 'square', 0.042, 380);
        this.noise(0.018, 0.018, 1900);
      }
    },
    bomb() {
      this.ensure();
      this.noise(0.22, 0.085, 180);
      this.beep(140, 0.22, 'sawtooth', 0.06, 46);
      this.beep(620, 0.12, 'triangle', 0.035, 180);
    },
    empty() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.03, 90);
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
      this.beep(1320, 0.12, 'sine', 0.03, 1760);
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
    slam() {
      this.ensure();
      this.noise(0.1, 0.06, 180);
      this.beep(90, 0.14, 'sawtooth', 0.055, 42);
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
    const c = isCore();
    if (modeStage) modeStage.setAttribute('aria-pressed', c ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', c ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = isCore() ? '魂核 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '魂核' : '魂斗3';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (viewLabel) {
      viewLabel.textContent = isOver() ? '俯视' : (G.lock ? '锁镜' : '侧向');
      viewLabel.classList.toggle('side', !isOver());
    }
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[G.weapon] || '机枪';
      gunLabel.className = 'gun' + (G.weapon === 'H' ? ' homing' : ' hot');
    }
    if (bombLabel) {
      bombLabel.textContent = '弹 ' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞车甲丢命', 'warn');
    else if (G.mode === 'win') setHint('基核拆了 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 炸弹清场 · 躲开车甲', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else if (isOver()) setHint('八向走 · 空格开火 · Shift/Z 炸弹 · 撞坦克丢命', '');
    else setHint('↑跳 ↓蹲 · 空格开火 · Shift/Z 炸弹 · 躲开坠墙', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'CTR3';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '魂核' : '换模式';
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
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14, max: 0.4 });
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
      aimX: 1, aimY: 0,
      w: PW, h: PH, duck: false,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'tank') return 5;
    if (kind === 'turret' || kind === 'nest' || kind === 'wreck') return 4;
    if (kind === 'jeep' || kind === 'pod') return 2;
    if (kind === 'gunner') return 2;
    return 1;
  }

  function isCrashKind(kind) {
    return kind === 'tank' || kind === 'jeep' || kind === 'wreck' || kind === 'turret';
  }

  function makeEnt(x, y, kind, a, b, extra) {
    const hp = hpOf(kind);
    const flying = kind === 'copter' || kind === 'pod';
    const over = kind === 'tank' || kind === 'jeep' || kind === 'wreck' || kind === 'turret' || kind === 'grunt';
    let w = 14;
    let h = 24;
    if (kind === 'tank') { w = 28; h = 22; }
    else if (kind === 'jeep') { w = 22; h = 16; }
    else if (kind === 'wreck') { w = 26; h = 18; }
    else if (kind === 'turret' || kind === 'nest') { w = 18; h = 16; }
    else if (kind === 'pod') { w = 16; h = 14; }
    else if (kind === 'copter') { w = 16; h = 12; }
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, gun: extra || '',
      t: rand(0, 1), fire: rand(0.3, 1.1),
      grounded: !flying,
      dead: false, hitN: 0, homeY: y,
      w: w, h: h, over: over
    };
  }

  function crashW(kind) {
    if (kind === 'wall') return 70;
    if (kind === 'slab') return 56;
    return 42;
  }

  function makeCrash(x, y, period, phase, kind) {
    return {
      x: x, y: y,
      period: period || 2.2,
      t: phase || 0,
      kind: kind || 'wall',
      w: crashW(kind),
      h: kind === 'slab' ? 16 : 22,
      py: y - 168,
      slammed: false
    };
  }

  function crashState(c) {
    const p = c.period;
    const t = ((c.t % p) + p) % p;
    const hang = p * 0.32;
    const fall = p * 0.14;
    const hold = p * 0.22;
    const rise = Math.max(0.2, p - hang - fall - hold);
    if (t < hang) {
      return { y: c.y - 168, warn: t > hang - 0.38, crushing: false, slam: false, rising: false };
    }
    if (t < hang + fall) {
      const k = (t - hang) / fall;
      const ease = k * k;
      return {
        y: lerp(c.y - 168, c.y, ease),
        warn: false,
        crushing: ease > 0.82,
        slam: ease > 0.92 && ease < 0.99,
        rising: false
      };
    }
    if (t < hang + fall + hold) {
      return { y: c.y, warn: false, crushing: true, slam: false, rising: false };
    }
    const k = (t - hang - fall - hold) / rise;
    return { y: lerp(c.y, c.y - 168, k), warn: false, crushing: false, slam: false, rising: true };
  }

  function makeBoss(spec) {
    const hp = spec.hp > 0 ? (spec.hp * (isCore() ? 1.24 : 1)) | 0 : 0;
    const over = spec.view === 'over';
    return {
      id: uid++,
      x: over ? spec.w - 220 : spec.w - 150,
      y: over ? 240 : GY,
      vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.2, state: 'wait',
      grounded: true, dead: hp <= 0, active: false,
      hitN: 0,
      w: over ? 54 : 48,
      h: over ? 48 : 56,
      name: spec.boss,
      slam: 0, arm: 0
    };
  }

  function wallHit(x, y, r) {
    const walls = G.walls;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h) return w;
    }
    return null;
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.view = spec.view;
    G.levelW = spec.w;
    G.levelH = spec.h || VH;
    G.walls = [];
    let i;
    if (spec.walls) {
      for (i = 0; i < spec.walls.length; i++) {
        const w = spec.walls[i];
        G.walls.push({ x: w[0], y: w[1], w: w[2], h: w[3] });
      }
    }
    G.plats = [];
    if (spec.ground) {
      for (i = 0; i < spec.ground.length; i++) {
        const g = spec.ground[i];
        G.plats.push(makePlat(g[0], GY, g[1], true));
      }
    }
    if (spec.plats) {
      for (i = 0; i < spec.plats.length; i++) {
        const p = spec.plats[i];
        G.plats.push(makePlat(p[0], p[1], p[2], false));
      }
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4], e[5]));
    }
    if (isCore() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'pod' || e[2] === 'nest' || e[2] === 'turret' || e[2] === 'wreck') continue;
        const kind = e[2] === 'gunner' ? 'grunt' : e[2];
        G.ents.push(makeEnt(e[0] + (isOver() ? 48 : 52), e[1] + (isOver() ? 36 : 0), kind, e[3], e[4], e[5]));
      }
    }
    G.crash = [];
    if (spec.crash) {
      for (i = 0; i < spec.crash.length; i++) {
        const c = spec.crash[i];
        G.crash.push(makeCrash(c[0], c[1], c[2], c[3], c[4]));
      }
      if (isCore() && !attract) {
        for (i = 0; i < spec.crash.length; i++) {
          if (i % 2 !== 0) continue;
          const c = spec.crash[i];
          G.crash.push(makeCrash(c[0] + 90, c[1], c[2] * 0.92, (c[3] || 0) + 0.55, c[4] === 'wall' ? 'slab' : 'wall'));
        }
      }
    }
    G.pickups = [];
    if (!attract && spec.drops) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0], y: d[1] - 20, kind: d[2], taken: false, t: 0 });
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    if (spec.start) {
      G.checkX = spec.start[0];
      G.checkY = spec.start[1];
    } else {
      G.checkX = 70;
      G.checkY = GY;
    }
    G.player = makePlayer(G.checkX, G.checkY);
    G.camX = isOver() ? G.checkX - VW * 0.45 : 0;
    G.camY = isOver() ? G.checkY - VH * 0.55 : 0;
    G.fireCd = 0;
    G.bombCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.lock = 0;
    G.dropT = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.bombFlash = 0;
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

  function pBox() {
    const p = G.player;
    if (isOver()) {
      return { x: p.x - PR, y: p.y - PR, w: PR * 2, h: PR * 2 };
    }
    const h = p.duck ? 14 : p.h;
    return { x: p.x - p.w * 0.42, y: p.y - h, w: p.w * 0.84, h: h * 0.92 };
  }

  function getAim(p) {
    if (isOver()) return norm8(p.aimX, p.aimY);
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (p.grounded) {
      if (p.duck) {
        dy = 0;
        if (!dx) dx = p.face;
      } else if (inU()) {
        dy = -1;
      }
    } else {
      if (inU()) dy -= 1;
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
    if (G.shots.length > 90) {
      for (let i = 0; i < G.shots.length && G.shots.length > 72; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 90);
  }

  function muzzlePos(p, aim) {
    if (isOver()) {
      return { x: p.x + aim.dx * 14, y: p.y + aim.dy * 14 };
    }
    return {
      x: p.x + aim.dx * 16,
      y: p.y - (p.duck ? 11 : 18) + aim.dy * 6
    };
  }

  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const wpn = WEAPONS[G.weapon] || WEAPONS.gun;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = getAim(p);
    const m = muzzlePos(p, aim);
    const n = wpn.spread || 1;
    const fan = wpn.fan || 0;
    const base = Math.atan2(aim.dy, aim.dx);
    let i;
    for (i = 0; i < n; i++) {
      const a = n === 1 ? base : base + (i - (n - 1) / 2) * fan;
      spawnShot({
        x: m.x, y: m.y,
        vx: Math.cos(a) * wpn.spd,
        vy: Math.sin(a) * wpn.spd,
        from: 'p',
        kind: G.weapon,
        dmg: wpn.dmg,
        pierce: wpn.pierce,
        life: wpn.life,
        rgb: wpn.rgb,
        homing: wpn.homing,
        hit: []
      });
    }
    G.fireCd = wpn.cd;
    G.muzzle = 0.06;
    p.pose = 0.1;
    if (playing()) audio.shot(G.weapon);
    emit(4, {
      x: m.x, y: m.y, j: 4,
      vx0: aim.dx * 40, vx1: aim.dx * 180,
      vy0: aim.dy * 80 - 40, vy1: aim.dy * 80 + 40,
      life: 0.16, r0: 1, r1: 2.2, rgb: wpn.rgb, g: 80
    });
  }

  function enemyShoot(e, dx, dy, spd, kind) {
    const n = norm8(dx, dy);
    const oy0 = isOver() ? e.y : e.y - e.h * 0.55;
    spawnShot({
      x: e.x + n.dx * 10,
      y: oy0 + n.dy * 6,
      vx: n.dx * spd,
      vy: n.dy * spd,
      from: 'e',
      kind: kind || 'e',
      dmg: 1,
      pierce: 0,
      life: 1.35,
      rgb: HOT,
      hit: []
    });
  }

  function giveGun(kind) {
    if (kind === 'B') {
      G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
      audio.ping();
      toast('炸弹 +1', false, true);
      kick(2.4, 'pickup');
      screenFlash(GOLD, 0.28);
      syncHud();
      return;
    }
    G.weapon = kind;
    audio.ping();
    toast(GUN_NAME[kind] || kind, false, true);
    kick(2.4, 'pickup');
    screenFlash(kind === 'H' ? CYN : GOLD, 0.28);
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
    floatText(u.x, u.y - 18, u.kind === 'B' ? '弹' : (GUN_NAME[u.kind] || u.kind), GOLD, true);
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

  function nearestTarget(x, y, skipId) {
    let best = null;
    let bestD = 1e9;
    let i, e, d;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || e.id === skipId) continue;
      d = hypot(e.x - x, e.y - y);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (G.boss && !G.boss.dead && G.boss.max > 0) {
      d = hypot(G.boss.x - x, G.boss.y - y);
      if (d < bestD) { bestD = d; best = G.boss; }
    }
    return best;
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    bumpCombo();
    const base = SCORE[e.kind] || SCORE.grunt;
    const sc = base * G.mult;
    addScore(sc);
    const py = isOver() ? e.y : e.y - 22;
    floatText(e.x, py, '+' + sc, e.kind === 'pod' ? GOLD : HOT2, e.kind === 'pod');
    juice(e.x, isOver() ? e.y : e.y - 10, e.kind === 'pod' ? GOLD : HOT, isCrashKind(e.kind) || e.kind === 'pod' ? 1.2 : 0.85);
    audio.hit(G.combo);
    hitStop(isCrashKind(e.kind) || e.kind === 'pod' ? 0.055 : 0.038);
    if (e.kind === 'pod' && e.gun) spawnPickup(e.x, e.y, e.gun);
    if (e.kind === 'tank' || e.kind === 'jeep' || e.kind === 'wreck' || e.kind === 'pod' || e.kind === 'nest' || e.kind === 'turret') {
      boomAt(e.x, isOver() ? e.y : e.y - 8, 1.15, ORG);
    }
  }

  function hurtEnt(e, dmg) {
    if (!playing()) return false;
    if (!e || e.dead) return false;
    if (e.hitN > 0) return false;
    e.hp -= dmg;
    e.hitN = 0.05;
    emit(4, {
      x: e.x, y: isOver() ? e.y : e.y - 12, j: 5,
      vx0: -80, vx1: 80, vy0: -160, vy1: -20,
      life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
    });
    if (e.hp <= 0) {
      killEnt(e);
      return true;
    }
    hitStop(0.032);
    return false;
  }

  function hurtBoss(dmg) {
    const b = G.boss;
    if (!playing()) return false;
    if (!b || b.dead || b.max <= 0 || !b.active) return false;
    if (b.hitN > 0) return false;
    b.hp -= dmg;
    b.hitN = 0.05;
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = true;
      bumpCombo();
      const sc = SCORE.boss * G.mult;
      addScore(sc);
      floatText(b.x, isOver() ? b.y : b.y - 40, '+' + sc, GOLD, true);
      boomAt(b.x, isOver() ? b.y : b.y - 24, 1.8, GOLD);
      juice(b.x, isOver() ? b.y : b.y - 20, GOLD, 1.8);
      audio.boss();
      hitStop(0.075);
      G.clearT = 1.35;
      G.lock = 0.2;
      return true;
    }
    hitStop(0.04);
    return false;
  }

  function tryBomb() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.mode === 'title') return;
    if (overlayOpen()) return;
    if (G.bombCd > 0) return;
    if (G.bombs <= 0) {
      toast('没弹了', true, false);
      audio.empty();
      return;
    }
    G.bombs -= 1;
    G.bombCd = 0.72;
    G.bombFlash = 0.28;
    const p = G.player;
    const px = p.x;
    const py = isOver() ? p.y : p.y - 14;
    rings.push({ x: px, y: py, t: 0, rgb: GOLD, r: 18, max: 0.55 });
    rings.push({ x: px, y: py, t: 0, rgb: HOT, r: 8, max: 0.42 });
    boomAt(px, py, 1.7, GOLD);
    audio.bomb();
    hitStop(0.072);
    kick(6.2, 'boom');
    screenFlash(GOLD, 0.42);
    floatText(px, py - 20, '轰', GOLD, true);
    const r = BOMB_R;
    let i, e, d;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      d = hypot(e.x - px, (isOver() ? e.y : e.y - 10) - py);
      if (d < r) {
        e.hitN = 0;
        hurtEnt(e, BOMB_DMG);
      }
    }
    if (G.boss && !G.boss.dead && G.boss.max > 0) {
      d = hypot(G.boss.x - px, (isOver() ? G.boss.y : G.boss.y - 20) - py);
      if (d < r + 20) {
        G.boss.hitN = 0;
        if (!G.boss.active) G.boss.active = true;
        hurtBoss(4);
      }
    }
    for (i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from !== 'e' || s.life <= 0) continue;
      if (hypot(s.x - px, s.y - py) < r) s.life = 0;
    }
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    if (why !== 'fall' && G.invuln > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.weapon = 'gun';
    G.combo = 0;
    G.mult = 1;
    G.player.vy = isOver() ? 0 : -180;
    boomAt(G.player.x, isOver() ? G.player.y : G.player.y - 16, 1.35, MAG);
    audio.death();
    hitStop(0.072);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.weapon = 'gun';
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    toast('重生', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入缝里了'
      : G.why === 'crash' ? '撞上车甲了'
      : G.why === 'wall' ? '被墙砸扁了'
      : G.why === 'touch' ? '撞上了'
      : '中弹了';
    showOverlay('lose', '被击中了', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isCore() ? 6000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isCore() ? '魂核清场' : '基核拆了',
      (isCore() ? '魂核打穿三关。' : '魂斗3打穿基核。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    const keepB = G.bombs;
    addScore(SCORE.stage * G.stage * G.mult);
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.bombs = keepB;
    G.invuln = 1.1;
    audio.stage();
    const spec = STAGES[G.stage - 1];
    toast((isOver() ? '俯视 · ' : '侧向 · ') + spec.name, false, true);
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
    G.weapon = 'gun';
    G.bombs = isCore() ? 2 : BOMBS0;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isCore() ? '魂核 · 俯视废路' : '俯视废路', false, !isCore());
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
    G.weapon = 'gun';
    G.bombs = BOMBS0;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '魂斗3', '先俯冲废路，再侧向残城。机枪连射，炸弹清场。<br />撞上车甲立刻丢命，打穿三关拆基核。');
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

  function crashIncoming(x, y) {
    let i, c, st;
    for (i = 0; i < G.crash.length; i++) {
      c = G.crash[i];
      st = crashState(c);
      if (!st.warn && !st.crushing) continue;
      if (Math.abs(c.x - x) < c.w * 0.62 && Math.abs(c.y - y) < 18) return true;
    }
    return false;
  }

  function demoThink() {
    const p = G.player;
    if (!isOver()) {
      demo.r = true;
      demo.l = false;
      demo.u = pitAhead(p.x, p.y, 1) || crashIncoming(p.x + 18, p.y);
      demo.d = false;
      demo.fire = true;
      if (p.x > G.levelW - 280) {
        G.player = makePlayer(70, GY);
        G.camX = 0;
        G.weapon = 'gun';
      }
      return;
    }
    const tx = 1680;
    const ty = 260;
    demo.r = p.x < tx - 20;
    demo.l = p.x > tx + 40;
    demo.u = p.y > ty + 10;
    demo.d = p.y < ty - 40;
    demo.fire = true;
    if (wallHit(p.x + 28, p.y, PR)) {
      demo.r = false;
      demo.u = true;
    }
    if (p.x > 1760 && p.y < 320) {
      G.player = makePlayer(180, 1080);
      G.camX = 180 - VW * 0.45;
      G.camY = 1080 - VH * 0.55;
      G.weapon = 'gun';
    }
  }

  function updatePlayerOver(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.squash = 1.15;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    let ax = 0;
    let ay = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (inU()) ay -= 1;
    if (inD()) ay += 1;
    if (ax || ay) {
      const n = norm8(ax, ay);
      p.aimX = n.dx;
      p.aimY = n.dy;
      if (ax) p.face = ax > 0 ? 1 : -1;
      const spd = OVER_SPD;
      const nx = p.x + n.dx * spd * dt;
      const ny = p.y + n.dy * spd * dt;
      if (!wallHit(nx, p.y, PR)) p.x = nx;
      if (!wallHit(p.x, ny, PR)) p.y = ny;
      p.run += dt * 14;
    } else {
      p.run += dt * 4;
    }
    p.x = clamp(p.x, PR + 4, G.levelW - PR - 4);
    p.y = clamp(p.y, PR + 4, G.levelH - PR - 4);
    p.squash = lerp(p.squash, 1, 0.2);
    if (playing() && G.invuln <= 0) {
      const pb = pBox();
      let i, e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        const ew = e.w;
        const eh = e.h;
        if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - ew * 0.5, e.y - eh * 0.5, ew, eh)) {
          die(isCrashKind(e.kind) ? 'crash' : 'touch');
          return;
        }
      }
      const b = G.boss;
      if (b && !b.dead && b.max > 0) {
        if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h * 0.5, b.w, b.h)) {
          die('crash');
        }
      }
    }
    if (hypot(p.x - G.checkX, p.y - G.checkY) > 90 && !wallHit(p.x, p.y, PR + 2)) {
      G.checkX = p.x;
      G.checkY = p.y;
    }
  }

  function updatePlayerSide(dt) {
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
    if (G.lock > 0 && G.lock < 0.4) return;

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;

    p.duck = !!(p.grounded && inD() && !inU());
    p.h = p.duck ? 14 : PH;

    const spd = WALK * (p.grounded ? (p.duck ? 0.55 : 1) : AIR);
    p.vx = (p.duck ? 0 : ax * spd);
    if (!p.duck) p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    const upAim = p.grounded && fireHeld() && inU() && !inL() && !inR();
    if (inU() && !p.duck && !upAim) G.jumpBuf = BUFFER;
    if (G.jumpBuf > 0) G.jumpBuf -= dt;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (G.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      if (playing()) audio.hop();
    }
    if (!inU() && p.vy < -80) p.vy *= Math.pow(0.42, dt * 8);

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    p.y += p.vy * dt;

    if (p.vy >= 0) {
      const land = landOn(p.x, y0, p.y, G.dropPlat);
      if (land) {
        p.y = land.y;
        p.vy = 0;
        if (!p.grounded) p.squash = 1.18;
        p.grounded = true;
        if (land.base) {
          G.checkX = p.x;
          G.checkY = land.y;
        }
      } else {
        p.grounded = false;
      }
    } else {
      p.grounded = false;
    }

    if (G.dropT > 0) {
      G.dropT -= dt;
      if (G.dropT <= 0) G.dropPlat = null;
    }

    p.squash = lerp(p.squash, 1, 0.18);
    p.run += (p.grounded && p.vx ? dt * 12 : dt * 3);

    if (p.y > VH + 40) {
      die('fall');
      return;
    }

    if (playing() && G.invuln <= 0) {
      const pb = pBox();
      let i, e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        const eh = e.h;
        const ew = e.w;
        if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - ew * 0.42, e.y - eh, ew * 0.84, eh * 0.92)) {
          die(isCrashKind(e.kind) ? 'crash' : 'touch');
          return;
        }
      }
      const b = G.boss;
      if (b && b.active && !b.dead && b.max > 0) {
        if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h * 0.9)) {
          die('crash');
        }
        if (b.slam > 0.55) {
          const ax0 = b.x - 70;
          const ax1 = b.x + 20;
          if (pb.x < ax1 && pb.x + pb.w > ax0 - 36 && pb.y + pb.h > b.y - 8 && pb.y < b.y + 8) {
            die('wall');
          }
        }
      }
    }
  }

  function updatePlayer(dt) {
    if (isOver()) updatePlayerOver(dt);
    else updatePlayerSide(dt);
    if (fireHeld()) tryShoot();
  }

  function updateCrash(dt) {
    let i, c, st;
    for (i = 0; i < G.crash.length; i++) {
      c = G.crash[i];
      c.t += dt * spdMul(isCore(), G.stage);
      st = crashState(c);
      if (st.slam && !c.slammed) {
        c.slammed = true;
        kick(4.2, 'thump');
        audio.slam();
        emit(10, {
          x: c.x, y: c.y, j: 16,
          vx0: -120, vx1: 120, vy0: -80, vy1: 20,
          life: 0.28, r0: 1.4, r1: 3, rgb: STEEL, g: 200
        });
      }
      if (!st.crushing && !st.slam) c.slammed = false;
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && (st.crushing || st.slam)) {
        const pb = pBox();
        if (overlap(pb.x, pb.y, pb.w, pb.h, c.x - c.w * 0.5, st.y - c.h, c.w, c.h + 6)) {
          die('wall');
        }
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isCore(), G.stage);
    const p = G.player;
    const dx = p.x - e.x;
    const dy = (isOver() ? p.y : p.y - 16) - (isOver() ? e.y : e.y - e.h * 0.5);
    const dist = hypot(dx, dy) || 1;

    if (isOver()) {
      if (e.kind === 'grunt') {
        const spd = 78 * mul;
        if (dist < 420) {
          e.x += (dx / dist) * spd * dt;
          e.y += (dy / dist) * spd * dt;
          if (wallHit(e.x, e.y, 8)) {
            e.x -= (dx / dist) * spd * dt;
            e.y -= (dy / dist) * spd * dt;
          }
        } else {
          e.x += Math.sin(e.t * 1.4 + e.id) * 22 * dt;
        }
        e.fire -= dt;
        if (e.fire <= 0 && dist < 380 && playing()) {
          enemyShoot(e, dx, dy, 240 * mul, 'e');
          e.fire = (isCore() ? 0.95 : 1.35) + rand(0, 0.4);
        }
      } else if (e.kind === 'jeep') {
        const a = e.a || e.x - 80;
        const b = e.b || e.x + 80;
        e.x += (e.face || 1) * 110 * mul * dt;
        if (e.x < a) { e.x = a; e.face = 1; }
        if (e.x > b) { e.x = b; e.face = -1; }
        if (wallHit(e.x, e.y, 10)) e.face *= -1;
      } else if (e.kind === 'tank') {
        const a = e.a || e.x - 60;
        const b = e.b || e.x + 60;
        e.x += (e.face || 1) * 46 * mul * dt;
        if (e.x < a) { e.x = a; e.face = 1; }
        if (e.x > b) { e.x = b; e.face = -1; }
        e.fire -= dt;
        if (e.fire <= 0 && dist < 520 && playing()) {
          enemyShoot(e, dx, dy, 280 * mul, 'e');
          e.fire = (isCore() ? 0.85 : 1.2) + rand(0, 0.3);
        }
      } else if (e.kind === 'turret') {
        e.fire -= dt;
        if (e.fire <= 0 && dist < 500 && playing()) {
          enemyShoot(e, dx, dy, 300 * mul, 'e');
          e.fire = (isCore() ? 0.7 : 1.05) + rand(0, 0.25);
        }
      } else if (e.kind === 'pod') {
        e.y = e.homeY + Math.sin(e.t * 2.2) * 8;
      } else if (e.kind === 'wreck') {
        /* static crash hulk */
      }
      return;
    }

    if (e.kind === 'grunt' || e.kind === 'rush') {
      const spd = (e.kind === 'rush' ? 150 : 72) * mul;
      if (!e.face) e.face = -1;
      e.x += e.face * spd * dt;
      if (e.x < e.a) { e.x = e.a; e.face = 1; }
      if (e.x > e.b) { e.x = e.b; e.face = -1; }
      if (e.kind === 'grunt') {
        e.fire -= dt;
        if (e.fire <= 0 && Math.abs(dx) < 360 && playing()) {
          enemyShoot(e, e.face, -0.08, 280 * mul, 'e');
          e.fire = (isCore() ? 0.9 : 1.28) + rand(0, 0.35);
        }
      }
    } else if (e.kind === 'gunner' || e.kind === 'nest') {
      e.fire -= dt;
      if (e.fire <= 0 && playing()) {
        const aim = norm8(dx, dy);
        if (e.kind === 'gunner') {
          enemyShoot(e, aim.dx, aim.dy, 260 * mul, 'e');
          enemyShoot(e, aim.dx - 0.22, aim.dy, 250 * mul, 'e');
          enemyShoot(e, aim.dx + 0.22, aim.dy, 250 * mul, 'e');
        } else {
          enemyShoot(e, dx, dy, 320 * mul, 'e');
        }
        e.fire = (isCore() ? 0.85 : 1.2) + rand(0, 0.3);
      }
    } else if (e.kind === 'copter') {
      e.x += Math.sin(e.t * 1.6) * 70 * dt;
      e.y = e.homeY + Math.sin(e.t * 2.4) * 10;
      e.fire -= dt;
      if (e.fire <= 0 && playing()) {
        enemyShoot(e, 0, 1, 220 * mul, 'e');
        e.fire = (isCore() ? 0.95 : 1.3) + rand(0, 0.3);
      }
    } else if (e.kind === 'pod') {
      e.y = e.homeY + Math.sin(e.t * 2.2) * 8;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead || b.max <= 0) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    const mul = spdMul(isCore(), G.stage);
    if (!b.active) {
      if (isOver()) {
        if (hypot(p.x - b.x, p.y - b.y) < 320) {
          b.active = true;
          audio.boss();
          toast(b.name, false, true);
        }
      } else if (p.x > G.levelW - VW + 40) {
        b.active = true;
        audio.boss();
        toast(b.name, false, true);
      }
      return;
    }
    b.t += dt;
    b.fire -= dt;
    const dx = p.x - b.x;
    const dy = (isOver() ? p.y : p.y - 18) - (isOver() ? b.y : b.y - 28);
    const angry = b.hp / b.max < 0.4;

    if (isOver()) {
      b.x += Math.sin(b.t * 0.7) * 28 * dt;
      b.y += Math.cos(b.t * 0.55) * 18 * dt;
      if (b.fire <= 0) {
        const n = angry || isCore() ? 5 : 3;
        let i;
        for (i = 0; i < n; i++) {
          const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.22;
          spawnShot({
            x: b.x + Math.cos(a) * 22,
            y: b.y + Math.sin(a) * 22,
            vx: Math.cos(a) * 260 * mul,
            vy: Math.sin(a) * 260 * mul,
            from: 'e', kind: 'e', dmg: 1, pierce: 0, life: 1.5, rgb: MAG, hit: []
          });
        }
        b.fire = angry ? 0.72 : (isCore() ? 0.88 : 1.12);
      }
      return;
    }

    b.arm = Math.sin(b.t * 3.2);
    if (b.state === 'wait') {
      if (b.t > 0.6) b.state = 'open';
    }
    if (b.fire <= 0) {
      if (angry) {
        let i;
        for (i = 0; i < 8; i++) {
          const a = (TAU * i) / 8 + b.t;
          spawnShot({
            x: b.x, y: b.y - 28,
            vx: Math.cos(a) * 220 * mul,
            vy: Math.sin(a) * 220 * mul,
            from: 'e', kind: 'e', dmg: 1, pierce: 0, life: 1.6, rgb: MAG, hit: []
          });
        }
        b.slam = 1;
        b.fire = isCore() ? 0.85 : 1.05;
      } else {
        enemyShoot(b, dx, dy, 280 * mul, 'e');
        enemyShoot(b, dx - 40, dy, 260 * mul, 'e');
        enemyShoot(b, dx + 40, dy, 260 * mul, 'e');
        if (isCore()) enemyShoot(b, 0, -1, 240 * mul, 'e');
        b.slam = 0.9;
        b.fire = isCore() ? 0.95 : 1.22;
      }
    }
    if (b.slam > 0) b.slam -= dt;
  }

  function updateShots(dt) {
    let i, s, j, e;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.life <= 0) continue;
      if (s.homing && s.from === 'p') {
        const tgt = nearestTarget(s.x, s.y, 0);
        if (tgt) {
          const ty = isOver() ? tgt.y : tgt.y - tgt.h * 0.45;
          const want = Math.atan2(ty - s.y, tgt.x - s.x);
          const cur = Math.atan2(s.vy, s.vx);
          let diff = want - cur;
          while (diff > Math.PI) diff -= TAU;
          while (diff < -Math.PI) diff += TAU;
          const turn = clamp(diff, -6.2 * dt, 6.2 * dt);
          const ang = cur + turn;
          const sp = hypot(s.vx, s.vy) || 420;
          s.vx = Math.cos(ang) * sp;
          s.vy = Math.sin(ang) * sp;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.x < G.camX - 40 || s.x > G.camX + VW + 40 || s.y < G.camY - 40 || s.y > G.camY + VH + 40) {
        s.life = 0;
        continue;
      }
      if (isOver() && wallHit(s.x, s.y, 3)) {
        s.life = 0;
        emit(3, {
          x: s.x, y: s.y, j: 3,
          vx0: -40, vx1: 40, vy0: -40, vy1: 40,
          life: 0.12, r0: 1, r1: 1.8, rgb: STEEL, g: 0
        });
        continue;
      }
      if (s.from === 'p') {
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          const eh = isOver() ? e.h * 0.5 : e.h;
          const ey = isOver() ? e.y - eh : e.y - e.h;
          if (overlap(s.x - 3, s.y - 3, 6, 6, e.x - e.w * 0.5, ey, e.w, isOver() ? e.h : e.h)) {
            s.hit.push(e.id);
            const killed = hurtEnt(e, s.dmg);
            if (!s.pierce || killed && s.pierce <= 0) {
              if (s.pierce) s.pierce -= 1;
              else s.life = 0;
            } else {
              s.pierce -= 1;
            }
            if (s.life <= 0) break;
          }
        }
        const b = G.boss;
        if (s.life > 0 && b && !b.dead && b.max > 0 && (b.active || isOver())) {
          if (s.hit.indexOf(b.id) < 0) {
            const by = isOver() ? b.y - b.h * 0.5 : b.y - b.h;
            if (overlap(s.x - 3, s.y - 3, 6, 6, b.x - b.w * 0.5, by, b.w, b.h)) {
              s.hit.push(b.id);
              if (!b.active) b.active = true;
              hurtBoss(s.dmg);
              if (!s.pierce) s.life = 0;
              else s.pierce -= 1;
            }
          }
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        if (overlap(s.x - 3, s.y - 3, 6, 6, pb.x, pb.y, pb.w, pb.h)) {
          s.life = 0;
          die('hit');
        }
      }
    }
    for (i = G.shots.length - 1; i >= 0; i--) {
      if (G.shots[i].life <= 0) G.shots.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    const p = G.player;
    const pb = pBox();
    let i, u;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      u.y += Math.sin(u.t * 4) * 8 * dt;
      if (overlap(pb.x, pb.y, pb.w, pb.h, u.x - 10, u.y - 10, 20, 20)) takePickup(u);
    }
  }

  function updateFx(dt) {
    let i, o;
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.vy += (o.g || 0) * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.life -= dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > (rings[i].max || 0.4)) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= o.vy * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 0.18);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.bombFlash > 0) G.bombFlash -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.bombCd > 0) G.bombCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    if (isOver()) {
      const tx = clamp(p.x - VW * 0.45, 0, Math.max(0, G.levelW - VW));
      const ty = clamp(p.y - VH * 0.55, 0, Math.max(0, G.levelH - VH));
      G.camX = lerp(G.camX, tx, 0.12);
      G.camY = lerp(G.camY, ty, 0.12);
      return;
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      const tx = G.levelW - VW;
      G.camX = lerp(G.camX, tx, 0.08);
    } else {
      const tx = clamp(p.x - VW * 0.32, 0, Math.max(0, G.levelW - VW));
      G.camX = lerp(G.camX, tx, 0.1);
    }
    G.camY = 0;
  }

  function update(dt) {
    G.clock += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      return;
    }
    G.t += dt;
    if (G.mode === 'win' || G.mode === 'lose') {
      updateFx(dt);
      return;
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateCam(dt);
      updateFx(dt);
      if (G.clearT <= 0 && playing()) nextStage();
      return;
    }
    if (G.mode === 'title') demoThink();
    if (!(G.mode === 'play' || G.mode === 'title')) return;
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    if (!isOver()) updateCrash(dt);
    updateBoss(dt);
    updateShots(dt);
    updatePickups(dt);
    updateFx(dt);
    updateCam(dt);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (isOver()) {
      g.addColorStop(0, '#2a140c');
      g.addColorStop(0.45, '#1a0c08');
      g.addColorStop(1, '#120804');
    } else if (G.stage >= 3) {
      g.addColorStop(0, '#180810');
      g.addColorStop(0.5, '#12060c');
      g.addColorStop(1, '#0a0406');
    } else {
      g.addColorStop(0, '#24100a');
      g.addColorStop(0.55, '#160a08');
      g.addColorStop(1, '#0c0604');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawOverGround() {
    const x0 = G.camX;
    const y0 = G.camY;
    ctx.fillStyle = '#1a100c';
    ctx.fillRect(sx(0), sy(0), G.levelW * scale, G.levelH * scale);
    ctx.strokeStyle = 'rgba(255, 180, 80, 0.07)';
    ctx.lineWidth = 1;
    let gx, gy;
    for (gx = 0; gx < G.levelW; gx += 64) {
      ctx.beginPath();
      ctx.moveTo(sx(gx), sy(0));
      ctx.lineTo(sx(gx), sy(G.levelH));
      ctx.stroke();
    }
    for (gy = 0; gy < G.levelH; gy += 64) {
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(gy));
      ctx.lineTo(sx(G.levelW), sy(gy));
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.16)';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([10 * scale, 14 * scale]);
    ctx.beginPath();
    ctx.moveTo(sx(160), sy(1040));
    ctx.lineTo(sx(900), sy(880));
    ctx.lineTo(sx(1100), sy(480));
    ctx.lineTo(sx(1680), sy(260));
    ctx.stroke();
    ctx.setLineDash([]);
    let i, w;
    for (i = 0; i < G.walls.length; i++) {
      w = G.walls[i];
      if (w.x + w.w < x0 - 8 || w.x > x0 + VW + 8 || w.y + w.h < y0 - 8 || w.y > y0 + VH + 8) continue;
      const wx = sx(w.x);
      const wy = sy(w.y);
      const ww = w.w * scale;
      const wh = w.h * scale;
      ctx.fillStyle = '#24140e';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = 'rgba(255, 92, 18, 0.16)';
      ctx.fillRect(wx, wy, ww, 3 * scale);
      ctx.strokeStyle = 'rgba(255, 138, 58, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);
      if (w.w > 80 && w.h > 80) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.fillRect(wx + 8 * scale, wy + 10 * scale, 10 * scale, 8 * scale);
        ctx.fillRect(wx + 24 * scale, wy + 10 * scale, 10 * scale, 8 * scale);
      }
    }
  }

  function drawSideWorld() {
    let i;
    ctx.fillStyle = G.stage >= 3 ? '#14080c' : '#1a0e0a';
    ctx.fillRect(sx(0), sy(GY), G.levelW * scale, (VH - GY + 40) * scale);
    ctx.fillStyle = 'rgba(255, 92, 18, 0.18)';
    ctx.fillRect(sx(0), sy(GY), G.levelW * scale, 3 * scale);
    for (i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      if (p.base) {
        ctx.fillStyle = '#2a1810';
        ctx.fillRect(x, y, w, 40 * scale);
        ctx.fillStyle = rgba(HOT, 0.35);
        ctx.fillRect(x, y, w, 3 * scale);
      } else {
        ctx.fillStyle = '#3a2418';
        ctx.fillRect(x, y, w, 8 * scale);
        ctx.fillStyle = rgba(GOLD, 0.25);
        ctx.fillRect(x, y, w, 2 * scale);
      }
    }
    for (i = 0; i < G.crash.length; i++) {
      const c = G.crash[i];
      const st = crashState(c);
      const x = sx(c.x - c.w * 0.5);
      const y = sy(st.y - c.h);
      ctx.fillStyle = st.warn ? rgba(MAG, 0.55) : (st.crushing ? '#4a2018' : '#2a2018');
      ctx.fillRect(x, y, c.w * scale, c.h * scale);
      ctx.fillStyle = rgba(HOT, st.warn ? 0.8 : 0.35);
      ctx.fillRect(x, y, c.w * scale, 3 * scale);
      if (st.warn) {
        ctx.strokeStyle = rgba(MAG, 0.5);
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.strokeRect(x, sy(c.y - c.h), c.w * scale, c.h * scale);
        ctx.setLineDash([]);
      }
    }
  }

  function drawPickup(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y);
    const rgb = u.kind === 'B' ? GOLD : (u.kind === 'H' ? CYN : LEAF);
    ctx.fillStyle = rgba(rgb, 0.22);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.92);
    ctx.beginPath();
    ctx.ellipse(x, y, 8 * scale, 7 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#140808';
    ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.kind === 'B' ? 'B' : (u.kind || 'H'), x, y);
  }

  function drawOverSoldier(p, rgb, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const x = sx(p.x);
    const y = sy(p.y);
    const s = scale;
    const ang = Math.atan2(opt.aim.dy, opt.aim.dx);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(1 * s, 3 * s, 9 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 8 * s, 6.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.arc(-1 * s, 0, 4.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(-3.2 * s, -2.2 * s, 6.4 * s, 1.6 * s);
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(6 * s, -1.2 * s, 11 * s, 2.4 * s);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.fillRect(14 * s, -1.6 * s, 7 * s, 3.2 * s);
    if (opt.muzzle) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(22 * s, 0, 4 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCommando(p, rgb, opt) {
    const s = (opt.size || 1) * scale;
    const sq = opt.squash || 1;
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const duck = opt.duck;
    const aim = opt.aim || { dx: p.face, dy: 0 };
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const leg = Math.sin(opt.run || 0) * (duck ? 1 : 5) * s;
    const bodyH = duck ? 12 : 16;
    ctx.strokeStyle = rgba(BLU, 0.95);
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
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 12) * s, 5.4 * s, 5.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(-5.4 * s, -(bodyH + 13.6) * s, 10.8 * s, 2 * s);
    ctx.fillStyle = '#1a0a08';
    ctx.fillRect(1.4 * s, -(bodyH + 13.2) * s, 3.4 * s, 1.6 * s);
    const ldx = aim.dx * p.face;
    const ldy = aim.dy;
    ctx.strokeStyle = rgba(WHT, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -(bodyH + 2) * s);
    ctx.lineTo((2 + ldx * 11) * s, (-(bodyH + 2) + ldy * 11) * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 0.95);
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

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    if (e.kind === 'pod') {
      const rgb = e.gun === 'B' ? GOLD : CYN;
      ctx.fillStyle = rgba(rgb, 0.2);
      ctx.beginPath();
      ctx.arc(x, y - (isOver() ? 0 : 6) * s, 12 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y - (isOver() ? 0 : 6) * s, 9 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#140808';
      ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.gun || 'H', x, y - (isOver() ? 0 : 6) * s);
      return;
    }
    if (isOver()) {
      if (e.kind === 'tank') {
        ctx.fillStyle = '#2a2014';
        ctx.fillRect(x - 14 * s, y - 10 * s, 28 * s, 20 * s);
        ctx.fillStyle = rgba(HOT, 0.85);
        ctx.fillRect(x - 14 * s, y - 12 * s, 28 * s, 2.2 * s);
        ctx.fillStyle = '#4a4034';
        ctx.beginPath();
        ctx.arc(x, y, 6 * s, 0, TAU);
        ctx.fill();
        const a = Math.atan2(G.player.y - e.y, G.player.x - e.x);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillStyle = rgba(STEEL, 0.95);
        ctx.fillRect(0, -2 * s, 16 * s, 4 * s);
        ctx.restore();
        return;
      }
      if (e.kind === 'jeep') {
        ctx.fillStyle = rgba(HOT2, 0.92);
        ctx.fillRect(x - 11 * s, y - 7 * s, 22 * s, 14 * s);
        ctx.fillStyle = rgba(GOLD, 0.5);
        ctx.fillRect(x - 4 * s, y - 4 * s, 8 * s, 5 * s);
        ctx.fillStyle = '#1a1008';
        ctx.beginPath();
        ctx.arc(x - 7 * s, y + 6 * s, 2.4 * s, 0, TAU);
        ctx.arc(x + 7 * s, y + 6 * s, 2.4 * s, 0, TAU);
        ctx.fill();
        return;
      }
      if (e.kind === 'wreck') {
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(x - 13 * s, y - 8 * s, 26 * s, 16 * s);
        ctx.strokeStyle = rgba(HOT, 0.5);
        ctx.strokeRect(x - 13 * s, y - 8 * s, 26 * s, 16 * s);
        ctx.fillStyle = rgba(MAG, 0.35);
        ctx.fillRect(x - 6 * s, y - 3 * s, 8 * s, 5 * s);
        return;
      }
      if (e.kind === 'turret') {
        ctx.fillStyle = '#2a3038';
        ctx.fillRect(x - 10 * s, y - 8 * s, 20 * s, 16 * s);
        ctx.fillStyle = rgba(HOT, 0.85);
        ctx.fillRect(x - 10 * s, y - 10 * s, 20 * s, 2.2 * s);
        const a = Math.atan2(G.player.y - e.y, G.player.x - e.x);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillStyle = '#6a7080';
        ctx.fillRect(0, -2 * s, 16 * s, 4 * s);
        ctx.restore();
        return;
      }
      drawOverSoldier(e, e.kind === 'rush' ? HOT2 : LEAF, {
        aim: { dx: e.face || 1, dy: 0 }, muzzle: false, blink: false
      });
      return;
    }
    if (e.kind === 'nest') {
      ctx.fillStyle = '#2a3038';
      ctx.fillRect(x - 10 * s, y - 14 * s, 20 * s, 14 * s);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x - 10 * s, y - 16 * s, 20 * s, 2.2 * s);
      ctx.fillStyle = '#6a7080';
      const a = Math.atan2((G.player.y - 16) - (e.y - 10), G.player.x - e.x);
      ctx.save();
      ctx.translate(x, y - 10 * s);
      ctx.rotate(a);
      ctx.fillRect(0, -2 * s, 16 * s, 4 * s);
      ctx.restore();
      return;
    }
    if (e.kind === 'copter') {
      ctx.fillStyle = rgba(HOT2, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * s, 11 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(STEEL, 0.85);
      ctx.fillRect(x - 14 * s, y - 10 * s, 28 * s, 2.2 * s);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(x - 3 * s, y - 8 * s, 6 * s, 3 * s);
      return;
    }
    if (e.kind === 'gunner') {
      ctx.fillStyle = '#241410';
      ctx.fillRect(x - 11 * s, y - 22 * s, 22 * s, 22 * s);
      ctx.strokeStyle = rgba(HOT, 0.7);
      ctx.lineWidth = 1.4 * s;
      ctx.strokeRect(x - 11 * s, y - 22 * s, 22 * s, 22 * s);
    }
    const rgb = e.kind === 'rush' ? HOT2 : e.kind === 'gunner' ? MAG : LEAF;
    drawCommando(e, rgb, {
      run: e.t * 8, grounded: e.grounded, squash: 1,
      duck: false, aim: { dx: e.face, dy: 0 }, size: 0.92
    });
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || b.max <= 0) return;
    if (!b.active && G.mode !== 'title') {
      if (isOver()) {
        if (b.x < G.camX - 40 || b.x > G.camX + VW + 40 || b.y < G.camY - 40 || b.y > G.camY + VH + 40) return;
      } else if (b.x < G.camX - 20 || b.x > G.camX + VW + 40) return;
    }
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale;
    const flash = b.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    if (isOver()) {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#2a1410';
      ctx.fillRect(x - 28 * s, y - 24 * s, 56 * s, 48 * s);
      ctx.fillStyle = rgba(HOT, 0.92);
      ctx.fillRect(x - 28 * s, y - 26 * s, 56 * s, 4 * s);
      ctx.fillStyle = '#0a0404';
      ctx.fillRect(x - 10 * s, y - 8 * s, 20 * s, 22 * s);
      ctx.fillStyle = rgba(GOLD, 0.75 + Math.sin(G.clock * 8) * 0.2);
      ctx.beginPath();
      ctx.arc(x, y + 2 * s, 7 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(x - 22 * s, y + 12 * s, 12 * s, 5 * s);
      ctx.fillRect(x + 10 * s, y + 12 * s, 12 * s, 5 * s);
      return;
    }
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#2a1014';
    ctx.fillRect(x - 36 * s, y - 68 * s, 72 * s, 68 * s);
    ctx.fillStyle = rgba(HOT, 0.92);
    ctx.fillRect(x - 36 * s, y - 72 * s, 72 * s, 4 * s);
    ctx.fillStyle = '#0a0406';
    ctx.beginPath();
    ctx.arc(x - 2 * s, y - 36 * s, 16 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7 + Math.sin(G.clock * 7) * 0.25);
    ctx.beginPath();
    ctx.arc(x - 4 * s, y - 38 * s, 8 * s, 0, TAU);
    ctx.fill();
    const slamY = b.slam > 0 ? (1 - b.slam) * 18 * s : 0;
    ctx.fillStyle = '#3a2018';
    ctx.fillRect(x - 78 * s, y - 14 * s + slamY, 36 * s, 14 * s);
    ctx.fillRect(x + 42 * s, y - 14 * s + slamY, 36 * s, 14 * s);
    ctx.fillStyle = rgba(MAG, 0.75);
    ctx.fillRect(x - 28 * s, y - 18 * s, 16 * s, 6 * s);
    ctx.fillRect(x + 8 * s, y - 18 * s, 16 * s, 6 * s);
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing() || b.max <= 0) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.name, x, y - 3 * scale);
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.fillStyle = rgba(s.rgb, 0.95);
    if (s.kind === 'H') {
      ctx.beginPath();
      ctx.arc(x, y, 3.4 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.55);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x - s.vx * 0.02 * scale, y - s.vy * 0.02 * scale);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, (s.from === 'p' ? 2.4 : 2.8) * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawFx() {
    let i, o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const max = o.max || 0.4;
      const k = o.t / max;
      ctx.strokeStyle = rgba(o.rgb, 1 - k);
      ctx.lineWidth = (2 + (1 - k) * 4) * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + k * (o.max > 0.45 ? 120 : 22)) * scale, 0, TAU);
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
    ctx.fillStyle = '#160804';
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
    if (isOver()) drawOverGround();
    else drawSideWorld();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) {
      const opt = {
        run: G.player.run,
        grounded: G.player.grounded,
        squash: G.player.squash,
        duck: G.player.duck,
        aim: getAim(G.player),
        muzzle: G.muzzle > 0,
        blink: G.invuln > 0 && G.mode === 'play'
      };
      if (isOver()) drawOverSoldier(G.player, HOT, opt);
      else drawCommando(G.player, HOT, opt);
    }

    drawFx();
    drawBossBar();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    if (G.bombFlash > 0) {
      ctx.fillStyle = rgba(GOLD, G.bombFlash * 0.35);
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
    const bombKey = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;

    if (down && (isMove || space || bombKey || k === 'Enter')) e.preventDefault();
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
    if (bombKey) {
      tryBomb();
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
    hold(document.getElementById('btn-up'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-down'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    const bombBtn = document.getElementById('btn-bomb');
    if (bombBtn) {
      bombBtn.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        audio.ensure();
        bombBtn.classList.add('held');
        tryBomb();
      });
      const up = function (e) {
        e.preventDefault();
        bombBtn.classList.remove('held');
      };
      bombBtn.addEventListener('pointerup', up);
      bombBtn.addEventListener('pointercancel', up);
      bombBtn.addEventListener('pointerleave', up);
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      if (e.button === 2) {
        tryBomb();
        return;
      }
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
      keys.bomb = false;
    }
  });

  requestAnimationFrame(frame);
})();
