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
  const HIT_R = 5.8;
  const BIT_R = 11;
  const POW_MAX = 2;
  const BEST_KEY = 'playbox-plus-alpha-best';
  const MUTE_KEY = 'playbox-plus-alpha-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 甲核 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const AZU = [58, 138, 232];
  const CYN = [78, 200, 255];
  const TEAL = [46, 240, 200];
  const GOLD = [255, 227, 107];
  const MAG = [255, 74, 168];
  const WHT = [232, 244, 255];
  const PNK = [255, 154, 200];
  const DEEP = [8, 24, 40];
  const ORG = [255, 176, 80];
  const LEAF = [90, 210, 140];
  const STEEL = [130, 168, 196];
  const CORE = [255, 90, 110];

  const SCORE = {
    dart: 50,
    beetle: 80,
    turret: 90,
    spore: 70,
    walker: 140,
    carrier: 180,
    guard: 200,
    boss: [2500, 4200, 7000],
    clear: 1600,
    all: 4000,
    rail: 5000,
    pmax: 400
  };

  const STAGES = [
    {
      name: '林廊',
      boss: '甲虫核',
      theme: 'forest',
      bossHp: 74,
      waves: [
        { t: 0.6, kind: 'v', n: 5 },
        { t: 2.2, kind: 'carrier' },
        { t: 3.6, kind: 'beetle', n: 3 },
        { t: 5.4, kind: 'turret', n: 2 },
        { t: 7.6, kind: 'v', n: 6 },
        { t: 10.0, kind: 'carrier' },
        { t: 12.4, kind: 'beetle', n: 4 },
        { t: 15.0, kind: 'mix' },
        { t: 18.2, kind: 'v', n: 7 },
        { t: 21.0, kind: 'turret', n: 2 },
        { t: 23.8, kind: 'boss' }
      ]
    },
    {
      name: '钢岛',
      boss: '轨卫',
      theme: 'steel',
      bossHp: 98,
      waves: [
        { t: 0.5, kind: 'v', n: 6 },
        { t: 2.0, kind: 'carrier' },
        { t: 3.2, kind: 'walker', n: 2 },
        { t: 5.0, kind: 'turret', n: 3 },
        { t: 7.4, kind: 'guard' },
        { t: 10.0, kind: 'carrier' },
        { t: 12.4, kind: 'v', n: 8 },
        { t: 15.0, kind: 'walker', n: 3 },
        { t: 17.6, kind: 'mix' },
        { t: 20.4, kind: 'guard' },
        { t: 23.6, kind: 'boss' }
      ]
    },
    {
      name: '母核',
      boss: '核芯',
      theme: 'core',
      bossHp: 132,
      waves: [
        { t: 0.4, kind: 'v', n: 7 },
        { t: 1.8, kind: 'carrier' },
        { t: 3.0, kind: 'spore', n: 4 },
        { t: 4.8, kind: 'guard' },
        { t: 7.2, kind: 'walker', n: 2 },
        { t: 9.6, kind: 'carrier' },
        { t: 12.0, kind: 'spore', n: 5 },
        { t: 14.6, kind: 'mix' },
        { t: 17.2, kind: 'v', n: 8 },
        { t: 19.8, kind: 'guard' },
        { t: 22.4, kind: 'spore', n: 4 },
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
  const btnPals = document.getElementById('btn-pals');
  const btnRail = document.getElementById('btn-rail');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnPod = document.getElementById('btn-pod');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const podLabel = document.getElementById('pod-label');
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
  let podTok = 0;
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
  const decos = [];

  function makeBit(side) {
    return {
      side: side,
      sx: 96,
      sy: VH * 0.5 + side * 22,
      vx: 0,
      vy: 0,
      aim: 0,
      fireCd: rand(0, 0.12),
      glow: 0,
      lock: 0,
      ramT: 0,
      spin: 0
    };
  }

  const G = {
    mode: 'title',
    kind: 'pals',
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
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    drops: [],
    bits: [makeBit(-1), makeBit(1)],
    have: false,
    pow: 0,
    bitState: 'dock',
    fireHold: false,
    fireCd: 0,
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
    waveI: 0,
    podCd: 0,
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
  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t) | 0,
      (a[1] + (b[1] - a[1]) * t) | 0,
      (a[2] + (b[2] - a[2]) * t) | 0
    ];
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function isRail() {
    return G.kind === 'rail';
  }
  function stageDef() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function moveSpd() {
    return isRail() ? 320 : 278;
  }
  function scrollSpd() {
    if (G.boss) {
      const b = findBoss();
      if (b && b.alive) {
        const x = b.x - G.cam;
        if (x < VW - 210) return isRail() ? 10 : 6;
        if (x < VW - 130) return isRail() ? 36 : 22;
      }
      return isRail() ? 48 : 32;
    }
    return isRail() ? 164 : 110;
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function playing() {
    return G.mode === 'play';
  }
  function nextId() {
    uid += 1;
    return uid;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }
  function bitRgb() {
    return G.pow >= 2 ? TEAL : CYN;
  }
  function bitCd() {
    const base = G.pow >= 2 ? 0.10 : 0.15;
    return G.bitState === 'hunt' ? base * 0.78 : base;
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
    shoot() {
      this.ensure();
      this.beep(880, 0.042, 'square', 0.026, 1760);
    },
    bitShot() {
      this.ensure();
      this.beep(G.pow >= 2 ? 1320 : 1080, 0.05, 'sawtooth', 0.026, 420);
    },
    launch() {
      this.ensure();
      this.beep(240, 0.12, 'sawtooth', 0.048, 820);
      this.beep(920, 0.14, 'triangle', 0.032, 240);
      this.noise(0.08, 0.034, 640);
    },
    recall() {
      this.ensure();
      this.beep(990, 0.08, 'sine', 0.034, 330);
    },
    dock() {
      this.ensure();
      this.beep(720, 0.06, 'square', 0.04, 240);
      this.beep(360, 0.1, 'triangle', 0.034, 160);
    },
    pick() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.044, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1175);
    },
    lock() {
      this.ensure();
      this.beep(1480, 0.05, 'sine', 0.022, 880);
    },
    ram() {
      this.ensure();
      this.noise(0.05, 0.038, 420);
      this.beep(210, 0.07, 'sawtooth', 0.036, 90);
    },
    eat() {
      this.ensure();
      this.beep(1640, 0.04, 'triangle', 0.022, 420);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 200 : kind === 'guard' ? 320 : 480;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.034, 1100);
      this.beep(base * lift, 0.075, 'square', 0.044, base * lift * 1.5);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.065, 280);
      this.beep(280, 0.22, 'sawtooth', 0.052, 64);
      this.beep(140, 0.34, 'sine', 0.045, 40);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.16, 'square', 0.04, 110);
      this.beep(330, 0.22, 'sawtooth', 0.035, 80);
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
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    while (G.score >= G.nextLife) {
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

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < G.lives) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > Math.max(G.lives, LIVES)) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (warn ? ' warn' : gold ? ' gold' : '');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.05;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function popPodBadge() {
    if (!podLabel) return;
    podLabel.classList.remove('pop');
    void podLabel.offsetWidth;
    podLabel.classList.add('pop');
    podTok += 1;
    const tok = podTok;
    setTimeout(function () {
      if (tok === podTok) podLabel.classList.remove('pop');
    }, 280);
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageDef();
      stageLabel.textContent = G.boss ? info.boss : info.name;
      stageLabel.classList.toggle('hot', G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isRail() ? '核轨' : '加甲';
      tagLabel.className = isRail() ? 'warn' : '';
    }
    if (podLabel) {
      if (!G.have) {
        podLabel.textContent = '无甲';
        podLabel.className = 'pod-badge off';
      } else {
        const hunting = G.bitState === 'hunt' || G.bitState === 'back';
        const name = G.pow >= 2 ? '双甲' : '加甲';
        const st = hunting ? '猎杀' : '装核';
        podLabel.textContent = name + ' · ' + st;
        podLabel.className = 'pod-badge' + (hunting ? ' hunt' : G.pow >= 2 ? ' max' : ' dock');
      }
    }
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
    if (G.mode === 'title') setHint('接住甲核 · 双甲自动锁敌 · Shift 打出去猎杀', '');
    else if (G.mode === 'lose') setHint('R 重开 · 把甲核打到弹路上挡射', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 核芯已碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 双甲挡弹，出击猎核', 'warn');
    else if (!G.have) setHint('甲核丢了 · 飞过去接住', 'warn');
    else if (G.bitState === 'hunt') setHint('甲核在猎 · 再按 Shift 收回', '');
    else if (G.bitState === 'back') setHint('甲核收回中', '');
    else setHint('空格连射 · 双甲自动锁敌 · Shift 出击', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'PALS';
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
    const cls = mag >= 6 ? 'die' : mag >= 3.4 ? 'morph' : mag >= 2.2 ? 'charge' : 'hit';
    stageEl.classList.remove('die', 'hit', 'morph', 'charge');
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
    capArr(particles, 300);
  }

  function burst(x, y, n, rgb, mag) {
    emit(n, {
      x: x, y: y, j: mag * 0.25,
      vx0: -mag * 2.2, vx1: mag * 2.2,
      vy0: -mag * 2.2, vy1: mag * 2.2,
      r0: 1.4, r1: 3.8, life: 0.42, rgb: rgb
    });
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: mag * 0.7 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: mag * 0.55 });
    capArr(sparks, 36);
    capArr(rings, 28);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0, life: 0.72 });
    capArr(floats, 18);
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.drops.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    G.waveI = 0;
    G.boss = false;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        z: 0.25 + Math.random() * 0.9,
        s: 0.6 + Math.random() * 1.8,
        tw: Math.random() * TAU
      });
    }
  }

  function seedDecos() {
    decos.length = 0;
    for (let i = 0; i < 16; i++) {
      decos.push({
        x: i * 132 + rand(0, 70),
        y: hash2(i * 17 + 3) > 0.5 ? rand(16, 88) : rand(VH - 88, VH - 16),
        w: 26 + hash2(i * 9) * 74,
        h: 14 + hash2(i * 5 + 2) * 40,
        kind: i % 3,
        top: hash2(i * 17 + 3) > 0.5
      });
    }
  }

  function resetBits(docked) {
    for (let i = 0; i < G.bits.length; i++) {
      const b = G.bits[i];
      b.sx = G.px + 8;
      b.sy = G.py + b.side * 22;
      b.vx = 0;
      b.vy = 0;
      b.aim = 0;
      b.lock = 0;
      b.glow = docked ? 1 : 0;
      b.ramT = 0;
      b.fireCd = rand(0, 0.1);
    }
    G.bitState = 'dock';
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
      vx: isRail() ? -72 : -56, vy: 0, ph: ph || 0
    });
  }
  function spawnBeetle(x, y) {
    pushEnt({
      kind: 'beetle', x: x, y: y, hp: 3, r: 13, score: SCORE.beetle,
      vx: isRail() ? -44 : -34, vy: 0
    });
  }
  function spawnTurret(x, y) {
    pushEnt({
      kind: 'turret', x: x, y: y, hp: 4, r: 14, score: SCORE.turret,
      vx: 0, vy: 0
    });
  }
  function spawnSpore(x, y) {
    pushEnt({
      kind: 'spore', x: x, y: y, hp: 2, r: 12, score: SCORE.spore,
      vx: isRail() ? -38 : -28, vy: 0, spin: 0
    });
  }
  function spawnWalker(x, y) {
    pushEnt({
      kind: 'walker', x: x, y: y, hp: 6, r: 16, score: SCORE.walker,
      vx: isRail() ? -36 : -26, vy: 0
    });
  }
  function spawnCarrier(x, y) {
    pushEnt({
      kind: 'carrier', x: x, y: y, hp: 8, r: 18, score: SCORE.carrier,
      vx: isRail() ? -30 : -22, vy: 0, drop: true
    });
  }
  function spawnGuard(x, y) {
    pushEnt({
      kind: 'guard', x: x, y: y, hp: 10, r: 16, score: SCORE.guard,
      vx: isRail() ? -32 : -24, vy: 0, drop: true
    });
  }
  function spawnBoss() {
    const st = stageDef();
    const hp = Math.round(st.bossHp * (isRail() ? 1.26 : 1));
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
      pat: 0,
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
    const extra = isRail() && w.kind !== 'boss' && w.kind !== 'carrier' && w.kind !== 'guard' ? 2 : 0;
    const n = (w.n || 1) + extra;
    if (w.kind === 'v') {
      for (let i = 0; i < n; i++) {
        const k = i - (n - 1) * 0.5;
        spawnDart(baseX + Math.abs(k) * 18, VH * 0.5 + k * 36, i * 0.2);
      }
    } else if (w.kind === 'beetle') {
      for (let i = 0; i < n; i++) spawnBeetle(baseX + i * 30, 90 + i * ((VH - 180) / Math.max(1, n - 1)));
    } else if (w.kind === 'turret') {
      for (let i = 0; i < n; i++) {
        const top = i % 2 === 0;
        spawnTurret(baseX + i * 50, top ? 48 : VH - 48);
      }
    } else if (w.kind === 'spore') {
      for (let i = 0; i < n; i++) spawnSpore(baseX + i * 26, 80 + (i * 67) % (VH - 160));
    } else if (w.kind === 'walker') {
      for (let i = 0; i < n; i++) spawnWalker(baseX + i * 40, 110 + (i % 3) * 110);
    } else if (w.kind === 'carrier') {
      spawnCarrier(baseX + 20, VH * 0.5 + rand(-40, 40));
    } else if (w.kind === 'guard') {
      spawnGuard(baseX + 16, VH * 0.42 + rand(-30, 30));
      if (isRail()) spawnGuard(baseX + 50, VH * 0.62);
    } else if (w.kind === 'mix') {
      spawnCarrier(baseX, VH * 0.46);
      spawnBeetle(baseX + 40, 80);
      spawnWalker(baseX + 40, VH - 80);
      spawnDart(baseX + 70, VH * 0.5, 0);
      if (isRail()) spawnSpore(baseX + 90, VH * 0.3);
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

  function dropPod(x, y) {
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
    const was = G.have;
    G.have = true;
    if (!was) {
      G.pow = 1;
      G.bitState = 'dock';
      resetBits(true);
      toast('加甲装上', false, true);
      floatText(d.x - G.cam, d.y - 10, '加甲', CYN);
    } else if (G.pow < POW_MAX) {
      G.pow = POW_MAX;
      toast('双甲', false, true);
      floatText(d.x - G.cam, d.y - 10, '双甲', TEAL);
    } else {
      const n = SCORE.pmax * G.mult;
      addScore(n);
      toast('MAX', false, true);
      floatText(d.x - G.cam, d.y - 10, '+' + n, GOLD);
    }
    for (let i = 0; i < G.bits.length; i++) G.bits[i].glow = 1;
    burst(d.x - G.cam, d.y, 12, bitRgb(), 20);
    audio.pick();
    hitStop(0.05);
    kick(2.2);
    screenFlash(bitRgb(), 0.22);
    popPodBadge();
    hud();
  }

  function toggleBits() {
    if (!playing() || G.deadT > 0 || G.podCd > 0) return;
    if (!G.have) {
      toast('没有甲核', true, false);
      return;
    }
    G.podCd = 0.18;
    if (G.bitState === 'dock') {
      G.bitState = 'hunt';
      for (let i = 0; i < G.bits.length; i++) {
        const b = G.bits[i];
        b.vx = 380;
        b.vy = b.side * 70;
        b.glow = 1;
      }
      audio.launch();
      emit(10, {
        x: G.px + 12, y: G.py, j: 8,
        vx0: 40, vx1: 160, vy0: -50, vy1: 50,
        r0: 1.2, r1: 2.8, life: 0.3, rgb: bitRgb()
      });
      kick(1.9);
      popPodBadge();
    } else {
      G.bitState = 'back';
      audio.recall();
      popPodBadge();
    }
    hud();
  }

  function fireMain() {
    if (G.fireCd > 0 || G.deadT > 0) return;
    G.fireCd = isRail() ? 0.086 : 0.10;
    G.muzzle = 1;
    const wx = G.cam + G.px + 16;
    G.shots.push({
      x: wx, y: G.py - 3.2, vx: 640, vy: 0, dmg: 1, kind: 'main',
      r: 3.1, life: 1.1, rgb: WHT, pierce: 0
    });
    G.shots.push({
      x: wx, y: G.py + 3.2, vx: 640, vy: 0, dmg: 1, kind: 'main',
      r: 3.1, life: 1.1, rgb: WHT, pierce: 0
    });
    audio.shoot();
  }

  function nearestEnemy(wx, wy, range) {
    let best = null;
    let bestD = range;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const d = hypot(e.x - wx, e.y - wy);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function fireBit(b) {
    if (!G.have || b.fireCd > 0 || G.deadT > 0) return;
    b.fireCd = bitCd();
    const wx = G.cam + b.sx;
    const wy = b.sy;
    const rgb = bitRgb();
    const twin = G.pow >= 2;
    const n = twin ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const off = twin ? (i === 0 ? -0.12 : 0.12) : 0;
      const a = b.aim + off;
      G.shots.push({
        x: wx + Math.cos(a) * 10,
        y: wy + Math.sin(a) * 10,
        vx: Math.cos(a) * 560,
        vy: Math.sin(a) * 560,
        dmg: twin ? 1.15 : 1,
        kind: 'bit',
        r: twin ? 3.4 : 3.0,
        life: 0.85,
        rgb: rgb,
        pierce: twin ? 1 : 0,
        eat: true,
        hit: {}
      });
    }
    audio.bitShot();
    b.glow = Math.max(b.glow, 0.55);
  }

  function enemyFire(e, aimed, spread, fat) {
    const px = G.cam + G.px;
    const py = G.py;
    let ang;
    if (aimed) ang = Math.atan2(py - e.y, px - e.x);
    else ang = Math.PI;
    const n = spread || 1;
    const spd = fat ? 152 : (isRail() ? 172 : 144);
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? ang : ang + (i - (n - 1) * 0.5) * 0.22;
      G.eShots.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: fat ? 7.2 : 3.4,
        life: 4.2,
        fat: !!fat,
        rgb: fat ? GOLD : MAG
      });
    }
    capArr(G.eShots, 110);
  }

  function ringFire(e) {
    const n = isRail() ? 6 : 4;
    const spd = isRail() ? 154 : 128;
    for (let i = 0; i < n; i++) {
      const a = (e.ph || 0) + i * (TAU / n);
      G.eShots.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 3.2, life: 3.8, fat: false, rgb: AZU
      });
    }
  }

  function coreOpen(b) {
    return 0.5 + 0.5 * Math.sin(b.ph * 1.35);
  }

  function hurtEnemy(e, dmg, hx, hy) {
    if (!e.alive) return;
    let dealt = dmg;
    if (e.kind === 'boss' && G.stage === 3) {
      const open = coreOpen(e);
      if (open < 0.55) dealt = dmg * 0.35;
    }
    e.hp -= dealt;
    e.flash = 0.08;
    noteCombo();
    audio.hit(e.kind, G.combo);
    emit(4, {
      x: hx - G.cam, y: hy, j: 3,
      vx0: -50, vx1: 80, vy0: -60, vy1: 60,
      r0: 1, r1: 2.4, life: 0.22, rgb: e.kind === 'boss' ? GOLD : CYN
    });
    const stop = e.kind === 'boss' ? 0.055 : dmg >= 1.15 ? 0.048 : 0.038;
    hitStop(stop);
    kick(e.kind === 'boss' ? 2.6 : 1.5);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.alive = false;
    const sxv = e.x - G.cam;
    const rgb = e.kind === 'boss' ? GOLD
      : e.kind === 'guard' ? TEAL
        : e.kind === 'beetle' ? LEAF
          : e.kind === 'spore' ? MAG
            : CYN;
    burst(sxv, e.y, e.kind === 'boss' ? 28 : 12, rgb, e.kind === 'boss' ? 46 : 22);
    floatText(sxv, e.y - 8, String(Math.round(e.score * G.mult)), GOLD);
    addScore(e.score * G.mult);
    if (e.drop || (e.kind !== 'dart' && Math.random() < (e.kind === 'carrier' ? 1 : 0.18))) {
      dropPod(e.x, e.y);
    }
    if (e.kind === 'boss') {
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
    if (G.have) {
      dropPod(G.cam + G.px + 10, G.py);
      G.have = false;
      G.pow = 0;
      G.bitState = 'dock';
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
    resetBits(false);
    toast('残机 ' + G.lives, true, false);
    hud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '甲核没护住。R 立刻重开，或换模式。');
    hud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(isRail() ? SCORE.rail : SCORE.all);
    saveBest();
    audio.win();
    screenFlash(GOLD, 0.6);
    showOverlay(
      'win',
      isRail() ? '核轨通关' : '核芯尽破',
      isRail() ? '密轨打穿。核心从轨道散了。' : '三关打穿。把核心从轨道打穿。'
    );
    hud();
  }

  function afterBoss() {
    addScore(SCORE.clear);
    toast(stageDef().name + ' 肃清', false, true);
    G.boss = false;
    if (G.stage >= STAGES.length) {
      G.winT = 1.32;
    } else {
      G.stage += 1;
      G.clock = 0;
      G.waveI = 0;
      G.invuln = Math.max(G.invuln, 0.8);
      toast(stageDef().name, false, true);
      hud();
    }
  }

  function updateBits(dt) {
    if (!G.have) return;
    const rgb = bitRgb();
    for (let i = 0; i < G.bits.length; i++) {
      const b = G.bits[i];
      b.spin += dt * 4.2;
      b.glow = Math.max(0, b.glow - dt * 1.8);
      b.fireCd = Math.max(0, b.fireCd - dt);
      b.ramT = Math.max(0, b.ramT - dt);
      const dockX = G.px + 8;
      const dockY = G.py + b.side * 22;
      if (G.bitState === 'dock') {
        b.sx = lerp(b.sx, dockX, 0.28);
        b.sy = lerp(b.sy, dockY, 0.28);
      } else if (G.bitState === 'hunt') {
        const wx = G.cam + b.sx;
        const tgt = nearestEnemy(wx, b.sy, 340);
        let tx;
        let ty;
        if (tgt) {
          tx = tgt.x - G.cam;
          ty = tgt.y;
        } else {
          tx = G.px + 168;
          ty = G.py + b.side * 48;
        }
        const dx = tx - b.sx;
        const dy = ty - b.sy;
        const d = hypot(dx, dy) || 1;
        const spd = 270;
        b.vx = lerp(b.vx, (dx / d) * spd, 0.12);
        b.vy = lerp(b.vy, (dy / d) * spd, 0.12);
        b.sx += b.vx * dt;
        b.sy += b.vy * dt;
      } else if (G.bitState === 'back') {
        const dx = dockX - b.sx;
        const dy = dockY - b.sy;
        const d = hypot(dx, dy) || 1;
        const spd = 460;
        b.sx += (dx / d) * spd * dt;
        b.sy += (dy / d) * spd * dt;
        if (d < 14) {
          b.sx = dockX;
          b.sy = dockY;
        }
      }
      b.sx = clamp(b.sx, 18, VW - 18);
      b.sy = clamp(b.sy, 18, VH - 18);

      const wx = G.cam + b.sx;
      const tgt = nearestEnemy(wx, b.sy, 360);
      const prev = b.lock;
      if (tgt) {
        b.aim = Math.atan2(tgt.y - b.sy, tgt.x - wx);
        b.lock = tgt.id;
        if (prev !== tgt.id && G.bitState === 'hunt') audio.lock();
      } else {
        b.aim = 0;
        b.lock = 0;
      }

      if (playing() && G.deadT <= 0) fireBit(b);

      if (!REDUCE && (G.bitState === 'hunt' || G.bitState === 'back')) {
        trails.push({ x: b.sx, y: b.sy, t: 0.22, rgb: rgb });
        capArr(trails, 40);
      }

      if (b.ramT <= 0 && (G.bitState === 'hunt' || G.bitState === 'dock')) {
        for (let k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (!e.alive) continue;
          if (hypot(e.x - wx, e.y - b.sy) < e.r + BIT_R - 2) {
            hurtEnemy(e, isRail() ? 1.3 : 1, wx, b.sy);
            audio.ram();
            b.ramT = 0.11;
            b.glow = 1;
            break;
          }
        }
      }

      if (playing() && G.deadT <= 0) {
        for (let j = G.eShots.length - 1; j >= 0; j--) {
          const es = G.eShots[j];
          if (es.fat) continue;
          if (hypot(es.x - wx, es.y - b.sy) < BIT_R + es.r) {
            G.eShots.splice(j, 1);
            emit(4, {
              x: b.sx, y: b.sy, j: 3,
              vx0: -40, vx1: 40, vy0: -40, vy1: 40,
              r0: 1, r1: 2.2, life: 0.18, rgb: rgb
            });
            audio.eat();
            b.glow = 1;
          }
        }
      }
    }

    if (G.bitState === 'back') {
      let allHome = true;
      for (let i = 0; i < G.bits.length; i++) {
        const b = G.bits[i];
        if (hypot(b.sx - (G.px + 8), b.sy - (G.py + b.side * 22)) > 16) allHome = false;
      }
      if (allHome) {
        G.bitState = 'dock';
        audio.dock();
        hitStop(0.04);
        kick(1.6);
        screenFlash(rgb, 0.22);
        popPodBadge();
        hud();
      }
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      G.px = lerp(G.px, pointer.x, 0.22);
      G.py = lerp(G.py, pointer.y, 0.22);
    } else {
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
      }
      const spd = moveSpd();
      G.px += dx * spd * dt;
      G.py += dy * spd * dt;
    }
    G.px = clamp(G.px, 28, 720);
    G.py = clamp(G.py, 22, 428);
    G.bank = lerp(G.bank, clamp(dy === 0 ? 0 : dy > 0 ? 1 : -1, -1, 1), 0.18);
    G.engine += dt;
    if (!REDUCE) {
      emit(1, {
        x: G.px - 12, y: G.py, j: 2,
        vx0: -80, vx1: -30, vy0: -18, vy1: 18,
        r0: 1.1, r1: 2.2, life: 0.18, rgb: TEAL, g: 0
      });
    }
    if (G.fireHold) fireMain();
  }

  function updateTitleShip(dt) {
    G.px = 118 + Math.sin(G.t * 0.7) * 36;
    G.py = VH * 0.5 + Math.sin(G.t * 1.1) * 48;
    G.have = true;
    G.pow = 2;
    G.bitState = 'dock';
    G.bank = Math.sin(G.t * 1.1) * 0.4;
    for (let i = 0; i < G.bits.length; i++) {
      const b = G.bits[i];
      b.sx = G.px + 8 + Math.sin(G.t * 2.2 + i) * 3;
      b.sy = G.py + b.side * 22;
      b.spin += dt * 3;
      b.aim = Math.sin(G.t * 1.4 + i) * 0.5;
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.cam - 40 || s.x > G.cam + VW + 80 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.eat) {
        for (let j = G.eShots.length - 1; j >= 0; j--) {
          const es = G.eShots[j];
          if (es.fat) continue;
          if (hypot(es.x - s.x, es.y - s.y) < s.r + es.r + 2) {
            G.eShots.splice(j, 1);
            emit(3, {
              x: s.x - G.cam, y: s.y, j: 2,
              vx0: -30, vx1: 30, vy0: -30, vy1: 30,
              r0: 1, r1: 2, life: 0.16, rgb: s.rgb
            });
          }
        }
      }
      let hit = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        if (hypot(e.x - s.x, e.y - s.y) < e.r + s.r) {
          if (s.pierce && s.hit && s.hit[e.id]) continue;
          hurtEnemy(e, s.dmg, s.x, s.y);
          if (s.pierce) {
            if (!s.hit) s.hit = {};
            s.hit[e.id] = true;
            s.pierce -= 1;
            if (s.pierce <= 0) hit = true;
          } else hit = true;
          if (hit) break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.cam - 30 || s.x > G.cam + VW + 40 || s.y < -24 || s.y > VH + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.invuln > 0 || G.deadT > 0) continue;
      const dx = s.x - (G.cam + G.px);
      const dy = s.y - G.py;
      if (dx * dx + dy * dy < (HIT_R + s.r) * (HIT_R + s.r)) {
        G.eShots.splice(i, 1);
        playerHit(s.fat ? '粗弹' : '中弹');
      }
    }
  }

  function updateEnts(dt) {
    const rate = isRail() ? 0.76 : 1;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      e.ph += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.x += (e.vx || 0) * dt;
      e.y += (e.vy || 0) * dt;
      if (e.kind === 'dart') {
        e.y += Math.sin(e.ph * 3.2 + e.x * 0.01) * 28 * dt;
      } else if (e.kind === 'beetle') {
        e.y += Math.sin(e.ph * 2.2) * 46 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 20) {
          e.fireCd = 1.42 * rate;
          enemyFire(e, true, 1, false);
        }
      } else if (e.kind === 'turret') {
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 10) {
          e.fireCd = 1.08 * rate;
          enemyFire(e, true, isRail() ? 2 : 1, false);
        }
      } else if (e.kind === 'spore') {
        e.spin = (e.spin || 0) + dt * 2.4;
        e.y += Math.sin(e.ph * 1.8) * 26 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 20) {
          e.fireCd = 1.6 * rate;
          ringFire(e);
        }
      } else if (e.kind === 'walker') {
        e.y = lerp(e.y, clamp(G.py, 70, VH - 70), 0.015);
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 20) {
          e.fireCd = 1.22 * rate;
          enemyFire(e, true, 2, false);
        }
      } else if (e.kind === 'carrier') {
        e.y = VH * 0.5 + Math.sin(e.ph * 1.1) * 56;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 30) {
          e.fireCd = 1.28 * rate;
          enemyFire(e, true, 3, Math.random() < 0.18);
        }
      } else if (e.kind === 'guard') {
        e.y += Math.sin(e.ph * 1.5) * 34 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 24) {
          e.fireCd = 1.05 * rate;
          enemyFire(e, true, isRail() ? 3 : 2, false);
        }
      } else if (e.kind === 'boss') {
        updateBoss(e, dt);
      }
      if (e.kind !== 'boss' && (e.x < G.cam - 70 || e.x > G.cam + VW + 160 || e.y < -40 || e.y > VH + 40)) {
        G.ents.splice(i, 1);
        continue;
      }
      if (G.invuln <= 0 && G.deadT <= 0 && playing()) {
        const dx = e.x - (G.cam + G.px);
        const dy = e.y - G.py;
        const rr = e.r + HIT_R - 1;
        if (dx * dx + dy * dy < rr * rr) playerHit('撞机体');
      }
    }
  }

  function updateBoss(b, dt) {
    const tx = G.cam + VW - 148;
    if (b.x > tx) b.x += Math.min(-40, (tx - b.x) * 1.6) * dt;
    else b.x = lerp(b.x, tx, 0.04);
    b.pat += dt;
    b.open = coreOpen(b);
    const half = b.hp < b.max * 0.5;
    const rate = (isRail() ? 0.76 : 1) * (half ? 0.72 : 1);
    if (G.stage === 1) {
      b.y = VH * 0.5 + Math.sin(b.ph * 0.9) * 88;
      b.fireCd -= dt;
      if (b.fireCd <= 0) {
        b.fireCd = 0.82 * rate;
        enemyFire(b, true, half ? 3 : 1, false);
      }
      if (b.pat > 2.1) {
        b.pat = 0;
        ringFire(b);
        if (half) enemyFire(b, true, 4, true);
      }
    } else if (G.stage === 2) {
      b.y = lerp(b.y, clamp(G.py, 70, VH - 70), 0.08);
      b.fireCd -= dt;
      if (b.fireCd <= 0) {
        b.fireCd = 0.55 * rate;
        enemyFire(b, true, half ? 2 : 1, false);
        const a = Math.PI + Math.sin(b.ph * 2.4) * 0.6;
        for (let k = -1; k <= 1; k++) {
          G.eShots.push({
            x: b.x - 20, y: b.y + k * 16,
            vx: Math.cos(a) * 180, vy: Math.sin(a) * 40 + k * 20,
            r: 3.2, life: 3.4, fat: false, rgb: STEEL
          });
        }
      }
      if (b.pat > 1.8) {
        b.pat = 0;
        enemyFire(b, false, half ? 5 : 3, true);
      }
    } else {
      b.y = VH * 0.5 + Math.sin(b.ph * 0.7) * 64;
      b.fireCd -= dt;
      if (b.fireCd <= 0) {
        b.fireCd = 0.68 * rate;
        ringFire(b);
        if (b.open > 0.55) enemyFire(b, true, half ? 3 : 1, half);
      }
      if (b.pat > 2.3) {
        b.pat = 0;
        for (let k = 0; k < (half ? 8 : 6); k++) {
          const a = b.ph + k * (TAU / (half ? 8 : 6));
          G.eShots.push({
            x: b.x, y: b.y,
            vx: Math.cos(a) * 140,
            vy: Math.sin(a) * 140,
            r: half ? 6.4 : 3.6,
            life: 3.6,
            fat: half && k % 2 === 0,
            rgb: half ? GOLD : CORE
          });
        }
      }
    }
  }

  function updateDrops(dt) {
    const px = G.cam + G.px;
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.t += dt;
      d.life -= dt;
      const dx = px - d.x;
      const dy = G.py - d.y;
      const dist = hypot(dx, dy);
      if (dist < 92) {
        d.x += (dx / (dist || 1)) * 220 * dt;
        d.y += (dy / (dist || 1)) * 220 * dt;
      } else {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += Math.sin(d.t * 4) * 10 * dt;
      }
      d.y = clamp(d.y, 24, VH - 24);
      if (d.life <= 0 || d.x < G.cam - 40) {
        G.drops.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && dist < 18) {
        collectDrop(d);
        G.drops.splice(i, 1);
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 4.2;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.6;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= 28 * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake = Math.max(0, G.shake - dt * 14);
    G.punch = lerp(G.punch, 1, 0.18);
    G.muzzle = Math.max(0, G.muzzle - dt * 8);
    G.toastT = Math.max(0, G.toastT - dt);
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    G.podCd = Math.max(0, G.podCd - dt);
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);

    if (G.mode === 'title') {
      G.cam += 42 * dt;
      updateTitleShip(dt);
      updateFx(dt);
      return;
    }

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        hud();
      }
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) finishDeath();
    }

    if (playing() && G.deadT <= 0) {
      G.clock += dt;
      G.cam += scrollSpd() * dt;
      updatePlayer(dt);
      maybeSpawn();
    } else if (G.mode === 'win' || G.mode === 'lose') {
      G.cam += 28 * dt;
    }

    updateBits(dt);
    updateShots(dt);
    updateEnts(dt);
    updateDrops(dt);
    updateFx(dt);

    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) winGame();
    }
  }

  function drawHex(x, y, r, rgb, a, rot) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(rot || 0);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = i * (TAU / 6) - Math.PI / 6;
      const px = Math.cos(ang) * r * scale;
      const py = Math.sin(ang) * r * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = rgba(rgb, a);
    ctx.fill();
    ctx.restore();
  }

  function palette() {
    const th = stageDef().theme;
    if (th === 'steel') return { bg: [8, 16, 28], a: STEEL, b: CYN, c: [40, 70, 100] };
    if (th === 'core') return { bg: [14, 8, 22], a: MAG, b: GOLD, c: [90, 30, 60] };
    return { bg: [6, 20, 18], a: LEAF, b: CYN, c: [30, 70, 50] };
  }

  function drawBg(pal) {
    ctx.fillStyle = rgba(pal.bg, 1);
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    g.addColorStop(0, rgba(pal.a, 0.12));
    g.addColorStop(0.5, 'transparent');
    g.addColorStop(1, rgba(pal.b, 0.1));
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    const cam = G.cam;
    ctx.strokeStyle = rgba(pal.a, 0.08);
    ctx.lineWidth = 1;
    const gap = 36;
    const off = (cam * 0.35) % gap;
    for (let x = -off; x < VW + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(0));
      ctx.lineTo(sx(x), sy(VH));
      ctx.stroke();
    }
    for (let y = 0; y < VH; y += gap) {
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(y));
      ctx.lineTo(sx(VW), sy(y));
      ctx.stroke();
    }

    if (stageDef().theme === 'core') {
      ctx.strokeStyle = rgba(GOLD, 0.07);
      const hx = 48;
      const hyOff = (cam * 0.2) % hx;
      for (let x = -hyOff; x < VW + hx; x += hx) {
        for (let y = 20; y < VH; y += 42) {
          ctx.beginPath();
          ctx.arc(sx(x), sy(y), 10 * scale, 0, TAU);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < decos.length; i++) {
      const d = decos[i];
      const dx = ((d.x - cam * 0.55) % (VW + 200) + (VW + 200)) % (VW + 200) - 40;
      const col = d.kind === 0 ? pal.a : d.kind === 1 ? pal.b : pal.c;
      ctx.fillStyle = rgba(col, 0.16);
      ctx.strokeStyle = rgba(col, 0.32);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      if (d.kind === 0) {
        ctx.moveTo(sx(dx), sy(d.y));
        ctx.lineTo(sx(dx + d.w * 0.5), sy(d.y - d.h));
        ctx.lineTo(sx(dx + d.w), sy(d.y));
        ctx.closePath();
      } else if (d.kind === 1) {
        ctx.rect(sx(dx), sy(d.y - d.h * 0.5), d.w * scale, d.h * scale);
      } else {
        ctx.moveTo(sx(dx), sy(d.y));
        ctx.lineTo(sx(dx + d.w), sy(d.y));
        ctx.lineTo(sx(dx + d.w * 0.7), sy(d.y - d.h));
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= s.z * (G.boss ? 12 : 28) * (1 / 60);
      if (s.x < -4) s.x = VW + rand(0, 40);
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(G.t * 2 + s.tw));
      ctx.fillStyle = rgba(WHT, 0.18 + tw * 0.45 * s.z);
      ctx.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }
  }

  function drawShot(s) {
    const x = s.x - G.cam;
    const y = s.y;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(Math.atan2(s.vy, s.vx));
    if (s.kind === 'bit') {
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.fillRect(0, -1.5 * scale, 16 * scale, 3 * scale);
      ctx.fillStyle = rgba(WHT, 0.75);
      ctx.fillRect(0, -0.6 * scale, 16 * scale, 1.2 * scale);
    } else {
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.6 * scale, 1.8 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.ellipse(1 * scale, 0, 3.2 * scale, 1 * scale, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    const x = e.x - G.cam;
    const y = e.y;
    const flash = e.flash > 0;
    let rgb = flash ? WHT : CYN;
    if (!flash) {
      if (e.kind === 'beetle') rgb = LEAF;
      else if (e.kind === 'turret') rgb = GOLD;
      else if (e.kind === 'spore') rgb = MAG;
      else if (e.kind === 'walker') rgb = STEEL;
      else if (e.kind === 'carrier') rgb = ORG;
      else if (e.kind === 'guard') rgb = TEAL;
    }
    ctx.save();
    ctx.translate(sx(x), sy(y));
    if (e.kind === 'dart') {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.moveTo(-12 * scale, 0);
      ctx.lineTo(8 * scale, -7 * scale);
      ctx.lineTo(4 * scale, 0);
      ctx.lineTo(8 * scale, 7 * scale);
      ctx.closePath();
      ctx.fill();
    } else if (e.kind === 'beetle') {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.ellipse(0, 0, 13 * scale, 8 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.8);
      ctx.fillRect(-2 * scale, -3 * scale, 10 * scale, 6 * scale);
      ctx.strokeStyle = rgba(rgb, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(-6 * scale, -8 * scale);
      ctx.lineTo(-14 * scale, -12 * scale);
      ctx.moveTo(-6 * scale, 8 * scale);
      ctx.lineTo(-14 * scale, 12 * scale);
      ctx.stroke();
    } else if (e.kind === 'turret') {
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.fillRect(-10 * scale, -8 * scale, 20 * scale, 16 * scale);
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.4 * scale;
      ctx.strokeRect(-10 * scale, -8 * scale, 20 * scale, 16 * scale);
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.arc(0, 0, 4 * scale, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'spore') {
      ctx.rotate(e.spin || 0);
      ctx.fillStyle = rgba(rgb, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, 10 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.5);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 13 * scale, 0, TAU);
      ctx.stroke();
    } else if (e.kind === 'walker') {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.fillRect(-12 * scale, -10 * scale, 24 * scale, 14 * scale);
      ctx.fillRect(-8 * scale, 4 * scale, 5 * scale, 10 * scale);
      ctx.fillRect(3 * scale, 4 * scale, 5 * scale, 10 * scale);
      ctx.fillStyle = rgba(CORE, 0.9);
      ctx.fillRect(6 * scale, -4 * scale, 10 * scale, 4 * scale);
    } else if (e.kind === 'carrier') {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.moveTo(18 * scale, 0);
      ctx.lineTo(0, -14 * scale);
      ctx.lineTo(-16 * scale, -8 * scale);
      ctx.lineTo(-16 * scale, 8 * scale);
      ctx.lineTo(0, 14 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(-2 * scale, 0, 5 * scale, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'guard') {
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.moveTo(16 * scale, 0);
      ctx.lineTo(0, -12 * scale);
      ctx.lineTo(-14 * scale, 0);
      ctx.lineTo(0, 12 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.6);
      ctx.fillRect(-4 * scale, -4 * scale, 10 * scale, 8 * scale);
    }
    ctx.restore();
  }

  function drawBoss(b) {
    const x = b.x - G.cam;
    const y = b.y;
    const flash = b.flash > 0;
    const rgb = flash ? WHT : (G.stage === 3 ? CORE : G.stage === 2 ? STEEL : LEAF);
    ctx.save();
    ctx.translate(sx(x), sy(y));
    if (G.stage === 1) {
      ctx.rotate(Math.sin(b.ph * 0.8) * 0.12);
      ctx.fillStyle = rgba(DEEP, 0.92);
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34 * scale, 22 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(-6 * scale, 0, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(rgb, 0.7);
      for (let i = 0; i < 4; i++) {
        const a = i * 0.7 - 1.05;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 18 * scale, Math.sin(a) * 12 * scale);
        ctx.lineTo(Math.cos(a) * 36 * scale, Math.sin(a) * 22 * scale);
        ctx.stroke();
      }
    } else if (G.stage === 2) {
      ctx.fillStyle = rgba(DEEP, 0.92);
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.rect(-32 * scale, -22 * scale, 64 * scale, 44 * scale);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(-28 * scale, -6 * scale, 18 * scale, 12 * scale);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(8 * scale, -16 * scale, 20 * scale, 8 * scale);
      ctx.fillRect(8 * scale, 8 * scale, 20 * scale, 8 * scale);
    } else {
      const open = b.open == null ? 1 : b.open;
      ctx.rotate(b.ph * 0.35);
      ctx.fillStyle = rgba(DEEP, 0.94);
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = i * (TAU / 6);
        const rad = 36 * scale;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const ang = i * (TAU / 6) + b.ph * 0.2;
        const inner = (18 + open * 10) * scale;
        const outer = 34 * scale;
        ctx.strokeStyle = rgba(AZU, 0.55 + open * 0.35);
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
        ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer);
        ctx.stroke();
      }
      const core = mix(GOLD, CORE, 0.4 + 0.4 * Math.sin(G.t * 6));
      ctx.fillStyle = rgba(core, 0.55 + open * 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, (10 + open * 4) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(-2 * scale, -2 * scale, 3.2 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    const ratio = clamp(b.hp / b.max, 0, 1);
    const bw = 120;
    const bx = VW - 148;
    const by = 16;
    ctx.fillStyle = rgba(DEEP, 0.7);
    ctx.fillRect(sx(bx), sy(by), bw * scale, 7 * scale);
    ctx.fillStyle = rgba(ratio < 0.3 ? MAG : GOLD, 0.9);
    ctx.fillRect(sx(bx), sy(by), bw * ratio * scale, 7 * scale);
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(bx), sy(by), bw * scale, 7 * scale);
  }

  function drawShipAt(x, y, bank, ghost) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(bank * 0.18);
    const a = ghost == null ? 1 : ghost;
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(AZU, 0.95);
    ctx.beginPath();
    ctx.moveTo(16 * scale, 0);
    ctx.lineTo(-6 * scale, -9 * scale);
    ctx.lineTo(-12 * scale, -3 * scale);
    ctx.lineTo(-12 * scale, 3 * scale);
    ctx.lineTo(-6 * scale, 9 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(8 * scale, 0);
    ctx.lineTo(-2 * scale, -5 * scale);
    ctx.lineTo(-8 * scale, 0);
    ctx.lineTo(-2 * scale, 5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(-2 * scale, -2.2 * scale, 8 * scale, 4.4 * scale);
    ctx.fillStyle = rgba(TEAL, 0.9);
    ctx.fillRect(-12 * scale, -4.5 * scale, 4 * scale, 3 * scale);
    ctx.fillRect(-12 * scale, 1.5 * scale, 4 * scale, 3 * scale);
    if (G.muzzle > 0 && ghost == null) {
      ctx.fillStyle = rgba(WHT, G.muzzle);
      ctx.fillRect(14 * scale, -1.4 * scale, 10 * scale, 2.8 * scale);
    }
    ctx.restore();
  }

  function drawBits() {
    if (!G.have || G.deadT > 0) return;
    const rgb = bitRgb();
    for (let i = 0; i < G.bits.length; i++) {
      const b = G.bits[i];
      if (b.lock) {
        for (let k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (e.id !== b.lock || !e.alive) continue;
          const ex = e.x - G.cam;
          ctx.strokeStyle = rgba(rgb, 0.28);
          ctx.lineWidth = 1 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(b.sx), sy(b.sy));
          ctx.lineTo(sx(ex), sy(e.y));
          ctx.stroke();
          ctx.strokeStyle = rgba(GOLD, 0.7);
          ctx.lineWidth = 1.2 * scale;
          const r = e.r + 6;
          ctx.strokeRect(sx(ex - r), sy(e.y - r), r * 2 * scale, r * 2 * scale);
        }
      }
      ctx.save();
      ctx.translate(sx(b.sx), sy(b.sy));
      ctx.rotate(b.spin);
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      for (let h = 0; h < 6; h++) {
        const ang = h * (TAU / 6);
        const px = Math.cos(ang) * 8 * scale;
        const py = Math.sin(ang) * 8 * scale;
        if (h === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 2.8 * scale, 0, TAU);
      ctx.fill();
      if (b.glow > 0) {
        ctx.strokeStyle = rgba(rgb, b.glow);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, 12 * scale, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.translate(sx(b.sx), sy(b.sy));
      ctx.rotate(b.aim);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(7 * scale, -1.1 * scale, 8 * scale, 2.2 * scale);
      ctx.restore();
    }
  }

  function drawPlayer() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.deadT > 0) return;
    if (G.invuln > 0 && G.mode === 'play' && ((G.t * 18) | 0) % 2 === 0) return;
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      ctx.fillStyle = rgba(t.rgb, 0.35 * (t.t / 0.22));
      ctx.beginPath();
      ctx.arc(sx(t.x), sy(t.y), 4 * scale * (t.t / 0.22), 0, TAU);
      ctx.fill();
    }
    drawShipAt(G.px, G.py, G.bank, null);
    drawBits();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale * a, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - r.t));
      ctx.lineWidth = 2 * scale * (1 - r.t);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 28) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = rgba(f.rgb, 1 - f.t / f.life);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawDrops() {
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      const x = d.x - G.cam;
      const pulse = 8 + Math.sin(d.t * 8) * 1.4;
      drawHex(x, d.y, pulse, GOLD, 0.95, d.t * 2);
      ctx.strokeStyle = rgba(CYN, 0.55);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.arc(sx(x), sy(d.y), 12 * scale, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(sx(x), sy(d.y), 2.6 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawEShots() {
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = s.x - G.cam;
      if (s.fat) {
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.beginPath();
        ctx.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.5);
        ctx.beginPath();
        ctx.arc(sx(x - 1), sy(s.y - 1), s.r * 0.4 * scale, 0, TAU);
        ctx.fill();
      } else {
        drawHex(x, s.y, s.r + 0.6, s.rgb, 0.92, G.t * 4);
      }
    }
  }

  function draw() {
    const pal = palette();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#061422';
    ctx.fillRect(0, 0, W, H);

    let kx = 0;
    let ky = 0;
    if (G.shake > 0 && !REDUCE) {
      kx = rand(-G.shake, G.shake);
      ky = rand(-G.shake, G.shake);
    }
    ctx.save();
    ctx.translate(kx * scale, ky * scale);
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(sx(VW * 0.5), sy(VH * 0.5));
      ctx.scale(G.punch, G.punch);
      ctx.translate(-sx(VW * 0.5), -sy(VH * 0.5));
    }

    drawBg(pal);
    drawStars();
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'boss') drawBoss(G.ents[i]);
      else drawEnemy(G.ents[i]);
    }
    drawDrops();
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawEShots();
    drawPlayer();
    drawParticles();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width * dpr);
    H = Math.max(1, rect.height * dpr);
    canvas.width = W;
    canvas.height = H;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerVirtX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left) * dpr / scale - ox / scale;
  }
  function pointerVirtY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top) * dpr / scale - oy / scale;
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'rail' ? 'rail' : 'pals';
    G.stage = 1;
    G.t = 0;
    G.clock = 0;
    G.cam = 0;
    G.px = 96;
    G.py = VH * 0.5;
    G.vx = 0;
    G.vy = 0;
    G.bank = 0;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.fireHold = false;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.05;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.waveI = 0;
    G.why = '';
    G.winT = 0;
    G.boss = false;
    G.podCd = 0;
    G.have = false;
    G.pow = 0;
    G.bitState = 'dock';
    resetBits(false);
    clearField();
    seedStars();
    seedDecos();
    hideOverlay();
    hud();
    audio.start();
    dropPod(G.cam + 240, VH * 0.5);
    toast(isRail() ? '核轨 · 更密更快' : '加甲 · 接住甲核', false, true);
    if (scoreEl) scoreEl.textContent = '0';
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'pals';
    G.stage = 1;
    G.lives = LIVES;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.score = 0;
    G.px = 118;
    G.py = VH * 0.5;
    G.invuln = 9;
    G.boss = false;
    G.have = true;
    G.pow = 2;
    G.bitState = 'dock';
    clearField();
    seedStars();
    seedDecos();
    showOverlay('title', '加甲', '接住甲核。双甲自动锁敌。Shift 把甲核打出去猎杀，再按收回。撞机掉命。');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('pals');
    else startGame(G.kind || 'pals');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('pals');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isPod = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const space = k === ' ' || k === 'Spacebar' || k === 'Space' || code === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (space) {
      keys.sht = down;
      G.fireHold = down && playing() && G.deadT <= 0 && !overlayOpen();
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || isPod) {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || isPod)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (isPod) {
      toggleBits();
      return;
    }
    if (space) {
      if (overlayOpen()) {
        primaryAction();
        if (playing() && G.deadT <= 0) G.fireHold = true;
        return;
      }
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('pals');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('rail');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (e.button === 2) {
        toggleBits();
        return;
      }
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerVirtX(e), 18, VW - 18);
      pointer.y = clamp(pointerVirtY(e), 22, VH - 22);
      inputSrc = 'ptr';
      if (playing() && G.deadT <= 0 && !overlayOpen()) G.fireHold = true;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerVirtX(e), 18, VW - 18);
      pointer.y = clamp(pointerVirtY(e), 22, VH - 22);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (inputSrc === 'ptr') G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
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

  function bindPodBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      el.classList.add('held');
      toggleBits();
    });
    el.addEventListener('pointerup', function () { el.classList.remove('held'); });
    el.addEventListener('pointercancel', function () { el.classList.remove('held'); });
    el.addEventListener('pointerleave', function () { el.classList.remove('held'); });
  }

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnPals) {
    btnPals.addEventListener('click', function () {
      audio.ensure();
      startGame('pals');
    });
  }
  if (btnRail) {
    btnRail.addEventListener('click', function () {
      audio.ensure();
      startGame('rail');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'pals');
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
  bindPodBtn(btnPod);

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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
