'use strict';

(function () {
  const VW = 640;
  const VH = 480;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const PIPE_Y = 118;
  const RABBIT_Y = 198;
  const DUCK_Y = 278;
  const GUN_Y = 424;
  const COUNTER = 400;
  const BEST_KEY = 'playbox-carnival-best';
  const MUTE_KEY = 'playbox-carnival-mute';
  const OPS = '← → / A D 瞄准 · 空格射击 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 106, 34];
  const HOT2 = [255, 160, 74];
  const WHT = [246, 243, 255];
  const REED = [46, 207, 106];
  const CREAM = [242, 215, 176];
  const PINK = [255, 168, 196];
  const CONF = [GOLD, MAG, CYN, HOT, HOT2, REED, WHT, PINK];

  const WEDGE = [
    { v: 50, kind: 'pts', rgb: HOT },
    { v: 100, kind: 'pts', rgb: CYN },
    { v: 200, kind: 'pts', rgb: MAG },
    { v: 500, kind: 'pts', rgb: GOLD },
    { v: 6, kind: 'ammo', rgb: REED },
    { v: 100, kind: 'pts', rgb: CYN },
    { v: 200, kind: 'pts', rgb: HOT2 },
    { v: 0, kind: 'empty', rgb: [90, 70, 110] }
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
  const btnGallery = document.getElementById('btn-gallery');
  const btnRapid = document.getElementById('btn-rapid');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnFire = document.getElementById('btn-fire');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const ammoLabel = document.getElementById('ammo-label');
  const missLabel = document.getElementById('miss-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

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

  const keys = { l: false, r: false, fire: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const bullets = [];
  const targets = [];
  const lights = [];

  const G = {
    mode: 'title',
    kind: 'gallery',
    phase: 'play',
    phaseT: 0,
    t: 0,
    clock: 0,
    wave: 1,
    score: 0,
    best: 0,
    bestG: 0,
    bestR: 0,
    combo: 0,
    comboPeak: 0,
    mult: 1,
    ammo: 40,
    miss: 0,
    missMax: 8,
    rows: { duck: 0, rabbit: 0, pipe: 0 },
    gun: { x: VW * 0.5, recoil: 0, flash: 0, kick: 0 },
    cool: 0,
    wheel: { ang: 0, spin: 2.6, lockT: 0, cool: 0, alive: true },
    box: { x: 548, y: 54, r: 18, alive: true, spin: 0, hitT: 0 },
    owl: null,
    tuneT: 0,
    mutedTune: false,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: WHT,
    punch: 1,
    toastT: 0,
    overWhy: ''
  };

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(ax, ay) {
    return Math.sqrt(ax * ax + ay * ay);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function sx(x) { return ox + x * scale; }
  function sy(y) { return oy + y * scale; }
  function isRapid() { return G.kind === 'rapid'; }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function comboMult(c) {
    return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 2));
  }
  function modeBest() {
    return isRapid() ? G.bestR : G.bestG;
  }
  function startAmmo() {
    return isRapid() ? 24 : 40;
  }
  function rowAmmo() {
    return isRapid() ? 5 : 8;
  }
  function missCap() {
    return isRapid() ? 6 : 8;
  }
  function fireCool() {
    return isRapid() ? 0.1 : 0.2;
  }
  function gunSpd() {
    return isRapid() ? 380 : 300;
  }
  function spdMul() {
    return (isRapid() ? 1.42 : 1) * (1 + (G.wave - 1) * 0.085);
  }
  function rowCounts(wave) {
    const w = Math.min(wave, 8);
    return {
      ducks: 7 + Math.min(3, w - 1),
      rabbits: 5 + Math.min(3, w - 1),
      pipes: 8,
      yellow: 2 + Math.min(4, w - 1),
      owls: 1 + (w >= 3 ? 1 : 0) + (w >= 6 ? 1 : 0)
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          try { this.ctx.resume(); } catch (err) { /* ignore */ }
        }
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.42;
        this.master.connect(this.ctx.destination);
      } catch (err) {
        this.ctx = null;
        this.master = null;
      }
    },
    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.42;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
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
    noise(dur, vol, hp, delay) {
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
      const t = this.ctx.currentTime + (delay || 0);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    shot() {
      this.ensure();
      this.noise(0.07, 0.13, 320);
      this.beep(140, 0.08, 'sine', 0.07, 46);
      this.beep(78, 0.11, 'triangle', 0.045, 34);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.85, Math.max(0, combo - 1) * 0.09);
      this.noise(0.045, 0.05, 1400);
      this.beep(640 * lift, 0.07, 'square', 0.055, 980 * lift);
      this.beep(1180 * lift, 0.1, 'triangle', 0.035, 1680 * lift);
    },
    bull() {
      this.ensure();
      this.noise(0.06, 0.06, 1800);
      this.beep(880, 0.08, 'square', 0.06, 1320);
      this.beep(1320, 0.14, 'sine', 0.045, 1760);
      this.beep(1760, 0.1, 'triangle', 0.03, 2200, 0.05);
    },
    miss() {
      this.ensure();
      this.noise(0.04, 0.028, 800);
      this.beep(148, 0.06, 'square', 0.026);
    },
    empty() {
      this.ensure();
      this.beep(90, 0.05, 'square', 0.03);
      this.beep(64, 0.07, 'triangle', 0.02);
    },
    squawk() {
      this.ensure();
      this.noise(0.14, 0.05, 480);
      this.beep(740, 0.09, 'sawtooth', 0.085, 220);
      this.beep(520, 0.16, 'square', 0.06, 140, 0.07);
      this.beep(980, 0.05, 'triangle', 0.03, 420, 0.02);
    },
    hop() {
      this.ensure();
      this.beep(620, 0.05, 'square', 0.035, 880);
      this.beep(440, 0.07, 'triangle', 0.025, 220, 0.04);
    },
    glass() {
      this.ensure();
      this.beep(1480, 0.06, 'sine', 0.04, 2100);
      this.beep(980, 0.1, 'triangle', 0.03, 420);
      this.noise(0.05, 0.03, 2200);
    },
    hoot() {
      this.ensure();
      this.beep(280, 0.16, 'sine', 0.07, 210);
      this.beep(210, 0.22, 'triangle', 0.05, 140, 0.12);
      this.beep(420, 0.08, 'sine', 0.03, 360, 0.04);
    },
    wheel() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.04);
      this.beep(1320, 0.12, 'sine', 0.045, 1760, 0.05);
    },
    tick() {
      this.ensure();
      this.beep(640, 0.03, 'square', 0.012);
    },
    ammo() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046, 0.06);
    },
    row() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.045, 523);
      this.beep(523, 0.09, 'sine', 0.04, 659, 0.07);
      this.beep(784, 0.16, 'triangle', 0.05, 1046, 0.14);
    },
    combo(n) {
      this.ensure();
      this.beep(392 + n * 40, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.032, 1176);
    },
    tune() {
      this.ensure();
      const notes = [392, 494, 587, 784, 659, 523, 392];
      for (let i = 0; i < notes.length; i++) {
        this.beep(notes[i], 0.11, 'triangle', 0.028, notes[i] * 1.01, i * 0.11);
      }
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(494, 0.12, 'triangle', 0.04, 880, 0.08);
    },
    win() {
      this.ensure();
      this.beep(523, 0.09, 'sine', 0.05, 659);
      this.beep(659, 0.09, 'sine', 0.045, 784, 0.08);
      this.beep(784, 0.12, 'triangle', 0.05, 1046, 0.16);
      this.beep(1046, 0.22, 'sine', 0.055, 1318, 0.26);
    },
    lose() {
      this.ensure();
      this.beep(330, 0.12, 'sawtooth', 0.05, 196);
      this.beep(196, 0.28, 'triangle', 0.05, 90, 0.1);
      this.beep(140, 0.2, 'square', 0.03, 70, 0.18);
    }
  };

  function loadBest() {
    G.bestG = 0;
    G.bestR = 0;
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestG = (o.g | 0) || 0;
        G.bestR = (o.r | 0) || 0;
      } else {
        G.bestG = parseInt(raw, 10) || 0;
      }
    } catch (err) { /* ignore */ }
  }

  function saveBest() {
    if (isRapid()) {
      if (G.score > G.bestR) G.bestR = G.score;
    } else if (G.score > G.bestG) G.bestG = G.score;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ g: G.bestG, r: G.bestR }));
    } catch (err) { /* ignore */ }
  }

  function toast(text, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const id = toastTok;
    toastEl.textContent = text;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = gold ? 1.4 : 1;
    setTimeout(function () {
      if (id === toastTok && G.toastT <= 0) toastEl.classList.add('hidden');
    }, 1700);
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function bumpScore(n) {
    if (!scoreAdd) return;
    addTok += 1;
    const id = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    setTimeout(function () {
      if (id === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function bumpCombo() {
    if (!comboBox) return;
    comboTok += 1;
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
    const id = comboTok;
    setTimeout(function () {
      if (id === comboTok) comboBox.classList.remove('hot');
    }, 360);
  }

  function syncPips() {
    if (!pipsEl) return;
    const names = ['duck', 'rabbit', 'pipe'];
    while (pips.length < 3) {
      const d = document.createElement('i');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < 3; i++) {
      const left = countKind(names[i]);
      pips[i].className = 'pip' + (left <= 0 ? ' gone' : G.mode === 'play' ? ' on' : '');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(modeBest());
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '嘉年';
      else stageLabel.textContent = '第 ' + G.wave + ' 摊';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 4);
    }
    if (tagLabel) {
      tagLabel.textContent = isRapid() ? '连射' : '靶场';
      tagLabel.classList.toggle('warn', G.mode === 'lose');
      tagLabel.classList.toggle('hot', G.combo >= 4);
    }
    if (ammoLabel) {
      ammoLabel.textContent = '弹 ' + G.ammo;
      ammoLabel.classList.toggle('warn', G.mode === 'play' && G.ammo <= 8);
    }
    if (missLabel) {
      missLabel.textContent = '空 ' + G.miss + '/' + G.missMax;
      missLabel.classList.toggle('warn', G.mode === 'play' && G.miss >= G.missMax - 2);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 弹尽或连空即负', 'warn');
    else if (G.mode === 'win') setHint('通关 · R 再来一局', 'hot');
    else if (G.combo >= 5) setHint('连中 ×' + G.mult + ' · 别断', 'hot');
    else if (G.ammo <= 6) setHint('子弹见底 · 瞄准再打', 'warn');
    else if (G.miss >= G.missMax - 2) setHint('再空就收摊', 'warn');
    else setHint(isRapid() ? '按住空格连射 · 清行补弹 · R 重开' : '← → 瞄准 · 空格开枪 · 清行补弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'MISS' : kind === 'win' ? 'CLEAR' : 'FAIR';
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

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl || G.mode === 'title') return;
    kickTok += 1;
    const name = cls || (mag >= 5.5 ? 'die' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('win');
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
        g: spec.g == null ? 420 : spec.g,
        kind: spec.kind || 'dot',
        rot: rand(0, TAU),
        spin: rand(-8, 8)
      });
    }
    capArr(particles, 380);
  }

  function confetti(x, y, n) {
    for (let i = 0; i < n; i++) {
      emit(1, {
        x: x, y: y, j: 10,
        vx0: -220, vx1: 220, vy0: -280, vy1: -40,
        r0: 2.2, r1: 4.6, life: 0.85,
        rgb: CONF[i % CONF.length], g: 520, kind: 'conf'
      });
    }
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 18 });
    capArr(sparks, 24);
  }

  function popRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb || CYN });
    capArr(rings, 16);
  }

  function popFloat(x, y, text, rgb, big) {
    floats.push({
      x: x,
      y: y,
      t: 0,
      life: big ? 1.05 : 0.8,
      text: text,
      rgb: rgb || GOLD,
      big: !!big
    });
    capArr(floats, 20);
  }

  function addScore(n, x, y, big) {
    if (n <= 0) return;
    G.score += n;
    saveBest();
    bumpScore(n);
    if (x != null) popFloat(x, y - 16, '+' + n, n >= 400 ? GOLD : HOT2, big);
    syncHud();
  }

  function addAmmo(n, x, y) {
    if (n <= 0) return;
    G.ammo += n;
    popFloat(x == null ? G.gun.x : x, y == null ? GUN_Y - 40 : y, '+' + n + '弹', REED, true);
    audio.ammo();
    syncHud();
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    bullets.length = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.stop = 0;
  }

  function seedWorld() {
    lights.length = 0;
    for (let i = 0; i < 14; i++) {
      lights.push({
        x: 22 + i * ((VW - 44) / 13),
        y: 18,
        ph: i * 0.45,
        rgb: CONF[i % 5]
      });
    }
  }

  function makeDuck(x, yellow, demo) {
    const spd = (34 + G.wave * 4) * (demo ? 0.7 : 1) * spdMul();
    return {
      kind: 'duck',
      x: x,
      y: DUCK_Y,
      homeY: DUCK_Y,
      vx: spd * (Math.random() < 0.5 ? 1 : -1),
      vy: 0,
      r: yellow ? 17 : 16,
      state: 'walk',
      flap: rand(0, 8),
      face: 1,
      rot: 0,
      hitT: 0,
      yellow: !!yellow,
      flyIn: yellow ? 3.2 + (x / VW) * 3.6 + rand(0, 1.4) : 99,
      value: yellow ? 200 : 100,
      rgb: yellow ? GOLD : CREAM,
      demo: !!demo
    };
  }

  function makeRabbit(x, demo) {
    const spd = (48 + G.wave * 5) * (demo ? 0.7 : 1) * spdMul();
    return {
      kind: 'rabbit',
      x: x,
      y: RABBIT_Y,
      homeY: RABBIT_Y,
      vx: spd * (Math.random() < 0.5 ? 1 : -1),
      vy: 0,
      r: 15,
      state: 'walk',
      flap: rand(0, 8),
      hop: rand(0, TAU),
      face: 1,
      rot: 0,
      hitT: 0,
      value: 150,
      rgb: PINK,
      demo: !!demo
    };
  }

  function makePipe(x, hasOwl, pal, demo) {
    const spd = (26 + G.wave * 3) * (demo ? 0.65 : 1) * spdMul();
    const pals = [CYN, MAG, GOLD, HOT, REED];
    const rgb = pal || pals[(Math.random() * pals.length) | 0];
    return {
      kind: 'pipe',
      x: x,
      y: PIPE_Y,
      homeY: PIPE_Y,
      vx: spd * (Math.random() < 0.5 ? 1 : -1),
      vy: 0,
      r: 11,
      h: 22 + ((x / 17) | 0) % 3 * 4,
      state: 'walk',
      flap: 0,
      face: 1,
      rot: 0,
      hitT: 0,
      owl: !!hasOwl,
      value: hasOwl ? 80 : 50 + ((x / 40) | 0) % 3 * 50,
      rgb: rgb,
      demo: !!demo
    };
  }

  function makeOwl(x, y, demo) {
    return {
      kind: 'owl',
      x: x,
      y: y,
      homeY: y,
      vx: rand(18, 36) * (Math.random() < 0.5 ? 1 : -1) * spdMul(),
      vy: 0,
      r: 16,
      state: 'perch',
      flap: rand(0, 8),
      face: 1,
      rot: 0,
      hitT: 0,
      value: 500,
      rgb: GOLD,
      demo: !!demo
    };
  }

  function countKind(kind) {
    let n = 0;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (t.kind !== kind) continue;
      if (t.state === 'walk' || t.state === 'fly' || t.state === 'perch') n += 1;
    }
    return n;
  }

  function liveRows() {
    return {
      duck: countKind('duck'),
      rabbit: countKind('rabbit'),
      pipe: countKind('pipe')
    };
  }

  function spawnRows(demo) {
    const c = rowCounts(demo ? 1 : G.wave);
    const duckDir = Math.random() < 0.5 ? 1 : -1;
    const ducks = [];
    const gapD = (VW - 80) / Math.max(1, c.ducks);
    for (let i = 0; i < c.ducks; i++) {
      const d = makeDuck(50 + i * gapD + rand(-6, 6), i < c.yellow, demo);
      d.vx = Math.abs(d.vx) * duckDir;
      d.face = duckDir;
      ducks.push(d);
    }
    const rabbits = [];
    const gapR = (VW - 90) / Math.max(1, c.rabbits);
    for (let i = 0; i < c.rabbits; i++) {
      const r = makeRabbit(56 + i * gapR + rand(-8, 8), demo);
      r.vx = Math.abs(r.vx) * -duckDir;
      r.face = -duckDir;
      rabbits.push(r);
    }
    const pipes = [];
    const gapP = (VW - 70) / Math.max(1, c.pipes);
    const owlAt = [];
    while (owlAt.length < c.owls) {
      const k = (Math.random() * c.pipes) | 0;
      if (owlAt.indexOf(k) < 0) owlAt.push(k);
    }
    for (let i = 0; i < c.pipes; i++) {
      const p = makePipe(40 + i * gapP, owlAt.indexOf(i) >= 0, null, demo);
      p.vx = Math.abs(p.vx) * duckDir;
      p.face = duckDir;
      pipes.push(p);
    }
    return ducks.concat(rabbits, pipes);
  }

  function spawnWave(demo) {
    targets.length = 0;
    const rows = spawnRows(demo);
    for (let i = 0; i < rows.length; i++) targets.push(rows[i]);
    G.owl = null;
    G.rows = liveRows();
    if (!demo) {
      G.wheel.alive = true;
      G.wheel.lockT = 0;
      G.wheel.cool = 0;
      G.box.alive = true;
      G.box.hitT = 0;
      G.mutedTune = false;
    }
  }

  function beginWave(n) {
    G.wave = n;
    G.miss = 0;
    G.missMax = missCap();
    G.phase = 'play';
    G.phaseT = 0;
    G.cool = 0.18;
    spawnWave(false);
    toast('第 ' + n + ' 摊', false, n > 1);
    if (n > 1) audio.row();
    else audio.tune();
    G.tuneT = 4.2;
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    syncHud();
  }

  function noteMiss() {
    G.miss += 1;
    breakCombo();
    audio.miss();
    syncHud();
    if (G.mode === 'play' && G.miss >= G.missMax) {
      endRun('miss');
    }
  }

  function maybeClearRows() {
    const now = liveRows();
    const names = ['duck', 'rabbit', 'pipe'];
    const labels = { duck: '鸭子行清', rabbit: '兔子行清', pipe: '水管行清' };
    let cleared = false;
    for (let i = 0; i < names.length; i++) {
      const k = names[i];
      if (G.rows[k] > 0 && now[k] <= 0) {
        cleared = true;
        addAmmo(rowAmmo(), VW * 0.5, k === 'duck' ? DUCK_Y : k === 'rabbit' ? RABBIT_Y : PIPE_Y);
        toast(labels[k] + '  +' + rowAmmo() + '弹', false, true);
        audio.row();
        confetti(VW * 0.5, k === 'duck' ? DUCK_Y : k === 'rabbit' ? RABBIT_Y : PIPE_Y, 18);
        hitStop(0.055);
        kick(3.4, 'win');
        screenFlash(GOLD, 0.32);
      }
    }
    G.rows = now;
    if (now.duck <= 0 && now.rabbit <= 0 && now.pipe <= 0 && G.mode === 'play') {
      G.phase = 'clear';
      G.phaseT = 1.05;
      if (G.miss === 0) {
        addScore(1000, VW * 0.5, 160, true);
        toast('零空一摊  +1000', false, true);
      }
    }
    return cleared;
  }

  function launchOwl(x, y) {
    const o = makeOwl(x, y - 8, false);
    o.state = 'fly';
    o.vy = -40;
    targets.push(o);
    G.owl = o;
    popFloat(x, y - 24, '鸮', GOLD, true);
    audio.hoot();
  }

  function takeOff(t) {
    if (t.state !== 'walk' || t.kind !== 'duck') return;
    t.state = 'fly';
    t.vy = -30;
    t.vx = (G.gun.x > t.x ? 1 : -1) * rand(40, 80);
    audio.squawk();
    popFloat(t.x, t.y - 18, '嘎', GOLD, false);
    emit(8, {
      x: t.x, y: t.y, j: 6,
      vx0: -50, vx1: 50, vy0: -80, vy1: -10,
      r0: 1.2, r1: 2.8, life: 0.4, rgb: t.rgb, g: 200
    });
  }

  function duckEat(t) {
    t.state = 'gone';
    const eat = isRapid() ? 5 : 4;
    G.ammo = Math.max(0, G.ammo - eat);
    breakCombo();
    audio.squawk();
    kick(4.6, 'die');
    screenFlash(MAG, 0.4);
    popFloat(t.x, COUNTER - 20, '-' + eat + '弹', MAG, true);
    toast('鸭子抢弹', true, false);
    emit(16, {
      x: t.x, y: COUNTER - 8, j: 10,
      vx0: -90, vx1: 90, vy0: -140, vy1: -20,
      r0: 1.4, r1: 3.4, life: 0.5, rgb: MAG, g: 280
    });
    maybeClearRows();
    syncHud();
    if (G.ammo <= 0 && !bullets.length) endRun('ammo');
  }

  function hitTarget(t, bx, by, bull) {
    t.state = 'hit';
    t.hitT = 0.05;
    t.vx *= 0.2;
    t.vy = -24;
    G.combo += 1;
    if (G.combo > G.comboPeak) G.comboPeak = G.combo;
    G.mult = comboMult(G.combo);
    G.miss = 0;
    let n = t.value * G.mult;
    if (bull) n = Math.round(n * 1.5);
    addScore(n, t.x, t.y, bull || G.combo >= 3);
    if (bull) {
      popFloat(t.x, t.y - 34, '红心', GOLD, true);
      audio.bull();
      confetti(t.x, t.y, 14);
      hitStop(clamp(0.05 + G.combo * 0.004, 0.05, 0.078));
      kick(G.combo >= 4 ? 4.4 : 3.2);
      screenFlash(GOLD, 0.42);
    } else {
      audio.hit(G.combo);
      hitStop(0.032);
      kick(2.4);
      screenFlash(t.rgb || HOT, 0.28);
    }
    if (G.combo >= 3) {
      popFloat(t.x, t.y - 48, '连中 ×' + G.mult, GOLD, true);
      bumpCombo();
      audio.combo(G.combo);
    }
    popSpark(t.x, t.y, bull ? GOLD : (t.rgb || HOT), bull ? 26 : 18);
    popRing(t.x, t.y, bull ? GOLD : CYN);
    emit(14, {
      x: t.x, y: t.y, j: 8,
      vx0: -160, vx1: 160, vy0: -200, vy1: 40,
      r0: 1.2, r1: 3.4, life: 0.6, rgb: t.rgb || HOT, g: 360
    });
    if (t.kind === 'pipe') {
      audio.glass();
      if (t.owl) launchOwl(t.x, t.y);
    } else if (t.kind === 'duck') {
      audio.squawk();
      emit(6, {
        x: t.x, y: t.y, j: 6,
        vx0: -70, vx1: 70, vy0: -120, vy1: -10,
        r0: 1.4, r1: 3.2, life: 0.7, rgb: WHT, g: 240
      });
    } else if (t.kind === 'rabbit') audio.hop();
    else if (t.kind === 'owl') audio.hoot();
    syncHud();
  }

  function hitWheel(bull) {
    if (!G.wheel.alive || G.wheel.lockT > 0 || G.wheel.cool > 0) return false;
    const seg = WEDGE.length;
    const u = (((-G.wheel.ang - Math.PI * 0.5) % TAU) + TAU) % TAU;
    const i = Math.floor(u / (TAU / seg)) % seg;
    const w = WEDGE[(i + seg) % seg];
    G.wheel.lockT = 1.35;
    G.wheel.cool = 2.4;
    G.combo += 1;
    G.mult = comboMult(G.combo);
    G.miss = 0;
    audio.wheel();
    popSpark(118, 58, GOLD, 30);
    popRing(118, 58, GOLD);
    confetti(118, 58, bull ? 16 : 10);
    hitStop(bull ? 0.07 : 0.045);
    kick(3.6);
    screenFlash(GOLD, 0.36);
    if (w.kind === 'ammo') {
      addAmmo(w.v + (bull ? 2 : 0), 118, 70);
      toast('转盘  +' + (w.v + (bull ? 2 : 0)) + '弹', false, true);
    } else if (w.kind === 'empty') {
      popFloat(118, 40, '空', MAG, true);
      toast('转盘落空', true, false);
      audio.miss();
    } else {
      const n = Math.round(w.v * G.mult * (bull ? 1.5 : 1));
      addScore(n, 118, 58, true);
      toast('转盘  +' + n, false, true);
    }
    syncHud();
    return true;
  }

  function hitBox() {
    if (!G.box.alive) return false;
    G.box.alive = false;
    G.box.hitT = 0.4;
    G.mutedTune = true;
    G.combo += 1;
    G.mult = comboMult(G.combo);
    G.miss = 0;
    addScore(100 * G.mult, G.box.x, G.box.y, false);
    audio.glass();
    popSpark(G.box.x, G.box.y, CYN, 20);
    popFloat(G.box.x, G.box.y - 18, '静音盒', CYN, false);
    toast('风琴停了', false, false);
    syncHud();
    return true;
  }

  function shoot() {
    if (G.mode !== 'play' || G.phase !== 'play') {
      if (G.mode === 'play' && G.ammo <= 0) audio.empty();
      return;
    }
    if (G.cool > 0) return;
    if (G.ammo <= 0) {
      audio.empty();
      return;
    }
    G.ammo -= 1;
    G.cool = fireCool();
    G.gun.recoil = 1;
    G.gun.flash = 1;
    G.gun.kick = 1;
    audio.shot();
    screenFlash(WHT, 0.22);
    kick(1.4);
    bullets.push({
      x: G.gun.x,
      y: GUN_Y - 28,
      vy: -560,
      r: 3.2,
      life: 1.2
    });
    emit(6, {
      x: G.gun.x, y: GUN_Y - 26, j: 3,
      vx0: -40, vx1: 40, vy0: -180, vy1: -40,
      r0: 1, r1: 2.2, life: 0.22, rgb: GOLD, g: 80
    });
    syncHud();
  }

  function resolveBullet(b) {
    let best = null;
    let bestD = 1e9;
    let bull = false;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (t.state === 'gone' || t.state === 'hit' || t.state === 'fall') continue;
      const d = hypot(t.x - b.x, t.y - b.y);
      if (d < t.r + b.r + 2 && d < bestD) {
        best = t;
        bestD = d;
        bull = d < t.r * 0.38;
      }
    }
    if (best) {
      hitTarget(best, b.x, b.y, bull);
      maybeClearRows();
      return true;
    }
    const wd = hypot(118 - b.x, 58 - b.y);
    if (G.wheel.alive && wd < 30 + b.r) {
      hitWheel(wd < 12);
      return true;
    }
    if (G.box.alive && hypot(G.box.x - b.x, G.box.y - b.y) < G.box.r + b.r) {
      hitBox();
      return true;
    }
    return false;
  }

  function endRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.phase = 'over';
    G.overWhy = why;
    saveBest();
    audio.lose();
    kick(7, 'die');
    screenFlash(MAG, 0.5);
    hitStop(0.06);
    const title = why === 'miss' ? '连空收摊' : '弹尽';
    const lead = '第 ' + G.wave + ' 摊  ·  本局 ' + G.score + '  ·  最高 ' + modeBest() +
      (why === 'miss' ? '  ·  打空太多' : '  ·  子弹打光');
    showOverlay('lose', title, lead);
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    G.phase = 'over';
    addScore(8000, VW * 0.5, 150, true);
    saveBest();
    audio.win();
    kick(5.5, 'win');
    screenFlash(GOLD, 0.5);
    confetti(VW * 0.5, 180, 40);
    hitStop(0.07);
    showOverlay('win', '通关', '六摊打穿  ·  本局 ' + G.score + '  ·  最高 ' + modeBest());
    toast('嘉年之星  +8000', false, true);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rapid' ? 'rapid' : 'gallery';
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.comboPeak = 0;
    G.mult = 1;
    G.ammo = startAmmo();
    G.miss = 0;
    G.missMax = missCap();
    G.gun.x = VW * 0.5;
    G.gun.recoil = 0;
    G.cool = 0.2;
    G.overWhy = '';
    resetFx();
    hideOverlay();
    audio.start();
    beginWave(1);
    toast(isRapid() ? '连射 · 靶快弹紧' : '靶场 · 清行补弹', false, !isRapid());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'gallery';
    G.wave = 1;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.ammo = 40;
    G.miss = 0;
    G.missMax = 8;
    G.phase = 'play';
    G.gun.x = VW * 0.5;
    resetFx();
    spawnWave(true);
    G.wheel.alive = true;
    G.box.alive = true;
    showOverlay('title', '嘉年', '左右瞄准，空格开枪。打鸭子、兔子、水管。清一行补弹。别打空。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('gallery');
    else startGame(G.kind || 'gallery');
  }

  function updateTarget(t, dt) {
    t.flap += dt * (t.state === 'fly' ? 18 : 8);
    if (t.kind === 'rabbit') t.hop += dt * 7;
    if (t.state === 'walk') {
      t.x += t.vx * dt;
      if (t.x < -28) t.x = VW + 28;
      if (t.x > VW + 28) t.x = -28;
      t.face = t.vx >= 0 ? 1 : -1;
      if (t.kind === 'duck' && t.yellow && !t.demo) {
        t.flyIn -= dt;
        if (t.flyIn <= 0) {
          let flying = 0;
          for (let i = 0; i < targets.length; i++) {
            if (targets[i].kind === 'duck' && targets[i].state === 'fly') flying += 1;
          }
          if (flying < (isRapid() ? 3 : 2)) takeOff(t);
          else t.flyIn = 0.7;
        }
      }
      if (t.kind === 'owl') {
        t.y = t.homeY + Math.sin(t.flap * 0.7) * 6;
      }
    } else if (t.state === 'perch') {
      t.y = t.homeY + Math.sin(G.clock * 2.2 + t.x) * 5;
      t.x += t.vx * dt;
      if (t.x < 70) { t.x = 70; t.vx = Math.abs(t.vx); }
      if (t.x > VW - 90) { t.x = VW - 90; t.vx = -Math.abs(t.vx); }
      t.face = t.vx >= 0 ? 1 : -1;
    } else if (t.state === 'fly') {
      if (t.kind === 'duck') {
        t.vy += 70 * dt;
        t.vx += (G.gun.x - t.x) * 0.55 * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.face = t.vx >= 0 ? 1 : -1;
        if (t.y >= COUNTER - 8) duckEat(t);
      } else {
        t.vy += 20 * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        if (t.y < 36) t.vy = Math.abs(t.vy);
        if (t.x < 40) t.vx = Math.abs(t.vx);
        if (t.x > VW - 40) t.vx = -Math.abs(t.vx);
        t.face = t.vx >= 0 ? 1 : -1;
      }
    } else if (t.state === 'hit') {
      t.hitT -= dt;
      if (t.hitT <= 0) t.state = 'fall';
    } else if (t.state === 'fall') {
      t.vy += 900 * dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.rot += (t.face >= 0 ? 1 : -1) * 10 * dt;
      if (t.y > COUNTER + 8) t.state = 'gone';
    }
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y += b.vy * dt;
      b.life -= dt;
      if (resolveBullet(b)) {
        bullets.splice(i, 1);
        continue;
      }
      if (b.y < 8 || b.life <= 0) {
        bullets.splice(i, 1);
        if (G.mode === 'play') noteMiss();
      }
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.1);
    if (G.punch > 1) G.punch = 1 + (G.punch - 1) * Math.max(0, 1 - dt * 10);
    if (G.gun.recoil > 0) G.gun.recoil = Math.max(0, G.gun.recoil - dt * 8);
    if (G.gun.flash > 0) G.gun.flash = Math.max(0, G.gun.flash - dt * 10);
    if (G.gun.kick > 0) G.gun.kick = Math.max(0, G.gun.kick - dt * 6);
    if (G.cool > 0) G.cool = Math.max(0, G.cool - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.rot += p.spin * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.38) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].t += dt;
      if (floats[i].t >= floats[i].life) floats.splice(i, 1);
    }
  }

  function updateGun(dt) {
    const spd = gunSpd();
    if (keys.l) G.gun.x -= spd * dt;
    if (keys.r) G.gun.x += spd * dt;
    G.gun.x = clamp(G.gun.x, 28, VW - 28);
  }

  function updateWheel(dt) {
    if (G.wheel.lockT > 0) {
      G.wheel.lockT -= dt;
      G.wheel.ang += dt * 0.4;
    } else {
      G.wheel.ang += dt * G.wheel.spin * (isRapid() ? 1.25 : 1);
      if (G.mode === 'play' && G.wheel.alive) {
        G.wheel._tick = (G.wheel._tick || 0) + dt;
        if (G.wheel._tick > 0.16) {
          G.wheel._tick = 0;
          audio.tick();
        }
      }
    }
    if (G.wheel.cool > 0) G.wheel.cool -= dt;
    G.box.spin += dt * 4;
    if (G.box.hitT > 0) G.box.hitT -= dt;
  }

  function maybeBonusOwl(dt) {
    if (G.mode !== 'play' || G.phase !== 'play') return;
    if (G.owl && G.owl.state !== 'gone' && G.owl.state !== 'fall') return;
    if (Math.random() < dt * (0.08 + G.wave * 0.01)) {
      const o = makeOwl(rand(90, VW - 110), 62, false);
      targets.push(o);
      G.owl = o;
      audio.hoot();
      toast('猫头鹰', false, true);
    }
  }

  function updateDemo(dt) {
    if (!targets.length) spawnWave(true);
    for (let i = 0; i < targets.length; i++) updateTarget(targets[i], dt);
    if (Math.random() < dt * 0.35) {
      const live = [];
      for (let i = 0; i < targets.length; i++) {
        if (targets[i].state === 'walk') live.push(targets[i]);
      }
      if (live.length) {
        const t = live[(Math.random() * live.length) | 0];
        emit(2, {
          x: t.x, y: t.y - 10, j: 4,
          vx0: -20, vx1: 20, vy0: -40, vy1: -8,
          r0: 0.8, r1: 1.8, life: 0.4, rgb: t.rgb || GOLD, g: 80
        });
      }
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    updateFx(dt);
    updateGun(dt);
    updateWheel(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }

    if (G.mode === 'title') {
      updateDemo(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      for (let i = 0; i < targets.length; i++) updateTarget(targets[i], dt);
      return;
    }

    if (G.phase === 'clear') {
      G.phaseT -= dt;
      if (G.phaseT <= 0) {
        if (G.wave >= 6) winRun();
        else beginWave(G.wave + 1);
      }
      return;
    }

    if (keys.fire) shoot();

    updateBullets(dt);
    for (let i = 0; i < targets.length; i++) updateTarget(targets[i], dt);
    maybeBonusOwl(dt);

    if (!G.mutedTune) {
      G.tuneT -= dt;
      if (G.tuneT <= 0) {
        audio.tune();
        G.tuneT = 5.6;
      }
    }

    if (G.ammo <= 0 && !bullets.length && G.mode === 'play') endRun('ammo');
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#1a0820');
    g.addColorStop(0.28, '#2a1030');
    g.addColorStop(0.62, '#3a1828');
    g.addColorStop(1, '#120810');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const stripeH = 28 * scale;
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,106,34,0.22)' : 'rgba(255,61,184,0.16)';
      ctx.fillRect(sx(i * 40), sy(0), 40 * scale, stripeH);
    }
    ctx.fillStyle = 'rgba(8,4,14,0.85)';
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(28));
    ctx.quadraticCurveTo(sx(VW * 0.5), sy(48), sx(VW), sy(28));
    ctx.lineTo(sx(VW), sy(0));
    ctx.lineTo(sx(0), sy(0));
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      const a = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.clock * 3.2 + L.ph));
      ctx.fillStyle = rgba(L.rgb, a);
      ctx.shadowColor = rgba(L.rgb, 0.8);
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      ctx.arc(sx(L.x), sy(L.y), 3.4 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawRails() {
    const ys = [PIPE_Y + 16, RABBIT_Y + 16, DUCK_Y + 16];
    for (let i = 0; i < ys.length; i++) {
      const y = ys[i];
      ctx.fillStyle = 'rgba(40, 22, 28, 0.92)';
      ctx.fillRect(sx(12), sy(y), (VW - 24) * scale, 6 * scale);
      ctx.fillStyle = rgba(HOT, 0.35);
      ctx.fillRect(sx(12), sy(y), (VW - 24) * scale, 1.4 * scale);
      for (let p = 0; p < 9; p++) {
        const x = 24 + p * 74;
        ctx.fillStyle = '#6a3a22';
        ctx.fillRect(sx(x - 3), sy(y + 2), 6 * scale, 10 * scale);
        ctx.fillStyle = rgba(GOLD, 0.55);
        ctx.beginPath();
        ctx.arc(sx(x), sy(y + 2), 3.2 * scale, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawWheel() {
    ctx.save();
    ctx.translate(sx(118), sy(58));
    ctx.scale(scale, scale);
    ctx.rotate(G.wheel.ang);
    const locked = G.wheel.lockT > 0;
    for (let i = 0; i < WEDGE.length; i++) {
      const a0 = i * TAU / WEDGE.length;
      ctx.fillStyle = rgba(WEDGE[i].rgb, locked ? 0.95 : 0.82);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 28, a0, a0 + TAU / WEDGE.length);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(8,4,14,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = '#1a1020';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(0, 0, 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(sx(118), sy(58));
    ctx.scale(scale, scale);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(-5, -24);
    ctx.lineTo(5, -24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBox() {
    if (!G.box.alive && G.box.hitT <= 0) return;
    const a = G.box.alive ? 1 : G.box.hitT / 0.4;
    ctx.save();
    ctx.translate(sx(G.box.x), sy(G.box.y));
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = '#2a1830';
    ctx.fillRect(-14, -10, 28, 22);
    ctx.strokeStyle = rgba(CYN, 0.8);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-14, -10, 28, 22);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = rgba(i % 2 ? GOLD : CYN, 0.85);
      ctx.fillRect(-10 + i * 4.4, -18, 3.2, 10);
    }
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(-6, 4, 12, 4);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawDuck(t) {
    const hitFlash = t.state === 'hit';
    ctx.save();
    ctx.translate(sx(t.x), sy(t.y + (t.state === 'walk' ? Math.sin(t.flap * 2) * 1.6 : 0)));
    ctx.scale((t.face >= 0 ? 1 : -1) * scale, scale);
    if (t.state === 'fall' || t.state === 'hit') ctx.rotate(t.rot);
    ctx.shadowColor = rgba(t.yellow ? GOLD : HOT2, hitFlash ? 0.9 : 0.45);
    ctx.shadowBlur = (hitFlash ? 16 : 10) * scale;
    const flap = t.state === 'fly' ? Math.sin(t.flap * 1.6) * 0.8 : 0.35;
    ctx.save();
    ctx.translate(-5, -1);
    ctx.rotate(-0.4 + flap);
    ctx.fillStyle = rgba(t.yellow ? HOT : [230, 210, 170], 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 5.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = hitFlash ? '#fff' : rgba(t.yellow ? GOLD : CREAM, 1);
    ctx.beginPath();
    ctx.ellipse(0, 2, 13, 8, -0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hitFlash ? '#fff' : rgba(t.yellow ? HOT2 : [255, 240, 210], 1);
    ctx.beginPath();
    ctx.ellipse(10, -5, 7, 6.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 1);
    ctx.beginPath();
    ctx.moveTo(16, -6);
    ctx.lineTo(24, -3.4);
    ctx.lineTo(16, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1020';
    ctx.beginPath();
    ctx.arc(12, -6.4, 1.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawRabbit(t) {
    const hitFlash = t.state === 'hit';
    const hop = t.state === 'walk' ? Math.abs(Math.sin(t.hop)) * 7 : 0;
    ctx.save();
    ctx.translate(sx(t.x), sy(t.y - hop));
    ctx.scale((t.face >= 0 ? 1 : -1) * scale, scale);
    if (t.state === 'fall' || t.state === 'hit') ctx.rotate(t.rot);
    ctx.shadowColor = rgba(PINK, hitFlash ? 0.9 : 0.4);
    ctx.shadowBlur = 10 * scale;
    ctx.fillStyle = hitFlash ? '#fff' : rgba(CREAM, 1);
    ctx.beginPath();
    ctx.ellipse(-4, -10, 2.2, 8, -0.15, 0, TAU);
    ctx.ellipse(3, -11, 2, 8.4, 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(PINK, 0.85);
    ctx.beginPath();
    ctx.ellipse(-4, -10, 1.1, 5.5, -0.15, 0, TAU);
    ctx.ellipse(3, -11, 1, 5.8, 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hitFlash ? '#fff' : rgba(CREAM, 1);
    ctx.beginPath();
    ctx.ellipse(0, 3, 11, 8.2, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -2, 6.2, 5.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1020';
    ctx.beginPath();
    ctx.arc(9.4, -3.2, 1.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(PINK, 1);
    ctx.beginPath();
    ctx.ellipse(12.4, -1.2, 2.2, 1.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPipe(t) {
    const hitFlash = t.state === 'hit';
    ctx.save();
    ctx.translate(sx(t.x), sy(t.y));
    ctx.scale(scale, scale);
    if (t.state === 'fall' || t.state === 'hit') ctx.rotate(t.rot);
    ctx.shadowColor = rgba(t.rgb, 0.7);
    ctx.shadowBlur = 10;
    const h = t.h || 24;
    ctx.fillStyle = hitFlash ? '#fff' : rgba(t.rgb, 0.92);
    ctx.beginPath();
    ctx.moveTo(-7, h * 0.4);
    ctx.lineTo(-6, -h);
    ctx.lineTo(6, -h);
    ctx.lineTo(7, h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-3.2, -h + 2, 2.2, h * 0.7);
    ctx.fillStyle = rgba(HOT2, 0.9);
    ctx.fillRect(-8, -h - 4, 16, 5);
    if (t.owl) {
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.moveTo(0, -h + 8);
      ctx.lineTo(3, -h + 14);
      ctx.lineTo(-3, -h + 14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawOwl(t) {
    const hitFlash = t.state === 'hit';
    ctx.save();
    ctx.translate(sx(t.x), sy(t.y));
    ctx.scale((t.face >= 0 ? 1 : -1) * scale, scale);
    if (t.state === 'fall' || t.state === 'hit') ctx.rotate(t.rot);
    ctx.shadowColor = rgba(GOLD, 0.7);
    ctx.shadowBlur = 14 * scale;
    ctx.fillStyle = hitFlash ? '#fff' : '#c8a060';
    ctx.beginPath();
    ctx.ellipse(0, 4, 13, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8a6230';
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.lineTo(-14, -16);
    ctx.lineTo(-2, -10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(14, -16);
    ctx.lineTo(2, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8dc';
    ctx.beginPath();
    ctx.arc(-4.5, -1, 5.2, 0, TAU);
    ctx.arc(4.5, -1, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1020';
    const blink = Math.sin(G.clock * 2 + t.x) > 0.92;
    ctx.beginPath();
    if (blink) {
      ctx.ellipse(-4.5, -1, 4, 0.6, 0, 0, TAU);
      ctx.ellipse(4.5, -1, 4, 0.6, 0, 0, TAU);
    } else {
      ctx.arc(-4.5, -1, 2.2, 0, TAU);
      ctx.arc(4.5, -1, 2.2, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 1);
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(4, 6);
    ctx.lineTo(-4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawTargets() {
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (t.state === 'gone') continue;
      if (t.kind === 'pipe') drawPipe(t);
      else if (t.kind === 'rabbit') drawRabbit(t);
      else if (t.kind === 'owl') drawOwl(t);
      else drawDuck(t);
    }
  }

  function drawBullets() {
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      ctx.save();
      ctx.shadowColor = rgba(GOLD, 0.9);
      ctx.shadowBlur = 10 * scale;
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.ellipse(sx(b.x), sy(b.y), 2.4 * scale, 6 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(sx(b.x), sy(b.y + 2), 1.2 * scale, 2.4 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCounter() {
    ctx.fillStyle = '#14080e';
    ctx.fillRect(sx(0), sy(COUNTER), VW * scale, (VH - COUNTER) * scale);
    ctx.fillStyle = '#2a1410';
    ctx.fillRect(sx(0), sy(COUNTER), VW * scale, 10 * scale);
    ctx.fillStyle = rgba(HOT, 0.4);
    ctx.fillRect(sx(0), sy(COUNTER), VW * scale, 2 * scale);
    const n = Math.min(18, G.ammo);
    for (let i = 0; i < 18; i++) {
      const on = i < n;
      ctx.fillStyle = on ? rgba(GOLD, 0.95) : 'rgba(60,30,40,0.7)';
      ctx.fillRect(sx(16 + i * 10), sy(COUNTER + 22), 6 * scale, 14 * scale);
      if (on) {
        ctx.fillStyle = rgba(HOT, 0.9);
        ctx.fillRect(sx(16 + i * 10), sy(COUNTER + 22), 6 * scale, 3.5 * scale);
      }
    }
    ctx.font = '700 ' + (11 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillStyle = rgba(HOT2, 0.9);
    ctx.textAlign = 'right';
    ctx.fillText(isRapid() ? '连射' : '靶场', sx(VW - 16), sy(COUNTER + 36));
    ctx.textAlign = 'left';
  }

  function drawGun() {
    const rec = G.gun.recoil * 8;
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.18 + G.gun.flash * 0.35);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(G.gun.x), sy(GUN_Y - 36 + rec));
    ctx.lineTo(sx(G.gun.x), sy(22));
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(sx(G.gun.x), sy(GUN_Y + rec));
    ctx.scale(scale, scale);
    ctx.shadowColor = rgba(HOT, 0.55);
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#3a2218';
    ctx.beginPath();
    ctx.moveTo(-10, 18);
    ctx.lineTo(-6, 4);
    ctx.lineTo(8, 4);
    ctx.lineTo(14, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-3.4, -26, 6.8, 32);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-4.4, -30, 8.8, 6);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.beginPath();
    ctx.arc(0, -32, 3.2, 0, TAU);
    ctx.fill();
    if (G.gun.flash > 0.05) {
      ctx.fillStyle = rgba(GOLD, G.gun.flash);
      ctx.beginPath();
      ctx.moveTo(-8, -32);
      ctx.lineTo(0, -52);
      ctx.lineTo(8, -32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, G.gun.flash);
      ctx.beginPath();
      ctx.arc(0, -34, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      if (p.kind === 'conf') {
        ctx.save();
        ctx.translate(sx(p.x), sy(p.y));
        ctx.rotate(p.rot);
        ctx.fillStyle = rgba(p.rgb, a);
        ctx.fillRect(-p.r * scale, -p.r * 0.55 * scale, p.r * 2 * scale, p.r * 1.1 * scale);
        ctx.restore();
      } else {
        ctx.fillStyle = rgba(p.rgb, a);
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
        ctx.fill();
      }
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = 1 - s.t / 0.38;
      ctx.strokeStyle = rgba(s.rgb, 0.85 * k);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * (1.2 - k * 0.6)) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, 0.8 * (1 - k));
      ctx.lineWidth = (2.4 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 28) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const k = f.t / f.life;
      const a = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
      ctx.font = (f.big ? '900 ' : '700 ') + ((f.big ? 18 : 14) * scale) +
        'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillStyle = rgba(f.rgb, Math.max(0, a));
      ctx.fillText(f.text, sx(f.x), sy(f.y - k * 28));
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawWheel();
    drawBox();
    drawRails();
    drawTargets();
    drawBullets();
    drawParticles();
    drawCounter();
    drawGun();
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

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') keys.r = down;
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (space) keys.fire = down;
    if (down && (k.indexOf('Arrow') === 0 || space || k === 'Enter')) e.preventDefault();
    if (!down || e.repeat) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      restart();
      return;
    }
    if (k === '1' || k === '2') {
      audio.ensure();
      if (G.mode === 'title' || overlayOpen()) {
        if (k === '1') startGame('gallery');
        if (k === '2') {
          if (G.mode === 'lose' || G.mode === 'win') goTitle();
          else startGame('rapid');
        }
        return;
      }
    }
    if (space || k === 'Enter') {
      audio.ensure();
      if (overlayOpen()) {
        if (G.mode === 'title') startGame('gallery');
        else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
        return;
      }
    }
  }

  function bindPad(el, setter, tap) {
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      setter(true);
      el.classList.add('held');
      if (tap) tap();
      if (el.setPointerCapture && e.pointerId != null) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    };
    const up = function (e) {
      e.preventDefault();
      setter(false);
      el.classList.remove('held');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', function () {
      setter(false);
      el.classList.remove('held');
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

  seedWorld();
  loadBest();
  initMute();
  goTitle();
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = 0;
  });
  if (canvas) {
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      if (canvas.focus) canvas.focus();
    });
  }
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });
  if (btnGallery) btnGallery.addEventListener('click', function () {
    audio.ensure();
    startGame('gallery');
  });
  if (btnRapid) btnRapid.addEventListener('click', function () {
    audio.ensure();
    startGame('rapid');
  });
  if (ovAgain) ovAgain.addEventListener('click', function () {
    audio.ensure();
    startGame(G.kind);
  });
  if (ovMenu) ovMenu.addEventListener('click', function () {
    audio.ensure();
    goTitle();
  });
  bindPad(btnLeft, function (v) { keys.l = v; });
  bindPad(btnRight, function (v) { keys.r = v; });
  bindPad(btnFire, function (v) { keys.fire = v; }, function () {
    if (overlayOpen()) {
      if (G.mode === 'title') startGame('gallery');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
    }
  });
  requestAnimationFrame(frame);
})();
