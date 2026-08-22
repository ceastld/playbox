'use strict';

(function () {
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const ROWS = 12;
  const TILE = 24;
  const VW = 480;
  const VH = 270;
  const PW = 14;
  const PH = 20;
  const RUN = 162;
  const ACC = 980;
  const AIR_ACC = 268;
  const FRICTION = 1680;
  const JUMP_V = 328;
  const GRAV = 1020;
  const MAX_FALL = 400;
  const HELI_GRAV = 236;
  const HELI_FALL = 76;
  const SPRING_V = 468;
  const COYOTE = 0.055;
  const BUFFER = 0.1;
  const INVULN = 1.15;
  const DIE_T = 0.72;
  const POWER_H = 6.15;
  const POWER_N = 4.35;
  const HAT_HELI = 11.2;
  const HAT_FIRE = 9.4;
  const FIRE_CD = 0.46;
  const FIRE_SPD = 292;
  const COMBO_WIN = 1.12;
  const PELLET = 10;
  const POWER_SCORE = 50;
  const FRUIT_SCORE = 180;
  const HAT_SCORE = 160;
  const GHOST_BASE = 200;
  const STAGE_CLEAR = 900;
  const STAGE_BONUS = 220;
  const BEST_KEY = 'playbox-pac-land-best';
  const MUTE_KEY = 'playbox-pac-land-mute';
  const OPS = '方向键 / WASD 跑 · 空格 / 上 跳 · 下 喷火 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 225, 74];
  const WHT = [255, 246, 220];
  const ORG = [255, 138, 50];
  const PINK = [255, 130, 190];
  const ORANGE = [255, 168, 64];
  const RED = [255, 72, 88];
  const BLUE = [64, 120, 255];
  const FRIGHT = [72, 96, 255];

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

  function makeGrid(w, h) {
    const g = [];
    for (let r = 0; r < h; r++) {
      const row = [];
      for (let c = 0; c < w; c++) row.push('.');
      g.push(row);
    }
    return g;
  }
  function fill(g, c0, c1, r0, r1, ch) {
    const h = g.length;
    const w = g[0].length;
    c0 = Math.max(0, c0 | 0);
    c1 = Math.min(w, c1 | 0);
    r0 = Math.max(0, r0 | 0);
    r1 = Math.min(h - 1, r1 | 0);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c < c1; c++) g[r][c] = ch;
    }
  }
  function put(g, c, r, ch) {
    if (r >= 0 && r < g.length && c >= 0 && c < g[0].length) g[r][c] = ch;
  }
  function ground(g, c0, c1) {
    fill(g, c0, c1, 8, 11, '#');
  }
  function pit(g, c0, c1) {
    fill(g, c0, c1, 8, 11, '~');
  }
  function plat(g, c0, c1, r) {
    fill(g, c0, c1, r, r, '=');
  }
  function linesOf(g) {
    return g.map(function (row) { return row.join(''); });
  }
  function autoPellets(g, step) {
    const h = g.length;
    const w = g[0].length;
    step = step || 2;
    for (let c = 3; c < w - 5; c += step) {
      for (let r = 1; r < h - 1; r++) {
        const below = g[r + 1][c];
        if ((below === '#' || below === '=' || below === 's') && g[r][c] === '.') {
          g[r][c] = 'o';
          break;
        }
      }
    }
  }

  function stageMeadow() {
    const w = 72;
    const g = makeGrid(w, ROWS);
    ground(g, 0, 10);
    pit(g, 10, 12);
    ground(g, 12, 32);
    pit(g, 32, 36);
    ground(g, 36, 50);
    pit(g, 50, 53);
    ground(g, 53, 72);
    put(g, 20, 8, 's');
    plat(g, 22, 30, 5);
    put(g, 3, 7, '@');
    put(g, 26, 4, 'O');
    put(g, 38, 7, 'h');
    put(g, 24, 7, 'g');
    put(g, 44, 7, '*');
    put(g, 68, 7, 'E');
    autoPellets(g, 2);
    return { name: '郊野', w: w, lines: linesOf(g), extras: 1 };
  }

  function stageBridge() {
    const w = 84;
    const g = makeGrid(w, ROWS);
    ground(g, 0, 12);
    pit(g, 12, 16);
    ground(g, 16, 28);
    pit(g, 28, 33);
    ground(g, 33, 46);
    pit(g, 46, 54);
    ground(g, 54, 66);
    pit(g, 66, 70);
    ground(g, 70, 84);
    put(g, 18, 8, 's');
    put(g, 26, 8, 's');
    put(g, 44, 8, 's');
    plat(g, 20, 28, 4);
    plat(g, 36, 44, 5);
    plat(g, 48, 52, 6);
    plat(g, 56, 64, 4);
    put(g, 3, 7, '@');
    put(g, 24, 3, 'h');
    put(g, 40, 4, 'O');
    put(g, 22, 7, 'g');
    put(g, 40, 7, 'g');
    put(g, 58, 3, 'y');
    put(g, 60, 7, '*');
    put(g, 80, 7, 'E');
    autoPellets(g, 2);
    return { name: '桥路', w: w, lines: linesOf(g), extras: 2 };
  }

  function stageTown() {
    const w = 92;
    const g = makeGrid(w, ROWS);
    ground(g, 0, 14);
    pit(g, 14, 18);
    ground(g, 18, 30);
    pit(g, 30, 34);
    ground(g, 34, 48);
    pit(g, 48, 53);
    ground(g, 53, 68);
    pit(g, 68, 73);
    ground(g, 73, 92);
    put(g, 22, 8, 's');
    put(g, 46, 8, 's');
    put(g, 66, 8, 's');
    plat(g, 8, 16, 5);
    plat(g, 20, 28, 3);
    plat(g, 36, 46, 5);
    plat(g, 49, 52, 6);
    plat(g, 54, 64, 4);
    plat(g, 69, 72, 6);
    plat(g, 74, 84, 5);
    put(g, 3, 7, '@');
    put(g, 12, 4, 'r');
    put(g, 24, 2, 'h');
    put(g, 40, 4, 'O');
    put(g, 10, 7, 'g');
    put(g, 38, 7, 'g');
    put(g, 60, 7, 'g');
    put(g, 42, 3, 'y');
    put(g, 78, 4, '*');
    put(g, 88, 7, 'E');
    autoPellets(g, 2);
    return { name: '小镇', w: w, lines: linesOf(g), extras: 2 };
  }

  function stageFair() {
    const w = 104;
    const g = makeGrid(w, ROWS);
    ground(g, 0, 12);
    pit(g, 12, 16);
    ground(g, 16, 26);
    pit(g, 26, 31);
    ground(g, 31, 44);
    pit(g, 44, 49);
    ground(g, 49, 62);
    pit(g, 62, 70);
    ground(g, 70, 82);
    pit(g, 82, 86);
    ground(g, 86, 104);
    put(g, 24, 8, 's');
    put(g, 42, 8, 's');
    put(g, 60, 8, 's');
    put(g, 80, 8, 's');
    plat(g, 18, 26, 4);
    plat(g, 28, 31, 6);
    plat(g, 34, 42, 3);
    plat(g, 46, 49, 6);
    plat(g, 52, 60, 5);
    plat(g, 64, 68, 6);
    plat(g, 72, 80, 4);
    plat(g, 88, 96, 5);
    put(g, 3, 7, '@');
    put(g, 22, 3, 'h');
    put(g, 38, 2, 'r');
    put(g, 56, 4, 'O');
    put(g, 90, 4, 'O');
    put(g, 20, 7, 'g');
    put(g, 40, 7, 'g');
    put(g, 58, 7, 'g');
    put(g, 28, 4, 'y');
    put(g, 64, 3, 'y');
    put(g, 76, 3, '*');
    put(g, 100, 7, 'E');
    autoPellets(g, 2);
    return { name: '仙境', w: w, lines: linesOf(g), extras: 3 };
  }

  const STAGES = [stageMeadow(), stageBridge(), stageTown(), stageFair()];

  function isSolidCh(ch) {
    return ch === '#' || ch === 's';
  }
  function isPlatCh(ch) {
    return ch === '=';
  }
  function isSpringCh(ch) {
    return ch === 's';
  }

  function compile(stage) {
    const w = stage.w;
    const lines = stage.lines;
    if (!lines || lines.length !== ROWS) return null;
    const tiles = [];
    const pellets = [];
    const ghosts = [];
    let start = null;
    let fairy = null;
    let nPellet = 0;
    for (let r = 0; r < ROWS; r++) {
      let row = lines[r] || '';
      if (row.length < w) row += new Array(w - row.length + 1).join('.');
      row = row.slice(0, w);
      const cells = [];
      for (let c = 0; c < w; c++) {
        let ch = row[c];
        const x = (c + 0.5) * TILE;
        const y = (r + 1) * TILE;
        if (ch === '@') {
          start = { c: c, r: r, x: x, y: y };
          ch = '.';
        } else if (ch === 'E') {
          fairy = { x: x, y: y - 8, alive: true };
          ch = '.';
        } else if (ch === 'o') {
          pellets.push({ k: 'o', x: x, y: y - 10, alive: true });
          nPellet += 1;
          ch = '.';
        } else if (ch === 'O') {
          pellets.push({ k: 'O', x: x, y: y - 12, alive: true });
          ch = '.';
        } else if (ch === '*') {
          pellets.push({ k: '*', x: x, y: y - 12, alive: true });
          ch = '.';
        } else if (ch === 'h') {
          pellets.push({ k: 'h', x: x, y: y - 14, alive: true });
          ch = '.';
        } else if (ch === 'r') {
          pellets.push({ k: 'r', x: x, y: y - 14, alive: true });
          ch = '.';
        } else if (ch === 'g' || ch === 'y') {
          ghosts.push({
            k: ch === 'y' ? 'fly' : 'walk',
            x: x,
            y: ch === 'y' ? y - 18 : y,
            sx: x,
            sy: ch === 'y' ? y - 18 : y,
            vx: ch === 'y' ? 0 : 40,
            vy: 0,
            dir: 1,
            eyes: false,
            wait: 0,
            bob: rand(0, TAU),
            rgb: ch === 'y' ? CYN : (ghosts.length % 2 ? PINK : ORANGE)
          });
          ch = '.';
        }
        cells.push(ch);
      }
      tiles.push(cells);
    }
    if (!start || !fairy) return null;
    return {
      w: w,
      tiles: tiles,
      start: start,
      fairy: fairy,
      pellets: pellets,
      ghosts: ghosts,
      nPellet: nPellet,
      extras: stage.extras || 0,
      name: stage.name,
      worldW: w * TILE,
      worldH: ROWS * TILE
    };
  }

  function packOk(pack) {
    if (!pack || !pack.start || !pack.fairy) return false;
    if (pack.nPellet < 10) return false;
    const st = pack.tiles[pack.start.r + 1];
    if (!st) return false;
    const under = st[pack.start.c];
    if (!isSolidCh(under) && !isPlatCh(under)) return false;
    return true;
  }

  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }

  function comboMult(n) {
    return 1 + Math.min(4, (Math.max(1, n) - 1) / 3 | 0);
  }

  function eatPts(n) {
    const k = clamp(n, 0, 3);
    return GHOST_BASE << k;
  }

  function selfCheck() {
    if (Math.abs(jumpHeight() - 52.7) > 2) throw new Error('jumpH');
    if (comboMult(1) !== 1) throw new Error('combo1');
    if (comboMult(4) !== 2) throw new Error('combo4');
    if (comboMult(13) !== 5) throw new Error('combo13');
    if (eatPts(0) !== 200 || eatPts(1) !== 400 || eatPts(3) !== 1600) throw new Error('eat');
    if (STAGES.length !== 4) throw new Error('stages');
    for (let i = 0; i < STAGES.length; i++) {
      const pack = compile(STAGES[i]);
      if (!pack) throw new Error('compile ' + STAGES[i].name);
      if (!packOk(pack)) throw new Error('reach ' + STAGES[i].name);
      if (pack.ghosts.length < 1) throw new Error('ghost ' + STAGES[i].name);
    }
    const p0 = compile(STAGES[0]);
    if (p0.start.c > 6) throw new Error('start col');
    const pitW = 3 * TILE;
    if (RUN * (2 * JUMP_V / GRAV) < pitW * 0.85) throw new Error('pit span');
    for (let s = 0; s < STAGES.length; s++) {
      const pack = compile(STAGES[s]);
      let gap = 0;
      let maxGap = 0;
      for (let c = 0; c < pack.w; c++) {
        const ch = pack.tiles[8][c];
        const air = !isSolidCh(ch);
        let bridged = false;
        if (air) {
          for (let r = 3; r <= 7; r++) {
            if (isPlatCh(pack.tiles[r][c]) || isSolidCh(pack.tiles[r][c])) bridged = true;
          }
        }
        if (air && !bridged) {
          gap += 1;
          if (gap > maxGap) maxGap = gap;
        } else gap = 0;
      }
      if (maxGap > 5) throw new Error('wide pit ' + STAGES[s].name + ' ' + maxGap);
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
    pellet(n) {
      this.ensure();
      const f = 640 + Math.min(16, n) * 38;
      this.beep(f, 0.055, 'triangle', 0.044, f * 1.42);
      this.beep(f * 1.5, 0.04, 'sine', 0.022);
    },
    power() {
      this.ensure();
      this.beep(220, 0.1, 'square', 0.05, 440);
      this.beep(440, 0.14, 'triangle', 0.04, 880);
      this.beep(880, 0.18, 'sine', 0.035);
    },
    jump() {
      this.ensure();
      this.beep(290, 0.08, 'sine', 0.04, 640);
      this.noise(0.045, 0.018, 900);
    },
    spring() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.04, 520);
      this.beep(520, 0.12, 'triangle', 0.04, 1040);
      this.noise(0.06, 0.03, 400);
    },
    hat() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.042, 784);
      this.beep(784, 0.12, 'triangle', 0.04);
      this.beep(1174, 0.16, 'sine', 0.036);
    },
    fire() {
      this.ensure();
      this.beep(240, 0.07, 'sawtooth', 0.035, 90);
      this.noise(0.05, 0.03, 500);
    },
    eat(n) {
      this.ensure();
      const f = 280 + n * 90;
      this.beep(f, 0.09, 'square', 0.05, f * 1.7);
      this.beep(f * 1.5, 0.12, 'triangle', 0.04);
      this.noise(0.07, 0.04, 350);
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
    land() {
      this.ensure();
      this.noise(0.04, 0.02, 600);
      this.beep(140, 0.05, 'sine', 0.02);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.038, f * 1.5);
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
    },
    warn() {
      this.ensure();
      this.beep(880, 0.06, 'square', 0.03, 440);
    }
  };

  const G = {
    mode: 'title',
    kind: 'home',
    stage: 0,
    lives: LIVES,
    score: 0,
    bestH: 0,
    bestN: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    eatN: 0,
    why: '',
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    invuln: 0,
    powerT: 0,
    powerMax: POWER_H,
    hat: '',
    hatT: 0,
    hatMax: HAT_HELI,
    hatFlash: 0,
    fireCd: 0,
    deadT: 0,
    clearT: 0,
    time: 0,
    cols: 72,
    tiles: null,
    pellets: [],
    ghosts: [],
    shots: [],
    fairy: null,
    start: null,
    worldW: 72 * TILE,
    worldH: ROWS * TILE,
    name: '郊野',
    player: {
      x: 48, y: 8 * TILE, vx: 0, vy: 0, face: 1,
      on: false, coyote: 0, buffer: 0, squash: 1, run: 0, chomp: 0
    },
    spawnX: 48,
    spawnY: 8 * TILE,
    camX: 0,
    camY: 0,
    look: 0
  };

  const particles = [];
  const pops = [];
  const rings = [];
  const motes = [];
  const stars = [];
  const keys = { l: false, r: false, u: false, d: false };
  let jumpHold = false;
  let fireHold = false;
  let hidden = false;
  let toastTok = 0;
  let addTok = 0;
  let chainTok = 0;
  let dpr = 1;
  let W = 640;
  let H = 400;
  let viewScale = 1;
  let ox = 0;
  let oy = 0;

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
  const btnHome = el('btn-home');
  const btnNight = el('btn-night');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeHome = el('mode-home');
  const modeNight = el('mode-night');
  const scoreEl = el('score');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const bestEl = el('best');
  const stageNumEl = el('stage-num');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const modeLabel = el('mode-label');
  const tagLabel = el('tag-label');
  const hatLabel = el('hat-label');
  const pipsEl = el('pips');
  const powerWrap = el('power-wrap');
  const powerBar = el('power-bar');
  const hatWrap = el('hat-wrap');
  const hatBar = el('hat-bar');
  const toastEl = el('toast');
  const chainEl = el('chain-pop');
  const hintEl = el('hint');
  const padEl = el('pad');
  const padBtns = {
    left: el('btn-left'),
    right: el('btn-right'),
    jump: el('btn-jump'),
    fire: el('btn-fire')
  };

  function currentBest() {
    return G.kind === 'night' ? G.bestN : G.bestH;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.bestH = o.h | 0;
        G.bestN = o.n | 0;
      }
    } catch (err) { /* ignore */ }
  }

  function saveBest() {
    const cur = G.score;
    if (G.kind === 'night') {
      if (cur > G.bestN) G.bestN = cur;
    } else if (cur > G.bestH) G.bestH = cur;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ h: G.bestH, n: G.bestN }));
    } catch (err) { /* ignore */ }
  }

  function flashScore(v) {
    if (!scoreBox || !scoreAdd) return;
    scoreAdd.textContent = '+' + v;
    scoreAdd.hidden = false;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    clearTimeout(addTok);
    addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
  }

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }

  function overlayBlocksPlay() {
    return G.mode !== 'play';
  }

  function showOverlay(end) {
    if (!overlay) return;
    overlay.classList.toggle('hidden', false);
    overlay.classList.toggle('end', !!end);
    if (ovStart) ovStart.classList.toggle('gone', !!end);
    if (ovEnd) ovEnd.classList.toggle('gone', !end);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
  }

  function bootTitle() {
    G.mode = 'title';
    G.why = '';
    loadWorld(0, true);
    G.player.x = G.start.x;
    G.player.y = G.start.y;
    G.player.vx = 0;
    G.player.vy = 0;
    G.camX = 0;
    G.camY = 0;
    if (panel) {
      panel.classList.remove('win', 'lose');
    }
    if (ovKicker) ovKicker.textContent = 'LAND';
    if (ovTitle) ovTitle.textContent = '豆陆';
    if (ovLead) ovLead.textContent = '跑跳回家，弹簧弹高。直升机帽缓降，火焰帽喷火。能量豆反吃鬼，把仙子送到尽头。';
    if (ovOps) ovOps.textContent = OPS;
    showOverlay(false);
    setHint('跑跳吃豆 · 弹簧弹高 · 帽子能飞能射 · 把仙子送到尽头');
    syncHud();
  }

  function showEnd(win) {
    G.mode = win ? 'win' : 'lose';
    saveBest();
    if (panel) {
      panel.classList.toggle('win', win);
      panel.classList.toggle('lose', !win);
    }
    if (win) {
      if (ovKicker) ovKicker.textContent = 'HOME';
      if (ovTitle) ovTitle.textContent = G.kind === 'night' ? '夜路走通' : '仙子送到了';
      if (ovLead) ovLead.textContent = '分数 ' + G.score + (G.score >= currentBest() ? ' · 新纪录' : '');
      audio.win();
      kick('win-flash');
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '命尽了';
      const tail = '停在' + (G.name || '路上') + '。';
      if (ovLead) ovLead.textContent = tail + '分数 ' + G.score + (G.score >= currentBest() ? ' · 新纪录' : '');
      audio.lose();
    }
    if (ovOps) ovOps.textContent = 'R 重开随时可用';
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = '换模式';
    showOverlay(true);
    syncHud();
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
    pops.push({ x: x, y: y - 8, text: text, t: 0.7, life: 0.7, rgb: rgb || GOLD });
    capArr(pops, 18);
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
    G.shots.length = 0;
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
    const night = G.kind === 'night';
    if (modeHome) modeHome.setAttribute('aria-pressed', night ? 'false' : 'true');
    if (modeNight) modeNight.setAttribute('aria-pressed', night ? 'true' : 'false');
  }

  function hatName() {
    if (G.hat === 'heli') return '旋帽';
    if (G.hat === 'fire') return '火帽';
    return '无帽';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(currentBest());
    if (stageNumEl) stageNumEl.textContent = String(G.stage + 1);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.mult >= 2);
    if (modeLabel) modeLabel.textContent = G.kind === 'night' ? '夜路' : '回家';
    if (tagLabel) {
      tagLabel.textContent = G.name || '郊野';
      tagLabel.classList.toggle('warn', G.kind === 'night');
      tagLabel.classList.toggle('hot', G.powerT > 0);
    }
    if (hatLabel) {
      hatLabel.textContent = hatName();
      hatLabel.className = 'hat' + (G.hat === 'heli' ? ' heli' : G.hat === 'fire' ? ' fire' : '');
    }
    if (powerWrap) {
      const on = G.powerT > 0 && G.mode === 'play';
      powerWrap.hidden = !on;
      if (on && powerBar) {
        const t = G.powerT / G.powerMax;
        powerBar.style.transform = 'scaleX(' + clamp(t, 0, 1) + ')';
        powerBar.classList.toggle('low', t < 0.28);
      }
    }
    if (hatWrap) {
      const on = G.hat && G.hatT > 0 && G.mode === 'play' && G.powerT <= 0;
      hatWrap.hidden = !on;
      if (on && hatBar) {
        const t = G.hatT / G.hatMax;
        hatBar.style.transform = 'scaleX(' + clamp(t, 0, 1) + ')';
        hatBar.classList.toggle('fire', G.hat === 'fire');
      }
    }
    renderPips();
    syncModes();
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
    G.mult = comboMult(G.combo);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) {
      showChain(G.mult);
      if (comboBox) {
        comboBox.classList.remove('hot');
        void comboBox.offsetWidth;
        comboBox.classList.add('hot');
      }
    }
  }

  function tileAt(tx, ty) {
    const c = tx | 0;
    const r = ty | 0;
    if (!G.tiles) return '.';
    if (r < 0) return '.';
    if (r >= ROWS) return '.';
    if (c < 0 || c >= G.cols) return '#';
    return G.tiles[r][c];
  }

  function solidAt(px, py, plat, fromAbove) {
    const ch = tileAt(px / TILE, py / TILE);
    if (isSolidCh(ch)) return ch;
    if (plat && isPlatCh(ch) && fromAbove) return ch;
    return '';
  }

  function overlapSolid(x, y, w, h, plat, prevBottom) {
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const y0 = y - h;
    const y1 = y;
    const c0 = Math.floor(x0 / TILE);
    const c1 = Math.floor((x1 - 0.001) / TILE);
    const r0 = Math.floor(y0 / TILE);
    const r1 = Math.floor((y1 - 0.001) / TILE);
    let hit = null;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = tileAt(c, r);
        const top = r * TILE;
        if (isSolidCh(ch)) {
          hit = { c: c, r: r, ch: ch, top: top };
        } else if (plat && isPlatCh(ch) && prevBottom <= top + 3) {
          hit = { c: c, r: r, ch: ch, top: top };
        }
      }
    }
    return hit;
  }

  function nightOn() {
    return G.kind === 'night';
  }

  function ghostWalkSpd() {
    return nightOn() ? 80 : 62;
  }
  function ghostFlySpd() {
    return nightOn() ? 62 : 48;
  }

  function extraGhosts(pack) {
    const list = [];
    const n = nightOn() ? pack.extras : 0;
    const rng = rngSeed((G.stage + 1) * 997 + (nightOn() ? 13 : 0));
    for (let i = 0; i < n; i++) {
      let c = 10 + ((rng() * (pack.w - 20)) | 0);
      let tries = 0;
      while (tries < 24 && pack.tiles[8] && !isSolidCh(pack.tiles[8][c]) && !isPlatCh(pack.tiles[8][c])) {
        c = 10 + ((rng() * (pack.w - 20)) | 0);
        tries += 1;
      }
      const fly = rng() > 0.45;
      const x = (c + 0.5) * TILE;
      let y = 8 * TILE;
      if (fly) y = (3 + (rng() * 3 | 0)) * TILE;
      list.push({
        k: fly ? 'fly' : 'walk',
        x: x,
        y: y,
        sx: x,
        sy: y,
        vx: fly ? 0 : 36,
        vy: 0,
        dir: rng() > 0.5 ? 1 : -1,
        eyes: false,
        wait: 0,
        bob: rng() * TAU,
        rgb: fly ? CYN : RED
      });
    }
    return list;
  }

  function loadWorld(idx, demo) {
    const spec = STAGES[idx % STAGES.length];
    const pack = compile(spec);
    G.stage = idx;
    G.cols = pack.w;
    G.tiles = pack.tiles;
    G.start = pack.start;
    G.fairy = { x: pack.fairy.x, y: pack.fairy.y, alive: true };
    G.pellets = pack.pellets.map(function (p) {
      return { k: p.k, x: p.x, y: p.y, alive: true, spin: rand(0, TAU) };
    });
    G.ghosts = pack.ghosts.concat(extraGhosts(pack)).map(function (g) {
      return {
        k: g.k, x: g.x, y: g.y, sx: g.sx, sy: g.sy,
        vx: g.vx || 0, vy: 0, dir: g.dir || 1,
        eyes: false, wait: 0, bob: g.bob || 0, rgb: g.rgb,
        flash: 0
      };
    });
    G.worldW = pack.worldW;
    G.worldH = pack.worldH;
    G.name = pack.name;
    G.spawnX = pack.start.x;
    G.spawnY = pack.start.y;
    G.shots.length = 0;
    if (!demo) resetFx();
    seedStars();
  }

  function resetPlayer() {
    const p = G.player;
    p.x = G.spawnX;
    p.y = G.spawnY;
    p.vx = 0;
    p.vy = 0;
    p.face = 1;
    p.on = true;
    p.coyote = 0;
    p.buffer = 0;
    p.squash = 1;
    p.run = 0;
    p.chomp = 0;
    G.invuln = INVULN;
    G.deadT = 0;
  }

  function startRun(kind) {
    G.kind = kind === 'night' ? 'night' : 'home';
    G.mode = 'play';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.eatN = 0;
    G.why = '';
    G.powerT = 0;
    G.hat = '';
    G.hatT = 0;
    G.hatFlash = 0;
    G.fireCd = 0;
    G.clearT = 0;
    G.deadT = 0;
    G.time = 0;
    loadWorld(0, false);
    resetPlayer();
    G.camX = Math.max(0, G.player.x - VW * 0.38);
    G.camY = 0;
    hideOverlay();
    audio.start();
    toast(G.kind === 'night' ? '夜路 · 鬼更多' : G.name, G.kind === 'night', G.kind !== 'night');
    setHint(G.kind === 'night' ? '夜路鬼更多更快 · 能量豆更短' : '把仙子送到尽头 · 帽子捡来用');
    syncHud();
  }

  function startHome() { startRun('home'); }
  function startNight() { startRun('night'); }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startHome();
      return;
    }
    startRun(G.kind);
  }

  function nextStage() {
    if (G.stage + 1 >= STAGES.length) {
      showEnd(true);
      return;
    }
    G.stage += 1;
    G.powerT = 0;
    G.hat = '';
    G.hatT = 0;
    G.eatN = 0;
    loadWorld(G.stage, false);
    resetPlayer();
    G.clearT = 0;
    G.camX = Math.max(0, G.player.x - VW * 0.38);
    toast(G.name, false, true);
    syncHud();
  }

  function afterDeath() {
    G.lives -= 1;
    renderPips();
    if (G.lives <= 0) {
      showEnd(false);
      return;
    }
    resetPlayer();
    G.powerT = 0;
    G.eatN = 0;
    G.shots.length = 0;
    toast('还有 ' + G.lives + ' 条命', true, false);
    syncHud();
  }

  function killPlayer(why, fall) {
    if (G.deadT > 0 || G.clearT > 0 || G.mode !== 'play') return;
    G.why = why;
    G.deadT = DIE_T;
    G.player.vx *= 0.3;
    G.player.vy = fall ? 80 : -90;
    hitStop(0.08);
    G.shake = fall ? 7 : 10;
    screenFlash(MAG, 0.55);
    kick('die');
    if (fall) audio.fall();
    else audio.hit();
    emit(18, {
      x: G.player.x, y: G.player.y - 10, j: 8,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.45, r0: 1.4, r1: 3.4, rgb: MAG, g: 280
    });
  }

  function doJump() {
    const p = G.player;
    if (overlayBlocksPlay() || G.deadT > 0 || G.clearT > 0) return;
    p.buffer = BUFFER;
  }

  function fireShot() {
    if (overlayBlocksPlay() || G.hat !== 'fire' || G.deadT > 0 || G.clearT > 0) return;
    if (G.fireCd > 0) return;
    const p = G.player;
    G.fireCd = FIRE_CD;
    G.shots.push({
      x: p.x + p.face * 12,
      y: p.y - PH * 0.55,
      vx: p.face * FIRE_SPD,
      life: 0.82
    });
    audio.fire();
    emit(6, {
      x: p.x + p.face * 10, y: p.y - 12, j: 3,
      vx0: p.face * 40, vx1: p.face * 160, vy0: -40, vy1: 40,
      life: 0.22, r0: 1.2, r1: 2.6, rgb: ORG, g: 0
    });
    kick('hit');
  }

  function collectItem(it) {
    if (!it.alive) return;
    it.alive = false;
    const p = G.player;
    if (it.k === 'o') {
      bumpCombo();
      addScore(PELLET * G.mult, it.x, it.y);
      audio.pellet(G.combo);
      hitStop(0.03);
      emit(7, {
        x: it.x, y: it.y, j: 4,
        vx0: -80, vx1: 80, vy0: -140, vy1: -20,
        life: 0.28, r0: 1.1, r1: 2.4, rgb: GOLD, g: 220
      });
      spawnRing(it.x, it.y, GOLD);
      G.punch = 0.988;
    } else if (it.k === 'O') {
      G.powerT = nightOn() ? POWER_N : POWER_H;
      G.powerMax = G.powerT;
      G.eatN = 0;
      addScore(POWER_SCORE, it.x, it.y);
      audio.power();
      hitStop(0.055);
      screenFlash(CYN, 0.4);
      kick('pickup');
      emit(16, {
        x: it.x, y: it.y, j: 8,
        vx0: -160, vx1: 160, vy0: -200, vy1: 40,
        life: 0.4, r0: 1.6, r1: 3.2, rgb: WHT, g: 180
      });
      spawnRing(it.x, it.y, CYN);
      toast('反吃！', false, true);
      for (let i = 0; i < G.ghosts.length; i++) {
        if (!G.ghosts[i].eyes) G.ghosts[i].dir *= -1;
      }
      syncHud();
    } else if (it.k === '*') {
      bumpCombo();
      addScore(FRUIT_SCORE * G.mult, it.x, it.y);
      audio.pellet(G.combo + 4);
      hitStop(0.04);
      emit(12, {
        x: it.x, y: it.y, j: 6,
        vx0: -120, vx1: 120, vy0: -180, vy1: -10,
        life: 0.36, r0: 1.4, r1: 3, rgb: MAG, g: 200
      });
      spawnRing(it.x, it.y, MAG);
    } else if (it.k === 'h' || it.k === 'r') {
      G.hat = it.k === 'h' ? 'heli' : 'fire';
      G.hatT = it.k === 'h' ? HAT_HELI : HAT_FIRE;
      G.hatMax = G.hatT;
      G.hatFlash = 0.45;
      addScore(HAT_SCORE, it.x, it.y);
      audio.hat();
      hitStop(0.05);
      screenFlash(it.k === 'h' ? CYN : ORG, 0.45);
      kick('pickup');
      emit(14, {
        x: p.x, y: p.y - 18, j: 8,
        vx0: -140, vx1: 140, vy0: -160, vy1: 20,
        life: 0.4, r0: 1.5, r1: 3.2, rgb: it.k === 'h' ? CYN : ORG, g: 80
      });
      spawnRing(p.x, p.y - 16, it.k === 'h' ? CYN : ORG);
      toast(it.k === 'h' ? '直升机帽！' : '火焰帽！', false, true);
      syncHud();
      if (hatLabel) {
        hatLabel.classList.remove('flash');
        void hatLabel.offsetWidth;
        hatLabel.classList.add('flash');
      }
    }
  }

  function eatGhost(g, fromFire) {
    if (g.eyes) return;
    g.eyes = true;
    g.wait = 0;
    g.flash = 0.2;
    let pts;
    if (fromFire) {
      bumpCombo();
      pts = 150 * G.mult;
    } else {
      pts = eatPts(G.eatN);
      G.eatN = Math.min(3, G.eatN + 1);
      bumpCombo();
    }
    addScore(pts, g.x, g.y - 10);
    audio.eat(fromFire ? G.combo : G.eatN);
    hitStop(fromFire ? 0.05 : 0.065);
    G.shake = 5;
    screenFlash(WHT, 0.35);
    kick('eat');
    emit(20, {
      x: g.x, y: g.y - 8, j: 10,
      vx0: -180, vx1: 180, vy0: -240, vy1: 40,
      life: 0.42, r0: 1.6, r1: 3.6, rgb: fromFire ? ORG : FRIGHT, g: 120
    });
    spawnRing(g.x, g.y - 8, GOLD);
    G.punch = 0.975;
  }

  function updatePlayer(dt) {
    const p = G.player;
    const wish = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    if (wish) p.face = wish;
    const acc = p.on ? ACC : AIR_ACC;
    if (wish) {
      p.vx += wish * acc * dt;
    } else if (p.on) {
      const s = Math.sign(p.vx);
      p.vx -= s * FRICTION * dt;
      if (Math.sign(p.vx) !== s) p.vx = 0;
    } else {
      p.vx *= 0.995;
    }
    const cap = RUN;
    if (p.vx > cap) p.vx = cap;
    if (p.vx < -cap) p.vx = -cap;

    if (p.on) p.coyote = COYOTE;
    else p.coyote -= dt;
    p.buffer -= dt;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -JUMP_V;
      p.on = false;
      p.coyote = 0;
      p.buffer = 0;
      p.squash = 1.22;
      audio.jump();
      hitStop(0.03);
      kick('thump');
      emit(6, {
        x: p.x, y: p.y, j: 6,
        vx0: -70, vx1: 70, vy0: -30, vy1: 20,
        life: 0.28, r0: 1.2, r1: 2.6, rgb: GOLD, g: 400
      });
    }

    const heli = G.hat === 'heli' && p.vy > 0;
    const grav = heli ? HELI_GRAV : GRAV;
    p.vy += grav * dt;
    const fallMax = heli ? HELI_FALL : MAX_FALL;
    if (p.vy > fallMax) p.vy = fallMax;

    const prevBottom = p.y;
    p.x += p.vx * dt;
    const minX = TILE * 0.4;
    const maxX = G.worldW - TILE * 0.4;
    if (p.x < minX) { p.x = minX; p.vx = 0; }
    if (p.x > maxX) { p.x = maxX; p.vx = 0; }

    const hitX = overlapSolid(p.x, p.y, PW, PH, false, 0);
    if (hitX) {
      const cx = (hitX.c + 0.5) * TILE;
      if (p.x < cx) p.x = hitX.c * TILE - PW / 2 - 0.1;
      else p.x = (hitX.c + 1) * TILE + PW / 2 + 0.1;
      p.vx = 0;
    }

    p.y += p.vy * dt;
    p.on = false;
    if (p.vy >= 0) {
      const hitY = overlapSolid(p.x, p.y, PW, PH, true, prevBottom);
      if (hitY) {
        p.y = hitY.top;
        const landed = p.vy > 90;
        const sprung = isSpringCh(hitY.ch);
        p.vy = 0;
        p.on = true;
        if (sprung) {
          p.vy = -SPRING_V;
          p.on = false;
          p.coyote = 0;
          p.squash = 0.72;
          audio.spring();
          hitStop(0.04);
          kick('boom');
          G.shake = 4;
          emit(12, {
            x: p.x, y: p.y, j: 8,
            vx0: -90, vx1: 90, vy0: -80, vy1: -10,
            life: 0.32, r0: 1.3, r1: 2.8, rgb: CYN, g: 200
          });
          spawnRing(p.x, p.y, CYN);
        } else if (landed) {
          p.squash = 0.78;
          audio.land();
          kick('thump');
          emit(4, {
            x: p.x, y: p.y, j: 5,
            vx0: -50, vx1: 50, vy0: -20, vy1: 10,
            life: 0.2, r0: 1, r1: 2.2, rgb: GOLD, g: 300
          });
        }
        if (p.on && isSafe(p.x, p.y)) {
          G.spawnX = p.x;
          G.spawnY = p.y;
        }
      }
    } else {
      const hitY = overlapSolid(p.x, p.y, PW, PH, false, 0);
      if (hitY) {
        p.y = hitY.top + TILE + PH;
        p.vy = 20;
      }
    }

    const targetSq = p.vy < -40 ? 1.18 : p.on ? 1 : 1.06;
    p.squash += (targetSq - p.squash) * Math.min(1, dt * 12);
    p.run += Math.abs(p.vx) * dt * 0.08;
    p.chomp += dt * (p.on && Math.abs(p.vx) > 20 ? 14 : 6);

    if (p.y > G.worldH + 18) {
      killPlayer('掉进坑了', true);
    }

    if (G.fairy && G.fairy.alive) {
      const dx = p.x - G.fairy.x;
      const dy = (p.y - PH * 0.5) - G.fairy.y;
      if (dx * dx + dy * dy < 20 * 20) {
        G.fairy.alive = false;
        const bonus = STAGE_CLEAR + STAGE_BONUS * G.stage;
        addScore(bonus, G.fairy.x, G.fairy.y);
        audio.clear();
        hitStop(0.07);
        screenFlash(GOLD, 0.5);
        kick('win-flash');
        spawnRing(G.fairy.x, G.fairy.y, GOLD);
        emit(22, {
          x: G.fairy.x, y: G.fairy.y, j: 12,
          vx0: -160, vx1: 160, vy0: -220, vy1: 40,
          life: 0.5, r0: 1.6, r1: 3.8, rgb: PINK, g: 80
        });
        toast(G.stage + 1 >= STAGES.length ? '送到了！' : '下一程', false, true);
        G.clearT = 0.95;
      }
    }
  }

  function isSafe(x, y) {
    const c = Math.floor(x / TILE);
    const r = Math.floor((y + 2) / TILE);
    const ch = tileAt(c, r);
    return isSolidCh(ch);
  }

  function walkEdge(g, dir) {
    const nx = g.x + dir * 10;
    const foot = tileAt(nx / TILE, (g.y + 2) / TILE);
    return !isSolidCh(foot) && !isPlatCh(foot);
  }

  function updateGhosts(dt) {
    const p = G.player;
    const fright = G.powerT > 0;
    const wspd = fright ? 38 : ghostWalkSpd();
    const fspd = fright ? 34 : ghostFlySpd();
    for (let i = 0; i < G.ghosts.length; i++) {
      const g = G.ghosts[i];
      g.bob += dt * 6;
      g.flash = Math.max(0, g.flash - dt);
      if (g.eyes) {
        const dx = g.sx - g.x;
        const dy = g.sy - g.y;
        const d = hypot(dx, dy) || 1;
        g.x += (dx / d) * 140 * dt;
        g.y += (dy / d) * 140 * dt;
        if (d < 8) {
          g.x = g.sx;
          g.y = g.sy;
          g.eyes = false;
          g.wait = 2.4;
        }
        continue;
      }
      if (g.wait > 0) {
        g.wait -= dt;
        continue;
      }
      if (g.k === 'fly') {
        let tx = p.x;
        let ty = p.y - 28;
        if (fright) {
          tx = g.x + (g.x - p.x);
          ty = g.y - 10;
        }
        const dx = tx - g.x;
        const dy = ty - g.y;
        const d = hypot(dx, dy) || 1;
        g.x += (dx / d) * fspd * dt;
        g.y += (dy / d) * fspd * dt;
        g.y += Math.sin(g.bob) * 10 * dt;
        g.dir = dx >= 0 ? 1 : -1;
      } else {
        if (fright) g.dir = p.x < g.x ? 1 : -1;
        else {
          const near = Math.abs(p.x - g.x) < 220 && Math.abs(p.y - g.y) < 46;
          if (near) g.dir = p.x >= g.x ? 1 : -1;
        }
        if (walkEdge(g, g.dir)) g.dir *= -1;
        g.vx = g.dir * wspd;
        g.x += g.vx * dt;
        g.vy += GRAV * dt;
        if (g.vy > MAX_FALL) g.vy = MAX_FALL;
        g.y += g.vy * dt;
        const hit = overlapSolid(g.x, g.y, 12, 16, true, g.y - g.vy * dt);
        if (hit && g.vy >= 0) {
          g.y = hit.top;
          g.vy = 0;
        }
        if (g.y > G.worldH + 10) {
          g.x = g.sx;
          g.y = g.sy;
          g.vy = 0;
        }
      }

      if (G.invuln > 0 || G.deadT > 0) continue;
      const dx = p.x - g.x;
      const dy = (p.y - PH * 0.45) - (g.y - 8);
      if (dx * dx + dy * dy < 13 * 13) {
        if (fright) eatGhost(g, false);
        else killPlayer('撞上鬼了', false);
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      const ch = tileAt(s.x / TILE, s.y / TILE);
      if (isSolidCh(ch)) {
        emit(5, {
          x: s.x, y: s.y, j: 3,
          vx0: -60, vx1: 60, vy0: -80, vy1: 20,
          life: 0.2, r0: 1, r1: 2.2, rgb: ORG, g: 200
        });
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ghosts.length; j++) {
        const g = G.ghosts[j];
        if (g.eyes || g.wait > 0) continue;
        const dx = s.x - g.x;
        const dy = s.y - (g.y - 8);
        if (dx * dx + dy * dy < 12 * 12) {
          eatGhost(g, true);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateItems() {
    const p = G.player;
    for (let i = 0; i < G.pellets.length; i++) {
      const it = G.pellets[i];
      if (!it.alive) continue;
      it.spin += STEP * 5;
      const dx = p.x - it.x;
      const dy = (p.y - PH * 0.45) - it.y;
      const r = it.k === 'o' ? 10 : 13;
      if (dx * dx + dy * dy < r * r) collectItem(it);
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += q.g * dt;
      if (q.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= 28 * dt;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t >= rings[i].max) rings.splice(i, 1);
    }
  }

  function updateCamera(dt) {
    const p = G.player;
    G.look = lerp(G.look, p.face * 42, Math.min(1, dt * 3.2));
    const tx = p.x - VW * 0.38 + G.look;
    const ty = clamp(p.y - VH * 0.68, 0, Math.max(0, G.worldH - VH));
    G.camX = lerp(G.camX, clamp(tx, 0, Math.max(0, G.worldW - VW)), Math.min(1, dt * 6));
    G.camY = lerp(G.camY, ty, Math.min(1, dt * 5));
    if (G.shake > 0.2 && !REDUCE) G.shake *= Math.pow(0.001, dt);
    else G.shake = 0;
    G.punch += (1 - G.punch) * Math.min(1, dt * 10);
  }

  function updatePlay(dt) {
    if (G.invuln > 0) G.invuln -= dt;
    if (G.hatFlash > 0) G.hatFlash -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.powerT > 0) {
      const was = G.powerT;
      G.powerT -= dt;
      if (G.powerT < 1.6 && ((G.powerT * 8) | 0) !== ((was * 8) | 0)) audio.warn();
      if (G.powerT <= 0) {
        G.powerT = 0;
        G.eatN = 0;
        toast('惊吓结束', true, false);
      }
      syncHud();
    }
    if (G.hatT > 0) {
      G.hatT -= dt;
      if (G.hatT <= 0) {
        G.hat = '';
        G.hatT = 0;
        toast('帽子飞走了', true, false);
        syncHud();
      }
    }
    G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.hat === 'fire') {
      if (fireHold || keys.d) fireShot();
      else if (G.fireCd <= 0) fireShot();
    }

    updatePlayer(dt);
    updateGhosts(dt);
    updateShots(dt);
    updateItems();
    updateCamera(dt);
  }

  function updateAttract(dt) {
    G.camX = (G.time * 26) % Math.max(40, G.worldW - VW);
    G.camY = 0;
    G.player.chomp += dt * 10;
    G.player.run += dt * 4;
    G.player.face = 1;
    for (let i = 0; i < G.ghosts.length; i++) {
      const g = G.ghosts[i];
      g.bob += dt * 5;
      if (g.k === 'walk' && !g.eyes) {
        if (walkEdge(g, g.dir)) g.dir *= -1;
        g.x += g.dir * 40 * dt;
      }
    }
    for (let i = 0; i < G.pellets.length; i++) G.pellets[i].spin += dt * 4;
  }

  function update(dt) {
    G.time += dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.8);
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    if (G.mode === 'title') {
      updateAttract(dt);
      updateFx(dt);
      return;
    }
    if (G.mode !== 'play') {
      updateFx(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      G.player.vy += GRAV * dt;
      G.player.y += G.player.vy * dt * 0.55;
      G.player.squash = 1.25;
      if (G.deadT <= 0) afterDeath();
      updateFx(dt);
      return;
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      G.player.chomp += dt * 16;
      if (G.clearT <= 0) nextStage();
      updateFx(dt);
      updateCamera(dt);
      return;
    }
    updatePlay(dt);
    updateFx(dt);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 18; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.4, 1.4),
        a: rand(0.04, 0.12),
        p: rand(0, 1)
      });
    }
  }

  function seedStars() {
    stars.length = 0;
    const rng = rngSeed(G.stage * 17 + 5);
    for (let i = 0; i < 36; i++) {
      stars.push({
        x: rng() * G.worldW,
        y: rng() * 90,
        r: 0.5 + rng() * 1.3,
        a: 0.25 + rng() * 0.6
      });
    }
  }

  function applyView() {
    const shx = REDUCE ? 0 : (G.shake ? (Math.random() - 0.5) * G.shake : 0);
    const shy = REDUCE ? 0 : (G.shake ? (Math.random() - 0.5) * G.shake * 0.7 : 0);
    const punch = REDUCE ? 1 : G.punch;
    ctx.setTransform(viewScale * punch, 0, 0, viewScale * punch, ox + shx * viewScale, oy + shy * viewScale);
    ctx.translate(-G.camX, -G.camY);
  }

  function drawSky() {
    const night = nightOn() || G.mode === 'title' && G.kind === 'night';
    const g = ctx.createLinearGradient(0, G.camY, 0, G.camY + VH);
    if (night) {
      g.addColorStop(0, '#0a0618');
      g.addColorStop(0.55, '#12081c');
      g.addColorStop(1, '#1a1020');
    } else {
      g.addColorStop(0, '#14100c');
      g.addColorStop(0.5, '#1a140e');
      g.addColorStop(1, '#22180c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(G.camX - 4, G.camY - 4, VW + 8, VH + 8);

    if (night) {
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.fillStyle = rgba(WHT, s.a * (0.55 + Math.sin(G.time * 2 + i) * 0.35));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
    }

    const par = G.camX * 0.35;
    ctx.fillStyle = night ? 'rgba(80, 40, 110, 0.35)' : 'rgba(60, 90, 70, 0.28)';
    ctx.beginPath();
    ctx.moveTo(G.camX - 20, G.camY + 150);
    for (let i = 0; i < 8; i++) {
      const x = G.camX - 40 + i * 80 - (par % 80);
      ctx.quadraticCurveTo(x + 40, G.camY + 90 + (i % 3) * 12, x + 80, G.camY + 150);
    }
    ctx.lineTo(G.camX + VW + 20, G.camY + VH);
    ctx.lineTo(G.camX - 20, G.camY + VH);
    ctx.fill();

    ctx.fillStyle = night ? 'rgba(90, 50, 80, 0.4)' : 'rgba(70, 110, 72, 0.32)';
    ctx.beginPath();
    ctx.moveTo(G.camX - 20, G.camY + 190);
    for (let i = 0; i < 10; i++) {
      const x = G.camX - 30 + i * 64 - ((G.camX * 0.55) % 64);
      ctx.lineTo(x + 32, G.camY + 140 - (i % 2) * 16);
      ctx.lineTo(x + 64, G.camY + 190);
    }
    ctx.lineTo(G.camX + VW + 20, G.camY + VH);
    ctx.lineTo(G.camX - 20, G.camY + VH);
    ctx.fill();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = G.camX + ((m.x + G.time * 0.02 * (0.4 + m.p)) % 1) * VW;
      const my = G.camY + ((m.y + Math.sin(G.time * 0.4 + m.p) * 0.04) % 1) * VH * 0.7;
      ctx.fillStyle = rgba(GOLD, m.a);
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawTiles() {
    if (!G.tiles) return;
    const c0 = Math.max(0, (G.camX / TILE | 0) - 1);
    const c1 = Math.min(G.cols - 1, ((G.camX + VW) / TILE | 0) + 1);
    const r0 = Math.max(0, (G.camY / TILE | 0) - 1);
    const r1 = Math.min(ROWS - 1, ((G.camY + VH) / TILE | 0) + 1);
    const night = nightOn();
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = G.tiles[r][c];
        const x = c * TILE;
        const y = r * TILE;
        if (ch === '~') {
          ctx.fillStyle = night ? 'rgba(40, 8, 28, 0.85)' : 'rgba(18, 8, 22, 0.8)';
          ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
          ctx.fillStyle = rgba(MAG, 0.12 + Math.sin(G.time * 3 + c) * 0.06);
          ctx.fillRect(x, y, TILE, 3);
          continue;
        }
        if (ch === '#' || ch === 's') {
          ctx.fillStyle = night ? '#3a2840' : '#3a4a28';
          ctx.fillRect(x, y, TILE + 0.4, TILE + 0.4);
          if (r === 0 || G.tiles[r - 1][c] === '.' || G.tiles[r - 1][c] === '~' || !G.tiles[r - 1][c] || 'oO*hrg@Ey'.indexOf(G.tiles[r - 1][c]) >= 0) {
            ctx.fillStyle = night ? '#6a3a88' : '#6adf4a';
            ctx.fillRect(x, y, TILE + 0.4, 5);
            ctx.fillStyle = rgba(GOLD, 0.18);
            ctx.fillRect(x + 3, y + 1, 4, 2);
          }
          if (ch === 's') {
            ctx.fillStyle = rgba(CYN, 0.85);
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 4);
            ctx.lineTo(x + TILE - 5, y + 4);
            ctx.lineTo(x + TILE - 8, y + 14);
            ctx.lineTo(x + 8, y + 14);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = rgba(WHT, 0.5);
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 8, y + 6, TILE - 16, 3);
            const squash = 1 + Math.sin(G.time * 8 + c) * 0.08;
            ctx.fillStyle = rgba(GOLD, 0.7);
            ctx.fillRect(x + TILE * 0.5 - 3, y - 2 * squash, 6, 6);
          }
          if ((c + r) % 3 === 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(x + 6, y + 10, 5, 4);
          }
        } else if (ch === '=') {
          ctx.fillStyle = night ? '#504070' : '#c87838';
          ctx.fillRect(x, y, TILE + 0.3, 8);
          ctx.fillStyle = rgba(GOLD, 0.25);
          ctx.fillRect(x, y, TILE, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(x, y + 8, TILE, 3);
        }
      }
    }
    if (G.start) {
      const hx = 2 * TILE;
      const hy = 8 * TILE;
      ctx.fillStyle = night ? '#402030' : '#6a3a28';
      ctx.fillRect(hx - 10, hy - 28, 28, 28);
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.beginPath();
      ctx.moveTo(hx - 14, hy - 28);
      ctx.lineTo(hx + 4, hy - 42);
      ctx.lineTo(hx + 22, hy - 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(hx - 2, hy - 16, 8, 16);
    }
  }

  function drawPellet(it) {
    if (!it.alive) return;
    const bob = Math.sin(G.time * 4 + it.spin) * 2;
    ctx.save();
    ctx.translate(it.x, it.y + bob);
    if (it.k === 'o') {
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, TAU);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(-0.8, -0.8, 1.1, 0, TAU);
      ctx.fill();
    } else if (it.k === 'O') {
      const r = 5.4 + Math.sin(G.time * 8) * 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (it.k === '*') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(-2.4, 1, 4.2, 0, TAU);
      ctx.arc(2.4, 1, 4.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([40, 180, 70], 1);
      ctx.fillRect(-1, -6, 2, 5);
    } else if (it.k === 'h') {
      ctx.rotate(G.time * 10);
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 9);
      ctx.stroke();
      ctx.rotate(-G.time * 10);
      ctx.beginPath();
      ctx.arc(0, 2, 4.2, 0, TAU);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fill();
    } else if (it.k === 'r') {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 4);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-5, 4, 10, 2);
    }
    ctx.restore();
  }

  function drawFairy() {
    const f = G.fairy;
    if (!f || !f.alive) return;
    const bob = Math.sin(G.time * 5) * 3;
    ctx.save();
    ctx.translate(f.x, f.y + bob);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = rgba(WHT, 0.45);
    ctx.beginPath();
    ctx.ellipse(-7, -2, 6, 3.2, -0.5, 0, TAU);
    ctx.ellipse(7, -2, 6, 3.2, 0.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, TAU);
    ctx.fillStyle = rgba(PINK, 1);
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(-1.8, -1, 0.9, 0, TAU);
    ctx.arc(1.8, -1, 0.9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(0, -7, 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGhost(g) {
    ctx.save();
    ctx.translate(g.x, g.y - 8 + Math.sin(g.bob) * (g.k === 'fly' ? 3.5 : 1.2));
    if (g.flash > 0) ctx.globalAlpha = 0.5 + Math.sin(g.flash * 40) * 0.5;
    if (g.eyes) {
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.ellipse(-3.4, -2, 2.6, 3.2, 0, 0, TAU);
      ctx.ellipse(3.4, -2, 2.6, 3.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1020aa';
      ctx.beginPath();
      ctx.arc(-3.4 + g.dir, -2, 1.1, 0, TAU);
      ctx.arc(3.4 + g.dir, -2, 1.1, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    const fright = G.powerT > 0 && g.wait <= 0;
    const blink = fright && G.powerT < 1.6 && ((G.time * 8) | 0) % 2 === 0;
    let rgb = fright ? (blink ? WHT : FRIGHT) : g.rgb;
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.quadraticCurveTo(-8, -12, 0, -12);
    ctx.quadraticCurveTo(8, -12, 8, 2);
    ctx.lineTo(6, 8);
    ctx.lineTo(3, 3);
    ctx.lineTo(0, 8);
    ctx.lineTo(-3, 3);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fillStyle = rgba(rgb, g.wait > 0 ? 0.45 : 0.95);
    ctx.fill();
    ctx.fillStyle = blink ? rgba(MAG, 0.9) : '#0a0904';
    ctx.beginPath();
    ctx.arc(-3.2, -4, 1.6, 0, TAU);
    ctx.arc(3.2, -4, 1.6, 0, TAU);
    ctx.fill();
    if (fright) {
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, 2);
      ctx.quadraticCurveTo(-1.5, 4, 0, 2);
      ctx.quadraticCurveTo(1.5, 4, 3, 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPac() {
    const p = G.player;
    const blink = G.invuln > 0 && ((G.time * 18) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.save();
    ctx.scale(1, 0.32);
    ctx.beginPath();
    ctx.arc(0, 2, 8.5, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fill();
    ctx.restore();
    if (blink && G.deadT <= 0) ctx.globalAlpha = 0.45;
    ctx.scale(p.face, p.squash);
    const mouth = 0.28 + (0.5 + 0.5 * Math.sin(p.chomp)) * 0.72;
    ctx.beginPath();
    ctx.arc(0, -PH * 0.55, 11, mouth, TAU - mouth, false);
    ctx.lineTo(0, -PH * 0.55);
    ctx.closePath();
    ctx.fillStyle = rgba(G.powerT > 0 ? mixRgb(HOT, WHT, 0.25) : HOT, 1);
    if (G.hatFlash > 0) {
      ctx.shadowColor = rgba(G.hat === 'fire' ? ORG : CYN, 0.9);
      ctx.shadowBlur = 16;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0904';
    ctx.beginPath();
    ctx.arc(-1.6, -PH * 0.78, 1.35, 0, TAU);
    ctx.fill();
    const swing = p.on ? Math.sin(p.run * 22) * 5 : 3;
    ctx.fillStyle = rgba(HOT, 1);
    ctx.fillRect(-5.2, -2, 3.4, 7 + Math.max(0, swing));
    ctx.fillRect(1.4, -2, 3.4, 7 - Math.min(3, swing));
    if (G.hat === 'heli') {
      ctx.save();
      ctx.translate(0, -PH * 0.95);
      ctx.rotate(G.time * 14);
      ctx.strokeStyle = rgba(CYN, 0.95);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.moveTo(0, -3);
      ctx.lineTo(0, 3);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(0, -PH * 0.92, 3.4, 0, TAU);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fill();
    } else if (G.hat === 'fire') {
      ctx.beginPath();
      ctx.moveTo(0, -PH * 1.15);
      ctx.lineTo(6.5, -PH * 0.78);
      ctx.lineTo(-6.5, -PH * 0.78);
      ctx.closePath();
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(-6, -PH * 0.8, 12, 2.2);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.ellipse(-1, 0, 3.2, 1.6, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / r.max;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6 + t * 22, 0, TAU);
      ctx.strokeStyle = rgba(r.rgb, 1 - t);
      ctx.lineWidth = 2 * (1 - t);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, TAU);
      ctx.fillStyle = rgba(q.rgb, Math.max(0, q.t / q.life));
      ctx.fill();
    }
    ctx.font = '700 10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < pops.length; i++) {
      const q = pops[i];
      ctx.fillStyle = rgba(q.rgb, Math.max(0, q.t / q.life));
      ctx.fillText(q.text, q.x, q.y);
    }
  }

  function drawFlash() {
    if (G.flash <= 0.02 || REDUCE) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#08060a';
    ctx.fillRect(0, 0, W, H);
    applyView();
    drawSky();
    drawTiles();
    for (let i = 0; i < G.pellets.length; i++) drawPellet(G.pellets[i]);
    drawFairy();
    for (let i = 0; i < G.ghosts.length; i++) drawGhost(G.ghosts[i]);
    drawShots();
    drawPac();
    drawFx();
    drawFlash();
  }

  function setKey(dir, down) {
    if (dir === 'left') keys.l = down;
    if (dir === 'right') keys.r = down;
    if (dir === 'up') keys.u = down;
    if (dir === 'down') keys.d = down;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startHome();
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
    if (isLf) setKey('left', down);
    if (isRt) setKey('right', down);
    if (isUp) setKey('up', down);
    if (isDn) setKey('down', down);
    if (isSp || isUp) jumpHold = down;
    if (isDn) fireHold = down;
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
    if (isSp || isUp) {
      if (!overlayBlocksPlay()) doJump();
    }
    if (isDn && !overlayBlocksPlay()) fireShot();
    if (k === '2') {
      if (G.mode === 'title') startNight();
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
      if (dir === 'fire') {
        fireHold = true;
        if (!overlayBlocksPlay()) fireShot();
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

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    viewScale = Math.min(W / VW, H / VH);
    ox = (W - VW * viewScale) * 0.5;
    oy = (H - VH * viewScale) * 0.5;
    seedMotes();
  }

  function onPointerDown(e) {
    audio.ensure();
    if (canvas && canvas.focus) canvas.focus();
    if (overlayOpen()) return;
    if (e.target && e.target.closest && e.target.closest('.pad')) return;
    doJump();
    jumpHold = true;
  }
  function onPointerUp() {
    jumpHold = false;
  }

  if (!hasDom) {
    selfCheck();
    return;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    jumpHold = false;
    fireHold = false;
  });

  if (btnHome) btnHome.addEventListener('click', function () { audio.ensure(); startHome(); });
  if (btnNight) btnNight.addEventListener('click', function () { audio.ensure(); startNight(); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeHome) modeHome.addEventListener('click', function () {
    audio.ensure();
    startHome();
  });
  if (modeNight) modeNight.addEventListener('click', function () {
    audio.ensure();
    startNight();
  });

  bindPad(padBtns.left, 'left');
  bindPad(padBtns.right, 'right');
  bindPad(padBtns.jump, 'jump');
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
  selfCheck();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('左 右 跑 · 跳 · 火 · 把仙子送到尽头');
  }

  let last = performance.now();
  let acc = 0;
  requestAnimationFrame(function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps++;
    }
    draw();
  });
})();
