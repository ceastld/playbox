'use strict';

(function () {
  const COLS = 21;
  const ROWS = 13;
  const EMPTY = 0;
  const WALL = 1;
  const DOOR = 2;
  const LIVES = 3;
  const DOOR_R = 5;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_SPD = 4.52;
  const P_R = 0.3;
  const P_SHOT = 13.6;
  const E_SHOT = 9.1;
  const W_SHOT = 11.4;
  const COMBO_WIN = 1.65;
  const STAGES = 8;
  const BEST_KEY = 'playbox-wizard-wor-best';
  const MUTE_KEY = 'playbox-wizard-wor-mute';
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OPS = 'WASD / 方向键走 · 空格开火（场上只有一发）· R 重开 · M 静音';

  const MAG = [232, 77, 255];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 58, 122];
  const WHT = [246, 238, 255];
  const BLU = [70, 170, 255];

  const KINDS = {
    bur: { id: 'bur', name: '蓝牙', spd: 2.08, vis: 99, score: 100, rgb: BLU, fire: 1.92, chase: 0.28, r: 0.34 },
    gar: { id: 'gar', name: '黄影', spd: 2.7, vis: 4.7, score: 200, rgb: GOLD, fire: 1.4, chase: 0.52, r: 0.34 },
    thor: { id: 'thor', name: '赤踪', spd: 3.55, vis: 3.32, score: 500, rgb: HOT, fire: 1.02, chase: 0.74, r: 0.33 },
    wiz: { id: 'wiz', name: '巫', spd: 3.12, vis: 99, score: 1500, rgb: MAG, fire: 0.68, chase: 0.88, r: 0.36 }
  };

  const DUNGEON = [
    { name: '初廊', mix: { bur: 4, gar: 0, thor: 0 }, wizAt: 1, wizDelay: 18 },
    { name: '蓝牙', mix: { bur: 3, gar: 1, thor: 0 }, wizAt: 1, wizDelay: 16 },
    { name: '黄影', mix: { bur: 2, gar: 2, thor: 0 }, wizAt: 1, wizDelay: 15 },
    { name: '赤踪', mix: { bur: 1, gar: 2, thor: 1 }, wizAt: 1, wizDelay: 14 },
    { name: '暗巷', mix: { bur: 0, gar: 2, thor: 2 }, wizAt: 1, wizDelay: 13 },
    { name: '巫径', mix: { bur: 0, gar: 1, thor: 3 }, wizAt: 1, wizDelay: 12 },
    { name: '深牢', mix: { bur: 0, gar: 0, thor: 4 }, wizAt: 1, wizDelay: 11 },
    { name: '终殿', mix: { bur: 0, gar: 1, thor: 4 }, wizAt: 1, wizDelay: 9 }
  ];

  const NIGHT = [
    { name: '夜初', mix: { bur: 1, gar: 3, thor: 0 }, wizAt: 2, wizDelay: 14 },
    { name: '隐廊', mix: { bur: 0, gar: 3, thor: 1 }, wizAt: 2, wizDelay: 13 },
    { name: '盲射', mix: { bur: 0, gar: 2, thor: 2 }, wizAt: 2, wizDelay: 12 },
    { name: '赤隐', mix: { bur: 0, gar: 1, thor: 3 }, wizAt: 2, wizDelay: 11 },
    { name: '无影', mix: { bur: 0, gar: 2, thor: 3 }, wizAt: 2, wizDelay: 10 },
    { name: '夜巫', mix: { bur: 0, gar: 1, thor: 4 }, wizAt: 2, wizDelay: 9 },
    { name: '噬廊', mix: { bur: 0, gar: 0, thor: 5 }, wizAt: 2, wizDelay: 8 },
    { name: '巫王', mix: { bur: 0, gar: 1, thor: 5 }, wizAt: 2, wizDelay: 7 }
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
  function snap4(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 1 : 3;
    return dy >= 0 ? 2 : 0;
  }
  function multOf(combo) {
    return 1 + Math.min(4, combo >> 1);
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
  function wrapC(c) {
    if (c < 0) return c + COLS;
    if (c >= COLS) return c - COLS;
    return c;
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
        let nc = c + DX[d];
        const nr = r + DY[d];
        if (r === DOOR_R && nr === DOOR_R) nc = wrapC(nc);
        if (!inb(nc, nr) || seen[idx(nc, nr)]) continue;
        if (grid[idx(nc, nr)] === WALL) continue;
        seen[idx(nc, nr)] = 1;
        q.push(nc, nr);
      }
    }
    return seen;
  }

  function carveTo(grid, c0, r0, c1, r1) {
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

  function genMaze(seed) {
    const grid = new Uint8Array(COLS * ROWS);
    grid.fill(WALL);
    const rng = rngSeed(seed);
    const CW = (COLS - 1) >> 1;
    const CH = (ROWS - 1) >> 1;
    function cx(i) { return i * 2 + 1; }
    function cy(j) { return j * 2 + 1; }
    function cidx(i, j) { return j * CW + i; }
    const seen = new Uint8Array(CW * CH);
    const stack = [0, 0];
    seen[0] = 1;
    grid[idx(1, 1)] = EMPTY;
    while (stack.length) {
      const j = stack[stack.length - 1];
      const i = stack[stack.length - 2];
      const opts = [];
      for (let d = 0; d < 4; d++) {
        const ni = i + DX[d];
        const nj = j + DY[d];
        if (ni < 0 || nj < 0 || ni >= CW || nj >= CH) continue;
        if (seen[cidx(ni, nj)]) continue;
        opts.push(ni, nj, d);
      }
      if (!opts.length) {
        stack.pop();
        stack.pop();
        continue;
      }
      const k = ((rng() * (opts.length / 3)) | 0) * 3;
      const ni = opts[k];
      const nj = opts[k + 1];
      const d = opts[k + 2];
      grid[idx(cx(i) + DX[d], cy(j) + DY[d])] = EMPTY;
      grid[idx(cx(ni), cy(nj))] = EMPTY;
      seen[cidx(ni, nj)] = 1;
      stack.push(ni, nj);
    }
    for (let j = 0; j < CH; j++) {
      for (let i = 0; i < CW; i++) {
        for (let d = 0; d < 4; d += 2) {
          const ni = i + (d === 2 ? 0 : 1);
          const nj = j + (d === 2 ? 1 : 0);
          if (ni >= CW || nj >= CH) continue;
          if (rng() < 0.36) {
            grid[idx(cx(i) + (d === 2 ? 0 : 1), cy(j) + (d === 2 ? 1 : 0))] = EMPTY;
          }
        }
      }
    }
    grid[idx(0, DOOR_R)] = DOOR;
    grid[idx(COLS - 1, DOOR_R)] = DOOR;
    grid[idx(1, DOOR_R)] = EMPTY;
    grid[idx(COLS - 2, DOOR_R)] = EMPTY;
    grid[idx(2, DOOR_R)] = EMPTY;
    grid[idx(COLS - 3, DOOR_R)] = EMPTY;
    if (grid[idx(1, ROWS - 2)] === WALL) grid[idx(1, ROWS - 2)] = EMPTY;
    let reach = floodReach(grid, 1, DOOR_R);
    const goals = [[1, 1], [COLS - 2, 1], [1, ROWS - 2], [COLS - 2, ROWS - 2], [COLS - 2, DOOR_R]];
    for (let g = 0; g < goals.length; g++) {
      const tc = goals[g][0];
      const tr = goals[g][1];
      if (grid[idx(tc, tr)] === WALL) grid[idx(tc, tr)] = EMPTY;
      if (!reach[idx(tc, tr)]) {
        carveTo(grid, 1, DOOR_R, tc, tr);
        reach = floodReach(grid, 1, DOOR_R);
      }
    }
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (grid[idx(c, r)] === WALL) continue;
        if (!reach[idx(c, r)]) {
          carveTo(grid, 1, DOOR_R, c, r);
          reach = floodReach(grid, 1, DOOR_R);
        }
      }
    }
    grid[idx(0, DOOR_R)] = DOOR;
    grid[idx(COLS - 1, DOOR_R)] = DOOR;
    return grid;
  }

  function mazeOk(grid) {
    if (grid[idx(0, DOOR_R)] !== DOOR) return false;
    if (grid[idx(COLS - 1, DOOR_R)] !== DOOR) return false;
    if (grid[idx(1, DOOR_R)] === WALL) return false;
    const seen = floodReach(grid, 1, DOOR_R);
    if (!seen[idx(COLS - 2, DOOR_R)]) return false;
    if (!seen[idx(1, 1)]) return false;
    if (!seen[idx(1, ROWS - 2)]) return false;
    if (!seen[idx(COLS - 2, ROWS - 2)]) return false;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (grid[idx(c, r)] !== WALL && !seen[idx(c, r)]) return false;
      }
    }
    return true;
  }

  function selfCheck() {
    if (snap4(3, 0.2) !== 1) throw new Error('snap4 e');
    if (snap4(-2, 0.1) !== 3) throw new Error('snap4 w');
    if (snap4(0.1, 4) !== 2) throw new Error('snap4 s');
    if (snap4(0, -2) !== 0) throw new Error('snap4 n');
    if (multOf(0) !== 1 || multOf(2) !== 2 || multOf(9) !== 5) throw new Error('combo');
    for (let i = 0; i < 40; i++) {
      const g = genMaze(i * 97 + 13);
      if (!mazeOk(g)) throw new Error('maze ' + i);
    }
    return true;
  }

  if (!hasDom) {
    selfCheck();
    return;
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
      this.beep(1080, 0.05, 'square', 0.05, 260);
      this.beep(1560, 0.04, 'sawtooth', 0.028, 620);
    },
    eZap() {
      this.ensure();
      this.beep(260, 0.07, 'sawtooth', 0.04, 120);
    },
    wizZap() {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.05, 180);
      this.beep(880, 0.08, 'triangle', 0.035, 220);
    },
    boom() {
      this.ensure();
      this.noise(0.12, 0.06, 280);
      this.beep(210, 0.14, 'sawtooth', 0.05, 55);
    },
    wall() {
      this.ensure();
      this.noise(0.045, 0.03, 900);
      this.beep(420, 0.04, 'triangle', 0.022, 150);
    },
    vanish() {
      this.ensure();
      this.beep(760, 0.07, 'triangle', 0.032, 160);
    },
    appear() {
      this.ensure();
      this.beep(220, 0.06, 'sine', 0.03, 740);
    },
    sting() {
      this.ensure();
      this.beep(988, 0.09, 'square', 0.055, 392);
      this.beep(1480, 0.16, 'sawtooth', 0.04, 196);
      this.beep(196, 0.28, 'square', 0.055, 82);
    },
    poof() {
      this.ensure();
      this.beep(420, 0.07, 'sine', 0.03, 180);
      this.noise(0.06, 0.03, 600);
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
      this.beep(392, 0.07, 'sine', 0.035, 784);
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
    },
    clear() {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.04);
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
  const btnDungeon = el('btn-dungeon');
  const btnNight = el('btn-night');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeDungeon = el('mode-dungeon');
  const modeNight = el('mode-night');
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
  let radarH = 40;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let fireHold = false;
  let fireCd = 0;

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
    kind: 'dungeon',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    grid: new Uint8Array(COLS * ROWS),
    mobs: [],
    shots: [],
    pShot: null,
    wizSpawned: false,
    wizT: 16,
    wizAt: 1,
    visScale: 1,
    spdScale: 1,
    player: { c: 1, r: ROWS - 2, x: 1.5, y: ROWS - 1.5, dir: -1, want: -1, face: 1, walk: 0 },
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    toastT: 0,
    deadT: 0,
    ready: 0,
    clearT: 0,
    why: '',
    wantKey: 1
  };

  function cellAt(x, y) {
    let c = Math.floor(x);
    const r = Math.floor(y);
    if (r === DOOR_R) c = wrapC(c);
    if (!inb(c, r)) return WALL;
    return G.grid[idx(c, r)];
  }

  function canGo(c, r, d) {
    let nc = c + DX[d];
    const nr = r + DY[d];
    if (r === DOOR_R && nr === DOOR_R) nc = wrapC(nc);
    if (!inb(nc, nr)) return false;
    return G.grid[idx(nc, nr)] !== WALL;
  }

  function openDirs(c, r, exclude) {
    const out = [];
    for (let d = 0; d < 4; d++) {
      if (d === exclude) continue;
      if (canGo(c, r, d)) out.push(d);
    }
    return out;
  }

  function distEnt(a, b) {
    let dx = b.x - a.x;
    const dy = b.y - a.y;
    if (Math.abs(a.y - (DOOR_R + 0.5)) < 0.75 && Math.abs(b.y - (DOOR_R + 0.5)) < 0.75) {
      if (Math.abs(dx) > COLS * 0.5) dx -= Math.sign(dx) * COLS;
    }
    return hypot(dx, dy);
  }

  function hasLOS(x0, y0, x1, y1) {
    if (Math.abs(x0 - x1) < 0.38) {
      const x = (x0 + x1) * 0.5;
      const yA = Math.min(y0, y1);
      const yB = Math.max(y0, y1);
      for (let y = yA; y <= yB; y += 0.22) {
        if (cellAt(x, y) === WALL) return false;
      }
      return yB - yA > 0.15;
    }
    if (Math.abs(y0 - y1) < 0.38) {
      const y = (y0 + y1) * 0.5;
      let xA = Math.min(x0, x1);
      let xB = Math.max(x0, x1);
      if (Math.abs(y - (DOOR_R + 0.5)) < 0.55 && xB - xA > COLS * 0.5) {
        const span = COLS - (xB - xA);
        const steps = Math.max(2, span / 0.22 | 0);
        let x = xB;
        for (let i = 0; i <= steps; i++) {
          if (cellAt(x, y) === WALL) return false;
          x += 0.22;
          if (x >= COLS) x -= COLS;
        }
        return true;
      }
      for (let x = xA; x <= xB; x += 0.22) {
        if (cellAt(x, y) === WALL) return false;
      }
      return xB - xA > 0.15;
    }
    return false;
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
    G.toastT = 1.5;
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
    if (modeDungeon) modeDungeon.setAttribute('aria-pressed', G.kind === 'dungeon' ? 'true' : 'false');
    if (modeNight) modeNight.setAttribute('aria-pressed', G.kind === 'night' ? 'true' : 'false');
  }

  function specNow() {
    const list = G.kind === 'night' ? NIGHT : DUNGEON;
    return list[Math.min(G.stage, list.length - 1)];
  }

  function liveMobs() {
    let n = 0;
    for (let i = 0; i < G.mobs.length; i++) if (G.mobs[i].alive) n += 1;
    return n;
  }

  function liveRegulars() {
    let n = 0;
    for (let i = 0; i < G.mobs.length; i++) {
      if (G.mobs[i].alive && G.mobs[i].kind !== 'wiz') n += 1;
    }
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    const spec = specNow();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = G.kind === 'night' ? '夜巫' : '地牢';
      else stageLabel.textContent = (G.kind === 'night' ? '夜巫 ' : '地牢 ') + (G.stage + 1) + '/' + STAGES + ' · ' + spec.name;
      stageLabel.classList.toggle('hot', G.combo >= 3);
    }
    if (tagLabel) {
      if (G.wizSpawned && liveWiz()) {
        tagLabel.textContent = '巫！';
        tagLabel.className = 'warn';
      } else {
        tagLabel.textContent = '敌 ' + liveMobs();
        tagLabel.className = liveRegulars() <= G.wizAt ? 'hot' : '';
      }
    }
    syncPips();
    syncModes();
  }

  function liveWiz() {
    for (let i = 0; i < G.mobs.length; i++) {
      if (G.mobs[i].alive && G.mobs[i].kind === 'wiz') return true;
    }
    return false;
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
      if (ovKicker) ovKicker.textContent = 'WOR';
      if (ovTitle) ovTitle.textContent = '巫廊';
      if (ovLead) ovLead.innerHTML = '迷宫里一发一射。雷达看见隐身的黄影和赤踪。<br />巫会晚些传送进来。碰到或中弹掉命。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = G.kind === 'night' ? '夜巫散了' : '廊清了';
      if (ovLead) ovLead.textContent = '八牢都打穿了。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来一轮';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '被击中了';
      if (ovLead) ovLead.textContent = '打到第 ' + (G.stage + 1) + ' 牢。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
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
    if (particles.length > 140) n = Math.min(n, 4);
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
    G.mult = multOf(G.combo);
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
  }

  function emptySpots() {
    const a = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (G.grid[idx(c, r)] !== WALL) a.push(c, r);
      }
    }
    return a;
  }

  function makeMob(kind, c, r) {
    const k = KINDS[kind];
    return {
      kind: kind,
      c: c,
      r: r,
      x: c + 0.5,
      y: r + 0.5,
      dir: (Math.random() * 4) | 0,
      want: -1,
      face: 1,
      walk: rand(0, TAU),
      alive: true,
      cd: rand(0.4, 1.1),
      r0: k.r,
      shown: kind === 'bur' || kind === 'wiz',
      flashVis: 0,
      teleT: kind === 'wiz' ? rand(1.5, 2.2) : 0,
      shot: false
    };
  }

  function spawnMobs(mix, px, py) {
    G.mobs = [];
    const order = [];
    const keys = ['bur', 'gar', 'thor'];
    for (let i = 0; i < keys.length; i++) {
      const n = mix[keys[i]] || 0;
      for (let k = 0; k < n; k++) order.push(keys[i]);
    }
    const spots = emptySpots();
    let guard = 0;
    while (G.mobs.length < order.length && guard++ < 400) {
      if (!spots.length) break;
      const si = ((Math.random() * (spots.length / 2)) | 0) * 2;
      const c = spots[si];
      const r = spots[si + 1];
      const x = c + 0.5;
      const y = r + 0.5;
      const minD = guard < 180 ? 4.4 : 2.6;
      if (hypot(x - px, y - py) < minD) continue;
      let near = false;
      for (let i = 0; i < G.mobs.length; i++) {
        if (hypot(x - G.mobs[i].x, y - G.mobs[i].y) < 1.4) near = true;
      }
      if (near) continue;
      G.mobs.push(makeMob(order[G.mobs.length], c, r));
      spots[si] = spots[spots.length - 2];
      spots[si + 1] = spots[spots.length - 1];
      spots.length -= 2;
    }
  }

  function spawnWizard(first) {
    if (G.wizSpawned) return;
    G.wizSpawned = true;
    const spots = emptySpots();
    let c = 10;
    let r = 3;
    let best = 0;
    for (let t = 0; t < 24 && spots.length; t++) {
      const si = ((Math.random() * (spots.length / 2)) | 0) * 2;
      const cc = spots[si];
      const rr = spots[si + 1];
      const d = hypot(cc + 0.5 - G.player.x, rr + 0.5 - G.player.y);
      if (d > best && d > 3) {
        best = d;
        c = cc;
        r = rr;
      }
    }
    const wiz = makeMob('wiz', c, r);
    G.mobs.push(wiz);
    teleportWiz(wiz, first);
    setHint('巫传送进来了 · 一发一射', 'warn');
    syncHud();
  }

  function teleportWiz(e, first) {
    const spots = emptySpots();
    let c = e.c;
    let r = e.r;
    for (let t = 0; t < 28 && spots.length; t++) {
      const si = ((Math.random() * (spots.length / 2)) | 0) * 2;
      const cc = spots[si];
      const rr = spots[si + 1];
      if (hypot(cc + 0.5 - G.player.x, rr + 0.5 - G.player.y) > 3.1) {
        c = cc;
        r = rr;
        break;
      }
    }
    e.c = c;
    e.r = r;
    e.x = c + 0.5;
    e.y = r + 0.5;
    e.dir = -1;
    e.teleT = rand(1.35, 2.25);
    e.face = snap4(G.player.x - e.x, G.player.y - e.y);
    spawnRing(e.x, e.y, MAG);
    emit(first ? 22 : 12, {
      x: e.x, y: e.y, j: 0.25,
      vx0: -3, vx1: 3, vy0: -3, vy1: 3,
      life: 0.45, r0: 0.04, r1: 0.12, rgb: MAG
    });
    if (first) {
      audio.sting();
      toast('巫来了', true);
      screenFlash(MAG, 1);
      kick('sting');
      hitStop(0.08);
      G.shake = 0.28;
    } else {
      audio.poof();
      screenFlash(MAG, 0.35);
    }
  }

  function placePlayer() {
    let c = 1;
    let r = ROWS - 2;
    if (G.grid[idx(c, r)] === WALL) {
      const spots = emptySpots();
      if (spots.length) {
        c = spots[0];
        r = spots[1];
      }
    }
    G.player.c = c;
    G.player.r = r;
    G.player.x = c + 0.5;
    G.player.y = r + 0.5;
    G.player.dir = -1;
    G.player.want = -1;
    G.player.face = 1;
  }

  function buildDungeon() {
    const spec = specNow();
    const seed = (G.stage + 1) * 7919 + (G.kind === 'night' ? 41 : 7) + G.score * 0;
    G.grid = genMaze(seed + G.stage * 17);
    for (let a = 1; a < 8 && !mazeOk(G.grid); a++) {
      G.grid = genMaze(seed + a * 131);
    }
    G.wizAt = spec.wizAt;
    G.wizT = spec.wizDelay;
    G.wizSpawned = false;
    G.visScale = G.kind === 'night' ? 0.58 : 1;
    G.spdScale = G.kind === 'night' ? 1.12 : 1;
    G.shots = [];
    G.pShot = null;
    G.clearT = 0;
    placePlayer();
    spawnMobs(spec.mix, G.player.x, G.player.y);
    G.ready = 0.62;
    G.invuln = 0.7;
    G.deadT = 0;
    resetFx();
    toast(spec.name, false, G.stage === STAGES - 1);
    setHint(G.kind === 'night' ? '夜巫多隐身 · 雷达看点 · 巫来得更早' : '一发一射 · 雷达看隐身 · 左右门穿过', G.kind === 'night' ? 'warn' : '');
    syncHud();
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = G.kind === 'night' ? 'night' : 'dungeon';
    G.stage = 0;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.why = '';
    G.grid = genMaze(276);
    if (!mazeOk(G.grid)) G.grid = genMaze(277);
    placePlayer();
    spawnMobs({ bur: 2, gar: 1, thor: 1 }, G.player.x, G.player.y);
    G.shots = [];
    G.pShot = null;
    G.wizSpawned = false;
    resetFx();
    showOverlay('title');
    setHint('一发一射 · 雷达看隐身 · 左右门穿过 · 巫会来');
    syncHud();
  }

  function beginRun(kind) {
    G.kind = kind;
    G.mode = 'play';
    G.stage = 0;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    hideOverlay();
    audio.start();
    buildDungeon();
    if (canvas && canvas.focus) canvas.focus();
  }

  function startDungeon() { beginRun('dungeon'); }
  function startNight() { beginRun('night'); }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startDungeon();
    else if (G.kind === 'night') startNight();
    else startDungeon();
  }

  function winGame() {
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.8);
    showOverlay('win');
    setHint('八牢清了 · R 再来', 'hot');
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose');
    setHint('R 重开随时可用', 'warn');
    syncHud();
  }

  function wantFromKeys() {
    const held = [];
    if (keys.u) held.push(0);
    if (keys.r) held.push(1);
    if (keys.d) held.push(2);
    if (keys.l) held.push(3);
    if (!held.length) {
      if (ptr.down && ptr.dragging) return snap4(ptr.dx, ptr.dy);
      return -1;
    }
    if (held.indexOf(G.wantKey) >= 0) return G.wantKey;
    return held[held.length - 1];
  }

  function moveEntity(e, spd, dt, isPlayer) {
    const want = e.want;
    const step = spd * dt;
    const cx = e.c + 0.5;
    const cy = e.r + 0.5;
    if (want >= 0 && e.dir >= 0 && want === (e.dir + 2) % 4) e.dir = want;

    let dir = e.dir;
    let distToCenter = 0;
    if (dir < 0) distToCenter = 0;
    else if (DX[dir] !== 0) distToCenter = (cx - e.x) * DX[dir];
    else distToCenter = (cy - e.y) * DY[dir];
    const hitCenter = dir < 0 || (distToCenter >= -0.0005 && distToCenter <= step + 0.0005);

    if (hitCenter) {
      e.x = cx;
      e.y = cy;
      if (want >= 0 && canGo(e.c, e.r, want)) dir = want;
      else if (dir < 0 || !canGo(e.c, e.r, dir)) {
        dir = isPlayer ? -1 : pickDir(e);
      } else if (!isPlayer) {
        const opens = openDirs(e.c, e.r, -1);
        const rev = dir >= 0 ? (dir + 2) % 4 : -1;
        const turn = opens.length >= 3 || (opens.length === 2 && opens.indexOf(rev) < 0);
        if (turn || Math.random() < 0.08) dir = pickDir(e);
      }
      e.dir = dir;
      if (dir < 0) return;
      const left = Math.max(0, step - Math.max(0, distToCenter));
      e.x += DX[dir] * left;
      e.y += DY[dir] * left;
    } else if (dir >= 0) {
      e.x += DX[dir] * step;
      e.y += DY[dir] * step;
    }

    if (e.dir >= 0) {
      e.face = e.dir;
      let wrapped = false;
      if (e.r === DOOR_R || Math.abs(e.y - (DOOR_R + 0.5)) < 0.55) {
        if (e.x < 0) { e.x += COLS; wrapped = true; }
        if (e.x >= COLS) { e.x -= COLS; wrapped = true; }
      }
      if (cellAt(e.x, e.y) === WALL) {
        e.x = e.c + 0.5;
        e.y = e.r + 0.5;
        e.dir = isPlayer ? -1 : pickDir(e);
      } else {
        if (wrapped && isPlayer) audio.door();
        let c = Math.floor(e.x);
        let r = Math.floor(e.y);
        if (r === DOOR_R) c = wrapC(c);
        if (inb(c, r) && G.grid[idx(c, r)] !== WALL) {
          e.c = c;
          e.r = r;
        }
      }
      e.walk += dt * (isPlayer ? 10 : 8);
    }
  }

  function pickDir(e) {
    const rev = e.dir >= 0 ? (e.dir + 2) % 4 : -1;
    const opts = openDirs(e.c, e.r, -1);
    if (!opts.length) return -1;
    const forward = [];
    for (let i = 0; i < opts.length; i++) if (opts[i] !== rev) forward.push(opts[i]);
    const pool = forward.length ? forward : opts;
    const k = KINDS[e.kind];
    if (k && Math.random() < k.chase) {
      const prefer = snap4(G.player.x - e.x, G.player.y - e.y);
      if (pool.indexOf(prefer) >= 0) return prefer;
    }
    return pool[(Math.random() * pool.length) | 0];
  }

  function firePlayer() {
    if (G.mode !== 'play' || G.pShot || G.deadT > 0 || G.ready > 0.15 || fireCd > 0) return;
    const d = G.player.face;
    G.pShot = {
      x: G.player.x + DX[d] * 0.38,
      y: G.player.y + DY[d] * 0.38,
      d: d,
      spd: P_SHOT,
      who: 'p',
      rgb: CYN
    };
    fireCd = 0.06;
    audio.zap();
    emit(7, {
      x: G.pShot.x, y: G.pShot.y, j: 0.06,
      vx0: DX[d] * 2 - 1, vx1: DX[d] * 4 + 1,
      vy0: DY[d] * 2 - 1, vy1: DY[d] * 4 + 1,
      life: 0.18, r0: 0.03, r1: 0.07, rgb: CYN
    });
    lasers.push({ x: G.player.x, y: G.player.y, d: d, t: 0.08, rgb: CYN });
  }

  function enemyShotCount() {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i]) n += 1;
    return n;
  }

  function fireEnemy(e) {
    if (e.shot || enemyShotCount() >= 3) return;
    const d = e.face;
    const shot = {
      x: e.x + DX[d] * 0.36,
      y: e.y + DY[d] * 0.36,
      d: d,
      spd: e.kind === 'wiz' ? W_SHOT : E_SHOT,
      who: 'e',
      rgb: e.kind === 'wiz' ? MAG : KINDS[e.kind].rgb,
      owner: e
    };
    G.shots.push(shot);
    e.shot = true;
    e.cd = KINDS[e.kind].fire;
    e.flashVis = 0.5;
    if (e.kind === 'wiz') audio.wizZap();
    else audio.eZap();
    lasers.push({ x: e.x, y: e.y, d: d, t: 0.07, rgb: shot.rgb });
  }

  function killShot(s, wall) {
    emit(wall ? 5 : 8, {
      x: s.x, y: s.y, j: 0.08,
      vx0: -2, vx1: 2, vy0: -2, vy1: 2,
      life: 0.22, r0: 0.03, r1: 0.08, rgb: s.rgb
    });
    if (s.who === 'p') {
      G.pShot = null;
      if (wall) audio.wall();
    } else {
      if (s.owner) s.owner.shot = false;
      if (wall) audio.wall();
    }
  }

  function moveShot(s, dt) {
    s.x += DX[s.d] * s.spd * dt;
    s.y += DY[s.d] * s.spd * dt;
    if (Math.abs(s.y - (DOOR_R + 0.5)) < 0.7) {
      if (s.x < 0) s.x += COLS;
      if (s.x >= COLS) s.x -= COLS;
    }
    if (s.y < 0 || s.y >= ROWS || cellAt(s.x, s.y) === WALL) {
      killShot(s, true);
      return false;
    }
    return true;
  }

  function mobVisible(e) {
    if (!e.alive) return false;
    if (e.kind === 'bur' || e.kind === 'wiz') return true;
    if (e.flashVis > 0) return true;
    const vis = KINDS[e.kind].vis * G.visScale;
    return distEnt(e, G.player) < vis;
  }

  function explodeMob(e, byShot) {
    e.alive = false;
    e.shot = false;
    const k = KINDS[e.kind];
    const pts = k.score * G.mult;
    bumpCombo();
    addScore(pts, e.x, e.y);
    audio.boom();
    const hs = e.kind === 'wiz' ? 0.08 : e.kind === 'thor' ? 0.065 : 0.05;
    hitStop(hs);
    kick('boom');
    G.shake = Math.max(G.shake, e.kind === 'wiz' ? 0.22 : 0.1);
    screenFlash(k.rgb, e.kind === 'wiz' ? 0.85 : 0.5);
    spawnRing(e.x, e.y, k.rgb);
    emit(e.kind === 'wiz' ? 28 : 16, {
      x: e.x, y: e.y, j: 0.2,
      vx0: -4.2, vx1: 4.2, vy0: -4.2, vy1: 4.2,
      life: 0.42, r0: 0.04, r1: 0.13, rgb: k.rgb
    });
    if (e.kind === 'wiz') spawnPop(e.x, e.y - 0.4, '巫灭', MAG);
    if (byShot) { /* shot already cleared */ }
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.invuln > 0 || G.deadT > 0 || G.ready > 0) return;
    G.why = why;
    G.lives -= 1;
    G.deadT = 1.12;
    G.pShot = null;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    audio.hurt();
    hitStop(0.07);
    kick('die');
    G.shake = 0.34;
    screenFlash(HOT, 0.9);
    emit(26, {
      x: G.player.x, y: G.player.y, j: 0.18,
      vx0: -4, vx1: 4, vy0: -4, vy1: 4,
      life: 0.5, r0: 0.04, r1: 0.14, rgb: CYN
    });
    spawnRing(G.player.x, G.player.y, HOT);
    syncHud();
  }

  function respawn() {
    placePlayer();
    G.deadT = 0;
    G.invuln = 1.45;
    G.pShot = null;
    G.ready = 0.28;
    toast('再入廊', false, false);
  }

  function maybeWizard(dt) {
    if (G.wizSpawned) return;
    G.wizT -= dt;
    const regs = liveRegulars();
    if (regs <= G.wizAt || G.wizT <= 0 || regs === 0) spawnWizard(true);
  }

  function finishClear() {
    const bonus = 400 + 80 * G.stage;
    addScore(bonus, G.player.x, G.player.y - 0.5);
    audio.clear();
    kick('win-flash');
    toast('廊清了', false, true);
    if (G.stage >= STAGES - 1) {
      winGame();
      return;
    }
    G.stage += 1;
    G.clearT = 0.9;
  }

  function updateShots(dt) {
    if (G.pShot) {
      if (!moveShot(G.pShot, dt)) G.pShot = null;
    }
    for (let i = G.shots.length - 1; i >= 0; i--) {
      if (!moveShot(G.shots[i], dt)) G.shots.splice(i, 1);
    }
    if (G.pShot) {
      for (let i = G.shots.length - 1; i >= 0; i--) {
        const s = G.shots[i];
        if (hypot(s.x - G.pShot.x, s.y - G.pShot.y) < 0.28) {
          emit(10, {
            x: s.x, y: s.y, j: 0.1,
            vx0: -2.5, vx1: 2.5, vy0: -2.5, vy1: 2.5,
            life: 0.2, r0: 0.03, r1: 0.08, rgb: WHT
          });
          if (s.owner) s.owner.shot = false;
          G.shots.splice(i, 1);
          G.pShot = null;
          audio.wall();
          break;
        }
      }
    }
  }

  function collideShots() {
    if (G.pShot) {
      for (let i = 0; i < G.mobs.length; i++) {
        const e = G.mobs[i];
        if (!e.alive) continue;
        if (distEnt(G.pShot, e) < e.r0 + 0.16) {
          explodeMob(e, true);
          killShot(G.pShot, false);
          G.pShot = null;
          break;
        }
      }
    }
    if (G.deadT > 0 || G.invuln > 0) return;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (distEnt(s, G.player) < P_R + 0.14) {
        if (s.owner) s.owner.shot = false;
        G.shots.splice(i, 1);
        killPlayer(s.owner && s.owner.kind === 'wiz' ? '巫的一击' : '被射中了');
        return;
      }
    }
  }

  function updateMobs(dt) {
    for (let i = 0; i < G.mobs.length; i++) {
      const e = G.mobs[i];
      if (!e.alive) continue;
      const k = KINDS[e.kind];
      e.cd = Math.max(0, e.cd - dt);
      if (e.flashVis > 0) e.flashVis -= dt;
      const vis = mobVisible(e);
      if (vis !== e.shown) {
        e.shown = vis;
        emit(10, {
          x: e.x, y: e.y, j: 0.16,
          vx0: -1.6, vx1: 1.6, vy0: -1.8, vy1: 1.2,
          life: 0.28, r0: 0.03, r1: 0.09, rgb: k.rgb
        });
        if (vis) audio.appear();
        else audio.vanish();
        screenFlash(k.rgb, 0.28);
      }
      if (e.kind === 'wiz') {
        e.teleT -= dt;
        if (e.teleT <= 0) teleportWiz(e, false);
      }
      if (G.mode === 'play' && G.deadT <= 0 && hasLOS(e.x, e.y, G.player.x, G.player.y)) {
        e.face = snap4(G.player.x - e.x, G.player.y - e.y);
        e.want = e.face;
        if (e.cd <= 0) fireEnemy(e);
      } else {
        e.want = e.dir;
      }
      moveEntity(e, k.spd * G.spdScale, dt, false);
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.ready <= 0) {
        if (distEnt(e, G.player) < e.r0 + P_R - 0.02) {
          killPlayer(e.kind === 'wiz' ? '撞上巫了' : '撞上了');
        }
      }
    }
  }

  function ageFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += (q.g || 2.4) * dt;
      if (q.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= dt * 0.7;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.45) rings.splice(i, 1);
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      lasers[i].t -= dt;
      if (lasers[i].t <= 0) lasers.splice(i, 1);
    }
  }

  function updateDemo(dt) {
    G.t += dt;
    for (let i = 0; i < G.mobs.length; i++) {
      const e = G.mobs[i];
      if (!e.alive) continue;
      e.want = e.dir;
      moveEntity(e, KINDS[e.kind].spd * 0.85, dt, false);
      e.shown = true;
    }
    G.player.walk += dt * 4;
  }

  function update(dt) {
    G.clock += dt;
    ageFx(dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 3.8);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3.1);
    if (fireCd > 0) fireCd -= dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.mode === 'title') {
      updateDemo(dt);
      return;
    }
    if (G.mode !== 'play') return;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) buildDungeon();
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      updateShots(dt);
      return;
    }
    if (G.ready > 0) G.ready -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    G.player.want = wantFromKeys();
    if (G.player.want >= 0) G.player.face = G.player.want;
    if (G.ready <= 0) moveEntity(G.player, P_SPD, dt, true);
    if (fireHold && G.ready <= 0) firePlayer();
    updateMobs(dt);
    updateShots(dt);
    collideShots();
    maybeWizard(dt);
    if (liveMobs() === 0 && G.wizSpawned && G.clearT <= 0 && G.mode === 'play') finishClear();
    else if (liveRegulars() === 0 && !G.wizSpawned) maybeWizard(0);
    syncHud();
  }

  function sx(x) { return ox + x * cell; }
  function sy(y) { return oy + y * cell; }

  function eachWrap(x, y, fn) {
    fn(x, y);
    if (y > DOOR_R - 0.9 && y < DOOR_R + 1.9) {
      if (x < 1.5) fn(x + COLS, y);
      if (x > COLS - 1.5) fn(x - COLS, y);
    }
  }

  function drawMaze() {
    ctx.fillStyle = '#070412';
    ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = G.grid[idx(c, r)];
        if (t === WALL) {
          ctx.fillStyle = '#14081e';
          ctx.fillRect(sx(c), sy(r), cell + 0.5, cell + 0.5);
        }
      }
    }
    ctx.strokeStyle = 'rgba(196, 77, 255, 0.55)';
    ctx.lineWidth = Math.max(1.15, cell * 0.075);
    ctx.lineCap = 'square';
    ctx.beginPath();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] === WALL) continue;
        const x = sx(c);
        const y = sy(r);
        if (c === 0 || G.grid[idx(c - 1, r)] === WALL) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cell);
        }
        if (c === COLS - 1 || G.grid[idx(c + 1, r)] === WALL) {
          ctx.moveTo(x + cell, y);
          ctx.lineTo(x + cell, y + cell);
        }
        if (r === 0 || G.grid[idx(c, r - 1)] === WALL) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + cell, y);
        }
        if (r === ROWS - 1 || G.grid[idx(c, r + 1)] === WALL) {
          ctx.moveTo(x, y + cell);
          ctx.lineTo(x + cell, y + cell);
        }
      }
    }
    ctx.stroke();
    const pulse = 0.45 + 0.35 * Math.sin(G.clock * 5.2);
    for (let side = 0; side < 2; side++) {
      const c = side ? COLS - 1 : 0;
      const x = sx(c);
      const y = sy(DOOR_R);
      ctx.fillStyle = rgba(CYN, 0.12 + pulse * 0.18);
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = rgba(CYN, 0.5 + pulse * 0.4);
      ctx.lineWidth = Math.max(1.4, cell * 0.08);
      ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
    }
  }

  function drawPlayerAt(x, y, ghost) {
    const px = sx(x);
    const py = sy(y);
    const s = cell;
    ctx.save();
    ctx.translate(px, py);
    ctx.globalAlpha = ghost ? 0.38 + 0.4 * Math.sin(G.clock * 18) : 1;
    const fx = DX[G.player.face];
    const fy = DY[G.player.face];
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, s * 0.04, s * 0.22, s * 0.26, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8ffff';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.12, s * 0.17, s * 0.15, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#081018';
    ctx.fillRect(-s * 0.1, -s * 0.16, s * 0.2, s * 0.07);
    ctx.strokeStyle = rgba(GOLD, 1);
    ctx.lineWidth = Math.max(2, s * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx * s * 0.16, fy * s * 0.16);
    ctx.lineTo(fx * s * 0.38, fy * s * 0.38);
    ctx.stroke();
    ctx.restore();
  }

  function drawMobAt(e, x, y, vis) {
    const px = sx(x);
    const py = sy(y);
    const s = cell;
    const k = KINDS[e.kind];
    ctx.save();
    ctx.translate(px, py);
    if (!vis) {
      ctx.globalAlpha = 0.12;
    }
    const bob = Math.sin(e.walk) * s * 0.03;
    if (e.kind === 'wiz') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.38 + bob);
      ctx.lineTo(s * 0.2, -s * 0.08 + bob);
      ctx.lineTo(-s * 0.2, -s * 0.08 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, s * 0.08 + bob, s * 0.2, s * 0.26, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#f4e6ff';
      ctx.beginPath();
      ctx.arc(0, -s * 0.02 + bob, s * 0.09, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#14081e';
      ctx.fillRect(-s * 0.07, -s * 0.05 + bob, s * 0.14, s * 0.045);
      const glow = 0.35 + 0.35 * Math.sin(G.clock * 9);
      ctx.strokeStyle = rgba(GOLD, glow);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.34, 0, TAU);
      ctx.stroke();
    } else if (e.kind === 'thor') {
      ctx.fillStyle = rgba(HOT, vis ? 0.95 : 0.2);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.3 + bob);
      ctx.lineTo(s * 0.22, s * 0.18 + bob);
      ctx.lineTo(0, s * 0.1 + bob);
      ctx.lineTo(-s * 0.22, s * 0.18 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff0f4';
      ctx.beginPath();
      ctx.arc(-s * 0.05, -s * 0.06 + bob, s * 0.045, 0, TAU);
      ctx.arc(s * 0.05, -s * 0.06 + bob, s * 0.045, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'gar') {
      ctx.fillStyle = rgba(GOLD, vis ? 0.95 : 0.18);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.26 + bob);
      ctx.lineTo(s * 0.22, 0 + bob);
      ctx.lineTo(0, s * 0.26 + bob);
      ctx.lineTo(-s * 0.22, 0 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2a1808';
      ctx.beginPath();
      ctx.arc(-s * 0.05, -s * 0.02 + bob, s * 0.04, 0, TAU);
      ctx.arc(s * 0.05, -s * 0.02 + bob, s * 0.04, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(BLU, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, bob, s * 0.23, s * 0.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#e8f6ff';
      ctx.beginPath();
      ctx.arc(-s * 0.07, -s * 0.04 + bob, s * 0.05, 0, TAU);
      ctx.arc(s * 0.07, -s * 0.04 + bob, s * 0.05, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#081018';
      ctx.beginPath();
      ctx.arc(-s * 0.07, -s * 0.04 + bob, s * 0.022, 0, TAU);
      ctx.arc(s * 0.07, -s * 0.04 + bob, s * 0.022, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShotAt(s, x, y) {
    const px = sx(x);
    const py = sy(y);
    const s0 = Math.max(2.2, cell * 0.09);
    ctx.save();
    ctx.strokeStyle = rgba(s.rgb, 0.95);
    ctx.shadowColor = rgba(s.rgb, 0.8);
    ctx.shadowBlur = 10;
    ctx.lineWidth = s0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px - DX[s.d] * cell * 0.18, py - DY[s.d] * cell * 0.18);
    ctx.lineTo(px + DX[s.d] * cell * 0.12, py + DY[s.d] * cell * 0.12);
    ctx.stroke();
    ctx.restore();
  }

  function drawRadar() {
    const x = ox;
    const y = oy + ROWS * cell + Math.max(6, cell * 0.12);
    const w = COLS * cell;
    const h = radarH;
    ctx.fillStyle = 'rgba(8, 5, 18, 0.92)';
    ctx.strokeStyle = 'rgba(196, 77, 255, 0.35)';
    ctx.lineWidth = 1;
    const rr = 8;
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const mx = x + 36 * dpr;
    const my = y + 6 * dpr;
    const mw = w - 48 * dpr;
    const mh = h - 12 * dpr;
    const sc = Math.min(mw / COLS, mh / ROWS);
    const rx = mx + (mw - COLS * sc) * 0.5;
    const ry = my + (mh - ROWS * sc) * 0.5;
    ctx.fillStyle = 'rgba(196, 77, 255, 0.22)';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] === WALL) {
          ctx.fillRect(rx + c * sc, ry + r * sc, sc + 0.4, sc + 0.4);
        }
      }
    }
    ctx.fillStyle = rgba(CYN, 0.45);
    ctx.fillRect(rx, ry + DOOR_R * sc, sc, sc);
    ctx.fillRect(rx + (COLS - 1) * sc, ry + DOOR_R * sc, sc, sc);
    function blip(ex, ey, rgb, rad) {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(rx + ex * sc, ry + ey * sc, Math.max(1.6, rad), 0, TAU);
      ctx.fill();
    }
    if (G.deadT <= 0) blip(G.player.x, G.player.y, CYN, 2.3 * dpr);
    for (let i = 0; i < G.mobs.length; i++) {
      const e = G.mobs[i];
      if (!e.alive) continue;
      const rgb = KINDS[e.kind].rgb;
      const pulse = e.kind === 'wiz' ? 2.4 + Math.sin(G.clock * 10) : 2;
      blip(e.x, e.y, rgb, pulse * dpr);
    }
    ctx.fillStyle = 'rgba(180, 160, 220, 0.7)';
    ctx.font = '600 ' + Math.max(9, 10 * dpr) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('雷达', x + 8 * dpr, y + h * 0.5);
  }

  function draw() {
    if (!ctx) return;
    ctx.fillStyle = '#05020c';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.6 + 0.4 * Math.sin(G.clock * 0.7 + m.p * 7));
      ctx.fillStyle = rgba(MAG, a);
      ctx.beginPath();
      ctx.arc(m.x * W, ((m.y + G.clock * 0.012) % 1) * H, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const mag = G.shake * 7 * dpr;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    drawMaze();
    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const a = 1 - rg.t / 0.45;
      ctx.strokeStyle = rgba(rg.rgb, a);
      ctx.lineWidth = Math.max(1.2, cell * 0.06);
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), cell * (0.2 + rg.t * 1.8), 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < lasers.length; i++) {
      const L = lasers[i];
      const a = L.t / 0.08;
      ctx.strokeStyle = rgba(L.rgb, a * 0.7);
      ctx.lineWidth = Math.max(1.4, cell * 0.06);
      ctx.beginPath();
      ctx.moveTo(sx(L.x), sy(L.y));
      ctx.lineTo(sx(L.x + DX[L.d] * 0.7), sy(L.y + DY[L.d] * 0.7));
      ctx.stroke();
    }
    for (let i = 0; i < G.mobs.length; i++) {
      const e = G.mobs[i];
      if (!e.alive) continue;
      const vis = G.mode === 'title' ? true : mobVisible(e);
      if (!vis) continue;
      eachWrap(e.x, e.y, function (x, y) { drawMobAt(e, x, y, true); });
    }
    if (G.pShot) {
      const s = G.pShot;
      eachWrap(s.x, s.y, function (x, y) { drawShotAt(s, x, y); });
    }
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      eachWrap(s.x, s.y, function (x, y) { drawShotAt(s, x, y); });
    }
    if (G.deadT <= 0 && (G.mode === 'play' || G.mode === 'title')) {
      const ghost = G.invuln > 0;
      eachWrap(G.player.x, G.player.y, function (x, y) { drawPlayerAt(x, y, ghost); });
    }
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.t / q.life;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), Math.max(1, q.r * cell * (0.6 + a)), 0, TAU);
      ctx.fill();
    }
    ctx.font = '700 ' + Math.max(11, cell * 0.36) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const f = pops[i];
      ctx.fillStyle = rgba(f.rgb, f.t / f.life);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    if (G.flash > 0 && !REDUCE) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.2);
      ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);
    }
    drawRadar();
    ctx.restore();
  }

  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }

  function worldFromPtr(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const x = (cx - rect.left) * (W / Math.max(1, rect.width));
    const y = (cy - rect.top) * (H / Math.max(1, rect.height));
    return { x: (x - ox) / cell, y: (y - oy) / cell };
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
    if (hypot(dx, dy) > 0.32) {
      ptr.dragging = true;
      const d = snap4(dx, dy);
      ptr.dx = DX[d];
      ptr.dy = DY[d];
      G.wantKey = d;
    }
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && !ptr.dragging && !overlayBlocksPlay()) firePlayer();
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
    if (down) {
      if (dir === 'up') G.wantKey = 0;
      if (dir === 'right') G.wantKey = 1;
      if (dir === 'down') G.wantKey = 2;
      if (dir === 'left') G.wantKey = 3;
    }
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startDungeon();
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW' || code === 'ArrowUp';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS' || code === 'ArrowDown';
    const isLf = k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA' || code === 'ArrowLeft';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD' || code === 'ArrowRight';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    const onBtn = e.target && e.target.tagName === 'BUTTON';
    if ((isUp || isDn || isLf || isRt || isSp) && !onBtn) e.preventDefault();
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
      if (onBtn) return;
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
        if (!overlayBlocksPlay()) firePlayer();
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
    for (let i = 0; i < 22; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.5, 1.5) * dpr,
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
    radarH = Math.max(34 * dpr, Math.min(56 * dpr, H * 0.1));
    cell = Math.max(12, Math.min((W - pad * 2) / COLS, (H - pad * 2 - radarH) / ROWS));
    ox = (W - COLS * cell) * 0.5;
    oy = (H - ROWS * cell - radarH) * 0.42;
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

  if (btnDungeon) btnDungeon.addEventListener('click', function () { audio.ensure(); startDungeon(); });
  if (btnNight) btnNight.addEventListener('click', function () { audio.ensure(); startNight(); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeDungeon) modeDungeon.addEventListener('click', function () {
    audio.ensure();
    startDungeon();
  });
  if (modeNight) modeNight.addEventListener('click', function () {
    audio.ensure();
    startNight();
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

  if (typeof window !== 'undefined') {
    window.__WOR = { keys: keys, G: G, canGo: canGo, wantFromKeys: wantFromKeys };
  }

  loadBest();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('滑动走 · 点按或射开火 · 雷达看隐身');
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
