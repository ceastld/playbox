'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const AX = 156;
  const AY = 396;
  const POST_L = { x: 120, y: 368 };
  const POST_R = { x: 194, y: 384 };
  const GRAV = 360;
  const MIN_SPD = 280;
  const MAX_SPD = 820;
  const MAX_PULL = 140;
  const ORB_R = 9.2;
  const FLOOR_Y = 518;
  const PIT_X = 248;
  const ANG_MIN = -1.32;
  const ANG_MAX = 0.2;
  const LIVES = 4;
  const MIN_FIRE = 0.2;
  const MUTE_KEY = 'sling-orb-mute';

  const STAGES = [
    {
      name: '初弦',
      sub: 'FIRST',
      hint: '向后拉开，对准环心再松手',
      toast: '拉开光弦，穿过青色环心',
      rings: [{ kind: 'still', x: 600, y: 158, inner: 50, thick: 11 }]
    },
    {
      name: '横波',
      sub: 'SWEEP',
      hint: '环在横移，预判它将到达的位置',
      toast: '虚影是落点时的环，打虚影',
      rings: [{ kind: 'x', x: 660, y: 186, a: 520, b: 790, spd: 1.05, phase: 0, inner: 46, thick: 11 }]
    },
    {
      name: '沉浮',
      sub: 'TIDE',
      hint: '等环沉进你的弧线',
      toast: '环在沉浮，弧线要咬住它',
      rings: [{ kind: 'y', x: 698, y: 210, a: 118, b: 292, spd: 1.15, phase: 0.4, inner: 42, thick: 10 }]
    },
    {
      name: '连穿',
      sub: 'CHAIN',
      hint: '一发穿过两环',
      toast: '一发连穿两环，擦壁即碎',
      rings: [
        { kind: 'still', x: 450, y: 184, inner: 48, thick: 11 },
        { kind: 'y', x: 760, y: 96, a: 78, b: 118, spd: 0.8, phase: 0.5, inner: 38, thick: 10 }
      ]
    },
    {
      name: '疾轨',
      sub: 'ORBIT',
      hint: '打它将经过的位置',
      toast: '环在疾转，瞄准虚影',
      rings: [{ kind: 'orbit', x: 650, y: 214, rad: 124, ry: 88, spd: 1.15, phase: 0.2, inner: 36, thick: 10 }]
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
  const powerLabel = document.getElementById('power-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false, u: false, d: false };
  const pointer = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    wx: 0,
    wy: 0,
    mode: 'sling'
  };

  const particles = [];
  const motes = [];
  const ripples = [];

  const G = {
    mode: 'title',
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    angle: -0.92,
    power: 0.62,
    restAngle: -0.92,
    restPower: 0.62,
    pulling: false,
    flight: null,
    rings: [],
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: '#00f0ff',
    toastT: 0,
    clearT: 0,
    paused: false,
    perfects: 0,
    threads: 0,
    shots: 0,
    hud: ''
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
  function wrapPi(a) {
    while (a < -Math.PI) a += TAU;
    while (a > Math.PI) a -= TAU;
    return a;
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
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    fire: function (power) {
      this.ensure();
      const p = clamp(power, 0.2, 1);
      this.noise(0.16, 0.08 + p * 0.06, 280, 1600);
      this.beep(180 + p * 80, 0.12, 'sine', 0.05, 90);
      this.beep(640 + p * 200, 0.1, 'triangle', 0.045, 280);
    },
    thread: function (perfect) {
      this.ensure();
      this.beep(perfect ? 660 : 520, 0.12, 'triangle', 0.08, perfect ? 1320 : 880);
      this.beep(perfect ? 990 : 780, 0.22, 'sine', 0.06, perfect ? 1760 : 1180);
    },
    rim: function () {
      this.ensure();
      this.noise(0.14, 0.1, 900, 220);
      this.beep(240, 0.16, 'square', 0.05, 80);
    },
    miss: function () {
      this.ensure();
      this.beep(160, 0.22, 'sawtooth', 0.05, 60);
    },
    deny: function () {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.035, 90);
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
      this.beep(220, 0.14, 'sine', 0.06, 520);
      this.beep(330, 0.18, 'triangle', 0.045, 880);
    },
    tickDrone: function (play, power) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 46;
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
      this.drone.frequency.setTargetAtTime(44 + (play ? 8 : 0), t, 0.14);
      this.droneGain.gain.setTargetAtTime(play ? 0.016 : 0.0001, t, 0.2);
      const pulling = G.pulling && !G.flight;
      this.taut.frequency.setTargetAtTime(78 + power * 260, t, 0.08);
      this.tautGain.gain.setTargetAtTime(pulling ? 0.01 + power * 0.032 : 0.0001, t, 0.06);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 110) particles.shift();
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
        r: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.22 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.65 + 0.12
      });
    }
  }

  function ringPos(spec, t) {
    if (spec.kind === 'x') {
      const u = (Math.sin(t * spec.spd + spec.phase) + 1) * 0.5;
      return { x: spec.a + (spec.b - spec.a) * u, y: spec.y };
    }
    if (spec.kind === 'y') {
      const u = (Math.sin(t * spec.spd + spec.phase) + 1) * 0.5;
      return { x: spec.x, y: spec.a + (spec.b - spec.a) * u };
    }
    if (spec.kind === 'orbit') {
      const a = t * spec.spd + spec.phase;
      const ry = spec.ry || spec.rad;
      return { x: spec.x + Math.cos(a) * spec.rad, y: spec.y + Math.sin(a) * ry };
    }
    return { x: spec.x, y: spec.y };
  }

  function speedOf(power) {
    return MIN_SPD + clamp(power, 0, 1) * (MAX_SPD - MIN_SPD);
  }

  function orbRest(noBob) {
    const dist = 22 + G.power * MAX_PULL;
    const bob = (noBob || G.flight) ? 0 : Math.sin(G.t * 2.2) * 1.6;
    return {
      x: AX - Math.cos(G.angle) * dist,
      y: AY - Math.sin(G.angle) * dist + bob
    };
  }

  function cloneRings(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      out.push({
        kind: s.kind,
        x: s.x,
        y: s.y,
        a: s.a,
        b: s.b,
        rad: s.rad,
        ry: s.ry,
        spd: s.spd || 0,
        phase: s.phase || 0,
        inner: s.inner,
        thick: s.thick,
        hit: false,
        pop: 0,
        spin: rand(0, TAU)
      });
    }
    return out;
  }

  function loadStage(index) {
    const s = STAGES[index];
    G.stage = index;
    G.rings = cloneRings(s.rings);
    G.flight = null;
    G.pulling = false;
    pointer.down = false;
    G.lock = 0.42;
    G.clearT = 0;
    G.clock = 0;
    G.angle = G.restAngle;
    G.power = G.restPower;
    canvas.classList.remove('drawing');
    toast(s.toast);
    hintEl.textContent = s.hint;
  }

  function startRun() {
    G.mode = 'play';
    G.lives = LIVES;
    G.perfects = 0;
    G.threads = 0;
    G.shots = 0;
    G.restAngle = -0.92;
    G.restPower = 0.62;
    G.angle = G.restAngle;
    G.power = G.restPower;
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
      ovKicker.textContent = 'SLING';
      ovTitle.textContent = '弹射';
      ovLead.innerHTML = '拉开光弦，把光球打进移动的环。<br />穿过环心才算。擦到环壁或落地都会碎。';
      ovOps.textContent = '拖动拉弓 · A/D 瞄准 · W/S 力度 · 空格弹出 · M 静音';
      ovBtn.textContent = '拉弦';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'CLEAR';
      ovTitle.textContent = '弦停';
      ovLead.textContent = '五环尽穿。光还在弦上。';
      ovOps.textContent = '穿过 ' + G.threads + ' 环 · 正中 ' + G.perfects + ' · 出手 ' + G.shots;
      ovBtn.textContent = '再拉一次';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'SNAP';
      ovTitle.textContent = '弦断';
      ovLead.textContent = '光球尽了。环还在游。';
      ovOps.textContent = STAGES[G.stage].name + ' · 穿过 ' + G.threads + ' 环';
      ovBtn.textContent = '再拉一次';
    }
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function retry() {
    audio.ensure();
    startRun();
  }

  function onMain() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startRun();
  }

  function allHit() {
    for (let i = 0; i < G.rings.length; i++) {
      if (!G.rings[i].hit) return false;
    }
    return G.rings.length > 0;
  }

  function predict() {
    const dots = [];
    const ghosts = [];
    const rings = G.rings;
    for (let i = 0; i < rings.length; i++) {
      ghosts.push({ d: 1e9, x: 0, y: 0, ox: 0, oy: 0, ok: false });
    }
    if (G.flight) return { dots: dots, ghosts: ghosts };
    const spd = speedOf(G.power);
    let x = AX - Math.cos(G.angle) * (22 + G.power * MAX_PULL);
    let y = AY - Math.sin(G.angle) * (22 + G.power * MAX_PULL);
    let vx = Math.cos(G.angle) * spd;
    let vy = Math.sin(G.angle) * spd;
    const dt = 0.038;
    for (let i = 0; i < 58; i++) {
      vy += GRAV * dt;
      x += vx * dt;
      y += vy * dt;
      const t = G.clock + (i + 1) * dt;
      if (i % 2 === 0) dots.push({ x: x, y: y, a: 1 - i / 58 });
      for (let r = 0; r < rings.length; r++) {
        if (rings[r].hit) continue;
        const p = ringPos(rings[r], t);
        const d = hypot(x - p.x, y - p.y);
        if (d < ghosts[r].d) {
          ghosts[r].d = d;
          ghosts[r].x = p.x;
          ghosts[r].y = p.y;
          ghosts[r].ox = x;
          ghosts[r].oy = y;
          ghosts[r].ok = d < rings[r].inner - ORB_R * 0.15;
          ghosts[r].rim = !ghosts[r].ok && d < rings[r].inner + rings[r].thick + ORB_R;
        }
      }
      if ((y > FLOOR_Y + 8 && x > PIT_X) || x < -40 || x > WORLD_W + 40 || y < -50 || y > WORLD_H + 24) break;
    }
    return { dots: dots, ghosts: ghosts };
  }

  function setPullFromPointer(wx, wy) {
    const dx = wx - AX;
    const dy = wy - AY;
    let ang;
    if (dx > 18) ang = Math.atan2(dy, dx);
    else ang = Math.atan2(-dy, -dx);
    G.angle = clamp(wrapPi(ang), ANG_MIN, ANG_MAX);
    G.power = clamp(hypot(dx, dy) / MAX_PULL, 0, 1);
  }

  function beginPull(wx, wy) {
    if (G.mode !== 'play' || G.flight || G.lock > 0) return;
    G.pulling = true;
    pointer.wx = wx;
    pointer.wy = wy;
    const rest = orbRest(true);
    const nearOrb = hypot(wx - rest.x, wy - rest.y) < 40;
    if (nearOrb || wx < AX + 46) {
      pointer.mode = 'sling';
      if (!nearOrb) setPullFromPointer(wx, wy);
    } else {
      pointer.mode = 'point';
      G.angle = clamp(Math.atan2(wy - AY, wx - AX), ANG_MIN, ANG_MAX);
      G.power = 0.18;
    }
    canvas.classList.add('drawing');
    audio.ensure();
  }

  function movePull(wx, wy) {
    if (!G.pulling || G.flight) return;
    if (pointer.mode === 'point') {
      const d = hypot(wx - pointer.wx, wy - pointer.wy);
      G.power = clamp(Math.max(0.18, d / MAX_PULL), 0, 1);
    } else {
      setPullFromPointer(wx, wy);
    }
  }

  function endPull() {
    canvas.classList.remove('drawing');
    if (!G.pulling) return;
    G.pulling = false;
    if (G.mode !== 'play' || G.flight || G.lock > 0) return;
    if (G.power >= MIN_FIRE) fire();
    else {
      G.angle = G.restAngle;
      G.power = G.restPower;
      audio.deny();
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.flight || G.lock > 0) return;
    if (G.power < MIN_FIRE) {
      audio.deny();
      return;
    }
    const rest = orbRest(true);
    const spd = speedOf(G.power);
    G.flight = {
      x: rest.x,
      y: rest.y,
      vx: Math.cos(G.angle) * spd,
      vy: Math.sin(G.angle) * spd,
      trail: [],
      age: 0
    };
    G.restAngle = G.angle;
    G.restPower = G.power;
    G.pulling = false;
    G.shots += 1;
    canvas.classList.remove('drawing');
    audio.fire(G.power);
    emit(10, {
      x: rest.x, y: rest.y, j: 4,
      vx0: G.flight.vx * 0.04, vx1: G.flight.vx * 0.12,
      vy0: G.flight.vy * 0.04, vy1: G.flight.vy * 0.12,
      life: 0.28, r0: 1.2, r1: 3.2, col: 'c'
    });
    ripple(rest.x, rest.y, 'c', 28);
  }

  function threadRing(ring, pos, d) {
    ring.hit = true;
    ring.pop = 0.001;
    G.threads += 1;
    const perfect = d < ring.inner * 0.38;
    if (perfect) G.perfects += 1;
    audio.thread(perfect);
    G.flash = 0.28;
    G.flashCol = perfect ? '#ffe36b' : '#00f0ff';
    G.shake = perfect ? 5 : 3.2;
    ripple(pos.x, pos.y, perfect ? 'g' : 'c', perfect ? 78 : 62);
    emit(perfect ? 28 : 18, {
      x: pos.x, y: pos.y, j: ring.inner * 0.4,
      vx0: -140, vx1: 140, vy0: -160, vy1: 80,
      life: 0.55, r0: 1.4, r1: 4.2, col: perfect ? 'g' : 'c'
    });
    let msg = '穿过';
    if (perfect) msg = '正中';
    else if (!allHit()) {
      let ahead = false;
      for (let i = 0; i < G.rings.length; i++) {
        if (G.rings[i].hit) continue;
        if (ringPos(G.rings[i], G.clock).x > pos.x - 12) ahead = true;
      }
      if (ahead) msg = '穿过 · 还有一环';
    }
    toast(msg, perfect ? 'gold' : '');
    if (allHit()) {
      G.mode = 'clear';
      G.clearT = 0.82;
      G.lock = 1;
    }
  }

  function shatterAt(x, y, why) {
    if (!G.flight) return;
    G.flight = null;
    G.shake = why === 'rim' ? 8 : 5;
    G.flash = 0.32;
    G.flashCol = '#ff3db8';
    if (why === 'rim') audio.rim();
    else audio.miss();
    ripple(x, y, 'm', why === 'rim' ? 46 : 40);
    emit(22, {
      x: x, y: y, j: 6,
      vx0: -180, vx1: 180, vy0: -220, vy1: 40,
      life: 0.48, r0: 1.2, r1: 3.8, col: 'm'
    });
    if (G.mode === 'clear' || G.mode === 'win') return;
    missLife(why);
  }

  function missLife(why) {
    G.lives -= 1;
    for (let i = 0; i < G.rings.length; i++) {
      G.rings[i].hit = false;
      G.rings[i].pop = 0;
    }
    G.lock = 0.55;
    G.angle = G.restAngle;
    G.power = G.restPower;
    if (why === 'rim') toast('擦环', 'warn');
    else if (why === 'floor') toast('落地', 'warn');
    else toast('偏了', 'warn');
    if (G.lives <= 0) {
      G.mode = 'lose';
      audio.lose();
      showOverlay('lose');
    }
  }

  function nextStage() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      G.flight = null;
      audio.win();
      showOverlay('win');
      return;
    }
    G.mode = 'play';
    loadStage(G.stage + 1);
  }

  function checkRings(prevX, prevY, x, y, dt) {
    const rings = G.rings;
    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      if (ring.hit) continue;
      const p0 = ringPos(ring, G.clock - dt);
      const p1 = ringPos(ring, G.clock);
      const relx = (x - prevX) - (p1.x - p0.x);
      const rely = (y - prevY) - (p1.y - p0.y);
      const ox = prevX - p0.x;
      const oy = prevY - p0.y;
      const denom = relx * relx + rely * rely;
      let tt = 0;
      if (denom > 0.0001) tt = clamp(-(ox * relx + oy * rely) / denom, 0, 1);
      const dx = ox + relx * tt;
      const dy = oy + rely * tt;
      const d = hypot(dx, dy);
      const inner = ring.inner;
      const outer = ring.inner + ring.thick;
      const dNow = hypot(x - p1.x, y - p1.y);
      if (dNow < inner - ORB_R * 0.35 || (tt > 0.02 && tt < 0.98 && d <= inner - ORB_R * 0.08)) {
        threadRing(ring, p1, Math.min(d, dNow));
        continue;
      }
      if (tt > 0.02 && tt < 0.98 && d <= outer + ORB_R * 0.7 && d > inner - ORB_R * 0.08) {
        shatterAt(x, y, 'rim');
        return;
      }
    }
  }

  function updateFlight(dt) {
    const f = G.flight;
    if (!f) return;
    const prevX = f.x;
    const prevY = f.y;
    f.vy += GRAV * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.age += dt;
    f.trail.push({ x: f.x, y: f.y });
    if (f.trail.length > 16) f.trail.shift();
    if (f.age > 0.04) checkRings(prevX, prevY, f.x, f.y, dt);
    if (!G.flight) return;
    if (G.mode === 'clear') return;
    if (f.y > FLOOR_Y - ORB_R * 0.2 && f.x > PIT_X) {
      shatterAt(f.x, FLOOR_Y, 'floor');
      return;
    }
    if (f.x < -36 || f.x > WORLD_W + 40 || f.y < -48 || f.y > WORLD_H + 18) {
      shatterAt(f.x, f.y, 'out');
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.6;
      r.r += (r.max - r.r) * 6 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = 0; i < G.rings.length; i++) {
      const ring = G.rings[i];
      ring.spin += dt * (ring.hit ? 0.4 : 0.9);
      if (ring.pop > 0) ring.pop += dt;
    }
    G.shake = Math.max(0, G.shake - dt * 16);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    if (!G.pulling && !G.flight && G.mode === 'play') {
      const turn = (keys.l ? -1 : 0) + (keys.r ? 1 : 0);
      const pow = (keys.u ? 1 : 0) + (keys.d ? -1 : 0);
      if (turn) {
        G.angle = clamp(G.angle + turn * 1.35 * dt, ANG_MIN, ANG_MAX);
        G.restAngle = G.angle;
      }
      if (pow) {
        G.power = clamp(G.power + pow * 0.72 * dt, 0.12, 1);
        G.restPower = G.power;
      }
    }
    if (G.flight) updateFlight(dt);
    if (G.mode === 'clear') {
      G.clearT -= dt;
      if (G.flight) {
        G.flight.vx *= 0.96;
        G.flight.vy *= 0.96;
      }
      if (G.clearT <= 0) nextStage();
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    G.angle = -0.92 + Math.sin(G.t * 0.55) * 0.16;
    G.power = 0.58 + Math.sin(G.t * 0.8) * 0.08;
    if (!G.rings.length) {
      G.rings = cloneRings(STAGES[1].rings);
    }
  }

  function syncHud(force) {
    const pulling = G.pulling || (!G.flight && G.mode === 'play');
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + (G.power * 20 | 0) + ':' + (pulling ? 1 : 0) + ':' + (G.flight ? 1 : 0);
    if (!force && key === G.hud) return;
    G.hud = key;
    if (G.mode === 'title') {
      stageLabel.textContent = '弹射';
      powerLabel.textContent = 'SLING';
      powerLabel.classList.remove('warn');
    } else {
      const s = STAGES[G.stage];
      stageLabel.textContent = '关卡 ' + (G.stage + 1) + '/' + STAGES.length + ' · ' + s.name + ' ' + s.sub;
      if (G.flight) powerLabel.textContent = '飞行';
      else powerLabel.textContent = '力度 ' + Math.round(G.power * 100);
      powerLabel.classList.toggle('warn', G.lives === 1);
    }
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? ' on warn' : ' on') : '') + '"></i>';
    }
    pipsEl.innerHTML = html;
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

  function colOf(c) {
    if (c === 'm') return '#ff3db8';
    if (c === 'g') return '#ffe36b';
    return '#00f0ff';
  }

  function drawFloor() {
    const g = ctx.createLinearGradient(0, 470, 0, WORLD_H);
    g.addColorStop(0, 'rgba(5, 3, 12, 0)');
    g.addColorStop(0.45, 'rgba(255, 61, 184, 0.05)');
    g.addColorStop(1, 'rgba(0, 240, 255, 0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(PIT_X - 8, 470, WORLD_W - (PIT_X - 8), WORLD_H - 470);
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(PIT_X, FLOOR_Y);
    ctx.lineTo(WORLD_W - 36, FLOOR_Y);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(12, 8, 28, 0.85)';
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
    ctx.lineWidth = 1.3;
    roundRect(48, AY + 16, PIT_X - 64, 18, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const y = FLOOR_Y + 6 + i * 5;
      ctx.globalAlpha = 0.35 - i * 0.05;
      ctx.beginPath();
      ctx.moveTo(PIT_X + i * 8, y);
      ctx.lineTo(WORLD_W - 48 - i * 8, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 40; x < WORLD_W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 24);
      ctx.lineTo(x, FLOOR_Y - 8);
      ctx.stroke();
    }
    for (let y = 36; y < FLOOR_Y; y += 48) {
      ctx.beginPath();
      ctx.moveTo(32, y);
      ctx.lineTo(WORLD_W - 32, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPost(p, lean) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(lean);
    ctx.fillStyle = '#1a1028';
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(8, 16);
    ctx.lineTo(-8, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ff3db8';
    ctx.strokeRect(-3.2, -6, 6.4, 14);
    ctx.restore();
  }

  function drawBand(ax, ay, bx, by, taut) {
    const mx = (ax + bx) * 0.5;
    const my = (ay + by) * 0.5 + (1 - taut) * 16;
    ctx.save();
    ctx.lineWidth = 2.4 - taut * 0.8;
    ctx.strokeStyle = taut > 0.55 ? '#ff3db8' : '#00f0ff';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12 + taut * 10;
    ctx.globalAlpha = 0.55 + taut * 0.4;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(mx, my, bx, by);
    ctx.stroke();
    ctx.restore();
  }

  function drawRing(ring, pos, ghost, pred) {
    const inner = ring.inner;
    const thick = ring.thick;
    const hit = ring.hit;
    const pop = ring.pop;
    let scale = 1;
    let alpha = ghost ? 0.38 : 1;
    if (hit) {
      scale = 1 + Math.min(0.55, pop * 1.1);
      alpha = Math.max(0, 1 - pop * 1.3);
    }
    if (alpha <= 0.02) return;
    const col = hit || (pred && pred.ok) ? '#00f0ff' : (pred && pred.rim ? '#ff3db8' : '#00f0ff');
    const mag = pred && pred.rim && !pred.ok;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(ring.spin * 0.15);
    ctx.scale(scale, scale * 0.96);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = mag ? '#ff3db8' : col;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = ghost ? 8 : 18;
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.arc(0, 0, inner + thick * 0.5, 0, TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = hit ? 'rgba(255,227,107,0.85)' : 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, inner + thick * 0.5, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = mag ? 'rgba(255,61,184,0.5)' : 'rgba(0,240,255,0.35)';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + ring.spin;
      const r0 = inner - 3;
      const r1 = inner + thick + 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, inner - 1, 0, TAU);
    ctx.strokeStyle = 'rgba(5,3,12,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!ghost && !hit) {
      const beat = 0.5 + 0.5 * Math.sin(G.t * 3 + ring.spin);
      ctx.globalAlpha = 0.12 + beat * 0.12;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, inner * 0.42, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSling(orb) {
    const taut = G.flight ? 0 : G.power;
    const lean = (G.angle + 0.6) * 0.08;
    if (!G.flight) {
      drawBand(POST_L.x, POST_L.y - 14, orb.x, orb.y, taut);
      drawBand(POST_R.x, POST_R.y - 14, orb.x, orb.y, taut);
    }
    drawPost(POST_L, -0.18 + lean);
    drawPost(POST_R, 0.22 + lean);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(POST_L.x, POST_L.y + 14);
    ctx.lineTo(POST_R.x, POST_R.y + 16);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(8, 6, 22, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1.2;
    roundRect(AX - 42, AY + 18, 84, 14, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawOrb(o, flying) {
    const pulse = 0.85 + 0.15 * Math.sin(G.t * 8);
    glowDot(o.x, o.y, flying ? 7.2 : 6.4, '#00f0ff', 0.95);
    ctx.save();
    ctx.fillStyle = '#e8ffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(o.x - 2.2, o.y - 2.4, 2.4 * pulse, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#ff3db8';
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(o.x, o.y, ORB_R + 1.5, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawAim(pred) {
    if (G.flight || G.mode === 'win' || G.mode === 'lose') return;
    const dots = pred.dots;
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      glowDot(d.x, d.y, 1.6 + (i % 3 === 0 ? 1.1 : 0), '#00f0ff', 0.16 + d.a * 0.45);
    }
    for (let i = 0; i < G.rings.length; i++) {
      const g = pred.ghosts[i];
      if (!g || g.d > 180) continue;
      if (G.rings[i].hit) continue;
      const pos = { x: g.x, y: g.y };
      drawRing(G.rings[i], pos, true, g);
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(AX, AY, 18 + G.power * MAX_PULL, ANG_MIN + Math.PI, ANG_MAX + Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  function drawWorld() {
    const grd = ctx.createRadialGradient(AX, AY, 20, WORLD_W * 0.62, WORLD_H * 0.3, 640);
    grd.addColorStop(0, '#0a0618');
    grd.addColorStop(1, '#05030c');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb = ctx.createRadialGradient(120, 40, 10, 120, 40, 380);
    neb.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    neb.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb2 = ctx.createRadialGradient(820, 80, 10, 820, 80, 360);
    neb2.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
    neb2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawGrid();
    drawFloor();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * m.s + m.p));
      glowDot(m.x, (m.y + G.t * 6 * m.s) % WORLD_H, m.r, i % 3 === 0 ? '#ff3db8' : '#00f0ff', a);
    }

    const pred = (G.mode === 'play' || G.mode === 'title') && !G.flight ? predict() : { dots: [], ghosts: [] };
    drawAim(pred);

    for (let i = 0; i < G.rings.length; i++) {
      const ring = G.rings[i];
      const pos = ringPos(ring, G.clock);
      drawRing(ring, pos, false, pred.ghosts[i]);
    }

    const rest = orbRest();
    drawSling(rest);

    if (G.flight && G.flight.trail) {
      for (let i = 0; i < G.flight.trail.length; i++) {
        const tr = G.flight.trail[i];
        glowDot(tr.x, tr.y, 2.2, '#00f0ff', (i / G.flight.trail.length) * 0.45);
      }
    }

    if (!G.flight || G.mode === 'play' || G.mode === 'clear' || G.mode === 'title') {
      if (G.flight) drawOrb(G.flight, true);
      else drawOrb(rest, false);
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
    if (!G.paused) {
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        if (G.mode === 'title') updateTitle(STEP);
        else if (G.mode === 'play' || G.mode === 'clear') updatePlay(STEP);
        updateFx(STEP);
        acc -= STEP;
      }
      audio.tickDrone(G.mode === 'play' || G.mode === 'clear', G.power);
      syncHud(false);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function isPlayInput() {
    return G.mode === 'play' && !G.flight && G.lock <= 0;
  }

  window.addEventListener('keydown', function (e) {
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
    if (e.code === 'Escape' && G.pulling) {
      G.pulling = false;
      pointer.down = false;
      canvas.classList.remove('drawing');
      G.angle = G.restAngle;
      G.power = G.restPower;
      return;
    }
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onMain();
      }
      return;
    }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = true;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = true;
    if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
      e.preventDefault();
      if (isPlayInput() && !G.pulling) fire();
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.l = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.r = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = false;
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
    beginPull(w.x, w.y);
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (!pointer.down || e.pointerId !== pointer.id) return;
    movePull(w.x, w.y);
  });

  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    pointer.down = false;
    pointer.id = null;
    endPull();
  });

  canvas.addEventListener('pointercancel', function () {
    pointer.down = false;
    pointer.id = null;
    G.pulling = false;
    canvas.classList.remove('drawing');
    G.angle = G.restAngle;
    G.power = G.restPower;
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
  G.rings = cloneRings(STAGES[1].rings);
  showOverlay('title');
  syncHud(true);
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
