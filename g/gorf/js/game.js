'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const PLAYER_Y = 668;
  const SHOT_V = 640;
  const COMBO_WIN = 1.48;
  const BEST_KEY = 'playbox-gorf-best';
  const MUTE_KEY = 'playbox-gorf-mute';
  const OPS = '← → / WASD 移动 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [124, 92, 255];
  const WHT = [240, 236, 255];
  const HOT = [200, 180, 255];
  const ORG = [255, 140, 64];
  const MINT = [80, 240, 210];
  const PNK = [255, 140, 200];

  const MISSIONS = [
    { id: 'astro', name: '星战', en: 'ASTRO', hint: '横队推进 · 清掉再进下一关' },
    { id: 'laser', name: '激光', en: 'LASER', hint: '打掉炮台，躲开竖光束' },
    { id: 'galax', name: '俯冲', en: 'GALAX', hint: '编队俯冲 · 空中的更值钱' },
    { id: 'warp', name: '星门', en: 'WARP', hint: '螺旋涌出 · 别被卷到' },
    { id: 'flag', name: '旗舰', en: 'FLAG', hint: '船体挡弹 · 打发光核心通关' }
  ];

  const TYPE_RGB = [GOLD, CYN, MAG];
  const TYPE_HW = [12, 13, 14];
  const TYPE_HH = [8, 8, 9];
  const ASTRO_SCORE = [30, 60, 100];
  const GAL_FORM = [50, 80, 160];
  const GAL_DIVE = [100, 160, 320];

  const COLS = 8;
  const ROWS = 4;
  const CELL_X = 44;
  const CELL_Y = 32;
  const FORM_X = 72;
  const FORM_Y = 118;
  const WARP_X = 240;
  const WARP_Y = 196;

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
        '# ##   ## #',
        '  #     #  '
      ]
    ],
    [
      [
        '   ## ##   ',
        '  ######## ',
        ' ### ## ###',
        '###########',
        '  #######  ',
        ' #  ###  # ',
        '# #     # #',
        '  #     #  '
      ],
      [
        '   ## ##   ',
        '  ######## ',
        ' ### ## ###',
        '###########',
        '  #######  ',
        ' #  ###  # ',
        '  #     #  ',
        ' #       # '
      ]
    ]
  ];

  const SPR_SHIP = [
    '     ##     ',
    '    ####    ',
    ' ## ###### #',
    '############',
    '  ## ## ##  ',
    ' ##  ##  ## '
  ];

  const SPR_CANNON = [
    '    ####    ',
    '  ## ## ##  ',
    ' ########## ',
    '############',
    ' ## #### ## ',
    '##   ##   ##'
  ];

  const SPR_WARP = [
    [
      '   #  #   ',
      ' # ###### ',
      '##########',
      ' ## ## ## ',
      '  ######  ',
      ' #  ##  # '
    ],
    [
      '  #    #  ',
      '  ######  ',
      '##########',
      ' ## ## ## ',
      '##########',
      '  # ## #  '
    ]
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnCamp = document.getElementById('btn-camp');
  const btnEnd = document.getElementById('btn-end');
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

  const G = {
    mode: 'title',
    kind: 'camp',
    t: 0,
    clock: 0,
    mission: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: 20000,
    enemies: [],
    shots: [],
    bombs: [],
    lasers: [],
    ship: { x: VW * 0.5, y: PLAYER_Y, vx: 0 },
    boss: null,
    formOx: 0,
    formDir: 1,
    formY: 0,
    formed: false,
    diveCd: 1.4,
    fireCd: 0,
    fireHold: false,
    bombCd: 0.8,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: PUR,
    punch: 1,
    toastT: 0,
    why: '',
    frame: 0,
    flapT: 0,
    muzzle: 0,
    warpLeft: 0,
    warpCd: 0,
    warpPulse: 0,
    guardCd: 0,
    pendingWin: false,
    clearT: 0
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function isCamp() {
    return G.kind !== 'flag';
  }
  function haste() {
    return isCamp() ? 1 : 1.24;
  }
  function shipMin() {
    return 18;
  }
  function shipMax() {
    return VW - 18;
  }
  function missionMeta() {
    return MISSIONS[G.mission] || MISSIONS[0];
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
      this.beep(880, 0.055, 'square', 0.032, 1680);
    },
    hit(type, combo) {
      this.ensure();
      const base = type === 2 ? 980 : type === 1 ? 720 : 540;
      const lift = 1 + Math.min(0.45, combo * 0.03);
      this.noise(0.035, 0.034, 1100);
      this.beep(base * lift, 0.07, 'square', 0.046, base * lift * 1.5);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 500);
      this.beep(280, 0.14, 'sawtooth', 0.045, 70);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
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
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.05, 'sine', 0.018, 80);
    },
    chip() {
      this.ensure();
      this.beep(240, 0.05, 'sawtooth', 0.028, 180);
      this.beep(620, 0.06, 'square', 0.022, 880);
    },
    laserCharge() {
      this.ensure();
      this.beep(180, 0.22, 'sawtooth', 0.03, 420);
    },
    laserFire() {
      this.ensure();
      this.noise(0.12, 0.048, 700);
      this.beep(90, 0.2, 'sawtooth', 0.05, 40);
      this.beep(1400, 0.08, 'square', 0.03, 400);
    },
    warpSting() {
      this.ensure();
      this.beep(220, 0.12, 'sawtooth', 0.042, 880);
      this.beep(880, 0.1, 'square', 0.03, 220);
      this.noise(0.08, 0.04, 600);
    },
    coreHit() {
      this.ensure();
      this.beep(180, 0.07, 'sawtooth', 0.04, 90);
      this.beep(980, 0.09, 'square', 0.04, 1480);
      this.noise(0.05, 0.04, 800);
    },
    coreKill() {
      this.ensure();
      this.noise(0.22, 0.06, 300);
      this.beep(140, 0.28, 'sawtooth', 0.055, 40);
      this.beep(880, 0.16, 'triangle', 0.04, 220);
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

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.next1up && G.lives < 6) {
      G.lives += 1;
      G.next1up += 20000;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
    comboTok += 1;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.15;
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
    const n = 6;
    while (pips.length < n) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const m = missionMeta();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '戈夫';
      else stageLabel.textContent = (isCamp() ? '远征' : '旗舰') + ' · ' + m.name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.mission >= 3);
    }
    if (tagLabel) {
      let tag = m.en;
      if (G.mode === 'title') tag = 'GORF';
      if (G.mission === 4 && G.boss && G.boss.alive) tag = '核 ' + G.boss.coreHp;
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8 || (G.mission === 4 && G.mode === 'play'));
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
    else if (G.mode === 'lose') setHint('R 重开 · 中弹或相撞扣命', 'warn');
    else if (G.mode === 'win') setHint('核心击破 · R 再来 · 空格开火', 'hot');
    else if (G.lives === 1) setHint('最后一命 · ' + m.hint, 'warn');
    else setHint(m.hint, G.mission === 4 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GORF';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnCamp) btnCamp.textContent = primary;
    if (btnEnd) {
      btnEnd.textContent = secondary;
      btnEnd.classList.remove('hidden');
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

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const name = cls || (mag >= 6 ? 'die' : mag >= 3 ? 'warp' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('warp');
    void stageEl.offsetWidth;
    stageEl.classList.add(name);
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
        g: 240,
        life: rand(0.22, 0.5),
        max: 0.5,
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
    capArr(rings, 14);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.7, vy: -46, text: text, rgb: rgb });
    capArr(floats, 16);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.7 : 1.3,
        a: rand(0.25, 0.9),
        p: rand(0, TAU),
        v: rand(8, 42),
        rgb: Math.random() < 0.22 ? PUR : Math.random() < 0.14 ? MAG : WHT
      });
    }
  }

  function makeEnemy(spec) {
    const e = {
      kind: spec.kind,
      type: spec.type || 0,
      col: spec.col || 0,
      row: spec.row || 0,
      hp: spec.hp == null ? 1 : spec.hp,
      maxHp: spec.hp == null ? 1 : spec.hp,
      x: spec.x || 0,
      y: spec.y || 0,
      homeX: spec.homeX || spec.x || 0,
      homeY: spec.homeY || spec.y || 0,
      vx: 0,
      vy: 0,
      state: spec.state || 'form',
      delay: spec.delay || 0,
      wps: spec.wps || [],
      wpI: 0,
      alive: true,
      hitFlash: 0,
      shotLeft: 0,
      nextShot: spec.nextShot || 0,
      phase: spec.phase || 0,
      angle: spec.angle || 0,
      radius: spec.radius || 0,
      charge: 0,
      beamT: 0,
      fireWait: spec.fireWait || 0
    };
    return e;
  }

  function spawnAstro() {
    G.formOx = 0;
    G.formDir = 1;
    G.formY = 0;
    for (let row = 0; row < ROWS; row++) {
      const type = row === 0 ? 2 : row === 1 ? 1 : 0;
      for (let col = 0; col < COLS; col++) {
        G.enemies.push(makeEnemy({
          kind: 'inv',
          type: type,
          col: col,
          row: row,
          x: FORM_X + col * CELL_X,
          y: FORM_Y + row * CELL_Y,
          state: 'form'
        }));
      }
    }
  }

  function spawnLaser() {
    const y = 92;
    G.enemies.push(makeEnemy({
      kind: 'cannon', type: 2, x: 150, y: y, hp: 2, state: 'idle', fireWait: 0.4
    }));
    G.enemies.push(makeEnemy({
      kind: 'cannon', type: 2, x: 330, y: y, hp: 2, state: 'idle', fireWait: 1.35
    }));
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 4; i++) {
        const x = 96 + i * 96 + (r ? 18 : 0);
        const yy = 148 + r * 46;
        G.enemies.push(makeEnemy({
          kind: 'escort',
          type: r === 0 ? 1 : 0,
          x: x,
          y: yy,
          homeX: x,
          homeY: yy,
          phase: i * 0.7 + r,
          nextShot: rand(0.6, 1.8)
        }));
      }
    }
  }

  function galaxSlots() {
    const out = [];
    for (let i = 0; i < 4; i++) out.push({ type: 2, col: 2 + i, row: 0, hp: 2 });
    for (let i = 0; i < 6; i++) out.push({ type: 1, col: 1 + i, row: 1, hp: 1 });
    for (let i = 0; i < 8; i++) out.push({ type: 0, col: i, row: 2, hp: 1 });
    return out;
  }

  function spawnGalax() {
    G.formOx = 0;
    G.formDir = 1;
    G.formY = 0;
    G.formed = false;
    G.diveCd = 0.9;
    const slots = galaxSlots();
    const gx = 76;
    const gy = 100;
    const cx = 46;
    const cy = 34;
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      const side = i < 8 ? -1 : 1;
      const endX = gx + sl.col * cx;
      const endY = gy + sl.row * cy;
      const wps = [
        { x: side > 0 ? 520 : -40, y: 40 + sl.row * 10 },
        { x: 240 + side * 120, y: 160 },
        { x: 240 - side * 40, y: 90 },
        { x: endX, y: endY }
      ];
      const e = makeEnemy({
        kind: 'galax',
        type: sl.type,
        col: sl.col,
        row: sl.row,
        hp: sl.hp,
        x: wps[0].x,
        y: wps[0].y,
        homeX: endX,
        homeY: endY,
        state: 'wait',
        delay: (i % 8) * 0.09 + (i < 8 ? 0 : 0.85),
        wps: wps
      });
      G.enemies.push(e);
    }
  }

  function spawnWarpEnemy() {
    const type = Math.random() < 0.22 ? 2 : Math.random() < 0.5 ? 1 : 0;
    const e = makeEnemy({
      kind: 'warp',
      type: type,
      x: WARP_X,
      y: WARP_Y,
      angle: rand(0, TAU),
      radius: 8,
      state: 'spiral',
      nextShot: rand(0.4, 1.2)
    });
    G.enemies.push(e);
    ring(WARP_X, WARP_Y, type === 2 ? MAG : PUR);
    spark(WARP_X, WARP_Y, CYN);
    G.warpPulse = 1;
    audio.warpSting();
    if (!REDUCE && (G.warpLeft % 4 === 0)) {
      screenFlash(PUR, 0.22);
      kick(2.1, 'warp');
    }
  }

  function spawnWarp() {
    G.warpLeft = isCamp() ? 16 : 20;
    G.warpCd = 0.12;
    G.warpPulse = 0.6;
  }

  function spawnGuards() {
    if (!G.boss || !G.boss.alive) return;
    const n = 5 - aliveKind('guard');
    for (let i = 0; i < n; i++) {
      const a = (i / Math.max(1, n)) * TAU + G.t;
      G.enemies.push(makeEnemy({
        kind: 'guard',
        type: i % 2,
        x: G.boss.x + Math.cos(a) * 90,
        y: G.boss.y + 46 + Math.sin(a) * 18,
        phase: a,
        homeX: 90 + (i % 3) * 20,
        state: 'orbit',
        nextShot: rand(0.5, 1.6)
      }));
    }
  }

  function spawnFlag() {
    G.boss = {
      alive: true,
      x: VW * 0.5,
      y: 132,
      vx: 54 * haste(),
      coreOff: 0,
      coreDir: 1,
      coreHp: isCamp() ? 10 : 8,
      maxCore: isCamp() ? 10 : 8,
      shake: 0,
      fireCd: 0.8
    };
    G.guardCd = 2.4;
    spawnGuards();
  }

  function spawnMission() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.lasers = [];
    G.formed = false;
    G.formOx = 0;
    G.formDir = 1;
    G.formY = 0;
    G.diveCd = 1.2;
    G.bombCd = 0.7;
    G.boss = null;
    G.warpLeft = 0;
    G.pendingWin = false;
    const id = missionMeta().id;
    if (id === 'astro') spawnAstro();
    else if (id === 'laser') spawnLaser();
    else if (id === 'galax') spawnGalax();
    else if (id === 'warp') spawnWarp();
    else spawnFlag();
  }

  function resetField() {
    G.ship.x = VW * 0.5;
    G.ship.vx = 0;
    G.shots = [];
    G.bombs = [];
    G.lasers = [];
    G.deadT = 0;
    G.invuln = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.clearT = 0;
    G.pendingWin = false;
    G.next1up = 20000;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    spawnMission();
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function aliveKind(kind) {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === kind) n += 1;
    }
    return n;
  }

  function formedCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.state === 'form') n += 1;
    }
    return n;
  }

  function divingCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && (e.state === 'dive' || e.state === 'return')) n += 1;
    }
    return n;
  }

  function followWaypoints(e, dt, speed) {
    if (e.wpI >= e.wps.length) return true;
    const tgt = e.wps[e.wpI];
    const dx = tgt.x - e.x;
    const dy = tgt.y - e.y;
    const d = hypot(dx, dy);
    const step = speed * dt;
    if (d <= step || d < 1.6) {
      e.x = tgt.x;
      e.y = tgt.y;
      e.wpI += 1;
      return e.wpI >= e.wps.length;
    }
    e.x += (dx / d) * step;
    e.y += (dy / d) * step;
    return false;
  }

  function slotGalax(e) {
    return {
      x: e.homeX + G.formOx,
      y: e.homeY + Math.sin(G.clock * 1.3) * 3
    };
  }

  function enemyRgb(e) {
    if (e.hitFlash > 0) return WHT;
    if (e.kind === 'cannon') return e.hp > 1 ? MAG : PNK;
    if (e.kind === 'warp') return e.type === 2 ? MAG : e.type === 1 ? CYN : PUR;
    return TYPE_RGB[e.type] || GOLD;
  }

  function explodeEnemy(e, silent) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = enemyRgb(e);
    burst(e.x, e.y, rgb, e.type === 2 || e.kind === 'cannon' ? 22 : 14, 280);
    ring(e.x, e.y, rgb);
    spark(e.x, e.y, WHT);
    if (!silent) {
      audio.explode();
      audio.hit(e.type, G.combo);
    }
    let base = 80;
    if (e.kind === 'inv') base = ASTRO_SCORE[e.type];
    else if (e.kind === 'cannon') base = 250;
    else if (e.kind === 'escort') base = 80;
    else if (e.kind === 'galax') {
      const diving = e.state === 'dive' || e.state === 'return';
      base = diving ? GAL_DIVE[e.type] : GAL_FORM[e.type];
    } else if (e.kind === 'warp') base = 120 + e.type * 40;
    else if (e.kind === 'guard') base = e.state === 'dive' ? 140 : 70;
    const n = base * G.mult;
    addScore(n);
    floatText(e.x, e.y - 10, String(n), rgb);
    hitStop(e.kind === 'cannon' || e.type === 2 ? 0.07 : 0.042);
    kick(e.kind === 'cannon' ? 3.2 : 1.7);
  }

  function damageEnemy(e) {
    if (!e.alive) return;
    if (e.hp > 1) {
      e.hp -= 1;
      e.hitFlash = 0.12;
      spark(e.x, e.y, GOLD);
      audio.chip();
      bumpCombo();
      const n = 40 * G.mult;
      addScore(n);
      floatText(e.x, e.y - 8, String(n), GOLD);
      hitStop(0.04);
      kick(1.3);
      return;
    }
    bumpCombo();
    explodeEnemy(e, false);
  }

  function corePos() {
    if (!G.boss) return { x: 240, y: 150 };
    return { x: G.boss.x + G.boss.coreOff, y: G.boss.y + 18 };
  }

  function destroyCore() {
    if (!G.boss || !G.boss.alive) return;
    const p = corePos();
    G.boss.alive = false;
    G.boss.coreHp = 0;
    burst(p.x, p.y, GOLD, 40, 420);
    burst(G.boss.x, G.boss.y, MAG, 28, 360);
    ring(p.x, p.y, GOLD);
    ring(G.boss.x, G.boss.y, PUR);
    audio.coreKill();
    screenFlash(GOLD, 0.7);
    hitStop(0.08);
    kick(7);
    const n = 2500 * G.mult;
    addScore(n);
    floatText(p.x, p.y - 12, String(n), GOLD);
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) explodeEnemy(G.enemies[i], true);
    }
    G.pendingWin = true;
    G.clearT = 0.85;
    toast('核心击破', false, true);
  }

  function hitCore() {
    if (!G.boss || !G.boss.alive) return;
    G.boss.coreHp -= 1;
    G.boss.shake = 0.18;
    const p = corePos();
    spark(p.x, p.y, GOLD);
    burst(p.x, p.y, GOLD, 10, 220);
    audio.coreHit();
    bumpCombo();
    const n = 100 * G.mult;
    addScore(n);
    floatText(p.x, p.y - 10, String(n), GOLD);
    hitStop(0.055);
    kick(2.6);
    screenFlash(GOLD, 0.28);
    if (G.boss.coreHp <= 0) destroyCore();
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.invuln > 0 || G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.fireHold = false;
    G.shots = [];
    burst(G.ship.x, G.ship.y, CYN, 26, 340);
    ring(G.ship.x, G.ship.y, MAG);
    audio.death();
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    kick(7);
    G.why = why;
  }

  function enemyBomb(e, spd) {
    if (G.mode === 'title') return;
    if (G.bombs.length >= (isCamp() ? 7 : 10)) return;
    const aim = (G.ship.x - e.x) * 0.12;
    G.bombs.push({
      x: e.x,
      y: e.y + 10,
      vx: clamp(aim, -46, 46),
      vy: (spd || 200) * haste()
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0.4) return;
    if (G.shots.length >= 2 || G.fireCd > 0) return;
    G.shots.push({ x: G.ship.x, y: G.ship.y - 14, vy: -SHOT_V });
    audio.shoot();
    G.fireCd = 0.12;
    G.muzzle = 0.08;
    spark(G.ship.x, G.ship.y - 16, CYN);
  }

  function hitBox(e) {
    if (e.kind === 'cannon') return { hw: 18, hh: 12 };
    if (e.kind === 'warp') return { hw: 12, hh: 11 };
    if (e.kind === 'guard') return { hw: 11, hh: 8 };
    return { hw: TYPE_HW[e.type] || 12, hh: TYPE_HH[e.type] || 8 };
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let ax = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.ship.x;
      if (Math.abs(dx) > 2) ax = dx > 0 ? 1 : -1;
      G.ship.x = lerp(G.ship.x, clamp(pointer.x, shipMin(), shipMax()), 1 - Math.exp(-dt * 14));
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      G.ship.x += ax * 300 * dt;
    }
    G.ship.x = clamp(G.ship.x, shipMin(), shipMax());
  }

  function updateAstro(dt) {
    const live = aliveKind('inv');
    if (live <= 0) return;
    const spd = (22 + (32 - live) * 2.4) * haste();
    G.formOx += G.formDir * spd * dt;
    let minX = 999;
    let maxX = -999;
    let maxY = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.kind !== 'inv') continue;
      e.x = FORM_X + e.col * CELL_X + G.formOx;
      e.y = FORM_Y + e.row * CELL_Y + G.formY;
      if (e.x < minX) minX = e.x;
      if (e.x > maxX) maxX = e.x;
      if (e.y > maxY) maxY = e.y;
    }
    if (maxX > VW - 22 && G.formDir === 1) {
      G.formDir = -1;
      G.formY += 14;
    } else if (minX < 22 && G.formDir === -1) {
      G.formDir = 1;
      G.formY += 14;
    }
    G.bombCd -= dt;
    if (G.bombCd <= 0 && G.mode === 'play') {
      const cols = [];
      for (let c = 0; c < COLS; c++) {
        let bottom = null;
        for (let i = 0; i < G.enemies.length; i++) {
          const e = G.enemies[i];
          if (e.alive && e.kind === 'inv' && e.col === c) {
            if (!bottom || e.row > bottom.row) bottom = e;
          }
        }
        if (bottom) cols.push(bottom);
      }
      if (cols.length) {
        const pick = cols[(Math.random() * cols.length) | 0];
        if (Math.random() < 0.72) enemyBomb(pick, 210 + live * 0.4);
      }
      G.bombCd = Math.max(0.28, (0.85 - (32 - live) * 0.018) / haste());
    }
    if (maxY > PLAYER_Y - 18 && G.mode === 'play') killPlayer('ram');
  }

  function updateLaser(dt) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.kind === 'cannon') {
        e.x += Math.sin(G.clock * 0.7 + e.x * 0.01) * 18 * dt;
        e.x = clamp(e.x, 70, VW - 70);
        if (e.state === 'idle') {
          e.fireWait -= dt;
          if (e.fireWait <= 0) {
            e.state = 'charge';
            e.charge = 0;
            audio.laserCharge();
          }
        } else if (e.state === 'charge') {
          e.charge += dt;
          if (e.charge >= 0.62) {
            e.state = 'fire';
            e.beamT = 0.42;
            audio.laserFire();
            screenFlash(CYN, 0.28);
            kick(2.4);
            hitStop(0.03);
          }
        } else if (e.state === 'fire') {
          e.beamT -= dt;
          if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
            if (Math.abs(G.ship.x - e.x) < 12 && G.ship.y > e.y + 8) {
              killPlayer('shot');
            }
          }
          if (e.beamT <= 0) {
            e.state = 'idle';
            e.fireWait = rand(1.05, 1.7) / haste();
          }
        }
      } else if (e.kind === 'escort') {
        e.phase += dt;
        e.x = e.homeX + Math.sin(e.phase * 1.6) * 36;
        e.y = e.homeY + Math.sin(e.phase * 2.2 + 1) * 10;
        e.nextShot -= dt;
        if (e.nextShot <= 0 && G.mode === 'play') {
          enemyBomb(e, 230);
          e.nextShot = rand(1.1, 2.1) / haste();
        }
      }
    }
  }

  function startDive(e) {
    if (!e.alive || e.state !== 'form') return;
    e.state = 'dive';
    e.wpI = 0;
    e.shotLeft = e.type === 2 ? 3 : e.type === 1 ? 2 : 1;
    e.nextShot = rand(0.2, 0.55);
    const side = e.x < VW * 0.5 ? -1 : 1;
    const px = G.ship.x;
    e.wps = [
      { x: e.x + side * 36, y: e.y - 16 },
      { x: e.x + side * 88, y: e.y + 64 },
      { x: lerp(e.x, px, 0.3) - side * 40, y: 280 },
      { x: px + side * 48, y: 410 },
      { x: px - side * 50, y: 540 },
      { x: px + side * 10, y: 660 },
      { x: px - side * 24, y: 800 }
    ];
  }

  function tryDive() {
    if (!G.formed || G.deadT > 0) return;
    const maxD = Math.min(5, (isCamp() ? 2 : 3) + 1);
    if (divingCount() >= maxD) return;
    const pool = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.kind === 'galax' && e.state === 'form') pool.push(e);
    }
    if (!pool.length) return;
    const a = pool[(Math.random() * pool.length) | 0];
    startDive(a);
    if (pool.length > 1 && Math.random() < 0.55) {
      let b = pool[(Math.random() * pool.length) | 0];
      if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
      if (b !== a) startDive(b);
    }
  }

  function updateGalax(dt) {
    G.formOx += G.formDir * (20 + haste() * 4) * dt;
    if (G.formOx > 28) G.formDir = -1;
    if (G.formOx < -28) G.formDir = 1;
    let waiting = 0;
    let entering = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.kind !== 'galax') continue;
      if (e.state === 'wait') {
        e.delay -= dt;
        if (e.delay <= 0) {
          e.state = 'enter';
          e.wpI = 0;
        } else {
          waiting += 1;
          continue;
        }
      }
      if (e.state === 'enter') {
        entering += 1;
        if (followWaypoints(e, dt, 240 * haste())) {
          e.state = 'form';
          const p = slotGalax(e);
          e.x = p.x;
          e.y = p.y;
        }
        continue;
      }
      if (e.state === 'form') {
        const p = slotGalax(e);
        e.x = p.x;
        e.y = p.y;
        continue;
      }
      if (e.state === 'dive') {
        if (e.wpI >= 3 && e.y < PLAYER_Y - 50) {
          e.x += (G.ship.x - e.x) * dt * 0.4;
        }
        if (e.shotLeft > 0) {
          e.nextShot -= dt;
          if (e.nextShot <= 0 && e.y > 120 && e.y < 560) {
            enemyBomb(e, 220);
            e.shotLeft -= 1;
            e.nextShot = rand(0.32, 0.7);
          }
        }
        if (followWaypoints(e, dt, (260 + G.mission * 8) * haste()) || e.y > VH + 20) {
          e.y = -24;
          e.state = 'return';
          e.wps = [slotGalax(e)];
          e.wpI = 0;
        }
        continue;
      }
      if (e.state === 'return') {
        e.wps = [slotGalax(e)];
        if (followWaypoints(e, dt, 270)) {
          e.state = 'form';
          const p = slotGalax(e);
          e.x = p.x;
          e.y = p.y;
        }
      }
    }
    if (!G.formed) {
      const live = aliveKind('galax');
      if (live > 0 && waiting === 0 && entering === 0 && formedCount() === live) {
        G.formed = true;
        G.diveCd = 0.45;
      }
      if (G.clock > 10 && live > 0) G.formed = true;
    }
    if (G.formed) {
      G.diveCd -= dt;
      if (G.diveCd <= 0) {
        tryDive();
        G.diveCd = Math.max(0.4, (isCamp() ? 1.45 : 1.05) / haste()) * rand(0.75, 1.15);
      }
    }
  }

  function updateWarp(dt) {
    G.warpPulse = Math.max(0, G.warpPulse - dt * 1.6);
    if (G.warpLeft > 0) {
      G.warpCd -= dt;
      if (G.warpCd <= 0 && aliveKind('warp') < 8) {
        spawnWarpEnemy();
        G.warpLeft -= 1;
        G.warpCd = (isCamp() ? 0.42 : 0.3) * rand(0.7, 1.1);
      }
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.kind !== 'warp') continue;
      if (e.state === 'spiral') {
        e.angle += (2.6 + e.type * 0.25) * haste() * dt;
        e.radius += 78 * haste() * dt;
        e.x = WARP_X + Math.cos(e.angle) * e.radius;
        e.y = WARP_Y + Math.sin(e.angle) * e.radius * 0.72;
        e.nextShot -= dt;
        if (e.nextShot <= 0 && e.radius > 70 && G.mode === 'play') {
          enemyBomb(e, 200);
          e.nextShot = rand(0.8, 1.5);
        }
        if (e.radius > 150 || e.y > 430) {
          e.state = 'dive';
          const dx = G.ship.x - e.x;
          const dy = PLAYER_Y - e.y;
          const d = Math.max(1, hypot(dx, dy));
          const v = (210 + e.type * 20) * haste();
          e.vx = (dx / d) * v;
          e.vy = (dy / d) * v;
        }
      } else if (e.state === 'dive') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vx += (G.ship.x - e.x) * dt * 0.35;
        if (e.y > VH + 24 || e.x < -40 || e.x > VW + 40) {
          e.x = WARP_X;
          e.y = WARP_Y;
          e.radius = 8;
          e.angle = rand(0, TAU);
          e.state = 'spiral';
        }
      }
    }
  }

  function updateFlag(dt) {
    const b = G.boss;
    if (b && b.alive) {
      b.x += b.vx * dt;
      if (b.x > VW - 110) {
        b.x = VW - 110;
        b.vx = -Math.abs(b.vx);
      } else if (b.x < 110) {
        b.x = 110;
        b.vx = Math.abs(b.vx);
      }
      b.coreOff += b.coreDir * 46 * dt;
      if (b.coreOff > 36) b.coreDir = -1;
      if (b.coreOff < -36) b.coreDir = 1;
      b.shake = Math.max(0, b.shake - dt);
      b.fireCd -= dt;
      if (b.fireCd <= 0 && G.mode === 'play') {
        enemyBomb({ x: b.x - 40, y: b.y + 20 }, 240);
        enemyBomb({ x: b.x + 40, y: b.y + 20 }, 240);
        b.fireCd = (isCamp() ? 1.35 : 1.05) / haste();
      }
    }
    G.guardCd -= dt;
    if (G.guardCd <= 0 && b && b.alive && aliveKind('guard') < 3) {
      spawnGuards();
      G.guardCd = 3.2 / haste();
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.kind !== 'guard') continue;
      if (e.state === 'orbit') {
        e.phase += dt * 1.4;
        const bx = b && b.alive ? b.x : 240;
        const by = b && b.alive ? b.y : 132;
        e.x = bx + Math.cos(e.phase) * (78 + e.homeX * 0.2);
        e.y = by + 52 + Math.sin(e.phase * 1.4) * 16;
        e.nextShot -= dt;
        if (e.nextShot <= 0 && G.mode === 'play') {
          enemyBomb(e, 220);
          e.nextShot = rand(1.2, 2.2);
        }
        if (Math.random() < dt * 0.18 && divingCount() < 2) {
          e.state = 'dive';
          e.wps = [
            { x: e.x, y: e.y + 40 },
            { x: G.ship.x + rand(-40, 40), y: 420 },
            { x: G.ship.x, y: 820 }
          ];
          e.wpI = 0;
        }
      } else if (e.state === 'dive') {
        if (followWaypoints(e, dt, 280 * haste()) || e.y > VH + 20) {
          e.state = 'orbit';
          e.y = 180;
        }
      }
    }
  }

  function updateEnemies(dt) {
    G.flapT += dt;
    if (G.flapT >= 0.38) {
      G.flapT = 0;
      G.frame += 1;
    }
    for (let i = 0; i < G.enemies.length; i++) {
      G.enemies[i].hitFlash = Math.max(0, G.enemies[i].hitFlash - dt);
    }
    const id = missionMeta().id;
    if (id === 'astro') updateAstro(dt);
    else if (id === 'laser') updateLaser(dt);
    else if (id === 'galax') updateGalax(dt);
    else if (id === 'warp') updateWarp(dt);
    else updateFlag(dt);
  }

  function shotHitsBoss(s) {
    const b = G.boss;
    if (!b || !b.alive) return null;
    const p = corePos();
    if (Math.abs(s.x - p.x) <= 13 && Math.abs(s.y - p.y) <= 11) return 'core';
    if (Math.abs(s.x - b.x) <= 108 && Math.abs(s.y - b.y) <= 28) return 'hull';
    return null;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.y += s.vy * dt;
      if (s.y < -16) {
        G.shots.splice(i, 1);
        if (G.combo > 0 && G.mode === 'play' && G.shots.length === 0) {
          audio.miss();
          G.combo = 0;
          G.comboT = 0;
          G.mult = 1;
        }
        continue;
      }
      if (G.mission === 4) {
        const kind = shotHitsBoss(s);
        if (kind === 'core') {
          G.shots.splice(i, 1);
          hitCore();
          continue;
        }
        if (kind === 'hull') {
          G.shots.splice(i, 1);
          spark(s.x, s.y, PUR);
          audio.chip();
          bumpCombo();
          addScore(10 * G.mult);
          floatText(s.x, s.y - 6, '挡', HOT);
          hitStop(0.028);
          continue;
        }
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive || e.state === 'wait') continue;
        const b = hitBox(e);
        if (Math.abs(s.x - e.x) <= b.hw && Math.abs(s.y - e.y) <= b.hh) {
          G.shots.splice(i, 1);
          damageEnemy(e);
          hit = true;
          break;
        }
      }
      if (hit) continue;
    }
  }

  function updateBombs(dt) {
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > VH + 16 || b.x < -20 || b.x > VW + 20) {
        G.bombs.splice(i, 1);
        continue;
      }
      if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) continue;
      if (Math.abs(b.x - G.ship.x) < 12 && Math.abs(b.y - G.ship.y) < 12) {
        G.bombs.splice(i, 1);
        killPlayer('shot');
      }
    }
  }

  function collideBodies() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.state === 'wait' || e.state === 'form' || e.state === 'enter' || e.state === 'orbit') {
        if (e.kind !== 'inv' && e.kind !== 'warp') continue;
      }
      if (e.y < PLAYER_Y - 28) continue;
      if (Math.abs(e.x - G.ship.x) < 16 && Math.abs(e.y - G.ship.y) < 14) {
        explodeEnemy(e, false);
        killPlayer('ram');
        return;
      }
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    const warpPull = G.mission === 3;
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (warpPull) {
        const dx = s.x - WARP_X;
        const dy = s.y - WARP_Y;
        const d = Math.max(12, hypot(dx, dy));
        s.x -= (dx / d) * 18 * dt;
        s.y -= (dy / d) * 18 * dt;
        s.x += Math.cos(G.t * 0.6 + s.p) * 8 * dt;
        if (d < 18) {
          s.x = Math.random() * VW;
          s.y = Math.random() * VH;
        }
      } else {
        s.y += s.v * dt * 0.28;
        if (s.y > VH) s.y = 0;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += q.g * dt;
      q.vx *= 0.98;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
  }

  function missionCleared() {
    if (G.pendingWin) return false;
    if (G.mission === 4) return G.boss && !G.boss.alive;
    if (G.mission === 3) return G.warpLeft <= 0 && aliveKind('warp') === 0;
    return aliveCount() === 0;
  }

  function onMissionClear() {
    if (G.pendingWin || G.clearT > 0) return;
    if (G.mission === 4) {
      G.pendingWin = true;
      G.clearT = 0.2;
      return;
    }
    const bonus = (400 + G.mission * 150) * Math.max(1, G.mult);
    addScore(bonus);
    audio.wave();
    G.mission += 1;
    G.ready = 0.95;
    spawnMission();
    toast(missionMeta().name, false, G.mission >= 3);
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    addScore(8000);
    G.mode = 'win';
    G.pendingWin = false;
    audio.win();
    screenFlash(GOLD, 0.55);
    kick(3);
    const lead = '旗舰核心击破  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('win', isCamp() ? '远征肃清' : '旗舰击破', lead, '再来', isCamp() ? '旗舰' : '远征');
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
    const lead = (why === 'ram' ? '被撞上了' : '中弹了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '舰毁了', lead, '再来', '换模式');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'flag' ? 'flag' : 'camp';
    G.mode = 'play';
    G.mission = isCamp() ? 0 : 2;
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    G.clock = 0;
    resetField();
    G.ready = 0.7;
    hideOverlay();
    audio.start();
    toast(isCamp() ? '远征 · 五关打核' : '旗舰 · 跳关加速', false, !isCamp());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'camp';
    G.mission = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    resetField();
    G.ready = 0;
    showOverlay(
      'title',
      '戈夫',
      '五关远征：星战、激光、俯冲、星门、旗舰。打穿旗舰发光核心通关。中弹扣命。',
      '远征',
      '旗舰'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('camp');
    else startGame(G.kind || 'camp');
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    updatePlayer(dt);
    if ((G.fireHold || pointer.down) && G.mode === 'play') fire();
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateBombs(dt);
      return;
    }
    updateEnemies(dt);
    updateShots(dt);
    updateBombs(dt);
    collideBodies();
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
      if (aliveCount() === 0 || G.formY > 260) spawnMission();
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateEnemies(dt * 0.35);
      return;
    }

    if (G.clearT > 0) {
      G.clearT -= dt;
      updateFx(dt);
      if (G.clearT <= 0 && G.pendingWin) winRun();
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      updateEnemies(dt);
      updateBombs(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '舰毁了');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = PLAYER_Y;
        G.invuln = 1.55;
        G.bombs = [];
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && G.ready <= 0 && missionCleared()) onMissionClear();

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
    g.addColorStop(0, '#160c38');
    g.addColorStop(0.45, '#0a061c');
    g.addColorStop(1, '#050314');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(140), 16 * scale, sx(240), sy(280), 380 * scale);
    vg.addColorStop(0, 'rgba(124, 92, 255, 0.14)');
    vg.addColorStop(0.55, 'rgba(255, 61, 184, 0.04)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
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

    ctx.fillStyle = 'rgba(124, 92, 255, 0.18)';
    ctx.fillRect(sx(10), sy(PLAYER_Y + 16), (VW - 20) * scale, 2 * scale);
  }

  function drawForceField() {
    if (G.mission !== 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) {
      const x = 24 + i * 24 + Math.sin(G.t * 2 + i * 0.4) * 4;
      const h = 6 + (i % 3) * 2;
      const rgb = i % 3 === 0 ? MAG : i % 3 === 1 ? CYN : GOLD;
      ctx.fillStyle = rgba(rgb, 0.35 + 0.25 * Math.sin(G.t * 5 + i));
      ctx.fillRect(sx(x), sy(58), 16 * scale, h * scale);
    }
    ctx.restore();
  }

  function drawVortex() {
    if (G.mission !== 3) return;
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 7) + G.warpPulse * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 5; i >= 1; i--) {
      ctx.beginPath();
      ctx.ellipse(
        sx(WARP_X),
        sy(WARP_Y),
        (18 + i * 16 + G.warpPulse * 10) * scale,
        (12 + i * 11 + G.warpPulse * 8) * scale,
        G.t * (0.8 + i * 0.12),
        0,
        TAU
      );
      ctx.strokeStyle = rgba(i % 2 ? PUR : CYN, 0.18 * pulse);
      ctx.lineWidth = (1.4 + i * 0.3) * scale;
      ctx.stroke();
    }
    ctx.fillStyle = rgba(GOLD, 0.55 * pulse);
    ctx.beginPath();
    ctx.arc(sx(WARP_X), sy(WARP_Y), (6 + pulse * 4) * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(sx(WARP_X - 1.5), sy(WARP_Y - 1.5), 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBoss() {
    const m = G.boss;
    if (!m || !m.alive) return;
    const jx = m.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
    const x = m.x + jx;
    const y = m.y;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(PUR, 0.16);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), 120 * scale, 36 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = rgba(PUR, 0.95);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y - 6), 108 * scale, 22 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([28, 16, 70], 1);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y + 4), 96 * scale, 16 * scale, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba([18, 10, 42], 0.95);
    ctx.fillRect(sx(x - 48), sy(y - 2), 96 * scale, 30 * scale);

    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.fillRect(sx(x - 104), sy(y + 4), 22 * scale, 10 * scale);
    ctx.fillRect(sx(x + 82), sy(y + 4), 22 * scale, 10 * scale);

    for (let i = 0; i < 7; i++) {
      const lx = x - 84 + i * 28;
      ctx.fillStyle = rgba(i % 2 === 0 ? GOLD : CYN, 0.55 + 0.45 * Math.sin(G.t * 8 + i));
      ctx.fillRect(sx(lx), sy(y - 14), 6 * scale, 4 * scale);
    }

    const egg = corePos();
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 9);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(MAG, 0.3 * pulse);
    ctx.beginPath();
    ctx.ellipse(sx(egg.x), sy(egg.y), 18 * scale, 14 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(sx(egg.x), sy(egg.y), 11 * scale, 9 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.ellipse(sx(egg.x - 2), sy(egg.y - 2), 4 * scale, 3.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    const hp = m.coreHp / m.maxCore;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x - 40), sy(y - 28), 80 * scale, 4 * scale);
    ctx.fillStyle = rgba(hp > 0.35 ? GOLD : MAG, 0.9);
    ctx.fillRect(sx(x - 40), sy(y - 28), 80 * hp * scale, 4 * scale);
  }

  function drawLaserBeam(e) {
    if (e.kind !== 'cannon') return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (e.state === 'charge') {
      const a = clamp(e.charge / 0.62, 0, 1);
      ctx.fillStyle = rgba(CYN, 0.12 + a * 0.35);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y + 8), (8 + a * 10) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, a * 0.5);
      ctx.fillRect(sx(e.x - 1.5), sy(e.y + 10), 3 * scale, (40 + a * 80) * scale);
    }
    if (e.state === 'fire') {
      const w = 7 + Math.sin(G.t * 40) * 2;
      ctx.fillStyle = rgba(CYN, 0.22);
      ctx.fillRect(sx(e.x - w - 6), sy(e.y + 12), (w * 2 + 12) * scale, (VH - e.y) * scale);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(sx(e.x - 2), sy(e.y + 10), 4 * scale, (VH - e.y) * scale);
      ctx.fillStyle = rgba(MAG, 0.55);
      ctx.fillRect(sx(e.x - w * 0.4), sy(e.y + 10), (w * 0.8) * scale, (VH - e.y) * scale);
    }
    ctx.restore();
  }

  function drawEnemies() {
    drawBoss();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state === 'wait') continue;
      if (e.kind === 'cannon') drawLaserBeam(e);
      const rgb = enemyRgb(e);
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), (10 + e.type) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      if (e.kind === 'cannon') {
        drawSprite(e.x, e.y, SPR_CANNON, rgb, 2.2, 1);
      } else if (e.kind === 'warp') {
        drawSprite(e.x, e.y, SPR_WARP[G.frame & 1], rgb, 2.1, 1);
      } else {
        const frames = SPR[e.type] || SPR[0];
        const spr = frames[G.frame & 1];
        const cell = e.type === 2 ? 2.2 : 2;
        drawSprite(e.x, e.y, spr, rgb, cell, 1);
      }
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!REDUCE) {
        ctx.fillStyle = rgba(PUR, 0.22);
        ctx.fillRect(sx(s.x - 1.4), sy(s.y), 2.8 * scale, 12 * scale);
      }
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.5), sy(s.y - 8), 3 * scale, 14 * scale);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(sx(s.x - 2.2), sy(s.y - 6), 4.4 * scale, 8 * scale);
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), 2.6 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(sx(b.x - 1), sy(b.y - 5), 2 * scale, 5 * scale);
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    ctx.save();
    ctx.globalAlpha = 0.22 + G.muzzle * 1.4;
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), 14 * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawSprite(x, y, SPR_SHIP, HOT, 2, 1);
    if (G.muzzle > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / 0.4, 0, 1);
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
      const r = (6 + s.t * 40) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), r, 0, TAU);
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
    ctx.fillStyle = '#050314';
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
    ctx.fillStyle = '#050314';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch !== 1 && !REDUCE) {
      const p = G.punch;
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(p, p);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    drawBg();
    drawForceField();
    drawVortex();
    drawEnemies();
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
      startGame('camp');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
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
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'flag' : 'camp');
      return;
    }
    if (space || k === 'Enter' || k === 'w' || k === 'W' || k === 'ArrowUp') {
      if (overlayOpen() && (space || k === 'Enter')) {
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

  if (btnCamp) {
    btnCamp.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('camp');
    });
  }
  if (btnEnd) {
    btnEnd.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win') startGame(isCamp() ? 'flag' : 'camp');
      else startGame('flag');
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
