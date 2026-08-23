'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.34;
  const HIT_R = 5.6;
  const CRAW_R = 11;
  const CRAW_MAX = 2;
  const BOMB_CAP = 6;
  const BOMB_START = 3;
  const BEST_KEY = 'playbox-thunder-force4-best';
  const MUTE_KEY = 'playbox-thunder-force4-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Q / E 切武器 · Shift / Z 雷闪 · R 重开 · M 静音';
  const LEAD = '四向舰切四槽。双牙、尾刺、四向、雷剑。星环锁前成雷剑。Shift 雷闪清屏。撞机、中弹、擦地都掉命。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MINT = [46, 240, 160];
  const TEAL = [92, 255, 208];
  const GOLD = [255, 227, 107];
  const MAG = [255, 61, 184];
  const WHT = [232, 255, 244];
  const PNK = [255, 154, 212];
  const VIO = [196, 92, 255];
  const LEAF = [78, 224, 138];
  const HOT = [122, 255, 200];
  const DEEP = [3, 20, 15];
  const AMB = [255, 176, 64];

  const WEPS = [
    { name: '双牙', cd: 0.088, dmg: 1 },
    { name: '尾刺', cd: 0.098, dmg: 1.12 },
    { name: '四向', cd: 0.128, dmg: 0.92 },
    { name: '雷剑', cd: 0.186, dmg: 1.55 }
  ];

  const SCORE = {
    dart: 50,
    relic: 80,
    turret: 90,
    dive: 70,
    heavy: 150,
    carrier: 190,
    elite: 220,
    boss: [2600, 4400, 7400],
    clear: 1700,
    all: 4200,
    core: 5400,
    crawMax: 360
  };

  const STAGES = [
    {
      name: '遗墟',
      boss: '遗卫',
      theme: 'ruin',
      bossHp: 80,
      waves: [
        { t: 0.55, kind: 'v', n: 5 },
        { t: 2.1, kind: 'carrier' },
        { t: 3.7, kind: 'relic', n: 3 },
        { t: 5.5, kind: 'turret', n: 2 },
        { t: 7.6, kind: 'v', n: 6 },
        { t: 10.0, kind: 'dive', n: 3 },
        { t: 12.4, kind: 'relic', n: 4 },
        { t: 15.0, kind: 'mix' },
        { t: 17.8, kind: 'v', n: 7 },
        { t: 20.4, kind: 'turret', n: 2 },
        { t: 23.4, kind: 'boss' }
      ]
    },
    {
      name: '空廊',
      boss: '空核',
      theme: 'sky',
      bossHp: 108,
      waves: [
        { t: 0.45, kind: 'v', n: 6 },
        { t: 1.9, kind: 'dive', n: 4 },
        { t: 3.6, kind: 'heavy', n: 2 },
        { t: 5.4, kind: 'elite' },
        { t: 7.8, kind: 'v', n: 8 },
        { t: 10.2, kind: 'carrier' },
        { t: 12.6, kind: 'dive', n: 5 },
        { t: 15.0, kind: 'relic', n: 4 },
        { t: 17.4, kind: 'heavy', n: 2 },
        { t: 20.0, kind: 'mix' },
        { t: 23.2, kind: 'boss' }
      ]
    },
    {
      name: '核星',
      boss: '星核',
      theme: 'core',
      bossHp: 148,
      waves: [
        { t: 0.4, kind: 'v', n: 7 },
        { t: 1.8, kind: 'carrier' },
        { t: 3.2, kind: 'dive', n: 4 },
        { t: 4.8, kind: 'elite' },
        { t: 7.2, kind: 'heavy', n: 2 },
        { t: 9.6, kind: 'turret', n: 3 },
        { t: 12.0, kind: 'v', n: 8 },
        { t: 14.6, kind: 'mix' },
        { t: 17.2, kind: 'dive', n: 5 },
        { t: 19.8, kind: 'elite' },
        { t: 22.6, kind: 'relic', n: 4 },
        { t: 25.4, kind: 'boss' }
      ]
    }
  ];

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
  const btnForce = document.getElementById('btn-force');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnWep = document.getElementById('btn-wep');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPadWep = document.getElementById('btn-pad-wep');
  const btnPadBomb = document.getElementById('btn-pad-bomb');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wepLabel = document.getElementById('wep-label');
  const clawLabel = document.getElementById('claw-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

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
  let comboTok = 0;
  let wepTok = 0;
  let uid = 1;
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 96, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const trails = [];
  const wisps = [];
  const bolts = [];

  const G = {
    mode: 'title',
    kind: 'force',
    t: 0,
    clock: 0,
    cam: 0,
    px: 96,
    py: VH * 0.5,
    vx: 0,
    vy: 0,
    bank: 0,
    lives: LIVES,
    score: 0,
    best: { l: 0, r: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    waveI: 0,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    drops: [],
    craws: [],
    crawN: 2,
    wep: 0,
    fireCd: 0,
    fireHold: false,
    swapCd: 0,
    bombs: BOMB_START,
    bombT: 0,
    bombFlash: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MINT,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    engine: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(ax, ay) {
    return Math.sqrt(ax * ax + ay * ay);
  }
  function rgba(rgb, a) {
    if (a == null || a >= 0.995) return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hash2(n) {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }
  function isCore() {
    return G.kind === 'core';
  }
  function stageDef() {
    return STAGES[clamp(G.stage, 1, 3) - 1];
  }
  function kindBest() {
    return isCore() ? G.best.r : G.best.l;
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function playing() {
    return G.mode === 'play' && G.deadT <= 0;
  }
  function nextId() {
    uid += 1;
    return uid;
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function scrX(wx) {
    return wx - G.cam;
  }
  function wepRgb() {
    if (G.wep === 1) return TEAL;
    if (G.wep === 2) return VIO;
    if (G.wep === 3) return GOLD;
    return MINT;
  }
  function fireScale() {
    return isCore() ? 0.92 : 1;
  }
  function enemyFire() {
    return isCore() ? 0.76 : 1;
  }

  function groundY(wx) {
    if (G.stage === 2) return VH + 90;
    const n = Math.sin(wx * 0.011) * 14 + Math.sin(wx * 0.029 + 1.3) * 9 + Math.sin(wx * 0.0073 + 0.4) * 7;
    const amp = G.stage === 3 ? 0.42 : 0.82;
    let g = VH - 24 + n * amp;
    if (G.boss) g = Math.max(g, VH - 38);
    if (wx < 90) g = lerp(VH - 18, g, wx / 90);
    return clamp(g, VH - 78, VH - 12);
  }

  function ceilY(wx) {
    if (G.stage !== 3) return 0;
    if (G.boss) return 16;
    const n = Math.sin(wx * 0.013) * 10 + Math.sin(wx * 0.031 + 0.7) * 6;
    return clamp(16 + n, 8, 40);
  }

  function ruinCell(wx) {
    return Math.floor((wx + 36) / 220);
  }

  function ruinHAt(wx) {
    if (G.stage !== 1 || G.boss) return 0;
    const cell = ruinCell(wx);
    const h = hash2(cell * 17 + 3);
    if (h < 0.62) return 0;
    return 28 + h * 52;
  }

  function ruinCx(cell) {
    return cell * 220 + 110;
  }

  function ruinHit(px, py) {
    if (G.stage !== 1 || G.boss) return false;
    const wx = G.cam + px;
    const cell = ruinCell(wx);
    const cx = ruinCx(cell);
    if (Math.abs(wx - cx) > 14) return false;
    const gy = groundY(cx);
    const h = ruinHAt(cx);
    return h > 0 && py > gy - h - 6;
  }

  function spikeCell(wx) {
    return Math.floor((wx + 28) / 200);
  }

  function spikeHAt(wx) {
    if (G.stage !== 3 || G.boss) return 0;
    const cell = spikeCell(wx);
    const h = hash2(cell * 23 + 11);
    if (h < 0.55) return 0;
    return 26 + h * 54;
  }

  function spikeCx(cell) {
    return cell * 200 + 100;
  }

  function spikeHit(px, py) {
    if (G.stage !== 3 || G.boss) return false;
    const wx = G.cam + px;
    const cell = spikeCell(wx);
    const cx = spikeCx(cell);
    if (Math.abs(wx - cx) > 12) return false;
    const h = spikeHAt(cx);
    const top = ceilY(cx);
    return h > 0 && py < top + h + 6;
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
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
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
    shoot(w) {
      this.ensure();
      if (w === 1) {
        this.beep(640, 0.048, 'square', 0.028, 220);
        this.beep(320, 0.06, 'triangle', 0.018, 120);
      } else if (w === 2) {
        this.beep(380, 0.055, 'square', 0.03, 760);
        this.beep(190, 0.07, 'triangle', 0.02, 520);
        this.beep(980, 0.04, 'sine', 0.016, 1960);
      } else if (w === 3) {
        this.beep(180, 0.1, 'sawtooth', 0.042, 880);
        this.beep(520, 0.08, 'triangle', 0.028, 160);
        this.noise(0.05, 0.028, 700);
      } else {
        this.beep(920, 0.036, 'square', 0.028, 1760);
      }
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.62, combo * 0.04);
      this.noise(0.034, 0.03, 1400);
      this.beep(560 * lift, 0.068, 'square', 0.036, 940 * lift);
    },
    swap() {
      this.ensure();
      this.beep(370, 0.055, 'square', 0.038, 554);
      this.beep(698, 0.09, 'triangle', 0.034, 880);
    },
    block() {
      this.ensure();
      this.beep(1560, 0.038, 'triangle', 0.028, 2280);
      this.noise(0.028, 0.018, 1900);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.036, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.026, 1320);
    },
    craw() {
      this.ensure();
      this.beep(466, 0.07, 'square', 0.04, 698);
      this.beep(698, 0.09, 'triangle', 0.034, 932);
      this.beep(932, 0.14, 'sine', 0.032, 1396);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.064, 260);
      this.beep(280, 0.22, 'sawtooth', 0.048, 62);
      this.beep(140, 0.34, 'sine', 0.04, 40);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.044, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1046);
    },
    boom() {
      this.ensure();
      this.noise(0.22, 0.078, 170);
      this.beep(170, 0.28, 'sawtooth', 0.052, 52);
      this.beep(86, 0.4, 'sine', 0.038, 38);
    },
    bomb() {
      this.ensure();
      this.noise(0.28, 0.09, 140);
      this.beep(110, 0.34, 'sawtooth', 0.058, 42);
      this.beep(330, 0.18, 'square', 0.04, 90);
      this.beep(880, 0.12, 'triangle', 0.03, 1760);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.03, 90);
    },
    warn() {
      this.ensure();
      this.beep(210, 0.1, 'sawtooth', 0.04, 105);
      this.beep(315, 0.16, 'square', 0.036, 158);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.038, 660);
      this.beep(660, 0.14, 'triangle', 0.033, 990);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.048, 784);
      this.beep(784, 0.16, 'triangle', 0.042, 1046);
      this.beep(1046, 0.28, 'sine', 0.038, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.038, 82);
      this.beep(124, 0.3, 'sine', 0.048, 44);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.045, 523);
      this.beep(523, 0.11, 'triangle', 0.04, 659);
      this.beep(784, 0.2, 'square', 0.045, 1046);
    }
  };

  function loadBest() {
    G.best = { l: 0, r: 0 };
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw && raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.best.l = Math.max(0, parseInt(o.l, 10) || 0);
        G.best.r = Math.max(0, parseInt(o.r, 10) || 0);
      } else {
        const n = parseInt(raw || '0', 10);
        G.best.l = isFinite(n) && n > 0 ? n : 0;
      }
    } catch (err) {
      G.best = { l: 0, r: 0 };
    }
    if (bestEl) bestEl.textContent = String(kindBest());
  }

  function saveBest() {
    const k = isCore() ? 'r' : 'l';
    if (G.score <= G.best[k]) return;
    G.best[k] = G.score;
    if (bestEl) bestEl.textContent = String(G.best[k]);
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.up();
        syncPips();
      }
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
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.mode === 'title' ? Math.max(G.best.l, G.best.r) : kindBest());
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '遗墟';
      else if (G.boss) stageLabel.textContent = stageDef().boss;
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + stageDef().name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '雷核' : '雷四';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isCore());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (wepLabel) {
      wepLabel.textContent = WEPS[G.wep].name;
      wepLabel.className = 'wep w' + G.wep;
    }
    if (clawLabel) {
      clawLabel.textContent = '环 ' + G.crawN;
      clawLabel.classList.toggle('off', G.crawN <= 0);
    }
    if (bombLabel) {
      bombLabel.textContent = '闪 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
        comboEl.classList.toggle('hot', G.combo >= 6);
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格射击，Q/E 切槽，Shift 雷闪', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 星核尽碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞机、中弹、擦地都掉命', 'warn');
    else if (G.wep === 1) setHint('尾刺 · 打身后俯冲与贴地炮', '');
    else if (G.wep === 2) setHint('四向 · 前、后、上、下同时打', 'hot');
    else if (G.wep === 3) setHint('雷剑 · 星环锁前成刃，穿群锁核', 'hot');
    else setHint('空格连射 · Q/E 切双牙、尾刺、四向、雷剑 · Shift 雷闪', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TF04';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'win')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6.6 ? 'bomb' : mag >= 6 ? 'die' : mag >= 3.2 ? 'pow' : 'hit';
    stageEl.classList.remove('die', 'hit', 'pow', 'bomb');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    const count = REDUCE ? Math.ceil(n * 0.4) : n;
    for (let i = 0; i < count; i++) {
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
    capArr(particles, REDUCE ? 120 : 280);
  }

  function burst(x, y, n, rgb, rad) {
    emit(n, {
      x: x, y: y, j: 6,
      vx0: -rad, vx1: rad, vy0: -rad, vy1: rad * 0.6,
      r0: 1.2, r1: 3.4, life: 0.42, rgb: rgb, g: 40
    });
    if (!REDUCE) {
      sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad * 0.45 });
      rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad * 0.35 });
      capArr(sparks, 36);
      capArr(rings, 28);
    }
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0, life: 0.72, size: 13 });
    capArr(floats, 18);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 78; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * (VH - 60),
        z: 0.22 + Math.random() * 0.9,
        s: 0.5 + Math.random() * 1.6,
        tw: Math.random() * TAU
      });
    }
  }

  function resetCraws() {
    G.craws.length = 0;
    for (let i = 0; i < CRAW_MAX; i++) {
      G.craws.push({
        ang: i * Math.PI,
        x: G.px + 8,
        y: G.py + (i ? 18 : -18),
        glow: 0
      });
    }
  }

  function pushEnt(e) {
    e.id = nextId();
    e.alive = true;
    e.flash = 0;
    e.ph = e.ph || 0;
    e.fireCd = e.fireCd == null ? rand(0.2, 0.8) : e.fireCd;
    G.ents.push(e);
  }

  function spawnDart(x, y, ph) {
    pushEnt({
      kind: 'dart', x: x, y: y, hp: 1, r: 10, score: SCORE.dart,
      vx: isCore() ? -76 : -58, vy: 0, ph: ph || 0
    });
  }
  function spawnRelic(x, y) {
    pushEnt({
      kind: 'relic', x: x, y: y, hp: 3, r: 13, score: SCORE.relic,
      vx: isCore() ? -46 : -36, vy: 0
    });
  }
  function spawnTurret(x, y) {
    pushEnt({
      kind: 'turret', x: x, y: y, hp: 4, r: 14, score: SCORE.turret,
      vx: 0, vy: 0
    });
  }
  function spawnDive(x, y) {
    pushEnt({
      kind: 'dive', x: x, y: y, hp: 2, r: 11, score: SCORE.dive,
      vx: isCore() ? -90 : -70, vy: 70, ph: 0
    });
  }
  function spawnHeavy(x, y) {
    pushEnt({
      kind: 'heavy', x: x, y: y, hp: 7, r: 17, score: SCORE.heavy,
      vx: isCore() ? -34 : -24, vy: 0
    });
  }
  function spawnCarrier(x, y) {
    pushEnt({
      kind: 'carrier', x: x, y: y, hp: 8, r: 18, score: SCORE.carrier,
      vx: isCore() ? -30 : -22, vy: 0, drop: 'craw'
    });
  }
  function spawnElite(x, y) {
    pushEnt({
      kind: 'elite', x: x, y: y, hp: 11, r: 16, score: SCORE.elite,
      vx: isCore() ? -32 : -24, vy: 0, drop: 'bomb'
    });
  }

  function spawnBoss() {
    const st = stageDef();
    const hp = Math.round(st.bossHp * (isCore() ? 1.28 : 1));
    pushEnt({
      kind: 'boss',
      x: G.cam + VW + 80,
      y: VH * 0.5,
      hp: hp,
      max: hp,
      r: 40,
      score: SCORE.boss[clamp(G.stage - 1, 0, 2)],
      vx: -46,
      vy: 0,
      ph: 0,
      fireCd: 0.55,
      drop: 'bomb',
      open: 1,
      name: st.boss
    });
    G.boss = true;
    toast(st.boss + ' 入轨', true, false);
    audio.warn();
    hud();
  }

  function spawnWave(w) {
    const baseX = G.cam + VW + 36;
    const extra = isCore() && w.kind !== 'boss' && w.kind !== 'carrier' && w.kind !== 'elite' ? 2 : 0;
    const n = (w.n || 1) + extra;
    if (w.kind === 'v') {
      for (let i = 0; i < n; i++) {
        const k = i - (n - 1) * 0.5;
        spawnDart(baseX + Math.abs(k) * 18, VH * 0.46 + k * 36, i * 0.2);
      }
    } else if (w.kind === 'relic') {
      for (let i = 0; i < n; i++) {
        spawnRelic(baseX + i * 30, 86 + i * ((VH - 180) / Math.max(1, n - 1)));
      }
    } else if (w.kind === 'turret') {
      for (let i = 0; i < n; i++) {
        const gx = baseX + i * 54;
        const gy = G.stage === 2 ? 80 + (i * 90) % (VH - 160) : groundY(gx) - 14;
        spawnTurret(gx, gy);
      }
    } else if (w.kind === 'dive') {
      for (let i = 0; i < n; i++) spawnDive(baseX + i * 34, 18 + (i % 3) * 16);
    } else if (w.kind === 'heavy') {
      for (let i = 0; i < n; i++) {
        spawnHeavy(baseX + i * 48, VH * 0.38 + i * 56);
      }
    } else if (w.kind === 'carrier') {
      spawnCarrier(baseX + 20, VH * 0.5 + rand(-40, 40));
    } else if (w.kind === 'elite') {
      spawnElite(baseX + 16, VH * 0.42 + rand(-30, 30));
      if (isCore()) spawnElite(baseX + 50, VH * 0.62);
    } else if (w.kind === 'mix') {
      spawnCarrier(baseX, VH * 0.46);
      spawnRelic(baseX + 40, 80);
      spawnHeavy(baseX + 50, VH * 0.62);
      spawnDart(baseX + 70, VH * 0.5, 0);
      if (isCore()) spawnDive(baseX + 90, 24);
    } else if (w.kind === 'boss') {
      spawnBoss();
    }
  }

  function maybeSpawn() {
    const waves = stageDef().waves;
    while (G.waveI < waves.length && G.clock >= waves[G.waveI].t) {
      spawnWave(waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function noteCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
        const tok = comboTok;
        setTimeout(function () {
          if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
        }, 280);
      }
      floatText(G.px + 20, G.py - 18, G.combo + ' 链', GOLD);
    }
    hud();
  }

  function dropItem(x, y, kind) {
    G.drops.push({
      x: x, y: y, vx: -20, vy: rand(-18, 18),
      t: 0, life: 12, kind: kind || 'craw'
    });
    capArr(G.drops, 8);
  }

  function collectDrop(d) {
    if (d.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        toast('雷闪 +1', false, true);
        floatText(d.x - G.cam, d.y - 10, '闪', GOLD);
        audio.up();
      } else {
        const n = Math.round(400 * G.mult);
        addScore(n);
        toast('MAX', false, true);
        floatText(d.x - G.cam, d.y - 10, '+' + n, GOLD);
        audio.up();
      }
    } else if (G.crawN < CRAW_MAX) {
      G.crawN += 1;
      toast(G.crawN >= 2 ? '双环' : '星环', false, true);
      floatText(d.x - G.cam, d.y - 10, G.crawN >= 2 ? '双环' : '星环', TEAL);
      audio.craw();
    } else {
      const n = Math.round(SCORE.crawMax * G.mult);
      addScore(n);
      toast('MAX', false, true);
      floatText(d.x - G.cam, d.y - 10, '+' + n, GOLD);
      audio.up();
    }
    for (let i = 0; i < G.craws.length; i++) G.craws[i].glow = 1;
    burst(d.x - G.cam, d.y, 12, d.kind === 'bomb' ? GOLD : TEAL, 20);
    hitStop(0.05);
    kick(2.2);
    screenFlash(d.kind === 'bomb' ? GOLD : TEAL, 0.22);
    hud();
  }

  function popWepBadge() {
    if (!wepLabel) return;
    wepLabel.classList.remove('swap');
    void wepLabel.offsetWidth;
    wepLabel.classList.add('swap');
    wepTok += 1;
    const tok = wepTok;
    setTimeout(function () {
      if (tok === wepTok && wepLabel) wepLabel.classList.remove('swap');
    }, 280);
  }

  function swapWep(dir) {
    if (G.swapCd > 0) return;
    if (G.mode === 'title' || overlayOpen()) return;
    if (!playing()) return;
    const step = dir < 0 ? WEPS.length - 1 : 1;
    G.wep = (G.wep + step) % WEPS.length;
    G.swapCd = 0.16;
    audio.swap();
    toast(WEPS[G.wep].name, false, G.wep === 2 || G.wep === 3);
    hitStop(0.036);
    kick(1.6);
    screenFlash(wepRgb(), 0.2);
    popWepBadge();
    hud();
  }

  function pushShot(spec) {
    spec.hits = spec.hits || {};
    spec.life = spec.life == null ? 1.6 : spec.life;
    G.shots.push(spec);
    capArr(G.shots, 96);
  }

  function fire() {
    if (!playing() || G.fireCd > 0) return;
    const w = WEPS[G.wep];
    G.fireCd = w.cd * fireScale();
    G.muzzle = 0.055;
    audio.shoot(G.wep);
    const wx = G.cam + G.px + 16;
    const rgb = wepRgb();
    if (G.wep === 0) {
      pushShot({ kind: 'twin', wx: wx, y: G.py - 5, vx: 660, vy: 0, dmg: w.dmg, r: 3.2, pierce: 0 });
      pushShot({ kind: 'twin', wx: wx, y: G.py + 5, vx: 660, vy: 0, dmg: w.dmg, r: 3.2, pierce: 0 });
      for (let i = 0; i < G.crawN; i++) {
        const c = G.craws[i];
        pushShot({
          kind: 'twin', wx: G.cam + c.x + 8, y: c.y, vx: 640, vy: 0,
          dmg: w.dmg * 0.85, r: 2.8, pierce: 0
        });
      }
    } else if (G.wep === 1) {
      pushShot({ kind: 'back', wx: wx, y: G.py, vx: 420, vy: 0, dmg: w.dmg * 0.7, r: 2.8, pierce: 0 });
      pushShot({ kind: 'back', wx: G.cam + G.px - 12, y: G.py - 6, vx: -580, vy: 0, dmg: w.dmg, r: 3.4, pierce: 0 });
      pushShot({ kind: 'back', wx: G.cam + G.px - 12, y: G.py + 6, vx: -580, vy: 0, dmg: w.dmg, r: 3.4, pierce: 0 });
      for (let i = 0; i < G.crawN; i++) {
        const c = G.craws[i];
        pushShot({
          kind: 'back', wx: G.cam + c.x - 6, y: c.y, vx: -560, vy: 0,
          dmg: w.dmg * 0.9, r: 2.8, pierce: 0
        });
      }
    } else if (G.wep === 2) {
      const spd = 560;
      pushShot({ kind: 'quad', wx: wx, y: G.py, vx: spd, vy: 0, dmg: w.dmg, r: 3.4, pierce: 0 });
      pushShot({ kind: 'quad', wx: G.cam + G.px - 10, y: G.py, vx: -spd, vy: 0, dmg: w.dmg, r: 3.4, pierce: 0 });
      pushShot({ kind: 'quad', wx: G.cam + G.px, y: G.py - 10, vx: 0, vy: -spd, dmg: w.dmg, r: 3.4, pierce: 0 });
      pushShot({ kind: 'quad', wx: G.cam + G.px, y: G.py + 10, vx: 0, vy: spd, dmg: w.dmg, r: 3.4, pierce: 0 });
      for (let i = 0; i < G.crawN; i++) {
        const c = G.craws[i];
        const dx = c.x - G.px;
        const dy = c.y - G.py;
        const d = hypot(dx, dy) || 1;
        pushShot({
          kind: 'quad', wx: G.cam + c.x, y: c.y,
          vx: dx / d * 520, vy: dy / d * 520,
          dmg: w.dmg * 0.8, r: 2.8, pierce: 0
        });
      }
    } else {
      const n = G.crawN;
      pushShot({
        kind: 'sword', wx: wx, y: G.py, vx: 740, vy: 0,
        dmg: w.dmg + n * 0.55, r: 7 + n * 3.2, pierce: 2 + n, life: 0.62
      });
      if (!REDUCE) {
        bolts.push({ x: G.px + 18, y: G.py, t: 0, len: 48 + n * 36, rgb: GOLD });
        capArr(bolts, 10);
      }
    }
    emit(3, {
      x: G.px + 16, y: G.py, j: 3,
      vx0: 40, vx1: 120, vy0: -20, vy1: 20,
      r0: 1, r1: 2.2, life: 0.16, rgb: rgb, g: 0
    });
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (overlayOpen()) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('雷闪用尽', true, false);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.48;
    G.bombFlash = 0.58;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    screenFlash(GOLD, 0.78);
    burst(G.px, G.py, 26, GOLD, 48);
    rings.push({ x: G.px, y: G.py, t: 0, rgb: MINT, r: 28 });
    rings.push({ x: VW * 0.5, y: VH * 0.46, t: 0, rgb: GOLD, r: 50 });
    emit(24, {
      x: G.px, y: G.py, j: 18,
      vx0: -280, vx1: 280, vy0: -240, vy1: 200,
      r0: 1.6, r1: 4.2, life: 0.52, rgb: AMB, g: 40
    });
    hitStop(0.078);
    kick(7.4);
    G.eShots.length = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const sxv = scrX(e.x);
      if (sxv < -20 || sxv > VW + 40) continue;
      const dmg = e.kind === 'boss' ? 16 : 7;
      hurtEnemy(e, dmg, e.x, e.y);
    }
    hud();
  }

  function enemyShot(x, y, vx, vy, r, fat) {
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.4, fat: !!fat, life: 3.2
    });
    capArr(G.eShots, 96);
  }

  function aimPlayer(ex, ey, spd) {
    const px = G.cam + G.px;
    const dx = px - ex;
    const dy = G.py - ey;
    const d = hypot(dx, dy) || 1;
    return { vx: dx / d * spd, vy: dy / d * spd };
  }

  function coreOpen(b) {
    return 0.5 + 0.5 * Math.sin(b.ph * 1.28);
  }

  function hurtEnemy(e, dmg, hx, hy) {
    if (!e.alive) return;
    let dealt = dmg;
    if (e.kind === 'boss' && G.stage === 3) {
      const open = coreOpen(e);
      e.open = open;
      if (open < 0.52) dealt = dmg * 0.32;
    }
    e.hp -= dealt;
    e.flash = 0.08;
    noteCombo();
    audio.hit(G.combo);
    emit(4, {
      x: hx - G.cam, y: hy, j: 3,
      vx0: -50, vx1: 80, vy0: -60, vy1: 60,
      r0: 1, r1: 2.4, life: 0.22, rgb: e.kind === 'boss' ? GOLD : MINT, g: 40
    });
    const stop = e.kind === 'boss' ? 0.055 : dmg >= 1.4 ? 0.05 : 0.038;
    hitStop(stop);
    kick(e.kind === 'boss' ? 2.6 : 1.5);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.alive = false;
    const sxv = e.x - G.cam;
    const rgb = e.kind === 'boss' ? GOLD
      : e.kind === 'elite' ? VIO
        : e.kind === 'relic' ? TEAL
          : e.kind === 'dive' ? AMB
            : MINT;
    burst(sxv, e.y, e.kind === 'boss' ? 30 : 12, rgb, e.kind === 'boss' ? 48 : 22);
    floatText(sxv, e.y - 8, String(Math.round(e.score * G.mult)), GOLD);
    addScore(Math.round(e.score * G.mult));
    if (e.drop === 'bomb' || (e.kind === 'elite' && Math.random() < 0.55)) {
      dropItem(e.x, e.y, 'bomb');
    } else if (e.drop === 'craw' || (e.kind !== 'dart' && Math.random() < (e.kind === 'carrier' ? 1 : 0.16))) {
      dropItem(e.x, e.y, 'craw');
    }
    if (e.kind === 'boss') {
      audio.boom();
      screenFlash(GOLD, 0.55);
      hitStop(0.08);
      kick(7);
      afterBoss();
    }
  }

  function playerHit(why) {
    if (G.invuln > 0 || G.deadT > 0 || !playing()) return;
    G.why = why || '撞机';
    G.deadT = 0.92;
    G.fireHold = false;
    burst(G.px, G.py, 26, MAG, 38);
    screenFlash(MAG, 0.5);
    hitStop(0.072);
    kick(7.2);
    audio.death();
    if (G.crawN > 0) {
      dropItem(G.cam + G.px + 10, G.py, 'craw');
      if (G.crawN > 1) dropItem(G.cam + G.px + 4, G.py + 16, 'craw');
      G.crawN = 0;
    }
    G.eShots.length = 0;
    hud();
  }

  function finishDeath() {
    G.lives -= 1;
    syncPips();
    if (G.lives <= 0) {
      loseGame();
      return;
    }
    G.deadT = 0;
    G.px = 96;
    G.py = VH * 0.5;
    G.invuln = 1.45;
    resetCraws();
    toast('残机 ' + G.lives, true, false);
    hud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '星环没护住。R 立刻重开，或换模式。');
    hud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(isCore() ? SCORE.core : SCORE.all);
    saveBest();
    audio.win();
    screenFlash(GOLD, 0.6);
    showOverlay(
      'win',
      isCore() ? '雷核通关' : '星核尽碎',
      isCore() ? '密核打穿。机群从星里散了。' : '三关打穿。把星核从核星打穿。'
    );
    hud();
  }

  function afterBoss() {
    addScore(SCORE.clear);
    toast(stageDef().name + ' 肃清', false, true);
    audio.stage();
    G.boss = false;
    if (G.stage >= STAGES.length) {
      G.winT = 1.32;
      G.invuln = Math.max(G.invuln, 1.4);
    } else {
      G.stage += 1;
      G.clock = 0;
      G.waveI = 0;
      G.invuln = Math.max(G.invuln, 0.8);
      toast(stageDef().name, false, true);
      hud();
    }
  }

  function updateCraws(dt) {
    const sword = G.wep === 3 && G.crawN > 0 && G.deadT <= 0;
    for (let i = 0; i < G.craws.length; i++) {
      const c = G.craws[i];
      c.ang += dt * (sword ? 1.2 : 4.6);
      c.glow = Math.max(0, c.glow - dt * 1.8);
      const on = i < G.crawN && G.deadT <= 0;
      let tx;
      let ty;
      if (sword && on) {
        tx = G.px + 30;
        ty = G.py + (i ? 11 : -11);
      } else {
        tx = G.px + 4 + Math.cos(c.ang) * 22;
        ty = G.py + Math.sin(c.ang) * 22;
      }
      if (on) {
        c.x = lerp(c.x, tx, 0.3);
        c.y = lerp(c.y, ty, 0.3);
      } else {
        c.x = lerp(c.x, G.px + 4, 0.2);
        c.y = lerp(c.y, G.py, 0.2);
      }
    }
  }

  function updateDrops(dt) {
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.t += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 18 * dt;
      const gy = Math.min(groundY(d.x) - 10, VH - 18);
      const cy = ceilY(d.x) + 10;
      if (d.y > gy) {
        d.y = gy;
        d.vy *= -0.4;
      }
      if (d.y < cy) {
        d.y = cy;
        d.vy *= -0.3;
      }
      if (d.t > d.life || d.x < G.cam - 40) {
        G.drops.splice(i, 1);
        continue;
      }
      if (playing() && hypot(d.x - (G.cam + G.px), d.y - G.py) < 22) {
        collectDrop(d);
        G.drops.splice(i, 1);
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const sh = G.shots[i];
      sh.life -= dt;
      sh.wx += sh.vx * dt;
      sh.y += (sh.vy || 0) * dt;
      if (sh.kind === 'sword' && !REDUCE) {
        trails.push({ x: sh.wx - G.cam, y: sh.y + rand(-3, 3), t: 0.16, rgb: GOLD });
        capArr(trails, 48);
      }
      const x = scrX(sh.wx);
      if (sh.life <= 0 || x < -70 || x > VW + 90 || sh.y < -28 || sh.y > VH + 28) {
        G.shots.splice(i, 1);
        continue;
      }
      let dead = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        const rr = e.r + sh.r;
        if (hypot(e.x - sh.wx, e.y - sh.y) >= rr) continue;
        if (sh.hits[e.id]) continue;
        sh.hits[e.id] = 1;
        hurtEnemy(e, sh.dmg, sh.wx, sh.y);
        if (!sh.pierce) {
          dead = true;
          break;
        }
        sh.pierce -= 1;
      }
      if (dead) G.shots.splice(i, 1);
    }
  }

  function updateEShots(dt) {
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const sh = G.eShots[i];
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      sh.life -= dt;
      const sxv = scrX(sh.x);
      if (sh.life <= 0 || sxv < -30 || sxv > VW + 40 || sh.y < -20 || sh.y > VH + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (!playing()) continue;
      let blocked = false;
      if (!sh.fat && G.crawN > 0 && G.deadT <= 0 && sh.r <= 4.2) {
        for (let c = 0; c < G.crawN; c++) {
          const cl = G.craws[c];
          if (hypot(sh.x - (G.cam + cl.x), sh.y - cl.y) < CRAW_R + sh.r) {
            blocked = true;
            cl.glow = 1;
            burst(cl.x, cl.y, 6, TEAL, 12);
            audio.block();
            break;
          }
        }
      }
      if (blocked) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.invuln <= 0 && hypot(sh.x - (G.cam + G.px), sh.y - G.py) < sh.r + HIT_R) {
        G.eShots.splice(i, 1);
        playerHit('中弹');
      }
    }
  }

  function bossFire(e, dt) {
    const half = e.hp < e.max * 0.5;
    const gap = (half ? 0.4 : 0.68) * enemyFire();
    e.fireCd -= dt;
    if (e.fireCd > 0) return;
    e.fireCd = gap;
    const st = G.stage;
    if (st === 1) {
      const n = half ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = -0.72 + i * (1.44 / Math.max(1, n - 1));
        enemyShot(e.x - 22, e.y, Math.cos(Math.PI + a) * 184, Math.sin(Math.PI + a) * 184, 3.6, false);
      }
      if (half) {
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU + e.ph;
          enemyShot(e.x, e.y, Math.cos(a) * 118, Math.sin(a) * 118, 3.4, false);
        }
      }
    } else if (st === 2) {
      const aim = aimPlayer(e.x, e.y, 210);
      enemyShot(e.x - 18, e.y, aim.vx, aim.vy, 3.8, false);
      enemyShot(e.x - 18, e.y - 18, aim.vx, aim.vy - 44, 3.5, false);
      enemyShot(e.x - 18, e.y + 18, aim.vx, aim.vy + 44, 3.5, false);
      if (half) {
        enemyShot(e.x - 12, e.y, aim.vx * 0.72, aim.vy * 0.72, 7.4, true);
        enemyShot(e.x - 8, e.y - 28, -40, 160, 3.4, false);
        enemyShot(e.x - 8, e.y + 28, -40, -160, 3.4, false);
      }
    } else {
      e.open = coreOpen(e);
      const ring = half ? 12 : 8;
      for (let i = 0; i < ring; i++) {
        const a = i / ring * TAU + e.ph * 0.55;
        enemyShot(e.x, e.y, Math.cos(a) * 126, Math.sin(a) * 126, 3.5, false);
      }
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI * 0.5 + e.ph * 0.4;
        enemyShot(e.x, e.y, Math.cos(a) * 200, Math.sin(a) * 200, 3.8, false);
      }
      if (half) {
        const aim = aimPlayer(e.x, e.y, 230);
        enemyShot(e.x - 12, e.y, aim.vx, aim.vy, 7.6, true);
      }
    }
  }

  function updateEnts(dt) {
    const pwx = G.cam + G.px;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      e.flash = Math.max(0, e.flash - dt);
      e.ph += dt;
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.kind === 'boss') {
        const tx = G.cam + VW - 132;
        if (e.x > tx) e.x += e.vx * dt;
        else e.x = tx;
        if (G.stage === 1) e.y = VH * 0.5 + Math.sin(e.ph * 1.35) * 68;
        else if (G.stage === 2) e.y = lerp(e.y, clamp(G.py, 70, VH - 80), 0.045);
        else e.y = VH * 0.5 + Math.sin(e.ph * 0.85) * 46;
        e.y = clamp(e.y, 58, Math.min(groundY(e.x) - 40, VH - 58));
        bossFire(e, dt);
      } else if (e.kind === 'dart') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 3.2 + e.ph) * 20 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && scrX(e.x) < VW - 40) {
          e.fireCd = (1.35 + rand(0, 0.55)) * enemyFire();
          const a = aimPlayer(e.x, e.y, 164);
          enemyShot(e.x - 8, e.y, a.vx, a.vy, 3.2, false);
        }
      } else if (e.kind === 'relic') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 2.1) * 48 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && scrX(e.x) < VW - 50) {
          e.fireCd = 1.6 * enemyFire();
          enemyShot(e.x - 6, e.y, -150, 0, 3.3, false);
        }
      } else if (e.kind === 'turret') {
        if (G.stage !== 2) e.y = groundY(e.x) - 14;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && Math.abs(scrX(e.x) - G.px) < 420) {
          e.fireCd = (1.08 + rand(0, 0.28)) * enemyFire();
          const a = aimPlayer(e.x, e.y, 174);
          enemyShot(e.x, e.y - 8, a.vx, a.vy, 3.4, false);
        }
      } else if (e.kind === 'dive') {
        if (!e.passed) {
          e.vy = lerp(e.vy, 140, 0.08);
          e.vx = lerp(e.vx, isCore() ? -210 : -180, 0.06);
          if (e.y > G.py - 8 || e.x < pwx + 10) e.passed = true;
        } else {
          e.vx = lerp(e.vx, isCore() ? 80 : 64, 0.1);
          e.vy = lerp(e.vy, -40, 0.08);
          e.fireCd -= dt;
          if (e.fireCd <= 0) {
            e.fireCd = 0.52 * enemyFire();
            const a = aimPlayer(e.x, e.y, 154);
            enemyShot(e.x + 4, e.y, a.vx, a.vy, 3.3, false);
          }
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else if (e.kind === 'heavy') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 1.4) * 16 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = 1.15 * enemyFire();
          const s = 150;
          enemyShot(e.x + 10, e.y, s, 0, 3.5, false);
          enemyShot(e.x - 10, e.y, -s, 0, 3.5, false);
          enemyShot(e.x, e.y - 10, 0, -s, 3.5, false);
          enemyShot(e.x, e.y + 10, 0, s, 3.5, false);
        }
      } else if (e.kind === 'carrier') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 1.55) * 22 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = 1.28 * enemyFire();
          enemyShot(e.x - 10, e.y, -144, 0, 3.4, false);
        }
      } else if (e.kind === 'elite') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 1.75) * 30 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = 0.82 * enemyFire();
          const a = aimPlayer(e.x, e.y, 186);
          enemyShot(e.x - 8, e.y - 7, a.vx, a.vy - 28, 3.4, false);
          enemyShot(e.x - 8, e.y + 7, a.vx, a.vy + 28, 3.4, false);
          enemyShot(e.x + 6, e.y, 160, 0, 3.2, false);
          enemyShot(e.x - 6, e.y, -160, 0, 3.2, false);
        }
      }
      if (e.kind !== 'turret' && e.kind !== 'boss' && e.kind !== 'dive') {
        const lo = Math.max(36, ceilY(e.x) + 16);
        const hi = Math.min(groundY(e.x) - 18, VH - 24);
        e.y = clamp(e.y, lo, hi);
      }
      if (e.kind !== 'boss' && (e.x < G.cam - 80 || e.x > G.cam + VW + 220)) {
        G.ents.splice(i, 1);
        continue;
      }
      if (playing() && G.invuln <= 0 && hypot(e.x - pwx, e.y - G.py) < e.r + HIT_R) {
        playerHit('撞机');
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 0.18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.bombFlash = Math.max(0, G.bombFlash - dt * 1.8);
    G.engine += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= 22 * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
    for (let i = wisps.length - 1; i >= 0; i--) {
      const w = wisps[i];
      w.t += dt;
      w.x -= 40 * dt;
      if (w.t > w.life) wisps.splice(i, 1);
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t += dt;
      if (bolts[i].t > 0.16) bolts.splice(i, 1);
    }
  }

  function updatePlayer(dt) {
    const spd = isCore() ? 324 : 282;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && !overlayOpen()) {
      G.px = lerp(G.px, pointer.x, 0.22);
      G.py = lerp(G.py, pointer.y, 0.22);
    } else {
      let dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      let dy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
      if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
      }
      G.px += dx * spd * dt;
      G.py += dy * spd * dt;
    }
    G.px = clamp(G.px, 28, 720);
    G.py = clamp(G.py, 22, VH - 10);
    const gy = groundY(G.cam + G.px);
    const cy = ceilY(G.cam + G.px);
    if (G.invuln > 0) {
      if (G.stage !== 2 && G.py > gy - 12) G.py = gy - 12;
      if (G.stage === 3 && G.py < cy + 12) G.py = cy + 12;
      if (ruinHit(G.px, G.py)) G.py = Math.min(G.py, groundY(G.cam + G.px) - ruinHAt(G.cam + G.px) - 10);
      if (spikeHit(G.px, G.py)) G.py = Math.max(G.py, ceilY(G.cam + G.px) + spikeHAt(G.cam + G.px) + 10);
    } else if (G.stage !== 2) {
      if (G.py > gy - 8) playerHit('撞地');
      else if (G.stage === 3 && G.py < cy + 8) playerHit('擦顶');
      else if (ruinHit(G.px, G.py)) playerHit('擦柱');
      else if (spikeHit(G.px, G.py)) playerHit('擦刺');
    }
    G.bank = lerp(G.bank, clamp(((keys.r ? 1 : 0) - (keys.l ? 1 : 0)) * 0.4, -1, 1), 0.12);
    if (!REDUCE && playing()) {
      wisps.push({
        x: G.px - 14, y: G.py + rand(-2, 2),
        t: 0, life: 0.28, rgb: wepRgb()
      });
      capArr(wisps, 28);
    }
  }

  function update(dt) {
    G.t += dt;
    updateFx(dt);
    if (G.mode === 'title') {
      G.cam += 28 * dt;
      updateCraws(dt);
      return;
    }
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.mode === 'lose') return;
    if (G.mode === 'win') return;

    G.fireCd = Math.max(0, G.fireCd - dt);
    G.swapCd = Math.max(0, G.swapCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    G.bombT = Math.max(0, G.bombT - dt);

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateCraws(dt);
      updateShots(dt);
      updateEnts(dt);
      updateEShots(dt);
      updateDrops(dt);
      if (G.deadT <= 0) finishDeath();
      return;
    }

    let cruise = isCore() ? 168 : 112;
    if (G.boss) cruise = isCore() ? 44 : 24;
    G.cam += cruise * dt;
    G.clock += dt;

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        hud();
      }
    }

    updatePlayer(dt);
    updateCraws(dt);
    if (G.fireHold) fire();
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updateEShots(dt);
    updateDrops(dt);

    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) winGame();
    }
  }

  function drawPoly(pts, rgb, a) {
    const c = ctx;
    c.fillStyle = rgba(rgb, a == null ? 1 : a);
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    c.fill();
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const x = ((s.x - G.cam * s.z * 0.18) % VW + VW) % VW;
      const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(G.t * 2 + s.tw));
      c.fillStyle = rgba(G.stage === 2 ? WHT : G.stage === 3 ? GOLD : MINT, a * 0.7);
      c.fillRect(sx(x), sy(s.y), s.s * scale, s.s * scale);
    }
  }

  function drawSky() {
    const c = ctx;
    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#061820');
      g.addColorStop(0.48, '#04161c');
      g.addColorStop(1, '#082018');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#081016');
      g.addColorStop(0.55, '#041410');
      g.addColorStop(1, '#0c1018');
    } else {
      g.addColorStop(0, '#041814');
      g.addColorStop(0.55, '#041610');
      g.addColorStop(1, '#062014');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawGround() {
    const c = ctx;
    const step = 10;
    if (G.stage === 2) {
      c.fillStyle = rgba(TEAL, 0.08);
      for (let i = 0; i < 5; i++) {
        const y = 40 + i * 28 + Math.sin(G.cam * 0.004 + i) * 8;
        c.beginPath();
        c.ellipse(sx(VW * 0.5 + Math.sin(G.t * 0.2 + i) * 40), sy(y), (180 - i * 18) * scale, 10 * scale, 0, 0, TAU);
        c.fill();
      }
      return;
    }
    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += step) {
      c.lineTo(sx(x), sy(groundY(G.cam + x)));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    c.fillStyle = G.stage === 3 ? '#0a1218' : '#062414';
    c.fill();
    c.strokeStyle = rgba(G.stage === 3 ? VIO : LEAF, 0.45);
    c.lineWidth = 1.4 * scale;
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const y = groundY(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(y));
      else c.lineTo(sx(x), sy(y));
    }
    c.stroke();

    if (G.stage === 1 && !G.boss) {
      const c0 = ruinCell(G.cam - 40);
      const c1 = ruinCell(G.cam + VW + 40);
      for (let cell = c0; cell <= c1; cell++) {
        const cx = ruinCx(cell);
        const h = ruinHAt(cx);
        if (h <= 0) continue;
        const gy = groundY(cx);
        const x = scrX(cx);
        c.fillStyle = rgba(LEAF, 0.55);
        c.fillRect(sx(x - 8), sy(gy - h), 16 * scale, h * scale);
        c.fillStyle = rgba(MINT, 0.35);
        c.fillRect(sx(x - 3), sy(gy - h), 6 * scale, h * scale);
      }
    }

    if (G.stage === 3) {
      c.fillStyle = '#080e14';
      c.beginPath();
      c.moveTo(sx(0), sy(0));
      for (let x = 0; x <= VW; x += step) c.lineTo(sx(x), sy(ceilY(G.cam + x)));
      c.lineTo(sx(VW), sy(0));
      c.closePath();
      c.fill();
      c.strokeStyle = rgba(VIO, 0.4);
      c.lineWidth = 1.2 * scale;
      c.beginPath();
      for (let x = 0; x <= VW; x += step) {
        const y = ceilY(G.cam + x);
        if (x === 0) c.moveTo(sx(x), sy(y));
        else c.lineTo(sx(x), sy(y));
      }
      c.stroke();
      if (!G.boss) {
        const s0 = spikeCell(G.cam - 40);
        const s1 = spikeCell(G.cam + VW + 40);
        for (let cell = s0; cell <= s1; cell++) {
          const cx = spikeCx(cell);
          const h = spikeHAt(cx);
          if (h <= 0) continue;
          const top = ceilY(cx);
          const x = scrX(cx);
          drawPoly([
            sx(x), sy(top + h),
            sx(x - 8), sy(top),
            sx(x + 8), sy(top)
          ], VIO, 0.7);
        }
      }
    }
  }

  function drawCraw(craw, x, y, a, glow) {
    const c = ctx;
    const s = scale;
    c.save();
    c.globalAlpha = a;
    c.translate(sx(x), sy(y));
    c.rotate(craw.ang);
    const r = 7 * s;
    c.strokeStyle = rgba(glow > 0 ? GOLD : TEAL, 0.95);
    c.lineWidth = 1.8 * s;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * TAU;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
    c.fillStyle = rgba(MINT, 0.35 + glow * 0.5);
    c.beginPath();
    c.arc(0, 0, 2.2 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawShip(px, py, a) {
    const c = ctx;
    const s = scale;
    c.save();
    c.globalAlpha = a;
    c.translate(sx(px), sy(py));
    c.rotate(G.bank * 0.18);
    if (G.muzzle > 0) {
      c.fillStyle = rgba(wepRgb(), G.muzzle * 8);
      c.beginPath();
      c.ellipse(18 * s, 0, 12 * s, 3.2 * s, 0, 0, TAU);
      c.fill();
    }
    if (G.wep === 3 && G.crawN > 0) {
      const len = (36 + G.crawN * 28) * s;
      c.strokeStyle = rgba(GOLD, 0.55 + 0.3 * Math.sin(G.t * 28));
      c.lineWidth = (2.4 + G.crawN) * s;
      c.beginPath();
      c.moveTo(16 * s, 0);
      c.lineTo(16 * s + len, (Math.sin(G.t * 40) * 2) * s);
      c.stroke();
    }
    c.fillStyle = rgba(MINT, 0.95);
    c.beginPath();
    c.moveTo(18 * s, 0);
    c.lineTo(-6 * s, -9 * s);
    c.lineTo(-14 * s, -3 * s);
    c.lineTo(-16 * s, 0);
    c.lineTo(-14 * s, 3 * s);
    c.lineTo(-6 * s, 9 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.fillRect(-2 * s, -3.2 * s, 14 * s, 6.4 * s);
    c.fillStyle = rgba(DEEP, 0.92);
    c.fillRect(2 * s, -1.7 * s, 8 * s, 3.4 * s);
    c.fillStyle = rgba(TEAL, 0.9);
    c.beginPath();
    c.moveTo(-8 * s, -4 * s);
    c.lineTo(4 * s, -1.4 * s);
    c.lineTo(-8 * s, -1.4 * s);
    c.closePath();
    c.fill();
    const pulse = 0.5 + 0.5 * Math.sin(G.t * 18);
    c.fillStyle = rgba(MINT, 0.45 + pulse * 0.4);
    c.beginPath();
    c.ellipse(-16 * s, 0, (6 + pulse * 2) * s, 1.7 * s, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  function flashRgb(e, base) {
    return e.flash > 0 ? WHT : base;
  }

  function drawDart(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(flashRgb(e, MINT), 0.95);
    c.beginPath();
    c.moveTo(sx(x + 12), sy(e.y));
    c.lineTo(sx(x - 8), sy(e.y - 7));
    c.lineTo(sx(x - 4), sy(e.y));
    c.lineTo(sx(x - 8), sy(e.y + 7));
    c.closePath();
    c.fill();
  }

  function drawRelic(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.ph * 1.4);
    c.strokeStyle = rgba(flashRgb(e, TEAL), 0.95);
    c.lineWidth = 1.8 * s;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const px = Math.cos(a) * 11 * s;
      const py = Math.sin(a) * 11 * s;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
    c.fillStyle = rgba(LEAF, 0.5);
    c.beginPath();
    c.arc(0, 0, 3.2 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawTurret(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(flashRgb(e, LEAF), 0.95);
    c.fillRect(sx(x - 10), sy(e.y - 8), 20 * s, 16 * s);
    c.fillStyle = rgba(GOLD, 0.7);
    c.fillRect(sx(x - 3), sy(e.y - 14), 6 * s, 10 * s);
  }

  function drawDive(e, x) {
    const c = ctx;
    c.fillStyle = rgba(flashRgb(e, AMB), 0.95);
    c.beginPath();
    c.moveTo(sx(x), sy(e.y + 12));
    c.lineTo(sx(x - 8), sy(e.y - 8));
    c.lineTo(sx(x + 8), sy(e.y - 8));
    c.closePath();
    c.fill();
  }

  function drawHeavy(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(flashRgb(e, VIO), 0.95);
    c.fillRect(sx(x - 14), sy(e.y - 10), 28 * s, 20 * s);
    c.strokeStyle = rgba(GOLD, 0.7);
    c.lineWidth = 1.2 * s;
    c.strokeRect(sx(x - 8), sy(e.y - 5), 16 * s, 10 * s);
    c.fillStyle = rgba(MINT, 0.6);
    c.fillRect(sx(x + 10), sy(e.y - 2), 8 * s, 4 * s);
    c.fillRect(sx(x - 18), sy(e.y - 2), 8 * s, 4 * s);
    c.fillRect(sx(x - 2), sy(e.y - 16), 4 * s, 8 * s);
    c.fillRect(sx(x - 2), sy(e.y + 8), 4 * s, 8 * s);
  }

  function drawCarrier(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(flashRgb(e, TEAL), 0.95);
    c.beginPath();
    c.moveTo(sx(x + 16), sy(e.y));
    c.lineTo(sx(x - 14), sy(e.y - 12));
    c.lineTo(sx(x - 18), sy(e.y));
    c.lineTo(sx(x - 14), sy(e.y + 12));
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.8);
    c.lineWidth = 1.3 * s;
    c.beginPath();
    c.arc(sx(x), sy(e.y), 6 * s, 0, TAU);
    c.stroke();
  }

  function drawElite(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(flashRgb(e, MAG), 0.95);
    c.beginPath();
    c.moveTo(sx(x + 14), sy(e.y));
    c.lineTo(sx(x), sy(e.y - 12));
    c.lineTo(sx(x - 12), sy(e.y));
    c.lineTo(sx(x), sy(e.y + 12));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.7);
    c.fillRect(sx(x - 3), sy(e.y - 3), 6 * s, 6 * s);
  }

  function drawDrop(d, x) {
    const c = ctx;
    const s = scale;
    const rgb = d.kind === 'bomb' ? GOLD : TEAL;
    const bob = Math.sin(d.t * 6) * 2;
    c.save();
    c.translate(sx(x), sy(d.y + bob));
    c.strokeStyle = rgba(rgb, 0.95);
    c.lineWidth = 1.6 * s;
    if (d.kind === 'bomb') {
      c.beginPath();
      c.arc(0, 0, 8 * s, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(GOLD, 0.85);
      c.font = 'bold ' + (10 * s) + 'px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('闪', 0, 0.5 * s);
    } else {
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + d.t;
        const px = Math.cos(a) * 8 * s;
        const py = Math.sin(a) * 8 * s;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.stroke();
    }
    c.restore();
  }

  function drawBoss(e, x) {
    const c = ctx;
    const s = scale;
    const rgb = flashRgb(e, G.stage === 3 ? GOLD : G.stage === 2 ? TEAL : LEAF);
    c.save();
    c.translate(sx(x), sy(e.y));
    if (G.stage === 1) {
      c.fillStyle = rgba(rgb, 0.95);
      c.fillRect(-28 * s, -22 * s, 56 * s, 44 * s);
      c.fillStyle = rgba(DEEP, 0.85);
      c.fillRect(-12 * s, -10 * s, 24 * s, 20 * s);
      c.strokeStyle = rgba(MINT, 0.7);
      c.lineWidth = 2 * s;
      c.strokeRect(-32 * s, -26 * s, 64 * s, 52 * s);
    } else if (G.stage === 2) {
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.moveTo(36 * s, 0);
      c.lineTo(-8 * s, -28 * s);
      c.lineTo(-32 * s, -10 * s);
      c.lineTo(-32 * s, 10 * s);
      c.lineTo(-8 * s, 28 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(GOLD, 0.7);
      c.fillRect(-8 * s, -6 * s, 22 * s, 12 * s);
    } else {
      const open = e.open == null ? coreOpen(e) : e.open;
      c.rotate(e.ph * 0.35);
      c.fillStyle = rgba(GOLD, 0.35 + open * 0.5);
      c.beginPath();
      c.arc(0, 0, 16 * s, 0, TAU);
      c.fill();
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI * 0.5;
        c.save();
        c.rotate(a);
        c.fillStyle = rgba(rgb, 0.92);
        const gap = 8 + open * 14;
        c.fillRect((gap) * s, -10 * s, 22 * s, 20 * s);
        c.restore();
      }
    }
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.x);
      if (x < -50 || x > VW + 60) continue;
      if (e.kind === 'dart') drawDart(e, x);
      else if (e.kind === 'relic') drawRelic(e, x);
      else if (e.kind === 'turret') drawTurret(e, x);
      else if (e.kind === 'dive') drawDive(e, x);
      else if (e.kind === 'heavy') drawHeavy(e, x);
      else if (e.kind === 'carrier') drawCarrier(e, x);
      else if (e.kind === 'elite') drawElite(e, x);
      else if (e.kind === 'boss') drawBoss(e, x);
    }
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      const x = scrX(d.x);
      if (x > -20 && x < VW + 20) drawDrop(d, x);
    }
  }

  function drawShots() {
    const c = ctx;
    const s = scale;
    for (let i = 0; i < G.shots.length; i++) {
      const sh = G.shots[i];
      const x = scrX(sh.wx);
      let rgb = MINT;
      if (sh.kind === 'back') rgb = TEAL;
      else if (sh.kind === 'quad') rgb = VIO;
      else if (sh.kind === 'sword') rgb = GOLD;
      if (sh.kind === 'sword') {
        c.strokeStyle = rgba(GOLD, 0.95);
        c.lineWidth = sh.r * 0.7 * s;
        c.beginPath();
        c.moveTo(sx(x - 18), sy(sh.y));
        c.lineTo(sx(x + 10), sy(sh.y + Math.sin(G.t * 50) * 3));
        c.stroke();
        c.strokeStyle = rgba(WHT, 0.8);
        c.lineWidth = 1.4 * s;
        c.beginPath();
        c.moveTo(sx(x - 10), sy(sh.y));
        c.lineTo(sx(x + 14), sy(sh.y));
        c.stroke();
      } else {
        c.fillStyle = rgba(rgb, 0.95);
        c.beginPath();
        c.ellipse(sx(x), sy(sh.y), (sh.kind === 'quad' ? 4.2 : 5.2) * s, 2.2 * s, Math.atan2(sh.vy || 0, sh.vx || 1), 0, TAU);
        c.fill();
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const sh = G.eShots[i];
      const x = scrX(sh.x);
      c.fillStyle = rgba(sh.fat ? MAG : PNK, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(sh.y), sh.r * s, 0, TAU);
      c.fill();
    }
  }

  function drawBossBar() {
    if (!G.boss) return;
    let b = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'boss' && G.ents[i].alive) {
        b = G.ents[i];
        break;
      }
    }
    if (!b) return;
    const c = ctx;
    const x = sx(VW * 0.5 - 140);
    const y = sy(16);
    const w = 280 * scale;
    const h = 7 * scale;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(x - 2, y - 2, w + 4, h + 4);
    c.fillStyle = rgba(MAG, 0.35);
    c.fillRect(x, y, w, h);
    c.fillStyle = rgba(GOLD, 0.95);
    c.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), h);
  }

  function drawFx() {
    const c = ctx;
    const s = scale;
    for (let i = 0; i < wisps.length; i++) {
      const w = wisps[i];
      c.fillStyle = rgba(w.rgb, 0.35 * (1 - w.t / w.life));
      c.beginPath();
      c.ellipse(sx(w.x), sy(w.y), 6 * s, 1.6 * s, 0, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      c.fillStyle = rgba(t.rgb, t.t * 4);
      c.beginPath();
      c.arc(sx(t.x), sy(t.y), 2.2 * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const a = 1 - sp.t / 0.28;
      c.strokeStyle = rgba(sp.rgb, a);
      c.lineWidth = 1.2 * s;
      for (let k = 0; k < 5; k++) {
        const ang = k / 5 * TAU + sp.t * 8;
        c.beginPath();
        c.moveTo(sx(sp.x), sy(sp.y));
        c.lineTo(sx(sp.x + Math.cos(ang) * sp.rad * a), sy(sp.y + Math.sin(ang) * sp.rad * a));
        c.stroke();
      }
    }
    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const a = 1 - rg.t / 0.42;
      c.strokeStyle = rgba(rg.rgb, a * 0.8);
      c.lineWidth = 2 * s;
      c.beginPath();
      c.arc(sx(rg.x), sy(rg.y), (rg.r + rg.t * 90) * s, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      const a = 1 - b.t / 0.16;
      c.strokeStyle = rgba(b.rgb, a);
      c.lineWidth = 2.4 * s;
      c.beginPath();
      c.moveTo(sx(b.x), sy(b.y));
      c.lineTo(sx(b.x + b.len), sy(b.y + Math.sin(G.t * 60) * 4));
      c.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      c.font = 'bold ' + (f.size * s) + 'px sans-serif';
      c.textAlign = 'center';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const a = G.invuln > 0 ? (Math.sin(G.t * 28) > 0 ? 0.35 : 0.9) : 1;
    if (G.crawN > 0) {
      for (let i = 0; i < G.crawN; i++) {
        const cl = G.craws[i];
        drawCraw(cl, cl.x, cl.y, a, cl.glow);
      }
    }
    drawShip(G.px, G.py, a);
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#041610';
    c.fillRect(0, 0, W, H);

    c.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake * scale;
      shy = (Math.random() - 0.5) * G.shake * 0.7 * scale;
    }
    const punch = REDUCE ? 1 : G.punch;
    c.translate(W * 0.5 + shx, H * 0.5 + shy);
    c.scale(punch, punch);
    c.translate(-W * 0.5, -H * 0.5);

    drawSky();
    drawStars();
    drawGround();
    drawEnts();
    drawShots();
    drawPlayer();
    drawBossBar();
    drawFx();

    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function resetRun(kind) {
    G.kind = kind || 'force';
    G.t = 0;
    G.clock = 0;
    G.cam = 0;
    G.px = 96;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.waveI = 0;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.drops.length = 0;
    G.crawN = 2;
    G.wep = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.swapCd = 0;
    G.bombs = BOMB_START;
    G.bombT = 0;
    G.bombFlash = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.toastT = 0;
    G.why = '';
    G.boss = false;
    G.winT = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wisps.length = 0;
    trails.length = 0;
    bolts.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    uid = 1;
    resetCraws();
  }

  function startGame(kind) {
    resetRun(kind || 'force');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isCore() ? '雷核' : '雷四', false, true);
    maybeSpawn();
    hud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('force');
    G.mode = 'title';
    showOverlay('title', '雷四', LEAD);
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('force');
    else startGame(G.kind || 'force');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('force');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    const bombKey = k === 'z' || k === 'Z' || k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    const qKey = k === 'q' || k === 'Q';
    const eKey = k === 'e' || k === 'E';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || bombKey || qKey || eKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || bombKey || qKey || eKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (qKey) {
      audio.ensure();
      swapWep(-1);
      return;
    }
    if (eKey) {
      audio.ensure();
      swapWep(1);
      return;
    }
    if (bombKey) {
      tryBomb();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'core' : 'force');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.button === 2) {
        e.preventDefault();
        swapWep(1);
        return;
      }
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) G.fireHold = false;
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

  function selfCheck() {
    if (BEST_KEY !== 'playbox-thunder-force4-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-thunder-force4-mute') throw new Error('mute key');
    if (WEPS.length !== 4) throw new Error('four weapons');
    if (STAGES.length !== 3) throw new Error('three stages');
  }

  selfCheck();
  seedStars();
  resetCraws();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnForce) {
    btnForce.addEventListener('click', function () {
      audio.ensure();
      startGame('force');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'force');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  function bindSwap(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      swapWep(1);
    });
  }
  function bindBomb(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      tryBomb();
    });
  }
  bindSwap(btnWep);
  bindSwap(btnPadWep);
  bindBomb(btnBomb);
  bindBomb(btnPadBomb);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    G.fireHold = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
