'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const BOMB_CAP = 6;
  const LOCK_MAX = 8;
  const HIT_R = 4.6;
  const SHOT_V = 720;
  const SIGHT_Y = 112;
  const SIGHT_R = 44;
  const BEST_KEY = 'playbox-layered-best';
  const MUTE_KEY = 'playbox-layered-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击（松开放锁）· Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [110, 232, 255];
  const VIO = [162, 77, 255];
  const LAV = [212, 184, 255];
  const GOLD = [255, 227, 107];
  const WHT = [244, 238, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const DEEP = [20, 8, 30];
  const AMB = [255, 176, 64];

  const SCORE = {
    scout: 50,
    dive: 80,
    wing: 140,
    elite: 240,
    turret: 80,
    tank: 120,
    silo: 160,
    node: 60,
    core: 280,
    pod: 220,
    boss: 8000,
    chip: 12,
    stage: 1600
  };

  const STAGES = [
    {
      name: '雾廊',
      waves: [
        { t: 0.6, kind: 'ground', n: 4 },
        { t: 2.4, kind: 'v', n: 5 },
        { t: 4.8, kind: 'tank' },
        { t: 7.0, kind: 'dive', n: 4 },
        { t: 9.2, kind: 'stream', dir: 1 },
        { t: 11.4, kind: 'array' },
        { t: 13.6, kind: 'ground', n: 5 },
        { t: 16.0, kind: 'wing' },
        { t: 18.2, kind: 'silo' },
        { t: 20.6, kind: 'v', n: 7 }
      ]
    },
    {
      name: '脊城',
      waves: [
        { t: 0.5, kind: 'array' },
        { t: 2.2, kind: 'v', n: 7 },
        { t: 4.2, kind: 'tank' },
        { t: 6.2, kind: 'dive', n: 5 },
        { t: 8.4, kind: 'ground', n: 6 },
        { t: 10.4, kind: 'stream', dir: -1 },
        { t: 12.6, kind: 'wing' },
        { t: 14.6, kind: 'silo' },
        { t: 16.8, kind: 'elite' },
        { t: 19.0, kind: 'array' },
        { t: 21.2, kind: 'ground', n: 7 },
        { t: 23.4, kind: 'dive', n: 5 }
      ]
    },
    {
      name: '层核',
      waves: [
        { t: 0.4, kind: 'v', n: 7 },
        { t: 2.0, kind: 'array' },
        { t: 3.8, kind: 'dive', n: 5 },
        { t: 5.6, kind: 'tank' },
        { t: 7.2, kind: 'stream', dir: 1 },
        { t: 9.0, kind: 'wing' },
        { t: 10.6, kind: 'ground', n: 6 },
        { t: 12.4, kind: 'elite' },
        { t: 14.2, kind: 'silo' },
        { t: 16.8, kind: 'boss' }
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
  const btnLay = document.getElementById('btn-lay');
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
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const lockBar = document.getElementById('lock-bar');
  const lockWrap = document.getElementById('lock-wrap');

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

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const dust = [];
  const slabs = [];

  const G = {
    mode: 'title',
    kind: 'lay',
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
    bombs: 3,
    bombT: 0,
    next1up: LIFE_EVERY,
    enemies: [],
    shots: [],
    bullets: [],
    locks: [],
    lasers: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    holding: false,
    lockT: 0,
    lockCd: 0,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: VIO,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    sightPulse: 0
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
  function isCore() {
    return G.kind === 'core';
  }
  function dens() {
    return isCore() ? 1.28 : 1;
  }
  function shipSpeed() {
    return isCore() ? 318 : 276;
  }
  function fireRate() {
    return isCore() ? 0.078 : 0.092;
  }
  function bulletSpd() {
    return isCore() ? 186 : 142;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isCore() ? 122 : 86;
  }
  function hpMul() {
    return isCore() ? 1.26 : 1;
  }
  function lockPts(i) {
    return 100 * Math.pow(2, i);
  }
  function sightY() {
    return G.ship.y - SIGHT_Y;
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
      this.beep(780, 0.04, 'square', 0.024, 1520);
    },
    lockOn(n) {
      this.ensure();
      this.beep(480 + n * 85, 0.055, 'sine', 0.038, 920 + n * 90);
      this.beep(920 + n * 40, 0.04, 'triangle', 0.02, 1400);
    },
    lockFire(n) {
      this.ensure();
      this.beep(180, 0.14, 'sawtooth', 0.052, 70);
      this.beep(560 + n * 50, 0.18, 'square', 0.042, 1680);
      if (n >= 5) this.beep(1100, 0.22, 'triangle', 0.046, 1760);
    },
    lockHit(i) {
      this.ensure();
      const lift = 1 + i * 0.13;
      this.noise(0.045, 0.038, 1300);
      this.beep(420 * lift, 0.08, 'square', 0.048, 1040 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1500);
      this.beep(620 * lift, 0.055, 'square', 0.036, 980 * lift);
    },
    bomb() {
      this.ensure();
      this.noise(0.28, 0.08, 180);
      this.beep(90, 0.42, 'sawtooth', 0.07, 40);
      this.beep(740, 0.2, 'sine', 0.04, 220);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * Math.min(4, m), 0.08, 'sine', 0.04, 660 * Math.min(4, m));
      this.beep(880, 0.12, 'triangle', 0.03, 1400);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(280, 0.14, 'sawtooth', 0.045, 70);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.05, 'sawtooth', 0.036, 170);
      this.beep(620, 0.065, 'square', 0.028, 900);
    },
    bossDie() {
      this.ensure();
      this.noise(0.24, 0.062, 260);
      this.beep(180, 0.3, 'sawtooth', 0.05, 48);
      this.beep(520, 0.22, 'triangle', 0.04, 210);
      this.beep(1100, 0.34, 'sine', 0.042, 1680);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 380);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.045, 46);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.025, 80);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
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

  function comboMult() {
    return 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.05);
      kick(3.0);
      pulseCombo();
      floatText(G.ship.x, G.ship.y - 36, '×' + G.mult, GOLD, true);
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.04);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function pulseCombo() {
    if (!comboEl) return;
    comboEl.classList.remove('hot');
    void comboEl.offsetWidth;
    comboEl.classList.add('hot');
    comboTok += 1;
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

  function syncLockBar() {
    if (lockBar) lockBar.style.transform = 'scaleX(' + (G.locks.length / LOCK_MAX) + ')';
    if (lockWrap) lockWrap.classList.toggle('hot', G.locks.length >= 4 || G.holding);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '层击';
      else if (hasBoss()) stageLabel.textContent = '层主';
      else stageLabel.textContent = STAGES[G.stage - 1] ? STAGES[G.stage - 1].name : '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '层核' : '层击';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isCore());
      tagLabel.classList.toggle('hot', G.locks.length >= 6 || G.holding);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('low', G.bombs <= 0);
    }
    syncLockBar();
    if (comboEl) {
      if (G.mode === 'play' && G.locks.length >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '锁 ×' + G.locks.length;
      } else if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 按住叠锁，松开放束', 'warn');
    else if (G.mode === 'win') setHint('层核已碎 · R 再来', 'hot');
    else if (G.holding && G.locks.length >= 4) setHint('叠锁 ' + G.locks.length + ' · 松开放束', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 准星对准下层', 'warn');
    else setHint('按住叠锁 · 松开放束 · Shift 爆弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'LAYR';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'lock' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('lock');
    stageEl.classList.remove('boss');
    stageEl.classList.remove('bomb');
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
        g: 160,
        life: rand(0.22, 0.5),
        r: rand(1.2, 2.8),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 220);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 32);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 18);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      t: 0,
      life: gold ? 0.92 : 0.65,
      vy: gold ? -72 : -48,
      text: text,
      rgb: rgb,
      gold: !!gold
    });
    capArr(floats, 22);
  }

  function explode(x, y, rgb, power) {
    const p = power || 16;
    burst(x, y, rgb, Math.min(30, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function mushroom(x, y, rgb) {
    burst(x, y, rgb, REDUCE ? 8 : 18, 110);
    burst(x, y, GOLD, REDUCE ? 4 : 10, 70);
    ring(x, y, rgb);
    sparks.push({ x: x, y: y, t: 0, rgb: GOLD });
  }

  function seedDust() {
    dust.length = 0;
    for (let i = 0; i < 78; i++) {
      dust.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.4, 2.0),
        a: rand(0.1, 0.52),
        z: rand(0.28, 1.15)
      });
    }
    slabs.length = 0;
    for (let i = 0; i < 18; i++) {
      slabs.push({
        x: rand(40, VW - 40),
        y: Math.random() * VH,
        w: rand(18, 42),
        h: rand(10, 22),
        z: rand(0.45, 0.9)
      });
    }
  }

  function isGround(e) {
    return e.layer === 'ground';
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'pod' || spec.kind === 'core';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'scout',
      layer: spec.layer || 'air',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 94 * dens() : spec.vy,
      hp: bossish ? spec.hp : hp,
      maxHp: bossish ? spec.hp : hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.scout,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      lockI: -1
    };
    e.maxHp = e.hp;
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.5,
      life: 8
    });
    capArr(G.bullets, isCore() ? 280 : 220);
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

  function spawnScout(x, y, vx, vy) {
    spawnEnemy({
      kind: 'scout',
      layer: 'air',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 98 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.scout,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnScout(c + k * 36, -26 - Math.abs(k) * 16, 0, 102 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isCore() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'scout',
        layer: 'air',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 90 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.scout,
        fireCd: 0.7 + i * 0.12
      });
    }
  }

  function spawnDive(n) {
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'dive',
        layer: 'air',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vy: 42,
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: 99
      });
    }
  }

  function spawnWing(x) {
    spawnEnemy({
      kind: 'wing',
      layer: 'air',
      x: x == null ? (Math.random() < 0.5 ? 120 : 360) : x,
      y: -32,
      vy: 64 * dens(),
      hp: 5,
      r: 15,
      amp: 72,
      score: SCORE.wing,
      fireCd: 0.45
    });
  }

  function spawnGroundRow(n) {
    const count = n + (isCore() ? 2 : 0);
    for (let i = 0; i < count; i++) {
      spawnEnemy({
        kind: 'turret',
        layer: 'ground',
        x: 48 + i * ((VW - 96) / Math.max(1, count - 1)),
        y: -22,
        vy: 0,
        hp: 4,
        r: 13,
        score: SCORE.turret,
        fireCd: 0.6 + i * 0.12
      });
    }
  }

  function spawnTanks() {
    const n = isCore() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'tank',
        layer: 'ground',
        x: 70 + i * ((VW - 140) / Math.max(1, n - 1)),
        y: -28 - (i % 2) * 18,
        vy: 0,
        hp: 5,
        r: 14,
        score: SCORE.tank,
        fireCd: 0.5 + i * 0.14
      });
    }
  }

  function spawnSilos() {
    spawnEnemy({
      kind: 'silo',
      layer: 'ground',
      x: 130,
      y: -30,
      vy: 0,
      hp: 6,
      r: 16,
      score: SCORE.silo,
      fireCd: 0.7
    });
    spawnEnemy({
      kind: 'silo',
      layer: 'ground',
      x: 350,
      y: -30,
      vy: 0,
      hp: 6,
      r: 16,
      score: SCORE.silo,
      fireCd: 0.95
    });
    if (isCore()) {
      spawnEnemy({
        kind: 'silo',
        layer: 'ground',
        x: 240,
        y: -48,
        vy: 0,
        hp: 6,
        r: 16,
        score: SCORE.silo,
        fireCd: 0.8
      });
    }
  }

  function spawnArray() {
    const cols = isCore() ? 5 : 4;
    const rows = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        spawnEnemy({
          kind: 'node',
          layer: 'ground',
          x: 70 + c * ((VW - 140) / Math.max(1, cols - 1)) + (r ? 16 : 0),
          y: -24 - r * 36,
          vy: 0,
          hp: 2,
          r: 10,
          score: SCORE.node,
          fireCd: 99
        });
      }
    }
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      layer: 'air',
      x: 150,
      vy: 58 * dens(),
      hp: 10,
      r: 18,
      amp: 86,
      score: SCORE.elite,
      fireCd: 0.5
    });
    spawnEnemy({
      kind: 'elite',
      layer: 'air',
      x: 330,
      vy: 58 * dens(),
      hp: 10,
      r: 18,
      amp: 86,
      phase: 1.6,
      score: SCORE.elite,
      fireCd: 0.7
    });
  }

  function spawnBoss() {
    const core = isCore();
    const boss = spawnEnemy({
      kind: 'boss',
      layer: 'air',
      x: VW * 0.5,
      y: -90,
      vy: 0,
      hp: core ? 124 : 96,
      r: 44,
      score: SCORE.boss,
      enter: 1.4,
      fireCd: 0.95
    });
    boss.maxHp = boss.hp;
    spawnEnemy({
      kind: 'pod',
      layer: 'air',
      x: VW * 0.5 + 78,
      y: 30,
      hp: core ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: 0,
      rad: 92,
      fireCd: 0.8
    });
    spawnEnemy({
      kind: 'pod',
      layer: 'air',
      x: VW * 0.5 - 78,
      y: 30,
      hp: core ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 92,
      fireCd: 1.05
    });
    for (let i = 0; i < 4; i++) {
      spawnEnemy({
        kind: 'core',
        layer: 'ground',
        x: 80 + i * 106,
        y: 210,
        vy: 0,
        hp: core ? 10 : 8,
        r: 16,
        score: SCORE.core,
        ang: i * (TAU / 4),
        rad: 118,
        fireCd: 0.7 + i * 0.1
      });
    }
    toast('层主', false, true);
    audio.wave();
    screenFlash(VIO, 0.38);
    kick(4.8, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isCore() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isCore() ? 1 : 0));
    else if (w.kind === 'wing') {
      spawnWing(140);
      spawnWing(340);
      if (isCore()) spawnWing(240);
    } else if (w.kind === 'ground') spawnGroundRow(w.n);
    else if (w.kind === 'tank') spawnTanks();
    else if (w.kind === 'silo') spawnSilos();
    else if (w.kind === 'array') spawnArray();
    else if (w.kind === 'elite') spawnElite();
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

  function findBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'boss') return G.enemies[i];
    }
    return null;
  }

  function lockedOf(en) {
    for (let i = 0; i < G.locks.length; i++) {
      if (G.locks[i] === en) return true;
    }
    return false;
  }

  function pruneLocks() {
    for (let i = G.locks.length - 1; i >= 0; i--) {
      const en = G.locks[i];
      if (!en || !en.alive || en.y > VH + 24 || en.y < -50) {
        G.locks.splice(i, 1);
      }
    }
    for (let i = 0; i < G.locks.length; i++) G.locks[i].lockI = i;
  }

  function acquireLock(dt) {
    pruneLocks();
    if (G.mode !== 'play' || G.deadT > 0 || G.lockCd > 0) return;
    if (G.locks.length >= LOCK_MAX) {
      fireLock();
      return;
    }
    const qx = G.ship.x;
    const qy = sightY();
    let best = null;
    let bd = SIGHT_R * SIGHT_R;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isGround(e)) continue;
      if (lockedOf(e)) continue;
      const dx = e.x - qx;
      const dy = e.y - qy;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    if (!best) {
      G.lockT = 0;
      return;
    }
    const haste = 0.092 - Math.min(0.028, G.combo * 0.002);
    G.lockT += dt;
    if (G.lockT >= haste) {
      G.lockT = 0;
      G.locks.push(best);
      best.lockI = G.locks.length - 1;
      audio.lockOn(G.locks.length);
      spark(best.x, best.y, GOLD);
      burst(best.x, best.y, VIO, 6, 70);
      hitStop(0.018);
      G.sightPulse = 0.12;
      syncLockBar();
      syncHud();
      if (G.locks.length >= LOCK_MAX) {
        toast('满锁', false, true);
        fireLock();
      }
    }
  }

  function fireLock() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    pruneLocks();
    if (G.locks.length <= 0) return;
    const chain = G.locks.slice();
    const n = chain.length;
    G.locks.length = 0;
    G.lockT = 0;
    G.lockCd = 0.22;
    syncLockBar();
    audio.lockFire(n);
    if (n >= 5) {
      toast(n + ' 层锁', false, true);
      screenFlash(GOLD, 0.22 + n * 0.04);
      kick(3.2 + n * 0.42, 'lock');
      floatText(G.ship.x, G.ship.y - 42, '×' + Math.pow(2, n - 1), GOLD, true);
    } else if (n >= 3) {
      floatText(G.ship.x, G.ship.y - 36, '×' + Math.pow(2, n - 1), VIO, true);
      kick(2.4, 'lock');
    }
    const px = G.ship.x;
    const py = G.ship.y - 14;
    for (let i = 0; i < n; i++) {
      const tgt = chain[i];
      G.lasers.push({
        x: px,
        y: py,
        sx: px,
        sy: py,
        tx: tgt.x,
        ty: tgt.y,
        target: tgt,
        delay: i * 0.048,
        i: i,
        n: n,
        t: 0,
        hit: false,
        trail: [{ x: px, y: py }]
      });
    }
    capArr(G.lasers, 24);
    syncHud();
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('爆弹用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.48;
    G.invuln = Math.max(G.invuln, 0.42);
    G.locks.length = 0;
    syncLockBar();
    audio.bomb();
    screenFlash(WHT, 0.78);
    explode(G.ship.x, G.ship.y, VIO, 36);
    ring(G.ship.x, G.ship.y, GOLD);
    ring(VW * 0.5, VH * 0.42, VIO);
    hitStop(0.078);
    kick(7.4, 'bomb');
    G.bullets.length = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dmg = e.kind === 'boss' ? 14 : e.kind === 'core' || e.kind === 'pod' ? 10 : 6;
      damageEnemy(e, dmg, 'bomb');
    }
    syncHud();
  }

  function fireVulcan() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.05;
    G.shots.push({
      x: G.ship.x - 8,
      y: G.ship.y - 16,
      vx: 0,
      vy: -SHOT_V,
      r: 3.2,
      dmg: 1
    });
    G.shots.push({
      x: G.ship.x + 8,
      y: G.ship.y - 16,
      vx: 0,
      vy: -SHOT_V,
      r: 3.2,
      dmg: 1
    });
    capArr(G.shots, 56);
    audio.shoot();
  }

  function wantHold() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function damageEnemy(e, dmg, src, lockI) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, LAV);
      hitStop(0.032);
      audio.hit(G.combo);
      kick(1.5);
    }
    if (src === 'lock') {
      const i = lockI || 0;
      audio.lockHit(i);
      hitStop(clamp(0.034 + i * 0.006, 0.034, 0.072));
      kick(1.8 + i * 0.18, 'lock');
      mushroom(e.x, e.y, GOLD);
      if (e.hp > 0) {
        const chip = Math.round(lockPts(i) * G.mult * 0.18);
        addScore(Math.max(20, chip));
      }
    }
    if (e.kind === 'boss' && src !== 'lock') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src, lockI || 0);
  }

  function killEnemy(e, src, lockI) {
    if (!e.alive) return;
    e.alive = false;
    e.lockI = -1;
    const fromLock = src === 'lock';
    const rgb = e.kind === 'boss' ? GOLD : fromLock ? GOLD : isGround(e) ? VIO : LAV;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 48 : e.kind === 'elite' || e.kind === 'core' ? 24 : 14);
    if (fromLock) mushroom(e.x, e.y, VIO);
    let pts;
    if (fromLock) pts = Math.round(lockPts(lockI) * G.mult);
    else pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss' || (fromLock && lockI >= 4));
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.4, 'boss');
      screenFlash(GOLD, 0.74);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, VIO);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod' || G.enemies[i].kind === 'core') G.enemies[i].alive = false;
      }
      G.bullets.length = 0;
      G.winT = 1.4;
      toast('层核碎裂', false, true);
    } else if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'core' || e.kind === 'silo') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    if (e.kind === 'core') {
      const b = findBoss();
      if (b && b.alive) {
        b.hp -= 8;
        b.flash = 0.12;
        if (b.hp <= 0) killEnemy(b, 'lock', lockI);
      }
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.holding = false;
    G.locks.length = 0;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, VIO, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    G.holding = false;
    G.locks.length = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    G.holding = false;
    audio.lose();
    showOverlay('lose', '舰毁了', '上层点射，准星叠锁下层。按住叠锁，松开放束。分数 ' + G.score + '。');
    setHint('R 重开 · 按住叠锁，松开放束', 'warn');
  }

  function goWin() {
    addScore(isCore() ? 10000 : 8000);
    G.mode = 'win';
    G.holding = false;
    audio.win();
    showOverlay(
      'win',
      isCore() ? '层核通关' : '层核尽碎',
      '三关打穿，层主已碎。分数 ' + G.score + (isCore() ? ' · 层核' : ' · 层击') + '。'
    );
    setHint('层核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.locks.length = 0;
    G.lasers.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    if (G.bombs < BOMB_CAP) G.bombs += 1;
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '层核'), false, true);
    audio.wave();
    screenFlash(VIO, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'core' ? 'core' : 'lay';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.bombs = 3;
    G.bombT = 0;
    G.next1up = LIFE_EVERY;
    G.fireCd = 0;
    G.lockT = 0;
    G.lockCd = 0;
    G.holding = false;
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
    G.sightPulse = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isCore() ? '层核' : '层击', isCore(), !isCore());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'lay';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.bombs = 3;
    G.holding = false;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '层击', '上层点射，准星叠锁下层。按住叠锁，松开放束。撞机掉命。短关之后是层主。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('lay');
    else startGame(G.kind || 'lay');
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
      p.vx *= Math.exp(-dt * 1.8);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.6;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.6;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.sightPulse > 0) G.sightPulse -= dt;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < dust.length; i++) {
      const s = dust[i];
      s.y += scr * 0.42 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < slabs.length; i++) {
      const b = slabs[i];
      b.y += scr * 0.55 * b.z * dt;
      if (b.y > VH + 24) {
        b.y = -30;
        b.x = rand(36, VW - 36);
      }
    }
  }

  function updateShip(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = shipSpeed();
    let dx = 0;
    let dy = 0;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (dx || dy) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
      G.ship.vx = dx * spd;
      G.ship.vy = dy * spd;
      inputSrc = 'key';
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      G.ship.x = lerp(G.ship.x, tx, 1 - Math.exp(-dt * 16));
      G.ship.y = lerp(G.ship.y, ty, 1 - Math.exp(-dt * 16));
      G.ship.vx = 0;
      G.ship.vy = 0;
    } else {
      G.ship.vx *= Math.exp(-dt * 10);
      G.ship.vy *= Math.exp(-dt * 10);
    }
    G.ship.x += G.ship.vx * dt;
    G.ship.y += G.ship.vy * dt;
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.lockCd > 0) G.lockCd -= dt;
    const hold = wantHold();
    if (hold && !G.holding) {
      G.holding = true;
    }
    if (!hold && G.holding) {
      G.holding = false;
      fireLock();
    }
    if (G.holding) {
      fireVulcan();
      acquireLock(dt);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -24 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive || isGround(e)) continue;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const rr = e.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, s.dmg, 'shot');
          burst(s.x, s.y, GOLD, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateLasers(dt) {
    for (let i = G.lasers.length - 1; i >= 0; i--) {
      const L = G.lasers[i];
      if (L.delay > 0) {
        L.delay -= dt;
        if (L.target && L.target.alive) {
          L.tx = L.target.x;
          L.ty = L.target.y;
        }
        continue;
      }
      L.t += dt * 4.6;
      const tgt = L.target;
      if (tgt && tgt.alive) {
        L.tx = tgt.x;
        L.ty = tgt.y;
      }
      const u = clamp(L.t, 0, 1);
      const cx = (L.sx + L.tx) * 0.5;
      const cy = Math.max(L.sy, L.ty) + 48;
      const ou = 1 - u;
      L.x = ou * ou * L.sx + 2 * ou * u * cx + u * u * L.tx;
      L.y = ou * ou * L.sy + 2 * ou * u * cy + u * u * L.ty;
      L.trail.push({ x: L.x, y: L.y });
      if (L.trail.length > 12) L.trail.shift();
      if (L.t >= 1 && !L.hit) {
        L.hit = true;
        if (tgt) tgt.lockI = -1;
        if (tgt && tgt.alive) {
          const dmg = 4 + L.i + (tgt.kind === 'boss' || tgt.kind === 'core' ? 2 : 0);
          damageEnemy(tgt, dmg, 'lock', L.i);
        } else {
          mushroom(L.tx, L.ty, VIO);
        }
        G.lasers.splice(i, 1);
      }
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 28 || b.y < -36 || b.x < -28 || b.x > VW + 28) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - (G.ship.y - 2);
        const rr = HIT_R + b.r * 0.55;
        if (dx * dx + dy * dy < rr * rr) {
          G.bullets.splice(i, 1);
          diePlayer();
        }
      }
    }
  }

  function fireInterval(e) {
    const core = isCore() ? 0.74 : 1;
    if (e.kind === 'scout') return 1.42 * core;
    if (e.kind === 'wing') return 1.02 * core;
    if (e.kind === 'turret') return 0.95 * core;
    if (e.kind === 'tank') return 0.88 * core;
    if (e.kind === 'silo') return 1.08 * core;
    if (e.kind === 'elite') return 0.8 * core;
    if (e.kind === 'pod') return 1.05 * core;
    if (e.kind === 'core') return 1.15 * core;
    if (e.kind === 'boss') return 0.5 * core;
    return 1.18 * core;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    const scr = scrollSpd();
    if (e.kind === 'scout') {
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp * 0.35;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20 && e.y < VH - 80) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'dive') {
      if (e.t > 0.35) {
        const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
        e.vx = lerp(e.vx, Math.cos(a) * 214 * dens(), 1 - Math.exp(-dt * 3));
        e.vy = lerp(e.vy, Math.sin(a) * 244 * dens(), 1 - Math.exp(-dt * 3));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'wing') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 5, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'turret' || e.kind === 'tank' || e.kind === 'silo' || e.kind === 'node') {
      e.y += scr * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 24 && e.y < VH - 60 && e.kind !== 'node') {
        const n = e.kind === 'silo' ? 3 : e.kind === 'tank' ? 2 : 1;
        aimedFire(e, n, 0.16, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'pod') {
      const b = findBoss();
      const cx = b ? b.x : VW * 0.5;
      const cy = b ? b.y : 118;
      e.ang += dt * 1.45;
      e.x = cx + Math.cos(e.ang) * e.rad;
      e.y = cy + Math.sin(e.ang) * e.rad * 0.55;
      if (G.mode === 'play' && e.fireCd <= 0) {
        aimedFire(e, 1, 0, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'core') {
      const b = findBoss();
      const cx = b ? b.x : VW * 0.5;
      const cy = b ? b.y + 96 : 210;
      e.ang += dt * 0.55;
      e.x = cx + Math.cos(e.ang) * e.rad;
      e.y = cy + Math.sin(e.ang) * e.rad * 0.28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 40) {
        aimedFire(e, 1, 0, bulletSpd() * 0.82);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'boss') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 118, 1 - Math.exp(-dt * 3.1));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.68) * 102;
        e.y = 118 + Math.sin(e.t * 1.05) * 12;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.35 : 2.5);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      const core = isCore() ? 0.76 : 1;
      if (ratio > 0.66) {
        aimedFire(e, 5, 0.2, spd);
        if (Math.random() < 0.5) ringFire(e, 10, spd * 0.7, e.spin);
        e.fireCd = 1.12 * core;
      } else if (ratio > 0.33) {
        ringFire(e, 12, spd * 0.78, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.5 * core;
      } else {
        ringFire(e, isCore() ? 16 : 14, spd * 0.76, e.spin);
        ringFire(e, 10, spd * 0.54, -e.spin * 0.72);
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnScout(e.x - 42, e.y + 22, -30, 112);
          spawnScout(e.x + 42, e.y + 22, 30, 112);
        }
        e.fireCd = 0.4 * core;
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
      if (e.y > VH + 40 || e.x < -50 || e.x > VW + 50) {
        if (e.kind !== 'boss' && e.kind !== 'pod' && e.kind !== 'core') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt && !isGround(e)) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' ? e.r * 0.6 : e.r * 0.7) + HIT_R;
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
      if (G.gapT >= 1.5) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.ship.y = VH - 96;
      G.sightPulse = 0.4 + Math.sin(G.t * 4) * 0.2;
      if (living() < 8 && ((G.t * 1.4) | 0) !== (((G.t - dt) * 1.4) | 0) && Math.random() < 0.5) {
        if (Math.random() < 0.45) spawnGroundRow(4);
        else spawnV(5, VW * 0.5 + Math.sin(G.t) * 50);
      }
      updateEnemies(dt);
      updateBullets(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      G.holding = false;
      updateWorld(dt * 0.5);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.holding = false;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateLasers(dt);
      updateBullets(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.bombT > 0) G.bombT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateLasers(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateLasers(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathDia(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (rot || 0) + i * (TAU / 4);
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function pathHex(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (rot || 0) + i * (TAU / 6);
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function pathShip(c, x, y, s) {
    c.beginPath();
    c.moveTo(sx(x - 7 * s), sy(y - 16 * s));
    c.lineTo(sx(x - 4 * s), sy(y - 6 * s));
    c.lineTo(sx(x - 18 * s), sy(y + 8 * s));
    c.lineTo(sx(x - 6 * s), sy(y + 6 * s));
    c.lineTo(sx(x), sy(y + 12 * s));
    c.lineTo(sx(x + 6 * s), sy(y + 6 * s));
    c.lineTo(sx(x + 18 * s), sy(y + 8 * s));
    c.lineTo(sx(x + 4 * s), sy(y - 6 * s));
    c.lineTo(sx(x + 7 * s), sy(y - 16 * s));
    c.lineTo(sx(x + 3 * s), sy(y - 4 * s));
    c.lineTo(sx(x), sy(y - 2 * s));
    c.lineTo(sx(x - 3 * s), sy(y - 4 * s));
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#070410';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(70), 10 * scale, sx(VW * 0.5), sy(VH * 0.48), 420 * scale);
    g.addColorStop(0, 'rgba(162,77,255,0.12)');
    g.addColorStop(1, 'rgba(7,4,16,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const size = 36;
    const yOff = (G.scroll * 0.55) % size;
    c.strokeStyle = 'rgba(162,77,255,0.1)';
    c.lineWidth = Math.max(0.6, 0.7 * scale);
    for (let row = -2; row < 26; row++) {
      const y = row * size - yOff;
      const k = clamp(y / VH, 0, 1);
      const spread = lerp(0.42, 1, k);
      for (let col = -6; col < 14; col++) {
        const x = VW * 0.5 + (col - 3.5) * size * spread;
        c.strokeStyle = 'rgba(162,77,255,' + (0.04 + k * 0.1) + ')';
        pathDia(c, x, y, size * 0.32 * spread, 0);
        c.stroke();
      }
    }

    for (let i = 0; i < slabs.length; i++) {
      const b = slabs[i];
      const a = 0.14 + b.z * 0.12;
      c.fillStyle = 'rgba(40,16,70,' + a + ')';
      const bw = b.w * b.z;
      const bh = b.h * b.z;
      c.fillRect(sx(b.x - bw * 0.5), sy(b.y - bh * 0.5), bw * scale, bh * scale);
      c.strokeStyle = 'rgba(122,60,255,' + (0.18 + b.z * 0.2) + ')';
      c.lineWidth = Math.max(0.6, 0.8 * scale);
      c.strokeRect(sx(b.x - bw * 0.5), sy(b.y - bh * 0.5), bw * scale, bh * scale);
    }

    c.fillStyle = 'rgba(10,6,20,0.7)';
    c.fillRect(sx(0), sy(0), 28 * scale, VH * scale);
    c.fillRect(sx(VW - 28), sy(0), 28 * scale, VH * scale);
    const wallOff = (G.scroll * 0.72) % 40;
    for (let i = -1; i < 22; i++) {
      const y = i * 40 - wallOff;
      c.fillStyle = 'rgba(162,77,255,0.12)';
      pathHex(c, 14, y, 9, 0);
      c.fill();
      pathHex(c, VW - 14, y + 20, 9, 0);
      c.fill();
      c.strokeStyle = 'rgba(162,77,255,0.32)';
      c.lineWidth = Math.max(0.8, scale);
      pathHex(c, 14, y, 9, 0);
      c.stroke();
      pathHex(c, VW - 14, y + 20, 9, 0);
      c.stroke();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < dust.length; i++) {
      const p = dust[i];
      c.fillStyle = rgba(i % 3 === 0 ? CYN : VIO, p.a * 0.55);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawLockBox(e) {
    const c = ctx;
    const i = e.lockI;
    if (i < 0) return;
    const flash = (G.t * 8 + i) % 1 > 0.5;
    c.save();
    c.strokeStyle = rgba(flash ? WHT : GOLD, 0.95);
    c.lineWidth = Math.max(1.2, 1.5 * scale);
    const r = (e.r + 8) * (isGround(e) ? 0.82 : 1);
    c.strokeRect(sx(e.x - r), sy(e.y - r), r * 2 * scale, r * 2 * scale);
    c.fillStyle = rgba(GOLD, 0.95);
    c.font = (10 * scale) + 'px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(String(i + 1), sx(e.x), sy(e.y - r - 4));
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const ground = isGround(e);
    const s = ground ? 0.82 : 1;
    if (ground) {
      c.save();
      c.globalAlpha = 0.85;
      c.fillStyle = 'rgba(8,4,16,0.45)';
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y + 8), e.r * 0.9 * scale, e.r * 0.35 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(VIO, 0.16);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 62 * scale, 40 * scale, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : GOLD, 0.5);
      c.lineWidth = Math.max(1.2, 1.6 * scale);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), (48 + Math.sin(e.spin * 2) * 4) * scale, 0, TAU);
      c.stroke();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.94);
      pathHex(c, e.x, e.y, 36, e.spin * 0.2);
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : VIO, 0.95);
      c.lineWidth = Math.max(1.5, 1.9 * scale);
      pathHex(c, e.x, e.y, 36, e.spin * 0.2);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : MAG, 0.9);
      pathDia(c, e.x, e.y, 16, e.spin * 0.4);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 7 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 40), sy(e.y - e.r - 18), 80 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : VIO, 0.95);
      c.fillRect(sx(e.x - 40), sy(e.y - e.r - 18), 80 * ratio * scale, 5 * scale);
      return;
    }
    if (e.kind === 'core') {
      c.fillStyle = rgba(DEEP, 0.9);
      pathHex(c, e.x, e.y, e.r * s, e.t);
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : GOLD, 0.9);
      c.lineWidth = Math.max(1.1, 1.4 * scale);
      pathHex(c, e.x, e.y, e.r * s, e.t);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : MAG, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 4.5 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'turret' || e.kind === 'tank' || e.kind === 'silo' || e.kind === 'node') {
      c.fillStyle = rgba(DEEP, 0.92);
      if (e.kind === 'silo') pathHex(c, e.x, e.y, (e.r + 2) * s, 0);
      else pathDia(c, e.x, e.y, (e.r + 2) * s, 0);
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : VIO, 0.85);
      c.lineWidth = Math.max(1, 1.3 * scale);
      if (e.kind === 'silo') pathHex(c, e.x, e.y, (e.r + 2) * s, 0);
      else pathDia(c, e.x, e.y, (e.r + 2) * s, 0);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : (e.kind === 'node' ? GOLD : MAG), 0.88);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), (e.kind === 'node' ? 2.4 : 3.4) * s * scale, 0, TAU);
      c.fill();
      if (e.kind === 'tank') {
        c.strokeStyle = rgba(LAV, 0.7);
        c.lineWidth = Math.max(1, scale);
        c.beginPath();
        c.moveTo(sx(e.x - 10 * s), sy(e.y + 8 * s));
        c.lineTo(sx(e.x + 10 * s), sy(e.y + 8 * s));
        c.stroke();
      }
      return;
    }
    if (e.kind === 'pod' || e.kind === 'elite' || e.kind === 'wing') {
      c.fillStyle = rgba(DEEP, 0.92);
      pathHex(c, e.x, e.y, e.r, e.spin || e.t);
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : (e.kind === 'elite' ? GOLD : CYN), 0.9);
      c.lineWidth = Math.max(1.1, 1.4 * scale);
      pathHex(c, e.x, e.y, e.r, e.spin || e.t);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : MAG, 0.9);
      pathDia(c, e.x, e.y, 6, e.t);
      c.fill();
      return;
    }
    c.fillStyle = rgba(flash ? WHT : DEEP, 0.94);
    c.beginPath();
    c.moveTo(sx(e.x), sy(e.y + 10));
    c.lineTo(sx(e.x + 10), sy(e.y - 4));
    c.lineTo(sx(e.x), sy(e.y - 8));
    c.lineTo(sx(e.x - 10), sy(e.y - 4));
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(flash ? WHT : (e.kind === 'dive' ? MAG : LAV), 0.9);
    c.lineWidth = Math.max(1, 1.2 * scale);
    c.stroke();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(LAV, 0.95);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), 2.2 * scale, 7 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.85);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), 1.1 * scale, 4 * scale, 0, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawBullets() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.4 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawLasers() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.lasers.length; i++) {
      const L = G.lasers[i];
      if (L.delay > 0) continue;
      const cx = (L.sx + L.tx) * 0.5;
      const cy = Math.max(L.sy, L.ty) + 48;
      c.beginPath();
      c.moveTo(sx(L.sx), sy(L.sy));
      c.quadraticCurveTo(sx(cx), sy(cy), sx(L.x), sy(L.y));
      c.strokeStyle = rgba(VIO, 0.55);
      c.lineWidth = Math.max(2.4, 4.2 * scale);
      c.stroke();
      c.strokeStyle = rgba(GOLD, 0.9);
      c.lineWidth = Math.max(1.1, 1.8 * scale);
      c.stroke();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(L.x), sy(L.y), 3.4 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawLockLinks() {
    const c = ctx;
    if (G.locks.length <= 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.setLineDash([4 * scale, 5 * scale]);
    for (let i = 0; i < G.locks.length; i++) {
      const e = G.locks[i];
      if (!e || !e.alive) continue;
      c.strokeStyle = rgba(GOLD, 0.35 + i * 0.05);
      c.lineWidth = Math.max(0.8, scale);
      c.beginPath();
      c.moveTo(sx(G.ship.x), sy(G.ship.y - 10));
      const cx = (G.ship.x + e.x) * 0.5;
      const cy = Math.max(G.ship.y, e.y) + 28;
      c.quadraticCurveTo(sx(cx), sy(cy), sx(e.x), sy(e.y));
      c.stroke();
    }
    c.setLineDash([]);
    c.restore();
  }

  function drawSight() {
    if (G.mode === 'lose' || G.deadT > 0) return;
    const c = ctx;
    const x = G.ship.x;
    const y = sightY();
    const pulse = G.holding ? 1 + G.sightPulse * 2 : 0.7 + Math.sin(G.t * 5) * 0.08;
    const r = 16 * pulse;
    c.save();
    c.strokeStyle = rgba(G.holding ? GOLD : VIO, G.holding ? 0.95 : 0.55);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    c.strokeRect(sx(x - r), sy(y - r), r * 2 * scale, r * 2 * scale);
    c.beginPath();
    c.moveTo(sx(x), sy(y - r - 5));
    c.lineTo(sx(x), sy(y - r + 5));
    c.moveTo(sx(x), sy(y + r - 5));
    c.lineTo(sx(x), sy(y + r + 5));
    c.moveTo(sx(x - r - 5), sy(y));
    c.lineTo(sx(x - r + 5), sy(y));
    c.moveTo(sx(x + r - 5), sy(y));
    c.lineTo(sx(x + r + 5), sy(y));
    c.stroke();
    if (G.holding) {
      c.fillStyle = rgba(GOLD, 0.18);
      c.beginPath();
      c.arc(sx(x), sy(y), SIGHT_R * 0.55 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const c = ctx;
    const x = G.ship.x;
    const y = G.ship.y;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(VIO, 0.28);
    c.beginPath();
    c.ellipse(sx(x), sy(y + 10), 10 * scale, 16 * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    c.fillStyle = rgba(DEEP, 0.95);
    pathShip(c, x, y, 1);
    c.fill();
    c.strokeStyle = rgba(LAV, 0.95);
    c.lineWidth = Math.max(1.2, 1.5 * scale);
    pathShip(c, x, y, 1);
    c.stroke();
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.moveTo(sx(x - 6.5), sy(y - 15));
    c.lineTo(sx(x - 4), sy(y - 6));
    c.lineTo(sx(x - 2), sy(y - 8));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(x + 6.5), sy(y - 15));
    c.lineTo(sx(x + 4), sy(y - 6));
    c.lineTo(sx(x + 2), sy(y - 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.9);
    c.beginPath();
    c.arc(sx(x), sy(y + 2), 2.6 * scale, 0, TAU);
    c.fill();
    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x - 8), sy(y - 18), 4 * scale, 0, TAU);
      c.fill();
      c.beginPath();
      c.arc(sx(x + 8), sy(y - 18), 4 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / 0.4, 0, 1);
      c.fillStyle = rgba(q.rgb, a);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (6 + s.t * 42) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    c.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      c.font = ((f.gold ? 13 : 11) * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#0a0612';
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
    ctx.fillStyle = '#0a0612';
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
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && isGround(G.enemies[i])) drawEnemy(G.enemies[i]);
    }
    drawLockLinks();
    drawLasers();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && !isGround(G.enemies[i])) drawEnemy(G.enemies[i]);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].lockI >= 0) drawLockBox(G.enemies[i]);
    }
    drawShots();
    drawBullets();
    drawSight();
    drawShip();
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
      startGame('lay');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
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
    if (k === 'Shift' || k === 'z' || k === 'Z') {
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
        if (!e.repeat) tryBomb();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
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
      startGame('lay');
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

  seedDust();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnLay) {
    btnLay.addEventListener('click', function () {
      audio.ensure();
      startGame('lay');
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
      startGame(G.kind || 'lay');
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
  function bindBomb(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      tryBomb();
    });
  }
  bindBomb(btnBomb);
  bindBomb(btnPad);

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
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
