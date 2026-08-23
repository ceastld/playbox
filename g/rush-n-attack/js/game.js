'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 218;
  const AIR = 0.9;
  const JUMP_V = 490;
  const GRAV = 1500;
  const MAX_FALL = 560;
  const COYOTE = 0.08;
  const BUFFER = 0.1;
  const PW = 14;
  const PH = 26;
  const PD = 16;
  const MELEE = 46;
  const SLASH_T = 0.16;
  const INVULN = 1.2;
  const DIE_T = 0.86;
  const BEST_KEY = 'playbox-rush-n-attack-best';
  const MUTE_KEY = 'playbox-rush-n-attack-mute';
  const OPS = '方向 / WASD 走蹲 · 空格刺或射 · Shift / Z 跳 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [61, 255, 98];
  const HOT2 = [154, 255, 180];
  const WHT = [243, 255, 246];
  const LEAF = [26, 138, 72];
  const ORG = [255, 154, 58];
  const RED = [255, 72, 72];
  const BRN = [196, 92, 64];
  const SKIN = [232, 192, 144];
  const SNOW = [200, 230, 220];

  const GUN_NAME = { knife: '军刀', flame: '喷火', rocket: '火箭', scatter: '霰弹' };
  const WEAPONS = {
    flame: { cd: 0.2, max: 4, spd: 300, dmg: 2, blast: 0, life: 0.28, ammo: 3, rgb: ORG, pierce: 1 },
    rocket: { cd: 0.36, max: 2, spd: 340, dmg: 3, blast: 48, life: 1.0, ammo: 3, rgb: GOLD, pierce: 0 },
    scatter: { cd: 0.26, max: 9, spd: 500, dmg: 1, blast: 0, life: 0.42, ammo: 3, rgb: CYN, pierce: 0 }
  };

  const SCORE = {
    grunt: 80, charger: 120, hopper: 110, hound: 150,
    mortar: 200, nest: 180, torch: 160, boss: 3600, stage: 1400
  };

  const STAGES = [
    {
      name: '雪营', boss: '营门', w: 1680, hp: 24, theme: 'snow',
      ground: [[0, 470], [540, 200], [810, 220], [1100, 580]],
      plats: [
        [140, MY, 140], [340, MY, 150], [620, MY, 140],
        [900, MY, 150], [1180, MY, 160], [1440, MY, 140],
        [520, HY, 120], [1020, HY, 130]
      ],
      ents: [
        [220, GY, 'grunt', 20, 430],
        [360, GY, 'grunt', 40, 450],
        [420, MY, 'mortar', 340, 490],
        [560, GY, 'charger', 540, 740],
        [640, GY, 'flame', 0, 0],
        [700, HY, 'hopper', 520, 840],
        [760, MY, 'grunt', 620, 760],
        [940, GY, 'hound', 810, 1080],
        [980, GY, 'grunt', 810, 1080],
        [1040, MY, 'nest', 0, 0],
        [1180, HY, 'hopper', 1020, 1280],
        [1280, GY, 'torch', 1100, 1480],
        [1360, GY, 'scatter', 0, 0],
        [1420, MY, 'mortar', 1180, 1440],
        [1520, GY, 'charger', 1300, 1640]
      ]
    },
    {
      name: '港闸', boss: '趸闸', w: 1860, hp: 34, theme: 'dock',
      ground: [[0, 430], [500, 200], [770, 210], [1050, 220], [1340, 520]],
      plats: [
        [80, MY, 130], [280, MY, 150], [520, MY, 140],
        [780, MY, 150], [1060, MY, 150], [1380, MY, 160], [1640, MY, 140],
        [200, HY, 120], [640, HY, 130], [1100, HY, 140], [1500, HY, 130]
      ],
      ents: [
        [180, GY, 'grunt', 20, 390],
        [300, MY, 'nest', 0, 0],
        [360, HY, 'hopper', 200, 480],
        [540, GY, 'charger', 500, 700],
        [580, GY, 'rocket', 0, 0],
        [640, MY, 'mortar', 520, 720],
        [820, GY, 'hound', 770, 980],
        [860, GY, 'torch', 770, 1000],
        [920, HY, 'hopper', 780, 1100],
        [1080, GY, 'grunt', 1050, 1280],
        [1140, MY, 'nest', 0, 0],
        [1220, GY, 'flame', 0, 0],
        [1280, HY, 'hopper', 1100, 1500],
        [1420, GY, 'charger', 1340, 1680],
        [1480, MY, 'torch', 1380, 1600],
        [1580, GY, 'mortar', 1500, 1720],
        [1680, GY, 'hound', 1500, 1820]
      ]
    },
    {
      name: '核库', boss: '库司', w: 2080, hp: 46, theme: 'silo',
      ground: [[0, 400], [470, 200], [740, 210], [1020, 220], [1310, 210], [1590, 490]],
      plats: [
        [100, MY, 140], [320, MY, 150], [560, MY, 140],
        [820, MY, 150], [1100, MY, 150], [1400, MY, 160], [1720, MY, 150],
        [240, HY, 120], [700, HY, 130], [1180, HY, 140], [1600, HY, 130]
      ],
      ents: [
        [200, GY, 'grunt', 20, 360],
        [280, GY, 'torch', 20, 400],
        [340, MY, 'nest', 0, 0],
        [400, HY, 'hopper', 240, 560],
        [560, GY, 'charger', 470, 680],
        [620, GY, 'scatter', 0, 0],
        [680, MY, 'mortar', 560, 740],
        [860, GY, 'hound', 740, 980],
        [920, GY, 'grunt', 740, 1000],
        [980, HY, 'hopper', 700, 1180],
        [1100, GY, 'torch', 1020, 1280],
        [1160, MY, 'nest', 0, 0],
        [1240, GY, 'rocket', 0, 0],
        [1320, HY, 'hopper', 1180, 1500],
        [1460, GY, 'charger', 1310, 1540],
        [1520, MY, 'mortar', 1400, 1600],
        [1640, GY, 'hound', 1590, 1880],
        [1720, GY, 'torch', 1590, 1900],
        [1820, MY, 'grunt', 1720, 1900],
        [1900, GY, 'charger', 1700, 2040]
      ]
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
    return (night ? 1.26 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function bossHp(spec) {
    return (spec.hp * (isNight() ? 1.22 : 1)) | 0;
  }
  function isPickup(kind) {
    return kind === 'flame' || kind === 'rocket' || kind === 'scatter';
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('night faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (MELEE < 36) throw new Error('melee range');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[2].boss !== '库司' || STAGES[2].hp < 40) throw new Error('silo boss');
    if (BEST_KEY !== 'playbox-rush-n-attack-best') throw new Error('best key');
    if (WEAPONS.flame.ammo !== 3 || WEAPONS.rocket.ammo !== 3 || WEAPONS.scatter.ammo !== 3) {
      throw new Error('3-shot guns');
    }
    if (PD >= PH) throw new Error('duck shorter');
    let i, s, hasGun;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length) throw new Error('ground');
      if (!s.boss || s.hp < 16) throw new Error('stage boss');
      hasGun = false;
      for (let k = 0; k < s.ents.length; k++) {
        if (isPickup(s.ents[k][2])) hasGun = true;
      }
      if (!hasGun) throw new Error('gun drop');
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
  const btnRaid = document.getElementById('btn-raid');
  const btnNight = document.getElementById('btn-night');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeRaid = document.getElementById('mode-raid');
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
  const gunLabel = document.getElementById('gun-label');
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

  const keys = { l: false, r: false, u: false, d: false, j: false };
  const demo = { l: false, r: true, j: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const flakes = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 1680,
    theme: 'snow',
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    player: null,
    boss: null,
    lives: LIVES,
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
    gate: 1580,
    rainT: 0,
    flankT: 3.2,
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
  function inJ() {
    return G.mode === 'title' ? demo.j : keys.j;
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
      this.noise(0.05, 0.044, 1700);
      this.beep(520, 0.08, 'sawtooth', 0.052, 150);
    },
    stab(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.042, 900);
      this.beep(580 * lift, 0.08, 'square', 0.05, 960 * lift);
    },
    flame() {
      this.ensure();
      this.noise(0.12, 0.07, 280);
      this.beep(180, 0.1, 'sawtooth', 0.04, 70);
    },
    bark() {
      this.ensure();
      this.noise(0.05, 0.06, 500);
      this.beep(260, 0.07, 'square', 0.05, 90);
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
    if (modeRaid) modeRaid.setAttribute('aria-pressed', night ? 'false' : 'true');
    if (modeNight) modeNight.setAttribute('aria-pressed', night ? 'true' : 'false');
  }

  function wepText() {
    if (G.wep === 'knife' || G.ammo <= 0) return '军刀';
    return GUN_NAME[G.wep] + ' ' + G.ammo;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = isNight() ? '夜袭 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isNight() ? '夜袭营' : '突袭';
      tagLabel.classList.toggle('warn', isNight());
      tagLabel.classList.toggle('hot', !isNight() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = wepText();
      gunLabel.className = 'gun';
      if (G.wep !== 'knife' && G.ammo > 0) gunLabel.classList.add(G.wep);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞上、中弹、坠缺口都丢命', 'warn');
    else if (G.mode === 'win') setHint('核库已破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 军刀贴身 · 蹲过抛弹', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint(spec.boss + ' · 近刺远射 · 火箭能削血', 'hot');
    else setHint('跑跳刺刀 · 三发枪 · 撞上丢命', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RUSH';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '夜袭营' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup');
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
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.04);
    }
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

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = kind === 'nest' || kind === 'torch' ? 2 : 1;
    const h = kind === 'hound' ? 14 : kind === 'nest' ? 28 : 24;
    const w = kind === 'nest' ? 18 : kind === 'hound' ? 16 : 14;
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, t: rand(0, 1),
      fire: rand(0.4, 1.3),
      grounded: true, dead: false,
      hitN: 0, w: w, h: h
    };
  }

  function makeBoss(spec) {
    if (!spec.boss) return null;
    const hp = bossHp(spec);
    return {
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: 'boss',
      t: 0, fire: 1.0, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 24, h: 36, name: spec.boss
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
    G.pickups = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      if (isPickup(e[2])) {
        if (!attract) G.pickups.push({ x: e[0], y: e[1] - 18, kind: e[2], taken: false });
      } else {
        G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
      }
    }
    if (isNight() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (isPickup(e[2]) || e[2] === 'nest') continue;
        const nx = e[0] - 64;
        if (nx < 40) continue;
        if (!platUnder(nx, e[1], null)) continue;
        const kind = e[2] === 'mortar' ? 'hound' : (e[2] === 'torch' ? 'charger' : 'hopper');
        G.ents.push(makeEnt(nx, e[1], kind, e[3], e[4]));
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
    G.jumpBuf = 0;
    G.flankT = isNight() ? 1.5 : 3.6;
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
    const h = p.duck ? PD : p.h;
    return { x: p.x - p.w * 0.45, y: p.y - h, w: p.w * 0.9, h: h * 0.92 };
  }

  function slashBox() {
    const p = G.player;
    const x0 = p.face > 0 ? p.x : p.x - MELEE;
    const h = p.duck ? 20 : 32;
    return { x: x0, y: p.y - (p.duck ? 20 : 30), w: MELEE, h: h };
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
      if (dx > 4 && dx < MELEE + 6 && Math.abs(e.y - p.y) < 28) {
        if (dx < bd) { bd = dx; best = e; }
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      e = G.boss;
      dx = (e.x - p.x) * p.face;
      if (dx > 4 && dx < MELEE + 12 && Math.abs(e.y - p.y) < 34) {
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
    G.atkCd = 0.2;
    p.pose = 0.16;
    audio.knife();
    emit(6, {
      x: p.x + p.face * 22, y: p.y - (p.duck ? 10 : 16), j: 8,
      vx0: p.face * 40, vx1: p.face * 220, vy0: -160, vy1: 40,
      life: 0.22, r0: 1, r1: 2.4, rgb: GOLD
    });
    hitStop(0.03);
  }

  function pushShot(kind, x, y, vx, vy, from, extra) {
    const spec = WEAPONS[kind] || extra || {};
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy, g: extra && extra.g || 0,
      from: from, kind: kind,
      life: extra && extra.life != null ? extra.life : (spec.life || 0.7),
      dmg: extra && extra.dmg != null ? extra.dmg : (spec.dmg || 1),
      blast: spec.blast || 0,
      rgb: spec.rgb || extra && extra.rgb || CYN,
      face: vx >= 0 ? 1 : -1,
      pierce: spec.pierce || 0
    });
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
    const y = p.y - (p.duck ? 10 : 16);
    G.ammo -= 1;
    G.atkCd = spec.cd;
    G.muzzle = 0.08;
    p.pose = 0.12;
    if (G.wep === 'scatter') {
      pushShot('scatter', p.x + p.face * 16, y, p.face * spec.spd, -70, 'p');
      pushShot('scatter', p.x + p.face * 16, y, p.face * spec.spd, 0, 'p');
      pushShot('scatter', p.x + p.face * 16, y, p.face * spec.spd, 70, 'p');
      audio.bark();
      kick(1.8, 'hit');
    } else if (G.wep === 'flame') {
      pushShot('flame', p.x + p.face * 14, y, p.face * spec.spd, 0, 'p');
      audio.flame();
      kick(1.6, 'thump');
      emit(8, {
        x: p.x + p.face * 22, y: y, j: 6,
        vx0: p.face * 80, vx1: p.face * 260, vy0: -80, vy1: 60,
        life: 0.22, r0: 1.4, r1: 3.2, rgb: ORG
      });
    } else {
      pushShot('rocket', p.x + p.face * 16, y, p.face * spec.spd, 0, 'p');
      audio.boom();
      kick(2.4, 'thump');
    }
    if (G.wep !== 'flame') {
      emit(5, {
        x: p.x + p.face * 18, y: y, j: 3,
        vx0: p.face * 80, vx1: p.face * 240, vy0: -50, vy1: 50,
        life: 0.16, r0: 1, r1: 2.2, rgb: spec.rgb
      });
    }
    if (G.ammo <= 0) {
      G.wep = 'knife';
      toast('军刀', false, false);
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

  function explode(x, y, r, dmg) {
    juice(x, y, GOLD, 1.5);
    audio.boom();
    hitStop(0.07);
    kick(5.2, 'boom');
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - x, (e.y - 12) - y) < r) hurtEnt(e, dmg, 'rocket');
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      if (hypot(G.boss.x - x, (G.boss.y - 16) - y) < r + 8) hurtEnt(G.boss, dmg, 'rocket');
    }
  }

  function hurtEnt(e, dmg, src) {
    if (e.dead || e.hp <= 0) return;
    if (src === 'slash' && e.hitN === G.slashHit) return;
    if (src === 'slash') e.hitN = G.slashHit;
    e.hp -= dmg;
    const rgb = e === G.boss ? MAG : (src === 'flame' ? ORG : src === 'rocket' ? GOLD : src === 'slash' ? GOLD : CYN);
    juice(e.x, e.y - 14, rgb, e === G.boss ? 1.4 : src === 'slash' ? 1.15 : 0.85);
    if (src === 'slash') {
      hitStop(0.056);
      kick(3.4, 'hit');
      audio.stab(G.combo);
    } else if (src === 'flame') {
      hitStop(0.04);
      kick(2.4, 'thump');
      audio.ping(G.combo);
    } else if (src === 'rocket') {
      hitStop(0.07);
      kick(5.0, 'boom');
    } else {
      hitStop(0.036);
      kick(2.0, 'thump');
      audio.ping(G.combo);
    }
    bumpCombo();
    if (e.hp <= 0) {
      e.dead = true;
      e.hp = 0;
      const kind = e === G.boss ? 'boss' : e.kind;
      const sc = (SCORE[kind] || 100) * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 28, '+' + sc, GOLD, e === G.boss || G.mult > 1);
      if (e === G.boss) {
        G.clearT = 1.9;
        audio.boss();
        screenFlash(GOLD, 0.45);
        kick(7.4, 'boom');
        toast(e.name + ' 击破', false, true);
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

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.face = 1;
    G.deadT = 0;
    G.invuln = INVULN;
    G.wep = 'knife';
    G.ammo = 0;
    G.shots = G.shots.filter(function (s) { return s.from === 'p'; });
    G.slashT = 0;
    syncHud();
  }

  function loseWhy() {
    if (G.why === 'fall') return '坠入缺口了';
    if (G.why === 'shot') return '中弹了';
    if (G.why === 'flame') return '被喷到了';
    return '撞上了';
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    showOverlay('lose', '命尽', loseWhy() + ' · ' + G.score + ' 分 · 连击最高 ×' + Math.max(1, G.maxCombo || 1));
    audio.lose();
    syncHud();
  }

  function goWin() {
    addScore(isNight() ? 10000 : 8000);
    saveBest();
    G.mode = 'win';
    if (stageEl) {
      stageEl.classList.remove('win-flash');
      void stageEl.offsetWidth;
      stageEl.classList.add('win-flash');
    }
    const title = isNight() ? '夜袭营得手' : '核库捣毁了';
    showOverlay('win', title, (isNight() ? '夜色里杀穿三营。 ' : '三关突袭，库司倒下。 ') + G.score + ' 分');
    audio.win();
    syncHud();
  }

  function nextStage() {
    addScore(SCORE.stage * G.stage * G.mult);
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    const keepWep = G.wep;
    const keepAmmo = G.ammo;
    const keepCombo = G.combo;
    const keepComboT = G.comboT;
    const keepMult = G.mult;
    loadStage(G.stage, false);
    G.wep = keepWep;
    G.ammo = keepAmmo;
    G.combo = keepCombo;
    G.comboT = keepComboT;
    G.mult = keepMult;
    G.invuln = 0.8;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'night' ? 'night' : 'raid';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
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
    G.wep = 'knife';
    G.ammo = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isNight() ? '夜袭营' : STAGES[0].name, false, !isNight());
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
    G.wep = 'knife';
    G.ammo = 0;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '突袭', '向右跑、跳、刺。军刀是本命。地上捡到的喷火、火箭、霰弹各三发。撞上、中弹、坠缺口都丢一条命。短关之后是关底。');
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

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.j = pitAhead(p.x, p.y, 1) && p.grounded;
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
    toast(GUN_NAME[kind] + ' ×' + spec.ammo, false, true);
    audio.pickup();
    kick(2.2, 'pickup');
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

    p.duck = !!(inD() && p.grounded);
    p.h = p.duck ? PD : PH;

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;
    const spd = WALK * (p.grounded ? (p.duck ? 0.62 : 1) : AIR);
    p.vx = ax * spd;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);

    if (inJ()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      p.duck = false;
      p.h = PH;
      G.jumpBuf = 0;
      p.squash = 0.78;
      audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.028);
    }
    if (!inJ() && p.vy < -80) p.vy *= Math.pow(0.42, dt * 8);

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, null);
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

    p.squash = lerp(p.squash, p.duck ? 0.72 : 1, 1 - Math.pow(0.001, dt));
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
        juice(u.x, u.y, u.kind === 'rocket' ? GOLD : u.kind === 'flame' ? ORG : CYN, 0.95);
        screenFlash(u.kind === 'rocket' ? GOLD : u.kind === 'flame' ? ORG : CYN, 0.28);
      }
    }

    if (playing() && G.clearT <= 0 && p.x > G.gate) {
      if (G.boss && !G.boss.dead) {
        if (!G.boss.active) {
          G.boss.active = true;
          audio.boss();
          toast(G.boss.name + ' 现身', false, true);
          screenFlash(MAG, 0.32);
          p.x = G.gate;
        } else {
          p.x = G.gate;
        }
      } else {
        G.clearT = 1.15;
        G.lock = 1.15;
        toast(STAGES[G.stage - 1].name + ' 突袭', false, true);
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
      if ((e.kind === 'hopper' || e.kind === 'hound') && Math.abs(e.x - p.x) < 280) n += 1;
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
    const kind = Math.random() < 0.45 ? 'hound' : 'hopper';
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

    if (e.kind === 'nest' || e.kind === 'mortar') {
      e.face = p.x >= e.x ? 1 : -1;
    } else if (e.kind === 'hound' || e.kind === 'charger' || e.kind === 'grunt' || e.kind === 'hopper' || e.kind === 'torch') {
      let dir = e.face;
      const see = Math.abs(p.x - e.x) < (e.kind === 'hound' || e.kind === 'hopper' ? 340 : 240)
        && Math.abs(p.y - e.y) < 62;
      if ((e.kind === 'hound' || e.kind === 'charger' || e.kind === 'hopper' || e.kind === 'torch') && see) {
        dir = p.x > e.x ? 1 : -1;
      }
      const spd = (e.kind === 'hound' ? 170 : e.kind === 'charger' ? 138 : e.kind === 'hopper' ? 88 : e.kind === 'torch' ? 70 : 62) * mul;
      const nx = e.x + dir * spd * dt;
      if (e.kind === 'grunt' || e.kind === 'torch') {
        if (nx < e.a || nx > e.b || !standAt(nx + dir * 8, e.y)) {
          e.face = -e.face;
        } else {
          e.x = nx;
          e.face = dir;
        }
      } else if (!standAt(nx + dir * 8, e.y) && e.grounded) {
        e.face = -dir;
      } else {
        e.x = nx;
        e.face = dir;
      }
      e.x = clamp(e.x, 16, G.levelW - 16);
      if (e.kind === 'hopper' && e.grounded && see && e.t > 0.7 && Math.abs(p.x - e.x) < 160) {
        e.vy = -420;
        e.grounded = false;
        e.t = 0;
      }
    }

    if (e.kind === 'mortar') {
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 420) {
        pushShot('mortar', e.x + e.face * 8, e.y - 20,
          e.face * (90 + Math.abs(p.x - e.x) * 0.12), -320, 'e',
          { g: 540, life: 2.1, dmg: 1, rgb: ORG });
        e.fire = (isNight() ? 1.12 : 1.52) / (1 + (G.stage - 1) * 0.08);
        audio.beep(180, 0.06, 'square', 0.025, 70);
      }
    }

    if (e.kind === 'nest') {
      e.fire -= dt;
      const dx = p.x - e.x;
      if (e.fire <= 0 && Math.abs(p.y - e.y) < 50 && Math.abs(dx) < 380 && playing() && G.deadT <= 0) {
        pushShot('bullet', e.x + e.face * 12, e.y - 20,
          e.face * 260 * (isNight() ? 1.12 : 1), 0, 'e',
          { life: 1.1, dmg: 1, rgb: RED });
        e.fire = (isNight() ? 0.88 : 1.28) / (1 + (G.stage - 1) * 0.08);
        audio.beep(520, 0.04, 'square', 0.02, 220);
      }
    }

    if (e.kind === 'torch') {
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 90 && Math.abs(p.y - e.y) < 28) {
        pushShot('eflame', e.x + e.face * 12, e.y - 16,
          e.face * 220, 0, 'e',
          { life: 0.28, dmg: 1, rgb: ORG });
        e.fire = isNight() ? 0.7 : 1.05;
        audio.flame();
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const slashing = G.slashT > 0.05 && inSlash(e.x, e.y, e.w, e.h);
      if (!slashing && overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        die('crash');
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
        toast(b.name + ' 现身', false, true);
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
    const low = b.hp < b.max * 0.5;
    const name = b.name;

    if (name === '营门') {
      b.x = G.levelW - 110;
      b.face = -1;
    } else if (b.grounded) {
      if (dist > 70) b.x += b.face * (name === '库司' ? 92 : 80) * mul * dt;
      else if (dist < 42 && b.t > 0.5 && name !== '营门') {
        b.vy = -360;
        b.vx = -b.face * 120;
        b.grounded = false;
        b.t = 0;
      }
    } else b.x += (b.vx || 0) * dt;
    b.x = clamp(b.x, G.levelW - VW + 40, G.levelW - 40);

    const rate = ((low ? 0.62 : 0.98) / mul) * (name === '营门' ? 0.92 : 1);
    if (b.fire <= 0 && playing() && G.deadT <= 0) {
      if (name === '营门') {
        pushShot('bullet', b.x - 16, b.y - 18, -280, 0, 'e', { life: 1.2, dmg: 1, rgb: MAG });
        pushShot('bullet', b.x - 14, b.y - 26, -250, -70, 'e', { life: 1.1, dmg: 1, rgb: MAG });
        pushShot('bullet', b.x - 14, b.y - 10, -250, 40, 'e', { life: 1.1, dmg: 1, rgb: MAG });
        if (low) {
          pushShot('mortar', b.x - 10, b.y - 22, -120, -340, 'e', { g: 540, life: 2, dmg: 1, rgb: ORG });
        }
      } else if (name === '趸闸') {
        pushShot('bullet', b.x + b.face * 16, b.y - 22, b.face * 300, 0, 'e', { life: 1.2, dmg: 1, rgb: MAG });
        pushShot('bullet', b.x + b.face * 12, b.y - 30, b.face * 260, -40, 'e', { life: 1.1, dmg: 1, rgb: MAG });
        if (low) {
          pushShot('bullet', b.x + b.face * 12, b.y - 12, b.face * 240, 30, 'e', { life: 1.0, dmg: 1, rgb: MAG });
        }
      } else {
        pushShot('bullet', b.x + b.face * 16, b.y - 22, b.face * 280, 0, 'e', { life: 1.2, dmg: 1, rgb: MAG });
        pushShot('bullet', b.x + b.face * 12, b.y - 30, b.face * 250, -55, 'e', { life: 1.1, dmg: 1, rgb: MAG });
        pushShot('bullet', b.x + b.face * 12, b.y - 12, b.face * 250, 40, 'e', { life: 1.1, dmg: 1, rgb: MAG });
        if (low) {
          pushShot('mortar', b.x + b.face * 8, b.y - 24, b.face * 140, -320, 'e', { g: 540, life: 2, dmg: 1, rgb: ORG });
        }
      }
      b.fire = rate;
      audio.beep(200, 0.08, 'sawtooth', 0.03, 70);
    }

    if (name === '库司' && low && b.t > 1.7 && playing()) {
      spawnFlank();
      b.t = 0;
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const slashing = G.slashT > 0.05 && inSlash(b.x, b.y, b.w, b.h);
      if (!slashing && overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        die('crash');
      }
    }
  }

  function shotHitsPlayer(s, p) {
    const duck = p.duck;
    const cy = p.y - (duck ? 8 : 16);
    const rad = duck ? 9 : 12;
    if (s.kind === 'mortar' && duck && s.y < p.y - 18) return false;
    if (s.kind === 'bullet' && duck && s.y < p.y - 20 && Math.abs(s.vy) < 20) return false;
    return hypot(s.x - p.x, s.y - cy) < rad;
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
        if (s.kind === 'rocket' && s.from === 'p') explode(s.x, s.y, s.blast || 48, s.dmg);
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        let k, e;
        for (k = 0; k < G.ents.length; k++) {
          e = G.ents[k];
          if (e.dead || e === s.hitE) continue;
          if (hypot(s.x - e.x, s.y - (e.y - 14)) < (s.kind === 'flame' ? 18 : 14)) {
            if (s.kind === 'rocket') explode(s.x, s.y, s.blast || 48, s.dmg);
            else hurtEnt(e, s.dmg, s.kind === 'flame' ? 'flame' : 'gun');
            s.hitE = e;
            hit = true;
            break;
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active && G.boss !== s.hitE) {
          if (hypot(s.x - G.boss.x, s.y - (G.boss.y - 18)) < (s.kind === 'flame' ? 22 : 18)) {
            if (s.kind === 'rocket') explode(s.x, s.y, s.blast || 48, s.dmg);
            else hurtEnt(G.boss, s.dmg, s.kind === 'flame' ? 'flame' : 'gun');
            s.hitE = G.boss;
            hit = true;
          }
        }
        if (hit) {
          popSpark(s.x, s.y, s.rgb || CYN, s.kind === 'rocket' ? 22 : s.kind === 'flame' ? 16 : 12);
          if (s.pierce > 0) {
            s.pierce -= 1;
            s.x += s.face * 12;
          } else G.shots.splice(i, 1);
        }
      } else if (playing() && G.deadT <= 0) {
        if (G.invuln <= 0 && shotHitsPlayer(s, p)) {
          G.shots.splice(i, 1);
          die(s.kind === 'eflame' || s.kind === 'flame' ? 'flame' : 'shot');
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

    const want = REDUCE ? 0 : (G.theme === 'snow' || isNight() ? (isNight() ? 56 : 36) : G.theme === 'silo' ? 22 : 0);
    if (flakes.length < want) {
      flakes.push({
        x: G.camX + rand(-40, VW + 40),
        y: G.camY + rand(-20, VH),
        l: rand(6, 14),
        v: G.theme === 'silo' ? rand(40, 90) : rand(70, 160),
        drift: rand(-30, 40)
      });
    }
    while (flakes.length > want) flakes.pop();
    for (i = flakes.length - 1; i >= 0; i--) {
      o = flakes[i];
      o.y += o.v * dt;
      o.x += o.drift * dt;
      if (o.y > G.camY + VH + 10) {
        o.y = G.camY - 10;
        o.x = G.camX + rand(-40, VW + 40);
      }
    }
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
        G.flankT = isNight() ? Math.max(1.2, 1.7 - G.stage * 0.12) : Math.max(3.4, 5.2 - G.stage * 0.35);
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
    } else if (G.theme === 'dock') {
      g.addColorStop(0, '#061018');
      g.addColorStop(0.5, '#0a1814');
      g.addColorStop(1, '#102018');
    } else if (G.theme === 'silo') {
      g.addColorStop(0, '#080c08');
      g.addColorStop(0.5, '#10140c');
      g.addColorStop(1, '#16180e');
    } else {
      g.addColorStop(0, '#06141c');
      g.addColorStop(0.5, '#0a1c14');
      g.addColorStop(1, '#122416');
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
      if (G.theme === 'dock') {
        ctx.fillStyle = i % 3 === 0 ? '#0a1418' : '#081018';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = rgba(CYN, 0.18);
        ctx.fillRect(x + 4 * scale, base - h, 3 * scale, h);
      } else if (G.theme === 'silo') {
        ctx.fillStyle = i % 2 ? '#10140c' : '#0c100a';
        ctx.fillRect(x, base - h, w + 8 * scale, h + 40 * scale);
        ctx.fillStyle = rgba(ORG, 0.22);
        ctx.fillRect(x + w * 0.4, base - h - 18 * scale, 6 * scale, 18 * scale);
        ctx.fillStyle = rgba(MAG, 0.18);
        ctx.fillRect(x + 6 * scale, base - h + 10 * scale, 4 * scale, 5 * scale);
      } else {
        ctx.fillStyle = i % 3 === 0 ? '#0c1a14' : '#08140e';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = hash2(i + 11) > 0.6 ? rgba(HOT, 0.28) : rgba(SNOW, 0.18);
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
      ctx.fillStyle = p.base ? '#102014' : '#142418';
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
    } else if (opt.flame) {
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.fillRect(4 * s, -20 * s, 12 * s, 5 * s);
      if (opt.muzzle) {
        ctx.fillStyle = rgba(GOLD, 0.85);
        ctx.beginPath();
        ctx.moveTo(16 * s, -22 * s);
        ctx.lineTo(28 * s, -17 * s);
        ctx.lineTo(16 * s, -13 * s);
        ctx.closePath();
        ctx.fill();
      }
    } else if (opt.rocket) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(4 * s, -20 * s, 14 * s, 4 * s);
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
    }
    ctx.restore();
  }

  function drawHound(e) {
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

  function drawNest(e) {
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
    const rgb = u.kind === 'rocket' ? GOLD : u.kind === 'flame' ? ORG : CYN;
    const ch = u.kind === 'rocket' ? 'R' : u.kind === 'flame' ? 'F' : 'S';
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 11 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.9);
    ctx.fillRect(x - 7 * s, y - 5 * s, 14 * s, 10 * s);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.font = 'bold ' + (8 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch, x, y + 3 * s);
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
    } else if (s.kind === 'flame' || s.kind === 'eflame') {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = rgba(ORG, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, 0, 10 * sc, 5 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.ellipse(s.face * 4 * sc, 0, 6 * sc, 3 * sc, 0, 0, TAU);
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
    if (flakes.length) {
      ctx.fillStyle = G.theme === 'silo' ? 'rgba(255,154,58,0.28)' : 'rgba(200,230,220,0.35)';
      for (i = 0; i < flakes.length; i++) {
        o = flakes[i];
        ctx.fillRect(sx(o.x), sy(o.y), 1.6 * scale, (G.theme === 'silo' ? 4 : 2.2) * scale);
      }
    }
  }

  function entRgb(kind) {
    if (kind === 'hopper') return MAG;
    if (kind === 'mortar') return ORG;
    if (kind === 'charger') return RED;
    if (kind === 'torch') return ORG;
    if (kind === 'hound') return BRN;
    return BRN;
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050d0a';
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
      if (e.kind === 'hound') drawHound(e);
      else if (e.kind === 'nest') drawNest(e);
      else {
        drawFigure(e.x, e.y, e.face, G.clock, entRgb(e.kind), e.kind === 'torch' ? 1.02 : 0.92, {
          run: G.clock * (e.kind === 'charger' ? 12 : e.kind === 'hopper' ? 10 : 8),
          grounded: e.grounded, squash: e.grounded ? 1 : 0.86, pose: e.kind === 'mortar' || e.kind === 'torch' ? 0.1 : 0,
          slash: 0, boss: false, beret: e.kind === 'torch' ? ORG : RED,
          flame: e.kind === 'torch'
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
        beret: HOT,
        gun: G.wep === 'scatter' && G.ammo > 0 && G.slashT <= 0,
        rocket: G.wep === 'rocket' && G.ammo > 0 && G.slashT <= 0,
        flame: G.wep === 'flame' && G.ammo > 0 && G.slashT <= 0,
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
    const jump = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (jump) keys.j = down;

    if (down && (isMove || space || jump || k === 'Enter')) e.preventDefault();
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
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('night');
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
    hold(document.getElementById('btn-jump'), function () { keys.j = true; }, function () { keys.j = false; });
    hold(document.getElementById('btn-duck'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-fire'), function () {
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
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
  if (modeRaid) {
    modeRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
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
      keys.j = false;
    }
  });

  requestAnimationFrame(frame);
})();
