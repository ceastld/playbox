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
  const ABSORB_DELAY = 0.16;
  const FIELD_MIN = 38;
  const FIELD_MAX = 62;
  const STOCK_MAX = 28;
  const HIT_R = 4.6;
  const SHOT_V = 700;
  const MOS_V = 430;
  const CUBE_PICK = 16;
  const CUBE_MAG = 88;
  const BEST_KEY = 'playbox-mars-matrix-best';
  const MUTE_KEY = 'playbox-mars-matrix-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击（按住吸取）· R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const EMB = [255, 107, 61];
  const AMB = [255, 154, 60];
  const GOLD = [255, 196, 90];
  const WHT = [255, 240, 228];
  const PNK = [255, 154, 212];
  const DEEP = [28, 16, 8];
  const RUST = [154, 42, 18];
  const CUBE_RGB = [EMB, GOLD, CYN, MAG];
  const CUBE_NAME = ['赤', '金', '青', '粉'];

  const SCORE = {
    cube: 50,
    dive: 80,
    prism: 120,
    turret: 150,
    elite: 240,
    pod: 280,
    boss: 8000,
    pick: 18,
    sip: 6,
    chip: 10,
    stage: 1500
  };

  const STAGES = [
    {
      name: '赤廊',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'v', n: 7 },
        { t: 8.0, kind: 'turrets' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'prism' },
        { t: 15.2, kind: 'v', n: 7 },
        { t: 17.6, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '晶阵',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.5, kind: 'dive', n: 5 },
        { t: 4.6, kind: 'stream', dir: -1 },
        { t: 6.8, kind: 'prism' },
        { t: 8.4, kind: 'prism' },
        { t: 10.2, kind: 'turrets' },
        { t: 12.2, kind: 'elite' },
        { t: 14.4, kind: 'v', n: 9 },
        { t: 16.6, kind: 'dive', n: 6 },
        { t: 18.8, kind: 'stream', dir: 1 }
      ]
    },
    {
      name: '核渊',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.3, kind: 'dive', n: 5 },
        { t: 4.2, kind: 'elite' },
        { t: 6.2, kind: 'turrets' },
        { t: 8.0, kind: 'prism' },
        { t: 9.6, kind: 'v', n: 9 },
        { t: 13.4, kind: 'boss' }
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
  const btnCore = document.getElementById('btn-core');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAbs = document.getElementById('btn-abs');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const mosBar = document.getElementById('mos-bar');
  const mosWrap = document.getElementById('mos-wrap');

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

  const keys = { l: false, r: false, u: false, d: false, sht: false, abs: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const dust = [];

  const G = {
    mode: 'title',
    kind: 'core',
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
    cubeChain: 0,
    cubeCol: -1,
    next1up: LIFE_EVERY,
    enemies: [],
    shots: [],
    bullets: [],
    cubes: [],
    mosqs: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    holdT: 0,
    absorbing: false,
    stock: 0,
    fieldR: FIELD_MIN,
    absBuzz: 0,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: EMB,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0
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
    return G.kind === 'dense';
  }
  function dens() {
    return isDense() ? 1.28 : 1;
  }
  function shipSpeed() {
    const base = isDense() ? 312 : 270;
    return G.absorbing ? base * 0.62 : base;
  }
  function fireRate() {
    return isDense() ? 0.076 : 0.09;
  }
  function bulletSpd() {
    return isDense() ? 182 : 142;
  }
  function scrollSpd() {
    if (hasBoss()) return 20;
    return isDense() ? 122 : 86;
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function fieldRadius() {
    const p = clamp(G.stock / STOCK_MAX, 0, 1);
    return lerp(FIELD_MIN, FIELD_MAX, p);
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
      this.beep(760, 0.042, 'square', 0.026, 1520);
    },
    absorbOn() {
      this.ensure();
      this.beep(220, 0.14, 'sawtooth', 0.046, 90);
      this.beep(880, 0.16, 'triangle', 0.032, 420);
      this.noise(0.1, 0.04, 420);
    },
    gulp() {
      this.ensure();
      this.beep(980, 0.05, 'sine', 0.03, 240);
      this.beep(520, 0.06, 'triangle', 0.02, 180);
    },
    absHum() {
      this.ensure();
      this.beep(160, 0.08, 'sawtooth', 0.018, 110);
      this.beep(1100, 0.05, 'sine', 0.012, 780);
    },
    release(n) {
      this.ensure();
      const lift = 1 + Math.min(0.6, n * 0.03);
      this.beep(180, 0.12, 'sawtooth', 0.05, 70);
      this.beep(420 * lift, 0.14, 'square', 0.04, 1280 * lift);
      this.beep(980, 0.18, 'triangle', 0.034, 1760);
      this.noise(0.12, 0.048, 380);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1400);
      this.beep(580 * lift, 0.055, 'square', 0.036, 920 * lift);
    },
    cube(chain) {
      this.ensure();
      const lift = 1 + Math.min(0.8, chain * 0.06);
      this.beep(660 * lift, 0.07, 'sine', 0.034, 1320 * lift);
      this.beep(990 * lift, 0.09, 'triangle', 0.02, 1760 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.044, 68);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.055, 'sawtooth', 0.036, 170);
      this.beep(640, 0.07, 'square', 0.028, 900);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 260);
      this.beep(170, 0.3, 'sawtooth', 0.05, 48);
      this.beep(480, 0.22, 'triangle', 0.04, 200);
      this.beep(1080, 0.32, 'sine', 0.04, 1640);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 380);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.044, 46);
    },
    wave() {
      this.ensure();
      this.beep(370, 0.09, 'sine', 0.04, 494);
      this.beep(494, 0.11, 'sine', 0.04, 622);
      this.beep(740, 0.2, 'triangle', 0.044, 988);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 80);
      this.beep(130, 0.3, 'sine', 0.05, 44);
    },
    win() {
      this.ensure();
      this.beep(494, 0.1, 'square', 0.044, 622);
      this.beep(622, 0.12, 'triangle', 0.04, 740);
      this.beep(830, 0.18, 'sine', 0.05, 1244);
      this.beep(1244, 0.28, 'triangle', 0.04, 1660);
    },
    start() {
      this.ensure();
      this.beep(370, 0.09, 'square', 0.04, 740);
      this.beep(740, 0.14, 'triangle', 0.034, 1110);
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
      if (G.mode === 'title') stageLabel.textContent = '火阵';
      else if (hasBoss()) stageLabel.textContent = '火核';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密阵' : '火核';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.absorbing);
    }
    if (wpnLabel) {
      wpnLabel.textContent = G.absorbing ? '吸' : G.stock > 0 ? '蓄' : '点';
      wpnLabel.classList.toggle('abs', G.absorbing);
    }
    if (mosBar) {
      const p = G.absorbing && G.stock === 0
        ? clamp(G.holdT / ABSORB_DELAY, 0, 1) * 0.12
        : clamp(G.stock / STOCK_MAX, 0, 1);
      mosBar.style.transform = 'scaleX(' + p + ')';
    }
    if (mosWrap) mosWrap.classList.toggle('hot', G.absorbing || G.stock >= STOCK_MAX);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 点射扫阵，按住吸弹反打', 'warn');
    else if (G.mode === 'win') setHint('火核已碎 · R 再来', 'hot');
    else if (G.absorbing) setHint('吸取中 · 松开把弹丸打回去', 'hot');
    else if (G.stock > 0) setHint('槽里有 ' + G.stock + ' 发 · 再按住或松开反打', '');
    else if (G.lives === 1) setHint('最后一命 · 吸弹续链', 'warn');
    else setHint('点射扫阵 · 按住吸弹 · 松开反打 · 同色连链', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MARS';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'abs' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('abs');
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

  function seedDust() {
    dust.length = 0;
    for (let i = 0; i < 64; i++) {
      dust.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.12, 0.55),
        z: rand(0.3, 1.2)
      });
    }
  }

  function cubeColorFor(kind) {
    if (kind === 'prism') return 2;
    if (kind === 'turret') return 3;
    if (kind === 'elite' || kind === 'pod') return 1;
    if (kind === 'dive') return 1;
    if (kind === 'boss') return (Math.random() * 4) | 0;
    return 0;
  }

  function spawnCube(x, y, col) {
    const c = col == null ? ((Math.random() * 4) | 0) : col;
    G.cubes.push({
      x: x + rand(-8, 8),
      y: y + rand(-6, 6),
      vx: rand(-50, 50),
      vy: rand(16, 64),
      t: 0,
      spin: rand(0, TAU),
      col: c,
      rgb: CUBE_RGB[c]
    });
    capArr(G.cubes, 90);
  }

  function dropCubes(e) {
    let n = 1;
    if (e.kind === 'prism' || e.kind === 'turret' || e.kind === 'pod') n = 2;
    else if (e.kind === 'elite') n = 3;
    else if (e.kind === 'boss') n = 8;
    const col = cubeColorFor(e.kind);
    for (let i = 0; i < n; i++) {
      spawnCube(e.x, e.y, e.kind === 'boss' ? (i % 4) : col);
    }
  }

  function collectCube(c) {
    if (c.col === G.cubeCol) G.cubeChain += 1;
    else {
      G.cubeChain = 1;
      G.cubeCol = c.col;
    }
    const chain = Math.min(16, G.cubeChain);
    const pts = Math.round(SCORE.pick * chain * G.mult);
    addScore(pts);
    if (G.combo >= 1) bumpCombo();
    else {
      G.combo = 1;
      G.comboT = COMBO_WIN;
      G.mult = 1;
    }
    burst(c.x, c.y, c.rgb, 8, 90);
    audio.cube(chain);
    if (chain >= 4 && chain % 4 === 0) {
      floatText(c.x, c.y - 16, CUBE_NAME[c.col] + chain, c.rgb, true);
      hitStop(0.04);
      kick(2.6);
    }
    syncHud();
  }

  function spawnEnemy(spec) {
    const raw = spec.hp || 1;
    const hp = spec.kind === 'boss' || spec.kind === 'pod'
      ? raw
      : Math.max(1, Math.round(raw * hpMul()));
    const e = {
      alive: true,
      kind: spec.kind || 'cube',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 92 * dens() : spec.vy,
      hp: hp,
      maxHp: hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.cube,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      col: spec.col == null ? cubeColorFor(spec.kind) : spec.col
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r, col) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.5,
      life: 8,
      col: col == null ? 0 : col,
      pull: 0
    });
    capArr(G.bullets, 240);
  }

  function aimedFire(e, n, spread, spd) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.3, e.col);
    }
  }

  function ringFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.4, (e.col + (i % 2)) % 4);
    }
  }

  function spawnCubeShip(x, y, vx, vy) {
    spawnEnemy({
      kind: 'cube',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.cube,
      fireCd: rand(0.55, 1.35),
      col: 0
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnCubeShip(c + k * 36, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isDense() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'cube',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.cube,
        fireCd: 0.7 + i * 0.12,
        col: 0
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
        fireCd: 99,
        col: 1
      });
    }
  }

  function spawnPrism(x) {
    spawnEnemy({
      kind: 'prism',
      x: x == null ? (Math.random() < 0.5 ? 120 : 360) : x,
      y: -32,
      vy: 62 * dens(),
      hp: 5,
      r: 15,
      amp: 70,
      score: SCORE.prism,
      fireCd: 0.45,
      col: 2
    });
  }

  function spawnTurrets() {
    const n = isDense() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'turret',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 44 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.turret,
        fireCd: 0.55 + i * 0.1,
        col: 3
      });
    }
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
      fireCd: 0.5,
      col: 1
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
      fireCd: 0.7,
      col: 1
    });
  }

  function spawnBoss() {
    const dense = isDense();
    const boss = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: dense ? 126 : 96,
      r: 36,
      score: SCORE.boss,
      enter: 1.35,
      fireCd: 0.9,
      col: 0
    });
    boss.maxHp = boss.hp;
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 + 72,
      y: 30,
      hp: dense ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: 0,
      rad: 82,
      fireCd: 0.8,
      col: 2
    });
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 - 72,
      y: 30,
      hp: dense ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 82,
      fireCd: 1.05,
      col: 3
    });
    toast('火核', false, true);
    audio.wave();
    screenFlash(EMB, 0.36);
    kick(4.6, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isDense() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isDense() ? 1 : 0));
    else if (w.kind === 'prism') {
      spawnPrism(140);
      spawnPrism(340);
      if (isDense()) spawnPrism(240);
    } else if (w.kind === 'turrets') spawnTurrets();
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

  function nearestEnemy(x, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function wantAbsNow() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && keys.abs;
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.055;
    const spread = 0.18;
    for (let i = -1; i <= 1; i++) {
      const a = -Math.PI * 0.5 + i * spread;
      G.shots.push({
        x: G.ship.x + i * 7,
        y: G.ship.y - 14,
        vx: Math.cos(a) * SHOT_V,
        vy: Math.sin(a) * SHOT_V,
        r: 3.5,
        dmg: 1
      });
    }
    capArr(G.shots, 48);
    audio.shoot();
  }

  function engageAbsorb() {
    G.absorbing = true;
    G.fieldR = FIELD_MIN;
    audio.absorbOn();
    hitStop(0.04);
    kick(3.4, 'abs');
    screenFlash(CYN, 0.28);
    ring(G.ship.x, G.ship.y, CYN);
    floatText(G.ship.x, G.ship.y - 30, '吸', CYN, true);
    if (wpnLabel) {
      wpnLabel.classList.remove('hot');
      void wpnLabel.offsetWidth;
      wpnLabel.classList.add('hot');
      wpnTok += 1;
    }
    if (btnAbs) btnAbs.classList.add('held');
    syncHud();
  }

  function gulpBullet(b) {
    const was = G.stock;
    G.stock = Math.min(STOCK_MAX, G.stock + 1);
    addScore(Math.round(SCORE.sip * G.mult));
    burst(b.x, b.y, CUBE_RGB[b.col] || EMB, 6, 70);
    audio.gulp();
    if (G.combo >= 1) G.comboT = COMBO_WIN;
    if (was < STOCK_MAX && G.stock >= STOCK_MAX) {
      toast('满槽', false, true);
      floatText(G.ship.x, G.ship.y - 36, '满', GOLD, true);
    }
  }

  function applyAbsorb(dt) {
    G.fieldR = lerp(G.fieldR, fieldRadius(), 1 - Math.exp(-dt * 8));
    const r = G.fieldR;
    let n = 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      const dx = G.ship.x - b.x;
      const dy = G.ship.y - b.y;
      const d = hypot(dx, dy);
      if (d < r + b.r) {
        b.pull = 1;
        const k = 520 / Math.max(10, d);
        b.vx += (dx / Math.max(0.1, d)) * k * dt * 60;
        b.vy += (dy / Math.max(0.1, d)) * k * dt * 60;
        if (d < 14) {
          gulpBullet(b);
          G.bullets.splice(i, 1);
          n += 1;
        }
      }
    }
    if (n >= 4) {
      hitStop(0.03);
      spark(G.ship.x, G.ship.y, CYN);
    }
    G.absBuzz -= dt;
    if (G.absBuzz <= 0) {
      G.absBuzz = 0.12;
      audio.absHum();
    }
  }

  function releaseMosq() {
    const n = G.stock;
    if (n <= 0) {
      G.absorbing = false;
      if (btnAbs) btnAbs.classList.remove('held');
      syncHud();
      return;
    }
    G.stock = 0;
    G.absorbing = false;
    if (btnAbs) btnAbs.classList.remove('held');
    const tgt = nearestEnemy(G.ship.x, G.ship.y);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.5 + (i - (n - 1) * 0.5) * 0.12;
      const col = i % 4;
      G.mosqs.push({
        x: G.ship.x + Math.cos(a) * 10,
        y: G.ship.y - 12 + Math.sin(a) * 4,
        vx: Math.cos(a) * MOS_V,
        vy: Math.sin(a) * MOS_V,
        t: 0,
        wait: i * 0.018,
        dmg: 2.4,
        r: 5,
        col: col,
        rgb: CUBE_RGB[col],
        target: tgt
      });
    }
    capArr(G.mosqs, 48);
    audio.release(n);
    hitStop(n >= 12 ? 0.07 : 0.05);
    kick(n >= 12 ? 5.4 : 3.8, n >= 12 ? 'boss' : 'abs');
    screenFlash(n >= 12 ? GOLD : CYN, n >= 12 ? 0.5 : 0.34);
    ring(G.ship.x, G.ship.y - 8, GOLD);
    burst(G.ship.x, G.ship.y - 14, EMB, 12 + Math.min(16, n), 200);
    floatText(G.ship.x, G.ship.y - 34, '反 ' + n, GOLD, true);
    if (n >= 8) bumpCombo();
    syncHud();
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
    }
    if (src === 'mosq') {
      spark(e.x, e.y, CYN);
      hitStop(0.038);
      audio.hit(G.combo + 2);
      kick(2.2);
    }
    if (e.kind === 'boss' && src !== 'mosq') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : CUBE_RGB[e.col] || EMB;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    dropCubes(e);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.72);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, EMB);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      for (let i = G.bullets.length - 1; i >= 0; i--) {
        spawnCube(G.bullets[i].x, G.bullets[i].y, G.bullets[i].col);
        G.bullets.splice(i, 1);
      }
      G.winT = 1.35;
      toast('火核碎裂', false, true);
    } else if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'prism') {
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
    G.absorbing = false;
    G.holdT = 0;
    G.stock = 0;
    G.cubeChain = 0;
    G.cubeCol = -1;
    if (btnAbs) btnAbs.classList.remove('held');
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, EMB, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    G.mosqs.length = 0;
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    G.absorbing = false;
    G.holdT = 0;
    G.stock = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    G.absorbing = false;
    audio.lose();
    showOverlay('lose', '舰毁了', '点射扫阵，按住吸弹反打。同色方块连链。分数 ' + G.score + '。');
    setHint('R 重开 · 点射扫阵，按住吸弹反打', 'warn');
  }

  function goWin() {
    addScore(isDense() ? 10000 : 8000);
    G.mode = 'win';
    G.absorbing = false;
    audio.win();
    showOverlay(
      'win',
      isDense() ? '密阵通关' : '火核尽碎',
      '三关打穿，火核已碎。分数 ' + G.score + (isDense() ? ' · 密阵' : ' · 火核') + '。'
    );
    setHint('火核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.cubes.length = 0;
    G.mosqs.length = 0;
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
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '核渊'), false, true);
    audio.wave();
    screenFlash(EMB, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'dense' ? 'dense' : 'core';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.cubeChain = 0;
    G.cubeCol = -1;
    G.next1up = LIFE_EVERY;
    G.holdT = 0;
    G.absorbing = false;
    G.stock = 0;
    G.fieldR = FIELD_MIN;
    G.absBuzz = 0;
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
    if (btnAbs) btnAbs.classList.remove('held');
    if (scoreEl) scoreEl.textContent = '0';
    toast(isDense() ? '密阵' : '火核', isDense(), !isDense());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'core';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.absorbing = false;
    G.holdT = 0;
    G.stock = 0;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    if (btnAbs) btnAbs.classList.remove('held');
    clearWorld();
    showOverlay('title', '火阵', '点射扫阵，按住吸弹反打。同色方块连链。短关之后是火核。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else startGame(G.kind || 'core');
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
    for (let i = 0; i < dust.length; i++) {
      const s = dust[i];
      s.y += scr * 0.42 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
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
    const absNow = wantAbsNow();
    const fire = wantFire();
    if (!absNow && !fire) {
      if (G.absorbing || G.stock > 0) releaseMosq();
      G.holdT = 0;
      G.absorbing = false;
      if (btnAbs) btnAbs.classList.remove('held');
      return;
    }
    if (absNow) {
      G.holdT = ABSORB_DELAY;
      if (!G.absorbing) engageAbsorb();
      applyAbsorb(dt);
      return;
    }
    G.holdT += dt;
    if (G.holdT >= ABSORB_DELAY) {
      if (!G.absorbing) engageAbsorb();
      applyAbsorb(dt);
    } else {
      G.absorbing = false;
      fireShot();
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

  function updateMosqs(dt) {
    for (let i = G.mosqs.length - 1; i >= 0; i--) {
      const m = G.mosqs[i];
      if (m.wait > 0) {
        m.wait -= dt;
        m.x = lerp(m.x, G.ship.x, 0.2);
        m.y = lerp(m.y, G.ship.y - 12, 0.2);
        continue;
      }
      m.t += dt;
      if (!m.target || !m.target.alive) m.target = nearestEnemy(m.x, m.y);
      if (m.target) {
        const a = Math.atan2(m.target.y - m.y, m.target.x - m.x);
        const spd = MOS_V + Math.min(180, m.t * 220);
        m.vx = lerp(m.vx, Math.cos(a) * spd, 1 - Math.exp(-dt * 7));
        m.vy = lerp(m.vy, Math.sin(a) * spd, 1 - Math.exp(-dt * 7));
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.t > 1.45 || m.y < -30 || m.x < -30 || m.x > VW + 30) {
        G.mosqs.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = m.x - e.x;
        const dy = m.y - e.y;
        const rr = e.r + m.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, m.dmg, 'mosq');
          burst(m.x, m.y, m.rgb, 8, 110);
          hit = true;
          break;
        }
      }
      if (hit) G.mosqs.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !G.absorbing;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      if (!b.pull) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= Math.exp(-dt * 1.2);
      }
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

  function updateCubes(dt) {
    for (let i = G.cubes.length - 1; i >= 0; i--) {
      const s = G.cubes[i];
      s.t += dt;
      s.spin += dt * 4.2;
      const magnet = G.combo >= 2 || G.absorbing ? 300 : 180;
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.ship.x - s.x;
        const dy = G.ship.y - s.y;
        const d = hypot(dx, dy);
        if (d < CUBE_PICK) {
          collectCube(s);
          G.cubes.splice(i, 1);
          continue;
        }
        if (d < CUBE_MAG) {
          const k = magnet / Math.max(24, d);
          s.vx += (dx / d) * k * dt * 60;
          s.vy += (dy / d) * k * dt * 60;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= Math.exp(-dt * 1.4);
      if (s.y > VH + 20 || s.t > 6) G.cubes.splice(i, 1);
    }
  }

  function fireInterval(e) {
    const sea = isDense() ? 0.74 : 1;
    if (e.kind === 'cube') return 1.45 * sea;
    if (e.kind === 'prism') return 1.05 * sea;
    if (e.kind === 'turret') return 0.92 * sea;
    if (e.kind === 'elite') return 0.82 * sea;
    if (e.kind === 'pod') return 1.1 * sea;
    if (e.kind === 'boss') return 0.55 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'cube') {
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
    } else if (e.kind === 'prism') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'turret') {
      e.y += e.vy * dt;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isDense() ? 2 : 1, 0.16, bulletSpd() * 0.92);
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
        e.fireCd = 1.15 * (isDense() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        ringFire(e, 10, spd * 0.8, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.52 * (isDense() ? 0.78 : 1);
      } else {
        ringFire(e, 12, spd * 0.78, e.spin);
        ringFire(e, 8, spd * 0.58, -e.spin * 0.7);
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnCubeShip(e.x - 40, e.y + 20, -30, 110);
          spawnCubeShip(e.x + 40, e.y + 20, 30, 110);
        }
        e.fireCd = 0.42 * (isDense() ? 0.78 : 1);
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
        const rr = (e.kind === 'boss' ? e.r * 0.62 : e.r * 0.7) + HIT_R;
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
      if (G.gapT >= 1.55) {
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
      updateMosqs(dt);
      updateBullets(dt);
      updateCubes(dt);
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
      updateMosqs(dt);
      updateCubes(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateMosqs(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateCubes(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathHex(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (rot || 0) + i * (TAU / 6) - Math.PI / 2;
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawIso(c, x, y, s, rgb, flash) {
    const hx = s * 0.92;
    const hy = s * 0.52;
    const top = flash ? WHT : rgb;
    const left = flash ? WHT : [Math.max(20, rgb[0] * 0.55 | 0), Math.max(12, rgb[1] * 0.42 | 0), Math.max(8, rgb[2] * 0.38 | 0)];
    const right = flash ? WHT : [Math.max(30, rgb[0] * 0.78 | 0), Math.max(18, rgb[1] * 0.62 | 0), Math.max(12, rgb[2] * 0.55 | 0)];
    c.beginPath();
    c.moveTo(sx(x), sy(y - hy));
    c.lineTo(sx(x + hx), sy(y - hy * 0.18));
    c.lineTo(sx(x), sy(y + hy * 0.28));
    c.lineTo(sx(x - hx), sy(y - hy * 0.18));
    c.closePath();
    c.fillStyle = rgba(top, 0.96);
    c.fill();
    c.beginPath();
    c.moveTo(sx(x - hx), sy(y - hy * 0.18));
    c.lineTo(sx(x), sy(y + hy * 0.28));
    c.lineTo(sx(x), sy(y + hy * 1.18));
    c.lineTo(sx(x - hx), sy(y + hy * 0.72));
    c.closePath();
    c.fillStyle = rgba(left, 0.96);
    c.fill();
    c.beginPath();
    c.moveTo(sx(x + hx), sy(y - hy * 0.18));
    c.lineTo(sx(x), sy(y + hy * 0.28));
    c.lineTo(sx(x), sy(y + hy * 1.18));
    c.lineTo(sx(x + hx), sy(y + hy * 0.72));
    c.closePath();
    c.fillStyle = rgba(right, 0.96);
    c.fill();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0c0704';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(70), 8 * scale, sx(VW * 0.5), sy(VH * 0.42), 400 * scale);
    g.addColorStop(0, 'rgba(255,107,61,0.16)');
    g.addColorStop(0.45, 'rgba(154,42,18,0.08)');
    g.addColorStop(1, 'rgba(12,7,4,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const size = 22;
    const h = size * 1.05;
    const yOff = (G.scroll * 0.46) % h;
    for (let row = -2; row < 38; row++) {
      for (let col = -1; col < 14; col++) {
        const x = 40 + col * size * 1.7 + ((row & 1) ? size * 0.85 : 0);
        const y = row * h - yOff;
        if (x < 28 || x > VW - 28) continue;
        c.strokeStyle = 'rgba(255,107,61,0.07)';
        c.lineWidth = Math.max(0.6, 0.7 * scale);
        pathHex(c, x, y, size * 0.42, 0);
        c.stroke();
      }
    }

    c.fillStyle = 'rgba(28,10,6,0.62)';
    c.fillRect(sx(0), sy(0), 34 * scale, VH * scale);
    c.fillRect(sx(VW - 34), sy(0), 34 * scale, VH * scale);
    const wallOff = (G.scroll * 0.72) % 28;
    for (let i = -1; i < 30; i++) {
      const y = i * 28 - wallOff;
      drawIso(c, 16, y, 9, RUST, false);
      drawIso(c, VW - 16, y + 14, 9, EMB, false);
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < dust.length; i++) {
      const p = dust[i];
      c.fillStyle = rgba(i % 3 === 0 ? GOLD : EMB, p.a * 0.55);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (CUBE_RGB[e.col] || EMB);
    if (e.kind === 'turret') {
      drawIso(c, e.x, e.y, e.r * 0.85, rgb, flash);
      c.fillStyle = rgba(DEEP, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 3.6 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 1.8 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(EMB, 0.16);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 52 * scale, 38 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.strokeStyle = rgba(CYN, 0.55);
      c.lineWidth = Math.max(1, 1.2 * scale);
      pathHex(c, e.x, e.y, e.r + 14, e.spin);
      c.stroke();
      c.strokeStyle = rgba(EMB, 0.7);
      pathHex(c, e.x, e.y, e.r + 8, -e.spin * 0.7);
      c.stroke();
      drawIso(c, e.x, e.y, e.r * 0.72, flash ? WHT : EMB, flash);
      c.fillStyle = rgba(flash ? WHT : CYN, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 7 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 3.2 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 18), 68 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : EMB, 0.95);
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 18), 68 * ratio * scale, 5 * scale);
      return;
    }
    if (e.kind === 'prism') {
      c.fillStyle = rgba(flash ? WHT : CYN, 0.92);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - e.r));
      c.lineTo(sx(e.x + e.r * 0.72), sy(e.y));
      c.lineTo(sx(e.x), sy(e.y + e.r));
      c.lineTo(sx(e.x - e.r * 0.72), sy(e.y));
      c.closePath();
      c.fill();
      c.strokeStyle = rgba(WHT, 0.7);
      c.lineWidth = Math.max(0.8, scale);
      c.stroke();
      c.fillStyle = rgba(DEEP, 0.8);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 3 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'elite') {
      drawIso(c, e.x, e.y, e.r * 0.78, rgb, flash);
      c.strokeStyle = rgba(GOLD, 0.85);
      c.lineWidth = Math.max(1, 1.2 * scale);
      pathHex(c, e.x, e.y, e.r + 2, e.t);
      c.stroke();
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 4), 3 * scale, 0, TAU);
      c.fill();
      return;
    }
    drawIso(c, e.x, e.y, e.r * 0.7, rgb, flash);
    if (e.kind === 'dive') {
      c.fillStyle = rgba(GOLD, 0.7);
      c.beginPath();
      c.moveTo(sx(e.x - 4), sy(e.y + 6));
      c.lineTo(sx(e.x), sy(e.y + 14));
      c.lineTo(sx(e.x + 4), sy(e.y + 6));
      c.fill();
    }
  }

  function drawField() {
    if (!G.absorbing || G.deadT > 0) return;
    const c = ctx;
    const x = G.ship.x;
    const y = G.ship.y;
    const r = G.fieldR;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(CYN, 0.08 + (G.stock / STOCK_MAX) * 0.08);
    pathHex(c, x, y, r, G.t * 0.8);
    c.fill();
    c.strokeStyle = rgba(G.stock >= STOCK_MAX ? GOLD : CYN, 0.72);
    c.lineWidth = Math.max(1.2, 1.6 * scale);
    pathHex(c, x, y, r, G.t * 0.8);
    c.stroke();
    c.strokeStyle = rgba(EMB, 0.45);
    c.lineWidth = Math.max(0.8, scale);
    pathHex(c, x, y, r * 0.72, -G.t * 1.2);
    c.stroke();
    if (!REDUCE) {
      for (let i = 0; i < 6; i++) {
        const a = G.t * 2.4 + i * (TAU / 6);
        c.fillStyle = rgba(GOLD, 0.5);
        c.beginPath();
        c.arc(sx(x + Math.cos(a) * r * 0.82), sy(y + Math.sin(a) * r * 0.82), 1.6 * scale, 0, TAU);
        c.fill();
      }
    }
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      drawIso(c, s.x, s.y, 4.4, GOLD, false);
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 1.4 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(EMB, 0.35);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y));
        c.lineTo(sx(s.x - s.vx * 0.016), sy(s.y - s.vy * 0.016));
        c.stroke();
      }
    }
    for (let i = 0; i < G.mosqs.length; i++) {
      const m = G.mosqs[i];
      drawIso(c, m.x, m.y, 5.2, m.rgb, false);
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(m.x), sy(m.y), 1.6 * scale, 0, TAU);
      c.fill();
      if (!REDUCE && m.wait <= 0) {
        c.strokeStyle = rgba(m.rgb, 0.4);
        c.lineWidth = 1.4 * scale;
        c.beginPath();
        c.moveTo(sx(m.x), sy(m.y));
        c.lineTo(sx(m.x - m.vx * 0.02), sy(m.y - m.vy * 0.02));
        c.stroke();
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const rgb = CUBE_RGB[b.col] || MAG;
      c.fillStyle = rgba(rgb, b.pull ? 0.55 : 0.92);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.42 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(rgb, 0.28);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 3.2) * scale, 0, TAU);
        c.stroke();
      }
    }
    for (let i = 0; i < G.cubes.length; i++) {
      const s = G.cubes[i];
      drawIso(c, s.x, s.y, 5.4, s.rgb, false);
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
    c.fillStyle = rgba(G.absorbing ? CYN : EMB, 0.2 + (G.muzzle > 0 ? 0.2 : 0));
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

    drawIso(c, x, y + 2, 10.5, EMB, false);
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(sx(x), sy(y - 18));
    c.lineTo(sx(x + 5), sy(y - 6));
    c.lineTo(sx(x - 5), sy(y - 6));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y - 1), 2.4 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(AMB, 0.9);
    c.fillRect(sx(x - 11), sy(y + 4), 5 * scale, 3 * scale);
    c.fillRect(sx(x + 6), sy(y + 4), 5 * scale, 3 * scale);

    const shown = Math.min(8, G.stock);
    for (let i = 0; i < shown; i++) {
      const a = G.t * 2.2 + i * (TAU / shown);
      const rr = 16 + (i % 2) * 4;
      drawIso(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7, 3.2, CUBE_RGB[i % 4], false);
    }

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
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
      pathHex(c, r.x, r.y, 8 + r.t * 70, r.t);
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
    ctx.fillStyle = '#140806';
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
    ctx.fillStyle = '#140806';
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
    drawField();
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
      startGame('core');
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
      startGame('core');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('dense');
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

  function bindAbs() {
    if (!btnAbs) return;
    function down(e) {
      audio.ensure();
      e.preventDefault();
      keys.abs = true;
      btnAbs.classList.add('held');
    }
    function up() {
      keys.abs = false;
      btnAbs.classList.remove('held');
    }
    btnAbs.addEventListener('pointerdown', down);
    btnAbs.addEventListener('pointerup', up);
    btnAbs.addEventListener('pointercancel', up);
    btnAbs.addEventListener('pointerleave', function () {
      if (keys.abs) up();
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

  seedDust();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindAbs();

  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'core');
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
      keys.abs = false;
    }
  });

  requestAnimationFrame(frame);
})();
