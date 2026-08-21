'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const WALL = 22;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const TRAIL_R = 9;
  const MUTE_KEY = 'playbox-ant-line-mute';
  const SAMPLE = 7;
  const BRUSH_SPD = 310;
  const OPS = '拖动画路 · WASD 移笔空格画 · 回车出发 · C 擦 · Z 撤销 · M 静音';

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function pingpong(t) {
    t = t % 2;
    if (t < 0) t += 2;
    return t < 1 ? t : 2 - t;
  }
  function hash(n) {
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  const STAGES = [
    {
      name: '初径',
      sub: 'FIRST',
      hint: '从蚁穴拖出一条路，接到糖再出发',
      toast: '按住画出小路，接到糖点「出发」',
      time: 50,
      ink: 1700,
      n: 6,
      spd: 158,
      nest: { x: 92, y: 270 },
      sugar: { x: 868, y: 270 },
      rocks: [],
      water: [],
      walls: [],
      beetles: []
    },
    {
      name: '绕石',
      sub: 'ROCK',
      hint: '石头挡路，从上下绕过去',
      toast: '路不能穿石头',
      time: 48,
      ink: 1500,
      n: 6,
      spd: 162,
      nest: { x: 86, y: 270 },
      sugar: { x: 874, y: 270 },
      rocks: [{ x: 480, y: 270, r: 78 }],
      water: [],
      walls: [],
      beetles: []
    },
    {
      name: '水洼',
      sub: 'PUDDLE',
      hint: '水洼会淹蚁，路不能穿过去',
      toast: '绕开发光的水',
      time: 48,
      ink: 1500,
      n: 6,
      spd: 164,
      nest: { x: 88, y: 400 },
      sugar: { x: 872, y: 128 },
      rocks: [],
      water: [{ x: 480, y: 268, rx: 128, ry: 86 }],
      walls: [],
      beetles: []
    },
    {
      name: '门缝',
      sub: 'GATE',
      hint: '从石门正中穿过去，贴边会擦到',
      toast: '缝够走，别蹭石头',
      time: 46,
      ink: 1300,
      n: 7,
      spd: 168,
      nest: { x: 84, y: 270 },
      sugar: { x: 876, y: 270 },
      rocks: [
        { x: 480, y: 52, r: 168 },
        { x: 480, y: 488, r: 168 }
      ],
      water: [],
      walls: [],
      beetles: []
    },
    {
      name: '双洼',
      sub: 'SNAKE',
      hint: '两洼错开，把路画成 S',
      toast: '先绕上洼，再绕下洼',
      time: 50,
      ink: 1550,
      n: 7,
      spd: 170,
      nest: { x: 80, y: 96 },
      sugar: { x: 880, y: 444 },
      rocks: [],
      water: [
        { x: 332, y: 228, rx: 148, ry: 108 },
        { x: 628, y: 348, rx: 148, ry: 108 }
      ],
      walls: [],
      beetles: []
    },
    {
      name: '巡甲',
      sub: 'BEETLE',
      hint: '甲虫来回扫。路绕开它，或等它走开再出发',
      toast: '品红甲虫会冲散蚁列',
      time: 50,
      ink: 1600,
      n: 7,
      spd: 168,
      nest: { x: 86, y: 270 },
      sugar: { x: 874, y: 270 },
      rocks: [{ x: 250, y: 270, r: 42 }],
      water: [],
      walls: [],
      beetles: [{ a: [480, 112], b: [480, 428], spd: 78, r: 26, ph: 0.15 }]
    },
    {
      name: '限墨',
      sub: 'INK',
      hint: '墨有限，抄近路但别沾水石',
      toast: '余墨不够绕远，走缝',
      time: 44,
      ink: 1140,
      n: 8,
      spd: 174,
      nest: { x: 82, y: 270 },
      sugar: { x: 878, y: 270 },
      rocks: [
        { x: 310, y: 168, r: 78 },
        { x: 650, y: 372, r: 78 }
      ],
      water: [{ x: 480, y: 270, rx: 64, ry: 48 }],
      walls: [],
      beetles: []
    },
    {
      name: '夹缝',
      sub: 'WEAVE',
      hint: '左右夹着水石，蛇形穿过去',
      toast: '上缝、中缝、下缝，依次钻',
      time: 54,
      ink: 1680,
      n: 8,
      spd: 172,
      nest: { x: 78, y: 270 },
      sugar: { x: 882, y: 270 },
      rocks: [
        { x: 300, y: 270, r: 86 },
        { x: 660, y: 270, r: 80 }
      ],
      water: [
        { x: 480, y: 96, rx: 92, ry: 64 },
        { x: 480, y: 444, rx: 92, ry: 64 }
      ],
      walls: [],
      beetles: []
    },
    {
      name: '双巡',
      sub: 'PAIR',
      hint: '两只甲虫交叉巡。可绕外圈，也可抓空档穿',
      toast: '两列甲虫相位相反',
      time: 52,
      ink: 1700,
      n: 8,
      spd: 176,
      nest: { x: 80, y: 270 },
      sugar: { x: 880, y: 270 },
      rocks: [{ x: 480, y: 270, r: 48 }],
      water: [],
      walls: [],
      beetles: [
        { a: [340, 78], b: [340, 462], spd: 86, r: 24, ph: 0 },
        { a: [620, 462], b: [620, 78], spd: 86, r: 24, ph: 0 }
      ]
    },
    {
      name: '蜜阵',
      sub: 'MAZE',
      hint: '迷宫到糖。最后一条廊有甲虫，看好再出发',
      toast: '折线穿墙，墨紧，还要躲甲',
      time: 72,
      ink: 3180,
      n: 10,
      spd: 178,
      nest: { x: 78, y: 458 },
      sugar: { x: 882, y: 86 },
      rocks: [],
      water: [],
      walls: [
        { x: 206, y: 148, w: 26, h: 392 },
        { x: 386, y: 0, w: 26, h: 372 },
        { x: 566, y: 168, w: 26, h: 372 },
        { x: 746, y: 0, w: 26, h: 352 }
      ],
      beetles: [{ a: [656, 150], b: [656, 400], spd: 64, r: 23, ph: 0.2 }]
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
  const btnSend = document.getElementById('btn-send');
  const btnClear = document.getElementById('btn-clear');
  const stageLabel = document.getElementById('stage-label');
  const antsLabel = document.getElementById('ants-label');
  const timeLabel = document.getElementById('time-label');
  const inkWrap = document.getElementById('ink-wrap');
  const inkBar = document.getElementById('ink-bar');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const view = { dpr: 1, w: 1, h: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false, u: false, d: false, paint: false };
  const pointer = { down: false, hover: false, x: 480, y: 270, id: null, drawing: false };

  const particles = [];
  const ripples = [];
  const motes = [];
  const pips = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    remain: 50,
    path: [],
    pathLen: 0,
    inkMax: 1700,
    samples: [],
    sampleLen: 0,
    ants: [],
    marching: false,
    arrived: 0,
    need: 6,
    spd: 160,
    spacing: 22,
    nest: { x: 92, y: 270, r: 44 },
    sugar: { x: 868, y: 270, r: 34 },
    rocks: [],
    water: [],
    walls: [],
    beetles: [],
    brush: { x: 140, y: 270 },
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: '#00f0ff',
    toastT: 0,
    why: '',
    connected: false,
    blockedT: 0,
    teach: true,
    sugarSpin: 0,
    dieT: 0,
    clearT: 0,
    gold: 0
  };

  for (let i = 0; i < 42; i++) {
    motes.push({
      x: hash(i * 17 + 3) * WORLD_W,
      y: hash(i * 31 + 9) * WORLD_H,
      r: 0.6 + hash(i * 7) * 1.6,
      a: 0.04 + hash(i * 13) * 0.07,
      s: 0.4 + hash(i * 23) * 1.1,
      p: hash(i * 41) * TAU,
      mag: hash(i * 5) > 0.55
    });
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastScratch: -9,
    lastStep: -9,
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
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = 0.1;
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
    scratch: function () {
      if (G.t - this.lastScratch < 0.045) return;
      this.lastScratch = G.t;
      this.ensure();
      this.noise(0.04, 0.028, 1400);
      this.beep(420 + rand(0, 180), 0.04, 'triangle', 0.012);
    },
    send: function () {
      this.ensure();
      this.beep(196, 0.12, 'sine', 0.05, 392);
      this.beep(294, 0.16, 'triangle', 0.03);
    },
    step: function () {
      if (G.t - this.lastStep < 0.16) return;
      this.lastStep = G.t;
      this.ensure();
      this.beep(180, 0.04, 'sine', 0.018);
    },
    arrive: function () {
      this.ensure();
      this.beep(784, 0.08, 'sine', 0.045, 1175);
    },
    die: function () {
      this.ensure();
      this.noise(0.2, 0.07, 400);
      this.beep(160, 0.28, 'sawtooth', 0.05, 50);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.22, 'triangle', 0.05, 1046);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.14, 'sine', 0.07);
      this.beep(659, 0.16, 'sine', 0.06);
      this.beep(784, 0.18, 'sine', 0.06);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.12, 'sine', 0.05, 784);
    },
    block: function () {
      this.ensure();
      this.beep(110, 0.07, 'triangle', 0.03);
    },
    time: function () {
      this.ensure();
      this.beep(220, 0.18, 'sine', 0.05, 90);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  function toast(msg, warn, ok) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('ok', !!ok && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.7;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    while (pips.length < LIVES) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const inkLeft = G.inkMax <= 0 ? 1 : clamp(1 - G.pathLen / G.inkMax, 0, 1);
    inkBar.style.transform = 'scaleX(' + inkLeft + ')';
    inkWrap.classList.toggle('warn', inkLeft < 0.18 && G.mode === 'play' && !G.marching);
    inkWrap.classList.toggle('hot', G.connected && !G.marching && G.mode === 'play');

    if (G.mode === 'title') {
      stageLabel.textContent = '十列';
      antsLabel.textContent = '画路';
      timeLabel.textContent = '到糖';
      stageLabel.classList.remove('hot');
      antsLabel.classList.remove('hot');
      timeLabel.classList.remove('warn');
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 列 · ' + (st ? st.name : '');
      stageLabel.classList.toggle('hot', G.marching);
      if (G.marching) {
        antsLabel.textContent = '至 ' + G.arrived + '/' + G.need;
        antsLabel.classList.toggle('hot', G.arrived > 0);
      } else if (G.connected) {
        antsLabel.textContent = '可出发';
        antsLabel.classList.add('hot');
      } else {
        antsLabel.textContent = '蚁 ' + G.need;
        antsLabel.classList.remove('hot');
      }
      const sec = Math.max(0, G.remain);
      timeLabel.textContent = sec.toFixed(1) + 's';
      timeLabel.classList.toggle('warn', sec < 8 && G.mode === 'play');
    }

    const sendOk = G.mode === 'play' && G.connected && !G.marching && !G.why;
    btnSend.disabled = !sendOk;
    btnSend.classList.toggle('ready', sendOk);
    btnClear.disabled = !(G.mode === 'play' && G.path.length > 0 && !G.marching && !G.why);
    syncPips();
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove('hidden');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kicker;
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovOps.textContent = ops || OPS;
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || 'c',
        g: spec.g == null ? 40 : spec.g
      });
    }
  }

  function ripple(x, y, col, max) {
    ripples.push({ x: x, y: y, t: 1, r: 6, max: max || 40, col: col || 'c' });
    if (ripples.length > 16) ripples.shift();
  }

  function inRock(x, y, pad) {
    const p = pad == null ? TRAIL_R : pad;
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (hypot2(x - r.x, y - r.y) < r.r + p) return true;
    }
    return false;
  }

  function inWater(x, y, pad) {
    const p = pad == null ? TRAIL_R + 2 : pad;
    for (let i = 0; i < G.water.length; i++) {
      const w = G.water[i];
      const dx = (x - w.x) / (w.rx + p);
      const dy = (y - w.y) / (w.ry + p);
      if (dx * dx + dy * dy <= 1) return true;
    }
    return false;
  }

  function inWall(x, y, pad) {
    const p = pad == null ? TRAIL_R : pad;
    if (x < WALL + p || x > WORLD_W - WALL - p || y < WALL + p || y > WORLD_H - WALL - p) return true;
    for (let i = 0; i < G.walls.length; i++) {
      const r = G.walls[i];
      if (x > r.x - p && x < r.x + r.w + p && y > r.y - p && y < r.y + r.h + p) return true;
    }
    return false;
  }

  function blocked(x, y, pad) {
    return inWall(x, y, pad) || inRock(x, y, pad) || inWater(x, y, pad);
  }

  function segmentBlocked(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = hypot2(dx, dy);
    const steps = Math.max(1, Math.ceil(len / 4));
    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      if (blocked(ax + dx * u, ay + dy * u, TRAIL_R)) return true;
    }
    return false;
  }

  function distNest(x, y) {
    return hypot2(x - G.nest.x, y - G.nest.y);
  }
  function distSugar(x, y) {
    return hypot2(x - G.sugar.x, y - G.sugar.y);
  }

  function nearNest(x, y) {
    return distNest(x, y) < G.nest.r + 26;
  }
  function nearSugar(x, y) {
    return distSugar(x, y) < G.sugar.r + 24;
  }

  function pathLength(pts) {
    let n = 0;
    for (let i = 1; i < pts.length; i++) n += hypot2(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return n;
  }

  function updateConnected() {
    const prev = G.connected;
    if (G.path.length < 2) {
      G.connected = false;
      return;
    }
    const a = G.path[0];
    const b = G.path[G.path.length - 1];
    G.connected = nearNest(a.x, a.y) && nearSugar(b.x, b.y);
    if (G.connected && !prev && G.mode === 'play' && !G.marching) {
      toast('接到了 · 出发', false, true);
      setHint(coarse ? '点糖或「出发」' : '回车或点糖出发', 'hot');
    }
  }

  function resample(pts, step) {
    const n = pts.length;
    if (n === 0) return [];
    if (n === 1) return [{ x: pts[0].x, y: pts[0].y }];
    const cum = [0];
    for (let i = 1; i < n; i++) {
      cum.push(cum[i - 1] + hypot2(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    const total = cum[n - 1];
    if (total < 1) return [{ x: pts[0].x, y: pts[0].y }];
    const count = Math.max(2, Math.ceil(total / step) + 1);
    const out = [];
    let s = 0;
    for (let i = 0; i < count; i++) {
      const d = (i / (count - 1)) * total;
      while (s < n - 2 && cum[s + 1] < d) s += 1;
      const d0 = cum[s];
      const d1 = cum[s + 1];
      const u = d1 > d0 ? (d - d0) / (d1 - d0) : 0;
      out.push({
        x: pts[s].x + (pts[s + 1].x - pts[s].x) * u,
        y: pts[s].y + (pts[s + 1].y - pts[s].y) * u
      });
    }
    return out;
  }

  function along(samples, dist, total) {
    if (!samples.length) return { x: G.nest.x, y: G.nest.y, ang: 0 };
    if (dist <= 0) {
      const a = samples[0];
      const b = samples[Math.min(1, samples.length - 1)];
      return { x: a.x, y: a.y, ang: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    if (dist >= total) {
      const b = samples[samples.length - 1];
      const a = samples[Math.max(0, samples.length - 2)];
      return { x: b.x, y: b.y, ang: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    const idx = (dist / total) * (samples.length - 1);
    const i = Math.min(samples.length - 2, idx | 0);
    const f = idx - i;
    const a = samples[i];
    const b = samples[i + 1];
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      ang: Math.atan2(b.y - a.y, b.x - a.x)
    };
  }

  function appendPoint(x, y) {
    const last = G.path[G.path.length - 1];
    const d = hypot2(x - last.x, y - last.y);
    if (d < 4.2) return true;
    if (segmentBlocked(last.x, last.y, x, y)) {
      G.blockedT = 0.18;
      return false;
    }
    if (G.pathLen + d > G.inkMax) {
      if (G.blockedT <= 0) {
        toast('墨尽了', true);
        G.blockedT = 0.8;
        audio.block();
      }
      return false;
    }
    G.path.push({ x: x, y: y });
    G.pathLen += d;
    updateConnected();
    if (particles.length < 120 && Math.random() < 0.28) {
      emit(1, {
        x: x, y: y, j: 2,
        vx0: -12, vx1: 12, vy0: -18, vy1: 6,
        life: 0.35, r0: 0.8, r1: 1.8, col: 'm', g: -20
      });
    }
    return true;
  }

  function tryAddPoint(x, y, fromNestReset, isStart) {
    if (G.mode !== 'play' || G.marching || G.why) return false;
    x = clamp(x, WALL + 4, WORLD_W - WALL - 4);
    y = clamp(y, WALL + 4, WORLD_H - WALL - 4);

    if (G.path.length === 0) {
      if (!nearNest(x, y)) {
        if (G.blockedT <= 0) {
          toast('从蚁穴起笔', true);
          G.blockedT = 0.7;
          audio.block();
        }
        return false;
      }
      if (blocked(x, y, TRAIL_R - 4)) return false;
      const nx = G.nest.x + (x - G.nest.x) * 0.35;
      const ny = G.nest.y + (y - G.nest.y) * 0.35;
      G.path.push({ x: G.nest.x, y: G.nest.y });
      if (!blocked(nx, ny, TRAIL_R - 2) && !segmentBlocked(G.nest.x, G.nest.y, nx, ny)) {
        G.path.push({ x: nx, y: ny });
      }
      const tail = G.path[G.path.length - 1];
      if (!segmentBlocked(tail.x, tail.y, x, y)) G.path.push({ x: x, y: y });
      G.pathLen = pathLength(G.path);
      G.teach = false;
      updateConnected();
      audio.scratch();
      return true;
    }

    if (fromNestReset && nearNest(x, y)) {
      G.path.length = 0;
      G.pathLen = 0;
      G.connected = false;
      return tryAddPoint(x, y, false, false);
    }

    const last = G.path[G.path.length - 1];
    const d = hypot2(x - last.x, y - last.y);
    if (isStart && d > 52) {
      if (G.blockedT <= 0) {
        toast('接到路的尽头接着画', true);
        G.blockedT = 0.7;
        audio.block();
      }
      return false;
    }
    if (d < 4.2) return true;
    if (d > 18) {
      const steps = Math.ceil(d / 10);
      for (let i = 1; i <= steps; i++) {
        const u = i / steps;
        const sx = last.x + (x - last.x) * u;
        const sy = last.y + (y - last.y) * u;
        if (!appendPoint(sx, sy)) return false;
      }
      return true;
    }
    return appendPoint(x, y);
  }

  function clearPath() {
    if (G.mode !== 'play' || G.marching || G.why) return;
    G.path.length = 0;
    G.pathLen = 0;
    G.samples.length = 0;
    G.sampleLen = 0;
    G.connected = false;
    audio.block();
    toast('路已擦掉');
    setHint(STAGES[G.stage].hint, '');
    syncHud();
  }

  function undoPath() {
    if (G.mode !== 'play' || G.marching || G.why || G.path.length < 2) return;
    let cut = 0;
    while (G.path.length > 1 && cut < 42) {
      const a = G.path[G.path.length - 2];
      const b = G.path[G.path.length - 1];
      cut += hypot2(b.x - a.x, b.y - a.y);
      G.path.pop();
      if (cut >= 42) break;
    }
    G.pathLen = pathLength(G.path);
    updateConnected();
    audio.scratch();
    syncHud();
  }

  function spawnAnts() {
    G.ants.length = 0;
    G.arrived = 0;
    for (let i = 0; i < G.need; i++) {
      G.ants.push({
        dist: -i * G.spacing,
        alive: true,
        arrived: false,
        phase: i * 0.73,
        x: G.nest.x,
        y: G.nest.y,
        ang: 0,
        eat: 0
      });
    }
  }

  function sendAnts() {
    if (G.mode !== 'play' || G.marching || G.why) return;
    updateConnected();
    if (!G.connected) {
      toast(G.path.length < 2 ? '先画出小路' : '还没接到糖', true);
      audio.block();
      return;
    }
    G.samples = resample(G.path, SAMPLE);
    G.sampleLen = pathLength(G.samples);
    if (G.sampleLen < 40) {
      toast('路太短', true);
      return;
    }
    spawnAnts();
    G.marching = true;
    G.lock = 0.2;
    G.gold = 0.4;
    audio.send();
    toast('蚁列出发', false, true);
    setHint('跟着走 · 别碰上甲虫', 'hot');
    ripple(G.nest.x, G.nest.y, 'm', 56);
    syncHud();
  }

  function cloneStage(st) {
    G.nest.x = st.nest.x;
    G.nest.y = st.nest.y;
    G.nest.r = 44;
    G.sugar.x = st.sugar.x;
    G.sugar.y = st.sugar.y;
    G.sugar.r = 34;
    G.rocks = [];
    for (let i = 0; i < st.rocks.length; i++) {
      const r = st.rocks[i];
      G.rocks.push({ x: r.x, y: r.y, r: r.r, seed: (i + 1) * 17 + G.stage * 9 });
    }
    G.water = [];
    for (let i = 0; i < st.water.length; i++) {
      const w = st.water[i];
      G.water.push({ x: w.x, y: w.y, rx: w.rx, ry: w.ry, ph: i * 0.7 });
    }
    G.walls = [];
    for (let i = 0; i < st.walls.length; i++) {
      const w = st.walls[i];
      G.walls.push({ x: w.x, y: w.y, w: w.w, h: w.h });
    }
    G.beetles = [];
    for (let i = 0; i < st.beetles.length; i++) {
      const b = st.beetles[i];
      G.beetles.push({
        a: [b.a[0], b.a[1]],
        b: [b.b[0], b.b[1]],
        spd: b.spd,
        r: b.r,
        ph: b.ph || 0,
        t: b.ph || 0,
        x: b.a[0],
        y: b.a[1],
        ang: Math.atan2(b.b[1] - b.a[1], b.b[0] - b.a[0])
      });
    }
    G.inkMax = st.ink;
    G.need = st.n;
    G.spd = st.spd;
    G.spacing = st.n > 8 ? 20 : 22;
    G.remain = st.time;
  }

  function resetDraw() {
    G.path.length = 0;
    G.pathLen = 0;
    G.samples.length = 0;
    G.sampleLen = 0;
    G.ants.length = 0;
    G.marching = false;
    G.arrived = 0;
    G.connected = false;
    G.why = '';
    G.dieT = 0;
    G.clearT = 0;
    G.blockedT = 0;
    G.lock = 0.12;
    G.brush.x = G.nest.x + 56;
    G.brush.y = G.nest.y;
  }

  function loadStage(index, demo) {
    const st = STAGES[index];
    G.stage = index;
    cloneStage(st);
    resetDraw();
    G.teach = index === 0;
    particles.length = 0;
    ripples.length = 0;
    if (demo) {
      const path = [];
      for (let x = 92; x <= 868; x += 10) {
        const u = (x - 92) / 776;
        path.push({ x: x, y: 270 + Math.sin(u * Math.PI) * 72 });
      }
      G.path = path;
      G.pathLen = pathLength(path);
      G.samples = resample(path, SAMPLE);
      G.sampleLen = pathLength(G.samples);
      G.need = 8;
      spawnAnts();
      G.marching = true;
      G.connected = true;
      return;
    }
    toast(st.toast);
    setHint(coarse ? '拖出小路接到糖 · 点糖或「出发」' : st.hint, '');
    syncHud();
  }

  function startStage(i) {
    G.mode = 'play';
    hideOverlay();
    loadStage(i, false);
    audio.start();
  }

  function startRun() {
    G.lives = LIVES;
    G.gold = 0;
    G.flash = 0;
    startStage(0);
  }

  function failWhyText(why) {
    if (why === 'beetle') return '甲虫冲散了蚁列。';
    if (why === 'time') return '糖化了，来不及。';
    return '蚁列没走到糖。';
  }

  function beginDie(why) {
    if (G.mode !== 'play' || G.why) return;
    G.why = why;
    G.dieT = 0.62;
    G.shake = 12;
    G.flash = 0.55;
    G.flashCol = '#ff3db8';
    G.marching = false;
    audio.die();
    toast(why === 'time' ? '超时' : '冲散了', true);
    setHint(failWhyText(why), 'warn');
  }

  function failStage() {
    G.lives -= 1;
    G.mode = 'fail';
    const more = G.lives > 0;
    const why = failWhyText(G.why);
    showOverlay(
      'lose',
      G.why === 'time' ? '糖化' : '冲散',
      more
        ? why + '<br />还剩 ' + G.lives + ' 命。'
        : why + '十列未完。',
      more ? '再试本列' : '再来一局',
      G.why === 'time' ? 'LATE' : 'SCATTER',
      OPS
    );
    syncHud();
  }

  function beginClear() {
    if (G.mode !== 'play') return;
    G.mode = 'clear';
    G.clearT = 0.92;
    G.gold = 0.9;
    G.flash = 0.45;
    G.flashCol = '#ffe36b';
    audio.clear();
    toast(STAGES[G.stage].name + ' · 至', false, true);
    setHint('蚁列到糖了', 'hot');
    ripple(G.sugar.x, G.sugar.y, 'g', 70);
    emit(22, {
      x: G.sugar.x, y: G.sugar.y, j: 16,
      vx0: -120, vx1: 120, vy0: -140, vy1: 40,
      life: 0.7, r0: 1.4, r1: 3.6, col: 'g', g: 80
    });
  }

  function winAll() {
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      '蚁至',
      '十列都把糖接到了。小路还亮着。',
      '再列一次',
      'ARRIVED',
      '列成 · 剩命 ' + G.lives
    );
    syncHud();
  }

  function bootTitle() {
    G.mode = 'title';
    G.lives = LIVES;
    G.stage = 0;
    G.why = '';
    loadStage(0, true);
    showOverlay(
      'title',
      '蚁列',
      '画一条小路，让蚁列走到糖。<br />路不能穿水和石，甲虫碰上就散。',
      '开列',
      'ANTS',
      OPS
    );
    setHint('从蚁穴起笔 · 接到糖再出发', '');
    syncHud();
  }

  function onMain() {
    if (G.mode === 'title' || G.mode === 'win') startRun();
    else if (G.mode === 'fail') {
      if (G.lives > 0) startStage(G.stage);
      else startRun();
    }
  }

  function retry() {
    if (G.mode === 'title') startRun();
    else startRun();
  }

  function updateBeetles(dt) {
    for (let i = 0; i < G.beetles.length; i++) {
      const b = G.beetles[i];
      const dx = b.b[0] - b.a[0];
      const dy = b.b[1] - b.a[1];
      const len = hypot2(dx, dy) || 1;
      b.t += dt * b.spd / len;
      const u = pingpong(b.t + b.ph);
      const prevX = b.x;
      const prevY = b.y;
      b.x = lerp(b.a[0], b.b[0], u);
      b.y = lerp(b.a[1], b.b[1], u);
      const mx = b.x - prevX;
      const my = b.y - prevY;
      if (mx * mx + my * my > 0.04) b.ang = Math.atan2(my, mx);
    }
  }

  function updateAnts(dt) {
    if (!G.marching || !G.samples.length) return;
    const total = G.sampleLen;
    let allIn = true;
    let anyLive = false;
    for (let i = 0; i < G.ants.length; i++) {
      const a = G.ants[i];
      if (!a.alive) continue;
      anyLive = true;
      if (a.arrived) {
        a.eat += dt;
        a.x = G.sugar.x + Math.cos(a.phase + G.clock * 2.4) * 8;
        a.y = G.sugar.y + Math.sin(a.phase * 1.3 + G.clock * 2.1) * 7;
        continue;
      }
      allIn = false;
      a.dist += G.spd * dt;
      if (a.dist < 0) {
        const u = clamp(-a.dist / (G.spacing * G.need), 0, 1);
        const holeX = G.nest.x - 6;
        const holeY = G.nest.y + 4;
        const first = along(G.samples, 8, total);
        a.x = lerp(holeX, first.x, 0.15 + (1 - u) * 0.2);
        a.y = lerp(holeY, first.y, 0.15);
        a.ang = first.ang;
      } else {
        const p = along(G.samples, a.dist, total);
        a.x = p.x;
        a.y = p.y;
        a.ang = p.ang;
      }
      if (a.dist >= total) {
        a.arrived = true;
        a.dist = total;
        G.arrived += 1;
        if (G.mode === 'play') {
          audio.arrive();
          emit(8, {
            x: G.sugar.x, y: G.sugar.y, j: 8,
            vx0: -70, vx1: 70, vy0: -90, vy1: -10,
            life: 0.45, r0: 1.1, r1: 2.6, col: 'g', g: 60
          });
        }
        continue;
      }
      if (G.mode === 'play' && a.dist > 8) {
        for (let k = 0; k < G.beetles.length; k++) {
          const b = G.beetles[k];
          if (hypot2(a.x - b.x, a.y - b.y) < b.r + 9) {
            emit(18, {
              x: a.x, y: a.y, j: 10,
              vx0: -140, vx1: 140, vy0: -160, vy1: 40,
              life: 0.55, r0: 1.2, r1: 3.4, col: 'm', g: 90
            });
            ripple(a.x, a.y, 'm', 50);
            a.alive = false;
            beginDie('beetle');
            return;
          }
        }
      }
    }
    if (G.mode === 'play' && G.marching && !G.why) audio.step();
    if (G.mode === 'title' && anyLive) {
      for (let i = 0; i < G.ants.length; i++) {
        const a = G.ants[i];
        if (a.arrived || a.dist >= total) {
          a.arrived = false;
          a.dist -= total + G.spacing * G.need;
        }
      }
    }
    if (G.mode === 'play' && allIn && G.arrived >= G.need) beginClear();
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.4;
      r.r += (r.max - r.r) * 5.4 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.1);
    G.gold = Math.max(0, G.gold - dt * 0.9);
    G.blockedT = Math.max(0, G.blockedT - dt);
    G.lock = Math.max(0, G.lock - dt);
    G.sugarSpin += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    if (G.mode === 'play' && Math.random() < 0.18) {
      emit(1, {
        x: G.nest.x + rand(-10, 10),
        y: G.nest.y + rand(-6, 8),
        j: 2,
        vx0: -8, vx1: 8, vy0: -22, vy1: -6,
        life: 0.8, r0: 0.7, r1: 1.6, col: 'm', g: -12
      });
    }
    if ((G.mode === 'play' || G.mode === 'title') && Math.random() < 0.16) {
      emit(1, {
        x: G.sugar.x + rand(-8, 8),
        y: G.sugar.y + rand(-8, 8),
        j: 1,
        vx0: -10, vx1: 10, vy0: -16, vy1: 4,
        life: 0.7, r0: 0.6, r1: 1.5, col: 'g', g: -8
      });
    }
  }

  function updateBrush(dt) {
    if (G.mode !== 'play' || G.marching || G.why) return;
    if (pointer.down) return;
    let ax = 0;
    let ay = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay -= 1;
    if (keys.d) ay += 1;
    if (ax || ay) {
      pointer.hover = false;
      const m = hypot2(ax, ay) || 1;
      G.brush.x = clamp(G.brush.x + (ax / m) * BRUSH_SPD * dt, WALL + 8, WORLD_W - WALL - 8);
      G.brush.y = clamp(G.brush.y + (ay / m) * BRUSH_SPD * dt, WALL + 8, WORLD_H - WALL - 8);
    }
    if (keys.paint) {
      const added = tryAddPoint(G.brush.x, G.brush.y, false, false);
      if (added) audio.scratch();
    }
  }

  function updatePlay(dt) {
    updateBeetles(dt);
    updateBrush(dt);
    if (G.why) {
      G.dieT -= dt;
      if (G.dieT <= 0) failStage();
      return;
    }
    if (G.mode === 'play' && !G.why) {
      G.remain -= dt;
      if (G.remain <= 0) {
        G.remain = 0;
        beginDie('time');
        audio.time();
        return;
      }
    }
    updateAnts(dt);
  }

  function updateTitle(dt) {
    updateBeetles(dt);
    updateAnts(dt);
  }

  function colOf(c) {
    if (c === 'm') return '#ff3db8';
    if (c === 'g') return '#ffe36b';
    return '#00f0ff';
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

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = WALL; x < WORLD_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, WALL);
      ctx.lineTo(x, WORLD_H - WALL);
      ctx.stroke();
    }
    for (let y = WALL; y < WORLD_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(WALL, y);
      ctx.lineTo(WORLD_W - WALL, y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(246, 243, 255, 0.035)';
    for (let i = 0; i < 70; i++) {
      const x = 18 + hash(i * 19 + 2) * (WORLD_W - 36);
      const y = 18 + hash(i * 29 + 5) * (WORLD_H - 36);
      ctx.beginPath();
      ctx.arc(x, y, 0.7 + hash(i) * 1.1, 0, TAU);
      ctx.fill();
    }
  }

  function drawArena() {
    roundRect(WALL - 6, WALL - 6, WORLD_W - (WALL - 6) * 2, WORLD_H - (WALL - 6) * 2, 18);
    ctx.fillStyle = '#070414';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  function drawWater(w) {
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.scale(w.rx, w.ry);
    const g = ctx.createRadialGradient(0, -0.15, 0.1, 0, 0, 1);
    g.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
    g.addColorStop(0.55, 'rgba(20, 60, 120, 0.42)');
    g.addColorStop(1, 'rgba(8, 16, 48, 0.55)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, w.rx, w.ry, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.16)';
    ctx.lineWidth = 4;
    ctx.stroke();
    const t = G.clock + w.ph;
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.35 + i / 3) % 1);
      ctx.globalAlpha = (1 - k) * 0.35;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, w.rx * (0.25 + k * 0.7), w.ry * (0.25 + k * 0.7), 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#e8ffff';
    ctx.beginPath();
    ctx.ellipse(w.x - w.rx * 0.28, w.y - w.ry * 0.38, w.rx * 0.22, w.ry * 0.1, -0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawRock(r) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.beginPath();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r.seed * 0.01;
      const rad = r.r * (0.86 + hash(r.seed + i * 3) * 0.22);
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(-r.r * 0.2, -r.r * 0.25, 4, 0, 0, r.r);
    g.addColorStop(0, '#1b1230');
    g.addColorStop(1, '#0a0614');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.38)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.14)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(246, 243, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const a = hash(r.seed + i * 11) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r.r * 0.15, Math.sin(a) * r.r * 0.15);
      ctx.lineTo(Math.cos(a) * r.r * 0.7, Math.sin(a) * r.r * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWall(w) {
    ctx.save();
    roundRect(w.x, w.y, w.w, w.h, 6);
    ctx.fillStyle = '#100818';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.32)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawNest() {
    const n = G.nest;
    const pulse = 0.85 + Math.sin(G.clock * 2.2) * 0.15;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(n.x, n.y, 8, n.x, n.y, n.r * 2.1);
    g.addColorStop(0, 'rgba(255, 61, 184,' + (0.18 * pulse) + ')');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r * 2.1, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(n.x, n.y + 6);
    ctx.beginPath();
    ctx.ellipse(0, 0, n.r * 1.15, n.r * 0.78, 0, 0, TAU);
    const mg = ctx.createRadialGradient(-8, -10, 6, 0, 4, n.r);
    mg.addColorStop(0, '#3a1028');
    mg.addColorStop(1, '#120610');
    ctx.fillStyle = mg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-2, -4, n.r * 0.42, n.r * 0.3, -0.15, 0, TAU);
    ctx.fillStyle = '#05030c';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    if (G.stage < 2 && G.mode === 'play') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 154, 212, 0.7)';
      ctx.font = '700 11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('穴', n.x, n.y + n.r + 16);
      ctx.restore();
    }
  }

  function drawSugar() {
    const s = G.sugar;
    const pulse = 0.8 + Math.sin(G.clock * 3.1) * 0.2;
    const ready = G.connected && !G.marching && G.mode === 'play';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r * (ready ? 2.4 : 1.9));
    g.addColorStop(0, ready ? 'rgba(255, 227, 107, 0.32)' : 'rgba(0, 240, 255,' + (0.2 * pulse) + ')');
    g.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(G.sugarSpin * 0.18);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      const rr = i % 2 === 0 ? s.r : s.r * 0.72;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const cg = ctx.createLinearGradient(-s.r, -s.r, s.r, s.r);
    cg.addColorStop(0, '#ffe36b');
    cg.addColorStop(0.45, '#fff6c4');
    cg.addColorStop(1, '#00f0ff');
    ctx.fillStyle = cg;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ready ? '#ffe36b' : '#00f0ff';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * s.r * 0.62, Math.sin(a) * s.r * 0.62);
    }
    ctx.strokeStyle = 'rgba(5, 3, 12, 0.25)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    if (ready) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 227, 107, 0.85)';
      ctx.font = '700 11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffe36b';
      ctx.shadowBlur = 8;
      ctx.fillText('出发', s.x, s.y + s.r + 18);
      ctx.restore();
    } else if (G.stage < 2 && G.mode === 'play') {
      ctx.save();
      ctx.fillStyle = 'rgba(122, 246, 255, 0.75)';
      ctx.font = '700 11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('糖', s.x, s.y + s.r + 16);
      ctx.restore();
    }
  }

  function drawTrail() {
    if (G.path.length < 2) {
      if (G.teach && G.mode === 'play') {
        ctx.save();
        ctx.setLineDash([6, 10]);
        ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(G.nest.x + 20, G.nest.y);
        const mid = WORLD_W * 0.5;
        ctx.quadraticCurveTo(mid, G.nest.y - 30, G.sugar.x - 24, G.sugar.y);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    const lead = G.marching && G.ants.length ? Math.max(0, G.ants[0].dist) : 0;
    const total = G.pathLen || 1;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff3db8';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.55)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(G.path[0].x, G.path[0].y);
    for (let i = 1; i < G.path.length; i++) ctx.lineTo(G.path[i].x, G.path[i].y);
    ctx.stroke();

    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4.2;
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    if (G.marching && lead > 0) {
      ctx.shadowColor = '#ffe36b';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ffe36b';
      ctx.lineWidth = 3.2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      const uStop = clamp(lead / total, 0, 1);
      const stop = Math.max(1, (uStop * (G.path.length - 1)) | 0);
      ctx.moveTo(G.path[0].x, G.path[0].y);
      for (let i = 1; i <= stop; i++) ctx.lineTo(G.path[i].x, G.path[i].y);
      ctx.stroke();
    }
    ctx.restore();

    const tip = G.path[G.path.length - 1];
    glowDot(tip.x, tip.y, G.connected ? 3.4 : 2.4, G.connected ? '#ffe36b' : '#ff3db8', 0.85);
  }

  function drawAnt(a, beetle) {
    const t = G.clock * (beetle ? 10 : 16) + a.phase;
    const bob = Math.sin(t) * (beetle ? 0.8 : 0.55);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.ang);
    ctx.translate(0, bob);

    const scale = beetle ? 1.55 : 1;
    ctx.strokeStyle = beetle ? 'rgba(255, 61, 184, 0.85)' : 'rgba(255, 154, 212, 0.8)';
    ctx.lineWidth = beetle ? 1.5 : 1.05;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const swing = Math.sin(t + i * 1.1) * 0.45;
      const bx = -4 + i * 4;
      ctx.beginPath();
      ctx.moveTo(bx * scale, 0);
      ctx.lineTo((bx - 3) * scale, (6 + swing * 3) * scale);
      ctx.moveTo(bx * scale, 0);
      ctx.lineTo((bx - 3) * scale, (-6 - swing * 3) * scale);
      ctx.stroke();
    }

    ctx.fillStyle = beetle ? '#ff3db8' : '#d42a8e';
    ctx.shadowColor = beetle ? '#ff3db8' : '#ff3db8';
    ctx.shadowBlur = beetle ? 10 : 6;
    ctx.beginPath();
    ctx.ellipse(-5.2 * scale, 0, 4.2 * scale, 2.6 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0.2 * scale, 0, 3.1 * scale, 2.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4.6 * scale, 0, 2.6 * scale, 2.1 * scale, 0, 0, TAU);
    ctx.fill();

    if (beetle) {
      ctx.strokeStyle = '#ffe36b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(6 * scale, -1.2);
      ctx.lineTo(11 * scale, -4.2);
      ctx.moveTo(6 * scale, 1.2);
      ctx.lineTo(11 * scale, 4.2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(6, -0.6);
      ctx.quadraticCurveTo(9, -4, 11, -5.5);
      ctx.moveTo(6, 0.6);
      ctx.quadraticCurveTo(9, 4, 11, 5.5);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = beetle ? '#ffe36b' : '#00f0ff';
    ctx.beginPath();
    ctx.arc(5.6 * scale, -0.8 * scale, beetle ? 1.1 : 0.7, 0, TAU);
    ctx.arc(5.6 * scale, 0.8 * scale, beetle ? 1.1 : 0.7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBeetle(b) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#ff3db8';
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 10, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#ff3db8';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.a[0], b.a[1]);
    ctx.lineTo(b.b[0], b.b[1]);
    ctx.stroke();
    ctx.restore();

    drawAnt({ x: b.x, y: b.y, ang: b.ang, phase: b.ph * 4 }, true);
  }

  function drawBrush() {
    if (G.mode !== 'play' || G.marching || G.why) return;
    const x = pointer.down || pointer.hover ? pointer.x : G.brush.x;
    const y = pointer.down || pointer.hover ? pointer.y : G.brush.y;
    const bad = blocked(x, y, TRAIL_R);
    ctx.save();
    ctx.strokeStyle = bad ? '#ff3db8' : (G.connected ? '#ffe36b' : '#00f0ff');
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(x, y, TRAIL_R, 0, TAU);
    ctx.stroke();
    ctx.restore();
    glowDot(x, y, 1.6, bad ? '#ff3db8' : '#00f0ff', 0.9);
  }

  function drawWorld() {
    const grd = ctx.createRadialGradient(WORLD_W * 0.3, WORLD_H * 0.15, 20, WORLD_W * 0.55, WORLD_H * 0.7, 720);
    grd.addColorStop(0, '#0a0618');
    grd.addColorStop(1, '#05030c');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    const neb = ctx.createRadialGradient(G.nest.x, G.nest.y, 10, G.nest.x, G.nest.y, 280);
    neb.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    neb.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    const neb2 = ctx.createRadialGradient(G.sugar.x, G.sugar.y, 10, G.sugar.x, G.sugar.y, 260);
    neb2.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    neb2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawArena();
    drawGrid();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * m.s + m.p));
      glowDot(m.x, (m.y + G.t * 7 * m.s) % WORLD_H, m.r, m.mag ? '#ff3db8' : '#00f0ff', a);
    }

    for (let i = 0; i < G.walls.length; i++) drawWall(G.walls[i]);
    for (let i = 0; i < G.rocks.length; i++) drawRock(G.rocks[i]);
    for (let i = 0; i < G.water.length; i++) drawWater(G.water[i]);

    drawNest();
    drawTrail();
    drawSugar();

    for (let i = 0; i < G.beetles.length; i++) drawBeetle(G.beetles[i]);

    for (let i = G.ants.length - 1; i >= 0; i--) {
      const a = G.ants[i];
      if (!a.alive) continue;
      if (a.arrived && a.eat > 0.25) continue;
      drawAnt(a, false);
    }

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
      const k = Math.max(0, p.life / p.max);
      ctx.globalAlpha = k;
      ctx.fillStyle = colOf(p.col);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * Math.max(0.2, k), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawBrush();
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

  let last = 0;
  let acc = 0;
  function loop(now) {
    const t = now * 0.001;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.08) dt = 0.08;
    G.t = t;
    if (!document.hidden) {
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        G.clock += STEP;
        if (G.mode === 'title') updateTitle(STEP);
        else if (G.mode === 'play') updatePlay(STEP);
        else if (G.mode === 'clear') {
          updateBeetles(STEP);
          updateAnts(STEP);
          G.clearT -= STEP;
          if (G.clearT <= 0) {
            if (G.stage + 1 >= STAGES.length) winAll();
            else startStage(G.stage + 1);
          }
        } else if (G.mode === 'fail' || G.mode === 'win') {
          updateBeetles(STEP);
        }
        updateFx(STEP);
        acc -= STEP;
      }
      syncHud();
    }
    draw();
    requestAnimationFrame(loop);
  }

  function keyPaintCode(code) {
    return code === 'Space';
  }

  window.addEventListener('keydown', function (e) {
    if (
      e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
      e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
      e.code === 'Space'
    ) {
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
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'fail') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        audio.ensure();
        onMain();
      }
      return;
    }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = true;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = true;
    if (keyPaintCode(e.code)) {
      keys.paint = true;
      canvas.classList.add('draw');
    }
    if (e.code === 'Enter') {
      e.preventDefault();
      sendAnts();
    }
    if (e.code === 'KeyC' || e.code === 'Backspace') {
      e.preventDefault();
      clearPath();
    }
    if (e.code === 'KeyZ') {
      e.preventDefault();
      undoPath();
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = false;
    if (keyPaintCode(e.code)) {
      keys.paint = false;
      if (!pointer.down) canvas.classList.remove('draw');
    }
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (G.mode !== 'play') return;
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.drawing = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    G.brush.x = w.x;
    G.brush.y = w.y;
    canvas.classList.add('draw');
    if (!G.marching && !G.why) {
      const reset = G.path.length > 0 && nearNest(w.x, w.y);
      tryAddPoint(w.x, w.y, reset, !reset);
    }
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.hover = true;
    pointer.x = w.x;
    pointer.y = w.y;
    G.brush.x = w.x;
    G.brush.y = w.y;
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
    if (G.mode === 'play' && !G.marching && !G.why) {
      const added = tryAddPoint(w.x, w.y, false);
      if (added) audio.scratch();
    }
  });

  function endPointer(e) {
    if (e && pointer.id !== null && e.pointerId !== pointer.id) return;
    const was = pointer.down;
    const x = pointer.x;
    const y = pointer.y;
    pointer.down = false;
    pointer.drawing = false;
    pointer.id = null;
    canvas.classList.remove('draw');
    if (was && G.mode === 'play' && !G.marching && !G.why && G.connected && nearSugar(x, y)) {
      sendAnts();
    }
  }

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', function () {
    pointer.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    onMain();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    retry();
  });
  btnSend.addEventListener('click', function () {
    audio.ensure();
    sendAnts();
  });
  btnClear.addEventListener('click', function () {
    audio.ensure();
    clearPath();
  });

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  resize();
  bootTitle();
  requestAnimationFrame(loop);
})();
