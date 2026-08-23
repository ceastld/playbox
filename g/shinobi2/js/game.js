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
  const WALK = 224;
  const AIR = 0.86;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 560;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const MELEE = 48;
  const STAR_SPD = 480;
  const ATK_CD = 0.2;
  const SLASH_T = 0.18;
  const INVULN = 1.35;
  const DIE_T = 0.78;
  const STAR_CAP = 99;
  const NINJ_CAP = 5;
  const DRAGON_SPD = 390;
  const DRAGON_LIFE = 1.12;
  const BEST_KEY = 'playbox-shinobi2-best';
  const MUTE_KEY = 'playbox-shinobi2-mute';
  const OPS = '方向键 / WASD 走跳 · 空格近斩远镖 · Shift / Z 火龙 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 122];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 154, 24];
  const HOT2 = [255, 196, 74];
  const WHT = [246, 241, 232];
  const PUR = [168, 92, 255];
  const ORG = [255, 120, 40];
  const CRIM = [255, 72, 48];

  const SCORE = {
    ash: 100, gun: 200, swift: 300, shade: 150,
    boss: 4500, stage: 1800, jade: 300, ammo: 80
  };

  const STAGES = [
    {
      name: '暮城', boss: '赤袍', w: 2200, hp: 12,
      ground: [[0, 640], [740, 500], [1360, 840]],
      plats: [
        [160, MY, 150], [400, MY, 180], [800, MY, 160],
        [1080, MY, 200], [1480, MY, 180], [1800, MY, 150],
        [440, HY, 130], [1100, HY, 150], [1520, HY, 140]
      ],
      ents: [
        [340, GY, 'ash', 40, 620],
        [520, GY, 'ash', 80, 640],
        [480, HY, 'gun', 440, 570],
        [900, GY, 'shade', 760, 1220],
        [1160, MY, 'swift', 1080, 1280],
        [1180, HY, 'gun', 1100, 1250],
        [1580, GY, 'ash', 1400, 2000],
        [1760, GY, 'gun', 1400, 2050],
        [1880, MY, 'swift', 1800, 1950]
      ],
      loot: [[980, MY, 'ammo'], [1680, MY, 'jade']]
    },
    {
      name: '祠谷', boss: '金面', w: 2540, hp: 16,
      ground: [[0, 500], [620, 420], [1180, 380], [1700, 840]],
      plats: [
        [120, MY, 140], [340, MY, 160], [680, MY, 170],
        [960, MY, 150], [1260, MY, 190], [1560, MY, 160],
        [1980, MY, 180], [2280, MY, 140],
        [360, HY, 130], [720, HY, 150], [1300, HY, 160],
        [1600, HY, 140], [2020, HY, 150]
      ],
      ents: [
        [260, GY, 'ash', 20, 480],
        [380, MY, 'gun', 340, 500],
        [390, HY, 'gun', 360, 490],
        [760, GY, 'shade', 640, 1020],
        [760, MY, 'swift', 680, 850],
        [800, HY, 'gun', 720, 870],
        [1080, GY, 'ash', 640, 1080],
        [1340, MY, 'ash', 1260, 1450],
        [1380, HY, 'swift', 1300, 1460],
        [1640, GY, 'gun', 1200, 1660],
        [1900, GY, 'shade', 1760, 2360],
        [2060, MY, 'swift', 1980, 2160],
        [2100, HY, 'gun', 2020, 2170],
        [2320, GY, 'ash', 1780, 2480]
      ],
      loot: [[1000, MY, 'ammo'], [1640, HY, 'jade'], [2140, MY, 'ammo']]
    },
    {
      name: '族砦', boss: '族主', w: 2780, hp: 22,
      ground: [[0, 440], [540, 360], [1020, 400], [1540, 380], [2040, 740]],
      plats: [
        [80, MY, 130], [300, MY, 150], [600, MY, 170],
        [880, MY, 160], [1160, MY, 190], [1460, MY, 160],
        [1760, MY, 180], [2120, MY, 200], [2460, MY, 150],
        [320, HY, 120], [640, HY, 140], [1200, HY, 150],
        [1800, HY, 160], [2160, HY, 170], [2480, HY, 120]
      ],
      ents: [
        [220, GY, 'ash', 20, 420],
        [340, MY, 'gun', 300, 450],
        [360, HY, 'swift', 320, 440],
        [660, GY, 'shade', 560, 900],
        [680, MY, 'ash', 600, 770],
        [700, HY, 'gun', 640, 780],
        [1160, GY, 'gun', 1040, 1400],
        [1220, MY, 'swift', 1160, 1350],
        [1260, HY, 'gun', 1200, 1350],
        [1620, GY, 'shade', 1560, 1900],
        [1660, MY, 'gun', 1460, 1620],
        [1840, MY, 'swift', 1760, 1940],
        [1880, HY, 'gun', 1800, 1960],
        [2220, GY, 'ash', 2100, 2680],
        [2280, MY, 'swift', 2120, 2320],
        [2200, HY, 'gun', 2160, 2330],
        [2500, MY, 'shade', 2460, 2610]
      ],
      loot: [[920, MY, 'ammo'], [1480, MY, 'jade'], [2180, HY, 'ammo']]
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
  function ninjCount(core) {
    return core ? 1 : 3;
  }
  function starCount(core) {
    return core ? 24 : 40;
  }
  function spdMul(core, stage) {
    return (core ? 1.32 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
  }
  function bossHp(spec, core) {
    return core ? Math.ceil(spec.hp * 1.22) : spec.hp;
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

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 floors');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (ninjCount(true) >= ninjCount(false)) throw new Error('core fewer ninjutsu');
    if (starCount(true) >= starCount(false)) throw new Error('core fewer stars');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (MELEE < 36) throw new Error('melee range');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[2].boss !== '族主') throw new Error('clan boss');
    if (BEST_KEY !== 'playbox-shinobi2-best') throw new Error('best key');
    if (DRAGON_SPD < 200 || DRAGON_LIFE < 0.6) throw new Error('dragon');
    let i, s, j;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length) throw new Error('ground');
      if (s.host) throw new Error('no hostages');
      if (!s.ents.length) throw new Error('ents');
      for (j = 0; j < s.loot.length; j++) {
        if (s.loot[j][0] < 40 || s.loot[j][0] > s.w - 80) throw new Error('loot x');
      }
    }
    if (bossHp(STAGES[2], true) <= bossHp(STAGES[2], false)) throw new Error('core boss thicker');
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
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeRaid = document.getElementById('mode-raid');
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
  const starLabel = document.getElementById('star-label');
  const ninjLabel = document.getElementById('ninj-label');
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

  const keys = { l: false, r: false, u: false, d: false };
  const demo = { l: false, r: true, u: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2200,
    plats: [],
    ents: [],
    stars: [],
    dragons: [],
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
    ninj: 3,
    ammo: 40,
    checkX: 70,
    checkY: GY,
    atkCd: 0,
    slashT: 0,
    slashHit: 0,
    ninjT: 0,
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
    gate: 1980
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
    slash() {
      this.ensure();
      this.noise(0.05, 0.04, 1400);
      this.beep(420, 0.08, 'sawtooth', 0.05, 180);
    },
    throw() {
      this.ensure();
      this.beep(980, 0.05, 'square', 0.038, 1540);
    },
    ping(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.05);
      this.beep(1180 * lift, 0.07, 'triangle', 0.05, 1760 * lift);
      this.beep(1760 * lift, 0.05, 'sine', 0.028, 2200 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.036, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.044, 880 * lift);
    },
    ninj() {
      this.ensure();
      this.noise(0.26, 0.09, 180);
      this.beep(160, 0.32, 'sawtooth', 0.07, 60);
      this.beep(420, 0.2, 'square', 0.045, 140);
      this.beep(880, 0.12, 'triangle', 0.03, 220);
    },
    pickup() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.1, 'triangle', 0.032, 1046);
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
    const core = isCore();
    if (modeRaid) modeRaid.setAttribute('aria-pressed', core ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', core ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isCore() ? '核 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '忍核' : '忍二';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (starLabel) {
      starLabel.textContent = '剑 ' + G.ammo;
      starLabel.classList.toggle('empty', G.ammo <= 0);
    }
    if (ninjLabel) {
      ninjLabel.textContent = '龙 ' + G.ninj;
      ninjLabel.classList.toggle('empty', G.ninj <= 0);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 挨打、中弹、坠崖都丢命', 'warn');
    else if (G.mode === 'win') setHint('族砦已破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 近斩远镖 · Shift 火龙', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('族将 · 近斩远镖 · 火龙穿场', 'hot');
    else setHint('走跳 · 空格近斩远镖 · Shift 火龙', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SHN2';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isCore() ? '忍核' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'ninj');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'ninj');
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
      w: PW, h: PH,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = kind === 'swift' ? 2 : 1;
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: 1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, t: rand(0, 1),
      fire: rand(0.4, 1.2),
      grounded: true, dead: false,
      hitN: 0, w: kind === 'gun' ? 16 : 14, h: 24
    };
  }

  function makeBoss(spec) {
    return {
      id: uid++,
      x: spec.w - 140, y: GY, vx: 0, vy: 0, face: -1,
      hp: bossHp(spec, isCore()), max: bossHp(spec, isCore()),
      kind: spec.boss, t: 0, fire: 1.1, spawn: 2.4,
      state: 'wait', grounded: true, dead: false, active: false,
      hitN: 0, w: G.stage >= 3 ? 24 : 20, h: G.stage >= 3 ? 34 : 32,
      name: spec.boss
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
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isCore() && !attract) {
      const extra = spec.ents.filter(function (e, idx) { return idx % 3 === 0; });
      for (i = 0; i < extra.length; i++) {
        const e = extra[i];
        const nx = e[0] + 56;
        if (!platUnder(nx, e[1], null)) continue;
        G.ents.push(makeEnt(nx, e[1], e[2] === 'gun' ? 'ash' : e[2], e[3], e[4]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.loot.length; i++) {
        const u = spec.loot[i];
        G.pickups.push({ x: u[0], y: u[1] - 18, kind: u[2], taken: false });
      }
    }
    G.stars = [];
    G.dragons = [];
    G.boss = makeBoss(spec);
    G.gate = spec.w - VW + 48;
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.slashT = 0;
    G.slashHit = 0;
    G.atkCd = 0;
    G.ninjT = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.4;
    G.clearT = 0;
    G.lock = 0;
    G.dropT = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    if (!attract) {
      G.ninj = ninjCount(isCore());
      G.ammo = starCount(isCore());
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
    return { x: p.x - p.w * 0.45, y: p.y - p.h, w: p.w * 0.9, h: p.h * 0.92 };
  }

  function slashBox() {
    const p = G.player;
    const x0 = p.face > 0 ? p.x : p.x - MELEE;
    return { x: x0, y: p.y - 30, w: MELEE, h: 32 };
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
      if (dx > 4 && dx < MELEE + 4 && Math.abs(e.y - p.y) < 24) {
        if (dx < bd) { bd = dx; best = e; }
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      e = G.boss;
      dx = (e.x - p.x) * p.face;
      if (dx > 4 && dx < MELEE + 8 && Math.abs(e.y - p.y) < 28) {
        if (dx < bd) best = e;
      }
    }
    return best;
  }

  function countStars(from) {
    let n = 0;
    for (let i = 0; i < G.stars.length; i++) if (G.stars[i].from === from && G.stars[i].life > 0) n++;
    return n;
  }

  function throwStar(x, y, vx, from, face, vy) {
    G.stars.push({
      x: x, y: y, vx: vx, vy: vy || 0,
      spin: 0, from: from, life: 1.15, face: face || (vx > 0 ? 1 : -1)
    });
    capArr(G.stars, 32);
  }

  function doSlash() {
    const p = G.player;
    G.slashT = SLASH_T;
    G.slashHit += 1;
    G.atkCd = 0.28;
    p.pose = 0.18;
    audio.slash();
    emit(6, {
      x: p.x + p.face * 22, y: p.y - 16, j: 8,
      vx0: p.face * 40, vx1: p.face * 220, vy0: -160, vy1: 40,
      life: 0.22, r0: 1, r1: 2.4, rgb: HOT
    });
    hitStop(0.032);
  }

  function doThrow() {
    const p = G.player;
    if (playing() && G.ammo <= 0) {
      toast('手里剑耗尽', true, false);
      audio.empty();
      G.atkCd = 0.16;
      return;
    }
    if (countStars('p') >= 3) {
      audio.empty();
      return;
    }
    G.atkCd = ATK_CD;
    p.pose = 0.12;
    if (playing()) {
      G.ammo -= 1;
      syncHud();
    }
    throwStar(p.x + p.face * 16, p.y - 18, p.face * STAR_SPD, 'p', p.face);
    audio.throw();
    emit(4, {
      x: p.x + p.face * 16, y: p.y - 18, j: 3,
      vx0: p.face * 80, vx1: p.face * 200, vy0: -40, vy1: 40,
      life: 0.16, r0: 1, r1: 2, rgb: CYN
    });
  }

  function attack() {
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.atkCd > 0) return;
    if (meleeEnemy()) doSlash();
    else doThrow();
  }

  function hurtEnt(e, dmg, src) {
    if (e.dead || e.hp <= 0) return;
    if (src === 'slash' && e.hitN === G.slashHit) return;
    if (src === 'slash') e.hitN = G.slashHit;
    e.hp -= dmg;
    const rgb = e === G.boss ? MAG : (src === 'star' ? CYN : src === 'dragon' ? HOT : GOLD);
    juice(e.x, e.y - 14, rgb, e === G.boss ? 1.4 : src === 'star' ? 0.75 : src === 'dragon' ? 1.25 : 1.15);
    if (src === 'slash') {
      hitStop(0.055);
      kick(3.2, 'hit');
      audio.hit(G.combo);
    } else if (src === 'star') {
      hitStop(0.038);
      kick(2.2, 'thump');
      audio.ping(G.combo);
    } else if (src === 'dragon') {
      hitStop(0.062);
      kick(4.4, 'boom');
      audio.hit(G.combo);
    } else {
      hitStop(0.05);
      kick(3.6, 'boom');
    }
    if (e.hp <= 0) {
      e.dead = true;
      e.hp = 0;
      bumpCombo();
      const kind = e === G.boss ? 'boss' : e.kind;
      const sc = (SCORE[kind] || 100) * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 28, '+' + sc, GOLD, e === G.boss || G.mult > 1);
      if (e === G.boss) {
        G.clearT = 1.85;
        audio.boss();
        screenFlash(GOLD, 0.45);
        kick(7.2, 'boom');
        toast(e.name + ' 击破', false, true);
      }
    } else if (e === G.boss) {
      floatText(e.x, e.y - 30, String(e.hp), MAG, false);
    }
  }

  function doNinjutsu() {
    if (!playing()) return;
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.ninj <= 0) {
      toast('火龙耗尽', true, false);
      audio.empty();
      return;
    }
    G.ninj -= 1;
    G.ninjT = 0.42;
    G.invuln = Math.max(G.invuln, 0.28);
    audio.ninj();
    screenFlash(HOT, 0.48);
    hitStop(0.07);
    kick(6.2, 'ninj');
    const p = G.player;
    popSpark(p.x + p.face * 18, p.y - 18, HOT, 28);
    rings.push({ x: p.x, y: p.y - 16, t: 0, rgb: GOLD, r: 36 });
    emit(18, {
      x: p.x + p.face * 20, y: p.y - 16, j: 18,
      vx0: p.face * 80, vx1: p.face * 340, vy0: -180, vy1: 60,
      life: 0.4, r0: 1.4, r1: 3.6, rgb: HOT
    });
    G.dragons.push({
      x: p.x + p.face * 22,
      y: p.y - 10,
      vx: p.face * DRAGON_SPD,
      face: p.face,
      life: DRAGON_LIFE,
      t: 0,
      hit: {}
    });
    capArr(G.dragons, 4);
    syncHud();
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
    G.stars = G.stars.filter(function (s) { return s.from === 'p'; });
    G.slashT = 0;
    syncPips();
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'shot' ? '中弹了' : '被击中了';
    showOverlay('lose', '命尽', why + ' · ' + G.score + ' 分 · 连击最高 ×' + Math.max(1, G.maxCombo || 1));
    audio.lose();
    syncHud();
  }

  function goWin() {
    addScore(8000);
    saveBest();
    G.mode = 'win';
    if (stageEl) {
      stageEl.classList.remove('win-flash');
      void stageEl.offsetWidth;
      stageEl.classList.add('win-flash');
    }
    const title = isCore() ? '忍核得手' : '族砦已破';
    showOverlay('win', title, (isCore() ? '火龙撕开更密的族众。 ' : '三关杀穿，族主倒下。 ') + G.score + ' 分');
    audio.win();
    syncHud();
  }

  function nextStage() {
    addScore(SCORE.stage * G.stage);
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    loadStage(G.stage, false);
    G.invuln = 0.8;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'raid';
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
    toast(isCore() ? '忍核' : STAGES[0].name, false, !isCore());
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
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '忍二', '侧跳斩杀，手里剑远打。闯过三关，族主现身。Shift 放出火龙。');
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
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    if (G.atkCd <= 0 && (G.clock * 2 | 0) % 3 === 0) {
      if (meleeEnemy() || countStars('p') < 2) attack();
    }
    if (p.x > G.levelW - 280) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
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
    const spd = WALK * (p.grounded ? 1 : AIR);
    p.vx = ax * spd;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);

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
      p.squash = 0.78;
      audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.03);
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

    if (playing() && p.grounded && p.x > G.checkX + 48 && standAt(p.x, p.y)) {
      G.checkX = p.x;
      G.checkY = p.y;
    }

    if (playing() && G.boss && !G.boss.active && !G.boss.dead && p.x > G.gate) {
      G.boss.active = true;
      toast(G.boss.name + ' 现身', false, true);
      audio.boss();
      screenFlash(HOT, 0.32);
      kick(4.2, 'boom');
      syncHud();
    }

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded) p.run += dt * 9;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    let i;
    if (G.slashT > 0 && G.slashT > 0.04) {
      let e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (inSlash(e.x, e.y, e.w, e.h)) hurtEnt(e, 1, 'slash');
      }
      if (G.boss && !G.boss.dead && G.boss.active && inSlash(G.boss.x, G.boss.y, G.boss.w, G.boss.h)) {
        hurtEnt(G.boss, 1, 'slash');
      }
      for (i = G.stars.length - 1; i >= 0; i--) {
        const s = G.stars[i];
        if (s.from === 'e' && inSlash(s.x, s.y + 8, 10, 10)) s.life = 0;
      }
    }

    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      if (hypot(p.x - u.x, p.y - 16 - u.y) < 22) {
        u.taken = true;
        if (u.kind === 'jade') {
          G.ninj = Math.min(NINJ_CAP, G.ninj + 1);
          addScore(SCORE.jade);
          juice(u.x, u.y, HOT, 0.95);
          toast('火龙 +1', false, true);
        } else {
          G.ammo = Math.min(STAR_CAP, G.ammo + 12);
          addScore(SCORE.ammo);
          juice(u.x, u.y, CYN, 0.85);
          toast('手里剑 +12', false, true);
        }
        audio.pickup();
        syncHud();
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isCore(), G.stage);
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

    if (e.kind === 'ash' || e.kind === 'gun' || e.kind === 'shade') {
      let dir = e.face;
      if (e.kind === 'shade' && Math.abs(p.x - e.x) < 210 && Math.abs(p.y - e.y) < 50) {
        dir = p.x > e.x ? 1 : -1;
      }
      const spd = (e.kind === 'gun' ? 44 : e.kind === 'shade' ? 92 : 66) * mul;
      const nx = e.x + dir * spd * dt;
      if (nx < e.a || nx > e.b || !standAt(nx + dir * 8, e.y)) {
        e.face = -e.face;
      } else {
        e.x = nx;
        e.face = dir;
      }
    }

    if (e.kind === 'swift') {
      if (e.grounded && Math.abs(p.x - e.x) < 220 && Math.abs(p.y - e.y) < 100 && e.t > 0.45) {
        e.face = p.x > e.x ? 1 : -1;
        e.vx = e.face * 156 * mul;
        e.vy = -390;
        e.grounded = false;
        e.t = 0;
      }
      if (!e.grounded) e.x += e.vx * dt;
      e.x = clamp(e.x, 20, G.levelW - 20);
    }

    if (e.kind === 'gun') {
      e.fire -= dt;
      const dy = Math.abs(p.y - e.y);
      const dx = p.x - e.x;
      if (e.fire <= 0 && dy < 46 && Math.abs(dx) < 340 && playing() && G.deadT <= 0) {
        e.face = dx > 0 ? 1 : -1;
        throwStar(e.x + e.face * 12, e.y - 16, e.face * 246 * (isCore() ? 1.16 : 1), 'e', e.face);
        e.fire = (isCore() ? 0.92 : 1.36) / (1 + (G.stage - 1) * 0.08);
        audio.beep(640, 0.04, 'square', 0.02, 280);
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const slashing = G.slashT > 0.05 && inSlash(e.x, e.y, e.w, e.h);
      if (!slashing && overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        die('hit');
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active) return;
    const p = G.player;
    const mul = spdMul(isCore(), G.stage);
    b.t += dt;
    b.fire -= dt;
    b.spawn -= dt;
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
    if (b.grounded) {
      if (dist > 76) b.x += b.face * 74 * mul * dt;
      else if (dist < 44 && b.t > 0.5) {
        b.vy = -370;
        b.vx = -b.face * 128;
        b.grounded = false;
        b.t = 0;
      }
    } else b.x += (b.vx || 0) * dt;
    b.x = clamp(b.x, G.levelW - VW + 40, G.levelW - 40);

    const low = b.hp < b.max * 0.5;
    const rate = (low ? 0.68 : 1.02) / mul;
    if (b.fire <= 0 && playing() && G.deadT <= 0) {
      throwStar(b.x + b.face * 16, b.y - 22, b.face * 286, 'e', b.face);
      if (G.stage >= 2 || low) {
        throwStar(b.x + b.face * 12, b.y - 28, b.face * 256, 'e', b.face, -48);
      }
      if (G.stage >= 3) {
        throwStar(b.x + b.face * 10, b.y - 14, b.face * 240, 'e', b.face, 36);
        if (low) throwStar(b.x - b.face * 10, b.y - 18, -b.face * 220, 'e', -b.face);
      }
      b.fire = rate;
      audio.beep(220, 0.08, 'sawtooth', 0.03, 80);
    }

    if (G.stage >= 3 && b.t > 2.4 && b.grounded) {
      juice(b.x, b.y - 16, PUR, 0.8);
      b.x = clamp(p.x - b.face * 96, G.levelW - VW + 50, G.levelW - 50);
      b.t = 0;
      popSpark(b.x, b.y - 16, PUR, 22);
    }

    if (G.stage >= 3 && b.spawn <= 0 && playing()) {
      let n = 0;
      for (let i = 0; i < G.ents.length; i++) if (!G.ents[i].dead && G.ents[i].kind === 'shade') n++;
      if (n < 2) {
        const sx0 = clamp(b.x - b.face * 70, G.levelW - VW + 60, G.levelW - 60);
        if (standAt(sx0, GY)) {
          G.ents.push(makeEnt(sx0, GY, 'shade', G.levelW - VW + 30, G.levelW - 30));
          popSpark(sx0, GY - 16, PUR, 16);
        }
      }
      b.spawn = low ? 3.1 : 4.4;
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const slashing = G.slashT > 0.05 && inSlash(b.x, b.y, b.w, b.h);
      if (!slashing && overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        die('hit');
      }
    }
  }

  function updateStars(dt) {
    const p = G.player;
    for (let i = G.stars.length - 1; i >= 0; i--) {
      const s = G.stars[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += (s.vy || 0) * dt;
      s.spin += dt * 14;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.stars.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        for (let k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (e.dead) continue;
          if (hypot(s.x - e.x, s.y - (e.y - 14)) < 14) {
            hurtEnt(e, 1, 'star');
            hit = true;
            break;
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active) {
          if (hypot(s.x - G.boss.x, s.y - (G.boss.y - 18)) < 16) {
            hurtEnt(G.boss, 1, 'star');
            hit = true;
          }
        }
        if (!hit) {
          for (let k = G.stars.length - 1; k >= 0; k--) {
            const o = G.stars[k];
            if (o.from !== 'e' || o === s) continue;
            if (hypot(s.x - o.x, s.y - o.y) < 10) {
              o.life = 0;
              hit = true;
              popSpark(s.x, s.y, CYN, 10);
              audio.ping(1);
              break;
            }
          }
        }
        if (hit) {
          popSpark(s.x, s.y, CYN, 12);
          G.stars.splice(i, 1);
        }
      } else if (playing() && G.deadT <= 0) {
        if (G.invuln <= 0 && hypot(s.x - p.x, s.y - (p.y - 16)) < 12) {
          G.stars.splice(i, 1);
          die('shot');
        }
      }
    }
  }

  function updateDragons(dt) {
    for (let i = G.dragons.length - 1; i >= 0; i--) {
      const d = G.dragons[i];
      d.life -= dt;
      d.t += dt;
      d.x += d.vx * dt;
      d.y += Math.sin(d.t * 10) * 18 * dt;
      if (!REDUCE) {
        emit(2, {
          x: d.x, y: d.y - 8, j: 6,
          vx0: -d.face * 40, vx1: -d.face * 120, vy0: -80, vy1: 40,
          life: 0.22, r0: 1.2, r1: 3.2, rgb: d.t % 0.2 < 0.1 ? HOT : GOLD, g: 80
        });
      }
      let k, e;
      for (k = 0; k < G.ents.length; k++) {
        e = G.ents[k];
        if (e.dead || d.hit[e.id]) continue;
        if (hypot(d.x - e.x, d.y - (e.y - 12)) < 28) {
          d.hit[e.id] = 1;
          hurtEnt(e, 9, 'dragon');
        }
      }
      if (G.boss && !G.boss.dead && G.boss.active && !d.hit[G.boss.id]) {
        if (hypot(d.x - G.boss.x, d.y - (G.boss.y - 16)) < 30) {
          d.hit[G.boss.id] = 1;
          hurtEnt(G.boss, 5, 'dragon');
        }
      }
      for (k = G.stars.length - 1; k >= 0; k--) {
        const s = G.stars[k];
        if (s.from === 'e' && hypot(d.x - s.x, d.y - 8 - s.y) < 22) s.life = 0;
      }
      if (d.life <= 0 || d.x < G.camX - 80 || d.x > G.camX + VW + 80) {
        popSpark(d.x, d.y - 8, GOLD, 22);
        G.dragons.splice(i, 1);
      }
    }
  }

  function updateFx(dt) {
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.slashT > 0) G.slashT -= dt;
    if (G.atkCd > 0) G.atkCd -= dt;
    if (G.ninjT > 0) G.ninjT -= dt;
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
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
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

    const cap = REDUCE ? 18 : (isCore() ? 56 : 40);
    if (embers.length < cap) {
      embers.push({
        x: G.camX + rand(-40, VW + 40),
        y: G.camY + rand(-10, VH),
        r: rand(1.1, 2.4),
        v: rand(18, 42),
        drift: rand(-18, 18)
      });
    }
    for (i = embers.length - 1; i >= 0; i--) {
      o = embers[i];
      o.y -= o.v * dt;
      o.x += o.drift * dt;
      if (o.y < G.camY - 12) {
        o.y = G.camY + VH + 8;
        o.x = G.camX + rand(-40, VW + 40);
      }
    }
    if (embers.length > cap) embers.splice(0, embers.length - cap);
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.38;
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
    updateStars(dt);
    updateDragons(dt);
    updateCam(dt);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (isCore()) {
      g.addColorStop(0, '#1a0608');
      g.addColorStop(0.45, '#22080a');
      g.addColorStop(1, '#180606');
    } else if (G.stage >= 3) {
      g.addColorStop(0, '#12060c');
      g.addColorStop(0.5, '#1a0a08');
      g.addColorStop(1, '#140806');
    } else if (G.stage === 2) {
      g.addColorStop(0, '#180c08');
      g.addColorStop(0.5, '#1c1008');
      g.addColorStop(1, '#140a06');
    } else {
      g.addColorStop(0, '#1c0c04');
      g.addColorStop(0.5, '#241208');
      g.addColorStop(1, '#180a06');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 52);
    ctx.fillStyle = rgba(GOLD, isCore() ? 0.32 : 0.58);
    ctx.beginPath();
    ctx.arc(mx, my, 26 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.28);
    ctx.beginPath();
    ctx.arc(mx, my, 40 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.2);
    ctx.beginPath();
    ctx.arc(mx - 7 * scale, my - 5 * scale, 10 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBuildings() {
    const par = G.camX * 0.26;
    const base = sy(GY + 8);
    let i, x, h, w, hue;
    if (G.stage === 2) {
      for (i = -2; i < 14; i++) {
        x = sx((Math.floor((G.camX + par) / 110) + i) * 110 - par * 0.4);
        h = (50 + hash2(i + 4 + G.stage * 3) * 70) * scale;
        ctx.fillStyle = '#140a06';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + 40 * scale, base - h);
        ctx.lineTo(x + 80 * scale, base);
        ctx.fill();
      }
    }
    for (i = -2; i < 22; i++) {
      x = sx((Math.floor((G.camX + par) / 70) + i) * 70 - par);
      h = (38 + hash2(i + 19 + G.stage * 7) * 90) * scale;
      w = (36 + hash2(i + 3) * 28) * scale;
      ctx.fillStyle = i % 3 === 0 ? '#160a06' : '#100806';
      ctx.fillRect(x, base - h, w, h + 40 * scale);
      hue = hash2(i + 11);
      ctx.fillStyle = hue > 0.7 ? rgba(HOT, 0.4) : hue > 0.45 ? rgba(GOLD, 0.28) : rgba(CYN, 0.14);
      const win = 3 + (hash2(i + 5) * 4 | 0);
      for (let k = 0; k < win; k++) {
        ctx.fillRect(x + 6 * scale, base - h + 8 * scale + k * 10 * scale, 4 * scale, 5 * scale);
        ctx.fillRect(x + 16 * scale, base - h + 8 * scale + k * 10 * scale, 4 * scale, 5 * scale);
      }
    }
  }

  function drawTorii(x, y) {
    const s = scale;
    const px = sx(x);
    const py = sy(y);
    ctx.strokeStyle = rgba(CRIM, 0.85);
    ctx.lineWidth = 3.2 * s;
    ctx.beginPath();
    ctx.moveTo(px - 16 * s, py);
    ctx.lineTo(px - 16 * s, py - 36 * s);
    ctx.moveTo(px + 16 * s, py);
    ctx.lineTo(px + 16 * s, py - 36 * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(HOT, 0.9);
    ctx.lineWidth = 3.4 * s;
    ctx.beginPath();
    ctx.moveTo(px - 22 * s, py - 36 * s);
    ctx.lineTo(px + 22 * s, py - 36 * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(px - 18 * s, py - 30 * s);
    ctx.lineTo(px + 18 * s, py - 30 * s);
    ctx.stroke();
  }

  function drawBanner(x, y) {
    const s = scale;
    const px = sx(x);
    const py = sy(y);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - 34 * s);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.55 + Math.sin(G.clock * 3 + x) * 0.08);
    ctx.beginPath();
    ctx.moveTo(px, py - 34 * s);
    ctx.lineTo(px + 14 * s, py - 26 * s);
    ctx.lineTo(px, py - 18 * s);
    ctx.fill();
  }

  function drawProps() {
    if (G.stage === 2) {
      drawTorii(220, GY);
      drawTorii(980, GY);
      drawTorii(1780, GY);
      drawTorii(2360, GY);
    } else if (G.stage >= 3) {
      drawBanner(180, GY);
      drawBanner(760, GY);
      drawBanner(1400, GY);
      drawBanner(2100, GY);
      drawBanner(2580, GY);
    } else {
      drawBanner(520, GY);
      drawBanner(1280, GY);
      drawBanner(1900, GY);
    }
  }

  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      const h = p.h * scale;
      ctx.fillStyle = p.base ? '#1a0c06' : '#1c1008';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(HOT, p.base ? 0.88 : 0.72);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.32);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        ctx.fillStyle = rgba(CRIM, 0.12);
        ctx.fillRect(x, y + h - 6 * scale, w, 6 * scale);
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.28) : rgba(GOLD, 0.22);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 4 * scale);
        }
      }
    }
  }

  function drawStar(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.spin);
    ctx.fillStyle = s.from === 'p' ? rgba(CYN, 0.95) : rgba(HOT, 0.95);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * TAU / 4;
      ctx.lineTo(Math.cos(a) * 5.2 * scale, Math.sin(a) * 5.2 * scale);
      ctx.lineTo(Math.cos(a + 0.8) * 1.6 * scale, Math.sin(a + 0.8) * 1.6 * scale);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawDragon(d) {
    const s = scale;
    let i;
    for (i = 7; i >= 0; i--) {
      const px = sx(d.x - d.face * i * 13);
      const py = sy(d.y - 10 + Math.sin(d.t * 12 + i * 0.7) * 5);
      const r = (7.2 - i * 0.55) * s;
      ctx.fillStyle = rgba(i < 2 ? GOLD : HOT, 0.55 + (1 - i / 8) * 0.4);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, TAU);
      ctx.fill();
    }
    const hx = sx(d.x + d.face * 8);
    const hy = sy(d.y - 10);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(hx, hy - 6 * s);
    ctx.lineTo(hx + d.face * 14 * s, hy);
    ctx.lineTo(hx, hy + 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.arc(hx + d.face * 2 * s, hy - 2 * s, 1.6 * s, 0, TAU);
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
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-6 * s, -13 * s, 12 * s, 2 * s);
    const scarf = Math.sin(t * 8) * 3;
    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(-2 * s, -20 * s);
    ctx.quadraticCurveTo((-12 - scarf) * s, -16 * s, (-10 - scarf) * s, -8 * s);
    ctx.stroke();
    ctx.fillStyle = '#180e06';
    ctx.beginPath();
    ctx.ellipse(0, -28 * s, 6.2 * s, 6.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.fillRect(1 * s, -30 * s, 4.2 * s, 1.6 * s);
    if (opt.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.4 * s;
      ctx.strokeRect(-5 * s, -32 * s, 10 * s, 5 * s);
      if (opt.clan) {
        ctx.fillStyle = rgba(MAG, 0.85);
        ctx.fillRect(-4 * s, -36 * s, 8 * s, 3 * s);
      }
    }
    ctx.strokeStyle = rgba(WHT, 0.85);
    ctx.lineWidth = 1.8 * s;
    const arm = pose > 0 ? 10 * s : (slash > 0 ? 14 * s : 4 * s);
    const armY = pose > 0 ? -22 * s : (slash > 0 ? -18 * s : -16 * s);
    ctx.beginPath();
    ctx.moveTo(2 * s, -18 * s);
    ctx.lineTo(arm, armY);
    ctx.stroke();
    if (slash > 0) {
      ctx.strokeStyle = rgba(HOT, 0.88);
      ctx.lineWidth = 2.4 * s;
      ctx.beginPath();
      ctx.arc(8 * s, -16 * s, 16 * s, -0.9, 0.7);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.75);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(8 * s, -16 * s, 12 * s, -0.8, 0.55);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(G.clock * 4) * 3);
    const s = scale;
    const jade = u.kind === 'jade';
    ctx.fillStyle = rgba(jade ? HOT : CYN, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 10 * s, 0, TAU);
    ctx.fill();
    if (jade) {
      ctx.fillStyle = rgba(HOT, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y, 5.2 * s, 7.2 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(x, y + 1.4 * s, 1.8 * s, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(G.clock * 4);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i * TAU / 4;
        ctx.lineTo(Math.cos(a) * 6 * s, Math.sin(a) * 6 * s);
        ctx.lineTo(Math.cos(a + 0.8) * 1.8 * s, Math.sin(a + 0.8) * 1.8 * s);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawGate() {
    if (G.boss && G.boss.active) return;
    const x = sx(G.gate);
    const y0 = sy(G.camY);
    ctx.fillStyle = rgba(HOT, 0.08 + Math.sin(G.clock * 4) * 0.03);
    ctx.fillRect(x, y0, 6 * scale, VH * scale);
    ctx.fillStyle = rgba(GOLD, 0.4);
    ctx.fillRect(x + 2 * scale, y0, 2 * scale, VH * scale);
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
    for (i = 0; i < embers.length; i++) {
      o = embers[i];
      ctx.fillStyle = rgba(i % 3 ? HOT : GOLD, 0.28);
      ctx.fillRect(sx(o.x), sy(o.y), o.r * scale, o.r * scale);
    }
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

  function drawNinjFlash() {
    if (G.ninjT <= 0) return;
    const a = G.ninjT / 0.42;
    ctx.fillStyle = rgba(HOT, 0.14 * a);
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.strokeStyle = rgba(GOLD, 0.4 * a);
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(sx(G.player.x), sy(G.player.y - 16), (28 + (1 - a) * 120) * scale, 0, TAU);
    ctx.stroke();
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#120804';
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
    drawBuildings();
    drawProps();
    drawPlats();
    drawGate();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      const rgb = e.kind === 'gun' ? ORG : e.kind === 'swift' ? CYN : e.kind === 'shade' ? PUR : HOT2;
      drawFigure(e.x, e.y, e.face, G.clock, rgb, 0.92, {
        run: G.clock * 8, grounded: e.grounded, squash: 1, pose: 0,
        slash: 0, boss: false
      });
    }
    if (G.boss && !G.boss.dead) {
      const ba = !G.boss.active ? 0.4 : 1;
      ctx.globalAlpha = ba;
      const brgb = G.stage >= 3 ? MAG : G.stage === 2 ? GOLD : CRIM;
      drawFigure(G.boss.x, G.boss.y, G.boss.face, G.clock, brgb, G.stage >= 3 ? 1.38 : 1.26, {
        run: G.clock * 5, grounded: G.boss.grounded, squash: 1,
        pose: G.boss.fire < 0.2 ? 0.12 : 0, slash: 0, boss: true, clan: G.stage >= 3
      });
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < G.dragons.length; i++) drawDragon(G.dragons[i]);
    for (i = 0; i < G.stars.length; i++) drawStar(G.stars[i]);

    const p = G.player;
    if (p) {
      const blink = playing() && G.invuln > 0 && G.deadT <= 0;
      drawFigure(p.x, p.y, p.face, G.clock, HOT, 1, {
        run: p.run, grounded: p.grounded, squash: p.squash,
        pose: p.pose, slash: G.slashT, blink: blink, boss: false
      });
    }

    drawFx();
    drawNinjFlash();
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
    const ninj = k === 'z' || k === 'Z' || k === 'Shift'
      || code === 'ShiftLeft' || code === 'ShiftRight';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;

    if (down && (isMove || space || ninj || k === 'Enter')) e.preventDefault();
    if (!down) return;
    if (e.repeat && (space || ninj)) return;

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
      startGame('core');
      return;
    }
    if (ninj && !space) {
      if (overlayOpen()) return;
      doNinjutsu();
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
    hold(document.getElementById('btn-slash'), function () {
      if (playing()) attack();
    }, null);
    hold(document.getElementById('btn-ninj'), function () { doNinjutsu(); }, null);
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
      if (G.mode === 'win' && !isCore()) startGame('core');
      else goTitle();
    });
  }
  if (modeRaid) {
    modeRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
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
    }
  });

  requestAnimationFrame(frame);
})();
