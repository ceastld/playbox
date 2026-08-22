'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const PHYS = 1 / 120;
  const WATER_Y = 364;
  const BANK_Y = 356;
  const NEAR_X = 164;
  const TX = 114;
  const TY = 316;
  const PEBBLE_R = 6.5;
  const GRAV = 520;
  const MIN_SPD = 300;
  const MAX_SPD = 740;
  const SKIP_ANG = 0.5;
  const MIN_SKIP_SPD = 160;
  const BOUNCE_CAP = 128;
  const ANG_MIN = -0.28;
  const ANG_MAX = 0.22;
  const LIVES = 5;
  const MIN_FIRE = 0.16;
  const MAX_PULL = 220;
  const MUTE_KEY = 'pebble-skip-mute';
  const SKIP_CN = ['', '一跳', '二跳', '三跳', '四跳', '五跳', '六跳', '七跳', '八跳', '九跳', '十跳'];

  const STAGES = [
    {
      name: '浅湾', sub: 'COVE', minSkip: 1,
      hint: '按住瞄准，贴着水面松手',
      toast: '擦着水面跳一次，落到金矶',
      landX: 430, padW: 280, wind: 0
    },
    {
      name: '连跳', sub: 'CHAIN', minSkip: 2,
      hint: '力度留一点，让它连跳两回',
      toast: '至少两跳。跳得越平，跳得越远',
      landX: 560, padW: 230, wind: 0
    },
    {
      name: '窄矶', sub: 'NARROW', minSkip: 2,
      hint: '矶变窄了，别跳过头',
      toast: '过头会沉进矶后的水',
      landX: 610, padW: 100, wind: 0
    },
    {
      name: '逆风', sub: 'GUST', minSkip: 2,
      hint: '风往回吹，多给一点力度',
      toast: '逆风拖慢石子，稍微加力',
      landX: 555, padW: 200, wind: -60
    },
    {
      name: '石障', sub: 'ROCK', minSkip: 2,
      hint: '青石会砸碎石子，从弧顶越过去',
      toast: '第一跳落在石前，第二跳越石',
      landX: 640, padW: 175, wind: 0,
      rocks: [{ x: 405, r: 14 }]
    },
    {
      name: '浪脊', sub: 'SWELL', minSkip: 2,
      hint: '浪会抬高水面，贴波谷再跳',
      toast: '浪峰会吞石，等波谷',
      landX: 620, padW: 165, wind: 0,
      wave: { amp: 12, k: 0.014, w: 1.4 }
    },
    {
      name: '漂木', sub: 'DRIFT', minSkip: 2,
      hint: '木头在漂，等它让开再抛',
      toast: '撞上漂木即碎。看虚线等窗口',
      landX: 660, padW: 155, wind: 0,
      logs: [{ a: 400, b: 560, w: 50, h: 10, spd: 0.5, phase: 0.8 }]
    },
    {
      name: '双石', sub: 'TEETH', minSkip: 2,
      hint: '两块石头夹着跳',
      toast: '从石缝的弧线里穿过去',
      landX: 690, padW: 140, wind: 0,
      rocks: [{ x: 340, r: 12 }, { x: 530, r: 13 }]
    },
    {
      name: '逆潮', sub: 'TIDE', minSkip: 2,
      hint: '风、浪、石一起上',
      toast: '逆风贴浪，越石落窄矶',
      landX: 670, padW: 96, wind: -40,
      wave: { amp: 10, k: 0.013, w: 1.5 },
      rocks: [{ x: 450, r: 13 }]
    },
    {
      name: '远岸', sub: 'FAR', minSkip: 3,
      hint: '最远的岸。至少三跳',
      toast: '连跳三次，越石落到尽头',
      landX: 735, padW: 115, wind: -20,
      rocks: [{ x: 370, r: 12 }]
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
  const pointer = { down: false, id: null, x: 0, y: 0 };

  const particles = [];
  const motes = [];
  const ripples = [];
  const spray = [];
  const floaters = [];
  const reeds = [];

  const G = {
    mode: 'title',
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    angle: -0.06,
    power: 0.48,
    restAngle: -0.06,
    restPower: 0.48,
    pulling: false,
    flight: null,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: '#00f0ff',
    toastT: 0,
    clearT: 0,
    paused: false,
    shots: 0,
    lands: 0,
    skips: 0,
    best: 0,
    hud: '',
    demoT: 0.6
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
  function stageOf() {
    return STAGES[G.stage] || STAGES[0];
  }
  function speedOf(power) {
    return MIN_SPD + clamp(power, 0, 1) * (MAX_SPD - MIN_SPD);
  }
  function waterYAt(x, t, stage) {
    const wave = stage && stage.wave;
    if (!wave) return WATER_Y;
    return WATER_Y + wave.amp * Math.sin(x * wave.k + t * wave.w);
  }
  function logX(log, t) {
    const u = (Math.sin(t * log.spd + log.phase) + 1) * 0.5;
    return log.a + (log.b - log.a) * u;
  }
  function overWater(x, stage) {
    return (x > NEAR_X + 8 && x < stage.landX) || (x > stage.landX + stage.padW + 1);
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
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
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
      f.Q.value = 0.75;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    throw: function (power) {
      this.ensure();
      const p = clamp(power, 0.15, 1);
      this.noise(0.12, 0.07 + p * 0.05, 240, 1400);
      this.beep(160 + p * 70, 0.1, 'sine', 0.05, 80);
    },
    skip: function (n, q) {
      this.ensure();
      const p = 380 + n * 70 + q * 80;
      this.noise(0.1, 0.06 + q * 0.04, 500, 180);
      this.beep(p, 0.11, 'triangle', 0.055 + q * 0.03, p * 1.7);
    },
    sink: function () {
      this.ensure();
      this.noise(0.22, 0.09, 400, 90);
      this.beep(140, 0.28, 'sine', 0.05, 50);
    },
    smash: function () {
      this.ensure();
      this.noise(0.14, 0.1, 900, 200);
      this.beep(220, 0.14, 'square', 0.045, 70);
    },
    land: function (n) {
      this.ensure();
      this.beep(420 + n * 40, 0.14, 'triangle', 0.08, 840);
      this.beep(630, 0.22, 'sine', 0.055, 1260);
    },
    deny: function () {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 90);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, 'triangle', 0.09, 880);
      this.beep(660, 0.24, 'sine', 0.07, 1320);
      this.beep(880, 0.4, 'sine', 0.05, 1760);
    },
    lose: function () {
      this.ensure();
      this.beep(200, 0.42, 'sawtooth', 0.07, 52);
      this.beep(90, 0.62, 'square', 0.04, 36);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.14, 'sine', 0.055, 520);
      this.beep(330, 0.2, 'triangle', 0.04, 880);
    },
    tickDrone: function (play, power) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 42;
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
        o.frequency.value = 86;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.taut = o;
        this.tautGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(40 + (play ? 6 : 0), t, 0.16);
      this.droneGain.gain.setTargetAtTime(play ? 0.014 : 0.0001, t, 0.22);
      const pulling = G.pulling && !G.flight;
      this.taut.frequency.setTargetAtTime(70 + power * 240, t, 0.08);
      this.tautGain.gain.setTargetAtTime(pulling ? 0.008 + power * 0.028 : 0.0001, t, 0.06);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 120) particles.shift();
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

  function addRipple(x, y, col, max) {
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: max || 52, t: 1, col: col || 'c' });
  }

  function floatText(x, y, text, col) {
    floaters.push({ x: x, y: y, text: text, t: 1.15, col: col || '#00f0ff' });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 2.5;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * 300,
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.28 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.55 + 0.1
      });
    }
  }

  function makeReeds() {
    reeds.length = 0;
    for (let i = 0; i < 14; i++) {
      reeds.push({
        x: 18 + i * 10 + Math.random() * 6,
        h: 16 + Math.random() * 22,
        ph: Math.random() * TAU,
        near: true
      });
    }
  }

  function pebbleState(angle, power) {
    const spd = speedOf(power);
    return {
      x: TX + 16,
      y: TY,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      skips: 0,
      airborne: 0
    };
  }

  function stepPebble(st, dt, stage, clock) {
    st.vy += GRAV * dt;
    st.vx += (stage.wind || 0) * dt;
    st.x += st.vx * dt;
    st.y += st.vy * dt;
    st.airborne += dt;

    if (st.x < -30 || st.x > WORLD_W + 50 || st.y > WORLD_H + 30 || st.y < -90) {
      return { type: 'out', x: st.x, y: st.y };
    }

    if (st.x + PEBBLE_R >= stage.landX && st.x - PEBBLE_R <= stage.landX + stage.padW &&
        st.y + PEBBLE_R >= BANK_Y && st.vy >= -10) {
      const landAng = Math.atan2(Math.max(0, st.vy), Math.max(30, Math.abs(st.vx)));
      if (landAng > 0.85) return { type: 'steep', x: st.x, y: st.y };
      if (st.skips < stage.minSkip) return { type: 'few', x: st.x, y: st.y };
      return { type: 'land', x: st.x, y: st.y };
    }

    const rocks = stage.rocks;
    if (rocks) {
      for (let i = 0; i < rocks.length; i++) {
        const rk = rocks[i];
        const ry = WATER_Y - rk.r * 0.28;
        if (hypot(st.x - rk.x, st.y - ry) < PEBBLE_R + rk.r * 0.8) {
          return { type: 'rock', x: st.x, y: st.y };
        }
      }
    }

    const logs = stage.logs;
    if (logs) {
      for (let i = 0; i < logs.length; i++) {
        const lg = logs[i];
        const lx = logX(lg, clock);
        const ly = waterYAt(lx, clock, stage) - 3;
        if (st.x > lx - lg.w / 2 - PEBBLE_R && st.x < lx + lg.w / 2 + PEBBLE_R &&
            st.y > ly - lg.h - PEBBLE_R && st.y < ly + 7) {
          return { type: 'log', x: st.x, y: st.y };
        }
      }
    }

    if (overWater(st.x, stage) && st.airborne > 0.03) {
      const wy = waterYAt(st.x, clock, stage);
      if (st.y + PEBBLE_R >= wy && st.vy > 0) {
        const spdNow = hypot(st.vx, st.vy);
        let impact = Math.atan2(st.vy, Math.max(40, Math.abs(st.vx)));
        const wave = stage.wave;
        if (wave) {
          const slope = wave.amp * wave.k * Math.cos(st.x * wave.k + clock * wave.w);
          impact += Math.atan(slope) * 0.5;
        }
        if (impact < SKIP_ANG && spdNow > MIN_SKIP_SPD && st.vx > 32) {
          const q = clamp(1 - impact / SKIP_ANG, 0, 1);
          let bounce = Math.abs(st.vy) * (0.4 + 0.28 * q) + 24 + 34 * q;
          if (bounce > BOUNCE_CAP) bounce = BOUNCE_CAP;
          st.vy = -bounce;
          st.vx *= 0.87 + 0.08 * q;
          st.y = wy - PEBBLE_R - 1;
          st.skips += 1;
          st.airborne = 0;
          if (st.skips > 14) return { type: 'sink', x: st.x, y: st.y };
          return { type: 'skip', x: st.x, y: st.y, q: q };
        }
        return { type: 'sink', x: st.x, y: st.y };
      }
    }
    return null;
  }

  function predict() {
    const dots = [];
    const skips = [];
    let fate = 'air';
    let fateX = 0;
    let fateY = 0;
    if (G.flight) return { dots: dots, skips: skips, fate: fate, fateX: fateX, fateY: fateY };
    const stage = stageOf();
    const st = pebbleState(G.angle, G.power);
    let clock = G.clock;
    const dt = PHYS;
    for (let i = 0; i < 240; i++) {
      const ev = stepPebble(st, dt, stage, clock);
      clock += dt;
      if (i % 5 === 0) dots.push({ x: st.x, y: st.y, a: 1 - i / 240 });
      if (ev) {
        if (ev.type === 'skip') skips.push({ x: ev.x, y: ev.y, q: ev.q });
        else {
          fate = ev.type;
          fateX = ev.x;
          fateY = ev.y;
          break;
        }
      }
    }
    return { dots: dots, skips: skips, fate: fate, fateX: fateX, fateY: fateY };
  }

  function loadStage(index) {
    G.stage = index;
    G.flight = null;
    G.pulling = false;
    pointer.down = false;
    G.lock = 0.38;
    G.clearT = 0;
    G.clock = 0;
    G.angle = G.restAngle;
    G.power = G.restPower;
    canvas.classList.remove('drawing');
    const s = STAGES[index];
    toast(s.toast);
    hintEl.textContent = s.hint;
  }

  function startRun() {
    G.mode = 'play';
    G.lives = LIVES;
    G.shots = 0;
    G.lands = 0;
    G.skips = 0;
    G.best = 0;
    G.restAngle = -0.06;
    G.restPower = 0.48;
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
      ovKicker.textContent = 'SKIP';
      ovTitle.textContent = '打水漂';
      ovLead.innerHTML = '按住瞄准，松手让石子擦着水面连跳，落到对岸金矶。<br />抛得太陡会沉，太猛会跳过头。';
      ovOps.textContent = '拖动画布瞄准松手 · W/S 调角 · A/D 力度 · 空格抛出 · M 静音';
      ovBtn.textContent = '抛石';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'CLEAR';
      ovTitle.textContent = '岸到';
      ovLead.textContent = '十矶都跳上了。石子还在亮。';
      ovOps.textContent = '上岸 ' + G.lands + ' · 连跳 ' + G.skips + ' · 最多 ' + G.best + ' 跳 · 出手 ' + G.shots;
      ovBtn.textContent = '再抛一次';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'SUNK';
      ovTitle.textContent = '沉底';
      ovLead.textContent = '石子用尽。河还在亮。';
      ovOps.textContent = STAGES[G.stage].name + ' · 上岸 ' + G.lands + ' · 连跳 ' + G.skips;
      ovBtn.textContent = '再抛一次';
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

  function setAimFromPointer(wx, wy) {
    let dx = wx - TX;
    let dy = wy - TY;
    if (dx < 10) dx = 10;
    G.angle = clamp(Math.atan2(dy, dx), ANG_MIN, ANG_MAX);
    G.power = clamp(hypot(Math.max(dx, 0), dy) / MAX_PULL, 0, 1);
  }

  function beginPull(wx, wy) {
    if (G.mode !== 'play' || G.flight || G.lock > 0) return;
    G.pulling = true;
    setAimFromPointer(wx, wy);
    canvas.classList.add('drawing');
    audio.ensure();
  }

  function movePull(wx, wy) {
    if (!G.pulling || G.flight) return;
    setAimFromPointer(wx, wy);
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

  function fire(isDemo) {
    if (!isDemo && (G.mode !== 'play' || G.flight || G.lock > 0)) return;
    if (!isDemo && G.power < MIN_FIRE) {
      audio.deny();
      return;
    }
    const st = pebbleState(G.angle, G.power);
    G.flight = {
      x: st.x,
      y: st.y,
      vx: st.vx,
      vy: st.vy,
      skips: 0,
      airborne: 0,
      trail: [],
      age: 0,
      spin: 0,
      demo: !!isDemo
    };
    if (!isDemo) {
      G.restAngle = G.angle;
      G.restPower = G.power;
      G.shots += 1;
      audio.throw(G.power);
    }
    G.pulling = false;
    canvas.classList.remove('drawing');
    emit(8, {
      x: st.x, y: st.y, j: 3,
      vx0: st.vx * 0.02, vx1: st.vx * 0.08,
      vy0: st.vy * 0.02, vy1: st.vy * 0.08,
      life: 0.26, r0: 1, r1: 2.6, col: 'c'
    });
  }

  function missAt(x, y, why) {
    const demo = G.flight && G.flight.demo;
    G.flight = null;
    G.shake = why === 'rock' || why === 'log' ? 7 : 5;
    G.flash = 0.3;
    G.flashCol = '#ff3db8';
    addRipple(x, y, 'm', 44);
    emit(20, {
      x: x, y: y, j: 7,
      vx0: -160, vx1: 160, vy0: -200, vy1: 30,
      life: 0.5, r0: 1.1, r1: 3.6, col: 'm'
    });
    if (demo || G.mode === 'clear' || G.mode === 'win') return;
    if (why === 'rock' || why === 'log') audio.smash();
    else audio.sink();
    G.lives -= 1;
    G.lock = 0.55;
    G.angle = G.restAngle;
    G.power = G.restPower;
    if (why === 'rock') toast('撞石', 'warn');
    else if (why === 'log') toast('撞木', 'warn');
    else if (why === 'few') toast('跳数不够，要擦着水跳', 'warn');
    else if (why === 'steep') toast('落得太陡', 'warn');
    else if (why === 'out') toast('跳过头了', 'warn');
    else toast('沉底了', 'warn');
    if (G.lives <= 0) {
      G.mode = 'lose';
      audio.lose();
      showOverlay('lose');
    }
  }

  function landAt(x, y, skips) {
    const demo = G.flight && G.flight.demo;
    G.flight = null;
    addRipple(x, y, 'g', 70);
    emit(demo ? 12 : 26, {
      x: x, y: y, j: 8,
      vx0: -120, vx1: 120, vy0: -180, vy1: 20,
      life: 0.6, r0: 1.3, r1: 4, col: 'g'
    });
    if (demo) return;
    G.lands += 1;
    G.skips += skips;
    if (skips > G.best) G.best = skips;
    G.shake = 3;
    G.flash = 0.34;
    G.flashCol = '#ffe36b';
    audio.land(skips);
    const word = SKIP_CN[skips] || (skips + '跳');
    toast(word + ' · 上岸', 'gold');
    floatText(x, y - 18, '上岸', '#ffe36b');
    G.mode = 'clear';
    G.clearT = 0.92;
    G.lock = 1;
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

  function onSkip(x, y, q, n) {
    G.flash = 0.16;
    G.flashCol = q > 0.62 ? '#ffe36b' : '#00f0ff';
    addRipple(x, y, q > 0.62 ? 'g' : 'c', 36 + q * 28);
    emit(10 + (q * 8 | 0), {
      x: x, y: y, j: 5,
      vx0: -90, vx1: 140, vy0: -160, vy1: -10,
      life: 0.38, r0: 1, r1: 3.2, col: q > 0.62 ? 'g' : 'c'
    });
    spray.push({ x: x, y: y, t: 0.45, q: q });
    const word = SKIP_CN[n] || (n + '跳');
    floatText(x, y - 16, word, q > 0.62 ? '#ffe36b' : '#00f0ff');
    if (!(G.flight && G.flight.demo)) audio.skip(n, q);
  }

  function updateFlight(dt) {
    const f = G.flight;
    if (!f) return;
    const stage = stageOf();
    const n = dt > 0.03 ? 3 : 2;
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      if (!G.flight) return;
      const st = {
        x: f.x, y: f.y, vx: f.vx, vy: f.vy,
        skips: f.skips, airborne: f.airborne
      };
      const ev = stepPebble(st, h, stage, G.clock + h * i);
      f.x = st.x;
      f.y = st.y;
      f.vx = st.vx;
      f.vy = st.vy;
      f.skips = st.skips;
      f.airborne = st.airborne;
      f.spin += dt * 10;
      f.age += h;
      f.trail.push({ x: f.x, y: f.y });
      if (f.trail.length > 18) f.trail.shift();
      if (!ev) continue;
      if (ev.type === 'skip') {
        onSkip(ev.x, ev.y, ev.q, f.skips);
        continue;
      }
      if (ev.type === 'land') {
        landAt(ev.x, ev.y, f.skips);
        return;
      }
      missAt(ev.x, ev.y, ev.type);
      return;
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.55;
      r.r += (r.max - r.r) * 5.5 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = spray.length - 1; i >= 0; i--) {
      spray[i].t -= dt;
      if (spray[i].t <= 0) spray.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      floaters[i].t -= dt;
      floaters[i].y -= 22 * dt;
      if (floaters[i].t <= 0) floaters.splice(i, 1);
    }
    G.shake = Math.max(0, G.shake - dt * 16);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    if (!G.pulling && !G.flight && G.mode === 'play') {
      const turn = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
      const pow = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      if (turn) {
        G.angle = clamp(G.angle + turn * 1.15 * dt, ANG_MIN, ANG_MAX);
        G.restAngle = G.angle;
      }
      if (pow) {
        G.power = clamp(G.power + pow * 0.7 * dt, 0.12, 1);
        G.restPower = G.power;
      }
    }
    if (G.flight) updateFlight(dt);
    if (G.mode === 'clear') {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    G.demoT -= dt;
    if (!G.flight && G.demoT <= 0) {
      G.angle = -0.08 + Math.sin(G.t * 0.4) * 0.04;
      G.power = 0.5 + Math.sin(G.t * 0.33) * 0.06;
      fire(true);
      G.demoT = 3.2;
    }
    if (G.flight) updateFlight(dt);
    G.angle = -0.06 + Math.sin(G.t * 0.55) * 0.05;
    G.power = 0.48 + Math.sin(G.t * 0.7) * 0.05;
  }

  function syncHud(force) {
    const pulling = G.pulling || (!G.flight && G.mode === 'play');
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + (G.power * 20 | 0) + ':' +
      (G.angle * 20 | 0) + ':' + (pulling ? 1 : 0) + ':' + (G.flight ? (G.flight.skips | 0) : 0);
    if (!force && key === G.hud) return;
    G.hud = key;
    if (G.mode === 'title') {
      stageLabel.textContent = '十矶';
      powerLabel.textContent = '擦水连跳';
      powerLabel.classList.remove('warn');
    } else {
      const s = STAGES[G.stage];
      stageLabel.textContent = '关卡 ' + (G.stage + 1) + '/' + STAGES.length + ' · ' + s.name + ' ' + s.sub;
      if (G.flight) {
        const n = G.flight.skips;
        powerLabel.textContent = (SKIP_CN[n] || '飞行') + (n ? '' : ' · 出手');
      } else {
        const deg = Math.round(-G.angle * 180 / Math.PI);
        powerLabel.textContent = '力度 ' + Math.round(G.power * 100) + ' · ' + (deg >= 0 ? '仰' : '俯') + Math.abs(deg) + '°';
      }
      powerLabel.classList.toggle('warn', G.lives === 1);
    }
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? ' on warn' : ' on') : '') + '"></i>';
    }
    pipsEl.innerHTML = html;
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
    ctx.arcTo(x, y, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    g.addColorStop(0, '#07041a');
    g.addColorStop(0.45, '#080616');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    const mag = ctx.createRadialGradient(80, -20, 10, 80, 40, 340);
    mag.addColorStop(0, 'rgba(255, 61, 184, 0.16)');
    mag.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    const cyn = ctx.createRadialGradient(880, 40, 10, 880, 80, 300);
    cyn.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    cyn.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = cyn;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.save();
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const tw = 0.55 + 0.45 * Math.sin(G.t * m.s + m.p);
      ctx.globalAlpha = m.a * tw;
      ctx.fillStyle = i % 7 === 0 ? '#ff3db8' : '#c8f8ff';
      ctx.beginPath();
      ctx.arc(m.x, m.y + Math.sin(G.t * 0.3 + m.p) * 2, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    const mx = 838;
    const my = 72;
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 28;
    ctx.fillStyle = '#d8fbff';
    ctx.beginPath();
    ctx.arc(mx, my, 22, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(mx + 8, my - 4, 18, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(mx, my, 22, 0.4, 2.4);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(18, 10, 40, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, 268);
    ctx.quadraticCurveTo(160, 232, 340, 258);
    ctx.quadraticCurveTo(520, 286, 700, 248);
    ctx.quadraticCurveTo(850, 228, 960, 260);
    ctx.lineTo(960, 380);
    ctx.lineTo(0, 380);
    ctx.fill();
    ctx.restore();
  }

  function drawWater(stage) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, WORLD_H);
    ctx.lineTo(0, WATER_Y + 8);
    const step = 8;
    for (let x = 0; x <= WORLD_W; x += step) {
      ctx.lineTo(x, waterYAt(x, G.clock, stage));
    }
    ctx.lineTo(WORLD_W, WORLD_H);
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, WATER_Y - 10, 0, WORLD_H);
    wg.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
    wg.addColorStop(0.18, 'rgba(12, 24, 64, 0.72)');
    wg.addColorStop(1, 'rgba(4, 2, 14, 0.96)');
    ctx.fillStyle = wg;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 5; i++) {
      const y = WATER_Y + 18 + i * 22;
      ctx.strokeStyle = i % 2 ? 'rgba(255, 61, 184, 0.55)' : 'rgba(0, 240, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= WORLD_W; x += 10) {
        const yy = y + Math.sin(x * 0.02 + G.clock * (1.2 + i * 0.15) + i) * 4;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(838, WATER_Y + 86, 34, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_W; x += 6) {
      const y = waterYAt(x, G.clock, stage);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawBanks(stage) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 318);
    ctx.lineTo(NEAR_X - 36, 326);
    ctx.quadraticCurveTo(NEAR_X - 8, 332, NEAR_X, WATER_Y + 4);
    ctx.lineTo(NEAR_X - 4, WORLD_H);
    ctx.lineTo(0, WORLD_H);
    ctx.closePath();
    ctx.fillStyle = '#12081c';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.strokeStyle = '#ff3db8';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    for (let i = 0; i < reeds.length; i++) {
      const r = reeds[i];
      const sway = Math.sin(G.t * 1.6 + r.ph) * 3.2;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(r.x, 336);
      ctx.quadraticCurveTo(r.x + sway * 0.4, 336 - r.h * 0.5, r.x + sway, 336 - r.h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const x0 = stage.landX;
    const x1 = stage.landX + stage.padW;
    ctx.beginPath();
    ctx.moveTo(x0, BANK_Y);
    ctx.lineTo(x1, BANK_Y);
    ctx.lineTo(x1 + 10, WORLD_H);
    ctx.lineTo(x0 - 8, WORLD_H);
    ctx.closePath();
    const pg = ctx.createLinearGradient(x0, BANK_Y, x0, WORLD_H);
    pg.addColorStop(0, '#2a1a10');
    pg.addColorStop(1, '#0c0814');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.shadowColor = '#ffe36b';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, BANK_Y);
    ctx.lineTo(x1, BANK_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.35)';
    ctx.setLineDash([6, 7]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x0 + 8, BANK_Y + 7);
    ctx.lineTo(x1 - 8, BANK_Y + 7);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 227, 107, 0.12)';
    ctx.fillRect(x0, BANK_Y, x1 - x0, 10);

    const lx = x1 - 16;
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(lx - 2, BANK_Y - 38, 4, 38);
    ctx.shadowColor = '#ffe36b';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(lx, BANK_Y - 42, 4.2, 0, TAU);
    ctx.fill();
    const flicker = 0.55 + 0.45 * Math.sin(G.t * 7);
    ctx.globalAlpha = 0.28 * flicker;
    ctx.beginPath();
    ctx.arc(lx, BANK_Y - 42, 14, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const rx = x0 + 12 + i * ((stage.padW - 24) / 6);
      const sway = Math.sin(G.t * 1.5 + i) * 2.4;
      ctx.beginPath();
      ctx.moveTo(rx, BANK_Y);
      ctx.quadraticCurveTo(rx + sway, BANK_Y - 10, rx + sway * 1.4, BANK_Y - 18 - (i % 3) * 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRocks(stage) {
    const rocks = stage.rocks;
    if (!rocks) return;
    for (let i = 0; i < rocks.length; i++) {
      const rk = rocks[i];
      const cy = WATER_Y - rk.r * 0.28;
      ctx.save();
      ctx.translate(rk.x, cy);
      ctx.beginPath();
      ctx.moveTo(-rk.r, rk.r * 0.5);
      ctx.lineTo(-rk.r * 0.55, -rk.r * 0.85);
      ctx.lineTo(rk.r * 0.15, -rk.r * 1.05);
      ctx.lineTo(rk.r * 0.9, -rk.r * 0.2);
      ctx.lineTo(rk.r * 0.7, rk.r * 0.7);
      ctx.closePath();
      ctx.fillStyle = '#161022';
      ctx.fill();
      ctx.shadowColor = '#ff3db8';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ff3db8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawLogs(stage) {
    const logs = stage.logs;
    if (!logs) return;
    for (let i = 0; i < logs.length; i++) {
      const lg = logs[i];
      const lx = logX(lg, G.clock);
      const ly = waterYAt(lx, G.clock, stage) - 3;
      ctx.save();
      ctx.translate(lx, ly - lg.h * 0.3);
      ctx.rotate(Math.sin(G.clock * lg.spd + lg.phase) * 0.08);
      roundRect(-lg.w / 2, -lg.h / 2, lg.w, lg.h, 5);
      ctx.fillStyle = '#2a1810';
      ctx.fill();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
      ctx.beginPath();
      ctx.moveTo(-lg.w * 0.28, -2);
      ctx.lineTo(-lg.w * 0.1, 2);
      ctx.moveTo(lg.w * 0.12, -2);
      ctx.lineTo(lg.w * 0.3, 1);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawThrower() {
    const ang = G.flight ? G.restAngle : G.angle;
    ctx.save();
    ctx.translate(TX - 22, TY + 10);
    ctx.fillStyle = '#1a1028';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -16, 6.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.lineTo(7, -8);
    ctx.lineTo(5, 16);
    ctx.lineTo(-6, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const hx = TX + 16;
    const hy = TY;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(TX - 14, TY - 4);
    ctx.lineTo(hx - 4, hy);
    ctx.stroke();
    ctx.restore();

    if (!G.flight) {
      const taut = G.pulling ? G.power : 0.2;
      ctx.save();
      ctx.strokeStyle = taut > 0.7 ? '#ff3db8' : '#00f0ff';
      ctx.globalAlpha = 0.35 + taut * 0.4;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(hx, hy, 11 + taut * 10, 0, TAU);
      ctx.stroke();
      ctx.restore();
      drawPebble(hx, hy, G.t * 0.8, 1);
    }
  }

  function drawPebble(x, y, spin, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.globalAlpha = a;
    ctx.shadowColor = '#ffe36b';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#c4b39a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.2, 4.6, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 227, 107, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-2, -1.4, 1.8, 1.1, 0.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawAim(pred) {
    if (G.flight || (G.mode !== 'play' && G.mode !== 'title')) return;
    const fateCol = pred.fate === 'land' ? '#ffe36b' : (pred.fate === 'air' ? '#00f0ff' : '#ff3db8');
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < pred.dots.length; i++) {
      const d = pred.dots[i];
      ctx.globalAlpha = d.a * 0.75;
      ctx.fillStyle = fateCol;
      ctx.beginPath();
      ctx.arc(d.x, d.y, i % 4 === 0 ? 2.4 : 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < pred.skips.length; i++) {
      const s = pred.skips[i];
      glowDot(s.x, s.y, 3.2, s.q > 0.55 ? '#ffe36b' : '#00f0ff', 0.85);
    }
    if (pred.fate !== 'air') {
      glowDot(pred.fateX, pred.fateY, 4, fateCol, 0.7);
    }

    const hx = TX + 16;
    const hy = TY;
    const spd = speedOf(G.power);
    const ax = hx + Math.cos(G.angle) * (28 + G.power * 36);
    const ay = hy + Math.sin(G.angle) * (28 + G.power * 36);
    ctx.save();
    ctx.strokeStyle = G.power > 0.78 ? '#ff3db8' : '#00f0ff';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlight() {
    const f = G.flight;
    if (!f) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    for (let i = 0; i < f.trail.length; i++) {
      const p = f.trail[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
    if (f.y < WATER_Y + 8) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.ellipse(f.x, waterYAt(f.x, G.clock, stageOf()) + 8, 8, 2.4, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    drawPebble(f.x, f.y, f.spin, 1);
  }

  function drawRipples() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.t) * 0.8;
      ctx.strokeStyle = colOf(r.col);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y + 2, r.r, r.r * 0.28, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < spray.length; i++) {
      const s = spray[i];
      const k = s.t / 0.45;
      ctx.save();
      ctx.globalAlpha = k * 0.5;
      ctx.strokeStyle = '#e8faff';
      ctx.lineWidth = 1;
      for (let j = 0; j < 5; j++) {
        const a = -1.2 + j * 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + Math.cos(a) * (10 + (1 - k) * 16), s.y + Math.sin(a) * (8 + (1 - k) * 12));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      glowDot(p.x, p.y, p.r, colOf(p.col), Math.max(0, p.life / p.max));
    }
  }

  function drawFloaters() {
    ctx.save();
    ctx.font = '700 13px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      ctx.globalAlpha = Math.max(0, f.t);
      ctx.fillStyle = f.col;
      ctx.shadowColor = f.col;
      ctx.shadowBlur = 10;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawWind(stage) {
    if (!stage.wind) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const y = 90 + i * 28;
      const x = (G.t * 80 + i * 70) % (WORLD_W + 80) - 40;
      const dir = stage.wind < 0 ? -1 : 1;
      const px = stage.wind < 0 ? WORLD_W - x : x;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.bezierCurveTo(px + dir * 18, y - 4, px + dir * 28, y + 4, px + dir * 46, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHudChrome(stage) {
    if (G.mode === 'title') return;
    ctx.save();
    ctx.font = '700 11px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(255, 227, 107, 0.85)';
    ctx.textAlign = 'right';
    ctx.fillText('需 ' + stage.minSkip + ' 跳', stage.landX + stage.padW - 8, BANK_Y - 10);
    if (stage.wind) {
      ctx.fillStyle = 'rgba(255, 61, 184, 0.85)';
      ctx.textAlign = 'left';
      ctx.fillText('逆风', NEAR_X + 12, 48);
    }
    ctx.restore();
  }

  function draw() {
    const stage = stageOf();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.save();
    let sx = 0;
    let sy = 0;
    if (G.shake > 0.2) {
      sx = rand(-G.shake, G.shake);
      sy = rand(-G.shake, G.shake);
    }
    ctx.translate(view.ox + sx, view.oy + sy);
    ctx.scale(view.scale, view.scale);

    drawSky();
    drawWind(stage);
    drawWater(stage);
    drawBanks(stage);
    drawRocks(stage);
    drawLogs(stage);
    const pred = predict();
    drawAim(pred);
    drawThrower();
    drawFlight();
    drawRipples();
    drawParticles();
    drawFloaters();
    drawHudChrome(stage);

    if (G.flash > 0) {
      ctx.fillStyle = G.flashCol;
      ctx.globalAlpha = G.flash * 0.16;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function fit() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    view.dpr = dpr;
    canvas.width = (view.w * dpr) | 0;
    canvas.height = (view.h * dpr) | 0;
    const s = Math.min(view.w / WORLD_W, view.h / WORLD_H);
    view.scale = s;
    view.ox = (view.w - WORLD_W * s) * 0.5;
    view.oy = (view.h - WORLD_H * s) * 0.5;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: (x - view.ox) / view.scale,
      y: (y - view.oy) / view.scale
    };
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (G.paused) {
      draw();
      return;
    }
    acc += dt;
    G.t += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') updateTitle(STEP);
      else updatePlay(STEP);
      updateFx(STEP);
      acc -= STEP;
      steps += 1;
    }
    audio.tickDrone(G.mode === 'play' || G.mode === 'title', G.power);
    syncHud(false);
    draw();
  }

  function bind() {
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    canvas.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      if (G.mode !== 'play') return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      pointer.down = true;
      pointer.id = e.pointerId;
      const w = worldFromEvent(e);
      beginPull(w.x, w.y);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || pointer.id !== e.pointerId) return;
      const w = worldFromEvent(e);
      movePull(w.x, w.y);
    });
    function ptrUp(e) {
      if (pointer.id != null && e.pointerId !== pointer.id) return;
      pointer.down = false;
      pointer.id = null;
      endPull();
    }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', ptrUp);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    window.addEventListener('keydown', function (e) {
      const k = e.key;
      if (k === 'm' || k === 'M') {
        audio.ensure();
        audio.setMuted(!audio.muted);
        e.preventDefault();
        return;
      }
      if (k === 'r' || k === 'R') {
        if (G.mode !== 'title') retry();
        e.preventDefault();
        return;
      }
      if (k === ' ' || k === 'Enter') {
        e.preventDefault();
        if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
          onMain();
          return;
        }
        if (G.mode === 'play' && !G.flight && G.lock <= 0 && !e.repeat) fire();
        return;
      }
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = true;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = true;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = true;
      if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = true;
      if (k.slice(0, 5) === 'Arrow' || k === ' ') e.preventDefault();
    });
    window.addEventListener('keyup', function (e) {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = false;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = false;
      if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = false;
    });

    ovBtn.addEventListener('click', onMain);
    btnRetry.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'title') onMain();
      else retry();
    });
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });

    document.addEventListener('visibilitychange', function () {
      G.paused = document.hidden;
      if (document.hidden) {
        keys.l = keys.r = keys.u = keys.d = false;
        if (G.pulling) endPull();
      } else last = 0;
    });
  }

  makeMotes();
  makeReeds();
  fit();
  bind();
  showOverlay('title');
  syncHud(true);
  requestAnimationFrame(frame);
})();
