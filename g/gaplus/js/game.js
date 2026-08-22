'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const HOME_Y = 648;
  const BOX_L = 22;
  const BOX_R = 458;
  const BOX_T = 488;
  const BOX_B = 686;
  const CAP_T = 64;
  const SHOT_V = 640;
  const SHIP_SPD = 290;
  const COMBO_WIN = 1.48;
  const CAMP_WAVES = 6;
  const CELL_X = 42;
  const CELL_Y = 32;
  const FORM_X = 93;
  const FORM_Y = 82;
  const BEST_KEY = 'playbox-gaplus-best';
  const MUTE_KEY = 'playbox-gaplus-mute';
  const OPS = '←→↑↓ / WASD 八向 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const VIO = [196, 77, 255];
  const PUR = [168, 85, 247];
  const WHT = [246, 232, 255];
  const HOT = [232, 180, 255];
  const YEL = [255, 214, 70];
  const ORG = [255, 140, 64];
  const PNK = [255, 140, 200];

  const TYPE_RGB = [YEL, CYN, VIO];
  const TYPE_RGB_HIT = [ORG, WHT, MAG];
  const TYPE_HW = [11, 12, 15];
  const TYPE_HH = [8, 8, 10];
  const TYPE_SCORE_FORM = [50, 80, 400];
  const TYPE_SCORE_DIVE = [100, 160, 800];
  const TYPE_CHIP = [0, 0, 150];

  const SPR = [
    [
      [
        ' ##    ## ',
        '##########',
        ' ###  ### ',
        '##########',
        '  ######  ',
        ' #  ##  # '
      ],
      [
        '  ##  ##  ',
        '##########',
        ' ###  ### ',
        '##########',
        '  ######  ',
        '#   ##   #'
      ]
    ],
    [
      [
        '    ##    ',
        '  ######  ',
        ' ## ## ## ',
        '##########',
        '##  ##  ##',
        ' #      # ',
        '##      ##'
      ],
      [
        '    ##    ',
        '  ######  ',
        ' ## ## ## ',
        '##########',
        '##  ##  ##',
        '##      ##',
        ' #      # '
      ]
    ],
    [
      [
        '  #      #  ',
        ' ########## ',
        '############',
        '## ##  ## ##',
        ' ########## ',
        '   # ## #   ',
        '  ##    ##  '
      ],
      [
        ' #        # ',
        ' ########## ',
        '############',
        '## ##  ## ##',
        ' ########## ',
        '  ## ## ##  ',
        ' #        # '
      ]
    ]
  ];

  const SPR_SHIP = [
    '     ##     ',
    '   ######   ',
    ' # ##  ## # ',
    '############',
    ' ##  ##  ## ',
    '#    ##    #'
  ];

  const SPR_SHIP_CAP = [
    '     ##     ',
    ' # ###### # ',
    ' ## ## ## # ',
    '############',
    '  ## ## ##  ',
    ' #   ##   # '
  ];

  const SLOTS = (function () {
    const out = [];
    for (let i = 0; i < 4; i++) out.push({ type: 2, col: 2 + i, row: 0, hp: 2, escort: false });
    for (let i = 0; i < 8; i++) out.push({ type: 1, col: i, row: 1, hp: 1, escort: i >= 2 && i <= 5 });
    for (let i = 0; i < 8; i++) out.push({ type: 1, col: i, row: 2, hp: 1, escort: false });
    for (let i = 0; i < 8; i++) out.push({ type: 0, col: i, row: 3, hp: 1, escort: false });
    for (let i = 0; i < 8; i++) out.push({ type: 0, col: i, row: 4, hp: 1, escort: false });
    return out;
  })();

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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: HOME_Y, id: null };
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
    wave: 1,
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
    drops: [],
    ship: { x: VW * 0.5, y: HOME_Y, vx: 0, vy: 0 },
    guns: 1,
    formOx: 0,
    formDir: 1,
    formed: false,
    diveCd: 1.4,
    fireCd: 0,
    fireHold: false,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: VIO,
    punch: 1,
    toastT: 0,
    why: '',
    frame: 0,
    flapT: 0,
    muzzle: 0,
    captured: false,
    capPhase: '',
    capT: 0,
    capPull: 0,
    capSoak: 0,
    stealLock: 0,
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
    return G.kind !== 'frenzy';
  }
  function haste() {
    if (isCamp()) return 1 + Math.min(0.18, (G.wave - 1) * 0.03);
    return 1.28 + Math.min(0.42, (G.wave - 1) * 0.05);
  }
  function boxTop() {
    return G.captured && G.capPhase === 'free' ? CAP_T : BOX_T;
  }
  function gunOffsets() {
    if (G.guns <= 1) return [{ x: 0, y: 0 }];
    if (G.guns === 2) return [{ x: -15, y: 4 }, { x: 15, y: 4 }];
    return [{ x: -18, y: 6 }, { x: 0, y: 0 }, { x: 18, y: 6 }];
  }
  function slotX(col) {
    return FORM_X + col * CELL_X + G.formOx;
  }
  function slotY(row) {
    return FORM_Y + row * CELL_Y + Math.sin(G.t * 1.35) * 5;
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
      this.beep(G.guns > 1 ? 980 : 820, 0.05, 'square', 0.03, 1640);
    },
    hit(type, combo) {
      this.ensure();
      const base = type === 2 ? 1020 : type === 1 ? 760 : 560;
      const lift = 1 + Math.min(0.45, combo * 0.03);
      this.noise(0.032, 0.032, 1200);
      this.beep(base * lift, 0.068, 'square', 0.046, base * lift * 1.55);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(270, 0.14, 'sawtooth', 0.045, 66);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(300, 0.16, 'sawtooth', 0.05, 86);
      this.beep(170, 0.28, 'sine', 0.045, 48);
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
      this.beep(349, 0.09, 'square', 0.04, 698);
      this.beep(698, 0.14, 'triangle', 0.035, 1175);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.05, 'sine', 0.018, 80);
    },
    chip() {
      this.ensure();
      this.beep(280, 0.05, 'sawtooth', 0.028, 200);
      this.beep(720, 0.06, 'square', 0.022, 1100);
    },
    tractor() {
      this.ensure();
      this.beep(90, 0.42, 'sawtooth', 0.04, 420);
      this.beep(180, 0.36, 'sine', 0.032, 90);
      this.noise(0.1, 0.028, 700);
    },
    capture() {
      this.ensure();
      this.beep(140, 0.2, 'sawtooth', 0.05, 520);
      this.beep(520, 0.16, 'triangle', 0.04, 180);
      this.noise(0.12, 0.04, 500);
    },
    steal() {
      this.ensure();
      this.beep(880, 0.09, 'square', 0.042, 1760);
      this.beep(1320, 0.14, 'sine', 0.04, 1980);
      this.beep(660, 0.1, 'triangle', 0.03, 990);
    },
    drop() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.032, 392);
      this.beep(392, 0.12, 'triangle', 0.03, 262);
    },
    power() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 990);
      this.beep(990, 0.14, 'sine', 0.04, 1480);
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

  function modeName() {
    return isCamp() ? '编队' : '乱舞';
  }

  function gunName() {
    if (G.guns >= 3) return '三机';
    if (G.guns >= 2) return '双机';
    return '单机';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '加普';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.wave >= 5 || G.captured));
    }
    if (tagLabel) {
      let tag = modeName();
      if (G.mode === 'title') tag = 'GAP';
      else if (G.captured) tag = '夺蜂';
      else if (G.guns > 1) tag = gunName();
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.captured);
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.guns >= 2);
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
    else if (G.mode === 'win') setHint('编队肃清 · R 再来 · 空格开火', 'hot');
    else if (G.captured) setHint('撞工蜂/蜻蜂夺舰 · ↓ 坠回 · 空格开火', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 八向躲开俯冲', 'warn');
    else if (G.guns > 1) setHint(gunName() + '连射 · 护卫挡一发', 'hot');
    else setHint('八向移动 · 母舰牵引可夺蜂', isCamp() ? '' : 'hot');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GAP';
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
    const name = cls || (mag >= 6 ? 'die' : mag >= 3.5 ? 'cap' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('cap');
    stageEl.classList.remove('steal');
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
        r: rand(1.2, 2.8),
        life: rand(0.22, 0.48),
        rgb: rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 24);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.7, vy: -46, text: text, rgb: rgb });
    capArr(floats, 18);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      const roll = Math.random();
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        v: rand(18, 90),
        r: roll > 0.86 ? 1.5 : 0.7,
        a: rand(0.25, 0.85),
        p: Math.random() * TAU,
        rgb: roll > 0.7 ? VIO : roll > 0.4 ? CYN : WHT
      });
    }
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function divingCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && (e.state === 'dive' || e.state === 'tractor')) n += 1;
    }
    return n;
  }

  function someoneTractoring() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].state === 'tractor') return true;
    }
    return false;
  }

  function hitBox(e) {
    return { hw: TYPE_HW[e.type], hh: TYPE_HH[e.type] };
  }

  function makeEnemy(slot, delay, side) {
    return {
      alive: true,
      type: slot.type,
      col: slot.col,
      row: slot.row,
      hp: slot.hp,
      escort: slot.escort,
      x: side < 0 ? -24 : VW + 24,
      y: 90 + slot.row * 18,
      angle: 0,
      state: 'wait',
      delay: delay,
      wps: [],
      wpI: 0,
      nextShot: rand(0.4, 1.6),
      hitFlash: 0,
      willTractor: false,
      tractorT: 0,
      soak: 0
    };
  }

  function entryPath(side, tx, ty, k) {
    const lift = 50 + (k % 4) * 22;
    if (side < 0) {
      return [
        { x: -20, y: 110 + lift },
        { x: 70, y: 48 + (k % 3) * 16 },
        { x: 168, y: 168 },
        { x: 86, y: 248 },
        { x: tx, y: ty }
      ];
    }
    return [
      { x: VW + 20, y: 110 + lift },
      { x: 410, y: 48 + (k % 3) * 16 },
      { x: 312, y: 168 },
      { x: 394, y: 248 },
      { x: tx, y: ty }
    ];
  }

  function spawnWave() {
    G.enemies = [];
    G.bombs = [];
    G.drops = [];
    G.formed = false;
    G.formOx = 0;
    G.formDir = 1;
    G.diveCd = isCamp() ? 1.55 : 0.85;
    const groups = [
      { rows: [4], side: -1, delay: 0 },
      { rows: [3], side: 1, delay: 0.48 },
      { rows: [2], side: -1, delay: 0.96 },
      { rows: [1, 0], side: 1, delay: 1.44 }
    ];
    let k = 0;
    for (let g = 0; g < groups.length; g++) {
      const grp = groups[g];
      for (let i = 0; i < SLOTS.length; i++) {
        const sl = SLOTS[i];
        if (grp.rows.indexOf(sl.row) < 0) continue;
        const e = makeEnemy(sl, grp.delay + k * 0.045, grp.side);
        e.wps = entryPath(grp.side, slotX(sl.col), slotY(sl.row), k);
        G.enemies.push(e);
        k += 1;
      }
    }
  }

  function resetField() {
    G.shots = [];
    G.bombs = [];
    G.drops = [];
    G.ship.x = VW * 0.5;
    G.ship.y = HOME_Y;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.guns = 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.captured = false;
    G.capPhase = '';
    G.capT = 0;
    G.capPull = 0;
    G.capSoak = 0;
    G.stealLock = 0;
    G.pendingWin = false;
    G.clearT = 0;
    G.muzzle = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    spawnWave();
  }

  function followWaypoints(e, dt, spd) {
    const wp = e.wps[e.wpI];
    if (!wp) return true;
    const dx = wp.x - e.x;
    const dy = wp.y - e.y;
    const d = hypot(dx, dy);
    if (d < 7) {
      e.wpI += 1;
      return e.wpI >= e.wps.length;
    }
    e.x += (dx / d) * spd * dt;
    e.y += (dy / d) * spd * dt;
    e.angle = Math.atan2(dy, dx);
    return false;
  }

  function startDive(e, skipEscorts) {
    if (!e.alive || e.state !== 'form') return;
    e.state = 'dive';
    e.wpI = 0;
    e.nextShot = rand(0.18, 0.55);
    const aim = G.ship.x + rand(-46, 46);
    const canTractor = e.type === 2 &&
      G.mode === 'play' &&
      !G.captured &&
      G.guns < 3 &&
      G.stealLock <= 0 &&
      !someoneTractoring() &&
      Math.random() < (isCamp() ? 0.5 : 0.62);
    e.willTractor = canTractor;
    if (canTractor) {
      e.wps = [
        { x: e.x + rand(-28, 28), y: e.y + 70 },
        { x: lerp(e.x, aim, 0.45), y: 270 },
        { x: clamp(aim, 70, VW - 70), y: 348 }
      ];
    } else {
      e.wps = [
        { x: e.x + rand(-40, 40), y: e.y + 64 },
        { x: lerp(e.x, aim, 0.5), y: 360 },
        { x: aim + rand(-24, 24), y: 520 },
        { x: G.ship.x + rand(-16, 16), y: 780 }
      ];
    }
    if (!skipEscorts && e.type === 2) {
      let n = 0;
      for (let i = 0; i < G.enemies.length; i++) {
        if (n >= 2) break;
        const p = G.enemies[i];
        if (!p.alive || p.state !== 'form' || p.type === 2) continue;
        if (Math.abs(p.col - e.col) <= 1 && p.row === e.row + 1) {
          startDive(p, true);
          n += 1;
        }
      }
    }
  }

  function beginTractor(e) {
    e.state = 'tractor';
    e.tractorT = 0;
    e.soak = 0;
    audio.tractor();
    kick(3.6, 'cap');
    screenFlash(VIO, 0.38);
    toast('母舰牵引', false, false);
  }

  function inCone(px, py, e) {
    if (py < e.y + 10) return false;
    const span = 292;
    const t = (py - e.y) / span;
    if (t < 0 || t > 1.12) return false;
    const half = 14 + t * 62;
    return Math.abs(px - e.x) <= half;
  }

  function beginCapture(e) {
    G.captured = true;
    G.capPhase = 'pull';
    G.capT = 7.0;
    G.capPull = 0.48;
    G.capSoak = 0;
    G.invuln = 0.2;
    e.state = 'return';
    e.willTractor = false;
    e.wpI = 0;
    e.wps = [{ x: slotX(e.col), y: -20 }, { x: slotX(e.col), y: slotY(e.row) }];
    audio.capture();
    kick(5, 'cap');
    screenFlash(MAG, 0.62);
    burst(G.ship.x, G.ship.y, VIO, 22, 260);
    ring(G.ship.x, G.ship.y, MAG);
    toast('牵引！撞蜂夺舰 · ↓坠回', false, true);
  }

  function dropCapture() {
    if (!G.captured) return;
    G.captured = false;
    G.capPhase = '';
    G.capT = 0;
    G.invuln = 1.1;
    G.stealLock = 3.4;
    G.ship.y = clamp(G.ship.y, BOX_T, BOX_B);
    G.ship.x = clamp(G.ship.x, BOX_L, BOX_R);
    audio.drop();
    ring(G.ship.x, G.ship.y, CYN);
    if (G.guns >= 3) toast('三机连射', false, true);
    else if (G.guns >= 2) toast('双机连射', false, true);
    else toast('坠回', false, false);
  }

  function stealEnemy(e) {
    e.alive = false;
    const bonus = (e.escort ? 750 : 600) * G.mult;
    const prev = G.guns;
    G.guns = Math.min(3, G.guns + 1);
    bumpCombo();
    addScore(bonus);
    audio.steal();
    hitStop(0.055);
    kick(3.2, 'steal');
    screenFlash(GOLD, 0.42);
    burst(e.x, e.y, GOLD, 18, 280);
    burst(e.x, e.y, CYN, 10, 180);
    ring(e.x, e.y, GOLD);
    floatText(e.x, e.y - 8, e.escort ? '护卫' : '夺蜂', GOLD);
    if (G.guns > prev) {
      toast(G.guns >= 3 ? '三机连射' : '双机连射', false, true);
      floatText(G.ship.x, G.ship.y - 18, gunName(), CYN);
    }
  }

  function enemyBomb(e, spd) {
    const aim = clamp((G.ship.x - e.x) * 0.42, -90, 90);
    G.bombs.push({
      x: e.x,
      y: e.y + 10,
      vx: aim,
      vy: spd || (200 * haste())
    });
    capArr(G.bombs, 18);
  }

  function spawnDrop(x, y) {
    G.drops.push({ x: x, y: y, vy: 108, spin: 0 });
  }

  function pickDive() {
    const formed = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.state === 'form') formed.push(e);
    }
    if (!formed.length) return null;
    formed.sort(function (a, b) { return b.row - a.row || Math.random() - 0.5; });
    const wantQueen = G.guns < 3 && G.stealLock <= 0 && Math.random() < 0.34;
    if (wantQueen) {
      for (let i = 0; i < formed.length; i++) {
        if (formed[i].type === 2) return formed[i];
      }
    }
    return formed[Math.min(formed.length - 1, (Math.random() * Math.min(6, formed.length)) | 0)];
  }

  function maxDives() {
    if (!isCamp()) return Math.min(5, 3 + (G.wave > 4 ? 1 : 0));
    if (G.wave >= 6) return 3;
    return 2;
  }

  function diveCdBase() {
    return (isCamp() ? 0.92 : 0.4) / haste();
  }

  function updateFormation(dt) {
    G.formOx += G.formDir * 22 * dt;
    if (G.formOx > 28) {
      G.formOx = 28;
      G.formDir = -1;
    } else if (G.formOx < -28) {
      G.formOx = -28;
      G.formDir = 1;
    }
  }

  function updateEnemies(dt) {
    G.flapT += dt;
    if (G.flapT >= 0.34) {
      G.flapT = 0;
      G.frame += 1;
    }
    updateFormation(dt);

    let waiting = 0;
    let entering = 0;
    let formedN = 0;
    G.capSoak = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.state === 'wait') {
        waiting += 1;
        e.delay -= dt;
        if (e.delay <= 0) {
          e.state = 'enter';
          e.wpI = 0;
        }
      } else if (e.state === 'enter') {
        entering += 1;
        const done = followWaypoints(e, dt, 250 * haste());
        if (done) {
          e.state = 'form';
          e.x = slotX(e.col);
          e.y = slotY(e.row);
        }
      } else if (e.state === 'form') {
        formedN += 1;
        e.x = slotX(e.col);
        e.y = slotY(e.row);
        e.angle = 0;
        e.nextShot -= dt;
        if (e.nextShot <= 0 && G.mode === 'play' && G.ready <= 0 && Math.random() < 0.12) {
          if (e.row >= 3 && Math.abs(e.x - G.ship.x) < 50) {
            enemyBomb(e, 180 * haste());
            e.nextShot = rand(2.4, 4.2);
          } else e.nextShot = rand(0.8, 2.2);
        }
      } else if (e.state === 'dive') {
        const spd = (e.willTractor ? 210 : 255) * haste();
        const done = followWaypoints(e, dt, spd);
        e.nextShot -= dt;
        if (e.nextShot <= 0 && G.mode === 'play') {
          enemyBomb(e, 210 * haste());
          e.nextShot = rand(0.55, 1.15) / haste();
        }
        if (done) {
          if (e.willTractor && e.y < 420) beginTractor(e);
          else {
            e.state = 'return';
            e.wpI = 0;
            e.wps = [{ x: slotX(e.col), y: -18 }, { x: slotX(e.col), y: slotY(e.row) }];
            e.y = -18;
            e.x = slotX(e.col);
          }
        } else if (e.y > VH + 24) {
          e.state = 'return';
          e.wpI = 0;
          e.wps = [{ x: slotX(e.col), y: -18 }, { x: slotX(e.col), y: slotY(e.row) }];
          e.y = -18;
          e.x = slotX(e.col);
        }
      } else if (e.state === 'tractor') {
        e.tractorT += dt;
        e.x += Math.sin(G.t * 6) * 8 * dt;
        if (G.mode === 'play' && !G.captured && G.deadT <= 0 && G.invuln <= 0) {
          if (inCone(G.ship.x, G.ship.y, e)) {
            e.soak += dt;
            G.capSoak = e.soak;
            if (e.soak >= 0.5) beginCapture(e);
          } else e.soak = Math.max(0, e.soak - dt * 0.7);
        }
        if (e.state === 'tractor' && e.tractorT >= 3.05) {
          e.state = 'dive';
          e.willTractor = false;
          e.wpI = 0;
          e.wps = [
            { x: e.x, y: 460 },
            { x: G.ship.x, y: 780 }
          ];
        }
      } else if (e.state === 'return') {
        if (followWaypoints(e, dt, 300) || hypot(e.x - slotX(e.col), e.y - slotY(e.row)) < 8) {
          e.state = 'form';
          e.x = slotX(e.col);
          e.y = slotY(e.row);
        }
      }
    }

    G.formed = waiting === 0 && entering === 0 && formedN > 0;

    if (G.mode === 'play' && G.ready <= 0 && G.formed && !G.captured) {
      G.diveCd -= dt;
      if (G.diveCd <= 0 && divingCount() < maxDives()) {
        const pick = pickDive();
        if (pick) startDive(pick, false);
        G.diveCd = diveCdBase() * rand(0.7, 1.15);
      }
    }
  }

  function damageEnemy(e) {
    const diving = e.state === 'dive' || e.state === 'tractor';
    e.hp -= 1;
    e.hitFlash = 0.08;
    if (e.hp > 0) {
      audio.chip();
      spark(e.x, e.y, TYPE_RGB_HIT[e.type]);
      bumpCombo();
      addScore(TYPE_CHIP[e.type] * G.mult);
      hitStop(0.028);
      kick(1.6, 'hit');
      return;
    }
    explodeEnemy(e, diving);
  }

  function explodeEnemy(e, diving) {
    e.alive = false;
    const pts = (diving ? TYPE_SCORE_DIVE[e.type] : TYPE_SCORE_FORM[e.type]) * G.mult;
    bumpCombo();
    addScore(pts);
    audio.hit(e.type, G.combo);
    const rgb = TYPE_RGB[e.type];
    burst(e.x, e.y, rgb, e.type === 2 ? 20 : 12, e.type === 2 ? 300 : 220);
    spark(e.x, e.y, rgb);
    if (e.type === 2) ring(e.x, e.y, MAG);
    floatText(e.x, e.y - 6, String(pts), rgb);
    hitStop(e.type === 2 ? 0.08 : e.type === 1 ? 0.052 : 0.038);
    kick(e.type === 2 ? 3.4 : 2.1, 'hit');
    if (diving && e.type === 2 && G.guns < 3 && Math.random() < 0.42) spawnDrop(e.x, e.y);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.captured && G.capPhase === 'pull') return;
    if (G.fireCd > 0) return;
    const offs = gunOffsets();
    const max = G.guns * 2;
    if (G.shots.length + offs.length > max) return;
    for (let i = 0; i < offs.length; i++) {
      G.shots.push({
        x: G.ship.x + offs[i].x,
        y: G.ship.y + offs[i].y - 12,
        vy: -SHOT_V
      });
    }
    G.fireCd = 0.125;
    G.muzzle = 0.07;
    audio.shoot();
    if (!REDUCE) {
      burst(G.ship.x, G.ship.y - 14, CYN, 3, 80);
    }
  }

  function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp(pointer.x, BOX_L, BOX_R);
      const ty = clamp(pointer.y, boxTop(), BOX_B);
      dx = tx - G.ship.x;
      dy = ty - G.ship.y;
      const d = hypot(dx, dy);
      if (d > 3) {
        const spd = SHIP_SPD * (G.captured ? 1.08 : 1);
        const step = Math.min(d, spd * dt);
        G.ship.vx = (dx / d) * spd;
        G.ship.vy = (dy / d) * spd;
        G.ship.x += (dx / d) * step;
        G.ship.y += (dy / d) * step;
      } else {
        G.ship.vx *= 0.6;
        G.ship.vy *= 0.6;
      }
    } else {
      dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      dy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
      const len = hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const spd = SHIP_SPD * (G.captured ? 1.08 : 1);
      G.ship.vx = dx * spd;
      G.ship.vy = dy * spd;
      G.ship.x += G.ship.vx * dt;
      G.ship.y += G.ship.vy * dt;
    }

    if (G.captured && G.capPhase === 'pull') {
      let bx = G.ship.x;
      let by = 200;
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (e.alive && e.type === 2) {
          bx = e.x;
          by = e.y + 40;
          break;
        }
      }
      G.ship.x = lerp(G.ship.x, bx, 1 - Math.exp(-dt * 7));
      G.ship.y = lerp(G.ship.y, by, 1 - Math.exp(-dt * 6));
    } else {
      G.ship.x = clamp(G.ship.x, BOX_L, BOX_R);
      G.ship.y = clamp(G.ship.y, boxTop(), BOX_B);
    }
  }

  function updateCapture(dt) {
    if (!G.captured) return;
    if (G.capPhase === 'pull') {
      G.capPull -= dt;
      if (G.capPull <= 0) G.capPhase = 'free';
      return;
    }
    G.capT -= dt;
    if (G.capT <= 0) {
      dropCapture();
      return;
    }
    if (inputSrc === 'ptr' && pointer.down && G.ship.y >= BOX_T + 10 && G.capT < 6.2) {
      dropCapture();
      return;
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const d = hypot(e.x - G.ship.x, e.y - G.ship.y);
      if (e.type === 2) {
        if (d < 20 && G.invuln <= 0) {
          killPlayer('ram');
          return;
        }
      } else if (d < 18) {
        stealEnemy(e);
        if (G.guns >= 3) {
          dropCapture();
          return;
        }
      }
    }
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
      const rad = G.guns > 1 ? 16 : 12;
      if (Math.abs(b.x - G.ship.x) < rad && Math.abs(b.y - G.ship.y) < 12) {
        G.bombs.splice(i, 1);
        killPlayer('shot');
      }
    }
  }

  function updateDrops(dt) {
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.y += d.vy * dt;
      d.spin += dt * 6;
      if (d.y > VH + 12) {
        G.drops.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && Math.abs(d.x - G.ship.x) < 16 && Math.abs(d.y - G.ship.y) < 16) {
        G.drops.splice(i, 1);
        if (G.guns < 3) G.guns += 1;
        addScore(200 * G.mult);
        audio.power();
        ring(G.ship.x, G.ship.y, GOLD);
        burst(G.ship.x, G.ship.y, GOLD, 12, 180);
        toast(gunName() + '连射', false, true);
        kick(2.4, 'steal');
      }
    }
  }

  function collideBodies() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.captured) return;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.state !== 'dive' && e.state !== 'tractor') continue;
      if (e.y < G.ship.y - 26) continue;
      const rad = G.guns > 1 ? 18 : 15;
      if (Math.abs(e.x - G.ship.x) < rad && Math.abs(e.y - G.ship.y) < 14) {
        explodeEnemy(e, true);
        killPlayer('ram');
        return;
      }
    }
  }

  function absorbOrDie() {
    if (G.guns > 1) {
      G.guns -= 1;
      G.invuln = 0.85;
      audio.explode();
      burst(G.ship.x, G.ship.y, MAG, 16, 240);
      ring(G.ship.x, G.ship.y, MAG);
      toast(G.guns >= 2 ? '护卫解体' : '单机', true, false);
      kick(4, 'hit');
      screenFlash(MAG, 0.4);
      hitStop(0.06);
      return true;
    }
    return false;
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0 && why !== 'ram') return;
    if (G.captured) {
      G.captured = false;
      G.capPhase = '';
      G.guns = 1;
    } else if (absorbOrDie()) {
      return;
    }
    G.why = why;
    G.deadT = 0.95;
    G.lives -= 1;
    G.guns = 1;
    G.fireHold = false;
    G.shots = [];
    audio.death();
    burst(G.ship.x, G.ship.y, MAG, 28, 340);
    burst(G.ship.x, G.ship.y, CYN, 12, 180);
    ring(G.ship.x, G.ship.y, MAG);
    kick(7, 'die');
    screenFlash(MAG, 0.55);
    hitStop(0.07);
    syncPips();
  }

  function winRun() {
    addScore(8000);
    G.mode = 'win';
    G.pendingWin = false;
    audio.win();
    kick(4, 'steal');
    screenFlash(GOLD, 0.5);
    const lead = '加普肃清  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('win', '加普肃清', lead, '再来', '乱舞');
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.fireHold = false;
    audio.lose();
    const lead = (why === 'ram' ? '被撞上了' : '中弹了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '舰毁了', lead, '再来', '换模式');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'frenzy' ? 'frenzy' : 'camp';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.next1up = 20000;
    G.why = '';
    G.clock = 0;
    resetField();
    G.ready = 0.7;
    hideOverlay();
    audio.start();
    toast(isCamp() ? '编队 · 六波清场' : '乱舞 · 俯冲加快', false, !isCamp());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'camp';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    resetField();
    G.ready = 0;
    showOverlay(
      'title',
      '加普',
      '八向游走，母舰牵引。被俘后撞工蜂夺舰，双机三机连射。清波过关。',
      '编队',
      '乱舞'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('camp');
    else startGame(G.kind || 'camp');
  }

  function onWaveClear() {
    const bonus = (250 * G.wave) * Math.max(1, G.mult);
    addScore(bonus);
    audio.wave();
    ring(VW * 0.5, 180, GOLD);
    if (isCamp() && G.wave >= CAMP_WAVES) {
      G.pendingWin = true;
      G.clearT = 0.35;
      toast('编队肃清', false, true);
      return;
    }
    G.wave += 1;
    G.ready = 0.9;
    spawnWave();
    toast('第 ' + G.wave + ' 波', false, !isCamp());
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    G.stealLock = Math.max(0, G.stealLock - dt);
    updatePlayer(dt);
    if (G.captured) updateCapture(dt);
    if ((G.fireHold || pointer.down) && G.mode === 'play') fire();
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateBombs(dt);
      updateDrops(dt);
      return;
    }
    updateEnemies(dt);
    updateShots(dt);
    updateBombs(dt);
    updateDrops(dt);
    collideBodies();
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
    const starMul = isCamp() ? 0.32 : 0.48;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.v * dt * starMul;
      if (s.y > VH) s.y = 0;
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
      if (aliveCount() === 0) spawnWave();
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
      updateDrops(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '舰毁了');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = HOME_Y;
        G.invuln = 1.55;
        G.bombs = [];
        G.captured = false;
        G.capPhase = '';
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && G.ready <= 0 && aliveCount() === 0 && !G.pendingWin) onWaveClear();

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
    g.addColorStop(0, '#1c0830');
    g.addColorStop(0.45, '#14061c');
    g.addColorStop(1, '#0a0312');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(120), 16 * scale, sx(240), sy(280), 380 * scale);
    vg.addColorStop(0, 'rgba(196, 77, 255, 0.16)');
    vg.addColorStop(0.55, 'rgba(255, 61, 184, 0.05)');
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

    const top = G.captured && G.capPhase === 'free' ? CAP_T : BOX_T;
    ctx.save();
    ctx.strokeStyle = rgba(PUR, G.captured ? 0.55 : 0.28);
    ctx.lineWidth = 1.2 * scale;
    ctx.setLineDash([6 * scale, 5 * scale]);
    ctx.strokeRect(sx(BOX_L - 6), sy(top - 8), (BOX_R - BOX_L + 12) * scale, (BOX_B - top + 16) * scale);
    ctx.restore();

    ctx.fillStyle = 'rgba(196, 77, 255, 0.2)';
    ctx.fillRect(sx(10), sy(BOX_B + 4), (VW - 20) * scale, 2 * scale);
  }

  function drawTractor(e) {
    const pulse = 0.5 + 0.5 * Math.sin(G.t * 18);
    const top = e.y + 10;
    const bot = e.y + 292;
    const halfTop = 12;
    const halfBot = 74;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(sx(e.x - halfTop), sy(top));
    ctx.lineTo(sx(e.x + halfTop), sy(top));
    ctx.lineTo(sx(e.x + halfBot), sy(bot));
    ctx.lineTo(sx(e.x - halfBot), sy(bot));
    ctx.closePath();
    ctx.fillStyle = rgba(VIO, 0.1 + pulse * 0.12);
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, 0.42 + pulse * 0.38);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const yy = top + ((G.t * 150 + i * 42) % 292);
      const t = (yy - top) / 292;
      const h = lerp(halfTop, halfBot, t);
      ctx.fillStyle = rgba(i % 2 ? CYN : MAG, 0.16 + pulse * 0.1);
      ctx.fillRect(sx(e.x - h), sy(yy), h * 2 * scale, 3 * scale);
    }
    ctx.restore();
  }

  function drawEnemies() {
    const fi = G.frame & 1;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state === 'wait') continue;
      if (e.state === 'tractor') drawTractor(e);
      let rgb = TYPE_RGB[e.type];
      if (e.hitFlash > 0) rgb = TYPE_RGB_HIT[e.type];
      else if (e.escort) rgb = e.type === 0 ? GOLD : [120, 255, 230];
      const rows = SPR[e.type][fi];
      const cell = e.type === 2 ? 2.15 : 2;
      const a = e.state === 'enter' ? 0.92 : 1;
      drawSprite(e.x, e.y, rows, rgb, cell, a);
      if (e.type === 2 && e.hp > 1) {
        ctx.fillStyle = rgba(WHT, 0.7);
        ctx.fillRect(sx(e.x - 3), sy(e.y - 2), 6 * scale, 2 * scale);
      }
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 8), 2.8 * scale, 11 * scale);
      ctx.fillStyle = rgba(G.guns > 1 ? GOLD : CYN, 0.7);
      ctx.fillRect(sx(s.x - 1), sy(s.y - 4), 2 * scale, REDUCE ? 8 * scale : 16 * scale);
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), 2.6 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.55);
      ctx.fillRect(sx(b.x - 0.7), sy(b.y - 5), 1.4 * scale, 6 * scale);
    }
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      ctx.save();
      ctx.translate(sx(d.x), sy(d.y));
      ctx.rotate(d.spin);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -7 * scale);
      ctx.lineTo(7 * scale, 0);
      ctx.lineTo(0, 7 * scale);
      ctx.lineTo(-7 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const offs = gunOffsets();
    const tilt = clamp(G.ship.vx / 320, -0.35, 0.35);
    const rows = G.captured ? SPR_SHIP_CAP : SPR_SHIP;
    const rgb = G.captured ? MAG : (G.guns > 1 ? CYN : WHT);
    ctx.save();
    for (let i = 0; i < offs.length; i++) {
      ctx.save();
      ctx.translate(sx(G.ship.x + offs[i].x), sy(G.ship.y + offs[i].y));
      ctx.rotate(tilt);
      ctx.translate(-sx(G.ship.x + offs[i].x), -sy(G.ship.y + offs[i].y));
      drawSprite(G.ship.x + offs[i].x, G.ship.y + offs[i].y, rows, i === 1 && G.guns === 3 ? GOLD : rgb, 2.05, 1);
      ctx.restore();
    }
    if (G.muzzle > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, G.muzzle * 8);
      for (let i = 0; i < offs.length; i++) {
        ctx.beginPath();
        ctx.arc(sx(G.ship.x + offs[i].x), sy(G.ship.y + offs[i].y - 14), 5 * scale, 0, TAU);
        ctx.fill();
      }
    }
    if (G.captured || G.capSoak > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const glow = G.captured ? 0.45 + 0.3 * Math.sin(G.t * 10) : 0.25 + G.capSoak * 0.9;
      ctx.strokeStyle = rgba(MAG, glow);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(G.ship.x), sy(G.ship.y), (16 + Math.sin(G.t * 8) * 3) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
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
    ctx.fillStyle = '#0a0312';
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
    ctx.fillStyle = '#0a0312';
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

  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return (y - oy) / scale;
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
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      if (down && G.captured && G.capPhase === 'free') dropCapture();
      return;
    }
    if (space) {
      if (down) e.preventDefault();
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
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'frenzy' : 'camp');
      return;
    }
    if (space || k === 'Enter') {
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
      pointer.x = clamp(pointerWorldX(e), BOX_L, BOX_R);
      pointer.y = clamp(pointerWorldY(e), boxTop(), BOX_B);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), BOX_L, BOX_R);
      pointer.y = clamp(pointerWorldY(e), boxTop(), BOX_B);
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
      else if (G.mode === 'win') startGame('frenzy');
      else startGame('frenzy');
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
      keys.u = false;
      keys.d = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
