'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const LX = 268;
  const RX = 692;
  const CX = 480;
  const WHEEL_Y = 58;
  const WHEEL_R = 24;
  const CRATE_W = 86;
  const CRATE_H = 68;
  const DEFAULT_PAD = 498;
  const FLOOR_Y = 516;
  const GRAV = 780;
  const BRAKE = 11.5;
  const BASE = 2;
  const LIVES = 3;
  const STEP = 1 / 60;
  const PHYS = 1 / 240;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-pulley-two-mute';
  const MAG = '#ff3db8';
  const CYN = '#00f0ff';
  const GOLD = '#ffe36b';

  function layout(hL, hR, padL, padR) {
    padL = padL == null ? DEFAULT_PAD : padL;
    padR = padR == null ? DEFAULT_PAD : padR;
    return {
      startL: padL - CRATE_H - hL,
      startR: padR - CRATE_H - hR,
      padL: padL,
      padR: padR,
      hL: hL,
      hR: hR
    };
  }

  const STAGES = [
    Object.assign(layout(330, 330), {
      name: '初衡', sub: 'EVEN', pool: 2, window: 0.16,
      hint: '两边一样重就会一起落地',
      toast: '砝码相等即可 · 也可以空着直接放'
    }),
    Object.assign(layout(340, 240), {
      name: '左高', sub: 'LEFT', pool: 2, window: 0.14,
      hint: '高的那边更重，才会追上',
      toast: '粉箱更高 · 多给它一块'
    }),
    Object.assign(layout(200, 280), {
      name: '右高', sub: 'RIGHT', pool: 3, window: 0.13,
      hint: '把配重给更高的青箱',
      toast: '青箱更高 · 点右边加码'
    }),
    Object.assign(layout(332, 266), {
      name: '双码', sub: 'PAIR', pool: 4, window: 0.12,
      hint: '按落差配，不一定用完',
      toast: '粉比青大约多一块'
    }),
    Object.assign(layout(338, 170), {
      name: '深井', sub: 'WELL', pool: 5, window: 0.10,
      hint: '落差很大，高侧多压几块',
      toast: '粉箱从顶上坠 · 连加三块'
    }),
    Object.assign(layout(300, 300), {
      name: '粉雾', sub: 'HAZE', pool: 3, window: 0.12,
      gustL: { y0: 0, y1: 160, drag: 6 },
      hint: '粉雾会拖慢左边，给它补码',
      toast: '雾里更沉 · 左边多压'
    }),
    Object.assign(layout(310, 250, 498, 462), {
      name: '错台', sub: 'STEP', pool: 4, window: 0.10,
      hint: '落点台面一高一低，按真实落差配',
      toast: '看台面高度，不是只看箱子现在的位置'
    }),
    Object.assign(layout(338, 220), {
      name: '窄窗', sub: 'TIGHT', pool: 6, window: 0.07,
      hint: '齐落窗口更窄，看顶上的时差条',
      toast: '让粉标和青标贴在一起再放'
    }),
    Object.assign(layout(338, 210), {
      name: '中坠', sub: 'DROP', pool: 3, window: 0.09, air: true,
      hint: '先放下，再点落后的箱子把剩余砝码砸进去',
      toast: '这轮地上配不齐 · 放下后再空投'
    }),
    Object.assign(layout(338, 200), {
      name: '终轮', sub: 'FINALE', pool: 6, window: 0.07,
      gustL: { y0: 30, y1: 190, drag: 6 },
      hint: '粉雾加上大落差，窗口很窄',
      toast: '雾拖粉箱 · 高侧多码，余码留着也行'
    })
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
  const stageLabel = document.getElementById('stage-label');
  const massLabel = document.getElementById('mass-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const syncWrap = document.getElementById('sync-wrap');
  const markL = document.getElementById('mark-l');
  const markR = document.getElementById('mark-r');
  const syncBand = document.getElementById('sync-band');
  const syncNum = document.getElementById('sync-num');
  const btnLp = document.getElementById('btn-lp');
  const btnLm = document.getElementById('btn-lm');
  const btnRp = document.getElementById('btn-rp');
  const btnRm = document.getElementById('btn-rm');
  const btnGo = document.getElementById('btn-go');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const pointer = { down: false, id: null, x: CX, y: 200 };
  const keys = { a: false, d: false };
  const particles = [];
  const motes = [];
  const ripples = [];
  const flies = [];

  const G = {
    mode: 'title',
    phase: 'load',
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: CYN,
    toastT: 0,
    clearT: 0,
    failT: 0,
    ring: 0,
    paused: false,
    remaining: 2,
    sides: [null, null],
    spec: STAGES[0],
    hover: -1,
    holdL: 0,
    holdR: 0,
    clears: 0,
    perfects: 0,
    drops: 0,
    hud: ''
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
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
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
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    place: function (side) {
      this.ensure();
      const f = side === 0 ? 520 : 640;
      this.beep(f, 0.09, 'triangle', 0.06, f * 1.5);
      this.beep(f * 0.5, 0.07, 'sine', 0.04, f * 0.7);
    },
    lift: function () {
      this.ensure();
      this.beep(280, 0.08, 'sine', 0.04, 140);
    },
    deny: function () {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 80);
    },
    go: function () {
      this.ensure();
      this.noise(0.14, 0.06, 200, 900);
      this.beep(180, 0.18, 'sine', 0.07, 420);
    },
    thud: function (perfect) {
      this.ensure();
      this.noise(0.1, 0.07, 180, 70);
      this.beep(perfect ? 520 : 240, 0.14, 'triangle', 0.06, perfect ? 880 : 120);
    },
    sync: function (perfect) {
      this.ensure();
      this.beep(perfect ? 660 : 494, 0.16, 'triangle', 0.08, perfect ? 1320 : 740);
      this.beep(perfect ? 990 : 740, 0.28, 'sine', 0.05, perfect ? 1760 : 990);
    },
    miss: function () {
      this.ensure();
      this.noise(0.2, 0.09, 500, 90);
      this.beep(196, 0.32, 'sawtooth', 0.05, 70);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, 'triangle', 0.09, 880);
      this.beep(660, 0.24, 'sine', 0.07, 1320);
      this.beep(880, 0.4, 'sine', 0.05, 1760);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.42, 'sawtooth', 0.08, 55);
      this.beep(90, 0.64, 'square', 0.04, 40);
    },
    start: function () {
      this.ensure();
      this.beep(180, 0.14, 'sine', 0.06, 420);
      this.beep(280, 0.2, 'triangle', 0.045, 720);
    },
    tickDrone: function (falling, spd) {
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
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(48 + spd * 0.55, t, 0.12);
      this.droneGain.gain.setTargetAtTime(falling ? 0.012 + spd * 0.00004 : 0.0001, t, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

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
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 8, max: max || 54, t: 1, col: col || 'c' });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 2.5;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.2 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.6 + 0.12
      });
    }
  }

  function makeSide(x, startY, padY, h, col) {
    return {
      x: x,
      startY: startY,
      padY: padY,
      h: h,
      dist: 0,
      v: 0,
      n: 0,
      landed: false,
      landT: 0,
      squish: 1,
      spin: 0,
      col: col
    };
  }

  function crateTop(s) {
    const bob = (G.phase === 'load' || G.mode === 'title')
      ? Math.sin(G.t * 2.1 + (s.col === 'm' ? 0 : 1.3)) * 3.2
      : 0;
    return s.startY + s.dist + bob;
  }

  function massOf(s) {
    return BASE + s.n;
  }

  function gustFor(i) {
    return i === 0 ? G.spec.gustL : G.spec.gustR;
  }

  function fallTime(h, mass, gust, fromDist, fromV) {
    let y = fromDist || 0;
    let v = fromV || 0;
    let t = 0;
    let guard = 0;
    const dt = PHYS;
    while (y < h && guard++ < 40000) {
      let c = BRAKE;
      if (gust && y >= gust.y0 && y <= gust.y1) c += gust.drag;
      const a = GRAV - (c * v) / mass;
      v += a * dt;
      if (v < 0) v = 0;
      y += v * dt;
      t += dt;
    }
    return t;
  }

  function predict() {
    const a = G.sides[0];
    const b = G.sides[1];
    if (!a || !b) return { tL: 0, tR: 0, dt: 0, ok: false };
    const tL = a.landed ? 0 : fallTime(a.h, massOf(a), gustFor(0), a.dist, a.v);
    const tR = b.landed ? 0 : fallTime(b.h, massOf(b), gustFor(1), b.dist, b.v);
    const d = Math.abs(tL - tR);
    return { tL: tL, tR: tR, dt: d, ok: d <= G.spec.window };
  }

  function showOverlay(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'PULLEY';
      ovTitle.textContent = '滑轮';
      ovLead.innerHTML = '两边挂上配重，松开滑轮一起落地。<br />重的落得快，高的那边要更重。';
      ovOps.textContent = 'A / ← 左加  D / → 右加  Q E 减码  空格放下  点箱子  M 静音';
      ovBtn.textContent = '上轮';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'CLEAR';
      ovTitle.textContent = '齐落';
      ovLead.textContent = '十轮都吻上了。轮还在转。';
      ovOps.textContent = '齐落 ' + G.clears + ' 轮 · 正齐 ' + G.perfects + ' · 配重 ' + G.drops;
      ovBtn.textContent = '再上一轮';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'SNAP';
      ovTitle.textContent = '绳断';
      ovLead.textContent = '没同时落地。轮停了。';
      ovOps.textContent = STAGES[G.stage].name + ' · 齐落 ' + G.clears + ' 轮';
      ovBtn.textContent = '再来一局';
    }
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function loadStage(i) {
    G.stage = i;
    G.spec = STAGES[i];
    const s = G.spec;
    G.sides[0] = makeSide(LX, s.startL, s.padL, s.hL, 'm');
    G.sides[1] = makeSide(RX, s.startR, s.padR, s.hR, 'c');
    G.remaining = s.pool;
    G.phase = 'load';
    G.lock = 0.12;
    G.clock = 0;
    G.ring = 0;
    G.hover = -1;
    flies.length = 0;
    if (G.mode === 'play') toast(s.toast, s.air ? 'gold' : null);
    hintEl.textContent = s.hint + (s.air ? ' · 可空投' : '');
    hintEl.classList.toggle('hot', !!s.air);
    hintEl.classList.remove('warn');
  }

  function startRun() {
    G.mode = 'play';
    G.lives = LIVES;
    G.clears = 0;
    G.perfects = 0;
    G.drops = 0;
    hideOverlay();
    loadStage(0);
    audio.start();
  }

  function retry() {
    audio.ensure();
    startRun();
  }

  function onMain() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startRun();
  }

  function canLoad() {
    return G.mode === 'play' && G.phase === 'load' && G.lock <= 0;
  }

  function crateAt(x, y) {
    for (let i = 0; i < 2; i++) {
      const s = G.sides[i];
      if (!s) continue;
      const top = crateTop(s);
      if (x > s.x - CRATE_W * 0.55 && x < s.x + CRATE_W * 0.55 &&
          y > top - 8 && y < top + CRATE_H + 10) return i;
    }
    return -1;
  }

  function hitHub(x, y) {
    return hypot(x - CX, y - WHEEL_Y) < 34;
  }

  function addIngot(side, fromAir) {
    if (side !== 0 && side !== 1) return false;
    const s = G.sides[side];
    if (!s || s.landed) return false;
    if (G.remaining <= 0) {
      audio.deny();
      return false;
    }
    if (G.phase === 'fall' || G.phase === 'ring') {
      if (!G.spec.air) {
        audio.deny();
        return false;
      }
      G.remaining -= 1;
      G.drops += 1;
      flies.push({
        side: side,
        x: s.x + rand(-6, 6),
        y: WHEEL_Y + WHEEL_R + 4,
        vy: 420,
        n: 1
      });
      audio.place(side);
      return true;
    }
    if (!canLoad() && !fromAir) return false;
    G.remaining -= 1;
    s.n += 1;
    G.drops += 1;
    const top = crateTop(s);
    emit(7, {
      x: s.x, y: top + 18, j: 16,
      vx0: -80, vx1: 80, vy0: -120, vy1: -20,
      life: 0.38, r0: 1.2, r1: 3.2, col: 'g'
    });
    audio.place(side);
    return true;
  }

  function remIngot(side) {
    if (!canLoad()) return false;
    const s = G.sides[side];
    if (!s || s.n <= 0) {
      audio.deny();
      return false;
    }
    s.n -= 1;
    G.remaining += 1;
    const top = crateTop(s);
    emit(5, {
      x: s.x, y: top + 16, j: 12,
      vx0: -50, vx1: 50, vy0: -40, vy1: 40,
      life: 0.28, r0: 1, r1: 2.4, col: side === 0 ? 'm' : 'c'
    });
    audio.lift();
    return true;
  }

  function release() {
    if (!canLoad()) return;
    G.phase = 'fall';
    G.lock = 0.2;
    G.clock = 0;
    G.sides[0].v = 0;
    G.sides[1].v = 0;
    audio.go();
    emit(10, {
      x: CX, y: WHEEL_Y, j: 18,
      vx0: -60, vx1: 60, vy0: -40, vy1: 40,
      life: 0.4, r0: 1.4, r1: 3.4, col: 'g'
    });
    toast(G.spec.air ? '点落后的箱子空投' : '看两边吻台', G.spec.air ? 'gold' : null);
  }

  function succeed(perfect) {
    G.phase = 'clear';
    G.clearT = 1.15;
    G.clears += 1;
    if (perfect) G.perfects += 1;
    G.flash = 1;
    G.flashCol = GOLD;
    G.shake = 5;
    audio.sync(perfect);
    toast(perfect ? '正齐' : '齐落', 'gold');
    hintEl.classList.add('hot');
    hintEl.classList.remove('warn');
    const a = G.sides[0];
    const b = G.sides[1];
    ripple(a.x, a.padY, 'g', 70);
    ripple(b.x, b.padY, 'g', 70);
    emit(18, {
      x: a.x, y: a.padY, j: 22,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.7, r0: 1.5, r1: 4, col: 'g'
    });
    emit(18, {
      x: b.x, y: b.padY, j: 22,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.7, r0: 1.5, r1: 4, col: 'c'
    });
  }

  function fail(reason) {
    if (G.phase !== 'fall' && G.phase !== 'ring') return;
    G.phase = 'failwait';
    G.failT = 1.08;
    G.lives -= 1;
    G.shake = 11;
    G.flash = 1;
    G.flashCol = MAG;
    audio.miss();
    toast(reason, 'warn');
    hintEl.classList.add('warn');
    hintEl.classList.remove('hot');
    const a = G.sides[0];
    const b = G.sides[1];
    const slam = a.landed && !b.landed ? a : b.landed && !a.landed ? b : a;
    emit(22, {
      x: slam.x, y: slam.padY, j: 26,
      vx0: -180, vx1: 180, vy0: -260, vy1: 40,
      life: 0.7, r0: 1.6, r1: 4.4, col: slam.col
    });
  }

  function onLand(s) {
    s.landed = true;
    s.v = 0;
    s.dist = s.h;
    s.squish = 1.28;
    s.landT = G.clock;
    const pred = predict();
    const other = s === G.sides[0] ? G.sides[1] : G.sides[0];
    audio.thud(other.landed);
    ripple(s.x, s.padY, s.col, 48);
    emit(10, {
      x: s.x, y: s.padY, j: 16,
      vx0: -90, vx1: 90, vy0: -80, vy1: 10,
      life: 0.4, r0: 1.2, r1: 3, col: s.col
    });
    G.shake = Math.max(G.shake, 4);
    if (other.landed) {
      const dt = Math.abs(s.landT - other.landT);
      if (dt <= G.spec.window) succeed(dt <= G.spec.window * 0.35);
      else fail('没同时');
    } else {
      G.phase = 'ring';
      G.ring = G.spec.window;
      G.lock = 0.05;
    }
  }

  function nextStage() {
    if (G.stage + 1 >= STAGES.length) {
      G.mode = 'win';
      G.phase = 'load';
      audio.win();
      showOverlay('win');
      return;
    }
    loadStage(G.stage + 1);
  }

  function stepSide(s, i, dt) {
    if (s.landed) {
      s.squish = lerp(s.squish, 1, 14 * dt);
      return;
    }
    const gust = gustFor(i);
    let extra = 0;
    if (gust && s.dist >= gust.y0 && s.dist <= gust.y1) extra = gust.drag;
    const m = massOf(s);
    const a = GRAV - ((BRAKE + extra) * s.v) / m;
    s.v += a * dt;
    if (s.v < 0) s.v = 0;
    s.dist += s.v * dt;
    s.spin += s.v * dt / WHEEL_R;
    if (s.dist >= s.h) onLand(s);
  }

  function updateFlies(dt) {
    for (let i = flies.length - 1; i >= 0; i--) {
      const f = flies[i];
      const s = G.sides[f.side];
      f.vy += GRAV * 1.4 * dt;
      f.y += f.vy * dt;
      f.x = lerp(f.x, s.x, 8 * dt);
      const top = crateTop(s);
      if (s.landed) {
        emit(6, {
          x: f.x, y: f.y, j: 8,
          vx0: -60, vx1: 60, vy0: -40, vy1: 40,
          life: 0.3, r0: 1, r1: 2.4, col: 'g'
        });
        flies.splice(i, 1);
        continue;
      }
      if (f.y >= top + 8) {
        s.n += f.n;
        emit(8, {
          x: s.x, y: top + 14, j: 12,
          vx0: -70, vx1: 70, vy0: -90, vy1: -10,
          life: 0.35, r0: 1.2, r1: 3, col: 'g'
        });
        audio.place(f.side);
        flies.splice(i, 1);
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.5;
      r.r += (r.max - r.r) * 6 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    G.shake = Math.max(0, G.shake - dt * 16);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
  }

  function holdRepeat(side, held, dt) {
    if (!held || G.phase !== 'load') {
      if (side === 0) G.holdL = 0;
      else G.holdR = 0;
      return;
    }
    if (side === 0) G.holdL += dt;
    else G.holdR += dt;
    const t = side === 0 ? G.holdL : G.holdR;
    if (G.remaining <= 0) return;
    if (t > 0.38 && ((t * 8) | 0) !== (((t - dt) * 8) | 0)) addIngot(side);
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    holdRepeat(0, keys.a, dt);
    holdRepeat(1, keys.d, dt);

    if (G.phase === 'fall' || G.phase === 'ring') {
      let sub = dt;
      while (sub > 0) {
        const sdt = sub > PHYS ? PHYS : sub;
        stepSide(G.sides[0], 0, sdt);
        stepSide(G.sides[1], 1, sdt);
        sub -= sdt;
        if (G.phase !== 'fall' && G.phase !== 'ring') break;
      }
      updateFlies(dt);
    }

    if (G.phase === 'ring') {
      if (G.lock <= 0) G.ring -= dt;
      if (G.ring <= 0 && G.phase === 'ring') fail('窗口过了');
    }

    if (G.phase === 'clear') {
      G.clearT -= dt;
      G.sides[0].squish = lerp(G.sides[0].squish, 1, 10 * dt);
      G.sides[1].squish = lerp(G.sides[1].squish, 1, 10 * dt);
      if (G.clearT <= 0) nextStage();
    }

    if (G.phase === 'failwait') {
      G.failT -= dt;
      if (G.failT <= 0) {
        if (G.lives <= 0) {
          G.mode = 'lose';
          audio.lose();
          showOverlay('lose');
        } else {
          loadStage(G.stage);
        }
      }
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    if (!G.sides[0]) loadStage(0);
    G.phase = 'load';
  }

  function syncHud(force) {
    const pred = predict();
    const s = G.spec;
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + G.remaining + ':' +
      (G.sides[0] ? G.sides[0].n : 0) + ':' + (G.sides[1] ? G.sides[1].n : 0) + ':' +
      G.phase + ':' + (pred.dt * 40 | 0);
    if (!force && key === G.hud) return;
    G.hud = key;
    if (G.mode === 'title') {
      stageLabel.textContent = '滑轮';
      massLabel.textContent = 'PULLEY';
      massLabel.classList.remove('warn', 'hot');
      syncNum.textContent = '—';
    } else {
      stageLabel.textContent = '关卡 ' + (G.stage + 1) + '/' + STAGES.length + ' · ' + s.name + ' ' + s.sub;
      stageLabel.classList.toggle('hot', G.phase === 'clear');
      if (G.phase === 'fall' || G.phase === 'ring') {
        massLabel.textContent = G.spec.air ? '空投 ' + G.remaining : '下落';
        massLabel.classList.toggle('hot', pred.ok);
        massLabel.classList.toggle('warn', G.phase === 'ring');
      } else if (G.phase === 'clear') {
        massLabel.textContent = '齐落';
        massLabel.classList.add('hot');
        massLabel.classList.remove('warn');
      } else {
        massLabel.textContent = '余码 ' + G.remaining + (s.air ? ' · 可空投' : '');
        massLabel.classList.toggle('hot', pred.ok);
        massLabel.classList.toggle('warn', !pred.ok && G.remaining === 0);
      }
      const ms = Math.round(pred.dt * 1000);
      syncNum.textContent = G.phase === 'load' || G.phase === 'fall' || G.phase === 'ring'
        ? ms + 'ms'
        : '—';
    }
    const span = 3.05;
    const pL = clamp(pred.tL / span, 0.04, 0.96);
    const pR = clamp(pred.tR / span, 0.04, 0.96);
    markL.style.left = (pL * 100) + '%';
    markR.style.left = (pR * 100) + '%';
    const mid = (pL + pR) * 50;
    const w = Math.max(6, Math.abs(pL - pR) * 100 + 8);
    syncBand.style.left = (mid - w * 0.5) + '%';
    syncBand.style.width = w + '%';
    const hot = pred.ok && G.phase !== 'failwait';
    const warn = !pred.ok && G.phase === 'load';
    syncWrap.classList.toggle('hot', hot);
    syncWrap.classList.toggle('warn', warn && !hot);
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? ' on warn' : ' on') : '') + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function glowDot(x, y, r, col, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = r * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function colOf(c) {
    if (c === 'm') return MAG;
    if (c === 'g') return GOLD;
    return CYN;
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 40; x < WORLD_W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, FLOOR_Y - 8);
      ctx.stroke();
    }
    for (let y = 28; y < FLOOR_Y; y += 48) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(WORLD_W - 20, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGust(side, gust) {
    if (!gust) return;
    const s = G.sides[side];
    const x = s.x;
    const y0 = s.startY + gust.y0;
    const y1 = s.startY + gust.y1;
    const col = side === 0 ? MAG : CYN;
    ctx.save();
    const grd = ctx.createLinearGradient(x - 70, y0, x + 70, y1);
    grd.addColorStop(0, 'rgba(255,61,184,0)');
    grd.addColorStop(0.5, side === 0 ? 'rgba(255,61,184,0.14)' : 'rgba(0,240,255,0.12)');
    grd.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(x - 70, y0, 140, y1 - y0);
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 7; i++) {
      const yy = y0 + ((G.t * 38 + i * 28) % Math.max(12, y1 - y0));
      const ox = Math.sin(G.t * 2.2 + i) * 18;
      ctx.beginPath();
      ctx.moveTo(x - 22 + ox, yy);
      ctx.quadraticCurveTo(x + ox, yy + 8, x + 22 + ox, yy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBeam() {
    ctx.save();
    ctx.fillStyle = '#12101c';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.shadowColor = CYN;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.6;
    roundRect(118, 28, 724, 14, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.fillRect(132, 32, 80, 3);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.fillRect(748, 32, 80, 3);
    ctx.restore();
  }

  function drawWheel(s) {
    const x = s.x;
    const y = WHEEL_Y;
    const col = colOf(s.col);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.spin);
    ctx.strokeStyle = col;
    ctx.fillStyle = '#0c0814';
    ctx.shadowColor = col;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, WHEEL_R, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,227,107,0.55)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.lineTo(Math.cos(a) * (WHEEL_R - 4), Math.sin(a) * (WHEEL_R - 4));
      ctx.stroke();
    }
    ctx.fillStyle = GOLD;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawRope(s) {
    const top = crateTop(s);
    const x = s.x;
    const y0 = WHEEL_Y + WHEEL_R - 2;
    const y1 = top - 2;
    const slack = (G.phase === 'load' || G.mode === 'title')
      ? Math.sin(G.t * 2.4 + s.x) * 5
      : 0;
    ctx.save();
    ctx.strokeStyle = GOLD;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + slack, (y0 + y1) * 0.5, x, y1);
    ctx.stroke();
    ctx.restore();
  }

  function drawPad(s, hot) {
    const x = s.x;
    const y = s.padY;
    const col = hot ? GOLD : colOf(s.col);
    const w = 108;
    if (y < DEFAULT_PAD - 2) {
      ctx.save();
      ctx.fillStyle = '#0b0a14';
      ctx.strokeStyle = 'rgba(0,240,255,0.28)';
      ctx.lineWidth = 1.2;
      roundRect(x - 40, y + 10, 80, DEFAULT_PAD - y - 4, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,61,184,0.25)';
      for (let yy = y + 18; yy < DEFAULT_PAD - 4; yy += 10) {
        ctx.beginPath();
        ctx.moveTo(x - 32, yy);
        ctx.lineTo(x + 32, yy);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,22,0.92)';
    ctx.strokeStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = s.landed || hot ? 18 : 10;
    ctx.lineWidth = 2;
    roundRect(x - w / 2, y, w, 11, 5);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = col;
    ctx.fillRect(x - w / 2 + 8, y + 3, w - 16, 3);
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(x - 28, y + 11);
    ctx.lineTo(x - 22, FLOOR_Y - 2);
    ctx.moveTo(x + 28, y + 11);
    ctx.lineTo(x + 22, FLOOR_Y - 2);
    ctx.stroke();
    ctx.restore();
    if (G.phase === 'ring' && s.landed) {
      const k = clamp(G.ring / G.spec.window, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.45 * k;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 4, 18 + (1 - k) * 26, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFloor() {
    const g = ctx.createLinearGradient(0, 450, 0, WORLD_H);
    g.addColorStop(0, 'rgba(5,3,12,0)');
    g.addColorStop(0.5, 'rgba(255,61,184,0.05)');
    g.addColorStop(1, 'rgba(0,240,255,0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 450, WORLD_W, WORLD_H - 450);
    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,0.3)';
    ctx.shadowColor = CYN;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, FLOOR_Y);
    ctx.lineTo(WORLD_W - 40, FLOOR_Y);
    ctx.stroke();
    ctx.restore();
  }

  function drawCrate(s, i, hover) {
    const top = crateTop(s);
    const x = s.x;
    const col = colOf(s.col);
    const sq = s.squish;
    ctx.save();
    ctx.translate(x, top + CRATE_H * 0.5);
    ctx.scale(2 - sq, sq);
    ctx.translate(-x, -(top + CRATE_H * 0.5));
    ctx.fillStyle = s.col === 'm' ? '#140814' : '#081418';
    ctx.strokeStyle = hover ? GOLD : col;
    ctx.shadowColor = hover ? GOLD : col;
    ctx.shadowBlur = hover ? 18 : 12;
    ctx.lineWidth = 2;
    roundRect(x - CRATE_W * 0.5, top, CRATE_W, CRATE_H, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.12;
    roundRect(x - CRATE_W * 0.5 + 6, top + 6, CRATE_W - 12, 16, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    const n = s.n;
    for (let k = 0; k < n; k++) {
      const iy = top + CRATE_H - 14 - k * 9;
      if (iy < top + 10) break;
      ctx.fillStyle = GOLD;
      ctx.shadowColor = GOLD;
      ctx.shadowBlur = 8;
      roundRect(x - 24, iy, 48, 7, 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - 8, top);
    ctx.lineTo(x, top - 8);
    ctx.lineTo(x + 8, top);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x + CRATE_W * 0.5 - 11, top + 12, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.font = '700 11px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(massOf(s)), x + CRATE_W * 0.5 - 11, top + 12.5);
    ctx.restore();

    if (G.phase === 'load' && G.mode === 'play') {
      const py = top + 28;
      drawChip(x - CRATE_W * 0.5 - 18, py, '−', col);
      drawChip(x + CRATE_W * 0.5 + 18, py, '+', col);
    }
  }

  function drawChip(x, y, lab, col) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,18,0.72)';
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lab, x, y + 0.5);
    ctx.restore();
  }

  function hitChip(side, x, y) {
    const s = G.sides[side];
    const top = crateTop(s);
    const py = top + 28;
    if (hypot(x - (s.x - CRATE_W * 0.5 - 18), y - py) < 14) return 'm';
    if (hypot(x - (s.x + CRATE_W * 0.5 + 18), y - py) < 14) return 'p';
    return null;
  }

  function drawHub(ok) {
    const pulse = 0.85 + 0.15 * Math.sin(G.t * 6);
    const col = ok ? GOLD : (G.phase === 'fall' ? CYN : MAG);
    ctx.save();
    ctx.fillStyle = '#0c0816';
    ctx.strokeStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 16 * pulse;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(CX, WHEEL_Y, 22, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = col;
    ctx.font = '700 13px "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lab = G.phase === 'load' ? (ok ? '齐' : '放') : (G.phase === 'clear' ? '齐' : '轮');
    ctx.fillText(lab, CX, WHEEL_Y + 1);
    ctx.restore();
  }

  function drawTray() {
    const n = G.remaining;
    const w = Math.max(48, n * 16 + 20);
    ctx.save();
    ctx.fillStyle = 'rgba(12,10,22,0.8)';
    ctx.strokeStyle = 'rgba(255,227,107,0.35)';
    ctx.lineWidth = 1.2;
    roundRect(CX - w / 2, 502, w, 16, 6);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const x = CX - (n - 1) * 8 + i * 16;
      ctx.fillStyle = GOLD;
      ctx.shadowColor = GOLD;
      ctx.shadowBlur = 6;
      roundRect(x - 6, 506, 12, 8, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFlies() {
    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      ctx.save();
      ctx.fillStyle = GOLD;
      ctx.shadowColor = GOLD;
      ctx.shadowBlur = 10;
      roundRect(f.x - 10, f.y - 5, 20, 9, 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawWorld() {
    const grd = ctx.createRadialGradient(CX, 80, 20, CX, 240, 640);
    grd.addColorStop(0, '#0a0618');
    grd.addColorStop(1, '#05030c');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb = ctx.createRadialGradient(140, 40, 10, 140, 40, 360);
    neb.addColorStop(0, 'rgba(255,61,184,0.14)');
    neb.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb2 = ctx.createRadialGradient(820, 60, 10, 820, 60, 360);
    neb2.addColorStop(0, 'rgba(0,240,255,0.1)');
    neb2.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawGrid();
    drawFloor();
    if (G.spec.gustL) drawGust(0, G.spec.gustL);
    if (G.spec.gustR) drawGust(1, G.spec.gustR);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * m.s + m.p));
      glowDot(m.x, (m.y + G.t * 6 * m.s) % WORLD_H, m.r, i % 3 === 0 ? MAG : CYN, a);
    }

    drawBeam();
    if (G.sides[0] && G.sides[1]) {
      const pred = predict();
      const hot = pred.ok && (G.phase === 'load' || G.phase === 'clear');
      drawPad(G.sides[0], hot);
      drawPad(G.sides[1], hot);
      drawRope(G.sides[0]);
      drawRope(G.sides[1]);
      drawWheel(G.sides[0]);
      drawWheel(G.sides[1]);
      drawHub(hot || G.phase === 'clear');
      G.hover = crateAt(pointer.x, pointer.y);
      drawCrate(G.sides[0], 0, G.hover === 0);
      drawCrate(G.sides[1], 1, G.hover === 1);
      drawTray();
      drawFlies();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      glowDot(p.x, p.y, p.r, colOf(p.col), clamp(p.life / p.max, 0, 1));
    }
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.save();
      ctx.globalAlpha = r.t * 0.55;
      ctx.strokeStyle = colOf(r.col);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function draw() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, view.w, view.h);
    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) : 0;
    ctx.save();
    ctx.beginPath();
    const rw = WORLD_W * view.scale;
    const rh = WORLD_H * view.scale;
    roundRect(view.ox, view.oy, rw, rh, 14);
    ctx.clip();
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);
    drawWorld();
    ctx.restore();
    if (G.flash > 0) {
      ctx.save();
      ctx.globalAlpha = G.flash * 0.26;
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

  function handleTap(x, y, right) {
    audio.ensure();
    if (G.mode !== 'play') return;
    if (G.phase === 'load') {
      if (hitHub(x, y) && !right) {
        release();
        return;
      }
      for (let i = 0; i < 2; i++) {
        const chip = hitChip(i, x, y);
        if (chip === 'p') { addIngot(i); return; }
        if (chip === 'm') { remIngot(i); return; }
      }
      const c = crateAt(x, y);
      if (c >= 0) {
        if (right) remIngot(c);
        else addIngot(c);
        return;
      }
      if (x < CX - 40) addIngot(0);
      else if (x > CX + 40) addIngot(1);
      else if (y < 120) release();
      return;
    }
    if ((G.phase === 'fall' || G.phase === 'ring') && G.spec.air) {
      const c = crateAt(x, y);
      if (c >= 0) addIngot(c);
      else if (x < CX) addIngot(0);
      else addIngot(1);
    }
  }

  let last = 0;
  let acc = 0;
  function loop(now) {
    const t = now * 0.001;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.08) dt = 0.08;
    G.t = t;
    if (!G.paused) {
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        if (G.mode === 'title') updateTitle(STEP);
        else if (G.mode === 'play') updatePlay(STEP);
        updateFx(STEP);
        acc -= STEP;
      }
      const falling = G.mode === 'play' && (G.phase === 'fall' || G.phase === 'ring');
      const spd = falling ? (G.sides[0].v + G.sides[1].v) * 0.5 : 0;
      audio.tickDrone(falling, spd);
      syncHud(false);
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' || e.code === 'Space') {
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
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onMain();
      }
      return;
    }
    if (G.mode !== 'play') return;
    audio.ensure();
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      if (!e.repeat) addIngot(0);
      keys.a = true;
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      if (!e.repeat) addIngot(1);
      keys.d = true;
    }
    if (!e.repeat && (e.code === 'KeyQ' || e.code === 'KeyZ')) remIngot(0);
    if (!e.repeat && (e.code === 'KeyE' || e.code === 'KeyC' || e.code === 'KeyX')) remIngot(1);
    if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
      e.preventDefault();
      release();
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (G.mode !== 'play') return;
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    handleTap(w.x, w.y, e.button === 2);
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
  });

  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    pointer.down = false;
    pointer.id = null;
  });

  canvas.addEventListener('pointercancel', function () {
    pointer.down = false;
    pointer.id = null;
  });

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  function bindPad(el, fn) {
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      fn();
    });
  }
  bindPad(btnLp, function () { addIngot(0); });
  bindPad(btnLm, function () { remIngot(0); });
  bindPad(btnRp, function () { addIngot(1); });
  bindPad(btnRm, function () { remIngot(1); });
  bindPad(btnGo, function () { release(); });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    onMain();
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

  makeMotes();
  resize();
  loadStage(0);
  showOverlay('title');
  syncHud(true);
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
