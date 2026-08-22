'use strict';

(function () {
  const VW = 480;
  const VH = 800;
  const CX = 240;
  const CY = 412;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const R0 = 15.4;
  const BOWL = 860;
  const DRAG = 5.6;
  const VALLEY = 0.7;
  const TILT_FOLLOW = 9.4;
  const MUTE_KEY = 'playbox-dew-collect-mute';
  const OPS = 'WASD / 方向键倾斜 · 按住拖到低处 · M 静音';

  const STAGES = [
    {
      name: '初露', sub: 'FIRST',
      hint: '把发亮的低处挪到两珠中间，碰上就会合成',
      toast: '低处在亮 · 珠会滚过去',
      leaf: { kind: 'oval', rx: 198, ry: 236 },
      drops: [{ x: 186, y: 392 }, { x: 292, y: 428 }]
    },
    {
      name: '三珠', sub: 'TRIO',
      hint: '三颗都要滚到同一处，轻倾，别甩出叶面',
      toast: '一次聚三颗',
      leaf: { kind: 'oval', rx: 190, ry: 228 },
      drops: [{ x: 240, y: 318 }, { x: 164, y: 468 }, { x: 316, y: 468 }]
    },
    {
      name: '四隅', sub: 'CORNERS',
      hint: '先聚近的两颗，再去对面。一次倾太狠会全掉',
      toast: '四角的露，慢慢收',
      leaf: { kind: 'oval', rx: 186, ry: 222 },
      drops: [
        { x: 142, y: 312 }, { x: 338, y: 312 },
        { x: 142, y: 518 }, { x: 338, y: 518 }
      ]
    },
    {
      name: '细叶', sub: 'NARROW',
      hint: '叶子窄了。低处贴边珠就会掉，收手要快',
      toast: '叶边很近',
      leaf: { kind: 'oval', rx: 142, ry: 196 },
      drops: [
        { x: 176, y: 340 }, { x: 304, y: 340 },
        { x: 168, y: 490 }, { x: 312, y: 492 }
      ]
    },
    {
      name: '刺缘', sub: 'THORN',
      hint: '粉刺会把珠刺破。低处别放到刺上',
      toast: '右边有干刺',
      leaf: { kind: 'oval', rx: 178, ry: 218 },
      drops: [
        { x: 150, y: 340 }, { x: 198, y: 396 },
        { x: 146, y: 470 }, { x: 210, y: 522 }
      ],
      thorns: [
        { x: 328, y: 338, r: 12 },
        { x: 352, y: 412, r: 13 },
        { x: 326, y: 492, r: 12 }
      ]
    },
    {
      name: '中脉', sub: 'VEIN',
      hint: '叶脉挡住了。先合成一边，再从头顶绕过去',
      toast: '绕过叶脉',
      leaf: { kind: 'oval', rx: 186, ry: 230 },
      drops: [
        { x: 158, y: 360 }, { x: 168, y: 470 },
        { x: 322, y: 360 }, { x: 314, y: 470 }
      ],
      walls: [{ x1: 240, y1: 318, x2: 240, y2: 546, t: 13 }]
    },
    {
      name: '夜风', sub: 'WIND',
      hint: '横风在推珠。把低处放在上风，让它们顶风会合',
      toast: '风往右吹',
      leaf: { kind: 'oval', rx: 176, ry: 214 },
      wind: { ax: 168, ay: 0, osc: 54, period: 2.7, ph: 0 },
      drops: [
        { x: 156, y: 348 }, { x: 240, y: 318 },
        { x: 324, y: 352 }, { x: 240, y: 508 }
      ]
    },
    {
      name: '双叶', sub: 'TWIN',
      hint: '两片叶中间细。过腰要慢，不然会从缝里掉',
      toast: '过腰轻一点',
      leaf: { kind: 'twin', rx: 126, ry: 172, sep: 98 },
      drops: [
        { x: 142, y: 360 }, { x: 148, y: 460 },
        { x: 332, y: 360 }, { x: 338, y: 460 }
      ]
    },
    {
      name: '游刺', sub: 'DRIFT',
      hint: '刺在游。看空档再把低处挪过去',
      toast: '刺会让路',
      leaf: { kind: 'oval', rx: 170, ry: 208 },
      drops: [
        { x: 150, y: 330 }, { x: 330, y: 332 },
        { x: 240, y: 300 }, { x: 158, y: 510 }, { x: 322, y: 508 }
      ],
      thorns: [
        { x: 352, y: 410, r: 12, move: { amp: 0, ampY: 48, spd: 1.02, ph: 0.6 } },
        { x: 128, y: 458, r: 11, move: { amp: 0, ampY: 40, spd: 0.9, ph: 1.4 } }
      ]
    },
    {
      name: '合珠', sub: 'PEARL',
      hint: '合成一颗大珠。风、刺、细边都在，低处要短挪',
      toast: '最后一叶',
      leaf: { kind: 'oval', rx: 138, ry: 184 },
      wind: { ax: 110, ay: 18, osc: 70, period: 2.2, ph: 0.4 },
      drops: [
        { x: 168, y: 328 }, { x: 240, y: 300 }, { x: 312, y: 330 },
        { x: 154, y: 412 }, { x: 326, y: 414 },
        { x: 176, y: 508 }, { x: 304, y: 510 }
      ],
      thorns: [
        { x: 240, y: 262, r: 10, move: { amp: 52, ampY: 4, spd: 1.12, ph: 0.3 } },
        { x: 146, y: 492, r: 11 },
        { x: 334, y: 492, r: 11 }
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, x: CX, y: CY, id: null };
  const particles = [];
  const motes = [];
  const rings = [];
  const pips = [];
  const streaks = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    tx: 0,
    ty: 0,
    targetTx: 0,
    targetTy: 0,
    valley: { x: CX, y: CY },
    leaf: { kind: 'oval', cx: CX, cy: CY, rx: 198, ry: 236, sep: 0 },
    drops: [],
    walls: [],
    thorns: [],
    wind: null,
    totalVol: 2,
    startCount: 2,
    lock: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    settle: 0,
    why: '',
    spec: STAGES[0],
    demoWait: 0,
    rollT: 0,
    taught: false,
    nearEdge: false
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
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function radiusOf(vol) {
    return R0 * Math.cbrt(Math.max(0.2, vol));
  }

  function metrics() {
    const L = G.leaf;
    if (L.kind === 'twin') {
      return { cx: L.cx, cy: L.cy, rx: L.rx + L.sep, ry: L.ry };
    }
    return { cx: L.cx, cy: L.cy, rx: L.rx, ry: L.ry };
  }

  function inOval(x, y, cx, cy, rx, ry) {
    if (rx <= 1 || ry <= 1) return false;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }

  function onLeaf(x, y, r) {
    const L = G.leaf;
    const pad = r * 0.22;
    if (L.kind === 'twin') {
      return inOval(x, y, L.cx - L.sep, L.cy, L.rx - pad, L.ry - pad)
        || inOval(x, y, L.cx + L.sep, L.cy, L.rx - pad, L.ry - pad);
    }
    return inOval(x, y, L.cx, L.cy, L.rx - pad, L.ry - pad);
  }

  function leafDepth(x, y) {
    const L = G.leaf;
    if (L.kind === 'twin') {
      const a = ovalK(x, y, L.cx - L.sep, L.cy, L.rx, L.ry);
      const b = ovalK(x, y, L.cx + L.sep, L.cy, L.rx, L.ry);
      return Math.min(a, b);
    }
    return ovalK(x, y, L.cx, L.cy, L.rx, L.ry);
  }

  function ovalK(x, y, cx, cy, rx, ry) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function currentR(d) {
    if (d.growT > 0) {
      const k = 1 - d.growT / 0.18;
      return lerp(d.growFrom, d.r, clamp(k, 0, 1));
    }
    return d.r;
  }

  function liveDrops() {
    const out = [];
    for (let i = 0; i < G.drops.length; i++) {
      if (G.drops[i].alive && !G.drops[i].doom) out.push(G.drops[i]);
    }
    return out;
  }

  function biggestVol() {
    let m = 0;
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      if (d.alive && !d.doom && d.vol > m) m = d.vol;
    }
    return m;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
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
      f.Q.value = 0.85;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    roll: function (k) {
      if (G.rollT > 0) return;
      G.rollT = 0.09;
      this.ensure();
      this.noise(0.07, 0.012 + k * 0.02, 280, 140);
    },
    merge: function (vol) {
      this.ensure();
      const f = 420 + vol * 70;
      this.beep(f, 0.12, 'sine', 0.07, f * 1.7);
      this.beep(f * 1.5, 0.18, 'triangle', 0.04, f * 2.1);
      this.noise(0.08, 0.035, 900, 1600);
    },
    pop: function () {
      this.ensure();
      this.noise(0.16, 0.08, 900, 180);
      this.beep(240, 0.22, 'sawtooth', 0.05, 70);
    },
    fall: function () {
      this.ensure();
      this.beep(280, 0.16, 'sine', 0.05, 90);
      this.noise(0.14, 0.05, 500, 120);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 523);
      this.beep(659, 0.14, 'sine', 0.055, 659);
      this.beep(784, 0.22, 'triangle', 0.05, 1046);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.14, 'sine', 0.07);
      this.beep(659, 0.16, 'sine', 0.06);
      this.beep(784, 0.18, 'sine', 0.06);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    },
    lose: function () {
      this.ensure();
      this.beep(196, 0.42, 'sawtooth', 0.07, 55);
      this.beep(90, 0.6, 'sine', 0.045, 40);
    },
    start: function () {
      this.ensure();
      this.beep(330, 0.12, 'sine', 0.05, 660);
      this.beep(494, 0.16, 'triangle', 0.035, 880);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 150) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.5, spec.j * 0.5),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || 'c',
        g: spec.g == null ? 380 : spec.g
      });
    }
  }

  function addRing(x, y, col) {
    rings.push({ x: x, y: y, t: 0, col: col || 'c' });
    if (rings.length > 16) rings.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.65;
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
    const live = liveDrops();
    const big = biggestVol();
    const k = G.totalVol ? clamp(big / G.totalVol, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = Math.round(k * 100) + '%';
    const one = live.length === 1 && k > 0.98;
    const warn = G.nearEdge && G.mode === 'play';
    fillWrap.classList.toggle('hot', one || G.mode === 'win' || G.mode === 'clear');
    fillWrap.classList.toggle('warn', warn && !one);

    const st = STAGES[G.stage];
    if (G.mode === 'title') {
      stageLabel.textContent = '十叶';
      leftLabel.textContent = '合成一颗';
      leftLabel.className = '';
      stageLabel.classList.remove('hot');
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 叶 · ' + (st ? st.name : '');
      leftLabel.textContent = '珠 ' + live.length;
      leftLabel.classList.toggle('hot', one);
      leftLabel.classList.toggle('warn', !!G.why);
      stageLabel.classList.toggle('hot', G.mode === 'clear' || G.mode === 'win');
    }
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

  function makeLeaf(spec) {
    const src = spec.leaf;
    return {
      kind: src.kind || 'oval',
      cx: CX,
      cy: CY,
      rx: src.rx,
      ry: src.ry,
      sep: src.sep || 0
    };
  }

  function makeDrops(spec) {
    const out = [];
    for (let i = 0; i < spec.drops.length; i++) {
      const p = spec.drops[i];
      const vol = p.vol || 1;
      out.push({
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        vol: vol,
        r: radiusOf(vol),
        alive: true,
        doom: '',
        doomT: 0,
        growT: 0,
        growFrom: radiusOf(vol),
        spin: rand(0, TAU),
        squish: 1
      });
    }
    return out;
  }

  function copyThorns(spec) {
    const src = spec.thorns || [];
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const t = src[i];
      out.push({
        x: t.x,
        y: t.y,
        r: t.r,
        move: t.move ? {
          amp: t.move.amp || 0,
          ampY: t.move.ampY || 0,
          spd: t.move.spd || 1,
          ph: t.move.ph || 0
        } : null
      });
    }
    return out;
  }

  function copyWalls(spec) {
    const src = spec.walls || [];
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const w = src[i];
      out.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, t: w.t });
    }
    return out;
  }

  function spawnStage(spec) {
    G.spec = spec;
    G.leaf = makeLeaf(spec);
    G.drops = makeDrops(spec);
    G.walls = copyWalls(spec);
    G.thorns = copyThorns(spec);
    G.wind = spec.wind || null;
    G.totalVol = 0;
    for (let i = 0; i < G.drops.length; i++) G.totalVol += G.drops[i].vol;
    G.startCount = G.drops.length;
    G.why = '';
    G.settle = 0;
    G.nearEdge = false;
    G.tx = 0;
    G.ty = 0;
    G.targetTx = 0;
    G.targetTy = 0;
    G.valley.x = G.leaf.cx;
    G.valley.y = G.leaf.cy;
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.1;
    G.why = '';
    G.taught = G.taught && fromFail;
    spawnStage(STAGES[i]);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.taught = false;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.demoWait = 0;
    spawnStage(STAGES[0]);
    showOverlay(
      'title',
      '采露',
      '倾斜叶片，把发亮的低处挪到露珠中间。<br />碰上就会合成一颗。别滚出叶面。',
      '开滚',
      'DEW',
      OPS
    );
    setHint('把低处挪到珠中间 · 碰上就合成', '');
    syncHud();
  }

  function overlayAction() {
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

  function thornPos(th) {
    if (!th.move) return { x: th.x, y: th.y };
    return {
      x: th.x + Math.sin(G.clock * th.move.spd + th.move.ph) * th.move.amp,
      y: th.y + Math.cos(G.clock * th.move.spd * 0.73 + th.move.ph) * th.move.ampY
    };
  }

  function windForce() {
    const w = G.wind;
    if (!w) return { x: 0, y: 0 };
    const s = Math.sin(G.clock * TAU / Math.max(0.4, w.period) + (w.ph || 0));
    return { x: (w.ax || 0) + s * (w.osc || 0), y: (w.ay || 0) };
  }

  function closestOnSeg(x, y, w) {
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((x - w.x1) * dx + (y - w.y1) * dy) / len2;
    t = clamp(t, 0, 1);
    return { x: w.x1 + dx * t, y: w.y1 + dy * t };
  }

  function collideWalls(d) {
    const r = currentR(d);
    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      const p = closestOnSeg(d.x, d.y, w);
      const dx = d.x - p.x;
      const dy = d.y - p.y;
      const dist = hypot(dx, dy) || 0.0001;
      const need = r + w.t * 0.5;
      if (dist < need) {
        const nx = dx / dist;
        const ny = dy / dist;
        const pen = need - dist;
        d.x += nx * pen;
        d.y += ny * pen;
        const vn = d.vx * nx + d.vy * ny;
        if (vn < 0) {
          d.vx -= nx * vn * 1.45;
          d.vy -= ny * vn * 1.45;
        }
      }
    }
  }

  function beginDoom(d, kind) {
    if (d.doom || !d.alive) return;
    d.doom = kind;
    d.doomT = 0;
    if (G.mode !== 'play') return;
    G.why = kind;
    G.lock = 0.72;
    G.shake = kind === 'pop' ? 16 : 11;
    if (kind === 'pop') {
      G.magFlash = 0.7;
      audio.pop();
      toast('刺破了', true);
      setHint('干刺会破珠', 'warn');
      emit(18, {
        x: d.x, y: d.y, j: 10,
        vx0: -140, vx1: 140, vy0: -160, vy1: 40,
        life: 0.55, r0: 1.4, r1: 3.6, col: 'm', g: 240
      });
    } else {
      G.magFlash = 0.45;
      audio.fall();
      toast('滚下去了', true);
      setHint('珠滚出了叶面', 'warn');
      emit(12, {
        x: d.x, y: d.y, j: 8,
        vx0: -80, vx1: 80, vy0: -40, vy1: 90,
        life: 0.5, r0: 1.2, r1: 3.2, col: 'c', g: 520
      });
    }
    addRing(d.x, d.y, 'm');
  }

  function collideThorns(d) {
    if (d.doom) return;
    const r = currentR(d);
    for (let i = 0; i < G.thorns.length; i++) {
      const p = thornPos(G.thorns[i]);
      const need = r + G.thorns[i].r * 0.72;
      if (hypot(d.x - p.x, d.y - p.y) < need) {
        beginDoom(d, 'pop');
        return;
      }
    }
  }

  function mergePair(a, b) {
    const vol = a.vol + b.vol;
    const mx = (a.x * a.vol + b.x * b.vol) / vol;
    const my = (a.y * a.vol + b.y * b.vol) / vol;
    const vx = (a.vx * a.vol + b.vx * b.vol) / vol;
    const vy = (a.vy * a.vol + b.vy * b.vol) / vol;
    const oldR = Math.max(a.r, b.r);
    a.vol = vol;
    a.growFrom = oldR;
    a.growT = 0.18;
    a.r = radiusOf(vol);
    a.x = mx;
    a.y = my;
    a.vx = vx * 0.86;
    a.vy = vy * 0.86;
    b.alive = false;
    if (G.mode === 'play') {
      audio.merge(vol);
      const gold = vol >= G.totalVol - 0.01;
      emit(gold ? 16 : 10, {
        x: mx, y: my, j: 8,
        vx0: -90, vx1: 90, vy0: -110, vy1: -10,
        life: 0.48, r0: 1.2, r1: 3.2,
        col: gold ? 'g' : 'c', g: 220
      });
      addRing(mx, my, gold ? 'g' : 'c');
      if (gold) {
        G.goldFlash = 0.55;
        toast('合成一颗', false, true);
      } else if (G.startCount >= 3 && liveDrops().length === G.startCount - 1 && !G.taught) {
        G.taught = true;
        toast('接着聚');
      }
    }
  }

  function mergePass() {
    const ds = G.drops;
    for (let i = 0; i < ds.length; i++) {
      const a = ds[i];
      if (!a.alive || a.doom) continue;
      for (let j = i + 1; j < ds.length; j++) {
        const b = ds[j];
        if (!b.alive || b.doom) continue;
        const ra = currentR(a);
        const rb = currentR(b);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = hypot(dx, dy);
        if (dist < ra + rb - 1.4) {
          mergePair(a, b);
        }
      }
    }
  }

  function updateTilt(dt) {
    const m = metrics();
    let ax = 0;
    let ay = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay -= 1;
    if (keys.d) ay += 1;
    const playing = G.mode === 'play' || G.mode === 'title';
    if (playing && pointer.down && G.mode === 'play') {
      G.targetTx = clamp((pointer.x - m.cx) / (m.rx * VALLEY), -1, 1);
      G.targetTy = clamp((pointer.y - m.cy) / (m.ry * VALLEY), -1, 1);
    } else if (playing && G.mode === 'play') {
      const len = hypot(ax, ay);
      if (len > 1) {
        ax /= len;
        ay /= len;
      }
      G.targetTx = ax;
      G.targetTy = ay;
    }
    const k = 1 - Math.exp(-TILT_FOLLOW * dt);
    G.tx = lerp(G.tx, G.targetTx, k);
    G.ty = lerp(G.ty, G.targetTy, k);
    G.valley.x = m.cx + G.tx * m.rx * VALLEY;
    G.valley.y = m.cy + G.ty * m.ry * VALLEY;
  }

  function stepDrop(d, dt, wind) {
    if (!d.alive) return;
    if (d.growT > 0) d.growT = Math.max(0, d.growT - dt);
    d.spin += dt * (0.6 + hypot(d.vx, d.vy) * 0.01);

    if (d.doom) {
      d.doomT += dt;
      if (d.doom === 'fall') {
        d.vy += 920 * dt;
        d.vx *= Math.exp(-dt * 1.2);
        d.x += d.vx * dt;
        d.y += d.vy * dt;
      } else {
        d.vx *= Math.exp(-dt * 6);
        d.vy *= Math.exp(-dt * 6);
      }
      return;
    }

    const inert = 0.78 + 0.22 * d.vol;
    const m = metrics();
    const fx = -BOWL * (d.x - G.valley.x) / m.rx;
    const fy = -BOWL * (d.y - G.valley.y) / m.ry;
    d.vx += (fx / inert + wind.x / inert) * dt;
    d.vy += (fy / inert + wind.y / inert) * dt;
    d.vx *= Math.exp(-DRAG * dt);
    d.vy *= Math.exp(-DRAG * dt);
    const sp = hypot(d.vx, d.vy);
    const maxs = 390;
    if (sp > maxs) {
      d.vx *= maxs / sp;
      d.vy *= maxs / sp;
    }
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    collideWalls(d);
    collideThorns(d);
    if (!d.doom && !onLeaf(d.x, d.y, currentR(d))) {
      beginDoom(d, 'fall');
    }
    const sq = 1 - clamp(sp / 520, 0, 0.2);
    d.squish = lerp(d.squish, sq, 1 - Math.exp(-12 * dt));
  }

  function stepPhysics(dt) {
    updateTilt(dt);
    const wind = windForce();
    const playing = G.mode === 'play' || G.mode === 'title' || G.mode === 'clear';
    if (playing) {
      for (let i = 0; i < G.drops.length; i++) stepDrop(G.drops[i], dt, wind);
      if (G.mode !== 'clear') mergePass();
    }

    let maxSp = 0;
    let near = false;
    const live = liveDrops();
    for (let i = 0; i < live.length; i++) {
      const d = live[i];
      const sp = hypot(d.vx, d.vy);
      if (sp > maxSp) maxSp = sp;
      if (leafDepth(d.x, d.y) > 0.78) near = true;
    }
    G.nearEdge = near && G.mode === 'play';
    if (G.mode === 'play' && maxSp > 40) audio.roll(clamp(maxSp / 280, 0, 1));
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    audio.lose();
    if (why === 'pop') {
      showOverlay(
        'lose',
        '刺破',
        more
          ? '干刺会把露珠刺破。低处别放到刺上。<br />还剩 ' + G.lives + ' 次。'
          : '干刺破了珠。十叶未完。',
        more ? '再试本叶' : '再来一局',
        'THORN'
      );
    } else {
      showOverlay(
        'lose',
        '滚落',
        more
          ? '珠滚出了叶面。低处贴边就会掉。<br />还剩 ' + G.lives + ' 次。'
          : '珠滚出了叶面。十叶未完。',
        more ? '再试本叶' : '再来一局',
        'SPILL'
      );
    }
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.9;
    G.goldFlash = 0.85;
    audio.clear();
    toast('合成了', false, true);
    const live = liveDrops();
    const d = live[0];
    if (d) {
      emit(18, {
        x: d.x, y: d.y, j: 14,
        vx0: -70, vx1: 70, vy0: -90, vy1: -8,
        life: 0.7, r0: 1.3, r1: 3.4, col: 'g', g: 180
      });
    }
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '采满',
        '十叶露珠，合成一颗。',
        '再采一巡',
        'PEARL'
      );
      setHint('十叶合成', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 0.95;
    setHint('合成一颗', 'hot');
  }

  function updateTitle(dt) {
    const live = liveDrops();
    if (live.length <= 1) {
      G.demoWait += dt;
      if (G.demoWait > 1.25) {
        spawnStage(STAGES[0]);
        G.demoWait = 0;
      } else {
        G.targetTx = 0;
        G.targetTy = 0;
      }
    } else {
      G.demoWait = 0;
      let mx = 0;
      let my = 0;
      for (let i = 0; i < live.length; i++) {
        mx += live[i].x;
        my += live[i].y;
      }
      mx /= live.length;
      my /= live.length;
      const m = metrics();
      G.targetTx = clamp((mx - m.cx) / (m.rx * VALLEY), -1, 1);
      G.targetTy = clamp((my - m.cy) / (m.ry * VALLEY), -1, 1);
    }
    stepPhysics(dt);
  }

  function updatePlay(dt) {
    if (G.lock <= 0 || G.why) stepPhysics(dt);
    else {
      updateTilt(dt);
      const wind = windForce();
      for (let i = 0; i < G.drops.length; i++) {
        if (G.drops[i].doom) stepDrop(G.drops[i], dt, wind);
      }
    }

    if (G.why && G.lock <= 0) {
      failStage(G.why);
      return;
    }
    if (G.why) return;

    const live = liveDrops();
    if (live.length <= 1 && biggestVol() >= G.totalVol - 0.01) {
      G.settle += dt;
      if (G.settle > 0.42) clearStage();
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.rollT = Math.max(0, G.rollT - dt);
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
    if (G.wind && (G.mode === 'play' || G.mode === 'title') && Math.random() < dt * 14) {
      const L = G.leaf;
      streaks.push({
        x: L.cx - L.rx * 0.9,
        y: rand(L.cy - L.ry * 0.7, L.cy + L.ry * 0.7),
        vx: 90 + rand(40, 120),
        life: rand(0.5, 0.9),
        max: 0.8
      });
      if (streaks.length > 18) streaks.shift();
    }
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      if (s.life <= 0) streaks.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      G.targetTx = 0;
      G.targetTy = 0;
      stepPhysics(dt);
      if (G.settle <= 0) startStage(G.stage + 1, false);
    } else {
      updateTilt(dt);
      const wind = windForce();
      for (let i = 0; i < G.drops.length; i++) {
        if (G.drops[i].doom) stepDrop(G.drops[i], dt, wind);
      }
    }
    updateFx(dt);
    syncHud();
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(20, VH - 20),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.18),
        p: rand(0, TAU),
        s: rand(4, 16)
      });
    }
  }

  function leafPath(c) {
    const L = G.leaf;
    c.beginPath();
    if (L.kind === 'twin') {
      c.ellipse(sx(L.cx - L.sep), sy(L.cy), L.rx * scale, L.ry * scale, 0, 0, TAU);
      c.ellipse(sx(L.cx + L.sep), sy(L.cy), L.rx * scale, L.ry * scale, 0, 0, TAU);
    } else {
      c.ellipse(sx(L.cx), sy(L.cy), L.rx * scale, L.ry * scale, 0, 0, TAU);
    }
  }

  function withTilt(fn) {
    const k = 0.16;
    ctx.save();
    ctx.translate(sx(CX), sy(CY));
    ctx.transform(
      1,
      G.ty * k * 0.32,
      G.tx * k * 0.32,
      1 - Math.abs(G.ty) * 0.055,
      0,
      0
    );
    ctx.translate(-sx(CX), -sy(CY));
    fn();
    ctx.restore();
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(86), sy(48), 8, sx(86), sy(48), 300 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.15)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(70), 8, sx(400), sy(70), 280 * scale);
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
    vg.addColorStop(0, 'rgba(10, 8, 28, 0.9)');
    vg.addColorStop(0.5, 'rgba(6, 10, 22, 0.2)');
    vg.addColorStop(1, 'rgba(4, 14, 22, 0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const mx = sx(392);
    const my = sy(92);
    const mr = 26 * scale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const mg = ctx.createRadialGradient(mx, my, 2, mx, my, mr * 2.4);
    mg.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
    mg.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#d7fbff';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#070414';
    ctx.beginPath();
    ctx.arc(mx + mr * 0.42, my - mr * 0.18, mr * 0.86, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.stroke();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 8);
      const y = sy((m.y + G.clock * m.s * 0.35) % VH);
      ctx.fillStyle = 'rgba(190, 236, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLeafBody() {
    const L = G.leaf;
    ctx.save();
    leafPath(ctx);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.translate(4 * scale, 10 * scale);
    ctx.fill();
    ctx.restore();

    leafPath(ctx);
    const lg = ctx.createRadialGradient(
      sx(L.cx + G.tx * 18),
      sy(L.cy + G.ty * 18),
      10 * scale,
      sx(L.cx),
      sy(L.cy),
      Math.max(L.rx, L.ry) * 1.05 * scale
    );
    lg.addColorStop(0, '#163044');
    lg.addColorStop(0.45, '#0c1c2a');
    lg.addColorStop(1, '#071018');
    ctx.fillStyle = lg;
    ctx.fill();

    ctx.save();
    leafPath(ctx);
    ctx.clip();
    const vg = ctx.createRadialGradient(
      sx(G.valley.x),
      sy(G.valley.y),
      6 * scale,
      sx(G.valley.x),
      sy(G.valley.y),
      92 * scale
    );
    vg.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    vg.addColorStop(0.45, 'rgba(0, 240, 255, 0.05)');
    vg.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
    ctx.lineWidth = 1.15 * scale;
    ctx.lineCap = 'round';
    const baseX = L.cx;
    const baseY = L.cy + (L.kind === 'twin' ? L.ry * 0.15 : L.ry * 0.46);
    const lobes = L.kind === 'twin' ? [-1, 1] : [0];
    for (let li = 0; li < lobes.length; li++) {
      const oxL = lobes[li] * (L.sep || 0);
      const bx = baseX + oxL * 0.15;
      const by = L.kind === 'twin' ? L.cy + L.ry * 0.55 : baseY;
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.82 + i * (Math.PI * 1.64 / 6);
        const rx = (L.kind === 'twin' ? L.rx : L.rx) * 0.8;
        const ry = L.ry * 0.78;
        const tx = (L.kind === 'twin' ? L.cx + oxL : L.cx) + Math.cos(a) * rx;
        const ty = L.cy + Math.sin(a) * ry;
        ctx.beginPath();
        ctx.moveTo(sx(bx), sy(by));
        ctx.quadraticCurveTo(
          sx((bx + tx) * 0.5 + Math.sin(a) * 12),
          sy((by + ty) * 0.5),
          sx(tx),
          sy(ty)
        );
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    leafPath(ctx);
    ctx.strokeStyle = G.nearEdge
      ? 'rgba(255, 61, 184, 0.85)'
      : 'rgba(0, 240, 255, 0.72)';
    ctx.lineWidth = 2.2 * scale;
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 6 * scale;
    leafPath(ctx);
    ctx.stroke();

    const stemX = L.cx;
    const stemY = L.cy + (L.kind === 'twin' ? L.ry + 8 : L.ry);
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.55)';
    ctx.lineWidth = 3.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(stemX), sy(stemY - 6));
    ctx.quadraticCurveTo(sx(stemX + 8), sy(stemY + 28), sx(stemX - 4), sy(stemY + 54));
    ctx.stroke();
  }

  function drawValley() {
    const x = sx(G.valley.x);
    const y = sy(G.valley.y);
    ctx.save();
    leafPath(ctx);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.55 + Math.sin(G.clock * 3.2) * 0.2;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.16 * pulse * (1 - i * 0.25)) + ')';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(x, y, (10 + i * 11 + pulse * 3) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 227, 107,' + (0.55 + pulse * 0.25) + ')';
    ctx.beginPath();
    ctx.arc(x, y, 3.1 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawWalls() {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      ctx.strokeStyle = 'rgba(8, 20, 32, 0.95)';
      ctx.lineWidth = (w.t + 4) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(w.x1), sy(w.y1));
      ctx.lineTo(sx(w.x2), sy(w.y2));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.55)';
      ctx.lineWidth = (w.t * 0.45) * scale;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(w.x1 + 3), sy(w.y1));
      ctx.lineTo(sx(w.x2 + 3), sy(w.y2));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawThorns() {
    for (let i = 0; i < G.thorns.length; i++) {
      const th = G.thorns[i];
      const p = thornPos(th);
      const x = sx(p.x);
      const y = sy(p.y);
      const r = th.r * scale;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(CY - p.y, CX - p.x) + Math.PI);
      ctx.fillStyle = '#2a0818';
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0);
      ctx.lineTo(-r * 0.7, r * 0.72);
      ctx.lineTo(-r * 0.7, -r * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.9)';
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 61, 184, 0.55)';
      ctx.beginPath();
      ctx.moveTo(r * 1.15, 0);
      ctx.lineTo(-r * 0.2, r * 0.28);
      ctx.lineTo(-r * 0.2, -r * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, (th.r + 5) * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawStreaks() {
    if (!streaks.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = 1.2 * scale;
    ctx.lineCap = 'round';
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      const a = clamp(s.life / 0.8, 0, 1);
      ctx.globalAlpha = a * 0.7;
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(s.y));
      ctx.lineTo(sx(s.x + 28), sy(s.y + 3));
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawDrop(d) {
    if (!d.alive && !d.doom) return;
    const r = currentR(d);
    const fade = d.doom === 'pop'
      ? clamp(1 - d.doomT / 0.35, 0, 1)
      : d.doom === 'fall'
        ? clamp(1 - d.doomT / 0.7, 0, 1)
        : 1;
    if (fade <= 0.02) return;
    const x = sx(d.x);
    const y = sy(d.y + (d.doom === 'fall' ? d.doomT * d.doomT * 80 : 0));
    const k = clamp((d.vol - 1) / 6, 0, 1);
    const ang = Math.atan2(d.vy, d.vx);
    const sq = d.squish;
    const rs = r * scale * (d.doom === 'pop' ? (1 + d.doomT * 1.8) : 1);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x, y);
    if (!d.doom) {
      ctx.rotate(ang);
      ctx.scale(1 + (1 - sq) * 0.55, sq);
      ctx.rotate(-ang);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, rs * 0.58, rs * 0.82, rs * 0.26, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = k > 0.5
      ? 'rgba(255, 227, 107, 0.16)'
      : 'rgba(0, 240, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, rs * 1.22, 0, TAU);
    ctx.fill();
    ctx.restore();

    const g = ctx.createRadialGradient(-rs * 0.3, -rs * 0.36, rs * 0.08, 0, rs * 0.12, rs);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    g.addColorStop(0.22, k > 0.48 ? 'rgba(255, 227, 107, 0.92)' : 'rgba(170, 255, 255, 0.9)');
    g.addColorStop(0.55, k > 0.48 ? 'rgba(255, 61, 184, 0.78)' : 'rgba(0, 196, 220, 0.88)');
    g.addColorStop(1, 'rgba(10, 8, 28, 0.92)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rs, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = k > 0.5
      ? 'rgba(255, 227, 107, 0.9)'
      : 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(-rs * 0.32, -rs * 0.38, rs * 0.22, rs * 0.13, -0.5, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(rs * 0.22, rs * 0.18, rs * 0.16, rs * 0.09, 0.4, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.col === 'g' ? '#ffe36b' : p.col === 'm' ? '#ff3db8' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.55;
      ctx.strokeStyle = r.col === 'g'
        ? 'rgba(255, 227, 107,' + (0.5 * (1 - k)) + ')'
        : r.col === 'm'
          ? 'rgba(255, 61, 184,' + (0.48 * (1 - k)) + ')'
          : 'rgba(0, 240, 255,' + (0.42 * (1 - k)) + ')';
      ctx.lineWidth = 1.7 * scale * (1 - k * 0.35);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 32) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawCompass() {
    const x = sx(VW * 0.5);
    const y = sy(VH - 42);
    const R = 22 * scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - R * 0.72, y);
    ctx.lineTo(x + R * 0.72, y);
    ctx.moveTo(x, y - R * 0.72);
    ctx.lineTo(x, y + R * 0.72);
    ctx.stroke();
    const px = x + G.tx * R * 0.72;
    const py = y + G.ty * R * 0.72;
    ctx.fillStyle = '#ffe36b';
    ctx.shadowColor = 'rgba(255, 227, 107, 0.7)';
    ctx.shadowBlur = 8 * scale;
    ctx.beginPath();
    ctx.arc(px, py, 3.4 * scale, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(139, 144, 184, 0.75)';
    ctx.font = '600 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('倾', x, y + R + 11 * scale);
    ctx.restore();
  }

  function drawFlash() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.2) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.1) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.32 : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.32 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    withTilt(function () {
      drawLeafBody();
      drawValley();
      drawWalls();
      drawThorns();
      drawStreaks();
      for (let i = 0; i < G.drops.length; i++) drawDrop(G.drops[i]);
      drawParticles();
    });
    drawCompass();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawFlash();
    ctx.restore();
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

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar')) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      if (!overlay.classList.contains('hidden')) {
        e.preventDefault();
        overlayAction();
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    pointer.down = true;
    pointer.id = e.pointerId;
    const p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
    canvas.classList.add('drag');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('drag');
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
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

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);

  seedMotes();
  resize();
  bootTitle();
  syncHud();

  let last = performance.now();
  let acc = 0;
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
