'use strict';

(function () {
  const VW = 960;
  const VH = 540;
  const HX = 98;
  const HY = 498;
  const LMIN = 72;
  const LMAX = 448;
  const KR = 15;
  const GROUND = 508;
  const SKY = 14;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-kite-line-mute';
  const OPS = '↑ / W / 空格收线 · ↓ / S 放线 · 按住上下拖 · M 静音';

  const STAGES = [
    {
      name: '初放', sub: 'FIRST',
      hint: '放线让鸢升高，停进金色窗格',
      toast: '↓ 放线升高 · 进窗就停住',
      startL: 150, targetL: 268, wind: 0.5,
      ww: 104, wh: 88, need: 1.12, drain: 0.42
    },
    {
      name: '回落', sub: 'DROP',
      hint: '鸢偏高了，收线把它拉进窗',
      toast: '↑ 收线拉低 · 别收到屋顶',
      startL: 368, targetL: 236, wind: 0.52,
      ww: 80, wh: 66, need: 1.22, drain: 0.55
    },
    {
      name: '阵风', sub: 'GUST',
      hint: '阵风会把鸢抬高，来时收一线',
      toast: '青带是风 · 抬起来就收',
      startL: 176, targetL: 292, wind: 0.48,
      ww: 80, wh: 64, need: 1.32, drain: 0.62,
      gust: { period: 4.2, amp: 0.4, atk: 0.36, hold: 0.62, rel: 0.52, ph: 1.7 }
    },
    {
      name: '游窗', sub: 'DRIFT',
      hint: '窗在缓缓游走，跟着它放收',
      toast: '窗会上下漂 · 贴着走',
      startL: 168, targetL: 304, wind: 0.58,
      ww: 72, wh: 58, need: 1.48, drain: 0.85,
      move: { ax: 10, ay: 40, spd: 0.72, ph: 0.2 }
    },
    {
      name: '燕掠', sub: 'SWALLOW',
      hint: '燕会剪线。等它掠过再入窗',
      toast: '别让燕碰到鸢',
      startL: 188, targetL: 286, wind: 0.56,
      ww: 74, wh: 58, need: 1.42, drain: 0.9,
      birds: [
        { yOff: 0, spd: 92, r: 13, delay: 1.15, dir: 1, ph: 0.2 },
        { yOff: -48, spd: 74, r: 12, delay: 2.6, dir: -1, ph: 1.1 }
      ]
    },
    {
      name: '高窗', sub: 'HIGH',
      hint: '越高风越急，放线要慢，别冲上天',
      toast: '高处有切变 · 轻轻放',
      startL: 154, targetL: 360, wind: 0.6,
      ww: 74, wh: 56, need: 1.48, drain: 0.95,
      shear: 0.28
    },
    {
      name: '窄格', sub: 'SLIT',
      hint: '窗格很窄，贴中心再停',
      toast: '对准正中 · 别晃出格',
      startL: 318, targetL: 248, wind: 0.64,
      ww: 54, wh: 44, need: 1.6, drain: 1.12,
      gust: { period: 4.4, amp: 0.24, atk: 0.3, hold: 0.48, rel: 0.5, ph: 1.8 }
    },
    {
      name: '电丝', sub: 'WIRE',
      hint: '从缺口穿过去。擦到电丝会割线',
      toast: '走窗前的缺口 · 别蹭青丝',
      startL: 162, targetL: 312, wind: 0.6,
      ww: 70, wh: 50, need: 1.5, drain: 1.1,
      wires: [
        { oy: -38, gapW: 132 },
        { oy: 38, gapW: 132 }
      ]
    },
    {
      name: '夜潮', sub: 'TIDE',
      hint: '窗在漂，风在涌，跟住光带',
      toast: '游窗加阵风 · 提前收放',
      startL: 196, targetL: 298, wind: 0.52,
      ww: 62, wh: 50, need: 1.62, drain: 1.05,
      gust: { period: 3.6, amp: 0.32, atk: 0.3, hold: 0.5, rel: 0.48, ph: 1.5 },
      move: { ax: 12, ay: 28, spd: 0.78, ph: 0.4 }
    },
    {
      name: '终窗', sub: 'FINALE',
      hint: '窄窗、切变、燕和电丝一起上',
      toast: '停进最后一格',
      startL: 148, targetL: 330, wind: 0.56,
      ww: 56, wh: 44, need: 1.7, drain: 1.15,
      shear: 0.2,
      gust: { period: 3.8, amp: 0.28, atk: 0.3, hold: 0.48, rel: 0.46, ph: 1.6 },
      move: { ax: 10, ay: 20, spd: 0.7, ph: 0.8 },
      wires: [{ oy: -32, gapW: 118 }, { oy: 32, gapW: 118 }],
      birds: [
        { yOff: -10, spd: 96, r: 12, delay: 7.4, dir: 1, ph: 0.4 },
        { yOff: 40, spd: 78, r: 11, delay: 2.6, dir: -1, ph: 1.6 }
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
  const ovBtn = document.getElementById('ov-btn');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnIn = document.getElementById('btn-in');
  const btnOut = document.getElementById('btn-out');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const stageLabel = document.getElementById('stage-label');
  const powerLabel = document.getElementById('power-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { inn: false, out: false };
  const pad = { inn: false, out: false };
  const pointer = { down: false, id: null, y: 0, prevY: 0, moved: 0 };

  const particles = [];
  const motes = [];
  const stars = [];
  const clouds = [];
  const streaks = [];
  const ripples = [];

  const G = {
    mode: 'title',
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    L: 210,
    kx: 280,
    ky: 340,
    kvx: 0,
    kvy: 0,
    wind: 0.5,
    hold: 0,
    wx0: 320,
    wy0: 300,
    spec: STAGES[0],
    birds: [],
    wires: [],
    spawnT: 0,
    dieT: 0,
    clearT: 0,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: '0,240,255',
    toastT: 0,
    why: '',
    reelAng: 0,
    tickAcc: 0,
    inWin: false,
    gusting: 0,
    hud: '',
    taught: false,
    nearTaught: false,
    chimeT: 0
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

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    windSrc: null,
    windGain: null,
    winOsc: null,
    winGain: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
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
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012);
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
      f.frequency.setValueAtTime(from || 700, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(80, to), t + dur);
      f.Q.value = 0.75;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    reel: function (up) {
      this.ensure();
      this.beep(up ? 420 : 280, 0.045, 'triangle', 0.028, up ? 620 : 180);
    },
    chime: function () {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.04, 880);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.055, 784);
      this.beep(784, 0.18, 'triangle', 0.045, 1175);
    },
    snap: function () {
      this.ensure();
      this.noise(0.2, 0.09, 900, 180);
      this.beep(196, 0.28, 'sawtooth', 0.055, 60);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, 'triangle', 0.09, 880);
      this.beep(660, 0.24, 'sine', 0.07, 1320);
      this.beep(880, 0.38, 'sine', 0.055, 1760);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.42, 'sawtooth', 0.08, 55);
      this.beep(90, 0.64, 'square', 0.045, 40);
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.14, 'sine', 0.055, 392);
      this.beep(330, 0.2, 'triangle', 0.04, 660);
    },
    gustWhoosh: function () {
      this.ensure();
      this.noise(0.22, 0.04, 400, 1600);
    },
    tickDrone: function (play, wind, inWin) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 52;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      if (!this.winOsc) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 392;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.winOsc = o;
        this.winGain = g;
      }
      const t = this.ctx.currentTime;
      const w = clamp(wind, 0.15, 1.5);
      this.drone.frequency.setTargetAtTime(46 + w * 28, t, 0.18);
      this.droneGain.gain.setTargetAtTime(play ? 0.01 + w * 0.018 : 0.0001, t, 0.22);
      this.winOsc.frequency.setTargetAtTime(inWin ? 392 + G.hold * 180 : 330, t, 0.12);
      this.winGain.gain.setTargetAtTime(play && inWin ? 0.012 + G.hold * 0.02 : 0.0001, t, 0.1);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  function elevOf(wind) {
    const u = clamp((wind - 0.18) / 1.15, 0, 1);
    return 0.5 + 0.7 * u;
  }

  function kiteAim(L, wind) {
    const el = elevOf(wind);
    const slack = clamp(0.92 - wind, 0, 0.92);
    const x = HX + L * Math.cos(el) - slack * L * 0.05;
    const y = HY - L * Math.sin(el) + slack * slack * L * 0.18;
    return { x: clamp(x, 48, VW - 36), y: clamp(y, 22, HY - 20) };
  }

  function aimWithShear(L, spec) {
    let aim = kiteAim(L, spec.wind || 0.5);
    for (let n = 0; n < 12; n++) {
      const sh = spec.shear || 0;
      const w = (spec.wind || 0.5) + sh * clamp((HY - aim.y) / 400, 0, 1);
      aim = kiteAim(L, w);
    }
    return aim;
  }

  function gustEnv(t, g) {
    const p = g.period;
    const u = ((t % p) + p) % p;
    const a = g.atk || 0.32;
    const h = g.hold || 0.7;
    const r = g.rel || 0.55;
    if (u < a) return u / a;
    if (u < a + h) return 1;
    if (u < a + h + r) return 1 - (u - a - h) / r;
    return 0;
  }

  function windNow(t, y) {
    const s = G.spec;
    let w = s.wind || 0.5;
    if (s.gust) w += s.gust.amp * gustEnv(t + (s.gust.ph || 0), s.gust);
    if (s.shear) w += s.shear * clamp((HY - y) / 400, 0, 1);
    return clamp(w, 0.12, 1.55);
  }

  function windowRect(t) {
    const s = G.spec;
    let x = G.wx0;
    let y = G.wy0;
    if (s.move) {
      x += Math.sin(t * s.move.spd + (s.move.ph || 0)) * (s.move.ax || 0);
      y += Math.cos(t * s.move.spd + (s.move.ph || 0) * 0.7) * (s.move.ay || 0);
    }
    return { x: x, y: y, w: s.ww, h: s.wh };
  }

  function inWindowAt(t) {
    const wr = windowRect(t);
    const m = 4;
    return G.kx > wr.x - wr.w * 0.5 + m &&
      G.kx < wr.x + wr.w * 0.5 - m &&
      G.ky > wr.y - wr.h * 0.5 + m &&
      G.ky < wr.y + wr.h * 0.5 - m;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || 'c'
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 14) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: max || 52, t: 1, col: col || 'g' });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 2.35;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function showOverlay(kind, title, lead, btn, kicker) {
    overlay.classList.remove('hidden');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kicker || 'KITE';
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovOps.textContent = OPS;
    ovBtn.textContent = btn;
    ovBtn.focus();
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    panel.classList.remove('win', 'lose');
  }

  function overlayOpen() {
    return !overlay.classList.contains('hidden');
  }

  function seedDecor() {
    stars.length = 0;
    motes.length = 0;
    clouds.length = 0;
    streaks.length = 0;
    for (let i = 0; i < 56; i++) {
      stars.push({
        x: rand(10, VW - 10),
        y: rand(8, 310),
        r: rand(0.4, 1.5),
        a: rand(0.22, 0.8),
        tw: rand(1.1, 3.2),
        p: rand(0, TAU)
      });
    }
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: rand(0, VW),
        y: rand(20, 460),
        r: rand(0.5, 1.6),
        a: rand(0.04, 0.16),
        s: rand(10, 28),
        p: rand(0, TAU)
      });
    }
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: rand(0, VW),
        y: rand(40, 220),
        w: rand(70, 150),
        h: rand(16, 28),
        a: rand(0.04, 0.1),
        s: rand(8, 18)
      });
    }
    for (let i = 0; i < 18; i++) {
      streaks.push({
        x: rand(0, VW),
        y: rand(40, 420),
        len: rand(18, 46),
        a: rand(0.06, 0.16),
        s: rand(30, 70)
      });
    }
  }

  function lineRate() {
    if (G.stage < 2) return 78;
    if (G.stage < 5) return 108;
    return 132;
  }

  function loadStage(i) {
    G.stage = i;
    G.spec = STAGES[i];
    const s = G.spec;
    const aim0 = aimWithShear(s.targetL, s);
    G.wx0 = aim0.x;
    G.wy0 = aim0.y;
    G.L = s.startL;
    const start = aimWithShear(s.startL, s);
    G.kx = start.x;
    G.ky = start.y;
    G.kvx = 0;
    G.kvy = 0;
    G.wind = s.wind;
    G.hold = 0;
    G.clock = 0;
    G.spawnT = 0.55;
    G.dieT = 0;
    G.clearT = 0;
    G.why = '';
    G.inWin = false;
    G.gusting = 0;
    G._lPrev = G.L;
    G._gusted = false;
    G.birds = (s.birds || []).map(function (b) {
      return {
        yOff: b.yOff, spd: b.spd, r: b.r, delay: b.delay,
        dir: b.dir, ph: b.ph, x: b.dir > 0 ? -80 : VW + 80, y: aim0.y + b.yOff
      };
    });
    G.wires = (s.wires || []).map(function (w) {
      return { y: aim0.y + (w.oy || 0), gapX: aim0.x + (w.ox || 0), gapW: w.gapW };
    });
    if (G.mode === 'play') {
      toast(s.toast, 'gold');
      setHint(s.hint, '');
    }
    syncHud(true);
  }

  function startRun() {
    G.mode = 'play';
    G.lives = LIVES;
    G.taught = false;
    G.nearTaught = false;
    hideOverlay();
    loadStage(0);
    audio.start();
    setHint(STAGES[0].hint, '');
  }

  function fail(why) {
    if (G.mode !== 'play') return;
    G.mode = 'dying';
    G.why = why;
    G.dieT = 0.92;
    G.shake = 12;
    G.flash = 0.72;
    G.flashCol = '255,61,184';
    G.lives -= 1;
    audio.snap();
    emit(22, {
      x: G.kx, y: G.ky, j: 14,
      vx0: -160, vx1: 160, vy0: -80, vy1: 140,
      life: 0.55, r0: 1.2, r1: 3.4, col: 'm'
    });
    const msg = why === 'bird' ? '燕剪断了线'
      : why === 'wire' ? '电丝割线'
      : why === 'ground' ? '鸢落到瓦上'
      : why === 'sky' ? '线被风抽上天'
      : why === 'roof' ? '收到屋顶'
      : '线断了';
    toast(msg, 'warn');
    setHint(msg, 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.mode = 'clear';
    G.clearT = 0.95;
    G.flash = 0.7;
    G.flashCol = '255,227,107';
    audio.clear();
    ripple(G.kx, G.ky, 'g', 70);
    emit(18, {
      x: G.kx, y: G.ky, j: 16,
      vx0: -80, vx1: 80, vy0: -120, vy1: -10,
      life: 0.62, r0: 1.2, r1: 3.2, col: 'g'
    });
    toast(G.spec.name + ' · 入窗', 'gold');
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      G.clearT = 0;
      audio.win();
      showOverlay(
        'win',
        '鸢栖十窗',
        '十扇窗格都停稳了。夜风还在，线还在手里。',
        '再放一次',
        'PERCHED'
      );
      setHint('十窗都停稳了', 'hot');
    }
  }

  function nextStage() {
    G.mode = 'play';
    loadStage(G.stage + 1);
  }

  function finishDie() {
    if (G.lives <= 0) {
      G.mode = 'lose';
      audio.lose();
      showOverlay(
        'lose',
        '线尽了',
        '三根线都断了。夜还长，可以再放一巡。',
        '再来一局',
        'SNAPPED'
      );
      setHint('线尽了 · 再来一局', 'warn');
      return;
    }
    G.mode = 'play';
    loadStage(G.stage);
  }

  function birdPos(b, t) {
    if (t < b.delay) return { x: b.dir > 0 ? -90 : VW + 90, y: G.wy0 + b.yOff };
    const span = VW + 160;
    const u = (t - b.delay) * b.spd;
    let x;
    if (b.dir > 0) x = -70 + (u % span);
    else x = VW + 70 - (u % span);
    return { x: x, y: G.wy0 + b.yOff + Math.sin(t * 3.2 + b.ph) * 8 };
  }

  function hitBirds(t) {
    for (let i = 0; i < G.birds.length; i++) {
      const p = birdPos(G.birds[i], t);
      if (p.x < -20 || p.x > VW + 20) continue;
      const r = G.birds[i].r + KR * 0.72;
      if (hypot(p.x - G.kx, p.y - G.ky) < r) return true;
    }
    return false;
  }

  function hitWires() {
    for (let i = 0; i < G.wires.length; i++) {
      const w = G.wires[i];
      if (Math.abs(G.ky - w.y) > 9) continue;
      const gl = w.gapX - w.gapW * 0.5;
      const gr = w.gapX + w.gapW * 0.5;
      if (G.kx < gl + 2 || G.kx > gr - 2) return true;
    }
    return false;
  }

  function stepKite(dt) {
    const wn = windNow(G.clock, G.ky);
    G.wind = lerp(G.wind, wn, 1 - Math.exp(-dt * 5.4));
    const g = G.spec.gust;
    G.gusting = g ? gustEnv(G.clock + (g.ph || 0), g) : 0;
    const aim = kiteAim(G.L, G.wind);
    const K = 8.4;
    const D = 4.5;
    G.kvx += ((aim.x - G.kx) * K - G.kvx * D) * dt;
    G.kvy += ((aim.y - G.ky) * K - G.kvy * D) * dt;
    G.kvx += Math.sin(G.clock * 3.3 + 0.5) * 16 * G.wind * dt;
    G.kvy += Math.cos(G.clock * 2.5) * 11 * dt;
    G.kx += G.kvx * dt;
    G.ky += G.kvy * dt;
    G.reelAng += (G.L - (G._lPrev || G.L)) * 0.12;
    G._lPrev = G.L;
  }

  function applyLine(dt) {
    if (G.mode !== 'play') return;
    const rate = lineRate();
    let dir = 0;
    if (keys.inn || pad.inn) dir -= 1;
    if (keys.out || pad.out) dir += 1;
    if (pointer.down && pointer.moved < 8) {
      if (pointer.y < VH * 0.45) dir -= 1;
      else if (pointer.y > VH * 0.55) dir += 1;
    }
    if (dir) {
      const prev = G.L;
      G.L = clamp(G.L + dir * rate * dt, LMIN, LMAX);
      G.tickAcc += Math.abs(G.L - prev);
      if (G.tickAcc > 7.5) {
        G.tickAcc = 0;
        audio.reel(dir < 0);
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.55;
      r.r += (r.max - r.r) * 6 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = 0; i < clouds.length; i++) {
      clouds[i].x += (8 + G.wind * 22) * dt;
      if (clouds[i].x > VW + 80) clouds[i].x = -100;
    }
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      s.x += s.s * (0.6 + G.wind) * dt;
      if (s.x > VW + 20) {
        s.x = -30;
        s.y = rand(36, 430);
      }
    }
    G.shake = Math.max(0, G.shake - dt * 16);
    G.flash = Math.max(0, G.flash - dt * 2.1);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
  }

  function updatePlay(dt) {
    G.clock += dt;
    G.spawnT = Math.max(0, G.spawnT - dt);
    applyLine(dt);
    stepKite(dt);

    const inside = inWindowAt(G.clock);
    G.inWin = inside;
    if (inside) {
      const need = G.spec.need || 1.2;
      G.hold = clamp(G.hold + dt / need, 0, 1);
      G.chimeT -= dt;
      if (G.chimeT <= 0) {
        G.chimeT = 0.42;
        audio.chime();
      }
      if (Math.random() < 0.35) {
        emit(1, {
          x: G.kx, y: G.ky, j: 10,
          vx0: -20, vx1: 20, vy0: -40, vy1: -4,
          life: 0.4, r0: 0.8, r1: 2.1, col: 'g'
        });
      }
      if (G.hold >= 1) {
        clearStage();
        return;
      }
    } else {
      G.hold = Math.max(0, G.hold - dt * (G.spec.drain || 0.8));
      G.chimeT = 0;
    }

    if (G.spawnT <= 0) {
      if (G.ky > GROUND) { fail('ground'); return; }
      if (G.ky < SKY) { fail('sky'); return; }
      if (hypot(G.kx - HX, G.ky - HY) < 58) { fail('roof'); return; }
      if (G.birds.length && hitBirds(G.clock)) { fail('bird'); return; }
      if (G.wires.length && hitWires()) { fail('wire'); return; }
    }

    if (G.gusting > 0.55 && G.gusting < 0.62 && !G._gusted) {
      audio.gustWhoosh();
      G._gusted = true;
    }
    if (G.gusting < 0.2) G._gusted = false;

    if (!G.taught && G.stage === 0 && inside) {
      G.taught = true;
      toast('稳住 · 让光条走满', 'gold');
    }
  }

  function updateDying(dt) {
    G.dieT -= dt;
    G.kvy += 520 * dt;
    G.kvx *= Math.exp(-dt * 1.4);
    G.kx += G.kvx * dt;
    G.ky += G.kvy * dt;
    if (G.dieT <= 0) finishDie();
  }

  function updateClear(dt) {
    G.clearT -= dt;
    G.kvx *= Math.exp(-dt * 4);
    G.kvy *= Math.exp(-dt * 4);
    G.hold = 1;
    G.inWin = true;
    if (G.clearT <= 0) nextStage();
  }

  function updateTitle(dt) {
    G.clock += dt;
    G.spec = STAGES[0];
    const aimW = kiteAim(STAGES[0].targetL, STAGES[0].wind);
    G.wx0 = aimW.x;
    G.wy0 = aimW.y;
    G.L = 214 + Math.sin(G.t * 0.62) * 64;
    G.wind = 0.5 + 0.1 * Math.sin(G.t * 0.38);
    stepKite(dt);
  }

  function update(dt) {
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'dying') updateDying(dt);
    else if (G.mode === 'clear') updateClear(dt);
    else stepKite(dt * 0.45);
    updateFx(dt);
    const playDrone = G.mode === 'play' || G.mode === 'title' || G.mode === 'clear';
    audio.tickDrone(playDrone, G.wind, G.inWin && G.mode === 'play');
  }

  function syncHud(force) {
    const wr = windowRect(G.clock);
    let vibe = 'aim';
    if (G.mode === 'dying' || G.mode === 'lose') vibe = 'dead';
    else if (G.inWin && G.mode === 'play') vibe = 'in';
    else if (G.mode === 'clear' || G.mode === 'win') vibe = 'in';
    else if (G.gusting > 0.45) vibe = 'gust';
    else if (G.ky > wr.y + 10) vibe = 'out';
    else if (G.ky < wr.y - 10) vibe = 'inline';
    const holdN = (G.hold * 20) | 0;
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + vibe + ':' + holdN;
    if (!force && key === G.hud) return;
    G.hud = key;
    const s = G.spec || STAGES[0];
    if (G.mode === 'title') {
      stageLabel.textContent = '放鸢';
      stageLabel.classList.remove('hot');
      powerLabel.textContent = 'KITE';
      powerLabel.classList.remove('warn', 'hot');
      fillNum.textContent = '—';
      fillBar.style.transform = 'scaleX(0)';
      fillWrap.classList.remove('hot', 'warn');
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + '/' + STAGES.length + ' 窗 · ' + s.name;
      stageLabel.classList.toggle('hot', G.mode === 'clear' || G.mode === 'win');
      if (vibe === 'in') {
        powerLabel.textContent = '入窗';
        powerLabel.classList.add('hot');
        powerLabel.classList.remove('warn');
      } else if (vibe === 'gust') {
        powerLabel.textContent = '阵风 · 收';
        powerLabel.classList.add('warn');
        powerLabel.classList.remove('hot');
      } else if (vibe === 'out') {
        powerLabel.textContent = '放线升高';
        powerLabel.classList.remove('warn', 'hot');
      } else if (vibe === 'inline') {
        powerLabel.textContent = '收线拉低';
        powerLabel.classList.remove('warn', 'hot');
      } else if (vibe === 'dead') {
        powerLabel.textContent = '线断';
        powerLabel.classList.add('warn');
        powerLabel.classList.remove('hot');
      } else {
        powerLabel.textContent = '对准';
        powerLabel.classList.remove('warn', 'hot');
      }
      fillNum.textContent = Math.round(G.hold * 100) + '%';
      fillBar.style.transform = 'scaleX(' + clamp(G.hold, 0, 1) + ')';
      fillWrap.classList.toggle('hot', vibe === 'in');
      fillWrap.classList.toggle('warn', vibe === 'gust' || vibe === 'dead');
    }
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 && G.mode !== 'title' ? ' on warn' : ' on') : '') + '"></i>';
    }
    pipsEl.innerHTML = html;
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

  function colOf(c) {
    if (c === 'm') return '#ff3db8';
    if (c === 'g') return '#ffe36b';
    return '#00f0ff';
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#07041a');
    g.addColorStop(0.45, '#0a0620');
    g.addColorStop(1, '#12081c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const mag = ctx.createRadialGradient(120, 40, 10, 80, 0, 420);
    mag.addColorStop(0, 'rgba(255,61,184,0.14)');
    mag.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, VW, VH);
    const cy = ctx.createRadialGradient(820, 80, 20, 900, 0, 380);
    cy.addColorStop(0, 'rgba(0,240,255,0.1)');
    cy.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = cy;
    ctx.fillRect(0, 0, VW, VH);

    ctx.fillStyle = '#0c1420';
    ctx.strokeStyle = 'rgba(0,240,255,0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(838, 58, 22, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(830, 52, 6, 0, TAU);
    ctx.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + 0.45 * Math.sin(G.t * s.tw + s.p));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#e8faff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      ctx.globalAlpha = c.a;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, c.h, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.28, c.y + 4, c.w * 0.55, c.h * 0.72, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      ctx.strokeStyle = 'rgba(0,240,255,' + s.a + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y + 3);
      ctx.stroke();
    }

    if (G.gusting > 0.12) {
      ctx.save();
      ctx.globalAlpha = G.gusting * 0.22;
      const band = ctx.createLinearGradient(0, G.ky - 50, VW, G.ky + 40);
      band.addColorStop(0, 'rgba(0,240,255,0)');
      band.addColorStop(0.4, 'rgba(0,240,255,0.45)');
      band.addColorStop(1, 'rgba(255,61,184,0)');
      ctx.fillStyle = band;
      ctx.fillRect(0, G.ky - 36, VW, 72);
      ctx.restore();
    }
  }

  function drawBuildings() {
    ctx.fillStyle = '#080414';
    ctx.beginPath();
    ctx.moveTo(520, 520);
    ctx.lineTo(520, 300);
    ctx.lineTo(560, 278);
    ctx.lineTo(560, 520);
    ctx.moveTo(610, 520);
    ctx.lineTo(610, 240);
    ctx.lineTo(640, 218);
    ctx.lineTo(672, 240);
    ctx.lineTo(672, 520);
    ctx.moveTo(720, 520);
    ctx.lineTo(720, 330);
    ctx.lineTo(790, 310);
    ctx.lineTo(790, 520);
    ctx.moveTo(820, 520);
    ctx.lineTo(820, 360);
    ctx.lineTo(910, 340);
    ctx.lineTo(910, 520);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,61,184,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    const lit = [
      [538, 340], [538, 372], [538, 404],
      [632, 268], [632, 300], [632, 332],
      [746, 360], [746, 392],
      [848, 390], [878, 390], [848, 422]
    ];
    for (let i = 0; i < lit.length; i++) {
      const on = ((i * 3 + (G.t * 0.7 | 0)) % 5) !== 0;
      ctx.fillStyle = on ? 'rgba(0,240,255,0.16)' : 'rgba(255,61,184,0.08)';
      ctx.fillRect(lit[i][0], lit[i][1], 10, 12);
    }
  }

  function drawRuler() {
    const wr = windowRect(G.clock);
    const x = 26;
    const y0 = 28;
    const y1 = 470;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    const top = wr.y - wr.h * 0.5;
    const bot = wr.y + wr.h * 0.5;
    ctx.fillStyle = G.inWin ? 'rgba(255,227,107,0.22)' : 'rgba(0,240,255,0.12)';
    ctx.fillRect(x - 8, top, 16, Math.max(6, bot - top));
    ctx.strokeStyle = G.inWin ? '#ffe36b' : '#00f0ff';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = G.inWin ? 12 : 6;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x - 8, top, 16, Math.max(6, bot - top));
    ctx.shadowBlur = 0;
    ctx.fillStyle = G.inWin ? '#ffe36b' : '#ff3db8';
    ctx.beginPath();
    ctx.moveTo(x + 12, G.ky);
    ctx.lineTo(x + 22, G.ky - 6);
    ctx.lineTo(x + 22, G.ky + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawWindow() {
    const wr = windowRect(G.clock);
    const x = wr.x - wr.w * 0.5;
    const y = wr.y - wr.h * 0.5;
    const hot = G.inWin;
    const fill = G.hold;
    ctx.save();
    const glow = ctx.createRadialGradient(wr.x, wr.y, 8, wr.x, wr.y, wr.w);
    glow.addColorStop(0, hot
      ? 'rgba(255,227,107,' + (0.18 + fill * 0.22) + ')'
      : 'rgba(0,240,255,0.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 30, y - 30, wr.w + 60, wr.h + 60);

    roundRect(x, y, wr.w, wr.h, 5);
    ctx.fillStyle = hot
      ? 'rgba(40, 24, 8, ' + (0.45 + fill * 0.25) + ')'
      : 'rgba(8, 16, 28, 0.55)';
    ctx.fill();

    ctx.strokeStyle = hot ? '#ffe36b' : '#00f0ff';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = hot ? 16 : 10;
    ctx.lineWidth = 2.4;
    roundRect(x, y, wr.w, wr.h, 5);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = hot
      ? 'rgba(255,227,107,' + (0.45 + fill * 0.4) + ')'
      : 'rgba(0,240,255,0.35)';
    ctx.lineWidth = 1.15;
    const cols = 2;
    const rows = 3;
    for (let i = 1; i < cols; i++) {
      const lx = x + (wr.w * i) / cols;
      ctx.beginPath();
      ctx.moveTo(lx, y + 3);
      ctx.lineTo(lx, y + wr.h - 3);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const ly = y + (wr.h * j) / rows;
      ctx.beginPath();
      ctx.moveTo(x + 3, ly);
      ctx.lineTo(x + wr.w - 3, ly);
      ctx.stroke();
    }
    if (fill > 0) {
      ctx.strokeStyle = 'rgba(255,227,107,' + (0.25 + fill * 0.55) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wr.x, wr.y, Math.min(wr.w, wr.h) * 0.18, -Math.PI / 2, -Math.PI / 2 + TAU * fill);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWires() {
    for (let i = 0; i < G.wires.length; i++) {
      const w = G.wires[i];
      const gl = w.gapX - w.gapW * 0.5;
      const gr = w.gapX + w.gapW * 0.5;
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, w.y);
      ctx.lineTo(gl, w.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gr, w.y);
      ctx.lineTo(VW - 20, w.y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,61,184,0.7)';
      ctx.shadowColor = '#ff3db8';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(40, w.y + 4);
      ctx.lineTo(gl, w.y + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gr, w.y + 4);
      ctx.lineTo(VW - 20, w.y + 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffe36b';
      ctx.beginPath();
      ctx.arc(gl, w.y + 2, 3.2, 0, TAU);
      ctx.arc(gr, w.y + 2, 3.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBirds() {
    for (let i = 0; i < G.birds.length; i++) {
      const b = G.birds[i];
      const p = birdPos(b, G.clock);
      if (p.x < -30 || p.x > VW + 30) continue;
      const flap = Math.sin(G.t * 13 + b.ph) * 0.7;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(b.dir, 1);
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-14, flap * -7);
      ctx.quadraticCurveTo(-2, 2, 11, 0);
      ctx.quadraticCurveTo(-2, 4, -13, flap * 8);
      ctx.stroke();
      ctx.fillStyle = '#ff3db8';
      ctx.beginPath();
      ctx.arc(6, 0, 2.1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawString() {
    const dx = G.kx - HX;
    const dy = G.ky - HY;
    const len = hypot(dx, dy) || 1;
    let px = -dy / len;
    let py = dx / len;
    if (py < 0) { px = -px; py = -py; }
    const slack = clamp(0.9 - G.wind, 0.05, 0.85);
    const sag = slack * len * 0.14;
    const mx = (HX + G.kx) * 0.5 + px * sag;
    const my = (HY + G.ky) * 0.5 + py * sag;
    ctx.save();
    ctx.strokeStyle = G.inWin ? 'rgba(255,227,107,0.9)' : 'rgba(0,240,255,0.85)';
    ctx.shadowColor = G.inWin ? '#ffe36b' : '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(HX, HY);
    ctx.quadraticCurveTo(mx, my, G.kx, G.ky);
    ctx.stroke();
    ctx.restore();
  }

  function drawTail(ang, len, amp, phase, col, width) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const tx = G.kx - Math.cos(ang) * 16;
    const ty = G.ky - Math.sin(ang) * 16;
    ctx.moveTo(tx, ty);
    for (let i = 1; i <= 9; i++) {
      const u = i / 9;
      const d = u * len;
      const wave = Math.sin(phase + u * 6.2) * amp * u;
      const px = tx - Math.cos(ang) * d + Math.sin(ang) * wave;
      const py = ty - Math.sin(ang) * d * 0.15 + u * 22 + Math.cos(phase * 0.8 + u * 5) * amp * 0.45 * u;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawKite() {
    const ang = Math.atan2(G.ky - HY, G.kx - HX);
    drawTail(ang, 54, 11, G.t * 5.2, '#ff3db8', 1.8);
    drawTail(ang + 0.22, 46, 9, G.t * 4.6 + 1.2, '#00f0ff', 1.4);

    ctx.save();
    ctx.translate(G.kx, G.ky);
    ctx.rotate(ang);
    const hot = G.inWin;
    ctx.fillStyle = '#160814';
    ctx.strokeStyle = hot ? '#ffe36b' : '#ff3db8';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = hot ? 18 : 12;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(-16, 0);
    ctx.lineTo(0, -13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-14, 0);
    ctx.moveTo(0, -11);
    ctx.lineTo(0, 11);
    ctx.stroke();
    ctx.fillStyle = hot ? '#ffe36b' : '#00f0ff';
    ctx.beginPath();
    ctx.arc(1, 0, 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawRoof() {
    ctx.save();
    const g = ctx.createLinearGradient(0, 430, 0, VH);
    g.addColorStop(0, 'rgba(5,3,12,0)');
    g.addColorStop(0.55, 'rgba(255,61,184,0.05)');
    g.addColorStop(1, 'rgba(0,240,255,0.07)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 430, VW, VH - 430);

    ctx.fillStyle = '#0a0614';
    ctx.beginPath();
    ctx.moveTo(0, 518);
    ctx.lineTo(0, 470);
    ctx.lineTo(46, 452);
    ctx.lineTo(92, 468);
    ctx.lineTo(140, 456);
    ctx.lineTo(210, 474);
    ctx.lineTo(320, 462);
    ctx.lineTo(480, 478);
    ctx.lineTo(640, 468);
    ctx.lineTo(800, 480);
    ctx.lineTo(VW, 470);
    ctx.lineTo(VW, 540);
    ctx.lineTo(0, 540);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,61,184,0.45)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ff3db8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.lineTo(46, 452);
    ctx.lineTo(92, 468);
    ctx.lineTo(140, 456);
    ctx.lineTo(210, 474);
    ctx.lineTo(320, 462);
    ctx.lineTo(480, 478);
    ctx.lineTo(640, 468);
    ctx.lineTo(800, 480);
    ctx.lineTo(VW, 470);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(HX, HY);
    ctx.fillStyle = '#12081c';
    ctx.strokeStyle = 'rgba(0,240,255,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-6, -18);
    ctx.lineTo(8, -18);
    ctx.lineTo(12, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1, -26, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ff3db8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(8, -14);
    ctx.lineTo(18, -4);
    ctx.stroke();

    ctx.save();
    ctx.translate(18, -4);
    ctx.rotate(G.reelAng);
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.strokeStyle = colOf(r.col);
      ctx.globalAlpha = Math.max(0, r.t) * 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = colOf(p.col);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(G.t * 1.4 + m.p));
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(m.x + Math.sin(G.t * 0.3 + m.p) * 8, m.y, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    const W = view.w;
    const H = view.h;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    ctx.save();
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox + shx, view.oy + shy);
    ctx.beginPath();
    ctx.rect(-1, -1, VW + 2, VH + 2);
    ctx.clip();

    drawSky();
    drawBuildings();
    drawRuler();
    drawWindow();
    drawWires();
    drawBirds();
    drawString();
    drawKite();
    drawRoof();
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(' + G.flashCol + ',' + (G.flash * 0.22) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (view.ox > 0) {
      ctx.fillStyle = '#05030c';
      ctx.fillRect(0, 0, view.ox, H);
      ctx.fillRect(W - view.ox, 0, view.ox + 2, H);
    }
    if (view.oy > 0) {
      ctx.fillStyle = '#05030c';
      ctx.fillRect(0, 0, W, view.oy);
      ctx.fillRect(0, H - view.oy, W, view.oy + 2);
    }
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * view.w;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * view.h;
    return { x: (x - view.ox) / view.scale, y: (y - view.oy) / view.scale };
  }

  function resize() {
    const stage = document.getElementById('stage');
    const rect = stage.getBoundingClientRect();
    view.dpr = Math.min(2.25, window.devicePixelRatio || 1);
    view.w = Math.max(1, Math.floor(rect.width * view.dpr));
    view.h = Math.max(1, Math.floor(rect.height * view.dpr));
    canvas.width = view.w;
    canvas.height = view.h;
    const fit = Math.min(view.w / VW, view.h / VH);
    view.scale = fit;
    view.ox = (view.w - VW * fit) * 0.5;
    view.oy = (view.h - VH * fit) * 0.5;
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startRun();
  }

  function bindHold(el, which) {
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      pad[which] = true;
      el.classList.add('held');
      audio.ensure();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    };
    const up = function () {
      pad[which] = false;
      el.classList.remove('held');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  bindHold(btnIn, 'inn');
  bindHold(btnOut, 'out');

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    if (overlayOpen()) return;
    audio.ensure();
    pointer.down = true;
    pointer.id = e.pointerId;
    const w = pointerWorld(e);
    pointer.y = w.y;
    pointer.prevY = w.y;
    pointer.moved = 0;
    canvas.classList.add('press');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
    const w = pointerWorld(e);
    pointer.moved += Math.abs(w.y - pointer.prevY);
    if (G.mode === 'play' && pointer.moved >= 8) {
      G.L = clamp(G.L - (pointer.prevY - w.y) * 1.42, LMIN, LMAX);
    }
    pointer.prevY = w.y;
    pointer.y = w.y;
  });

  function endPointer(e) {
    if (pointer.id !== null && e && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('press');
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (G.mode !== 'play' || overlayOpen()) return;
    G.L = clamp(G.L + e.deltaY * 0.16, LMIN, LMAX);
  }, { passive: false });

  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    const c = e.code;
    if (c === 'KeyM') {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (c === 'KeyR') {
      e.preventDefault();
      audio.ensure();
      startRun();
      return;
    }
    if (c === 'Enter') {
      if (overlayOpen()) {
        e.preventDefault();
        overlayAction();
      }
      return;
    }
    if (c === 'Space') {
      e.preventDefault();
      if (overlayOpen()) {
        overlayAction();
        keys.inn = false;
        return;
      }
      keys.inn = true;
      return;
    }
    if (c === 'ArrowUp' || c === 'KeyW' || c === 'KeyE') {
      e.preventDefault();
      if (!overlayOpen()) keys.inn = true;
    }
    if (c === 'ArrowDown' || c === 'KeyS' || c === 'KeyD') {
      e.preventDefault();
      if (!overlayOpen()) keys.out = true;
    }
  });

  window.addEventListener('keyup', function (e) {
    const c = e.code;
    if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW' || c === 'KeyE') keys.inn = false;
    if (c === 'ArrowDown' || c === 'KeyS' || c === 'KeyD') keys.out = false;
  });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    overlayAction();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.inn = false;
    keys.out = false;
    pointer.down = false;
    pointer.id = null;
    pad.inn = false;
    pad.out = false;
    btnIn.classList.remove('held');
    btnOut.classList.remove('held');
    canvas.classList.remove('press');
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) last = 0;
  });

  let last = 0;
  let acc = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    acc += dt;
    G.t += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
    syncHud(false);
    requestAnimationFrame(frame);
  }

  seedDecor();
  loadStage(0);
  G.mode = 'title';
  const tAim = kiteAim(STAGES[0].targetL, STAGES[0].wind);
  G.wx0 = tAim.x;
  G.wy0 = tAim.y;
  G.L = 214;
  const st = kiteAim(G.L, 0.5);
  G.kx = st.x;
  G.ky = st.y;
  resize();
  syncHud(true);
  requestAnimationFrame(frame);
})();
