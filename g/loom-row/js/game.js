'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const SHED_Y = 226;
  const TOP_Y = 78;
  const FELL_Y = 344;
  const CLOTH_BOT = 488;
  const WARP_L = 250;
  const WARP_R = 710;
  const PARK_L = 196;
  const PARK_R = 764;
  const HIT = 12;
  const SHUTTLE_W = 54;
  const SHUTTLE_H = 17;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-loom-row-mute';

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };

  const STAGES = [
    {
      name: '初开口', sub: 'FIRST', rows: 3, period: 2.85, open: 0.5, snap: 0.14,
      warps: 10, speed: 490, wave: 0, time: 34, guide: true, amp: 66,
      hint: '开口发亮再放梭', toast: '等经线分开，开口亮金再放'
    },
    {
      name: '来回', sub: 'ROUND', rows: 5, period: 2.45, open: 0.42, snap: 0.13,
      warps: 12, speed: 530, wave: 0, time: 36, guide: true, amp: 64,
      hint: '梭会换边，开口时再送回去', toast: '织一梭，换边再织回来'
    },
    {
      name: '窄口', sub: 'NARROW', rows: 6, period: 2.15, open: 0.34, snap: 0.12,
      warps: 12, speed: 620, wave: 0, time: 32, amp: 62,
      hint: '开口更短，看准了再放', toast: '窗口更窄，别抢拍'
    },
    {
      name: '跟波', sub: 'WAVE', rows: 6, period: 2.5, open: 0.4, snap: 0.12,
      warps: 14, speed: 400, wave: 0.05, time: 38, amp: 62,
      hint: '开口从这边游到那边，跟着走', toast: '开口在走，顺着波放梭'
    },
    {
      name: '密经', sub: 'DENSE', rows: 7, period: 1.95, open: 0.34, snap: 0.11,
      warps: 20, speed: 700, wave: 0, time: 32, amp: 58,
      hint: '经线更密，开口更窄', toast: '线更密，照样等开口'
    },
    {
      name: '急口', sub: 'RUSH', rows: 8, period: 1.58, open: 0.38, snap: 0.11,
      warps: 14, speed: 820, wave: 0, time: 30, amp: 58,
      hint: '节奏更快，别抢拍', toast: '快了，开口一亮就放'
    },
    {
      name: '斜口', sub: 'SLANT', rows: 8, period: 2.2, open: 0.38, snap: 0.11,
      warps: 16, speed: 420, wave: 0.05, time: 36, amp: 58,
      hint: '开口斜着走，晚放会绞', toast: '斜开口，从进梭那边跟过去'
    },
    {
      name: '乱经', sub: 'STRAY', rows: 8, period: 1.95, open: 0.42, snap: 0.11,
      warps: 16, speed: 640, wave: 0.02, stray: true, strayLag: 0.08, time: 36, amp: 56,
      hint: '有几根经线慢半拍', toast: '几根经线会晚开，等齐了再放'
    },
    {
      name: '双息', sub: 'BREATH', rows: 6, period: 2.15, open: 0.4, snap: 0.12,
      warps: 16, speed: 640, wave: 0, breath: 2, time: 36, amp: 68,
      hint: '开口一阵一阵，等大开口', toast: '小开口穿不过，等经线张大'
    },
    {
      name: '终幅', sub: 'FINALE', rows: 10, period: 1.7, open: 0.34, snap: 0.1,
      warps: 22, speed: 780, wave: 0.04, stray: true, strayLag: 0.07, time: 42, amp: 56,
      hint: '又密又斜，十梭织完', toast: '终幅。跟着斜口，十梭'
    }
  ];

  const WEFT_COL = [MAG, CYN, GOLD];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovBtn = document.getElementById('ov-btn');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnFire = document.getElementById('btn-fire');
  const stageLabel = document.getElementById('stage-label');
  const shedLabel = document.getElementById('shed-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };

  const particles = [];
  const motes = [];
  const trail = [];
  const wefts = [];
  const floats = [];
  const ripples = [];

  const G = {
    mode: 'title',
    stage: 0,
    spec: STAGES[0],
    t: 0,
    clock: 0,
    lives: LIVES,
    time: 34,
    timeMax: 34,
    rows: 0,
    nWarp: 10,
    dir: 1,
    sx: PARK_L,
    sy: SHED_Y,
    flying: false,
    speed: 490,
    ampNow: 64,
    entryOpen: false,
    wasEntry: false,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: '#00f0ff',
    beatT: 0,
    toastT: 0,
    paused: false,
    squash: 1,
    taught: false
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
  function wrap01(u) {
    return u - Math.floor(u);
  }
  function ease(t) {
    const u = clamp(t, 0, 1);
    return u * u * (3 - 2 * u);
  }
  function rgb(c, a) {
    if (a == null) return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    tick: null,
    tickGain: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
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
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, from, to) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(from || 900, t);
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      f.Q.value = 0.9;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    whoosh: function () {
      this.ensure();
      this.noise(0.16, 0.07, 1400, 380);
      this.beep(520, 0.12, 'triangle', 0.04, 220);
    },
    openTick: function () {
      this.ensure();
      this.beep(880, 0.05, 'sine', 0.028, 1320);
      this.beep(1320, 0.07, 'triangle', 0.016, 1760);
    },
    weave: function () {
      this.ensure();
      this.beep(392, 0.1, 'triangle', 0.06, 784);
      this.beep(588, 0.16, 'sine', 0.045, 1176);
    },
    snag: function () {
      this.ensure();
      this.noise(0.2, 0.11, 700, 90);
      this.beep(180, 0.22, 'sawtooth', 0.07, 52);
    },
    win: function () {
      this.ensure();
      this.beep(392, 0.14, 'triangle', 0.08, 784);
      this.beep(588, 0.2, 'sine', 0.06, 1176);
      this.beep(784, 0.36, 'sine', 0.05, 1568);
    },
    lose: function () {
      this.ensure();
      this.beep(196, 0.4, 'sawtooth', 0.075, 55);
      this.beep(98, 0.58, 'square', 0.04, 40);
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.12, 'sine', 0.055, 392);
      this.beep(294, 0.16, 'triangle', 0.04, 588);
    },
    stage: function () {
      this.ensure();
      this.beep(440, 0.1, 'triangle', 0.05, 660);
    },
    tickDrone: function (play, openAmt, flying) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 46;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      if (!this.tick) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 110;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.tick = o;
        this.tickGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(44 + openAmt * 18 + (flying ? 10 : 0), t, 0.16);
      this.droneGain.gain.setTargetAtTime(play ? 0.014 : 0.0001, t, 0.22);
      this.tick.frequency.setTargetAtTime(90 + openAmt * 220 + (flying ? 80 : 0), t, 0.08);
      this.tickGain.gain.setTargetAtTime(play ? (0.004 + openAmt * 0.02 + (flying ? 0.012 : 0)) : 0.0001, t, 0.07);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col
      });
    }
  }

  function ripple(x, y, col, r) {
    ripples.push({ x: x, y: y, t: 1, r: 8, max: r || 48, col: col });
    if (ripples.length > 10) ripples.shift();
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(40, WORLD_W - 40),
        y: rand(40, WORLD_H - 40),
        r: rand(0.6, 1.8),
        s: rand(0.12, 0.4),
        p: rand(0, TAU),
        col: Math.random() < 0.5 ? 'm' : 'c'
      });
    }
  }
  seedMotes();

  function isStray(i) {
    const n = G.nWarp;
    if (!G.spec.stray) return false;
    return i === 3 || i === ((n * 0.5) | 0) || i === n - 4;
  }

  function warpX(i) {
    const n = G.nWarp;
    if (n <= 1) return (WARP_L + WARP_R) * 0.5;
    return WARP_L + (WARP_R - WARP_L) * i / (n - 1);
  }

  function shedUnit(u, open, snap) {
    u = wrap01(u);
    const r = Math.max(0.0008, snap);
    const h = Math.max(0.02, open);
    const f = r;
    if (u < r) return u / r;
    if (u < r + h) return 1;
    if (u < r + h + f) return 1 - (u - r - h) / f;
    return 0;
  }

  function warpPhase(i, t, dir) {
    const spec = G.spec;
    let u = t / spec.period;
    u -= i * spec.wave * dir;
    if (isStray(i)) u -= spec.strayLag || 0.1;
    return wrap01(u);
  }

  function warpUnit(i, t, dir) {
    return shedUnit(warpPhase(i, t, dir), G.spec.open, G.spec.snap);
  }

  function warpLift(i, t, dir) {
    const sign = (i % 2 === 0) ? -1 : 1;
    return sign * G.ampNow * warpUnit(i, t, dir);
  }

  function updateAmp(t) {
    const spec = G.spec;
    if (spec.breath) {
      const cycle = Math.floor(t / spec.period);
      const big = (cycle % spec.breath) === 0;
      G.ampNow = spec.amp * (big ? 1 : 0.12);
    } else {
      G.ampNow = spec.amp;
    }
  }

  function entryOpen() {
    const n = G.nWarp;
    const dir = G.dir;
    const hits = HIT + 4;
    const t = G.clock;
    if (G.spec.wave <= 0.03) {
      for (let i = 0; i < n; i++) {
        if (G.ampNow * warpUnit(i, t, dir) < hits) return false;
      }
      return true;
    }
    const i = dir > 0 ? 0 : n - 1;
    return G.ampNow * warpUnit(i, t, dir) >= hits;
  }

  function avgUnit(t, dir) {
    let s = 0;
    for (let i = 0; i < G.nWarp; i++) s += warpUnit(i, t, dir);
    return s / Math.max(1, G.nWarp);
  }

  function computeSpeed() {
    const spec = G.spec;
    const span = WARP_R - WARP_L;
    if (spec.wave > 0.001) {
      const travel = Math.max(0.45, (G.nWarp - 1) * spec.wave * spec.period);
      return Math.max(300, (span / travel) * 0.98);
    }
    return spec.speed;
  }

  function weftColor(i) {
    return WEFT_COL[i % WEFT_COL.length];
  }

  function rowY(i, need) {
    const h = CLOTH_BOT - FELL_Y - 18;
    const n = Math.max(need, 1);
    const gap = Math.min(15.5, h / n);
    return FELL_Y + 12 + i * gap;
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (kind ? ' ' + kind : '');
    G.toastT = 1.65;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
  }

  function setOverlay(show) {
    overlay.classList.toggle('hidden', !show);
    overlay.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function showTitle() {
    G.mode = 'title';
    panel.className = 'panel';
    ovKicker.textContent = 'LOOM';
    ovTitle.textContent = '织行';
    ovLead.innerHTML = '梭只在开口时穿过。<br />经线分开、开口发亮再放梭，合上会绞线。';
    ovOps.textContent = '空格 / J 放梭 · 点按画布 · M 静音';
    ovBtn.textContent = '开织';
    setOverlay(true);
    hintEl.textContent = '开口亮了再放梭 · 梭只在开口时穿过';
    hintEl.className = 'hint';
  }

  function showWin() {
    G.mode = 'win';
    G.flying = false;
    panel.className = 'panel win';
    ovKicker.textContent = 'LOOM';
    ovTitle.textContent = '成匹';
    ovLead.innerHTML = '十幅织完。梭始终只在开口里穿过。<br />布面亮着，可以再织一匹。';
    ovOps.textContent = '空格再来 · R 重开 · M 静音';
    ovBtn.textContent = '再织一匹';
    setOverlay(true);
    hintEl.textContent = '成匹';
    hintEl.className = 'hint hot';
    audio.win();
  }

  function showLose(why) {
    G.mode = 'lose';
    G.flying = false;
    panel.className = 'panel lose';
    ovKicker.textContent = 'LOOM';
    ovTitle.textContent = '绞线';
    ovLead.innerHTML = (why || '经线合上，梭被绞住了。') + '<br />等开口再放。还可以再来一局。';
    ovOps.textContent = '空格再来 · R 重开 · M 静音';
    ovBtn.textContent = '再来一局';
    setOverlay(true);
    hintEl.textContent = '绞线 · 开口时再放';
    hintEl.className = 'hint warn';
    audio.lose();
  }

  function rebuildPips() {
    pipsEl.innerHTML = '';
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement('span');
      s.className = 'pip' + (i < G.lives ? ' on' : '') + (G.lives === 1 && i === 0 ? ' warn' : '');
      pipsEl.appendChild(s);
    }
  }

  function applySpec(spec, resetClock) {
    G.spec = spec;
    G.nWarp = spec.warps;
    G.time = spec.time;
    G.timeMax = spec.time;
    G.rows = 0;
    G.dir = 1;
    G.flying = false;
    G.sx = PARK_L;
    G.sy = SHED_Y;
    G.speed = computeSpeed();
    G.lock = 0.35;
    G.beatT = 0;
    G.squash = 1;
    if (resetClock) G.clock = spec.period * 0.02;
    wefts.length = 0;
    trail.length = 0;
    updateAmp(G.clock);
  }

  function loadStage(i, announce) {
    G.stage = i;
    applySpec(STAGES[i], true);
    hintEl.textContent = STAGES[i].hint;
    hintEl.className = 'hint';
    if (announce) {
      toast(STAGES[i].toast, i === 0 ? 'gold' : '');
      audio.stage();
    }
    rebuildPips();
    syncHud(true);
  }

  function startGame() {
    audio.start();
    G.mode = 'play';
    G.lives = LIVES;
    G.t = 0;
    G.taught = false;
    setOverlay(false);
    loadStage(0, true);
  }

  function retryStage() {
    if (G.mode === 'title') {
      startGame();
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') {
      startGame();
      return;
    }
    audio.start();
    loadStage(G.stage, true);
  }

  function launch() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.flying || G.lock > 0) return;
    G.flying = true;
    G.sx = G.dir > 0 ? PARK_L : PARK_R;
    G.sy = SHED_Y;
    G.squash = 1.18;
    trail.length = 0;
    audio.whoosh();
    emit(8, {
      x: G.sx, y: G.sy, j: 6,
      vx0: G.dir * 40, vx1: G.dir * 160, vy0: -50, vy1: 50,
      life: 0.32, r0: 1, r1: 2.4, col: 'c'
    });
  }

  function tryFire() {
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    if (G.mode !== 'play') return;
    launch();
  }

  function parkShuttle() {
    G.flying = false;
    G.sx = G.dir > 0 ? PARK_L : PARK_R;
    G.sy = SHED_Y;
    trail.length = 0;
  }

  function snagAt(i) {
    const x = i >= 0 ? warpX(i) : G.sx;
    const y = SHED_Y;
    G.flash = 0.55;
    G.flashCol = '#ff3db8';
    G.shake = 11;
    G.squash = 0.72;
    audio.snag();
    ripple(x, y, 'm', 70);
    emit(22, {
      x: x, y: y, j: 10,
      vx0: -180, vx1: 180, vy0: -160, vy1: 90,
      life: 0.48, r0: 1.2, r1: 3.4, col: 'm'
    });
    parkShuttle();
    G.lock = 0.55;
    if (G.mode !== 'play') return;
    G.lives -= 1;
    rebuildPips();
    if (G.lives <= 0) {
      showLose('经线合上，梭被绞住了。');
      return;
    }
    toast('绞线', 'warn');
  }

  function addWeft() {
    const col = weftColor(G.rows);
    const need = G.spec.rows;
    wefts.push({
      col: col,
      from: SHED_Y + 8,
      y: rowY(G.rows, need),
      t: 0
    });
    G.rows += 1;
    G.beatT = 1;
    G.flash = 0.32;
    G.flashCol = '#ffe36b';
    G.dir *= -1;
    G.flying = false;
    G.sx = G.dir > 0 ? PARK_L : PARK_R;
    G.sy = SHED_Y;
    G.lock = 0.16;
    G.squash = 1.1;
    trail.length = 0;
    audio.weave();
    ripple((WARP_L + WARP_R) * 0.5, SHED_Y, 'g', 80);
    emit(16, {
      x: G.dir > 0 ? WARP_R : WARP_L, y: SHED_Y, j: 8,
      vx0: -80, vx1: 80, vy0: -40, vy1: 120,
      life: 0.4, r0: 1, r1: 2.8, col: 'g'
    });
    if (G.mode === 'title') {
      if (G.rows >= 4) {
        G.rows = 0;
        wefts.length = 0;
      }
      G.lock = 0.45;
      return;
    }
    if (G.rows >= G.spec.rows) succeedStage();
    else if (!G.taught && G.rows === 1 && G.spec.guide) {
      G.taught = true;
      toast('梭在对面，开口时送回去', 'gold');
    }
  }

  function succeedStage() {
    G.lock = 0.7;
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'clearing';
      G.clearT = 0.55;
      return;
    }
    toast(STAGES[G.stage].name + ' · 过', 'gold');
    G.mode = 'clearing';
    G.clearT = 0.55;
  }

  function nextAfterClear() {
    if (G.stage >= STAGES.length - 1) {
      showWin();
      return;
    }
    G.mode = 'play';
    loadStage(G.stage + 1, true);
  }

  function hitIndex() {
    const half = SHUTTLE_W * 0.38;
    const left = G.sx - half;
    const right = G.sx + half;
    const dir = G.dir;
    for (let i = 0; i < G.nWarp; i++) {
      const x = warpX(i);
      if (x < left || x > right) continue;
      if (Math.abs(warpLift(i, G.clock, dir)) < HIT) return i;
    }
    return -1;
  }

  function updateFx(dt) {
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
    if (G.lock > 0) G.lock -= dt;
    if (G.beatT > 0) G.beatT = Math.max(0, G.beatT - dt * 2.4);
    G.squash = lerp(G.squash, 1, 1 - Math.pow(0.0008, dt));

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy += 48 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.5;
      r.r += dt * r.max * 1.7;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = wefts.length - 1; i >= 0; i--) {
      const w = wefts[i];
      if (w.t < 1) {
        w.t = Math.min(1, w.t + dt * 2.4);
        w.drawY = lerp(w.from, w.y, ease(w.t));
      } else {
        w.drawY = w.y;
      }
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt;
      f.y -= 22 * dt;
      if (f.t <= 0) floats.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.p += dt * m.s;
      m.y += Math.sin(m.p) * 8 * dt;
      if (m.y < 20) m.y = WORLD_H - 30;
      if (m.y > WORLD_H - 20) m.y = 30;
    }
  }

  function updateShedSense() {
    G.wasEntry = G.entryOpen;
    G.entryOpen = entryOpen();
    if (!G.wasEntry && G.entryOpen && (G.mode === 'play' || G.mode === 'title')) {
      audio.openTick();
      if (G.spec.guide && G.mode === 'play' && !G.flying) {
        floats.push({ x: (WARP_L + WARP_R) * 0.5, y: SHED_Y - 48, t: 0.7, text: '开口' });
        if (floats.length > 4) floats.shift();
      }
    }
  }

  function updateShuttle(dt) {
    if (!G.flying) {
      G.sy = SHED_Y + Math.sin(G.t * 2.1) * 1.6;
      G.sx = lerp(G.sx, G.dir > 0 ? PARK_L : PARK_R, 1 - Math.pow(0.0002, dt));
      return;
    }
    G.sx += G.dir * G.speed * dt;
    G.sy = SHED_Y;
    trail.push({ x: G.sx, y: G.sy });
    if (trail.length > 22) trail.shift();

    const hit = hitIndex();
    if (hit >= 0) {
      snagAt(hit);
      return;
    }

    if (G.dir > 0 && G.sx > WARP_R + 28) addWeft();
    else if (G.dir < 0 && G.sx < WARP_L - 28) addWeft();
  }

  function updateTitle(dt) {
    G.clock += dt;
    updateAmp(G.clock);
    updateShedSense();
    if (!G.flying && G.entryOpen && G.lock <= 0) launch();
    updateShuttle(dt);
  }

  function updatePlay(dt) {
    G.clock += dt;
    updateAmp(G.clock);
    updateShedSense();
    G.time -= dt;
    if (G.time <= 0) {
      G.time = 0;
      G.flash = 0.4;
      G.flashCol = '#ff3db8';
      G.shake = 8;
      audio.snag();
      parkShuttle();
      G.lock = 0.5;
      G.lives -= 1;
      rebuildPips();
      if (G.lives <= 0) {
        showLose('这一幅来不及织完。');
        return;
      }
      G.time = G.timeMax;
      toast('时间到', 'warn');
    }
    updateShuttle(dt);
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clearing') {
      G.clock += dt;
      updateAmp(G.clock);
      G.clearT -= dt;
      if (G.clearT <= 0) nextAfterClear();
    } else {
      G.clock += dt;
      updateAmp(G.clock);
      updateShedSense();
      if (!G.flying) {
        G.sy = SHED_Y + Math.sin(G.t * 2.1) * 1.6;
      }
    }
    updateFx(dt);
    const play = G.mode === 'play' || G.mode === 'title' || G.mode === 'clearing';
    audio.tickDrone(play && !G.paused, avgUnit(G.clock, G.dir), G.flying);
    syncHud(false);
  }

  let hudKey = '';
  function syncHud(force) {
    const spec = G.spec;
    const need = spec.rows;
    const t = Math.max(0, G.time);
    const open = G.entryOpen;
    const key = G.mode + '|' + G.stage + '|' + G.rows + '|' + G.lives + '|' + (t | 0) + '|' + (open ? 1 : 0) + '|' + (t < 8 ? 1 : 0);
    if (!force && key === hudKey) {
      fillBar.style.transform = 'scaleX(' + clamp(G.rows / Math.max(1, need), 0, 1) + ')';
      return;
    }
    hudKey = key;
    stageLabel.textContent = '第 ' + (G.stage + 1) + ' 幅 · ' + spec.name;
    stageLabel.classList.toggle('hot', open);
    shedLabel.textContent = open ? '开口' : '闭合';
    shedLabel.classList.toggle('open', open);
    if (G.mode === 'play') {
      timeLabel.textContent = Math.ceil(t) + 's';
      timeLabel.classList.toggle('warn', t < 8);
    } else {
      timeLabel.textContent = '—';
      timeLabel.classList.remove('warn');
    }
    fillNum.textContent = G.rows + '/' + need;
    fillBar.style.transform = 'scaleX(' + clamp(G.rows / Math.max(1, need), 0, 1) + ')';
    fillWrap.classList.toggle('hot', open);
    fillWrap.classList.toggle('warn', G.mode === 'play' && t < 8);
    if (G.mode === 'play') {
      hintEl.classList.toggle('hot', open);
      hintEl.classList.toggle('warn', !open && !G.flying);
    }
  }

  function resize() {
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    view.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = (view.w * view.dpr) | 0;
    canvas.height = (view.h * view.dpr) | 0;
    const sx = view.w / WORLD_W;
    const sy = view.h / WORLD_H;
    view.scale = Math.min(sx, sy);
    view.ox = (view.w - WORLD_W * view.scale) / 2;
    view.oy = (view.h - WORLD_H * view.scale) / 2;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function colOf(tag) {
    if (tag === 'm') return MAG;
    if (tag === 'g') return GOLD;
    return CYN;
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(-40, -40, WORLD_W + 80, WORLD_H + 80);
    const g = ctx.createRadialGradient(180, 40, 10, 180, 40, 420);
    g.addColorStop(0, 'rgba(255,61,184,0.14)');
    g.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const g2 = ctx.createRadialGradient(820, 80, 10, 820, 80, 380);
    g2.addColorStop(0, 'rgba(0,240,255,0.1)');
    g2.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgb(m.col === 'm' ? MAG : CYN, 0.22);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawFrame() {
    ctx.strokeStyle = 'rgba(0,240,255,0.35)';
    ctx.lineWidth = 2.2;
    roundRect(168, 48, 624, 454, 18);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,61,184,0.18)';
    ctx.lineWidth = 1;
    roundRect(178, 58, 604, 434, 14);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,240,255,0.12)';
    roundRect(198, 62, 564, 22, 8);
    ctx.fill();
    ctx.strokeStyle = rgb(CYN, 0.55);
    ctx.lineWidth = 2;
    roundRect(198, 62, 564, 22, 8);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,240,255,0.1)';
    roundRect(198, CLOTH_BOT - 6, 564, 18, 8);
    ctx.fill();
    ctx.strokeStyle = rgb(CYN, 0.45);
    ctx.lineWidth = 2;
    roundRect(198, CLOTH_BOT - 6, 564, 18, 8);
    ctx.stroke();

    ctx.fillStyle = rgb(CYN, 0.7);
    for (let i = 0; i < G.nWarp; i++) {
      const x = warpX(i);
      ctx.beginPath();
      ctx.arc(x, TOP_Y - 8, 2.1, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = rgb(MAG, 0.35);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(188, 96);
    ctx.lineTo(188, CLOTH_BOT - 8);
    ctx.moveTo(772, 96);
    ctx.lineTo(772, CLOTH_BOT - 8);
    ctx.stroke();
  }

  function drawCloth() {
    const need = G.spec.rows;
    const left = WARP_L - 6;
    const right = WARP_R + 6;
    const top = FELL_Y + 2;
    const bot = CLOTH_BOT - 10;

    ctx.fillStyle = 'rgba(8,6,20,0.55)';
    roundRect(left - 8, top - 4, right - left + 16, bot - top + 10, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    roundRect(left - 8, top - 4, right - left + 16, bot - top + 10, 8);
    ctx.stroke();

    for (let i = 0; i < need; i++) {
      const y = rowY(i, need);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    for (let i = 0; i < wefts.length; i++) {
      const w = wefts[i];
      const y = w.drawY == null ? w.y : w.drawY;
      ctx.strokeStyle = rgb(w.col, 0.22);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(left, y);
      for (let x = left; x <= right; x += 10) {
        const u = (x - left) / (right - left);
        const wob = Math.sin(u * 18 + i * 0.7) * 1.4;
        ctx.lineTo(x, y + wob);
      }
      ctx.stroke();
      ctx.strokeStyle = rgb(w.col, 0.95);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(left, y);
      for (let x = left; x <= right; x += 10) {
        const u = (x - left) / (right - left);
        const wob = Math.sin(u * 18 + i * 0.7) * 1.4;
        ctx.lineTo(x, y + wob);
      }
      ctx.stroke();
    }

    if (G.beatT > 0) {
      const by = lerp(SHED_Y + 28, FELL_Y + 6, 1 - G.beatT);
      ctx.strokeStyle = rgb(GOLD, G.beatT * 0.75);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(WARP_L - 10, by);
      ctx.lineTo(WARP_R + 10, by);
      ctx.stroke();
      const teeth = G.nWarp;
      ctx.strokeStyle = rgb(CYN, G.beatT * 0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const x = warpX(i);
        ctx.moveTo(x, by - 8);
        ctx.lineTo(x, by + 8);
      }
      ctx.stroke();
    }
  }

  function drawTunnel() {
    const avg = avgUnit(G.clock, G.dir);
    const mid = (WARP_L + WARP_R) * 0.5;
    const rx = (WARP_R - WARP_L) * 0.46;
    const ry = 9 + G.ampNow * avg * 0.82;
    const open = G.entryOpen;

    ctx.save();
    ctx.translate(mid, SHED_Y);
    ctx.scale(1, ry / Math.max(8, rx * 0.22));
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, rx * 0.22, 0, 0, TAU);
    ctx.fillStyle = open ? 'rgba(255,227,107,0.16)' : rgb(MAG, 0.05 + avg * 0.05);
    ctx.fill();
    ctx.strokeStyle = open ? rgb(GOLD, 0.85) : rgb(CYN, 0.18 + avg * 0.25);
    ctx.lineWidth = open ? 2.4 : 1.4;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = open ? rgb(GOLD, 0.08) : 'rgba(0,0,0,0.18)';
    ctx.fillRect(WARP_L, SHED_Y - 7, WARP_R - WARP_L, 14);

    if (open && G.spec.guide) {
      ctx.font = '700 13px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = rgb(GOLD, 0.9);
      ctx.fillText('开口', mid, SHED_Y - ry - 8);
    }
  }

  function drawWarps(parity) {
    const t = G.clock;
    const dir = G.dir;
    const tunnel = 26;
    for (let i = 0; i < G.nWarp; i++) {
      if ((i % 2) !== parity) continue;
      const x = warpX(i);
      const unit = warpUnit(i, t, dir);
      const lift = warpLift(i, t, dir);
      const even = i % 2 === 0;
      const col = even ? MAG : CYN;
      const xOff = (even ? -1 : 1) * (2.2 + unit * 4.5);
      const hx = x + xOff;
      const hy = SHED_Y + lift;
      const stray = isStray(i);
      const dim = 0.28 + (1 - unit) * 0.55;

      ctx.strokeStyle = rgb(col, dim * 0.55);
      ctx.lineWidth = stray ? 2.4 : 1.7;
      ctx.beginPath();
      ctx.moveTo(x, TOP_Y);
      ctx.quadraticCurveTo(hx, (TOP_Y + hy) * 0.5, hx, hy);
      ctx.stroke();

      const fade = 0.18 + (1 - unit) * 0.5;
      ctx.strokeStyle = rgb(col, fade);
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(hx, (hy + FELL_Y) * 0.5, x, FELL_Y + 4);
      ctx.stroke();

      if (unit > 0.05) {
        ctx.strokeStyle = rgb(col, 0.12 * unit);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(hx, hy - tunnel * 0.4);
        ctx.lineTo(hx, hy + tunnel * 0.4);
        ctx.stroke();
      }

      ctx.fillStyle = rgb(col, 0.95);
      ctx.beginPath();
      ctx.ellipse(hx, hy, stray ? 4.2 : 3.3, 5.2, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = stray ? rgb(GOLD, 0.9) : rgb(INK, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    let barY = 0;
    let n = 0;
    for (let i = 0; i < G.nWarp; i++) {
      if ((i % 2) !== parity) continue;
      barY += SHED_Y + warpLift(i, t, dir);
      n += 1;
    }
    if (n) barY /= n;
    const col = parity === 0 ? MAG : CYN;
    ctx.strokeStyle = rgb(col, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WARP_L - 18, barY);
    ctx.lineTo(WARP_R + 18, barY);
    ctx.stroke();
  }

  function drawYarn() {
    if (!G.flying && trail.length < 2) return;
    const col = weftColor(G.rows);
    const start = G.dir > 0 ? PARK_L : PARK_R;
    ctx.strokeStyle = rgb(col, 0.2);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(start, SHED_Y);
    ctx.lineTo(G.sx, G.sy);
    ctx.stroke();
    ctx.strokeStyle = rgb(col, 0.85);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(start, SHED_Y);
    if (trail.length) {
      for (let i = 0; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
    }
    ctx.lineTo(G.sx, G.sy);
    ctx.stroke();
  }

  function drawShuttle() {
    const x = G.sx;
    const y = G.sy;
    const dir = G.dir;
    const w = SHUTTLE_W * (dir > 0 ? G.squash : 2 - G.squash);
    const h = SHUTTLE_H * (dir > 0 ? 2 - G.squash : G.squash);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir < 0 ? Math.PI : 0);

    ctx.fillStyle = 'rgba(0,240,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.62, h * 0.95, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#0b1520';
    ctx.strokeStyle = rgb(CYN, 0.95);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.18, -h * 0.7, w * 0.12, -h * 0.42);
    ctx.quadraticCurveTo(w * 0.5, 0, w * 0.12, h * 0.42);
    ctx.quadraticCurveTo(-w * 0.18, h * 0.7, -w * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const bob = weftColor(G.rows);
    ctx.fillStyle = rgb(bob, 0.95);
    ctx.beginPath();
    ctx.ellipse(-w * 0.06, 0, 7.5, 6.2, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgb(GOLD, 0.7);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(-w * 0.06, 0, 4.2, 3.4, 0, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = rgb(INK, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, -2);
    ctx.lineTo(w * 0.22, -2);
    ctx.moveTo(-w * 0.28, 2);
    ctx.lineTo(w * 0.22, 2);
    ctx.stroke();
    ctx.restore();

    if (!G.flying && G.entryOpen && G.mode === 'play') {
      ctx.strokeStyle = rgb(GOLD, 0.45 + 0.25 * Math.sin(G.t * 8));
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, 22 + Math.sin(G.t * 6) * 2, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFx() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.strokeStyle = rgb(colOf(r.col), r.t * 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgb(colOf(p.col), Math.max(0, p.life / p.max));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.font = '700 12px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = rgb(GOLD, clamp(f.t * 1.4, 0, 1));
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function draw() {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0);
    const shy = (G.shake ? (Math.random() - 0.5) * G.shake : 0);
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);

    drawBg();
    drawFrame();
    drawWarps(1);
    drawCloth();
    drawTunnel();
    drawYarn();
    drawShuttle();
    drawWarps(0);
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = G.flashCol === '#ff3db8'
        ? 'rgba(255,61,184,' + (G.flash * 0.22) + ')'
        : 'rgba(255,227,107,' + (G.flash * 0.16) + ')';
      ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
    }
  }

  function onKey(e) {
    const k = e.code;
    if (k === 'KeyM') {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'KeyR') {
      e.preventDefault();
      retryStage();
      return;
    }
    if (k === 'Space' || k === 'Enter' || k === 'KeyJ' || k === 'ArrowUp') {
      e.preventDefault();
      if (e.repeat) return;
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        if (k === 'Space' || k === 'Enter') ovBtn.click();
        return;
      }
      tryFire();
    }
  }

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startGame();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    retryStage();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  function fireHold(on) {
    btnFire.classList.toggle('held', on);
  }
  btnFire.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    audio.ensure();
    fireHold(true);
    tryFire();
  });
  btnFire.addEventListener('pointerup', function () { fireHold(false); });
  btnFire.addEventListener('pointerleave', function () { fireHold(false); });

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    e.preventDefault();
    tryFire();
  });

  window.addEventListener('keydown', onKey, { passive: false });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (!document.hidden) last = performance.now();
  });

  applySpec(STAGES[0], true);
  G.mode = 'title';
  G.rows = 2;
  wefts.push({ col: MAG, from: rowY(0, 3), y: rowY(0, 3), t: 1, drawY: rowY(0, 3) });
  wefts.push({ col: CYN, from: rowY(1, 3), y: rowY(1, 3), t: 1, drawY: rowY(1, 3) });
  rebuildPips();
  showTitle();
  resize();
  syncHud(true);

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const raw = (now - last) / 1000;
    last = now;
    if (!G.paused) {
      const dt = raw > 0.05 ? 0.05 : raw;
      acc += dt;
      if (acc > 0.2) acc = 0.2;
      while (acc >= STEP) {
        update(STEP);
        acc -= STEP;
      }
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
