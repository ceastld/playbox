'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-map-tear-mute';
  const MAP = { x: 36, y: 50, w: 408, h: 600, r: 16 };

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };
  const PAPER = { r: 32, g: 18, b: 44 };
  const UNDER = { r: 8, g: 5, b: 16 };

  const STAGES = [
    {
      name: '直撕',
      sub: 'LINE',
      hint: '捏住金页签，沿线撕到青灯',
      toast: '从金签拖到青灯',
      time: 24,
      tol: 34,
      fail: 46,
      smooth: false,
      path: [[0.10, 0.50], [0.90, 0.50]],
      decoys: [],
      seals: []
    },
    {
      name: '微弯',
      sub: 'ARC',
      hint: '线会慢慢弯，指尖贴着针脚走',
      toast: '跟着弯走，别抄直线',
      time: 22,
      tol: 30,
      fail: 42,
      smooth: true,
      path: [[0.12, 0.78], [0.30, 0.64], [0.50, 0.42], [0.70, 0.26], [0.90, 0.20]],
      decoys: [],
      seals: []
    },
    {
      name: '折角',
      sub: 'CORNER',
      hint: '到拐角停稳，再转过去',
      toast: '直角处转，别斜着撕',
      time: 22,
      tol: 28,
      fail: 40,
      smooth: false,
      path: [[0.16, 0.16], [0.16, 0.80], [0.86, 0.80]],
      decoys: [],
      seals: []
    },
    {
      name: '蛇行',
      sub: 'SNAKE',
      hint: '跟着 S 走，抄近路会撕裂',
      toast: '贴着弯，不要抄近',
      time: 24,
      tol: 26,
      fail: 36,
      smooth: true,
      path: [[0.14, 0.16], [0.72, 0.20], [0.80, 0.36], [0.26, 0.50], [0.20, 0.66], [0.82, 0.84]],
      decoys: [],
      seals: []
    },
    {
      name: '旧痕',
      sub: 'FAKE',
      hint: '只撕带金针脚的那条。灰线是旧痕',
      toast: '灰虚线是旧痕，别跟',
      time: 24,
      tol: 24,
      fail: 34,
      smooth: true,
      path: [[0.12, 0.26], [0.38, 0.40], [0.62, 0.58], [0.88, 0.74]],
      decoys: [
        [[0.12, 0.26], [0.50, 0.24], [0.88, 0.22]],
        [[0.12, 0.78], [0.88, 0.78]]
      ],
      seals: []
    },
    {
      name: '发夹',
      sub: 'PIN',
      hint: '急弯处慢一点，别撕飞',
      toast: '顶上那弯要慢',
      time: 24,
      tol: 22,
      fail: 32,
      smooth: true,
      path: [[0.18, 0.86], [0.18, 0.22], [0.50, 0.12], [0.82, 0.22], [0.82, 0.86]],
      decoys: [],
      seals: []
    },
    {
      name: '封蜡',
      sub: 'WAX',
      hint: '粉圈是蜡印，撕到就会裂',
      toast: '绕开粉圈，别抄近道',
      time: 24,
      tol: 22,
      fail: 32,
      smooth: true,
      path: [[0.10, 0.50], [0.28, 0.50], [0.42, 0.78], [0.58, 0.78], [0.72, 0.50], [0.90, 0.50]],
      decoys: [],
      seals: [{ x: 0.50, y: 0.40, r: 0.085 }]
    },
    {
      name: '岔口',
      sub: 'FORK',
      hint: '分叉走金针脚，别跟灰线',
      toast: '岔口跟金线往上',
      time: 24,
      tol: 20,
      fail: 30,
      smooth: true,
      path: [[0.12, 0.50], [0.40, 0.50], [0.58, 0.26], [0.86, 0.16]],
      decoys: [
        [[0.12, 0.50], [0.40, 0.50], [0.58, 0.74], [0.86, 0.86]]
      ],
      seals: []
    },
    {
      name: '密针',
      sub: 'TIGHT',
      hint: '针脚更密，撕口更窄',
      toast: '折返要贴线',
      time: 26,
      tol: 16,
      fail: 24,
      smooth: false,
      path: [[0.14, 0.14], [0.84, 0.20], [0.16, 0.34], [0.84, 0.48], [0.16, 0.62], [0.84, 0.76], [0.50, 0.88]],
      decoys: [],
      seals: []
    },
    {
      name: '藏路',
      sub: 'VEIL',
      hint: '绕开蜡印，只跟金针脚',
      toast: '金线绕行，灰线别碰',
      time: 30,
      tol: 15,
      fail: 22,
      smooth: true,
      path: [
        [0.14, 0.14], [0.14, 0.38], [0.38, 0.46], [0.40, 0.20],
        [0.70, 0.16], [0.80, 0.38], [0.54, 0.52], [0.54, 0.72],
        [0.82, 0.78], [0.86, 0.90]
      ],
      decoys: [
        [[0.14, 0.14], [0.55, 0.12], [0.88, 0.14]],
        [[0.14, 0.38], [0.16, 0.88], [0.50, 0.90]]
      ],
      seals: [
        { x: 0.28, y: 0.62, r: 0.07 },
        { x: 0.70, y: 0.62, r: 0.07 }
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
  const btnTear = document.getElementById('btn-tear');
  const stageLabel = document.getElementById('stage-label');
  const timeLabel = document.getElementById('time-label');
  const tearLabel = document.getElementById('tear-label');
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

  const particles = [];
  const motes = [];
  const fibers = [];
  const pips = [];

  const ptr = {
    down: false,
    id: null,
    x: VW * 0.5,
    y: VH * 0.5
  };

  const keys = { l: false, r: false, u: false, d: false, tear: false };

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 24,
    timeMax: 24,
    tornU: 0,
    peel: 0,
    strain: 0,
    hx: 80,
    hy: 360,
    tearing: false,
    pts: [],
    cum: [],
    len: 1,
    decoys: [],
    seals: [],
    lock: 0,
    settle: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    rustleT: 0,
    warnCd: 0,
    grabDeny: 0,
    walk: 0,
    why: '',
    taughtGrab: false,
    taughtOff: false,
    demo: 0,
    pulse: 0,
    tabGlow: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
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
  function hash(n) {
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function rngFn(seed) {
    let s = seed % 2147483646;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  function mx(u) {
    return MAP.x + u * MAP.w;
  }
  function my(v) {
    return MAP.y + v * MAP.h;
  }

  function prefixLen(pts) {
    const c = [0];
    let s = 0;
    for (let i = 1; i < pts.length; i++) {
      s += hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      c.push(s);
    }
    return c;
  }

  function catmull(pts, per) {
    if (pts.length < 2) return pts.slice();
    const p = pts.slice();
    p.unshift(p[0]);
    p.push(p[p.length - 1]);
    const out = [];
    const segs = p.length - 3;
    for (let s = 0; s < segs; s++) {
      const p0 = p[s];
      const p1 = p[s + 1];
      const p2 = p[s + 2];
      const p3 = p[s + 3];
      for (let i = 0; i < per; i++) {
        const t = i / per;
        const t2 = t * t;
        const t3 = t2 * t;
        out.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    out.push(p[p.length - 2]);
    return out;
  }

  function alongRaw(pts, cum, total, u) {
    const target = clamp(u, 0, 1) * total;
    for (let i = 1; i < cum.length; i++) {
      if (cum[i] >= target) {
        const span = cum[i] - cum[i - 1];
        const t = span < 1e-6 ? 0 : (target - cum[i - 1]) / span;
        return {
          x: lerp(pts[i - 1].x, pts[i].x, t),
          y: lerp(pts[i - 1].y, pts[i].y, t)
        };
      }
    }
    const last = pts[pts.length - 1];
    return { x: last.x, y: last.y };
  }

  function densify(src, smooth, spacing) {
    spacing = spacing || 9;
    const raw = smooth && src.length >= 3 ? catmull(src, 14) : src.slice();
    const cum = prefixLen(raw);
    const total = cum[cum.length - 1] || 1;
    const n = Math.max(2, Math.round(total / spacing));
    const out = [];
    for (let i = 0; i <= n; i++) out.push(alongRaw(raw, cum, total, i / n));
    return out;
  }

  function worldPath(arr, smooth) {
    const src = [];
    for (let i = 0; i < arr.length; i++) src.push({ x: mx(arr[i][0]), y: my(arr[i][1]) });
    return densify(src, smooth, 8);
  }

  function makeTrack(arr, smooth) {
    const pts = worldPath(arr, smooth);
    const cum = prefixLen(pts);
    const len = cum[cum.length - 1] || 1;
    return { pts: pts, cum: cum, len: len };
  }

  function pointOn(track, u) {
    return alongRaw(track.pts, track.cum, track.len, u);
  }

  function tanOn(track, u) {
    const a = pointOn(track, clamp(u - 0.012, 0, 1));
    const b = pointOn(track, clamp(u + 0.012, 0, 1));
    const d = hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
  }

  function nearestOn(track, x, y) {
    const pts = track.pts;
    const cum = track.cum;
    let bestD = 1e9;
    let bestU = 0;
    let bestX = pts[0].x;
    let bestY = pts[0].y;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1].x;
      const ay = pts[i - 1].y;
      const dx = pts[i].x - ax;
      const dy = pts[i].y - ay;
      const d2 = dx * dx + dy * dy;
      let t = d2 < 1e-8 ? 0 : ((x - ax) * dx + (y - ay) * dy) / d2;
      t = clamp(t, 0, 1);
      const px = ax + dx * t;
      const py = ay + dy * t;
      const d = hypot(x - px, y - py);
      if (d < bestD) {
        bestD = d;
        bestU = (cum[i - 1] + t * (cum[i] - cum[i - 1])) / track.len;
        bestX = px;
        bestY = py;
      }
    }
    return { dist: bestD, u: bestU, x: bestX, y: bestY };
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
        this.master.gain.value = this.muted ? 0 : 0.26;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.26;
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
      const n = Math.min(0.28, Math.max(0.03, dur));
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 1200;
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
    grab: function () {
      this.ensure();
      this.beep(620, 0.06, 'triangle', 0.04, 880);
    },
    rustle: function () {
      this.ensure();
      this.noise(0.045, 0.042, 1600);
      this.beep(1400 + Math.random() * 700, 0.03, 'triangle', 0.018, 700);
    },
    deny: function () {
      this.ensure();
      this.beep(180, 0.07, 'square', 0.03, 90);
    },
    warn: function () {
      this.ensure();
      this.beep(740, 0.08, 'square', 0.035, 220);
    },
    rip: function () {
      this.ensure();
      this.noise(0.34, 0.13, 400);
      this.beep(240, 0.28, 'sawtooth', 0.07, 50);
      this.beep(90, 0.36, 'sine', 0.06, 32);
    },
    open: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05, 784);
    },
    good: function () {
      this.ensure();
      this.beep(659, 0.1, 'sine', 0.05);
      this.beep(880, 0.16, 'triangle', 0.05, 1320);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.18, 'sine', 0.055);
      this.beep(1046, 0.34, 'triangle', 0.07, 1560);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
    },
    tick: function () {
      this.ensure();
      this.beep(196, 0.05, 'sine', 0.022, 90);
    },
    wax: function () {
      this.ensure();
      this.beep(160, 0.12, 'square', 0.05, 70);
      this.noise(0.18, 0.08, 500);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 200) particles.shift();
      particles.push({
        x: spec.x + (Math.random() * 2 - 1) * spec.j,
        y: spec.y + (Math.random() * 2 - 1) * spec.j * 0.5,
        vx: lerp(spec.vx0, spec.vx1, Math.random()),
        vy: lerp(spec.vy0, spec.vy1, Math.random()),
        life: spec.life * lerp(0.7, 1.15, Math.random()),
        max: spec.life,
        r: lerp(spec.r0, spec.r1, Math.random()),
        mag: !!spec.mag,
        gold: !!spec.gold,
        g: spec.g == null ? 380 : spec.g
      });
    }
  }

  function emitFiber(x, y, tg, mag) {
    if (fibers.length > 90) fibers.shift();
    const nx = -tg.y;
    const ny = tg.x;
    const side = Math.random() < 0.5 ? 1 : -1;
    fibers.push({
      x: x + nx * side * lerp(4, 14, Math.random()),
      y: y + ny * side * lerp(4, 14, Math.random()),
      vx: nx * side * lerp(18, 70, Math.random()) + tg.x * lerp(-20, 20, Math.random()),
      vy: ny * side * lerp(18, 70, Math.random()) + tg.y * lerp(-20, 20, Math.random()) - 20,
      rot: Math.random() * TAU,
      vr: (Math.random() * 2 - 1) * 6,
      w: lerp(3, 9, Math.random()),
      h: lerp(1.2, 2.4, Math.random()),
      life: lerp(0.35, 0.7, Math.random()),
      max: 0.7,
      mag: !!mag
    });
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.7;
  }

  function syncPips() {
    while (pips.length < LIVES) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      const on = i < G.lives;
      pips[i].className = 'pip' + (on ? ' on' : ' gone') + (on && G.lives === 1 ? ' warn' : '');
    }
  }

  function overlayOpen() {
    return !overlay.classList.contains('hidden');
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const playing = G.mode === 'play';
    if (G.mode === 'title') {
      stageLabel.textContent = '十关';
      timeLabel.textContent = '时 —';
      tearLabel.textContent = '撕 —';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 关 · ' + (st ? st.name : '');
      timeLabel.textContent = '时 ' + Math.max(0, G.time).toFixed(1);
      tearLabel.textContent = '撕 ' + Math.round(clamp(G.tornU, 0, 1) * 100) + '%';
    }
    timeLabel.classList.toggle('warn', playing && G.time < 5);
    tearLabel.classList.toggle('warn', playing && G.strain > 0.55);
    stageLabel.classList.toggle('hot', G.mode === 'reveal' || G.mode === 'win');
    const tip = G.pts.length ? pointOn(G, G.tornU) : { x: G.hx, y: G.hy };
    const nearTip = hypot(G.hx - tip.x, G.hy - tip.y) < (st ? st.fail : 40);
    btnTear.disabled = !playing;
    btnTear.classList.toggle('hot', playing && (G.tearing || nearTip));
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
    ovOps.textContent = ops || '拖金签沿线撕 · WASD 移指 · 空格撕 · M 静音';
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: lerp(0.6, 1.8, Math.random()),
        s: lerp(4, 14, Math.random()),
        a: Math.random() * TAU,
        mag: Math.random() < 0.35
      });
    }
  }

  function applyStage(idx) {
    const st = STAGES[idx];
    const track = makeTrack(st.path, st.smooth);
    G.pts = track.pts;
    G.cum = track.cum;
    G.len = track.len;
    G.decoys = [];
    for (let i = 0; i < st.decoys.length; i++) {
      G.decoys.push(makeTrack(st.decoys[i], st.smooth));
    }
    G.seals = [];
    for (let i = 0; i < st.seals.length; i++) {
      const s = st.seals[i];
      G.seals.push({ x: mx(s.x), y: my(s.y), r: s.r * MAP.w });
    }
    G.tornU = 0;
    G.peel = 0;
    G.strain = 0;
    G.walk = 0;
    G.why = '';
    G.tearing = false;
    G.time = st.time;
    G.timeMax = st.time;
    const tab = pointOn(G, 0);
    G.hx = tab.x;
    G.hy = tab.y;
    G.tabGlow = 1;
    particles.length = 0;
    fibers.length = 0;
  }

  function startStage(idx) {
    G.stage = idx;
    applyStage(idx);
    G.mode = 'play';
    G.lock = 0.18;
    G.settle = 0;
    G.flash = 0.35;
    hideOverlay();
    const st = STAGES[idx];
    setHint(st.hint, '');
    toast(st.toast, false, true);
    syncHud();
    audio.start();
  }

  function startRun() {
    G.lives = LIVES;
    G.taughtGrab = false;
    G.taughtOff = false;
    audio.start();
    startStage(0);
  }

  function goTitle() {
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.demo = 0;
    applyStage(0);
    G.time = STAGES[0].time;
    showOverlay(
      'title',
      '撕图',
      '沿线撕开藏路。<br />捏住金页签，贴着针脚撕到青灯。撕偏、撕到蜡印都会裂。',
      '开撕',
      'TEAR',
      '拖金签沿线撕 · WASD 移指 · 空格撕 · M 静音'
    );
    setHint('捏金签，沿线撕开 · 底下藏着路', '');
    syncHud();
  }

  function canPlay() {
    return G.mode === 'play' && G.lock <= 0 && !G.why;
  }

  function tipPoint() {
    return pointOn(G, G.tornU);
  }

  function nearTip(x, y) {
    const st = STAGES[G.stage];
    const tip = tipPoint();
    return hypot(x - tip.x, y - tip.y) <= st.fail * 0.95 + 10;
  }

  function tryGrab(x, y, fromPtr, quietFail) {
    if (!canPlay()) return false;
    if (nearTip(x, y)) {
      G.tearing = true;
      G.hx = x;
      G.hy = y;
      if (fromPtr) canvas.classList.add('drag');
      audio.grab();
      G.tabGlow = 0.4;
      return true;
    }
    if (!quietFail && G.grabDeny <= 0) {
      audio.deny();
      if (!G.taughtGrab) {
        toast(G.tornU < 0.02 ? '先捏住金页签' : '从撕口接着撕', true);
        G.taughtGrab = true;
      }
      G.grabDeny = 0.35;
    }
    return false;
  }

  function releaseTear() {
    G.tearing = false;
    canvas.classList.remove('drag');
  }

  function hitWax(x, y) {
    for (let i = 0; i < G.seals.length; i++) {
      const s = G.seals[i];
      if (hypot(x - s.x, y - s.y) < s.r + 7) return s;
    }
    return null;
  }

  function closestDecoy(x, y) {
    let best = null;
    for (let i = 0; i < G.decoys.length; i++) {
      const n = nearestOn(G.decoys[i], x, y);
      if (!best || n.dist < best.dist) best = n;
    }
    return best;
  }

  function beginRip(why) {
    if (G.mode !== 'play') return;
    G.why = why;
    G.mode = 'rip';
    G.settle = 0.95;
    G.magFlash = 0.95;
    G.shake = 16;
    G.tearing = false;
    canvas.classList.remove('drag');
    const tip = tipPoint();
    if (why === 'wax') audio.wax();
    else audio.rip();
    const msgs = {
      rip: '撕偏了',
      fake: '那是旧痕',
      wax: '蜡印裂了',
      time: '纸脆了'
    };
    toast(msgs[why] || '撕裂了', true);
    setHint(why === 'time' ? '来不及了' : '图撕裂了', 'warn');
    const tg = tanOn(G, G.tornU);
    for (let k = 0; k < 18; k++) emitFiber(tip.x, tip.y, tg, true);
    emit(28, {
      x: tip.x,
      y: tip.y,
      j: 22,
      vx0: -180,
      vx1: 180,
      vy0: -220,
      vy1: 40,
      life: 0.75,
      r0: 1.2,
      r1: 3.8,
      mag: true,
      g: 520
    });
  }

  function failStage() {
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const titles = { rip: '撕偏', fake: '旧痕', wax: '蜡裂', time: '纸脆' };
    const leads = {
      rip: more ? '撕口离开针脚，纸就裂了。<br />还剩 ' + G.lives + ' 次。' : '撕偏了，十关未完。',
      fake: more ? '跟了灰色旧痕。<br />还剩 ' + G.lives + ' 次。' : '撕错线，十关未完。',
      wax: more ? '蜡印撕破，整张图裂开。<br />还剩 ' + G.lives + ' 次。' : '蜡印裂了，十关未完。',
      time: more ? '纸放久了会变脆。<br />还剩 ' + G.lives + ' 次。' : '纸脆了，十关未完。'
    };
    const why = G.why || 'rip';
    showOverlay(
      'lose',
      titles[why] || '撕裂',
      leads[why] || leads.rip,
      more ? '再撕本关' : '再来一局',
      why === 'time' ? 'BRITTLE' : 'RIPPED'
    );
    G.mode = 'fail';
  }

  function beginReveal() {
    G.mode = 'reveal';
    G.tornU = 1;
    G.tearing = false;
    canvas.classList.remove('drag');
    G.walk = 0;
    G.goldFlash = 0.7;
    G.lock = 9;
    audio.open();
    toast('路开了', false, true);
    setHint('藏路亮了', 'hot');
    const tip = pointOn(G, 1);
    emit(16, {
      x: tip.x,
      y: tip.y,
      j: 14,
      vx0: -60,
      vx1: 60,
      vy0: -90,
      vy1: -10,
      life: 0.55,
      r0: 1.2,
      r1: 3,
      gold: true,
      g: 240
    });
    syncHud();
  }

  function finishReveal() {
    audio.good();
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '路开',
        '十张残图全部撕开，底下的路都亮了。',
        '再撕一巡',
        'UNVEILED'
      );
      setHint('十关藏路全开', 'hot');
    } else {
      startStage(G.stage + 1);
    }
    syncHud();
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      if (G.lives > 0) startStage(G.stage);
      else startRun();
    }
  }

  function advanceTear(dt) {
    if (!canPlay() || !G.tearing) {
      G.strain = Math.max(0, G.strain - dt * 1.8);
      return;
    }
    const st = STAGES[G.stage];
    const near = nearestOn(G, G.hx, G.hy);
    const tip = tipPoint();
    const dTip = hypot(G.hx - tip.x, G.hy - tip.y);
    const wax = hitWax(G.hx, G.hy);
    if (wax) {
      beginRip('wax');
      return;
    }
    const decoy = closestDecoy(G.hx, G.hy);
    if (decoy && decoy.dist + 6 < near.dist && decoy.dist < st.tol && decoy.u > 0.1) {
      beginRip('fake');
      return;
    }
    if (near.dist > st.fail) {
      beginRip('rip');
      return;
    }
    if (dTip > st.fail * 1.4) {
      releaseTear();
      return;
    }

    const off = clamp((near.dist - st.tol * 0.45) / (st.fail - st.tol * 0.45), 0, 1);
    G.strain = lerp(G.strain, off, 0.35);
    if (off > 0.55 && G.warnCd <= 0) {
      audio.warn();
      G.warnCd = 0.7;
      if (!G.taughtOff) {
        toast('贴着针脚', true);
        G.taughtOff = true;
      }
    }

    if (near.dist <= st.tol && dTip <= st.fail * 1.2 && near.u >= G.tornU - 0.05) {
      const maxDu = (380 * dt) / G.len + 0.018;
      const want = Math.min(near.u, G.tornU + maxDu);
      if (want > G.tornU) {
        const mid = pointOn(G, (G.tornU + want) * 0.5);
        const tg = tanOn(G, G.tornU);
        if (G.rustleT <= 0) {
          audio.rustle();
          G.rustleT = 0.05;
          emitFiber(mid.x, mid.y, tg, false);
        }
        G.tornU = want;
        G.peel = Math.min(26, G.peel + dt * 40);
        if (Math.random() < 0.4) {
          emit(1, {
            x: mid.x,
            y: mid.y,
            j: 6,
            vx0: -30,
            vx1: 30,
            vy0: -50,
            vy1: -4,
            life: 0.32,
            r0: 0.8,
            r1: 1.8,
            gold: true,
            g: 200
          });
        }
      }
    }

    if (G.tornU >= 0.985) beginReveal();
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    return {
      x: (x - ox) / scale,
      y: (y - oy) / scale
    };
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.warnCd = Math.max(0, G.warnCd - dt);
    G.rustleT = Math.max(0, G.rustleT - dt);
    G.grabDeny = Math.max(0, G.grabDeny - dt);
    G.tabGlow = Math.max(0.25, G.tabGlow - dt * 0.25);
    G.pulse += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    if (G.mode === 'play' && !G.tearing) {
      G.peel = Math.max(0, G.peel - dt * 8);
    }
    if (G.mode === 'reveal') {
      G.peel = Math.min(56, G.peel + dt * 42);
      G.walk += dt / 1.2;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.99;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = fibers.length - 1; i >= 0; i--) {
      const f = fibers[i];
      f.vy += 260 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      f.life -= dt;
      if (f.life <= 0) fibers.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.a += dt * 0.4;
      m.y -= m.s * dt * 0.15;
      if (m.y < -8) {
        m.y = VH + 8;
        m.x = Math.random() * VW;
      }
    }
  }

  function updatePlay(dt) {
    if (!canPlay()) return;
    let kx = 0;
    let ky = 0;
    if (keys.l) kx -= 1;
    if (keys.r) kx += 1;
    if (keys.u) ky -= 1;
    if (keys.d) ky += 1;
    if (kx || ky) {
      const n = hypot(kx, ky) || 1;
      const spd = G.tearing ? 240 : 280;
      G.hx += (kx / n) * spd * dt;
      G.hy += (ky / n) * spd * dt;
    }
    G.hx = clamp(G.hx, 18, VW - 18);
    G.hy = clamp(G.hy, 18, VH - 18);

    const wantTear = keys.tear || ptr.down;
    if (wantTear && !G.tearing) tryGrab(G.hx, G.hy, ptr.down, true);
    if (!keys.tear && !ptr.down && G.tearing) releaseTear();

    G.time -= dt;
    if (G.time <= 0) {
      G.time = 0;
      beginRip('time');
      return;
    }
    advanceTear(dt);
  }

  function updateTitle(dt) {
    G.demo += dt;
    const u = 0.08 + 0.5 * (0.5 + 0.5 * Math.sin(G.demo * 0.55));
    G.tornU = u;
    G.peel = 18 + Math.sin(G.demo * 0.9) * 6;
    const p = pointOn(G, G.tornU);
    G.hx = p.x;
    G.hy = p.y;
  }

  function updateRip(dt) {
    G.settle -= dt;
    G.peel = Math.min(40, G.peel + dt * 30);
    if (G.settle <= 0) failStage();
  }

  function updateReveal(dt) {
    if (G.walk >= 1 && G.peel >= 48) {
      G.walk = 1;
      finishReveal();
    }
  }

  function addRR(x, y, w, h, r) {
    r = Math.min(r, w * 0.5, h * 0.5);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    addRR(x, y, w, h, r);
  }

  function strokeTrack(track, fromU, toU) {
    const a = clamp(fromU, 0, 1);
    const b = clamp(toU, 0, 1);
    if (b <= a) return;
    const n = Math.max(2, ((b - a) * track.pts.length) | 0);
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = pointOn(track, a + (b - a) * (i / n));
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function drawStitches(track, fromU, gold) {
    const step = gold ? 15 : 18;
    const start = fromU * track.len;
    ctx.strokeStyle = gold ? rgb(GOLD, 0.9) : 'rgba(140, 148, 180, 0.4)';
    ctx.lineWidth = gold ? 1.6 : 1.1;
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    for (let s = start; s < track.len; s += step) {
      const u = s / track.len;
      const p = pointOn(track, u);
      const t = tanOn(track, u);
      const nx = -t.y;
      const ny = t.x;
      const len = gold ? 5.2 : 4.2;
      ctx.beginPath();
      ctx.moveTo(p.x + nx * len, p.y + ny * len);
      ctx.lineTo(p.x - nx * len, p.y - ny * len);
      ctx.stroke();
    }
  }

  function tearPoly(peel) {
    if (G.tornU <= 0.004) return null;
    const n = Math.max(8, (G.tornU * 90) | 0);
    const left = [];
    const right = [];
    for (let i = 0; i <= n; i++) {
      const u = G.tornU * (i / n);
      const p = pointOn(G, u);
      const tg = tanOn(G, u);
      const nx = -tg.y;
      const ny = tg.x;
      const along = i / n;
      const jag = (hash((i * 19 + G.stage * 11 + (u * 80) | 0) | 0) - 0.5) * 6.2;
      const base = lerp(20, 6.5, along);
      const extra = peel * (0.28 + 0.72 * (1 - along));
      const w = base + extra + jag;
      left.push({ x: p.x + nx * w, y: p.y + ny * w });
      right.push({ x: p.x - nx * w, y: p.y - ny * w });
    }
    const s = pointOn(G, 0);
    const ts = tanOn(G, 0);
    left.unshift({ x: s.x - ts.x * 12 + (-ts.y) * 16, y: s.y - ts.y * 12 + ts.x * 16 });
    right.unshift({ x: s.x - ts.x * 12 - (-ts.y) * 16, y: s.y - ts.y * 12 - ts.x * 16 });
    const poly = left.concat(right.reverse());
    return { poly: poly, left: left, right: right };
  }

  function drawDesk() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, VW, VH);
    const g1 = ctx.createRadialGradient(70, 40, 10, 70, 40, 340);
    g1.addColorStop(0, 'rgba(255,61,184,0.16)');
    g1.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, VW, VH);
    const g2 = ctx.createRadialGradient(420, 680, 10, 420, 680, 360);
    g2.addColorStop(0, 'rgba(0,240,255,0.10)');
    g2.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgb(m.mag ? MAG : CYN, 0.12 + 0.1 * Math.sin(m.a));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawUnder() {
    rr(MAP.x, MAP.y, MAP.w, MAP.h, MAP.r);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = rgb(UNDER, 1);
    ctx.fillRect(MAP.x, MAP.y, MAP.w, MAP.h);
    const glow = ctx.createRadialGradient(MAP.x + MAP.w * 0.5, MAP.y + MAP.h * 0.5, 20, MAP.x + MAP.w * 0.5, MAP.y + MAP.h * 0.5, 280);
    glow.addColorStop(0, 'rgba(0,240,255,0.07)');
    glow.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(MAP.x, MAP.y, MAP.w, MAP.h);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = rgb(CYN, 0.12);
    ctx.lineWidth = 22;
    ctx.setLineDash([]);
    strokeTrack(G, 0, 1);
    ctx.strokeStyle = rgb(CYN, 0.28);
    ctx.lineWidth = 12;
    strokeTrack(G, 0, 1);
    const lit = G.mode === 'reveal' || G.mode === 'win' ? 1 : Math.max(G.tornU, 0.02);
    ctx.strokeStyle = rgb(CYN, 0.85);
    ctx.lineWidth = 4.2;
    strokeTrack(G, 0, lit);
    ctx.strokeStyle = rgb(GOLD, 0.7);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 6]);
    strokeTrack(G, 0, lit);
    ctx.setLineDash([]);

    const a = pointOn(G, 0);
    const b = pointOn(G, 1);
    ctx.fillStyle = rgb(MAG, 0.55);
    ctx.beginPath();
    ctx.arc(a.x, a.y, 5, 0, TAU);
    ctx.fill();
    const pulse = 1 + 0.12 * Math.sin(G.pulse * 4);
    ctx.fillStyle = rgb(CYN, 0.18);
    ctx.beginPath();
    ctx.arc(b.x, b.y, 16 * pulse, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgb(CYN, 0.9);
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4.5, 0, TAU);
    ctx.fill();

    if (G.mode === 'reveal' || G.mode === 'win') {
      const w = pointOn(G, clamp(G.walk, 0, 1));
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(Math.atan2(tanOn(G, G.walk).y, tanOn(G, G.walk).x));
      ctx.fillStyle = rgb(GOLD, 1);
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, 4.5);
      ctx.lineTo(-5, -4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCartography() {
    const rng = rngFn(1400 + G.stage * 91);
    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const x = MAP.x + (MAP.w * i) / 6;
      ctx.beginPath();
      ctx.moveTo(x, MAP.y + 8);
      ctx.lineTo(x, MAP.y + MAP.h - 8);
      ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      const y = MAP.y + (MAP.h * i) / 8;
      ctx.beginPath();
      ctx.moveTo(MAP.x + 8, y);
      ctx.lineTo(MAP.x + MAP.w - 8, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,240,255,0.16)';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    for (let r = 0; r < 3; r++) {
      const x0 = MAP.x + 30 + rng() * (MAP.w - 80);
      const y0 = MAP.y + 40 + rng() * (MAP.h - 80);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      for (let k = 0; k < 5; k++) {
        ctx.quadraticCurveTo(
          x0 + (rng() - 0.3) * 90,
          y0 + 20 + k * 18 + (rng() - 0.5) * 30,
          x0 + (rng() - 0.4) * 70,
          y0 + 36 + k * 22
        );
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,61,184,0.18)';
    ctx.strokeStyle = 'rgba(255,61,184,0.28)';
    ctx.lineWidth = 1;
    for (let m = 0; m < 7; m++) {
      let x = 0;
      let y = 0;
      let ok = false;
      for (let t = 0; t < 14; t++) {
        x = MAP.x + 40 + rng() * (MAP.w - 80);
        y = MAP.y + 50 + rng() * (MAP.h - 100);
        if (nearestOn(G, x, y).dist > 26) {
          ok = true;
          break;
        }
      }
      if (!ok) continue;
      const s = 6 + rng() * 10;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s * 0.7, y + s * 0.4);
      ctx.lineTo(x - s * 0.7, y + s * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    for (let t = 0; t < 8; t++) {
      let x = MAP.x + 36 + rng() * (MAP.w - 72);
      let y = MAP.y + 40 + rng() * (MAP.h - 80);
      let ok = false;
      for (let k = 0; k < 10; k++) {
        x = MAP.x + 36 + rng() * (MAP.w - 72);
        y = MAP.y + 40 + rng() * (MAP.h - 80);
        if (nearestOn(G, x, y).dist > 16) {
          ok = true;
          break;
        }
      }
      if (!ok) continue;
      ctx.fillStyle = rgb(GOLD, 0.22 + rng() * 0.15);
      ctx.beginPath();
      ctx.arc(x, y, 1.6 + rng(), 0, TAU);
      ctx.fill();
    }
    const cx = MAP.x + MAP.w - 46;
    const cy = MAP.y + 42;
    ctx.strokeStyle = rgb(CYN, 0.4);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx, cy + 14);
    ctx.moveTo(cx - 14, cy);
    ctx.lineTo(cx + 14, cy);
    ctx.stroke();
    ctx.fillStyle = rgb(MAG, 0.7);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12);
    ctx.lineTo(cx + 3.5, cy);
    ctx.lineTo(cx - 3.5, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSeals() {
    for (let i = 0; i < G.seals.length; i++) {
      const s = G.seals[i];
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = 'rgba(255,61,184,0.16)';
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgb(MAG, 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgb(MAG, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, s.r * 0.62, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgb(MAG, 0.55);
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawDecoys() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < G.decoys.length; i++) {
      const d = G.decoys[i];
      ctx.strokeStyle = 'rgba(130,136,168,0.45)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 7]);
      strokeTrack(d, 0, 1);
      ctx.setLineDash([]);
    }
  }

  function drawPerforation() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = rgb(GOLD, 0.85);
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 6]);
    strokeTrack(G, G.tornU, 1);
    ctx.setLineDash([]);
    drawStitches(G, G.tornU, true);
  }

  function drawFlaps(hole) {
    if (!hole) return;
    const peel = G.peel;
    if (peel < 1 && G.tornU < 0.02) return;
    function strip(edge, side) {
      if (edge.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(edge[0].x, edge[0].y);
      for (let i = 1; i < edge.length; i++) ctx.lineTo(edge[i].x, edge[i].y);
      for (let i = edge.length - 1; i >= 0; i--) {
        const u = G.tornU * (i / Math.max(1, edge.length - 1));
        const tg = tanOn(G, u);
        const nx = -tg.y * side;
        const ny = tg.x * side;
        const w = 10 + peel * 0.35;
        ctx.lineTo(edge[i].x + nx * w, edge[i].y + ny * w);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(18, 10, 28, 0.92)';
      ctx.fill();
      ctx.strokeStyle = rgb(MAG, 0.35 + (G.mode === 'rip' ? 0.4 : 0));
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.save();
    rr(MAP.x, MAP.y, MAP.w, MAP.h, MAP.r);
    ctx.clip();
    strip(hole.left, 1);
    strip(hole.right, -1);
    ctx.restore();
  }

  function drawParchment() {
    const hole = tearPoly(G.peel + (G.mode === 'rip' ? 10 : 0));
    ctx.save();
    rr(MAP.x - 3, MAP.y - 3, MAP.w + 6, MAP.h + 6, MAP.r + 3);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    ctx.beginPath();
    addRR(MAP.x, MAP.y, MAP.w, MAP.h, MAP.r);
    if (hole) {
      const p = hole.poly;
      ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
      ctx.closePath();
    }
    ctx.clip('evenodd');

    const pg = ctx.createLinearGradient(MAP.x, MAP.y, MAP.x + MAP.w, MAP.y + MAP.h);
    pg.addColorStop(0, '#2a1634');
    pg.addColorStop(0.45, '#221028');
    pg.addColorStop(1, '#1a0e22');
    ctx.fillStyle = pg;
    ctx.fillRect(MAP.x, MAP.y, MAP.w, MAP.h);

    const rng = rngFn(220 + G.stage * 17);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = 'rgba(255,227,107,' + (0.015 + rng() * 0.03) + ')';
      ctx.beginPath();
      ctx.ellipse(
        MAP.x + rng() * MAP.w,
        MAP.y + rng() * MAP.h,
        18 + rng() * 40,
        10 + rng() * 22,
        rng() * TAU,
        0,
        TAU
      );
      ctx.fill();
    }

    drawCartography();
    drawDecoys();
    drawSeals();
    drawPerforation();
    ctx.restore();

    if (hole) {
      ctx.save();
      rr(MAP.x, MAP.y, MAP.w, MAP.h, MAP.r);
      ctx.clip();
      ctx.strokeStyle = rgb(G.mode === 'rip' ? MAG : GOLD, G.mode === 'rip' ? 0.7 : 0.45);
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const p = hole.poly;
      ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    rr(MAP.x, MAP.y, MAP.w, MAP.h, MAP.r);
    ctx.strokeStyle = 'rgba(0,240,255,0.28)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    rr(MAP.x + 5, MAP.y + 5, MAP.w - 10, MAP.h - 10, MAP.r - 4);
    ctx.strokeStyle = 'rgba(255,61,184,0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    if (hole) drawFlaps(hole);
    return hole;
  }

  function drawTabAndLamp() {
    const tab = pointOn(G, 0);
    const tg = tanOn(G, 0);
    const lamp = pointOn(G, 1);
    const glow = 0.55 + 0.45 * Math.sin(G.pulse * 3.4);

    if (G.tornU < 0.08) {
      ctx.save();
      ctx.translate(tab.x, tab.y);
      ctx.rotate(Math.atan2(tg.y, tg.x) + Math.PI);
      const g = 0.7 + G.tabGlow * 0.5;
      ctx.shadowColor = rgb(GOLD, 0.7);
      ctx.shadowBlur = 12;
      ctx.fillStyle = rgb(GOLD, g);
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(18, -11);
      ctx.lineTo(18, 11);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = rgb(MAG, 0.75);
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = rgb(PAPER, 1);
      ctx.fillRect(13, -3.6, 6, 7.2);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(lamp.x, lamp.y);
    ctx.fillStyle = rgb(CYN, 0.12 + 0.12 * glow);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgb(CYN, 0.22);
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(7, 4);
    ctx.lineTo(-7, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgb(CYN, 0.85);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(7, 4);
    ctx.lineTo(-7, 4);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = rgb(GOLD, 0.7 + 0.3 * glow);
    ctx.beginPath();
    ctx.arc(0, -2, 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPinch() {
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'fail') return;
    const x = G.hx;
    const y = G.hy;
    const hot = G.tearing;
    const st = STAGES[G.stage];
    const near = nearestOn(G, x, y);
    const danger = hot && near.dist > st.tol * 0.7;
    ctx.save();
    ctx.strokeStyle = rgb(danger ? MAG : (hot ? GOLD : CYN), hot ? 0.9 : 0.55);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 11 + (hot ? 2 : 0), 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, TAU);
    ctx.fillStyle = rgb(danger ? MAG : GOLD, 0.9);
    ctx.fill();
    ctx.strokeStyle = rgb(INK, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 5);
    ctx.quadraticCurveTo(x - 2, y - 11, x + 2, y - 5);
    ctx.moveTo(x + 7, y - 5);
    ctx.quadraticCurveTo(x + 2, y - 11, x - 2, y - 5);
    ctx.stroke();
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < fibers.length; i++) {
      const f = fibers[i];
      const a = clamp(f.life / f.max, 0, 1);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.fillStyle = rgb(f.mag ? MAG : mix(PAPER, GOLD, 0.35), 0.15 + a * 0.7);
      ctx.fillRect(-f.w * 0.5, -f.h * 0.5, f.w, f.h);
      ctx.restore();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgb(p.mag ? MAG : (p.gold ? GOLD : CYN), a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    if (G.magFlash > 0) {
      ctx.fillStyle = rgb(MAG, G.magFlash * 0.18);
      ctx.fillRect(0, 0, VW, VH);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = rgb(GOLD, G.goldFlash * 0.12);
      ctx.fillRect(0, 0, VW, VH);
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgb(CYN, G.flash * 0.08);
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function draw() {
    const shx = (G.shake ? (hash((G.clock * 90) | 0) - 0.5) * G.shake : 0);
    const shy = (G.shake ? (hash((G.clock * 90 + 17) | 0) - 0.5) * G.shake : 0);
    ctx.setTransform(scale, 0, 0, scale, ox + shx * scale, oy + shy * scale);
    drawDesk();
    drawUnder();
    drawParchment();
    drawTabAndLamp();
    drawPinch();
    drawFx();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2.2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    const fit = Math.min(W / VW, H / VH);
    scale = fit * dpr;
    ox = (canvas.width - VW * scale) * 0.5;
    oy = (canvas.height - VH * scale) * 0.5;
  }

  function tick(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'rip') updateRip(dt);
    else if (G.mode === 'reveal') updateReveal(dt);
    updateFx(dt);
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      tick(STEP);
      acc -= STEP;
      steps++;
    }
    draw();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    let used = false;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA') {
      keys.l = down;
      used = true;
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD') {
      keys.r = down;
      used = true;
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW') {
      keys.u = down;
      used = true;
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS') {
      keys.d = down;
      used = true;
    }
    if (k === ' ' || k === 'Spacebar' || code === 'Space') {
      keys.tear = down;
      used = true;
      if (down && overlayOpen()) {
        keys.tear = false;
        overlayAction();
      }
    }
    if (down && (k === 'm' || k === 'M' || code === 'KeyM')) {
      audio.ensure();
      audio.setMuted(!audio.muted);
      used = true;
    }
    if (down && (k === 'r' || k === 'R' || code === 'KeyR')) {
      used = true;
      if (overlayOpen()) overlayAction();
      else if (G.mode === 'play') startStage(G.stage);
      else if (G.mode === 'win' || G.mode === 'title') startRun();
    }
    if (down && (k === 'Enter' || k === 'NumpadEnter') && overlayOpen()) {
      overlayAction();
      used = true;
    }
    if (used) e.preventDefault();
  }

  canvas.addEventListener('pointerdown', function (e) {
    audio.ensure();
    if (overlayOpen()) return;
    const w = worldFromEvent(e);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = w.x;
    ptr.y = w.y;
    G.hx = clamp(w.x, 18, VW - 18);
    G.hy = clamp(w.y, 18, VH - 18);
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
    tryGrab(G.hx, G.hy, true);
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    ptr.x = w.x;
    ptr.y = w.y;
    if (!ptr.down && G.mode === 'play' && !keys.l && !keys.r && !keys.u && !keys.d) {
      G.hx = clamp(w.x, 18, VW - 18);
      G.hy = clamp(w.y, 18, VH - 18);
    }
    if (ptr.down && (G.tearing || G.mode === 'play')) {
      G.hx = clamp(w.x, 18, VW - 18);
      G.hy = clamp(w.y, 18, VH - 18);
    }
  });

  function endPtr(e) {
    if (ptr.id != null && e.pointerId !== ptr.id && e.type !== 'pointercancel') return;
    ptr.down = false;
    ptr.id = null;
    if (G.tearing && !keys.tear) releaseTear();
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    overlayAction();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') startRun();
    else if (G.mode === 'fail') overlayAction();
    else if (G.mode === 'play' || G.mode === 'reveal' || G.mode === 'rip') startStage(G.stage);
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnTear.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    audio.ensure();
    keys.tear = true;
    if (canPlay()) tryGrab(G.hx, G.hy, false);
  });
  btnTear.addEventListener('pointerup', function () { keys.tear = false; });
  btnTear.addEventListener('pointerleave', function () { keys.tear = false; });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.tear = false;
    ptr.down = false;
    if (G.tearing) releaseTear();
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = keys.tear = false;
      if (G.tearing) releaseTear();
    } else last = 0;
  });
  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  seedMotes();
  resize();
  goTitle();
  requestAnimationFrame(frame);
})();
