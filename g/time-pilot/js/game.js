'use strict';

(function () {
  const VW = 800;
  const VH = 480;
  const CX = VW * 0.5;
  const CY = VH * 0.5;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 10;
  const TURN = 9.6;
  const FLY = 198;
  const FLY_D = 226;
  const SHOT_V = 520;
  const SHOT_LIFE = 0.72;
  const SHOT_MAX = 4;
  const FIRE_CD = 0.12;
  const FIRE_CD_D = 0.095;
  const COMBO_WIN = 1.36;
  const BEST_KEY = 'playbox-time-pilot-best';
  const MUTE_KEY = 'playbox-time-pilot-mute';
  const OPS = '←↑↓→ / WASD 环飞 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const ICE = [92, 184, 255];
  const GOLD = [255, 227, 107];
  const WHT = [232, 244, 255];
  const ORG = [255, 150, 70];
  const MINT = [90, 230, 180];
  const PNK = [255, 176, 210];

  const ERAS = [
    {
      name: '飞鸢纪', year: '1910', tag: 'KITE',
      sky0: '#0a1c24', sky1: '#041018', mist: [70, 170, 190],
      cloud: [176, 214, 224], tint: ICE, craft: 'bi',
      boss: 'whale', bossName: '飞鲸',
      quota: 16, quotaD: 22, hp: 18, hpD: 26, score: 2200,
      spd: 86, ace: 124, shot: 1.85
    },
    {
      name: '铁鹰纪', year: '1940', tag: 'IRON',
      sky0: '#071018', sky1: '#030810', mist: [50, 90, 130],
      cloud: [150, 168, 186], tint: ICE, craft: 'ww',
      boss: 'fort', bossName: '铁堡',
      quota: 16, quotaD: 22, hp: 22, hpD: 32, score: 2800,
      spd: 108, ace: 156, shot: 1.55
    },
    {
      name: '旋桨纪', year: '1970', tag: 'ROTOR',
      sky0: '#061814', sky1: '#031210', mist: [40, 140, 110],
      cloud: [140, 196, 176], tint: MINT, craft: 'heli',
      boss: 'nest', bossName: '旋巢',
      quota: 16, quotaD: 22, hp: 26, hpD: 38, score: 3400,
      spd: 96, ace: 142, shot: 1.42
    },
    {
      name: '银箭纪', year: '1982', tag: 'ARROW',
      sky0: '#05101c', sky1: '#020814', mist: [40, 90, 170],
      cloud: [130, 170, 210], tint: CYN, craft: 'jet',
      boss: 'shark', bossName: '银鲨',
      quota: 16, quotaD: 22, hp: 30, hpD: 44, score: 4200,
      spd: 132, ace: 188, shot: 1.22
    },
    {
      name: '星核纪', year: '2001', tag: 'CORE',
      sky0: '#08061c', sky1: '#030610', mist: [80, 50, 150],
      cloud: [150, 130, 210], tint: MAG, craft: 'ufo',
      boss: 'core', bossName: '时核',
      quota: 16, quotaD: 22, hp: 36, hpD: 52, score: 5400,
      spd: 118, ace: 168, shot: 1.08
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
  const btnEra = document.getElementById('btn-era');
  const btnCore = document.getElementById('btn-core');
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
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const progBar = document.getElementById('prog-bar');
  const progWrap = document.getElementById('prog-wrap');
  const progEm = document.getElementById('prog-em');
  const padsEl = document.getElementById('pads');
  const stickEl = document.getElementById('stick');
  const knobEl = document.getElementById('knob');
  const padFire = document.getElementById('pad-fire');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;
  let comboTok = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const analog = { x: 0, y: 0, on: false };
  const pointer = { down: false, id: null, ax: 0, ay: 0 };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const clouds = [];
  const stars = [];
  const ghosts = [];

  const G = {
    mode: 'title',
    kind: 'era',
    t: 0,
    clock: 0,
    era: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: LIFE_EVERY,
    ship: { x: 0, y: 0, ang: -Math.PI / 2, bank: 0 },
    enemies: [],
    shots: [],
    bullets: [],
    paras: [],
    kills: 0,
    quota: 16,
    spawnT: 0.4,
    waveN: 0,
    fireCd: 0,
    muzzle: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ICE,
    punch: 1,
    toastT: 0,
    why: '',
    phase: 'hunt',
    warpT: 0,
    bossOn: false,
    bossHp: 0,
    bossMax: 1,
    endT: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function angNorm(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function turnToward(cur, want, rate) {
    return cur + clamp(angNorm(want - cur), -rate, rate);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function sx(x) {
    return ox + (CX + (x - G.ship.x)) * scale;
  }
  function sy(y) {
    return oy + (CY + (y - G.ship.y)) * scale;
  }
  function eraSpec() {
    return ERAS[G.era] || ERAS[0];
  }
  function isDense() {
    return G.kind === 'core';
  }
  function lastEra() {
    return G.era >= ERAS.length - 1;
  }
  function flySpd() {
    return isDense() ? FLY_D : FLY;
  }
  function fireGap() {
    return isDense() ? FIRE_CD_D : FIRE_CD;
  }
  function quotaOf(spec) {
    return isDense() ? spec.quotaD : spec.quota;
  }
  function bossHpOf(spec) {
    return isDense() ? spec.hpD : spec.hp;
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
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
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
      this.beep(1320, 0.048, 'square', 0.026, 280);
      this.beep(680, 0.032, 'triangle', 0.012, 160);
    },
    hit() {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.03, 420);
      this.noise(0.04, 0.018, 1400);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.1, big ? 0.07 : 0.04, big ? 180 : 320);
      this.beep(big ? 220 : 340, big ? 0.2 : 0.1, 'sawtooth', big ? 0.05 : 0.032, 50);
      this.beep(big ? 140 : 220, big ? 0.28 : 0.14, 'triangle', 0.028, 40);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.028, 1176);
    },
    para() {
      this.ensure();
      this.beep(660, 0.07, 'sine', 0.036, 990);
      this.beep(990, 0.12, 'triangle', 0.03, 1320);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.038, 1046);
      this.beep(1046, 0.18, 'sine', 0.042, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.064, 220);
      this.beep(220, 0.24, 'sawtooth', 0.05, 52);
      this.beep(110, 0.36, 'sine', 0.042, 36);
    },
    warp() {
      this.ensure();
      this.beep(180, 0.22, 'sine', 0.046, 1400);
      this.beep(90, 0.3, 'triangle', 0.03, 880);
      this.noise(0.16, 0.03, 600);
    },
    bossIn() {
      this.ensure();
      this.beep(110, 0.18, 'sawtooth', 0.042, 70);
      this.beep(220, 0.22, 'triangle', 0.036, 140);
    },
    era() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.036, 523);
      this.beep(523, 0.1, 'triangle', 0.034, 784);
      this.beep(784, 0.16, 'sine', 0.038, 1046);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.14, 'triangle', 0.032, 1176);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.04, 659);
      this.beep(784, 0.12, 'triangle', 0.038, 1046);
      this.beep(1046, 0.22, 'sine', 0.044, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.038, 80);
      this.beep(110, 0.32, 'sine', 0.046, 42);
    },
    eShot() {
      this.ensure();
      this.beep(240, 0.05, 'square', 0.018, 90);
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
    while (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.nextLife += LIFE_EVERY;
      G.lives += 1;
      audio.extra();
      toast('额外生命', false, true);
      screenFlash(GOLD, 0.55);
      kick(3.2);
    }
    if (G.score >= G.nextLife) G.nextLife += LIFE_EVERY;
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.35;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      toast('连击 ×' + G.mult, false, true);
      popRing(G.ship.x, G.ship.y, GOLD, 16);
      if (comboEl) {
        comboTok += 1;
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function syncHud() {
    const spec = eraSpec();
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '时飞';
      else if (G.phase === 'boss') stageLabel.textContent = spec.bossName;
      else if (G.phase === 'warp') stageLabel.textContent = '跃迁';
      else stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.era >= 3);
      stageLabel.classList.toggle('boss', G.mode === 'play' && G.phase === 'boss');
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '时核' : '时飞';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (progBar && progWrap && progEm) {
      let p = 0;
      if (G.mode === 'play' && G.phase === 'boss') {
        p = G.bossMax > 0 ? G.bossHp / G.bossMax : 0;
        progEm.textContent = '头';
        progWrap.classList.add('boss');
        progWrap.classList.remove('hot');
      } else {
        p = G.quota > 0 ? G.kills / G.quota : 0;
        progEm.textContent = '击';
        progWrap.classList.remove('boss');
        progWrap.classList.toggle('hot', p >= 0.72);
      }
      progBar.style.transform = 'scaleX(' + clamp(p, 0, 1).toFixed(3) + ')';
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机即扣命', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 五纪打穿', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞机扣命', 'warn');
    else if (G.phase === 'boss') setHint('头目 · ' + spec.bossName, 'hot');
    else setHint('←↑↓→ 环飞 · 空格开火 · 击坠出头目', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TPLT';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const end = kind === 'win' || kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', end);
    if (ovEnd) ovEnd.classList.toggle('gone', !end);
    if (end && btnOvRetry) btnOvRetry.textContent = '再飞';
    if (end && btnOvModes) {
      if (kind === 'win' && G.kind === 'era') btnOvModes.textContent = '时核';
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

  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 0 : spec.g
      });
    }
    capArr(particles, 360);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 48);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 10 });
    capArr(rings, 36);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      vy: -56,
      t: 0,
      life: 0.72,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 16 : 13
    });
    capArr(floats, 28);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * 1600 - 800,
        y: Math.random() * 960 - 480,
        r: Math.random() < 0.16 ? 1.35 : 0.65,
        a: rand(0.22, 0.88),
        p: Math.random() * TAU,
        par: Math.random() < 0.35 ? 0.35 : 0.7,
        rgb: Math.random() < 0.22 ? ICE : Math.random() < 0.12 ? CYN : WHT
      });
    }
  }

  function seedClouds() {
    clouds.length = 0;
    for (let i = 0; i < 28; i++) {
      clouds.push({
        x: rand(-800, 800),
        y: rand(-480, 480),
        w: rand(46, 110),
        h: rand(16, 34),
        a: rand(0.08, 0.22),
        par: Math.random() < 0.4 ? 0.45 : 0.85
      });
    }
  }

  function wrapCam(v, cam, span) {
    let d = v - cam;
    d -= span * Math.round(d / span);
    return cam + d;
  }

  function rebaseIfNeeded() {
    const s = G.ship;
    if (hypot(s.x, s.y) < 18000) return;
    const dx = s.x;
    const dy = s.y;
    s.x = 0;
    s.y = 0;
    shiftAll(-dx, -dy);
  }

  function shiftAll(dx, dy) {
    function mv(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i].x += dx;
        arr[i].y += dy;
      }
    }
    mv(G.enemies);
    mv(G.shots);
    mv(G.bullets);
    mv(G.paras);
    mv(particles);
    mv(sparks);
    mv(rings);
    mv(floats);
    mv(ghosts);
    mv(clouds);
    mv(stars);
  }

  function clearField() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.paras.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
  }

  function craftRgb() {
    const c = eraSpec().craft;
    if (c === 'bi') return GOLD;
    if (c === 'ww') return ICE;
    if (c === 'heli') return MINT;
    if (c === 'jet') return CYN;
    return MAG;
  }

  function spawnAtEdge(bias) {
    const face = G.ship.ang;
    const spread = rand(-1.15, 1.15);
    const ang = face + (bias != null ? bias : spread);
    const dist = rand(360, 470);
    return {
      x: G.ship.x + Math.cos(ang) * dist,
      y: G.ship.y + Math.sin(ang) * dist,
      ang: ang + Math.PI
    };
  }

  function spawnEnemy(kind, x, y, ang) {
    const spec = eraSpec();
    const rgb = craftRgb();
    const dense = isDense();
    let hp = 1;
    let r = 12;
    let score = 80;
    let spd = spec.spd * (dense ? 1.12 : 1);
    if (kind === 'ace') {
      spd = spec.ace * (dense ? 1.1 : 1);
      r = 13;
      score = 150;
    } else if (kind === 'bomb') {
      spd = spec.spd * 0.72;
      hp = 3;
      r = 18;
      score = 200;
    } else if (kind === 'form') {
      score = 100;
      r = 11;
    } else if (kind === 'escort') {
      score = 120;
      spd = spec.ace * 0.9;
    }
    G.enemies.push({
      kind: kind,
      x: x,
      y: y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      ang: ang,
      spd: spd,
      hp: hp,
      r: r,
      score: score,
      t: rand(0, TAU),
      shotCd: rand(0.4, spec.shot),
      flash: 0,
      rgb: rgb,
      breakT: kind === 'form' ? 2.15 : 0,
      diveT: kind === 'ace' ? rand(1.1, 2.2) : 0,
      orbit: rand(150, 230),
      alive: true
    });
  }

  function spawnScout() {
    const p = spawnAtEdge();
    const roll = Math.random();
    const kind = roll < 0.16 ? 'bomb' : roll < 0.38 ? 'ace' : 'scout';
    spawnEnemy(kind, p.x, p.y, p.ang);
  }

  function spawnForm() {
    const p = spawnAtEdge(rand(-0.4, 0.4));
    const heading = p.ang;
    const offs = [[0, 0], [-30, -20], [30, -20], [-60, -40], [60, -40]];
    const ca = Math.cos(heading);
    const sa = Math.sin(heading);
    for (let i = 0; i < offs.length; i++) {
      const oxp = offs[i][0] * ca - offs[i][1] * sa;
      const oyp = offs[i][0] * sa + offs[i][1] * ca;
      spawnEnemy('form', p.x + oxp, p.y + oyp, heading);
    }
  }

  function spawnPara(x, y) {
    G.paras.push({
      x: x,
      y: y,
      vy: 42,
      vx: rand(-18, 18),
      t: 0,
      life: 7.5
    });
  }

  function spawnBoss() {
    const spec = eraSpec();
    const p = spawnAtEdge(0);
    const hp = bossHpOf(spec);
    G.enemies.push({
      kind: 'boss',
      form: spec.boss,
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      ang: p.ang,
      spd: 70,
      hp: hp,
      r: spec.boss === 'whale' ? 42 : spec.boss === 'core' ? 36 : 30,
      score: spec.score,
      t: 0,
      shotCd: 0.8,
      flash: 0,
      rgb: GOLD,
      alive: true,
      orbit: 210
    });
    G.bossOn = true;
    G.bossHp = hp;
    G.bossMax = hp;
    G.phase = 'boss';
    audio.bossIn();
    toast(spec.bossName + ' 入场', false, true);
    screenFlash(GOLD, 0.42);
    kick(3.6);
  }

  function enemyCap() {
    const n = (isDense() ? 10 : 6) + G.era;
    return G.phase === 'boss' ? (isDense() ? 3 : 0) : n;
  }

  function spawnGap() {
    const base = isDense() ? 0.7 : 1.06;
    return base * (1 - G.era * 0.07);
  }

  function livingEnemies() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind !== 'boss') n += 1;
    }
    return n;
  }

  function trySpawn(dt) {
    if (G.mode !== 'play' || G.phase === 'warp' || G.deadT > 0) return;
    if (G.ready > 0) return;
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    if (G.phase === 'hunt' && G.kills >= G.quota && !G.bossOn) {
      spawnBoss();
      G.spawnT = 1.2;
      return;
    }
    if (livingEnemies() >= enemyCap()) {
      G.spawnT = 0.18;
      return;
    }
    if (G.phase === 'boss') {
      if (isDense()) {
        const p = spawnAtEdge(rand(-0.8, 0.8));
        spawnEnemy('escort', p.x, p.y, p.ang);
      }
      G.spawnT = isDense() ? 2.4 : 9;
      return;
    }
    G.waveN += 1;
    if (G.waveN % 4 === 0) spawnForm();
    else spawnScout();
    G.spawnT = spawnGap() * rand(0.78, 1.18);
  }

  function flyVec() {
    if (analog.on && (analog.x || analog.y)) return analog;
    if (pointer.down && (pointer.ax || pointer.ay) && !analog.on) {
      return { x: pointer.ax, y: pointer.ay };
    }
    let x = 0;
    let y = 0;
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    if (keys.u) y -= 1;
    if (keys.d) y += 1;
    return { x: x, y: y };
  }

  function updatePlayer(dt) {
    const s = G.ship;
    if (G.mode === 'title') {
      s.ang += 0.42 * dt;
      s.x += Math.cos(s.ang) * 70 * dt;
      s.y += Math.sin(s.ang) * 70 * dt;
      return;
    }
    if (G.deadT > 0) return;
    const v = flyVec();
    if (v.x || v.y) {
      const want = Math.atan2(v.y, v.x);
      s.ang = turnToward(s.ang, want, TURN * dt);
      s.bank = lerp(s.bank, clamp(angNorm(want - s.ang) * 1.4, -0.55, 0.55), 1 - Math.exp(-dt * 10));
    } else {
      s.bank = lerp(s.bank, 0, 1 - Math.exp(-dt * 6));
    }
    const spd = flySpd() * (G.phase === 'warp' ? 1.35 : 1);
    s.x += Math.cos(s.ang) * spd * dt;
    s.y += Math.sin(s.ang) * spd * dt;
    if (!REDUCE && G.mode === 'play') {
      ghosts.push({ x: s.x, y: s.y, ang: s.ang, t: 0.16 });
      capArr(ghosts, 8);
      if (Math.random() < 0.55) {
        emit(1, {
          x: s.x - Math.cos(s.ang) * 12,
          y: s.y - Math.sin(s.ang) * 12,
          j: 2,
          vx0: -20, vx1: 20, vy0: -20, vy1: 20,
          r0: 1, r1: 2.1, life: 0.18, rgb: CYN, g: 0
        });
      }
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.phase === 'warp') return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= SHOT_MAX) return;
    G.fireCd = fireGap();
    G.muzzle = 0.06;
    const s = G.ship;
    const nx = Math.cos(s.ang);
    const ny = Math.sin(s.ang);
    G.shots.push({
      x: s.x + nx * 14,
      y: s.y + ny * 14,
      vx: nx * SHOT_V,
      vy: ny * SHOT_V,
      life: SHOT_LIFE,
      trail: []
    });
    audio.shoot();
    if (!REDUCE) {
      emit(4, {
        x: s.x + nx * 16, y: s.y + ny * 16, j: 3,
        vx0: nx * 40 - 30, vx1: nx * 90 + 30,
        vy0: ny * 40 - 30, vy1: ny * 90 + 30,
        r0: 1, r1: 2.2, life: 0.14, rgb: WHT, g: 0
      });
    }
  }

  function enemyFire(en, spread, n, spd) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const cap = isDense() ? 16 : 10;
    if (G.bullets.length >= cap) return;
    const dx = G.ship.x - en.x;
    const dy = G.ship.y - en.y;
    const base = Math.atan2(dy, dx);
    const count = n || 1;
    const sp = spd || (isDense() ? 176 : 148);
    for (let i = 0; i < count; i++) {
      if (G.bullets.length >= cap) break;
      const a = base + (count === 1 ? rand(-spread, spread) : (i - (count - 1) * 0.5) * spread);
      G.bullets.push({
        x: en.x,
        y: en.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 2.4,
        rgb: en.kind === 'boss' ? GOLD : MAG
      });
    }
    audio.eShot();
  }

  function steerEnemy(en, dt) {
    const spec = eraSpec();
    en.t += dt;
    if (en.flash > 0) en.flash -= dt;
    const dx = G.ship.x - en.x;
    const dy = G.ship.y - en.y;
    const dist = hypot(dx, dy) || 1;
    const toP = Math.atan2(dy, dx);

    if (en.kind === 'boss') {
      steerBoss(en, dt, toP, dist);
      return;
    }

    if (en.kind === 'form' && en.breakT > 0) {
      en.breakT -= dt;
      en.x += Math.cos(en.ang) * en.spd * dt;
      en.y += Math.sin(en.ang) * en.spd * dt;
    } else if (en.kind === 'ace') {
      en.diveT -= dt;
      if (en.diveT > 0) {
        const tang = toP + Math.PI * 0.5;
        const oxp = G.ship.x + Math.cos(tang) * en.orbit;
        const oyp = G.ship.y + Math.sin(tang) * en.orbit;
        const want = Math.atan2(oyp - en.y, oxp - en.x);
        en.ang = turnToward(en.ang, want, 3.4 * dt);
      } else {
        en.ang = turnToward(en.ang, toP, 5.2 * dt);
        if (en.diveT < -1.6) en.diveT = rand(0.9, 1.8);
      }
      en.x += Math.cos(en.ang) * en.spd * dt;
      en.y += Math.sin(en.ang) * en.spd * dt;
    } else if (en.kind === 'bomb') {
      en.ang = turnToward(en.ang, toP, 1.6 * dt);
      en.x += Math.cos(en.ang) * en.spd * dt;
      en.y += Math.sin(en.ang) * en.spd * dt;
    } else {
      const wob = Math.sin(en.t * 2.4) * 0.55;
      en.ang = turnToward(en.ang, toP + wob, 2.8 * dt);
      en.x += Math.cos(en.ang) * en.spd * dt;
      en.y += Math.sin(en.ang) * en.spd * dt;
    }

    if (dist > 760) {
      en.alive = false;
      return;
    }

    en.shotCd -= dt;
    if (en.shotCd <= 0 && dist < 340 && dist > 70 && G.deadT <= 0) {
      const facing = Math.abs(angNorm(en.ang - toP));
      if (facing < 0.85 || en.kind === 'bomb' || en.kind === 'escort') {
        enemyFire(en, en.kind === 'bomb' ? 0.18 : 0.22, en.kind === 'bomb' ? 2 : 1, spec.spd + 40);
        en.shotCd = spec.shot * (isDense() ? 0.72 : 1) * rand(0.85, 1.2);
      } else {
        en.shotCd = 0.2;
      }
    }
  }

  function steerBoss(en, dt, toP, dist) {
    en.shotCd -= dt;
    const dense = isDense();
    if (en.form === 'whale') {
      const oxp = G.ship.x + Math.cos(en.t * 0.55) * 220;
      const oyp = G.ship.y + Math.sin(en.t * 0.4) * 140;
      en.ang = turnToward(en.ang, Math.atan2(oyp - en.y, oxp - en.x), 1.5 * dt);
      en.x += Math.cos(en.ang) * 78 * dt;
      en.y += Math.sin(en.ang) * 78 * dt;
      if (en.shotCd <= 0) {
        enemyFire(en, 0.35, dense ? 3 : 2, 130);
        en.shotCd = dense ? 0.72 : 0.98;
      }
    } else if (en.form === 'fort') {
      en.x = lerp(en.x, G.ship.x + Math.sin(en.t * 0.9) * 240, 1 - Math.exp(-dt * 1.4));
      en.y = lerp(en.y, G.ship.y + Math.cos(en.t * 0.7) * 160, 1 - Math.exp(-dt * 1.4));
      en.ang = toP;
      if (en.shotCd <= 0) {
        enemyFire(en, 0.22, dense ? 3 : 2, 160);
        en.shotCd = dense ? 0.62 : 0.88;
      }
    } else if (en.form === 'nest') {
      const wantR = 190;
      const tx = G.ship.x + Math.cos(en.t * 0.8) * wantR;
      const ty = G.ship.y + Math.sin(en.t * 0.8) * wantR;
      en.x = lerp(en.x, tx, 1 - Math.exp(-dt * 1.8));
      en.y = lerp(en.y, ty, 1 - Math.exp(-dt * 1.8));
      en.ang = toP;
      if (en.shotCd <= 0) {
        const n = dense ? 8 : 6;
        const cap = isDense() ? 16 : 10;
        for (let i = 0; i < n && G.bullets.length < cap; i++) {
          const a = (i / n) * TAU + en.t;
          G.bullets.push({
            x: en.x, y: en.y,
            vx: Math.cos(a) * 150, vy: Math.sin(a) * 150,
            life: 2.2, rgb: MINT
          });
        }
        audio.eShot();
        en.shotCd = dense ? 1.05 : 1.4;
      }
    } else if (en.form === 'shark') {
      if (en.t % 2.4 < 1.25) {
        en.ang = turnToward(en.ang, toP, 6 * dt);
        en.x += Math.cos(en.ang) * 210 * dt;
        en.y += Math.sin(en.ang) * 210 * dt;
      } else {
        en.ang = turnToward(en.ang, toP + Math.PI, 4 * dt);
        en.x += Math.cos(en.ang) * 160 * dt;
        en.y += Math.sin(en.ang) * 160 * dt;
      }
      if (en.shotCd <= 0) {
        enemyFire(en, 0.16, dense ? 4 : 3, 210);
        en.shotCd = dense ? 0.55 : 0.78;
      }
    } else {
      const tx = G.ship.x + Math.cos(en.t * 1.1) * 200;
      const ty = G.ship.y + Math.sin(en.t * 0.85) * 160;
      en.x = lerp(en.x, tx, 1 - Math.exp(-dt * 1.6));
      en.y = lerp(en.y, ty, 1 - Math.exp(-dt * 1.6));
      en.ang = toP;
      if (en.shotCd <= 0) {
        enemyFire(en, 0.4, dense ? 5 : 4, 170);
        const cap = isDense() ? 16 : 10;
        if (G.bullets.length < cap) {
          const n = dense ? 8 : 6;
          for (let i = 0; i < n && G.bullets.length < cap; i++) {
            const a = (i / n) * TAU;
            G.bullets.push({
              x: en.x, y: en.y,
              vx: Math.cos(a) * 120, vy: Math.sin(a) * 120,
              life: 2.4, rgb: MAG
            });
          }
        }
        en.shotCd = dense ? 0.7 : 0.95;
      }
    }
    if (dist > 900) {
      en.x = G.ship.x + Math.cos(toP + Math.PI) * 280;
      en.y = G.ship.y + Math.sin(toP + Math.PI) * 280;
    }
  }

  function explodeAt(x, y, rgb, mag) {
    popSpark(x, y, rgb, 10 + mag * 8);
    popRing(x, y, rgb, 8 + mag * 4);
    emit(10 + mag * 8, {
      x: x, y: y, j: 6 + mag * 3,
      vx0: -220 - mag * 30, vx1: 220 + mag * 30,
      vy0: -220 - mag * 30, vy1: 220 + mag * 30,
      r0: 1.1, r1: 2.2 + mag, life: 0.36 + mag * 0.08, rgb: rgb, g: 0
    });
  }

  function killEnemy(en, scored) {
    if (!en.alive) return;
    en.alive = false;
    const boss = en.kind === 'boss';
    audio.boom(boss || en.kind === 'bomb');
    hitStop(boss ? 0.074 : en.kind === 'bomb' ? 0.058 : 0.046);
    kick(boss ? 6.4 : en.kind === 'bomb' ? 3.4 : 2.1);
    screenFlash(en.rgb, boss ? 0.55 : 0.28);
    explodeAt(en.x, en.y, en.rgb, boss ? 2.4 : en.kind === 'bomb' ? 1.4 : 1);
    if (scored && G.mode === 'play') {
      bumpCombo();
      const pts = en.score * G.mult;
      addScore(pts);
      popFloat(en.x, en.y - 10, '+' + pts, en.rgb, G.mult > 1 || boss);
      if (!boss && en.kind !== 'escort') {
        G.kills += 1;
        if (G.kills === G.quota) toast('击坠达标', false, true);
      }
      if (!boss && (en.kind === 'scout' || en.kind === 'form' || en.kind === 'ace') && Math.random() < 0.22) {
        spawnPara(en.x, en.y);
      }
      if (!boss && G.phase === 'hunt' && G.kills >= G.quota && !G.bossOn) {
        G.spawnT = Math.min(G.spawnT, 0.38);
      }
    }
    if (boss) {
      G.bossOn = false;
      G.bossHp = 0;
      addScore(specClearBonus());
      beginWarp();
    }
  }

  function specClearBonus() {
    return 600 * (G.era + 1);
  }

  function beginWarp() {
    G.phase = 'warp';
    G.warpT = 1.65;
    for (let i = 0; i < G.enemies.length; i++) {
      const en = G.enemies[i];
      if (en.alive && en.kind !== 'boss') explodeAt(en.x, en.y, en.rgb, 0.8);
      en.alive = false;
    }
    G.bullets.length = 0;
    G.enemies.length = 0;
    audio.warp();
    screenFlash(CYN, 0.7);
    kick(4.2);
    popRing(G.ship.x, G.ship.y, GOLD, 20);
    popRing(G.ship.x, G.ship.y, CYN, 8);
    toast(lastEra() ? '时环合拢' : '跃迁', false, true);
  }

  function enterEra(i, announce) {
    G.era = i;
    const spec = eraSpec();
    G.kills = 0;
    G.quota = quotaOf(spec);
    G.phase = 'hunt';
    G.bossOn = false;
    G.bossHp = 0;
    G.bossMax = bossHpOf(spec);
    G.spawnT = 0.55;
    G.waveN = 0;
    G.invuln = Math.max(G.invuln, 1.05);
    G.ready = 0.55;
    if (announce) {
      audio.era();
      toast(spec.name + ' · ' + spec.year, false, true);
    }
    syncHud();
  }

  function finishWarp() {
    if (lastEra()) {
      winRun();
      return;
    }
    enterEra(G.era + 1, true);
  }

  function hurtEnemy(en) {
    en.hp -= 1;
    en.flash = 0.08;
    audio.hit();
    hitStop(0.032);
    emit(5, {
      x: en.x, y: en.y, j: 5,
      vx0: -90, vx1: 90, vy0: -90, vy1: 90,
      r0: 1, r1: 2.2, life: 0.18, rgb: WHT, g: 0
    });
    if (en.kind === 'boss') {
      G.bossHp = en.hp;
      addScore(10);
    }
    if (en.hp <= 0) killEnemy(en, true);
  }

  function playerHit() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.phase === 'warp') return;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0.92;
    G.invuln = 1.65;
    audio.death();
    hitStop(0.07);
    kick(7.2);
    screenFlash(MAG, 0.62);
    explodeAt(G.ship.x, G.ship.y, MAG, 2.2);
    G.bullets.length = 0;
    if (G.lives <= 0) {
      G.why = 'lose';
      G.endT = 0.95;
    } else {
      toast('剩余 ' + G.lives + ' 命', true, false);
    }
    syncHud();
  }

  function grabPara(p) {
    bumpCombo();
    const pts = 500 * G.mult;
    addScore(pts);
    audio.para();
    popFloat(p.x, p.y, '+' + pts, GOLD, true);
    popRing(p.x, p.y, GOLD, 12);
    emit(12, {
      x: p.x, y: p.y, j: 6,
      vx0: -120, vx1: 120, vy0: -140, vy1: 40,
      r0: 1.2, r1: 2.8, life: 0.32, rgb: GOLD, g: 0
    });
    toast('救下伞员', false, true);
  }

  function collide() {
    if (G.mode !== 'play' || G.phase === 'warp') return;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const en = G.enemies[j];
        if (!en.alive) continue;
        if (hypot(s.x - en.x, s.y - en.y) < en.r + 4) {
          hurtEnemy(en);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    if (G.deadT <= 0) {
      for (let i = G.paras.length - 1; i >= 0; i--) {
        const p = G.paras[i];
        if (hypot(p.x - G.ship.x, p.y - G.ship.y) < 18) {
          grabPara(p);
          G.paras.splice(i, 1);
        }
      }
    }

    if (G.deadT > 0 || G.invuln > 0) return;

    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      if (hypot(b.x - G.ship.x, b.y - G.ship.y) < SHIP_R + 3.5) {
        G.bullets.splice(i, 1);
        playerHit();
        return;
      }
    }
    for (let j = 0; j < G.enemies.length; j++) {
      const en = G.enemies[j];
      if (!en.alive) continue;
      if (hypot(en.x - G.ship.x, en.y - G.ship.y) < en.r + SHIP_R - 2) {
        playerHit();
        if (en.kind !== 'boss') killEnemy(en, false);
        return;
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!REDUCE) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 5) s.trail.shift();
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || hypot(s.x - G.ship.x, s.y - G.ship.y) > 520) {
        G.shots.splice(i, 1);
      }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || hypot(b.x - G.ship.x, b.y - G.ship.y) > 620) {
        G.bullets.splice(i, 1);
      }
    }
  }

  function updateParas(dt) {
    for (let i = G.paras.length - 1; i >= 0; i--) {
      const p = G.paras[i];
      p.t += dt;
      p.y += p.vy * dt;
      p.x += p.vx * dt + Math.sin(p.t * 3.2) * 18 * dt;
      p.life -= dt;
      if (p.life <= 0 || hypot(p.x - G.ship.x, p.y - G.ship.y) > 640) {
        G.paras.splice(i, 1);
      }
    }
  }

  function pruneEnemies() {
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      if (!G.enemies[i].alive) G.enemies.splice(i, 1);
    }
  }

  function titleDemo(dt) {
    if (G.enemies.length < 6 && Math.random() < 0.04) {
      const p = spawnAtEdge(rand(-Math.PI, Math.PI));
      spawnEnemy('scout', p.x, p.y, p.ang);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const en = G.enemies[i];
      en.t += dt;
      en.x += Math.cos(en.ang) * en.spd * 0.55 * dt;
      en.y += Math.sin(en.ang) * en.spd * 0.55 * dt;
      if (hypot(en.x - G.ship.x, en.y - G.ship.y) > 700) en.alive = false;
    }
    pruneEnemies();
  }

  function winRun() {
    const bonus = (isDense() ? 10000 : 8000) + G.lives * 400;
    const record = G.score + bonus > G.best;
    addScore(bonus);
    G.mode = 'win';
    G.phase = 'hunt';
    G.endT = 0;
    audio.win();
    screenFlash(GOLD, 0.7);
    showOverlay(
      'win',
      isDense() ? '时核通关' : '时环打穿',
      '五纪飞完。' + (isDense() ? '密核航线清干净。' : '从飞鸢飞到星核。') + ' 本局 ' + G.score + (record ? ' · 新纪录' : '')
    );
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    G.endT = 0;
    audio.lose();
    showOverlay(
      'lose',
      '机坠了',
      (G.score >= G.best && G.score > 0 ? '新纪录 · ' : '') + '撞机耗尽。本局 ' + G.score + ' · R 再飞'
    );
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'core' ? 'core' : 'era';
    G.t = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.ship.x = 0;
    G.ship.y = 0;
    G.ship.ang = -Math.PI / 2;
    G.ship.bank = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.paras.length = 0;
    G.enemies.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
    G.fireCd = 0;
    G.muzzle = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.32;
    G.flashRgb = CYN;
    G.punch = 1;
    G.why = '';
    G.endT = 0;
    G.warpT = 0;
    if (scoreEl) scoreEl.textContent = '0';
    hideOverlay();
    audio.start();
    enterEra(0, false);
    toast(isDense() ? '时核 · 更密更狠' : '时飞 · 飞鸢出发', false, true);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'era';
    G.era = 0;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.kills = 0;
    G.quota = ERAS[0].quota;
    G.phase = 'hunt';
    G.bossOn = false;
    G.deadT = 0;
    G.invuln = 0;
    G.endT = 0;
    G.warpT = 0;
    G.ship.x = 0;
    G.ship.y = 0;
    G.ship.ang = -Math.PI / 2;
    clearField();
    showOverlay('title', '时飞', '环飞穿时。方向键自由飞，空格朝机头开火。击坠够数出头目，打爆跃迁下一纪。撞机扣命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('era');
    else startGame(G.kind || 'era');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('era');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.1);
      q.vy *= Math.exp(-dt * 1.1);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t -= dt;
      if (ghosts[i].t <= 0) ghosts.splice(i, 1);
    }
  }

  function playSim(dt) {
    if (G.ready > 0) G.ready -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (keys.fire || (pointer.down && !analog.on)) fire();

    if (G.endT > 0) {
      G.endT -= dt;
      updatePlayer(dt);
      updateShots(dt);
      updateParas(dt);
      if (G.endT <= 0) {
        if (G.why === 'lose') loseRun();
        else if (G.why === 'win') winRun();
      }
      return;
    }

    if (G.phase === 'warp') {
      G.warpT -= dt;
      updatePlayer(dt);
      if (G.warpT <= 0) finishWarp();
      rebaseIfNeeded();
      return;
    }

    updatePlayer(dt);
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) steerEnemy(G.enemies[i], dt);
    }
    pruneEnemies();
    updateShots(dt);
    updateParas(dt);
    trySpawn(dt);
    collide();
    rebaseIfNeeded();

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0 && G.lives > 0 && G.mode === 'play') {
        G.invuln = 1.65;
      }
    } else if (G.invuln > 0) {
      G.invuln -= dt;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      updatePlayer(dt);
      titleDemo(dt);
      updateFx(dt);
      rebaseIfNeeded();
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateShots(dt);
      updateFx(dt);
      return;
    }

    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function drawBg() {
    const spec = eraSpec();
    const g = ctx.createLinearGradient(sx(G.ship.x), sy(G.ship.y - CY), sx(G.ship.x), sy(G.ship.y + CY));
    g.addColorStop(0, spec.sky0);
    g.addColorStop(1, spec.sky1);
    ctx.fillStyle = g;
    ctx.fillRect(sx(G.ship.x - CX), sy(G.ship.y - CY), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(G.ship.x), sy(G.ship.y), 20 * scale, sx(G.ship.x), sy(G.ship.y), 420 * scale);
    vg.addColorStop(0, rgba(spec.mist, 0.1));
    vg.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(G.ship.x - CX), sy(G.ship.y - CY), VW * scale, VH * scale);

    const starA = G.era >= 3 ? 1 : 0.45 + G.era * 0.12;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const x = wrapCam(s.x + G.ship.x * (1 - s.par), G.ship.x, 1600);
      const y = wrapCam(s.y + G.ship.y * (1 - s.par), G.ship.y, 960);
      const a = (REDUCE ? s.a : s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)))) * starA;
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const x = wrapCam(c.x + G.ship.x * (1 - c.par), G.ship.x, 1600);
      const y = wrapCam(c.y + G.ship.y * (1 - c.par), G.ship.y, 960);
      ctx.fillStyle = rgba(spec.cloud, c.a);
      ctx.beginPath();
      ctx.ellipse(sx(x), sy(y), c.w * scale, c.h * scale, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx(x + c.w * 0.35), sy(y - c.h * 0.2), c.w * 0.55 * scale, c.h * 0.7 * scale, 0, 0, TAU);
      ctx.fill();
    }

    if (G.phase === 'warp' || G.mode === 'title') {
      ctx.save();
      ctx.strokeStyle = rgba(CYN, G.phase === 'warp' ? 0.45 : 0.12);
      ctx.lineWidth = 1.2 * scale;
      ctx.setLineDash([6 * scale, 5 * scale]);
      const wr = 40 + (1 - Math.max(0, G.warpT) / 1.65) * 220;
      ctx.beginPath();
      ctx.arc(sx(G.ship.x), sy(G.ship.y), (G.phase === 'warp' ? wr : 90 + Math.sin(G.t) * 8) * scale, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx(G.ship.x), sy(G.ship.y), (G.phase === 'warp' ? wr * 0.62 : 54) * scale, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function strokePoly(pts, rgb, glow, lw) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0] * scale;
      const py = pts[i][1] * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (glow) {
      ctx.strokeStyle = rgba(rgb, 0.2);
      ctx.lineWidth = (lw || 1.4) * 3.2 * scale;
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(rgb, 1);
    ctx.lineWidth = (lw || 1.4) * scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawCraft(en) {
    const type = en.kind === 'boss' ? en.form : eraSpec().craft;
    const rgb = en.flash > 0 ? WHT : en.rgb;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.rotate(en.ang);
    const k = (en.r / 12);
    ctx.scale(k, k);
    if (type === 'bi' || type === 'whale') {
      if (type === 'whale') {
        ctx.scale(1.12, 0.72);
        ctx.beginPath();
        ctx.ellipse(0, 0, 18 * scale, 7 * scale, 0, 0, TAU);
        ctx.strokeStyle = rgba(rgb, 0.22);
        ctx.lineWidth = 5 * scale;
        ctx.stroke();
        ctx.strokeStyle = rgba(rgb, 1);
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10 * scale, 0);
        ctx.lineTo(16 * scale, 4 * scale);
        ctx.lineTo(16 * scale, -4 * scale);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-4 * scale, 0);
        ctx.lineTo(6 * scale, 0);
        ctx.stroke();
      } else {
        strokePoly([[10, 0], [-8, 3], [-8, -3]], rgb, true, 1.3);
        ctx.beginPath();
        ctx.moveTo(-2 * scale, -8 * scale);
        ctx.lineTo(4 * scale, -8 * scale);
        ctx.moveTo(-2 * scale, 8 * scale);
        ctx.lineTo(4 * scale, 8 * scale);
        ctx.moveTo(-2 * scale, -5 * scale);
        ctx.lineTo(4 * scale, -5 * scale);
        ctx.moveTo(-2 * scale, 5 * scale);
        ctx.lineTo(4 * scale, 5 * scale);
        ctx.strokeStyle = rgba(rgb, 1);
        ctx.lineWidth = 1.3 * scale;
        ctx.stroke();
        const spin = Math.cos(G.t * 28);
        ctx.beginPath();
        ctx.moveTo(10 * scale, -6 * scale * spin);
        ctx.lineTo(10 * scale, 6 * scale * spin);
        ctx.stroke();
      }
    } else if (type === 'ww' || type === 'fort') {
      if (type === 'fort') {
        strokePoly([[16, 0], [4, 8], [-16, 6], [-16, -6], [4, -8]], rgb, true, 1.5);
        ctx.beginPath();
        ctx.moveTo(-4 * scale, -10 * scale);
        ctx.lineTo(8 * scale, -10 * scale);
        ctx.moveTo(-4 * scale, 10 * scale);
        ctx.lineTo(8 * scale, 10 * scale);
        ctx.strokeStyle = rgba(rgb, 1);
        ctx.lineWidth = 1.4 * scale;
        ctx.stroke();
      } else {
        strokePoly([[12, 0], [-8, 4], [-10, 0], [-8, -4]], rgb, true, 1.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 5 * scale, 9 * scale, 0, 0, TAU);
        ctx.strokeStyle = rgba(rgb, 1);
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();
      }
    } else if (type === 'heli' || type === 'nest') {
      strokePoly([[8, 0], [2, 5], [-10, 3], [-12, 0], [-10, -3], [2, -5]], rgb, true, 1.3);
      ctx.beginPath();
      ctx.ellipse(2 * scale, 0, 11 * scale, 11 * scale, 0, 0, TAU);
      ctx.strokeStyle = rgba(rgb, 0.45 + 0.25 * Math.sin(G.t * 40));
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-12 * scale, 0);
      ctx.lineTo(-20 * scale, 0);
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.stroke();
    } else if (type === 'jet' || type === 'shark') {
      strokePoly([[14, 0], [-4, 7], [-10, 2], [-8, 0], [-10, -2], [-4, -7]], rgb, true, 1.35);
      if (type === 'shark') {
        ctx.beginPath();
        ctx.moveTo(-2 * scale, -11 * scale);
        ctx.lineTo(6 * scale, -4 * scale);
        ctx.moveTo(-2 * scale, 11 * scale);
        ctx.lineTo(6 * scale, 4 * scale);
        ctx.strokeStyle = rgba(rgb, 1);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, 12 * scale, 5 * scale, 0, 0, TAU);
      ctx.strokeStyle = rgba(rgb, 0.22);
      ctx.lineWidth = 4.4 * scale;
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -2 * scale, 6 * scale, 4.5 * scale, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    const s = G.ship;
    if (!REDUCE) {
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        ctx.save();
        ctx.globalAlpha = g.t * 1.6;
        ctx.translate(sx(g.x), sy(g.y));
        ctx.rotate(g.ang);
        ctx.beginPath();
        ctx.moveTo(13 * scale, 0);
        ctx.lineTo(-9 * scale, 8 * scale);
        ctx.lineTo(-5 * scale, 0);
        ctx.lineTo(-9 * scale, -8 * scale);
        ctx.closePath();
        ctx.strokeStyle = rgba(CYN, 0.45);
        ctx.lineWidth = 1.1 * scale;
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(sx(s.x), sy(s.y));
    ctx.rotate(s.ang);
    ctx.beginPath();
    ctx.moveTo(14 * scale, 0);
    ctx.lineTo(-9 * scale, 8.5 * scale);
    ctx.lineTo(-5 * scale, 0);
    ctx.lineTo(-9 * scale, -8.5 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(WHT, G.mode === 'title' ? 0.4 : 1);
    ctx.lineWidth = 1.7 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2 * scale, 0);
    ctx.lineTo(-8 * scale, 0);
    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    const flick = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(G.t * 42));
    ctx.beginPath();
    ctx.moveTo(-8 * scale, -3.4 * scale);
    ctx.lineTo((-16 - 6 * flick) * scale, 0);
    ctx.lineTo(-8 * scale, 3.4 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.85 * flick);
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();
    if (G.muzzle > 0) {
      ctx.beginPath();
      ctx.moveTo(14 * scale, 0);
      ctx.lineTo(26 * scale, 0);
      ctx.strokeStyle = rgba(WHT, G.muzzle * 12);
      ctx.lineWidth = 2.2 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const spd = hypot(s.vx, s.vy) || 1;
      const dx = s.vx / spd;
      const dy = s.vy / spd;
      if (s.trail && !REDUCE) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx.strokeStyle = rgba(CYN, 0.08 + t * 0.08);
          ctx.lineWidth = (1 + t * 0.12) * scale;
          ctx.beginPath();
          ctx.moveTo(sx(p.x - dx * 3), sy(p.y - dy * 3));
          ctx.lineTo(sx(p.x + dx * 3), sy(p.y + dy * 3));
          ctx.stroke();
        }
      }
      ctx.strokeStyle = rgba(WHT, 0.95);
      ctx.lineWidth = 1.9 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(s.x - dx * 6), sy(s.y - dy * 6));
      ctx.lineTo(sx(s.x + dx * 6), sy(s.y + dy * 6));
      ctx.stroke();
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      ctx.fillStyle = rgba(b.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), 2.6 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParas() {
    for (let i = 0; i < G.paras.length; i++) {
      const p = G.paras[i];
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 1.3 * scale;
      ctx.beginPath();
      ctx.arc(0, -6 * scale, 7 * scale, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6 * scale, -6 * scale);
      ctx.lineTo(0, 2 * scale);
      ctx.lineTo(6 * scale, -6 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 4 * scale, 2.4 * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 0.65 * (1 - k));
      ctx.lineWidth = (2.6 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * 0.35 + k * s.rad) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 0.5 * (1 - k));
      ctx.lineWidth = (2.1 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 30) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fillRect(sx(G.ship.x - CX), sy(G.ship.y - CY), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#02060e';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + CX * scale;
      const cy = oy + CY * scale;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawParas();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawCraft(G.enemies[i]);
    }
    drawShots();
    drawShip();
    drawParticles();
    drawFloats();
    drawFlash();
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function canvasToPlay(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function setAnalogFromStick(e) {
    if (!stickEl) return;
    const rect = stickEl.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    let dx = (e.clientX - cx) / (rect.width * 0.42);
    let dy = (e.clientY - cy) / (rect.height * 0.42);
    const m = hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    analog.x = dx;
    analog.y = dy;
    analog.on = m > 0.12;
    if (knobEl) {
      knobEl.style.transform = 'translate(' + (dx * 28) + 'px,' + (dy * 28) + 'px)';
    }
    if (stickEl) stickEl.classList.toggle('on', analog.on);
  }

  function clearAnalog() {
    analog.x = 0;
    analog.y = 0;
    analog.on = false;
    if (knobEl) knobEl.style.transform = '';
    if (stickEl) stickEl.classList.remove('on');
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    const left = code === 'KeyA' || code === 'ArrowLeft';
    const right = code === 'KeyD' || code === 'ArrowRight';
    const up = code === 'KeyW' || code === 'ArrowUp';
    const dn = code === 'KeyS' || code === 'ArrowDown';
    const space = code === 'Space' || k === ' ';
    if (down && (left || right || up || dn || space || k === 'Enter')) e.preventDefault();

    if (left) keys.l = down;
    if (right) keys.r = down;
    if (up) keys.u = down;
    if (dn) keys.d = down;
    if (space) keys.fire = down && G.mode === 'play' && !overlayOpen();

    if (!down) return;

    if (code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR') {
      restart();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') fire();
    }
    if ((k === '1' || code === 'Digit1') && overlayOpen() && G.mode === 'title') {
      startGame('era');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('core');
    }
  }

  function holdPad(el, press, release) {
    if (!el) return;
    let held = false;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      held = true;
      el.classList.add('on');
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      press();
    });
    function up() {
      if (!held) return;
      held = false;
      el.classList.remove('on');
      if (release) release();
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

  seedStars();
  seedClouds();
  loadBest();
  initMute();
  goTitle();
  resize();

  holdPad(padFire, function () { keys.fire = true; fire(); }, function () { keys.fire = false; });

  if (stickEl) {
    stickEl.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      if (stickEl.setPointerCapture) {
        try { stickEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      setAnalogFromStick(e);
    });
    stickEl.addEventListener('pointermove', function (e) {
      if (!analog.on && !(e.buttons & 1) && e.pointerType !== 'touch') return;
      if (stickEl.hasPointerCapture && !stickEl.hasPointerCapture(e.pointerId) && e.pointerType !== 'touch') return;
      setAnalogFromStick(e);
    });
    function stickUp() { clearAnalog(); }
    stickEl.addEventListener('pointerup', stickUp);
    stickEl.addEventListener('pointercancel', stickUp);
    stickEl.addEventListener('lostpointercapture', stickUp);
  }

  if (btnEra) {
    btnEra.addEventListener('click', function () {
      audio.ensure();
      startGame('era');
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
      startGame(G.kind || 'era');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && G.kind === 'era') startGame('core');
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

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.button != null && e.button !== 0) return;
      if (e.pointerType === 'touch' && padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      if (overlayOpen()) {
        if (e.pointerType !== 'touch') primaryAction();
        return;
      }
      pointer.down = true;
      pointer.id = e.pointerId;
      const p = canvasToPlay(e);
      pointer.ax = p.x - CX;
      pointer.ay = p.y - CY;
      const m = hypot(pointer.ax, pointer.ay) || 1;
      pointer.ax /= m;
      pointer.ay /= m;
      if (G.mode === 'play') {
        keys.fire = true;
        fire();
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || pointer.id !== e.pointerId) return;
      const p = canvasToPlay(e);
      pointer.ax = p.x - CX;
      pointer.ay = p.y - CY;
      const m = hypot(pointer.ax, pointer.ay) || 1;
      pointer.ax /= m;
      pointer.ay /= m;
    });
    function ptrUp(e) {
      if (e && pointer.id != null && e.pointerId !== pointer.id) return;
      pointer.down = false;
      pointer.id = null;
      pointer.ax = 0;
      pointer.ay = 0;
      keys.fire = false;
    }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', ptrUp);
    canvas.addEventListener('lostpointercapture', ptrUp);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
      keys.fire = false;
      pointer.down = false;
      clearAnalog();
    }
  });

  requestAnimationFrame(frame);
})();
