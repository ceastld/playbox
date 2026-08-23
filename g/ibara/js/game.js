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
  const SHOT_V = 720;
  const THORN_MAX = 100;
  const MEDAL_CAP = 8;
  const BEST_KEY = 'playbox-ibara-best';
  const MUTE_KEY = 'playbox-ibara-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const LIME = [140, 232, 48];
  const ROSE = [255, 61, 110];
  const GOLD = [255, 227, 107];
  const HOT = [200, 255, 106];
  const WHT = [240, 255, 232];
  const PNK = [255, 154, 180];
  const DEEP = [16, 28, 12];
  const PETAL = [255, 122, 160];

  const MEDAL_PTS = [20, 35, 55, 80, 110, 150, 200, 280];

  const SCORE = {
    moth: 50,
    dive: 80,
    turret: 120,
    guard: 150,
    elite: 240,
    pod: 280,
    boss: 8000,
    chip: 12,
    stage: 1500
  };

  const STAGES = [
    {
      name: '荆门',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'v', n: 7 },
        { t: 8.0, kind: 'turrets' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'guard' },
        { t: 15.2, kind: 'v', n: 7 },
        { t: 17.6, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '蔷廊',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.5, kind: 'dive', n: 5 },
        { t: 4.6, kind: 'stream', dir: -1 },
        { t: 6.8, kind: 'guard' },
        { t: 8.4, kind: 'guard' },
        { t: 10.2, kind: 'turrets' },
        { t: 12.2, kind: 'elite' },
        { t: 14.4, kind: 'v', n: 9 },
        { t: 16.6, kind: 'dive', n: 6 },
        { t: 18.8, kind: 'stream', dir: 1 }
      ]
    },
    {
      name: '茨核',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.3, kind: 'dive', n: 5 },
        { t: 4.2, kind: 'elite' },
        { t: 6.2, kind: 'turrets' },
        { t: 8.0, kind: 'guard' },
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
  const btnCity = document.getElementById('btn-city');
  const btnSea = document.getElementById('btn-sea');
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
  const medalLabel = document.getElementById('medal-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const thornBar = document.getElementById('thorn-bar');
  const thornWrap = document.getElementById('thorn-wrap');

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
  let medalTok = 0;

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
    kind: 'city',
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
    thorn: 0,
    thornHold: 0,
    medal: 0,
    enemies: [],
    shots: [],
    bullets: [],
    roses: [],
    opts: [],
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
    return isSea() ? 320 : 278;
  }
  function fireRate() {
    const base = isSea() ? 0.076 : 0.09;
    return base * (1 - thornLevel() * 0.05);
  }
  function bulletSpd() {
    return isSea() ? 186 : 144;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isSea() ? 124 : 88;
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function thornLevel() {
    if (G.thorn >= 70) return 2;
    if (G.thorn >= 32) return 1;
    return 0;
  }
  function optionCount() {
    return 2 + thornLevel();
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
      const lift = 1 + (lv || 0) * 0.07;
      this.beep(760 * lift, 0.04, 'square', 0.024, 1480 * lift);
    },
    rose(rank) {
      this.ensure();
      const lift = 1 + Math.min(0.9, rank * 0.08);
      this.beep(880 * lift, 0.055, 'sine', 0.032, 1640 * lift);
      this.beep(1320 * lift, 0.08, 'triangle', 0.02, 1980 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.026, 1400);
      this.beep(620 * lift, 0.052, 'square', 0.034, 960 * lift);
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
    optionUp() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.036, 990);
      this.beep(990, 0.12, 'triangle', 0.03, 1320);
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
      if (G.mode === 'title') stageLabel.textContent = '茨';
      else if (hasBoss()) stageLabel.textContent = '茨王';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '弹海' : '荆城';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.thorn >= 70);
    }
    if (medalLabel) medalLabel.textContent = '玫 ' + G.medal;
    if (thornBar) thornBar.style.transform = 'scaleX(' + clamp(G.thorn / THORN_MAX, 0, 1) + ')';
    if (thornWrap) {
      thornWrap.classList.toggle('hot', G.thorn >= 70);
      thornWrap.classList.toggle('ready', G.thorn >= 32 && G.thorn < 70);
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
    else if (G.mode === 'lose') setHint('R 重开 · 空格点射，选项跟射，收玫叠倍', 'warn');
    else if (G.mode === 'win') setHint('茨核已碎 · R 再来', 'hot');
    else if (G.thorn >= 70) setHint('茨芯 MAX · 四选项跟射', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 收玫续链', 'warn');
    else setHint('空格点射 · 选项跟射 · 击破收玫', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'IBAR';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 2.4 ? 'rose' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('rose');
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
      rgb: rgb || LIME
    });
    capArr(gleams, 80);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 72; i++) {
      motes.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.1),
        a: rand(0.12, 0.55),
        z: rand(0.35, 1.15),
        rose: i % 3 === 0
      });
    }
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'pod';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'moth',
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
      score: spec.score || SCORE.moth,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: !!spec.ground
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
      petal: true
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

  function petalFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.4);
    }
  }

  function spawnMoth(x, y, vx, vy) {
    spawnEnemy({
      kind: 'moth',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.moth,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnMoth(c + k * 36, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isSea() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'moth',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.moth,
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
    const xs = [56, 160, 320, 424];
    if (isSea()) xs.splice(2, 0, 240);
    for (let i = 0; i < xs.length; i++) {
      spawnEnemy({
        kind: 'turret',
        x: xs[i],
        y: -22,
        vy: 48 * dens(),
        hp: 7,
        r: 14,
        score: SCORE.turret,
        ground: true,
        fireCd: 0.5 + i * 0.12
      });
    }
  }

  function spawnGuard(x) {
    spawnEnemy({
      kind: 'guard',
      x: x == null ? (Math.random() < 0.5 ? 120 : 360) : x,
      y: -32,
      vy: 62 * dens(),
      hp: 6,
      r: 15,
      amp: 70,
      score: SCORE.guard,
      fireCd: 0.45
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
      hp: sea ? 114 : 92,
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
    toast('茨王', false, true);
    audio.wave();
    screenFlash(ROSE, 0.36);
    kick(4.6, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isSea() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isSea() ? 1 : 0));
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'guard') {
      spawnGuard(140);
      spawnGuard(340);
      if (isSea()) spawnGuard(240);
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

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function optionSlots() {
    return [
      [-28, 12],
      [28, 12],
      [0, 26],
      [0, -18]
    ];
  }

  function pushShot(x, y, vx, vy, r, dmg, from) {
    G.shots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r,
      dmg: dmg,
      from: from
    });
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    const lv = thornLevel();
    G.muzzle = 0.05 + lv * 0.01;
    const streams = lv === 0 ? 2 : lv === 1 ? 3 : 3;
    const spread = lv === 0 ? 0.06 : lv === 1 ? 0.12 : 0.16;
    const dmg = 1 + lv * 0.18;
    const r = 3.1 + lv * 0.55;
    for (let i = 0; i < streams; i++) {
      const t = streams === 1 ? 0 : (i - (streams - 1) * 0.5);
      const a = -Math.PI * 0.5 + t * spread;
      pushShot(
        G.ship.x + t * (4 + lv),
        G.ship.y - 16,
        Math.cos(a) * SHOT_V,
        Math.sin(a) * SHOT_V,
        r,
        dmg,
        'ship'
      );
    }
    for (let i = 0; i < G.opts.length; i++) {
      const o = G.opts[i];
      const a = -Math.PI * 0.5 + (o.x - G.ship.x) * 0.007;
      pushShot(o.x, o.y - 8, Math.cos(a) * SHOT_V, Math.sin(a) * SHOT_V, 2.6, 0.7, 'opt');
    }
    capArr(G.shots, 96);
    audio.shoot(lv);
  }

  function spawnRose(x, y) {
    G.roses.push({
      x: x,
      y: y,
      vx: rand(-28, 28),
      vy: rand(18, 46),
      t: 0,
      life: 6.4
    });
    capArr(G.roses, 28);
  }

  function collectRose(r) {
    const prevLv = thornLevel();
    G.medal = Math.min(MEDAL_CAP, G.medal + 1);
    const pts = Math.round(MEDAL_PTS[G.medal - 1] * G.mult);
    addScore(pts);
    bumpCombo();
    G.thorn = clamp(G.thorn + 14, 0, THORN_MAX);
    G.thornHold = 0.7;
    gleam(r.x, r.y, ROSE);
    gleam(r.x, r.y, GOLD);
    spark(r.x, r.y, ROSE);
    audio.rose(G.medal);
    floatText(r.x, r.y - 8, '玫 ×' + G.medal, ROSE, G.medal >= 4);
    if (G.medal % 2 === 0 || G.medal >= 6) {
      hitStop(0.038);
      kick(2.6, 'rose');
    }
    if (medalLabel) {
      medalLabel.classList.remove('hot');
      void medalLabel.offsetWidth;
      medalLabel.classList.add('hot');
    }
    medalTok += 1;
    if (thornLevel() > prevLv) {
      audio.optionUp();
      toast(optionCount() + ' 选项', false, true);
      ring(G.ship.x, G.ship.y, LIME);
    }
    syncHud();
  }

  function resetMedal() {
    if (G.medal > 0) G.medal = 0;
    syncHud();
  }

  function addThorn(n) {
    const prev = thornLevel();
    G.thorn = clamp(G.thorn + n, 0, THORN_MAX);
    G.thornHold = Math.max(G.thornHold, 0.35);
    if (thornLevel() > prev) {
      audio.optionUp();
      toast(optionCount() + ' 选项', false, true);
      ring(G.ship.x, G.ship.y, LIME);
    }
  }

  function suicideThorns(e) {
    const n = isSea() ? 6 : (e.kind === 'elite' || e.kind === 'guard' ? 4 : 0);
    if (n <= 0) return;
    petalFire(e, n, bulletSpd() * 0.52, rand(0, TAU));
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
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'elite' || e.kind === 'guard' ? ROSE : LIME;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'elite' ? 22 : 14);
    const medalBonus = 1 + G.medal * 0.08;
    const pts = Math.round(e.score * G.mult * medalBonus);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    addThorn(e.kind === 'boss' ? 18 : 3);
    if (e.kind !== 'boss') spawnRose(e.x, e.y);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(LIME, 0.72);
      burstFx(e.x, e.y, ROSE, 36, 280);
      burstFx(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, LIME);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      for (let i = G.bullets.length - 1; i >= 0; i--) {
        gleam(G.bullets[i].x, G.bullets[i].y, LIME);
        G.bullets.splice(i, 1);
      }
      for (let i = 0; i < 6; i++) spawnRose(e.x + rand(-40, 40), e.y + rand(-20, 20));
      G.winT = 1.35;
      toast('茨王碎裂', false, true);
    } else {
      suicideThorns(e);
      if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'guard') {
        audio.explode();
        hitStop(0.05);
        kick(3.2);
      }
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    breakCombo();
    resetMedal();
    explode(G.ship.x, G.ship.y, ROSE, 36);
    explode(G.ship.x, G.ship.y, LIME, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(ROSE, 0.6);
    G.bullets.length = 0;
    G.thorn = Math.max(0, G.thorn * 0.5);
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    for (let i = 0; i < G.opts.length; i++) {
      G.opts[i].x = G.ship.x;
      G.opts[i].y = G.ship.y;
    }
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '空格点射，选项跟射，击破收玫叠倍。分数 ' + G.score + '。');
    setHint('R 重开 · 空格点射，选项跟射，收玫叠倍', 'warn');
  }

  function goWin() {
    addScore(isSea() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isSea() ? '弹海通关' : '茨核尽碎',
      '三关打穿，茨王已碎。分数 ' + G.score + (isSea() ? ' · 弹海' : ' · 荆城') + '。'
    );
    setHint('茨核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.roses.length = 0;
    G.opts.length = 0;
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
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '茨核'), false, true);
    audio.wave();
    screenFlash(LIME, 0.22);
    syncHud();
  }

  function seedOptions() {
    G.opts.length = 0;
    const n = optionCount();
    const slots = optionSlots();
    for (let i = 0; i < n; i++) {
      G.opts.push({
        x: G.ship.x + slots[i][0],
        y: G.ship.y + slots[i][1],
        a: i * 1.4
      });
    }
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'sea' ? 'sea' : 'city';
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
    G.thorn = 18;
    G.thornHold = 0;
    G.medal = 0;
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
    seedOptions();
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '弹海' : '荆城', isSea(), !isSea());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'city';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.thorn = 18;
    G.medal = 0;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    seedOptions();
    showOverlay('title', '茨', '空格点射，选项跟射。击破落玫，连收叠倍。荆城短关之后是茨王。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('city');
    else startGame(G.kind || 'city');
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

  function updateOptions(dt) {
    const n = G.mode === 'play' ? optionCount() : 2;
    const slots = optionSlots();
    while (G.opts.length < n) {
      const i = G.opts.length;
      G.opts.push({
        x: G.ship.x + slots[i][0],
        y: G.ship.y + slots[i][1],
        a: i * 1.2
      });
    }
    while (G.opts.length > n) G.opts.pop();
    for (let i = 0; i < G.opts.length; i++) {
      const o = G.opts[i];
      const k = 1 - Math.exp(-dt * (9 - i * 1.1));
      o.x = lerp(o.x, G.ship.x + slots[i][0], k);
      o.y = lerp(o.y, G.ship.y + slots[i][1], k);
      o.a += dt * 3.2;
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

  function updateThorn(dt) {
    if (G.thornHold > 0) G.thornHold -= dt;
    else if (G.thorn > 0) {
      G.thorn = Math.max(0, G.thorn - 4.2 * dt);
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
          burstFx(s.x, s.y, s.from === 'opt' ? ROSE : LIME, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
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
      }
    }
  }

  function updateRoses(dt) {
    const canGrab = G.mode === 'play' && G.deadT <= 0;
    for (let i = G.roses.length - 1; i >= 0; i--) {
      const r = G.roses[i];
      r.t += dt;
      r.life -= dt;
      if (canGrab) {
        const dx = G.ship.x - r.x;
        const dy = G.ship.y - r.y;
        const d = hypot(dx, dy);
        if (d < 16) {
          collectRose(r);
          G.roses.splice(i, 1);
          continue;
        }
        if (d < 64) {
          const pull = (1 - d / 64) * 280;
          r.vx += (dx / Math.max(d, 0.01)) * pull * dt;
          r.vy += (dy / Math.max(d, 0.01)) * pull * dt;
        }
      }
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.vx *= Math.exp(-dt * 1.4);
      r.vy = lerp(r.vy, 52, 1 - Math.exp(-dt * 1.2));
      if (r.life <= 0 || r.y > VH + 16) {
        resetMedal();
        G.roses.splice(i, 1);
      }
    }
  }

  function fireInterval(e) {
    const sea = isSea() ? 0.74 : 1;
    if (e.kind === 'moth') return 1.45 * sea;
    if (e.kind === 'turret') return 1.18 * sea;
    if (e.kind === 'guard') return 0.98 * sea;
    if (e.kind === 'elite') return 0.82 * sea;
    if (e.kind === 'pod') return 1.1 * sea;
    if (e.kind === 'boss') return 0.55 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'moth') {
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
      if (e.y > 92 && e.vy > 18) e.vy = 18;
      e.ang = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16 && e.y < VH - 60) {
        aimedFire(e, isSea() ? 2 : 1, 0.16, bulletSpd() * 0.88);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'guard') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      e.spin += dt * 1.6;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.24, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 3, 0.2, bulletSpd());
        if ((e.pattern++ % 2) === 0) petalFire(e, 5, bulletSpd() * 0.7, e.t);
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
        if (Math.random() < 0.5) petalFire(e, 5, spd * 0.7, e.spin);
        e.fireCd = 1.12 * (isSea() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        petalFire(e, 8, spd * 0.78, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.5 * (isSea() ? 0.78 : 1);
      } else {
        petalFire(e, 10, spd * 0.76, e.spin);
        petalFire(e, 5, spd * 0.54, -e.spin * 0.8);
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnMoth(e.x - 40, e.y + 20, -30, 110);
          spawnMoth(e.x + 40, e.y + 20, 30, 110);
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
      updateOptions(dt);
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
      updateRoses(dt);
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
      updateRoses(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateOptions(dt);
    updateFire(dt);
    updateThorn(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateRoses(dt);
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

  function pathPetal(c, x, y, r, rot, n) {
    const k = n || 5;
    c.beginPath();
    for (let i = 0; i < k; i++) {
      const a = (rot || 0) + i * (TAU / k) - Math.PI / 2;
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function pathThorn(c, x, y, w, h) {
    c.beginPath();
    c.moveTo(sx(x), sy(y - h));
    c.lineTo(sx(x + w), sy(y + h * 0.4));
    c.lineTo(sx(x), sy(y + h * 0.15));
    c.lineTo(sx(x - w), sy(y + h * 0.4));
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#081008';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(90), 10 * scale, sx(VW * 0.5), sy(VH * 0.4), 380 * scale);
    g.addColorStop(0, 'rgba(140,232,48,0.08)');
    g.addColorStop(0.45, 'rgba(255,61,110,0.05)');
    g.addColorStop(1, 'rgba(8,16,8,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const yOff = (G.scroll * 0.32) % 72;
    c.fillStyle = 'rgba(20, 36, 16, 0.55)';
    for (let i = -1; i < 14; i++) {
      const y = i * 72 - yOff;
      c.fillRect(sx(70), sy(y + 18), 340 * scale, 22 * scale);
      for (let k = 0; k < 7; k++) {
        const x = 92 + k * 48;
        c.fillRect(sx(x), sy(y), 22 * scale, 18 * scale);
      }
    }

    c.fillStyle = 'rgba(14, 24, 12, 0.72)';
    c.fillRect(sx(0), sy(0), 36 * scale, VH * scale);
    c.fillRect(sx(VW - 36), sy(0), 36 * scale, VH * scale);
    const wallOff = (G.scroll * 0.7) % 36;
    for (let i = -1; i < 24; i++) {
      const y = i * 36 - wallOff;
      c.fillStyle = rgba(LIME, 0.16);
      pathThorn(c, 18, y, 11, 16);
      c.fill();
      pathThorn(c, VW - 18, y + 18, 11, 16);
      c.fill();
      c.strokeStyle = rgba(LIME, 0.34);
      c.lineWidth = Math.max(0.8, scale);
      pathThorn(c, 18, y, 11, 16);
      c.stroke();
      pathThorn(c, VW - 18, y + 18, 11, 16);
      c.stroke();
      c.fillStyle = rgba(ROSE, 0.28);
      c.beginPath();
      c.arc(sx(18), sy(y + 6), 2.2 * scale, 0, TAU);
      c.fill();
      c.beginPath();
      c.arc(sx(VW - 18), sy(y + 24), 2.2 * scale, 0, TAU);
      c.fill();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < motes.length; i++) {
      const p = motes[i];
      if (p.rose) {
        c.fillStyle = rgba(ROSE, p.a * 0.45);
        pathPetal(c, p.x, p.y, p.s + 1.4, G.t * 0.6, 5);
        c.fill();
      } else {
        c.fillStyle = rgba(LIME, p.a * 0.5);
        c.beginPath();
        c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
        c.fill();
      }
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    if (e.kind === 'turret') {
      c.fillStyle = rgba(DEEP, 0.95);
      c.fillRect(sx(e.x - e.r), sy(e.y - e.r * 0.7), e.r * 2 * scale, e.r * 1.4 * scale);
      c.strokeStyle = rgba(flash ? WHT : LIME, 0.85);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.strokeRect(sx(e.x - e.r), sy(e.y - e.r * 0.7), e.r * 2 * scale, e.r * 1.4 * scale);
      c.save();
      c.translate(sx(e.x), sy(e.y));
      c.rotate(e.ang || 0);
      c.fillStyle = rgba(flash ? WHT : ROSE, 0.95);
      c.fillRect(0, -2.2 * scale, 16 * scale, 4.4 * scale);
      c.restore();
      c.fillStyle = rgba(ROSE, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 3.2 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'guard') {
      c.fillStyle = rgba(DEEP, 0.92);
      pathPetal(c, e.x, e.y, e.r + 3, e.spin, 5);
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : ROSE, 0.9);
      c.lineWidth = Math.max(1, 1.3 * scale);
      pathPetal(c, e.x, e.y, e.r + 3, e.spin, 5);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : LIME, 0.95);
      pathDia(c, e.x, e.y, 5, e.spin + 0.4);
      c.fill();
      return;
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(ROSE, 0.16);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 54 * scale, 40 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.95);
      pathPetal(c, e.x, e.y, e.r + 10, e.spin * 0.18, 5);
      c.fill();
      c.strokeStyle = rgba(LIME, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      pathPetal(c, e.x, e.y, e.r + 10, e.spin * 0.18, 5);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : ROSE, 0.92);
      pathPetal(c, e.x, e.y - 2, 18, -e.spin * 0.2, 5);
      c.fill();
      c.fillStyle = rgba(LIME, 0.95);
      pathThorn(c, e.x, e.y - 28, 8, 16);
      c.fill();
      pathThorn(c, e.x - 16, e.y - 22, 6, 12);
      c.fill();
      pathThorn(c, e.x + 16, e.y - 22, 6, 12);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 4), 6 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 18), 72 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? ROSE : LIME, 0.95);
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 18), 72 * ratio * scale, 5 * scale);
      return;
    }
    const rgb = flash ? WHT : (e.kind === 'elite' ? ROSE : LIME);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(LIME, 0.12);
    c.beginPath();
    c.ellipse(sx(e.x), sy(e.y), (e.r + 6) * scale, (e.r + 2) * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    if (e.kind === 'dive') {
      c.fillStyle = rgba(rgb, 0.95);
      pathThorn(c, e.x, e.y, e.r * 0.7, e.r);
      c.fill();
      c.strokeStyle = rgba(ROSE, 0.7);
      c.lineWidth = Math.max(0.8, scale);
      pathThorn(c, e.x, e.y, e.r * 0.7, e.r);
      c.stroke();
    } else {
      c.fillStyle = rgba(rgb, 0.95);
      pathDia(c, e.x, e.y, e.r - (e.kind === 'elite' ? 0 : 1), e.t * 0.8);
      c.fill();
      c.strokeStyle = rgba(LIME, 0.75);
      c.lineWidth = Math.max(0.8, scale);
      pathDia(c, e.x, e.y, e.r - (e.kind === 'elite' ? 0 : 1), e.t * 0.8);
      c.stroke();
    }
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y), 2.4 * scale, 0, TAU);
    c.fill();
    if (e.kind === 'elite' || e.kind === 'pod') {
      c.fillStyle = rgba(ROSE, 0.85);
      pathPetal(c, e.x, e.y + e.r - 4, 5, e.t, 5);
      c.fill();
    }
  }

  function drawRoses() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.roses.length; i++) {
      const r = G.roses[i];
      const pulse = 0.75 + Math.sin(r.t * 8) * 0.2;
      c.fillStyle = rgba(ROSE, 0.95);
      pathPetal(c, r.x, r.y, 6.2 * pulse, r.t * 2.2, 5);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), 1.8 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.from === 'opt' ? ROSE : LIME;
      c.fillStyle = rgba(rgb, 0.95);
      pathDia(c, s.x, s.y, s.from === 'opt' ? 3.4 : 4.2, G.t * 8);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 1.4 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(s.from === 'opt' ? PNK : HOT, 0.32);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y));
        c.lineTo(sx(s.x - s.vx * 0.018), sy(s.y - s.vy * 0.018));
        c.stroke();
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      c.fillStyle = rgba(ROSE, 0.92);
      pathPetal(c, b.x, b.y, b.r + 1.4, G.t * 4 + i, 5);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.4 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(PNK, 0.3);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 3.2) * scale, 0, TAU);
        c.stroke();
      }
    }
    c.restore();
  }

  function drawOptions() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const c = ctx;
    for (let i = 0; i < G.opts.length; i++) {
      const o = G.opts[i];
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(ROSE, 0.22);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 10 * scale, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(ROSE, 0.95);
      pathPetal(c, o.x, o.y, 7.2, o.a, 5);
      c.fill();
      c.strokeStyle = rgba(LIME, 0.8);
      c.lineWidth = Math.max(0.8, scale);
      pathPetal(c, o.x, o.y, 7.2, o.a, 5);
      c.stroke();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 1.8 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    const aura = 0.16 + G.thorn / THORN_MAX * 0.22;

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(LIME, aura);
    c.beginPath();
    c.ellipse(sx(x), sy(y), 18 * scale, 14 * scale, 0, 0, TAU);
    c.fill();
    c.restore();

    c.fillStyle = rgba(LIME, 0.72);
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
    c.fillStyle = rgba(LIME, 0.5);
    c.beginPath();
    c.moveTo(sx(x - 3), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 3), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(LIME, 0.96);
    pathThorn(c, x, y + 2, 10, 16);
    c.fill();
    c.strokeStyle = rgba(HOT, 0.95);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathThorn(c, x, y + 2, 10, 16);
    c.stroke();

    c.fillStyle = rgba(ROSE, 0.95);
    pathPetal(c, x, y + 1, 6.5, G.t * 1.4, 5);
    c.fill();

    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.arc(sx(x), sy(y - 1), 2.3 * scale, 0, TAU);
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
      pathPetal(c, g.x, g.y, g.r + 1.2, G.t * 6, 5);
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
      pathPetal(c, r.x, r.y, 8 + r.t * 90, r.t, 5);
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
    ctx.fillStyle = '#0c1408';
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
    ctx.fillStyle = '#0c1408';
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
    drawRoses();
    drawShots();
    drawOptions();
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
      startGame('city');
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
      startGame('city');
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

  if (btnCity) {
    btnCity.addEventListener('click', function () {
      audio.ensure();
      startGame('city');
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
      startGame(G.kind || 'city');
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
