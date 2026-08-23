'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.5;
  const WALK = 228;
  const JUMP_V = 520;
  const GRAV_Z = 1600;
  const MAX_FALL = 720;
  const COYOTE = 0.08;
  const BUFFER = 0.1;
  const CLEAR_Z = 18;
  const FIRE_CD = 0.086;
  const SHOT_SPD = 640;
  const MAX_PSHOT = 8;
  const BALL_NEED = 1;
  const BALL_T = 2.24;
  const INVULN = 1.22;
  const DIE_T = 0.88;
  const WALL_L = 38;
  const WALL_R = 442;
  const HIT_R = 9;
  const BEST_KEY = 'playbox-outzone-best';
  const MUTE_KEY = 'playbox-outzone-mute';
  const OPS = '方向 / WASD 走 · 空格射击 · Shift / Z 跳 · R 重开 · M 静音';
  const LEAD = '驾驶机甲往上推进。空格朝面向开火，超球会撞墙弹回来。Shift 跳起越过贴地弹和爬虫。撞上丢一条命。清波之后是关底。';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [180, 255, 26];
  const HOT2 = [222, 255, 106];
  const WHT = [244, 255, 224];
  const LEAF = [106, 255, 61];
  const IRON = [42, 56, 32];
  const STL = [72, 96, 48];
  const RUST = [200, 120, 64];
  const DEEP = [12, 22, 10];

  const SCORE = {
    crawler: 80,
    hopper: 110,
    floater: 90,
    turret: 160,
    wasp: 130,
    spinner: 100,
    boss: 3200,
    stage: 1400
  };

  const STAGES = [
    {
      name: '沙脊',
      boss: '砂颚',
      hp: 52,
      theme: 'sand',
      waves: [
        { t: 0.55, kind: 'crawlers', n: 5 },
        { t: 2.5, kind: 'stream', dir: 1 },
        { t: 4.6, kind: 'hoppers', n: 3 },
        { t: 6.6, kind: 'turrets' },
        { t: 8.2, kind: 'crawlers', n: 6 },
        { t: 10.0, kind: 'floaters', n: 4 },
        { t: 12.2, kind: 'spinners', n: 3 },
        { t: 14.4, kind: 'mix1' },
        { t: 17.6, kind: 'boss' }
      ]
    },
    {
      name: '锈城',
      boss: '闸卫',
      hp: 68,
      theme: 'city',
      waves: [
        { t: 0.5, kind: 'crawlers', n: 6 },
        { t: 2.2, kind: 'wasps', n: 4 },
        { t: 4.0, kind: 'turrets' },
        { t: 5.6, kind: 'hoppers', n: 4 },
        { t: 7.4, kind: 'stream', dir: -1 },
        { t: 9.2, kind: 'floaters', n: 5 },
        { t: 11.0, kind: 'spinners', n: 4 },
        { t: 12.8, kind: 'wasps', n: 5 },
        { t: 14.8, kind: 'mix2' },
        { t: 18.4, kind: 'boss' }
      ]
    },
    {
      name: '外核',
      boss: '域心',
      hp: 88,
      theme: 'core',
      waves: [
        { t: 0.45, kind: 'crawlers', n: 7 },
        { t: 2.0, kind: 'wasps', n: 5 },
        { t: 3.6, kind: 'turrets' },
        { t: 5.0, kind: 'hoppers', n: 5 },
        { t: 6.6, kind: 'floaters', n: 6 },
        { t: 8.2, kind: 'spinners', n: 5 },
        { t: 9.8, kind: 'stream', dir: 1 },
        { t: 11.4, kind: 'wasps', n: 6 },
        { t: 13.2, kind: 'mix3' },
        { t: 15.6, kind: 'crawlers', n: 8 },
        { t: 18.8, kind: 'boss' }
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
  function hopHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV_Z);
  }
  function isRain() {
    return G.kind === 'rain';
  }
  function dens() {
    return isRain() ? 1.26 : 1;
  }
  function spdMul() {
    return (isRain() ? 1.28 : 1) * (1 + Math.max(0, G.stage - 1) * 0.07);
  }
  function hpMul() {
    return isRain() ? 1.22 : 1;
  }
  function scrollSpd() {
    if (G.boss && G.boss.active && !G.boss.dead) return isRain() ? 28 : 18;
    return isRain() ? 108 : 76;
  }
  function fireRate() {
    return (isRain() ? 0.074 : FIRE_CD);
  }
  function eFireMul() {
    return isRain() ? 0.74 : 1;
  }
  function groundKind(kind) {
    return kind === 'crawler' || kind === 'spinner' || kind === 'turret';
  }
  function hpOf(kind) {
    if (kind === 'turret') return 3;
    if (kind === 'hopper' || kind === 'wasp') return 2;
    return 1;
  }
  function zOf(kind) {
    if (kind === 'floater') return 22;
    if (kind === 'wasp') return 28;
    return 0;
  }
  function rOf(kind) {
    if (kind === 'turret') return 14;
    if (kind === 'wasp') return 12;
    if (kind === 'hopper') return 12;
    return 11;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-outzone-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-outzone-mute') throw new Error('mute key');
    const h = hopHeight();
    if (h < 70 || h > 100) throw new Error('hop height ' + h);
    if (h <= CLEAR_Z + 40) throw new Error('hop not enough');
    if (WALL_R - WALL_L < 300) throw new Error('corridor');
    if (FIRE_CD >= 0.12) throw new Error('fire cd');
    if (BALL_T <= 1) throw new Error('ball window');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[0].waves.length >= STAGES[2].waves.length) throw new Error('later denser');
    let i;
    for (i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      if (!s.name || !s.boss || !s.waves.length) throw new Error('stage ' + i);
      const last = s.waves[s.waves.length - 1];
      if (last.kind !== 'boss') throw new Error('boss last ' + s.name);
    }
    if (!groundKind('crawler') || groundKind('wasp') || groundKind('floater')) {
      throw new Error('ground rules');
    }
    G.kind = 'rain';
    G.stage = 1;
    if (spdMul() <= 1) throw new Error('rain faster');
    G.kind = 'zone';
    G.stage = 2;
    const later = spdMul();
    G.stage = 1;
    if (later <= spdMul()) throw new Error('later faster');
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
    shot(ball) {
      this.ensure();
      if (ball) {
        this.beep(220, 0.08, 'sine', 0.04, 90);
        this.beep(880, 0.06, 'square', 0.036, 420);
        this.beep(1320, 0.05, 'triangle', 0.022, 560);
      } else {
        this.beep(980, 0.038, 'square', 0.036, 360);
        this.noise(0.02, 0.016, 1600);
      }
    },
    hop() {
      this.ensure();
      this.beep(240, 0.06, 'square', 0.04, 560);
      this.beep(90, 0.05, 'triangle', 0.02, 180);
    },
    land() {
      this.ensure();
      this.noise(0.05, 0.03, 380);
      this.beep(110, 0.05, 'triangle', 0.026, 58);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.032, 0.03, 1200);
      this.beep(620 * lift, 0.055, 'square', 0.038, 980 * lift);
    },
    bounce() {
      this.ensure();
      this.beep(740, 0.04, 'sine', 0.028, 1180);
      this.noise(0.02, 0.016, 900);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.065, 240);
      this.beep(180, 0.16, 'sawtooth', 0.048, 50);
    },
    ballReady() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1176);
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
      this.beep(110, 0.2, 'sawtooth', 0.06, 55);
      this.beep(330, 0.16, 'square', 0.04, 180);
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
      this.beep(220, 0.18, 'sawtooth', 0.045, 90);
      this.beep(140, 0.3, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(660, 0.12, 'triangle', 0.035, 990);
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
    slam() {
      this.ensure();
      this.noise(0.1, 0.05, 220);
      this.beep(80, 0.14, 'sawtooth', 0.045, 40);
    }
  };

  const G = {
    mode: 'title',
    kind: 'zone',
    t: 0,
    clock: 0,
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
    ball: 0,
    overdrive: 0,
    enemies: [],
    shots: [],
    pickups: [],
    shocks: [],
    player: null,
    boss: null,
    pendingBoss: false,
    fireCd: 0,
    jumpBuf: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    winT: 0,
    why: '',
    toastT: 0
  };

  if (!hasDom) {
    selfCheck();
    return;
  }

  selfCheck();

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnZone = el('btn-zone');
  const btnRain = el('btn-rain');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const modeZone = el('mode-zone');
  const modeRain = el('mode-rain');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const gunLabel = el('gun-label');
  const ballBar = el('ball-bar');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const stageEl = el('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let uid = 1;
  let jumpQueued = false;

  const keys = { u: false, d: false, l: false, r: false, fire: false, jump: false };
  const demo = { u: false, d: false, l: false, r: false, fire: true, jump: false };
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
  function jumpHeld() {
    if (G.mode === 'title') return demo.jump;
    if (overlayBlocksPlay()) return false;
    return keys.jump || jumpQueued;
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
    const r = isRain();
    if (modeZone) modeZone.setAttribute('aria-pressed', r ? 'false' : 'true');
    if (modeRain) modeRain.setAttribute('aria-pressed', r ? 'true' : 'false');
  }
  function gunName() {
    if (G.overdrive > 0 && G.combo >= 9) return '三向';
    if (G.overdrive > 0) return '超球';
    return '机炮';
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '外域';
      else if (G.boss && G.boss.active && !G.boss.dead) stageLabel.textContent = spec.boss;
      else stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isRain() ? '谷雨' : '外域';
      tagLabel.classList.toggle('warn', isRain() || G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', !isRain() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = gunName();
      gunLabel.classList.toggle('hot', G.overdrive > 0 && G.combo >= 9);
      gunLabel.classList.toggle('ball', G.overdrive > 0 && G.combo < 9);
    }
    if (ballBar) {
      const v = G.overdrive > 0 ? 1 : clamp(G.ball, 0, 1);
      ballBar.style.transform = 'scaleX(' + v + ')';
      ballBar.classList.toggle('hot', G.overdrive > 0);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 跳越贴地弹 · 超球撞墙弹回', 'warn');
    else if (G.mode === 'win') setHint('外核捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 跳过爬虫 · 攒球弹射', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss + ' · 跳越贴地砸', 'hot');
    else if (G.overdrive > 0) setHint('超球弹墙 · 连击再开三向', 'hot');
    else setHint('八向走射 · 跳越贴地 · 超球撞墙弹回', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'OZON';
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
      hitStop(0.034);
    }
    syncHud();
  }
  function addBall(n) {
    if (G.overdrive > 0 || !playing()) return;
    const was = G.ball;
    G.ball = clamp(G.ball + n, 0, BALL_NEED);
    if (was < BALL_NEED && G.ball >= BALL_NEED) {
      G.ball = 0;
      G.overdrive = BALL_T;
      audio.ballReady();
      toast('超球', false, true);
      floatText(G.player.x, G.player.y - 48, '超球', CYN, true);
      kick(2.4, 'pickup');
      screenFlash(CYN, 0.28);
    }
    syncHud();
  }

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 72; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.1),
        a: rand(0.12, 0.5),
        z: rand(0.35, 1.2),
        rain: Math.random() < 0.55
      });
    }
  }

  function makePlayer() {
    return {
      x: VW * 0.5,
      y: VH - 148,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: -1,
      z: 0,
      vz: 0,
      grounded: true,
      coyote: 0,
      run: 0,
      squash: 1,
      r: HIT_R
    };
  }
  function makeEnemy(kind, x, y, extra) {
    extra = extra || {};
    const hp = Math.max(1, Math.round(hpOf(kind) * (kind === 'boss' ? 1 : hpMul())));
    return {
      id: uid++,
      kind: kind,
      x: x,
      y: y == null ? -28 : y,
      vx: extra.vx || 0,
      vy: extra.vy == null ? 72 * dens() : extra.vy,
      z: extra.z == null ? zOf(kind) : extra.z,
      vz: 0,
      hp: hp,
      max: hp,
      r: extra.r || rOf(kind),
      t: extra.t || 0,
      fire: extra.fire == null ? rand(0.3, 1.1) : extra.fire,
      phase: extra.phase || rand(0, TAU),
      baseX: x,
      amp: extra.amp == null ? 46 : extra.amp,
      alive: true,
      flash: 0,
      score: SCORE[kind] || 80,
      face: extra.face || 0,
      hop: 0
    };
  }
  function makeBoss(spec) {
    const hp = (spec.hp * (isRain() ? 1.24 : 1)) | 0;
    return {
      id: uid++,
      kind: spec.boss,
      name: spec.boss,
      x: VW * 0.5,
      y: 118,
      vx: 70,
      vy: 0,
      z: 8,
      hp: hp,
      max: hp,
      r: spec.boss === '域心' ? 38 : 32,
      t: 0,
      fire: 1.15,
      state: 'enter',
      enter: 1.15,
      active: false,
      dead: false,
      flash: 0,
      pattern: 0
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.stageT = 0;
    G.waveI = 0;
    G.enemies = [];
    G.shots = [];
    G.pickups = [];
    G.shocks = [];
    G.boss = makeBoss(spec);
    G.pendingBoss = false;
    G.player = makePlayer();
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.winT = 0;
    G.scroll = n * 240;
    jumpQueued = false;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    }
    if (attract) {
      G.enemies.push(makeEnemy('crawler', 150, 220));
      G.enemies.push(makeEnemy('crawler', 330, 280));
      G.enemies.push(makeEnemy('floater', 240, 120, { vy: 40 }));
      G.enemies.push(makeEnemy('spinner', 200, 90, { vx: 80, vy: 90 }));
    }
    syncHud();
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
    capArr(G.enemies, 48);
    return e;
  }

  function spawnWave(w) {
    const n = (w.n || 4) + (isRain() ? 2 : 0);
    const lane = function (i, total) {
      return WALL_L + 28 + ((WALL_R - WALL_L - 56) * (i + 0.5)) / total;
    };
    let i;
    if (w.kind === 'crawlers') {
      for (i = 0; i < n; i++) spawnEnemy(makeEnemy('crawler', lane(i, n), -24 - i * 10));
    } else if (w.kind === 'hoppers') {
      for (i = 0; i < n; i++) spawnEnemy(makeEnemy('hopper', lane(i, n), -30 - i * 14));
    } else if (w.kind === 'floaters') {
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('floater', lane(i, n), -20 - i * 18, {
          amp: 50 + i * 6,
          phase: i * 0.9
        }));
      }
    } else if (w.kind === 'wasps') {
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('wasp', i % 2 === 0 ? 70 : 410, -20 - i * 16, {
          face: i % 2 === 0 ? 1 : -1,
          vy: 110 * dens()
        }));
      }
    } else if (w.kind === 'spinners') {
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('spinner', lane(i, n), -16, {
          vx: (i % 2 === 0 ? 1 : -1) * 90 * dens(),
          vy: 130 * dens()
        }));
      }
    } else if (w.kind === 'turrets') {
      spawnEnemy(makeEnemy('turret', WALL_L + 28, 160, { vy: 0 }));
      spawnEnemy(makeEnemy('turret', WALL_R - 28, 160, { vy: 0 }));
      if (G.stage >= 2) spawnEnemy(makeEnemy('turret', VW * 0.5, 90, { vy: 18 }));
      if (isRain()) {
        spawnEnemy(makeEnemy('turret', WALL_L + 28, 280, { vy: 0 }));
        spawnEnemy(makeEnemy('turret', WALL_R - 28, 280, { vy: 0 }));
      }
    } else if (w.kind === 'stream') {
      const dir = w.dir || 1;
      const extra = isRain() ? 3 : 0;
      for (i = 0; i < 6 + extra; i++) {
        spawnEnemy(makeEnemy('crawler', dir > 0 ? WALL_L + 40 : WALL_R - 40, -18 - i * 22, {
          vx: dir * 70 * dens(),
          vy: 86 * dens()
        }));
      }
    } else if (w.kind === 'mix1') {
      spawnWave({ kind: 'crawlers', n: 4 });
      spawnWave({ kind: 'floaters', n: 3 });
    } else if (w.kind === 'mix2') {
      spawnWave({ kind: 'hoppers', n: 3 });
      spawnWave({ kind: 'wasps', n: 3 });
      spawnWave({ kind: 'turrets' });
    } else if (w.kind === 'mix3') {
      spawnWave({ kind: 'spinners', n: 3 });
      spawnWave({ kind: 'wasps', n: 4 });
      spawnWave({ kind: 'crawlers', n: 5 });
    } else if (w.kind === 'boss') {
      G.pendingBoss = true;
    }
  }

  function spawnShot(s) {
    s.id = uid++;
    s.hit = s.hit || [];
    G.shots.push(s);
    capArr(G.shots, 110);
  }

  function enemyShoot(e, dx, dy, spd, kind) {
    const len = hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const low = kind === 'low' || kind === 'slam';
    spawnShot({
      x: e.x + nx * 12,
      y: e.y + ny * 10,
      vx: nx * spd,
      vy: ny * spd,
      from: 'e',
      kind: kind || 'e',
      z: low ? 0 : (e.z || 8),
      dmg: 1,
      life: kind === 'slam' ? 0.55 : 2.2,
      rgb: kind === 'slam' ? GOLD : MAG,
      r: kind === 'slam' ? 11 : (kind === 'ball' ? 6 : 3.4),
      bounce: kind === 'ball' ? 3 : 0
    });
  }

  function countPShots() {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === 'p' && G.shots[i].life > 0) n += 1;
    }
    return n;
  }

  function tryShoot() {
    if (G.deadT > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const ball = G.overdrive > 0;
    const tri = ball && G.combo >= 9;
    if (!ball && countPShots() >= MAX_PSHOT) return;
    const p = G.player;
    const ax = p.ax;
    const ay = p.ay;
    const ox0 = p.x + ax * 16;
    const oy0 = p.y + ay * 14 - p.z * 0.12;
    const dirs = tri
      ? [
        [ax, ay],
        [ax * 0.86 - ay * 0.5, ay * 0.86 + ax * 0.5],
        [ax * 0.86 + ay * 0.5, ay * 0.86 - ax * 0.5]
      ]
      : [[ax, ay]];
    let i;
    for (i = 0; i < dirs.length; i++) {
      const len = hypot(dirs[i][0], dirs[i][1]) || 1;
      const nx = dirs[i][0] / len;
      const ny = dirs[i][1] / len;
      spawnShot({
        x: ox0,
        y: oy0,
        vx: nx * (ball ? 560 : SHOT_SPD),
        vy: ny * (ball ? 560 : SHOT_SPD),
        from: 'p',
        kind: ball ? 'ball' : 'vulcan',
        z: p.z,
        dmg: ball ? 2 : 1,
        pierce: ball ? 1 : 0,
        bounce: ball ? 4 : 0,
        life: ball ? 1.35 : 0.62,
        rgb: ball ? (tri ? GOLD : CYN) : HOT,
        r: ball ? 5.4 : 3.1,
        hit: []
      });
    }
    G.fireCd = ball ? 0.1 : fireRate();
    G.muzzle = ball ? 0.09 : 0.045;
    if (playing() || G.mode === 'title') audio.shot(ball);
    emit(ball ? 8 : 4, {
      x: ox0, y: oy0, j: 4,
      vx0: ax * 40, vx1: ax * 180, vy0: ay * 40, vy1: ay * 180,
      life: 0.14, r0: 1, r1: 2.4, rgb: ball ? CYN : HOT, g: 40
    });
    if (ball) hitStop(0.018);
  }

  function tryJump() {
    if (G.deadT > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    const p = G.player;
    if (!p.grounded && p.coyote <= 0) return;
    p.vz = JUMP_V;
    p.grounded = false;
    p.coyote = 0;
    p.squash = 1.18;
    G.jumpBuf = 0;
    jumpQueued = false;
    keys.jump = false;
    if (playing() || G.mode === 'title') audio.hop();
    emit(6, {
      x: p.x, y: p.y + 8, j: 6,
      vx0: -80, vx1: 80, vy0: 20, vy1: 90,
      life: 0.2, r0: 1.2, r1: 2.6, rgb: HOT2, g: 80
    });
    kick(1.4, 'thump');
  }

  function die(why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.overdrive = 0;
    audio.death();
    boomAt(G.player.x, G.player.y, 1.6, MAG);
    hitStop(0.072);
    kick(7.2, 'die');
    screenFlash(MAG, 0.55);
    syncHud();
    if (G.lives <= 0) {
      G.mode = 'lose';
      const map = {
        crash: '撞上了',
        shot: '中弹了',
        slam: '被砸中了',
        crush: '被碾了'
      };
      showOverlay('lose', map[G.why] || '机甲碎了', '命尽。R 立刻重开。跳过贴地弹，超球弹墙清场。');
      audio.lose();
    }
  }

  function respawn() {
    G.player = makePlayer();
    G.deadT = 0;
    G.invuln = INVULN;
    G.fireCd = 0.1;
    G.ball = Math.min(G.ball, 0.35);
    for (let i = G.shots.length - 1; i >= 0; i--) {
      if (G.shots[i].from === 'e') G.shots.splice(i, 1);
    }
    G.shocks.length = 0;
    screenFlash(HOT, 0.22);
    syncHud();
  }

  function dropPickup(x, y, chance) {
    if (!playing()) return;
    if (Math.random() > (chance || 0.16)) return;
    G.pickups.push({
      x: x, y: y, t: 0, life: 6.5, kind: 'ball', z: 0
    });
    capArr(G.pickups, 6);
  }

  function hurtEnemy(e, dmg, shot) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    addBall(0.07);
    bumpCombo();
    audio.hit(G.combo);
    hitStop(shot && shot.kind === 'ball' ? 0.046 : 0.032);
    kick(shot && shot.kind === 'ball' ? 2.6 : 1.8, 'hit');
    emit(6, {
      x: e.x, y: e.y, j: 5,
      vx0: -120, vx1: 120, vy0: -140, vy1: 40,
      life: 0.22, r0: 1.1, r1: 2.6, rgb: shot && shot.kind === 'ball' ? CYN : HOT, g: 160
    });
    if (e.hp <= 0) {
      e.alive = false;
      addScore((e.score || 80) * G.mult);
      addBall(0.12);
      boomAt(e.x, e.y, 0.7, e.kind === 'turret' ? RUST : HOT);
      floatText(e.x, e.y - 10, '+' + ((e.score || 80) * G.mult), HOT, G.mult >= 2);
      if (e.kind === 'turret' || e.kind === 'wasp') dropPickup(e.x, e.y, 0.34);
      else dropPickup(e.x, e.y, 0.1);
    }
  }

  function hurtBoss(dmg, shot) {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    b.hp -= dmg;
    b.flash = 0.09;
    addBall(0.05);
    bumpCombo();
    audio.hit(G.combo);
    hitStop(0.05);
    kick(3.1, 'hit');
    emit(8, {
      x: b.x, y: b.y, j: 10,
      vx0: -160, vx1: 160, vy0: -120, vy1: 80,
      life: 0.24, r0: 1.2, r1: 3, rgb: GOLD, g: 80
    });
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      addScore(SCORE.boss * G.mult);
      addScore(SCORE.stage * G.stage * G.mult);
      boomAt(b.x, b.y, 2.4, GOLD);
      audio.boom();
      hitStop(0.08);
      kick(6.4, 'boom');
      screenFlash(GOLD, 0.5);
      toast(b.name + ' 击破', false, true);
      G.winT = 1.35;
      dropPickup(b.x, b.y, 1);
    }
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      G.mode = 'win';
      const bonus = isRain() ? 10000 : 8000;
      addScore(bonus);
      audio.win();
      kick(4, 'win-flash');
      showOverlay(
        'win',
        isRain() ? '谷雨通关' : '外核捣毁了',
        '最高连击 ×' + G.maxCombo + ' · 再加 ' + bonus
      );
      syncHud();
      return;
    }
    G.stage += 1;
    loadStage(G.stage, false);
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    G.invuln = 1.0;
    syncHud();
  }

  function activateBoss() {
    const b = G.boss;
    if (!b || b.active || b.dead) return;
    b.active = true;
    b.state = 'enter';
    b.enter = 1.15;
    b.y = -40;
    audio.boss();
    toast(b.name, false, true);
    kick(3.6, 'thump');
    syncHud();
  }

  function clientToWorld(cx, cy) {
    if (!canvas) return { x: VW * 0.5, y: VH - 140 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((cx - rect.left - ox) / scale, 0, VW),
      y: clamp((cy - rect.top - oy) / scale, 0, VH)
    };
  }

  function demoThink() {
    const p = G.player;
    if (!p) return;
    demo.fire = true;
    demo.u = p.y > VH - 200;
    demo.d = p.y < VH - 260;
    const sway = Math.sin(G.clock * 0.85);
    demo.l = sway > 0.18;
    demo.r = sway < -0.18;
    demo.jump = false;
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (!groundKind(e.kind) && e.kind !== 'hopper') continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (dy > -10 && dy < 90 && Math.abs(dx) < 46 && p.grounded) demo.jump = true;
    }
    if (G.enemies.filter(function (e) { return e.alive; }).length < 3) {
      spawnEnemy(makeEnemy('crawler', rand(WALL_L + 40, WALL_R - 40), -20));
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (!p) return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0 && playing() && G.lives > 0) respawn();
      return;
    }

    let ix = 0;
    let iy = 0;
    if (inL()) ix -= 1;
    if (inR()) ix += 1;
    if (inU()) iy -= 1;
    if (inD()) iy += 1;
    if (pointer.down && playing() && !overlayBlocksPlay()) {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const d = hypot(dx, dy);
      if (d > 10) {
        ix = dx / d;
        iy = dy / d;
      }
    }
    const mag = hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }
    if (mag > 0.12) {
      p.ax = ix / (mag || 1);
      p.ay = iy / (mag || 1);
      const n = hypot(p.ax, p.ay) || 1;
      p.ax /= n;
      p.ay /= n;
    }

    const spd = WALK * (isRain() ? 1.08 : 1) * (p.grounded ? 1 : 0.92);
    p.vx = ix * spd;
    p.vy = iy * spd;
    p.x = clamp(p.x + p.vx * dt, WALL_L + 14, WALL_R - 14);
    p.y = clamp(p.y + p.vy * dt, 86, VH - 56);
    p.run += hypot(p.vx, p.vy) * dt * 0.085;
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0002, dt));

    if (G.jumpBuf > 0) G.jumpBuf -= dt;
    if (jumpHeld()) G.jumpBuf = BUFFER;
    jumpQueued = false;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote = Math.max(0, p.coyote - dt);

    p.vz -= GRAV_Z * dt;
    if (p.vz < -MAX_FALL) p.vz = -MAX_FALL;
    p.z += p.vz * dt;
    if (p.z <= 0) {
      if (!p.grounded) {
        p.squash = 0.78;
        if (playing() || G.mode === 'title') audio.land();
        emit(5, {
          x: p.x, y: p.y + 10, j: 8,
          vx0: -70, vx1: 70, vy0: -10, vy1: 40,
          life: 0.16, r0: 1, r1: 2.2, rgb: STL, g: 60
        });
      }
      p.z = 0;
      p.vz = 0;
      p.grounded = true;
    } else {
      p.grounded = false;
    }
    if (G.jumpBuf > 0) tryJump();

    if (fireHeld()) tryShoot();
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
  }

  function updateEnemy(e, dt) {
    if (e.flash > 0) e.flash -= dt;
    if (!e.alive) return;
    e.t += dt;
    const p = G.player;
    const mul = spdMul();

    if (e.kind === 'crawler') {
      if (p) {
        const dx = p.x - e.x;
        e.vx = lerp(e.vx, clamp(dx, -1, 1) * 46 * mul, 0.08);
      }
      e.vy = 70 * dens() * mul;
      e.fire -= dt;
      if (e.fire <= 0 && p && playing()) {
        e.fire = (1.6 + rand(0, 0.6)) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 150 * dens(), 'low');
      }
    } else if (e.kind === 'hopper') {
      e.vy = 64 * dens() * mul;
      if (p) e.vx = lerp(e.vx, clamp(p.x - e.x, -90, 90), 0.04);
      e.hop -= dt;
      if (e.hop <= 0 && e.z <= 0) {
        e.vz = 380;
        e.hop = rand(0.7, 1.3);
      }
      e.vz -= GRAV_Z * dt;
      e.z += e.vz * dt;
      if (e.z < 0) {
        e.z = 0;
        e.vz = 0;
      }
      e.fire -= dt;
      if (e.fire <= 0 && p && playing() && e.z < 8) {
        e.fire = 1.8 * eFireMul();
        enemyShoot(e, p.x - e.x, 40, 130 * dens(), 'low');
      }
    } else if (e.kind === 'floater') {
      e.x = e.baseX + Math.sin(e.t * 2.1 + e.phase) * e.amp;
      e.vy = 58 * dens() * mul;
      e.fire -= dt;
      if (e.fire <= 0 && p && playing()) {
        e.fire = (1.35 + rand(0, 0.5)) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 168 * dens(), 'e');
      }
    } else if (e.kind === 'turret') {
      e.vy = Math.min(e.vy, 22);
      e.fire -= dt;
      if (e.fire <= 0 && p && playing()) {
        e.fire = (1.05 + rand(0, 0.35)) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 190 * dens(), 'e');
      }
    } else if (e.kind === 'wasp') {
      e.x += Math.sin(e.t * 3.2) * 90 * dt * (e.face || 1);
      e.vy = 96 * dens() * mul;
      if (e.t > 1.1 && p) {
        e.vx = lerp(e.vx, (p.x - e.x) * 1.4, 0.05);
        e.vy = lerp(e.vy, (p.y - e.y) * 0.9, 0.04);
      }
      e.fire -= dt;
      if (e.fire <= 0 && p && playing()) {
        e.fire = 1.5 * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 200 * dens(), 'e');
      }
    } else if (e.kind === 'spinner') {
      e.x += e.vx * dt;
      if (e.x < WALL_L + 16) {
        e.x = WALL_L + 16;
        e.vx = Math.abs(e.vx);
      }
      if (e.x > WALL_R - 16) {
        e.x = WALL_R - 16;
        e.vx = -Math.abs(e.vx);
      }
      e.vy = 118 * dens() * mul;
    }

    e.x += (e.kind === 'spinner' ? 0 : e.vx) * dt;
    e.y += e.vy * dt;
    e.x = clamp(e.x, WALL_L + 12, WALL_R - 12);

    if (e.y > VH + 40) e.alive = false;

    if (playing() && G.deadT <= 0 && G.invuln <= 0 && p) {
      const dz = Math.abs((p.z || 0) - (e.z || 0));
      const jumpClear = p.z >= CLEAR_Z && groundKind(e.kind) && (e.z || 0) < 8;
      if (!jumpClear && dz < 16) {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const rr = e.r + p.r;
        if (dx * dx + dy * dy < rr * rr) die('crash');
      }
    }
  }

  function spawnShock(x, y, r) {
    G.shocks.push({ x: x, y: y, r: 12, max: r || 78, t: 0, life: 0.42 });
    capArr(G.shocks, 8);
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active) return;
    b.t += dt;
    if (b.flash > 0) b.flash -= dt;
    const p = G.player;
    const mul = spdMul();

    if (b.state === 'enter') {
      b.enter -= dt;
      b.y = lerp(b.y, 128, 0.06);
      if (b.enter <= 0) {
        b.state = 'fight';
        b.y = 128;
      }
      return;
    }

    if (b.kind === '砂颚') {
      b.x += b.vx * dt * mul;
      if (b.x < WALL_L + 50 && b.vx < 0) b.vx *= -1;
      if (b.x > WALL_R - 50 && b.vx > 0) b.vx *= -1;
      b.y = 128 + Math.sin(b.t * 1.4) * 10;
      b.fire -= dt;
      if (b.fire <= 0 && p) {
        b.pattern += 1;
        if (b.pattern % 3 === 0) {
          spawnShock(b.x, b.y + 36, 90);
          audio.slam();
          kick(3.4, 'thump');
          b.fire = 1.15 * eFireMul();
        } else {
          enemyShoot(b, -0.4, 1, 170 * dens(), 'low');
          enemyShoot(b, 0, 1, 180 * dens(), 'low');
          enemyShoot(b, 0.4, 1, 170 * dens(), 'low');
          if (p) enemyShoot(b, p.x - b.x, p.y - b.y, 160 * dens(), 'e');
          b.fire = 0.92 * eFireMul();
        }
      }
    } else if (b.kind === '闸卫') {
      b.x = VW * 0.5 + Math.sin(b.t * 0.7) * 70;
      b.y = 108;
      b.fire -= dt;
      if (b.fire <= 0 && p) {
        b.pattern += 1;
        if (b.pattern % 2 === 0) {
          const lane = (b.pattern * 47) % 280;
          for (let k = 0; k < 6; k++) {
            spawnShot({
              x: 90 + lane, y: 90 + k * 4,
              vx: 0, vy: 210 * dens(),
              from: 'e', kind: 'lane', z: 20,
              dmg: 1, life: 2.4, rgb: MAG, r: 4.2
            });
          }
          b.fire = 0.72 * eFireMul();
        } else {
          for (let a = -2; a <= 2; a++) {
            const ang = Math.atan2(p.y - b.y, p.x - b.x) + a * 0.22;
            enemyShoot(b, Math.cos(ang), Math.sin(ang), 188 * dens(), 'e');
          }
          b.fire = 1.05 * eFireMul();
        }
      }
    } else if (b.kind === '域心') {
      b.x = VW * 0.5 + Math.sin(b.t * 0.85) * 86;
      b.y = 132 + Math.cos(b.t * 0.6) * 18;
      b.fire -= dt;
      if (b.fire <= 0 && p) {
        b.pattern += 1;
        if (b.pattern % 4 === 0) {
          spawnShock(b.x, VH * 0.55, 110);
          spawnShock(p.x, p.y, 64);
          audio.slam();
          b.fire = 0.9 * eFireMul();
        } else if (b.pattern % 4 === 2) {
          for (let k = 0; k < 8; k++) {
            const ang = (k / 8) * TAU + b.t;
            spawnShot({
              x: b.x, y: b.y,
              vx: Math.cos(ang) * 140 * dens(),
              vy: Math.sin(ang) * 140 * dens(),
              from: 'e', kind: 'ball', z: 16,
              dmg: 1, life: 2.6, rgb: MAG, r: 5.5, bounce: 3
            });
          }
          b.fire = 1.05 * eFireMul();
        } else {
          enemyShoot(b, p.x - b.x, p.y - b.y, 200 * dens(), 'e');
          enemyShoot(b, p.x - b.x - 40, p.y - b.y, 190 * dens(), 'e');
          enemyShoot(b, p.x - b.x + 40, p.y - b.y, 190 * dens(), 'e');
          b.fire = 0.7 * eFireMul();
        }
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0 && p) {
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const rr = b.r + p.r - 4;
      if (dx * dx + dy * dy < rr * rr) {
        const jumpClear = p.z >= CLEAR_Z + 8;
        if (!jumpClear) die('crash');
      }
    }
  }

  function updateShots(dt) {
    let i;
    const p = G.player;
    for (i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.bounce > 0) {
        if (s.x < WALL_L + s.r) {
          s.x = WALL_L + s.r;
          s.vx = Math.abs(s.vx);
          s.bounce -= 1;
          if (s.from === 'p') audio.bounce();
        } else if (s.x > WALL_R - s.r) {
          s.x = WALL_R - s.r;
          s.vx = -Math.abs(s.vx);
          s.bounce -= 1;
          if (s.from === 'p') audio.bounce();
        }
        if (s.y < 18) {
          s.y = 18;
          s.vy = Math.abs(s.vy);
          s.bounce -= 1;
        }
        if (s.bounce < 0) s.life = 0;
      }
      if (s.x < -20 || s.x > VW + 20 || s.y < -30 || s.y > VH + 30) s.life = 0;
      if (s.life <= 0) {
        G.shots.splice(i, 1);
        continue;
      }

      if (s.from === 'p') {
        let j;
        for (j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          const dx = e.x - s.x;
          const dy = e.y - s.y;
          const rr = e.r + s.r;
          if (dx * dx + dy * dy < rr * rr) {
            s.hit.push(e.id);
            hurtEnemy(e, s.dmg, s);
            if (!s.pierce) {
              s.life = 0;
              break;
            }
            s.pierce -= 1;
            if (s.pierce < 0) {
              s.life = 0;
              break;
            }
          }
        }
        const b = G.boss;
        if (s.life > 0 && b && b.active && !b.dead && s.hit.indexOf(b.id) < 0) {
          const dx = b.x - s.x;
          const dy = b.y - s.y;
          const rr = b.r + s.r;
          if (dx * dx + dy * dy < rr * rr) {
            s.hit.push(b.id);
            hurtBoss(s.dmg, s);
            if (!s.pierce) s.life = 0;
            else {
              s.pierce -= 1;
              if (s.pierce < 0) s.life = 0;
            }
          }
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0 && p) {
        const jumpClear = p.z >= CLEAR_Z && (s.z || 0) < 8 && (s.kind === 'low' || s.kind === 'slam');
        if (!jumpClear) {
          const dx = s.x - p.x;
          const dy = s.y - p.y;
          const rr = (s.r || 3) + p.r * 0.72;
          const dz = Math.abs((p.z || 0) - (s.z || 0));
          if (dx * dx + dy * dy < rr * rr && dz < 18) {
            s.life = 0;
            die(s.kind === 'slam' || s.kind === 'low' ? 'shot' : 'shot');
          }
        }
      }
    }

    for (i = G.shocks.length - 1; i >= 0; i--) {
      const sh = G.shocks[i];
      sh.t += dt;
      sh.r = lerp(12, sh.max, clamp(sh.t / sh.life, 0, 1));
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && p) {
        const jumpClear = p.z >= CLEAR_Z;
        const dx = sh.x - p.x;
        const dy = sh.y - p.y;
        const d = hypot(dx, dy);
        if (!jumpClear && d < sh.r + 8 && d > sh.r - 16) die('slam');
      }
      if (sh.t >= sh.life) G.shocks.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    const p = G.player;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const u = G.pickups[i];
      u.t += dt;
      u.y += 28 * dt;
      if (u.t > u.life || u.y > VH + 20) {
        G.pickups.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && p) {
        const dx = u.x - p.x;
        const dy = u.y - p.y;
        if (dx * dx + dy * dy < 22 * 22) {
          G.pickups.splice(i, 1);
          addBall(0.55);
          audio.ballReady();
          floatText(u.x, u.y, '球', CYN, true);
          kick(1.8, 'pickup');
        }
      }
    }
  }

  function updateWaves(dt) {
    if (!playing() && G.mode !== 'title') return;
    if (G.mode === 'title') return;
    if (G.deadT > 0) return;
    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) nextStage();
      return;
    }
    const spec = STAGES[G.stage - 1];
    G.stageT += dt;
    while (G.waveI < spec.waves.length && G.stageT >= spec.waves[G.waveI].t) {
      spawnWave(spec.waves[G.waveI]);
      G.waveI += 1;
    }
    if (G.pendingBoss && liveEnemies() <= 2 && !(G.boss && G.boss.active) && G.winT <= 0) {
      G.pendingBoss = false;
      activateBoss();
    }
  }

  function updateFx(dt) {
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const o = particles[i];
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
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));

    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (i = 0; i < embers.length; i++) {
      const em = embers[i];
      em.y += scr * em.z * dt * (isRain() && em.rain ? 1.8 : 1);
      if (isRain() && em.rain) em.x += Math.sin(G.t * 2 + i) * 8 * dt;
      if (em.y > VH + 10) {
        em.y = -8;
        em.x = Math.random() * VW;
      }
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    if (G.mode === 'title') demoThink();
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.invuln > 0 && G.mode === 'play') G.invuln -= dt;
    if (G.overdrive > 0) {
      G.overdrive -= dt;
      if (G.overdrive <= 0) syncHud();
    }
    if (G.toastT > 0) G.toastT -= dt;

    if (G.player && (G.mode === 'play' || G.mode === 'title')) updatePlayer(dt);
    if (G.mode === 'play' || G.mode === 'title') {
      let i;
      for (i = 0; i < G.enemies.length; i++) updateEnemy(G.enemies[i], dt);
      G.enemies = G.enemies.filter(function (e) { return e.alive || e.flash > 0; });
      updateBoss(dt);
      updateShots(dt);
      updatePickups(dt);
      updateWaves(dt);
    }
    updateFx(dt);
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'city') {
      g.addColorStop(0, '#0a1608');
      g.addColorStop(0.55, '#08140a');
      g.addColorStop(1, '#060e06');
    } else if (spec.theme === 'core') {
      g.addColorStop(0, '#101808');
      g.addColorStop(0.45, '#0c1a0a');
      g.addColorStop(1, '#081208');
    } else {
      g.addColorStop(0, '#14240c');
      g.addColorStop(0.55, '#0c180a');
      g.addColorStop(1, '#081208');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.scroll;
    let i;
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.fillRect(ox, oy, WALL_L * scale, VH * scale);
    ctx.fillRect(sx(WALL_R), oy, (VW - WALL_R) * scale, VH * scale);
    ctx.fillStyle = rgba(HOT, 0.22);
    ctx.fillRect(sx(WALL_L - 3), oy, 3 * scale, VH * scale);
    ctx.fillRect(sx(WALL_R), oy, 3 * scale, VH * scale);

    for (i = 0; i < 14; i++) {
      const hsh = hash2(i * 19 + G.stage * 7);
      const yy = ((i * 92 - par * 0.55) % (VH + 80)) - 20;
      const h = (50 + hsh * 120);
      ctx.fillStyle = spec.theme === 'core'
        ? 'rgba(40, 70, 18, 0.35)'
        : spec.theme === 'city'
          ? 'rgba(28, 48, 16, 0.5)'
          : 'rgba(48, 72, 20, 0.38)';
      ctx.fillRect(ox, sy(yy), WALL_L * scale, h * scale);
      ctx.fillRect(sx(WALL_R), sy(yy + 20), (VW - WALL_R) * scale, h * 0.8 * scale);
    }

    ctx.strokeStyle = rgba(HOT, spec.theme === 'core' ? 0.16 : 0.08);
    ctx.lineWidth = 1;
    for (i = 0; i < 10; i++) {
      const y = ((i * 86 - par * 0.8) % (VH + 40)) - 10;
      ctx.beginPath();
      ctx.moveTo(sx(WALL_L), sy(y));
      ctx.lineTo(sx(WALL_R), sy(y));
      ctx.stroke();
    }

    if (spec.theme === 'city') {
      for (i = 0; i < 8; i++) {
        const hsh = hash2(i * 11 + 3);
        const y = ((i * 110 - par * 0.4) % (VH + 60)) - 20;
        ctx.fillStyle = 'rgba(180, 255, 26, 0.05)';
        ctx.fillRect(sx(WALL_L + 18 + hsh * 40), sy(y), 10 * scale, 46 * scale);
      }
    }
    if (spec.theme === 'core') {
      ctx.strokeStyle = rgba(GOLD, 0.14);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(VW * 0.5), sy(120), 70 * scale, 0, TAU);
      ctx.stroke();
    }

    for (i = 0; i < embers.length; i++) {
      const em = embers[i];
      if (isRain() && em.rain) {
        ctx.strokeStyle = rgba(HOT, 0.18 * em.a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx(em.x), sy(em.y));
        ctx.lineTo(sx(em.x + 2), sy(em.y + 10 * em.s));
        ctx.stroke();
      } else {
        ctx.fillStyle = rgba(HOT2, em.a * 0.45);
        ctx.fillRect(sx(em.x), sy(em.y), em.s * scale, em.s * scale);
      }
    }
  }

  function drawMech(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    const lift = (p.z || 0) * 0.55 * scale;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y) - lift);
    const sq = opt.squash || 1;
    ctx.scale(1, sq);
    const run = opt.run || 0;
    const leg = Math.sin(run) * (opt.grounded ? 5 : 2);

    ctx.fillStyle = 'rgba(0,0,0,' + (0.28 - Math.min(0.18, (p.z || 0) * 0.003)) + ')';
    ctx.beginPath();
    ctx.ellipse(0, 16 * s + lift, 11 * s, 4.2 * s, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(STL, 0.95);
    ctx.lineWidth = 3.4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6 * s, 4 * s);
    ctx.lineTo(-8 * s - leg * s, 14 * s);
    ctx.moveTo(6 * s, 4 * s);
    ctx.lineTo(8 * s + leg * s, 14 * s);
    ctx.stroke();

    ctx.fillStyle = rgba(IRON, 0.96);
    ctx.beginPath();
    ctx.ellipse(0, 2 * s, 13 * s, 9 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(opt.rgb || HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -2 * s, 11 * s, 10 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(STL, 0.9);
    ctx.fillRect(-10 * s, -10 * s, 20 * s, 3.2 * s);

    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(-6 * s, -6 * s, 12 * s, 5 * s);
    ctx.fillStyle = rgba(G.overdrive > 0 ? GOLD : CYN, 0.95);
    ctx.fillRect(-4 * s, -5 * s, 8 * s, 3 * s);

    const ax = p.ax || 0;
    const ay = p.ay || -1;
    ctx.strokeStyle = rgba(G.overdrive > 0 ? GOLD : HOT2, 0.95);
    ctx.lineWidth = 3.2 * s;
    ctx.beginPath();
    ctx.moveTo(ax * 6 * s, ay * 4 * s);
    ctx.lineTo(ax * 20 * s, ay * 18 * s);
    ctx.stroke();
    if (opt.muzzle) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(ax * 22 * s, ay * 20 * s, 5 * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-2 * s, -14 * s, 4 * s, 5 * s);
    if (!opt.grounded) {
      ctx.fillStyle = rgba(CYN, 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 16 * s, 7 * s, 3 * s, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    if (!e.alive && e.flash <= 0) return;
    const s = scale;
    const lift = (e.z || 0) * 0.5 * s;
    const x = sx(e.x);
    const y = sy(e.y) - lift;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : HOT;

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(sx(e.x), sy(e.y) + 8 * s, 8 * s, 3 * s, 0, 0, TAU);
    ctx.fill();

    if (e.kind === 'crawler') {
      ctx.fillStyle = rgba(flash ? WHT : STL, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 12 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(RUST, 0.9);
      ctx.fillRect(x - 5 * s, y - 4 * s, 10 * s, 3 * s);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(x - 3 * s, y - 1 * s, 6 * s, 2 * s);
      return;
    }
    if (e.kind === 'hopper') {
      ctx.fillStyle = rgba(flash ? WHT : RUST, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 10 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 8 * s, y + 4 * s, 5 * s, 8 * s);
      ctx.fillRect(x + 3 * s, y + 4 * s, 5 * s, 8 * s);
      return;
    }
    if (e.kind === 'floater') {
      ctx.fillStyle = rgba(flash ? WHT : CYN, 0.9);
      ctx.beginPath();
      ctx.ellipse(x, y, 11 * s, 6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(x - 3 * s, y - 3 * s, 6 * s, 3 * s);
      return;
    }
    if (e.kind === 'turret') {
      ctx.fillStyle = rgba(flash ? WHT : IRON, 0.96);
      ctx.fillRect(x - 12 * s, y - 8 * s, 24 * s, 16 * s);
      ctx.fillStyle = rgba(HOT, 0.75);
      ctx.fillRect(x - 12 * s, y - 8 * s, 24 * s, 3 * s);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(x - 3 * s, y - 2 * s, 6 * s, 10 * s);
      return;
    }
    if (e.kind === 'wasp') {
      ctx.fillStyle = rgba(flash ? WHT : MAG, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y, 10 * s, 7 * s, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.ellipse(x - 6 * s, y - 6 * s, 7 * s, 4 * s, -0.4, 0, TAU);
      ctx.ellipse(x + 6 * s, y - 6 * s, 7 * s, 4 * s, 0.4, 0, TAU);
      ctx.stroke();
      return;
    }
    if (e.kind === 'spinner') {
      ctx.fillStyle = rgba(flash ? WHT : MAG, 0.92);
      ctx.beginPath();
      ctx.arc(x, y, 9 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(x, y, 5 * s, e.t * 10, e.t * 10 + 2.2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = rgba(rgb, 0.9);
    ctx.beginPath();
    ctx.arc(x, y, 10 * s, 0, TAU);
    ctx.fill();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    const s = scale;
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 22 * s, 22 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(flash ? WHT : IRON, 0.96);
    ctx.beginPath();
    ctx.ellipse(x, y, b.r * s, b.r * 0.72 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.ellipse(x, y - 6 * s, 18 * s, 10 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(x - 10 * s, y - 10 * s, 20 * s, 8 * s);
    if (b.kind === '砂颚') {
      ctx.fillStyle = rgba(RUST, 0.95);
      ctx.fillRect(x - 34 * s, y - 4 * s, 16 * s, 10 * s);
      ctx.fillRect(x + 18 * s, y - 4 * s, 16 * s, 10 * s);
    }
    if (b.kind === '闸卫') {
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect(x - 6 * s, y + 10 * s, 12 * s, 22 * s);
      ctx.fillRect(x - 28 * s, y - 16 * s, 10 * s, 8 * s);
      ctx.fillRect(x + 18 * s, y - 16 * s, 10 * s, 8 * s);
    }
    if (b.kind === '域心') {
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(x, y, (b.r + 8) * s, b.t, b.t + 2.4);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x, y, 8 * s, 0, TAU);
      ctx.fill();
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    if (s.kind === 'ball') {
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, (s.r || 5) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(x - 1.2 * scale, y - 1.4 * scale, (s.r || 5) * 0.4 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(s.rgb, 0.45);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, (s.r + 3) * scale, 0, TAU);
      ctx.stroke();
      return;
    }
    if (s.kind === 'lane') {
      ctx.fillStyle = rgba(s.rgb, 0.85);
      ctx.fillRect(x - 3 * scale, y - 8 * scale, 6 * scale, 16 * scale);
      return;
    }
    ctx.fillStyle = rgba(s.rgb, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, (s.r || 3) * scale, 0, TAU);
    ctx.fill();
  }

  function drawShocks() {
    let i;
    for (i = 0; i < G.shocks.length; i++) {
      const sh = G.shocks[i];
      const a = 1 - sh.t / sh.life;
      ctx.strokeStyle = rgba(GOLD, 0.35 + a * 0.5);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(sx(sh.x), sy(sh.y), sh.r * scale, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(HOT, 0.25 * a);
      ctx.beginPath();
      ctx.arc(sx(sh.x), sy(sh.y), (sh.r - 6) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawPickups() {
    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      const pulse = 0.75 + Math.sin(G.t * 8 + u.t) * 0.25;
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.beginPath();
      ctx.arc(sx(u.x), sy(u.y), 7 * pulse * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(sx(u.x), sy(u.y), 3 * scale, 0, TAU);
      ctx.fill();
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
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.name, x, y - 3 * scale);
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
    ctx.fillStyle = '#081208';
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
    drawShocks();

    let i;
    for (i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
    drawBoss();
    drawPickups();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0 && G.mode !== 'lose') {
      drawMech(G.player, {
        rgb: HOT,
        run: G.player.run,
        grounded: G.player.grounded,
        squash: G.player.squash,
        muzzle: G.muzzle > 0,
        blink: G.invuln > 0 && G.mode === 'play'
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

  function resetRun(kind) {
    G.kind = kind || 'zone';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.ball = 0;
    G.overdrive = 0;
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
    G.kind = G.kind === 'rain' ? 'rain' : 'zone';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.ball = 0;
    G.overdrive = 0;
    loadStage(1, true);
    seedEmbers();
    showOverlay('title', '外域', LEAD);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('zone');
      return;
    }
    startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('zone');
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
      keys.jump = down;
      if (down) jumpQueued = true;
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
      startGame('zone');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('rain');
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
    hold(el('btn-jump'), function () { keys.jump = true; jumpQueued = true; }, function () { keys.jump = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() && G.mode !== 'play') return;
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
    const up = function () {
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

  seedEmbers();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnZone) {
    btnZone.addEventListener('click', function () {
      audio.ensure();
      startGame('zone');
    });
  }
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
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
  if (modeZone) {
    modeZone.addEventListener('click', function () {
      audio.ensure();
      startGame('zone');
    });
  }
  if (modeRain) {
    modeRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
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
      keys.jump = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
