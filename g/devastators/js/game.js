'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const STRAFE = 228;
  const FIRE_CD = 0.072;
  const SHOT_SPD = 720;
  const MAX_PSHOT = 12;
  const NADE_MAX = 9;
  const NADE_START = 5;
  const NADE_CD = 0.48;
  const ROCK_MAX = 6;
  const ROCK_START = 1;
  const INVULN = 1.24;
  const DIE_T = 0.86;
  const VP_Y = 46;
  const HIT_R = 12;
  const Y_NEAR = 664;
  const Y_FAR = 428;
  const BEST_KEY = 'playbox-devastators-best';
  const MUTE_KEY = 'playbox-devastators-mute';
  const OPS = '方向 / WASD 走 · 空格射击 · Shift / Z 手雷 · R 重开 · M 静音';
  const LEAD = '从背后冲进城核。按住上加速推进，下蹲进掩体。机枪朝街心打，手雷越车，锁定甲车开炮。撞甲丢命。短关之后是关底。';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 100, 20];
  const HOT2 = [255, 176, 112];
  const WHT = [255, 244, 232];
  const MUD = [168, 88, 48];
  const IRON = [56, 32, 22];
  const STL = [110, 72, 48];
  const DEEP = [24, 8, 6];
  const KHAKI = [204, 140, 68];
  const PINK = [255, 154, 180];
  const NEON = [255, 64, 160];
  const CONC = [72, 48, 40];
  const ASH = [48, 28, 22];

  const SCORE = {
    grunt: 80,
    runner: 120,
    dropper: 110,
    sniper: 160,
    car: 180,
    jeep: 220,
    tank: 260,
    heli: 190,
    crate: 360,
    rocket: 420,
    boss: 3600,
    stage: 1400
  };

  const STAGES = [
    {
      name: '夜街',
      boss: '夜甲',
      hp: 58,
      theme: 'night',
      waves: [
        { t: 0.4, kind: 'grunts', n: 5 },
        { t: 2.0, kind: 'cars' },
        { t: 3.6, kind: 'jeeps', n: 1 },
        { t: 5.2, kind: 'runners', n: 3 },
        { t: 6.8, kind: 'droppers', n: 2 },
        { t: 8.6, kind: 'mix1' },
        { t: 11.0, kind: 'grunts', n: 6 },
        { t: 13.2, kind: 'helis', n: 1 },
        { t: 16.0, kind: 'boss' }
      ]
    },
    {
      name: '楼廊',
      boss: '楼炮',
      hp: 76,
      theme: 'tower',
      waves: [
        { t: 0.35, kind: 'grunts', n: 6 },
        { t: 1.8, kind: 'snipers', n: 2 },
        { t: 3.4, kind: 'cars' },
        { t: 5.0, kind: 'jeeps', n: 1 },
        { t: 6.6, kind: 'helis', n: 2 },
        { t: 8.2, kind: 'runners', n: 4 },
        { t: 10.0, kind: 'mix2' },
        { t: 12.4, kind: 'snipers', n: 3 },
        { t: 14.6, kind: 'tanks', n: 1 },
        { t: 17.6, kind: 'boss' }
      ]
    },
    {
      name: '使馆',
      boss: '核门',
      hp: 98,
      theme: 'embassy',
      waves: [
        { t: 0.3, kind: 'grunts', n: 7 },
        { t: 1.6, kind: 'cars' },
        { t: 3.2, kind: 'tanks', n: 1 },
        { t: 4.8, kind: 'snipers', n: 2 },
        { t: 6.4, kind: 'helis', n: 2 },
        { t: 8.0, kind: 'runners', n: 5 },
        { t: 9.8, kind: 'mix3' },
        { t: 12.2, kind: 'jeeps', n: 2 },
        { t: 14.0, kind: 'tanks', n: 1 },
        { t: 15.8, kind: 'droppers', n: 3 },
        { t: 18.4, kind: 'boss' }
      ]
    }
  ];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }
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
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function isDense() {
    return G.kind === 'dense';
  }
  function spdMul() {
    return (isDense() ? 1.26 : 1) * (1 + Math.max(0, G.stage - 1) * 0.07);
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function scrollSpd() {
    if (G.boss && G.boss.active && !G.boss.dead) return isDense() ? 24 : 16;
    const base = isDense() ? 96 : 66;
    if (inU()) return base * 1.58;
    if (inD()) return base * 0.42;
    return base;
  }
  function fireRate() {
    return isDense() ? 0.06 : FIRE_CD;
  }
  function eFireMul() {
    return isDense() ? 0.74 : 1;
  }
  function themeOf() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    return spec.theme;
  }
  function depthScale(y) {
    const t = clamp((y - VP_Y) / (VH - VP_Y), 0, 1);
    return lerp(0.38, 1.16, t * t * 0.28 + t * 0.72);
  }
  function roadHalf(y) {
    const t = clamp((y - VP_Y) / (VH - VP_Y), 0, 1);
    return lerp(22, 188, t);
  }
  function wallL(y) {
    return VW * 0.5 - roadHalf(y);
  }
  function wallR(y) {
    return VW * 0.5 + roadHalf(y);
  }
  function isCover(kind) {
    return kind === 'car';
  }
  function isArmor(kind) {
    return kind === 'jeep' || kind === 'tank' || kind === 'heli' || kind === 'boss';
  }
  function isCrash(kind) {
    return kind === 'jeep' || kind === 'tank' || kind === 'heli' || kind === 'runner' || kind === 'grunt' || kind === 'dropper';
  }
  function hpOf(kind) {
    if (kind === 'car') return 5;
    if (kind === 'tank') return 4;
    if (kind === 'jeep') return 3;
    if (kind === 'heli') return 3;
    if (kind === 'sniper') return 2;
    return 1;
  }
  function rOf(kind) {
    if (kind === 'car') return 18;
    if (kind === 'tank') return 18;
    if (kind === 'jeep') return 16;
    if (kind === 'heli') return 15;
    if (kind === 'sniper') return 11;
    if (kind === 'crate' || kind === 'rocket') return 10;
    return 11;
  }
  function scoreOf(kind) {
    return SCORE[kind] || 80;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-devastators-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-devastators-mute') throw new Error('mute key');
    if (depthScale(80) >= depthScale(600)) throw new Error('perspective');
    if (roadHalf(80) >= roadHalf(600)) throw new Error('road taper');
    if (FIRE_CD >= 0.1) throw new Error('fire cd');
    if (STRAFE < 180) throw new Error('strafe');
    if (Y_FAR >= Y_NEAR) throw new Error('near field');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[0].waves.length >= STAGES[2].waves.length) throw new Error('later denser');
    let i;
    for (i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      if (!s.name || !s.boss || !s.waves.length) throw new Error('stage ' + i);
      const last = s.waves[s.waves.length - 1];
      if (last.kind !== 'boss') throw new Error('boss last ' + s.name);
    }
    if (!isCover('car') || isCover('grunt')) throw new Error('cover rules');
    if (!isArmor('jeep') || isArmor('grunt')) throw new Error('armor rules');
    if (!isCrash('tank') || isCrash('car')) throw new Error('crash rules');
    G.kind = 'dense';
    G.stage = 1;
    if (spdMul() <= 1) throw new Error('dense faster');
    G.kind = 'raid';
    G.stage = 2;
    const later = spdMul();
    G.stage = 1;
    if (later <= spdMul()) throw new Error('later faster');
    if (STAGES[0].name !== '夜街' || STAGES[2].name !== '使馆') throw new Error('city stages');
    return true;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
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
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
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
      f.frequency.value = hp || 700;
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
    shot() {
      this.ensure();
      this.beep(1180, 0.03, 'square', 0.032, 460);
      this.noise(0.014, 0.012, 1900);
    },
    nade() {
      this.ensure();
      this.beep(210, 0.1, 'sawtooth', 0.042, 76);
      this.beep(460, 0.07, 'square', 0.028, 150);
    },
    rocket() {
      this.ensure();
      this.beep(340, 0.11, 'sawtooth', 0.042, 130);
      this.beep(980, 0.08, 'triangle', 0.03, 380);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.03, 0.028, 1300);
      this.beep(620 * lift, 0.05, 'square', 0.036, 1080 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.07, 220);
      this.beep(150, 0.2, 'sawtooth', 0.05, 42);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.058, 280);
      this.beep(260, 0.22, 'sawtooth', 0.05, 60);
      this.beep(120, 0.34, 'sine', 0.045, 36);
    },
    lock() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.028, 1320);
    },
    pickup() {
      this.ensure();
      this.beep(520, 0.07, 'sine', 0.04, 780);
      this.beep(780, 0.1, 'triangle', 0.036, 1170);
    },
    boss() {
      this.ensure();
      this.beep(100, 0.22, 'sawtooth', 0.06, 50);
      this.beep(300, 0.16, 'square', 0.04, 160);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.26, 'triangle', 0.05, 1560);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.045, 80);
      this.beep(130, 0.3, 'sine', 0.05, 46);
    },
    start() {
      this.ensure();
      this.beep(310, 0.08, 'square', 0.04, 620);
      this.beep(620, 0.12, 'triangle', 0.035, 930);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
    },
    duck() {
      this.ensure();
      this.beep(180, 0.05, 'triangle', 0.022, 90);
    }
  };

  const G = {
    mode: 'title',
    kind: 'raid',
    stage: 1,
    stageT: 0,
    waveI: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    nextLife: LIFE_EVERY,
    nades: NADE_START,
    rockets: ROCK_START,
    why: '',
    t: 0,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: HOT,
    scroll: 0,
    fireCd: 0,
    nadeCd: 0,
    muzzle: 0,
    invuln: 0,
    deadT: 0,
    winT: 0,
    toastT: 0,
    lock: null,
    lockBeep: 0,
    crouch: false,
    player: null,
    boss: null,
    enemies: [],
    shots: [],
    nadeshots: [],
    pickups: []
  };

  const canvas = el('c');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  const stageEl = el('stage');
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnRaid = el('btn-raid');
  const btnDense = el('btn-dense');
  const modeRaid = el('mode-raid');
  const modeDense = el('mode-dense');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const bestEl = el('best');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const gunLabel = el('gun-label');
  const nadeLabel = el('nade-label');
  const rockLabel = el('rock-label');
  const bossWrap = el('boss-wrap');
  const bossName = el('boss-name');
  const bossBar = el('boss-bar');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');

  let W = 480;
  let H = 720;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let nadeQueued = false;

  const keys = { u: false, d: false, l: false, r: false, fire: false, nade: false };
  const demo = { u: true, d: false, l: false, r: false, fire: true, nade: false };
  const pointer = { down: false, x: VW * 0.5, y: VH - 140, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];

  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
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
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    if (G.mode === 'title') return demo.fire;
    if (overlayBlocksPlay()) return false;
    return keys.fire || pointer.down;
  }
  function nadeHeld() {
    if (G.mode === 'title') return demo.nade;
    if (overlayBlocksPlay()) return false;
    return keys.nade || nadeQueued;
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }

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
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
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
      const node = document.createElement('span');
      node.className = 'pip';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    while (pips.length > n) {
      const node = pips.pop();
      if (node && node.parentNode) node.parentNode.removeChild(node);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }
  function syncModes() {
    const d = isDense();
    if (modeRaid) modeRaid.setAttribute('aria-pressed', d ? 'false' : 'true');
    if (modeDense) modeDense.setAttribute('aria-pressed', d ? 'true' : 'false');
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '夜街';
      else if (G.boss && G.boss.active && !G.boss.dead) stageLabel.textContent = spec.boss;
      else stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '城核' : '毁灭';
      tagLabel.classList.toggle('warn', isDense() || G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    const locked = !!(G.lock && G.rockets > 0);
    if (gunLabel) {
      gunLabel.textContent = locked ? '锁定' : (G.rockets > 0 ? '火炮' : '机枪');
      gunLabel.classList.toggle('hot', G.rockets > 0 && !locked);
      gunLabel.classList.toggle('lock', locked);
    }
    if (nadeLabel) {
      nadeLabel.textContent = '雷 ' + G.nades;
      nadeLabel.classList.toggle('low', G.nades <= 1);
    }
    if (rockLabel) {
      rockLabel.textContent = '炮 ' + G.rockets;
      rockLabel.classList.toggle('hot', G.rockets >= 3);
      rockLabel.classList.toggle('low', G.rockets <= 0);
    }
    if (bossWrap) {
      const on = !!(G.boss && G.boss.active && !G.boss.dead && G.mode !== 'title');
      bossWrap.hidden = !on;
      if (on) {
        if (bossName) bossName.textContent = spec.boss;
        if (bossBar) {
          const v = clamp(G.boss.hp / G.boss.max, 0, 1);
          bossBar.style.transform = 'scaleX(' + v + ')';
          bossBar.classList.toggle('low', v < 0.32);
          bossBar.classList.toggle('hot', v > 0.7);
        }
      }
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 蹲掩体 · 锁定开炮', 'warn');
    else if (G.mode === 'win') setHint('使馆捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 蹲进车后 · 别撞甲', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss + ' · 锁定开炮', 'hot');
    else if (G.lock && G.rockets > 0) setHint('锁定甲车 · Shift 开炮', 'hot');
    else if (G.nades <= 1 && G.rockets <= 0) setHint('雷将尽 · 打黄兵补雷', 'warn');
    else if (G.crouch) setHint('蹲进掩体 · 手雷越车', '');
    else setHint('按住上推进 · 蹲进掩体 · 锁定开炮', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DVST';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = '换模式';
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
        g: spec.g == null ? 280 : spec.g
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
  function boomAt(x, y, power, rgb) {
    const p = power || 1;
    emit(10 + (p * 12) | 0, {
      x: x, y: y, j: 8 + p * 6,
      vx0: -240 * p, vx1: 240 * p, vy0: -280 * p, vy1: 80 * p,
      life: 0.32 + p * 0.16, r0: 1.2, r1: 3.4 + p, rgb: rgb || HOT, g: 220
    });
    popSpark(x, y, rgb || HOT, 12 + p * 12);
    screenFlash(rgb || HOT, 0.16 + p * 0.1);
    kick(2.4 + p * 2.6);
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
    if (!playing()) return;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.04);
      if (comboBox) {
        comboBox.classList.remove('hot');
        void comboBox.offsetWidth;
        comboBox.classList.add('hot');
      }
    }
    if (G.combo % 3 === 0) {
      const p = G.player;
      if (p) floatText(p.x, p.y - 40, G.combo + ' 链', GOLD, true);
      hitStop(0.036);
    }
    syncHud();
  }

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 64; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.4, 2.0),
        a: rand(0.1, 0.46),
        z: rand(0.3, 1.15),
        neon: Math.random() < 0.28
      });
    }
  }

  function makePlayer() {
    return {
      x: VW * 0.5,
      y: VH - 148,
      vx: 0,
      vy: 0,
      r: HIT_R,
      run: 0
    };
  }

  function makeEnemy(kind, x, y, extra) {
    const e = {
      kind: kind,
      x: x,
      y: y,
      vx: 0,
      vy: kind === 'grunt' ? 28 : kind === 'runner' ? 86 : kind === 'dropper' ? 34 : 0,
      hp: Math.max(1, Math.round(hpOf(kind) * (isArmor(kind) || kind === 'car' || kind === 'sniper' ? hpMul() : 1))),
      r: rOf(kind),
      w: kind === 'car' ? 42 : kind === 'tank' ? 46 : kind === 'jeep' ? 38 : 22,
      h: kind === 'car' ? 22 : kind === 'tank' ? 24 : kind === 'jeep' ? 20 : 18,
      alive: true,
      t: 0,
      fire: rand(0.18, 0.9),
      flash: 0,
      score: scoreOf(kind),
      dir: extra && extra.dir != null ? extra.dir : (Math.random() < 0.5 ? -1 : 1),
      side: extra && extra.side != null ? extra.side : 0,
      yellow: kind === 'dropper'
    };
    if (kind === 'tank') e.vx = e.dir * 78;
    if (kind === 'jeep') e.vx = e.dir * 96;
    if (kind === 'heli') e.vy = 32;
    if (kind === 'sniper') e.vy = 18;
    if (kind === 'car') e.vy = 8;
    return e;
  }

  function makeBoss(spec) {
    return {
      name: spec.boss,
      kind: spec.theme,
      x: VW * 0.5,
      y: -40,
      vx: 58,
      r: spec.theme === 'embassy' ? 32 : 26,
      hp: Math.round(spec.hp * hpMul()),
      max: Math.round(spec.hp * hpMul()),
      active: false,
      dead: false,
      t: 0,
      fire: 0.55,
      flash: 0,
      state: 'idle',
      enter: 0,
      alive: true
    };
  }

  function loadStage(n, attract) {
    G.stage = n;
    G.stageT = 0;
    G.waveI = 0;
    G.enemies.length = 0;
    G.shots.length = 0;
    G.nadeshots.length = 0;
    G.pickups.length = 0;
    G.scroll = 0;
    G.winT = 0;
    G.deadT = 0;
    G.fireCd = 0;
    G.nadeCd = 0;
    G.muzzle = 0;
    G.lock = null;
    G.player = makePlayer();
    G.boss = makeBoss(STAGES[n - 1]);
    G.invuln = attract ? 0 : 0.8;
    G.crouch = false;
    if (attract) {
      spawnEnemy(makeEnemy('grunt', 170, 90));
      spawnEnemy(makeEnemy('grunt', 310, 50));
      spawnEnemy(makeEnemy('car', 240, 168));
      spawnEnemy(makeEnemy('runner', 200, -10));
      spawnEnemy(makeEnemy('jeep', 130, 110, { dir: 1 }));
      spawnEnemy(makeEnemy('dropper', 280, 40));
    }
  }

  function liveEnemies() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function spawnEnemy(e) {
    G.enemies.push(e);
    capArr(G.enemies, 56);
  }

  function laneX(i, total, y) {
    const t = total <= 1 ? 0.5 : i / (total - 1);
    const half = roadHalf(y == null ? 80 : y) - 28;
    return VW * 0.5 + lerp(-half, half, t);
  }

  function spawnWave(w) {
    const extra = isDense() ? 2 : 0;
    let i;
    let n;
    if (w.kind === 'grunts') {
      n = (w.n || 5) + extra;
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('grunt', laneX(i, n) + rand(-12, 12), -18 - i * 16));
      }
    } else if (w.kind === 'runners') {
      n = (w.n || 3) + (isDense() ? 1 : 0);
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('runner', laneX(i, n), -16 - i * 20));
      }
    } else if (w.kind === 'droppers') {
      n = (w.n || 2) + (isDense() ? 1 : 0);
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('dropper', laneX(i, n) + rand(-10, 10), -12 - i * 18));
      }
    } else if (w.kind === 'cars') {
      const xs = isDense() ? [150, 240, 330] : [168, 312];
      for (i = 0; i < xs.length; i++) {
        spawnEnemy(makeEnemy('car', xs[i] + rand(-8, 8), 58 + i * 12));
      }
    } else if (w.kind === 'jeeps') {
      n = w.n || 1;
      for (i = 0; i < n; i++) {
        const fromL = i % 2 === 0;
        spawnEnemy(makeEnemy('jeep', fromL ? wallL(80) + 36 : wallR(80) - 36, 64 + i * 26, { dir: fromL ? 1 : -1 }));
      }
    } else if (w.kind === 'tanks') {
      n = w.n || 1;
      for (i = 0; i < n; i++) {
        const fromL = i % 2 === 0;
        spawnEnemy(makeEnemy('tank', fromL ? wallL(90) + 40 : wallR(90) - 40, 70 + i * 28, { dir: fromL ? 1 : -1 }));
      }
    } else if (w.kind === 'helis') {
      n = (w.n || 1) + (isDense() ? 1 : 0);
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('heli', laneX(i, n), -28 - i * 24));
      }
    } else if (w.kind === 'snipers') {
      n = (w.n || 2) + (isDense() ? 1 : 0);
      for (i = 0; i < n; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const yy = 40 + i * 22;
        spawnEnemy(makeEnemy('sniper', VW * 0.5 + side * (roadHalf(yy) + 8), yy, { side: side }));
      }
    } else if (w.kind === 'mix1') {
      spawnEnemy(makeEnemy('car', 240, 78));
      spawnEnemy(makeEnemy('grunt', 150, -8));
      spawnEnemy(makeEnemy('grunt', 330, -8));
      spawnEnemy(makeEnemy('runner', 240, -36));
      spawnEnemy(makeEnemy('jeep', wallL(110) + 36, 118, { dir: 1 }));
    } else if (w.kind === 'mix2') {
      spawnEnemy(makeEnemy('car', 168, 70));
      spawnEnemy(makeEnemy('car', 312, 88));
      spawnEnemy(makeEnemy('sniper', wallL(50) - 6, 50, { side: -1 }));
      spawnEnemy(makeEnemy('heli', 300, -18));
      spawnEnemy(makeEnemy('runner', 200, -18));
      spawnEnemy(makeEnemy('runner', 280, -28));
    } else if (w.kind === 'mix3') {
      spawnEnemy(makeEnemy('car', 140, 58));
      spawnEnemy(makeEnemy('car', 240, 86));
      spawnEnemy(makeEnemy('car', 340, 58));
      spawnEnemy(makeEnemy('tank', wallL(120) + 38, 126, { dir: 1 }));
      spawnEnemy(makeEnemy('heli', 200, 16));
      spawnEnemy(makeEnemy('dropper', 300, -16));
      spawnEnemy(makeEnemy('sniper', wallR(44) + 6, 44, { side: 1 }));
    } else if (w.kind === 'boss') {
      activateBoss();
    }
  }

  function coverAt(x, y, skip) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isCover(e.kind) || e === skip) continue;
      if (Math.abs(x - e.x) < e.w * 0.52 && Math.abs(y - e.y) < e.h * 0.55) return e;
    }
    return null;
  }

  function behindCover(p) {
    if (!p) return null;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isCover(e.kind)) continue;
      if (p.y > e.y + 4 && p.y < e.y + e.h * 0.5 + 46 && Math.abs(p.x - e.x) < e.w * 0.62 + 14) {
        return e;
      }
    }
    return null;
  }

  function resolveCarPush(p) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isCover(e.kind)) continue;
      const hx = e.w * 0.5 + p.r - 2;
      const hy = e.h * 0.5 + p.r - 2;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      if (Math.abs(dx) < hx && Math.abs(dy) < hy) {
        const oxp = hx - Math.abs(dx);
        const oyp = hy - Math.abs(dy);
        if (oxp < oyp) p.x = e.x + (dx < 0 ? -hx : hx);
        else p.y = e.y + (dy < 0 ? -hy : hy);
      }
    }
  }

  function countPShots() {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === 'p') n += 1;
    }
    return n;
  }

  function spawnShot(s) {
    G.shots.push(s);
    capArr(G.shots, 96);
  }

  function enemyShoot(e, dx, dy, spd, kind) {
    const len = hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    spawnShot({
      x: e.x + nx * ((e.r || 12) + 4),
      y: e.y + ny * ((e.r || 12) + 4),
      vx: nx * spd,
      vy: ny * spd,
      r: kind === 'heavy' ? 4.6 : 3.2,
      from: 'e',
      kind: kind || 'pellet',
      owner: e
    });
  }

  function tryShoot() {
    if (G.fireCd > 0 || G.deadT > 0) return;
    if (countPShots() >= MAX_PSHOT) return;
    const p = G.player;
    let vx = 0;
    let vy = -SHOT_SPD;
    if (G.lock) {
      const dx = G.lock.x - p.x;
      vx = clamp(dx * 1.8, -120, 120);
    }
    spawnShot({
      x: p.x,
      y: p.y - 22,
      vx: vx,
      vy: vy,
      r: 3.2,
      from: 'p',
      kind: 'mg',
      dmg: 1
    });
    G.fireCd = fireRate();
    G.muzzle = 0.05;
    audio.shot();
    emit(3, {
      x: p.x, y: p.y - 24, j: 3,
      vx0: -20, vx1: 20, vy0: -90, vy1: -40,
      life: 0.12, r0: 1, r1: 2.2, rgb: GOLD, g: 40
    });
  }

  function tryNade() {
    nadeQueued = false;
    if (G.nadeCd > 0 || G.deadT > 0) return;
    const p = G.player;
    if (G.lock && G.rockets > 0) {
      if (playing()) G.rockets -= 1;
      G.nadeCd = NADE_CD;
      G.nadeshots.push({
        x: p.x,
        y: p.y - 18,
        vx: (G.lock.x - p.x) * 1.4,
        vy: -520,
        z: 10,
        vz: 40,
        from: 'p',
        kind: 'rocket',
        r: 58,
        dmg: 5,
        home: 280,
        life: 1.05,
        t: 0,
        target: G.lock
      });
      capArr(G.nadeshots, 6);
      audio.rocket();
      syncHud();
      return;
    }
    if (G.nades <= 0) {
      G.nadeCd = 0.55;
      if (playing()) toast(G.rockets <= 0 ? '没雷了' : '先锁定甲车', true, false);
      return;
    }
    if (playing()) G.nades -= 1;
    G.nadeCd = NADE_CD;
    G.nadeshots.push({
      x: p.x,
      y: p.y - 10,
      vx: 0,
      vy: -340,
      z: 22,
      vz: 240,
      from: 'p',
      kind: 'nade',
      r: 54,
      dmg: 4,
      home: 0,
      life: 0.92,
      t: 0
    });
    capArr(G.nadeshots, 6);
    audio.nade();
    syncHud();
  }

  function findLock() {
    const p = G.player;
    if (!p) return null;
    let best = null;
    let bestD = 1e9;
    function consider(e, armor) {
      if (!e || (e.alive === false)) return;
      if (e.dead) return;
      if (e.y >= p.y - 8) return;
      const dx = Math.abs(e.x - p.x);
      const dy = p.y - e.y;
      if (dx > 96 + dy * 0.12) return;
      const d = dy + dx * 0.55;
      if (d < bestD) {
        bestD = d;
        best = e;
        e._lockArmor = armor;
      }
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (isArmor(e.kind)) consider(e, true);
    }
    if (G.boss && G.boss.active && !G.boss.dead) consider(G.boss, true);
    return best;
  }

  function spawnPickup(kind, x, y) {
    G.pickups.push({
      kind: kind,
      x: x,
      y: y,
      vy: 36,
      t: 0,
      alive: true,
      r: 10
    });
    capArr(G.pickups, 12);
  }

  function killEnemy(e, byNade) {
    if (!e.alive) return;
    e.alive = false;
    e.flash = 0;
    const pts = Math.round((e.score || 80) * G.mult);
    addScore(pts);
    floatText(e.x, e.y - 8, String(pts), byNade ? GOLD : WHT, !!byNade);
    boomAt(e.x, e.y, isArmor(e.kind) || e.kind === 'car' ? 1.35 : 0.7, isArmor(e.kind) ? HOT : GOLD);
    audio.boom();
    hitStop(isArmor(e.kind) ? 0.056 : 0.038);
    if (e.kind === 'dropper' && playing()) {
      spawnPickup(Math.random() < 0.55 ? 'crate' : 'rocket', e.x, e.y);
    }
    if (e.kind === 'car' && playing() && Math.random() < 0.28) {
      spawnPickup('crate', e.x, e.y);
    }
  }

  function hurtEnemy(e, dmg, byNade) {
    if (!e || !e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    bumpCombo();
    audio.hit(G.combo);
    hitStop(0.034 + Math.min(0.022, dmg * 0.008));
    kick(1.6 + dmg * 0.5, 'hit');
    emit(5, {
      x: e.x, y: e.y, j: 6,
      vx0: -90, vx1: 90, vy0: -120, vy1: 20,
      life: 0.18, r0: 1, r1: 2.4, rgb: GOLD, g: 80
    });
    if (e.hp <= 0) killEnemy(e, byNade);
  }

  function explodeNade(n) {
    n.life = 0;
    boomAt(n.x, n.y, n.kind === 'rocket' ? 1.6 : 1.15, n.kind === 'rocket' ? CYN : GOLD);
    audio.boom();
    hitStop(0.05);
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (hypot(e.x - n.x, e.y - n.y) < n.r + e.r) {
        hurtEnemy(e, n.dmg + (isArmor(e.kind) && n.kind === 'rocket' ? 2 : 0), true);
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      if (hypot(G.boss.x - n.x, G.boss.y - n.y) < n.r + G.boss.r) {
        hurtBoss(n.dmg + (n.kind === 'rocket' ? 3 : 1));
      }
    }
  }

  function activateBoss() {
    if (!G.boss || G.boss.active) return;
    G.boss.active = true;
    G.boss.enter = 0;
    G.boss.y = -30;
    G.boss.x = VW * 0.5;
    audio.boss();
    toast(G.boss.name, false, true);
    kick(4.2, 'thump');
    syncHud();
  }

  function hurtBoss(dmg) {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    b.hp -= dmg;
    b.flash = 0.1;
    bumpCombo();
    audio.hit(G.combo);
    hitStop(0.048);
    kick(2.4, 'hit');
    emit(8, {
      x: b.x, y: b.y, j: 10,
      vx0: -140, vx1: 140, vy0: -160, vy1: 40,
      life: 0.22, r0: 1.4, r1: 3.2, rgb: MAG, g: 90
    });
    syncHud();
    if (b.hp <= 0) killBoss();
  }

  function killBoss() {
    const b = G.boss;
    b.dead = true;
    b.active = true;
    b.alive = false;
    boomAt(b.x, b.y, 2.4, GOLD);
    audio.boom();
    hitStop(0.08);
    kick(7, 'boom');
    const pts = Math.round(SCORE.boss * G.mult);
    addScore(pts);
    floatText(b.x, b.y - 20, String(pts), GOLD, true);
    toast(b.name + ' 击破', false, true);
    G.winT = 1.6;
    screenFlash(GOLD, 0.55);
    if (stageEl) {
      stageEl.classList.add('win-flash');
      setTimeout(function () {
        if (stageEl) stageEl.classList.remove('win-flash');
      }, 700);
    }
  }

  function clearEnemyShots() {
    G.shots = G.shots.filter(function (s) { return s.from === 'p'; });
  }

  function die(why) {
    if (G.deadT > 0 || G.invuln > 0 || G.mode === 'title') return;
    G.why = why || '倒在街上了';
    G.deadT = DIE_T;
    G.lives -= 1;
    const p = G.player;
    if (p) boomAt(p.x, p.y, 1.8, MAG);
    audio.death();
    kick(8, 'die');
    screenFlash(MAG, 0.5);
    clearEnemyShots();
    syncPips();
    syncHud();
  }

  function respawn() {
    G.player = makePlayer();
    G.deadT = 0;
    G.invuln = INVULN;
    G.crouch = false;
    clearEnemyShots();
  }

  function loseGame() {
    G.mode = 'lose';
    const why = G.why || '倒在街上了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 最高连击 ' + G.maxCombo + ' · R 重开');
    audio.lose();
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    const bonus = isDense() ? 10000 : 8000;
    addScore(bonus);
    const msg = isDense() ? '城核通关' : '使馆捣毁了';
    toast(msg, false, true);
    showOverlay('win', msg, '分数 ' + G.score + ' · 最高连击 ' + G.maxCombo + ' · 通关奖励 ' + bonus);
    audio.win();
    kick(5, 'win-flash');
    syncHud();
  }

  function nextStage() {
    const bonus = Math.round(SCORE.stage * G.stage * G.mult);
    addScore(bonus);
    if (G.stage >= 3) {
      winGame();
      return;
    }
    audio.stage();
    toast((STAGES[G.stage] || STAGES[0]).name, false, true);
    loadStage(G.stage + 1, false);
    syncHud();
  }

  function takePickup(pk) {
    if (!pk.alive) return;
    pk.alive = false;
    if (pk.kind === 'crate') {
      G.nades = Math.min(NADE_MAX, G.nades + 2);
      toast('补雷 +2', false, true);
      floatText(pk.x, pk.y - 10, '+雷', GOLD, true);
    } else {
      G.rockets = Math.min(ROCK_MAX, G.rockets + 1);
      toast('火炮 +1', false, true);
      floatText(pk.x, pk.y - 10, '+炮', CYN, true);
    }
    addScore(Math.round(scoreOf(pk.kind) * G.mult));
    bumpCombo();
    audio.pickup();
    kick(2.2, 'pickup');
    screenFlash(GOLD, 0.28);
    syncHud();
  }

  function updateDemo(dt) {
    if (G.mode !== 'title') return;
    const t = G.t;
    demo.d = Math.sin(t * 0.7) > 0.72;
    demo.u = !demo.d;
    demo.fire = true;
    demo.l = Math.sin(t * 1.4) > 0.25;
    demo.r = Math.sin(t * 1.4) < -0.25;
    demo.nade = (t % 2.6) < 0.12;
    if (demo.nade) nadeQueued = true;
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (!p) return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0 && playing()) loseGame();
        else respawn();
      }
      return;
    }
    if (G.mode !== 'play' && G.mode !== 'title') return;
    const wasCrouch = G.crouch;
    G.crouch = inD() && !inU();
    if (G.crouch && !wasCrouch) audio.duck();
    p.r = G.crouch ? 8.5 : HIT_R;
    const spd = (G.crouch ? 0.62 : 1) * STRAFE * (isDense() ? 1.08 : 1);
    let ax = 0;
    let ay = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (inU()) ay -= 1;
    if (inD() && !G.crouch) ay += 1;
    if (pointer.down && playing()) {
      ax += clamp((pointer.x - p.x) / 40, -1, 1);
      ay += clamp((pointer.y - p.y) / 50, -1, 1);
    }
    const len = hypot(ax, ay);
    if (len > 1) {
      ax /= len;
      ay /= len;
    }
    p.vx = lerp(p.vx, ax * spd, 0.28);
    p.vy = lerp(p.vy, ay * spd * 0.55, 0.22);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const pad = 14;
    p.x = clamp(p.x, wallL(p.y) + pad, wallR(p.y) - pad);
    p.y = clamp(p.y, Y_FAR, Y_NEAR);
    resolveCarPush(p);
    p.run += hypot(p.vx, p.vy) * dt * 0.045;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.nadeCd > 0) G.nadeCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (fireHeld()) tryShoot();
    if (nadeHeld()) tryNade();
  }

  function updateWaves(dt) {
    if (G.mode === 'title') return;
    if (!playing()) return;
    if (G.boss && G.boss.active) return;
    if (G.winT > 0) return;
    G.stageT += dt;
    const spec = STAGES[G.stage - 1];
    if (!spec) return;
    while (G.waveI < spec.waves.length) {
      const w = spec.waves[G.waveI];
      if (G.stageT < w.t) break;
      spawnWave(w);
      G.waveI += 1;
    }
  }

  function updateEnemies(dt) {
    const p = G.player;
    const mul = spdMul();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      e.y += (e.vy + scrollSpd() * (e.kind === 'heli' ? 0.35 : 0.55)) * dt * (e.kind === 'sniper' ? 0.45 : 1);
      if (e.kind === 'jeep' || e.kind === 'tank') {
        e.x += e.vx * dt * mul;
        if (e.x < wallL(e.y) + 24 || e.x > wallR(e.y) - 24) e.vx *= -1;
      }
      if (e.kind === 'heli') {
        e.x += Math.sin(e.t * 2.4 + i) * 70 * dt;
      }
      if (e.kind === 'sniper') {
        const edge = e.side < 0 ? wallL(e.y) - 4 : wallR(e.y) + 4;
        e.x = lerp(e.x, edge, 0.08);
      }
      if (e.kind === 'grunt' || e.kind === 'dropper') {
        if (p) e.x += clamp(p.x - e.x, -40, 40) * dt * 0.45;
      }
      if (e.kind === 'runner' && p) {
        e.x += clamp(p.x - e.x, -90, 90) * dt * 1.1;
      }
      e.x = clamp(e.x, 18, VW - 18);
      if (e.y > VH + 40) {
        e.alive = false;
        continue;
      }
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0 && (playing() || G.mode === 'title')) {
        const cd = (e.kind === 'sniper' ? 1.35 : e.kind === 'tank' ? 0.95 : e.kind === 'jeep' ? 0.82 : e.kind === 'heli' ? 0.9 : 1.15) * eFireMul();
        e.fire = cd * rand(0.72, 1.15);
        if (e.kind === 'car') continue;
        let dx = 0;
        let dy = 1;
        if (p) {
          dx = p.x - e.x;
          dy = p.y - e.y;
        }
        const spd = e.kind === 'sniper' ? 280 : e.kind === 'tank' ? 240 : e.kind === 'heli' ? 260 : 210;
        const heavy = e.kind === 'sniper' || e.kind === 'tank' || e.kind === 'heli';
        if (e.kind === 'tank') {
          enemyShoot(e, -0.4, 1, spd, 'pellet');
          enemyShoot(e, 0, 1, spd, heavy ? 'heavy' : 'pellet');
          enemyShoot(e, 0.4, 1, spd, 'pellet');
        } else {
          enemyShoot(e, dx, dy, spd, heavy ? 'heavy' : 'pellet');
        }
      }
      if (playing() && p && G.deadT <= 0 && G.invuln <= 0 && isCrash(e.kind)) {
        const rr = (G.crouch ? p.r * 0.85 : p.r) + e.r - 2;
        if (hypot(p.x - e.x, p.y - e.y) < rr) {
          die(isArmor(e.kind) ? '撞上了' : (e.kind === 'runner' ? '被冲了' : '撞上了'));
        }
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    b.t += dt;
    if (b.flash > 0) b.flash -= dt;
    if (b.enter < 1) {
      b.enter = Math.min(1, b.enter + dt * 0.7);
      b.y = lerp(-20, 132, b.enter);
      return;
    }
    const p = G.player;
    const low = b.hp < b.max * 0.38;
    if (b.kind === 'night') {
      b.x += b.vx * dt;
      if (b.x < 110 || b.x > VW - 110) b.vx *= -1;
    } else if (b.kind === 'tower') {
      b.y = 118 + Math.sin(b.t * 1.4) * 16;
      if (p) b.x = lerp(b.x, p.x, 0.04);
      b.x = clamp(b.x, 90, VW - 90);
    } else {
      b.x = VW * 0.5 + Math.sin(b.t * 0.9) * 120;
      b.y = 124 + Math.cos(b.t * 0.7) * 18;
    }
    b.fire -= dt;
    if (b.fire <= 0 && p && G.deadT <= 0 && playing()) {
      b.fire = (low ? 0.38 : 0.62) * eFireMul();
      if (b.kind === 'night') {
        enemyShoot(b, -0.5, 1, 240, 'pellet');
        enemyShoot(b, 0, 1, 260, 'heavy');
        enemyShoot(b, 0.5, 1, 240, 'pellet');
        if (low && p) enemyShoot(b, p.x - b.x, p.y - b.y, 300, 'heavy');
      } else if (b.kind === 'tower') {
        if (p) enemyShoot(b, p.x - b.x, p.y - b.y, 320, 'heavy');
        if (low) {
          enemyShoot(b, -0.7, 1, 250, 'pellet');
          enemyShoot(b, 0.7, 1, 250, 'pellet');
        }
      } else {
        for (let k = -3; k <= 3; k++) {
          enemyShoot(b, k * 0.32, 1, 230, k === 0 ? 'heavy' : 'pellet');
        }
        if (low && Math.random() < 0.45) {
          spawnEnemy(makeEnemy('jeep', b.x, b.y + 30, { dir: Math.random() < 0.5 ? 1 : -1 }));
        }
      }
    }
    if (playing() && p && G.deadT <= 0 && G.invuln <= 0) {
      if (hypot(p.x - b.x, p.y - b.y) < p.r + b.r - 2) die('撞上了');
    }
  }

  function shotHitsCover(s) {
    if (s.from !== 'e') return false;
    const p = G.player;
    const cov = p ? behindCover(p) : null;
    if (!cov) return false;
    if (s.y < cov.y - cov.h * 0.6) return false;
    if (Math.abs(s.x - cov.x) < cov.w * 0.55 && s.y < p.y && s.y > cov.y - 8) {
      if (G.crouch || Math.abs(p.x - cov.x) < cov.w * 0.5) return cov;
    }
    return false;
  }

  function updateShots(dt) {
    const p = G.player;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < -20 || s.x > VW + 20 || s.y < -30 || s.y > VH + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'e') {
        const cov = shotHitsCover(s);
        if (cov) {
          cov.flash = 0.05;
          emit(3, {
            x: s.x, y: s.y, j: 4,
            vx0: -40, vx1: 40, vy0: -50, vy1: 10,
            life: 0.12, r0: 1, r1: 2, rgb: STL, g: 60
          });
          G.shots.splice(i, 1);
          continue;
        }
        if (playing() && p && G.deadT <= 0 && G.invuln <= 0) {
          const pr = G.crouch ? p.r * 0.78 : p.r;
          if (hypot(s.x - p.x, s.y - p.y) < pr + s.r) {
            G.shots.splice(i, 1);
            die('中弹了');
            continue;
          }
        }
      } else {
        let hit = false;
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive) continue;
          if (isCover(e.kind)) continue;
          const rr = e.r + s.r;
          if (hypot(s.x - e.x, s.y - e.y) < rr) {
            hurtEnemy(e, s.dmg || 1, false);
            G.shots.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
        if (G.boss && G.boss.active && !G.boss.dead) {
          if (hypot(s.x - G.boss.x, s.y - G.boss.y) < G.boss.r + s.r) {
            hurtBoss(s.dmg || 1);
            G.shots.splice(i, 1);
          }
        }
      }
    }
  }

  function updateNades(dt) {
    for (let i = G.nadeshots.length - 1; i >= 0; i--) {
      const n = G.nadeshots[i];
      n.t += dt;
      n.life -= dt;
      if (n.kind === 'rocket' && n.home && n.target && (n.target.alive || (n.target === G.boss && G.boss && !G.boss.dead))) {
        const tx = n.target.x - n.x;
        const ty = n.target.y - n.y;
        const len = hypot(tx, ty) || 1;
        n.vx = lerp(n.vx, (tx / len) * 560, 0.14);
        n.vy = lerp(n.vy, (ty / len) * 560, 0.14);
      }
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.kind === 'nade') {
        n.z += n.vz * dt;
        n.vz -= 620 * dt;
      }
      let bang = n.life <= 0 || n.z < 0 || n.y < 20;
      if (!bang) {
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive) continue;
          if (n.kind === 'nade' && n.z > 14 && isCover(e.kind)) continue;
          if (hypot(n.x - e.x, n.y - e.y) < e.r + 10 && (n.kind === 'rocket' || n.z < 12)) {
            bang = true;
            break;
          }
        }
        if (!bang && G.boss && G.boss.active && !G.boss.dead) {
          if (hypot(n.x - G.boss.x, n.y - G.boss.y) < G.boss.r + 12 && (n.kind === 'rocket' || n.z < 14)) bang = true;
        }
      }
      if (bang) {
        explodeNade(n);
        G.nadeshots.splice(i, 1);
      }
    }
  }

  function updatePickups(dt) {
    const p = G.player;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const pk = G.pickups[i];
      if (!pk.alive) {
        G.pickups.splice(i, 1);
        continue;
      }
      pk.t += dt;
      pk.y += (pk.vy + scrollSpd() * 0.4) * dt;
      if (p && playing() && G.deadT <= 0) {
        const pull = hypot(p.x - pk.x, p.y - pk.y);
        if (pull < 90) {
          pk.x += (p.x - pk.x) * dt * 4.5;
          pk.y += (p.y - pk.y) * dt * 4.5;
        }
        if (pull < p.r + pk.r + 6) takePickup(pk);
      }
      if (pk.y > VH + 20) G.pickups.splice(i, 1);
    }
  }

  function updateFx(dt) {
    G.scroll += scrollSpd() * dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 4.2;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 3.4;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y += (12 + e.z * 28) * dt;
      if (e.y > VH) {
        e.y = -4;
        e.x = Math.random() * VW;
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      if (G.stop > 0) return;
      G.stop = 0;
    }
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 0.18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    updateDemo(dt);
    updatePlayer(dt);
    const prevLock = G.lock;
    G.lock = (G.deadT <= 0 && G.player) ? findLock() : null;
    if (G.lock && G.lock !== prevLock && G.rockets > 0 && playing()) {
      G.lockBeep = 0.12;
      audio.lock();
      syncHud();
    }
    if (G.lockBeep > 0) G.lockBeep -= dt;
    updateWaves(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateShots(dt);
    updateNades(dt);
    updatePickups(dt);
    updateFx(dt);
    if (G.winT > 0 && playing()) {
      G.winT -= dt;
      if (G.winT <= 0) nextStage();
    }
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    const th = themeOf();
    if (th === 'tower') {
      g.addColorStop(0, '#140818');
      g.addColorStop(0.45, '#2a1020');
      g.addColorStop(1, '#3a1810');
    } else if (th === 'embassy') {
      g.addColorStop(0, '#1a0c10');
      g.addColorStop(0.5, '#2c140c');
      g.addColorStop(1, '#4a2210');
    } else {
      g.addColorStop(0, '#12060c');
      g.addColorStop(0.42, '#2a100c');
      g.addColorStop(1, '#4a1c10');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.fillStyle = rgba(HOT, 0.12);
    ctx.beginPath();
    ctx.ellipse(sx(VW * 0.5), sy(VP_Y + 8), 90 * scale, 18 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawCity() {
    const th = themeOf();
    const cx = VW * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx(cx - 18), sy(VP_Y));
    ctx.lineTo(sx(cx + 18), sy(VP_Y));
    ctx.lineTo(sx(wallR(VH) + 8), sy(VH));
    ctx.lineTo(sx(wallL(VH) - 8), sy(VH));
    ctx.closePath();
    const road = ctx.createLinearGradient(sx(0), sy(VP_Y), sx(0), sy(VH));
    road.addColorStop(0, '#2a1814');
    road.addColorStop(0.5, '#241410');
    road.addColorStop(1, '#1c0e0a');
    ctx.fillStyle = road;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgba(GOLD, 0.18);
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.setLineDash([10 * scale, 16 * scale]);
    ctx.lineDashOffset = -G.scroll * scale * 0.45;
    ctx.beginPath();
    ctx.moveTo(sx(cx), sy(VP_Y + 8));
    ctx.lineTo(sx(cx), sy(VH));
    ctx.stroke();
    ctx.setLineDash([]);
    if (th === 'night') {
      ctx.fillStyle = rgba(MAG, 0.05);
      ctx.fillRect(sx(0), sy(VH * 0.55), VW * scale, VH * 0.45 * scale);
    }
    ctx.restore();

    function drawSide(side) {
      for (let k = 0; k < 9; k++) {
        const gy = ((k * 92 + G.scroll * 0.55) % (VH + 80)) - 40;
        const hgt = 70 + hash2(k * 17 + (th === 'tower' ? 3 : 1)) * (th === 'tower' ? 110 : 64);
        const s = depthScale(gy);
        const edge = side < 0 ? wallL(gy) : wallR(gy);
        const w = (38 + hash2(k * 9) * 28) * s;
        const x = side < 0 ? edge - w - 2 : edge + 2;
        const col = 28 + (hash2(k * 13) * 18) | 0;
        ctx.fillStyle = 'rgb(' + (col + 8) + ',' + (col - 6) + ',' + (col - 10) + ')';
        ctx.fillRect(sx(x), sy(gy - hgt * 0.35), w * scale, hgt * s * scale);
        const rows = 3 + (hash2(k * 5) * 4) | 0;
        const cols = 2 + (hash2(k * 7) * 2) | 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const lit = hash2(k * 31 + r * 11 + c + ((G.scroll * 0.01) | 0)) > 0.42;
            const wx = x + 5 + c * (w / (cols + 0.4));
            const wy = gy - hgt * 0.28 + r * 12 * s;
            ctx.fillStyle = lit
              ? (hash2(k + r + c) > 0.7 ? rgba(MAG, 0.7) : (hash2(k * 3 + c) > 0.55 ? rgba(CYN, 0.55) : rgba(GOLD, 0.45)))
              : rgba(DEEP, 0.55);
            ctx.fillRect(sx(wx), sy(wy), 5 * s * scale, 6 * s * scale);
          }
        }
        if (th === 'night' && hash2(k * 21) > 0.55) {
          ctx.fillStyle = hash2(k) > 0.5 ? rgba(MAG, 0.55) : rgba(CYN, 0.5);
          ctx.fillRect(sx(x + 4), sy(gy - hgt * 0.32 - 6 * s), (w - 8) * scale, 4 * s * scale);
        }
        if (th === 'embassy' && k % 3 === 0) {
          ctx.fillStyle = rgba(HOT, 0.55);
          ctx.fillRect(sx(edge + side * 8), sy(gy - 28), 3 * scale, 28 * scale);
          ctx.fillStyle = rgba(GOLD, 0.7);
          ctx.beginPath();
          ctx.moveTo(sx(edge + side * 10), sy(gy - 28));
          ctx.lineTo(sx(edge + side * 22), sy(gy - 22));
          ctx.lineTo(sx(edge + side * 10), sy(gy - 16));
          ctx.fill();
        }
      }
    }
    drawSide(-1);
    drawSide(1);

    ctx.strokeStyle = rgba(HOT, 0.22);
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    ctx.beginPath();
    ctx.moveTo(sx(cx - 18), sy(VP_Y));
    ctx.lineTo(sx(wallL(VH)), sy(VH));
    ctx.moveTo(sx(cx + 18), sy(VP_Y));
    ctx.lineTo(sx(wallR(VH)), sy(VH));
    ctx.stroke();
    ctx.restore();
  }

  function drawEmbers() {
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      const s = depthScale(e.y) * e.s;
      ctx.fillStyle = e.neon ? rgba(Math.random() > 0.5 || REDUCE ? MAG : CYN, e.a) : rgba(HOT2, e.a * 0.7);
      ctx.fillRect(sx(e.x), sy(e.y), s * scale, s * scale);
    }
  }

  function drawSoldier(p, opt) {
    const s = depthScale(p.y);
    const blink = opt && opt.blink && ((G.t * 18) | 0) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.38;
    const crouch = !!G.crouch;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(sx(p.x), sy(p.y + 10 * s), 11 * s * scale, 4 * s * scale, 0, 0, TAU);
    ctx.fill();
    const run = Math.sin(p.run * 9) * (crouch ? 2 : 5) * s;
    ctx.strokeStyle = '#201810';
    ctx.lineWidth = Math.max(1.6, 3.2 * s * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(p.x - 4 * s), sy(p.y + (crouch ? 2 : 6) * s));
    ctx.lineTo(sx(p.x - 6 * s - run), sy(p.y + 14 * s));
    ctx.moveTo(sx(p.x + 4 * s), sy(p.y + (crouch ? 2 : 6) * s));
    ctx.lineTo(sx(p.x + 6 * s + run), sy(p.y + 14 * s));
    ctx.stroke();
    const tw = 16 * s;
    const th = (crouch ? 12 : 16) * s;
    ctx.fillStyle = rgba(HOT, 1);
    roundRect(sx(p.x - tw * 0.5), sy(p.y - th * 0.7), tw * scale, th * scale, 4 * s * scale);
    ctx.fill();
    ctx.fillStyle = rgba(KHAKI, 0.9);
    ctx.fillRect(sx(p.x - 7 * s), sy(p.y - th * 0.15), 14 * s * scale, 5 * s * scale);
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y - th * 0.85), 5.2 * s * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(IRON, 1);
    ctx.fillRect(sx(p.x - 5.2 * s), sy(p.y - th * 1.05), 10.4 * s * scale, 3 * s * scale);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.fillRect(sx(p.x - 1.1 * s), sy(p.y - th * 1.35), 2.2 * s * scale, 12 * s * scale);
    if (opt && opt.muzzle) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y - th * 1.42), 5 * s * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y - th * 1.5), 8 * s * scale, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawEnemy(e) {
    if (!e.alive) return;
    const s = depthScale(e.y);
    const flash = e.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(sx(e.x), sy(e.y + 8 * s), (e.kind === 'car' ? 16 : 9) * s * scale, 3.2 * s * scale, 0, 0, TAU);
    ctx.fill();
    if (e.kind === 'car') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(CONC, 1);
      roundRect(sx(e.x - e.w * 0.5 * s), sy(e.y - e.h * 0.5 * s), e.w * s * scale, e.h * s * scale, 3 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(ASH, 1);
      ctx.fillRect(sx(e.x - 14 * s), sy(e.y - 8 * s), 28 * s * scale, 6 * s * scale);
      ctx.fillStyle = rgba(CYN, 0.35);
      ctx.fillRect(sx(e.x - 10 * s), sy(e.y - 6 * s), 8 * s * scale, 3 * s * scale);
      ctx.fillRect(sx(e.x + 2 * s), sy(e.y - 6 * s), 8 * s * scale, 3 * s * scale);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(sx(e.x - 16 * s), sy(e.y + 4 * s), 5 * s * scale, 2 * s * scale);
      ctx.fillRect(sx(e.x + 11 * s), sy(e.y + 4 * s), 5 * s * scale, 2 * s * scale);
      return;
    }
    if (e.kind === 'jeep' || e.kind === 'tank') {
      const col = e.kind === 'tank' ? STL : IRON;
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(col, 1);
      roundRect(sx(e.x - e.w * 0.5 * s), sy(e.y - e.h * 0.5 * s), e.w * s * scale, e.h * s * scale, 3 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(sx(e.x - 6 * s), sy(e.y - e.h * 0.55 * s - 8 * s), 12 * s * scale, 10 * s * scale);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(sx(e.x - 1 * s), sy(e.y - e.h * 0.9 * s - 10 * s), 2 * s * scale, 12 * s * scale);
      return;
    }
    if (e.kind === 'heli') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(STL, 1);
      ctx.beginPath();
      ctx.ellipse(sx(e.x), sy(e.y), 14 * s * scale, 6 * s * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = Math.max(1, 1.4 * scale);
      ctx.beginPath();
      ctx.ellipse(sx(e.x), sy(e.y - 4 * s), 16 * s * scale, 3 * s * scale, G.t * 18, 0, TAU);
      ctx.stroke();
      return;
    }
    if (e.kind === 'sniper') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(ASH, 1);
      ctx.fillRect(sx(e.x - 7 * s), sy(e.y - 8 * s), 14 * s * scale, 12 * s * scale);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(sx(e.x - 3 * s), sy(e.y - 4 * s), 6 * s * scale, 3 * s * scale);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y - 10 * s), 3.2 * s * scale, 0, TAU);
      ctx.fill();
      return;
    }
    const body = e.kind === 'dropper' ? GOLD : (e.kind === 'runner' ? MAG : MUD);
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(body, 1);
    ctx.beginPath();
    ctx.arc(sx(e.x), sy(e.y - 8 * s), 5.5 * s * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(e.kind === 'dropper' ? KHAKI : HOT, 1);
    roundRect(sx(e.x - 6 * s), sy(e.y - 4 * s), 12 * s * scale, 12 * s * scale, 2 * scale);
    ctx.fill();
    if (e.kind === 'dropper') {
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(sx(e.x - 3 * s), sy(e.y + 1 * s), 6 * s * scale, 4 * s * scale);
    }
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const s = depthScale(b.y);
    const flash = b.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx(b.x), sy(b.y + 14 * s), 22 * s * scale, 5 * s * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = flash ? rgba(WHT, 0.92) : rgba(IRON, 1);
    const w = (b.kind === 'embassy' ? 88 : 64) * s;
    const h = (b.kind === 'embassy' ? 36 : 28) * s;
    roundRect(sx(b.x - w * 0.5), sy(b.y - h * 0.5), w * scale, h * scale, 5 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(sx(b.x - w * 0.18), sy(b.y - h * 0.7), w * 0.36 * scale, h * 0.4 * scale);
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.beginPath();
    ctx.arc(sx(b.x), sy(b.y - h * 0.15), 5 * s * scale, 0, TAU);
    ctx.fill();
    if (b.kind === 'embassy') {
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(sx(b.x - w * 0.46), sy(b.y - h * 0.2), 8 * scale, h * 0.5 * scale);
      ctx.fillRect(sx(b.x + w * 0.36), sy(b.y - h * 0.2), 8 * scale, h * 0.5 * scale);
    }
    const v = clamp(b.hp / b.max, 0, 1);
    ctx.fillStyle = rgba(DEEP, 0.7);
    ctx.fillRect(sx(b.x - 28), sy(b.y - h * 0.5 - 10), 56 * scale, 4 * scale);
    ctx.fillStyle = rgba(v < 0.32 ? MAG : GOLD, 0.95);
    ctx.fillRect(sx(b.x - 28), sy(b.y - h * 0.5 - 10), 56 * v * scale, 4 * scale);
  }

  function drawShot(s) {
    if (s.from === 'p') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(sx(s.x - 1), sy(s.y), 2 * scale, 8 * scale);
    } else {
      ctx.fillStyle = s.kind === 'heavy' ? rgba(MAG, 0.95) : rgba(HOT2, 0.9);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawNades() {
    for (let i = 0; i < G.nadeshots.length; i++) {
      const n = G.nadeshots[i];
      const z = n.kind === 'nade' ? Math.max(0, n.z) : 8;
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(sx(n.x), sy(n.y + 6), 6 * scale, 2.4 * scale, 0, 0, TAU);
      ctx.fill();
      if (n.kind === 'rocket') {
        ctx.fillStyle = rgba(CYN, 0.95);
        ctx.save();
        ctx.translate(sx(n.x), sy(n.y - z * 0.35));
        ctx.rotate(Math.atan2(n.vy, n.vx) + Math.PI / 2);
        ctx.fillRect(-2.2 * scale, -8 * scale, 4.4 * scale, 14 * scale);
        ctx.fillStyle = rgba(HOT, 0.9);
        ctx.beginPath();
        ctx.moveTo(0, 8 * scale);
        ctx.lineTo(-3 * scale, 14 * scale);
        ctx.lineTo(3 * scale, 14 * scale);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.arc(sx(n.x), sy(n.y - z * 0.55), 4.2 * scale, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(HOT, 0.8);
        ctx.lineWidth = Math.max(1, 1.4 * scale);
        ctx.beginPath();
        ctx.arc(sx(n.x), sy(n.y - z * 0.55), 6.5 * scale, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawPickups() {
    for (let i = 0; i < G.pickups.length; i++) {
      const pk = G.pickups[i];
      if (!pk.alive) continue;
      const bob = Math.sin(pk.t * 6) * 3;
      ctx.fillStyle = pk.kind === 'rocket' ? rgba(CYN, 0.95) : rgba(GOLD, 0.95);
      roundRect(sx(pk.x - 8), sy(pk.y - 8 + bob), 16 * scale, 16 * scale, 3 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.font = '700 ' + Math.round(10 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pk.kind === 'rocket' ? '炮' : '雷', sx(pk.x), sy(pk.y + bob));
    }
  }

  function drawLock() {
    const e = G.lock;
    if (!e) return;
    const s = depthScale(e.y);
    const pulse = 0.65 + Math.sin(G.t * 14) * 0.35;
    ctx.strokeStyle = rgba(MAG, 0.45 + pulse * 0.5);
    ctx.lineWidth = Math.max(1.4, 2 * scale);
    const r = (e.r + 10) * s * scale;
    ctx.beginPath();
    ctx.arc(sx(e.x), sy(e.y), r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.beginPath();
    ctx.moveTo(sx(e.x) - r, sy(e.y));
    ctx.lineTo(sx(e.x) - r * 0.55, sy(e.y));
    ctx.moveTo(sx(e.x) + r * 0.55, sy(e.y));
    ctx.lineTo(sx(e.x) + r, sy(e.y));
    ctx.moveTo(sx(e.x), sy(e.y) - r);
    ctx.lineTo(sx(e.x), sy(e.y) - r * 0.55);
    ctx.moveTo(sx(e.x), sy(e.y) + r * 0.55);
    ctx.lineTo(sx(e.x), sy(e.y) + r);
    ctx.stroke();
  }

  function drawFx() {
    let i;
    for (i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = Math.max(1, (2.2 - s.t) * scale);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - r.t));
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 26) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      const o = floats[i];
      ctx.globalAlpha = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, 1);
      ctx.font = (o.gold ? '900 ' : '700 ') + Math.round(o.size * scale) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#180806';
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
    drawCity();
    drawEmbers();

    const drawList = G.enemies.slice().filter(function (e) { return e.alive; });
    drawList.sort(function (a, b) { return a.y - b.y; });
    const p = G.player;
    let playerDrawn = false;
    let i;
    for (i = 0; i < drawList.length; i++) {
      if (p && G.deadT <= 0 && G.mode !== 'lose' && !playerDrawn && drawList[i].y > p.y) {
        drawSoldier(p, { muzzle: G.muzzle > 0, blink: G.invuln > 0 && G.mode === 'play' });
        playerDrawn = true;
      }
      drawEnemy(drawList[i]);
    }
    drawBoss();
    if (p && G.deadT <= 0 && G.mode !== 'lose' && !playerDrawn) {
      drawSoldier(p, { muzzle: G.muzzle > 0, blink: G.invuln > 0 && G.mode === 'play' });
    }
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawNades();
    drawPickups();
    drawLock();
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

  function clientToWorld(cx, cy) {
    if (!canvas) return { x: VW * 0.5, y: VH - 140 };
    const r = canvas.getBoundingClientRect();
    const x = (cx - r.left) * (W / Math.max(1, r.width));
    const y = (cy - r.top) * (H / Math.max(1, r.height));
    return {
      x: clamp((x - ox) / scale, 0, VW),
      y: clamp((y - oy) / scale, 0, VH)
    };
  }

  function resetRun(kind) {
    G.kind = kind || 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.nades = isDense() ? 4 : NADE_START;
    G.rockets = isDense() ? 1 : ROCK_START;
    G.why = '';
    loadStage(1, false);
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.mode = 'play';
    resetRun(kind);
    hideOverlay();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = G.kind === 'dense' ? 'dense' : 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.nades = NADE_START;
    G.rockets = ROCK_START;
    loadStage(1, true);
    seedEmbers();
    showOverlay('title', '毁灭', LEAD);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('raid');
      return;
    }
    startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const shift = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const zee = k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;
    if (shift || zee) {
      keys.nade = down;
      if (down) nadeQueued = true;
    }

    if (down && (isMove || space || shift || zee || k === 'Enter')) e.preventDefault();
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
      startGame('dense');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        keys.fire = false;
        return;
      }
    }
  }

  function bindPad() {
    function hold(node, on, off) {
      if (!node) return;
      const down = function (e) {
        e.preventDefault();
        audio.ensure();
        node.classList.add('held');
        on();
      };
      const up = function (e) {
        e.preventDefault();
        node.classList.remove('held');
        if (off) off();
      };
      node.addEventListener('pointerdown', down);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
      node.addEventListener('pointerleave', up);
    }
    hold(el('btn-left'), function () { keys.l = true; }, function () { keys.l = false; });
    hold(el('btn-right'), function () { keys.r = true; }, function () { keys.r = false; });
    hold(el('btn-up'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(el('btn-down'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(el('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    hold(el('btn-nade'), function () { keys.nade = true; nadeQueued = true; }, function () { keys.nade = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() && G.mode !== 'play') return;
      if (e.button === 2) {
        keys.nade = true;
        nadeQueued = true;
        return;
      }
      pointer.down = true;
      pointer.id = e.pointerId;
      const w = clientToWorld(e.clientX, e.clientY);
      pointer.x = w.x;
      pointer.y = w.y;
      keys.fire = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) return;
      const w = clientToWorld(e.clientX, e.clientY);
      pointer.x = w.x;
      pointer.y = w.y;
    });
    const up = function (e) {
      if (e && e.button === 2) {
        keys.nade = false;
        return;
      }
      pointer.down = false;
      pointer.id = null;
      keys.fire = false;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
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

  selfCheck();
  seedEmbers();
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
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
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
      goTitle();
    });
  }
  if (modeRaid) {
    modeRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (modeDense) {
    modeDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
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
      keys.nade = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
