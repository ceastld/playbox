'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SRC_Y = 160;
  const DST_Y = 556;
  const CUT_Y = 352;
  const SRCX = [112, 240, 368];
  const DSTX = [118, 240, 362];
  const MUTE_KEY = 'playbox-fuse-cut-mute';

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const DIM = { r: 86, g: 90, b: 118 };
  const LAYOUTS = {
    straight: { map: [0, 1, 2], bulge: [28, 0, -28], kink: [8, -12, 10], s: false },
    mild: { map: [0, 1, 2], bulge: [64, -48, 58], kink: [-18, 28, -14], s: false },
    swap: { map: [2, 1, 0], bulge: [96, 8, -96], kink: [22, -18, 20], s: false },
    cross: { map: [2, 0, 1], bulge: [118, -36, -86], kink: [36, 48, -28], s: false },
    weave: { map: [2, 0, 1], bulge: [128, 76, -122], kink: [66, -58, 48], s: true },
    tangle: { map: [1, 2, 0], bulge: [148, -136, 44], kink: [86, 74, -68], s: true }
  };

  const STAGES = [
    { name: '死线', sub: 'DEAD', time: 20, pulse: 1.55, hint: '没有火花走的那根是假的，剪它', tell: 'dead', layout: 'straight', colors: 'trio' },
    { name: '断口', sub: 'GAP', time: 18, pulse: 1.42, hint: '中间断开的是假线', tell: 'gap', layout: 'straight', colors: 'trio', gapAt: 0.5, gapSize: 0.09 },
    { name: '回流', sub: 'BACK', time: 16, pulse: 1.32, hint: '火花往上走的是假的', tell: 'reverse', layout: 'mild', colors: 'trio' },
    { name: '残脉', sub: 'DIE', time: 15, pulse: 1.22, hint: '火花走不到头的是假线', tell: 'die', layout: 'mild', colors: 'trio', dieAt: 0.46 },
    { name: '交叉', sub: 'CROSS', time: 14, pulse: 1.14, hint: '顺着火花走，到不了芯的是假的', tell: 'die', layout: 'cross', colors: 'trio', dieAt: 0.56 },
    { name: '虚接', sub: 'LOOSE', time: 13, pulse: 1.08, hint: '底下没插紧的那根是假的', tell: 'unseat', layout: 'swap', colors: 'duo' },
    { name: '错拍', sub: 'SYNC', time: 12, pulse: 1.0, hint: '看节拍，慢半拍的是假线', tell: 'desync', layout: 'cross', colors: 'same' },
    { name: '绞线', sub: 'KNOT', time: 11, pulse: 0.94, hint: '穿过绞线，火花熄在半路的是假的', tell: 'die', layout: 'weave', colors: 'trio', dieAt: 0.68 },
    { name: '迷彩', sub: 'MIMIC', time: 10, pulse: 0.88, hint: '只有光、没有火花珠的是假线', tell: 'ghost', layout: 'weave', colors: 'same' },
    { name: '绝秒', sub: 'LAST', time: 8, pulse: 0.78, hint: '火花差点走完，就差那一截', tell: 'die', layout: 'tangle', colors: 'same', dieAt: 0.86 }
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
  const btnCut = document.getElementById('btn-cut');
  const stageLabel = document.getElementById('stage-label');
  const timeLabel = document.getElementById('time-label');
  const tellLabel = document.getElementById('tell-label');
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
  const rings = [];
  const embers = [];
  const pips = [];

  const ptr = {
    down: false,
    id: null,
    x: VW * 0.5,
    y: CUT_Y,
    sx: 0,
    sy: 0,
    lx: 0,
    ly: 0,
    drag: false,
    snipped: false,
    hover: false,
    ang: -0.4
  };

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 20,
    timeMax: 20,
    pulse: 1.5,
    wires: [],
    sel: 1,
    hover: -1,
    lock: 0,
    settle: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    snipT: 0,
    toastT: 0,
    why: '',
    dump: 0,
    coreHot: 0,
    lastPulse: -1,
    pulseT: 0,
    warnAt: 4,
    shearsOpen: 0.34,
    shearsX: VW * 0.5,
    shearsY: CUT_Y,
    shearsA: -0.35
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
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
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
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function sampleCubic(p0, p1, p2, p3, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      const uu = u * u;
      const tt = t * t;
      pts.push({
        x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
        y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y
      });
    }
    return pts;
  }

  function lengthize(pts) {
    const dist = [0];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      acc += hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      dist.push(acc);
    }
    return { pts: pts, dist: dist, len: Math.max(1, acc) };
  }

  function atU(w, u) {
    const s = clamp(u, 0, 1) * w.len;
    const d = w.dist;
    let lo = 0;
    let hi = d.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (d[mid] < s) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const span = d[i] - d[i - 1] || 1;
    const t = clamp((s - d[i - 1]) / span, 0, 1);
    const x0 = w.pts[i - 1].x;
    const y0 = w.pts[i - 1].y;
    const x1 = w.pts[i].x;
    const y1 = w.pts[i].y;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = hypot(dx, dy) || 1;
    return {
      x: x0 + dx * t,
      y: y0 + dy * t,
      tx: dx / len,
      ty: dy / len,
      nx: -dy / len,
      ny: dx / len
    };
  }

  function atY(w, y) {
    let bestU = 0.5;
    let bd = 1e9;
    for (let i = 0; i < w.pts.length; i++) {
      const d = Math.abs(w.pts[i].y - y);
      if (d < bd) {
        bd = d;
        bestU = w.dist[i] / w.len;
      }
    }
    return bestU;
  }

  function makePts(i, lay) {
    const a = { x: SRCX[i], y: SRC_Y };
    const di = lay.map[i];
    const b = { x: DSTX[di], y: DST_Y };
    const bulge = lay.bulge[i];
    const ky = lay.kink[i];
    if (lay.s) {
      const m = {
        x: lerp(a.x, b.x, 0.48) + bulge * 0.42,
        y: lerp(a.y, b.y, 0.46)
      };
      const p1 = sampleCubic(
        a,
        { x: a.x + bulge * 0.22, y: a.y + 78 },
        { x: m.x - ky * 0.35, y: m.y - 36 },
        m,
        28
      );
      const p2 = sampleCubic(
        m,
        { x: m.x + ky * 0.55, y: m.y + 42 },
        { x: b.x - bulge * 0.18, y: b.y - 86 },
        b,
        28
      );
      return p1.concat(p2.slice(1));
    }
    const c1 = { x: a.x + bulge, y: lerp(a.y, b.y, 0.32) + ky };
    const c2 = { x: b.x - bulge * 0.38, y: lerp(a.y, b.y, 0.68) - ky * 0.28 };
    return sampleCubic(a, c1, c2, b, 54);
  }

  function paintColors(kind) {
    if (kind === 'same') return [CYN, CYN, CYN];
    if (kind === 'duo') return shuffled([CYN, CYN, MAG]);
    return shuffled([MAG, CYN, GOLD]);
  }

  function buildWires(st, fakeI) {
    const lay = LAYOUTS[st.layout] || LAYOUTS.straight;
    const cols = paintColors(st.colors);
    const wires = [];
    for (let i = 0; i < 3; i++) {
      let pts = makePts(i, lay);
      const fake = i === fakeI;
      let gapAt = 0;
      let gapSize = 0;
      if (fake && st.tell === 'gap') {
        gapAt = st.gapAt || 0.5;
        gapSize = st.gapSize || 0.08;
      }
      if (fake && st.tell === 'unseat') {
        const keep = 0.905;
        const geo0 = lengthize(pts);
        const trimmed = [];
        for (let k = 0; k < pts.length; k++) {
          if (geo0.dist[k] / geo0.len <= keep) trimmed.push(pts[k]);
        }
        pts = trimmed;
      }
      const geo = lengthize(pts);
      const col = fake && st.tell === 'dead' ? DIM : cols[i];
      wires.push({
        i: i,
        pts: geo.pts,
        dist: geo.dist,
        len: geo.len,
        col: col,
        fake: fake,
        tell: st.tell,
        dieAt: st.dieAt == null ? 1 : st.dieAt,
        gapAt: gapAt,
        gapSize: gapSize,
        phase: fake && st.tell === 'desync' ? 0.5 : 0,
        cut: false,
        cutS: 0.5,
        rec: 0,
        sparkOn: false,
        sparkU: 0,
        glow: fake && st.tell === 'dead' ? 0.15 : 1,
        destI: lay.map[i]
      });
    }
    return wires;
  }

  function distToWire(w, px, py) {
    let best = 1e9;
    let bestU = 0.5;
    for (let i = 1; i < w.pts.length; i++) {
      const ax = w.pts[i - 1].x;
      const ay = w.pts[i - 1].y;
      const bx = w.pts[i].x;
      const by = w.pts[i].y;
      const abx = bx - ax;
      const aby = by - ay;
      const den = abx * abx + aby * aby || 1;
      const t = clamp(((px - ax) * abx + (py - ay) * aby) / den, 0, 1);
      const x = ax + abx * t;
      const y = ay + aby * t;
      const d = hypot(px - x, py - y);
      if (d < best) {
        best = d;
        bestU = (w.dist[i - 1] + t * (w.dist[i] - w.dist[i - 1])) / w.len;
      }
    }
    return { d: best, u: bestU };
  }

  function segHitsWire(w, ax, ay, bx, by) {
    let best = 1e9;
    let bestU = 0.5;
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = ax + (bx - ax) * t;
      const py = ay + (by - ay) * t;
      const h = distToWire(w, px, py);
      if (h.d < best) {
        best = h.d;
        bestU = h.u;
      }
    }
    return { d: best, u: bestU };
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
      const n = Math.min(0.18, Math.max(0.04, dur));
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
    tick: function (warn) {
      this.ensure();
      if (warn) this.beep(880, 0.05, 'square', 0.03, 420);
      else this.beep(196, 0.05, 'sine', 0.028, 90);
    },
    spark: function () {
      this.ensure();
      this.beep(1480, 0.03, 'triangle', 0.018);
    },
    select: function () {
      this.ensure();
      this.beep(620, 0.05, 'sine', 0.04, 880);
    },
    snip: function () {
      this.ensure();
      this.noise(0.07, 0.07, 1800);
      this.beep(1480, 0.07, 'square', 0.05, 420);
    },
    good: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.055, 523);
      this.beep(784, 0.16, 'triangle', 0.05, 1175);
    },
    boom: function () {
      this.ensure();
      this.noise(0.28, 0.1, 240);
      this.beep(180, 0.32, 'sawtooth', 0.07, 48);
      this.beep(70, 0.45, 'sine', 0.08, 32);
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
    warn: function () {
      this.ensure();
      this.beep(740, 0.08, 'square', 0.04, 220);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.45, spec.j * 0.45),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        g: spec.g == null ? 380 : spec.g
      });
    }
  }

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag });
    if (rings.length > 16) rings.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.6;
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

  function tellWord(st) {
    const map = {
      dead: '死线',
      gap: '断口',
      reverse: '回流',
      die: '残脉',
      unseat: '虚接',
      desync: '错拍',
      ghost: '迷彩'
    };
    return map[st.tell] || '看火花';
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const playing = G.mode === 'play';
    if (G.mode === 'title') {
      stageLabel.textContent = '十关';
      timeLabel.textContent = '时 —';
      tellLabel.textContent = '看火花';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 关 · ' + (st ? st.name : '');
      timeLabel.textContent = '时 ' + Math.max(0, G.time).toFixed(1);
      tellLabel.textContent = st ? tellWord(st) : '—';
    }
    const low = playing && G.time < 5;
    timeLabel.classList.toggle('warn', low);
    stageLabel.classList.toggle('hot', G.mode === 'clear' || G.mode === 'win');
    btnCut.disabled = !playing;
    btnCut.classList.toggle('hot', playing && G.sel >= 0);
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
    ovOps.textContent = ops || '拖过引线剪断 · 1 2 3 选线 · 空格剪 · M 静音';
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 40; i++) {
      motes.push({
        x: rand(18, VW - 18),
        y: rand(40, VH - 40),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.15),
        p: rand(0, TAU),
        s: rand(5, 16)
      });
    }
  }

  function applyStage(si, demo) {
    const st = STAGES[si];
    const fakeI = demo ? 1 : (Math.random() * 3) | 0;
    G.wires = buildWires(st, fakeI);
    G.pulse = st.pulse;
    G.timeMax = st.time;
    G.time = st.time;
    G.sel = demo || si === 0 ? fakeI : 1;
    G.hover = -1;
    G.dump = 0;
    G.coreHot = 0;
    G.lastPulse = -1;
    G.pulseT = 0;
    G.warnAt = 4;
    G.why = '';
    const mid = atU(G.wires[G.sel], atY(G.wires[G.sel], CUT_Y));
    G.shearsX = mid.x;
    G.shearsY = mid.y;
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.16;
    G.settle = 0;
    applyStage(i, false);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].name + ' · ' + STAGES[i].sub);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    embers.length = 0;
    G.lives = LIVES;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    embers.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    applyStage(0, true);
    G.time = STAGES[0].time;
    showOverlay(
      'title',
      '剪引',
      '三根引线里有一根是假的。<br />看着火花，剪掉假的那根。真线一剪即爆。',
      '开剪',
      'FUSE',
      '拖过引线剪断 · 1 2 3 选线 · 空格剪 · M 静音'
    );
    setHint('没有火花的是假线 · 剪它', '');
    syncHud();
  }

  function canCut() {
    return G.mode === 'play' && G.lock <= 0 && !G.why;
  }

  function selectWire(i) {
    if (i < 0 || i > 2) return;
    if (G.wires[i] && G.wires[i].cut) return;
    if (G.sel !== i) audio.select();
    G.sel = i;
  }

  function cutWire(i, u) {
    if (!canCut()) return;
    const w = G.wires[i];
    if (!w || w.cut) return;
    w.cut = true;
    w.cutS = clamp(u == null ? atY(w, CUT_Y) : u, 0.12, 0.88);
    const p = atU(w, w.cutS);
    w.cutX = p.x;
    w.cutY = p.y;
    w.nx = p.nx;
    w.ny = p.ny;
    w.rec = 0;
    G.snipT = 0.28;
    G.shearsX = p.x;
    G.shearsY = p.y;
    G.shearsA = Math.atan2(p.ty, p.tx) + Math.PI * 0.5;
    audio.snip();
    emit(14, {
      x: p.x, y: p.y, j: 8,
      vx0: -90, vx1: 90, vy0: -70, vy1: 40,
      life: 0.45, r0: 1.1, r1: 2.6, gold: w.fake, mag: !w.fake, g: 240
    });
    addRing(p.x, p.y, !w.fake);

    if (w.fake) {
      G.why = 'good';
      G.dump = 1;
      G.goldFlash = 0.7;
      G.lock = 0.9;
      audio.good();
      toast('假线已剪', false, true);
      setHint('假线已剪', 'hot');
      G.mode = 'clear';
      G.settle = 0.95;
      if (G.stage >= STAGES.length - 1) {
        G.mode = 'win';
        audio.win();
        showOverlay(
          'win',
          '拆净',
          '十关假线全剪，真线一根没动。',
          '再拆一巡',
          'DISARMED'
        );
        setHint('十关假线全剪', 'hot');
      }
    } else {
      beginBoom('cut', p.x, p.y);
    }
    syncHud();
  }

  function beginBoom(why, x, y) {
    if (G.mode !== 'play') return;
    G.why = why;
    G.mode = 'boom';
    G.settle = 0.85;
    G.magFlash = 0.85;
    G.shake = 16;
    G.coreHot = 1;
    audio.boom();
    toast(why === 'time' ? '燃尽' : '剪错真线', true);
    setHint(why === 'time' ? '引线燃尽了' : '剪到真线了', 'warn');
    const cx = x == null ? VW * 0.5 : x;
    const cy = y == null ? 610 : y;
    emit(28, {
      x: cx, y: cy, j: 16,
      vx0: -180, vx1: 180, vy0: -220, vy1: 80,
      life: 0.7, r0: 1.6, r1: 4.2, mag: true, g: 520
    });
    emit(18, {
      x: VW * 0.5, y: 610, j: 22,
      vx0: -140, vx1: 140, vy0: -160, vy1: 40,
      life: 0.8, r0: 1.4, r1: 3.8, mag: true, g: 400
    });
  }

  function failStage() {
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const cut = G.why === 'cut';
    showOverlay(
      'lose',
      cut ? '剪错' : '燃尽',
      more
        ? (cut
          ? '那是真线。假线没有走完的火花，或者接口是空的。<br />还剩 ' + G.lives + ' 次。'
          : '没赶上。火花会把假线认出来。<br />还剩 ' + G.lives + ' 次。')
        : (cut ? '剪到真线，十关未完。' : '引线燃尽，十关未完。'),
      more ? '再试本关' : '再来一局',
      cut ? 'LIVE WIRE' : 'BURNT'
    );
    G.mode = 'fail';
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

  function sparkU(w, t) {
    if (w.cut) return null;
    if (G.dump > 0 && !w.fake) return null;
    const st = STAGES[G.stage] || STAGES[0];
    if (w.fake && (w.tell === 'dead' || w.tell === 'ghost' || w.tell === 'gap')) return null;
    let u = (t / st.pulse + w.phase) % 1;
    if (u < 0) u += 1;
    if (w.fake && w.tell === 'reverse') u = 1 - u;
    if (w.fake && (w.tell === 'die' || w.tell === 'unseat') && u > w.dieAt) return null;
    if (w.fake && w.tell === 'unseat' && u > 0.9) return null;
    return u;
  }

  function updateSparks(dt) {
    const t = G.pulseT;
    const st = STAGES[G.stage] || STAGES[0];
    const cycle = Math.floor(t / st.pulse);
    if (cycle !== G.lastPulse) {
      G.lastPulse = cycle;
      if (G.mode === 'play' || G.mode === 'title') audio.spark();
      for (let i = 0; i < G.wires.length; i++) {
        const w = G.wires[i];
        if (w.cut || (w.fake && (w.tell === 'dead' || w.tell === 'ghost' || w.tell === 'gap'))) continue;
        const p = atU(w, w.fake && w.tell === 'reverse' ? 0.98 : 0.02);
        addRing(p.x, p.y, false);
      }
    }
    for (let i = 0; i < G.wires.length; i++) {
      const w = G.wires[i];
      const prev = w.sparkOn ? w.sparkU : -1;
      const u = sparkU(w, t);
      w.sparkOn = u != null;
      w.sparkU = u || 0;
      if (w.fake && w.tell === 'die' && prev >= 0 && u == null) {
        const p = atU(w, w.dieAt);
        emit(6, {
          x: p.x, y: p.y, j: 4,
          vx0: -30, vx1: 30, vy0: -40, vy1: 10,
          life: 0.32, r0: 0.8, r1: 1.8, mag: true, g: 200
        });
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.snipT = Math.max(0, G.snipT - dt);
    if (G.dump > 0) G.dump = Math.max(0, G.dump - dt * 0.85);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    for (let i = 0; i < G.wires.length; i++) {
      const w = G.wires[i];
      if (w.cut) w.rec = Math.min(1, w.rec + dt * 1.8);
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
      if (rings[i].t > 0.5) rings.splice(i, 1);
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.life -= dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy -= 30 * dt;
      if (e.life <= 0) embers.splice(i, 1);
    }

    const burned = G.mode === 'play' ? 1 - G.time / Math.max(0.01, G.timeMax) : (G.mode === 'title' ? (Math.sin(G.clock * 0.25) * 0.5 + 0.5) * 0.22 : G.coreHot);
    const fuseX = lerp(74, 406, clamp(burned, 0, 1));
    if ((G.mode === 'play' || G.mode === 'title') && Math.random() < dt * 18) {
      embers.push({
        x: fuseX + rand(-3, 3),
        y: 84 + rand(-2, 2),
        vx: rand(-12, 18),
        vy: rand(-40, -10),
        life: rand(0.25, 0.55),
        r: rand(0.8, 1.6)
      });
      if (embers.length > 40) embers.shift();
    }
  }

  function updateShears(dt) {
    const targetOpen = G.snipT > 0.12 ? 0.08 : 0.34;
    G.shearsOpen = lerp(G.shearsOpen, targetOpen, 1 - Math.exp(-18 * dt));
    let tx = G.shearsX;
    let ty = G.shearsY;
    let ta = G.shearsA;
    if (ptr.down) {
      tx = ptr.x;
      ty = ptr.y;
      ta = ptr.ang;
    } else if (G.sel >= 0 && G.wires[G.sel] && !G.wires[G.sel].cut) {
      const u = atY(G.wires[G.sel], CUT_Y);
      const p = atU(G.wires[G.sel], u);
      tx = p.x;
      ty = p.y;
      ta = Math.atan2(p.ty, p.tx) + Math.PI * 0.5;
    }
    G.shearsX = lerp(G.shearsX, tx, 1 - Math.exp(-14 * dt));
    G.shearsY = lerp(G.shearsY, ty, 1 - Math.exp(-14 * dt));
    let da = ta - G.shearsA;
    while (da > Math.PI) da -= TAU;
    while (da < -Math.PI) da += TAU;
    G.shearsA += da * (1 - Math.exp(-10 * dt));
  }

  function updateHover() {
    if (G.mode !== 'play' && G.mode !== 'title') {
      G.hover = -1;
      return;
    }
    let best = 22;
    let idx = -1;
    const px = ptr.x;
    const py = ptr.y;
    if (!ptr.down && ptr.id == null && !ptr.hover) {
      G.hover = -1;
      return;
    }
    for (let i = 0; i < G.wires.length; i++) {
      const w = G.wires[i];
      if (w.cut) continue;
      const h = distToWire(w, px, py);
      if (h.d < best) {
        best = h.d;
        idx = i;
      }
    }
    G.hover = idx;
  }

  function trySwipeCut() {
    if (!canCut() || !ptr.down || ptr.snipped) return;
    const drag = hypot(ptr.x - ptr.sx, ptr.y - ptr.sy);
    if (drag < 26) return;
    let bestI = -1;
    let bestD = 16;
    let bestU = 0.5;
    for (let i = 0; i < G.wires.length; i++) {
      const w = G.wires[i];
      if (w.cut) continue;
      const h = segHitsWire(w, ptr.lx, ptr.ly, ptr.x, ptr.y);
      if (h.d < bestD) {
        bestD = h.d;
        bestI = i;
        bestU = h.u;
      }
    }
    if (bestI >= 0) {
      ptr.snipped = true;
      cutWire(bestI, bestU);
    }
  }

  function updatePlay(dt) {
    G.time -= dt;
    const hot = 1 - G.time / Math.max(0.01, G.timeMax);
    G.coreHot = lerp(G.coreHot, hot, 1 - Math.exp(-3 * dt));
    if (G.time < G.warnAt) {
      audio.warn();
      G.warnAt = G.time < 2 ? G.time - 0.5 : G.time - 1;
    }
    if (G.time <= 0) {
      G.time = 0;
      beginBoom('time', VW * 0.5, 610);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.pulseT += dt;
    if (G.mode === 'title') {
      G.coreHot = 0.12 + Math.sin(G.clock * 1.4) * 0.04;
    } else if (G.mode === 'play') {
      updatePlay(dt);
    } else if (G.mode === 'clear') {
      G.settle -= dt;
      G.coreHot = lerp(G.coreHot, 0.05, 1 - Math.exp(-4 * dt));
      if (G.settle <= 0 && G.mode === 'clear') startStage(G.stage + 1);
    } else if (G.mode === 'boom') {
      G.settle -= dt;
      G.coreHot = Math.min(1, G.coreHot + dt * 1.2);
      if (G.settle <= 0) failStage();
    } else if (G.mode === 'win') {
      G.coreHot = lerp(G.coreHot, 0.04, 1 - Math.exp(-2 * dt));
    }
    updateSparks(dt);
    updateShears(dt);
    updateFx(dt);
    if (ptr.down || ptr.hover) updateHover();
    else G.hover = -1;
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
    g.addColorStop(0, 'rgba(255, 61, 184, 0.15)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(70), 8, sx(400), sy(70), 260 * scale);
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
    vg.addColorStop(0, 'rgba(18, 8, 36, 0.9)');
    vg.addColorStop(0.5, 'rgba(8, 6, 20, 0.2)');
    vg.addColorStop(1, 'rgba(10, 6, 28, 0.6)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.clock * 0.7 + m.p));
      ctx.fillStyle = rgb(i % 2 ? CYN : MAG, a);
      ctx.beginPath();
      ctx.arc(sx(m.x + Math.sin(G.clock * 0.3 + m.p) * m.s * 0.15), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function cutOffset(w, u, p) {
    if (!w.cut) return p;
    const rec = ease(w.rec);
    const side = u < w.cutS ? 1 : -1;
    const fall = u >= w.cutS ? rec * rec * 70 : rec * -10;
    return {
      x: p.x + w.nx * rec * 7 * side + w.tx * rec * 6 * (u < w.cutS ? -1 : 1),
      y: p.y + w.ny * rec * 7 * side + fall,
      tx: p.tx,
      ty: p.ty,
      nx: p.nx,
      ny: p.ny
    };
  }

  function pathRuns(w) {
    const g0 = w.gapSize ? w.gapAt - w.gapSize * 0.5 : -1;
    const g1 = w.gapSize ? w.gapAt + w.gapSize * 0.5 : -1;
    const runs = [];
    let run = [];
    for (let i = 0; i < w.pts.length; i++) {
      const u = w.dist[i] / w.len;
      const inGap = g0 >= 0 && u >= g0 && u <= g1;
      const splitCut = w.cut && run.length && ((w.dist[i - 1] / w.len < w.cutS) !== (u < w.cutS));
      if (inGap || splitCut) {
        if (run.length) {
          runs.push(run);
          run = [];
        }
        if (splitCut && !inGap) run.push(w.pts[i]);
      } else {
        run.push(w.pts[i]);
      }
    }
    if (run.length) runs.push(run);
    return runs;
  }

  function strokeRun(run, w, width, color, alpha) {
    if (run.length < 2) return;
    ctx.beginPath();
    for (let i = 0; i < run.length; i++) {
      const u = distOfPoint(w, run[i]);
      const p = cutOffset(w, u, run[i]);
      if (i === 0) ctx.moveTo(sx(p.x), sy(p.y));
      else ctx.lineTo(sx(p.x), sy(p.y));
    }
    ctx.strokeStyle = rgb(color, alpha);
    ctx.lineWidth = width * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function distOfPoint(w, p) {
    let best = 0;
    let bd = 1e9;
    for (let i = 0; i < w.pts.length; i++) {
      const d = hypot(w.pts[i].x - p.x, w.pts[i].y - p.y);
      if (d < bd) {
        bd = d;
        best = w.dist[i] / w.len;
      }
    }
    return best;
  }

  function drawWires() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.save();
    ctx.setLineDash([7 * scale, 8 * scale]);
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.16)';
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(48), sy(CUT_Y - 28));
    ctx.lineTo(sx(VW - 48), sy(CUT_Y - 28));
    ctx.moveTo(sx(48), sy(CUT_Y + 28));
    ctx.lineTo(sx(VW - 48), sy(CUT_Y + 28));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.font = '600 ' + Math.max(10, 11 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.fillText('剪口', sx(VW * 0.5), sy(CUT_Y - 38));

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < G.wires.length; i++) {
        const w = G.wires[i];
        const hot = i === G.sel || i === G.hover;
        const col = w.cut && !w.fake ? mix(w.col, MAG, 0.45) : w.col;
        const runs = pathRuns(w);
        if (pass === 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const ga = (w.fake && w.tell === 'dead' ? 0.08 : 0.22) * w.glow;
          for (let r = 0; r < runs.length; r++) strokeRun(runs[r], w, hot ? 14 : 11, col, ga);
          ctx.restore();
        } else {
          const dim = w.fake && w.tell === 'dead' ? 0.55 : 0.95;
          for (let r = 0; r < runs.length; r++) {
            strokeRun(runs[r], w, 5.4, mix(col, { r: 10, g: 8, b: 22 }, 0.35), 1);
            strokeRun(runs[r], w, 3.2, col, dim);
            strokeRun(runs[r], w, 1.15, { r: 255, g: 255, b: 255 }, hot ? 0.38 : 0.16);
          }
          if (w.gapSize > 0 && !w.cut) {
            const a = atU(w, w.gapAt - w.gapSize * 0.5);
            const b = atU(w, w.gapAt + w.gapSize * 0.5);
            drawNub(a.x, a.y, col);
            drawNub(b.x, b.y, col);
          }
        }
      }
    }

    for (let i = 0; i < G.wires.length; i++) {
      const w = G.wires[i];
      if (w.fake && w.tell === 'ghost' && !w.cut) {
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(G.clock * TAU / Math.max(0.4, G.pulse)));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const runs = pathRuns(w);
        for (let r = 0; r < runs.length; r++) strokeRun(runs[r], w, 7, CYN, 0.12 * pulse);
        ctx.restore();
      }
      if (w.sparkOn && !w.cut) {
        const p = atU(w, w.sparkU);
        drawBead(p.x, p.y, w.col, w.fake && w.tell === 'reverse');
        const trail = 0.09;
        for (let k = 1; k <= 4; k++) {
          const uu = w.tell === 'reverse' && w.fake ? w.sparkU + trail * k * 0.25 : w.sparkU - trail * k * 0.25;
          if (uu < 0 || uu > 1) continue;
          if (w.fake && w.tell === 'die' && uu > w.dieAt) continue;
          const q = atU(w, uu);
          ctx.fillStyle = rgb(w.col, 0.18 * (1 - k / 5));
          ctx.beginPath();
          ctx.arc(sx(q.x), sy(q.y), (3.2 - k * 0.45) * scale, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function drawNub(x, y, col) {
    ctx.fillStyle = '#2a1a12';
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 3.4 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgb(mix(col, GOLD, 0.4), 0.9);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 1.8 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBead(x, y, col, reverse) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const r = 5.2 * scale;
    const grd = ctx.createRadialGradient(sx(x) - r * 0.2, sy(y) - r * 0.2, r * 0.1, sx(x), sy(y), r * 2.1);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.28, rgb(col, 0.9));
    grd.addColorStop(1, rgb(reverse ? MAG : col, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), r * 2.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 2.1 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSource() {
    const x = 48;
    const y = 70;
    const w = 384;
    const h = 92;
    roundRect(ctx, sx(x), sy(y), w * scale, h * scale, 14 * scale);
    ctx.fillStyle = '#0b0818';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    roundRect(ctx, sx(x + 10), sy(y + 8), (w - 20) * scale, 16 * scale, 6 * scale);
    ctx.fillStyle = '#05030c';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.25)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    const burned = G.mode === 'play'
      ? 1 - G.time / Math.max(0.01, G.timeMax)
      : (G.mode === 'boom' ? 1 : 0.12 + Math.sin(G.clock * 0.4) * 0.04);
    const x0 = x + 22;
    const x1 = x + w - 22;
    const fuseY = y + 16;
    const burnX = lerp(x0, x1, clamp(burned, 0, 1));

    ctx.strokeStyle = 'rgba(40, 28, 48, 0.9)';
    ctx.lineWidth = 4.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(fuseY));
    ctx.lineTo(sx(burnX), sy(fuseY));
    ctx.stroke();

    ctx.strokeStyle = rgb(mix(GOLD, MAG, clamp(burned, 0, 1)), 0.95);
    ctx.lineWidth = 3.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(burnX), sy(fuseY));
    ctx.lineTo(sx(x1), sy(fuseY));
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgb(MAG, 0.85);
    ctx.beginPath();
    ctx.arc(sx(burnX), sy(fuseY), (3.2 + Math.sin(G.clock * 18) * 0.6) * scale, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.font = '700 ' + Math.max(11, 12 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('源', sx(VW * 0.5), sy(y + 38));

    for (let i = 0; i < 3; i++) {
      const px = SRCX[i];
      const py = SRC_Y;
      ctx.fillStyle = '#05030c';
      ctx.beginPath();
      ctx.arc(sx(px), sy(py), 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgb(G.wires[i] ? G.wires[i].col : CYN, 0.8);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
      const live = G.wires[i] && !G.wires[i].fake && !G.wires[i].cut;
      const blink = live ? 0.45 + 0.55 * Math.max(0, 1 - ((G.clock / G.pulse) % 1) * 3) : 0.12;
      ctx.fillStyle = rgb(G.wires[i] ? G.wires[i].col : CYN, 0.25 + blink * 0.7);
      ctx.beginPath();
      ctx.arc(sx(px), sy(py), 3.2 * scale, 0, TAU);
      ctx.fill();

      ctx.fillStyle = rgb(G.wires[i] ? G.wires[i].col : CYN, 0.55);
      ctx.font = '600 ' + Math.max(10, 11 * scale) + 'px "Segoe UI",sans-serif';
      ctx.fillText(String(i + 1), sx(px), sy(y + 54));
    }
  }

  function drawCore() {
    const cx = VW * 0.5;
    const cy = 612;
    const hot = clamp(G.coreHot, 0, 1);
    const beat = 1 + Math.sin(G.clock * (3 + hot * 7)) * (0.04 + hot * 0.06);

    ctx.save();
    ctx.translate(sx(cx), sy(cy));
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 38 * scale, 78 * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();

    roundRect(ctx, -92 * scale, -58 * scale, 184 * scale, 108 * scale, 22 * scale);
    ctx.fillStyle = '#0b0818';
    ctx.fill();
    ctx.strokeStyle = rgb(mix(CYN, MAG, hot), 0.55 + hot * 0.35);
    ctx.lineWidth = 1.7 * scale;
    ctx.stroke();

    ctx.font = '700 ' + Math.max(11, 12 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgb(mix(CYN, MAG, hot), 0.7);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('芯', 0, 34 * scale);

    for (let i = 0; i < 3; i++) {
      const w = G.wires[i];
      const dx = DSTX[w ? w.destI : i];
      const dy = DST_Y;
      const seated = !(w && w.fake && w.tell === 'unseat');
      ctx.fillStyle = '#05030c';
      ctx.beginPath();
      ctx.arc(sx(dx) - sx(cx), sy(dy) - sy(cy), 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = seated ? rgb(w ? w.col : CYN, 0.75) : 'rgba(255, 61, 184, 0.55)';
      ctx.setLineDash(seated ? [] : [3 * scale, 3 * scale]);
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.setLineDash([]);
      if (seated) {
        ctx.fillStyle = rgb(w ? w.col : CYN, 0.55);
        ctx.beginPath();
        ctx.arc(sx(dx) - sx(cx), sy(dy) - sy(cy), 2.6 * scale, 0, TAU);
        ctx.fill();
      }
    }

    const r = 22 * beat * scale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r * 2.4);
    grd.addColorStop(0, 'rgba(255,255,255,0.85)');
    grd.addColorStop(0.25, rgb(mix(CYN, MAG, hot), 0.8));
    grd.addColorStop(1, rgb(mix(CYN, MAG, hot), 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.3, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = rgb(mix({ r: 40, g: 16, b: 48 }, MAG, hot), 1);
    ctx.beginPath();
    ctx.arc(0, 0, 16 * beat * scale, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgb(mix(GOLD, MAG, hot), 0.85);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    ctx.restore();

    if (G.mode === 'play' && G.time < 5) {
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.12 * Math.sin(G.clock * 8);
      ctx.strokeStyle = rgb(MAG, 1);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), (70 + (5 - G.time) * 4) * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShears() {
    const x = G.shearsX;
    const y = G.shearsY;
    const open = G.shearsOpen;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.shearsA);
    const sc = scale;
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.rotate(side * open);
      ctx.beginPath();
      ctx.moveTo(4 * sc, side * 2 * sc);
      ctx.lineTo(36 * sc, side * 6.5 * sc);
      ctx.lineTo(52 * sc, side * 2.2 * sc);
      ctx.quadraticCurveTo(56 * sc, 0, 50 * sc, -side * 2.4 * sc);
      ctx.lineTo(10 * sc, -side * 4.5 * sc);
      ctx.closePath();
      ctx.fillStyle = '#14101f';
      ctx.fill();
      ctx.strokeStyle = side < 0 ? rgb(MAG, 0.85) : rgb(CYN, 0.85);
      ctx.lineWidth = 1.4 * sc;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(14 * sc, side * 1.2 * sc);
      ctx.lineTo(46 * sc, side * 1.6 * sc);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1 * sc;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-10 * sc, side * 9 * sc, 6.2 * sc, 0, TAU);
      ctx.fillStyle = '#0b0818';
      ctx.fill();
      ctx.strokeStyle = side < 0 ? rgb(MAG, 0.9) : rgb(CYN, 0.9);
      ctx.lineWidth = 1.6 * sc;
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 3.4 * sc, 0, TAU);
    ctx.fillStyle = rgb(GOLD, 0.95);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.gold ? rgb(GOLD, a) : p.mag ? rgb(MAG, a) : rgb(CYN, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale * (0.6 + a * 0.6), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.5;
      ctx.strokeStyle = rgb(r.mag ? MAG : CYN, 0.45 * (1 - k));
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (6 + k * 22) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      const a = clamp(e.life / 0.55, 0, 1);
      ctx.fillStyle = rgb(mix(GOLD, MAG, 1 - a), a);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), e.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.22) + ')';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.14) + ')';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function draw() {
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawSource();
    drawWires();
    drawCore();
    drawShears();
    drawParticles();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawFlash();
    ctx.restore();
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * W;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * H;
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
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'ArrowDown')) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      if (!overlay.classList.contains('hidden')) {
        e.preventDefault();
        overlayAction();
        return;
      }
    }
    if (G.mode !== 'play') return;
    if (k === '1') selectWire(0);
    if (k === '2') selectWire(1);
    if (k === '3') selectWire(2);
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'q' || k === 'Q') {
      selectWire((G.sel + 2) % 3);
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'e' || k === 'E') {
      selectWire((G.sel + 1) % 3);
    }
    if (k === ' ' || k === 'Spacebar' || k === 'Enter') {
      cutWire(G.sel, atY(G.wires[G.sel], CUT_Y));
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const w = worldFromEvent(e);
    ptr.down = true;
    ptr.hover = true;
    ptr.id = e.pointerId;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.sx = w.x;
    ptr.sy = w.y;
    ptr.lx = w.x;
    ptr.ly = w.y;
    ptr.drag = false;
    ptr.snipped = false;
    canvas.classList.add('drag');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
    updateHover();
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    if (ptr.down && (ptr.id == null || e.pointerId === ptr.id)) {
      ptr.lx = ptr.x;
      ptr.ly = ptr.y;
      ptr.x = w.x;
      ptr.y = w.y;
      const dx = ptr.x - ptr.sx;
      const dy = ptr.y - ptr.sy;
      if (hypot(dx, dy) > 10) ptr.drag = true;
      if (ptr.drag) ptr.ang = Math.atan2(ptr.y - ptr.ly, ptr.x - ptr.lx);
      trySwipeCut();
    } else {
      ptr.x = w.x;
      ptr.y = w.y;
      ptr.hover = true;
      updateHover();
    }
    if (e.pointerType === 'mouse') ptr.hover = true;
  });

  function endPtr(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && !ptr.snipped && !ptr.drag && canCut()) {
      updateHover();
      if (G.hover >= 0) {
        if (G.sel === G.hover) cutWire(G.sel, atY(G.wires[G.sel], CUT_Y));
        else selectWire(G.hover);
      }
    }
    ptr.down = false;
    ptr.id = null;
    canvas.classList.remove('drag');
    if (e.pointerType !== 'mouse') ptr.hover = false;
  }

  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') ptr.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });

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
  btnCut.addEventListener('click', function () {
    audio.ensure();
    if (canCut()) cutWire(G.sel, atY(G.wires[G.sel], CUT_Y));
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
