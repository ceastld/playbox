'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.6;
  const SHOT_V = 760;
  const BOMB_CAP = 6;
  const BEAD_NEED = 8;
  const BEST_KEY = 'playbox-jigoku-meguri-best';
  const MUTE_KEY = 'playbox-jigoku-meguri-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 狱轮 · R 重开 · M 静音';
  const LEAD = '纵飞三层狱。空格连射，Shift 放狱轮吸弹。击破留狱印，轮碾印会连环炸。短关之后是阎罗。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const FIRE = [255, 46, 20];
  const AMB = [255, 122, 34];
  const GOLD = [255, 210, 74];
  const CYN = [46, 232, 255];
  const MAG = [255, 61, 184];
  const WHT = [255, 240, 232];
  const PNK = [255, 154, 180];
  const DEEP = [28, 8, 6];
  const INK = [16, 4, 4];
  const BLOOD = [160, 18, 28];

  const BOSS_NAME = ['血王', '刀王', '阎罗'];
  const SCORE = {
    oni: 50,
    dive: 80,
    drop: 90,
    turret: 150,
    elite: 240,
    carrier: 280,
    bead: 30,
    bomb: 500,
    eat: 10,
    seal: 80,
    boss: 9000,
    stage: 1600
  };

  const STAGES = [
    {
      name: '血池',
      waves: [
        { t: 0.6, kind: 'v', n: 5 },
        { t: 2.6, kind: 'stream', dir: 1 },
        { t: 4.6, kind: 'drop', n: 4 },
        { t: 6.6, kind: 'v', n: 7 },
        { t: 8.6, kind: 'turrets' },
        { t: 10.8, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'elite' },
        { t: 15.0, kind: 'v', n: 7 },
        { t: 17.2, kind: 'carrier' },
        { t: 19.2, kind: 'boss' }
      ]
    },
    {
      name: '刀山',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'dive', n: 5 },
        { t: 4.2, kind: 'turrets' },
        { t: 6.0, kind: 'stream', dir: -1 },
        { t: 7.8, kind: 'elite' },
        { t: 9.6, kind: 'drop', n: 5 },
        { t: 11.4, kind: 'carrier' },
        { t: 13.2, kind: 'v', n: 9 },
        { t: 15.2, kind: 'dive', n: 6 },
        { t: 17.2, kind: 'elite' },
        { t: 19.2, kind: 'boss' }
      ]
    },
    {
      name: '火海',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.0, kind: 'stream', dir: 1 },
        { t: 3.8, kind: 'elite' },
        { t: 5.6, kind: 'turrets' },
        { t: 7.2, kind: 'carrier' },
        { t: 9.0, kind: 'v', n: 9 },
        { t: 10.8, kind: 'drop', n: 5 },
        { t: 12.6, kind: 'dive', n: 6 },
        { t: 14.4, kind: 'elite' },
        { t: 16.2, kind: 'stream', dir: -1 },
        { t: 18.2, kind: 'boss' }
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
  const btnTour = document.getElementById('btn-tour');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const beadBar = document.getElementById('bead-bar');
  const beadWrap = document.getElementById('bead-wrap');
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
  let bombTok = 0;
  let uidSeq = 1;
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH * 0.86, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];
  const trails = [];
  const seals = [];

  const G = {
    mode: 'title',
    kind: 'tour',
    t: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    bombs: 3,
    beads: 0,
    enemies: [],
    shots: [],
    bullets: [],
    drops: [],
    ship: { x: VW * 0.5, y: 642, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: FIRE,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    wheel: { on: false, x: 0, y: 0, r: 28, t: 0, spin: 0, tick: 0 }
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
  function isCore() {
    return G.kind === 'core';
  }
  function dens() {
    return isCore() ? 1.26 : 1;
  }
  function shipSpeed() {
    return isCore() ? 318 : 276;
  }
  function fireRate() {
    return isCore() ? 0.076 : 0.09;
  }
  function bulletSpd() {
    return isCore() ? 186 : 146;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isCore() ? 124 : 88;
  }
  function hpMul() {
    return isCore() ? 1.22 : 1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor((Math.max(1, G.combo) - 1) / 3));
  }
  function bossHp() {
    const base = G.stage === 1 ? 108 : G.stage === 2 ? 146 : 214;
    return isCore() ? Math.round(base * 1.22) : base;
  }
  function bossR() {
    return G.stage === 1 ? 42 : G.stage === 2 ? 48 : 56;
  }
  function shotSpread() {
    if (G.combo >= 9) return 5;
    if (G.combo >= 3) return 3;
    return 2;
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
      const n = shotSpread();
      const f = n >= 5 ? 880 : n >= 3 ? 760 : 680;
      this.beep(f, 0.038, 'square', 0.024, f * 1.65);
      this.beep(220, 0.03, 'sawtooth', 0.012, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, 0.028, 1500);
      this.beep(680 * lift, 0.055, 'square', 0.034, 1040 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.03, 1176);
    },
    explode() {
      this.ensure();
      this.noise(0.11, 0.05, 480);
      this.beep(260, 0.15, 'sawtooth', 0.046, 62);
    },
    bomb() {
      this.ensure();
      this.noise(0.22, 0.07, 220);
      this.beep(180, 0.28, 'sawtooth', 0.055, 48);
      this.beep(420, 0.2, 'triangle', 0.04, 180);
      this.beep(880, 0.16, 'sine', 0.04, 1320);
    },
    eat() {
      this.ensure();
      this.beep(990, 0.04, 'sine', 0.022, 1480);
    },
    seal() {
      this.ensure();
      this.beep(520, 0.07, 'square', 0.036, 780);
      this.beep(1040, 0.1, 'triangle', 0.03, 1560);
    },
    pickup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 990);
      this.beep(1320, 0.14, 'sine', 0.035, 1760);
    },
    empty() {
      this.ensure();
      this.beep(160, 0.08, 'square', 0.03, 90);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.055, 'sawtooth', 0.036, 170);
      this.beep(580, 0.07, 'square', 0.028, 860);
    },
    bossDie() {
      this.ensure();
      this.noise(0.24, 0.06, 260);
      this.beep(170, 0.3, 'sawtooth', 0.05, 48);
      this.beep(480, 0.22, 'triangle', 0.04, 200);
      this.beep(980, 0.32, 'sine', 0.04, 1480);
    },
    death() {
      this.ensure();
      this.noise(0.13, 0.05, 380);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(349, 0.09, 'sine', 0.04, 440);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(698, 0.2, 'triangle', 0.045, 1046);
    },
    extra() {
      this.ensure();
      this.beep(698, 0.1, 'square', 0.04, 880);
      this.beep(1046, 0.16, 'sine', 0.04, 1396);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 80);
      this.beep(130, 0.3, 'sine', 0.05, 44);
    },
    win() {
      this.ensure();
      this.beep(440, 0.1, 'square', 0.045, 554);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1174);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
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
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.next1up && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.next1up += LIFE_EVERY;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.055);
      kick(3.2, 'wheel');
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.046);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1150);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = LIFE_CAP;
    while (pips.length < n) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '血池';
      else if (hasBoss()) stageLabel.textContent = BOSS_NAME[clamp(G.stage - 1, 0, 2)];
      else stageLabel.textContent = STAGES[clamp(G.stage - 1, 0, 2)].name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '狱核' : '狱巡';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isCore());
      tagLabel.classList.toggle('hot', G.mode === 'win');
    }
    if (bombLabel) {
      bombLabel.textContent = '轮 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (beadBar) {
      const p = clamp(G.beads / BEAD_NEED, 0, 1);
      beadBar.style.transform = 'scaleX(' + p + ')';
    }
    if (beadWrap) beadWrap.classList.toggle('hot', G.beads >= BEAD_NEED - 1 && G.bombs < BOMB_CAP);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    const spinning = G.wheel.on;
    if (btnBomb) {
      btnBomb.classList.toggle('on', spinning);
      btnBomb.setAttribute('aria-pressed', spinning ? 'true' : 'false');
    }
    if (btnPad) btnPad.classList.toggle('on', spinning);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 狱轮吸弹，碾印连环', 'warn');
    else if (G.mode === 'win') setHint('阎罗已碎 · R 再巡', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 狱轮清弹', 'warn');
    else if (G.bombs <= 0) setHint('狱轮用尽 · 吃魂珠再补', 'warn');
    else if (G.combo >= 9) setHint('五发散开 · 狱轮碾印', 'hot');
    else setHint('空格连射 · Shift 狱轮吸弹 · 碾印连环', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'JGMG';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('wheel');
    stageEl.classList.remove('boss');
    void stageEl.offsetWidth;
    stageEl.classList.add(name);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 80,
        life: rand(0.22, 0.5),
        r: rand(1.2, 2.8),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      t: 0,
      life: gold ? 0.9 : 0.65,
      vy: gold ? -70 : -48,
      text: text,
      rgb: rgb,
      gold: !!gold
    });
    capArr(floats, 18);
  }

  function explode(x, y, rgb, power) {
    const p = power || 16;
    burst(x, y, rgb, Math.min(28, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 80; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.12, 0.55),
        z: rand(0.35, 1.2)
      });
    }
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      uid: uidSeq++,
      alive: true,
      kind: spec.kind || 'oni',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 96 * dens() : spec.vy,
      hp: bossish ? spec.hp : hp,
      maxHp: bossish ? spec.hp : hp,
      r: spec.r || 11,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 42 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.oni,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: !!spec.ground,
      side: spec.side || 0
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.4,
      life: 8
    });
    capArr(G.bullets, 260);
  }

  function aimedFire(e, n, spread, spd) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.3);
    }
  }

  function ringFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.4);
    }
  }

  function spawnOni(x, y, vx, vy) {
    spawnEnemy({
      kind: 'oni',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 100 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 36,
      score: SCORE.oni,
      fireCd: rand(0.6, 1.4)
    });
  }

  function spawnV(n, cx) {
    const extra = isCore() ? 2 : 0;
    const c = cx == null ? VW * 0.5 : cx;
    const tot = n + extra;
    for (let i = 0; i < tot; i++) {
      const k = i - (tot - 1) * 0.5;
      spawnOni(c + k * 34, -26 - Math.abs(k) * 16, 0, 102 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 72 : 72;
    const extra = isCore() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'oni',
        x: side,
        y: -20 - i * 22,
        vx: dir * 36,
        vy: 90 * dens(),
        hp: 2,
        r: 11,
        amp: 52,
        phase: i * 0.5,
        score: SCORE.oni,
        fireCd: 0.7 + i * 0.1
      });
    }
  }

  function spawnDive(n) {
    const extra = isCore() ? 1 : 0;
    for (let i = 0; i < n + extra; i++) {
      spawnEnemy({
        kind: 'dive',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vy: 44,
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: 0.55 + i * 0.08
      });
    }
  }

  function spawnTurrets() {
    const n = isCore() ? 6 : 4;
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0;
      spawnEnemy({
        kind: 'turret',
        x: left ? 28 : VW - 28,
        y: -22 - i * 48,
        vx: 0,
        vy: 52 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.turret,
        fireCd: 0.45 + i * 0.1,
        ground: true,
        side: left ? -1 : 1
      });
    }
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: VW * 0.32,
      y: -36,
      vy: 64 * dens(),
      hp: 10,
      r: 18,
      amp: 70,
      score: SCORE.elite,
      fireCd: 0.5
    });
    if (isCore()) {
      spawnEnemy({
        kind: 'elite',
        x: VW * 0.68,
        y: -58,
        vy: 58 * dens(),
        hp: 10,
        r: 18,
        amp: 56,
        phase: 1.4,
        score: SCORE.elite,
        fireCd: 0.7
      });
    }
  }

  function spawnCarrier() {
    spawnEnemy({
      kind: 'carrier',
      x: VW * 0.5,
      y: -40,
      vy: 50 * dens(),
      hp: 8,
      r: 18,
      amp: 54,
      score: SCORE.carrier,
      fireCd: 0.7
    });
  }

  function spawnDropWave(n) {
    const extra = isCore() ? 2 : 0;
    for (let i = 0; i < n + extra; i++) {
      spawnEnemy({
        kind: 'drop',
        x: 70 + Math.random() * (VW - 140),
        y: -22 - i * 16,
        vx: rand(-18, 18),
        vy: 78 * dens(),
        hp: 3,
        r: 12,
        score: SCORE.drop,
        fireCd: 99
      });
    }
  }

  function spawnBoss() {
    spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -90,
      vy: 0,
      hp: bossHp(),
      r: bossR(),
      score: SCORE.boss,
      fireCd: 1.1,
      enter: 1.4,
      amp: 78
    });
    toast(BOSS_NAME[clamp(G.stage - 1, 0, 2)], true, false);
    audio.wave();
    kick(3.6, 'boss');
    syncHud();
  }

  function spawnBead(x, y) {
    G.drops.push({
      kind: 'bead',
      x: x,
      y: y,
      vx: rand(-40, 40),
      vy: rand(-30, 20),
      t: 0,
      life: 9
    });
    capArr(G.drops, 28);
  }

  function spawnBombDrop(x, y) {
    G.drops.push({
      kind: 'bomb',
      x: x,
      y: y,
      vx: rand(-20, 20),
      vy: rand(-16, 10),
      t: 0,
      life: 11
    });
    capArr(G.drops, 28);
  }

  function spawnSeal(x, y) {
    seals.push({
      x: x,
      y: y,
      t: 0,
      life: 2.15,
      spin: rand(0, TAU),
      r: 16
    });
    capArr(seals, 18);
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n || 4);
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'elite') spawnElite();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'drop') spawnDropWave(w.n || 4);
    else if (w.kind === 'boss') spawnBoss();
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function hasBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'boss') return true;
    }
    return false;
  }

  function fireInterval(e) {
    const d = isCore() ? 0.74 : 1;
    if (e.kind === 'oni') return 1.65 * d;
    if (e.kind === 'dive') return 1.35 * d;
    if (e.kind === 'turret') return 0.9 * d;
    if (e.kind === 'elite') return 0.8 * d;
    if (e.kind === 'carrier') return 1.05 * d;
    if (e.kind === 'boss') return 0.52 * d;
    return 1.25 * d;
  }

  function detonateSeal(s, idx) {
    explode(s.x, s.y, GOLD, 18);
    audio.seal();
    hitStop(0.04);
    kick(2.4, 'wheel');
    addScore(Math.round(SCORE.seal * G.mult));
    bumpCombo();
    floatText(s.x, s.y - 10, '印', GOLD, true);
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      const dx = b.x - s.x;
      const dy = b.y - s.y;
      if (dx * dx + dy * dy < 52 * 52) {
        burst(b.x, b.y, CYN, 3, 50);
        G.bullets.splice(i, 1);
      }
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = e.x - s.x;
      const dy = e.y - s.y;
      const rr = 54 + e.r;
      if (dx * dx + dy * dy < rr * rr) {
        damageEnemy(e, e.kind === 'boss' ? 3 : 4, 'seal');
      }
    }
    seals.splice(idx, 1);
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : FIRE;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 36 : 14 + e.r);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(7.2, 'boss');
      screenFlash(GOLD, 0.55);
      floatText(e.x, e.y, '碎!', GOLD, true);
      addScore(Math.round(e.score * G.mult));
      addScore(3500 + 1500 * G.stage);
      bumpCombo();
      for (let i = 0; i < 6; i++) spawnBead(e.x + rand(-18, 18), e.y + rand(-12, 12));
      if (G.stage >= 3) G.winT = 1.4;
      return;
    }
    audio.explode();
    addScore(Math.round(e.score * G.mult));
    bumpCombo();
    spawnSeal(e.x, e.y);
    spawnBead(e.x, e.y);
    if (e.kind === 'elite') spawnBead(e.x + 8, e.y - 6);
    if (e.kind === 'carrier') spawnBombDrop(e.x, e.y);
    if (e.kind === 'drop') aimedFire(e, 3, 0.28, bulletSpd() * 0.9);
  }

  function damageEnemy(e, dmg, how) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (how === 'shot') {
      audio.hit(G.combo);
      if (G.stop < 0.012) hitStop(0.034);
      kick(1.6, 'hit');
    } else if (how === 'wheel') {
      if (e.kind === 'boss') audio.bossHit();
    } else if (e.kind === 'boss' && how !== 'seal') {
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e);
    else if (e.kind === 'boss') spark(e.x, e.y, GOLD);
  }

  function grantBomb(x, y, fromBead) {
    if (G.bombs < BOMB_CAP) {
      G.bombs += 1;
      audio.pickup();
      hitStop(0.04);
      kick(2.4, 'wheel');
      screenFlash(GOLD, 0.22);
      floatText(x, y - 10, '狱轮', GOLD, true);
      toast('狱轮 +1', false, true);
      if (bombLabel) {
        bombLabel.classList.remove('hot');
        void bombLabel.offsetWidth;
        bombLabel.classList.add('hot');
      }
      bombTok += 1;
    } else {
      addScore(SCORE.bomb * G.mult);
      audio.pickup();
      floatText(x, y - 10, '+' + (SCORE.bomb * G.mult), GOLD, true);
      toast('满轮', false, true);
    }
    if (fromBead) G.beads = 0;
    syncHud();
  }

  function pickBead(x, y) {
    addScore(SCORE.bead * G.mult);
    G.beads += 1;
    audio.pickup();
    burst(x, y, GOLD, 7, 70);
    if (G.beads >= BEAD_NEED) {
      grantBomb(x, y, true);
    } else {
      floatText(x, y - 8, '魂', GOLD, false);
      syncHud();
    }
  }

  function tryBomb() {
    if (G.mode !== 'play' || overlayOpen() || G.deadT > 0) return;
    if (G.wheel.on) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('狱轮用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.wheel.on = true;
    G.wheel.x = G.ship.x;
    G.wheel.y = G.ship.y - 8;
    G.wheel.r = 28;
    G.wheel.t = 0;
    G.wheel.spin = 0;
    G.wheel.tick = 0;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    hitStop(0.072);
    kick(6.4, 'wheel');
    screenFlash(GOLD, 0.52);
    ring(G.wheel.x, G.wheel.y, GOLD);
    ring(G.wheel.x, G.wheel.y, FIRE);
    burst(G.wheel.x, G.wheel.y, GOLD, 22, 220);
    burst(G.wheel.x, G.wheel.y, CYN, 12, 160);
    floatText(G.wheel.x, G.wheel.y - 28, '狱轮', GOLD, true);
    toast('狱轮', false, true);
    syncHud();
  }

  function diePlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.wheel.on = false;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 26);
    audio.death();
    hitStop(0.072);
    kick(7.4, 'die');
    screenFlash(MAG, 0.5);
    G.bullets.length = 0;
    if (G.bombs > 0) {
      spawnBombDrop(G.ship.x + 10, G.ship.y - 12);
      G.bombs = Math.max(0, G.bombs - 1);
    }
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '机毁了', '火灭了。狱轮吸弹，碾印连环炸。分数 ' + G.score + '。R 重开。');
    syncHud();
  }

  function finishWin() {
    const bonus = isCore() ? 10000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    const title = isCore() ? '狱核通关' : '阎罗已碎';
    const lead = isCore()
      ? '三层狱核打穿了。轮还热着。R 再来，或换模式。'
      : '血池到火海，阎罗打穿了。R 再巡，或换狱核。';
    showOverlay('win', title, lead);
    syncHud();
  }

  function nextStage() {
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    addScore(SCORE.stage * G.mult);
    if (G.bombs < BOMB_CAP) G.bombs += 1;
    const st = STAGES[G.stage - 1];
    toast(st ? st.name : '下一关', false, true);
    audio.wave();
    kick(2.8, 'wheel');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.drops.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    seals.length = 0;
    G.wheel.on = false;
  }

  function pushShot(x, y, vx, vy, r, dmg, rgb) {
    G.shots.push({ x: x, y: y, vx: vx, vy: vy, r: r, dmg: dmg, rgb: rgb, life: 1.35 });
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.06;
    const n = shotSpread();
    const s = SHOT_V;
    const spread = n === 5 ? 0.16 : n === 3 ? 0.12 : 0.055;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.5 + (i - (n - 1) * 0.5) * spread;
      const thick = i === (n - 1) * 0.5 ? 4.2 : 3.4;
      pushShot(G.ship.x + Math.cos(a) * 6, G.ship.y - 12, Math.cos(a) * s, Math.sin(a) * s, thick, 1, i % 2 ? GOLD : CYN);
    }
    capArr(G.shots, 140);
    audio.shoot();
  }

  function wantFire() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return false;
    return keys.sht || pointer.down;
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (wantFire()) fireShot();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (!REDUCE) {
        trails.push({ x: s.x, y: s.y, t: 0, rgb: s.rgb, r: s.r * 0.7 });
        capArr(trails, 90);
      }
      if (s.life <= 0 || s.y < -28 || s.y > VH + 28 || s.x < -28 || s.x > VW + 28) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const rr = e.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, s.dmg, 'shot');
          burst(s.x, s.y, s.rgb, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateWheel(dt) {
    const w = G.wheel;
    if (!w.on) return;
    w.t += dt;
    w.spin += dt * 7.5;
    const grow = clamp(w.t / 0.26, 0, 1);
    w.r = lerp(28, 208, grow);
    if (w.t > 0.74) {
      w.on = false;
      syncHud();
      return;
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      const dx = w.x - b.x;
      const dy = w.y - b.y;
      const dist = hypot(dx, dy);
      if (dist < w.r + 46 && dist > 1) {
        const pull = 420;
        b.vx = lerp(b.vx, (dx / dist) * pull, 1 - Math.exp(-dt * 7));
        b.vy = lerp(b.vy, (dy / dist) * pull, 1 - Math.exp(-dt * 7));
      }
      if (dist < w.r * 0.82) {
        burst(b.x, b.y, CYN, 4, 55);
        addScore(SCORE.eat);
        audio.eat();
        G.bullets.splice(i, 1);
      }
    }
    w.tick -= dt;
    if (w.tick <= 0) {
      w.tick = 0.1;
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (!e.alive) continue;
        const dx = e.x - w.x;
        const dy = e.y - w.y;
        const rr = w.r + e.r * 0.6;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, e.kind === 'boss' ? 3 : 2, 'wheel');
        }
      }
    }
    for (let i = seals.length - 1; i >= 0; i--) {
      const s = seals[i];
      if (!s) continue;
      const dx = s.x - w.x;
      const dy = s.y - w.y;
      if (dx * dx + dy * dy < (w.r + 8) * (w.r + 8)) detonateSeal(s, i);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      if (!b) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 22 || b.y < -32 || b.x < -22 || b.x > VW + 22) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - G.ship.y;
        const rr = HIT_R + b.r * 0.55;
        if (dx * dx + dy * dy < rr * rr) {
          diePlayer();
          break;
        }
      }
    }
  }

  function updateDrops(dt) {
    const play = G.mode === 'play' && G.deadT <= 0;
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.t += dt;
      d.life -= dt;
      if (play) {
        const dx = G.ship.x - d.x;
        const dy = G.ship.y - d.y;
        const dist = hypot(dx, dy);
        const magR = G.combo >= 4 || d.kind === 'bomb' ? 110 : 64;
        if (dist < magR && dist > 1) {
          const k = d.kind === 'bomb' ? 240 : 280;
          d.vx = lerp(d.vx, (dx / dist) * k, 1 - Math.exp(-dt * 6));
          d.vy = lerp(d.vy, (dy / dist) * k, 1 - Math.exp(-dt * 6));
        }
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += 28 * dt;
        if (dist < 18) {
          if (d.kind === 'bomb') grantBomb(d.x, d.y, false);
          else pickBead(d.x, d.y);
          G.drops.splice(i, 1);
          continue;
        }
      } else {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
      }
      if (d.life <= 0 || d.y > VH + 30 || d.x < -30 || d.x > VW + 30) G.drops.splice(i, 1);
    }
  }

  function updateSeals(dt) {
    for (let i = seals.length - 1; i >= 0; i--) {
      const s = seals[i];
      s.t += dt;
      s.spin += dt * 2.4;
      s.life -= dt;
      if (s.life <= 0) seals.splice(i, 1);
    }
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    const play = G.mode === 'play';
    if (e.kind === 'oni') {
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp * 0.35;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (play && e.fireCd <= 0 && e.y > 36 && e.y < VH - 80) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'dive') {
      if (e.t > 0.28) {
        const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
        const spd = 210 * dens();
        e.vx = lerp(e.vx, Math.cos(a) * spd, 1 - Math.exp(-dt * 2.4));
        e.vy = lerp(e.vy, Math.sin(a) * spd, 1 - Math.exp(-dt * 2.4));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (play && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'turret') {
      e.y += e.vy * dt;
      if (play && e.fireCd <= 0 && e.y > 20 && e.y < VH - 20) {
        aimedFire(e, isCore() ? 2 : 1, 0.16, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.y += e.vy * dt;
      e.x = e.baseX + Math.sin(e.t * 1.25 + e.phase) * e.amp;
      if (e.y > 110 && e.vy > 22) e.vy = lerp(e.vy, 22, 1 - Math.exp(-dt * 2));
      if (play && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 3, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'carrier') {
      e.y += e.vy * dt;
      e.x = e.baseX + Math.sin(e.t * 1.05 + e.phase) * e.amp;
      if (e.y > 130 && e.vy > 18) e.vy = 20;
      if (play && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 2, 0.2, bulletSpd());
        e.fireCd = fireInterval(e);
        if ((e.pattern++ % 3) === 0) {
          spawnOni(e.x, e.y + 16, rand(-40, 40), 70);
        }
      }
    } else if (e.kind === 'drop') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.spin += dt * 4;
    } else if (e.kind === 'boss') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 128, 1 - Math.exp(-dt * 2.8));
        e.x = lerp(e.x, VW * 0.5, 1 - Math.exp(-dt * 2.2));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.72) * e.amp;
        e.y = 128 + Math.sin(e.t * 0.55) * 18;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.2 : 2.2);
      if (!play || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      const st = G.stage;
      if (ratio > 0.66) {
        aimedFire(e, 3, 0.18, spd);
        if (st >= 2 && Math.random() < 0.4) ringFire(e, 8, spd * 0.68, e.spin);
        e.fireCd = 1.12 * (isCore() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        ringFire(e, st >= 3 ? 10 : 8, spd * 0.78, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 5, 0.16, spd);
        e.fireCd = 0.5 * (isCore() ? 0.78 : 1);
      } else {
        ringFire(e, 12, spd * 0.76, e.spin);
        if (st >= 2) ringFire(e, 8, spd * 0.56, -e.spin * 0.7);
        aimedFire(e, 3, 0.14, spd * 1.05);
        if (st >= 3 && (e.pattern++ % 4) === 0) {
          spawnOni(e.x - 30, e.y + 20, -40, 90);
          spawnOni(e.x + 30, e.y + 20, 40, 90);
        }
        e.fireCd = 0.4 * (isCore() ? 0.78 : 1);
      }
    }
  }

  function updateEnemies(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      thinkEnemy(e, dt);
      if (e.kind !== 'boss' && (e.x < -56 || e.x > VW + 56 || e.y < -90 || e.y > VH + 50)) {
        e.alive = false;
        G.enemies.splice(i, 1);
        continue;
      }
      if (canHurt && !e.ground) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' ? e.r * 0.52 : e.r * 0.7) + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      }
    }
  }

  function updateWaves(dt) {
    if (hasBoss()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
    if (G.waveI >= st.waves.length && !hasBoss() && living() === 0) {
      G.gapT += dt;
      if (G.gapT >= 1.4) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function updateShip(dt) {
    if (G.deadT > 0) return;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.ship.x;
      const dy = pointer.y - G.ship.y;
      const d = hypot(dx, dy);
      const spd = shipSpeed();
      if (d > 2) {
        const k = Math.min(1, d / 46);
        G.ship.vx = (dx / d) * spd * k;
        G.ship.vy = (dy / d) * spd * k;
      } else {
        G.ship.vx = 0;
        G.ship.vy = 0;
      }
    } else {
      let ax = 0;
      let ay = 0;
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax && ay) {
        ax *= 0.7071;
        ay *= 0.7071;
      }
      const spd = shipSpeed();
      G.ship.vx = ax * spd;
      G.ship.vy = ay * spd;
    }
    const ymin = hasBoss() ? 86 : 40;
    G.ship.x = clamp(G.ship.x + G.ship.vx * dt, 22, VW - 22);
    G.ship.y = clamp(G.ship.y + G.ship.vy * dt, ymin, VH - 28);
  }

  function updateWorld(dt) {
    G.scroll += scrollSpd() * dt;
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      p.y += (36 + p.z * 90) * dt;
      p.x += Math.sin(G.t * 1.4 + i) * 8 * dt;
      if (p.y > VH + 8) {
        p.y = -6;
        p.x = Math.random() * VW;
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
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
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > 0.16) trails.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'core' ? 'core' : 'tour';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.bombs = 3;
    G.beads = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.gapT = 0;
    G.scroll = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 642;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isCore() ? '狱核' : '狱巡', isCore(), !isCore());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'tour';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.bombs = 3;
    G.beads = 0;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 642;
    clearWorld();
    showOverlay('title', '狱巡', LEAD);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('tour');
    else startGame(G.kind || 'tour');
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 22;
      G.ship.y = 600 + Math.sin(G.t * 1.1) * 16;
      if (living() < 7 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.42) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
      }
      updateEnemies(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateDrops(dt);
      updateSeals(dt);
      if (G.deadT <= 0) {
        if (G.lives > 0) {
          G.ship.x = VW * 0.5;
          G.ship.y = 642;
          G.invuln = 1.55;
          G.bullets.length = 0;
        } else {
          loseGame();
        }
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateWheel(dt);
    updateBullets(dt);
    updateDrops(dt);
    updateSeals(dt);
    updateEnemies(dt);
    updateWaves(dt);
    updateWorld(dt);

    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) finishWin();
    }
  }

  function drawPoly(pts, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(sx(pts[0][0]), sy(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i][0]), sy(pts[i][1]));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = (lw || 1) * scale;
      ctx.stroke();
    }
  }

  function drawRockWall(x, inward) {
    const sc = G.scroll;
    ctx.beginPath();
    ctx.moveTo(sx(inward < 0 ? -4 : VW + 4), sy(-8));
    ctx.lineTo(sx(x), sy(-8));
    const step = 22;
    for (let i = -1; i <= VH / step + 3; i++) {
      const y = i * step;
      const n = ((sc * 0.08 + i) | 0);
      const w = 8 + hash(n + (inward < 0 ? 2 : 7)) * 16;
      ctx.lineTo(sx(x + inward * w), sy(y - (sc % step)));
    }
    ctx.lineTo(sx(inward < 0 ? -4 : VW + 4), sy(VH + 8));
    ctx.closePath();
    ctx.fillStyle = rgba(BLOOD, 0.34);
    ctx.fill();
    ctx.strokeStyle = rgba(FIRE, 0.28);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
  }

  function drawBg() {
    ctx.fillStyle = '#0a0404';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const g = ctx.createRadialGradient(sx(VW * 0.5), sy(80), 8 * scale, sx(VW * 0.5), sy(VH * 0.45), 380 * scale);
    g.addColorStop(0, rgba(FIRE, G.stage >= 3 ? 0.16 : 0.08));
    g.addColorStop(0.55, rgba(BLOOD, 0.1));
    g.addColorStop(1, 'rgba(10,4,4,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const sc = G.scroll;
    const stg = G.stage;
    for (let i = 0; i < 9; i++) {
      const n = i + ((sc * 0.014) | 0);
      const hsh = hash(n * 3.1 + stg);
      const x = 50 + hash(n + 5) * (VW - 100);
      const y = ((hsh * VH + VH - (sc * 0.55) % VH) % VH);
      const w = 28 + hash(n + 9) * 46;
      const hh = 16 + hash(n + 4) * 34;
      ctx.fillStyle = rgba(FIRE, 0.05 + hash(n) * 0.07);
      ctx.beginPath();
      ctx.ellipse(sx(x), sy(y), w * 0.5 * scale, hh * 0.5 * scale, 0, 0, TAU);
      ctx.fill();
    }

    if (stg === 2) {
      for (let i = 0; i < 7; i++) {
        const n = i + ((sc * 0.01) | 0);
        const x = 48 + hash(n) * (VW - 96);
        const y = ((n * 96 - sc * 0.7) % (VH + 60)) - 20;
        ctx.strokeStyle = rgba(GOLD, 0.16);
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(x), sy(y));
        ctx.lineTo(sx(x + 6), sy(y + 28));
        ctx.moveTo(sx(x), sy(y));
        ctx.lineTo(sx(x - 5), sy(y + 26));
        ctx.stroke();
      }
    }

    if (stg >= 3 || hasBoss()) {
      for (let i = 0; i < 5; i++) {
        const n = i * 2 + 1;
        const x = 60 + hash(n) * (VW - 120);
        const y = ((hash(n + 3) * VH + sc * 0.45) % (VH + 30)) - 10;
        ctx.strokeStyle = rgba(GOLD, 0.22);
        ctx.lineWidth = 1.3 * scale;
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), 10 * scale, 0, TAU);
        ctx.stroke();
      }
    }

    drawRockWall(34, 1);
    drawRockWall(VW - 34, -1);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      ctx.fillStyle = rgba(i % 3 === 0 ? GOLD : (i % 2 ? FIRE : AMB), p.a * 0.7);
      const r = p.s * scale;
      ctx.fillRect(sx(p.x) - r * 0.5, sy(p.y) - r * 0.5, r, r);
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    const x = e.x;
    const y = e.y;
    const f = e.flash > 0;
    const col = f ? WHT : AMB;
    const kind = e.kind;
    if (kind === 'oni') {
      drawPoly([
        [x, y - 10], [x + 8, y - 2], [x + 5, y + 8], [x - 5, y + 8], [x - 8, y - 2]
      ], rgba(col, 0.95), rgba(FIRE, 0.75), 1);
      ctx.fillStyle = rgba(FIRE, 0.95);
      ctx.beginPath();
      ctx.moveTo(sx(x - 5), sy(y - 8));
      ctx.lineTo(sx(x - 2), sy(y - 14));
      ctx.lineTo(sx(x), sy(y - 8));
      ctx.moveTo(sx(x + 5), sy(y - 8));
      ctx.lineTo(sx(x + 2), sy(y - 14));
      ctx.lineTo(sx(x), sy(y - 8));
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(sx(x - 1.4), sy(y - 1.2), 2.8 * scale, 2.8 * scale);
    } else if (kind === 'dive') {
      drawPoly([
        [x, y + 12], [x - 7, y - 8], [x, y - 4], [x + 7, y - 8]
      ], rgba(col, 0.95), rgba(GOLD, 0.7), 1);
      ctx.fillStyle = rgba(FIRE, 0.9);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 2.2 * scale, 0, TAU);
      ctx.fill();
    } else if (kind === 'turret') {
      ctx.fillStyle = rgba(DEEP, 0.92);
      ctx.fillRect(sx(x - 10), sy(y - 8), 20 * scale, 16 * scale);
      ctx.strokeStyle = rgba(f ? WHT : GOLD, 0.8);
      ctx.lineWidth = 1.2 * scale;
      ctx.strokeRect(sx(x - 10), sy(y - 8), 20 * scale, 16 * scale);
      ctx.fillStyle = rgba(FIRE, 0.9);
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y - 14));
      ctx.lineTo(sx(x + 4), sy(y - 4));
      ctx.lineTo(sx(x - 4), sy(y - 4));
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'elite') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(FIRE, 0.45);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 16 * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
      drawPoly([
        [x, y - 14], [x + 14, y], [x, y + 14], [x - 14, y]
      ], rgba(f ? WHT : FIRE, 0.92), rgba(GOLD, 0.8), 1.2);
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 3.2 * scale, 0, TAU);
      ctx.fill();
    } else if (kind === 'carrier') {
      drawPoly([
        [x - 16, y], [x - 8, y - 10], [x + 8, y - 10], [x + 16, y], [x + 8, y + 10], [x - 8, y + 10]
      ], rgba(f ? WHT : AMB, 0.92), rgba(GOLD, 0.75), 1.2);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 3.6 * scale, 0, TAU);
      ctx.fill();
    } else if (kind === 'drop') {
      ctx.save();
      const ang = e.spin;
      ctx.translate(sx(x), sy(y));
      ctx.rotate(ang);
      ctx.fillStyle = rgba(f ? WHT : FIRE, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7 * scale, 10 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(0, -2 * scale, 2.2 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (kind === 'boss') {
      const r = e.r;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), (r + 8) * scale, e.spin, e.spin + 2.2);
      ctx.stroke();
      ctx.strokeStyle = rgba(FIRE, 0.4);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), (r + 16) * scale, -e.spin, -e.spin + 1.6);
      ctx.stroke();
      ctx.restore();
      drawPoly([
        [x, y - r * 0.9],
        [x + r * 0.85, y - r * 0.15],
        [x + r * 0.55, y + r * 0.75],
        [x - r * 0.55, y + r * 0.75],
        [x - r * 0.85, y - r * 0.15]
      ], rgba(f ? WHT : FIRE, 0.94), rgba(GOLD, 0.9), 1.6);
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.beginPath();
      ctx.arc(sx(x - r * 0.28), sy(y - r * 0.1), 5.5 * scale, 0, TAU);
      ctx.arc(sx(x + r * 0.28), sy(y - r * 0.1), 5.5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.arc(sx(x - r * 0.28), sy(y - r * 0.08), 2.2 * scale, 0, TAU);
      ctx.arc(sx(x + r * 0.28), sy(y - r * 0.08), 2.2 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(sx(x - r * 0.55), sy(y - r * 0.55));
      ctx.lineTo(sx(x - r * 0.22), sy(y - r * 1.05));
      ctx.lineTo(sx(x - r * 0.08), sy(y - r * 0.5));
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx(x + r * 0.55), sy(y - r * 0.55));
      ctx.lineTo(sx(x + r * 0.22), sy(y - r * 1.05));
      ctx.lineTo(sx(x + r * 0.08), sy(y - r * 0.5));
      ctx.fill();
      const hp = clamp(e.hp / e.maxHp, 0, 1);
      ctx.fillStyle = rgba(DEEP, 0.7);
      ctx.fillRect(sx(x - r), sy(y + r + 8), r * 2 * scale, 4 * scale);
      ctx.fillStyle = rgba(hp > 0.33 ? GOLD : MAG, 0.95);
      ctx.fillRect(sx(x - r), sy(y + r + 8), r * 2 * hp * scale, 4 * scale);
    }
  }

  function drawSeals() {
    for (let i = 0; i < seals.length; i++) {
      const s = seals[i];
      const a = clamp(s.life / 0.4, 0, 1);
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(s.spin);
      ctx.strokeStyle = rgba(GOLD, 0.55 * a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 11 * scale, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 0);
      ctx.lineTo(6 * scale, 0);
      ctx.moveTo(0, -6 * scale);
      ctx.lineTo(0, 6 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawWheel() {
    const w = G.wheel;
    if (!w.on) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.arc(sx(w.x), sy(w.y), w.r * scale, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(FIRE, 0.45);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.arc(sx(w.x), sy(w.y), w.r * 0.62 * scale, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = w.spin + i * (TAU / 8);
      const px = w.x + Math.cos(a) * w.r;
      const py = w.y + Math.sin(a) * w.r;
      ctx.fillStyle = rgba(i % 2 ? GOLD : CYN, 0.95);
      ctx.beginPath();
      ctx.arc(sx(px), sy(py), 4.2 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(FIRE, 0.35);
      ctx.beginPath();
      ctx.moveTo(sx(w.x), sy(w.y));
      ctx.lineTo(sx(px), sy(py));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (!REDUCE) {
      for (let i = 0; i < trails.length; i++) {
        const t = trails[i];
        const a = 1 - t.t / 0.16;
        ctx.fillStyle = rgba(t.rgb, a * 0.35);
        ctx.beginPath();
        ctx.arc(sx(t.x), sy(t.y), t.r * scale, 0, TAU);
        ctx.fill();
      }
    }
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), s.r * 0.55 * scale, s.r * 1.4 * scale, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBullets() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      ctx.fillStyle = rgba(PNK, 0.95);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * 0.4 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDrops() {
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      const pulse = 1 + Math.sin(d.t * 10) * 0.12;
      if (d.kind === 'bomb') {
        ctx.strokeStyle = rgba(GOLD, 0.9);
        ctx.lineWidth = 1.6 * scale;
        ctx.beginPath();
        ctx.arc(sx(d.x), sy(d.y), 8 * pulse * scale, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = rgba(FIRE, 0.9);
        ctx.beginPath();
        ctx.arc(sx(d.x), sy(d.y), 3.2 * scale, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(GOLD, 0.92);
        ctx.beginPath();
        ctx.arc(sx(d.x), sy(d.y), 4.2 * pulse * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(CYN, 0.9);
        ctx.beginPath();
        ctx.arc(sx(d.x), sy(d.y), 1.6 * scale, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(FIRE, 0.22 + (G.muzzle > 0 ? 0.2 : 0));
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), 15 * scale, 12 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(AMB, 0.5);
    ctx.beginPath();
    ctx.moveTo(sx(x - 5), sy(y + 8));
    ctx.lineTo(sx(x), sy(y + 20 + Math.sin(G.t * 28) * 2));
    ctx.lineTo(sx(x + 5), sy(y + 8));
    ctx.fill();
    ctx.restore();

    if (G.bombs > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(GOLD, 0.35);
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 15 * scale, G.t * 2, G.t * 2 + 2.4);
      ctx.stroke();
      for (let i = 0; i < Math.min(6, G.bombs); i++) {
        const a = G.t * 1.8 + i * (TAU / Math.min(6, G.bombs));
        ctx.fillStyle = rgba(GOLD, 0.7);
        ctx.beginPath();
        ctx.arc(sx(x + Math.cos(a) * 15), sy(y + Math.sin(a) * 15), 1.6 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    drawPoly([
      [x - 14, y + 6], [x - 4, y + 2], [x - 8, y + 12]
    ], rgba(FIRE, 0.92), rgba(GOLD, 0.5), 1);
    drawPoly([
      [x + 14, y + 6], [x + 4, y + 2], [x + 8, y + 12]
    ], rgba(FIRE, 0.92), rgba(GOLD, 0.5), 1);

    drawPoly([
      [x, y - 16], [x + 7, y + 8], [x, y + 5], [x - 7, y + 8]
    ], rgba(AMB, 0.96), rgba(GOLD, 0.85), 1.2);

    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y - 16));
    ctx.lineTo(sx(x + 3.6), sy(y - 4));
    ctx.lineTo(sx(x - 3.6), sy(y - 4));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y - 1), 2.8 * scale, 2.2 * scale, 0, 0, TAU);
    ctx.fill();

    if (G.muzzle > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / 0.4, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.22;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (6 + s.t * 42) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, a * 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = ((f.gold ? 13 : 11) * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#140604';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140604';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawSeals();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
    drawDrops();
    drawShots();
    drawWheel();
    drawShip();
    drawBullets();
    drawFx();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const r = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerWorldX(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    return (x - ox) / scale;
  }
  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return (y - oy) / scale;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('tour');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
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
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || isBomb) {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || isBomb)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (isBomb) {
      tryBomb();
      return;
    }
    if (space) {
      if (overlayOpen()) {
        primaryAction();
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
      startGame('tour');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('core');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (e.button === 2) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      tryBomb();
    });
    el.addEventListener('click', function (e) { e.preventDefault(); });
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
  bindBombBtn(btnBomb);
  bindBombBtn(btnPad);

  if (btnTour) {
    btnTour.addEventListener('click', function () {
      audio.ensure();
      startGame('tour');
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
      startGame(G.kind || 'tour');
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
    }
  });

  requestAnimationFrame(frame);
})();
