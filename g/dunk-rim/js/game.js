'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const GRAV = 760;
  const BALL_R = 13.2;
  const AX = 188;
  const AY = 426;
  const HOOP_X = 786;
  const HOOP_Y = 198;
  const INNER = 32;
  const TUBE = 4.3;
  const FLOOR_Y = 508;
  const MIN_SPD = 520;
  const MAX_SPD = 980;
  const MAX_PULL = 170;
  const MIN_FIRE = 0.18;
  const ANG_MIN = -1.30;
  const ANG_MAX = -0.18;
  const TIMED = 60;
  const NET_N = 9;
  const NET_M = 6;
  const BEST_KEY = 'playbox-dunk-rim-best';
  const MUTE_KEY = 'playbox-dunk-rim-mute';
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPS_TITLE = '拖拽瞄准 · 空格投出 · 连灌不断直到投失 · 限时六十秒 · M 静音';
  const OPS_PLAY = '拖拽瞄准 · ←→ 角度 · ↑↓ 力度 · 空格投出 · R 重开 · M 静音';

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnStreak = document.getElementById('btn-streak');
  const btnTimed = document.getElementById('btn-timed');
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
  const powerLabel = document.getElementById('power-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, id: null, x: 0, y: 0, sx: 0, sy: 0 };

  const particles = [];
  const motes = [];
  const ripples = [];
  const pops = [];

  const G = {
    mode: 'title',
    kind: 'streak',
    t: 0,
    clock: 0,
    time: TIMED,
    score: 0,
    combo: 0,
    maxCombo: 0,
    makes: 0,
    swish: 0,
    shots: 0,
    bestS: 0,
    bestT: 0,
    angle: -0.98,
    power: 0.66,
    restAngle: -0.98,
    restPower: 0.66,
    pulling: false,
    flight: null,
    lock: 0,
    resetT: 0,
    endT: 0,
    slow: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashCol: '#ff6a22',
    punch: 1,
    arm: 0,
    toastT: 0,
    paused: false,
    lastTick: 99,
    overPending: false,
    newBest: false,
    demoCd: 1.2,
    aimHot: false,
    hud: '',
    hoop: { bx: HOOP_X, by: HOOP_Y, x: HOOP_X, y: HOOP_Y, inner: INNER, tube: TUBE },
    net: [],
    heat: 0
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
    taut: null,
    tautGain: null,
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
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
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
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
      f.Q.value = 0.85;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    fire: function (power) {
      this.ensure();
      const p = clamp(power, 0.2, 1);
      this.noise(0.12, 0.07 + p * 0.05, 420, 1400);
      this.beep(160 + p * 70, 0.1, 'sine', 0.045, 80);
      this.beep(520 + p * 180, 0.08, 'triangle', 0.04, 240);
    },
    rim: function () {
      this.ensure();
      this.noise(0.1, 0.11, 2200, 380);
      this.beep(340, 0.09, 'square', 0.045, 120);
      this.beep(180, 0.12, 'sine', 0.035, 70);
    },
    board: function () {
      this.ensure();
      this.noise(0.12, 0.09, 700, 160);
      this.beep(130, 0.14, 'sine', 0.05, 55);
    },
    bounce: function (hard) {
      this.ensure();
      this.noise(0.08, hard ? 0.07 : 0.04, 500, 120);
      this.beep(hard ? 200 : 140, 0.08, 'triangle', 0.03, 60);
    },
    swish: function (perfect, combo) {
      this.ensure();
      const p = 1 + Math.min(10, combo) * 0.05;
      this.noise(perfect ? 0.24 : 0.16, perfect ? 0.16 : 0.1, 2600, 380);
      this.beep(210 * p, 0.16, 'sine', 0.055, 88);
      this.beep((perfect ? 760 : 540) * p, 0.2, 'triangle', 0.075, (perfect ? 1520 : 920) * p);
      if (perfect) {
        this.beep(1180 * p, 0.28, 'sine', 0.06, 1980 * p);
        this.beep(1640 * p, 0.1, 'square', 0.028, 2400 * p);
        this.noise(0.1, 0.07, 4200, 900);
      }
    },
    miss: function () {
      this.ensure();
      this.beep(170, 0.22, 'sawtooth', 0.05, 62);
      this.beep(90, 0.3, 'sine', 0.03, 40);
    },
    deny: function () {
      this.ensure();
      this.beep(140, 0.07, 'square', 0.03, 90);
    },
    tick: function () {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.035, 440);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.12, 'sine', 0.055, 540);
      this.beep(330, 0.16, 'triangle', 0.04, 880);
    },
    end: function (win) {
      this.ensure();
      if (win) {
        this.beep(440, 0.14, 'triangle', 0.08, 880);
        this.beep(660, 0.22, 'sine', 0.06, 1320);
        this.beep(880, 0.34, 'sine', 0.045, 1760);
      } else {
        this.beep(240, 0.36, 'sawtooth', 0.07, 60);
        this.beep(96, 0.52, 'square', 0.04, 40);
      }
    },
    tickTaut: function (pulling, power) {
      if (!this.ctx || this.muted) return;
      if (!this.taut) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 90;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.taut = o;
        this.tautGain = g;
      }
      const t = this.ctx.currentTime;
      this.taut.frequency.setTargetAtTime(86 + power * 280, t, 0.07);
      this.tautGain.gain.setTargetAtTime(pulling ? 0.012 + power * 0.03 : 0.0001, t, 0.05);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      G.bestS = o.s | 0;
      G.bestT = o.t | 0;
    } catch (e) { /* ignore */ }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ s: G.bestS, t: G.bestT }));
    } catch (e) { /* ignore */ }
  }

  function currentBest() {
    return G.kind === 'timed' ? G.bestT : G.bestS;
  }

  function considerBest() {
    if (G.kind === 'timed') {
      if (G.score > G.bestT) {
        G.bestT = G.score;
        G.newBest = true;
        saveBest();
      }
    } else if (G.score > G.bestS) {
      G.bestS = G.score;
      G.newBest = true;
      saveBest();
    }
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
        col: spec.col || 'o'
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: max || 52, t: 1, col: col || 'c' });
  }

  function pop(x, y, text, col) {
    if (pops.length > 12) pops.shift();
    pops.push({ x: x, y: y, text: text, col: col || '#ffe36b', t: 1, vy: -64 });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 1.8;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 56; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.2 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.7 + 0.12
      });
    }
  }

  function initNet() {
    G.net = [];
    for (let i = 0; i < NET_N; i++) {
      const str = [];
      for (let j = 0; j < NET_M; j++) {
        str.push({ x: 0, y: 0, px: 0, py: 0, pin: j === 0 });
      }
      G.net.push(str);
    }
    resetNet(true);
  }

  function netPin(i, hoop) {
    const u = i / (NET_N - 1);
    return {
      x: hoop.x + (u - 0.5) * hoop.inner * 2,
      y: hoop.y + Math.sin(u * Math.PI) * 3.4
    };
  }

  function netRest(i, j, hoop) {
    const u = i / (NET_N - 1);
    const v = j / (NET_M - 1);
    const top = netPin(i, hoop);
    const botW = hoop.inner * 0.7;
    const botX = hoop.x + (u - 0.5) * botW * 2;
    const botY = hoop.y + 54;
    return {
      x: top.x + (botX - top.x) * v,
      y: top.y + (botY - top.y) * (v * 0.55 + v * v * 0.45)
    };
  }

  function resetNet(snap) {
    const hoop = G.hoop;
    for (let i = 0; i < NET_N; i++) {
      for (let j = 0; j < NET_M; j++) {
        const r = netRest(i, j, hoop);
        const p = G.net[i][j];
        if (p.pin || snap) {
          p.x = r.x;
          p.y = r.y;
          p.px = r.x;
          p.py = r.y;
        }
      }
    }
  }

  function stirNet(imp, spread) {
    const hoop = G.hoop;
    for (let i = 0; i < NET_N; i++) {
      for (let j = 1; j < NET_M; j++) {
        const p = G.net[i][j];
        const v = j / (NET_M - 1);
        const k = imp * (0.35 + v * 0.9) * (1 - Math.abs(i / (NET_N - 1) - 0.5) * spread);
        p.py -= k;
        p.px += (Math.random() - 0.5) * k * 0.35;
      }
    }
    resetNet(false);
    const pin0 = netPin(0, hoop);
    G.net[0][0].x = pin0.x;
    G.net[0][0].y = pin0.y;
  }

  function updateNet(dt) {
    const hoop = G.hoop;
    const damp = 0.965;
    const g = 980 * dt * dt;
    for (let i = 0; i < NET_N; i++) {
      const pin = netPin(i, hoop);
      const head = G.net[i][0];
      head.x = pin.x;
      head.y = pin.y;
      head.px = pin.x;
      head.py = pin.y;
      for (let j = 1; j < NET_M; j++) {
        const p = G.net[i][j];
        const vx = (p.x - p.px) * damp;
        const vy = (p.y - p.py) * damp;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + g;
        const rest = netRest(i, j, hoop);
        p.x += (rest.x - p.x) * 0.08;
        p.y += (rest.y - p.y) * 0.05;
      }
      const restLen = 11.2;
      for (let pass = 0; pass < 2; pass++) {
        for (let j = 1; j < NET_M; j++) {
          const a = G.net[i][j - 1];
          const b = G.net[i][j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = hypot(dx, dy) || 0.001;
          const diff = (d - restLen) / d;
          if (a.pin) {
            b.x -= dx * diff;
            b.y -= dy * diff;
          } else {
            b.x -= dx * diff * 0.5;
            b.y -= dy * diff * 0.5;
            a.x += dx * diff * 0.5;
            a.y += dy * diff * 0.5;
          }
        }
      }
    }
    if (G.flight && G.flight.live) wrapNet(G.flight);
  }

  function wrapNet(ball) {
    const hoop = G.hoop;
    if (ball.y < hoop.y - 6 || ball.y > hoop.y + 72) return;
    if (Math.abs(ball.x - hoop.x) > hoop.inner + 10) return;
    const down = ball.vy > 30;
    for (let i = 0; i < NET_N; i++) {
      for (let j = 1; j < NET_M; j++) {
        const p = G.net[i][j];
        const dx = p.x - ball.x;
        const dy = p.y - ball.y;
        const d = hypot(dx, dy) || 0.001;
        const min = BALL_R + 7;
        if (d < min) {
          const push = (min - d) * (down ? 1.6 : 0.35);
          p.x += (dx / d) * push;
          p.y += (dy / d) * push * 0.7;
        }
      }
    }
  }

  function moveLevel() {
    if (G.kind === 'timed') return G.makes + (G.clock > 18 ? 2 : 0);
    return G.combo;
  }

  function hoopAt(clock) {
    const lv = G.mode === 'title' ? 0 : moveLevel();
    let x = G.hoop.bx;
    let y = G.hoop.by;
    if (lv >= 3) {
      const ampY = 16 + Math.min(24, (lv - 3) * 2.8);
      const spdY = 1.1 + Math.min(0.85, (lv - 3) * 0.07);
      y += Math.sin(clock * spdY) * ampY;
    }
    if (lv >= 6) {
      const ampX = 20 + Math.min(30, (lv - 6) * 2.6);
      const spdX = 0.82 + Math.min(0.7, (lv - 6) * 0.055);
      x += Math.sin(clock * spdX + 0.65) * ampX;
    }
    return { x: x, y: y };
  }

  function syncHoop() {
    const p = hoopAt(G.clock);
    G.hoop.x = p.x;
    G.hoop.y = p.y;
  }

  function speedOf(power) {
    return MIN_SPD + clamp(power, 0, 1) * (MAX_SPD - MIN_SPD);
  }

  function predHot() {
    return G.aimHot;
  }

  function ballRest(noBob) {
    const rec = G.pulling && !G.flight ? G.power * 12 : 0;
    const bob = (noBob || G.flight) ? 0 : Math.sin(G.t * 3.1) * 2.1;
    const arm = G.arm > 0 ? -G.arm * 8 : 0;
    return {
      x: AX - Math.cos(G.angle) * rec + Math.cos(G.angle) * arm * 0.4,
      y: AY - Math.sin(G.angle) * rec + bob + Math.sin(G.angle) * arm * 0.4
    };
  }

  function canShoot() {
    return G.mode === 'play' && !G.flight && G.lock <= 0 && G.resetT <= 0 && !G.overPending &&
      !(G.kind === 'timed' && G.time <= 0);
  }

  function fire(demo) {
    if (!demo && !canShoot()) return;
    if (!demo && G.power < MIN_FIRE) {
      audio.deny();
      return;
    }
    const rest = ballRest(true);
    const spd = speedOf(G.power);
    G.flight = {
      x: rest.x,
      y: rest.y,
      vx: Math.cos(G.angle) * spd,
      vy: Math.sin(G.angle) * spd,
      spin: G.power * 8 + 2,
      age: 0,
      live: true,
      scored: false,
      rim: false,
      board: false,
      passed: false,
      demo: !!demo,
      trail: []
    };
    G.restAngle = G.angle;
    G.restPower = G.power;
    G.pulling = false;
    G.arm = 1;
    canvas.classList.remove('drawing');
    if (!demo) {
      G.shots += 1;
      audio.fire(G.power);
    }
    emit(12, {
      x: rest.x, y: rest.y, j: 5,
      vx0: G.flight.vx * 0.03, vx1: G.flight.vx * 0.1,
      vy0: G.flight.vy * 0.03, vy1: G.flight.vy * 0.1,
      life: 0.28, r0: 1.2, r1: 3.4, col: 'o'
    });
    ripple(rest.x, rest.y, 'o', 26);
  }

  function setAimFromDrag(sx, sy, x, y) {
    let dx = x - sx;
    let dy = y - sy;
    const len = hypot(dx, dy);
    if (len < 4) return;
    if (dx < 10) {
      dx = -dx;
      dy = -dy;
    }
    G.angle = clamp(Math.atan2(dy, dx), ANG_MIN, ANG_MAX);
    G.power = clamp(len / MAX_PULL, 0, 1);
  }

  function beginPull(wx, wy) {
    if (!canShoot()) return;
    G.pulling = true;
    pointer.sx = wx;
    pointer.sy = wy;
    canvas.classList.add('drawing');
    audio.ensure();
  }

  function movePull(wx, wy) {
    if (!G.pulling || G.flight) return;
    setAimFromDrag(pointer.sx, pointer.sy, wx, wy);
  }

  function endPull() {
    canvas.classList.remove('drawing');
    if (!G.pulling) return;
    if (!canShoot()) {
      G.pulling = false;
      return;
    }
    if (G.power >= MIN_FIRE) fire(false);
    else {
      G.pulling = false;
      G.angle = G.restAngle;
      G.power = G.restPower;
      audio.deny();
    }
  }

  function bounceCircle(ball, cx, cy, rr, kind) {
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const d = hypot(dx, dy);
    const min = BALL_R + rr;
    if (d >= min || d < 0.0008) return false;
    const nx = dx / d;
    const ny = dy / d;
    const overlap = min - d;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      const e = kind === 'rim' ? 0.52 : 0.42;
      ball.vx -= (1 + e) * vn * nx;
      ball.vy -= (1 + e) * vn * ny;
      const tx = -ny;
      const ty = nx;
      const vt = ball.vx * tx + ball.vy * ty;
      ball.vx -= vt * tx * 0.22;
      ball.vy -= vt * ty * 0.22;
      ball.spin += vt * 0.06;
      return true;
    }
    return false;
  }

  function hitStop(ms, slow) {
    if (REDUCE) return;
    if (slow) G.slow = Math.max(G.slow, ms);
    else G.stop = Math.max(G.stop, ms);
  }

  function onMake(ball, kind) {
    if (ball.scored) return;
    ball.scored = true;
    ball.passed = true;
    const hoop = G.hoop;
    const demo = ball.demo;
    const dunk = ball.vy > 360;
    const perfect = kind === 'swish';
    if (!demo) {
      G.combo += 1;
      G.makes += 1;
      if (G.combo > G.maxCombo) G.maxCombo = G.combo;
      if (perfect) G.swish += 1;
      let pts = (perfect ? 3 : 2) * G.combo;
      if (dunk) pts += G.combo;
      G.score += pts;
      considerBest();
      flashScore(pts);
      G.heat = Math.min(1, G.heat + 0.18);
    }
    audio.swish(perfect, demo ? 1 : G.combo);
    hitStop(perfect ? 0.08 : 0.042, perfect);
    G.flash = perfect ? 0.42 : 0.28;
    G.flashCol = perfect ? '#ffe36b' : (dunk ? '#ff6a22' : '#00f0ff');
    if (!REDUCE) {
      G.shake = perfect ? 7.5 : (dunk ? 6.2 : 3.6);
      G.punch = perfect ? 1.07 : 1.035;
    }
    ripple(hoop.x, hoop.y, perfect ? 'g' : 'c', perfect ? 86 : 62);
    emit(perfect ? 36 : 22, {
      x: hoop.x, y: hoop.y + 8, j: 16,
      vx0: -220, vx1: 220, vy0: -40, vy1: 280,
      life: 0.7, r0: 1.4, r1: 4.6, col: perfect ? 'g' : (dunk ? 'o' : 'c')
    });
    emit(10, {
      x: hoop.x, y: hoop.y, j: 8,
      vx0: -80, vx1: 80, vy0: 40, vy1: 160,
      life: 0.45, r0: 1, r1: 2.4, col: 'w'
    });
    stirNet(perfect ? 16 : (dunk ? 18 : 10), 0.4);
    let word = '灌进';
    if (perfect) word = '空心';
    else if (kind === 'bank') word = '打板';
    else if (kind === 'rim') word = '擦筐';
    if (dunk && !perfect) word = '灌进';
    if (!demo) {
      const extra = comboWord(G.combo);
      toast((extra ? extra + ' · ' : '') + word + ' ×' + G.combo, perfect ? 'gold' : '');
      pop(hoop.x, hoop.y - 28, '+' + pts + (dunk ? ' 灌' : ''), perfect ? '#ffe36b' : '#ffb347');
      if (G.combo >= 3) pop(hoop.x + 18, hoop.y - 48, '×' + G.combo, '#00f0ff');
    }
    G.resetT = perfect ? 0.78 : 0.58;
    G.lock = 1;
  }

  function comboWord(n) {
    if (n >= 12) return '鬼神';
    if (n >= 8) return '暴走';
    if (n >= 5) return '火热';
    if (n >= 3) return '连中';
    return '';
  }

  function flashScore(add) {
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    comboEl.textContent = '×' + G.combo;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + add;
    scoreAdd.classList.remove('score-add');
    void scoreAdd.offsetWidth;
    scoreAdd.classList.add('score-add');
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
  }

  function onMiss(ball, why) {
    if (!ball || !ball.live) return;
    if (ball.scored) {
      ball.live = false;
      return;
    }
    ball.live = false;
    if (ball.demo) {
      G.resetT = 0.2;
      return;
    }
    audio.miss();
    G.flash = 0.22;
    G.flashCol = '#ff3db8';
    if (!REDUCE) G.shake = 3.2;
    emit(16, {
      x: ball.x, y: ball.y, j: 8,
      vx0: -140, vx1: 140, vy0: -80, vy1: 40,
      life: 0.4, r0: 1.2, r1: 3.2, col: 'm'
    });
    const had = G.combo;
    G.combo = 0;
    G.heat *= 0.35;
    comboEl.textContent = '×0';
    if (G.kind === 'streak') {
      toast(had > 0 ? '断了 · 连 ' + had : '偏了', 'warn');
      G.endT = 0.42;
      G.lock = 1;
    } else {
      toast('偏了', 'warn');
      G.resetT = 0.38;
      G.lock = 1;
    }
  }

  function checkMake(ball, prevY) {
    if (ball.scored || ball.passed) return;
    const hoop = G.hoop;
    if (ball.vy < 40) return;
    const within = Math.abs(ball.x - hoop.x) < hoop.inner - 1.8;
    const crossed = prevY < hoop.y + 2 && ball.y >= hoop.y - 3;
    if (within && crossed) {
      let kind = 'rim';
      if (!ball.rim && !ball.board) kind = 'swish';
      else if (ball.board && !ball.rim) kind = 'bank';
      onMake(ball, kind);
    }
  }

  function collideWorld(ball, dt) {
    const hoop = G.hoop;
    const frontX = hoop.x - hoop.inner;
    const backX = hoop.x + hoop.inner;
    const ry = hoop.y;
    if (bounceCircle(ball, frontX, ry, hoop.tube, 'rim') || bounceCircle(ball, backX, ry, hoop.tube, 'rim')) {
      if (!ball.rim) {
        ball.rim = true;
        audio.rim();
        hitStop(0.028, false);
        if (!REDUCE) G.shake = Math.max(G.shake, 2.4);
        emit(8, {
          x: ball.x, y: ball.y, j: 3,
          vx0: -90, vx1: 90, vy0: -120, vy1: 40,
          life: 0.28, r0: 1, r1: 2.4, col: 'o'
        });
      }
    }
    const bx1 = hoop.x + hoop.inner + hoop.tube + 5;
    const bx2 = bx1 + 8;
    const by1 = hoop.y - 90;
    const by2 = hoop.y + 20;
    if (ball.x + BALL_R > bx1 && ball.x - BALL_R < bx2 && ball.y + BALL_R > by1 && ball.y - BALL_R < by2) {
      const fromL = (ball.x + BALL_R) - bx1;
      if (ball.vx > 0 && fromL < 16) {
        ball.x = bx1 - BALL_R;
        ball.vx = -Math.abs(ball.vx) * 0.54;
        ball.vy *= 0.88;
        ball.spin += 4;
        if (!ball.board) {
          ball.board = true;
          audio.board();
          hitStop(0.024, false);
          emit(7, {
            x: bx1, y: ball.y, j: 6,
            vx0: -160, vx1: -20, vy0: -80, vy1: 80,
            life: 0.3, r0: 1, r1: 2.6, col: 'c'
          });
        }
      }
    }
    if (ball.y > FLOOR_Y - BALL_R) {
      ball.y = FLOOR_Y - BALL_R;
      if (ball.vy > 0) {
        const hard = ball.vy > 180;
        ball.vy *= -0.36;
        ball.vx *= 0.74;
        ball.spin *= 0.8;
        if (hard) {
          audio.bounce(true);
          emit(6, {
            x: ball.x, y: FLOOR_Y, j: 8,
            vx0: -60, vx1: 60, vy0: -80, vy1: -10,
            life: 0.28, r0: 1, r1: 2.2, col: 'o'
          });
        }
        if (!ball.scored && ball.live) onMiss(ball, 'floor');
      }
    }
    if (ball.x < -40 || ball.x > WORLD_W + 50 || ball.y < -60 || ball.y > WORLD_H + 30) {
      if (ball.live && !ball.scored) onMiss(ball, 'out');
      else if (ball.scored) G.resetT = Math.max(G.resetT, 0.12);
    }
  }

  function updateFlight(dt) {
    const ball = G.flight;
    if (!ball || !ball.live && ball.age > 2.4) return;
    const n = 2;
    const h = dt / n;
    for (let s = 0; s < n; s++) {
      if (!ball.live && ball.y > FLOOR_Y + 40) break;
      const prevY = ball.y;
      ball.vy += GRAV * h;
      ball.x += ball.vx * h;
      ball.y += ball.vy * h;
      ball.spin += ball.vx * h * 0.012;
      ball.age += h;
      collideWorld(ball, h);
      if (ball.live || ball.scored) checkMake(ball, prevY);
    }
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 14) ball.trail.shift();
  }

  function resetBall() {
    G.flight = null;
    G.pulling = false;
    G.lock = 0.05;
    G.resetT = 0;
    G.arm = 0;
    G.angle = G.restAngle;
    G.power = G.restPower;
    canvas.classList.remove('drawing');
    pointer.down = false;
    if (G.overPending) endRun('time');
  }

  function startRun(kind) {
    G.kind = kind === 'timed' ? 'timed' : 'streak';
    G.mode = 'play';
    G.clock = 0;
    G.time = TIMED;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.makes = 0;
    G.swish = 0;
    G.shots = 0;
    G.lock = 0.2;
    G.resetT = 0;
    G.endT = 0;
    G.slow = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.arm = 0;
    G.heat = 0;
    G.lastTick = 99;
    G.overPending = false;
    G.newBest = false;
    G.flight = null;
    G.pulling = false;
    G.angle = -0.98;
    G.power = 0.66;
    G.restAngle = -0.98;
    G.restPower = 0.66;
    G.hoop.bx = HOOP_X;
    G.hoop.by = HOOP_Y;
    resetNet(true);
    particles.length = 0;
    ripples.length = 0;
    pops.length = 0;
    hideOverlay();
    hideToast();
    scoreEl.textContent = '0';
    comboEl.textContent = '×0';
    bestEl.textContent = String(currentBest());
    audio.start();
    toast(G.kind === 'timed' ? '限时 · 六十秒' : '连灌 · 投失即止', G.kind === 'timed' ? '' : 'gold');
    hintEl.textContent = G.kind === 'timed' ? '六十秒内多投 · 空心最贵' : '连续空心 · 断了就结束';
    hintEl.className = 'hint';
    canvas.focus();
  }

  function endRun(why) {
    if (G.mode !== 'play') return;
    G.mode = why === 'time' ? 'win' : 'lose';
    G.flight = null;
    G.pulling = false;
    G.overPending = false;
    considerBest();
    audio.end(why === 'time');
    showOverlay();
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') startRun('streak');
    else startRun(G.kind);
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function showOverlay() {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (G.mode === 'title') {
      ovKicker.textContent = 'DUNK';
      ovTitle.textContent = '灌筐';
      ovLead.innerHTML = '侧视投篮，一记空心最爽。<br />拖拽定角度和力度，松手出球。';
      ovOps.textContent = OPS_TITLE;
      btnStreak.textContent = '连灌';
      btnTimed.textContent = '限时';
      hintEl.textContent = '拖拽瞄准 · 空心入网 · R 重开';
      hintEl.className = 'hint';
    } else if (G.mode === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = G.newBest ? 'RECORD' : 'BUZZER';
      ovTitle.textContent = G.newBest ? '新纪录' : '终场';
      ovLead.textContent = '六十秒 ' + G.score + ' 分 · 命中 ' + G.makes + ' · 空心 ' + G.swish + ' · 最高连 ' + G.maxCombo;
      ovOps.textContent = OPS_PLAY;
      btnStreak.textContent = '连灌';
      btnTimed.textContent = '再投';
      hintEl.textContent = G.newBest ? '新纪录已写入' : '终场 · 可再来';
      hintEl.className = G.newBest ? 'hint hot' : 'hint';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = G.newBest ? 'RECORD' : 'MISS';
      ovTitle.textContent = G.newBest ? '新纪录' : '断了';
      ovLead.textContent = '连灌 ×' + G.maxCombo + ' · 得分 ' + G.score + ' · 空心 ' + G.swish + ' / ' + G.makes;
      ovOps.textContent = OPS_PLAY;
      btnStreak.textContent = '再灌';
      btnTimed.textContent = '限时';
      hintEl.textContent = G.newBest ? '新纪录已写入' : '投失断连 · R 再来';
      hintEl.className = G.newBest ? 'hint hot' : 'hint warn';
    }
    bestEl.textContent = String(currentBest());
  }

  function predict() {
    const dots = [];
    let ghost = null;
    let best = 1e9;
    if (G.flight) return { dots: dots, ghost: ghost };
    const rest = ballRest(true);
    let x = rest.x;
    let y = rest.y;
    const spd = speedOf(G.power);
    let vx = Math.cos(G.angle) * spd;
    let vy = Math.sin(G.angle) * spd;
    const dt = 0.034;
    for (let i = 0; i < 64; i++) {
      vy += GRAV * dt;
      x += vx * dt;
      y += vy * dt;
      const t = G.clock + (i + 1) * dt;
      const hp = hoopAt(t);
      if (i % 2 === 0) dots.push({ x: x, y: y, a: 1 - i / 64 });
      const d = hypot(x - hp.x, y - hp.y);
      if (d < best) {
        best = d;
        ghost = { x: hp.x, y: hp.y, ok: d < INNER - 2, t: t };
      }
      if (y > FLOOR_Y + 12 || x > WORLD_W + 30) break;
    }
    return { dots: dots, ghost: ghost };
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.arm = Math.max(0, G.arm - dt * 2.6);
    G.heat = Math.max(0, G.heat - dt * 0.08);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 8));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 240 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.55;
      r.r += (r.max - r.r) * 6 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t -= dt * 0.9;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.t <= 0) pops.splice(i, 1);
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    syncHoop();
    if (G.kind === 'timed' && G.mode === 'play') {
      G.time -= dt;
      if (G.time < 0) G.time = 0;
      const sec = Math.ceil(G.time);
      if (sec <= 10 && sec !== G.lastTick && G.time > 0) {
        G.lastTick = sec;
        audio.tick();
      }
      if (G.time <= 0) {
        G.overPending = true;
        if (!G.flight) endRun('time');
      }
    }
    if (!G.pulling && !G.flight && G.mode === 'play' && G.lock <= 0) {
      const turn = (keys.l ? -1 : 0) + (keys.r ? 1 : 0);
      const pow = (keys.u ? 1 : 0) + (keys.d ? -1 : 0);
      if (turn) {
        G.angle = clamp(G.angle + turn * 1.15 * dt, ANG_MIN, ANG_MAX);
        G.restAngle = G.angle;
      }
      if (pow) {
        G.power = clamp(G.power + pow * 0.7 * dt, 0.12, 1);
        G.restPower = G.power;
      }
    }
    if (G.flight) updateFlight(dt);
    updateNet(dt);
    if (G.resetT > 0) {
      G.resetT -= dt;
      if (G.resetT <= 0) resetBall();
    }
    if (G.endT > 0) {
      G.endT -= dt;
      if (G.endT <= 0) endRun('miss');
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    G.demoCd -= dt;
    syncHoop();
    if (!G.flight && G.resetT <= 0 && G.demoCd <= 0) {
      G.angle = -1.16;
      G.power = 0.76;
      fire(true);
      G.demoCd = 3.4;
    }
    if (G.flight) updateFlight(dt);
    if (G.resetT > 0) {
      G.resetT -= dt;
      if (G.resetT <= 0) resetBall();
    }
    updateNet(dt);
  }

  function syncHud(force) {
    const timeStr = G.kind === 'timed' && G.mode === 'play' ? G.time.toFixed(1) + 's' : '';
    const key = G.mode + ':' + G.kind + ':' + G.score + ':' + G.combo + ':' + (G.power * 20 | 0) + ':' + timeStr + ':' + (G.flight ? 1 : 0);
    if (!force && key === G.hud) return;
    G.hud = key;
    if (G.mode === 'title') {
      stageLabel.textContent = '灌筐';
      tagLabel.textContent = 'DUNK';
      powerLabel.textContent = '—';
      stageLabel.className = '';
      powerLabel.classList.remove('warn');
    } else {
      if (G.kind === 'timed') {
        stageLabel.textContent = G.time.toFixed(1) + ' 秒';
        stageLabel.className = G.time <= 10 ? 'warn' : (G.time <= 20 ? 'hot' : '');
        tagLabel.textContent = '限时';
      } else {
        stageLabel.textContent = G.combo >= 3 ? '筐在动' : '连灌';
        stageLabel.className = G.combo >= 5 ? 'hot' : '';
        tagLabel.textContent = 'STREAK';
      }
      if (G.flight) powerLabel.textContent = '飞行';
      else powerLabel.textContent = '力 ' + Math.round(G.power * 100);
      powerLabel.classList.toggle('warn', G.kind === 'timed' && G.time <= 10);
    }
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(G.mode === 'title' ? Math.max(G.bestS, G.bestT) : currentBest());
    comboEl.textContent = '×' + G.combo;
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
    ctx.shadowBlur = r * 3.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function colOf(c) {
    if (c === 'm') return '#ff3db8';
    if (c === 'g') return '#ffe36b';
    if (c === 'c') return '#00f0ff';
    if (c === 'w') return '#ffffff';
    return '#ff6a22';
  }

  function drawCourt() {
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    sky.addColorStop(0, '#12081a');
    sky.addColorStop(0.55, '#0a0612');
    sky.addColorStop(1, '#14080c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    const neb = ctx.createRadialGradient(120, 40, 10, 120, 40, 380);
    neb.addColorStop(0, 'rgba(255, 106, 34, 0.16)');
    neb.addColorStop(1, 'rgba(255, 106, 34, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb2 = ctx.createRadialGradient(800, 70, 8, 800, 70, 340);
    neb2.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
    neb2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    if (G.heat > 0.04) {
      ctx.save();
      ctx.globalAlpha = G.heat * 0.18;
      const h = ctx.createRadialGradient(G.hoop.x, G.hoop.y, 10, G.hoop.x, G.hoop.y, 220);
      h.addColorStop(0, '#ffe36b');
      h.addColorStop(1, 'rgba(255,227,107,0)');
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 106, 34, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 40; x < WORLD_W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, FLOOR_Y);
      ctx.stroke();
    }
    ctx.restore();

    const floor = ctx.createLinearGradient(0, FLOOR_Y - 18, 0, WORLD_H);
    floor.addColorStop(0, 'rgba(255, 106, 34, 0.07)');
    floor.addColorStop(0.35, 'rgba(40, 18, 12, 0.92)');
    floor.addColorStop(1, '#0a0408');
    ctx.fillStyle = floor;
    ctx.fillRect(0, FLOOR_Y - 4, WORLD_W, WORLD_H - FLOOR_Y + 4);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 179, 71, 0.55)';
    ctx.shadowColor = '#ff6a22';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, FLOOR_Y);
    ctx.lineTo(WORLD_W - 28, FLOOR_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(70, FLOOR_Y);
    ctx.lineTo(70, 330);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(70, 430, 100, -1.15, 0.2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.22)';
    ctx.beginPath();
    ctx.moveTo(G.hoop.bx - 90, FLOOR_Y);
    ctx.lineTo(G.hoop.bx - 90, 300);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 7; i++) {
      const lx = 80 + i * 120;
      ctx.save();
      ctx.globalAlpha = 0.08;
      const beam = ctx.createLinearGradient(lx, 0, lx, 280);
      beam.addColorStop(0, '#ffe36b');
      beam.addColorStop(1, 'rgba(255,227,107,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(lx - 8, 0);
      ctx.lineTo(lx + 8, 0);
      ctx.lineTo(lx + 70, 300);
      ctx.lineTo(lx - 70, 300);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.t * m.s + m.p));
      glowDot(m.x, (m.y + G.t * 8 * m.s) % WORLD_H, m.r, i % 3 === 0 ? '#ff6a22' : '#00f0ff', a);
    }
  }

  function drawPlayer() {
    const lean = G.pulling ? G.power * 0.28 : (G.arm > 0 ? -G.arm * 0.42 : Math.sin(G.t * 2) * 0.03);
    const hipX = 146;
    const hipY = 458;
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.strokeStyle = '#00f0ff';
    ctx.fillStyle = '#12081a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(-10, 48);
    ctx.lineTo(-6, 8);
    ctx.lineTo(8, 8);
    ctx.lineTo(14, 48);
    ctx.stroke();

    ctx.save();
    ctx.rotate(lean);
    roundRect(-13, -38, 26, 42, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff6a22';
    ctx.shadowColor = '#ff6a22';
    ctx.font = '900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('18', 0, -12);
    ctx.beginPath();
    ctx.arc(2, -50, 11, 0, TAU);
    ctx.fillStyle = '#1a1024';
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const ang = G.angle;
    const rec = G.pulling ? G.power * 10 : 0;
    ctx.save();
    ctx.translate(6, -28);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(28 + rec, 0);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(-8, -22);
    ctx.quadraticCurveTo(-22, -4, -16, 14);
    ctx.stroke();
    ctx.restore();
  }

  function drawHoop(hx, hy, ghost, part) {
    const inner = INNER;
    const a = ghost ? 0.38 : 1;
    const which = part || 'all';
    ctx.save();
    ctx.globalAlpha = a;

    if (which === 'all' || which === 'support') {
      const poleX = hx + inner + 22;
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = ghost ? 4 : 12;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(poleX, FLOOR_Y);
      ctx.lineTo(poleX, hy - 92);
      ctx.stroke();
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(poleX, hy - 8);
      ctx.lineTo(hx + inner + 4, hy);
      ctx.stroke();

      const bx1 = hx + inner + TUBE + 5;
      ctx.fillStyle = 'rgba(12, 22, 40, 0.82)';
      ctx.strokeStyle = '#ffe36b';
      ctx.shadowColor = '#ffe36b';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.6;
      roundRect(bx1, hy - 90, 9, 112, 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bx1 + 2.2, hy - 44, 4.6, 4.6);
    }

    if (which === 'all' || which === 'rim') {
      const hot = !ghost && predHot();
      ctx.strokeStyle = hot ? '#ffe36b' : '#ff6a22';
      ctx.shadowColor = hot ? '#ffe36b' : '#ff6a22';
      ctx.shadowBlur = ghost ? 8 : 18;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(hx, hy, inner + 1, 4.6, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = '#ffe36b';
      ctx.shadowColor = '#ffe36b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(hx, hy, inner + 1, 4.6, 0, 0, TAU);
      ctx.stroke();
      glowDot(hx - inner, hy, 3.4, '#ff6a22', 0.95);
      glowDot(hx + inner, hy, 3.4, '#ff6a22', 0.95);
    }
    ctx.restore();
  }

  function drawNet() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < NET_N; i++) {
      const str = G.net[i];
      ctx.beginPath();
      ctx.moveTo(str[0].x, str[0].y);
      for (let j = 1; j < NET_M; j++) ctx.lineTo(str[j].x, str[j].y);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.72)' : 'rgba(255, 255, 255, 0.45)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.lineWidth = i === 0 || i === NET_N - 1 ? 1.8 : 1.15;
      ctx.stroke();
    }
    for (let j = 1; j < NET_M; j += 2) {
      ctx.beginPath();
      ctx.moveTo(G.net[0][j].x, G.net[0][j].y);
      for (let i = 1; i < NET_N; i++) ctx.lineTo(G.net[i][j].x, G.net[i][j].y);
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBall(x, y, spin, flying) {
    const r = BALL_R;
    const grd = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.2, x, y, r * 1.15);
    grd.addColorStop(0, '#ffc08a');
    grd.addColorStop(0.35, '#ff6a22');
    grd.addColorStop(1, '#9a2208');
    ctx.save();
    ctx.shadowColor = '#ff6a22';
    ctx.shadowBlur = flying ? 16 : 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.strokeStyle = 'rgba(20, 6, 10, 0.78)';
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.92);
    ctx.lineTo(0, r * 0.92);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.92, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.92, r * 0.28, 0.4, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - r * 0.32, y - r * 0.38, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawAim(pred) {
    if (G.flight || G.mode === 'win' || G.mode === 'lose') return;
    if (G.mode === 'title') return;
    const dots = pred.dots;
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      glowDot(d.x, d.y, 1.5 + (i % 3 === 0 ? 1 : 0), i < 4 ? '#ff6a22' : '#00f0ff', 0.14 + d.a * 0.5);
    }
    if (pred.ghost && moveLevel() >= 3) {
      drawHoop(pred.ghost.x, pred.ghost.y, true);
    }
    const rest = ballRest(true);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 106, 34, 0.55)';
    ctx.shadowColor = '#ff6a22';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rest.x, rest.y);
    ctx.lineTo(rest.x + Math.cos(G.angle) * (28 + G.power * 70), rest.y + Math.sin(G.angle) * (28 + G.power * 70));
    ctx.stroke();
    ctx.restore();
  }

  function drawWorld() {
    drawCourt();
    drawPlayer();

    const pred = (G.mode === 'play' || G.mode === 'title') && !G.flight ? predict() : { dots: [], ghost: null };
    G.aimHot = !!(G.mode === 'play' && pred.ghost && pred.ghost.ok);
    if (G.mode === 'play') drawAim(pred);

    drawHoop(G.hoop.x, G.hoop.y, false, 'support');
    drawNet();

    if (G.flight && G.flight.trail) {
      for (let i = 0; i < G.flight.trail.length; i++) {
        const tr = G.flight.trail[i];
        glowDot(tr.x, tr.y, 2.4, '#ff6a22', (i / G.flight.trail.length) * 0.4);
      }
    }

    const hold = G.flight ? G.flight : ballRest();
    const ballX = hold.x;
    const ballY = hold.y;
    const ballSpin = G.flight ? G.flight.spin : G.t * 0.4;
    const through = G.flight && ballY > G.hoop.y - 2 && Math.abs(ballX - G.hoop.x) < INNER + 22;
    if (through) drawBall(ballX, ballY, ballSpin, true);
    drawHoop(G.hoop.x, G.hoop.y, false, 'rim');
    if (!through) drawBall(ballX, ballY, ballSpin, !!G.flight);

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.t) * 0.7;
      ctx.strokeStyle = colOf(r.col);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      glowDot(p.x, p.y, p.r * (p.life / p.max), colOf(p.col), Math.max(0, p.life / p.max));
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 18px "Segoe UI", "PingFang SC", sans-serif';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      ctx.globalAlpha = Math.max(0, p.t);
      ctx.fillStyle = p.col;
      ctx.shadowColor = p.col;
      ctx.shadowBlur = 12;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = G.shake && !REDUCE ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake && !REDUCE ? rand(-G.shake, G.shake) : 0;
    const punch = G.punch;

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

  let last = 0;
  let acc = 0;
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
        const scale = G.slow > 0 && !REDUCE ? 0.2 : 1;
        if (G.slow > 0) G.slow = Math.max(0, G.slow - dt);
        acc += dt * scale;
        if (acc > 0.12) acc = 0.12;
        while (acc >= STEP) {
          if (G.mode === 'title') updateTitle(STEP);
          else if (G.mode === 'play') updatePlay(STEP);
          else {
            G.clock += STEP;
            syncHoop();
            updateNet(STEP);
            if (G.flight) updateFlight(STEP);
          }
          acc -= STEP;
        }
      }
      updateFx(dt);
      audio.tickTaut(G.pulling && !G.flight && G.mode === 'play', G.power);
      syncHud(false);
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
    if (e.code === 'Escape' && G.pulling) {
      G.pulling = false;
      pointer.down = false;
      canvas.classList.remove('drawing');
      G.angle = G.restAngle;
      G.power = G.restPower;
      return;
    }
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
      if (e.code === 'Digit2' || e.code === 'Numpad2') {
        e.preventDefault();
        audio.ensure();
        startRun('timed');
        return;
      }
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        e.preventDefault();
        audio.ensure();
        startRun('streak');
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        audio.ensure();
        startRun(G.mode === 'win' ? 'timed' : 'streak');
        return;
      }
      return;
    }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = true;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = true;
    if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
      e.preventDefault();
      if (canShoot() && !G.pulling) fire(false);
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = false;
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (G.mode !== 'play') return;
    e.preventDefault();
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    beginPull(w.x, w.y);
  }, { passive: false });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (!pointer.down || e.pointerId !== pointer.id) return;
    movePull(w.x, w.y);
  }, { passive: false });

  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    pointer.down = false;
    pointer.id = null;
    endPull();
  });

  canvas.addEventListener('pointercancel', function () {
    pointer.down = false;
    pointer.id = null;
    G.pulling = false;
    canvas.classList.remove('drawing');
    G.angle = G.restAngle;
    G.power = G.restPower;
  });

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  btnStreak.addEventListener('click', function () {
    audio.ensure();
    startRun('streak');
  });
  btnTimed.addEventListener('click', function () {
    audio.ensure();
    startRun('timed');
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
  initNet();
  resize();
  showOverlay();
  syncHud(true);
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
