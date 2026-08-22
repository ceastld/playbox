'use strict';

(function () {
  const WORLD_H = 360;
  const SPEED_Y = 268;
  const PLAYER_R = 12;
  const EXIT_R = 52;
  const TAU = Math.PI * 2;

  const STAGES = [
    {
      name: '浅湾',
      sub: 'BAY',
      hint: '钻进发亮的缺口',
      len: 1180,
      exitX: 1020,
      exitY: 180,
      o2: 18,
      speed: 116,
      hall: 72,
      pinches: [],
      beacons: [
        { x: 620, y: 180, safe: 180, gap: 62, speed: 68, thick: 16, rMax: 440, trig: 500, charge: 0.95 }
      ]
    },
    {
      name: '双响',
      sub: 'PAIR',
      hint: '连续穿过两道环',
      len: 1560,
      exitX: 1400,
      exitY: 180,
      o2: 20,
      speed: 118,
      hall: 72,
      pinches: [],
      beacons: [
        { x: 520, y: 178, safe: 176, gap: 54, speed: 78, thick: 16, rMax: 430, trig: 470, charge: 0.82 },
        { x: 980, y: 182, safe: 184, gap: 50, speed: 84, thick: 16, rMax: 420, trig: 450, charge: 0.72 }
      ]
    },
    {
      name: '错位',
      sub: 'SHIFT',
      hint: '缺口深度会变',
      len: 1780,
      exitX: 1620,
      exitY: 188,
      o2: 20,
      speed: 120,
      hall: 72,
      pinches: [],
      beacons: [
        { x: 500, y: 150, safe: 108, gap: 48, speed: 86, thick: 16, rMax: 420, trig: 450, charge: 0.7 },
        { x: 920, y: 220, safe: 258, gap: 46, speed: 92, thick: 15, rMax: 410, trig: 430, charge: 0.62 },
        { x: 1320, y: 180, safe: 168, gap: 44, speed: 96, thick: 15, rMax: 400, trig: 400, charge: 0.56 }
      ]
    },
    {
      name: '岩喉',
      sub: 'THROAT',
      hint: '岩壁会收窄',
      len: 1860,
      exitX: 1700,
      exitY: 176,
      o2: 19.5,
      speed: 122,
      hall: 70,
      pinches: [
        { x: 920, w: 240, side: 'both', amt: 86 }
      ],
      beacons: [
        { x: 480, y: 180, safe: 200, gap: 44, speed: 94, thick: 15, rMax: 400, trig: 420, charge: 0.58 },
        { x: 920, y: 180, safe: 176, gap: 36, speed: 102, thick: 15, rMax: 360, trig: 380, charge: 0.5 },
        { x: 1360, y: 200, safe: 250, gap: 38, speed: 106, thick: 14, rMax: 390, trig: 390, charge: 0.48 }
      ]
    },
    {
      name: '急脉',
      sub: 'PULSE',
      hint: '环更快，缺口更窄',
      len: 1980,
      exitX: 1820,
      exitY: 170,
      o2: 19,
      speed: 124,
      hall: 70,
      pinches: [],
      beacons: [
        { x: 460, y: 140, safe: 96, gap: 36, speed: 112, thick: 14, rMax: 390, trig: 400, charge: 0.46 },
        { x: 840, y: 230, safe: 268, gap: 34, speed: 118, thick: 14, rMax: 380, trig: 380, charge: 0.42 },
        { x: 1200, y: 120, safe: 92, gap: 32, speed: 124, thick: 14, rMax: 370, trig: 360, charge: 0.4 },
        { x: 1540, y: 240, safe: 262, gap: 32, speed: 128, thick: 13, rMax: 360, trig: 340, charge: 0.38 }
      ]
    },
    {
      name: '交错',
      sub: 'CROSS',
      hint: '深浅交错，跟上缺口',
      len: 2040,
      exitX: 1880,
      exitY: 180,
      o2: 18,
      speed: 126,
      hall: 68,
      pinches: [],
      beacons: [
        { x: 420, y: 100, safe: 78, gap: 32, speed: 126, thick: 13, rMax: 360, trig: 360, charge: 0.4 },
        { x: 720, y: 270, safe: 286, gap: 30, speed: 132, thick: 13, rMax: 350, trig: 330, charge: 0.36 },
        { x: 1020, y: 90, safe: 74, gap: 28, speed: 136, thick: 13, rMax: 340, trig: 310, charge: 0.34 },
        { x: 1320, y: 280, safe: 288, gap: 28, speed: 140, thick: 12, rMax: 330, trig: 300, charge: 0.32 },
        { x: 1600, y: 180, safe: 170, gap: 28, speed: 144, thick: 12, rMax: 320, trig: 290, charge: 0.3 }
      ]
    },
    {
      name: '夹缝',
      sub: 'SQUEEZE',
      hint: '夹缝里穿环',
      len: 2120,
      exitX: 1960,
      exitY: 168,
      o2: 17.5,
      speed: 128,
      hall: 64,
      pinches: [
        { x: 680, w: 260, side: 'top', amt: 118 },
        { x: 1240, w: 270, side: 'bot', amt: 122 },
        { x: 1680, w: 200, side: 'both', amt: 78 }
      ],
      beacons: [
        { x: 440, y: 200, safe: 230, gap: 30, speed: 130, thick: 13, rMax: 350, trig: 340, charge: 0.36 },
        { x: 720, y: 230, safe: 250, gap: 26, speed: 138, thick: 13, rMax: 300, trig: 300, charge: 0.3 },
        { x: 1060, y: 140, safe: 96, gap: 26, speed: 142, thick: 12, rMax: 340, trig: 300, charge: 0.28 },
        { x: 1280, y: 130, safe: 88, gap: 24, speed: 146, thick: 12, rMax: 300, trig: 280, charge: 0.26 },
        { x: 1680, y: 180, safe: 168, gap: 24, speed: 150, thick: 12, rMax: 280, trig: 260, charge: 0.24 }
      ]
    },
    {
      name: '连扫',
      sub: 'SWEEP',
      hint: '预警更短',
      len: 2040,
      exitX: 1880,
      exitY: 190,
      o2: 16.6,
      speed: 130,
      hall: 64,
      pinches: [
        { x: 1080, w: 200, side: 'both', amt: 70 }
      ],
      beacons: [
        { x: 400, y: 160, safe: 92, gap: 26, speed: 148, thick: 13, rMax: 340, trig: 280, charge: 0.26 },
        { x: 640, y: 220, safe: 268, gap: 24, speed: 152, thick: 13, rMax: 330, trig: 250, charge: 0.22 },
        { x: 880, y: 140, safe: 88, gap: 24, speed: 156, thick: 12, rMax: 320, trig: 240, charge: 0.2 },
        { x: 1120, y: 180, safe: 180, gap: 22, speed: 158, thick: 12, rMax: 300, trig: 230, charge: 0.2 },
        { x: 1360, y: 250, safe: 276, gap: 22, speed: 160, thick: 12, rMax: 310, trig: 230, charge: 0.18 },
        { x: 1600, y: 110, safe: 82, gap: 22, speed: 164, thick: 12, rMax: 300, trig: 220, charge: 0.18 }
      ]
    },
    {
      name: '暗潮',
      sub: 'DARK',
      hint: '贴顶贴底，氧气很紧',
      len: 2180,
      exitX: 2020,
      exitY: 248,
      o2: 16.8,
      speed: 132,
      hall: 60,
      pinches: [
        { x: 580, w: 220, side: 'top', amt: 100 },
        { x: 1080, w: 240, side: 'bot', amt: 108 },
        { x: 1600, w: 230, side: 'both', amt: 88 }
      ],
      beacons: [
        { x: 400, y: 240, safe: 268, gap: 24, speed: 152, thick: 12, rMax: 330, trig: 260, charge: 0.22 },
        { x: 640, y: 250, safe: 280, gap: 22, speed: 158, thick: 12, rMax: 290, trig: 240, charge: 0.2 },
        { x: 900, y: 110, safe: 78, gap: 22, speed: 160, thick: 12, rMax: 320, trig: 250, charge: 0.18 },
        { x: 1140, y: 100, safe: 72, gap: 20, speed: 164, thick: 12, rMax: 280, trig: 230, charge: 0.18 },
        { x: 1420, y: 250, safe: 282, gap: 20, speed: 168, thick: 11, rMax: 320, trig: 230, charge: 0.16 },
        { x: 1640, y: 180, safe: 176, gap: 20, speed: 170, thick: 11, rMax: 260, trig: 210, charge: 0.16 },
        { x: 1860, y: 240, safe: 250, gap: 22, speed: 166, thick: 12, rMax: 280, trig: 200, charge: 0.16 }
      ]
    },
    {
      name: '深渊',
      sub: 'ABYSS',
      hint: '最后一航，缺口极窄',
      len: 2280,
      exitX: 2120,
      exitY: 88,
      o2: 17.1,
      speed: 134,
      hall: 56,
      pinches: [
        { x: 500, w: 210, side: 'bot', amt: 110 },
        { x: 960, w: 220, side: 'top', amt: 118 },
        { x: 1420, w: 220, side: 'both', amt: 96 },
        { x: 1880, w: 230, side: 'bot', amt: 128 }
      ],
      beacons: [
        { x: 380, y: 120, safe: 80, gap: 22, speed: 160, thick: 12, rMax: 320, trig: 250, charge: 0.2 },
        { x: 580, y: 110, safe: 74, gap: 20, speed: 166, thick: 12, rMax: 280, trig: 220, charge: 0.16 },
        { x: 820, y: 260, safe: 286, gap: 20, speed: 170, thick: 11, rMax: 330, trig: 230, charge: 0.16 },
        { x: 1040, y: 260, safe: 290, gap: 18, speed: 174, thick: 11, rMax: 280, trig: 210, charge: 0.14 },
        { x: 1280, y: 180, safe: 168, gap: 18, speed: 176, thick: 11, rMax: 300, trig: 210, charge: 0.14 },
        { x: 1500, y: 180, safe: 180, gap: 18, speed: 178, thick: 11, rMax: 250, trig: 200, charge: 0.14 },
        { x: 1740, y: 90, safe: 72, gap: 18, speed: 180, thick: 11, rMax: 320, trig: 210, charge: 0.13 },
        { x: 1960, y: 90, safe: 78, gap: 18, speed: 182, thick: 11, rMax: 260, trig: 190, charge: 0.12 }
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
  const o2Wrap = document.getElementById('o2-wrap');
  const o2Fill = document.getElementById('o2-fill');
  const o2Num = document.getElementById('o2-num');
  const stageLabel = document.getElementById('stage-label');
  const distLabel = document.getElementById('dist-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let camX = 0;

  const keys = { up: false, down: false };
  const pointer = { down: false, id: null, y: 180 };

  const particles = [];
  const bubbles = [];
  const motes = [];
  const rings = [];

  const G = {
    mode: 'title',
    t: 0,
    o2: 18,
    o2Max: 18,
    dodged: 0,
    runDodged: 0,
    near: 0,
    shake: 0,
    flash: 0,
    cyanFlash: 0,
    lock: 0,
    why: '',
    dieT: 0,
    toastT: 0,
    warned: false,
    taught: false,
    dockHint: false,
    prop: 0,
    vy: 0,
    player: { x: 80, y: 180, target: 180 },
    beacons: [],
    clock: 0,
    stage: 0,
    stageDef: STAGES[0],
    worldLen: STAGES[0].len,
    exitX: STAGES[0].exitX,
    exitY: STAGES[0].exitY,
    speed: STAGES[0].speed
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
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
    drone: null,
    droneGain: null,
    muted: false,
    lastWarn: -9,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem('sonar-dive-mute', m ? '1' : '0');
      } catch (e) { /* ignore */ }
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
    ping() {
      this.ensure();
      this.beep(980, 0.55, 'sine', 0.09, 180);
      this.beep(420, 0.4, 'triangle', 0.05, 110);
    },
    charge() {
      this.ensure();
      this.beep(160, 0.28, 'sine', 0.035, 280);
    },
    gap() {
      this.ensure();
      this.beep(720, 0.12, 'sine', 0.07, 1080);
      this.beep(480, 0.16, 'triangle', 0.04, 720);
    },
    warn() {
      this.ensure();
      this.beep(240, 0.14, 'square', 0.04, 140);
    },
    win() {
      this.ensure();
      this.beep(440, 0.18, 'triangle', 0.1, 880);
      this.beep(660, 0.28, 'sine', 0.08, 1320);
      this.beep(880, 0.4, 'sine', 0.05, 1760);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.45, 'sawtooth', 0.09, 60);
      this.beep(90, 0.7, 'square', 0.05, 40);
    },
    start() {
      this.ensure();
      this.beep(220, 0.18, 'sine', 0.07, 520);
    },
    tickDrone(o2) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 58;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const low = o2 < 10;
      this.drone.frequency.setTargetAtTime(low ? 48 : 58, t, 0.12);
      this.droneGain.gain.setTargetAtTime(G.mode === 'play' ? (low ? 0.045 : 0.022) : 0.0001, t, 0.15);
    },
    stopDrone() {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  };

  try {
    if (localStorage.getItem('sonar-dive-mute') === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function envelope(x) {
    let top = 24;
    let bot = WORLD_H - 24;
    const n = Math.sin(x * 0.0084) * 14 + Math.sin(x * 0.018 + 1.4) * 9;
    top += n;
    bot -= n * 0.7;
    const st = G.stageDef;
    const pinches = (st && st.pinches) || [];
    for (let i = 0; i < pinches.length; i++) {
      const p = pinches[i];
      const u = 1 - Math.abs((x - p.x) / p.w);
      if (u > 0) {
        if (p.side !== 'bot') top += p.amt * u;
        if (p.side !== 'top') bot -= p.amt * u;
      }
    }
    const hall = (st && st.hall) || 72;
    if (top > bot - hall) {
      const m = (top + bot) * 0.5;
      const h = hall * 0.5;
      top = m - h;
      bot = m + h;
    }
    return { top: top, bot: bot };
  }

  function sx(x) {
    return (x - camX) * scale;
  }
  function sy(y) {
    return y * scale;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * ((G.worldLen || 1600) + 800) - 200,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.28 + 0.04,
        s: Math.random() * 8 + 4,
        p: Math.random() * TAU
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 90) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: spec.mag || false
      });
    }
  }

  function bubble(x, y, n) {
    for (let i = 0; i < n; i++) {
      if (bubbles.length > 48) bubbles.shift();
      bubbles.push({
        x: x + rand(-6, 6),
        y: y + rand(-4, 4),
        vx: rand(-8, 14),
        vy: rand(-42, -16),
        r: rand(1.2, 3.4),
        life: rand(0.5, 1.3)
      });
    }
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.remove('hidden');
    G.toastT = 2.3;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = H / WORLD_H;
  }

  function applyStage() {
    const s = STAGES[G.stage] || STAGES[0];
    G.stageDef = s;
    G.worldLen = s.len;
    G.exitX = s.exitX;
    G.exitY = s.exitY;
    G.speed = s.speed;
    G.o2Max = s.o2;
  }

  function resetRun() {
    applyStage();
    G.t = 0;
    G.o2 = G.o2Max;
    G.dodged = 0;
    G.near = 0;
    G.shake = 0;
    G.flash = 0;
    G.cyanFlash = 0;
    G.lock = 0.35;
    G.why = '';
    G.dieT = 0;
    G.warned = false;
    G.taught = G.stage > 0;
    G.dockHint = false;
    G.prop = 0;
    G.vy = 0;
    G.player.x = 86;
    G.player.y = 180;
    G.player.target = 180;
    G.clock = 0;
    rings.length = 0;
    particles.length = 0;
    bubbles.length = 0;
    G.beacons = G.stageDef.beacons.map(function (b) {
      return {
        x: b.x,
        y: b.y,
        safe: b.safe,
        gap: b.gap,
        speed: b.speed,
        thick: b.thick,
        rMax: b.rMax,
        period: b.period || 0,
        trig: b.trig,
        charge: b.charge,
        cd: 0,
        charging: 0,
        armed: false,
        live: true,
        spent: false
      };
    });
    makeMotes();
    pointer.down = false;
    pointer.id = null;
    keys.up = false;
    keys.down = false;
    o2Wrap.classList.remove('warn');
    syncHud();
  }

  function showPanel(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    const st = STAGES[G.stage] || STAGES[0];
    if (kind === 'title') {
      ovKicker.textContent = 'DIVE';
      ovTitle.textContent = '潜航';
      ovLead.innerHTML = '上浮下潜，从声呐环的盲区穿过。<br />十段航道，氧气在掉，驶向青色回收舱。';
      ovOps.textContent = 'W / ↑ 上浮 · S / ↓ 下潜 · 拖屏幕控深度 · M 静音';
      ovBtn.textContent = '下潜';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'DOCKED';
      ovTitle.textContent = '靠港';
      ovLead.textContent = '穿过十段声呐网，停进回收舱。';
      ovOps.textContent = '剩余氧气 ' + Math.max(0, G.o2).toFixed(1) + ' 秒 · 穿过 ' + G.runDodged + ' 道环';
      ovBtn.textContent = '再潜一次';
    } else {
      panel.classList.add('lose');
      if (G.why === 'air') {
        ovKicker.textContent = 'BLACKOUT';
        ovTitle.textContent = '气尽';
        ovLead.textContent = '第 ' + (G.stage + 1) + ' 航「' + st.name + '」氧气归零，潜器沉入暗处。';
      } else {
        ovKicker.textContent = 'LOCKED';
        ovTitle.textContent = '声呐锁定';
        ovLead.textContent = '第 ' + (G.stage + 1) + ' 航「' + st.name + '」波阵扫到艇壳，巡逻锁定了你。';
      }
      ovOps.textContent = '航行 ' + Math.max(0, G.player.x - 86 | 0) + ' · 穿过 ' + G.dodged + ' 道环 · 重开本航';
      ovBtn.textContent = '再潜一次';
    }
  }

  function cueStage() {
    const s = STAGES[G.stage];
    hintEl.textContent = s.hint + ' · M 静音';
    toast((G.stage + 1) + '/' + STAGES.length + ' ' + s.name + ' · ' + s.hint);
  }

  function startPlay(fromStart) {
    audio.start();
    if (fromStart || G.mode === 'title' || G.mode === 'win' || G.mode === 'docking') {
      G.stage = 0;
      G.runDodged = 0;
    } else if (G.mode === 'clearing') {
      G.runDodged += G.dodged;
      if (G.stage < STAGES.length - 1) G.stage += 1;
    }
    resetRun();
    G.mode = 'play';
    overlay.classList.add('hidden');
    cueStage();
  }

  function advanceStage() {
    G.runDodged += G.dodged;
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      showPanel('win');
      return;
    }
    G.stage += 1;
    resetRun();
    G.mode = 'play';
    G.lock = 0.42;
    audio.start();
    cueStage();
  }

  function endGame(win, why) {
    if (G.mode !== 'play') return;
    G.why = why || '';
    if (win) {
      const last = G.stage >= STAGES.length - 1;
      G.mode = last ? 'docking' : 'clearing';
      G.dieT = last ? 0.72 : 0.55;
      if (last) {
        toastEl.classList.add('hidden');
        G.toastT = 0;
        audio.win();
      } else {
        toast(STAGES[G.stage].name + ' 靠港');
        audio.gap();
        audio.beep(520, 0.2, 'sine', 0.07, 980);
      }
      emit(32, {
        x: G.exitX,
        y: G.exitY,
        j: 18,
        vx0: -70,
        vx1: 70,
        vy0: -80,
        vy1: 50,
        life: 0.9,
        r0: 1.5,
        r1: 4.2,
        mag: false
      });
    } else {
      G.mode = 'dying';
      G.dieT = 0.62;
      G.flash = 1;
      G.shake = 11;
      toastEl.classList.add('hidden');
      G.toastT = 0;
      audio.lose();
      emit(26, {
        x: G.player.x,
        y: G.player.y,
        j: 8,
        vx0: -90,
        vx1: 90,
        vy0: -70,
        vy1: 80,
        life: 0.7,
        r0: 1.4,
        r1: 4,
        mag: true
      });
      bubble(G.player.x, G.player.y, 10);
    }
    audio.stopDrone();
  }

  function fireBeacon(b) {
    rings.push({
      x: b.x,
      y: b.y,
      r: 14,
      speed: b.speed,
      thick: b.thick,
      rMax: b.rMax,
      safe: b.safe,
      gap: b.gap,
      scored: false
    });
    audio.ping();
    emit(8, {
      x: b.x,
      y: b.y,
      j: 4,
      vx0: -30,
      vx1: 30,
      vy0: -30,
      vy1: 30,
      life: 0.35,
      r0: 1,
      r1: 2.4,
      mag: true
    });
  }

  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return clamp(((e.clientY - rect.top) / rect.height) * WORLD_H, 0, WORLD_H);
  }

  function envAt(x) {
    const e = envelope(x);
    return { lo: e.top + PLAYER_R + 2, hi: e.bot - PLAYER_R - 2 };
  }

  function updateDemo(dt) {
    G.clock += dt;
    G.player.x = 150;
    G.player.y = 178 + Math.sin(G.clock * 0.9) * 22;
    G.player.target = G.player.y;
    G.prop += dt * 10;
    if (rings.length === 0 || rings[rings.length - 1].r > 160) {
      rings.push({
        x: 310,
        y: 180,
        r: 16,
        speed: 70,
        thick: 14,
        rMax: 280,
        safe: 118,
        gap: 48,
        scored: true
      });
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r += r.speed * dt;
      if (r.r > r.rMax) rings.splice(i, 1);
    }
    camX = G.player.x - (W * 0.38) / scale;
    updateFx(dt);
  }

  function updatePlay(dt) {
    const p = G.player;
    const playing = G.mode === 'play';
    const env = envAt(p.x);

    if (playing && G.lock <= 0) {
      if (pointer.down) p.target = pointer.y;
      else {
        if (keys.up) p.target -= SPEED_Y * dt;
        if (keys.down) p.target += SPEED_Y * dt;
      }
      p.target = clamp(p.target, env.lo, env.hi);
      const prevY = p.y;
      const seek = (p.target - p.y) * Math.min(1, dt * 13);
      const cap = SPEED_Y * dt;
      p.y += clamp(seek, -cap, cap);
      p.y = clamp(p.y, env.lo, env.hi);
      G.vy = (p.y - prevY) / dt;
      if (Math.abs(G.vy) > 40 && Math.random() < dt * 9) bubble(p.x - 8, p.y, 1);

      let spd = G.speed;
      if (p.x > G.exitX - 240) spd *= mix(1, 0.42, clamp((p.x - (G.exitX - 240)) / 240, 0, 1));
      p.x += spd * dt;
      if (p.x > G.exitX) p.x = G.exitX;

      G.o2 -= dt;
      if (G.o2 <= 0) {
        G.o2 = 0;
        endGame(false, 'air');
        return;
      }
      const airLine = Math.max(5, G.o2Max * 0.3);
      if (!G.warned && G.o2 < airLine) {
        G.warned = true;
        o2Wrap.classList.add('warn');
        toast('氧气将尽', true);
      }
      if (G.o2 < airLine && G.t - audio.lastWarn > 1.05) {
        audio.lastWarn = G.t;
        audio.warn();
      }
      if (G.stage === 0 && !G.dockHint && p.x > G.exitX - 300) {
        G.dockHint = true;
        toast('对准青色回收舱');
      }

      const dx = G.exitX - p.x;
      const dy = G.exitY - p.y;
      if (dx * dx + dy * dy < (EXIT_R - 6) * (EXIT_R - 6)) {
        endGame(true, 'dock');
        return;
      }
    } else if (G.mode === 'docking' || G.mode === 'clearing') {
      p.x = lerp(p.x, G.exitX, dt * 4);
      p.y = lerp(p.y, G.exitY, dt * 4);
      G.vy *= 0.9;
    } else if (G.mode === 'dying') {
      p.y += dt * 28;
      G.vy = 28;
    }

    G.prop += dt * (10 + Math.abs(G.vy) * 0.02);

    if (playing) {
      for (let i = 0; i < G.beacons.length; i++) {
        const b = G.beacons[i];
        if (!b.live) continue;
        if (p.x > b.x + 36) {
          b.live = false;
          b.charging = 0;
          continue;
        }
        if (!b.armed && p.x > b.x - b.trig) {
          b.armed = true;
          b.cd = 0.02;
        }
        if (!b.armed) continue;
        if (b.charging > 0) {
          b.charging -= dt;
          if (b.charging <= 0) {
            b.charging = 0;
            fireBeacon(b);
            b.spent = true;
            b.cd = 99;
            if (!G.taught) {
              G.taught = true;
              toast('缺口在发亮的深度');
            }
          }
        } else if (!b.spent) {
          b.cd -= dt;
          if (b.cd <= 0) {
            b.charging = b.charge;
            audio.charge();
          }
        }
      }
    }

    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r += r.speed * dt;
      if (r.r > r.rMax) {
        rings.splice(i, 1);
        continue;
      }
      if (!playing) continue;
      const ddx = p.x - r.x;
      const ddy = p.y - r.y;
      const dist = hypot(ddx, ddy);
      const band = r.thick * 0.5 + PLAYER_R;
      const onRing = Math.abs(dist - r.r) < band;
      const inGap = Math.abs(p.y - r.safe) < r.gap + 5;
      const inFront = p.x < r.x + 28;
      if (onRing && inFront && inGap && !r.scored) {
        r.scored = true;
        G.dodged += 1;
        G.near += 1;
        G.cyanFlash = 0.28;
        audio.gap();
        emit(10, {
          x: p.x + 10,
          y: p.y,
          j: 6,
          vx0: 20,
          vx1: 80,
          vy0: -40,
          vy1: 40,
          life: 0.4,
          r0: 1,
          r1: 2.6,
          mag: false
        });
      }
      if (onRing && inFront && !inGap) {
        endGame(false, 'ping');
        return;
      }
      if (!r.scored && dist < r.r - band && inFront) {
        r.scored = true;
        G.dodged += 1;
      }
    }

    camX = p.x - (W * 0.3) / scale;
    const minCam = -40;
    const maxCam = G.worldLen - W / scale + 80;
    camX = clamp(camX, minCam, Math.max(minCam, maxCam));
    updateFx(dt);
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.cyanFlash > 0) G.cyanFlash = Math.max(0, G.cyanFlash - dt * 3.2);
    if (G.lock > 0) G.lock -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 18 * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    if (Math.random() < dt * 2.4) {
      bubble(camX + rand(20, W / scale + 40), rand(50, WORLD_H - 40), 1);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const q = bubbles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.life <= 0 || q.y < 8) bubbles.splice(i, 1);
    }
  }

  function syncHud() {
    const pct = clamp(G.mode === 'title' ? 1 : G.o2 / G.o2Max, 0, 1);
    o2Fill.style.transform = 'scaleX(' + pct + ')';
    o2Num.textContent = String(Math.ceil(pct * 100));
    const d = Math.max(0, (G.exitX - G.player.x) | 0);
    const st = STAGES[G.stage];
    stageLabel.textContent = G.mode === 'title'
      ? '航道 —'
      : (G.stage + 1) + '/' + STAGES.length + ' ' + st.name;
    distLabel.textContent = G.mode === 'title' ? '距舱 —' : '距舱 ' + d;
  }

  function strokeGappedRing(cx, cy, r, safeY, gapH, width) {
    if (r < 2) return;
    ctx.lineWidth = width;
    const n = Math.max(40, Math.min(96, (r * 0.55) | 0));
    let pen = false;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const gap = Math.abs(y - safeY) < gapH;
      if (gap) {
        if (pen) {
          ctx.stroke();
          ctx.beginPath();
          pen = false;
        }
        continue;
      }
      if (!pen) {
        ctx.moveTo(sx(x), sy(y));
        pen = true;
      } else ctx.lineTo(sx(x), sy(y));
    }
    ctx.lineWidth = width;
    if (pen) ctx.stroke();
  }

  function drawWater() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0c1b38');
    g.addColorStop(0.38, '#081024');
    g.addColorStop(0.72, '#050614');
    g.addColorStop(1, '#03010c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const px = ((G.clock * (12 + i * 5) + i * 140) % (W + 260)) - 80;
      const gw = ctx.createLinearGradient(px, 0, px + 70, H * 0.72);
      gw.addColorStop(0, 'rgba(0, 240, 255, 0.045)');
      gw.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = gw;
      ctx.beginPath();
      ctx.moveTo(px - 18, 0);
      ctx.lineTo(px + 36, 0);
      ctx.lineTo(px + 86, H * 0.7);
      ctx.lineTo(px + 10, H * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.4 + m.p) * 10);
      const y = sy(m.y);
      if (x < -8 || x > W + 8) continue;
      ctx.fillStyle = 'rgba(180, 230, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawTerrain() {
    const x0 = camX - 40;
    const x1 = camX + W / scale + 40;
    const step = 22;
    const top = [];
    const bot = [];
    for (let x = x0; x <= x1 + step; x += step) {
      const e = envelope(x);
      const jag = Math.sin(x * 0.21) * 7 + Math.sin(x * 0.53 + 2) * 4 + Math.sin(x * 1.17) * 2.2;
      top.push({ x: x, y: e.top + jag * 0.35 });
      bot.push({ x: x, y: e.bot - jag * 0.25 });
    }

    ctx.beginPath();
    ctx.moveTo(sx(top[0].x), 0);
    for (let i = 0; i < top.length; i++) ctx.lineTo(sx(top[i].x), sy(top[i].y));
    ctx.lineTo(sx(top[top.length - 1].x), 0);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, 0, 0, H * 0.35);
    tg.addColorStop(0, '#14081c');
    tg.addColorStop(1, '#2a1230');
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < top.length; i++) {
      const p = top[i];
      if (i === 0) ctx.moveTo(sx(p.x), sy(p.y));
      else ctx.lineTo(sx(p.x), sy(p.y));
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx(bot[0].x), H);
    for (let i = 0; i < bot.length; i++) ctx.lineTo(sx(bot[i].x), sy(bot[i].y));
    ctx.lineTo(sx(bot[bot.length - 1].x), H);
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, H * 0.65, 0, H);
    bg.addColorStop(0, '#1a0c28');
    bg.addColorStop(1, '#0a0612');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < bot.length; i++) {
      const p = bot[i];
      if (i === 0) ctx.moveTo(sx(p.x), sy(p.y));
      else ctx.lineTo(sx(p.x), sy(p.y));
    }
    ctx.stroke();
  }

  function drawHatch() {
    const x = sx(G.exitX);
    const y = sy(G.exitY);
    const r = EXIT_R * scale;
    const pulse = 0.55 + Math.sin(G.clock * 3.2) * 0.2;
    const rad = ctx.createRadialGradient(x, y, 4, x, y, r * 1.8);
    rad.addColorStop(0, 'rgba(0, 240, 255,' + (0.22 * pulse) + ')');
    rad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.28, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(232, 250, 255, 0.7)';
    ctx.font = '600 11px Segoe UI, PingFang SC, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('回收舱', x, y - r - 8);
  }

  function drawLane(b, alpha) {
    const y = sy(b.safe);
    const x0 = Math.max(-30, sx(Math.max(camX, b.x - b.rMax * 0.92)));
    const x1 = sx(b.x);
    if (x1 < -10 || x0 > W) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.lineWidth = 1.35;
    ctx.setLineDash([8, 7]);
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawBeacons() {
    const list = G.mode === 'title'
      ? [{ x: 310, y: 180, safe: 118, gap: 48, charging: 0.4, rMax: 280, live: true }]
      : G.beacons;
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const x = sx(b.x);
      const y = sy(b.y);
      if (x < -80 || x > W + 80) continue;
      if (b.charging > 0) {
        const k = 1 - b.charging / Math.max(0.01, b.charge || 0.5);
        drawLane(b, 0.35 + k * 0.65);
      } else if (b.live && b.armed) {
        let hasRing = false;
        for (let ri = 0; ri < rings.length; ri++) {
          if (Math.abs(rings[ri].x - b.x) < 1 && Math.abs(rings[ri].y - b.y) < 1) {
            hasRing = true;
            break;
          }
        }
        if (hasRing) drawLane(b, 0.22);
      }
      const glow = b.charging > 0 ? 0.45 + Math.sin(G.clock * 14) * 0.2 : 0.22;
      const rg = ctx.createRadialGradient(x, y, 2, x, y, 26 * scale);
      rg.addColorStop(0, 'rgba(255, 61, 184,' + glow + ')');
      rg.addColorStop(1, 'rgba(255, 61, 184, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, 26 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ff3db8';
      ctx.beginPath();
      ctx.arc(x, y, 5.5 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 154, 212, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 9 * scale, 0, TAU);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(G.clock * 1.6 + i);
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, 13 * scale, -0.4, 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 13 * scale, Math.PI - 0.4, Math.PI + 0.4);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawRings() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const fade = clamp(1 - (r.r / r.rMax) * (r.r / r.rMax), 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.35 + fade * 0.65;
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.18)';
      ctx.lineCap = 'round';
      strokeGappedRing(r.x, r.y, r.r, r.safe, r.gap, r.thick * scale * 1.8);
      ctx.strokeStyle = '#ff3db8';
      strokeGappedRing(r.x, r.y, r.r, r.safe, r.gap, Math.max(2, r.thick * scale * 0.42));
      ctx.strokeStyle = 'rgba(255, 180, 230, 0.7)';
      strokeGappedRing(r.x, r.y, r.r, r.safe, r.gap, 1.2);
      ctx.globalAlpha = fade * 0.7;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
      ctx.setLineDash([5, 6]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const y = sy(r.safe);
      ctx.moveTo(sx(r.x - r.r), y);
      ctx.lineTo(sx(r.x), y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (r.r * r.r > (r.safe - r.y) * (r.safe - r.y)) {
        const dx = Math.sqrt(Math.max(0, r.r * r.r - (r.safe - r.y) * (r.safe - r.y)));
        ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(sx(r.x - dx), sy(r.safe), 3.2, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx(r.x + dx), sy(r.safe), 2.2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawSub() {
    const p = G.player;
    const x = sx(p.x);
    const y = sy(p.y);
    const pitch = clamp(G.vy * 0.0016, -0.38, 0.38);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(pitch);

    ctx.globalCompositeOperation = 'lighter';
    const cone = ctx.createRadialGradient(12 * s, 0, 1 * s, 48 * s, 0, 58 * s);
    cone.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    cone.addColorStop(0.4, 'rgba(0, 240, 255, 0.06)');
    cone.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.ellipse(40 * s, 0, 42 * s, 13 * s, 0, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 17 * s, 8.5 * s, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(-16.2 * s, 0);
    ctx.rotate(G.prop);
    ctx.strokeStyle = 'rgba(200, 245, 255, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -5.5 * s);
    ctx.lineTo(0, 5.5 * s);
    ctx.moveTo(-4.5 * s, -3.2 * s);
    ctx.lineTo(4.5 * s, 3.2 * s);
    ctx.stroke();
    ctx.restore();

    const hull = ctx.createLinearGradient(0, -9 * s, 0, 9 * s);
    hull.addColorStop(0, '#b8fbff');
    hull.addColorStop(0.42, '#1ad0e0');
    hull.addColorStop(1, '#0a5e7a');
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.ellipse(1 * s, 0, 15.5 * s, 7.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ff3db8';
    ctx.fillRect(-5 * s, -8.4 * s, 11 * s, 2.3 * s);
    ctx.beginPath();
    ctx.moveTo(-1 * s, -8 * s);
    ctx.lineTo(4 * s, -13.5 * s);
    ctx.lineTo(7 * s, -8 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(236, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.ellipse(6.5 * s, -1.1 * s, 3.6 * s, 2.7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.75)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    if (G.mode === 'dying') {
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.9)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-5 * s, -4 * s);
      ctx.lineTo(9 * s, 3 * s);
      ctx.moveTo(2 * s, -7 * s);
      ctx.lineTo(-3 * s, 6 * s);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.mag
        ? 'rgba(255, 61, 184,' + a + ')'
        : 'rgba(0, 240, 255,' + a + ')';
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < bubbles.length; i++) {
      const q = bubbles[i];
      ctx.strokeStyle = 'rgba(180, 240, 255,' + clamp(q.life, 0, 0.7) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r, 0, TAU);
      ctx.stroke();
    }
  }

  function drawVignette() {
    const vg = ctx.createRadialGradient(W * 0.45, H * 0.5, H * 0.2, W * 0.45, H * 0.5, H * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(3,1,10,0.46)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.flash * 0.32) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.cyanFlash > 0) {
      ctx.fillStyle = 'rgba(0, 240, 255,' + (G.cyanFlash * 0.16) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.mode === 'play' && G.o2 < Math.max(5, G.o2Max * 0.3)) {
      const a = 0.08 + Math.sin(G.t * 8) * 0.05;
      ctx.fillStyle = 'rgba(255, 61, 184,' + a + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawWater();
    drawTerrain();
    drawHatch();
    drawBeacons();
    drawRings();
    drawFx();
    drawSub();
    drawVignette();
  }

  let last = 0;
  function frame(now) {
    const t = now * 0.001;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    G.clock += dt;
    if (G.mode === 'play') G.t += dt;

    if (G.mode === 'title') updateDemo(dt);
    else updatePlay(dt);

    if (G.mode === 'play') audio.tickDrone(G.o2);

    if (G.mode === 'dying' || G.mode === 'docking' || G.mode === 'clearing') {
      G.dieT -= dt;
      if (G.dieT <= 0) {
        if (G.mode === 'clearing') {
          advanceStage();
        } else if (G.mode === 'docking') {
          G.runDodged += G.dodged;
          G.mode = 'win';
          showPanel('win');
        } else {
          G.mode = 'lose';
          showPanel('lose');
        }
      }
    }

    draw();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      keys.up = down;
      e.preventDefault();
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      keys.down = down;
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startPlay(G.mode === 'title' || G.mode === 'win');
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        startPlay(G.mode === 'title' || G.mode === 'win');
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.y = pointerWorldY(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) return;
    pointer.y = pointerWorldY(e);
    e.preventDefault();
  });
  function pointerUp(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    startPlay(G.mode === 'title' || G.mode === 'win');
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startPlay(G.mode === 'title' || G.mode === 'win');
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.up = false;
    keys.down = false;
    pointer.down = false;
  });
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }

  resetRun();
  G.mode = 'title';
  showPanel('title');
  resize();
  syncHud();
  requestAnimationFrame(function (t) {
    last = t * 0.001;
    requestAnimationFrame(frame);
  });
})();
