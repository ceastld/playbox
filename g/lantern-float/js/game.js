'use strict';

(function () {
  const VW = 480;
  const VH = 800;
  const CX = 240;
  const RIVER = 736;
  const SKY = 86;
  const MARGIN = 30;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-lantern-float-mute';
  const WIND_R = 88;
  const REPULSE = 1520;
  const ACC = 2360;
  const MAX_SPD = 340;
  const FRIC = 7.4;
  const BURN_GAP = 0.35;
  const HEAT_NEED = 0.12;
  const OPS = 'WASD / 方向键吹风 · 按住拖动 · M 静音';

  const HUES = [
    { paper: [255, 61, 184], rib: [0, 240, 255], name: '粉' },
    { paper: [255, 227, 107], rib: [255, 61, 184], name: '金' },
    { paper: [0, 240, 255], rib: [255, 227, 107], name: '青' }
  ];

  const STAGES = [
    {
      name: '初放',
      sub: 'FIRST',
      hint: '钻到两灯中间，用风把它们推开',
      toast: '风会推灯 · 站到缝里',
      need: 2,
      rise: 46,
      inward: 10,
      spawn: [
        { x: 168, delay: 0.05, hue: 0 },
        { x: 312, delay: 0.14, hue: 1 }
      ]
    },
    {
      name: '近身',
      sub: 'CLOSE',
      hint: '两灯更近，第一时间插进缝',
      toast: '贴着缝吹，别从外面挤',
      need: 2,
      rise: 50,
      inward: 9,
      spawn: [
        { x: 190, delay: 0.04, hue: 2 },
        { x: 290, delay: 0.12, hue: 0 }
      ]
    },
    {
      name: '三盏',
      sub: 'TRIO',
      hint: '先拆左边一对，再去右边，别挤成一团',
      toast: '三盏会往中间收',
      need: 3,
      rise: 52,
      inward: 11,
      cluster: 8,
      spawn: [
        { x: 148, delay: 0.04, hue: 0 },
        { x: 240, delay: 0.12, hue: 1 },
        { x: 332, delay: 0.2, hue: 2 }
      ]
    },
    {
      name: '侧风',
      sub: 'CROSS',
      hint: '半空有横风，提前把灯让到上风',
      toast: '青带往右推，预留位置',
      need: 3,
      rise: 56,
      inward: 7,
      cluster: 6,
      winds: [{ y: 430, h: 92, vx: 90, osc: 16, period: 3.2, ph: 0 }],
      spawn: [
        { x: 126, delay: 0.04, hue: 1 },
        { x: 240, delay: 0.12, hue: 0 },
        { x: 354, delay: 0.2, hue: 2 }
      ]
    },
    {
      name: '柳丝',
      sub: 'WILLOW',
      hint: '柳枝垂在河心，把灯从两边绕过去',
      toast: '中间有柳 · 纸碰到就燃',
      need: 3,
      rise: 58,
      inward: 6.5,
      willows: [{ x: 240, y0: 78, y1: 405, amp: 26, spd: 0.9, ph: 0.4, thick: 6.6 }],
      spawn: [
        { x: 150, delay: 0.05, hue: 2 },
        { x: 240, delay: 0.14, hue: 0 },
        { x: 352, delay: 0.24, hue: 1 }
      ]
    },
    {
      name: '对流',
      sub: 'SHEAR',
      hint: '上下风对着吹，队形会被拧在一起',
      toast: '下右上左 · 提前拆开',
      need: 3,
      rise: 62,
      inward: 5,
      cluster: 7,
      winds: [
        { y: 520, h: 78, vx: 108, osc: 12, period: 2.6, ph: 0 },
        { y: 288, h: 78, vx: -108, osc: 12, period: 2.6, ph: 1.2 }
      ],
      spawn: [
        { x: 150, delay: 0.05, hue: 0 },
        { x: 240, delay: 0.14, hue: 1 },
        { x: 334, delay: 0.24, hue: 2 }
      ]
    },
    {
      name: '风筝',
      sub: 'KITE',
      hint: '风筝横扫半空，灯要从空当里钻',
      toast: '别让纸灯吻上风筝',
      need: 4,
      rise: 64,
      inward: 5.5,
      cluster: 6,
      kites: [{ x: 240, y: 368, amp: 148, spd: 0.72, ph: 0, r: 22 }],
      spawn: [
        { x: 118, delay: 0.04, hue: 1 },
        { x: 192, delay: 0.14, hue: 0 },
        { x: 286, delay: 0.24, hue: 2 },
        { x: 368, delay: 0.36, hue: 0 }
      ]
    },
    {
      name: '月门',
      sub: 'GATE',
      hint: '月门很窄，错开高度再过，不要并肩',
      toast: '排成一列过门',
      need: 4,
      rise: 66,
      inward: 4.2,
      cluster: 5,
      gate: { x: 240, w: 168 },
      spawn: [
        { x: 150, delay: 0.05, hue: 2 },
        { x: 210, delay: 0.38, hue: 0 },
        { x: 272, delay: 0.72, hue: 1 },
        { x: 334, delay: 1.08, hue: 2 }
      ]
    },
    {
      name: '群灯',
      sub: 'SWARM',
      hint: '五盏加对流，缝要一直留着',
      toast: '灯多了 · 一次只拆最近的一对',
      need: 5,
      rise: 70,
      inward: 5.5,
      cluster: 9,
      winds: [
        { y: 500, h: 70, vx: 96, osc: 20, period: 2.4, ph: 0.2 },
        { y: 310, h: 70, vx: -96, osc: 20, period: 2.4, ph: 1.4 }
      ],
      willows: [{ x: 366, y0: 88, y1: 390, amp: 34, spd: 1.05, ph: 1.6, thick: 6.4 }],
      spawn: [
        { x: 108, delay: 0.04, hue: 0 },
        { x: 176, delay: 0.16, hue: 1 },
        { x: 244, delay: 0.28, hue: 2 },
        { x: 312, delay: 0.42, hue: 0 },
        { x: 380, delay: 0.56, hue: 1 }
      ]
    },
    {
      name: '河灯会',
      sub: 'FEST',
      hint: '柳、筝、门、风全来了。错开，绕开，再入月',
      toast: '终河 · 一盏不撞',
      need: 6,
      rise: 76,
      inward: 3.2,
      cluster: 11,
      gate: { x: 240, w: 152 },
      winds: [
        { y: 548, h: 64, vx: 102, osc: 16, period: 2.2, ph: 0 },
        { y: 400, h: 58, vx: -88, osc: 22, period: 1.9, ph: 0.8 },
        { y: 250, h: 54, vx: 94, osc: 14, period: 2.5, ph: 1.6 }
      ],
      willows: [
        { x: 96, y0: 92, y1: 360, amp: 30, spd: 1.2, ph: 0.2, thick: 6.2 },
        { x: 392, y0: 110, y1: 348, amp: 28, spd: 0.95, ph: 1.8, thick: 6.2 }
      ],
      kites: [{ x: 240, y: 455, amp: 126, spd: 0.88, ph: 0.5, r: 20 }],
      spawn: [
        { x: 100, delay: 0.04, hue: 0, r: 16 },
        { x: 164, delay: 0.16, hue: 1, r: 17 },
        { x: 228, delay: 0.3, hue: 2, r: 15.5 },
        { x: 292, delay: 0.44, hue: 0, r: 17 },
        { x: 352, delay: 0.58, hue: 1, r: 16 },
        { x: 404, delay: 0.72, hue: 2, r: 15.5 }
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
  const pointer = { down: false, hover: false, touch: false, x: CX, y: 520, id: null };

  const particles = [];
  const motes = [];
  const stars = [];
  const pips = [];
  const rings = [];
  const streaks = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    song: 0,
    stage: 0,
    lives: LIVES,
    need: 2,
    rise: 48,
    inward: 0,
    cluster: 0,
    escaped: 0,
    px: CX,
    py: 560,
    pvx: 0,
    pvy: 0,
    lanterns: [],
    spawned: [],
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    lock: 0,
    settle: 0,
    toastT: 0,
    why: '',
    taught: false,
    nearTaught: false,
    whooshT: 0,
    warnT: 0,
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
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function dist2seg(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - x0) * dx + (py - y0) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    return hypot2(px - (x0 + dx * t), py - (y0 + dy * t));
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
      this.beep(392, 0.12, 'sine', 0.05, 784);
      this.beep(523, 0.18, 'triangle', 0.035, 1046);
    },
    whoosh() {
      this.ensure();
      this.noise(0.09, 0.028, 1400);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.06, 'sine', 0.03, 140);
    },
    lift() {
      this.ensure();
      this.beep(330, 0.08, 'sine', 0.035, 520);
    },
    score() {
      this.ensure();
      this.beep(659, 0.1, 'sine', 0.055, 880);
      this.beep(988, 0.16, 'triangle', 0.04, 1318);
    },
    bump() {
      this.ensure();
      this.noise(0.18, 0.07, 420);
      this.beep(196, 0.22, 'sawtooth', 0.045, 70);
      this.beep(90, 0.32, 'sine', 0.06, 40);
    },
    hit() {
      this.ensure();
      this.noise(0.12, 0.055, 800);
      this.beep(160, 0.16, 'triangle', 0.04, 70);
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
        g: spec.g == null ? 40 : spec.g
      });
    }
  }

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag });
    if (rings.length > 20) rings.shift();
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
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function airborneCount() {
    let n = 0;
    for (let i = 0; i < G.lanterns.length; i++) {
      const L = G.lanterns[i];
      if (!L.dead && !L.escaped) n += 1;
    }
    return n;
  }

  function pendingCount() {
    const st = STAGES[G.stage];
    if (!st) return 0;
    let n = 0;
    for (let i = 0; i < st.spawn.length; i++) {
      if (!G.spawned[i]) n += 1;
    }
    return n;
  }

  function hope() {
    return G.escaped + airborneCount() + pendingCount();
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const need = G.need;
    const fill = G.mode === 'title' ? Math.min(G.escaped, need) : G.escaped;
    const k = need ? clamp(fill / need, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = fill + '/' + need;
    fillWrap.classList.toggle('hot', G.mode === 'play' && fill >= need);
    fillWrap.classList.toggle('warn', G.mode === 'play' && hope() <= need && airborneCount() > 0 && fill < need);
    if (G.mode === 'title') {
      stageLabel.textContent = '十河';
      leftLabel.textContent = '别相撞';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 河 · ' + (st ? st.name : '');
      leftLabel.textContent = '在空 ' + airborneCount();
    }
    stageLabel.classList.toggle('hot', G.mode === 'play' && fill >= need);
    leftLabel.classList.toggle('warn', G.mode === 'play' && airborneCount() >= 3);
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

  function willowTip(w) {
    return {
      x: w.x + Math.sin(G.clock * w.spd + w.ph) * w.amp,
      y: w.y1
    };
  }

  function kitePos(k) {
    return {
      x: k.x + Math.sin(G.clock * k.spd + k.ph) * k.amp,
      y: k.y + Math.sin(G.clock * k.spd * 0.7 + k.ph + 1.2) * 16
    };
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

  function resetPlayer() {
    G.px = CX;
    G.py = 560;
    G.pvx = 0;
    G.pvy = 0;
  }

  function applyStage(st) {
    G.need = st.need;
    G.rise = st.rise;
    G.inward = st.inward || 0;
    G.cluster = st.cluster || 0;
    G.escaped = 0;
    G.lanterns.length = 0;
    G.spawned = [];
    for (let i = 0; i < st.spawn.length; i++) G.spawned[i] = false;
    G.why = '';
    G.nearTaught = false;
    G.song = 0;
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.18;
    G.settle = 0;
    G.taught = G.taught && fromFail;
    applyStage(STAGES[i]);
    resetPlayer();
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

  function spawnLantern(spec) {
    const L = {
      x: spec.x,
      y: RIVER - 10,
      vx: spec.drift || 0,
      vy: -20,
      r: spec.r || 17,
      hue: spec.hue || 0,
      phase: rand(0, TAU),
      age: 0,
      inv: 0.5,
      warn: 0,
      heat: 0,
      touch: false,
      dead: false,
      escaped: false
    };
    G.lanterns.push(L);
    addRing(L.x, L.y + 8, false);
    emit(8, {
      x: L.x, y: L.y + 12, j: 10,
      vx0: -30, vx1: 30, vy0: -40, vy1: -4,
      life: 0.45, r0: 1, r1: 2.4, gold: true, g: -20
    });
    if (G.mode === 'play') audio.lift();
    return L;
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    applyStage(STAGES[0]);
    resetPlayer();
    showOverlay(
      'title',
      '放灯',
      '灯笼会自己往上飘。把风钻进缝里，<br />别让纸灯碰到一起。',
      '放灯',
      'LANTERN',
      OPS
    );
    setHint('站到两灯中间 · 风会推开它们', '');
    syncHud();
  }

  function burnLantern(L, mag) {
    if (L.dead || L.escaped) return;
    L.dead = true;
    addRing(L.x, L.y, true);
    emit(18, {
      x: L.x, y: L.y, j: 14,
      vx0: -140, vx1: 140, vy0: -120, vy1: 80,
      life: 0.62, r0: 1.4, r1: 3.6, mag: mag !== false, gold: mag === false, g: 80
    });
  }

  function scoreLantern(L) {
    if (L.dead || L.escaped) return;
    L.escaped = true;
    G.escaped += 1;
    G.goldFlash = Math.max(G.goldFlash, 0.35);
    G.pulse = 1;
    addRing(L.x, SKY - 6, false);
    emit(12, {
      x: L.x, y: SKY, j: 10,
      vx0: -40, vx1: 40, vy0: -90, vy1: -20,
      life: 0.7, r0: 1.2, r1: 2.8, gold: true, g: -30
    });
    if (G.mode === 'play') {
      audio.score();
      if (G.escaped >= G.need) {
        toast('入月 ' + G.escaped + '/' + G.need, false, true);
      }
    }
    syncHud();
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const map = {
      bump: ['相撞', '两盏纸灯吻在一起，火就燎起来了。', 'KISS'],
      willow: ['柳丝', '灯笼刮上了柳枝。', 'WILLOW'],
      kite: ['风筝', '纸灯撞上了风筝。', 'KITE'],
      eave: ['月檐', '没进月门，撞上了夜檐。', 'EAVE'],
      lost: ['未满', '灯灭得太多，凑不齐入月。', 'SHORT']
    };
    const m = map[why] || map.lost;
    showOverlay(
      'lose',
      m[0],
      more
        ? m[1] + '<br />还剩 ' + G.lives + ' 次。'
        : m[1] + '<br />十河未完。',
      more ? '再放本河' : '再来一局',
      m[2]
    );
    setHint(m[0], 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.9;
    G.goldFlash = 0.85;
    audio.clear();
    toast(STAGES[G.stage].name + ' · 入月', false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '灯上月',
        '十河灯笼都升入夜空，一盏不撞。',
        '再放一巡',
        'MOONLIT'
      );
      setHint('十河灯上月', 'hot');
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
    G.magFlash = 0.72;
    G.shake = 13;
    G.lock = 0.82;
    if (why === 'bump') audio.bump();
    else audio.hit();
    const msg = why === 'bump' ? '纸灯相撞'
      : why === 'willow' ? '刮上柳丝'
      : why === 'kite' ? '撞上风筝'
      : why === 'eave' ? '撞上月檐'
      : '灯灭了';
    toast(msg, true);
    setHint(msg, 'warn');
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
    streaks.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(40, VH - 40),
        r: rand(0.6, 1.7),
        a: rand(0.05, 0.18),
        p: rand(0, TAU),
        s: rand(8, 22)
      });
    }
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: rand(12, VW - 12),
        y: rand(12, 420),
        r: rand(0.5, 1.5),
        a: rand(0.25, 0.85),
        p: rand(0, TAU),
        tw: rand(1.2, 3.4)
      });
    }
    for (let i = 0; i < 28; i++) {
      streaks.push({
        x: rand(20, VW - 20),
        y: rand(120, 680),
        s: rand(18, 40),
        a: rand(0.08, 0.2),
        p: rand(0, TAU)
      });
    }
  }

  function updatePlayer(dt, auto) {
    const playing = G.mode === 'play' || G.mode === 'title';
    if (!playing) {
      G.pvx *= Math.exp(-dt * 6);
      G.pvy *= Math.exp(-dt * 6);
      G.px = clamp(G.px + G.pvx * dt, 28, VW - 28);
      G.py = clamp(G.py + G.pvy * dt, 48, RIVER - 16);
      return;
    }

    if (auto) {
      let tx = CX;
      let ty = 520;
      let best = 1e9;
      let sx = 0;
      let sy = 0;
      let n = 0;
      const Ls = G.lanterns;
      for (let i = 0; i < Ls.length; i++) {
        const a = Ls[i];
        if (a.dead || a.escaped) continue;
        sx += a.x;
        sy += a.y;
        n += 1;
        for (let j = i + 1; j < Ls.length; j++) {
          const b = Ls[j];
          if (b.dead || b.escaped) continue;
          const gap = hypot2(a.x - b.x, a.y - b.y) - (a.r + b.r);
          if (gap < best) {
            best = gap;
            tx = (a.x + b.x) * 0.5;
            ty = (a.y + b.y) * 0.5;
          }
        }
      }
      if (n) {
        if (best > 28) {
          tx = sx / n;
          ty = sy / n - 36;
        } else {
          ty -= 8;
        }
      }
      G.px = lerp(G.px, tx, 1 - Math.exp(-3.6 * dt));
      G.py = lerp(G.py, ty, 1 - Math.exp(-3.2 * dt));
      G.pvx = 0;
      G.pvy = 0;
      return;
    }

    const usePtr = pointer.down || pointer.hover;
    if (usePtr) {
      let tx = pointer.x;
      let ty = pointer.y;
      if (pointer.touch) ty -= 40;
      tx = clamp(tx, 28, VW - 28);
      ty = clamp(ty, 48, RIVER - 16);
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

    if (G.px < 28) { G.px = 28; G.pvx *= 0.2; }
    if (G.px > VW - 28) { G.px = VW - 28; G.pvx *= 0.2; }
    if (G.py < 48) { G.py = 48; G.pvy *= 0.2; }
    if (G.py > RIVER - 16) { G.py = RIVER - 16; G.pvy *= 0.2; }

    const pspd = hypot2(G.pvx, G.pvy);
    if (G.mode === 'play' && pspd > 200 && G.whooshT <= 0) {
      audio.whoosh();
      G.whooshT = 0.28;
      emit(2, {
        x: G.px, y: G.py, j: 6,
        vx0: -G.pvx * 0.15, vx1: -G.pvx * 0.05,
        vy0: -G.pvy * 0.15, vy1: -G.pvy * 0.05,
        life: 0.28, r0: 1, r1: 2.2, cyan: true, g: 0
      });
    }
  }

  function applyRepulse(L, dt) {
    const dx = L.x - G.px;
    const dy = L.y - G.py;
    const d = hypot2(dx, dy);
    if (d >= WIND_R || d < 0.2) return;
    const k = Math.pow(1 - d / WIND_R, 1.18) * REPULSE;
    L.vx += (dx / d) * k * dt;
    L.vy += (dy / d) * k * 0.4 * dt;
  }

  function gateHit(L) {
    const st = STAGES[G.stage];
    if (!st || !st.gate) return false;
    if (L.y - L.r > SKY + 12) return false;
    const left = st.gate.x - st.gate.w * 0.5;
    const right = st.gate.x + st.gate.w * 0.5;
    const top = 0;
    const bot = SKY + 10;
    if (L.y + L.r < top || L.y - L.r > bot) return false;
    if (L.x + L.r > left && L.x - L.r < right) return false;
    return L.y < SKY + 16;
  }

  function inGate(L) {
    const st = STAGES[G.stage];
    if (!st || !st.gate) return true;
    return Math.abs(L.x - st.gate.x) < st.gate.w * 0.5 - L.r * 0.15;
  }

  function updateLanterns(dt, canFail) {
    const st = STAGES[G.stage];
    if (!st) return;

    if (G.lock <= 0) {
      for (let i = 0; i < st.spawn.length; i++) {
        if (G.spawned[i]) continue;
        if (G.song >= st.spawn[i].delay) {
          G.spawned[i] = true;
          spawnLantern(st.spawn[i]);
        }
      }
    }

    const Ls = G.lanterns;
    for (let i = 0; i < Ls.length; i++) {
      const L = Ls[i];
      L.warn = Math.max(0, L.warn - dt * 2.4);
      L.touch = false;
      if (L.dead || L.escaped) continue;
      L.age += dt;
      L.inv = Math.max(0, L.inv - dt);

      applyRepulse(L, dt);

      const wx = windAt(L.y);
      L.vx += wx * dt;
      if (G.inward) {
        const dir = CX - L.x;
        if (Math.abs(dir) > 6) L.vx += Math.sign(dir) * G.inward * dt;
      }

      L.vy += (-G.rise - L.vy) * 2.35 * dt;
      L.vx *= Math.exp(-dt * 1.28);

      L.x += L.vx * dt;
      L.y += L.vy * dt;

      const lo = MARGIN + L.r;
      const hi = VW - MARGIN - L.r;
      if (L.x < lo) {
        L.x = lo;
        L.vx = Math.abs(L.vx) * 0.55;
      } else if (L.x > hi) {
        L.x = hi;
        L.vx = -Math.abs(L.vx) * 0.55;
      }
      if (L.y > RIVER - 6) {
        L.y = RIVER - 6;
        L.vy = Math.min(L.vy, -8);
      }

      if (L.y < SKY - 4 && inGate(L)) {
        scoreLantern(L);
        continue;
      }

      if (canFail && L.inv <= 0 && gateHit(L)) {
        burnLantern(L, true);
        beginFail('eave');
        continue;
      }

      if (canFail && st.willows && L.inv <= 0) {
        for (let w = 0; w < st.willows.length; w++) {
          const ww = st.willows[w];
          const tip = willowTip(ww);
          const d = dist2seg(L.x, L.y, ww.x, ww.y0, tip.x, tip.y);
          if (d < L.r * 0.72 + ww.thick) {
            burnLantern(L, true);
            beginFail('willow');
            break;
          }
        }
      }
      if (L.dead) continue;

      if (canFail && st.kites && L.inv <= 0) {
        for (let k = 0; k < st.kites.length; k++) {
          const kp = kitePos(st.kites[k]);
          if (hypot2(L.x - kp.x, L.y - kp.y) < L.r + st.kites[k].r * 0.78) {
            burnLantern(L, true);
            beginFail('kite');
            break;
          }
        }
      }
    }

    for (let i = 0; i < Ls.length; i++) {
      const a = Ls[i];
      if (a.dead || a.escaped) continue;
      for (let j = i + 1; j < Ls.length; j++) {
        const b = Ls[j];
        if (b.dead || b.escaped) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = hypot2(dx, dy);
        const min = a.r + b.r;
        if (d < min + 22) {
          a.warn = 1;
          b.warn = 1;
          if (canFail && G.mode === 'play' && !G.nearTaught && d < min + 14) {
            G.nearTaught = true;
            toast('要撞了', true);
            setHint('钻到中间把它们分开', 'warn');
          }
          if (G.warnT <= 0 && d < min + 10) {
            audio.warn();
            G.warnT = 0.4;
          }
        }
        if (d < 0.001) {
          dx = 0.4;
          dy = 0;
          d = 0.4;
        }
        if (G.cluster && d > min + 6 && d < 140) {
          const pull = G.cluster * dt / d;
          a.vx += dx * pull;
          a.vy += dy * pull * 0.25;
          b.vx -= dx * pull;
          b.vy -= dy * pull * 0.25;
        }
        if (d < min - BURN_GAP) {
          a.touch = true;
          b.touch = true;
          a.heat += dt;
          b.heat += dt;
          if (a.inv > 0 || b.inv > 0) {
            const overlap = min - d;
            const nx = dx / d;
            const ny = dy / d;
            a.x -= nx * overlap * 0.5;
            a.y -= ny * overlap * 0.5;
            b.x += nx * overlap * 0.5;
            b.y += ny * overlap * 0.5;
          } else if (canFail && a.heat >= HEAT_NEED && b.heat >= HEAT_NEED) {
            burnLantern(a, true);
            burnLantern(b, true);
            beginFail('bump');
          }
        }
      }
    }
    for (let i = 0; i < Ls.length; i++) {
      if (!Ls[i].touch) Ls[i].heat = Math.max(0, Ls[i].heat - dt * 3);
    }

    if (Math.random() < dt * 9) {
      for (let i = 0; i < Ls.length; i++) {
        const L = Ls[i];
        if (L.dead || L.escaped) continue;
        if (Math.random() < 0.35) {
          emit(1, {
            x: L.x, y: L.y - L.r * 0.15, j: 3,
            vx0: -8, vx1: 8, vy0: -28, vy1: -6,
            life: 0.4, r0: 0.7, r1: 1.5, gold: true, g: -40
          });
        }
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
      if (rings[i].t > 0.6) rings.splice(i, 1);
    }
  }

  function updateTitle(dt) {
    G.song += dt;
    updatePlayer(dt, true);
    updateLanterns(dt, false);
    if (G.escaped >= G.need || (pendingCount() === 0 && airborneCount() === 0)) {
      G.settle += dt;
      if (G.settle > 0.8) {
        applyStage(STAGES[0]);
        G.settle = 0;
        G.px = CX;
        G.py = 560;
      }
    }
  }

  function updatePlay(dt) {
    G.song += dt;
    updatePlayer(dt, false);
    if (!G.why) updateLanterns(dt, G.escaped < G.need);

    if (G.why) {
      if (G.lock <= 0) failStage(G.why);
      return;
    }

    if (G.escaped >= G.need) {
      G.settle += dt;
      if (G.settle > 0.45) clearStage();
      return;
    }

    if (pendingCount() === 0 && airborneCount() === 0) {
      G.settle += dt;
      if (G.settle > 0.4) beginFail('lost');
    } else if (hope() < G.need) {
      beginFail(G.why || 'lost');
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
      updateLanterns(dt, false);
      if (G.settle <= 0) startStage(G.stage + 1, false);
    } else {
      updatePlayer(dt, false);
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

    const g = ctx.createRadialGradient(sx(90), sy(30), 8, sx(90), sy(30), 300 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.16)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(40), 8, sx(400), sy(40), 280 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.13)');
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
    vg.addColorStop(0, 'rgba(10, 8, 28, 0.95)');
    vg.addColorStop(0.42, 'rgba(8, 6, 20, 0.2)');
    vg.addColorStop(0.78, 'rgba(12, 10, 32, 0.35)');
    vg.addColorStop(1, 'rgba(6, 10, 28, 0.7)');
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

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 12);
      const y = sy((m.y - G.clock * m.s + VH * 8) % VH);
      ctx.fillStyle = 'rgba(255, 210, 160,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      const yy = (s.y - G.clock * s.s * 0.35 + VH * 8) % VH;
      ctx.strokeStyle = 'rgba(0, 240, 255,' + s.a * 0.45 + ')';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(yy));
      ctx.lineTo(sx(s.x + Math.sin(G.clock * 0.6 + s.p) * 8), sy(yy - 10));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMoon() {
    const mx = sx(392);
    const my = sy(58);
    const mr = 34 * scale;
    const halo = ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 2.2);
    halo.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
    halo.addColorStop(0.45, 'rgba(255, 227, 107, 0.06)');
    halo.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#d7f7ff';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    ctx.fillStyle = 'rgba(8, 20, 40, 0.12)';
    ctx.beginPath();
    ctx.arc(mx + 8 * scale, my + 4 * scale, 7 * scale, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx - 10 * scale, my + 8 * scale, 4.5 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(mx - 9 * scale, my - 10 * scale, 6 * scale, 0, TAU);
    ctx.fill();
  }

  function drawGate() {
    const st = STAGES[G.stage];
    if (!st || !st.gate) {
      ctx.save();
      ctx.globalAlpha = 0.35 + G.pulse * 0.3;
      ctx.strokeStyle = 'rgba(255, 227, 107, 0.45)';
      ctx.setLineDash([6 * scale, 7 * scale]);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(MARGIN), sy(SKY));
      ctx.lineTo(sx(VW - MARGIN), sy(SKY));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      return;
    }
    const left = st.gate.x - st.gate.w * 0.5;
    const right = st.gate.x + st.gate.w * 0.5;
    const h = SKY + 8;

    ctx.fillStyle = 'rgba(8, 4, 16, 0.82)';
    ctx.fillRect(sx(0), sy(0), left * scale, h * scale);
    ctx.fillRect(sx(right), sy(0), (VW - right) * scale, h * scale);

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(h));
    ctx.lineTo(sx(left), sy(h));
    ctx.moveTo(sx(right), sy(h));
    ctx.lineTo(sx(VW), sy(h));
    ctx.stroke();

    const glow = ctx.createLinearGradient(sx(left), sy(0), sx(right), sy(0));
    glow.addColorStop(0, 'rgba(0, 240, 255, 0)');
    glow.addColorStop(0.5, 'rgba(255, 227, 107, 0.28)');
    glow.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx(left), sy(0), (right - left) * scale, h * scale);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(left), sy(2));
    ctx.lineTo(sx(left), sy(h));
    ctx.moveTo(sx(right), sy(2));
    ctx.lineTo(sx(right), sy(h));
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 227, 107, 0.8)';
    ctx.font = '600 ' + Math.max(9, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('月门', sx(st.gate.x), sy(18));
  }

  function drawWinds() {
    const st = STAGES[G.stage];
    if (!st || !st.winds) return;
    ctx.save();
    for (let i = 0; i < st.winds.length; i++) {
      const b = st.winds[i];
      const wx = b.vx + Math.sin(G.clock * TAU / (b.period || 3) + (b.ph || 0)) * (b.osc || 0);
      const right = wx >= 0;
      ctx.fillStyle = right ? 'rgba(0, 240, 255, 0.045)' : 'rgba(255, 61, 184, 0.05)';
      ctx.fillRect(sx(MARGIN), sy(b.y), (VW - MARGIN * 2) * scale, b.h * scale);

      ctx.strokeStyle = right ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 61, 184, 0.22)';
      ctx.lineWidth = 1.2 * scale;
      const rows = 3;
      for (let r = 0; r < rows; r++) {
        const yy = b.y + b.h * (0.22 + r * 0.28);
        const shift = ((G.clock * Math.abs(wx) * 0.35) % 48);
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

  function drawRiver() {
    const y = sy(RIVER);
    const g = ctx.createLinearGradient(sx(0), y - 40 * scale, sx(0), sy(VH));
    g.addColorStop(0, 'rgba(0, 240, 255, 0.04)');
    g.addColorStop(0.12, 'rgba(18, 10, 36, 0.92)');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), y - 18 * scale, VW * scale, sy(VH) - (y - 18 * scale));

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const x = (VW * i) / 24;
      const yy = RIVER + Math.sin(G.clock * 1.4 + i * 0.5) * 2.4;
      if (i === 0) ctx.moveTo(sx(x), sy(yy));
      else ctx.lineTo(sx(x), sy(yy));
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const x = (VW * i) / 24;
      const yy = RIVER + 10 + Math.sin(G.clock * 1.1 + i * 0.62 + 1) * 2.1;
      if (i === 0) ctx.moveTo(sx(x), sy(yy));
      else ctx.lineTo(sx(x), sy(yy));
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(12, 8, 24, 0.7)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.2 * scale;
    roundRect(ctx, sx(CX - 36), sy(RIVER + 6), 72 * scale, 10 * scale, 4 * scale);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < G.lanterns.length; i++) {
      const L = G.lanterns[i];
      if (L.dead || L.escaped) continue;
      const hue = HUES[L.hue] || HUES[0];
      const depth = clamp((RIVER - L.y) / 500, 0.08, 0.32);
      ctx.fillStyle = rgba(hue.paper, 0.12 * (1 - depth));
      ctx.beginPath();
      ctx.ellipse(sx(L.x), sy(RIVER + 16 + depth * 8), L.r * 0.7 * scale, 3.2 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawWillows() {
    const st = STAGES[G.stage];
    if (!st || !st.willows) return;
    for (let i = 0; i < st.willows.length; i++) {
      const w = st.willows[i];
      const tip = willowTip(w);
      const midX = (w.x + tip.x) * 0.5 + Math.sin(G.clock * 0.8 + w.ph) * 10;
      const midY = (w.y0 + tip.y) * 0.5;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
      ctx.lineWidth = (w.thick * 0.55) * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(w.x), sy(w.y0));
      ctx.quadraticCurveTo(sx(midX), sy(midY), sx(tip.x), sy(tip.y));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
      ctx.lineWidth = (w.thick * 0.28) * scale;
      ctx.stroke();

      for (let k = 0; k < 7; k++) {
        const t = 0.18 + k * 0.11;
        const px = lerp(w.x, tip.x, t) + Math.sin(t * 8 + G.clock) * 4;
        const py = lerp(w.y0, tip.y, t);
        ctx.fillStyle = k % 2 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 61, 184, 0.4)';
        ctx.beginPath();
        ctx.ellipse(sx(px + 8), sy(py), 5 * scale, 2.2 * scale, 0.6, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawKites() {
    const st = STAGES[G.stage];
    if (!st || !st.kites) return;
    for (let i = 0; i < st.kites.length; i++) {
      const k = st.kites[i];
      const p = kitePos(k);
      const x = sx(p.x);
      const y = sy(p.y);
      const r = k.r * scale;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(G.clock * k.spd + k.ph) * 0.25);
      ctx.fillStyle = 'rgba(255, 61, 184, 0.85)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.72, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.72, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.moveTo(-r * 0.72, 0);
      ctx.lineTo(r * 0.72, 0);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 227, 107, 0.55)';
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      for (let t = 1; t <= 6; t++) {
        const ty = p.y + k.r + t * 10;
        const tx = p.x + Math.sin(G.clock * 3 + t) * (4 + t);
        ctx.lineTo(sx(tx), sy(ty));
      }
      ctx.stroke();
    }
  }

  function drawStrings() {
    const Ls = G.lanterns;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < Ls.length; i++) {
      const a = Ls[i];
      if (a.dead || a.escaped) continue;
      for (let j = i + 1; j < Ls.length; j++) {
        const b = Ls[j];
        if (b.dead || b.escaped) continue;
        const d = hypot2(a.x - b.x, a.y - b.y);
        const min = a.r + b.r;
        if (d < min + 24) {
          const k = clamp(1 - (d - min) / 24, 0, 1);
          ctx.strokeStyle = 'rgba(255, 61, 184,' + (0.15 + k * 0.7) + ')';
          ctx.lineWidth = (1 + k * 2.2) * scale;
          ctx.beginPath();
          ctx.moveTo(sx(a.x), sy(a.y));
          ctx.lineTo(sx(b.x), sy(b.y));
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawLantern(L) {
    if (L.dead || L.escaped) return;
    const hue = HUES[L.hue] || HUES[0];
    const x = sx(L.x);
    const y = sy(L.y);
    const r = L.r * scale;
    const sway = Math.sin(G.clock * 2.1 + L.phase) * 0.09 + clamp(L.vx * 0.004, -0.22, 0.22);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);

    const glowR = r * (2.4 + L.warn * 1.1);
    const grd = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, glowR);
    grd.addColorStop(0, rgba(hue.paper, 0.38 + L.warn * 0.25));
    grd.addColorStop(0.35, rgba(hue.paper, 0.12));
    grd.addColorStop(1, rgba(hue.paper, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, TAU);
    ctx.fill();

    const topW = r * 0.95;
    const botW = r * 0.78;
    const h = r * 1.55;
    ctx.beginPath();
    ctx.moveTo(-topW, -h * 0.42);
    ctx.lineTo(topW, -h * 0.42);
    ctx.lineTo(botW, h * 0.48);
    ctx.lineTo(-botW, h * 0.48);
    ctx.closePath();
    const paper = ctx.createLinearGradient(0, -h * 0.42, 0, h * 0.48);
    paper.addColorStop(0, rgba(hue.paper, 0.22));
    paper.addColorStop(0.45, 'rgba(18, 8, 28, 0.88)');
    paper.addColorStop(1, rgba(hue.paper, 0.18));
    ctx.fillStyle = paper;
    ctx.fill();
    ctx.strokeStyle = L.warn > 0.3 ? 'rgba(255, 61, 184, 0.95)' : rgba(hue.paper, 0.9);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    ctx.strokeStyle = rgba(hue.rib, 0.45);
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.42);
    ctx.lineTo(0, h * 0.48);
    ctx.moveTo(-topW * 0.5, -h * 0.42);
    ctx.lineTo(-botW * 0.5, h * 0.48);
    ctx.moveTo(topW * 0.5, -h * 0.42);
    ctx.lineTo(botW * 0.5, h * 0.48);
    ctx.stroke();

    ctx.fillStyle = 'rgba(10, 6, 18, 0.9)';
    roundRect(ctx, -topW * 0.55, -h * 0.52, topW * 1.1, 5 * scale, 2 * scale);
    ctx.fill();
    ctx.strokeStyle = rgba(hue.rib, 0.7);
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    const flick = 0.75 + Math.sin(G.clock * 14 + L.phase) * 0.18;
    ctx.fillStyle = 'rgba(255, 227, 107,' + (0.9 * flick) + ')';
    ctx.beginPath();
    ctx.moveTo(0, 2 * scale);
    ctx.quadraticCurveTo(3.2 * scale, -4 * scale, 0, -9 * scale * flick);
    ctx.quadraticCurveTo(-3.2 * scale, -4 * scale, 0, 2 * scale);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(0, -2 * scale, 1.2 * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(hue.paper, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.48);
    ctx.lineTo(0, h * 0.48 + 9 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4 * scale, h * 0.48 + 11 * scale);
    ctx.quadraticCurveTo(0, h * 0.48 + 16 * scale, 4 * scale, h * 0.48 + 11 * scale);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.moveTo(-topW * 0.55, -h * 0.22);
    ctx.lineTo(-botW * 0.35, h * 0.22);
    ctx.stroke();

    ctx.restore();
  }

  function drawPlayer() {
    const x = sx(G.px);
    const y = sy(G.py);
    const playing = G.mode === 'play' || G.mode === 'title';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(x, y, 4 * scale, x, y, WIND_R * scale);
    grd.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
    grd.addColorStop(0.45, 'rgba(0, 240, 255, 0.07)');
    grd.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, WIND_R * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255,' + (playing ? 0.35 : 0.15) + ')';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.arc(x, y, WIND_R * 0.92 * scale, 0, TAU);
    ctx.stroke();

    const spin = G.clock * 2.4;
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.55)';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.arc(x, y, 16 * scale, spin, spin + 1.8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 11 * scale, -spin * 1.3, -spin * 1.3 + 2.1);
    ctx.stroke();

    ctx.fillStyle = 'rgba(230, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 3.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.gold ? '#ffe36b' : p.mag ? '#ff3db8' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.6;
      ctx.strokeStyle = r.mag
        ? 'rgba(255, 61, 184,' + (0.5 * (1 - k)) + ')'
        : 'rgba(255, 227, 107,' + (0.45 * (1 - k)) + ')';
      ctx.lineWidth = 1.7 * scale * (1 - k * 0.4);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 34) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.2) + ')';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.1) + ')';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
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
    drawMoon();
    drawGate();
    drawWinds();
    drawRiver();
    drawStrings();
    for (let i = 0; i < G.lanterns.length; i++) drawLantern(G.lanterns[i]);
    drawWillows();
    drawKites();
    drawPlayer();
    drawParticles();
    drawFlash();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    const p = pointerWorld(e);
    pointer.down = true;
    pointer.hover = true;
    pointer.touch = e.pointerType === 'touch' || e.pointerType === 'pen';
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
    if (e.pointerType === 'mouse') pointer.hover = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
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

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  seedDecor();
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
