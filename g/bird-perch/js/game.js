'use strict';

(function () {
  const VW = 480;
  const VH = 800;
  const CX = 240;
  const WIRE_Y = 108;
  const GROUND = 768;
  const TRUNK_TOP = 196;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-bird-perch-mute';
  const OPS = '拖鸟上枝 · ← → 选鸟 · 1-5 落枝 · 空格落下 · M 静音';

  const WCOL = {
    1: [0, 240, 255],
    2: [255, 61, 184],
    3: [255, 227, 107],
    4: [255, 168, 214]
  };

  const STAGES = [
    {
      name: '初栖',
      sub: 'FIRST',
      hint: '轻鸟上细枝，重鸟上粗枝',
      toast: '拖到枝上 · 超重会折',
      birds: [1, 2],
      branches: [
        { y: 430, side: -1, len: 168, lift: 30, cap: 1 },
        { y: 510, side: 1, len: 176, lift: 22, cap: 2 }
      ]
    },
    {
      name: '共栖',
      sub: 'SHARE',
      hint: '两只轻鸟可以共栖一枝',
      toast: '细枝能扛两只一两',
      birds: [1, 1, 2],
      branches: [
        { y: 400, side: -1, len: 170, lift: 28, cap: 2 },
        { y: 500, side: 1, len: 178, lift: 18, cap: 2 }
      ]
    },
    {
      name: '三权',
      sub: 'TRIO',
      hint: '三根枝，对上重量',
      toast: '一两、二两、三两各上一枝',
      birds: [1, 2, 3],
      branches: [
        { y: 340, side: -1, len: 150, lift: 34, cap: 1 },
        { y: 430, side: 1, len: 168, lift: 24, cap: 2 },
        { y: 540, side: -1, len: 186, lift: 12, cap: 3 }
      ]
    },
    {
      name: '合重',
      sub: 'SUM',
      hint: '加起来刚好满枝',
      toast: '一两加二两 = 三两',
      birds: [1, 1, 2, 2],
      branches: [
        { y: 410, side: -1, len: 176, lift: 26, cap: 3 },
        { y: 510, side: 1, len: 180, lift: 16, cap: 3 }
      ]
    },
    {
      name: '偏载',
      sub: 'SKEW',
      hint: '中间粗枝能扛四两',
      toast: '重的往粗枝堆',
      birds: [1, 1, 2, 2, 2],
      branches: [
        { y: 350, side: -1, len: 152, lift: 32, cap: 2 },
        { y: 450, side: 1, len: 188, lift: 20, cap: 4 },
        { y: 560, side: -1, len: 164, lift: 14, cap: 2 }
      ]
    },
    {
      name: '巧分',
      sub: 'SPLIT',
      hint: '重的先落，轻的去填缝',
      toast: '三两先找三两枝',
      birds: [1, 1, 1, 2, 2, 3],
      branches: [
        { y: 338, side: -1, len: 156, lift: 34, cap: 3 },
        { y: 430, side: 1, len: 170, lift: 24, cap: 3 },
        { y: 540, side: -1, len: 188, lift: 10, cap: 4 }
      ]
    },
    {
      name: '满锁',
      sub: 'LOCK',
      hint: '满枝会锁死，别急着用一两填满三两枝',
      toast: '锁了就拿不下来',
      birds: [1, 1, 1, 2, 2, 3, 3],
      branches: [
        { y: 318, side: -1, len: 142, lift: 36, cap: 2 },
        { y: 400, side: 1, len: 158, lift: 28, cap: 3 },
        { y: 488, side: -1, len: 170, lift: 18, cap: 3 },
        { y: 580, side: 1, len: 186, lift: 8, cap: 5 }
      ]
    },
    {
      name: '夜分',
      sub: 'NIGHT',
      hint: '四根枝都要刚好，先给三两留位置',
      toast: '两根四两枝别塞错',
      birds: [1, 1, 2, 2, 2, 3, 3],
      branches: [
        { y: 320, side: -1, len: 150, lift: 34, cap: 3 },
        { y: 404, side: 1, len: 160, lift: 26, cap: 3 },
        { y: 492, side: -1, len: 176, lift: 16, cap: 4 },
        { y: 582, side: 1, len: 180, lift: 8, cap: 4 }
      ]
    },
    {
      name: '重客',
      sub: 'HEAVY',
      hint: '最重的鸟只能上最粗的枝',
      toast: '四两鸟去五两枝或刚好的四两枝',
      birds: [1, 1, 1, 2, 2, 2, 3, 4],
      branches: [
        { y: 312, side: -1, len: 140, lift: 36, cap: 2 },
        { y: 398, side: 1, len: 166, lift: 26, cap: 4 },
        { y: 490, side: -1, len: 178, lift: 16, cap: 5 },
        { y: 586, side: 1, len: 184, lift: 6, cap: 5 }
      ]
    },
    {
      name: '栖会',
      sub: 'FEST',
      hint: '终夜 · 枝枝刚好',
      toast: '十夜终栖 · 一枝不折',
      birds: [1, 1, 1, 2, 2, 2, 3, 3, 4],
      branches: [
        { y: 300, side: -1, len: 136, lift: 38, cap: 2 },
        { y: 372, side: 1, len: 150, lift: 30, cap: 3 },
        { y: 450, side: -1, len: 168, lift: 22, cap: 4 },
        { y: 530, side: 1, len: 172, lift: 14, cap: 4 },
        { y: 612, side: -1, len: 192, lift: 6, cap: 6 }
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
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const stageLabel = document.getElementById('stage-label');
  const leftLabel = document.getElementById('left-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let lastOv = 0;
  let last = 0;
  let acc = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: CX, y: 200, id: null };

  const particles = [];
  const motes = [];
  const stars = [];
  const pips = [];
  const rings = [];
  const feathers = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    birds: [],
    branches: [],
    sel: 0,
    selBr: 0,
    held: -1,
    hoverBr: -1,
    hoverBird: -1,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    lock: 0,
    settle: 0,
    toastT: 0,
    why: '',
    taught: false,
    warnTaught: false,
    lockToast: false,
    demo: 0,
    demoA: false,
    demoB: false,
    pulse: 0,
    total: 2,
    perched: 0
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
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function capRgb(cap, locked) {
    if (locked) return [255, 227, 107];
    if (cap <= 2) return [0, 240, 255];
    if (cap <= 4) return [255, 61, 184];
    return [255, 227, 107];
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
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
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
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
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, Math.floor(sr * n)), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 700;
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
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 620);
      this.beep(523, 0.16, 'triangle', 0.03, 784);
    },
    pick() {
      this.ensure();
      this.beep(740, 0.06, 'sine', 0.035, 980);
    },
    chirp() {
      this.ensure();
      this.beep(880, 0.05, 'sine', 0.03, 1320);
      this.beep(1174, 0.07, 'triangle', 0.022, 1560);
    },
    land() {
      this.ensure();
      this.beep(330, 0.07, 'sine', 0.04, 220);
      this.noise(0.05, 0.02, 1800);
    },
    lock() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05, 523);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
    },
    creak() {
      this.ensure();
      this.noise(0.12, 0.03, 500);
      this.beep(140, 0.14, 'sine', 0.03, 90);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.07, 'sine', 0.03, 140);
    },
    snap() {
      this.ensure();
      this.noise(0.22, 0.08, 380);
      this.beep(180, 0.28, 'sawtooth', 0.05, 60);
      this.beep(80, 0.4, 'sine', 0.06, 36);
    },
    stuck() {
      this.ensure();
      this.beep(196, 0.22, 'sine', 0.05, 110);
      this.beep(164, 0.28, 'triangle', 0.03, 90);
    },
    bounce() {
      this.ensure();
      this.beep(280, 0.08, 'triangle', 0.03, 160);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 523);
      this.beep(659, 0.14, 'sine', 0.05, 659);
      this.beep(784, 0.22, 'triangle', 0.05, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.14, 'sine', 0.07);
      this.beep(659, 0.16, 'sine', 0.06);
      this.beep(784, 0.18, 'sine', 0.06);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.45, spec.j * 0.45),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.18),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        cyan: !!spec.cyan,
        g: spec.g == null ? 220 : spec.g
      });
    }
  }

  function emitFeather(x, y, rgb) {
    if (feathers.length > 40) feathers.shift();
    feathers.push({
      x: x,
      y: y,
      vx: rand(-70, 70),
      vy: rand(-90, -10),
      life: rand(0.5, 0.9),
      max: 0.8,
      rot: rand(0, TAU),
      vr: rand(-4, 4),
      rgb: rgb,
      s: rand(3.2, 5.6)
    });
  }

  function addRing(x, y, mag, gold) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag, gold: !!gold });
    if (rings.length > 20) rings.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.65;
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

  function freeCount() {
    let n = 0;
    for (let i = 0; i < G.birds.length; i++) {
      const b = G.birds[i];
      if (b.state !== 'perch') n += 1;
    }
    return n;
  }

  function perchedCount() {
    let n = 0;
    for (let i = 0; i < G.birds.length; i++) {
      if (G.birds[i].state === 'perch') n += 1;
    }
    return n;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const total = G.total || 1;
    const fill = G.mode === 'title' ? perchedCount() : perchedCount();
    const k = clamp(fill / total, 0, 1);
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = fill + '/' + total;
    const hot = G.mode === 'play' && fill >= total && G.why === '';
    fillWrap.classList.toggle('hot', hot);
    fillWrap.classList.toggle('warn', G.mode === 'play' && !!G.why);
    if (G.mode === 'title') {
      stageLabel.textContent = '十夜';
      leftLabel.textContent = '按重量栖';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 夜 · ' + (st ? st.name : '');
      leftLabel.textContent = '未栖 ' + freeCount();
    }
    stageLabel.classList.toggle('hot', hot);
    leftLabel.classList.toggle('warn', G.mode === 'play' && freeCount() > 0 && G.why !== '');
    syncPips();
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
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

  function branchPts(br) {
    const sway = Math.sin(G.clock * 0.62 + br.ph) * (br.locked ? 0.5 : 2.2);
    const ax = CX;
    const ay = br.y;
    let tipx = ax + br.side * br.len + sway;
    let tipy = ay - br.lift + br.sag;
    if (br.snapped) {
      const k = ease(clamp(br.snapT / 0.58, 0, 1));
      const dx = tipx - ax;
      const dy = tipy - ay;
      const rot = br.side * k * 0.95;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      tipx = ax + dx * c - dy * s;
      tipy = ay + dx * s + dy * c;
    }
    return {
      ax: ax,
      ay: ay,
      c1x: ax + (tipx - ax) * 0.4,
      c1y: ay + (tipy - ay) * 0.18 - br.lift * 0.28,
      tx: tipx,
      ty: tipy
    };
  }

  function bez(p, t) {
    const u = 1 - t;
    return {
      x: u * u * p.ax + 2 * u * t * p.c1x + t * t * p.tx,
      y: u * u * p.ay + 2 * u * t * p.c1y + t * t * p.ty
    };
  }

  function bezd(p, t) {
    const u = 1 - t;
    return {
      x: 2 * u * (p.c1x - p.ax) + 2 * t * (p.tx - p.c1x),
      y: 2 * u * (p.c1y - p.ay) + 2 * t * (p.ty - p.c1y)
    };
  }

  function dist2bezier(px, py, br) {
    const p = branchPts(br);
    let best = 1e9;
    let bt = 0;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const q = bez(p, t);
      const d = hypot2(px - q.x, py - q.y);
      if (d < best) {
        best = d;
        bt = t;
      }
    }
    return { d: best, t: bt, p: p };
  }

  function birdsOn(bi) {
    const list = [];
    for (let i = 0; i < G.birds.length; i++) {
      const b = G.birds[i];
      if (b.state === 'perch' && b.branch === bi) list.push(b);
      else if (b.state === 'fly' && b.landKind === 'branch' && b.landBr === bi) list.push(b);
    }
    list.sort(function (a, b) { return a.id - b.id; });
    return list;
  }

  function seatOf(bird, bi) {
    const list = birdsOn(bi);
    let idx = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === bird.id) idx = i;
    }
    const n = Math.max(1, list.length);
    const t = 0.4 + 0.5 * (idx + 0.5) / n;
    const p = branchPts(G.branches[bi]);
    const q = bez(p, t);
    const d = bezd(p, t);
    const len = Math.max(0.001, hypot2(d.x, d.y));
    const nx = -d.y / len;
    const ny = d.x / len;
    const up = ny < 0 ? 1 : -1;
    const off = 10 + bird.w * 1.6;
    return {
      x: q.x + nx * up * off,
      y: q.y + ny * up * off,
      rot: Math.atan2(d.y, d.x) + (G.branches[bi].side > 0 ? 0 : Math.PI),
      face: G.branches[bi].side > 0 ? -1 : 1
    };
  }

  function wireLayout() {
    const ids = [];
    for (let i = 0; i < G.birds.length; i++) {
      const b = G.birds[i];
      if (b.state === 'wire' || (b.state === 'fly' && b.landKind === 'wire')) {
        ids.push(b.id);
      }
    }
    ids.sort(function (a, b) { return a - b; });
    const n = Math.max(1, ids.length);
    const gap = n <= 1 ? 0 : Math.min(48, 380 / Math.max(1, n - 1));
    const span = gap * (n - 1);
    const x0 = CX - span * 0.5;
    const map = {};
    for (let i = 0; i < ids.length; i++) {
      map[ids[i]] = { x: x0 + i * gap, y: WIRE_Y };
    }
    return map;
  }

  function birdRadius(b) {
    return 14 + b.w * 3.2;
  }

  function canPack(items, bins) {
    let s = 0;
    let c = 0;
    for (let i = 0; i < items.length; i++) s += items[i];
    for (let i = 0; i < bins.length; i++) c += bins[i];
    if (s > c) return false;
    if (items.length === 0) return true;
    items = items.slice().sort(function (a, b) { return b - a; });
    bins = bins.slice();
    function rec(i) {
      if (i >= items.length) return true;
      const w = items[i];
      const seen = {};
      for (let b = 0; b < bins.length; b++) {
        if (bins[b] < w) continue;
        if (seen[bins[b]]) continue;
        seen[bins[b]] = 1;
        bins[b] -= w;
        if (rec(i + 1)) return true;
        bins[b] += w;
      }
      return false;
    }
    return rec(0);
  }

  function remainingPackable() {
    const bins = [];
    for (let i = 0; i < G.branches.length; i++) {
      const br = G.branches[i];
      if (!br.snapped && !br.locked) bins.push(br.cap);
    }
    const items = [];
    for (let i = 0; i < G.birds.length; i++) {
      const b = G.birds[i];
      if (b.state === 'fall') continue;
      if (b.branch >= 0 && G.branches[b.branch] && G.branches[b.branch].locked) continue;
      items.push(b.w);
    }
    if (items.length === 0) return true;
    if (bins.length === 0) return false;
    return canPack(items, bins);
  }

  function allPerched() {
    for (let i = 0; i < G.birds.length; i++) {
      if (G.birds[i].state !== 'perch') return false;
    }
    return G.birds.length > 0;
  }

  function allSettled() {
    if (G.held >= 0) return false;
    for (let i = 0; i < G.birds.length; i++) {
      const s = G.birds[i].state;
      if (s === 'fly' || s === 'held') return false;
    }
    return true;
  }

  function movable(b) {
    if (!b) return false;
    if (b.state === 'fall' || b.state === 'fly') return false;
    if (b.state === 'perch') {
      const br = G.branches[b.branch];
      if (!br || br.locked || br.snapped) return false;
    }
    return b.state === 'wire' || b.state === 'perch' || b.state === 'held';
  }

  function movableList() {
    const list = [];
    for (let i = 0; i < G.birds.length; i++) {
      if (movable(G.birds[i])) list.push(G.birds[i]);
    }
    return list;
  }

  function makeBird(id, w, x, y) {
    return {
      id: id,
      w: w,
      state: 'wire',
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      vr: 0,
      rot: 0,
      face: x < CX ? 1 : -1,
      wing: rand(0, TAU),
      bob: rand(0, TAU),
      branch: -1,
      landKind: '',
      landBr: -1,
      fx: x,
      fy: y,
      tx: x,
      ty: y,
      flyT: 1,
      flyDur: 0.3,
      arc: 30,
      fromWire: true
    };
  }

  function makeBranch(spec, i) {
    return {
      y: spec.y,
      side: spec.side,
      len: spec.len,
      lift: spec.lift,
      cap: spec.cap,
      load: 0,
      sag: 0,
      sagT: 0,
      locked: false,
      lockFlash: 0,
      creak: 0,
      snapped: false,
      snapT: 0,
      ph: i * 1.13 + 0.4,
      warn: 0
    };
  }

  function applyStage(st) {
    G.branches = [];
    for (let i = 0; i < st.branches.length; i++) {
      G.branches.push(makeBranch(st.branches[i], i));
    }
    G.birds = [];
    const n = st.birds.length;
    G.total = n;
    const gap = n <= 1 ? 0 : Math.min(48, 380 / Math.max(1, n - 1));
    const span = gap * (n - 1);
    const x0 = CX - span * 0.5;
    for (let i = 0; i < n; i++) {
      G.birds.push(makeBird(i, st.birds[i], x0 + i * gap, WIRE_Y));
    }
    G.sel = 0;
    G.selBr = 0;
    G.held = -1;
    G.hoverBr = -1;
    G.why = '';
    G.settle = 0;
    G.perched = 0;
    G.lockToast = false;
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.16;
    G.taught = G.taught && fromFail;
    G.warnTaught = G.warnTaught && fromFail;
    applyStage(STAGES[i]);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    feathers.length = 0;
    G.lives = LIVES;
    G.taught = false;
    G.warnTaught = false;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    feathers.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.demo = 0;
    G.demoA = false;
    G.demoB = false;
    applyStage(STAGES[0]);
    showOverlay(
      'title',
      '栖枝',
      '按重量把鸟分到树枝。<br />超重会折，满枝会锁。',
      '开栖',
      'PERCH',
      OPS
    );
    setHint('轻鸟上细枝 · 重鸟上粗枝', '');
    syncHud();
  }

  function unseat(bird) {
    if (bird.branch < 0) return;
    const br = G.branches[bird.branch];
    if (br && !br.locked) {
      br.load = Math.max(0, br.load - bird.w);
    }
    bird.branch = -1;
  }

  function flyTo(bird, x, y, kind, br) {
    bird.state = 'fly';
    bird.fx = bird.x;
    bird.fy = bird.y;
    bird.tx = x;
    bird.ty = y;
    bird.flyT = 0;
    const dist = hypot2(x - bird.x, y - bird.y);
    bird.flyDur = 0.22 + dist / 980;
    bird.arc = 22 + dist * 0.07;
    bird.landKind = kind;
    bird.landBr = br == null ? -1 : br;
    bird.fromWire = kind === 'wire';
    bird.face = x >= bird.x ? 1 : -1;
  }

  function returnToWire(bird) {
    unseat(bird);
    bird.fromWire = true;
    const layout = wireLayout();
    let pos = layout[bird.id];
    if (!pos) pos = { x: CX, y: WIRE_Y };
    flyTo(bird, pos.x, pos.y, 'wire', -1);
  }

  function lockBranch(br) {
    if (br.locked) return;
    br.locked = true;
    br.lockFlash = 1;
    G.goldFlash = Math.max(G.goldFlash, 0.4);
    G.pulse = 1;
    const p = branchPts(br);
    addRing(p.tx, p.ty, false, true);
    emit(10, {
      x: p.tx, y: p.ty, j: 12,
      vx0: -40, vx1: 40, vy0: -80, vy1: -10,
      life: 0.5, r0: 1.1, r1: 2.6, gold: true, g: 40
    });
    if (G.mode === 'play') {
      audio.lock();
      if (!G.lockToast) {
        G.lockToast = true;
        toast('满枝 · 锁', false, true);
      }
    }
  }

  function beginSnap(br) {
    if (G.mode !== 'play' || G.why) return;
    G.why = 'snap';
    br.snapped = true;
    br.snapT = 0;
    G.magFlash = 0.8;
    G.shake = 16;
    G.lock = 0.95;
    audio.snap();
    toast('枝折了', true);
    setHint('超重折枝', 'warn');
    const p = branchPts(br);
    addRing((p.ax + p.tx) * 0.5, (p.ay + p.ty) * 0.5, true, false);
    emit(22, {
      x: (p.ax + p.tx) * 0.5, y: (p.ay + p.ty) * 0.5, j: 22,
      vx0: -160, vx1: 160, vy0: -140, vy1: 40,
      life: 0.7, r0: 1.4, r1: 3.8, mag: true, g: 380
    });
    for (let i = 0; i < G.birds.length; i++) {
      const b = G.birds[i];
      const on = (b.state === 'perch' && b.branch === G.branches.indexOf(br))
        || (b.state === 'fly' && b.landKind === 'branch' && G.branches[b.landBr] === br);
      if (!on) continue;
      b.state = 'fall';
      b.branch = -1;
      b.vx = rand(-90, 90);
      b.vy = rand(-50, 30);
      b.vr = rand(-7, 7);
      emitFeather(b.x, b.y, WCOL[b.w]);
      emitFeather(b.x, b.y, WCOL[b.w]);
    }
  }

  function beginStuck() {
    if (G.mode !== 'play' || G.why) return;
    G.why = 'stuck';
    G.lock = 0.9;
    G.magFlash = 0.45;
    audio.stuck();
    toast('栖不下', true);
    setHint('满枝锁死后栖不下了', 'warn');
  }

  function landOn(bird, bi) {
    const br = G.branches[bi];
    if (!br || br.snapped) {
      returnToWire(bird);
      return;
    }
    if (br.locked) {
      if (G.mode === 'play') {
        toast('满枝已锁', true);
        audio.bounce();
      }
      returnToWire(bird);
      return;
    }
    if (br.load + bird.w > br.cap) {
      bird.state = 'perch';
      bird.branch = bi;
      bird.fromWire = false;
      br.load += bird.w;
      if (G.mode === 'play') beginSnap(br);
      else returnToWire(bird);
      return;
    }
    bird.state = 'perch';
    bird.branch = bi;
    bird.fromWire = false;
    br.load += bird.w;
    const seat = seatOf(bird, bi);
    bird.x = seat.x;
    bird.y = seat.y;
    addRing(bird.x, bird.y, false, br.load === br.cap);
    emit(8, {
      x: bird.x, y: bird.y, j: 8,
      vx0: -30, vx1: 30, vy0: -50, vy1: -6,
      life: 0.4, r0: 1, r1: 2.4,
      gold: br.load === br.cap, cyan: br.load !== br.cap, g: 30
    });
    if (G.mode === 'play') audio.land();
    if (br.load === br.cap) lockBranch(br);
    evaluateBoard();
  }

  function evaluateBoard() {
    if (G.mode !== 'play' || G.why) return;
    if (!allSettled()) return;
    if (allPerched()) {
      clearStage();
      return;
    }
    if (!remainingPackable()) beginStuck();
  }

  function finishFly(bird) {
    bird.x = bird.tx;
    bird.y = bird.ty;
    bird.rot = 0;
    bird.flyT = 1;
    if (bird.landKind === 'wire') {
      bird.state = 'wire';
      bird.branch = -1;
      bird.fromWire = true;
      evaluateBoard();
      return;
    }
    if (bird.landKind === 'branch') {
      landOn(bird, bird.landBr);
      return;
    }
    bird.state = 'wire';
  }

  function sendBird(bird, bi) {
    if (!bird || G.why) return;
    if (!movable(bird) && bird.state !== 'held') return;
    if (bi < 0 || bi >= G.branches.length) return;
    const br = G.branches[bi];
    if (br.snapped) return;
    if (bird.state === 'perch' && bird.branch === bi) return;
    if (bird.state === 'held') G.held = -1;
    if (bird.state === 'perch') unseat(bird);
    bird.state = 'fly';
    bird.landKind = 'branch';
    bird.landBr = bi;
    const seat = seatOf(bird, bi);
    flyTo(bird, seat.x, seat.y, 'branch', bi);
    if (G.mode === 'play') audio.chirp();
    if (G.mode === 'play' && !G.warnTaught && br.load + bird.w > br.cap && !br.locked) {
      G.warnTaught = true;
      toast('超重会折', true);
    }
    const rest = movableList();
    if (rest.length) G.sel = rest[0].id;
  }

  function pickup(bird) {
    if (!movable(bird)) return false;
    if (G.held >= 0 && G.held !== bird.id) {
      const prev = G.birds[G.held];
      if (prev && prev.state === 'held') returnToWire(prev);
    }
    const fromBranch = bird.state === 'perch';
    if (fromBranch) unseat(bird);
    bird.state = 'held';
    bird.fromWire = !fromBranch;
    G.held = bird.id;
    G.sel = bird.id;
    audio.pick();
    return true;
  }

  function dropHeld() {
    if (G.held < 0) return;
    const bird = G.birds[G.held];
    if (!bird) {
      G.held = -1;
      return;
    }
    const bi = G.hoverBr;
    G.held = -1;
    if (bi >= 0) sendBird(bird, bi);
    if (bird.state === 'held') returnToWire(bird);
  }

  function cycleBird(dir) {
    const list = movableList();
    if (!list.length) return;
    let idx = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === G.sel) idx = i;
    }
    idx = (idx + dir + list.length) % list.length;
    G.sel = list[idx].id;
    audio.beep(640, 0.04, 'sine', 0.02);
  }

  function cycleBr(dir) {
    if (!G.branches.length) return;
    G.selBr = (G.selBr + dir + G.branches.length) % G.branches.length;
  }

  function selectedMovable() {
    const cur = G.birds[G.sel];
    if (cur && (movable(cur) || cur.state === 'held')) return cur;
    const list = movableList();
    if (!list.length) return null;
    G.sel = list[0].id;
    return list[0];
  }

  function sendSelected() {
    const bird = selectedMovable();
    if (!bird) return;
    sendBird(bird, G.selBr);
  }

  function recallSelected() {
    const bird = G.birds[G.sel];
    if (!bird || !movable(bird)) return;
    if (bird.state === 'perch') {
      unseat(bird);
      returnToWire(bird);
      audio.pick();
    } else if (bird.state === 'held') {
      G.held = -1;
      returnToWire(bird);
    }
  }

  function hitBird(x, y) {
    let best = 36;
    let id = -1;
    for (let i = G.birds.length - 1; i >= 0; i--) {
      const b = G.birds[i];
      if (!movable(b)) continue;
      const r = birdRadius(b) + 6;
      const d = hypot2(b.x - x, b.y - y);
      if (d < r && d < best) {
        best = d;
        id = b.id;
      }
    }
    return id;
  }

  function nearestBranch(x, y) {
    let best = 42;
    let idx = -1;
    for (let i = 0; i < G.branches.length; i++) {
      const br = G.branches[i];
      if (br.snapped) continue;
      const hit = dist2bezier(x, y, br);
      if (hit.t > 0.16 && hit.d < best) {
        best = hit.d;
        idx = i;
      }
    }
    return idx;
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    if (why === 'snap') {
      showOverlay(
        'lose',
        '枝折了',
        more
          ? '这根枝扛不住这么重。超重就会折。<br />还剩 ' + G.lives + ' 次。'
          : '这根枝扛不住这么重。十夜未完。',
        more ? '再试本夜' : '再来一局',
        'SNAP'
      );
    } else {
      showOverlay(
        'lose',
        '栖不下',
        more
          ? '剩下的鸟没有能落的枝了。满枝会锁，先想好再放。<br />还剩 ' + G.lives + ' 次。'
          : '剩下的鸟没有能落的枝了。十夜未完。',
        more ? '再试本夜' : '再来一局',
        'STUCK'
      );
    }
    setHint(why === 'snap' ? '枝折了' : '栖不下', 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.95;
    G.goldFlash = 0.85;
    G.pulse = 1;
    audio.clear();
    toast(STAGES[G.stage].name + ' · 满栖', false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '夜栖成',
        '十夜的鸟都按重量落了枝，一枝不折。',
        '再栖一巡',
        'ROOST'
      );
      setHint('十夜栖成', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 1.05;
    setHint('满栖', 'hot');
  }

  function overlayAction() {
    const n = performance.now();
    if (n - lastOv < 280) return;
    lastOv = n;
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      if (G.lives > 0) startStage(G.stage, true);
      else startRun();
    }
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function resize() {
    const stage = document.getElementById('stage');
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function seedDecor() {
    motes.length = 0;
    stars.length = 0;
    for (let i = 0; i < 38; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(40, VH - 80),
        r: rand(0.7, 1.8),
        a: rand(0.06, 0.2),
        p: rand(0, TAU),
        s: rand(6, 16)
      });
    }
    for (let i = 0; i < 52; i++) {
      stars.push({
        x: rand(10, VW - 10),
        y: rand(8, 430),
        r: rand(0.4, 1.5),
        a: rand(0.22, 0.85),
        p: rand(0, TAU),
        tw: rand(1.1, 3.2)
      });
    }
  }

  function playing() {
    return G.mode === 'play';
  }

  function updateBirds(dt) {
    const layout = wireLayout();
    for (let i = 0; i < G.birds.length; i++) {
      const b = G.birds[i];
      const flap = b.state === 'fly' || b.state === 'held' || b.state === 'fall' ? 14 : 5.5;
      b.wing += dt * flap;
      if (b.state === 'wire') {
        const slot = layout[b.id] || { x: b.x, y: WIRE_Y };
        b.x = lerp(b.x, slot.x, 1 - Math.exp(-8 * dt));
        b.y = slot.y + Math.sin(G.clock * 2.4 + b.bob) * 2.4;
        b.rot = lerp(b.rot, 0, 1 - Math.exp(-10 * dt));
        b.face = b.x < CX ? 1 : -1;
        if (G.sel === b.id && playing()) b.y -= 5;
      } else if (b.state === 'held') {
        const tx = pointer.x;
        const ty = pointer.y - 8;
        b.x = lerp(b.x, tx, 1 - Math.exp(-18 * dt));
        b.y = lerp(b.y, ty, 1 - Math.exp(-18 * dt));
        b.rot = lerp(b.rot, 0, 1 - Math.exp(-8 * dt));
        b.face = b.x < CX ? 1 : -1;
      } else if (b.state === 'fly') {
        b.flyT += dt / Math.max(0.08, b.flyDur);
        const t = ease(b.flyT);
        b.x = lerp(b.fx, b.tx, t);
        b.y = lerp(b.fy, b.ty, t) - Math.sin(t * Math.PI) * b.arc;
        b.face = b.tx >= b.fx ? 1 : -1;
        const ang = Math.atan2(b.ty - b.fy - Math.cos(t * Math.PI) * b.arc, b.tx - b.fx);
        b.rot = ang * 0.28;
        if (b.flyT >= 1) finishFly(b);
      } else if (b.state === 'perch') {
        const seat = seatOf(b, b.branch);
        b.x = lerp(b.x, seat.x, 1 - Math.exp(-12 * dt));
        b.y = lerp(b.y, seat.y + Math.sin(G.clock * 2.1 + b.bob) * 1.1, 1 - Math.exp(-10 * dt));
        let rot = seat.rot;
        while (rot > Math.PI) rot -= TAU;
        while (rot < -Math.PI) rot += TAU;
        if (Math.abs(rot) > 0.7) rot = 0;
        b.rot = lerp(b.rot, rot * 0.35, 1 - Math.exp(-8 * dt));
        b.face = seat.face;
      } else if (b.state === 'fall') {
        b.vy += 980 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.vr * dt;
        b.vx *= Math.exp(-dt * 0.4);
        if (b.y > GROUND + 40 && Math.random() < dt * 8) {
          emitFeather(b.x, GROUND - 6, WCOL[b.w]);
        }
      }
    }
  }

  function updateBranches(dt) {
    for (let i = 0; i < G.branches.length; i++) {
      const br = G.branches[i];
      const ratio = br.load / Math.max(1, br.cap);
      br.sagT = ratio * (14 + br.cap * 3.4) + (br.snapped ? 26 : 0);
      br.sag = lerp(br.sag, br.sagT, 1 - Math.exp(-7 * dt));
      br.lockFlash = Math.max(0, br.lockFlash - dt * 1.6);
      if (br.snapped) br.snapT += dt;
      if (playing() && !br.locked && !br.snapped && ratio >= 0.74 && br.load < br.cap) {
        br.creak += dt;
        if (br.creak > 1.7) {
          br.creak = 0;
          audio.creak();
        }
      }
      if (G.hoverBr === i && G.held >= 0) {
        const bird = G.birds[G.held];
        br.warn = bird && br.load + bird.w > br.cap && !br.locked ? 1 : 0;
      } else {
        br.warn = Math.max(0, br.warn - dt * 4);
      }
    }
  }

  function updateTitle(dt) {
    G.demo += dt;
    if (G.demo > 5.4) {
      applyStage(STAGES[0]);
      G.demo = 0;
      G.demoA = false;
      G.demoB = false;
      return;
    }
    if (!G.demoA && G.demo > 0.7) {
      G.demoA = true;
      const b = G.birds[0];
      if (b && b.state === 'wire') sendBird(b, 0);
    }
    if (!G.demoB && G.demo > 1.85) {
      G.demoB = true;
      const b = G.birds[1];
      if (b && b.state === 'wire') sendBird(b, 1);
    }
  }

  function updatePlay(dt) {
    if (G.why === 'snap' || G.why === 'stuck') {
      if (G.lock <= 0) failStage(G.why);
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.pulse = Math.max(0, G.pulse - dt * 1.4);
    G.lock = Math.max(0, G.lock - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.55) rings.splice(i, 1);
    }
    for (let i = feathers.length - 1; i >= 0; i--) {
      const f = feathers[i];
      f.life -= dt;
      f.vy += 240 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      f.vx *= 0.97;
      if (f.life <= 0) feathers.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      if (G.settle <= 0) startStage(G.stage + 1, false);
    }
    updateBranches(dt);
    updateBirds(dt);
    if (playing() && G.held >= 0) {
      G.hoverBr = nearestBranch(G.birds[G.held].x, G.birds[G.held].y + 10);
    } else if (playing()) {
      G.hoverBird = hitBird(pointer.x, pointer.y);
    }
    updateFx(dt);
    syncHud();
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(80), sy(30), 8, sx(80), sy(30), 280 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.16)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(70), 8, sx(400), sy(70), 250 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    ctx.fillStyle = '#070414';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    vg.addColorStop(0, 'rgba(16, 10, 40, 0.85)');
    vg.addColorStop(0.42, 'rgba(8, 6, 20, 0.15)');
    vg.addColorStop(1, 'rgba(6, 12, 22, 0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + 0.45 * Math.sin(G.clock * s.tw + s.p));
      ctx.fillStyle = 'rgba(220, 240, 255,' + a + ')';
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    const mx = sx(402);
    const my = sy(72);
    const mr = 22 * scale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.09)';
    ctx.beginPath();
    ctx.arc(mx, my, mr * 1.8, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#c8fff8';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#070414';
    ctx.beginPath();
    ctx.arc(mx + mr * 0.42, my - mr * 0.18, mr * 0.84, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0.55, 2.4);
    ctx.stroke();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 12);
      const y = sy((m.y + G.clock * m.s * 2.2) % (VH - 40));
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 61, 184,' + m.a + ')' : 'rgba(180, 240, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGround() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    const y = sy(GROUND - 18);
    const g = ctx.createLinearGradient(sx(0), y, sx(0), sy(VH));
    g.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
    g.addColorStop(0.12, '#10081a');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(GROUND - 8));
    ctx.quadraticCurveTo(sx(120), sy(GROUND - 28), sx(240), sy(GROUND - 10));
    ctx.quadraticCurveTo(sx(360), sy(GROUND - 30), sx(VW), sy(GROUND - 8));
    ctx.lineTo(sx(VW), sy(VH));
    ctx.lineTo(sx(0), sy(VH));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.22)';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(18), sy(GROUND - 6));
    ctx.quadraticCurveTo(sx(240), sy(GROUND - 22), sx(VW - 18), sy(GROUND - 6));
    ctx.stroke();
    ctx.restore();
  }

  function drawTrunk() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(sx(233), sy(TRUNK_TOP));
    ctx.bezierCurveTo(sx(226), sy(360), sx(236), sy(540), sx(220), sy(GROUND));
    ctx.lineTo(sx(260), sy(GROUND));
    ctx.bezierCurveTo(sx(250), sy(540), sx(254), sy(360), sx(247), sy(TRUNK_TOP));
    ctx.closePath();
    const g = ctx.createLinearGradient(sx(220), sy(TRUNK_TOP), sx(260), sy(GROUND));
    g.addColorStop(0, '#1c1230');
    g.addColorStop(0.45, '#140a1e');
    g.addColorStop(1, '#0c0814');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.38)';
    ctx.lineWidth = 1.7 * scale;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(240), sy(TRUNK_TOP + 8));
    ctx.bezierCurveTo(sx(234), sy(380), sx(246), sy(560), sx(236), sy(GROUND - 12));
    ctx.stroke();

    ctx.fillStyle = '#160c24';
    ctx.beginPath();
    ctx.moveTo(sx(232), sy(TRUNK_TOP - 2));
    ctx.quadraticCurveTo(sx(240), sy(TRUNK_TOP - 16), sx(248), sy(TRUNK_TOP - 2));
    ctx.quadraticCurveTo(sx(240), sy(TRUNK_TOP + 6), sx(232), sy(TRUNK_TOP - 2));
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.restore();
  }

  function drawWire() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    const y = sy(WIRE_Y + 10);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(36), y);
    ctx.lineTo(sx(VW - 36), y);
    ctx.stroke();
    ctx.strokeStyle = '#161026';
    ctx.lineWidth = 3.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(36), y);
    ctx.lineTo(sx(VW - 36), y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(36), y - 1.6 * scale);
    ctx.lineTo(sx(VW - 36), y - 1.6 * scale);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(sx(36), y, 4 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 61, 184, 0.8)';
    ctx.beginPath();
    ctx.arc(sx(VW - 36), y, 4 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBranch(br, i) {
    const p = branchPts(br);
    const rgb = capRgb(br.cap, br.locked);
    const thick = (3.4 + br.cap * 1.05) * scale;
    const sel = playing() && G.selBr === i;
    const hover = playing() && G.hoverBr === i;
    const warn = br.warn > 0.2 || (hover && G.held >= 0 && G.birds[G.held] && !br.locked && br.load + G.birds[G.held].w > br.cap);
    const col = warn ? [255, 61, 184] : rgb;

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = rgba(col, 0.14 + (sel || hover ? 0.12 : 0) + br.lockFlash * 0.2);
    ctx.lineWidth = thick + 10 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(p.ax), sy(p.ay));
    ctx.quadraticCurveTo(sx(p.c1x), sy(p.c1y), sx(p.tx), sy(p.ty));
    ctx.stroke();

    ctx.strokeStyle = '#140a1c';
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.moveTo(sx(p.ax), sy(p.ay));
    ctx.quadraticCurveTo(sx(p.c1x), sy(p.c1y), sx(p.tx), sy(p.ty));
    ctx.stroke();

    ctx.strokeStyle = rgba(col, 0.82 + br.lockFlash * 0.18);
    ctx.lineWidth = Math.max(1.4, thick * 0.38);
    ctx.beginPath();
    ctx.moveTo(sx(p.ax), sy(p.ay));
    ctx.quadraticCurveTo(sx(p.c1x), sy(p.c1y), sx(p.tx), sy(p.ty));
    ctx.stroke();

    for (let k = 0; k < 5 + br.cap; k++) {
      const t = 0.28 + k * 0.1;
      if (t > 0.92) break;
      const q = bez(p, t);
      const d = bezd(p, t);
      const len = Math.max(0.001, hypot2(d.x, d.y));
      const nx = -d.y / len;
      const ny = d.x / len;
      const L = 7 + (k % 3) * 2.4;
      const side = k % 2 === 0 ? 1 : -1;
      ctx.strokeStyle = rgba(col, 0.28);
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(q.x), sy(q.y));
      ctx.lineTo(sx(q.x + nx * side * L), sy(q.y + ny * side * L - 2));
      ctx.stroke();
    }

    if (br.snapped) {
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      const mid = bez(p, 0.55);
      ctx.moveTo(sx(mid.x - 8), sy(mid.y - 6));
      ctx.lineTo(sx(mid.x + 2), sy(mid.y + 2));
      ctx.lineTo(sx(mid.x - 4), sy(mid.y + 8));
      ctx.stroke();
    }

    const tagX = sx(p.tx + br.side * 10);
    const tagY = sy(p.ty - 16);
    ctx.fillStyle = warn ? 'rgba(40, 8, 20, 0.82)' : 'rgba(8, 6, 18, 0.78)';
    ctx.strokeStyle = rgba(col, sel || hover ? 0.95 : 0.55);
    ctx.lineWidth = 1.2 * scale;
    roundRect(ctx, tagX - 18 * scale, tagY - 11 * scale, 36 * scale, 20 * scale, 8 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = rgba(col, 1);
    ctx.font = '700 ' + Math.max(10, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(br.load + '/' + br.cap, tagX, tagY);

    const nx = sx(lerp(p.ax, p.c1x, 0.35) + br.side * 14);
    const ny = sy(lerp(p.ay, p.c1y, 0.35) - 12);
    ctx.beginPath();
    ctx.arc(nx, ny, 8 * scale, 0, TAU);
    ctx.fillStyle = sel ? rgba(col, 0.95) : 'rgba(8, 6, 18, 0.7)';
    ctx.fill();
    ctx.strokeStyle = rgba(col, 0.8);
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();
    ctx.fillStyle = sel ? '#05030c' : rgba(col, 0.95);
    ctx.font = '700 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", sans-serif';
    ctx.fillText(String(i + 1), nx, ny + 0.5 * scale);

    if (br.locked) {
      ctx.strokeStyle = 'rgba(255, 227, 107, 0.55)';
      ctx.lineWidth = 1.2 * scale;
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.beginPath();
      ctx.arc(sx(p.tx), sy(p.ty), (12 + Math.sin(G.clock * 4) * 1.5) * scale, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawBird(b) {
    const col = WCOL[b.w] || WCOL[1];
    const sc = 0.62 + b.w * 0.2;
    const x = sx(b.x);
    const y = sy(b.y);
    const flap = Math.sin(b.wing) * (b.state === 'fly' || b.state === 'held' || b.state === 'fall' ? 0.85 : 0.22);
    const sel = playing() && G.sel === b.id && b.state !== 'fall';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.rot);
    ctx.scale(b.face * sc * scale, sc * scale);

    if (sel || b.state === 'held') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(col, 0.7);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 13, 0, 0, TAU);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(col, 0.16);
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 11, 0, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = rgba(col, 0.88);
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-18, -6 - flap * 2, -22, -2);
    ctx.quadraticCurveTo(-16, 1, -12, 3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 1, 9.6, 6.7, -0.18, 0, TAU);
    ctx.fillStyle = '#12081c';
    ctx.fill();
    ctx.strokeStyle = rgba(col, 0.95);
    ctx.lineWidth = 1.35;
    ctx.stroke();

    ctx.save();
    ctx.translate(-1, -1);
    ctx.rotate(-0.32 - flap);
    ctx.beginPath();
    ctx.ellipse(2, 0, 8.2, 3.5, 0.12, 0, TAU);
    ctx.fillStyle = rgba(col, 0.5);
    ctx.fill();
    ctx.strokeStyle = rgba(col, 0.9);
    ctx.lineWidth = 1.05;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(8.1, -3.3, 4.5, 0, TAU);
    ctx.fillStyle = '#160a22';
    ctx.fill();
    ctx.strokeStyle = rgba(col, 0.95);
    ctx.lineWidth = 1.25;
    ctx.stroke();

    if (b.w >= 3) {
      ctx.fillStyle = rgba(col, 0.9);
      ctx.beginPath();
      ctx.moveTo(7.2, -7.4);
      ctx.lineTo(8.6, -11.2);
      ctx.lineTo(9.8, -7.2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(12.3, -3.3);
    ctx.lineTo(16.6, -2.2);
    ctx.lineTo(12.3, -1.1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(9.3, -3.7, 1.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(9.55, -3.7, 0.55, 0, TAU);
    ctx.fill();

    ctx.restore();

    const pipY = sy(b.y + 14 + b.w);
    const pipX = sx(b.x);
    for (let k = 0; k < b.w; k++) {
      const px = pipX + (k - (b.w - 1) * 0.5) * 5.2 * scale;
      ctx.fillStyle = rgba(col, 0.9);
      ctx.beginPath();
      ctx.arc(px, pipY, 1.55 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawGhostSeat() {
    if (!playing() || G.held < 0 || G.hoverBr < 0) return;
    const bird = G.birds[G.held];
    const br = G.branches[G.hoverBr];
    if (!bird || !br || br.snapped) return;
    const seat = seatOf(bird, G.hoverBr);
    const ok = !br.locked && br.load + bird.w <= br.cap;
    const rgb = ok ? (br.load + bird.w === br.cap ? [255, 227, 107] : [0, 240, 255]) : [255, 61, 184];
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = rgba(rgb, 0.9);
    ctx.setLineDash([5 * scale, 4 * scale]);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(bird.x), sy(bird.y));
    ctx.quadraticCurveTo(sx((bird.x + seat.x) * 0.5), sy(Math.min(bird.y, seat.y) - 36), sx(seat.x), sy(seat.y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(sx(seat.x), sy(seat.y), 10 * scale, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawFx() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.55;
      ctx.strokeStyle = r.gold
        ? 'rgba(255, 227, 107,' + (0.55 * (1 - k)) + ')'
        : r.mag
          ? 'rgba(255, 61, 184,' + (0.55 * (1 - k)) + ')'
          : 'rgba(0, 240, 255,' + (0.5 * (1 - k)) + ')';
      ctx.lineWidth = (1.4 + k * 2) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 28) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.gold
        ? 'rgba(255, 227, 107,' + a + ')'
        : p.mag
          ? 'rgba(255, 61, 184,' + a + ')'
          : 'rgba(0, 240, 255,' + a + ')';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < feathers.length; i++) {
      const f = feathers[i];
      const a = clamp(f.life / f.max, 0, 1);
      ctx.save();
      ctx.translate(sx(f.x), sy(f.y));
      ctx.rotate(f.rot);
      ctx.fillStyle = rgba(f.rgb, 0.75 * a);
      ctx.beginPath();
      ctx.ellipse(0, 0, f.s * scale, f.s * 0.35 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawFlashes() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (0.12 * G.magFlash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (0.1 * G.goldFlash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.shake > 0.4) {
      ctx.fillStyle = 'rgba(5, 3, 12,' + (0.04 * (G.shake / 16)) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawLetterbox() {
    ctx.fillStyle = '#05030c';
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
  }

  function draw() {
    const shx = G.shake > 0 ? rand(-G.shake, G.shake) * scale * 0.35 : 0;
    const shy = G.shake > 0 ? rand(-G.shake, G.shake) * scale * 0.35 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    drawGround();
    drawTrunk();
    const order = [];
    for (let i = 0; i < G.branches.length; i++) order.push(i);
    order.sort(function (a, b) { return G.branches[a].y - G.branches[b].y; });
    for (let i = 0; i < order.length; i++) drawBranch(G.branches[order[i]], order[i]);
    drawWire();
    drawGhostSeat();

    const perched = [];
    const air = [];
    for (let i = 0; i < G.birds.length; i++) {
      if (G.birds[i].state === 'perch') perched.push(G.birds[i]);
      else air.push(G.birds[i]);
    }
    perched.sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < perched.length; i++) drawBird(perched[i]);
    air.sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < air.length; i++) drawBird(air[i]);

    drawFx();
    drawFlashes();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawLetterbox();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      if (down) {
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    }
    if (k === 'r' || k === 'R') {
      if (down) {
        audio.ensure();
        startRun();
      }
      return;
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) {
        e.preventDefault();
        if (playing()) cycleBird(-1);
      }
      return;
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) {
        e.preventDefault();
        if (playing()) cycleBird(1);
      }
      return;
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) {
        e.preventDefault();
        if (playing()) cycleBr(-1);
      }
      return;
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) {
        e.preventDefault();
        if (playing()) cycleBr(1);
      }
      return;
    }
    if (!down) return;
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      if (G.mode === 'title' || G.mode === 'fail' || G.mode === 'win') overlayAction();
      else if (playing()) sendSelected();
      return;
    }
    if (k === 'x' || k === 'X' || k === 'Backspace') {
      e.preventDefault();
      if (playing()) recallSelected();
      return;
    }
    if (k >= '1' && k <= '9') {
      const n = k.charCodeAt(0) - 49;
      if (playing()) {
        e.preventDefault();
        G.selBr = clamp(n, 0, G.branches.length - 1);
        sendSelected();
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (!playing()) return;
    e.preventDefault();
    audio.ensure();
    const p = pointerWorld(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.hover = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    canvas.classList.add('grabbing');
    const id = hitBird(p.x, p.y);
    if (id >= 0) {
      G.sel = id;
      pickup(G.birds[id]);
      return;
    }
    const bi = nearestBranch(p.x, p.y);
    if (bi >= 0) {
      G.selBr = bi;
      G.hoverBr = bi;
      const bird = G.birds[G.sel];
      if (bird && movable(bird)) sendBird(bird, bi);
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (pointer.down && pointer.id != null && e.pointerId !== pointer.id) return;
    const p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
    if (e.pointerType === 'mouse') pointer.hover = true;
    if (playing() && G.held < 0) {
      G.hoverBird = hitBird(p.x, p.y);
      G.hoverBr = nearestBranch(p.x, p.y);
    }
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    if (playing() && G.held >= 0) dropHeld();
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('grabbing');
    if (e.pointerType !== 'mouse') pointer.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') pointer.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    if (playing() && G.held >= 0) dropHeld();
  });

  ovBtn.addEventListener('click', function () {
    ovBtn.blur();
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

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  seedDecor();
  resize();
  bootTitle();
  syncHud();

  last = performance.now();
  acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
