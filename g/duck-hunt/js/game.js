'use strict';

(function () {
  const VW = 640;
  const VH = 480;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BUSH = 338;
  const HUD_Y = 428;
  const ROUND_N = 10;
  const SHOTS = 3;
  const BEST_KEY = 'playbox-duck-hunt-best';
  const MUTE_KEY = 'playbox-duck-hunt-mute';
  const OPS = '点按开火 · ← → ↑ ↓ 准星 · 空格发射 · R 重开 · M 静音';
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

  const PAL = {
    black: {
      body: [62, 68, 108],
      wing: [118, 126, 176],
      belly: [210, 196, 178],
      beak: [255, 168, 64],
      glow: [140, 150, 210],
      mul: 1
    },
    blue: {
      body: [32, 150, 230],
      wing: [90, 210, 255],
      belly: [186, 232, 255],
      beak: [255, 186, 72],
      glow: [80, 210, 255],
      mul: 2
    },
    red: {
      body: [255, 72, 48],
      wing: [255, 140, 92],
      belly: [255, 206, 168],
      beak: [255, 214, 86],
      glow: [255, 110, 70],
      mul: 3
    }
  };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnDuck = document.getElementById('btn-duck');
  const btnClay = document.getElementById('btn-clay');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const ammoLabel = document.getElementById('ammo-label');
  const quotaLabel = document.getElementById('quota-label');
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: 180, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const holes = [];
  const stars = [];
  const clouds = [];
  const reeds = [];

  const G = {
    mode: 'title',
    kind: 'duck',
    phase: 'fly',
    phaseT: 0,
    t: 0,
    clock: 0,
    round: 1,
    score: 0,
    best: 0,
    bestD: 0,
    bestC: 0,
    combo: 0,
    comboPeak: 0,
    mult: 1,
    shots: SHOTS,
    left: ROUND_N,
    board: [],
    boardI: 0,
    targets: [],
    dog: { vis: false, kind: 'hide', t: 0, dur: 1, x: VW * 0.5, hold: 0, ha: 0 },
    aim: { x: VW * 0.5, y: 170, pulse: 0 },
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: WHT,
    punch: 1,
    toastT: 0
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
  function isClay() { return G.kind === 'clay'; }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function quotaFor(round) {
    if (round <= 10) return 6;
    if (round <= 12) return 7;
    if (round <= 14) return 8;
    if (round <= 19) return 9;
    return 10;
  }
  function scoreTier(round) {
    return 1 + Math.floor((round - 1) / 5);
  }
  function comboMult(c) {
    return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 2));
  }
  function duckSpeed(round, color) {
    const base = 86 + round * 9;
    const mul = color === 'red' ? 1.34 : color === 'blue' ? 1.14 : 1;
    return base * mul;
  }
  function flyTime(round) {
    return Math.max(3.05, 5.35 - round * 0.11);
  }
  function pickDuckColor(round) {
    const r = Math.random();
    if (round <= 2) return r < 0.72 ? 'black' : 'blue';
    if (round <= 5) return r < 0.42 ? 'black' : r < 0.78 ? 'blue' : 'red';
    if (round <= 10) return r < 0.22 ? 'black' : r < 0.58 ? 'blue' : 'red';
    return r < 0.12 ? 'black' : r < 0.42 ? 'blue' : 'red';
  }
  function modeBest() {
    return isClay() ? G.bestC : G.bestD;
  }
  function hitsThisRound() {
    let n = 0;
    for (let i = 0; i < G.board.length; i++) if (G.board[i] === 1) n += 1;
    return n;
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
        this.master.gain.value = this.muted ? 0 : 0.4;
        this.master.connect(this.ctx.destination);
      } catch (err) {
        this.ctx = null;
        this.master = null;
      }
    },
    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.4;
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
      this.noise(0.075, 0.12, 380);
      this.beep(130, 0.09, 'sine', 0.08, 42);
      this.beep(70, 0.12, 'triangle', 0.05, 32);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.85, Math.max(0, combo - 1) * 0.09);
      this.noise(0.05, 0.055, 1200);
      this.beep(620 * lift, 0.07, 'square', 0.06, 980 * lift);
      this.beep(1240 * lift, 0.11, 'triangle', 0.04, 1760 * lift);
      if (combo >= 3) this.beep(1560, 0.12, 'sine', 0.03, 2100);
    },
    clay(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.7, Math.max(0, combo - 1) * 0.08);
      this.noise(0.08, 0.07, 1700);
      this.beep(920 * lift, 0.06, 'square', 0.05, 1480 * lift);
      this.beep(1480 * lift, 0.1, 'sine', 0.035, 2200);
    },
    miss() {
      this.ensure();
      this.noise(0.04, 0.03, 900);
      this.beep(150, 0.05, 'square', 0.028);
    },
    empty() {
      this.ensure();
      this.beep(86, 0.045, 'square', 0.028);
      this.beep(64, 0.06, 'triangle', 0.02);
    },
    away() {
      this.ensure();
      this.beep(640, 0.22, 'sine', 0.03, 1480);
    },
    laugh() {
      this.ensure();
      this.noise(0.2, 0.045, 700);
      this.beep(392, 0.09, 'square', 0.075, 300, 0);
      this.beep(330, 0.09, 'square', 0.07, 240, 0.15);
      this.beep(247, 0.18, 'square', 0.08, 110, 0.31);
      this.beep(180, 0.3, 'sawtooth', 0.05, 64, 0.34);
      this.beep(520, 0.05, 'triangle', 0.03, 180, 0.02);
      this.beep(480, 0.05, 'triangle', 0.03, 160, 0.17);
    },
    bark() {
      this.ensure();
      this.beep(520, 0.07, 'square', 0.05, 820);
      this.beep(700, 0.1, 'triangle', 0.04, 980, 0.06);
    },
    rustle() {
      this.ensure();
      this.noise(0.1, 0.035, 500);
      this.beep(180, 0.08, 'triangle', 0.02, 90);
    },
    combo(n) {
      this.ensure();
      this.beep(392 + n * 40, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.032, 1176);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659, 0.08);
      this.beep(784, 0.16, 'triangle', 0.045, 1046, 0.16);
    },
    perfect() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.045, 659);
      this.beep(659, 0.08, 'sine', 0.04, 784, 0.08);
      this.beep(784, 0.1, 'triangle', 0.05, 1046, 0.16);
      this.beep(1046, 0.2, 'sine', 0.05, 1318, 0.26);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(494, 0.12, 'triangle', 0.04, 880, 0.08);
    },
    lose() {
      this.ensure();
      this.beep(330, 0.12, 'sawtooth', 0.05, 196);
      this.beep(196, 0.28, 'triangle', 0.05, 90, 0.1);
      this.laugh();
    }
  };

  function loadBest() {
    G.bestD = 0;
    G.bestC = 0;
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestD = (o.d | 0) || 0;
        G.bestC = (o.c | 0) || 0;
      } else {
        G.bestD = parseInt(raw, 10) || 0;
      }
    } catch (err) { /* ignore */ }
  }

  function saveBest() {
    const cur = G.score;
    if (isClay()) {
      if (cur > G.bestC) G.bestC = cur;
    } else if (cur > G.bestD) G.bestD = cur;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ d: G.bestD, c: G.bestC }));
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
    G.toastT = gold ? 1.35 : 0.95;
    setTimeout(function () {
      if (id === toastTok && G.toastT <= 0) toastEl.classList.add('hidden');
    }, 1600);
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
    while (pips.length < ROUND_N) {
      const d = document.createElement('i');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < pips.length; i++) {
      const v = G.board[i] || 0;
      pips[i].className = 'pip' + (v === 1 ? ' on' : v === 2 ? ' gone' : '');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(modeBest());
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '猎鸭';
      else stageLabel.textContent = '第 ' + G.round + ' 局';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.round >= 6);
    }
    if (tagLabel) {
      tagLabel.textContent = isClay() ? '飞碟' : '飞鸭';
      tagLabel.classList.toggle('warn', G.mode === 'lose');
      tagLabel.classList.toggle('hot', G.combo >= 4);
    }
    if (ammoLabel) {
      ammoLabel.textContent = '弹 ' + G.shots;
      ammoLabel.classList.toggle('warn', G.mode === 'play' && G.phase === 'fly' && G.shots <= 1);
    }
    if (quotaLabel) {
      const q = quotaFor(G.round);
      const h = hitsThisRound();
      quotaLabel.textContent = '达标 ' + h + '/' + q;
      quotaLabel.classList.toggle('warn', G.mode === 'play' && h + (ROUND_N - G.boardI) < q);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 未达配额即负', 'warn');
    else if (G.phase === 'dog' && G.dog.kind === 'laugh') setHint('狗在笑 · 下一轮准备', 'warn');
    else if (G.combo >= 5) setHint('连中 ×' + G.mult + ' · 别断', 'hot');
    else if (G.shots <= 1 && G.phase === 'fly') setHint('最后一发 · 瞄准再打', 'warn');
    else setHint(isClay() ? '侧边飞碟 · 三发一轮 · R 重开' : '点按开火 · 三发一轮 · R 重开', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'MISS' : 'DUCK';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnDuck.textContent = primary;
    btnClay.classList.remove('hidden');
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
    stageEl.classList.remove('laugh');
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
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 340);
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
    capArr(floats, 18);
  }

  function addScore(n, x, y, big) {
    if (n <= 0) return;
    G.score += n;
    saveBest();
    bumpScore(n);
    if (x != null) popFloat(x, y - 18, '+' + n, n >= 1500 ? GOLD : HOT2, big);
    syncHud();
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    holes.length = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.stop = 0;
  }

  function seedWorld() {
    stars.length = 0;
    for (let i = 0; i < 46; i++) {
      stars.push({
        x: rand(8, VW - 8),
        y: rand(8, BUSH - 90),
        r: rand(0.5, 1.6),
        a: rand(0.25, 0.9),
        ph: rand(0, TAU)
      });
    }
    clouds.length = 0;
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: rand(40, VW - 40),
        y: rand(36, 130),
        s: rand(0.7, 1.35),
        v: rand(6, 16)
      });
    }
    reeds.length = 0;
    for (let i = 0; i < 78; i++) {
      reeds.push({
        x: rand(-6, VW + 6),
        h: rand(26, 86),
        w: rand(2.2, 5.4),
        ph: rand(0, TAU),
        rgb: Math.random() < 0.22 ? [36, 186, 92] : Math.random() < 0.15 ? [18, 70, 40] : [22, 108, 58]
      });
    }
  }

  function hideDog() {
    G.dog.vis = false;
    G.dog.kind = 'hide';
    G.dog.t = 0;
    G.dog.hold = 0;
    G.dog.ha = 0;
  }

  function showDog(kind, hold) {
    G.dog.vis = true;
    G.dog.kind = kind;
    G.dog.t = 0;
    G.dog.hold = hold || 0;
    G.dog.ha = 0;
    G.dog.dur = kind === 'laugh' ? 1.48 : 1.18;
    G.dog.x = clamp(VW * 0.5 + rand(-50, 50), 90, VW - 90);
  }

  function makeDuck(x, y, demo) {
    const color = pickDuckColor(demo ? 1 : G.round);
    const pal = PAL[color];
    const spd = duckSpeed(demo ? 1 : G.round, color) * (demo ? 0.72 : 1);
    const t = {
      type: 'duck',
      color: color,
      pal: pal,
      x: x,
      y: y,
      vx: rand(-spd, spd),
      vy: -spd * rand(0.45, 0.9),
      spd: spd,
      r: color === 'red' ? 19 : 21,
      state: 'fly',
      flap: rand(0, 8),
      face: 1,
      rot: 0,
      alive: 0,
      maxT: demo ? 8 : flyTime(G.round),
      dirT: rand(0.15, 0.45),
      hitT: 0,
      featherT: 0,
      value: 500 * scoreTier(demo ? 1 : G.round) * pal.mul,
      demo: !!demo
    };
    if (Math.abs(t.vx) < 30) t.vx = 40 * (Math.random() < 0.5 ? 1 : -1);
    t.face = t.vx >= 0 ? 1 : -1;
    return t;
  }

  function makeClay(side, demo) {
    const dir = side < 0 ? 1 : -1;
    const spd = (210 + G.round * 14) * (demo ? 0.7 : 1);
    const t = {
      type: 'clay',
      color: 'clay',
      pal: { glow: HOT2, body: HOT },
      x: side < 0 ? -22 : VW + 22,
      y: rand(188, 278),
      vx: dir * rand(spd * 0.92, spd * 1.18),
      vy: -rand(150, 268),
      grav: rand(155, 228),
      spd: spd,
      r: 15,
      state: 'fly',
      flap: 0,
      face: dir,
      rot: 0,
      spin: rand(0, TAU),
      alive: 0,
      maxT: 4.2,
      dirT: 9,
      hitT: 0,
      featherT: 0,
      value: 1000 * scoreTier(demo ? 1 : G.round),
      demo: !!demo
    };
    return t;
  }

  function pickDuckDir(t) {
    t.dirT = rand(0.32, 1.12);
    const spd = t.spd;
    let ang = rand(0, TAU);
    if (t.y > BUSH - 78) ang = rand(-2.6, -0.55);
    else if (t.y < 70) ang = rand(0.35, Math.PI - 0.35);
    t.vx = Math.cos(ang) * spd;
    t.vy = Math.sin(ang) * spd;
    if (t.y > BUSH - 78 && t.vy > 0) t.vy = -Math.abs(t.vy);
    if (t.y < 70 && t.vy < 0) t.vy = Math.abs(t.vy);
  }

  function scareTarget(t) {
    if (t.state !== 'fly') return;
    t.state = 'away';
    if (!t.demo) {
      G.combo = 0;
      G.mult = 1;
      syncHud();
    }
    if (t.type === 'clay') {
      t.vx *= 1.15;
      t.vy -= 40;
    } else {
      t.vy = -Math.abs(t.spd) * 1.25;
      t.vx *= 0.45;
    }
  }

  function scareAll() {
    let any = false;
    for (let i = 0; i < G.targets.length; i++) {
      if (G.targets[i].state === 'fly') {
        scareTarget(G.targets[i]);
        any = true;
      }
    }
    if (any) audio.away();
  }

  function spawnFlight(demo) {
    G.targets.length = 0;
    if (demo) {
      if (isClay()) {
        G.targets.push(makeClay(Math.random() < 0.5 ? -1 : 1, true));
      } else {
        G.targets.push(makeDuck(rand(90, VW - 90), BUSH - 8, true));
      }
      return;
    }
    const pair = shouldPair();
    const n = pair && G.left >= 2 ? 2 : 1;
    G.left -= n;
    G.shots = SHOTS;
    if (isClay()) {
      const a = Math.random() < 0.5 ? -1 : 1;
      G.targets.push(makeClay(a, false));
      if (n === 2) {
        const b = Math.random() < 0.55 ? -a : a;
        const c = makeClay(b, false);
        c.y += rand(-18, 18);
        c.vy += rand(-20, 24);
        G.targets.push(c);
      }
    } else {
      const x0 = rand(80, VW - 80);
      G.targets.push(makeDuck(x0, BUSH + 10, false));
      if (n === 2) {
        let x1 = x0 + (Math.random() < 0.5 ? -1 : 1) * rand(70, 130);
        x1 = clamp(x1, 70, VW - 70);
        G.targets.push(makeDuck(x1, BUSH + 16, false));
      }
    }
    audio.rustle();
    emit(14, {
      x: VW * 0.5, y: BUSH - 6, j: 120,
      vx0: -80, vx1: 80, vy0: -140, vy1: -20,
      r0: 1.2, r1: 3.2, life: 0.45, rgb: REED, g: 280
    });
  }

  function shouldPair() {
    if (G.left < 2) return false;
    if (isClay()) return true;
    if (G.round <= 2) return false;
    if (G.round >= 8) return true;
    return Math.random() < 0.42;
  }

  function startFlight() {
    if (G.left <= 0) {
      endRound();
      return;
    }
    hideDog();
    spawnFlight(false);
    G.phase = 'fly';
    G.phaseT = 0;
    syncHud();
  }

  function beginRound(n) {
    G.round = n;
    G.left = ROUND_N;
    G.board = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    G.boardI = 0;
    G.shots = SHOTS;
    hideDog();
    startFlight();
    toast('第 ' + n + ' 局  ·  达标 ' + quotaFor(n), false, n > 1);
    if (n > 1) audio.wave();
    syncHud();
  }

  function hitTarget(t) {
    t.state = 'hit';
    t.hitT = 0.055;
    t.vx *= 0.22;
    t.vy = t.type === 'clay' ? 40 : -36;
    t.rot = 0;
    G.combo += 1;
    if (G.combo > G.comboPeak) G.comboPeak = G.combo;
    G.mult = comboMult(G.combo);
    const n = t.value * G.mult;
    addScore(n, t.x, t.y, G.combo >= 3);
    if (G.combo >= 3) {
      popFloat(t.x, t.y - 40, '连中 ×' + G.mult, GOLD, true);
      bumpCombo();
      audio.combo(G.combo);
    }
    const rgb = t.type === 'clay' ? HOT2 : t.pal.glow;
    popSpark(t.x, t.y, rgb, t.type === 'clay' ? 26 : 22);
    popRing(t.x, t.y, rgb);
    if (t.type === 'clay') {
      audio.clay(G.combo);
      emit(22, {
        x: t.x, y: t.y, j: 6,
        vx0: -220, vx1: 220, vy0: -240, vy1: 80,
        r0: 1.4, r1: 4.2, life: 0.55, rgb: HOT, g: 520
      });
      emit(10, {
        x: t.x, y: t.y, j: 4,
        vx0: -160, vx1: 160, vy0: -180, vy1: 40,
        r0: 1, r1: 2.4, life: 0.4, rgb: GOLD, g: 380
      });
    } else {
      audio.hit(G.combo);
      emit(18, {
        x: t.x, y: t.y, j: 8,
        vx0: -160, vx1: 160, vy0: -200, vy1: 40,
        r0: 1.2, r1: 3.6, life: 0.7, rgb: t.pal.body, g: 360
      });
      emit(8, {
        x: t.x, y: t.y, j: 6,
        vx0: -90, vx1: 90, vy0: -160, vy1: -20,
        r0: 1.6, r1: 3.8, life: 0.85, rgb: WHT, g: 280
      });
    }
    hitStop(clamp(0.042 + G.combo * 0.005, 0.042, 0.078));
    kick(G.combo >= 4 ? 4.2 : 2.8);
    screenFlash(rgb, 0.38);
    syncHud();
  }

  function shoot(x, y) {
    if (overlayOpen()) return;
    if (G.mode !== 'play') return;
    if (G.phase !== 'fly') {
      if (G.shots <= 0) audio.empty();
      return;
    }
    if (G.shots <= 0) {
      audio.empty();
      return;
    }
    G.shots -= 1;
    G.aim.pulse = 1;
    audio.shot();
    screenFlash(WHT, 0.32);
    kick(1.8);
    popRing(x, y, CYN);
    holes.push({ x: x, y: y, t: 0, life: 2.4 });
    capArr(holes, 12);

    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.targets.length; i++) {
      const t = G.targets[i];
      if (t.state !== 'fly') continue;
      const d = hypot(t.x - x, t.y - y);
      const pad = t.type === 'clay' ? 5 : 6;
      if (d < t.r + pad && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    if (best) {
      hitTarget(best);
    } else {
      G.combo = 0;
      G.mult = 1;
      audio.miss();
      emit(8, {
        x: x, y: y, j: 4,
        vx0: -70, vx1: 70, vy0: -90, vy1: 30,
        r0: 0.8, r1: 2.1, life: 0.28, rgb: CYN, g: 200
      });
      syncHud();
    }
    if (G.shots <= 0) scareAll();
    else {
      let flying = 0;
      for (let i = 0; i < G.targets.length; i++) if (G.targets[i].state === 'fly') flying += 1;
      if (flying === 0) { /* wait for falls */ }
    }
    syncHud();
  }

  function allResolved() {
    if (!G.targets.length) return false;
    for (let i = 0; i < G.targets.length; i++) {
      const s = G.targets[i].state;
      if (s === 'fly' || s === 'away' || s === 'hit' || s === 'fall') return false;
    }
    return true;
  }

  function beginDog() {
    let down = 0;
    let gone = 0;
    for (let i = 0; i < G.targets.length; i++) {
      if (G.targets[i].state === 'down') down += 1;
      else gone += 1;
    }
    G.phase = 'dog';
    G.phaseT = 0;
    if (down <= 0) {
      showDog('laugh', 0);
      G.combo = 0;
      G.mult = 1;
      audio.laugh();
      kick(3.2, 'laugh');
      screenFlash(MAG, 0.28);
      hitStop(0.04);
      toast(isClay() ? '飞碟飞走了' : '飞走了', true, false);
    } else {
      showDog('hold', down);
      audio.bark();
      if (gone > 0) toast('打中 ' + down, false, false);
    }
    syncHud();
  }

  function finishDog() {
    for (let i = 0; i < G.targets.length; i++) {
      if (G.boardI >= ROUND_N) break;
      G.board[G.boardI] = G.targets[i].state === 'down' ? 1 : 2;
      G.boardI += 1;
    }
    G.targets.length = 0;
    hideDog();
    syncHud();
    if (G.boardI >= ROUND_N) endRound();
    else {
      G.phase = 'gap';
      G.phaseT = 0.32;
    }
  }

  function endRound() {
    const h = hitsThisRound();
    const q = quotaFor(G.round);
    if (h === ROUND_N) {
      addScore(10000, VW * 0.5, 150, true);
      toast('完美一局  +10000', false, true);
      audio.perfect();
      kick(4.5);
      screenFlash(GOLD, 0.45);
      emit(40, {
        x: VW * 0.5, y: 160, j: 80,
        vx0: -180, vx1: 180, vy0: -220, vy1: 40,
        r0: 1.4, r1: 4, life: 0.8, rgb: GOLD, g: 260
      });
    }
    if (h >= q) {
      G.phase = 'gap';
      G.phaseT = h === ROUND_N ? 1.25 : 0.85;
      G.left = 0;
      G._advance = true;
    } else {
      loseRun();
    }
    syncHud();
  }

  function loseRun() {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.phase = 'over';
    showDog('laugh', 0);
    audio.lose();
    kick(7.2, 'die');
    screenFlash(MAG, 0.55);
    hitStop(0.07);
    const lead = '达标 ' + hitsThisRound() + '/' + quotaFor(G.round) +
      '  ·  本局 ' + G.score + '  ·  最高 ' + modeBest();
    showOverlay('lose', '没达标', lead, '再来');
    btnClay.textContent = '换模式';
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'clay' ? 'clay' : 'duck';
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.comboPeak = 0;
    G.mult = 1;
    G._advance = false;
    G.aim.x = VW * 0.5;
    G.aim.y = 170;
    resetFx();
    hideOverlay();
    audio.start();
    beginRound(1);
    toast(isClay() ? '飞碟 · 侧边飞出' : '飞鸭 · 三发一轮', false, !isClay());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'duck';
    G.round = 1;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.shots = SHOTS;
    G.left = ROUND_N;
    G.board = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    G.boardI = 0;
    G.phase = 'fly';
    G._advance = false;
    resetFx();
    hideDog();
    spawnDemo();
    showOverlay('title', '猎鸭', '点按瞄准，三发打中飞鸭。', '飞鸭');
    btnClay.textContent = '飞碟';
    btnClay.classList.remove('hidden');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('duck');
    else startGame(G.kind || 'duck');
  }

  function hoverTarget() {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.targets.length; i++) {
      const t = G.targets[i];
      if (t.state !== 'fly') continue;
      const d = hypot(t.x - G.aim.x, t.y - G.aim.y);
      if (d < t.r + 10 && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }

  function updateTarget(t, dt) {
    t.flap += dt;
    t.alive += dt;
    if (t.state === 'fly') {
      if (t.type === 'clay') {
        t.vy += t.grav * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.spin += dt * 11;
        t.face = t.vx >= 0 ? 1 : -1;
        if (t.y < -48 || t.x < -70 || t.x > VW + 70 || t.y > BUSH + 50) {
          t.state = 'gone';
          if (!t.demo) {
            G.combo = 0;
            G.mult = 1;
            syncHud();
          }
        }
      } else {
        t.dirT -= dt;
        if (t.dirT <= 0) pickDuckDir(t);
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        if (t.x < 28) { t.x = 28; t.vx = Math.abs(t.vx); }
        if (t.x > VW - 28) { t.x = VW - 28; t.vx = -Math.abs(t.vx); }
        if (t.y < 34) { t.y = 34; t.vy = Math.abs(t.vy); }
        if (t.y > BUSH - 14) { t.y = BUSH - 14; t.vy = -Math.abs(t.vy); }
        t.face = t.vx >= 0 ? 1 : -1;
        if (t.alive >= t.maxT) scareTarget(t);
      }
    } else if (t.state === 'away') {
      t.vy -= 380 * dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.face = t.vx >= 0 ? 1 : -1;
      t.spin += dt * 4;
      if (t.y < -56 || t.x < -80 || t.x > VW + 80) {
        t.state = 'gone';
        if (!t.demo) {
          G.combo = 0;
          G.mult = 1;
          syncHud();
        }
      }
    } else if (t.state === 'hit') {
      t.hitT -= dt;
      if (t.hitT <= 0) {
        t.state = t.type === 'clay' ? 'down' : 'fall';
        if (t.type === 'clay') {
          emit(8, {
            x: t.x, y: t.y, j: 8,
            vx0: -80, vx1: 80, vy0: 40, vy1: 140,
            r0: 1, r1: 2.4, life: 0.35, rgb: HOT2, g: 500
          });
        }
      }
    } else if (t.state === 'fall') {
      t.vy += 980 * dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.rot += (t.face >= 0 ? 1 : -1) * 9 * dt;
      t.featherT -= dt;
      if (t.featherT <= 0) {
        t.featherT = 0.045;
        emit(1, {
          x: t.x, y: t.y, j: 6,
          vx0: -40, vx1: 40, vy0: -30, vy1: 20,
          r0: 1.2, r1: 2.8, life: 0.45, rgb: t.pal.belly, g: 220
        });
      }
      if (t.y >= BUSH + 8) {
        t.y = BUSH + 8;
        t.state = 'down';
        emit(10, {
          x: t.x, y: BUSH, j: 10,
          vx0: -60, vx1: 60, vy0: -90, vy1: -10,
          r0: 1.2, r1: 3.2, life: 0.4, rgb: REED, g: 240
        });
      }
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.1);
    if (G.punch > 1) G.punch = 1 + (G.punch - 1) * Math.max(0, 1 - dt * 10);
    if (G.aim.pulse > 0) G.aim.pulse = Math.max(0, G.aim.pulse - dt * 4.2);
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
    for (let i = holes.length - 1; i >= 0; i--) {
      holes[i].t += dt;
      if (holes[i].t >= holes[i].life) holes.splice(i, 1);
    }
  }

  function updateAim(dt) {
    const spd = 340;
    let used = false;
    if (keys.l) { G.aim.x -= spd * dt; used = true; }
    if (keys.r) { G.aim.x += spd * dt; used = true; }
    if (keys.u) { G.aim.y -= spd * dt; used = true; }
    if (keys.d) { G.aim.y += spd * dt; used = true; }
    if (used) pointer.hover = true;
    G.aim.x = clamp(G.aim.x, 10, VW - 10);
    G.aim.y = clamp(G.aim.y, 12, HUD_Y - 8);
  }

  function updateDog(dt) {
    if (!G.dog.vis) return;
    G.dog.t += dt;
    if (G.dog.kind === 'laugh') {
      const step = G.dog.t;
      if (G.dog.ha === 0 && step > 0.04) {
        G.dog.ha = 1;
        popFloat(G.dog.x - 18, BUSH - 58, '哈', MAG, true);
      } else if (G.dog.ha === 1 && step > 0.2) {
        G.dog.ha = 2;
        popFloat(G.dog.x + 8, BUSH - 70, '哈', MAG, true);
      } else if (G.dog.ha === 2 && step > 0.36) {
        G.dog.ha = 3;
        popFloat(G.dog.x - 4, BUSH - 82, '哈', HOT2, false);
      }
    }
  }

  function spawnDemo() {
    G.targets.length = 0;
    if (Math.random() < 0.32) G.targets.push(makeClay(Math.random() < 0.5 ? -1 : 1, true));
    else G.targets.push(makeDuck(rand(90, VW - 90), BUSH - 8, true));
  }

  function updateDemo(dt) {
    if (!G.targets.length) spawnDemo();
    for (let i = 0; i < G.targets.length; i++) updateTarget(G.targets[i], dt);
    let live = false;
    for (let i = 0; i < G.targets.length; i++) {
      const s = G.targets[i].state;
      if (s === 'fly' || s === 'away') live = true;
    }
    if (!live) spawnDemo();
    if (!G.dog.vis && Math.random() < 0.0018) {
      showDog('peek', 0);
      G.dog.dur = 1.1;
    }
    if (G.dog.vis) {
      G.dog.t += dt;
      if (G.dog.t > G.dog.dur) hideDog();
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    updateFx(dt);
    updateAim(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }

    if (G.mode === 'title') {
      updateDemo(dt);
      return;
    }

    if (G.mode === 'lose') {
      updateDog(dt);
      for (let i = 0; i < G.targets.length; i++) updateTarget(G.targets[i], dt);
      return;
    }

    if (G.phase === 'gap') {
      G.phaseT -= dt;
      if (G.phaseT <= 0) {
        if (G._advance) {
          G._advance = false;
          beginRound(G.round + 1);
        } else startFlight();
      }
      return;
    }

    if (G.phase === 'dog') {
      updateDog(dt);
      if (G.dog.t >= G.dog.dur) finishDog();
      return;
    }

    if (G.phase === 'fly') {
      for (let i = 0; i < G.targets.length; i++) updateTarget(G.targets[i], dt);
      if (allResolved()) beginDog();
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(BUSH + 20));
    g.addColorStop(0, '#12082a');
    g.addColorStop(0.38, '#24144a');
    g.addColorStop(0.7, '#4a2048');
    g.addColorStop(1, '#ff6a22');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const moonX = sx(540);
    const moonY = sy(78);
    const mg = ctx.createRadialGradient(moonX, moonY, 2 * scale, moonX, moonY, 46 * scale);
    mg.addColorStop(0, 'rgba(255,227,107,0.95)');
    mg.addColorStop(0.35, 'rgba(255,160,74,0.55)');
    mg.addColorStop(1, 'rgba(255,106,34,0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 46 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 16 * scale, 0, TAU);
    ctx.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + 0.45 * Math.sin(G.clock * 2.1 + s.ph));
      ctx.fillStyle = rgba(WHT, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    ctx.globalAlpha = 0.18;
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const cx = ((c.x + G.clock * c.v) % (VW + 160)) - 80;
      ctx.fillStyle = '#ffd0b0';
      ctx.beginPath();
      ctx.ellipse(sx(cx), sy(c.y), 48 * c.s * scale, 14 * c.s * scale, 0, 0, TAU);
      ctx.ellipse(sx(cx + 28 * c.s), sy(c.y + 4), 32 * c.s * scale, 11 * c.s * scale, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHills() {
    ctx.fillStyle = '#0c1c14';
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(BUSH + 8));
    ctx.quadraticCurveTo(sx(90), sy(BUSH - 38), sx(170), sy(BUSH + 4));
    ctx.quadraticCurveTo(sx(260), sy(BUSH - 22), sx(340), sy(BUSH + 8));
    ctx.quadraticCurveTo(sx(470), sy(BUSH - 48), sx(VW), sy(BUSH + 2));
    ctx.lineTo(sx(VW), sy(HUD_Y));
    ctx.lineTo(sx(0), sy(HUD_Y));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(46,207,106,0.35)';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(BUSH + 8));
    ctx.quadraticCurveTo(sx(90), sy(BUSH - 38), sx(170), sy(BUSH + 4));
    ctx.quadraticCurveTo(sx(260), sy(BUSH - 22), sx(340), sy(BUSH + 8));
    ctx.quadraticCurveTo(sx(470), sy(BUSH - 48), sx(VW), sy(BUSH + 2));
    ctx.stroke();
  }

  function drawTree() {
    ctx.save();
    ctx.translate(sx(86), sy(BUSH + 6));
    ctx.scale(scale, scale);
    ctx.fillStyle = '#2a160e';
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-5, -108);
    ctx.lineTo(6, -108);
    ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.fill();
    const blobs = [
      [0, -128, 38, 28],
      [-22, -108, 26, 20],
      [24, -104, 24, 18],
      [-8, -86, 22, 16],
      [16, -84, 20, 15]
    ];
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      ctx.fillStyle = i % 2 ? '#163a22' : '#0f2a18';
      ctx.beginPath();
      ctx.ellipse(b[0], b[1], b[2], b[3], 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(46,207,106,0.28)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHoles() {
    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      const k = 1 - h.t / h.life;
      ctx.strokeStyle = rgba(WHT, 0.22 * k);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.arc(sx(h.x), sy(h.y), 5 * scale, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba([8, 4, 14], 0.55 * k);
      ctx.beginPath();
      ctx.arc(sx(h.x), sy(h.y), 3.2 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawDuck(t) {
    const hitFlash = t.state === 'hit';
    ctx.save();
    ctx.translate(sx(t.x), sy(t.y));
    ctx.scale((t.face >= 0 ? 1 : -1) * scale, scale);
    if (t.state === 'fall' || t.state === 'hit') ctx.rotate(t.rot);
    ctx.shadowColor = rgba(t.pal.glow, hitFlash ? 0.95 : 0.5);
    ctx.shadowBlur = (hitFlash ? 18 : 12) * scale;
    const flap = t.state === 'fly' || t.state === 'away' ? Math.sin(t.flap * 22) * 0.7 : 0.85;
    ctx.save();
    ctx.translate(-6, -2);
    ctx.rotate(-0.35 + flap);
    ctx.fillStyle = rgba(t.pal.wing, 0.96);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 6.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = hitFlash ? '#fff' : rgba(t.pal.body, 1);
    ctx.beginPath();
    ctx.ellipse(0, 2, 15.5, 9.5, -0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(t.pal.belly, hitFlash ? 1 : 0.92);
    ctx.beginPath();
    ctx.ellipse(2, 6, 10, 4.8, -0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = hitFlash ? '#fff' : rgba(t.pal.body, 1);
    ctx.beginPath();
    ctx.ellipse(12, -6, 8.6, 7.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(t.pal.beak, 1);
    ctx.beginPath();
    ctx.moveTo(19, -7);
    ctx.lineTo(28, -4.2);
    ctx.lineTo(19, -1.6);
    ctx.closePath();
    ctx.fill();
    if (t.state === 'fall' || t.state === 'hit') {
      ctx.strokeStyle = '#1a1020';
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(10.4, -9.2);
      ctx.lineTo(14.8, -5.4);
      ctx.moveTo(14.8, -9.2);
      ctx.lineTo(10.4, -5.4);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(13.4, -8, 2.15, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a1020';
      ctx.beginPath();
      ctx.arc(14.1, -8, 1.05, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawClay(t) {
    ctx.save();
    ctx.translate(sx(t.x), sy(t.y));
    ctx.scale(scale, scale);
    ctx.rotate(t.spin);
    ctx.shadowColor = rgba(HOT, 0.7);
    ctx.shadowBlur = 14 * scale;
    const squish = 0.55 + 0.45 * Math.abs(Math.cos(t.spin));
    ctx.fillStyle = t.state === 'hit' ? '#fff' : '#f4d0a8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 13 * squish, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.95);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3a1840';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.2, 4.2 * squish, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.2, 8.2 * squish, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawTargets() {
    for (let i = 0; i < G.targets.length; i++) {
      const t = G.targets[i];
      if (t.state === 'down' || t.state === 'gone') continue;
      if (t.y > BUSH + 16) continue;
      if (t.type === 'clay') drawClay(t);
      else drawDuck(t);
    }
  }

  function drawReeds() {
    ctx.save();
    for (let i = 0; i < reeds.length; i++) {
      const r = reeds[i];
      const sway = Math.sin(G.clock * 2.4 + r.ph) * 7;
      ctx.strokeStyle = rgba(r.rgb, 0.95);
      ctx.lineWidth = r.w * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(r.x), sy(BUSH + 18));
      ctx.quadraticCurveTo(sx(r.x + sway * 0.4), sy(BUSH + 18 - r.h * 0.55), sx(r.x + sway), sy(BUSH + 18 - r.h));
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#0a1610';
    ctx.fillRect(sx(0), sy(BUSH + 14), VW * scale, (HUD_Y - BUSH - 14) * scale);
    ctx.fillStyle = 'rgba(46,207,106,0.18)';
    ctx.fillRect(sx(0), sy(BUSH + 12), VW * scale, 3 * scale);
  }

  function drawDog() {
    const d = G.dog;
    if (!d.vis) return;
    const rise = Math.min(1, d.t * 5.2);
    const laugh = d.kind === 'laugh';
    const bob = Math.sin(d.t * (laugh ? 14 : 7)) * (laugh ? 5.5 : 2.2);
    const x = sx(d.x);
    const y = sy(BUSH + 22 - rise * 56 + bob);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.shadowColor = 'rgba(255,160,74,0.35)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = rgba(CREAM, 1);
    ctx.beginPath();
    ctx.ellipse(0, 16, 22, 18, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c48a58';
    ctx.beginPath();
    ctx.ellipse(0, 22, 16, 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CREAM, 1);
    ctx.beginPath();
    ctx.ellipse(0, -6, 14, 13, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1810';
    ctx.beginPath();
    ctx.ellipse(-9, -16, 5.5, 8.5, -0.35, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CREAM, 1);
    ctx.beginPath();
    ctx.ellipse(9, -15, 4.6, 7.2, 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1020';
    ctx.beginPath();
    ctx.ellipse(-4, -8, laugh ? 2.4 : 1.6, laugh ? 0.7 : 1.6, 0, 0, TAU);
    ctx.ellipse(5, -8, laugh ? 2.4 : 1.6, laugh ? 0.7 : 1.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2218';
    ctx.beginPath();
    ctx.ellipse(1, -2, 3.2, 2.2, 0, 0, TAU);
    ctx.fill();
    if (laugh) {
      ctx.fillStyle = '#4a1028';
      ctx.beginPath();
      ctx.ellipse(1, 5, 7, 5.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ff6a88';
      ctx.beginPath();
      ctx.ellipse(1, 6.5, 4.2, 2.6, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#ff6a22';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(1, 3, 5, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(CYN, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 8, 8, 0.15, Math.PI - 0.15);
    ctx.stroke();
    if (d.kind === 'hold' && d.hold > 0) {
      for (let i = 0; i < d.hold; i++) {
        const oxd = (i - (d.hold - 1) * 0.5) * 16;
        ctx.fillStyle = rgba(HOT, 0.95);
        ctx.beginPath();
        ctx.ellipse(oxd, 18, 10, 6, -0.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.moveTo(oxd + 8, 16);
        ctx.lineTo(oxd + 14, 18);
        ctx.lineTo(oxd + 8, 20);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawHudStrip() {
    ctx.fillStyle = '#0a0610';
    ctx.fillRect(sx(0), sy(HUD_Y), VW * scale, (VH - HUD_Y) * scale);
    ctx.fillStyle = 'rgba(255,106,34,0.28)';
    ctx.fillRect(sx(0), sy(HUD_Y), VW * scale, 1.5 * scale);

    for (let i = 0; i < SHOTS; i++) {
      const on = i < G.shots;
      const x = 28 + i * 18;
      const y = HUD_Y + 26;
      ctx.fillStyle = on ? rgba(GOLD, 0.95) : 'rgba(80,40,50,0.7)';
      ctx.fillRect(sx(x - 5), sy(y - 11), 10 * scale, 22 * scale);
      if (on) {
        ctx.fillStyle = rgba(HOT, 0.9);
        ctx.fillRect(sx(x - 5), sy(y - 11), 10 * scale, 5 * scale);
      }
    }

    ctx.font = '700 ' + (11 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillStyle = rgba(HOT2, 0.9);
    ctx.textAlign = 'left';
    ctx.fillText('HIT', sx(118), sy(HUD_Y + 16));
    for (let i = 0; i < ROUND_N; i++) {
      const v = G.board[i] || 0;
      const x = 122 + i * 18;
      const y = HUD_Y + 32;
      ctx.fillStyle = v === 1 ? rgba(HOT, 0.95) : v === 2 ? rgba(MAG, 0.55) : 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.ellipse(sx(x), sy(y), 7 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
    }
    const q = quotaFor(G.round);
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(122 - 8 + (10 - q) * 18), sy(HUD_Y + 42));
    ctx.lineTo(sx(122 + 8 + 9 * 18), sy(HUD_Y + 42));
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.font = '700 ' + (13 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    const rtxt = 'R=' + (G.round < 10 ? '0' : '') + G.round;
    ctx.fillText(rtxt, sx(VW - 18), sy(HUD_Y + 32));
    ctx.textAlign = 'left';
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
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

  function drawAim() {
    if (G.mode === 'lose') return;
    if (overlayOpen() && G.mode === 'title') return;
    const over = hoverTarget();
    const rgb = over ? HOT : CYN;
    const x = sx(G.aim.x);
    const y = sy(G.aim.y);
    const pulse = G.aim.pulse;
    ctx.save();
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = 1.6 * scale;
    ctx.shadowColor = rgba(rgb, 0.7);
    ctx.shadowBlur = 8 * scale;
    const rad = (11 + pulse * 8) * scale;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3.2 * scale, 0, TAU);
    ctx.stroke();
    const arm = 16 * scale;
    const gap = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y - arm); ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap); ctx.lineTo(x, y + arm);
    ctx.moveTo(x - arm, y); ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y); ctx.lineTo(x + arm, y);
    ctx.stroke();
    ctx.fillStyle = rgba(over ? GOLD : WHT, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 1.6 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
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
    drawSky();
    drawHills();
    drawTree();
    drawHoles();
    drawTargets();
    drawParticles();
    drawReeds();
    drawDog();
    drawHudStrip();
    drawAim();
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

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('duck');
    else if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') keys.u = down;
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') keys.d = down;
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
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
        if (k === '1') startGame('duck');
        if (k === '2') {
          if (G.mode === 'lose') goTitle();
          else startGame('clay');
        }
        return;
      }
    }
    if (space || k === 'Enter') {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') shoot(G.aim.x, G.aim.y);
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      const p = pointerWorld(e);
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = p.x;
      pointer.y = p.y;
      G.aim.x = clamp(p.x, 10, VW - 10);
      G.aim.y = clamp(p.y, 12, HUD_Y - 8);
      if (G.mode === 'play' && !overlayOpen()) shoot(G.aim.x, G.aim.y);
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (pointer.down || e.pointerType === 'mouse') {
        G.aim.x = clamp(p.x, 10, VW - 10);
        G.aim.y = clamp(p.y, 12, HUD_Y - 8);
        pointer.hover = true;
      }
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () { pointer.hover = false; });
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

  seedWorld();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = 0;
  });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });
  if (btnDuck) btnDuck.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startGame('duck');
    else if (G.mode === 'lose') startGame(G.kind);
  });
  if (btnClay) btnClay.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startGame('clay');
    else if (G.mode === 'lose') goTitle();
  });
  requestAnimationFrame(frame);
})();
