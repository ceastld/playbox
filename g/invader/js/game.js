'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const PLAYER_Y = 658;
  const GROUND_Y = 692;
  const SHOT_V = 640;
  const COLS = 11;
  const ROWS = 5;
  const CELL_X = 36;
  const CELL_Y = 30;
  const STEP_X = 6;
  const STEP_Y = 16;
  const COMBO_WIN = 1.48;
  const BEST_KEY = 'playbox-invader-best';
  const MUTE_KEY = 'playbox-invader-mute';
  const OPS = '← → / WASD 移动 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 200];
  const GOLD = [255, 227, 107];
  const MINT = [42, 224, 112];
  const TEAL = [18, 196, 90];
  const WHT = [232, 255, 242];
  const HOT = [92, 255, 154];
  const PNK = [255, 140, 200];

  const ROW_TYPE = [2, 1, 1, 0, 0];
  const TYPE_SCORE = [30, 60, 100];
  const TYPE_RGB = [MINT, CYN, MAG];
  const TYPE_HW = [12, 13, 11];
  const TYPE_HH = [8, 8, 8];
  const UFO_TABLE = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 150, 100, 50, 150];
  const BUNKER_LINE = [44, 158, 274, 388];
  const BUNKER_NIGHT = [110, 322];
  const BCW = 24;
  const BCH = 16;
  const BCS = 2;

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
        ' ####### # ',
        '  #     #  ',
        ' #       # '
      ]
    ],
    [
      [
        '   #   #   ',
        '  #######  ',
        ' ######### ',
        '##  ###  ##',
        '###########',
        '  ##   ##  ',
        ' ## ### ## ',
        '##       ##'
      ],
      [
        '   #   #   ',
        '  #######  ',
        ' ######### ',
        '##  ###  ##',
        '###########',
        ' ##     ## ',
        '##  ###  ##',
        '  ##   ##  '
      ]
    ],
    [
      [
        '    ###    ',
        '  #######  ',
        ' ######### ',
        '## ##### ##',
        '###########',
        '  # ### #  ',
        ' #  # #  # ',
        '#         #'
      ],
      [
        '    ###    ',
        '  #######  ',
        ' ######### ',
        '## ##### ##',
        '###########',
        ' #  ###  # ',
        '#  #   #  #',
        '  #     #  '
      ]
    ]
  ];

  const SPR_UFO = [
    '    ######    ',
    '  ##########  ',
    ' ############ ',
    '## ## ## ## ##',
    '##############',
    '  ###    ###  '
  ];

  const SPR_SHIP = [
    '      ##      ',
    '     ####     ',
    '     ####     ',
    ' ############ ',
    '##############',
    '##############'
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnLine = document.getElementById('btn-line');
  const btnNight = document.getElementById('btn-night');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
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
  const chips = [];

  const G = {
    mode: 'title',
    kind: 'line',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: 10000,
    aliens: [],
    bombs: [],
    bunkers: [],
    ship: { x: VW * 0.5, y: PLAYER_Y },
    shot: null,
    ufo: null,
    formDir: 1,
    marchI: 0,
    needDrop: false,
    stepT: 0,
    beat: 0,
    bombCd: 1.2,
    ufoT: 8,
    shotsFired: 0,
    fireHold: false,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    why: '',
    muzzle: 0,
    lastWarn: 0
  };

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
  function isNight() {
    return G.kind === 'night';
  }
  function shipMin() {
    return 18;
  }
  function shipMax() {
    return VW - 18;
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.aliens.length; i++) if (G.aliens[i].alive) n += 1;
    return n;
  }

  function aliveList() {
    const out = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        for (let i = 0; i < G.aliens.length; i++) {
          const e = G.aliens[i];
          if (e.alive && e.row === r && e.col === c) out.push(e);
        }
      }
    }
    return out;
  }

  function marchInterval() {
    const live = Math.max(1, aliveCount());
    const night = isNight();
    const cycleMax = night ? 0.58 : 0.86;
    const cycleMin = night ? 0.036 : 0.048;
    const t = (live - 1) / (COLS * ROWS - 1);
    const wave = Math.max(0.58, 1 - (G.wave - 1) * 0.05);
    return (lerp(cycleMin, cycleMax, t) * wave) / live;
  }

  function bombMax() {
    return isNight() ? 5 : 3;
  }

  function bombSpeed() {
    const w = 1 + Math.min(0.55, (G.wave - 1) * 0.07);
    return (isNight() ? 210 : 160) * w;
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
      this.beep(920, 0.055, 'square', 0.03, 1760);
    },
    hit(type, combo) {
      this.ensure();
      const base = type === 2 ? 880 : type === 1 ? 660 : 490;
      const lift = 1 + Math.min(0.5, combo * 0.035);
      this.noise(0.035, 0.036, 1200);
      this.beep(base * lift, 0.07, 'square', 0.046, base * lift * 1.55);
    },
    ufoHit() {
      this.ensure();
      this.noise(0.08, 0.05, 700);
      this.beep(420, 0.1, 'sawtooth', 0.045, 180);
      this.beep(980, 0.16, 'square', 0.04, 1480);
    },
    ufoHum() {
      this.ensure();
      this.beep(180, 0.09, 'sawtooth', 0.018, 260);
      this.beep(320, 0.08, 'sine', 0.016, 140);
    },
    chip() {
      this.ensure();
      this.noise(0.03, 0.028, 1800);
      this.beep(240, 0.04, 'square', 0.02, 90);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.044, 70);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.036, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.026, 1320);
    },
    march(beat) {
      this.ensure();
      const notes = [98, 87, 82, 73];
      this.beep(notes[beat & 3], 0.09, 'square', 0.034, 0);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.052, 380);
      this.beep(300, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.044, 48);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.038, 523);
      this.beep(523, 0.11, 'sine', 0.038, 659);
      this.beep(784, 0.2, 'triangle', 0.042, 1046);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.036, 440);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    saucer() {
      this.ensure();
      this.beep(240, 0.12, 'sawtooth', 0.03, 420);
      this.beep(520, 0.16, 'sine', 0.028, 180);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      const n = parseInt(raw, 10);
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

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    saveBest();
    while (G.score >= G.next1up) {
      G.next1up += 10000;
      if (G.lives < 6) {
        G.lives += 1;
        audio.extra();
        toast('1UP', false, true);
      }
    }
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      scoreAdd.style.animation = 'none';
      void scoreAdd.offsetWidth;
      scoreAdd.style.animation = '';
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    G.toastT = 1.15;
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1150);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const s = document.createElement('span');
      s.className = 'pip';
      pipsEl.appendChild(s);
      pips.push(s);
    }
    for (let i = 0; i < pips.length; i++) {
      if (i >= n) {
        pips[i].style.display = 'none';
        continue;
      }
      pips[i].style.display = '';
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.wave >= 5);
    }
    if (tagLabel) {
      const live = aliveCount();
      let tag = isNight() ? '夜袭' : '防线';
      let cls = isNight() ? 'warn' : '';
      if (G.mode === 'play' && live > 0 && live <= 5) {
        tag = live === 1 ? '最后' : '加速';
        cls = 'warn';
      }
      if (G.ufo && G.mode === 'play') {
        tag = '飞碟';
        cls = 'hot';
      }
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', cls === 'warn');
      tagLabel.classList.toggle('hot', cls === 'hot');
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.combo + ' 连 ×' + G.mult;
        comboEl.classList.add('combo');
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint('← → 移动 · 空格开火 · 一发在空 · 守住防线', '');
    else if (G.mode === 'lose') setHint('R 重开 · 顶栏随时可用', 'warn');
    else if (isNight()) setHint('夜袭 · 更快更密 · 两座掩体', 'warn');
    else setHint('← → 移动 · 空格开火 · 打飞碟拿高分', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'INV';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnLine) btnLine.textContent = primary;
    if (btnNight) {
      btnNight.textContent = secondary;
      btnNight.classList.remove('hidden');
    }
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
    const cls = mag >= 6 ? 'die' : mag >= 4 ? 'cap' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('cap');
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

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 220,
        life: rand(0.22, 0.52),
        max: 0.52,
        r: rand(1.2, 2.8),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 160);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 24);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 12);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.72, vy: -48, text: text, rgb: rgb });
    capArr(floats, 16);
  }

  function chipBurst(x, y, n) {
    const count = REDUCE ? Math.min(4, n) : n;
    for (let i = 0; i < count; i++) {
      chips.push({
        x: x + rand(-3, 3),
        y: y + rand(-2, 2),
        vx: rand(-70, 70),
        vy: rand(-90, -20),
        life: rand(0.28, 0.55),
        max: 0.55,
        rgb: Math.random() < 0.3 ? TEAL : MINT,
        s: rand(1.4, 2.6)
      });
    }
    capArr(chips, 80);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.7 : 1.3,
        a: rand(0.22, 0.88),
        p: rand(0, TAU),
        v: rand(6, 32),
        rgb: Math.random() < 0.2 ? MINT : Math.random() < 0.12 ? MAG : WHT
      });
    }
  }

  function bunkerMask() {
    const g = [];
    for (let y = 0; y < BCH; y++) {
      g[y] = [];
      for (let x = 0; x < BCW; x++) {
        let on = true;
        if (y === 0 && (x < 3 || x > 20)) on = false;
        if (y === 1 && (x < 2 || x > 21)) on = false;
        if (y === 2 && (x < 1 || x > 22)) on = false;
        if (y >= 10) {
          const archL = 7 - (y - 10);
          const archR = 16 + (y - 10);
          if (x >= archL && x <= archR) on = false;
        }
        g[y][x] = on ? 1 : 0;
      }
    }
    return g;
  }

  function makeBunker(x, y) {
    const cells = bunkerMask();
    let n = 0;
    for (let r = 0; r < BCH; r++) for (let c = 0; c < BCW; c++) if (cells[r][c]) n += 1;
    return {
      x: x,
      y: y,
      w: BCW * BCS,
      h: BCH * BCS,
      cells: cells,
      left: n
    };
  }

  function spawnBunkers() {
    G.bunkers = [];
    const xs = isNight() ? BUNKER_NIGHT : BUNKER_LINE;
    for (let i = 0; i < xs.length; i++) G.bunkers.push(makeBunker(xs[i], 572));
  }

  function chipBunker(b, cx, cy, rad) {
    if (b.left <= 0) return 0;
    let n = 0;
    const r2 = rad * rad + 0.35;
    for (let y = cy - rad - 1; y <= cy + rad + 1; y++) {
      for (let x = cx - rad - 1; x <= cx + rad + 1; x++) {
        if (x < 0 || y < 0 || x >= BCW || y >= BCH) continue;
        if (!b.cells[y][x]) continue;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > r2) continue;
        b.cells[y][x] = 0;
        b.left -= 1;
        n += 1;
        if (n < 8) chipBurst(b.x + (x + 0.5) * BCS, b.y + (y + 0.5) * BCS, 1);
      }
    }
    return n;
  }

  function hitBunkerAt(px, py, rad, fromShot) {
    for (let i = 0; i < G.bunkers.length; i++) {
      const b = G.bunkers[i];
      if (b.left <= 0) continue;
      if (px < b.x - 2 || py < b.y - 2 || px > b.x + b.w + 2 || py > b.y + b.h + 2) continue;
      const cx = Math.floor((px - b.x) / BCS);
      const cy = Math.floor((py - b.y) / BCS);
      if (cx < -2 || cy < -2 || cx >= BCW + 2 || cy >= BCH + 2) continue;
      const n = chipBunker(b, cx, cy, rad);
      if (n > 0) {
        audio.chip();
        if (fromShot) hitStop(0.018);
        kick(1);
        return true;
      }
    }
    return false;
  }

  function bunkerBlocks(px, py) {
    for (let i = 0; i < G.bunkers.length; i++) {
      const b = G.bunkers[i];
      if (b.left <= 0) continue;
      if (px < b.x || py < b.y || px >= b.x + b.w || py >= b.y + b.h) continue;
      const cx = (px - b.x) / BCS | 0;
      const cy = (py - b.y) / BCS | 0;
      if (cx < 0 || cy < 0 || cx >= BCW || cy >= BCH) continue;
      if (b.cells[cy][cx]) return b;
    }
    return null;
  }

  function chewBunker(e) {
    const b = bunkerBlocks(e.x, e.y + e.hh);
    if (!b) {
      const b2 = bunkerBlocks(e.x - e.hw, e.y + e.hh);
      const b3 = bunkerBlocks(e.x + e.hw, e.y + e.hh);
      if (!b2 && !b3) return;
    }
    hitBunkerAt(e.x, e.y + e.hh - 2, 2, false);
    hitBunkerAt(e.x - 6, e.y + e.hh - 2, 1, false);
    hitBunkerAt(e.x + 6, e.y + e.hh - 2, 1, false);
  }

  function spawnWave() {
    G.aliens = [];
    const baseY = isNight()
      ? 112 + Math.min(78, (G.wave - 1) * 12)
      : 96 + Math.min(70, (G.wave - 1) * 10);
    const ox0 = 42;
    for (let r = 0; r < ROWS; r++) {
      const type = ROW_TYPE[r];
      for (let c = 0; c < COLS; c++) {
        G.aliens.push({
          col: c,
          row: r,
          type: type,
          x: ox0 + c * CELL_X,
          y: baseY + r * CELL_Y,
          hw: TYPE_HW[type],
          hh: TYPE_HH[type],
          alive: true,
          frame: 0
        });
      }
    }
    G.formDir = 1;
    G.marchI = 0;
    G.needDrop = false;
    G.stepT = 0.08;
    G.beat = 0;
    G.bombs = [];
    G.shot = null;
    G.ufo = null;
    G.bombCd = isNight() ? 0.55 : 0.9;
    G.ufoT = isNight() ? rand(7, 13) : rand(10, 18);
    spawnBunkers();
  }

  function resetField() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    chips.length = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = PLAYER_Y;
    G.shot = null;
    G.ufo = null;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.shotsFired = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.fireHold = false;
    G.lastWarn = 0;
    spawnWave();
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(next);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    } else {
      G.mult = next;
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function killAlien(e, scored) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = TYPE_RGB[e.type];
    burst(e.x, e.y, rgb, 14 + e.type * 4, 180 + e.type * 30);
    spark(e.x, e.y, rgb);
    ring(e.x, e.y, rgb);
    audio.hit(e.type, G.combo);
    const live = aliveCount();
    hitStop(live === 0 ? 0.07 : 0.038 + Math.min(0.028, G.combo * 0.004));
    kick(live === 0 ? 4 : 2 + (e.type === 2 ? 1 : 0));
    if (scored) {
      const pts = Math.round(TYPE_SCORE[e.type] * G.mult);
      addScore(pts);
      floatText(e.x, e.y - 10, String(pts), rgb);
      bumpCombo();
      if (live === 1 && G.lastWarn < 2) {
        G.lastWarn = 2;
        toast('最后一只', true, false);
      } else if (live <= 5 && G.lastWarn < 1) {
        G.lastWarn = 1;
        toast('加速', true, false);
      }
    }
  }

  function fire() {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    if (G.shot) return;
    G.shot = { x: G.ship.x, y: PLAYER_Y - 16, vy: -SHOT_V };
    G.shotsFired += 1;
    G.muzzle = 0.09;
    audio.shoot();
    if (!REDUCE) {
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: G.ship.x + rand(-3, 3),
          y: PLAYER_Y - 14,
          vx: rand(-20, 20),
          vy: rand(-80, -20),
          g: 40,
          life: 0.16,
          max: 0.16,
          r: 1.4,
          rgb: i % 2 ? CYN : WHT
        });
      }
    }
  }

  function spawnUFO() {
    const fromL = Math.random() < 0.5;
    G.ufo = {
      x: fromL ? -28 : VW + 28,
      y: 52,
      vx: (fromL ? 1 : -1) * (isNight() ? 118 : 92),
      hw: 16,
      hh: 6,
      hum: 0
    };
    audio.saucer();
    toast('飞碟', false, true);
  }

  function killUFO() {
    if (!G.ufo) return;
    const pts = Math.round(UFO_TABLE[G.shotsFired % UFO_TABLE.length] * G.mult);
    const x = G.ufo.x;
    const y = G.ufo.y;
    G.ufo = null;
    burst(x, y, MAG, 22, 240);
    burst(x, y, GOLD, 10, 160);
    spark(x, y, GOLD);
    ring(x, y, MAG);
    audio.ufoHit();
    hitStop(0.078);
    kick(5);
    screenFlash(MAG, 0.32);
    if (G.mode === 'play') {
      addScore(pts);
      floatText(x, y - 8, String(pts), GOLD);
      bumpCombo();
    }
  }

  function killPlayer(why) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0 || G.invuln > 0) return;
    G.why = why || '舰毁了';
    G.lives -= 1;
    G.deadT = 0.95;
    G.shot = null;
    G.fireHold = false;
    breakCombo();
    burst(G.ship.x, G.ship.y, CYN, 22, 260);
    burst(G.ship.x, G.ship.y, MAG, 10, 180);
    spark(G.ship.x, G.ship.y, WHT);
    ring(G.ship.x, G.ship.y, MAG);
    audio.death();
    hitStop(0.072);
    kick(7);
    screenFlash(MAG, 0.48);
  }

  function dropBomb() {
    if (G.bombs.length >= bombMax()) return;
    const cols = [];
    for (let c = 0; c < COLS; c++) {
      let best = null;
      for (let i = 0; i < G.aliens.length; i++) {
        const e = G.aliens[i];
        if (!e.alive || e.col !== c) continue;
        if (!best || e.row > best.row) best = e;
      }
      if (best) cols.push(best);
    }
    if (!cols.length) return;
    let shooter = cols[(Math.random() * cols.length) | 0];
    if (Math.random() < 0.62) {
      let near = shooter;
      let bestD = 1e9;
      for (let i = 0; i < cols.length; i++) {
        const d = Math.abs(cols[i].x - G.ship.x);
        if (d < bestD) {
          bestD = d;
          near = cols[i];
        }
      }
      shooter = near;
    }
    const zig = Math.random() < (isNight() ? 0.55 : 0.35);
    G.bombs.push({
      x: shooter.x,
      y: shooter.y + shooter.hh + 2,
      vy: bombSpeed() * (zig ? 0.92 : 1.08),
      zig: zig,
      phase: rand(0, TAU),
      hw: 2.2,
      hh: 5
    });
  }

  function stepMarch() {
    const live = aliveList();
    if (!live.length) return;
    if (G.marchI >= live.length) G.marchI = 0;
    const e = live[G.marchI];
    e.x += G.formDir * STEP_X;
    e.frame ^= 1;
    if (e.x < 16 || e.x > VW - 16) G.needDrop = true;
    chewBunker(e);
    G.marchI += 1;
    if (G.marchI >= live.length) {
      G.marchI = 0;
      if (G.mode === 'play' || G.mode === 'title') audio.march(G.beat);
      G.beat = (G.beat + 1) & 3;
      if (G.needDrop) {
        G.formDir *= -1;
        for (let i = 0; i < live.length; i++) {
          live[i].y += STEP_Y;
          chewBunker(live[i]);
        }
        G.needDrop = false;
      }
    }
  }

  function updatePlayer(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.deadT > 0) return;
    let vx = 0;
    if (keys.l) vx -= 1;
    if (keys.r) vx += 1;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.ship.x;
      if (Math.abs(dx) > 2) G.ship.x += clamp(dx, -300 * dt, 300 * dt);
    } else {
      G.ship.x += vx * 300 * dt;
    }
    G.ship.x = clamp(G.ship.x, shipMin(), shipMax());
  }

  function updateShot(dt) {
    const s = G.shot;
    if (!s) return;
    const prev = s.y;
    s.y += s.vy * dt;
    if (s.y < 6) {
      G.shot = null;
      breakCombo();
      return;
    }
    const x = s.x;
    const y1 = s.y;
    const y0 = prev;
    if (G.ufo) {
      const u = G.ufo;
      if (x > u.x - u.hw && x < u.x + u.hw && y1 < u.y + u.hh && prev > u.y - u.hh) {
        G.shot = null;
        killUFO();
        return;
      }
    }
    for (let i = 0; i < G.aliens.length; i++) {
      const e = G.aliens[i];
      if (!e.alive) continue;
      if (x < e.x - e.hw - 1 || x > e.x + e.hw + 1) continue;
      if (y1 > e.y + e.hh + 2 || prev < e.y - e.hh - 2) continue;
      G.shot = null;
      killAlien(e, true);
      return;
    }
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      if (Math.abs(x - b.x) < 6 && y1 < b.y + 8 && prev > b.y - 8) {
        G.bombs.splice(i, 1);
        G.shot = null;
        burst(b.x, b.y, PNK, 8, 140);
        spark(b.x, b.y, MAG);
        audio.chip();
        hitStop(0.028);
        if (G.mode === 'play') {
          addScore(Math.round(10 * G.mult));
          bumpCombo();
        }
        return;
      }
    }
    const steps = 4;
    for (let k = 0; k <= steps; k++) {
      const yy = lerp(y0, y1, k / steps);
      if (hitBunkerAt(x, yy, 1, true)) {
        G.shot = null;
        breakCombo();
        return;
      }
    }
  }

  function updateBombs(dt) {
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      if (b.zig) {
        b.phase += dt * 10;
        b.x += Math.sin(b.phase) * 42 * dt;
      }
      b.y += b.vy * dt;
      if (b.y > GROUND_Y + 8) {
        G.bombs.splice(i, 1);
        continue;
      }
      if (hitBunkerAt(b.x, b.y, 2, false)) {
        burst(b.x, b.y, TEAL, 6, 90);
        G.bombs.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (Math.abs(b.x - G.ship.x) < 14 && b.y > PLAYER_Y - 10 && b.y < PLAYER_Y + 14) {
          G.bombs.splice(i, 1);
          killPlayer('被击中');
          continue;
        }
      }
    }
  }

  function updateUFO(dt) {
    if (!G.ufo) return;
    const u = G.ufo;
    u.x += u.vx * dt;
    u.hum -= dt;
    if (u.hum <= 0) {
      u.hum = 0.18;
      if (G.mode === 'play') audio.ufoHum();
    }
    if (u.x < -40 || u.x > VW + 40) G.ufo = null;
  }

  function updateAliens(dt) {
    if (G.ready > 0) return;
    if (G.deadT > 0) return;
    G.stepT -= dt;
    let guard = 0;
    while (G.stepT <= 0 && guard < 8) {
      stepMarch();
      G.stepT += marchInterval();
      guard += 1;
    }
    if (G.mode !== 'play' || G.deadT > 0) return;
    for (let i = 0; i < G.aliens.length; i++) {
      const e = G.aliens[i];
      if (!e.alive) continue;
      if (e.y + e.hh >= GROUND_Y) {
        burst(e.x, e.y, TYPE_RGB[e.type], 16, 200);
        e.alive = false;
        killPlayer('星尘落地');
        return;
      }
      if (G.invuln <= 0 && Math.abs(e.x - G.ship.x) < e.hw + 12 && e.y + e.hh > PLAYER_Y - 10 && e.y - e.hh < PLAYER_Y + 12) {
        killAlien(e, false);
        killPlayer('撞击');
        return;
      }
    }
    G.bombCd -= dt;
    const live = aliveCount();
    const rate = (isNight() ? 0.42 : 0.7) * Math.max(0.35, live / (COLS * ROWS));
    const waveCut = Math.max(0.45, 1 - (G.wave - 1) * 0.06);
    if (G.bombCd <= 0) {
      dropBomb();
      G.bombCd = (rate * waveCut) * rand(0.55, 1.15);
    }
    G.ufoT -= dt;
    if (G.ufoT <= 0 && !G.ufo && live > 0) {
      spawnUFO();
      G.ufoT = isNight() ? rand(8, 14) : rand(12, 20);
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.001, dt));
    G.toastT = Math.max(0, G.toastT - dt);
    G.comboT -= dt;
    if (G.comboT <= 0 && G.combo > 0) breakCombo();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = chips.length - 1; i >= 0; i--) {
      const c = chips[i];
      c.life -= dt;
      c.vy += 420 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.life <= 0) chips.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.v * dt * 0.15;
      if (s.y > VH) {
        s.y = 0;
        s.x = Math.random() * VW;
      }
    }
  }

  function waveClear() {
    if (G.mode !== 'play') return;
    const bonus = 250 * G.wave;
    addScore(bonus);
    floatText(VW * 0.5, 220, '+' + bonus, GOLD);
    audio.wave();
    screenFlash(GOLD, 0.28);
    kick(3);
    toast('第 ' + G.wave + ' 波肃清', false, true);
    G.wave += 1;
    G.ready = 1.05;
    G.lastWarn = 0;
    spawnWave();
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
    const lead = (why || '防线失守') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '防线失守', lead, '再来', '换模式');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'night' ? 'night' : 'line';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.next1up = 10000;
    G.why = '';
    G.clock = 0;
    resetField();
    G.ready = 0.65;
    hideOverlay();
    audio.start();
    toast(isNight() ? '夜袭 · 更快更密' : '防线 · 四座掩体', isNight(), !isNight());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'line';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    resetField();
    G.ready = 0;
    showOverlay('title', '侵星', '五行外星人横队推进。一发在空。四座掩体可被啃穿。飞碟定时掠过。', '防线', '夜袭');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('line');
    else startGame(G.kind || 'line');
  }

  function playSim(dt) {
    updatePlayer(dt);
    if ((G.fireHold || pointer.down) && G.mode === 'play') fire();
    if (G.ready > 0) {
      G.ready -= dt;
      updateShot(dt);
      updateBombs(dt);
      updateUFO(dt);
      return;
    }
    updateAliens(dt);
    updateShot(dt);
    updateBombs(dt);
    updateUFO(dt);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      playSim(dt);
      let lowest = 0;
      for (let i = 0; i < G.aliens.length; i++) {
        if (G.aliens[i].alive && G.aliens[i].y > lowest) lowest = G.aliens[i].y;
      }
      if (aliveCount() === 0 || lowest > 500) spawnWave();
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose') {
      updateFx(dt);
      G.stepT -= dt * 0.4;
      if (G.stepT <= 0) {
        stepMarch();
        G.stepT += marchInterval();
      }
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateBombs(dt);
      updateUFO(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '防线失守');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.invuln = 1.45;
        G.bombs = [];
        G.shot = null;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && aliveCount() === 0) waveClear();

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
    g.addColorStop(0, isNight() ? '#061018' : '#062416');
    g.addColorStop(0.45, isNight() ? '#041014' : '#03140a');
    g.addColorStop(1, '#020c07');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(160), 16 * scale, sx(240), sy(280), 360 * scale);
    vg.addColorStop(0, isNight() ? 'rgba(255, 61, 184, 0.07)' : 'rgba(42, 224, 112, 0.08)');
    vg.addColorStop(0.55, 'rgba(0, 240, 200, 0.03)');
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

    ctx.fillStyle = rgba(MINT, 0.16);
    ctx.fillRect(sx(10), sy(GROUND_Y), (VW - 20) * scale, 2 * scale);
    ctx.fillStyle = rgba(TEAL, 0.12);
    ctx.fillRect(sx(10), sy(GROUND_Y + 3), (VW - 20) * scale, 8 * scale);
  }

  function drawAliens() {
    for (let i = 0; i < G.aliens.length; i++) {
      const e = G.aliens[i];
      if (!e.alive) continue;
      const frames = SPR[e.type];
      const spr = frames[e.frame & 1];
      const rgb = TYPE_RGB[e.type];
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), (9 + e.type) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawSprite(e.x, e.y, spr, rgb, 2, 1);
    }
  }

  function drawUFO() {
    if (!G.ufo) return;
    const u = G.ufo;
    const pulse = 0.7 + 0.3 * Math.sin(G.t * 12);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(MAG, 0.16 * pulse);
    ctx.beginPath();
    ctx.arc(sx(u.x), sy(u.y), 18 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawSprite(u.x, u.y, SPR_UFO, MAG, 2, 1);
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(sx(u.x - 3), sy(u.y - 1), 6 * scale, 2 * scale);
  }

  function drawBunkers() {
    for (let i = 0; i < G.bunkers.length; i++) {
      const b = G.bunkers[i];
      if (b.left <= 0) continue;
      for (let y = 0; y < BCH; y++) {
        for (let x = 0; x < BCW; x++) {
          if (!b.cells[y][x]) continue;
          const rgb = ((x + y) & 1) ? TEAL : MINT;
          ctx.fillStyle = rgba(rgb, 0.92);
          ctx.fillRect(
            sx(b.x + x * BCS),
            sy(b.y + y * BCS),
            BCS * scale + 0.4,
            BCS * scale + 0.4
          );
        }
      }
    }
  }

  function drawShots() {
    if (G.shot) {
      const s = G.shot;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (!REDUCE) {
        ctx.strokeStyle = rgba(CYN, 0.35);
        ctx.lineWidth = 2.2 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(s.x), sy(s.y + 16));
        ctx.lineTo(sx(s.x), sy(s.y));
        ctx.stroke();
      }
      ctx.fillStyle = rgba(WHT, 1);
      ctx.fillRect(sx(s.x - 1.2), sy(s.y - 7), 2.4 * scale, 12 * scale);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(sx(s.x - 2), sy(s.y - 3), 4 * scale, 5 * scale);
      ctx.restore();
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(MAG, 0.28);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), 5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(PNK, 1);
      if (b.zig) {
        ctx.beginPath();
        ctx.moveTo(sx(b.x), sy(b.y - 6));
        ctx.lineTo(sx(b.x + 3), sy(b.y - 1));
        ctx.lineTo(sx(b.x - 3), sy(b.y + 3));
        ctx.lineTo(sx(b.x), sy(b.y + 7));
        ctx.strokeStyle = rgba(GOLD, 0.9);
        ctx.lineWidth = 1.6 * scale;
        ctx.stroke();
      } else {
        ctx.fillRect(sx(b.x - 1.3), sy(b.y - 6), 2.6 * scale, 12 * scale);
      }
      ctx.restore();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 14) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y + 2), 14 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawSprite(x, y, SPR_SHIP, CYN, 2, 1);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(sx(x - 1.4), sy(y - 10), 2.8 * scale, 6 * scale);
    if (G.muzzle > 0) {
      const a = G.muzzle / 0.09;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, 0.7 * a);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y - 14), (5 + (1 - a) * 6) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i];
      const a = Math.max(0, c.life / c.max);
      ctx.fillStyle = rgba(c.rgb, a);
      ctx.fillRect(sx(c.x), sy(c.y), c.s * scale, c.s * scale);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (6 + s.t * 40) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.36;
      ctx.strokeStyle = rgba(r.rgb, a * 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#03140a';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#03140a';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawUFO();
    drawAliens();
    drawBunkers();
    drawShots();
    drawShip();
    drawFx();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const r = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerWorldX(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    return (x - ox) / scale;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('line');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 'W' || k === 's' || k === 'S' || space) {
      if (down) e.preventDefault();
    }
    if (!down) {
      if (space || k === 'w' || k === 'W' || k === 'ArrowUp') G.fireHold = false;
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
    if (G.mode === 'title' && (k === '1' || k === 'Digit1')) {
      startGame('line');
      return;
    }
    if (G.mode === 'title' && (k === '2' || k === 'Digit2')) {
      startGame('night');
      return;
    }
    if (space || k === 'Enter' || k === 'w' || k === 'W' || k === 'ArrowUp') {
      if (overlayOpen()) {
        if (k === 'Enter' || space) primaryAction();
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

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnLine) {
    btnLine.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('line');
    });
  }
  if (btnNight) {
    btnNight.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('night');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
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
