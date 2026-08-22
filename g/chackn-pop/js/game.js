'use strict';

(function () {
  const COLS = 17;
  const ROWS = 13;
  const EMPTY = 0;
  const WALL = 1;
  const DIRT = 2;
  const CAGE = 3;
  const EGG = 4;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const WALK = 5.45;
  const JUMP_V = -13.05;
  const GRAV = 23.2;
  const MAX_FALL = 16.5;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 0.56;
  const PH = 0.84;
  const BOMB_MAX = 2;
  const FUSE = 0.28;
  const SMOKE_T = 0.44;
  const INVULN = 1.38;
  const DEAD_T = 0.72;
  const CLEAR_T = 1.12;
  const COMBO_WIN = 2.15;
  const SWIPE = 22;
  const BEST_KEY = 'playbox-chackn-pop-best';
  const MUTE_KEY = 'playbox-chackn-pop-mute';
  const AUTO_SPEED_KEY = 'playbox-chackn-pop-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  const LETTERS = 'EXTEND';
  const OPS = '方向键走跳 · WASD 上右下 · 空格丢弹 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const MINT = [30, 230, 168];
  const LIME = [61, 255, 196];
  const DIRT_C = [168, 96, 42];
  const PURP = [196, 108, 255];
  const WHT = [246, 243, 255];

  function M(rows) {
    const wall = '#################';
    if (rows.length !== ROWS - 2) throw new Error('stage rows ' + rows.length);
    const out = [wall];
    for (let i = 0; i < rows.length; i++) {
      const s = rows[i];
      if (s.length !== COLS - 2) throw new Error('len ' + s.length + ' [' + s + ']');
      out.push('#' + s + '#');
    }
    out.push(wall);
    return out;
  }

  const STAGES = [
    {
      name: '心田',
      sub: 'HEART',
      hint: '站到缺口上丢弹，跳开，土柱炸开把心弹出来',
      hatch: 17,
      map: M([
        '@..............',
        'DDD.DDDD.DDD.DD',
        '.....E.........',
        '...............',
        'DDDC.DDDCDDD.DD',
        '...............',
        '...............',
        'DDDDDDDDDDD.CDD',
        '...............',
        '...............',
        'DDDDDDDDDDDDDDD'
      ])
    },
    {
      name: '双笼',
      sub: 'TWIN',
      hint: '两层笼子，炸完上层再下去接心',
      hatch: 15,
      map: M([
        '@..............',
        'DD.DDD.DDD.DD.D',
        '..E.........E..',
        '...............',
        'DDC.DDD.DDD.DCD',
        '...............',
        '...............',
        'DD.C.DDD.C.DDDD',
        '...............',
        '...............',
        'DDDDDDDDDDDDDDD'
      ])
    },
    {
      name: '井列',
      sub: 'WELL',
      hint: '对准井口丢弹，一列炸穿三口井',
      hatch: 14,
      map: M([
        '@..............',
        'D.DDDDD.DDDDD.D',
        '...............',
        'D.D...D.D...D.D',
        'DCD...DCD...DCD',
        'D.D...D.D...D.D',
        '...............',
        'DD.DDDD.DDDD.DD',
        '..E.........E..',
        '...............',
        'DDDDDDDDDDDDDDD'
      ])
    },
    {
      name: '交错',
      sub: 'SHIFT',
      hint: '台子错开，先炸能落脚的那一列',
      hatch: 13,
      map: M([
        '@..............',
        'DDCD...DDD...DD',
        '....E..........',
        '...............',
        '...DDDCDDDDD...',
        '...............',
        '...............',
        'DDDDDCD.CDDDDDD',
        'E..............',
        '...............',
        'DDDDDDDDDDDDDDD'
      ])
    },
    {
      name: '卵窝',
      sub: 'NEST',
      hint: '卵多，别磨蹭，先砸笼再清怪',
      hatch: 11,
      map: M([
        '@..............',
        'DD.DDD.DDD.DD.D',
        '.E..E.....E..E.',
        '...............',
        'D.C.DDD.C.DD.C.',
        '...............',
        '...............',
        'DDDC.DDD.CDD.DD',
        '.E...........E.',
        '...............',
        'DDDDDDDDDDDDDDD'
      ])
    },
    {
      name: '迷宫',
      sub: 'MAZE',
      hint: '两口竖井，炸开通道再钻进去救人',
      hatch: 10,
      map: M([
        '@..............',
        'D.DDDDDDDDDDD.D',
        'D.D..........D.',
        'D.D.DDDDDD.D.D.',
        'D.D.D.C..C.D.D.',
        'D.D.D......D.D.',
        'D.D.DD.CDD.D.D.',
        'D.D..........D.',
        'D.DDDDDDDDDD.D.',
        'DE....E.....ED.',
        'DDDDDDDDDDDDDDD'
      ])
    },
    {
      name: '危台',
      sub: 'LEDGE',
      hint: '落脚窄，炸完立刻跳，别跟烟待一起',
      hatch: 9,
      map: M([
        '@..............',
        'DDD.........DDD',
        '...............',
        '...............',
        'C..C.DDD.C.....',
        '...............',
        '...............',
        'DDD....C....DDD',
        '..E.........E..',
        '...............',
        'DDDDDDDDDDDDDDD'
      ])
    },
    {
      name: '心海',
      sub: 'SEA',
      hint: '心最多，卵也最多，连爆着救',
      hatch: 8,
      map: M([
        '@..............',
        'D.D.D.D.D.D.D.D',
        '.E.E...E...E.E.',
        '...............',
        'C.D.D.C.D.D.C.D',
        '...............',
        '...............',
        'D.C.D.D.C.D.D.C',
        '.E...........E.',
        '...............',
        'DDDDDDDDDDDDDDD'
      ])
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
  function idx(c, r) {
    return r * COLS + c;
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }

  function parseMap(rows) {
    const grid = new Uint8Array(COLS * ROWS);
    const mons = [];
    let player = { c: 1, r: 1 };
    let cages = 0;
    let eggs = 0;
    for (let r = 0; r < ROWS; r++) {
      const row = rows[r];
      for (let c = 0; c < COLS; c++) {
        const ch = row.charAt(c);
        const i = idx(c, r);
        if (ch === '#') grid[i] = WALL;
        else if (ch === 'D') grid[i] = DIRT;
        else if (ch === 'C') {
          grid[i] = CAGE;
          cages += 1;
        } else if (ch === 'E') {
          grid[i] = EGG;
          eggs += 1;
        } else if (ch === '@') {
          grid[i] = EMPTY;
          player = { c: c, r: r };
        } else if (ch === 'B') {
          grid[i] = EMPTY;
          mons.push({ c: c, r: r });
        } else grid[i] = EMPTY;
      }
    }
    return { grid: grid, player: player, cages: cages, eggs: eggs, mons: mons };
  }

  function tileOf(grid, c, r) {
    if (!inb(c, r)) return WALL;
    return grid[idx(c, r)];
  }

  function isSolidT(t) {
    return t === WALL || t === DIRT || t === CAGE;
  }

  function selfCheck() {
    if (STAGES.length !== 8) throw new Error('need 8 stages');
    if (LETTERS.length !== 6) throw new Error('extend');
    for (let i = 0; i < STAGES.length; i++) {
      const p = parseMap(STAGES[i].map);
      if (p.grid[idx(0, 0)] !== WALL || p.grid[idx(COLS - 1, ROWS - 1)] !== WALL) {
        throw new Error('outer wall ' + i);
      }
      if (p.grid[idx(p.player.c, p.player.r)] !== EMPTY) throw new Error('spawn blocked ' + i);
      const below = tileOf(p.grid, p.player.c, p.player.r + 1);
      if (!isSolidT(below)) throw new Error('spawn floor ' + i);
      if (p.cages < 2) throw new Error('cages ' + i);
      for (let c = 1; c < COLS - 1; c++) {
        if (p.grid[idx(c, ROWS - 2)] === CAGE) throw new Error('floor cage ' + i);
        if (p.grid[idx(c, ROWS - 2)] !== DIRT && p.grid[idx(c, ROWS - 2)] !== WALL) {
          throw new Error('floor hole ' + i);
        }
      }
    }
    const jumpH = (JUMP_V * JUMP_V) / (2 * GRAV);
    if (jumpH < 3.2 || jumpH > 4.4) throw new Error('jump height ' + jumpH);
    if (SPEED_LABELS.length !== 5 || SPEED_LABELS[3] !== '快') throw new Error('auto speed labels');
    if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] < 2) throw new Error('auto scale');
    if (Math.floor(5.05 + 0.02) !== 5) throw new Error('land snap');
    const g = new Uint8Array(COLS * ROWS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1) g[idx(c, r)] = WALL;
      }
    }
    g[idx(5, 4)] = DIRT;
    g[idx(5, 8)] = CAGE;
    g[idx(5, 6)] = EGG;
    let dirt = 0;
    let cage = 0;
    let egg = 0;
    for (let r = 1; r < ROWS - 1; r++) {
      const t = g[idx(5, r)];
      if (t === DIRT) {
        g[idx(5, r)] = EMPTY;
        dirt += 1;
      } else if (t === CAGE) {
        g[idx(5, r)] = EMPTY;
        cage += 1;
      } else if (t === EGG) {
        g[idx(5, r)] = EMPTY;
        egg += 1;
      }
    }
    if (dirt !== 1 || cage !== 1 || egg !== 1) throw new Error('column blast');
    if (g[idx(5, 4)] !== EMPTY || g[idx(5, 8)] !== EMPTY) throw new Error('column remain');
    const s1 = parseMap(STAGES[0].map);
    if (s1.cages !== 3) throw new Error('s1 cages ' + s1.cages);
    return true;
  }

  selfCheck();

  if (!hasDom) {
    console.log('chackn-pop ok');
    return;
  }

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
  const btnSave = el('btn-save');
  const btnChase = el('btn-chase');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const btnAuto = el('btn-auto');
  const speedEl = el('speed');
  const speedLab = el('speed-lab');
  const modeSave = el('mode-save');
  const modeChase = el('mode-chase');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const roundEl = el('round');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const lettersEl = el('letters');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const stageEl = el('stage');
  const padBtns = {
    left: el('btn-left'),
    right: el('btn-right'),
    jump: el('btn-jump'),
    bomb: el('btn-bomb')
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

  const keys = { l: false, r: false, u: false, d: false, jumpHold: false };
  let jumpBuf = 0;
  let coyote = 0;
  let face = 1;
  const ptr = { down: false, id: null, sx: 0, sy: 0, x: 0, y: 0, dragging: false, dir: 0 };
  const pips = [];
  const particles = [];
  const pops = [];

  const G = {
    mode: 'title',
    kind: 'save',
    t: 0,
    clock: 0,
    stageT: 0,
    stage: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 1,
    comboT: 0,
    grid: new Uint8Array(COLS * ROWS),
    hatch: new Float32Array(COLS * ROWS),
    player: {
      x: 1.5, y: 2, vx: 0, vy: 0, on: false, squash: 0,
      spawnX: 1.5, spawnY: 2
    },
    bombs: [],
    smokes: [],
    hearts: [],
    mons: [],
    letters: [],
    got: [0, 0, 0, 0, 0, 0],
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MINT,
    toastT: 0,
    dead: false,
    deadT: 0,
    clearT: 0,
    bombCd: 0,
    need: 0,
    saved: 0
  };

  let autoOn = false;
  let autoSpeed = 3;
  let autoFleeT = 0;
  let autoFleeC = -1;
  let autoBombT = 0;
  let autoStuck = 0;
  let autoLastX = 0;
  let autoLastY = 0;
  let autoWinWait = 0;
  let autoHoldJump = false;
  let autoStamp = 1;
  let autoNav = null;
  let autoNavStamp = 0;
  let autoDropLock = 0;

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
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
    jump() {
      this.ensure();
      this.beep(520, 0.08, 'square', 0.04, 280);
    },
    drop() {
      this.ensure();
      this.beep(180, 0.06, 'triangle', 0.04, 90);
    },
    fuse() {
      this.ensure();
      this.noise(0.05, 0.02, 1800);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 220);
      this.beep(140, 0.16, 'sawtooth', 0.06, 48);
      this.beep(90, 0.18, 'sine', 0.05, 40);
    },
    heartFree() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.05, 880);
      this.beep(784, 0.16, 'triangle', 0.05);
    },
    heartGet(n) {
      this.ensure();
      const k = Math.max(1, n || 1);
      this.beep(660 + k * 80, 0.1, 'sine', 0.055);
      this.beep(880 + k * 60, 0.16, 'triangle', 0.05);
    },
    letter() {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.04);
      this.beep(1174, 0.14, 'sine', 0.045);
    },
    extend() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.055);
      this.beep(659, 0.12, 'sine', 0.05);
      this.beep(784, 0.14, 'sine', 0.05);
      this.beep(1046, 0.28, 'triangle', 0.06, 1560);
    },
    kill(n) {
      this.ensure();
      const k = Math.max(1, n || 1);
      this.beep(220 + k * 70, 0.1, 'sawtooth', 0.05, 80);
      this.noise(0.08, 0.04, 400);
    },
    hatch() {
      this.ensure();
      this.beep(240, 0.1, 'sawtooth', 0.04, 420);
      this.noise(0.06, 0.03, 600);
    },
    hurt() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.05, 70);
      this.noise(0.1, 0.04, 500);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.055);
      this.beep(659, 0.12, 'sine', 0.05);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.28, 'triangle', 0.055, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.28, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 784);
    }
  };

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

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  function addScore(n, x, y) {
    if (n <= 0) return;
    if (G.mode !== 'play' && G.mode !== 'win') return;
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
    if (x != null) spawnPop(x, y, '+' + n, n >= 800 ? GOLD : n >= 300 ? MAG : LIME);
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
    while (pips.length < G.lives) {
      const iel = document.createElement('i');
      iel.className = 'pip on';
      pipsEl.appendChild(iel);
      pips.push(iel);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncLetters() {
    if (!lettersEl) return;
    let html = '';
    for (let i = 0; i < 6; i++) {
      html += '<i class="' + (G.got[i] ? 'on' : '') + '">' + LETTERS.charAt(i) + '</i>';
    }
    lettersEl.innerHTML = html;
  }

  function syncModes() {
    if (modeSave) modeSave.setAttribute('aria-pressed', G.kind === 'save' ? 'true' : 'false');
    if (modeChase) modeChase.setAttribute('aria-pressed', G.kind === 'chase' ? 'true' : 'false');
  }

  function liveMons() {
    let n = 0;
    for (let i = 0; i < G.mons.length; i++) if (!G.mons[i].dead) n += 1;
    return n;
  }

  function eggCount() {
    let n = 0;
    for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === EGG) n += 1;
    return n;
  }

  function cageCount() {
    let n = 0;
    for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === CAGE) n += 1;
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (roundEl) roundEl.textContent = String(G.stage + 1);
    const left = cageCount() + G.hearts.length;
    const mons = liveMons();
    const eggs = eggCount();
    if (tagLabel) {
      let t = '心 ' + left;
      if (mons) t += ' · 怪 ' + mons;
      if (eggs) t += ' · 卵 ' + eggs;
      tagLabel.textContent = t;
      tagLabel.classList.toggle('warn', mons >= 4 || (G.kind === 'chase' && eggs > 0));
    }
    if (stageLabel) {
      const st = STAGES[G.stage] || STAGES[0];
      const modeName = G.kind === 'chase' ? '追击' : '救人';
      if (G.mode === 'title') stageLabel.textContent = modeName;
      else stageLabel.textContent = modeName + ' ' + (G.stage + 1) + '/' + STAGES.length + ' · ' + st.name;
      stageLabel.classList.toggle('hot', G.combo >= 2);
    }
    if (comboEl) comboEl.textContent = '×' + G.combo;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    syncPips();
    syncModes();
    syncLetters();
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
      if (ovKicker) ovKicker.textContent = 'CHACK';
      if (ovTitle) ovTitle.textContent = '企鹅';
      if (ovLead) ovLead.innerHTML = '丢炸弹砸开土柱，救出笼子里的心。<br />别挨怪，也别被自己的烟呛到。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (G.stage >= STAGES.length - 1) {
        if (ovTitle) ovTitle.textContent = G.kind === 'chase' ? '追击平了' : '爱心归位';
        if (ovLead) ovLead.textContent = '八面都救完。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '') + '。';
        if (ovAgain) ovAgain.textContent = '再来一轮';
      } else {
        if (ovTitle) ovTitle.textContent = '心全救出';
        const st = STAGES[G.stage] || STAGES[0];
        if (ovLead) ovLead.textContent = st.name + ' 的心都回来了。下一关卵更密。';
        if (ovAgain) ovAgain.textContent = '下一关';
      }
      if (ovOps) ovOps.textContent = 'R 重开 · 空格下一关 · A 自动';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = '命尽了';
      if (ovLead) ovLead.textContent = (G.kind === 'chase' ? '追击里 ' : '') + '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
  }

  function kickBoard(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(ms) {
    if (REDUCE) return;
    if (autoOn && autoSpeed >= 4) return;
    const t = clamp(ms / 1000, 0.03, 0.08);
    G.stop = Math.max(G.stop, t);
  }

  function bumpAutoNav() {
    autoStamp += 1;
    autoNav = null;
  }

  function emit(n, spec) {
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

  function showChain(n, word) {
    if (n < 2) return;
    if (comboEl) comboEl.textContent = '×' + n;
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    const label = (word || '连爆') + ' ×' + n;
    if (chainPop && !REDUCE) {
      chainTok += 1;
      const tok = chainTok;
      chainPop.textContent = label;
      chainPop.classList.remove('hidden');
      chainPop.style.animation = 'none';
      void chainPop.offsetWidth;
      chainPop.style.animation = '';
      setTimeout(function () {
        if (tok === chainTok) chainPop.classList.add('hidden');
      }, 720);
    } else {
      toast(label, false, true);
    }
  }

  function tile(c, r) {
    if (!inb(c, r)) return WALL;
    return G.grid[idx(c, r)];
  }

  function solid(c, r) {
    return isSolidT(tile(c, r));
  }

  function overlapSolid(x0, y0, x1, y1) {
    const c0 = Math.floor(x0);
    const r0 = Math.floor(y0);
    const c1 = Math.floor(x1 - 1e-9);
    const r1 = Math.floor(y1 - 1e-9);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (solid(c, r)) return true;
      }
    }
    return false;
  }

  function moveActor(a, dt, w, h) {
    const hw = w * 0.5;
    a.x += a.vx * dt;
    let left = a.x - hw;
    let right = a.x + hw;
    let top = a.y - h;
    let bot = a.y;
    if (a.vx > 0 && overlapSolid(right - 0.02, top + 0.12, right, bot - 0.1)) {
      a.x = Math.floor(right) - hw - 0.001;
      a.vx = 0;
    } else if (a.vx < 0 && overlapSolid(left, top + 0.12, left + 0.02, bot - 0.1)) {
      a.x = Math.floor(left) + 1 + hw + 0.001;
      a.vx = 0;
    }
    a.vy += GRAV * dt;
    if (a.vy > MAX_FALL) a.vy = MAX_FALL;
    a.y += a.vy * dt;
    left = a.x - hw;
    right = a.x + hw;
    top = a.y - h;
    bot = a.y;
    a.on = false;
    if (a.vy >= 0) {
      if (overlapSolid(left + 0.08, bot - 0.04, right - 0.08, bot + 0.05)) {
        a.y = Math.floor(bot + 0.02);
        a.vy = 0;
        a.on = true;
      }
    } else if (overlapSolid(left + 0.08, top, right - 0.08, top + 0.1)) {
      a.y = Math.floor(top) + 1 + h + 0.001;
      a.vy = 0;
    }
    if (a.x < 1.2) a.x = 1.2;
    if (a.x > COLS - 1.2) a.x = COLS - 1.2;
    if (a.y < 1.08) {
      a.y = 1.08;
      if (a.vy < 0) a.vy = 0;
    }
    if (a.y > ROWS - 0.05) {
      a.y = ROWS - 1;
      a.vy = 0;
      a.on = true;
    }
  }

  function makeMon(x, y) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      on: false,
      face: Math.random() < 0.5 ? -1 : 1,
      wob: Math.random() * TAU,
      dead: false,
      hatch: 0.28,
      squash: 0
    };
  }

  function spawnExtraMons(n) {
    if (n <= 0) return;
    const spots = [];
    for (let r = 2; r < ROWS - 2; r++) {
      for (let c = 2; c < COLS - 2; c++) {
        if (tile(c, r) !== EMPTY) continue;
        if (!solid(c, r + 1)) continue;
        const d = Math.abs(c + 0.5 - G.player.x) + Math.abs(r + 1 - G.player.y);
        if (d < 4) continue;
        spots.push({ c: c, r: r, d: d });
      }
    }
    spots.sort(function (a, b) { return b.d - a.d; });
    for (let i = 0; i < n && i < spots.length; i++) {
      const m = makeMon(spots[i].c + 0.5, spots[i].r + 1);
      m.hatch = 0.15;
      G.mons.push(m);
    }
  }

  function hatchAt(c, r) {
    const i = idx(c, r);
    if (G.grid[i] !== EGG) return;
    G.grid[i] = EMPTY;
    G.hatch[i] = 0;
    audio.hatch();
    emit(14, {
      x: c + 0.5, y: r + 0.5, j: 0.18,
      vx0: -3.2, vx1: 3.2, vy0: -5, vy1: 1.2,
      life: 0.42, r0: 0.04, r1: 0.12, rgb: PURP, g: 8
    });
    if (G.mode !== 'play') return;
    const m = makeMon(c + 0.5, r + 1);
    G.mons.push(m);
    toast('孵出来了', true);
  }

  function nextLetterIndex() {
    for (let i = 0; i < 6; i++) if (!G.got[i]) return i;
    return -1;
  }

  function spawnLetterAt(x, y) {
    const i = nextLetterIndex();
    if (i < 0) return;
    for (let k = 0; k < G.letters.length; k++) if (G.letters[k].i === i) return;
    G.letters.push({
      x: x,
      y: y,
      vx: rand(-0.6, 0.6),
      vy: -2.2,
      i: i,
      bob: 0
    });
  }

  function spawnHeart(c, r) {
    G.hearts.push({
      x: c + 0.5,
      y: r + 0.45,
      vx: rand(-1.4, 1.4),
      vy: -3.4,
      bob: rand(0, TAU)
    });
  }

  function buildStage(si, demo) {
    const st = STAGES[si] || STAGES[0];
    const parsed = parseMap(st.map);
    G.grid = parsed.grid;
    G.hatch = new Float32Array(COLS * ROWS);
    G.bombs.length = 0;
    G.smokes.length = 0;
    G.hearts.length = 0;
    G.mons.length = 0;
    G.letters.length = 0;
    G.need = parsed.cages;
    G.saved = 0;
    G.dead = false;
    G.deadT = 0;
    G.clearT = 0;
    G.stageT = 0;
    G.bombCd = 0;
    let ht = st.hatch || 14;
    if (G.kind === 'chase') ht *= 0.62;
    for (let i = 0; i < G.grid.length; i++) {
      if (G.grid[i] === EGG) G.hatch[i] = ht * (0.72 + Math.random() * 0.5);
    }
    G.player.spawnX = parsed.player.c + 0.5;
    G.player.spawnY = parsed.player.r + 1;
    G.player.x = G.player.spawnX;
    G.player.y = G.player.spawnY;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.on = true;
    G.player.squash = 0;
    G.invuln = demo ? 0 : 0.45;
    face = 1;
    jumpBuf = 0;
    coyote = 0.1;
    for (let i = 0; i < parsed.mons.length; i++) {
      G.mons.push(makeMon(parsed.mons[i].c + 0.5, parsed.mons[i].r + 1));
    }
    if (!demo && G.kind === 'chase') spawnExtraMons(1 + (si >= 3 ? 1 : 0) + (si >= 6 ? 1 : 0));
    particles.length = 0;
    pops.length = 0;
    G.flash = 0;
    G.shake = 0;
    G.stop = 0;
    G.combo = 1;
    G.comboT = 0;
    autoFleeT = 0;
    autoFleeC = -1;
    autoBombT = 0;
    autoStuck = 0;
    autoHoldJump = false;
    autoDropLock = 0;
    autoWinWait = 0;
    bumpAutoNav();
  }

  function bumpCombo() {
    if (G.comboT > 0) G.combo += 1;
    else G.combo = 2;
    G.comboT = COMBO_WIN;
    return G.combo;
  }

  function explode(col, by) {
    col = clamp(col | 0, 1, COLS - 2);
    let dirt = 0;
    let freed = 0;
    let eggs = 0;
    for (let r = 1; r < ROWS - 2; r++) {
      const i = idx(col, r);
      const t = G.grid[i];
      if (t === DIRT) {
        G.grid[i] = EMPTY;
        dirt += 1;
        emit(7, {
          x: col + 0.5, y: r + 0.5, j: 0.2,
          vx0: -3.4, vx1: 3.4, vy0: -6, vy1: 1.6,
          life: 0.4, r0: 0.04, r1: 0.11, rgb: DIRT_C, g: 10
        });
      } else if (t === CAGE) {
        G.grid[i] = EMPTY;
        freed += 1;
        spawnHeart(col, r);
        emit(16, {
          x: col + 0.5, y: r + 0.45, j: 0.18,
          vx0: -3.8, vx1: 3.8, vy0: -7, vy1: 1.2,
          life: 0.5, r0: 0.04, r1: 0.12, rgb: MAG, g: 6
        });
      } else if (t === EGG) {
        G.grid[i] = EMPTY;
        G.hatch[i] = 0;
        eggs += 1;
        emit(10, {
          x: col + 0.5, y: r + 0.5, j: 0.16,
          vx0: -2.8, vx1: 2.8, vy0: -4, vy1: 1,
          life: 0.36, r0: 0.04, r1: 0.1, rgb: PURP, g: 7
        });
      }
    }
    G.smokes.push({ c: col, t: SMOKE_T });
    bumpAutoNav();
    audio.boom();
    if (!REDUCE) G.shake = Math.max(G.shake, 9 + freed * 2);
    G.flash = 0.22;
    G.flashRgb = freed ? MAG : MINT;
    kickBoard('boom');
    hitStop(48 + Math.min(28, (freed + eggs) * 8));

    if (dirt) addScore(dirt * 10, col + 0.5, by);
    if (eggs) addScore(eggs * 80, col + 0.5, by + 0.4);

    let kills = 0;
    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (m.dead) continue;
      if (Math.floor(m.x) === col) {
        m.dead = true;
        kills += 1;
        const pts = Math.min(1600, 200 * Math.pow(2, kills - 1));
        addScore(pts, m.x, m.y - 0.4);
        emit(14, {
          x: m.x, y: m.y - 0.3, j: 0.16,
          vx0: -4, vx1: 4, vy0: -6, vy1: 1.4,
          life: 0.45, r0: 0.05, r1: 0.13, rgb: PURP, g: 8
        });
      }
    }
    if (kills) audio.kill(kills);

    if (freed) {
      audio.heartFree();
      toast(freed > 1 ? '心爆开 ×' + freed : '心自由了', false, true);
    }

    const n = freed + kills + (eggs > 1 ? eggs : 0);
    if (n >= 2) {
      showChain(n, '连爆');
      kickBoard('chain');
    }

    if (freed || kills >= 1) spawnLetterAt(col + 0.5, clamp(by, 2, ROWS - 3));

    if (G.mode === 'play' && !G.dead && G.invuln <= 0) {
      if (Math.floor(G.player.x) === col) hurtPlayer('blast');
    }
  }

  function dropBomb() {
    if (G.mode !== 'play' || G.dead) return;
    if (G.bombCd > 0) return;
    let live = 0;
    for (let i = 0; i < G.bombs.length; i++) if (!G.bombs[i].dead) live += 1;
    if (live >= BOMB_MAX) return;
    G.bombCd = 0.16;
    const b = {
      x: G.player.x + face * 0.28,
      y: G.player.y - PH * 0.45,
      vx: face * (G.player.on ? 1.35 : 0.7),
      vy: 0.4,
      fuse: -1,
      dead: false,
      on: false
    };
    if (b.x < 1.15) b.x = 1.15;
    if (b.x > COLS - 1.15) b.x = COLS - 1.15;
    G.bombs.push(b);
    G.player.squash = 0.7;
    audio.drop();
    emit(5, {
      x: b.x, y: b.y, j: 0.08,
      vx0: -1, vx1: 1, vy0: -2, vy1: 0.2,
      life: 0.22, r0: 0.03, r1: 0.07, rgb: MAG, g: 4
    });
  }

  function collectHeart(h, i) {
    G.hearts.splice(i, 1);
    G.saved += 1;
    const n = bumpCombo();
    const pts = 300 * n;
    addScore(pts, h.x, h.y);
    audio.heartGet(n);
    hitStop(36);
    kickBoard('hit');
    emit(18, {
      x: h.x, y: h.y, j: 0.14,
      vx0: -3.5, vx1: 3.5, vy0: -6.5, vy1: 1,
      life: 0.5, r0: 0.04, r1: 0.12, rgb: MAG, g: 5
    });
    if (n >= 2) showChain(n, '连救');
    maybeClear();
  }

  function collectLetter(L, i) {
    G.letters.splice(i, 1);
    G.got[L.i] = 1;
    addScore(150, L.x, L.y);
    audio.letter();
    emit(10, {
      x: L.x, y: L.y, j: 0.12,
      vx0: -2.4, vx1: 2.4, vy0: -4, vy1: 0.6,
      life: 0.4, r0: 0.04, r1: 0.1, rgb: GOLD, g: 4
    });
    syncLetters();
    let all = true;
    for (let k = 0; k < 6; k++) if (!G.got[k]) all = false;
    if (all) {
      G.got = [0, 0, 0, 0, 0, 0];
      G.lives += 1;
      addScore(2000, L.x, L.y - 0.4);
      audio.extend();
      toast('EXTEND 额外一命', false, true);
      hitStop(70);
      kickBoard('clear');
      G.flash = 0.28;
      G.flashRgb = GOLD;
      syncPips();
      syncLetters();
    }
  }

  function maybeClear() {
    if (G.mode !== 'play' || G.dead) return;
    if (cageCount() > 0) return;
    if (G.hearts.length > 0) return;
    G.mode = 'win';
    const timeBonus = Math.max(0, Math.floor((42 - G.stageT) * 18));
    const clearPts = 600 + G.stage * 250 + timeBonus;
    addScore(clearPts, G.player.x, G.player.y - 1);
    audio.win();
    kickBoard('clear');
    hitStop(60);
    G.flash = 0.3;
    G.flashRgb = GOLD;
    G.clearT = CLEAR_T;
    toast('心全救出', false, true);
    setHint('心都回来了', 'hot');
    syncHud();
  }

  function respawn() {
    G.player.x = G.player.spawnX;
    G.player.y = G.player.spawnY;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.on = true;
    G.invuln = INVULN;
    G.dead = false;
    G.deadT = 0;
    face = 1;
  }

  function hurtPlayer(why) {
    if (G.dead || G.mode !== 'play') return;
    if (G.invuln > 0 && why !== 'blast-force') return;
    G.dead = true;
    G.deadT = DEAD_T;
    G.lives -= 1;
    audio.hurt();
    kickBoard('die');
    hitStop(72);
    if (!REDUCE) G.shake = 14;
    G.flash = 0.32;
    G.flashRgb = MAG;
    G.player.squash = 1;
    emit(22, {
      x: G.player.x, y: G.player.y - PH * 0.5, j: 0.2,
      vx0: -4.5, vx1: 4.5, vy0: -7, vy1: 1.6,
      life: 0.5, r0: 0.04, r1: 0.13, rgb: MAG, g: 8
    });
    toast(why === 'blast' ? '被自己的烟呛到' : '撞上怪了', true);
    syncPips();
    if (G.lives <= 0) {
      G.mode = 'lose';
      audio.lose();
      saveBest();
      setHint('命尽了 · R 重开', 'warn');
    }
  }

  function finishDead() {
    if (G.lives <= 0) {
      showOverlay('lose');
      return;
    }
    respawn();
    syncHud();
  }

  function finishClear() {
    showOverlay('win');
  }

  function startKind(kind, resetScore) {
    G.kind = kind === 'chase' ? 'chase' : 'save';
    G.stage = 0;
    G.lives = LIVES;
    if (resetScore || G.mode === 'title' || G.mode === 'lose') {
      G.score = 0;
      G.got = [0, 0, 0, 0, 0, 0];
    }
    G.combo = 1;
    G.comboT = 0;
    G.mode = 'play';
    buildStage(0, false);
    hideOverlay();
    const st = STAGES[0];
    toast(st.name);
    playHint();
    audio.start();
    syncHud();
  }

  function nextOrRestart() {
    if (G.mode === 'win' && G.stage < STAGES.length - 1) {
      G.stage += 1;
      buildStage(G.stage, false);
      G.mode = 'play';
      hideOverlay();
      const st = STAGES[G.stage];
      toast(st.name);
      playHint();
      audio.start();
      syncHud();
      return;
    }
    startKind(G.kind, true);
  }

  function retry() {
    audio.ensure();
    startKind(G.kind || 'save', true);
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'save';
    G.lives = LIVES;
    G.score = 0;
    G.stage = 0;
    G.got = [0, 0, 0, 0, 0, 0];
    buildStage(0, true);
    showOverlay('title');
    playHint();
    syncHud();
  }

  function overlayPrimary() {
    if (!overlayOpen()) return;
    if (G.mode === 'title') {
      startKind(G.kind, false);
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') nextOrRestart();
  }

  function wishX() {
    if (autoOn) {
      let ax = 0;
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      return ax;
    }
    if (ptr.down && ptr.dragging && ptr.dir !== 0) return ptr.dir;
    let x = 0;
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    return x;
  }

  function hypot2(dx, dy) {
    return dx * dx + dy * dy;
  }

  function canStandAt(c, r) {
    return inb(c, r) && solid(c, r) && !solid(c, r - 1);
  }

  function fallLand(c, fromR) {
    if (!inb(c, 0)) return -1;
    const start = fromR < 1 ? 1 : fromR;
    for (let r = start; r < ROWS; r++) {
      if (solid(c, r)) return r;
    }
    return -1;
  }

  function standCell() {
    const p = G.player;
    const c = clamp(Math.floor(p.x), 1, COLS - 2);
    if (p.on) {
      let r = Math.floor(p.y + 0.02);
      if (r < 1) r = 1;
      if (canStandAt(c, r)) return { c: c, r: r };
      if (canStandAt(c, r + 1)) return { c: c, r: r + 1 };
      if (canStandAt(c, r - 1)) return { c: c, r: r - 1 };
    }
    const land = fallLand(c, Math.max(1, Math.floor(p.y)));
    return { c: c, r: land > 0 ? land : ROWS - 1 };
  }

  function autoCanJump(c0, r0, c1, r1) {
    if (r1 >= r0 || r0 - r1 > 4 || r0 - r1 < 2) return false;
    if (Math.abs(c1 - c0) > 2 || c1 === c0) return false;
    if (!canStandAt(c1, r1)) return false;
    if (solid(c0, r1)) return false;
    const a = { x: c0 + 0.5, y: r0, vx: 0, vy: JUMP_V, on: false };
    const tx = c1 + 0.5;
    for (let i = 0; i < 90; i++) {
      const above = a.y <= r1 + 0.06;
      let dir = 0;
      if (above || a.vy >= 0) dir = tx > a.x + 0.08 ? 1 : tx < a.x - 0.08 ? -1 : 0;
      a.vx = dir * WALK;
      moveActor(a, STEP, PW, PH);
      if (a.on && i > 5) {
        const sc = clamp(Math.floor(a.x), 1, COLS - 2);
        const sr = Math.floor(a.y + 0.02);
        return sc === c1 && (sr === r1 || Math.abs(a.y - r1) < 0.28);
      }
    }
    return false;
  }

  function ensureAutoGraph() {
    if (autoNav && autoNavStamp === autoStamp) return autoNav;
    const ok = new Uint8Array(COLS * ROWS);
    const adj = new Array(COLS * ROWS);
    for (let r = 1; r < ROWS; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (canStandAt(c, r)) ok[idx(c, r)] = 1;
      }
    }
    for (let r = 1; r < ROWS; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (!ok[idx(c, r)]) continue;
        const list = [];
        for (let s = -1; s <= 1; s += 2) {
          const nc = c + s;
          if (nc < 1 || nc > COLS - 2) continue;
          if (solid(nc, r - 1) && !canStandAt(nc, r)) continue;
          if (canStandAt(nc, r)) list.push({ c: nc, r: r, act: 0 });
          else {
            const land = fallLand(nc, r);
            if (land > r && canStandAt(nc, land)) list.push({ c: nc, r: land, act: 2 });
          }
        }
        for (let s = -2; s <= 2; s += 4) {
          const nc = c + s;
          const mid = c + (s >> 1);
          if (canStandAt(nc, r) && !solid(mid, r) && !solid(mid, r - 1)) {
            list.push({ c: nc, r: r, act: 1 });
          }
        }
        for (let nc = c - 2; nc <= c + 2; nc++) {
          if (nc === c || nc < 1 || nc > COLS - 2) continue;
          for (let nr = r - 2; nr >= r - 4 && nr >= 2; nr--) {
            if (!ok[idx(nc, nr)]) continue;
            if (solid(c, nr)) continue;
            if (autoCanJump(c, r, nc, nr)) list.push({ c: nc, r: nr, act: 1 });
          }
        }
        adj[idx(c, r)] = list;
      }
    }
    autoNav = { ok: ok, adj: adj };
    autoNavStamp = autoStamp;
    return autoNav;
  }

  function autoFirstStep(gc, gr) {
    const g = ensureAutoGraph();
    const here = standCell();
    if (here.c === gc && here.r === gr) return null;
    const start = idx(here.c, here.r);
    const goal = idx(gc, gr);
    if (!g.ok[start] || !g.ok[goal]) return null;
    const seen = new Int16Array(COLS * ROWS);
    const first = new Int16Array(COLS * ROWS);
    const fact = new Uint8Array(COLS * ROWS);
    for (let i = 0; i < seen.length; i++) {
      seen[i] = -1;
      first[i] = -1;
    }
    const q = [start];
    seen[start] = start;
    let qi = 0;
    while (qi < q.length) {
      const k = q[qi++];
      const list = g.adj[k];
      if (!list) continue;
      for (let i = 0; i < list.length; i++) {
        const nb = list[i];
        const nk = idx(nb.c, nb.r);
        if (seen[nk] >= 0) continue;
        seen[nk] = k;
        if (k === start) {
          first[nk] = nk;
          fact[nk] = nb.act;
        } else {
          first[nk] = first[k];
          fact[nk] = fact[k];
        }
        if (nk === goal) {
          const f = first[nk];
          return { c: f % COLS, r: (f / COLS) | 0, act: fact[nk] };
        }
        q.push(nk);
      }
    }
    return null;
  }

  function simBombCol(px, py, fc, onGround) {
    let x = px + fc * 0.28;
    let y = py - PH * 0.45;
    let vx = fc * (onGround ? 1.35 : 0.7);
    let vy = 0.4;
    if (x < 1.15) x = 1.15;
    if (x > COLS - 1.15) x = COLS - 1.15;
    for (let i = 0; i < 160; i++) {
      vy += GRAV * STEP;
      if (vy > MAX_FALL) vy = MAX_FALL;
      x += vx * STEP;
      if (x < 1.15) {
        x = 1.15;
        vx *= -0.3;
      }
      if (x > COLS - 1.15) {
        x = COLS - 1.15;
        vx *= -0.3;
      }
      if (overlapSolid(x - 0.16, y - 0.22, x + 0.16, y - 0.04)) {
        if (vx > 0) x = Math.floor(x + 0.16) - 0.17;
        else x = Math.floor(x - 0.16) + 1.17;
        vx *= -0.25;
      }
      y += vy * STEP;
      if (overlapSolid(x - 0.12, y - 0.04, x + 0.12, y + 0.05)) {
        return clamp(Math.floor(x), 1, COLS - 2);
      }
      if (y > ROWS) return clamp(Math.floor(x), 1, COLS - 2);
    }
    return clamp(Math.floor(x), 1, COLS - 2);
  }

  function columnLoot(c) {
    let cages = 0;
    let eggs = 0;
    let dirt = 0;
    let mons = 0;
    let top = 99;
    for (let r = 1; r < ROWS - 2; r++) {
      const t = tile(c, r);
      if (t === CAGE) {
        cages += 1;
        if (r < top) top = r;
      } else if (t === EGG) {
        eggs += 1;
        if (r < top) top = r;
      } else if (t === DIRT) dirt += 1;
    }
    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (!m.dead && Math.floor(m.x) === c) mons += 1;
    }
    return { c: c, cages: cages, eggs: eggs, dirt: dirt, mons: mons, top: top };
  }

  function bombLiveCount() {
    let n = 0;
    for (let i = 0; i < G.bombs.length; i++) if (!G.bombs[i].dead) n += 1;
    return n;
  }

  function bombAimedAt(col) {
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.dead) continue;
      if (b.fuse >= 0) {
        if (Math.floor(b.x) === col) return true;
      } else if (Math.abs(b.x - (col + 0.5)) < 1.4) {
        return true;
      }
    }
    return false;
  }

  function smokeCol(c) {
    for (let i = 0; i < G.smokes.length; i++) {
      if (G.smokes[i].c === c && G.smokes[i].t > 0.05) return true;
    }
    return false;
  }

  function autoSteer(tx, holdFloor) {
    const p = G.player;
    let dx = tx - p.x;
    const probe = p.x + (dx < 0 ? -0.35 : 0.35);
    const nc = Math.floor(probe);
    if (smokeCol(nc) && !smokeCol(Math.floor(p.x))) dx = -dx;
    if (G.invuln <= 0) {
      for (let i = 0; i < G.mons.length; i++) {
        const m = G.mons[i];
        if (m.dead || m.hatch > 0) continue;
        if (Math.abs(m.y - p.y) > 1.1) continue;
        const md = m.x - p.x;
        if (Math.abs(md) < 1.05 && dx * md > 0) dx = -dx;
      }
    }
    if (holdFloor && p.on) {
      const here = standCell();
      const nextC = dx < 0 ? Math.floor(p.x - 0.3) : Math.floor(p.x + 0.3);
      if (nextC !== here.c && !canStandAt(nextC, here.r)) dx = 0;
    }
    if (dx < -0.08) keys.l = true;
    else if (dx > 0.08) keys.r = true;
  }

  function autoHoleToward(fromC, fromR, upR) {
    let best = -1;
    let bd = 99;
    for (let c = 1; c < COLS - 1; c++) {
      if (solid(c, fromR - 1) && !canStandAt(c, fromR)) continue;
      if (solid(c, upR)) continue;
      if (!canStandAt(c, fromR) && c !== fromC) continue;
      const d = Math.abs(c - fromC);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    return best;
  }

  function autoGo(gc, gr, gx) {
    const p = G.player;
    const here = standCell();
    const step = autoFirstStep(gc, gr);
    const tx = gx != null ? gx : (step ? step.c + 0.5 : gc + 0.5);
    if (!p.on) {
      if (autoHoldJump && p.vy < 0) keys.jumpHold = true;
      const land = step && step.act === 1 ? step : { c: gc, r: gr };
      if (land.r + 0.2 < p.y) {
        const ahead = land.c + 0.5 > p.x ? Math.floor(p.x + 0.42) : Math.floor(p.x - 0.42);
        if (p.y > land.r + 0.12 && solid(ahead, Math.floor(p.y - 0.15))) {
          return 'air';
        }
      }
      autoSteer(step ? step.c + 0.5 : tx);
      return 'air';
    }
    autoHoldJump = false;
    if (step) {
      if (step.act === 1) {
        autoHoldJump = true;
        keys.jumpHold = true;
        jumpBuf = BUFFER;
        tryJump();
      }
      const nx = (here.c === gc && here.r === gr) ? tx : step.c + 0.5;
      autoSteer(nx, step.act === 0);
      return 'path';
    }
    autoSteer(tx);
    if (here.c === gc && Math.abs(here.r - gr) <= 1) return 'here';
    if (gr + 0.2 < here.r) {
      const hole = autoHoleToward(here.c, here.r, gr);
      if (hole >= 0 && hole !== here.c) {
        autoSteer(hole + 0.5);
      } else if (hole === here.c && !solid(here.c, gr)) {
        autoHoldJump = true;
        keys.jumpHold = true;
        jumpBuf = BUFFER;
        tryJump();
      }
    }
    return 'greedy';
  }

  function autoStanceFor(tc) {
    const here = standCell();
    let best = null;
    let bestS = 1e9;
    for (let r = 1; r < ROWS; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (c === tc) continue;
        if (Math.abs(c - tc) > 3) continue;
        if (!canStandAt(c, r)) continue;
        const fc = tc > c ? 1 : -1;
        const px = c + 0.5 + fc * 0.22;
        const hit = simBombCol(px, r, fc, true);
        if (hit !== tc) continue;
        const dist = Math.abs(c - here.c) + Math.abs(r - here.r) * 2.5;
        const score = dist + (r > here.r ? 0.4 : 0);
        if (score < bestS) {
          bestS = score;
          best = { c: c, r: r, face: fc, x: px };
        }
      }
    }
    return best;
  }

  function autoPickBomb() {
    const here = standCell();
    let bestCol = null;
    let bestS = -1e9;
    for (let c = 1; c < COLS - 1; c++) {
      const loot = columnLoot(c);
      if (!loot.cages && !loot.eggs && !loot.mons) continue;
      if (bombAimedAt(c) || smokeCol(c)) continue;
      const score = loot.cages * 12 + loot.eggs * 3 + loot.mons * 2 - Math.abs(c - here.c) * 0.35;
      if (score > bestS) {
        bestS = score;
        bestCol = loot;
      }
    }
    if (!bestCol) return null;
    const st = autoStanceFor(bestCol.c);
    if (!st) return { col: bestCol.c, stance: null };
    return { col: bestCol.c, stance: st };
  }

  function nearestHeart() {
    let best = null;
    let bd = 1e9;
    const p = G.player;
    for (let i = 0; i < G.hearts.length; i++) {
      const h = G.hearts[i];
      const d = hypot2(h.x - p.x, h.y - p.y);
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return best;
  }

  function nearestLetter() {
    let best = null;
    let bd = 1e9;
    const p = G.player;
    for (let i = 0; i < G.letters.length; i++) {
      const L = G.letters[i];
      const d = hypot2(L.x - p.x, L.y - p.y);
      if (d < bd) {
        bd = d;
        best = L;
      }
    }
    return best;
  }

  function autoMonThreat() {
    const p = G.player;
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (m.dead || m.hatch > 0) continue;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      if (Math.abs(dy) > 1.2) continue;
      const d = Math.abs(dx);
      if (d < 2.35 && d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  }

  function blastSoon() {
    const pc = Math.floor(G.player.x);
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.dead) continue;
      if (b.fuse >= 0 && b.fuse < 0.22 && Math.floor(b.x) === pc) return Math.floor(b.x);
    }
    if (smokeCol(pc)) return pc;
    return -1;
  }

  function autoFleeFrom(col) {
    const here = standCell();
    let dir = here.c <= col ? -1 : 1;
    let dest = clamp(here.c + dir * 2, 1, COLS - 2);
    if (solid(dest, here.r - 1) && !canStandAt(dest, here.r)) {
      dir = -dir;
      dest = clamp(here.c + dir * 2, 1, COLS - 2);
    }
    autoGo(dest, here.r, dest + 0.5 + dir * 0.2);
    if (G.player.on && here.r >= 5) {
      autoHoldJump = true;
      keys.jumpHold = true;
      jumpBuf = BUFFER;
      tryJump();
    }
  }

  function autoChasePickup(x, y) {
    const p = G.player;
    const c = clamp(Math.floor(x), 1, COLS - 2);
    const land = fallLand(c, Math.max(1, Math.floor(y)));
    const r = land > 0 ? land : standCell().r;
    const here = standCell();
    if (Math.abs(x - p.x) < 0.85 && Math.abs(y - (p.y - PH * 0.45)) < 1.1) {
      autoSteer(x);
      return;
    }
    autoGo(c, r, x);
    if (here.r === r && Math.abs(here.c - c) <= 1) autoSteer(x);
  }

  function clearAutoKeys() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.jumpHold = false;
  }

  function autoScale() {
    if (!autoOn) return 1;
    if (G.mode === 'title' || G.mode === 'lose') return 1;
    if (G.mode === 'win' && overlayOpen()) return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function playHint() {
    if (autoOn && G.mode === 'play') {
      setHint('自动托管 · 走跳丢弹救人 · A 停下');
      return;
    }
    if (G.mode === 'play') {
      const st = STAGES[G.stage] || STAGES[0];
      setHint(st.hint);
      return;
    }
    if (G.mode === 'title') {
      setHint('走跳 · 空格丢弹炸开一列 · 心弹出再接住 · A 自动 · 字母凑齐 EXTEND');
    }
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    if (speedEl) {
      speedEl.title = SPEED_LABELS[autoSpeed];
      speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
    }
  }

  function setAutoSpeed(n) {
    if (n < 1 || n > 4 || !isFinite(n)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    clearAutoKeys();
    jumpBuf = 0;
    autoHoldJump = false;
    autoFleeT = 0;
    autoWinWait = 0;
    autoStuck = 0;
    ptr.down = false;
    ptr.dragging = false;
    ptr.dir = 0;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startKind(G.kind || 'save', false);
    }
    playHint();
  }

  function isAutoKey(e) {
    return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
  }

  function tickAuto(dt) {
    clearAutoKeys();
    jumpBuf = 0;
    if (!autoOn) return;
    if (overlayOpen()) {
      if (G.mode === 'win' && G.stage < STAGES.length - 1) {
        autoWinWait += dt;
        if (autoWinWait > 0.55) {
          autoWinWait = 0;
          overlayPrimary();
        }
      } else {
        autoWinWait = 0;
      }
      return;
    }
    autoWinWait = 0;
    if (G.mode !== 'play' || G.dead) return;

    if (autoFleeT > 0) autoFleeT -= dt;
    if (autoBombT > 0) autoBombT -= dt;
    if (autoDropLock > 0) autoDropLock -= dt;

    const p = G.player;
    if (!p.on && p.vy > 0.4) autoHoldJump = false;
    if (Math.abs(p.x - autoLastX) < 0.05) autoStuck += dt;
    else autoStuck = 0;
    autoLastX = p.x;
    autoLastY = p.y;

    const boom = blastSoon();
    if (boom >= 0) {
      autoFleeFrom(boom);
      return;
    }
    if (autoFleeT > 0 && autoFleeC >= 0) {
      autoFleeFrom(autoFleeC);
      return;
    }

    const threat = autoMonThreat();
    if (threat && G.invuln <= 0 && Math.abs(threat.x - p.x) < 1.18) {
      const away = threat.x >= p.x ? -1 : 1;
      autoSteer(p.x + away * 1.6);
      if (p.on) {
        autoHoldJump = true;
        keys.jumpHold = true;
        jumpBuf = BUFFER;
        tryJump();
      }
      if (autoBombT <= 0 && bombLiveCount() < BOMB_MAX) {
        const fc = threat.x >= p.x ? 1 : -1;
        const hit = simBombCol(p.x, p.y, fc, p.on);
        if (hit === Math.floor(threat.x) && hit !== Math.floor(p.x)) {
          face = fc;
          dropBomb();
          autoBombT = 0.28;
          autoFleeC = hit;
          autoFleeT = 0.5;
        }
      }
      return;
    }

    const heart = nearestHeart();
    if (heart) {
      const hd = hypot2(heart.x - p.x, heart.y - p.y);
      if (cageCount() === 0 || hd < 20 || G.hearts.length >= Math.max(1, cageCount())) {
        autoChasePickup(heart.x, heart.y);
        return;
      }
    }

    const job = autoPickBomb();
    if (job && job.stance) {
      const st = job.stance;
      const here = standCell();
      if (here.c === st.c && here.r === st.r && p.on && here.c !== job.col) {
        face = st.face;
        const hitNow = simBombCol(p.x, p.y, face, true);
        if (hitNow === job.col && autoBombT <= 0 && autoDropLock <= 0 && bombLiveCount() < BOMB_MAX && !bombAimedAt(job.col)) {
          dropBomb();
          autoBombT = 0.22;
          autoDropLock = 0.18;
          autoFleeC = job.col;
          autoFleeT = 0.52;
          autoFleeFrom(job.col);
        } else {
          autoSteer(st.x, true);
        }
        return;
      }
      autoGo(st.c, st.r, st.x);
      if (here.c === st.c && here.r === st.r) face = st.face;
      if (autoStuck > 1.05) {
        const fc = st.c >= here.c ? 1 : -1;
        if (p.on && autoBombT <= 0 && bombLiveCount() < BOMB_MAX) {
          face = here.c === job.col ? (here.c > 8 ? -1 : 1) : fc;
          const hit = simBombCol(p.x, p.y, face, true);
          const loot = columnLoot(hit);
          if (hit !== here.c && (loot.dirt || loot.cages || loot.eggs)) {
            dropBomb();
            autoBombT = 0.24;
            autoFleeC = hit;
            autoFleeT = 0.5;
            autoStuck = 0;
            return;
          }
        }
        if (p.on && here.r >= 5 && !solid(here.c, here.r - 3)) {
          autoHoldJump = true;
          keys.jumpHold = true;
          jumpBuf = BUFFER;
          tryJump();
        } else {
          autoSteer(p.x + (here.c > 8 ? -1.4 : 1.4));
        }
        autoStuck = 0;
      }
      return;
    }

    if (heart) {
      autoChasePickup(heart.x, heart.y);
      return;
    }

    const letter = nearestLetter();
    if (letter) {
      autoChasePickup(letter.x, letter.y);
      return;
    }

    if (job && !job.stance) {
      const here = standCell();
      const dir = job.col >= here.c ? 1 : -1;
      autoSteer(p.x + dir * 1.2);
      if (p.on && Math.abs(Math.floor(p.x) - job.col) <= 2 && autoBombT <= 0 && bombLiveCount() < BOMB_MAX) {
        face = dir;
        const hit = simBombCol(p.x, p.y, face, true);
        if (hit === job.col || columnLoot(hit).cages || columnLoot(hit).eggs) {
          dropBomb();
          autoBombT = 0.24;
          autoFleeC = hit;
          autoFleeT = 0.5;
        }
      }
      return;
    }

    if (autoStuck > 0.9) {
      autoHoldJump = true;
      keys.jumpHold = true;
      jumpBuf = BUFFER;
      tryJump();
      keys.r = Math.sin(G.clock * 3) > 0;
      keys.l = !keys.r;
      autoStuck = 0;
    }
  }

  function tryJump() {
    if (G.mode !== 'play' || G.dead) return false;
    if (coyote > 0 || G.player.on) {
      G.player.vy = JUMP_V;
      G.player.on = false;
      coyote = 0;
      jumpBuf = 0;
      G.player.squash = 0.85;
      audio.jump();
      emit(6, {
        x: G.player.x, y: G.player.y, j: 0.1,
        vx0: -1.6, vx1: 1.6, vy0: -0.4, vy1: 1.2,
        life: 0.22, r0: 0.03, r1: 0.07, rgb: MINT, g: 6
      });
      hitStop(28);
      return true;
    }
    return false;
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (p.squash > 0) p.squash = Math.max(0, p.squash - dt * 3.6);
    if (G.dead) return;
    const wx = wishX();
    if (wx !== 0) face = wx;
    p.vx = wx * WALK;
    if (p.on) coyote = COYOTE;
    else coyote = Math.max(0, coyote - dt);
    if (jumpBuf > 0) {
      jumpBuf -= dt;
      if (tryJump()) jumpBuf = 0;
    }
    if (!keys.jumpHold && p.vy < 0) p.vy += GRAV * 1.65 * dt;
    if (keys.d && !p.on && p.vy > 0) p.vy += GRAV * 1.15 * dt;
    moveActor(p, dt, PW, PH);
    if (p.on && Math.abs(p.vx) > 0.4) p.squash = Math.max(p.squash, 0.18 + Math.abs(Math.sin(G.clock * 14)) * 0.1);
  }

  function updateBombs(dt) {
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      if (b.dead) {
        G.bombs.splice(i, 1);
        continue;
      }
      if (b.fuse >= 0) {
        b.fuse -= dt;
        if ((b.fuse * 12) % 1 < dt * 12) audio.fuse();
        if (b.fuse <= 0) {
          b.dead = true;
          explode(Math.floor(b.x), b.y);
        }
        continue;
      }
      b.vy += GRAV * dt;
      if (b.vy > MAX_FALL) b.vy = MAX_FALL;
      b.x += b.vx * dt;
      if (b.x < 1.15) {
        b.x = 1.15;
        b.vx *= -0.3;
      }
      if (b.x > COLS - 1.15) {
        b.x = COLS - 1.15;
        b.vx *= -0.3;
      }
      if (overlapSolid(b.x - 0.16, b.y - 0.22, b.x + 0.16, b.y - 0.04)) {
        if (b.vx > 0) b.x = Math.floor(b.x + 0.16) - 0.17;
        else b.x = Math.floor(b.x - 0.16) + 1.17;
        b.vx *= -0.25;
      }
      b.y += b.vy * dt;
      if (overlapSolid(b.x - 0.12, b.y - 0.04, b.x + 0.12, b.y + 0.05)) {
        b.y = Math.floor(b.y + 0.02);
        b.vy = 0;
        b.vx *= 0.2;
        b.fuse = FUSE;
        emit(4, {
          x: b.x, y: b.y, j: 0.06,
          vx0: -0.8, vx1: 0.8, vy0: -1.4, vy1: 0.2,
          life: 0.2, r0: 0.03, r1: 0.06, rgb: GOLD, g: 3
        });
      }
      if (b.y > ROWS) {
        b.dead = true;
      }
    }
  }

  function updateSmokes(dt) {
    for (let i = G.smokes.length - 1; i >= 0; i--) {
      G.smokes[i].t -= dt;
      if (G.smokes[i].t <= 0) G.smokes.splice(i, 1);
    }
  }

  function inSmoke(x, y, h) {
    const c = Math.floor(x);
    for (let i = 0; i < G.smokes.length; i++) {
      const s = G.smokes[i];
      if (s.c !== c) continue;
      if (s.t > SMOKE_T - 0.04) continue;
      if (y - h < ROWS - 1 && y > 1) return true;
    }
    return false;
  }

  function updateHearts(dt) {
    for (let i = G.hearts.length - 1; i >= 0; i--) {
      const h = G.hearts[i];
      h.bob += dt * 5.2;
      h.vy += 6.5 * dt;
      if (h.vy > 3.2) h.vy = 3.2;
      h.vx += (G.player.x - h.x) * 0.35 * dt;
      h.vx *= 0.985;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      if (h.x < 1.3) {
        h.x = 1.3;
        h.vx *= -0.6;
      }
      if (h.x > COLS - 1.3) {
        h.x = COLS - 1.3;
        h.vx *= -0.6;
      }
      if (overlapSolid(h.x - 0.16, h.y + 0.12, h.x + 0.16, h.y + 0.22)) {
        h.y = Math.floor(h.y + 0.22) - 0.22;
        h.vy = -2.4;
      }
      if (overlapSolid(h.x - 0.16, h.y - 0.22, h.x + 0.16, h.y - 0.1)) {
        h.vy = Math.abs(h.vy) * 0.5;
        h.y += 0.05;
      }
      const dx = G.player.x - h.x;
      const dy = (G.player.y - PH * 0.45) - h.y;
      if (!G.dead && dx * dx + dy * dy < 0.38) collectHeart(h, i);
    }
  }

  function updateLetters(dt) {
    for (let i = G.letters.length - 1; i >= 0; i--) {
      const L = G.letters[i];
      L.bob += dt * 4;
      L.vy += 4.2 * dt;
      if (L.vy > 2.2) L.vy = 2.2;
      L.x += L.vx * dt;
      L.y += L.vy * dt;
      if (L.x < 1.3) {
        L.x = 1.3;
        L.vx *= -1;
      }
      if (L.x > COLS - 1.3) {
        L.x = COLS - 1.3;
        L.vx *= -1;
      }
      if (overlapSolid(L.x - 0.14, L.y + 0.12, L.x + 0.14, L.y + 0.2)) {
        L.y = Math.floor(L.y + 0.2) - 0.2;
        L.vy = -1.6;
      }
      const dx = G.player.x - L.x;
      const dy = (G.player.y - PH * 0.45) - L.y;
      if (!G.dead && dx * dx + dy * dy < 0.42) collectLetter(L, i);
    }
  }

  function monSpeed() {
    let s = 1.55 + G.stage * 0.16;
    if (G.kind === 'chase') s *= 1.42;
    return s;
  }

  function updateMons(dt) {
    const spd = monSpeed();
    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (m.dead) continue;
      if (m.squash > 0) m.squash = Math.max(0, m.squash - dt * 3);
      if (m.hatch > 0) {
        m.hatch -= dt;
        continue;
      }
      m.wob += dt * 9;
      if (m.on) {
        const ahead = m.x + m.face * 0.38;
        const wall = overlapSolid(ahead - 0.1, m.y - 0.55, ahead + 0.1, m.y - 0.18);
        const ground = overlapSolid(ahead - 0.08, m.y, ahead + 0.08, m.y + 0.12);
        if (wall || !ground) {
          const drop = G.kind === 'chase' ? 0.34 : 0.18;
          if (!ground && Math.random() < drop * dt * 8) {
            /* walk off */
          } else m.face *= -1;
        }
        if (Math.abs(m.y - G.player.y) < 1.1 && Math.abs(m.x - G.player.x) < 5) {
          m.face = G.player.x > m.x ? 1 : -1;
        }
        m.vx = m.face * spd;
      } else {
        m.vx *= 0.96;
      }
      moveActor(m, dt, 0.5, 0.72);
    }
    let w = 0;
    for (let i = 0; i < G.mons.length; i++) {
      if (!G.mons[i].dead) G.mons[w++] = G.mons[i];
    }
    G.mons.length = w;
  }

  function updateHatch(dt) {
    if (G.mode !== 'play') return;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        const i = idx(c, r);
        if (G.grid[i] !== EGG) continue;
        G.hatch[i] -= dt;
        if (G.hatch[i] <= 0) hatchAt(c, r);
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= dt * 0.7;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
  }

  function update(dt) {
    G.clock += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 1;
        if (comboEl) comboEl.textContent = '×1';
        if (comboBox) comboBox.classList.remove('hot');
      }
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 26);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.bombCd > 0) G.bombCd = Math.max(0, G.bombCd - dt);
    if (G.stop > 0) {
      G.stop -= dt;
      updateParticles(dt);
      if (autoOn && overlayOpen() && G.mode === 'win') tickAuto(dt);
      return;
    }

    if (G.mode === 'title') {
      updateParticles(dt);
      return;
    }

    if (G.mode === 'win') {
      if (autoOn && overlayOpen()) tickAuto(dt);
      if (G.clearT > 0) {
        G.clearT -= dt;
        updateHearts(dt);
        updateLetters(dt);
        updateBombs(dt);
        updateSmokes(dt);
        updateParticles(dt);
        if (G.clearT <= 0) finishClear();
      } else {
        updateParticles(dt);
      }
      return;
    }

    if (G.mode === 'lose') {
      updateParticles(dt);
      if (G.deadT > 0) {
        G.deadT -= dt;
        if (G.deadT <= 0) finishDead();
      }
      return;
    }

    if (G.mode !== 'play') {
      updateParticles(dt);
      return;
    }

    G.stageT += dt;
    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);
    if (autoOn) tickAuto(dt);

    if (G.dead) {
      G.deadT -= dt;
      updateBombs(dt);
      updateSmokes(dt);
      updateHearts(dt);
      updateLetters(dt);
      updateMons(dt);
      updateParticles(dt);
      if (G.deadT <= 0) finishDead();
      return;
    }

    updatePlayer(dt);
    updateBombs(dt);
    updateSmokes(dt);
    updateHatch(dt);
    updateMons(dt);
    updateHearts(dt);
    updateLetters(dt);

    if (G.invuln <= 0 && inSmoke(G.player.x, G.player.y, PH)) {
      hurtPlayer('blast');
    }
    if (!G.dead && G.invuln <= 0) {
      for (let i = 0; i < G.mons.length; i++) {
        const m = G.mons[i];
        if (m.dead || m.hatch > 0) continue;
        const dx = m.x - G.player.x;
        const dy = (m.y - 0.36) - (G.player.y - PH * 0.5);
        if (dx * dx + dy * dy < 0.34) {
          hurtPlayer('touch');
          break;
        }
      }
    }

    maybeClear();
    updateParticles(dt);
    syncHud();
  }

  function rr(x, y, w, h, rad) {
    const r = Math.min(rad, w * 0.5, h * 0.5);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
    }
  }

  function drawFloor() {
    ctx.fillStyle = '#07060f';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.5, H * 0.42, 16, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(30, 230, 168, 0.07)');
    g.addColorStop(1, 'rgba(5, 3, 12, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTile(c, r) {
    const t = tile(c, r);
    const x = ox + c * cell;
    const y = oy + r * cell;
    if (t === EMPTY) {
      ctx.fillStyle = (c + r) % 2 === 0 ? 'rgba(30, 230, 168, 0.03)' : 'rgba(8, 16, 22, 0.45)';
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      return;
    }
    if (t === WALL) {
      rr(x + 1, y + 1, cell - 2, cell - 2, 4);
      ctx.fillStyle = r === 0 || r === ROWS - 1 ? '#14101c' : '#181422';
      ctx.fill();
      ctx.strokeStyle = 'rgba(30, 230, 168, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }
    if (t === DIRT) {
      rr(x + 1, y + 1, cell - 2, cell - 2, 3);
      ctx.fillStyle = (c + r) % 2 === 0 ? '#8a5428' : '#7a4620';
      ctx.fill();
      ctx.fillStyle = 'rgba(30, 230, 168, 0.22)';
      ctx.fillRect(x + 2, y + 1, cell - 4, Math.max(2, cell * 0.16));
      ctx.fillStyle = 'rgba(40, 22, 10, 0.35)';
      ctx.fillRect(x + 3, y + cell * 0.55, cell * 0.18, cell * 0.12);
      ctx.fillRect(x + cell * 0.55, y + cell * 0.7, cell * 0.22, cell * 0.1);
      ctx.strokeStyle = 'rgba(255, 210, 160, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }
    if (t === CAGE) {
      rr(x + 2, y + 2, cell - 4, cell - 4, 3);
      ctx.fillStyle = '#120818';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.85)';
      ctx.lineWidth = Math.max(1.2, cell * 0.06);
      ctx.stroke();
      ctx.beginPath();
      const gap = cell * 0.22;
      for (let k = 1; k <= 3; k++) {
        const bx = x + gap * k;
        ctx.moveTo(bx, y + 4);
        ctx.lineTo(bx, y + cell - 4);
      }
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
      ctx.lineWidth = Math.max(1, cell * 0.045);
      ctx.stroke();
      const pulse = 0.75 + Math.sin(G.clock * 6 + c) * 0.2;
      drawHeartShape(x + cell * 0.5, y + cell * 0.52, cell * 0.16, rgba(MAG, pulse));
      return;
    }
    if (t === EGG) {
      const ht = G.hatch[idx(c, r)];
      const urg = ht < 3;
      ctx.save();
      ctx.translate(x + cell * 0.5, y + cell * 0.58);
      ctx.beginPath();
      ctx.ellipse(0, 0, cell * 0.2, cell * 0.26, 0, 0, TAU);
      ctx.fillStyle = urg ? '#f0b8ff' : '#d8ecff';
      ctx.fill();
      ctx.strokeStyle = urg ? 'rgba(255, 61, 184, 0.8)' : 'rgba(180, 210, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-cell * 0.06, -cell * 0.08, cell * 0.06, cell * 0.08, -0.4, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fill();
      if (urg) {
        ctx.strokeStyle = 'rgba(80, 20, 40, 0.55)';
        ctx.beginPath();
        ctx.moveTo(-cell * 0.04, -cell * 0.1);
        ctx.lineTo(cell * 0.02, 0);
        ctx.lineTo(-cell * 0.02, cell * 0.08);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawHeartShape(x, y, s, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.7);
    ctx.bezierCurveTo(x - s * 1.2, y + s * 0.05, x - s * 0.7, y - s * 0.85, x, y - s * 0.2);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 0.85, x + s * 1.2, y + s * 0.05, x, y + s * 0.7);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawSmokes() {
    for (let i = 0; i < G.smokes.length; i++) {
      const s = G.smokes[i];
      const a = clamp(s.t / SMOKE_T, 0, 1);
      const x = ox + s.c * cell;
      for (let r = 1; r < ROWS - 1; r++) {
        const y = oy + r * cell;
        const flicker = 0.55 + Math.sin(G.clock * 28 + r * 0.7) * 0.2;
        ctx.fillStyle = rgba(MINT, 0.16 * a * flicker);
        ctx.fillRect(x + cell * 0.12, y, cell * 0.76, cell);
        if (r % 2 === 0) {
          ctx.fillStyle = rgba(WHT, 0.1 * a);
          ctx.fillRect(x + cell * 0.28, y + cell * 0.2, cell * 0.44, cell * 0.5);
        }
      }
    }
  }

  function drawBomb(b) {
    const x = ox + b.x * cell;
    const y = oy + b.y * cell;
    ctx.save();
    ctx.translate(x, y - cell * 0.12);
    const spark = b.fuse >= 0 ? 1.1 + Math.sin(G.clock * 40) * 0.15 : 1;
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.16 * spark, 0, TAU);
    ctx.fillStyle = '#1a1018';
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, 0.9);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-cell * 0.04, -cell * 0.04, cell * 0.05, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -cell * 0.16);
    ctx.lineTo(cell * 0.06, -cell * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cell * 0.07, -cell * 0.3, cell * 0.045, 0, TAU);
    ctx.fillStyle = b.fuse >= 0 ? rgba(GOLD, 0.95) : rgba(MAG, 0.8);
    ctx.fill();
    ctx.restore();
  }

  function drawPenguin(px, py, fc, squash, blink) {
    const s = cell;
    const x = ox + px * s;
    const y = oy + py * s;
    const bob = G.player.on
      ? Math.sin(G.clock * (Math.abs(G.player.vx) > 0.4 ? 16 : 3)) * s * 0.03
      : 0;
    const sx = 1 + squash * 0.22;
    const sy = 1 - squash * 0.16;
    ctx.save();
    ctx.translate(x, y - s * 0.08 + bob);
    ctx.scale(fc < 0 ? -sx : sx, sy);
    if (blink) ctx.globalAlpha = 0.45 + Math.sin(G.clock * 28) * 0.25;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.28, s * 0.27, s * 0.3, 0, 0, TAU);
    ctx.fillStyle = '#d4ffe8';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.15, s * 0.16, 0, 0, TAU);
    ctx.fillStyle = '#1ee6a8';
    ctx.fill();
    ctx.fillStyle = '#ffb020';
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, s * 0.02, s * 0.07, s * 0.045, -0.2, 0, TAU);
    ctx.ellipse(s * 0.1, s * 0.02, s * 0.07, s * 0.045, 0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-s * 0.08, -s * 0.4, s * 0.045, 0, TAU);
    ctx.arc(s * 0.08, -s * 0.4, s * 0.045, 0, TAU);
    ctx.fillStyle = '#071018';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.02, -s * 0.3);
    ctx.lineTo(s * 0.2, -s * 0.26);
    ctx.lineTo(s * 0.02, -s * 0.22);
    ctx.closePath();
    ctx.fillStyle = '#ffb020';
    ctx.fill();
    ctx.restore();
  }

  function drawMon(m) {
    const s = cell;
    const x = ox + m.x * s;
    const y = oy + m.y * s;
    const bob = Math.sin(m.wob) * s * 0.05;
    ctx.save();
    ctx.translate(x, y - s * 0.1 + bob);
    if (m.hatch > 0) ctx.scale(1.2 - m.hatch, 1.2 - m.hatch);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.24, s * 0.22, 0, 0, TAU);
    ctx.fillStyle = '#c46cff';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.26, s * 0.12, s * 0.12, 0, 0, TAU);
    ctx.fillStyle = '#ffe9ff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(m.face * s * 0.03, -s * 0.26, s * 0.05, 0, TAU);
    ctx.fillStyle = '#1a0820';
    ctx.fill();
    ctx.strokeStyle = '#e8b8ff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, -s * 0.44);
    ctx.quadraticCurveTo(-s * 0.02, -s * 0.58, s * 0.08, -s * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawPickupHeart(h) {
    const s = cell;
    const x = ox + h.x * s;
    const y = oy + h.y * s + Math.sin(h.bob) * s * 0.06;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 61, 184, 0.7)';
    ctx.shadowBlur = 10;
    drawHeartShape(x, y, s * 0.18, '#ff5aa8');
    ctx.shadowBlur = 0;
    drawHeartShape(x, y - s * 0.02, s * 0.1, '#ffd0ec');
    ctx.restore();
  }

  function drawLetter(L) {
    const s = cell;
    const x = ox + L.x * s;
    const y = oy + L.y * s + Math.sin(L.bob) * s * 0.05;
    ctx.save();
    ctx.font = '800 ' + Math.floor(s * 0.42) + 'px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.shadowColor = 'rgba(255, 227, 107, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText(LETTERS.charAt(L.i), x, y);
    ctx.restore();
  }

  function drawPops() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = '800 ' + Math.floor(cell * 0.32) + 'px "Segoe UI", sans-serif';
      ctx.fillStyle = rgba(p.rgb, 1);
      ctx.fillText(p.text, ox + p.x * cell, oy + p.y * cell);
    }
    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.beginPath();
      ctx.arc(ox + p.x * cell, oy + p.y * cell, Math.max(0.6, p.r * cell), 0, TAU);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fill();
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFloor();
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) drawTile(c, r);
    }
    drawSmokes();
    for (let i = 0; i < G.hearts.length; i++) drawPickupHeart(G.hearts[i]);
    for (let i = 0; i < G.letters.length; i++) drawLetter(G.letters[i]);
    for (let i = 0; i < G.mons.length; i++) if (!G.mons[i].dead) drawMon(G.mons[i]);
    for (let i = 0; i < G.bombs.length; i++) if (!G.bombs[i].dead) drawBomb(G.bombs[i]);
    const blink = G.invuln > 0 && ((G.invuln * 16) | 0) % 2 === 0;
    if (!G.dead || G.deadT > 0.15) {
      drawPenguin(G.player.x, G.player.y, face, G.player.squash, blink);
    }
    drawParticles();
    drawPops();
    ctx.restore();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    cell = Math.floor(Math.min(W / COLS, H / ROWS));
    if (cell < 8) cell = 8;
    ox = Math.floor((W - cell * COLS) * 0.5);
    oy = Math.floor((H - cell * ROWS) * 0.5);
  }

  function bindHold(btn, on, off) {
    if (!btn) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      btn.classList.add('held');
      on();
    };
    const up = function (e) {
      if (e) e.preventDefault();
      btn.classList.remove('held');
      off();
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  }

  bindHold(padBtns.left, function () {
    if (autoOn) return;
    keys.l = true;
    face = -1;
  }, function () { keys.l = false; });
  bindHold(padBtns.right, function () {
    if (autoOn) return;
    keys.r = true;
    face = 1;
  }, function () { keys.r = false; });
  bindHold(padBtns.jump, function () {
    if (autoOn) return;
    keys.u = true;
    keys.jumpHold = true;
    jumpBuf = BUFFER;
    tryJump();
  }, function () {
    keys.u = false;
    keys.jumpHold = false;
  });
  bindHold(padBtns.bomb, function () {
    if (autoOn) return;
    if (!overlayOpen()) dropBomb();
  }, function () {});

  function onDir(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'ArrowLeft') {
      e.preventDefault();
      keys.l = down;
      if (down) face = -1;
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD') {
      e.preventDefault();
      keys.r = down;
      if (down) face = 1;
    } else if (k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS') {
      e.preventDefault();
      keys.d = down;
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW') {
      e.preventDefault();
      keys.u = down;
      keys.jumpHold = down;
      if (down) {
        jumpBuf = BUFFER;
        if (!overlayOpen()) tryJump();
      }
    }
  }

  window.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (isAutoKey(e)) {
      e.preventDefault();
      if (!e.repeat) toggleAuto();
      return;
    }
    if (speedEl && e.target === speedEl) return;
    audio.ensure();
    const k = e.key;
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      if (!e.repeat) retry();
      return;
    }
    if (k === 'm' || k === 'M') {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      return;
    }
    if (overlayOpen()) {
      if (k === ' ' || k === 'Enter') {
        e.preventDefault();
        if (!e.repeat) overlayPrimary();
      }
      if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
      }
      return;
    }
    if (autoOn) {
      if (
        k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' ||
        k === ' ' || k === 'w' || k === 'W' || k === 's' || k === 'S' || k === 'd' || k === 'D'
      ) {
        e.preventDefault();
      }
      return;
    }
    if (k === ' ') {
      e.preventDefault();
      if (!e.repeat) dropBomb();
      return;
    }
    onDir(e, true);
  });

  window.addEventListener('keyup', function (e) {
    if (isAutoKey(e)) {
      e.preventDefault();
      return;
    }
    if (autoOn) return;
    onDir(e, false);
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (overlayOpen() || autoOn) return;
    audio.ensure();
    canvas.focus();
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.sx = e.clientX;
    ptr.sy = e.clientY;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.dragging = false;
    ptr.dir = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    if (autoOn) return;
    if (!ptr.down || e.pointerId !== ptr.id) return;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    const dx = ptr.x - ptr.sx;
    const dy = ptr.y - ptr.sy;
    if (!ptr.dragging && dx * dx + dy * dy > SWIPE * SWIPE) ptr.dragging = true;
    if (ptr.dragging) {
      if (Math.abs(dx) > Math.abs(dy)) {
        ptr.dir = dx > 0 ? 1 : -1;
        face = ptr.dir;
        keys.jumpHold = false;
      } else if (dy < 0) {
        ptr.dir = 0;
        jumpBuf = BUFFER;
        keys.jumpHold = true;
        tryJump();
      } else {
        keys.d = true;
      }
    }
    e.preventDefault();
  });

  function ptrUp(e) {
    if (!ptr.down || (e && e.pointerId !== ptr.id && e.type !== 'blur')) return;
    if (ptr.down && !ptr.dragging) dropBomb();
    ptr.down = false;
    ptr.dragging = false;
    ptr.dir = 0;
    keys.d = false;
    keys.jumpHold = false;
  }

  canvas.addEventListener('pointerup', function (e) {
    e.preventDefault();
    ptrUp(e);
  });
  canvas.addEventListener('pointercancel', ptrUp);
  canvas.addEventListener('pointerleave', function (e) {
    if (ptr.down) ptrUp(e);
  });

  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnRetry) {
    btnRetry.addEventListener('click', function () {
      audio.ensure();
      retry();
    });
  }
  if (btnAuto) {
    btnAuto.addEventListener('click', function () {
      toggleAuto();
    });
  }
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10));
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10));
    });
  }
  if (btnSave) {
    btnSave.addEventListener('click', function () {
      audio.ensure();
      startKind('save', false);
    });
  }
  if (btnChase) {
    btnChase.addEventListener('click', function () {
      audio.ensure();
      startKind('chase', false);
    });
  }
  if (modeSave) {
    modeSave.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'title') {
        G.kind = 'save';
        syncModes();
        return;
      }
      startKind('save', true);
    });
  }
  if (modeChase) {
    modeChase.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'title') {
        G.kind = 'chase';
        syncModes();
        return;
      }
      startKind('chase', true);
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      nextOrRestart();
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      bootTitle();
    });
  }

  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    keys.jumpHold = false;
    ptr.down = false;
    ptr.dragging = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
      keys.jumpHold = false;
    }
  });
  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  loadBest();
  autoSpeed = loadAutoSpeed();
  syncAutoUi();
  syncSpeedUi();
  bootTitle();
  resize();

  let acc = 0;
  let last = performance.now() / 1000;
  function frame(nowMs) {
    requestAnimationFrame(frame);
    const now = nowMs / 1000;
    if (hidden) {
      last = now;
      return;
    }
    let dt = now - last;
    last = now;
    if (dt > 0.08) dt = 0.08;
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let steps = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && steps < maxSteps) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 4) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
