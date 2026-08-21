'use strict';

(function () {
  const WORLD_W = 560;
  const WORLD_H = 920;
  const SURFACE = 102;
  const FLOOR = 882;
  const PLAYER_R = 12;
  const PEARL_R = 10.5;
  const SPEED = 198;
  const DRAG = 4.4;
  const O2_MAX = 18.4;
  const FULL_UNTIL = 0.74;
  const PEARL_N = 6;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;

  const PEARLS = [
    { x: 128, y: 248, z: 0 },
    { x: 438, y: 286, z: 0 },
    { x: 86, y: 468, z: 1 },
    { x: 478, y: 522, z: 1 },
    { x: 168, y: 738, z: 2 },
    { x: 404, y: 806, z: 2 }
  ];

  const JELLIES = [
    { x: 188, y: 356, amp: 42, spd: 0.7, phase: 0.2, r: 20 },
    { x: 64, y: 596, amp: 50, spd: 0.52, phase: 1.4, r: 21 },
    { x: 508, y: 668, amp: 36, spd: 0.8, phase: 2.5, r: 18 }
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
  const lootLabel = document.getElementById('loot-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let camX = 0;
  let camY = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, id: null, x: 280, y: 120 };

  const particles = [];
  const bubbles = [];
  const motes = [];
  const stars = [];
  const kelp = [];
  const rocks = [];
  const fish = [];
  const pips = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    o2: O2_MAX,
    wet: false,
    shake: 0,
    flash: 0,
    cyanFlash: 0,
    lock: 0,
    why: '',
    dieT: 0,
    toastT: 0,
    warned: false,
    taught: false,
    tideTaught: false,
    hitT: 0,
    kick: 0,
    ang: 0.2,
    vx: 0,
    vy: 0,
    player: { x: 280, y: 88 },
    pearls: [],
    jellies: [],
    got: 0,
    lost: 0,
    doom: 0,
    raftX: 280
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
  function waveAt(x, t) {
    return SURFACE
      + Math.sin(x * 0.021 + t * 2.15) * 3.6
      + Math.sin(x * 0.047 + t * 1.35 + 1.2) * 2.1;
  }
  function limitY(o2) {
    const k = clamp(o2 / O2_MAX, 0, 1);
    if (k >= FULL_UNTIL) return FLOOR + 26;
    return SURFACE + 18 + (FLOOR - SURFACE - 18) * (k / FULL_UNTIL);
  }
  function sx(x) {
    return (x - camX) * scale;
  }
  function sy(y) {
    return (y - camY) * scale;
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastWarn: -9,
    lastBeat: -9,
    ensure() {
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
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.26;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem('hold-breath-mute', m ? '1' : '0');
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
    dive() {
      this.ensure();
      this.beep(420, 0.28, 'sine', 0.07, 140);
      this.beep(180, 0.4, 'triangle', 0.05, 70);
    },
    pearl() {
      this.ensure();
      this.beep(740, 0.12, 'sine', 0.09, 1180);
      this.beep(1180, 0.22, 'triangle', 0.05, 1760);
    },
    sting() {
      this.ensure();
      this.beep(210, 0.18, 'square', 0.05, 90);
      this.beep(90, 0.28, 'sawtooth', 0.04, 50);
    },
    warn() {
      this.ensure();
      this.beep(180, 0.12, 'square', 0.035, 110);
    },
    beat() {
      this.ensure();
      this.beep(70, 0.08, 'sine', 0.05, 50);
    },
    tide() {
      this.ensure();
      this.beep(90, 0.4, 'sine', 0.06, 40);
    },
    splash() {
      this.ensure();
      this.beep(520, 0.16, 'sine', 0.05, 220);
      this.beep(240, 0.2, 'triangle', 0.04, 90);
    },
    win() {
      this.ensure();
      this.beep(392, 0.16, 'triangle', 0.09, 784);
      this.beep(523, 0.22, 'sine', 0.07, 1046);
      this.beep(784, 0.4, 'sine', 0.05, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.4, 'sawtooth', 0.08, 70);
      this.beep(80, 0.7, 'sine', 0.05, 36);
    },
    start() {
      this.ensure();
      this.beep(260, 0.18, 'sine', 0.07, 520);
    },
    tickDrone(o2, wet) {
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
      const low = o2 < 5;
      const on = G.mode === 'play' && wet;
      this.drone.frequency.setTargetAtTime(low ? 42 : 54, t, 0.12);
      this.droneGain.gain.setTargetAtTime(on ? (low ? 0.048 : 0.02) : 0.0001, t, 0.18);
    },
    stopDrone() {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.22);
    }
  };

  try {
    if (localStorage.getItem('hold-breath-mute') === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  function buildPips() {
    pipsEl.innerHTML = '';
    pips.length = 0;
    for (let i = 0; i < PEARL_N; i++) {
      const s = document.createElement('span');
      s.className = 'pip';
      pipsEl.appendChild(s);
      pips.push(s);
    }
  }

  function makeDecor() {
    stars.length = 0;
    for (let i = 0; i < 42; i++) {
      stars.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * (SURFACE - 18),
        r: Math.random() * 1.3 + 0.3,
        a: Math.random() * 0.55 + 0.2,
        p: Math.random() * TAU
      });
    }
    motes.length = 0;
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: SURFACE + Math.random() * (FLOOR - SURFACE),
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.22 + 0.04,
        s: Math.random() * 10 + 4,
        p: Math.random() * TAU
      });
    }
    kelp.length = 0;
    const spots = [36, 70, 108, 452, 494, 530];
    for (let i = 0; i < spots.length; i++) {
      kelp.push({
        x: spots[i] + rand(-8, 8),
        h: rand(70, 160) + (i < 6 ? 40 : 0),
        p: rand(0, TAU),
        w: rand(5, 9)
      });
    }
    rocks.length = 0;
    for (let i = 0; i < 14; i++) {
      rocks.push({
        x: 24 + i * 38 + rand(-10, 10),
        y: FLOOR + rand(4, 18),
        r: rand(16, 34),
        k: Math.random()
      });
    }
    fish.length = 0;
    for (let i = 0; i < 9; i++) {
      fish.push({
        x: rand(40, WORLD_W - 40),
        y: rand(SURFACE + 80, FLOOR - 80),
        s: rand(16, 34) * (Math.random() < 0.5 ? 1 : -1),
        p: rand(0, TAU),
        a: rand(0.08, 0.2)
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 96) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: spec.mag || false,
        gold: spec.gold || false
      });
    }
  }

  function bubble(x, y, n) {
    for (let i = 0; i < n; i++) {
      if (bubbles.length > 52) bubbles.shift();
      bubbles.push({
        x: x + rand(-6, 6),
        y: y + rand(-4, 4),
        vx: rand(-10, 10),
        vy: rand(-48, -18),
        r: rand(1.1, 3.2),
        life: rand(0.45, 1.4)
      });
    }
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.remove('hidden');
    G.toastT = 2.4;
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
    scale = Math.min(W / WORLD_W, H / 520);
    if (scale < 0.25) scale = 0.25;
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: camX + ((e.clientX - rect.left) / rect.width) * (W / scale),
      y: camY + ((e.clientY - rect.top) / rect.height) * (H / scale)
    };
  }

  function resetRun() {
    G.t = 0;
    G.o2 = O2_MAX;
    G.wet = false;
    G.shake = 0;
    G.flash = 0;
    G.cyanFlash = 0;
    G.lock = 0.32;
    G.why = '';
    G.dieT = 0;
    G.warned = false;
    G.taught = false;
    G.tideTaught = false;
    G.hitT = 0;
    G.kick = 0;
    G.ang = 0.35;
    G.vx = 0;
    G.vy = 0;
    G.got = 0;
    G.lost = 0;
    G.doom = 0;
    G.player.x = 280;
    G.player.y = 86;
    G.raftX = 280;
    G.pearls = PEARLS.map(function (p) {
      return { x: p.x, y: p.y, z: p.z, state: 'live', bob: rand(0, TAU) };
    });
    G.jellies = JELLIES.map(function (j) {
      return {
        x: j.x,
        y: j.y,
        y0: j.y,
        amp: j.amp,
        spd: j.spd,
        phase: j.phase,
        r: j.r
      };
    });
    particles.length = 0;
    bubbles.length = 0;
    makeDecor();
    pointer.down = false;
    pointer.id = null;
    keys.l = keys.r = keys.u = keys.d = false;
    o2Wrap.classList.remove('warn');
    lootLabel.classList.remove('ready');
    syncHud();
  }

  function showPanel(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'BREATH';
      ovTitle.textContent = '闭气';
      ovLead.innerHTML = '一口空气潜下去捡夜珠。<br />气越少，黑潮涨得越高，深处就去不了。';
      ovOps.textContent = 'WASD / 方向键游动 · 按住屏幕游向手指 · M 静音';
      ovBtn.textContent = '闭气下潜';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'SURFACED';
      ovTitle.textContent = '浮出';
      ovLead.textContent = '六颗夜珠入手，破水换气。';
      ovOps.textContent = '余气 ' + Math.max(0, G.o2).toFixed(1) + ' · 闭气 ' + G.t.toFixed(1) + ' 秒';
      ovBtn.textContent = '再闭一次';
    } else {
      panel.classList.add('lose');
      if (G.why === 'tide') {
        ovKicker.textContent = 'SWALLOWED';
        ovTitle.textContent = '珠沉';
        ovLead.textContent = '黑潮吞掉了剩下的夜珠。气少就潜不深。';
      } else {
        ovKicker.textContent = 'BLACKOUT';
        ovTitle.textContent = '眼前发黑';
        ovLead.textContent = '气尽于水下，湾底只剩气泡。';
      }
      ovOps.textContent = '夜珠 ' + G.got + '/6 · 闭气 ' + G.t.toFixed(1) + ' 秒';
      ovBtn.textContent = '再闭一次';
    }
  }

  function startPlay() {
    audio.start();
    resetRun();
    G.mode = 'play';
    overlay.classList.add('hidden');
    hintEl.textContent = '先潜最深 · 气少黑潮会涨 · 捡齐再浮出';
    toast('先潜最深，气少深处会封');
  }

  function endGame(win, why) {
    if (G.mode !== 'play') return;
    G.why = why || '';
    if (win) {
      G.mode = 'surfacing';
      G.dieT = 0.78;
      toastEl.classList.add('hidden');
      G.toastT = 0;
      audio.win();
      audio.splash();
      emit(36, {
        x: G.player.x,
        y: SURFACE,
        j: 22,
        vx0: -90,
        vx1: 90,
        vy0: -70,
        vy1: 20,
        life: 0.95,
        r0: 1.4,
        r1: 4.4,
        gold: true
      });
      bubble(G.player.x, SURFACE + 8, 14);
    } else {
      G.mode = 'dying';
      G.dieT = 0.7;
      G.flash = 1;
      G.shake = 10;
      toastEl.classList.add('hidden');
      G.toastT = 0;
      audio.lose();
      emit(28, {
        x: G.player.x,
        y: G.player.y,
        j: 10,
        vx0: -80,
        vx1: 80,
        vy0: -40,
        vy1: 90,
        life: 0.8,
        r0: 1.3,
        r1: 4,
        mag: true
      });
      bubble(G.player.x, G.player.y, 12);
    }
    audio.stopDrone();
  }

  function wishDir() {
    let x = 0;
    let y = 0;
    if (pointer.down && G.lock <= 0) {
      x = pointer.x - G.player.x;
      y = pointer.y - G.player.y;
      const d = hypot(x, y);
      if (d < 10) return { x: 0, y: 0 };
      return { x: x / d, y: y / d };
    }
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    if (keys.u) y -= 1;
    if (keys.d) y += 1;
    const d = hypot(x, y);
    if (d < 0.01) return { x: 0, y: 0 };
    return { x: x / d, y: y / d };
  }

  function updateCam(dt) {
    const visW = W / scale;
    const visH = H / scale;
    const tx = G.player.x - visW * 0.5;
    const ty = G.player.y - visH * 0.4;
    const minX = Math.min(0, WORLD_W - visW);
    const maxX = Math.max(0, WORLD_W - visW);
    const minY = -28;
    const maxY = Math.max(minY, WORLD_H - visH + 18);
    const ax = clamp(tx, minX, maxX);
    const ay = clamp(ty, minY, maxY);
    const k = 1 - Math.pow(0.0008, dt);
    camX = lerp(camX, ax, k);
    camY = lerp(camY, ay, k);
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.3);
    if (G.cyanFlash > 0) G.cyanFlash = Math.max(0, G.cyanFlash - dt * 3.1);
    if (G.lock > 0) G.lock -= dt;
    if (G.hitT > 0) G.hitT -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += (q.gold ? 18 : 22) * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    if (Math.random() < dt * 2.2) {
      bubble(camX + rand(20, W / scale + 20), camY + rand(SURFACE + 30, H / scale), 1);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const q = bubbles[i];
      q.life -= dt;
      q.x += q.vx * dt + Math.sin(G.clock * 3 + q.y) * 8 * dt;
      q.y += q.vy * dt;
      if (q.life <= 0 || q.y < SURFACE - 6) bubbles.splice(i, 1);
    }
  }

  function syncHud() {
    const pct = clamp(G.mode === 'title' ? 1 : G.o2 / O2_MAX, 0, 1);
    o2Fill.style.transform = 'scaleX(' + pct + ')';
    o2Num.textContent = String(Math.ceil(pct * 100));
    lootLabel.textContent = '夜珠 ' + G.got + '/' + PEARL_N;
    lootLabel.classList.toggle('ready', G.got === PEARL_N);
    for (let i = 0; i < pips.length; i++) {
      const pearl = G.pearls[i];
      pips[i].classList.toggle('on', pearl && pearl.state === 'got');
      pips[i].classList.toggle('gone', pearl && pearl.state === 'lost');
    }
    if (G.o2 / O2_MAX < 0.28 && G.wet) o2Wrap.classList.add('warn');
    else o2Wrap.classList.remove('warn');
  }

  function collectPearl(p) {
    p.state = 'got';
    G.got += 1;
    G.cyanFlash = 0.34;
    audio.pearl();
    emit(18, {
      x: p.x,
      y: p.y,
      j: 8,
      vx0: -70,
      vx1: 70,
      vy0: -90,
      vy1: 40,
      life: 0.55,
      r0: 1.2,
      r1: 3.4,
      gold: true
    });
    bubble(p.x, p.y, 6);
    if (G.got === PEARL_N) {
      toast('珠齐 · 快浮出水面');
      hintEl.textContent = '珠齐了 · 游回月下换气';
    } else {
      toast('夜珠 ' + G.got + '/' + PEARL_N);
    }
  }

  function updateDemo(dt) {
    G.player.x = 280 + Math.sin(G.clock * 0.55) * 18;
    G.player.y = waveAt(G.player.x, G.clock) - 14;
    G.ang = Math.sin(G.clock * 0.7) * 0.2;
    G.kick += dt * 8;
    G.o2 = O2_MAX;
    for (let i = 0; i < G.jellies.length; i++) {
      const j = G.jellies[i];
      j.y = j.y0 + Math.sin(G.clock * j.spd + j.phase) * j.amp;
    }
    updateCam(dt);
    updateFx(dt);
  }

  function updatePlay(dt) {
    const p = G.player;
    const playing = G.mode === 'play';
    const surf = waveAt(p.x, G.clock);
    const lim = limitY(G.o2);

    if (playing && G.lock <= 0) {
      const w = wishDir();
      const targetVx = w.x * SPEED;
      const targetVy = w.y * SPEED;
      const accel = Math.min(1, dt * 9.5);
      G.vx = lerp(G.vx, targetVx, accel);
      G.vy = lerp(G.vy, targetVy, accel);
      G.vx -= G.vx * DRAG * 0.12 * dt;
      G.vy -= G.vy * DRAG * 0.12 * dt;

      p.x += G.vx * dt;
      p.y += G.vy * dt;

      const moving = hypot(G.vx, G.vy) > 18;
      if (moving) {
        G.kick += dt * (10 + hypot(G.vx, G.vy) * 0.03);
        const want = Math.atan2(G.vy, G.vx);
        let d = want - G.ang;
        while (d > Math.PI) d -= TAU;
        while (d < -Math.PI) d += TAU;
        G.ang += d * Math.min(1, dt * 7);
        if (Math.random() < dt * 7) bubble(p.x - Math.cos(G.ang) * 10, p.y - Math.sin(G.ang) * 8, 1);
      } else {
        G.kick += dt * 3.2;
      }

      p.x = clamp(p.x, 22, WORLD_W - 22);
      if (p.y < surf - 16) p.y = surf - 16;
      if (p.y > FLOOR - 10) p.y = FLOOR - 10;

      if (!G.wet && p.y > surf + 6) {
        G.wet = true;
        audio.dive();
        bubble(p.x, p.y, 8);
        emit(10, {
          x: p.x, y: surf, j: 12,
          vx0: -40, vx1: 40, vy0: -20, vy1: 30,
          life: 0.4, r0: 1, r1: 2.6
        });
      }

      if (p.y > lim - PLAYER_R) {
        p.y = lim - PLAYER_R;
        if (G.vy > 0) G.vy *= -0.15;
        if (!G.tideTaught && G.wet && lim < FLOOR - 8) {
          G.tideTaught = true;
          toast('黑潮顶上来了', true);
          audio.tide();
          G.flash = 0.45;
          G.shake = 6;
        }
      }
    } else if (G.mode === 'surfacing') {
      p.y = lerp(p.y, surf - 18, dt * 4);
      p.x = lerp(p.x, G.raftX, dt * 2.2);
      G.vx *= 0.9;
      G.vy *= 0.9;
    } else if (G.mode === 'dying') {
      p.y += dt * 36;
      G.ang += dt * 1.4;
      G.vx *= 0.96;
      if (Math.random() < dt * 14) bubble(p.x, p.y, 1);
    }

    for (let i = 0; i < G.jellies.length; i++) {
      const j = G.jellies[i];
      j.y = j.y0 + Math.sin(G.clock * j.spd + j.phase) * j.amp;
      if (playing && G.hitT <= 0 && G.wet) {
        const d = hypot(p.x - j.x, p.y - j.y);
        if (d < PLAYER_R + j.r * 0.72) {
          G.hitT = 0.72;
          G.o2 = Math.max(0, G.o2 - 1.55);
          G.flash = 0.55;
          G.shake = 8;
          audio.sting();
          const nx = (p.x - j.x) / Math.max(0.1, d);
          const ny = (p.y - j.y) / Math.max(0.1, d);
          G.vx += nx * 160;
          G.vy += ny * 160;
          emit(14, {
            x: p.x, y: p.y, j: 6,
            vx0: -60, vx1: 60, vy0: -50, vy1: 50,
            life: 0.4, r0: 1.2, r1: 3, mag: true
          });
          toast('水母蜇了一下', true);
        }
      }
    }

    if (playing) {
      const depth01 = clamp((p.y - SURFACE) / (FLOOR - SURFACE), 0, 1);
      if (G.wet) {
        const rate = 0.9 + 0.62 * depth01;
        G.o2 -= rate * dt;
        if (G.o2 < 0) G.o2 = 0;
      }

      if (!G.warned && G.wet && G.o2 < 4.6) {
        G.warned = true;
        toast('胸口发紧', true);
      }
      if (G.wet && G.o2 < 4.6 && G.t - audio.lastWarn > 1.05) {
        audio.lastWarn = G.t;
        audio.warn();
      }
      if (G.wet && G.o2 < 4.2 && G.t - audio.lastBeat > 0.72) {
        audio.lastBeat = G.t;
        audio.beat();
      }

      const limNow = limitY(G.o2);
      for (let i = 0; i < G.pearls.length; i++) {
        const pr = G.pearls[i];
        if (pr.state === 'live' && pr.y > limNow + 10) {
          pr.state = 'lost';
          G.lost += 1;
          audio.tide();
          emit(12, {
            x: pr.x, y: pr.y, j: 8,
            vx0: -30, vx1: 30, vy0: -10, vy1: 40,
            life: 0.55, r0: 1, r1: 2.8, mag: true
          });
          if (!G.taught) {
            G.taught = true;
            toast('夜珠被黑潮吞了', true);
          }
        }
        if (pr.state === 'live') {
          const dy = pr.y + Math.sin(G.clock * 1.6 + pr.bob) * 5;
          if (hypot(p.x - pr.x, p.y - dy) < PLAYER_R + PEARL_R) collectPearl(pr);
        }
      }

      if (G.got === PEARL_N && p.y <= surf + 8) {
        endGame(true, 'air');
        return;
      }
      if (G.o2 <= 0 && p.y > surf + 6) {
        endGame(false, 'air');
        return;
      }
      if (G.o2 <= 0 && G.got < PEARL_N) {
        endGame(false, 'air');
        return;
      }
      let liveLeft = 0;
      for (let i = 0; i < G.pearls.length; i++) {
        if (G.pearls[i].state === 'live') liveLeft += 1;
      }
      if (G.got < PEARL_N && liveLeft === 0 && G.doom <= 0) {
        G.doom = 0.55;
        toast('深珠全被黑潮吞了', true);
      }
      if (G.doom > 0) {
        G.doom -= dt;
        if (G.doom <= 0) {
          endGame(false, 'tide');
          return;
        }
      }
    }

    updateCam(dt);
    updateFx(dt);
    syncHud();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, sy(-40), 0, sy(SURFACE + 8));
    g.addColorStop(0, '#070414');
    g.addColorStop(0.55, '#12081f');
    g.addColorStop(1, '#1a1030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, Math.max(0, sy(SURFACE + 18)));

    const moonX = sx(430);
    const moonY = sy(42);
    const mg = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 70);
    mg.addColorStop(0, 'rgba(230, 244, 255, 0.85)');
    mg.addColorStop(0.18, 'rgba(180, 230, 255, 0.35)');
    mg.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 70, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8f4ff';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 13, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(5, 3, 12, 0.35)';
    ctx.beginPath();
    ctx.arc(moonX + 5, moonY - 2, 10, 0, TAU);
    ctx.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + Math.sin(G.clock * 2.2 + s.p) * 0.55;
      ctx.fillStyle = 'rgba(230, 236, 255,' + (s.a * tw) + ')';
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawWater() {
    const top = sy(SURFACE - 4);
    const g = ctx.createLinearGradient(0, top, 0, sy(FLOOR + 40));
    g.addColorStop(0, '#0c2a44');
    g.addColorStop(0.18, '#0a2240');
    g.addColorStop(0.48, '#071428');
    g.addColorStop(0.78, '#080616');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.max(0, top), W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const px = sx((i * 96 + G.clock * (10 + i * 3) * 4) % (WORLD_W + 80) - 20);
      const gw = ctx.createLinearGradient(px, sy(SURFACE), px + 50, sy(FLOOR * 0.55));
      gw.addColorStop(0, 'rgba(0, 240, 255, 0.07)');
      gw.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = gw;
      ctx.beginPath();
      ctx.moveTo(px - 10, sy(SURFACE));
      ctx.lineTo(px + 28, sy(SURFACE));
      ctx.lineTo(px + 64, sy(FLOOR * 0.52));
      ctx.lineTo(px + 8, sy(FLOOR * 0.52));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 12);
      const y = sy(m.y);
      if (y < -8 || y > H + 8 || x < -8 || x > W + 8) continue;
      ctx.fillStyle = 'rgba(170, 230, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawSurface() {
    const t = G.clock;
    const x0 = camX - 40;
    const x1 = camX + W / scale + 40;
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(SURFACE + 30));
    for (let x = x0; x <= x1; x += 10) {
      ctx.lineTo(sx(x), sy(waveAt(x, t)));
    }
    ctx.lineTo(sx(x1), sy(-40));
    ctx.lineTo(sx(x0), sy(-40));
    ctx.closePath();
    ctx.save();
    ctx.clip();
    drawSky();
    ctx.restore();

    ctx.beginPath();
    let first = true;
    for (let x = x0; x <= x1; x += 8) {
      const y = waveAt(x, t);
      if (first) {
        ctx.moveTo(sx(x), sy(y));
        first = false;
      } else ctx.lineTo(sx(x), sy(y));
    }
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawRaft() {
    const x = sx(G.raftX);
    const y = sy(waveAt(G.raftX, G.clock) - 4);
    const glow = G.got === PEARL_N;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(G.clock * 1.4) * 0.04);
    if (glow) {
      const rg = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
      rg.addColorStop(0, 'rgba(255, 227, 107, 0.28)');
      rg.addColorStop(1, 'rgba(255, 227, 107, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#1a1028';
    ctx.strokeStyle = glow ? 'rgba(255, 227, 107, 0.85)' : 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-28, 4);
    ctx.lineTo(-18, -6);
    ctx.lineTo(22, -6);
    ctx.lineTo(32, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = glow ? '#ffe36b' : '#00f0ff';
    ctx.beginPath();
    ctx.arc(0, -14, 3.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -6);
    ctx.stroke();
    ctx.restore();
  }

  function drawKelp() {
    for (let i = 0; i < kelp.length; i++) {
      const k = kelp[i];
      const baseX = k.x;
      const baseY = FLOOR + 6;
      ctx.beginPath();
      ctx.moveTo(sx(baseX), sy(baseY));
      const segs = 7;
      for (let s = 1; s <= segs; s++) {
        const u = s / segs;
        const sway = Math.sin(G.clock * 1.1 + k.p + u * 2.2) * (10 + u * 16);
        ctx.lineTo(sx(baseX + sway), sy(baseY - k.h * u));
      }
      ctx.strokeStyle = i % 2 ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 61, 184, 0.18)';
      ctx.lineWidth = k.w * scale * 0.22;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function drawFloor() {
    ctx.beginPath();
    ctx.moveTo(sx(-30), sy(WORLD_H + 40));
    ctx.lineTo(sx(-30), sy(FLOOR));
    for (let x = 0; x <= WORLD_W; x += 16) {
      const jag = Math.sin(x * 0.04) * 7 + Math.sin(x * 0.11 + 1) * 4;
      ctx.lineTo(sx(x), sy(FLOOR + jag));
    }
    ctx.lineTo(sx(WORLD_W + 30), sy(FLOOR));
    ctx.lineTo(sx(WORLD_W + 30), sy(WORLD_H + 40));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, sy(FLOOR - 10), 0, sy(WORLD_H));
    g.addColorStop(0, '#1a1028');
    g.addColorStop(1, '#07040e');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      const x = sx(r.x);
      const y = sy(r.y);
      ctx.fillStyle = r.k > 0.5 ? 'rgba(40, 24, 58, 0.9)' : 'rgba(28, 40, 62, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x, y, r.r * 0.7 * scale, r.r * 0.42 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = r.k > 0.55 ? 'rgba(255, 61, 184, 0.2)' : 'rgba(0, 240, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawTide() {
    const lim = G.mode === 'title' ? FLOOR + 8 : limitY(G.o2);
    const y = sy(lim);
    if (y > H + 40) return;

    const fog = ctx.createLinearGradient(0, y, 0, H);
    fog.addColorStop(0, 'rgba(255, 61, 184, 0.08)');
    fog.addColorStop(0.18, 'rgba(80, 10, 40, 0.42)');
    fog.addColorStop(1, 'rgba(12, 2, 16, 0.78)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, Math.max(0, y), W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const wx = ((G.clock * (20 + i * 9) + i * 70) % (W + 120)) - 40;
      ctx.fillStyle = 'rgba(255, 61, 184,' + (0.04 + (i % 2) * 0.03) + ')';
      ctx.beginPath();
      ctx.ellipse(wx, y + 16, 70, 10, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    if (lim < FLOOR - 4) {
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const t = G.clock;
      for (let x = -10; x <= WORLD_W + 10; x += 12) {
        const yy = lim + Math.sin(x * 0.05 + t * 3.2) * 3.2;
        if (x === -10) ctx.moveTo(sx(x), sy(yy));
        else ctx.lineTo(sx(x), sy(yy));
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 154, 212, 0.8)';
      ctx.font = '600 11px Segoe UI, PingFang SC, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('气限', 12, clamp(y - 8, 16, H - 10));
    }
  }

  function drawFish() {
    for (let i = 0; i < fish.length; i++) {
      const f = fish[i];
      const x = (f.x + G.clock * f.s * 0.35) % (WORLD_W + 80) - 40;
      const y = f.y + Math.sin(G.clock * 0.8 + f.p) * 10;
      const px = sx(x);
      const py = sy(y);
      if (py < -20 || py > H + 20) continue;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(f.s > 0 ? 1 : -1, 1);
      ctx.fillStyle = 'rgba(10, 18, 36,' + f.a + ')';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 5, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-20, -5);
      ctx.lineTo(-20, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawJellies() {
    for (let i = 0; i < G.jellies.length; i++) {
      const j = G.jellies[i];
      const x = sx(j.x);
      const y = sy(j.y);
      if (y < -40 || y > H + 40) continue;
      const pulse = 0.7 + Math.sin(G.clock * 2.4 + j.phase) * 0.3;
      const rg = ctx.createRadialGradient(x, y, 2, x, y, j.r * scale * 1.6);
      rg.addColorStop(0, 'rgba(255, 61, 184,' + (0.28 * pulse) + ')');
      rg.addColorStop(1, 'rgba(255, 61, 184, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, j.r * scale * 1.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 120, 200, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y - 2 * scale, j.r * scale, j.r * 0.72 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(x, y - 2 * scale, j.r * scale, j.r * 0.72 * scale, 0, Math.PI, TAU);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 154, 212, 0.45)';
      ctx.lineWidth = 1;
      for (let t = -2; t <= 2; t++) {
        ctx.beginPath();
        const ox = t * 4.2 * scale;
        ctx.moveTo(x + ox, y);
        for (let k = 1; k <= 5; k++) {
          const yy = y + k * 7 * scale;
          const xx = x + ox + Math.sin(G.clock * 3 + t + k * 0.6) * 3.2 * scale;
          ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
    }
  }

  function drawPearls() {
    for (let i = 0; i < G.pearls.length; i++) {
      const p = G.pearls[i];
      if (p.state === 'got') continue;
      const bob = Math.sin(G.clock * 1.6 + p.bob) * 5;
      const x = sx(p.x);
      const y = sy(p.y + bob);
      if (y < -30 || y > H + 30) continue;
      const lost = p.state === 'lost';
      const pulse = 0.6 + Math.sin(G.clock * 2.8 + p.bob) * 0.4;
      const col = lost ? '255,61,184' : p.z === 2 ? '255,227,107' : p.z === 1 ? '0,240,255' : '200,245,255';
      const rg = ctx.createRadialGradient(x, y, 1, x, y, PEARL_R * scale * 2.4);
      rg.addColorStop(0, 'rgba(' + col + ',' + (lost ? 0.12 : 0.32 * pulse) + ')');
      rg.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, PEARL_R * scale * 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = lost ? 'rgba(80, 20, 50, 0.7)' : 'rgba(255, 250, 230, 0.92)';
      ctx.beginPath();
      ctx.arc(x, y, PEARL_R * scale * 0.72, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = lost ? 'rgba(255, 61, 184, 0.5)' : 'rgba(' + col + ',0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, PEARL_R * scale, 0, TAU);
      ctx.stroke();
      if (!lost) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(x - 2.4 * scale, y - 2.6 * scale, 1.5 * scale, 0, TAU);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 3);
        ctx.lineTo(x + 3, y + 4);
        ctx.stroke();
      }
    }
  }

  function drawDiver() {
    const p = G.player;
    const x = sx(p.x);
    const y = sy(p.y);
    const hit = G.hitT > 0 && ((G.hitT * 20) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(G.ang);
    const s = scale;
    const glow = G.got === PEARL_N ? '0,240,255' : '255,61,184';
    const chest = clamp(G.o2 / O2_MAX, 0, 1);
    const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 22 * s);
    rg.addColorStop(0, 'rgba(' + glow + ',' + (0.18 + chest * 0.12) + ')');
    rg.addColorStop(1, 'rgba(' + glow + ',0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, 22 * s, 0, TAU);
    ctx.fill();

    const kick = Math.sin(G.kick) * 0.45;
    ctx.strokeStyle = hit ? 'rgba(255,61,184,0.9)' : 'rgba(0,240,255,0.85)';
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6 * s, 4 * s);
    ctx.quadraticCurveTo(-14 * s, 10 * s + kick * 8 * s, -20 * s, 16 * s + kick * 10 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6 * s, 4 * s);
    ctx.quadraticCurveTo(-12 * s, 12 * s - kick * 8 * s, -18 * s, 18 * s - kick * 10 * s);
    ctx.stroke();
    ctx.fillStyle = hit ? 'rgba(255,61,184,0.55)' : 'rgba(0,240,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-20 * s, 16 * s + kick * 10 * s, 5 * s, 2.2 * s, 0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-18 * s, 18 * s - kick * 10 * s, 5 * s, 2.2 * s, -0.4, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#14101c';
    ctx.strokeStyle = hit ? '#ff3db8' : '#00f0ff';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.ellipse(1 * s, 1 * s, 8.5 * s, 5.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1c1428';
    ctx.beginPath();
    ctx.arc(9 * s, -1 * s, 5.4 * s, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = G.wet && G.o2 < 4.5 ? '#ff3db8' : '#7af6ff';
    ctx.beginPath();
    ctx.arc(10.6 * s, -1.6 * s, 1.5 * s, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(' + (chest > 0.4 ? '0,240,255' : '255,61,184') + ',' + (0.35 + chest * 0.45) + ')';
    ctx.beginPath();
    ctx.ellipse(2 * s, 1 * s, 3.2 * s, 2.2 * s, 0, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.gold
        ? 'rgba(255,227,107,' + a + ')'
        : q.mag
          ? 'rgba(255,61,184,' + a + ')'
          : 'rgba(0,240,255,' + a + ')';
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < bubbles.length; i++) {
      const q = bubbles[i];
      ctx.strokeStyle = 'rgba(180,240,255,' + clamp(q.life, 0, 0.7) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawVignette() {
    const depth = clamp((G.player.y - SURFACE) / (FLOOR - SURFACE), 0, 1);
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.46, H * 0.16, W * 0.5, H * 0.5, H * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(3,1,10,' + (0.28 + depth * 0.28) + ')');
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
    if (G.mode === 'play' && G.wet && G.o2 < 4.6) {
      const a = 0.07 + Math.sin(G.t * 8) * 0.05;
      ctx.fillStyle = 'rgba(255, 61, 184,' + a + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawWater();
    drawSurface();
    drawRaft();
    drawFish();
    drawKelp();
    drawFloor();
    drawTide();
    drawJellies();
    drawPearls();
    drawFx();
    drawDiver();
    drawVignette();
  }

  let last = 0;
  let acc = 0;
  function frame(now) {
    const t = now * 0.001;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    acc += dt;
    if (acc > 0.1) acc = 0.1;
    while (acc >= STEP) {
      G.clock += STEP;
      if (G.mode === 'play') G.t += STEP;
      if (G.mode === 'title') updateDemo(STEP);
      else updatePlay(STEP);
      if (G.mode === 'surfacing' || G.mode === 'dying') {
        G.dieT -= STEP;
        if (G.dieT <= 0) {
          const win = G.mode === 'surfacing';
          G.mode = win ? 'win' : 'lose';
          showPanel(win ? 'win' : 'lose');
        }
      }
      acc -= STEP;
    }
    if (G.mode === 'play') audio.tickDrone(G.o2, G.wet);
    draw();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      keys.l = down;
      e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      keys.r = down;
      e.preventDefault();
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      keys.u = down;
      e.preventDefault();
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      keys.d = down;
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startPlay();
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startPlay();
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    pointer.down = true;
    pointer.id = e.pointerId;
    const w = pointerWorld(e);
    pointer.x = w.x;
    pointer.y = w.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) return;
    const w = pointerWorld(e);
    pointer.x = w.x;
    pointer.y = w.y;
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
    startPlay();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startPlay();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    pointer.down = false;
  });
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }

  buildPips();
  resetRun();
  G.mode = 'title';
  showPanel('title');
  resize();
  camX = 0;
  camY = 0;
  syncHud();
  requestAnimationFrame(function (t) {
    last = t * 0.001;
    requestAnimationFrame(frame);
  });
})();
