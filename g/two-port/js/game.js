'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const TAU = Math.PI * 2;
  const SHOT_SPEED = 268;
  const SHOT_R = 6.4;
  const CORE_R = 23;
  const PORT_GAP = 22;
  const ROT = 2.85;
  const VOLLEYS = 3;
  const TAP_MS = 240;
  const TAP_PX = 16;
  const MUTE_KEY = 'two-port-mute';

  const BORDER = [
    { x: 0, y: 0, w: 960, h: 22 },
    { x: 0, y: 518, w: 960, h: 22 },
    { x: 0, y: 0, w: 22, h: 540 },
    { x: 938, y: 0, w: 22, h: 540 }
  ];

  const STAGES = [
    {
      name: '直取',
      sub: 'LOCK',
      px: 480,
      py: 452,
      aim: -Math.PI / 2,
      cores: [{ x: 480, y: 128 }],
      walls: [],
      toast: '瞄准金色核心，点按或空格开火',
      hint: '瞄准核心 · 空格 / 点按开火'
    },
    {
      name: '转角',
      sub: 'BEND',
      px: 148,
      py: 428,
      aim: -Math.PI / 2,
      cores: [{ x: 768, y: 112 }],
      walls: [{ x: 292, y: 236, w: 646, h: 76 }],
      toast: '两发都打出。粉弹飞到拐角时瞄准核心，按 Q 粉送',
      hint: 'Q 粉门送青 · E 青门送粉 · 传送后沿当前瞄准飞出'
    },
    {
      name: '窗缝',
      sub: 'SILL',
      px: 458,
      py: 430,
      aim: -Math.PI / 2,
      cores: [{ x: 188, y: 98 }],
      walls: [
        { x: 22, y: 204, w: 388, h: 38 },
        { x: 512, y: 204, w: 426, h: 38 }
      ],
      toast: '从缝里穿到上室，再横向传送',
      hint: '缝是路，门是坐标'
    },
    {
      name: '时门',
      sub: 'CLOCK',
      px: 142,
      py: 430,
      aim: -Math.PI / 2,
      cores: [{ x: 804, y: 108 }],
      walls: [{ x: 300, y: 248, w: 638, h: 70 }],
      gates: [
        { w: 22, h: 150, x0: 508, y0: 22, x1: 508, y1: -124, spd: 0.82, phase: 4.7 }
      ],
      toast: '闸门开合。把弹送到通道，再看准空隙送出',
      hint: '等闸门让路再传送'
    },
    {
      name: '折返',
      sub: 'SWAP',
      px: 128,
      py: 432,
      aim: -Math.PI / 2,
      cores: [{ x: 832, y: 428 }],
      walls: [{ x: 248, y: 176, w: 464, h: 342 }],
      toast: '先送过第一拐，再用另一门把弹送向深处',
      hint: '一门当坐标，另一门接着当坐标'
    },
    {
      name: '心核',
      sub: 'HEART',
      px: 126,
      py: 436,
      aim: -Math.PI / 2,
      cores: [{ x: 480, y: 128 }, { x: 832, y: 428 }],
      walls: [{ x: 252, y: 168, w: 456, h: 350 }],
      gates: [
        { w: 24, h: 88, x0: 390, y0: 24, x1: 640, y1: 24, spd: 1.05, phase: 0.4 }
      ],
      spikes: [
        { x: 758, y: 268, r: 13 },
        { x: 908, y: 332, r: 13 },
        { x: 758, y: 390, r: 12 }
      ],
      toast: '两枚核心。弹可穿透，连续传送',
      hint: '穿透核心 · 连续传送 · 躲开刺与闸'
    },
    {
      name: '回廊',
      sub: 'FOLD',
      px: 120,
      py: 448,
      aim: -Math.PI / 2,
      cores: [{ x: 132, y: 100 }],
      walls: [
        { x: 22, y: 196, w: 700, h: 44 },
        { x: 240, y: 360, w: 698, h: 44 }
      ],
      gates: [
        { w: 130, h: 48, x0: 740, y0: 194, x1: 580, y1: 194, spd: 0.92, phase: 4.2 }
      ],
      toast: '三折。先横送，再等闸折上，再送回来',
      hint: '连续换门三折 · 折上前等闸'
    },
    {
      name: '闸缝',
      sub: 'SLIT',
      px: 455,
      py: 436,
      aim: -Math.PI / 2,
      cores: [{ x: 828, y: 88, r: 20 }],
      walls: [
        { x: 22, y: 248, w: 408, h: 42 },
        { x: 528, y: 248, w: 410, h: 42 },
        { x: 696, y: 22, w: 40, h: 168 }
      ],
      gates: [
        { w: 108, h: 46, x0: 424, y0: 247, x1: 248, y1: 247, spd: 1.5, phase: 4.65 }
      ],
      spikes: [
        { x: 824, y: 158, r: 14 }
      ],
      toast: '等闸穿缝，再把门送进口袋',
      hint: '穿缝 · 送进口袋 · 绕开刺'
    },
    {
      name: '绞门',
      sub: 'VICE',
      px: 124,
      py: 440,
      aim: -Math.PI / 2,
      cores: [
        { x: 468, y: 78, r: 19 },
        { x: 836, y: 436, r: 19 }
      ],
      walls: [
        { x: 250, y: 162, w: 458, h: 356 }
      ],
      gates: [
        { w: 56, h: 22, x0: 268, y0: 112, x1: 630, y1: 112, spd: 1.72, phase: 0.4 },
        { w: 22, h: 64, x0: 786, y0: 176, x1: 786, y1: 390, spd: 1.38, phase: 2.6 }
      ],
      spikes: [
        { x: 738, y: 236, r: 13 },
        { x: 916, y: 292, r: 13 },
        { x: 820, y: 354, r: 14 }
      ],
      toast: '两核。顶廊躲闸，右廊躲刺。别把门停在闸上',
      hint: '顶闸会碾门 · 右刺要绕 · 连续换门'
    },
    {
      name: '终门',
      sub: 'LAST',
      px: 118,
      py: 448,
      aim: -Math.PI / 2,
      cores: [
        { x: 830, y: 304, r: 18 },
        { x: 830, y: 96, r: 18 },
        { x: 128, y: 96, r: 17 }
      ],
      walls: [
        { x: 22, y: 208, w: 708, h: 52 },
        { x: 228, y: 348, w: 710, h: 52 }
      ],
      gates: [
        { w: 140, h: 54, x0: 780, y0: 206, x1: 560, y1: 206, spd: 1.58, phase: 2.05 }
      ],
      spikes: [
        { x: 400, y: 272, r: 13 },
        { x: 580, y: 336, r: 13 },
        { x: 720, y: 272, r: 12 },
        { x: 490, y: 128, r: 12 },
        { x: 320, y: 70, r: 12 }
      ],
      toast: '三核终局。沿回廊穿核，右闸中刺顶刺',
      hint: '三折穿三核 · 中道极窄 · 等闸再折上'
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
  const btnFire = document.getElementById('btn-fire');
  const btnMag = document.getElementById('btn-mag');
  const btnCyn = document.getElementById('btn-cyn');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const livesEl = document.getElementById('lives');
  const pipMag = document.getElementById('pip-mag');
  const pipCyn = document.getElementById('pip-cyn');
  const stageLabel = document.getElementById('stage-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { left: false, right: false };
  const pointer = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    t: 0,
    dragged: false,
    aiming: false
  };

  const particles = [];
  const motes = [];
  const bolts = [];
  const ripples = [];

  const G = {
    mode: 'title',
    stage: 0,
    t: 0,
    clock: 0,
    aim: -Math.PI / 2,
    px: 480,
    py: 452,
    mag: null,
    cyn: null,
    magGone: false,
    cynGone: false,
    walls: [],
    gates: [],
    spikes: [],
    cores: [],
    lives: VOLLEYS,
    lock: 0,
    portCd: 0,
    shake: 0,
    flash: 0,
    flashCol: '#00f0ff',
    muzzle: 0,
    toastT: 0,
    clearT: 0,
    paused: false,
    hits: 0,
    pointerAim: true,
    hud: '',
    taught: false
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
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    whoosh: function () {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const len = 0.18;
      const buf = this.ctx.createBuffer(1, (this.ctx.sampleRate * len) | 0, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(420, t);
      f.frequency.exponentialRampToValueAtTime(1800, t + len);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    fire: function (mag) {
      this.ensure();
      if (mag) {
        this.beep(420, 0.09, 'square', 0.05, 180);
        this.beep(880, 0.12, 'sine', 0.06, 420);
      } else {
        this.beep(560, 0.09, 'square', 0.05, 240);
        this.beep(1180, 0.12, 'sine', 0.06, 520);
      }
    },
    port: function () {
      this.ensure();
      this.whoosh();
      this.beep(180, 0.22, 'sine', 0.07, 920);
      this.beep(640, 0.16, 'triangle', 0.05, 1400);
    },
    core: function () {
      this.ensure();
      this.beep(520, 0.16, 'triangle', 0.09, 1040);
      this.beep(780, 0.28, 'sine', 0.06, 1560);
    },
    die: function () {
      this.ensure();
      this.beep(160, 0.16, 'sawtooth', 0.05, 70);
    },
    deny: function () {
      this.ensure();
      this.beep(140, 0.1, 'square', 0.04, 90);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.18, 'triangle', 0.1, 880);
      this.beep(660, 0.28, 'sine', 0.08, 1320);
      this.beep(880, 0.4, 'sine', 0.05, 1760);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.45, 'sawtooth', 0.09, 60);
      this.beep(90, 0.7, 'square', 0.05, 40);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.16, 'sine', 0.07, 520);
      this.beep(330, 0.2, 'triangle', 0.05, 880);
    },
    tickDrone: function (play) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 52;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const live = (G.mag ? 1 : 0) + (G.cyn ? 1 : 0);
      this.drone.frequency.setTargetAtTime(48 + live * 10, t, 0.12);
      this.droneGain.gain.setTargetAtTime(play ? 0.018 + live * 0.006 : 0.0001, t, 0.18);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 96) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold
      });
    }
  }

  function ripple(x, y, mag, gold) {
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: gold ? 70 : 46, t: 1, mag: mag, gold: gold });
  }

  function bolt(x0, y0, x1, y1, mag) {
    bolts.push({ x0: x0, y0: y0, x1: x1, y1: y1, t: 1, mag: mag });
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.remove('hidden');
    G.toastT = 2.6;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 58; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.22 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.7 + 0.15
      });
    }
  }

  function circleRect(x, y, r, rec) {
    const nx = clamp(x, rec.x, rec.x + rec.w);
    const ny = clamp(y, rec.y, rec.y + rec.h);
    const dx = x - nx;
    const dy = y - ny;
    return dx * dx + dy * dy < r * r;
  }

  function inSolid(x, y, r) {
    const walls = G.walls;
    for (let i = 0; i < walls.length; i++) {
      if (circleRect(x, y, r, walls[i])) return true;
    }
    const gates = G.gates;
    for (let i = 0; i < gates.length; i++) {
      if (circleRect(x, y, r, gates[i])) return true;
    }
    return false;
  }

  function spikeHit(x, y, r) {
    const sp = G.spikes;
    for (let i = 0; i < sp.length; i++) {
      const s = sp[i];
      const dx = x - s.x;
      const dy = y - s.y;
      const rr = r + s.r;
      if (dx * dx + dy * dy < rr * rr) return true;
    }
    return false;
  }

  function outOfWorld(x, y) {
    return x < 8 || y < 8 || x > WORLD_W - 8 || y > WORLD_H - 8;
  }

  function coresLeft() {
    let n = 0;
    for (let i = 0; i < G.cores.length; i++) if (G.cores[i].alive) n++;
    return n;
  }

  function canFire() {
    return (!G.mag && !G.magGone) || (!G.cyn && !G.cynGone);
  }

  function canPort() {
    return !!(G.mag && G.cyn) && G.portCd <= 0 && G.mode === 'play' && G.lock <= 0;
  }

  function raycast(x, y, dx, dy, maxDist) {
    const step = 7;
    let d = 18;
    while (d < maxDist) {
      const px = x + dx * d;
      const py = y + dy * d;
      if (inSolid(px, py, 2)) return { x: px, y: py, d: d };
      d += step;
    }
    return { x: x + dx * maxDist, y: y + dy * maxDist, d: maxDist };
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

  function aimAt(x, y) {
    G.aim = Math.atan2(y - G.py, x - G.px);
    G.pointerAim = true;
  }

  function shotNear(x, y) {
    const hitR = 32;
    let best = null;
    let bestD = hitR;
    const pair = [G.mag, G.cyn];
    for (let i = 0; i < 2; i++) {
      const s = pair[i];
      if (!s) continue;
      const d = hypot(s.x - x, s.y - y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  function loadStage(index) {
    const s = STAGES[index];
    G.stage = index;
    G.px = s.px;
    G.py = s.py;
    G.aim = s.aim;
    G.lives = VOLLEYS;
    G.lock = 0.38;
    G.portCd = 0;
    G.taught = false;
    G.walls = BORDER.concat(s.walls.map(function (w) {
      return { x: w.x, y: w.y, w: w.w, h: w.h };
    }));
    G.gates = (s.gates || []).map(function (g) {
      return {
        w: g.w,
        h: g.h,
        x0: g.x0,
        y0: g.y0,
        x1: g.x1,
        y1: g.y1,
        spd: g.spd,
        phase: g.phase || 0,
        x: g.x0,
        y: g.y0
      };
    });
    G.spikes = (s.spikes || []).map(function (sp) {
      return { x: sp.x, y: sp.y, r: sp.r };
    });
    G.cores = s.cores.map(function (c) {
      return { x: c.x, y: c.y, r: c.r || CORE_R, alive: true, pulse: Math.random() * TAU };
    });
    resetShots();
    particles.length = 0;
    bolts.length = 0;
    ripples.length = 0;
    hintEl.textContent = s.hint;
    stageLabel.textContent = (index + 1) + ' / ' + STAGES.length + '  ' + s.name;
    if (s.toast) toast(s.toast);
    syncHud(true);
  }

  function resetShots() {
    G.mag = null;
    G.cyn = null;
    G.magGone = false;
    G.cynGone = false;
    G.muzzle = 0;
  }

  function spawnShot(mag) {
    const ang = G.aim;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const shot = {
      mag: mag,
      x: G.px + c * 22,
      y: G.py + s * 22,
      vx: c * SHOT_SPEED,
      vy: s * SHOT_SPEED,
      r: SHOT_R,
      life: 11,
      frozen: false,
      dead: false,
      trail: []
    };
    if (inSolid(shot.x, shot.y, shot.r)) {
      shot.x = G.px + c * 10;
      shot.y = G.py + s * 10;
    }
    return shot;
  }

  function fire() {
    if (G.mode !== 'play' || G.lock > 0) return;
    audio.ensure();
    if (!canFire()) {
      audio.deny();
      toast('两发已出 · 用一门送另一门', true);
      return;
    }
    const mag = !G.mag && !G.magGone;
    const shot = spawnShot(mag);
    if (mag) G.mag = shot;
    else G.cyn = shot;
    G.muzzle = 0.12;
    G.shake = Math.max(G.shake, 2.2);
    audio.fire(mag);
    emit(10, {
      x: shot.x,
      y: shot.y,
      j: 3,
      vx0: shot.vx * 0.05 - 40,
      vx1: shot.vx * 0.05 + 40,
      vy0: shot.vy * 0.05 - 40,
      vy1: shot.vy * 0.05 + 40,
      life: 0.32,
      r0: 1,
      r1: 2.4,
      mag: mag
    });
    if (G.mag && G.cyn && G.stage === 1 && !G.taught) {
      G.taught = true;
      toast('瞄准核心，按 Q 用粉门送青弹');
    }
    syncHud(true);
  }

  function findClear(x, y, dx, dy) {
    const tries = [
      [dx, dy, PORT_GAP],
      [dx, dy, 30],
      [dx, dy, 14],
      [-dx, -dy, 18],
      [-dy, dx, 18],
      [dy, -dx, 18]
    ];
    for (let i = 0; i < tries.length; i++) {
      const px = x + tries[i][0] * tries[i][2];
      const py = y + tries[i][1] * tries[i][2];
      if (!inSolid(px, py, SHOT_R + 1) && !spikeHit(px, py, SHOT_R)) {
        return { x: px, y: py };
      }
    }
    return { x: x + dx * PORT_GAP, y: y + dy * PORT_GAP };
  }

  function port(useMag) {
    if (G.mode !== 'play' || G.lock > 0) return;
    audio.ensure();
    if (G.portCd > 0) return;
    const door = useMag ? G.mag : G.cyn;
    const payload = useMag ? G.cyn : G.mag;
    if (!door || !payload) {
      audio.deny();
      if (!G.mag && !G.cyn) toast('先把两发都打出去', true);
      else toast('两发都在，才能传送', true);
      return;
    }
    const ang = G.aim;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const dest = findClear(door.x, door.y, c, s);
    bolt(payload.x, payload.y, dest.x, dest.y, useMag);
    door.frozen = true;
    door.vx = 0;
    door.vy = 0;
    door.trail = [];
    payload.frozen = false;
    payload.x = dest.x;
    payload.y = dest.y;
    payload.vx = c * SHOT_SPEED;
    payload.vy = s * SHOT_SPEED;
    payload.life = Math.max(payload.life, 6);
    payload.trail = [];
    G.portCd = 0.2;
    G.shake = Math.max(G.shake, 5.5);
    G.flash = 0.42;
    G.flashCol = useMag ? '#ff3db8' : '#00f0ff';
    audio.port();
    ripple(door.x, door.y, useMag, false);
    emit(18, {
      x: dest.x,
      y: dest.y,
      j: 8,
      vx0: c * 40 - 90,
      vx1: c * 40 + 90,
      vy0: s * 40 - 90,
      vy1: s * 40 + 90,
      life: 0.45,
      r0: 1.2,
      r1: 3.2,
      mag: !useMag
    });
    syncHud(true);
  }

  function killShot(shot) {
    if (!shot || shot.dead) return;
    shot.dead = true;
    emit(12, {
      x: shot.x,
      y: shot.y,
      j: 5,
      vx0: -80,
      vx1: 80,
      vy0: -80,
      vy1: 80,
      life: 0.35,
      r0: 1,
      r1: 2.8,
      mag: shot.mag
    });
    audio.die();
    if (shot.mag) {
      G.mag = null;
      G.magGone = true;
    } else {
      G.cyn = null;
      G.cynGone = true;
    }
    syncHud(true);
  }

  function hitCores(shot) {
    for (let i = 0; i < G.cores.length; i++) {
      const c = G.cores[i];
      if (!c.alive) continue;
      const dx = shot.x - c.x;
      const dy = shot.y - c.y;
      const rr = shot.r + c.r;
      if (dx * dx + dy * dy < rr * rr) {
        c.alive = false;
        G.hits += 1;
        G.flash = 0.5;
        G.flashCol = '#ffe36b';
        G.shake = Math.max(G.shake, 7);
        audio.core();
        ripple(c.x, c.y, false, true);
        emit(22, {
          x: c.x,
          y: c.y,
          j: 10,
          vx0: -120,
          vx1: 120,
          vy0: -120,
          vy1: 120,
          life: 0.7,
          r0: 1.4,
          r1: 4,
          gold: true
        });
        if (coresLeft() <= 0) stageClear();
      }
    }
  }

  function stageClear() {
    if (G.mode !== 'play') return;
    G.mode = 'clear';
    G.clearT = 1.05;
    hideToast();
    toast('门开 · ' + STAGES[G.stage].name);
    audio.beep(520, 0.14, 'sine', 0.07, 880);
  }

  function nextStage() {
    if (G.stage + 1 >= STAGES.length) {
      winGame();
      return;
    }
    G.mode = 'play';
    loadStage(G.stage + 1);
  }

  function missVolley() {
    G.lives -= 1;
    G.shake = Math.max(G.shake, 6);
    G.flash = 0.28;
    G.flashCol = '#ff3db8';
    if (G.lives <= 0) {
      loseGame();
      return;
    }
    resetShots();
    toast('齐射落空 · 还剩 ' + G.lives + ' 次', true);
    audio.deny();
    syncHud(true);
  }

  function winGame() {
    G.mode = 'win';
    audio.win();
    audio.tickDrone(false);
    showOverlay('win');
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    audio.tickDrone(false);
    showOverlay('lose');
  }

  function showOverlay(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'PORTS';
      ovTitle.textContent = '双门';
      ovLead.innerHTML = '两发子弹共享传送。<br />用一发冻成门，把另一发送过去，朝你此刻瞄准的方向飞出。';
      ovOps.textContent = '指向或 A/D 瞄准 · 空格 / 点按开火 · Q 粉门送青 · E 青门送粉 · M 静音';
      ovBtn.textContent = '开启双门';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'CLEAR';
      ovTitle.textContent = '门开了';
      ovLead.textContent = STAGES.length + ' 关核心全部击穿。两发子弹，一门送另一门。';
      ovOps.textContent = '击穿 ' + G.hits + ' 枚核心';
      ovBtn.textContent = '再来一局';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'CLOSED';
      ovTitle.textContent = '门闭';
      ovLead.textContent = '三次齐射都尽了。核心还在墙的另一侧。';
      ovOps.textContent = STAGES[G.stage].name + ' · 点按重试本关';
      ovBtn.textContent = '重试本关';
    }
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function startRun() {
    G.hits = 0;
    G.mode = 'play';
    hideOverlay();
    loadStage(0);
    audio.start();
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') {
      startRun();
      return;
    }
    if (G.mode === 'win') {
      startRun();
      return;
    }
    G.mode = 'play';
    hideOverlay();
    loadStage(G.stage);
    audio.start();
  }

  function onMain() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') startRun();
    else if (G.mode === 'lose') retry();
  }

  function syncHud(force) {
    const magState = G.mag ? (G.mag.frozen ? 'd' : 'l') : (G.magGone ? 'x' : 'r');
    const cynState = G.cyn ? (G.cyn.frozen ? 'd' : 'l') : (G.cynGone ? 'x' : 'r');
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + magState + ':' + cynState + ':' + canPort();
    if (!force && key === G.hud) return;
    G.hud = key;

    let html = '';
    for (let i = 0; i < VOLLEYS; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? ' on warn' : ' on') : '') + '"></i>';
    }
    livesEl.innerHTML = html;

    pipMag.className = 'shot mag' + (G.mag ? (G.mag.frozen ? ' live door' : ' live') : G.magGone ? '' : ' ready');
    pipCyn.className = 'shot cyn' + (G.cyn ? (G.cyn.frozen ? ' live door' : ' live') : G.cynGone ? '' : ' ready');

    const portOk = canPort();
    btnMag.disabled = G.mode !== 'play' || !portOk;
    btnCyn.disabled = G.mode !== 'play' || !portOk;
    btnMag.classList.toggle('ready', portOk);
    btnCyn.classList.toggle('ready', portOk);
    btnFire.disabled = G.mode !== 'play' || !canFire();
  }

  function updateGates(dt) {
    for (let i = 0; i < G.gates.length; i++) {
      const g = G.gates[i];
      g.phase += g.spd * dt;
      const u = 0.5 + 0.5 * Math.sin(g.phase);
      g.x = g.x0 + (g.x1 - g.x0) * u;
      g.y = g.y0 + (g.y1 - g.y0) * u;
    }
  }

  function advanceShot(shot, dt) {
    if (shot.frozen) {
      if (inSolid(shot.x, shot.y, shot.r - 1) || spikeHit(shot.x, shot.y, shot.r) || outOfWorld(shot.x, shot.y)) {
        killShot(shot);
      }
      return;
    }
    shot.life -= dt;
    if (shot.life <= 0) {
      killShot(shot);
      return;
    }
    const spd = hypot(shot.vx, shot.vy);
    const n = Math.max(1, Math.ceil((spd * dt) / 3.4));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      shot.x += shot.vx * h;
      shot.y += shot.vy * h;
      hitCores(shot);
      if (G.mode !== 'play' && G.mode !== 'clear') return;
      if (inSolid(shot.x, shot.y, shot.r) || spikeHit(shot.x, shot.y, shot.r) || outOfWorld(shot.x, shot.y)) {
        killShot(shot);
        return;
      }
    }
    shot.trail.push({ x: shot.x, y: shot.y });
    if (shot.trail.length > 16) shot.trail.shift();
  }

  function updateFx(dt) {
    G.shake *= Math.pow(0.04, dt);
    if (G.shake < 0.15) G.shake = 0;
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t -= dt * 2.8;
      if (bolts[i].t <= 0) bolts.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.35;
      r.r = lerp(6, r.max, 1 - r.t);
      if (r.t <= 0) ripples.splice(i, 1);
    }
  }

  function updatePlay(dt) {
    if (G.lock > 0) G.lock -= dt;
    if (G.portCd > 0) G.portCd -= dt;

    if (G.mode === 'play' && G.lock <= 0) {
      if (!G.pointerAim || keys.left || keys.right) {
        if (keys.left) {
          G.aim -= ROT * dt;
          G.pointerAim = false;
        }
        if (keys.right) {
          G.aim += ROT * dt;
          G.pointerAim = false;
        }
      }
      if (pointer.down && pointer.aiming) {
        aimAt(pointer.x, pointer.y);
      }
    }

    updateGates(dt);

    if (G.mag) advanceShot(G.mag, dt);
    if (G.cyn) advanceShot(G.cyn, dt);

    if (G.mode === 'play' && coresLeft() > 0) {
      const stranded = (G.mag && G.mag.frozen && !G.cyn && G.cynGone) ||
        (G.cyn && G.cyn.frozen && !G.mag && G.magGone);
      if (stranded) {
        if (G.mag) killShot(G.mag);
        if (G.cyn) killShot(G.cyn);
      }
      if (!G.mag && !G.cyn && G.magGone && G.cynGone) missVolley();
    }
  }

  const demo = {
    mag: { x: 150, y: 400, trail: [], mag: true, frozen: false, vx: 0, vy: -250 },
    cyn: { x: 168, y: 410, trail: [], mag: false, frozen: false, vx: 0, vy: -210 },
    t: 0,
    walls: BORDER.concat([{ x: 292, y: 236, w: 646, h: 76 }]),
    core: { x: 760, y: 118 }
  };

  function updateDemo(dt) {
    demo.t += dt;
    const cyc = demo.t % 3.6;
    const mag = demo.mag;
    const cyn = demo.cyn;
    if (cyc < 0.05) {
      mag.x = 150;
      mag.y = 420;
      mag.trail = [];
      mag.frozen = false;
      mag.vx = 0;
      mag.vy = -250;
      cyn.x = 168;
      cyn.y = 428;
      cyn.trail = [];
      cyn.frozen = false;
      cyn.vx = 0;
      cyn.vy = -210;
    }
    if (cyc < 1.05) {
      mag.y += mag.vy * dt;
      cyn.y += cyn.vy * dt;
    } else if (cyc < 1.18) {
      if (!mag.frozen) {
        mag.frozen = true;
        mag.vx = 0;
        mag.vy = 0;
        bolt(cyn.x, cyn.y, mag.x + 20, mag.y, true);
        cyn.x = mag.x + 20;
        cyn.y = mag.y;
        cyn.vx = 340;
        cyn.vy = 0;
        cyn.trail = [];
        ripple(mag.x, mag.y, true, false);
      }
      cyn.x += cyn.vx * dt;
    } else {
      cyn.x += 340 * dt;
    }
    if (!mag.frozen) mag.trail.push({ x: mag.x, y: mag.y });
    cyn.trail.push({ x: cyn.x, y: cyn.y });
    if (mag.trail.length > 14) mag.trail.shift();
    if (cyn.trail.length > 14) cyn.trail.shift();
    if (Math.random() < dt * 8) {
      emit(1, {
        x: mag.x,
        y: mag.y,
        j: 2,
        vx0: -10,
        vx1: 10,
        vy0: -10,
        vy1: 10,
        life: 0.4,
        r0: 1,
        r1: 2,
        mag: true
      });
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

  function glowDot(x, y, r, col, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = col;
    if (r >= 2.3) {
      ctx.shadowColor = col;
      ctx.shadowBlur = r * 3.2;
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawTrail(shot, col) {
    const tr = shot.trail;
    if (!tr.length) return;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < tr.length; i++) {
      const a = i / tr.length;
      ctx.globalAlpha = a * 0.7;
      ctx.lineWidth = 1 + a * 4.2;
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
      ctx.lineTo(tr[i].x, tr[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShot(shot) {
    const col = shot.mag ? '#ff3db8' : '#00f0ff';
    drawTrail(shot, col);
    if (shot.frozen) {
      const t = G.clock;
      ctx.save();
      ctx.translate(shot.x, shot.y);
      ctx.rotate(t * (shot.mag ? 1.5 : -1.7));
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 2.3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
        ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
        ctx.stroke();
      }
      ctx.restore();
      glowDot(shot.x, shot.y, 4.4, col, 1);
      ctx.save();
      ctx.globalAlpha = 0.28 + 0.12 * Math.sin(t * 6);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 22 + Math.sin(t * 4) * 2, 0, TAU);
      ctx.stroke();
      ctx.restore();
    } else {
      glowDot(shot.x, shot.y, 5.2, col, 1);
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(shot.x - shot.vx * 0.004, shot.y - shot.vy * 0.004, 2.1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCore(c) {
    const t = G.clock + c.pulse;
    const beat = 1 + 0.07 * Math.sin(t * 4.2);
    const r = c.r * beat;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.strokeStyle = 'rgba(255,227,107,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r + 8, 0, TAU);
    ctx.stroke();
    ctx.rotate(t * 0.7);
    ctx.fillStyle = '#ffe36b';
    ctx.shadowColor = '#ffe36b';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.72);
    ctx.lineTo(r * 0.55, 0);
    ctx.lineTo(0, r * 0.72);
    ctx.lineTo(-r * 0.55, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff6c2';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawWalls(list, gate) {
    for (let i = 0; i < list.length; i++) {
      const w = list[i];
      ctx.save();
      if (gate) {
        ctx.fillStyle = 'rgba(255, 61, 184, 0.22)';
        ctx.strokeStyle = 'rgba(255, 61, 184, 0.75)';
        ctx.shadowColor = '#ff3db8';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = 'rgba(10, 8, 24, 0.92)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
        ctx.shadowColor = 'rgba(0, 240, 255, 0.25)';
        ctx.shadowBlur = 8;
      }
      roundRect(w.x, w.y, w.w, w.h, gate ? 5 : 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      if (!gate) {
        ctx.strokeStyle = 'rgba(255, 61, 184, 0.12)';
        ctx.lineWidth = 1;
        roundRect(w.x + 3, w.y + 3, Math.max(0, w.w - 6), Math.max(0, w.h - 6), 4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawSpike(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(G.clock * 0.8);
    ctx.fillStyle = '#ff3db8';
    ctx.shadowColor = '#ff3db8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const r = i % 2 === 0 ? s.r : s.r * 0.42;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawTurret() {
    const ang = G.aim;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const hit = raycast(G.px, G.py, c, s, 280);
    ctx.save();
    ctx.strokeStyle = 'rgba(246,243,255,0.22)';
    ctx.setLineDash([5, 7]);
    ctx.lineDashOffset = -G.clock * 28;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(G.px + c * 26, G.py + s * 26);
    ctx.lineTo(hit.x, hit.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.translate(G.px, G.py);
    ctx.rotate(ang);
    ctx.fillStyle = '#14101f';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = G.muzzle > 0 ? '#ffe36b' : '#ff3db8';
    ctx.fillRect(8, -3.4, 18, 6.8);
    ctx.strokeStyle = '#ff9ad4';
    ctx.strokeRect(8, -3.4, 18, 6.8);
    ctx.fillStyle = '#f6f3ff';
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (G.muzzle > 0) {
      glowDot(G.px + c * 28, G.py + s * 28, 6, '#ffe36b', G.muzzle * 6);
    }
  }

  function drawLinkPair(a, b) {
    if (!a || !b) return;
    ctx.save();
    ctx.setLineDash([5, 9]);
    ctx.lineDashOffset = -G.clock * 48;
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, 'rgba(255,61,184,0.55)');
    g.addColorStop(1, 'rgba(0,240,255,0.55)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    const mx = (a.x + b.x) * 0.5;
    const my = (a.y + b.y) * 0.5;
    const nx = -(b.y - a.y) * 0.1;
    const ny = (b.x - a.x) * 0.1;
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mx + nx, my + ny, b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawWorld(walls, gates, spikes, cores, mag, cyn, turret) {
    ctx.fillStyle = '#070510';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 40; x < WORLD_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x, WORLD_H - 22);
      ctx.stroke();
    }
    for (let y = 40; y < WORLD_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(22, y);
      ctx.lineTo(WORLD_W - 22, y);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.clock * m.s + m.p));
      ctx.fillStyle = i % 2 ? 'rgba(0,240,255,' + a + ')' : 'rgba(255,61,184,' + a + ')';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }

    drawWalls(walls, false);
    if (gates && gates.length) drawWalls(gates, true);

    if (spikes) {
      for (let i = 0; i < spikes.length; i++) drawSpike(spikes[i]);
    }
    if (cores) {
      for (let i = 0; i < cores.length; i++) if (cores[i].alive !== false) drawCore(cores[i]);
    }

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.t) * 0.7;
      ctx.strokeStyle = r.gold ? '#ffe36b' : r.mag ? '#ff3db8' : '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.t);
      ctx.strokeStyle = b.mag ? '#ff3db8' : '#00f0ff';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(b.x0, b.y0);
      ctx.lineTo(b.x1, b.y1);
      ctx.stroke();
      ctx.restore();
    }

    drawLinkPair(mag, cyn);

    if (mag) drawShot(mag);
    if (cyn) drawShot(cyn);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / p.max;
      const col = p.gold ? '#ffe36b' : p.mag ? '#ff3db8' : '#00f0ff';
      glowDot(p.x, p.y, p.r * a, col, a);
    }

    if (turret) drawTurret();
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

    if (G.mode === 'title') {
      drawWorld(demo.walls, [], [], [{ x: demo.core.x, y: demo.core.y, r: CORE_R, pulse: 0, alive: true }], demo.mag, demo.cyn, false);
      glowDot(148, 428, 6, '#00f0ff', 0.7);
    } else {
      drawWorld(G.walls, G.gates, G.spikes, G.cores, G.mag, G.cyn, true);
    }

    ctx.restore();

    if (G.flash > 0) {
      ctx.save();
      ctx.globalAlpha = G.flash * 0.28;
      ctx.fillStyle = G.flashCol;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    }
  }

  let last = 0;
  function loop(now) {
    const t = now * 0.001;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.05) dt = 0.05;
    G.t = t;
    if (!G.paused) {
      G.clock += dt;
      if (G.mode === 'title') {
        updateDemo(dt);
        updateFx(dt);
      } else if (G.mode === 'play' || G.mode === 'clear') {
        updatePlay(dt);
        updateFx(dt);
        if (G.mode === 'clear') {
          G.clearT -= dt;
          if (G.clearT <= 0) nextStage();
        }
        audio.tickDrone(G.mode === 'play' || G.mode === 'clear');
      } else {
        updateFx(dt);
        audio.tickDrone(false);
      }
      syncHud(false);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function isAimKey(code) {
    return code === 'KeyA' || code === 'KeyD' || code === 'ArrowLeft' || code === 'ArrowRight';
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat && (e.code === 'Space' || e.code === 'KeyQ' || e.code === 'KeyE' || e.code === 'Digit1' || e.code === 'Digit2')) {
      e.preventDefault();
      return;
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space') {
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
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onMain();
      }
      return;
    }
    if (isAimKey(e.code)) {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    }
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyJ') {
      e.preventDefault();
      fire();
    }
    if (e.code === 'KeyQ' || e.code === 'Digit1') {
      e.preventDefault();
      port(true);
    }
    if (e.code === 'KeyE' || e.code === 'Digit2') {
      e.preventDefault();
      port(false);
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (G.mode !== 'play') return;
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.sx = e.clientX;
    pointer.sy = e.clientY;
    pointer.t = performance.now();
    pointer.dragged = false;
    pointer.aiming = true;
    aimAt(w.x, w.y);
    if (e.pointerType === 'mouse' && e.button === 0) {
      const near = shotNear(w.x, w.y);
      if (near && G.mag && G.cyn) port(near.mag);
      else fire();
    }
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (G.mode === 'play') aimAt(w.x, w.y);
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const dx = e.clientX - pointer.sx;
    const dy = e.clientY - pointer.sy;
    if (dx * dx + dy * dy > TAP_PX * TAP_PX) pointer.dragged = true;
  });

  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    const held = performance.now() - pointer.t;
    const wasTap = pointer.down && !pointer.dragged && held <= TAP_MS;
    pointer.down = false;
    pointer.aiming = false;
    pointer.id = null;
    if (G.mode !== 'play') return;
    if (e.pointerType !== 'mouse' && wasTap) {
      const w = worldFromEvent(e);
      const near = shotNear(w.x, w.y);
      if (near && G.mag && G.cyn) port(near.mag);
      else fire();
    }
  });

  canvas.addEventListener('pointercancel', function () {
    pointer.down = false;
    pointer.aiming = false;
    pointer.id = null;
  });
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    onMain();
  });
  btnFire.addEventListener('click', function (e) {
    e.preventDefault();
    audio.ensure();
    fire();
  });
  btnMag.addEventListener('click', function (e) {
    e.preventDefault();
    audio.ensure();
    port(true);
  });
  btnCyn.addEventListener('click', function (e) {
    e.preventDefault();
    audio.ensure();
    port(false);
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
    if (!document.hidden) last = performance.now() * 0.001;
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
