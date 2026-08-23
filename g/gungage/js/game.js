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
  const HIT_R = 4.4;
  const SHOT_V = 750;
  const BOMB_MAX = 6;
  const BOMB_START = 3;
  const GAGE_FULL = 0.85;
  const BEST_KEY = 'playbox-gungage-best';
  const MUTE_KEY = 'playbox-gungage-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 纪爆 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [58, 216, 255];
  const GOLD = [255, 184, 74];
  const HOT = [255, 122, 24];
  const COP = [224, 112, 32];
  const WHT = [255, 240, 216];
  const PNK = [255, 154, 212];
  const STEEL = [180, 140, 100];
  const DEEP = [28, 18, 8];
  const AMB = [255, 154, 58];

  const SCORE = {
    probe: 50,
    dive: 80,
    turret: 140,
    barge: 200,
    guard: 260,
    lens: 280,
    boss: 8000,
    crystal: 12,
    stage: 1600
  };

  const STAGES = [
    {
      name: '纪廊',
      biome: 'hall',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'stream', dir: 1 },
        { t: 5.4, kind: 'turrets' },
        { t: 7.8, kind: 'v', n: 7 },
        { t: 10.2, kind: 'dive', n: 4 },
        { t: 12.6, kind: 'barge' },
        { t: 15.0, kind: 'stream', dir: -1 },
        { t: 17.4, kind: 'v', n: 5 }
      ]
    },
    {
      name: '核川',
      biome: 'river',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'dive', n: 5 },
        { t: 4.4, kind: 'turrets' },
        { t: 6.4, kind: 'guard' },
        { t: 8.2, kind: 'barge' },
        { t: 10.0, kind: 'v', n: 9 },
        { t: 12.2, kind: 'stream', dir: 1 },
        { t: 14.4, kind: 'dive', n: 6 },
        { t: 16.6, kind: 'guard' }
      ]
    },
    {
      name: '纪核',
      biome: 'core',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'turrets' },
        { t: 4.0, kind: 'guard' },
        { t: 6.0, kind: 'barge' },
        { t: 8.0, kind: 'dive', n: 5 },
        { t: 9.6, kind: 'v', n: 9 },
        { t: 13.0, kind: 'boss' }
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
  const gageBar = document.getElementById('gage-bar');
  const gageWrap = document.getElementById('gage-wrap');

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

  const keys = { l: false, r: false, u: false, d: false, sht: false, bomb: false };
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
    pickups: [],
    missiles: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    lock: null,
    lockId: 0,
    lockSnap: 0,
    gage: 0,
    wasFull: false,
    bombsStock: BOMB_START,
    bombCd: 0,
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
    winT: 0,
    dropSeq: 0,
    lockHum: 0
  };

  let inputSrc = 'key';
  let lockUid = 1;

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
    return isSea() ? 322 : 280;
  }
  function fireRate() {
    const base = isSea() ? 0.074 : 0.088;
    return base * (G.gage >= GAGE_FULL ? 0.86 : 1);
  }
  function bulletSpd() {
    return isSea() ? 184 : 144;
  }
  function scrollSpd() {
    if (hasBoss()) return 24;
    return isSea() ? 126 : 90;
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function isGround(e) {
    return e.kind === 'turret';
  }
  function biome() {
    const st = STAGES[G.stage - 1];
    return st ? st.biome : 'hall';
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
      const full = G.gage >= GAGE_FULL;
      this.beep(full ? 640 : 900, 0.04, 'square', 0.024, full ? 1480 : 1720);
    },
    lockOn() {
      this.ensure();
      this.beep(520, 0.07, 'triangle', 0.034, 1180);
      this.beep(1320, 0.09, 'square', 0.022, 1980);
    },
    lockHum() {
      this.ensure();
      this.beep(210, 0.07, 'sawtooth', 0.014, 140);
      this.beep(1480, 0.04, 'sine', 0.012, 1880);
    },
    gageFill() {
      this.ensure();
      this.beep(760, 0.05, 'sine', 0.022, 1240);
    },
    full() {
      this.ensure();
      this.beep(880, 0.09, 'square', 0.04, 1320);
      this.beep(1320, 0.14, 'triangle', 0.034, 1980);
      this.beep(1760, 0.16, 'sine', 0.028, 2200);
    },
    dart() {
      this.ensure();
      this.beep(1080, 0.05, 'triangle', 0.026, 1760);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, 0.026, 1400);
      this.beep(620 * lift, 0.05, 'square', 0.034, 980 * lift);
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
    bomb() {
      this.ensure();
      this.noise(0.16, 0.055, 280);
      this.beep(180, 0.22, 'sawtooth', 0.05, 60);
      this.beep(720, 0.16, 'square', 0.04, 1480);
      this.beep(1240, 0.2, 'triangle', 0.034, 1980);
    },
    pickup() {
      this.ensure();
      this.beep(980, 0.07, 'sine', 0.032, 1480);
      this.beep(1480, 0.09, 'triangle', 0.022, 1980);
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
    empty() {
      this.ensure();
      this.beep(160, 0.08, 'square', 0.03, 80);
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
      hitStop(0.052);
      kick(3.1);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.044);
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
      if (G.mode === 'title') stageLabel.textContent = '枪纪';
      else if (hasBoss()) stageLabel.textContent = '纪主';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '纪雨' : '枪纪';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.gage >= GAGE_FULL);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombsStock;
      bombLabel.classList.toggle('empty', G.bombsStock <= 0);
    }
    if (gageBar) gageBar.style.transform = 'scaleX(' + clamp(G.gage, 0, 1) + ')';
    if (gageWrap) gageWrap.classList.toggle('hot', G.gage >= GAGE_FULL);
    if (btnBomb) {
      btnBomb.classList.toggle('on', G.gage >= GAGE_FULL);
      btnBomb.classList.toggle('empty', G.bombsStock <= 0);
    }
    if (btnPad) btnPad.classList.toggle('on', G.gage >= GAGE_FULL);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 自动锁敌，打满纪条', 'warn');
    else if (G.mode === 'win') setHint('纪核已碎 · R 再来', 'hot');
    else if (G.bombsStock <= 0) setHint('纪爆用尽 · 吃 爆 补弹 · 锁杀续链', 'warn');
    else if (G.gage >= GAGE_FULL) setHint('满纪 · 锁弹追敌 · Shift 满纪爆', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 锁杀续链', 'warn');
    else setHint('自动锁敌 · 打满纪条 · Shift 纪爆锁弹雨', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GGAG';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5.5 ? 'bomb' : mag >= 5 ? 'boss' : mag >= 3.4 ? 'lock' : 'hit');
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
    const scaled = spec.kind !== 'boss' && spec.kind !== 'lens';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (scaled ? hpMul() : 1)));
    const e = {
      alive: true,
      id: lockUid++,
      kind: spec.kind || 'probe',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 94 * dens() : spec.vy,
      hp: spec.kind === 'boss' || spec.kind === 'lens' ? spec.hp : hp,
      maxHp: spec.kind === 'boss' || spec.kind === 'lens' ? spec.hp : hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.probe,
      ang: spec.ang || 0,
      rad: spec.rad || 58,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: spec.kind === 'turret'
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
    capArr(G.bullets, 280);
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

  function spawnProbe(x, y, vx, vy) {
    spawnEnemy({
      kind: 'probe',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 98 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.probe,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    const extra = isSea() ? 2 : 0;
    const count = n + extra;
    for (let i = 0; i < count; i++) {
      const k = i - (count - 1) * 0.5;
      spawnProbe(c + k * 36, -26 - Math.abs(k) * 16, 0, 102 * dens());
    }
  }

  function spawnStream(dir) {
    const fromLeft = dir < 0;
    for (let i = 0; i < (isSea() ? 8 : 6); i++) {
      const x = fromLeft ? 50 + i * 18 : VW - 50 - i * 18;
      spawnProbe(x, -22 - i * 18, fromLeft ? 36 : -36, 108 * dens());
    }
  }

  function spawnDive(n) {
    const extra = isSea() ? 1 : 0;
    const count = n + extra;
    for (let i = 0; i < count; i++) {
      const k = i - (count - 1) * 0.5;
      spawnEnemy({
        kind: 'dive',
        x: VW * 0.5 + k * 52,
        y: -30 - Math.abs(k) * 10,
        vx: k * 12,
        vy: 70 * dens(),
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: rand(0.4, 0.9)
      });
    }
  }

  function spawnTurrets() {
    spawnEnemy({
      kind: 'turret',
      x: 86,
      y: -20,
      vy: 64 * dens(),
      hp: 7,
      r: 16,
      score: SCORE.turret,
      fireCd: 0.8
    });
    spawnEnemy({
      kind: 'turret',
      x: VW - 86,
      y: -48,
      vy: 64 * dens(),
      hp: 7,
      r: 16,
      score: SCORE.turret,
      fireCd: 1.1
    });
  }

  function spawnBarge() {
    spawnEnemy({
      kind: 'barge',
      x: VW * 0.5 + rand(-40, 40),
      y: -36,
      vy: 58 * dens(),
      hp: 8,
      r: 22,
      amp: 70,
      score: SCORE.barge,
      fireCd: 0.7
    });
  }

  function spawnGuard() {
    spawnEnemy({
      kind: 'guard',
      x: VW * 0.5,
      y: -34,
      vy: 46 * dens(),
      hp: 12,
      r: 18,
      amp: 92,
      score: SCORE.guard,
      fireCd: 0.55
    });
    if (isSea()) {
      spawnEnemy({
        kind: 'guard',
        x: VW * 0.32,
        y: -58,
        vy: 42 * dens(),
        hp: 12,
        r: 18,
        amp: 54,
        score: SCORE.guard,
        fireCd: 0.7
      });
    }
  }

  function spawnBoss() {
    const hp = isSea() ? 132 : 108;
    spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: hp,
      r: 46,
      score: SCORE.boss,
      enter: 1.35,
      fireCd: 0.8
    });
    const lensHp = isSea() ? 16 : 12;
    spawnEnemy({
      kind: 'lens',
      x: VW * 0.5 + 70,
      y: 80,
      hp: lensHp,
      r: 14,
      score: SCORE.lens,
      ang: 0,
      rad: 78,
      fireCd: 0.6
    });
    spawnEnemy({
      kind: 'lens',
      x: VW * 0.5 - 70,
      y: 80,
      hp: lensHp,
      r: 14,
      score: SCORE.lens,
      ang: Math.PI,
      rad: 78,
      fireCd: 0.85
    });
    toast('纪主', false, true);
    audio.wave();
    screenFlash(CYN, 0.28);
    kick(4.2, 'lock');
    syncHud();
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n || 5, w.x);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n || 4);
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'barge') spawnBarge();
    else if (w.kind === 'guard') spawnGuard();
    else if (w.kind === 'boss') spawnBoss();
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

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function fillGage(n) {
    if (G.mode !== 'play' || n <= 0) return;
    const prev = G.gage;
    G.gage = clamp(G.gage + n, 0, 1);
    if (prev < GAGE_FULL && G.gage >= GAGE_FULL && !G.wasFull) {
      G.wasFull = true;
      audio.full();
      toast('满纪', false, true);
      floatText(G.ship.x, G.ship.y - 36, '满纪', CYN, true);
      ring(G.ship.x, G.ship.y - 8, CYN);
      burst(G.ship.x, G.ship.y - 12, CYN, 16, 180);
      hitStop(0.04);
      kick(3.5, 'lock');
      screenFlash(CYN, 0.28);
    }
  }

  function pickLock() {
    let best = null;
    let bestS = -1;
    const sx0 = G.ship.x;
    const sy0 = G.ship.y;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.y < -8 || e.y > VH + 10) continue;
      const dx = e.x - sx0;
      const dy = e.y - sy0;
      const dist = hypot(dx, dy);
      const ahead = e.y < sy0 - 8;
      const cone = Math.abs(dx) < 138 + Math.max(0, sy0 - e.y) * 0.12;
      let s = 40 - dist * 0.04;
      if (e.kind === 'boss') s += 80;
      else if (e.kind === 'guard' || e.kind === 'lens') s += 22;
      else if (e.kind === 'barge') s += 12;
      if (ahead && cone) s += 36;
      else if (ahead) s += 10;
      else s -= 20;
      if (s > bestS) {
        bestS = s;
        best = e;
      }
    }
    return best;
  }

  function updateLock(dt) {
    const next = G.mode === 'play' && G.deadT <= 0 ? pickLock() : null;
    const nid = next ? next.id : 0;
    if (nid !== G.lockId) {
      G.lock = next;
      G.lockId = nid;
      if (next) {
        G.lockSnap = 0.16;
        audio.lockOn();
        spark(next.x, next.y, CYN);
      } else {
        G.lockSnap = 0;
      }
    } else {
      G.lock = next;
    }
    if (G.lockSnap > 0) G.lockSnap -= dt;
    if (G.lock) {
      G.lockHum -= dt;
      if (G.lockHum <= 0) {
        G.lockHum = 0.22;
        if (G.gage >= 0.4) audio.lockHum();
      }
    }
  }

  function lockAngle() {
    if (!G.lock) return -Math.PI * 0.5;
    return Math.atan2(G.lock.y - (G.ship.y - 14), G.lock.x - G.ship.x);
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.05;
    const aim = lockAngle();
    const up = -Math.PI * 0.5;
    const pull = G.lock ? lerp(0.12, 0.32, G.gage) : 0;
    const a0 = lerp(up, aim, pull);
    const g = G.gage;
    const dmg = 1 + g * 0.4;
    if (g < 0.28) {
      for (let i = -1; i <= 1; i += 2) {
        const a = a0 + i * 0.08;
        G.shots.push({
          x: G.ship.x + i * 6,
          y: G.ship.y - 14,
          vx: Math.cos(a) * SHOT_V,
          vy: Math.sin(a) * SHOT_V,
          r: 3.2,
          dmg: dmg,
          home: false
        });
      }
    } else {
      const spread = g >= GAGE_FULL ? 0.16 : 0.2;
      for (let i = -1; i <= 1; i++) {
        const a = a0 + i * spread;
        G.shots.push({
          x: G.ship.x + i * 7,
          y: G.ship.y - 14,
          vx: Math.cos(a) * SHOT_V,
          vy: Math.sin(a) * SHOT_V,
          r: 3.4,
          dmg: dmg,
          home: false
        });
      }
    }
    if (g >= 0.5 && G.lock) {
      const n = g >= GAGE_FULL ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const side = i === 0 ? -1 : 1;
        G.shots.push({
          x: G.ship.x + side * 12,
          y: G.ship.y - 8,
          vx: side * 80,
          vy: -520,
          r: 4.1,
          dmg: 1.25 + g * 0.55,
          home: true,
          target: G.lock,
          life: 1.35
        });
      }
      audio.dart();
    }
    capArr(G.shots, 64);
    audio.shoot();
  }

  function fireBomb() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return;
    if (G.bombCd > 0) return;
    if (G.bombsStock <= 0) {
      toast('纪爆用尽', true, false);
      audio.empty();
      return;
    }
    G.bombsStock -= 1;
    G.bombCd = 0.52;
    const full = G.gage >= GAGE_FULL;
    const power = 0.35 + G.gage * 0.65;
    const nMis = 6 + ((G.gage * 8) | 0);
    audio.bomb();
    hitStop(full ? 0.078 : 0.062);
    kick(full ? 7.2 : 5.8, 'bomb');
    screenFlash(full ? CYN : GOLD, full ? 0.7 : 0.52);
    explode(G.ship.x, G.ship.y - 10, CYN, full ? 36 : 22);
    ring(G.ship.x, G.ship.y - 8, GOLD);
    if (full) {
      toast('满纪爆', false, true);
      floatText(G.ship.x, G.ship.y - 40, '满纪爆', CYN, true);
    } else {
      floatText(G.ship.x, G.ship.y - 36, '纪爆', GOLD, true);
    }
    G.invuln = Math.max(G.invuln, 0.55);
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      burst(b.x, b.y, CYN, 3, 70);
      if (full && Math.random() < 0.18) spawnPickup(b.x, b.y, 'gage');
    }
    G.bullets.length = 0;
    const dmg = 6 + power * 8;
    const targets = [];
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) targets.push(G.enemies[i]);
    }
    for (let i = 0; i < nMis; i++) {
      const t = targets.length ? targets[i % targets.length] : null;
      const a = -Math.PI * 0.5 + (i - nMis * 0.5) * 0.18;
      G.missiles.push({
        x: G.ship.x + Math.cos(a) * 8,
        y: G.ship.y - 12,
        vx: Math.cos(a) * 120,
        vy: Math.sin(a) * 420 - 180,
        r: 4.6,
        dmg: 1.6 + power * 1.4,
        home: true,
        target: t,
        life: 1.7,
        t: 0
      });
    }
    capArr(G.missiles, 40);
    for (let i = 0; i < targets.length; i++) {
      damageEnemy(targets[i], dmg, 'bomb');
    }
    G.gage = full ? 0.18 : Math.max(0.08, G.gage * 0.22);
    G.wasFull = false;
    syncHud();
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({
      x: x,
      y: y,
      vx: rand(-30, 30),
      vy: rand(28, 52),
      kind: kind,
      life: 7.5,
      t: 0
    });
    capArr(G.pickups, 18);
  }

  function rollDrop(e) {
    if (e.kind === 'boss' || e.kind === 'lens') return null;
    if (e.kind === 'barge') return 'gage';
    if (e.kind === 'guard') {
      G.dropSeq += 1;
      return G.dropSeq % 3 === 0 ? 'bomb' : 'gage';
    }
    if (e.kind === 'turret') return Math.random() < 0.28 ? 'gage' : null;
    return Math.random() < 0.1 ? 'gage' : null;
  }

  function grabPickup(p) {
    if (p.kind === 'gage') {
      fillGage(0.22);
      addScore(Math.round(SCORE.crystal * G.mult));
      audio.gageFill();
      audio.pickup();
      burst(p.x, p.y, CYN, 10, 120);
      floatText(p.x, p.y - 8, '纪', CYN, true);
    } else {
      if (G.bombsStock < BOMB_MAX) {
        G.bombsStock += 1;
        toast(G.bombsStock >= BOMB_MAX ? '爆满' : '补爆 +1', false, true);
      } else {
        addScore(Math.round(400 * G.mult));
      }
      audio.pickup();
      burst(p.x, p.y, MAG, 10, 130);
      floatText(p.x, p.y - 8, '爆', MAG, true);
    }
    bumpCombo();
    syncHud();
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    const locked = G.lock && G.lock.id === e.id;
    if (src === 'shot' || src === 'dart') {
      spark(e.x, e.y, locked ? CYN : GOLD);
      hitStop(src === 'dart' ? 0.03 : 0.034);
      audio.hit(G.combo);
      kick(1.6);
      fillGage(locked ? 0.045 : 0.016);
    } else if (src === 'bomb') {
      spark(e.x, e.y, CYN);
    }
    if (e.kind === 'boss' && src !== 'bomb') {
      addScore(SCORE.crystal * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const locked = G.lock && G.lock.id === e.id;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'guard' || e.kind === 'lens' ? HOT : COP;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'guard' ? 22 : 14);
    const gMul = 1 + G.gage * 0.5;
    const lMul = locked ? 1.4 : 1;
    const pts = Math.round(e.score * G.mult * gMul * lMul);
    addScore(pts);
    bumpCombo();
    fillGage(locked ? 0.12 : 0.05);
    floatText(e.x, e.y - 10, String(pts), locked ? CYN : rgb, e.kind === 'boss' || locked);
    if (locked) {
      floatText(e.x, e.y - 24, '锁杀', CYN, true);
      burst(e.x, e.y, CYN, 12, 160);
    }
    const drop = rollDrop(e);
    if (drop) spawnPickup(e.x, e.y, drop);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.72);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, CYN);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'lens') G.enemies[i].alive = false;
      }
      G.bullets.length = 0;
      G.winT = 1.35;
      toast('纪主碎裂', false, true);
    } else if (e.kind === 'guard' || e.kind === 'lens' || e.kind === 'barge') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    if (G.lock && G.lock.id === e.id) {
      G.lock = null;
      G.lockId = 0;
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.lock = null;
    G.lockId = 0;
    breakCombo();
    G.gage = Math.max(0, G.gage * 0.35);
    G.wasFull = false;
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, GOLD, 18);
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
    G.lock = null;
    G.lockId = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    G.lock = null;
    audio.lose();
    showOverlay('lose', '舰毁了', '自动锁敌，打满纪条。空格连射，Shift 纪爆。分数 ' + G.score + '。');
    setHint('R 重开 · 自动锁敌，打满纪条', 'warn');
  }

  function goWin() {
    addScore(isSea() ? 10000 : 8000);
    G.mode = 'win';
    G.lock = null;
    audio.win();
    showOverlay(
      'win',
      isSea() ? '纪雨通关' : '纪核尽碎',
      '三关打穿，纪主已碎。分数 ' + G.score + (isSea() ? ' · 纪雨' : ' · 枪纪') + '。'
    );
    setHint('纪核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.pickups.length = 0;
    G.missiles.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    if (G.bombsStock < BOMB_MAX) G.bombsStock += 1;
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '纪核'), false, true);
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
    G.lock = null;
    G.lockId = 0;
    G.lockSnap = 0;
    G.gage = 0;
    G.wasFull = false;
    G.bombsStock = BOMB_START;
    G.bombCd = 0;
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
    G.dropSeq = 0;
    G.lockHum = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '纪雨' : '枪纪', isSea(), !isSea());
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
    G.lock = null;
    G.lockId = 0;
    G.gage = 0;
    G.wasFull = false;
    G.bombsStock = BOMB_START;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '枪纪', '自动锁敌，打满纪条。空格连射，Shift 纪爆锁弹雨。短关之后是纪主。');
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
    G.scroll += scrollSpd() * dt;
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      p.y += (22 + p.z * 40) * dt;
      if (p.y > VH + 8) {
        p.y = -8;
        p.x = Math.random() * VW;
      }
    }
  }

  function fireInterval(e) {
    const sea = isSea() ? 0.74 : 1;
    if (e.kind === 'probe') return rand(1.15, 1.8) * sea;
    if (e.kind === 'dive') return rand(0.85, 1.4) * sea;
    if (e.kind === 'turret') return 1.05 * sea;
    if (e.kind === 'barge') return 0.95 * sea;
    if (e.kind === 'guard') return 0.72 * sea;
    if (e.kind === 'lens') return 0.8 * sea;
    return 1 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.fireCd > 0) e.fireCd -= dt;
    if (e.kind === 'probe') {
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp * 0.45;
      e.y += e.vy * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 24 && e.y < VH - 80) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'dive') {
      const pull = clamp((G.ship.x - e.x) * 1.6, -140, 140);
      e.vx = lerp(e.vx, pull, 1 - Math.exp(-dt * 1.8));
      e.vy += 48 * dt * dens();
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 30) {
        aimedFire(e, 1, 0, bulletSpd() * 1.05);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'turret') {
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 18) e.vy = 18;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 2, 0.22, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'barge') {
      e.x = e.baseX + Math.sin(e.t * 0.9 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 140 && e.vy > 20) e.vy = 20;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.2, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'guard') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 5, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'lens') {
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
          spawnProbe(e.x - 40, e.y + 20, -30, 110);
          spawnProbe(e.x + 40, e.y + 20, 30, 110);
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
        if (e.kind !== 'boss' && e.kind !== 'lens') {
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

  function homeToward(s, dt, turn) {
    const t = s.target;
    if (!t || !t.alive) return;
    const a = Math.atan2(t.y - s.y, t.x - s.x);
    const cur = Math.atan2(s.vy, s.vx);
    let d = a - cur;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    const max = turn * dt;
    const na = cur + clamp(d, -max, max);
    const spd = hypot(s.vx, s.vy);
    s.vx = Math.cos(na) * spd;
    s.vy = Math.sin(na) * spd;
  }

  function hitScan(s, src) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = e.x - s.x;
      const dy = e.y - s.y;
      const rr = e.r + s.r;
      if (dx * dx + dy * dy < rr * rr) {
        damageEnemy(e, s.dmg, src);
        return true;
      }
    }
    return false;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.home) {
        if (s.target && !s.target.alive) s.target = G.lock;
        homeToward(s, dt, 9.2);
        s.life -= dt;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -20 || s.x < -30 || s.x > VW + 30 || s.y > VH + 30 || (s.life != null && s.life <= 0)) {
        G.shots.splice(i, 1);
        continue;
      }
      if (hitScan(s, s.home ? 'dart' : 'shot')) G.shots.splice(i, 1);
    }
    for (let i = G.missiles.length - 1; i >= 0; i--) {
      const s = G.missiles[i];
      s.t += dt;
      s.life -= dt;
      if (s.target && !s.target.alive) {
        s.target = pickLock();
      }
      homeToward(s, dt, 7.4);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y < -30 || s.x < -40 || s.x > VW + 40) {
        G.missiles.splice(i, 1);
        continue;
      }
      if (hitScan(s, 'dart')) {
        burst(s.x, s.y, CYN, 6, 90);
        G.missiles.splice(i, 1);
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
      if (b.life <= 0 || b.y > VH + 20 || b.y < -30 || b.x < -20 || b.x > VW + 20) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (!canHurt) continue;
      const dx = b.x - G.ship.x;
      const dy = b.y - G.ship.y;
      const rr = b.r + HIT_R;
      if (dx * dx + dy * dy < rr * rr) {
        G.bullets.splice(i, 1);
        diePlayer();
        return;
      }
    }
  }

  function updatePickups(dt) {
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const p = G.pickups[i];
      p.t += dt;
      p.life -= dt;
      const dx = G.ship.x - p.x;
      const dy = G.ship.y - p.y;
      const dist = hypot(dx, dy);
      if (G.mode === 'play' && G.deadT <= 0 && dist < 92) {
        const pull = 220 + (92 - dist) * 6;
        p.vx += (dx / Math.max(1, dist)) * pull * dt;
        p.vy += (dy / Math.max(1, dist)) * pull * dt;
      } else {
        p.vy += 18 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.4);
      if (p.life <= 0 || p.y > VH + 24) {
        G.pickups.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && dist < 18) {
        grabPickup(p);
        G.pickups.splice(i, 1);
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
      if (G.gapT >= 1.55) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function updateShip(dt) {
    let ax = 0;
    let ay = 0;
    if (!overlayOpen()) {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
    }
    if (ax || ay) {
      const inv = 1 / Math.sqrt(ax * ax + ay * ay);
      ax *= inv;
      ay *= inv;
      inputSrc = 'key';
    }
    const spd = shipSpeed();
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && !overlayOpen()) {
      G.ship.x = lerp(G.ship.x, pointer.x, 1 - Math.exp(-dt * 14));
      G.ship.y = lerp(G.ship.y, pointer.y, 1 - Math.exp(-dt * 14));
    } else {
      G.ship.x += ax * spd * dt;
      G.ship.y += ay * spd * dt;
    }
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.bombCd > 0) G.bombCd -= dt;
    if (wantFire()) fireShot();
    if (G.gage > 0 && G.mode === 'play') {
      G.gage = Math.max(0, G.gage - 0.055 * dt);
      if (G.gage < GAGE_FULL - 0.08) G.wasFull = false;
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
      if (living() < 6 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.45) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 50);
      }
      updateEnemies(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnemies(dt);
      updateShots(dt);
      updateBullets(dt);
      updatePickups(dt);
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
      updateEnemies(dt);
      updateShots(dt);
      updatePickups(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateLock(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePickups(dt);
    updateWaves(dt);
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

  function pathDia(c, x, y, r) {
    pathPoly(c, [
      [x, y - r],
      [x + r, y],
      [x, y + r],
      [x - r, y]
    ]);
  }

  function drawBg() {
    const c = ctx;
    const bio = biome();
    c.fillStyle = bio === 'core' ? '#100806' : bio === 'river' ? '#0c0a08' : '#0c0804';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(90), 10 * scale, sx(VW * 0.5), sy(VH * 0.4), 380 * scale);
    const glow = bio === 'core' ? 'rgba(58,216,255,0.1)' : bio === 'river' ? 'rgba(255,184,74,0.08)' : 'rgba(224,112,32,0.1)';
    g.addColorStop(0, glow);
    g.addColorStop(1, 'rgba(12,8,4,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const yOff = (G.scroll * 0.55) % 56;
    c.strokeStyle = 'rgba(224,112,32,0.1)';
    c.lineWidth = Math.max(0.6, 0.7 * scale);
    for (let row = -2; row < 18; row++) {
      const y = row * 56 - yOff;
      c.beginPath();
      c.moveTo(sx(VW * 0.5), sy(y - 18));
      c.lineTo(sx(VW - 48), sy(y + 18));
      c.lineTo(sx(VW * 0.5), sy(y + 54));
      c.lineTo(sx(48), sy(y + 18));
      c.closePath();
      c.stroke();
    }

    c.fillStyle = 'rgba(20,12,6,0.78)';
    c.fillRect(sx(0), sy(0), 36 * scale, VH * scale);
    c.fillRect(sx(VW - 36), sy(0), 36 * scale, VH * scale);
    const wallOff = (G.scroll * 0.78) % 40;
    for (let i = -1; i < 22; i++) {
      const y = i * 40 - wallOff;
      c.fillStyle = 'rgba(224,112,32,0.14)';
      pathDia(c, 18, y + 12, 11);
      c.fill();
      pathDia(c, VW - 18, y + 24, 11);
      c.fill();
      c.strokeStyle = rgba(bio === 'core' ? CYN : HOT, 0.28);
      c.lineWidth = Math.max(0.8, scale);
      pathDia(c, 18, y + 12, 11);
      c.stroke();
      pathDia(c, VW - 18, y + 24, 11);
      c.stroke();
      c.fillStyle = rgba(bio === 'river' ? GOLD : CYN, 0.22);
      c.fillRect(sx(14), sy(y + 8), 8 * scale, 4 * scale);
      c.fillRect(sx(VW - 22), sy(y + 20), 8 * scale, 4 * scale);
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      c.fillStyle = rgba(i % 3 === 0 ? CYN : i % 2 ? GOLD : HOT, p.a * 0.5);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawLock() {
    if (!G.lock || G.deadT > 0) return;
    const e = G.lock;
    const c = ctx;
    const pulse = 0.7 + Math.sin(G.t * 10) * 0.3;
    const r = e.r + 10 + (G.lockSnap > 0 ? G.lockSnap * 40 : 0);
    const rot = G.t * 2.4;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(CYN, 0.55 * pulse);
    c.lineWidth = Math.max(1.2, 1.4 * scale);
    pathPoly(c, [
      [e.x + Math.cos(rot) * r, e.y + Math.sin(rot) * r],
      [e.x + Math.cos(rot + Math.PI * 0.5) * r, e.y + Math.sin(rot + Math.PI * 0.5) * r],
      [e.x + Math.cos(rot + Math.PI) * r, e.y + Math.sin(rot + Math.PI) * r],
      [e.x + Math.cos(rot + Math.PI * 1.5) * r, e.y + Math.sin(rot + Math.PI * 1.5) * r]
    ]);
    c.stroke();
    c.strokeStyle = rgba(GOLD, 0.35);
    c.lineWidth = Math.max(0.8, scale);
    pathDia(c, e.x, e.y, r * 0.62);
    c.stroke();
    c.beginPath();
    c.moveTo(sx(G.ship.x), sy(G.ship.y - 16));
    c.lineTo(sx(e.x), sy(e.y));
    c.strokeStyle = rgba(CYN, 0.28 + G.gage * 0.28);
    c.lineWidth = Math.max(0.8, (0.8 + G.gage) * scale);
    c.setLineDash([5 * scale, 4 * scale]);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : e.kind === 'boss' ? COP : e.kind === 'guard' ? HOT : e.kind === 'lens' ? CYN : e.kind === 'barge' ? GOLD : e.kind === 'turret' ? STEEL : AMB;
    c.save();
    if (e.kind === 'probe') {
      pathDia(c, e.x, e.y, e.r);
      c.fillStyle = rgba(rgb, 0.92);
      c.fill();
      pathDia(c, e.x, e.y, e.r * 0.42);
      c.fillStyle = rgba(CYN, 0.7);
      c.fill();
    } else if (e.kind === 'dive') {
      pathPoly(c, [
        [e.x, e.y + e.r],
        [e.x + e.r * 0.7, e.y - e.r * 0.5],
        [e.x, e.y - e.r * 0.2],
        [e.x - e.r * 0.7, e.y - e.r * 0.5]
      ]);
      c.fillStyle = rgba(rgb, 0.95);
      c.fill();
    } else if (e.kind === 'turret') {
      c.fillStyle = rgba(STEEL, 0.95);
      c.fillRect(sx(e.x - 14), sy(e.y - 8), 28 * scale, 18 * scale);
      pathDia(c, e.x, e.y - 4, 8);
      c.fillStyle = rgba(HOT, 0.9);
      c.fill();
    } else if (e.kind === 'barge') {
      c.fillStyle = rgba(COP, 0.92);
      c.beginPath();
      c.roundRect
        ? (c.roundRect(sx(e.x - 22), sy(e.y - 12), 44 * scale, 24 * scale, 6 * scale), c.fill())
        : (c.fillRect(sx(e.x - 22), sy(e.y - 12), 44 * scale, 24 * scale));
      pathDia(c, e.x, e.y, 8);
      c.fillStyle = rgba(CYN, 0.8);
      c.fill();
    } else if (e.kind === 'guard') {
      pathDia(c, e.x, e.y, e.r);
      c.fillStyle = rgba(HOT, 0.95);
      c.fill();
      c.strokeStyle = rgba(CYN, 0.7);
      c.lineWidth = Math.max(1.2, 1.4 * scale);
      pathDia(c, e.x, e.y, e.r * 0.55);
      c.stroke();
    } else if (e.kind === 'lens') {
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), e.r * scale, 0, TAU);
      c.fillStyle = rgba(CYN, 0.85);
      c.fill();
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), e.r * 0.4 * scale, 0, TAU);
      c.fillStyle = rgba(WHT, 0.9);
      c.fill();
    } else if (e.kind === 'boss') {
      pathDia(c, e.x, e.y, e.r);
      c.fillStyle = rgba(COP, 0.96);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = Math.max(1.6, 1.8 * scale);
      pathDia(c, e.x, e.y, e.r * 0.72);
      c.stroke();
      c.beginPath();
      c.arc(sx(e.x), sy(e.y - 4), 12 * scale, 0, TAU);
      c.fillStyle = rgba(CYN, 0.85 + Math.sin(G.t * 6) * 0.1);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 36), sy(e.y + e.r + 8), 72 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : GOLD, 0.95);
      c.fillRect(sx(e.x - 36), sy(e.y + e.r + 8), 72 * ratio * scale, 5 * scale);
    }
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(s.home ? CYN : GOLD, 0.95);
      if (s.home) pathDia(c, s.x, s.y, s.r + 0.6);
      else {
        c.beginPath();
        c.ellipse(sx(s.x), sy(s.y), 2.1 * scale, 6.2 * scale, 0, 0, TAU);
      }
      c.fill();
    }
    for (let i = 0; i < G.missiles.length; i++) {
      const s = G.missiles[i];
      pathDia(c, s.x, s.y, s.r + 1);
      c.fillStyle = rgba(CYN, 0.95);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.7);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 2 * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fillStyle = rgba(MAG, 0.9);
      c.fill();
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.4 * scale, 0, TAU);
      c.fillStyle = rgba(WHT, 0.85);
      c.fill();
    }
    c.restore();
  }

  function drawPickups() {
    const c = ctx;
    for (let i = 0; i < G.pickups.length; i++) {
      const p = G.pickups[i];
      const bob = Math.sin(p.t * 8) * 2;
      if (p.kind === 'gage') {
        pathDia(c, p.x, p.y + bob, 8);
        c.fillStyle = rgba(CYN, 0.92);
        c.fill();
        c.fillStyle = rgba(DEEP, 0.9);
        c.font = 'bold ' + Math.max(8, 9 * scale) + 'px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('纪', sx(p.x), sy(p.y + bob + 0.5));
      } else {
        c.beginPath();
        c.arc(sx(p.x), sy(p.y + bob), 8 * scale, 0, TAU);
        c.fillStyle = rgba(MAG, 0.92);
        c.fill();
        c.fillStyle = rgba(WHT, 0.95);
        c.font = 'bold ' + Math.max(8, 9 * scale) + 'px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('爆', sx(p.x), sy(p.y + bob + 0.5));
      }
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const c = ctx;
    const x = G.ship.x;
    const y = G.ship.y;
    if (G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gr = 16 + G.gage * 10;
    c.strokeStyle = rgba(G.gage >= GAGE_FULL ? CYN : GOLD, 0.18 + G.gage * 0.35);
    c.lineWidth = Math.max(1, 1.2 * scale);
    c.beginPath();
    c.arc(sx(x), sy(y), gr * scale, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * clamp(G.gage, 0, 1));
    c.stroke();
    c.restore();

    pathPoly(c, [
      [x, y - 16],
      [x + 11, y + 8],
      [x + 4, y + 4],
      [x, y + 12],
      [x - 4, y + 4],
      [x - 11, y + 8]
    ]);
    c.fillStyle = rgba(COP, 0.96);
    c.fill();
    pathDia(c, x, y - 2, 6);
    c.fillStyle = rgba(G.gage >= GAGE_FULL ? CYN : GOLD, 0.95);
    c.fill();
    c.fillStyle = rgba(HOT, 0.85);
    c.fillRect(sx(x - 8), sy(y - 2), 3 * scale, 8 * scale);
    c.fillRect(sx(x + 5), sy(y - 2), 3 * scale, 8 * scale);
    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, G.muzzle * 8);
      c.beginPath();
      c.arc(sx(x), sy(y - 16), 6 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    const flame = 8 + Math.sin(G.t * 28) * 3;
    c.fillStyle = rgba(HOT, 0.55);
    c.beginPath();
    c.moveTo(sx(x - 3), sy(y + 10));
    c.lineTo(sx(x + 3), sy(y + 10));
    c.lineTo(sx(x), sy(y + 10 + flame));
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life * 2.2, 0, 0.9));
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const r = (1 - s.t) * 14;
      c.strokeStyle = rgba(s.rgb, 1 - s.t);
      c.lineWidth = Math.max(1, 1.4 * scale);
      c.beginPath();
      c.moveTo(sx(s.x - r), sy(s.y));
      c.lineTo(sx(s.x + r), sy(s.y));
      c.moveTo(sx(s.x), sy(s.y - r));
      c.lineTo(sx(s.x), sy(s.y + r));
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      c.strokeStyle = rgba(r.rgb, 1 - r.t);
      c.lineWidth = Math.max(1, (1.6 - r.t) * scale);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (10 + r.t * 46) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    c.font = 'bold ' + Math.max(10, 12 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      if (f.gold) {
        c.shadowColor = rgba(CYN, 0.6);
        c.shadowBlur = 8 * scale;
      }
      c.fillText(f.text, sx(f.x), sy(f.y));
      c.shadowBlur = 0;
    }
  }

  function drawFlash() {
    if (G.flash <= 0 || REDUCE) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#140c06';
    if (ox > 0.5) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - (ox + VW * scale) + 1, H);
    }
    if (oy > 0.5) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - (oy + VH * scale) + 1);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140c06';
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
    drawLock();
    for (let i = 0; i < air.length; i++) drawEnemy(air[i]);
    drawPickups();
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
    const bombKey = k === 'Shift' || k === 'z' || k === 'Z';
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
    if (bombKey) {
      if (down && !keys.bomb) {
        keys.bomb = true;
        inputSrc = 'key';
        e.preventDefault();
        if (!e.repeat) fireBomb();
      }
      if (!down) keys.bomb = false;
      if (down) e.preventDefault();
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

  function bindBomb(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      fireBomb();
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
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
  bindBomb(btnBomb);
  bindBomb(btnPad);

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
      keys.bomb = false;
    }
  });

  requestAnimationFrame(frame);
})();
