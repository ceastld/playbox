'use strict';

/* 落日 — Sunset Riders arcade lite. Side-scroll western run-and-gun. No CDN.
   Distinct from 烟枪 (vertical horse) and 制裁 (urban brawler). */

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const HP_MAX = 8;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 216;
  const HORSE_SPD = 268;
  const AIR = 0.9;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const INVULN = 1.35;
  const HIT_INV = 0.46;
  const DIE_T = 0.82;
  const BEST_KEY = 'playbox-sunset-riders-best';
  const MUTE_KEY = 'playbox-sunset-riders-mute';
  const OPS = 'WASD / 方向键 走跳蹲 · 空格八向拔枪 · 上马驰骋 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 20];
  const HOT2 = [255, 178, 74];
  const WHT = [246, 240, 230];
  const SKIN = [232, 176, 120];
  const RED = [220, 48, 40];
  const LEAF = [61, 255, 122];
  const DUST = [176, 128, 78];
  const BRN = [92, 52, 28];
  const WOOD = [138, 84, 42];
  const HAT = [196, 92, 28];
  const HORSE = [118, 72, 38];
  const SAND = [196, 132, 72];
  const PURP = [88, 36, 72];

  const GUN_NAME = { pistol: '双枪', rapid: '速射', twin: '双发' };
  const WEAPONS = {
    pistol: { cd: 0.15, max: 6, spd: 560, dmg: 1, spread: 1, life: 0.7, rgb: GOLD },
    rapid: { cd: 0.068, max: 10, spd: 620, dmg: 1, spread: 1, life: 0.62, rgb: HOT2 },
    twin: { cd: 0.16, max: 10, spd: 540, dmg: 1, spread: 2, life: 0.66, rgb: CYN }
  };

  const SCORE = {
    bandit: 100, dyn: 150, roof: 200, rider: 250, thrower: 180,
    wanted: 400, crate: 80, gold: 300, whiskey: 120, gunGet: 80,
    boss: 4000, stage: 2000
  };

  const STAGES = [
    {
      name: '荒镇', boss: '金胖子', bossKind: 'fat', w: 2440, hp: 28, theme: 'town',
      ground: [[0, 1180], [1540, 900]],
      plats: [
        [180, MY, 140], [420, MY, 160], [700, MY, 150],
        [1760, MY, 160], [2040, MY, 140],
        [500, HY, 110], [1880, HY, 120]
      ],
      horse: [1080, 1680],
      ents: [
        [280, GY, 'bandit', 40, 520],
        [460, GY, 'dyn', 80, 560],
        [500, MY, 'roof', 420, 580],
        [740, GY, 'bandit', 620, 900],
        [820, MY, 'wanted', 0, 0],
        [960, GY, 'thrower', 800, 1100],
        [1760, GY, 'bandit', 1560, 1900],
        [1840, MY, 'roof', 1760, 1920],
        [1980, GY, 'dyn', 1760, 2140],
        [2100, GY, 'rider', 1760, 2280],
        [2160, MY, 'wanted', 0, 0]
      ],
      crates: [[360, GY, 'whiskey'], [880, GY, 'rapid'], [1920, GY, 'gold']]
    },
    {
      name: '断崖', boss: '铁蹄', bossKind: 'chief', w: 2720, hp: 36, theme: 'canyon',
      ground: [[0, 640], [1080, 360], [1680, 1040]],
      plats: [
        [120, MY, 130], [380, MY, 140],
        [1180, MY, 160], [1480, MY, 140],
        [1880, MY, 170], [2280, MY, 150],
        [420, HY, 110], [1320, HY, 120], [2100, HY, 130]
      ],
      horse: [520, 1760],
      ents: [
        [240, GY, 'bandit', 20, 500],
        [400, MY, 'roof', 380, 520],
        [1140, GY, 'rider', 1080, 1400],
        [1220, MY, 'dyn', 1180, 1340],
        [1480, MY, 'thrower', 1480, 1620],
        [1760, GY, 'bandit', 1680, 1960],
        [1920, GY, 'dyn', 1760, 2140],
        [2040, MY, 'roof', 1880, 2050],
        [2200, GY, 'rider', 1880, 2480],
        [2360, GY, 'bandit', 1760, 2500],
        [2140, HY, 'wanted', 0, 0]
      ],
      crates: [[300, GY, 'twin'], [1840, GY, 'whiskey'], [2280, MY, 'rapid']]
    },
    {
      name: '庄园', boss: '落日王', bossKind: 'rose', w: 2960, hp: 48, theme: 'villa',
      ground: [[0, 520], [640, 280], [1040, 360], [1580, 320], [2080, 880]],
      plats: [
        [80, MY, 130], [300, MY, 150], [720, MY, 150],
        [1120, MY, 160], [1480, MY, 150], [1880, MY, 170],
        [2280, MY, 160], [2640, MY, 140],
        [360, HY, 110], [980, HY, 130], [1640, HY, 140], [2400, HY, 130]
      ],
      horse: [420, 900],
      ents: [
        [220, GY, 'bandit', 20, 480],
        [360, MY, 'roof', 300, 450],
        [700, GY, 'dyn', 640, 900],
        [800, MY, 'thrower', 720, 870],
        [1140, GY, 'rider', 1040, 1360],
        [1220, MY, 'roof', 1120, 1280],
        [1400, GY, 'bandit', 1040, 1400],
        [1680, GY, 'dyn', 1580, 1860],
        [1760, MY, 'wanted', 0, 0],
        [1920, GY, 'thrower', 1580, 2000],
        [2140, GY, 'bandit', 2080, 2360],
        [2240, MY, 'roof', 1880, 2050],
        [2480, GY, 'rider', 2080, 2720],
        [2560, MY, 'dyn', 2280, 2440],
        [2680, GY, 'bandit', 2080, 2840],
        [2420, HY, 'wanted', 0, 0]
      ],
      crates: [[480, GY, 'rapid'], [1280, MY, 'whiskey'], [1800, GY, 'twin'], [2520, GY, 'gold']]
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
  function spdMul(hail, stage) {
    return (hail ? 1.32 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function hpOf(kind) {
    if (kind === 'rider') return 3;
    if (kind === 'wanted' || kind === 'crate') return 1;
    return 2;
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.max(0, Math.floor(((n | 0) - 1) / 3)));
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 6) throw new Error('hp bar');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('hail faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!WEAPONS.pistol || !WEAPONS.rapid || !WEAPONS.twin) throw new Error('weapons');
    if (WEAPONS.rapid.cd >= WEAPONS.pistol.cd) throw new Error('rapid faster');
    if (WEAPONS.twin.spread < 2) throw new Error('twin');
    if (dirs8().length !== 8) throw new Error('8 dirs');
    if (BEST_KEY !== 'playbox-sunset-riders-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (!STAGES[0].horse || !STAGES[1].horse || !STAGES[2].horse) throw new Error('horse rides');
    let i, s, hasDyn, hasBandit;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      hasDyn = false;
      hasBandit = false;
      s.ents.forEach(function (e) {
        if (e[2] === 'dyn') hasDyn = true;
        if (e[2] === 'bandit') hasBandit = true;
      });
      if (!hasDyn) throw new Error('dynamite ' + s.name);
      if (!hasBandit) throw new Error('bandits ' + s.name);
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
  const btnBounty = document.getElementById('btn-bounty');
  const btnHail = document.getElementById('btn-hail');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeBounty = document.getElementById('mode-bounty');
  const modeHail = document.getElementById('mode-hail');
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
  const gunLabel = document.getElementById('gun-label');
  const rideLabel = document.getElementById('ride-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');
  const hpBar = document.getElementById('hp-bar');
  const bossWrap = document.getElementById('boss-wrap');
  const bossBar = document.getElementById('boss-bar');
  const bossName = document.getElementById('boss-name');

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
  let gallopT = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: true, u: false, fire: true };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const tumble = [];

  const G = {
    mode: 'title',
    kind: 'bounty',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2440,
    theme: 'town',
    plats: [],
    ents: [],
    shots: [],
    dyna: [],
    pickups: [],
    player: null,
    boss: null,
    horse: null,
    onHorse: false,
    hp: HP_MAX,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    weapon: 'pistol',
    fireCd: 0,
    checkX: 70,
    checkY: GY,
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
    hitFlash: 0
  };

  function isHail() {
    return G.kind === 'hail';
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
    shot(kind) {
      this.ensure();
      if (kind === 'rapid') {
        this.beep(1080, 0.032, 'square', 0.036, 440);
        this.noise(0.018, 0.018, 1800);
      } else if (kind === 'twin') {
        this.beep(760, 0.05, 'square', 0.04, 280);
        this.beep(980, 0.04, 'triangle', 0.028, 420);
        this.noise(0.022, 0.022, 1400);
      } else {
        this.beep(880, 0.045, 'square', 0.042, 320);
        this.noise(0.022, 0.022, 1600);
      }
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
      this.noise(0.16, 0.075, 220);
      this.beep(160, 0.18, 'sawtooth', 0.055, 48);
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
    hurt() {
      this.ensure();
      this.noise(0.05, 0.04, 700);
      this.beep(240, 0.08, 'square', 0.04, 110);
    },
    boss() {
      this.ensure();
      this.beep(160, 0.2, 'sawtooth', 0.05, 80);
      this.beep(90, 0.32, 'square', 0.04, 52);
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
    gallop() {
      this.ensure();
      this.noise(0.03, 0.022, 380);
      this.beep(90, 0.04, 'triangle', 0.02, 60);
    },
    mount() {
      this.ensure();
      this.beep(220, 0.08, 'triangle', 0.04, 360);
      this.noise(0.06, 0.03, 400);
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
    const h = isHail();
    if (modeBounty) modeBounty.setAttribute('aria-pressed', h ? 'false' : 'true');
    if (modeHail) modeHail.setAttribute('aria-pressed', h ? 'true' : 'false');
  }

  function syncHud() {
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 4);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', G.mode === 'win');
    }
    if (tagLabel) {
      tagLabel.textContent = isHail() ? '乱枪' : '赏金';
      tagLabel.classList.toggle('warn', isHail());
      tagLabel.classList.toggle('hot', G.mode === 'win');
    }
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[G.weapon] || '双枪';
      gunLabel.className = 'gun' + (G.weapon === 'rapid' ? ' rapid' : G.weapon === 'twin' ? ' twin' : '');
    }
    if (rideLabel) rideLabel.hidden = !G.onHorse;
    if (hpBar) {
      hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
      hpBar.classList.toggle('low', G.hp <= 3);
    }
    const bossOn = !!(G.boss && G.boss.active && !G.boss.dead && (playing() || G.mode === 'win'));
    if (bossWrap) bossWrap.hidden = !bossOn;
    if (bossOn && bossBar) {
      bossBar.style.transform = 'scaleX(' + clamp(G.boss.hp / G.boss.max, 0, 1) + ')';
      if (bossName) bossName.textContent = G.boss.title;
    }
    syncPips();
    syncModes();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind === 'lose' || kind === 'win');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'BOUNTY' : kind === 'lose' ? 'WANTED' : 'SUNSET';
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '乱枪' : '换模式';
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

  function dust(x, y, n, vx) {
    emit(n || 4, {
      x: x, y: y, j: 6,
      vx0: (vx || 0) - 40, vx1: (vx || 0) + 40,
      vy0: -50, vy1: 10,
      life: 0.28, r0: 1.2, r1: 2.6, rgb: DUST, g: 180
    });
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
    G.mult = comboMul(G.combo);
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) audio.combo(G.mult);
    syncHud();
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH, duck: false,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0
    };
  }

  function makePlat(x, y, w) {
    return { x: x, y: y, w: w, h: 12, base: false };
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const rider = kind === 'rider';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 1), fire: rand(0.3, 1.1),
      grounded: true,
      dead: false, hitN: 0,
      w: rider ? 22 : (kind === 'wanted' || kind === 'crate' ? 16 : 14),
      h: rider ? 28 : (kind === 'wanted' ? 22 : 24)
    };
  }

  function makeBoss(spec) {
    const hp = Math.round(spec.hp * (isHail() ? 1.22 : 1));
    return {
      id: uid++,
      x: spec.w - 120,
      y: GY,
      face: -1,
      kind: spec.bossKind,
      title: spec.boss,
      hp: hp,
      max: hp,
      t: 0,
      fire: 1.1,
      active: false,
      dead: false,
      hitN: 0,
      summoned: false,
      w: spec.bossKind === 'fat' ? 28 : spec.bossKind === 'chief' ? 26 : 20,
      h: spec.bossKind === 'fat' ? 36 : spec.bossKind === 'chief' ? 32 : 34
    };
  }

  function makeHorse(seg) {
    if (!seg) return null;
    return {
      start: seg[0],
      end: seg[1],
      x: seg[0],
      y: GY,
      live: true,
      wait: true
    };
  }

  function onGroundSpan(x) {
    const spec = STAGES[G.stage - 1];
    let i, g;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      if (x >= g[0] - 6 && x <= g[0] + g[1] + 6) return true;
    }
    return false;
  }

  function inHorseZone(x) {
    if (!G.horse) return false;
    const px = x == null ? G.player.x : x;
    return px >= G.horse.start - 8 && px <= G.horse.end + 24;
  }

  function seen(e) {
    return e.x > G.camX - 40 && e.x < G.camX + VW + 80;
  }

  function loadStage(n, demoMode) {
    const spec = STAGES[n - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.theme = spec.theme;
    G.plats = spec.plats.map(function (p) { return makePlat(p[0], p[1], p[2]); });
    G.ents = [];
    G.shots = [];
    G.dyna = [];
    G.pickups = [];
    G.horse = makeHorse(spec.horse);
    G.onHorse = false;
    G.boss = makeBoss(spec);
    G.clearT = 0;
    G.lock = 0;
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.muzzle = 0;
    G.checkX = 70;
    G.checkY = GY;
    uid = 1;
    let i, e, extra;
    for (i = 0; i < spec.ents.length; i++) {
      e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    for (i = 0; i < spec.crates.length; i++) {
      e = spec.crates[i];
      extra = makeEnt(e[0], e[1], 'crate', 0, 0);
      extra.drop = e[2];
      G.ents.push(extra);
    }
    if (isHail() && !demoMode) {
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        if (e[2] === 'bandit' || e[2] === 'dyn' || e[2] === 'thrower') {
          G.ents.push(makeEnt(e[0] + 70, e[1], e[2], e[3], e[4]));
        }
      }
    }
    G.player = makePlayer(70, GY);
    G.deadT = 0;
    G.invuln = demoMode ? 99 : 0.4;
    G.hitFlash = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    tumble.length = 0;
    for (i = 0; i < 6; i++) {
      tumble.push({
        x: rand(80, spec.w - 80),
        y: GY - 8,
        vx: rand(28, 54),
        a: rand(0, TAU)
      });
    }
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'hail' ? 'hail' : 'bounty';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'pistol';
    G.hp = HP_MAX;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    if (scoreEl) scoreEl.textContent = '0';
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isHail() ? '乱枪' : STAGES[0].name, false, !isHail());
    setHint(isHail() ? '敌更快更密 · 空格拔枪 · 上马驰骋' : '走跳蹲 · 空格八向拔枪 · 上马驰骋', isHail() ? 'warn' : '');
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'bounty';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'pistol';
    G.hp = HP_MAX;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '落日', '侧向跑跳，八向拔枪。马上驰骋，炸匪、轰头目。<br />中弹扣血，血空丢命。');
    setHint('走跳蹲 · 空格八向拔枪 · 上马驰骋 · 中弹扣血');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('bounty');
    else startGame(G.kind || 'bounty');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('bounty');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why || '被击中了';
    showOverlay('lose', why, '赏金泡汤。血空丢命，三条命花完。<br />R 立刻重开。');
    setHint('R 重开 · 再来同一模式', 'warn');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    addScore(8000);
    audio.win();
    kick(5, 'win-flash');
    screenFlash(GOLD, 0.55);
    showOverlay('win', isHail() ? '乱枪得手' : '庄园平了', isHail()
      ? '乱枪清场。再来一局，或换回赏金。'
      : '三关赏金收齐。乱枪更密更快。');
    setHint(isHail() ? '乱枪得手' : '庄园平了 · 乱枪更密', 'hot');
    syncHud();
  }

  function nextStage() {
    addScore(SCORE.stage * G.stage * G.mult);
    if (G.stage >= 3) {
      goWin();
      return;
    }
    G.hp = Math.min(HP_MAX, G.hp + 3);
    audio.stage();
    toast(STAGES[G.stage].name, false, true);
    loadStage(G.stage + 1, false);
    G.invuln = 0.8;
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({
      x: x, y: y - 18, kind: kind, t: 0, live: true, vy: -80
    });
  }

  function givePickup(kind) {
    if (kind === 'whiskey') {
      G.hp = Math.min(HP_MAX, G.hp + 4);
      audio.ping();
      toast('威士忌', false, true);
      addScore(SCORE.whiskey);
      kick(2, 'pickup');
      screenFlash(GOLD, 0.28);
    } else if (kind === 'gold') {
      audio.ping();
      toast('金袋', false, true);
      addScore(SCORE.gold * G.mult);
      kick(2, 'pickup');
    } else if (kind === 'rapid' || kind === 'twin') {
      G.weapon = kind;
      audio.ping();
      toast(GUN_NAME[kind], false, true);
      addScore(SCORE.gunGet);
      kick(2.4, 'pickup');
      screenFlash(kind === 'twin' ? CYN : HOT, 0.3);
    }
    syncHud();
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    const bonus = e.kind === 'wanted';
    const pts = (SCORE[e.kind] || 100) * G.mult;
    bumpCombo();
    addScore(pts);
    floatText(e.x, e.y - 24, '+' + pts, bonus ? GOLD : WHT, bonus || G.mult >= 2);
    juice(e.x, e.y - 12, bonus ? GOLD : HOT2, bonus ? 1.4 : 0.85);
    audio.hit(G.combo);
    hitStop(0.042 + Math.min(0.03, G.combo * 0.004));
    if (e.kind === 'crate' && e.drop) spawnPickup(e.x, e.y, e.drop);
    if (e.kind === 'wanted') toast('通缉令', false, true);
  }

  function hurtBoss(b, dmg) {
    if (b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 1;
    bumpCombo();
    addScore(40 * G.mult);
    audio.hit(G.combo);
    juice(b.x, b.y - 18, GOLD, 0.7);
    hitStop(0.05);
    kick(2.6);
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = true;
      G.clearT = 1.85;
      G.lock = 1.85;
      G.onHorse = false;
      addScore(SCORE.boss * G.stage * G.mult);
      floatText(b.x, b.y - 40, b.title + ' 倒了', GOLD, true);
      juice(b.x, b.y - 16, GOLD, 2.2);
      audio.boom();
      hitStop(0.08);
      kick(7, 'boom');
      screenFlash(GOLD, 0.55);
      toast(b.title + ' 倒了', false, true);
    }
    syncHud();
  }

  function die(why) {
    if (G.deadT > 0) return;
    G.why = why;
    G.lives -= 1;
    G.deadT = DIE_T;
    G.onHorse = false;
    G.weapon = 'pistol';
    G.hp = 0;
    audio.death();
    juice(G.player.x, G.player.y - 12, MAG, 1.6);
    hitStop(0.07);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    syncHud();
    syncPips();
  }

  function respawn() {
    G.hp = HP_MAX;
    G.invuln = INVULN;
    G.deadT = 0;
    G.onHorse = false;
    G.weapon = 'pistol';
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.face = 1;
    toast('重整鞍具', false, false);
    syncHud();
  }

  function hurt(dmg, why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    G.hp -= dmg;
    G.hitFlash = 0.18;
    juice(G.player.x, G.player.y - 14, MAG, 0.7);
    kick(3.2, 'hit');
    hitStop(0.036);
    if (G.hp <= 0) {
      G.hp = 0;
      die(why);
    } else {
      G.invuln = HIT_INV;
      audio.hurt();
    }
    syncHud();
  }

  function fireShot(x, y, dir, friendly, rgb, dmg, spd, life) {
    G.shots.push({
      x: x, y: y,
      vx: dir.dx * spd,
      vy: dir.dy * spd,
      life: life,
      max: life,
      dmg: dmg,
      friendly: friendly,
      rgb: rgb,
      r: friendly ? 2.4 : 2.8
    });
    capArr(G.shots, 80);
  }

  function aimDir() {
    const p = G.player;
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    const standUp = fireHeld() && inU() && !inL() && !inR() && p.grounded && !inD();
    if (standUp) dy -= 1;
    else if (!p.grounded) {
      if (inU()) dy -= 1;
      if (inD()) dy += 1;
    } else if (p.duck) {
      dy = 0;
    }
    if (!dx && !dy) dx = p.face;
    return norm8(dx, dy);
  }

  function playerFire() {
    if (G.fireCd > 0 || G.deadT > 0 || G.lock > 0) return;
    if (G.mode !== 'title' && overlayOpen()) return;
    const wep = WEAPONS[G.weapon] || WEAPONS.pistol;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].friendly) n += 1;
    if (n >= wep.max) return;
    const p = G.player;
    const dir = aimDir();
    const h = p.duck ? 10 : (G.onHorse ? 22 : 16);
    const ox2 = dir.dx * 12;
    const oy2 = -h + dir.dy * 6;
    if (wep.spread >= 2) {
      fireShot(p.x + ox2, p.y + oy2 - 4, dir, true, wep.rgb, wep.dmg, wep.spd, wep.life);
      fireShot(p.x + ox2, p.y + oy2 + 4, dir, true, wep.rgb, wep.dmg, wep.spd, wep.life);
    } else {
      fireShot(p.x + ox2, p.y + oy2, dir, true, wep.rgb, wep.dmg, wep.spd, wep.life);
    }
    G.fireCd = wep.cd;
    G.muzzle = 0.055;
    if (playing() || G.mode === 'title') audio.shot(G.weapon);
    emit(3, {
      x: p.x + ox2, y: p.y + oy2, j: 3,
      vx0: dir.dx * 80, vx1: dir.dx * 180, vy0: -40, vy1: 30,
      life: 0.12, r0: 1, r1: 2, rgb: GOLD, g: 0
    });
  }

  function enemyShot(e, dir) {
    const d = dir.dx || dir.dy ? dir : { dx: e.face, dy: 0 };
    const n = hypot(d.dx, d.dy) || 1;
    fireShot(e.x + (d.dx / n) * 10, e.y - (e.h * 0.55), { dx: d.dx / n, dy: d.dy / n }, false, HOT, 2, 280 * spdMul(isHail(), G.stage), 1.4);
  }

  function tossDyn(e) {
    const p = G.player;
    const dx = p.x - e.x;
    const t = clamp(Math.abs(dx) / 180, 0.55, 1.15);
    G.dyna.push({
      x: e.x, y: e.y - 18,
      vx: dx / t * 0.55,
      vy: -240 - rand(0, 80),
      fuse: 1.15,
      live: true
    });
    capArr(G.dyna, 24);
  }

  function tossKnife(e) {
    const p = G.player;
    const dx = p.x - e.x;
    const dy = (p.y - 16) - (e.y - 16);
    const n = hypot(dx, dy) || 1;
    fireShot(e.x, e.y - 16, { dx: dx / n, dy: dy / n * 0.4 - 0.35 }, false, LEAF, 2, 260, 1.5);
  }

  function explode(x, y) {
    juice(x, y, HOT, 1.5);
    audio.boom();
    hitStop(0.055);
    kick(4.2, 'boom');
    const p = G.player;
    if (playing() && G.deadT <= 0 && hypot(p.x - x, (p.y - 12) - y) < 42) {
      hurt(3, '被炸到了');
    }
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - x, (e.y - 10) - y) < 40) {
        e.hp -= 2;
        if (e.hp <= 0) killEnt(e);
      }
    }
  }

  function pitAhead(x, face) {
    return !onGroundSpan(x + face * 52) && !inHorseZone(x + face * 52);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.fire = true;
    const nearHorse = !!(G.horse && G.horse.live && p.x > G.horse.start - 90 && p.x < G.horse.end);
    demo.u = !nearHorse && pitAhead(p.x, 1) && p.grounded;
    if (G.boss && G.boss.active) demo.u = G.t % 1.4 < 0.18;
    if (p.x > G.levelW - 220) {
      loadStage(1, true);
      G.invuln = 99;
    }
  }

  function tryMount() {
    const h = G.horse;
    const p = G.player;
    if (!h || !h.live || G.onHorse || G.deadT > 0) return;
    if (p.grounded && p.y >= GY - 6 && p.x >= h.start - 12 && p.x < h.end - 24) {
      G.onHorse = true;
      h.wait = false;
      p.face = 1;
      if (playing()) {
        audio.mount();
        toast('上马', false, true);
      }
      dust(p.x, p.y, 8, 40);
      kick(2, 'thump');
      syncHud();
    }
  }

  function tryDismount() {
    const h = G.horse;
    const p = G.player;
    if (!G.onHorse || !h) return;
    if (p.x >= h.end) {
      G.onHorse = false;
      h.live = false;
      p.vy = -120;
      p.grounded = false;
      if (playing()) toast('下马', false, false);
      dust(p.x, p.y, 8, 80);
      syncHud();
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

    const standUp = fireHeld() && inU() && !inL() && !inR() && p.grounded && !inD();
    p.duck = !!(p.grounded && inD() && !inU() && !G.onHorse);
    p.h = p.duck ? 14 : PH;

    if (G.onHorse) {
      p.vx = HORSE_SPD;
      if (ax < 0) p.vx = HORSE_SPD * 0.72;
      if (ax > 0) p.vx = HORSE_SPD * 1.08;
      p.face = 1;
      p.x += p.vx * dt;
    } else {
      const spd = WALK * (p.grounded ? (p.duck ? 0.55 : 1) : AIR);
      p.vx = p.duck ? 0 : ax * spd;
      p.x += p.vx * dt;
    }

    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (inU() && !p.duck && !standUp) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = (p.grounded || p.coyote > 0) && !p.duck && !standUp;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      if (playing() || G.mode === 'title') audio.hop();
      dust(p.x, p.y, 5, p.vx * 0.2);
      hitStop(0.028);
    }
    if (!inU() && p.vy < -80) p.vy *= Math.pow(0.42, dt * 8);

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    p.y += p.vy * dt;

    const wasGround = p.grounded;
    p.grounded = false;

    const horseFloor = G.onHorse && inHorseZone(p.x);
    if (p.vy >= 0 && p.y >= GY && (horseFloor || onGroundSpan(p.x))) {
      p.y = GY;
      p.vy = 0;
      p.grounded = true;
    }

    if (!p.grounded && p.vy >= 0) {
      let i, pl, top;
      for (i = 0; i < G.plats.length; i++) {
        pl = G.plats[i];
        if (G.dropPlat === pl && G.dropT > 0) continue;
        if (p.x < pl.x - 2 || p.x > pl.x + pl.w + 2) continue;
        top = pl.y;
        if (y0 <= top + 4 && p.y >= top && p.vy >= 0) {
          if (p.duck && inD()) {
            G.dropPlat = pl;
            G.dropT = 0.18;
            continue;
          }
          p.y = top;
          p.vy = 0;
          p.grounded = true;
          break;
        }
      }
    }

    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.grounded && !wasGround && p.squash < 1.08) {
      p.squash = 1.18;
      if (playing()) audio.land();
      dust(p.x, p.y, 6, 0);
      kick(1.6, 'thump');
    }

    p.squash += (1 - p.squash) * clamp(dt * 12, 0, 1);
    p.run += Math.abs(p.vx) * dt * 0.02;
    p.pose += dt;

    if (p.grounded && Math.abs(p.vx) > 40) {
      if ((p.run * 10 | 0) !== ((p.run - dt * Math.abs(p.vx) * 0.02) * 10 | 0)) dust(p.x, p.y, 1, -p.face * 30);
    }

    if (p.y > VH + 48) die('坠入谷底了');

    if (p.grounded && onGroundSpan(p.x) && !G.onHorse) {
      G.checkX = p.x;
      G.checkY = GY;
    }

    tryMount();
    tryDismount();

    if (G.onHorse && G.horse) {
      G.horse.x = p.x;
      G.horse.y = GY;
      gallopT -= dt;
      if (gallopT <= 0 && p.grounded) {
        gallopT = 0.16;
        if (playing()) audio.gallop();
        dust(p.x - 10, p.y, 3, -80);
      }
    }

    if (G.dropT > 0) G.dropT -= dt;
    else G.dropPlat = null;

    G.fireCd -= dt;
    if (fireHeld()) playerFire();
    if (G.muzzle > 0) G.muzzle -= dt;
  }

  function updateEnts(dt) {
    const mul = spdMul(isHail(), G.stage);
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      e.t += dt;
      e.hitN = Math.max(0, e.hitN - dt * 8);
      if (!seen(e) && e.kind !== 'rider') continue;
      if (e.kind === 'wanted' || e.kind === 'crate') continue;

      if (e.kind === 'roof') {
        e.fire -= dt;
        if (e.fire <= 0 && live() && Math.abs(G.player.x - e.x) < 340) {
          const dx = G.player.x - e.x;
          const dy = (G.player.y - 14) - (e.y - 12);
          const n = hypot(dx, dy) || 1;
          enemyShot(e, { dx: dx / n, dy: dy / n });
          e.fire = rand(0.85, 1.45) / mul;
        }
        continue;
      }

      if (e.kind === 'rider') {
        if (G.player.x > e.x + 10) e.face = 1;
        else if (G.player.x < e.x - 10) e.face = -1;
        e.x += e.face * 96 * mul * dt;
        e.x = clamp(e.x, e.a || e.x - 40, e.b || e.x + 40);
        e.fire -= dt;
        if (e.fire <= 0 && live() && Math.abs(G.player.x - e.x) < 300) {
          enemyShot(e, { dx: e.face, dy: 0 });
          e.fire = rand(0.7, 1.2) / mul;
        }
        continue;
      }

      e.x += e.face * 58 * mul * dt;
      if (e.x < e.a) { e.x = e.a; e.face = 1; }
      if (e.x > e.b) { e.x = e.b; e.face = -1; }
      if (live() && Math.abs(G.player.x - e.x) < 300) {
        e.face = G.player.x > e.x ? 1 : -1;
        e.fire -= dt;
        if (e.fire <= 0) {
          if (e.kind === 'dyn') tossDyn(e);
          else if (e.kind === 'thrower') tossKnife(e);
          else enemyShot(e, { dx: e.face, dy: 0 });
          e.fire = rand(0.72, 1.28) / mul;
        }
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    b.hitN = Math.max(0, b.hitN - dt * 8);
    if (!b.active) {
      if (G.player.x > G.levelW - VW * 0.78 && G.deadT <= 0) {
        b.active = true;
        G.onHorse = false;
        audio.boss();
        toast(b.title, false, true);
        kick(4, 'boom');
        screenFlash(HOT, 0.28);
        syncHud();
      }
      return;
    }
    if (G.lock > 0 && G.clearT > 0) return;
    b.t += dt;
    b.fire -= dt;
    const mul = spdMul(isHail(), G.stage);
    const arenaL = G.levelW - VW + 70;
    const arenaR = G.levelW - 50;
    if (b.kind === 'chief') {
      b.x += b.face * 120 * mul * dt;
    } else {
      b.x += b.face * 62 * mul * dt;
    }
    if (b.x < arenaL) { b.x = arenaL; b.face = 1; }
    if (b.x > arenaR) { b.x = arenaR; b.face = -1; }
    if (G.player.x > b.x + 30) b.face = 1;
    else if (G.player.x < b.x - 30) b.face = -1;

    if (b.kind === 'fat' && b.fire <= 0) {
      let a;
      for (a = -0.42; a <= 0.42; a += 0.42) {
        enemyShot(b, { dx: b.face * Math.cos(a), dy: Math.sin(a) * 0.85 });
      }
      if (b.hp < b.max * 0.45) tossDyn(b);
      b.fire = (b.hp < b.max * 0.4 ? 0.72 : 1.12) / mul;
    } else if (b.kind === 'chief' && b.fire <= 0) {
      enemyShot(b, { dx: b.face, dy: 0 });
      enemyShot(b, { dx: b.face * 0.9, dy: -0.35 });
      if (b.hp < b.max * 0.55) tossDyn(b);
      b.fire = (b.hp < b.max * 0.4 ? 0.62 : 0.92) / mul;
    } else if (b.kind === 'rose' && b.fire <= 0) {
      let k;
      for (k = -2; k <= 2; k++) {
        const ang = k * 0.3;
        enemyShot(b, { dx: b.face * Math.cos(ang), dy: Math.sin(ang) });
      }
      b.fire = (b.hp < b.max * 0.45 ? 0.55 : 0.92) / mul;
    }
    if (b.kind === 'rose' && b.hp < b.max * 0.4 && !b.summoned) {
      b.summoned = true;
      G.ents.push(makeEnt(b.x - 80, GY, 'bandit', G.levelW - VW + 40, G.levelW - 40));
      G.ents.push(makeEnt(b.x + 80, GY, 'dyn', G.levelW - VW + 40, G.levelW - 40));
      toast('帮手来了', true, false);
    }
  }

  function updateShots(dt) {
    let i, s, j, e, hit;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.camX - 30 || s.x > G.camX + VW + 30 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.friendly) {
        hit = false;
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (Math.abs(s.x - e.x) < e.w * 0.55 + 4 && Math.abs(s.y - (e.y - e.h * 0.5)) < e.h * 0.5 + 3) {
            e.hp -= s.dmg;
            e.hitN = 1;
            popSpark(s.x, s.y, s.rgb, 10);
            emit(4, {
              x: s.x, y: s.y, j: 4,
              vx0: -80, vx1: 80, vy0: -120, vy1: -10,
              life: 0.18, r0: 1, r1: 2.2, rgb: s.rgb, g: 200
            });
            if (playing()) {
              audio.hit(G.combo);
              hitStop(0.032);
            }
            if (e.hp <= 0) killEnt(e);
            G.shots.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
        if (G.boss && G.boss.active && !G.boss.dead) {
          e = G.boss;
          if (Math.abs(s.x - e.x) < e.w * 0.5 + 4 && Math.abs(s.y - (e.y - e.h * 0.5)) < e.h * 0.5 + 3) {
            hurtBoss(e, s.dmg);
            G.shots.splice(i, 1);
          }
        }
      } else if (playing() && G.deadT <= 0) {
        const p = G.player;
        const ph = p.duck ? 14 : (G.onHorse ? 30 : PH);
        if (Math.abs(s.x - p.x) < 8 && Math.abs(s.y - (p.y - ph * 0.55)) < ph * 0.55) {
          G.shots.splice(i, 1);
          hurt(2, '被击中了');
        }
      }
    }
  }

  function updateDyna(dt) {
    let i, d;
    for (i = G.dyna.length - 1; i >= 0; i--) {
      d = G.dyna[i];
      if (!d.live) {
        G.dyna.splice(i, 1);
        continue;
      }
      d.vy += GRAV * 0.72 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.fuse -= dt;
      if (d.y >= GY - 4 && d.vy > 0) {
        d.y = GY - 4;
        d.vy *= -0.25;
        d.vx *= 0.6;
      }
      if (d.fuse <= 0) {
        explode(d.x, d.y);
        G.dyna.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0) {
        const p = G.player;
        if (hypot(d.x - p.x, d.y - (p.y - 12)) < 14) {
          explode(d.x, d.y);
          G.dyna.splice(i, 1);
        }
      }
    }
  }

  function updatePickups(dt) {
    let i, u, p;
    p = G.player;
    for (i = G.pickups.length - 1; i >= 0; i--) {
      u = G.pickups[i];
      u.t += dt;
      u.vy += 520 * dt;
      u.y += u.vy * dt;
      if (u.y > GY - 12) { u.y = GY - 12; u.vy = 0; }
      if (!u.live || u.t > 9) {
        G.pickups.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && Math.abs(u.x - p.x) < 16 && Math.abs(u.y - (p.y - 12)) < 20) {
        givePickup(u.kind);
        G.pickups.splice(i, 1);
      }
    }
  }

  function collideBodies() {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    const p = G.player;
    const ph = p.duck ? 14 : (G.onHorse ? 28 : PH);
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || e.kind === 'wanted' || e.kind === 'crate') continue;
      if (Math.abs(e.x - p.x) < (e.w + 12) * 0.5 && Math.abs((e.y - e.h * 0.5) - (p.y - ph * 0.5)) < (e.h + ph) * 0.42) {
        hurt(2, '撞上了');
        return;
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      e = G.boss;
      if (Math.abs(e.x - p.x) < (e.w + 12) * 0.5 && Math.abs((e.y - e.h * 0.5) - (p.y - ph * 0.5)) < (e.h + ph) * 0.4) {
        hurt(3, '撞上了');
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let target = (G.onHorse ? p.x : p.x) - 200;
    if (G.boss && G.boss.active && !G.boss.dead) target = G.levelW - VW;
    target = clamp(target, 0, Math.max(0, G.levelW - VW));
    G.camX += (target - G.camX) * clamp(dt * 6.2, 0, 1);
    let ty = 0;
    if (p.y < HY + 30) ty = p.y - HY - 40;
    G.camY += (ty - G.camY) * clamp(dt * 4, 0, 1);
    if (G.shake > 0 && !REDUCE) {
      G.camX += Math.sin(G.t * 73) * G.shake * 0.35;
      G.camY += Math.cos(G.t * 61) * G.shake * 0.22;
    }
  }

  function updateFx(dt) {
    let i, p, s;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      s = floats[i];
      s.t += dt;
      s.y -= s.vy * dt;
      if (s.t > s.life) floats.splice(i, 1);
    }
    for (i = 0; i < tumble.length; i++) {
      s = tumble[i];
      s.x += s.vx * dt;
      s.a += dt * 4;
      if (s.x > G.levelW) s.x = 0;
    }
    if (G.hitFlash > 0) G.hitFlash -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.12);
      return;
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateFx(dt);
      updateCam(dt);
      if (G.clearT <= 0 && playing()) nextStage();
      return;
    }
    if (G.mode === 'title') demoThink();
    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      return;
    }
    if (!live()) return;
    updatePlayer(dt);
    updateEnts(dt);
    updateBoss(dt);
    updateShots(dt);
    updateDyna(dt);
    updatePickups(dt);
    collideBodies();
    updateCam(dt);
    updateFx(dt);
  }

  function fill(x, y, w, h, rgb, a) {
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
  }
  function disc(x, y, r, rgb, a) {
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), r * scale, 0, TAU);
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.fill();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.theme === 'canyon') {
      g.addColorStop(0, '#3a1028');
      g.addColorStop(0.45, '#c44a28');
      g.addColorStop(0.78, '#e87830');
      g.addColorStop(1, '#f0b060');
    } else if (G.theme === 'villa') {
      g.addColorStop(0, '#281018');
      g.addColorStop(0.4, '#8a2048');
      g.addColorStop(0.75, '#e05a28');
      g.addColorStop(1, '#f0a048');
    } else {
      g.addColorStop(0, '#241018');
      g.addColorStop(0.42, '#a83828');
      g.addColorStop(0.72, '#e07028');
      g.addColorStop(1, '#f4c070');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const sunX = G.camX + VW * 0.78;
    const sunY = 58;
    disc(sunX, sunY, 28, GOLD, 0.95);
    disc(sunX, sunY, 42, HOT, 0.18);
    disc(sunX, sunY, 62, [255, 120, 40], 0.08);

    let i, mx, mw, mh, par;
    par = G.camX * 0.22;
    for (i = 0; i < 10; i++) {
      mx = i * 220 - 40 - par;
      mw = 140 + hash2(i + 3) * 90;
      mh = 46 + hash2(i + 9) * 70;
      ctx.fillStyle = rgba(PURP, 0.55);
      ctx.beginPath();
      ctx.moveTo(sx(mx), sy(GY - 18));
      ctx.lineTo(sx(mx + mw * 0.5), sy(GY - 18 - mh));
      ctx.lineTo(sx(mx + mw), sy(GY - 18));
      ctx.fill();
    }
  }

  function drawCactus(x, y, h) {
    fill(x - 3, y - h, 6, h, [36, 92, 48]);
    fill(x - 12, y - h * 0.55, 10, 4, [36, 92, 48]);
    fill(x - 12, y - h * 0.55 - 14, 4, 14, [36, 92, 48]);
    fill(x + 3, y - h * 0.4, 10, 4, [36, 92, 48]);
    fill(x + 9, y - h * 0.4 - 12, 4, 12, [36, 92, 48]);
  }

  function drawBuilding(x, w, h, seed) {
    fill(x, GY - h, w, h, [48, 26, 16], 0.95);
    fill(x, GY - h, w, 6, WOOD);
    const win = 2 + (hash2(seed) * 3 | 0);
    let i;
    for (i = 0; i < win; i++) {
      fill(x + 8 + i * ((w - 16) / win), GY - h + 16, 10, 12, GOLD, 0.35 + hash2(seed + i) * 0.4);
    }
    fill(x + w * 0.5 - 8, GY - 22, 16, 22, BRN);
    if (hash2(seed + 4) > 0.55) {
      fill(x + 6, GY - h + 8, w - 12, 5, HOT, 0.7);
    }
  }

  function drawGround() {
    const spec = STAGES[G.stage - 1];
    let i, g, x0, x1;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      x0 = g[0];
      x1 = g[0] + g[1];
      fill(x0, GY, x1 - x0, VH - GY + 40, [42, 22, 12]);
      fill(x0, GY, x1 - x0, 8, SAND);
      fill(x0, GY, x1 - x0, 3, HOT2, 0.55);
    }
    let pl;
    for (i = 0; i < G.plats.length; i++) {
      pl = G.plats[i];
      fill(pl.x, pl.y, pl.w, 8, WOOD);
      fill(pl.x, pl.y, pl.w, 2, GOLD, 0.45);
      fill(pl.x + 4, pl.y + 8, 3, 18, BRN, 0.8);
      fill(pl.x + pl.w - 7, pl.y + 8, 3, 18, BRN, 0.8);
    }
  }

  function drawDecor() {
    const from = G.camX - 40;
    const to = G.camX + VW + 80;
    let x, h, s;
    if (G.theme === 'town') {
      for (x = 0; x < G.levelW; x += 180) {
        s = hash2((x / 180) | 0);
        if (x + 80 < from || x > to) continue;
        if (!onGroundSpan(x + 40) && !inHorseZone(x + 40)) continue;
        drawBuilding(x + 10, 70 + s * 40, 48 + s * 36, x);
      }
    } else if (G.theme === 'canyon') {
      for (x = 40; x < G.levelW; x += 90) {
        if (x < from || x > to) continue;
        if (!onGroundSpan(x)) continue;
        h = 18 + hash2(x) * 28;
        drawCactus(x, GY, h);
      }
    } else {
      for (x = 60; x < G.levelW; x += 160) {
        if (x < from || x > to) continue;
        if (!onGroundSpan(x)) continue;
        fill(x, GY - 70, 14, 70, [72, 32, 28]);
        fill(x - 8, GY - 78, 30, 10, [90, 40, 32]);
      }
      fill(G.levelW - 280, GY - 96, 160, 96, [64, 28, 24]);
      fill(G.levelW - 280, GY - 96, 160, 8, GOLD, 0.4);
    }
    for (x = 0; x < tumble.length; x++) {
      s = tumble[x];
      if (s.x < from || s.x > to) continue;
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(s.a);
      ctx.strokeStyle = rgba(DUST, 0.7);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 6 * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (G.horse && G.horse.live && G.horse.wait && !G.onHorse) {
      drawHorse(G.horse.x, G.horse.y, 1, G.t, false);
    }
  }

  function drawHorse(x, y, face, t, riding) {
    const g = (riding ? G.t * 14 : 0);
    const leg = Math.sin(g) * 5;
    const bob = riding ? Math.sin(g) * 1.5 : 0;
    ctx.save();
    ctx.translate(sx(x), sy(y - 2 + bob));
    ctx.scale(face * scale, scale);
    ctx.fillStyle = rgba(HORSE, 1);
    ctx.fillRect(-16, -18, 30, 14);
    ctx.fillRect(10, -26, 10, 10);
    ctx.fillRect(18, -24, 8, 5);
    ctx.fillStyle = rgba(BRN, 1);
    ctx.fillRect(-14, -4, 4, 10 + leg);
    ctx.fillRect(-4, -4, 4, 10 - leg);
    ctx.fillRect(4, -4, 4, 10 + leg * 0.6);
    ctx.fillRect(12, -4, 4, 10 - leg * 0.6);
    ctx.fillStyle = rgba(DUST, 1);
    ctx.fillRect(-18, -16, 6, 3);
    ctx.fillStyle = rgba([40, 24, 16], 1);
    ctx.fillRect(16, -28, 6, 3);
    if (riding) {
      ctx.fillStyle = rgba(WOOD, 1);
      ctx.fillRect(-6, -22, 14, 4);
    }
    ctx.restore();
  }

  function drawCowboy(x, y, face, opts) {
    const duck = opts.duck;
    const inv = opts.inv;
    const horse = opts.horse;
    const squash = opts.squash || 1;
    const flash = opts.muzzle;
    const run = opts.run || 0;
    if (inv && ((G.t * 18) | 0) % 2 === 0) return;
    const h = duck ? 14 : 26;
    const bob = horse ? Math.sin(G.t * 14) * 1.2 : Math.sin(run * 22) * (opts.grounded ? 1 : 0);
    ctx.save();
    ctx.translate(sx(x), sy(y + bob));
    ctx.scale(face * scale, squash * scale);
    if (horse) {
      ctx.translate(0, -10);
    }
    ctx.fillStyle = rgba(HAT, 1);
    ctx.fillRect(-8, -h - 4, 16, 3);
    ctx.fillRect(-5, -h - 9, 10, 6);
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.fillRect(-4, -h + 1, 8, 7);
    ctx.fillStyle = rgba(RED, 1);
    ctx.fillRect(-5, -h + 7, 10, 3);
    ctx.fillStyle = rgba(HAT, 1);
    ctx.fillRect(-6, -h + 10, 12, 10);
    ctx.fillStyle = rgba([40, 50, 90], 1);
    ctx.fillRect(-5, -h + 20, 4, duck ? 2 : 6 + Math.sin(run * 20) * 2);
    ctx.fillRect(1, -h + 20, 4, duck ? 2 : 6 - Math.sin(run * 20) * 2);
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.fillRect(5, -h + 12, 9, 2);
    ctx.fillRect(-12, -h + 12, 8, 2);
    if (flash > 0) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(12, -h + 10, 8, 5);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(16, -h + 9, 6, 7);
    }
    ctx.restore();
  }

  function drawBandit(e) {
    if (e.hitN > 0.4 && ((G.t * 30) | 0) % 2 === 0) return;
    const k = e.kind;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face * scale, scale);
    if (k === 'wanted') {
      ctx.fillStyle = rgba([210, 180, 120], 1);
      ctx.fillRect(-10, -24, 20, 24);
      ctx.fillStyle = rgba(BRN, 1);
      ctx.fillRect(-10, -24, 20, 4);
      ctx.fillStyle = rgba(HOT, 1);
      ctx.fillRect(-6, -18, 12, 3);
      ctx.fillRect(-4, -12, 8, 8);
      ctx.restore();
      return;
    }
    if (k === 'crate') {
      ctx.fillStyle = rgba(WOOD, 1);
      ctx.fillRect(-8, -16, 16, 16);
      ctx.strokeStyle = rgba(BRN, 1);
      ctx.lineWidth = 1;
      ctx.strokeRect(-8, -16, 16, 16);
      ctx.restore();
      return;
    }
    if (k === 'rider') {
      ctx.restore();
      drawHorse(e.x, e.y, e.face, e.t, true);
      ctx.save();
      ctx.translate(sx(e.x), sy(e.y - 12));
      ctx.scale(e.face * scale, scale);
    }
    ctx.fillStyle = rgba(k === 'dyn' ? [160, 48, 32] : k === 'thrower' ? [48, 96, 48] : [72, 40, 28], 1);
    ctx.fillRect(-6, -22, 12, 14);
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.fillRect(-4, -28, 8, 7);
    ctx.fillStyle = rgba(BRN, 1);
    ctx.fillRect(-7, -32, 14, 4);
    ctx.fillRect(-4, -36, 8, 5);
    ctx.fillStyle = rgba([36, 40, 70], 1);
    ctx.fillRect(-5, -8, 4, 8);
    ctx.fillRect(1, -8, 4, 8);
    if (k === 'dyn') {
      ctx.fillStyle = rgba(RED, 1);
      ctx.fillRect(6, -18, 5, 7);
    }
    ctx.restore();
  }

  function drawBoss(b) {
    if (!b || b.dead) return;
    if (!b.active && Math.abs(b.x - G.camX - VW) > 80) return;
    if (b.hitN > 0.35 && ((G.t * 28) | 0) % 2 === 0) return;
    ctx.save();
    ctx.translate(sx(b.x), sy(b.y));
    ctx.scale(b.face * scale, scale);
    if (b.kind === 'fat') {
      ctx.fillStyle = rgba([48, 28, 22], 1);
      ctx.fillRect(-16, -32, 32, 24);
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.fillRect(-8, -42, 16, 12);
      ctx.fillStyle = rgba(HAT, 1);
      ctx.fillRect(-12, -48, 24, 6);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.fillRect(-6, -22, 12, 8);
      ctx.fillStyle = rgba(BRN, 1);
      ctx.fillRect(-10, -8, 8, 8);
      ctx.fillRect(2, -8, 8, 8);
    } else if (b.kind === 'chief') {
      ctx.restore();
      drawHorse(b.x, b.y, b.face, b.t, true);
      ctx.save();
      ctx.translate(sx(b.x), sy(b.y - 14));
      ctx.scale(b.face * scale, scale);
      ctx.fillStyle = rgba([80, 24, 20], 1);
      ctx.fillRect(-8, -22, 16, 16);
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.fillRect(-5, -30, 10, 9);
      ctx.fillStyle = rgba([20, 16, 14], 1);
      ctx.fillRect(-9, -34, 18, 5);
    } else {
      ctx.fillStyle = rgba([240, 232, 220], 1);
      ctx.fillRect(-8, -32, 16, 22);
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.fillRect(-5, -42, 10, 11);
      ctx.fillStyle = rgba([20, 16, 18], 1);
      ctx.fillRect(-8, -48, 16, 6);
      ctx.fillStyle = rgba(RED, 1);
      ctx.fillRect(6, -30, 8, 16);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.fillRect(8, -18, 10, 2);
      ctx.fillStyle = rgba([30, 24, 28], 1);
      ctx.fillRect(-6, -10, 5, 10);
      ctx.fillRect(1, -10, 5, 10);
    }
    ctx.restore();
  }

  function drawShots() {
    let i, s, a;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      a = clamp(s.life / s.max, 0, 1);
      disc(s.x, s.y, s.r + 1.2, s.rgb, 0.28 * a);
      disc(s.x, s.y, s.r, s.rgb, 0.95);
      if (!REDUCE) fill(s.x - s.vx * 0.012, s.y - s.vy * 0.012, 6, 1.4, s.rgb, 0.35 * a);
    }
    for (i = 0; i < G.dyna.length; i++) {
      s = G.dyna[i];
      fill(s.x - 4, s.y - 6, 8, 10, RED);
      fill(s.x - 2, s.y - 10, 3, 5, GOLD);
      disc(s.x, s.y - 11, 2 + Math.sin(G.t * 24) * 1.2, HOT2, 0.9);
    }
  }

  function drawPickups() {
    let i, u;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      const bob = Math.sin(G.t * 6 + u.x) * 3;
      if (u.kind === 'whiskey') {
        fill(u.x - 4, u.y - 8 + bob, 8, 12, [160, 70, 30]);
        fill(u.x - 3, u.y - 10 + bob, 6, 3, GOLD);
      } else if (u.kind === 'gold') {
        disc(u.x, u.y + bob, 6, GOLD);
      } else {
        fill(u.x - 7, u.y - 6 + bob, 14, 10, u.kind === 'twin' ? CYN : HOT);
        fill(u.x - 5, u.y - 3 + bob, 10, 3, WHT, 0.7);
      }
    }
  }

  function drawFx() {
    let i, p, a;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = clamp(p.life / p.max, 0, 1);
      disc(p.x, p.y, p.r, p.rgb, 0.85 * a);
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      a = 1 - p.t / 0.22;
      disc(p.x, p.y, p.rad * (0.4 + p.t * 2), p.rgb, 0.35 * a);
    }
    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      a = 1 - p.t / 0.32;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), (p.r + p.t * 48) * scale, 0, TAU);
      ctx.strokeStyle = rgba(p.rgb, 0.45 * a);
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      a = 1 - p.t / p.life;
      ctx.font = '700 ' + (p.size * scale) + 'px "Segoe UI", sans-serif';
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fillText(p.text, sx(p.x), sy(p.y));
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#120804';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const punch = REDUCE ? 1 : G.punch;
    if (punch !== 1) {
      ctx.translate(ox + VW * scale * 0.5, oy + VH * scale * 0.5);
      ctx.scale(punch, punch);
      ctx.translate(-(ox + VW * scale * 0.5), -(oy + VH * scale * 0.5));
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawDecor();
    drawGround();

    let i;
    for (i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].dead) drawBandit(G.ents[i]);
    }
    drawBoss(G.boss);
    drawPickups();
    drawShots();

    const p = G.player;
    if (p) {
      if (G.onHorse) drawHorse(p.x, GY, p.face, G.t, true);
      if (G.deadT <= 0) {
        drawCowboy(p.x, p.y, p.face, {
          duck: p.duck,
          inv: G.invuln > 0 && G.mode !== 'title',
          horse: G.onHorse,
          squash: p.squash,
          muzzle: G.muzzle,
          run: p.run,
          grounded: p.grounded
        });
      } else {
        emit(2, {
          x: p.x, y: p.y - 10, j: 8,
          vx0: -60, vx1: 60, vy0: -90, vy1: -10,
          life: 0.25, r0: 1.5, r1: 3, rgb: MAG, g: 80
        });
      }
    }

    drawFx();

    if (G.hitFlash > 0) {
      ctx.fillStyle = rgba(MAG, G.hitFlash * 0.35);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
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

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();
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
      startGame('bounty');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('hail');
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

  if (btnBounty) {
    btnBounty.addEventListener('click', function () {
      audio.ensure();
      startGame('bounty');
    });
  }
  if (btnHail) {
    btnHail.addEventListener('click', function () {
      audio.ensure();
      startGame('hail');
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
      if (G.mode === 'win') startGame('hail');
      else goTitle();
    });
  }
  if (modeBounty) {
    modeBounty.addEventListener('click', function () {
      audio.ensure();
      startGame('bounty');
    });
  }
  if (modeHail) {
    modeHail.addEventListener('click', function () {
      audio.ensure();
      startGame('hail');
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
    }
  });

  requestAnimationFrame(frame);
})();
