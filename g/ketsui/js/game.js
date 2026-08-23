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
  const SHOT_V = 740;
  const CHIP_MAX = 8;
  const CHIP_RATE = 5.8;
  const CHIP_FIRE = 0.07;
  const LOCK_LEN = 252;
  const BEST_KEY = 'playbox-ketsui-best';
  const MUTE_KEY = 'playbox-ketsui-mute';
  const AUTO_SPEED_KEY = 'playbox-ketsui-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · Shift / Z 锁芯 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [255, 154, 98];
  const GOLD = [255, 194, 74];
  const HOT = [255, 58, 34];
  const CRIM = [224, 24, 40];
  const WHT = [255, 232, 224];
  const PNK = [255, 154, 212];
  const STEEL = [200, 208, 216];
  const DEEP = [28, 10, 10];
  const AMB = [255, 154, 58];

  const SCORE = {
    drone: 50,
    dive: 80,
    tank: 120,
    turret: 150,
    gun: 180,
    elite: 240,
    pod: 280,
    boss: 8000,
    chip: 14,
    stage: 1500
  };

  const STAGES = [
    {
      name: '关口',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.4, kind: 'turrets' },
        { t: 7.8, kind: 'v', n: 7 },
        { t: 10.2, kind: 'tanks' },
        { t: 12.6, kind: 'dive', n: 4 },
        { t: 14.8, kind: 'gun' },
        { t: 17.2, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '堑壕',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'dive', n: 5 },
        { t: 4.4, kind: 'turrets' },
        { t: 6.4, kind: 'gun' },
        { t: 8.2, kind: 'tanks' },
        { t: 10.0, kind: 'elite' },
        { t: 12.2, kind: 'v', n: 9 },
        { t: 14.4, kind: 'stream', dir: 1 },
        { t: 16.6, kind: 'dive', n: 6 },
        { t: 18.6, kind: 'gun' }
      ]
    },
    {
      name: '堡核',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'tanks' },
        { t: 4.0, kind: 'elite' },
        { t: 6.0, kind: 'turrets' },
        { t: 8.0, kind: 'gun' },
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
  const btnRush = document.getElementById('btn-rush');
  const btnSea = document.getElementById('btn-sea');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLock = document.getElementById('btn-lock');
  const btnPad = document.getElementById('btn-pad');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const chipLabel = document.getElementById('chip-label');
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
  let chipTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, lock: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];

  const G = {
    mode: 'title',
    kind: 'rush',
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
    enemies: [],
    shots: [],
    bullets: [],
    chips: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    lock: false,
    lockT: 0,
    lockBuzz: 0,
    chipCd: 0,
    chipN: 0,
    chipPulse: 0,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = VW * 0.5;
  let autoTy = VH - 78;
  let autoStickS = -1e9;
  let autoOvWait = 0;

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
  function isSea() {
    return G.kind === 'sea';
  }
  function dens() {
    return isSea() ? 1.28 : 1;
  }
  function shipSpeed() {
    const base = isSea() ? 318 : 276;
    return G.lock ? base * 0.72 : base;
  }
  function fireRate() {
    const base = isSea() ? 0.076 : 0.09;
    return G.lock ? base * 1.08 : base;
  }
  function bulletSpd() {
    return isSea() ? 186 : 146;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isSea() ? 124 : 88;
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function isGround(e) {
    return e.kind === 'tank' || e.kind === 'turret';
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
      this.beep(G.lock ? 720 : 880, 0.042, 'square', 0.026, G.lock ? 1480 : 1640);
    },
    lockOn() {
      this.ensure();
      this.beep(220, 0.12, 'sawtooth', 0.046, 90);
      this.beep(880, 0.14, 'square', 0.036, 1760);
      this.beep(1320, 0.18, 'triangle', 0.03, 1980);
      this.noise(0.1, 0.04, 700);
    },
    lockHum() {
      this.ensure();
      this.beep(180, 0.08, 'sawtooth', 0.018, 110);
      this.beep(1240, 0.05, 'triangle', 0.014, 1680);
    },
    chip() {
      this.ensure();
      this.beep(980, 0.05, 'triangle', 0.028, 1640);
      this.beep(1480, 0.06, 'sine', 0.018, 1980);
    },
    chipHit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.03);
      this.beep(760 * lift, 0.055, 'square', 0.032, 1220 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1400);
      this.beep(640 * lift, 0.055, 'square', 0.036, 980 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 500);
      this.beep(280, 0.14, 'sawtooth', 0.045, 70);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.055, 'sawtooth', 0.038, 180);
      this.beep(620, 0.07, 'square', 0.03, 880);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 280);
      this.beep(180, 0.28, 'sawtooth', 0.05, 50);
      this.beep(520, 0.2, 'triangle', 0.04, 220);
      this.beep(1040, 0.32, 'sine', 0.04, 1560);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(320, 0.16, 'sawtooth', 0.05, 90);
      this.beep(180, 0.28, 'sine', 0.045, 50);
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
    },
    full() {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.04, 1320);
      this.beep(1320, 0.12, 'triangle', 0.034, 1760);
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

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
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
      hitStop(0.055);
      kick(3.2);
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

  function countChips() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += G.enemies[i].chips | 0;
    }
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '决战';
      else if (hasBoss()) stageLabel.textContent = '堡主';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '弹海' : '突入';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.lock);
    }
    G.chipN = countChips();
    if (chipLabel) {
      chipLabel.textContent = '芯 ' + G.chipN;
      chipLabel.classList.toggle('hot', G.lock || G.chipN >= 8);
    }
    if (lockBar) {
      const p = clamp(G.lockT / 0.22 + G.chipN / 16, 0, 1);
      lockBar.style.transform = 'scaleX(' + p + ')';
    }
    if (lockWrap) lockWrap.classList.toggle('hot', G.lock);
    if (btnLock) btnLock.classList.toggle('on', G.lock);
    if (btnPad) btnPad.classList.toggle('on', G.lock);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · R 重开接着打', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格点射，按住锁芯', 'warn');
    else if (G.mode === 'win') setHint('堡核已碎 · R 再来', 'hot');
    else if (G.lock) setHint('锁芯贴敌 · 舰身变慢 · 芯弹追击', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 锁芯续链', 'warn');
    else setHint('空格点射 · Shift 锁芯贴敌 · 打堡主 · A 自动', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'KETU';
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
        g: 180,
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
    for (let i = 0; i < 64; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.0),
        a: rand(0.12, 0.55),
        z: rand(0.35, 1.15)
      });
    }
  }

  function spawnEnemy(spec) {
    const scaled = spec.kind !== 'boss' && spec.kind !== 'pod';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (scaled ? hpMul() : 1)));
    const e = {
      alive: true,
      kind: spec.kind || 'drone',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 92 * dens() : spec.vy,
      hp: spec.kind === 'boss' || spec.kind === 'pod' ? spec.hp : hp,
      maxHp: spec.kind === 'boss' || spec.kind === 'pod' ? spec.hp : hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.drone,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      chips: 0,
      chipHold: 0,
      wasFull: false,
      ground: spec.kind === 'tank' || spec.kind === 'turret'
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

  function spawnDrone(x, y, vx, vy) {
    spawnEnemy({
      kind: 'drone',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.drone,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnDrone(c + k * 36, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isSea() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'drone',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.drone,
        fireCd: 0.7 + i * 0.12
      });
    }
  }

  function spawnDive(n) {
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'dive',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vy: 40,
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: 99
      });
    }
  }

  function spawnTurrets() {
    const n = isSea() ? 5 : 4;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'turret',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18 - (i % 2) * 22,
        vy: 48 * dens(),
        hp: 8,
        r: 15,
        score: SCORE.turret,
        fireCd: 0.5 + i * 0.12
      });
    }
  }

  function spawnTanks() {
    const n = isSea() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'tank',
        x: 80 + i * ((VW - 160) / Math.max(1, n - 1)),
        y: -28 - i * 14,
        vy: 56 * dens(),
        vx: (i % 2 === 0 ? 1 : -1) * 28,
        hp: 6,
        r: 16,
        amp: 70,
        score: SCORE.tank,
        fireCd: 0.6 + i * 0.1
      });
    }
  }

  function spawnGun(x) {
    spawnEnemy({
      kind: 'gun',
      x: x == null ? (Math.random() < 0.5 ? 130 : 350) : x,
      y: -32,
      vy: 62 * dens(),
      hp: 7,
      r: 16,
      amp: 72,
      score: SCORE.gun,
      fireCd: 0.42
    });
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: 150,
      vy: 58 * dens(),
      hp: 10,
      r: 17,
      amp: 86,
      score: SCORE.elite,
      fireCd: 0.5
    });
    spawnEnemy({
      kind: 'elite',
      x: 330,
      vy: 58 * dens(),
      hp: 10,
      r: 17,
      amp: 86,
      phase: 1.6,
      score: SCORE.elite,
      fireCd: 0.7
    });
    if (isSea()) {
      spawnEnemy({
        kind: 'elite',
        x: 240,
        vy: 52 * dens(),
        hp: 10,
        r: 17,
        amp: 40,
        phase: 0.8,
        score: SCORE.elite,
        fireCd: 0.62
      });
    }
  }

  function spawnBoss() {
    const sea = isSea();
    const boss = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: sea ? 118 : 96,
      r: 38,
      score: SCORE.boss,
      enter: 1.35,
      fireCd: 0.9
    });
    boss.maxHp = boss.hp;
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 + 78,
      y: 30,
      hp: sea ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: 0,
      rad: 86,
      fireCd: 0.8
    });
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 - 78,
      y: 30,
      hp: sea ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 86,
      fireCd: 1.05
    });
    toast('堡主', false, true);
    audio.wave();
    screenFlash(HOT, 0.36);
    kick(4.6, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isSea() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isSea() ? 1 : 0));
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'tanks') spawnTanks();
    else if (w.kind === 'gun') {
      spawnGun(140);
      spawnGun(340);
      if (isSea()) spawnGun(240);
    } else if (w.kind === 'elite') spawnElite();
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

  function inLockCone(e) {
    const dy = G.ship.y - e.y;
    if (dy < 8 || dy > LOCK_LEN) return false;
    const t = clamp(dy / LOCK_LEN, 0, 1);
    const hw = lerp(32, 94, t);
    return Math.abs(e.x - G.ship.x) < hw + e.r * 0.6;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function wantLock() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && keys.lock;
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.055;
    if (G.lock) {
      const spread = 0.09;
      for (let i = -1; i <= 1; i += 2) {
        const a = -Math.PI * 0.5 + i * spread;
        G.shots.push({
          x: G.ship.x + i * 5,
          y: G.ship.y - 14,
          vx: Math.cos(a) * SHOT_V,
          vy: Math.sin(a) * SHOT_V,
          r: 3.2,
          dmg: 1.2,
          lock: true
        });
      }
    } else {
      const spread = 0.2;
      for (let i = -1; i <= 1; i++) {
        const a = -Math.PI * 0.5 + i * spread;
        G.shots.push({
          x: G.ship.x + i * 7,
          y: G.ship.y - 14,
          vx: Math.cos(a) * SHOT_V,
          vy: Math.sin(a) * SHOT_V,
          r: 3.4,
          dmg: 1,
          lock: false
        });
      }
    }
    capArr(G.shots, 52);
    audio.shoot();
  }

  function pickChipTarget() {
    let best = null;
    let bestC = 0.4;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.chips < 1) continue;
      const score = e.chips + (inLockCone(e) ? 1.5 : 0) + (e.kind === 'boss' ? 0.8 : 0);
      if (score > bestC) {
        bestC = score;
        best = e;
      }
    }
    return best;
  }

  function fireChip() {
    if (G.chipCd > 0) return;
    const t = pickChipTarget();
    if (!t) return;
    G.chipCd = CHIP_FIRE;
    const side = (G.chips.length & 1) ? -1 : 1;
    G.chips.push({
      x: G.ship.x + side * 10,
      y: G.ship.y - 12,
      vx: side * 40,
      vy: -420,
      target: t,
      r: 4.2,
      dmg: 1.15 + t.chips * 0.14,
      life: 1.6
    });
    capArr(G.chips, 36);
    audio.chip();
  }

  function engageLock() {
    G.lock = true;
    audio.lockOn();
    hitStop(0.042);
    kick(3.6, 'lock');
    screenFlash(GOLD, 0.32);
    ring(G.ship.x, G.ship.y - 16, GOLD);
    burst(G.ship.x, G.ship.y - 18, GOLD, 14, 170);
    floatText(G.ship.x, G.ship.y - 32, '锁', GOLD, true);
    syncHud();
  }

  function applyLock(dt) {
    let tagged = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (!inLockCone(e)) continue;
      const prev = e.chips;
      e.chips = Math.min(CHIP_MAX, e.chips + CHIP_RATE * dt);
      e.chipHold = 3.4;
      tagged += 1;
      if (prev < CHIP_MAX && e.chips >= CHIP_MAX && !e.wasFull) {
        e.wasFull = true;
        floatText(e.x, e.y - e.r - 8, '满锁', GOLD, true);
        audio.full();
        spark(e.x, e.y, GOLD);
        hitStop(0.03);
        chipTok += 1;
        if (chipLabel) {
          chipLabel.classList.remove('hot');
          void chipLabel.offsetWidth;
          chipLabel.classList.add('hot');
        }
      }
    }
    fireChip();
    G.lockBuzz -= dt;
    if (G.lockBuzz <= 0 && tagged > 0) {
      G.lockBuzz = 0.11;
      audio.lockHum();
    }
  }

  function decayChips(e, dt) {
    if (G.lock && inLockCone(e)) return;
    e.chipHold -= dt;
    if (e.chipHold <= 0 && e.chips > 0) {
      e.chips = Math.max(0, e.chips - dt * 2.4);
      if (e.chips < CHIP_MAX - 0.2) e.wasFull = false;
    }
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, GOLD);
      hitStop(0.034);
      audio.hit(G.combo);
      kick(1.7);
    } else if (src === 'chip') {
      spark(e.x, e.y, GOLD);
      audio.chipHit(G.combo);
      G.chipPulse += 1;
      if (G.chipPulse % 3 === 0) {
        hitStop(0.028);
        kick(1.4);
      }
      addScore(Math.round(SCORE.chip * G.mult * (1 + e.chips * 0.12)));
    }
    if (e.kind === 'boss' && src !== 'chip') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const chips = e.chips | 0;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'elite' || e.kind === 'gun' ? HOT : CRIM;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'elite' ? 22 : 14);
    const mul = 1 + chips * 0.35;
    const pts = Math.round(e.score * G.mult * mul);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), chips >= 4 ? GOLD : rgb, e.kind === 'boss' || chips >= 6);
    if (chips >= 4) {
      floatText(e.x, e.y - 24, '锁 ×' + chips, GOLD, true);
      burst(e.x, e.y, GOLD, 12 + chips, 160);
    }
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.72);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, GOLD);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      G.bullets.length = 0;
      G.chips.length = 0;
      G.winT = 1.35;
      toast('堡主碎裂', false, true);
    } else if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'gun') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.lock = false;
    G.lockT = 0;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, GOLD, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    G.chips.length = 0;
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    G.lock = false;
    G.lockT = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    G.lock = false;
    audio.lose();
    showOverlay('lose', '舰毁了', '空格点射，按住锁芯。锁芯贴敌再打。分数 ' + G.score + '。');
    setHint('R 重开 · 空格点射，按住锁芯', 'warn');
  }

  function goWin() {
    addScore(isSea() ? 10000 : 8000);
    G.mode = 'win';
    G.lock = false;
    audio.win();
    showOverlay(
      'win',
      isSea() ? '弹海通关' : '堡核尽碎',
      '三关打穿，堡主已碎。分数 ' + G.score + (isSea() ? ' · 弹海' : ' · 突入') + '。'
    );
    setHint('堡核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.chips.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '堡核'), false, true);
    audio.wave();
    screenFlash(GOLD, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'sea' ? 'sea' : 'rush';
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
    G.lock = false;
    G.lockT = 0;
    G.lockBuzz = 0;
    G.chipCd = 0;
    G.chipN = 0;
    G.chipPulse = 0;
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
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    autoTx = G.ship.x;
    autoTy = G.ship.y;
    autoStickS = -1e9;
    autoOvWait = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '弹海' : '突入', isSea(), !isSea());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'rush';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lock = false;
    G.lockT = 0;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '决战', '空格点射，按住锁芯。锁芯贴敌再打，短关之后是堡主。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('rush');
    else startGame(G.kind || 'rush');
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
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      s.y += scr * 0.42 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.sht = false;
    keys.lock = false;
    pointer.down = false;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoClearInput();
    autoTx = G.ship.x;
    autoTy = G.ship.y;
    autoStickS = -1e9;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('rush');
    }
    syncHud();
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.22 : 0.48)) {
        autoOvWait = 0;
        startGame('rush');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'rush');
      }
    }
  }

  function autoDanger(x, y, horizon) {
    let d = 0;
    const look = horizon;
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const relx = b.x - x;
      const rely = b.y - y;
      const vv = b.vx * b.vx + b.vy * b.vy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * b.vx + rely * b.vy) / vv, 0, look);
      const dist = hypot(relx + b.vx * t, rely + b.vy * t);
      const rad = HIT_R + b.r * 0.55 + 1.2;
      if (t <= look && dist < rad + 34) {
        const soon = (look - t) / Math.max(0.08, look);
        d += Math.max(0.5, rad + 12 - dist) * soon * 26;
        if (dist < rad) d += 260 * soon;
      }
    }
    const den = dens();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || isGround(e)) continue;
      let evx = e.vx || 0;
      let evy = e.vy || 0;
      if (e.kind === 'dive' && e.t > 0.35) {
        const a = Math.atan2(y - e.y, x - e.x);
        evx = Math.cos(a) * 210 * den;
        evy = Math.sin(a) * 240 * den;
      }
      const relx = e.x - x;
      const rely = e.y - y;
      const vv = evx * evx + evy * evy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * evx + rely * evy) / vv, 0, look);
      const dist = hypot(relx + evx * t, rely + evy * t);
      const r = e.r * (e.kind === 'boss' ? 0.62 : 0.7);
      const hitR = HIT_R + r;
      if (dist < hitR + 28) {
        const soon = (look - t) / Math.max(0.08, look);
        const w = e.kind === 'dive' ? 34 : e.kind === 'boss' ? 14 : 18;
        d += Math.max(0.4, hitR + 14 - dist) * soon * w;
        if (dist < hitR) d += 250 * soon;
      }
      if (hypot(e.x - x, e.y - y) < hitR + 8) d += 120;
    }
    return d;
  }

  function autoThink() {
    if (!autoOn) return;
    if (G.mode !== 'play' || G.deadT > 0) {
      keys.sht = false;
      keys.lock = false;
      return;
    }

    const sea = isSea();
    const horizon = sea ? 0.62 : 0.5;
    const boss = findBoss();
    const px = G.ship.x;
    const py = G.ship.y;
    let aimX = VW * 0.5;
    let aimY = null;
    let aimW = -1e9;
    let cluster = 0;
    let colHp = 0;
    let nearBullets = 0;
    let colBullets = 0;
    let grazeN = 0;
    let coneN = 0;

    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.y < -36 || e.y > py + 20) continue;
      let w = 32;
      if (e.kind === 'dive') w = 70;
      else if (e.kind === 'tank') w = 54;
      else if (e.kind === 'turret') w = 72;
      else if (e.kind === 'gun') w = 96;
      else if (e.kind === 'elite') w = 130;
      else if (e.kind === 'pod') w = 110;
      else if (e.kind === 'boss') w = 280;
      else w = 36 + (e.hp || 1) * 8;
      w += e.hp * 6;
      w += (e.chips || 0) * 18;
      w -= Math.abs(e.x - px) * 0.22;
      w -= Math.max(0, py - e.y) * 0.06;
      if (e.y > 40 && e.y < py - 10) w += 22;
      if (Math.abs(e.x - px) < 14 && e.y < py) colHp += e.hp;
      if (inLockCone(e)) coneN += 1;
      if (w > aimW) {
        aimW = w;
        aimX = e.x;
        aimY = e.y;
      }
    }
    if (aimY != null) {
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (!e.alive) continue;
        if (Math.abs(e.x - aimX) < 28 && e.y < py) cluster += 1;
      }
    }

    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const dist = hypot(b.x - px, b.y - py);
      if (dist < 130) nearBullets += 1;
      if (Math.abs(b.x - px) < 12 && b.y < py && b.y > py - 280) colBullets += 1;
      const hitR = HIT_R + b.r * 0.55;
      if (dist > hitR + 6 && dist < hitR + 28) grazeN += 1;
    }

    const hereDang = autoDanger(px, py, horizon);
    const panic = hereDang > 92 || (G.lives <= 1 && hereDang > 58);
    const dense = nearBullets >= (sea ? 6 : 8);

    let desiredX = aimY != null ? aimX : VW * 0.5;
    let desiredY = VH - 78;
    if (boss) desiredY = clamp(boss.y + 168, 240, VH - 78);
    else if (aimY != null) desiredY = clamp(aimY + 148, 210, VH - 72);
    if (panic) desiredY = clamp(py + 28, 220, VH - 32);
    else if (hereDang > 50) desiredY = Math.max(desiredY, VH - 64);
    if (G.lock && colBullets >= 2) desiredY = Math.max(desiredY, VH - 70);

    const xMin = 28;
    const xMax = VW - 28;
    const yMin = 70;
    const yMax = VH - 28;
    let bestX = clamp(autoTx, xMin, xMax);
    let bestY = clamp(autoTy, yMin, yMax);
    let bestS = -1e15;

    function consider(x, y) {
      x = clamp(x, xMin, xMax);
      y = clamp(y, yMin, yMax);
      let s = -autoDanger(x, y, horizon) * (sea ? 7.4 : 6.1);
      s -= Math.abs(x - desiredX) * (boss || cluster >= 3 ? 1.05 : 0.55);
      s -= Math.abs(y - desiredY) * 0.72;
      s -= hypot(x - px, y - py) * 0.1;
      if (y < 140) s -= 28;
      if (y > VH - 36) s -= 6;
      if (x < 40 || x > VW - 40) s -= 12;
      if (aimY != null && Math.abs(x - aimX) < 12) s += 22;
      if (colHp > 0 && Math.abs(x - px) < 10) s += 10;
      if (!panic && grazeN > 0) {
        for (let i = 0; i < G.bullets.length; i++) {
          const b = G.bullets[i];
          const dist = hypot(b.x - x, b.y - y);
          const hitR = HIT_R + b.r * 0.55;
          if (dist > hitR + 6 && dist < hitR + 24) s += (24 - (dist - hitR)) * 0.42;
        }
      }
      if (s > bestS) {
        bestS = s;
        bestX = x;
        bestY = y;
      }
    }

    consider(px, py);
    consider(autoTx, autoTy);
    consider(desiredX, desiredY);
    for (let ix = 0; ix < 9; ix++) {
      const x = 40 + ix * ((VW - 80) / 8);
      for (let iy = 0; iy < 8; iy++) {
        consider(x, 96 + iy * ((VH - 140) / 7));
      }
    }
    if (aimY != null) {
      consider(aimX, desiredY);
      consider(aimX, py);
      consider(px, desiredY);
      consider(aimX - 48, desiredY);
      consider(aimX + 48, desiredY);
      consider(aimX, Math.min(VH - 40, aimY + 120));
    }
    consider(px - 70, py);
    consider(px + 70, py);
    consider(px, py - 56);
    consider(px, py + 48);
    consider(px - 36, py - 28);
    consider(px + 36, py - 28);
    consider(px - 50, py + 30);
    consider(px + 50, py + 30);

    const switchGap = hereDang > 48 ? 6 : 20;
    if (bestS > autoStickS + switchGap || hereDang > 55 || hypot(autoTx - px, autoTy - py) < 5) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    const aligned = aimY != null && Math.abs(px - aimX) < 22 && aimY < py && py - aimY < LOCK_LEN;
    const wantLock = G.invuln > 0.25
      || (!panic && (boss || coneN >= 1 || cluster >= 2 || (colHp >= 6 && aligned) || G.chipN >= 3))
      || (dense && aligned && !panic);
    keys.lock = !!wantLock;
    keys.sht = true;
  }

  function updateShip(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = shipSpeed();
    let dx = 0;
    let dy = 0;
    if (autoOn) {
      const ax = autoTx - G.ship.x;
      const ay = autoTy - G.ship.y;
      const d = hypot(ax, ay);
      const boost = autoSpeed >= 4 ? 1.22 : autoSpeed >= 3 ? 1.06 : autoSpeed <= 1 ? 0.86 : 0.96;
      const max = spd * dt * boost;
      if (d > 1.2) {
        const k = Math.min(1, max / d);
        G.ship.x += ax * k;
        G.ship.y += ay * k;
        G.ship.vx = (ax * k) / Math.max(dt, 0.016);
        G.ship.vy = (ay * k) / Math.max(dt, 0.016);
      } else {
        G.ship.vx = 0;
        G.ship.vy = 0;
      }
    } else if (keys.l || keys.r || keys.u || keys.d) {
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
      }
      G.ship.x += G.ship.vx * dt;
      G.ship.y += G.ship.vy * dt;
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
      G.ship.x += G.ship.vx * dt;
      G.ship.y += G.ship.vy * dt;
    }
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.chipCd > 0) G.chipCd -= dt;
    if (wantLock()) {
      G.lockT = Math.min(0.4, G.lockT + dt);
      if (!G.lock) engageLock();
      applyLock(dt);
    } else {
      if (G.lock) G.lock = false;
      G.lockT = Math.max(0, G.lockT - dt * 3.2);
    }
    if (wantFire()) fireShot();
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
          burst(s.x, s.y, s.lock ? GOLD : CYN, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateChips(dt) {
    for (let i = G.chips.length - 1; i >= 0; i--) {
      const c = G.chips[i];
      c.life -= dt;
      const t = c.target && c.target.alive ? c.target : pickChipTarget();
      c.target = t;
      if (t) {
        const a = Math.atan2(t.y - c.y, t.x - c.x);
        const spd = 560;
        c.vx = lerp(c.vx, Math.cos(a) * spd, 1 - Math.exp(-dt * 9));
        c.vy = lerp(c.vy, Math.sin(a) * spd, 1 - Math.exp(-dt * 9));
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.life <= 0 || c.y < -28 || c.x < -24 || c.x > VW + 24 || c.y > VH + 24) {
        G.chips.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = c.x - e.x;
        const dy = c.y - e.y;
        const rr = e.r + c.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, c.dmg, 'chip');
          burst(c.x, c.y, GOLD, 6, 90);
          hit = true;
          break;
        }
      }
      if (hit) G.chips.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 22 || b.y < -32 || b.x < -22 || b.x > VW + 22) {
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
    const sea = isSea() ? 0.74 : 1;
    if (e.kind === 'drone') return 1.45 * sea;
    if (e.kind === 'tank') return 1.05 * sea;
    if (e.kind === 'turret') return 0.92 * sea;
    if (e.kind === 'gun') return 0.88 * sea;
    if (e.kind === 'elite') return 0.82 * sea;
    if (e.kind === 'pod') return 1.1 * sea;
    if (e.kind === 'boss') return 0.55 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    decayChips(e, dt);
    if (e.kind === 'drone') {
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
        e.vx = lerp(e.vx, Math.cos(a) * 210 * dens(), 1 - Math.exp(-dt * 3));
        e.vy = lerp(e.vy, Math.sin(a) * 240 * dens(), 1 - Math.exp(-dt * 3));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'tank') {
      e.y += e.vy * dt;
      e.x += Math.sin(e.t * 1.4 + e.phase) * e.amp * dt * 0.35 + e.vx * dt * 0.15;
      e.x = clamp(e.x, 36, VW - 36);
      if (e.y > 80 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, isSea() ? 2 : 1, 0.14, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'turret') {
      e.y += e.vy * dt;
      if (e.y > 88 && e.vy > 12) e.vy = 12;
      e.ang = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isSea() ? 2 : 1, 0.12, bulletSpd() * 0.88);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'gun') {
      e.x = e.baseX + Math.sin(e.t * 1.55 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 96 && e.vy > 26) e.vy = 26;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.2, bulletSpd());
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
    } else if (e.kind === 'pod') {
      const b = findBoss();
      const cx = b ? b.x : VW * 0.5;
      const cy = b ? b.y : 110;
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
        e.y = lerp(e.y, 118, 1 - Math.exp(-dt * 3.2));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.7) * 96;
        e.y = 118 + Math.sin(e.t * 1.1) * 10;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.4 : 2.4);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      if (ratio > 0.66) {
        aimedFire(e, 5, 0.2, spd);
        if (Math.random() < 0.45) ringFire(e, 8, spd * 0.72, e.spin);
        e.fireCd = 1.15 * (isSea() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        ringFire(e, 10, spd * 0.8, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.52 * (isSea() ? 0.78 : 1);
      } else {
        ringFire(e, 12, spd * 0.78, e.spin);
        ringFire(e, 8, spd * 0.58, -e.spin * 0.7);
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnDrone(e.x - 40, e.y + 20, -30, 110);
          spawnDrone(e.x + 40, e.y + 20, 30, 110);
        }
        e.fireCd = 0.42 * (isSea() ? 0.78 : 1);
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
      if (!canHurt || isGround(e)) continue;
      const dx = e.x - G.ship.x;
      const dy = e.y - G.ship.y;
      const rr = (e.kind === 'boss' ? e.r * 0.62 : e.r * 0.7) + HIT_R;
      if (dx * dx + dy * dy < rr * rr) diePlayer();
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
      if (G.gapT >= 1.55) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function update(dt) {
    G.t += dt;
    tickAutoFlow(dt);
    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        return;
      }
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.ship.y = VH - 96;
      if (living() < 6 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.45) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 50);
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
      updateChips(dt);
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
      updateChips(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    if (autoOn) autoThink();
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateChips(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathPoly(c, pts) {
    c.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = sx(pts[i][0]);
      const py = sy(pts[i][1]);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function pathTri(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (rot || 0) + i * (TAU / 3) - Math.PI / 2;
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function pathShield(c, x, y, r) {
    pathPoly(c, [
      [x, y - r],
      [x + r * 0.9, y - r * 0.25],
      [x + r * 0.72, y + r],
      [x - r * 0.72, y + r],
      [x - r * 0.9, y - r * 0.25]
    ]);
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0c0606';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(90), 10 * scale, sx(VW * 0.5), sy(VH * 0.4), 380 * scale);
    g.addColorStop(0, 'rgba(224,24,40,0.1)');
    g.addColorStop(1, 'rgba(12,6,6,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const yOff = (G.scroll * 0.55) % 48;
    c.strokeStyle = 'rgba(224,24,40,0.08)';
    c.lineWidth = Math.max(0.6, 0.7 * scale);
    for (let row = -2; row < 20; row++) {
      const y = row * 48 - yOff;
      c.beginPath();
      c.moveTo(sx(40), sy(y));
      c.lineTo(sx(VW - 40), sy(y));
      c.stroke();
      c.strokeStyle = 'rgba(255,194,74,0.05)';
      c.beginPath();
      c.moveTo(sx(40), sy(y + 24));
      c.lineTo(sx(VW - 40), sy(y + 24));
      c.stroke();
      c.strokeStyle = 'rgba(224,24,40,0.08)';
    }

    c.fillStyle = 'rgba(22,8,8,0.72)';
    c.fillRect(sx(0), sy(0), 38 * scale, VH * scale);
    c.fillRect(sx(VW - 38), sy(0), 38 * scale, VH * scale);
    const wallOff = (G.scroll * 0.78) % 36;
    for (let i = -1; i < 24; i++) {
      const y = i * 36 - wallOff;
      c.fillStyle = 'rgba(224,24,40,0.12)';
      c.fillRect(sx(6), sy(y), 26 * scale, 22 * scale);
      c.fillRect(sx(VW - 32), sy(y + 10), 26 * scale, 22 * scale);
      c.strokeStyle = 'rgba(255,58,34,0.28)';
      c.lineWidth = Math.max(0.8, scale);
      c.strokeRect(sx(6), sy(y), 26 * scale, 22 * scale);
      c.strokeRect(sx(VW - 32), sy(y + 10), 26 * scale, 22 * scale);
      c.fillStyle = 'rgba(255,194,74,0.18)';
      c.fillRect(sx(16), sy(y + 6), 6 * scale, 4 * scale);
      c.fillRect(sx(VW - 22), sy(y + 16), 6 * scale, 4 * scale);
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      c.fillStyle = rgba(i % 3 === 0 ? GOLD : HOT, p.a * 0.5);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawLockCone() {
    if (!G.lock || G.deadT > 0) return;
    const c = ctx;
    const x = G.ship.x;
    const y = G.ship.y - 10;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.beginPath();
    c.moveTo(sx(x - 28), sy(y));
    c.lineTo(sx(x + 28), sy(y));
    c.lineTo(sx(x + 92), sy(y - LOCK_LEN));
    c.lineTo(sx(x - 92), sy(y - LOCK_LEN));
    c.closePath();
    c.fillStyle = rgba(GOLD, 0.07 + Math.sin(G.t * 8) * 0.02);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.32);
    c.lineWidth = Math.max(1, 1.2 * scale);
    c.stroke();
    c.setLineDash([6 * scale, 5 * scale]);
    c.strokeStyle = rgba(HOT, 0.22);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  function drawChipsOn(e) {
    const n = Math.floor(e.chips);
    if (n <= 0) return;
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const a = G.t * 3.2 + i * (TAU / CHIP_MAX);
      const rr = e.r + 9;
      const cx = e.x + Math.cos(a) * rr;
      const cy = e.y + Math.sin(a) * rr * 0.78;
      pathTri(c, cx, cy, 4.2, a + Math.PI / 2);
      c.fillStyle = rgba(i === n - 1 ? WHT : GOLD, 0.95);
      c.fill();
    }
    if (n >= CHIP_MAX) {
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), (e.r + 14 + Math.sin(G.t * 10) * 2) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (e.kind === 'boss' ? HOT : e.kind === 'elite' || e.kind === 'gun' ? AMB : CRIM);

    if (e.kind === 'turret') {
      c.fillStyle = rgba(DEEP, 0.92);
      c.fillRect(sx(e.x - e.r), sy(e.y - e.r * 0.6), e.r * 2 * scale, e.r * 1.4 * scale);
      c.strokeStyle = rgba(STEEL, 0.7);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.strokeRect(sx(e.x - e.r), sy(e.y - e.r * 0.6), e.r * 2 * scale, e.r * 1.4 * scale);
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 6 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(HOT, 0.9);
      c.lineWidth = 2.2 * scale;
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y));
      c.lineTo(sx(e.x + Math.cos(e.ang) * 16), sy(e.y + Math.sin(e.ang) * 16));
      c.stroke();
      drawChipsOn(e);
      return;
    }

    if (e.kind === 'tank') {
      c.fillStyle = rgba(DEEP, 0.95);
      c.fillRect(sx(e.x - 16), sy(e.y - 8), 32 * scale, 18 * scale);
      c.strokeStyle = rgba(STEEL, 0.75);
      c.lineWidth = Math.max(1, 1.1 * scale);
      c.strokeRect(sx(e.x - 16), sy(e.y - 8), 32 * scale, 18 * scale);
      c.fillStyle = rgba(CRIM, 0.7);
      c.fillRect(sx(e.x - 14), sy(e.y + 8), 8 * scale, 4 * scale);
      c.fillRect(sx(e.x + 6), sy(e.y + 8), 8 * scale, 4 * scale);
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y - 1), 5.5 * scale, 0, TAU);
      c.fill();
      const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
      c.strokeStyle = rgba(GOLD, 0.85);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - 1));
      c.lineTo(sx(e.x + Math.cos(a) * 14), sy(e.y - 1 + Math.sin(a) * 14));
      c.stroke();
      drawChipsOn(e);
      return;
    }

    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(HOT, 0.16);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 56 * scale, 34 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.95);
      pathShield(c, e.x, e.y, e.r + 6);
      c.fill();
      c.strokeStyle = rgba(HOT, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      pathShield(c, e.x, e.y, e.r + 6);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : CRIM, 0.92);
      pathShield(c, e.x, e.y - 2, 18);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 4), 7 * scale, 0, TAU);
      c.fill();
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(GOLD, 0.55);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), (22 + Math.sin(e.spin * 2) * 3) * scale, e.spin, e.spin + 2.2);
      c.stroke();
      c.restore();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 16), 72 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : GOLD, 0.95);
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 16), 72 * ratio * scale, 5 * scale);
      drawChipsOn(e);
      return;
    }

    c.fillStyle = rgba(flash ? WHT : rgb, 0.95);
    pathShield(c, e.x, e.y, e.r - (e.kind === 'elite' ? 0 : 1));
    c.fill();
    c.strokeStyle = rgba(STEEL, 0.7);
    c.lineWidth = Math.max(0.8, scale);
    pathShield(c, e.x, e.y, e.r - (e.kind === 'elite' ? 0 : 1));
    c.stroke();
    c.fillStyle = rgba(DEEP, 0.85);
    c.fillRect(sx(e.x - 1.2), sy(e.y - 2), 2.4 * scale, e.r * 0.7 * scale);
    if (e.kind === 'elite' || e.kind === 'gun' || e.kind === 'pod') {
      c.fillStyle = rgba(GOLD, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 3.2 * scale, 0, TAU);
      c.fill();
    }
    drawChipsOn(e);
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(s.lock ? GOLD : CYN, 0.95);
      pathTri(c, s.x, s.y, 4.4, 0);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 1.4 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(s.lock ? GOLD : HOT, 0.35);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y));
        c.lineTo(sx(s.x - s.vx * 0.016), sy(s.y - s.vy * 0.016));
        c.stroke();
      }
    }
    for (let i = 0; i < G.chips.length; i++) {
      const ch = G.chips[i];
      const a = Math.atan2(ch.vy, ch.vx) + Math.PI / 2;
      pathTri(c, ch.x, ch.y, 5.2, a);
      c.fillStyle = rgba(GOLD, 0.96);
      c.fill();
      pathTri(c, ch.x, ch.y, 2.4, a);
      c.fillStyle = rgba(WHT, 0.9);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(GOLD, 0.4);
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(sx(ch.x), sy(ch.y));
        c.lineTo(sx(ch.x - ch.vx * 0.02), sy(ch.y - ch.vy * 0.02));
        c.stroke();
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      c.fillStyle = rgba(MAG, 0.92);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.42 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(PNK, 0.28);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 3.2) * scale, 0, TAU);
        c.stroke();
      }
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
    c.fillStyle = rgba(G.lock ? GOLD : HOT, 0.2 + (G.muzzle > 0 ? 0.2 : 0));
    c.beginPath();
    c.ellipse(sx(x), sy(y), 16 * scale, 12 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.5);
    c.beginPath();
    c.moveTo(sx(x - 5), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 5), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(WHT, 0.18);
    c.beginPath();
    c.ellipse(sx(x - 12), sy(y + 3), 8 * scale, 3.6 * scale, -0.45, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(sx(x + 12), sy(y + 3), 8 * scale, 3.6 * scale, 0.45, 0, TAU);
    c.fill();

    c.fillStyle = rgba(CRIM, 0.96);
    pathPoly(c, [
      [x, y - 18],
      [x + 8, y + 4],
      [x + 5, y + 12],
      [x - 5, y + 12],
      [x - 8, y + 4]
    ]);
    c.fill();
    c.strokeStyle = rgba(STEEL, 0.9);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathPoly(c, [
      [x, y - 18],
      [x + 8, y + 4],
      [x + 5, y + 12],
      [x - 5, y + 12],
      [x - 8, y + 4]
    ]);
    c.stroke();

    c.fillStyle = rgba(WHT, 0.95);
    pathPoly(c, [
      [x, y - 16],
      [x + 4, y - 2],
      [x - 4, y - 2]
    ]);
    c.fill();

    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y - 2), 2.4 * scale, 0, TAU);
    c.fill();

    c.fillStyle = rgba(HOT, 0.9);
    c.fillRect(sx(x - 11), sy(y + 4), 4 * scale, 3 * scale);
    c.fillRect(sx(x + 7), sy(y + 4), 4 * scale, 3 * scale);

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
    if (G.lock && !REDUCE) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(GOLD, 0.55);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), (8 + Math.sin(G.t * 14) * 1.6) * scale, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(GOLD, 0.95);
      pathTri(c, x, y - 22, 4, 0);
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
    ctx.fillStyle = '#160808';
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
    ctx.fillStyle = '#160808';
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
    const ground = [];
    const air = [];
    for (let i = 0; i < G.enemies.length; i++) {
      if (!G.enemies[i].alive) continue;
      if (isGround(G.enemies[i])) ground.push(G.enemies[i]);
      else air.push(G.enemies[i]);
    }
    for (let i = 0; i < ground.length; i++) drawEnemy(ground[i]);
    drawLockCone();
    for (let i = 0; i < air.length; i++) drawEnemy(air[i]);
    drawShots();
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
      startGame('rush');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    const lockKey = k === 'Shift' || k === 'z' || k === 'Z';
    if (k === 'a' || k === 'A' || e.code === 'KeyA') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (e.target === speedEl) return;
    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (space) {
      keys.sht = down && !autoOn;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (lockKey) {
      keys.lock = down && !autoOn;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
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
    if (autoOn && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S' || lockKey)) {
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
      startGame('rush');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('sea');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (autoOn) return;
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
      if (autoOn) return;
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

  function bindLockHold(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (autoOn) return;
      keys.lock = true;
      inputSrc = 'key';
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    function up() {
      if (autoOn) return;
      keys.lock = false;
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
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
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
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
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();
  bindLockHold(btnLock);
  bindLockHold(btnPad);

  if (btnRush) {
    btnRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
    });
  }
  if (btnSea) {
    btnSea.addEventListener('click', function () {
      audio.ensure();
      startGame('sea');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'rush');
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
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
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
      keys.lock = false;
    }
  });

  requestAnimationFrame(frame);
})();
