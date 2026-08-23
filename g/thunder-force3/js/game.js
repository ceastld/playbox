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
  const WING_R = 11;
  const WING_MAX = 2;
  const BEST_KEY = 'playbox-thunder-force3-best';
  const MUTE_KEY = 'playbox-thunder-force3-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格 / Z 射击 · X 切武器 · R 重开 · M 静音';
  const LEAD = '海渊、冰冕、冥门。并射、背刺、穿波、猎核、裂光。穿波与裂光可穿过礁柱。翼卫绕舰挡弹。撞地、撞机、中弹都掉命。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const CYN = [30, 200, 255];
  const TEAL = [62, 240, 212];
  const GOLD = [255, 227, 107];
  const MAG = [255, 61, 184];
  const WHT = [228, 248, 255];
  const ICE = [184, 232, 255];
  const SEA = [42, 138, 212];
  const HOT = [122, 223, 255];
  const DEEP = [2, 16, 24];
  const PNK = [255, 154, 212];
  const LAVA = [255, 122, 60];

  const WEPS = [
    { name: '并射', cd: 0.086, dmg: 1 },
    { name: '背刺', cd: 0.096, dmg: 1.14 },
    { name: '穿波', cd: 0.152, dmg: 1.38 },
    { name: '猎核', cd: 0.205, dmg: 1.68 },
    { name: '裂光', cd: 0.168, dmg: 1.48 }
  ];

  const SCORE = {
    ray: 50,
    coil: 80,
    reef: 90,
    sub: 70,
    crystal: 140,
    ferry: 180,
    ace: 210,
    boss: [2500, 4300, 7200],
    clear: 1600,
    all: 4100,
    core: 5300,
    wingMax: 340
  };

  const STAGES = [
    {
      name: '海渊',
      boss: '海卫',
      theme: 'sea',
      bossHp: 78,
      waves: [
        { t: 0.5, kind: 'v', n: 5 },
        { t: 2.0, kind: 'ferry' },
        { t: 3.6, kind: 'coil', n: 3 },
        { t: 5.4, kind: 'reef', n: 2 },
        { t: 7.4, kind: 'v', n: 6 },
        { t: 9.8, kind: 'sub', n: 3 },
        { t: 12.2, kind: 'coil', n: 4 },
        { t: 14.8, kind: 'mix' },
        { t: 17.6, kind: 'v', n: 7 },
        { t: 20.2, kind: 'reef', n: 2 },
        { t: 23.2, kind: 'boss' }
      ]
    },
    {
      name: '冰冕',
      boss: '冰核',
      theme: 'ice',
      bossHp: 104,
      waves: [
        { t: 0.45, kind: 'v', n: 6 },
        { t: 1.9, kind: 'sub', n: 4 },
        { t: 3.6, kind: 'crystal', n: 2 },
        { t: 5.4, kind: 'ace' },
        { t: 7.6, kind: 'v', n: 8 },
        { t: 10.0, kind: 'ferry' },
        { t: 12.4, kind: 'sub', n: 5 },
        { t: 14.8, kind: 'coil', n: 4 },
        { t: 17.2, kind: 'crystal', n: 2 },
        { t: 19.8, kind: 'mix' },
        { t: 23.0, kind: 'boss' }
      ]
    },
    {
      name: '冥门',
      boss: '门核',
      theme: 'gate',
      bossHp: 142,
      waves: [
        { t: 0.4, kind: 'v', n: 7 },
        { t: 1.8, kind: 'ferry' },
        { t: 3.2, kind: 'sub', n: 4 },
        { t: 4.8, kind: 'ace' },
        { t: 7.0, kind: 'crystal', n: 2 },
        { t: 9.4, kind: 'reef', n: 3 },
        { t: 11.8, kind: 'v', n: 8 },
        { t: 14.4, kind: 'mix' },
        { t: 17.0, kind: 'sub', n: 5 },
        { t: 19.6, kind: 'ace' },
        { t: 22.4, kind: 'coil', n: 4 },
        { t: 25.2, kind: 'boss' }
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
  const btnPadWep = document.getElementById('btn-pad-wep');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wepLabel = document.getElementById('wep-label');
  const wingLabel = document.getElementById('wing-label');
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
    wings: [],
    wingN: 2,
    wep: 0,
    fireCd: 0,
    fireHold: false,
    swapCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
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
    if (G.wep === 2) return GOLD;
    if (G.wep === 3) return MAG;
    if (G.wep === 4) return ICE;
    return CYN;
  }
  function fireScale() {
    return isCore() ? 0.92 : 1;
  }
  function enemyFire() {
    return isCore() ? 0.76 : 1;
  }
  function shotGhost(sh) {
    return sh.kind === 'wave' || sh.kind === 'laser';
  }

  function groundY(wx) {
    const n = Math.sin(wx * 0.011) * 14 + Math.sin(wx * 0.029 + 1.3) * 9 + Math.sin(wx * 0.0073 + 0.4) * 7;
    let base = G.stage === 1 ? VH - 30 : G.stage === 2 ? VH - 22 : VH - 20;
    const amp = G.stage === 1 ? 0.88 : G.stage === 2 ? 0.55 : 0.32;
    let g = base + n * amp;
    if (G.boss) g = Math.max(g, VH - 40);
    if (wx < 90) g = lerp(VH - 18, g, wx / 90);
    return clamp(g, VH - 82, VH - 12);
  }

  function ceilY(wx) {
    if (G.stage === 1) return 0;
    if (G.boss) return G.stage === 3 ? 14 : 10;
    if (G.stage === 2) {
      const n = Math.sin(wx * 0.014) * 8 + Math.sin(wx * 0.033 + 0.6) * 5;
      return clamp(10 + n, 6, 28);
    }
    const n = Math.sin(wx * 0.012) * 9 + Math.sin(wx * 0.028 + 0.8) * 5;
    return clamp(12 + n, 8, 34);
  }

  function coralCell(wx) {
    return Math.floor((wx + 40) / 210);
  }
  function coralCx(cell) {
    return cell * 210 + 105;
  }
  function coralHAt(wx) {
    if (G.stage !== 1 || G.boss) return 0;
    const cell = coralCell(wx);
    const h = hash2(cell * 19 + 5);
    if (h < 0.58) return 0;
    return 32 + h * 58;
  }
  function coralHit(px, py) {
    if (G.stage !== 1 || G.boss) return false;
    const wx = G.cam + px;
    const cell = coralCell(wx);
    const cx = coralCx(cell);
    if (Math.abs(wx - cx) > 13) return false;
    const gy = groundY(cx);
    const h = coralHAt(cx);
    return h > 0 && py > gy - h - 6;
  }
  function coralHitWorld(wx, py) {
    if (G.stage !== 1 || G.boss) return false;
    const cell = coralCell(wx);
    const cx = coralCx(cell);
    if (Math.abs(wx - cx) > 13) return false;
    const gy = groundY(cx);
    const h = coralHAt(cx);
    return h > 0 && py > gy - h - 4;
  }

  function iceCell(wx) {
    return Math.floor((wx + 30) / 196);
  }
  function iceCx(cell) {
    return cell * 196 + 98;
  }
  function iceHAt(wx) {
    if (G.stage !== 2 || G.boss) return 0;
    const cell = iceCell(wx);
    const h = hash2(cell * 21 + 9);
    if (h < 0.52) return 0;
    return 28 + h * 56;
  }
  function iceHit(px, py) {
    if (G.stage !== 2 || G.boss) return false;
    const wx = G.cam + px;
    const cell = iceCell(wx);
    const cx = iceCx(cell);
    if (Math.abs(wx - cx) > 11) return false;
    const h = iceHAt(cx);
    const top = ceilY(cx);
    return h > 0 && py < top + h + 6;
  }
  function iceHitWorld(wx, py) {
    if (G.stage !== 2 || G.boss) return false;
    const cell = iceCell(wx);
    const cx = iceCx(cell);
    if (Math.abs(wx - cx) > 11) return false;
    const h = iceHAt(cx);
    const top = ceilY(cx);
    return h > 0 && py < top + h + 4;
  }

  function gateCell(wx) {
    return Math.floor((wx + 28) / 204);
  }
  function gateCx(cell) {
    return cell * 204 + 102;
  }
  function gateHAt(wx) {
    if (G.stage !== 3 || G.boss) return 0;
    const cell = gateCell(wx);
    const h = hash2(cell * 23 + 11);
    if (h < 0.5) return 0;
    return 30 + h * 62;
  }
  function gateHit(px, py) {
    if (G.stage !== 3 || G.boss) return false;
    const wx = G.cam + px;
    const cell = gateCell(wx);
    const cx = gateCx(cell);
    if (Math.abs(wx - cx) > 12) return false;
    const h = gateHAt(cx);
    const top = ceilY(cx);
    return h > 0 && py < top + h + 6;
  }
  function gateHitWorld(wx, py) {
    if (G.stage !== 3 || G.boss) return false;
    const cell = gateCell(wx);
    const cx = gateCx(cell);
    if (Math.abs(wx - cx) > 12) return false;
    const h = gateHAt(cx);
    const top = ceilY(cx);
    return h > 0 && py < top + h + 4;
  }

  function terrainHit(px, py) {
    return coralHit(px, py) || iceHit(px, py) || gateHit(px, py);
  }
  function terrainHitWorld(wx, py) {
    return coralHitWorld(wx, py) || iceHitWorld(wx, py) || gateHitWorld(wx, py);
  }
  function terrainWhy() {
    if (G.stage === 1) return '擦礁';
    if (G.stage === 2) return '擦冰';
    return '擦门';
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
        this.beep(620, 0.05, 'square', 0.028, 210);
        this.beep(310, 0.062, 'triangle', 0.018, 110);
      } else if (w === 2) {
        this.beep(190, 0.1, 'sawtooth', 0.04, 760);
        this.beep(480, 0.08, 'triangle', 0.026, 180);
        this.noise(0.048, 0.026, 640);
      } else if (w === 3) {
        this.beep(880, 0.04, 'triangle', 0.03, 1320);
        this.beep(440, 0.08, 'square', 0.024, 220);
      } else if (w === 4) {
        this.beep(160, 0.11, 'sawtooth', 0.044, 980);
        this.beep(980, 0.07, 'sine', 0.03, 1960);
        this.noise(0.06, 0.03, 500);
      } else {
        this.beep(900, 0.036, 'square', 0.028, 1700);
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
    wing() {
      this.ensure();
      this.beep(494, 0.07, 'square', 0.04, 740);
      this.beep(740, 0.09, 'triangle', 0.034, 988);
      this.beep(988, 0.14, 'sine', 0.032, 1480);
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
    },
    rock() {
      this.ensure();
      this.noise(0.03, 0.02, 800);
      this.beep(240, 0.04, 'triangle', 0.016, 80);
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
      if (G.mode === 'title') stageLabel.textContent = '海渊';
      else if (G.boss) stageLabel.textContent = stageDef().boss;
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + stageDef().name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '雷核' : '雷三';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isCore());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (wepLabel) {
      wepLabel.textContent = WEPS[G.wep].name;
      wepLabel.className = 'wep w' + G.wep;
    }
    if (wingLabel) {
      wingLabel.textContent = '翼 ' + G.wingN;
      wingLabel.classList.toggle('off', G.wingN <= 0);
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
    else if (G.mode === 'lose') setHint('R 重开 · 空格 / Z 射击，X 切槽', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 门核尽碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞机、中弹、擦地都掉命', 'warn');
    else if (G.wep === 1) setHint('背刺 · 打身后潜梭与贴礁炮', '');
    else if (G.wep === 2) setHint('穿波 · 穿过礁柱、冰刺、冥门', 'hot');
    else if (G.wep === 3) setHint('猎核 · 翼卫各发一枚追踪', 'hot');
    else if (G.wep === 4) setHint('裂光 · 细束穿群，礁柱挡不住', 'hot');
    else setHint('空格 / Z 连射 · X 切并射、背刺、穿波、猎核、裂光', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TF3';
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
    const cls = mag >= 6 ? 'die' : mag >= 3.2 ? 'pow' : 'hit';
    stageEl.classList.remove('die', 'hit', 'pow');
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
    for (let i = 0; i < 74; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * (VH - 80),
        z: 0.22 + Math.random() * 0.9,
        s: 0.5 + Math.random() * 1.6,
        tw: Math.random() * TAU
      });
    }
  }

  function resetWings() {
    G.wings.length = 0;
    for (let i = 0; i < WING_MAX; i++) {
      G.wings.push({
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

  function spawnRay(x, y, ph) {
    pushEnt({
      kind: 'ray', x: x, y: y, hp: 1, r: 11, score: SCORE.ray,
      vx: isCore() ? -74 : -56, vy: 0, ph: ph || 0
    });
  }
  function spawnCoil(x, y) {
    pushEnt({
      kind: 'coil', x: x, y: y, hp: 3, r: 13, score: SCORE.coil,
      vx: isCore() ? -44 : -34, vy: 0
    });
  }
  function spawnReef(x, y) {
    pushEnt({
      kind: 'reef', x: x, y: y, hp: 4, r: 14, score: SCORE.reef,
      vx: 0, vy: 0
    });
  }
  function spawnSub(x, y) {
    pushEnt({
      kind: 'sub', x: x, y: y, hp: 2, r: 11, score: SCORE.sub,
      vx: isCore() ? -236 : -206, vy: 0, ph: 0
    });
  }
  function spawnCrystal(x, y) {
    pushEnt({
      kind: 'crystal', x: x, y: y, hp: 6, r: 16, score: SCORE.crystal,
      vx: isCore() ? -34 : -24, vy: 0
    });
  }
  function spawnFerry(x, y) {
    pushEnt({
      kind: 'ferry', x: x, y: y, hp: 8, r: 18, score: SCORE.ferry,
      vx: isCore() ? -30 : -22, vy: 0, drop: true
    });
  }
  function spawnAce(x, y) {
    pushEnt({
      kind: 'ace', x: x, y: y, hp: 10, r: 16, score: SCORE.ace,
      vx: isCore() ? -32 : -24, vy: 0, drop: true
    });
  }

  function spawnBoss() {
    const st = stageDef();
    const hp = Math.round(st.bossHp * (isCore() ? 1.27 : 1));
    pushEnt({
      kind: 'boss',
      x: G.cam + VW + 80,
      y: VH * 0.5,
      hp: hp,
      max: hp,
      r: 38,
      score: SCORE.boss[clamp(G.stage - 1, 0, 2)],
      vx: -46,
      vy: 0,
      ph: 0,
      fireCd: 0.6,
      drop: true,
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
    const extra = isCore() && w.kind !== 'boss' && w.kind !== 'ferry' && w.kind !== 'ace' ? 2 : 0;
    const n = (w.n || 1) + extra;
    if (w.kind === 'v') {
      for (let i = 0; i < n; i++) {
        const k = i - (n - 1) * 0.5;
        spawnRay(baseX + Math.abs(k) * 18, VH * 0.46 + k * 36, i * 0.2);
      }
    } else if (w.kind === 'coil') {
      for (let i = 0; i < n; i++) {
        spawnCoil(baseX + i * 30, 86 + i * ((VH - 180) / Math.max(1, n - 1)));
      }
    } else if (w.kind === 'reef') {
      for (let i = 0; i < n; i++) {
        const gx = baseX + i * 54;
        spawnReef(gx, groundY(gx) - 14);
      }
    } else if (w.kind === 'sub') {
      for (let i = 0; i < n; i++) spawnSub(baseX + i * 28, 70 + (i * 73) % (VH - 170));
    } else if (w.kind === 'crystal') {
      for (let i = 0; i < n; i++) {
        const gx = baseX + i * 44;
        spawnCrystal(gx, groundY(gx) - 16);
      }
    } else if (w.kind === 'ferry') {
      spawnFerry(baseX + 20, VH * 0.5 + rand(-40, 40));
    } else if (w.kind === 'ace') {
      spawnAce(baseX + 16, VH * 0.42 + rand(-30, 30));
      if (isCore()) spawnAce(baseX + 50, VH * 0.62);
    } else if (w.kind === 'mix') {
      spawnFerry(baseX, VH * 0.46);
      spawnCoil(baseX + 40, 80);
      spawnCrystal(baseX + 40, groundY(baseX + 40) - 16);
      spawnRay(baseX + 70, VH * 0.5, 0);
      if (isCore()) spawnSub(baseX + 90, VH * 0.3);
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

  function dropWing(x, y) {
    G.drops.push({
      x: x,
      y: y,
      vx: -20,
      vy: rand(-18, 18),
      t: 0,
      life: 12
    });
    capArr(G.drops, 8);
  }

  function collectDrop(d) {
    if (G.wingN < WING_MAX) {
      G.wingN += 1;
      toast(G.wingN >= 2 ? '双翼' : '翼卫', false, true);
      floatText(d.x - G.cam, d.y - 10, G.wingN >= 2 ? '双翼' : '翼卫', GOLD);
      audio.wing();
    } else {
      const n = Math.round(SCORE.wingMax * G.mult);
      addScore(n);
      toast('MAX', false, true);
      floatText(d.x - G.cam, d.y - 10, '+' + n, GOLD);
      audio.up();
    }
    for (let i = 0; i < G.wings.length; i++) G.wings[i].glow = 1;
    burst(d.x - G.cam, d.y, 12, GOLD, 20);
    hitStop(0.05);
    kick(2.2);
    screenFlash(GOLD, 0.22);
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

  function swapWep() {
    if (G.swapCd > 0) return;
    if (G.mode === 'title' || overlayOpen()) return;
    if (!playing()) return;
    G.wep = (G.wep + 1) % WEPS.length;
    G.swapCd = 0.16;
    audio.swap();
    toast(WEPS[G.wep].name, false, G.wep >= 2);
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
    capArr(G.shots, 90);
  }

  function nearestEnemy(wx, y, maxd) {
    let best = null;
    let bd = maxd;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const d = hypot(e.x - wx, e.y - y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  function fireHunt(wx, y) {
    const tgt = nearestEnemy(wx + 40, y, 380);
    let ang = 0;
    if (tgt) ang = Math.atan2(tgt.y - y, tgt.x - wx);
    pushShot({
      kind: 'hunt', wx: wx, y: y, ang: ang, spd: 430,
      vx: Math.cos(ang) * 430, vy: Math.sin(ang) * 430,
      dmg: WEPS[3].dmg, r: 4.6, pierce: 0
    });
  }

  function fire() {
    if (!playing() || G.fireCd > 0) return;
    const w = WEPS[G.wep];
    G.fireCd = w.cd * fireScale();
    G.muzzle = G.wep === 4 ? 0.08 : 0.055;
    audio.shoot(G.wep);
    const wx = G.cam + G.px + 16;
    const rgb = wepRgb();
    if (G.wep === 0) {
      pushShot({ kind: 'twin', wx: wx, y: G.py - 5, vx: 650, vy: 0, dmg: w.dmg, r: 3.2, pierce: 0 });
      pushShot({ kind: 'twin', wx: wx, y: G.py + 5, vx: 650, vy: 0, dmg: w.dmg, r: 3.2, pierce: 0 });
      for (let i = 0; i < G.wingN; i++) {
        const c = G.wings[i];
        pushShot({
          kind: 'twin', wx: G.cam + c.x + 8, y: c.y, vx: 630, vy: 0,
          dmg: w.dmg * 0.85, r: 2.8, pierce: 0
        });
      }
    } else if (G.wep === 1) {
      pushShot({ kind: 'back', wx: wx, y: G.py, vx: 630, vy: 0, dmg: w.dmg, r: 3.3, pierce: 0 });
      pushShot({ kind: 'back', wx: G.cam + G.px - 10, y: G.py - 6, vx: -570, vy: 0, dmg: w.dmg, r: 3.3, pierce: 0 });
      pushShot({ kind: 'back', wx: G.cam + G.px - 10, y: G.py + 6, vx: -570, vy: 0, dmg: w.dmg, r: 3.3, pierce: 0 });
      for (let i = 0; i < G.wingN; i++) {
        const c = G.wings[i];
        pushShot({
          kind: 'back', wx: G.cam + c.x - 6, y: c.y, vx: -550, vy: 0,
          dmg: w.dmg * 0.9, r: 2.8, pierce: 0
        });
      }
    } else if (G.wep === 2) {
      pushShot({
        kind: 'wave', wx: wx, y: G.py, y0: G.py, vx: 510, vy: 0,
        amp: 26, ph: 0, dmg: w.dmg, r: 13, pierce: 2
      });
      for (let i = 0; i < G.wingN; i++) {
        const c = G.wings[i];
        pushShot({
          kind: 'twin', wx: G.cam + c.x + 8, y: c.y, vx: 560, vy: 0,
          dmg: 0.9, r: 3, pierce: 0
        });
      }
    } else if (G.wep === 3) {
      pushShot({ kind: 'twin', wx: wx, y: G.py, vx: 600, vy: 0, dmg: 1, r: 3.2, pierce: 0 });
      if (G.wingN <= 0) fireHunt(wx, G.py);
      for (let i = 0; i < G.wingN; i++) {
        const c = G.wings[i];
        fireHunt(G.cam + c.x + 4, c.y);
      }
    } else {
      pushShot({
        kind: 'laser', wx: wx, y: G.py, vx: 820, vy: 0,
        dmg: w.dmg, r: 4.2, pierce: 4, life: 0.85
      });
      for (let i = 0; i < G.wingN; i++) {
        const c = G.wings[i];
        pushShot({
          kind: 'laser', wx: G.cam + c.x + 8, y: c.y, vx: 780, vy: 0,
          dmg: w.dmg * 0.72, r: 3.2, pierce: 2, life: 0.7
        });
      }
    }
    emit(3, {
      x: G.px + 18, y: G.py, j: 3,
      vx0: 40, vx1: 120, vy0: -20, vy1: 20,
      r0: 1, r1: 2.2, life: 0.16, rgb: rgb, g: 0
    });
  }

  function enemyShot(x, y, vx, vy, r, fat) {
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.4, fat: !!fat, life: 3.2
    });
    capArr(G.eShots, 90);
  }

  function aimPlayer(ex, ey, spd) {
    const px = G.cam + G.px;
    const dx = px - ex;
    const dy = G.py - ey;
    const d = hypot(dx, dy) || 1;
    return { vx: dx / d * spd, vy: dy / d * spd };
  }

  function coreOpen(b) {
    return 0.5 + 0.5 * Math.sin(b.ph * 1.35);
  }

  function hurtEnemy(e, dmg, hx, hy) {
    if (!e.alive) return;
    let dealt = dmg;
    if (e.kind === 'boss' && G.stage === 3) {
      const open = coreOpen(e);
      e.open = open;
      if (open < 0.55) dealt = dmg * 0.35;
    }
    e.hp -= dealt;
    e.flash = 0.08;
    noteCombo();
    audio.hit(G.combo);
    emit(4, {
      x: hx - G.cam, y: hy, j: 3,
      vx0: -50, vx1: 80, vy0: -60, vy1: 60,
      r0: 1, r1: 2.4, life: 0.22, rgb: e.kind === 'boss' ? GOLD : CYN, g: 40
    });
    const stop = e.kind === 'boss' ? 0.055 : dmg >= 1.3 ? 0.048 : 0.038;
    hitStop(stop);
    kick(e.kind === 'boss' ? 2.6 : 1.5);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.alive = false;
    const sxv = e.x - G.cam;
    const rgb = e.kind === 'boss' ? GOLD
      : e.kind === 'ace' ? MAG
        : e.kind === 'coil' ? TEAL
          : e.kind === 'sub' ? LAVA
            : e.kind === 'crystal' ? ICE
              : CYN;
    burst(sxv, e.y, e.kind === 'boss' ? 28 : 12, rgb, e.kind === 'boss' ? 46 : 22);
    floatText(sxv, e.y - 8, String(Math.round(e.score * G.mult)), GOLD);
    addScore(Math.round(e.score * G.mult));
    if (e.drop || (e.kind !== 'ray' && Math.random() < (e.kind === 'ferry' ? 1 : 0.16))) {
      dropWing(e.x, e.y);
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
    if (G.wingN > 0) {
      dropWing(G.cam + G.px + 10, G.py);
      if (G.wingN > 1) dropWing(G.cam + G.px + 4, G.py + 16);
      G.wingN = 0;
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
    resetWings();
    toast('残机 ' + G.lives, true, false);
    hud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '翼卫没护住。R 立刻重开，或换模式。');
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
      isCore() ? '雷核通关' : '门核尽碎',
      isCore() ? '密航打穿。核心从冥门散了。' : '三关打穿。把门核从冥门打穿。'
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

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function updateWings(dt) {
    for (let i = 0; i < G.wings.length; i++) {
      const c = G.wings[i];
      c.ang += dt * 4.6;
      c.glow = Math.max(0, c.glow - dt * 1.8);
      const on = i < G.wingN && G.deadT <= 0;
      const tx = G.px + 8 + Math.cos(c.ang) * 24;
      const ty = G.py + Math.sin(c.ang) * 17;
      if (on) {
        c.x = lerp(c.x, tx, 0.28);
        c.y = lerp(c.y, ty, 0.28);
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
      const gy = groundY(d.x) - 10;
      if (d.y > gy) {
        d.y = gy;
        d.vy *= -0.4;
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
      if (sh.kind === 'wave') {
        sh.ph += dt * 11;
        sh.y = sh.y0 + Math.sin(sh.ph) * sh.amp;
        sh.wx += sh.vx * dt;
      } else if (sh.kind === 'hunt') {
        const tgt = nearestEnemy(sh.wx, sh.y, 380);
        if (tgt) {
          const want = Math.atan2(tgt.y - sh.y, tgt.x - sh.wx);
          let d = want - sh.ang;
          while (d > Math.PI) d -= TAU;
          while (d < -Math.PI) d += TAU;
          sh.ang += clamp(d, -5.2 * dt, 5.2 * dt);
        }
        sh.vx = Math.cos(sh.ang) * sh.spd;
        sh.vy = Math.sin(sh.ang) * sh.spd;
        sh.wx += sh.vx * dt;
        sh.y += sh.vy * dt;
        if (!REDUCE) {
          trails.push({ x: sh.wx - G.cam, y: sh.y, t: 0.18, rgb: MAG });
          capArr(trails, 40);
        }
      } else if (sh.kind === 'laser') {
        sh.wx += sh.vx * dt;
        sh.y += (sh.vy || 0) * dt;
        if (!REDUCE) {
          trails.push({ x: sh.wx - G.cam, y: sh.y, t: 0.14, rgb: ICE });
          capArr(trails, 48);
        }
      } else {
        sh.wx += sh.vx * dt;
        sh.y += (sh.vy || 0) * dt;
      }
      const x = scrX(sh.wx);
      if (sh.life <= 0 || x < -60 || x > VW + 80 || sh.y < -20 || sh.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      if (!shotGhost(sh) && terrainHitWorld(sh.wx, sh.y)) {
        emit(3, {
          x: x, y: sh.y, j: 2,
          vx0: -40, vx1: 40, vy0: -40, vy1: 40,
          r0: 1, r1: 2, life: 0.16, rgb: ICE, g: 20
        });
        audio.rock();
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
      if (!sh.fat && G.wingN > 0 && G.deadT <= 0) {
        for (let c = 0; c < G.wingN; c++) {
          const cl = G.wings[c];
          if (hypot(sh.x - (G.cam + cl.x), sh.y - cl.y) < WING_R + sh.r) {
            blocked = true;
            cl.glow = 1;
            burst(cl.x, cl.y, 6, GOLD, 12);
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
    const gap = (half ? 0.42 : 0.7) * enemyFire();
    e.fireCd -= dt;
    if (e.fireCd > 0) return;
    e.fireCd = gap;
    const st = G.stage;
    if (st === 1) {
      const n = half ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = -0.7 + i * (1.4 / Math.max(1, n - 1));
        enemyShot(e.x - 20, e.y, Math.cos(Math.PI + a) * 180, Math.sin(Math.PI + a) * 180, 3.6, false);
      }
      if (half) {
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU + e.ph;
          enemyShot(e.x, e.y, Math.cos(a) * 120, Math.sin(a) * 120, 3.4, false);
        }
      }
    } else if (st === 2) {
      const aim = aimPlayer(e.x, e.y, 200);
      enemyShot(e.x - 16, e.y, aim.vx, aim.vy, 3.8, false);
      enemyShot(e.x - 16, e.y - 16, aim.vx, aim.vy - 40, 3.5, false);
      enemyShot(e.x - 16, e.y + 16, aim.vx, aim.vy + 40, 3.5, false);
      if (half) enemyShot(e.x - 10, e.y, aim.vx * 0.7, aim.vy * 0.7, 7.2, true);
    } else {
      e.open = coreOpen(e);
      const ring = half ? 12 : 8;
      for (let i = 0; i < ring; i++) {
        const a = i / ring * TAU + e.ph * 0.6;
        enemyShot(e.x, e.y, Math.cos(a) * 130, Math.sin(a) * 130, 3.5, false);
      }
      if (half) {
        const aim = aimPlayer(e.x, e.y, 220);
        enemyShot(e.x - 12, e.y, aim.vx, aim.vy, 7.4, true);
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
        const tx = G.cam + VW - 128;
        if (e.x > tx) e.x += e.vx * dt;
        else e.x = tx;
        if (G.stage === 1) e.y = VH * 0.5 + Math.sin(e.ph * 1.4) * 70;
        else if (G.stage === 2) e.y = lerp(e.y, clamp(G.py, 70, VH - 90), 0.04);
        else e.y = VH * 0.5 + Math.sin(e.ph * 0.9) * 48;
        e.y = clamp(e.y, 60, groundY(e.x) - 40);
        bossFire(e, dt);
      } else if (e.kind === 'ray') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 3.2 + e.ph) * 22 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && scrX(e.x) < VW - 40) {
          e.fireCd = (1.4 + rand(0, 0.6)) * enemyFire();
          const a = aimPlayer(e.x, e.y, 160);
          enemyShot(e.x - 8, e.y, a.vx, a.vy, 3.2, false);
        }
      } else if (e.kind === 'coil') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 2.4) * 50 * dt;
      } else if (e.kind === 'reef') {
        e.y = groundY(e.x) - 14;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && Math.abs(scrX(e.x) - G.px) < 420) {
          e.fireCd = (1.1 + rand(0, 0.3)) * enemyFire();
          const a = aimPlayer(e.x, e.y, 170);
          enemyShot(e.x, e.y - 8, a.vx, a.vy, 3.4, false);
        }
      } else if (e.kind === 'sub') {
        if (e.x > pwx - 10 && !e.passed) {
          e.vx = isCore() ? -248 : -218;
        } else {
          e.passed = true;
          e.vx = lerp(e.vx, isCore() ? 92 : 72, 0.1);
          e.fireCd -= dt;
          if (e.fireCd <= 0) {
            e.fireCd = 0.55 * enemyFire();
            const a = aimPlayer(e.x, e.y, 150);
            enemyShot(e.x + 6, e.y, a.vx, a.vy, 3.3, false);
          }
        }
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 2) * 10 * dt;
      } else if (e.kind === 'crystal') {
        e.x += e.vx * dt;
        e.y = groundY(e.x) - 16;
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = 1.2 * enemyFire();
          const a = aimPlayer(e.x, e.y, 150);
          enemyShot(e.x - 4, e.y - 10, a.vx, a.vy, 3.6, false);
        }
      } else if (e.kind === 'ferry') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 1.6) * 22 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = 1.3 * enemyFire();
          enemyShot(e.x - 10, e.y, -140, 0, 3.4, false);
        }
      } else if (e.kind === 'ace') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.ph * 1.8) * 28 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = 0.85 * enemyFire();
          const a = aimPlayer(e.x, e.y, 180);
          enemyShot(e.x - 8, e.y - 6, a.vx, a.vy - 24, 3.4, false);
          enemyShot(e.x - 8, e.y + 6, a.vx, a.vy + 24, 3.4, false);
        }
      }
      if (e.kind !== 'reef' && e.kind !== 'crystal' && e.kind !== 'boss') {
        e.y = clamp(e.y, 36, groundY(e.x) - 18);
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
  }

  function updatePlayer(dt) {
    const spd = isCore() ? 316 : 274;
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
      if (G.py > gy - 12) G.py = gy - 12;
      if (cy > 0 && G.py < cy + 10) G.py = cy + 10;
      if (terrainHit(G.px, G.py)) {
        if (G.stage === 1) G.py = Math.min(G.py, groundY(G.cam + G.px) - coralHAt(G.cam + G.px) - 12);
        else G.py = Math.max(G.py, (G.stage === 2 ? iceHAt(G.cam + G.px) : gateHAt(G.cam + G.px)) + ceilY(G.cam + G.px) + 12);
      }
    } else {
      if (G.py > gy - 8) playerHit('撞地');
      else if (cy > 0 && G.py < cy + 8) playerHit(G.stage === 2 ? '擦顶' : '擦顶');
      else if (terrainHit(G.px, G.py)) playerHit(terrainWhy());
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
      updateWings(dt);
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

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateWings(dt);
      updateShots(dt);
      updateEnts(dt);
      updateEShots(dt);
      updateDrops(dt);
      if (G.deadT <= 0) finishDeath();
      return;
    }

    let cruise = isCore() ? 160 : 108;
    if (G.boss) cruise = isCore() ? 40 : 20;
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
    updateWings(dt);
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

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const x = ((s.x - G.cam * s.z * 0.18) % VW + VW) % VW;
      const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(G.t * 2 + s.tw));
      c.fillStyle = rgba(WHT, a);
      c.fillRect(sx(x), sy(s.y), s.s * scale, s.s * scale);
    }
  }

  function drawGround() {
    const c = ctx;
    const theme = stageDef().theme;
    const s = scale;

    if (theme === 'ice' || theme === 'gate') {
      c.beginPath();
      c.moveTo(sx(0), sy(0));
      for (let x = 0; x <= VW; x += 8) {
        c.lineTo(sx(x), sy(ceilY(G.cam + x)));
      }
      c.lineTo(sx(VW), sy(0));
      c.closePath();
      c.fillStyle = theme === 'ice' ? 'rgba(184,232,255,0.12)' : 'rgba(30,200,255,0.1)';
      c.fill();
    }

    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += 8) {
      c.lineTo(sx(x), sy(groundY(G.cam + x)));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    if (theme === 'ice') c.fillStyle = '#0a1824';
    else if (theme === 'gate') c.fillStyle = '#061018';
    else c.fillStyle = '#041824';
    c.fill();

    c.beginPath();
    c.moveTo(sx(0), sy(groundY(G.cam)));
    for (let x = 0; x <= VW; x += 8) {
      c.lineTo(sx(x), sy(groundY(G.cam + x)));
    }
    c.strokeStyle = theme === 'ice'
      ? rgba(ICE, 0.55)
      : theme === 'gate' ? rgba(CYN, 0.4) : rgba(SEA, 0.7);
    c.lineWidth = Math.max(1, 1.8 * s);
    c.stroke();

    if (theme === 'sea') {
      for (let k = 0; k < 18; k++) {
        const cell = Math.floor(G.cam / 48) + k;
        const wx = cell * 48 + hash2(cell) * 16;
        const x = scrX(wx);
        if (x < -16 || x > VW + 16) continue;
        const g = groundY(wx);
        const pulse = 0.22 + 0.18 * Math.sin(G.t * 3.2 + cell);
        c.fillStyle = rgba(TEAL, pulse);
        c.beginPath();
        c.ellipse(sx(x), sy(g - 2), (8 + hash2(cell + 2) * 6) * s, 3 * s, 0, 0, TAU);
        c.fill();
      }
      const cell0 = coralCell(G.cam) - 1;
      for (let k = 0; k < 7; k++) {
        const cell = cell0 + k;
        const wx = coralCx(cell);
        const h = coralHAt(wx);
        if (h <= 0) continue;
        const x = scrX(wx);
        const g = groundY(wx);
        c.fillStyle = rgba(SEA, 0.55);
        c.beginPath();
        c.moveTo(sx(x - 11), sy(g));
        c.lineTo(sx(x - 6), sy(g - h));
        c.lineTo(sx(x + 6), sy(g - h * 0.92));
        c.lineTo(sx(x + 11), sy(g));
        c.closePath();
        c.fill();
        c.strokeStyle = rgba(TEAL, 0.65);
        c.lineWidth = Math.max(1, 1.3 * s);
        c.stroke();
        c.fillStyle = rgba(GOLD, 0.55);
        c.beginPath();
        c.arc(sx(x), sy(g - h + 4), 3.2 * s, 0, TAU);
        c.fill();
      }
    } else if (theme === 'ice') {
      const cell0 = iceCell(G.cam) - 1;
      for (let k = 0; k < 7; k++) {
        const cell = cell0 + k;
        const wx = iceCx(cell);
        const h = iceHAt(wx);
        if (h <= 0) continue;
        const x = scrX(wx);
        const top = ceilY(wx);
        c.fillStyle = rgba(ICE, 0.28);
        c.beginPath();
        c.moveTo(sx(x - 10), sy(top));
        c.lineTo(sx(x), sy(top + h));
        c.lineTo(sx(x + 10), sy(top));
        c.closePath();
        c.fill();
        c.strokeStyle = rgba(WHT, 0.55);
        c.lineWidth = Math.max(1, 1.2 * s);
        c.stroke();
      }
      for (let k = 0; k < 10; k++) {
        const cell = Math.floor(G.cam / 72) + k;
        const wx = cell * 72 + 18;
        const x = scrX(wx);
        const g = groundY(wx);
        const glow = 0.2 + 0.18 * Math.sin(G.t * 5 + cell);
        c.fillStyle = rgba(ICE, glow);
        c.beginPath();
        c.ellipse(sx(x), sy(g - 2), 9 * s, 3.5 * s, 0, 0, TAU);
        c.fill();
      }
    } else if (theme === 'gate' && !G.boss) {
      const cell0 = gateCell(G.cam) - 1;
      for (let k = 0; k < 6; k++) {
        const cell = cell0 + k;
        const wx = gateCx(cell);
        const h = gateHAt(wx);
        if (h <= 0) continue;
        const x = scrX(wx);
        const top = ceilY(wx);
        c.fillStyle = rgba(CYN, 0.18);
        c.fillRect(sx(x - 11), sy(top), 22 * s, h * s);
        c.strokeStyle = rgba(HOT, 0.6);
        c.lineWidth = Math.max(1, 1.4 * s);
        c.strokeRect(sx(x - 11), sy(top), 22 * s, h * s);
        c.fillStyle = rgba(GOLD, 0.75);
        c.fillRect(sx(x - 11), sy(top + h - 4), 22 * s, 4 * s);
      }
    }
  }

  function drawWing(c, x, y, a, glow) {
    const s = scale;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(c.ang);
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(glow > 0.2 ? WHT : TEAL, 0.95);
    ctx.beginPath();
    ctx.moveTo(8 * s, 0);
    ctx.lineTo(-2 * s, 5 * s);
    ctx.lineTo(-6 * s, 0);
    ctx.lineTo(-2 * s, -5 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(DEEP, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, 1.5 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShip(px, py, a) {
    const c = ctx;
    const s = scale;
    c.save();
    c.globalAlpha = a;
    c.translate(sx(px), sy(py));
    c.rotate(G.bank * 0.18);
    if (G.muzzle > 0) {
      c.fillStyle = rgba(wepRgb(), G.muzzle * 9);
      c.beginPath();
      c.ellipse(20 * s, 0, (G.wep === 4 ? 16 : 10) * s, (G.wep === 4 ? 2.2 : 3) * s, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(20 * s, 0);
    c.lineTo(-6 * s, -7 * s);
    c.lineTo(-14 * s, -3 * s);
    c.lineTo(-16 * s, 0);
    c.lineTo(-14 * s, 3 * s);
    c.lineTo(-6 * s, 7 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.fillRect(-2 * s, -3.2 * s, 14 * s, 6.4 * s);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(2 * s, -1.7 * s, 8 * s, 3.4 * s);
    c.fillStyle = rgba(TEAL, 0.92);
    c.beginPath();
    c.moveTo(-8 * s, -4 * s);
    c.lineTo(4 * s, -1.2 * s);
    c.lineTo(-8 * s, -1.2 * s);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-8 * s, 4 * s);
    c.lineTo(4 * s, 1.2 * s);
    c.lineTo(-8 * s, 1.2 * s);
    c.closePath();
    c.fill();
    const pulse = 0.5 + 0.5 * Math.sin(G.t * 18);
    c.fillStyle = rgba(CYN, 0.45 + pulse * 0.4);
    c.beginPath();
    c.ellipse(-16 * s, 0, (6 + pulse * 2) * s, 1.7 * s, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawRay(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : CYN, 0.95);
    c.beginPath();
    c.moveTo(sx(x + 14), sy(e.y));
    c.lineTo(sx(x - 4), sy(e.y - 8));
    c.lineTo(sx(x - 10), sy(e.y));
    c.lineTo(sx(x - 4), sy(e.y + 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(TEAL, 0.7);
    c.beginPath();
    c.moveTo(sx(x - 2), sy(e.y - 8));
    c.lineTo(sx(x + 4), sy(e.y - 14));
    c.lineTo(sx(x + 2), sy(e.y - 4));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(x - 2), sy(e.y + 8));
    c.lineTo(sx(x + 4), sy(e.y + 14));
    c.lineTo(sx(x + 2), sy(e.y + 4));
    c.closePath();
    c.fill();
  }

  function drawCoil(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.ph * 1.6);
    c.strokeStyle = rgba(e.flash > 0 ? WHT : TEAL, 0.95);
    c.lineWidth = Math.max(1, 2.2 * s);
    c.beginPath();
    c.arc(0, 0, 10 * s, 0, TAU * 0.82);
    c.stroke();
    c.fillStyle = rgba(GOLD, 0.85);
    c.beginPath();
    c.arc(0, 0, 4 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawReef(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : SEA, 0.92);
    c.beginPath();
    c.moveTo(sx(x - 11), sy(e.y + 8));
    c.lineTo(sx(x - 7), sy(e.y - 8));
    c.lineTo(sx(x + 7), sy(e.y - 6));
    c.lineTo(sx(x + 11), sy(e.y + 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.85);
    c.fillRect(sx(x - 2), sy(e.y - 12), 12 * s, 5 * s);
  }

  function drawSub(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : LAVA, 0.95);
    c.beginPath();
    c.moveTo(sx(x - 14), sy(e.y));
    c.lineTo(sx(x + 10), sy(e.y - 5));
    c.lineTo(sx(x + 4), sy(e.y));
    c.lineTo(sx(x + 10), sy(e.y + 5));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(ICE, 0.7);
    c.fillRect(sx(x - 4), sy(e.y - 2), 6 * s, 4 * s);
  }

  function drawCrystal(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : ICE, 0.92);
    c.beginPath();
    c.moveTo(sx(x), sy(e.y - 14));
    c.lineTo(sx(x + 12), sy(e.y - 2));
    c.lineTo(sx(x + 6), sy(e.y + 12));
    c.lineTo(sx(x - 6), sy(e.y + 12));
    c.lineTo(sx(x - 12), sy(e.y - 2));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.7);
    c.fillRect(sx(x - 3), sy(e.y - 4), 8 * s, 6 * s);
  }

  function drawFerry(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : TEAL, 0.95);
    c.beginPath();
    c.moveTo(sx(x - 16), sy(e.y - 8));
    c.lineTo(sx(x + 16), sy(e.y - 6));
    c.lineTo(sx(x + 18), sy(e.y + 6));
    c.lineTo(sx(x - 16), sy(e.y + 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.9);
    c.beginPath();
    c.moveTo(sx(x + 2), sy(e.y));
    c.lineTo(sx(x - 4), sy(e.y - 5));
    c.lineTo(sx(x - 4), sy(e.y + 5));
    c.closePath();
    c.fill();
  }

  function drawAce(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.95);
    c.beginPath();
    c.moveTo(sx(x + 14), sy(e.y));
    c.lineTo(sx(x - 6), sy(e.y - 10));
    c.lineTo(sx(x - 12), sy(e.y));
    c.lineTo(sx(x - 6), sy(e.y + 10));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.85);
    c.fillRect(sx(x - 2), sy(e.y - 3), 8 * s, 6 * s);
  }

  function drawCap(d, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(d.y));
    c.rotate(d.t * 3);
    c.fillStyle = rgba(TEAL, 0.92);
    c.beginPath();
    c.moveTo(9 * s, 0);
    c.lineTo(-2 * s, 5.5 * s);
    c.lineTo(-7 * s, 0);
    c.lineTo(-2 * s, -5.5 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.font = '700 ' + (9 * s) + 'px "Segoe UI","PingFang SC",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.rotate(-d.t * 3);
    c.fillText('翼', 0, 0.5 * s);
    c.restore();
  }

  function drawBoss(e, x) {
    const c = ctx;
    const s = scale;
    const r = G.stage === 3 ? 34 : 26;
    const rgb = e.flash > 0 ? WHT : (G.stage === 2 ? ICE : G.stage === 3 ? GOLD : TEAL);
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.ph * 0.35);
    c.strokeStyle = rgba(rgb, 0.9);
    c.lineWidth = Math.max(1, 2.2 * s);
    c.beginPath();
    const petals = G.stage === 3 ? 6 : G.stage === 1 ? 5 : 8;
    const open = G.stage === 3 ? coreOpen(e) : 1;
    for (let i = 0; i < petals; i++) {
      const a = i / petals * TAU;
      const rr = r * (0.72 + open * 0.28);
      const px = Math.cos(a) * rr * s;
      const py = Math.sin(a) * rr * s;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
    c.fillStyle = rgba(G.stage === 2 ? ICE : CYN, 0.22);
    c.fill();
    c.rotate(-e.ph * 0.35);
    const coreR = r * 0.28 * (0.7 + open);
    c.fillStyle = rgba(open >= 0.55 ? GOLD : CYN, 0.95);
    c.beginPath();
    c.arc(0, 0, coreR * s, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(WHT, 0.5 + open * 0.4);
    c.lineWidth = Math.max(1, 1.2 * s);
    c.beginPath();
    c.arc(0, 0, coreR * 1.35 * s, 0, TAU * open);
    c.stroke();
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.x);
      if (x < -40 || x > VW + 50) continue;
      if (e.kind === 'ray') drawRay(e, x);
      else if (e.kind === 'coil') drawCoil(e, x);
      else if (e.kind === 'reef') drawReef(e, x);
      else if (e.kind === 'sub') drawSub(e, x);
      else if (e.kind === 'crystal') drawCrystal(e, x);
      else if (e.kind === 'ferry') drawFerry(e, x);
      else if (e.kind === 'ace') drawAce(e, x);
      else if (e.kind === 'boss') drawBoss(e, x);
    }
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      const x = scrX(d.x);
      if (x > -20 && x < VW + 20) drawCap(d, x);
    }
  }

  function drawShots() {
    const c = ctx;
    const s = scale;
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      c.fillStyle = rgba(t.rgb, t.t / 0.18 * 0.55);
      c.beginPath();
      c.arc(sx(t.x), sy(t.y), 2.4 * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < G.shots.length; i++) {
      const sh = G.shots[i];
      const x = scrX(sh.wx);
      if (sh.kind === 'wave') {
        c.strokeStyle = rgba(GOLD, 0.92);
        c.lineWidth = Math.max(1, 3.4 * s);
        c.beginPath();
        c.moveTo(sx(x - 12), sy(sh.y - 12));
        c.quadraticCurveTo(sx(x), sy(sh.y), sx(x + 18), sy(sh.y + 10));
        c.stroke();
        c.strokeStyle = rgba(TEAL, 0.72);
        c.lineWidth = Math.max(1, 1.7 * s);
        c.beginPath();
        c.moveTo(sx(x - 12), sy(sh.y + 12));
        c.quadraticCurveTo(sx(x), sy(sh.y), sx(x + 18), sy(sh.y - 10));
        c.stroke();
      } else if (sh.kind === 'hunt') {
        c.save();
        c.translate(sx(x), sy(sh.y));
        c.rotate(sh.ang);
        c.fillStyle = rgba(MAG, 0.95);
        c.beginPath();
        c.moveTo(7 * s, 0);
        c.lineTo(-5 * s, -3 * s);
        c.lineTo(-5 * s, 3 * s);
        c.closePath();
        c.fill();
        c.fillStyle = rgba(GOLD, 0.9);
        c.fillRect(-2 * s, -1.2 * s, 4 * s, 2.4 * s);
        c.restore();
      } else if (sh.kind === 'laser') {
        c.strokeStyle = rgba(ICE, 0.95);
        c.lineWidth = Math.max(1, 3.4 * s);
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(sx(x - 18), sy(sh.y));
        c.lineTo(sx(x + 22), sy(sh.y));
        c.stroke();
        c.strokeStyle = rgba(WHT, 0.9);
        c.lineWidth = Math.max(1, 1.4 * s);
        c.beginPath();
        c.moveTo(sx(x - 12), sy(sh.y));
        c.lineTo(sx(x + 20), sy(sh.y));
        c.stroke();
      } else if (sh.kind === 'back' && sh.vx < 0) {
        c.fillStyle = rgba(TEAL, 0.95);
        c.fillRect(sx(x - 7), sy(sh.y - 1.3), 12 * s, 2.6 * s);
        c.fillStyle = rgba(WHT, 0.9);
        c.fillRect(sx(x - 5), sy(sh.y - 0.7), 6 * s, 1.4 * s);
      } else {
        c.fillStyle = rgba(CYN, 0.95);
        c.fillRect(sx(x - 6), sy(sh.y - 1.2), 12 * s, 2.4 * s);
        c.fillStyle = rgba(WHT, 0.9);
        c.fillRect(sx(x - 2), sy(sh.y - 0.7), 8 * s, 1.4 * s);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const sh = G.eShots[i];
      const x = scrX(sh.x);
      c.fillStyle = rgba(sh.fat ? LAVA : MAG, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(sh.y), sh.r * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.55);
      c.beginPath();
      c.arc(sx(x), sy(sh.y), sh.r * 0.4 * s, 0, TAU);
      c.fill();
    }
  }

  function drawBossBar() {
    const e = findBoss();
    if (!e) return;
    const c = ctx;
    const w = 220;
    const h = 7;
    const x = (VW - w) * 0.5;
    const y = 14;
    const t = clamp(e.hp / e.max, 0, 1);
    c.fillStyle = rgba(WHT, 0.12);
    c.fillRect(sx(x), sy(y), w * scale, h * scale);
    c.fillStyle = rgba(t < 0.5 ? MAG : GOLD, 0.9);
    c.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    c.strokeStyle = rgba(WHT, 0.35);
    c.lineWidth = Math.max(1, scale);
    c.strokeRect(sx(x), sy(y), w * scale, h * scale);
  }

  function drawFx() {
    const c = ctx;
    const s = scale;
    for (let i = 0; i < wisps.length; i++) {
      const w = wisps[i];
      const a = 1 - w.t / w.life;
      c.fillStyle = rgba(w.rgb, 0.35 * a);
      c.beginPath();
      c.ellipse(sx(w.x), sy(w.y), 7 * s * a, 2 * s, 0, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const a = 1 - sp.t / 0.28;
      c.strokeStyle = rgba(sp.rgb, a);
      c.lineWidth = Math.max(1, 1.4 * s);
      c.beginPath();
      const r = sp.rad * (0.4 + sp.t * 4);
      for (let k = 0; k < 6; k++) {
        const ang = k / 6 * TAU;
        c.moveTo(sx(sp.x), sy(sp.y));
        c.lineTo(sx(sp.x + Math.cos(ang) * r), sy(sp.y + Math.sin(ang) * r));
      }
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const a = 1 - rg.t / 0.42;
      c.strokeStyle = rgba(rg.rgb, a * 0.7);
      c.lineWidth = Math.max(1, 1.6 * s);
      c.beginPath();
      c.arc(sx(rg.x), sy(rg.y), (rg.r + rg.t * 70) * s, 0, TAU);
      c.stroke();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawSky() {
    const c = ctx;
    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#081420');
      g.addColorStop(0.5, '#061018');
      g.addColorStop(1, '#0a1c28');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#061018');
      g.addColorStop(0.55, '#041018');
      g.addColorStop(1, '#08141c');
    } else {
      g.addColorStop(0, '#031820');
      g.addColorStop(0.55, '#03141c');
      g.addColorStop(1, '#042028');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const a = G.invuln > 0 ? (Math.sin(G.t * 28) > 0 ? 0.35 : 0.9) : 1;
    if (G.wingN > 0) {
      for (let i = 0; i < G.wingN; i++) {
        const cl = G.wings[i];
        drawWing(cl, cl.x, cl.y, a, cl.glow);
      }
    }
    drawShip(G.px, G.py, a);
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#03141c';
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
    G.wingN = 2;
    G.wep = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.swapCd = 0;
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
    pointer.x = G.px;
    pointer.y = G.py;
    uid = 1;
    resetWings();
  }

  function startGame(kind) {
    resetRun(kind || 'force');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isCore() ? '雷核' : '雷三', false, true);
    maybeSpawn();
    hud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('force');
    G.mode = 'title';
    showOverlay('title', '雷三', LEAD);
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
    const shoot = space || k === 'z' || k === 'Z';
    const swapKey = k === 'x' || k === 'X';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || shoot || swapKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (shoot) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || swapKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (swapKey) {
      audio.ensure();
      swapWep();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'core' : 'force');
      return;
    }
    if (shoot || k === 'Enter') {
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
        swapWep();
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

  seedStars();
  resetWings();
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
      swapWep();
    });
  }
  bindSwap(btnWep);
  bindSwap(btnPadWep);

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
