'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const PLAYER_Y = 658;
  const BOX_L = 18;
  const BOX_R = 462;
  const SHOT_V = 640;
  const SHIP_SPD = 300;
  const COMBO_WIN = 1.48;
  const CELL_X = 38;
  const CELL_Y = 30;
  const FORM_X = 69;
  const FORM_Y = 70;
  const COLS = 10;
  const MAX_WAVE = 5;
  const BEST_KEY = 'playbox-galaxian-best';
  const MUTE_KEY = 'playbox-galaxian-mute';
  const OPS = '← → / WASD 移动 · 空格开火 · R 重开 · M 静音';
  const WAVE_NAME = ['', '金湾', '赤廊', '裂翼', '坠旗', '星王'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 200];
  const GOLD = [255, 233, 74];
  const HOT = [200, 224, 32];
  const TEAL = [126, 224, 74];
  const WHT = [244, 248, 222];
  const PNK = [255, 140, 200];
  const PUR = [176, 112, 255];
  const ORG = [255, 170, 48];

  const TYPE_RGB = [CYN, PUR, MAG, GOLD];
  const TYPE_HW = [11, 12, 13, 15];
  const TYPE_HH = [8, 8, 9, 10];
  const TYPE_SCORE_FORM = [30, 40, 50, 150];
  const TYPE_SCORE_DIVE = [60, 80, 100, 200];

  const GUARD_POS = [
    { x: 132, y: 164 },
    { x: 188, y: 150 },
    { x: 292, y: 150 },
    { x: 348, y: 164 },
    { x: 156, y: 208 },
    { x: 240, y: 220 },
    { x: 324, y: 208 }
  ];
  const GUARD_CORE = GUARD_POS.concat([
    { x: 100, y: 190 },
    { x: 380, y: 190 }
  ]);

  const SPR = [
    [
      [
        '  #    #  ',
        '   ####   ',
        ' ######## ',
        '## #### ##',
        ' ######## ',
        '  # ## #  ',
        ' #      # '
      ],
      [
        '#  #  #  #',
        '   ####   ',
        ' ######## ',
        '## #### ##',
        ' ######## ',
        ' #  ##  # ',
        '          '
      ]
    ],
    [
      [
        ' #      # ',
        '## #### ##',
        '##########',
        '  ##  ##  ',
        ' ## ## ## ',
        '#  ####  #',
        '  #    #  '
      ],
      [
        '  #    #  ',
        '# ##  ## #',
        '##########',
        '  ##  ##  ',
        ' ## ## ## ',
        ' # #### # ',
        '#        #'
      ]
    ],
    [
      [
        '##      ##',
        ' ###  ### ',
        '##########',
        '## #### ##',
        ' ######## ',
        '  # ## #  ',
        ' ##    ## '
      ],
      [
        '  #    #  ',
        '##      ##',
        '##########',
        '## #### ##',
        ' ######## ',
        '#  #  #  #',
        ' #      # '
      ]
    ],
    [
      [
        '  #    #    #  ',
        ' ## ## ## ##   ',
        '###############',
        '##  #######  ##',
        ' ############# ',
        '  ### ### ###  ',
        '   #  ###  #   ',
        '      ###      '
      ],
      [
        '#   #     #   #',
        ' ## ## ## ##   ',
        '###############',
        '##  #######  ##',
        ' ############# ',
        ' ###  ###  ### ',
        '#  #  ###  #  #',
        '      ###      '
      ]
    ]
  ];

  const SPR_KING = [
    [
      '   #      #      #   ',
      '  ## ##  ###  ## ##  ',
      ' ################### ',
      '##   ###########   ##',
      '  #################  ',
      '  #### ### ### ####  ',
      '   ##   #####   ##   ',
      '  #      ###      #  ',
      '         ###         ',
      '          #          '
    ],
    [
      ' #    #       #    # ',
      '  ## ##  ###  ## ##  ',
      ' ################### ',
      '##   ###########   ##',
      '  #################  ',
      ' ####  ### ###  #### ',
      '#  ##   #####   ##  #',
      '         ###         ',
      '        #####        ',
      '          #          '
    ]
  ];

  const SPR_SHIP = [
    '     ##     ',
    '    ####    ',
    '   ##  ##   ',
    '  ########  ',
    ' ## #### ## ',
    '############',
    '  ##    ##  '
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnRaid = document.getElementById('btn-raid');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const convoyEl = document.getElementById('convoy-label');
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

  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: PLAYER_Y, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'raid',
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
    ship: { x: VW * 0.5, y: PLAYER_Y },
    formOx: 0,
    formDir: 1,
    formOy: 0,
    formed: false,
    diveCd: 1.2,
    fireCd: 0,
    fireHold: false,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    toastT: 0,
    why: '',
    flapT: 0,
    muzzle: 0,
    pendingWin: false,
    clearT: 0,
    convoySeq: 0,
    kingPhase: 0,
    escortCd: 0,
    kingSpawned: 0,
    total: 0
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
  function isCore() {
    return G.kind === 'core';
  }
  function isKingWave() {
    return G.wave === MAX_WAVE;
  }
  function haste() {
    const base = isCore() ? 1.24 : 1;
    return base + Math.min(0.24, (G.wave - 1) * 0.05);
  }
  function modeName() {
    return isCore() ? '星核' : '加星';
  }
  function waveTitle(w) {
    return WAVE_NAME[w] || ('第 ' + w + ' 波');
  }
  function maxShots() {
    return isCore() ? 2 : 1;
  }
  function maxBombs() {
    return isCore() ? 6 : 4;
  }
  function guardTable() {
    return isCore() ? GUARD_CORE : GUARD_POS;
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
      this.beep(880, 0.048, 'square', 0.03, 1760);
    },
    hit(type, combo) {
      this.ensure();
      const base = type === 4 ? 260 : type === 3 ? 980 : type === 2 ? 740 : type === 1 ? 620 : 540;
      const lift = 1 + Math.min(0.45, combo * 0.03);
      this.noise(0.03, 0.03, 1200);
      this.beep(base * lift, 0.066, 'square', 0.044, base * lift * 1.55);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.048, 480);
      this.beep(260, 0.14, 'sawtooth', 0.042, 66);
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
    dive() {
      this.ensure();
      this.beep(220, 0.16, 'sawtooth', 0.032, 620);
      this.beep(140, 0.2, 'sine', 0.028, 90);
    },
    peel() {
      this.ensure();
      this.beep(480, 0.09, 'triangle', 0.03, 1100);
      this.beep(720, 0.08, 'square', 0.018, 1600);
    },
    flag() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.045, 1320);
      this.beep(990, 0.14, 'triangle', 0.04, 1760);
      this.beep(440, 0.1, 'sine', 0.03, 880);
    },
    bossHit() {
      this.ensure();
      this.beep(220, 0.05, 'sawtooth', 0.03, 160);
      this.beep(640, 0.06, 'square', 0.028, 980);
    },
    kingDive() {
      this.ensure();
      this.beep(90, 0.28, 'sawtooth', 0.04, 380);
      this.beep(180, 0.22, 'triangle', 0.03, 90);
      this.noise(0.08, 0.03, 600);
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
      floatText(G.ship.x, G.ship.y - 36, G.mult + ' 链', GOLD);
      hitStop(0.04);
    }
  }

  function breakCombo() {
    if (G.combo <= 0) return;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
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

  function activeConvoy() {
    let best = null;
    let nBest = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state !== 'dive' && e.state !== 'hold') continue;
      if (e.type !== 3 && !e.isKing) continue;
      const n = convoyEscorts(e.convoy);
      if (n > nBest) {
        nBest = n;
        best = e;
      }
    }
    return best && nBest > 0 ? { e: best, n: nBest } : null;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '加星';
      else if (isKingWave() && G.mode === 'play') stageLabel.textContent = '星王';
      else stageLabel.textContent = '第 ' + G.wave + ' 波 ' + (WAVE_NAME[G.wave] || '');
      stageLabel.classList.toggle('hot', isKingWave() && G.mode === 'play');
    }
    if (tagLabel) {
      tagLabel.textContent = G.mode === 'title' ? 'GLXN' : modeName();
      tagLabel.classList.toggle('warn', G.deadT > 0);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    const conv = activeConvoy();
    if (convoyEl) {
      if (G.mode === 'play' && conv) {
        convoyEl.hidden = false;
        convoyEl.textContent = conv.e.isKing
          ? '星王编队 ×' + conv.n
          : (conv.n >= 2 ? '双护旗舰' : '单护旗舰');
        convoyEl.classList.add('hot');
      } else {
        convoyEl.hidden = true;
        convoyEl.classList.remove('hot');
      }
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint('编队悬停 · 旗舰甩开护卫 · 四波见星王', '');
    else if (isKingWave()) setHint('星王俯冲 · 护卫甩开 · 撞机扣命', 'hot');
    else if (conv) setHint(conv.n >= 2 ? '双护旗舰 · 先打旗舰拿 800' : '旗舰俯冲 · 护卫甩开', 'hot');
    else setHint('← → 移动 · 空格开火 · 击坠带护卫的旗舰', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GLXN';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const start = kind === 'title';
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', start);
    if (btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else if (kind === 'win') btnOvModes.textContent = isCore() ? '换模式' : '星核';
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.006));
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
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 14);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.7, vy: -46, text: text, rgb: rgb });
    capArr(floats, 18);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 96; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.7 : 1.3,
        a: rand(0.22, 0.9),
        p: rand(0, TAU),
        v: rand(10, 42),
        rgb: Math.random() < 0.18 ? GOLD : Math.random() < 0.1 ? MAG : Math.random() < 0.12 ? HOT : WHT
      });
    }
  }

  function slotPos(e) {
    if (e.isKing) {
      return { x: 240 + Math.sin(G.t * 0.7) * 8, y: 118 };
    }
    if (e.guardI >= 0) {
      const t = guardTable();
      const g = t[e.guardI] || t[0];
      return {
        x: g.x + G.formOx * 0.35,
        y: g.y + G.formOy
      };
    }
    return {
      x: FORM_X + e.col * CELL_X + G.formOx,
      y: FORM_Y + e.row * CELL_Y + G.formOy
    };
  }

  function enemyRgb(e) {
    if (e.hitFlash > 0) return WHT;
    if (e.isKing) return e.hp < e.maxHp * 0.4 ? ORG : GOLD;
    return TYPE_RGB[e.type] || GOLD;
  }

  function hitBox(e) {
    if (e.isKing) return { hw: 28, hh: 18 };
    return { hw: TYPE_HW[e.type] || 11, hh: TYPE_HH[e.type] || 8 };
  }

  function makeEnemy(slot) {
    const p = slot.guardI >= 0
      ? { x: (guardTable()[slot.guardI] || GUARD_POS[0]).x, y: (guardTable()[slot.guardI] || GUARD_POS[0]).y }
      : { x: FORM_X + slot.col * CELL_X, y: FORM_Y + slot.row * CELL_Y };
    return {
      type: slot.type,
      col: slot.col || 0,
      row: slot.row || 0,
      hp: slot.hp || 1,
      maxHp: slot.hp || 1,
      x: p.x,
      y: p.y,
      state: slot.isKing ? 'hover' : 'form',
      alive: true,
      escort: false,
      role: '',
      convoy: 0,
      peeled: false,
      peelDir: 0,
      shotLeft: 0,
      nextShot: 0,
      hitFlash: 0,
      isKing: !!slot.isKing,
      guardI: slot.guardI == null ? -1 : slot.guardI,
      hold: 0,
      diveT: 0,
      wps: null,
      wpI: 0,
      ang: 0
    };
  }

  function buildSlots(wave, core) {
    const out = [];
    function row(type, cols, r, col0) {
      const c0 = col0 == null ? Math.floor((COLS - cols) / 2) : col0;
      for (let i = 0; i < cols; i++) out.push({ type: type, col: c0 + i, row: r, hp: 1 });
    }
    function flags(cols, r) {
      for (let i = 0; i < cols.length; i++) out.push({ type: 3, col: cols[i], row: r, hp: 1 });
    }
    if (wave === 1) {
      flags(core ? [2, 3, 6, 7] : [3, 6], 0);
      row(2, core ? 8 : 6, 1);
      row(1, 8, 2);
      row(0, 10, 3, 0);
      row(0, 10, 4, 0);
      if (core) row(0, 10, 5, 0);
    } else if (wave === 2) {
      flags(core ? [1, 3, 6, 8] : [2, 4, 5, 7], 0);
      row(2, 8, 1);
      row(1, 10, 2, 0);
      row(0, 10, 3, 0);
      row(0, 10, 4, 0);
      if (core) row(1, 10, 5, 0);
    } else if (wave === 3) {
      flags([2, 3, 6, 7], 0);
      row(2, core ? 10 : 8, 1, core ? 0 : 1);
      row(1, 10, 2, 0);
      row(0, 10, 3, 0);
      row(0, 10, 4, 0);
      if (core) row(0, 10, 5, 0);
    } else {
      flags(core ? [1, 2, 7, 8] : [2, 3, 6, 7], 0);
      row(2, 10, 1, 0);
      row(1, 10, 2, 0);
      row(0, 10, 3, 0);
      row(0, 10, 4, 0);
      if (core) row(2, 8, 5);
    }
    return out;
  }

  function spawnKing() {
    const hp = isCore() ? 96 : 72;
    const king = makeEnemy({ type: 3, col: 4, row: 0, hp: hp, isKing: true });
    king.isKing = true;
    king.type = 4;
    king.hp = hp;
    king.maxHp = hp;
    king.state = 'hover';
    king.x = 240;
    king.y = 118;
    king.nextShot = 1.05;
    king.diveCd = 2.2;
    G.enemies.push(king);
    const table = guardTable();
    for (let i = 0; i < table.length; i++) {
      const e = makeEnemy({ type: 2, col: 2 + (i % 6), row: 1 + (i % 2), hp: 1, guardI: i });
      e.state = 'form';
      e.x = table[i].x;
      e.y = table[i].y;
      G.enemies.push(e);
    }
    G.kingPhase = 0;
    G.escortCd = 3.4;
    G.kingSpawned = 0;
  }

  function spawnWave() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.formed = false;
    G.formOx = 0;
    G.formDir = 1;
    G.formOy = 0;
    G.diveCd = 1.35;
    G.pendingWin = false;
    G.clearT = 0;
    G.kingPhase = 0;
    G.kingSpawned = 0;
    G.convoySeq = 0;

    if (isKingWave()) {
      spawnKing();
      G.formed = true;
      G.total = G.enemies.length;
      return;
    }

    const slots = buildSlots(G.wave, isCore());
    for (let i = 0; i < slots.length; i++) {
      G.enemies.push(makeEnemy(slots[i]));
    }
    G.formed = true;
    G.total = G.enemies.length;
  }

  function resetField() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.ship.x = VW * 0.5;
    G.ship.y = PLAYER_Y;
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
    G.muzzle = 0;
    G.pendingWin = false;
    G.clearT = 0;
    G.next1up = 20000;
    spawnWave();
  }

  function followWaypoints(e, dt, spd) {
    if (!e.wps || e.wpI >= e.wps.length) return true;
    const tgt = e.wps[e.wpI];
    const dx = tgt.x - e.x;
    const dy = tgt.y - e.y;
    const d = hypot(dx, dy);
    const step = spd * dt;
    if (d <= step || d < 1.6) {
      e.x = tgt.x;
      e.y = tgt.y;
      e.wpI += 1;
      return e.wpI >= e.wps.length;
    }
    e.x += (dx / d) * step;
    e.y += (dy / d) * step;
    e.ang = Math.atan2(dy, dx);
    return false;
  }

  function diveSpeed() {
    return (255 + G.wave * 18) * haste();
  }

  function returnSpeed() {
    return (210 + G.wave * 8) * haste();
  }

  function divePath(e) {
    const side = e.x < VW * 0.5 ? -1 : 1;
    const px = G.ship.x;
    if (e.isKing) {
      return [
        { x: e.x + side * 28, y: e.y - 18 },
        { x: e.x + side * 110, y: e.y + 48 },
        { x: lerp(e.x, px, 0.3) - side * 80, y: 230 },
        { x: px + side * 24, y: 360 },
        { x: px - side * 70, y: 510 },
        { x: px + side * 18, y: 640 },
        { x: px - side * 12, y: 800 }
      ];
    }
    if (e.type === 3) {
      return [
        { x: e.x + side * 18, y: e.y - 22 },
        { x: e.x + side * 78, y: e.y + 36 },
        { x: lerp(e.x, px, 0.35) - side * 56, y: 210 },
        { x: px + side * 16, y: 340 },
        { x: px - side * 48, y: 500 },
        { x: px + side * 10, y: 640 },
        { x: px - side * 20, y: 790 }
      ];
    }
    return [
      { x: e.x + side * 36, y: e.y - 10 },
      { x: e.x + side * 64, y: e.y + 70 },
      { x: lerp(e.x, px, 0.45) + side * 24, y: 300 },
      { x: px - side * 36, y: 460 },
      { x: px + side * 18, y: 620 },
      { x: px, y: 790 }
    ];
  }

  function peelPath(e) {
    const dir = e.peelDir || (e.x < G.ship.x ? -1 : 1);
    const px = G.ship.x;
    return [
      { x: e.x + dir * 72, y: e.y + 28 },
      { x: px + dir * 118, y: 420 },
      { x: px + dir * 52, y: 580 },
      { x: px + dir * 22, y: 800 }
    ];
  }

  function startDive(e, cid, delay, role, peelDir) {
    if (!e.alive) return;
    if (e.state !== 'form' && e.state !== 'hover') return;
    e.state = delay > 0 ? 'hold' : 'dive';
    e.hold = delay;
    e.convoy = cid || 0;
    e.role = role || '';
    e.peeled = false;
    e.peelDir = peelDir || 0;
    e.diveT = 0;
    e.shotLeft = e.isKing ? 5 : e.type === 3 ? 3 : e.type === 2 ? 2 : 1 + (G.wave > 2 ? 1 : 0);
    e.nextShot = rand(0.18, 0.46) + delay;
    e.wps = divePath(e);
    e.wpI = 0;
    e.escort = role === 'escort';
  }

  function pickEscorts(boss, n, cid) {
    const cands = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state !== 'form' || e.isKing) continue;
      if (e.type !== 2) continue;
      cands.push(e);
    }
    cands.sort(function (a, b) {
      return hypot(a.x - boss.x, a.y - boss.y) - hypot(b.x - boss.x, b.y - boss.y);
    });
    const take = Math.min(n, cands.length);
    for (let i = 0; i < take; i++) {
      const dir = take === 1 ? (cands[i].x < boss.x ? -1 : 1) : (i === 0 ? -1 : 1);
      startDive(cands[i], cid, 0.08 + i * 0.09, 'escort', dir);
    }
    return take;
  }

  function startFlagshipDive(flag) {
    const cid = ++G.convoySeq;
    const want = (G.wave >= 2 || isCore()) ? 2 : 1;
    startDive(flag, cid, 0, 'flag', 0);
    const n = pickEscorts(flag, want, cid);
    if (G.mode === 'play') {
      audio.dive();
      if (n >= 2) {
        toast('旗舰双护俯冲', false, true);
        if (convoyEl) {
          convoyEl.classList.remove('hot');
          void convoyEl.offsetWidth;
          convoyEl.classList.add('hot');
        }
      }
    }
  }

  function startKingDive(king) {
    const cid = ++G.convoySeq;
    startDive(king, cid, 0, 'flag', 0);
    king.state = 'dive';
    const n = pickEscorts(king, isCore() ? 6 : 4, cid);
    if (n < (isCore() ? 4 : 3) && G.kingSpawned < (isCore() ? 4 : 3)) {
      spawnHonor(isCore() ? 3 : 2, cid);
    }
    audio.kingDive();
    if (G.mode === 'play') {
      toast('星王俯冲', true, false);
      screenFlash(GOLD, 0.22);
      kick(2.4);
    }
  }

  function spawnHonor(n, cid) {
    const table = guardTable();
    let made = 0;
    for (let i = 0; i < table.length && made < n; i++) {
      let used = false;
      for (let j = 0; j < G.enemies.length; j++) {
        if (G.enemies[j].alive && G.enemies[j].guardI === i) { used = true; break; }
      }
      if (used) continue;
      const e = makeEnemy({ type: 2, col: 2, row: 1, hp: 1, guardI: i });
      e.x = i % 2 ? -24 : VW + 24;
      e.y = 40 + made * 16;
      e.state = 'dive';
      e.role = 'escort';
      e.convoy = cid || 0;
      e.peelDir = i % 2 ? 1 : -1;
      e.wps = divePath(e);
      e.wpI = 0;
      e.shotLeft = 2;
      e.nextShot = 0.3;
      G.enemies.push(e);
      made += 1;
    }
    if (made) G.kingSpawned += 1;
  }

  function divingCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && (e.state === 'dive' || e.state === 'hold' || e.state === 'return')) n += 1;
    }
    return n;
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function formedCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && (e.state === 'form' || e.state === 'hover')) n += 1;
    }
    return n;
  }

  function kingOf() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].isKing) return G.enemies[i];
    }
    return null;
  }

  function convoyEscorts(cid) {
    if (!cid) return 0;
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.convoy === cid && e.role === 'escort' && (e.state === 'dive' || e.state === 'hold')) n += 1;
    }
    return n;
  }

  function maxDives() {
    const n = isCore() ? 3 : 2;
    return Math.min(6, n + (G.wave >= 4 ? 1 : 0) + (aliveCount() < 8 ? 1 : 0));
  }

  function tryDive() {
    if (!G.formed || G.deadT > 0 || G.ready > 0) return;
    if (isKingWave()) return;
    if (divingCount() >= maxDives()) return;
    const flags = [];
    const escorts = [];
    const others = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state !== 'form') continue;
      if (e.type === 3) flags.push(e);
      else if (e.type === 2) escorts.push(e);
      else others.push(e);
    }
    if (!flags.length && !escorts.length && !others.length) return;
    const flagChance = 0.38 + G.wave * 0.07 + (isCore() ? 0.12 : 0);
    if (flags.length && Math.random() < flagChance) {
      startFlagshipDive(flags[(Math.random() * flags.length) | 0]);
      return;
    }
    const pool = others.length ? others : escorts.length ? escorts : flags;
    const a = pool[(Math.random() * pool.length) | 0];
    startDive(a, 0, 0, '', 0);
    if (pool.length > 1 && Math.random() < (isCore() ? 0.62 : 0.4)) {
      let b = pool[(Math.random() * pool.length) | 0];
      if (b === a && pool.length > 1) b = pool[(pool.indexOf(a) + 1) % pool.length];
      if (b !== a) startDive(b, 0, 0.06, '', 0);
    }
  }

  function beginReturn(e) {
    e.state = 'return';
    e.role = '';
    e.peeled = false;
    e.escort = false;
    e.y = -24;
    e.x = clamp(e.x, 28, VW - 28);
    const p = slotPos(e);
    e.wps = [{ x: p.x, y: p.y }];
    e.wpI = 0;
    if (e.isKing) {
      e.wps = [{ x: 240, y: 118 }];
    }
  }

  function tryPeel(e) {
    if (e.role !== 'escort' || e.peeled) return;
    if (e.state !== 'dive') return;
    if (e.y < 248) return;
    e.peeled = true;
    e.wps = peelPath(e);
    e.wpI = 0;
    spark(e.x, e.y, MAG);
    burst(e.x, e.y, PNK, 6, 140);
    audio.peel();
  }

  function dropBomb(x, y, vx) {
    if (G.bombs.length >= maxBombs()) return;
    G.bombs.push({
      x: x,
      y: y,
      vx: vx || 0,
      vy: 165 + G.wave * 12 + (isCore() ? 22 : 0)
    });
  }

  function kingSpread(k) {
    const n = G.kingPhase >= 1 ? 5 : 3;
    const spread = G.kingPhase >= 1 ? 0.55 : 0.38;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1) - 0.5);
      const ang = Math.PI * 0.5 + t * spread;
      G.bombs.push({
        x: k.x,
        y: k.y + 16,
        vx: Math.cos(ang) * 90,
        vy: Math.sin(ang) * (190 + G.wave * 8)
      });
    }
    capArr(G.bombs, 18);
  }

  function flagshipScore(e) {
    if (e.state === 'form' || e.state === 'hover' || e.state === 'return') return 150;
    const n = convoyEscorts(e.convoy);
    if (n >= 2) return 800;
    if (n === 1) return 300;
    return 200;
  }

  function explodeEnemy(e) {
    e.alive = false;
    const rgb = enemyRgb(e);
    const big = e.isKing || e.type === 3;
    burst(e.x, e.y, rgb, e.isKing ? 36 : big ? 22 : 14, e.isKing ? 380 : big ? 320 : 250);
    ring(e.x, e.y, rgb);
    spark(e.x, e.y, WHT);
    audio.explode();
    audio.hit(e.isKing ? 4 : e.type, G.combo);
    if (e.isKing) {
      const n = 5000 * G.mult;
      addScore(n);
      floatText(e.x, e.y - 12, String(n), GOLD);
      hitStop(0.08);
      kick(6);
      screenFlash(GOLD, 0.55);
      G.pendingWin = true;
      G.clearT = 1.65;
      toast('星王击坠', false, true);
      return;
    }
    let base;
    let label = null;
    if (e.type === 3) {
      base = flagshipScore(e);
      if (base === 800) {
        label = '双护 800';
        audio.flag();
        screenFlash(GOLD, 0.32);
        hitStop(0.08);
        kick(3.6);
      } else if (base === 300) {
        label = '单护 300';
        hitStop(0.062);
        kick(2.6);
      } else if (base === 200) {
        label = '孤旗 200';
        hitStop(0.055);
        kick(2.2);
      } else {
        hitStop(0.05);
        kick(2);
      }
    } else {
      const diving = e.state === 'dive' || e.state === 'hold' || e.state === 'return';
      base = diving ? TYPE_SCORE_DIVE[e.type] : TYPE_SCORE_FORM[e.type];
      hitStop(e.type === 2 ? 0.05 : e.type === 1 ? 0.04 : 0.034);
      kick(e.type === 2 ? 2.1 : 1.6);
    }
    const n = base * G.mult;
    addScore(n);
    floatText(e.x, e.y - 10, label || String(n), rgb);
  }

  function damageEnemy(e) {
    if (!e.alive) return;
    if (e.isKing) {
      e.hp -= 1;
      e.hitFlash = 0.08;
      spark(e.x, e.y, GOLD);
      audio.bossHit();
      bumpCombo();
      addScore(10 * G.mult);
      hitStop(0.034);
      kick(1.2);
      if (e.hp <= 0) explodeEnemy(e);
      else if (e.hp < e.maxHp * 0.4 && G.kingPhase < 1) {
        G.kingPhase = 1;
        toast('星王狂坠', true, false);
        screenFlash(ORG, 0.28);
      }
      return;
    }
    bumpCombo();
    explodeEnemy(e);
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.invuln > 0) return;
    G.lives -= 1;
    G.why = why;
    G.deadT = 0.95;
    G.fireHold = false;
    G.shots = [];
    G.bombs = [];
    burst(G.ship.x, G.ship.y, CYN, 26, 340);
    ring(G.ship.x, G.ship.y, MAG);
    audio.death();
    screenFlash(MAG, 0.55);
    hitStop(0.078);
    kick(7);
    toast(why || '被击中', true, false);
    syncPips();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= maxShots()) return;
    G.shots.push({ x: G.ship.x, y: G.ship.y - 16 });
    G.fireCd = 0.09;
    G.muzzle = 0.08;
    audio.shoot();
  }

  function updatePlayer(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.deadT > 0) return;
    let vx = 0;
    if (inputSrc === 'key') {
      if (keys.l) vx -= 1;
      if (keys.r) vx += 1;
      G.ship.x += vx * SHIP_SPD * dt;
    } else if (pointer.down || pointer.hover) {
      const dx = pointer.x - G.ship.x;
      const step = SHIP_SPD * dt;
      if (Math.abs(dx) <= step) G.ship.x = pointer.x;
      else G.ship.x += Math.sign(dx) * step;
    }
    G.ship.x = clamp(G.ship.x, BOX_L, BOX_R);
    G.ship.y = PLAYER_Y;
  }

  function updateFormation(dt) {
    const live = formedCount();
    const dens = Math.max(8, G.total || 36);
    const thin = 1 - live / dens;
    const spd = (22 + thin * 20 + G.wave * 1.5) * (isCore() ? 1.15 : 1);
    G.formOx += G.formDir * spd * dt;
    const lim = 30;
    if (G.formOx > lim) { G.formOx = lim; G.formDir = -1; }
    if (G.formOx < -lim) { G.formOx = -lim; G.formDir = 1; }
    G.formOy = Math.sin(G.t * 1.35) * 5;
    if (isKingWave()) {
      G.diveCd -= dt;
      return;
    }
    G.diveCd -= dt;
    if (G.formed && G.diveCd <= 0 && G.ready <= 0 && G.deadT <= 0) {
      tryDive();
      const remain = Math.max(0.22, live / dens);
      G.diveCd = ((isCore() ? 0.5 : 0.92) * remain) / haste();
    }
  }

  function updateKing(k, dt) {
    k.hitFlash = Math.max(0, k.hitFlash - dt);
    if (k.state === 'hover') {
      k.x = 240 + Math.sin(G.t * 0.85) * 96;
      k.y = 118 + Math.sin(G.t * 1.4) * 8;
      if (G.mode !== 'play' || G.deadT > 0) return;
      k.nextShot -= dt;
      if (k.nextShot <= 0) {
        kingSpread(k);
        k.nextShot = (G.kingPhase >= 1 ? 0.78 : 1.15) * (isCore() ? 0.82 : 1);
      }
      k.diveCd = (k.diveCd || 0) - dt;
      const interval = (G.kingPhase >= 1 ? 2.1 : 3.4) * (isCore() ? 0.78 : 1);
      if (k.diveCd <= 0) {
        startKingDive(k);
        k.diveCd = interval;
      }
      return;
    }
    if (k.state === 'dive') {
      k.diveT += dt;
      if (followWaypoints(k, dt, diveSpeed() * 0.92)) beginReturn(k);
      if (!REDUCE && (G.clock * 24 | 0) !== ((G.clock - dt) * 24 | 0)) {
        trails.push({ x: k.x, y: k.y, t: 0, rgb: GOLD });
        capArr(trails, 40);
      }
      k.nextShot -= dt;
      if (k.nextShot <= 0 && G.mode === 'play') {
        dropBomb(k.x, k.y + 12, (G.ship.x - k.x) * 0.15);
        k.nextShot = 0.38;
      }
      return;
    }
    if (k.state === 'return') {
      const p = { x: 240, y: 118 };
      k.wps = [p];
      if (followWaypoints(k, dt, returnSpeed())) {
        k.state = 'hover';
        k.convoy = 0;
        k.diveCd = (G.kingPhase >= 1 ? 1.6 : 2.4) * (isCore() ? 0.8 : 1);
      }
    }
  }

  function updateEnemy(e, dt) {
    if (!e.alive) return;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    if (e.isKing) {
      updateKing(e, dt);
      return;
    }
    if (e.state === 'form') {
      const p = slotPos(e);
      e.x = p.x;
      e.y = p.y;
      return;
    }
    if (e.state === 'hold') {
      e.hold -= dt;
      const p = slotPos(e);
      e.x = p.x;
      e.y = p.y;
      if (e.hold <= 0) {
        e.state = 'dive';
        e.wps = divePath(e);
        e.wpI = 0;
      }
      return;
    }
    if (e.state === 'dive') {
      e.diveT += dt;
      tryPeel(e);
      if (!REDUCE && e.type >= 2 && (G.clock * 20 | 0) !== ((G.clock - dt) * 20 | 0)) {
        trails.push({ x: e.x, y: e.y, t: 0, rgb: enemyRgb(e) });
        capArr(trails, 48);
      }
      if (followWaypoints(e, dt, diveSpeed())) beginReturn(e);
      if (G.mode === 'play' && G.deadT <= 0) {
        e.nextShot -= dt;
        if (e.nextShot <= 0 && e.shotLeft > 0) {
          const aim = clamp((G.ship.x - e.x) * 0.22, -70, 70);
          dropBomb(e.x, e.y + 8, aim);
          e.shotLeft -= 1;
          e.nextShot = rand(0.34, 0.62);
        }
      }
      return;
    }
    if (e.state === 'return') {
      const p = slotPos(e);
      e.wps = [{ x: p.x, y: p.y }];
      if (followWaypoints(e, dt, returnSpeed())) {
        e.state = 'form';
        e.convoy = 0;
        e.role = '';
        e.x = p.x;
        e.y = p.y;
      }
    }
  }

  function updateEnemies(dt) {
    G.flapT += dt;
    for (let i = 0; i < G.enemies.length; i++) updateEnemy(G.enemies[i], dt);
    if (isKingWave() && G.mode === 'play' && G.deadT <= 0) {
      const k = kingOf();
      if (k && k.state === 'hover') {
        G.escortCd -= dt;
        let guards = 0;
        for (let i = 0; i < G.enemies.length; i++) {
          if (G.enemies[i].alive && G.enemies[i].guardI >= 0) guards += 1;
        }
        if (G.escortCd <= 0) {
          if (guards < (isCore() ? 5 : 4) && G.kingSpawned < (isCore() ? 4 : 3)) {
            spawnHonor(isCore() ? 3 : 2, 0);
            for (let i = 0; i < G.enemies.length; i++) {
              const e = G.enemies[i];
              if (e.alive && e.guardI >= 0 && e.state === 'dive' && e.convoy === 0) {
                beginReturn(e);
              }
            }
            toast('护卫入场', true, false);
          }
          G.escortCd = isCore() ? 4.6 : 5.8;
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      const prev = s.y;
      s.y -= SHOT_V * dt;
      if (s.y < -12) {
        G.shots.splice(i, 1);
        breakCombo();
        if (G.mode === 'play') audio.miss();
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        if (e.state === 'hold') continue;
        const box = hitBox(e);
        if (Math.abs(s.x - e.x) < box.hw + 2 && s.y < e.y + box.hh && prev > e.y - box.hh - 8) {
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
      b.x += (b.vx || 0) * dt;
      b.y += (b.vy || 180) * dt;
      if (b.y > VH + 10 || b.x < -20 || b.x > VW + 20) {
        G.bombs.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (Math.abs(b.x - G.ship.x) < 13 && b.y > PLAYER_Y - 10 && b.y < PLAYER_Y + 14) {
          G.bombs.splice(i, 1);
          killPlayer('被击中');
          continue;
        }
      }
    }
  }

  function collideBodies() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.state !== 'dive' && e.state !== 'return') {
        if (!(e.isKing && e.state === 'hover' && e.y > PLAYER_Y - 40)) continue;
      }
      const box = hitBox(e);
      if (Math.abs(e.x - G.ship.x) < box.hw + 10 && e.y + box.hh > PLAYER_Y - 10 && e.y - box.hh < PLAYER_Y + 12) {
        explodeEnemy(e);
        killPlayer(e.isKing ? '星王撞击' : '撞击');
        return;
      }
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
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > 0.28) trails.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.v * dt * 0.18;
      if (s.y > VH) {
        s.y = 0;
        s.x = Math.random() * VW;
      }
    }
  }

  function onWaveClear() {
    if (G.mode !== 'play') return;
    if (isKingWave()) return;
    const bonus = 250 * G.wave;
    addScore(bonus);
    floatText(VW * 0.5, 220, '+' + bonus, GOLD);
    audio.wave();
    screenFlash(GOLD, 0.28);
    kick(3);
    toast(waveTitle(G.wave) + '肃清', false, true);
    G.wave += 1;
    G.ready = 1.05;
    spawnWave();
    if (isKingWave()) toast('星王降临', false, true);
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    addScore(isCore() ? 10000 : 8000);
    G.mode = 'win';
    G.fireHold = false;
    audio.win();
    kick(5);
    screenFlash(GOLD, 0.45);
    const lead = (isCore() ? '星核尽破' : '加星肃清') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('win', isCore() ? '星核尽破' : '加星肃清', lead);
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
    showOverlay('lose', '舰毁了', lead);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'raid';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    G.clock = 0;
    resetField();
    G.ready = 0.7;
    hideOverlay();
    audio.start();
    toast(isCore() ? '星核 · 编队更密更快' : '加星 · 四波见星王', false, isCore());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    resetField();
    G.ready = 0;
    showOverlay('title', '加星', '编队悬停。旗舰俯冲并甩开护卫。击坠带双护卫的旗舰拿高分。四波之后星王俯冲。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isCore()) goTitle();
      else startGame('core');
    }
  }

  function playSim(dt) {
    G.invuln = Math.max(0, G.invuln - dt);
    updatePlayer(dt);
    if ((G.fireHold || pointer.down) && G.mode === 'play' && !overlayOpen()) fire();
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateBombs(dt);
      updateFormation(dt);
      updateEnemies(dt * 0.45);
      return;
    }
    updateFormation(dt);
    updateEnemies(dt);
    updateShots(dt);
    updateBombs(dt);
    collideBodies();
  }

  function checkClear() {
    if (G.mode !== 'play' || G.clearT > 0 || G.pendingWin) return;
    if (isKingWave()) {
      if (!kingOf()) {
        G.clearT = 1.15;
        G.pendingWin = true;
      }
      return;
    }
    if (aliveCount() === 0) G.clearT = 1.15;
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
      updateEnemies(dt * 0.4);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      updateEnemies(dt);
      updateBombs(dt);
      updateFormation(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '舰毁了');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = PLAYER_Y;
        G.invuln = 1.5;
        G.bombs = [];
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) {
        if (G.pendingWin) winRun();
        else onWaveClear();
      }
    } else {
      checkClear();
    }

    updateFx(dt);
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  function drawSprite(px, py, rows, rgb, cell, alpha) {
    if (!rows || !rows.length) return;
    const h = rows.length;
    const w = rows[0].length;
    const cw = cell;
    const x0 = px - (w * cw) / 2;
    const y0 = py - (h * cw) / 2;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = rgba(rgb, 1);
    const rw = Math.max(1, Math.ceil(cw * scale));
    for (let r = 0; r < h; r++) {
      const line = rows[r];
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '#') {
          ctx.fillRect(sx(x0 + c * cw), sy(y0 + r * cw), rw, rw);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBg() {
    ctx.fillStyle = '#0a0e06';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#10160a';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, 'rgba(255, 233, 74, 0.07)');
    g.addColorStop(0.45, 'rgba(200, 224, 32, 0.03)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0.05)');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.t * 2.2 + s.p);
      ctx.fillStyle = rgba(s.rgb, s.a * tw);
      const rr = s.r * scale;
      ctx.fillRect(sx(s.x) - rr, sy(s.y) - rr, rr * 2, rr * 2);
    }
  }

  function drawGhosts() {
    const flap = ((G.flapT * 8) | 0) % 2;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.isKing) continue;
      if (e.state === 'form' || e.state === 'hold' || e.state === 'hover') continue;
      const p = slotPos(e);
      const spr = SPR[e.type] || SPR[0];
      const rows = spr[flap] || spr[0];
      drawSprite(p.x, p.y, rows, enemyRgb(e), 1.5, 0.12);
    }
  }

  function drawConvoyLines() {
    for (let i = 0; i < G.enemies.length; i++) {
      const f = G.enemies[i];
      if (!f.alive || (f.type !== 3 && !f.isKing)) continue;
      if (f.state !== 'dive' && f.state !== 'hold') continue;
      if (!f.convoy) continue;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive || e.role !== 'escort' || e.convoy !== f.convoy) continue;
        if (e.peeled) continue;
        ctx.strokeStyle = rgba(GOLD, 0.28);
        ctx.lineWidth = Math.max(1, 1.2 * scale);
        ctx.setLineDash([4 * scale, 5 * scale]);
        ctx.beginPath();
        ctx.moveTo(sx(f.x), sy(f.y));
        ctx.lineTo(sx(e.x), sy(e.y));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawEnemies() {
    const flap = ((G.flapT * 8) | 0) % 2;
    drawGhosts();
    drawConvoyLines();
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      const a = 1 - t.t / 0.28;
      ctx.fillStyle = rgba(t.rgb, a * 0.45);
      const rr = (2.2 - t.t * 4) * scale;
      ctx.fillRect(sx(t.x) - rr, sy(t.y) - rr, rr * 2, rr * 2);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const rgb = enemyRgb(e);
      if (e.isKing) {
        const rows = SPR_KING[flap];
        drawSprite(e.x, e.y, rows, rgb, 2.15, 1);
        ctx.strokeStyle = rgba(GOLD, e.state === 'dive' ? 0.55 : 0.32);
        ctx.lineWidth = scale;
        ctx.beginPath();
        ctx.arc(sx(e.x), sy(e.y), 32 * scale, 0, TAU);
        ctx.stroke();
      } else {
        const spr = SPR[Math.min(e.type, 3)] || SPR[0];
        const rows = spr[flap] || spr[0];
        const cell = e.type === 3 ? 1.85 : 1.65;
        drawSprite(e.x, e.y, rows, rgb, cell, 1);
      }
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!REDUCE) {
        ctx.fillStyle = rgba(GOLD, 0.28);
        ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 16 * scale);
      }
      ctx.fillStyle = rgba(WHT, 1);
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 6), 2.8 * scale, 10 * scale);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.fillRect(sx(s.x - 0.8), sy(s.y - 2), 1.6 * scale, 8 * scale);
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), 2.6 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), 1.2 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0;
    if (blink) return;
    drawSprite(G.ship.x, G.ship.y, SPR_SHIP, CYN, 1.7, 1);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.fillRect(sx(G.ship.x - 3), sy(G.ship.y - 20), 6 * scale, 8 * scale);
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      const rr = p.r * scale;
      ctx.fillRect(sx(p.x) - rr, sy(p.y) - rr, rr * 2, rr * 2);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.16;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      const r = (6 + s.t * 40) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x) - r, sy(s.y));
      ctx.lineTo(sx(s.x) + r, sy(s.y));
      ctx.moveTo(sx(s.x), sy(s.y) - r);
      ctx.lineTo(sx(s.x), sy(s.y) + r);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, a * 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.font = 'bold ' + Math.round(12 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.textAlign = 'left';
  }

  function drawKingBar() {
    if (!isKingWave() || G.mode === 'title') return;
    const k = kingOf();
    if (!k) return;
    const w = 220;
    const x = (VW - w) / 2;
    const y = 16;
    const t = clamp(k.hp / k.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(10, 14, 6, 0.55)';
    ctx.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    ctx.fillStyle = rgba(t < 0.32 ? MAG : t < 0.55 ? ORG : GOLD, 0.9);
    ctx.fillRect(sx(x), sy(y), w * t * scale, 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = scale;
    ctx.strokeRect(sx(x), sy(y), w * scale, 8 * scale);
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#12160a';
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - ox - VW * scale + 1, H);
    }
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - oy - VH * scale + 1);
    }
  }

  function draw() {
    let kx = 0;
    let ky = 0;
    if (G.shake > 0 && !REDUCE) {
      kx = (Math.random() - 0.5) * G.shake * 1.4;
      ky = (Math.random() - 0.5) * G.shake * 1.4;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    ctx.translate(kx, ky);
    drawBg();
    drawEnemies();
    drawShots();
    drawShip();
    drawFx();
    drawKingBar();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    const r = stageEl ? stageEl.getBoundingClientRect() : canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    scale = Math.min(W / VW, H / VH);
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
    if (k === 'ArrowUp' || k === 'Up' || k === 'ArrowDown' || k === 'Down' || k === 'w' || k === 'W' || k === 's' || k === 'S') {
      if (down) e.preventDefault();
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
    if (k === '1') {
      if (overlayOpen() && G.mode === 'title') startGame('raid');
      return;
    }
    if (k === '2') {
      if (overlayOpen() && G.mode === 'title') startGame('core');
      else if (overlayOpen()) secondaryAction();
      return;
    }
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
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), BOX_L, BOX_R);
      pointer.y = pointerWorldY(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), BOX_L, BOX_R);
      pointer.y = pointerWorldY(e);
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
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
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
    try {
      m = localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) { /* ignore */ }
    audio.setMuted(m);
  }

  if (btnRaid) btnRaid.addEventListener('click', function () {
    audio.ensure();
    startGame('raid');
  });
  if (btnCore) btnCore.addEventListener('click', function () {
    audio.ensure();
    startGame('core');
  });
  if (btnOvRetry) btnOvRetry.addEventListener('click', function () {
    audio.ensure();
    startGame(G.kind || 'raid');
  });
  if (btnOvModes) btnOvModes.addEventListener('click', function () {
    audio.ensure();
    secondaryAction();
  });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    restart();
  });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = false;
      G.fireHold = false;
    }
  });

  bindPointer();
  seedStars();
  loadBest();
  initMute();
  resize();
  goTitle();
  requestAnimationFrame(frame);
})();
