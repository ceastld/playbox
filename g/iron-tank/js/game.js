'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.44;
  const DRIVE = 220;
  const FIRE_CD = 0.075;
  const SHOT_SPD = 700;
  const MAX_PSHOT = 10;
  const SHELL_MAX = 9;
  const SHELL_START = 5;
  const SHELL_CD = 0.5;
  const INVULN = 1.24;
  const DIE_T = 0.88;
  const WALL_L = 40;
  const WALL_R = 440;
  const HIT_R = 14;
  const CARGO_MAX = 6;
  const MINE_W = 24;
  const BEST_KEY = 'playbox-iron-tank-best';
  const MUTE_KEY = 'playbox-iron-tank-mute';
  const OPS = '方向 / WASD 开 · 空格射击 · Shift / Z 开炮 · R 重开 · M 静音';
  const LEAD = '开铁坦往上突。机枪跟炮口，榴弹直线砸甲。碾步兵，撞坦克丢命。炸补给箱补弹升炮。短关之后是关底。';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 134, 20];
  const HOT2 = [255, 192, 112];
  const WHT = [255, 243, 228];
  const MUD = [168, 96, 48];
  const IRON = [56, 38, 24];
  const STL = [108, 78, 48];
  const DEEP = [20, 10, 4];
  const KHAKI = [196, 140, 68];
  const PINK = [255, 154, 180];
  const RUST = [140, 56, 24];
  const CONC = [92, 72, 52];

  const SCORE = {
    grunt: 80,
    runner: 120,
    tank: 260,
    bunker: 220,
    heli: 190,
    crate: 180,
    ammo: 360,
    ram: 160,
    boss: 3800,
    stage: 1400
  };

  const STAGES = [
    {
      name: '战壕',
      boss: '壕甲',
      hp: 62,
      theme: 'trench',
      waves: [
        { t: 0.45, kind: 'grunts', n: 5 },
        { t: 2.1, kind: 'tanks', n: 1 },
        { t: 3.7, kind: 'bunkers' },
        { t: 5.4, kind: 'crates' },
        { t: 7.0, kind: 'runners', n: 3 },
        { t: 8.8, kind: 'helis', n: 1 },
        { t: 10.6, kind: 'mix1' },
        { t: 13.0, kind: 'grunts', n: 6 },
        { t: 15.2, kind: 'tanks', n: 1 },
        { t: 17.8, kind: 'boss' }
      ]
    },
    {
      name: '雷区',
      boss: '雷舰',
      hp: 80,
      theme: 'mines',
      waves: [
        { t: 0.4, kind: 'grunts', n: 6 },
        { t: 1.8, kind: 'tanks', n: 1 },
        { t: 3.4, kind: 'bunkers' },
        { t: 5.0, kind: 'crates' },
        { t: 6.6, kind: 'helis', n: 2 },
        { t: 8.2, kind: 'runners', n: 4 },
        { t: 10.0, kind: 'mix2' },
        { t: 12.4, kind: 'tanks', n: 2 },
        { t: 14.6, kind: 'grunts', n: 7 },
        { t: 17.4, kind: 'boss' }
      ]
    },
    {
      name: '铁堡',
      boss: '铁司令',
      hp: 102,
      theme: 'keep',
      waves: [
        { t: 0.35, kind: 'grunts', n: 7 },
        { t: 1.5, kind: 'bunkers' },
        { t: 3.0, kind: 'crates' },
        { t: 4.6, kind: 'tanks', n: 2 },
        { t: 6.2, kind: 'helis', n: 2 },
        { t: 7.8, kind: 'runners', n: 5 },
        { t: 9.4, kind: 'mix3' },
        { t: 11.6, kind: 'bunkers' },
        { t: 13.4, kind: 'tanks', n: 2 },
        { t: 15.2, kind: 'grunts', n: 8 },
        { t: 17.2, kind: 'helis', n: 2 },
        { t: 19.4, kind: 'boss' }
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
  function lerpAng(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return a + d * t;
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
    if (G.boss && G.boss.active && !G.boss.dead) return isDense() ? 26 : 16;
    return isDense() ? 102 : 70;
  }
  function fireRate() {
    return isDense() ? 0.062 : FIRE_CD;
  }
  function eFireMul() {
    return isDense() ? 0.74 : 1;
  }
  function isCover(kind) {
    return kind === 'bunker';
  }
  function isRamable(kind) {
    return kind === 'grunt' || kind === 'runner' || kind === 'crate';
  }
  function isHostile(kind) {
    return kind !== 'ammo';
  }
  function hpOf(kind) {
    if (kind === 'bunker') return 8;
    if (kind === 'tank') return 5;
    if (kind === 'heli') return 3;
    if (kind === 'crate') return 4;
    return 1;
  }
  function rOf(kind) {
    if (kind === 'bunker') return 18;
    if (kind === 'tank') return 17;
    if (kind === 'heli') return 15;
    if (kind === 'crate') return 13;
    if (kind === 'ammo') return 11;
    return 11;
  }
  function scoreOf(kind) {
    return SCORE[kind] || 80;
  }
  function shellLevel() {
    if (G.cargo >= 4) return 2;
    if (G.cargo >= 2) return 1;
    return 0;
  }
  function shellName() {
    const lv = shellLevel();
    if (lv === 2) return '高爆';
    if (lv === 1) return '穿甲';
    return '榴弹';
  }
  function shellSpec() {
    const lv = shellLevel();
    if (lv === 2) return { spd: 520, r: 62, dmg: 6, home: 180, life: 1.05, pierce: 0 };
    if (lv === 1) return { spd: 640, r: 28, dmg: 5, home: 0, life: 0.88, pierce: 2 };
    return { spd: 480, r: 50, dmg: 3, home: 0, life: 0.78, pierce: 0 };
  }
  function themeOf() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    return spec.theme;
  }
  function mineX(y) {
    return VW * 0.5 + Math.sin((y + G.scroll) * 0.011) * 86;
  }
  function inMine(x, y) {
    if (themeOf() !== 'mines') return false;
    return Math.abs(x - mineX(y)) < MINE_W;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-iron-tank-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-iron-tank-mute') throw new Error('mute key');
    if (WALL_R - WALL_L < 300) throw new Error('corridor');
    if (FIRE_CD >= 0.1) throw new Error('fire cd');
    if (DRIVE < 180 || DRIVE > 240) throw new Error('drive');
    if (MINE_W < 18) throw new Error('mine');
    if (CARGO_MAX < 4) throw new Error('cargo');
    if (SHELL_START < 4) throw new Error('shell start');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[0].waves.length >= STAGES[2].waves.length) throw new Error('later denser');
    let i;
    for (i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      if (!s.name || !s.boss || !s.waves.length) throw new Error('stage ' + i);
      const last = s.waves[s.waves.length - 1];
      if (last.kind !== 'boss') throw new Error('boss last ' + s.name);
    }
    if (!isCover('bunker') || isCover('grunt')) throw new Error('cover rules');
    if (isHostile('ammo') || !isHostile('grunt')) throw new Error('ammo rules');
    if (!isRamable('grunt') || isRamable('tank')) throw new Error('ram rules');
    if (!isRamable('crate') || isRamable('bunker')) throw new Error('crate ram');
    G.kind = 'dense';
    G.stage = 1;
    if (spdMul() <= 1) throw new Error('dense faster');
    G.kind = 'raid';
    G.stage = 2;
    const later = spdMul();
    G.stage = 1;
    if (later <= spdMul()) throw new Error('later faster');
    G.cargo = 0;
    if (shellLevel() !== 0) throw new Error('shell0');
    G.cargo = 2;
    if (shellLevel() !== 1) throw new Error('shell1');
    G.cargo = 4;
    if (shellLevel() !== 2) throw new Error('shell2');
    G.cargo = 0;
    const ap = (function () {
      G.cargo = 2;
      const s = shellSpec();
      G.cargo = 0;
      return s;
    }());
    if (ap.pierce < 1) throw new Error('ap pierce');
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
      this.beep(980, 0.03, 'square', 0.032, 380);
      this.noise(0.014, 0.012, 1600);
    },
    shell() {
      this.ensure();
      this.beep(140, 0.12, 'sawtooth', 0.05, 48);
      this.beep(420, 0.08, 'square', 0.032, 140);
      this.noise(0.06, 0.04, 240);
    },
    pierce() {
      this.ensure();
      this.beep(520, 0.09, 'sawtooth', 0.042, 180);
      this.beep(1180, 0.07, 'triangle', 0.028, 620);
    },
    heat() {
      this.ensure();
      this.beep(280, 0.11, 'sawtooth', 0.044, 90);
      this.beep(760, 0.09, 'square', 0.03, 240);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.03, 0.028, 1100);
      this.beep(580 * lift, 0.05, 'square', 0.036, 960 * lift);
    },
    ram() {
      this.ensure();
      this.noise(0.09, 0.052, 220);
      this.beep(150, 0.12, 'sawtooth', 0.046, 55);
    },
    boom() {
      this.ensure();
      this.noise(0.18, 0.074, 180);
      this.beep(120, 0.22, 'sawtooth', 0.052, 36);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.06, 240);
      this.beep(220, 0.24, 'sawtooth', 0.05, 50);
      this.beep(100, 0.36, 'sine', 0.045, 32);
    },
    boss() {
      this.ensure();
      this.beep(90, 0.24, 'sawtooth', 0.06, 42);
      this.beep(260, 0.16, 'square', 0.04, 130);
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
      this.beep(200, 0.18, 'sawtooth', 0.045, 70);
      this.beep(118, 0.3, 'sine', 0.05, 40);
    },
    start() {
      this.ensure();
      this.beep(280, 0.08, 'square', 0.04, 560);
      this.beep(560, 0.12, 'triangle', 0.035, 840);
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
    pickup() {
      this.ensure();
      this.beep(480, 0.07, 'sine', 0.042, 720);
      this.beep(720, 0.12, 'triangle', 0.038, 1080);
    },
    mine() {
      this.ensure();
      this.noise(0.14, 0.055, 320);
      this.beep(160, 0.16, 'square', 0.04, 50);
    }
  };

  const G = {
    mode: 'title',
    kind: 'raid',
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
    shells: SHELL_START,
    cargo: 0,
    enemies: [],
    shots: [],
    shellsots: [],
    player: null,
    boss: null,
    fireCd: 0,
    shellCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    recoil: 0,
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
  const btnRaid = el('btn-raid');
  const btnDense = el('btn-dense');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const modeRaid = el('mode-raid');
  const modeDense = el('mode-dense');
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
  const shellLabel = el('shell-label');
  const crateLabel = el('crate-label');
  const bossWrap = el('boss-wrap');
  const bossName = el('boss-name');
  const bossBar = el('boss-bar');
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
  let shellQueued = false;

  const keys = { u: false, d: false, l: false, r: false, fire: false, shell: false };
  const demo = { u: false, d: false, l: false, r: false, fire: true, shell: false };
  const pointer = { down: false, x: VW * 0.5, y: VH - 140, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];
  const tracks = [];

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
  function shellHeld() {
    if (G.mode === 'title') return demo.shell;
    if (overlayBlocksPlay()) return false;
    return keys.shell || shellQueued;
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
      if (G.mode === 'title') stageLabel.textContent = '战壕';
      else if (G.boss && G.boss.active && !G.boss.dead) stageLabel.textContent = spec.boss;
      else stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '坦林' : '铁坦';
      tagLabel.classList.toggle('warn', isDense() || G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = shellName();
      gunLabel.classList.toggle('hot', shellLevel() === 1);
      gunLabel.classList.toggle('pierce', shellLevel() === 2);
    }
    if (shellLabel) {
      shellLabel.textContent = '弹 ' + G.shells;
      shellLabel.classList.toggle('low', G.shells <= 1);
    }
    if (crateLabel) {
      crateLabel.textContent = '箱 ' + G.cargo;
      crateLabel.classList.toggle('hot', G.cargo >= 2);
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
    else if (G.mode === 'lose') setHint('R 重开 · 碾步兵 · 炸箱补弹', 'warn');
    else if (G.mode === 'win') setHint('铁堡捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 别撞甲 · 别轧雷', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss + ' · 开炮砸甲', 'hot');
    else if (shellLevel() >= 2) setHint('高爆跟踪 · 继续炸箱', 'hot');
    else if (shellLevel() >= 1) setHint('穿甲就绪 · 再炸箱变高爆', 'hot');
    else if (G.shells <= 1) setHint('弹将尽 · 炸箱补弹', 'warn');
    else if (themeOf() === 'mines') setHint('别轧地雷 · 碾兵 · 炸箱', 'warn');
    else setHint('开铁坦碾兵 · 炸箱补弹 · 撞甲丢命', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'ITNK';
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

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 72; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.1),
        a: rand(0.12, 0.5),
        z: rand(0.35, 1.2),
        dust: Math.random() < 0.62
      });
    }
  }

  function spawnX() {
    if (themeOf() !== 'mines') return VW * 0.5;
    const mx = mineX(VH - 148);
    return mx >= VW * 0.5 ? WALL_L + 92 : WALL_R - 92;
  }

  function makePlayer() {
    return {
      x: spawnX(),
      y: VH - 148,
      vx: 0,
      vy: 0,
      heading: -Math.PI / 2,
      turret: -Math.PI / 2,
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
      vy: kind === 'grunt' ? 22 : kind === 'runner' ? 74 : 0,
      hp: Math.max(1, Math.round(hpOf(kind) * (kind === 'bunker' || kind === 'tank' || kind === 'heli' || kind === 'crate' ? hpMul() : 1))),
      r: rOf(kind),
      w: kind === 'bunker' ? 42 : kind === 'tank' ? 46 : kind === 'crate' ? 26 : 22,
      h: kind === 'bunker' ? 30 : kind === 'tank' ? 24 : kind === 'crate' ? 22 : 20,
      alive: true,
      t: 0,
      fire: rand(0.2, 0.9),
      flash: 0,
      score: scoreOf(kind),
      dir: extra && extra.dir != null ? extra.dir : (Math.random() < 0.5 ? -1 : 1),
      lane: extra && extra.lane != null ? extra.lane : 0,
      heading: extra && extra.heading != null ? extra.heading : 0
    };
    if (kind === 'tank') e.vx = e.dir * 78;
    if (kind === 'heli') e.vy = 34;
    return e;
  }

  function makeBoss(spec) {
    return {
      name: spec.boss,
      kind: spec.theme,
      x: VW * 0.5,
      y: -50,
      vx: 58,
      r: spec.theme === 'keep' ? 32 : 28,
      hp: Math.round(spec.hp * hpMul()),
      max: Math.round(spec.hp * hpMul()),
      active: false,
      dead: false,
      t: 0,
      fire: 0.6,
      flash: 0,
      state: 'idle',
      enter: 0
    };
  }

  function loadStage(n, attract) {
    G.stage = n;
    G.stageT = 0;
    G.waveI = 0;
    G.enemies.length = 0;
    G.shots.length = 0;
    G.shellsots.length = 0;
    G.scroll = 0;
    G.winT = 0;
    G.deadT = 0;
    G.fireCd = 0;
    G.shellCd = 0;
    G.muzzle = 0;
    G.recoil = 0;
    G.player = makePlayer();
    G.boss = makeBoss(STAGES[n - 1]);
    G.invuln = attract ? 0 : 0.8;
    tracks.length = 0;
    if (attract) {
      spawnEnemy(makeEnemy('grunt', 160, 90));
      spawnEnemy(makeEnemy('grunt', 320, 50));
      spawnEnemy(makeEnemy('bunker', 240, 170));
      spawnEnemy(makeEnemy('crate', 180, 120));
      spawnEnemy(makeEnemy('runner', 200, -10));
      spawnEnemy(makeEnemy('tank', 120, 110, { dir: 1 }));
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
    capArr(G.enemies, 52);
  }

  function spawnWave(w) {
    const lane = function (i, total) {
      const t = total <= 1 ? 0.5 : i / (total - 1);
      return lerp(WALL_L + 50, WALL_R - 50, t);
    };
    const extra = isDense() ? 2 : 0;
    let i;
    let n;
    if (w.kind === 'grunts') {
      n = (w.n || 5) + extra;
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('grunt', lane(i, n) + rand(-12, 12), -20 - i * 18));
      }
    } else if (w.kind === 'runners') {
      n = (w.n || 3) + (isDense() ? 1 : 0);
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('runner', lane(i, n), -16 - i * 22));
      }
    } else if (w.kind === 'bunkers') {
      const xs = isDense() ? [140, 240, 340] : [168, 312];
      for (i = 0; i < xs.length; i++) {
        spawnEnemy(makeEnemy('bunker', xs[i] + rand(-8, 8), 64 + i * 10));
      }
    } else if (w.kind === 'crates') {
      const xs = isDense() ? [150, 240, 330] : [200, 280];
      for (i = 0; i < xs.length; i++) {
        spawnEnemy(makeEnemy('crate', xs[i] + rand(-10, 10), 48 + i * 14));
      }
    } else if (w.kind === 'tanks') {
      n = w.n || 1;
      for (i = 0; i < n; i++) {
        const fromL = i % 2 === 0;
        spawnEnemy(makeEnemy('tank', fromL ? WALL_L + 44 : WALL_R - 44, 70 + i * 28, { dir: fromL ? 1 : -1 }));
      }
    } else if (w.kind === 'helis') {
      n = (w.n || 1) + (isDense() ? 1 : 0);
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('heli', lane(i, n), -30 - i * 26));
      }
    } else if (w.kind === 'mix1') {
      spawnEnemy(makeEnemy('bunker', 240, 80));
      spawnEnemy(makeEnemy('crate', 180, 50));
      spawnEnemy(makeEnemy('grunt', 150, -10));
      spawnEnemy(makeEnemy('grunt', 330, -10));
      spawnEnemy(makeEnemy('runner', 240, -40));
      spawnEnemy(makeEnemy('tank', WALL_L + 44, 120, { dir: 1 }));
    } else if (w.kind === 'mix2') {
      spawnEnemy(makeEnemy('bunker', 160, 70));
      spawnEnemy(makeEnemy('crate', 300, 40));
      spawnEnemy(makeEnemy('tank', WALL_R - 48, 90, { dir: -1 }));
      spawnEnemy(makeEnemy('heli', 300, -20));
      spawnEnemy(makeEnemy('runner', 200, -20));
      spawnEnemy(makeEnemy('runner', 280, -30));
    } else if (w.kind === 'mix3') {
      spawnEnemy(makeEnemy('bunker', 140, 60));
      spawnEnemy(makeEnemy('bunker', 240, 92));
      spawnEnemy(makeEnemy('bunker', 340, 60));
      spawnEnemy(makeEnemy('crate', 240, 40));
      spawnEnemy(makeEnemy('tank', WALL_L + 42, 130, { dir: 1 }));
      spawnEnemy(makeEnemy('heli', 200, 20));
      spawnEnemy(makeEnemy('runner', 300, -20));
    } else if (w.kind === 'boss') {
      activateBoss();
    }
  }

  function coverAt(x, y, skip) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isCover(e.kind) || e === skip) continue;
      if (Math.abs(x - e.x) < e.w * 0.5 && Math.abs(y - e.y) < e.h * 0.5) return e;
    }
    return null;
  }

  function resolveBunkerPush(p) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isCover(e.kind)) continue;
      const hx = e.w * 0.5 + p.r - 1;
      const hy = e.h * 0.5 + p.r - 1;
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
    capArr(G.shots, 90);
  }

  function enemyShoot(e, dx, dy, spd, kind) {
    const len = hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const oxp = isCover(e.kind) ? nx * (e.w * 0.55 + 6) : nx * ((e.r || 12) + 4);
    const oyp = isCover(e.kind) ? ny * (e.h * 0.55 + 6) : ny * ((e.r || 12) + 4);
    spawnShot({
      x: e.x + oxp,
      y: e.y + oyp,
      vx: nx * spd,
      vy: ny * spd,
      r: kind === 'heavy' ? 4.6 : 3.2,
      from: 'e',
      kind: kind || 'pellet',
      owner: e
    });
  }

  function turretVec(p) {
    return { x: Math.cos(p.turret), y: Math.sin(p.turret) };
  }

  function tryShoot() {
    if (G.fireCd > 0 || G.deadT > 0) return;
    if (countPShots() >= MAX_PSHOT) return;
    const p = G.player;
    const h = turretVec(p);
    spawnShot({
      x: p.x + h.x * 22,
      y: p.y + h.y * 22,
      vx: h.x * SHOT_SPD,
      vy: h.y * SHOT_SPD,
      r: 3.1,
      from: 'p',
      kind: 'mg',
      dmg: 1
    });
    G.fireCd = fireRate();
    G.muzzle = 0.05;
    audio.shot();
    emit(3, {
      x: p.x + h.x * 24, y: p.y + h.y * 24, j: 3,
      vx0: h.x * 40, vx1: h.x * 90, vy0: h.y * 40, vy1: h.y * 90,
      life: 0.12, r0: 1, r1: 2.2, rgb: GOLD, g: 40
    });
  }

  function tryShell() {
    shellQueued = false;
    if (G.shellCd > 0 || G.deadT > 0) return;
    if (G.shells <= 0) {
      G.shellCd = 0.55;
      if (playing()) toast('没弹了', true, false);
      return;
    }
    const p = G.player;
    const h = turretVec(p);
    const spec = shellSpec();
    const lv = shellLevel();
    if (playing()) G.shells -= 1;
    G.shellCd = SHELL_CD;
    G.recoil = 0.14;
    p.vx -= h.x * 110;
    p.vy -= h.y * 110;
    G.shellsots.push({
      x: p.x + h.x * 20,
      y: p.y + h.y * 20,
      vx: h.x * spec.spd,
      vy: h.y * spec.spd,
      from: 'p',
      kind: lv === 2 ? 'heat' : lv === 1 ? 'ap' : 'he',
      r: spec.r,
      dmg: spec.dmg,
      home: spec.home,
      life: spec.life,
      pierce: spec.pierce,
      t: 0,
      hit: []
    });
    capArr(G.shellsots, 6);
    if (lv === 2) audio.heat();
    else if (lv === 1) audio.pierce();
    else audio.shell();
    emit(8, {
      x: p.x + h.x * 22, y: p.y + h.y * 22, j: 6,
      vx0: -h.x * 40, vx1: h.x * 40, vy0: -h.y * 40, vy1: h.y * 40,
      life: 0.18, r0: 1.4, r1: 3.2, rgb: HOT, g: 60
    });
    kick(2.2, 'thump');
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.cargo = 0;
    if (why === 'mine') audio.mine();
    else audio.death();
    boomAt(G.player.x, G.player.y, 1.7, MAG);
    hitStop(0.074);
    kick(7.4, 'die');
    screenFlash(MAG, 0.55);
    syncHud();
    if (G.lives <= 0) {
      G.mode = 'lose';
      const map = {
        crash: '撞车了',
        shot: '中弹了',
        crush: '碾上了',
        mine: '轧雷了'
      };
      showOverlay('lose', map[G.why] || '车毁了', '命尽。R 立刻重开。碾步兵，别撞坦克。炸补给箱补弹升炮。');
      audio.lose();
    }
  }

  function respawn() {
    G.player = makePlayer();
    G.deadT = 0;
    G.invuln = INVULN;
    G.fireCd = 0.1;
    G.cargo = 0;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      if (G.shots[i].from === 'e') G.shots.splice(i, 1);
    }
    screenFlash(HOT, 0.22);
    syncHud();
  }

  function giveShells(n) {
    G.shells = clamp(G.shells + n, 0, SHELL_MAX);
    syncHud();
  }

  function spawnAmmo(x, y) {
    spawnEnemy(makeEnemy('ammo', x + rand(-8, 8), y + rand(-6, 8)));
  }

  function collectAmmo(e) {
    if (!e.alive) return;
    e.alive = false;
    if (!playing()) return;
    const prev = shellLevel();
    G.cargo = clamp(G.cargo + 1, 0, CARGO_MAX);
    giveShells(2);
    bumpCombo();
    addScore(SCORE.ammo * G.mult);
    audio.pickup();
    const now = shellLevel();
    if (now > prev) {
      toast('升炮 · ' + shellName(), false, true);
      floatText(e.x, e.y - 16, shellName(), CYN, true);
    } else {
      toast('补弹 +2', false, true);
      floatText(e.x, e.y - 14, '+弹', GOLD, true);
    }
    popSpark(e.x, e.y, GOLD, 22);
    kick(2.6, 'pickup');
    screenFlash(GOLD, 0.28);
  }

  function crackCrate(e) {
    if (!e.alive) return;
    e.alive = false;
    addScore((e.score || 180) * G.mult);
    boomAt(e.x, e.y, 1.05, GOLD);
    floatText(e.x, e.y - 10, '+' + ((e.score || 180) * G.mult), HOT, G.mult >= 2);
    spawnAmmo(e.x, e.y + 8);
    toast('箱开了', false, true);
  }

  function hurtEnemy(e, dmg, shot) {
    if (!e.alive) return;
    if (e.kind === 'ammo') {
      collectAmmo(e);
      return;
    }
    e.hp -= dmg;
    e.flash = 0.08;
    bumpCombo();
    audio.hit(G.combo);
    const shellHit = shot && (shot.kind === 'he' || shot.kind === 'ap' || shot.kind === 'heat');
    hitStop(shellHit ? 0.054 : 0.034);
    kick(shellHit ? 2.9 : 1.8, 'hit');
    emit(6, {
      x: e.x, y: e.y, j: 5,
      vx0: -120, vx1: 120, vy0: -140, vy1: 40,
      life: 0.22, r0: 1.1, r1: 2.6,
      rgb: shellHit ? GOLD : HOT, g: 160
    });
    if (e.hp <= 0) {
      if (e.kind === 'crate') {
        crackCrate(e);
        return;
      }
      e.alive = false;
      addScore((e.score || 80) * G.mult);
      const heavy = e.kind === 'bunker' || e.kind === 'tank' || e.kind === 'heli';
      boomAt(e.x, e.y, heavy ? 1.25 : 0.7, e.kind === 'bunker' ? CONC : HOT);
      floatText(e.x, e.y - 10, '+' + ((e.score || 80) * G.mult), HOT, G.mult >= 2);
      if (e.kind === 'bunker') toast('碉堡砸穿', false, true);
    }
  }

  function ramEnemy(e) {
    if (!e.alive) return;
    if (e.kind === 'crate') {
      bumpCombo();
      audio.ram();
      hitStop(0.046);
      kick(3.2, 'thump');
      crackCrate(e);
      floatText(e.x, e.y - 12, '碾箱', GOLD, true);
      return;
    }
    e.alive = false;
    if (!playing()) return;
    bumpCombo();
    audio.ram();
    hitStop(0.046);
    kick(3.2, 'thump');
    const pts = SCORE.ram * G.mult;
    addScore(pts);
    boomAt(e.x, e.y, 0.85, GOLD);
    floatText(e.x, e.y - 12, '碾', GOLD, true);
    emit(10, {
      x: e.x, y: e.y, j: 8,
      vx0: -180, vx1: 180, vy0: -160, vy1: 60,
      life: 0.28, r0: 1.2, r1: 3, rgb: GOLD, g: 180
    });
  }

  function hurtBoss(dmg, shot) {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const boom = shot && shot.kind !== 'mg';
    b.hp -= boom ? dmg + 2 : dmg;
    b.flash = 0.09;
    bumpCombo();
    audio.hit(G.combo);
    hitStop(boom ? 0.06 : 0.048);
    kick(3.2, 'hit');
    emit(8, {
      x: b.x, y: b.y, j: 10,
      vx0: -160, vx1: 160, vy0: -120, vy1: 80,
      life: 0.24, r0: 1.2, r1: 3, rgb: GOLD, g: 80
    });
    syncHud();
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      addScore(SCORE.boss * G.mult);
      addScore(SCORE.stage * G.stage * G.mult);
      boomAt(b.x, b.y, 2.5, GOLD);
      audio.boom();
      hitStop(0.082);
      kick(6.6, 'boom');
      screenFlash(GOLD, 0.5);
      toast(b.name + ' 击破', false, true);
      G.winT = 1.35;
      giveShells(2);
    }
  }

  function explodeShell(n) {
    audio.boom();
    const heat = n.kind === 'heat';
    const ap = n.kind === 'ap';
    boomAt(n.x, n.y, heat ? 1.6 : ap ? 0.9 : 1.35, heat ? CYN : GOLD);
    hitStop(0.05);
    floatText(n.x, n.y - 8, heat ? '爆' : ap ? '穿' : '炮', heat ? CYN : GOLD, true);
    if (ap) return;
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (n.hit.indexOf(e) >= 0) continue;
      if (hypot(e.x - n.x, e.y - n.y) <= n.r + e.r) {
        if (e.kind === 'ammo') collectAmmo(e);
        else hurtEnemy(e, n.dmg, n);
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead && n.hit.indexOf(b) < 0 && hypot(b.x - n.x, b.y - n.y) <= n.r + b.r) {
      hurtBoss(n.dmg, n);
    }
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      G.mode = 'win';
      const bonus = isDense() ? 10000 : 8000;
      addScore(bonus);
      audio.win();
      kick(4, 'win-flash');
      showOverlay(
        'win',
        isDense() ? '坦林通关' : '铁堡捣毁了',
        '最高连击 ×' + G.maxCombo + ' · 再加 ' + bonus
      );
      syncHud();
      return;
    }
    G.stage += 1;
    const keepShells = G.shells;
    const keepCargo = G.cargo;
    loadStage(G.stage, false);
    G.shells = keepShells;
    G.cargo = keepCargo;
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
    demo.u = p.y > VH - 210;
    demo.d = p.y < VH - 300;
    const sway = Math.sin(G.clock * 0.8);
    demo.l = sway > 0.16;
    demo.r = sway < -0.16;
    if (themeOf() === 'mines' && inMine(p.x - 20, p.y)) {
      demo.l = false;
      demo.r = true;
    }
    demo.shell = false;
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (isCover(e.kind) || e.kind === 'tank' || e.kind === 'crate') {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        if (dy > -120 && dy < 24 && Math.abs(dx) < 86) demo.shell = true;
      }
    }
    if (liveEnemies() < 3) {
      spawnEnemy(makeEnemy('grunt', rand(WALL_L + 50, WALL_R - 50), -20));
    }
  }

  function nearestHeavy(x, y) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.kind !== 'tank' && e.kind !== 'bunker' && e.kind !== 'heli') continue;
      const d = hypot(e.x - x, e.y - y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead) {
      const d = hypot(b.x - x, b.y - y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0 && G.lives > 0 && playing()) respawn();
      return;
    }
    if (G.mode !== 'play' && G.mode !== 'title') return;
    const p = G.player;
    if (!p) return;
    let ix = 0;
    let iy = 0;
    if (inL()) ix -= 1;
    if (inR()) ix += 1;
    if (inU()) iy -= 1;
    if (inD()) iy += 1;
    if (pointer.down && playing() && !overlayBlocksPlay()) {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      if (hypot(dx, dy) > 12) {
        ix = dx;
        iy = dy;
      }
    }
    const len = hypot(ix, iy);
    const spd = DRIVE * (isDense() ? 1.08 : 1);
    let tx = 0;
    let ty = 0;
    if (len > 0.001) {
      tx = (ix / len) * spd;
      ty = (iy / len) * spd;
      p.heading = Math.atan2(iy, ix);
      p.run += dt * 14;
    } else {
      p.run += dt * 3.5;
    }
    const follow = 1 - Math.pow(0.0008, dt);
    p.turret = lerpAng(p.turret, p.heading, follow);
    const slide = 1 - Math.pow(0.0006, dt);
    p.vx = lerp(p.vx, tx, slide);
    p.vy = lerp(p.vy, ty, slide);
    p.x = clamp(p.x + p.vx * dt, WALL_L + 20, WALL_R - 20);
    p.y = clamp(p.y + p.vy * dt, 86, 664);
    resolveBunkerPush(p);
    p.x = clamp(p.x, WALL_L + 20, WALL_R - 20);
    p.y = clamp(p.y, 86, 664);

    if (hypot(p.vx, p.vy) > 36 && !REDUCE) {
      tracks.push({ x: p.x, y: p.y, a: p.heading, t: 0 });
      capArr(tracks, 56);
      if (((G.t * 18) | 0) !== (((G.t - dt) * 18) | 0)) {
        emit(1, {
          x: p.x - Math.cos(p.heading) * 16,
          y: p.y - Math.sin(p.heading) * 16,
          j: 4,
          vx0: -16, vx1: 16, vy0: 8, vy1: 36,
          life: 0.24, r0: 1.4, r1: 2.6, rgb: MUD, g: 30
        });
      }
    }

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.shellCd > 0) G.shellCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.recoil > 0) G.recoil -= dt;
    if (fireHeld()) tryShoot();
    if (shellHeld()) tryShell();

    if (G.invuln > 0 || G.mode === 'title') return;
    if (inMine(p.x, p.y)) {
      die('mine');
      return;
    }
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.kind === 'ammo') {
        if (hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 2) collectAmmo(e);
        continue;
      }
      if (isCover(e.kind)) continue;
      if (hypot(e.x - p.x, e.y - p.y) < e.r + p.r - 2) {
        if (isRamable(e.kind)) ramEnemy(e);
        else die(e.kind === 'tank' ? 'crush' : 'crash');
        return;
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead && hypot(b.x - p.x, b.y - p.y) < b.r + p.r - 2) {
      die('crash');
    }
  }

  function updateEnemy(e, dt) {
    if (!e.alive) {
      if (e.flash > 0) e.flash -= dt;
      return;
    }
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    const p = G.player;
    const scr = scrollSpd();

    if (e.kind === 'grunt') {
      e.y += (e.vy + scr) * dt;
      e.x += Math.sin(e.t * 2.2 + e.lane) * 18 * dt;
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0) {
        e.fire = (1.22 + Math.random() * 0.55) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 200, 'pellet');
      }
    } else if (e.kind === 'runner') {
      if (p) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const len = hypot(dx, dy) || 1;
        e.x += (dx / len) * 110 * spdMul() * 0.5 * dt;
        e.y += (dy / len) * 122 * dt + scr * 0.35 * dt;
      } else {
        e.y += (88 + scr) * dt;
      }
    } else if (e.kind === 'bunker') {
      e.y += scr * dt;
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0) {
        e.fire = (1.0 + Math.random() * 0.4) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 230, 'pellet');
      }
    } else if (e.kind === 'tank') {
      e.x += e.vx * dt;
      e.y += scr * 0.4 * dt;
      if (e.x < WALL_L + 34 || e.x > WALL_R - 34) e.vx *= -1;
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0) {
        e.fire = (0.7 + Math.random() * 0.28) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 242, 'pellet');
        enemyShoot(e, p.x - e.x + 30, p.y - e.y, 242, 'pellet');
      }
    } else if (e.kind === 'heli') {
      e.y += (e.vy + scr * 0.32) * dt;
      e.x += Math.sin(e.t * 1.8 + e.lane) * 68 * dt;
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0) {
        e.fire = (0.84 + Math.random() * 0.34) * eFireMul();
        enemyShoot(e, 0.16, 1, 216, 'pellet');
        enemyShoot(e, -0.16, 1, 216, 'pellet');
      }
    } else if (e.kind === 'crate') {
      e.y += scr * dt;
    } else if (e.kind === 'ammo') {
      e.y += scr * 0.5 * dt;
      if (p && G.deadT <= 0) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const len = hypot(dx, dy) || 1;
        e.x += (dx / len) * 108 * dt;
        e.y += (dy / len) * 108 * dt;
      }
    }

    e.x = clamp(e.x, WALL_L + 16, WALL_R - 16);
    if (e.y > VH + 56) e.alive = false;
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.t += dt;
    if (b.flash > 0) b.flash -= dt;
    const p = G.player;
    if (b.state === 'enter') {
      b.enter -= dt;
      b.y = lerp(b.y, 118, 1 - Math.pow(0.002, dt));
      if (b.enter <= 0) b.state = 'fight';
      return;
    }
    b.y = lerp(b.y, 118 + Math.sin(b.t * 1.4) * 18, 0.08);
    if (b.kind === 'trench') {
      b.x += b.vx * dt;
      if (b.x < WALL_L + 52 || b.x > WALL_R - 52) b.vx *= -1;
    } else if (b.kind === 'mines') {
      b.x = lerp(b.x, mineX(b.y), 0.055);
      b.x = clamp(b.x, WALL_L + 52, WALL_R - 52);
    } else {
      b.x = VW * 0.5 + Math.sin(b.t * 1.02) * 138;
      b.y = 128 + Math.cos(b.t * 0.78) * 34;
    }
    b.x = clamp(b.x, WALL_L + 42, WALL_R - 42);
    b.fire -= dt;
    if (b.fire > 0 || !p || G.deadT > 0) return;
    const low = b.hp / b.max < 0.42;
    if (b.kind === 'trench') {
      b.fire = (low ? 0.5 : 0.78) * eFireMul();
      enemyShoot(b, -0.4, 1, 222, 'pellet');
      enemyShoot(b, 0, 1, 246, 'pellet');
      enemyShoot(b, 0.4, 1, 222, 'pellet');
      if (low) enemyShoot(b, p.x - b.x, p.y - b.y, 268, 'heavy');
    } else if (b.kind === 'mines') {
      b.fire = (low ? 0.44 : 0.66) * eFireMul();
      enemyShoot(b, p.x - b.x, p.y - b.y, 282, 'heavy');
      if (low) {
        enemyShoot(b, p.x - b.x - 48, p.y - b.y, 246, 'pellet');
        enemyShoot(b, p.x - b.x + 48, p.y - b.y, 246, 'pellet');
      }
    } else {
      b.fire = (low ? 0.38 : 0.6) * eFireMul();
      const n = low ? 8 : 5;
      for (let i = 0; i < n; i++) {
        const a = -1.2 + (i / (n - 1)) * 2.4;
        enemyShoot(b, Math.sin(a), Math.cos(a), 232, i % 2 ? 'heavy' : 'pellet');
      }
      if (low && liveEnemies() < 6) {
        spawnEnemy(makeEnemy('tank', b.x + rand(-40, 40), b.y + 36, { dir: Math.random() < 0.5 ? 1 : -1 }));
      }
    }
  }

  function updateShots(dt) {
    let i;
    for (i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < -20 || s.x > VW + 20 || s.y < -30 || s.y > VH + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      const cov = coverAt(s.x, s.y, s.owner);
      if (cov) {
        if (s.from === 'p') hurtEnemy(cov, s.dmg || 1, s);
        G.shots.splice(i, 1);
        emit(3, {
          x: s.x, y: s.y, j: 3,
          vx0: -40, vx1: 40, vy0: -50, vy1: 20,
          life: 0.14, r0: 1, r1: 2, rgb: CONC, g: 80
        });
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive || isCover(e.kind)) continue;
          if (hypot(e.x - s.x, e.y - s.y) < e.r + s.r) {
            hurtEnemy(e, s.dmg || 1, s);
            hit = true;
            break;
          }
        }
        if (!hit && G.boss && G.boss.active && !G.boss.dead) {
          if (hypot(G.boss.x - s.x, G.boss.y - s.y) < G.boss.r + s.r) {
            hurtBoss(s.dmg || 1, s);
            hit = true;
          }
        }
        if (hit) {
          G.shots.splice(i, 1);
          continue;
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.player) {
        const p = G.player;
        if (hypot(p.x - s.x, p.y - s.y) < p.r + s.r - 1) {
          G.shots.splice(i, 1);
          die('shot');
          continue;
        }
      }
    }
  }

  function updateShells(dt) {
    let i;
    for (i = G.shellsots.length - 1; i >= 0; i--) {
      const n = G.shellsots[i];
      n.t += dt;
      if (n.home > 0) {
        const tgt = nearestHeavy(n.x, n.y);
        if (tgt) {
          const dx = tgt.x - n.x;
          const dy = tgt.y - n.y;
          const len = hypot(dx, dy) || 1;
          n.vx += (dx / len) * n.home * dt;
          n.vy += (dy / len) * n.home * dt;
          const spd = hypot(n.vx, n.vy) || 1;
          const cap = 520;
          n.vx = n.vx / spd * cap;
          n.vy = n.vy / spd * cap;
        }
      }
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.x = clamp(n.x, WALL_L + 8, WALL_R - 8);
      let pop = n.t >= n.life || n.y < -24 || n.y > VH + 24;
      let pierceNow = false;
      if (!pop) {
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive || e.kind === 'ammo') continue;
          if (n.hit.indexOf(e) >= 0) continue;
          if (hypot(e.x - n.x, e.y - n.y) < e.r + 12) {
            n.hit.push(e);
            hurtEnemy(e, n.dmg, n);
            if (n.pierce > 0) {
              n.pierce -= 1;
              n.dmg = Math.max(2, n.dmg - 1);
              pierceNow = true;
              emit(5, {
                x: n.x, y: n.y, j: 4,
                vx0: -80, vx1: 80, vy0: -90, vy1: 30,
                life: 0.16, r0: 1, r1: 2.4, rgb: CYN, g: 40
              });
            } else {
              pop = true;
            }
            break;
          }
        }
        if (!pop && !pierceNow && G.boss && G.boss.active && !G.boss.dead) {
          if (n.hit.indexOf(G.boss) < 0 && hypot(G.boss.x - n.x, G.boss.y - n.y) < G.boss.r + 12) {
            n.hit.push(G.boss);
            hurtBoss(n.dmg, n);
            if (n.pierce > 0) {
              n.pierce -= 1;
              pierceNow = true;
            } else {
              pop = true;
            }
          }
        }
      }
      if (pop) {
        explodeShell(n);
        G.shellsots.splice(i, 1);
      }
    }
  }

  function updateWaves(dt) {
    if (G.boss && G.boss.active) return;
    if (G.winT > 0) return;
    G.stageT += dt;
    const spec = STAGES[G.stage - 1];
    while (G.waveI < spec.waves.length && G.stageT >= spec.waves[G.waveI].t) {
      spawnWave(spec.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.35);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.toastT > 0) G.toastT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.invuln > 0) G.invuln -= dt;
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += (p.g || 280) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
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
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = tracks.length - 1; i >= 0; i--) {
      tracks[i].t += dt;
      tracks[i].y += scrollSpd() * dt;
      if (tracks[i].t > 0.62 || tracks[i].y > VH + 10) tracks.splice(i, 1);
    }
    const scr = scrollSpd();
    for (i = 0; i < embers.length; i++) {
      const em = embers[i];
      em.y += scr * em.z * dt;
      if (em.y > VH + 8) {
        em.y = -8;
        em.x = Math.random() * VW;
      }
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') demoThink();
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    G.scroll += scrollSpd() * dt;
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.enemies.length; i++) updateEnemy(G.enemies[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateShells(dt);
    if (playing() || G.mode === 'title') updateWaves(dt);
    if (G.winT > 0 && playing()) {
      G.winT -= dt;
      if (G.winT <= 0) nextStage();
    }
    updateFx(dt);
    G.enemies = G.enemies.filter(function (e) { return e.alive || e.flash > 0; });
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const theme = themeOf();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (theme === 'mines') {
      g.addColorStop(0, '#1a1006');
      g.addColorStop(0.5, '#120c06');
      g.addColorStop(1, '#0c0804');
    } else if (theme === 'keep') {
      g.addColorStop(0, '#1c0c08');
      g.addColorStop(0.45, '#140804');
      g.addColorStop(1, '#0e0604');
    } else {
      g.addColorStop(0, '#261408');
      g.addColorStop(0.55, '#180c06');
      g.addColorStop(1, '#100804');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawBackdrop() {
    const theme = themeOf();
    const par = G.scroll;
    let i;
    ctx.fillStyle = theme === 'keep'
      ? 'rgba(48, 22, 12, 0.96)'
      : theme === 'mines'
        ? 'rgba(36, 24, 10, 0.94)'
        : 'rgba(62, 30, 12, 0.95)';
    ctx.fillRect(ox, oy, WALL_L * scale, VH * scale);
    ctx.fillRect(sx(WALL_R), oy, (VW - WALL_R) * scale, VH * scale);
    ctx.fillStyle = rgba(HOT, 0.22);
    ctx.fillRect(sx(WALL_L - 3), oy, 3 * scale, VH * scale);
    ctx.fillRect(sx(WALL_R), oy, 3 * scale, VH * scale);

    for (i = 0; i < 16; i++) {
      const hsh = hash2(i * 19 + G.stage * 7);
      const yy = ((i * 86 - par * 0.55) % (VH + 80)) - 20;
      const h = 40 + hsh * 110;
      ctx.fillStyle = theme === 'keep'
        ? 'rgba(78, 34, 16, 0.52)'
        : theme === 'mines'
          ? 'rgba(58, 38, 12, 0.44)'
          : 'rgba(96, 44, 14, 0.48)';
      ctx.fillRect(ox, sy(yy), WALL_L * scale, h * scale);
      ctx.fillRect(sx(WALL_R), sy(yy + 16), (VW - WALL_R) * scale, h * 0.8 * scale);
      ctx.fillStyle = rgba(RUST, 0.5);
      ctx.beginPath();
      ctx.moveTo(sx(8 + hsh * 10), sy(yy));
      ctx.lineTo(sx(24), sy(yy + h * 0.5));
      ctx.lineTo(sx(6), sy(yy + h));
      ctx.fill();
    }

    if (theme === 'mines') {
      for (i = 0; i < 18; i++) {
        const y = ((i * 46 - par * 0.9) % (VH + 40)) - 16;
        const mx = mineX(y);
        ctx.fillStyle = 'rgba(40, 12, 10, 0.55)';
        ctx.beginPath();
        ctx.ellipse(sx(mx), sy(y), MINE_W * scale, 20 * scale, 0, 0, TAU);
        ctx.fill();
        const pulse = 0.45 + Math.sin(G.t * 8 + i) * 0.25;
        ctx.fillStyle = rgba(MAG, 0.28 * pulse);
        ctx.beginPath();
        ctx.arc(sx(mx), sy(y), 7 * scale, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(MAG, 0.55 * pulse);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.arc(sx(mx), sy(y), 5.5 * scale, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = rgba(GOLD, 0.7 * pulse);
        ctx.beginPath();
        ctx.arc(sx(mx), sy(y), 1.6 * scale, 0, TAU);
        ctx.fill();
      }
    }
    if (theme === 'keep') {
      for (i = 0; i < 8; i++) {
        const hsh = hash2(i * 11 + 3);
        const y = ((i * 110 - par * 0.4) % (VH + 60)) - 20;
        ctx.fillStyle = 'rgba(255, 134, 20, 0.08)';
        ctx.fillRect(sx(WALL_L + 18 + hsh * 40), sy(y), 10 * scale, 46 * scale);
      }
    }
    if (theme === 'trench') {
      for (i = 0; i < 10; i++) {
        const hsh = hash2(i * 13 + 5);
        const y = ((i * 92 - par * 0.62) % (VH + 50)) - 16;
        ctx.fillStyle = 'rgba(120, 70, 28, 0.28)';
        ctx.fillRect(sx(WALL_L + 16 + hsh * 28), sy(y), 22 * scale, 8 * scale);
      }
    }

    ctx.strokeStyle = rgba(HOT, theme === 'keep' ? 0.14 : 0.08);
    ctx.lineWidth = 1;
    for (i = 0; i < 10; i++) {
      const y = ((i * 86 - par * 0.8) % (VH + 40)) - 10;
      ctx.beginPath();
      ctx.moveTo(sx(WALL_L), sy(y));
      ctx.lineTo(sx(WALL_R), sy(y));
      ctx.stroke();
    }

    for (i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      const a = 1 - tr.t / 0.62;
      const px = Math.cos(tr.a + Math.PI / 2);
      const py = Math.sin(tr.a + Math.PI / 2);
      ctx.strokeStyle = rgba(DEEP, 0.34 * a);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(tr.x + px * 8), sy(tr.y + py * 8));
      ctx.lineTo(sx(tr.x + px * 8 - Math.cos(tr.a) * 7), sy(tr.y + py * 8 - Math.sin(tr.a) * 7));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx(tr.x - px * 8), sy(tr.y - py * 8));
      ctx.lineTo(sx(tr.x - px * 8 - Math.cos(tr.a) * 7), sy(tr.y - py * 8 - Math.sin(tr.a) * 7));
      ctx.stroke();
    }

    for (i = 0; i < embers.length; i++) {
      const em = embers[i];
      if (em.dust) {
        ctx.fillStyle = rgba(MUD, 0.16 * em.a);
        ctx.fillRect(sx(em.x), sy(em.y), (2 + em.s) * scale, em.s * scale);
      } else {
        ctx.fillStyle = rgba(HOT2, em.a * 0.4);
        ctx.fillRect(sx(em.x), sy(em.y), em.s * scale, em.s * scale);
      }
    }
  }

  function drawTank(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    const rec = G.recoil > 0 ? 3.2 * s : 0;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 6 * s, 16 * s, 8 * s, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.rotate(p.heading + Math.PI / 2);
    ctx.fillStyle = rgba(IRON, 0.96);
    ctx.fillRect(-15 * s, -16 * s, 6 * s, 32 * s);
    ctx.fillRect(9 * s, -16 * s, 6 * s, 32 * s);
    const tread = ((p.run * 6) | 0) % 6;
    ctx.fillStyle = rgba(DEEP, 0.7);
    for (let k = 0; k < 5; k++) {
      const yy = (-14 + ((k * 6 + tread) % 30)) * s;
      ctx.fillRect(-14.2 * s, yy, 4.4 * s, 2.2 * s);
      ctx.fillRect(9.8 * s, yy, 4.4 * s, 2.2 * s);
    }
    ctx.fillStyle = rgba(opt.body || HOT, 0.96);
    ctx.fillRect(-10 * s, -15 * s, 20 * s, 30 * s);
    ctx.fillStyle = rgba(opt.cab || GOLD, 0.88);
    ctx.fillRect(-7 * s, -6 * s, 14 * s, 10 * s);
    ctx.fillStyle = rgba(CYN, 0.8);
    ctx.fillRect(-5 * s, 8 * s, 3.2 * s, 2.4 * s);
    ctx.fillRect(1.8 * s, 8 * s, 3.2 * s, 2.4 * s);
    ctx.restore();

    ctx.save();
    ctx.rotate(p.turret + Math.PI / 2);
    ctx.translate(0, rec);
    ctx.fillStyle = rgba(STL, 0.96);
    ctx.beginPath();
    ctx.arc(0, 0, 7.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 4.4 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.fillRect(-2.1 * s, -24 * s, 4.2 * s, 20 * s);
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(-2.6 * s, -26 * s, 5.2 * s, 3.2 * s);
    if (opt.muzzle) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(0, -27 * s, 5.4 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawEnemy(e) {
    if (!e.alive && e.flash <= 0) return;
    const s = scale;
    const x = sx(e.x);
    const y = sy(e.y);
    const flash = e.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y + 8 * s, 8 * s, 3 * s, 0, 0, TAU);
    ctx.fill();

    if (e.kind === 'bunker') {
      ctx.fillStyle = rgba(flash ? WHT : CONC, 0.96);
      ctx.fillRect(x - 21 * s, y - 15 * s, 42 * s, 30 * s);
      ctx.fillStyle = rgba(RUST, 0.9);
      ctx.fillRect(x - 21 * s, y - 15 * s, 42 * s, 6 * s);
      ctx.fillStyle = rgba(DEEP, 0.92);
      ctx.fillRect(x - 10 * s, y - 4 * s, 20 * s, 7 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(x - 7 * s, y - 2 * s, 14 * s, 3 * s);
      return;
    }
    if (e.kind === 'tank') {
      ctx.fillStyle = rgba(flash ? WHT : STL, 0.96);
      ctx.fillRect(x - 22 * s, y - 11 * s, 44 * s, 22 * s);
      ctx.fillStyle = rgba(MAG, 0.78);
      ctx.fillRect(x - 8 * s, y - 17 * s, 16 * s, 8 * s);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(x - 6 * s, y - 14 * s, 12 * s, 3 * s);
      ctx.fillStyle = rgba(IRON, 0.9);
      ctx.fillRect(x - 22 * s, y - 9 * s, 5 * s, 18 * s);
      ctx.fillRect(x + 17 * s, y - 9 * s, 5 * s, 18 * s);
      return;
    }
    if (e.kind === 'heli') {
      ctx.fillStyle = rgba(flash ? WHT : IRON, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 16 * s, 7 * s, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.6 * s;
      const spin = G.t * 18;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(spin) * 18 * s, y + Math.sin(spin) * 4 * s);
      ctx.lineTo(x - Math.cos(spin) * 18 * s, y - Math.sin(spin) * 4 * s);
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(x - 3 * s, y - 2 * s, 6 * s, 3 * s);
      return;
    }
    if (e.kind === 'crate') {
      ctx.fillStyle = rgba(flash ? WHT : KHAKI, 0.96);
      ctx.fillRect(x - 12 * s, y - 11 * s, 24 * s, 22 * s);
      ctx.strokeStyle = rgba(RUST, 0.85);
      ctx.lineWidth = 1.6 * s;
      ctx.strokeRect(x - 12 * s, y - 11 * s, 24 * s, 22 * s);
      ctx.beginPath();
      ctx.moveTo(x - 12 * s, y);
      ctx.lineTo(x + 12 * s, y);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.font = 'bold ' + (10 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('弹', x, y);
      return;
    }
    if (e.kind === 'ammo') {
      const pulse = 0.55 + Math.sin(G.t * 7) * 0.25;
      ctx.fillStyle = rgba(GOLD, 0.2 * pulse);
      ctx.beginPath();
      ctx.arc(x, y, 13 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(flash ? WHT : HOT, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 7 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('弹', x, y);
      return;
    }
    if (e.kind === 'runner') {
      ctx.fillStyle = rgba(flash ? WHT : MAG, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y, 8 * s, 10 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(x - 4 * s, y - 8 * s, 8 * s, 3 * s);
      return;
    }
    ctx.fillStyle = rgba(flash ? WHT : KHAKI, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y, 8 * s, 9 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.arc(x, y - 7 * s, 5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.fillRect(x - 3 * s, y - 2 * s, 6 * s, 2 * s);
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    const s = scale;
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x, y + 22 * s, 24 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(flash ? WHT : IRON, 0.96);
    ctx.beginPath();
    ctx.ellipse(x, y, b.r * s, b.r * 0.7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.88);
    ctx.fillRect(x - 18 * s, y - 10 * s, 36 * s, 16 * s);
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(x - 10 * s, y - 6 * s, 20 * s, 5 * s);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(x - 2.4 * s, y - 28 * s, 4.8 * s, 20 * s);
    ctx.fillStyle = rgba(STL, 0.9);
    ctx.fillRect(x - 22 * s, y + 4 * s, 8 * s, 14 * s);
    ctx.fillRect(x + 14 * s, y + 4 * s, 8 * s, 14 * s);
    if (b.kind === 'keep') {
      ctx.strokeStyle = rgba(MAG, 0.7);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(x, y, (b.r + 6) * s, 0, TAU);
      ctx.stroke();
    }
    if (b.kind === 'mines') {
      ctx.fillStyle = rgba(MAG, 0.45);
      ctx.beginPath();
      ctx.arc(x, y + 14 * s, 6 * s, 0, TAU);
      ctx.fill();
    }
  }

  function drawShot(s) {
    const rad = s.r * scale;
    ctx.fillStyle = s.from === 'p'
      ? rgba(GOLD, 0.95)
      : rgba(s.kind === 'heavy' ? MAG : PINK, 0.92);
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y), rad + 0.6 * scale, 0, TAU);
    ctx.fill();
    if (s.from === 'p') {
      ctx.strokeStyle = rgba(WHT, 0.45);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x - s.vx * 0.012), sy(s.y - s.vy * 0.012));
      ctx.lineTo(sx(s.x), sy(s.y));
      ctx.stroke();
    }
  }

  function drawShells() {
    for (let i = 0; i < G.shellsots.length; i++) {
      const n = G.shellsots[i];
      const heat = n.kind === 'heat';
      const ap = n.kind === 'ap';
      const rgb = heat ? CYN : ap ? WHT : GOLD;
      const ang = Math.atan2(n.vy, n.vx);
      ctx.save();
      ctx.translate(sx(n.x), sy(n.y));
      ctx.rotate(ang);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(-4 * scale, 4 * scale, 6 * scale, 2.4 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(rgb, 0.55);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.moveTo(-14 * scale, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = rgba(rgb, 0.96);
      ctx.beginPath();
      ctx.ellipse(0, 0, (ap ? 8 : 6.4) * scale, 2.8 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.92);
      ctx.beginPath();
      ctx.arc(-5 * scale, 0, 2.2 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFx() {
    let i;
    let o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const a = 1 - o.t / 0.42;
      ctx.strokeStyle = rgba(o.rgb, a * 0.8);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + o.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      const a = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(WHT, a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * (1 - o.t / 0.28) * 0.4) * scale, 0, TAU);
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
    ctx.fillStyle = '#180c04';
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

    let i;
    for (i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawShells();

    if (G.player && G.deadT <= 0 && G.mode !== 'lose') {
      drawTank(G.player, {
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

  function resetRun(kind) {
    G.kind = kind || 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.shells = isDense() ? 4 : SHELL_START;
    G.cargo = 0;
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
    G.shells = SHELL_START;
    G.cargo = 0;
    loadStage(1, true);
    seedEmbers();
    showOverlay('title', '铁坦', LEAD);
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
      keys.shell = down;
      if (down) shellQueued = true;
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
    hold(el('btn-shell'), function () { keys.shell = true; shellQueued = true; }, function () { keys.shell = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() && G.mode !== 'play') return;
      if (e.button === 2) {
        keys.shell = true;
        shellQueued = true;
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
        keys.shell = false;
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
      keys.shell = false;
      pointer.down = false;
    }
  });
  if (canvas) {
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  }
  requestAnimationFrame(frame);
}());
