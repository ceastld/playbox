'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MIN_GAP = 58;
  const PAD = 54;
  const SRC_R = 15;
  const ANODE_R = 16;
  const MOVE = 336;
  const MUTE_KEY = 'playbox-spark-gap-mute';

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };

  const STAGES = [
    {
      name: '初隙', sub: 'FIRST', time: 42, maxGap: 680, guide: true,
      hint: '把右电极拉开，让火花穿过金珠',
      toast: '往右拉 · 火花会跟着走',
      src: { x: 150, y: 280 },
      start: { x: 228, y: 280 },
      targets: [{ x: 430, y: 280, r: 30, rate: 1.7 }],
      dumps: []
    },
    {
      name: '抬火', sub: 'LIFT', time: 42, maxGap: 640, guide: true,
      hint: '火花走直线。把电极拉到金珠另一侧',
      toast: '往右上拉，穿过金珠',
      src: { x: 150, y: 320 },
      start: { x: 228, y: 320 },
      targets: [{ x: 450, y: 150, r: 26, rate: 1.65 }],
      dumps: []
    },
    {
      name: '远跳', sub: 'FAR', time: 40, maxGap: 560, guide: false,
      hint: '拉过金珠。拉太远虚线圈外火花会熄',
      toast: '虚线是最大间隙 · 别拉出圈',
      src: { x: 130, y: 280 },
      start: { x: 210, y: 280 },
      targets: [{ x: 590, y: 280, r: 24, rate: 1.7 }],
      dumps: []
    },
    {
      name: '避地', sub: 'DUMP', time: 44, maxGap: 620, guide: false,
      hint: '粉柱会偷火。从上面绕开再穿金珠',
      toast: '别让火花擦到粉柱',
      src: { x: 140, y: 300 },
      start: { x: 222, y: 300 },
      targets: [{ x: 580, y: 150, r: 24, rate: 1.6 }],
      dumps: [{ x: 380, y: 300, r: 26 }]
    },
    {
      name: '双珠', sub: 'TWO', time: 50, maxGap: 660, guide: false,
      hint: '两颗金珠都要点亮，可以先后穿过',
      toast: '点亮一颗，再甩向另一颗',
      src: { x: 150, y: 270 },
      start: { x: 230, y: 270 },
      targets: [
        { x: 420, y: 130, r: 23, rate: 1.7 },
        { x: 540, y: 410, r: 23, rate: 1.7 }
      ],
      dumps: []
    },
    {
      name: '窄门', sub: 'GATE', time: 46, maxGap: 640, guide: false,
      hint: '从两根地柱中间穿过去',
      toast: '走正中，别擦边',
      src: { x: 130, y: 270 },
      start: { x: 214, y: 270 },
      targets: [{ x: 660, y: 270, r: 22, rate: 1.65 }],
      dumps: [
        { x: 430, y: 208, r: 22 },
        { x: 430, y: 332, r: 22 }
      ]
    },
    {
      name: '追珠', sub: 'ORBIT', time: 48, maxGap: 640, guide: false,
      hint: '金珠在转。把间隙对准它再跟上',
      toast: '跟着转，火花贴住金珠',
      src: { x: 150, y: 270 },
      start: { x: 230, y: 270 },
      targets: [{
        x: 600, y: 270, r: 24, rate: 2.15,
        orbit: { cx: 500, cy: 270, r: 108, spd: 1.05, ph: 0.15 }
      }],
      dumps: []
    },
    {
      name: '三跳', sub: 'TRIO', time: 56, maxGap: 700, guide: false,
      hint: '中间有地柱。先上下两颗，最后远处那颗',
      toast: '绕开中柱，三颗都要点',
      src: { x: 136, y: 270 },
      start: { x: 218, y: 270 },
      targets: [
        { x: 460, y: 108, r: 21, rate: 1.75 },
        { x: 760, y: 138, r: 21, rate: 1.7 },
        { x: 490, y: 432, r: 21, rate: 1.75 }
      ],
      dumps: [{ x: 318, y: 270, r: 24 }]
    },
    {
      name: '扫柱', sub: 'SWEEP', time: 50, maxGap: 620, guide: false,
      hint: '扫柱会让路。看准缝再拉直',
      toast: '等粉柱让开，再穿金珠',
      src: { x: 140, y: 270 },
      start: { x: 222, y: 270 },
      targets: [{ x: 680, y: 270, r: 22, rate: 1.85 }],
      dumps: [
        { x: 400, y: 270, r: 24, osc: { spd: 2.15, ay: 148, ax: 0, ph: 0 } },
        { x: 540, y: 128, r: 20 }
      ]
    },
    {
      name: '终隙', sub: 'FINALE', time: 58, maxGap: 730, guide: false,
      hint: '两颗游珠，两根扫柱。贴火，别出圈',
      toast: '一颗一颗点。虚线圈是极限',
      src: { x: 128, y: 278 },
      start: { x: 214, y: 278 },
      targets: [
        {
          x: 430, y: 150, r: 20, rate: 2.25,
          orbit: { cx: 430, cy: 188, r: 72, spd: 1.28, ph: 0.6 }
        },
        {
          x: 640, y: 400, r: 20, rate: 2.2,
          osc: { spd: 1.05, ax: 130, ay: 0, ph: 0.4 }
        }
      ],
      dumps: [
        { x: 300, y: 360, r: 22 },
        { x: 560, y: 278, r: 20, osc: { spd: 1.72, ay: 118, ax: 0, ph: 1.1 } }
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
  const stageLabel = document.getElementById('stage-label');
  const goldLabel = document.getElementById('gold-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { u: false, d: false, l: false, r: false, shift: false };
  const pointer = { down: false, id: null, x: 0, y: 0, grab: false, ox: 0, oy: 0 };
  const particles = [];
  const motes = [];
  const ripples = [];
  const beads = [];

  const G = {
    mode: 'title',
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    time: 40,
    timeMax: 40,
    spec: STAGES[0],
    sx: 150,
    sy: 280,
    ax: 230,
    ay: 280,
    vx: 0,
    vy: 0,
    maxGap: 640,
    gap: 80,
    live: true,
    charging: false,
    lit: 0,
    need: 1,
    targets: [],
    dumps: [],
    lock: 0,
    stun: 0,
    hurtT: 0,
    shake: 0,
    flash: 0,
    flashCol: '#00f0ff',
    toastT: 0,
    clearT: 0,
    paused: false,
    crackleT: 0,
    hud: '',
    litTotal: 0,
    dumpsHit: 0
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
  function nse(i, t) {
    const s = Math.sin(i * 12.9898 + t * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    taut: null,
    tautGain: null,
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
      f.frequency.setValueAtTime(from || 900, t);
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
    crackle: function (hot) {
      this.ensure();
      this.noise(0.05 + (hot ? 0.03 : 0), hot ? 0.055 : 0.03, hot ? 1400 : 700, hot ? 420 : 220);
      if (hot) this.beep(rand(420, 880), 0.04, 'square', 0.018, rand(180, 320));
    },
    charge: function () {
      this.ensure();
      this.beep(520, 0.06, 'sine', 0.03, 880);
    },
    lit: function () {
      this.ensure();
      this.beep(440, 0.12, 'triangle', 0.07, 880);
      this.beep(660, 0.2, 'sine', 0.05, 1320);
    },
    dump: function () {
      this.ensure();
      this.noise(0.18, 0.1, 900, 140);
      this.beep(160, 0.22, 'sawtooth', 0.06, 48);
    },
    die: function () {
      this.ensure();
      this.beep(140, 0.1, 'square', 0.03, 70);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, 'triangle', 0.09, 880);
      this.beep(660, 0.24, 'sine', 0.07, 1320);
      this.beep(880, 0.38, 'sine', 0.055, 1760);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.42, 'sawtooth', 0.08, 55);
      this.beep(90, 0.64, 'square', 0.045, 40);
    },
    start: function () {
      this.ensure();
      this.beep(180, 0.14, 'sine', 0.06, 420);
      this.beep(280, 0.18, 'triangle', 0.045, 720);
    },
    tickDrone: function (play, gapU, spark, charge) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 48;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
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
      this.drone.frequency.setTargetAtTime(46 + (play ? 8 : 0) + gapU * 14, t, 0.14);
      this.droneGain.gain.setTargetAtTime(play ? 0.012 : 0.0001, t, 0.2);
      this.taut.frequency.setTargetAtTime(spark ? (90 + gapU * 220 + charge * 180) : 70, t, 0.08);
      this.tautGain.gain.setTargetAtTime(spark ? (0.012 + charge * 0.028) : 0.0001, t, 0.06);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 130) particles.shift();
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
    if (ripples.length > 16) ripples.shift();
    ripples.push({ x: x, y: y, r: 8, max: max || 54, t: 1, col: col || 'c' });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 2.4;
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

  function cloneNode(n) {
    const o = {
      x: n.x,
      y: n.y,
      r: n.r,
      rate: n.rate || 1.6,
      charge: 0,
      lit: false,
      pulse: Math.random() * TAU
    };
    if (n.orbit) {
      o.orbit = {
        cx: n.orbit.cx, cy: n.orbit.cy, r: n.orbit.r,
        spd: n.orbit.spd, ph: n.orbit.ph || 0
      };
    }
    if (n.osc) {
      o.osc = {
        spd: n.osc.spd,
        ax: n.osc.ax || 0,
        ay: n.osc.ay || 0,
        ph: n.osc.ph || 0
      };
    }
    return o;
  }

  function nodePos(n, t) {
    let x = n.x;
    let y = n.y;
    if (n.orbit) {
      const a = t * n.orbit.spd + n.orbit.ph;
      x = n.orbit.cx + Math.cos(a) * n.orbit.r;
      y = n.orbit.cy + Math.sin(a) * n.orbit.r;
    }
    if (n.osc) {
      const s = Math.sin(t * n.osc.spd + n.osc.ph);
      x += s * n.osc.ax;
      y += s * n.osc.ay;
    }
    return { x: x, y: y };
  }

  function distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    if (l2 < 1e-6) {
      return { d: hypot(px - ax, py - ay), t: 0, x: ax, y: ay };
    }
    const t = ((px - ax) * dx + (py - ay) * dy) / l2;
    const tc = t < 0 ? 0 : t > 1 ? 1 : t;
    const x = ax + dx * tc;
    const y = ay + dy * tc;
    return { d: hypot(px - x, py - y), t: t, x: x, y: y };
  }

  function clampAnode(x, y) {
    x = clamp(x, PAD, WORLD_W - PAD);
    y = clamp(y, PAD + 8, WORLD_H - PAD);
    const dx = x - G.sx;
    const dy = y - G.sy;
    const d = hypot(dx, dy);
    if (d < MIN_GAP) {
      const u = d < 0.001 ? 1 : MIN_GAP / d;
      x = G.sx + dx * u;
      y = G.sy + dy * u;
      x = clamp(x, PAD, WORLD_W - PAD);
      y = clamp(y, PAD + 8, WORLD_H - PAD);
    }
    return { x: x, y: y };
  }

  function loadStage(index) {
    const s = STAGES[index];
    G.stage = index;
    G.spec = s;
    G.sx = s.src.x;
    G.sy = s.src.y;
    G.maxGap = s.maxGap;
    const st = clampAnode(s.start.x, s.start.y);
    G.ax = st.x;
    G.ay = st.y;
    G.vx = 0;
    G.vy = 0;
    G.time = s.time;
    G.timeMax = s.time;
    G.clock = 0;
    G.lock = 0.12;
    G.stun = 0;
    G.hurtT = 0;
    G.clearT = 0;
    G.charging = false;
    G.targets = [];
    for (let i = 0; i < s.targets.length; i++) G.targets.push(cloneNode(s.targets[i]));
    G.dumps = [];
    for (let i = 0; i < s.dumps.length; i++) G.dumps.push(cloneNode(s.dumps[i]));
    G.need = G.targets.length;
    G.lit = 0;
    pointer.down = false;
    pointer.grab = false;
    canvas.classList.remove('press');
    beads.length = 0;
    toast(s.toast);
    hintEl.textContent = s.hint;
    hintEl.classList.remove('hot', 'warn');
  }

  function startRun() {
    G.mode = 'play';
    G.lives = LIVES;
    G.litTotal = 0;
    G.dumpsHit = 0;
    G.shake = 0;
    G.flash = 0;
    hideOverlay();
    loadStage(0);
    audio.start();
  }

  function showOverlay(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'SPARK';
      ovTitle.textContent = '跳火';
      ovLead.innerHTML = '拉开电极，让火花穿过金珠。<br />粉柱会偷火。拉太远火花会熄。';
      ovOps.textContent = '拖动电极 · WASD / 方向键 · Shift 微调 · M 静音';
      ovBtn.textContent = '开跳';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'CLEAR';
      ovTitle.textContent = '火通';
      ovLead.textContent = '十隙都跳通了。金珠还在亮。';
      ovOps.textContent = '点亮 ' + G.litTotal + ' 珠 · 偷火 ' + G.dumpsHit + ' 次';
      ovBtn.textContent = '再跳一次';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'DARK';
      ovTitle.textContent = '火灭';
      ovLead.textContent = '间隙还开着，火已经没了。';
      ovOps.textContent = STAGES[G.stage].name + ' · 点亮 ' + G.litTotal + ' 珠';
      ovBtn.textContent = '再来一局';
    }
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function rewindLit() {
    for (let i = 0; i < G.targets.length; i++) {
      if (G.targets[i].lit) G.litTotal = Math.max(0, G.litTotal - 1);
    }
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'play' || G.mode === 'clear') {
      rewindLit();
      loadStage(G.stage);
      audio.start();
      G.mode = 'play';
    } else {
      startRun();
    }
  }

  function onMain() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startRun();
  }

  function countLit() {
    let n = 0;
    for (let i = 0; i < G.targets.length; i++) if (G.targets[i].lit) n += 1;
    G.lit = n;
    return n;
  }

  function succeedStage() {
    if (G.mode !== 'play') return;
    G.mode = 'clear';
    G.clearT = 0.92;
    G.lock = 1;
    hintEl.classList.remove('warn');
    hintEl.classList.add('hot');
    toast('点亮', 'gold');
    audio.lit();
    G.flash = 0.28;
    G.flashCol = '#ffe36b';
    G.shake = 4;
    ripple(G.ax, G.ay, 'g', 70);
    emit(22, {
      x: G.ax, y: G.ay, j: 10,
      vx0: -160, vx1: 160, vy0: -180, vy1: 40,
      life: 0.5, r0: 1.2, r1: 3.8, col: 'g'
    });
  }

  function nextStage() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay('win');
      return;
    }
    G.mode = 'play';
    hintEl.classList.remove('hot', 'warn');
    loadStage(G.stage + 1);
  }

  function missLife(why) {
    if (G.mode !== 'play') return;
    G.lives -= 1;
    G.lock = 0.35;
    hintEl.classList.remove('hot');
    hintEl.classList.add('warn');
    if (why === 'dump') {
      toast('偷火', 'warn');
      G.dumpsHit += 1;
    } else if (why !== 'time') {
      toast('熄了', 'warn');
    }
    if (G.lives <= 0) {
      G.mode = 'lose';
      audio.lose();
      showOverlay('lose');
      return;
    }
    if (why === 'time') {
      rewindLit();
      loadStage(G.stage);
      G.mode = 'play';
      toast('超时', 'warn');
    }
  }

  function hitDump(d, p) {
    if (G.hurtT > 0 || G.mode !== 'play') return;
    audio.dump();
    G.flash = 0.34;
    G.flashCol = '#ff3db8';
    G.shake = 8;
    G.stun = 0.22;
    G.hurtT = 0.85;
    ripple(p.x, p.y, 'm', 52);
    emit(24, {
      x: p.x, y: p.y, j: 8,
      vx0: -200, vx1: 200, vy0: -220, vy1: 60,
      life: 0.46, r0: 1.2, r1: 3.6, col: 'm'
    });
    const dx = G.ax - p.x;
    const dy = G.ay - p.y;
    const dd = hypot(dx, dy) || 1;
    G.vx += (dx / dd) * 420;
    G.vy += (dy / dd) * 420;
    const back = clampAnode(G.ax + (G.sx - G.ax) * 0.12, G.ay + (G.sy - G.ay) * 0.12);
    G.ax = back.x;
    G.ay = back.y;
    missLife('dump');
  }

  function buildBolt(x0, y0, x1, y1, t, jag) {
    const pts = [{ x: x0, y: y0 }];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const n = Math.max(7, Math.min(16, (len / 36) | 0));
    for (let i = 1; i < n; i++) {
      const u = i / n;
      const fall = Math.sin(u * Math.PI);
      const ns = (nse(i, t) - 0.5) * 2;
      const ns2 = (nse(i + 9, t * 1.7) - 0.5) * 2;
      const off = (ns * 0.7 + ns2 * 0.3) * jag * fall;
      pts.push({
        x: x0 + dx * u + nx * off,
        y: y0 + dy * u + ny * off
      });
    }
    pts.push({ x: x1, y: y1 });
    return pts;
  }

  function pullToward(dt) {
    let ix = 0;
    let iy = 0;
    if (keys.l) ix -= 1;
    if (keys.r) ix += 1;
    if (keys.u) iy -= 1;
    if (keys.d) iy += 1;
    const spd = (keys.shift ? MOVE * 0.36 : MOVE) * (G.stun > 0 ? 0.22 : 1);
    if (ix || iy) {
      const m = hypot(ix, iy) || 1;
      G.vx += (ix / m) * spd * 12 * dt;
      G.vy += (iy / m) * spd * 12 * dt;
    }
    if (pointer.down && G.mode === 'play') {
      const tx = pointer.grab ? pointer.x - pointer.ox : pointer.x;
      const ty = pointer.grab ? pointer.y - pointer.oy : pointer.y;
      const k = 1 - Math.pow(0.0008, dt);
      G.ax = lerp(G.ax, tx, k);
      G.ay = lerp(G.ay, ty, k);
      G.vx *= 0.4;
      G.vy *= 0.4;
    }
    G.vx *= Math.exp(-8 * dt);
    G.vy *= Math.exp(-8 * dt);
    if (!pointer.down) {
      G.ax += G.vx * dt;
      G.ay += G.vy * dt;
    } else {
      G.ax += G.vx * dt * 0.25;
      G.ay += G.vy * dt * 0.25;
    }
    const c = clampAnode(G.ax, G.ay);
    G.ax = c.x;
    G.ay = c.y;
  }

  function updateSpark(dt, demo) {
    G.gap = hypot(G.ax - G.sx, G.ay - G.sy);
    const wasLive = G.live;
    if (G.live) G.live = G.gap <= G.maxGap + 8;
    else G.live = G.gap <= G.maxGap - 2;
    if (!demo && wasLive && !G.live) audio.die();

    G.charging = false;
    let maxCharge = 0;
    if (G.live) {
      for (let i = 0; i < G.targets.length; i++) {
        const tg = G.targets[i];
        const p = nodePos(tg, G.clock);
        const hit = distToSeg(p.x, p.y, G.sx, G.sy, G.ax, G.ay);
        const rad = tg.r * (coarse ? 1.12 : 1);
        const on = hit.t > 0.06 && hit.t < 1.05 && hit.d < rad;
        if (tg.lit) continue;
        if (on) {
          G.charging = true;
          if (demo) continue;
          const prev = tg.charge;
          tg.charge = clamp(tg.charge + tg.rate * dt, 0, 1);
          if (tg.charge >= 1) {
            tg.lit = true;
            tg.charge = 1;
            G.litTotal += 1;
            ripple(p.x, p.y, 'g', 64);
            emit(18, {
              x: p.x, y: p.y, j: 8,
              vx0: -140, vx1: 140, vy0: -160, vy1: 50,
              life: 0.48, r0: 1.2, r1: 3.4, col: 'g'
            });
            if (countLit() < G.need) {
              audio.lit();
              toast('金亮', 'gold');
            }
          } else if ((prev * 5 | 0) !== (tg.charge * 5 | 0)) {
            audio.charge();
          }
        } else if (!demo) {
          tg.charge = clamp(tg.charge - 0.38 * dt, 0, 1);
        }
        if (tg.charge > maxCharge) maxCharge = tg.charge;
      }
      if (!demo && G.hurtT <= 0) {
        for (let i = 0; i < G.dumps.length; i++) {
          const d = G.dumps[i];
          const p = nodePos(d, G.clock);
          const hit = distToSeg(p.x, p.y, G.sx, G.sy, G.ax, G.ay);
          if (hit.t > 0.08 && hit.t < 0.97 && hit.d < d.r) {
            hitDump(d, p);
            break;
          }
        }
      }
    } else if (!demo) {
      for (let i = 0; i < G.targets.length; i++) {
        const tg = G.targets[i];
        if (!tg.lit) tg.charge = clamp(tg.charge - 0.5 * dt, 0, 1);
      }
    }

    G.crackleT -= dt;
    if (!demo && G.live && G.crackleT <= 0) {
      G.crackleT = G.charging ? 0.055 : 0.09 + Math.random() * 0.05;
      audio.crackle(G.charging);
    }

    if (G.live && Math.random() < (G.charging ? 0.5 : 0.22)) {
      const u = Math.random();
      beads.push({
        u: 0,
        spd: 1.6 + Math.random() * 1.8,
        life: 0.45,
        max: 0.45,
        hot: G.charging
      });
      if (beads.length > 18) beads.shift();
      emit(1, {
        x: lerp(G.sx, G.ax, u),
        y: lerp(G.sy, G.ay, u),
        j: 4,
        vx0: -40, vx1: 40, vy0: -50, vy1: 20,
        life: 0.22, r0: 0.8, r1: 2.2,
        col: G.charging ? 'g' : 'c'
      });
    }

    if (!demo && G.mode === 'play' && countLit() >= G.need) succeedStage();
    return maxCharge;
  }

  function updateFx(dt) {
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.lock > 0) G.lock -= dt;
    if (G.stun > 0) G.stun -= dt;
    if (G.hurtT > 0) G.hurtT -= dt;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy += 40 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.6;
      r.r += dt * r.max * 1.8;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = beads.length - 1; i >= 0; i--) {
      const b = beads[i];
      b.u += b.spd * dt;
      b.life -= dt;
      if (b.u > 1 || b.life <= 0) beads.splice(i, 1);
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    G.sx = 210;
    G.sy = 278;
    G.maxGap = 520;
    G.ax = 210 + 200 + Math.sin(G.t * 0.72) * 78;
    G.ay = 278 + Math.sin(G.t * 0.94) * 42;
    const c = clampAnode(G.ax, G.ay);
    G.ax = c.x;
    G.ay = c.y;
    G.targets = [{
      x: 390, y: 270, r: 26, rate: 1, charge: 0.45 + 0.4 * Math.abs(Math.sin(G.t * 1.4)),
      lit: false, pulse: 0
    }];
    G.dumps = [{ x: 560, y: 410, r: 18, charge: 0, lit: false, pulse: 0 }];
    G.need = 1;
    G.live = true;
    updateSpark(dt, true);
  }

  function updatePlay(dt) {
    G.clock += dt;
    if (G.mode === 'clear') {
      G.clearT -= dt;
      updateSpark(dt, true);
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (G.mode !== 'play') return;
    pullToward(dt);
    updateSpark(dt, false);
    if (G.mode === 'play') {
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        audio.dump();
        G.flash = 0.3;
        G.flashCol = '#ff3db8';
        missLife('time');
      }
    }
  }

  function colOf(c) {
    if (c === 'm') return '#ff3db8';
    if (c === 'g') return '#ffe36b';
    return '#00f0ff';
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

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function strokeBolt(pts, width, col, alpha, blur) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = col;
    ctx.shadowBlur = blur;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function drawGuide() {
    if (!G.spec || !G.spec.guide || G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    let tg = null;
    for (let i = 0; i < G.targets.length; i++) {
      if (!G.targets[i].lit) { tg = G.targets[i]; break; }
    }
    if (!tg) return;
    const p = nodePos(tg, G.clock);
    const dx = p.x - G.sx;
    const dy = p.y - G.sy;
    const d = hypot(dx, dy) || 1;
    const reach = Math.min(G.maxGap, d + 88);
    const x1 = G.sx + dx / d * reach;
    const y1 = G.sy + dy / d * reach;
    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.28)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(G.sx, G.sy);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  function drawRange() {
    const warn = G.gap > G.maxGap * 0.86;
    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = warn ? 'rgba(255, 61, 184, 0.42)' : 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = warn ? 2 : 1.3;
    ctx.shadowColor = warn ? '#ff3db8' : 'transparent';
    ctx.shadowBlur = warn ? 10 : 0;
    ctx.beginPath();
    ctx.arc(G.sx, G.sy, G.maxGap, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawInsulator(x, y0, y1) {
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 186, 214, 0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    const n = 4;
    for (let i = 0; i < n; i++) {
      const y = lerp(y0 + 10, y1 - 8, i / (n - 1));
      ctx.fillStyle = 'rgba(210, 214, 230, 0.16)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y, 11, 4.2, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawElectrode(x, y, r, col, hot, src) {
    if (src) drawInsulator(x, y + r + 2, WORLD_H - 36);
    const grd = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 1, x, y, r * 1.8);
    grd.addColorStop(0, rgb(col, hot ? 0.95 : 0.7));
    grd.addColorStop(0.45, rgb(mix(col, INK, 0.15), 0.9));
    grd.addColorStop(1, 'rgba(8, 6, 18, 0.9)');
    ctx.save();
    ctx.shadowColor = rgb(col, 1);
    ctx.shadowBlur = hot ? 22 : 10;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgb(col, 0.85);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.beginPath();
    ctx.arc(x - r * 0.32, y - r * 0.34, r * 0.22, 0, TAU);
    ctx.fill();
    if (hot) {
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(G.t * 18);
      ctx.strokeStyle = rgb(col, 0.7);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, r + 7 + Math.sin(G.t * 11) * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    if (!src) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r + 7, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDump(d) {
    const p = nodePos(d, G.clock);
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 6 + d.pulse);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, d.r + 6, 0, TAU);
    ctx.fill();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = rgb(MAG, 0.16 + pulse * 0.12);
    ctx.beginPath();
    ctx.moveTo(0, -d.r - 8);
    ctx.lineTo(d.r * 0.62, d.r * 0.55);
    ctx.lineTo(-d.r * 0.62, d.r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgb(MAG, 0.85);
    ctx.shadowColor = '#ff3db8';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0814';
    ctx.beginPath();
    ctx.arc(0, 4, d.r * 0.42, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgb(MAG, 0.9);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + d.r * 0.5);
    ctx.lineTo(p.x, WORLD_H - 36);
    ctx.stroke();
    ctx.restore();
  }

  function drawTarget(tg) {
    const p = nodePos(tg, G.clock);
    const lit = tg.lit;
    const ch = tg.charge;
    const col = lit ? GOLD : mix(CYN, GOLD, ch);
    ctx.save();
    ctx.shadowColor = rgb(col, 1);
    ctx.shadowBlur = lit ? 24 : 10 + ch * 12;
    ctx.strokeStyle = rgb(col, lit ? 0.95 : 0.55 + ch * 0.4);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, tg.r, 0, TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgb(GOLD, lit ? 0.55 : 0.08 + ch * 0.4);
    ctx.beginPath();
    ctx.arc(p.x, p.y, tg.r * (lit ? 0.72 : 0.42 + ch * 0.28), 0, TAU);
    ctx.fill();
    if (!lit) {
      ctx.strokeStyle = rgb(GOLD, 0.7);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, tg.r - 4, -Math.PI / 2, -Math.PI / 2 + TAU * ch);
      ctx.stroke();
    } else {
      const a = G.t * 3 + tg.pulse;
      ctx.strokeStyle = 'rgba(255, 248, 210, 0.7)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const ang = a + i * TAU / 4;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(ang) * (tg.r * 0.2), p.y + Math.sin(ang) * (tg.r * 0.2));
        ctx.lineTo(p.x + Math.cos(ang) * (tg.r * 0.62), p.y + Math.sin(ang) * (tg.r * 0.62));
        ctx.stroke();
      }
    }
    ctx.restore();
    glowDot(p.x, p.y, lit ? 4.2 : 2.4, '#ffe36b', lit ? 0.9 : 0.35 + ch * 0.5);
  }

  function drawCable() {
    const x0 = G.ax;
    const y0 = G.ay + ANODE_R + 4;
    const x1 = WORLD_W - 42;
    const y1 = WORLD_H - 34;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0 + 40, y0 + 80, x1 - 80, y1 - 10, x1, y1);
    ctx.stroke();
    ctx.fillStyle = '#0b1220';
    ctx.strokeStyle = rgb(CYN, 0.55);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x1, y1, 7, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBus() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, WORLD_H - 34);
    ctx.lineTo(WORLD_W - 36, WORLD_H - 34);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 61, 184, 0.08)';
    ctx.fillRect(28, WORLD_H - 28, WORLD_W - 56, 16);
    ctx.restore();
  }

  function drawWorld() {
    const grd = ctx.createRadialGradient(G.sx, G.sy, 20, WORLD_W * 0.55, WORLD_H * 0.4, 640);
    grd.addColorStop(0, '#0c0718');
    grd.addColorStop(1, '#05030c');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    const neb = ctx.createRadialGradient(80, 30, 8, 80, 30, 340);
    neb.addColorStop(0, 'rgba(255, 61, 184, 0.16)');
    neb.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb2 = ctx.createRadialGradient(860, 50, 8, 860, 50, 340);
    neb2.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    neb2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 40; x < WORLD_W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x, WORLD_H - 40);
      ctx.stroke();
    }
    for (let y = 28; y < WORLD_H - 36; y += 48) {
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(WORLD_W - 28, y);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.t * m.s + m.p));
      glowDot(m.x, (m.y + G.t * 8 * m.s) % WORLD_H, m.r, i % 3 === 0 ? '#ff3db8' : '#00f0ff', a);
    }

    drawBus();
    drawRange();
    drawGuide();
    drawCable();

    for (let i = 0; i < G.dumps.length; i++) drawDump(G.dumps[i]);
    for (let i = 0; i < G.targets.length; i++) drawTarget(G.targets[i]);

    const jag = (G.live ? 10 : 3) + G.gap * 0.012;
    if (G.live) {
      const pts = buildBolt(G.sx, G.sy, G.ax, G.ay, G.t * 22, jag);
      const fat = lerp(7.5, 2.2, clamp(G.gap / G.maxGap, 0, 1));
      const boltCol = G.charging ? '#ffe36b' : '#00f0ff';
      const core = G.charging ? '#fff8d0' : '#f4feff';
      strokeBolt(pts, fat * 3.2, boltCol, 0.14, 18);
      strokeBolt(pts, fat * 1.6, boltCol, 0.4, 10);
      strokeBolt(pts, 2.3, core, 0.95, 6);
      strokeBolt(pts, 1.05, '#ffffff', 0.9, 0);

      if (G.charging) {
        for (let i = 0; i < G.targets.length; i++) {
          const tg = G.targets[i];
          if (tg.lit) continue;
          const p = nodePos(tg, G.clock);
          const hit = distToSeg(p.x, p.y, G.sx, G.sy, G.ax, G.ay);
          if (hit.d < tg.r * 1.6) {
            const fork = buildBolt(hit.x, hit.y, p.x, p.y, G.t * 30, 6);
            strokeBolt(fork, 2.4, '#ffe36b', 0.7, 8);
          }
        }
      }

      for (let i = 0; i < beads.length; i++) {
        const b = beads[i];
        const x = lerp(G.sx, G.ax, b.u);
        const y = lerp(G.sy, G.ay, b.u);
        glowDot(x, y, b.hot ? 3.4 : 2.4, b.hot ? '#ffe36b' : '#00f0ff', 0.85 * (b.life / b.max));
      }
    } else {
      const stub = 18 + Math.sin(G.t * 40) * 6;
      const ang = Math.atan2(G.ay - G.sy, G.ax - G.sx);
      const pts = buildBolt(
        G.sx, G.sy,
        G.sx + Math.cos(ang) * stub,
        G.sy + Math.sin(ang) * stub,
        G.t * 30, 8
      );
      strokeBolt(pts, 4, '#ff3db8', 0.35, 10);
      strokeBolt(pts, 1.4, '#ffd0ec', 0.7, 4);
    }

    drawElectrode(G.sx, G.sy, SRC_R, MAG, true, true);
    drawElectrode(G.ax, G.ay, ANODE_R, CYN, G.live, false);

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

  function syncHud(force) {
    const ratio = G.maxGap > 1 ? clamp(G.gap / G.maxGap, 0, 1.15) : 0;
    const over = !G.live;
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + (G.gap | 0) + ':' + G.lit + ':' + (G.charging ? 1 : 0) + ':' + (G.time | 0) + ':' + (over ? 1 : 0);
    if (!force && key === G.hud) return;
    G.hud = key;
    const s = G.spec || STAGES[0];
    if (G.mode === 'title') {
      stageLabel.textContent = '跳火';
      goldLabel.textContent = 'SPARK';
      timeLabel.textContent = '—';
      timeLabel.classList.remove('warn');
      fillNum.textContent = '—';
      fillBar.style.transform = 'scaleX(0.22)';
      fillWrap.classList.remove('hot', 'warn');
    } else {
      stageLabel.textContent = '关卡 ' + (G.stage + 1) + '/' + STAGES.length + ' · ' + s.name + ' ' + s.sub;
      stageLabel.classList.toggle('hot', G.mode === 'clear');
      goldLabel.textContent = '金 ' + G.lit + '/' + G.need;
      const sec = Math.ceil(Math.max(0, G.time));
      timeLabel.textContent = '时 ' + sec;
      timeLabel.classList.toggle('warn', G.mode === 'play' && G.time < 8);
      fillNum.textContent = over ? '过' : Math.round(clamp(ratio, 0, 1) * 100) + '%';
      fillBar.style.transform = 'scaleX(' + clamp(ratio, 0, 1) + ')';
      fillWrap.classList.toggle('hot', G.charging || G.mode === 'clear');
      fillWrap.classList.toggle('warn', over && G.mode === 'play');
    }
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? ' on warn' : ' on') : '') + '"></i>';
    }
    pipsEl.innerHTML = html;
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
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        if (G.mode === 'title') updateTitle(STEP);
        else if (G.mode === 'play' || G.mode === 'clear') updatePlay(STEP);
        updateFx(STEP);
        acc -= STEP;
      }
      const gapU = clamp(G.gap / (G.maxGap || 1), 0, 1.2);
      audio.tickDrone(
        G.mode === 'play' || G.mode === 'clear' || G.mode === 'title',
        gapU,
        G.live && (G.mode === 'play' || G.mode === 'title' || G.mode === 'clear'),
        G.charging ? 1 : 0
      );
      syncHud(false);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function beginDrag(w) {
    if (G.mode !== 'play') return;
    pointer.down = true;
    const near = hypot(w.x - G.ax, w.y - G.ay) < 54;
    pointer.grab = near;
    pointer.ox = near ? w.x - G.ax : 0;
    pointer.oy = near ? w.y - G.ay : 0;
    canvas.classList.add('press');
    audio.ensure();
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space') {
      e.preventDefault();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
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
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = true;
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = false;
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (G.mode !== 'play') return;
    e.preventDefault();
    audio.ensure();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const w = worldFromEvent(e);
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    beginDrag(w);
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
  });

  function endDrag(e) {
    if (e && pointer.id !== null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    pointer.grab = false;
    canvas.classList.remove('press');
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

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
  showOverlay('title');
  syncHud(true);
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
