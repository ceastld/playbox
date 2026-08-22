'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const GY = 320;
  const MY = 248;
  const HY = 176;
  const WALK = 214;
  const SKATE_SPD = 352;
  const AIR = 0.88;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 560;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const AXE_SPD = 470;
  const AXE_CD = 0.22;
  const AXE_LIFE = 0.8;
  const INVULN = 1.4;
  const DIE_T = 0.82;
  const VIT_MAX = 100;
  const DRAIN_ISLE = 4.6;
  const DRAIN_DASH = 8.0;
  const SKATE_T = 8.8;
  const BEST_KEY = 'playbox-wonder-isle-best';
  const MUTE_KEY = 'playbox-wonder-isle-mute';
  const OPS = '方向键 / WASD 走跳 · 空格掷斧 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 176, 26];
  const HOT2 = [255, 213, 106];
  const WHT = [246, 243, 239];
  const LEAF = [61, 255, 122];
  const SAND = [200, 136, 64];
  const SKIN = [255, 196, 148];
  const PNK = [255, 138, 180];
  const LAVA = [255, 90, 40];

  const FRUIT = {
    orange: { vit: 20, score: 100, rgb: [255, 140, 40], name: '橙' },
    banana: { vit: 28, score: 200, rgb: GOLD, name: '蕉' },
    melon: { vit: 42, score: 400, rgb: LEAF, name: '瓜' }
  };

  const SCORE = {
    snail: 120, frog: 220, boss: 4800, stage: 1800, skate: 350
  };

  const STAGES = [
    {
      name: '椰岸', boss: '巨螺', w: 2280, hp: 10,
      ground: [[0, 500], [580, 500], [1180, 1100]],
      plats: [
        [180, MY, 150], [700, MY, 180], [980, MY, 150],
        [1480, MY, 200], [1880, MY, 160],
        [420, HY, 120], [1600, HY, 140]
      ],
      fruit: [
        [240, GY, 'orange'], [640, MY, 'banana'], [900, GY, 'orange'],
        [1320, GY, 'banana'], [1520, MY, 'orange'], [1760, GY, 'melon'],
        [1960, MY, 'banana']
      ],
      skate: [780, GY],
      ents: [
        [340, GY, 'snail', 80, 480],
        [720, GY, 'snail', 600, 1040],
        [860, MY, 'frog', 700, 880],
        [1020, GY, 'snail', 600, 1060],
        [1380, GY, 'frog', 1200, 1700],
        [1560, GY, 'snail', 1220, 2100],
        [1720, GY, 'snail', 1220, 2100],
        [1920, MY, 'frog', 1880, 2040]
      ]
    },
    {
      name: '密林', boss: '蛙王', w: 2680, hp: 14,
      ground: [[0, 440], [520, 420], [1040, 380], [1540, 1140]],
      plats: [
        [120, MY, 140], [360, MY, 150], [680, MY, 170],
        [980, MY, 160], [1280, MY, 180], [1680, MY, 190],
        [2100, MY, 170], [2420, MY, 140],
        [400, HY, 130], [860, HY, 140], [1400, HY, 150],
        [1880, HY, 160], [2280, HY, 130]
      ],
      fruit: [
        [200, MY, 'orange'], [500, GY, 'banana'], [720, MY, 'orange'],
        [1100, GY, 'banana'], [1320, MY, 'melon'], [1760, GY, 'orange'],
        [1920, HY, 'banana'], [2200, GY, 'orange'], [2460, MY, 'melon']
      ],
      skate: [640, GY],
      ents: [
        [280, GY, 'snail', 40, 420],
        [400, MY, 'frog', 360, 510],
        [620, GY, 'snail', 540, 900],
        [780, MY, 'frog', 680, 850],
        [900, HY, 'frog', 860, 1000],
        [1180, GY, 'snail', 1060, 1400],
        [1340, MY, 'frog', 1280, 1460],
        [1480, GY, 'snail', 1060, 1400],
        [1760, GY, 'frog', 1560, 2300],
        [1980, GY, 'snail', 1560, 2500],
        [2140, MY, 'frog', 2100, 2270],
        [2320, GY, 'snail', 1560, 2500],
        [2460, MY, 'frog', 2420, 2560]
      ]
    },
    {
      name: '火岛', boss: '岩魔', w: 3120, hp: 20,
      ground: [[0, 400], [480, 360], [940, 380], [1440, 400], [1960, 1160]],
      plats: [
        [80, MY, 130], [280, MY, 150], [560, MY, 160],
        [860, MY, 170], [1180, MY, 180], [1520, MY, 170],
        [1860, MY, 190], [2280, MY, 200], [2680, MY, 180], [2920, MY, 140],
        [300, HY, 120], [700, HY, 140], [1240, HY, 150],
        [1720, HY, 160], [2320, HY, 170], [2740, HY, 140]
      ],
      fruit: [
        [180, MY, 'orange'], [420, GY, 'banana'], [640, MY, 'orange'],
        [980, GY, 'melon'], [1220, MY, 'banana'], [1580, GY, 'orange'],
        [1760, HY, 'banana'], [2100, GY, 'melon'], [2400, MY, 'orange'],
        [2660, GY, 'banana'], [2900, MY, 'melon']
      ],
      skate: [1080, GY],
      ents: [
        [240, GY, 'snail', 20, 380],
        [340, MY, 'frog', 280, 430],
        [560, GY, 'snail', 500, 820],
        [720, MY, 'frog', 560, 720],
        [760, HY, 'frog', 700, 840],
        [1060, GY, 'snail', 960, 1300],
        [1220, MY, 'frog', 1180, 1360],
        [1360, GY, 'frog', 960, 1320],
        [1640, GY, 'snail', 1460, 1820],
        [1760, MY, 'frog', 1520, 1690],
        [1880, GY, 'snail', 1460, 1840],
        [2140, GY, 'frog', 1980, 2800],
        [2360, MY, 'frog', 2280, 2480],
        [2480, GY, 'snail', 1980, 2900],
        [2640, GY, 'frog', 1980, 2900],
        [2780, MY, 'frog', 2680, 2860],
        [2940, GY, 'snail', 1980, 3000]
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
  function drainRate(dash) {
    return dash ? DRAIN_DASH : DRAIN_ISLE;
  }
  function spdMul(dash, stage) {
    return (dash ? 1.3 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 islands');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (drainRate(true) <= drainRate(false)) throw new Error('dash hungrier');
    if (SKATE_SPD <= WALK) throw new Error('skate faster');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('dash faster');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (BEST_KEY !== 'playbox-wonder-isle-best') throw new Error('best key');
    if (FRUIT.melon.vit <= FRUIT.orange.vit) throw new Error('melon better');
    let i, s, j, hasSnail, hasFrog;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || s.fruit.length < 5) throw new Error('stage goods');
      if (!s.skate) throw new Error('need skate');
      hasSnail = false;
      hasFrog = false;
      for (j = 0; j < s.ents.length; j++) {
        if (s.ents[j][2] === 'snail') hasSnail = true;
        if (s.ents[j][2] === 'frog') hasFrog = true;
      }
      if (!hasSnail || !hasFrog) throw new Error('need snails frogs');
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
  const btnIsle = document.getElementById('btn-isle');
  const btnDash = document.getElementById('btn-dash');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeIsle = document.getElementById('mode-isle');
  const modeDash = document.getElementById('mode-dash');
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
  const vitWrap = document.getElementById('vit-wrap');
  const vitBar = document.getElementById('vit-bar');
  const skateLabel = document.getElementById('skate-label');
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
  let vitHotTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const demo = { l: false, r: true, u: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'isle',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2280,
    plats: [],
    fruit: [],
    ents: [],
    axes: [],
    blobs: [],
    shocks: [],
    player: null,
    boss: null,
    skatePick: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    vit: VIT_MAX,
    axeCd: 0,
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
    hungry: false,
    beatT: 0,
    sparkT: 0,
    arena: 0,
    checkX: 70,
    checkY: GY
  };

  function isDash() {
    return G.kind === 'dash';
  }
  function playing() {
    return G.mode === 'play';
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
    throw() {
      this.ensure();
      this.noise(0.03, 0.03, 1600);
      this.beep(520, 0.07, 'sawtooth', 0.046, 240);
      this.beep(880, 0.05, 'square', 0.03, 420);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.04, 900);
      this.beep(480 * lift, 0.08, 'square', 0.05, 220);
      this.beep(720 * lift, 0.06, 'triangle', 0.03, 180);
    },
    fruit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.05);
      this.beep(660 * lift, 0.07, 'square', 0.046, 990 * lift);
      this.beep(1320 * lift, 0.1, 'sine', 0.036, 1760 * lift);
    },
    skate() {
      this.ensure();
      this.noise(0.1, 0.04, 1800);
      this.beep(240, 0.12, 'sawtooth', 0.04, 720);
      this.beep(880, 0.1, 'triangle', 0.03, 1400);
    },
    spark() {
      this.ensure();
      this.noise(0.03, 0.018, 2400);
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
    starve() {
      this.ensure();
      this.beep(180, 0.16, 'triangle', 0.045, 70);
      this.beep(90, 0.28, 'sine', 0.05, 40);
    },
    hunger() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.03, 90);
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
    },
    slam() {
      this.ensure();
      this.noise(0.1, 0.05, 280);
      this.beep(90, 0.14, 'sawtooth', 0.045, 50);
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
    const dash = isDash();
    if (modeIsle) modeIsle.setAttribute('aria-pressed', dash ? 'false' : 'true');
    if (modeDash) modeDash.setAttribute('aria-pressed', dash ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isDash() ? '疾走 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isDash() ? '疾走' : '岛屿';
      tagLabel.classList.toggle('warn', isDash());
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (vitBar) vitBar.style.transform = 'scaleX(' + clamp(G.vit / VIT_MAX, 0, 1) + ')';
    if (vitWrap) {
      vitWrap.classList.toggle('warn', playing() && G.vit < 26);
      vitWrap.classList.toggle('hot', G.player && G.player.skate > 0);
    }
    if (skateLabel) {
      const on = !!(G.player && G.player.skate > 0 && playing());
      skateLabel.classList.toggle('hidden', !on);
      if (on) skateLabel.textContent = '滑板 ' + Math.ceil(G.player.skate);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 挨打、饿倒、坠崖都丢命', 'warn');
    else if (G.mode === 'win') setHint('岛链打通 · R 再来一局', 'hot');
    else if (G.vit < 26) setHint('饿了 · 快摘水果续命', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 空格掷斧 · 水果续命', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · 石斧招呼 · 跳过冲击', 'hot');
    else setHint('走跳 · 空格掷斧 · 水果续命 · 滑板加速', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'WONDER';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '疾走' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash');
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
    if (!chainPop) return;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainTok += 1;
    const tok = chainTok;
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      showChain(G.mult);
    }
    syncHud();
  }

  function makePlat(x, y, w, h, base) {
    return { x: x, y: y, w: w, h: h || 18, base: !!base };
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      grounded: true, coyote: COYOTE, run: 0,
      squash: 1, pose: 0, skate: 0, w: PW, h: PH
    };
  }

  function makeEnt(x, y, kind, a, b) {
    const frog = kind === 'frog';
    return {
      kind: kind, x: x, y: y,
      w: frog ? 20 : 24, h: frog ? 18 : 14,
      face: -1, a: a, b: b, vx: 0, vy: 0,
      grounded: true, t: rand(0, 1.4), hop: 0,
      hp: 1, dead: false, hurt: 0
    };
  }

  function makeBoss(spec) {
    const kind = spec.boss === '巨螺' ? 'bsnail' : spec.boss === '蛙王' ? 'bfrog' : 'brock';
    const dash = isDash();
    const hp = Math.round(spec.hp * (dash ? 1.28 : 1));
    return {
      kind: kind, name: spec.boss,
      x: spec.w - 180, y: GY, w: kind === 'bfrog' ? 42 : 48, h: kind === 'bfrog' ? 36 : 32,
      face: -1, vx: 0, vy: 0, grounded: true,
      hp: hp, max: hp, t: 0, atk: 0, phase: 0,
      active: false, dead: false, hurt: 0
    };
  }

  function makeFruit(x, y, kind) {
    return { x: x, y: y - 18, kind: kind, taken: false, t: rand(0, TAU) };
  }

  function landOn(x, y0, y1, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x - 4 || x > p.x + p.w + 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y - 1) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (x < p.x + 6 || x > p.x + p.w - 6) continue;
      if (Math.abs(y - p.y) < 10) return p;
    }
    return null;
  }

  function platUnder(x, y, skip) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x || x > p.x + p.w) continue;
      if (Math.abs(y - p.y) < 8) return p;
    }
    return null;
  }

  function pitAhead(x, face) {
    const d = face > 0 ? 42 : -42;
    return !standAt(x + d, GY) && !standAt(x + d * 1.6, GY);
  }

  function loadStage(n, keepScore) {
    const spec = STAGES[n - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.arena = spec.w - 520;
    G.plats.length = 0;
    G.fruit.length = 0;
    G.ents.length = 0;
    G.axes.length = 0;
    G.blobs.length = 0;
    G.shocks.length = 0;
    G.clearT = 0;
    G.lock = 0;
    G.hungry = false;
    G.axeCd = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;

    let i, g, e;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], VH - GY + 48, true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      g = spec.plats[i];
      G.plats.push(makePlat(g[0], g[1], g[2], 14, false));
    }
    for (i = 0; i < spec.fruit.length; i++) {
      g = spec.fruit[i];
      G.fruit.push(makeFruit(g[0], g[1], g[2]));
    }
    G.skatePick = spec.skate
      ? { x: spec.skate[0], y: spec.skate[1] - 10, taken: false, t: 0 }
      : null;
    for (i = 0; i < spec.ents.length; i++) {
      e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isDash()) {
      for (i = 0; i < spec.ents.length; i += 3) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0] + 70, e[1], e[2] === 'frog' ? 'snail' : 'frog', e[3], e[4]));
      }
    }
    G.boss = makeBoss(spec);
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.vit = VIT_MAX;
    G.invuln = keepScore ? 0.6 : 0;
    G.deadT = 0;
    G.checkX = 70;
    G.checkY = GY;
    if (!keepScore) {
      G.combo = 0;
      G.comboT = 0;
      G.mult = 1;
    }
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'isle';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.combo = 0;
    G.mult = 1;
    G.why = '';
    loadStage(1, false);
    G.vit = VIT_MAX;
    showOverlay('title', '冒险', '跑跳掷斧，水果续命。滑板加速，石斧开路。体力会饿，摘果就回。撞敌掉命。');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'dash' ? 'dash' : 'isle';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.maxCombo = 0;
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isDash() ? '疾走 · 饿得更快' : '岛屿 · ' + STAGES[0].name, false, !isDash());
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('isle');
    else startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    kick(8, 'die');
    const why = G.why === 'hunger' ? '饿倒了' : G.why === 'fall' ? '掉下去了' : '被撞到了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    syncHud();
  }

  function goWin() {
    const bonus = 8000 * (isDash() ? 2 : 1);
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.45);
    showOverlay('win', isDash() ? '疾走贯通' : '岛链打通', '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    if (stageEl) stageEl.classList.add('win-flash');
    syncHud();
  }

  function nextStage() {
    const bonus = SCORE.stage * G.stage * G.mult;
    addScore(bonus);
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    loadStage(G.stage, true);
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.deadT = 0;
    G.invuln = INVULN;
    G.vit = Math.max(G.vit, 42);
    G.hungry = false;
    G.axes.length = 0;
    G.blobs.length = 0;
    G.shocks.length = 0;
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    G.why = why;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.player.vy = -220;
    G.player.skate = 0;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    juice(G.player.x, G.player.y - 12, MAG, 1.4);
    hitStop(0.07);
    kick(6.5, 'die');
    if (why === 'hunger') audio.starve();
    else audio.death();
    syncHud();
  }

  function throwAxe() {
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.axeCd > 0) return;
    const p = G.player;
    G.axeCd = AXE_CD * (p.skate > 0 ? 0.78 : 1);
    p.pose = 0.18;
    G.axes.push({
      x: p.x + p.face * 14,
      y: p.y - 16,
      vx: p.face * AXE_SPD,
      vy: -40,
      life: AXE_LIFE,
      spin: 0,
      face: p.face
    });
    audio.throw();
    emit(4, {
      x: p.x + p.face * 16, y: p.y - 16, j: 4,
      vx0: p.face * 40, vx1: p.face * 160, vy0: -80, vy1: 20,
      life: 0.16, r0: 1, r1: 2.2, rgb: SAND, g: 200
    });
  }

  function fruitPop(f) {
    const spec = FRUIT[f.kind] || FRUIT.orange;
    f.taken = true;
    bumpCombo();
    const sc = spec.score * G.mult;
    addScore(sc);
    G.vit = Math.min(VIT_MAX, G.vit + spec.vit);
    G.hungry = false;
    floatText(f.x, f.y - 10, '+' + sc, spec.rgb, f.kind === 'melon');
    juice(f.x, f.y, spec.rgb, f.kind === 'melon' ? 1.35 : 0.95);
    hitStop(f.kind === 'melon' ? 0.055 : 0.032);
    audio.fruit(G.combo);
    if (vitWrap) {
      vitWrap.classList.remove('hot');
      void vitWrap.offsetWidth;
      vitWrap.classList.add('hot');
      vitHotTok += 1;
      const tok = vitHotTok;
      setTimeout(function () {
        if (tok === vitHotTok && vitWrap) vitWrap.classList.remove('hot');
      }, 280);
    }
    G.checkX = f.x;
    G.checkY = platUnder(f.x, f.y + 18, null) ? f.y + 18 : GY;
    syncHud();
  }

  function takeSkate() {
    const s = G.skatePick;
    if (!s || s.taken) return;
    s.taken = true;
    G.player.skate = SKATE_T;
    bumpCombo();
    addScore(SCORE.skate * G.mult);
    juice(s.x, s.y, CYN, 1.1);
    hitStop(0.04);
    audio.skate();
    toast('滑板加速', false, true);
    floatText(s.x, s.y - 12, 'SKATE', CYN, true);
    syncHud();
  }

  function hurtEnt(e, fromAxe) {
    if (e.dead || e.hurt > 0) return;
    e.hp -= 1;
    e.hurt = 0.08;
    const p = G.player;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const base = e.name ? SCORE.boss : (e.kind === 'frog' || e.kind === 'bfrog' ? SCORE.frog : SCORE.snail);
      const sc = base * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 24, '+' + sc, e.name ? GOLD : HOT, !!e.name);
      juice(e.x, e.y - 10, e.name ? LAVA : (e.kind.indexOf('frog') >= 0 ? LEAF : PNK), e.name ? 1.7 : 1.05);
      hitStop(e.name ? 0.07 : 0.055);
      audio.hit(G.combo);
      if (fromAxe && p) p.pose = 0.1;
      if (e.name) {
        G.lock = 0.55;
        G.clearT = 1.15;
        toast(e.name + ' 倒下', false, true);
        screenFlash(GOLD, 0.4);
        kick(5, 'boom');
      }
    } else {
      e.x += (p && p.x < e.x ? 10 : -10);
      juice(e.x, e.y - 12, GOLD, 0.45);
      hitStop(0.038);
      audio.hit(G.combo);
      floatText(e.x, e.y - 22, '-' + e.hp, GOLD, false);
    }
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = pitAhead(p.x, 1) && p.grounded;
    if (G.axeCd <= 0) {
      let i, e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (e.x > p.x && e.x < p.x + 180 && Math.abs(e.y - p.y) < 40) {
          throwAxe();
          break;
        }
      }
    }
    if (p.x > 980) {
      loadStage(1, false);
      G.vit = VIT_MAX;
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

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;
    const skate = p.skate > 0;
    const spd = (skate ? SKATE_SPD : WALK) * (p.grounded ? 1 : AIR);
    p.vx = ax * spd;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      p.x = clamp(p.x, G.arena + 10, G.levelW - 24);
    }

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
      p.squash = 0.76;
      audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -70, vx1: 70, vy0: -20, vy1: 40,
        life: 0.2, r0: 1, r1: 2.2, rgb: skate ? CYN : WHT, g: 200
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
        if (p.vy > 220) {
          audio.land();
          p.squash = 0.82;
          emit(6, {
            x: p.x, y: p.y, j: 10,
            vx0: -90, vx1: 90, vy0: -30, vy1: 10,
            life: 0.2, r0: 1, r1: 2.4, rgb: skate ? CYN : HOT2, g: 180
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
    if (ax && p.grounded) p.run += dt * (skate ? 14 : 9);
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;
    if (p.skate > 0) {
      p.skate -= dt;
      if (p.skate <= 0) {
        p.skate = 0;
        if (playing()) toast('滑板没了', true, false);
      }
      G.sparkT -= dt;
      if (p.grounded && Math.abs(p.vx) > 40 && G.sparkT <= 0) {
        G.sparkT = 0.045;
        emit(2, {
          x: p.x - p.face * 10, y: p.y, j: 4,
          vx0: -p.face * 80, vx1: -p.face * 20, vy0: -90, vy1: -10,
          life: 0.22, r0: 1, r1: 2.4, rgb: CYN, g: 80
        });
        if (Math.random() < 0.18) audio.spark();
      }
    }

    let i;
    for (i = 0; i < G.fruit.length; i++) {
      const f = G.fruit[i];
      if (f.taken) continue;
      if (hypot(p.x - f.x, (p.y - 12) - f.y) < 22) fruitPop(f);
    }
    if (G.skatePick && !G.skatePick.taken && hypot(p.x - G.skatePick.x, p.y - 8 - G.skatePick.y) < 22) {
      takeSkate();
    }

    if (playing() && G.invuln <= 0) {
      for (i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead) continue;
        if (aabb(p.x - PW / 2 + 3, p.y - PH + 4, PW - 6, PH - 6, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          die('hit');
          return;
        }
      }
      const b = G.boss;
      if (b && b.active && !b.dead) {
        if (aabb(p.x - PW / 2 + 3, p.y - PH + 4, PW - 6, PH - 6, b.x - b.w / 2, b.y - b.h, b.w, b.h)) {
          die('hit');
          return;
        }
      }
    }
  }

  function updateAxes(dt) {
    let i, a, j, e;
    for (i = G.axes.length - 1; i >= 0; i--) {
      a = G.axes[i];
      a.life -= dt;
      a.vy += 240 * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.spin += dt * 14 * a.face;
      if (a.life <= 0 || a.y > VH + 40) {
        G.axes.splice(i, 1);
        continue;
      }
      let hit = false;
      for (j = 0; j < G.ents.length; j++) {
        e = G.ents[j];
        if (e.dead) continue;
        if (aabb(a.x - 8, a.y - 8, 16, 16, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          hurtEnt(e, true);
          hit = true;
          break;
        }
      }
      if (!hit && G.boss && G.boss.active && !G.boss.dead) {
        e = G.boss;
        if (aabb(a.x - 8, a.y - 8, 16, 16, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          hurtEnt(e, true);
          hit = true;
        }
      }
      if (hit) {
        emit(8, {
          x: a.x, y: a.y, j: 6,
          vx0: -160, vx1: 160, vy0: -200, vy1: 40,
          life: 0.22, r0: 1, r1: 2.6, rgb: SAND, g: 240
        });
        popSpark(a.x, a.y, GOLD, 12);
        G.axes.splice(i, 1);
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isDash(), G.stage);
    const p = G.player;
    e.t += dt;
    if (e.hurt > 0) e.hurt -= dt;

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

    if (e.kind === 'snail') {
      const spd = 46 * mul;
      const nx = e.x + e.face * spd * dt;
      if (nx < e.a || nx > e.b || !standAt(nx + e.face * 10, e.y)) e.face = -e.face;
      else e.x = nx;
    } else if (e.kind === 'frog') {
      if (e.grounded) {
        e.hop -= dt;
        if (e.hop <= 0) {
          if (Math.abs(p.x - e.x) < 260) e.face = p.x > e.x ? 1 : -1;
          e.vy = -420;
          e.vx = e.face * 140 * mul;
          e.grounded = false;
          e.hop = rand(0.7, 1.35) / mul;
        }
      } else {
        e.x += e.vx * dt;
        e.x = clamp(e.x, e.a, e.b);
      }
    }
  }

  function spawnBlob(b) {
    G.blobs.push({
      x: b.x + b.face * 16,
      y: b.y - 22,
      vx: b.face * 180,
      vy: -220,
      life: 1.6
    });
  }

  function spawnShock(b) {
    G.shocks.push({
      x: b.x, y: GY, vx: b.face * 220, life: 1.1, w: 28
    });
    audio.slam();
    kick(3.2, 'thump');
    emit(10, {
      x: b.x, y: GY, j: 14,
      vx0: -120, vx1: 120, vy0: -160, vy1: -20,
      life: 0.3, r0: 1.5, r1: 3.4, rgb: LAVA, g: 260
    });
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.arena + 40) {
        b.active = true;
        toast('头目现身 · ' + b.name, false, true);
        audio.boss();
        screenFlash(HOT, 0.3);
        kick(3.4, 'boom');
      }
      return;
    }
    b.t += dt;
    if (b.hurt > 0) b.hurt -= dt;
    b.atk -= dt;
    const mul = spdMul(isDash(), G.stage);
    const low = b.hp / b.max < 0.45;

    if (!b.grounded) {
      b.vy += GRAV * dt;
      const y0 = b.y;
      const y1 = b.y + b.vy * dt;
      const plat = landOn(b.x, y0, y1, null);
      if (plat && b.vy >= 0) {
        b.y = plat.y;
        b.vy = 0;
        b.grounded = true;
        if (b.kind === 'brock') spawnShock(b);
      } else b.y = y1;
    }

    if (b.kind === 'bsnail') {
      const charging = b.atk > 0 && b.phase === 1;
      const spd = (charging ? 210 : 58) * mul;
      if (!charging && b.atk <= 0) {
        b.phase = 1;
        b.atk = low ? 0.7 : 0.55;
        b.face = p.x > b.x ? 1 : -1;
      } else if (charging && b.atk <= 0) {
        b.phase = 0;
        b.atk = low ? 1.1 : 1.6;
      }
      const nx = b.x + b.face * spd * dt;
      if (nx < G.arena + 40 || nx > G.levelW - 40) b.face = -b.face;
      else b.x = nx;
    } else if (b.kind === 'bfrog') {
      if (b.grounded && b.atk <= 0) {
        b.face = p.x > b.x ? 1 : -1;
        b.vy = -520;
        b.vx = b.face * 160 * mul;
        b.grounded = false;
        b.atk = low ? 0.9 : 1.35;
        b.phase += 1;
        if (b.phase % 3 === 0) spawnBlob(b);
      } else if (!b.grounded) {
        b.x += b.vx * dt;
        b.x = clamp(b.x, G.arena + 40, G.levelW - 40);
      }
    } else {
      const spd = 70 * mul;
      if (b.grounded && b.atk <= 0) {
        b.face = p.x > b.x ? 1 : -1;
        b.vy = -380;
        b.vx = b.face * 90;
        b.grounded = false;
        b.atk = low ? 1.15 : 1.7;
      } else if (b.grounded) {
        const nx = b.x + b.face * spd * dt;
        if (nx < G.arena + 40 || nx > G.levelW - 40) b.face = -b.face;
        else b.x = nx;
      } else {
        b.x += b.vx * dt;
        b.x = clamp(b.x, G.arena + 40, G.levelW - 40);
      }
    }
  }

  function updateHazards(dt) {
    const p = G.player;
    let i, o;
    for (i = G.blobs.length - 1; i >= 0; i--) {
      o = G.blobs[i];
      o.life -= dt;
      o.vy += 620 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0 || o.y > VH + 20) {
        G.blobs.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && hypot(p.x - o.x, p.y - 12 - o.y) < 16) {
        die('hit');
        G.blobs.splice(i, 1);
      }
    }
    for (i = G.shocks.length - 1; i >= 0; i--) {
      o = G.shocks[i];
      o.life -= dt;
      o.x += o.vx * dt;
      o.w = lerp(o.w, 46, 1 - Math.pow(0.02, dt));
      if (o.life <= 0) {
        G.shocks.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && p.grounded) {
        if (Math.abs(p.x - o.x) < o.w * 0.55 && Math.abs(p.y - o.y) < 10) die('hit');
      }
    }
  }

  function updateFx(dt) {
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
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.32;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    let ty = 0;
    if (p.y < MY - 10) ty = p.y - MY;
    G.camY = lerp(G.camY, clamp(ty, -40, 20), 1 - Math.pow(0.002, dt));
  }

  function update(dt) {
    G.clock += dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0004, dt));

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    if (G.mode === 'title') demoThink();
    if (G.mode === 'win' || G.mode === 'lose') {
      updateFx(dt);
      return;
    }

    if (G.axeCd > 0) G.axeCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }

    if (playing() && G.deadT <= 0 && G.lock <= 0) {
      G.vit -= drainRate(isDash()) * dt;
      if (G.vit < 26 && !G.hungry) {
        G.hungry = true;
        toast('饿了', true, false);
      }
      G.beatT -= dt;
      if (G.vit < 26 && G.beatT <= 0) {
        G.beatT = 0.72;
        audio.hunger();
      }
      if (G.vit <= 0) {
        G.vit = 0;
        die('hunger');
      }
    }

    updatePlayer(dt);
    updateAxes(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateHazards(dt);
    updateFx(dt);
    updateCam(dt);

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0 && G.lock <= 0) nextStage();
    }

    if (vitBar) vitBar.style.transform = 'scaleX(' + clamp(G.vit / VIT_MAX, 0, 1) + ')';
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.stage === 1) {
      g.addColorStop(0, '#1a1028');
      g.addColorStop(0.45, '#3a1830');
      g.addColorStop(1, '#24140c');
    } else if (G.stage === 2) {
      g.addColorStop(0, '#081410');
      g.addColorStop(0.5, '#102418');
      g.addColorStop(1, '#0c180c');
    } else {
      g.addColorStop(0, '#1a0808');
      g.addColorStop(0.5, '#2a1008');
      g.addColorStop(1, '#180804');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const sunX = sx(G.camX + VW * 0.78);
    const sunY = sy(46);
    ctx.fillStyle = rgba(GOLD, G.stage === 3 ? 0.28 : 0.45);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14 * scale, 0, TAU);
    ctx.fill();
  }

  function drawHills() {
    const s = scale;
    let k, x, h;
    ctx.fillStyle = G.stage === 3 ? 'rgba(80, 24, 12, 0.55)' : G.stage === 2 ? 'rgba(12, 40, 22, 0.55)' : 'rgba(48, 22, 28, 0.5)';
    ctx.beginPath();
    ctx.moveTo(ox, oy + VH * s);
    for (k = 0; k <= 12; k++) {
      x = ox + (k / 12) * VW * s;
      h = 70 + hash2(k * 17 + G.stage * 9) * 50;
      ctx.lineTo(x, sy(GY - 40) - h * s * 0.25 + (G.camX * 0.08 % 40));
    }
    ctx.lineTo(ox + VW * s, oy + VH * s);
    ctx.fill();

    const start = ((G.camX * 0.35) / 90 | 0) - 1;
    for (k = start; k < start + 12; k++) {
      x = (k * 90) - (G.camX * 0.35 % 90);
      const px = ox + x * s;
      const base = sy(GY - 8);
      const tall = 48 + hash2(k * 3 + 2) * 36;
      ctx.fillStyle = G.stage === 3 ? rgba(LAVA, 0.18) : rgba(LEAF, G.stage === 2 ? 0.28 : 0.18);
      ctx.beginPath();
      ctx.moveTo(px, base);
      ctx.lineTo(px + 8 * s, base - tall * s);
      ctx.lineTo(px + 16 * s, base);
      ctx.fill();
      ctx.fillStyle = G.stage === 3 ? rgba(HOT, 0.35) : rgba(LEAF, 0.55);
      ctx.beginPath();
      ctx.ellipse(px + 8 * s, base - tall * s, 16 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawPlats() {
    const s = scale;
    let i, p, x, y, w, h, k, n;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * s;
      h = p.h * s;
      ctx.fillStyle = p.base ? (G.stage === 3 ? '#2a1008' : '#1a1208') : '#201408';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? HOT : GOLD, p.base ? 0.85 : 0.55);
      ctx.fillRect(x, y, w, 2.4 * s);
      ctx.fillStyle = rgba(CYN, 0.18);
      ctx.fillRect(x + 2 * s, y + 2.4 * s, w - 4 * s, 1.1 * s);
      if (p.base) {
        n = Math.max(2, (p.w / 28) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.22) : rgba(SAND, 0.28);
          ctx.fillRect(x + (k / n) * w, y, 2 * s, 5 * s);
        }
        if (G.stage === 3) {
          ctx.fillStyle = rgba(LAVA, 0.22 + Math.sin(G.clock * 4 + p.x) * 0.08);
          ctx.fillRect(x, y + h - 8 * s, w, 8 * s);
        }
      }
    }
  }

  function drawFruit(f) {
    if (f.taken) return;
    const bob = Math.sin(G.clock * 4 + f.t) * 3;
    const x = sx(f.x);
    const y = sy(f.y + bob);
    const s = scale;
    const spec = FRUIT[f.kind] || FRUIT.orange;
    ctx.fillStyle = rgba(spec.rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 11 * s, 0, TAU);
    ctx.fill();
    if (f.kind === 'banana') {
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 3.2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y + 1 * s, 6 * s, 0.4, 2.5);
      ctx.stroke();
    } else if (f.kind === 'melon') {
      ctx.fillStyle = rgba(LEAF, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 7.2 * s, 6 * s, 0.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.55);
      ctx.lineWidth = 1.1 * s;
      ctx.beginPath();
      ctx.moveTo(x - 5 * s, y - 2 * s);
      ctx.lineTo(x + 5 * s, y + 2 * s);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(spec.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 6.2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.9);
      ctx.fillRect(x - 1 * s, y - 9 * s, 2 * s, 4 * s);
    }
  }

  function drawSkatePick() {
    const u = G.skatePick;
    if (!u || u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(G.clock * 5) * 3);
    const s = scale;
    ctx.fillStyle = rgba(CYN, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y, 11 * s, 3.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(x - 7 * s, y + 2 * s, 2 * s, 0, TAU);
    ctx.arc(x + 7 * s, y + 2 * s, 2 * s, 0, TAU);
    ctx.fill();
  }

  function drawAxe(a) {
    const x = sx(a.x);
    const y = sy(a.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a.spin);
    ctx.strokeStyle = rgba(SAND, 0.95);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(-7 * s, 0);
    ctx.lineTo(6 * s, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.beginPath();
    ctx.moveTo(4 * s, -6 * s);
    ctx.lineTo(10 * s, 0);
    ctx.lineTo(4 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSnail(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale * (e.name ? 1.7 : 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.ellipse(2 * s, -4 * s, 8 * s, 4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(SAND, 0.95);
    ctx.beginPath();
    ctx.arc(-2 * s, -10 * s, 8 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.85);
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.arc(-2 * s, -10 * s, 5 * s, 0.4, 3.4);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(6 * s, -8 * s, 2.2 * s, 1.6 * s);
    ctx.restore();
  }

  function drawFrog(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale * (e.name ? 1.65 : 1);
    const squat = e.grounded ? 1 : 0.82;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, squat);
    ctx.fillStyle = rgba(LEAF, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -8 * s, 11 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.beginPath();
    ctx.ellipse(2 * s, -6 * s, 6 * s, 4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(4 * s, -14 * s, 3.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#102018';
    ctx.beginPath();
    ctx.arc(5 * s, -14 * s, 1.4 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawRock(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale * 1.55;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(SAND, 0.95);
    ctx.beginPath();
    ctx.moveTo(-16 * s, 0);
    ctx.lineTo(-12 * s, -28 * s);
    ctx.lineTo(8 * s, -32 * s);
    ctx.lineTo(16 * s, -8 * s);
    ctx.lineTo(10 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(LAVA, 0.9);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(-6 * s, -6 * s);
    ctx.lineTo(2 * s, -18 * s);
    ctx.lineTo(8 * s, -8 * s);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.arc(4 * s, -20 * s, 2.4 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBoy(p) {
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    const s = scale;
    const sq = p.squash || 1;
    const skate = p.skate > 0;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const leg = Math.sin(p.run) * (skate ? 2 : 5) * s;
    if (skate) {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 1.5 * s, 13 * s, 3.2 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(-8 * s, 3 * s, 2.1 * s, 0, TAU);
      ctx.arc(8 * s, 3 * s, 2.1 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.55 + Math.sin(G.clock * 24) * 0.25);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(-12 * s, 4 * s);
      ctx.lineTo(-18 * s, 1 * s);
      ctx.moveTo(-10 * s, 5 * s);
      ctx.lineTo(-16 * s, 8 * s);
      ctx.stroke();
    } else {
      ctx.strokeStyle = rgba(HOT, 0.95);
      ctx.lineWidth = 2.1 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3 * s, -8 * s);
      ctx.lineTo(-4 * s + (p.grounded ? -leg : 2 * s), 0);
      ctx.moveTo(3 * s, -8 * s);
      ctx.lineTo(4 * s + (p.grounded ? leg : -2 * s), 0);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -10 * s);
    ctx.lineTo(7 * s, -11 * s);
    ctx.lineTo(5 * s, -22 * s);
    ctx.lineTo(-5 * s, -21 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(LEAF, 0.7);
    ctx.fillRect(-6 * s, -12 * s, 12 * s, 2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -27 * s, 6.4 * s, 6.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -31 * s, 7 * s, 4.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(2.4 * s, -27 * s, 1.3 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(SKIN, 0.9);
    ctx.lineWidth = 1.8 * s;
    const throwP = p.pose > 0;
    ctx.beginPath();
    ctx.moveTo(2 * s, -18 * s);
    ctx.lineTo(throwP ? 14 * s : 6 * s, throwP ? -20 * s : -14 * s);
    ctx.stroke();
    if (throwP) {
      ctx.save();
      ctx.translate(14 * s, -20 * s);
      ctx.rotate(-0.4);
      ctx.fillStyle = rgba(SAND, 0.95);
      ctx.fillRect(-2 * s, -1 * s, 8 * s, 2 * s);
      ctx.fillStyle = rgba(HOT2, 0.95);
      ctx.beginPath();
      ctx.moveTo(5 * s, -4 * s);
      ctx.lineTo(10 * s, 0);
      ctx.lineTo(5 * s, 4 * s);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBlob(o) {
    const x = sx(o.x);
    const y = sy(o.y);
    const s = scale;
    ctx.fillStyle = rgba(LEAF, 0.9);
    ctx.beginPath();
    ctx.arc(x, y, 6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.5);
    ctx.beginPath();
    ctx.arc(x - 1.5 * s, y - 1.5 * s, 2 * s, 0, TAU);
    ctx.fill();
  }

  function drawShock(o) {
    const x = sx(o.x);
    const y = sy(o.y);
    const s = scale;
    ctx.fillStyle = rgba(LAVA, 0.55);
    ctx.beginPath();
    ctx.ellipse(x, y - 4 * s, o.w * 0.55 * s, 6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.8);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x - o.w * 0.4 * s, y - 10 * s);
    ctx.lineTo(x, y - 22 * s);
    ctx.lineTo(x + o.w * 0.4 * s, y - 10 * s);
    ctx.stroke();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, ox + VW * 0.5 * scale, y - 3 * scale);
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
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0803';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const sh = REDUCE ? 0 : G.shake;
    if (sh > 0) {
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh * 0.7);
    }
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(ox + VW * scale * 0.5, oy + VH * scale * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-(ox + VW * scale * 0.5), -(oy + VH * scale * 0.5));
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawHills();
    drawPlats();

    let i;
    for (i = 0; i < G.fruit.length; i++) drawFruit(G.fruit[i]);
    drawSkatePick();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'frog') drawFrog(e);
      else drawSnail(e);
    }
    if (G.boss && !G.boss.dead) {
      if (G.boss.kind === 'bfrog') drawFrog(G.boss);
      else if (G.boss.kind === 'brock') drawRock(G.boss);
      else drawSnail(G.boss);
    }
    for (i = 0; i < G.blobs.length; i++) drawBlob(G.blobs[i]);
    for (i = 0; i < G.shocks.length; i++) drawShock(G.shocks[i]);
    for (i = 0; i < G.axes.length; i++) drawAxe(G.axes[i]);
    if (G.player) drawBoy(G.player);
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

  function primaryAction() {
    if (G.mode === 'title') startGame('isle');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
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
      startGame('isle');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('dash');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (playing() || G.mode === 'title') throwAxe();
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
    hold(document.getElementById('btn-axe'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      throwAxe();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      throwAxe();
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
    G.t += dt;
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

  if (btnIsle) {
    btnIsle.addEventListener('click', function () {
      audio.ensure();
      startGame('isle');
    });
  }
  if (btnDash) {
    btnDash.addEventListener('click', function () {
      audio.ensure();
      startGame('dash');
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
      if (G.mode === 'win') startGame('dash');
      else goTitle();
    });
  }
  if (modeIsle) {
    modeIsle.addEventListener('click', function () {
      audio.ensure();
      startGame('isle');
    });
  }
  if (modeDash) {
    modeDash.addEventListener('click', function () {
      audio.ensure();
      startGame('dash');
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
