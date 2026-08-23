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
  const HIT_R = 4.4;
  const GRAZE_R = 22;
  const ESP_MAX = 100;
  const BURST_MIN = 28;
  const BURST_COST = 40;
  const BURST_T = 0.58;
  const SHOT_V = 700;
  const BEST_KEY = 'playbox-esprade-best';
  const MUTE_KEY = 'playbox-esprade-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · Shift / Z 爆发 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [110, 240, 255];
  const GOLD = [255, 227, 107];
  const VIO = [196, 77, 255];
  const WHT = [248, 232, 255];
  const PNK = [255, 154, 212];
  const DEEP = [28, 12, 28];
  const HOT = [255, 122, 232];

  const SCORE = {
    orb: 50,
    dive: 80,
    prism: 120,
    crystal: 150,
    elite: 240,
    pod: 280,
    boss: 8000,
    graze: 12,
    chip: 10,
    stage: 1500,
    shred: 8
  };

  const STAGES = [
    {
      name: '夜廊',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'v', n: 7 },
        { t: 8.0, kind: 'crystals' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'prism' },
        { t: 15.2, kind: 'v', n: 7 },
        { t: 17.6, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '光阵',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.5, kind: 'dive', n: 5 },
        { t: 4.6, kind: 'stream', dir: -1 },
        { t: 6.8, kind: 'prism' },
        { t: 8.4, kind: 'prism' },
        { t: 10.2, kind: 'crystals' },
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
        { t: 6.2, kind: 'crystals' },
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
  const btnEsp = document.getElementById('btn-esp');
  const btnSea = document.getElementById('btn-sea');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBurst = document.getElementById('btn-burst');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const grazeLabel = document.getElementById('graze-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const espBar = document.getElementById('esp-bar');
  const espWrap = document.getElementById('esp-wrap');

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
  let grazeTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const motes = [];
  const gleams = [];

  const G = {
    mode: 'title',
    kind: 'esp',
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
    esp: 0,
    espHold: 0,
    grazeN: 0,
    burstT: 0,
    burstR: 0,
    enemies: [],
    shots: [],
    bullets: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
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
    grazeFlash: 0
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
    return isSea() ? 322 : 280;
  }
  function fireRate() {
    const base = isSea() ? 0.076 : 0.09;
    return base * (1 - shotLevel() * 0.06);
  }
  function bulletSpd() {
    return isSea() ? 180 : 140;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isSea() ? 126 : 90;
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function shotLevel() {
    if (G.esp >= 75) return 3;
    if (G.esp >= 50) return 2;
    if (G.esp >= 25) return 1;
    return 0;
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
    shoot(lv) {
      this.ensure();
      const lift = 1 + (lv || 0) * 0.08;
      this.beep(820 * lift, 0.042, 'square', 0.026, 1560 * lift);
    },
    graze(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.8, combo * 0.04);
      this.beep(980 * lift, 0.05, 'sine', 0.03, 1760 * lift);
      this.beep(1480 * lift, 0.07, 'triangle', 0.018, 2200 * lift);
    },
    burst() {
      this.ensure();
      this.noise(0.16, 0.05, 420);
      this.beep(220, 0.18, 'sawtooth', 0.048, 70);
      this.beep(880, 0.22, 'sine', 0.04, 1760);
      this.beep(1320, 0.16, 'triangle', 0.03, 440);
    },
    empty() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.028, 90);
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
      if (G.mode === 'title') stageLabel.textContent = '超光';
      else if (hasBoss()) stageLabel.textContent = '光核';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '光海' : '超能';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.esp >= 75);
    }
    if (grazeLabel) {
      grazeLabel.textContent = '擦 ' + G.grazeN;
    }
    if (espBar) espBar.style.transform = 'scaleX(' + clamp(G.esp / ESP_MAX, 0, 1) + ')';
    if (espWrap) {
      espWrap.classList.toggle('hot', G.esp >= 75);
      espWrap.classList.toggle('ready', G.esp >= BURST_MIN && G.esp < 75);
    }
    const burstOff = G.mode === 'play' && G.esp < BURST_MIN && G.burstT <= 0;
    if (btnBurst) btnBurst.disabled = burstOff;
    if (btnPad) btnPad.disabled = burstOff;
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 擦弹积超能，Shift 爆发', 'warn');
    else if (G.mode === 'win') setHint('核渊已碎 · R 再来', 'hot');
    else if (G.esp >= 75) setHint('超能 MAX · Shift 放爆发', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 擦弹续链', 'warn');
    else setHint('擦弹积超能 · 空格点射 · Shift 爆发', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'ESPR';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.8 ? 'burst' : mag >= 2.4 ? 'graze' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('graze');
    stageEl.classList.remove('boss');
    stageEl.classList.remove('burst');
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

  function burstFx(x, y, rgb, n, spd) {
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
    burstFx(x, y, rgb, Math.min(28, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function gleam(x, y, rgb) {
    gleams.push({
      x: x,
      y: y,
      vx: rand(-50, 50),
      vy: rand(-80, -20),
      life: rand(0.28, 0.5),
      r: rand(1.1, 2.2),
      rgb: rgb || CYN
    });
    capArr(gleams, 80);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 68; i++) {
      motes.push({
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
      kind: spec.kind || 'orb',
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
      score: spec.score || SCORE.orb,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      burstHit: 0
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
      life: 8,
      grazed: false
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

  function petalFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.4);
    }
  }

  function spawnOrb(x, y, vx, vy) {
    spawnEnemy({
      kind: 'orb',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.orb,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnOrb(c + k * 36, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isSea() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'orb',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.orb,
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
      fireCd: 0.45
    });
  }

  function spawnCrystals() {
    const n = isSea() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'crystal',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 44 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.crystal,
        fireCd: 0.55 + i * 0.1
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

  function spawnBoss() {
    const sea = isSea();
    const boss = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: sea ? 110 : 88,
      r: 36,
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
    toast('光核', false, true);
    audio.wave();
    screenFlash(VIO, 0.36);
    kick(4.6, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isSea() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isSea() ? 1 : 0));
    else if (w.kind === 'prism') {
      spawnPrism(140);
      spawnPrism(340);
      if (isSea()) spawnPrism(240);
    } else if (w.kind === 'crystals') spawnCrystals();
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

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    const lv = shotLevel();
    G.muzzle = 0.05 + lv * 0.01;
    const streams = lv === 0 ? 2 : lv === 1 ? 3 : lv === 2 ? 4 : 5;
    const spread = lv === 0 ? 0.07 : lv === 1 ? 0.14 : lv === 2 ? 0.2 : 0.26;
    const dmg = 1 + lv * 0.22;
    const r = 3.2 + lv * 0.7;
    for (let i = 0; i < streams; i++) {
      const t = streams === 1 ? 0 : (i - (streams - 1) * 0.5);
      const a = -Math.PI * 0.5 + t * spread;
      G.shots.push({
        x: G.ship.x + t * (4 + lv),
        y: G.ship.y - 16,
        vx: Math.cos(a) * SHOT_V,
        vy: Math.sin(a) * SHOT_V,
        r: r,
        dmg: dmg,
        lv: lv
      });
    }
    capArr(G.shots, 64);
    audio.shoot(lv);
  }

  function doGraze(b) {
    if (b.grazed) return;
    b.grazed = true;
    G.esp = clamp(G.esp + 7, 0, ESP_MAX);
    G.espHold = 0.5;
    G.grazeN += 1;
    G.grazeFlash = 0.12;
    const pts = Math.round(SCORE.graze * G.mult);
    addScore(pts);
    bumpCombo();
    gleam(b.x, b.y, CYN);
    gleam(b.x, b.y, WHT);
    spark(b.x, b.y, CYN);
    audio.graze(G.combo);
    if (G.grazeN % 8 === 0) {
      floatText(G.ship.x, G.ship.y - 36, G.grazeN + ' 擦', CYN, true);
      hitStop(0.028);
      kick(2.6, 'graze');
      if (grazeLabel) {
        grazeLabel.classList.remove('hot');
        void grazeLabel.offsetWidth;
        grazeLabel.classList.add('hot');
      }
      grazeTok += 1;
    } else if (!REDUCE) {
      G.shake = Math.max(G.shake, 0.7);
    }
    syncHud();
  }

  function tryBurst() {
    if (G.mode !== 'play' || overlayOpen() || G.deadT > 0) return;
    if (G.burstT > 0) return;
    if (G.esp < BURST_MIN) {
      audio.empty();
      toast('超能不足', true, false);
      return;
    }
    G.esp = Math.max(0, G.esp - BURST_COST);
    G.burstT = BURST_T;
    G.burstR = 24;
    G.invuln = Math.max(G.invuln, 0.48);
    G.espHold = 0.2;
    for (let i = 0; i < G.enemies.length; i++) G.enemies[i].burstHit = 0;
    audio.burst();
    hitStop(0.068);
    kick(6.2, 'burst');
    screenFlash(MAG, 0.55);
    ring(G.ship.x, G.ship.y, CYN);
    ring(G.ship.x, G.ship.y, VIO);
    explode(G.ship.x, G.ship.y, MAG, 28);
    floatText(G.ship.x, G.ship.y - 34, '超', CYN, true);
    syncHud();
  }

  function applyBurst(dt) {
    const u = 1 - G.burstT / BURST_T;
    G.burstR = lerp(24, 172, u);
    const r = G.burstR;
    const rr = r * r;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = e.x - G.ship.x;
      const dy = e.y - G.ship.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < (r + e.r) * (r + e.r)) {
        damageEnemy(e, 22 * dt, 'burst');
        if (!REDUCE && Math.random() < 0.35) spark(e.x + rand(-6, 6), e.y, CYN);
      }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      const dx = b.x - G.ship.x;
      const dy = b.y - G.ship.y;
      if (dx * dx + dy * dy < rr) {
        const pts = Math.round(SCORE.shred * G.mult);
        addScore(pts);
        gleam(b.x, b.y, MAG);
        burstFx(b.x, b.y, CYN, 4, 70);
        G.bullets.splice(i, 1);
      }
    }
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, VIO);
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
    const rgb = e.kind === 'boss' ? CYN : e.kind === 'elite' || e.kind === 'prism' ? MAG : VIO;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    G.esp = clamp(G.esp + (e.kind === 'boss' ? 18 : 4), 0, ESP_MAX);
    G.espHold = Math.max(G.espHold, 0.35);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(CYN, 0.72);
      burstFx(e.x, e.y, MAG, 36, 280);
      burstFx(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, CYN);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      for (let i = G.bullets.length - 1; i >= 0; i--) {
        gleam(G.bullets[i].x, G.bullets[i].y, CYN);
        G.bullets.splice(i, 1);
      }
      G.winT = 1.35;
      toast('光核碎裂', false, true);
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
    G.burstT = 0;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, VIO, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    G.esp = Math.max(0, G.esp * 0.45);
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    G.burstT = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    G.burstT = 0;
    audio.lose();
    showOverlay('lose', '灵体溃散', '擦弹积超能，空格点射，爆发清环。分数 ' + G.score + '。');
    setHint('R 重开 · 擦弹积超能，Shift 爆发', 'warn');
  }

  function goWin() {
    addScore(isSea() ? 10000 : 8000);
    G.mode = 'win';
    G.burstT = 0;
    audio.win();
    showOverlay(
      'win',
      isSea() ? '光海通关' : '核渊尽碎',
      '三关打穿，光核已碎。分数 ' + G.score + (isSea() ? ' · 光海' : ' · 超能') + '。'
    );
    setHint('核渊已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    gleams.length = 0;
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
    screenFlash(VIO, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'sea' ? 'sea' : 'esp';
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
    G.esp = 18;
    G.espHold = 0;
    G.grazeN = 0;
    G.burstT = 0;
    G.burstR = 0;
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
    G.grazeFlash = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '光海' : '超能', isSea(), !isSea());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'esp';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.esp = 0;
    G.grazeN = 0;
    G.burstT = 0;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '超光', '擦弹积超能，空格点射，爆发清环。短关之后是光核。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('esp');
    else startGame(G.kind || 'esp');
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
    for (let i = gleams.length - 1; i >= 0; i--) {
      const g = gleams[i];
      g.life -= dt;
      if (g.life <= 0) {
        gleams.splice(i, 1);
        continue;
      }
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy += 40 * dt;
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
    if (G.grazeFlash > 0) G.grazeFlash -= dt;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < motes.length; i++) {
      const s = motes[i];
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

  function updateEsp(dt) {
    if (G.espHold > 0) G.espHold -= dt;
    else if (G.esp > 0 && G.burstT <= 0) {
      G.esp = Math.max(0, G.esp - 6 * dt);
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
          burstFx(s.x, s.y, VIO, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    const canGraze = G.mode === 'play' && G.deadT <= 0;
    const hx = G.ship.x;
    const hy = G.ship.y - 2;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 22 || b.y < -32 || b.x < -22 || b.x > VW + 22) {
        G.bullets.splice(i, 1);
        continue;
      }
      const dx = b.x - hx;
      const dy = b.y - hy;
      const d2 = dx * dx + dy * dy;
      const hitRR = HIT_R + b.r * 0.5;
      if (canHurt && d2 < hitRR * hitRR) {
        G.bullets.splice(i, 1);
        diePlayer();
        continue;
      }
      const grazeRR = GRAZE_R + b.r;
      if (canGraze && !b.grazed && d2 < grazeRR * grazeRR) {
        doGraze(b);
      }
    }
  }

  function fireInterval(e) {
    const sea = isSea() ? 0.74 : 1;
    if (e.kind === 'orb') return 1.45 * sea;
    if (e.kind === 'prism') return 1.05 * sea;
    if (e.kind === 'crystal') return 0.92 * sea;
    if (e.kind === 'elite') return 0.82 * sea;
    if (e.kind === 'pod') return 1.1 * sea;
    if (e.kind === 'boss') return 0.55 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'orb') {
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
        aimedFire(e, 3, 0.24, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'crystal') {
      e.y += e.vy * dt;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      e.spin += dt * 1.4;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isSea() ? 2 : 1, 0.18, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 3, 0.2, bulletSpd());
        if ((e.pattern++ % 2) === 0) petalFire(e, 6, bulletSpd() * 0.7, e.t);
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
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.2 : 2.2);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      if (ratio > 0.66) {
        aimedFire(e, 3, 0.22, spd);
        if (Math.random() < 0.5) petalFire(e, 6, spd * 0.7, e.spin);
        e.fireCd = 1.12 * (isSea() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        petalFire(e, 8, spd * 0.78, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.5 * (isSea() ? 0.78 : 1);
      } else {
        petalFire(e, 10, spd * 0.76, e.spin);
        petalFire(e, 6, spd * 0.54, -e.spin * 0.8);
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnOrb(e.x - 40, e.y + 20, -30, 110);
          spawnOrb(e.x + 40, e.y + 20, 30, 110);
        }
        e.fireCd = 0.4 * (isSea() ? 0.78 : 1);
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
    if (G.burstT > 0) {
      G.burstT -= dt;
      applyBurst(dt);
      if (G.burstT < 0) G.burstT = 0;
    }
    updateEsp(dt);
    updateShots(dt);
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

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0a0610';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(90), 10 * scale, sx(VW * 0.5), sy(VH * 0.4), 380 * scale);
    g.addColorStop(0, 'rgba(196,77,255,0.1)');
    g.addColorStop(1, 'rgba(10,6,16,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const size = 22;
    const yOff = (G.scroll * 0.42) % (size * 2);
    c.strokeStyle = 'rgba(196,77,255,0.08)';
    c.lineWidth = Math.max(0.6, 0.7 * scale);
    for (let row = -2; row < 22; row++) {
      for (let col = -1; col < 14; col++) {
        const x = 24 + col * size * 1.6;
        const y = row * size * 1.6 + ((col & 1) ? size * 0.8 : 0) - yOff;
        if (x < -10 || x > VW + 10) continue;
        pathDia(c, x, y, size * 0.42, 0);
        c.stroke();
      }
    }

    c.fillStyle = 'rgba(22,8,28,0.58)';
    c.fillRect(sx(0), sy(0), 36 * scale, VH * scale);
    c.fillRect(sx(VW - 36), sy(0), 36 * scale, VH * scale);
    const wallOff = (G.scroll * 0.7) % 36;
    for (let i = -1; i < 24; i++) {
      const y = i * 36 - wallOff;
      c.fillStyle = 'rgba(196,77,255,0.1)';
      pathDia(c, 18, y, 13, 0);
      c.fill();
      pathDia(c, VW - 18, y + 18, 13, 0);
      c.fill();
      c.strokeStyle = 'rgba(110,240,255,0.22)';
      c.lineWidth = Math.max(0.8, scale);
      pathDia(c, 18, y, 13, 0);
      c.stroke();
      pathDia(c, VW - 18, y + 18, 13, 0);
      c.stroke();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < motes.length; i++) {
      const p = motes[i];
      c.fillStyle = rgba(i % 2 === 0 ? VIO : CYN, p.a * 0.5);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (e.kind === 'boss' ? MAG : e.kind === 'prism' || e.kind === 'elite' ? MAG : VIO);
    if (e.kind === 'crystal') {
      c.fillStyle = rgba(DEEP, 0.92);
      pathDia(c, e.x, e.y, e.r + 2, e.spin);
      c.fill();
      c.strokeStyle = rgba(CYN, 0.85);
      c.lineWidth = Math.max(1, 1.3 * scale);
      pathDia(c, e.x, e.y, e.r + 2, e.spin);
      c.stroke();
      c.fillStyle = rgba(rgb, 0.95);
      pathDia(c, e.x, e.y, 5, e.spin + 0.4);
      c.fill();
      return;
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(VIO, 0.18);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 50 * scale, 38 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.95);
      pathDia(c, e.x, e.y, e.r + 6, e.spin * 0.15);
      c.fill();
      c.strokeStyle = rgba(CYN, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      pathDia(c, e.x, e.y, e.r + 6, e.spin * 0.15);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : MAG, 0.92);
      pathDia(c, e.x, e.y - 2, 18, -e.spin * 0.2);
      c.fill();
      c.fillStyle = rgba(CYN, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 4), 7 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 4), 3 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : CYN, 0.95);
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * ratio * scale, 5 * scale);
      return;
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(CYN, 0.14);
    c.beginPath();
    c.ellipse(sx(e.x), sy(e.y), (e.r + 6) * scale, (e.r + 2) * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    c.fillStyle = rgba(flash ? WHT : rgb, 0.95);
    pathDia(c, e.x, e.y, e.r - (e.kind === 'elite' ? 0 : 1), e.t * 0.8);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.75);
    c.lineWidth = Math.max(0.8, scale);
    pathDia(c, e.x, e.y, e.r - (e.kind === 'elite' ? 0 : 1), e.t * 0.8);
    c.stroke();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y), 2.4 * scale, 0, TAU);
    c.fill();
    if (e.kind === 'elite' || e.kind === 'prism') {
      c.fillStyle = rgba(MAG, 0.8);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + e.r - 3), 3 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawBurst() {
    if (G.burstT <= 0) return;
    const c = ctx;
    const u = 1 - G.burstT / BURST_T;
    const r = G.burstR;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(CYN, 0.7 * (1 - u));
    c.lineWidth = 3.2 * scale;
    pathDia(c, G.ship.x, G.ship.y, r, u * 0.6);
    c.stroke();
    c.strokeStyle = rgba(MAG, 0.55 * (1 - u));
    c.lineWidth = 1.6 * scale;
    pathDia(c, G.ship.x, G.ship.y, r * 0.72, -u * 0.5);
    c.stroke();
    c.fillStyle = rgba(VIO, 0.08 * (1 - u));
    c.beginPath();
    c.arc(sx(G.ship.x), sy(G.ship.y), r * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(s.lv >= 2 ? CYN : VIO, 0.95);
      pathDia(c, s.x, s.y, 4 + (s.lv || 0) * 0.6, G.t * 8);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 1.5 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(HOT, 0.32);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y));
        c.lineTo(sx(s.x - s.vx * 0.018), sy(s.y - s.vy * 0.018));
        c.stroke();
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const rgb = b.grazed ? CYN : MAG;
      c.fillStyle = rgba(rgb, 0.92);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.42 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(b.grazed ? CYN : PNK, b.grazed ? 0.5 : 0.28);
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
    const aura = 0.16 + G.esp / ESP_MAX * 0.22 + (G.grazeFlash > 0 ? 0.18 : 0);

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(CYN, 0.22 + (G.grazeFlash > 0 ? 0.35 : 0));
    c.lineWidth = Math.max(1, scale);
    c.beginPath();
    c.arc(sx(x), sy(y - 2), GRAZE_R * scale, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(VIO, aura);
    c.beginPath();
    c.ellipse(sx(x), sy(y), 18 * scale, 14 * scale, 0, 0, TAU);
    c.fill();
    c.restore();

    c.fillStyle = rgba(CYN, 0.72);
    c.beginPath();
    c.moveTo(sx(x - 4), sy(y + 2));
    c.lineTo(sx(x - 18), sy(y + 8 + Math.sin(G.t * 10) * 1.4));
    c.lineTo(sx(x - 6), sy(y + 10));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(x + 4), sy(y + 2));
    c.lineTo(sx(x + 18), sy(y + 8 + Math.sin(G.t * 10 + 1) * 1.4));
    c.lineTo(sx(x + 6), sy(y + 10));
    c.closePath();
    c.fill();

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(CYN, 0.5);
    c.beginPath();
    c.moveTo(sx(x - 3), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 3), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(MAG, 0.96);
    pathDia(c, x, y + 1, 11, 0);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.95);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathDia(c, x, y + 1, 11, 0);
    c.stroke();

    c.fillStyle = rgba(VIO, 0.95);
    c.beginPath();
    c.moveTo(sx(x), sy(y - 18));
    c.lineTo(sx(x + 5), sy(y - 6));
    c.lineTo(sx(x - 5), sy(y - 6));
    c.closePath();
    c.fill();

    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.arc(sx(x), sy(y - 1), 2.4 * scale, 0, TAU);
    c.fill();

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
    for (let i = 0; i < gleams.length; i++) {
      const g = gleams[i];
      c.fillStyle = rgba(g.rgb, clamp(g.life / 0.35, 0, 1));
      pathDia(c, g.x, g.y, g.r + 1.2, G.t * 6);
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
      pathDia(c, r.x, r.y, 8 + r.t * 90, r.t);
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
    ctx.fillStyle = '#120814';
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
    ctx.fillStyle = '#120814';
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
    drawBurst();
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
      startGame('esp');
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
      if (down && !e.repeat) {
        audio.ensure();
        tryBurst();
      }
      e.preventDefault();
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
      startGame('esp');
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

  seedMotes();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnEsp) {
    btnEsp.addEventListener('click', function () {
      audio.ensure();
      startGame('esp');
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
      startGame(G.kind || 'esp');
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
  function burstClick(e) {
    if (e) e.preventDefault();
    audio.ensure();
    tryBurst();
  }
  if (btnBurst) btnBurst.addEventListener('click', burstClick);
  if (btnPad) btnPad.addEventListener('click', burstClick);

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
