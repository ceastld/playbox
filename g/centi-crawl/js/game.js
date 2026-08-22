'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const COLS = 20;
  const ROWS = 30;
  const CELL = 24;
  const LIVES = 3;
  const PLAYER_ROW = 24;
  const ZONE_TOP = PLAYER_ROW * CELL;
  const SHOT_V = 780;
  const SHIP_R = 11;
  const COMBO_WIN = 1.28;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-centi-crawl-best';
  const MUTE_KEY = 'playbox-centi-crawl-mute';
  const AUTO_SPEED_KEY = 'playbox-centi-crawl-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_MAX_V = [0, 170, 260, 400, 720];
  const AUTO_ALIGN = [0, 10, 7, 5, 3];
  const OPS = '方向键 / 指针移动 · 空格或点按开火 · A 自动 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const MINT = [61, 255, 138];
  const LEAF = [20, 224, 112];
  const HOT = [122, 255, 176];
  const POI = [209, 76, 255];
  const CAP = [255, 72, 168];
  const WHT = [246, 243, 255];
  const FLEA_C = [255, 186, 74];
  const SCORP_C = [255, 132, 64];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnForest = document.getElementById('btn-forest');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: ZONE_TOP + 72, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const spores = [];

  const grid = [];
  const G = {
    mode: 'title',
    kind: 'classic',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    worms: [],
    shots: [],
    spider: null,
    flea: null,
    scorp: null,
    ship: { x: VW * 0.5, y: VH - 28, vx: 0, vy: 0 },
    stepAcc: 0,
    stepIntv: 0.12,
    frac: 0,
    fireHold: false,
    fireCd: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MINT,
    punch: 1,
    toastT: 0,
    why: '',
    clearing: false,
    repairQ: [],
    repairT: 0,
    spiderWait: 4,
    fleaWait: 2.2,
    scorpWait: 14,
    muzzle: 0
  };

  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoTargetX = VW * 0.5;
  let autoTargetY = VH - 36;
  let autoFire = false;
  let inputSrc = 'key';

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function cellCx(c) {
    return (c + 0.5) * CELL;
  }
  function cellCy(r) {
    return (r + 0.5) * CELL;
  }
  function colOf(x) {
    return clamp((x / CELL) | 0, 0, COLS - 1);
  }
  function rowOf(y) {
    return clamp((y / CELL) | 0, 0, ROWS - 1);
  }
  function isForest() {
    return G.kind === 'forest';
  }
  function mushAt(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
    return grid[r][c];
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
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
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
      o.type = type || 'square';
      o.frequency.setValueAtTime(Math.max(40, freq), t);
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
      f.frequency.value = hp || 900;
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
    shoot() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.032, 1640);
    },
    chip() {
      this.ensure();
      this.noise(0.03, 0.03, 1400);
      this.beep(420, 0.04, 'triangle', 0.028, 180);
    },
    popMush() {
      this.ensure();
      this.noise(0.05, 0.04, 700);
      this.beep(260, 0.07, 'square', 0.04, 90);
    },
    body(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.04, 0.042, 900);
      this.beep(520 * lift, 0.07, 'square', 0.05, 820 * lift);
    },
    head(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.45, combo * 0.03);
      this.noise(0.055, 0.05, 600);
      this.beep(660 * lift, 0.08, 'square', 0.055, 1180 * lift);
      this.beep(990, 0.12, 'triangle', 0.04, 1480);
    },
    split() {
      this.ensure();
      this.beep(392, 0.06, 'sawtooth', 0.04, 784);
      this.beep(784, 0.1, 'triangle', 0.035, 1175);
    },
    spider() {
      this.ensure();
      this.beep(196, 0.08, 'sawtooth', 0.045, 620);
      this.beep(784, 0.12, 'square', 0.04, 1560);
      this.noise(0.07, 0.04, 500);
    },
    flea() {
      this.ensure();
      this.beep(980, 0.07, 'square', 0.04, 420);
      this.beep(620, 0.1, 'triangle', 0.035, 180);
    },
    scorp() {
      this.ensure();
      this.beep(110, 0.16, 'sawtooth', 0.05, 330);
      this.beep(880, 0.18, 'triangle', 0.045, 1760);
      this.noise(0.1, 0.045, 400);
    },
    poison() {
      this.ensure();
      this.beep(880, 0.05, 'sine', 0.03, 220);
    },
    dive() {
      this.ensure();
      this.beep(740, 0.14, 'sawtooth', 0.04, 140);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 350);
      this.beep(280, 0.18, 'sawtooth', 0.05, 70);
      this.beep(160, 0.28, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.045, 1046);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.2, 'sawtooth', 0.04, 80);
      this.beep(130, 0.32, 'sine', 0.05, 44);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.04, 784);
      this.beep(784, 0.13, 'triangle', 0.035, 1175);
    },
    tick() {
      this.ensure();
      this.beep(720, 0.04, 'sine', 0.022, 1080);
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

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if ((G.mode !== 'play' && G.mode !== 'title') || n <= 0) return;
    if (G.mode === 'title') return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (!scoreBox || !scoreAdd) return;
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

  function toast(msg, warn, gold) {
    G.toastT = 1.35;
    toastTok += 1;
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
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev && G.mode === 'play') {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      if (G.mult >= 3) toast('连击 ×' + G.mult, false, true);
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '蜈袭';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = isForest() ? 'FOREST' : 'CLASSIC';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? (G.combo + ' 连 ×' + G.mult) : (G.combo + ' 连');
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被咬或三命用尽', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 底栏别被贴上', 'warn');
    else setHint('方向键移动 · 空格开火 · A 自动 · R 重开', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showForest) {
    autoOvWait = 0;
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'CENTI';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnClassic.textContent = primary;
    btnForest.classList.toggle('hidden', !showForest);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
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
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 520 : spec.g
      });
    }
    capArr(particles, 320);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 40);
    capArr(rings, 24);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.62,
      size: gold ? 20 : 14, gold: !!gold, vy: gold ? -90 : -68
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(7 + (p * 11) | 0, {
      x: x, y: y, j: 5 + p * 5,
      vx0: -190 * p, vx1: 190 * p, vy0: -240 * p, vy1: 80 * p,
      life: 0.26 + p * 0.14, r0: 1, r1: 2.5 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 9 + p * 10);
    if (G.mode === 'play') {
      screenFlash(rgb, 0.18 + p * 0.16);
      kick(2.2 + p * 2.6);
    }
  }

  function seedSpores() {
    spores.length = 0;
    for (let i = 0; i < 38; i++) {
      spores.push({
        x: rand(6, VW - 6),
        y: rand(8, VH - 10),
        r: rand(0.5, 1.5),
        a: rand(0.08, 0.32),
        p: rand(0, TAU),
        v: rand(4, 14),
        rgb: i % 4 === 0 ? MAG : i % 3 === 0 ? CYN : MINT
      });
    }
  }

  function clearGrid() {
    grid.length = 0;
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push(null);
      grid.push(row);
    }
  }

  function placeMush(c, r, hp, poison) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
    if (grid[r][c]) return null;
    const m = {
      c: c,
      r: r,
      hp: hp == null ? 4 : hp,
      poison: !!poison,
      pop: 0.18,
      hurt: 0
    };
    grid[r][c] = m;
    return m;
  }

  function removeMush(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
    grid[r][c] = null;
  }

  function eachMush(fn) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const m = grid[r][c];
        if (m) fn(m);
      }
    }
  }

  function mushCount() {
    let n = 0;
    eachMush(function () { n += 1; });
    return n;
  }

  function zoneMushCount() {
    let n = 0;
    for (let r = PLAYER_ROW; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) if (grid[r][c]) n += 1;
    }
    return n;
  }

  function spawnMushrooms() {
    clearGrid();
    const forest = isForest();
    const n = forest ? 54 : 22;
    let tries = 0;
    let placed = 0;
    while (placed < n && tries < 900) {
      tries += 1;
      const c = (Math.random() * COLS) | 0;
      const rMax = forest ? 27 : 22;
      const r = 1 + ((Math.random() * rMax) | 0);
      if (r >= PLAYER_ROW) {
        if (c >= 8 && c <= 11) continue;
        if (!forest && Math.random() < 0.55) continue;
      }
      if (r === 0) continue;
      let rowN = 0;
      for (let x = 0; x < COLS; x++) if (grid[r][x]) rowN += 1;
      if (rowN >= (forest ? 9 : 5)) continue;
      if (placeMush(c, r, 4, false)) placed += 1;
    }
  }

  function shipMinX() { return SHIP_R + 2; }
  function shipMaxX() { return VW - SHIP_R - 2; }
  function shipMinY() { return ZONE_TOP + SHIP_R + 2; }
  function shipMaxY() { return VH - SHIP_R - 4; }

  function blockedPixel(x, y) {
    const c = colOf(x);
    const r = rowOf(y);
    return !!mushAt(c, r);
  }

  function tryMoveShip(nx, ny) {
    nx = clamp(nx, shipMinX(), shipMaxX());
    ny = clamp(ny, shipMinY(), shipMaxY());
    if (!blockedPixel(nx, ny)) {
      G.ship.x = nx;
      G.ship.y = ny;
      return;
    }
    if (!blockedPixel(nx, G.ship.y)) {
      G.ship.x = nx;
      return;
    }
    if (!blockedPixel(G.ship.x, ny)) {
      G.ship.y = ny;
    }
  }

  function segDraw(s) {
    const t = G.frac;
    return {
      x: cellCx(s.pc) + (cellCx(s.c) - cellCx(s.pc)) * t,
      y: cellCy(s.pr) + (cellCy(s.r) - cellCy(s.pr)) * t
    };
  }

  function makeSeg(c, r, head) {
    return { c: c, r: r, pc: c, pr: r, head: !!head, flash: 0 };
  }

  function spawnWorm(len, fromLeft, delay) {
    const segs = [];
    const dir = fromLeft ? 1 : -1;
    const n = Math.max(1, len);
    for (let i = 0; i < n; i++) {
      const c = fromLeft
        ? clamp(n - 1 - i, 0, COLS - 1)
        : clamp(COLS - n + i, 0, COLS - 1);
      segs.push(makeSeg(c, 0, i === 0));
    }
    G.worms.push({
      segs: segs,
      dir: dir,
      vdir: 1,
      diving: false,
      inZone: false,
      delay: delay || 0,
      trail: 0
    });
  }

  function stepInterval() {
    const n = Math.max(1, segmentCount());
    const waveF = 1 + (G.wave - 1) * 0.11;
    const forestF = isForest() ? 1.06 : 1;
    const thin = 1 + Math.max(0, 10 - n) * 0.035;
    return clamp(0.128 / waveF / forestF / thin, 0.044, 0.155);
  }

  function segmentCount() {
    let n = 0;
    for (let i = 0; i < G.worms.length; i++) {
      if (G.worms[i].delay > 0) n += G.worms[i].segs.length;
      else n += G.worms[i].segs.length;
    }
    return n;
  }

  function spawnWave() {
    G.worms = [];
    const bodyLen = Math.max(4, 12 - (G.wave - 1));
    const extra = Math.min(G.wave - 1, 7);
    const fromLeft = G.wave % 2 === 1;
    spawnWorm(bodyLen, fromLeft, 0);
    for (let i = 0; i < extra; i++) {
      spawnWorm(1, i % 2 === 0 ? !fromLeft : fromLeft, 0.38 * (i + 1));
    }
    G.stepAcc = 0;
    G.stepIntv = stepInterval();
    G.frac = 0;
    G.ready = G.mode === 'play' ? 0.42 : 0.12;
    G.clearing = false;
    G.repairQ = [];
  }

  function headNext(w) {
    const h = w.segs[0];
    let nc = h.c;
    let nr = h.r;
    if (w.diving) {
      nr = h.r + 1;
      if (nr >= PLAYER_ROW) {
        w.diving = false;
        w.inZone = true;
      }
      if (nr >= ROWS) {
        nr = ROWS - 1;
        w.diving = false;
        w.vdir = -1;
        w.inZone = true;
      }
      w.inZone = w.inZone || nr >= PLAYER_ROW;
      return { c: h.c, r: nr };
    }
    nc = h.c + w.dir;
    nr = h.r;
    const sideM = (nc < 0 || nc >= COLS) ? null : mushAt(nc, nr);
    const blocked = nc < 0 || nc >= COLS || !!sideM;
    if (blocked && sideM && sideM.poison) {
      w.diving = true;
      w.trail = 0.8;
      nr = h.r + 1;
      if (nr >= ROWS) nr = ROWS - 1;
      if (G.mode === 'play') {
        audio.dive();
        toast('毒降！', true, false);
      }
      return { c: h.c, r: nr };
    }
    if (blocked) {
      w.dir *= -1;
      let v = w.vdir || 1;
      if (w.inZone) {
        if (h.r + v >= ROWS) v = -1;
        if (h.r + v < PLAYER_ROW) v = 1;
      } else if (h.r + v >= ROWS) {
        v = -1;
      }
      w.vdir = v;
      nr = h.r + v;
      nr = clamp(nr, w.inZone ? PLAYER_ROW : 0, ROWS - 1);
      const dropM = mushAt(h.c, nr);
      if (dropM && dropM.poison) {
        w.diving = true;
        w.trail = 0.8;
        nr = clamp(h.r + 1, 0, ROWS - 1);
      } else if (dropM) {
        const alt = clamp(h.r - v, w.inZone ? PLAYER_ROW : 0, ROWS - 1);
        if (!mushAt(h.c, alt) && alt !== h.r) nr = alt;
      }
      w.inZone = w.inZone || nr >= PLAYER_ROW;
      return { c: h.c, r: nr };
    }
    w.inZone = w.inZone || nr >= PLAYER_ROW;
    return { c: nc, r: nr };
  }

  function stepWorm(w) {
    if (w.delay > 0) return;
    const segs = w.segs;
    if (!segs.length) return;
    for (let i = segs.length - 1; i >= 1; i--) {
      segs[i].pc = segs[i].c;
      segs[i].pr = segs[i].r;
      segs[i].c = segs[i - 1].c;
      segs[i].r = segs[i - 1].r;
      segs[i].head = false;
    }
    const h = segs[0];
    h.pc = h.c;
    h.pr = h.r;
    const n = headNext(w);
    h.c = n.c;
    h.r = n.r;
    h.head = true;
  }

  function pruneWorms() {
    for (let i = G.worms.length - 1; i >= 0; i--) {
      if (!G.worms[i].segs.length) G.worms.splice(i, 1);
    }
  }

  function hitSegment(wi, si) {
    const w = G.worms[wi];
    const seg = w.segs[si];
    const p = segDraw(seg);
    const wasHead = si === 0;
    let c = colOf(p.x);
    let r = rowOf(p.y);
    const tail = w.segs.splice(si);
    tail.shift();
    if (!w.segs.length) G.worms.splice(wi, 1);
    if (tail.length) {
      tail[0].head = true;
      G.worms.push({
        segs: tail,
        dir: -w.dir,
        vdir: w.vdir,
        diving: false,
        inZone: w.inZone || r >= PLAYER_ROW,
        delay: 0,
        trail: 0
      });
    }
    let m = placeMush(c, r, 4, false);
    if (!m) m = placeMush(seg.c, seg.r, 4, false);
    if (m) m.pop = 0.12;
    const didSplit = tail.length > 0;
    bumpCombo();
    const pts = (wasHead ? 100 : 10) * G.mult;
    addScore(pts);
    floatText(p.x, p.y - 6, '+' + pts, wasHead ? GOLD : MINT, wasHead || G.mult >= 3);
    juice(p.x, p.y, wasHead ? GOLD : MINT, wasHead ? 1.45 : 0.95);
    if (didSplit) {
      audio.split();
      popSpark(p.x, p.y, CYN, 22);
      hitStop(0.07);
      kick(4.2);
    } else if (wasHead) {
      audio.head(G.combo);
      hitStop(0.064);
    } else {
      audio.body(G.combo);
      hitStop(0.042);
    }
    pruneWorms();
    return true;
  }

  function tryHitWorms(x, y) {
    for (let wi = G.worms.length - 1; wi >= 0; wi--) {
      const w = G.worms[wi];
      if (w.delay > 0) continue;
      for (let si = 0; si < w.segs.length; si++) {
        const p = segDraw(w.segs[si]);
        const rad = si === 0 ? 12.5 : 10.5;
        if (hypot(x - p.x, y - p.y) <= rad) {
          hitSegment(wi, si);
          return true;
        }
      }
    }
    return false;
  }

  function chipMush(m, x, y) {
    if (!m) return false;
    m.hp -= 1;
    m.hurt = 0.16;
    bumpCombo();
    if (m.hp <= 0) {
      const pts = 5 * G.mult;
      addScore(pts);
      floatText(cellCx(m.c), cellCy(m.r) - 4, '+' + pts, CAP, G.mult >= 3);
      juice(cellCx(m.c), cellCy(m.r), m.poison ? POI : CAP, 0.85);
      audio.popMush();
      hitStop(0.038);
      removeMush(m.c, m.r);
    } else {
      addScore(1);
      emit(5, {
        x: x, y: y, j: 4,
        vx0: -80, vx1: 80, vy0: -120, vy1: 20,
        life: 0.2, r0: 0.8, r1: 2, rgb: m.poison ? POI : CAP
      });
      audio.chip();
      hitStop(0.032);
      kick(1.6);
    }
    return true;
  }

  function spawnSpider() {
    const fromL = Math.random() < 0.5;
    const spd = (isForest() ? 150 : 128) + Math.min(40, G.wave * 6);
    G.spider = {
      x: fromL ? -16 : VW + 16,
      y: rand(ZONE_TOP + 20, VH - 40),
      vx: fromL ? spd : -spd,
      vy: rand(0.4, 1) * (Math.random() < 0.5 ? spd : -spd) * 0.72,
      t: 0,
      life: rand(6.2, 9.4),
      eatT: 0,
      bounceT: rand(0.28, 0.7)
    };
  }

  function spawnFlea() {
    const c = (Math.random() * COLS) | 0;
    G.flea = {
      x: cellCx(c),
      y: -10,
      vy: 210 + G.wave * 12,
      hp: 2,
      dropT: 0,
      angry: false,
      c: c
    };
  }

  function spawnScorp() {
    const fromL = Math.random() < 0.5;
    const r = 2 + ((Math.random() * 10) | 0);
    const spd = 140 + G.wave * 8;
    G.scorp = {
      x: fromL ? -20 : VW + 20,
      y: cellCy(r),
      vx: fromL ? spd : -spd,
      r: r,
      t: 0
    };
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function parkShip() {
    let x = VW * 0.5;
    let y = VH - 28;
    if (blockedPixel(x, y)) {
      let found = false;
      for (let r = ROWS - 1; r >= PLAYER_ROW && !found; r--) {
        const mid = COLS >> 1;
        for (let d = 0; d < COLS && !found; d++) {
          const c1 = mid + d;
          const c2 = mid - d;
          if (c1 < COLS && !mushAt(c1, r)) {
            x = cellCx(c1);
            y = cellCy(r);
            found = true;
          } else if (c2 >= 0 && !mushAt(c2, r)) {
            x = cellCx(c2);
            y = cellCy(r);
            found = true;
          }
        }
      }
    }
    G.ship.x = clamp(x, shipMinX(), shipMaxX());
    G.ship.y = clamp(y, shipMinY(), shipMaxY());
    G.ship.vx = 0;
    G.ship.vy = 0;
  }

  function resetField() {
    spawnMushrooms();
    spawnWave();
    parkShip();
    G.shots = [];
    G.spider = null;
    G.flea = null;
    G.scorp = null;
    G.deadT = 0;
    G.invuln = 0;
    G.fireCd = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.spiderWait = rand(3.2, 5.5);
    G.fleaWait = 1.6;
    G.scorpWait = rand(11, 16);
    G.muzzle = 0;
    resetFx();
  }

  function startGame(kind) {
    G.kind = kind === 'forest' ? 'forest' : 'classic';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    resetField();
    hideOverlay();
    audio.start();
    toast(isForest() ? '密林 · 蘑菇更密' : '经典 · 打头打尾', false, !isForest());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'classic';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    resetField();
    showOverlay('title', '蜈袭', '打头打尾，虫链会断。蘑菇挡路，蜘蛛扎底栏。', '经典', true);
    btnForest.textContent = '密林';
    btnForest.classList.remove('hidden');
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    G.fireHold = false;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    const lead = (why || '被咬了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', why || '被咬了', lead, '再来', true);
    btnForest.textContent = '换模式';
    syncHud();
  }

  function beginClear() {
    if (G.clearing) return;
    G.clearing = true;
    G.repairQ = [];
    eachMush(function (m) {
      if (m.hp < 4 || m.poison) G.repairQ.push(m);
    });
    G.repairT = 0;
    audio.wave();
    toast('第 ' + G.wave + ' 波清除', false, true);
    if (G.mode === 'play') addScore(200 * G.wave);
  }

  function finishClear() {
    G.wave += 1;
    G.clearing = false;
    G.repairQ = [];
    spawnWave();
    G.spiderWait = Math.min(G.spiderWait, 2.4);
    toast('第 ' + G.wave + ' 波 · 加速', false, G.wave < 5);
    syncHud();
  }

  function canFire() {
    if (G.deadT > 0) return false;
    if (G.mode !== 'play' && G.mode !== 'title') return false;
    if (G.mode === 'play' && overlayOpen()) return false;
    if (G.shots.length >= 1) return false;
    if (G.fireCd > 0) return false;
    if (G.clearing) return false;
    return true;
  }

  function fire() {
    if (!canFire()) return false;
    G.shots.push({
      x: G.ship.x,
      y: G.ship.y - 12,
      vy: -SHOT_V,
      trail: []
    });
    G.fireCd = 0.016;
    G.muzzle = 0.08;
    if (G.mode === 'play' || G.mode === 'title') audio.shoot();
    if (G.mode === 'play' && !REDUCE) G.punch = Math.max(G.punch, 1.012);
    emit(4, {
      x: G.ship.x, y: G.ship.y - 12, j: 2,
      vx0: -30, vx1: 30, vy0: -140, vy1: -30,
      life: 0.14, r0: 0.6, r1: 1.5, rgb: CYN, g: 0
    });
    return true;
  }

  function diePlayer(why) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.88;
    G.why = why || '被咬了';
    G.combo = 0;
    G.mult = 1;
    G.fireHold = false;
    G.shots = [];
    audio.death();
    juice(G.ship.x, G.ship.y, MAG, 1.7);
    screenFlash(MAG, 0.6);
    kick(6.5);
    hitStop(0.08);
    toast(why || '被咬了', true, false);
    syncHud();
  }

  function hitSpider(x, y) {
    const sp = G.spider;
    if (!sp) return false;
    if (hypot(x - sp.x, y - sp.y) > 16) return false;
    const d = hypot(sp.x - G.ship.x, sp.y - G.ship.y);
    const base = d < 52 ? 900 : d < 108 ? 600 : 300;
    bumpCombo();
    const pts = base * G.mult;
    addScore(pts);
    floatText(sp.x, sp.y - 8, '+' + pts, GOLD, true);
    juice(sp.x, sp.y, MAG, 1.6);
    audio.spider();
    hitStop(0.075);
    kick(5);
    G.spider = null;
    G.spiderWait = rand(6.5, 11);
    return true;
  }

  function hitFlea(x, y) {
    const f = G.flea;
    if (!f) return false;
    if (hypot(x - f.x, y - f.y) > 12) return false;
    f.hp -= 1;
    f.flash = 0.12;
    if (f.hp <= 0) {
      bumpCombo();
      const pts = 200 * G.mult;
      addScore(pts);
      floatText(f.x, f.y, '+' + pts, FLEA_C, true);
      juice(f.x, f.y, FLEA_C, 1.2);
      audio.flea();
      hitStop(0.055);
      G.flea = null;
      G.fleaWait = rand(2.4, 5);
    } else {
      f.angry = true;
      f.vy *= 1.65;
      emit(8, {
        x: f.x, y: f.y, j: 5,
        vx0: -120, vx1: 120, vy0: -80, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: FLEA_C
      });
      audio.chip();
      hitStop(0.032);
    }
    return true;
  }

  function hitScorp(x, y) {
    const s = G.scorp;
    if (!s) return false;
    if (Math.abs(x - s.x) > 18 || Math.abs(y - s.y) > 10) return false;
    bumpCombo();
    const pts = 1000 * G.mult;
    addScore(pts);
    floatText(s.x, s.y - 8, '+' + pts, GOLD, true);
    juice(s.x, s.y, SCORP_C, 1.8);
    audio.scorp();
    hitStop(0.08);
    kick(5.5);
    screenFlash(GOLD, 0.45);
    G.scorp = null;
    G.scorpWait = rand(14, 22);
    return true;
  }

  function collideShot(s) {
    if (tryHitWorms(s.x, s.y)) return true;
    if (hitSpider(s.x, s.y)) return true;
    if (hitFlea(s.x, s.y)) return true;
    if (hitScorp(s.x, s.y)) return true;
    const c = colOf(s.x);
    const r = rowOf(s.y);
    const m = mushAt(c, r);
    if (m) return chipMush(m, s.x, s.y);
    return false;
  }

  function moveShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      const steps = 3;
      const sub = dt / steps;
      let dead = false;
      for (let k = 0; k < steps; k++) {
        s.y += s.vy * sub;
        if (!s.trail) s.trail = [];
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 6) s.trail.shift();
        if (s.y < -8) {
          dead = true;
          break;
        }
        if (collideShot(s)) {
          dead = true;
          break;
        }
      }
      if (dead) G.shots.splice(i, 1);
    }
  }

  function moveSpider(dt) {
    const sp = G.spider;
    if (!sp) return;
    sp.t += dt;
    sp.life -= dt;
    sp.bounceT -= dt;
    if (sp.bounceT <= 0) {
      sp.vy *= -1;
      if (Math.random() < 0.35) sp.vx *= -1;
      sp.bounceT = rand(0.22, 0.7);
    }
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    const top = ZONE_TOP - 8;
    const bot = VH - 16;
    if (sp.y < top) { sp.y = top; sp.vy = Math.abs(sp.vy); }
    if (sp.y > bot) { sp.y = bot; sp.vy = -Math.abs(sp.vy); }
    if (sp.life <= 0) {
      if (sp.x > VW * 0.5) sp.vx = Math.abs(sp.vx) + 40;
      else sp.vx = -Math.abs(sp.vx) - 40;
    }
    if (sp.x < -28 || sp.x > VW + 28) {
      G.spider = null;
      G.spiderWait = rand(5.5, 10);
      return;
    }
    sp.eatT -= dt;
    if (sp.eatT <= 0) {
      const c = colOf(sp.x);
      const r = rowOf(sp.y);
      const m = mushAt(c, r);
      if (m) {
        juice(cellCx(c), cellCy(r), MAG, 0.4);
        removeMush(c, r);
      }
      sp.eatT = 0.12;
    }
  }

  function moveFlea(dt) {
    const f = G.flea;
    if (!f) return;
    f.y += f.vy * dt;
    const r = rowOf(f.y);
    if (!f.angry && r >= 1 && r < ROWS - 1) {
      f.dropT -= dt;
      if (f.dropT <= 0) {
        const c = colOf(f.x);
        if (!mushAt(c, r) && Math.random() < 0.55) placeMush(c, r, 4, false);
        f.dropT = 0.07;
      }
    }
    if (f.y > VH + 18) {
      G.flea = null;
      G.fleaWait = rand(1.8, 4.2);
    }
  }

  function moveScorp(dt) {
    const s = G.scorp;
    if (!s) return;
    s.t += dt;
    s.x += s.vx * dt;
    const c = colOf(s.x);
    const m = mushAt(c, s.r);
    if (m && !m.poison) {
      m.poison = true;
      m.hurt = 0.2;
      audio.poison();
      emit(4, {
        x: cellCx(c), y: cellCy(s.r), j: 3,
        vx0: -40, vx1: 40, vy0: -40, vy1: 20,
        life: 0.2, r0: 0.8, r1: 1.8, rgb: POI, g: 0
      });
    }
    if (s.x < -36 || s.x > VW + 36) {
      G.scorp = null;
      G.scorpWait = rand(12, 20);
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const spd = isForest() ? 330 : 300;
    let ax = 0;
    let ay = 0;
    if (autoOn && G.mode === 'play') {
      const max = AUTO_MAX_V[autoSpeed] * dt;
      const dx = autoTargetX - G.ship.x;
      const dy = autoTargetY - G.ship.y;
      const nx = Math.abs(dx) <= max ? G.ship.x + dx : G.ship.x + (dx < 0 ? -max : max);
      const ny = Math.abs(dy) <= max ? G.ship.y + dy : G.ship.y + (dy < 0 ? -max : max);
      tryMoveShip(nx, ny);
      return;
    }
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const k = 1 - Math.exp(-dt * 18);
      tryMoveShip(lerp(G.ship.x, pointer.x, k), lerp(G.ship.y, pointer.y, k));
      return;
    }
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay -= 1;
    if (keys.d) ay += 1;
    if (ax || ay) {
      const len = hypot(ax, ay) || 1;
      tryMoveShip(G.ship.x + (ax / len) * spd * dt, G.ship.y + (ay / len) * spd * dt);
    }
  }

  function playerTouching() {
    if (G.deadT > 0 || G.invuln > 0) return null;
    const px = G.ship.x;
    const py = G.ship.y;
    for (let wi = 0; wi < G.worms.length; wi++) {
      const w = G.worms[wi];
      if (w.delay > 0) continue;
      for (let si = 0; si < w.segs.length; si++) {
        const p = segDraw(w.segs[si]);
        if (hypot(px - p.x, py - p.y) < SHIP_R + 9) return '被咬了';
      }
    }
    if (G.spider && hypot(px - G.spider.x, py - G.spider.y) < SHIP_R + 12) return '蜘蛛贴脸';
    if (G.flea && hypot(px - G.flea.x, py - G.flea.y) < SHIP_R + 9) return '跳蚤砸中';
    return null;
  }

  function columnMushAbove(c, fromR) {
    let n = 0;
    for (let r = fromR - 1; r >= 0; r--) if (mushAt(c, r)) n += 1;
    return n;
  }

  function lowestThreat() {
    let best = null;
    let bestS = -1e9;
    for (let wi = 0; wi < G.worms.length; wi++) {
      const w = G.worms[wi];
      if (w.delay > 0) continue;
      for (let si = 0; si < w.segs.length; si++) {
        const s = w.segs[si];
        const p = segDraw(s);
        let sc = s.r * 18;
        if (si === 0) sc += 8;
        if (w.diving) sc += 40;
        if (w.inZone) sc += 50;
        sc -= Math.abs(p.x - G.ship.x) * 0.08;
        sc -= columnMushAbove(s.c, rowOf(G.ship.y)) * 14;
        if (sc > bestS) {
          bestS = sc;
          best = { x: p.x, y: p.y, c: s.c, r: s.r, diving: w.diving, inZone: w.inZone };
        }
      }
    }
    return best;
  }

  function autoThink() {
    autoFire = true;
    autoTargetX = G.ship.x;
    autoTargetY = G.ship.y;
    if (G.mode !== 'play' || G.deadT > 0 || G.clearing) return;

    if (G.spider) {
      const sp = G.spider;
      const d = hypot(sp.x - G.ship.x, sp.y - G.ship.y);
      if (d < 86) {
        const dirX = G.ship.x >= sp.x ? 1 : -1;
        const dirY = G.ship.y >= sp.y ? 1 : -1;
        autoTargetX = clamp(G.ship.x + dirX * 78, shipMinX(), shipMaxX());
        autoTargetY = clamp(G.ship.y + dirY * 36, shipMinY(), shipMaxY());
        return;
      }
    }

    if (G.flea && G.flea.y > 40 && G.flea.y < G.ship.y - 10) {
      autoTargetX = clamp(G.flea.x, shipMinX(), shipMaxX());
      if (Math.abs(G.ship.x - G.flea.x) < AUTO_ALIGN[autoSpeed] + 10) return;
    }

    if (G.scorp && G.scorp.y < G.ship.y) {
      const cover = columnMushAbove(colOf(G.scorp.x), rowOf(G.ship.y));
      if (cover < 3) {
        autoTargetX = clamp(G.scorp.x, shipMinX(), shipMaxX());
      }
    }

    const th = lowestThreat();
    if (th) {
      autoTargetX = clamp(th.x, shipMinX(), shipMaxX());
      if (th.inZone) {
        autoTargetY = clamp(th.y + 28, shipMinY(), shipMaxY());
        if (hypot(th.x - G.ship.x, th.y - G.ship.y) < 40) {
          autoTargetX = clamp(th.x + (G.ship.x >= th.x ? 36 : -36), shipMinX(), shipMaxX());
        }
      } else {
        autoTargetY = lerp(G.ship.y, shipMaxY() - 8, 0.35);
      }
      return;
    }

    if (G.spider) {
      autoTargetX = clamp(G.spider.x, shipMinX(), shipMaxX());
      return;
    }

    autoTargetY = shipMaxY() - 6;
  }

  function demoThink(dt) {
    autoFire = false;
    const th = lowestThreat();
    let tx = G.ship.x;
    let ty = G.ship.y;
    if (th) {
      tx = th.x;
      autoFire = Math.abs(G.ship.x - th.x) < 12;
    }
    if (G.spider && hypot(G.spider.x - G.ship.x, G.spider.y - G.ship.y) < 70) {
      tx = G.ship.x + (G.ship.x >= G.spider.x ? 60 : -60);
      ty = G.ship.y + (G.ship.y >= G.spider.y ? 24 : -24);
      autoFire = false;
    }
    const max = 240 * dt;
    const dx = clamp(tx, shipMinX(), shipMaxX()) - G.ship.x;
    const dy = clamp(ty, shipMinY(), shipMaxY()) - G.ship.y;
    tryMoveShip(
      G.ship.x + (Math.abs(dx) <= max ? dx : dx < 0 ? -max : max),
      G.ship.y + (Math.abs(dy) <= max ? dy : dy < 0 ? -max : max)
    );
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame('classic');
      }
      return;
    }
    if (G.mode === 'lose') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind);
      }
    }
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.textContent = autoOn ? '停' : '自动';
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.setAttribute('aria-label', autoOn ? '取消自动' : '自动');
  }

  function toggleAuto() {
    autoOn = !autoOn;
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    pointer.down = false;
    G.fireHold = false;
    autoOvWait = 0;
    autoFire = false;
    syncAutoUi();
    if (!autoOn) return;
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
  }

  function spawnTimers(dt) {
    if (G.ready > 0 || G.clearing) return;
    G.spiderWait -= dt;
    if (!G.spider && G.spiderWait <= 0) spawnSpider();
    G.fleaWait -= dt;
    if (!G.flea && G.fleaWait <= 0) {
      const sparse = zoneMushCount() < (isForest() ? 6 : 4) || mushCount() < 14 + G.wave;
      if (sparse) spawnFlea();
      else G.fleaWait = 1.1;
    }
    if (G.wave >= 2) {
      G.scorpWait -= dt;
      if (!G.scorp && G.scorpWait <= 0) spawnScorp();
    }
  }

  function stepAllWorms(dt) {
    for (let i = 0; i < G.worms.length; i++) {
      if (G.worms[i].delay > 0) {
        G.worms[i].delay -= dt;
        if (G.worms[i].delay < 0) G.worms[i].delay = 0;
      }
      if (G.worms[i].trail > 0) G.worms[i].trail -= dt;
    }
    if (G.ready > 0 || G.clearing) {
      G.frac = 1;
      return;
    }
    G.stepIntv = stepInterval();
    G.stepAcc += dt;
    let guard = 0;
    while (G.stepAcc >= G.stepIntv && guard < 6) {
      G.stepAcc -= G.stepIntv;
      for (let i = 0; i < G.worms.length; i++) stepWorm(G.worms[i]);
      G.stepIntv = stepInterval();
      guard += 1;
    }
    G.frac = G.stepIntv > 0 ? clamp(G.stepAcc / G.stepIntv, 0, 1) : 1;
  }

  function tickRepair(dt) {
    if (!G.clearing) return;
    G.repairT -= dt;
    if (G.repairQ.length) {
      if (G.repairT <= 0) {
        const m = G.repairQ.shift();
        if (m && mushAt(m.c, m.r) === m) {
          m.hp = 4;
          m.poison = false;
          m.pop = 0.4;
          m.hurt = 0.1;
          if (G.mode === 'play') addScore(5);
          audio.tick();
          emit(3, {
            x: cellCx(m.c), y: cellCy(m.r), j: 3,
            vx0: -30, vx1: 30, vy0: -50, vy1: 10,
            life: 0.18, r0: 0.7, r1: 1.6, rgb: MINT, g: 80
          });
        }
        G.repairT = 0.042;
      }
      return;
    }
    G.repairT -= dt;
    if (G.repairT < -0.28) finishClear();
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3.2);
    if (G.punch !== 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    eachMush(function (m) {
      if (m.pop < 1) m.pop = Math.min(1, m.pop + dt * 6.5);
      if (m.hurt > 0) m.hurt = Math.max(0, m.hurt - dt);
    });
    for (let i = 0; i < G.worms.length; i++) {
      const segs = G.worms[i].segs;
      for (let s = 0; s < segs.length; s++) {
        if (segs[s].flash > 0) segs[s].flash -= dt;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.3);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.34) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = 0; i < spores.length; i++) {
      const s = spores[i];
      s.y += s.v * dt * 0.2;
      if (s.y > VH) s.y = 0;
    }
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }

    updatePlayer(dt);
    const holding = (G.mode === 'title' && autoFire)
      || (G.mode === 'play' && ((autoOn && autoFire) || (!autoOn && G.fireHold)));
    if (holding) fire();

    if (G.ready > 0) {
      G.ready -= dt;
      moveShots(dt);
      return;
    }

    if (G.clearing) {
      tickRepair(dt);
      moveShots(dt);
      return;
    }

    stepAllWorms(dt);
    moveSpider(dt);
    moveFlea(dt);
    moveScorp(dt);
    moveShots(dt);
    spawnTimers(dt);

    if (G.mode === 'play' && G.deadT <= 0) {
      const why = playerTouching();
      if (why) diePlayer(why);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    tickAutoFlow(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (autoOn && G.mode === 'play') autoThink();

    if (G.mode === 'title') {
      demoThink(dt);
      playSim(dt);
      if (segmentCount() === 0) spawnWave();
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose') {
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      stepAllWorms(dt);
      moveSpider(dt);
      moveFlea(dt);
      moveScorp(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '命尽了');
          updateFx(dt);
          return;
        }
        parkShip();
        G.invuln = 1.35;
        G.shots = [];
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && !G.clearing && segmentCount() === 0) {
      beginClear();
    }

    updateFx(dt);
    syncHud();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#07140e');
    g.addColorStop(0.55, '#04110c');
    g.addColorStop(1, '#030a08');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(200), 16 * scale, sx(240), sy(280), 380 * scale);
    vg.addColorStop(0, 'rgba(61, 255, 138, 0.07)');
    vg.addColorStop(0.55, 'rgba(0, 240, 255, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.fillStyle = 'rgba(61, 255, 138, 0.035)';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if ((c + r) % 2 === 0) {
          ctx.fillRect(sx(c * CELL), sy(r * CELL), CELL * scale, CELL * scale);
        }
      }
    }

    for (let i = 0; i < spores.length; i++) {
      const s = spores[i];
      const a = s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.3 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.fillRect(sx(0), sy(ZONE_TOP), VW * scale, 2 * scale);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.035)';
    ctx.fillRect(sx(0), sy(ZONE_TOP), VW * scale, (VH - ZONE_TOP) * scale);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.setLineDash([4 * scale, 5 * scale]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(8), sy(ZONE_TOP));
    ctx.lineTo(sx(VW - 8), sy(ZONE_TOP));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawMushrooms() {
    eachMush(function (m) {
      const cx = cellCx(m.c);
      const cy = cellCy(m.r);
      const pop = m.pop < 1 ? (m.pop < 0.7 ? m.pop / 0.7 : 1 + Math.sin((m.pop - 0.7) * 10) * 0.08) : 1;
      const hurt = m.hurt > 0 ? 1 + m.hurt * 0.4 : 1;
      const hpK = 0.55 + m.hp * 0.112;
      const capR = 7.2 * pop * hpK * hurt;
      const rgb = m.poison ? POI : CAP;
      ctx.save();
      ctx.globalAlpha = 0.22 + m.hp * 0.08;
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy - 1), capR * 1.35 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = rgba(m.poison ? [180, 90, 255] : HOT, 0.9);
      roundRect(sx(cx - 1.6 * pop), sy(cy + 1), 3.2 * pop * scale, 6.2 * pop * scale, 1.2 * scale);
      ctx.fill();

      ctx.fillStyle = rgba(m.hurt > 0 ? WHT : rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(cx), sy(cy - 2.2), capR * scale, capR * 0.78 * scale, 0, 0, TAU);
      ctx.fill();

      ctx.fillStyle = rgba(WHT, 0.35);
      ctx.beginPath();
      ctx.ellipse(sx(cx - capR * 0.28), sy(cy - 3.4), capR * 0.28 * scale, capR * 0.16 * scale, -0.4, 0, TAU);
      ctx.fill();

      if (m.poison) {
        const pulse = 0.45 + 0.55 * Math.sin(G.t * 8 + m.c);
        ctx.strokeStyle = rgba(GOLD, 0.35 + pulse * 0.5);
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.arc(sx(cx), sy(cy - 2), (capR + 2.2) * scale, 0, TAU);
        ctx.stroke();
      }
    });
  }

  function drawWorms() {
    for (let wi = 0; wi < G.worms.length; wi++) {
      const w = G.worms[wi];
      if (w.delay > 0) continue;
      const segs = w.segs;
      for (let i = segs.length - 1; i >= 0; i--) {
        const p = segDraw(segs[i]);
        const head = i === 0;
        const wave = Math.sin(G.t * 9 + i * 0.7) * (head ? 0 : 0.8);
        const x = p.x;
        const y = p.y + wave;
        const rad = head ? 11.2 : 9.4;
        const rgb = w.diving ? POI : (head ? HOT : MINT);
        if (w.diving || w.trail > 0) {
          ctx.fillStyle = rgba(POI, 0.12);
          ctx.beginPath();
          ctx.arc(sx(x), sy(y - 6), (rad + 4) * scale, 0, TAU);
          ctx.fill();
        }
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = rgba(rgb, 1);
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), (rad + 3) * scale, 0, TAU);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = rgba(head ? HOT : LEAF, 1);
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), rad * scale, 0, TAU);
        ctx.fill();

        ctx.fillStyle = rgba(WHT, 0.28);
        ctx.beginPath();
        ctx.arc(sx(x - 2.4), sy(y - 2.8), rad * 0.32 * scale, 0, TAU);
        ctx.fill();

        if (head) {
          const dx = w.dir;
          ctx.fillStyle = '#04110c';
          ctx.beginPath();
          ctx.arc(sx(x + dx * 3.2), sy(y - 2.2), 1.7 * scale, 0, TAU);
          ctx.arc(sx(x + dx * 1.2), sy(y - 3.4), 1.5 * scale, 0, TAU);
          ctx.fill();
          ctx.fillStyle = rgba(WHT, 0.9);
          ctx.beginPath();
          ctx.arc(sx(x + dx * 3.5), sy(y - 2.5), 0.55 * scale, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = rgba(HOT, 0.9);
          ctx.lineWidth = 1.6 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(x + dx * 8), sy(y - 4));
          ctx.lineTo(sx(x + dx * 4), sy(y - 1));
          ctx.moveTo(sx(x + dx * 8), sy(y + 3));
          ctx.lineTo(sx(x + dx * 4), sy(y + 1));
          ctx.stroke();
        }
      }
    }
  }

  function drawSpider() {
    const sp = G.spider;
    if (!sp) return;
    const t = G.t * 14;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = rgba(MAG, 1);
    ctx.beginPath();
    ctx.arc(sx(sp.x), sy(sp.y), 16 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = rgba(MAG, 0.85);
    ctx.lineWidth = 1.4 * scale;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = -0.9 + i * 0.28 + Math.sin(t + i) * 0.18;
      const b = 0.9 - i * 0.28 + Math.sin(t + i + 2) * 0.18;
      ctx.beginPath();
      ctx.moveTo(sx(sp.x), sy(sp.y));
      ctx.lineTo(sx(sp.x - 14 * Math.cos(a)), sy(sp.y + 10 * Math.sin(a)));
      ctx.moveTo(sx(sp.x), sy(sp.y));
      ctx.lineTo(sx(sp.x + 14 * Math.cos(b)), sy(sp.y + 10 * Math.sin(b)));
      ctx.stroke();
    }
    ctx.fillStyle = rgba(MAG, 1);
    ctx.beginPath();
    ctx.ellipse(sx(sp.x), sy(sp.y), 7.4 * scale, 5.6 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.arc(sx(sp.x - 2.2), sy(sp.y - 1.2), 1.1 * scale, 0, TAU);
    ctx.arc(sx(sp.x + 2.2), sy(sp.y - 1.2), 1.1 * scale, 0, TAU);
    ctx.fill();
  }

  function drawFlea() {
    const f = G.flea;
    if (!f) return;
    const bob = Math.sin(G.t * 22) * 1.2;
    ctx.fillStyle = rgba(FLEA_C, 0.22);
    ctx.beginPath();
    ctx.arc(sx(f.x), sy(f.y), 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(f.angry ? MAG : FLEA_C, 1);
    ctx.beginPath();
    ctx.ellipse(sx(f.x), sy(f.y + bob), 5.4 * scale, 7.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.beginPath();
    ctx.ellipse(sx(f.x - 1.4), sy(f.y - 2 + bob), 2 * scale, 2.6 * scale, -0.3, 0, TAU);
    ctx.fill();
  }

  function drawScorp() {
    const s = G.scorp;
    if (!s) return;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = rgba(SCORP_C, 1);
    ctx.beginPath();
    ctx.ellipse(sx(s.x), sy(s.y), 22 * scale, 9 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    const dir = s.vx >= 0 ? 1 : -1;
    ctx.fillStyle = rgba(SCORP_C, 1);
    ctx.beginPath();
    ctx.ellipse(sx(s.x), sy(s.y), 12 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx(s.x - dir * 10), sy(s.y), 7 * scale, 4.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(s.x + dir * 10), sy(s.y - 2));
    ctx.quadraticCurveTo(sx(s.x + dir * 18), sy(s.y - 14), sx(s.x + dir * 8), sy(s.y - 16));
    ctx.stroke();
    ctx.fillStyle = rgba(MAG, 1);
    ctx.beginPath();
    ctx.arc(sx(s.x + dir * 8), sy(s.y - 16), 2.2 * scale, 0, TAU);
    ctx.fill();
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.trail && !REDUCE) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx.fillStyle = rgba(CYN, 0.1 + t * 0.08);
          ctx.fillRect(sx(p.x - 1.1), sy(p.y), 2.2 * scale, 7 * scale);
        }
      }
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 8), 2.8 * scale, 14 * scale);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.fillRect(sx(s.x - 2.1), sy(s.y - 6), 4.2 * scale, 8 * scale);
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) {
      const k = 1 - G.deadT / 0.88;
      ctx.fillStyle = rgba(MAG, 0.35 * (1 - k));
      ctx.beginPath();
      ctx.arc(sx(G.ship.x), sy(G.ship.y), (18 + k * 22) * scale, 0, TAU);
      ctx.fill();
      return;
    }
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const x = G.ship.x;
    const y = G.ship.y;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 14 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y - 12));
    ctx.lineTo(sx(x + 10), sy(y + 8));
    ctx.lineTo(sx(x + 3), sy(y + 4));
    ctx.lineTo(sx(x - 3), sy(y + 4));
    ctx.lineTo(sx(x - 10), sy(y + 8));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(sx(x - 1.4), sy(y - 14), 2.8 * scale, 8 * scale);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = Math.max(0, q.life / q.max);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      const rad = s.rad * (0.4 + s.t * 2.4);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * TAU + s.t * 4;
        ctx.moveTo(sx(s.x), sy(s.y));
        ctx.lineTo(sx(s.x + Math.cos(ang) * rad), sy(s.y + Math.sin(ang) * rad));
      }
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.34;
      ctx.strokeStyle = rgba(r.rgb, a * 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 52) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, a);
      ctx.shadowColor = rgba(f.rgb, a * 0.7);
      ctx.shadowBlur = 8 * scale;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.shadowBlur = 0;
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#030a08';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.55);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawMushrooms();
    drawWorms();
    drawScorp();
    drawFlea();
    drawSpider();
    drawShots();
    drawShip();
    drawParticles();
    drawFloats();
    drawFlash();
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return {
      x: (x - ox) / scale,
      y: (y - oy) / scale
    };
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
    else startGame(G.kind || 'classic');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('classic');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'a' || k === 'A') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'w' || k === 'W') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 's' || k === 'S') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'd' || k === 'D') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (down && (k.indexOf('Arrow') === 0 || space || k === 'Enter' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1' && overlayOpen() && G.mode === 'title') {
      startGame('classic');
      return;
    }
    if ((k === '2' || k === 'f' || k === 'F') && overlayOpen() && G.mode === 'title') {
      startGame('forest');
      return;
    }
    if (autoOn && (k.indexOf('Arrow') === 0 || space || k === 'w' || k === 'W' || k === 's' || k === 'S' || k === 'd' || k === 'D')) return;
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (autoOn) return;
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      const p = pointerWorld(e);
      pointer.x = clamp(p.x, shipMinX(), shipMaxX());
      pointer.y = clamp(p.y, shipMinY(), shipMaxY());
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pointerWorld(e);
      pointer.x = clamp(p.x, shipMinX(), shipMaxX());
      pointer.y = clamp(p.y, shipMinY(), shipMaxY());
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) G.fireHold = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now * 0.001;
      return;
    }
    const t = now * 0.001;
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  function initSpeed() {
    autoSpeed = loadAutoSpeed();
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
  }

  seedSpores();
  loadBest();
  initMute();
  initSpeed();
  goTitle();
  resize();
  bindPointer();
  syncAutoUi();

  if (btnClassic) {
    btnClassic.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('classic');
    });
  }
  if (btnForest) {
    btnForest.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('forest');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnAuto) btnAuto.addEventListener('click', toggleAuto);
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      autoSpeed = clamp(parseInt(speedEl.value, 10) || 3, 1, 4);
      saveAutoSpeed(autoSpeed);
      if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.u = false;
      keys.d = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
