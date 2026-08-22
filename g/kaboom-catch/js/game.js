'use strict';

(function () {
  const WORLD_W = 720;
  const WORLD_H = 540;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const BOMB_R = 13;
  const BUCKET_H = 32;
  const BUCKET_GAP = 3;
  const MAX_BUCKETS = 3;
  const GROUND = 516;
  const ROOF = 70;
  const SPAWN_Y = 94;
  const PAD = 50;
  const KEY_ACCEL = 4600;
  const KEY_MAX = 840;
  const BEST_KEY = 'playbox-kaboom-catch-best';
  const MUTE_KEY = 'playbox-kaboom-catch-mute';
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPS_TITLE = '指针 / ← → 移动 · 漏接少一桶 · 暴雨列更多 · M 静音';
  const OPS_PLAY = '指针移动 · ← → / A D 移动 · 漏接少一桶 · R 重开 · M 静音';
  const EXTRAS = [1000, 3000, 5000, 7000, 9000, 11000, 13000, 15000];
  const GROUPS = [
    { n: 10, pts: 1, fall: 228, drop: 0.78, walk: 168 },
    { n: 20, pts: 2, fall: 276, drop: 0.64, walk: 210 },
    { n: 30, pts: 3, fall: 336, drop: 0.52, walk: 258 },
    { n: 40, pts: 4, fall: 408, drop: 0.42, walk: 318 },
    { n: 50, pts: 5, fall: 486, drop: 0.34, walk: 384 },
    { n: 60, pts: 6, fall: 576, drop: 0.27, walk: 456 },
    { n: 80, pts: 7, fall: 672, drop: 0.22, walk: 534 },
    { n: 150, pts: 8, fall: 792, drop: 0.175, walk: 624 }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnStorm = document.getElementById('btn-storm');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const bestEl = document.getElementById('best');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const waveLabel = document.getElementById('wave-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false };
  const pointer = { x: WORLD_W * 0.5, y: WORLD_H * 0.5, over: false, down: false, id: null };

  const bombs = [];
  const particles = [];
  const sparks = [];
  const blasts = [];
  const rings = [];
  const pops = [];
  const motes = [];
  const pips = [];

  const bomber = {
    x: WORLD_W * 0.5,
    col: 4,
    face: 1,
    arm: 0,
    dropCd: 0.4,
    hold: true
  };

  const G = {
    mode: 'title',
    kind: 'classic',
    t: 0,
    clock: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    buckets: MAX_BUCKETS,
    group: 0,
    caught: 0,
    caughtAll: 0,
    missed: 0,
    nextExtra: 0,
    bestC: 0,
    bestS: 0,
    px: WORLD_W * 0.5,
    vx: 0,
    slosh: 0,
    tilt: 0,
    steer: 'ptr',
    lock: 0,
    booming: false,
    boomWait: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashCol: '#ff4a2e',
    punch: 1,
    toastT: 0,
    paused: false,
    newBest: false,
    squash: [0, 0, 0],
    wet: [0, 0, 0],
    hud: ''
  };

  let addTok = 0;
  let last = 0;
  let acc = 0;

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
  function cols() {
    return G.kind === 'storm' ? 12 : 8;
  }
  function bucketW() {
    return G.kind === 'storm' ? 82 : 98;
  }
  function colX(i) {
    const n = cols();
    const span = WORLD_W - PAD * 2;
    return PAD + (i + 0.5) * (span / n);
  }
  function nearestCol(x) {
    const n = cols();
    let best = 0;
    let d = 1e9;
    for (let i = 0; i < n; i++) {
      const k = Math.abs(colX(i) - x);
      if (k < d) {
        d = k;
        best = i;
      }
    }
    return best;
  }
  function groupNow() {
    return GROUPS[clamp(G.group, 0, GROUPS.length - 1)];
  }
  function fallSpeed() {
    const g = groupNow();
    return g.fall * (G.kind === 'storm' ? 1.08 : 1) * (G.mode === 'title' ? 0.72 : 1);
  }
  function dropGap() {
    const g = groupNow();
    return g.drop * (G.kind === 'storm' ? 0.76 : 1) * (G.mode === 'title' ? 1.25 : 1);
  }
  function walkSpeed() {
    const g = groupNow();
    return g.walk * (G.kind === 'storm' ? 1.12 : 1) * (G.mode === 'title' ? 0.7 : 1);
  }
  function comboMult() {
    return 1 + Math.min(7, (G.combo / 5) | 0);
  }
  function extraAt(i) {
    if (i < EXTRAS.length) return EXTRAS[i];
    return 15000 + (i - EXTRAS.length + 1) * 5000;
  }
  function pxMin() {
    return bucketW() * 0.5 + 10;
  }
  function pxMax() {
    return WORLD_W - bucketW() * 0.5 - 10;
  }

  function bucketGeom(i) {
    const h = BUCKET_H;
    const bottom = GROUND - 8;
    const top = bottom - (i + 1) * (h + BUCKET_GAP) + BUCKET_GAP;
    return { x: G.px, y: top, w: bucketW(), h: h };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, from, to, type) {
      if (!this.ctx || this.muted) return;
      if (!this.noiseBuf) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, (sr * 0.3) | 0, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.setValueAtTime(from || 900, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
      f.Q.value = type === 'lowpass' ? 0.7 : 1.05;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    catch: function (combo) {
      this.ensure();
      const p = 1 + Math.min(12, combo) * 0.055;
      this.noise(0.07, 0.08, 1400 * p, 420, 'bandpass');
      this.beep(210 * p, 0.09, 'sine', 0.07, 92);
      this.beep((540 + combo * 38) * Math.min(p, 1.6), 0.11, 'triangle', 0.055, 880 * p);
      this.beep(120 * p, 0.07, 'sine', 0.04, 60);
    },
    splash: function () {
      this.ensure();
      this.noise(0.08, 0.055, 2200, 380, 'highpass');
    },
    boom: function (soft) {
      this.ensure();
      this.noise(soft ? 0.14 : 0.28, soft ? 0.09 : 0.16, 180, 70, 'lowpass');
      this.noise(soft ? 0.08 : 0.16, soft ? 0.05 : 0.09, 700, 180, 'bandpass');
      this.beep(soft ? 110 : 88, soft ? 0.18 : 0.32, 'sawtooth', soft ? 0.05 : 0.09, 36);
      if (!soft) this.beep(52, 0.4, 'sine', 0.08, 28);
    },
    extra: function () {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.055, 784);
      this.beep(523, 0.12, 'triangle', 0.05, 1046);
      this.beep(784, 0.18, 'sine', 0.04, 1175);
    },
    level: function () {
      this.ensure();
      this.beep(440, 0.08, 'square', 0.035, 880);
      this.beep(660, 0.12, 'triangle', 0.04, 990);
    },
    combo: function (n) {
      this.ensure();
      const f = 480 + n * 36;
      this.beep(f, 0.08, 'sine', 0.05, f * 1.5);
      this.beep(f * 1.25, 0.12, 'triangle', 0.035);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.1, 'sine', 0.05, 440);
      this.beep(330, 0.14, 'triangle', 0.04, 880);
    },
    over: function () {
      this.ensure();
      this.beep(240, 0.28, 'sawtooth', 0.07, 70);
      this.beep(96, 0.46, 'square', 0.04, 40);
    },
    spark: function () {
      this.ensure();
      this.beep(1480, 0.03, 'square', 0.012, 620);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function currentBest() {
    return G.kind === 'storm' ? G.bestS : G.bestC;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestC = o && isFinite(o.c) ? o.c | 0 : 0;
        G.bestS = o && isFinite(o.s) ? o.s | 0 : 0;
      } else {
        const n = parseInt(raw, 10);
        G.bestC = isFinite(n) && n > 0 ? n : 0;
      }
    } catch (e) { /* ignore */ }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, s: G.bestS }));
    } catch (e) { /* ignore */ }
  }

  function considerBest() {
    if (G.mode === 'title') return;
    if (G.kind === 'storm') {
      if (G.score > G.bestS) {
        G.bestS = G.score;
        G.newBest = true;
        saveBest();
      }
    } else if (G.score > G.bestC) {
      G.bestC = G.score;
      G.newBest = true;
      saveBest();
    }
  }

  function addScore(n, x, y) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    considerBest();
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
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
    pop(x, y - 18, '+' + n, n >= 8 ? '#ffe36b' : '#ffd0b0');
    checkExtra();
  }

  function setComboHud() {
    comboEl.textContent = '×' + G.combo;
    if (G.combo >= 2) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 1.6;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function renderPips() {
    if (pips.length !== MAX_BUCKETS) {
      pipsEl.innerHTML = '';
      pips.length = 0;
      for (let i = 0; i < MAX_BUCKETS; i++) {
        const el = document.createElement('i');
        el.className = 'pip on';
        pipsEl.appendChild(el);
        pips.push(el);
      }
    }
    for (let i = 0; i < MAX_BUCKETS; i++) {
      const on = i < G.buckets;
      pips[i].classList.toggle('on', on);
      pips[i].classList.toggle('gone', !on);
    }
  }

  function syncHud() {
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    comboEl.textContent = '×' + G.combo;
    const g = groupNow();
    if (G.mode === 'title') {
      stageLabel.textContent = '接弹';
      stageLabel.className = '';
      tagLabel.textContent = 'KABOOM';
      tagLabel.className = '';
      waveLabel.textContent = '—';
    } else {
      stageLabel.textContent = '第 ' + (G.group + 1) + ' 波';
      stageLabel.className = G.group >= 5 ? 'hot' : (G.buckets === 1 ? 'warn' : '');
      tagLabel.textContent = G.kind === 'storm' ? 'STORM' : 'CLASSIC';
      tagLabel.className = G.buckets === 1 ? 'warn' : '';
      waveLabel.textContent = g.pts + '分/弹';
    }
    if (G.mode === 'play') {
      hintEl.textContent = G.buckets === 1 ? '最后一桶 · 别漏' : OPS_PLAY;
      hintEl.className = G.buckets === 1 ? 'hint warn' : 'hint';
    }
    renderPips();
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = mag > 10 ? 0.94 : 1.045;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.55, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || 'o',
        g: spec.g == null ? 420 : spec.g
      });
    }
  }

  function sparkAt(x, y) {
    if (sparks.length > 80) sparks.shift();
    sparks.push({
      x: x,
      y: y,
      vx: rand(-40, 40),
      vy: rand(-80, -10),
      life: rand(0.08, 0.22),
      max: 0.22,
      r: rand(1.1, 2.4)
    });
  }

  function blast(x, y, big) {
    if (blasts.length > 18) blasts.shift();
    blasts.push({ x: x, y: y, t: 1, r: 8, max: big ? 78 : 46, big: !!big });
    if (rings.length > 16) rings.shift();
    rings.push({ x: x, y: y, r: 6, max: big ? 90 : 52, t: 1, col: big ? 'o' : 'g' });
  }

  function pop(x, y, text, col) {
    if (pops.length > 14) pops.shift();
    pops.push({ x: x, y: y, text: text, col: col || '#ffe36b', t: 1, vy: -70 });
  }

  function ring(x, y, max, col) {
    if (rings.length > 16) rings.shift();
    rings.push({ x: x, y: y, r: 8, max: max || 48, t: 1, col: col || 'c' });
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 48; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.22 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 18 + 8,
        w: Math.random() * 0.6 + 0.2
      });
    }
  }

  function canDrop() {
    const cap = G.kind === 'storm' ? 16 : 12;
    if (bombs.length >= cap) return false;
    const x = colX(bomber.col);
    for (let i = 0; i < bombs.length; i++) {
      const b = bombs[i];
      if (b.blast >= 0) continue;
      if (Math.abs(b.x - x) < 10 && b.y < SPAWN_Y + 78) return false;
    }
    return true;
  }

  function pickNextCol() {
    const n = cols();
    let step = 1;
    const g = G.group;
    if (Math.random() < 0.16 + g * 0.04) step = 2;
    if (Math.random() < 0.08 + g * 0.035) step = 3;
    if (G.kind === 'storm' && Math.random() < 0.18) step = 1 + ((Math.random() * 4) | 0);
    if (Math.random() < 0.2 + g * 0.035) bomber.face *= -1;
    let next = bomber.col + bomber.face * step;
    if (next < 0 || next >= n) {
      bomber.face *= -1;
      next = clamp(bomber.col + bomber.face * step, 0, n - 1);
    }
    if (next === bomber.col) next = clamp(bomber.col + bomber.face, 0, n - 1);
    bomber.col = next;
  }

  function dropBomb() {
    const x = colX(bomber.col);
    bombs.push({
      x: x,
      y: SPAWN_Y,
      vy: fallSpeed(),
      fuse: Math.random() * TAU,
      sparkT: 0,
      blast: -1
    });
    bomber.arm = 1;
    bomber.hold = false;
    emit(4, {
      x: x, y: SPAWN_Y - 8, j: 4,
      vx0: -30, vx1: 30, vy0: -20, vy1: 40,
      r0: 1.2, r1: 2.4, life: 0.22, col: 'g', g: 80
    });
  }

  function detonate(b, first) {
    blast(b.x, b.y, first);
    emit(first ? 36 : 18, {
      x: b.x, y: b.y, j: 8,
      vx0: -220, vx1: 220, vy0: -280, vy1: 80,
      r0: 1.6, r1: 4.4, life: first ? 0.7 : 0.45, col: 'o', g: 360
    });
    emit(first ? 16 : 8, {
      x: b.x, y: b.y, j: 6,
      vx0: -140, vx1: 140, vy0: -200, vy1: 40,
      r0: 1.2, r1: 2.8, life: 0.5, col: 'g', g: 200
    });
    emit(8, {
      x: b.x, y: b.y, j: 10,
      vx0: -90, vx1: 90, vy0: -120, vy1: 60,
      r0: 1, r1: 2.2, life: 0.35, col: 'm', g: 140
    });
    audio.boom(!first);
  }

  function missBomb(b) {
    if (G.booming) return;
    G.booming = true;
    G.combo = 0;
    setComboHud();
    b.blast = 0;
    for (let i = 0; i < bombs.length; i++) {
      const o = bombs[i];
      if (o === b) continue;
      o.blast = hypot(o.x - b.x, o.y - b.y) / 1500 + 0.02;
    }
    kick(15);
    G.flash = 0.9;
    G.flashCol = '#ff4a2e';
    hitStop(0.072);
    if (G.mode === 'play') {
      G.buckets = Math.max(0, G.buckets - 1);
      G.missed += 1;
      renderPips();
      toast(G.buckets <= 0 ? '炸了' : '少一桶', 'warn');
    } else {
      toast('落地', 'warn');
    }
    detonate(b, true);
    G.boomWait = G.buckets <= 0 && G.mode === 'play' ? 1.05 : 0.82;
  }

  function catchBomb(b, idx) {
    const g = bucketGeom(idx);
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.squash[idx] = 1;
    G.wet[idx] = 1;
    ring(b.x, g.y + 8, 44, 'c');
    emit(22, {
      x: b.x, y: g.y + 6, j: 10,
      vx0: -160, vx1: 160, vy0: -240, vy1: -20,
      r0: 1.4, r1: 3.4, life: 0.42, col: 'c', g: 520
    });
    emit(10, {
      x: b.x, y: g.y + 4, j: 6,
      vx0: -70, vx1: 70, vy0: -160, vy1: -40,
      r0: 1, r1: 2.2, life: 0.32, col: 'w', g: 280
    });
    hitStop(0.034 + Math.min(0.028, G.combo * 0.002));
    kick(5 + Math.min(6, G.combo * 0.35));
    G.flash = Math.max(G.flash, 0.22);
    G.flashCol = '#00f0ff';
    audio.catch(G.combo);
    audio.splash();
    setComboHud();
    if (G.mode === 'play') {
      G.caught += 1;
      G.caughtAll += 1;
      const pts = groupNow().pts * comboMult();
      addScore(pts, b.x, g.y);
      if (G.combo === 5 || G.combo === 10 || G.combo === 20 || G.combo === 40) {
        audio.combo(G.combo);
        toast(G.combo + ' 连', 'gold');
        pop(b.x, g.y - 36, '×' + G.combo, '#ffe36b');
      }
      if (G.caught >= groupNow().n) {
        if (G.group < GROUPS.length - 1) {
          G.group += 1;
          toast('加速 · 第 ' + (G.group + 1) + ' 波', 'gold');
          audio.level();
          G.lock = 0.42;
        }
        G.caught = 0;
      }
    }
    syncHud();
  }

  function checkExtra() {
    let th = extraAt(G.nextExtra);
    while (th && G.score >= th) {
      G.nextExtra += 1;
      if (G.buckets < MAX_BUCKETS) {
        G.buckets += 1;
        G.squash[G.buckets - 1] = 1;
        G.wet[G.buckets - 1] = 1;
        const g = bucketGeom(G.buckets - 1);
        emit(24, {
          x: g.x, y: g.y, j: 12,
          vx0: -120, vx1: 120, vy0: -180, vy1: 20,
          r0: 1.4, r1: 3.2, life: 0.5, col: 'g', g: 240
        });
        ring(g.x, g.y, 56, 'g');
        toast('加桶', 'gold');
        audio.extra();
        pop(g.x, g.y, '加桶', '#ffe36b');
      } else {
        toast('桶满', 'gold');
      }
      th = extraAt(G.nextExtra);
      renderPips();
    }
  }

  function finishBoom() {
    bombs.length = 0;
    G.booming = false;
    G.boomWait = 0;
    if (G.mode === 'play') {
      if (G.buckets <= 0) {
        endRun();
        return;
      }
      G.group = Math.max(0, G.group - 2);
      G.caught = 0;
      G.lock = 0.55;
      bomber.dropCd = 0.45;
      bomber.hold = true;
      syncHud();
    } else {
      G.buckets = MAX_BUCKETS;
      G.lock = 0.4;
      bomber.dropCd = 0.5;
      renderPips();
    }
  }

  function hitIndex(b) {
    const r = BOMB_R;
    const n = G.buckets;
    for (let i = n - 1; i >= 0; i--) {
      const g = bucketGeom(i);
      const left = g.x - g.w * 0.5 + 5;
      const right = g.x + g.w * 0.5 - 5;
      const top = g.y + 1;
      const bot = g.y + g.h + 2;
      if (b.x + r * 0.4 > left && b.x - r * 0.4 < right && b.y + r > top && b.y - r * 0.15 < bot) {
        return i;
      }
    }
    return -1;
  }

  function updateBomber(dt) {
    bomber.arm = Math.max(0, bomber.arm - dt * 3.4);
    if (G.booming || G.lock > 0) {
      bomber.hold = true;
      return;
    }
    bomber.dropCd -= dt;
    const tx = colX(bomber.col);
    const spd = walkSpeed();
    const dx = tx - bomber.x;
    if (Math.abs(dx) > 2.4) {
      const dir = dx > 0 ? 1 : -1;
      bomber.x += dir * spd * dt;
      bomber.face = dir;
      if ((dir > 0 && bomber.x > tx) || (dir < 0 && bomber.x < tx)) bomber.x = tx;
      bomber.hold = true;
    } else {
      bomber.x = tx;
      if (bomber.dropCd <= 0 && canDrop()) {
        dropBomb();
        pickNextCol();
        bomber.dropCd = dropGap();
      } else {
        bomber.hold = bomber.dropCd < 0.12 || !canDrop();
      }
    }
  }

  function updateBuckets(dt) {
    const lo = pxMin();
    const hi = pxMax();
    if (G.mode === 'title') {
      let target = WORLD_W * 0.5;
      let bestY = -1;
      for (let i = 0; i < bombs.length; i++) {
        const b = bombs[i];
        if (b.blast >= 0) continue;
        if (b.y > bestY && b.y < GROUND - 30) {
          bestY = b.y;
          target = b.x + Math.sin(G.clock * 0.7) * 8;
        }
      }
      if (Math.sin(G.clock * 0.35) > 0.82) target += 70;
      G.px = lerp(G.px, clamp(target, lo, hi), 1 - Math.exp(-dt * 5.4));
      G.vx = (clamp(target, lo, hi) - G.px) / Math.max(dt, 0.001) * 0.15;
    } else if (G.mode === 'play') {
      if (G.steer === 'ptr' && pointer.over) {
        const nx = clamp(pointer.x, lo, hi);
        const k = 1 - Math.exp(-dt * 26);
        const prev = G.px;
        G.px = lerp(G.px, nx, k);
        G.vx = (G.px - prev) / Math.max(dt, 0.001);
      } else {
        const ax = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
        if (ax) {
          G.vx += ax * KEY_ACCEL * dt;
          G.vx = clamp(G.vx, -KEY_MAX, KEY_MAX);
        } else {
          G.vx *= Math.exp(-dt * 9.5);
          if (Math.abs(G.vx) < 8) G.vx = 0;
        }
        G.px += G.vx * dt;
      }
    }
    G.px = clamp(G.px, lo, hi);
    const want = clamp(G.vx / 920, -1, 1);
    G.slosh = lerp(G.slosh, want, 1 - Math.exp(-dt * 9));
    G.tilt = G.slosh * 0.15;
    for (let i = 0; i < 3; i++) {
      G.squash[i] = Math.max(0, G.squash[i] - dt * 7.2);
      G.wet[i] = Math.max(0, G.wet[i] - dt * 2.8);
    }
  }

  function updateBombs(dt) {
    if (G.booming) {
      for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        if (b.blast < 0) b.blast = 0.02;
        b.blast -= dt;
        if (b.blast <= 0) {
          detonate(b, false);
          bombs.splice(i, 1);
        }
      }
      G.boomWait -= dt;
      if (G.boomWait <= 0 || bombs.length === 0) finishBoom();
      return;
    }
    const fall = fallSpeed();
    for (let i = bombs.length - 1; i >= 0; i--) {
      if (G.booming) break;
      const b = bombs[i];
      b.vy = fall;
      b.y += b.vy * dt;
      b.fuse += dt * 18;
      b.sparkT -= dt;
      if (b.sparkT <= 0) {
        b.sparkT = rand(0.03, 0.07);
        const fx = b.x + Math.sin(b.fuse) * 3.2;
        const fy = b.y - BOMB_R - 9 - Math.abs(Math.cos(b.fuse * 0.7)) * 3;
        sparkAt(fx, fy);
      }
      const idx = hitIndex(b);
      if (idx >= 0) {
        catchBomb(b, idx);
        bombs.splice(i, 1);
        continue;
      }
      if (b.y - BOMB_R > GROUND - 6) {
        missBomb(b);
        bombs.splice(i, 1);
        break;
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.5);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 9));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.992;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 180 * dt;
      if (s.life <= 0) sparks.splice(i, 1);
    }
    for (let i = blasts.length - 1; i >= 0; i--) {
      const b = blasts[i];
      b.t -= dt * (b.big ? 1.6 : 2.1);
      b.r += (b.max - b.r) * 10 * dt;
      if (b.t <= 0) blasts.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t -= dt * 1.7;
      r.r += (r.max - r.r) * 8 * dt;
      if (r.t <= 0) rings.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t -= dt * 0.95;
      p.y += p.vy * dt;
      p.vy += 50 * dt;
      if (p.t <= 0) pops.splice(i, 1);
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    updateBomber(dt);
    updateBuckets(dt);
    updateBombs(dt);
  }

  function updateTitle(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    if (G.group > 1) G.group = 1;
    updateBomber(dt);
    updateBuckets(dt);
    updateBombs(dt);
  }

  function clearField() {
    bombs.length = 0;
    particles.length = 0;
    sparks.length = 0;
    blasts.length = 0;
    rings.length = 0;
    pops.length = 0;
  }

  function startRun(kind) {
    audio.ensure();
    G.mode = 'play';
    G.kind = kind === 'storm' ? 'storm' : 'classic';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.buckets = MAX_BUCKETS;
    G.group = 0;
    G.caught = 0;
    G.caughtAll = 0;
    G.missed = 0;
    G.nextExtra = 0;
    G.lock = 0.38;
    G.booming = false;
    G.boomWait = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.newBest = false;
    G.px = WORLD_W * 0.5;
    G.vx = 0;
    G.slosh = 0;
    G.tilt = 0;
    G.squash = [0, 0, 0];
    G.wet = [0, 0, 0];
    G.steer = pointer.over ? 'ptr' : 'key';
    bomber.x = WORLD_W * 0.5;
    bomber.col = (cols() / 2) | 0;
    bomber.face = 1;
    bomber.arm = 0;
    bomber.dropCd = 0.42;
    bomber.hold = true;
    clearField();
    hideOverlay();
    hideToast();
    scoreEl.textContent = '0';
    comboEl.textContent = '×0';
    bestEl.textContent = String(currentBest());
    audio.start();
    toast(G.kind === 'storm' ? '暴雨 · 十二列' : '经典 · 八列', G.kind === 'storm' ? 'gold' : '');
    syncHud();
    canvas.focus();
  }

  function endRun() {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    considerBest();
    audio.over();
    showOverlay();
    syncHud();
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') startRun('classic');
    else startRun(G.kind);
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function showOverlay() {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (G.mode === 'title') {
      ovKicker.textContent = 'KABOOM';
      ovTitle.textContent = '接弹';
      ovLead.innerHTML = '炸弹往下落，水桶往上接。<br />接得越稳越快，漏一发少一桶。';
      ovOps.textContent = OPS_TITLE;
      btnClassic.textContent = '经典';
      btnStorm.textContent = '暴雨';
      hintEl.textContent = '指针移动 · 接住炸弹 · R 重开';
      hintEl.className = 'hint';
    } else {
      panel.classList.add(G.newBest ? 'win' : 'lose');
      ovKicker.textContent = G.newBest ? 'RECORD' : 'KABOOM';
      ovTitle.textContent = G.newBest ? '新纪录' : '炸了';
      ovLead.textContent = '接住 ' + G.caughtAll + ' · 漏 ' + G.missed + ' · 最高连 ×' + G.maxCombo + ' · 第 ' + (G.group + 1) + ' 波 · ' + G.score + ' 分';
      ovOps.textContent = OPS_PLAY;
      btnClassic.textContent = G.kind === 'classic' ? '再接' : '经典';
      btnStorm.textContent = G.kind === 'storm' ? '再接' : '暴雨';
      hintEl.textContent = G.newBest ? '新纪录已写入' : '落地即炸 · R 再来';
      hintEl.className = G.newBest ? 'hint hot' : 'hint warn';
    }
    bestEl.textContent = String(currentBest());
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function colOf(c, a) {
    if (c === 'c') return 'rgba(0,240,255,' + a + ')';
    if (c === 'g') return 'rgba(255,227,107,' + a + ')';
    if (c === 'm') return 'rgba(255,61,184,' + a + ')';
    if (c === 'w') return 'rgba(255,244,230,' + a + ')';
    return 'rgba(255,74,46,' + a + ')';
  }

  function drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    grd.addColorStop(0, '#1c080c');
    grd.addColorStop(0.18, '#12060a');
    grd.addColorStop(0.7, '#07040e');
    grd.addColorStop(1, '#050814');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    const glow = ctx.createRadialGradient(WORLD_W * 0.5, 20, 10, WORLD_W * 0.5, 40, 280);
    glow.addColorStop(0, 'rgba(255,74,46,0.22)');
    glow.addColorStop(1, 'rgba(255,74,46,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WORLD_W, 180);

    const n = cols();
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = colX(i);
      ctx.strokeStyle = 'rgba(0,240,255,' + (0.045 + (i === bomber.col ? 0.08 : 0)) + ')';
      ctx.lineWidth = i === bomber.col ? 1.6 : 1;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.moveTo(x, ROOF + 8);
      ctx.lineTo(x, GROUND - 6);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = '#14080c';
    ctx.fillRect(0, 0, WORLD_W, ROOF);
    ctx.fillStyle = '#1c0c12';
    ctx.fillRect(0, ROOF - 8, WORLD_W, 10);
    ctx.strokeStyle = 'rgba(255,74,46,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, ROOF);
    ctx.lineTo(WORLD_W, ROOF);
    ctx.stroke();

    const brickW = 28;
    for (let y = 8; y < ROOF - 10; y += 10) {
      const off = ((y / 10) | 0) % 2 ? 14 : 0;
      for (let x = -10 + off; x < WORLD_W; x += brickW) {
        ctx.strokeStyle = 'rgba(255,90,50,0.12)';
        ctx.strokeRect(x + 0.5, y + 0.5, brickW - 2, 8);
      }
    }

    ctx.fillStyle = '#0a0610';
    ctx.fillRect(0, GROUND, WORLD_W, WORLD_H - GROUND);
    const floor = ctx.createLinearGradient(0, GROUND - 4, 0, WORLD_H);
    floor.addColorStop(0, 'rgba(255,74,46,0.45)');
    floor.addColorStop(0.08, 'rgba(12,8,18,0.95)');
    floor.addColorStop(1, '#05030c');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND - 3, WORLD_W, WORLD_H - GROUND + 3);
    ctx.strokeStyle = 'rgba(0,240,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(18, GROUND + 10);
    ctx.lineTo(WORLD_W - 18, GROUND + 10);
    ctx.stroke();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const yy = (m.y + G.clock * m.s) % WORLD_H;
      const xx = m.x + Math.sin(G.clock * m.w + m.p) * 8;
      ctx.fillStyle = 'rgba(255,140,80,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(xx, yy, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawBomber() {
    const x = bomber.x;
    const y = ROOF - 2;
    const walk = Math.sin(x * 0.22);
    const face = bomber.face;
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 16, 4, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,74,46,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, 2 + walk * 3);
    ctx.lineTo(-5, 12);
    ctx.moveTo(7, 2 - walk * 3);
    ctx.lineTo(5, 12);
    ctx.stroke();

    ctx.fillStyle = '#2a1020';
    roundRect(-9, -16, 18, 18, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,61,184,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.moveTo(-8, -5);
    ctx.lineTo(8, -5);
    ctx.stroke();

    ctx.fillStyle = '#f3c7b0';
    ctx.beginPath();
    ctx.arc(face * 1, -22, 7.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0a10';
    ctx.beginPath();
    ctx.arc(face * 3.2, -23.2, 1.3, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#1a0810';
    roundRect(-11, -32, 22, 7, 2);
    ctx.fill();
    ctx.fillRect(-16, -27, 32, 2.4);
    ctx.strokeStyle = '#ff4a2e';
    ctx.lineWidth = 1;
    roundRect(-11, -32, 22, 7, 2);
    ctx.stroke();

    ctx.save();
    const armA = bomber.arm > 0 ? -0.9 * bomber.arm : -0.25;
    ctx.translate(face * 8, -12);
    ctx.rotate(armA * face);
    ctx.strokeStyle = '#f3c7b0';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(face * 2, 12);
    ctx.stroke();
    if (bomber.hold || bomber.dropCd < 0.18) {
      ctx.fillStyle = '#201824';
      ctx.beginPath();
      ctx.arc(face * 2, 16, 5.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#ff4a2e';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  function drawBomb(b) {
    const x = b.x;
    const y = b.y;
    const fuseX = x + Math.sin(b.fuse) * 2.4;
    const fuseY = y - BOMB_R - 8 - Math.abs(Math.cos(b.fuse * 0.65)) * 2.5;
    ctx.save();
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - BOMB_R + 2);
    ctx.quadraticCurveTo(x + 6, y - BOMB_R - 4, fuseX, fuseY);
    ctx.stroke();
    const pulse = 0.65 + Math.sin(b.fuse * 2.4) * 0.35;
    ctx.fillStyle = 'rgba(255,74,46,' + (0.35 + pulse * 0.45) + ')';
    ctx.beginPath();
    ctx.arc(fuseX, fuseY, 2.4 + pulse, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(fuseX, fuseY, 1.15, 0, TAU);
    ctx.fill();

    const grd = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, BOMB_R + 1);
    grd.addColorStop(0, '#4a3048');
    grd.addColorStop(0.45, '#201824');
    grd.addColorStop(1, '#120810');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, BOMB_R, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,74,46,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,227,107,0.35)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(x, y, BOMB_R - 2.2, 0.2, 1.4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(x - 4.2, y - 4.6, 3.2, 2.1, -0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBucket(i) {
    const g = bucketGeom(i);
    const sq = G.squash[i] || 0;
    const wet = G.wet[i] || 0;
    const cx = g.x;
    const cy = g.y + g.h * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(G.tilt);
    ctx.scale(1 + sq * 0.16, 1 - sq * 0.22);
    ctx.translate(-cx, -cy);

    const top = g.y;
    const bot = g.y + g.h;
    const mouth = g.w * 0.5;
    const base = g.w * 0.34;
    ctx.beginPath();
    ctx.moveTo(cx - mouth + 2, top + 6);
    ctx.lineTo(cx + mouth - 2, top + 6);
    ctx.lineTo(cx + base, bot);
    ctx.lineTo(cx - base, bot);
    ctx.closePath();
    const metal = ctx.createLinearGradient(cx - mouth, top, cx + mouth, bot);
    metal.addColorStop(0, '#1a3a44');
    metal.addColorStop(0.4, '#0c1c24');
    metal.addColorStop(1, '#070e14');
    ctx.fillStyle = metal;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,' + (0.62 + wet * 0.35) + ')';
    ctx.lineWidth = 1.7;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - mouth + 4, top + 7);
    ctx.lineTo(cx + mouth - 4, top + 7);
    ctx.lineTo(cx + base - 3, bot - 2);
    ctx.lineTo(cx - base + 3, bot - 2);
    ctx.clip();
    const water = ctx.createLinearGradient(0, top, 0, bot);
    water.addColorStop(0, 'rgba(10,40,50,0)');
    water.addColorStop(0.28, wet > 0.2 ? '#7af6ff' : '#1aa8b8');
    water.addColorStop(0.55, '#0d7a88');
    water.addColorStop(1, '#064048');
    ctx.fillStyle = water;
    ctx.fillRect(cx - mouth, top, mouth * 2, g.h);
    const wy = top + g.h * 0.34 + G.slosh * 1.4;
    const wx = G.slosh * 6;
    ctx.fillStyle = wet > 0.15 ? '#c8ffff' : '#4ee7f2';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(cx + wx, wy, mouth * 0.72, 4.4, G.slosh * 0.22, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.35 + wet * 0.3;
    ctx.fillStyle = '#e8ffff';
    ctx.beginPath();
    ctx.ellipse(cx + wx - 8, wy - 1, 9, 2, -0.25, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(cx, top + 6, mouth - 1, 4.6, 0, 0, TAU);
    ctx.fillStyle = 'rgba(8,18,24,0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,255,255,' + (0.55 + wet * 0.35) + ')';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, top + 6, mouth - 5, 2.8, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,240,255,0.28)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx - mouth + 3, top + 11, 6, Math.PI * 0.15, Math.PI * 1.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + mouth - 3, top + 11, 6, -0.05, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = colOf(r.col, r.t * 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < blasts.length; i++) {
      const b = blasts[i];
      const grd = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.r);
      grd.addColorStop(0, 'rgba(255,227,107,' + (b.t * 0.8) + ')');
      grd.addColorStop(0.4, 'rgba(255,74,46,' + (b.t * 0.45) + ')');
      grd.addColorStop(1, 'rgba(255,61,184,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = colOf(p.col, Math.max(0, p.life / p.max));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.fillStyle = 'rgba(255,227,107,' + (s.life / s.max) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.font = '700 14px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      ctx.fillStyle = p.col;
      ctx.globalAlpha = Math.max(0, p.t);
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawWorld() {
    drawBackground();
    drawBomber();
    for (let i = 0; i < bombs.length; i++) drawBomb(bombs[i]);
    for (let i = 0; i < G.buckets; i++) drawBucket(i);
    drawFx();
    if (G.mode === 'play' && G.combo >= 5) {
      ctx.save();
      ctx.font = '800 22px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,227,107,' + (0.35 + Math.sin(G.clock * 8) * 0.15) + ')';
      ctx.fillText('×' + G.combo, WORLD_W * 0.5, 48);
      ctx.restore();
    }
  }

  function draw() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, view.w, view.h);

    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake, G.shake);
    }
    const punch = REDUCE ? 1 : G.punch;
    ctx.save();
    ctx.beginPath();
    const rw = WORLD_W * view.scale;
    const rh = WORLD_H * view.scale;
    roundRect(view.ox, view.oy, rw, rh, 14);
    ctx.clip();
    ctx.translate(view.ox + shx + rw * 0.5, view.oy + shy + rh * 0.5);
    ctx.scale(view.scale * punch, view.scale * punch);
    ctx.translate(-WORLD_W * 0.5, -WORLD_H * 0.5);
    drawWorld();
    ctx.restore();

    if (G.flash > 0) {
      ctx.save();
      ctx.globalAlpha = G.flash * 0.28;
      ctx.fillStyle = G.flashCol;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    }
  }

  function resize() {
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    canvas.width = Math.max(1, (view.w * view.dpr) | 0);
    canvas.height = Math.max(1, (view.h * view.dpr) | 0);
    canvas.style.width = view.w + 'px';
    canvas.style.height = view.h + 'px';
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    view.scale = Math.min(view.w / WORLD_W, view.h / WORLD_H);
    view.ox = (view.w - WORLD_W * view.scale) * 0.5;
    view.oy = (view.h - WORLD_H * view.scale) * 0.5;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale
    };
  }

  function loop(now) {
    const t = now * 0.001;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.08) dt = 0.08;
    G.t = t;
    if (!G.paused) {
      if (G.stop > 0 && !REDUCE) {
        G.stop -= dt;
      } else {
        acc += dt;
        if (acc > 0.12) acc = 0.12;
        while (acc >= STEP) {
          if (G.mode === 'title') updateTitle(STEP);
          else if (G.mode === 'play') updatePlay(STEP);
          else {
            G.clock += STEP;
            if (G.booming) updateBombs(STEP);
          }
          acc -= STEP;
        }
      }
      updateFx(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space') {
      e.preventDefault();
    }
    if (e.code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (e.code === 'KeyR') {
      e.preventDefault();
      retry();
      return;
    }
    if (G.mode === 'title' || G.mode === 'lose') {
      if (e.code === 'Digit2' || e.code === 'Numpad2') {
        e.preventDefault();
        startRun('storm');
        return;
      }
      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        startRun(e.code === 'Enter' || e.code === 'Space' ? (G.mode === 'lose' ? G.kind : 'classic') : 'classic');
        return;
      }
      return;
    }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      keys.l = true;
      G.steer = 'key';
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      keys.r = true;
      G.steer = 'key';
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = false;
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (G.mode !== 'play') return;
    e.preventDefault();
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.over = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    G.steer = 'ptr';
  }, { passive: false });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.over = true;
    if (G.mode === 'play') G.steer = 'ptr';
  }, { passive: false });

  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    pointer.down = false;
    pointer.id = null;
  });

  canvas.addEventListener('pointercancel', function () {
    pointer.down = false;
    pointer.id = null;
  });

  canvas.addEventListener('pointerenter', function () {
    pointer.over = true;
  });

  canvas.addEventListener('pointerleave', function () {
    pointer.over = false;
    pointer.down = false;
  });

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  btnClassic.addEventListener('click', function () {
    audio.ensure();
    startRun('classic');
  });
  btnStorm.addEventListener('click', function () {
    audio.ensure();
    startRun('storm');
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    retry();
  });

  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (!document.hidden) {
      last = performance.now() * 0.001;
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  loadBest();
  makeMotes();
  resize();
  G.kind = 'classic';
  bomber.col = 4;
  bomber.x = colX(4);
  showOverlay();
  syncHud();
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
