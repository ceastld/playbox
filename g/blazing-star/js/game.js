'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const TAP = 0.08;
  const CHG1 = 0.4;
  const CHG2 = 0.84;
  const CHG3 = 1.38;
  const PWR_MAX = 3;
  const SPD_MAX = 3;
  const BEST_KEY = 'playbox-blazing-star-best';
  const MUTE_KEY = 'playbox-blazing-star-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击（按住蓄力）· R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 106, 40];
  const ORG = [255, 77, 20];
  const WHT = [255, 243, 232];
  const PNK = [255, 154, 180];
  const DEEP = [40, 14, 10];
  const SUN = [255, 180, 64];

  const SCORE = {
    scout: 50,
    diver: 80,
    gun: 150,
    rock: 100,
    carrier: 280,
    mid: 2000,
    boss: [4000, 6000, 9000],
    clear: 2000,
    all: 6000
  };

  const STAGES = [
    {
      name: '赤漠',
      mid: '岩卫',
      boss: '日冕',
      midHp: 40,
      bossHp: 92,
      waves: [
        { x: 30, kind: 'v', n: 5, y: 0.42 },
        { x: 160, kind: 'stream', n: 6 },
        { x: 280, kind: 'diver', n: 4 },
        { x: 390, kind: 'gun' },
        { x: 500, kind: 'v', n: 7, y: 0.58 },
        { x: 610, kind: 'carrier', drop: 'P' },
        { x: 700, kind: 'rock' },
        { x: 800, kind: 'ring', n: 6 },
        { x: 900, kind: 'v', n: 5, y: 0.34 },
        { x: 980, kind: 'mid' },
        { x: 1220, kind: 'stream', n: 8 },
        { x: 1340, kind: 'diver', n: 5 },
        { x: 1440, kind: 'gun' },
        { x: 1540, kind: 'v', n: 7, y: 0.5 },
        { x: 1640, kind: 'carrier', drop: 'S' },
        { x: 1740, kind: 'ring', n: 7 },
        { x: 1840, kind: 'rock' },
        { x: 1940, kind: 'v', n: 6, y: 0.62 },
        { x: 2050, kind: 'boss' }
      ]
    },
    {
      name: '星廊',
      mid: '环卫',
      boss: '星核',
      midHp: 52,
      bossHp: 118,
      waves: [
        { x: 20, kind: 'stream', n: 8 },
        { x: 140, kind: 'v', n: 7, y: 0.3 },
        { x: 220, kind: 'v', n: 7, y: 0.7 },
        { x: 340, kind: 'ring', n: 8 },
        { x: 450, kind: 'gun' },
        { x: 540, kind: 'diver', n: 6 },
        { x: 640, kind: 'carrier', drop: 'P' },
        { x: 740, kind: 'stream', n: 8 },
        { x: 840, kind: 'rock' },
        { x: 980, kind: 'mid' },
        { x: 1200, kind: 'v', n: 8, y: 0.4 },
        { x: 1300, kind: 'ring', n: 8 },
        { x: 1400, kind: 'gun' },
        { x: 1480, kind: 'gun' },
        { x: 1580, kind: 'diver', n: 6 },
        { x: 1680, kind: 'carrier', drop: 'S' },
        { x: 1760, kind: 'stream', n: 9 },
        { x: 1860, kind: 'v', n: 7, y: 0.55 },
        { x: 1960, kind: 'ring', n: 8 },
        { x: 2050, kind: 'boss' }
      ]
    },
    {
      name: '烈核',
      mid: '焰卫',
      boss: '烈星核',
      midHp: 64,
      bossHp: 160,
      waves: [
        { x: 10, kind: 'ring', n: 8 },
        { x: 120, kind: 'v', n: 8, y: 0.36 },
        { x: 180, kind: 'v', n: 8, y: 0.64 },
        { x: 300, kind: 'diver', n: 7 },
        { x: 400, kind: 'gun' },
        { x: 480, kind: 'stream', n: 10 },
        { x: 580, kind: 'carrier', drop: 'P' },
        { x: 680, kind: 'rock' },
        { x: 760, kind: 'rock' },
        { x: 860, kind: 'ring', n: 9 },
        { x: 980, kind: 'mid' },
        { x: 1200, kind: 'stream', n: 10 },
        { x: 1300, kind: 'diver', n: 7 },
        { x: 1380, kind: 'gun' },
        { x: 1460, kind: 'gun' },
        { x: 1560, kind: 'v', n: 9, y: 0.48 },
        { x: 1660, kind: 'carrier', drop: 'S' },
        { x: 1740, kind: 'ring', n: 9 },
        { x: 1840, kind: 'rock' },
        { x: 1920, kind: 'stream', n: 8 },
        { x: 2050, kind: 'boss' }
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
  const btnRaid = document.getElementById('btn-raid');
  const btnStorm = document.getElementById('btn-storm');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const pwrLabel = document.getElementById('pwr-label');
  const spdLabel = document.getElementById('spd-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chgBar = document.getElementById('chg-bar');
  const chgWrap = document.getElementById('chg-wrap');

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

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  let uid = 1;
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const dust = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    cam: 0,
    px: 90,
    py: VH * 0.5,
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
    pick: [],
    spawnI: 0,
    fireHold: false,
    chargeT: 0,
    vulcanCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ORG,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    mid: false,
    boss: false,
    winT: 0,
    lastLv: 0,
    power: 0,
    spd: 0,
    opt: [
      { x: 70, y: VH * 0.5 - 18 },
      { x: 70, y: VH * 0.5 + 18 }
    ]
  };

  let inputSrc = 'key';

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
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
  function isStorm() {
    return G.kind === 'storm';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function optionCount() {
    return G.power >= 3 ? 2 : G.power >= 2 ? 1 : 0;
  }
  function moveSpd() {
    return (isStorm() ? 304 : 268) + G.spd * 44;
  }
  function scrollSpd() {
    if (G.boss || G.mid) {
      const b = findBig();
      if (b && b.alive) {
        const x = b.x - G.cam;
        if (x < VW - 210) return isStorm() ? 12 : 8;
        if (x < VW - 130) return isStorm() ? 40 : 26;
      }
      return isStorm() ? 52 : 36;
    }
    return isStorm() ? 154 : 102;
  }
  function chargeLevel() {
    if (G.chargeT >= CHG3) return 3;
    if (G.chargeT >= CHG2) return 2;
    if (G.chargeT >= CHG1) return 1;
    return 0;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
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
      this.beep(920, 0.048, 'square', 0.03, 1840);
    },
    chargeTick(lv) {
      this.ensure();
      const f = 240 + lv * 190;
      this.beep(f, 0.08, 'sine', 0.034, f * 1.7);
      if (lv >= 3) this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    blaze(lv) {
      this.ensure();
      this.noise(0.12 + lv * 0.05, 0.06, 240);
      this.beep(160 + lv * 36, 0.2, 'sawtooth', 0.058, 62);
      this.beep(480 + lv * 90, 0.14, 'square', 0.042, 160);
      if (lv >= 3) this.beep(1180, 0.16, 'triangle', 0.036, 420);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 190 : kind === 'mid' ? 240 : 500;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.042, 0.034, 1100);
      this.beep(base * lift, 0.075, 'square', 0.044, base * lift * 1.55);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.068, 260);
      this.beep(260, 0.24, 'sawtooth', 0.054, 58);
      this.beep(130, 0.34, 'sine', 0.046, 38);
    },
    pickup(kind) {
      this.ensure();
      if (kind === 'S') {
        this.beep(660, 0.07, 'square', 0.04, 990);
        this.beep(990, 0.1, 'triangle', 0.034, 1320);
      } else {
        this.beep(523, 0.08, 'square', 0.044, 784);
        this.beep(784, 0.12, 'triangle', 0.038, 1046);
      }
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
      this.beep(210, 0.18, 'sawtooth', 0.042, 86);
      this.beep(130, 0.3, 'sine', 0.05, 46);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    warn() {
      this.ensure();
      this.beep(210, 0.16, 'square', 0.042, 105);
      this.beep(320, 0.22, 'sawtooth', 0.036, 78);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageInfo();
      const big = G.boss ? info.boss : G.mid ? info.mid : info.name;
      stageLabel.textContent = G.boss || G.mid ? big : ('第 ' + G.stage + ' 关 · ' + info.name);
      stageLabel.classList.toggle('hot', G.boss || G.mid);
    }
    if (tagLabel) {
      tagLabel.textContent = isStorm() ? '弹幕' : '烈焰';
      tagLabel.className = isStorm() ? 'warn' : '';
    }
    if (pwrLabel) {
      pwrLabel.textContent = G.power >= PWR_MAX ? '火 MAX' : ('火 ' + G.power);
      pwrLabel.className = 'pwr' + (G.power >= PWR_MAX ? ' max' : '');
    }
    if (spdLabel) {
      spdLabel.textContent = G.spd >= SPD_MAX ? '速 MAX' : ('速 ' + G.spd);
      spdLabel.className = 'spd' + (G.spd >= SPD_MAX ? ' max' : '');
    }
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
    const lv = chargeLevel();
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.chargeT / CHG3, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('hot', lv >= 3);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机体或中弹掉命', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 烈星核已碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 蓄满再放烈星', 'warn');
    else if (lv >= 3) setHint('蓄满 · 松手放出宽幅烈星', 'hot');
    else setHint('点射连发 · 按住蓄力 · 吃 P / S', '');
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'BLAZE';
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
    const cls = mag >= 6 ? 'die' : mag >= 4.2 ? 'blaze' : mag >= 2.4 ? 'charge' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('charge');
    stageEl.classList.remove('blaze');
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
    capArr(particles, 340);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 44);
    capArr(rings, 26);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 26);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(36, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -240, vx1: 200, vy0: -200, vy1: 180,
      r0: 1.4, r1: 4.6, life: 0.44 + p * 0.006, rgb: rgb, g: 260
    });
    emit(7, {
      x: x, y: y, j: 3,
      vx0: -80, vx1: 80, vy0: -100, vy1: 70,
      r0: 2, r1: 5.2, life: 0.3, rgb: WHT, g: 70
    });
    popSpark(x, y, rgb, 12 + p * 0.42);
  }

  function bumpCombo() {
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
      }
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 86; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.16, 0.72),
        p: rand(16, 78)
      });
    }
    dust.length = 0;
    for (let i = 0; i < 18; i++) {
      dust.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(8, 22),
        a: rand(0.06, 0.16),
        p: rand(10, 28)
      });
    }
  }

  function findBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if ((e.type === 'boss' || e.type === 'mid') && e.alive) return e;
    }
    return null;
  }

  function pushEnt(e) {
    e.id = uid++;
    e.alive = e.alive !== false;
    G.ents.push(e);
    capArr(G.ents, 120);
  }

  function spawnV(n, yNorm) {
    const extra = isStorm() ? 2 : 0;
    const count = n + extra;
    const baseY = 40 + yNorm * (VH - 80);
    for (let i = 0; i < count; i++) {
      const side = i - (count - 1) * 0.5;
      pushEnt({
        type: 'scout',
        form: 'v',
        x: G.cam + VW + 24 + i * 22,
        y: clamp(baseY + Math.abs(side) * 16, 28, VH - 28),
        vx: isStorm() ? -168 : -132,
        vy: 0,
        hp: 1,
        maxHp: 1,
        w: 11,
        h: 8,
        t: i * 0.08,
        phase: rand(0, TAU),
        shootCd: rand(0.55, 1.4)
      });
    }
  }

  function spawnStream(n) {
    const extra = isStorm() ? 2 : 0;
    const count = n + extra;
    const mid = VH * (0.32 + Math.random() * 0.36);
    for (let i = 0; i < count; i++) {
      pushEnt({
        type: 'scout',
        form: 'stream',
        x: G.cam + VW + 20 + i * 20,
        y: mid,
        baseY: mid,
        vx: isStorm() ? -154 : -122,
        vy: 0,
        hp: 1,
        maxHp: 1,
        w: 10,
        h: 8,
        t: i * 0.1,
        phase: i * 0.55,
        amp: 36 + rand(0, 18),
        shootCd: rand(0.7, 1.6)
      });
    }
  }

  function spawnDiver(n) {
    const extra = isStorm() ? 1 : 0;
    const count = n + extra;
    for (let i = 0; i < count; i++) {
      const fromTop = i % 2 === 0;
      pushEnt({
        type: 'diver',
        x: G.cam + VW + 30 + i * 28,
        y: fromTop ? 18 + rand(0, 40) : VH - 18 - rand(0, 40),
        vx: isStorm() ? -150 : -118,
        vy: fromTop ? 70 : -70,
        hp: 1,
        maxHp: 1,
        w: 12,
        h: 9,
        t: 0,
        shootCd: rand(0.4, 1.1)
      });
    }
  }

  function spawnRing(n) {
    const extra = isStorm() ? 2 : 0;
    const count = n + extra;
    const cx = G.cam + VW + 50;
    const cy = 90 + Math.random() * (VH - 180);
    const rad = 28 + count * 2.2;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * TAU;
      pushEnt({
        type: 'scout',
        form: 'ring',
        x: cx + Math.cos(ang) * rad,
        y: cy + Math.sin(ang) * rad * 0.62,
        cx: cx,
        cy: cy,
        ang: ang,
        ringR: rad,
        vx: isStorm() ? -110 : -88,
        vy: 0,
        hp: 1,
        maxHp: 1,
        w: 10,
        h: 8,
        t: 0,
        shootCd: rand(0.8, 1.7)
      });
    }
  }

  function spawnGun() {
    pushEnt({
      type: 'gun',
      x: G.cam + VW + 22,
      y: 80 + Math.random() * (VH - 160),
      vx: isStorm() ? -92 : -74,
      vy: 0,
      hp: isStorm() ? 7 : 5,
      maxHp: isStorm() ? 7 : 5,
      w: 20,
      h: 13,
      t: 0,
      shootCd: 0.7
    });
  }

  function spawnRock() {
    pushEnt({
      type: 'rock',
      x: G.cam + VW + 26,
      y: 50 + Math.random() * (VH - 100),
      vx: isStorm() ? -70 : -56,
      vy: rand(-18, 18),
      hp: isStorm() ? 8 : 6,
      maxHp: isStorm() ? 8 : 6,
      w: 16,
      h: 16,
      t: 0,
      spin: rand(0, TAU),
      shootCd: 1.4
    });
  }

  function spawnCarrier(drop) {
    pushEnt({
      type: 'carrier',
      x: G.cam + VW + 24,
      y: 70 + Math.random() * (VH - 140),
      vx: isStorm() ? -96 : -78,
      vy: 0,
      hp: isStorm() ? 6 : 4,
      maxHp: isStorm() ? 6 : 4,
      w: 18,
      h: 12,
      t: 0,
      drop: drop || 'P',
      shootCd: 1.1
    });
  }

  function spawnPickup(x, y, kind) {
    G.pick.push({
      x: x,
      y: y,
      kind: kind,
      vx: -42,
      t: 0,
      life: 9
    });
    capArr(G.pick, 12);
  }

  function spawnMid() {
    G.mid = true;
    const info = stageInfo();
    const hp = info.midHp + (isStorm() ? Math.round(info.midHp * 0.22) : 0);
    const variant = G.stage === 1 ? 'rock' : G.stage === 2 ? 'ring' : 'flame';
    pushEnt({
      type: 'mid',
      variant: variant,
      name: info.mid,
      x: G.cam + VW + 50,
      y: VH * 0.5,
      vx: -46,
      vy: 0,
      hp: hp,
      maxHp: hp,
      w: variant === 'ring' ? 34 : 32,
      h: variant === 'flame' ? 22 : 30,
      t: 0,
      shootCd: 0.7,
      phase: 1,
      spin: 0,
      dash: 0
    });
    toast(info.mid, true, false);
    audio.warn();
    screenFlash(ORG, 0.24);
    kick(3.6);
    syncHud();
  }

  function spawnBoss() {
    G.boss = true;
    G.mid = false;
    const info = stageInfo();
    const hp = info.bossHp + (isStorm() ? Math.round(info.bossHp * 0.22) : 0);
    const variant = G.stage === 1 ? 'corona' : G.stage === 2 ? 'core' : 'blaze';
    pushEnt({
      type: 'boss',
      variant: variant,
      name: info.boss,
      x: G.cam + VW + 56,
      y: VH * 0.5,
      vx: -42,
      vy: 0,
      hp: hp,
      maxHp: hp,
      w: variant === 'blaze' ? 48 : 42,
      h: variant === 'corona' ? 42 : 36,
      t: 0,
      shootCd: 0.55,
      phase: 1,
      spin: 0,
      bits: variant === 'core' ? [0, TAU / 3, TAU * 2 / 3] : null
    });
    toast(info.boss, true, false);
    audio.warn();
    screenFlash(GOLD, 0.3);
    kick(4.4);
    syncHud();
  }

  function spawnWave(w) {
    if (w.kind === 'v') spawnV(w.n || 5, w.y == null ? 0.5 : w.y);
    else if (w.kind === 'stream') spawnStream(w.n || 6);
    else if (w.kind === 'diver') spawnDiver(w.n || 4);
    else if (w.kind === 'ring') spawnRing(w.n || 6);
    else if (w.kind === 'gun') spawnGun();
    else if (w.kind === 'rock') spawnRock();
    else if (w.kind === 'carrier') spawnCarrier(w.drop);
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function maybeSpawn() {
    const waves = stageInfo().waves;
    while (G.spawnI < waves.length) {
      const w = waves[G.spawnI];
      if (G.cam + VW < w.x) break;
      if ((G.mid || G.boss) && w.kind !== 'mid' && w.kind !== 'boss') break;
      G.spawnI += 1;
      if (w.kind === 'mid' || w.kind === 'boss' || G.cam + VW - w.x < 240) spawnWave(w);
    }
  }

  function enemyShot(x, y, vx, vy, fat) {
    G.eShots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: fat ? 6.4 : 3.2,
      life: fat ? 2.5 : 2.9,
      fat: !!fat
    });
    capArr(G.eShots, 110);
  }

  function aimShot(x, y, spd, spread, fat) {
    const dx = G.px - (x - G.cam);
    const dy = G.py - y;
    const d = hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx) + (spread || 0);
    enemyShot(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, fat);
  }

  function ringShot(x, y, n, spd, off) {
    for (let i = 0; i < n; i++) {
      const a = off + i * (TAU / n);
      enemyShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, false);
    }
  }

  function fireVulcan() {
    if (G.deadT > 0) return;
    const p = G.power;
    const offsets = p >= 3
      ? [0, -11, 11, -22, 22]
      : p >= 2
        ? [0, -10, 10]
        : p >= 1
          ? [-6, 6]
          : [0];
    for (let i = 0; i < offsets.length; i++) {
      G.shots.push({
        type: 'vulcan',
        x: G.px + 16,
        y: G.py + offsets[i],
        vx: 680,
        vy: offsets[i] * 1.6,
        w: 6,
        h: 2.4,
        dmg: 1,
        pierce: 1,
        life: 1.05,
        rgb: i === 0 ? CYN : HOT
      });
    }
    const nOpt = optionCount();
    for (let i = 0; i < nOpt; i++) {
      const o = G.opt[i];
      G.shots.push({
        type: 'vulcan',
        x: o.x + 10,
        y: o.y,
        vx: 660,
        vy: i === 0 ? -18 : 18,
        w: 5,
        h: 2.2,
        dmg: 1,
        pierce: 1,
        life: 1.0,
        rgb: ORG
      });
    }
    G.vulcanCd = isStorm() ? 0.084 : 0.092;
    G.muzzle = 0.07;
    audio.shoot();
    emit(3, {
      x: G.px + 18, y: G.py, j: 2,
      vx0: 90, vx1: 200, vy0: -36, vy1: 36,
      r0: 1, r1: 2.2, life: 0.15, rgb: HOT, g: 0
    });
  }

  function fireBlaze(lv) {
    const scaleH = 1 + G.power * 0.12;
    const h = (lv === 3 ? 58 : lv === 2 ? 30 : 16) * scaleH;
    const dmg = lv === 3 ? 24 : lv === 2 ? 12 : 5;
    const pierce = lv === 3 ? 99 : lv === 2 ? 4 : 2;
    G.shots.push({
      type: 'blaze',
      x: G.px + 26,
      y: G.py,
      vx: 520,
      vy: 0,
      w: 30 + lv * 14,
      h: h,
      dmg: dmg,
      pierce: pierce,
      life: 0.78,
      rgb: lv === 3 ? GOLD : lv === 2 ? HOT : ORG,
      lv: lv,
      hit: {}
    });
    G.muzzle = 0.18;
    audio.blaze(lv);
    hitStop(lv === 3 ? 0.078 : lv === 2 ? 0.055 : 0.042);
    kick(lv === 3 ? 6.2 : lv === 2 ? 3.8 : 2.6);
    screenFlash(lv === 3 ? GOLD : HOT, lv === 3 ? 0.55 : 0.32);
    explode(G.px + 28, G.py, lv === 3 ? GOLD : ORG, 12 + lv * 7);
    if (lv >= 2) floatText(G.px + 46, G.py - 24, lv === 3 ? 'BLAZE' : 'CHARGE', GOLD, lv === 3);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('blaze');
      void stageEl.offsetWidth;
      stageEl.classList.add(lv >= 3 ? 'blaze' : 'charge');
    }
  }

  function releaseCharge() {
    if (G.mode !== 'play' || G.deadT > 0) {
      G.chargeT = 0;
      G.lastLv = 0;
      return;
    }
    const lv = chargeLevel();
    if (lv >= 1) fireBlaze(lv);
    G.chargeT = 0;
    G.lastLv = 0;
    if (chgBar) chgBar.style.transform = 'scaleX(0)';
    if (chgWrap) chgWrap.classList.remove('hot');
  }

  function hurtEnt(e, dmg, hx, hy) {
    if (!e.alive) return;
    e.hp -= dmg;
    bumpCombo();
    const kind = e.type === 'boss' ? 'boss' : e.type === 'mid' ? 'mid' : 'hit';
    audio.hit(kind, G.combo);
    popSpark(hx, hy, e.type === 'boss' || e.type === 'mid' ? GOLD : HOT, e.type === 'boss' ? 12 : 8);
    emit(5, {
      x: hx, y: hy, j: 4,
      vx0: -90, vx1: 90, vy0: -90, vy1: 90,
      r0: 1.2, r1: 2.8, life: 0.22, rgb: PNK, g: 70
    });
    if (e.type === 'boss' || e.type === 'mid') {
      hitStop(0.038);
      kick(2.5);
    } else {
      hitStop(0.032);
    }
    if (e.hp <= 0) killEnt(e, hx, hy);
  }

  function killEnt(e, hx, hy) {
    e.alive = false;
    e.hp = 0;
    let pts = SCORE.scout;
    let rgb = HOT;
    let pow = 16;
    if (e.type === 'diver') { pts = SCORE.diver; rgb = PNK; pow = 16; }
    else if (e.type === 'gun') { pts = SCORE.gun; rgb = MAG; pow = 22; }
    else if (e.type === 'rock') { pts = SCORE.rock; rgb = SUN; pow = 20; }
    else if (e.type === 'carrier') { pts = SCORE.carrier; rgb = GOLD; pow = 22; }
    else if (e.type === 'mid') { pts = SCORE.mid; rgb = GOLD; pow = 36; }
    else if (e.type === 'boss') {
      pts = SCORE.boss[G.stage - 1] || 4000;
      rgb = GOLD;
      pow = 50;
    }
    const n = Math.round(pts * G.mult);
    addScore(n);
    floatText(hx, hy, '+' + n, rgb, e.type === 'boss' || e.type === 'mid' || G.mult >= 3);
    explode(hx, hy, rgb, pow);
    if (e.type === 'carrier' && e.drop) spawnPickup(e.x, e.y, e.drop);
    if (e.type === 'mid') {
      hitStop(0.07);
      kick(6.4);
      screenFlash(GOLD, 0.42);
      G.mid = false;
      spawnPickup(e.x, e.y, 'P');
      toast(e.name + '击破', false, true);
      syncHud();
    } else if (e.type === 'boss') {
      hitStop(0.082);
      kick(7.4);
      screenFlash(GOLD, 0.58);
      for (let k = 0; k < 5; k++) {
        explode(hx + rand(-32, 32), hy + rand(-26, 26), k % 2 ? ORG : GOLD, 26);
      }
      onBossDown();
    } else {
      hitStop(0.042);
      kick(2.4);
    }
    syncHud();
  }

  function onBossDown() {
    addScore(SCORE.clear);
    G.boss = false;
    if (G.stage >= 3) {
      G.winT = 1.4;
    } else {
      toast(stageInfo().name + '肃清', false, true);
      G.stage += 1;
      G.cam = 0;
      G.spawnI = 0;
      G.ents.length = 0;
      G.eShots.length = 0;
      G.shots.length = 0;
      G.invuln = Math.max(G.invuln, 0.85);
      syncHud();
    }
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.chargeT = 0;
    G.fireHold = false;
    G.lastLv = 0;
    breakCombo();
    if (G.power > 0) spawnPickup(G.cam + G.px + 20, G.py, 'P');
    G.power = 0;
    G.spd = Math.max(0, G.spd - 1);
    explode(G.px, G.py, MAG, 38);
    explode(G.px + 8, G.py, ORG, 18);
    audio.death();
    hitStop(0.072);
    kick(7.6);
    screenFlash(MAG, 0.62);
    syncPips();
    syncHud();
  }

  function respawn() {
    G.px = 90;
    G.py = VH * 0.5;
    G.invuln = 1.48;
    G.deadT = 0;
    G.chargeT = 0;
    G.opt[0].x = 70;
    G.opt[0].y = G.py - 18;
    G.opt[1].x = 70;
    G.opt[1].y = G.py + 18;
    if (keys.sht) G.fireHold = true;
    G.eShots.length = 0;
    syncHud();
  }

  function collectPickup(p) {
    if (p.kind === 'S') {
      if (G.spd >= SPD_MAX) addScore(Math.round(400 * G.mult));
      else {
        G.spd += 1;
        toast(G.spd >= SPD_MAX ? '速 MAX' : ('速 ' + G.spd), false, true);
        if (spdLabel) {
          spdLabel.classList.remove('pop');
          void spdLabel.offsetWidth;
          spdLabel.classList.add('pop');
        }
      }
    } else {
      if (G.power >= PWR_MAX) addScore(Math.round(500 * G.mult));
      else {
        G.power += 1;
        toast(G.power >= PWR_MAX ? '火 MAX' : ('火 ' + G.power), false, true);
        if (pwrLabel) {
          pwrLabel.classList.remove('pop');
          void pwrLabel.offsetWidth;
          pwrLabel.classList.add('pop');
        }
      }
    }
    audio.pickup(p.kind);
    popSpark(p.x - G.cam, p.y, p.kind === 'S' ? CYN : GOLD, 16);
    floatText(p.x - G.cam, p.y - 16, p.kind, p.kind === 'S' ? CYN : GOLD, true);
    hitStop(0.034);
    kick(2.2);
    screenFlash(p.kind === 'S' ? CYN : GOLD, 0.18);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '点射连发，按住蓄满再放烈星。分数 ' + G.score + '。');
    setHint('R 重开 · 撞机体或中弹掉命', 'warn');
  }

  function goWin() {
    G.mode = 'win';
    addScore(SCORE.all);
    audio.win();
    showOverlay('win', '烈核尽碎', '三关打穿。分数 ' + G.score + (isStorm() ? ' · 弹幕' : ' · 烈焰') + '。');
    setHint('R 重开 · 烈星核已碎', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pick.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'storm' ? 'storm' : 'raid';
    G.t = 0;
    G.cam = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.nextLife = LIFE_EVERY;
    G.spawnI = 0;
    G.fireHold = false;
    G.chargeT = 0;
    G.vulcanCd = 0;
    G.deadT = 0;
    G.invuln = 1.12;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.mid = false;
    G.boss = false;
    G.winT = 0;
    G.lastLv = 0;
    G.power = 0;
    G.spd = 0;
    G.opt[0].x = 70;
    G.opt[0].y = G.py - 18;
    G.opt[1].x = 70;
    G.opt[1].y = G.py + 18;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isStorm() ? '弹幕' : '烈焰', isStorm(), !isStorm());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.t = 0;
    G.cam = 80;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.stage = 1;
    G.mid = false;
    G.boss = false;
    G.deadT = 0;
    G.chargeT = 0;
    G.power = 0;
    G.spd = 0;
    clearWorld();
    showOverlay('title', '烈星', '横向卷轴。点射连发，按住蓄力放宽幅烈星。吃 P 加火力、S 加速。每关中 Boss 与关底 Boss。');
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.9);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.99;
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
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    const drift = G.mode === 'title' ? 26 : scrollSpd() * 0.2;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= (drift + s.p * 0.42) * dt;
      if (s.x < 0) s.x += VW;
    }
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      d.x -= (drift * 0.45 + d.p * 0.2) * dt;
      if (d.x < -30) d.x += VW + 60;
    }
  }

  function updateMove(dt) {
    let mx = 0;
    let my = 0;
    if (inputSrc === 'ptr' && pointer.down) {
      const dx = pointer.x - G.px;
      const dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      const max = moveSpd() * dt;
      if (d > 2) {
        const k = Math.min(1, max / d) * (d > 18 ? 1 : d / 18);
        mx = dx * k;
        my = dy * k;
      }
    } else {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
      if (mx || my) {
        const n = hypot(mx, my) || 1;
        mx = mx / n * moveSpd() * dt;
        my = my / n * moveSpd() * dt;
      }
    }
    G.px = clamp(G.px + mx, 24, VW * 0.46);
    G.py = clamp(G.py + my, 20, VH - 20);
    const nOpt = optionCount();
    const tx0 = G.px - 22;
    const ty0 = G.py - 20;
    const tx1 = G.px - 22;
    const ty1 = G.py + 20;
    G.opt[0].x = lerp(G.opt[0].x, tx0, clamp(dt * 9, 0, 1));
    G.opt[0].y = lerp(G.opt[0].y, ty0, clamp(dt * 9, 0, 1));
    G.opt[1].x = lerp(G.opt[1].x, tx1, clamp(dt * 9, 0, 1));
    G.opt[1].y = lerp(G.opt[1].y, ty1, clamp(dt * 9, 0, 1));
    if (nOpt === 0) {
      G.opt[0].x = G.px - 10;
      G.opt[0].y = G.py;
      G.opt[1].x = G.px - 10;
      G.opt[1].y = G.py;
    }
  }

  function updateCharge(dt) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    if (G.vulcanCd > 0) G.vulcanCd -= dt;
    if (G.fireHold) {
      const prev = chargeLevel();
      G.chargeT += dt;
      if (G.chargeT > CHG3 + 0.45) G.chargeT = CHG3 + 0.45;
      const lv = chargeLevel();
      if (lv > prev && lv >= 1) {
        audio.chargeTick(lv);
        screenFlash(lv === 3 ? GOLD : HOT, lv === 3 ? 0.3 : 0.14);
        if (lv === 3) {
          kick(3.5);
          popSpark(G.px + 22, G.py, GOLD, 18);
          if (stageEl && !REDUCE) {
            stageEl.classList.remove('charge');
            void stageEl.offsetWidth;
            stageEl.classList.add('charge');
          }
        }
      }
      G.lastLv = lv;
      if (lv === 0 && G.vulcanCd <= 0) fireVulcan();
    }
  }

  function updatePick(dt) {
    for (let i = G.pick.length - 1; i >= 0; i--) {
      const p = G.pick[i];
      p.t += dt;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += Math.sin(p.t * 4.2) * 18 * dt;
      const sxv = p.x - G.cam;
      if (p.life <= 0 || sxv < -40) {
        G.pick.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(sxv - G.px, p.y - G.py) < 18) {
        collectPickup(p);
        G.pick.splice(i, 1);
      }
    }
  }

  function updateEnts(dt) {
    const storm = isStorm();
    const shotMul = storm ? 1.28 : 1;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.form === 'stream') {
        e.x += e.vx * dt;
        e.y = clamp((e.baseY || e.y) + Math.sin(e.t * 3.1 + e.phase) * e.amp, 24, VH - 24);
      } else if (e.form === 'ring') {
        e.cx += e.vx * dt;
        e.ang += dt * 1.7;
        e.x = e.cx + Math.cos(e.ang) * e.ringR;
        e.y = e.cy + Math.sin(e.ang) * e.ringR * 0.62;
      } else if (e.type === 'diver') {
        const tx = G.px + G.cam;
        const dy = G.py - e.y;
        e.vy += clamp(dy * 1.6, -180, 180) * dt;
        e.vy = clamp(e.vy, -160, 160);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.y = clamp(e.y, 16, VH - 16);
      } else if (e.type === 'mid' || e.type === 'boss') {
        const holdX = G.cam + VW - 168;
        if (e.x > holdX) e.x += e.vx * dt;
        else e.x = lerp(e.x, holdX, clamp(dt * 1.8, 0, 1));
        if (e.variant === 'flame') {
          if (e.dash > 0) {
            e.dash -= dt;
            e.x += -220 * dt;
            if (e.dash <= 0) e.dash = -0.8;
          } else if (e.dash < 0) {
            e.dash += dt;
            e.x += 160 * dt;
            if (e.dash >= 0) e.dash = 0;
          } else if (e.t > 1.4 && ((e.t * 0.4) | 0) !== (((e.t - dt) * 0.4) | 0)) {
            e.dash = 0.55;
          }
          e.y = VH * 0.5 + Math.sin(e.t * 1.4) * 70;
        } else {
          const amp = e.type === 'boss' ? 78 : 86;
          e.y = VH * 0.5 + Math.sin(e.t * (e.hp < e.maxHp * 0.5 ? 1.7 : 1.15)) * amp;
        }
        e.y = clamp(e.y, 50, VH - 50);
        e.x = clamp(e.x, G.cam + 120, G.cam + VW - 70);
        e.spin += dt * (e.hp < e.maxHp * 0.5 ? 2.4 : 1.4);
        if (e.bits) {
          for (let b = 0; b < e.bits.length; b++) e.bits[b] += dt * 1.6;
        }
      } else {
        e.x += e.vx * dt;
        e.y += (e.vy || 0) * dt;
        if (e.type === 'gun') e.y = clamp(e.y + Math.sin(e.t * 1.5) * 28 * dt, 40, VH - 40);
        if (e.type === 'rock') {
          e.spin += dt * 1.2;
          e.y = clamp(e.y, 30, VH - 30);
        }
        if (e.type === 'carrier') e.y = clamp(e.y + Math.sin(e.t * 2) * 36 * dt, 40, VH - 40);
      }

      if (e.x - G.cam < -80 && e.type !== 'mid' && e.type !== 'boss') {
        e.alive = false;
        continue;
      }

      if (e.shootCd != null) e.shootCd -= dt;
      if (e.shootCd <= 0 && e.x - G.cam < VW + 10 && e.x - G.cam > 40) {
        const rage = e.hp < e.maxHp * 0.5;
        if (e.type === 'scout' || e.type === 'diver') {
          if (Math.random() < (storm ? 0.55 : 0.38)) aimShot(e.x, e.y, storm ? 210 : 170, 0, false);
          e.shootCd = (rand(1.1, 2.0) / shotMul);
        } else if (e.type === 'gun') {
          aimShot(e.x - 8, e.y, storm ? 200 : 164, -0.18, false);
          aimShot(e.x - 8, e.y, storm ? 200 : 164, 0, false);
          aimShot(e.x - 8, e.y, storm ? 200 : 164, 0.18, false);
          e.shootCd = (rage ? 0.7 : 1.05) / shotMul;
        } else if (e.type === 'rock') {
          if (Math.random() < 0.45) aimShot(e.x, e.y, 140, 0, false);
          e.shootCd = 1.6 / shotMul;
        } else if (e.type === 'carrier') {
          aimShot(e.x, e.y, 150, 0, false);
          e.shootCd = 1.2 / shotMul;
        } else if (e.type === 'mid') {
          if (e.variant === 'rock') {
            const n = rage ? 5 : 3;
            for (let k = 0; k < n; k++) {
              aimShot(e.x - 10, e.y, storm ? 190 : 156, (k - (n - 1) * 0.5) * 0.2, false);
            }
            e.shootCd = (rage ? 0.72 : 1.05) / shotMul;
          } else if (e.variant === 'ring') {
            ringShot(e.x, e.y, rage ? 10 : 8, storm ? 150 : 128, e.spin);
            if (rage) aimShot(e.x, e.y, 180, 0, false);
            e.shootCd = (rage ? 0.78 : 1.12) / shotMul;
          } else {
            aimShot(e.x - 12, e.y, 200, 0, true);
            enemyShot(e.x - 8, e.y - 10, -160, -40, false);
            enemyShot(e.x - 8, e.y + 10, -160, 40, false);
            e.shootCd = (rage ? 0.62 : 0.92) / shotMul;
          }
        } else if (e.type === 'boss') {
          if (e.variant === 'corona') {
            ringShot(e.x, e.y, rage ? 12 : 8, storm ? 148 : 124, e.spin);
            aimShot(e.x - 12, e.y, storm ? 190 : 158, -0.16, false);
            aimShot(e.x - 12, e.y, storm ? 190 : 158, 0.16, false);
            if (rage) aimShot(e.x - 12, e.y, 170, 0, true);
            e.shootCd = (rage ? 0.7 : 1.05) / shotMul;
          } else if (e.variant === 'core') {
            ringShot(e.x, e.y, rage ? 16 : 10, storm ? 140 : 118, e.spin);
            if (e.bits) {
              for (let b = 0; b < e.bits.length; b++) {
                const a = e.bits[b];
                const bx = e.x + Math.cos(a) * 38;
                const by = e.y + Math.sin(a) * 28;
                aimShot(bx, by, 150, 0, false);
              }
            }
            e.shootCd = (rage ? 0.68 : 1.0) / shotMul;
          } else {
            ringShot(e.x, e.y, rage ? 14 : 10, 118, e.spin);
            ringShot(e.x, e.y, 8, 168, e.spin + 0.4);
            aimShot(e.x - 16, e.y, 200, 0, true);
            if (rage) {
              aimShot(e.x - 10, e.y - 18, 180, -0.1, false);
              aimShot(e.x - 10, e.y + 18, 180, 0.1, false);
            }
            e.shootCd = (rage ? 0.58 : 0.88) / shotMul;
          }
        }
      }
    }
  }

  function updateShots(dt) {
    capArr(G.shots, 90);
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 50 || s.y < -30 || s.y > VH + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      let used = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        const ex = e.x - G.cam;
        const ew = e.w * 0.7;
        const eh = e.h * 0.7;
        const hw = s.type === 'blaze' ? s.w * 0.5 : s.w * 0.6;
        const hh = s.type === 'blaze' ? s.h * 0.5 : s.h * 0.8;
        if (Math.abs(s.x - ex) < hw + ew && Math.abs(s.y - e.y) < hh + eh) {
          if (s.type === 'blaze') {
            if (s.hit[e.id]) continue;
            s.hit[e.id] = true;
            hurtEnt(e, s.dmg, ex, e.y);
            emit(4, {
              x: ex, y: e.y, j: 3,
              vx0: -40, vx1: 80, vy0: -50, vy1: 50,
              r0: 1.4, r1: 3.2, life: 0.2, rgb: s.rgb, g: 0
            });
            s.pierce -= 1;
            if (s.pierce <= 0) used = true;
          } else {
            hurtEnt(e, s.dmg, ex, e.y);
            used = true;
          }
          if (used) break;
        }
      }
      if (used) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const sxv = s.x - G.cam;
      if (s.life <= 0 || sxv < -40 || sxv > VW + 40 || s.y < -24 || s.y > VH + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && G.invuln <= 0 && hypot(sxv - G.px, s.y - G.py) < 7.5 + s.r) {
        G.eShots.splice(i, 1);
        diePlayer();
      }
    }
  }

  function collideBodies() {
    if (G.deadT > 0 || G.invuln > 0) return;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const ex = e.x - G.cam;
      const r = Math.max(e.w, e.h) * (e.type === 'boss' || e.type === 'mid' ? 0.42 : 0.58);
      if (hypot(ex - G.px, e.y - G.py) < 7.2 + r) {
        diePlayer();
        return;
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.2);
      return;
    }
    updateFx(dt);
    if (G.mode === 'title') {
      G.cam += 28 * dt;
      G.py = VH * 0.5 + Math.sin(G.t * 1.4) * 10;
      return;
    }
    if (G.mode === 'lose') return;
    if (G.mode === 'win') {
      G.cam += 20 * dt;
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      updateShots(dt);
      updateEnts(dt);
      updatePick(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    G.cam += scrollSpd() * dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnts(dt);
      updateShots(dt);
      updatePick(dt);
      maybeSpawn();
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    updateMove(dt);
    updateCharge(dt);
    if (!REDUCE && ((G.t * 22) | 0) !== (((G.t - dt) * 22) | 0)) {
      emit(1, {
        x: G.px - 12, y: G.py, j: 2.2,
        vx0: -100, vx1: -28, vy0: -16, vy1: 16,
        r0: 1.1, r1: 2.5, life: 0.2, rgb: HOT, g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updatePick(dt);
    collideBodies();
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.chargeT / CHG3, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('hot', chargeLevel() >= 3);
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      c.fillStyle = rgba(WHT, s.a);
      c.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      c.fillStyle = rgba(ORG, d.a);
      c.beginPath();
      c.ellipse(sx(d.x), sy(d.y), d.s * scale, d.s * 0.4 * scale, 0, 0, TAU);
      c.fill();
    }
  }

  function drawPlanet() {
    const c = ctx;
    const st = G.stage;
    const drift = (G.cam * 0.08) % (VW + 200);
    if (st === 1) {
      const px = VW + 40 - drift * 0.45;
      const py = VH + 30;
      const g = c.createRadialGradient(sx(px - 40), sy(py - 80), 10 * scale, sx(px), sy(py), 220 * scale);
      g.addColorStop(0, rgba(SUN, 0.55));
      g.addColorStop(0.45, rgba(ORG, 0.22));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(sx(px), sy(py), 210 * scale, 0, TAU);
      c.fill();
    } else if (st === 2) {
      const px = VW * 0.72 - drift * 0.2;
      const py = VH * 0.28;
      c.fillStyle = rgba([80, 40, 120], 0.35);
      c.beginPath();
      c.arc(sx(px), sy(py), 70 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(MAG, 0.28);
      c.lineWidth = Math.max(1, 4 * scale);
      c.beginPath();
      c.ellipse(sx(px), sy(py), 110 * scale, 18 * scale, -0.25, 0, TAU);
      c.stroke();
    } else {
      const px = VW * 0.82;
      const py = VH * 0.5;
      const pulse = 1 + Math.sin(G.t * 1.6) * 0.04;
      const g = c.createRadialGradient(sx(px), sy(py), 16 * scale, sx(px), sy(py), 160 * scale * pulse);
      g.addColorStop(0, rgba(GOLD, 0.7));
      g.addColorStop(0.35, rgba(HOT, 0.35));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(sx(px), sy(py), 150 * scale * pulse, 0, TAU);
      c.fill();
    }
  }

  function drawDecorRocks() {
    if (G.stage !== 1) return;
    const c = ctx;
    for (let i = 0; i < 9; i++) {
      const wx = ((i * 180 + G.cam * 0.35) % (VW + 160)) - 40;
      const h = hash2(i + 11);
      const y = 28 + h * (VH - 56);
      const r = 6 + hash2(i + 40) * 10;
      c.fillStyle = rgba(DEEP, 0.7);
      c.beginPath();
      c.ellipse(sx(wx), sy(y), r * scale, r * 0.7 * scale, h, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(ORG, 0.25);
      c.lineWidth = Math.max(1, 1.1 * scale);
      c.stroke();
    }
  }

  function drawScout(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(PNK, 0.95);
    c.beginPath();
    c.moveTo(-12 * scale, 0);
    c.lineTo(8 * scale, -7 * scale);
    c.lineTo(3 * scale, 0);
    c.lineTo(8 * scale, 7 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(MAG, 0.95);
    c.fillRect(-2 * scale, -2.2 * scale, 7 * scale, 4.4 * scale);
    c.restore();
  }

  function drawDiver(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(HOT, 0.95);
    c.beginPath();
    c.moveTo(-10 * scale, 0);
    c.lineTo(10 * scale, -6 * scale);
    c.lineTo(6 * scale, 0);
    c.lineTo(10 * scale, 6 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.8);
    c.fillRect(-2 * scale, -1.6 * scale, 8 * scale, 3.2 * scale);
    c.restore();
  }

  function drawGun(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(MAG, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 20 * scale, 11 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.ellipse(-4 * scale, 0, 8 * scale, 5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.8);
    c.fillRect(8 * scale, -2.2 * scale, 10 * scale, 4.4 * scale);
    c.restore();
  }

  function drawRock(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.rotate(e.spin || 0);
    c.fillStyle = rgba([90, 42, 28], 0.95);
    c.beginPath();
    c.moveTo(-14 * scale, -4 * scale);
    c.lineTo(-4 * scale, -14 * scale);
    c.lineTo(12 * scale, -8 * scale);
    c.lineTo(14 * scale, 6 * scale);
    c.lineTo(2 * scale, 14 * scale);
    c.lineTo(-12 * scale, 8 * scale);
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(ORG, 0.55);
    c.lineWidth = Math.max(1, 1.3 * scale);
    c.stroke();
    c.fillStyle = rgba(SUN, 0.45);
    c.beginPath();
    c.arc(-2 * scale, -2 * scale, 3 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawCarrier(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(GOLD, 0.9);
    c.beginPath();
    c.ellipse(0, 0, 18 * scale, 10 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(ORG, 0.95);
    c.fillRect(-6 * scale, -4 * scale, 12 * scale, 8 * scale);
    c.fillStyle = rgba(WHT, 0.9);
    c.font = '700 ' + (9 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(e.drop || 'P', 0, 0.5 * scale);
    c.restore();
  }

  function drawHpBar(e) {
    const c = ctx;
    const pct = clamp(e.hp / e.maxHp, 0, 1);
    const bw = 180;
    const bh = 7;
    const bx = VW * 0.5 - bw * 0.5;
    const by = 14;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(bx - 2), sy(by - 2), (bw + 4) * scale, (bh + 4) * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(sx(bx), sy(by), bw * scale, bh * scale);
    c.fillStyle = rgba(pct < 0.35 ? MAG : GOLD, 0.95);
    c.fillRect(sx(bx), sy(by), bw * pct * scale, bh * scale);
    c.font = '700 ' + (10 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    c.fillStyle = rgba(WHT, 0.88);
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(e.name, sx(VW * 0.5), sy(by - 3));
  }

  function drawMid(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    if (e.variant === 'rock') {
      c.fillStyle = rgba([110, 48, 28], 0.96);
      c.beginPath();
      c.ellipse(0, 0, 34 * scale, 26 * scale, 0.1, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ORG, 0.85);
      c.beginPath();
      c.moveTo(-8 * scale, -6 * scale);
      c.lineTo(-36 * scale, -22 * scale);
      c.lineTo(-18 * scale, 2 * scale);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(-8 * scale, 6 * scale);
      c.lineTo(-36 * scale, 22 * scale);
      c.lineTo(-18 * scale, -2 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(GOLD, 0.8);
      c.beginPath();
      c.arc(-6 * scale, 0, 8 * scale, 0, TAU);
      c.fill();
    } else if (e.variant === 'ring') {
      c.strokeStyle = rgba(MAG, 0.9);
      c.lineWidth = Math.max(2, 3 * scale);
      c.beginPath();
      c.ellipse(0, 0, 32 * scale, 24 * scale, e.spin, 0, TAU);
      c.stroke();
      for (let i = 0; i < 4; i++) {
        const a = e.spin + i * (TAU / 4);
        c.fillStyle = rgba(HOT, 0.95);
        c.beginPath();
        c.arc(Math.cos(a) * 30 * scale, Math.sin(a) * 22 * scale, 6 * scale, 0, TAU);
        c.fill();
      }
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(0, 0, 10 * scale, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = rgba(ORG, 0.95);
      c.beginPath();
      c.moveTo(22 * scale, 0);
      c.lineTo(-18 * scale, -16 * scale);
      c.lineTo(-10 * scale, 0);
      c.lineTo(-18 * scale, 16 * scale);
      c.closePath();
      c.fill();
      const fl = 10 + Math.sin(e.t * 18) * 6;
      c.fillStyle = rgba(GOLD, 0.8);
      c.beginPath();
      c.moveTo(22 * scale, -3 * scale);
      c.lineTo((22 + fl) * scale, 0);
      c.lineTo(22 * scale, 3 * scale);
      c.closePath();
      c.fill();
    }
    c.restore();
    drawHpBar(e);
  }

  function drawBoss(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    if (e.variant === 'corona') {
      const beat = 1 + Math.sin(e.t * 5) * 0.06;
      c.fillStyle = rgba(HOT, 0.55);
      c.beginPath();
      c.arc(0, 0, 52 * scale * beat, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(0, 0, 28 * scale * beat, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ORG, 0.95);
      c.beginPath();
      c.arc(0, 0, 14 * scale, 0, TAU);
      c.fill();
      for (let i = 0; i < 8; i++) {
        const a = e.spin + i * (TAU / 8);
        c.strokeStyle = rgba(GOLD, 0.7);
        c.lineWidth = Math.max(1, 2 * scale);
        c.beginPath();
        c.moveTo(Math.cos(a) * 28 * scale, Math.sin(a) * 28 * scale);
        c.lineTo(Math.cos(a) * 46 * scale, Math.sin(a) * 46 * scale);
        c.stroke();
      }
    } else if (e.variant === 'core') {
      c.fillStyle = rgba(MAG, 0.9);
      c.beginPath();
      c.moveTo(0, -36 * scale);
      c.lineTo(32 * scale, 0);
      c.lineTo(0, 36 * scale);
      c.lineTo(-32 * scale, 0);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(GOLD, 0.92);
      c.beginPath();
      c.moveTo(0, -16 * scale);
      c.lineTo(14 * scale, 0);
      c.lineTo(0, 16 * scale);
      c.lineTo(-14 * scale, 0);
      c.closePath();
      c.fill();
      if (e.bits) {
        for (let i = 0; i < e.bits.length; i++) {
          const a = e.bits[i];
          c.fillStyle = rgba(HOT, 0.95);
          c.beginPath();
          c.arc(Math.cos(a) * 38 * scale, Math.sin(a) * 28 * scale, 7 * scale, 0, TAU);
          c.fill();
        }
      }
    } else {
      const beat = 1 + Math.sin(e.t * 4.2) * 0.07;
      function star(r) {
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = -Math.PI / 2 + i * (TAU / 8);
          const rr = (i % 2 === 0 ? r : r * 0.46) * beat;
          const fn = i === 0 ? c.moveTo : c.lineTo;
          fn.call(c, Math.cos(a) * rr * scale, Math.sin(a) * rr * scale);
        }
        c.closePath();
      }
      c.fillStyle = rgba(ORG, 0.88);
      star(54);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      star(28);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(0, 0, 9 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
    drawHpBar(e);
  }

  function drawStarShape(c, x, y, r, n, inner) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n;
      const rr = i % 2 === 0 ? r : r * inner;
      if (i === 0) c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      else c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0) return;
    const c = ctx;
    const nOpt = optionCount();
    for (let i = 0; i < nOpt; i++) {
      const o = G.opt[i];
      c.save();
      c.translate(sx(o.x), sy(o.y));
      c.fillStyle = rgba(ORG, 0.92);
      c.beginPath();
      c.moveTo(8 * scale, 0);
      c.lineTo(-6 * scale, -5 * scale);
      c.lineTo(-4 * scale, 0);
      c.lineTo(-6 * scale, 5 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(GOLD, 0.8);
      c.fillRect(-1 * scale, -1.4 * scale, 6 * scale, 2.8 * scale);
      c.restore();
    }
    c.save();
    c.translate(sx(G.px), sy(G.py));
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle * 9);
      c.fillRect(12 * scale, -2.4 * scale, 12 * scale, 4.8 * scale);
    }
    c.fillStyle = rgba(HOT, 0.96);
    c.beginPath();
    c.moveTo(18 * scale, 0);
    c.lineTo(-4 * scale, -9 * scale);
    c.lineTo(-14 * scale, -3.4 * scale);
    c.lineTo(-14 * scale, 3.4 * scale);
    c.lineTo(-4 * scale, 9 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.92);
    c.beginPath();
    c.moveTo(10 * scale, 0);
    c.lineTo(-1 * scale, -3.6 * scale);
    c.lineTo(-1 * scale, 3.6 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(-14 * scale, -2.4 * scale, 8 * scale, 4.8 * scale);
    const thr = 0.6 + Math.sin(G.t * 28) * 0.4;
    c.fillStyle = rgba(ORG, 0.55 + thr * 0.4);
    c.beginPath();
    c.moveTo(-14 * scale, -2.6 * scale);
    c.lineTo((-22 - thr * 10) * scale, 0);
    c.lineTo(-14 * scale, 2.6 * scale);
    c.closePath();
    c.fill();
    const lv = chargeLevel();
    if (G.fireHold && G.chargeT >= TAP) {
      const rad = 4 + lv * 5.4 + Math.sin(G.t * 14) * 1.3;
      c.fillStyle = rgba(lv >= 3 ? GOLD : lv >= 2 ? HOT : ORG, 0.58);
      drawStarShape(c, 18 * scale, 0, rad * scale, 4, 0.45);
      c.fill();
      c.strokeStyle = rgba(WHT, 0.75);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.beginPath();
      c.arc(18 * scale, 0, (rad + 3) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.type === 'blaze') {
        const a = clamp(s.life / 0.78, 0, 1);
        c.fillStyle = rgba(s.rgb, 0.28 * a);
        c.fillRect(sx(s.x - s.w * 0.15), sy(s.y - s.h * 0.72), s.w * 1.35 * scale, s.h * 1.44 * scale);
        c.save();
        c.translate(sx(s.x), sy(s.y));
        c.scale(1, s.h / 22);
        c.fillStyle = rgba(s.rgb, 0.9 * a);
        drawStarShape(c, 0, 0, Math.max(14, s.w * 0.55) * scale, 4, 0.38);
        c.fill();
        c.fillStyle = rgba(WHT, 0.85 * a);
        drawStarShape(c, 0, 0, Math.max(7, s.w * 0.22) * scale, 4, 0.42);
        c.fill();
        c.restore();
        if (!REDUCE) {
          for (let k = 0; k < 3; k++) {
            const oy2 = Math.sin(G.t * 22 + k + s.x * 0.04) * s.h * 0.32;
            c.fillStyle = rgba(WHT, 0.32 * a);
            c.fillRect(sx(s.x - s.w * 0.4), sy(s.y + oy2), s.w * 0.8 * scale, 1.5 * scale);
          }
        }
      } else {
        c.fillStyle = rgba(s.rgb || CYN, 0.95);
        c.fillRect(sx(s.x - s.w * 0.5), sy(s.y - s.h * 0.5), s.w * scale, Math.max(2, s.h * scale));
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.fat ? GOLD : PNK, 0.95);
      c.beginPath();
      c.arc(sx(s.x - G.cam), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      if (s.fat) {
        c.fillStyle = rgba(ORG, 0.7);
        c.beginPath();
        c.arc(sx(s.x - G.cam), sy(s.y), s.r * 0.42 * scale, 0, TAU);
        c.fill();
      }
    }
  }

  function drawPick() {
    const c = ctx;
    for (let i = 0; i < G.pick.length; i++) {
      const p = G.pick[i];
      const x = p.x - G.cam;
      const bob = Math.sin(p.t * 6) * 2;
      c.save();
      c.translate(sx(x), sy(p.y + bob));
      c.rotate(p.t * 1.4);
      c.fillStyle = rgba(p.kind === 'S' ? CYN : GOLD, 0.92);
      c.beginPath();
      c.moveTo(0, -11 * scale);
      c.lineTo(11 * scale, 0);
      c.lineTo(0, 11 * scale);
      c.lineTo(-11 * scale, 0);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.92);
      c.font = '700 ' + (10 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.rotate(-p.t * 1.4);
      c.fillText(p.kind, 0, 0.6 * scale);
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.fillRect(sx(p.x - p.r * 0.5), sy(p.y - p.r * 0.5), p.r * scale, p.r * scale);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      c.fillStyle = rgba(s.rgb, 1 - t);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * (0.4 + t) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, 1 - t);
      c.lineWidth = Math.max(1, 2 * scale * (1 - t));
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + t * 28) * scale, 0, TAU);
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

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#120806';
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

    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#140814');
      g.addColorStop(1, '#0c0612');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#1a0a06');
      g.addColorStop(1, '#120604');
    } else {
      g.addColorStop(0, '#1a0c08');
      g.addColorStop(1, '#120806');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawPlanet();
    drawStars();
    drawDecorRocks();

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = e.x - G.cam;
      if (e.type !== 'boss' && e.type !== 'mid' && (x < -50 || x > VW + 50)) continue;
      if (e.type === 'scout') drawScout(e);
      else if (e.type === 'diver') drawDiver(e);
      else if (e.type === 'gun') drawGun(e);
      else if (e.type === 'rock') drawRock(e);
      else if (e.type === 'carrier') drawCarrier(e);
      else if (e.type === 'mid') drawMid(e);
      else if (e.type === 'boss') drawBoss(e);
    }

    drawPick();
    drawShip();
    drawShots();
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
    if (space) keys.sht = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter')) {
      e.preventDefault();
    }
    if (!down) {
      if (space && G.fireHold) {
        G.fireHold = false;
        releaseCharge();
      }
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'storm' : 'raid');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play' && space) {
        if (!G.fireHold) G.fireHold = true;
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      if (G.mode === 'play' && !G.fireHold) G.fireHold = true;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (G.fireHold && inputSrc === 'ptr') {
        G.fireHold = false;
        releaseCharge();
      }
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

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'raid');
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
      keys.sht = false;
      if (G.fireHold) {
        G.fireHold = false;
        releaseCharge();
      }
    }
  });

  requestAnimationFrame(frame);
})();
