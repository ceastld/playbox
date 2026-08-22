'use strict';

(function () {
  const COLS = 13;
  const ROWS = 13;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_R = 0.28;
  const P_SPD = 4.92;
  const E_R = 0.3;
  const JUMP = 0.32;
  const STUN_J = 2.12;
  const STUN_H = 2.95;
  const HAT_T = 4.55;
  const COMBO_WIN = 1.38;
  const INVULN = 1.12;
  const WARP_CD = 0.52;
  const BEST_KEY = 'playbox-crystal-run-best';
  const MUTE_KEY = 'playbox-crystal-run-mute';
  const OPS = 'WASD / 方向键八向跑 · 空格跳跃 · R 重开 · M 静音';
  const OCT = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [0, 232, 180];
  const HOT2 = [95, 255, 212];
  const WHT = [246, 243, 255];
  const GRN = [61, 255, 136];
  const ORG = [255, 168, 72];
  const TREE_RGB = [48, 210, 110];
  const BEE_RGB = [255, 214, 64];
  const GHOST_RGB = [210, 150, 255];

  const CASTLES = [
    {
      name: '庭院', trees: 2, bees: 0, ghosts: 0, hat: false,
      lines: [
        '.............',
        '.###########.',
        '.#1#########.',
        '.###=====###.',
        '.###=====###.',
        '.###########.',
        '.#####S#####.',
        '.###########.',
        '.###=====###.',
        '.###=====###.',
        '.#########1#.',
        '.###########.',
        '.............'
      ]
    },
    {
      name: '回廊', trees: 2, bees: 0, ghosts: 0, hat: false,
      lines: [
        '.............',
        '.#####S#####.',
        '.#A#########.',
        '.##.......##.',
        '.##.......##.',
        '.##.......##.',
        '.##1......##.',
        '.##.......##.',
        '.##.......##.',
        '.##.......##.',
        '.##########B.',
        '.###########.',
        '.............'
      ]
    },
    {
      name: '蜂巢', trees: 1, bees: 3, ghosts: 0, hat: false,
      lines: [
        '.............',
        '.###########.',
        '.##2#####2##.',
        '.###########.',
        '.####...####.',
        '.####...####.',
        '.#####S#####.',
        '.####1######.',
        '.####...####.',
        '.###########.',
        '.###A###B###.',
        '.###########.',
        '.............'
      ]
    },
    {
      name: '螺旋', trees: 1, bees: 1, ghosts: 1, hat: false,
      lines: [
        '.............',
        '.###########.',
        '.#.........#.',
        '.#.#######.#.',
        '.#.#.....#.#.',
        '.#.#.###.#.#.',
        '.#.#.#S#.#.#.',
        '.#.#.#3#.#.#.',
        '.#.#...#.#.#.',
        '.#.#####.#.#.',
        '.#.......#.#.',
        '.#########2#.',
        '.............'
      ]
    },
    {
      name: '双塔', trees: 2, bees: 2, ghosts: 0, hat: true,
      lines: [
        '.............',
        '.#####======.',
        '.#####======.',
        '.##S##==H===.',
        '.#####======.',
        '.#####======.',
        '.####=======.',
        '.#####======.',
        '.#####======.',
        '.##1##==2===.',
        '.#####======.',
        '.#####======.',
        '.............'
      ]
    },
    {
      name: '地道', trees: 1, bees: 1, ghosts: 1, hat: true,
      lines: [
        '.............',
        '.#####..====.',
        '.#S###..=H==.',
        '.#A###..=a==.',
        '.#####..==B=.',
        '.#####..====.',
        '.............',
        '.#####.......',
        '.#b#3#.......',
        '.#####.......',
        '.#####.......',
        '.............',
        '.............'
      ]
    },
    {
      name: '密林', trees: 5, bees: 1, ghosts: 1, hat: false,
      lines: [
        '.............',
        '.###########.',
        '.#X#X#.#X#X#.',
        '.#1...#...1#.',
        '.###X#.#X###.',
        '.#....S....#.',
        '.#.#X#.#X#.#.',
        '.#1.......1#.',
        '.###X#.#X###.',
        '.#....3....#.',
        '.#X#X#.#X#X#.',
        '.###########.',
        '.............'
      ]
    },
    {
      name: '王座', trees: 3, bees: 3, ghosts: 2, hat: true,
      lines: [
        '.............',
        '.###########.',
        '.#A==++===##.',
        '.##==++++==#.',
        '.##==+H+==##.',
        '.##==++++==#.',
        '.#S==++===##.',
        '.###########.',
        '.##1#####2##.',
        '.###1#3#2###.',
        '.###########.',
        '.#####B#####.',
        '.............'
      ]
    }
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
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mixRgb(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t) | 0,
      (a[1] + (b[1] - a[1]) * t) | 0,
      (a[2] + (b[2] - a[2]) * t) | 0
    ];
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function idx(c, r) {
    return r * COLS + c;
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }
  function snap8(dx, dy) {
    if (dx === 0 && dy === 0) return OCT[0];
    let oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    if (oct < 0) oct += 8;
    if (oct === 8) oct = 0;
    return OCT[oct];
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
  function easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  }

  function cellKind(ch) {
    if (ch === '.') return { h: 0, walk: 0, wall: 0 };
    if (ch === '#') return { h: 1, walk: 1, wall: 0, gem: 1 };
    if (ch === '=') return { h: 2, walk: 1, wall: 0, gem: 1 };
    if (ch === '+') return { h: 3, walk: 1, wall: 0, gem: 1 };
    if (ch === 'X') return { h: 1, walk: 0, wall: 1 };
    if (ch === 'S') return { h: 1, walk: 1, wall: 0, start: 1 };
    if (ch === 's') return { h: 2, walk: 1, wall: 0, start: 1 };
    if (ch === 'A') return { h: 1, walk: 1, wall: 0, portal: 'A' };
    if (ch === 'B') return { h: 1, walk: 1, wall: 0, portal: 'B' };
    if (ch === 'a') return { h: 2, walk: 1, wall: 0, portal: 'a' };
    if (ch === 'b') return { h: 2, walk: 1, wall: 0, portal: 'b' };
    if (ch === 'H') return { h: 2, walk: 1, wall: 0, hat: 1 };
    if (ch === '1') return { h: 1, walk: 1, wall: 0, gem: 1, spawn: 'tree' };
    if (ch === '2') return { h: 1, walk: 1, wall: 0, gem: 1, spawn: 'bee' };
    if (ch === '3') return { h: 1, walk: 1, wall: 0, gem: 1, spawn: 'ghost' };
    return { h: 0, walk: 0, wall: 0 };
  }

  function compile(lines) {
    if (!lines || lines.length !== ROWS) return null;
    const height = new Int8Array(COLS * ROWS);
    const wall = new Uint8Array(COLS * ROWS);
    const walk = new Uint8Array(COLS * ROWS);
    const marks = {};
    const spawns = { tree: [], bee: [], ghost: [] };
    const gemCells = [];
    let start = null;
    let hat = null;
    for (let r = 0; r < ROWS; r++) {
      const row = lines[r];
      if (!row || row.length !== COLS) return null;
      for (let c = 0; c < COLS; c++) {
        const k = cellKind(row[c]);
        const i = idx(c, r);
        height[i] = k.h;
        wall[i] = k.wall ? 1 : 0;
        walk[i] = k.walk ? 1 : 0;
        if (k.start) start = { c: c, r: r };
        if (k.hat) hat = { c: c, r: r, x: c + 0.5, y: r + 0.5, alive: true };
        if (k.portal) marks[k.portal] = { c: c, r: r };
        if (k.spawn) spawns[k.spawn].push({ c: c, r: r, x: c + 0.5, y: r + 0.5 });
        if (k.gem) gemCells.push(c, r);
      }
    }
    if (!start) return null;
    const portals = [];
    if (marks.A && marks.a) {
      portals.push({ x: marks.A.c + 0.5, y: marks.A.r + 0.5, tx: marks.a.c + 0.5, ty: marks.a.r + 0.5 });
      portals.push({ x: marks.a.c + 0.5, y: marks.a.r + 0.5, tx: marks.A.c + 0.5, ty: marks.A.r + 0.5 });
    } else if (marks.A && marks.B && !marks.a && !marks.b) {
      portals.push({ x: marks.A.c + 0.5, y: marks.A.r + 0.5, tx: marks.B.c + 0.5, ty: marks.B.r + 0.5 });
      portals.push({ x: marks.B.c + 0.5, y: marks.B.r + 0.5, tx: marks.A.c + 0.5, ty: marks.A.r + 0.5 });
    }
    if (marks.B && marks.b) {
      portals.push({ x: marks.B.c + 0.5, y: marks.B.r + 0.5, tx: marks.b.c + 0.5, ty: marks.b.r + 0.5 });
      portals.push({ x: marks.b.c + 0.5, y: marks.b.r + 0.5, tx: marks.B.c + 0.5, ty: marks.B.r + 0.5 });
    }
    return {
      height: height, wall: wall, walk: walk,
      start: start, hat: hat, portals: portals,
      spawns: spawns, gemCells: gemCells, marks: marks
    };
  }

  function flood(pack) {
    const seen = new Uint8Array(COLS * ROWS);
    const q = [pack.start.c, pack.start.r];
    seen[idx(pack.start.c, pack.start.r)] = 1;
    let qi = 0;
    function enq(c, r) {
      if (!inb(c, r) || seen[idx(c, r)]) return;
      if (!pack.walk[idx(c, r)]) return;
      seen[idx(c, r)] = 1;
      q.push(c, r);
    }
    while (qi < q.length) {
      const c = q[qi++];
      const r = q[qi++];
      const h = pack.height[idx(c, r)];
      for (let d = 0; d < 8; d++) {
        const nc = c + OCT[d][0];
        const nr = r + OCT[d][1];
        if (!inb(nc, nr) || !pack.walk[idx(nc, nr)]) continue;
        if (Math.abs(pack.height[idx(nc, nr)] - h) > 1) continue;
        enq(nc, nr);
      }
      for (let i = 0; i < pack.portals.length; i++) {
        const p = pack.portals[i];
        if ((p.x | 0) === c && (p.y | 0) === r) enq(p.tx | 0, p.ty | 0);
      }
    }
    return seen;
  }

  function packOk(pack) {
    if (!pack || !pack.start) return false;
    if (!pack.walk[idx(pack.start.c, pack.start.r)]) return false;
    const seen = flood(pack);
    if (!seen[idx(pack.start.c, pack.start.r)]) return false;
    let gems = 0;
    for (let i = 0; i < pack.gemCells.length; i += 2) {
      const c = pack.gemCells[i];
      const r = pack.gemCells[i + 1];
      if (!seen[idx(c, r)]) return false;
      gems += 1;
    }
    if (gems < 12) return false;
    if (pack.hat && !seen[idx(pack.hat.c, pack.hat.r)]) return false;
    return true;
  }

  function selfCheck() {
    const s = snap8(10, 0);
    if (s[0] !== 1 || s[1] !== 0) throw new Error('snap8 east');
    const n = snap8(0, -4);
    if (n[0] !== 0 || n[1] !== -1) throw new Error('snap8 north');
    if (idx(2, 1) !== COLS + 2) throw new Error('idx');
    if ((1 + Math.min(4, (1 - 1) / 3 | 0)) !== 1) throw new Error('combo1');
    if ((1 + Math.min(4, (4 - 1) / 3 | 0)) !== 2) throw new Error('combo4');
    if ((1 + Math.min(4, (13 - 1) / 3 | 0)) !== 5) throw new Error('combo13');
    {
      const sx = 0, sy = -1;
      const dc = sx + sy, dr = -sx + sy;
      if (dc !== -1 || dr !== -1) throw new Error('screen up');
    }
    for (let i = 0; i < CASTLES.length; i++) {
      const pack = compile(CASTLES[i].lines);
      if (!pack) throw new Error('compile ' + CASTLES[i].name);
      if (!packOk(pack)) throw new Error('reach ' + CASTLES[i].name);
    }
    const fb = compile(CASTLES[0].lines);
    if (!fb.start) throw new Error('start');
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
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
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
    gem(n) {
      this.ensure();
      const f = 620 + Math.min(14, n) * 42;
      this.beep(f, 0.07, 'triangle', 0.046, f * 1.45);
      this.beep(f * 1.5, 0.05, 'sine', 0.028);
    },
    last() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.05, 784);
      this.beep(784, 0.1, 'triangle', 0.045);
      this.beep(1046, 0.16, 'sine', 0.05);
    },
    jump() {
      this.ensure();
      this.beep(280, 0.08, 'sine', 0.04, 620);
      this.noise(0.05, 0.02, 900);
    },
    stun() {
      this.ensure();
      this.beep(180, 0.09, 'sawtooth', 0.05, 90);
      this.beep(740, 0.07, 'square', 0.035, 220);
      this.noise(0.07, 0.04, 400);
    },
    eat() {
      this.ensure();
      this.beep(160, 0.08, 'sawtooth', 0.03, 70);
      this.noise(0.06, 0.028, 500);
    },
    warp() {
      this.ensure();
      this.beep(240, 0.1, 'sine', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.03, 220);
    },
    hat() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.04);
      this.beep(1174, 0.16, 'sine', 0.038);
    },
    hit() {
      this.ensure();
      this.beep(170, 0.14, 'sawtooth', 0.05, 64);
      this.noise(0.1, 0.045, 380);
    },
    fall() {
      this.ensure();
      this.beep(420, 0.22, 'sine', 0.045, 80);
      this.noise(0.12, 0.03, 200);
    },
    rush() {
      this.ensure();
      this.beep(220, 0.1, 'square', 0.05, 110);
      this.beep(330, 0.16, 'sawtooth', 0.04, 90);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.045);
      this.beep(659, 0.1, 'sine', 0.04);
      this.beep(784, 0.16, 'triangle', 0.05);
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

  const G = {
    mode: 'title',
    kind: 'campaign',
    stage: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    bestC: 0,
    bestE: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    rush: false,
    why: '',
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    invuln: 0,
    warpCd: 0,
    hatT: 0,
    jumpCd: 0,
    ready: 0,
    clearT: 0,
    deadT: 0,
    fallT: 0,
    time: 0,
    gemTotal: 0,
    gemLeft: 0,
    ateWarn: false,
    height: null,
    wall: null,
    walk: null,
    portals: [],
    hat: null,
    gems: [],
    mons: [],
    player: { x: 6.5, y: 6.5, fx: 1, fy: 0, air: 0, airT: 0, squash: 1 }
  };

  const particles = [];
  const pops = [];
  const rings = [];
  const motes = [];
  const keys = { u: false, d: false, l: false, r: false };
  const ptr = { down: false, dragging: false, id: null, sx: 0, sy: 0, dx: 0, dy: 0 };
  let jumpHold = false;
  let hidden = false;
  let toastTok = 0;
  let addTok = 0;
  let chainTok = 0;
  let dpr = 1;
  let W = 640;
  let H = 400;
  let HW = 22;
  let HH = 11;
  let HZ = 14;
  let ox = 320;
  let oy = 48;
  let camX = 0;
  let camY = 0;

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const stageEl = el('stage');
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnCampaign = el('btn-campaign');
  const btnEndless = el('btn-endless');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeCamp = el('mode-camp');
  const modeEnd = el('mode-end');
  const scoreEl = el('score');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const bestEl = el('best');
  const floorEl = el('floor');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const gemBar = el('gem-bar');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainEl = el('chain-pop');
  const hintEl = el('hint');
  const padEl = el('pad');
  const padBtns = {
    up: el('btn-up'),
    down: el('btn-down'),
    left: el('btn-left'),
    right: el('btn-right'),
    jump: el('btn-jump')
  };

  function currentBest() {
    return G.kind === 'endless' ? G.bestE : G.bestC;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.bestC = o.c | 0;
        G.bestE = o.e | 0;
      } else {
        const n = +raw;
        if (n > 0) G.bestC = n;
      }
    } catch (err) { /* ignore */ }
  }

  function saveBest() {
    const v = G.score;
    if (G.kind === 'endless') {
      if (v > G.bestE) G.bestE = v;
    } else if (v > G.bestC) G.bestC = v;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, e: G.bestE }));
    } catch (err) { /* ignore */ }
  }

  function castleNow() {
    if (G.kind === 'campaign') return CASTLES[Math.min(G.stage, CASTLES.length - 1)];
    return CASTLES[(G.wave - 1) % CASTLES.length];
  }

  function speedScale() {
    if (G.kind === 'endless') return 1.16 + Math.min(0.9, (G.wave - 1) * 0.09);
    return 1 + G.stage * 0.045;
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
      if (ovKicker) ovKicker.textContent = 'CASTLE';
      if (ovTitle) ovTitle.textContent = '水晶';
      if (ovLead) ovLead.innerHTML = '等距城堡里收齐水晶。跳起能晕开树、蜂和幽灵。<br />传送门会折路，最后一颗会全员扑过来。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = '城堡收复';
      if (ovLead) ovLead.textContent = '八座城堡的水晶都收齐了。分数 ' + G.score + (G.score >= currentBest() ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来一轮';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '命尽了';
      const tail = G.kind === 'endless'
        ? ('撑到第 ' + G.wave + ' 座。')
        : ('停在' + (castleNow().name || '城堡') + '。');
      if (ovLead) ovLead.textContent = tail + '分数 ' + G.score + (G.score >= currentBest() ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
  }

  function setHint(t) {
    if (hintEl) hintEl.textContent = t;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    clearTimeout(toastTok);
    toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1200);
  }

  function showChain(n) {
    if (!chainEl || REDUCE) return;
    chainEl.textContent = '×' + n;
    chainEl.classList.remove('hidden');
    void chainEl.offsetWidth;
    chainEl.classList.remove('hidden');
    clearTimeout(chainTok);
    chainTok = setTimeout(function () { chainEl.classList.add('hidden'); }, 680);
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

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        t: spec.life * rand(0.55, 1.2),
        life: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
    capArr(particles, 240);
  }

  function spawnRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, max: 0.36, rgb: rgb });
    capArr(rings, 18);
  }

  function floatText(x, y, text, rgb) {
    pops.push({ x: x, y: y - 0.2, text: text, t: 0.7, life: 0.7, rgb: rgb || GOLD });
    capArr(pops, 18);
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function renderPips() {
    if (!pipsEl) return;
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function syncModes() {
    const end = G.kind === 'endless';
    if (modeCamp) modeCamp.setAttribute('aria-pressed', end ? 'false' : 'true');
    if (modeEnd) modeEnd.setAttribute('aria-pressed', end ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(currentBest());
    if (floorEl) floorEl.textContent = String(G.kind === 'endless' ? G.wave : G.stage + 1);
    if (comboEl) comboEl.textContent = '×' + Math.max(1, G.mult);
    if (comboBox) comboBox.classList.toggle('hot', G.mult >= 2);
    const tot = Math.max(1, G.gemTotal);
    const p = G.gemLeft / tot;
    if (gemBar) {
      gemBar.style.transform = 'scaleX(' + p + ')';
      gemBar.classList.toggle('low', G.rush || G.gemLeft <= 3);
      gemBar.classList.toggle('on', G.gemLeft === 0);
    }
    if (stageLabel) {
      stageLabel.textContent = castleNow().name + (G.kind === 'endless' ? ' · 无尽' : '');
      stageLabel.classList.toggle('rush', G.rush);
    }
    renderPips();
    syncModes();
  }

  function flashScore(n) {
    if (!scoreEl) return;
    scoreEl.textContent = String(G.score);
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      clearTimeout(addTok);
      addTok = setTimeout(function () { scoreAdd.hidden = true; }, 680);
    }
  }

  function addScore(n, x, y) {
    if (G.mode !== 'play') return;
    const v = Math.max(1, n | 0);
    G.score += v;
    saveBest();
    flashScore(v);
    if (x != null) floatText(x, y, '+' + v, GOLD);
    syncHud();
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(4, (G.combo - 1) / 3 | 0);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) {
      showChain(G.mult);
      if (comboBox) {
        comboBox.classList.remove('flash');
        void comboBox.offsetWidth;
        comboBox.classList.add('flash');
      }
    }
  }

  function heightAt(x, y) {
    const c = clamp(x | 0, 0, COLS - 1);
    const r = clamp(y | 0, 0, ROWS - 1);
    return G.height[idx(c, r)];
  }
  function isWall(c, r) {
    return !inb(c, r) || G.wall[idx(c, r)] === 1;
  }
  function isWalk(c, r) {
    return inb(c, r) && G.walk[idx(c, r)] === 1;
  }
  function isVoid(c, r) {
    return !inb(c, r) || (!G.walk[idx(c, r)] && !G.wall[idx(c, r)]);
  }

  function hitsWall(x, y, rad) {
    const c0 = Math.max(0, (x - rad) | 0);
    const r0 = Math.max(0, (y - rad) | 0);
    const c1 = Math.min(COLS - 1, (x + rad) | 0);
    const r1 = Math.min(ROWS - 1, (y + rad) | 0);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (G.wall[idx(c, r)] && circleRect(x, y, rad, c, r, 1, 1)) return true;
      }
    }
    return false;
  }

  function canStand(x, y, rad, fromH) {
    const c0 = Math.max(0, (x - rad) | 0);
    const r0 = Math.max(0, (y - rad) | 0);
    const c1 = Math.min(COLS - 1, (x + rad) | 0);
    const r1 = Math.min(ROWS - 1, (y + rad) | 0);
    const ch = fromH == null ? heightAt(x, y) : fromH;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!circleRect(x, y, rad, c, r, 1, 1)) continue;
        if (G.wall[idx(c, r)]) return false;
        if (!G.walk[idx(c, r)]) continue;
        if (Math.abs(G.height[idx(c, r)] - ch) > 1) return false;
      }
    }
    return true;
  }

  function canAxis(x, y, rad, fromH, canFall) {
    if (hitsWall(x, y, rad)) return false;
    const c = x | 0;
    const r = y | 0;
    if (!inb(c, r) || isVoid(c, r)) return !!canFall;
    return canStand(x, y, rad, fromH);
  }

  function tryMove(e, dx, dy, fly, canFall) {
    if (fly) {
      e.x = clamp(e.x + dx, 0.4, COLS - 0.4);
      e.y = clamp(e.y + dy, 0.4, ROWS - 0.4);
      return;
    }
    const h = heightAt(e.x, e.y);
    const rad = e.r || P_R;
    const nx = e.x + dx;
    const ny = e.y + dy;
    if (canAxis(nx, e.y, rad, h, canFall)) e.x = nx;
    if (canAxis(e.x, ny, rad, h, canFall)) e.y = ny;
    if (canFall && isVoid(e.x | 0, e.y | 0)) startFall();
  }

  function iso(c, r, h) {
    return {
      x: ox + (c - r) * HW,
      y: oy + (c + r) * HH - (h || 0) * HZ
    };
  }

  function gemRgb(c, r) {
    const k = (c + r * 3) % 3;
    if (k === 0) return CYN;
    if (k === 1) return HOT2;
    return mixRgb(GOLD, HOT, 0.35);
  }

  function liveGems() {
    let n = 0;
    for (let i = 0; i < G.gems.length; i++) if (G.gems[i].alive) n += 1;
    return n;
  }

  function placeGems(pack, rng) {
    G.gems = [];
    const sc = pack.start.c;
    const sr = pack.start.r;
    const seen = flood(pack);
    for (let i = 0; i < pack.gemCells.length; i += 2) {
      const c = pack.gemCells[i];
      const r = pack.gemCells[i + 1];
      if (c === sc && r === sr) continue;
      if (!seen[idx(c, r)]) continue;
      G.gems.push({
        c: c, r: r, x: c + 0.5, y: r + 0.5,
        alive: true, last: false, pop: 0,
        rgb: gemRgb(c, r), spin: rng() * TAU
      });
    }
    G.gemTotal = G.gems.length;
    G.gemLeft = G.gemTotal;
  }

  function spawnMon(kind, x, y) {
    const spd = kind === 'bee' ? 2.18 : kind === 'ghost' ? 1.42 : 1.58;
    G.mons.push({
      kind: kind,
      x: x, y: y,
      fx: 0, fy: 1,
      r: kind === 'bee' ? 0.26 : E_R,
      spd: spd,
      stun: 0,
      walk: rand(0, TAU),
      pulse: rand(0, TAU),
      alive: true,
      flash: 0
    });
  }

  function fillMons(pack, spec, rng) {
    G.mons = [];
    const seen = flood(pack);
    function farCell() {
      for (let t = 0; t < 24; t++) {
        const k = (rng() * (pack.gemCells.length / 2)) | 0;
        const c = pack.gemCells[k * 2];
        const r = pack.gemCells[k * 2 + 1];
        if (!c && c !== 0) continue;
        if (!seen[idx(c, r)]) continue;
        const dx = c + 0.5 - G.player.x;
        const dy = r + 0.5 - G.player.y;
        if (dx * dx + dy * dy < 6.5) continue;
        return { x: c + 0.5, y: r + 0.5 };
      }
      return { x: pack.start.c + 3.5, y: pack.start.r + 0.5 };
    }
    const extra = G.kind === 'endless' ? Math.min(5, G.wave) : 0;
    const trees = spec.trees + extra;
    const bees = spec.bees + extra;
    const ghosts = spec.ghosts + (G.kind === 'endless' ? Math.min(3, extra - 1) : 0);
    let i;
    for (i = 0; i < pack.spawns.tree.length; i++) spawnMon('tree', pack.spawns.tree[i].x, pack.spawns.tree[i].y);
    for (i = 0; i < pack.spawns.bee.length; i++) spawnMon('bee', pack.spawns.bee[i].x, pack.spawns.bee[i].y);
    for (i = 0; i < pack.spawns.ghost.length; i++) spawnMon('ghost', pack.spawns.ghost[i].x, pack.spawns.ghost[i].y);
    let guard = 24;
    while (G.mons.filter(function (m) { return m.kind === 'tree'; }).length < trees && guard-- > 0) {
      const p = farCell();
      spawnMon('tree', p.x, p.y);
    }
    guard = 24;
    while (G.mons.filter(function (m) { return m.kind === 'bee'; }).length < bees && guard-- > 0) {
      const p = farCell();
      spawnMon('bee', p.x, p.y);
    }
    guard = 24;
    while (G.mons.filter(function (m) { return m.kind === 'ghost'; }).length < ghosts && guard-- > 0) {
      const p = farCell();
      spawnMon('ghost', p.x, p.y);
    }
  }

  function buildCastle() {
    const spec = castleNow();
    const seed = (G.kind === 'endless' ? G.wave * 97 : G.stage * 41) + 17;
    let pack = compile(spec.lines);
    if (!pack || !packOk(pack)) pack = compile(CASTLES[0].lines);
    G.height = pack.height;
    G.wall = pack.wall;
    G.walk = pack.walk;
    G.portals = pack.portals;
    G.hat = spec.hat && pack.hat ? {
      c: pack.hat.c, r: pack.hat.r,
      x: pack.hat.x, y: pack.hat.y, alive: true
    } : (pack.hat && (G.stage >= 4 || G.kind === 'endless' && G.wave % 2 === 0)
      ? { c: pack.hat.c, r: pack.hat.r, x: pack.hat.x, y: pack.hat.y, alive: true }
      : null);
    if (!spec.hat && G.kind === 'campaign' && G.stage < 4) G.hat = null;
    G.player.x = pack.start.c + 0.5;
    G.player.y = pack.start.r + 0.5;
    G.player.fx = 1;
    G.player.fy = 0;
    G.player.air = 0;
    G.player.airT = 0;
    G.player.squash = 1;
    G.rush = false;
    G.ateWarn = false;
    G.hatT = 0;
    G.warpCd = 0;
    G.jumpCd = 0;
    G.fallT = 0;
    G.clearT = 0;
    G.deadT = 0;
    G.ready = 0.52;
    G.invuln = 0.55;
    const rng = rngSeed(seed ^ 0x9E3779B9);
    placeGems(pack, rng);
    fillMons(pack, spec, rng);
    resetFx();
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'endless' ? 'endless' : 'campaign';
    G.mode = 'play';
    G.stage = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.why = '';
    G.time = 0;
    buildCastle();
    hideOverlay();
    audio.start();
    toast(G.kind === 'endless' ? '无尽 · 更快更密' : ('城堡 · ' + castleNow().name), false, G.kind !== 'endless');
    setHint(G.kind === 'endless' ? '无尽城堡 · 敌人更快更多 · R 重开' : '收齐水晶 · 跳起晕怪 · 最后一颗会围攻');
    syncHud();
  }

  function startCampaign() { startGame('campaign'); }
  function startEndless() { startGame('endless'); }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'campaign';
    G.stage = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    buildCastle();
    G.invuln = 99;
    showOverlay('title');
    setHint('收齐水晶 · 跳起晕怪 · 最后一颗会围攻');
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
    addScore(400 + G.lives * 120, G.player.x, G.player.y);
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.45);
    hitStop(0.08);
    showOverlay('win');
    setHint('城堡收复 · R 再来');
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    audio.lose();
    kick('die');
    screenFlash(MAG, 0.5);
    hitStop(0.08);
    showOverlay('lose');
    setHint('R 重开随时可用');
    syncHud();
  }

  function nextCastle() {
    if (G.kind === 'campaign') {
      G.stage += 1;
      if (G.stage >= CASTLES.length) {
        winRun();
        return;
      }
    } else {
      G.wave += 1;
    }
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    buildCastle();
    toast((G.kind === 'endless' ? '第 ' + G.wave + ' 座 · ' : '') + castleNow().name, false, true);
    syncHud();
  }

  function startFall() {
    if (G.fallT > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.fallT = 0.001;
    audio.fall();
    kick('die');
  }

  function killPlayer(why) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    G.why = why;
    G.lives -= 1;
    G.hatT = 0;
    G.player.air = 0;
    audio.hit();
    kick('die');
    screenFlash(MAG, 0.42);
    hitStop(0.072);
    G.shake = Math.max(G.shake, 8);
    G.punch = 0.96;
    emit(18, {
      x: G.player.x, y: G.player.y, j: 0.12,
      vx0: -7, vx1: 7, vy0: -8, vy1: 4,
      life: 0.38, r0: 0.03, r1: 0.1, rgb: CYN, g: 4
    });
    spawnRing(G.player.x, G.player.y, MAG);
    toast(why, true, false);
    renderPips();
    if (G.lives <= 0) {
      G.deadT = 0.45;
      return;
    }
    G.deadT = 0.55;
  }

  function respawn() {
    const spec = castleNow();
    const pack = compile(spec.lines);
    if (pack) {
      G.player.x = pack.start.c + 0.5;
      G.player.y = pack.start.r + 0.5;
    }
    G.player.air = 0;
    G.player.airT = 0;
    G.fallT = 0;
    G.deadT = 0;
    G.invuln = INVULN;
    G.hatT = 0;
    G.warpCd = 0.2;
    const rng = rngSeed((G.stage + G.wave) * 13 + 9);
    fillMons(pack || compile(CASTLES[0].lines), spec, rng);
    if (G.rush) {
      for (let i = 0; i < 2; i++) {
        spawnMon('bee', G.player.x + 4, G.player.y);
      }
    }
  }

  function doJump() {
    if (G.mode !== 'play' || overlayOpen() && G.mode !== 'play') return;
    if (G.player.air > 0 || G.jumpCd > 0 || G.fallT > 0 || G.deadT > 0 || G.ready > 0) return;
    G.player.air = JUMP;
    G.player.airT = 0;
    G.jumpCd = 0.06;
    G.player.squash = 1.18;
    audio.jump();
    emit(6, {
      x: G.player.x, y: G.player.y, j: 0.08,
      vx0: -3, vx1: 3, vy0: -1, vy1: 3,
      life: 0.22, r0: 0.02, r1: 0.06, rgb: HOT2, g: 2
    });
  }

  function stunEnemy(m, dur) {
    if (!m.alive || m.stun > 0.4) return;
    m.stun = dur;
    m.flash = 0.28;
    audio.stun();
    kick('stun');
    screenFlash(WHT, 0.28);
    hitStop(0.055);
    G.shake = Math.max(G.shake, 5);
    G.punch = 0.975;
    spawnRing(m.x, m.y, GOLD);
    emit(14, {
      x: m.x, y: m.y, j: 0.1,
      vx0: -6, vx1: 6, vy0: -7, vy1: 3,
      life: 0.32, r0: 0.03, r1: 0.09, rgb: GOLD, g: 5
    });
    bumpCombo();
    addScore(80 * G.mult, m.x, m.y);
    floatText(m.x, m.y, '晕', GOLD);
  }

  function collectGem(g) {
    if (!g.alive) return;
    g.alive = false;
    g.pop = 0.22;
    G.gemLeft = liveGems();
    bumpCombo();
    const last = G.gemLeft === 0;
    const n = (last ? 420 : 18) * G.mult;
    addScore(n, g.x, g.y);
    if (last) audio.last();
    else audio.gem(G.combo);
    spawnRing(g.x, g.y, g.rgb);
    emit(last ? 22 : 10, {
      x: g.x, y: g.y, j: 0.08,
      vx0: -6, vx1: 6, vy0: -8, vy1: 2,
      life: 0.36, r0: 0.03, r1: 0.1, rgb: g.rgb, g: 6
    });
    hitStop(last ? 0.07 : 0.032 + Math.min(0.03, G.combo * 0.003));
    G.punch = last ? 0.96 : 0.982;
    kick(last ? 'win-flash' : 'pop');
    if (G.gemLeft === 1 && !G.rush) beginRush();
    if (G.gemLeft === 0) {
      G.clearT = 1.05;
      audio.clear();
      toast('收齐了', false, true);
      addScore(520 + (G.kind === 'endless' ? G.wave * 70 : (G.stage + 1) * 80), G.player.x, G.player.y);
    }
    syncHud();
  }

  function beginRush() {
    G.rush = true;
    audio.rush();
    kick('rush');
    screenFlash(MAG, 0.38);
    toast('最后一颗 · 全员扑过来', true, false);
    const spec = castleNow();
    const pack = compile(spec.lines);
    if (pack) {
      spawnMon('bee', pack.start.c + 0.5, pack.start.r + 4.5);
      if (G.kind === 'endless' || G.stage >= 2) spawnMon('bee', pack.start.c + 4.5, pack.start.r + 0.5);
    }
    for (let i = 0; i < G.mons.length; i++) G.mons[i].flash = 0.4;
    syncHud();
  }

  function eatGem(g) {
    if (!g.alive || G.gemLeft <= 1) return;
    g.alive = false;
    G.gemLeft = liveGems();
    audio.eat();
    emit(8, {
      x: g.x, y: g.y, j: 0.06,
      vx0: -3, vx1: 3, vy0: -4, vy1: 2,
      life: 0.28, r0: 0.02, r1: 0.07, rgb: TREE_RGB, g: 4
    });
    if (!G.ateWarn) {
      G.ateWarn = true;
      toast('树在吞水晶', true, false);
    }
    if (G.gemLeft === 1 && !G.rush) beginRush();
    syncHud();
  }

  function pickHat() {
    if (!G.hat || !G.hat.alive) return;
    G.hat.alive = false;
    G.hatT = HAT_T;
    audio.hat();
    kick('win-flash');
    screenFlash(GOLD, 0.32);
    hitStop(0.05);
    addScore(280, G.hat.x, G.hat.y);
    spawnRing(G.hat.x, G.hat.y, GOLD);
    toast('魔帽 · 顶上去', false, true);
  }

  function doWarp(p) {
    if (G.warpCd > 0 || G.fallT > 0) return;
    const ang = Math.atan2(G.player.fy, G.player.fx);
    G.player.x = clamp(p.tx + Math.cos(ang) * 0.42, 0.4, COLS - 0.4);
    G.player.y = clamp(p.ty + Math.sin(ang) * 0.42, 0.4, ROWS - 0.4);
    G.warpCd = WARP_CD;
    G.invuln = Math.max(G.invuln, 0.28);
    audio.warp();
    kick('warp');
    spawnRing(p.tx, p.ty, CYN);
    emit(16, {
      x: p.tx, y: p.ty, j: 0.12,
      vx0: -5, vx1: 5, vy0: -6, vy1: 4,
      life: 0.34, r0: 0.03, r1: 0.09, rgb: MAG, g: 3
    });
    toast('传送', false, false);
  }

  function screenDir() {
    let sx = 0;
    let sy = 0;
    if (keys.r) sx += 1;
    if (keys.l) sx -= 1;
    if (keys.d) sy += 1;
    if (keys.u) sy -= 1;
    if (sx === 0 && sy === 0 && ptr.dragging) {
      sx = ptr.dx;
      sy = ptr.dy;
    }
    if (sx === 0 && sy === 0) return null;
    const dc = sx + sy;
    const dr = -sx + sy;
    const len = hypot(dc, dr) || 1;
    return { dc: dc / len, dr: dr / len, sx: sx, sy: sy };
  }

  function updatePlayer(dt) {
    if (G.deadT > 0 || G.fallT > 0) return;
    if (G.mode !== 'play') return;
    const dir = screenDir();
    const spd = P_SPD * (G.hatT > 0 ? 1.12 : 1);
    if (dir) {
      G.player.fx = dir.dc;
      G.player.fy = dir.dr;
      tryMove(G.player, dir.dc * spd * dt, dir.dr * spd * dt, false, true);
    }
    if (jumpHold) doJump();
    const pc = G.player.x | 0;
    const pr = G.player.y | 0;
    if (G.hat && G.hat.alive && hypot(G.player.x - G.hat.x, G.player.y - G.hat.y) < 0.42) pickHat();
    if (G.warpCd <= 0) {
      for (let i = 0; i < G.portals.length; i++) {
        const p = G.portals[i];
        if (hypot(G.player.x - p.x, G.player.y - p.y) < 0.34) {
          doWarp(p);
          break;
        }
      }
    }
    for (let i = 0; i < G.gems.length; i++) {
      const g = G.gems[i];
      if (!g.alive) continue;
      if (hypot(G.player.x - g.x, G.player.y - g.y) < 0.38) collectGem(g);
    }
    void pc;
    void pr;
  }

  function updateMons(dt) {
    const scale = speedScale() * (G.rush ? 1.82 : 1);
    const px = G.player.x;
    const py = G.player.y;
    const stunning = G.player.air > 0 || G.hatT > 0;
    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (!m.alive) continue;
      m.walk += dt * 8;
      m.pulse += dt * (m.kind === 'bee' ? 14 : 5);
      if (m.flash > 0) m.flash -= dt;
      if (m.stun > 0) {
        m.stun -= dt;
        continue;
      }
      if (G.mode !== 'play' || G.clearT > 0 || G.deadT > 0 || G.fallT > 0) continue;
      const dx = px - m.x;
      const dy = py - m.y;
      const dist = hypot(dx, dy) || 1;
      let vx = dx / dist;
      let vy = dy / dist;
      if (m.kind === 'bee') {
        vx += Math.sin(m.pulse) * 0.55;
        vy += Math.cos(m.pulse * 0.7) * 0.4;
        const n = hypot(vx, vy) || 1;
        tryMove(m, vx / n * m.spd * scale * dt, vy / n * m.spd * scale * dt, true, false);
      } else if (m.kind === 'ghost') {
        vx += Math.sin(m.walk * 0.4) * 0.25;
        const n = hypot(vx, vy) || 1;
        tryMove(m, vx / n * m.spd * scale * dt, vy / n * m.spd * scale * dt, true, false);
      } else {
        const s = snap8(dx, dy);
        tryMove(m, s[0] * m.spd * scale * dt, s[1] * m.spd * scale * dt, false, false);
        if (G.gemLeft > 1) {
          for (let g = 0; g < G.gems.length; g++) {
            const gem = G.gems[g];
            if (!gem.alive) continue;
            if (hypot(m.x - gem.x, m.y - gem.y) < 0.32) eatGem(gem);
          }
        }
      }
      if (G.invuln > 0 || G.ready > 0) continue;
      const hitR = (m.r + P_R) * 0.92;
      if (hypot(m.x - px, m.y - py) < hitR) {
        if (stunning) stunEnemy(m, G.hatT > 0 ? STUN_H : STUN_J);
        else if (m.stun <= 0) {
          const why = m.kind === 'bee' ? '蜂群撞上了' : m.kind === 'ghost' ? '幽灵贴上来了' : '树撞上了';
          killPlayer(why);
        }
      }
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.001, dt));
    G.player.squash = lerp(G.player.squash, 1, 1 - Math.pow(0.0004, dt));
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t >= rings[i].max) rings.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= dt * 0.7;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    for (let i = 0; i < G.gems.length; i++) {
      G.gems[i].spin += dt * 2.4;
      if (G.gems[i].pop > 0) G.gems[i].pop -= dt;
    }
  }

  function update(dt) {
    G.time += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      return;
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.invuln > 0) G.invuln -= dt;
    if (G.warpCd > 0) G.warpCd -= dt;
    if (G.jumpCd > 0 && G.player.air <= 0) G.jumpCd -= dt;
    if (G.hatT > 0) {
      G.hatT -= dt;
      if (G.hatT <= 0) toast('帽掉了', false, false);
    }
    if (G.ready > 0) G.ready -= dt;
    if (G.player.air > 0) {
      G.player.air -= dt;
      G.player.airT += dt;
      if (G.player.air <= 0) {
        G.player.air = 0;
        G.player.squash = 0.78;
        G.jumpCd = 0.1;
        G.invuln = Math.max(G.invuln, 0.1);
      }
    }
    if (G.fallT > 0) {
      G.fallT += dt;
      if (G.fallT > 0.48 && G.deadT <= 0) killPlayer('掉下去了');
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseRun(G.why || '命尽了');
        else respawn();
      }
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0 && G.mode === 'play') nextCastle();
    }
    if (G.mode === 'play' && G.ready <= 0 && G.clearT <= 0) {
      updatePlayer(dt);
      updateMons(dt);
    } else if (G.mode === 'title') {
      for (let i = 0; i < G.mons.length; i++) {
        G.mons[i].walk += dt * 6;
        G.mons[i].pulse += dt * 8;
      }
    }
    updateFx(dt);
  }

  function diamond(c, x, y, hw, hh) {
    c.beginPath();
    c.moveTo(x, y - hh);
    c.lineTo(x + hw, y);
    c.lineTo(x, y + hh);
    c.lineTo(x - hw, y);
    c.closePath();
  }

  function drawCube(c, r, h0, h1, top, left, right) {
    const p = iso(c + 0.5, r + 0.5, h1);
    const drop = Math.max(2, (h1 - h0) * HZ);
    const hw = HW * 0.96;
    const hh = HH * 0.96;
    ctx.beginPath();
    ctx.moveTo(p.x - hw, p.y);
    ctx.lineTo(p.x, p.y + hh);
    ctx.lineTo(p.x, p.y + hh + drop);
    ctx.lineTo(p.x - hw, p.y + drop);
    ctx.closePath();
    ctx.fillStyle = rgba(left, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + hw, p.y);
    ctx.lineTo(p.x, p.y + hh);
    ctx.lineTo(p.x, p.y + hh + drop);
    ctx.lineTo(p.x + hw, p.y + drop);
    ctx.closePath();
    ctx.fillStyle = rgba(right, 1);
    ctx.fill();
    diamond(ctx, p.x, p.y, hw, hh);
    ctx.fillStyle = rgba(top, 1);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT2, 0.18);
    ctx.lineWidth = Math.max(1, dpr * 0.7);
    ctx.stroke();
  }

  function drawShadow(x, y, s) {
    const h = heightAt(x, y);
    const p = iso(x, y, h);
    ctx.save();
    ctx.translate(p.x, p.y + HH * 0.15);
    ctx.scale(1, 0.45);
    ctx.beginPath();
    ctx.arc(0, 0, HW * 0.38 * s, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fill();
    ctx.restore();
  }

  function drawGem(g) {
    if (!g.alive && g.pop <= 0) return;
    const h = G.height[idx(g.c, g.r)];
    const p = iso(g.x, g.y, h + 0.55 + Math.sin(G.time * 3 + g.spin) * 0.08);
    const last = G.rush && g.alive && G.gemLeft === 1;
    const sc = (g.alive ? 1 : g.pop / 0.22) * (last ? 1.35 : 1) * (1 + Math.sin(g.spin) * 0.08);
    const rgb = last ? GOLD : g.rgb;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(g.spin) * 0.2);
    ctx.scale(sc, sc);
    diamond(ctx, 0, 0, HW * 0.26, HH * 0.5);
    ctx.fillStyle = rgba(rgb, g.alive ? 0.95 : 0.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -HH * 0.5);
    ctx.lineTo(HW * 0.26, 0);
    ctx.lineTo(0, HH * 0.14);
    ctx.closePath();
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.fill();
    ctx.restore();
  }

  function drawPortal(p, i) {
    const h = heightAt(p.x, p.y);
    const q = iso(p.x, p.y, h + 0.08);
    const rgb = i % 2 === 0 ? CYN : MAG;
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.scale(1, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, HW * 0.42, 0, TAU);
    ctx.strokeStyle = rgba(rgb, 0.85);
    ctx.lineWidth = 2.2 * dpr;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, HW * (0.18 + Math.sin(G.time * 6 + i) * 0.06), 0, TAU);
    ctx.fillStyle = rgba(rgb, 0.35);
    ctx.fill();
    ctx.restore();
  }

  function drawHatItem(hat) {
    if (!hat || !hat.alive) return;
    const h = heightAt(hat.x, hat.y);
    const p = iso(hat.x, hat.y, h + 0.7 + Math.sin(G.time * 4) * 0.1);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.moveTo(0, -HZ * 0.7);
    ctx.lineTo(HW * 0.28, 0);
    ctx.lineTo(-HW * 0.28, 0);
    ctx.closePath();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(-HW * 0.34, -2, HW * 0.68, 4);
    ctx.restore();
  }

  function drawTree(m, p) {
    const st = m.stun > 0 ? 0.62 : 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1.12 * st, 1.12 * st);
    if (m.flash > 0) ctx.globalAlpha = 0.55 + Math.sin(m.flash * 40) * 0.45;
    ctx.fillStyle = rgba([92, 58, 32], 1);
    ctx.fillRect(-HW * 0.08, -HZ * 0.15, HW * 0.16, HZ * 0.45);
    ctx.beginPath();
    ctx.moveTo(0, -HZ * 1.15);
    ctx.lineTo(HW * 0.38, -HZ * 0.1);
    ctx.lineTo(-HW * 0.38, -HZ * 0.1);
    ctx.closePath();
    ctx.fillStyle = rgba(m.stun > 0 ? mixRgb(TREE_RGB, WHT, 0.55) : TREE_RGB, 0.95);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-HW * 0.08, -HZ * 0.55, 1.6 * dpr, 0, TAU);
    ctx.arc(HW * 0.08, -HZ * 0.55, 1.6 * dpr, 0, TAU);
    ctx.fillStyle = '#05030c';
    ctx.fill();
    ctx.restore();
  }

  function drawBee(m, p) {
    ctx.save();
    ctx.translate(p.x, p.y - HZ * 0.35 - Math.sin(m.pulse) * 3);
    if (m.flash > 0) ctx.globalAlpha = 0.6 + Math.sin(m.flash * 40) * 0.4;
    ctx.fillStyle = rgba(WHT, 0.45);
    ctx.beginPath();
    ctx.ellipse(-HW * 0.18, -HZ * 0.2, HW * 0.16, HH * 0.12, -0.4, 0, TAU);
    ctx.ellipse(HW * 0.18, -HZ * 0.2, HW * 0.16, HH * 0.12, 0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, HW * 0.2, HH * 0.22, 0, 0, TAU);
    ctx.fillStyle = rgba(m.stun > 0 ? mixRgb(BEE_RGB, WHT, 0.5) : BEE_RGB, 0.95);
    ctx.fill();
    ctx.strokeStyle = '#2a1808';
    ctx.lineWidth = 1.4 * dpr;
    ctx.beginPath();
    ctx.moveTo(-HW * 0.08, -HH * 0.12);
    ctx.lineTo(-HW * 0.08, HH * 0.12);
    ctx.moveTo(HW * 0.08, -HH * 0.12);
    ctx.lineTo(HW * 0.08, HH * 0.12);
    ctx.stroke();
    ctx.restore();
  }

  function drawGhost(m, p) {
    ctx.save();
    ctx.translate(p.x, p.y - HZ * 0.2 + Math.sin(m.walk) * 2);
    ctx.globalAlpha = m.stun > 0 ? 0.85 : 0.72;
    if (m.flash > 0) ctx.globalAlpha = 0.5 + Math.sin(m.flash * 40) * 0.5;
    ctx.beginPath();
    ctx.moveTo(-HW * 0.22, -HZ * 0.15);
    ctx.quadraticCurveTo(-HW * 0.22, -HZ * 0.85, 0, -HZ * 0.85);
    ctx.quadraticCurveTo(HW * 0.22, -HZ * 0.85, HW * 0.22, -HZ * 0.15);
    ctx.lineTo(HW * 0.14, HZ * 0.12);
    ctx.lineTo(HW * 0.05, -HZ * 0.02);
    ctx.lineTo(0, HZ * 0.14);
    ctx.lineTo(-HW * 0.05, -HZ * 0.02);
    ctx.lineTo(-HW * 0.14, HZ * 0.12);
    ctx.closePath();
    ctx.fillStyle = rgba(m.stun > 0 ? mixRgb(GHOST_RGB, WHT, 0.5) : GHOST_RGB, 1);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(-HW * 0.07, -HZ * 0.48, 1.7 * dpr, 0, TAU);
    ctx.arc(HW * 0.07, -HZ * 0.48, 1.7 * dpr, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBear(p) {
    const air = G.player.air > 0 && !REDUCE
      ? Math.sin(Math.PI * Math.min(1, G.player.airT / JUMP)) * HZ * 0.9
      : 0;
    const fall = G.fallT > 0 ? G.fallT * HZ * 3.2 : 0;
    const blink = G.invuln > 0 && ((G.time * 18) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(p.x, p.y - air + fall);
    ctx.scale(1.18 * G.player.squash, 1.18 * (2 - G.player.squash));
    if (blink) ctx.globalAlpha = 0.45;
    if (G.hatT > 0) {
      ctx.shadowColor = rgba(GOLD, 0.65);
      ctx.shadowBlur = 12 * dpr;
    }
    ctx.beginPath();
    ctx.ellipse(-HW * 0.16, -HZ * 0.62, HW * 0.1, HH * 0.12, 0, 0, TAU);
    ctx.ellipse(HW * 0.16, -HZ * 0.62, HW * 0.1, HH * 0.12, 0, 0, TAU);
    ctx.fillStyle = rgba(ORG, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -HZ * 0.28, HW * 0.26, HZ * 0.38, 0, 0, TAU);
    ctx.fillStyle = rgba(mixRgb(ORG, GOLD, 0.25), 1);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(G.player.fx * HW * 0.06, -HZ * 0.22, HW * 0.12, HH * 0.1, 0, 0, TAU);
    ctx.fillStyle = rgba([255, 214, 170], 1);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(-HW * 0.08, -HZ * 0.4, 1.6 * dpr, 0, TAU);
    ctx.arc(HW * 0.08, -HZ * 0.4, 1.6 * dpr, 0, TAU);
    ctx.fill();
    if (G.hatT > 0) {
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(0, -HZ * 1.05);
      ctx.lineTo(HW * 0.22, -HZ * 0.58);
      ctx.lineTo(-HW * 0.22, -HZ * 0.58);
      ctx.closePath();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(-HW * 0.26, -HZ * 0.6, HW * 0.52, 3 * dpr);
    }
    ctx.restore();
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.2, 10, W * 0.5, H * 0.45, Math.max(W, H) * 0.7);
    glow.addColorStop(0, 'rgba(0, 80, 72, 0.28)');
    glow.addColorStop(1, 'rgba(3,1,10,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake) * dpr * 0.35;
      shy = rand(-G.shake, G.shake) * dpr * 0.35;
    }
    const pp = iso(G.player.x, G.player.y, heightAt(G.player.x, G.player.y));
    camX = lerp(camX, (pp.x - W * 0.5) * 0.12, 0.12);
    camY = lerp(camY, (pp.y - H * 0.48) * 0.1, 0.12);

    ctx.save();
    ctx.translate(shx - camX, shy - camY);
    const punch = REDUCE ? 1 : G.punch;
    if (punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(punch, punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.6 + Math.sin(G.time * 0.6 + m.p * TAU) * 0.4);
      ctx.fillStyle = rgba(HOT2, a);
      ctx.fillRect(m.x * W, ((m.y + G.time * 0.015) % 1) * H, m.r, m.r);
    }

    if (G.height) {
      for (let s = 0; s < COLS + ROWS; s++) {
        for (let c = 0; c < COLS; c++) {
          const r = s - c;
          if (r < 0 || r >= ROWS) continue;
          const i = idx(c, r);
          if (G.wall[i]) {
            drawCube(c, r, 0, 2.35, [36, 28, 62], [22, 16, 40], [14, 10, 28]);
            continue;
          }
          if (!G.walk[i]) {
            const q = iso(c + 0.5, r + 0.5, 0);
            diamond(ctx, q.x, q.y, HW * 0.92, HH * 0.92);
            ctx.fillStyle = 'rgba(6, 4, 16, 0.55)';
            ctx.fill();
            continue;
          }
          const h = G.height[i];
          let top = [22, 64, 70];
          if (h === 2) top = [28, 92, 96];
          if (h === 3) top = [72, 86, 52];
          if (((c + r) & 1) === 0) top = mixRgb(top, [18, 40, 52], 0.28);
          drawCube(c, r, 0, h, top, mixRgb(top, [8, 24, 28], 0.45), mixRgb(top, [4, 12, 18], 0.62));
        }
      }
    }

    for (let i = 0; i < G.portals.length; i++) drawPortal(G.portals[i], i);
    drawHatItem(G.hat);
    for (let i = 0; i < G.gems.length; i++) drawGem(G.gems[i]);

    const ents = [];
    ents.push({ z: G.player.x + G.player.y, kind: 'p' });
    for (let i = 0; i < G.mons.length; i++) {
      if (G.mons[i].alive) ents.push({ z: G.mons[i].x + G.mons[i].y, kind: 'm', m: G.mons[i] });
    }
    ents.sort(function (a, b) { return a.z - b.z; });
    for (let i = 0; i < ents.length; i++) {
      if (ents[i].kind === 'p') {
        drawShadow(G.player.x, G.player.y, G.player.air > 0 ? 0.7 : 1);
        const h = heightAt(G.player.x, G.player.y);
        drawBear(iso(G.player.x, G.player.y, h));
      } else {
        const m = ents[i].m;
        drawShadow(m.x, m.y, m.kind === 'bee' ? 0.6 : 0.9);
        const h = heightAt(m.x, m.y);
        const fly = m.kind === 'bee' ? 0.55 : m.kind === 'ghost' ? 0.4 : 0;
        const p = iso(m.x, m.y, h + fly);
        if (m.kind === 'bee') drawBee(m, p);
        else if (m.kind === 'ghost') drawGhost(m, p);
        else drawTree(m, p);
      }
    }

    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const t = rg.t / rg.max;
      const h = heightAt(rg.x, rg.y);
      const p = iso(rg.x, rg.y, h);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, HW * (0.2 + t * 1.1), 0, TAU);
      ctx.strokeStyle = rgba(rg.rgb, 1 - t);
      ctx.lineWidth = (2.4 - t * 1.4) * dpr;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.t / p.life, 0, 1);
      const q = iso(p.x, p.y, heightAt(p.x, p.y) + 0.4);
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(1.2, p.r * HW * 2), 0, TAU);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fill();
    }

    ctx.font = '700 ' + Math.max(11, HW * 0.42) + 'px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const f = pops[i];
      const a = f.t / f.life;
      const q = iso(f.x, f.y, heightAt(f.x, f.y) + 1.1);
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, q.x, q.y);
    }

    if (G.flash > 0 && !REDUCE) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(-W, -H, W * 3, H * 3);
    }
    ctx.restore();
  }

  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }

  function worldFromPtr(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const x = (cx - rect.left) * (W / rect.width);
    const y = (cy - rect.top) * (H / rect.height);
    return { x: x, y: y };
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (overlayBlocksPlay()) return;
    e.preventDefault();
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.sx = e.clientX;
    ptr.sy = e.clientY;
    ptr.dragging = false;
    ptr.dx = 0;
    ptr.dy = 0;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }

  function onPointerMove(e) {
    if (!ptr.down || (ptr.id != null && e.pointerId !== ptr.id)) return;
    const dx = e.clientX - ptr.sx;
    const dy = e.clientY - ptr.sy;
    if (hypot(dx, dy) > 18) {
      ptr.dragging = true;
      const s = snap8(dx, dy);
      ptr.dx = s[0];
      ptr.dy = s[1];
    }
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && !ptr.dragging && !overlayBlocksPlay()) doJump();
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
    if (isSp) jumpHold = down;
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
    if (k === '2') {
      if (G.mode === 'title') startEndless();
      return;
    }
    if (k === '1' || k === 'Enter' || isSp) {
      if (e.target && e.target.tagName === 'BUTTON') return;
      if (overlayOpen()) primaryAction();
    }
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    const start = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (dir === 'jump') {
        if (!overlayBlocksPlay()) doJump();
        jumpHold = true;
        btn.classList.add('held');
        return;
      }
      setKey(dir, true);
      btn.classList.add('held');
    };
    const end = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dir === 'jump') {
        jumpHold = false;
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
    const fitW = (W * 0.93) / (COLS + ROWS - 0.4);
    const fitH = (H * 0.8) / ((COLS + ROWS) * 0.5 + 2.6);
    HW = Math.max(13, Math.min(fitW, fitH * 2));
    HH = HW * 0.5;
    HZ = HW * 0.6;
    ox = W * 0.5;
    oy = Math.max(8 * dpr, (H - ((COLS + ROWS) * HH + 2.4 * HZ)) * 0.32);
    camX = 0;
    camY = 0;
    seedMotes();
  }

  if (!hasDom) {
    selfCheck();
    return;
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
    jumpHold = false;
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
  bindPad(padBtns.jump, 'jump');

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
  selfCheck();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('滑动走 · 点按或跳键跳跃 · 收齐水晶');
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
