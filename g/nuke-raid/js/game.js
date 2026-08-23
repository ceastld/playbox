'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const BOMB_CAP = 6;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.4;
  const LOCK_LEAD = 118;
  const BEST_KEY = 'playbox-nuke-raid-best';
  const MUTE_KEY = 'playbox-nuke-raid-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 核弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const LIME = [200, 255, 58];
  const GOLD = [255, 224, 112];
  const AMB = [255, 180, 40];
  const HOT = [255, 106, 40];
  const VER = [255, 77, 20];
  const WHT = [255, 242, 228];
  const DEEP = [28, 9, 6];
  const RUST = [160, 72, 36];

  const SCORE = {
    grunt: 50,
    dive: 80,
    missile: 90,
    turret: 150,
    silo: 180,
    bunker: 200,
    elite: 240,
    carrier: 280,
    gun: 120,
    rod: 160,
    fort: 2800,
    core: 4800,
    chip: 10,
    stage: 1600
  };

  const STAGES = [
    {
      name: '废原',
      biome: 'waste',
      boss: '锈堡',
      bossKind: 'fort',
      bossHp: 92,
      bossR: 52,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'stream', dir: 1 },
        { t: 5.2, kind: 'silos', n: 2 },
        { t: 7.4, kind: 'dive', n: 4 },
        { t: 9.4, kind: 'bunkers' },
        { t: 11.4, kind: 'v', n: 7 },
        { t: 13.6, kind: 'elite' },
        { t: 15.6, kind: 'turrets' },
        { t: 17.6, kind: 'carrier' },
        { t: 22.4, kind: 'boss' }
      ]
    },
    {
      name: '堡群',
      biome: 'forts',
      boss: '核门',
      bossKind: 'fort',
      bossHp: 128,
      bossR: 60,
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'silos', n: 3 },
        { t: 4.4, kind: 'dive', n: 5 },
        { t: 6.2, kind: 'stream', dir: -1 },
        { t: 8.0, kind: 'bunkers' },
        { t: 9.8, kind: 'elite' },
        { t: 11.6, kind: 'turrets' },
        { t: 13.4, kind: 'carrier' },
        { t: 15.2, kind: 'v', n: 9 },
        { t: 17.2, kind: 'dive', n: 6 },
        { t: 22.6, kind: 'boss' }
      ]
    },
    {
      name: '堆芯',
      biome: 'core',
      boss: '核芯',
      bossKind: 'core',
      bossHp: 176,
      bossR: 48,
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'silos', n: 3 },
        { t: 4.0, kind: 'elite' },
        { t: 5.8, kind: 'dive', n: 5 },
        { t: 7.6, kind: 'bunkers' },
        { t: 9.4, kind: 'stream', dir: 1 },
        { t: 11.2, kind: 'turrets' },
        { t: 13.0, kind: 'carrier' },
        { t: 14.8, kind: 'v', n: 9 },
        { t: 16.6, kind: 'elite' },
        { t: 18.4, kind: 'silos', n: 2 },
        { t: 23.4, kind: 'boss' }
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
  const btnRain = document.getElementById('btn-rain');
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
  const heatBar = document.getElementById('heat-bar');
  const heatWrap = document.getElementById('heat-wrap');

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
  const embers = [];
  const craters = [];
  const mushrooms = [];
  const pools = [];

  const G = {
    mode: 'title',
    kind: 'raid',
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
    heat: 0,
    heatHold: 0,
    bombs: 3,
    nukeCd: 0,
    enemies: [],
    shots: [],
    bullets: [],
    nukes: [],
    pows: [],
    ship: { x: VW * 0.5, y: 640, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    winT: 0,
    lockX: VW * 0.5,
    lockY: 522
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
  function isDense() {
    return G.kind === 'rain';
  }
  function dens() {
    return isDense() ? 1.28 : 1;
  }
  function shipSpeed() {
    return isDense() ? 318 : 276;
  }
  function bulletSpd() {
    return isDense() ? 188 : 148;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isDense() ? 124 : 88;
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function stageData() {
    return STAGES[G.stage - 1] || STAGES[0];
  }
  function hasBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && (e.kind === 'fort' || e.kind === 'core')) return true;
    }
    return false;
  }
  function isGround(e) {
    return e.ground || e.kind === 'silo' || e.kind === 'bunker' || e.kind === 'turret' || e.kind === 'fort';
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
      this.beep(620, 0.04, 'square', 0.026, 1280);
      this.beep(240, 0.05, 'sawtooth', 0.014, 110);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, 0.026, 1400);
      this.beep(580 * lift, 0.05, 'square', 0.034, 920 * lift);
    },
    groundHit() {
      this.ensure();
      this.noise(0.04, 0.03, 500);
      this.beep(220, 0.07, 'sawtooth', 0.03, 90);
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
    drop() {
      this.ensure();
      this.beep(420, 0.08, 'triangle', 0.04, 180);
      this.noise(0.06, 0.028, 400);
    },
    nuke(superN) {
      this.ensure();
      this.noise(superN ? 0.32 : 0.22, superN ? 0.08 : 0.062, 160);
      this.beep(90, 0.36, 'sawtooth', 0.07, 36);
      this.beep(240, 0.22, 'square', 0.04, 70);
      this.beep(superN ? 880 : 620, 0.28, 'sine', 0.04, 1600);
    },
    fortCrack() {
      this.ensure();
      this.noise(0.08, 0.04, 300);
      this.beep(160, 0.12, 'square', 0.036, 70);
    },
    bossHit() {
      this.ensure();
      this.beep(180, 0.06, 'sawtooth', 0.03, 90);
      this.noise(0.04, 0.028, 700);
    },
    bossDie() {
      this.ensure();
      this.noise(0.28, 0.07, 220);
      this.beep(140, 0.32, 'sawtooth', 0.055, 40);
      this.beep(520, 0.24, 'triangle', 0.04, 90);
    },
    pickup() {
      this.ensure();
      this.beep(740, 0.07, 'sine', 0.036, 1480);
      this.beep(1180, 0.09, 'triangle', 0.022, 1760);
    },
    empty() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.03, 90);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
      this.beep(1175, 0.2, 'sine', 0.05, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 280);
      this.beep(220, 0.22, 'sawtooth', 0.05, 60);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    win() {
      this.ensure();
      this.beep(392, 0.1, 'square', 0.045, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 659);
      this.beep(784, 0.18, 'sine', 0.05, 1046);
      this.beep(1175, 0.28, 'triangle', 0.04, 1568);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'triangle', 0.032, 784);
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

  function addHeat(n) {
    G.heat = clamp(G.heat + n, 0, 1);
    G.heatHold = 0.45;
    if (G.heat >= 1) {
      if (heatWrap) heatWrap.classList.add('hot');
    }
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

  function bossName() {
    const st = STAGES[G.stage - 1];
    return st ? st.boss : '核芯';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '核袭';
      else if (hasBoss()) stageLabel.textContent = bossName();
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss() || G.heat >= 1));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '核雨' : '核袭';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.heat >= 1);
    }
    if (heatBar) heatBar.style.transform = 'scaleX(' + clamp(G.heat, 0, 1) + ')';
    if (heatWrap) heatWrap.classList.toggle('hot', G.heat >= 0.98);
    if (bombLabel) {
      bombLabel.textContent = '核 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    const bombOff = G.mode === 'play' && G.bombs <= 0 && G.nukeCd <= 0;
    if (btnBomb) btnBomb.disabled = bombOff;
    if (btnPad) btnPad.disabled = bombOff;
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 菱锁定点丢核弹砸堡', 'warn');
    else if (G.mode === 'win') setHint('堆芯已碎 · R 再来', 'hot');
    else if (G.heat >= 1) setHint('核压满 · 下一发是超核蘑菇云', 'hot');
    else if (hasBoss()) setHint(G.stage >= 3 ? '先打冷却棒再砸堆芯' : '先打炮口再砸堡体', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 核弹砸堡续链', 'warn');
    else setHint('空格打空中 · Shift 丢核弹砸堡 · 核压满放出超核', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'NUKE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'win' && G.kind === 'raid') btnOvModes.textContent = '核雨';
      else btnOvModes.textContent = '换模式';
    }
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.8 ? 'bomb' : mag >= 3.2 ? 'pow' : 'hit');
    stageEl.classList.remove('die', 'hit', 'pow', 'boss', 'bomb');
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

  function spawnMushroom(x, y, superN) {
    mushrooms.push({
      x: x,
      y: y,
      t: 0,
      life: superN ? 0.9 : 0.62,
      superN: !!superN
    });
    capArr(mushrooms, 6);
    craters.push({ x: x, y: y, t: 0, life: 2.4, r: superN ? 42 : 26 });
    capArr(craters, 10);
    pools.push({
      x: x,
      y: y,
      r: superN ? 78 : 48,
      t: 0,
      life: superN ? 2.2 : 1.35,
      dmgCd: 0
    });
    capArr(pools, 8);
  }

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 72; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.12, 0.62),
        z: rand(0.35, 1.2)
      });
    }
  }

  function makeGuns(n, hp) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        a: i * (TAU / n) - Math.PI / 2,
        hp: hp,
        maxHp: hp,
        alive: true,
        flash: 0,
        fireCd: 0.4 + i * 0.12
      });
    }
    return arr;
  }

  function makeRods(n, hp) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        a: i * (TAU / n),
        hp: hp,
        maxHp: hp,
        alive: true,
        flash: 0
      });
    }
    return arr;
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'fort' || spec.kind === 'core';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'grunt',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 92 * dens() : spec.vy,
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
      score: spec.score || SCORE.grunt,
      enter: spec.enter || 0,
      spin: spec.spin || 0,
      drop: spec.drop || null,
      name: spec.name || '',
      rad: spec.rad || 54,
      guns: spec.guns || null,
      rods: spec.rods || null,
      stun: 0,
      ground: !!spec.ground,
      w: spec.w || 0,
      h: spec.h || 0
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r, rgb) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.6,
      life: 8,
      rgb: rgb || WHT
    });
    capArr(G.bullets, 280);
  }

  function aimedFire(e, n, spread, spd, rgb) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.4, rgb);
    }
  }

  function ringFire(e, n, spd, rot, rgb) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.6, rgb || LIME);
    }
  }

  function spawnGrunt(x, y, vx, vy) {
    spawnEnemy({
      kind: 'grunt',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 12,
      amp: 42,
      score: SCORE.grunt,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnDive(x) {
    spawnEnemy({
      kind: 'dive',
      x: x,
      y: -30,
      vx: (VW * 0.5 - x) * 0.18,
      vy: 210 * dens(),
      hp: 2,
      r: 11,
      score: SCORE.dive,
      fireCd: 9
    });
  }

  function spawnSilo(x) {
    spawnEnemy({
      kind: 'silo',
      x: x,
      y: -40,
      vx: 0,
      vy: scrollSpd(),
      hp: 8,
      r: 16,
      w: 22,
      h: 28,
      ground: true,
      score: SCORE.silo,
      fireCd: rand(0.8, 1.6)
    });
  }

  function spawnBunker(x) {
    spawnEnemy({
      kind: 'bunker',
      x: x,
      y: -36,
      vx: 0,
      vy: scrollSpd(),
      hp: 10,
      r: 18,
      w: 36,
      h: 22,
      ground: true,
      score: SCORE.bunker,
      fireCd: rand(0.7, 1.4)
    });
  }

  function spawnTurret(x) {
    spawnEnemy({
      kind: 'turret',
      x: x,
      y: -28,
      vx: 0,
      vy: scrollSpd(),
      hp: 6,
      r: 14,
      w: 20,
      h: 18,
      ground: true,
      score: SCORE.turret,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnElite(x) {
    spawnEnemy({
      kind: 'elite',
      x: x || VW * 0.5,
      y: -36,
      vx: 0,
      vy: 70 * dens(),
      hp: 10,
      r: 18,
      amp: 90,
      omega: 1.4,
      score: SCORE.elite,
      fireCd: 0.7
    });
  }

  function spawnCarrier(x) {
    spawnEnemy({
      kind: 'carrier',
      x: x || VW * 0.5,
      y: -40,
      vx: 0,
      vy: 62 * dens(),
      hp: 8,
      r: 22,
      amp: 70,
      score: SCORE.carrier,
      fireCd: 1.1,
      drop: 'nuke'
    });
  }

  function spawnMissile(x, y) {
    spawnEnemy({
      kind: 'missile',
      x: x,
      y: y,
      vx: (G.ship.x - x) * 0.35,
      vy: 240 * dens(),
      hp: 2,
      r: 8,
      score: SCORE.missile,
      fireCd: 99
    });
  }

  function spawnFort() {
    const st = stageData();
    const hp = Math.round(st.bossHp * hpMul());
    spawnEnemy({
      kind: 'fort',
      x: VW * 0.5,
      y: -80,
      vx: 0,
      vy: 0,
      hp: hp,
      r: 28,
      rad: st.bossR,
      w: st.bossR * 1.7,
      h: st.bossR * 1.05,
      ground: true,
      score: SCORE.fort,
      enter: 1.15,
      name: st.boss,
      guns: makeGuns(4, 5),
      fireCd: 0.5
    });
    toast(st.boss, false, true);
    audio.wave();
  }

  function spawnCore() {
    const st = stageData();
    const hp = Math.round(st.bossHp * hpMul());
    spawnEnemy({
      kind: 'core',
      x: VW * 0.5,
      y: -90,
      vx: 0,
      vy: 0,
      hp: hp,
      r: st.bossR,
      rad: st.bossR + 18,
      score: SCORE.core,
      enter: 1.25,
      name: st.boss,
      rods: makeRods(4, 8),
      fireCd: 0.45
    });
    toast(st.boss, false, true);
    audio.wave();
  }

  function spawnWave(w) {
    if (w.kind === 'v') {
      const n = (w.n || 5) + (isDense() ? 2 : 0);
      for (let i = 0; i < n; i++) {
        const t = i - (n - 1) * 0.5;
        spawnGrunt(VW * 0.5 + t * 38, -24 - Math.abs(t) * 16, 0, 100 * dens());
      }
    } else if (w.kind === 'stream') {
      const dir = w.dir || 1;
      for (let i = 0; i < 6; i++) {
        spawnGrunt(dir > 0 ? 40 + i * 8 : VW - 40 - i * 8, -20 - i * 22, dir * 70, 88 * dens());
      }
    } else if (w.kind === 'dive') {
      const n = (w.n || 4) + (isDense() ? 1 : 0);
      for (let i = 0; i < n; i++) spawnDive(60 + i * ((VW - 120) / Math.max(1, n - 1)));
    } else if (w.kind === 'silos') {
      const n = w.n || 2;
      for (let i = 0; i < n; i++) spawnSilo(70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-12, 12));
    } else if (w.kind === 'bunkers') {
      spawnBunker(110);
      spawnBunker(VW - 110);
      if (isDense()) spawnBunker(VW * 0.5);
    } else if (w.kind === 'turrets') {
      spawnTurret(90);
      spawnTurret(VW * 0.5);
      spawnTurret(VW - 90);
    } else if (w.kind === 'elite') {
      spawnElite(VW * 0.35);
      if (isDense()) spawnElite(VW * 0.65);
    } else if (w.kind === 'carrier') {
      spawnCarrier(VW * 0.5);
    } else if (w.kind === 'boss') {
      if (stageData().bossKind === 'core') spawnCore();
      else spawnFort();
    }
  }

  function updateWaves() {
    if (hasBoss() || G.winT > 0) return;
    const st = stageData();
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      spawnWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function gunPos(e, g) {
    const rad = e.rad * 0.78;
    return {
      x: e.x + Math.cos(g.a + e.spin * 0.15) * rad,
      y: e.y + Math.sin(g.a + e.spin * 0.15) * rad * 0.72
    };
  }

  function rodPos(e, r) {
    const rad = e.rad + 6;
    return {
      x: e.x + Math.cos(r.a + e.spin) * rad,
      y: e.y + Math.sin(r.a + e.spin) * rad
    };
  }

  function gunsAlive(e) {
    if (!e.guns) return 0;
    let n = 0;
    for (let i = 0; i < e.guns.length; i++) if (e.guns[i].alive) n += 1;
    return n;
  }

  function rodsAlive(e) {
    if (!e.rods) return 0;
    let n = 0;
    for (let i = 0; i < e.rods.length; i++) if (e.rods[i].alive) n += 1;
    return n;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x,
      y: y,
      vx: rand(-40, 40),
      vy: -80,
      t: 0,
      kind: kind || 'nuke'
    });
    capArr(G.pows, 8);
  }

  function collectPow(p) {
    if (p.kind === 'nuke') {
      if (G.bombs < BOMB_CAP) G.bombs += 1;
      else addScore(400 * G.mult);
      audio.pickup();
      toast('核 +1', false, true);
      explode(p.x, p.y, LIME, 10);
    } else {
      addHeat(0.45);
      audio.pickup();
      toast('核压', false, true);
      explode(p.x, p.y, GOLD, 10);
    }
    bumpCombo();
    syncHud();
  }

  function lockPoint() {
    return {
      x: clamp(G.ship.x, 36, VW - 36),
      y: clamp(G.ship.y - LOCK_LEAD, 70, VH - 80)
    };
  }

  function tryNuke() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.nukeCd > 0) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('核弹用尽', true);
      return;
    }
    G.bombs -= 1;
    G.nukeCd = 0.22;
    const lk = lockPoint();
    const superN = G.heat >= 0.98;
    if (superN) G.heat = 0;
    G.nukes.push({
      x: G.ship.x,
      y: G.ship.y - 10,
      x0: G.ship.x,
      y0: G.ship.y - 10,
      tx: lk.x,
      ty: lk.y,
      t: 0,
      life: superN ? 0.38 : 0.46,
      superN: superN
    });
    audio.drop();
    if (superN) toast('超核', false, true);
    syncHud();
  }

  function detonateNuke(n) {
    const rad = n.superN ? 118 : 72;
    const gDmg = n.superN ? 28 : 16;
    const aDmg = n.superN ? 12 : 5;
    explode(n.tx, n.ty, n.superN ? LIME : GOLD, n.superN ? 40 : 26);
    spawnMushroom(n.tx, n.ty, n.superN);
    ring(n.tx, n.ty, n.superN ? LIME : HOT);
    hitStop(n.superN ? 0.082 : 0.07);
    kick(n.superN ? 7.2 : 5.6, 'bomb');
    screenFlash(n.superN ? LIME : GOLD, n.superN ? 0.7 : 0.52);
    audio.nuke(n.superN);
    G.invuln = Math.max(G.invuln, 0.28);

    let kills = 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      if (hypot(b.x - n.tx, b.y - n.ty) < rad * 1.12) G.bullets.splice(i, 1);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.guns) {
        for (let k = 0; k < e.guns.length; k++) {
          if (!e.guns[k].alive) continue;
          const p = gunPos(e, e.guns[k]);
          if (hypot(p.x - n.tx, p.y - n.ty) < rad) damageGun(e, e.guns[k], gDmg);
        }
      }
      if (e.rods) {
        for (let k = 0; k < e.rods.length; k++) {
          if (!e.rods[k].alive) continue;
          const p = rodPos(e, e.rods[k]);
          if (hypot(p.x - n.tx, p.y - n.ty) < rad) damageRod(e, e.rods[k], gDmg);
        }
      }
      if (!e.alive) {
        kills += 1;
        continue;
      }
      const d = hypot(e.x - n.tx, e.y - n.ty);
      const er = (e.kind === 'fort' ? e.rad : e.r) + 8;
      if (d < rad + er) {
        const before = e.alive;
        damageEnemy(e, isGround(e) || e.kind === 'core' ? gDmg : aDmg, 'nuke');
        if (before && !e.alive) kills += 1;
      }
    }
    if (kills >= 3) {
      floatText(n.tx, n.ty - 18, '核爆 ' + kills, LIME, true);
      bumpCombo();
    }
    syncHud();
  }

  function killEnemy(e, how) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'core' || e.kind === 'fort' ? GOLD : (isGround(e) ? AMB : HOT);
    explode(e.x, e.y, rgb, e.kind === 'core' ? 40 : e.kind === 'fort' ? 32 : 14);
    if (e.guns) {
      for (let i = 0; i < e.guns.length; i++) {
        if (!e.guns[i].alive) continue;
        e.guns[i].alive = false;
        const p = gunPos(e, e.guns[i]);
        explode(p.x, p.y, AMB, 10);
      }
    }
    if (e.rods) {
      for (let i = 0; i < e.rods.length; i++) {
        if (!e.rods[i].alive) continue;
        e.rods[i].alive = false;
        const p = rodPos(e, e.rods[i]);
        explode(p.x, p.y, LIME, 10);
      }
    }
    const bonus = how === 'guns' || how === 'rods' ? Math.round(e.score * 0.5) : 0;
    const pts = Math.round((e.score + bonus) * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, '+' + pts, GOLD, pts >= 400);
    if (e.drop) spawnPow(e.x, e.y, e.drop);
    if (isGround(e) || e.kind === 'core') addHeat(e.kind === 'fort' || e.kind === 'core' ? 0.35 : 0.14);

    if (e.kind === 'core' || e.kind === 'fort') {
      audio.bossDie();
      hitStop(0.08);
      kick(7.2, 'boss');
      screenFlash(e.kind === 'core' ? LIME : GOLD, 0.6);
      spawnMushroom(e.x, e.y, e.kind === 'core');
      G.winT = 1.35;
      addScore(Math.round(SCORE.stage * G.mult));
    } else {
      audio.explode();
      hitStop(0.034);
      kick(2.2, 'hit');
    }
  }

  function damageGun(e, g, dmg) {
    if (!g.alive) return false;
    g.hp -= dmg;
    g.flash = 0.08;
    e.stun = Math.max(e.stun, 0.18);
    addScore(SCORE.chip * G.mult);
    addHeat(0.04);
    const p = gunPos(e, g);
    burst(p.x, p.y, AMB, 6, 70);
    spark(p.x, p.y, GOLD);
    audio.groundHit();
    hitStop(0.03);
    kick(1.8, 'hit');
    if (g.hp <= 0) {
      g.alive = false;
      explode(p.x, p.y, GOLD, 12);
      e.stun = 0.85;
      addScore(Math.round(SCORE.gun * G.mult));
      bumpCombo();
      addHeat(0.1);
      floatText(p.x, p.y, '炮破', GOLD, true);
      audio.fortCrack();
      hitStop(0.05);
      if (gunsAlive(e) <= 0) {
        floatText(e.x, e.y - 18, '全炮', LIME, true);
        e.hp = Math.min(e.hp, e.maxHp * 0.35);
      }
    }
    return true;
  }

  function damageRod(e, r, dmg) {
    if (!r.alive) return false;
    r.hp -= dmg;
    r.flash = 0.08;
    addScore(SCORE.chip * G.mult);
    addHeat(0.05);
    const p = rodPos(e, r);
    burst(p.x, p.y, LIME, 6, 70);
    spark(p.x, p.y, LIME);
    audio.hit(G.combo);
    hitStop(0.03);
    if (r.hp <= 0) {
      r.alive = false;
      explode(p.x, p.y, LIME, 12);
      addScore(Math.round(SCORE.rod * G.mult));
      bumpCombo();
      addHeat(0.12);
      floatText(p.x, p.y, '棒裂', LIME, true);
      audio.fortCrack();
      hitStop(0.05);
      e.stun = 0.7;
      if (rodsAlive(e) <= 0) {
        floatText(e.x, e.y - 18, '过热', LIME, true);
        toast('堆芯过热', false, true);
      }
    }
    return true;
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    let hurt = dmg;
    if (e.kind === 'core' && rodsAlive(e) > 0 && src !== 'nuke') hurt *= 0.45;
    if (e.kind === 'core' && rodsAlive(e) <= 0) hurt *= src === 'nuke' ? 1.6 : 1.25;
    if (e.kind === 'fort' && gunsAlive(e) > 0 && src !== 'nuke') hurt *= 0.55;
    if (isGround(e) && e.kind !== 'fort' && src === 'shot') hurt *= 0.4;
    e.hp -= hurt;
    e.flash = 0.07;
    if (src === 'pool') {
      burst(e.x, e.y, LIME, 2, 30);
    } else if (e.kind === 'fort' || e.kind === 'core') {
      audio.bossHit();
      hitStop(src === 'nuke' ? 0.05 : 0.038);
      kick(2.6, 'hit');
      burst(e.x, e.y, e.kind === 'core' ? LIME : GOLD, 5, 60);
    } else if (isGround(e)) {
      audio.groundHit();
      hitStop(0.032);
      kick(1.6, 'hit');
      burst(e.x, e.y, AMB, 4, 50);
      addHeat(0.035);
    } else {
      audio.hit(G.combo);
      hitStop(0.032);
      kick(1.6, 'hit');
      burst(e.x, e.y, HOT, 4, 55);
      spark(e.x, e.y, HOT);
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function hitPart(e, x, y, sr, dmg) {
    if (e.guns) {
      for (let i = 0; i < e.guns.length; i++) {
        const g = e.guns[i];
        if (!g.alive) continue;
        const p = gunPos(e, g);
        const rr = 12 + sr;
        if (hypot(p.x - x, p.y - y) < rr) {
          damageGun(e, g, dmg);
          return true;
        }
      }
    }
    if (e.rods) {
      for (let i = 0; i < e.rods.length; i++) {
        const r = e.rods[i];
        if (!r.alive) continue;
        const p = rodPos(e, r);
        const rr = 11 + sr;
        if (hypot(p.x - x, p.y - y) < rr) {
          damageRod(e, r, dmg);
          return true;
        }
      }
    }
    const er = e.kind === 'fort' ? 26 : e.r;
    if (hypot(e.x - x, e.y - y) < er + sr) {
      damageEnemy(e, dmg, 'shot');
      return true;
    }
    return false;
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    explode(G.ship.x, G.ship.y, MAG, 26);
    hitStop(0.072);
    kick(7.4, 'die');
    screenFlash(MAG, 0.55);
    audio.death();
    G.bullets.length = 0;
    breakCombo();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = 640;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.invuln = 1.5;
    G.deadT = 0;
    G.bullets.length = 0;
    toast('再飞', false, false);
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.nukes.length = 0;
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    mushrooms.length = 0;
    pools.length = 0;
    craters.length = 0;
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'rain' ? 'rain' : 'raid';
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
    G.heat = 0;
    G.heatHold = 0;
    G.bombs = 3;
    G.nukeCd = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.scroll = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 640;
    G.ship.vx = 0;
    G.ship.vy = 0;
    clearWorld();
    hideOverlay();
    if (scoreEl) scoreEl.textContent = '0';
    toast(isDense() ? '核雨' : '核袭', isDense(), !isDense());
    audio.start();
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.winT = 0;
    if (G.bombs < BOMB_CAP) G.bombs += 1;
    clearWorld();
    G.invuln = Math.max(G.invuln, 0.8);
    toast(stageData().name, false, true);
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.heat = 0;
    G.bombs = 3;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 630;
    clearWorld();
    showOverlay('title', '核袭', '空射击坠机群，Shift 丢核弹砸地上的堡。菱锁定点，蘑菇云清半径。堡垒之后是堆芯。');
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '废原上的堡还在。R 立刻再飞。');
    syncHud();
  }

  function goWin() {
    const bonus = isDense() ? 10000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    const lead = isDense()
      ? '核雨通关。超核把堆芯从地上打塌了。'
      : '堆芯尽碎。核弹把堡垒从地上打塌了。';
    showOverlay('win', isDense() ? '核雨通关' : '堆芯尽碎', lead);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
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
    for (let i = mushrooms.length - 1; i >= 0; i--) {
      mushrooms[i].t += dt;
      if (mushrooms[i].t >= mushrooms[i].life) mushrooms.splice(i, 1);
    }
    for (let i = craters.length - 1; i >= 0; i--) {
      craters[i].t += dt;
      craters[i].y += scrollSpd() * 0.55 * dt;
      if (craters[i].t >= craters[i].life) craters.splice(i, 1);
    }
    for (let i = pools.length - 1; i >= 0; i--) {
      const p = pools[i];
      p.t += dt;
      p.y += scrollSpd() * 0.4 * dt;
      p.dmgCd -= dt;
      if (p.t >= p.life) {
        pools.splice(i, 1);
        continue;
      }
      if (p.dmgCd <= 0 && G.mode === 'play' && G.deadT <= 0) {
        p.dmgCd = 0.18;
        const fade = 1 - p.t / p.life;
        for (let k = 0; k < G.enemies.length; k++) {
          const e = G.enemies[k];
          if (!e.alive) continue;
          if (hypot(e.x - p.x, e.y - p.y) < p.r * fade + e.r) {
            damageEnemy(e, 1, 'pool');
          }
        }
      }
    }
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      s.y += s.z * scrollSpd() * 0.45 * dt;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = Math.random() * VW;
      }
    }
  }

  function updateWorld(dt) {
    G.scroll += scrollSpd() * dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.35);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt * 8);
    updateFx(dt);
  }

  function updateShip(dt) {
    let ax = 0;
    let ay = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.ship.x;
      const dy = pointer.y - G.ship.y;
      const sp = shipSpeed();
      G.ship.x += clamp(dx, -sp * dt * 1.4, sp * dt * 1.4);
      G.ship.y += clamp(dy, -sp * dt * 1.4, sp * dt * 1.4);
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax && ay) {
        ax *= 0.707;
        ay *= 0.707;
      }
      const sp = shipSpeed();
      G.ship.vx = ax * sp;
      G.ship.vy = ay * sp;
      G.ship.x += G.ship.vx * dt;
      G.ship.y += G.ship.vy * dt;
    }
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
    const lk = lockPoint();
    G.lockX = lerp(G.lockX, lk.x, 0.22);
    G.lockY = lerp(G.lockY, lk.y, 0.22);
  }

  function fireShot(x, y, vx, vy, dmg) {
    G.shots.push({
      x: x,
      y: y,
      vx: vx || 0,
      vy: vy == null ? -740 : vy,
      r: 3.2,
      life: 1.1,
      dmg: dmg || 1
    });
    capArr(G.shots, 40);
  }

  function updateFire(dt) {
    const want = keys.sht || (inputSrc === 'ptr' && pointer.down);
    G.fireCd -= dt;
    if (!want || G.fireCd > 0) return;
    G.fireCd = isDense() ? 0.078 : 0.095;
    G.muzzle = 0.08;
    fireShot(G.ship.x - 7, G.ship.y - 12, 0, -740, 1);
    fireShot(G.ship.x + 7, G.ship.y - 12, 0, -740, 1);
    if (G.combo >= 9) fireShot(G.ship.x, G.ship.y - 16, 0, -760, 1);
    audio.shoot();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y < -20 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let k = 0; k < G.enemies.length; k++) {
        const e = G.enemies[k];
        if (!e.alive) continue;
        if (hitPart(e, s.x, s.y, s.r, s.dmg)) {
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateNukes(dt) {
    for (let i = G.nukes.length - 1; i >= 0; i--) {
      const n = G.nukes[i];
      n.t += dt;
      const u = clamp(n.t / n.life, 0, 1);
      const e = u * u * (3 - 2 * u);
      n.x = lerp(n.x0, n.tx, e);
      n.y = lerp(n.y0, n.ty, e);
      if (n.t >= n.life) {
        detonateNuke(n);
        G.nukes.splice(i, 1);
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 140 * dt;
      p.vx *= Math.exp(-dt * 1.2);
      if (p.x < 20 || p.x > VW - 20) p.vx *= -1;
      if (p.y > VH - 18) {
        p.y = VH - 18;
        p.vy *= -0.35;
      }
      if (p.t > 8) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(p.x - G.ship.x, p.y - G.ship.y) < 22) {
        collectPow(p);
        G.pows.splice(i, 1);
      }
    }
  }

  function updateBullets(dt) {
    const hr = HIT_R;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -30 || b.x > VW + 30 || b.y < -30 || b.y > VH + 30) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (G.deadT > 0 || G.invuln > 0) continue;
      if (hypot(b.x - G.ship.x, b.y - G.ship.y) < hr + b.r * 0.35) {
        G.bullets.splice(i, 1);
        diePlayer();
        return;
      }
    }
  }

  function fireEnemy(e, dt) {
    if (e.stun > 0) return;
    const rain = isDense();
    if (e.guns) {
      for (let i = 0; i < e.guns.length; i++) {
        const g = e.guns[i];
        if (!g.alive) continue;
        g.fireCd -= dt;
        if (g.fireCd > 0) continue;
        g.fireCd = rain ? 0.7 : 0.95;
        const p = gunPos(e, g);
        const a = Math.atan2(G.ship.y - p.y, G.ship.x - p.x);
        enemyShot(p.x, p.y, Math.cos(a) * bulletSpd(), Math.sin(a) * bulletSpd(), 3.5, AMB);
      }
    }
    e.fireCd -= dt;
    if (e.fireCd > 0) return;
    if (e.kind === 'grunt') {
      e.fireCd = (rain ? 1.05 : 1.45) + rand(0, 0.4);
      aimedFire(e, 1, 0, bulletSpd(), WHT);
    } else if (e.kind === 'elite') {
      e.fireCd = rain ? 0.7 : 0.95;
      aimedFire(e, 3, 0.18, bulletSpd(), AMB);
    } else if (e.kind === 'carrier') {
      e.fireCd = 1.35;
      spawnGrunt(e.x, e.y + 16, rand(-40, 40), 120 * dens());
      aimedFire(e, 1, 0, bulletSpd() * 0.8, WHT);
    } else if (e.kind === 'silo') {
      e.fireCd = rain ? 1.15 : 1.6;
      spawnMissile(e.x, e.y - 10);
    } else if (e.kind === 'bunker') {
      e.fireCd = rain ? 0.72 : 1.0;
      aimedFire(e, 2, 0.22, bulletSpd(), AMB);
    } else if (e.kind === 'turret') {
      e.fireCd = rain ? 0.55 : 0.78;
      aimedFire(e, 1, 0, bulletSpd() * 1.05, HOT);
    } else if (e.kind === 'fort') {
      e.fireCd = rain ? 0.85 : 1.1;
      const hp = e.hp / e.maxHp;
      if (hp < 0.55) ringFire(e, hp < 0.28 ? 10 : 8, bulletSpd() * 0.7, e.t * 0.8, HOT);
      if (hp < 0.32 && Math.random() < 0.35) spawnGrunt(e.x + rand(-40, 40), e.y + 30, 0, 110);
    } else if (e.kind === 'core') {
      e.fireCd = rain ? 0.38 : 0.5;
      const hp = e.hp / e.maxHp;
      const open = rodsAlive(e) <= 0;
      if (hp > 0.6) {
        aimedFire(e, open ? 3 : 1, 0.16, bulletSpd(), LIME);
        if (e.t % 2.2 < dt + 0.05) ringFire(e, 8, bulletSpd() * 0.72, e.spin, LIME);
      } else if (hp > 0.32) {
        aimedFire(e, 3, 0.2, bulletSpd(), GOLD);
        ringFire(e, open ? 12 : 10, bulletSpd() * 0.7, e.spin, LIME);
      } else {
        aimedFire(e, 5, 0.14, bulletSpd() * 1.05, HOT);
        ringFire(e, 8, bulletSpd() * 0.78, e.spin, LIME);
        ringFire(e, 8, bulletSpd() * 0.55, e.spin + Math.PI / 8, GOLD);
        if (Math.random() < 0.28) spawnGrunt(e.x + rand(-50, 50), e.y + 24, 0, 120);
      }
    }
  }

  function updateEnemies(dt) {
    const scr = scrollSpd();
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.stun > 0) e.stun -= dt;
      e.spin += dt * (e.kind === 'core' ? 0.7 : 0.35);

      if (e.kind === 'fort' || e.kind === 'core') {
        if (e.enter > 0) {
          e.enter -= dt;
          e.y = lerp(-80, 138, 1 - Math.max(0, e.enter) / 1.2);
        } else {
          e.y = 138 + Math.sin(e.t * 0.7) * 8;
          e.x = VW * 0.5 + Math.sin(e.t * 0.55) * e.amp * 0.55;
        }
      } else if (isGround(e)) {
        e.vy = scr;
        e.y += e.vy * dt;
      } else if (e.kind === 'dive') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vx += (G.ship.x - e.x) * dt * 0.8;
      } else if (e.kind === 'missile') {
        e.vx += (G.ship.x - e.x) * dt * 1.6;
        e.vy += 40 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else {
        e.y += e.vy * dt;
        e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp;
      }

      if (e.y > VH + 50 || e.x < -60 || e.x > VW + 60) {
        if (e.kind !== 'fort' && e.kind !== 'core') {
          e.alive = false;
          G.enemies.splice(i, 1);
          continue;
        }
      }

      fireEnemy(e, dt);

      if (G.deadT <= 0 && G.invuln <= 0) {
        const rr = (e.kind === 'fort' ? 24 : e.r * 0.72) + 6;
        if (hypot(e.x - G.ship.x, e.y - G.ship.y) < rr) {
          diePlayer();
          return;
        }
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateWorld(dt * 0.22);
      return;
    }

    if (G.mode === 'title') {
      G.scroll += 36 * dt;
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    if (G.nukeCd > 0) G.nukeCd -= dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateNukes(dt);
      updateBullets(dt);
      updatePows(dt);
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
    if (G.heatHold > 0) G.heatHold -= dt;
    else if (G.heat > 0 && G.heat < 1) G.heat = Math.max(0, G.heat - dt * 0.045);

    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateNukes(dt);
      updatePows(dt);
      if (G.winT <= 0) {
        if (G.stage >= STAGES.length) goWin();
        else nextStage();
      }
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateNukes(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePows(dt);
    updateWaves();
    updateWorld(dt);
    syncHud();
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawHpBar(e) {
    const w = e.kind === 'core' || e.kind === 'fort' ? 126 : 78;
    const x = e.x - w * 0.5;
    const y = e.y - (e.kind === 'core' || e.kind === 'fort' ? e.rad + 22 : (e.h || e.r) * 0.5 + 14);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, 5 * scale);
    const p = clamp(e.hp / Math.max(1, e.maxHp), 0, 1);
    ctx.fillStyle = rgba(p < 0.32 ? MAG : p < 0.6 ? AMB : LIME, 0.95);
    ctx.fillRect(sx(x), sy(y), w * p * scale, 5 * scale);
  }

  function drawBg() {
    const st = stageData();
    const biome = G.mode === 'title' ? 'waste' : st.biome;
    const g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    if (biome === 'forts') {
      g.addColorStop(0, '#2a0e08');
      g.addColorStop(0.45, '#1a0806');
      g.addColorStop(1, '#0c0404');
    } else if (biome === 'core') {
      g.addColorStop(0, '#241208');
      g.addColorStop(0.4, '#140806');
      g.addColorStop(1, '#081004');
    } else {
      g.addColorStop(0, '#24100a');
      g.addColorStop(0.4, '#160806');
      g.addColorStop(1, '#0a0404');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const scr = G.scroll;
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      ctx.fillStyle = rgba(i % 5 === 0 ? LIME : i % 3 === 0 ? GOLD : HOT, s.a * 0.65);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.s * scale, 0, TAU);
      ctx.fill();
    }

    const step = 48;
    const off = (scr * 0.7) % step;
    ctx.fillStyle = 'rgba(60, 22, 10, 0.35)';
    for (let y = -step; y < VH + step; y += step) {
      const yy = y + off;
      ctx.fillRect(sx(0), sy(yy), VW * scale, 3 * scale);
      if (biome === 'waste') {
        const xx = 30 + hash((y / step) | 0) * (VW - 60);
        ctx.fillStyle = 'rgba(90, 36, 16, 0.28)';
        ctx.fillRect(sx(xx), sy(yy - 10), 18 * scale, 14 * scale);
        ctx.fillStyle = 'rgba(60, 22, 10, 0.35)';
      }
    }

    if (biome === 'forts') {
      ctx.fillStyle = 'rgba(255, 77, 20, 0.07)';
      ctx.fillRect(sx(0), sy(0), 40 * scale, VH * scale);
      ctx.fillRect(sx(VW - 40), sy(0), 40 * scale, VH * scale);
      ctx.strokeStyle = 'rgba(255, 180, 40, 0.12)';
      ctx.lineWidth = 2 * scale;
      for (let y = -20; y < VH + 20; y += 18) {
        const yy = ((y + scr * 0.5) % (VH + 40)) - 20;
        ctx.beginPath();
        ctx.moveTo(sx(8), sy(yy));
        ctx.lineTo(sx(32), sy(yy + 10));
        ctx.moveTo(sx(VW - 8), sy(yy));
        ctx.lineTo(sx(VW - 32), sy(yy + 10));
        ctx.stroke();
      }
    } else if (biome === 'core') {
      ctx.strokeStyle = 'rgba(200, 255, 58, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const yy = ((hash(i + 3) * VH + scr * 0.3) % (VH + 80)) - 40;
        ctx.beginPath();
        ctx.arc(sx(VW * 0.5), sy(yy), (40 + i * 18) * scale, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(200, 255, 58, 0.04)';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      const a = 1 - c.t / c.life;
      ctx.fillStyle = rgba(DEEP, 0.45 * a);
      ctx.beginPath();
      ctx.ellipse(sx(c.x), sy(c.y), c.r * scale, c.r * 0.45 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.35 * a);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }

    if (hasBoss()) {
      ctx.fillStyle = rgba(biome === 'core' ? LIME : VER, 0.04);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawLock() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const x = G.lockX;
    const y = G.lockY;
    const hot = G.heat >= 0.98;
    ctx.save();
    ctx.strokeStyle = rgba(hot ? LIME : GOLD, 0.85);
    ctx.lineWidth = 1.4 * scale;
    const s = 9 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y) - s);
    ctx.lineTo(sx(x) + s, sy(y));
    ctx.lineTo(sx(x), sy(y) + s);
    ctx.lineTo(sx(x) - s, sy(y));
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 3 * scale, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(e) {
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (e.kind === 'core' ? LIME : e.kind === 'fort' ? HOT : isGround(e) ? AMB : HOT);

    if (e.kind === 'core') {
      ctx.save();
      ctx.strokeStyle = rgba(LIME, 0.28);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), (e.rad + 10) * scale, 0, TAU);
      ctx.stroke();
      if (e.rods) {
        for (let i = 0; i < e.rods.length; i++) {
          const r = e.rods[i];
          const p = rodPos(e, r);
          if (!r.alive) {
            ctx.fillStyle = 'rgba(80,30,16,0.5)';
            ctx.beginPath();
            ctx.arc(sx(p.x), sy(p.y), 6 * scale, 0, TAU);
            ctx.fill();
            continue;
          }
          ctx.fillStyle = rgba(r.flash > 0 ? WHT : LIME, 0.95);
          roundRect(ctx, sx(p.x - 5), sy(p.y - 10), 10 * scale, 20 * scale, 3 * scale);
          ctx.fill();
          ctx.strokeStyle = rgba(WHT, 0.5);
          ctx.lineWidth = 1 * scale;
          ctx.stroke();
        }
      }
      const pulse = 1 + Math.sin(e.t * 6) * 0.06;
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), e.r * pulse * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(flash ? WHT : (rodsAlive(e) <= 0 ? LIME : VER), 0.95);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), e.r * 0.62 * pulse * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), 6 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawHpBar(e);
      return;
    }

    if (e.kind === 'fort') {
      const w = e.w || 90;
      const h = e.h || 56;
      ctx.fillStyle = rgba(DEEP, 0.92);
      roundRect(ctx, sx(e.x - w * 0.5), sy(e.y - h * 0.5), w * scale, h * scale, 6 * scale);
      ctx.fill();
      ctx.strokeStyle = rgba(flash ? WHT : HOT, 0.95);
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(RUST, 0.7);
      ctx.fillRect(sx(e.x - w * 0.22), sy(e.y - h * 0.18), w * 0.44 * scale, h * 0.36 * scale);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(sx(e.x - 8), sy(e.y - 6), 16 * scale, 8 * scale);
      if (e.guns) {
        for (let i = 0; i < e.guns.length; i++) {
          const g = e.guns[i];
          const p = gunPos(e, g);
          if (!g.alive) {
            ctx.fillStyle = 'rgba(70,20,16,0.55)';
            ctx.fillRect(sx(p.x - 6), sy(p.y - 6), 12 * scale, 12 * scale);
            continue;
          }
          ctx.fillStyle = rgba(g.flash > 0 ? WHT : AMB, 0.95);
          ctx.fillRect(sx(p.x - 7), sy(p.y - 7), 14 * scale, 14 * scale);
          ctx.strokeStyle = rgba(WHT, 0.55);
          ctx.lineWidth = 1 * scale;
          ctx.strokeRect(sx(p.x - 7), sy(p.y - 7), 14 * scale, 14 * scale);
          const a = Math.atan2(G.ship.y - p.y, G.ship.x - p.x);
          ctx.strokeStyle = rgba(HOT, 0.9);
          ctx.lineWidth = 2.2 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(p.x), sy(p.y));
          ctx.lineTo(sx(p.x + Math.cos(a) * 12), sy(p.y + Math.sin(a) * 12));
          ctx.stroke();
        }
      }
      drawHpBar(e);
      return;
    }

    if (e.kind === 'silo') {
      ctx.fillStyle = rgba(flash ? WHT : RUST, 0.95);
      roundRect(ctx, sx(e.x - 11), sy(e.y - 16), 22 * scale, 30 * scale, 4 * scale);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y - 16), 8 * scale, Math.PI, 0);
      ctx.fill();
      return;
    }

    if (e.kind === 'bunker') {
      ctx.fillStyle = rgba(flash ? WHT : DEEP, 0.95);
      ctx.beginPath();
      ctx.moveTo(sx(e.x - 20), sy(e.y + 10));
      ctx.lineTo(sx(e.x - 14), sy(e.y - 10));
      ctx.lineTo(sx(e.x + 14), sy(e.y - 10));
      ctx.lineTo(sx(e.x + 20), sy(e.y + 10));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(AMB, 0.9);
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(sx(e.x - 8), sy(e.y - 4), 16 * scale, 5 * scale);
      return;
    }

    if (e.kind === 'turret') {
      ctx.fillStyle = rgba(flash ? WHT : RUST, 0.95);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), 11 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
      ctx.strokeStyle = rgba(HOT, 0.95);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(e.x), sy(e.y));
      ctx.lineTo(sx(e.x + Math.cos(a) * 16), sy(e.y + Math.sin(a) * 16));
      ctx.stroke();
      return;
    }

    if (e.kind === 'missile') {
      ctx.save();
      ctx.translate(sx(e.x), sy(e.y));
      const a = Math.atan2(e.vy, e.vx);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = rgba(flash ? WHT : GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -10 * scale);
      ctx.lineTo(4 * scale, 8 * scale);
      ctx.lineTo(-4 * scale, 8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(-1.4 * scale, 6 * scale, 2.8 * scale, 6 * scale);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.fillStyle = rgba(flash ? WHT : rgb, 0.95);
    if (e.kind === 'carrier') {
      roundRect(ctx, -20 * scale, -10 * scale, 40 * scale, 22 * scale, 4 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.8);
      ctx.fillRect(-10 * scale, -4 * scale, 20 * scale, 10 * scale);
    } else if (e.kind === 'elite') {
      ctx.beginPath();
      ctx.moveTo(0, -16 * scale);
      ctx.lineTo(14 * scale, 6 * scale);
      ctx.lineTo(0, 12 * scale);
      ctx.lineTo(-14 * scale, 6 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(LIME, 0.85);
      ctx.fillRect(-3 * scale, -4 * scale, 6 * scale, 8 * scale);
    } else if (e.kind === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 12 * scale);
      ctx.lineTo(9 * scale, -8 * scale);
      ctx.lineTo(0, -4 * scale);
      ctx.lineTo(-9 * scale, -8 * scale);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, 10 * scale);
      ctx.lineTo(8 * scale, -8 * scale);
      ctx.lineTo(0, -4 * scale);
      ctx.lineTo(-8 * scale, -8 * scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = p.kind === 'nuke' ? LIME : GOLD;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.font = '700 ' + Math.round(9 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.kind === 'nuke' ? '核' : '压', sx(p.x), sy(p.y + 0.5));
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), 2.2 * scale, 7 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y - 2), 1.1 * scale, 3.4 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawNukes() {
    for (let i = 0; i < G.nukes.length; i++) {
      const n = G.nukes[i];
      ctx.fillStyle = rgba(n.superN ? LIME : GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(n.x), sy(n.y), 5 * scale, 8 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(VER, 0.9);
      ctx.fillRect(sx(n.x - 2), sy(n.y + 4), 4 * scale, 6 * scale);
      ctx.strokeStyle = rgba(n.superN ? LIME : GOLD, 0.7);
      ctx.lineWidth = 1.2 * scale;
      const u = n.t / n.life;
      ctx.beginPath();
      ctx.arc(sx(n.tx), sy(n.ty), (10 + u * 16) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawBullets() {
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      ctx.fillStyle = rgba(b.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * 0.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPools() {
    for (let i = 0; i < pools.length; i++) {
      const p = pools[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = rgba(LIME, 0.12 * a);
      ctx.beginPath();
      ctx.ellipse(sx(p.x), sy(p.y), p.r * a * scale, p.r * 0.55 * a * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(LIME, 0.4 * a);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
  }

  function drawMushrooms() {
    for (let i = 0; i < mushrooms.length; i++) {
      const m = mushrooms[i];
      const u = clamp(m.t / m.life, 0, 1);
      const cap = (m.superN ? 38 : 24) * (0.35 + u * 0.9);
      const stemH = (m.superN ? 36 : 22) * u;
      ctx.fillStyle = rgba(m.superN ? LIME : GOLD, 0.55 * (1 - u));
      ctx.beginPath();
      ctx.ellipse(sx(m.x), sy(m.y - stemH * 0.35), cap * scale, cap * 0.45 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7 * (1 - u));
      ctx.fillRect(sx(m.x - 4), sy(m.y - stemH * 0.2), 8 * scale, stemH * 0.7 * scale);
      ctx.fillStyle = rgba(WHT, 0.45 * (1 - u));
      ctx.beginPath();
      ctx.ellipse(sx(m.x), sy(m.y - stemH * 0.5), cap * 0.45 * scale, cap * 0.22 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const x = G.ship.x;
    const y = G.ship.y;
    if (G.invuln > 0 && ((G.invuln * 16) | 0) % 2 === 0) return;

    ctx.save();
    ctx.translate(sx(x), sy(y));

    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.beginPath();
    ctx.moveTo(-3 * scale, 10 * scale);
    ctx.lineTo(0, 22 * scale);
    ctx.lineTo(3 * scale, 10 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(VER, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16 * scale);
    ctx.lineTo(12 * scale, 8 * scale);
    ctx.lineTo(4 * scale, 6 * scale);
    ctx.lineTo(0, 12 * scale);
    ctx.lineTo(-4 * scale, 6 * scale);
    ctx.lineTo(-12 * scale, 8 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -12 * scale);
    ctx.lineTo(4 * scale, 2 * scale);
    ctx.lineTo(-4 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(LIME, 0.9);
    ctx.fillRect(-2.4 * scale, 2 * scale, 4.8 * scale, 7 * scale);

    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(-7 * scale, -16 * scale, 4 * scale, 0, TAU);
      ctx.arc(7 * scale, -16 * scale, 4 * scale, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
    drawLock();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life * 3, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2 * scale;
      const r = (8 + s.t * 18) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x) - r, sy(s.y));
      ctx.lineTo(sx(s.x) + r, sy(s.y));
      ctx.moveTo(sx(s.x), sy(s.y) - r);
      ctx.lineTo(sx(s.x), sy(s.y) + r);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = (3 - r.t * 2) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (12 + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = (f.gold ? '800 ' : '700 ') + Math.round((f.gold ? 16 : 13) * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.35);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#160806';
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
    ctx.fillStyle = '#160806';
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
    drawPools();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
    drawPows();
    drawShots();
    drawNukes();
    drawBullets();
    drawShip();
    drawMushrooms();
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
      startGame('raid');
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
      tryNuke();
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
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('rain');
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

  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      audio.ensure();
      tryNuke();
    });
  }

  seedEmbers();
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
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
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
      if (G.mode === 'win' && G.kind === 'raid') startGame('rain');
      else goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  bindBombBtn(btnBomb);
  bindBombBtn(btnPad);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.sht = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = keys.sht = false;
    } else {
      last = 0;
    }
  });

  requestAnimationFrame(frame);
})();
