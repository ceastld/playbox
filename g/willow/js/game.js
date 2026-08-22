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
  const WALK = 140;
  const JUMP_V = 424;
  const GRAV = 1120;
  const MAX_FALL = 540;
  const COYOTE = 0.07;
  const BUFFER = 0.11;
  const PW = 13;
  const PH = 22;
  const HP_WOOD = 8;
  const HP_TIDE = 4;
  const MANA_WOOD = 8;
  const MANA_TIDE = 6;
  const MANA_REGEN = 1.55;
  const SWORD_T = 0.18;
  const SWORD_RANGE = 32;
  const MAG_CD = 0.28;
  const MAG_MAX = 2;
  const INVULN = 1.18;
  const DIE_T = 0.86;
  const BEST_KEY = 'playbox-willow-best';
  const MUTE_KEY = 'playbox-willow-mute';
  const OPS = '方向键 / WASD 走 · ↑ 跳 · 空格斩 · Shift / Z 魔法 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [196, 77, 255];
  const HOT2 = [224, 140, 255];
  const WHT = [240, 232, 248];
  const LEAF = [61, 255, 122];
  const ORG = [255, 154, 58];
  const SKIN = [255, 214, 168];
  const ROBE = [138, 90, 184];
  const STN = [120, 96, 150];
  const MOON = [200, 210, 255];
  const SWP = [48, 140, 120];

  const SPELLS = [
    { name: '火花', cost: 1, spd: 280, dmg: 1, life: 0.85, w: 10, boom: false },
    { name: '魔矢', cost: 1, spd: 360, dmg: 1, life: 1.05, w: 12, boom: false },
    { name: '星爆', cost: 2, spd: 300, dmg: 2, life: 1.15, w: 16, boom: true }
  ];
  const SCORE = {
    toad: 100, bat: 150, wraith: 180, goblin: 200, troll: 250,
    boss: 4000, stage: 1500, wand: 400, crystal: 60, star: 80, shot: 50
  };

  const STAGES = [
    {
      name: '柳沼', boss: '沼妖', w: 2160, hp: 16, theme: 'swamp',
      ground: [[0, 500], [580, 380], [1040, 420], [1540, 620]],
      plats: [
        [240, MY, 160], [620, MY, 170], [980, MY, 150], [1320, MY, 180], [1760, MY, 160],
        [340, HY, 120], [840, HY, 130], [1480, HY, 140]
      ],
      drops: [
        [180, GY, 'star'], [420, MY, 'heart'], [720, GY, 'wand'],
        [1180, MY, 'crystal'], [1680, GY, 'heart']
      ],
      ents: [
        [260, GY, 'toad', 40, 480],
        [400, GY, 'goblin', 80, 490],
        [320, MY, 'bat', 240, 400],
        [700, GY, 'toad', 590, 930],
        [820, GY, 'goblin', 600, 940],
        [860, HY, 'bat', 840, 970],
        [1160, GY, 'wraith', 1040, 1420],
        [1400, MY, 'goblin', 1320, 1490],
        [1700, GY, 'toad', 1540, 2040],
        [1880, GY, 'goblin', 1560, 2080],
        [1800, MY, 'bat', 1760, 1920]
      ]
    },
    {
      name: '古林', boss: '树魔', w: 2480, hp: 22, theme: 'wood',
      ground: [[0, 440], [530, 300], [920, 340], [1360, 360], [1840, 640]],
      plats: [
        [140, MY, 150], [400, MY, 170], [700, MY, 180], [1060, MY, 160],
        [1240, MY, 160], [1480, MY, 180], [1700, MY, 180], [1960, MY, 160], [2140, MY, 170],
        [220, HY, 130], [640, HY, 140], [1180, HY, 150], [1640, HY, 140], [2080, HY, 150]
      ],
      drops: [
        [120, GY, 'heart'], [280, HY, 'wand'], [760, MY, 'star'],
        [1240, GY, 'heart'], [1700, HY, 'crystal'], [2200, MY, 'heart']
      ],
      ents: [
        [220, GY, 'goblin', 20, 400],
        [220, MY, 'wraith', 140, 280],
        [280, HY, 'bat', 220, 350],
        [640, GY, 'troll', 540, 780],
        [780, GY, 'goblin', 540, 800],
        [840, MY, 'bat', 700, 870],
        [1080, GY, 'wraith', 920, 1200],
        [1220, HY, 'bat', 1180, 1330],
        [1480, GY, 'goblin', 1360, 1680],
        [1560, MY, 'wraith', 1480, 1660],
        [1740, HY, 'bat', 1640, 1780],
        [1960, GY, 'troll', 1860, 2360],
        [2100, GY, 'goblin', 1880, 2400],
        [2180, MY, 'bat', 2140, 2310]
      ]
    },
    {
      name: '月殿', boss: '暗巫', w: 2760, hp: 28, theme: 'palace',
      ground: [[0, 420], [510, 300], [920, 340], [1380, 320], [1840, 360], [2320, 440]],
      plats: [
        [120, MY, 150], [360, MY, 160], [660, MY, 170], [780, MY, 180], [1020, MY, 170],
        [1280, MY, 180], [1580, MY, 100], [1720, MY, 180], [1980, MY, 160],
        [2220, MY, 180], [2500, MY, 160],
        [220, HY, 130], [600, HY, 140], [1100, HY, 150], [1540, HY, 140],
        [1980, HY, 150], [2420, HY, 140]
      ],
      drops: [
        [160, GY, 'heart'], [240, HY, 'wand'], [780, MY, 'star'],
        [1200, HY, 'heart'], [1680, GY, 'crystal'], [2100, MY, 'heart'], [2520, GY, 'star']
      ],
      ents: [
        [240, GY, 'goblin', 20, 380],
        [200, MY, 'wraith', 120, 260],
        [280, HY, 'bat', 220, 350],
        [620, GY, 'troll', 520, 780],
        [760, GY, 'goblin', 520, 800],
        [820, MY, 'bat', 780, 950],
        [1080, GY, 'wraith', 930, 1240],
        [1160, HY, 'bat', 1100, 1250],
        [1100, GY, 'goblin', 930, 1240],
        [1440, MY, 'troll', 1290, 1450],
        [1540, GY, 'wraith', 1390, 1680],
        [1600, HY, 'bat', 1540, 1680],
        [1980, GY, 'goblin', 1850, 2180],
        [2060, MY, 'wraith', 1980, 2130],
        [2440, GY, 'troll', 2330, 2720],
        [2480, HY, 'bat', 2420, 2560],
        [2560, GY, 'goblin', 2340, 2720]
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
    return tide ? 1.1 : 1;
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
  function isFly(kind) {
    return kind === 'bat' || kind === 'wraith';
  }
  function spellOf(lv) {
    return SPELLS[clamp(lv, 1, 3) - 1];
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (SPELLS.length !== 3) throw new Error('3 spells');
    if (SPELLS[0].spd >= SPELLS[1].spd) throw new Error('bolt faster');
    if (!SPELLS[2].boom) throw new Error('nova boom');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('tide faster');
    if (walkMul(true) <= walkMul(false)) throw new Error('tide walk');
    if (HP_TIDE >= HP_WOOD) throw new Error('tide hp');
    if (BEST_KEY !== 'playbox-willow-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (SWORD_RANGE > 40) throw new Error('sword close');
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
        if (isFly(e[2])) continue;
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
  const btnWoodStart = document.getElementById('btn-wood-start');
  const btnTideStart = document.getElementById('btn-tide-start');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeWood = document.getElementById('mode-wood');
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
  const manaBox = document.getElementById('mana-box');
  const manaEl = document.getElementById('mana');
  const manaFill = document.getElementById('mana-fill');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const spellLabel = document.getElementById('spell-label');
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

  const keys = { l: false, r: false, u: false, d: false, slash: false, mag: false };
  const demo = { l: false, r: true, u: false, slash: false, mag: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'wood',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2160,
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_WOOD,
    mana: MANA_WOOD,
    manaT: 0,
    magLv: 1,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    swordT: 0,
    swordHit: {},
    magCd: 0,
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
    return isTide() ? HP_TIDE : HP_WOOD;
  }
  function maxMana() {
    return isTide() ? MANA_TIDE : MANA_WOOD;
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
  function slashHeld() {
    return G.mode === 'title' ? demo.slash : keys.slash;
  }
  function magHeld() {
    return G.mode === 'title' ? demo.mag : keys.mag;
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
      this.beep(260, 0.07, 'square', 0.04, 540);
    },
    land() {
      this.ensure();
      this.noise(0.045, 0.028, 380);
      this.beep(120, 0.05, 'triangle', 0.024, 64);
    },
    slash() {
      this.ensure();
      this.noise(0.05, 0.046, 1400);
      this.beep(820, 0.06, 'sawtooth', 0.04, 220);
    },
    mag() {
      this.ensure();
      this.beep(640, 0.07, 'sine', 0.042, 1280);
      this.beep(980, 0.09, 'triangle', 0.03, 420);
      this.noise(0.04, 0.03, 1800);
    },
    empty() {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 80);
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.038, 0.038, 1200);
      this.beep(560 * lift, 0.07, 'square', 0.046, 920 * lift);
      this.beep(1180 * lift, 0.05, 'triangle', 0.028, 420);
    },
    magHit() {
      this.ensure();
      this.beep(880, 0.06, 'sine', 0.04, 1320);
      this.noise(0.04, 0.034, 1600);
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
      this.beep(523, 0.1, 'square', 0.045, 659);
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
    const t = isTide();
    if (modeWood) modeWood.setAttribute('aria-pressed', t ? 'false' : 'true');
    if (modeTide) modeTide.setAttribute('aria-pressed', t ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (hpEl) hpEl.textContent = String(Math.max(0, G.hp));
    if (hpFill) hpFill.style.transform = 'scaleX(' + clamp(G.hp / maxHp(), 0, 1) + ')';
    if (manaEl) manaEl.textContent = String(Math.max(0, G.mana | 0));
    if (manaFill) manaFill.style.transform = 'scaleX(' + clamp(G.mana / maxMana(), 0, 1) + ')';
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isTide() ? '怪潮 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isTide() ? '怪潮' : '魔林';
      tagLabel.classList.toggle('warn', isTide());
      tagLabel.classList.toggle('hot', !isTide() && G.stage >= 3);
    }
    if (spellLabel) {
      const sp = spellOf(G.magLv);
      spellLabel.textContent = sp.name;
      spellLabel.className = 'spell' + (G.magLv === 2 ? ' bolt' : G.magLv >= 3 ? ' nova' : '');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 坠崖与生命打空都会丢命', 'warn');
    else if (G.mode === 'win') setHint('守护者已灭 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · ↑跳 · 空格斩 · Shift/Z 魔法', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('守护者 · ' + spec.boss, 'hot');
    else setHint('走跳过崖 · 空格近斩 · Shift/Z 放魔法', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'WILL';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '怪潮' : '换模式';
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
      life: 0.28, r0: 1.6, r1: 3.6, rgb: STN, g: 80
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
      squash: 1, run: 0, pose: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'troll') return 3;
    if (kind === 'goblin' || kind === 'wraith') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = isFly(kind);
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y,
      t: rand(0, 2), hop: rand(0.3, 1.1),
      grounded: !fly, dead: false, hitN: 0,
      w: kind === 'troll' ? 18 : kind === 'bat' ? 16 : kind === 'wraith' ? 14 : 14,
      h: kind === 'troll' ? 28 : kind === 'bat' ? 12 : kind === 'toad' ? 12 : kind === 'wraith' ? 20 : 22
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isTide() ? 1.18 : 1)) | 0;
    const fly = spec.boss === '暗巫';
    return {
      id: uid++,
      x: spec.w - 150, y: fly ? HY + 28 : GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: !fly, dead: false, active: false,
      hitN: 0, w: fly ? 28 : 36, h: fly ? 32 : 44,
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
        if (e[2] === 'troll') continue;
        G.ents.push(makeEnt(e[0] + 40, e[1], e[2] === 'goblin' ? 'toad' : e[2], e[3], e[4]));
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
    G.swordT = 0;
    G.swordHit = {};
    G.magCd = 0;
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

  function swordBox() {
    const p = G.player;
    const dir = p.face;
    const x = dir > 0 ? p.x + 4 : p.x - 4 - SWORD_RANGE;
    return { x: x, y: p.y - p.h - 2, w: SWORD_RANGE, h: p.h + 4 };
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
    screenFlash(GOLD, 0.22);
    popSpark(u.x, u.y, GOLD, 16);
    if (u.kind === 'heart') {
      G.hp = Math.min(maxHp(), G.hp + 1);
      toast('生命 +1', false, true);
      floatText(u.x, u.y - 8, '+1', MAG, false);
    } else if (u.kind === 'crystal') {
      G.mana = Math.min(maxMana(), G.mana + 2);
      toast('法力 +2', false, true);
      floatText(u.x, u.y - 8, '+法', CYN, false);
    } else if (u.kind === 'wand') {
      if (G.magLv < 3) {
        G.magLv += 1;
        toast(spellOf(G.magLv).name, false, true);
        addScore(SCORE.wand * G.mult);
      } else {
        G.mana = Math.min(maxMana(), G.mana + 3);
        toast('法已满 · 法力 +3', false, true);
      }
    } else {
      addScore(SCORE.star * G.mult);
      floatText(u.x, u.y - 8, String(SCORE.star * G.mult), GOLD, false);
    }
    emit(10, {
      x: u.x, y: u.y, j: 8,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.32, r0: 1.2, r1: 3, rgb: GOLD
    });
    syncHud();
  }

  function maybeDrop(e) {
    if (!playing()) return;
    const r = Math.random();
    const tank = e.kind === 'troll' || e.kind === 'goblin' || e.kind === 'wraith';
    if (tank && r < 0.16) spawnPickup(e.x, e.y - 12, 'wand', false);
    else if (r < (tank ? 0.34 : 0.16)) spawnPickup(e.x, e.y - 12, 'heart', false);
    else if (r < 0.52) spawnPickup(e.x, e.y - 12, 'crystal', false);
    else if (r < 0.66) spawnPickup(e.x, e.y - 12, 'star', false);
  }

  function spawnShot(s) {
    s.id = uid++;
    G.shots.push(s);
  }

  function magCount() {
    let n = 0;
    let i;
    for (i = 0; i < G.shots.length; i++) {
      if (!G.shots[i].dead && G.shots[i].from === 'p') n += 1;
    }
    return n;
  }

  function trySlash() {
    if (G.swordT > 0 || G.knockT > 0 || G.deadT > 0 || G.lock > 0) return;
    const p = G.player;
    if (!p) return;
    G.swordT = SWORD_T;
    G.swordHit = {};
    p.pose = 0.16;
    if (playing()) audio.slash();
    const tip = p.x + p.face * 22;
    emit(5, {
      x: tip, y: p.y - 14, j: 6,
      vx0: p.face * 40, vx1: p.face * 180, vy0: -80, vy1: 40,
      life: 0.16, r0: 1, r1: 2.2, rgb: WHT, g: 80
    });
  }

  function tryMagic() {
    if (G.magCd > 0 || G.knockT > 0 || G.deadT > 0 || G.lock > 0) return;
    const p = G.player;
    if (!p) return;
    const sp = spellOf(G.magLv);
    if (playing() && G.mana < sp.cost) {
      toast('法力不足', true, false);
      audio.empty();
      G.magCd = 0.22;
      return;
    }
    if (magCount() >= MAG_MAX) return;
    if (playing()) G.mana -= sp.cost;
    G.magCd = MAG_CD;
    p.pose = 0.14;
    if (playing()) audio.mag();
    spawnShot({
      x: p.x + p.face * 12,
      y: p.y - 14,
      vx: p.face * sp.spd,
      vy: 0,
      from: 'p',
      kind: G.magLv >= 3 ? 'nova' : G.magLv === 2 ? 'bolt' : 'spark',
      dmg: sp.dmg,
      boom: sp.boom,
      life: sp.life,
      w: sp.w,
      rgb: G.magLv >= 3 ? GOLD : G.magLv === 2 ? CYN : HOT,
      spin: 0,
      dead: false,
      hit: {}
    });
    emit(7, {
      x: p.x + p.face * 14, y: p.y - 14, j: 5,
      vx0: p.face * 40, vx1: p.face * 180, vy0: -50, vy1: 40,
      life: 0.2, r0: 1, r1: 2.6, rgb: HOT, g: 40
    });
    popSpark(p.x + p.face * 14, p.y - 14, HOT, 10);
    screenFlash(HOT, 0.12);
    if (manaBox) {
      manaBox.classList.remove('cast');
      void manaBox.offsetWidth;
      manaBox.classList.add('cast');
    }
    syncHud();
  }

  function strike(e, dmg, src, magHit) {
    if (!e || e.dead || e.hp <= 0) return;
    e.hp -= dmg;
    e.hitN = 0.12;
    e.x += (e.x < src ? -1 : 1) * 6;
    bumpCombo();
    const pts = (SCORE[e.kind] || 100) * G.mult;
    if (e.hp <= 0) {
      e.dead = true;
      addScore(pts);
      floatText(e.x, e.y - 10, String(pts), GOLD, G.mult > 1);
      juice(e.x, e.y - e.h * 0.5, magHit ? HOT : GOLD, magHit ? 1.1 : 0.85);
      maybeDrop(e);
      if (playing()) {
        if (magHit) audio.magHit();
        else audio.hit(G.combo);
      }
      hitStop(magHit ? 0.05 : 0.055);
    } else {
      emit(6, {
        x: e.x, y: e.y - 10, j: 6,
        vx0: -120, vx1: 120, vy0: -160, vy1: -20,
        life: 0.2, r0: 1, r1: 2.2, rgb: magHit ? HOT : WHT
      });
      popSpark(e.x, e.y - 10, magHit ? HOT : GOLD, 8);
      if (playing()) {
        if (magHit) audio.magHit();
        else audio.hit(G.combo);
      }
      hitStop(0.042);
      kick(2.2, 'hit');
      floatText(e.x, e.y - 10, String(40 * G.mult), WHT, false);
      addScore(40 * G.mult);
    }
  }

  function strikeBoss(dmg, src, magHit) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.14;
    b.x += (b.x < src ? -1 : 1) * 4;
    bumpCombo();
    if (playing()) {
      if (magHit) audio.magHit();
      else audio.hit(G.combo);
    }
    juice(b.x, b.y - b.h * 0.4, magHit ? HOT : GOLD, 1.15);
    hitStop(magHit ? 0.058 : 0.068);
    kick(3.4, 'boom');
    if (b.hp <= 0) killBoss();
    else syncHud();
  }

  function novaBoom(x, y) {
    popSpark(x, y, GOLD, 22);
    emit(16, {
      x: x, y: y, j: 8,
      vx0: -260, vx1: 260, vy0: -280, vy1: 40,
      life: 0.34, r0: 1.4, r1: 3.4, rgb: GOLD
    });
    screenFlash(GOLD, 0.28);
    kick(3.6, 'boom');
    audio.boom();
    hitStop(0.06);
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - x, e.y - 10 - y) < 42) strike(e, 1, x, true);
    }
    const b = G.boss;
    if (b && b.active && !b.dead && hypot(b.x - x, b.y - 16 - y) < 48) {
      if (!b._nova) {
        b._nova = true;
        strikeBoss(1, x, true);
        b._nova = false;
      }
    }
  }

  function killBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    b.dead = true;
    b.active = false;
    const pts = SCORE.boss * G.mult;
    addScore(pts);
    addScore(SCORE.stage * G.stage);
    floatText(b.x, b.y - 20, String(pts), GOLD, true);
    juice(b.x, b.y - 18, GOLD, 1.8);
    audio.boom();
    hitStop(0.08);
    kick(5.4, 'win-flash');
    toast(b.name + ' 倒下', false, true);
    G.clearT = 1.35;
    G.lock = 1.35;
    syncHud();
  }

  function die(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why;
    G.lives -= 1;
    G.deadT = DIE_T;
    G.combo = 0;
    G.mult = 1;
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

  function respawn() {
    G.deadT = 0;
    G.hp = maxHp();
    G.invuln = INVULN;
    G.knockT = 0;
    G.swordT = 0;
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.squash = 0.86;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'boss' ? '被守护者击倒了' : '生命耗尽了';
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
    const title = isTide() ? '怪潮得手' : '柳沼已平';
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
    const keep = {
      hp: G.hp, mana: G.mana, magLv: G.magLv, score: G.score, lives: G.lives
    };
    loadStage(G.stage + 1, false);
    G.hp = keep.hp;
    G.mana = keep.mana;
    G.magLv = keep.magLv;
    G.score = keep.score;
    G.lives = keep.lives;
    G.invuln = 1.05;
    syncHud();
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.kind = kind === 'tide' ? 'tide' : 'wood';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = maxHp();
    G.mana = maxMana();
    G.manaT = 0;
    G.magLv = 1;
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
    G.kind = 'wood';
    G.lives = LIVES;
    G.hp = HP_WOOD;
    G.mana = MANA_WOOD;
    G.magLv = 2;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.invuln = 99;
    G.deadT = 0;
    loadStage(1, true);
    showOverlay('title', '柳巫', '近处挥剑，远处放魔法。越过断崖，生命打空丢命。短关过后关底有守护者。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('wood');
    else startGame(G.kind || 'wood');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('wood');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = false;
    demo.slash = false;
    demo.mag = false;
    if (p.grounded && pitAhead(p.x, p.y, 1)) demo.u = true;
    let near = false;
    let far = false;
    let i, e, d;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      d = e.x - p.x;
      if (d > 8 && d < 40 && Math.abs(e.y - p.y) < 28) near = true;
      if (d > 50 && d < 180 && Math.abs(e.y - p.y) < 40) far = true;
    }
    if (near) demo.slash = true;
    else if (far && ((G.clock * 1.8) | 0) % 2 === 0) demo.mag = true;
    else if (((G.clock * 2.2) | 0) % 4 === 0) demo.slash = true;
    if (p.x > 720 || p.y > VH + 40) {
      loadStage(1, true);
      G.magLv = 2;
      G.mana = MANA_WOOD;
      G.invuln = 99;
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
        const plat = landOn(p.x, y0k, y1k);
        if (plat) {
          y1k = plat.y;
          p.vy = 0;
          p.grounded = true;
          p.vx *= 0.5;
        }
      }
      p.y = y1k;
      if (p.y > VH + 90) {
        if (playing()) die('fall');
        else {
          G.player = makePlayer(56, GY);
          G.camX = 0;
        }
      }
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
      return;
    }

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;
    const spd = WALK * walkMul(isTide());
    if (p.grounded) p.vx = ax * spd;
    else if (ax) p.vx = ax * spd;
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
      p.squash = 0.78;
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
      const plat = landOn(p.x, y0, y1);
      if (plat) {
        y1 = plat.y;
        if (p.vy > 220 && playing()) {
          audio.land();
          p.squash = 0.82;
          landDust(p.x, p.y, 0.7);
          kick(1.6, 'thump');
        }
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
        if (plat.base && p.x > G.checkX + 40) {
          G.checkX = p.x;
          G.checkY = plat.y;
        }
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
      }
      return;
    }

    p.run += Math.abs(p.vx) * dt * 0.12;
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (p.pose > 0) p.pose -= dt;

    if (G.swordT > 0) G.swordT -= dt;
    if (G.magCd > 0) G.magCd -= dt;
    if (slashHeld()) trySlash();
    if (magHeld()) tryMagic();

    if (playing()) {
      G.manaT += dt;
      if (G.manaT >= MANA_REGEN) {
        G.manaT -= MANA_REGEN;
        if (G.mana < maxMana()) {
          G.mana += 1;
          syncHud();
        }
      }
    }
  }

  function resolveSlash() {
    if (G.swordT <= 0) return;
    const box = swordBox();
    let i, e, s, b;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || G.swordHit[e.id]) continue;
      if (overlap(box.x, box.y, box.w, box.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        G.swordHit[e.id] = true;
        strike(e, 1, G.player.x, false);
      }
    }
    b = G.boss;
    if (b && b.active && !b.dead && !G.swordHit[b.id]) {
      if (overlap(box.x, box.y, box.w, box.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        G.swordHit[b.id] = true;
        strikeBoss(1, G.player.x, false);
      }
    }
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead || s.from !== 'e') continue;
      if (overlap(box.x, box.y, box.w, box.h, s.x - 5, s.y - 5, 10, 10)) {
        s.dead = true;
        popSpark(s.x, s.y, CYN, 10);
        emit(5, {
          x: s.x, y: s.y, j: 4,
          vx0: -80, vx1: 80, vy0: -80, vy1: 20,
          life: 0.16, r0: 1, r1: 2, rgb: CYN
        });
        if (playing()) {
          addScore(SCORE.shot * G.mult);
          audio.ping();
        }
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isTide(), G.stage);
    if (e.kind === 'bat') {
      e.x += e.face * 46 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = e.base + Math.sin(e.t * 4.2) * 16;
      return;
    }
    if (e.kind === 'wraith') {
      const p = G.player;
      const dx = p.x - e.x;
      e.face = dx < 0 ? -1 : 1;
      e.x += e.face * 38 * mul * dt;
      e.y = e.base + Math.sin(e.t * 2.6) * 10;
      if (e.x < e.a) e.x = e.a;
      if (e.x > e.b) e.x = e.b;
      return;
    }
    if (e.kind === 'toad') {
      e.hop -= dt;
      if (e.grounded) {
        if (e.hop <= 0) {
          e.vy = -280;
          e.grounded = false;
          e.hop = rand(0.7, 1.4);
          e.face = G.player.x < e.x ? -1 : 1;
        }
      } else {
        e.vy += GRAV * dt;
        if (e.vy > MAX_FALL) e.vy = MAX_FALL;
        const y0 = e.y;
        let y1 = e.y + e.vy * dt;
        e.x += e.face * 40 * mul * dt;
        if (e.vy >= 0) {
          const plat = landOn(e.x, y0, y1);
          if (plat) {
            y1 = plat.y;
            e.vy = 0;
            e.grounded = true;
          }
        }
        e.y = y1;
        if (e.y > VH + 80) e.dead = true;
      }
      return;
    }
    const walk = (e.kind === 'troll' ? 28 : 44) * mul;
    if (e.x < e.a) e.face = 1;
    if (e.x > e.b) e.face = -1;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * walk * dt;
  }

  function enemyShoot(x, y, dx, dy, spd, kind) {
    const len = Math.max(0.001, hypot(dx, dy));
    spawnShot({
      x: x, y: y,
      vx: (dx / len) * spd,
      vy: (dy / len) * spd,
      from: 'e', kind: kind || 'goo',
      life: 2.2, rgb: kind === 'star' ? GOLD : kind === 'seed' ? LEAF : SWP,
      grav: kind === 'seed' ? 280 : kind === 'goo' ? 220 : 0,
      spin: 0, dead: false
    });
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
        toast(b.name + ' 现身', false, true);
        kick(4, 'boom');
        screenFlash(HOT, 0.28);
      }
      return;
    }
    const mul = spdMul(isTide(), G.stage);
    if (b.kind === '暗巫') {
      if (b.state === 'idle') {
        b.x += b.face * 58 * mul * dt;
        if (b.x < G.levelW - VW + 50) b.face = 1;
        if (b.x > G.levelW - 50) b.face = -1;
        b.y = b.base + Math.sin(b.t * 2.4) * 18;
        b.fire -= dt;
        if (b.fire <= 0) {
          if (Math.random() < 0.4) {
            b.state = 'blink';
            b.fire = 0.18;
            popSpark(b.x, b.y - 16, MAG, 18);
          } else {
            enemyShoot(b.x, b.y - 10, p.x - b.x, p.y - 16 - b.y, 170 * mul, 'star');
            b.fire = (isTide() ? 0.7 : 1.05) + rand(0, 0.3);
          }
        }
      } else {
        b.fire -= dt;
        if (b.fire <= 0) {
          b.x = clamp(p.x + (Math.random() < 0.5 ? -90 : 90), G.levelW - VW + 50, G.levelW - 50);
          b.y = b.base;
          b.state = 'idle';
          b.fire = 0.55;
          popSpark(b.x, b.y - 16, HOT, 16);
          enemyShoot(b.x, b.y - 8, p.x - b.x, p.y - 16 - b.y, 150 * mul, 'star');
        }
      }
      return;
    }
    if (b.kind === '树魔') {
      b.face = p.x < b.x ? -1 : 1;
      if (b.state === 'idle') {
        b.x += b.face * 36 * mul * dt;
        b.x = clamp(b.x, G.levelW - VW + 40, G.levelW - 40);
        b.fire -= dt;
        if (b.fire <= 0) {
          if (Math.random() < 0.45) {
            b.state = 'slam';
            b.fire = 0.28;
            b.vy = -120;
          } else {
            enemyShoot(b.x + b.face * 10, b.y - 28, b.face * 0.4, -0.9, 160 * mul, 'seed');
            enemyShoot(b.x - b.face * 8, b.y - 28, -b.face * 0.3, -0.85, 150 * mul, 'seed');
            b.fire = (isTide() ? 0.7 : 1.05) + rand(0, 0.3);
          }
        }
      } else {
        b.vy += 520 * dt;
        b.y += b.vy * dt;
        if (b.y >= GY) {
          b.y = GY;
          b.state = 'idle';
          b.fire = 0.55;
          landDust(b.x, GY, 1.5);
          kick(3.4, 'thump');
          audio.boom();
          enemyShoot(b.x + 16, b.y - 8, 1, -0.2, 140 * mul, 'seed');
          enemyShoot(b.x - 16, b.y - 8, -1, -0.2, 140 * mul, 'seed');
        }
      }
      return;
    }
    b.face = p.x < b.x ? -1 : 1;
    if (b.state === 'idle') {
      b.x += b.face * 32 * mul * dt;
      b.x = clamp(b.x, G.levelW - VW + 40, G.levelW - 40);
      b.fire -= dt;
      if (b.fire <= 0) {
        if (Math.random() < 0.5) {
          b.state = 'hop';
          b.vy = -340;
          b.grounded = false;
        } else {
          enemyShoot(b.x + b.face * 12, b.y - 16, b.face * 0.85, -0.35, 170 * mul, 'goo');
          b.fire = (isTide() ? 0.75 : 1.15) + rand(0, 0.3);
        }
      }
    } else {
      b.vy += GRAV * dt;
      b.x += b.face * 50 * dt;
      b.x = clamp(b.x, G.levelW - VW + 40, G.levelW - 40);
      b.y += b.vy * dt;
      if (b.y >= GY) {
        b.y = GY;
        b.state = 'idle';
        b.fire = 0.5;
        landDust(b.x, GY, 1.4);
        kick(3.2, 'thump');
        audio.land();
        enemyShoot(b.x + b.face * 18, b.y - 8, b.face, 0, 150 * mul, 'goo');
      }
    }
  }

  function updateShots(dt) {
    let i, s;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead) continue;
      s.life -= dt;
      s.spin += 12 * dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.from === 'p' && !REDUCE) {
        emit(1, {
          x: s.x, y: s.y, j: 2,
          vx0: -20, vx1: 20, vy0: -30, vy1: 10,
          life: 0.16, r0: 1, r1: 2.2, rgb: s.rgb, g: 40
        });
      }
      if (s.life <= 0 || s.y > VH + 40 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        s.dead = true;
        continue;
      }
      if (s.from === 'e' && playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        if (overlap(s.x - 5, s.y - 5, 10, 10, pb.x, pb.y, pb.w, pb.h)) {
          s.dead = true;
          hurt(s.x, 1, s.kind === 'star' ? 'boss' : 'hit');
        }
      }
      if (s.from === 'p') {
        let k, e, b;
        for (k = 0; k < G.ents.length; k++) {
          e = G.ents[k];
          if (e.dead || s.hit[e.id]) continue;
          if (overlap(s.x - s.w * 0.5, s.y - s.w * 0.5, s.w, s.w, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
            s.hit[e.id] = true;
            strike(e, s.dmg, s.x, true);
            if (s.boom) {
              s.dead = true;
              novaBoom(s.x, s.y);
            } else {
              s.dead = true;
              popSpark(s.x, s.y, s.rgb, 12);
            }
            break;
          }
        }
        b = G.boss;
        if (!s.dead && b && b.active && !b.dead && !s.hit[b.id]) {
          if (overlap(s.x - s.w * 0.5, s.y - s.w * 0.5, s.w, s.w, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
            s.hit[b.id] = true;
            s.dead = true;
            strikeBoss(s.dmg, s.x, true);
            if (s.boom) novaBoom(s.x, s.y);
          }
        }
      }
    }
  }

  function updatePickups(dt) {
    let i, u, pb;
    pb = pBox();
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (!u.rest) {
        u.life -= dt;
        u.vy += 420 * dt;
        u.y += u.vy * dt;
        const plat = landOn(u.x, u.y - 8, u.y + 2);
        if (plat) {
          u.y = plat.y - 10;
          u.vy = 0;
        }
        if (u.life <= 0) u.taken = true;
      }
      if (playing() && overlap(u.x - 8, u.y - 8, 16, 16, pb.x, pb.y, pb.w, pb.h)) {
        takePickup(u);
      }
    }
  }

  function playerContact() {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    const pb = pBox();
    let i, e, b;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h + 2, e.w * 0.9, e.h - 2)) {
        hurt(e.x, 1, 'hit');
        return;
      }
    }
    b = G.boss;
    if (b && b.active && !b.dead) {
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h + 4, b.w * 0.8, b.h - 4)) {
        hurt(b.x, 2, 'boss');
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
    resolveSlash();
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
    if (spec.theme === 'palace') {
      g.addColorStop(0, '#1a0c28');
      g.addColorStop(0.5, '#12081c');
      g.addColorStop(1, '#0a0614');
    } else if (spec.theme === 'wood') {
      g.addColorStop(0, '#140c22');
      g.addColorStop(0.5, '#100818');
      g.addColorStop(1, '#0a0614');
    } else {
      g.addColorStop(0, '#0c1420');
      g.addColorStop(0.5, '#0c1018');
      g.addColorStop(1, '#0a0614');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 44);
    ctx.fillStyle = rgba(MOON, isTide() ? 0.28 : 0.5);
    ctx.beginPath();
    ctx.arc(mx, my, 22 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.18);
    ctx.beginPath();
    ctx.arc(mx, my, 34 * scale, 0, TAU);
    ctx.fill();

    let i;
    for (i = 0; i < 16; i++) {
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
    let i, x, h, w, top;
    for (i = -2; i < 28; i++) {
      x = sx((Math.floor((G.camX + par) / 78) + i) * 78 - par);
      h = (70 + hash2(i + 17 + G.stage * 9) * 110) * scale;
      w = (16 + hash2(i + 5) * 14) * scale;
      ctx.fillStyle = i % 2 ? '#140c22' : '#10081a';
      ctx.fillRect(x + w * 0.35, base - h, w * 0.3, h + 40 * scale);
      top = base - h;
      ctx.fillStyle = spec.theme === 'palace' ? rgba(HOT, 0.28) : rgba(LEAF, 0.22);
      ctx.beginPath();
      ctx.moveTo(x - 8 * scale, top + 18 * scale);
      ctx.quadraticCurveTo(x + w * 0.5, top - 22 * scale, x + w + 8 * scale, top + 18 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.18);
      ctx.fillRect(x, top, w, 3 * scale);
      if (spec.theme === 'palace') {
        ctx.fillStyle = rgba(GOLD, 0.2);
        ctx.fillRect(x + 4 * scale, top + 10 * scale, 5 * scale, 10 * scale);
        ctx.fillRect(x + w * 0.55, top - 14 * scale, w * 0.28, 14 * scale);
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(HOT2, m.a);
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
      ctx.fillStyle = rgba(HOT, 0.14 + Math.sin(x * 0.1 + G.clock * 4) * 0.05);
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
      ctx.fillStyle = p.base ? '#160c24' : '#1c1230';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(HOT, p.base ? 0.88 : 0.7);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.22);
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
    else if (u.kind === 'wand') { rgb = HOT; mark = '杖'; }
    else if (u.kind === 'crystal') { rgb = CYN; mark = '晶'; }
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 10 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s);
    ctx.strokeStyle = rgba(WHT, 0.65);
    ctx.lineWidth = 1.1 * s;
    ctx.strokeRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s);
    ctx.fillStyle = '#14081c';
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
    if (s.from === 'p') {
      ctx.fillStyle = rgba(s.rgb, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, (s.w * 0.7) * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, (s.w * 0.32) * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(-1 * sc, -1 * sc, 1.6 * sc, 0, TAU);
      ctx.fill();
      if (s.kind === 'nova') {
        ctx.strokeStyle = rgba(GOLD, 0.8);
        ctx.lineWidth = 1.4 * sc;
        ctx.beginPath();
        ctx.arc(0, 0, 7 * sc, 0, TAU);
        ctx.stroke();
      }
    } else if (s.kind === 'star') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 4.4 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, 2 * sc, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'seed') {
      ctx.fillStyle = rgba(LEAF, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 4 * sc, 6 * sc, 0.4, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb || SWP, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 5 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.5);
      ctx.beginPath();
      ctx.arc(-1 * sc, -1 * sc, 2 * sc, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHero(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale;
    const sq = opt.squash || 1;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const bodyH = 12;
    const leg = Math.sin(opt.run || 0) * (opt.grounded ? 4 : 2) * s;
    ctx.strokeStyle = rgba(ROBE, 0.95);
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -5 * s);
    ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -5 * s);
    ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-6.2 * s, -bodyH * s - 4 * s, 12.4 * s, bodyH * s);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-6.2 * s, -bodyH * s + 2 * s, 12.4 * s, 2.2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 9) * s, 5 * s, 5.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-6.4 * s, -(bodyH + 11) * s);
    ctx.lineTo(0, -(bodyH + 22) * s);
    ctx.lineTo(6.4 * s, -(bodyH + 11) * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-5.4 * s, -(bodyH + 12.2) * s, 10.8 * s, 1.6 * s);
    ctx.fillStyle = '#1a0c24';
    ctx.fillRect(1.2 * s, -(bodyH + 10.4) * s, 2.8 * s, 1.5 * s);
    const slashing = G.swordT > 0;
    const casting = p.pose > 0 && !slashing;
    ctx.strokeStyle = rgba(WHT, 0.9);
    ctx.lineWidth = 1.7 * s;
    ctx.beginPath();
    ctx.moveTo(3 * s, -(bodyH) * s);
    ctx.lineTo((slashing ? 12 : casting ? 11 : 7) * s, -(bodyH + (slashing ? 2 : 0)) * s);
    ctx.stroke();
    if (slashing) {
      ctx.save();
      ctx.translate(12 * s, -(bodyH + 1) * s);
      ctx.rotate(-0.6 + (1 - G.swordT / SWORD_T) * 1.5);
      ctx.strokeStyle = rgba(WHT, 0.95);
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16 * s, -2 * s);
      ctx.stroke();
      ctx.strokeStyle = rgba(HOT, 0.7);
      ctx.lineWidth = 3.4 * s;
      ctx.beginPath();
      ctx.arc(4 * s, 0, 14 * s, -1.1, 0.6);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 1.7 * s;
      ctx.beginPath();
      ctx.moveTo(7 * s, -(bodyH) * s);
      ctx.lineTo(16 * s, -(bodyH + 1) * s);
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.moveTo(16 * s, -(bodyH + 4) * s);
      ctx.lineTo(21 * s, -(bodyH + 1) * s);
      ctx.lineTo(16 * s, -(bodyH - 2) * s);
      ctx.closePath();
      ctx.fill();
    }
    if (casting) {
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.arc(12 * s, -(bodyH + 2) * s, 3.4 * s, 0, TAU);
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
    if (e.kind === 'bat') {
      const flap = Math.sin(e.t * 11) * 6;
      ctx.fillStyle = rgba(HOT2, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 5 * s, 3.2 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.beginPath();
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(-13 * s, (-8 - flap) * s);
      ctx.lineTo(-2 * s, -3 * s);
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(13 * s, (-8 + flap) * s);
      ctx.lineTo(2 * s, -3 * s);
      ctx.fill();
    } else if (e.kind === 'wraith') {
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.beginPath();
      ctx.ellipse(0, -12 * s, 6 * s, 12 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(0, -18 * s, 4.4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#12081c';
      ctx.fillRect(1 * s, -19 * s, 2 * s, 2 * s);
    } else if (e.kind === 'toad') {
      const crouch = e.grounded ? 2 : 0;
      ctx.fillStyle = rgba(SWP, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, (-7 + crouch) * s, 9 * s, (7 - crouch) * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.7);
      ctx.beginPath();
      ctx.arc(5 * s, (-9 + crouch) * s, 3.2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(6 * s, (-10 + crouch) * s, 2 * s, 2 * s);
    } else if (e.kind === 'troll') {
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.fillRect(-9 * s, -24 * s, 18 * s, 24 * s);
      ctx.fillStyle = rgba(HOT, 0.4);
      ctx.fillRect(-9 * s, -24 * s, 18 * s, 4 * s);
      ctx.fillStyle = rgba(ROBE, 0.95);
      ctx.beginPath();
      ctx.arc(0, -30 * s, 6.4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.5);
      ctx.fillRect(-4 * s, -18 * s, 8 * s, 6 * s);
    } else {
      ctx.fillStyle = rgba(LEAF, 0.9);
      ctx.fillRect(-6.2 * s, -18 * s, 12.4 * s, 14 * s);
      ctx.fillStyle = rgba(HOT, 0.55);
      ctx.fillRect(-6.2 * s, -18 * s, 12.4 * s, 3 * s);
      ctx.fillStyle = rgba(SKIN, 0.9);
      ctx.beginPath();
      ctx.arc(0, -23 * s, 4.8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a0c24';
      ctx.fillRect(1.2 * s, -24 * s, 2.2 * s, 1.6 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(5 * s, -16 * s, 3 * s, 10 * s);
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
    if (b.kind === '暗巫') {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(-12 * s, -8 * s);
      ctx.lineTo(0, -36 * s);
      ctx.lineTo(12 * s, -8 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(-8 * s, -22 * s, 16 * s, 18 * s);
      ctx.fillStyle = rgba(SKIN, 0.7);
      ctx.beginPath();
      ctx.arc(0, -24 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(8 * s, -18 * s);
      ctx.lineTo(18 * s, -32 * s);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(18 * s, -32 * s, 4 * s, 0, TAU);
      ctx.fill();
    } else if (b.kind === '树魔') {
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.fillRect(-12 * s, -32 * s, 24 * s, 32 * s);
      ctx.fillStyle = rgba(LEAF, 0.75);
      ctx.beginPath();
      ctx.arc(0, -40 * s, 16 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.4);
      ctx.fillRect(-6 * s, -20 * s, 12 * s, 8 * s);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-4 * s, -42 * s, 3 * s, 3 * s);
      ctx.fillRect(3 * s, -40 * s, 3 * s, 3 * s);
    } else {
      ctx.fillStyle = rgba(SWP, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -16 * s, 20 * s, 16 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.7);
      ctx.beginPath();
      ctx.arc(10 * s, -22 * s, 7 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.6);
      ctx.fillRect(12 * s, -24 * s, 4 * s, 3 * s);
      ctx.fillStyle = rgba(HOT, 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -8 * s, 14 * s, 6 * s, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const x = ox + 80 * scale;
    const y = oy + 14 * scale;
    const w = 480 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.name, ox + VW * 0.5 * scale, y + 4 * scale);
  }

  function drawFx() {
    let i, q, a, r;
    for (i = 0; i < rings.length; i++) {
      q = rings[i];
      a = 1 - q.t / 0.32;
      r = (q.r + q.t * 70) * scale;
      ctx.strokeStyle = rgba(q.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), r, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      q = sparks[i];
      a = 1 - q.t / 0.28;
      ctx.fillStyle = rgba(q.rgb, a * 0.55);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), (q.rad * a) * scale, 0, TAU);
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
    ctx.fillStyle = '#0a0614';
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
      const blink = playing() && G.invuln > 0;
      drawHero(p, {
        run: p.run, grounded: p.grounded,
        squash: p.squash, blink: blink
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
    const magK = k === 'z' || k === 'Z' || k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.slash = down;
    if (magK) keys.mag = down;

    if (down && (isMove || space || k === 'Enter' || magK)) e.preventDefault();
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
      startGame('wood');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('tide');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space) keys.slash = false;
        return;
      }
    }
    if (!overlayOpen() && live()) {
      if (space) trySlash();
      if (magK) tryMagic();
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
    hold(document.getElementById('btn-slash'), function () { keys.slash = true; trySlash(); }, function () { keys.slash = false; });
    hold(document.getElementById('btn-mag'), function () { keys.mag = true; tryMagic(); }, function () { keys.mag = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      keys.slash = true;
      trySlash();
    });
    canvas.addEventListener('pointerup', function () { keys.slash = false; });
    canvas.addEventListener('pointercancel', function () { keys.slash = false; });
    canvas.addEventListener('pointerleave', function () { keys.slash = false; });
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

  if (btnWoodStart) {
    btnWoodStart.addEventListener('click', function () {
      audio.ensure();
      startGame('wood');
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
  if (modeWood) {
    modeWood.addEventListener('click', function () {
      audio.ensure();
      startGame('wood');
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
      keys.slash = false;
      keys.mag = false;
    }
  });

  requestAnimationFrame(frame);
})();
