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
  const WALK = 150;
  const JUMP_V = 424;
  const GRAV = 1120;
  const MAX_FALL = 540;
  const COYOTE = 0.07;
  const BUFFER = 0.11;
  const PW = 14;
  const PH = 26;
  const HP_CUT = 5;
  const HP_TIDE = 3;
  const FIRE_CD = 0.12;
  const SHOT_SPD = 390;
  const CHARGE_MIN = 0.18;
  const CHARGE_MAX = 0.72;
  const INVULN = 1.18;
  const DIE_T = 0.86;
  const BEST_KEY = 'playbox-psycho-soldier-best';
  const MUTE_KEY = 'playbox-psycho-soldier-mute';
  const OPS = '方向键 / WASD 走 · ↑ 跳 · 空格放念弹 · Shift/Z 蓄力 · R 重开 · M 静音';

  const MAG = [255, 46, 200];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 74, 216];
  const HOT2 = [255, 138, 232];
  const WHT = [248, 232, 244];
  const SKIN = [232, 176, 160];
  const HAIR = [255, 74, 216];
  const UNIF = [240, 232, 244];
  const STEEL = [80, 48, 96];
  const NIGHT = [40, 16, 48];
  const ORG = [255, 110, 64];
  const VIO = [168, 72, 220];

  const SCORE = {
    grunt: 100, drone: 120, turret: 150, beetle: 160, mech: 250,
    boss: 4000, stage: 1500, psi: 400, star: 80, shot: 40
  };

  const STAGES = [
    {
      name: '霓城', boss: '巡卫机', w: 2100, hp: 18, theme: 'city',
      ground: [[0, 500], [580, 340], [1020, 360], [1500, 600]],
      plats: [
        [220, MY, 150], [640, MY, 160], [940, MY, 160], [1360, MY, 180], [1720, MY, 150],
        [300, HY, 110], [800, HY, 120], [1480, HY, 130]
      ],
      drops: [
        [180, GY, 'star'], [300, MY, 'heart'], [760, GY, 'psi'],
        [1440, MY, 'star'], [1720, GY, 'heart']
      ],
      ents: [
        [260, GY, 'grunt', 40, 490],
        [420, GY, 'turret', 80, 490],
        [300, MY, 'drone', 220, 370],
        [720, GY, 'grunt', 590, 910],
        [840, GY, 'beetle', 590, 910],
        [880, HY, 'drone', 800, 920],
        [1180, GY, 'grunt', 1030, 1370],
        [1280, GY, 'mech', 1030, 1370],
        [1400, MY, 'drone', 1360, 1530],
        [1720, GY, 'grunt', 1510, 2080],
        [1860, GY, 'turret', 1510, 2080],
        [1780, MY, 'drone', 1720, 1860]
      ]
    },
    {
      name: '晶窟', boss: '钻岩机', w: 2420, hp: 24, theme: 'cave',
      ground: [[0, 430], [530, 280], [910, 330], [1360, 340], [1840, 580]],
      plats: [
        [140, MY, 150], [400, MY, 160], [700, MY, 170], [880, MY, 150],
        [1220, MY, 170], [1520, MY, 180], [1700, MY, 180], [2060, MY, 160],
        [220, HY, 120], [640, HY, 130], [1280, HY, 140], [1760, HY, 140]
      ],
      drops: [
        [120, GY, 'heart'], [280, HY, 'psi'], [760, MY, 'star'],
        [1180, GY, 'heart'], [1800, HY, 'psi'], [2180, MY, 'heart']
      ],
      ents: [
        [220, GY, 'grunt', 20, 420],
        [240, MY, 'drone', 140, 280],
        [280, HY, 'drone', 220, 340],
        [640, GY, 'mech', 540, 800],
        [760, GY, 'beetle', 540, 800],
        [820, MY, 'drone', 700, 870],
        [1080, GY, 'grunt', 920, 1230],
        [1320, HY, 'drone', 1280, 1420],
        [1480, GY, 'turret', 1370, 1690],
        [1560, MY, 'drone', 1520, 1690],
        [1820, HY, 'drone', 1760, 1900],
        [1960, GY, 'mech', 1850, 2400],
        [2100, GY, 'grunt', 1850, 2400],
        [2120, MY, 'drone', 2060, 2220]
      ]
    },
    {
      name: '祭坛', boss: '巨神机', w: 2700, hp: 32, theme: 'altar',
      ground: [[0, 410], [510, 280], [910, 310], [1360, 300], [1800, 340], [2320, 380]],
      plats: [
        [120, MY, 150], [360, MY, 160], [660, MY, 170], [860, MY, 170],
        [1100, MY, 170], [1280, MY, 180], [1520, MY, 180], [1680, MY, 180],
        [1980, MY, 170], [2180, MY, 180], [2480, MY, 150],
        [220, HY, 130], [600, HY, 140], [1120, HY, 150], [1560, HY, 140],
        [2000, HY, 150], [2440, HY, 140]
      ],
      drops: [
        [160, GY, 'heart'], [240, HY, 'psi'], [780, MY, 'star'],
        [1220, HY, 'heart'], [1880, GY, 'psi'], [2220, MY, 'heart'], [2540, GY, 'star']
      ],
      ents: [
        [240, GY, 'grunt', 20, 400],
        [200, MY, 'drone', 120, 260],
        [280, HY, 'drone', 220, 350],
        [620, GY, 'mech', 520, 780],
        [740, GY, 'beetle', 520, 780],
        [820, MY, 'drone', 660, 830],
        [1080, GY, 'grunt', 920, 1210],
        [1160, HY, 'drone', 1120, 1270],
        [1180, GY, 'turret', 920, 1210],
        [1380, MY, 'mech', 1280, 1450],
        [1540, GY, 'grunt', 1370, 1650],
        [1620, HY, 'drone', 1560, 1700],
        [1980, GY, 'beetle', 1810, 2130],
        [2060, MY, 'drone', 1980, 2150],
        [2440, GY, 'mech', 2330, 2680],
        [2480, HY, 'drone', 2440, 2580],
        [2560, GY, 'turret', 2330, 2680]
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
  function spdMul(tide, stage) {
    return (tide ? 1.28 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
  }
  function walkMul(tide) {
    return tide ? 1.12 : 1;
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
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('tide faster');
    if (walkMul(true) <= walkMul(false)) throw new Error('tide walk');
    if (HP_TIDE >= HP_CUT) throw new Error('tide hp');
    if (CHARGE_MAX <= CHARGE_MIN) throw new Error('charge');
    if (SHOT_SPD < 280) throw new Error('shot slow');
    if (BEST_KEY !== 'playbox-psycho-soldier-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[0].boss !== '巡卫机' || STAGES[1].boss !== '钻岩机' || STAGES[2].boss !== '巨神机') {
      throw new Error('mech bosses');
    }
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length || !s.plats.length) throw new Error('stage ' + s.name);
    }
    const jumpD = WALK * (2 * JUMP_V / GRAV);
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      let g0, gap, covered, p, k;
      for (k = 0; k < s.ground.length - 1; k++) {
        g0 = s.ground[k];
        gap = s.ground[k + 1][0] - (g0[0] + g0[1]);
        if (gap <= 0) throw new Error('overlap ground ' + s.name);
        if (gap <= jumpD * 0.9) continue;
        covered = false;
        for (p = 0; p < s.plats.length; p++) {
          const pl = s.plats[p];
          if (pl[1] !== MY) continue;
          if (pl[0] + pl[2] > g0[0] + g0[1] - 12 && pl[0] < s.ground[k + 1][0] + 12) {
            covered = true;
          }
        }
        if (!covered) throw new Error('pit ' + gap + ' in ' + s.name);
      }
      let e, ok, q;
      for (k = 0; k < s.ents.length; k++) {
        e = s.ents[k];
        if (e[2] === 'drone') continue;
        ok = false;
        if (e[1] === GY) {
          for (q = 0; q < s.ground.length; q++) {
            g0 = s.ground[q];
            if (e[0] >= g0[0] + 8 && e[0] <= g0[0] + g0[1] - 8) ok = true;
          }
        } else {
          for (q = 0; q < s.plats.length; q++) {
            p = s.plats[q];
            if (p[1] === e[1] && e[0] >= p[0] + 6 && e[0] <= p[0] + p[2] - 6) ok = true;
          }
        }
        if (!ok) throw new Error('float ' + e[2] + ' at ' + e[0] + ' ' + s.name);
      }
      for (k = 0; k < s.drops.length; k++) {
        e = s.drops[k];
        ok = false;
        if (e[1] === GY) {
          for (q = 0; q < s.ground.length; q++) {
            g0 = s.ground[q];
            if (e[0] >= g0[0] + 8 && e[0] <= g0[0] + g0[1] - 8) ok = true;
          }
        } else {
          for (q = 0; q < s.plats.length; q++) {
            p = s.plats[q];
            if (p[1] === e[1] && e[0] >= p[0] + 6 && e[0] <= p[0] + p[2] - 6) ok = true;
          }
        }
        if (!ok) throw new Error('drop ' + e[2] + ' at ' + e[0] + ' ' + s.name);
      }
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
  const btnCutStart = document.getElementById('btn-cut-start');
  const btnTideStart = document.getElementById('btn-tide-start');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeCut = document.getElementById('mode-cut');
  const modeTide = document.getElementById('mode-tide');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const hpBox = document.getElementById('hp-box');
  const hpEl = document.getElementById('hp');
  const hpFill = document.getElementById('hp-fill');
  const chargeBox = document.getElementById('charge-box');
  const chargeEl = document.getElementById('charge');
  const chargeFill = document.getElementById('charge-fill');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
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

  const keys = { l: false, r: false, u: false, d: false, fire: false, charge: false };
  const demo = { l: false, r: true, u: false, d: false, fire: false, charge: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'cut',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2100,
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_CUT,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    checkX: 70,
    checkY: GY,
    jumpBuf: 0,
    deadT: 0,
    invuln: 0,
    knockT: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    lock: 0,
    fireCd: 0,
    chargeT: 0,
    chargeFull: false,
    pose: 0,
    why: ''
  };

  function isTide() {
    return G.kind === 'tide';
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'play' || G.mode === 'title';
  }
  function maxHp() {
    return isTide() ? HP_TIDE : HP_CUT;
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
  function fireHeld() {
    return G.mode === 'title' ? demo.fire : keys.fire;
  }
  function chargeHeld() {
    return G.mode === 'title' ? demo.charge : keys.charge;
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
      this.beep(320, 0.07, 'sine', 0.036, 720);
    },
    land() {
      this.ensure();
      this.noise(0.045, 0.026, 380);
      this.beep(128, 0.05, 'triangle', 0.022, 64);
    },
    shot() {
      this.ensure();
      this.beep(880, 0.05, 'sine', 0.04, 1480);
      this.beep(1320, 0.07, 'triangle', 0.028, 620);
    },
    chargeHum() {
      this.ensure();
      this.beep(220, 0.12, 'sine', 0.03, 440);
      this.beep(440, 0.16, 'triangle', 0.024, 880);
    },
    charged() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.036, 1175);
      this.beep(1046, 0.16, 'sine', 0.03, 1568);
    },
    blast() {
      this.ensure();
      this.noise(0.1, 0.055, 420);
      this.beep(240, 0.14, 'sawtooth', 0.05, 80);
      this.beep(980, 0.1, 'sine', 0.04, 420);
    },
    crack() {
      this.ensure();
      this.noise(0.035, 0.038, 1900);
      this.beep(980, 0.05, 'triangle', 0.034, 280);
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'sine', 0.048, 990);
      this.beep(990, 0.1, 'triangle', 0.04, 1320);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.04, 1400);
      this.beep(680 * lift, 0.07, 'sine', 0.046, 1180 * lift);
      this.beep(1400 * lift, 0.05, 'triangle', 0.026, 480);
    },
    hurt() {
      this.ensure();
      this.noise(0.1, 0.055, 380);
      this.beep(300, 0.12, 'sawtooth', 0.05, 86);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(170, 0.16, 'sawtooth', 0.05, 52);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(260, 0.2, 'sawtooth', 0.05, 68);
      this.beep(130, 0.32, 'sine', 0.045, 40);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.18, 'sawtooth', 0.05, 86);
      this.beep(100, 0.3, 'square', 0.04, 60);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(190, 0.18, 'sawtooth', 0.04, 76);
      this.beep(110, 0.3, 'sine', 0.05, 42);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 784);
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
    const t = isTide();
    if (modeCut) modeCut.setAttribute('aria-pressed', t ? 'false' : 'true');
    if (modeTide) modeTide.setAttribute('aria-pressed', t ? 'true' : 'false');
  }

  function syncChargeHud() {
    const pct = clamp(G.chargeT / CHARGE_MAX, 0, 1);
    if (chargeFill) chargeFill.style.transform = 'scaleX(' + pct + ')';
    if (chargeEl) chargeEl.textContent = pct >= 1 ? '满' : pct > 0.02 ? '蓄' : '—';
    if (chargeBox) chargeBox.classList.toggle('full', pct >= 1);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (hpEl) hpEl.textContent = String(Math.max(0, G.hp));
    if (hpFill) hpFill.style.transform = 'scaleX(' + clamp(G.hp / maxHp(), 0, 1) + ')';
    syncChargeHud();
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isTide() ? '超能 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isTide() ? '超能' : '念击';
      tagLabel.classList.toggle('warn', isTide());
      tagLabel.classList.toggle('hot', !isTide() && G.stage >= 3);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格念弹 · Shift 蓄力放大招', 'warn');
    else if (G.mode === 'win') setHint('机甲已灭 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · ↑跳 · 空格放 · Shift 蓄', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('机甲 · ' + spec.boss, 'hot');
    else setHint('走跳过崖 · 空格念弹 · Shift 蓄力放大招', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'PSYC';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '超能' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'charge');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'charge');
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

  function landDust(x, y, power) {
    const p = power || 1;
    emit(6 + (p * 5) | 0, {
      x: x, y: y, j: 10,
      vx0: -90 * p, vx1: 90 * p, vy0: -50, vy1: 16,
      life: 0.22 + p * 0.08, r0: 1.2, r1: 3.2, rgb: HOT2, g: 260
    });
    emit(4, {
      x: x, y: y - 2, j: 8,
      vx0: -40, vx1: 40, vy0: -16, vy1: 8,
      life: 0.28, r0: 1.6, r1: 3.6, rgb: NIGHT, g: 80
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
      squash: 1, run: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'mech') return 3;
    if (kind === 'turret' || kind === 'beetle') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'drone';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y,
      t: rand(0, 2), fire: rand(0.4, 1.2),
      grounded: !fly, dead: false, hitN: 0,
      w: kind === 'mech' ? 20 : kind === 'turret' ? 16 : kind === 'beetle' ? 16 : kind === 'drone' ? 16 : 12,
      h: kind === 'mech' ? 28 : kind === 'turret' ? 18 : kind === 'beetle' ? 14 : kind === 'drone' ? 12 : 20
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isTide() ? 1.18 : 1)) | 0;
    const fly = spec.boss === '钻岩机';
    return {
      id: uid++,
      x: spec.w - 150, y: fly ? HY + 28 : GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: !fly, dead: false, active: false,
      hitN: 0, w: spec.boss === '巨神机' ? 48 : 40, h: spec.boss === '巨神机' ? 56 : fly ? 36 : 50,
      base: fly ? HY + 28 : GY
    };
  }

  function seedMist() {
    mist.length = 0;
    let i;
    for (i = 0; i < 16; i++) {
      mist.push({
        x: rand(0, G.levelW),
        y: rand(80, GY - 20),
        r: rand(10, 28),
        a: rand(0.03, 0.09),
        vx: rand(6, 18)
      });
    }
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
    if (isTide() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'mech') continue;
        G.ents.push(makeEnt(e[0] + 36, e[1], e[2] === 'turret' ? 'grunt' : e[2], e[3], e[4]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        spawnPickup(d[0], d[1] - 16, d[2], true);
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.camX = 0;
    G.camY = 0;
    G.knockT = 0;
    G.clearT = 0;
    G.lock = 0;
    G.fireCd = 0;
    G.chargeT = 0;
    G.chargeFull = false;
    G.pose = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    seedMist();
    G.player = makePlayer(70, GY);
  }

  function platUnder(x, y, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x >= p.x + 2 && x <= p.x + p.w - 2 && y <= p.y + 10 && y >= p.y - 18) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    return !!platUnder(x, y, null);
  }

  function landOn(x, y0, y1, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (y0 <= p.y + 2 && y1 >= p.y - 1) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function pitAhead(x, y, dir) {
    return !standAt(x + dir * 28, y);
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.45, y: p.y - p.h, w: p.w * 0.9, h: p.h };
  }

  function spawnPickup(x, y, kind, rest) {
    G.pickups.push({
      x: x, y: y, kind: kind, taken: false, t: 0,
      vy: rest ? 0 : -90, life: rest ? 99 : 8, rest: !!rest
    });
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    audio.ping();
    kick(2.2, 'pickup');
    screenFlash(u.kind === 'psi' ? CYN : GOLD, 0.22);
    popSpark(u.x, u.y, u.kind === 'psi' ? CYN : GOLD, 16);
    if (u.kind === 'heart') {
      G.hp = Math.min(maxHp(), G.hp + 1);
      toast('生命 +1', false, true);
      floatText(u.x, u.y - 8, '+1', MAG, false);
    } else if (u.kind === 'psi') {
      G.chargeT = CHARGE_MAX;
      G.chargeFull = true;
      audio.charged();
      toast('念力全开', false, true);
      addScore(SCORE.psi * G.mult);
      kick(2.8, 'charge');
      screenFlash(CYN, 0.36);
    } else {
      addScore(SCORE.star * G.mult);
      floatText(u.x, u.y - 8, String(SCORE.star * G.mult), GOLD, false);
    }
    emit(10, {
      x: u.x, y: u.y, j: 8,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.32, r0: 1.2, r1: 3, rgb: u.kind === 'psi' ? CYN : GOLD
    });
    syncHud();
  }

  function maybeDrop(e) {
    if (!playing()) return;
    const r = Math.random();
    const tank = e.kind === 'mech' || e.kind === 'turret';
    if (tank && r < 0.2) spawnPickup(e.x, e.y - 12, 'psi', false);
    else if (r < (tank ? 0.4 : 0.16)) spawnPickup(e.x, e.y - 12, 'heart', false);
    else if (r < 0.5) spawnPickup(e.x, e.y - 12, 'star', false);
  }

  function spawnShot(s) {
    s.id = uid++;
    G.shots.push(s);
    capArr(G.shots, 90);
  }

  function firePsi() {
    if (G.knockT > 0 || G.deadT > 0 || G.lock > 0) return;
    const p = G.player;
    const face = p.face;
    spawnShot({
      x: p.x + face * 12,
      y: p.y - 14,
      vx: face * SHOT_SPD,
      vy: 0,
      from: 'p',
      kind: 'psi',
      dmg: 1,
      pierce: 0,
      rad: 5,
      life: 0.72,
      rgb: MAG,
      grav: 0,
      spin: 0,
      dead: false,
      hit: {}
    });
    G.pose = 0.12;
    G.fireCd = FIRE_CD;
    audio.shot();
    emit(5, {
      x: p.x + face * 14, y: p.y - 14, j: 4,
      vx0: face * 40, vx1: face * 180, vy0: -50, vy1: 40,
      life: 0.14, r0: 1, r1: 2.2, rgb: MAG, g: 20
    });
    hitStop(0.018);
  }

  function fireCharge(full) {
    if (G.knockT > 0 || G.deadT > 0 || G.lock > 0) return;
    const p = G.player;
    const face = p.face;
    spawnShot({
      x: p.x + face * 14,
      y: p.y - 14,
      vx: face * (full ? 300 : 340),
      vy: 0,
      from: 'p',
      kind: full ? 'wave' : 'orb',
      dmg: full ? 3 : 2,
      pierce: full ? 99 : 1,
      rad: full ? 16 : 9,
      life: full ? 0.62 : 0.7,
      rgb: full ? CYN : HOT,
      grav: 0,
      spin: 0,
      dead: false,
      hit: {}
    });
    G.pose = 0.22;
    G.fireCd = 0.18;
    audio.blast();
    juice(p.x + face * 16, p.y - 14, full ? CYN : MAG, full ? 1.15 : 0.7);
    hitStop(full ? 0.055 : 0.032);
    kick(full ? 3.6 : 2.4, full ? 'charge' : 'hit');
    if (full && playing()) toast('念力爆发', false, true);
  }

  function hitEnemy(e, dmg) {
    if (e.dead) return;
    if (!playing()) {
      popSpark(e.x, e.y - e.h * 0.5, CYN, 10);
      return;
    }
    e.hp -= dmg;
    e.hitN = 0.09;
    const cx = e.x;
    const cy = e.y - e.h * 0.5;
    const tank = e.max > 1;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const sc = (SCORE[e.kind] || 100) * G.mult;
      addScore(sc);
      floatText(cx, cy, String(sc), GOLD, tank);
      audio.hit(G.combo);
      juice(cx, cy, tank ? HOT : CYN, tank ? 1.05 : 0.72);
      hitStop(tank ? 0.062 : 0.048);
      maybeDrop(e);
    } else {
      audio.crack();
      emit(7, {
        x: cx, y: cy, j: 6,
        vx0: -140, vx1: 140, vy0: -200, vy1: -10,
        life: 0.22, r0: 1, r1: 2.6, rgb: CYN
      });
      popSpark(cx, cy, GOLD, 12);
      hitStop(0.036);
      kick(2.2);
    }
  }

  function hitBoss(dmg) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.1;
    audio.hit(G.combo);
    juice(b.x, b.y - 20, MAG, 1.08);
    hitStop(0.068);
    kick(3.4, 'boom');
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      bumpCombo();
      addScore(SCORE.boss * G.mult);
      addScore(SCORE.stage * G.stage);
      floatText(b.x, b.y - 30, String(SCORE.boss * G.mult), GOLD, true);
      audio.boom();
      juice(b.x, b.y - 18, GOLD, 1.7);
      toast(b.name + ' 解体', false, true);
      G.lock = 0.2;
      G.clearT = 1.65;
      G.chargeT = 0;
      G.chargeFull = false;
    }
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'boss' ? '被机甲击倒了' : '生命耗尽了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 连击最高 ×' + G.maxCombo + ' · R 重开');
    syncHud();
  }

  function goWin() {
    if (!isTide()) {
      G.score += 8000;
      saveBest();
      if (scoreEl) scoreEl.textContent = String(G.score);
    }
    G.mode = 'win';
    audio.win();
    kick(5, 'win-flash');
    const title = isTide() ? '超能得手' : '念已通';
    showOverlay('win', title, '分数 ' + G.score + ' · 连击最高 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    audio.stage();
    toast(STAGES[G.stage].name, false, true);
    const keep = { hp: G.hp, score: G.score, lives: G.lives };
    loadStage(G.stage + 1, false);
    G.hp = keep.hp;
    G.score = keep.score;
    G.lives = keep.lives;
    G.invuln = 1.05;
    syncHud();
  }

  function respawn() {
    G.deadT = 0;
    G.hp = maxHp();
    G.invuln = INVULN;
    G.knockT = 0;
    G.chargeT = 0;
    G.chargeFull = false;
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.squash = 0.86;
    syncHud();
  }

  function die(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why;
    G.lives -= 1;
    G.deadT = DIE_T;
    G.combo = 0;
    G.mult = 1;
    G.chargeT = 0;
    G.chargeFull = false;
    G.player.vy = -80;
    audio.death();
    kick(6.5, 'die');
    screenFlash(MAG, 0.55);
    juice(G.player.x, G.player.y - 12, MAG, 1.2);
    toast(why === 'fall' ? '坠入深渊' : '被击倒', true, false);
    syncHud();
  }

  function hurt(fromX, dmg, why) {
    if (G.invuln > 0 || G.deadT > 0 || !playing()) return;
    G.hp -= dmg;
    G.combo = 0;
    G.mult = 1;
    G.chargeT = 0;
    G.chargeFull = false;
    audio.hurt();
    kick(5, 'die');
    screenFlash(MAG, 0.48);
    hitStop(0.055);
    const p = G.player;
    p.vx = (p.x < fromX ? -1 : 1) * 160;
    p.vy = -180;
    p.grounded = false;
    G.knockT = 0.22;
    if (hpBox) {
      hpBox.classList.remove('hurt');
      void hpBox.offsetWidth;
      hpBox.classList.add('hurt');
    }
    juice(p.x, p.y - 12, MAG, 0.7);
    if (G.hp <= 0) die(why);
    else {
      G.invuln = INVULN;
      syncHud();
    }
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.kind = kind === 'tide' ? 'tide' : 'cut';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = maxHp();
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.invuln = 0.55;
    G.deadT = 0;
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'cut';
    G.lives = LIVES;
    G.hp = HP_CUT;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.invuln = 99;
    G.deadT = 0;
    loadStage(1, true);
    showOverlay('title', '超女', '往右念击。空格放念弹，按住 Shift / Z 蓄力放大招。短关后机甲现身。生命打空丢一条命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('cut');
    else startGame(G.kind || 'cut');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('cut');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = false;
    demo.d = false;
    demo.fire = false;
    demo.charge = false;
    if (p.grounded && pitAhead(p.x, p.y, 1)) demo.u = true;
    const beat = ((G.clock * 0.7) | 0) % 6;
    if (beat === 3 || beat === 4) demo.charge = true;
    else if (((G.clock * 2.4) | 0) % 3 === 0) demo.fire = true;
    if (p.x > 760) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.shots = [];
      G.chargeT = 0;
      G.chargeFull = false;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.45;
      p.squash = 1.16;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.lock > 0) return;

    if (inU()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.pose > 0) G.pose -= dt;

    if (G.knockT > 0) {
      G.knockT -= dt;
      p.x += p.vx * dt;
      p.x = clamp(p.x, 16, G.levelW - 16);
      p.vy += GRAV * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      const y0k = p.y;
      let y1k = p.y + p.vy * dt;
      p.grounded = false;
      if (p.vy >= 0) {
        const plat = landOn(p.x, y0k, y1k, null);
        if (plat) {
          y1k = plat.y;
          p.vy = 0;
          p.grounded = true;
          p.vx *= 0.55;
        }
      }
      p.y = y1k;
      if (p.y > VH + 90) die('fall');
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
      return;
    }

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    const spd = WALK * walkMul(isTide());
    if (ax) p.face = ax;
    if (p.grounded) {
      p.vx = ax * spd;
    } else if (ax) {
      p.vx = lerp(p.vx, ax * spd * 0.92, 1 - Math.pow(0.08, dt));
    }
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    const canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.76;
      if (ax) {
        p.face = ax;
        p.vx = ax * spd;
      }
      if (playing()) audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.02);
    }

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, null);
      if (plat) {
        y1 = plat.y;
        if (p.vy > 210 && playing()) {
          audio.land();
          p.squash = 0.8;
          landDust(p.x, p.y, p.vy > 380 ? 1.35 : 1);
          kick(1.7, 'thump');
        }
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.y > VH + 90) {
      if (playing()) die('fall');
      else {
        G.player = makePlayer(70, GY);
        G.camX = 0;
        G.shots = [];
        G.chargeT = 0;
        G.chargeFull = false;
        return;
      }
    }
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (p.grounded && Math.abs(p.vx) > 20) p.run += dt * 12;
    else p.run += dt * 2;

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    const charging = chargeHeld();
    if (charging) {
      const was = G.chargeT;
      G.chargeT = Math.min(CHARGE_MAX, G.chargeT + dt);
      if (was < 0.04 && G.chargeT >= 0.04) audio.chargeHum();
      if (!G.chargeFull && G.chargeT >= CHARGE_MAX) {
        G.chargeFull = true;
        audio.charged();
        kick(2.4, 'charge');
        screenFlash(CYN, 0.22);
        if (playing()) toast('念力全开', false, true);
      }
      if (Math.random() < 0.45) {
        emit(1, {
          x: p.x, y: p.y - 14, j: 10,
          vx0: -40, vx1: 40, vy0: -80, vy1: -10,
          life: 0.22, r0: 0.8, r1: 2.2,
          rgb: G.chargeFull ? CYN : MAG, g: -20
        });
      }
    } else if (G.chargeT >= CHARGE_MIN) {
      fireCharge(G.chargeT >= CHARGE_MAX);
      G.chargeT = 0;
      G.chargeFull = false;
    } else {
      G.chargeT = 0;
      G.chargeFull = false;
      if (fireHeld() && G.fireCd <= 0) firePsi();
    }
    syncChargeHud();
  }

  function updatePickups(dt) {
    const p = G.player;
    let i, u;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      u.life -= dt;
      if (!u.rest) {
        u.vy += 420 * dt;
        if (u.vy > 160) u.vy = 160;
        const uy0 = u.y;
        u.y += u.vy * dt;
        const plat = landOn(u.x, uy0, u.y + 10, null);
        if (plat) {
          u.y = plat.y - 10;
          u.vy = 0;
        }
      }
      if (u.life <= 0) u.taken = true;
      if (playing() && G.deadT <= 0 && hypot(p.x - u.x, (p.y - 12) - u.y) < 18) takePickup(u);
    }
  }

  function playerContact() {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    const pb = pBox();
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        hurt(e.x, 1, 'hit');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h * 0.9)) {
        hurt(b.x, isTide() ? 1 : 2, 'boss');
      }
    }
  }

  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function enemyShoot(x, y, dx, dy, spd, kind) {
    const len = Math.max(0.001, hypot(dx, dy));
    spawnShot({
      x: x, y: y,
      vx: (dx / len) * spd,
      vy: (dy / len) * spd,
      from: 'e', kind: kind || 'bolt',
      dmg: 1, pierce: 0, rad: kind === 'beam' ? 10 : 5,
      life: kind === 'beam' ? 1.4 : 2.4,
      rgb: kind === 'beam' ? ORG : kind === 'rock' ? GOLD : VIO,
      grav: kind === 'rock' ? 220 : 0,
      spin: 0, dead: false, hit: {}
    });
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isTide(), G.stage);
    if (e.kind === 'drone') {
      e.x += (e.face || -1) * 58 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = e.base + Math.sin(e.t * 3.4) * 18;
      e.fire -= dt;
      if (live() && onScreen(e.x, e.y, 20) && e.fire <= 0) {
        enemyShoot(e.x, e.y + 4, G.player.x - e.x, (G.player.y - 14) - e.y, 150 * mul, 'bolt');
        e.fire = (isTide() ? 1.15 : 1.75) + rand(0, 0.5);
      }
      return;
    }
    if (!onScreen(e.x, e.y, 90)) return;
    if (e.kind === 'turret') {
      e.face = G.player.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (live() && e.fire <= 0 && onScreen(e.x, e.y, 10)) {
        enemyShoot(e.x + e.face * 10, e.y - 12, e.face, -0.12, 170 * mul, 'bolt');
        e.fire = (isTide() ? 1.05 : 1.6) + rand(0, 0.35);
      }
      return;
    }
    const walk = (e.kind === 'mech' ? 26 : e.kind === 'beetle' ? 50 : 44) * mul;
    if (e.x < e.a) e.face = 1;
    if (e.x > e.b) e.face = -1;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * walk * dt;
    if (e.kind === 'beetle') {
      e.fire -= dt;
      if (e.grounded && e.fire <= 0) {
        e.vy = -240;
        e.grounded = false;
        e.fire = 0.8 + rand(0, 0.4);
      }
      e.vy += GRAV * dt;
      if (e.vy > MAX_FALL) e.vy = MAX_FALL;
      const y0 = e.y;
      let y1 = e.y + e.vy * dt;
      e.grounded = false;
      if (e.vy >= 0) {
        const plat = landOn(e.x, y0, y1, null);
        if (plat) {
          y1 = plat.y;
          e.vy = 0;
          e.grounded = true;
        }
      }
      e.y = y1;
    }
    if ((e.kind === 'grunt' || e.kind === 'mech') && live()) {
      e.fire -= dt;
      if (e.fire <= 0 && onScreen(e.x, e.y, 10)) {
        enemyShoot(e.x + e.face * 12, e.y - 16, e.face, 0, (e.kind === 'mech' ? 150 : 165) * mul, 'bolt');
        e.fire = (isTide() ? 1.2 : 1.8) + rand(0, 0.4) + (e.kind === 'mech' ? 0.25 : 0);
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    b.t += dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.levelW - VW + 40) {
        b.active = true;
        b.state = 'idle';
        b.fire = 0.8;
        audio.boss();
        toast(b.name + ' 降临', false, true);
        kick(4, 'boom');
        screenFlash(HOT, 0.28);
      }
      return;
    }
    const mul = spdMul(isTide(), G.stage);
    const arenaL = G.levelW - VW + 44;
    const arenaR = G.levelW - 46;

    if (b.kind === '钻岩机') {
      if (b.state === 'idle') {
        b.x += b.face * 70 * mul * dt;
        if (b.x < arenaL) b.face = 1;
        if (b.x > arenaR) b.face = -1;
        b.y = b.base + Math.sin(b.t * 2.4) * 16;
        b.fire -= dt;
        if (b.fire <= 0) {
          if (Math.random() < 0.46) {
            b.state = 'dive';
            b.vy = 40;
          } else {
            enemyShoot(b.x, b.y + 10, p.x - b.x, (GY - 16) - (b.y + 10), 190 * mul, 'rock');
            b.fire = (isTide() ? 0.7 : 1.05) + rand(0, 0.3);
          }
        }
      } else if (b.state === 'dive') {
        b.vy += 560 * dt;
        b.y += b.vy * dt;
        if (b.y >= GY + 8) {
          b.y = GY + 8;
          b.state = 'hide';
          b.fire = 0.32;
          landDust(b.x, GY, 1.5);
          kick(3.4, 'thump');
          audio.boom();
        }
      } else if (b.state === 'hide') {
        b.fire -= dt;
        b.y = GY + 18;
        if (b.fire <= 0) {
          b.x = clamp(p.x + (Math.random() < 0.5 ? -70 : 70), arenaL, arenaR);
          b.state = 'up';
          b.vy = -340;
          popSpark(b.x, GY - 10, ORG, 18);
        }
      } else {
        b.y += b.vy * dt;
        b.vy += 280 * dt;
        if (b.y <= b.base) {
          b.y = b.base;
          b.state = 'idle';
          b.fire = 0.5;
          enemyShoot(b.x - 16, b.y, -1, -0.2, 180 * mul, 'rock');
          enemyShoot(b.x + 16, b.y, 1, -0.2, 180 * mul, 'rock');
        }
      }
      return;
    }

    if (b.kind === '巨神机') {
      b.face = p.x < b.x ? -1 : 1;
      b.x += b.face * 28 * mul * dt;
      b.x = clamp(b.x, arenaL, arenaR);
      b.fire -= dt;
      const rage = b.hp < b.max * 0.5;
      if (b.fire <= 0) {
        const r = Math.random();
        if (r < 0.34) {
          enemyShoot(b.x + b.face * 18, b.y - 36, b.face, 0, 240 * mul, 'beam');
          kick(2.6, 'hit');
        } else if (r < 0.7) {
          enemyShoot(b.x - 12, b.y - 48, p.x - b.x, (p.y - 14) - (b.y - 48), 170 * mul, 'rock');
          enemyShoot(b.x + 12, b.y - 48, p.x - (b.x + 20), (p.y - 14) - (b.y - 48), 160 * mul, 'rock');
        } else {
          landDust(b.x, b.y, 1.6);
          kick(3.2, 'thump');
          audio.boom();
          enemyShoot(b.x + b.face * 20, GY - 16, b.face, 0, 200 * mul, 'bolt');
          enemyShoot(b.x + b.face * 20, GY - 40, b.face, -0.15, 190 * mul, 'bolt');
        }
        b.fire = (isTide() ? 0.62 : 0.92) * (rage ? 0.78 : 1) + rand(0, 0.22);
      }
      return;
    }

    b.face = p.x < b.x ? -1 : 1;
    b.x += b.face * 36 * mul * dt;
    b.x = clamp(b.x, arenaL, arenaR);
    b.fire -= dt;
    if (b.fire <= 0) {
      if (Math.random() < 0.48) {
        enemyShoot(b.x + b.face * 18, b.y - 22, b.face, 0, 190 * mul, 'bolt');
        enemyShoot(b.x + b.face * 18, b.y - 22, b.face, -0.28, 180 * mul, 'bolt');
        enemyShoot(b.x + b.face * 18, b.y - 22, b.face, 0.22, 180 * mul, 'bolt');
      } else {
        landDust(b.x, b.y, 1.5);
        kick(3, 'thump');
        audio.boom();
        enemyShoot(b.x - 18, GY - 14, -1, 0, 160 * mul, 'rock');
        enemyShoot(b.x + 18, GY - 14, 1, 0, 160 * mul, 'rock');
      }
      b.fire = (isTide() ? 0.75 : 1.12) + rand(0, 0.3);
    }
  }

  function updateShots(dt) {
    let i, s, k, e;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead) continue;
      s.life -= dt;
      s.spin += (s.kind === 'psi' || s.kind === 'orb' || s.kind === 'wave' ? 14 : 8) * dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y > VH + 40 || s.x < G.camX - 50 || s.x > G.camX + VW + 50) {
        s.dead = true;
        continue;
      }
      if (s.from === 'p' && Math.random() < 0.55) {
        emit(1, {
          x: s.x, y: s.y, j: 2,
          vx0: -20, vx1: 20, vy0: -20, vy1: 20,
          life: 0.12, r0: 0.6, r1: 1.6, rgb: s.rgb || MAG, g: 0
        });
      }
      const rad = s.rad || 5;
      if (s.from === 'e' && playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        if (overlap(s.x - rad, s.y - rad, rad * 2, rad * 2, pb.x, pb.y, pb.w, pb.h)) {
          s.dead = true;
          hurt(s.x, 1, s.kind === 'beam' || s.kind === 'rock' ? 'boss' : 'hit');
        }
      }
      if (s.from === 'p' && !s.dead) {
        if (!s.hit) s.hit = {};
        for (k = 0; k < G.ents.length; k++) {
          e = G.ents[k];
          if (e.dead || s.hit[e.id]) continue;
          if (overlap(s.x - rad, s.y - rad, rad * 2, rad * 2, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
            s.hit[e.id] = 1;
            hitEnemy(e, s.dmg || 1);
            if (s.pierce > 0) s.pierce -= 1;
            else {
              s.dead = true;
              break;
            }
          }
        }
        if (!s.dead && G.boss && !G.boss.dead && G.boss.active && !s.hit[G.boss.id]) {
          const b = G.boss;
          if (overlap(s.x - rad, s.y - rad, rad * 2, rad * 2, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
            s.hit[b.id] = 1;
            hitBoss(s.dmg || 1);
            if (s.pierce > 0) s.pierce -= 1;
            else s.dead = true;
          }
        }
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let target = p.x - VW * 0.34;
    if (G.boss && G.boss.active && !G.boss.dead) target = G.levelW - VW;
    target = clamp(target, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.0008, dt));
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.002, dt));
  }

  function updateFx(dt) {
    let i, q;
    for (i = particles.length - 1; i >= 0; i--) {
      q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      q = floats[i];
      q.t += dt;
      q.y -= q.vy * dt;
      if (q.t > q.life) floats.splice(i, 1);
    }
    for (i = 0; i < mist.length; i++) {
      mist[i].x += mist[i].vx * dt;
      if (mist[i].x > G.camX + VW + 40) mist[i].x = G.camX - 40;
    }
    if (G.invuln > 0 && playing()) G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateCam(dt);
      updateFx(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (!live()) {
      updateFx(dt);
      return;
    }
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updatePickups(dt);
    playerContact();
    updateCam(dt);
    updateFx(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'altar') {
      g.addColorStop(0, '#220618');
      g.addColorStop(0.55, '#140410');
      g.addColorStop(1, '#0a0208');
    } else if (spec.theme === 'cave') {
      g.addColorStop(0, '#0c1020');
      g.addColorStop(0.5, '#100816');
      g.addColorStop(1, '#0c0612');
    } else {
      g.addColorStop(0, '#1a0820');
      g.addColorStop(0.5, '#120614');
      g.addColorStop(1, '#0c0412');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 44);
    ctx.fillStyle = rgba(spec.theme === 'cave' ? CYN : HOT, isTide() ? 0.28 : 0.5);
    ctx.beginPath();
    ctx.arc(mx, my, 22 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.theme === 'cave' ? WHT : MAG, 0.18);
    ctx.beginPath();
    ctx.arc(mx, my, 34 * scale, 0, TAU);
    ctx.fill();

    let i;
    for (i = 0; i < 18; i++) {
      const hx = hash2(i + 11 + G.stage);
      const hy = hash2(i + 29);
      ctx.fillStyle = rgba(WHT, 0.14 + hx * 0.3);
      ctx.fillRect(
        sx(G.camX + (hx * VW + G.clock * 4) % VW),
        sy(G.camY + 10 + hy * 80),
        1.4 * scale, 1.4 * scale
      );
    }
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.28;
    const base = sy(GY + 6);
    let i, x, h, w;
    for (i = -2; i < 28; i++) {
      x = sx((Math.floor((G.camX + par) / 78) + i) * 78 - par);
      h = (50 + hash2(i + 17 + G.stage * 9) * 120) * scale;
      w = (14 + hash2(i + 5) * 10) * scale;
      if (spec.theme === 'city') {
        ctx.fillStyle = i % 2 ? '#1a0c1c' : '#120814';
        ctx.fillRect(x, base - h, w + 10 * scale, h + 40 * scale);
        ctx.fillStyle = rgba(HOT, 0.32);
        ctx.fillRect(x, base - h, w + 10 * scale, 3 * scale);
        ctx.fillStyle = rgba(CYN, 0.18);
        ctx.fillRect(x + 4 * scale, base - h + 12 * scale, 5 * scale, 8 * scale);
        ctx.fillStyle = rgba(GOLD, 0.12);
        ctx.fillRect(x + 4 * scale, base - h + 24 * scale, 5 * scale, 6 * scale);
      } else if (spec.theme === 'cave') {
        ctx.fillStyle = i % 2 ? '#141018' : '#100c16';
        ctx.fillRect(x, base - h * 0.85, w + 8 * scale, h * 0.85 + 40 * scale);
        ctx.fillStyle = rgba(CYN, 0.28);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, base - h * 0.85 - 8 * scale);
        ctx.lineTo(x + w + 4 * scale, base - h * 0.7);
        ctx.lineTo(x - 2 * scale, base - h * 0.7);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = i % 2 ? '#1c0814' : '#14060e';
        ctx.fillRect(x, base - h, w + 10 * scale, h + 40 * scale);
        ctx.fillStyle = rgba(HOT, 0.35);
        ctx.fillRect(x, base - h, w + 10 * scale, 3 * scale);
        ctx.fillStyle = rgba(GOLD, 0.16);
        ctx.fillRect(x + 4 * scale, base - h + 10 * scale, 6 * scale, 12 * scale);
        ctx.strokeStyle = rgba(MAG, 0.22);
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(x + 2 * scale, base - h + 8 * scale, w + 6 * scale, 16 * scale);
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(spec.theme === 'cave' ? CYN : HOT2, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawAbyss() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 8);
    ctx.fillStyle = rgba(MAG, 0.07);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    let x, covered, i;
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = false;
      for (i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered) continue;
      ctx.fillStyle = rgba(HOT, 0.16 + Math.sin(x * 0.1 + G.clock * 4) * 0.05);
      ctx.fillRect(sx(x), sy(GY + 2), 14 * scale, 10 * scale);
    }
  }

  function drawPlats() {
    let i, p, x, y, w, h, k, n;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * scale;
      h = p.h * scale;
      ctx.fillStyle = p.base ? '#180814' : '#22101c';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(HOT, p.base ? 0.88 : 0.7);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(CYN, 0.22);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        n = Math.max(2, (p.w / 28) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.22) : rgba(CYN, 0.1);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 6 * scale);
        }
      }
    }
  }

  function drawPickup(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(G.clock * 5 + u.t) * 2);
    const s = scale;
    let rgb = GOLD;
    let mark = '星';
    if (u.kind === 'heart') { rgb = MAG; mark = '心'; }
    else if (u.kind === 'psi') { rgb = CYN; mark = '念'; }
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 10 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s);
    ctx.strokeStyle = rgba(WHT, 0.65);
    ctx.lineWidth = 1.1 * s;
    ctx.strokeRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s);
    ctx.fillStyle = '#140810';
    ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mark, x, y + 0.5 * s);
  }

  function drawShot(s) {
    if (s.dead) return;
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.spin || 0);
    if (s.kind === 'psi') {
      ctx.fillStyle = rgba(MAG, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, 8 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 4.2 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(-1 * sc, -1 * sc, 1.6 * sc, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'orb') {
      ctx.fillStyle = rgba(HOT, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, 12 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 6.5 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(-1.4 * sc, -1.4 * sc, 2.2 * sc, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'wave') {
      ctx.fillStyle = rgba(CYN, 0.22);
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 * sc, 12 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14 * sc, 7 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6 * sc, 3 * sc, 0, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'beam') {
      ctx.fillStyle = rgba(ORG, 0.3);
      ctx.fillRect(-16 * sc, -4 * sc, 32 * sc, 8 * sc);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(-12 * sc, -2 * sc, 24 * sc, 4 * sc);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(-6 * sc, -1 * sc, 12 * sc, 2 * sc);
    } else if (s.kind === 'rock') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(-5 * sc, -4 * sc, 10 * sc, 8 * sc);
      ctx.fillStyle = rgba(ORG, 0.7);
      ctx.fillRect(-3 * sc, -2 * sc, 6 * sc, 4 * sc);
    } else {
      ctx.fillStyle = rgba(s.rgb || VIO, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 4 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.55);
      ctx.beginPath();
      ctx.arc(0, 0, 1.8 * sc, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAthena(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale;
    const sq = opt.squash || 1;
    const ch = clamp(G.chargeT / CHARGE_MAX, 0, 1);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    if (ch > 0.02) {
      ctx.fillStyle = rgba(G.chargeFull ? CYN : MAG, 0.12 + ch * 0.22);
      ctx.beginPath();
      ctx.arc(0, -13 * s, (16 + ch * 10 + Math.sin(G.t * 10) * 2) * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(G.chargeFull ? CYN : HOT, 0.45 + ch * 0.4);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.arc(0, -13 * s, (12 + ch * 8) * s, G.t * 4, G.t * 4 + 2.2);
      ctx.stroke();
    }
    const leg = Math.sin(opt.run || 0) * (opt.grounded ? 5 : 1.4) * s;
    ctx.strokeStyle = rgba(UNIF, 0.95);
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -5 * s);
    ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -5 * s);
    ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(HAIR, 0.95);
    ctx.beginPath();
    ctx.ellipse(-2 * s, -22 * s, 7 * s, 8 * s, -0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -8 * s);
    ctx.lineTo(7 * s, -8 * s);
    ctx.lineTo(9 * s, 0);
    ctx.lineTo(-9 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(UNIF, 0.96);
    ctx.fillRect(-6 * s, -18 * s, 12 * s, 11 * s);
    ctx.fillStyle = rgba(HOT, 0.92);
    ctx.fillRect(-6 * s, -14 * s, 12 * s, 2 * s);
    ctx.fillStyle = rgba(CYN, 0.45);
    ctx.fillRect(-6 * s, -18 * s, 12 * s, 2.2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -23 * s, 5.2 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HAIR, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -27 * s, 6 * s, 3.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0812';
    ctx.fillRect(1.2 * s, -24 * s, 2.6 * s, 1.5 * s);
    const arm = (G.pose > 0 || ch > 0.08) ? 13 : 8;
    const armY = ch > 0.08 ? -16 : -12;
    ctx.strokeStyle = rgba(WHT, 0.92);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(4 * s, -14 * s);
    ctx.lineTo(arm * s, armY * s);
    ctx.stroke();
    if (G.pose > 0 || ch > 0.2) {
      ctx.fillStyle = rgba(ch > 0.5 ? CYN : MAG, 0.85);
      ctx.beginPath();
      ctx.arc(arm * s, armY * s, (2.4 + ch * 2) * s, 0, TAU);
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
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    if (e.kind === 'drone') {
      const flap = Math.sin(e.t * 12) * 4;
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -8 * s, 8 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-10 * s, (-10 - flap) * s, 6 * s, 2 * s);
      ctx.fillRect(4 * s, (-10 + flap) * s, 6 * s, 2 * s);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(-2.4 * s, -10 * s, 4.8 * s, 2.2 * s);
    } else if (e.kind === 'turret') {
      ctx.fillStyle = rgba(NIGHT, 0.95);
      ctx.fillRect(-8 * s, -6 * s, 16 * s, 6 * s);
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.beginPath();
      ctx.arc(0, -12 * s, 7 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.fillRect(4 * s, -14 * s, 10 * s, 3.2 * s);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(-3 * s, -14 * s, 4 * s, 3 * s);
    } else if (e.kind === 'mech') {
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.fillRect(-10 * s, -22 * s, 20 * s, 22 * s);
      ctx.fillStyle = rgba(HOT, 0.45);
      ctx.fillRect(-10 * s, -22 * s, 20 * s, 4 * s);
      ctx.fillStyle = rgba(NIGHT, 0.95);
      ctx.fillRect(-8 * s, -32 * s, 16 * s, 10 * s);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.fillRect(-5 * s, -29 * s, 4 * s, 3 * s);
      ctx.fillRect(1 * s, -29 * s, 4 * s, 3 * s);
      ctx.fillStyle = rgba(ORG, 0.8);
      ctx.fillRect(8 * s, -16 * s, 9 * s, 4 * s);
    } else if (e.kind === 'beetle') {
      const wob = Math.sin(e.t * 9) * 1.2 * s;
      ctx.fillStyle = rgba(VIO, 0.95);
      ctx.beginPath();
      ctx.ellipse(wob, -8 * s, 9 * s, 7 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(-3 * s + wob, -14 * s, 6 * s, 3 * s);
      ctx.fillStyle = '#1a0812';
      ctx.fillRect(-3 * s + wob, -9 * s, 2 * s, 1.6 * s);
      ctx.fillRect(1 * s + wob, -9 * s, 2 * s, 1.6 * s);
    } else {
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.fillRect(-6 * s, -16 * s, 12 * s, 12 * s);
      ctx.fillStyle = rgba(ORG, 0.7);
      ctx.fillRect(-6 * s, -16 * s, 12 * s, 2.4 * s);
      ctx.fillStyle = rgba(SKIN, 0.9);
      ctx.beginPath();
      ctx.arc(0, -20 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(NIGHT, 0.9);
      ctx.fillRect(-5 * s, -24 * s, 10 * s, 3 * s);
      ctx.fillStyle = rgba(VIO, 0.85);
      ctx.fillRect(5 * s, -14 * s, 8 * s, 2.6 * s);
      ctx.strokeStyle = rgba(STEEL, 0.9);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(-4 * s, -4 * s);
      ctx.lineTo(-5 * s, 0);
      ctx.moveTo(4 * s, -4 * s);
      ctx.lineTo(5 * s, 0);
      ctx.stroke();
    }
    ctx.restore();
    if (e.max > 1 && e.hp < e.max && e.hp > 0) {
      const bw = 16 * scale;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x - bw * 0.5, sy(e.y - e.h - 6), bw, 2.4 * scale);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(x - bw * 0.5, sy(e.y - e.h - 6), bw * (e.hp / e.max), 2.4 * scale);
    }
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    const a = b.active ? 1 : 0.38;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.scale(b.face, 1);
    if (b.hitN > 0 && ((G.t * 28) | 0) % 2 === 0) ctx.globalAlpha = a * 0.4;
    if (b.kind === '钻岩机') {
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -16 * s, 16 * s, 12 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.85);
      ctx.beginPath();
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(-8 * s, 10 * s);
      ctx.lineTo(8 * s, 10 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(NIGHT, 0.95);
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 10 * s);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.fillRect(-6 * s, -25 * s, 5 * s, 4 * s);
      ctx.fillRect(1 * s, -25 * s, 5 * s, 4 * s);
      ctx.fillStyle = rgba(GOLD, 0.6);
      ctx.fillRect(-4 * s, -14 * s, 8 * s, 5 * s);
    } else if (b.kind === '巨神机') {
      ctx.fillStyle = rgba(NIGHT, 0.95);
      ctx.fillRect(-18 * s, -40 * s, 36 * s, 34 * s);
      ctx.fillStyle = rgba(HOT, 0.5);
      ctx.fillRect(-18 * s, -40 * s, 36 * s, 6 * s);
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.fillRect(-14 * s, -56 * s, 28 * s, 16 * s);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(-8 * s, -50 * s, 6 * s, 5 * s);
      ctx.fillRect(2 * s, -50 * s, 6 * s, 5 * s);
      ctx.fillStyle = rgba(ORG, 0.85);
      ctx.fillRect(-6 * s, -28 * s, 12 * s, 8 * s);
      ctx.fillStyle = rgba(STEEL, 0.9);
      ctx.fillRect(-22 * s, -36 * s, 8 * s, 10 * s);
      ctx.fillRect(14 * s, -36 * s, 8 * s, 10 * s);
      ctx.strokeStyle = rgba(MAG, 0.55);
      ctx.lineWidth = 1.6 * s;
      ctx.strokeRect(-20 * s, -42 * s, 40 * s, 38 * s);
    } else {
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.fillRect(-16 * s, -30 * s, 32 * s, 30 * s);
      ctx.fillStyle = rgba(HOT, 0.48);
      ctx.fillRect(-16 * s, -30 * s, 32 * s, 5 * s);
      ctx.fillStyle = rgba(NIGHT, 0.95);
      ctx.fillRect(-12 * s, -44 * s, 24 * s, 14 * s);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(-7 * s, -40 * s, 5 * s, 4 * s);
      ctx.fillRect(2 * s, -40 * s, 5 * s, 4 * s);
      ctx.fillStyle = rgba(ORG, 0.85);
      ctx.fillRect(10 * s, -22 * s, 14 * s, 5 * s);
      ctx.fillStyle = rgba(STEEL, 0.9);
      ctx.fillRect(-10 * s, -8 * s, 7 * s, 8 * s);
      ctx.fillRect(3 * s, -8 * s, 7 * s, 8 * s);
    }
    ctx.restore();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const x = ox + 80 * scale;
    const y = oy + 14 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(b.name, ox + (VW * 0.5) * scale, y - 2 * scale);
  }

  function drawFx() {
    let i, q, a;
    for (i = 0; i < rings.length; i++) {
      q = rings[i];
      a = 1 - q.t / 0.32;
      ctx.strokeStyle = rgba(q.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), (q.r + q.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      q = sparks[i];
      a = 1 - q.t / 0.28;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), (q.rad * a) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, a * 0.8);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), (q.rad * 0.35 * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      q = particles[i];
      a = q.life / q.max;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.fillRect(sx(q.x) - q.r * scale, sy(q.y) - q.r * scale, q.r * 2 * scale, q.r * 2 * scale);
    }
    for (i = 0; i < floats.length; i++) {
      q = floats[i];
      a = 1 - q.t / q.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(q.rgb, 1);
      ctx.font = 'bold ' + (q.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(q.text, sx(q.x), sy(q.y));
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0412';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const shakeX = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    const shakeY = G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0;
    ctx.translate(shakeX, shakeY);
    if (G.punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    drawSky();
    drawBackdrop();
    drawAbyss();
    drawPlats();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const p = G.player;
    if (p && G.deadT <= 0) {
      drawAthena(p, {
        run: p.run, grounded: p.grounded,
        squash: p.squash, blink: playing() && G.invuln > 0
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
    const charge = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;
    if (charge) keys.charge = down;

    if (down && (isMove || space || charge || k === 'Enter')) e.preventDefault();
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
      startGame('cut');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('tide');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space) keys.fire = false;
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
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    hold(document.getElementById('btn-charge'), function () { keys.charge = true; }, function () { keys.charge = false; });
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

  if (btnCutStart) {
    btnCutStart.addEventListener('click', function () {
      audio.ensure();
      startGame('cut');
    });
  }
  if (btnTideStart) {
    btnTideStart.addEventListener('click', function () {
      audio.ensure();
      startGame('tide');
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
      if (G.mode === 'win') startGame('tide');
      else goTitle();
    });
  }
  if (modeCut) {
    modeCut.addEventListener('click', function () {
      audio.ensure();
      startGame('cut');
    });
  }
  if (modeTide) {
    modeTide.addEventListener('click', function () {
      audio.ensure();
      startGame('tide');
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
      keys.charge = false;
    }
  });

  requestAnimationFrame(frame);
})();
