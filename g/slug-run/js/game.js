'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const HP_MAX = 4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
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
  const INVULN = 1.15;
  const DIE_T = 0.82;
  const NADE_MAX = 20;
  const NADE_FRONT = 8;
  const NADE_ALLEY = 16;
  const TANK_FRONT = 8;
  const TANK_ALLEY = 6;
  const BEST_KEY = 'playbox-slug-run-best';
  const MUTE_KEY = 'playbox-slug-run-mute';
  const OPS = 'WASD / 方向键 走跳 · 空格开火 · C 手雷 · 走过救人 · 跳进坦克 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [200, 255, 20];
  const HOT2 = [230, 255, 106];
  const WHT = [246, 243, 239];
  const LEAF = [61, 255, 122];
  const ORG = [255, 168, 64];
  const BLU = [42, 106, 212];
  const SAND = [200, 160, 74];
  const SKIN = [244, 214, 176];
  const OLIVE = [42, 138, 58];

  const GUN_NAME = { pistol: '手枪', H: '重机', tank: '坦克' };
  const WEAPONS = {
    pistol: { cd: 0.16, max: 4, spd: 560, dmg: 1, life: 0.7, rgb: GOLD },
    H: { cd: 0.055, max: 10, spd: 640, dmg: 1, life: 0.58, rgb: HOT },
    tank: { cd: 0.07, max: 10, spd: 620, dmg: 1, life: 0.62, rgb: HOT2 }
  };

  const SCORE = {
    grunt: 100, runner: 150, nade: 150, turret: 300, mortar: 250,
    flyer: 200, crate: 80, pow: 1000, boss: 4000, stage: 2000
  };

  const STAGES = [
    {
      name: '荒原', boss: '沙甲', w: 2420, hp: 36, theme: 'sand',
      ground: [[0, 580], [680, 360], [1160, 400], [1680, 740]],
      plats: [
        [180, MY, 140], [460, MY, 160], [880, MY, 150],
        [1320, MY, 170], [1780, MY, 150], [2100, MY, 130],
        [520, HY, 110], [1080, HY, 130], [1640, HY, 120]
      ],
      ents: [
        [260, GY, 'grunt', 40, 540],
        [430, GY, 'grunt', 80, 540],
        [500, MY, 'turret', 0, 0],
        [760, GY, 'runner', 700, 1040],
        [920, GY, 'nade', 880, 1140],
        [1100, MY, 'grunt', 880, 1030],
        [1280, GY, 'turret', 0, 0],
        [1420, GY, 'grunt', 1180, 1540],
        [1540, MY, 'mortar', 0, 0],
        [1760, GY, 'runner', 1680, 2140],
        [1880, MY, 'grunt', 1780, 1930],
        [2020, GY, 'turret', 0, 0],
        [2140, GY, 'grunt', 1700, 2280]
      ],
      pows: [[340, GY, 'nade'], [980, GY, 'H'], [1480, MY, 'hp'], [1960, GY, 'nade']],
      slugs: [[500, GY]],
      drops: [[1180, HY, 'H']],
      crates: [[820, GY], [1500, GY]]
    },
    {
      name: '废城', boss: '城门', w: 2700, hp: 48, theme: 'city',
      ground: [[0, 480], [560, 280], [960, 360], [1440, 300], [1880, 820]],
      plats: [
        [120, MY, 130], [380, MY, 150], [720, MY, 160],
        [1080, MY, 150], [1480, MY, 170], [1860, MY, 150], [2280, MY, 140],
        [260, HY, 110], [800, HY, 130], [1260, HY, 140],
        [1720, HY, 130], [2160, HY, 140]
      ],
      ents: [
        [220, GY, 'grunt', 20, 450],
        [400, MY, 'turret', 0, 0],
        [520, GY, 'nade', 20, 500],
        [700, GY, 'runner', 560, 920],
        [860, MY, 'grunt', 720, 880],
        [1040, GY, 'turret', 0, 0],
        [1180, HY, 'mortar', 0, 0],
        [1320, GY, 'runner', 980, 1400],
        [1460, MY, 'nade', 1480, 1650],
        [1620, GY, 'turret', 0, 0],
        [1760, HY, 'flyer', 1720, 1960],
        [1940, GY, 'grunt', 1880, 2400],
        [2080, MY, 'turret', 0, 0],
        [2220, GY, 'runner', 1960, 2500],
        [2380, MY, 'grunt', 2280, 2420],
        [2480, GY, 'mortar', 0, 0]
      ],
      pows: [[300, GY, 'nade'], [900, MY, 'hp'], [1560, GY, 'H'], [2180, HY, 'nade']],
      slugs: [[1120, GY], [2000, GY]],
      drops: [[1340, HY, 'H'], [2320, MY, 'nade']],
      crates: [[640, GY], [1400, GY], [1840, MY]]
    },
    {
      name: '要塞', boss: '帝心', w: 2980, hp: 64, theme: 'fort',
      ground: [[0, 420], [500, 320], [940, 360], [1420, 280], [1860, 340], [2360, 620]],
      plats: [
        [80, MY, 120], [300, MY, 140], [620, MY, 150],
        [960, MY, 140], [1280, MY, 170], [1680, MY, 150],
        [2040, MY, 160], [2440, MY, 170], [2760, MY, 120],
        [220, HY, 110], [700, HY, 130], [1180, HY, 140],
        [1620, HY, 130], [2100, HY, 150], [2520, HY, 130]
      ],
      ents: [
        [200, GY, 'grunt', 20, 400],
        [340, MY, 'turret', 0, 0],
        [480, GY, 'runner', 420, 760],
        [620, MY, 'nade', 620, 770],
        [780, HY, 'flyer', 700, 900],
        [980, GY, 'turret', 0, 0],
        [1120, MY, 'grunt', 960, 1110],
        [1260, HY, 'mortar', 0, 0],
        [1400, GY, 'runner', 980, 1500],
        [1560, MY, 'turret', 0, 0],
        [1720, GY, 'nade', 1680, 1980],
        [1880, HY, 'flyer', 1620, 1860],
        [2040, GY, 'turret', 0, 0],
        [2180, MY, 'grunt', 2040, 2200],
        [2340, GY, 'runner', 2360, 2780],
        [2480, MY, 'mortar', 0, 0],
        [2620, HY, 'turret', 0, 0],
        [2760, GY, 'grunt', 2360, 2920]
      ],
      pows: [[280, GY, 'nade'], [860, MY, 'hp'], [1500, GY, 'H'], [1980, MY, 'nade'], [2580, GY, 'hp']],
      slugs: [[740, GY], [1920, GY]],
      drops: [[1740, HY, 'H'], [2300, MY, 'nade']],
      crates: [[560, GY], [1340, GY], [2200, GY]]
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
  function spdMul(alley, stage) {
    return (alley ? 1.18 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 2) throw new Error('player hp');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (NADE_ALLEY <= NADE_FRONT) throw new Error('alley more nades');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('alley faster');
    if (BEST_KEY !== 'playbox-slug-run-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      if (!s.pows.length) throw new Error('pows ' + s.name);
      if (!s.slugs.length) throw new Error('slug ' + s.name);
    }
    if (!WEAPONS.H || WEAPONS.H.cd >= WEAPONS.pistol.cd) throw new Error('heavy faster');
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
  const btnFront = document.getElementById('btn-front');
  const btnAlley = document.getElementById('btn-alley');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeFront = document.getElementById('mode-front');
  const modeAlley = document.getElementById('mode-alley');
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
  const nadeLabel = document.getElementById('nade-label');
  const gunLabel = document.getElementById('gun-label');
  const hpWrap = document.getElementById('hp-wrap');
  const hpBar = document.getElementById('hp-bar');
  const tankWrap = document.getElementById('tank-wrap');
  const tankBar = document.getElementById('tank-bar');
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
  let rumbleT = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false, nade: false };
  const demo = { l: false, r: true, u: false, fire: true, nade: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'front',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2420,
    plats: [],
    ents: [],
    shots: [],
    nades: [],
    pickups: [],
    pows: [],
    slugs: [],
    crates: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_MAX,
    tankHp: 0,
    tankMax: TANK_FRONT,
    inTank: false,
    nadeAmmo: NADE_FRONT,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    weapon: 'pistol',
    fireCd: 0,
    nadeCd: 0,
    cannonT: 0,
    cannonCd: 0,
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
    muzzle: 0,
    rescued: 0
  };

  function isAlley() {
    return G.kind === 'alley';
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
  function nadeHeld() {
    return G.mode === 'title' ? demo.nade : keys.nade;
  }
  function nadeStart() {
    return isAlley() ? NADE_ALLEY : NADE_FRONT;
  }
  function tankMaxHp() {
    return isAlley() ? TANK_ALLEY : TANK_FRONT;
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
      if (kind === 'H' || kind === 'tank') {
        this.beep(980, 0.032, 'square', 0.034, 420);
        this.noise(0.018, 0.018, 1600);
      } else if (kind === 'cannon') {
        this.noise(0.1, 0.06, 220);
        this.beep(160, 0.14, 'sawtooth', 0.055, 50);
      } else if (kind === 'nade') {
        this.beep(240, 0.08, 'square', 0.04, 90);
        this.noise(0.05, 0.03, 400);
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
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.05, 784);
      this.beep(784, 0.1, 'triangle', 0.045, 1046);
      this.beep(1318, 0.16, 'sine', 0.04, 1568);
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
    tankBoom() {
      this.ensure();
      this.noise(0.22, 0.09, 160);
      this.beep(110, 0.28, 'sawtooth', 0.07, 40);
      this.beep(70, 0.36, 'sine', 0.05, 32);
    },
    rumble() {
      if (!this.ctx || this.muted || REDUCE) return;
      const t = this.ctx.currentTime;
      if (t < rumbleT) return;
      rumbleT = t + 0.08;
      this.beep(62, 0.07, 'sawtooth', 0.018, 48);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    hurt() {
      this.ensure();
      this.noise(0.08, 0.045, 500);
      this.beep(220, 0.12, 'sawtooth', 0.04, 90);
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
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    mount() {
      this.ensure();
      this.beep(196, 0.08, 'square', 0.04, 392);
      this.beep(392, 0.12, 'triangle', 0.04, 784);
      this.noise(0.06, 0.03, 200);
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
    const a = isAlley();
    if (modeFront) modeFront.setAttribute('aria-pressed', a ? 'false' : 'true');
    if (modeAlley) modeAlley.setAttribute('aria-pressed', a ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isAlley() ? '巷战 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isAlley() ? '巷战' : '前线';
      tagLabel.classList.toggle('warn', isAlley());
      tagLabel.classList.toggle('hot', !isAlley() && G.stage >= 3);
    }
    if (nadeLabel) {
      nadeLabel.textContent = '弹 ' + G.nadeAmmo;
      nadeLabel.classList.toggle('low', G.nadeAmmo <= 2);
    }
    const gun = G.inTank ? 'tank' : G.weapon;
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[gun] || '手枪';
      gunLabel.className = 'gun' + (gun === 'H' ? ' hot' : gun === 'tank' ? ' tank' : '');
    }
    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    if (hpWrap) hpWrap.classList.toggle('low', G.hp <= 1 && G.mode === 'play');
    if (tankWrap) {
      tankWrap.hidden = !G.inTank;
      tankWrap.classList.toggle('low', G.inTank && G.tankHp <= 2);
    }
    if (tankBar && G.inTank) {
      tankBar.style.transform = 'scaleX(' + clamp(G.tankHp / Math.max(1, G.tankMax), 0, 1) + ')';
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 体力打空丢命，坦克扛打', 'warn');
    else if (G.mode === 'win') setHint('要塞捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · C 丢雷 · 救人补弹', 'warn');
    else if (G.inTank) setHint('坦克 · 空格机枪 · 按住开炮 · C 手雷', 'hot');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('走跳开火 · 走过救人 · 跳进坦克', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SLUG';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '巷战' : '换模式';
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
    if (kind === 'turret') return 5;
    if (kind === 'mortar') return 3;
    if (kind === 'flyer') return 1;
    if (kind === 'crate') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const w = kind === 'turret' || kind === 'mortar' ? 18 : kind === 'crate' ? 16 : 14;
    const h = kind === 'turret' || kind === 'mortar' ? 18 : kind === 'flyer' ? 12 : kind === 'crate' ? 16 : 24;
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 1), fire: rand(0.3, 1.1),
      grounded: kind !== 'flyer',
      dead: false, hitN: 0, w: w, h: h
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isAlley() ? 1.15 : 1)) | 0;
    return {
      id: uid++,
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.2, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 42, h: 46, name: spec.boss
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = isAlley() ? (spec.w * 0.86) | 0 : spec.w;
    G.plats = [];
    let i, g, p;
    const stretch = G.levelW / spec.w;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0] * stretch, GY, g[1] * stretch, true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0] * stretch, p[1], p[2] * (isAlley() ? 0.92 : 1), false));
    }
    if (isAlley()) {
      for (i = 0; i < spec.plats.length; i++) {
        if (i % 2) continue;
        p = spec.plats[i];
        const yy = p[1] === HY ? MY : HY;
        G.plats.push(makePlat(p[0] * stretch + 70, yy, 90, false));
      }
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0] * stretch, e[1], e[2], e[3] * stretch, e[4] * stretch));
    }
    if (isAlley() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'turret' || e[2] === 'mortar' || e[2] === 'flyer') continue;
        G.ents.push(makeEnt(e[0] * stretch + 40, e[1], e[2], e[3] * stretch, e[4] * stretch));
      }
    }
    G.crates = [];
    if (spec.crates) {
      for (i = 0; i < spec.crates.length; i++) {
        const c = spec.crates[i];
        G.ents.push(makeEnt(c[0] * stretch, c[1], 'crate', 0, 0));
      }
    }
    G.pows = [];
    for (i = 0; i < spec.pows.length; i++) {
      const pw = spec.pows[i];
      G.pows.push({
        id: uid++, x: pw[0] * stretch, y: pw[1], drop: pw[2] || 'nade',
        rescued: false, t: 0, hop: 0, gone: false
      });
    }
    G.slugs = [];
    for (i = 0; i < spec.slugs.length; i++) {
      const sl = spec.slugs[i];
      G.slugs.push({ x: sl[0] * stretch, y: sl[1], taken: false, t: 0 });
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0] * stretch, y: d[1] - 20, kind: d[2], taken: false, t: 0 });
      }
    }
    G.shots = [];
    G.nades = [];
    G.boss = makeBoss({
      name: spec.boss, boss: spec.boss, w: G.levelW, hp: spec.hp
    });
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.inTank = false;
    G.tankHp = 0;
    G.tankMax = tankMaxHp();
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.nadeCd = 0;
    G.cannonT = 0;
    G.cannonCd = 0;
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
    if (G.inTank) {
      return { x: p.x - 20, y: p.y - 28, w: 40, h: 28 };
    }
    const h = p.duck ? 14 : p.h;
    return { x: p.x - p.w * 0.42, y: p.y - h, w: p.w * 0.84, h: h * 0.92 };
  }

  function getAim(p) {
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (p.grounded) {
      if (p.duck && !G.inTank) {
        dy = 0;
        if (!dx) dx = p.face;
      } else if (inU() && !G.inTank) {
        dy = -1;
      }
    } else if (!G.inTank) {
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

  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.inTank && G.cannonT >= 0.3) return;
    if (G.fireCd > 0) return;
    const kind = G.inTank ? 'tank' : G.weapon;
    const wpn = WEAPONS[kind] || WEAPONS.pistol;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = getAim(p);
    const ox0 = p.x + aim.dx * (G.inTank ? 26 : 16);
    const oy0 = p.y - (G.inTank ? 20 : (p.duck ? 11 : 18)) + aim.dy * 6;
    spawnShot({
      x: ox0, y: oy0,
      vx: aim.dx * wpn.spd,
      vy: aim.dy * wpn.spd,
      from: 'p',
      kind: kind,
      dmg: wpn.dmg,
      pierce: 0,
      life: wpn.life,
      rgb: wpn.rgb,
      hit: []
    });
    G.fireCd = wpn.cd;
    G.muzzle = 0.05;
    p.pose = 0.1;
    if (playing()) audio.shot(kind);
    emit(4, {
      x: ox0, y: oy0, j: 4,
      vx0: aim.dx * 40, vx1: aim.dx * 180,
      vy0: aim.dy * 80 - 40, vy1: aim.dy * 80 + 40,
      life: 0.16, r0: 1, r1: 2.2, rgb: wpn.rgb, g: 80
    });
  }

  function fireCannon() {
    if (!G.inTank || G.cannonCd > 0 || G.deadT > 0) return;
    const p = G.player;
    const aim = getAim(p);
    const ox0 = p.x + p.face * 30;
    const oy0 = p.y - 18;
    spawnShot({
      x: ox0, y: oy0,
      vx: p.face * 420 + aim.dx * 40,
      vy: -40 + aim.dy * 80,
      from: 'p',
      kind: 'cannon',
      dmg: 4,
      pierce: 0,
      life: 1.1,
      rgb: ORG,
      hit: [],
      grav: 280,
      boom: true
    });
    G.cannonCd = 0.52;
    G.cannonT = 0;
    G.muzzle = 0.1;
    if (playing()) audio.shot('cannon');
    emit(10, {
      x: ox0, y: oy0, j: 6,
      vx0: p.face * 80, vx1: p.face * 260,
      vy0: -80, vy1: 40,
      life: 0.22, r0: 1.4, r1: 3.2, rgb: ORG, g: 80
    });
    kick(3.4, 'boom');
    hitStop(0.055);
    screenFlash(ORG, 0.22);
  }

  function throwNade() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!playing() && G.mode !== 'title') return;
    if (G.nadeCd > 0) return;
    if (G.nadeAmmo <= 0 && playing()) {
      toast('没雷了', true, false);
      G.nadeCd = 0.35;
      return;
    }
    const p = G.player;
    const face = p.face;
    G.nades.push({
      x: p.x + face * 10,
      y: p.y - (G.inTank ? 22 : (p.duck ? 12 : 18)),
      vx: face * (G.inTank ? 240 : 190),
      vy: G.inTank ? -220 : -280,
      life: 0.62,
      from: 'p',
      rgb: GOLD
    });
    if (playing()) {
      G.nadeAmmo = Math.max(0, G.nadeAmmo - 1);
      audio.shot('nade');
      syncHud();
    }
    G.nadeCd = 0.42;
    emit(4, {
      x: p.x + face * 10, y: p.y - 16, j: 3,
      vx0: face * 20, vx1: face * 80, vy0: -60, vy1: -10,
      life: 0.16, r0: 1, r1: 2, rgb: GOLD, g: 120
    });
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
      G.weapon = 'H';
      audio.ping();
      toast('重机枪', false, true);
      kick(2.4, 'pickup');
      screenFlash(GOLD, 0.28);
    } else if (kind === 'nade') {
      G.nadeAmmo = Math.min(NADE_MAX, G.nadeAmmo + (isAlley() ? 4 : 3));
      audio.ping();
      toast('手雷 +', false, true);
    } else if (kind === 'hp') {
      G.hp = Math.min(HP_MAX, G.hp + 1);
      audio.ping();
      toast('补给', false, true);
    }
    syncHud();
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({ x: x, y: y, kind: kind, taken: false, t: 0 });
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    giveGun(u.kind);
    juice(u.x, u.y, GOLD, 0.9);
    const name = u.kind === 'H' ? '重机' : u.kind === 'nade' ? '手雷' : 'HP';
    floatText(u.x, u.y - 18, name, GOLD, true);
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

  function explode(x, y, r, dmg, from) {
    boomAt(x, y, from === 'tank' ? 1.8 : 1.15, from === 'tank' ? ORG : GOLD);
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (hypot(e.x - x, (e.y - e.h * 0.5) - y) < r) hurtEnt(e, dmg);
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      e = G.boss;
      if (hypot(e.x - x, (e.y - e.h * 0.5) - y) < r + 10) {
        e.hp -= dmg;
        e.hitN = 0.08;
        if (e.hp <= 0) killBoss();
      }
    }
    if (from !== 'p' && playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const cx = pb.x + pb.w * 0.5;
      const cy = pb.y + pb.h * 0.5;
      if (hypot(cx - x, cy - y) < r * 0.85) hurtPlayer('shot', 1);
    }
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    bumpCombo();
    const base = SCORE[e.kind] || SCORE.grunt;
    const sc = base * G.mult;
    addScore(sc);
    floatText(e.x, e.y - 22, '+' + sc, e.kind === 'crate' ? GOLD : HOT2, e.kind === 'crate');
    juice(e.x, e.y - 10, e.kind === 'turret' || e.kind === 'mortar' ? ORG : HOT, e.kind === 'turret' ? 1.2 : 0.85);
    audio.hit(G.combo);
    hitStop(e.kind === 'turret' || e.kind === 'mortar' ? 0.055 : 0.038);
    if (e.kind === 'turret' || e.kind === 'mortar') boomAt(e.x, e.y - 8, 1.1, ORG);
    if (e.kind === 'crate') spawnPickup(e.x, e.y - 18, 'nade');
  }

  function hurtEnt(e, dmg) {
    if (!e || e.dead) return false;
    if (e.hitN > 0 && e.kind !== 'turret' && e.kind !== 'mortar' && e.kind !== 'crate') return false;
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

  function killBoss() {
    const e = G.boss;
    if (!e || e.dead) return;
    e.dead = true;
    e.active = false;
    bumpCombo();
    const sc = SCORE.boss * G.mult;
    addScore(sc);
    addScore(SCORE.stage * G.stage);
    floatText(e.x, e.y - 40, '+' + sc, GOLD, true);
    boomAt(e.x, e.y - 20, 1.8, GOLD);
    juice(e.x, e.y - 16, HOT, 1.6);
    hitStop(0.08);
    toast(e.name + ' 击破', false, true);
    G.lock = 0.2;
    G.clearT = 2.05;
  }

  function explodeTank() {
    if (!G.inTank) return;
    const p = G.player;
    G.inTank = false;
    G.tankHp = 0;
    G.invuln = 1.25;
    boomAt(p.x, p.y - 16, 2.1, ORG);
    audio.tankBoom();
    hitStop(0.078);
    kick(7.2, 'boom');
    screenFlash(ORG, 0.5);
    explode(p.x, p.y - 12, 64, 4, 'p');
    p.vy = -260;
    p.grounded = false;
    floatText(p.x, p.y - 30, '弹出', GOLD, true);
    toast('坦克炸了', true, false);
    syncHud();
  }

  function mountTank(sl) {
    if (G.inTank || sl.taken || G.deadT > 0) return;
    sl.taken = true;
    G.inTank = true;
    G.tankMax = tankMaxHp();
    G.tankHp = G.tankMax;
    G.player.duck = false;
    G.player.h = PH;
    audio.mount();
    toast('上车 · 按住空格开炮', false, true);
    kick(2.6, 'pickup');
    screenFlash(LEAF, 0.28);
    juice(sl.x, sl.y - 10, LEAF, 1.0);
    floatText(sl.x, sl.y - 24, 'SLUG', LEAF, true);
    syncHud();
  }

  function rescuePow(pw) {
    if (pw.rescued || pw.gone) return;
    pw.rescued = true;
    pw.hop = 0.9;
    G.rescued += 1;
    bumpCombo();
    const sc = SCORE.pow * G.mult;
    addScore(sc);
    floatText(pw.x, pw.y - 28, 'POW!', GOLD, true);
    juice(pw.x, pw.y - 12, GOLD, 1.15);
    popSpark(pw.x, pw.y - 16, GOLD, 22);
    audio.pow();
    hitStop(0.05);
    kick(2.8, 'pickup');
    screenFlash(GOLD, 0.32);
    if (pw.drop) {
      spawnPickup(pw.x, pw.y - 22, pw.drop);
    }
    toast('人质获救', false, true);
    syncHud();
  }

  function hurtPlayer(why, dmg) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    if (G.inTank) {
      G.tankHp -= dmg || 1;
      G.invuln = 0.35;
      audio.hurt();
      kick(3.2, 'hit');
      hitStop(0.04);
      emit(8, {
        x: G.player.x, y: G.player.y - 16, j: 8,
        vx0: -120, vx1: 120, vy0: -180, vy1: -20,
        life: 0.22, r0: 1, r1: 2.6, rgb: ORG, g: 200
      });
      syncHud();
      if (G.tankHp <= 0) explodeTank();
      return;
    }
    G.hp -= dmg || 1;
    G.invuln = 0.95;
    G.why = why || 'hit';
    kick(3.6, 'hit');
    hitStop(0.05);
    audio.hurt();
    juice(G.player.x, G.player.y - 14, MAG, 0.7);
    syncHud();
    if (G.hp <= 0) die(why);
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.weapon = 'pistol';
    G.inTank = false;
    G.tankHp = 0;
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

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.weapon = 'pistol';
    G.hp = HP_MAX;
    G.inTank = false;
    G.tankHp = 0;
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    toast('重生', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入坑里了' : G.why === 'touch' ? '撞上了' : '体力打空了';
    showOverlay('lose', '被击中了', why + '。连击 ×' + G.maxCombo + ' · 救人 ' + G.rescued + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isAlley() ? 6000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isAlley() ? '巷战清扫' : '要塞捣毁了',
      (isAlley() ? '巷战打穿三关。' : '前线打穿要塞。') + G.score + ' 分 · 救人 ' + G.rescued + ' · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    const keepN = G.nadeAmmo;
    const keepHp = G.hp;
    const keepTank = G.inTank;
    const keepThp = G.tankHp;
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.nadeAmmo = keepN;
    G.hp = keepHp;
    G.inTank = keepTank;
    G.tankHp = keepThp;
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'alley' ? 'alley' : 'front';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'pistol';
    G.nadeAmmo = nadeStart();
    G.inTank = false;
    G.tankHp = 0;
    G.rescued = 0;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isAlley() ? '巷战' : STAGES[0].name, false, !isAlley());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'front';
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'pistol';
    G.nadeAmmo = NADE_FRONT;
    G.rescued = 0;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '合金', '侧向跑跳开火。救人、开车、丢雷，打到关底。<br />坦克扛打，炸了弹出；人质走过即救。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('front');
    else startGame(G.kind || 'front');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('front');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.fire = true;
    demo.nade = ((G.clock * 2) | 0) % 7 === 0 && G.nadeCd <= 0;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    if (p.x > G.levelW - 280) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.inTank = false;
      G.weapon = 'pistol';
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

    p.duck = !!(p.grounded && inD() && !inU() && !G.inTank);
    p.h = p.duck ? 14 : PH;

    const walk = G.inTank ? 168 : WALK;
    const spd = walk * (p.grounded ? (p.duck ? 0.55 : 1) : AIR);
    p.vx = (p.duck ? 0 : ax * spd);
    if (!p.duck) p.x += p.vx * dt;
    p.x = clamp(p.x, 18, G.levelW - 18);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (inU() && !p.duck) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = (p.grounded || p.coyote > 0) && !p.duck;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = G.inTank ? -JUMP_V * 0.78 : -JUMP_V;
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

    if (p.y > VH + 90) {
      if (G.inTank) {
        explodeTank();
        p.y = GY;
        p.vy = -200;
      } else die('fall');
    }

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded && !p.duck) p.run += dt * (G.inTank ? 14 : 10);
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (G.inTank && ax && p.grounded && playing()) audio.rumble();
    if (G.inTank && ax && p.grounded) {
      emit(1, {
        x: p.x - p.face * 16, y: p.y - 2, j: 3,
        vx0: -p.face * 20, vx1: -p.face * 60, vy0: -20, vy1: 10,
        life: 0.18, r0: 1.2, r1: 2.6, rgb: SAND, g: 80
      });
    }

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.nadeCd > 0) G.nadeCd -= dt;
    if (G.cannonCd > 0) G.cannonCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;

    if (G.inTank) {
      if (fireHeld()) {
        G.cannonT += dt;
        if (G.cannonT >= 0.3 && G.cannonCd <= 0) fireCannon();
        else if (G.cannonT < 0.3) tryShoot();
      } else {
        G.cannonT = 0;
      }
    } else if (fireHeld()) {
      G.cannonT = 0;
      tryShoot();
    } else G.cannonT = 0;

    if (nadeHeld() && G.nadeCd <= 0) throwNade();

    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (hypot(p.x - u.x, (p.y - 14) - u.y) < 22) takePickup(u);
    }
    for (i = 0; i < G.pows.length; i++) {
      const pw = G.pows[i];
      if (pw.rescued || pw.gone) continue;
      if (hypot(p.x - pw.x, p.y - pw.y) < (G.inTank ? 28 : 18)) rescuePow(pw);
    }
    if (!G.inTank) {
      for (i = 0; i < G.slugs.length; i++) {
        const sl = G.slugs[i];
        if (sl.taken) continue;
        sl.t += dt;
        if (hypot(p.x - sl.x, p.y - sl.y) < 22) mountTank(sl);
      }
    }

    if (G.invuln > 0) return;

    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'flyer' || e.kind === 'crate') continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        hurtPlayer('touch', 1);
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h * 0.9)) {
        hurtPlayer('touch', 1);
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

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isAlley(), G.stage);
    const p = G.player;
    if (!onScreen(e.x, e.y, 80) && e.kind !== 'flyer') return;

    if (e.kind === 'crate') return;

    if (e.kind === 'flyer') {
      e.x += (e.face || -1) * 52 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = HY - 28 + Math.sin(e.t * 2.4) * 16;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0) {
        e.fire = (isAlley() ? 1.05 : 1.45) / mul;
        enemyShoot(e, 0, 1, 220, 'e');
      }
      return;
    }

    if (e.kind === 'turret' || e.kind === 'mortar') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 360) {
        const aim = aimAtPlayer(e);
        if (e.kind === 'turret') {
          e.fire = (isAlley() ? 0.78 : 1.05) / mul;
          enemyShoot(e, aim.dx, aim.dy, 250, 'e');
        } else {
          e.fire = (isAlley() ? 1.25 : 1.7) / mul;
          spawnShot({
            x: e.x, y: e.y - 16,
            vx: e.face * 150,
            vy: -260,
            from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
            life: 1.6, rgb: ORG, hit: [], grav: 520
          });
        }
      }
      return;
    }

    const walk = (e.kind === 'runner' ? 92 : 48) * mul;
    if (e.kind === 'runner' && Math.abs(p.x - e.x) < 220 && playing()) {
      e.face = p.x < e.x ? -1 : 1;
    } else {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    const step = walk * (e.kind === 'runner' && Math.abs(p.x - e.x) < 220 ? 1.35 : 1) * dt;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * step;
    e.fire -= dt;
    if (playing() && G.deadT <= 0 && e.fire <= 0) {
      if (e.kind === 'grunt' && Math.abs(p.x - e.x) < 280 && Math.abs(p.y - e.y) < 50) {
        e.fire = (isAlley() ? 1.05 : 1.5) / mul;
        e.face = p.x < e.x ? -1 : 1;
        enemyShoot(e, e.face, 0, 260, 'e');
      } else if (e.kind === 'nade' && Math.abs(p.x - e.x) < 300) {
        e.fire = (isAlley() ? 1.4 : 1.9) / mul;
        e.face = p.x < e.x ? -1 : 1;
        G.nades.push({
          x: e.x + e.face * 8, y: e.y - 18,
          vx: e.face * 140, vy: -240, life: 0.7, from: 'e', rgb: MAG
        });
      } else e.fire = 0.35;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.levelW - 420) {
        b.active = true;
        audio.boss();
        toast(b.name + ' 现身', false, true);
        screenFlash(HOT, 0.3);
        kick(3.2, 'boom');
      }
      return;
    }
    b.t += dt;
    const mul = spdMul(isAlley(), G.stage);
    const low = b.hp / b.max < 0.45;
    if (b.kind === '沙甲') {
      b.x = G.levelW - 150 + Math.sin(b.t * 0.7) * 28;
      b.y = GY;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.5 : 0.82) / mul;
        enemyShoot(b, p.x - b.x, (p.y - 16) - (b.y - 20), 240, 'e');
        spawnShot({
          x: b.x - 22, y: b.y - 18,
          vx: -280, vy: -30,
          from: 'e', kind: 'cannon', dmg: 1, pierce: 0,
          life: 1.4, rgb: ORG, hit: []
        });
        if (low) enemyShoot(b, -1, -0.3, 260, 'e');
      }
    } else if (b.kind === '城门') {
      b.x = G.levelW - 140;
      b.y = GY;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.4 : 0.68) / mul;
        const high = ((b.t * 2) | 0) % 2 === 0;
        spawnShot({
          x: b.x - 18, y: b.y - (high ? 38 : 14),
          vx: -300, vy: high ? -30 : 16,
          from: 'e', kind: 'e', dmg: 1, pierce: 0,
          life: 1.5, rgb: MAG, hit: []
        });
        if (low) {
          enemyShoot(b, p.x - b.x, (p.y - 16) - (b.y - 20), 230, 'e');
          spawnShot({
            x: b.x - 10, y: b.y - 24,
            vx: -160, vy: -280,
            from: 'e', kind: 'bomb', dmg: 1, pierce: 0,
            life: 1.7, rgb: ORG, hit: [], grav: 520
          });
        }
      }
    } else {
      b.x = G.levelW - 170 + Math.sin(b.t * 0.8) * 40;
      b.y = GY - 10 + Math.sin(b.t * 1.3) * 24;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.36 : 0.58) / mul;
        const n = low ? 8 : 6;
        let i;
        for (i = 0; i < n; i++) {
          const a = b.t * 1.7 + i * TAU / n;
          spawnShot({
            x: b.x, y: b.y - 24,
            vx: Math.cos(a) * 210,
            vy: Math.sin(a) * 210,
            from: 'e', kind: 'e', dmg: 1, pierce: 0,
            life: 1.6, rgb: MAG, hit: []
          });
        }
      }
    }
  }

  function updateNades(dt) {
    let i, n, j, e;
    for (i = G.nades.length - 1; i >= 0; i--) {
      n = G.nades[i];
      n.life -= dt;
      n.vy += 780 * dt;
      n.x += n.vx * dt;
      const y0 = n.y;
      const y1 = n.y + n.vy * dt;
      let boom = n.life <= 0;
      const plat = landOn(n.x, y0, y1, null);
      if (plat) {
        n.y = plat.y - 4;
        boom = true;
      } else n.y = y1;
      if (!boom && n.from === 'p') {
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          if (hypot(e.x - n.x, (e.y - e.h * 0.5) - n.y) < 16) {
            boom = true;
            break;
          }
        }
        if (!boom && G.boss && G.boss.active && !G.boss.dead) {
          if (hypot(G.boss.x - n.x, (G.boss.y - 20) - n.y) < 24) boom = true;
        }
      }
      if (boom) {
        explode(n.x, n.y, n.from === 'p' ? 46 : 38, n.from === 'p' ? 3 : 1, n.from);
        G.nades.splice(i, 1);
      } else if (!onScreen(n.x, n.y, 80)) {
        G.nades.splice(i, 1);
      }
    }
  }

  function shotHits(s, x, y, w, h) {
    const r = s.kind === 'cannon' ? 10 : 5;
    return overlap(s.x - r, s.y - r, r * 2, r * 2, x - w * 0.5, y - h, w, h);
  }

  function updateShots(dt) {
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'cannon' && s.from === 'p') {
        emit(1, {
          x: s.x, y: s.y, j: 2,
          vx0: -20, vx1: 20, vy0: -20, vy1: 10,
          life: 0.14, r0: 1.4, r1: 2.8, rgb: ORG, g: 40
        });
      }
      if (s.life <= 0 || !onScreen(s.x, s.y, 80)) {
        if (s.boom && s.from === 'p') explode(s.x, s.y, 42, s.dmg, 'p');
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
            if (s.boom) {
              explode(s.x, s.y, 42, s.dmg, 'p');
              hit = true;
              break;
            }
            hurtEnt(e, s.dmg);
            hit = true;
            hitStop(0.032);
            break;
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active && s.hit.indexOf(G.boss.id) < 0) {
          e = G.boss;
          if (shotHits(s, e.x, e.y, e.w + 8, e.h + 6)) {
            s.hit.push(e.id);
            if (s.boom) {
              explode(s.x, s.y, 42, s.dmg, 'p');
              hit = true;
            } else {
              e.hp -= s.dmg;
              e.hitN = 0.07;
              audio.hit(G.combo);
              emit(6, {
                x: s.x, y: s.y, j: 6,
                vx0: -120, vx1: 120, vy0: -180, vy1: -20,
                life: 0.2, r0: 1, r1: 2.6, rgb: GOLD, g: 200
              });
              hitStop(0.04);
              hit = true;
              if (e.hp <= 0) killBoss();
            }
          }
        }
        if (hit) {
          G.shots.splice(i, 1);
          continue;
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        const r = s.kind === 'bomb' || s.kind === 'cannon' ? 8 : 4.5;
        if (overlap(s.x - r, s.y - r, r * 2, r * 2, pb.x, pb.y, pb.w, pb.h)) {
          G.shots.splice(i, 1);
          hurtPlayer('shot', 1);
        }
      }
    }
  }

  function updatePows(dt) {
    for (let i = 0; i < G.pows.length; i++) {
      const pw = G.pows[i];
      pw.t += dt;
      if (pw.rescued && pw.hop > 0) {
        pw.hop -= dt;
        if (pw.hop <= 0) pw.gone = true;
      }
    }
    for (let i = 0; i < G.slugs.length; i++) G.slugs[i].t += dt;
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

    const need = REDUCE ? 8 : 22;
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
    updatePows(dt);
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateNades(dt);
    updateCam(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'fort') {
      g.addColorStop(0, '#0c1008');
      g.addColorStop(0.55, '#101408');
      g.addColorStop(1, '#181808');
    } else if (spec.theme === 'city') {
      g.addColorStop(0, '#0c1014');
      g.addColorStop(0.5, '#101418');
      g.addColorStop(1, '#14180c');
    } else {
      g.addColorStop(0, '#141808');
      g.addColorStop(0.5, '#1c1c0c');
      g.addColorStop(1, '#242010');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 48);
    ctx.fillStyle = rgba(GOLD, isAlley() ? 0.38 : 0.55);
    ctx.beginPath();
    ctx.arc(mx, my, 22 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.16);
    ctx.beginPath();
    ctx.arc(mx - 6 * scale, my - 4 * scale, 9 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.32;
    const base = sy(GY + 6);
    let i, x, h, w;
    for (i = -2; i < 24; i++) {
      x = sx((Math.floor((G.camX + par) / 64) + i) * 64 - par);
      h = (30 + hash2(i + 17 + G.stage * 9) * 90) * scale;
      w = (28 + hash2(i + 5) * 26) * scale;
      if (spec.theme === 'fort') {
        ctx.fillStyle = i % 3 === 0 ? '#14180c' : '#0c1008';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = hash2(i + 3) > 0.55 ? rgba(HOT, 0.28) : rgba(CYN, 0.16);
        ctx.fillRect(x + 6 * scale, base - h + 10 * scale, 4 * scale, 5 * scale);
        ctx.fillRect(x + 16 * scale, base - h + 22 * scale, 4 * scale, 5 * scale);
      } else if (spec.theme === 'city') {
        ctx.fillStyle = i % 2 ? '#101418' : '#0c1014';
        ctx.fillRect(x, base - h, w * 1.1, h + 40 * scale);
        ctx.fillStyle = rgba(CYN, 0.18);
        ctx.fillRect(x + 5 * scale, base - h + 12 * scale, 5 * scale, 6 * scale);
        ctx.fillStyle = rgba(HOT, 0.16);
        ctx.fillRect(x + 16 * scale, base - h + 28 * scale, 5 * scale, 6 * scale);
      } else {
        ctx.fillStyle = i % 2 ? '#1c2010' : '#18180c';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(LEAF, 0.2);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, base - h + 8 * scale, 9 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(SAND, 0.35);
        ctx.fillRect(x + w * 0.42, base - h + 10 * scale, 3 * scale, h * 0.4);
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(WHT, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPit() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 10);
    ctx.fillStyle = rgba(SAND, 0.12);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    ctx.fillStyle = rgba(HOT, 0.08);
    let x, covered;
    for (x = G.camX; x < G.camX + VW; x += 18) {
      covered = false;
      for (let i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered) continue;
      ctx.fillRect(sx(x), sy(GY + 4), 14 * scale, 8 * scale);
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
        ? (spec.theme === 'fort' ? '#18180c' : spec.theme === 'city' ? '#141810' : '#242818')
        : '#1c2010';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? SAND : HOT, p.base ? 0.85 : 0.7);
      if (spec.theme === 'fort') ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.22);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(LEAF, 0.18) : rgba(SAND, 0.28);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 5 * scale);
        }
      }
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.save();
    ctx.translate(x, y);
    const a = Math.atan2(s.vy, s.vx);
    ctx.rotate(a);
    if (s.kind === 'cannon' || s.kind === 'bomb') {
      ctx.fillStyle = rgba(s.rgb || ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, (s.kind === 'cannon' ? 5.6 : 4.4) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(-1 * scale, -1 * scale, 2.2 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-3.5 * scale, -1.6 * scale, 10 * scale, 3.2 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(1 * scale, -0.8 * scale, 5 * scale, 1.6 * scale);
    }
    ctx.restore();
  }

  function drawNade(n) {
    const x = sx(n.x);
    const y = sy(n.y);
    ctx.fillStyle = rgba(n.rgb || GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 4.4 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(LEAF, 0.9);
    ctx.fillRect(x - 1.2 * scale, y - 7 * scale, 2.4 * scale, 3.2 * scale);
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(x - 1.2 * scale, y - 1.2 * scale, 1.4 * scale, 0, TAU);
    ctx.fill();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 4 + u.t) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    const rgb = u.kind === 'H' ? HOT : u.kind === 'hp' ? MAG : GOLD;
    const label = u.kind === 'H' ? 'H' : u.kind === 'hp' ? '+' : 'C';
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.fillStyle = '#141808';
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5 * scale);
  }

  function drawSoldier(p, rgb, opt) {
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
    ctx.strokeStyle = rgba(BLU, 0.95);
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
    ctx.fillStyle = rgba(GOLD, 0.4);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, 2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 12) * s, 5.2 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(opt.helm || SAND, 0.95);
    ctx.fillRect(-5.6 * s, -(bodyH + 16) * s, 11.2 * s, 4.2 * s);
    if (opt.scarf) {
      ctx.strokeStyle = rgba(MAG, 0.95);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(-5 * s, -(bodyH + 8) * s);
      ctx.lineTo(-10 * s, -(bodyH + 2) * s);
      ctx.stroke();
    }
    const ldx = aim.dx * p.face;
    const ldy = aim.dy;
    ctx.strokeStyle = rgba(WHT, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -(bodyH + 2) * s);
    ctx.lineTo((2 + ldx * 11) * s, (-(bodyH + 2) + ldy * 11) * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(HOT, 0.95);
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

  function drawTank(x, y, face, opt) {
    const s = scale;
    const flash = opt.hit && ((G.t * 24) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(face, 1);
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(OLIVE, 0.96);
    ctx.fillRect(-22 * s, -22 * s, 44 * s, 18 * s);
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(-22 * s, -24 * s, 44 * s, 2.4 * s);
    ctx.fillStyle = '#141810';
    ctx.fillRect(-20 * s, -8 * s, 40 * s, 8 * s);
    const spin = (opt.run || 0) * 0.4;
    let k;
    for (k = 0; k < 4; k++) {
      const tx = -14 + k * 9;
      ctx.fillStyle = '#2a2e24';
      ctx.beginPath();
      ctx.arc(tx * s, -2 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT2, 0.5);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(tx * s, -2 * s, 3 * s, spin, spin + 2);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(SAND, 0.95);
    ctx.fillRect(8 * s, -20 * s, 22 * s, 4.2 * s);
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(26 * s, -19.2 * s, 6 * s, 2.6 * s);
    if (opt.muzzle) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(34 * s, -18 * s, 5 * s, 0, TAU);
      ctx.fill();
    }
    if (opt.head) {
      ctx.fillStyle = rgba(SKIN, 0.95);
      ctx.beginPath();
      ctx.arc(-4 * s, -28 * s, 4.4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(SAND, 0.95);
      ctx.fillRect(-8 * s, -34 * s, 9 * s, 3.2 * s);
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(-8 * s, -26 * s);
      ctx.lineTo(-13 * s, -22 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPow(pw) {
    if (pw.gone) return;
    const bob = pw.rescued ? Math.sin((0.9 - pw.hop) * 18) * 10 : Math.sin(pw.t * 3) * 1.5;
    const x = sx(pw.x);
    const y = sy(pw.y - bob);
    if (pw.rescued) {
      ctx.fillStyle = rgba(GOLD, 0.25);
      ctx.beginPath();
      ctx.arc(x, y - 16 * scale, 14 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.arc(x, y - 20 * scale, 4.2 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(x - 5 * scale, y - 16 * scale, 10 * scale, 10 * scale);
    if (!pw.rescued) {
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 6 * scale, y - 12 * scale);
      ctx.lineTo(x + 6 * scale, y - 12 * scale);
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.font = 'bold ' + (7 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POW', x, y - 28 * scale);
    } else {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x, y - 30 * scale);
    }
    ctx.fillStyle = rgba(SKIN, 0.9);
    ctx.fillRect(x - 6 * scale, y - 6 * scale, 3 * scale, 6 * scale);
    ctx.fillRect(x + 3 * scale, y - 6 * scale, 3 * scale, 6 * scale);
  }

  function drawSlugParked(sl) {
    if (sl.taken) return;
    const bob = Math.sin(G.clock * 3 + sl.t) * 1.2;
    drawTank(sl.x, sl.y + bob, 1, { run: sl.t * 2, head: false, muzzle: false, hit: false });
    ctx.fillStyle = rgba(HOT, 0.7 + Math.sin(G.clock * 6) * 0.2);
    ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('上车', sx(sl.x), sy(sl.y - 36));
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    if (e.kind === 'crate') {
      ctx.fillStyle = rgba(SAND, 0.95);
      ctx.fillRect(x - 9 * scale, y - 16 * scale, 18 * scale, 16 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.strokeRect(x - 9 * scale, y - 16 * scale, 18 * scale, 16 * scale);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 8 * scale, y - 10 * scale, 16 * scale, 2 * scale);
      return;
    }
    if (e.kind === 'turret' || e.kind === 'mortar') {
      ctx.fillStyle = '#2a3020';
      ctx.fillRect(x - 10 * scale, y - 14 * scale, 20 * scale, 14 * scale);
      ctx.fillStyle = rgba(SAND, 0.85);
      ctx.fillRect(x - 12 * scale, y - 6 * scale, 24 * scale, 6 * scale);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x - 10 * scale, y - 16 * scale, 20 * scale, 2.2 * scale);
      ctx.fillStyle = '#6a7080';
      const a = Math.atan2((G.player.y - 16) - (e.y - 10), G.player.x - e.x);
      ctx.save();
      ctx.translate(x, y - 10 * scale);
      ctx.rotate(a);
      ctx.fillRect(0, -2 * scale, 16 * scale, 4 * scale);
      ctx.restore();
      return;
    }
    if (e.kind === 'flyer') {
      ctx.fillStyle = rgba(OLIVE, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * scale, 12 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 4 * scale, y - 8 * scale, 14 * scale, 2.4 * scale);
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.fillRect(x - 2 * scale, y - 10 * scale, 5 * scale, 3 * scale);
      return;
    }
    const rgb = e.kind === 'runner' ? ORG : e.kind === 'nade' ? MAG : OLIVE;
    drawSoldier(e, rgb, {
      run: e.t * 8, grounded: e.grounded, squash: 1,
      duck: false, aim: { dx: e.face, dy: 0 }, size: 0.92, helm: OLIVE
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
    if (b.kind === '沙甲') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#2a3820';
      ctx.fillRect(x - 36 * scale, y - 40 * scale, 72 * scale, 40 * scale);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(x - 36 * scale, y - 42 * scale, 72 * scale, 3 * scale);
      ctx.fillStyle = '#141810';
      let k;
      for (k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.arc(x + (-22 + k * 14) * scale, y - 4 * scale, 7 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = rgba(SAND, 0.95);
      ctx.fillRect(x - 44 * scale, y - 28 * scale, 22 * scale, 6 * scale);
      ctx.fillStyle = rgba(GOLD, 0.8 + Math.sin(G.clock * 8) * 0.15);
      ctx.fillRect(x - 8 * scale, y - 32 * scale, 12 * scale, 8 * scale);
    } else if (b.kind === '城门') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#242818';
      ctx.fillRect(x - 34 * scale, y - 62 * scale, 68 * scale, 62 * scale);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x - 34 * scale, y - 64 * scale, 68 * scale, 3 * scale);
      ctx.fillStyle = '#0a0c06';
      ctx.fillRect(x - 16 * scale, y - 40 * scale, 22 * scale, 22 * scale);
      ctx.fillStyle = '#6a7080';
      ctx.fillRect(x - 40 * scale, y - 48 * scale, 22 * scale, 6 * scale);
      ctx.fillRect(x - 40 * scale, y - 22 * scale, 22 * scale, 6 * scale);
    } else {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(OLIVE, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 30 * scale, 28 * scale, 24 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(x - 6 * scale, y - 32 * scale, 9 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x - 8 * scale, y - 34 * scale, 3.4 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#141810';
      ctx.fillRect(x - 18 * scale, y - 10 * scale, 36 * scale, 10 * scale);
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
    ctx.fillStyle = '#080c04';
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
    drawPit();
    drawPlats();

    let i;
    for (i = 0; i < G.slugs.length; i++) drawSlugParked(G.slugs[i]);
    for (i = 0; i < G.pows.length; i++) drawPow(G.pows[i]);
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    for (i = 0; i < G.nades.length; i++) drawNade(G.nades[i]);

    if (G.player && G.deadT <= 0) {
      if (G.inTank) {
        drawTank(G.player.x, G.player.y, G.player.face, {
          run: G.player.run,
          head: true,
          muzzle: G.muzzle > 0,
          hit: G.invuln > 0 && G.mode === 'play' && ((G.t * 18) | 0) % 2 === 0
        });
      } else {
        drawSoldier(G.player, BLU, {
          run: G.player.run,
          grounded: G.player.grounded,
          squash: G.player.squash,
          duck: G.player.duck,
          aim: getAim(G.player),
          muzzle: G.muzzle > 0,
          blink: G.invuln > 0 && G.mode === 'play',
          scarf: true,
          helm: SAND
        });
      }
    }

    drawFx();
    drawBossBar();

    if (G.inTank && G.cannonT > 0.08 && playing()) {
      const t = clamp((G.cannonT - 0.08) / 0.22, 0, 1);
      const bx = ox + (VW * 0.5 - 40) * scale;
      const by = oy + (VH - 22) * scale;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(bx, by, 80 * scale, 6 * scale);
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.fillRect(bx, by, 80 * scale * t, 6 * scale);
    }

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
    const nadeKey = k === 'c' || k === 'C' || k === 'g' || k === 'G' || k === 'f' || k === 'F';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;
    if (nadeKey) keys.nade = down;

    if (down && (isMove || space || k === 'Enter' || nadeKey)) e.preventDefault();
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
      startGame('front');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('alley');
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
    hold(document.getElementById('btn-nade'), function () { keys.nade = true; }, function () { keys.nade = false; });
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

  if (btnFront) {
    btnFront.addEventListener('click', function () {
      audio.ensure();
      startGame('front');
    });
  }
  if (btnAlley) {
    btnAlley.addEventListener('click', function () {
      audio.ensure();
      startGame('alley');
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
      if (G.mode === 'win') startGame('alley');
      else goTitle();
    });
  }
  if (modeFront) {
    modeFront.addEventListener('click', function () {
      audio.ensure();
      startGame('front');
    });
  }
  if (modeAlley) {
    modeAlley.addEventListener('click', function () {
      audio.ensure();
      startGame('alley');
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
    }
  });

  requestAnimationFrame(frame);
})();
