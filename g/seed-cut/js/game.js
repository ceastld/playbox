'use strict';

(function () {
  const COLS = 5;
  const ROWS = 4;
  const GOAL = 12;
  const SEASON = 50;
  const T_SPROUT = 1.05;
  const T_RIPE = 2.5;
  const T_VINE = 5.2;
  const SPREAD_EVERY = 2.7;
  const SPREAD_WIND = 0.72;
  const GRACE = 1.08;
  const MOVE = 0.12;
  const INPUT_LOCK = 0.22;
  const MUTE_KEY = 'playbox-seed-cut-mute';

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hud = document.getElementById('hud');
  const hintEl = document.getElementById('hint');
  const cropEl = document.getElementById('crop');
  const pathHud = document.getElementById('path');
  const timeEl = document.getElementById('time');
  const pathRead = pathHud.parentElement;
  const timeRead = timeEl.parentElement;
  const cropRead = cropEl.parentElement;
  const panel = document.getElementById('panel');
  const card = document.getElementById('card');
  const kickerEl = document.getElementById('panel-kicker');
  const titleEl = document.getElementById('panel-title');
  const leadEl = document.getElementById('panel-lead');
  const metaEl = document.getElementById('panel-meta');
  const footEl = document.getElementById('panel-foot');
  const btnMain = document.getElementById('btn-main');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');

  let W = 1;
  let H = 1;
  let dpr = 1;
  const layout = {
    x0: 0,
    y0: 0,
    size: 64,
    gap: 8,
    boardW: 0,
    boardH: 0,
    side: 40,
    gateX: 0,
    gateY: 0,
    shrineX: 0,
    shrineY: 0
  };

  const tiles = [];
  const particles = [];
  const flies = [];
  const pops = [];
  const moths = [];
  const speck = [];
  const stars = [];

  const keys = { u: false, d: false, l: false, r: false };
  const ptr = { id: null, x: 0, y: 0, sx: 0, sy: 0, down: false };

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
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
      btnMute.textContent = m ? '静' : '音';
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) {}
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
      o.stop(t + dur + 0.02);
    },
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      src.buffer = buf;
      f.type = 'highpass';
      f.frequency.value = 1800;
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    pulse: function (kind) {
      this.ensure();
      if (kind === 'plant') {
        this.beep(180, 0.1, 'sine', 0.07, 320);
        this.beep(520, 0.12, 'triangle', 0.05, 280);
      } else if (kind === 'harvest') {
        this.beep(523, 0.12, 'sine', 0.09, 784);
        this.beep(659, 0.18, 'triangle', 0.06, 1046);
      } else if (kind === 'cut') {
        this.noise(0.07, 0.08);
        this.beep(1400, 0.06, 'square', 0.04, 420);
      } else if (kind === 'no') {
        this.beep(220, 0.08, 'square', 0.03, 110);
      } else if (kind === 'vine') {
        this.beep(160, 0.28, 'sawtooth', 0.06, 70);
      } else if (kind === 'spread') {
        this.beep(110, 0.22, 'sine', 0.05, 55);
      } else if (kind === 'warn') {
        this.beep(240, 0.12, 'square', 0.045, 140);
      } else if (kind === 'ripe') {
        this.beep(880, 0.08, 'sine', 0.035, 1320);
      } else if (kind === 'win') {
        this.beep(523, 0.16, 'sine', 0.09, 784);
        this.beep(659, 0.28, 'triangle', 0.07, 1046);
        this.beep(784, 0.4, 'sine', 0.05, 1174);
      } else if (kind === 'lose') {
        this.beep(196, 0.5, 'sawtooth', 0.09, 60);
        this.beep(98, 0.7, 'square', 0.05, 40);
      } else if (kind === 'start') {
        this.beep(262, 0.14, 'sine', 0.07, 392);
        this.beep(392, 0.2, 'triangle', 0.05, 523);
      } else if (kind === 'step') {
        this.beep(140, 0.04, 'sine', 0.02, 90);
      }
    },
    tickDrone: function (blocked, ripeN) {
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
      const f = blocked ? 46 : 58 + ripeN * 4;
      this.drone.frequency.setTargetAtTime(f, t, 0.12);
      this.droneGain.gain.setTargetAtTime(blocked ? 0.05 : 0.018, t, 0.12);
    },
    stopDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
  };

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    remain: SEASON,
    crop: 0,
    cuts: 0,
    planted: 0,
    px: 2,
    py: 2,
    fx: 2,
    fy: 2,
    moveT: 0,
    face: 0,
    snip: 0,
    lock: 0,
    spreadT: SPREAD_EVERY,
    spreadAim: null,
    route: [],
    pathOk: true,
    grace: 0,
    shake: 0,
    flash: 0,
    flashC: 'pink',
    walkQ: [],
    autoAct: false,
    paused: false,
    result: '',
    ripePing: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hash(i) {
    let x = Math.imul(i + 1, 374761393);
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }

  function tile(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
    return tiles[y * COLS + x];
  }

  function cellCenter(x, y) {
    return {
      x: layout.x0 + x * (layout.size + layout.gap) + layout.size / 2,
      y: layout.y0 + y * (layout.size + layout.gap) + layout.size / 2
    };
  }

  function farmerPos() {
    const u = G.moveT > 0 ? 1 - G.moveT / MOVE : 1;
    const e = smooth(u);
    const a = cellCenter(G.fx, G.fy);
    const b = cellCenter(G.px, G.py);
    return { x: mix(a.x, b.x, e), y: mix(a.y, b.y, e) };
  }

  function buzz(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
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
        col: spec.col,
        g: spec.g || 0
      });
    }
  }

  function popup(x, y, text, col) {
    pops.push({ x: x, y: y, text: text, col: col, life: 0.7, max: 0.7 });
  }

  function flyFruit(x, y) {
    flies.push({
      sx: x,
      sy: y,
      x: x,
      y: y,
      t: 0,
      spin: rand(0, Math.PI * 2)
    });
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.3 + 0.25,
        a: Math.random() * 0.4 + 0.06,
        p: Math.random() * Math.PI * 2
      });
    }
  }

  function makeMoths() {
    moths.length = 0;
    for (let i = 0; i < 12; i++) {
      moths.push({
        x: Math.random(),
        y: Math.random(),
        p: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 0.8,
        col: i % 2 ? 'cyan' : 'pink'
      });
    }
  }

  function makeSpeck() {
    speck.length = 0;
    for (let i = 0; i < COLS * ROWS; i++) {
      const dots = [];
      const n = 7 + ((hash(i) * 5) | 0);
      for (let k = 0; k < n; k++) {
        dots.push({
          u: hash(i * 19 + k) * 0.72 + 0.14,
          v: hash(i * 31 + k + 3) * 0.72 + 0.14,
          r: 0.7 + hash(i * 11 + k) * 1.4
        });
      }
      speck.push(dots);
    }
  }

  function neighbors(x, y) {
    const out = [];
    if (x > 0) out.push(tile(x - 1, y));
    if (x < COLS - 1) out.push(tile(x + 1, y));
    if (y > 0) out.push(tile(x, y - 1));
    if (y < ROWS - 1) out.push(tile(x, y + 1));
    return out;
  }

  function cargoPath() {
    const vis = new Int8Array(COLS * ROWS);
    const prev = new Int16Array(COLS * ROWS);
    prev.fill(-1);
    const q = [];
    for (let y = 0; y < ROWS; y++) {
      const c = tile(0, y);
      if (c && c.k !== 'vine') {
        const i = y * COLS;
        vis[i] = 1;
        q.push(i);
      }
    }
    if (!q.length) return { ok: false, route: [] };
    let found = -1;
    const dx = [1, -1, 0, 0];
    const dy = [0, 0, 1, -1];
    for (let qi = 0; qi < q.length; qi++) {
      const i = q[qi];
      const x = i % COLS;
      const y = (i / COLS) | 0;
      if (x === COLS - 1) {
        found = i;
        break;
      }
      for (let d = 0; d < 4; d++) {
        const nx = x + dx[d];
        const ny = y + dy[d];
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        const ni = ny * COLS + nx;
        if (vis[ni]) continue;
        const c = tiles[ni];
        if (c.k === 'vine') continue;
        vis[ni] = 1;
        prev[ni] = i;
        q.push(ni);
      }
    }
    if (found < 0) return { ok: false, route: [] };
    const route = [];
    for (let i = found; i >= 0; i = prev[i]) {
      route.push({ x: i % COLS, y: (i / COLS) | 0 });
      if (prev[i] < 0) break;
    }
    route.reverse();
    return { ok: true, route: route };
  }

  function walkPath(tx, ty) {
    if (tx === G.px && ty === G.py) return [];
    const vis = new Int8Array(COLS * ROWS);
    const prev = new Int16Array(COLS * ROWS);
    prev.fill(-1);
    const q = [G.py * COLS + G.px];
    vis[G.py * COLS + G.px] = 1;
    const dx = [1, -1, 0, 0];
    const dy = [0, 0, 1, -1];
    let found = -1;
    for (let qi = 0; qi < q.length; qi++) {
      const i = q[qi];
      const x = i % COLS;
      const y = (i / COLS) | 0;
      if (x === tx && y === ty) {
        found = i;
        break;
      }
      for (let d = 0; d < 4; d++) {
        const nx = x + dx[d];
        const ny = y + dy[d];
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        const ni = ny * COLS + nx;
        if (vis[ni]) continue;
        vis[ni] = 1;
        prev[ni] = i;
        q.push(ni);
      }
    }
    if (found < 0) return [];
    const steps = [];
    for (let i = found; i >= 0; i = prev[i]) {
      steps.push({ x: i % COLS, y: (i / COLS) | 0 });
      if (prev[i] < 0) break;
    }
    steps.reverse();
    return steps.slice(1);
  }

  function hitCell(px, py) {
    const s = layout.size;
    const g = layout.gap;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const x0 = layout.x0 + x * (s + g);
        const y0 = layout.y0 + y * (s + g);
        if (px >= x0 - 2 && py >= y0 - 2 && px <= x0 + s + 2 && py <= y0 + s + 2) {
          return { x: x, y: y };
        }
      }
    }
    return null;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rr);
    else {
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
  }

  function fillRound(x, y, w, h, r) {
    roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const top = Math.max(78, H * 0.11);
    const bot = Math.max(52, H * 0.09);
    const pad = 12;
    const cw = W - pad * 2;
    const ch = H - top - bot;
    const gap = W < 420 ? 5 : 8;
    let side = W < 400 ? 18 : W < 720 ? 44 : 64;

    function fit(sd) {
      const innerW = cw - (sd > 0 ? sd * 2 + 14 : 0);
      return Math.min(
        (innerW - gap * (COLS - 1)) / COLS,
        (ch - gap * (ROWS - 1)) / ROWS
      );
    }

    let size = fit(side);
    if (size < 50 && side > 26) {
      side = 24;
      size = fit(side);
    }
    if (size < 42) {
      side = 0;
      size = fit(0);
    }
    size = clamp(size, 34, 168);

    const boardW = size * COLS + gap * (COLS - 1);
    const boardH = size * ROWS + gap * (ROWS - 1);
    const extra = side > 0 ? side * 2 + 10 : 0;
    const x0 = (W - boardW - extra) / 2 + (side > 0 ? side + 5 : 0);
    const y0 = top + (ch - boardH) / 2;

    layout.size = size;
    layout.gap = gap;
    layout.boardW = boardW;
    layout.boardH = boardH;
    layout.side = side;
    layout.x0 = x0;
    layout.y0 = y0;
    layout.gateX = x0 - 5 - (side || size * 0.42) / 2;
    layout.gateY = y0 + boardH / 2;
    layout.shrineX = x0 + boardW + 5 + (side || size * 0.42) / 2;
    layout.shrineY = y0 + boardH / 2;
  }

  function resetTiles(kind) {
    tiles.length = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        tiles.push({
          x: x,
          y: y,
          k: 'empty',
          age: 0,
          shake: 0,
          pulse: hash(x * 10 + y) * 6.2,
          born: 0
        });
      }
    }
    if (kind === 'play') {
      const a = tile(1, 1);
      a.k = 'sprout';
      a.age = 1.72;
      const v = tile(4, 0);
      v.k = 'vine';
      v.age = 8;
      v.born = 1;
    } else {
      const demo = [
        [0, 1, 'seed', 0.4],
        [1, 0, 'sprout', 1.6],
        [1, 2, 'ripe', 3.1],
        [2, 1, 'sprout', 1.2],
        [3, 1, 'ripe', 3.6],
        [3, 3, 'seed', 0.2],
        [4, 0, 'vine', 8],
        [4, 2, 'vine', 8],
        [0, 3, 'sprout', 2.0]
      ];
      for (let i = 0; i < demo.length; i++) {
        const d = demo[i];
        const c = tile(d[0], d[1]);
        c.k = d[2];
        c.age = d[3];
        if (c.k === 'vine') c.born = 1;
      }
    }
  }

  function resetRun() {
    G.t = 0;
    G.remain = SEASON;
    G.crop = 0;
    G.cuts = 0;
    G.planted = 0;
    G.px = 2;
    G.py = 2;
    G.fx = 2;
    G.fy = 2;
    G.moveT = 0;
    G.face = 0;
    G.snip = 0;
    G.lock = INPUT_LOCK;
    G.spreadT = SPREAD_EVERY;
    G.spreadAim = null;
    G.grace = 0;
    G.shake = 0;
    G.flash = 0;
    G.walkQ = [];
    G.autoAct = false;
    G.result = '';
    G.ripePing = 0;
    particles.length = 0;
    flies.length = 0;
    pops.length = 0;
    resetTiles('play');
    const info = cargoPath();
    G.pathOk = info.ok;
    G.route = info.route;
    keys.u = keys.d = keys.l = keys.r = false;
    ptr.down = false;
    ptr.id = null;
  }

  function showPanel(kind) {
    panel.classList.remove('hidden');
    card.classList.remove('win', 'lose');
    if (kind === 'title') {
      kickerEl.textContent = 'SEED';
      titleEl.textContent = '剪苗';
      leadEl.innerHTML = '点土播种，熟了收割。<br />别让藤蔓堵住通往粮仓的路。';
      metaEl.textContent = '收满 12 颗。通路被堵或时节耗尽则败。';
      btnMain.textContent = '下田';
      footEl.textContent = '方向键走动 · 空格动作 · M 静音';
    } else if (kind === 'win') {
      card.classList.add('win');
      kickerEl.textContent = 'FULL BARN';
      titleEl.textContent = '满仓';
      leadEl.textContent = '熟果入仓，粮道还亮着。';
      metaEl.textContent =
        '收成 ' +
        G.crop +
        ' · 用时 ' +
        G.t.toFixed(1) +
        ' 秒 · 剪藤 ' +
        G.cuts;
      btnMain.textContent = '再来一局';
      footEl.textContent = '空格 / 回车 · R 重开';
    } else {
      card.classList.add('lose');
      const blocked = G.result === 'block';
      kickerEl.textContent = blocked ? 'OVERGROWN' : 'FROST';
      titleEl.textContent = blocked ? '堵路' : '季末';
      leadEl.textContent = blocked
        ? '藤蔓封死了通往粮仓的路。'
        : '时节尽了，熟果还没收满。';
      metaEl.textContent =
        '收成 ' + G.crop + '/' + GOAL + ' · 存活 ' + G.t.toFixed(1) + ' 秒 · 剪藤 ' + G.cuts;
      btnMain.textContent = '再来一局';
      footEl.textContent = '空格 / 回车 · R 重开';
    }
  }

  function startPlay() {
    audio.ensure();
    audio.pulse('start');
    resetRun();
    G.mode = 'play';
    panel.classList.add('hidden');
    hud.classList.remove('hidden');
    hintEl.textContent = '点土播种 · 熟了收割 · 藤蔓要剪';
    hintEl.className = 'hint';
    syncHud();
  }

  function endGame(win, why) {
    if (G.mode !== 'play') return;
    G.mode = win ? 'win' : 'lose';
    G.result = why;
    G.walkQ = [];
    G.autoAct = false;
    hud.classList.add('hidden');
    if (win) {
      audio.pulse('win');
      const p = farmerPos();
      emit(28, {
        x: layout.shrineX,
        y: layout.shrineY,
        j: 10,
        vx0: -70,
        vx1: 70,
        vy0: -110,
        vy1: -10,
        life: 0.95,
        r0: 2,
        r1: 5,
        col: 'gold',
        g: 40
      });
      emit(12, {
        x: p.x,
        y: p.y,
        j: 8,
        vx0: -40,
        vx1: 40,
        vy0: -60,
        vy1: 20,
        life: 0.7,
        r0: 1.5,
        r1: 3.5,
        col: 'cyan'
      });
    } else {
      audio.pulse('lose');
      G.flash = 1;
      G.flashC = 'pink';
      G.shake = 9;
      emit(36, {
        x: layout.x0 + layout.boardW / 2,
        y: layout.y0 + layout.boardH / 2,
        j: 40,
        vx0: -140,
        vx1: 140,
        vy0: -90,
        vy1: 80,
        life: 1.05,
        r0: 2,
        r1: 6,
        col: 'pink'
      });
    }
    audio.stopDrone();
    showPanel(G.mode);
  }

  function becomeVine(c, fromSpread) {
    if (!c || c.k === 'vine') return;
    c.k = 'vine';
    c.age = T_VINE;
    c.born = 0;
    c.shake = 1;
    const p = cellCenter(c.x, c.y);
    emit(10, {
      x: p.x,
      y: p.y,
      j: 8,
      vx0: -50,
      vx1: 50,
      vy0: -70,
      vy1: 20,
      life: 0.55,
      r0: 1.2,
      r1: 3,
      col: 'pink'
    });
    audio.pulse(fromSpread ? 'spread' : 'vine');
    G.shake = Math.max(G.shake, fromSpread ? 3.5 : 5);
    G.flash = 0.45;
    G.flashC = 'pink';
  }

  function pickSpread() {
    const vines = [];
    for (let i = 0; i < tiles.length; i++) if (tiles[i].k === 'vine') vines.push(tiles[i]);
    if (!vines.length) return null;
    for (let n = vines.length - 1; n > 0; n--) {
      const j = (Math.random() * (n + 1)) | 0;
      const tmp = vines[n];
      vines[n] = vines[j];
      vines[j] = tmp;
    }
    for (let i = 0; i < vines.length; i++) {
      const v = vines[i];
      const nbs = neighbors(v.x, v.y).filter(function (c) {
        return c && (c.k === 'empty' || c.k === 'seed' || c.k === 'sprout');
      });
      if (!nbs.length) continue;
      const t = nbs[(Math.random() * nbs.length) | 0];
      return { fx: v.x, fy: v.y, tx: t.x, ty: t.y };
    }
    return null;
  }

  function heldDir() {
    if (keys.l && !keys.r) return [-1, 0];
    if (keys.r && !keys.l) return [1, 0];
    if (keys.u && !keys.d) return [0, -1];
    if (keys.d && !keys.u) return [0, 1];
    return null;
  }

  function tryMove(dx, dy) {
    if (G.moveT > 0) return false;
    const nx = G.px + dx;
    const ny = G.py + dy;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false;
    G.fx = G.px;
    G.fy = G.py;
    G.px = nx;
    G.py = ny;
    G.moveT = MOVE;
    G.face = dx === 1 ? 0 : dx === -1 ? 2 : dy === 1 ? 1 : 3;
    audio.pulse('step');
    return true;
  }

  function actHere() {
    if (G.lock > 0) return;
    const c = tile(G.px, G.py);
    if (!c) return;
    const p = cellCenter(c.x, c.y);
    if (c.k === 'empty') {
      c.k = 'seed';
      c.age = 0;
      c.shake = 0.4;
      G.planted++;
      audio.pulse('plant');
      emit(8, {
        x: p.x,
        y: p.y + layout.size * 0.12,
        j: 6,
        vx0: -20,
        vx1: 20,
        vy0: -40,
        vy1: -8,
        life: 0.4,
        r0: 1,
        r1: 2.4,
        col: 'cyan'
      });
      popup(p.x, p.y - 8, '种', '#00f0ff');
    } else if (c.k === 'ripe') {
      c.k = 'empty';
      c.age = 0;
      G.crop++;
      audio.pulse('harvest');
      buzz(10);
      flyFruit(p.x, p.y);
      emit(14, {
        x: p.x,
        y: p.y,
        j: 6,
        vx0: -55,
        vx1: 55,
        vy0: -90,
        vy1: -10,
        life: 0.55,
        r0: 1.4,
        r1: 3.4,
        col: 'gold',
        g: 50
      });
      popup(p.x, p.y - 10, '+1', '#ffe36b');
      G.flash = 0.28;
      G.flashC = 'gold';
      if (G.crop >= GOAL) {
        endGame(true, 'full');
        return;
      }
    } else if (c.k === 'vine') {
      c.k = 'empty';
      c.age = 0;
      c.born = 0;
      G.cuts++;
      G.snip = 1;
      audio.pulse('cut');
      buzz(8);
      emit(12, {
        x: p.x,
        y: p.y,
        j: 8,
        vx0: -80,
        vx1: 80,
        vy0: -70,
        vy1: 30,
        life: 0.5,
        r0: 1.2,
        r1: 3.2,
        col: 'pink'
      });
      popup(p.x, p.y - 8, '剪', '#ff3db8');
      if (G.spreadAim && G.spreadAim.fx === c.x && G.spreadAim.fy === c.y) G.spreadAim = null;
    } else {
      audio.pulse('no');
      c.shake = 1;
      popup(p.x, p.y - 6, '未熟', '#9aa0c8');
    }
  }

  function orderWalk(tx, ty) {
    const steps = walkPath(tx, ty);
    G.walkQ = steps;
    const c = tile(tx, ty);
    G.autoAct = !!(c && (c.k === 'empty' || c.k === 'ripe' || c.k === 'vine'));
    if (!steps.length) {
      if (tx === G.px && ty === G.py) actHere();
      return;
    }
    if (G.moveT <= 0) {
      const s = G.walkQ.shift();
      tryMove(s.x - G.px, s.y - G.py);
    }
  }

  function swipeMove(dx, dy) {
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return false;
    G.autoAct = false;
    const mx = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0;
    const my = mx === 0 ? (dy > 0 ? 1 : -1) : 0;
    if (G.moveT > 0) {
      const nx = G.px + mx;
      const ny = G.py + my;
      G.walkQ = nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS ? [{ x: nx, y: ny }] : [];
      return true;
    }
    G.walkQ = [];
    tryMove(mx, my);
    return true;
  }

  function countKind(k) {
    let n = 0;
    for (let i = 0; i < tiles.length; i++) if (tiles[i].k === k) n++;
    return n;
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.t += dt;
    G.remain = Math.max(0, SEASON - G.t);
    G.snip = Math.max(0, G.snip - dt * 4.2);

    if (G.moveT > 0) {
      G.moveT -= dt;
      if (G.moveT <= 0) {
        G.moveT = 0;
        G.fx = G.px;
        G.fy = G.py;
        if (G.walkQ.length) {
          const s = G.walkQ.shift();
          tryMove(s.x - G.px, s.y - G.py);
        } else if (G.autoAct) {
          G.autoAct = false;
          actHere();
          if (G.mode !== 'play') return;
        }
      }
    } else {
      const dir = heldDir();
      if (dir) {
        G.walkQ = [];
        G.autoAct = false;
        tryMove(dir[0], dir[1]);
      }
    }

    const haste = 1 + G.crop * 0.028;
    let newRipe = 0;
    for (let i = 0; i < tiles.length; i++) {
      const c = tiles[i];
      c.shake = Math.max(0, c.shake - dt * 3.4);
      c.born = Math.min(1, c.born + dt * 1.8);
      if (c.k === 'seed' || c.k === 'sprout' || c.k === 'ripe') {
        const was = c.k;
        c.age += dt * haste;
        if (c.age >= T_VINE) becomeVine(c, false);
        else if (c.age >= T_RIPE) {
          c.k = 'ripe';
          if (was !== 'ripe') newRipe++;
        } else if (c.age >= T_SPROUT) c.k = 'sprout';
      }
    }
    if (newRipe) {
      audio.pulse('ripe');
      G.ripePing = 1;
    }
    G.ripePing = Math.max(0, G.ripePing - dt * 2);

    G.spreadT -= dt;
    if (G.spreadT < SPREAD_WIND && !G.spreadAim) G.spreadAim = pickSpread();
    if (G.spreadAim) {
      const src = tile(G.spreadAim.fx, G.spreadAim.fy);
      const dst = tile(G.spreadAim.tx, G.spreadAim.ty);
      if (!src || src.k !== 'vine' || !dst || dst.k === 'vine' || dst.k === 'ripe') {
        G.spreadAim = pickSpread();
      }
    }
    if (G.spreadT <= 0) {
      if (G.spreadAim) {
        const dst = tile(G.spreadAim.tx, G.spreadAim.ty);
        if (dst && (dst.k === 'empty' || dst.k === 'seed' || dst.k === 'sprout')) {
          becomeVine(dst, true);
        }
      }
      G.spreadAim = null;
      G.spreadT = Math.max(1.55, SPREAD_EVERY - G.crop * 0.045);
    }

    const info = cargoPath();
    G.route = info.route;
    G.pathOk = info.ok;
    if (!info.ok) {
      G.grace += dt;
      if (G.t - (G._warnAt || -1) > 0.36) {
        G._warnAt = G.t;
        audio.pulse('warn');
        G.shake = Math.max(G.shake, 2.4);
      }
      if (G.grace >= GRACE) {
        endGame(false, 'block');
        return;
      }
    } else {
      G.grace = 0;
    }

    if (G.remain <= 0 && G.mode === 'play') {
      endGame(false, 'time');
      return;
    }

    audio.tickDrone(!G.pathOk, countKind('ripe'));
  }

  function updateFx(dt) {
    G.clock += dt;
    G.shake = Math.max(0, G.shake - dt * 10);
    G.flash = Math.max(0, G.flash - dt * 2.6);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = flies.length - 1; i >= 0; i--) {
      const f = flies[i];
      f.t += dt * 1.55;
      const u = smooth(clamp(f.t, 0, 1));
      f.x = mix(f.sx, layout.shrineX, u);
      f.y = mix(f.sy, layout.shrineY, u) - Math.sin(u * Math.PI) * 46;
      f.spin += dt * 8;
      if (f.t >= 1) {
        emit(8, {
          x: layout.shrineX,
          y: layout.shrineY,
          j: 6,
          vx0: -30,
          vx1: 30,
          vy0: -50,
          vy1: 10,
          life: 0.4,
          r0: 1.2,
          r1: 2.8,
          col: 'gold'
        });
        flies.splice(i, 1);
      }
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.life -= dt;
      p.y -= 38 * dt;
      if (p.life <= 0) pops.splice(i, 1);
    }
    if (G.mode === 'title') {
      for (let i = 0; i < tiles.length; i++) {
        const c = tiles[i];
        if (c.k === 'seed' || c.k === 'sprout' || c.k === 'ripe') {
          c.age += dt * 0.35;
          if (c.age >= T_VINE) c.age = T_RIPE + 0.2;
          else if (c.age >= T_RIPE) c.k = 'ripe';
          else if (c.age >= T_SPROUT) c.k = 'sprout';
        }
        c.born = 1;
      }
    }
  }

  function syncHud() {
    cropEl.textContent = G.crop + '/' + GOAL;
    timeEl.textContent = G.remain.toFixed(1);
    const vines = countKind('vine');
    cropRead.classList.remove('warn', 'danger');
    if (G.crop >= GOAL - 2 && G.crop < GOAL) cropRead.classList.add('warn');

    timeRead.classList.remove('warn', 'danger');
    if (G.remain < 8) timeRead.classList.add('danger');
    else if (G.remain < 16) timeRead.classList.add('warn');

    pathRead.classList.remove('warn', 'danger');
    if (!G.pathOk) {
      pathHud.textContent = '堵';
      pathRead.classList.add('danger');
    } else if (vines >= 4) {
      pathHud.textContent = '危';
      pathRead.classList.add('warn');
    } else {
      pathHud.textContent = '通';
    }

    const here = tile(G.px, G.py);
    const ripeN = countKind('ripe');
    if (!G.pathOk) {
      hintEl.textContent = '通路堵住 · 快剪开粮道';
      hintEl.className = 'hint warn';
    } else if (G.remain < 8) {
      hintEl.textContent = '时节将尽';
      hintEl.className = 'hint warn';
    } else if (here && here.k === 'ripe') {
      hintEl.textContent = '熟了 · 收割';
      hintEl.className = 'hint ripe';
    } else if (here && here.k === 'vine') {
      hintEl.textContent = '剪掉堵路的藤';
      hintEl.className = 'hint cut';
    } else if (here && here.k === 'empty') {
      hintEl.textContent = '点土播种';
      hintEl.className = 'hint ok';
    } else if (here && (here.k === 'seed' || here.k === 'sprout')) {
      hintEl.textContent = '等待成熟';
      hintEl.className = 'hint';
    } else if (ripeN) {
      hintEl.textContent = '有熟果 · 去收';
      hintEl.className = 'hint ripe';
    } else {
      hintEl.textContent = '点土播种 · 熟了收割 · 藤蔓要剪';
      hintEl.className = 'hint';
    }
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(-24, -24, W + 48, H + 48);
    const g1 = ctx.createRadialGradient(W * 0.18, H * 0.1, 0, W * 0.18, H * 0.1, W * 0.75);
    g1.addColorStop(0, 'rgba(255,61,184,0.16)');
    g1.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(W * 0.86, H * 0.88, 0, W * 0.86, H * 0.88, W * 0.7);
    g2.addColorStop(0, 'rgba(0,240,255,0.13)');
    g2.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.5 + 0.5 * Math.sin(G.clock * 1.5 + s.p);
      ctx.fillStyle = 'rgba(246,243,255,' + s.a * tw + ')';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,0.055)';
    ctx.lineWidth = 1;
    const rib = Math.max(28, W / 14);
    for (let x = rib * 0.4; x < W; x += rib) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x * 0.96 + W * 0.02, H);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,61,184,0.04)';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.18);
    ctx.quadraticCurveTo(W * 0.5, H * 0.08, W, H * 0.18);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < moths.length; i++) {
      const m = moths[i];
      const mx = (m.x + Math.sin(G.clock * 0.22 + m.p) * 0.08) * W;
      const my = (m.y + Math.cos(G.clock * 0.17 + m.p * 1.3) * 0.06) * H;
      const flap = 0.55 + 0.45 * Math.sin(G.clock * 11 + m.p);
      ctx.fillStyle = m.col === 'cyan' ? 'rgba(0,240,255,0.28)' : 'rgba(255,61,184,0.28)';
      ctx.beginPath();
      ctx.ellipse(mx - 3 * m.s, my, 4.2 * m.s * flap, 2.1 * m.s, -0.4, 0, Math.PI * 2);
      ctx.ellipse(mx + 3 * m.s, my, 4.2 * m.s * flap, 2.1 * m.s, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGate() {
    const x = layout.gateX;
    const y = layout.gateY;
    const h = layout.boardH * 0.72;
    const w = Math.max(18, layout.side || layout.size * 0.4);
    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,0.55)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.28, y + h * 0.42);
    ctx.lineTo(x - w * 0.28, y - h * 0.28);
    ctx.moveTo(x + w * 0.28, y + h * 0.42);
    ctx.lineTo(x + w * 0.28, y - h * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.42, y - h * 0.22);
    ctx.lineTo(x + w * 0.42, y - h * 0.22);
    ctx.moveTo(x - w * 0.34, y - h * 0.32);
    ctx.lineTo(x + w * 0.34, y - h * 0.32);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 13px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('入', x, y - 4);
    ctx.restore();
  }

  function drawShrine() {
    const x = layout.shrineX;
    const y = layout.shrineY;
    const h = layout.boardH * 0.62;
    const w = Math.max(20, layout.side || layout.size * 0.42);
    ctx.save();
    ctx.strokeStyle = G.pathOk ? 'rgba(255,227,107,0.7)' : 'rgba(255,61,184,0.7)';
    ctx.shadowColor = G.pathOk ? '#ffe36b' : '#ff3db8';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.38, y + h * 0.38);
    ctx.lineTo(x + w * 0.38, y + h * 0.38);
    ctx.moveTo(x - w * 0.22, y + h * 0.38);
    ctx.lineTo(x - w * 0.16, y - h * 0.02);
    ctx.lineTo(x + w * 0.16, y - h * 0.02);
    ctx.lineTo(x + w * 0.22, y + h * 0.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.3, y - h * 0.02);
    ctx.lineTo(x, y - h * 0.22);
    ctx.lineTo(x + w * 0.3, y - h * 0.02);
    ctx.stroke();
    const fill = G.mode === 'play' || G.mode === 'win' ? G.crop : 5;
    const n = Math.min(GOAL, fill);
    for (let i = 0; i < n; i++) {
      const row = (i / 4) | 0;
      const col = i % 4;
      const px = x + (col - 1.5) * 6;
      const py = y + h * 0.28 - row * 7;
      ctx.fillStyle = i % 2 ? '#ffe36b' : '#ff3db8';
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = G.pathOk ? '#ffe36b' : '#ff3db8';
    ctx.font = 'bold 13px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('仓', x, y - h * 0.36);
    ctx.restore();
  }

  function drawRibbon() {
    if (!G.route || G.route.length < 2) return;
    ctx.save();
    const ok = G.pathOk;
    const pulse = 0.35 + 0.25 * Math.sin(G.clock * (ok ? 2.2 : 8));
    ctx.strokeStyle = ok
      ? 'rgba(0,240,255,' + (0.18 + pulse * 0.15) + ')'
      : 'rgba(255,61,184,' + (0.4 + pulse * 0.3) + ')';
    ctx.lineWidth = Math.max(3, layout.size * 0.08);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(layout.gateX + 8, layout.gateY);
    for (let i = 0; i < G.route.length; i++) {
      const p = cellCenter(G.route[i].x, G.route[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(layout.shrineX - 8, layout.shrineY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawTimerArc(c, cx, cy, r) {
    if (c.k !== 'seed' && c.k !== 'sprout' && c.k !== 'ripe') return;
    ctx.save();
    ctx.lineWidth = Math.max(2, layout.size * 0.045);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    if (c.k === 'ripe') {
      const u = clamp((c.age - T_RIPE) / (T_VINE - T_RIPE), 0, 1);
      ctx.strokeStyle = '#ff3db8';
      ctx.shadowColor = '#ff3db8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u);
      ctx.stroke();
    } else {
      const u = clamp(c.age / T_RIPE, 0, 1);
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSeed(cx, cy, s, t, h) {
    const pulse = 1 + Math.sin(t * 5 + h * 8) * 0.1;
    ctx.save();
    ctx.fillStyle = 'rgba(0,240,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.16, s * 0.18 * pulse, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.1, s * 0.11 * pulse, s * 0.08 * pulse, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSprout(cx, cy, s, t, h) {
    const sway = Math.sin(t * 2.4 + h * 6) * 0.18;
    ctx.save();
    ctx.translate(cx, cy + s * 0.18);
    ctx.rotate(sway);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = Math.max(1.6, s * 0.035);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.04, -s * 0.18, 0, -s * 0.32);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,240,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.12, -s * 0.22, s * 0.13, s * 0.07, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,61,184,0.75)';
    ctx.beginPath();
    ctx.ellipse(s * 0.12, -s * 0.26, s * 0.12, s * 0.065, 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRipe(cx, cy, s, t, h) {
    const bob = Math.sin(t * 4.2 + h * 5) * s * 0.03;
    const glow = 0.55 + 0.45 * Math.sin(t * 6 + h);
    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.fillStyle = 'rgba(255,227,107,' + (0.12 + glow * 0.12) + ')';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
    const grd = ctx.createRadialGradient(-s * 0.06, -s * 0.08, s * 0.04, 0, 0, s * 0.2);
    grd.addColorStop(0, '#fff6c8');
    grd.addColorStop(0.45, '#ffe36b');
    grd.addColorStop(1, '#ff3db8');
    ctx.fillStyle = grd;
    ctx.shadowColor = '#ffe36b';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, s * 0.02, s * 0.175, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.16);
    ctx.quadraticCurveTo(s * 0.08, -s * 0.28, s * 0.14, -s * 0.22);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.05, -s * 0.02, s * 0.05, s * 0.03, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawVine(cx, cy, s, t, idx, born) {
    ctx.save();
    ctx.translate(cx, cy);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const base = hash(idx * 7 + i) * Math.PI * 2;
      const len = s * (0.22 + hash(idx * 3 + i) * 0.2) * born;
      const wob = Math.sin(t * 2.1 + i + idx) * 0.35;
      ctx.strokeStyle = i % 2 ? 'rgba(255,61,184,0.95)' : 'rgba(255,90,170,0.8)';
      ctx.lineWidth = Math.max(1.5, s * 0.04);
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ff3db8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.12);
      const steps = 5;
      for (let k = 1; k <= steps; k++) {
        const u = k / steps;
        const a = base + wob * u + Math.sin(t * 1.6 + i + u * 3) * 0.25 * u;
        const r = len * u;
        ctx.lineTo(Math.cos(a) * r, s * 0.12 - r * 0.35 + Math.sin(a) * r * 0.55);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#00f0ff';
      const a2 = base + wob + 0.2;
      const tx = Math.cos(a2) * len * 0.72;
      const ty = s * 0.12 - len * 0.25 + Math.sin(a2) * len * 0.4;
      ctx.beginPath();
      ctx.arc(tx, ty, Math.max(1.1, s * 0.025), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,61,184,0.55)';
    ctx.beginPath();
    ctx.arc(0, s * 0.14, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTiles() {
    const s = layout.size;
    const g = layout.gap;
    for (let i = 0; i < tiles.length; i++) {
      const c = tiles[i];
      const x0 = layout.x0 + c.x * (s + g);
      const y0 = layout.y0 + c.y * (s + g);
      const sh = c.shake ? Math.sin(G.clock * 40) * c.shake * 2.2 : 0;
      const on = c.x === G.px && c.y === G.py && G.mode === 'play';
      ctx.save();
      ctx.translate(sh, 0);

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      fillRound(x0 - 2, y0 - 2, s + 4, s + 4, 14);

      const soil = ctx.createLinearGradient(x0, y0, x0, y0 + s);
      soil.addColorStop(0, '#1a1228');
      soil.addColorStop(1, '#0c0816');
      ctx.fillStyle = soil;
      fillRound(x0, y0, s, s, 12);

      ctx.strokeStyle = on
        ? 'rgba(0,240,255,0.85)'
        : c.k === 'vine'
          ? 'rgba(255,61,184,0.55)'
          : c.k === 'ripe'
            ? 'rgba(255,227,107,0.5)'
            : 'rgba(0,240,255,0.16)';
      ctx.lineWidth = on ? 2.2 : 1.2;
      ctx.shadowColor = on ? '#00f0ff' : c.k === 'vine' ? '#ff3db8' : 'transparent';
      ctx.shadowBlur = on || c.k === 'vine' || c.k === 'ripe' ? 10 : 0;
      roundRect(x0, y0, s, s, 12);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const dots = speck[i];
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let k = 0; k < dots.length; k++) {
        ctx.beginPath();
        ctx.arc(x0 + dots[k].u * s, y0 + dots[k].v * s, dots[k].r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(x0 + s / 2, y0 + s * 0.58, s * 0.22, s * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();

      if (c.k === 'vine') {
        ctx.fillStyle = 'rgba(255,61,184,0.1)';
        fillRound(x0 + 3, y0 + 3, s - 6, s - 6, 10);
      }

      const cx = x0 + s / 2;
      const cy = y0 + s / 2;
      if (c.k === 'seed') drawSeed(cx, cy, s, G.clock, c.pulse);
      else if (c.k === 'sprout') drawSprout(cx, cy, s, G.clock, c.pulse);
      else if (c.k === 'ripe') drawRipe(cx, cy, s, G.clock, c.pulse);
      else if (c.k === 'vine') drawVine(cx, cy, s, G.clock, i, c.born);

      drawTimerArc(c, cx, cy, s * 0.42);
      ctx.restore();
    }
  }

  function drawSpreadAim() {
    if (!G.spreadAim || G.spreadT > SPREAD_WIND) return;
    const a = cellCenter(G.spreadAim.fx, G.spreadAim.fy);
    const b = cellCenter(G.spreadAim.tx, G.spreadAim.ty);
    const u = clamp(1 - G.spreadT / SPREAD_WIND, 0, 1);
    const x = mix(a.x, b.x, u);
    const y = mix(a.y, b.y, u);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,61,184,' + (0.35 + u * 0.55) + ')';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mix(a.x, b.x, 0.5), mix(a.y, b.y, 0.5) - 18, x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.arc(x, y, 3.5 + u * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFarmer() {
    const p = farmerPos();
    const s = layout.size;
    const bob = Math.sin(G.clock * (G.moveT > 0 ? 16 : 5)) * (G.moveT > 0 ? 2.4 : 1.1);
    const onVine = tile(G.px, G.py) && tile(G.px, G.py).k === 'vine';
    ctx.save();
    ctx.translate(p.x, p.y + s * 0.16 + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.28, s * 0.16, s * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = onVine ? '#ff7ad0' : '#c8f8ff';
    ctx.shadowColor = onVine ? '#ff3db8' : '#00f0ff';
    ctx.shadowBlur = 12;
    roundRect(-s * 0.09, -s * 0.02, s * 0.18, s * 0.22, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.095, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#05030c';
    const look = G.face === 2 ? -s * 0.03 : G.face === 0 ? s * 0.03 : 0;
    ctx.beginPath();
    ctx.arc(look - s * 0.03, -s * 0.11, 1.5, 0, Math.PI * 2);
    ctx.arc(look + s * 0.03, -s * 0.11, 1.5, 0, Math.PI * 2);
    ctx.fill();

    const sn = G.snip;
    const open = mix(0.55, 0.12, sn);
    ctx.save();
    ctx.translate(s * 0.12, s * 0.02);
    ctx.rotate(G.face === 2 ? 2.6 : G.face === 1 ? 1.2 : G.face === 3 ? -1.1 : 0.2);
    ctx.strokeStyle = '#ffe36b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.16, -s * 0.08 * open);
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.16, s * 0.08 * open);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawFlies() {
    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.spin);
      ctx.fillStyle = '#ffe36b';
      ctx.shadowColor = '#ffe36b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle =
        p.col === 'cyan'
          ? 'rgba(0,240,255,' + a + ')'
          : p.col === 'gold'
            ? 'rgba(255,227,107,' + a + ')'
            : 'rgba(255,61,184,' + a + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + a), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPops() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.col;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    const shaking = G.shake && (G.mode === 'play' || G.mode === 'lose');
    const sx = shaking ? (Math.random() - 0.5) * G.shake : 0;
    const sy = shaking ? (Math.random() - 0.5) * G.shake : 0;
    ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
    drawBg();
    drawGate();
    drawShrine();
    drawRibbon();
    drawTiles();
    drawSpreadAim();
    drawFlies();
    drawFarmer();
    drawParticles();
    drawPops();

    if (G.flash > 0) {
      const c =
        G.flashC === 'gold'
          ? 'rgba(255,227,107,'
          : G.flashC === 'cyan'
            ? 'rgba(0,240,255,'
            : 'rgba(255,61,184,';
      ctx.fillStyle = c + G.flash * 0.22 + ')';
      ctx.fillRect(-sx, -sy, W, H);
    }
    if (G.mode === 'play' && !G.pathOk) {
      ctx.strokeStyle = 'rgba(255,61,184,' + (0.28 + 0.28 * Math.sin(G.clock * 9)) + ')';
      ctx.lineWidth = 7;
      ctx.strokeRect(4, 4, W - 8, H - 8);
    }
  }

  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    if (!G.paused) {
      if (G.mode === 'play') {
        updatePlay(dt);
        if (G.mode === 'play') syncHud();
      }
      updateFx(dt);
    }
    draw();
    requestAnimationFrame(frame);
  }

  function isUi(el) {
    return !!(el && el.closest && el.closest('button'));
  }

  function onPointerDown(e) {
    if (isUi(e.target)) return;
    audio.ensure();
    if (G.mode !== 'play') {
      startPlay();
      e.preventDefault();
      return;
    }
    if (ptr.id != null && ptr.id !== e.pointerId) return;
    ptr.id = e.pointerId;
    ptr.down = true;
    ptr.x = ptr.sx = e.clientX;
    ptr.y = ptr.sy = e.clientY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!ptr.down || e.pointerId !== ptr.id) return;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && G.mode === 'play' && G.lock <= 0) {
      const dx = ptr.x - ptr.sx;
      const dy = ptr.y - ptr.sy;
      if (!swipeMove(dx, dy)) {
        const cell = hitCell(ptr.sx, ptr.sy);
        if (cell) orderWalk(cell.x, cell.y);
      }
    }
    ptr.down = false;
    ptr.id = null;
  }

  function bindKey(k, on) {
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = on;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = on;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = on;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = on;
  }

  function onKeyDown(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (k === 'r' || k === 'R') {
      if (G.mode === 'play' || G.mode === 'win' || G.mode === 'lose') {
        audio.ensure();
        startPlay();
        e.preventDefault();
      }
      return;
    }
    bindKey(k, true);
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
    }
    if (G.mode === 'play' && !e.repeat) {
      const dir =
        k === 'ArrowUp' || k === 'w' || k === 'W'
          ? [0, -1]
          : k === 'ArrowDown' || k === 's' || k === 'S'
            ? [0, 1]
            : k === 'ArrowLeft' || k === 'a' || k === 'A'
              ? [-1, 0]
              : k === 'ArrowRight' || k === 'd' || k === 'D'
                ? [1, 0]
                : null;
      if (dir) {
        G.walkQ = [];
        G.autoAct = false;
        tryMove(dir[0], dir[1]);
      }
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        startPlay();
        return;
      }
      if (G.mode === 'play') {
        G.walkQ = [];
        G.autoAct = false;
        actHere();
      }
    }
  }

  function onKeyUp(e) {
    bindKey(e.key, false);
  }

  btnMain.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    startPlay();
  });
  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    startPlay();
  });
  btnMute.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);
  window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });
  window.addEventListener(
    'touchmove',
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    last = performance.now();
    if (G.paused) {
      ptr.down = false;
      keys.u = keys.d = keys.l = keys.r = false;
    }
  });

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) {}

  makeStars();
  makeMoths();
  makeSpeck();
  resetTiles('title');
  resize();
  (function () {
    const info = cargoPath();
    G.pathOk = info.ok;
    G.route = info.route;
  })();
  showPanel('title');
  requestAnimationFrame(function (t) {
    last = t;
    requestAnimationFrame(frame);
  });
})();
