'use strict';

(function () {
  const GOAL = 6;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-one-slice-mute';

  const ROUNDS = [
    { name: '对半', sub: 'HALF', fruit: '光柚', target: 0.5, tol: 0.08, time: 10, kind: 'round', hint: true },
    { name: '四六', sub: '40/60', fruit: '夜梨', target: 0.4, tol: 0.068, time: 9, kind: 'oval', hint: true },
    { name: '三分', sub: '1/3', fruit: '霓葫', target: 1 / 3, tol: 0.06, time: 8.5, kind: 'pear', hint: false },
    { name: '三七', sub: '30/70', fruit: '瓣芒', target: 0.3, tol: 0.052, time: 8, kind: 'lobe', hint: false },
    { name: '黄金', sub: 'PHI', fruit: '金棱', target: 0.382, tol: 0.046, time: 7.4, kind: 'diamond', hint: false },
    { name: '二八', sub: '20/80', fruit: '月腰', target: 0.2, tol: 0.04, time: 7, kind: 'kidney', hint: false }
  ];

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hud = document.getElementById('hud');
  const hintEl = document.getElementById('hint');
  const roundEl = document.getElementById('round');
  const markEl = document.getElementById('mark');
  const timeEl = document.getElementById('time');
  const timeRead = timeEl.parentElement;
  const markRead = markEl.parentElement;
  const bladesEl = document.getElementById('blades');
  const panel = document.getElementById('panel');
  const card = document.getElementById('card');
  const kickerEl = document.getElementById('panel-kicker');
  const titleEl = document.getElementById('panel-title');
  const leadEl = document.getElementById('panel-lead');
  const metaEl = document.getElementById('panel-meta');
  const footEl = document.getElementById('panel-foot');
  const btnMain = document.getElementById('btn-main');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnCut = document.getElementById('btn-cut');

  let W = 1;
  let H = 1;
  let dpr = 1;
  const layout = {
    cx: 0,
    cy: 0,
    boardW: 420,
    boardH: 260,
    fruitR: 110,
    railY: 0
  };

  const stars = [];
  const motes = [];
  const particles = [];
  const pops = [];
  const sparks = [];
  const juice = [];
  const grain = [];

  const keys = { l: false, r: false };
  const ptr = { id: null, x: 0, y: 0, sx: 0, sy: 0, down: false, drag: false };

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
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
      btnMute.textContent = m ? '静音' : '声开';
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) {}
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      src.buffer = buf;
      f.type = 'highpass';
      f.frequency.value = 1400;
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    pulse: function (kind) {
      this.ensure();
      if (kind === 'slice') {
        this.noise(0.09, 0.1);
        this.beep(1600, 0.08, 'square', 0.05, 420);
        this.beep(220, 0.16, 'sawtooth', 0.04, 80);
      } else if (kind === 'hit') {
        this.beep(523, 0.12, 'sine', 0.08, 784);
        this.beep(659, 0.2, 'triangle', 0.06, 1046);
      } else if (kind === 'perfect') {
        this.beep(659, 0.1, 'sine', 0.08, 988);
        this.beep(784, 0.16, 'triangle', 0.07, 1174);
        this.beep(1046, 0.28, 'sine', 0.05, 1568);
      } else if (kind === 'miss') {
        this.beep(196, 0.42, 'sawtooth', 0.08, 70);
        this.beep(110, 0.55, 'square', 0.04, 48);
      } else if (kind === 'empty') {
        this.beep(240, 0.12, 'square', 0.04, 90);
      } else if (kind === 'win') {
        this.beep(523, 0.14, 'sine', 0.09, 659);
        this.beep(659, 0.2, 'triangle', 0.07, 784);
        this.beep(784, 0.36, 'sine', 0.06, 1046);
      } else if (kind === 'lose') {
        this.beep(174, 0.55, 'sawtooth', 0.09, 55);
        this.beep(82, 0.8, 'sine', 0.05, 40);
      } else if (kind === 'start') {
        this.beep(392, 0.12, 'sine', 0.07, 523);
        this.beep(523, 0.18, 'triangle', 0.05, 784);
      } else if (kind === 'warn') {
        this.beep(880, 0.06, 'square', 0.03, 440);
      } else if (kind === 'tick') {
        this.beep(720, 0.04, 'sine', 0.025);
      } else if (kind === 'land') {
        this.beep(180, 0.08, 'sine', 0.04, 90);
      }
    },
    tickDrone: function (aiming, remain) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 52;
        g.gain.value = 0.016;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const f = aiming && remain < 3 ? 46 : 54;
      this.drone.frequency.setTargetAtTime(f, t, 0.12);
      this.droneGain.gain.setTargetAtTime(aiming ? (remain < 3 ? 0.04 : 0.016) : 0.008, t, 0.12);
    },
    stopDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
  };

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    round: 0,
    lives: LIVES,
    hits: 0,
    perfects: 0,
    combo: 0,
    bestCombo: 0,
    phase: 'aim',
    phaseT: 0,
    remain: 10,
    bladeX: 0,
    bladeV: 0,
    bladeDrop: 0,
    splitDone: false,
    lock: 0,
    shake: 0,
    flash: 0,
    flashC: 'cyan',
    paused: false,
    result: '',
    why: '',
    lastSmall: 0,
    lastErr: 0,
    cutOk: false,
    ghostX: 0,
    ghostA: 0,
    hintLock: 0,
    lastHint: '',
    warned: false,
    fruit: null,
    left: null,
    right: null,
    seeds: [],
    demo: null
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function buzz(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  function shoelace(pts) {
    let a = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a) * 0.5;
  }

  function centroid(pts) {
    let cx = 0;
    let cy = 0;
    let a = 0;
    const n = pts.length;
    if (n < 1) return { x: 0, y: 0 };
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      const c = p.x * q.y - q.x * p.y;
      a += c;
      cx += (p.x + q.x) * c;
      cy += (p.y + q.y) * c;
    }
    a *= 0.5;
    if (Math.abs(a) < 1e-8) {
      let sx = 0;
      let sy = 0;
      for (let i = 0; i < n; i++) {
        sx += pts[i].x;
        sy += pts[i].y;
      }
      return { x: sx / n, y: sy / n };
    }
    return { x: cx / (6 * a), y: cy / (6 * a) };
  }

  function bounds(pts) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.x < x0) x0 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.x > x1) x1 = p.x;
      if (p.y > y1) y1 = p.y;
    }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  function clipHalf(pts, keepLeft, x) {
    const out = [];
    const n = pts.length;
    if (n < 3) return out;
    const eps = 0.04;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const ain = keepLeft ? a.x <= x + eps : a.x >= x - eps;
      const bin = keepLeft ? b.x <= x + eps : b.x >= x - eps;
      if (ain) out.push({ x: a.x, y: a.y });
      if (ain !== bin) {
        const dx = b.x - a.x;
        const t = Math.abs(dx) < 1e-9 ? 0 : clamp((x - a.x) / dx, 0, 1);
        out.push({ x: x, y: a.y + t * (b.y - a.y) });
      }
    }
    return out;
  }

  function leftFrac(pts, x) {
    const L = clipHalf(pts, true, x);
    const R = clipHalf(pts, false, x);
    const al = L.length >= 3 ? shoelace(L) : 0;
    const ar = R.length >= 3 ? shoelace(R) : 0;
    const tot = al + ar;
    if (tot < 1e-6) return 0;
    return al / tot;
  }

  function findCutX(pts, target) {
    const b = bounds(pts);
    let lo = b.x0;
    let hi = b.x1;
    for (let i = 0; i < 28; i++) {
      const m = (lo + hi) * 0.5;
      if (leftFrac(pts, m) < target) lo = m;
      else hi = m;
    }
    return (lo + hi) * 0.5;
  }

  function makeLocal(kind, rot) {
    const n = 28;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      let rx = 1;
      let ry = 1;
      let ox = 0;
      let oy = 0;
      if (kind === 'round') {
        rx = 0.98 + 0.04 * Math.cos(2 * t);
        ry = 0.94 + 0.03 * Math.sin(2 * t);
      } else if (kind === 'oval') {
        rx = 1.22;
        ry = 0.78;
      } else if (kind === 'pear') {
        const k = 0.78 + 0.34 * Math.sin(t);
        rx = k * 0.92;
        ry = k * 1.05;
        oy = 0.08;
      } else if (kind === 'lobe') {
        rx = 0.86 + 0.42 * Math.cos(t);
        ry = 0.9 + 0.1 * Math.sin(2 * t);
        ox = 0.12;
      } else if (kind === 'diamond') {
        const u = Math.abs(Math.cos(t));
        const v = Math.abs(Math.sin(t));
        const s = 0.14 + 0.72 * Math.max(u, v) + 0.18 * (u + v);
        rx = 1.05 / s;
        ry = 1.12 / s;
      } else if (kind === 'kidney') {
        rx = 1.05 + 0.38 * Math.cos(t) - 0.08 * Math.cos(2 * t);
        ry = 0.82 + 0.12 * Math.sin(t);
        ox = 0.1;
      }
      const x = Math.cos(t) * rx + ox;
      const y = Math.sin(t) * ry + oy;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      pts.push({ x: x * c - y * s, y: x * s + y * c });
    }
    let mx = 0;
    let my = 0;
    for (let i = 0; i < pts.length; i++) {
      mx += pts[i].x;
      my += pts[i].y;
    }
    mx /= pts.length;
    my /= pts.length;
    for (let i = 0; i < pts.length; i++) {
      pts[i].x -= mx;
      pts[i].y -= my;
    }
    let m = 0;
    for (let i = 0; i < pts.length; i++) {
      m = Math.max(m, Math.hypot(pts[i].x, pts[i].y));
    }
    if (m > 0) {
      for (let i = 0; i < pts.length; i++) {
        pts[i].x /= m;
        pts[i].y /= m;
      }
    }
    return pts;
  }

  function worldPts(fruit) {
    const out = [];
    const s = fruit.s;
    for (let i = 0; i < fruit.local.length; i++) {
      const p = fruit.local[i];
      out.push({ x: fruit.x + p.x * s, y: fruit.y + p.y * s });
    }
    return out;
  }

  function pointIn(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x;
      const yi = pts[i].y;
      const xj = pts[j].x;
      const yj = pts[j].y;
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  function fruitTint(kind) {
    if (kind === 'oval') return { a: '#5cffef', b: '#ff4ec8', rim: '#7af6ff' };
    if (kind === 'pear') return { a: '#ffe36b', b: '#ff3db8', rim: '#ffe36b' };
    if (kind === 'lobe') return { a: '#00f0ff', b: '#ff7ad9', rim: '#00f0ff' };
    if (kind === 'diamond') return { a: '#ffe36b', b: '#00f0ff', rim: '#fff3a8' };
    if (kind === 'kidney') return { a: '#ff3db8', b: '#7a5cff', rim: '#ff8ad4' };
    return { a: '#ff3db8', b: '#00f0ff', rim: '#ff9de0' };
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 110) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col,
        g: spec.g || 0
      });
    }
  }

  function popup(x, y, text, col) {
    pops.push({ x: x, y: y, text: text, col: col, life: 0.9, max: 0.9 });
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.45 + 0.06,
        p: Math.random() * TAU
      });
    }
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 18; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        s: 0.35 + Math.random() * 0.8,
        p: Math.random() * TAU,
        col: i % 2 ? 'cyan' : 'pink'
      });
    }
  }

  function makeGrain() {
    grain.length = 0;
    for (let i = 0; i < 28; i++) {
      grain.push({
        u: Math.random(),
        v: Math.random(),
        w: 0.08 + Math.random() * 0.5,
        a: 0.04 + Math.random() * 0.07
      });
    }
  }

  function spawnSeeds(local) {
    const seeds = [];
    const com = centroid(local);
    for (let k = 0; k < 14; k++) {
      for (let tries = 0; tries < 18; tries++) {
        const ang = Math.random() * TAU;
        const rad = Math.random() * 0.55;
        const x = com.x * 0.55 + Math.cos(ang) * rad;
        const y = com.y * 0.55 + Math.sin(ang) * rad;
        if (pointIn(local, x, y)) {
          seeds.push({ x: x, y: y, r: 0.028 + Math.random() * 0.03 });
          break;
        }
      }
    }
    return seeds;
  }

  function currentRound() {
    return ROUNDS[clamp(G.round, 0, ROUNDS.length - 1)];
  }

  function spawnFruit(kind, asDemo) {
    const rot = asDemo ? 0.35 : rand(-0.7, 0.7) + (kind === 'pear' ? 0.4 : 0);
    const local = makeLocal(kind, rot);
    const fruit = {
      local: local,
      kind: kind,
      tint: fruitTint(kind),
      x: layout.cx,
      y: layout.cy + 8,
      s: layout.fruitR,
      drop: asDemo ? 0 : 1,
      squash: 1
    };
    if (asDemo) {
      G.demo = fruit;
      return fruit;
    }
    G.fruit = fruit;
    G.seeds = spawnSeeds(local);
    G.left = null;
    G.right = null;
    const wpts = worldPts(fruit);
    const b = bounds(wpts);
    G.bladeX = (b.x0 + b.x1) * 0.5;
    G.bladeV = 0;
    const spec = currentRound();
    G.ghostX = findCutX(wpts, spec.target);
    G.ghostA = spec.hint ? 1 : 0;
    G.cutOk = false;
    G.why = '';
    return fruit;
  }

  function bladeRange() {
    if (!G.fruit) return { x0: layout.cx - 80, x1: layout.cx + 80 };
    const b = bounds(worldPts(G.fruit));
    const pad = Math.max(10, G.fruit.s * 0.08);
    return { x0: b.x0 + pad, x1: b.x1 - pad };
  }

  function setLivesPips() {
    const nodes = bladesEl.querySelectorAll('i');
    for (let i = 0; i < nodes.length; i++) {
      if (i < G.lives) nodes[i].classList.remove('off');
      else nodes[i].classList.add('off');
    }
  }

  function setHint(text, cls) {
    if (G.hintLock > 0 && G.lastHint === text) return;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
    G.lastHint = text;
  }

  function refreshHud() {
    const spec = currentRound();
    roundEl.textContent = G.hits + '/' + GOAL;
    markEl.textContent = spec.name;
    timeEl.textContent = G.phase === 'aim' ? G.remain.toFixed(1) : '—';
    timeRead.classList.toggle('danger', G.phase === 'aim' && G.remain < 3);
    timeRead.classList.toggle('warn', G.phase === 'aim' && G.remain < 5 && G.remain >= 3);
    markRead.classList.remove('danger');
    setLivesPips();
  }

  function showPanel(kind) {
    panel.classList.remove('hidden');
    hud.classList.add('hidden');
    btnCut.classList.add('hidden');
    card.classList.remove('win', 'lose');
    if (kind === 'title') {
      kickerEl.textContent = 'SLICE';
      titleEl.textContent = '一刀';
      leadEl.innerHTML = '一刀切开指定比例。<br />只能下一刀，不能多割。';
      metaEl.textContent = '小块要对上成数。切偏、空刀、迟了都会折刃。六刀皆准则胜。';
      footEl.textContent = '← → 移刃 · 空格落刀 · 拖移 / 点按 · M 静音';
      btnMain.textContent = '开刃';
    } else if (kind === 'win') {
      card.classList.add('win');
      kickerEl.textContent = 'CLEARED';
      titleEl.textContent = '六刀皆准';
      leadEl.innerHTML = '砧板还热。' + G.perfects + ' 刀绝准。';
      metaEl.textContent = '连刀最高 ' + G.bestCombo + '。光还停在切口上。';
      footEl.textContent = '空格 / 点按再来 · M 静音';
      btnMain.textContent = '再切一局';
    } else {
      card.classList.add('lose');
      kickerEl.textContent = 'BROKEN';
      titleEl.textContent = G.why === '迟了' ? '迟了' : G.why === '空刀' ? '空刀' : '这一刀偏了';
      const pct = (G.lastSmall * 100).toFixed(0);
      const want = (currentRound().target * 100).toFixed(0);
      leadEl.innerHTML = G.why === '迟了'
        ? '刃停在半空，果已过时。'
        : G.why === '空刀'
          ? '刀锋贴边，几乎没切开。'
          : '目标小块 ' + want + '%，这一刀 ' + pct + '%。';
      metaEl.textContent = '成 ' + G.hits + '/' + GOAL + ' · 绝准 ' + G.perfects + '。折刃三次即负。';
      footEl.textContent = '空格 / 点按再来 · M 静音';
      btnMain.textContent = '再来一刀';
    }
  }

  function hidePanel() {
    panel.classList.add('hidden');
    hud.classList.remove('hidden');
    btnCut.classList.remove('hidden');
  }

  function startRun() {
    audio.ensure();
    audio.pulse('start');
    G.mode = 'play';
    G.round = 0;
    G.lives = LIVES;
    G.hits = 0;
    G.perfects = 0;
    G.combo = 0;
    G.bestCombo = 0;
    G.lock = 0.12;
    G.result = '';
    G.why = '';
    G.clock = 0;
    hidePanel();
    beginRound();
    refreshHud();
  }

  function beginRound() {
    const spec = currentRound();
    spawnFruit(spec.kind, false);
    G.phase = 'enter';
    G.phaseT = 0;
    G.remain = spec.time;
    G.splitDone = false;
    G.bladeDrop = 0;
    G.warned = false;
    G.cutOk = false;
    G.why = '';
    G.left = null;
    G.right = null;
    juice.length = 0;
    sparks.length = 0;
    setHint('青块 ' + Math.round(spec.target * 100) + '% · ' + spec.fruit, '');
    refreshHud();
  }

  function endRun(win) {
    G.mode = win ? 'win' : 'lose';
    G.result = win ? 'win' : 'lose';
    G.phase = 'done';
    audio.stopDrone();
    audio.pulse(win ? 'win' : 'lose');
    if (win) buzz(40);
    else buzz([40, 60, 80]);
    showPanel(win ? 'win' : 'lose');
  }

  function makePiece(pts, dir) {
    const c = centroid(pts);
    return {
      pts: pts,
      cx: c.x,
      cy: c.y,
      ox: 0,
      oy: 0,
      rot: 0,
      vx: dir * rand(46, 78),
      vy: rand(-28, -8),
      vr: dir * rand(0.35, 0.9)
    };
  }

  function doSplit() {
    if (G.splitDone || !G.fruit) return;
    G.splitDone = true;
    const wpts = worldPts(G.fruit);
    const L = clipHalf(wpts, true, G.bladeX);
    const R = clipHalf(wpts, false, G.bladeX);
    const al = L.length >= 3 ? shoelace(L) : 0;
    const ar = R.length >= 3 ? shoelace(R) : 0;
    const tot = al + ar;
    const spec = currentRound();

    if (tot < 1e-4 || Math.min(al, ar) / tot < 0.012) {
      G.why = '空刀';
      G.cutOk = false;
      G.lastSmall = 0;
      G.lastErr = 1;
      G.phase = 'judge';
      G.phaseT = 0;
      audio.pulse('empty');
      popup(layout.cx, layout.cy - 20, '空刀', '#ff3db8');
      setHint('空刀 · 刃要穿过果腹', 'warn');
      G.flash = 0.5;
      G.flashC = 'pink';
      G.shake = 0.7;
      return;
    }

    G.left = makePiece(L, -1);
    G.right = makePiece(R, 1);
    const small = Math.min(al, ar) / tot;
    const err = Math.abs(small - spec.target);
    G.lastSmall = small;
    G.lastErr = err;

    const b = bounds(wpts);
    const midY = (b.y0 + b.y1) * 0.5;
    for (let i = 0; i < 22; i++) {
      juice.push({
        x: G.bladeX + rand(-4, 4),
        y: mix(b.y0, b.y1, Math.random()),
        vx: rand(-70, 70),
        vy: rand(-90, 20),
        life: rand(0.35, 0.7),
        max: 0.7,
        r: rand(1.6, 3.4),
        col: Math.random() < 0.5 ? '#ff3db8' : '#00f0ff'
      });
    }
    emit(18, {
      x: G.bladeX,
      y: midY,
      j: 16,
      vx0: -90,
      vx1: 90,
      vy0: -140,
      vy1: -20,
      life: 0.45,
      r0: 1.2,
      r1: 3.2,
      col: '#ffe36b',
      g: 80
    });

    const perfect = err <= 0.012;
    const ok = err <= spec.tol;
    G.phase = 'judge';
    G.phaseT = 0;
    G.flash = 0.45;
    G.shake = ok ? 0.55 : 0.9;

    if (ok) {
      G.cutOk = true;
      G.why = perfect ? '绝准' : '准';
      G.hits += 1;
      G.combo += 1;
      if (G.combo > G.bestCombo) G.bestCombo = G.combo;
      if (perfect) {
        G.perfects += 1;
        G.flashC = 'gold';
        audio.pulse('perfect');
        popup(layout.cx, b.y0 - 18, '绝准', '#ffe36b');
        setHint('绝准 · ' + (small * 100).toFixed(1) + '%', 'gold');
        buzz(18);
      } else {
        G.flashC = 'cyan';
        audio.pulse('hit');
        popup(layout.cx, b.y0 - 18, '准', '#00f0ff');
        setHint('准 · 小块 ' + (small * 100).toFixed(1) + '%  目标 ' + Math.round(spec.target * 100) + '%', 'ok');
        buzz(12);
      }
    } else {
      G.cutOk = false;
      G.combo = 0;
      G.flashC = 'pink';
      audio.pulse('miss');
      popup(layout.cx, b.y0 - 18, '偏了', '#ff3db8');
      setHint('偏 ' + (err * 100).toFixed(1) + ' 点 · 小块 ' + (small * 100).toFixed(1) + '%', 'warn');
      G.why = '偏了';
      buzz([18, 30, 18]);
    }
    refreshHud();
  }

  function resolveJudge() {
    const ok = G.cutOk;
    if (ok) {
      if (G.hits >= GOAL) {
        endRun(true);
        return;
      }
      G.round += 1;
      beginRound();
      return;
    }
    G.lives -= 1;
    setLivesPips();
    if (G.lives <= 0) {
      endRun(false);
      return;
    }
    beginRound();
  }

  function sliceNow() {
    if (G.mode !== 'play' || G.lock > 0) return;
    if (G.phase === 'judge' || G.phase === 'slash') {
      popup(layout.cx, layout.cy - layout.fruitR - 12, '多割！', '#ff3db8');
      audio.pulse('empty');
      setHint('不能多割 · 一果只下一刀', 'warn');
      return;
    }
    if (G.phase !== 'aim') return;
    audio.pulse('slice');
    G.phase = 'slash';
    G.phaseT = 0;
    G.bladeDrop = 0;
    G.lock = 0.2;
    G.shake = 0.35;
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'play' && !G.paused) G.clock += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.hintLock > 0) G.hintLock -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.4);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);

    if (G.mode === 'title') {
      if (!G.demo) spawnFruit('round', true);
      if (G.demo) {
        G.demo.x = layout.cx;
        G.demo.y = layout.cy + 10;
        G.demo.s = layout.fruitR;
      }
      G.bladeX = layout.cx + Math.sin(G.t * 0.7) * layout.fruitR * 0.42;
      G.bladeDrop = 0;
    }

    if (G.mode === 'play' && !G.paused) {
      if (G.fruit) {
        G.fruit.x = layout.cx;
        G.fruit.s = layout.fruitR;
        if (G.phase === 'enter') {
          G.phaseT += dt;
          const u = clamp(G.phaseT / 0.48, 0, 1);
          const e = easeOut(u);
          G.fruit.drop = 1 - e;
          G.fruit.squash = u < 0.78 ? mix(1.12, 0.9, u / 0.78) : mix(0.9, 1, (u - 0.78) / 0.22);
          G.fruit.y = layout.cy + 8 - (1 - e) * 90;
          if (u >= 1) {
            G.phase = 'aim';
            G.phaseT = 0;
            G.fruit.drop = 0;
            G.fruit.squash = 1;
            G.fruit.y = layout.cy + 8;
            audio.pulse('land');
            const spec = currentRound();
            setHint('青块对准 ' + Math.round(spec.target * 100) + '% · 一刀切下', '');
          }
        } else {
          G.fruit.y = layout.cy + 8;
          G.fruit.squash = 1;
        }
      }

      if (G.phase === 'aim') {
        const rng = bladeRange();
        if (keys.l) G.bladeV -= 980 * dt;
        if (keys.r) G.bladeV += 980 * dt;
        G.bladeV *= Math.pow(0.018, dt);
        if (!keys.l && !keys.r && !ptr.down) G.bladeV *= Math.pow(0.002, dt);
        G.bladeX += G.bladeV * dt;
        if (ptr.down && ptr.drag) {
          G.bladeX = mix(G.bladeX, ptr.x, 1 - Math.pow(0.0008, dt));
        }
        if (G.bladeX < rng.x0) {
          G.bladeX = rng.x0;
          G.bladeV *= -0.2;
        }
        if (G.bladeX > rng.x1) {
          G.bladeX = rng.x1;
          G.bladeV *= -0.2;
        }
        G.remain -= dt;
        if (G.ghostA > 0) G.ghostA = Math.max(0, G.ghostA - dt * 0.42);
        if (G.remain < 3 && !G.warned) {
          G.warned = true;
          audio.pulse('warn');
          setHint('时限将尽', 'warn');
        }
        if (G.remain <= 0) {
          G.remain = 0;
          G.why = '迟了';
          G.cutOk = false;
          G.lastSmall = 0;
          G.lastErr = 1;
          G.phase = 'judge';
          G.phaseT = 0;
          audio.pulse('miss');
          popup(layout.cx, layout.cy - 24, '迟了', '#ff3db8');
          setHint('迟了 · 这一刀没落下', 'warn');
          G.flash = 0.5;
          G.flashC = 'pink';
        }
        if ((G.remain * 10 | 0) !== ((G.remain + dt) * 10 | 0)) refreshHud();
      }

      if (G.phase === 'slash') {
        G.phaseT += dt;
        G.bladeDrop = easeOut(clamp(G.phaseT / 0.16, 0, 1));
        if (G.phaseT >= 0.12 && !G.splitDone) doSplit();
        if (G.phaseT > 0.2 && G.phase !== 'judge') {
          G.phase = 'judge';
          G.phaseT = 0;
        }
      }

      if (G.phase === 'judge') {
        G.phaseT += dt;
        G.bladeDrop = mix(G.bladeDrop, 0.15, 1 - Math.pow(0.04, dt));
        const pieceDt = dt;
        function stepPiece(p) {
          if (!p) return;
          p.vy += 220 * pieceDt;
          p.ox += p.vx * pieceDt;
          p.oy += p.vy * pieceDt;
          p.rot += p.vr * pieceDt;
          p.vx *= Math.pow(0.28, pieceDt);
        }
        stepPiece(G.left);
        stepPiece(G.right);
        if (G.phaseT >= 1.28) resolveJudge();
      }

      audio.tickDrone(G.phase === 'aim', G.remain);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = juice.length - 1; i >= 0; i--) {
      const p = juice[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      if (p.life <= 0) juice.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].life -= dt;
      if (pops[i].life <= 0) pops.splice(i, 1);
    }
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

  function pathPoly(pts, ox, oy, rot, cx, cy) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      let x = pts[i].x - cx;
      let y = pts[i].y - cy;
      if (rot) {
        const c = Math.cos(rot);
        const s = Math.sin(rot);
        const nx = x * c - y * s;
        const ny = x * s + y * c;
        x = nx;
        y = ny;
      }
      x += cx + ox;
      y += cy + oy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawFruitBody(pts, tint, seeds, fruit, alpha, ox, oy, rot, cx, cy) {
    ctx.save();
    ctx.globalAlpha = alpha;
    pathPoly(pts, ox, oy, rot, cx, cy);
    const g = ctx.createLinearGradient(cx - fruit.s, cy - fruit.s, cx + fruit.s, cy + fruit.s);
    g.addColorStop(0, tint.a);
    g.addColorStop(0.55, tint.m || '#3a1648');
    g.addColorStop(1, tint.b);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowColor = tint.rim;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = tint.rim;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.clip();
    const hi = ctx.createRadialGradient(cx - fruit.s * 0.28, cy - fruit.s * 0.34, 4, cx, cy, fruit.s);
    hi.addColorStop(0, 'rgba(255,255,255,0.22)');
    hi.addColorStop(0.35, 'rgba(255,255,255,0.04)');
    hi.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hi;
    ctx.fillRect(cx - fruit.s * 1.2, cy - fruit.s * 1.2, fruit.s * 2.4, fruit.s * 2.4);

    ctx.fillStyle = 'rgba(5,3,12,0.45)';
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      let x = fruit.x + s.x * fruit.s - cx;
      let y = fruit.y + s.y * fruit.s - cy;
      if (rot) {
        const c = Math.cos(rot);
        const sn = Math.sin(rot);
        const nx = x * c - y * sn;
        const ny = x * sn + y * c;
        x = nx;
        y = ny;
      }
      ctx.beginPath();
      ctx.ellipse(cx + ox + x, cy + oy + y, s.r * fruit.s, s.r * fruit.s * 0.7, 0.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawBlade(x, drop) {
    const top = layout.railY;
    const tip = layout.cy + layout.fruitR * 0.92 + drop * 36;
    const y0 = top - 8;
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 6);

    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,0.18)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, tip);
    ctx.stroke();

    const lg = ctx.createLinearGradient(x, y0, x, tip);
    lg.addColorStop(0, '#ffe36b');
    lg.addColorStop(0.18, '#00f0ff');
    lg.addColorStop(1, '#ff3db8');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12 * pulse;
    ctx.beginPath();
    ctx.moveTo(x, y0 + 18);
    ctx.lineTo(x, tip);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(x - 7, tip - 2);
    ctx.lineTo(x, tip + 14);
    ctx.lineTo(x + 7, tip - 2);
    ctx.closePath();
    ctx.fillStyle = '#f6f3ff';
    ctx.fill();

    roundRect(x - 16, y0 - 6, 32, 22, 6);
    ctx.fillStyle = '#1b1428';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,227,107,0.7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(x - 10, y0 + 4, 20, 5);

    ctx.restore();
  }

  function drawTargetBadge(spec) {
    const w = Math.min(280, layout.boardW * 0.7);
    const x = layout.cx - w / 2;
    const y = layout.railY - 58;
    roundRect(x, y, w, 36, 12);
    ctx.fillStyle = 'rgba(8,5,18,0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const inner = w - 88;
    const bx = x + 14;
    const by = y + 12;
    const small = spec.target;
    roundRect(bx, by, inner * small, 12, 4);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    roundRect(bx + inner * small + 3, by, inner * (1 - small) - 3, 12, 4);
    ctx.fillStyle = '#ff3db8';
    ctx.fill();
    ctx.font = '700 9px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#05030c';
    if (inner * small > 22) ctx.fillText('小', bx + 4, by + 10);

    ctx.fillStyle = '#f6f3ff';
    ctx.font = '700 13px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(spec.name, x + w - 12, y + 23);
  }

  function drawBoard() {
    const bw = layout.boardW;
    const bh = layout.boardH;
    const x = layout.cx - bw / 2;
    const y = layout.cy - bh / 2 + 18;

    ctx.save();
    ctx.shadowColor = 'rgba(255,61,184,0.18)';
    ctx.shadowBlur = 28;
    roundRect(x, y, bw, bh, 28);
    ctx.fillStyle = '#120a1c';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,61,184,0.28)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    roundRect(x + 10, y + 10, bw - 20, bh - 20, 22);
    ctx.fillStyle = '#0b0714';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    roundRect(x + 10, y + 10, bw - 20, bh - 20, 22);
    ctx.clip();
    for (let i = 0; i < grain.length; i++) {
      const g = grain[i];
      ctx.strokeStyle = 'rgba(255,255,255,' + g.a + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gx = x + 18 + g.u * (bw - 36);
      const gy = y + 24 + g.v * (bh - 48);
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + g.w * bw, gy + 2);
      ctx.stroke();
    }
    ctx.restore();

    const ticks = 4;
    const x0 = layout.cx - layout.fruitR;
    const x1 = layout.cx + layout.fruitR;
    const ty = layout.cy + layout.fruitR * 0.95;
    ctx.strokeStyle = 'rgba(154,160,200,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, ty);
    ctx.lineTo(x1, ty);
    ctx.stroke();
    ctx.fillStyle = 'rgba(154,160,200,0.7)';
    ctx.font = '10px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    const labels = ['0', '¼', '½', '¾', '1'];
    for (let i = 0; i <= ticks; i++) {
      const u = i / ticks;
      const tx = mix(x0, x1, u);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty + (i % 2 === 0 ? 8 : 5));
      ctx.stroke();
      ctx.fillText(labels[i], tx, ty + 20);
    }

    ctx.strokeStyle = 'rgba(0,240,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(layout.cx - bw * 0.36, layout.railY);
    ctx.lineTo(layout.cx + bw * 0.36, layout.railY);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W * 0.2, H * -0.05, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    bg.addColorStop(0, 'rgba(255,61,184,0.14)');
    bg.addColorStop(0.45, 'rgba(5,3,12,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const bg2 = ctx.createRadialGradient(W * 0.92, H * 0.08, 10, W * 0.8, H * 0.2, W * 0.55);
    bg2.addColorStop(0, 'rgba(0,240,255,0.1)');
    bg2.addColorStop(1, 'rgba(5,3,12,0)');
    ctx.fillStyle = bg2;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.65 + 0.35 * Math.sin(G.t * 1.4 + s.p));
      ctx.fillStyle = 'rgba(246,243,255,' + a + ')';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = (m.x + Math.sin(G.t * 0.12 * m.s + m.p) * 0.04) * W;
      const my = ((m.y + G.t * 0.015 * m.s) % 1) * H;
      ctx.fillStyle = m.col === 'cyan' ? 'rgba(0,240,255,0.16)' : 'rgba(255,61,184,0.14)';
      ctx.beginPath();
      ctx.arc(mx, my, 1.6 * m.s, 0, TAU);
      ctx.fill();
    }

    const sx = G.shake ? rand(-5, 5) * G.shake : 0;
    const sy = G.shake ? rand(-4, 4) * G.shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    drawBoard();

    const spec = currentRound();
    if (G.mode === 'play') drawTargetBadge(spec);

    const fruit = G.mode === 'title' ? G.demo : G.fruit;
    if (fruit && !G.left) {
      const squ = fruit.squash || 1;
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.scale(1 + (1 - squ) * 0.4, squ);
      ctx.translate(-fruit.x, -fruit.y);
      const wpts = worldPts(fruit);
      const seeds = G.mode === 'title' ? [] : G.seeds;
      const preview = G.mode === 'play' && (G.phase === 'aim' || G.phase === 'enter' || G.phase === 'slash');
      if (preview) {
        const L = clipHalf(wpts, true, G.bladeX);
        const R = clipHalf(wpts, false, G.bladeX);
        const lf = leftFrac(wpts, G.bladeX);
        const smallTint = { a: '#9fffff', b: '#00c8e0', m: '#148a9c', rim: '#7af6ff' };
        const bigTint = { a: '#ffb3ea', b: '#ff3db8', m: '#a01868', rim: '#ff9de0' };
        if (L.length >= 3) {
          drawFruitBody(L, lf <= 0.5 ? smallTint : bigTint, seeds, fruit, 1, 0, 0, 0, fruit.x, fruit.y);
        }
        if (R.length >= 3) {
          drawFruitBody(R, lf <= 0.5 ? bigTint : smallTint, seeds, fruit, 1, 0, 0, 0, fruit.x, fruit.y);
        }
      } else {
        drawFruitBody(wpts, fruit.tint, seeds, fruit, 1, 0, 0, 0, fruit.x, fruit.y);
      }

      ctx.beginPath();
      ctx.moveTo(fruit.x, fruit.y - fruit.s * 0.92);
      ctx.quadraticCurveTo(fruit.x + 6, fruit.y - fruit.s * 1.18, fruit.x + 2, fruit.y - fruit.s * 1.28);
      ctx.strokeStyle = '#7cffb2';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(fruit.x + 10, fruit.y - fruit.s * 1.2, 7, 4, -0.5, 0, TAU);
      ctx.fillStyle = 'rgba(0,240,255,0.45)';
      ctx.fill();
      ctx.restore();

      if (G.mode === 'play' && G.ghostA > 0.04) {
        ctx.save();
        ctx.globalAlpha = G.ghostA * 0.85;
        ctx.setLineDash([6, 7]);
        ctx.strokeStyle = '#ffe36b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(G.ghostX, fruit.y - fruit.s * 0.95);
        ctx.lineTo(G.ghostX, fruit.y + fruit.s * 0.95);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffe36b';
        ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('准线', G.ghostX, fruit.y - fruit.s * 1.05);
        ctx.restore();
      }
    }

    if (G.left && G.right && fruit) {
      const al = shoelace(G.left.pts);
      const ar = shoelace(G.right.pts);
      const leftSmall = al <= ar;
      const smallTint = { a: '#9fffff', b: '#00c8e0', m: '#148a9c', rim: '#7af6ff' };
      const bigTint = { a: '#ffb3ea', b: '#ff3db8', m: '#a01868', rim: '#ff9de0' };
      drawFruitBody(G.left.pts, leftSmall ? smallTint : bigTint, G.seeds, fruit, 1, G.left.ox, G.left.oy, G.left.rot, G.left.cx, G.left.cy);
      drawFruitBody(G.right.pts, leftSmall ? bigTint : smallTint, G.seeds, fruit, 1, G.right.ox, G.right.oy, G.right.rot, G.right.cx, G.right.cy);

      if (G.phase === 'judge' && G.phaseT > 0.18) {
        const tot = al + ar;
        ctx.font = '700 18px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = leftSmall ? '#00f0ff' : '#ff3db8';
        ctx.fillText(Math.round((al / tot) * 100) + '%', G.left.cx + G.left.ox, G.left.cy + G.left.oy - 8);
        ctx.fillStyle = leftSmall ? '#ff3db8' : '#00f0ff';
        ctx.fillText(Math.round((ar / tot) * 100) + '%', G.right.cx + G.right.ox, G.right.cy + G.right.oy - 8);
      }
    }

    for (let i = 0; i < juice.length; i++) {
      const p = juice[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const drop = G.mode === 'title' ? 0 : G.bladeDrop;
    drawBlade(G.bladeX || layout.cx, drop);

    if (G.mode === 'play' && G.phase === 'aim') {
      const tFrac = clamp(G.remain / spec.time, 0, 1);
      const rw = Math.min(220, layout.boardW * 0.5);
      const rx = layout.cx - rw / 2;
      const ry = layout.cy + layout.boardH * 0.42;
      roundRect(rx, ry, rw, 6, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      roundRect(rx, ry, rw * tFrac, 6, 3);
      ctx.fillStyle = tFrac < 0.3 ? '#ff3db8' : tFrac < 0.5 ? '#ffe36b' : '#00f0ff';
      ctx.fill();
    }

    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const u = 1 - p.life / p.max;
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = p.col;
      ctx.font = '900 28px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y - u * 36);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = G.flashC === 'gold'
        ? 'rgba(255,227,107,' + (G.flash * 0.18) + ')'
        : G.flashC === 'pink'
          ? 'rgba(255,61,184,' + (G.flash * 0.16) + ')'
          : 'rgba(0,240,255,' + (G.flash * 0.14) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, W * dpr);
    canvas.height = Math.max(1, H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    layout.cx = W * 0.5;
    layout.cy = H * 0.54;
    layout.boardW = Math.min(W * 0.86, 520);
    layout.boardH = Math.min(H * 0.5, 340);
    layout.fruitR = Math.min(layout.boardW, layout.boardH) * 0.32;
    layout.railY = layout.cy - layout.boardH * 0.42;
    if (G.fruit) {
      G.fruit.x = layout.cx;
      G.fruit.y = layout.cy + 8;
      G.fruit.s = layout.fruitR;
    }
    if (G.demo) {
      G.demo.x = layout.cx;
      G.demo.y = layout.cy + 10;
      G.demo.s = layout.fruitR;
    }
    if (G.fruit && G.mode === 'play' && (G.phase === 'aim' || G.phase === 'enter')) {
      const wpts = worldPts(G.fruit);
      const spec = currentRound();
      G.ghostX = findCutX(wpts, spec.target);
      const rng = bladeRange();
      G.bladeX = clamp(G.bladeX, rng.x0, rng.x1);
    }
  }

  let last = 0;
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (G.paused) {
      draw();
      return;
    }
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 8) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 8) acc = 0;
    draw();
  }

  function isUi(el) {
    return el && (el.tagName === 'BUTTON' || (el.closest && el.closest('button')));
  }

  function onDown(e) {
    if (isUi(e.target)) return;
    audio.ensure();
    if (G.mode !== 'play') return;
    ptr.id = e.pointerId;
    ptr.down = true;
    ptr.drag = false;
    ptr.sx = e.clientX;
    ptr.sy = e.clientY;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
  }

  function onMove(e) {
    if (!ptr.down) return;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    if (!ptr.drag && Math.abs(ptr.x - ptr.sx) + Math.abs(ptr.y - ptr.sy) > 8) ptr.drag = true;
  }

  function onUp(e) {
    if (!ptr.down) return;
    const wasDrag = ptr.drag;
    ptr.down = false;
    ptr.drag = false;
    ptr.id = null;
    if (G.mode === 'play' && !wasDrag) sliceNow();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      keys.l = down;
      e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      keys.r = down;
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.setMuted(!audio.muted);
      audio.ensure();
      e.preventDefault();
      return;
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
      e.preventDefault();
      return;
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startRun();
      else sliceNow();
    }
  }

  btnMain.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnCut.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    sliceNow();
  });
  ['pointerdown', 'click'].forEach(function (ev) {
    btnMain.addEventListener(ev, function (e) { e.stopPropagation(); });
    btnRetry.addEventListener(ev, function (e) { e.stopPropagation(); });
    btnMute.addEventListener(ev, function (e) { e.stopPropagation(); });
    btnCut.addEventListener(ev, function (e) { e.stopPropagation(); });
  });

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (document.hidden && audio.ctx && audio.ctx.state === 'running') audio.ctx.suspend();
    else if (!document.hidden && audio.ctx && !audio.muted) audio.ctx.resume();
    last = 0;
  });

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
    else audio.setMuted(false);
  } catch (e) {
    audio.setMuted(false);
  }

  makeStars();
  makeMotes();
  makeGrain();
  resize();
  spawnFruit('round', true);
  showPanel('title');
  requestAnimationFrame(frame);
})();
