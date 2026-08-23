'use strict';

/* 异兵 — Alien Soldier remake. Hover / dash / force. No CDN.
   Distinct from 魂斗 (ground jump 8-way), 金弹 (vehicles/POW), 枪星 (melee + gun cycle). */

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
  const WALK = 256;
  const HOVER_MAX = 272;
  const JUMP_V = 340;
  const DASH_SPD = 800;
  const DASH_T = 0.18;
  const DASH_CD = 0.56;
  const CHARGE_FIRE = 0.38;
  const CHARGE_FULL = 0.88;
  const CHARGE_COUNTER = 0.5;
  const PW = 13;
  const PH = 22;
  const INVULN = 1.35;
  const DIE_T = 0.82;
  const BEST_KEY = 'playbox-alien-soldier-best';
  const MUTE_KEY = 'playbox-alien-soldier-mute';
  const OPS = '方向 / WASD 走与悬浮 · 空格/Z 射击（按住蓄力）· Shift 冲刺 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [45, 255, 120];
  const HOT2 = [125, 255, 176];
  const WHT = [232, 255, 240];
  const LEAF = [61, 255, 122];
  const PUR = [160, 80, 255];
  const TEAL = [32, 196, 168];
  const RUST = [180, 92, 48];

  const WEP_NAME = { phoenix: '凰弹', flame: '炎波', homing: '追踪' };
  const WEAPONS = {
    phoenix: { cd: 0.07, max: 8, spd: 640, dmg: 1, pierce: 0, n: 1, fan: 0, life: 0.5, rgb: HOT, home: 0 },
    flame: { cd: 0.15, max: 6, spd: 360, dmg: 2, pierce: 1, n: 1, fan: 0, life: 0.72, rgb: GOLD, home: 0, fat: 1 },
    homing: { cd: 0.12, max: 5, spd: 400, dmg: 1, pierce: 0, n: 1, fan: 0, life: 0.95, rgb: CYN, home: 1 }
  };

  const KINDS = {
    wing: { hp: 2, score: 120, w: 18, h: 14, name: '巡翼' },
    crawl: { hp: 2, score: 100, w: 16, h: 14, name: '爬刺' },
    pod: { hp: 3, score: 180, w: 16, h: 16, name: '弹巢' },
    ram: { hp: 3, score: 160, w: 18, h: 16, name: '冲颚' },
    turret: { hp: 4, score: 220, w: 16, h: 18, name: '炮节' },
    guard: { hp: 5, score: 280, w: 18, h: 24, name: '卫核' }
  };

  const SCORE = {
    hit: 30, dash: 60, counter: 400, boss: 4200, stage: 2000, clear: 8000
  };

  const STAGES = [
    {
      name: '锈廊', boss: '颚门', w: 2380, theme: 'rust', bossHp: 48,
      ground: [[0, 600], [820, 400], [1360, 420], [1900, 480]],
      plats: [
        [180, MY, 150], [460, MY, 160], [680, MY, 190],
        [1080, MY, 160], [1480, MY, 170], [1960, MY, 150],
        [300, HY, 120], [760, HY, 140], [1260, HY, 150], [1780, HY, 130]
      ],
      ents: [
        [280, GY, 'crawl', 40, 560],
        [420, 140, 'wing', 0, 0],
        [520, MY, 'turret', 0, 0],
        [740, MY, 'pod', 0, 0],
        [960, GY, 'ram', 840, 1180],
        [1100, 120, 'wing', 0, 0],
        [1220, MY, 'crawl', 1080, 1240],
        [1380, GY, 'guard', 1320, 1580],
        [1520, HY, 'pod', 0, 0],
        [1660, GY, 'crawl', 1400, 1760],
        [1780, 150, 'wing', 0, 0],
        [1920, MY, 'turret', 0, 0],
        [2040, GY, 'ram', 1920, 2200],
        [2140, HY, 'wing', 0, 0]
      ],
      drops: [[880, MY, 'flame'], [1700, HY, 'homing']]
    },
    {
      name: '脉巢', boss: '核蛛', w: 2580, theme: 'vein', bossHp: 62,
      ground: [[0, 480], [620, 280], [1040, 360], [1540, 300], [1980, 600]],
      plats: [
        [140, MY, 140], [400, MY, 150], [720, MY, 180],
        [1140, MY, 160], [1560, MY, 180], [1960, MY, 160], [2280, MY, 150],
        [260, HY, 120], [840, HY, 150], [1320, HY, 150], [1780, HY, 140], [2200, HY, 150]
      ],
      ents: [
        [240, GY, 'crawl', 20, 440],
        [360, 120, 'wing', 0, 0],
        [440, MY, 'pod', 0, 0],
        [620, HY, 'turret', 0, 0],
        [780, GY, 'ram', 660, 980],
        [980, 140, 'wing', 0, 0],
        [1120, MY, 'guard', 1100, 1300],
        [1280, HY, 'pod', 0, 0],
        [1440, GY, 'crawl', 1080, 1480],
        [1580, 110, 'wing', 0, 0],
        [1720, MY, 'turret', 0, 0],
        [1860, GY, 'ram', 1600, 2100],
        [2000, HY, 'pod', 0, 0],
        [2140, MY, 'crawl', 1960, 2120],
        [2280, GY, 'guard', 2040, 2400],
        [2380, 130, 'wing', 0, 0]
      ],
      drops: [[900, HY, 'homing'], [1860, MY, 'flame']]
    },
    {
      name: '翼核', boss: '异皇', w: 2760, theme: 'core', bossHp: 84,
      ground: [[0, 420], [540, 320], [1000, 360], [1480, 280], [1920, 340], [2360, 400]],
      plats: [
        [80, MY, 130], [340, MY, 150], [680, MY, 160],
        [1040, MY, 150], [1400, MY, 180], [1780, MY, 160],
        [2140, MY, 170], [2480, MY, 160],
        [220, HY, 120], [760, HY, 140], [1240, HY, 150],
        [1680, HY, 140], [2160, HY, 160], [2520, HY, 140]
      ],
      ents: [
        [220, GY, 'ram', 40, 400],
        [320, 110, 'wing', 0, 0],
        [380, HY, 'pod', 0, 0],
        [560, MY, 'turret', 0, 0],
        [720, GY, 'guard', 560, 900],
        [880, 130, 'wing', 0, 0],
        [1020, MY, 'pod', 0, 0],
        [1180, HY, 'turret', 0, 0],
        [1340, GY, 'ram', 1080, 1500],
        [1480, 120, 'wing', 0, 0],
        [1620, MY, 'guard', 1400, 1760],
        [1760, HY, 'pod', 0, 0],
        [1920, GY, 'crawl', 1540, 1880],
        [2060, 140, 'wing', 0, 0],
        [2200, MY, 'turret', 0, 0],
        [2340, GY, 'ram', 1980, 2500],
        [2460, HY, 'pod', 0, 0],
        [2560, 110, 'wing', 0, 0]
      ],
      drops: [[760, HY, 'flame'], [1500, MY, 'homing'], [2280, HY, 'flame']]
    }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const stageEl = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const scoreEl = document.getElementById('score');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const bestEl = document.getElementById('best');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const gunLabel = document.getElementById('gun-label');
  const pipsEl = document.getElementById('pips');
  const forceBar = document.getElementById('force-bar');
  const bossWrap = document.getElementById('boss-wrap');
  const bossBar = document.getElementById('boss-bar');
  const bossNameEl = document.getElementById('boss-name');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnSoldier = document.getElementById('btn-soldier');
  const btnCore = document.getElementById('btn-core');
  const modeSoldier = document.getElementById('mode-soldier');
  const modeCore = document.getElementById('mode-core');

  let W = 640;
  let H = 360;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let uid = 1;
  let hidden = false;
  let kickTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  let addTok = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false, dash: false };
  const demo = { l: false, r: true, u: false, d: false, fire: true, dash: false, t: 0 };
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const ghosts = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'soldier',
    stage: 1,
    levelW: 2380,
    score: 0,
    best: 0,
    lives: LIVES,
    combo: 0,
    comboT: 0,
    mult: 1,
    maxCombo: 0,
    nextLife: LIFE_EVERY,
    weapon: 'phoenix',
    charge: 0,
    t: 0,
    camX: 0,
    camY: 0,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: HOT,
    fireCd: 0,
    dashT: 0,
    dashCd: 0,
    dashTok: 0,
    deadT: 0,
    invuln: 0,
    muzzle: 0,
    lock: 0,
    clearT: 0,
    deathWhy: 'crash',
    player: null,
    plats: [],
    ents: [],
    shots: [],
    drops: [],
    boss: null,
    checkX: 70,
    checkY: GY
  };

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function hash2(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function isCore() {
    return G.kind === 'core';
  }
  function playing() {
    return G.mode === 'play';
  }
  function dens() {
    return isCore() ? 1.3 : 1;
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function inL() {
    if (G.mode === 'title') return demo.l;
    if (!playing()) return false;
    return keys.l;
  }
  function inR() {
    if (G.mode === 'title') return demo.r;
    if (!playing()) return false;
    return keys.r;
  }
  function inU() {
    if (G.mode === 'title') return demo.u;
    if (!playing()) return false;
    return keys.u;
  }
  function inD() {
    if (G.mode === 'title') return demo.d;
    if (!playing()) return false;
    return keys.d;
  }
  function fireHeld() {
    if (G.mode === 'title') return demo.fire;
    if (!playing()) return false;
    return keys.fire;
  }
  function dashHeld() {
    if (G.mode === 'title') return demo.dash;
    if (!playing()) return false;
    return keys.dash;
  }

  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }
  function onScreen(x, y, pad) {
    const p = pad || 40;
    return x > G.camX - p && x < G.camX + VW + p && y > -p && y < VH + p;
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
    shot(kind) {
      this.ensure();
      if (kind === 'flame') {
        this.noise(0.07, 0.05, 280);
        this.beep(240, 0.1, 'sawtooth', 0.042, 90);
      } else if (kind === 'homing') {
        this.beep(720, 0.07, 'sine', 0.04, 1280);
        this.beep(420, 0.05, 'triangle', 0.028, 880);
      } else {
        this.beep(980, 0.045, 'square', 0.042, 420);
        this.noise(0.02, 0.018, 1800);
      }
    },
    force() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.06, 70);
      this.beep(520, 0.12, 'square', 0.045, 180);
      this.noise(0.12, 0.06, 200);
    },
    dash() {
      this.ensure();
      this.beep(220, 0.08, 'sawtooth', 0.045, 880);
      this.noise(0.06, 0.04, 700);
    },
    hover() {
      this.ensure();
      this.beep(160, 0.04, 'sine', 0.018, 280);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.035, 0.034, 1100);
      this.beep(540 * lift, 0.065, 'square', 0.042, 920 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 55);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    counter() {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.05, 220);
      this.beep(1320, 0.14, 'triangle', 0.045, 440);
      this.noise(0.08, 0.05, 500);
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
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
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
      if (bestEl) bestEl.textContent = String(G.best);
    }
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
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
    }, 1400);
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = LIFE_CAP;
    while (pipsEl.children.length < n) {
      const s = document.createElement('span');
      s.className = 'pip';
      pipsEl.appendChild(s);
    }
    const pips = pipsEl.children;
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }

  function syncModes() {
    const c = isCore();
    if (modeSoldier) modeSoldier.setAttribute('aria-pressed', c ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', c ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isCore() ? '兵核 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '兵核' : '异兵';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = WEP_NAME[G.weapon] || '凰弹';
      gunLabel.className = 'gun ' + (G.weapon || 'phoenix');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (forceBar) {
      const r = clamp(G.charge / CHARGE_FULL, 0, 1);
      forceBar.style.transform = 'scaleX(' + r + ')';
      forceBar.classList.toggle('full', r >= 0.98);
    }
    const bossOn = !!(playing() && G.boss && G.boss.active && !G.boss.dead);
    if (bossWrap) bossWrap.hidden = !bossOn;
    if (bossOn) {
      if (bossNameEl) bossNameEl.textContent = G.boss.name;
      if (bossBar) bossBar.style.transform = 'scaleX(' + clamp(G.boss.hp / G.boss.max, 0, 1) + ')';
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞上即死', 'warn');
    else if (G.mode === 'win') setHint('翼核捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('残命 · 冲刺穿弹 · 蓄满反击', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('关底 · 悬浮躲开 · 力场砸核', 'hot');
    else setHint('悬浮 · 空格射击蓄力 · Shift 冲刺', '');
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
      ovKicker.textContent = kind === 'lose' ? 'CRASH' : kind === 'win' ? 'CLEAR' : 'ALNS';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '兵核' : '换模式';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (panel) panel.classList.remove('win', 'lose');
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
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) audio.combo(G.mult);
    syncHud();
  }

  function popScore(n) {
    if (!scoreAdd) return;
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function addScore(n, x, y, label) {
    const v = Math.round(n * G.mult);
    G.score += v;
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        audio.oneup();
        toast('1UP', false, true);
      }
    }
    saveBest();
    popScore(v);
    if (x != null) floatText(x, y - 18, label || String(v), GOLD, v >= 400);
    syncHud();
    return v;
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH,
      grounded: true, hover: false,
      squash: 1, run: 0, pose: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeEnt(x, y, kind, a, b) {
    const k = KINDS[kind] || KINDS.crawl;
    const extra = isCore() && playing() ? 1 : 0;
    const hp = k.hp + extra;
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 1), fire: rand(0.2, 0.9),
      grounded: kind === 'crawl' || kind === 'ram' || kind === 'guard' || kind === 'turret',
      dead: false, hitN: 0, dashTok: 0,
      homeX: x, homeY: y,
      w: k.w, h: k.h
    };
  }

  function makeBoss(spec) {
    const hp = Math.round(spec.bossHp * (isCore() && playing() ? 1.24 : 1));
    return {
      name: spec.boss,
      kind: spec.boss,
      x: spec.w - 110,
      y: GY,
      hp: hp,
      max: hp,
      t: 0,
      fire: 0.8,
      active: false,
      dead: false,
      hitN: 0,
      phase: 1,
      vx: 0,
      vy: 0,
      open: 0,
      hop: 0
    };
  }

  function seedMist(spec) {
    mist.length = 0;
    const n = REDUCE ? 10 : 24;
    const pal = spec.theme === 'vein' ? [MAG, PUR, CYN] : spec.theme === 'core' ? [GOLD, CYN, HOT] : [TEAL, RUST, HOT];
    for (let i = 0; i < n; i++) {
      mist.push({
        x: rand(0, spec.w),
        y: rand(30, 240),
        r: rand(1, 2.6),
        a: rand(0.08, 0.3),
        s: rand(8, 24),
        rgb: pal[i % pal.length]
      });
    }
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.plats = [];
    let i;
    for (i = 0; i < spec.ground.length; i++) {
      const g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      const p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2], false));
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isCore() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'turret') continue;
        G.ents.push(makeEnt(e[0] + 48, e[1] === GY ? e[1] : e[1] - 16, e[2], e[3], e[4]));
      }
    }
    G.drops = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.drops.push({ x: d[0], y: d[1] - 16, kind: d[2], taken: false, t: 0 });
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.dashT = 0;
    G.dashCd = 0;
    G.dashTok = 0;
    G.charge = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.4;
    G.clearT = 0;
    G.lock = 0;
    G.muzzle = 0;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
      ghosts.length = 0;
    }
    seedMist(spec);
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

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.4, y: p.y - p.h, w: p.w * 0.8, h: p.h * 0.9 };
  }

  function aimVec() {
    const p = G.player;
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (inU()) dy -= 1;
    if (inD()) dy += 1;
    if (p.grounded && inU() && fireHeld() && !inL() && !inR()) {
      dx = 0;
      dy = -1;
    }
    if (!dx && !dy) dx = p.face;
    const len = hypot(dx, dy) || 1;
    return { dx: dx / len, dy: dy / len };
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
    if (G.shots.length > 110) {
      for (let i = 0; i < G.shots.length && G.shots.length > 90; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 110);
  }

  function tryShoot() {
    if (G.deadT > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    if (G.charge >= 0.26) return;
    const wpn = WEAPONS[G.weapon] || WEAPONS.phoenix;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = aimVec();
    const ox0 = p.x + aim.dx * 16;
    const oy0 = p.y - 14 + aim.dy * 6;
    const n = wpn.n || 1;
    const fan = wpn.fan || 0;
    const base = Math.atan2(aim.dy, aim.dx);
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? base : base + (i - (n - 1) / 2) * fan;
      spawnShot({
        x: ox0, y: oy0,
        vx: Math.cos(a) * wpn.spd,
        vy: Math.sin(a) * wpn.spd,
        from: 'p',
        kind: G.weapon,
        dmg: wpn.dmg,
        pierce: wpn.pierce,
        life: wpn.life,
        rgb: wpn.rgb,
        home: wpn.home || 0,
        fat: wpn.fat || 0,
        hit: []
      });
    }
    G.fireCd = wpn.cd;
    G.muzzle = 0.05;
    p.pose = 0.08;
    if (playing()) audio.shot(G.weapon);
    emit(4, {
      x: ox0, y: oy0, j: 3,
      vx0: aim.dx * 40, vx1: aim.dx * 160,
      vy0: aim.dy * 60 - 30, vy1: aim.dy * 60 + 30,
      life: 0.14, r0: 1, r1: 2, rgb: wpn.rgb, g: 40
    });
  }

  function tryForce() {
    if (G.deadT > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    const ch = G.charge;
    if (ch < CHARGE_FIRE) return;
    const p = G.player;
    const aim = aimVec();
    const full = ch >= CHARGE_FULL;
    const dmg = 4 + Math.floor(ch * 5);
    const ox0 = p.x + aim.dx * 18;
    const oy0 = p.y - 14;
    spawnShot({
      x: ox0, y: oy0,
      vx: aim.dx * 540,
      vy: aim.dy * 540,
      from: 'p',
      kind: 'force',
      dmg: dmg,
      pierce: 10,
      life: 0.55,
      rgb: full ? GOLD : CYN,
      fat: full ? 2 : 1.4,
      force: 1,
      hit: []
    });
    G.charge = 0;
    G.fireCd = 0.18;
    G.muzzle = 0.12;
    if (playing()) audio.force();
    juice(ox0, oy0, full ? GOLD : CYN, full ? 1.6 : 1.1);
    hitStop(full ? 0.07 : 0.045);
    floatText(p.x, p.y - 36, full ? '力场' : '蓄力', full ? GOLD : CYN, full);
  }

  function tryDash() {
    if (G.deadT > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.dashT > 0 || G.dashCd > 0) return;
    const p = G.player;
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (inU()) dy -= 1;
    if (inD()) dy += 1;
    if (!dx && !dy) dx = p.face;
    const len = hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    p.vx = dx * DASH_SPD;
    p.vy = dy * DASH_SPD;
    p.face = dx >= 0 ? 1 : -1;
    p.grounded = false;
    p.hover = true;
    G.dashT = DASH_T;
    G.dashCd = DASH_CD;
    G.dashTok = (G.dashTok || 0) + 1;
    G.invuln = Math.max(G.invuln, DASH_T);
    if (playing()) audio.dash();
    emit(10, {
      x: p.x, y: p.y - 12, j: 8,
      vx0: -dx * 80, vx1: -dx * 220, vy0: -dy * 80 - 40, vy1: -dy * 80 + 40,
      life: 0.22, r0: 1.2, r1: 3, rgb: CYN, g: 20
    });
    kick(1.8, 'thump');
  }

  function nearestEnemy(x, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      const d = hypot(e.x - x, e.y - e.h * 0.5 - y);
      if (d < bd) { bd = d; best = e; }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      const d = hypot(G.boss.x - x, G.boss.y - 40 - y);
      if (d < bd) best = G.boss;
    }
    return best;
  }

  function hurtEnt(e, dmg, sx0, sy0, rgb) {
    if (!e || e.dead) return false;
    e.hp -= dmg;
    e.hitN = 0.08;
    if (playing()) audio.hit(G.combo);
    bumpCombo();
    emit(5, {
      x: sx0, y: sy0, j: 5,
      vx0: -80, vx1: 80, vy0: -140, vy1: -10,
      life: 0.2, r0: 1, r1: 2.2, rgb: rgb || HOT, g: 80
    });
    hitStop(0.032);
    kick(1.6, 'hit');
    if (e.hp <= 0) {
      killEnt(e);
      return true;
    }
    return false;
  }

  function killEnt(e) {
    e.dead = true;
    e.hp = 0;
    const k = KINDS[e.kind] || KINDS.crawl;
    if (playing()) {
      addScore(k.score, e.x, e.y, String(k.score * G.mult));
      audio.boom();
    }
    juice(e.x, e.y - e.h * 0.5, MAG, 1.1);
    hitStop(0.055);
    kick(3.2, 'boom');
    if (e.kind === 'guard' && playing()) {
      const kinds = ['flame', 'homing'];
      G.drops.push({
        x: e.x, y: e.y - 18,
        kind: kinds[(Math.random() * kinds.length) | 0],
        taken: false, t: 0
      });
    }
  }

  function hurtBoss(dmg, x, y) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    if (b.kind === '颚门' && b.open < 0.35 && dmg < 4) {
      audio.hit(0);
      floatText(x, y, '甲', TEAL, false);
      return;
    }
    b.hp -= dmg;
    b.hitN = 0.1;
    bumpCombo();
    if (playing()) audio.hit(G.combo);
    juice(x, y, GOLD, 0.9);
    hitStop(0.04);
    kick(2.2, 'hit');
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = true;
      if (playing()) {
        addScore(SCORE.boss, b.x, b.y - 40, '击破');
        audio.boom();
        audio.stage();
      }
      juice(b.x, b.y - 36, GOLD, 2.4);
      hitStop(0.08);
      kick(7, 'boom');
      screenFlash(GOLD, 0.55);
      toast(b.name + ' 击破', false, true);
      G.clearT = 1.35;
    }
    syncHud();
  }

  function doCounter(srcX, srcY) {
    const p = G.player;
    G.charge = 0;
    G.invuln = Math.max(G.invuln, 0.48);
    G.dashT = Math.max(G.dashT, 0.08);
    if (playing()) {
      audio.counter();
      addScore(SCORE.counter, p.x, p.y, '反击');
    }
    toast('反击', false, true);
    juice(p.x, p.y - 12, GOLD, 1.8);
    hitStop(0.07);
    kick(5, 'boom');
    screenFlash(CYN, 0.45);
    floatText(p.x, p.y - 40, '反击', GOLD, true);
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from !== 'e') continue;
      if (hypot(s.x - p.x, s.y - (p.y - 12)) > 90) continue;
      s.from = 'p';
      s.kind = 'force';
      s.vx = -s.vx * 1.2;
      s.vy = -s.vy * 1.2;
      s.dmg = 3;
      s.pierce = 2;
      s.rgb = GOLD;
      s.life = 0.4;
      s.hit = [];
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - p.x, e.y - p.y) < 70) hurtEnt(e, 3, e.x, e.y - 8, GOLD);
    }
    if (G.boss && G.boss.active && !G.boss.dead && hypot(G.boss.x - p.x, G.boss.y - p.y) < 110) {
      hurtBoss(6, srcX, srcY);
    }
  }

  function crash(why) {
    if (G.deadT > 0 || G.mode === 'title') return;
    if (G.invuln > 0 || G.dashT > 0) return;
    if (G.charge >= CHARGE_COUNTER) {
      doCounter(G.player.x, G.player.y);
      return;
    }
    G.deathWhy = why || 'crash';
    G.deadT = DIE_T;
    G.charge = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'phoenix';
    audio.death();
    juice(G.player.x, G.player.y - 12, MAG, 1.8);
    kick(7, 'die');
    hitStop(0.07);
    screenFlash(MAG, 0.4);
    G.lives -= 1;
    syncHud();
    if (G.lives <= 0) {
      G.deadT = DIE_T;
    }
  }

  function respawn() {
    if (G.lives <= 0) {
      loseGame();
      return;
    }
    const p = G.player;
    p.x = G.checkX;
    p.y = G.checkY;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    p.hover = false;
    G.deadT = 0;
    G.invuln = INVULN;
    G.charge = 0;
    G.dashT = 0;
    G.dashCd = 0.2;
    G.weapon = 'phoenix';
    toast('重组', true, false);
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    const why = G.deathWhy === 'fall' ? '坠入航隙了' : G.deathWhy === 'shot' ? '中弹了' : '撞上了';
    showOverlay('lose', '被击中了', why + '<br />连击最高 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(SCORE.clear, G.player.x, G.player.y, '通关');
    saveBest();
    audio.win();
    kick(4, 'win-flash');
    const msg = isCore() ? '兵核清场' : '翼核捣毁了';
    toast(msg, false, true);
    showOverlay('win', '捣毁了', msg + '<br />' + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      winGame();
      return;
    }
    addScore(SCORE.stage * G.stage, G.player.x, G.player.y, '过关');
    toast(STAGES[G.stage].name, false, true);
    audio.stage();
    G.stage += 1;
    const keepScore = G.score;
    const keepLives = G.lives;
    const keepWep = G.weapon;
    const keepCombo = G.combo;
    const keepMult = G.mult;
    const keepMax = G.maxCombo;
    loadStage(G.stage, false);
    G.score = keepScore;
    G.lives = keepLives;
    G.weapon = keepWep;
    G.combo = keepCombo;
    G.mult = keepMult;
    G.maxCombo = keepMax;
    G.invuln = 0.8;
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'soldier';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.maxCombo = 0;
    G.nextLife = LIFE_EVERY;
    G.weapon = 'phoenix';
    G.t = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isCore() ? '兵核' : '异兵', false, isCore());
    syncHud();
    if (canvas) canvas.focus();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'soldier';
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.mult = 1;
    G.weapon = 'phoenix';
    G.t = 0;
    demo.t = 0;
    loadStage(1, true);
    showOverlay('title', '异兵', '八向悬浮，冲刺穿弹，蓄力放力场。<br />撞上即死。打完航线再拆关底。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('soldier');
    else startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('soldier');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function enemyFire(e, ang, spd, life) {
    spawnShot({
      x: e.x, y: e.y - e.h * 0.45,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      from: 'e',
      kind: 'e',
      dmg: 1,
      pierce: 0,
      life: life || 1.6,
      rgb: MAG,
      hit: []
    });
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    e.t += dt;
    if (e.hitN > 0) e.hitN -= dt;
    const sp = dens();
    const p = G.player;
    if (e.kind === 'wing') {
      e.x = e.homeX + Math.sin(e.t * 1.4) * 22;
      e.y = clamp(e.homeY + Math.cos(e.t * 2.1) * 16, 70, 250);
      e.fire -= dt * sp;
      if (e.fire <= 0 && onScreen(e.x, e.y, 20) && playing()) {
        e.fire = 1.15 / sp;
        const a = Math.atan2((p.y - 12) - e.y, p.x - e.x);
        enemyFire(e, a, 210, 1.8);
      }
    } else if (e.kind === 'pod') {
      e.y += Math.sin(e.t * 2.4) * 40 * dt;
      e.fire -= dt * sp;
      if (e.fire <= 0 && onScreen(e.x, e.y, 20) && playing()) {
        e.fire = 1.5 / sp;
        for (let k = -1; k <= 1; k++) enemyFire(e, Math.PI + k * 0.28, 190, 1.5);
      }
    } else if (e.kind === 'turret') {
      e.fire -= dt * sp;
      if (e.fire <= 0 && onScreen(e.x, e.y, 20) && playing()) {
        e.fire = 1.05 / sp;
        const a = Math.atan2((p.y - 12) - (e.y - 10), p.x - e.x);
        enemyFire(e, a, 240, 1.7);
      }
    } else if (e.kind === 'crawl') {
      if (!e.face) e.face = -1;
      e.x += e.face * 46 * dt * sp;
      if (e.x < e.a + 4) e.face = 1;
      if (e.x > e.b - 4) e.face = -1;
      const plat = platUnder(e.x, e.y, null);
      if (plat) e.y = plat.y;
      e.fire -= dt * sp;
      if (e.fire <= 0 && onScreen(e.x, e.y, 10) && playing()) {
        e.fire = 1.4 / sp;
        enemyFire(e, e.face > 0 ? 0 : Math.PI, 200, 1.4);
      }
    } else if (e.kind === 'ram') {
      const plat = platUnder(e.x, e.y, null);
      if (plat) e.y = plat.y;
      if (Math.abs(p.x - e.x) < 220 && Math.abs(p.y - e.y) < 40 && playing()) {
        e.face = p.x > e.x ? 1 : -1;
        e.x += e.face * 160 * dt * sp;
      } else {
        e.x += (e.face || -1) * 50 * dt * sp;
        if (e.x < e.a) e.face = 1;
        if (e.x > e.b) e.face = -1;
      }
    } else if (e.kind === 'guard') {
      const plat = platUnder(e.x, e.y, null);
      if (plat) e.y = plat.y;
      e.x += Math.sin(e.t * 1.1) * 28 * dt * 8;
      e.fire -= dt * sp;
      if (e.fire <= 0 && onScreen(e.x, e.y, 20) && playing()) {
        e.fire = 0.85 / sp;
        const a = Math.atan2((p.y - 12) - (e.y - 16), p.x - e.x);
        enemyFire(e, a, 230, 1.6);
        enemyFire(e, a + 0.22, 210, 1.5);
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active) {
      if (G.player.x > G.levelW - VW - 20 || G.camX >= G.levelW - VW - 4) {
        b.active = true;
        G.lock = 1;
        G.camX = G.levelW - VW;
        if (playing()) {
          audio.boss();
          toast(b.name, false, true);
        }
      }
      return;
    }
    b.t += dt;
    if (b.hitN > 0) b.hitN -= dt;
    b.fire -= dt * dens();
    const p = G.player;
    const sp = dens();

    if (b.kind === '颚门') {
      b.x = G.levelW - 108;
      b.y = GY;
      b.open = 0.5 + 0.5 * Math.sin(b.t * 1.35);
      b.hop = Math.sin(b.t * 2) * 2;
      if (b.fire <= 0) {
        b.fire = (b.open > 0.55 ? 0.55 : 1.1) / sp;
        if (b.open > 0.4) {
          const a0 = Math.atan2((p.y - 12) - (b.y - 48), p.x - b.x);
          for (let k = -1; k <= 1; k++) {
            spawnShot({
              x: b.x - 18, y: b.y - 52,
              vx: Math.cos(a0 + k * 0.22) * 220,
              vy: Math.sin(a0 + k * 0.22) * 220,
              from: 'e', kind: 'e', dmg: 1, life: 2, rgb: MAG, hit: []
            });
          }
        } else if ((b.t * 3 | 0) % 5 === 0) {
          spawnShot({
            x: b.x - 30, y: b.y - 8,
            vx: -260, vy: -40,
            from: 'e', kind: 'e', dmg: 1, life: 1.6, rgb: GOLD, hit: []
          });
        }
      }
    } else if (b.kind === '核蛛') {
      const left = G.levelW - VW + 80;
      const right = G.levelW - 80;
      if (!b.dir) b.dir = -1;
      b.x += b.dir * 70 * dt * sp;
      if (b.x < left) b.dir = 1;
      if (b.x > right) b.dir = -1;
      const ceil = Math.sin(b.t * 0.55) > 0.15;
      b.y += ((ceil ? 96 : GY) - b.y) * Math.min(1, 2.2 * dt);
      b.hop = Math.sin(b.t * 6) * 3;
      if (b.fire <= 0) {
        b.fire = 0.72 / sp;
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * TAU + b.t;
          spawnShot({
            x: b.x + Math.cos(a) * 28,
            y: b.y - 28 + Math.sin(a) * 16,
            vx: Math.cos(a) * 180,
            vy: Math.sin(a) * 180,
            from: 'e', kind: 'e', dmg: 1, life: 1.8, rgb: PUR, hit: []
          });
        }
      }
      if (b.t > 2 && (b.t * 10 | 0) % 38 === 0) {
        let live = 0;
        for (let i = 0; i < G.ents.length; i++) if (!G.ents[i].dead && G.ents[i].kind === 'crawl') live += 1;
        if (live < 3) G.ents.push(makeEnt(b.x, GY, 'crawl', left, right));
      }
    } else if (b.kind === '异皇') {
      const frac = b.hp / b.max;
      b.phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
      const cx = G.levelW - VW * 0.45;
      b.x = cx + Math.sin(b.t * 0.7) * 110;
      b.y = 150 + Math.sin(b.t * 1.1) * 46;
      b.hop = Math.sin(b.t * 8) * 2;
      if (b.phase === 2 && Math.sin(b.t * 0.9) > 0.92) {
        b.x += (p.x > b.x ? 1 : -1) * 280 * dt;
      }
      if (b.fire <= 0) {
        if (b.phase === 1) {
          b.fire = 0.62 / sp;
          for (let k = -2; k <= 2; k++) {
            spawnShot({
              x: b.x, y: b.y - 10,
              vx: Math.cos(Math.PI + k * 0.2) * 230,
              vy: Math.sin(Math.PI + k * 0.2) * 230,
              from: 'e', kind: 'e', dmg: 1, life: 1.7, rgb: MAG, hit: []
            });
          }
        } else if (b.phase === 2) {
          b.fire = 0.48 / sp;
          const a = Math.atan2((p.y - 12) - b.y, p.x - b.x);
          spawnShot({
            x: b.x, y: b.y,
            vx: Math.cos(a) * 280, vy: Math.sin(a) * 280,
            from: 'e', kind: 'e', dmg: 1, life: 1.5, rgb: CYN, hit: []
          });
        } else {
          b.fire = 0.38 / sp;
          const a = Math.atan2((p.y - 12) - b.y, p.x - b.x);
          spawnShot({
            x: b.x, y: b.y,
            vx: Math.cos(a) * 160, vy: Math.sin(a) * 160,
            from: 'e', kind: 'orb', dmg: 1, life: 2.2, rgb: GOLD, home: 1, hit: []
          });
          for (let k = -1; k <= 1; k++) {
            spawnShot({
              x: b.x, y: b.y - 8,
              vx: Math.cos(a + k * 0.4) * 240,
              vy: Math.sin(a + k * 0.4) * 240,
              from: 'e', kind: 'e', dmg: 1, life: 1.4, rgb: MAG, hit: []
            });
          }
        }
      }
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (!p) return;
    if (p.pose > 0) p.pose -= dt;
    if (p.squash < 1) p.squash = Math.min(1, p.squash + dt * 4);
    p.run += Math.abs(p.vx) * dt * 0.08;

    if (G.deadT > 0) return;

    const prevY = p.y;
    if (G.dashT > 0) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.hover = true;
      p.grounded = false;
      if ((G.t * 60 | 0) % 2 === 0) {
        ghosts.push({ x: p.x, y: p.y, t: 0, face: p.face });
        capArr(ghosts, 16);
      }
    } else {
      let tx = 0;
      let ty = 0;
      if (inL()) tx -= 1;
      if (inR()) tx += 1;
      if (inU()) ty -= 1;
      if (inD()) ty += 1;
      if (tx) p.face = tx;

      if (p.grounded) {
        p.vx = tx * WALK;
        p.hover = false;
        const wantUp = ty < 0;
        if (wantUp) {
          p.vy = -JUMP_V;
          p.grounded = false;
          p.hover = true;
          p.squash = 0.82;
        } else {
          p.vy = 0;
        }
      } else {
        p.hover = true;
        const targetX = tx * HOVER_MAX;
        const targetY = ty * HOVER_MAX + (ty === 0 ? 70 : 0);
        const k = Math.min(1, 12 * dt);
        p.vx += (targetX - p.vx) * k;
        p.vy += (targetY - p.vy) * k;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    if (!p.grounded && p.vy >= -10) {
      const land = landOn(p.x, prevY, p.y, null);
      if (land && !inD()) {
        p.y = land.y;
        p.vy = 0;
        p.vx *= 0.55;
        p.grounded = true;
        p.hover = false;
        p.squash = 0.88;
        G.checkX = p.x;
        G.checkY = land.y;
      }
    }
    if (p.grounded) {
      const plat = platUnder(p.x, p.y, null);
      if (!plat) {
        p.grounded = false;
        p.hover = true;
      } else if (inD() && !plat.base) {
        p.grounded = false;
        p.hover = true;
        p.y += 6;
      } else {
        p.y = plat.y;
      }
    }

    p.x = clamp(p.x, 18, G.levelW - 18);
    if (p.y < 28) {
      p.y = 28;
      if (p.vy < 0) p.vy = 0;
    }
    if (p.y > VH + 18) crash('fall');
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      if (s.home && s.from === 'p') {
        const tgt = nearestEnemy(s.x, s.y);
        if (tgt) {
          const ty = tgt.y - (tgt.h ? tgt.h * 0.5 : 28);
          const a = Math.atan2(ty - s.y, tgt.x - s.x);
          s.vx = lerp(s.vx, Math.cos(a) * 420, 0.08);
          s.vy = lerp(s.vy, Math.sin(a) * 420, 0.08);
        }
      }
      if (s.home && s.from === 'e') {
        const p = G.player;
        if (p && G.deadT <= 0) {
          const a = Math.atan2((p.y - 12) - s.y, p.x - s.x);
          s.vx = lerp(s.vx, Math.cos(a) * 170, 0.025);
          s.vy = lerp(s.vy, Math.sin(a) * 170, 0.025);
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y < -20 || s.y > VH + 30 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }

      if (s.from === 'p') {
        const rad = 5 + (s.fat ? s.fat * 5 : 0);
        for (let j = 0; j < G.ents.length; j++) {
          const e = G.ents[j];
          if (e.dead) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          if (overlap(s.x - rad, s.y - rad, rad * 2, rad * 2, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
            s.hit.push(e.id);
            const dead = hurtEnt(e, s.dmg, s.x, s.y, s.rgb);
            if (!s.pierce || dead && s.pierce <= 0) {
              s.pierce -= 1;
              if (s.pierce < 0 && !s.force) {
                G.shots.splice(i, 1);
                break;
              }
            } else {
              s.pierce -= 1;
            }
          }
        }
        const b = G.boss;
        if (b && b.active && !b.dead && G.shots[i] === s) {
          const bx = b.x - 28;
          const by = b.y - 70;
          if (overlap(s.x - 4, s.y - 4, 8, 8, bx, by, 56, 70)) {
            if (s.hit.indexOf('boss') < 0) {
              s.hit.push('boss');
              hurtBoss(s.dmg, s.x, s.y);
              s.pierce -= 1;
              if (s.pierce < 0 && !s.force) G.shots.splice(i, 1);
            }
          }
        }
      } else if (playing() && G.deadT <= 0) {
        const pb = pBox();
        if (overlap(s.x - 3, s.y - 3, 6, 6, pb.x, pb.y, pb.w, pb.h)) {
          if (G.dashT > 0 || G.invuln > 0) {
            G.shots.splice(i, 1);
            emit(4, {
              x: s.x, y: s.y, j: 4,
              vx0: -80, vx1: 80, vy0: -80, vy1: 40,
              life: 0.16, r0: 1, r1: 2, rgb: CYN, g: 0
            });
            if (G.dashT > 0 && playing()) addScore(SCORE.dash, s.x, s.y, '穿');
          } else {
            G.shots.splice(i, 1);
            crash('shot');
          }
        }
      }
    }
  }

  function updateCombat(dt) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    const pb = pBox();

    if (G.dashT > 0) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead || e.dashTok === G.dashTok) continue;
        if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
          e.dashTok = G.dashTok;
          hurtEnt(e, 3, e.x, e.y - 8, CYN);
          floatText(e.x, e.y - 20, '冲', CYN, false);
        }
      }
      const b = G.boss;
      if (b && b.active && !b.dead && overlap(pb.x, pb.y, pb.w, pb.h, b.x - 28, b.y - 70, 56, 70)) {
        if (b.dashTok !== G.dashTok) {
          b.dashTok = G.dashTok;
          hurtBoss(2, b.x, b.y - 30);
        }
      }
    } else if (G.invuln <= 0) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead) continue;
        if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h * 0.9, e.w * 0.9, e.h * 0.9)) {
          crash('crash');
          break;
        }
      }
      const b = G.boss;
      if (playing() && b && b.active && !b.dead && G.deadT <= 0 && G.invuln <= 0) {
        if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - 24, b.y - 64, 48, 64)) crash('crash');
      }
    }

    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      if (d.taken) continue;
      d.t += dt;
      if (hypot(d.x - p.x, d.y - (p.y - 12)) < 18) {
        d.taken = true;
        G.weapon = d.kind;
        audio.ping();
        toast(WEP_NAME[d.kind] || '武装', false, true);
        kick(2, 'pickup');
        juice(d.x, d.y, d.kind === 'homing' ? CYN : GOLD, 1);
        syncHud();
      }
    }
  }

  function updateFx(dt) {
    G.t += dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.8);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const o = particles[i];
      o.life -= dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vy += (o.g || 0) * dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const o = floats[i];
      o.t += dt;
      o.y -= o.vy * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t += dt;
      if (ghosts[i].t > 0.18) ghosts.splice(i, 1);
    }
  }

  function updateDemo(dt) {
    demo.t += dt;
    demo.r = true;
    demo.l = false;
    demo.u = Math.sin(demo.t * 1.5) > -0.1;
    demo.d = Math.sin(demo.t * 1.5) < -0.55;
    demo.fire = (demo.t % 2.1) < 1.35;
    demo.dash = (demo.t % 2.4) < 0.14;
    if (G.player && G.player.x > 520) {
      G.player.x = 70;
      G.camX = 0;
    }
  }

  function updateCam(dt) {
    const p = G.player;
    if (!p) return;
    if (G.lock || (G.boss && G.boss.active)) {
      G.camX = lerp(G.camX, G.levelW - VW, 1 - Math.pow(0.04, dt * 60));
    } else {
      const want = p.x - 190;
      G.camX = lerp(G.camX, want, 1 - Math.pow(0.12, dt * 60));
    }
    G.camX = clamp(G.camX, 0, Math.max(0, G.levelW - VW));
  }

  function update(dt) {
    if (G.mode === 'title') updateDemo(dt);
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.dashCd > 0) G.dashCd -= dt;
    if (G.dashT > 0) G.dashT -= dt;
    if (G.invuln > 0) G.invuln -= dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateFx(dt);
      if (G.deadT <= 0) respawn();
      return;
    }

    if (G.clearT > 0) {
      G.clearT -= dt;
      updateFx(dt);
      updateCam(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }

    if (fireHeld()) {
      G.charge = Math.min(1.15, G.charge + dt);
      if (G.charge < 0.26) tryShoot();
    } else {
      if (G.charge >= CHARGE_FIRE) tryForce();
      G.charge = 0;
    }
    if (dashHeld()) tryDash();

    updatePlayer(dt);
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateCombat(dt);
    updateCam(dt);
    updateFx(dt);

    if (forceBar && (G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) {
      const r = clamp(G.charge / CHARGE_FULL, 0, 1);
      forceBar.style.transform = 'scaleX(' + r + ')';
      forceBar.classList.toggle('full', r >= 0.98);
    }
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'vein') {
      g.addColorStop(0, '#120818');
      g.addColorStop(0.55, '#081410');
      g.addColorStop(1, '#04100c');
    } else if (spec.theme === 'core') {
      g.addColorStop(0, '#061418');
      g.addColorStop(0.5, '#04140c');
      g.addColorStop(1, '#03100a');
    } else {
      g.addColorStop(0, '#061810');
      g.addColorStop(0.55, '#04140c');
      g.addColorStop(1, '#031008');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawBackdrop() {
    const sc = scale;
    ctx.fillStyle = 'rgba(45,255,120,0.05)';
    for (let i = 0; i < 8; i++) {
      const x = sx((i * 380 + G.camX * 0.4) % (G.levelW + 200) - 40);
      ctx.fillRect(x, oy + 40 * sc, 18 * sc, 180 * sc);
    }
    for (let i = 0; i < mist.length; i++) {
      const m = mist[i];
      const mx = m.x - G.camX * 0.55 + Math.sin(G.t * 0.4 + i) * 8;
      ctx.fillStyle = rgba(m.rgb, m.a);
      ctx.beginPath();
      ctx.arc(sx(mx + G.camX * 0.55), sy(m.y), m.r * sc, 0, TAU);
      ctx.fill();
    }
    const gy = sy(GY);
    ctx.fillStyle = 'rgba(10, 36, 24, 0.9)';
    ctx.fillRect(ox, gy, VW * sc, (VH - GY + 8) * sc);
    ctx.fillStyle = rgba(HOT, 0.35);
    ctx.fillRect(ox, gy, VW * sc, 2 * sc);
  }

  function drawPlats() {
    const sc = scale;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p.x + p.w < G.camX - 8 || p.x > G.camX + VW + 8) continue;
      const x = sx(p.x);
      const y = sy(p.y);
      if (p.base) {
        ctx.fillStyle = '#0a2418';
        ctx.fillRect(x, y, p.w * sc, 40 * sc);
        ctx.fillStyle = rgba(HOT, 0.45);
        ctx.fillRect(x, y, p.w * sc, 3 * sc);
        for (let k = 0; k < p.w; k += 28) {
          ctx.fillStyle = rgba(TEAL, 0.18);
          ctx.fillRect(x + k * sc, y + 8 * sc, 10 * sc, 18 * sc);
        }
      } else {
        ctx.fillStyle = 'rgba(12, 48, 32, 0.92)';
        ctx.fillRect(x, y, p.w * sc, 10 * sc);
        ctx.fillStyle = rgba(CYN, 0.5);
        ctx.fillRect(x, y, p.w * sc, 2 * sc);
      }
    }
  }

  function drawEagle(p, opt) {
    const x = sx(p.x);
    const y = sy(p.y);
    const sc = scale;
    const f = p.face;
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const sq = p.squash || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f, sq);

    const flap = opt.hover ? Math.sin(G.t * 22) * 7 : 2;
    ctx.fillStyle = rgba(CYN, opt.dash ? 0.9 : 0.7);
    ctx.beginPath();
    ctx.moveTo(-4 * sc, -16 * sc);
    ctx.lineTo(-16 * sc, (-12 - flap) * sc);
    ctx.lineTo(-6 * sc, -8 * sc);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4 * sc, -16 * sc);
    ctx.lineTo(16 * sc, (-10 - flap * 0.6) * sc);
    ctx.lineTo(6 * sc, -8 * sc);
    ctx.fill();

    if (opt.hover || opt.dash) {
      ctx.fillStyle = rgba(opt.dash ? WHT : CYN, 0.8);
      ctx.beginPath();
      ctx.moveTo(-4 * sc, -6 * sc);
      ctx.lineTo((-12 - Math.random() * 6) * sc, -2 * sc);
      ctx.lineTo(-4 * sc, 2 * sc);
      ctx.fill();
    }

    ctx.fillStyle = rgba(opt.flash ? WHT : HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-6 * sc, -8 * sc);
    ctx.lineTo(6 * sc, -8 * sc);
    ctx.lineTo(5 * sc, 0);
    ctx.lineTo(-5 * sc, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -20 * sc);
    ctx.lineTo(0, -28 * sc);
    ctx.lineTo(5 * sc, -20 * sc);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.fillRect(-6 * sc, -20 * sc, 12 * sc, 8 * sc);
    ctx.fillStyle = '#04140c';
    ctx.fillRect(-4.5 * sc, -18 * sc, 9 * sc, 4 * sc);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(-4 * sc, -17 * sc, 8 * sc, 2 * sc);

    const aim = opt.aim || { dx: f, dy: 0 };
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.save();
    ctx.translate(2 * sc, -10 * sc);
    ctx.rotate(Math.atan2(aim.dy, aim.dx * f));
    ctx.fillRect(0, -1.2 * sc, (opt.muzzle ? 16 : 12) * sc, 2.4 * sc);
    ctx.restore();

    if (opt.charge > 0.2) {
      const a = clamp(opt.charge / CHARGE_FULL, 0, 1);
      ctx.strokeStyle = rgba(a > 0.95 ? GOLD : CYN, 0.35 + a * 0.5);
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.arc(0, -12 * sc, (12 + a * 10) * sc, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead || !onScreen(e.x, e.y, 24)) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const sc = scale;
    const flash = e.hitN > 0;
    const rgb = flash ? WHT : (e.kind === 'guard' ? GOLD : e.kind === 'pod' ? PUR : MAG);
    ctx.fillStyle = rgba(rgb, 0.92);
    if (e.kind === 'wing') {
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * sc, 10 * sc, 5 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(x - 12 * sc, y - 7 * sc, 8 * sc, 2 * sc);
      ctx.fillRect(x + 4 * sc, y - 7 * sc, 8 * sc, 2 * sc);
    } else if (e.kind === 'pod') {
      ctx.beginPath();
      ctx.arc(x, y - 8 * sc, 8 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(x, y - 8 * sc, 3 * sc, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'turret') {
      ctx.fillRect(x - 8 * sc, y - 16 * sc, 16 * sc, 16 * sc);
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(x - 2 * sc, y - 22 * sc, 4 * sc, 10 * sc);
    } else if (e.kind === 'ram') {
      ctx.beginPath();
      ctx.moveTo(x + 12 * sc, y - 8 * sc);
      ctx.lineTo(x - 10 * sc, y - 16 * sc);
      ctx.lineTo(x - 10 * sc, y);
      ctx.closePath();
      ctx.fill();
    } else if (e.kind === 'guard') {
      ctx.fillRect(x - 9 * sc, y - 22 * sc, 18 * sc, 22 * sc);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(x - 5 * sc, y - 16 * sc, 10 * sc, 6 * sc);
    } else {
      ctx.fillRect(x - 8 * sc, y - 12 * sc, 16 * sc, 12 * sc);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(x - 6 * sc, y - 8 * sc, 4 * sc, 3 * sc);
    }
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!onScreen(b.x, b.y, 90) && !b.active) return;
    const x = sx(b.x);
    const y = sy(b.y + (b.hop || 0));
    const sc = scale;
    const flash = b.hitN > 0;
    ctx.fillStyle = rgba(flash ? WHT : MAG, 0.92);

    if (b.kind === '颚门') {
      const open = (b.open || 0) * 22 * sc;
      ctx.fillStyle = rgba(TEAL, 0.95);
      ctx.fillRect(x - 36 * sc, y - 96 * sc, 72 * sc, 28 * sc);
      ctx.fillStyle = rgba(flash ? WHT : MAG, 0.95);
      ctx.fillRect(x - 32 * sc, y - 70 * sc - open, 64 * sc, 24 * sc);
      ctx.fillRect(x - 32 * sc, y - 28 * sc + open * 0.3, 64 * sc, 22 * sc);
      if (b.open > 0.4) {
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.arc(x, y - 48 * sc, 8 * sc, 0, TAU);
        ctx.fill();
      }
    } else if (b.kind === '核蛛') {
      ctx.fillStyle = rgba(PUR, 0.9);
      for (let k = 0; k < 4; k++) {
        const a = k * 0.7 - 1.1 + Math.sin(b.t * 4 + k) * 0.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 20 * sc);
        ctx.lineTo(x + Math.cos(a) * 36 * sc, y - 20 * sc + Math.sin(a) * 28 * sc);
        ctx.lineWidth = 4 * sc;
        ctx.strokeStyle = rgba(PUR, 0.85);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(flash ? WHT : MAG, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 24 * sc, 22 * sc, 16 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(x, y - 24 * sc, 7 * sc, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.beginPath();
      ctx.ellipse(x, y - 8 * sc, 42 * sc, 10 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(flash ? WHT : HOT, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * sc, 20 * sc, 16 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(x - 8 * sc, y - 28 * sc);
      ctx.lineTo(x, y - 42 * sc);
      ctx.lineTo(x + 8 * sc, y - 28 * sc);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(x, y - 4 * sc, 6 * sc, 0, TAU);
      ctx.fill();
    }
  }

  function drawShots() {
    const sc = scale;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = sx(s.x);
      const y = sy(s.y);
      const r = (s.force ? 7 : s.fat ? 4.5 : 2.4) * sc;
      ctx.fillStyle = rgba(s.rgb || HOT, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      if (s.force || s.fat) {
        ctx.strokeStyle = rgba(WHT, 0.5);
        ctx.lineWidth = 1.2 * sc;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.4, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawDrops() {
    const sc = scale;
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      if (d.taken) continue;
      const x = sx(d.x);
      const y = sy(d.y + Math.sin(G.t * 4 + d.x) * 3);
      const rgb = d.kind === 'homing' ? CYN : GOLD;
      ctx.fillStyle = rgba(rgb, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, 6 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.font = 'bold ' + (8 * sc) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.kind === 'homing' ? '追' : '炎', x, y + 3 * sc);
    }
  }

  function drawFx() {
    const sc = scale;
    let i, o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const k = o.t / 0.4;
      ctx.strokeStyle = rgba(o.rgb, 1 - k);
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + k * 22) * sc, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      const k = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, k);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * k * 0.4) * sc, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      ctx.fillStyle = rgba(o.rgb, clamp(o.life / o.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * sc, 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      if (!o.text) continue;
      const a = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.font = 'bold ' + (o.size * sc) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function drawGhosts() {
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      const a = 1 - g.t / 0.18;
      ctx.globalAlpha = a * 0.35;
      drawEagle({ x: g.x, y: g.y, face: g.face, squash: 1 }, { hover: true, dash: true, aim: { dx: g.face, dy: 0 }, charge: 0, blink: false, muzzle: false, flash: false });
      ctx.globalAlpha = 1;
    }
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing()) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.92);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(HOT, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.name, x, y - 3 * scale);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#04140c';
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
    drawPlats();
    drawDrops();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    drawShots();
    drawGhosts();

    if (G.player && G.deadT <= 0) {
      drawEagle(G.player, {
        hover: G.player.hover,
        dash: G.dashT > 0,
        aim: aimVec(),
        muzzle: G.muzzle > 0,
        charge: G.charge,
        blink: G.invuln > 0 && G.mode === 'play',
        flash: false
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
    const shift = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const shootKey = space || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') keys.u = down;
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') keys.d = down;
    if (shootKey) keys.fire = down;
    if (shift) keys.dash = down;

    if (down && (isMove || shootKey || k === 'Enter' || shift)) e.preventDefault();
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
    if (k === '1') {
      if (G.mode === 'title') startGame('soldier');
      return;
    }
    if (k === '2') {
      if (G.mode === 'title') startGame('core');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        keys.fire = false;
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
    hold(document.getElementById('btn-dash'), function () { keys.dash = true; }, function () { keys.dash = false; });
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
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      draw();
      return;
    }
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
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

  if (btnSoldier) btnSoldier.addEventListener('click', function () { audio.ensure(); startGame('soldier'); });
  if (btnCore) btnCore.addEventListener('click', function () { audio.ensure(); startGame('core'); });
  if (ovAgain) ovAgain.addEventListener('click', function () { audio.ensure(); startGame(G.kind); });
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win') startGame('core');
      else goTitle();
    });
  }
  if (modeSoldier) modeSoldier.addEventListener('click', function () { audio.ensure(); startGame('soldier'); });
  if (modeCore) modeCore.addEventListener('click', function () { audio.ensure(); startGame('core'); });
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
      keys.dash = false;
    }
  });

  requestAnimationFrame(frame);
})();
