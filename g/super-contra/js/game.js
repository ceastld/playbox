'use strict';

/* 超魂 — Super Contra remake. Hangar crushers, capsule S/L, HP + crash, turret boss.
   Distinct from 魂斗 (one-hit jungle), 枪星 (melee/cycle guns), 合金 (tank/POW). */

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const HP_MAX = 8;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 224;
  const AIR = 0.9;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const INVULN = 1.2;
  const HIT_IFR = 0.42;
  const DIE_T = 0.82;
  const BEST_KEY = 'playbox-super-contra-best';
  const MUTE_KEY = 'playbox-super-contra-mute';
  const OPS = 'WASD / 方向键 走跳 · 空格八向开火 · 捡 S 散弹 / L 激光 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [20, 255, 122];
  const HOT2 = [125, 255, 176];
  const WHT = [238, 246, 241];
  const LEAF = [61, 255, 122];
  const ORG = [255, 168, 64];
  const TEAL = [32, 180, 160];
  const STEEL = [90, 110, 118];

  const GUN_NAME = { rifle: '步枪', S: '散弹', L: '激光', H: '体力' };
  const WEAPONS = {
    rifle: { cd: 0.15, max: 4, spd: 560, dmg: 1, pierce: 0, spread: 1, fan: 0, life: 0.7, rgb: GOLD },
    S: { cd: 0.22, max: 15, spd: 500, dmg: 1, pierce: 0, spread: 5, fan: 0.28, life: 0.5, rgb: LEAF },
    L: { cd: 0.1, max: 4, spd: 820, dmg: 2, pierce: 4, spread: 1, fan: 0, life: 0.4, rgb: CYN }
  };

  const SCORE = {
    guard: 100, rush: 150, disk: 200, wall: 250, pod: 300,
    door: 400, gate: 800, boss: 5000, stage: 2000
  };

  const STAGES = [
    {
      name: '坞廊', theme: 'hangar', w: 2480, hp: 0,
      ground: [[0, 520], [620, 400], [1140, 400], [1660, 820]],
      plats: [
        [140, MY, 150], [400, MY, 160], [780, MY, 150],
        [1180, MY, 170], [1580, MY, 160], [1980, MY, 180], [2240, MY, 130],
        [460, HY, 120], [920, HY, 140], [1420, HY, 150], [1880, HY, 140]
      ],
      ents: [
        [260, GY, 'guard', 40, 480],
        [420, GY, 'guard', 80, 500],
        [480, MY, 'wall', 0, 0],
        [720, GY, 'rush', 640, 980],
        [980, MY, 'guard', 780, 940],
        [1080, 118, 'pod', 0, 0, 'S'],
        [1220, GY, 'wall', 0, 0],
        [1380, HY, 'disk', 1280, 1520],
        [1500, GY, 'guard', 1460, 1780],
        [1680, MY, 'rush', 1580, 1760],
        [1860, GY, 'wall', 0, 0],
        [2040, MY, 'guard', 1980, 2160],
        [2160, HY, 'disk', 1980, 2240],
        [2280, GY, 'rush', 2000, 2400]
      ],
      crush: [[360, GY, 2.15, 0], [800, GY, 2.4, 0.7], [480, MY, 2.2, 0.4], [1880, GY, 2.05, 0.35]],
      spikes: [[700, GY, 54], [1280, GY, 62]],
      doors: [[880, GY, 16, 54, 6, 'door'], [2360, GY, 22, 150, 12, 'gate']],
      drops: [[1760, HY, 'H']]
    },
    {
      name: '异道', theme: 'alien', w: 2680, hp: 0,
      ground: [[0, 480], [560, 360], [1040, 380], [1540, 340], [2000, 680]],
      plats: [
        [120, MY, 140], [380, MY, 150], [720, MY, 170],
        [1120, MY, 160], [1540, MY, 180], [1920, MY, 160], [2320, MY, 150],
        [280, HY, 120], [820, HY, 140], [1280, HY, 150],
        [1760, HY, 140], [2180, HY, 160]
      ],
      ents: [
        [220, GY, 'guard', 20, 440],
        [400, MY, 'wall', 0, 0],
        [460, HY, 'disk', 280, 560],
        [680, GY, 'rush', 560, 900],
        [900, 110, 'pod', 0, 0, 'L'],
        [1080, GY, 'wall', 0, 0],
        [1180, MY, 'guard', 1120, 1280],
        [1340, HY, 'disk', 1220, 1480],
        [1480, GY, 'rush', 1320, 1640],
        [1660, MY, 'wall', 0, 0],
        [1840, GY, 'guard', 1760, 2100],
        [1960, HY, 'disk', 1860, 2140],
        [2140, GY, 'rush', 1980, 2460],
        [2280, MY, 'guard', 2180, 2380],
        [2460, HY, 'wall', 0, 0]
      ],
      crush: [[360, GY, 2.0, 0.2], [1240, GY, 2.25, 0.9], [2100, GY, 1.95, 0.5]],
      spikes: [[640, GY, 50], [1160, GY, 58], [1680, GY, 64]],
      doors: [[780, GY, 16, 54, 7, 'door'], [2560, GY, 22, 150, 14, 'gate']],
      drops: [[1600, HY, 'S'], [2200, MY, 'H']]
    },
    {
      name: '炮巢', theme: 'nest', w: 1980, hp: 42,
      ground: [[0, 420], [520, 360], [1000, 980]],
      plats: [
        [80, MY, 130], [300, MY, 150], [620, MY, 160],
        [960, MY, 170], [1340, MY, 180], [1680, MY, 140],
        [220, HY, 120], [700, HY, 140], [1180, HY, 150], [1540, HY, 140]
      ],
      ents: [
        [200, GY, 'guard', 20, 400],
        [340, MY, 'wall', 0, 0],
        [480, GY, 'rush', 420, 720],
        [640, HY, 'disk', 560, 780],
        [820, 112, 'pod', 0, 0, 'S'],
        [980, GY, 'wall', 0, 0],
        [1120, MY, 'guard', 960, 1180],
        [1280, GY, 'rush', 1100, 1500],
        [1420, HY, 'disk', 1280, 1560],
        [1560, MY, 'wall', 0, 0]
      ],
      crush: [[560, GY, 2.1, 0.15], [1040, MY, 2.3, 0.6]],
      spikes: [[760, GY, 48]],
      doors: [],
      drops: [[1040, HY, 'L'], [1480, MY, 'H']]
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
  function spdMul(barrage, stage) {
    return (barrage ? 1.2 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
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

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 6) throw new Error('hp');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('barrage faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!WEAPONS.S || !WEAPONS.L) throw new Error('weapons');
    if (WEAPONS.S.spread < 5) throw new Error('spread');
    if (WEAPONS.L.pierce < 2) throw new Error('laser pierce');
    if (WEAPONS.rifle.spread !== 1) throw new Error('rifle');
    if (dirs8().length !== 8) throw new Error('8 dirs');
    if (BEST_KEY !== 'playbox-super-contra-best') throw new Error('best key');
    if (STAGES[2].theme !== 'nest' || STAGES[2].hp < 30) throw new Error('turret boss');
    if (!STAGES[0].crush.length || !STAGES[1].spikes.length) throw new Error('hazards');
    if (STAGES[0].doors.length < 1 || STAGES[2].doors.length !== 0) throw new Error('gates');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
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
  const btnRush = document.getElementById('btn-rush');
  const btnBarrage = document.getElementById('btn-barrage');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeRush = document.getElementById('mode-rush');
  const modeBarrage = document.getElementById('mode-barrage');
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
  const hpBar = document.getElementById('hp-bar');
  const hpWrap = document.getElementById('hp-wrap');
  const bossWrap = document.getElementById('boss-wrap');
  const bossBar = document.getElementById('boss-bar');
  const bossName = document.getElementById('boss-name');
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

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: true, u: false, fire: true };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'rush',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2480,
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    crush: [],
    spikes: [],
    doors: [],
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
    weapon: 'rifle',
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
    muzzle: 0
  };

  function isBarrage() {
    return G.kind === 'barrage';
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
      if (kind === 'L') {
        this.beep(1480, 0.07, 'sawtooth', 0.05, 420);
        this.beep(880, 0.05, 'square', 0.028, 220);
      } else if (kind === 'S') {
        this.noise(0.045, 0.04, 700);
        this.beep(620, 0.06, 'square', 0.04, 240);
      } else {
        this.beep(880, 0.045, 'square', 0.04, 360);
        this.noise(0.02, 0.02, 1800);
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
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 55);
    },
    crush() {
      this.ensure();
      this.noise(0.09, 0.06, 180);
      this.beep(90, 0.12, 'square', 0.05, 40);
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
      this.beep(240, 0.08, 'sawtooth', 0.04, 90);
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
    const b = isBarrage();
    if (modeRush) modeRush.setAttribute('aria-pressed', b ? 'false' : 'true');
    if (modeBarrage) modeBarrage.setAttribute('aria-pressed', b ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isBarrage() ? '弹幕 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isBarrage() ? '弹幕' : '突进';
      tagLabel.classList.toggle('warn', isBarrage());
      tagLabel.classList.toggle('hot', !isBarrage() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[G.weapon] || '步枪';
      gunLabel.className = 'gun'
        + (G.weapon === 'S' ? ' spread' : '')
        + (G.weapon === 'L' ? ' laser' : '');
    }
    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    if (hpWrap) hpWrap.classList.toggle('low', G.hp <= 3 && playing());
    const b = G.boss;
    const showB = !!(b && b.active && !b.dead && playing());
    if (bossWrap) bossWrap.hidden = !showB;
    if (showB && bossBar) bossBar.style.transform = 'scaleX(' + clamp(b.hp / b.max, 0, 1) + ')';
    if (showB && bossName) bossName.textContent = b.name;
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 中弹扣体，压机撞击即死', 'warn');
    else if (G.mode === 'win') setHint('连装炮拆了 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 八向开火 · 躲开压机', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('连装炮 · 打核心', 'hot');
    else setHint('走跳 · 空格八向开火 · 捡 S/L · 压机即死', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SCTR';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '弹幕' : '换模式';
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
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
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

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'wall') return 4;
    if (kind === 'pod') return 2;
    if (kind === 'disk') return 2;
    if (kind === 'rush') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b, extra) {
    const hp = hpOf(kind);
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, gun: extra || '',
      t: rand(0, 1), fire: rand(0.3, 1.1),
      grounded: kind !== 'disk' && kind !== 'pod',
      dead: false, hitN: 0,
      w: kind === 'wall' ? 18 : (kind === 'pod' ? 16 : 14),
      h: kind === 'wall' ? 16 : (kind === 'pod' ? 16 : (kind === 'disk' ? 12 : 24))
    };
  }

  function makeCrush(x, slamY, period, phase) {
    return {
      x: x, slamY: slamY, y: slamY - 132,
      top: slamY - 136, w: 38, h: 16,
      period: period, t: phase, hold: 0
    };
  }

  function makeSpike(x, y, w) {
    return { x: x, y: y, w: w, h: 10 };
  }

  function makeDoor(x, y, w, h, hp, kind) {
    return {
      id: uid++,
      x: x, y: y, w: w, h: h,
      hp: hp, max: hp, kind: kind || 'door',
      dead: false, hitN: 0
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isBarrage() ? 1.28 : 1)) | 0;
    return {
      id: uid++,
      x: spec.w - 78, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: '连装炮',
      t: 0, fire: 1.15, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 64, h: 88, name: '连装炮',
      ang: Math.PI
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
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4], e[5]));
    }
    if (isBarrage() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'pod' || e[2] === 'wall') continue;
        G.ents.push(makeEnt(e[0] + 44, e[1], e[2], e[3], e[4], e[5]));
      }
    }
    G.crush = [];
    for (i = 0; i < spec.crush.length; i++) {
      const c = spec.crush[i];
      G.crush.push(makeCrush(c[0], c[1], c[2], c[3]));
    }
    G.spikes = [];
    for (i = 0; i < spec.spikes.length; i++) {
      const s = spec.spikes[i];
      G.spikes.push(makeSpike(s[0], s[1], s[2]));
    }
    G.doors = [];
    for (i = 0; i < spec.doors.length; i++) {
      const d = spec.doors[i];
      G.doors.push(makeDoor(d[0], d[1], d[2], d[3], d[4], d[5]));
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0], y: d[1] - 20, kind: d[2], taken: false, t: 0 });
      }
    }
    G.shots = [];
    G.boss = spec.theme === 'nest' ? makeBoss(spec) : null;
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.lock = 0;
    G.dropT = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    G.muzzle = 0;
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
    const h = p.duck ? 14 : p.h;
    return { x: p.x - p.w * 0.42, y: p.y - h, w: p.w * 0.84, h: h * 0.92 };
  }

  function blockingDoor(x, y) {
    for (let i = 0; i < G.doors.length; i++) {
      const d = G.doors[i];
      if (d.dead) continue;
      if (x + 8 > d.x && x < d.x + d.w + 6 && y > d.y - d.h - 4) return d;
    }
    return null;
  }

  function getAim(p) {
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
    if (G.shots.length > 110) {
      for (let i = 0; i < G.shots.length && G.shots.length > 88; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 110);
  }

  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const wpn = WEAPONS[G.weapon] || WEAPONS.rifle;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = getAim(p);
    const ox0 = p.x + aim.dx * 16;
    const oy0 = p.y - (p.duck ? 11 : 18) + aim.dy * 6;
    const n = wpn.spread || 1;
    const fan = wpn.fan || 0;
    const base = Math.atan2(aim.dy, aim.dx);
    let i;
    for (i = 0; i < n; i++) {
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
        hit: []
      });
    }
    G.fireCd = wpn.cd;
    G.muzzle = 0.06;
    p.pose = 0.1;
    if (playing()) audio.shot(G.weapon);
    emit(G.weapon === 'S' ? 8 : 4, {
      x: ox0, y: oy0, j: 4,
      vx0: aim.dx * 40, vx1: aim.dx * 180,
      vy0: aim.dy * 80 - 40, vy1: aim.dy * 80 + 40,
      life: 0.16, r0: 1, r1: 2.2, rgb: wpn.rgb, g: 80
    });
    if (G.weapon === 'L') kick(1.1, 'hit');
    else if (G.weapon === 'S') kick(1.05, 'thump');
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
    if (kind === 'H') {
      G.hp = Math.min(HP_MAX, G.hp + 4);
      audio.ping();
      toast('体力 +4', false, true);
      kick(2.2, 'pickup');
      screenFlash(HOT, 0.22);
      syncHud();
      return;
    }
    G.weapon = kind;
    audio.ping();
    toast(GUN_NAME[kind] || kind, false, true);
    kick(2.4, 'pickup');
    screenFlash(kind === 'L' ? CYN : GOLD, 0.28);
    syncHud();
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({ x: x, y: y, kind: kind, taken: false, t: 0 });
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    giveGun(u.kind);
    juice(u.x, u.y, u.kind === 'L' ? CYN : GOLD, 0.9);
    floatText(u.x, u.y - 18, GUN_NAME[u.kind], GOLD, true);
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

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    bumpCombo();
    const base = SCORE[e.kind] || SCORE.guard;
    const sc = base * G.mult;
    addScore(sc);
    floatText(e.x, e.y - 22, '+' + sc, e.kind === 'pod' ? GOLD : HOT2, e.kind === 'pod');
    juice(e.x, e.y - 10, e.kind === 'pod' ? GOLD : HOT, e.kind === 'wall' ? 1.15 : 0.85);
    audio.hit(G.combo);
    hitStop(e.kind === 'wall' ? 0.052 : 0.036);
    if (e.kind === 'pod' && e.gun) spawnPickup(e.x, e.y, e.gun);
    if (e.kind === 'wall') boomAt(e.x, e.y - 8, 1.05, TEAL);
  }

  function hurtEnt(e, dmg) {
    if (!e || e.dead) return false;
    if (e.hitN > 0) return false;
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

  function hurtDoor(d, dmg) {
    if (!d || d.dead) return false;
    d.hp -= dmg;
    d.hitN = 0.07;
    emit(5, {
      x: d.x + d.w * 0.5, y: d.y - d.h * 0.5, j: 6,
      vx0: -90, vx1: 90, vy0: -140, vy1: -10,
      life: 0.18, r0: 1, r1: 2.4, rgb: STEEL, g: 180
    });
    hitStop(0.032);
    if (d.hp <= 0) {
      d.dead = true;
      bumpCombo();
      const sc = (SCORE[d.kind] || SCORE.door) * G.mult;
      addScore(sc);
      floatText(d.x, d.y - 30, '+' + sc, GOLD, d.kind === 'gate');
      boomAt(d.x + 8, d.y - 24, d.kind === 'gate' ? 1.6 : 1.1, GOLD);
      audio.hit(G.combo);
      if (d.kind === 'gate') {
        toast(STAGES[G.stage - 1].name + ' 打穿', false, true);
        G.lock = 0.18;
        G.clearT = 1.85;
      }
      return true;
    }
    return false;
  }

  function die(why, force) {
    if (!playing() || G.deadT > 0) return;
    if (!force && G.invuln > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.weapon = 'rifle';
    G.combo = 0;
    G.mult = 1;
    G.player.vy = -180;
    boomAt(G.player.x, G.player.y - 16, 1.35, MAG);
    audio.death();
    hitStop(0.072);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    syncHud();
  }

  function crash(why) {
    die(why, false);
  }

  function hurtPlayer(dmg, why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    G.hp -= dmg;
    G.invuln = HIT_IFR;
    G.player.squash = 0.82;
    audio.hurt();
    kick(3.2, 'hit');
    screenFlash(MAG, 0.22);
    emit(8, {
      x: G.player.x, y: G.player.y - 14, j: 8,
      vx0: -140, vx1: 140, vy0: -200, vy1: -20,
      life: 0.24, r0: 1.2, r1: 2.6, rgb: MAG, g: 220
    });
    hitStop(0.048);
    syncHud();
    if (G.hp <= 0) die('empty', true);
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.weapon = 'rifle';
    G.hp = HP_MAX;
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    toast('重生', true, false);
    syncHud();
  }

  function loseWhy() {
    if (G.why === 'fall') return '坠入井里了';
    if (G.why === 'touch') return '撞上了';
    if (G.why === 'crush') return '被压扁了';
    if (G.why === 'spike') return '踩上刺了';
    if (G.why === 'empty') return '体力打空了';
    return '中弹了';
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '被击中了', loseWhy() + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isBarrage() ? 6000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isBarrage() ? '弹幕清场' : '连装炮拆了',
      (isBarrage() ? '弹幕打穿炮巢。' : '突进打穿连装炮。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.hp = HP_MAX;
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'barrage' ? 'barrage' : 'rush';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'rifle';
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isBarrage() ? '弹幕' : STAGES[0].name, false, !isBarrage());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'rush';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'rifle';
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '超魂', '侧向跑跳，八向开火。捡散弹 / 激光。中弹扣体，撞压机、刺带或坠井即死。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('rush');
    else startGame(G.kind || 'rush');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('rush');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.fire = true;
    demo.u = (pitAhead(p.x, p.y, 1) || blockingDoor(p.x + 24, p.y)) && p.grounded;
    if (p.x > G.levelW - 280 || p.y > VH + 40) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.weapon = 'rifle';
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
    p.duck = !!(p.grounded && inD() && !inU());
    p.h = p.duck ? 14 : PH;

    const spd = WALK * (p.grounded ? (p.duck ? 0.55 : 1) : AIR);
    p.vx = (p.duck ? 0 : ax * spd);
    if (!p.duck) {
      p.x += p.vx * dt;
    }
    p.x = clamp(p.x, 16, G.levelW - 16);

    const door = blockingDoor(p.x, p.y);
    if (door && p.vx >= 0) p.x = Math.min(p.x, door.x - 8);

    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
      if (p.x > G.levelW - 110) p.x = G.levelW - 110;
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
      if (playing()) audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.028);
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
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.y > VH + 90) die('fall', true);

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded && !p.duck) p.run += dt * 10;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (fireHeld()) tryShoot();

    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (hypot(p.x - u.x, (p.y - 14) - u.y) < 20) takePickup(u);
    }

    if (G.invuln > 0) return;

    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead || e.kind === 'pod') continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        crash('touch');
        return;
      }
    }
    for (i = 0; i < G.spikes.length; i++) {
      const s = G.spikes[i];
      if (overlap(pb.x, pb.y, pb.w, pb.h, s.x, s.y - s.h, s.w, s.h + 4)) {
        crash('spike');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h * 0.9)) {
        crash('touch');
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

  function updateCrush(c, dt) {
    c.t += dt;
    const cyc = c.period;
    const u = (c.t % cyc) / cyc;
    const top = c.top;
    const bot = c.slamY;
    let ny;
    if (u < 0.38) ny = top;
    else if (u < 0.48) ny = lerp(top, bot, (u - 0.38) / 0.1);
    else if (u < 0.68) ny = bot;
    else ny = lerp(bot, top, (u - 0.68) / 0.32);
    const prev = c.y;
    c.y = ny;
    if (prev < bot - 18 && ny > bot - 12 && playing()) {
      audio.crush();
      kick(2.6, 'thump');
      emit(8, {
        x: c.x, y: bot, j: 12,
        vx0: -90, vx1: 90, vy0: -40, vy1: 10,
        life: 0.22, r0: 1.2, r1: 2.8, rgb: STEEL, g: 240
      });
    }
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    const pb = pBox();
    if (overlap(pb.x, pb.y, pb.w, pb.h, c.x - c.w * 0.5, c.y - c.h, c.w, c.h + 8)) {
      crash('crush');
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isBarrage(), G.stage);
    const p = G.player;
    if (!onScreen(e.x, e.y, 80) && e.kind !== 'pod') return;

    if (e.kind === 'pod') {
      e.x += (e.vx || -86) * dt * mul;
      e.y += Math.sin(e.t * 3.6) * 22 * dt;
      if (e.x < G.camX - 40) e.dead = true;
      return;
    }

    if (e.kind === 'disk') {
      e.x += (e.face || -1) * 50 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = HY - 22 + Math.sin(e.t * 2.6) * 18;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0) {
        e.fire = (isBarrage() ? 0.95 : 1.4) / mul;
        enemyShoot(e, 0, 1, 210, 'bomb');
        if (isBarrage()) {
          enemyShoot(e, -0.4, 1, 200, 'bomb');
          enemyShoot(e, 0.4, 1, 200, 'bomb');
        }
      }
      return;
    }

    if (e.kind === 'wall') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 380) {
        const aim = aimAtPlayer(e);
        e.fire = (isBarrage() ? 0.72 : 1.08) / mul;
        enemyShoot(e, aim.dx, aim.dy, 250, 'e');
        if (isBarrage()) {
          enemyShoot(e, aim.dx, aim.dy - 50, 230, 'e');
          enemyShoot(e, aim.dx, aim.dy + 50, 230, 'e');
        }
      }
      return;
    }

    const walk = (e.kind === 'rush' ? 96 : 48) * mul;
    if (e.kind === 'rush' && Math.abs(p.x - e.x) < 230 && playing()) {
      e.face = p.x < e.x ? -1 : 1;
    } else {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    const step = walk * (e.kind === 'rush' && Math.abs(p.x - e.x) < 230 ? 1.35 : 1) * dt;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * step;
    e.fire -= dt;
    if (e.kind === 'guard' && e.fire <= 0 && playing() && G.deadT <= 0) {
      if (Math.abs(p.x - e.x) < 300 && Math.abs(p.y - e.y) < 56) {
        e.fire = (isBarrage() ? 0.95 : 1.45) / mul;
        e.face = p.x < e.x ? -1 : 1;
        enemyShoot(e, e.face, 0, 270, 'e');
        if (isBarrage()) {
          enemyShoot(e, e.face, -0.28, 250, 'e');
          enemyShoot(e, e.face, 0.28, 250, 'e');
        }
      } else e.fire = 0.35;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.levelW - 460) {
        b.active = true;
        audio.boss();
        toast('连装炮 锁定', false, true);
        screenFlash(MAG, 0.3);
        kick(3.4, 'boom');
        syncHud();
      }
      return;
    }
    b.t += dt;
    const mul = spdMul(isBarrage(), G.stage);
    const low = b.hp / b.max < 0.45;
    const mid = b.hp / b.max < 0.7;
    b.x = G.levelW - 78;
    b.y = GY;
    const tx = p.x - b.x;
    const ty = (p.y - 18) - (b.y - 48);
    b.ang = Math.atan2(ty, tx);
    b.fire -= dt;
    if (b.fire > 0 || !playing() || G.deadT > 0) return;

    const dens = isBarrage() ? 0.78 : 1;
    if (low) {
      b.fire = (0.42 * dens) / mul;
      const n = isBarrage() ? 10 : 8;
      let i;
      for (i = 0; i < n; i++) {
        const a = b.t * 1.9 + i * TAU / n;
        spawnShot({
          x: b.x - 18, y: b.y - 46,
          vx: Math.cos(a) * 210,
          vy: Math.sin(a) * 210,
          from: 'e', kind: 'e', dmg: 1, pierce: 0,
          life: 1.7, rgb: MAG, hit: []
        });
      }
      enemyShoot(b, tx, ty, 260, 'e');
    } else if (mid) {
      b.fire = (0.58 * dens) / mul;
      const aim = b.ang;
      const fan = isBarrage() ? 5 : 3;
      let k;
      for (k = 0; k < fan; k++) {
        const a = aim + (k - (fan - 1) / 2) * 0.22;
        spawnShot({
          x: b.x - 20, y: b.y - 52,
          vx: Math.cos(a) * 250,
          vy: Math.sin(a) * 250,
          from: 'e', kind: 'e', dmg: 1, pierce: 0,
          life: 1.5, rgb: HOT2, hit: []
        });
      }
      spawnShot({
        x: b.x - 16, y: b.y - 22,
        vx: -200, vy: -40,
        from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
        life: 1.6, rgb: ORG, hit: [], grav: 480
      });
    } else {
      b.fire = (0.78 * dens) / mul;
      enemyShoot(b, tx, ty, 270, 'e');
      enemyShoot(b, tx, ty - 40, 250, 'e');
      if (isBarrage()) enemyShoot(b, tx, ty + 40, 250, 'e');
    }
  }

  function shotHits(s, x, y, w, h) {
    const r = s.kind === 'L' ? 10 : 5;
    return overlap(s.x - r, s.y - r, r * 2, r * 2, x - w * 0.5, y - h, w, h);
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'L' && playing() && s.from === 'p') {
        emit(1, {
          x: s.x, y: s.y, j: 1,
          vx0: -10, vx1: 10, vy0: -10, vy1: 10,
          life: 0.12, r0: 1, r1: 1.8, rgb: CYN, g: 0
        });
      }
      if (s.life <= 0 || !onScreen(s.x, s.y, 90)) {
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
            hurtEnt(e, s.dmg);
            hit = true;
            if (!s.pierce) break;
            s.pierce -= 1;
            if (s.pierce < 0) break;
          }
        }
        if (!hit) {
          for (j = 0; j < G.doors.length; j++) {
            const d = G.doors[j];
            if (d.dead) continue;
            if (s.hit.indexOf(d.id) >= 0) continue;
            if (overlap(s.x - 5, s.y - 5, 10, 10, d.x, d.y - d.h, d.w, d.h)) {
              s.hit.push(d.id);
              hurtDoor(d, s.dmg);
              hit = true;
              if (!s.pierce) break;
              s.pierce -= 1;
            }
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active && s.hit.indexOf(G.boss.id) < 0) {
          e = G.boss;
          if (shotHits(s, e.x - 6, e.y, e.w, e.h)) {
            s.hit.push(e.id);
            e.hp -= s.dmg;
            e.hitN = 0.07;
            audio.hit(G.combo);
            emit(6, {
              x: s.x, y: s.y, j: 6,
              vx0: -120, vx1: 120, vy0: -180, vy1: -20,
              life: 0.2, r0: 1, r1: 2.6, rgb: GOLD, g: 200
            });
            hitStop(0.042);
            hit = true;
            syncHud();
            if (e.hp <= 0) {
              e.dead = true;
              e.active = false;
              bumpCombo();
              const sc = SCORE.boss * G.mult;
              addScore(sc);
              addScore(SCORE.stage * G.stage);
              floatText(e.x, e.y - 50, '+' + sc, GOLD, true);
              boomAt(e.x, e.y - 36, 1.9, GOLD);
              juice(e.x, e.y - 24, HOT, 1.7);
              hitStop(0.08);
              toast('连装炮 击破', false, true);
              G.lock = 0.2;
              G.clearT = 2.1;
              syncHud();
            }
          }
        }
        if (hit && !s.pierce) {
          G.shots.splice(i, 1);
          continue;
        }
        if (hit && s.pierce <= 0 && s.kind === 'L') {
          G.shots.splice(i, 1);
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        const r = s.kind === 'bomb' ? 7 : 4.5;
        if (overlap(s.x - r, s.y - r, r * 2, r * 2, pb.x, pb.y, pb.w, pb.h)) {
          G.shots.splice(i, 1);
          hurtPlayer(1, 'shot');
        }
      }
    }
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

    const need = REDUCE ? 8 : 26;
    if (mist.length < need) {
      mist.push({
        x: G.camX + rand(-20, VW + 40),
        y: G.camY + rand(40, VH),
        v: rand(8, 22),
        r: rand(10, 26),
        a: rand(0.03, 0.08)
      });
    }
    for (i = mist.length - 1; i >= 0; i--) {
      o = mist[i];
      o.x += o.v * dt;
      if (o.x > G.camX + VW + 50) {
        o.x = G.camX - 30;
        o.y = G.camY + rand(40, VH);
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.36;
    if (G.boss && G.boss.active && !G.boss.dead) {
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
    for (let c = 0; c < G.crush.length; c++) updateCrush(G.crush[c], dt);
    for (let d = 0; d < G.doors.length; d++) {
      if (G.doors[d].hitN > 0) G.doors[d].hitN -= dt;
    }
    updateBoss(dt);
    updateShots(dt);
    if (playing() && G.clearT <= 0 && G.stage < 3 && G.deadT <= 0) {
      let gateLive = false;
      for (let g = 0; g < G.doors.length; g++) {
        if (G.doors[g].kind === 'gate' && !G.doors[g].dead) gateLive = true;
      }
      if (!gateLive && G.player && G.player.x > G.levelW - 90) {
        G.lock = 0.12;
        G.clearT = 1.4;
      }
    }
    updateCam(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'nest') {
      g.addColorStop(0, '#081410');
      g.addColorStop(0.5, '#0c1c14');
      g.addColorStop(1, '#141008');
    } else if (spec.theme === 'alien') {
      g.addColorStop(0, '#0a0814');
      g.addColorStop(0.5, '#0c1418');
      g.addColorStop(1, '#081810');
    } else {
      g.addColorStop(0, '#061410');
      g.addColorStop(0.5, '#081810');
      g.addColorStop(1, '#0a1c14');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.82);
    const my = sy(G.camY + 40);
    ctx.fillStyle = rgba(spec.theme === 'alien' ? MAG : CYN, 0.28);
    ctx.beginPath();
    ctx.arc(mx, my, 16 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.34;
    const base = sy(GY + 6);
    let i, x, h, w;
    for (i = -2; i < 26; i++) {
      x = sx((Math.floor((G.camX + par) / 56) + i) * 56 - par);
      h = (40 + hash2(i + 11 + G.stage * 7) * 90) * scale;
      w = (18 + hash2(i + 4) * 16) * scale;
      if (spec.theme === 'alien') {
        ctx.fillStyle = i % 2 ? '#120818' : '#0c1018';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.quadraticCurveTo(x + w * 0.5, base - h, x + w, base);
        ctx.fill();
        ctx.fillStyle = rgba(MAG, 0.22);
        ctx.fillRect(x + w * 0.4, base - h * 0.55, 3 * scale, 8 * scale);
      } else {
        ctx.fillStyle = i % 3 === 0 ? '#0c2018' : '#081610';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = rgba(HOT, 0.22 + (i % 2) * 0.12);
        ctx.fillRect(x + 4 * scale, base - h + 8 * scale, w - 8 * scale, 3 * scale);
        ctx.fillStyle = rgba(CYN, 0.16);
        ctx.fillRect(x + 5 * scale, base - h + 22 * scale, 4 * scale, 5 * scale);
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(spec.theme === 'alien' ? MAG : HOT, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPits() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 8);
    ctx.fillStyle = rgba(CYN, 0.08);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    let x, covered;
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = false;
      for (let i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered) continue;
      ctx.fillStyle = rgba(MAG, 0.18 + Math.sin(x * 0.12 + G.clock * 4) * 0.06);
      ctx.fillRect(sx(x), sy(GY + 2), 14 * scale, 10 * scale);
    }
  }

  function drawPlats() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      const h = p.h * scale;
      ctx.fillStyle = p.base
        ? (spec.theme === 'alien' ? '#14101c' : '#102018')
        : '#14241c';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? HOT : CYN, 0.82);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.18);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.2) : rgba(CYN, 0.14);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 5 * scale);
        }
      }
    }
  }

  function drawCrush(c) {
    const x = sx(c.x);
    const y = sy(c.y);
    const top = sy(c.top - 20);
    ctx.strokeStyle = rgba(STEEL, 0.7);
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, y - c.h * scale);
    ctx.stroke();
    const warn = ((c.t % c.period) / c.period);
    const slamming = warn > 0.34 && warn < 0.5;
    ctx.fillStyle = slamming ? rgba(MAG, 0.9) : rgba(HOT, 0.85);
    ctx.fillRect(x - c.w * 0.5 * scale, y - c.h * scale, c.w * scale, c.h * scale);
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.fillRect(x - c.w * 0.5 * scale, y - c.h * scale, c.w * scale, 3 * scale);
    if (slamming) {
      ctx.fillStyle = rgba(MAG, 0.18);
      ctx.fillRect(x - c.w * 0.5 * scale, y, c.w * scale, (c.slamY - c.y) * scale);
    }
  }

  function drawSpike(s) {
    const n = Math.max(2, (s.w / 10) | 0);
    for (let i = 0; i < n; i++) {
      const x = sx(s.x + (i + 0.5) * (s.w / n));
      const y = sy(s.y);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.moveTo(x - 4 * scale, y);
      ctx.lineTo(x, y - 11 * scale);
      ctx.lineTo(x + 4 * scale, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawDoor(d) {
    if (d.dead) return;
    const flash = d.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    const x = sx(d.x);
    const y = sy(d.y);
    const w = d.w * scale;
    const h = d.h * scale;
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : (d.kind === 'gate' ? '#1a2820' : '#16241c');
    ctx.fillRect(x, y - h, w, h);
    ctx.fillStyle = rgba(d.kind === 'gate' ? GOLD : HOT, 0.8);
    ctx.fillRect(x, y - h, w, 3 * scale);
    const cracks = 1 - clamp(d.hp / d.max, 0, 1);
    ctx.fillStyle = rgba(MAG, 0.35 + cracks * 0.4);
    ctx.fillRect(x + 4 * scale, y - h * 0.7, w - 8 * scale, 4 * scale);
    ctx.fillRect(x + 3 * scale, y - h * 0.4, w - 6 * scale, 3 * scale);
    if (d.kind === 'gate') {
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('闸', x + w * 0.5, y - h * 0.5);
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.save();
    ctx.translate(x, y);
    const a = Math.atan2(s.vy, s.vx);
    ctx.rotate(a);
    if (s.kind === 'L') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.fillRect(-2 * scale, -2.2 * scale, 30 * scale, 4.4 * scale);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(4 * scale, -1 * scale, 20 * scale, 2 * scale);
    } else if (s.kind === 'bomb') {
      ctx.fillStyle = rgba(s.rgb || ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(-1 * scale, -1 * scale, 2 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-3.5 * scale, -1.6 * scale, 9 * scale, 3.2 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(1 * scale, -0.8 * scale, 4 * scale, 1.6 * scale);
    }
    ctx.restore();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 4 + u.t) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    const rgb = u.kind === 'L' ? CYN : u.kind === 'H' ? HOT : LEAF;
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-7 * scale, -7 * scale, 14 * scale, 14 * scale);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(-7 * scale, -7 * scale, 14 * scale, 14 * scale);
    ctx.restore();
    ctx.fillStyle = '#04120c';
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.kind, x, y + 0.5 * scale);
  }

  function drawCommando(p, rgb, opt) {
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
    ctx.strokeStyle = rgba(TEAL, 0.95);
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
    ctx.fillStyle = rgba(CYN, 0.4);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, 2 * s);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 12) * s, 5.4 * s, 5.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-5.4 * s, -(bodyH + 14) * s, 10.8 * s, 2.2 * s);
    ctx.fillStyle = '#04120c';
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
    if (e.kind === 'pod') {
      ctx.save();
      ctx.translate(x, y - 6 * scale);
      ctx.rotate(G.clock * 1.4);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * TAU / 6;
        const px = Math.cos(a) * 10 * scale;
        const py = Math.sin(a) * 10 * scale;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#04120c';
      ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-G.clock * 1.4);
      ctx.fillText(e.gun || 'S', 0, 1);
      ctx.restore();
      return;
    }
    if (e.kind === 'wall') {
      ctx.fillStyle = '#1a2824';
      ctx.fillRect(x - 11 * scale, y - 16 * scale, 22 * scale, 16 * scale);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x - 11 * scale, y - 18 * scale, 22 * scale, 2.2 * scale);
      ctx.fillStyle = '#6a8080';
      const a = Math.atan2((G.player.y - 16) - (e.y - 10), G.player.x - e.x);
      ctx.save();
      ctx.translate(x, y - 10 * scale);
      ctx.rotate(a);
      ctx.fillRect(0, -2 * scale, 16 * scale, 4 * scale);
      ctx.restore();
      return;
    }
    if (e.kind === 'disk') {
      ctx.fillStyle = rgba(MAG, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * scale, 11 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.75);
      ctx.beginPath();
      ctx.arc(x, y - 8 * scale, 4 * scale, 0, TAU);
      ctx.fill();
      return;
    }
    const rgb = e.kind === 'rush' ? MAG : STEEL;
    drawCommando(e, rgb, {
      run: e.t * 8, grounded: e.grounded, squash: 1,
      duck: false, aim: { dx: e.face, dy: 0 }, size: 0.92
    });
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active && G.mode !== 'title') {
      if (b.x < G.camX - 20 || b.x > G.camX + VW + 40) return;
    }
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#14241c';
    ctx.fillRect(x - 36 * scale, y - 92 * scale, 72 * scale, 92 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x - 36 * scale, y - 96 * scale, 72 * scale, 4 * scale);
    ctx.fillStyle = rgba(CYN, 0.25);
    ctx.fillRect(x - 28 * scale, y - 80 * scale, 20 * scale, 14 * scale);
    ctx.fillRect(x - 28 * scale, y - 52 * scale, 20 * scale, 14 * scale);
    ctx.fillRect(x - 28 * scale, y - 24 * scale, 20 * scale, 14 * scale);
    ctx.fillStyle = rgba(MAG, 0.85 + Math.sin(G.clock * 7) * 0.12);
    ctx.beginPath();
    ctx.arc(x - 4 * scale, y - 48 * scale, 10 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(x - 6 * scale, y - 50 * scale, 4 * scale, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(x - 8 * scale, y - 48 * scale);
    ctx.rotate(b.ang || Math.PI);
    ctx.fillStyle = '#8aa0a0';
    ctx.fillRect(0, -4 * scale, 34 * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(26 * scale, -5 * scale, 10 * scale, 10 * scale);
    ctx.restore();
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
    ctx.fillStyle = '#04120c';
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
    drawPits();
    drawPlats();

    let i;
    for (i = 0; i < G.spikes.length; i++) drawSpike(G.spikes[i]);
    for (i = 0; i < G.crush.length; i++) drawCrush(G.crush[i]);
    for (i = 0; i < G.doors.length; i++) drawDoor(G.doors[i]);
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) {
      drawCommando(G.player, HOT, {
        run: G.player.run,
        grounded: G.player.grounded,
        squash: G.player.squash,
        duck: G.player.duck,
        aim: getAim(G.player),
        muzzle: G.muzzle > 0,
        blink: G.invuln > 0 && G.mode === 'play'
      });
    }

    drawFx();

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
      startGame('rush');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('barrage');
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

  if (btnRush) {
    btnRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
    });
  }
  if (btnBarrage) {
    btnBarrage.addEventListener('click', function () {
      audio.ensure();
      startGame('barrage');
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
      if (G.mode === 'win') startGame('barrage');
      else goTitle();
    });
  }
  if (modeRush) {
    modeRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
    });
  }
  if (modeBarrage) {
    modeBarrage.addEventListener('click', function () {
      audio.ensure();
      startGame('barrage');
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
