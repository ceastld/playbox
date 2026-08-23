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
  const SHOT_V = 520;
  const SHOT_RANGE = 248;
  const FEVER_RANGE = 304;
  const FEVER_LEN = 6.2;
  const HEAT_NEAR = 48;
  const HEAT_HOT = 92;
  const HEAT_WARM = 160;
  const BEST_KEY = 'playbox-dangun-feveron-best';
  const MUTE_KEY = 'playbox-dangun-feveron-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [62, 248, 255];
  const GOLD = [255, 210, 74];
  const HOT = [255, 74, 40];
  const COR = [255, 106, 72];
  const WHT = [255, 232, 224];
  const PNK = [255, 154, 212];
  const DEEP = [28, 10, 12];

  const SCORE = {
    dancer: 50,
    dive: 80,
    lamp: 120,
    elite: 240,
    pod: 280,
    orb: 25,
    boss: 8000,
    chip: 10,
    stage: 1500
  };

  const STAGES = [
    {
      name: '灯廊',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'v', n: 7 },
        { t: 8.0, kind: 'spin' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'lamp' },
        { t: 15.2, kind: 'v', n: 7 },
        { t: 17.6, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '热阵',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.5, kind: 'dive', n: 5 },
        { t: 4.6, kind: 'stream', dir: -1 },
        { t: 6.8, kind: 'lamp' },
        { t: 8.4, kind: 'spin' },
        { t: 10.2, kind: 'elite' },
        { t: 12.2, kind: 'v', n: 9 },
        { t: 14.4, kind: 'dive', n: 6 },
        { t: 16.6, kind: 'lamp' },
        { t: 18.8, kind: 'stream', dir: 1 }
      ]
    },
    {
      name: '镜核',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.3, kind: 'dive', n: 5 },
        { t: 4.2, kind: 'elite' },
        { t: 6.2, kind: 'spin' },
        { t: 8.0, kind: 'lamp' },
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
  const btnDance = document.getElementById('btn-dance');
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
  const rankLabel = document.getElementById('rank-label');
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
  const glitter = [];

  const G = {
    mode: 'title',
    kind: 'dance',
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
    orbs: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
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
    gapT: 0,
    winT: 0,
    heat: 0,
    fever: false,
    feverT: 0,
    nearRank: 1,
    strobe: 0
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
    return isSea() ? 326 : 284;
  }
  function fireRate() {
    const base = isSea() ? 0.074 : 0.088;
    return G.fever ? base * 0.78 : base;
  }
  function bulletSpd() {
    return isSea() ? 190 : 150;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isSea() ? 128 : 90;
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function shotRange() {
    return G.fever ? FEVER_RANGE : SHOT_RANGE;
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
      const f = G.fever ? 1040 : 760;
      this.beep(f, 0.042, 'square', G.fever ? 0.034 : 0.026, f * 1.7);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1500);
      this.beep(580 * lift, 0.055, 'square', 0.036, 920 * lift);
    },
    near() {
      this.ensure();
      this.beep(880, 0.08, 'sawtooth', 0.04, 1480);
      this.beep(1320, 0.1, 'triangle', 0.028, 1980);
      this.noise(0.05, 0.03, 800);
    },
    orb(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.7, combo * 0.035);
      this.beep(720 * lift, 0.07, 'sine', 0.034, 1440 * lift);
      this.beep(1080 * lift, 0.09, 'triangle', 0.02, 1760 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    feverOn() {
      this.ensure();
      this.beep(220, 0.14, 'sawtooth', 0.05, 110);
      this.beep(660, 0.16, 'square', 0.042, 1320);
      this.beep(990, 0.22, 'triangle', 0.04, 1760);
      this.noise(0.14, 0.05, 400);
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

  function rankName(r) {
    if (r >= 4) return '密';
    if (r >= 3) return '热';
    if (r >= 2) return '温';
    return '冷';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '热铳';
      else if (hasBoss()) stageLabel.textContent = '镜球';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss() || G.fever));
    }
    if (tagLabel) {
      tagLabel.textContent = G.fever ? 'FEVE' : (isSea() ? '密热' : '热舞');
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.fever || G.combo >= 8);
    }
    if (rankLabel) {
      const r = G.nearRank;
      rankLabel.textContent = G.fever && r < 3 ? '热' : rankName(r);
      rankLabel.classList.toggle('warm', r === 2);
      rankLabel.classList.toggle('hot', r === 3 || G.fever);
      rankLabel.classList.toggle('near', r >= 4);
    }
    if (heatBar) {
      heatBar.style.transform = 'scaleX(' + clamp(G.heat / 100, 0, 1) + ')';
    }
    if (heatWrap) heatWrap.classList.toggle('hot', G.fever);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 贴身热铳，越近越高分', 'warn');
    else if (G.mode === 'win') setHint('镜球已碎 · R 再来', 'hot');
    else if (G.fever) setHint('FEVE · 热铳拉满 · 贴身拿密分', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 贴身拿密 · 吃珠续链', 'warn');
    else setHint('贴身热铳 · 越近越高分 · 吃热珠续链', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'FEVE';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'fever' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('fever');
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

  function seedGlitter() {
    glitter.length = 0;
    for (let i = 0; i < 64; i++) {
      glitter.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.16, 0.7),
        z: rand(0.35, 1.2),
        hue: (i % 3)
      });
    }
  }

  function proxRank(dist) {
    let r;
    if (dist < HEAT_NEAR) r = { n: 4, name: '密', mul: 4, heat: 18, orbs: 3, rgb: MAG };
    else if (dist < HEAT_HOT) r = { n: 3, name: '热', mul: 3, heat: 12, orbs: 2, rgb: HOT };
    else if (dist < HEAT_WARM) r = { n: 2, name: '温', mul: 2, heat: 6, orbs: 1, rgb: GOLD };
    else r = { n: 1, name: '冷', mul: 1, heat: 2, orbs: 0, rgb: CYN };
    if (G.fever) {
      r.mul += 1;
      r.heat = Math.round(r.heat * 1.25);
      if (r.n < 3) {
        r.n = 3;
        r.name = '热';
        r.rgb = HOT;
      }
    }
    return r;
  }

  function addHeat(n) {
    if (G.fever) return;
    G.heat = clamp(G.heat + n, 0, 100);
    if (G.heat >= 100) enterFever();
  }

  function enterFever() {
    G.fever = true;
    G.feverT = FEVER_LEN;
    G.heat = 100;
    audio.feverOn();
    hitStop(0.06);
    kick(5.2, 'fever');
    screenFlash(MAG, 0.52);
    ring(G.ship.x, G.ship.y, MAG);
    burst(G.ship.x, G.ship.y - 12, GOLD, 22, 220);
    burst(G.ship.x, G.ship.y - 12, CYN, 14, 180);
    floatText(G.ship.x, G.ship.y - 36, 'FEVE', MAG, true);
    toast('FEVE', false, true);
    syncHud();
  }

  function spawnOrb(x, y) {
    G.orbs.push({
      x: x + rand(-8, 8),
      y: y + rand(-8, 8),
      vx: rand(-50, 50),
      vy: rand(12, 64),
      t: 0,
      spin: rand(0, TAU)
    });
    capArr(G.orbs, 90);
  }

  function collectOrb(s) {
    const pts = Math.round(SCORE.orb * G.mult);
    addScore(pts);
    if (G.combo >= 1) bumpCombo();
    else {
      G.combo = 1;
      G.comboT = COMBO_WIN;
      G.mult = 1;
    }
    addHeat(5);
    burst(s.x, s.y, MAG, 8, 90);
    audio.orb(G.combo);
    syncHud();
  }

  function spawnEnemy(spec) {
    const hp = Math.max(1, Math.round((spec.hp || 1) * (spec.kind === 'boss' || spec.kind === 'pod' ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'dancer',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 94 * dens() : spec.vy,
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
      score: spec.score || SCORE.dancer,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      dance: !!spec.dance
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

  function spawnDancer(x, y, vx, vy) {
    spawnEnemy({
      kind: 'dancer',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 98 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.dancer,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnDancer(c + k * 36, -26 - Math.abs(k) * 16, 0, 102 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isSea() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'dancer',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 90 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.dancer,
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

  function spawnSpin() {
    const n = isSea() ? 8 : 6;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'dancer',
        x: VW * 0.5,
        y: -36,
        vy: 52 * dens(),
        hp: 2,
        r: 11,
        ang: i * (TAU / n),
        rad: 72,
        dance: true,
        score: SCORE.dancer,
        fireCd: 0.8 + i * 0.08
      });
    }
  }

  function spawnLamp() {
    const n = isSea() ? 5 : 4;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'lamp',
        x: 70 + i * ((VW - 140) / Math.max(1, n - 1)),
        y: -22,
        vy: 46 * dens(),
        hp: 5,
        r: 15,
        score: SCORE.lamp,
        fireCd: 0.5 + i * 0.12
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
        vy: 50 * dens(),
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
      hp: sea ? 118 : 96,
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
    toast('镜球', false, true);
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
    else if (w.kind === 'spin') spawnSpin();
    else if (w.kind === 'lamp') spawnLamp();
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
    G.muzzle = 0.055;
    const fever = G.fever;
    const n = fever ? 5 : 3;
    const spread = fever ? 0.16 : 0.18;
    const dmg = fever ? 1.35 : 1;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      const a = -Math.PI * 0.5 + k * spread;
      G.shots.push({
        x: G.ship.x + k * 6,
        y: G.ship.y - 14,
        vx: Math.cos(a) * SHOT_V,
        vy: Math.sin(a) * SHOT_V,
        r: fever ? 4.2 : 3.6,
        dmg: dmg,
        travel: 0
      });
    }
    capArr(G.shots, 64);
    audio.shoot();
  }

  function shipDist(e) {
    return hypot(e.x - G.ship.x, e.y - G.ship.y);
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    const dist = shipDist(e);
    const rank = proxRank(dist);
    const fall = clamp(1.15 - dist / 280, 0.55, 1.35);
    e.hp -= dmg * fall;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, rank.n >= 4 ? MAG : rank.n >= 3 ? HOT : GOLD);
      hitStop(rank.n >= 4 ? 0.05 : 0.034);
      audio.hit(G.combo);
      kick(rank.n >= 4 ? 2.6 : 1.7);
    }
    if (e.kind === 'boss' && src === 'shot') {
      addScore(Math.round(SCORE.chip * G.mult * rank.mul));
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, rank);
  }

  function killEnemy(e, rank) {
    if (!e.alive) return;
    e.alive = false;
    if (!rank) rank = proxRank(shipDist(e));
    const rgb = e.kind === 'boss' ? GOLD : rank.rgb;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult * rank.mul);
    addScore(pts);
    bumpCombo();
    addHeat(rank.heat);
    floatText(e.x, e.y - 10, String(pts), rgb, rank.n >= 4 || e.kind === 'boss');
    if (rank.n >= 4) {
      floatText(e.x, e.y - 24, '密', MAG, true);
      audio.near();
      hitStop(0.05);
      kick(3.4);
      screenFlash(MAG, 0.22);
    } else if (rank.n >= 3) {
      floatText(e.x, e.y - 22, '热', HOT, false);
    }
    for (let i = 0; i < rank.orbs; i++) spawnOrb(e.x, e.y);
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
      for (let i = G.bullets.length - 1; i >= 0; i--) {
        spawnOrb(G.bullets[i].x, G.bullets[i].y);
        G.bullets.splice(i, 1);
      }
      G.winT = 1.35;
      toast('镜球碎裂', false, true);
    } else if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'lamp') {
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
    G.fever = false;
    G.feverT = 0;
    G.heat = Math.max(0, G.heat * 0.35);
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, HOT, 18);
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
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    G.fever = false;
    audio.lose();
    showOverlay('lose', '铳冷了', '贴身热铳，越近越高分。分数 ' + G.score + '。');
    setHint('R 重开 · 贴身热铳，越近越高分', 'warn');
  }

  function goWin() {
    addScore(isSea() ? 10000 : 8000);
    G.mode = 'win';
    G.fever = false;
    audio.win();
    showOverlay(
      'win',
      isSea() ? '密热通关' : '灯尽镜碎',
      '三关打穿，镜球已碎。分数 ' + G.score + (isSea() ? ' · 密热' : ' · 热舞') + '。'
    );
    setHint('镜球已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.orbs.length = 0;
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
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '镜核'), false, true);
    audio.wave();
    screenFlash(HOT, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'sea' ? 'sea' : 'dance';
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
    G.heat = 18;
    G.fever = false;
    G.feverT = 0;
    G.nearRank = 1;
    G.strobe = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '密热' : '热舞', isSea(), !isSea());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'dance';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.fever = false;
    G.heat = 0;
    G.nearRank = 1;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '热铳', '贴身热铳，越近越高分。短关之后是镜球。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('dance');
    else startGame(G.kind || 'dance');
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
    if (G.strobe > 0) G.strobe -= dt;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < glitter.length; i++) {
      const s = glitter[i];
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
    if (!wantFire()) return;
    fireShot();
  }

  function updateFever(dt) {
    if (!G.fever) return;
    G.feverT -= dt;
    G.heat = clamp((G.feverT / FEVER_LEN) * 100, 0, 100);
    if (!REDUCE && G.strobe <= 0) {
      G.strobe = 0.18;
      screenFlash((G.t * 5 | 0) % 2 === 0 ? MAG : CYN, 0.12);
    }
    if (G.feverT <= 0) {
      G.fever = false;
      G.heat = 0;
      toast('铳温回落', true, false);
      syncHud();
    }
  }

  function updateNearRank() {
    let best = 9999;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const d = shipDist(e);
      if (d < best) best = d;
    }
    if (best >= 9999) G.nearRank = 1;
    else G.nearRank = proxRank(best).n;
  }

  function updateShots(dt) {
    const range = shotRange();
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      const step = hypot(s.vx, s.vy) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.travel += step;
      if (s.y < -24 || s.x < -20 || s.x > VW + 20 || s.travel > range) {
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
          const heat = clamp(1 - s.travel / range, 0.25, 1);
          damageEnemy(e, s.dmg * (0.7 + 0.8 * heat), 'shot');
          burst(s.x, s.y, G.fever ? MAG : HOT, 5, 70);
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

  function updateOrbs(dt) {
    for (let i = G.orbs.length - 1; i >= 0; i--) {
      const s = G.orbs[i];
      s.t += dt;
      s.spin += dt * 5;
      const magnet = G.combo >= 2 ? 280 : 170;
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.ship.x - s.x;
        const dy = G.ship.y - s.y;
        const d = hypot(dx, dy);
        if (d < 18) {
          collectOrb(s);
          G.orbs.splice(i, 1);
          continue;
        }
        if (d < 96) {
          const k = magnet / Math.max(24, d);
          s.vx += (dx / d) * k * dt * 60;
          s.vy += (dy / d) * k * dt * 60;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= Math.exp(-dt * 1.4);
      if (s.y > VH + 20 || s.t > 6) G.orbs.splice(i, 1);
    }
  }

  function fireInterval(e) {
    const sea = isSea() ? 0.74 : 1;
    if (e.kind === 'dancer') return 1.45 * sea;
    if (e.kind === 'lamp') return 1.05 * sea;
    if (e.kind === 'elite') return 0.82 * sea;
    if (e.kind === 'pod') return 1.1 * sea;
    if (e.kind === 'boss') return 0.55 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'dancer') {
      if (e.dance) {
        e.ang += dt * 1.7;
        e.x = VW * 0.5 + Math.cos(e.ang) * e.rad;
        e.y += e.vy * dt;
      } else {
        e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp * 0.35;
        e.y += e.vy * dt;
        e.x += e.vx * dt;
      }
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
    } else if (e.kind === 'lamp') {
      e.y += e.vy * dt;
      if (e.y > 88 && e.vy > 18) e.vy = 18;
      e.spin += dt * 2.4;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.2, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      e.spin += dt * 3.2;
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
      e.spin += dt * 4;
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
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.6 : 2.8);
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
          spawnDancer(e.x - 40, e.y + 20, -30, 110);
          spawnDancer(e.x + 40, e.y + 20, 30, 110);
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
      updateOrbs(dt);
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
      updateOrbs(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFever(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateOrbs(dt);
    updateWaves(dt);
    updateWorld(dt);
    updateNearRank();
    syncHud();
  }

  function pathDia(c, x, y, rx, ry, rot) {
    const a0 = rot || 0;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = a0 + i * (TAU / 4);
      const px = sx(x + Math.cos(a) * rx);
      const py = sy(y + Math.sin(a) * ry);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0c0608';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const pulse = 0.5 + 0.5 * Math.sin(G.t * (G.fever ? 8 : 2.2));
    const g = c.createRadialGradient(sx(VW * 0.5), sy(80), 8 * scale, sx(VW * 0.5), sy(VH * 0.42), 360 * scale);
    g.addColorStop(0, rgba(G.fever ? MAG : HOT, 0.1 + pulse * 0.06));
    g.addColorStop(1, 'rgba(12,6,8,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const size = 28;
    const yOff = (G.scroll * 0.5) % (size * 2);
    for (let row = -2; row < 16; row++) {
      for (let col = -1; col < 12; col++) {
        const x = 24 + col * size;
        const y = row * size + ((col & 1) ? size * 0.5 : 0) - yOff;
        const on = ((row + col + ((G.scroll * 0.02) | 0)) & 3) === 0;
        const hue = on ? ((col + (G.t * (G.fever ? 6 : 1.4) | 0)) % 3) : -1;
        if (hue < 0) continue;
        const rgb = hue === 0 ? MAG : hue === 1 ? CYN : GOLD;
        c.fillStyle = rgba(rgb, G.fever ? 0.16 : 0.07);
        pathDia(c, x, y, 9, 9, Math.PI / 4);
        c.fill();
      }
    }

    c.fillStyle = 'rgba(22,8,10,0.62)';
    c.fillRect(sx(0), sy(0), 34 * scale, VH * scale);
    c.fillRect(sx(VW - 34), sy(0), 34 * scale, VH * scale);
    const wallOff = (G.scroll * 0.85) % 22;
    for (let i = -1; i < 36; i++) {
      const y = i * 22 - wallOff;
      const hue = (i + (G.t * (G.fever ? 10 : 3) | 0)) % 3;
      const rgb = hue === 0 ? HOT : hue === 1 ? MAG : CYN;
      c.fillStyle = rgba(rgb, 0.55 + 0.3 * Math.sin(G.t * 6 + i));
      c.fillRect(sx(8), sy(y), 18 * scale, 10 * scale);
      c.fillRect(sx(VW - 26), sy(y + 11), 18 * scale, 10 * scale);
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < glitter.length; i++) {
      const p = glitter[i];
      const rgb = p.hue === 0 ? MAG : p.hue === 1 ? CYN : GOLD;
      c.fillStyle = rgba(rgb, p.a * 0.55);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawHeatZone() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const c = ctx;
    const x = G.ship.x;
    const y = G.ship.y;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 7);
    c.strokeStyle = rgba(MAG, 0.18 + pulse * 0.14);
    c.lineWidth = Math.max(1, 1.4 * scale);
    c.beginPath();
    c.arc(sx(x), sy(y), HEAT_NEAR * scale, 0, TAU);
    c.stroke();
    c.strokeStyle = rgba(HOT, 0.1 + pulse * 0.08);
    c.beginPath();
    c.arc(sx(x), sy(y), HEAT_HOT * scale, 0, TAU);
    c.stroke();
    if (G.fever) {
      c.fillStyle = rgba(MAG, 0.06);
      c.beginPath();
      c.arc(sx(x), sy(y), (HEAT_NEAR + Math.sin(G.t * 10) * 4) * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const near = G.mode === 'play' && shipDist(e) < HEAT_NEAR;
    if (near && e.kind !== 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(MAG, 0.55);
      c.lineWidth = Math.max(1, 1.3 * scale);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), (e.r + 6) * scale, 0, TAU);
      c.stroke();
      c.restore();
    }
    if (e.kind === 'lamp') {
      c.fillStyle = rgba(DEEP, 0.92);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), (e.r + 2) * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : GOLD, 0.9);
      c.lineWidth = Math.max(1, 1.3 * scale);
      c.stroke();
      c.save();
      c.globalCompositeOperation = 'lighter';
      const rgb = (e.t * 3 | 0) % 2 === 0 ? MAG : CYN;
      c.fillStyle = rgba(flash ? WHT : rgb, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 6 * scale, 0, TAU);
      c.fill();
      c.restore();
      return;
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(MAG, 0.14);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 50 * scale, 38 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), (e.r + 4) * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : HOT, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      c.stroke();
      for (let i = 0; i < 8; i++) {
        const a = e.spin + i * (TAU / 8);
        const rgb = i % 3 === 0 ? MAG : i % 3 === 1 ? CYN : GOLD;
        c.fillStyle = rgba(flash ? WHT : rgb, 0.85);
        c.beginPath();
        c.arc(
          sx(e.x + Math.cos(a) * 22),
          sy(e.y + Math.sin(a) * 16),
          4.2 * scale, 0, TAU
        );
        c.fill();
      }
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 8 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 3.2 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : HOT, 0.95);
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * ratio * scale, 5 * scale);
      return;
    }
    if (e.kind === 'dive') {
      c.fillStyle = rgba(flash ? WHT : COR, 0.95);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y + 12));
      c.lineTo(sx(e.x + 9), sy(e.y - 8));
      c.lineTo(sx(e.x), sy(e.y - 2));
      c.lineTo(sx(e.x - 9), sy(e.y - 8));
      c.closePath();
      c.fill();
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 2.4 * scale, 0, TAU);
      c.fill();
      return;
    }
    const rgb = flash ? WHT : (e.kind === 'elite' || e.kind === 'pod' ? HOT : COR);
    c.fillStyle = rgba(rgb, 0.95);
    pathDia(c, e.x, e.y, e.r, e.r * 0.85, Math.PI / 4);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.75);
    c.lineWidth = Math.max(0.8, scale);
    pathDia(c, e.x, e.y, e.r, e.r * 0.85, Math.PI / 4);
    c.stroke();
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y), 3 * scale, 0, TAU);
    c.fill();
    if (e.kind === 'elite' || e.kind === 'pod') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const rgb2 = (e.spin * 2 | 0) % 2 === 0 ? MAG : CYN;
      c.fillStyle = rgba(rgb2, 0.8);
      c.beginPath();
      c.arc(sx(e.x + Math.cos(e.spin) * 10), sy(e.y + Math.sin(e.spin) * 8), 2.4 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const range = shotRange();
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const heat = clamp(1 - s.travel / range, 0.2, 1);
      const rgb = G.fever ? MAG : heat > 0.65 ? HOT : heat > 0.4 ? COR : CYN;
      const rr = (2.2 + 3.4 * heat) * scale;
      c.fillStyle = rgba(rgb, 0.55 + heat * 0.4);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), rr * 0.55, rr, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.85 * heat);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 1.4 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(rgb, 0.35 * heat);
        c.lineWidth = 1.6 * scale;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y));
        c.lineTo(sx(s.x - s.vx * 0.022), sy(s.y - s.vy * 0.022));
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
        c.strokeStyle = rgba(CYN, 0.28);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 3.2) * scale, 0, TAU);
        c.stroke();
      }
    }
    for (let i = 0; i < G.orbs.length; i++) {
      const s = G.orbs[i];
      c.fillStyle = rgba(MAG, 0.95);
      pathDia(c, s.x, s.y, 5.4, 5.4, s.spin);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      pathDia(c, s.x, s.y, 2.4, 2.4, s.spin + 0.4);
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
    c.fillStyle = rgba(G.fever ? MAG : HOT, 0.2 + (G.muzzle > 0 ? 0.22 : 0));
    c.beginPath();
    c.ellipse(sx(x), sy(y), 16 * scale, 12 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(G.fever ? MAG : HOT, 0.5);
    c.beginPath();
    c.moveTo(sx(x - 5), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 5), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(HOT, 0.92);
    c.beginPath();
    c.moveTo(sx(x), sy(y - 18));
    c.lineTo(sx(x + 11), sy(y + 10));
    c.lineTo(sx(x), sy(y + 5));
    c.lineTo(sx(x - 11), sy(y + 10));
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.9);
    c.lineWidth = Math.max(1.1, 1.3 * scale);
    c.stroke();

    c.fillStyle = rgba(MAG, 0.9);
    c.beginPath();
    c.moveTo(sx(x - 12), sy(y + 4));
    c.lineTo(sx(x - 18), sy(y + 10));
    c.lineTo(sx(x - 6), sy(y + 8));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(x + 12), sy(y + 4));
    c.lineTo(sx(x + 18), sy(y + 10));
    c.lineTo(sx(x + 6), sy(y + 8));
    c.closePath();
    c.fill();

    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y - 2), 2.6 * scale, 0, TAU);
    c.fill();

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 16), 5.4 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(HOT, 0.7);
      c.beginPath();
      c.arc(sx(x), sy(y - 20), 3.2 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
    if (G.fever && !REDUCE) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(MAG, 0.55);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), (8 + Math.sin(G.t * 14) * 1.6) * scale, 0, TAU);
      c.stroke();
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
    drawHeatZone();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
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
      startGame('dance');
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
      startGame('dance');
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

  seedGlitter();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnDance) {
    btnDance.addEventListener('click', function () {
      audio.ensure();
      startGame('dance');
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
      startGame(G.kind || 'dance');
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
