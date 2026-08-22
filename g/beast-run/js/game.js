'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const GY = 310;
  const PY = 228;
  const AIR = 0.86;
  const JUMP_V = 520;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const INVULN = 1.18;
  const DIE_T = 0.74;
  const ORB_RISE = 3;
  const ORB_RAGE = 5;
  const BEST_KEY = 'playbox-beast-run-best';
  const MUTE_KEY = 'playbox-beast-run-mute';
  const OPS = '方向键 / WASD 走跳 · 空格拳脚 · R 重开 · M 静音';

  const MAG = [255, 61, 138];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 34];
  const HOT2 = [255, 176, 96];
  const WHT = [246, 241, 234];
  const GRN = [96, 210, 110];
  const PUR = [168, 92, 255];
  const SKIN = [232, 176, 112];
  const FUR = [196, 118, 52];
  const TEAL = [64, 220, 180];
  const WOLF = [230, 230, 236];

  const FORMS = {
    human: { name: '人形', hp: 3, w: 16, h: 32, walk: 216, jump: 520, dmg: 1, melee: 40, cd: 0.2, rgb: HOT },
    wolf: { name: '狼人', hp: 5, w: 22, h: 36, walk: 248, jump: 540, dmg: 2, melee: 48, cd: 0.26, rgb: [255, 140, 64] },
    dragon: { name: '飞龙', hp: 5, w: 28, h: 28, walk: 232, jump: 510, dmg: 2, melee: 52, cd: 0.34, rgb: TEAL },
    bear: { name: '巨熊', hp: 7, w: 30, h: 40, walk: 176, jump: 500, dmg: 3, melee: 56, cd: 0.4, rgb: [210, 140, 70] },
    tiger: { name: '白虎', hp: 6, w: 24, h: 34, walk: 268, jump: 560, dmg: 2, melee: 50, cd: 0.3, rgb: [255, 170, 70] }
  };

  const SCORE = {
    zombie: 100, head: 150, wolf: 300,
    tri: 4200, tent: 5200, golem: 6400, mage: 8000,
    orb: 200, stage: 2000, clear: 8000
  };

  const STAGES = [
    {
      name: '墓园', form: 'wolf', boss: '三头', bossKind: 'tri', w: 2080, hp: 12,
      plats: [[200, PY, 130], [640, PY, 110], [1180, PY, 140]],
      orbs: [[240, PY - 22], [1220, PY - 22]],
      ents: [
        [260, 'zombie'], [380, 'zombie'], [500, 'wolf'],
        [620, 'head'], [760, 'zombie'], [900, 'head'],
        [1040, 'zombie'], [1160, 'wolf'], [1320, 'zombie'],
        [1460, 'head'], [1580, 'zombie'], [1720, 'wolf'], [1860, 'zombie']
      ]
    },
    {
      name: '沼泽', form: 'dragon', boss: '触腕', bossKind: 'tent', w: 2240, hp: 16,
      plats: [[180, PY, 120], [560, PY - 16, 100], [980, PY, 130], [1480, PY, 120]],
      orbs: [[210, PY - 22], [1020, PY - 22]],
      ents: [
        [240, 'zombie'], [360, 'head'], [480, 'wolf'], [640, 'zombie'],
        [780, 'head'], [920, 'zombie'], [1080, 'wolf'], [1220, 'head'],
        [1360, 'zombie'], [1500, 'wolf'], [1640, 'zombie'], [1780, 'head'],
        [1920, 'zombie'], [2040, 'wolf']
      ]
    },
    {
      name: '神殿', form: 'bear', boss: '石魔', bossKind: 'golem', w: 2400, hp: 20,
      plats: [[220, PY, 110], [700, PY, 140], [1260, PY - 10, 120], [1780, PY, 130]],
      orbs: [[250, PY - 22], [1300, PY - 32]],
      ents: [
        [260, 'zombie'], [400, 'head'], [540, 'wolf'], [700, 'zombie'],
        [860, 'head'], [1000, 'zombie'], [1140, 'wolf'], [1300, 'head'],
        [1460, 'zombie'], [1600, 'wolf'], [1760, 'zombie'], [1900, 'head'],
        [2040, 'zombie'], [2160, 'wolf'], [2260, 'zombie']
      ]
    },
    {
      name: '王座', form: 'tiger', boss: '魔神', bossKind: 'mage', w: 2560, hp: 26,
      plats: [[200, PY, 120], [620, PY, 110], [1100, PY, 140], [1680, PY, 120], [2100, PY, 100]],
      orbs: [[230, PY - 22], [1140, PY - 22], [2140, PY - 22]],
      ents: [
        [250, 'zombie'], [380, 'head'], [520, 'wolf'], [680, 'zombie'],
        [820, 'head'], [980, 'wolf'], [1140, 'zombie'], [1280, 'head'],
        [1440, 'zombie'], [1580, 'wolf'], [1740, 'head'], [1880, 'zombie'],
        [2020, 'wolf'], [2160, 'head'], [2300, 'zombie'], [2420, 'wolf']
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
  function isRage() {
    return G.kind === 'rage';
  }
  function orbNeed() {
    return isRage() ? ORB_RAGE : ORB_RISE;
  }
  function spdMul() {
    return (isRage() ? 1.32 : 1) * (1 + Math.max(0, G.stage - 1) * 0.06);
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
    if (STAGES.length !== 4) throw new Error('4 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (ORB_RISE !== 3 || ORB_RAGE !== 5) throw new Error('orb counts');
    if (ORB_RAGE <= ORB_RISE) throw new Error('rage more orbs');
    const h = jumpHeight();
    if (h < 80 || h > 110) throw new Error('jump height ' + h);
    if (GY - PY < 70) throw new Error('plat height');
    if (BEST_KEY !== 'playbox-beast-run-best') throw new Error('best key');
    const forms = ['wolf', 'dragon', 'bear', 'tiger'];
    let i;
    for (i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      if (s.form !== forms[i]) throw new Error('form ' + s.name);
      if (!FORMS[s.form]) throw new Error('missing form');
      if (s.w < 1800) throw new Error('stage width');
      if (s.hp < 10) throw new Error('boss hp');
      const wolves = s.ents.filter(function (e) { return e[1] === 'wolf'; }).length;
      if (wolves + s.orbs.length < ORB_RAGE) throw new Error('not enough orbs ' + s.name);
    }
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss scale');
    if (FORMS.human.hp >= FORMS.wolf.hp) throw new Error('beast tankier');
    if (FORMS.bear.dmg <= FORMS.human.dmg) throw new Error('bear punch');
    if (spdMul.__no) throw new Error('spd');
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
  const btnRise = document.getElementById('btn-rise');
  const btnRage = document.getElementById('btn-rage');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeRise = document.getElementById('mode-rise');
  const modeRage = document.getElementById('mode-rage');
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
  const formLabel = document.getElementById('form-label');
  const hpWrap = document.getElementById('hp-wrap');
  const hpFill = document.getElementById('hp-fill');
  const orbsEl = document.getElementById('orbs');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');
  const bannerEl = document.getElementById('banner');

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
  let bannerTok = 0;
  let hpTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const demo = { l: false, r: true, u: false, a: false };
  const pips = [];
  const orbDots = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const bolts = [];

  const G = {
    mode: 'title',
    kind: 'rise',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2080,
    plats: [],
    ents: [],
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
    form: 'human',
    orbsGot: 0,
    need: ORB_RISE,
    hp: 3,
    maxHp: 3,
    atkCd: 0,
    slashT: 0,
    swing: 0,
    breathT: 0,
    beamT: 0,
    morphT: 0,
    stomp: false,
    fuel: 1.6,
    jumpBuf: 0,
    jumpHeld: false,
    dropT: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    bannerT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    lock: 0,
    why: '',
    gate: 1860,
    checkX: 70
  };

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
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }
  function formSpec() {
    return FORMS[G.form] || FORMS.human;
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
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
      this.beep(260, 0.06, 'square', 0.042, 580);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 480);
      this.beep(130, 0.05, 'triangle', 0.022, 70);
    },
    punch() {
      this.ensure();
      this.noise(0.045, 0.038, 900);
      this.beep(220, 0.07, 'square', 0.05, 110);
    },
    kick() {
      this.ensure();
      this.noise(0.05, 0.04, 700);
      this.beep(180, 0.08, 'sawtooth', 0.046, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.045);
      this.noise(0.04, 0.04, 1000);
      this.beep(480 * lift, 0.07, 'square', 0.048, 820 * lift);
    },
    orb(n) {
      this.ensure();
      const f = 520 + n * 160;
      this.beep(f, 0.09, 'sine', 0.05, f * 1.6);
      this.beep(f * 1.5, 0.12, 'triangle', 0.036, f * 2.1);
    },
    morph() {
      this.ensure();
      this.noise(0.28, 0.09, 180);
      this.beep(90, 0.42, 'sawtooth', 0.07, 40);
      this.beep(220, 0.22, 'square', 0.05, 70);
      this.beep(440, 0.18, 'triangle', 0.04, 880);
    },
    roar() {
      this.ensure();
      this.noise(0.18, 0.07, 240);
      this.beep(140, 0.26, 'sawtooth', 0.06, 60);
      this.beep(320, 0.14, 'square', 0.035, 180);
    },
    fire() {
      this.ensure();
      this.noise(0.08, 0.045, 600);
      this.beep(340, 0.1, 'sawtooth', 0.04, 160);
    },
    breath() {
      this.ensure();
      this.noise(0.22, 0.07, 320);
      this.beep(180, 0.2, 'sawtooth', 0.05, 70);
    },
    slam() {
      this.ensure();
      this.noise(0.12, 0.08, 200);
      this.beep(70, 0.16, 'sine', 0.06, 40);
    },
    beam() {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.045, 1400);
      this.beep(220, 0.16, 'sawtooth', 0.04, 90);
      this.noise(0.1, 0.04, 1800);
    },
    hurt() {
      this.ensure();
      this.noise(0.08, 0.05, 400);
      this.beep(240, 0.1, 'sawtooth', 0.045, 80);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 280);
      this.beep(200, 0.22, 'sawtooth', 0.05, 60);
      this.beep(90, 0.3, 'sine', 0.04, 36);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    boss() {
      this.ensure();
      this.beep(160, 0.2, 'sawtooth', 0.055, 70);
      this.beep(90, 0.32, 'square', 0.04, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(180, 0.2, 'sawtooth', 0.04, 70);
      this.beep(100, 0.32, 'sine', 0.05, 40);
    },
    start() {
      this.ensure();
      this.beep(196, 0.1, 'square', 0.04, 392);
      this.beep(392, 0.16, 'triangle', 0.04, 784);
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
    empty() {
      this.ensure();
      this.beep(150, 0.07, 'square', 0.028, 80);
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

  function banner(msg, hot) {
    G.bannerT = 1.45;
    bannerTok += 1;
    if (!bannerEl) return;
    bannerEl.textContent = msg;
    bannerEl.classList.toggle('hot', !!hot);
    bannerEl.classList.remove('hidden');
    bannerEl.style.animation = 'none';
    void bannerEl.offsetWidth;
    bannerEl.style.animation = '';
    const tok = bannerTok;
    setTimeout(function () {
      if (tok === bannerTok && bannerEl) bannerEl.classList.add('hidden');
    }, 1450);
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

  function syncOrbs() {
    if (!orbsEl) return;
    const n = G.need;
    while (orbDots.length < n) {
      const el = document.createElement('span');
      el.className = 'orb';
      orbsEl.appendChild(el);
      orbDots.push(el);
    }
    while (orbDots.length > n) {
      const el = orbDots.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < orbDots.length; i++) {
      orbDots[i].classList.toggle('on', i < G.orbsGot);
    }
  }

  function flashOrb(i) {
    const el = orbDots[i];
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  function syncHp() {
    if (!hpFill) return;
    const t = G.maxHp > 0 ? clamp(G.hp / G.maxHp, 0, 1) : 0;
    hpFill.style.transform = 'scaleX(' + t + ')';
    if (hpWrap) {
      hpWrap.classList.toggle('low', G.hp <= 1 && playing());
    }
  }

  function bumpHp() {
    if (!hpWrap) return;
    hpWrap.classList.remove('hit');
    void hpWrap.offsetWidth;
    hpWrap.classList.add('hit');
    hpTok += 1;
    const tok = hpTok;
    setTimeout(function () {
      if (tok === hpTok && hpWrap) hpWrap.classList.remove('hit');
    }, 220);
  }

  function syncModes() {
    const rage = isRage();
    if (modeRise) modeRise.setAttribute('aria-pressed', rage ? 'false' : 'true');
    if (modeRage) modeRage.setAttribute('aria-pressed', rage ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isRage() ? '狂化 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isRage() ? '狂化' : '复苏';
      tagLabel.classList.toggle('warn', isRage());
    }
    if (formLabel) {
      formLabel.textContent = formSpec().name;
      formLabel.classList.toggle('beast', G.form !== 'human' && playing());
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 血空丢命 · 顶栏重开随时可用', 'warn');
    else if (G.mode === 'win') setHint('王座已破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 收灵珠兽化', 'warn');
    else if (G.form === 'human') setHint('收齐灵珠兽化 · 空格拳脚', '');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · 兽技开打', 'hot');
    else setHint('兽化中 · 空格使出兽技', 'hot');
    syncPips();
    syncOrbs();
    syncHp();
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
      ovKicker.textContent = kind === 'lose' ? 'FALLEN' : kind === 'win' ? 'BEAST' : 'BEAST';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用 · 弹层不挡顶栏';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '狂化' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'morph');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'morph');
      }
    }, 420);
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
      vx0: -220 * p, vx1: 220 * p, vy0: -300 * p, vy1: -20 * p,
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
    const f = formSpec();
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: f.w, h: f.h,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0
    };
  }

  function applyForm() {
    const f = formSpec();
    const p = G.player;
    if (!p) return;
    p.w = f.w;
    p.h = f.h;
    G.maxHp = f.hp;
  }

  function makePlat(x, y, w) {
    return { x: x, y: y, w: w, h: 12 };
  }

  function entHp(kind) {
    const extra = isRage() ? 1 : 0;
    if (kind === 'wolf') return 3 + extra;
    if (kind === 'zombie') return 2 + extra;
    return 1 + extra;
  }

  function makeEnt(x, kind) {
    const hp = entHp(kind);
    const buried = kind === 'zombie';
    return {
      x: x, y: GY, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      t: rand(0, 1), fire: rand(0.4, 1.2),
      grounded: true, dead: false, hitN: 0,
      w: kind === 'head' ? 14 : kind === 'wolf' ? 22 : 16,
      h: kind === 'head' ? 14 : kind === 'wolf' ? 20 : 28,
      state: buried ? 'buried' : 'walk',
      rise: 0, hitCd: 0, swing: -1
    };
  }

  function makeBoss(spec) {
    return {
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: spec.hp + (isRage() ? 4 : 0),
      max: spec.hp + (isRage() ? 4 : 0),
      kind: spec.bossKind, name: spec.boss,
      t: 0, fire: 1.0, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 28, h: 42, swing: -1
    };
  }

  function spawnPickup(x, y) {
    G.pickups.push({ x: x, y: y, taken: false, t: rand(0, TAU) });
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.plats = [];
    let i;
    for (i = 0; i < spec.plats.length; i++) {
      const p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2]));
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      G.ents.push(makeEnt(spec.ents[i][0], spec.ents[i][1]));
    }
    if (isRage() && !attract) {
      for (i = 0; i < spec.ents.length; i += 3) {
        const src = spec.ents[i];
        const nx = src[0] + 48;
        if (nx < spec.w - 280) G.ents.push(makeEnt(nx, src[1] === 'wolf' ? 'zombie' : src[1]));
      }
    }
    G.pickups = [];
    for (i = 0; i < spec.orbs.length; i++) {
      spawnPickup(spec.orbs[i][0], spec.orbs[i][1]);
    }
    bolts.length = 0;
    G.boss = makeBoss(spec);
    G.gate = spec.w - 280;
    G.checkX = 70;
    G.form = 'human';
    G.orbsGot = 0;
    G.need = orbNeed();
    G.hp = FORMS.human.hp;
    G.maxHp = FORMS.human.hp;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.slashT = 0;
    G.atkCd = 0;
    G.breathT = 0;
    G.beamT = 0;
    G.morphT = 0;
    G.stomp = false;
    G.fuel = 1.6;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.lock = 0;
    G.dropT = 0;
    G.jumpBuf = 0;
    G.swing = 0;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    }
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rage' ? 'rage' : 'rise';
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
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast('从坟中起来！', false, true);
    banner('从坟中起来', true);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'rise';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '兽化', '从坟中起来。拳脚开路，收齐灵珠兽化。变身才是爽点，关底有头目。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('rise');
    else startGame(G.kind || 'rise');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('rise');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'hit' ? '被击中了' : '力竭了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 连击最高 ×' + G.maxCombo + ' · R 重开');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    G.score += SCORE.clear;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    audio.win();
    if (stageEl) {
      stageEl.classList.remove('win-flash');
      void stageEl.offsetWidth;
      stageEl.classList.add('win-flash');
    }
    showOverlay('win', '王座已破', '分数 ' + G.score + ' · 连击最高 ×' + G.maxCombo + (isRage() ? '' : ' · 试试狂化'));
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    G.form = 'human';
    G.orbsGot = 0;
    G.combo = 0;
    G.mult = 1;
    loadStage(G.stage, false);
    audio.stage();
    const spec = STAGES[G.stage - 1];
    toast(spec.name, false, true);
    banner(spec.name, false);
    syncHud();
  }

  function respawn() {
    G.form = 'human';
    G.orbsGot = 0;
    G.hp = FORMS.human.hp;
    G.maxHp = FORMS.human.hp;
    G.player = makePlayer(G.checkX, GY);
    G.invuln = 1.35;
    G.deadT = 0;
    G.lock = 0;
    G.morphT = 0;
    G.stomp = false;
    G.breathT = 0;
    G.beamT = 0;
    applyForm();
    toast('再起', true, false);
    syncHud();
  }

  function hurtPlayer() {
    if (!playing() || G.deadT > 0 || G.invuln > 0 || G.morphT > 0) return;
    G.hp -= 1;
    G.invuln = INVULN;
    bumpHp();
    syncHp();
    const p = G.player;
    p.vx = -p.face * 200;
    p.vy = -220;
    p.grounded = false;
    juice(p.x, p.y - 16, MAG, 0.7);
    kick(4.4, 'hit');
    audio.hurt();
    hitStop(0.05);
    if (G.hp <= 0) die('hit');
    else syncHud();
  }

  function die(why) {
    if (G.deadT > 0) return;
    G.why = why || 'hit';
    G.lives -= 1;
    G.deadT = DIE_T;
    G.hp = 0;
    G.form = 'human';
    G.orbsGot = 0;
    G.player.vy = -80;
    juice(G.player.x, G.player.y - 18, MAG, 1.1);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    audio.death();
    syncHud();
  }

  function landY(x, y0, y1, dropPlat) {
    if (y1 < y0) return null;
    let best = null;
    let i;
    for (i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (dropPlat && p === dropPlat) continue;
      if (x < p.x - 6 || x > p.x + p.w + 6) continue;
      if (y0 <= p.y + 2 && y1 >= p.y) {
        if (!best || p.y < best) best = p.y;
      }
    }
    if (y0 <= GY + 2 && y1 >= GY) {
      if (!best || GY < best) best = GY;
    }
    return best;
  }

  function platUnder(x, y) {
    let i;
    for (i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (x >= p.x - 6 && x <= p.x + p.w + 6 && Math.abs(y - p.y) < 6) return p;
    }
    return null;
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.5, y: p.y - p.h, w: p.w, h: p.h };
  }

  function meleeBox() {
    const p = G.player;
    const f = formSpec();
    const range = f.melee + (p.grounded ? 0 : 10);
    const x = p.face > 0 ? p.x + 2 : p.x - 2 - range;
    const y = p.y - f.h + (p.grounded ? 6 : 12);
    return { x: x, y: y, w: range, h: f.h * 0.72 };
  }

  function tryMelee(dmg) {
    const b = meleeBox();
    let hit = false;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead || e.state === 'buried') continue;
      if (e.swing === G.swing) continue;
      if (overlap(b.x, b.y, b.w, b.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        e.swing = G.swing;
        hurtEnt(e, dmg);
        hit = true;
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead && G.boss.swing !== G.swing) {
      const o = G.boss;
      if (overlap(b.x, b.y, b.w, b.h, o.x - o.w * 0.5, o.y - o.h, o.w, o.h)) {
        o.swing = G.swing;
        hurtEnt(o, dmg);
        hit = true;
      }
    }
    return hit;
  }

  function spawnBolt(spec) {
    bolts.push({
      kind: spec.kind,
      x: spec.x, y: spec.y,
      vx: spec.vx || 0, vy: spec.vy || 0,
      life: spec.life || 0.8,
      dmg: spec.dmg || 1,
      from: spec.from || 'p',
      face: spec.face || 1,
      r: spec.r || 6,
      spin: 0,
      w: spec.w || 12,
      h: spec.h || 8
    });
    capArr(bolts, 40);
  }

  function attack() {
    if (!live()) return;
    if (G.mode === 'title') {
      if (G.atkCd > 0) return;
    } else if (!playing()) return;
    if (G.deadT > 0 || G.morphT > 0 || G.lock > 0 || G.clearT > 0) return;
    if (G.atkCd > 0) return;
    const p = G.player;
    const f = formSpec();
    G.atkCd = f.cd;
    G.slashT = 0.2;
    G.swing += 1;
    p.pose = 1;
    const air = !p.grounded;
    if (G.form === 'human') {
      if (air) audio.kick();
      else audio.punch();
      const hit = tryMelee(f.dmg);
      if (hit) {
        hitStop(0.055);
        kick(2.6, 'thump');
      }
    } else if (G.form === 'wolf') {
      audio.fire();
      tryMelee(f.dmg);
      spawnBolt({
        kind: 'fire', from: 'p',
        x: p.x + p.face * 18, y: p.y - 22,
        vx: p.face * 310, dmg: 2, life: 1.05, r: 8, face: p.face
      });
      emit(8, {
        x: p.x + p.face * 16, y: p.y - 22, j: 4,
        vx0: p.face * 40, vx1: p.face * 180, vy0: -80, vy1: 40,
        life: 0.22, r0: 1.4, r1: 3.2, rgb: HOT
      });
    } else if (G.form === 'dragon') {
      audio.breath();
      G.breathT = 0.4;
      screenFlash(HOT, 0.18);
    } else if (G.form === 'bear') {
      audio.slam();
      if (air) {
        G.stomp = true;
        p.vy = 640;
      } else {
        tryMelee(f.dmg);
        spawnBolt({
          kind: 'wave', from: 'p',
          x: p.x + p.face * 20, y: GY - 10,
          vx: p.face * 240, dmg: 2, life: 0.55, r: 16, face: p.face, w: 22, h: 16
        });
        popSpark(p.x + p.face * 18, GY - 8, GOLD, 22);
        hitStop(0.06);
        kick(4.2, 'thump');
        screenFlash(GOLD, 0.16);
      }
    } else if (G.form === 'tiger') {
      audio.beam();
      G.beamT = 0.22;
      spawnBolt({
        kind: 'beam', from: 'p',
        x: p.x + p.face * 24, y: p.y - 20,
        vx: p.face * 620, dmg: 3, life: 0.28, r: 7, face: p.face, w: 36, h: 8
      });
      screenFlash(CYN, 0.2);
      kick(2.8, 'boom');
    }
  }

  function bearLandSlam() {
    const p = G.player;
    G.stomp = false;
    tryMelee(FORMS.bear.dmg);
    spawnBolt({
      kind: 'wave', from: 'p',
      x: p.x, y: GY - 10,
      vx: 0, dmg: 3, life: 0.35, r: 28, face: p.face, w: 48, h: 18
    });
    juice(p.x, GY - 8, GOLD, 1.15);
    hitStop(0.07);
    kick(5.2, 'thump');
    audio.slam();
  }

  function hurtEnt(e, dmg) {
    if (!e || e.dead) return false;
    if (e.state === 'buried') return false;
    if (e.hitCd > 0) return false;
    e.hp -= dmg;
    e.hitN = 0.1;
    e.hitCd = 0.11;
    const p = G.player;
    e.x += (p ? p.face : 1) * (e === G.boss ? 5 : 12);
    bumpCombo();
    const cx = e.x;
    const cy = e.y - e.h * 0.5;
    if (e.hp <= 0) {
      e.dead = true;
      const base = SCORE[e.kind] || 100;
      addScore(base * G.mult);
      floatText(cx, cy - 8, '+' + (base * G.mult), GOLD, e === G.boss);
      juice(cx, cy, e === G.boss ? GOLD : HOT, e === G.boss ? 1.4 : 0.85);
      hitStop(e === G.boss ? 0.075 : 0.048);
      audio.hit(G.combo);
      if (e.kind === 'wolf') spawnPickup(e.x, e.y - 26);
      if (e === G.boss) onBossDead();
    } else {
      addScore(20 * G.mult);
      popSpark(cx, cy, HOT2, 12);
      floatText(cx, cy - 6, '+' + (20 * G.mult), HOT2, false);
      hitStop(0.032);
      audio.hit(G.combo);
    }
    return true;
  }

  function onBossDead() {
    const spec = STAGES[G.stage - 1];
    addScore(SCORE.stage * G.mult);
    G.clearT = 1.7;
    G.lock = 1.7;
    banner(spec.name + '已破', false);
    toast(spec.boss + '倒下', false, true);
    if (G.stage >= STAGES.length) audio.win();
    else audio.stage();
    if (stageEl) {
      stageEl.classList.remove('win-flash');
      void stageEl.offsetWidth;
      stageEl.classList.add('win-flash');
    }
  }

  function collectOrb(pk) {
    if (pk.taken) return;
    pk.taken = true;
    const p = G.player;
    juice(pk.x, pk.y, GOLD, 0.7);
    popSpark(pk.x, pk.y, CYN, 16);
    floatText(pk.x, pk.y - 10, '+灵珠', GOLD, true);
    addScore(SCORE.orb * G.mult);
    audio.orb(G.orbsGot + 1);
    kick(2.2, 'hit');
    if (G.form !== 'human') {
      if (G.hp < G.maxHp) {
        G.hp += 1;
        toast('回血', false, true);
      }
      syncHud();
      return;
    }
    G.orbsGot = Math.min(G.need, G.orbsGot + 1);
    flashOrb(G.orbsGot - 1);
    syncOrbs();
    if (G.orbsGot >= G.need) startMorph();
    else {
      toast('灵珠 ' + G.orbsGot + '/' + G.need, false, true);
      syncHud();
    }
    void p;
  }

  function startMorph() {
    if (G.morphT > 0 || G.form !== 'human') return;
    const spec = STAGES[G.stage - 1];
    G.morphT = 1.18;
    G.lock = 1.18;
    G.formNext = spec.form;
    hitStop(0.08);
    kick(6.5, 'morph');
    screenFlash(WHT, 0.85);
    const p = G.player;
    juice(p.x, p.y - 18, GOLD, 1.6);
    emit(28, {
      x: p.x, y: p.y - 16, j: 18,
      vx0: -320, vx1: 320, vy0: -420, vy1: 80,
      life: 0.55, r0: 2, r1: 5.5, rgb: HOT, g: 200
    });
    emit(16, {
      x: p.x, y: p.y - 20, j: 10,
      vx0: -180, vx1: 180, vy0: -360, vy1: -40,
      life: 0.7, r0: 1.5, r1: 3.4, rgb: GOLD, g: 80
    });
    audio.morph();
    banner('兽化！', true);
  }

  function finishMorph() {
    G.form = G.formNext || STAGES[G.stage - 1].form;
    applyForm();
    G.hp = formSpec().hp;
    G.maxHp = formSpec().hp;
    G.invuln = Math.max(G.invuln, 0.45);
    G.lock = 0;
    G.fuel = 1.6;
    const p = G.player;
    juice(p.x, p.y - 18, formSpec().rgb, 1.2);
    audio.roar();
    banner(formSpec().name + '！', true);
    toast(formSpec().name, false, true);
    kick(3.6, 'boom');
    syncHud();
  }

  function nearestEnemy(range) {
    const p = G.player;
    let best = null;
    let bd = range || 56;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead || e.state === 'buried') continue;
      const d = Math.abs(e.x - p.x);
      if (d < bd && Math.abs(e.y - p.y) < 40) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = false;
    const e = nearestEnemy(70);
    if (e && e.x > p.x) demo.r = true;
    if (platUnder(p.x + 40, PY) && p.grounded && Math.abs(p.y - GY) < 4) demo.u = true;
    if (G.atkCd <= 0 && (e || (G.clock * 2 | 0) % 5 === 0)) attack();
    if (p.x > 980) {
      loadStage(1, true);
      G.invuln = 99;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    const f = formSpec();
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.45;
      p.squash = 1.18;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.morphT > 0) {
      G.morphT -= dt;
      p.vx *= 0.8;
      p.squash = 1 + Math.sin(G.t * 28) * 0.12;
      if (G.morphT <= 0.55 && G.form === 'human' && G.formNext) {
        G.form = G.formNext;
        applyForm();
      }
      if (G.morphT <= 0) finishMorph();
      return;
    }
    if (G.lock > 0) G.lock -= dt;

    const locked = G.lock > 0 || G.clearT > 0;
    const left = !locked && inL();
    const right = !locked && inR();
    const wantJump = !locked && inU();

    if (wantJump) G.jumpBuf = BUFFER;
    else G.jumpBuf = Math.max(0, G.jumpBuf - dt);
    G.jumpHeld = wantJump;

    if (left && !right) {
      p.vx = -f.walk;
      p.face = -1;
      p.run += dt * 12;
    } else if (right && !left) {
      p.vx = f.walk;
      p.face = 1;
      p.run += dt * 12;
    } else {
      p.vx *= Math.pow(0.0004, dt);
      p.run *= 0.9;
    }
    if (!p.grounded) p.vx *= AIR;

    if (G.form === 'dragon' && G.jumpHeld && !p.grounded && G.fuel > 0) {
      G.fuel -= dt;
      p.vy -= 980 * dt;
      p.vy = Math.max(p.vy, -170);
    } else if (p.grounded) {
      G.fuel = 1.6;
    }

    if (p.grounded) p.coyote = COYOTE;
    else p.coyote = Math.max(0, p.coyote - dt);

    if (G.jumpBuf > 0 && p.coyote > 0 && !locked) {
      p.vy = -f.jump;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.82;
      audio.hop();
    }
    if (!G.jumpHeld && p.vy < -80) p.vy *= 0.78;

    if (inD() && p.grounded) {
      const plat = platUnder(p.x, p.y);
      if (plat) {
        G.dropT = 0.16;
        p.grounded = false;
        p.y += 4;
      }
    }
    if (G.dropT > 0) G.dropT -= dt;

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;

    p.x += p.vx * dt;
    p.x = clamp(p.x, 24, G.levelW - 24);
    if (G.boss && G.boss.active && !G.boss.dead) {
      p.x = clamp(p.x, G.levelW - VW + 36, G.levelW - 24);
    }

    const y0 = p.y;
    const y1 = p.y + p.vy * dt;
    const drop = G.dropT > 0 ? platUnder(p.x, y0) : null;
    const land = p.vy >= 0 ? landY(p.x, y0, y1, drop) : null;
    if (land != null) {
      const wasAir = !p.grounded;
      p.y = land;
      p.vy = 0;
      p.grounded = true;
      if (wasAir) {
        p.squash = 1.18;
        audio.land();
        if (G.stomp && G.form === 'bear') bearLandSlam();
      }
    } else {
      p.y = y1;
      p.grounded = false;
    }
    if (p.y > GY + 80) {
      p.y = GY;
      p.vy = 0;
      p.grounded = true;
    }

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0003, dt));
    if (p.pose > 0) p.pose = Math.max(0, p.pose - dt * 5);
    if (p.grounded && !(G.boss && G.boss.active) && p.x > G.checkX) G.checkX = p.x;

    if (G.slashT > 0.04) tryMelee(f.dmg);

    if (G.breathT > 0) {
      G.breathT -= dt;
      breathTick();
    }
    if (G.beamT > 0) G.beamT -= dt;
  }

  function breathTick() {
    const p = G.player;
    const x0 = p.x + p.face * 10;
    const x1 = p.x + p.face * 92;
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const top = p.y - 40;
    const bot = p.y + 4;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead || e.hitCd > 0 || e.state === 'buried') continue;
      if (e.x > left && e.x < right && e.y > top && e.y - e.h < bot) {
        hurtEnt(e, 1);
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      const o = G.boss;
      if (o.x > left && o.x < right && o.y > top && o.y - o.h < bot) {
        hurtEnt(o, 1);
      }
    }
    emit(3, {
      x: p.x + p.face * rand(18, 80), y: p.y - rand(8, 30), j: 3,
      vx0: p.face * 40, vx1: p.face * 160, vy0: -40, vy1: 40,
      life: 0.18, r0: 1.5, r1: 4, rgb: Math.random() > 0.4 ? HOT : GOLD, g: 30
    });
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    if (e.hitCd > 0) e.hitCd -= dt;
    const p = G.player;
    const mul = spdMul();
    e.t += dt;

    if (e.kind === 'zombie' && e.state === 'buried') {
      if (Math.abs(p.x - e.x) < 210 && Math.abs(p.x - e.x) > 20) e.state = 'rise';
      return;
    }
    if (e.state === 'rise') {
      e.rise += dt;
      const k = clamp(e.rise / 0.42, 0, 1);
      e.y = GY + 22 * (1 - k);
      if (k >= 1) {
        e.state = 'walk';
        e.y = GY;
      }
      return;
    }

    if (e.kind === 'head') {
      if (!e.grounded) e.vy += GRAV * dt;
      const y0 = e.y;
      const y1 = e.y + e.vy * dt;
      const land = e.vy >= 0 ? landY(e.x, y0, y1, null) : null;
      if (land != null) {
        e.y = land;
        e.vy = -260 * mul;
        e.grounded = true;
      } else {
        e.y = y1;
        e.grounded = false;
      }
      e.face = p.x > e.x ? 1 : -1;
      e.x += e.face * 130 * mul * dt;
    } else if (e.kind === 'wolf') {
      const dx = p.x - e.x;
      e.face = dx > 0 ? 1 : -1;
      if (Math.abs(dx) < 240) e.x += e.face * 170 * mul * dt;
      else e.x += e.face * 70 * mul * dt;
      e.y = GY;
      e.grounded = true;
    } else {
      const dx = p.x - e.x;
      e.face = dx > 0 ? 1 : -1;
      e.x += e.face * 58 * mul * dt;
      e.y = GY;
      e.grounded = true;
    }
    e.x = clamp(e.x, 30, G.levelW - 30);

    if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.morphT <= 0) {
      const pb = pBox();
      const punching = G.slashT > 0.04 && e.swing === G.swing;
      if (!punching && overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        hurtPlayer();
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    if (b.hitCd > 0) b.hitCd -= dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.gate) {
        b.active = true;
        b.state = 'hunt';
        audio.boss();
        banner(b.name + '现身', true);
        toast(b.name, true, false);
        kick(3.5, 'boom');
      }
      return;
    }
    const mul = spdMul();
    b.t += dt;
    b.fire -= dt;
    if (!b.grounded) {
      b.vy += GRAV * dt;
      const y0 = b.y;
      const y1 = b.y + b.vy * dt;
      const land = b.vy >= 0 ? landY(b.x, y0, y1, null) : null;
      if (land != null) {
        b.y = land;
        b.vy = 0;
        b.grounded = true;
      } else b.y = y1;
    }
    const dx = p.x - b.x;
    b.face = dx > 0 ? 1 : -1;
    const dist = Math.abs(dx);
    const arenaL = G.levelW - VW + 36;
    const arenaR = G.levelW - 36;
    if (b.kind === 'golem') {
      if (b.state === 'charge') {
        b.x += b.face * 260 * mul * dt;
        if (dist < 28 || b.x < arenaL || b.x > arenaR) b.state = 'hunt';
      } else if (b.grounded && dist > 50) {
        b.x += b.face * 80 * mul * dt;
        if (b.t > 1.6) {
          b.state = 'charge';
          b.t = 0;
        }
      } else if (b.grounded && b.t > 0.7) {
        b.vy = -340;
        b.grounded = false;
        b.t = 0;
      }
    } else if (b.kind === 'mage') {
      b.x += b.face * 70 * mul * dt;
      if (b.t > 2.4 && b.grounded) {
        juice(b.x, b.y - 20, PUR, 0.7);
        b.x = clamp(p.x - b.face * 110, arenaL, arenaR);
        popSpark(b.x, b.y - 20, PUR, 20);
        b.t = 0;
      }
    } else if (b.kind === 'tent') {
      b.x += b.face * 42 * mul * dt;
    } else {
      if (dist > 64) b.x += b.face * 78 * mul * dt;
      else if (dist < 40 && b.t > 0.55 && b.grounded) {
        b.vy = -320;
        b.grounded = false;
        b.t = 0;
      }
    }
    b.x = clamp(b.x, arenaL, arenaR);

    const low = b.hp < b.max * 0.45;
    const rate = ((low ? 0.7 : 1.12) / mul);
    if (b.fire <= 0 && playing() && G.deadT <= 0) {
      const shots = b.kind === 'tri' ? (low ? 3 : 2) : b.kind === 'mage' ? 3 : 1;
      for (let k = 0; k < shots; k++) {
        spawnBolt({
          kind: 'shot', from: 'e',
          x: b.x + b.face * 16, y: b.y - 22 - k * 8,
          vx: b.face * (220 + k * 20) * (isRage() ? 1.15 : 1),
          vy: b.kind === 'mage' ? -40 + k * 40 : (k - 1) * 30,
          dmg: 1, life: 1.6, r: 6, face: b.face
        });
      }
      b.fire = rate;
      audio.beep(200, 0.08, 'sawtooth', 0.03, 70);
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.morphT <= 0) {
      const pb = pBox();
      const punching = G.slashT > 0.04 && b.swing === G.swing;
      if (!punching && overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        hurtPlayer();
      }
    }
  }

  function updateBolts(dt) {
    const p = G.player;
    for (let i = bolts.length - 1; i >= 0; i--) {
      const s = bolts[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += (s.vy || 0) * dt;
      s.spin += dt * 10;
      if (s.kind === 'wave' && s.vx === 0) s.r += 90 * dt;
      if (s.life <= 0 || s.x < G.camX - 50 || s.x > G.camX + VW + 50) {
        bolts.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        for (let k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (e.dead || e.state === 'buried') continue;
          const rad = s.kind === 'wave' ? s.r : (s.kind === 'beam' ? 16 : 12);
          if (hypot(s.x - e.x, s.y - (e.y - e.h * 0.45)) < rad + 6) {
            hurtEnt(e, s.dmg);
            hit = true;
            break;
          }
        }
        if (!hit && G.boss && G.boss.active && !G.boss.dead) {
          const o = G.boss;
          const rad = s.kind === 'wave' ? s.r : (s.kind === 'beam' ? 18 : 14);
          if (hypot(s.x - o.x, s.y - (o.y - 20)) < rad + 8) {
            hurtEnt(o, s.dmg);
            hit = true;
          }
        }
        if (hit && s.kind !== 'wave' && s.kind !== 'beam') {
          popSpark(s.x, s.y, HOT, 12);
          bolts.splice(i, 1);
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.morphT <= 0) {
        if (hypot(s.x - p.x, s.y - (p.y - 16)) < 13) {
          bolts.splice(i, 1);
          hurtPlayer();
        }
      }
    }
  }

  function updatePickups(dt) {
    const p = G.player;
    for (let i = 0; i < G.pickups.length; i++) {
      const o = G.pickups[i];
      if (o.taken) continue;
      o.t += dt;
      if (G.deadT > 0 || G.morphT > 0) continue;
      if (hypot(o.x - p.x, o.y - (p.y - 18)) < 22) collectOrb(o);
    }
  }

  function updateFx(dt) {
    G.toastT = Math.max(0, G.toastT - dt);
    G.bannerT = Math.max(0, G.bannerT - dt);
    if (G.slashT > 0) G.slashT -= dt;
    if (G.atkCd > 0) G.atkCd -= dt;
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.2);
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
      if (rings[i].t > 0.42) rings.splice(i, 1);
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
    let tx = p.x - VW * 0.38;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    let ty = p.y - VH * 0.74;
    ty = clamp(ty, -40, 8);
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
    updateBolts(dt);
    updatePickups(dt);
    updateCam(dt);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    const st = G.stage;
    if (st === 2) {
      g.addColorStop(0, '#041418');
      g.addColorStop(0.55, '#0a1c18');
      g.addColorStop(1, '#102214');
    } else if (st === 3) {
      g.addColorStop(0, '#1a0c08');
      g.addColorStop(0.5, '#22100a');
      g.addColorStop(1, '#2a140c');
    } else if (st === 4) {
      g.addColorStop(0, '#120610');
      g.addColorStop(0.5, '#1a0a0c');
      g.addColorStop(1, '#22080c');
    } else {
      g.addColorStop(0, '#14080c');
      g.addColorStop(0.5, '#1a0c0a');
      g.addColorStop(1, '#22100c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 46);
    ctx.fillStyle = rgba(GOLD, 0.5);
    ctx.beginPath();
    ctx.arc(mx, my, 22 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.16);
    ctx.beginPath();
    ctx.arc(mx - 6 * scale, my - 4 * scale, 10 * scale, 0, TAU);
    ctx.fill();
  }

  function drawDecor() {
    const par = G.camX * 0.32;
    const base = sy(GY + 4);
    const st = G.stage;
    let i, x, h;
    for (i = -2; i < 24; i++) {
      const id = Math.floor((G.camX + par) / 64) + i;
      x = sx(id * 64 - par);
      const r = hash2(id + st * 17);
      if (st === 1 || st === 4) {
        h = (28 + r * 26) * scale;
        ctx.fillStyle = r > 0.55 ? '#1a0e0a' : '#140a08';
        ctx.fillRect(x, base - h, 18 * scale, h + 20 * scale);
        ctx.fillStyle = rgba(HOT, 0.35);
        ctx.fillRect(x, base - h, 18 * scale, 3 * scale);
        ctx.fillStyle = '#0e0806';
        ctx.fillRect(x + 4 * scale, base - h - 8 * scale, 10 * scale, 10 * scale);
      } else if (st === 2) {
        ctx.strokeStyle = rgba(TEAL, 0.28);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.moveTo(x + 8 * scale, base);
        ctx.quadraticCurveTo(x + (r * 16 - 4) * scale, base - (24 + r * 20) * scale, x + 10 * scale, base - (36 + r * 18) * scale);
        ctx.stroke();
      } else {
        h = (50 + r * 40) * scale;
        ctx.fillStyle = '#1c100c';
        ctx.fillRect(x, base - h, 14 * scale, h + 16 * scale);
        ctx.fillStyle = rgba(GOLD, 0.22);
        ctx.fillRect(x + 4 * scale, base - h + 10 * scale, 6 * scale, 8 * scale);
      }
    }
    ctx.fillStyle = '#120806';
    ctx.fillRect(sx(G.camX - 20), sy(GY), (VW + 40) * scale, 80 * scale);
    ctx.fillStyle = rgba(HOT, 0.7);
    ctx.fillRect(sx(G.camX - 20), sy(GY), (VW + 40) * scale, 3 * scale);
    ctx.fillStyle = rgba(GOLD, 0.18);
    ctx.fillRect(sx(G.camX - 20), sy(GY + 3), (VW + 40) * scale, 2 * scale);
  }

  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      ctx.fillStyle = '#1a0e0a';
      ctx.fillRect(x, y, w, 12 * scale);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.25);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
    }
  }

  function limb(x0, y0, x1, y1, w, rgb) {
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function drawHumanFig(s, t, opt) {
    const run = opt.run || 0;
    const slash = opt.slash || 0;
    const leg = Math.sin(run) * 6 * s;
    limb(-3 * s, -8 * s, -4 * s + (opt.grounded ? -leg : 2 * s), 0, 2.2 * s, SKIN);
    limb(3 * s, -8 * s, 4 * s + (opt.grounded ? leg : -2 * s), 0, 2.2 * s, SKIN);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -10 * s);
    ctx.lineTo(7 * s, -11 * s);
    ctx.lineTo(5 * s, -24 * s);
    ctx.lineTo(-5 * s, -23 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-6 * s, -13 * s, 12 * s, 2.2 * s);
    const cape = Math.sin(t * 7) * 3;
    ctx.strokeStyle = rgba(CYN, 0.8);
    ctx.lineWidth = 1.7 * s;
    ctx.beginPath();
    ctx.moveTo(-2 * s, -20 * s);
    ctx.quadraticCurveTo((-12 - cape) * s, -16 * s, (-10 - cape) * s, -8 * s);
    ctx.stroke();
    ctx.fillStyle = '#2a1810';
    ctx.beginPath();
    ctx.ellipse(0, -28 * s, 6.4 * s, 6.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-2 * s, -34 * s);
    ctx.lineTo(0, -40 * s);
    ctx.lineTo(2 * s, -34 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(1.4 * s, -30 * s, 3.6 * s, 1.5 * s);
    const arm = slash > 0 ? 16 * s : 6 * s;
    const armY = slash > 0 ? -18 * s : -16 * s;
    limb(2 * s, -18 * s, arm, armY, 2.2 * s, SKIN);
    if (slash > 0) {
      ctx.strokeStyle = rgba(HOT, 0.85);
      ctx.lineWidth = 2.6 * s;
      ctx.beginPath();
      ctx.arc(8 * s, -16 * s, 14 * s, -0.9, 0.7);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.65);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(8 * s, -16 * s, 10 * s, -0.8, 0.5);
      ctx.stroke();
    }
  }

  function drawWolfFig(s, t, opt) {
    const run = opt.run || 0;
    const slash = opt.slash || 0;
    const leg = Math.sin(run) * 7 * s;
    limb(-5 * s, -10 * s, -8 * s - leg, 0, 2.6 * s, FUR);
    limb(4 * s, -10 * s, 8 * s + leg, 0, 2.6 * s, FUR);
    ctx.fillStyle = rgba(FUR, 0.98);
    ctx.beginPath();
    ctx.ellipse(0, -18 * s, 11 * s, 10 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.moveTo(8 * s, -22 * s);
    ctx.lineTo(20 * s, -18 * s);
    ctx.lineTo(8 * s, -14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(FUR, 0.98);
    ctx.beginPath();
    ctx.moveTo(-2 * s, -28 * s);
    ctx.lineTo(-8 * s, -38 * s);
    ctx.lineTo(2 * s, -30 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4 * s, -28 * s);
    ctx.lineTo(8 * s, -36 * s);
    ctx.lineTo(8 * s, -26 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(10 * s, -22 * s, 1.6 * s, 0, TAU);
    ctx.fill();
    const tail = Math.sin(t * 8) * 4;
    ctx.strokeStyle = rgba(FUR, 0.9);
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, -14 * s);
    ctx.quadraticCurveTo((-18 + tail) * s, -22 * s, (-16 + tail) * s, -8 * s);
    ctx.stroke();
    const claw = slash > 0 ? 18 * s : 10 * s;
    limb(6 * s, -16 * s, claw, -20 * s, 2.8 * s, FUR);
    if (slash > 0) {
      ctx.strokeStyle = rgba(HOT, 0.85);
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.arc(12 * s, -18 * s, 12 * s, -0.8, 0.6);
      ctx.stroke();
    }
  }

  function drawDragonFig(s, t, opt) {
    const flap = Math.sin(t * 10) * 8 * s;
    ctx.fillStyle = rgba(TEAL, 0.35);
    ctx.beginPath();
    ctx.moveTo(-2 * s, -18 * s);
    ctx.lineTo(-18 * s, -28 * s - flap);
    ctx.lineTo(-6 * s, -14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2 * s, -18 * s);
    ctx.lineTo(-16 * s, -8 * s + flap);
    ctx.lineTo(-4 * s, -12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(TEAL, 0.95);
    ctx.beginPath();
    ctx.ellipse(2 * s, -14 * s, 12 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10 * s, -18 * s);
    ctx.lineTo(22 * s, -22 * s);
    ctx.lineTo(12 * s, -12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(16 * s, -20 * s, 1.5 * s, 0, TAU);
    ctx.fill();
    const tail = Math.sin(t * 6) * 5;
    ctx.strokeStyle = rgba(TEAL, 0.9);
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.moveTo(-8 * s, -10 * s);
    ctx.quadraticCurveTo((-20 + tail) * s, -6 * s, (-18 + tail) * s, 4 * s);
    ctx.stroke();
    limb(-4 * s, -8 * s, -6 * s, 2 * s, 2.2 * s, TEAL);
    limb(6 * s, -8 * s, 8 * s, 2 * s, 2.2 * s, TEAL);
    if (opt.breath) {
      ctx.fillStyle = rgba(HOT, 0.45);
      ctx.beginPath();
      ctx.moveTo(20 * s, -20 * s);
      ctx.lineTo(70 * s, -34 * s);
      ctx.lineTo(72 * s, -6 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.35);
      ctx.beginPath();
      ctx.moveTo(20 * s, -20 * s);
      ctx.lineTo(56 * s, -28 * s);
      ctx.lineTo(58 * s, -12 * s);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBearFig(s, t, opt) {
    const run = opt.run || 0;
    const slash = opt.slash || 0;
    const leg = Math.sin(run) * 5 * s;
    limb(-7 * s, -12 * s, -9 * s - leg, 0, 3.4 * s, FUR);
    limb(6 * s, -12 * s, 9 * s + leg, 0, 3.4 * s, FUR);
    ctx.fillStyle = rgba(FUR, 0.98);
    ctx.beginPath();
    ctx.ellipse(0, -20 * s, 14 * s, 13 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.beginPath();
    ctx.ellipse(2 * s, -16 * s, 6 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(FUR, 0.98);
    ctx.beginPath();
    ctx.arc(-6 * s, -32 * s, 3.2 * s, 0, TAU);
    ctx.arc(6 * s, -32 * s, 3.2 * s, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -30 * s, 8 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(4 * s, -30 * s, 1.5 * s, 0, TAU);
    ctx.fill();
    const arm = slash > 0 ? 20 * s : 12 * s;
    limb(8 * s, -20 * s, arm, slash > 0 ? -28 * s : -8 * s, 4 * s, FUR);
    if (slash > 0) {
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.arc(10 * s, -8 * s, 18 * s, 0.1, 1.4);
      ctx.stroke();
    }
  }

  function drawTigerFig(s, t, opt) {
    const run = opt.run || 0;
    const slash = opt.slash || 0;
    const leg = Math.sin(run) * 7 * s;
    const col = [255, 170, 70];
    limb(-4 * s, -10 * s, -7 * s - leg, 0, 2.4 * s, col);
    limb(5 * s, -10 * s, 8 * s + leg, 0, 2.4 * s, col);
    ctx.fillStyle = rgba(col, 0.98);
    ctx.beginPath();
    ctx.ellipse(2 * s, -16 * s, 12 * s, 9 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,6,0.7)';
    ctx.lineWidth = 1.3 * s;
    ctx.beginPath();
    ctx.moveTo(-4 * s, -20 * s);
    ctx.lineTo(-2 * s, -12 * s);
    ctx.moveTo(2 * s, -22 * s);
    ctx.lineTo(4 * s, -12 * s);
    ctx.moveTo(8 * s, -20 * s);
    ctx.lineTo(9 * s, -12 * s);
    ctx.stroke();
    ctx.fillStyle = rgba(col, 0.98);
    ctx.beginPath();
    ctx.moveTo(10 * s, -22 * s);
    ctx.lineTo(22 * s, -18 * s);
    ctx.lineTo(10 * s, -12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(16 * s, -16 * s, 3 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(14 * s, -20 * s, 1.5 * s, 0, TAU);
    ctx.fill();
    const tail = Math.sin(t * 9) * 5;
    ctx.strokeStyle = rgba(col, 0.9);
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, -12 * s);
    ctx.quadraticCurveTo((-18 + tail) * s, -24 * s, (-14 + tail) * s, -6 * s);
    ctx.stroke();
    limb(6 * s, -14 * s, slash > 0 ? 18 * s : 10 * s, -18 * s, 2.4 * s, col);
    if (opt.beam) {
      ctx.fillStyle = rgba(CYN, 0.55);
      ctx.fillRect(20 * s, -22 * s, 90 * s, 5 * s);
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(20 * s, -20.5 * s, 90 * s, 2 * s);
    }
  }

  function drawActor(kind, x, y, face, t, opt) {
    opt = opt || {};
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(face, opt.squash || 1);
    if (kind === 'wolf') drawWolfFig(s, t, opt);
    else if (kind === 'dragon') drawDragonFig(s, t, opt);
    else if (kind === 'bear') drawBearFig(s, t, opt);
    else if (kind === 'tiger') drawTigerFig(s, t, opt);
    else drawHumanFig(s, t, opt);
    ctx.restore();
  }

  function drawZombie(e) {
    if (e.state === 'buried') {
      const x = sx(e.x);
      const y = sy(GY);
      ctx.fillStyle = rgba(GRN, 0.4);
      ctx.beginPath();
      ctx.ellipse(x, y, 10 * scale, 4 * scale, 0, 0, TAU);
      ctx.fill();
      return;
    }
    const s = scale;
    const rise = e.state === 'rise' ? 0.7 : 1;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, rise);
    if (e.hitN > 0) ctx.globalAlpha = 0.55;
    const leg = Math.sin(e.t * 6) * 4 * s;
    limb(-3 * s, -8 * s, -4 * s - leg, 0, 2 * s, GRN);
    limb(3 * s, -8 * s, 4 * s + leg, 0, 2 * s, GRN);
    ctx.fillStyle = rgba(GRN, 0.9);
    ctx.fillRect(-6 * s, -24 * s, 12 * s, 16 * s);
    ctx.fillStyle = '#1a2418';
    ctx.beginPath();
    ctx.arc(0, -28 * s, 5.5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(1 * s, -30 * s, 3 * s, 1.4 * s);
    limb(4 * s, -18 * s, 12 * s, -14 * s, 2 * s, GRN);
    ctx.restore();
  }

  function drawHead(e) {
    const x = sx(e.x);
    const y = sy(e.y - 8);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(e.t * 8 * e.face);
    if (e.hitN > 0) ctx.globalAlpha = 0.55;
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 8 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0a08';
    ctx.beginPath();
    ctx.arc(-2.4 * scale, -1.5 * scale, 1.6 * scale, 0, TAU);
    ctx.arc(2.6 * scale, -1.5 * scale, 1.6 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(-3 * scale, 3 * scale, 6 * scale, 1.4 * scale);
    ctx.restore();
  }

  function drawEnemyWolf(e) {
    const s = scale * 0.82;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(e.face, 1);
    if (e.hitN > 0) ctx.globalAlpha = 0.55;
    const leg = Math.sin(e.t * 10) * 5 * s;
    limb(-5 * s, -8 * s, -8 * s - leg, 0, 2 * s, WOLF);
    limb(4 * s, -8 * s, 8 * s + leg, 0, 2 * s, WOLF);
    ctx.fillStyle = rgba(WOLF, 0.96);
    ctx.beginPath();
    ctx.ellipse(0, -12 * s, 10 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8 * s, -14 * s);
    ctx.lineTo(18 * s, -12 * s);
    ctx.lineTo(8 * s, -8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(10 * s, -14 * s, 1.4 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.kind === 'zombie') drawZombie(e);
    else if (e.kind === 'head') drawHead(e);
    else drawEnemyWolf(e);
  }

  function drawBoss(b) {
    if (!b || b.dead || !b.active) return;
    const s = scale;
    ctx.save();
    ctx.translate(sx(b.x), sy(b.y));
    ctx.scale(b.face, 1);
    if (b.hitN > 0) ctx.globalAlpha = 0.55;
    if (b.kind === 'tri') {
      ctx.fillStyle = rgba(PUR, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -18 * s, 16 * s, 14 * s, 0, 0, TAU);
      ctx.fill();
      const bob = Math.sin(G.t * 4) * 2 * s;
      for (let k = -1; k <= 1; k++) {
        ctx.fillStyle = rgba(HOT2, 0.95);
        ctx.beginPath();
        ctx.arc(k * 10 * s, -34 * s + bob * (k === 0 ? 1 : 0.4), 7 * s, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.arc(k * 10 * s + 2 * s, -35 * s, 1.5 * s, 0, TAU);
        ctx.fill();
      }
    } else if (b.kind === 'tent') {
      ctx.fillStyle = rgba(TEAL, 0.9);
      ctx.beginPath();
      ctx.arc(0, -16 * s, 16 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(TEAL, 0.8);
      ctx.lineWidth = 3 * s;
      for (let k = 0; k < 4; k++) {
        const a = Math.sin(G.t * 5 + k) * 10;
        ctx.beginPath();
        ctx.moveTo((k - 1.5) * 6 * s, -8 * s);
        ctx.quadraticCurveTo((k - 1.5) * 8 * s + a * s, 4 * s, (k - 1.5) * 10 * s, 8 * s);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(6 * s, -20 * s, 2.2 * s, 0, TAU);
      ctx.arc(2 * s, -18 * s, 2.2 * s, 0, TAU);
      ctx.fill();
    } else if (b.kind === 'golem') {
      ctx.fillStyle = '#3a2a22';
      ctx.fillRect(-16 * s, -36 * s, 32 * s, 36 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-16 * s, -36 * s, 32 * s, 4 * s);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-8 * s, -28 * s, 6 * s, 5 * s);
      ctx.fillRect(4 * s, -28 * s, 6 * s, 5 * s);
    } else {
      ctx.fillStyle = rgba(PUR, 0.92);
      ctx.beginPath();
      ctx.moveTo(-12 * s, 0);
      ctx.lineTo(12 * s, 0);
      ctx.lineTo(8 * s, -40 * s);
      ctx.lineTo(-8 * s, -38 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a0a14';
      ctx.beginPath();
      ctx.arc(0, -46 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.fillRect(2 * s, -48 * s, 4 * s, 2 * s);
      const bolt = Math.sin(G.t * 12);
      ctx.strokeStyle = rgba(GOLD, 0.7 + bolt * 0.2);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(0, -54 * s);
      ctx.lineTo(4 * s, -64 * s);
      ctx.lineTo(-2 * s, -70 * s);
      ctx.stroke();
    }
    const ratio = clamp(b.hp / b.max, 0, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-16 * s, -b.h * s - 10 * s, 32 * s, 4 * s);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-16 * s, -b.h * s - 10 * s, 32 * s * ratio, 4 * s);
    ctx.restore();
  }

  function drawPickup(o) {
    if (o.taken) return;
    const bob = Math.sin(o.t * 4 + o.x * 0.01) * 4;
    const x = sx(o.x);
    const y = sy(o.y + bob);
    const r = (7 + Math.sin(o.t * 6) * 1.2) * scale;
    ctx.fillStyle = rgba(GOLD, 0.22);
    ctx.beginPath();
    ctx.arc(x, y, r * 2.1, 0, TAU);
    ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    g.addColorStop(0, '#fff8d8');
    g.addColorStop(0.45, rgba(GOLD, 1));
    g.addColorStop(1, rgba(HOT, 0.85));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, TAU);
    ctx.fill();
  }

  function drawBolt(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    if (s.kind === 'fire') {
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, s.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x - s.face * 2 * scale, y, s.r * 0.5 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'beam') {
      ctx.fillStyle = rgba(CYN, 0.45);
      ctx.fillRect(x - (s.face > 0 ? 0 : s.w * scale), y - 4 * scale, s.w * scale, 8 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(x - (s.face > 0 ? 0 : s.w * scale), y - 1.6 * scale, s.w * scale, 3.2 * scale);
    } else if (s.kind === 'wave') {
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(x, sy(GY), s.r * scale, Math.PI, TAU);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, 5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(PUR, 0.7);
      ctx.beginPath();
      ctx.arc(x, y, 2.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawFx() {
    let i, o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const k = o.t / 0.42;
      ctx.strokeStyle = rgba(o.rgb, 0.7 * (1 - k));
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + k * 26) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      const k = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, 0.85 * k);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.rad * k * 0.45 * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      ctx.fillStyle = rgba(o.rgb, Math.max(0, o.life / o.max));
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
      ctx.font = '700 ' + (o.size * scale) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function drawLightning() {
    if (G.morphT <= 0) return;
    const p = G.player;
    const x0 = sx(p.x);
    const y1 = sy(p.y - 20);
    ctx.strokeStyle = rgba(WHT, 0.75);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x0 + rand(-8, 8) * scale, oy);
    let y = oy;
    let x = x0;
    while (y < y1) {
      y += rand(12, 22) * scale;
      x += rand(-18, 18) * scale;
      ctx.lineTo(x, Math.min(y, y1));
    }
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
  }

  function drawGate() {
    if (G.boss && G.boss.active) return;
    const x = sx(G.gate + 40);
    const y = sy(GY);
    ctx.fillStyle = rgba(MAG, 0.18);
    ctx.fillRect(x, y - 90 * scale, 10 * scale, 90 * scale);
    ctx.fillStyle = rgba(HOT, 0.45);
    ctx.fillRect(x, y - 90 * scale, 10 * scale, 4 * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0603';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const sk = REDUCE ? 0 : G.shake;
    if (sk > 0) {
      ctx.translate((Math.random() - 0.5) * sk * 1.4, (Math.random() - 0.5) * sk * 1.1);
    }
    ctx.save();
    const punch = REDUCE ? 1 : G.punch;
    ctx.translate(ox + VW * scale * 0.5, oy + VH * scale * 0.5);
    ctx.scale(punch, punch);
    ctx.translate(-(ox + VW * scale * 0.5), -(oy + VH * scale * 0.5));

    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawDecor();
    drawPlats();
    drawGate();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss(G.boss);
    for (i = 0; i < bolts.length; i++) drawBolt(bolts[i]);

    const p = G.player;
    if (p) {
      const blink = G.invuln > 0 && G.mode !== 'title';
      drawActor(G.form, p.x, p.y, p.face, G.clock, {
        run: p.run,
        slash: G.slashT,
        grounded: p.grounded,
        squash: p.squash,
        blink: blink,
        breath: G.breathT > 0,
        beam: G.beamT > 0,
        size: G.morphT > 0.4 ? 1 + (1.18 - G.morphT) * 0.5 : 1
      });
    }
    drawLightning();
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }

    ctx.restore();
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
      startGame('rise');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('rage');
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
    hold(document.getElementById('btn-jump'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-punch'), function () {
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

  if (btnRise) {
    btnRise.addEventListener('click', function () {
      audio.ensure();
      startGame('rise');
    });
  }
  if (btnRage) {
    btnRage.addEventListener('click', function () {
      audio.ensure();
      startGame('rage');
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
      if (G.mode === 'win') startGame('rage');
      else goTitle();
    });
  }
  if (modeRise) {
    modeRise.addEventListener('click', function () {
      audio.ensure();
      startGame('rise');
    });
  }
  if (modeRage) {
    modeRage.addEventListener('click', function () {
      audio.ensure();
      startGame('rage');
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
