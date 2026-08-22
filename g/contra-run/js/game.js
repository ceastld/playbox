'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
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
  const INVULN = 1.4;
  const DIE_T = 0.82;
  const BEST_KEY = 'playbox-contra-run-best';
  const MUTE_KEY = 'playbox-contra-run-mute';
  const OPS = 'WASD / 方向键 走跳蹲 · 空格八向开火 · 捡 M/S/L/F · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 46, 10];
  const HOT2 = [255, 106, 58];
  const WHT = [246, 243, 239];
  const LEAF = [61, 255, 122];
  const ORG = [255, 168, 64];
  const BLU = [64, 140, 255];

  const GUN_NAME = { rifle: '步枪', M: '机枪', S: '散弹', L: '激光', F: '火焰' };
  const WEAPONS = {
    rifle: { cd: 0.16, max: 4, spd: 540, dmg: 1, pierce: 0, bounce: 0, spread: 1, life: 0.72, rgb: GOLD },
    M: { cd: 0.062, max: 8, spd: 620, dmg: 1, pierce: 0, bounce: 0, spread: 1, life: 0.62, rgb: HOT2 },
    S: { cd: 0.2, max: 12, spd: 500, dmg: 1, pierce: 0, bounce: 0, spread: 3, life: 0.52, rgb: LEAF },
    L: { cd: 0.09, max: 3, spd: 780, dmg: 1, pierce: 4, bounce: 0, spread: 1, life: 0.42, rgb: CYN },
    F: { cd: 0.26, max: 3, spd: 310, dmg: 2, pierce: 0, bounce: 1, spread: 1, life: 1.7, rgb: ORG }
  };

  const SCORE = {
    grunt: 100, runner: 150, sniper: 200, flyer: 200,
    turret: 300, cannon: 250, falcon: 500, boss: 4000, stage: 2000
  };

  const STAGES = [
    {
      name: '密林', boss: '碉门', w: 2360, hp: 28, theme: 'jungle',
      ground: [[0, 560], [680, 400], [1180, 380], [1680, 680]],
      plats: [
        [160, MY, 150], [420, MY, 170], [860, MY, 160],
        [1320, MY, 180], [1780, MY, 170], [2080, MY, 140],
        [480, HY, 130], [980, HY, 150], [1480, HY, 140], [1920, HY, 130]
      ],
      ents: [
        [280, GY, 'grunt', 40, 540],
        [460, GY, 'grunt', 80, 540],
        [500, MY, 'sniper', 420, 590],
        [780, GY, 'turret', 0, 0],
        [900, 130, 'falcon', 0, 0, 'M'],
        [980, GY, 'runner', 700, 1060],
        [1100, MY, 'grunt', 860, 1020],
        [1240, GY, 'cannon', 0, 0],
        [1360, HY, 'sniper', 980, 1130],
        [1480, GY, 'grunt', 1200, 1540],
        [1580, MY, 'turret', 0, 0],
        [1760, GY, 'runner', 1700, 2100],
        [1880, MY, 'grunt', 1780, 1950],
        [1960, HY, 'flyer', 1860, 2100],
        [2100, GY, 'turret', 0, 0],
        [2160, MY, 'sniper', 2080, 2220]
      ],
      drops: [[1040, MY, 'S']]
    },
    {
      name: '河谷', boss: '双联', w: 2640, hp: 36, theme: 'river',
      ground: [[0, 480], [580, 300], [1000, 360], [1480, 320], [1940, 700]],
      plats: [
        [120, MY, 140], [380, MY, 150], [720, MY, 170],
        [1100, MY, 160], [1520, MY, 180], [1860, MY, 160], [2280, MY, 150],
        [300, HY, 120], [820, HY, 140], [1280, HY, 150],
        [1720, HY, 140], [2140, HY, 160]
      ],
      ents: [
        [220, GY, 'grunt', 20, 460],
        [400, MY, 'sniper', 380, 530],
        [440, HY, 'flyer', 300, 520],
        [700, GY, 'turret', 0, 0],
        [760, MY, 'runner', 720, 890],
        [880, 120, 'falcon', 0, 0, 'L'],
        [1120, GY, 'cannon', 0, 0],
        [1180, MY, 'grunt', 1100, 1260],
        [1320, HY, 'sniper', 1280, 1430],
        [1400, GY, 'runner', 1020, 1340],
        [1580, GY, 'turret', 0, 0],
        [1640, MY, 'grunt', 1520, 1700],
        [1760, HY, 'flyer', 1720, 1860],
        [1980, GY, 'cannon', 0, 0],
        [2040, MY, 'sniper', 1860, 2020],
        [2180, GY, 'runner', 1960, 2500],
        [2320, MY, 'turret', 0, 0],
        [2400, HY, 'sniper', 2140, 2300]
      ],
      drops: [[1600, HY, 'F']]
    },
    {
      name: '要塞', boss: '异核', w: 2920, hp: 48, theme: 'fort',
      ground: [[0, 420], [520, 340], [980, 380], [1480, 300], [1920, 360], [2400, 520]],
      plats: [
        [80, MY, 130], [300, MY, 150], [620, MY, 160],
        [960, MY, 150], [1280, MY, 180], [1680, MY, 160],
        [2040, MY, 170], [2440, MY, 180], [2720, MY, 130],
        [240, HY, 120], [700, HY, 140], [1180, HY, 150],
        [1620, HY, 140], [2100, HY, 160], [2520, HY, 140]
      ],
      ents: [
        [200, GY, 'grunt', 20, 400],
        [340, MY, 'turret', 0, 0],
        [360, HY, 'sniper', 240, 360],
        [620, GY, 'runner', 540, 840],
        [680, MY, 'cannon', 0, 0],
        [760, HY, 'flyer', 700, 840],
        [1040, GY, 'turret', 0, 0],
        [1100, MY, 'grunt', 960, 1110],
        [1220, HY, 'sniper', 1180, 1330],
        [1320, 118, 'falcon', 0, 0, 'S'],
        [1560, GY, 'cannon', 0, 0],
        [1620, MY, 'runner', 1280, 1460],
        [1760, HY, 'flyer', 1620, 1760],
        [1880, GY, 'grunt', 1500, 1760],
        [2080, GY, 'turret', 0, 0],
        [2140, MY, 'sniper', 2040, 2210],
        [2280, HY, 'turret', 0, 0],
        [2480, GY, 'runner', 2420, 2780],
        [2560, MY, 'cannon', 0, 0],
        [2640, HY, 'sniper', 2520, 2660],
        [2760, GY, 'grunt', 2420, 2880]
      ],
      drops: [[1880, MY, 'L'], [2300, HY, 'F']]
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
  function spdMul(assault, stage) {
    return (assault ? 1.32 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function dirs8() {
    const o = [];
    let x, y;
    for (y = -1; y <= 1; y++) {
      for (x = -1; x <= 1; x++) {
        if (!x && !y) continue;
        o.push(norm8(x, y));
      }
    }
    return o;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('assault faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!WEAPONS.M || !WEAPONS.S || !WEAPONS.L || !WEAPONS.F) throw new Error('weapons');
    if (WEAPONS.M.cd >= WEAPONS.rifle.cd) throw new Error('machine faster');
    if (WEAPONS.S.spread < 3) throw new Error('spread');
    if (WEAPONS.L.pierce < 2) throw new Error('laser pierce');
    if (!WEAPONS.F.bounce) throw new Error('fire bounce');
    if (dirs8().length !== 8) throw new Error('8 dirs');
    if (BEST_KEY !== 'playbox-contra-run-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
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
  const btnJungle = document.getElementById('btn-jungle');
  const btnAssault = document.getElementById('btn-assault');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeJungle = document.getElementById('mode-jungle');
  const modeAssault = document.getElementById('mode-assault');
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
  const gunLabel = document.getElementById('gun-label');
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

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: true, u: false, fire: true };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'jungle',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2360,
    plats: [],
    ents: [],
    shots: [],
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
    weapon: 'rifle',
    fireCd: 0,
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
    muzzle: 0
  };

  function isAssault() {
    return G.kind === 'assault';
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
      if (kind === 'L') {
        this.beep(1480, 0.07, 'sawtooth', 0.05, 420);
        this.beep(880, 0.05, 'square', 0.028, 220);
      } else if (kind === 'S') {
        this.noise(0.045, 0.04, 700);
        this.beep(620, 0.06, 'square', 0.04, 240);
      } else if (kind === 'F') {
        this.noise(0.08, 0.05, 280);
        this.beep(220, 0.1, 'sawtooth', 0.045, 90);
      } else if (kind === 'M') {
        this.beep(980, 0.035, 'square', 0.036, 420);
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
    const a = isAssault();
    if (modeJungle) modeJungle.setAttribute('aria-pressed', a ? 'false' : 'true');
    if (modeAssault) modeAssault.setAttribute('aria-pressed', a ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = isAssault() ? '突击 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isAssault() ? '突击' : '丛林';
      tagLabel.classList.toggle('warn', isAssault());
      tagLabel.classList.toggle('hot', !isAssault() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[G.weapon] || '步枪';
      gunLabel.className = 'gun'
        + (G.weapon === 'M' ? ' hot' : '')
        + (G.weapon === 'L' ? ' laser' : '')
        + (G.weapon === 'F' ? ' fire' : '');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 一打即死，丢枪重生', 'warn');
    else if (G.mode === 'win') setHint('要塞捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 八向开火 · 蹲下躲弹', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('走跳蹲 · 空格八向开火 · 捡 M/S/L/F', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'CONTRA';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '突击' : '换模式';
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
    if (kind === 'turret') return 3;
    if (kind === 'cannon') return 2;
    if (kind === 'flyer') return 1;
    return 1;
  }

  function makeEnt(x, y, kind, a, b, extra) {
    const hp = hpOf(kind);
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, gun: extra || '',
      t: rand(0, 1), fire: rand(0.3, 1.1),
      grounded: kind !== 'flyer' && kind !== 'falcon',
      dead: false, hitN: 0,
      w: kind === 'turret' || kind === 'cannon' ? 18 : 14,
      h: kind === 'turret' || kind === 'cannon' ? 18 : (kind === 'falcon' ? 12 : 24)
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isAssault() ? 1.22 : 1)) | 0;
    return {
      id: uid++,
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.2, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 36, h: 42, name: spec.boss
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
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4], e[5]));
    }
    if (isAssault() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'falcon' || e[2] === 'turret' || e[2] === 'cannon') continue;
        const nx = e[0] + 48;
        G.ents.push(makeEnt(nx, e[1], e[2], e[3], e[4], e[5]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0], y: d[1] - 20, kind: d[2], taken: false, t: 0 });
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
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
    const h = p.duck ? 14 : p.h;
    return { x: p.x - p.w * 0.42, y: p.y - h, w: p.w * 0.84, h: h * 0.92 };
  }

  function getAim(p) {
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (p.grounded) {
      if (p.duck) {
        dy = 0;
        if (!dx) dx = p.face;
      } else if (inU()) {
        dy = -1;
      }
    } else {
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
    if (G.shots.length > 90) {
      for (let i = 0; i < G.shots.length && G.shots.length > 72; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 90);
  }

  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const wpn = WEAPONS[G.weapon] || WEAPONS.rifle;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = getAim(p);
    const ox0 = p.x + aim.dx * 16;
    const oy0 = p.y - (p.duck ? 11 : 18) + aim.dy * 6;
    const n = wpn.spread || 1;
    const spread = n > 1 ? 0.36 : 0;
    const base = Math.atan2(aim.dy, aim.dx);
    let i;
    for (i = 0; i < n; i++) {
      const a = n === 1 ? base : base + (i - (n - 1) / 2) * spread;
      spawnShot({
        x: ox0, y: oy0,
        vx: Math.cos(a) * wpn.spd,
        vy: Math.sin(a) * wpn.spd,
        from: 'p',
        kind: G.weapon,
        dmg: wpn.dmg,
        pierce: wpn.pierce,
        bounce: wpn.bounce,
        life: wpn.life,
        rgb: wpn.rgb,
        hit: []
      });
    }
    G.fireCd = wpn.cd;
    G.muzzle = 0.06;
    p.pose = 0.1;
    if (playing()) audio.shot(G.weapon);
    emit(G.weapon === 'S' ? 8 : 4, {
      x: ox0, y: oy0, j: 4,
      vx0: aim.dx * 40, vx1: aim.dx * 180,
      vy0: aim.dy * 80 - 40, vy1: aim.dy * 80 + 40,
      life: 0.16, r0: 1, r1: 2.2, rgb: wpn.rgb, g: 80
    });
    if (G.weapon === 'F') kick(1.4, 'thump');
    else if (G.weapon === 'L') kick(1.1, 'hit');
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
      bounce: 0,
      life: 1.35,
      rgb: HOT,
      hit: []
    });
  }

  function giveGun(kind) {
    G.weapon = kind;
    audio.ping();
    toast(GUN_NAME[kind] || kind, false, true);
    kick(2.4, 'pickup');
    screenFlash(GOLD, 0.28);
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
    floatText(u.x, u.y - 18, GUN_NAME[u.kind], GOLD, true);
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

  function killEnt(e, why) {
    if (e.dead) return;
    e.dead = true;
    bumpCombo();
    const base = SCORE[e.kind] || SCORE.grunt;
    const sc = base * G.mult;
    addScore(sc);
    floatText(e.x, e.y - 22, '+' + sc, e.kind === 'falcon' ? GOLD : HOT2, e.kind === 'falcon');
    juice(e.x, e.y - 10, e.kind === 'falcon' ? GOLD : HOT, e.kind === 'turret' || e.kind === 'cannon' ? 1.2 : 0.85);
    audio.hit(G.combo);
    hitStop(e.kind === 'turret' || e.kind === 'cannon' ? 0.055 : 0.038);
    if (e.kind === 'falcon' && e.gun) spawnPickup(e.x, e.y, e.gun);
    if (e.kind === 'turret' || e.kind === 'cannon') boomAt(e.x, e.y - 8, 1.1, ORG);
  }

  function hurtEnt(e, dmg) {
    if (!e || e.dead) return false;
    if (e.hitN > 0) return false;
    e.hp -= dmg;
    e.hitN = 0.06;
    emit(4, {
      x: e.x, y: e.y - 12, j: 5,
      vx0: -80, vx1: 80, vy0: -160, vy1: -20,
      life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
    });
    if (e.hp <= 0) {
      killEnt(e, 'shot');
      return true;
    }
    return false;
  }

  function die(why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.weapon = 'rifle';
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
    G.weapon = 'rifle';
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    toast('重生', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入河里了' : G.why === 'touch' ? '撞上了' : '中弹了';
    showOverlay('lose', '被击中了', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isAssault() ? 6000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isAssault() ? '突击得手' : '要塞捣毁了',
      (isAssault() ? '突击打穿三关。' : '丛林打穿要塞。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'assault' ? 'assault' : 'jungle';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'rifle';
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isAssault() ? '突击' : STAGES[0].name, false, !isAssault());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'jungle';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'rifle';
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '魂斗', '侧向跑跳，八向开火。一打即死。捡 M 机枪、S 散弹、L 激光、F 火焰。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('jungle');
    else startGame(G.kind || 'jungle');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('jungle');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.fire = true;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    if (p.x > G.levelW - 280) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.weapon = 'rifle';
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

    const standUp = fireHeld() && inU() && !inL() && !inR() && p.grounded && !inD();
    p.duck = !!(p.grounded && inD() && !inU());
    p.h = p.duck ? 14 : PH;

    const spd = WALK * (p.grounded ? (p.duck ? 0.55 : 1) : AIR);
    p.vx = (p.duck ? 0 : ax * spd);
    if (!p.duck) {
      p.x += p.vx * dt;
    }
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (inU() && !p.duck && !standUp) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = (p.grounded || p.coyote > 0) && !p.duck && !standUp;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
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

    if (p.y > VH + 90) die('fall');

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded && !p.duck) p.run += dt * 10;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (fireHeld()) tryShoot();

    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (hypot(p.x - u.x, (p.y - 14) - u.y) < 20) takePickup(u);
    }

    if (G.invuln > 0) return;

    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'falcon') continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        die(e.kind === 'flyer' ? 'touch' : 'touch');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h * 0.9)) {
        die('touch');
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
    const mul = spdMul(isAssault(), G.stage);
    const p = G.player;
    if (!onScreen(e.x, e.y, 80) && e.kind !== 'falcon') return;

    if (e.kind === 'falcon') {
      e.x += (e.vx || -90) * dt * mul;
      e.y += Math.sin(e.t * 4) * 18 * dt;
      if (e.x < G.camX - 40) e.dead = true;
      return;
    }

    if (e.kind === 'flyer') {
      e.x += (e.face || -1) * 46 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = HY - 24 + Math.sin(e.t * 2.4) * 16;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0) {
        e.fire = (isAssault() ? 1.05 : 1.45) / mul;
        enemyShoot(e, 0, 1, 220, 'e');
      }
      return;
    }

    if (e.kind === 'turret' || e.kind === 'cannon' || e.kind === 'sniper') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 360) {
        const aim = aimAtPlayer(e);
        if (e.kind === 'turret') {
          e.fire = (isAssault() ? 0.85 : 1.15) / mul;
          enemyShoot(e, aim.dx, aim.dy, 240, 'e');
        } else if (e.kind === 'sniper') {
          e.fire = (isAssault() ? 1.2 : 1.6) / mul;
          enemyShoot(e, aim.dx, aim.dy * 0.4, 280, 'e');
          enemyShoot(e, aim.dx, aim.dy, 280, 'e');
          enemyShoot(e, aim.dx, aim.dy * 1.5, 260, 'e');
        } else {
          e.fire = (isAssault() ? 1.35 : 1.8) / mul;
          spawnShot({
            x: e.x, y: e.y - 16,
            vx: e.face * 160,
            vy: -240,
            from: 'e', kind: 'bomb', dmg: 1, pierce: 0, bounce: 0,
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
    if (e.kind === 'grunt' && e.fire <= 0 && playing() && G.deadT <= 0) {
      if (Math.abs(p.x - e.x) < 280 && Math.abs(p.y - e.y) < 50) {
        e.fire = (isAssault() ? 1.1 : 1.55) / mul;
        e.face = p.x < e.x ? -1 : 1;
        enemyShoot(e, e.face, 0, 260, 'e');
      } else e.fire = 0.4;
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
    const mul = spdMul(isAssault(), G.stage);
    const low = b.hp / b.max < 0.45;
    if (b.kind === '碉门') {
      b.x = G.levelW - 130;
      b.y = GY;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.55 : 0.85) / mul;
        const aim = aimAtPlayer(b);
        enemyShoot(b, aim.dx, aim.dy, 260, 'e');
        enemyShoot(b, aim.dx, aim.dy - 40, 240, 'e');
        enemyShoot(b, aim.dx, aim.dy + 40, 240, 'e');
      }
    } else if (b.kind === '双联') {
      b.x = G.levelW - 150;
      b.y = GY;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.42 : 0.7) / mul;
        const high = ((b.t * 2) | 0) % 2 === 0;
        spawnShot({
          x: b.x - 18, y: b.y - (high ? 36 : 14),
          vx: -280, vy: high ? -40 : 20,
          from: 'e', kind: 'e', dmg: 1, pierce: 0, bounce: 0,
          life: 1.5, rgb: HOT2, hit: []
        });
        if (low) {
          enemyShoot(b, p.x - b.x, (p.y - 16) - (b.y - 20), 220, 'e');
        }
      }
    } else {
      b.x = G.levelW - 160 + Math.sin(b.t * 0.8) * 36;
      b.y = GY - 8 + Math.sin(b.t * 1.4) * 22;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.38 : 0.62) / mul;
        const n = low ? 8 : 6;
        let i;
        for (i = 0; i < n; i++) {
          const a = b.t * 1.7 + i * TAU / n;
          spawnShot({
            x: b.x, y: b.y - 24,
            vx: Math.cos(a) * 200,
            vy: Math.sin(a) * 200,
            from: 'e', kind: 'e', dmg: 1, pierce: 0, bounce: 0,
            life: 1.6, rgb: MAG, hit: []
          });
        }
      }
    }
  }

  function shotHits(s, x, y, w, h) {
    const r = s.kind === 'L' ? 10 : (s.kind === 'F' ? 8 : 5);
    return overlap(s.x - r, s.y - r, r * 2, r * 2, x - w * 0.5, y - h, w, h);
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      if (s.bounce) {
        s.vy += 780 * dt;
        const y0 = s.y;
        const y1 = s.y + s.vy * dt;
        const plat = landOn(s.x, y0, y1, null);
        if (plat) {
          s.y = plat.y - 5;
          s.vy = -Math.abs(s.vy) * 0.84;
          s.vx *= 0.98;
          emit(3, {
            x: s.x, y: s.y, j: 4,
            vx0: -40, vx1: 40, vy0: -80, vy1: -10,
            life: 0.16, r0: 1, r1: 2.2, rgb: ORG, g: 100
          });
        } else s.y = y1;
      } else {
        s.y += s.vy * dt;
      }
      s.x += s.vx * dt;
      if (s.kind === 'F' && playing()) {
        emit(1, {
          x: s.x, y: s.y, j: 2,
          vx0: -20, vx1: 20, vy0: -30, vy1: 10,
          life: 0.18, r0: 1.4, r1: 3, rgb: ORG, g: -40
        });
      }
      if (s.life <= 0 || !onScreen(s.x, s.y, 80)) {
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
            hurtEnt(e, s.dmg);
            hit = true;
            if (!s.pierce) break;
            s.pierce -= 1;
            if (s.pierce < 0) break;
          }
        }
        if (!hit && G.boss && !G.boss.dead && G.boss.active && s.hit.indexOf(G.boss.id) < 0) {
          e = G.boss;
          if (shotHits(s, e.x, e.y, e.w + 8, e.h + 6)) {
            s.hit.push(e.id);
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
            if (e.hp <= 0) {
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
          }
        }
        if (hit && !s.pierce) {
          G.shots.splice(i, 1);
          continue;
        }
        if (hit && s.pierce <= 0 && s.kind === 'L') {
          G.shots.splice(i, 1);
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        const r = s.kind === 'bomb' ? 7 : 4.5;
        if (overlap(s.x - r, s.y - r, r * 2, r * 2, pb.x, pb.y, pb.w, pb.h)) {
          G.shots.splice(i, 1);
          die('shot');
        }
      }
    }
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

    const need = REDUCE ? 8 : 28;
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
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateCam(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'fort') {
      g.addColorStop(0, '#14060a');
      g.addColorStop(0.55, '#1a080c');
      g.addColorStop(1, '#22080c');
    } else if (spec.theme === 'river') {
      g.addColorStop(0, '#0c1418');
      g.addColorStop(0.5, '#102018');
      g.addColorStop(1, '#0c180e');
    } else {
      g.addColorStop(0, '#140804');
      g.addColorStop(0.5, '#1a1008');
      g.addColorStop(1, '#0e180a');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 44);
    ctx.fillStyle = rgba(GOLD, isAssault() ? 0.32 : 0.5);
    ctx.beginPath();
    ctx.arc(mx, my, 20 * scale, 0, TAU);
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
      h = (30 + hash2(i + 17 + G.stage * 9) * 80) * scale;
      w = (28 + hash2(i + 5) * 26) * scale;
      if (spec.theme === 'fort') {
        ctx.fillStyle = i % 3 === 0 ? '#12060a' : '#0c0408';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = hash2(i + 3) > 0.55 ? rgba(HOT, 0.28) : rgba(CYN, 0.16);
        ctx.fillRect(x + 6 * scale, base - h + 10 * scale, 4 * scale, 5 * scale);
        ctx.fillRect(x + 16 * scale, base - h + 22 * scale, 4 * scale, 5 * scale);
      } else {
        ctx.fillStyle = i % 2 ? '#0c1a10' : '#08140c';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(LEAF, 0.18);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, base - h + 8 * scale, 10 * scale, 0, TAU);
        ctx.fill();
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

  function drawWater() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 10);
    ctx.fillStyle = rgba(CYN, 0.1);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    ctx.strokeStyle = rgba(CYN, 0.35);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    let x;
    for (x = G.camX - 20; x < G.camX + VW + 20; x += 8) {
      const yy = GY + 8 + Math.sin(x * 0.08 + G.clock * 3.2) * 2.4;
      if (x === G.camX - 20) ctx.moveTo(sx(x), sy(yy));
      else ctx.lineTo(sx(x), sy(yy));
    }
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.06);
    let covered;
    for (x = G.camX; x < G.camX + VW; x += 18) {
      covered = false;
      for (let i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered) continue;
      ctx.fillRect(sx(x), sy(GY + 4), 14 * scale, 6 * scale);
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
        ? (spec.theme === 'fort' ? '#1a0a0e' : '#142010')
        : '#1a140c';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? LEAF : HOT, p.base ? 0.8 : 0.7);
      if (spec.theme === 'fort') ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.22);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(LEAF, 0.22) : rgba(HOT, 0.18);
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
    if (s.kind === 'L') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.fillRect(-2 * scale, -2.2 * scale, 28 * scale, 4.4 * scale);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(4 * scale, -1 * scale, 18 * scale, 2 * scale);
    } else if (s.kind === 'F' || s.kind === 'bomb') {
      ctx.fillStyle = rgba(s.rgb || ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 5.2 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(-1 * scale, -1 * scale, 2.2 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-3.5 * scale, -1.6 * scale, 9 * scale, 3.2 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(1 * scale, -0.8 * scale, 4 * scale, 1.6 * scale);
    }
    ctx.restore();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 4 + u.t) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    const rgb = u.kind === 'L' ? CYN : u.kind === 'F' ? ORG : u.kind === 'S' ? LEAF : HOT;
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.fillStyle = '#140808';
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.kind, x, y + 0.5 * scale);
  }

  function drawCommando(p, rgb, opt) {
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
    ctx.fillStyle = rgba(GOLD, 0.35);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, 2 * s);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 12) * s, 5.4 * s, 5.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-5.4 * s, -(bodyH + 14) * s, 10.8 * s, 2.2 * s);
    ctx.fillStyle = '#1a0a08';
    ctx.fillRect(1.4 * s, -(bodyH + 13.2) * s, 3.4 * s, 1.6 * s);
    const ldx = aim.dx * p.face;
    const ldy = aim.dy;
    ctx.strokeStyle = rgba(WHT, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -(bodyH + 2) * s);
    ctx.lineTo((2 + ldx * 11) * s, (-(bodyH + 2) + ldy * 11) * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 0.95);
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

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    if (e.kind === 'falcon') {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(x - 10 * scale, y);
      ctx.lineTo(x + 8 * scale, y - 6 * scale);
      ctx.lineTo(x + 8 * scale, y + 6 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(x - 2 * scale, y - 3 * scale, 5 * scale, 6 * scale);
      return;
    }
    if (e.kind === 'turret' || e.kind === 'cannon') {
      ctx.fillStyle = '#2a3038';
      ctx.fillRect(x - 10 * scale, y - 14 * scale, 20 * scale, 14 * scale);
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
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * scale, 9 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(x - 3 * scale, y - 8 * scale, 6 * scale, 3 * scale);
      return;
    }
    const rgb = e.kind === 'runner' ? HOT2 : e.kind === 'sniper' ? MAG : LEAF;
    drawCommando(e, rgb, {
      run: e.t * 8, grounded: e.grounded, squash: 1,
      duck: false, aim: { dx: e.face, dy: 0 }, size: 0.92
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
    if (b.kind === '碉门') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#2a1810';
      ctx.fillRect(x - 28 * scale, y - 52 * scale, 56 * scale, 52 * scale);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(x - 28 * scale, y - 54 * scale, 56 * scale, 3 * scale);
      ctx.fillStyle = '#0a0404';
      ctx.fillRect(x - 16 * scale, y - 36 * scale, 22 * scale, 16 * scale);
      ctx.fillStyle = rgba(GOLD, 0.8 + Math.sin(G.clock * 8) * 0.15);
      ctx.fillRect(x - 8 * scale, y - 30 * scale, 10 * scale, 6 * scale);
    } else if (b.kind === '双联') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#241018';
      ctx.fillRect(x - 30 * scale, y - 56 * scale, 60 * scale, 56 * scale);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(x - 30 * scale, y - 58 * scale, 60 * scale, 3 * scale);
      ctx.fillStyle = '#6a7080';
      ctx.fillRect(x - 34 * scale, y - 44 * scale, 22 * scale, 6 * scale);
      ctx.fillRect(x - 34 * scale, y - 20 * scale, 22 * scale, 6 * scale);
    } else {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(MAG, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y - 28 * scale, 26 * scale, 22 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(x - 4 * scale, y - 30 * scale, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x - 6 * scale, y - 32 * scale, 3 * scale, 0, TAU);
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
    ctx.fillStyle = '#0c0402';
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
    drawWater();
    drawPlats();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) {
      drawCommando(G.player, HOT, {
        run: G.player.run,
        grounded: G.player.grounded,
        squash: G.player.squash,
        duck: G.player.duck,
        aim: getAim(G.player),
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
    if (space) keys.fire = down;

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
      startGame('jungle');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('assault');
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

  if (btnJungle) {
    btnJungle.addEventListener('click', function () {
      audio.ensure();
      startGame('jungle');
    });
  }
  if (btnAssault) {
    btnAssault.addEventListener('click', function () {
      audio.ensure();
      startGame('assault');
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
      if (G.mode === 'win') startGame('assault');
      else goTitle();
    });
  }
  if (modeJungle) {
    modeJungle.addEventListener('click', function () {
      audio.ensure();
      startGame('jungle');
    });
  }
  if (modeAssault) {
    modeAssault.addEventListener('click', function () {
      audio.ensure();
      startGame('assault');
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
    }
  });

  requestAnimationFrame(frame);
})();
