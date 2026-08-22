'use strict';

(function () {
  const COLS = 21;
  const ROWS = 13;
  const EMPTY = 0;
  const WALL = 1;
  const DOOR = 2;
  const LIVES = 3;
  const DOOR_W = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_SPD = 4.88;
  const P_R = 0.3;
  const B_R = 0.32;
  const O_R = 0.46;
  const P_SHOT = 18.6;
  const B_SHOT = 8.4;
  const COMBO_WIN = 1.55;
  const BEST_KEY = 'playbox-berzerk-run-best';
  const MUTE_KEY = 'playbox-berzerk-run-mute';
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OCT = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];
  const DOOR_C0 = (COLS - DOOR_W) >> 1;
  const DOOR_R0 = (ROWS - DOOR_W) >> 1;
  const OPS = 'WASD / 方向键走 · 空格或点按开火 · 出门进下一廊 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 58, 74];
  const HOT2 = [255, 107, 120];
  const WHT = [246, 243, 255];
  const BOT_RGB = [
    [255, 210, 70],
    [255, 122, 28],
    [255, 80, 170],
    [80, 220, 255]
  ];

  const ROOMS = [
    { name: '入口', robots: 4, density: 0.13, spd: 1.58, fire: 1.72, otto: 22 },
    { name: '窄廊', robots: 5, density: 0.18, spd: 1.72, fire: 1.52, otto: 20 },
    { name: '十字', robots: 6, density: 0.16, spd: 1.86, fire: 1.38, otto: 18 },
    { name: '机群', robots: 7, density: 0.2, spd: 2.02, fire: 1.22, otto: 16.4 },
    { name: '暗室', robots: 8, density: 0.22, spd: 2.16, fire: 1.08, otto: 15 },
    { name: '围猎', robots: 9, density: 0.21, spd: 2.32, fire: 0.98, otto: 13.8 },
    { name: '狂奔', robots: 10, density: 0.24, spd: 2.48, fire: 0.9, otto: 12.8 },
    { name: '终廊', robots: 11, density: 0.27, spd: 2.68, fire: 0.8, otto: 12 }
  ];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function idx(c, r) {
    return r * COLS + c;
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function snap8(dx, dy) {
    if (dx === 0 && dy === 0) return OCT[0];
    let oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    if (oct < 0) oct += 8;
    if (oct === 8) oct = 0;
    return OCT[oct];
  }
  function aligned8(dx, dy) {
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (adx * adx + ady * ady < 0.16) return false;
    if (adx < 0.38 || ady < 0.38) return true;
    return Math.abs(adx - ady) < 0.48;
  }
  function opp(side) {
    if (side === 'n') return 's';
    if (side === 's') return 'n';
    if (side === 'e') return 'w';
    return 'e';
  }
  function doorCenter(side) {
    if (side === 'n') return { x: DOOR_C0 + DOOR_W * 0.5, y: 1.45 };
    if (side === 's') return { x: DOOR_C0 + DOOR_W * 0.5, y: ROWS - 1.45 };
    if (side === 'w') return { x: 1.45, y: DOOR_R0 + DOOR_W * 0.5 };
    return { x: COLS - 1.45, y: DOOR_R0 + DOOR_W * 0.5 };
  }
  function inDoorLane(c, r) {
    const dc1 = DOOR_C0 + DOOR_W - 1;
    const dr1 = DOOR_R0 + DOOR_W - 1;
    if (r <= 2 && c >= DOOR_C0 && c <= dc1) return true;
    if (r >= ROWS - 3 && c >= DOOR_C0 && c <= dc1) return true;
    if (c <= 2 && r >= DOOR_R0 && r <= dr1) return true;
    if (c >= COLS - 3 && r >= DOOR_R0 && r <= dr1) return true;
    return false;
  }
  function isDoorCell(c, r) {
    if (r === 0 || r === ROWS - 1) return c >= DOOR_C0 && c < DOOR_C0 + DOOR_W;
    if (c === 0 || c === COLS - 1) return r >= DOOR_R0 && r < DOOR_R0 + DOOR_W;
    return false;
  }
  function rngSeed(n) {
    let a = (n >>> 0) || 1;
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function circleRect(cx, cy, rad, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < rad * rad;
  }

  function cellAt(x, y) {
    const c = x | 0;
    const r = y | 0;
    if (!inb(c, r)) return WALL;
    return G.grid[idx(c, r)];
  }

  function blocked(x, y, rad, doorsSolid) {
    const c0 = Math.max(0, (x - rad) | 0);
    const r0 = Math.max(0, (y - rad) | 0);
    const c1 = Math.min(COLS - 1, (x + rad) | 0);
    const r1 = Math.min(ROWS - 1, (y + rad) | 0);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = G.grid[idx(c, r)];
        if (t === WALL || (doorsSolid && t === DOOR)) {
          if (circleRect(x, y, rad, c, r, 1, 1)) return true;
        }
      }
    }
    return false;
  }

  function hasLOS(x0, y0, x1, y1) {
    const dist = hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, dist / 0.22 | 0);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const g = cellAt(x, y);
      if (g === WALL || g === DOOR) return false;
    }
    return true;
  }

  function floodReach(grid, sc, sr) {
    const seen = new Uint8Array(COLS * ROWS);
    const q = [sc, sr];
    seen[idx(sc, sr)] = 1;
    let qi = 0;
    while (qi < q.length) {
      const c = q[qi++];
      const r = q[qi++];
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d];
        const nr = r + DY[d];
        if (!inb(nc, nr) || seen[idx(nc, nr)]) continue;
        if (grid[idx(nc, nr)] === WALL) continue;
        seen[idx(nc, nr)] = 1;
        q.push(nc, nr);
      }
    }
    return seen;
  }

  function carveLine(grid, c0, r0, c1, r1) {
    let c = c0;
    let r = r0;
    let guard = 80;
    while ((c !== c1 || r !== r1) && guard-- > 0) {
      if (c !== c1) c += c1 > c ? 1 : -1;
      else r += r1 > r ? 1 : -1;
      if (c > 0 && r > 0 && c < COLS - 1 && r < ROWS - 1) {
        if (grid[idx(c, r)] === WALL) grid[idx(c, r)] = EMPTY;
      }
    }
  }

  function punchDoors(grid) {
    for (let i = 0; i < DOOR_W; i++) {
      grid[idx(DOOR_C0 + i, 0)] = DOOR;
      grid[idx(DOOR_C0 + i, ROWS - 1)] = DOOR;
      grid[idx(0, DOOR_R0 + i)] = DOOR;
      grid[idx(COLS - 1, DOOR_R0 + i)] = DOOR;
    }
  }

  function genMaze(seed, density) {
    const grid = new Uint8Array(COLS * ROWS);
    const rng = rngSeed(seed);
    for (let c = 0; c < COLS; c++) {
      grid[idx(c, 0)] = WALL;
      grid[idx(c, ROWS - 1)] = WALL;
    }
    for (let r = 0; r < ROWS; r++) {
      grid[idx(0, r)] = WALL;
      grid[idx(COLS - 1, r)] = WALL;
    }
    punchDoors(grid);

    const attempts = 12 + (density * 48) | 0;
    for (let i = 0; i < attempts; i++) {
      const horiz = rng() < 0.5;
      const len = 2 + (rng() * 4) | 0;
      if (horiz) {
        const r = 2 + (rng() * (ROWS - 4)) | 0;
        const c = 2 + (rng() * Math.max(1, COLS - 4 - len)) | 0;
        for (let k = 0; k < len; k++) {
          const cc = c + k;
          if (!inb(cc, r) || inDoorLane(cc, r)) continue;
          if (cc <= 0 || cc >= COLS - 1) continue;
          grid[idx(cc, r)] = WALL;
        }
      } else {
        const c = 2 + (rng() * (COLS - 4)) | 0;
        const r = 2 + (rng() * Math.max(1, ROWS - 4 - len)) | 0;
        for (let k = 0; k < len; k++) {
          const rr = r + k;
          if (!inb(c, rr) || inDoorLane(c, rr)) continue;
          if (rr <= 0 || rr >= ROWS - 1) continue;
          grid[idx(c, rr)] = WALL;
        }
      }
    }

    const blocks = 2 + (density * 10) | 0;
    for (let i = 0; i < blocks; i++) {
      const c = 3 + (rng() * (COLS - 7)) | 0;
      const r = 3 + (rng() * (ROWS - 7)) | 0;
      if (inDoorLane(c, r) || inDoorLane(c + 1, r)) continue;
      grid[idx(c, r)] = WALL;
      if (rng() < 0.7) grid[idx(c + 1, r)] = WALL;
      if (rng() < 0.55) grid[idx(c, r + 1)] = WALL;
    }

    const spawnC = 1;
    const spawnR = DOOR_R0 + 1;
    if (grid[idx(spawnC, spawnR)] === WALL) grid[idx(spawnC, spawnR)] = EMPTY;
    const targets = [
      [DOOR_C0 + 1, 1],
      [DOOR_C0 + 1, ROWS - 2],
      [1, DOOR_R0 + 1],
      [COLS - 2, DOOR_R0 + 1]
    ];
    let seen = floodReach(grid, spawnC, spawnR);
    for (let i = 0; i < targets.length; i++) {
      const tc = targets[i][0];
      const tr = targets[i][1];
      if (grid[idx(tc, tr)] === WALL) grid[idx(tc, tr)] = EMPTY;
      if (!seen[idx(tc, tr)]) {
        carveLine(grid, spawnC, spawnR, tc, tr);
        seen = floodReach(grid, spawnC, spawnR);
      }
    }
    punchDoors(grid);
    return grid;
  }

  function mazeOk(grid) {
    if (grid[idx(0, 0)] !== WALL) return false;
    if (grid[idx(DOOR_C0 + 1, 0)] !== DOOR) return false;
    if (grid[idx(0, DOOR_R0 + 1)] !== DOOR) return false;
    const seen = floodReach(grid, 1, DOOR_R0 + 1);
    if (!seen[idx(COLS - 2, DOOR_R0 + 1)]) return false;
    if (!seen[idx(DOOR_C0 + 1, 1)]) return false;
    if (!seen[idx(DOOR_C0 + 1, ROWS - 2)]) return false;
    return true;
  }

  function selfCheck() {
    const s = snap8(10, 0);
    if (s[0] !== 1 || s[1] !== 0) throw new Error('snap8 east');
    const n = snap8(0, -4);
    if (n[0] !== 0 || n[1] !== -1) throw new Error('snap8 north');
    const ne = snap8(3, -3);
    if (ne[0] !== 1 || ne[1] !== -1) throw new Error('snap8 ne');
    if (!aligned8(4, 0.1) || !aligned8(2, 2.1)) throw new Error('aligned8');
    for (let i = 0; i < 36; i++) {
      const dens = 0.12 + (i % 6) * 0.03;
      const g = genMaze(13 * i + 7, dens);
      if (!mazeOk(g)) throw new Error('maze connectivity seed ' + i);
    }
    return true;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
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
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
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
    zap() {
      this.ensure();
      this.beep(980, 0.055, 'square', 0.05, 240);
      this.beep(1480, 0.04, 'sawtooth', 0.03, 520);
    },
    botZap() {
      this.ensure();
      this.beep(240, 0.07, 'sawtooth', 0.04, 110);
    },
    boom() {
      this.ensure();
      this.noise(0.12, 0.06, 280);
      this.beep(220, 0.14, 'sawtooth', 0.05, 60);
    },
    wallZap() {
      this.ensure();
      this.noise(0.05, 0.035, 900);
      this.beep(420, 0.04, 'triangle', 0.025, 160);
    },
    thump() {
      this.ensure();
      this.beep(68, 0.1, 'sine', 0.08, 42);
      this.noise(0.06, 0.04, 180);
    },
    otto() {
      this.ensure();
      this.beep(392, 0.12, 'square', 0.05, 330);
      this.beep(523, 0.18, 'square', 0.045, 262);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.055, 70);
      this.noise(0.12, 0.05, 400);
    },
    door() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 660);
      this.beep(784, 0.12, 'triangle', 0.035);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.26, 'triangle', 0.05, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.045, 90);
      this.beep(140, 0.3, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    }
  };

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnCampaign = el('btn-campaign');
  const btnEndless = el('btn-endless');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeCamp = el('mode-camp');
  const modeEnd = el('mode-end');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const stageEl = el('stage');
  const padEl = el('pad');
  const padBtns = {
    up: el('btn-up'),
    down: el('btn-down'),
    left: el('btn-left'),
    right: el('btn-right'),
    fire: el('btn-fire')
  };

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cell = 32;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let fireHold = false;

  const keys = { u: false, d: false, l: false, r: false };
  const ptr = { down: false, id: null, sx: 0, sy: 0, x: 0, y: 0, dragging: false, dx: 0, dy: 0 };
  const pips = [];
  const particles = [];
  const pops = [];
  const motes = [];
  const lasers = [];
  const rings = [];

  const G = {
    mode: 'title',
    kind: 'campaign',
    t: 0,
    clock: 0,
    stage: 0,
    wave: 1,
    roomId: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    grid: new Uint8Array(COLS * ROWS),
    bots: [],
    shots: [],
    pShot: null,
    otto: null,
    ottoT: 20,
    ottoWarned: false,
    cleared: false,
    startBots: 0,
    botSpd: 1.6,
    botFire: 1.6,
    player: { x: 1.5, y: 6.5, fx: 1, fy: 0, walk: 0, squash: 0 },
    entry: 'w',
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    toastT: 0,
    deadT: 0,
    ready: 0,
    why: '',
    punch: 1
  };

  if (!hasDom) {
    selfCheck();
    return;
  }

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(n) && n > 0 ? n : 0;
    } catch (err) {
      G.best = 0;
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n, x, y) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox && scoreAdd) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
      addTok += 1;
      const tok = addTok;
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      scoreAdd.style.animation = 'none';
      void scoreAdd.offsetWidth;
      scoreAdd.style.animation = '';
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    if (x != null) spawnPop(x, y, '+' + n, GOLD);
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIVES) {
      const iel = document.createElement('i');
      iel.className = 'pip on';
      pipsEl.appendChild(iel);
      pips.push(iel);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncModes() {
    if (modeCamp) modeCamp.setAttribute('aria-pressed', G.kind === 'campaign' ? 'true' : 'false');
    if (modeEnd) modeEnd.setAttribute('aria-pressed', G.kind === 'endless' ? 'true' : 'false');
  }

  function liveBots() {
    let n = 0;
    for (let i = 0; i < G.bots.length; i++) if (G.bots[i].alive) n += 1;
    return n;
  }

  function specNow() {
    if (G.kind === 'campaign') return ROOMS[Math.min(G.stage, ROOMS.length - 1)];
    const w = G.wave;
    return {
      name: '第 ' + w + ' 廊',
      robots: Math.min(12, 3 + ((w - 1) * 0.85) | 0),
      density: Math.min(0.26, 0.11 + (w - 1) * 0.012),
      spd: Math.min(3.15, 1.52 + (w - 1) * 0.11),
      fire: Math.max(0.72, 1.7 - (w - 1) * 0.08),
      otto: Math.max(6.2, 11.5 - (w - 1) * 0.55)
    };
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    if (stageLabel) {
      if (G.kind === 'endless') {
        stageLabel.textContent = G.mode === 'title' ? '无尽' : ('无尽 第 ' + G.wave + ' 廊');
      } else {
        const st = ROOMS[Math.min(G.stage, ROOMS.length - 1)];
        stageLabel.textContent = G.mode === 'title'
          ? '闯关'
          : ('闯关 ' + (G.stage + 1) + '/' + ROOMS.length + ' · ' + st.name);
      }
      stageLabel.classList.toggle('hot', G.combo >= 3);
    }
    if (tagLabel) {
      if (G.otto) {
        tagLabel.textContent = 'OTTO';
        tagLabel.className = 'hot';
      } else {
        const s = Math.max(0, Math.ceil(G.ottoT));
        tagLabel.textContent = 'Otto ' + s;
        tagLabel.className = G.ottoT < 4 ? 'warn' : '';
      }
    }
    syncPips();
    syncModes();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function showOverlay(kind) {
    if (!overlay || !panel) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind !== 'title');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'title') {
      if (ovKicker) ovKicker.textContent = 'BZERK';
      if (ovTitle) ovTitle.textContent = '狂廊';
      if (ovLead) ovLead.innerHTML = '迷宫里八向跑、瞄准开火。<br />打掉机器人，别被围住。停太久，Otto 会弹进来。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = '廊清了';
      if (ovLead) ovLead.textContent = '八条廊都跑出来了。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来一轮';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '被围住了';
      const tail = G.kind === 'endless' ? ('撑到第 ' + G.wave + ' 廊。') : '';
      if (ovLead) ovLead.textContent = tail + '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
  }

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function screenFlash(rgb, a) {
    G.flash = a;
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        t: spec.life,
        life: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
  }

  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85, life: 0.85 });
  }

  function spawnRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
  }

  function showChain(n) {
    if (!chainPop || REDUCE) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(4, G.combo >> 1);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) showChain(G.mult);
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    lasers.length = 0;
    rings.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function spawnBots(n, px, py) {
    G.bots = [];
    let tries = 0;
    while (G.bots.length < n && tries < 220) {
      tries += 1;
      const c = 2 + (Math.random() * (COLS - 4)) | 0;
      const r = 2 + (Math.random() * (ROWS - 4)) | 0;
      if (G.grid[idx(c, r)] !== EMPTY) continue;
      if (inDoorLane(c, r)) continue;
      const x = c + 0.5;
      const y = r + 0.5;
      if (hypot(x - px, y - py) < 4.2) continue;
      let near = false;
      for (let i = 0; i < G.bots.length; i++) {
        if (hypot(x - G.bots[i].x, y - G.bots[i].y) < 1.35) near = true;
      }
      if (near) continue;
      const rgb = BOT_RGB[G.bots.length % BOT_RGB.length];
      const face = snap8(px - x, py - y);
      G.bots.push({
        x: x,
        y: y,
        fx: face[0],
        fy: face[1],
        r: B_R,
        alive: true,
        cd: rand(0.35, 1.1),
        thinkT: rand(0, 0.2),
        walk: rand(0, TAU),
        rgb: rgb,
        shot: false
      });
    }
    G.startBots = G.bots.length;
  }

  function buildRoom(entry) {
    const spec = specNow();
    G.entry = entry || 'w';
    const seed0 = G.roomId * 7919 + (G.kind === 'endless' ? 17 : 3) + G.wave * 13;
    G.grid = genMaze(seed0, spec.density);
    for (let a = 1; a < 8 && !mazeOk(G.grid); a++) {
      G.grid = genMaze(seed0 + a * 97, spec.density);
    }
    G.botSpd = spec.spd;
    G.botFire = spec.fire;
    G.ottoT = spec.otto;
    G.otto = null;
    G.ottoWarned = false;
    G.cleared = false;
    G.shots = [];
    G.pShot = null;
    const pos = doorCenter(G.entry);
    G.player.x = pos.x;
    G.player.y = pos.y;
    if (G.entry === 'w') { G.player.fx = 1; G.player.fy = 0; }
    else if (G.entry === 'e') { G.player.fx = -1; G.player.fy = 0; }
    else if (G.entry === 'n') { G.player.fx = 0; G.player.fy = 1; }
    else { G.player.fx = 0; G.player.fy = -1; }
    spawnBots(spec.robots, G.player.x, G.player.y);
    G.ready = 0.42;
    G.invuln = 0.55;
    resetFx();
  }

  function startGame(kind) {
    G.kind = kind === 'endless' ? 'endless' : 'campaign';
    G.mode = 'play';
    G.stage = 0;
    G.wave = 1;
    G.roomId = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.deadT = 0;
    G.why = '';
    buildRoom('w');
    hideOverlay();
    audio.start();
    const spec = specNow();
    toast(G.kind === 'endless' ? '无尽 · Otto 来得更早' : ('闯关 · ' + spec.name), false, G.kind !== 'endless');
    setHint(G.kind === 'endless' ? '无尽廊 · Otto 更快 · 别停' : '八向跑打 · 出门进廊 · 别被围住', G.kind === 'endless' ? 'warn' : '');
    syncHud();
  }

  function startCampaign() { startGame('campaign'); }
  function startEndless() { startGame('endless'); }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'campaign';
    G.stage = 0;
    G.wave = 1;
    G.roomId = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    buildRoom('w');
    G.invuln = 99;
    G.ottoT = 8;
    showOverlay('title');
    setHint('WASD 八向走 · 空格开火 · 出门进下一廊 · 别被围住');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    startGame(G.kind);
  }

  function winRun() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.45);
    hitStop(0.08);
    showOverlay('win');
    setHint('廊清了 · R 再来', 'hot');
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    fireHold = false;
    audio.lose();
    kick('die');
    screenFlash(MAG, 0.5);
    hitStop(0.08);
    showOverlay('lose');
    setHint('R 重开随时可用', 'warn');
    syncHud();
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.deadT = 0.85;
    G.lives -= 1;
    G.pShot = null;
    G.shots = [];
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    audio.hurt();
    kick('die');
    screenFlash(MAG, 0.42);
    hitStop(0.07);
    G.shake = Math.max(G.shake, 8);
    emit(22, {
      x: G.player.x, y: G.player.y, j: 0.18,
      vx0: -7, vx1: 7, vy0: -8, vy1: 5,
      life: 0.45, r0: 0.04, r1: 0.12, rgb: CYN, g: 6
    });
    spawnRing(G.player.x, G.player.y, MAG);
    G.why = why;
    toast(why, true, false);
    syncHud();
  }

  function finishDeath() {
    if (G.lives <= 0) {
      loseRun(G.why || '被围住了');
      return;
    }
    const pos = doorCenter(G.entry);
    G.player.x = pos.x;
    G.player.y = pos.y;
    G.invuln = 1.4;
    G.deadT = 0;
    G.ready = 0.18;
    toast('剩余 ' + G.lives + ' 命', true, false);
    syncHud();
  }

  function killBot(bot, how) {
    if (!bot.alive) return;
    bot.alive = false;
    audio.boom();
    emit(18, {
      x: bot.x, y: bot.y, j: 0.16,
      vx0: -8, vx1: 8, vy0: -9, vy1: 5,
      life: 0.42, r0: 0.04, r1: 0.13, rgb: bot.rgb, g: 7
    });
    spawnRing(bot.x, bot.y, bot.rgb);
    if (G.mode !== 'play') return;
    const wall = how === 'wall';
    const crash = how === 'crash';
    const base = wall ? 20 : crash ? 70 : 50;
    bumpCombo();
    addScore(base * G.mult, bot.x, bot.y);
    hitStop(0.032 + Math.min(0.046, G.combo * 0.006));
    G.shake = Math.max(G.shake, 4 + Math.min(4, G.combo));
    G.punch = 0.97;
    kick('boom');
    if (liveBots() === 0 && !G.cleared) {
      G.cleared = true;
      const bonus = 100 + 20 * G.startBots;
      addScore(bonus, G.player.x, G.player.y - 0.6);
      toast('廊清了 · 快走', false, true);
      audio.door();
    }
  }

  function firePlayer(dx, dy) {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    if (G.pShot) return;
    const s = snap8(dx, dy);
    const len = hypot(s[0], s[1]) || 1;
    const ux = s[0] / len;
    const uy = s[1] / len;
    G.player.fx = s[0];
    G.player.fy = s[1];
    G.pShot = {
      x: G.player.x + ux * 0.42,
      y: G.player.y + uy * 0.42,
      vx: ux * P_SHOT,
      vy: uy * P_SHOT,
      from: 'p',
      rgb: CYN
    };
    audio.zap();
    screenFlash(CYN, 0.12);
    G.punch = 0.984;
    lasers.push({
      x: G.player.x,
      y: G.player.y,
      ux: ux,
      uy: uy,
      t: 0.09,
      rgb: CYN
    });
    emit(5, {
      x: G.player.x + ux * 0.4, y: G.player.y + uy * 0.4, j: 0.04,
      vx0: ux * 2, vx1: ux * 6, vy0: uy * 2, vy1: uy * 6,
      life: 0.16, r0: 0.03, r1: 0.07, rgb: CYN, g: 0
    });
  }

  function fireBot(bot) {
    if (bot.shot || bot.cd > 0) return;
    const s = snap8(G.player.x - bot.x, G.player.y - bot.y);
    const len = hypot(s[0], s[1]) || 1;
    const ux = s[0] / len;
    const uy = s[1] / len;
    bot.fx = s[0];
    bot.fy = s[1];
    G.shots.push({
      x: bot.x + ux * 0.38,
      y: bot.y + uy * 0.38,
      vx: ux * B_SHOT,
      vy: uy * B_SHOT,
      from: 'b',
      rgb: MAG,
      owner: bot
    });
    bot.shot = true;
    bot.cd = G.botFire * rand(0.75, 1.2);
    audio.botZap();
    lasers.push({ x: bot.x, y: bot.y, ux: ux, uy: uy, t: 0.06, rgb: MAG });
  }

  function spawnOtto() {
    if (G.otto) return;
    const sides = ['n', 's', 'e', 'w'];
    let side = sides[(Math.random() * 4) | 0];
    if (side === G.entry) side = opp(side);
    const pos = doorCenter(side);
    const dir = snap8(G.player.x - pos.x, G.player.y - pos.y);
    const len = hypot(dir[0], dir[1]) || 1;
    const spd = G.kind === 'endless' ? 3.4 : 3.05;
    G.otto = {
      x: pos.x,
      y: pos.y,
      vx: dir[0] / len * spd,
      vy: dir[1] / len * spd,
      squash: 0,
      r: O_R
    };
    audio.otto();
    kick('thump');
    screenFlash(GOLD, 0.38);
    hitStop(0.05);
    toast('Otto 来了', true, false);
    spawnRing(pos.x, pos.y, GOLD);
  }

  function tryMove(ent, dx, dy, rad, doorsSolid) {
    const nx = ent.x + dx;
    const ny = ent.y + dy;
    if (!blocked(nx, ent.y, rad, doorsSolid)) ent.x = nx;
    if (!blocked(ent.x, ny, rad, doorsSolid)) ent.y = ny;
  }

  function worldFromPtr(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / Math.max(1, rect.width));
    const y = (clientY - rect.top) * (H / Math.max(1, rect.height));
    return { x: (x - ox) / cell, y: (y - oy) / cell };
  }

  function playerDir() {
    let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    let my = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    if (ptr.dragging) {
      mx = ptr.dx;
      my = ptr.dy;
    }
    return { mx: mx, my: my };
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    G.player.squash = Math.max(0, G.player.squash - dt * 4);
    const dir = playerDir();
    let mx = dir.mx;
    let my = dir.my;
    if (mx || my) {
      const s = snap8(mx, my);
      const len = hypot(s[0], s[1]) || 1;
      mx = s[0] / len;
      my = s[1] / len;
      G.player.fx = s[0];
      G.player.fy = s[1];
      G.player.walk += dt * 14;
      tryMove(G.player, mx * P_SPD * dt, my * P_SPD * dt, P_R, false);
    }
    if (fireHold) firePlayer(G.player.fx, G.player.fy);
  }

  function updateBots(dt) {
    const p = G.player;
    for (let i = 0; i < G.bots.length; i++) {
      const bot = G.bots[i];
      if (!bot.alive) continue;
      bot.cd = Math.max(0, bot.cd - dt);
      bot.thinkT -= dt;
      bot.walk += dt * 10;
      const dx = p.x - bot.x;
      const dy = p.y - bot.y;
      if (G.mode === 'play' && G.deadT <= 0 && G.ready <= 0) {
        if (aligned8(dx, dy) && hasLOS(bot.x, bot.y, p.x, p.y) && bot.cd <= 0) {
          fireBot(bot);
        }
      }
      if (bot.thinkT <= 0) {
        bot.thinkT = 0.16 + Math.random() * 0.22;
        const cands = [
          snap8(dx + rand(-0.35, 0.35), dy + rand(-0.35, 0.35)),
          snap8(dx, 0),
          snap8(0, dy),
          snap8(-dy, dx),
          snap8(dy, -dx)
        ];
        let picked = null;
        for (let c = 0; c < cands.length; c++) {
          const face = cands[c];
          if (!face[0] && !face[1]) continue;
          if (!blocked(bot.x + face[0] * 0.62, bot.y + face[1] * 0.62, bot.r, true)) {
            picked = face;
            break;
          }
        }
        if (picked) {
          bot.fx = picked[0];
          bot.fy = picked[1];
        }
      }
      const len = hypot(bot.fx, bot.fy) || 1;
      const nx = bot.x + bot.fx / len * G.botSpd * dt;
      const ny = bot.y + bot.fy / len * G.botSpd * dt;
      if (blocked(nx, ny, bot.r, true)) {
        killBot(bot, 'wall');
        continue;
      }
      bot.x = nx;
      bot.y = ny;
    }

    for (let i = 0; i < G.bots.length; i++) {
      const a = G.bots[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < G.bots.length; j++) {
        const b = G.bots[j];
        if (!b.alive) continue;
        const d = hypot(a.x - b.x, a.y - b.y);
        if (d < a.r + b.r) {
          killBot(a, 'crash');
          killBot(b, 'crash');
        }
      }
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
      for (let i = 0; i < G.bots.length; i++) {
        const bot = G.bots[i];
        if (!bot.alive) continue;
        if (hypot(bot.x - p.x, bot.y - p.y) < bot.r + P_R) {
          hurtPlayer('撞上了');
          break;
        }
      }
    }
  }

  function updateOtto(dt) {
    if (!G.otto) {
      if (G.mode === 'play') {
        G.ottoT -= dt;
        if (!G.ottoWarned && G.ottoT < 3.2) {
          G.ottoWarned = true;
          toast('Otto 要来了', true, false);
          audio.beep(330, 0.12, 'square', 0.04, 220);
        }
        if (G.ottoT <= 0) spawnOtto();
      }
      return;
    }
    const o = G.otto;
    G.ottoT -= dt;
    o.squash = Math.max(0, o.squash - dt * 5);
    const hom = G.kind === 'endless' ? 1.35 : 1.05;
    o.vx += Math.sign(G.player.x - o.x) * hom * dt;
    o.vy += Math.sign(G.player.y - o.y) * hom * dt;
    const age = Math.max(0, -G.ottoT);
    const cap = (G.kind === 'endless' ? 3.7 : 3.25) + Math.min(3.6, age * 0.22);
    const spd = hypot(o.vx, o.vy) || 1;
    if (spd > cap) {
      o.vx *= cap / spd;
      o.vy *= cap / spd;
    }
    const ox0 = o.x;
    const oy0 = o.y;
    o.x += o.vx * dt;
    if (blocked(o.x, o.y, o.r, true)) {
      o.x = ox0;
      o.vx = -o.vx;
      o.squash = 1;
      audio.thump();
      kick('thump');
      G.shake = Math.max(G.shake, 5);
      hitStop(0.028);
    }
    o.y += o.vy * dt;
    if (blocked(o.x, o.y, o.r, true)) {
      o.y = oy0;
      o.vy = -o.vy;
      o.squash = 1;
      audio.thump();
      kick('thump');
      G.shake = Math.max(G.shake, 5);
      hitStop(0.028);
    }
    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
      if (hypot(o.x - G.player.x, o.y - G.player.y) < o.r + P_R * 0.85) {
        hurtPlayer('Otto 到了');
      }
    }
  }

  function shotHitWall(s) {
    audio.wallZap();
    emit(6, {
      x: s.x, y: s.y, j: 0.05,
      vx0: -3, vx1: 3, vy0: -3, vy1: 3,
      life: 0.16, r0: 0.03, r1: 0.07, rgb: s.rgb, g: 0
    });
  }

  function updateShots(dt) {
    const steps = 3;
    const h = dt / steps;
    if (G.pShot) {
      const s = G.pShot;
      let live = true;
      for (let k = 0; k < steps && live; k++) {
        s.x += s.vx * h;
        s.y += s.vy * h;
        if (cellAt(s.x, s.y) === WALL || cellAt(s.x, s.y) === DOOR) {
          shotHitWall(s);
          live = false;
        } else {
          for (let i = 0; i < G.bots.length; i++) {
            const bot = G.bots[i];
            if (!bot.alive) continue;
            if (hypot(s.x - bot.x, s.y - bot.y) < bot.r + 0.12) {
              killBot(bot, 'shot');
              live = false;
              break;
            }
          }
        }
      }
      if (!live) G.pShot = null;
    }

    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      let live = true;
      for (let k = 0; k < steps && live; k++) {
        s.x += s.vx * h;
        s.y += s.vy * h;
        if (cellAt(s.x, s.y) === WALL || cellAt(s.x, s.y) === DOOR) {
          shotHitWall(s);
          live = false;
        } else if (G.pShot && hypot(s.x - G.pShot.x, s.y - G.pShot.y) < 0.22) {
          emit(8, {
            x: s.x, y: s.y, j: 0.06,
            vx0: -4, vx1: 4, vy0: -4, vy1: 4,
            life: 0.2, r0: 0.03, r1: 0.08, rgb: WHT, g: 0
          });
          audio.wallZap();
          G.pShot = null;
          live = false;
        } else {
          for (let b = 0; b < G.bots.length; b++) {
            const bot = G.bots[b];
            if (!bot.alive || bot === s.owner) continue;
            if (hypot(s.x - bot.x, s.y - bot.y) < bot.r + 0.12) {
              killBot(bot, 'shot');
              live = false;
              break;
            }
          }
          if (live && G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
            if (hypot(s.x - G.player.x, s.y - G.player.y) < P_R + 0.12) {
              hurtPlayer('击中了');
              live = false;
            }
          }
        }
      }
      if (!live) {
        if (s.owner) s.owner.shot = false;
        G.shots.splice(i, 1);
      }
    }
  }

  function checkExit() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    const p = G.player;
    let side = null;
    if (p.y < 0.62 && p.x >= DOOR_C0 && p.x <= DOOR_C0 + DOOR_W) side = 'n';
    else if (p.y > ROWS - 0.62 && p.x >= DOOR_C0 && p.x <= DOOR_C0 + DOOR_W) side = 's';
    else if (p.x < 0.62 && p.y >= DOOR_R0 && p.y <= DOOR_R0 + DOOR_W) side = 'w';
    else if (p.x > COLS - 0.62 && p.y >= DOOR_R0 && p.y <= DOOR_R0 + DOOR_W) side = 'e';
    if (!side) return;
    addScore(30);
    audio.door();
    if (G.kind === 'campaign' && G.stage >= ROOMS.length - 1) {
      winRun();
      return;
    }
    if (G.kind === 'campaign') G.stage += 1;
    else G.wave += 1;
    G.roomId += 1;
    G.comboT = Math.max(G.comboT, 0.6);
    buildRoom(opp(side));
    const spec = specNow();
    toast(G.kind === 'endless' ? spec.name : (spec.name + ' · 第 ' + (G.stage + 1) + ' 廊'), false, true);
    kick('win-flash');
    syncHud();
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.8);
    G.punch += (1 - G.punch) * Math.min(1, dt * 10);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.6);
      if (q.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const f = pops[i];
      f.t -= dt;
      f.y -= dt * 0.7;
      if (f.t <= 0) pops.splice(i, 1);
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      lasers[i].t -= dt;
      if (lasers[i].t <= 0) lasers.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.34) rings.splice(i, 1);
    }
  }

  function demoThink(dt) {
    if (G.t % 3 < dt) {
      const face = OCT[(Math.random() * 8) | 0];
      G.player.fx = face[0];
      G.player.fy = face[1];
    }
    tryMove(G.player, G.player.fx * 1.6 * dt, G.player.fy * 1.6 * dt, P_R, true);
    if (liveBots() < 2) spawnBots(4, G.player.x, G.player.y);
  }

  function playSim(dt) {
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.ready > 0) G.ready -= dt;
    updatePlayer(dt);
    updateBots(dt);
    updateShots(dt);
    updateOtto(dt);
    checkExit();
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.45);
      return;
    }
    if (G.mode === 'title') {
      demoThink(dt);
      G.mode = 'title';
      updateBots(dt);
      updateShots(dt);
      updateOtto(dt);
      updateFx(dt);
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateBots(dt);
      updateShots(dt);
      updateOtto(dt);
      if (G.deadT <= 0) finishDeath();
      updateFx(dt);
      syncHud();
      return;
    }
    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function sx(x) { return ox + x * cell; }
  function sy(y) { return oy + y * cell; }

  function drawGuy(x, y, fx, fy, rgb, walk, robot, ghost) {
    const px = sx(x);
    const py = sy(y);
    const s = cell;
    const a = ghost ? 0.45 + 0.35 * Math.sin(G.t * 18) : 1;
    const len = hypot(fx, fy) || 1;
    const ux = fx / len;
    const uy = fy / len;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = rgba(rgb, 0.75);
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.arc(px, py - s * 0.16, s * 0.13, 0, TAU);
    ctx.fill();
    ctx.fillRect(px - s * 0.07, py - s * 0.04, s * 0.14, s * 0.2);
    const swing = Math.sin(walk) * s * 0.07;
    ctx.fillRect(px - s * 0.1, py + s * 0.14, s * 0.07, s * 0.16 + swing);
    ctx.fillRect(px + s * 0.03, py + s * 0.14, s * 0.07, s * 0.16 - swing);
    ctx.strokeStyle = rgba(WHT, 0.95);
    ctx.lineWidth = Math.max(2, s * 0.055);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px + ux * s * 0.06, py + uy * s * 0.02);
    ctx.lineTo(px + ux * s * 0.28, py + uy * s * 0.28);
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (robot) {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.fillRect(px - s * 0.1, py - s * 0.2, s * 0.2, s * 0.055);
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(px - s * 0.02, py - s * 0.32, s * 0.04, s * 0.08);
    }
    ctx.restore();
  }

  function drawOtto(o) {
    const px = sx(o.x);
    const py = sy(o.y);
    const squash = 1 + o.squash * 0.28;
    const stretch = 1 - o.squash * 0.2;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(squash, stretch);
    ctx.shadowColor = rgba(GOLD, 0.9);
    ctx.shadowBlur = 18 * dpr;
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.42, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#05030c';
    ctx.fillRect(-cell * 0.16, -cell * 0.14, cell * 0.1, cell * 0.15);
    ctx.fillRect(cell * 0.06, -cell * 0.14, cell * 0.1, cell * 0.15);
    ctx.strokeStyle = '#05030c';
    ctx.lineWidth = Math.max(2, cell * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, cell * 0.05, cell * 0.18, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawShot(s) {
    const x1 = sx(s.x);
    const y1 = sy(s.y);
    const x0 = sx(s.x - s.vx * 0.045);
    const y0 = sy(s.y - s.vy * 0.045);
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(s.rgb, 0.28);
    ctx.lineWidth = cell * 0.22;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = rgba(s.rgb, 0.85);
    ctx.lineWidth = cell * 0.1;
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = cell * 0.045;
    ctx.stroke();
  }

  function drawMaze() {
    const cw = COLS * cell;
    const ch = ROWS * cell;
    ctx.fillStyle = '#08040c';
    ctx.fillRect(ox, oy, cw, ch);

    ctx.strokeStyle = 'rgba(255,58,74,0.05)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(ox + c * cell, oy);
      ctx.lineTo(ox + c * cell, oy + ch);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r * cell);
      ctx.lineTo(ox + cw, oy + r * cell);
      ctx.stroke();
    }

    const pulse = 0.35 + 0.28 * Math.sin(G.t * 5.2);
    const doorRgb = G.cleared ? CYN : HOT;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] !== DOOR) continue;
        ctx.fillStyle = rgba(doorRgb, 0.12 + pulse * 0.18);
        ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
      }
    }

    const inset = Math.max(1, cell * 0.07);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] !== WALL) continue;
        const x = ox + c * cell;
        const y = oy + r * cell;
        ctx.fillStyle = '#1a0810';
        ctx.fillRect(x + inset * 0.2, y + inset * 0.2, cell - inset * 0.4, cell - inset * 0.4);
      }
    }

    ctx.beginPath();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] !== WALL) continue;
        const x = ox + c * cell;
        const y = oy + r * cell;
        if (!inb(c, r - 1) || G.grid[idx(c, r - 1)] !== WALL) {
          ctx.moveTo(x + inset, y + inset);
          ctx.lineTo(x + cell - inset, y + inset);
        }
        if (!inb(c, r + 1) || G.grid[idx(c, r + 1)] !== WALL) {
          ctx.moveTo(x + inset, y + cell - inset);
          ctx.lineTo(x + cell - inset, y + cell - inset);
        }
        if (!inb(c - 1, r) || G.grid[idx(c - 1, r)] !== WALL) {
          ctx.moveTo(x + inset, y + inset);
          ctx.lineTo(x + inset, y + cell - inset);
        }
        if (!inb(c + 1, r) || G.grid[idx(c + 1, r)] !== WALL) {
          ctx.moveTo(x + cell - inset, y + inset);
          ctx.lineTo(x + cell - inset, y + cell - inset);
        }
      }
    }
    ctx.lineCap = 'square';
    ctx.strokeStyle = rgba(HOT, 0.55);
    ctx.lineWidth = Math.max(3.2, cell * 0.16);
    ctx.stroke();
    ctx.strokeStyle = rgba(HOT, 0.95);
    ctx.lineWidth = Math.max(1.6, cell * 0.08);
    ctx.stroke();
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, W, H);

    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake) * dpr * 0.35;
      shy = rand(-G.shake, G.shake) * dpr * 0.35;
    }
    ctx.save();
    ctx.translate(shx, shy);
    const punch = REDUCE ? 1 : G.punch;
    if (punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(punch, punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(HOT, m.a);
      ctx.beginPath();
      ctx.arc(m.x * W, ((m.y + G.t * 0.02 + m.p) % 1) * H, m.r, 0, TAU);
      ctx.fill();
    }

    drawMaze();

    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const k = rg.t / 0.34;
      ctx.strokeStyle = rgba(rg.rgb, 0.7 * (1 - k));
      ctx.lineWidth = Math.max(1.5, cell * 0.06 * (1 - k));
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), cell * (0.2 + k * 0.7), 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < lasers.length; i++) {
      const L = lasers[i];
      const a = L.t / 0.09;
      const x0 = sx(L.x);
      const y0 = sy(L.y);
      const x1 = sx(L.x + L.ux * 1.4);
      const y1 = sy(L.y + L.uy * 1.4);
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(L.rgb, 0.55 * a);
      ctx.lineWidth = cell * 0.28;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.9 * a);
      ctx.lineWidth = cell * 0.07;
      ctx.stroke();
    }

    if (G.pShot) drawShot(G.pShot);
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    for (let i = 0; i < G.bots.length; i++) {
      const bot = G.bots[i];
      if (!bot.alive) continue;
      drawGuy(bot.x, bot.y, bot.fx, bot.fy, bot.rgb, bot.walk, true, false);
    }

    if (G.deadT <= 0) {
      const ghost = G.invuln > 0;
      drawGuy(G.player.x, G.player.y, G.player.fx, G.player.fy, CYN, G.player.walk, false, ghost);
    }

    if (G.otto) drawOtto(G.otto);

    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.t / q.life;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), Math.max(1, q.r * cell * (0.6 + a)), 0, TAU);
      ctx.fill();
    }

    ctx.font = '700 ' + Math.max(11, cell * 0.38) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const f = pops[i];
      const a = f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }

    if (G.flash > 0 && !REDUCE) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);
    }

    ctx.restore();
  }

  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (overlayBlocksPlay()) return;
    e.preventDefault();
    const w = worldFromPtr(e.clientX, e.clientY);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.sx = w.x;
    ptr.sy = w.y;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.dragging = false;
    ptr.dx = 0;
    ptr.dy = 0;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }

  function onPointerMove(e) {
    if (!ptr.down || (ptr.id != null && e.pointerId !== ptr.id)) return;
    const w = worldFromPtr(e.clientX, e.clientY);
    ptr.x = w.x;
    ptr.y = w.y;
    const dx = w.x - ptr.sx;
    const dy = w.y - ptr.sy;
    if (hypot(dx, dy) > 0.35) {
      ptr.dragging = true;
      const s = snap8(dx, dy);
      ptr.dx = s[0];
      ptr.dy = s[1];
    }
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && !ptr.dragging && !overlayBlocksPlay()) {
      const dx = ptr.x - G.player.x;
      const dy = ptr.y - G.player.y;
      if (hypot(dx, dy) > 0.05) firePlayer(dx, dy);
      else firePlayer(G.player.fx, G.player.fy);
    }
    ptr.down = false;
    ptr.dragging = false;
    ptr.dx = 0;
    ptr.dy = 0;
    ptr.id = null;
  }

  function setKey(dir, down) {
    if (dir === 'up') keys.u = down;
    if (dir === 'down') keys.d = down;
    if (dir === 'left') keys.l = down;
    if (dir === 'right') keys.r = down;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS';
    const isLf = k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (isUp || isDn || isLf || isRt || isSp) e.preventDefault();
    if (isUp) setKey('up', down);
    if (isDn) setKey('down', down);
    if (isLf) setKey('left', down);
    if (isRt) setKey('right', down);
    if (isSp) fireHold = down;
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (e.repeat) return;
    if (isSp || k === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON') return;
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
    }
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    const start = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (dir === 'fire') {
        if (!overlayBlocksPlay()) firePlayer(G.player.fx, G.player.fy);
        fireHold = true;
        btn.classList.add('held');
        return;
      }
      setKey(dir, true);
      btn.classList.add('held');
    };
    const end = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dir === 'fire') {
        fireHold = false;
        btn.classList.remove('held');
        return;
      }
      setKey(dir, false);
      btn.classList.remove('held');
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 26; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.5, 1.6) * dpr,
        a: rand(0.03, 0.1),
        p: rand(0, 1)
      });
    }
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const pad = 10 * dpr;
    cell = Math.max(12, Math.min((W - pad * 2) / COLS, (H - pad * 2) / ROWS));
    ox = (W - COLS * cell) * 0.5;
    oy = (H - ROWS * cell) * 0.5;
    seedMotes();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = false;
    fireHold = false;
    ptr.down = false;
    ptr.dragging = false;
    ptr.dx = ptr.dy = 0;
  });

  if (btnCampaign) btnCampaign.addEventListener('click', function () { audio.ensure(); startCampaign(); });
  if (btnEndless) btnEndless.addEventListener('click', function () { audio.ensure(); startEndless(); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeCamp) modeCamp.addEventListener('click', function () {
    audio.ensure();
    startCampaign();
  });
  if (modeEnd) modeEnd.addEventListener('click', function () {
    audio.ensure();
    startEndless();
  });

  bindPad(padBtns.up, 'up');
  bindPad(padBtns.down, 'down');
  bindPad(padBtns.left, 'left');
  bindPad(padBtns.right, 'right');
  bindPad(padBtns.fire, 'fire');

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

  loadBest();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('滑动走 · 点按或射开火 · 出门进廊');
  }

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
