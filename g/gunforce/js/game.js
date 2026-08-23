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
  const WALK_FOOT = 208;
  const WALK_MECH = 150;
  const AIR = 0.9;
  const JUMP_V = 490;
  const GRAV = 1500;
  const MAX_FALL = 560;
  const COYOTE = 0.08;
  const BUFFER = 0.1;
  const FW = 14;
  const FH = 26;
  const FD = 16;
  const MW = 28;
  const MH = 36;
  const ARMOR_RAID = 4;
  const ARMOR_ALLEY = 3;
  const INVULN = 1.2;
  const DIE_T = 0.86;
  const RAM_CD = 0.38;
  const BEST_KEY = 'playbox-gunforce-best';
  const MUTE_KEY = 'playbox-gunforce-mute';
  const OPS = '方向 / WASD 走瞄 · 空格射击 · Shift / Z 跳 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 20];
  const HOT2 = [255, 176, 120];
  const WHT = [255, 244, 232];
  const STL = [92, 64, 52];
  const IRON = [48, 28, 22];
  const RUST = [192, 84, 44];
  const LEAF = [61, 255, 122];
  const WATER = [28, 72, 104];

  const SCORE = {
    grunt: 80, runner: 120, nest: 160, flyer: 100,
    gunner: 140, jeep: 200, boss: 3600, stage: 1400, board: 200
  };

  const STAGES = [
    {
      name: '河岸', boss: '趸炮', w: 1560, hp: 22, theme: 'river',
      ground: [[0, 420], [490, 210], [770, 230], [1070, 490]],
      plats: [
        [140, MY, 140], [340, MY, 150], [560, MY, 140],
        [820, MY, 150], [1120, MY, 160], [1340, MY, 140],
        [620, HY, 120], [980, HY, 130]
      ],
      pods: [[300, GY], [880, GY], [1280, MY]],
      ents: [
        [220, GY, 'grunt', 20, 400],
        [360, GY, 'grunt', 40, 410],
        [420, MY, 'gunner', 340, 490],
        [580, GY, 'runner', 490, 680],
        [640, MY, 'nest', 0, 0],
        [700, HY, 'flyer', 600, 820],
        [860, GY, 'grunt', 770, 980],
        [940, MY, 'gunner', 820, 970],
        [1140, GY, 'jeep', 1070, 1380],
        [1200, MY, 'nest', 0, 0],
        [1320, HY, 'flyer', 1240, 1460],
        [1420, GY, 'runner', 1280, 1540]
      ]
    },
    {
      name: '街区', boss: '巷甲', w: 1780, hp: 30, theme: 'street',
      ground: [[0, 390], [460, 200], [730, 210], [1010, 220], [1300, 480]],
      plats: [
        [80, MY, 130], [280, MY, 150], [520, MY, 140],
        [780, MY, 150], [1060, MY, 150], [1380, MY, 160], [1600, MY, 140],
        [200, HY, 120], [640, HY, 130], [1100, HY, 140], [1480, HY, 130]
      ],
      pods: [[240, GY], [840, GY], [1240, MY], [1560, GY]],
      ents: [
        [180, GY, 'grunt', 20, 360],
        [300, MY, 'nest', 0, 0],
        [340, HY, 'flyer', 220, 460],
        [540, GY, 'runner', 460, 650],
        [600, MY, 'gunner', 520, 660],
        [680, HY, 'flyer', 620, 820],
        [860, GY, 'jeep', 730, 980],
        [940, MY, 'nest', 0, 0],
        [1020, HY, 'flyer', 940, 1180],
        [1160, GY, 'grunt', 1010, 1260],
        [1280, MY, 'gunner', 1220, 1400],
        [1420, GY, 'runner', 1300, 1680],
        [1500, HY, 'flyer', 1420, 1640],
        [1640, GY, 'jeep', 1500, 1760]
      ]
    },
    {
      name: '船坞', boss: '舰门', w: 2000, hp: 42, theme: 'dock',
      ground: [[0, 370], [440, 190], [700, 200], [970, 200], [1240, 210], [1520, 480]],
      plats: [
        [70, MY, 130], [260, MY, 140], [500, MY, 150],
        [760, MY, 150], [1040, MY, 160], [1320, MY, 150],
        [1600, MY, 160], [1820, MY, 140],
        [180, HY, 120], [600, HY, 130], [980, HY, 140],
        [1400, HY, 140], [1760, HY, 130]
      ],
      pods: [[200, GY], [780, GY], [1180, MY], [1680, GY]],
      ents: [
        [160, GY, 'grunt', 20, 340],
        [240, MY, 'gunner', 70, 400],
        [300, HY, 'flyer', 180, 440],
        [500, GY, 'runner', 440, 620],
        [560, MY, 'nest', 0, 0],
        [640, HY, 'flyer', 560, 780],
        [820, GY, 'jeep', 700, 940],
        [900, MY, 'gunner', 760, 980],
        [980, HY, 'flyer', 900, 1140],
        [1120, GY, 'grunt', 970, 1200],
        [1220, MY, 'nest', 0, 0],
        [1300, HY, 'flyer', 1220, 1460],
        [1360, GY, 'runner', 1240, 1440],
        [1540, MY, 'gunner', 1480, 1680],
        [1700, GY, 'jeep', 1520, 1960],
        [1780, HY, 'flyer', 1680, 1920],
        [1880, GY, 'grunt', 1700, 1980]
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
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function airDist(walk) {
    return walk * AIR * (2 * JUMP_V / GRAV);
  }
  function maxPit(spec) {
    const segs = spec.ground.slice().sort(function (a, b) { return a[0] - b[0]; });
    let cover = 0;
    let gap = 0;
    let i;
    for (i = 0; i < segs.length; i++) {
      if (segs[i][0] > cover) gap = Math.max(gap, segs[i][0] - cover);
      cover = Math.max(cover, segs[i][0] + segs[i][1]);
    }
    return gap;
  }
  function isAlley() {
    return G.kind === 'alley';
  }
  function spdMul(alley, stage) {
    return (alley ? 1.26 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
  }
  function armorMax() {
    return isAlley() ? ARMOR_ALLEY : ARMOR_RAID;
  }
  function walkSpd() {
    const p = G.player;
    return (p && p.mech ? WALK_MECH : WALK_FOOT);
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
  function crushable(kind) {
    return kind === 'grunt' || kind === 'runner' || kind === 'flyer';
  }
  function hpOf(kind) {
    if (kind === 'nest' || kind === 'jeep') return 3;
    if (kind === 'gunner') return 2;
    return 1;
  }
  function sizeOf(kind) {
    if (kind === 'pod') return { w: 26, h: 34 };
    if (kind === 'jeep') return { w: 28, h: 18 };
    if (kind === 'nest') return { w: 18, h: 16 };
    if (kind === 'gunner') return { w: 16, h: 24 };
    if (kind === 'flyer') return { w: 16, h: 12 };
    if (kind === 'runner') return { w: 14, h: 20 };
    return { w: 14, h: 18 };
  }
  function onGroundSeg(spec, x) {
    const segs = spec.ground;
    let k;
    for (k = 0; k < segs.length; k++) {
      if (x >= segs[k][0] + 8 && x <= segs[k][0] + segs[k][1] - 8) return true;
    }
    return false;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-gunforce-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-gunforce-mute') throw new Error('mute key');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 90) throw new Error('jump height ' + h);
    const adM = airDist(WALK_MECH);
    const adF = airDist(WALK_FOOT);
    if (adF <= adM) throw new Error('foot farther');
    if (adM < 84) throw new Error('mech air ' + adM);
    if (WALK_FOOT <= WALK_MECH) throw new Error('foot faster');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('alley faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (ARMOR_RAID <= ARMOR_ALLEY) throw new Error('raid armor');
    if (!crushable('grunt') || crushable('nest') || crushable('jeep') || crushable('pod')) {
      throw new Error('crush rules');
    }
    let i, j;
    for (i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      if (!s.ground.length || !s.ents.length || !s.pods.length) throw new Error('stage ' + s.name);
      if (maxPit(s) + 16 > adM) throw new Error('pit too wide ' + s.name);
      for (j = 0; j < s.ents.length; j++) {
        const e = s.ents[j];
        if (e[1] !== GY) continue;
        if (!onGroundSeg(s, e[0])) throw new Error('ent in pit ' + s.name + ' ' + e[0]);
      }
      for (j = 0; j < s.pods.length; j++) {
        const p = s.pods[j];
        if (p[1] === GY && !onGroundSeg(s, p[0])) throw new Error('pod in pit ' + s.name);
      }
    }
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
    shot(mech) {
      this.ensure();
      if (mech) {
        this.beep(420, 0.05, 'sawtooth', 0.042, 160);
        this.beep(1180, 0.04, 'square', 0.03, 480);
        this.noise(0.03, 0.022, 900);
      } else {
        this.beep(1040, 0.036, 'square', 0.036, 380);
        this.noise(0.018, 0.016, 1800);
      }
    },
    hop() {
      this.ensure();
      this.beep(260, 0.06, 'square', 0.038, 560);
    },
    land() {
      this.ensure();
      this.noise(0.05, 0.03, 360);
      this.beep(108, 0.06, 'triangle', 0.026, 58);
    },
    board() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.045, 440);
      this.beep(523, 0.1, 'triangle', 0.04, 784);
      this.beep(784, 0.14, 'sine', 0.04, 1046);
    },
    crush() {
      this.ensure();
      this.noise(0.1, 0.058, 260);
      this.beep(150, 0.12, 'sawtooth', 0.048, 48);
      this.beep(700, 0.06, 'square', 0.03, 170);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.032, 0.03, 1100);
      this.beep(540 * lift, 0.055, 'square', 0.038, 880 * lift);
    },
    armor() {
      this.ensure();
      this.noise(0.06, 0.04, 420);
      this.beep(200, 0.1, 'sawtooth', 0.04, 90);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(170, 0.16, 'sawtooth', 0.05, 48);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(260, 0.22, 'sawtooth', 0.05, 64);
      this.beep(130, 0.34, 'sine', 0.045, 40);
    },
    boss() {
      this.ensure();
      this.beep(108, 0.2, 'sawtooth', 0.06, 52);
      this.beep(320, 0.16, 'square', 0.04, 170);
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
      this.beep(392, 0.08, 'sine', 0.04, 784);
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
    }
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
  const btnAlley = el('btn-alley');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const modeRaid = el('mode-raid');
  const modeAlley = el('mode-alley');
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
  const armorWrap = el('armor-wrap');
  const armorBar = el('armor-bar');
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
  let jumpHeldPrev = false;
  let ptrFire = false;

  const keys = { u: false, d: false, l: false, r: false, fire: false, jump: false };
  const demo = { u: false, d: false, l: false, r: true, fire: true, jump: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 1560,
    plats: [],
    ents: [],
    shots: [],
    player: null,
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    fireCd: 0,
    checkX: 70,
    checkY: GY,
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
    muzzle: 0,
    ramCd: 0,
    armorHit: 0
  };

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
    return keys.fire || ptrFire;
  }
  function jumpHeld() {
    if (G.mode === 'title') return demo.jump;
    if (overlayBlocksPlay()) return false;
    return keys.jump || jumpQueued;
  }
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
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
    const a = isAlley();
    if (modeRaid) modeRaid.setAttribute('aria-pressed', a ? 'false' : 'true');
    if (modeAlley) modeAlley.setAttribute('aria-pressed', a ? 'true' : 'false');
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const p = G.player;
    const mech = !!(p && p.mech);
    if (stageLabel) {
      stageLabel.textContent = isAlley() ? '巷战 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isAlley() ? '巷战' : '枪力';
      tagLabel.classList.toggle('warn', isAlley());
      tagLabel.classList.toggle('hot', !isAlley() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = mech ? '机炮' : '手枪';
      gunLabel.classList.toggle('mech', mech);
      gunLabel.classList.toggle('hot', mech && p && p.armor <= 1);
    }
    if (armorWrap) armorWrap.classList.toggle('off', !mech);
    if (armorBar) {
      const maxA = armorMax();
      const v = mech && p ? clamp(p.armor / maxA, 0, 1) : 0;
      armorBar.style.transform = 'scaleX(' + v + ')';
      armorBar.classList.toggle('hot', mech && p && p.armor === maxA);
      armorBar.classList.toggle('low', mech && p && p.armor <= 1);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞毁丢命', 'warn');
    else if (G.mode === 'win') setHint('船坞捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 夺甲碾兵 · 装甲打空会撞毁', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else if (mech) setHint('机甲碾步兵 · 装甲打空会撞毁', 'hot');
    else setHint('走跳射击 · 登上空机甲', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GFRC';
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
  function boomAt(x, y, power, rgb) {
    const p = power || 1;
    emit(10 + (p * 12) | 0, {
      x: x, y: y, j: 8 + p * 6,
      vx0: -240 * p, vx1: 240 * p, vy0: -320 * p, vy1: 40 * p,
      life: 0.32 + p * 0.16, r0: 1.2, r1: 3.4 + p, rgb: rgb || HOT
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

  function applySize(p) {
    if (p.mech) {
      p.w = MW;
      p.h = MH;
      p.duck = false;
    } else {
      p.w = FW;
      p.h = p.duck ? FD : FH;
    }
  }
  function makePlayer(x, y, mech) {
    const p = {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: FW, h: FH,
      grounded: true, coyote: 0,
      squash: 1, run: 0,
      mech: !!mech,
      armor: mech ? armorMax() : 0,
      duck: false
    };
    applySize(p);
    return p;
  }
  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }
  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const sz = sizeOf(kind);
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, homeY: y,
      t: rand(0, 1), fire: rand(0.2, 1.1),
      grounded: kind !== 'flyer',
      dead: false, hitN: 0,
      w: sz.w, h: sz.h
    };
  }
  function makeBoss(spec) {
    const hp = (spec.hp * (isAlley() ? 1.22 : 1)) | 0;
    const kind = spec.boss;
    return {
      id: uid++,
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: kind,
      t: 0, fire: 1.15, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0,
      w: kind === '舰门' ? 46 : 40,
      h: kind === '舰门' ? 70 : 48,
      name: kind
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
    for (i = 0; i < spec.pods.length; i++) {
      const d = spec.pods[i];
      G.ents.push(makeEnt(d[0], d[1], 'pod', 0, 0));
    }
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isAlley() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'nest' || e[2] === 'jeep') continue;
        G.ents.push(makeEnt(e[0] + 38, e[1], e[2], e[3], e[4]));
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY, false);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.4;
    G.clearT = 0;
    G.lock = 0;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.ramCd = 0;
    G.armorHit = 0;
    jumpQueued = false;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
      trails.length = 0;
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
    return standAt(x, y) && !standAt(x + face * 24, y);
  }
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function pBox() {
    const p = G.player;
    const w = p.w * (p.mech ? 0.78 : 0.72);
    return { x: p.x - w * 0.5, y: p.y - p.h, w: w, h: p.h * 0.92 };
  }
  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function countShots(from) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from === from && s.life > 0) n += 1;
    }
    return n;
  }
  function spawnShot(s) {
    s.id = uid++;
    s.hit = s.hit || [];
    G.shots.push(s);
    if (G.shots.length > 96) {
      for (let i = 0; i < G.shots.length && G.shots.length > 80; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 96);
  }
  function enemyShoot(e, dx, dy, spd, kind) {
    const len = hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    spawnShot({
      x: e.x + nx * 12,
      y: e.y - e.h * 0.55 + ny * 6,
      vx: nx * spd,
      vy: ny * spd,
      from: 'e',
      kind: kind || 'e',
      dmg: 1,
      pierce: 0,
      life: 1.55,
      rgb: MAG,
      r: kind === 'bomb' ? 5 : 3.1,
      grav: kind === 'bomb' ? 420 : 0,
      hit: []
    });
  }
  function aimDir(p) {
    let dx = p.face;
    let dy = 0;
    const u = inU();
    const d = inD();
    const lr = inL() || inR();
    if (u) dy = -1;
    if (d && !p.grounded) dy = 1;
    if (u && !lr && !d) dx = 0;
    if (d && !p.grounded && !lr && !u) dx = 0;
    const len = hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }
  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const p = G.player;
    const mech = p.mech;
    const max = mech ? 8 : 5;
    if (countShots('p') >= max) return;
    const dir = aimDir(p);
    const ox0 = p.x + dir.x * (mech ? 22 : 13);
    const oy0 = p.y - (mech ? 20 : (p.duck ? 10 : 15)) + dir.y * 8;
    const spd = mech ? 620 : 560;
    function one(yoff) {
      spawnShot({
        x: ox0,
        y: oy0 + yoff,
        vx: dir.x * spd,
        vy: dir.y * spd,
        from: 'p',
        kind: mech ? 'cannon' : 'pistol',
        dmg: 1,
        pierce: 0,
        life: mech ? 0.7 : 0.58,
        rgb: mech ? GOLD : HOT,
        r: mech ? 3.6 : 2.8,
        hit: []
      });
    }
    if (mech) {
      one(-4);
      one(4);
      G.fireCd = 0.078;
    } else {
      one(0);
      G.fireCd = 0.12;
    }
    audio.shot(mech);
    emit(mech ? 7 : 4, {
      x: ox0, y: oy0, j: 3,
      vx0: dir.x * 50, vx1: dir.x * 180, vy0: dir.y * 40 - 30, vy1: dir.y * 40 + 30,
      life: 0.14, r0: 1, r1: mech ? 2.6 : 2.1, rgb: mech ? GOLD : HOT, g: 50
    });
    G.muzzle = mech ? 0.07 : 0.045;
  }

  function boardPod(e) {
    if (!e || e.dead || e.kind !== 'pod') return;
    const p = G.player;
    if (!p || p.mech || G.deadT > 0) return;
    e.dead = true;
    p.mech = true;
    p.armor = armorMax();
    p.duck = false;
    applySize(p);
    if (playing()) {
      bumpCombo();
      addScore((SCORE.board * G.mult) | 0);
      floatText(p.x, p.y - 40, '夺甲', GOLD, true);
      toast('夺甲', false, true);
      audio.board();
      boomAt(p.x, p.y - 18, 0.7, GOLD);
      hitStop(0.05);
      kick(3.2, 'pickup');
      screenFlash(GOLD, 0.28);
    }
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    const p = G.player;
    p.vy = -160;
    const big = why === 'crash' || p.mech;
    boomAt(p.x, p.y - 16, big ? 1.7 : 1.3, MAG);
    p.mech = false;
    p.armor = 0;
    applySize(p);
    audio.death();
    hitStop(0.074);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    syncHud();
  }
  function hurtArmor(why) {
    const p = G.player;
    if (!playing() || !p || G.deadT > 0 || G.invuln > 0) return;
    if (!p.mech) {
      die(why);
      return;
    }
    if (G.armorHit > 0) return;
    p.armor -= 1;
    G.armorHit = 0.42;
    G.invuln = Math.max(G.invuln, 0.22);
    audio.armor();
    kick(3.4, 'thump');
    emit(10, {
      x: p.x, y: p.y - 18, j: 10,
      vx0: -180, vx1: 180, vy0: -220, vy1: 20,
      life: 0.26, r0: 1.2, r1: 3, rgb: HOT, g: 240
    });
    hitStop(0.048);
    if (p.armor <= 0) {
      die('crash');
      return;
    }
    if (p.armor === 1) toast('装甲将毁', true, false);
    syncHud();
  }
  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY, false);
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    G.ramCd = 0;
    G.armorHit = 0;
    toast('重生', true, false);
    syncHud();
  }
  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入河里了'
      : G.why === 'touch' ? '撞上了'
        : G.why === 'crash' ? '机甲撞毁了'
          : '中弹了';
    showOverlay('lose', '枪力折了', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }
  function goWin() {
    addScore(isAlley() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isAlley() ? '巷战得手' : '船坞捣毁了',
      (isAlley() ? '巷战打穿三关。' : '枪力打穿船坞。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }
  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepMech = G.player && G.player.mech;
    const keepArmor = keepMech ? G.player.armor : 0;
    loadStage(G.stage + 1, false);
    if (keepMech) {
      G.player.mech = true;
      G.player.armor = keepArmor;
      applySize(G.player);
    }
    G.invuln = 1.05;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }
  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'alley' ? 'alley' : 'raid';
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
    keys.fire = false;
    ptrFire = false;
    jumpQueued = false;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isAlley() ? '巷战' : STAGES[0].name, false, !isAlley());
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
    showOverlay('title', '枪力', '向右跑、跳、开火。走上空机甲即夺甲。机甲可碾步兵，装甲打空会撞毁丢一条命。短关之后是关底。');
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

  function crush(e, how) {
    if (!e || e.dead || e.kind === 'pod') return;
    e.dead = true;
    e.hp = 0;
    bumpCombo();
    const base = SCORE[e.kind] || 80;
    const mul = how === 'crush' ? 2 : 1;
    const n = (base * mul * G.mult) | 0;
    addScore(n);
    floatText(e.x, e.y - e.h, how === 'crush' ? '碾 ' + n : String(n), how === 'crush' ? GOLD : HOT, how === 'crush');
    boomAt(e.x, e.y - e.h * 0.5, how === 'crush' ? 1.15 : 0.85, how === 'crush' ? GOLD : HOT);
    if (how === 'crush') audio.crush();
    else audio.boom();
    hitStop(how === 'crush' ? 0.07 : 0.046);
  }

  function hurtEnt(e, dmg, shot) {
    if (!e || e.dead || e.kind === 'pod') return;
    e.hp -= dmg;
    e.hitN = 0.08;
    const px = shot ? shot.x : e.x;
    const py = shot ? shot.y : e.y - e.h * 0.5;
    emit(6, {
      x: px, y: py, j: 5,
      vx0: -140, vx1: 140, vy0: -180, vy1: 20,
      life: 0.2, r0: 1, r1: 2.4, rgb: HOT, g: 200
    });
    popSpark(px, py, HOT, 10);
    if (e.hp <= 0) {
      crush(e, 'shot');
    } else {
      bumpCombo();
      audio.hit(G.combo);
      hitStop(0.034 + Math.min(0.04, G.combo * 0.004));
      kick(1.6, 'hit');
      addScore((20 * G.mult) | 0);
    }
  }
  function hurtBoss(dmg, shot) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.1;
    bumpCombo();
    audio.hit(G.combo);
    const px = shot ? shot.x : b.x;
    const py = shot ? shot.y : b.y - 24;
    emit(8, {
      x: px, y: py, j: 8,
      vx0: -160, vx1: 160, vy0: -200, vy1: 20,
      life: 0.24, r0: 1.2, r1: 3, rgb: GOLD, g: 180
    });
    hitStop(0.042);
    kick(2.2, 'hit');
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      boomAt(b.x, b.y - 22, 1.8, GOLD);
      audio.boom();
      addScore((SCORE.boss * G.mult) | 0);
      addScore((SCORE.stage * G.stage * G.mult) | 0);
      floatText(b.x, b.y - 50, '击破', GOLD, true);
      toast(b.name + ' 击破', false, true);
      G.clearT = 1.35;
      G.lock = 0.4;
      screenFlash(GOLD, 0.4);
      hitStop(0.08);
    }
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.d = false;
    demo.fire = true;
    demo.jump = (pitAhead(p.x, p.y, 1) && p.grounded) || (!p.grounded && p.vy < 40);
    demo.u = false;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'flyer' && e.x > p.x && e.x - p.x < 160) demo.u = true;
      if (e.kind === 'pod' && !p.mech && e.x > p.x - 10 && e.x - p.x < 90) {
        demo.r = true;
      }
    }
    if (p.x > G.levelW - 280 || p.y > VH + 20) {
      G.player = makePlayer(70, GY, false);
      G.camX = 0;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.4;
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

    p.duck = !p.mech && p.grounded && inD() && !inU();
    applySize(p);

    const wantJump = jumpHeld();
    if (wantJump) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = p.grounded || p.coyote > 0;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      jumpQueued = false;
      p.duck = false;
      applySize(p);
      p.squash = 0.78;
      if (playing()) audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.2, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.026);
    }
    if (!wantJump && jumpHeldPrev && p.vy < -80 && G.mode !== 'title') p.vy *= 0.42;
    jumpHeldPrev = wantJump;

    const spd = walkSpd() * (p.grounded ? 1 : AIR);
    p.vx = ax * spd;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
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
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
        if (p.squash < 1) p.squash = 1.12;
        if (playing() && y0 < plat.y - 8) audio.land();
        if (playing() && plat.base) {
          G.checkX = p.x;
          G.checkY = plat.y;
        }
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0008, dt));
    if (ax && p.grounded) p.run += dt * 10;
    else p.run *= Math.pow(0.2, dt * 8);

    if (p.mech) {
      trails.push({ x: p.x, y: p.y, t: 0, face: p.face, mech: true, squash: p.squash });
      capArr(trails, 12);
    }

    if (p.y > VH + 36) die(p.mech ? 'crash' : 'fall');

    if (fireHeld()) tryShoot();
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.kind === 'pod') {
      e.t += dt;
      return;
    }
    if (!onScreen(e.x, e.y, 80)) {
      e.fire = Math.max(e.fire, 0.2);
      return;
    }
    e.t += dt;
    e.fire -= dt;
    e.hitN = Math.max(0, e.hitN - dt);
    const mul = spdMul(isAlley(), G.stage);
    const p = G.player;
    if (e.kind === 'flyer') {
      e.x += Math.sin(e.t * 1.4) * 28 * dt * (e.face || 1);
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = e.homeY + Math.sin(e.t * 2.2) * 16;
      if (e.fire <= 0 && playing()) {
        enemyShoot(e, p.x - e.x, p.y - 16 - e.y, 150 * mul, 'e');
        e.fire = (isAlley() ? 1.05 : 1.45) / mul;
      }
      return;
    }
    if (e.kind === 'nest') {
      if (e.fire <= 0 && playing()) {
        enemyShoot(e, p.x - e.x, p.y - 18 - (e.y - e.h * 0.4), 170 * mul, 'e');
        e.fire = (isAlley() ? 0.85 : 1.2) / mul;
      }
      return;
    }
    let spd = e.kind === 'jeep' ? 42 : e.kind === 'runner' ? 90 : e.kind === 'gunner' ? 0 : 48;
    spd *= mul;
    if (e.kind === 'runner' && p && Math.abs(p.x - e.x) < 240) {
      e.face = p.x < e.x ? -1 : 1;
      spd = 130 * mul;
    } else if (e.a !== e.b) {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    e.x += e.face * spd * dt;
    if (e.kind !== 'gunner' && pitAhead(e.x, e.y, e.face) && e.kind !== 'runner') {
      e.face *= -1;
    }
    if (e.fire <= 0 && playing() && e.kind !== 'runner') {
      const aimX = p.x - e.x;
      const aimY = p.y - 16 - (e.y - e.h * 0.5);
      enemyShoot(e, aimX, e.kind === 'jeep' ? 0 : aimY * 0.4, (e.kind === 'jeep' ? 190 : 160) * mul, 'e');
      e.fire = ((e.kind === 'jeep' ? 1.05 : 1.35) * (isAlley() ? 0.78 : 1)) / mul;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    if (!b.active) {
      if (p.x > G.levelW - VW + 70) {
        b.active = true;
        b.state = 'fight';
        b.fire = 0.6;
        toast(b.name, false, true);
        audio.boss();
        kick(3.6, 'thump');
      }
      return;
    }
    b.t += dt;
    b.fire -= dt;
    b.hitN = Math.max(0, b.hitN - dt);
    const mul = spdMul(isAlley(), G.stage);
    const low = b.hp < b.max * 0.5;
    const left = G.levelW - VW + 70;
    const right = G.levelW - 70;

    if (b.kind === '巷甲') {
      if (b.x < left) b.face = 1;
      if (b.x > right) b.face = -1;
      b.x += b.face * 56 * mul * dt;
      if (b.grounded && b.t % 3.2 < dt * 2) {
        b.vy = -320;
        b.grounded = false;
      }
      b.vy += GRAV * dt;
      b.y += b.vy * dt;
      if (b.y >= GY) {
        b.y = GY;
        b.vy = 0;
        b.grounded = true;
      }
      if (b.fire <= 0) {
        enemyShoot(b, p.x - b.x, p.y - 20 - (b.y - 24), 200 * mul, 'e');
        enemyShoot(b, p.x - b.x, p.y - 8 - (b.y - 10), 180 * mul, 'e');
        if (low) enemyShoot(b, -b.face, -0.4, 220 * mul, 'e');
        b.fire = (low ? 0.62 : 0.92) / mul;
      }
    } else if (b.kind === '舰门') {
      b.x = G.levelW - 90;
      b.y = GY;
      if (b.fire <= 0) {
        const top = low ? 5 : 3;
        let i;
        for (i = 0; i < top; i++) {
          const ang = -0.9 + i * (1.8 / Math.max(1, top - 1));
          enemyShoot(b, Math.cos(ang + Math.PI) * 40, Math.sin(ang) * 40, 170 * mul, 'e');
        }
        if (low) {
          enemyShoot(b, p.x - b.x, p.y - 40 - (b.y - 50), 210 * mul, 'e');
          enemyShoot(b, p.x - b.x, 40, 160 * mul, 'bomb');
        }
        b.fire = (low ? 0.72 : 1.05) / mul;
      }
    } else {
      b.x = lerp(b.x, G.levelW - 120, 1 - Math.pow(0.2, dt * 3));
      b.y = GY;
      if (b.fire <= 0) {
        enemyShoot(b, -1, 0, 200 * mul, 'e');
        enemyShoot(b, -0.85, -0.45, 190 * mul, 'e');
        enemyShoot(b, -0.85, 0.2, 190 * mul, 'e');
        if (low) enemyShoot(b, p.x - b.x, -80, 150 * mul, 'bomb');
        b.fire = (low ? 0.7 : 1.0) / mul;
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y > VH + 40 || s.x < G.camX - 40 || s.x > G.camX + VW + 80) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        if (G.boss && G.boss.active && !G.boss.dead) {
          const b = G.boss;
          if (overlap(s.x - 3, s.y - 3, 6, 6, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h)) {
            if (s.hit.indexOf(b.id) < 0) {
              s.hit.push(b.id);
              hurtBoss(s.dmg, s);
              if (!s.pierce) {
                G.shots.splice(i, 1);
                continue;
              }
            }
          }
        }
        for (let j = 0; j < G.ents.length; j++) {
          const e = G.ents[j];
          if (e.dead || e.kind === 'pod') continue;
          if (!overlap(s.x - 3, s.y - 3, 6, 6, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          s.hit.push(e.id);
          hurtEnt(e, s.dmg, s);
          if (!s.pierce) {
            G.shots.splice(i, 1);
            break;
          }
        }
      } else if (playing() && G.deadT <= 0) {
        const pb = pBox();
        if (overlap(s.x - 3, s.y - 3, 6, 6, pb.x, pb.y, pb.w, pb.h)) {
          G.shots.splice(i, 1);
          if (G.player.mech) hurtArmor('hit');
          else die('hit');
        }
      }
    }
  }

  function collideBodies() {
    if (!playing() || G.deadT > 0 || G.lock > 0) return;
    const p = G.player;
    const pb = pBox();
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (!overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) continue;
      if (e.kind === 'pod') {
        if (!p.mech) boardPod(e);
        continue;
      }
      if (p.mech && crushable(e.kind)) {
        crush(e, 'crush');
        continue;
      }
      if (p.mech) {
        if (G.ramCd <= 0) {
          G.ramCd = RAM_CD;
          hurtArmor('touch');
          if (G.deadT > 0) return;
          if (!e.dead && (e.kind === 'nest' || e.kind === 'jeep' || e.kind === 'gunner')) {
            hurtEnt(e, 1, null);
          }
        }
      } else {
        die('touch');
        return;
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead) {
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h)) {
        if (p.mech) hurtArmor('touch');
        else die('touch');
      }
    }
  }

  function updateFx(dt) {
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.28) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > 0.16) trails.splice(i, 1);
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - 180;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    G.camY = 0;
    if (G.shake > 0 && !REDUCE) {
      G.camX += rand(-G.shake, G.shake) * 0.35;
      G.camY += rand(-G.shake, G.shake) * 0.22;
      G.shake *= Math.pow(0.04, dt * 8);
      if (G.shake < 0.08) G.shake = 0;
    }
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.002, dt));
  }

  function tick(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
    if (G.ramCd > 0) G.ramCd -= dt;
    if (G.armorHit > 0) G.armorHit -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.flash > 0) G.flash -= dt * 1.8;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    collideBodies();
    updateFx(dt);
    updateCam(dt);
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0 && playing()) nextStage();
    }
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'street') {
      g.addColorStop(0, '#1a0814');
      g.addColorStop(0.55, '#14080c');
      g.addColorStop(1, '#0c0406');
    } else if (spec.theme === 'dock') {
      g.addColorStop(0, '#1c1008');
      g.addColorStop(0.5, '#140804');
      g.addColorStop(1, '#0a0404');
    } else {
      g.addColorStop(0, '#241008');
      g.addColorStop(0.5, '#140804');
      g.addColorStop(1, '#0c0608');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }
  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.22;
    let i;
    for (i = 0; i < 18; i++) {
      const hsh = hash2(i * 17 + spec.w);
      const x = sx((i * 220 - par) % (G.levelW + 200) - 40);
      const h = (40 + hsh * 90) * scale;
      const w = (28 + hsh * 50) * scale;
      ctx.fillStyle = spec.theme === 'street'
        ? rgba([48, 16, 28], 0.55)
        : rgba(IRON, 0.55);
      ctx.fillRect(x, sy(GY) - h, w, h);
      if (spec.theme === 'street') {
        ctx.fillStyle = rgba(i % 2 ? CYN : MAG, 0.18 + hsh * 0.2);
        ctx.fillRect(x + w * 0.2, sy(GY) - h + 10 * scale, w * 0.22, 8 * scale);
        ctx.fillRect(x + w * 0.55, sy(GY) - h + 22 * scale, w * 0.22, 8 * scale);
      }
    }
    if (spec.theme === 'dock') {
      for (i = 0; i < 6; i++) {
        const x = sx(180 + i * 340 - par * 0.5);
        ctx.strokeStyle = rgba(GOLD, 0.18);
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(x, sy(80));
        ctx.lineTo(x, sy(GY));
        ctx.stroke();
        ctx.fillStyle = rgba(RUST, 0.35);
        ctx.fillRect(x - 18 * scale, sy(90), 70 * scale, 8 * scale);
      }
    }
    ctx.fillStyle = rgba(WATER, 0.35);
    ctx.fillRect(ox, sy(GY + 6), VW * scale, (VH - GY) * scale);
    const segs = spec.ground;
    ctx.fillStyle = rgba(WATER, 0.55);
    for (i = 0; i < segs.length - 1; i++) {
      const a = segs[i];
      const b = segs[i + 1];
      const x0 = a[0] + a[1];
      const x1 = b[0];
      if (x1 > x0 + 8) {
        ctx.fillRect(sx(x0), sy(GY + 2), (x1 - x0) * scale, 40 * scale);
        ctx.fillStyle = rgba(CYN, 0.08 + 0.05 * Math.sin(G.clock * 2 + i));
        ctx.fillRect(sx(x0), sy(GY + 8), (x1 - x0) * scale, 6 * scale);
        ctx.fillStyle = rgba(WATER, 0.55);
      }
    }
  }
  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      if (p.base) {
        ctx.fillStyle = rgba(IRON, 1);
        ctx.fillRect(x, y, w, 42 * scale);
        ctx.fillStyle = rgba(HOT, 0.55);
        ctx.fillRect(x, y, w, 4 * scale);
        ctx.fillStyle = rgba(RUST, 0.45);
        let k;
        for (k = 0; k < p.w; k += 18) {
          ctx.fillRect(x + k * scale, y + 8 * scale, 10 * scale, 6 * scale);
        }
      } else {
        ctx.fillStyle = rgba(STL, 0.95);
        roundRect(x, y, w, 10 * scale, 3 * scale);
        ctx.fill();
        ctx.fillStyle = rgba(HOT2, 0.35);
        ctx.fillRect(x, y, w, 2 * scale);
      }
    }
  }
  function drawSoldier(p, ghost) {
    const f = p.face;
    const s = scale * (ghost ? 0.92 : 1);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(f, p.squash);
    const h = p.h * s;
    const blink = G.invuln > 0 && ((G.clock * 18) | 0) % 2 === 0;
    if (blink && !ghost && playing()) ctx.globalAlpha = 0.42;
    ctx.fillStyle = rgba(HOT, ghost ? 0.45 : 1);
    ctx.fillRect(-5 * s, -h, 10 * s, h * 0.55);
    ctx.fillStyle = rgba(GOLD, ghost ? 0.5 : 1);
    ctx.beginPath();
    ctx.arc(0, -h + 3 * s, 5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(1 * s, -h + 1 * s, 5 * s, 3 * s);
    ctx.fillStyle = rgba(HOT2, 1);
    ctx.fillRect(4 * s, -h * 0.62, 12 * s, 2.2 * s);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(14 * s, -h * 0.66, 8 * s, 4 * s);
    }
    ctx.fillStyle = rgba(IRON, 1);
    const leg = Math.sin(p.run) * 4 * s;
    ctx.fillRect(-5 * s, -h * 0.42, 4 * s, h * 0.42 + leg);
    ctx.fillRect(1 * s, -h * 0.42, 4 * s, h * 0.42 - leg);
    ctx.restore();
  }
  function drawMechBody(p, ghost) {
    const f = p.face;
    const s = scale;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(f, p.squash);
    const blink = G.invuln > 0 && ((G.clock * 18) | 0) % 2 === 0;
    if (blink && !ghost && playing()) ctx.globalAlpha = 0.4;
    if (G.armorHit > 0 && !ghost) ctx.globalAlpha = 0.7;
    ctx.fillStyle = rgba(ghost ? GOLD : RUST, ghost ? 0.55 : 1);
    roundRect(-14 * s, -36 * s, 26 * s, 22 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, ghost ? 0.4 : 0.9);
    ctx.fillRect(-14 * s, -36 * s, 26 * s, 5 * s);
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(-8 * s, -30 * s, 10 * s, 6 * s);
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(-6 * s, -28.5 * s, 7 * s, 3 * s);
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.fillRect(10 * s, -28 * s, 16 * s, 4 * s);
    if (G.muzzle > 0 && !ghost) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(24 * s, -30 * s, 10 * s, 8 * s);
    }
    ctx.fillStyle = rgba(IRON, 1);
    ctx.fillRect(-12 * s, -14 * s, 8 * s, 14 * s);
    ctx.fillRect(2 * s, -14 * s, 8 * s, 14 * s);
    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.fillRect(-10 * s, -6 * s, 5 * s, 3 * s);
    ctx.fillRect(4 * s, -6 * s, 5 * s, 3 * s);
    ctx.restore();
  }
  function drawPlayer() {
    const p = G.player;
    if (!p) return;
    if (G.deadT > 0) {
      ctx.globalAlpha = clamp(G.deadT / DIE_T, 0, 1);
    }
    if (p.mech) drawMechBody(p, false);
    else drawSoldier(p, false);
    ctx.globalAlpha = 1;
  }
  function drawEnt(e) {
    if (e.dead || !onScreen(e.x, e.y, 30)) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    if (e.hitN > 0) {
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.fillRect(x - e.w * 0.6 * s, y - e.h * s, e.w * 1.2 * s, e.h * s);
    }
    if (e.kind === 'pod') {
      const pulse = 0.55 + 0.25 * Math.sin(G.clock * 6 + e.x * 0.01);
      ctx.globalAlpha = pulse;
      drawMechBody({ x: e.x, y: e.y, face: 1, squash: 1, h: MH }, true);
      ctx.globalAlpha = 1;
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = 'bold ' + (10 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('甲', x, y - 42 * s);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    if (e.kind === 'flyer') {
      ctx.fillStyle = rgba(MAG, 1);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 10 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(-3 * s, -8 * s, 6 * s, 3 * s);
    } else if (e.kind === 'nest') {
      ctx.fillStyle = rgba(STL, 1);
      ctx.fillRect(-10 * s, -16 * s, 20 * s, 16 * s);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(-6 * s, -22 * s, 12 * s, 8 * s);
    } else if (e.kind === 'jeep') {
      ctx.fillStyle = rgba(RUST, 1);
      roundRect(-16 * s, -18 * s, 32 * s, 14 * s, 3 * s);
      ctx.fill();
      ctx.fillStyle = rgba(IRON, 1);
      ctx.beginPath();
      ctx.arc(-10 * s, -4 * s, 5 * s, 0, TAU);
      ctx.arc(10 * s, -4 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(8 * s, -16 * s, 12 * s, 3 * s);
    } else if (e.kind === 'runner') {
      ctx.fillStyle = rgba(MAG, 1);
      ctx.fillRect(-6 * s, -20 * s, 12 * s, 20 * s);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(-3 * s, -18 * s, 6 * s, 4 * s);
    } else if (e.kind === 'gunner') {
      ctx.fillStyle = rgba(STL, 1);
      ctx.fillRect(-7 * s, -24 * s, 14 * s, 24 * s);
      ctx.fillStyle = rgba(HOT2, 0.9);
      ctx.fillRect(4 * s, -18 * s, 10 * s, 3 * s);
    } else {
      ctx.fillStyle = rgba(HOT2, 0.95);
      ctx.fillRect(-6 * s, -18 * s, 12 * s, 18 * s);
      ctx.fillStyle = rgba(IRON, 1);
      ctx.fillRect(-4 * s, -16 * s, 8 * s, 5 * s);
    }
    ctx.restore();
  }
  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || !onScreen(b.x, b.y, 80)) return;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale;
    if (b.hitN > 0) {
      ctx.fillStyle = rgba(WHT, 0.4);
      ctx.fillRect(x - b.w * 0.55 * s, y - b.h * s, b.w * 1.1 * s, b.h * s);
    }
    ctx.save();
    ctx.translate(x, y);
    if (b.kind === '舰门') {
      ctx.fillStyle = rgba(IRON, 1);
      ctx.fillRect(-24 * s, -70 * s, 48 * s, 70 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-20 * s, -66 * s, 40 * s, 8 * s);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(-8 * s, -50 * s, 16 * s, 16 * s);
      ctx.fillRect(-8 * s, -24 * s, 16 * s, 12 * s);
    } else if (b.kind === '巷甲') {
      ctx.fillStyle = rgba(RUST, 1);
      roundRect(-20 * s, -48 * s, 40 * s, 30 * s, 4 * s);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-20 * s, -48 * s, 40 * s, 6 * s);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(-10 * s, -40 * s, 14 * s, 8 * s);
      ctx.fillStyle = rgba(IRON, 1);
      ctx.fillRect(-16 * s, -18 * s, 10 * s, 18 * s);
      ctx.fillRect(6 * s, -18 * s, 10 * s, 18 * s);
    } else {
      ctx.fillStyle = rgba(STL, 1);
      ctx.fillRect(-22 * s, -46 * s, 44 * s, 46 * s);
      ctx.fillStyle = rgba(HOT, 0.75);
      ctx.fillRect(-16 * s, -40 * s, 32 * s, 10 * s);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-28 * s, -28 * s, 14 * s, 6 * s);
    }
    ctx.restore();
    if (b.active) {
      const bw = 120 * s;
      const bh = 7 * s;
      const bx = sx(b.x) - bw / 2;
      const by = sy(b.y - b.h - 12);
      ctx.fillStyle = rgba([0, 0, 0], 0.5);
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = rgba(b.hp < b.max * 0.35 ? MAG : GOLD, 0.9);
      ctx.fillRect(bx, by, bw * clamp(b.hp / b.max, 0, 1), bh);
    }
  }
  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale;
    ctx.fillStyle = rgba(s.rgb, 1);
    if (s.kind === 'cannon') {
      ctx.fillRect(x - 5 * sc, y - 2.2 * sc, 10 * sc, 4.4 * sc);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(x - 2 * sc, y - 1.2 * sc, 6 * sc, 2.4 * sc);
    } else if (s.kind === 'bomb') {
      ctx.beginPath();
      ctx.arc(x, y, 5 * sc, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, (s.r || 3) * sc, 0, TAU);
      ctx.fill();
    }
  }
  function drawFx() {
    let i;
    for (i = 0; i < trails.length; i++) {
      const t = trails[i];
      ctx.globalAlpha = 0.22 * (1 - t.t / 0.16);
      if (t.mech) drawMechBody({ x: t.x, y: t.y, face: t.face, squash: t.squash, h: MH }, true);
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.fillStyle = rgba(q.rgb, clamp(q.life / q.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      const k = sparks[i];
      const a = 1 - k.t / 0.22;
      ctx.strokeStyle = rgba(k.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      const rad = k.rad * (0.4 + k.t * 4) * scale;
      for (let n = 0; n < 6; n++) {
        const ang = n * TAU / 6;
        ctx.moveTo(sx(k.x), sy(k.y));
        ctx.lineTo(sx(k.x) + Math.cos(ang) * rad, sy(k.y) + Math.sin(ang) * rad);
      }
      ctx.stroke();
    }
    for (i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t / 0.28);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    for (i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#140804';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W / 2, -H / 2);
    }
    drawSky();
    drawBackdrop();
    drawPlats();
    let i;
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawPlayer();
    drawFx();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
    ctx.fillStyle = '#140804';
    ctx.fillRect(0, 0, W, oy);
    ctx.fillRect(0, oy + VH * scale, W, H);
    ctx.fillRect(0, 0, ox, H);
    ctx.fillRect(ox + VW * scale, 0, W, H);
  }

  function resize() {
    if (!canvas || !canvas.parentElement) return;
    const wrap = canvas.parentElement;
    const rw = Math.max(1, wrap.clientWidth);
    const rh = Math.max(1, wrap.clientHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, (rw * dpr) | 0);
    canvas.height = Math.max(1, (rh * dpr) | 0);
    W = canvas.width;
    H = canvas.height;
    const fit = Math.min(rw / VW, rh / VH);
    scale = fit * dpr;
    ox = (W - VW * scale) / 2;
    oy = (H - VH * scale) / 2;
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    if (hidden) {
      last = now;
      requestAnimationFrame(frame);
      return;
    }
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      acc -= STEP;
      steps += 1;
      if (G.stop > 0) G.stop -= STEP;
      else tick(STEP);
    }
    draw();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const code = e.code || '';
    const key = e.key || '';
    if (code === 'KeyR' || key === 'r' || key === 'R') {
      if (down) {
        e.preventDefault();
        restart();
      }
      return;
    }
    if (code === 'KeyM' || key === 'm' || key === 'M') {
      if (down) {
        e.preventDefault();
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    }
    if (down && (code === 'Enter' || code === 'NumpadEnter' || code === 'Digit1' || code === 'Numpad1')) {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title') startGame('raid');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      return;
    }
    if (down && (code === 'Digit2' || code === 'Numpad2')) {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title') startGame('alley');
      return;
    }
    if (code === 'Space') {
      e.preventDefault();
      if (down && overlayBlocksPlay()) {
        primaryAction();
        return;
      }
      keys.fire = down;
      return;
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ') {
      e.preventDefault();
      keys.jump = down;
      if (down) jumpQueued = true;
      return;
    }
    if (code === 'ArrowLeft' || code === 'KeyA') {
      e.preventDefault();
      keys.l = down;
      return;
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      e.preventDefault();
      keys.r = down;
      return;
    }
    if (code === 'ArrowUp' || code === 'KeyW') {
      e.preventDefault();
      keys.u = down;
      return;
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      e.preventDefault();
      keys.d = down;
    }
  }

  function bindPad(id, key) {
    const n = el(id);
    if (!n) return;
    const set = function (v) {
      keys[key] = v;
      n.classList.toggle('held', v);
    };
    n.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      n.setPointerCapture(e.pointerId);
      audio.ensure();
      set(true);
      if (key === 'jump') jumpQueued = true;
    });
    n.addEventListener('pointerup', function (e) {
      e.preventDefault();
      set(false);
    });
    n.addEventListener('pointercancel', function () { set(false); });
    n.addEventListener('lostpointercapture', function () { set(false); });
  }

  function bootMute() {
    try {
      audio.setMuted(localStorage.getItem(MUTE_KEY) === '1');
    } catch (err) {
      audio.setMuted(false);
    }
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      audio.ensure();
      ptrFire = true;
      if (overlayBlocksPlay()) primaryAction();
    });
    window.addEventListener('pointerup', function () { ptrFire = false; });
    window.addEventListener('pointercancel', function () { ptrFire = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = keys.fire = keys.jump = false;
    ptrFire = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.u = keys.d = keys.l = keys.r = keys.fire = keys.jump = false;
      ptrFire = false;
    }
  });
  window.addEventListener('resize', resize);

  if (btnRaid) btnRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
  if (btnAlley) btnAlley.addEventListener('click', function () { audio.ensure(); startGame('alley'); });
  if (modeRaid) modeRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
  if (modeAlley) modeAlley.addEventListener('click', function () { audio.ensure(); startGame('alley'); });
  if (ovAgain) ovAgain.addEventListener('click', function () { audio.ensure(); startGame(G.kind); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); goTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  bindPad('btn-left', 'l');
  bindPad('btn-right', 'r');
  bindPad('btn-jump', 'jump');
  bindPad('btn-fire', 'fire');
  bindPad('btn-duck', 'd');

  loadBest();
  bootMute();
  resize();
  goTitle();
  requestAnimationFrame(frame);
})();
