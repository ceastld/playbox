'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const COLS = 11;
  const ROWS = 5;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const PLAYER_Y = 662;
  const UFO_Y = 46;
  const BUNKER_Y = 548;
  const BUNKER_CELL = 4;
  const STEP_X = 8;
  const DROP_Y = 18;
  const SHOT_V = 580;
  const COMBO_WIN = 1.42;
  const BEST_KEY = 'playbox-star-raid-best';
  const MUTE_KEY = 'playbox-star-raid-mute';
  const AUTO_SPEED_KEY = 'playbox-star-raid-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_MAX_V = [0, 160, 260, 400, 720];
  const AUTO_ALIGN = [0, 5, 7, 10, 14];
  const AUTO_DODGE = [0, 0.32, 0.42, 0.55, 0.7];
  const MYSTERY = [50, 100, 50, 150, 100, 50, 300, 100];
  const MARCH = [196, 165, 147, 130];
  const OPS = '← → 移动 · 空格 / 点按开火 · A 自动 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [155, 92, 255];
  const MINT = [92, 255, 196];
  const WHT = [246, 243, 255];
  const HOT = [196, 107, 255];

  const TYPE_RGB = [PUR, MAG, CYN];
  const TYPE_SCORE = [30, 20, 10];
  const TYPE_HW = [11, 13, 14];
  const TYPE_HH = [8, 8, 8];

  const SPR = [
    [
      [
        '  #     #  ',
        '   #   #   ',
        '  #######  ',
        ' ## ### ## ',
        '###########',
        '# ####### #',
        '# #     # #',
        '   ## ##   '
      ],
      [
        '  #     #  ',
        '#  #   #  #',
        '# ####### #',
        '### ### ###',
        '###########',
        '  #######  ',
        '  #     #  ',
        ' #       # '
      ]
    ],
    [
      [
        '  ##   ##  ',
        '   #####   ',
        '  #######  ',
        ' ## ### ## ',
        '###########',
        '# ####### #',
        '# #     # #',
        '  ##   ##  '
      ],
      [
        '  ##   ##  ',
        '   #####   ',
        '  #######  ',
        ' ## ### ## ',
        '###########',
        '  #######  ',
        ' #  # #  # ',
        '#        # '
      ]
    ],
    [
      [
        '   ######  ',
        ' ##########',
        '###########',
        '###  ##  ##',
        '###########',
        '  ###  ### ',
        ' ##  ##  ##',
        '##        #'
      ],
      [
        '   ######  ',
        ' ##########',
        '###########',
        '###  ##  ##',
        '###########',
        ' ##  ##  ##',
        '#  ##  ## #',
        '  #     #  '
      ]
    ]
  ];

  const SPR_UFO = [
    '  #########  ',
    ' ########### ',
    '#############',
    '# ## ## ## ##',
    '#############',
    '  ##     ##  '
  ];

  const SPR_SHIP = [
    '      ##      ',
    '     ####     ',
    '  ##########  ',
    '##############',
    '## ## ## ## ##'
  ];

  const BUNKER_MASK = [
    '  ######  ',
    ' ######## ',
    '##########',
    '##########',
    '##########',
    '###    ###',
    '##      ##'
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnStorm = document.getElementById('btn-storm');
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
  let comboTok = 0;

  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

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
    aliens: [],
    shots: [],
    bombs: [],
    bunkers: [],
    ufo: null,
    ship: { x: VW * 0.5, y: PLAYER_Y, vx: 0 },
    dir: 1,
    dropPending: false,
    stepT: 0.5,
    frame: 0,
    marchNote: 0,
    fireCd: 0,
    fireHold: false,
    shotsFired: 0,
    bombT: 0.8,
    ufoWait: 16,
    ufoBeep: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    stepPunch: 0,
    toastT: 0,
    why: ''
  };

  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoTarget = VW * 0.5;
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

  function isStorm() {
    return G.kind === 'storm';
  }

  function shipMin() {
    return 22;
  }
  function shipMax() {
    return VW - 22;
  }

  function gapX() {
    return isStorm() ? 7 : 14;
  }
  function gapY() {
    return isStorm() ? 9 : 14;
  }
  function alienW() {
    return 24;
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
      this.beep(720, 0.07, 'square', 0.035, 1480);
    },
    march(i) {
      this.ensure();
      this.beep(MARCH[i & 3], 0.085, 'square', 0.028);
    },
    hit(type, combo) {
      this.ensure();
      const base = type === 0 ? 980 : type === 1 ? 740 : 520;
      const lift = 1 + Math.min(0.45, combo * 0.035);
      this.noise(0.045, 0.04, 1200);
      this.beep(base * lift, 0.08, 'square', 0.05, base * lift * 1.45);
    },
    bunker() {
      this.ensure();
      this.noise(0.035, 0.028, 700);
      this.beep(210, 0.04, 'triangle', 0.02);
    },
    ufoTick() {
      this.ensure();
      this.beep(392, 0.07, 'sawtooth', 0.02, 280);
    },
    ufoHit() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.055, 784);
      this.beep(784, 0.14, 'triangle', 0.05, 1175);
      this.beep(1046, 0.22, 'sine', 0.045, 1560);
      this.noise(0.08, 0.04, 600);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.025, 80);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(320, 0.16, 'sawtooth', 0.05, 90);
      this.beep(180, 0.28, 'sine', 0.045, 50);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
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
    if (G.mode !== 'play' || n <= 0) return;
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星袭';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = isStorm() ? 'BARRAGE' : 'CLASSIC';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 外星人落地或三命用尽', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 别让它们落地', 'warn');
    else setHint('← → 移动 · 空格开火 · A 自动 · R 重开', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showStorm) {
    autoOvWait = 0;
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'RAID';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnClassic.textContent = primary;
    btnStorm.classList.toggle('hidden', !showStorm);
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.006));
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
    capArr(particles, 280);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 36);
    capArr(rings, 22);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.9 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -86 : -70
    });
    capArr(floats, 24);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -180 * p, vx1: 180 * p, vy0: -220 * p, vy1: 90 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.22 + p * 0.16);
    kick(2.4 + p * 2.8);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 46; i++) {
      stars.push({
        x: rand(8, VW - 8),
        y: rand(10, VH - 24),
        r: rand(0.5, 1.6),
        a: rand(0.15, 0.55),
        p: rand(0, TAU),
        rgb: i % 5 === 0 ? MAG : i % 3 === 0 ? CYN : WHT
      });
    }
  }

  function bunkerCols() {
    return BUNKER_MASK[0].length;
  }
  function bunkerRows() {
    return BUNKER_MASK.length;
  }
  function bunkerW() {
    return bunkerCols() * BUNKER_CELL;
  }
  function bunkerH() {
    return bunkerRows() * BUNKER_CELL;
  }

  function makeBunker(x) {
    const cols = bunkerCols();
    const rows = bunkerRows();
    const cells = [];
    let live = 0;
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const on = BUNKER_MASK[r].charAt(c) === '#';
        row.push(on ? 1 : 0);
        if (on) live += 1;
      }
      cells.push(row);
    }
    return { x: x, y: BUNKER_Y, cells: cells, live: live };
  }

  function spawnBunkers() {
    G.bunkers = [];
    const n = isStorm() ? 3 : 4;
    const w = bunkerW();
    const span = VW - 64;
    const gap = (span - n * w) / (n + 1);
    for (let i = 0; i < n; i++) {
      const x = 32 + gap * (i + 1) + w * i;
      G.bunkers.push(makeBunker(x));
    }
  }

  function waveStartY() {
    return 78 + Math.min(G.wave - 1, 6) * 16;
  }

  function spawnWave() {
    G.aliens = [];
    const aw = alienW();
    const gx = gapX();
    const gy = gapY();
    const totalW = COLS * aw + (COLS - 1) * gx;
    const left = (VW - totalW) / 2 + aw * 0.5;
    const top = waveStartY();
    for (let r = 0; r < ROWS; r++) {
      const type = r === 0 ? 0 : r <= 2 ? 1 : 2;
      for (let c = 0; c < COLS; c++) {
        G.aliens.push({
          c: c,
          r: r,
          type: type,
          x: left + c * (aw + gx),
          y: top + r * (16 + gy),
          hw: TYPE_HW[type],
          hh: TYPE_HH[type],
          score: TYPE_SCORE[type],
          rgb: TYPE_RGB[type],
          alive: true,
          flash: 0
        });
      }
    }
    G.dir = 1;
    G.dropPending = false;
    G.stepT = marchInterval() * 0.6;
    G.frame = 0;
    G.bombT = isStorm() ? 0.35 : 0.7;
    G.ready = G.mode === 'play' ? 0.48 : 0.15;
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.aliens.length; i++) if (G.aliens[i].alive) n += 1;
    return n;
  }

  function marchInterval() {
    const n = Math.max(1, aliveCount());
    const waveF = 1 + (G.wave - 1) * 0.16;
    const stormF = isStorm() ? 1.22 : 1;
    const t = 0.82 / waveF / stormF * (n / (ROWS * COLS));
    return clamp(t, isStorm() ? 0.032 : 0.038, 0.88);
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
    G.stepPunch = 0;
  }

  function resetField() {
    spawnBunkers();
    spawnWave();
    G.ship.x = VW * 0.5;
    G.ship.vx = 0;
    G.shots = [];
    G.bombs = [];
    G.ufo = null;
    G.deadT = 0;
    G.invuln = 0;
    G.fireCd = 0;
    G.shotsFired = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.ufoWait = rand(14, 24);
    G.ufoBeep = 0;
    G.marchNote = 0;
    resetFx();
  }

  function startGame(kind) {
    G.kind = kind === 'storm' ? 'storm' : 'classic';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    resetField();
    hideOverlay();
    audio.start();
    toast(isStorm() ? '弹幕 · 更密更快' : '经典 · 一发一弹', false, !isStorm());
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
    showOverlay('title', '星袭', '底下开火，打掉整波。', '经典', true);
    btnStorm.textContent = '弹幕';
    btnStorm.classList.remove('hidden');
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
    const lead = (why || '舰毁了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', why === '落地了' ? '落地了' : '舰毁了', lead, '再来', true);
    btnStorm.textContent = '换模式';
    syncHud();
  }

  function damageBunker(x, y, radius) {
    let hit = false;
    const r2 = radius * radius;
    for (let b = 0; b < G.bunkers.length; b++) {
      const bk = G.bunkers[b];
      if (bk.live <= 0) continue;
      if (x < bk.x - 2 || x > bk.x + bunkerW() + 2) continue;
      if (y < bk.y - 2 || y > bk.y + bunkerH() + 2) continue;
      for (let r = 0; r < bk.cells.length; r++) {
        for (let c = 0; c < bk.cells[r].length; c++) {
          if (!bk.cells[r][c]) continue;
          const cx = bk.x + (c + 0.5) * BUNKER_CELL;
          const cy = bk.y + (r + 0.5) * BUNKER_CELL;
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= r2) {
            bk.cells[r][c] = 0;
            bk.live -= 1;
            hit = true;
          }
        }
      }
    }
    return hit;
  }

  function bunkerCoverAt(x) {
    let n = 0;
    for (let b = 0; b < G.bunkers.length; b++) {
      const bk = G.bunkers[b];
      if (bk.live <= 0) continue;
      if (x < bk.x - 1 || x > bk.x + bunkerW() + 1) continue;
      const c = clamp(((x - bk.x) / BUNKER_CELL) | 0, 0, bunkerCols() - 1);
      for (let r = 0; r < bk.cells.length; r++) {
        if (bk.cells[r][c]) n += 1;
        if (c > 0 && bk.cells[r][c - 1]) n += 1;
        if (c + 1 < bunkerCols() && bk.cells[r][c + 1]) n += 1;
      }
    }
    return n;
  }

  function eatBunkers() {
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (!a.alive) continue;
      if (a.y + a.hh < BUNKER_Y - 4) continue;
      if (damageBunker(a.x, a.y + 4, 11)) {
        emit(3, {
          x: a.x, y: a.y + 8, j: 6,
          vx0: -40, vx1: 40, vy0: -20, vy1: 40,
          life: 0.22, r0: 0.8, r1: 1.8, rgb: MINT
        });
      }
    }
  }

  function columnBottom(col) {
    let best = null;
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (!a.alive || a.c !== col) continue;
      if (!best || a.y > best.y) best = a;
    }
    return best;
  }

  function pickShooter() {
    const cols = [];
    for (let c = 0; c < COLS; c++) {
      const a = columnBottom(c);
      if (a) cols.push(a);
    }
    if (!cols.length) return null;
    if (isStorm() && Math.random() < 0.45) {
      let nearest = cols[0];
      let best = 1e9;
      for (let i = 0; i < cols.length; i++) {
        const d = Math.abs(cols[i].x - G.ship.x);
        if (d < best) {
          best = d;
          nearest = cols[i];
        }
      }
      return nearest;
    }
    return cols[(Math.random() * cols.length) | 0];
  }

  function maxBombs() {
    return isStorm() ? 9 : 3;
  }

  function bombSpeed() {
    return (isStorm() ? 248 : 172) + Math.min(40, (G.wave - 1) * 6);
  }

  function tryAlienShot() {
    if (G.bombs.length >= maxBombs()) return;
    const a = pickShooter();
    if (!a) return;
    for (let i = 0; i < G.bombs.length; i++) {
      if (Math.abs(G.bombs[i].x - a.x) < 12 && G.bombs[i].y < a.y + 80) return;
    }
    const aimed = isStorm() && Math.random() < 0.42;
    let vx = 0;
    if (aimed) vx = clamp((G.ship.x - a.x) * 0.35, -70, 70);
    G.bombs.push({
      x: a.x,
      y: a.y + 10,
      vx: vx,
      vy: bombSpeed() * rand(0.92, 1.08),
      kind: Math.random() < 0.5 ? 0 : 1,
      t: 0
    });
  }

  function spawnUfo() {
    if (G.ufo) return;
    if (aliveCount() < 4) return;
    const fromL = Math.random() < 0.5;
    const spd = (isStorm() ? 108 : 86) + Math.min(30, G.wave * 3);
    G.ufo = {
      x: fromL ? -22 : VW + 22,
      y: UFO_Y,
      vx: fromL ? spd : -spd,
      hw: 18,
      hh: 7
    };
    G.ufoBeep = 0;
  }

  function canFire() {
    if (G.deadT > 0) return false;
    if (G.mode !== 'play' && G.mode !== 'title') return false;
    if (G.mode === 'play' && overlayOpen()) return false;
    const cap = isStorm() ? 3 : 1;
    if (G.shots.length >= cap) return false;
    if (G.fireCd > 0) return false;
    return true;
  }

  function fire() {
    if (!canFire()) return false;
    G.shots.push({
      x: G.ship.x,
      y: G.ship.y - 14,
      vy: -SHOT_V,
      trail: []
    });
    G.fireCd = isStorm() ? 0.09 : 0.02;
    G.shotsFired += 1;
    if (G.mode === 'play' || G.mode === 'title') audio.shoot();
    if (G.mode === 'play' && !REDUCE) G.punch = Math.max(G.punch, 1.012);
    emit(5, {
      x: G.ship.x, y: G.ship.y - 12, j: 3,
      vx0: -40, vx1: 40, vy0: -120, vy1: -20,
      life: 0.16, r0: 0.6, r1: 1.6, rgb: CYN, g: 0
    });
    return true;
  }

  function breakCombo() {
    if (G.combo > 0) {
      G.combo = 0;
      G.comboT = 0;
      G.mult = 1;
      if (G.mode === 'play') audio.miss();
    }
  }

  function onAlienKill(a) {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    const pts = a.score * G.mult;
    addScore(pts);
    floatText(a.x, a.y, '+' + pts, G.mult > 1 ? GOLD : a.rgb, G.mult >= 2);
    juice(a.x, a.y, a.rgb, 0.7 + Math.min(0.9, G.combo * 0.08));
    hitStop(clamp(0.034 + G.combo * 0.003, 0.034, 0.062));
    if (G.mode === 'play') audio.hit(a.type, G.combo);
    if (G.mult > prev && G.mult >= 3) {
      audio.combo(G.mult);
      toast(G.mult + ' 倍连击', false, true);
    }
    if (comboEl && G.combo >= 2) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
    }
    a.alive = false;
    a.flash = 0;
  }

  function onUfoKill() {
    const u = G.ufo;
    if (!u) return;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMult();
    const pts = MYSTERY[G.shotsFired & 7] * (G.mult > 1 ? G.mult : 1);
    addScore(pts);
    floatText(u.x, u.y, '+' + pts, GOLD, true);
    juice(u.x, u.y, GOLD, 1.55);
    hitStop(0.075);
    kick(6);
    if (G.mode === 'play') audio.ufoHit();
    toast('神秘飞船 +' + pts, false, true);
    G.ufo = null;
  }

  function killPlayer() {
    if (G.invuln > 0 || G.deadT > 0) return;
    if (G.mode !== 'play') {
      emit(16, {
        x: G.ship.x, y: G.ship.y, j: 8,
        vx0: -160, vx1: 160, vy0: -180, vy1: 40,
        life: 0.4, r0: 1, r1: 3, rgb: CYN
      });
      G.ship.x = VW * 0.5;
      G.invuln = 0.8;
      return;
    }
    juice(G.ship.x, G.ship.y, CYN, 1.35);
    emit(10, {
      x: G.ship.x, y: G.ship.y, j: 10,
      vx0: -200, vx1: 200, vy0: -240, vy1: 80,
      life: 0.5, r0: 1.2, r1: 3.4, rgb: MAG
    });
    audio.death();
    hitStop(0.08);
    kick(6.5);
    screenFlash(MAG, 0.5);
    G.deadT = 0.9;
    G.shots = [];
    breakCombo();
    G.lives -= 1;
    G.fireHold = false;
    syncHud();
  }

  function lowestAlienY() {
    let y = 0;
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (a.alive && a.y + a.hh > y) y = a.y + a.hh;
    }
    return y;
  }

  function aliensLanded() {
    const line = PLAYER_Y - 8;
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (a.alive && a.y + a.hh >= line) return true;
    }
    return false;
  }

  function waveClear() {
    G.wave += 1;
    const bonus = 180 * (G.wave - 1);
    addScore(bonus);
    audio.wave();
    hitStop(0.09);
    screenFlash(GOLD, 0.4);
    kick(4);
    toast('第 ' + G.wave + ' 波 · 加速', false, true);
    floatText(VW * 0.5, 220, '+' + bonus, GOLD, true);
    G.shots = [];
    G.bombs = [];
    G.ufo = null;
    spawnBunkers();
    spawnWave();
    G.invuln = 0.4;
    syncHud();
  }

  function stepAliens() {
    if (G.mode === 'play') audio.march(G.marchNote);
    G.marchNote = (G.marchNote + 1) & 3;
    G.frame ^= 1;
    G.stepPunch = 1;
    if (G.dropPending) {
      for (let i = 0; i < G.aliens.length; i++) {
        if (G.aliens[i].alive) G.aliens[i].y += DROP_Y;
      }
      G.dropPending = false;
      G.dir *= -1;
      eatBunkers();
      return;
    }
    const dx = G.dir * STEP_X;
    let hitEdge = false;
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (!a.alive) continue;
      a.x += dx;
      if (a.x < 18 || a.x > VW - 18) hitEdge = true;
    }
    if (hitEdge) G.dropPending = true;
  }

  function shotHitsAlien(s, a) {
    return Math.abs(s.x - a.x) < a.hw + 2 && s.y < a.y + a.hh + 2 && s.y > a.y - a.hh - 8;
  }

  function moveShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      const dist = Math.abs(s.vy) * dt;
      const n = Math.max(1, Math.ceil(dist / 6));
      const h = dt / n;
      let dead = false;
      for (let k = 0; k < n && !dead; k++) {
        s.y += s.vy * h;
        if (s.y < 18) {
          dead = true;
          breakCombo();
          break;
        }
        if (G.ufo && Math.abs(s.x - G.ufo.x) < G.ufo.hw && Math.abs(s.y - G.ufo.y) < G.ufo.hh + 6) {
          onUfoKill();
          dead = true;
          break;
        }
        let hitA = null;
        for (let j = 0; j < G.aliens.length; j++) {
          const a = G.aliens[j];
          if (!a.alive) continue;
          if (shotHitsAlien(s, a)) {
            if (!hitA || a.y > hitA.y) hitA = a;
          }
        }
        if (hitA) {
          onAlienKill(hitA);
          dead = true;
          break;
        }
        if (damageBunker(s.x, s.y, 5.5)) {
          if (G.mode === 'play') audio.bunker();
          emit(6, {
            x: s.x, y: s.y, j: 4,
            vx0: -50, vx1: 50, vy0: -40, vy1: 30,
            life: 0.22, r0: 0.7, r1: 1.8, rgb: MINT, g: 200
          });
          hitStop(0.018);
          breakCombo();
          dead = true;
          break;
        }
      }
      if (!REDUCE) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 5) s.trail.shift();
      }
      if (dead) G.shots.splice(i, 1);
    }
  }

  function moveBombs(dt) {
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      b.t += dt;
      const dist = hypot(b.vx, b.vy) * dt;
      const n = Math.max(1, Math.ceil(dist / 6));
      const h = dt / n;
      let dead = false;
      for (let k = 0; k < n && !dead; k++) {
        b.x += b.vx * h;
        b.y += b.vy * h;
        if (b.kind === 0) b.x += Math.sin(b.t * 18) * 10 * h;
        if (b.y > VH - 8) {
          dead = true;
          break;
        }
        if (damageBunker(b.x, b.y, 7)) {
          if (G.mode === 'play') audio.bunker();
          emit(7, {
            x: b.x, y: b.y, j: 5,
            vx0: -70, vx1: 70, vy0: -80, vy1: 20,
            life: 0.24, r0: 0.8, r1: 2, rgb: MINT
          });
          hitStop(0.02);
          dead = true;
          break;
        }
        if (G.deadT <= 0 && Math.abs(b.x - G.ship.x) < 13 && b.y > G.ship.y - 11 && b.y < G.ship.y + 9) {
          if (G.invuln <= 0) {
            dead = true;
            killPlayer();
            break;
          }
        }
      }
      if (dead) G.bombs.splice(i, 1);
    }
  }

  function moveUfo(dt) {
    if (!G.ufo) return;
    G.ufo.x += G.ufo.vx * dt;
    if (G.mode === 'play') {
      G.ufoBeep -= dt;
      if (G.ufoBeep <= 0) {
        G.ufoBeep = 0.13;
        audio.ufoTick();
      }
    }
    if (G.ufo.x < -28 || G.ufo.x > VW + 28) G.ufo = null;
  }

  function updatePlayer(dt) {
    if (G.mode === 'title') return;
    const spd = isStorm() ? 340 : 292;
    const acc = 2400;
    if (autoOn && G.mode === 'play') {
      const dx = autoTarget - G.ship.x;
      const max = AUTO_MAX_V[autoSpeed] * dt;
      if (Math.abs(dx) <= max) G.ship.x = autoTarget;
      else G.ship.x += (dx < 0 ? -1 : 1) * max;
      G.ship.vx = 0;
    } else if (keys.l || keys.r) {
      if (keys.l) G.ship.vx -= acc * dt;
      if (keys.r) G.ship.vx += acc * dt;
      G.ship.vx = clamp(G.ship.vx, -spd, spd);
      G.ship.x += G.ship.vx * dt;
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      G.ship.x = lerp(G.ship.x, pointer.x, 1 - Math.exp(-dt * 18));
      G.ship.vx = 0;
    } else {
      G.ship.vx *= Math.exp(-dt * 10);
      G.ship.x += G.ship.vx * dt;
    }
    G.ship.x = clamp(G.ship.x, shipMin(), shipMax());
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
    pointer.down = false;
    G.fireHold = false;
    autoOvWait = 0;
    autoFire = false;
    syncAutoUi();
    if (!autoOn) return;
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
  }

  function autoThink() {
    autoFire = false;
    autoTarget = G.ship.x;
    if (G.mode !== 'play' || G.deadT > 0) return;

    let dangerX = null;
    let dangerT = 1e9;
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.vy <= 8) continue;
      const t = (PLAYER_Y - 6 - b.y) / b.vy;
      if (t < 0 || t > AUTO_DODGE[autoSpeed] + 0.12) continue;
      const bx = b.x + b.vx * t;
      if (Math.abs(bx - G.ship.x) < 22) {
        if (t < dangerT) {
          dangerT = t;
          dangerX = bx;
        }
      }
    }

    if (dangerX != null && dangerT < AUTO_DODGE[autoSpeed]) {
      const goRight = dangerX <= G.ship.x;
      const roomR = shipMax() - G.ship.x;
      const roomL = G.ship.x - shipMin();
      if (goRight && roomR > 18) autoTarget = Math.min(shipMax(), G.ship.x + 86);
      else if (!goRight && roomL > 18) autoTarget = Math.max(shipMin(), G.ship.x - 86);
      else autoTarget = goRight ? Math.max(shipMin(), G.ship.x - 86) : Math.min(shipMax(), G.ship.x + 86);
      if (G.ufo && Math.abs(G.ship.x - G.ufo.x) < AUTO_ALIGN[autoSpeed] + 4) autoFire = true;
      return;
    }

    const align = AUTO_ALIGN[autoSpeed];
    if (G.ufo) {
      const pred = G.ufo.x + G.ufo.vx * 0.22;
      autoTarget = clamp(pred, shipMin(), shipMax());
      autoFire = Math.abs(G.ship.x - pred) < align + 2 && bunkerCoverAt(G.ship.x) < 5;
      return;
    }

    let best = null;
    let bestS = -1e9;
    for (let c = 0; c < COLS; c++) {
      const a = columnBottom(c);
      if (!a) continue;
      let s = a.y * 2.6;
      s -= Math.abs(a.x - G.ship.x) * 0.32;
      const cover = bunkerCoverAt(a.x);
      if (cover > 7) s -= 100;
      else if (cover > 3) s -= 36;
      if (a.y > BUNKER_Y - 40) s += 80;
      if (a.type === 0) s += 12;
      if (s > bestS) {
        bestS = s;
        best = a;
      }
    }
    if (!best) return;
    let aimX = best.x;
    const coverAim = bunkerCoverAt(best.x);
    if (coverAim > 6 && best.y < BUNKER_Y - 12) {
      aimX = best.x + (best.x < VW * 0.5 ? -20 : 20);
    }
    autoTarget = clamp(aimX, shipMin(), shipMax());
    const coverNow = bunkerCoverAt(G.ship.x);
    autoFire = Math.abs(G.ship.x - best.x) < align && (coverNow < 5 || best.y > BUNKER_Y - 10);
  }

  function demoThink(dt) {
    autoFire = false;
    let target = G.ship.x;
    let pick = null;
    let sBest = -1e9;
    for (let i = 0; i < G.aliens.length; i++) {
      const al = G.aliens[i];
      if (!al.alive) continue;
      const s = al.y - Math.abs(al.x - G.ship.x) * 0.2;
      if (s > sBest) {
        sBest = s;
        pick = al;
      }
    }
    if (pick) {
      target = pick.x;
      autoFire = Math.abs(G.ship.x - pick.x) < 12 && bunkerCoverAt(G.ship.x) < 6;
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      const t = (PLAYER_Y - b.y) / Math.max(40, b.vy);
      if (t > 0 && t < 0.45 && Math.abs(b.x - G.ship.x) < 20) {
        target = b.x < G.ship.x ? G.ship.x + 70 : G.ship.x - 70;
        autoFire = false;
      }
    }
    const dx = clamp(target, shipMin(), shipMax()) - G.ship.x;
    const max = 260 * dt;
    if (Math.abs(dx) <= max) G.ship.x += dx;
    else G.ship.x += dx < 0 ? -max : max;
    G.ship.x = clamp(G.ship.x, shipMin(), shipMax());
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

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 9);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 12));
    G.stepPunch = Math.max(0, G.stepPunch - dt * 7);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
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
      moveBombs(dt);
      moveUfo(dt);
      return;
    }

    G.stepT -= dt;
    if (G.stepT <= 0 && aliveCount() > 0 && G.deadT <= 0) {
      stepAliens();
      G.stepT = marchInterval();
    }

    G.bombT -= dt;
    const bombEvery = isStorm() ? 0.28 + aliveCount() * 0.004 : 0.62 + aliveCount() * 0.012;
    if (G.bombT <= 0 && G.deadT <= 0) {
      tryAlienShot();
      G.bombT = bombEvery * rand(0.55, 1.15);
    }

    G.ufoWait -= dt;
    if (G.ufoWait <= 0 && G.deadT <= 0) {
      spawnUfo();
      G.ufoWait = rand(16, 28);
    }

    moveUfo(dt);
    moveShots(dt);
    moveBombs(dt);
    if (lowestAlienY() > BUNKER_Y - 24) eatBunkers();
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
      const oldKind = G.kind;
      G.kind = 'classic';
      playSim(dt);
      G.kind = oldKind;
      if (aliveCount() === 0) spawnWave();
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
      moveBombs(dt);
      moveUfo(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('舰毁了');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.invuln = 1.45;
        G.bombs = [];
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && aliensLanded()) {
      loseRun('落地了');
      updateFx(dt);
      return;
    }
    if (G.mode === 'play' && aliveCount() === 0) {
      waveClear();
    }

    updateFx(dt);
    syncHud();
  }

  function drawSprite(px, py, rows, rgb, cell, alpha) {
    const cols = rows[0].length;
    const w = cols * cell;
    const h = rows.length * cell;
    const x0 = px - w * 0.5;
    const y0 = py - h * 0.5;
    ctx.fillStyle = rgba(rgb, alpha == null ? 1 : alpha);
    for (let r = 0; r < rows.length; r++) {
      const line = rows[r];
      for (let c = 0; c < cols; c++) {
        if (line.charAt(c) !== '#') continue;
        ctx.fillRect(sx(x0 + c * cell), sy(y0 + r * cell), cell * scale + 0.35, cell * scale + 0.35);
      }
    }
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#120818');
    g.addColorStop(0.45, '#080412');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(200), 16 * scale, sx(240), sy(280), 360 * scale);
    vg.addColorStop(0, 'rgba(155, 92, 255, 0.08)');
    vg.addColorStop(0.55, 'rgba(255, 61, 184, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(155, 92, 255, 0.12)';
    ctx.fillRect(sx(10), sy(PLAYER_Y + 14), (VW - 20) * scale, 2 * scale);
  }

  function drawBunkers() {
    const cell = BUNKER_CELL;
    for (let b = 0; b < G.bunkers.length; b++) {
      const bk = G.bunkers[b];
      if (bk.live <= 0) continue;
      for (let r = 0; r < bk.cells.length; r++) {
        for (let c = 0; c < bk.cells[r].length; c++) {
          if (!bk.cells[r][c]) continue;
          const x = bk.x + c * cell;
          const y = bk.y + r * cell;
          ctx.fillStyle = rgba(MINT, 0.82);
          ctx.fillRect(sx(x), sy(y), cell * scale + 0.3, cell * scale + 0.3);
        }
      }
    }
  }

  function drawAliens() {
    const punch = G.stepPunch;
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (!a.alive) continue;
      const frames = SPR[a.type];
      const spr = frames[G.frame & 1];
      const y = a.y + punch * 1.6;
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = rgba(a.rgb, 1);
      ctx.beginPath();
      ctx.arc(sx(a.x), sy(y), 11 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawSprite(a.x, y, spr, a.rgb, 2, 1);
    }
  }

  function drawUfo() {
    if (!G.ufo) return;
    const u = G.ufo;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.ellipse(sx(u.x), sy(u.y), 18 * scale, 8 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawSprite(u.x, u.y, SPR_UFO, GOLD, 2, 1);
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.trail) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx.fillStyle = rgba(CYN, 0.12 + t * 0.08);
          ctx.fillRect(sx(p.x - 1.2), sy(p.y), 2.4 * scale, 8 * scale);
        }
      }
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.5), sy(s.y - 8), 3 * scale, 14 * scale);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.fillRect(sx(s.x - 2.2), sy(s.y - 6), 4.4 * scale, 8 * scale);
    }
    ctx.restore();
  }

  function drawBombs() {
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      const f = ((b.t * 10) | 0) & 1;
      ctx.fillStyle = rgba(MAG, 0.95);
      if (b.kind === 0) {
        ctx.fillRect(sx(b.x - 1.5 + (f ? 2 : -2)), sy(b.y - 6), 3 * scale, 4 * scale);
        ctx.fillRect(sx(b.x - 1.5 + (f ? -2 : 2)), sy(b.y - 2), 3 * scale, 4 * scale);
        ctx.fillRect(sx(b.x - 1.5 + (f ? 2 : -2)), sy(b.y + 2), 3 * scale, 4 * scale);
      } else {
        ctx.fillRect(sx(b.x - 1.2), sy(b.y - 6), 2.4 * scale, 12 * scale);
        ctx.fillRect(sx(b.x - 4), sy(b.y - 1.2 + (f ? 1 : -1)), 8 * scale, 2.4 * scale);
      }
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 14) | 0) % 2 === 0) return;
    const x = G.ship.x;
    const y = G.ship.y;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y + 2), 16 * scale, 8 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawSprite(x, y, SPR_SHIP, CYN, 2, 1);
    const flicker = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 22));
    ctx.fillStyle = rgba(GOLD, 0.35 * flicker);
    ctx.fillRect(sx(x - 3), sy(y + 8), 6 * scale, 4 * scale);
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 0.6 * (1 - k));
      ctx.lineWidth = (2.4 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * 0.4 + k * s.rad) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.34;
      ctx.strokeStyle = rgba(s.rgb, 0.45 * (1 - k));
      ctx.lineWidth = (2 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 22) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawDanger() {
    if (G.mode !== 'play') return;
    const low = lowestAlienY();
    if (low < BUNKER_Y - 8) return;
    const y = PLAYER_Y - 8;
    const a = 0.16 + 0.14 * (0.5 + 0.5 * Math.sin(G.t * 7));
    ctx.save();
    ctx.strokeStyle = rgba(MAG, a);
    ctx.setLineDash([6 * scale, 6 * scale]);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(14), sy(y));
    ctx.lineTo(sx(VW - 14), sy(y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
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
    drawDanger();
    drawBunkers();
    drawAliens();
    drawUfo();
    drawBombs();
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

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const x = (cssX / Math.max(1, rect.width)) * W;
    return (x - ox) / scale;
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
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || space || k === 'Enter')) {
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
    if (autoOn && (k === 'ArrowLeft' || k === 'ArrowRight' || space)) return;
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
      pointer.x = clamp(pointerWorldX(e), shipMin(), shipMax());
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), shipMin(), shipMax());
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

  seedStars();
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
  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('storm');
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
