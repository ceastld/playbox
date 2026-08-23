'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const BOMB_CAP = 6;
  const BOMB_START = 3;
  const LOCK_MAX = 8;
  const HIT_R = 4.6;
  const SHOT_V = 680;
  const BEST_KEY = 'playbox-raystorm-best';
  const MUTE_KEY = 'playbox-raystorm-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [10, 190, 255];
  const SKY = [122, 223, 255];
  const HOT = [61, 255, 208];
  const GOLD = [255, 227, 107];
  const WHT = [230, 247, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const VIO = [122, 140, 255];
  const DEEP = [6, 32, 40];

  const SCORE = {
    dart: 50,
    dive: 80,
    prism: 130,
    turret: 160,
    ring: 220,
    elite: 280,
    pod: 300,
    boss: 10000,
    chip: 10,
    stage: 2000,
    lock: 50
  };

  const STAGES = [
    {
      name: '霓轨',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.5, kind: 'v', n: 7 },
        { t: 8.0, kind: 'turrets' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'prism' },
        { t: 15.2, kind: 'v', n: 7 },
        { t: 17.6, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '裂城',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.5, kind: 'dive', n: 5 },
        { t: 4.6, kind: 'stream', dir: -1 },
        { t: 6.6, kind: 'prism' },
        { t: 8.2, kind: 'ring' },
        { t: 10.2, kind: 'turrets' },
        { t: 12.2, kind: 'elite' },
        { t: 14.4, kind: 'v', n: 9 },
        { t: 16.6, kind: 'dive', n: 6 },
        { t: 18.8, kind: 'ring' }
      ]
    },
    {
      name: '核芯',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.3, kind: 'dive', n: 5 },
        { t: 4.2, kind: 'elite' },
        { t: 6.2, kind: 'ring' },
        { t: 8.0, kind: 'prism' },
        { t: 9.6, kind: 'v', n: 9 },
        { t: 13.2, kind: 'boss' }
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
  const btnStorm = document.getElementById('btn-storm');
  const btnNuke = document.getElementById('btn-nuke');
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
  const wpnLabel = document.getElementById('wpn-label');
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
  let wpnTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const dust = [];
  const city = [];
  const pulses = [];

  const G = {
    mode: 'title',
    kind: 'storm',
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
    bombs: BOMB_START,
    bombT: 0,
    next1up: LIFE_EVERY,
    enemies: [],
    shots: [],
    bullets: [],
    locks: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    fireCd: 0,
    lockCd: 0,
    laserT: 0,
    fullSaid: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    lockGlow: 0
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
  function isNuke() {
    return G.kind === 'nuke';
  }
  function dens() {
    return isNuke() ? 1.34 : 1;
  }
  function shipSpeed() {
    return isNuke() ? 320 : 278;
  }
  function fireRate() {
    return isNuke() ? 0.074 : 0.088;
  }
  function bulletSpd() {
    return isNuke() ? 186 : 140;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isNuke() ? 122 : 86;
  }
  function hpMul() {
    return isNuke() ? 1.26 : 1;
  }
  function lockInterval() {
    return isNuke() ? 0.06 : 0.078;
  }
  function lockDmg(n) {
    if (n >= 8) return 3;
    if (n >= 4) return 2;
    return 1;
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
      this.beep(880, 0.038, 'square', 0.022, 1540);
    },
    lock(n) {
      this.ensure();
      const lift = 1 + Math.min(1.1, (n - 1) * 0.12);
      this.beep(740 * lift, 0.045, 'sine', 0.034, 1320 * lift);
      this.beep(1180 * lift, 0.06, 'triangle', 0.02, 1760 * lift);
    },
    laser(n) {
      this.ensure();
      const lift = 1 + Math.min(0.8, n * 0.07);
      this.beep(280 * lift, 0.07, 'sawtooth', 0.03, 90);
      this.beep(720 * lift, 0.08, 'triangle', 0.026, 1480 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, 0.024, 1500);
      this.beep(620 * lift, 0.05, 'square', 0.03, 980 * lift);
    },
    lockKill(n) {
      this.ensure();
      const lift = 1 + Math.min(0.9, n * 0.08);
      this.beep(420 * lift, 0.08, 'sawtooth', 0.04, 160);
      this.beep(980 * lift, 0.1, 'triangle', 0.032, 1680 * lift);
      this.noise(0.05, 0.03, 700);
    },
    full() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.042, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1175);
      this.beep(1568, 0.16, 'sine', 0.034, 2093);
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
    bomb() {
      this.ensure();
      this.noise(0.22, 0.06, 280);
      this.beep(180, 0.26, 'sawtooth', 0.05, 48);
      this.beep(520, 0.18, 'triangle', 0.036, 180);
      this.beep(1100, 0.22, 'sine', 0.03, 420);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.028, 90);
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
      kick(3.0, 'lock');
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '光暴';
      else if (hasBoss()) stageLabel.textContent = '核芯';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isNuke() ? '核锁' : '光暴';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isNuke());
      tagLabel.classList.toggle('hot', G.locks.length >= 8);
    }
    const n = G.locks.length;
    if (wpnLabel) {
      wpnLabel.textContent = n > 0 ? '锁 ' + n : '炮';
      wpnLabel.classList.toggle('lock', n >= 4);
    }
    if (lockBar) lockBar.style.transform = 'scaleX(' + clamp(n / LOCK_MAX, 0, 1) + ')';
    if (lockWrap) {
      lockWrap.classList.toggle('hot', n >= 4 && n < 8);
      lockWrap.classList.toggle('full', n >= 8);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('low', G.bombs <= 0);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格锁定缎带激光', 'warn');
    else if (G.mode === 'win') setHint('核芯已碎 · R 再来', 'hot');
    else if (n >= 8) setHint('满锁 · 缎带全开', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 锁满再打', 'warn');
    else setHint('空格连射锁定 · 缎带激光缠敌 · Shift 爆弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RSTM';
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
    capArr(sparks, 36);
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
    capArr(floats, 20);
  }

  function explode(x, y, rgb, power) {
    const p = power || 16;
    burst(x, y, rgb, Math.min(30, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function seedDust() {
    dust.length = 0;
    for (let i = 0; i < 72; i++) {
      dust.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.12, 0.58),
        z: rand(0.32, 1.2)
      });
    }
  }

  function seedCity() {
    city.length = 0;
    for (let i = 0; i < 28; i++) {
      const left = i < 14;
      city.push({
        x: left ? rand(-8, 96) : rand(VW - 96, VW + 8),
        y: rand(0, VH),
        w: rand(16, 44),
        h: rand(36, 130),
        z: rand(0.35, 1.05),
        a: rand(0.18, 0.42)
      });
    }
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'pod';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'dart',
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
      score: spec.score || SCORE.dart,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0
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
      r: r || 3.5,
      life: 8
    });
    capArr(G.bullets, isNuke() ? 280 : 220);
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

  function spawnDart(x, y, vx, vy) {
    spawnEnemy({
      kind: 'dart',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 98 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.dart,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    const extra = isNuke() ? 2 : 0;
    const total = n + extra;
    for (let i = 0; i < total; i++) {
      const k = i - (total - 1) * 0.5;
      spawnDart(c + k * 36, -26 - Math.abs(k) * 16, 0, 102 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isNuke() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'dart',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 90 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.dart,
        fireCd: 0.7 + i * 0.12
      });
    }
  }

  function spawnDive(n) {
    const extra = isNuke() ? 1 : 0;
    for (let i = 0; i < n + extra; i++) {
      spawnEnemy({
        kind: 'dive',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vx: 0,
        vy: 70 * dens(),
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: 9
      });
    }
  }

  function spawnPrism() {
    spawnEnemy({
      kind: 'prism',
      x: VW * 0.5 + rand(-80, 80),
      y: -36,
      vy: 64 * dens(),
      hp: 5,
      r: 18,
      amp: 70,
      score: SCORE.prism,
      fireCd: 0.55
    });
    if (isNuke()) {
      spawnEnemy({
        kind: 'prism',
        x: VW * 0.5 + rand(-120, 120),
        y: -64,
        vy: 58 * dens(),
        hp: 5,
        r: 18,
        amp: 62,
        score: SCORE.prism,
        fireCd: 0.7
      });
    }
  }

  function spawnTurrets() {
    const xs = [90, 240, 390];
    for (let i = 0; i < xs.length; i++) {
      spawnEnemy({
        kind: 'turret',
        x: xs[i],
        y: -28 - i * 12,
        vy: 48 * dens(),
        hp: 6,
        r: 16,
        score: SCORE.turret,
        fireCd: 0.5 + i * 0.18
      });
    }
  }

  function spawnRing() {
    spawnEnemy({
      kind: 'ring',
      x: VW * 0.5,
      y: -40,
      vy: 52 * dens(),
      hp: 8,
      r: 20,
      amp: 88,
      score: SCORE.ring,
      fireCd: 0.7
    });
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: VW * 0.5,
      y: -44,
      vy: 46 * dens(),
      hp: 12,
      r: 22,
      amp: 96,
      score: SCORE.elite,
      fireCd: 0.6
    });
  }

  function spawnBoss() {
    toast('核芯', false, true);
    audio.wave();
    screenFlash(CYN, 0.28);
    spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: isNuke() ? 140 : 108,
      r: 46,
      score: SCORE.boss,
      enter: 1.4,
      fireCd: 1.1
    });
    const hpPod = isNuke() ? 18 : 14;
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 + 54,
      y: 80,
      hp: hpPod,
      r: 14,
      score: SCORE.pod,
      ang: 0,
      rad: 78,
      fireCd: 0.8
    });
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 - 54,
      y: 80,
      hp: hpPod,
      r: 14,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 78,
      fireCd: 1.05
    });
    syncHud();
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n || 5);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n || 4);
    else if (w.kind === 'prism') spawnPrism();
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'ring') spawnRing();
    else if (w.kind === 'elite') spawnElite();
    else if (w.kind === 'boss') spawnBoss();
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
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

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function inCone(e) {
    if (!e.alive) return false;
    if (e.y > G.ship.y - 16) return false;
    const dx = e.x - G.ship.x;
    const dy = G.ship.y - e.y;
    if (dy < 8 || dy > 310) return false;
    const half = 118 + dy * 0.22;
    return Math.abs(dx) < half;
  }

  function alreadyLocked(e) {
    for (let i = 0; i < G.locks.length; i++) {
      if (G.locks[i] === e) return true;
    }
    return false;
  }

  function pruneLocks() {
    for (let i = G.locks.length - 1; i >= 0; i--) {
      const e = G.locks[i];
      if (!e || !e.alive || e.y > VH + 20 || e.x < -40 || e.x > VW + 40) {
        G.locks.splice(i, 1);
      }
    }
    if (G.locks.length < LOCK_MAX) G.fullSaid = false;
  }

  function tryLock() {
    if (G.lockCd > 0) return;
    if (G.locks.length >= LOCK_MAX) return;
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!inCone(e) || alreadyLocked(e)) continue;
      const dx = e.x - G.ship.x;
      const dy = e.y - G.ship.y;
      const d = dx * dx + dy * dy * 0.55;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    if (!best) return;
    G.locks.push(best);
    G.lockCd = lockInterval();
    G.lockGlow = 0.12;
    spark(best.x, best.y, GOLD);
    if (G.mode !== 'play') return;
    audio.lock(G.locks.length);
    if (wpnLabel) {
      wpnLabel.classList.remove('hot');
      void wpnLabel.offsetWidth;
      wpnLabel.classList.add('hot');
      wpnTok += 1;
    }
    if (G.locks.length >= LOCK_MAX && !G.fullSaid) {
      G.fullSaid = true;
      toast('满锁', false, true);
      audio.full();
      hitStop(0.048);
      kick(3.6, 'lock');
      screenFlash(GOLD, 0.32);
      floatText(G.ship.x, G.ship.y - 40, '满锁', GOLD, true);
    }
    syncHud();
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.05;
    const n = isNuke() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const k = n === 2 ? (i === 0 ? -1 : 1) : (i - 1);
      G.shots.push({
        x: G.ship.x + k * 8,
        y: G.ship.y - 16,
        vx: k * 18,
        vy: -SHOT_V,
        r: 3.2,
        dmg: 1
      });
    }
    capArr(G.shots, 56);
    audio.shoot();
  }

  function tickLasers() {
    pruneLocks();
    const n = G.locks.length;
    if (n <= 0) return;
    const dmg = lockDmg(n);
    audio.laser(n);
    G.lockGlow = 0.1;
    for (let i = 0; i < n; i++) {
      const e = G.locks[i];
      if (!e || !e.alive) continue;
      pulses.push({
        e: e,
        t: 0,
        n: i,
        full: n >= 8
      });
      spark(e.x, e.y, n >= 8 ? GOLD : HOT);
      damageEnemy(e, dmg, 'lock');
    }
    capArr(pulses, 40);
    if (n >= 6) kick(1.8, 'lock');
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
    G.bombT = 0.45;
    G.invuln = Math.max(G.invuln, 0.45);
    audio.bomb();
    screenFlash(WHT, 0.72);
    explode(G.ship.x, G.ship.y, HOT, 36);
    ring(G.ship.x, G.ship.y, GOLD);
    ring(VW * 0.5, VH * 0.42, CYN);
    hitStop(0.078);
    kick(7.2, 'bomb');
    if (btnBomb) btnBomb.classList.add('on');
    if (btnPad) btnPad.classList.add('on');
    setTimeout(function () {
      if (btnBomb) btnBomb.classList.remove('on');
      if (btnPad) btnPad.classList.remove('on');
    }, 280);
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      burst(G.bullets[i].x, G.bullets[i].y, WHT, 3, 70);
    }
    G.bullets.length = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dmg = e.kind === 'boss' ? 12 : 7;
      damageEnemy(e, dmg, 'bomb');
    }
    syncHud();
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, GOLD);
      hitStop(0.03);
      audio.hit(G.combo);
      kick(1.5);
    }
    if (src === 'lock') {
      spark(e.x, e.y, HOT);
    }
    if (e.kind === 'boss' && src === 'shot') {
      addScore(SCORE.chip * Math.max(G.mult, G.locks.length || 1));
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'elite' || e.kind === 'ring' ? CYN : SKY;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 48 : e.kind === 'elite' ? 24 : 14);
    const n = Math.max(1, G.locks.length);
    let pts = Math.round(e.score * G.mult);
    if (src === 'lock') {
      pts += SCORE.lock * n;
      audio.lockKill(n);
      const stop = Math.min(0.072, 0.034 + n * 0.005);
      hitStop(stop);
      kick(2.4 + n * 0.22, 'lock');
      if (n >= 4) floatText(e.x, e.y - 18, '×' + n, GOLD, true);
    } else {
      audio.explode();
    }
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss' || src === 'lock' && n >= 4);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.4, 'boss');
      screenFlash(GOLD, 0.74);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, CYN);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      G.bullets.length = 0;
      G.locks.length = 0;
      G.invuln = 2;
      G.winT = 1.4;
      toast('核芯碎裂', false, true);
    } else if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'ring' || e.kind === 'prism') {
      hitStop(0.048);
      kick(3.0);
    }
    pruneLocks();
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.locks.length = 0;
    G.fullSaid = false;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, CYN, 18);
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
    G.locks.length = 0;
    G.fullSaid = false;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '同一层锁定，缎带激光缠上去。分数 ' + G.score + '。');
    setHint('R 重开 · 空格锁定缎带激光', 'warn');
  }

  function goWin() {
    addScore(isNuke() ? 16000 : 12000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isNuke() ? '核锁通关' : '核芯尽碎',
      '三关打穿，核芯已碎。分数 ' + G.score + (isNuke() ? ' · 核锁' : ' · 光暴') + '。'
    );
    setHint('核芯已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.locks.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    pulses.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * Math.max(G.mult, G.locks.length || 1)));
    if (G.bombs < BOMB_CAP) G.bombs += 1;
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '核芯'), false, true);
    audio.wave();
    screenFlash(CYN, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'nuke' ? 'nuke' : 'storm';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.bombs = BOMB_START;
    G.bombT = 0;
    G.next1up = LIFE_EVERY;
    G.fireCd = 0;
    G.lockCd = 0;
    G.laserT = 0;
    G.fullSaid = false;
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
    G.lockGlow = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isNuke() ? '核锁' : '光暴', isNuke(), !isNuke());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'storm';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.bombs = BOMB_START;
    G.deadT = 0;
    G.locks.length = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '光暴', '同一层锁定，缎带激光缠上去。锁得越多越痛。短关之后是核芯。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('storm');
    else startGame(G.kind || 'storm');
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
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].t += dt * 3.8;
      if (pulses[i].t >= 1 || !pulses[i].e || !pulses[i].e.alive) pulses.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.lockGlow > 0) G.lockGlow -= dt;
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
    for (let i = 0; i < city.length; i++) {
      const b = city[i];
      b.y += scr * 0.55 * b.z * dt;
      if (b.y > VH + b.h) {
        b.y = -b.h - rand(0, 80);
        const left = b.x < VW * 0.5;
        b.x = left ? rand(-8, 96) : rand(VW - 96, VW + 8);
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
    if (G.laserT > 0) G.laserT -= dt;
    if (G.bombT > 0) G.bombT -= dt;
    if (wantFire()) {
      fireShot();
      tryLock();
      if (G.laserT <= 0 && G.locks.length > 0) {
        G.laserT = 0.082;
        tickLasers();
      }
    } else if (G.mode === 'play' && G.deadT <= 0 && !overlayOpen()) {
      tryLock();
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
        if (!e.alive) continue;
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
    const wall = isNuke() ? 0.72 : 1;
    if (e.kind === 'dart') return 1.42 * wall;
    if (e.kind === 'prism') return 1.02 * wall;
    if (e.kind === 'turret') return 0.9 * wall;
    if (e.kind === 'ring') return 0.86 * wall;
    if (e.kind === 'elite') return 0.8 * wall;
    if (e.kind === 'pod') return 1.05 * wall;
    if (e.kind === 'boss') return 0.5 * wall;
    return 1.18 * wall;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'dart') {
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
    } else if (e.kind === 'prism') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      e.spin += dt * 1.8;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'turret') {
      e.y += e.vy * dt;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isNuke() ? 2 : 1, 0.16, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'ring') {
      e.x = e.baseX + Math.sin(e.t * 1.2 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 120 && e.vy > 20) e.vy = 20;
      e.spin += dt * 2.1;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 24) {
        ringFire(e, isNuke() ? 10 : 8, bulletSpd() * 0.78, e.spin);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      e.spin += dt * 1.4;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 5, 0.18, bulletSpd());
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
    } else if (e.kind === 'boss') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 122, 1 - Math.exp(-dt * 3.1));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.68) * 102;
        e.y = 122 + Math.sin(e.t * 1.05) * 12;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.35 : 2.5);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      const wall = isNuke() ? 0.76 : 1;
      if (ratio > 0.66) {
        aimedFire(e, 5, 0.2, spd);
        if (Math.random() < 0.5) ringFire(e, 10, spd * 0.7, e.spin);
        e.fireCd = 1.12 * wall;
      } else if (ratio > 0.33) {
        ringFire(e, 12, spd * 0.78, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.5 * wall;
      } else {
        ringFire(e, isNuke() ? 18 : 16, spd * 0.76, e.spin);
        ringFire(e, 10, spd * 0.54, -e.spin * 0.72);
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnDart(e.x - 42, e.y + 22, -30, 112);
          spawnDart(e.x + 42, e.y + 22, 30, 112);
        }
        e.fireCd = 0.4 * wall;
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
        if (e.kind !== 'boss' && e.kind !== 'pod') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt) {
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
      if (living() < 6 && ((G.t * 2) | 0) !== (((G.t - dt) * 2) | 0) && Math.random() < 0.42) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 50);
      }
      G.lockCd -= dt;
      tryLock();
      updateEnemies(dt);
      updateBullets(dt);
      updateWorld(dt * 0.55);
      pruneLocks();
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
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateWaves(dt);
    updateWorld(dt);
    pruneLocks();
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

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#030c12';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(80), 12 * scale, sx(VW * 0.5), sy(VH * 0.42), 420 * scale);
    g.addColorStop(0, 'rgba(10,190,255,0.12)');
    g.addColorStop(0.45, 'rgba(61,255,208,0.04)');
    g.addColorStop(1, 'rgba(4,20,28,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vpX = VW * 0.5;
    const vpY = -36;
    c.save();
    c.beginPath();
    c.rect(sx(0), sy(0), VW * scale, VH * scale);
    c.clip();
    c.strokeStyle = 'rgba(10,190,255,0.12)';
    c.lineWidth = Math.max(1, 0.8 * scale);
    for (let i = 0; i < 14; i++) {
      const y = ((G.scroll * 0.55 + i * 58) % (VH + 70)) - 20;
      const t = clamp(y / VH, 0, 1);
      const x0 = lerp(0, vpX, 1 - t * 0.55);
      const x1 = lerp(VW, vpX, 1 - t * 0.55);
      c.globalAlpha = 0.18 + t * 0.28;
      c.beginPath();
      c.moveTo(sx(x0), sy(y));
      c.lineTo(sx(x1), sy(y));
      c.stroke();
    }
    for (let k = -6; k <= 6; k++) {
      c.globalAlpha = 0.1;
      c.beginPath();
      c.moveTo(sx(vpX + k * 8), sy(vpY));
      c.lineTo(sx(vpX + k * 92), sy(VH + 8));
      c.stroke();
    }
    c.restore();

    for (let i = 0; i < city.length; i++) {
      const b = city[i];
      const a = b.a * (0.55 + b.z * 0.45);
      c.fillStyle = rgba(DEEP, a);
      c.fillRect(sx(b.x), sy(b.y), b.w * scale, b.h * scale);
      c.fillStyle = rgba(CYN, a * 0.35);
      c.fillRect(sx(b.x + 3), sy(b.y + 6), Math.max(2, (b.w - 8) * scale * 0.18), 3 * scale);
    }

    for (let i = 0; i < dust.length; i++) {
      const s = dust[i];
      c.fillStyle = rgba(SKY, s.a * 0.55);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.s * scale, 0, TAU);
      c.fill();
    }
  }

  function drawFacet(c, pts, fill, stroke, lw) {
    c.beginPath();
    c.moveTo(sx(pts[0][0]), sy(pts[0][1]));
    for (let i = 1; i < pts.length; i++) c.lineTo(sx(pts[i][0]), sy(pts[i][1]));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw || Math.max(1, 1.1 * scale);
      c.stroke();
    }
  }

  function drawEnemy(e) {
    const c = ctx;
    const x = e.x;
    const y = e.y;
    const flash = e.flash > 0;
    const body = flash ? WHT : (e.kind === 'boss' ? GOLD : e.kind === 'dive' ? MAG : CYN);
    const shade = flash ? SKY : (e.kind === 'boss' ? CYN : DEEP);

    if (e.kind === 'dart') {
      drawFacet(c, [[x, y - 12], [x + 9, y + 8], [x, y + 4], [x - 9, y + 8]], rgba(body, 0.92), rgba(HOT, 0.7), 1);
      drawFacet(c, [[x, y - 8], [x + 4, y + 2], [x - 4, y + 2]], rgba(WHT, 0.85));
    } else if (e.kind === 'dive') {
      drawFacet(c, [[x, y - 14], [x + 8, y + 10], [x - 8, y + 10]], rgba(body, 0.9), rgba(PNK, 0.6), 1);
      drawFacet(c, [[x - 10, y], [x - 4, y + 4], [x - 2, y - 2]], rgba(MAG, 0.7));
      drawFacet(c, [[x + 10, y], [x + 4, y + 4], [x + 2, y - 2]], rgba(MAG, 0.7));
    } else if (e.kind === 'prism') {
      const s = e.spin || 0;
      drawFacet(c, [
        [x + Math.cos(s) * 16, y + Math.sin(s) * 10],
        [x + Math.cos(s + 2.1) * 16, y + Math.sin(s + 2.1) * 10],
        [x + Math.cos(s + 4.2) * 16, y + Math.sin(s + 4.2) * 10]
      ], rgba(body, 0.88), rgba(HOT, 0.75), 1.2);
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(sx(x), sy(y), 3.2 * scale, 0, TAU);
      c.fill();
    } else if (e.kind === 'turret') {
      drawFacet(c, [[x - 12, y - 6], [x + 12, y - 6], [x + 10, y + 10], [x - 10, y + 10]], rgba(shade, 0.95), rgba(CYN, 0.6), 1);
      drawFacet(c, [[x - 7, y - 12], [x + 7, y - 12], [x + 5, y - 4], [x - 5, y - 4]], rgba(body, 0.9));
      c.fillStyle = rgba(HOT, 0.85);
      c.fillRect(sx(x - 2), sy(y - 18), 4 * scale, 10 * scale);
    } else if (e.kind === 'ring') {
      c.save();
      c.strokeStyle = rgba(body, 0.9);
      c.lineWidth = 2.2 * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), 16 * scale, 0, TAU);
      c.stroke();
      c.strokeStyle = rgba(HOT, 0.55);
      c.lineWidth = 1.2 * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), 10 * scale, e.spin, e.spin + 2.2);
      c.stroke();
      c.restore();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(sx(x), sy(y), 4 * scale, 0, TAU);
      c.fill();
    } else if (e.kind === 'elite') {
      pathDia(c, x, y, 18, e.spin * 0.2);
      c.fillStyle = rgba(body, 0.9);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.8);
      c.lineWidth = 1.4 * scale;
      c.stroke();
      pathDia(c, x, y, 8, -e.spin * 0.3);
      c.fillStyle = rgba(HOT, 0.85);
      c.fill();
    } else if (e.kind === 'pod') {
      c.save();
      c.strokeStyle = rgba(HOT, 0.7);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), 12 * scale, 0, TAU);
      c.stroke();
      c.restore();
      pathDia(c, x, y, 7, G.t * 2);
      c.fillStyle = rgba(body, 0.92);
      c.fill();
    } else if (e.kind === 'boss') {
      c.save();
      c.strokeStyle = rgba(GOLD, 0.55);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.ellipse(sx(x), sy(y), 42 * scale, 28 * scale, e.spin * 0.15, 0, TAU);
      c.stroke();
      c.strokeStyle = rgba(CYN, 0.7);
      c.beginPath();
      c.ellipse(sx(x), sy(y), 30 * scale, 20 * scale, -e.spin * 0.22, 0, TAU);
      c.stroke();
      c.restore();
      pathDia(c, x, y, 22, e.spin * 0.12);
      c.fillStyle = rgba(flash ? WHT : CYN, 0.92);
      c.fill();
      pathDia(c, x, y, 11, -e.spin * 0.2);
      c.fillStyle = rgba(GOLD, 0.95);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(y), 4.2 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(x - 28), sy(y - 40), 56 * scale, 4 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : GOLD, 0.95);
      c.fillRect(sx(x - 28), sy(y - 40), 56 * scale * ratio, 4 * scale);
    }
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), 2.2 * scale, 6 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y + 5), 1.2 * scale, 4 * scale, 0, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      c.fillStyle = rgba(MAG, 0.92);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.55);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.4 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function ribbonPoint(x0, y0, x1, y1, t, amp, phase) {
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    const len = hypot(nx, ny) || 1;
    const s = Math.sin(t * Math.PI + phase);
    return {
      x: lerp(x0, x1, t) + (nx / len) * s * amp,
      y: lerp(y0, y1, t) + (ny / len) * s * amp * 0.55
    };
  }

  function drawRibbon(x0, y0, x1, y1, rgb, amp, width, phase) {
    const c = ctx;
    c.beginPath();
    const p0 = ribbonPoint(x0, y0, x1, y1, 0, amp, phase);
    c.moveTo(sx(p0.x), sy(p0.y));
    for (let i = 1; i <= 10; i++) {
      const p = ribbonPoint(x0, y0, x1, y1, i / 10, amp, phase);
      c.lineTo(sx(p.x), sy(p.y));
    }
    c.strokeStyle = rgba(rgb, 0.82);
    c.lineWidth = width * scale;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();
  }

  function drawLocks() {
    const c = ctx;
    const n = G.locks.length;
    const firing = wantFire() || (G.mode === 'title' && n > 0);
    c.save();
    if (G.mode === 'play' && G.deadT <= 0) {
      c.fillStyle = rgba(CYN, 0.05 + (G.lockGlow > 0 ? 0.04 : 0));
      c.beginPath();
      c.moveTo(sx(G.ship.x), sy(G.ship.y - 12));
      c.lineTo(sx(G.ship.x - 168), sy(G.ship.y - 300));
      c.lineTo(sx(G.ship.x + 168), sy(G.ship.y - 300));
      c.closePath();
      c.fill();
    }
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const e = G.locks[i];
      if (!e || !e.alive) continue;
      const rgb = n >= 8 ? GOLD : (i % 2 === 0 ? CYN : HOT);
      if (firing) {
        const amp = 10 + i * 2.2 + Math.sin(G.t * 9 + i) * 3;
        drawRibbon(G.ship.x, G.ship.y - 14, e.x, e.y, rgb, amp, n >= 8 ? 3.2 : 2.1, G.t * 6 + i * 0.9);
        drawRibbon(G.ship.x, G.ship.y - 14, e.x, e.y, WHT, amp * 0.45, 1.1, G.t * 8 + i);
      } else {
        c.strokeStyle = rgba(rgb, 0.35);
        c.lineWidth = 1 * scale;
        c.setLineDash([4 * scale, 5 * scale]);
        c.beginPath();
        c.moveTo(sx(G.ship.x), sy(G.ship.y - 12));
        c.lineTo(sx(e.x), sy(e.y));
        c.stroke();
        c.setLineDash([]);
      }
      const rr = e.r + 8;
      c.strokeStyle = rgba(rgb, 0.95);
      c.lineWidth = 1.5 * scale;
      pathDia(c, e.x, e.y, rr, 0);
      c.stroke();
      pathDia(c, e.x, e.y, rr - 3, TAU / 8);
      c.strokeStyle = rgba(GOLD, 0.55);
      c.stroke();
      c.fillStyle = rgba(GOLD, 0.95);
      c.font = (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(String(i + 1), sx(e.x), sy(e.y - rr - 8));
    }
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      if (!p.e || !p.e.alive) continue;
      const q = ribbonPoint(G.ship.x, G.ship.y - 14, p.e.x, p.e.y, p.t, 12 + p.n, G.t * 6);
      c.fillStyle = rgba(p.full ? GOLD : WHT, 1 - p.t);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), (3.2 + (1 - p.t) * 3) * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(G.locks.length >= 8 ? GOLD : CYN, 0.2 + (G.muzzle > 0 ? 0.2 : 0));
    c.beginPath();
    c.ellipse(sx(x), sy(y), 18 * scale, 12 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(HOT, 0.55);
    c.beginPath();
    c.moveTo(sx(x - 4), sy(y + 10));
    c.lineTo(sx(x - 7), sy(y + 20 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x - 1), sy(y + 10));
    c.fill();
    c.beginPath();
    c.moveTo(sx(x + 4), sy(y + 10));
    c.lineTo(sx(x + 7), sy(y + 20 + Math.sin(G.t * 28 + 1) * 2));
    c.lineTo(sx(x + 1), sy(y + 10));
    c.fill();
    c.restore();

    drawFacet(c, [[x, y - 6], [x + 26, y + 10], [x + 10, y + 8]], rgba(CYN, 0.88));
    drawFacet(c, [[x, y - 6], [x - 26, y + 10], [x - 10, y + 8]], rgba(CYN, 0.78));
    drawFacet(c, [[x, y - 20], [x + 7, y + 8], [x - 7, y + 8]], rgba(SKY, 0.96), rgba(HOT, 0.85), 1.2);
    drawFacet(c, [[x, y - 12], [x + 4, y + 2], [x - 4, y + 2]], rgba(WHT, 0.95));
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y - 2), 2.4 * scale, 0, TAU);
    c.fill();

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 18), 5 * scale, 0, TAU);
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
    c.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
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
    ctx.fillStyle = '#04141c';
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
    ctx.fillStyle = '#04141c';
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
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
    drawShots();
    drawLocks();
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
      startGame('storm');
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
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || k === 'Shift' || k === 'z' || k === 'Z')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === 'Shift' || k === 'z' || k === 'Z' || k === 'x' || k === 'X') {
      inputSrc = 'key';
      e.preventDefault();
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
      startGame('storm');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('nuke');
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
  seedCity();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
    });
  }
  if (btnNuke) {
    btnNuke.addEventListener('click', function () {
      audio.ensure();
      startGame('nuke');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'storm');
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
  if (btnBomb) {
    btnBomb.addEventListener('click', function () {
      tryBomb();
    });
  }
  if (btnPad) {
    btnPad.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      tryBomb();
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
