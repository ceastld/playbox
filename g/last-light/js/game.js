'use strict';

(function () {
  const TILE = 44;
  const COLS = 32;
  const ROWS = 20;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;
  const PLAYER_R = 10.5;
  const SPEED = 178;
  const FUEL_MAX = 100;
  const DRAIN = 5.05;
  const WIND_DRAIN = 11.4;
  const LIGHT_MIN = 30;
  const LIGHT_SPAN = 196;
  const DOOR_R = 22;
  const SHRINE_R = 11;
  const RAYS = 80;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LOCK = 0.34;
  const DIE_T = 0.82;
  const WIN_T = 0.92;

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
  const emberWrap = document.getElementById('ember-wrap');
  const emberFill = document.getElementById('ember-fill');
  const emberNum = document.getElementById('ember-num');
  const distLabel = document.getElementById('dist-label');
  const windLabel = document.getElementById('wind-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let camX = 0;
  let camY = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, id: null, x: 0, y: 0 };

  const grid = [];
  const particles = [];
  const sparks = [];
  const drips = [];
  const motes = [];
  const gusts = [];
  const cracks = [];

  const shrine = { x: 0, y: 0 };
  const door = { x: 0, y: 0 };
  const start = { x: 0, y: 0 };
  const windCells = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    fuel: FUEL_MAX,
    shake: 0,
    flash: 0,
    cyanFlash: 0,
    lock: 0,
    dieT: 0,
    toastT: 0,
    warned: false,
    windTaught: false,
    shrineTaught: false,
    gutterT: 0,
    flicker: 1,
    facing: 0.15,
    vx: 0,
    vy: 0,
    player: { x: 0, y: 0 },
    inWind: false,
    dist: 0,
    why: ''
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
  function hash(c, r) {
    const n = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  function tileAt(x, y) {
    const c = (x / TILE) | 0;
    const r = (y / TILE) | 0;
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return '#';
    return grid[r][c];
  }
  function solidAt(x, y) {
    return tileAt(x, y) === '#';
  }
  function isWindAt(x, y) {
    return tileAt(x, y) === 'W';
  }
  function sx(x) {
    return (x - camX) * scale;
  }
  function sy(y) {
    return (y - camY) * scale;
  }
  function cellCenter(c, r) {
    return { x: (c + 0.5) * TILE, y: (r + 0.5) * TILE };
  }

  function carve(c0, r0, w, h, ch) {
    const fill = ch || '.';
    for (let r = r0; r < r0 + h; r++) {
      for (let c = c0; c < c0 + w; c++) {
        if (c > 0 && r > 0 && c < COLS - 1 && r < ROWS - 1) {
          grid[r][c] = fill;
        }
      }
    }
  }

  function buildMap() {
    grid.length = 0;
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push('#');
      grid.push(row);
    }
    // vestibule
    carve(1, 1, 8, 7);
    // south passage
    carve(5, 6, 3, 5);
    // atrium
    carve(3, 9, 13, 5);
    // decoy hall + shrine room (sealed from the door chamber)
    carve(15, 10, 8, 3);
    carve(21, 8, 9, 5);
    // down from atrium
    carve(7, 13, 3, 4);
    // wind tunnel
    carve(7, 15, 16, 3, 'W');
    // door chamber
    carve(21, 14, 10, 5);

    // atrium pillar
    grid[11][12] = '#';
    grid[11][13] = '#';
    grid[12][12] = '#';
    grid[12][13] = '#';
    // wind chicanes
    grid[16][12] = '#';
    grid[16][18] = '#';
    // keep shrine from leaking south into the door
    for (let c = 20; c < COLS - 1; c++) grid[13][c] = '#';

    start.x = cellCenter(3, 3).x;
    start.y = cellCenter(3, 3).y;
    shrine.x = cellCenter(25, 10).x;
    shrine.y = cellCenter(10, 10).y;
    door.x = cellCenter(29, 16).x;
    door.y = cellCenter(16, 16).y;
    grid[3][3] = '.';
    grid[10][25] = '.';
    grid[16][29] = 'D';

    windCells.length = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 'W') windCells.push({ c: c, r: r });
      }
    }
  }

  function makeDecor() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: rand(TILE, WORLD_W - TILE),
        y: rand(TILE, WORLD_H - TILE),
        r: rand(0.4, 1.6),
        a: rand(0.08, 0.28),
        p: rand(0, TAU),
        s: rand(4, 14)
      });
    }
    drips.length = 0;
    for (let i = 0; i < 18; i++) {
      drips.push({
        x: rand(TILE * 2, WORLD_W - TILE * 2),
        y: rand(TILE, WORLD_H * 0.8),
        p: rand(0, 4),
        sp: rand(0.35, 0.9)
      });
    }
    cracks.length = 0;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (grid[r][c] !== '#' && hash(c, r) > 0.78) {
          cracks.push({
            c: c,
            r: r,
            a: hash(c + 3, r) * TAU,
            k: hash(c, r + 9)
          });
        }
      }
    }
    gusts.length = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 'W') {
          for (let k = 0; k < 2; k++) {
            gusts.push({
              x: c * TILE + rand(4, TILE - 4),
              y: r * TILE + rand(4, TILE - 4),
              vx: rand(70, 140),
              vy: rand(-18, 18),
              life: rand(0.2, 1.2),
              a: rand(0.12, 0.4)
            });
          }
        }
      }
    }
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    windNode: null,
    windGain: null,
    noise: null,
    muted: false,
    lastCrackle: -9,
    lastWarn: -9,
    lastStep: -9,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.55, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noise = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem('last-light-mute', m ? '1' : '0');
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
    burst(dur, vol, rate) {
      if (!this.ctx || this.muted || !this.noise) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      src.playbackRate.value = rate || 1.6;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 900;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    ignite() {
      this.ensure();
      this.beep(220, 0.22, 'sine', 0.07, 520);
      this.burst(0.18, 0.05, 2.2);
    },
    crackle() {
      this.ensure();
      this.burst(0.06, 0.028, rand(1.4, 2.6));
      this.beep(rand(380, 620), 0.05, 'triangle', 0.02, rand(180, 280));
    },
    step() {
      this.ensure();
      this.beep(rand(90, 130), 0.06, 'sine', 0.03, 60);
    },
    windHit() {
      this.ensure();
      this.beep(140, 0.22, 'sine', 0.05, 70);
      this.burst(0.2, 0.04, 0.8);
    },
    warn() {
      this.ensure();
      this.beep(196, 0.12, 'square', 0.03, 110);
    },
    shrine() {
      this.ensure();
      this.beep(311, 0.18, 'sine', 0.05, 180);
    },
    win() {
      this.ensure();
      this.beep(392, 0.16, 'triangle', 0.09, 784);
      this.beep(523, 0.24, 'sine', 0.07, 1046);
      this.beep(784, 0.46, 'sine', 0.05, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.4, 'sawtooth', 0.07, 70);
      this.beep(90, 0.7, 'sine', 0.05, 36);
      this.burst(0.4, 0.04, 0.5);
    },
    tickBeds(fuel, wind, playing) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
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
      const low = fuel < 28;
      this.drone.frequency.setTargetAtTime(low ? 40 : 52, t, 0.14);
      this.droneGain.gain.setTargetAtTime(playing ? (low ? 0.046 : 0.018) : 0.0001, t, 0.2);

      if (!this.windNode && this.noise) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 760;
        f.Q.value = 0.7;
        const g = this.ctx.createGain();
        g.gain.value = 0.0001;
        src.connect(f);
        f.connect(g);
        g.connect(this.master);
        src.start();
        this.windNode = src;
        this.windGain = g;
      }
      if (this.windGain) {
        this.windGain.gain.setTargetAtTime(playing && wind ? 0.045 : 0.0001, t, 0.18);
      }
    },
    stopBeds() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.0001, t, 0.22);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0.0001, t, 0.22);
    }
  };

  try {
    if (localStorage.getItem('last-light-mute') === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 110) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        cyan: !!spec.cyan
      });
    }
  }

  function spark(x, y, n) {
    for (let i = 0; i < n; i++) {
      if (sparks.length > 48) sparks.shift();
      sparks.push({
        x: x + rand(-3, 3),
        y: y + rand(-5, 1),
        vx: rand(-18, 18),
        vy: rand(-70, -20),
        life: rand(0.18, 0.55),
        r: rand(0.8, 2.1)
      });
    }
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.remove('hidden');
    G.toastT = 2.35;
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
    scale = Math.min(W / (15.2 * TILE), H / (10.4 * TILE));
    if (scale < 0.26) scale = 0.26;
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: camX + (e.clientX - rect.left) / scale,
      y: camY + (e.clientY - rect.top) / scale
    };
  }

  function blocked(x, y) {
    const r = PLAYER_R;
    if (solidAt(x - r, y - r) || solidAt(x + r, y - r) ||
        solidAt(x - r, y + r) || solidAt(x + r, y + r) ||
        solidAt(x, y - r) || solidAt(x, y + r) ||
        solidAt(x - r, y) || solidAt(x + r, y)) return true;
    const d = hypot(x - shrine.x, y - shrine.y);
    if (d < PLAYER_R + SHRINE_R) return true;
    return false;
  }

  function lightRadius() {
    const k = clamp(G.fuel / FUEL_MAX, 0, 1);
    const base = LIGHT_MIN + LIGHT_SPAN * k;
    const flick = G.flicker;
    if (G.mode === 'dying') {
      const u = clamp(G.dieT / DIE_T, 0, 1);
      return base * u * u * flick;
    }
    if (G.mode === 'entering') {
      return base + (1 - clamp(G.dieT / WIN_T, 0, 1)) * 260;
    }
    return base * flick;
  }

  function march(ox, oy, ang, maxd) {
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const step = 5.5;
    let d = 0;
    while (d < maxd) {
      d += step;
      if (solidAt(ox + dx * d, oy + dy * d)) return Math.min(maxd, d + 14);
    }
    return maxd;
  }

  function wishDir() {
    let x = 0;
    let y = 0;
    if (pointer.down && G.lock <= 0) {
      x = pointer.x - G.player.x;
      y = pointer.y - G.player.y;
      const d = hypot(x, y);
      if (d < 12) return { x: 0, y: 0 };
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

  function resetRun() {
    G.t = 0;
    G.fuel = FUEL_MAX;
    G.shake = 0;
    G.flash = 0;
    G.cyanFlash = 0;
    G.lock = LOCK;
    G.dieT = 0;
    G.warned = false;
    G.windTaught = false;
    G.shrineTaught = false;
    G.gutterT = 0;
    G.flicker = 1;
    G.facing = 0.2;
    G.vx = 0;
    G.vy = 0;
    G.inWind = false;
    G.why = '';
    G.player.x = start.x;
    G.player.y = start.y;
    particles.length = 0;
    sparks.length = 0;
    pointer.down = false;
    pointer.id = null;
    keys.l = keys.r = keys.u = keys.d = false;
    emberWrap.classList.remove('warn', 'wind');
    distLabel.classList.remove('near');
    makeDecor();
    camX = G.player.x - (W / scale) * 0.5;
    camY = G.player.y - (H / scale) * 0.48;
    syncHud();
  }

  function showPanel(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'EMBER';
      ovTitle.textContent = '末光';
      ovLead.innerHTML = '火把越来越短，在熄灭前摸到门。<br />亮时看路，暗时凭记忆。穿堂风会吞火。';
      ovOps.textContent = 'WASD / 方向键走动 · 按住屏幕朝向走 · M 静音';
      ovBtn.textContent = '举火';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'THRESHOLD';
      ovTitle.textContent = '门开了';
      ovLead.textContent = '末光未灭，你摸到了殿门。';
      ovOps.textContent = '余火 ' + Math.max(0, G.fuel).toFixed(0) + ' · 用时 ' + G.t.toFixed(1) + ' 秒';
      ovBtn.textContent = '再举一次';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'EXTINGUISHED';
      ovTitle.textContent = '火尽';
      ovLead.textContent = '火把熄了。门还在暗处。';
      ovOps.textContent = '距门 ' + Math.max(0, G.dist | 0) + ' · 走了 ' + G.t.toFixed(1) + ' 秒';
      ovBtn.textContent = '再举一次';
    }
  }

  function startPlay() {
    audio.ignite();
    resetRun();
    G.mode = 'play';
    overlay.classList.add('hidden');
    hintEl.textContent = '火把在灭 · 别进风里久站 · 摸到那扇门';
    toast('举火。亮时把路看清');
  }

  function endGame(win) {
    if (G.mode !== 'play') return;
    toastEl.classList.add('hidden');
    G.toastT = 0;
    if (win) {
      G.mode = 'entering';
      G.dieT = WIN_T;
      G.cyanFlash = 1;
      audio.win();
      emit(40, {
        x: door.x, y: door.y, j: 18,
        vx0: -90, vx1: 90, vy0: -80, vy1: 40,
        life: 0.9, r0: 1.4, r1: 4.6, cyan: true
      });
    } else {
      G.mode = 'dying';
      G.dieT = DIE_T;
      G.flash = 0.85;
      G.shake = 9;
      audio.lose();
      emit(26, {
        x: G.player.x, y: G.player.y, j: 10,
        vx0: -50, vx1: 50, vy0: -70, vy1: 20,
        life: 0.7, r0: 1.2, r1: 3.6, mag: true
      });
    }
    audio.stopBeds();
  }

  function syncHud() {
    const pct = clamp(G.mode === 'title' ? 1 : G.fuel / FUEL_MAX, 0, 1);
    emberFill.style.transform = 'scaleX(' + pct + ')';
    emberNum.textContent = String(Math.ceil(pct * 100));
    const dx = door.x - G.player.x;
    const dy = door.y - G.player.y;
    G.dist = hypot(dx, dy);
    distLabel.textContent = '距门 ' + String(Math.max(0, Math.round(G.dist / TILE)));
    distLabel.classList.toggle('near', G.dist < TILE * 5);
    windLabel.textContent = G.inWind && G.mode === 'play' ? '穿堂风' : '';
    emberWrap.classList.toggle('warn', pct < 0.28 && G.mode === 'play');
    emberWrap.classList.toggle('wind', G.inWind && G.mode === 'play');
  }

  function updateCam(dt) {
    const visW = W / scale;
    const visH = H / scale;
    const tx = G.player.x - visW * 0.5;
    const ty = G.player.y - visH * 0.48;
    const k = 1 - Math.pow(0.0007, dt);
    camX = lerp(camX, tx, k);
    camY = lerp(camY, ty, k);
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.cyanFlash > 0) G.cyanFlash = Math.max(0, G.cyanFlash - dt * 2.6);
    if (G.lock > 0) G.lock -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    const windMul = G.inWind ? 2.4 : 1;
    G.flicker = 0.9 + Math.sin(G.clock * 17.5) * 0.04 * windMul
      + Math.sin(G.clock * 31 + 1.2) * 0.03
      + (G.gutterT > 0 ? -0.16 : 0);
    G.flicker = clamp(G.flicker, 0.62, 1.12);

    if (G.gutterT > 0) G.gutterT -= dt;

    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 28 * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const q = sparks[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 90 * dt;
      if (q.life <= 0) sparks.splice(i, 1);
    }
    for (let i = 0; i < gusts.length; i++) {
      const g = gusts[i];
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.life -= dt;
      if (g.life <= 0 || tileAt(g.x, g.y) !== 'W') {
        if (windCells.length) {
          const spot = windCells[(Math.random() * windCells.length) | 0];
          g.x = spot.c * TILE + rand(2, TILE - 2);
          g.y = spot.r * TILE + rand(2, TILE - 2);
          g.vx = rand(80, 150);
          g.vy = rand(-22, 22);
          g.life = rand(0.25, 1.1);
          g.a = rand(0.12, 0.42);
        }
      }
    }
    for (let i = 0; i < drips.length; i++) {
      drips[i].p += dt * drips[i].sp;
      if (drips[i].p > 3.2) drips[i].p = 0;
    }
  }

  function updateDemo(dt) {
    G.fuel = FUEL_MAX;
    G.player.x = start.x + Math.sin(G.clock * 0.55) * 6;
    G.player.y = start.y + Math.sin(G.clock * 0.4) * 4;
    G.facing = Math.sin(G.clock * 0.5) * 0.35;
    G.inWind = false;
    if (Math.random() < dt * 6) spark(G.player.x + 8, G.player.y - 10, 1);
    updateCam(dt);
    updateFx(dt);
  }

  function updatePlay(dt) {
    const p = G.player;
    const playing = G.mode === 'play';

    if (playing && G.lock <= 0) {
      const w = wishDir();
      const accel = Math.min(1, dt * 10);
      G.vx = lerp(G.vx, w.x * SPEED, accel);
      G.vy = lerp(G.vy, w.y * SPEED, accel);
      G.vx -= G.vx * 3.2 * dt;
      G.vy -= G.vy * 3.2 * dt;

      let nx = p.x + G.vx * dt;
      let ny = p.y;
      if (blocked(nx, ny)) {
        nx = p.x;
        G.vx = 0;
      }
      ny = p.y + G.vy * dt;
      if (blocked(nx, ny)) {
        ny = p.y;
        G.vy = 0;
      }
      p.x = nx;
      p.y = ny;
      p.x = clamp(p.x, PLAYER_R + 4, WORLD_W - PLAYER_R - 4);
      p.y = clamp(p.y, PLAYER_R + 4, WORLD_H - PLAYER_R - 4);

      const spd = hypot(G.vx, G.vy);
      if (spd > 22) {
        const want = Math.atan2(G.vy, G.vx);
        let d = want - G.facing;
        while (d > Math.PI) d -= TAU;
        while (d < -Math.PI) d += TAU;
        G.facing += d * Math.min(1, dt * 8);
        if (G.t - audio.lastStep > 0.31) {
          audio.lastStep = G.t;
          audio.step();
        }
      }
    } else if (G.mode === 'entering') {
      p.x = lerp(p.x, door.x - 8, dt * 2.4);
      p.y = lerp(p.y, door.y, dt * 2.4);
      G.vx *= 0.85;
      G.vy *= 0.85;
    } else if (G.mode === 'dying') {
      G.facing += dt * 1.1;
      G.vx *= 0.9;
      G.vy *= 0.9;
    }

    G.inWind = playing && isWindAt(p.x, p.y);

    if (playing) {
      const rate = G.inWind ? WIND_DRAIN : DRAIN;
      G.fuel -= rate * dt;
      if (G.fuel < 0) G.fuel = 0;

      if (G.inWind && !G.windTaught) {
        G.windTaught = true;
        toast('穿堂风在咬火', true);
        audio.windHit();
        G.shake = 5;
      }
      if (hypot(p.x - shrine.x, p.y - shrine.y) < 36 && !G.shrineTaught) {
        G.shrineTaught = true;
        toast('只是残灯，不是门', true);
        audio.shrine();
      }

      if (!G.warned && G.fuel < 26) {
        G.warned = true;
        toast('火把只剩一截', true);
        hintEl.textContent = '末光将尽 · 凭记忆找门';
      }
      if (G.fuel < 26 && G.t - audio.lastWarn > 1.05) {
        audio.lastWarn = G.t;
        audio.warn();
        G.gutterT = 0.16;
        G.shake = 4;
      }
      if (G.t - audio.lastCrackle > (G.inWind ? 0.12 : 0.28)) {
        audio.lastCrackle = G.t;
        audio.crackle();
      }

      const tipX = p.x + Math.cos(G.facing) * (10 + 10 * (G.fuel / FUEL_MAX));
      const tipY = p.y + Math.sin(G.facing) * (10 + 10 * (G.fuel / FUEL_MAX)) - 7;
      if (Math.random() < dt * (9 + (G.inWind ? 10 : 0))) spark(tipX, tipY, 1);

      if (hypot(p.x - door.x, p.y - door.y) < DOOR_R) {
        endGame(true);
        return;
      }
      if (G.fuel <= 0) {
        endGame(false);
        return;
      }
    }

    if (G.mode === 'entering' || G.mode === 'dying') {
      G.dieT -= dt;
      if (G.dieT <= 0) {
        G.mode = G.mode === 'entering' ? 'win' : 'lose';
        showPanel(G.mode === 'win' ? 'win' : 'lose');
      }
    }

    audio.tickBeds(G.fuel, G.inWind, playing);
    updateCam(dt);
    updateFx(dt);
    syncHud();
  }

  function torchTip() {
    const k = clamp(G.fuel / FUEL_MAX, 0, 1);
    const len = 6 + 12 * k;
    return {
      x: G.player.x + Math.cos(G.facing) * (8 + len * 0.35),
      y: G.player.y + Math.sin(G.facing) * (8 + len * 0.35) - 6,
      len: len,
      k: k
    };
  }

  function drawFloor() {
    const c0 = clamp(((camX - TILE) / TILE) | 0, 0, COLS - 1);
    const r0 = clamp(((camY - TILE) / TILE) | 0, 0, ROWS - 1);
    const c1 = clamp(((camX + W / scale + TILE) / TILE) | 0, 0, COLS - 1);
    const r1 = clamp(((camY + H / scale + TILE) / TILE) | 0, 0, ROWS - 1);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = grid[r][c];
        if (t === '#') continue;
        const x = sx(c * TILE);
        const y = sy(r * TILE);
        const s = TILE * scale;
        const n = hash(c, r);
        if (t === 'W') {
          ctx.fillStyle = n > 0.5 ? '#12101c' : '#0e0c18';
        } else if (t === 'D') {
          ctx.fillStyle = '#141428';
        } else {
          ctx.fillStyle = n > 0.62 ? '#161221' : (n > 0.3 ? '#12101c' : '#0e0c16');
        }
        ctx.fillRect(x, y, s + 0.6, s + 0.6);
        if (t === 'W') {
          ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
          ctx.fillRect(x, y, s + 0.6, s + 0.6);
        }
        ctx.strokeStyle = 'rgba(255, 61, 184, 0.045)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      }
    }
    for (let i = 0; i < cracks.length; i++) {
      const k = cracks[i];
      const cx = sx((k.c + 0.5) * TILE);
      const cy = sy((k.r + 0.5) * TILE);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(cx - 8 * scale, cy);
      ctx.lineTo(cx + Math.cos(k.a) * 11 * scale, cy + Math.sin(k.a) * 8 * scale);
      ctx.stroke();
    }
  }

  function drawWalls() {
    const c0 = clamp(((camX - TILE) / TILE) | 0, 0, COLS - 1);
    const r0 = clamp(((camY - TILE) / TILE) | 0, 0, ROWS - 1);
    const c1 = clamp(((camX + W / scale + TILE) / TILE) | 0, 0, COLS - 1);
    const r1 = clamp(((camY + H / scale + TILE) / TILE) | 0, 0, ROWS - 1);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (grid[r][c] !== '#') continue;
        const x = sx(c * TILE);
        const y = sy(r * TILE);
        const s = TILE * scale;
        const n = hash(c + 2, r);
        ctx.fillStyle = n > 0.5 ? '#1b1428' : '#15101f';
        ctx.fillRect(x, y, s + 0.5, s + 0.5);
        const top = 5 * scale;
        ctx.fillStyle = '#2a2038';
        ctx.fillRect(x, y, s + 0.5, top);
        const below = r < ROWS - 1 && grid[r + 1][c] !== '#';
        if (below) {
          ctx.fillStyle = 'rgba(255, 61, 184, 0.22)';
          ctx.fillRect(x, y + s - 2 * scale, s, 2 * scale);
        }
        const above = r > 0 && grid[r - 1][c] !== '#';
        if (above) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + s, y);
          ctx.stroke();
        }
      }
    }
  }

  function drawShrine() {
    const x = sx(shrine.x);
    const y = sy(shrine.y);
    const g = ctx.createRadialGradient(x, y - 8 * scale, 2, x, y, 54 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.38)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 54 * scale, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#1a0c18';
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -16 * scale);
    ctx.lineTo(9 * scale, 12 * scale);
    ctx.lineTo(-9 * scale, 12 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.arc(0, -4 * scale, 3.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawDoorGlow(bloom) {
    const x = sx(door.x);
    const y = sy(door.y);
    const glow = 56 + bloom * 180;
    const g = ctx.createRadialGradient(x, y, 3, x, y, glow * scale);
    g.addColorStop(0, 'rgba(0, 240, 255,' + (0.38 + bloom * 0.45) + ')');
    g.addColorStop(0.4, 'rgba(0, 240, 255,' + (0.12 + bloom * 0.2) + ')');
    g.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, glow * scale, 0, TAU);
    ctx.fill();
  }

  function drawDoorArch() {
    const x = sx(door.x);
    const y = sy(door.y);
    ctx.save();
    ctx.translate(x, y);
    const w = 16 * scale;
    const h = 26 * scale;
    ctx.fillStyle = '#070614';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w, h * 0.5);
    ctx.lineTo(-w, -h * 0.15);
    ctx.quadraticCurveTo(0, -h, w, -h * 0.15);
    ctx.lineTo(w, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(0, -h * 0.22);
    ctx.stroke();
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(-5 * scale, 2 * scale, 1.6 * scale, 0, TAU);
    ctx.arc(5 * scale, 2 * scale, 1.6 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShrineGlow() {
    const x = sx(shrine.x);
    const y = sy(shrine.y);
    const g = ctx.createRadialGradient(x, y, 2, x, y, 70 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.34)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 70 * scale, 0, TAU);
    ctx.fill();
  }

  function drawGusts() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < gusts.length; i++) {
      const g = gusts[i];
      const x = sx(g.x);
      const y = sy(g.y);
      ctx.strokeStyle = 'rgba(0, 240, 255,' + g.a + ')';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 16 * scale, y + g.vy * 0.04 * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMotes() {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.4 + m.p) * 10);
      const y = sy(m.y);
      if (x < -6 || y < -6 || x > W + 6 || y > H + 6) continue;
      ctx.fillStyle = 'rgba(255, 220, 160,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < drips.length; i++) {
      const d = drips[i];
      if (d.p < 2.2) continue;
      const u = (d.p - 2.2) / 1.0;
      const x = sx(d.x);
      const y = sy(d.y + u * 36);
      ctx.fillStyle = 'rgba(0, 240, 255,' + (0.22 * (1 - u)) + ')';
      ctx.fillRect(x, y, 1.2 * scale, 6 * scale);
    }
  }

  function drawPlayer() {
    const p = G.player;
    const x = sx(p.x);
    const y = sy(p.y);
    const tip = torchTip();
    const k = tip.k;
    const facing = G.facing;
    const bob = Math.sin(G.clock * 8) * (hypot(G.vx, G.vy) > 20 ? 1.6 : 0.4);

    ctx.save();
    ctx.translate(x, y + bob * scale);

    const hx = Math.cos(facing);
    const hy = Math.sin(facing);
    const tx = hx * 11 * scale;
    const ty = hy * 11 * scale - 5 * scale;
    const len = tip.len * scale;
    ctx.strokeStyle = '#6b4424';
    ctx.lineWidth = 2.4 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx * 0.2, ty * 0.2);
    ctx.lineTo(tx + hx * len, ty + hy * len);
    ctx.stroke();

    const fx = tx + hx * len;
    const fy = ty + hy * len;
    const fr = (3.2 + 6.5 * k) * scale * G.flicker;
    const fg = ctx.createRadialGradient(fx, fy, 0.4, fx, fy, fr * 2.4);
    const low = k < 0.28;
    if (low) {
      fg.addColorStop(0, 'rgba(255,255,255,0.95)');
      fg.addColorStop(0.25, 'rgba(0,240,255,0.7)');
      fg.addColorStop(1, 'rgba(0,240,255,0)');
    } else {
      fg.addColorStop(0, 'rgba(255,255,240,0.95)');
      fg.addColorStop(0.22, 'rgba(255,227,107,0.75)');
      fg.addColorStop(0.55, 'rgba(255,61,184,0.35)');
      fg.addColorStop(1, 'rgba(255,61,184,0)');
    }
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(fx, fy, fr * 2.4, 0, TAU);
    ctx.fill();

    ctx.fillStyle = low ? '#e8ffff' : '#ffe36b';
    ctx.beginPath();
    ctx.ellipse(fx, fy - 1.5 * scale, fr * 0.35, fr * 0.8, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#1a1228';
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 3 * scale, 7.2 * scale, 8.4 * scale, facing * 0.15, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f0e8ff';
    ctx.beginPath();
    ctx.arc(-1 * scale, -6.5 * scale, 4.1 * scale, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.stroke();
    ctx.restore();
  }

  function drawSparks() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < sparks.length; i++) {
      const q = sparks[i];
      const a = q.life / 0.55;
      ctx.fillStyle = 'rgba(255, 227, 107,' + clamp(a, 0, 1) + ')';
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      let col = 'rgba(255,180,120,' + a + ')';
      if (q.mag) col = 'rgba(255,61,184,' + a + ')';
      if (q.gold) col = 'rgba(255,227,107,' + a + ')';
      if (q.cyan) col = 'rgba(0,240,255,' + a + ')';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function clipLight() {
    const p = G.player;
    const rad = Math.max(8, lightRadius());
    ctx.beginPath();
    for (let i = 0; i < RAYS; i++) {
      const a = (i / RAYS) * TAU;
      const d = march(p.x, p.y, a, rad);
      const x = sx(p.x + Math.cos(a) * d);
      const y = sy(p.y + Math.sin(a) * d);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.clip();
  }

  function drawWarmth() {
    const p = G.player;
    const px = sx(p.x);
    const py = sy(p.y);
    const rad = Math.max(8, lightRadius()) * scale;
    const low = G.fuel < 28;
    const g = ctx.createRadialGradient(px, py, rad * 0.05, px, py, rad);
    if (low) {
      g.addColorStop(0, 'rgba(0, 240, 255, 0.10)');
      g.addColorStop(0.45, 'rgba(0, 240, 255, 0.03)');
      g.addColorStop(1, 'rgba(5, 3, 12, 0)');
    } else {
      g.addColorStop(0, 'rgba(255, 180, 80, 0.16)');
      g.addColorStop(0.4, 'rgba(255, 61, 184, 0.05)');
      g.addColorStop(1, 'rgba(5, 3, 12, 0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }

  function drawVignette() {
    const p = G.player;
    const px = sx(p.x);
    const py = sy(p.y);
    const rad = Math.max(6, lightRadius()) * scale;
    const g = ctx.createRadialGradient(px, py, rad * 0.42, px, py, rad * 1.02);
    g.addColorStop(0, 'rgba(5,3,12,0)');
    g.addColorStop(0.72, 'rgba(5,3,12,0.16)');
    g.addColorStop(1, 'rgba(5,3,12,0.62)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, rad * 1.02, 0, TAU);
    ctx.fill();
  }

  function draw() {
    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, shx * dpr, shy * dpr);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    clipLight();
    drawFloor();
    drawWarmth();
    drawGusts();
    drawMotes();
    drawShrine();
    drawDoorGlow(G.mode === 'entering' ? 1 - clamp(G.dieT / WIN_T, 0, 1) : 0.2);
    drawDoorArch();
    drawWalls();
    drawPlayer();
    drawSparks();
    drawVignette();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    drawShrineGlow();
    drawDoorGlow(G.mode === 'entering' ? 1 : 0.1);
    ctx.restore();
    if (G.mode === 'entering' || G.mode === 'win') drawDoorArch();
    drawPlayer();
    drawSparks();

    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.flash * 0.22) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.cyanFlash > 0) {
      ctx.fillStyle = 'rgba(0, 240, 255,' + (G.cyanFlash * 0.18) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.mode === 'dying') {
      const u = 1 - clamp(G.dieT / DIE_T, 0, 1);
      ctx.fillStyle = 'rgba(5,3,12,' + (u * 0.72) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (e.repeat && (k === 'm' || k === 'M' || k === 'r' || k === 'R' || k === 'Enter' || k === ' ')) return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
    else if (k === 'm' || k === 'M') {
      if (down) {
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    } else if ((k === 'r' || k === 'R') && down) {
      e.preventDefault();
      if (G.mode === 'title') return;
      startPlay();
      return;
    } else if (down && (k === 'Enter' || k === ' ')) {
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        e.preventDefault();
        startPlay();
      }
      return;
    } else {
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) {
      e.preventDefault();
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    const w = pointerWorld(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
    const w = pointerWorld(e);
    pointer.x = w.x;
    pointer.y = w.y;
  });
  function ptrUp(e) {
    if (pointer.id !== null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener('pointerup', ptrUp);
  canvas.addEventListener('pointercancel', ptrUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    pointer.down = false;
  });
  window.addEventListener('resize', resize);

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    startPlay();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') {
      startPlay();
      return;
    }
    startPlay();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  let last = 0;
  let acc = 0;
  let paused = false;
  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
    if (paused) {
      keys.l = keys.r = keys.u = keys.d = false;
      pointer.down = false;
      audio.stopBeds();
    }
  });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    G.clock += dt;
    if (paused) {
      draw();
      return;
    }
    acc += dt;
    if (acc > 0.1) acc = 0.1;
    while (acc >= STEP) {
      if (G.mode === 'play' || G.mode === 'entering' || G.mode === 'dying') {
        G.t += STEP;
        updatePlay(STEP);
      } else if (G.mode === 'title') {
        updateDemo(STEP);
      } else {
        updateFx(STEP);
        updateCam(STEP);
      }
      acc -= STEP;
    }
    draw();
  }

  buildMap();
  resetRun();
  resize();
  showPanel('title');
  requestAnimationFrame(frame);
})();
