'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const BOMB_CAP = 6;
  const POWER_MAX = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.6;
  const SHOT_V = 740;
  const BEST_KEY = 'playbox-batsugun-best';
  const MUTE_KEY = 'playbox-batsugun-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [122, 255, 200];
  const GOLD = [255, 227, 107];
  const LIME = [200, 255, 58];
  const VER = [247, 90, 28];
  const WHT = [255, 244, 232];
  const PNK = [255, 154, 180];
  const DEEP = [28, 12, 8];

  const SCORE = {
    grunt: 50,
    dive: 80,
    turret: 150,
    elite: 240,
    carrier: 220,
    pod: 280,
    boss: 8000,
    chip: 10,
    stage: 1500,
    pmax: 500
  };

  const STAGES = [
    {
      name: '钢廊',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'v', n: 7 },
        { t: 8.0, kind: 'turrets' },
        { t: 9.2, kind: 'carrier' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'elite' },
        { t: 15.2, kind: 'v', n: 7 },
        { t: 17.6, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '机阵',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.5, kind: 'dive', n: 5 },
        { t: 4.6, kind: 'stream', dir: -1 },
        { t: 6.8, kind: 'elite' },
        { t: 8.4, kind: 'turrets' },
        { t: 10.2, kind: 'carrier' },
        { t: 12.2, kind: 'v', n: 9 },
        { t: 14.4, kind: 'dive', n: 6 },
        { t: 16.6, kind: 'stream', dir: 1 },
        { t: 18.4, kind: 'elite' }
      ]
    },
    {
      name: '城核',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.3, kind: 'dive', n: 5 },
        { t: 4.2, kind: 'elite' },
        { t: 6.2, kind: 'turrets' },
        { t: 8.0, kind: 'carrier' },
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
  const pwrLabel = document.getElementById('pwr-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const pwrBar = document.getElementById('pwr-bar');
  const pwrWrap = document.getElementById('pwr-wrap');

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
  let pwrTok = 0;
  let dropCycle = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
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
    power: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    fanT: 0,
    enemies: [],
    shots: [],
    bullets: [],
    pows: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
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
  function isSea() {
    return G.kind === 'sea';
  }
  function dens() {
    return isSea() ? 1.28 : 1;
  }
  function shipSpeed() {
    return isSea() ? 318 : 276;
  }
  function fireRate() {
    const base = isSea() ? 0.078 : 0.092;
    return base * (1 - G.power * 0.06);
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
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
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
    shoot(p) {
      this.ensure();
      const lift = 1 + (p || 0) * 0.12;
      this.beep(720 * lift, 0.042, 'square', 0.026 + (p || 0) * 0.004, 1480 * lift);
      if ((p || 0) >= 2) this.beep(240, 0.05, 'sawtooth', 0.016, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.032, 0.03, 1400);
      this.beep(640 * lift, 0.06, 'square', 0.038, 980 * lift);
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
    power() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 990);
      this.beep(990, 0.12, 'triangle', 0.036, 1480);
      this.beep(1320, 0.16, 'sine', 0.03, 1760);
    },
    max() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
      this.beep(1175, 0.2, 'sine', 0.05, 1568);
    },
    bomb() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(160, 0.22, 'sawtooth', 0.055, 48);
      this.beep(420, 0.16, 'square', 0.04, 880);
      this.beep(880, 0.22, 'sine', 0.04, 1760);
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

  function pwrName() {
    return G.power >= POWER_MAX ? 'MAX' : '枪 ' + G.power;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '战枪';
      else if (hasBoss()) stageLabel.textContent = '机甲';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '弹海' : '突贯';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.power >= POWER_MAX);
    }
    if (pwrLabel) {
      pwrLabel.textContent = pwrName();
      pwrLabel.classList.toggle('max', G.power >= POWER_MAX);
    }
    if (pwrBar) pwrBar.style.transform = 'scaleX(' + (G.power / POWER_MAX) + ')';
    if (pwrWrap) pwrWrap.classList.toggle('hot', G.power >= POWER_MAX);
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    const bombOff = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
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
    else if (G.mode === 'lose') setHint('R 重开 · 空格连射，Shift 战枪爆', 'warn');
    else if (G.mode === 'win') setHint('城核已碎 · R 再来', 'hot');
    else if (G.power >= POWER_MAX) setHint('战枪 MAX · 扇刃铺满前路', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 吃枪续链', 'warn');
    else setHint('空格连射 · Shift 战枪爆 · 吃 枪 升火力', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'BATS';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.8 ? 'bomb' : mag >= 3.2 ? 'fan' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('fan');
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
    const bossish = spec.kind === 'boss' || spec.kind === 'pod';
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
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: !!spec.ground,
      drop: spec.drop || null
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
    capArr(G.bullets, 240);
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

  function spawnGrunt(x, y, vx, vy) {
    spawnEnemy({
      kind: 'grunt',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.grunt,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnGrunt(c + k * 36, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isSea() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'grunt',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.grunt,
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
    const n = isSea() ? 6 : 5;
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
        ground: true
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
        amp: 70,
        phase: 0.8,
        score: SCORE.elite,
        fireCd: 0.6
      });
    }
  }

  function nextDrop() {
    const cycle = ['pwr', 'pwr', 'bomb'];
    const k = cycle[dropCycle % cycle.length];
    dropCycle += 1;
    return k;
  }

  function spawnCarrier() {
    spawnEnemy({
      kind: 'carrier',
      x: Math.random() < 0.5 ? 140 : 340,
      vy: 54 * dens(),
      hp: 8,
      r: 16,
      amp: 64,
      score: SCORE.carrier,
      fireCd: 0.7,
      drop: nextDrop()
    });
  }

  function spawnBoss() {
    const sea = isSea();
    const boss = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: sea ? 122 : 100,
      r: 38,
      score: SCORE.boss,
      enter: 1.35,
      fireCd: 0.9
    });
    boss.maxHp = boss.hp;
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 + 72,
      y: 30,
      hp: sea ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: 0,
      rad: 82,
      fireCd: 0.8
    });
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 - 72,
      y: 30,
      hp: sea ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 82,
      fireCd: 1.05
    });
    toast('机甲', false, true);
    audio.wave();
    screenFlash(VER, 0.36);
    kick(4.6, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isSea() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isSea() ? 1 : 0));
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'elite') spawnElite();
    else if (w.kind === 'carrier') spawnCarrier();
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

  function satPos(side) {
    const p = G.power;
    const oxp = (12 + p * 8) * side;
    const oy = 8 - p * 2;
    const wob = Math.sin(G.t * 6 + side) * 2.2;
    return { x: G.ship.x + oxp + wob, y: G.ship.y + oy };
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function pushShot(x, y, a, dmg, r, w, p) {
    G.shots.push({
      x: x,
      y: y,
      vx: Math.cos(a) * SHOT_V,
      vy: Math.sin(a) * SHOT_V,
      r: r,
      w: w,
      dmg: dmg,
      p: p
    });
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.05 + G.power * 0.012;
    const p = G.power;
    const streams = p === 0 ? 2 : p === 1 ? 3 : p === 2 ? 5 : 7;
    const spread = p === 0 ? 0.055 : p === 1 ? 0.15 : p === 2 ? 0.2 : 0.3;
    const dmg = 1 + p * 0.28;
    const r = 3.2 + p * 1.15;
    const w = 3.2 + p * 2.4;
    for (let i = 0; i < streams; i++) {
      const t = streams === 1 ? 0 : (i - (streams - 1) * 0.5);
      const a = -Math.PI * 0.5 + t * spread;
      pushShot(G.ship.x + t * (3.5 + p * 1.4), G.ship.y - 16, a, dmg, r, w, p);
    }
    if (p >= 1) {
      const extra = p >= 3 ? 2 : 1;
      for (let s = -1; s <= 1; s += 2) {
        const sat = satPos(s);
        for (let k = 0; k < extra; k++) {
          const a = -Math.PI * 0.5 + s * (0.08 + p * 0.04) + (k ? s * 0.14 : 0);
          pushShot(sat.x, sat.y - 6, a, dmg * 0.85, r * 0.85, w * 0.8, p);
        }
      }
    }
    capArr(G.shots, 72);
    audio.shoot(p);
  }

  function inFan(x, y, r) {
    const dx = x - G.ship.x;
    const dy = G.ship.y - 8 - y;
    if (dy < -12) return false;
    const half = 0.62;
    const ang = Math.atan2(dx, Math.max(8, dy));
    return Math.abs(ang) < half + (r || 0) / Math.max(40, dy);
  }

  function applyFan(dt) {
    const dps = 28;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (inFan(e.x, e.y, e.r)) {
        damageEnemy(e, dps * dt, 'fan');
        if (!REDUCE) spark(e.x + rand(-8, 8), e.y, LIME);
      }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      if (inFan(b.x, b.y, b.r)) {
        burst(b.x, b.y, LIME, 4, 70);
        G.bullets.splice(i, 1);
      }
    }
  }

  function tryBomb() {
    if (G.mode !== 'play' || overlayOpen() || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('爆弹用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.52;
    G.bombFlash = 0.55;
    G.fanT = 0.62;
    G.invuln = Math.max(G.invuln, 0.52);
    audio.bomb();
    hitStop(0.078);
    kick(6.4, 'bomb');
    screenFlash(LIME, 0.72);
    ring(G.ship.x, G.ship.y - 12, LIME);
    ring(G.ship.x, G.ship.y - 12, GOLD);
    burst(G.ship.x, G.ship.y - 16, LIME, 32, 260);
    burst(G.ship.x, G.ship.y - 16, WHT, 18, 200);
    floatText(G.ship.x, G.ship.y - 36, '战枪', LIME, true);
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      burst(G.bullets[i].x, G.bullets[i].y, LIME, 3, 60);
      G.bullets.splice(i, 1);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      damageEnemy(e, e.kind === 'boss' ? 18 : 14, 'bomb');
    }
    syncHud();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x,
      y: y,
      vx: rand(-28, 28),
      vy: 42,
      kind: kind === 'bomb' ? 'bomb' : 'pwr',
      t: 0
    });
    capArr(G.pows, 12);
  }

  function collectPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        floatText(p.x, p.y, '爆', GOLD, true);
      } else {
        const pts = Math.round(400 * G.mult);
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, GOLD, false);
      }
      audio.pickup();
    } else {
      if (G.power < POWER_MAX) {
        G.power += 1;
        audio.power();
        floatText(p.x, p.y, pwrName(), LIME, true);
        if (pwrLabel) {
          pwrLabel.classList.remove('hot');
          void pwrLabel.offsetWidth;
          pwrLabel.classList.add('hot');
          pwrTok += 1;
        }
        if (G.power >= POWER_MAX) {
          audio.max();
          toast('战枪 MAX', false, true);
          floatText(G.ship.x, G.ship.y - 40, 'MAX', GOLD, true);
          hitStop(0.055);
          kick(3.6, 'fan');
          screenFlash(LIME, 0.42);
        }
      } else {
        const pts = Math.round(SCORE.pmax * G.mult);
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, LIME, true);
        audio.pickup();
      }
    }
    burst(p.x, p.y, p.kind === 'bomb' ? GOLD : LIME, 10, 110);
    spark(p.x, p.y, p.kind === 'bomb' ? GOLD : LIME);
    if (G.combo >= 1) bumpCombo();
    else {
      G.combo = 1;
      G.comboT = COMBO_WIN;
      G.mult = 1;
    }
    syncHud();
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, LIME);
      hitStop(0.034);
      audio.hit(G.combo);
      kick(1.7);
    }
    if (e.kind === 'boss' && src === 'shot') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'elite' || e.kind === 'carrier' ? VER : LIME;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    if (e.drop) spawnPow(e.x, e.y, e.drop);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(LIME, 0.72);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, GOLD);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      G.bullets.length = 0;
      G.winT = 1.35;
      toast('机甲碎裂', false, true);
    } else if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'carrier') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, VER, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    if (G.power > 0) {
      spawnPow(G.ship.x, G.ship.y - 10, 'pwr');
      G.power = Math.max(0, G.power - 1);
    }
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    G.fanT = 0;
    G.bombT = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '火力越打越宽。满级放出战枪扇刃。分数 ' + G.score + '。');
    setHint('R 重开 · 空格连射，Shift 战枪爆', 'warn');
  }

  function goWin() {
    addScore(isSea() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isSea() ? '弹海通关' : '城核尽碎',
      '三关打穿，机甲已碎。分数 ' + G.score + (isSea() ? ' · 弹海' : ' · 突贯') + '。'
    );
    setHint('城核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '城核'), false, true);
    audio.wave();
    screenFlash(VER, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    dropCycle = 0;
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
    G.power = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.fanT = 0;
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
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '弹海' : '突贯', isSea(), !isSea());
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
    G.power = 0;
    G.bombs = 3;
    G.deadT = 0;
    G.fanT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '战枪', '火力越打越宽。满级放出战枪扇刃。短关之后是机甲。');
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
    if (G.bombFlash > 0) G.bombFlash -= dt;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      s.y += scr * 0.4 * s.z * dt;
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
          burst(s.x, s.y, LIME, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
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

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 18 * dt;
      p.vx *= Math.exp(-dt * 0.6);
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.ship.x - p.x;
        const dy = G.ship.y - p.y;
        const d = hypot(dx, dy);
        if (d < 22) {
          collectPow(p);
          G.pows.splice(i, 1);
          continue;
        }
        if (d < 96) {
          const k = 220 / Math.max(24, d);
          p.vx += (dx / d) * k * dt * 60;
          p.vy += (dy / d) * k * dt * 60;
        }
      }
      if (p.y > VH + 24 || p.t > 9) G.pows.splice(i, 1);
    }
  }

  function fireInterval(e) {
    const sea = isSea() ? 0.74 : 1;
    if (e.kind === 'grunt') return 1.45 * sea;
    if (e.kind === 'turret') return 0.92 * sea;
    if (e.kind === 'elite') return 0.82 * sea;
    if (e.kind === 'carrier') return 1.05 * sea;
    if (e.kind === 'pod') return 1.1 * sea;
    if (e.kind === 'boss') return 0.55 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'grunt') {
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
    } else if (e.kind === 'turret') {
      e.y += e.vy * dt;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isSea() ? 2 : 1, 0.16, bulletSpd() * 0.92);
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
    } else if (e.kind === 'carrier') {
      e.x = e.baseX + Math.sin(e.t * 1.15 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd());
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
          spawnGrunt(e.x - 40, e.y + 20, -30, 110);
          spawnGrunt(e.x + 40, e.y + 20, 30, 110);
        }
        e.fireCd = 0.42 * (isSea() ? 0.78 : 1);
      }
    }
  }

  function updateEnemies(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
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
      if (canHurt && !e.ground) {
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
    if (G.bombT > 0) G.bombT -= dt;
    if (G.fanT > 0) {
      G.fanT -= dt;
      applyFan(dt);
    }
    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updatePows(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePows(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathTrap(c, x, y, hw, h, peak) {
    c.beginPath();
    c.moveTo(sx(x), sy(y - h * (peak || 0.55)));
    c.lineTo(sx(x + hw), sy(y + h * 0.45));
    c.lineTo(sx(x - hw), sy(y + h * 0.45));
    c.closePath();
  }

  function pathBox(c, x, y, w, h) {
    c.beginPath();
    c.moveTo(sx(x - w), sy(y - h));
    c.lineTo(sx(x + w), sy(y - h));
    c.lineTo(sx(x + w * 0.78), sy(y + h));
    c.lineTo(sx(x - w * 0.78), sy(y + h));
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0a0604';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(90), 10 * scale, sx(VW * 0.5), sy(VH * 0.4), 380 * scale);
    g.addColorStop(0, 'rgba(247,90,28,0.1)');
    g.addColorStop(1, 'rgba(10,6,4,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const yOff = G.scroll * 0.55;
    for (let col = 0; col < 8; col++) {
      const x = 48 + col * 52;
      const seed = col * 17.3;
      for (let row = -2; row < 14; row++) {
        const hgt = 48 + hash(seed + row) * 70;
        const y = ((row * 92 - yOff) % (92 * 12) + 92 * 12) % (92 * 12) - 40;
        c.fillStyle = 'rgba(36,14,10,' + (0.42 + hash(seed + row + 3) * 0.28) + ')';
        c.fillRect(sx(x), sy(y), 38 * scale, hgt * scale);
        c.strokeStyle = 'rgba(247,90,28,0.14)';
        c.lineWidth = Math.max(0.6, 0.7 * scale);
        c.strokeRect(sx(x), sy(y), 38 * scale, hgt * scale);
        const windows = 3 + ((hash(seed + row + 8) * 3) | 0);
        for (let w = 0; w < windows; w++) {
          c.fillStyle = hash(seed + row + w) > 0.45 ? 'rgba(255,227,107,0.28)' : 'rgba(200,255,58,0.12)';
          c.fillRect(sx(x + 6 + (w % 3) * 10), sy(y + 8 + ((w / 3) | 0) * 12), 5 * scale, 4 * scale);
        }
      }
    }

    c.fillStyle = 'rgba(22,10,8,0.72)';
    c.fillRect(sx(0), sy(0), 36 * scale, VH * scale);
    c.fillRect(sx(VW - 36), sy(0), 36 * scale, VH * scale);
    const wallOff = (G.scroll * 0.7) % 36;
    for (let i = -1; i < 24; i++) {
      const y = i * 36 - wallOff;
      c.fillStyle = 'rgba(247,90,28,0.16)';
      c.fillRect(sx(6), sy(y), 24 * scale, 22 * scale);
      c.fillRect(sx(VW - 30), sy(y + 12), 24 * scale, 22 * scale);
      c.fillStyle = 'rgba(255,227,107,0.22)';
      c.beginPath();
      c.arc(sx(12), sy(y + 6), 1.6 * scale, 0, TAU);
      c.arc(sx(24), sy(y + 16), 1.6 * scale, 0, TAU);
      c.arc(sx(VW - 12), sy(y + 18), 1.6 * scale, 0, TAU);
      c.fill();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      c.fillStyle = rgba(i % 2 ? VER : LIME, p.a * 0.5);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (e.kind === 'boss' ? VER : e.kind === 'elite' || e.kind === 'carrier' ? VER : GOLD);
    if (e.kind === 'turret') {
      c.fillStyle = rgba(DEEP, 0.92);
      pathBox(c, e.x, e.y, e.r + 2, e.r * 0.7);
      c.fill();
      c.strokeStyle = rgba(VER, 0.85);
      c.lineWidth = Math.max(1, 1.3 * scale);
      pathBox(c, e.x, e.y, e.r + 2, e.r * 0.7);
      c.stroke();
      c.fillStyle = rgba(rgb, 0.95);
      c.fillRect(sx(e.x - 2), sy(e.y - 10), 4 * scale, 12 * scale);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 4.2 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(VER, 0.16);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 52 * scale, 38 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.95);
      pathBox(c, e.x, e.y, e.r + 6, e.r * 0.72);
      c.fill();
      c.strokeStyle = rgba(VER, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      pathBox(c, e.x, e.y, e.r + 6, e.r * 0.72);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : GOLD, 0.9);
      pathTrap(c, e.x, e.y - 6, 14, 22, 0.6);
      c.fill();
      c.fillStyle = rgba(LIME, 0.9);
      c.fillRect(sx(e.x - 28), sy(e.y + 4), 14 * scale, 8 * scale);
      c.fillRect(sx(e.x + 14), sy(e.y + 4), 14 * scale, 8 * scale);
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 16), 5 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(VER, 0.85);
      c.fillRect(sx(e.x - 18), sy(e.y + 18), 8 * scale, 16 * scale);
      c.fillRect(sx(e.x + 10), sy(e.y + 18), 8 * scale, 16 * scale);
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : LIME, 0.95);
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * ratio * scale, 5 * scale);
      return;
    }
    if (e.kind === 'dive') {
      c.fillStyle = rgba(flash ? WHT : VER, 0.95);
      pathTrap(c, e.x, e.y, 8, 16, 0.7);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.8);
      c.lineWidth = Math.max(0.8, scale);
      pathTrap(c, e.x, e.y, 8, 16, 0.7);
      c.stroke();
      return;
    }
    c.fillStyle = rgba(flash ? WHT : rgb, 0.95);
    pathBox(c, e.x, e.y, e.r - 1, e.r * 0.7);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.8);
    c.lineWidth = Math.max(0.8, scale);
    pathBox(c, e.x, e.y, e.r - 1, e.r * 0.7);
    c.stroke();
    c.fillStyle = rgba(DEEP, 0.85);
    c.fillRect(sx(e.x - 1.4), sy(e.y - 4), 2.8 * scale, e.r * 0.7 * scale);
    if (e.kind === 'elite' || e.kind === 'carrier') {
      c.fillStyle = rgba(e.kind === 'carrier' ? LIME : MAG, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + e.r - 4), 3.2 * scale, 0, TAU);
      c.fill();
      c.fillRect(sx(e.x - 14), sy(e.y - 2), 6 * scale, 4 * scale);
      c.fillRect(sx(e.x + 8), sy(e.y - 2), 6 * scale, 4 * scale);
    }
  }

  function drawFan() {
    const firing = wantFire() && G.power >= 2 && G.deadT <= 0;
    const bombing = G.fanT > 0 && G.deadT <= 0;
    if (!firing && !bombing) return;
    const c = ctx;
    const x = G.ship.x;
    const y = G.ship.y - 10;
    const p = bombing ? 3 : G.power;
    const spread = bombing ? 0.72 : (0.22 + p * 0.1);
    const len = bombing ? 520 : 280 + p * 40;
    const a0 = -Math.PI * 0.5;
    const fade = bombing ? clamp(G.fanT / 0.62, 0, 1) : 0.55 + G.muzzle * 4;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.beginPath();
    c.moveTo(sx(x), sy(y));
    c.lineTo(sx(x + Math.cos(a0 - spread) * len), sy(y + Math.sin(a0 - spread) * len));
    c.lineTo(sx(x + Math.cos(a0 + spread) * len), sy(y + Math.sin(a0 + spread) * len));
    c.closePath();
    c.fillStyle = rgba(LIME, 0.07 * fade);
    c.fill();
    c.beginPath();
    c.moveTo(sx(x), sy(y));
    c.lineTo(sx(x + Math.cos(a0 - spread * 0.45) * len * 0.85), sy(y + Math.sin(a0 - spread * 0.45) * len * 0.85));
    c.lineTo(sx(x + Math.cos(a0 + spread * 0.45) * len * 0.85), sy(y + Math.sin(a0 + spread * 0.45) * len * 0.85));
    c.closePath();
    c.fillStyle = rgba(GOLD, 0.1 * fade);
    c.fill();
    const rays = bombing ? 9 : 3 + p;
    for (let i = 0; i < rays; i++) {
      const t = rays === 1 ? 0 : (i - (rays - 1) * 0.5);
      const a = a0 + t * (spread / Math.max(1, (rays - 1) * 0.5));
      c.strokeStyle = rgba(i % 2 ? LIME : WHT, 0.18 * fade);
      c.lineWidth = (bombing ? 4 : 1.6 + p * 0.5) * scale;
      c.beginPath();
      c.moveTo(sx(x), sy(y));
      c.lineTo(sx(x + Math.cos(a) * len), sy(y + Math.sin(a) * len));
      c.stroke();
    }
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const ang = Math.atan2(s.vy, s.vx);
      const len = 12 + s.p * 5;
      const hw = s.w * 0.5;
      c.save();
      c.translate(sx(s.x), sy(s.y));
      c.rotate(ang);
      c.fillStyle = rgba(LIME, 0.55);
      c.beginPath();
      c.moveTo(len * scale, 0);
      c.lineTo(-len * 0.35 * scale, hw * scale);
      c.lineTo(-len * 0.35 * scale, -hw * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.moveTo(len * 0.7 * scale, 0);
      c.lineTo(-len * 0.1 * scale, hw * 0.35 * scale);
      c.lineTo(-len * 0.1 * scale, -hw * 0.35 * scale);
      c.closePath();
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(GOLD, 0.35);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-len * 1.1 * scale, 0);
        c.stroke();
      }
      c.restore();
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
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = p.kind === 'bomb' ? GOLD : LIME;
      const pulse = 1 + Math.sin(G.t * 10 + p.t) * 0.12;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(rgb, 0.95);
      c.translate(sx(p.x), sy(p.y));
      c.rotate(p.t * 2);
      c.beginPath();
      c.moveTo(0, -8 * scale * pulse);
      c.lineTo(7 * scale * pulse, 0);
      c.lineTo(0, 8 * scale * pulse);
      c.lineTo(-7 * scale * pulse, 0);
      c.closePath();
      c.fill();
      c.restore();
      c.fillStyle = rgba(WHT, 0.95);
      c.font = (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(p.kind === 'bomb' ? '爆' : '枪', sx(p.x), sy(p.y));
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    if (G.power >= 1) {
      for (let s = -1; s <= 1; s += 2) {
        const sat = satPos(s);
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = rgba(LIME, 0.22);
        c.beginPath();
        c.arc(sx(sat.x), sy(sat.y), 8 * scale, 0, TAU);
        c.fill();
        c.restore();
        c.fillStyle = rgba(VER, 0.95);
        pathBox(c, sat.x, sat.y, 6, 5);
        c.fill();
        c.fillStyle = rgba(LIME, 0.95);
        c.beginPath();
        c.arc(sx(sat.x), sy(sat.y - 1), 2 * scale, 0, TAU);
        c.fill();
      }
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(G.power >= POWER_MAX ? LIME : VER, 0.2 + (G.muzzle > 0 ? 0.22 : 0));
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

    c.fillStyle = rgba(VER, 0.96);
    pathTrap(c, x, y + 2, 13, 22, 0.62);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.95);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathTrap(c, x, y + 2, 13, 22, 0.62);
    c.stroke();

    c.fillStyle = rgba(WHT, 0.95);
    pathTrap(c, x, y - 2, 5, 12, 0.7);
    c.fill();

    c.fillStyle = rgba(LIME, 0.9);
    c.fillRect(sx(x - 12), sy(y + 4), 5 * scale, 3 * scale);
    c.fillRect(sx(x + 7), sy(y + 4), 5 * scale, 3 * scale);

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 16), (5 + G.power) * scale, 0, TAU);
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
    if (G.bombFlash > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(LIME, G.bombFlash * 0.9);
      c.lineWidth = 3 * scale;
      c.beginPath();
      c.arc(sx(G.ship.x), sy(G.ship.y), (30 + (1 - G.bombFlash) * 140) * scale, 0, TAU);
      c.stroke();
      c.restore();
    }
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
    drawFan();
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
      tryBomb();
    });
  }

  seedEmbers();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

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
  bindBombBtn(btnBomb);
  bindBombBtn(btnPad);

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
