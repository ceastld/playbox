'use strict';

(function () {
  const VW = 480;
  const VH = 800;
  const CX = 240;
  const MARGIN = 22;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SEG = 7;
  const TIP_R = 6.6;
  const ACC = 2100;
  const MAX_SPD = 268;
  const FRIC = 7.1;
  const MUTE_KEY = 'playbox-vine-climb-mute';
  const OPS = 'WASD / 方向键移灯 · 按住拖动 · M 静音';

  const STAGES = [
    {
      name: '初芽', sub: 'FIRST',
      hint: '把灯举到月花边，藤会朝光爬上去',
      toast: '藤朝灯长 · 灯摆到花边',
      time: 40, grow: 72, turn: 3.12, len: 980,
      start: { x: 240, y: 560 },
      pot: { x: 240, y: 742 },
      bloom: { x: 240, y: 118, r: 30 }
    },
    {
      name: '绕石', sub: 'ROCK',
      hint: '灯先摆到石角，藤弯了再引过去',
      toast: '光能穿石，藤不能',
      time: 44, grow: 74, turn: 2.92, len: 1280,
      start: { x: 240, y: 640 },
      pot: { x: 240, y: 742 },
      bloom: { x: 240, y: 108, r: 28 },
      walls: [{ x: 168, y: 356, w: 144, h: 74 }]
    },
    {
      name: '窄缝', sub: 'SLIT',
      hint: '先把灯摆到缝口，穿过去再折向花',
      toast: '缝在中间 · 灯走缝，藤才过',
      time: 46, grow: 76, turn: 2.78, len: 1520,
      start: { x: 240, y: 660 },
      pot: { x: 240, y: 742 },
      bloom: { x: 372, y: 108, r: 28 },
      walls: [
        { x: 0, y: 478, w: 178, h: 50 },
        { x: 278, y: 478, w: 202, h: 50 },
        { x: 0, y: 268, w: 308, h: 48 }
      ]
    },
    {
      name: '避火', sub: 'EMBER',
      hint: '火会烧焦嫩芽，把灯绕到外侧',
      toast: '别让芽碰到火心',
      time: 44, grow: 78, turn: 2.68, len: 1240,
      start: { x: 120, y: 640 },
      pot: { x: 240, y: 742 },
      bloom: { x: 240, y: 108, r: 28 },
      fires: [{ x: 240, y: 412, r: 40 }]
    },
    {
      name: '剪口', sub: 'SHEAR',
      hint: '灯贴着芽能让藤停。等剪口张开再拉过去',
      toast: '剪口剪的是嫩芽 · 张开再过',
      time: 48, grow: 80, turn: 2.58, len: 1200,
      start: { x: 240, y: 640 },
      pot: { x: 240, y: 742 },
      bloom: { x: 240, y: 108, r: 28 },
      shears: [{ y: 392, h: 16, cx: 240, gap: 108, period: 2.7, ph: 0.85 }]
    },
    {
      name: '横风', sub: 'GUST',
      hint: '青带往右推。灯要摆到上风，把藤拽回来',
      toast: '风会推芽 · 灯放左边',
      time: 46, grow: 82, turn: 2.52, len: 1320,
      start: { x: 180, y: 640 },
      pot: { x: 240, y: 742 },
      bloom: { x: 132, y: 108, r: 28 },
      winds: [{ y: 292, h: 128, vx: 46, osc: 16, period: 2.5, ph: 0 }]
    },
    {
      name: '盘折', sub: 'FOLD',
      hint: '灯走 S。每到拐角先停一下再引',
      toast: '三折廊 · 灯贴着角走',
      time: 52, grow: 84, turn: 2.42, len: 1780,
      start: { x: 240, y: 680 },
      pot: { x: 240, y: 742 },
      bloom: { x: 368, y: 100, r: 27 },
      walls: [
        { x: 0, y: 548, w: 328, h: 46 },
        { x: 152, y: 382, w: 328, h: 46 },
        { x: 0, y: 228, w: 308, h: 46 }
      ]
    },
    {
      name: '自缠', sub: 'COIL',
      hint: '藤碰到自己会断。绕柱上去，别抄近道',
      toast: '别让嫩芽蹭到老藤',
      time: 50, grow: 86, turn: 2.36, len: 1560,
      start: { x: 110, y: 660 },
      pot: { x: 240, y: 742 },
      bloom: { x: 240, y: 102, r: 27 },
      self: true,
      walls: [{ x: 196, y: 268, w: 88, h: 292 }],
      fires: [{ x: 240, y: 196, r: 26 }]
    },
    {
      name: '夜廊', sub: 'HALL',
      hint: '绕火、等剪、穿廊。一次引一路',
      toast: '剪口在动 · 对准缺口',
      time: 54, grow: 90, turn: 2.28, len: 1720,
      start: { x: 240, y: 680 },
      pot: { x: 240, y: 742 },
      bloom: { x: 240, y: 96, r: 26 },
      walls: [
        { x: 86, y: 548, w: 42, h: 150 },
        { x: 352, y: 548, w: 42, h: 150 },
        { x: 0, y: 430, w: 178, h: 40 },
        { x: 302, y: 430, w: 178, h: 40 }
      ],
      fires: [{ x: 240, y: 248, r: 30 }],
      shears: [{ y: 348, h: 15, cx: 240, gap: 112, period: 2.55, ph: 0.2, move: 32, mspd: 0.7, mph: 0.4 }]
    },
    {
      name: '月台', sub: 'MOON',
      hint: '风、火、剪、折。一只芽送到月花',
      toast: '终台 · 灯在芽前',
      time: 58, grow: 94, turn: 2.18, len: 1980,
      start: { x: 300, y: 680 },
      pot: { x: 240, y: 742 },
      bloom: { x: 318, y: 92, r: 26 },
      self: true,
      walls: [
        { x: 0, y: 600, w: 286, h: 42 },
        { x: 196, y: 428, w: 284, h: 42 },
        { x: 0, y: 214, w: 214, h: 40 }
      ],
      fires: [
        { x: 378, y: 340, r: 26 },
        { x: 168, y: 160, r: 22 }
      ],
      shears: [{ y: 306, h: 14, cx: 210, gap: 124, period: 2.6, ph: 0.05, move: 22, mspd: 0.55, mph: 0 }],
      winds: [{ y: 500, h: 72, vx: 38, osc: 14, period: 2.2, ph: 0.3 }]
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
  const distLabel = document.getElementById('dist-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse) hintEl.textContent = '按住拖灯 · 藤朝光长 · 送到月花';

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, touch: false, x: CX, y: 560, id: null };
  const particles = [];
  const motes = [];
  const stars = [];
  const tufts = [];
  const pips = [];
  const rings = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 40,
    timeMax: 40,
    px: CX,
    py: 560,
    pvx: 0,
    pvy: 0,
    pot: { x: CX, y: 742 },
    bloom: { x: CX, y: 118, r: 30 },
    tx: CX,
    ty: 736,
    hd: -Math.PI / 2,
    pts: [],
    leaves: [],
    used: 0,
    maxLen: 980,
    walls: [],
    fires: [],
    shears: [],
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    lock: 0,
    settle: 0,
    toastT: 0,
    why: '',
    reached: false,
    taught: false,
    wallTaught: false,
    fireTaught: false,
    shearTaught: false,
    windTaught: false,
    selfTaught: false,
    timeTaught: false,
    nearTaught: false,
    warnT: 0,
    whooshT: 0,
    rustle: 0,
    growTick: 0,
    danger: 0,
    wither: 0,
    bloomOpen: 0,
    pulse: 0
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
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function angNorm(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
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
      this.beep(330, 0.1, 'sine', 0.04, 523);
      this.beep(523, 0.16, 'triangle', 0.028, 784);
    },
    grow() {
      this.ensure();
      this.beep(620 + Math.random() * 80, 0.045, 'sine', 0.012);
    },
    rustle() {
      this.ensure();
      this.noise(0.07, 0.018, 1400);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.08, 'sine', 0.03, 140);
    },
    whoosh() {
      this.ensure();
      this.noise(0.08, 0.02, 1500);
    },
    burn() {
      this.ensure();
      this.noise(0.22, 0.075, 380);
      this.beep(180, 0.26, 'sawtooth', 0.045, 60);
    },
    snip() {
      this.ensure();
      this.beep(1480, 0.06, 'square', 0.04, 420);
      this.noise(0.1, 0.04, 1800);
    },
    thud() {
      this.ensure();
      this.beep(90, 0.18, 'sine', 0.06, 40);
      this.noise(0.12, 0.04, 220);
    },
    wrap() {
      this.ensure();
      this.beep(196, 0.16, 'triangle', 0.04, 90);
      this.noise(0.14, 0.03, 600);
    },
    tick() {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.018);
    },
    bloom() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05, 659);
      this.beep(784, 0.16, 'triangle', 0.04, 1046);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05, 523);
      this.beep(659, 0.12, 'sine', 0.045, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.16, 'sine', 0.055);
      this.beep(1046, 0.34, 'triangle', 0.065, 1560);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 220) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.5, spec.j * 0.5),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.18),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        cyan: !!spec.cyan,
        g: spec.g == null ? 40 : spec.g
      });
    }
  }

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag });
    if (rings.length > 22) rings.shift();
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
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function distBloom() {
    return hypot2(G.tx - G.bloom.x, G.ty - G.bloom.y);
  }

  function remain() {
    return Math.max(0, G.maxLen - G.used);
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const left = remain();
    const k = G.maxLen ? clamp(left / G.maxLen, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = Math.round(k * 100) + '%';
    const near = G.mode === 'play' && distBloom() < G.bloom.r * 2.4;
    const low = G.mode === 'play' && k < 0.18 && !G.reached;
    fillWrap.classList.toggle('hot', G.mode === 'play' && G.reached);
    fillWrap.classList.toggle('warn', low);
    if (G.mode === 'title') {
      stageLabel.textContent = '十台';
      distLabel.textContent = '引藤';
      timeLabel.textContent = '朝光';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 台 · ' + (st ? st.name : '');
      const d = Math.round(distBloom());
      distLabel.textContent = G.reached ? '已及' : (d < 48 ? '将及' : '距花 ' + d);
      timeLabel.textContent = Math.max(0, Math.ceil(G.time)) + 's';
    }
    stageLabel.classList.toggle('hot', G.mode === 'play' && G.reached);
    distLabel.classList.toggle('hot', G.mode === 'play' && near);
    timeLabel.classList.toggle('warn', G.mode === 'play' && G.time < 8);
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

  function windAt(y) {
    const st = STAGES[G.stage];
    if (!st || !st.winds) return 0;
    let wx = 0;
    for (let i = 0; i < st.winds.length; i++) {
      const b = st.winds[i];
      if (y >= b.y && y <= b.y + b.h) {
        wx += b.vx + Math.sin(G.clock * TAU / (b.period || 3) + (b.ph || 0)) * (b.osc || 0);
      }
    }
    return wx;
  }

  function shearCx(s) {
    return s.cx + Math.sin(G.clock * (s.mspd || 0) + (s.mph || 0)) * (s.move || 0);
  }

  function shearOpen(s) {
    const T = s.period || 2.6;
    let t = (G.clock + (s.ph || 0)) % T;
    if (t < 0) t += T;
    const u = t / T;
    if (u < 0.42) return 1;
    if (u < 0.52) return 1 - (u - 0.42) / 0.1;
    if (u < 0.86) return 0;
    return (u - 0.86) / 0.14;
  }

  function tipInShear(x, y, s) {
    const half = s.h * 0.5 + TIP_R * 0.55;
    if (y < s.y - half || y > s.y + half) return false;
    const gw = lerp(4, s.gap, shearOpen(s));
    const cx = shearCx(s);
    return x < cx - gw * 0.5 || x > cx + gw * 0.5;
  }

  function hitRect(x, y, r, rec) {
    return x > rec.x - r && x < rec.x + rec.w + r && y > rec.y - r && y < rec.y + rec.h + r;
  }

  function wallAt(x, y) {
    for (let i = 0; i < G.walls.length; i++) {
      if (hitRect(x, y, TIP_R, G.walls[i])) return G.walls[i];
    }
    return null;
  }

  function fireAt(x, y) {
    for (let i = 0; i < G.fires.length; i++) {
      const f = G.fires[i];
      if (hypot2(x - f.x, y - f.y) < f.r * 0.92) return f;
    }
    return null;
  }

  function applyStage(st) {
    G.time = st.time;
    G.timeMax = st.time;
    G.pot = { x: st.pot.x, y: st.pot.y };
    G.bloom = { x: st.bloom.x, y: st.bloom.y, r: st.bloom.r };
    G.px = st.start.x;
    G.py = st.start.y;
    G.pvx = 0;
    G.pvy = 0;
    G.tx = st.pot.x;
    G.ty = st.pot.y - 8;
    G.hd = -Math.PI / 2;
    G.pts = [{ x: G.tx, y: G.ty + 10 }, { x: G.tx, y: G.ty }];
    G.leaves = [];
    G.used = 0;
    G.maxLen = st.len;
    G.walls = (st.walls || []).map(function (w) {
      return { x: w.x, y: w.y, w: w.w, h: w.h };
    });
    G.fires = (st.fires || []).map(function (f) {
      return { x: f.x, y: f.y, r: f.r, flick: rand(0, TAU) };
    });
    G.shears = st.shears || [];
    G.why = '';
    G.reached = false;
    G.wither = 0;
    G.bloomOpen = 0;
    G.danger = 0;
    G.wallTaught = false;
    G.fireTaught = false;
    G.shearTaught = false;
    G.windTaught = false;
    G.selfTaught = false;
    G.timeTaught = false;
    G.nearTaught = false;
    G.growTick = 0;
    G.rustle = 0;
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.22;
    G.settle = 0;
    G.taught = G.taught && fromFail;
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
    applyStage(STAGES[0]);
    showOverlay(
      'title',
      '藤上',
      '藤只朝光长。把灯摆到花边，<br />嫩芽会跟着爬上去。',
      '摆灯',
      'VINE',
      OPS
    );
    setHint(coarse ? '按住拖灯 · 藤朝光长 · 送到月花' : '灯在芽前，藤朝光长 · 送到月花', '');
    syncHud();
  }

  function failCopy(why) {
    const map = {
      wall: ['撞墙', '嫩芽撞上石头了。光能穿石，藤不能。', 'STONE'],
      fire: ['焦芽', '火把嫩芽烧焦了。', 'EMBER'],
      shear: ['剪断', '剪口把嫩芽剪断了。', 'SHEAR'],
      self: ['自缠', '藤缠到自己了。', 'COIL'],
      len: ['藤尽', '藤长尽了，还没碰到花。', 'SPENT'],
      time: ['夜尽', '夜尽了，月花还没开。', 'DUSK'],
      bound: ['出园', '藤爬出园子了。', 'EDGE']
    };
    return map[why] || map.wall;
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const m = failCopy(why);
    showOverlay(
      'lose',
      m[0],
      more ? m[1] + '<br />还剩 ' + G.lives + ' 次。' : m[1] + '<br />十台未完。',
      more ? '再引本台' : '再来一局',
      m[2]
    );
    setHint(m[0], 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.85;
    G.goldFlash = 0.85;
    audio.clear();
    toast(STAGES[G.stage].name + ' · 花开', false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '藤上月台',
        '十台月花都开了。灯在前，藤在后。',
        '再爬一巡',
        'MOON'
      );
      setHint('十台花开', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 1.05;
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

  function beginFail(why) {
    if (G.mode !== 'play' || G.why) return;
    G.why = why;
    G.magFlash = 0.78;
    G.shake = 12;
    G.lock = 0.78;
    if (why === 'fire') audio.burn();
    else if (why === 'shear') audio.snip();
    else if (why === 'self') audio.wrap();
    else if (why === 'wall' || why === 'bound') audio.thud();
    else audio.warn();
    const msg = failCopy(why)[0];
    toast(msg, true);
    setHint(failCopy(why)[1], 'warn');
    addRing(G.tx, G.ty, true);
    emit(18, {
      x: G.tx, y: G.ty, j: 10,
      vx0: -140, vx1: 140, vy0: -120, vy1: 80,
      life: 0.62, r0: 1.1, r1: 3.2,
      mag: true, gold: why === 'fire', g: 50
    });
  }

  function reachBloom() {
    if (G.reached) return;
    G.reached = true;
    G.bloomOpen = 1;
    G.goldFlash = 0.5;
    G.pulse = 1;
    addRing(G.bloom.x, G.bloom.y, false);
    emit(16, {
      x: G.bloom.x, y: G.bloom.y, j: 10,
      vx0: -70, vx1: 70, vy0: -110, vy1: -8,
      life: 0.7, r0: 1.1, r1: 2.8, cyan: true, gold: true, g: -20
    });
    if (G.mode === 'play') {
      audio.bloom();
      toast('花开了', false, true);
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
    tufts.length = 0;
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: rand(10, VW - 10),
        y: rand(8, 380),
        r: rand(0.45, 1.45),
        a: rand(0.2, 0.82),
        p: rand(0, TAU),
        tw: rand(1.1, 3.2)
      });
    }
    for (let i = 0; i < 34; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(60, VH - 40),
        r: rand(0.55, 1.55),
        a: rand(0.05, 0.16),
        p: rand(0, TAU),
        s: rand(6, 16)
      });
    }
    for (let i = 0; i < 20; i++) {
      tufts.push({
        x: rand(16, VW - 16),
        y: rand(700, 790),
        h: rand(8, 20),
        p: rand(0, TAU)
      });
    }
  }

  function titleLamp() {
    const t = (G.clock * 0.2) % 7.4;
    if (t > 6.2) return { x: G.bloom.x, y: G.bloom.y };
    const u = t / 6.2;
    const bulge = Math.sin(u * Math.PI) * 92;
    return {
      x: CX + bulge,
      y: lerp(610, 128, u * u * 0.15 + u * 0.85)
    };
  }

  function updatePlayer(dt, auto) {
    const playing = G.mode === 'play' || G.mode === 'title';
    if (!playing) {
      G.pvx *= Math.exp(-dt * 6);
      G.pvy *= Math.exp(-dt * 6);
      G.px = clamp(G.px + G.pvx * dt, MARGIN, VW - MARGIN);
      G.py = clamp(G.py + G.pvy * dt, 40, VH - 22);
      return;
    }

    if (auto) {
      const tgt = titleLamp();
      const dx = tgt.x - G.px;
      const dy = tgt.y - G.py;
      const d = hypot2(dx, dy);
      if (d > 3) {
        const spd = Math.min(MAX_SPD * 0.62, d * 3.2);
        G.pvx = (dx / d) * spd;
        G.pvy = (dy / d) * spd;
        G.px += G.pvx * dt;
        G.py += G.pvy * dt;
      } else {
        G.pvx = 0;
        G.pvy = 0;
      }
    } else {
      const usePtr = pointer.down || pointer.hover;
      if (usePtr) {
        let tx = pointer.x;
        let ty = pointer.y;
        if (pointer.touch) ty -= 36;
        tx = clamp(tx, MARGIN, VW - MARGIN);
        ty = clamp(ty, 40, VH - 22);
        const nx = lerp(G.px, tx, 1 - Math.exp(-14 * dt));
        const ny = lerp(G.py, ty, 1 - Math.exp(-14 * dt));
        G.pvx = (nx - G.px) / Math.max(dt, 0.001);
        G.pvy = (ny - G.py) / Math.max(dt, 0.001);
        G.px = nx;
        G.py = ny;
      } else {
        let ax = 0;
        let ay = 0;
        if (keys.l) ax -= ACC;
        if (keys.r) ax += ACC;
        if (keys.u) ay -= ACC;
        if (keys.d) ay += ACC;
        G.pvx += ax * dt;
        G.pvy += ay * dt;
        if (!keys.l && !keys.r) G.pvx *= Math.exp(-dt * FRIC);
        if (!keys.u && !keys.d) G.pvy *= Math.exp(-dt * FRIC);
        const spd = hypot2(G.pvx, G.pvy);
        if (spd > MAX_SPD) {
          G.pvx *= MAX_SPD / spd;
          G.pvy *= MAX_SPD / spd;
        }
        G.px += G.pvx * dt;
        G.py += G.pvy * dt;
      }
      if (G.px < MARGIN) { G.px = MARGIN; G.pvx *= 0.2; }
      if (G.px > VW - MARGIN) { G.px = VW - MARGIN; G.pvx *= 0.2; }
      if (G.py < 40) { G.py = 40; G.pvy *= 0.2; }
      if (G.py > VH - 22) { G.py = VH - 22; G.pvy *= 0.2; }
    }

    const pspd = hypot2(G.pvx, G.pvy);
    if (G.mode === 'play' && pspd > 210 && G.whooshT <= 0) {
      audio.whoosh();
      G.whooshT = 0.3;
    }
  }

  function probeDanger() {
    let dng = 0;
    const f = fireAt(G.tx, G.ty);
    if (f) dng = 1;
    else {
      for (let i = 0; i < G.fires.length; i++) {
        const fire = G.fires[i];
        const d = hypot2(G.tx - fire.x, G.ty - fire.y) - fire.r;
        if (d < 28) dng = Math.max(dng, clamp(1 - d / 28, 0, 1));
      }
    }
    if (wallAt(G.tx, G.ty)) dng = 1;
    else {
      for (let i = 0; i < G.walls.length; i++) {
        const w = G.walls[i];
        const cx = clamp(G.tx, w.x, w.x + w.w);
        const cy = clamp(G.ty, w.y, w.y + w.h);
        const d = hypot2(G.tx - cx, G.ty - cy);
        if (d < 22) dng = Math.max(dng, clamp(1 - d / 22, 0, 1));
      }
    }
    for (let i = 0; i < G.shears.length; i++) {
      const s = G.shears[i];
      if (Math.abs(G.ty - s.y) < s.h * 0.5 + 18) {
        const near = tipInShear(G.tx, G.ty, s) || Math.abs(G.ty - s.y) < s.h;
        if (near) dng = Math.max(dng, 0.7 + (1 - shearOpen(s)) * 0.3);
      }
    }
    return dng;
  }

  function updateVine(dt, canFail) {
    const st = STAGES[G.stage];
    if (!st) return;
    if (G.why) {
      G.wither = Math.min(1, G.wither + dt * 1.35);
      return;
    }
    if (G.reached) {
      G.bloomOpen = Math.min(1, G.bloomOpen + dt * 1.6);
      G.tx = lerp(G.tx, G.bloom.x, 1 - Math.exp(-3.2 * dt));
      G.ty = lerp(G.ty, G.bloom.y + 6, 1 - Math.exp(-3.2 * dt));
      return;
    }

    const dx = G.px - G.tx;
    const dy = G.py - G.ty;
    const d = hypot2(dx, dy);
    if (d > 0.5) {
      const want = Math.atan2(dy, dx);
      let diff = angNorm(want - G.hd);
      const maxT = st.turn * dt;
      if (diff > maxT) diff = maxT;
      else if (diff < -maxT) diff = -maxT;
      G.hd += diff;
      if (Math.abs(diff) > maxT * 0.72) G.rustle = Math.min(1, G.rustle + dt * 5);
    }

    let spd = st.grow;
    if (d < 24) spd *= clamp((d - 10) / 14, 0, 1);
    if (G.lock > 0) spd = 0;

    const ox0 = G.tx;
    const oy0 = G.ty;
    const wx = spd > 1.2 ? windAt(G.ty) : 0;
    if (spd > 0.2) {
      G.tx += (Math.cos(G.hd) * spd + wx) * dt;
      G.ty += Math.sin(G.hd) * spd * dt;
    }

    const step = hypot2(G.tx - ox0, G.ty - oy0);
    G.used += step;

    const last = G.pts[G.pts.length - 1];
    if (!last || hypot2(G.tx - last.x, G.ty - last.y) >= SEG) {
      G.pts.push({ x: G.tx, y: G.ty });
      if (G.pts.length % 4 === 0) {
        G.leaves.push({
          i: G.pts.length - 1,
          side: G.leaves.length % 2 ? 1 : -1,
          p: rand(0, TAU)
        });
      }
    }

    if (step > 0.4 && Math.random() < dt * 9) {
      emit(1, {
        x: G.tx, y: G.ty, j: 2,
        vx0: -10, vx1: 10, vy0: -18, vy1: -2,
        life: 0.32, r0: 0.5, r1: 1.3, cyan: true, g: -8
      });
    }

    G.growTick += dt;
    if (G.mode === 'play' && spd > 20 && G.growTick > 0.48) {
      G.growTick = 0;
      audio.grow();
    }
    if (G.rustle > 0.55 && G.whooshT <= 0 && G.mode === 'play') {
      audio.rustle();
      G.whooshT = 0.22;
      G.rustle = 0;
    }

    G.danger = probeDanger();

    if (distBloom() < G.bloom.r) {
      reachBloom();
      return;
    }

    if (!canFail) return;

    if (G.used >= G.maxLen) {
      beginFail('len');
      return;
    }
    if (G.tx < 14 || G.tx > VW - 14 || G.ty < 18 || G.ty > VH - 10) {
      beginFail('bound');
      return;
    }
    if (wallAt(G.tx, G.ty)) {
      if (!G.wallTaught) {
        G.wallTaught = true;
        toast('光穿石，藤不穿', true);
      }
      beginFail('wall');
      return;
    }
    if (fireAt(G.tx, G.ty)) {
      beginFail('fire');
      return;
    }
    for (let i = 0; i < G.shears.length; i++) {
      if (tipInShear(G.tx, G.ty, G.shears[i])) {
        beginFail('shear');
        return;
      }
    }
    if (st.self) {
      const skip = 16;
      for (let i = 0; i < G.pts.length - skip; i++) {
        if (hypot2(G.tx - G.pts[i].x, G.ty - G.pts[i].y) < 8.2) {
          beginFail('self');
          return;
        }
      }
    }

    if (G.mode === 'play' && G.danger > 0.55 && !G.nearTaught) {
      G.nearTaught = true;
      if (G.fires.length && !G.fireTaught) {
        G.fireTaught = true;
        toast('离火远一点', true);
      } else if (G.shears.length && !G.shearTaught) {
        G.shearTaught = true;
        toast('等剪口张开', true);
      } else if (G.walls.length) {
        toast('灯贴着角走', true);
      }
    }
    if (G.mode === 'play' && st.winds && !G.windTaught && Math.abs(windAt(G.ty)) > 20) {
      G.windTaught = true;
      toast('风在推芽', true);
    }
  }

  function updateFires(dt) {
    for (let i = 0; i < G.fires.length; i++) {
      const f = G.fires[i];
      f.flick += dt * (9 + i);
      if (Math.random() < dt * 14) {
        emit(1, {
          x: f.x, y: f.y - 10, j: 3,
          vx0: -12, vx1: 12, vy0: -48, vy1: -10,
          life: 0.5, r0: 0.7, r1: 1.8, gold: true, mag: Math.random() < 0.35, g: -30
        });
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.pulse = Math.max(0, G.pulse - dt * 1.6);
    G.whooshT = Math.max(0, G.whooshT - dt);
    G.warnT = Math.max(0, G.warnT - dt);
    G.rustle = Math.max(0, G.rustle - dt * 1.8);
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
      p.vx *= 0.985;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.62) rings.splice(i, 1);
    }
  }

  function updateTitle(dt) {
    updatePlayer(dt, true);
    updateVine(dt, false);
    updateFires(dt);
    if (G.reached) {
      G.settle += dt;
      if (G.settle > 1.15) {
        applyStage(STAGES[0]);
        G.settle = 0;
      }
    } else if (G.used > G.maxLen * 0.92) {
      applyStage(STAGES[0]);
    }
  }

  function updatePlay(dt) {
    if (G.lock <= 0) G.time -= dt;
    updatePlayer(dt, false);
    updateVine(dt, !G.why);
    updateFires(dt);

    if (G.why) {
      if (G.lock <= 0) failStage(G.why);
      return;
    }

    if (G.mode === 'play' && G.time < 8 && !G.timeTaught) {
      G.timeTaught = true;
      toast('夜要尽了', true);
      audio.tick();
    }
    if (G.mode === 'play' && G.time < 8 && G.warnT <= 0) {
      audio.tick();
      G.warnT = 1;
    }

    if (G.reached) {
      G.settle += dt;
      if (G.settle > 0.48) clearStage();
      return;
    }

    if (G.time <= 0) {
      beginFail('time');
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      updatePlayer(dt, false);
      updateVine(dt, false);
      updateFires(dt);
      if (G.settle <= 0) startStage(G.stage + 1, false);
    } else {
      updatePlayer(dt, false);
      updateVine(dt, false);
      updateFires(dt);
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

  function worldClip() {
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(80), sy(20), 8, sx(80), sy(20), 300 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.15)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(40), 8, sx(400), sy(40), 280 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.13)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    worldClip();

    ctx.fillStyle = '#070414';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    vg.addColorStop(0, 'rgba(10, 8, 28, 0.95)');
    vg.addColorStop(0.38, 'rgba(8, 6, 20, 0.18)');
    vg.addColorStop(0.78, 'rgba(14, 18, 16, 0.4)');
    vg.addColorStop(1, 'rgba(8, 14, 12, 0.88)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(G.clock * s.tw + s.p));
      ctx.fillStyle = 'rgba(220, 240, 255,' + (s.a * tw) + ')';
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    const mx = sx(412);
    const my = sy(52);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(mx, my, 16 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(232, 250, 255, 0.82)';
    ctx.beginPath();
    ctx.arc(mx, my, 9 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#070414';
    ctx.beginPath();
    ctx.arc(mx + 4 * scale, my - 2 * scale, 7.4 * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(18), sy(0));
    ctx.lineTo(sx(18), sy(VH));
    ctx.moveTo(sx(VW - 18), sy(0));
    ctx.lineTo(sx(VW - 18), sy(VH));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.08)';
    ctx.lineWidth = 1.2 * scale;
    for (let y = 40; y < VH; y += 46) {
      ctx.beginPath();
      ctx.moveTo(sx(18), sy(y));
      ctx.lineTo(sx(VW - 18), sy(y));
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(8, 16, 14, 0.72)';
    ctx.fillRect(sx(0), sy(700), VW * scale, 100 * scale);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
    ctx.lineWidth = 1 * scale;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(712 + i * 14));
      ctx.lineTo(sx(VW), sy(712 + i * 14));
      ctx.stroke();
    }

    for (let i = 0; i < tufts.length; i++) {
      const t = tufts[i];
      const sway = Math.sin(G.clock * 1.35 + t.p) * 2.4;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1.15 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(t.x), sy(t.y));
      ctx.quadraticCurveTo(sx(t.x + sway), sy(t.y - t.h * 0.6), sx(t.x + sway * 1.4), sy(t.y - t.h));
      ctx.stroke();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.32 + m.p) * 12);
      const y = sy((m.y - G.clock * m.s + VH * 8) % VH);
      ctx.fillStyle = 'rgba(255, 210, 160,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWinds() {
    const st = STAGES[G.stage];
    if (!st || !st.winds) return;
    ctx.save();
    worldClip();
    for (let i = 0; i < st.winds.length; i++) {
      const b = st.winds[i];
      const wx = b.vx + Math.sin(G.clock * TAU / (b.period || 3) + (b.ph || 0)) * (b.osc || 0);
      const right = wx >= 0;
      ctx.fillStyle = right ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 61, 184, 0.055)';
      ctx.fillRect(sx(MARGIN), sy(b.y), (VW - MARGIN * 2) * scale, b.h * scale);
      ctx.strokeStyle = right ? 'rgba(0, 240, 255, 0.24)' : 'rgba(255, 61, 184, 0.24)';
      ctx.lineWidth = 1.2 * scale;
      for (let r = 0; r < 3; r++) {
        const yy = b.y + b.h * (0.22 + r * 0.28);
        const shift = (G.clock * Math.abs(wx) * 0.35) % 48;
        for (let x = MARGIN - 40; x < VW - MARGIN; x += 48) {
          const xx = x + (right ? shift : -shift);
          ctx.beginPath();
          if (right) {
            ctx.moveTo(sx(xx), sy(yy - 5));
            ctx.lineTo(sx(xx + 10), sy(yy));
            ctx.lineTo(sx(xx), sy(yy + 5));
          } else {
            ctx.moveTo(sx(xx + 10), sy(yy - 5));
            ctx.lineTo(sx(xx), sy(yy));
            ctx.lineTo(sx(xx + 10), sy(yy + 5));
          }
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawWalls() {
    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      const x = sx(w.x);
      const y = sy(w.y);
      const ww = w.w * scale;
      const hh = w.h * scale;
      roundRect(ctx, x, y, ww, hh, 8 * scale);
      ctx.fillStyle = '#12101c';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.38)';
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.16)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(x + 10 * scale, y + hh * 0.35);
      ctx.lineTo(x + ww - 12 * scale, y + hh * 0.42);
      ctx.moveTo(x + 14 * scale, y + hh * 0.68);
      ctx.lineTo(x + ww * 0.55, y + hh * 0.62);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      roundRect(ctx, x + 4 * scale, y + 4 * scale, ww - 8 * scale, 5 * scale, 3 * scale);
      ctx.fill();
    }
  }

  function drawFire(f) {
    const x = sx(f.x);
    const y = sy(f.y);
    const flick = 0.86 + Math.sin(G.clock * 11 + f.flick) * 0.1 + Math.sin(G.clock * 23 + f.flick) * 0.06;
    const h = (22 + f.r * 0.42) * flick;
    const glow = ctx.createRadialGradient(x, y - 8 * scale, 2 * scale, x, y, (f.r + 36) * scale);
    glow.addColorStop(0, 'rgba(255, 227, 107, 0.42)');
    glow.addColorStop(0.35, 'rgba(255, 61, 184, 0.18)');
    glow.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, (f.r + 36) * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 61, 184,' + (0.16 + 0.1 * flick) + ')';
    ctx.lineWidth = 1.1 * scale;
    ctx.setLineDash([4 * scale, 5 * scale]);
    ctx.beginPath();
    ctx.arc(x, y, (f.r + 8) * scale, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#1a1014';
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.lineWidth = 1.1 * scale;
    roundRect(ctx, x - 6 * scale, y + 2 * scale, 12 * scale, 16 * scale, 2 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y - 2 * scale);
    ctx.fillStyle = 'rgba(255, 61, 184, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -h * scale);
    ctx.quadraticCurveTo(7 * scale * flick, -h * 0.35 * scale, 0, 6 * scale);
    ctx.quadraticCurveTo(-7 * scale * flick, -h * 0.35 * scale, 0, -h * scale);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 227, 107, 0.95)';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.62 * scale);
    ctx.quadraticCurveTo(3.2 * scale * flick, -h * 0.2 * scale, 0, 3 * scale);
    ctx.quadraticCurveTo(-3.2 * scale * flick, -h * 0.2 * scale, 0, -h * 0.62 * scale);
    ctx.fill();
    ctx.restore();
  }

  function drawShears() {
    for (let i = 0; i < G.shears.length; i++) {
      const s = G.shears[i];
      const open = shearOpen(s);
      const gw = lerp(4, s.gap, open);
      const cx = shearCx(s);
      const y = s.y;
      const h = s.h;
      const leftW = Math.max(8, cx - gw * 0.5 - 16);
      const rightX = cx + gw * 0.5;
      const rightW = Math.max(8, VW - 16 - rightX);

      ctx.fillStyle = 'rgba(255, 61, 184,' + (0.08 + (1 - open) * 0.1) + ')';
      ctx.fillRect(sx(16), sy(y - h * 0.5 - 4), (VW - 32) * scale, (h + 8) * scale);

      ctx.fillStyle = '#141022';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.lineWidth = 1.4 * scale;
      roundRect(ctx, sx(16), sy(y - h * 0.5), leftW * scale, h * scale, 3 * scale);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, sx(rightX), sy(y - h * 0.5), rightW * scale, h * scale, 3 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 61, 184, 0.85)';
      ctx.beginPath();
      ctx.moveTo(sx(16 + leftW), sy(y - h * 0.5));
      ctx.lineTo(sx(16 + leftW + 8), sy(y));
      ctx.lineTo(sx(16 + leftW), sy(y + h * 0.5));
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx(rightX), sy(y - h * 0.5));
      ctx.lineTo(sx(rightX - 8), sy(y));
      ctx.lineTo(sx(rightX), sy(y + h * 0.5));
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.25 + open * 0.45) + ')';
      ctx.setLineDash([4 * scale, 5 * scale]);
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(cx - gw * 0.5), sy(y));
      ctx.lineTo(sx(cx + gw * 0.5), sy(y));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawPot() {
    const x = sx(G.pot.x);
    const y = sy(G.pot.y);
    ctx.fillStyle = '#1a1210';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.5 * scale;
    roundRect(ctx, x - 22 * scale, y - 4 * scale, 44 * scale, 28 * scale, 4 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(42, 28, 18, 0.9)';
    roundRect(ctx, x - 18 * scale, y - 2 * scale, 36 * scale, 10 * scale, 3 * scale);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 10 * scale, y + 12 * scale);
    ctx.lineTo(x + 8 * scale, y + 16 * scale);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232, 250, 255, 0.55)';
    ctx.font = '600 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('盆', x, y + 38 * scale);
  }

  function drawBloom() {
    const x = sx(G.bloom.x);
    const y = sy(G.bloom.y);
    const pulse = 0.86 + Math.sin(G.clock * 2.6) * 0.12 + G.bloomOpen * 0.35 + G.pulse * 0.25;
    const open = 0.85 + G.bloomOpen * 0.35;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(x, sy(0));
    ctx.lineTo(x, y - 16 * scale);
    ctx.stroke();

    const halo = ctx.createRadialGradient(x, y, 4 * scale, x, y, G.bloom.r * 2.2 * scale);
    halo.addColorStop(0, 'rgba(255, 227, 107,' + (0.28 * pulse) + ')');
    halo.addColorStop(0.45, 'rgba(255, 61, 184, 0.12)');
    halo.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, G.bloom.r * 2.2 * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.setLineDash([5 * scale, 6 * scale]);
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.arc(x, y, G.bloom.r * scale, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 + G.clock * 0.15;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = i % 2 ? 'rgba(255, 61, 184, 0.78)' : 'rgba(0, 240, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, -11 * scale * open, 4.6 * scale * open, 11 * scale * open, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255, 227, 107,' + (0.85 + 0.15 * pulse) + ')';
    ctx.beginPath();
    ctx.arc(0, 0, 4.2 * scale * pulse, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(232, 250, 255, 0.78)';
    ctx.font = '600 ' + Math.max(9, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('月花', x, y + G.bloom.r * scale + 16 * scale);
  }

  function vineColor(t, a) {
    const mag = 'rgba(255, 61, 184,' + a + ')';
    const cyn = 'rgba(0, 240, 255,' + a + ')';
    const gold = 'rgba(255, 227, 107,' + a + ')';
    if (G.wither > 0.05) return 'rgba(255, 90, 160,' + (a * (1 - G.wither * 0.45)) + ')';
    if (t > 0.82) return gold;
    if (t > 0.45) return cyn;
    return mag;
  }

  function drawVine() {
    const pts = G.pts;
    if (pts.length < 2) return;
    const n = pts.length;
    const wither = G.wither;
    const width = (5.4 - wither * 2.4);

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.strokeStyle = G.danger > 0.45
      ? 'rgba(255, 61, 184,' + (0.16 + G.danger * 0.2) + ')'
      : 'rgba(0, 240, 255, 0.14)';
    ctx.lineWidth = (width + 7) * scale;
    ctx.beginPath();
    ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (let i = 1; i < n; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
    ctx.lineTo(sx(G.tx), sy(G.ty));
    ctx.stroke();

    const chunks = 8;
    for (let c = 0; c < chunks; c++) {
      const a = c / chunks;
      const b = (c + 1) / chunks;
      const i0 = Math.max(0, Math.floor(a * (n - 1)));
      const i1 = Math.min(n - 1, Math.ceil(b * (n - 1)));
      ctx.strokeStyle = vineColor((a + b) * 0.5, 0.92);
      ctx.lineWidth = (width * (0.78 + a * 0.4)) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(pts[i0].x), sy(pts[i0].y));
      for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
      if (c === chunks - 1) ctx.lineTo(sx(G.tx), sy(G.ty));
      ctx.stroke();
    }

    for (let i = 0; i < G.leaves.length; i++) {
      const lf = G.leaves[i];
      const idx = Math.min(lf.i, pts.length - 1);
      const p = pts[idx];
      const p0 = pts[Math.max(0, idx - 1)];
      const ang = Math.atan2(p.y - p0.y, p.x - p0.x) + lf.side * 0.95;
      const sway = Math.sin(G.clock * 2.1 + lf.p) * 0.12;
      const t = idx / Math.max(1, n - 1);
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(ang + sway);
      ctx.fillStyle = t > 0.5 ? 'rgba(0, 240, 255, 0.55)' : 'rgba(255, 61, 184, 0.55)';
      ctx.beginPath();
      ctx.ellipse(6 * scale, 0, 6.2 * scale, 2.4 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    const bx = sx(G.tx);
    const by = sy(G.ty);
    const pulse = 0.85 + Math.sin(G.clock * 6) * 0.12;
    ctx.fillStyle = G.danger > 0.4
      ? 'rgba(255, 61, 184,' + (0.35 + G.danger * 0.3) + ')'
      : 'rgba(255, 227, 107,' + (0.28 * pulse) + ')';
    ctx.beginPath();
    ctx.arc(bx, by, 10 * scale * pulse, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(G.hd);
    ctx.fillStyle = G.danger > 0.45 ? '#ff3db8' : '#ffe36b';
    ctx.beginPath();
    ctx.ellipse(3 * scale, 0, 6.5 * scale, 3.4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f6f3ff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.4 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawGuide() {
    if (G.reached || G.why) return;
    ctx.strokeStyle = G.danger > 0.45
      ? 'rgba(255, 61, 184, 0.22)'
      : 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = 1 * scale;
    ctx.setLineDash([4 * scale, 6 * scale]);
    ctx.beginPath();
    ctx.moveTo(sx(G.tx), sy(G.ty));
    ctx.lineTo(sx(G.px), sy(G.py));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawLampGlow() {
    const x = sx(G.px);
    const y = sy(G.py);
    const pulse = 0.9 + Math.sin(G.clock * 3.2) * 0.08;
    const rad = 68 * scale;
    const halo = ctx.createRadialGradient(x, y, 2 * scale, x, y, rad);
    halo.addColorStop(0, 'rgba(255, 227, 107,' + (0.42 * pulse) + ')');
    halo.addColorStop(0.35, 'rgba(0, 240, 255, 0.14)');
    halo.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.fill();
  }

  function drawLampBody() {
    const x = sx(G.px);
    const y = sy(G.py);
    const pulse = 0.9 + Math.sin(G.clock * 3.2) * 0.08;
    ctx.fillStyle = '#0b101c';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.95)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.ellipse(x, y, 11 * scale, 13 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 227, 107,' + (0.72 * pulse) + ')';
    ctx.beginPath();
    ctx.arc(x, y + 1 * scale, 3.7 * scale, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.arc(x, y - 13 * scale, 4 * scale, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + 13 * scale);
    ctx.lineTo(x, y + 20 * scale);
    ctx.stroke();
  }

  function drawRings() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.62;
      ctx.strokeStyle = r.mag
        ? 'rgba(255, 61, 184,' + (0.7 * (1 - k)) + ')'
        : 'rgba(0, 240, 255,' + (0.7 * (1 - k)) + ')';
      ctx.lineWidth = (2.2 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (10 + k * 42) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.cyan
        ? 'rgba(0, 240, 255,' + (0.7 * a) + ')'
        : p.mag
          ? 'rgba(255, 61, 184,' + (0.75 * a) + ')'
          : 'rgba(255, 227, 107,' + (0.75 * a) + ')';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (0.16 * G.magFlash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (0.1 * G.goldFlash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    ctx.save();
    worldClip();
    drawWinds();
    drawWalls();
    drawShears();
    for (let i = 0; i < G.fires.length; i++) drawFire(G.fires[i]);
    drawPot();
    drawBloom();
    drawLampGlow();
    drawGuide();
    drawVine();
    drawRings();
    drawLampBody();
    drawParticles();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawVignette();
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    if (hidden) return;
    acc += dt;
    if (acc > 0.25) acc = 0.25;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
  }

  function keyOn(code, down) {
    if (code === 'ArrowLeft' || code === 'KeyA') keys.l = down;
    if (code === 'ArrowRight' || code === 'KeyD') keys.r = down;
    if (code === 'ArrowUp' || code === 'KeyW') keys.u = down;
    if (code === 'ArrowDown' || code === 'KeyS') keys.d = down;
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat && (e.code === 'KeyM' || e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter')) return;
    keyOn(e.code, true);
    if (e.code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
    }
    if (e.code === 'KeyR') {
      audio.ensure();
      if (G.mode === 'title') startRun();
      else if (G.mode === 'fail' && G.lives > 0) startStage(G.stage, true);
      else startRun();
      e.preventDefault();
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (!overlay.classList.contains('hidden')) {
        overlayAction();
        e.preventDefault();
      }
    }
    if (e.code.indexOf('Arrow') === 0 || e.code === 'Space') e.preventDefault();
  });

  window.addEventListener('keyup', function (e) {
    keyOn(e.code, false);
  });

  function onPtr(e, kind) {
    if (e.target.closest && e.target.closest('.tools, .panel, button')) return;
    const w = pointerWorld(e);
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.touch = e.pointerType === 'touch';
    if (kind === 'down') {
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      audio.ensure();
    } else if (kind === 'move') {
      if (pointer.down || e.pointerType === 'mouse') pointer.hover = true;
    } else {
      if (pointer.id == null || e.pointerId === pointer.id) {
        pointer.down = false;
        pointer.id = null;
        if (e.pointerType === 'touch') pointer.hover = false;
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) { onPtr(e, 'down'); e.preventDefault(); });
  canvas.addEventListener('pointermove', function (e) { onPtr(e, 'move'); });
  canvas.addEventListener('pointerup', function (e) { onPtr(e, 'up'); });
  canvas.addEventListener('pointercancel', function (e) { onPtr(e, 'up'); });
  canvas.addEventListener('pointerleave', function () {
    if (!pointer.down) pointer.hover = false;
  });

  ovBtn.addEventListener('click', function () { overlayAction(); });
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
    if (!hidden) last = 0;
  });

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  seedDecor();
  resize();
  bootTitle();
  requestAnimationFrame(frame);
})();
