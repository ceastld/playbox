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
  const CAMP_WAVES = 5;
  const BEST_KEY = 'playbox-phoenix-best';
  const MUTE_KEY = 'playbox-phoenix-mute';
  const OPS = '← → / WASD 移动 · 空格开火 · Shift 护盾 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const FIRE = [255, 90, 31];
  const ORG = [255, 140, 64];
  const WHT = [255, 243, 234];
  const HOT = [255, 154, 74];
  const PNK = [255, 140, 200];

  const TYPE_RGB = [GOLD, FIRE, MAG];
  const TYPE_RGB_HIT = [WHT, ORG, PNK];
  const TYPE_HW = [11, 14, 18];
  const TYPE_HH = [8, 10, 12];
  const TYPE_SCORE_FORM = [50, 80, 200];
  const TYPE_SCORE_DIVE = [100, 160, 400];
  const TYPE_CHIP = [0, 40, 80];

  const SPR = [
    [
      [
        '#        #',
        ' ##    ## ',
        '  ######  ',
        ' ######## ',
        '## #### ##',
        '  ##  ##  ',
        ' #  ##  # ',
        '#        #'
      ],
      [
        '  #    #  ',
        ' #      # ',
        '  ######  ',
        ' ######## ',
        '## #### ##',
        '  ##  ##  ',
        '   ####   ',
        '  #    #  '
      ]
    ],
    [
      [
        '#         #',
        ' ##     ## ',
        '###########',
        '  #######  ',
        ' ## ### ## ',
        '##  ###  ##',
        '  ##   ##  ',
        ' #  # #  # '
      ],
      [
        '  #     #  ',
        '#  #   #  #',
        '###########',
        '  #######  ',
        ' ## ### ## ',
        '  #######  ',
        ' ##     ## ',
        '#         #'
      ]
    ],
    [
      [
        '#            #',
        ' ##        ## ',
        '##############',
        ' ############ ',
        ' ## ## ## ##  ',
        '  ##########  ',
        '   ##    ##   ',
        '  #  #  #  #  '
      ],
      [
        '  #        #  ',
        '#  #      #  #',
        '##############',
        ' ############ ',
        ' ## ## ## ##  ',
        '  ##########  ',
        ' ##  ####  ## ',
        '#            #'
      ]
    ]
  ];

  const SPR_HURT = [
    '    ##    ',
    '   ####   ',
    '  ######  ',
    ' ## ## ## ',
    '  ######  ',
    '   ####   ',
    '    ##    ',
    '   #  #   '
  ];

  const SPR_SHIP = [
    '     ##     ',
    '    ####    ',
    '  ## ## ##  ',
    ' ########## ',
    '############',
    '## ##  ## ##',
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
  const btnCamp = document.getElementById('btn-camp');
  const btnEnd = document.getElementById('btn-end');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnShield = document.getElementById('btn-shield');
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

  const keys = { l: false, r: false, shift: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, id: null, shield: false };
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
    ship: { x: VW * 0.5, y: PLAYER_Y, vx: 0 },
    boss: null,
    formOx: 0,
    formDir: 1,
    formOy: 0,
    formed: false,
    diveCd: 1.4,
    fireCd: 0,
    fireHold: false,
    shielding: false,
    shieldPing: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: FIRE,
    punch: 1,
    toastT: 0,
    why: '',
    frame: 0,
    flapT: 0,
    muzzle: 0,
    formX: 56,
    formY: 92,
    cellX: 42,
    cellY: 34,
    waveT: 0
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
    return G.kind === 'camp';
  }
  function shipMin() {
    return 18;
  }
  function shipMax() {
    return VW - 18;
  }

  function waveKind(w) {
    const m = ((w - 1) % 5) + 1;
    if (m === 5) return 'boss';
    if (m === 4) return 'large';
    if (m === 3) return 'med';
    if (m === 2) return 'small2';
    return 'small';
  }

  function waveScale() {
    const w = G.wave;
    if (isCamp()) return 1 + (w - 1) * 0.07;
    return 1 + Math.min(1.7, (w - 1) * 0.1);
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
      this.beep(920, 0.055, 'square', 0.032, 1760);
    },
    hit(type, combo) {
      this.ensure();
      const base = type === 2 ? 980 : type === 1 ? 720 : 540;
      const lift = 1 + Math.min(0.45, combo * 0.03);
      this.noise(0.04, 0.038, 1100);
      this.beep(base * lift, 0.07, 'square', 0.048, base * lift * 1.5);
    },
    chip() {
      this.ensure();
      this.beep(420, 0.05, 'sawtooth', 0.032, 280);
      this.beep(760, 0.07, 'square', 0.03, 980);
    },
    explode() {
      this.ensure();
      this.noise(0.11, 0.052, 480);
      this.beep(280, 0.15, 'sawtooth', 0.045, 70);
    },
    ping() {
      this.ensure();
      this.beep(1560, 0.045, 'sine', 0.05, 2400);
      this.beep(980, 0.08, 'triangle', 0.034, 1680);
    },
    hull() {
      this.ensure();
      this.beep(180, 0.05, 'square', 0.028, 90);
      this.noise(0.04, 0.022, 700);
    },
    core() {
      this.ensure();
      this.beep(240, 0.07, 'sawtooth', 0.042, 160);
      this.beep(720, 0.09, 'square', 0.04, 1100);
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
    regen() {
      this.ensure();
      this.beep(280, 0.1, 'sine', 0.03, 520);
      this.beep(520, 0.14, 'triangle', 0.028, 880);
    },
    bossDown() {
      this.ensure();
      this.noise(0.18, 0.06, 320);
      this.beep(180, 0.22, 'sawtooth', 0.05, 60);
      this.beep(523, 0.16, 'square', 0.04, 1046);
      this.beep(784, 0.24, 'triangle', 0.04, 1568);
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
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '火鸟';
      else if (G.boss && G.boss.alive) stageLabel.textContent = '母舰';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (!!G.boss || G.wave >= 4));
    }
    if (tagLabel) {
      let tag = isCamp() ? '火海' : '无尽';
      if (G.mode === 'play' && G.shielding) tag = '护盾';
      if (G.mode === 'play' && G.boss && G.boss.alive) tag = '卵核 ' + G.boss.coreHp;
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.shielding || G.combo >= 8 || (!!G.boss && G.mode === 'play'));
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (btnShield) btnShield.classList.toggle('on', G.shielding);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 中弹或相撞扣命，Shift 举盾挡弹', 'warn');
    else if (G.mode === 'win') setHint('火海肃清 · R 再来 · 空格开火', 'hot');
    else if (G.shielding) setHint('护盾展开 · 挡弹不能开火', 'hot');
    else if (G.boss && G.boss.alive) setHint('打会动的卵核 · 船体挡弹 · Shift 举盾', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 举盾挡弹，躲开俯冲', 'warn');
    else setHint('← → 移动 · 空格开火 · Shift 护盾挡弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'PHOX';
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
    capArr(sparks, 24);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 12);
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
        rgb: Math.random() < 0.22 ? FIRE : Math.random() < 0.14 ? GOLD : WHT
      });
    }
  }

  function slotPos(e) {
    return {
      x: G.formX + e.col * G.cellX + G.formOx,
      y: G.formY + e.row * G.cellY + G.formOy
    };
  }

  function enemyRgb(e) {
    if (e.hitFlash > 0) return WHT;
    if (e.wingOff) return TYPE_RGB_HIT[e.type];
    if (e.type === 1 && e.hp < e.maxHp) return TYPE_RGB_HIT[1];
    return TYPE_RGB[e.type];
  }

  function makeEnemy(type, col, row, hp, delay, wps) {
    return {
      type: type,
      col: col,
      row: row,
      hp: hp,
      maxHp: hp,
      x: wps[0].x,
      y: wps[0].y,
      state: 'wait',
      delay: delay,
      wps: wps,
      wpI: 0,
      alive: true,
      shotLeft: 0,
      nextShot: 0,
      hitFlash: 0,
      wingOff: false,
      hurtT: 0,
      escort: false
    };
  }

  function enterPath(side, col, row, end) {
    const startX = side > 0 ? 510 : -30;
    const cx = 240;
    const amp = 90;
    return [
      { x: startX, y: 28 + row * 10 },
      { x: cx + side * 140, y: 150 },
      { x: cx - side * amp * 0.45, y: 300 },
      { x: cx + side * amp * 0.65, y: 210 },
      { x: cx - side * 36, y: 120 },
      end
    ];
  }

  function makeBoss() {
    const extra = isCamp() ? 0 : Math.floor((G.wave - 1) / 5) * 2;
    return {
      alive: true,
      x: VW * 0.5,
      y: 96,
      vx: 48 + G.wave * 3,
      coreHp: 10 + extra,
      maxCore: 10 + extra,
      eggT: 0,
      fireCd: 1.1,
      gunT: 0,
      escortCd: 7.5,
      shake: 0
    };
  }

  function eggPos(m) {
    return {
      x: m.x + Math.sin(m.eggT * 1.55) * 36,
      y: m.y + 8 + Math.sin(m.eggT * 2.4) * 4
    };
  }

  function layoutFor(kind) {
    const slots = [];
    if (kind === 'small') {
      G.formX = 72;
      G.formY = 100;
      G.cellX = 42;
      G.cellY = 34;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 8; c++) slots.push({ type: 0, col: c, row: r, hp: 1 });
      }
    } else if (kind === 'small2') {
      G.formX = 72;
      G.formY = 86;
      G.cellX = 42;
      G.cellY = 32;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) slots.push({ type: 0, col: c, row: r, hp: 1 });
      }
    } else if (kind === 'med') {
      G.formX = 84;
      G.formY = 96;
      G.cellX = 52;
      G.cellY = 40;
      const hp = 2 + (isCamp() ? 0 : Math.floor((G.wave - 1) / 10));
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 6; c++) slots.push({ type: 1, col: c, row: r, hp: hp });
      }
    } else if (kind === 'large') {
      G.formX = 70;
      G.formY = 110;
      G.cellX = 56;
      G.cellY = 48;
      const hp = 2 + (isCamp() ? 0 : Math.min(2, Math.floor((G.wave - 1) / 8)));
      for (let c = 0; c < 6; c++) slots.push({ type: 2, col: c, row: 0, hp: hp });
    }
    return slots;
  }

  function spawnEscorts() {
    G.formX = 90;
    G.formY = 168;
    G.cellX = 50;
    G.cellY = 36;
    const n = isCamp() ? 6 : Math.min(10, 6 + Math.floor((G.wave - 1) / 5));
    const haste = Math.max(0.62, 1 - (G.wave - 1) * 0.04);
    for (let i = 0; i < n; i++) {
      const col = i % 6;
      const row = (i / 6) | 0;
      const side = i % 2 === 0 ? 1 : -1;
      const end = { x: G.formX + col * G.cellX, y: G.formY + row * G.cellY };
      const wps = enterPath(side, col, row, end);
      const e = makeEnemy(0, col, row, 1, (0.35 + i * 0.18) * haste, wps);
      e.escort = true;
      G.enemies.push(e);
    }
  }

  function spawnWave() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.formed = false;
    G.formOx = 0;
    G.formDir = 1;
    G.formOy = 0;
    G.diveCd = 1.5;
    G.waveT = 0;
    const kind = waveKind(G.wave);
    G.boss = null;
    if (kind === 'boss') {
      G.boss = makeBoss();
      spawnEscorts();
      return;
    }
    const slots = layoutFor(kind);
    const haste = Math.max(0.6, 1 - (G.wave - 1) * 0.045);
    const half = (slots.length / 2) | 0;
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      const side = i < half ? 1 : -1;
      const end = { x: G.formX + sl.col * G.cellX, y: G.formY + sl.row * G.cellY };
      const wps = enterPath(side, sl.col, sl.row, end);
      const delay = ((i < half ? i : i - half) * 0.12 + (i < half ? 0 : 1.55)) * haste;
      G.enemies.push(makeEnemy(sl.type, sl.col, sl.row, sl.hp, delay, wps));
    }
  }

  function resetField() {
    G.ship.x = VW * 0.5;
    G.ship.vx = 0;
    G.shots = [];
    G.bombs = [];
    G.deadT = 0;
    G.invuln = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.shielding = false;
    G.shieldPing = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.next1up = 20000;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    spawnWave();
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
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
      if (e.alive && (e.state === 'dive' || e.state === 'hurt' || e.state === 'return')) n += 1;
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

  function diveSpeed() {
    return (250 + G.wave * 12) * (isCamp() ? 1 : 1.08) * (waveKind(G.wave) === 'large' ? 0.86 : 1);
  }

  function enterSpeed() {
    return 220 + G.wave * 8;
  }

  function startDive(e) {
    if (!e.alive || e.state !== 'form') return;
    e.state = 'dive';
    e.wpI = 0;
    e.shotLeft = e.type === 2 ? 3 : e.type === 1 ? 2 : 1 + (G.wave > 4 ? 1 : 0);
    e.nextShot = rand(0.22, 0.62);
    const side = e.x < VW * 0.5 ? -1 : 1;
    const px = G.ship.x;
    e.wps = [
      { x: e.x + side * 36, y: e.y - 18 },
      { x: e.x + side * 92, y: e.y + 58 },
      { x: lerp(e.x, px, 0.32) - side * 40, y: 270 },
      { x: px + side * 48, y: 400 },
      { x: px - side * 56, y: 530 },
      { x: px + side * 12, y: 650 },
      { x: px - side * 28, y: 790 }
    ];
  }

  function tryDive() {
    if (!G.formed || G.deadT > 0) return;
    const maxD = Math.min(6, (isCamp() ? 2 : 3) + Math.floor((G.wave - 1) / 2));
    if (divingCount() >= maxD) return;
    const pool = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.state === 'form') pool.push(e);
    }
    if (!pool.length) return;
    const big = [];
    const rest = [];
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].type >= 1) big.push(pool[i]);
      else rest.push(pool[i]);
    }
    const src = rest.length && Math.random() < 0.7 ? rest : (big.length ? big : pool);
    const a = src[(Math.random() * src.length) | 0];
    startDive(a);
    if (src.length > 1 && Math.random() < 0.5) {
      let b = src[(Math.random() * src.length) | 0];
      if (b === a && src.length > 1) b = src[(src.indexOf(a) + 1) % src.length];
      if (b !== a) startDive(b);
    }
  }

  function explodeEnemy(e) {
    e.alive = false;
    e.wingOff = false;
    const rgb = enemyRgb(e);
    burst(e.x, e.y, rgb, e.type === 2 ? 24 : 14, e.type === 2 ? 330 : 250);
    ring(e.x, e.y, rgb);
    spark(e.x, e.y, WHT);
    audio.explode();
    const diving = e.state === 'dive' || e.state === 'hurt' || e.state === 'return';
    const base = diving ? TYPE_SCORE_DIVE[e.type] : TYPE_SCORE_FORM[e.type];
    const n = base * G.mult;
    addScore(n);
    floatText(e.x, e.y - 10, String(n), rgb);
    hitStop(e.type === 2 ? 0.07 : e.type === 1 ? 0.05 : 0.038);
    kick(e.type === 2 ? 3.2 : 1.8);
  }

  function damageEnemy(e) {
    if (!e.alive) return;
    if (e.type === 2 && !e.wingOff && e.hp > 1) {
      e.hp -= 1;
      e.wingOff = true;
      e.state = 'hurt';
      e.hurtT = 2.55;
      e.hitFlash = 0.14;
      spark(e.x, e.y, GOLD);
      burst(e.x, e.y, FIRE, 10, 200);
      audio.chip();
      bumpCombo();
      const n = TYPE_CHIP[2] * G.mult;
      addScore(n);
      floatText(e.x, e.y - 8, '翅落', GOLD);
      hitStop(0.05);
      kick(2);
      return;
    }
    if (e.hp > 1) {
      e.hp -= 1;
      e.hitFlash = 0.12;
      spark(e.x, e.y, GOLD);
      audio.chip();
      bumpCombo();
      const n = TYPE_CHIP[e.type] * G.mult;
      addScore(n);
      floatText(e.x, e.y - 8, String(n), GOLD);
      hitStop(0.042);
      kick(1.4);
      return;
    }
    bumpCombo();
    explodeEnemy(e);
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.fireHold = false;
    G.shielding = false;
    G.shots = [];
    burst(G.ship.x, G.ship.y, FIRE, 28, 340);
    ring(G.ship.x, G.ship.y, MAG);
    audio.death();
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    kick(7);
    G.why = why;
  }

  function enemyBomb(e) {
    if (G.mode === 'title') return;
    if (G.bombs.length >= (isCamp() ? 7 : 10)) return;
    const aim = (G.ship.x - e.x) * 0.16;
    G.bombs.push({
      x: e.x,
      y: e.y + 10,
      vx: clamp(aim, -56, 56),
      vy: 186 + G.wave * 11
    });
  }

  function bossBomb(m, ox) {
    if (G.mode === 'title') return;
    if (G.bombs.length >= 12) return;
    const aim = (G.ship.x - (m.x + ox)) * 0.12;
    G.bombs.push({
      x: m.x + ox,
      y: m.y + 26,
      vx: clamp(aim, -70, 70),
      vy: 200 + G.wave * 10
    });
  }

  function wantShield() {
    if (G.mode !== 'play' || G.deadT > 0) return false;
    return keys.shift || pointer.shield;
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0.35) return;
    if (wantShield()) return;
    if (G.shots.length >= 2 || G.fireCd > 0) return;
    G.shots.push({ x: G.ship.x, y: G.ship.y - 16, vy: -SHOT_V });
    audio.shoot();
    G.fireCd = 0.12;
    G.muzzle = 0.08;
    spark(G.ship.x, G.ship.y - 18, GOLD);
  }

  function hitBox(e) {
    if (e.wingOff) return { hw: 8, hh: 8 };
    return { hw: TYPE_HW[e.type], hh: TYPE_HH[e.type] };
  }

  function shotHitsEnemy(s, e) {
    const b = hitBox(e);
    if (Math.abs(s.x - e.x) <= b.hw && Math.abs(s.y - e.y) <= b.hh) return true;
    return false;
  }

  function shotHitsBoss(s, m) {
    if (!m || !m.alive) return null;
    const egg = eggPos(m);
    if (Math.abs(s.x - egg.x) <= 13 && Math.abs(s.y - egg.y) <= 12) return 'core';
    const inBay = Math.abs(s.x - m.x) < 44 && s.y > m.y - 6 && s.y < m.y + 32;
    if (inBay) return null;
    if (Math.abs(s.x - m.x) < 112 && Math.abs(s.y - m.y) < 28) return 'hull';
    return null;
  }

  function shieldHit(x, y) {
    if (!G.shielding) return false;
    const dx = x - G.ship.x;
    const dy = y - (G.ship.y - 8);
    if (dy > 6 || dy < -34) return false;
    const half = 28 - dy * 0.12;
    return Math.abs(dx) < half;
  }

  function blockShot(b) {
    burst(b.x, b.y, CYN, 10, 180);
    spark(b.x, b.y, GOLD);
    ring(b.x, b.y, CYN);
    audio.ping();
    G.shieldPing = 1;
    hitStop(0.032);
    kick(1.2);
    bumpCombo();
    const n = 10 * G.mult;
    addScore(n);
    floatText(b.x, b.y - 8, '挡', CYN);
  }

  function hitCore(m, x, y) {
    m.coreHp -= 1;
    m.shake = 0.18;
    spark(x, y, GOLD);
    burst(x, y, MAG, 12, 220);
    audio.core();
    bumpCombo();
    const n = 100 * G.mult;
    addScore(n);
    floatText(x, y - 10, String(n), GOLD);
    hitStop(0.055);
    kick(2.4);
    screenFlash(GOLD, 0.22);
    if (m.coreHp <= 0) killBoss(m);
  }

  function killBoss(m) {
    m.alive = false;
    const egg = eggPos(m);
    burst(m.x, m.y, FIRE, 36, 380);
    burst(egg.x, egg.y, GOLD, 28, 340);
    ring(m.x, m.y, MAG);
    ring(egg.x, egg.y, GOLD);
    audio.bossDown();
    screenFlash(GOLD, 0.6);
    hitStop(0.09);
    kick(6);
    const n = 2500 * G.mult;
    addScore(n);
    floatText(m.x, m.y, String(n), GOLD);
    toast('母舰击破', false, true);
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive) explodeEnemy(e);
    }
    G.bombs = [];
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    G.shielding = wantShield();
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
    G.ship.y = PLAYER_Y + Math.sin(G.t * 3.2) * 1.6;
  }

  function updateBoss(dt) {
    const m = G.boss;
    if (!m || !m.alive) return;
    m.eggT += dt;
    m.shake = Math.max(0, m.shake - dt);
    m.x += m.vx * dt;
    if (m.x > VW - 118) {
      m.x = VW - 118;
      m.vx = -Math.abs(m.vx);
    }
    if (m.x < 118) {
      m.x = 118;
      m.vx = Math.abs(m.vx);
    }
    m.fireCd -= dt;
    m.gunT += dt;
    if (G.mode === 'play' && m.fireCd <= 0) {
      const side = (m.gunT * 1.7) % 2 < 1 ? -78 : 78;
      bossBomb(m, side);
      if (Math.random() < 0.45) bossBomb(m, 0);
      m.fireCd = Math.max(0.55, 1.15 - G.wave * 0.04);
    }
    m.escortCd -= dt;
    if (m.escortCd <= 0 && G.mode === 'play') {
      const live = aliveCount();
      if (live < (isCamp() ? 4 : 6)) {
        const col = (Math.random() * 6) | 0;
        const side = Math.random() < 0.5 ? 1 : -1;
        const end = { x: G.formX + col * G.cellX, y: G.formY };
        const wps = enterPath(side, col, 0, end);
        const e = makeEnemy(0, col, 0, 1, 0, wps);
        e.escort = true;
        G.enemies.push(e);
      }
      m.escortCd = isCamp() ? 6.4 : 4.8;
    }
  }

  function updateEnemies(dt) {
    G.flapT += dt;
    if (G.flapT >= 0.34) {
      G.flapT = 0;
      G.frame += 1;
    }
    const edge = 28 + Math.min(22, (20 - aliveCount()) * 0.5);
    G.formOx += G.formDir * (16 + G.wave) * dt;
    if (G.formOx > edge) G.formDir = -1;
    if (G.formOx < -edge) G.formDir = 1;
    G.formOy = Math.sin(G.clock * 1.35) * 6;

    let waiting = 0;
    let entering = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.state === 'wait') {
        e.delay -= dt;
        if (e.delay <= 0) {
          e.state = 'enter';
          e.wpI = 0;
          e.x = e.wps[0].x;
          e.y = e.wps[0].y;
        } else {
          waiting += 1;
          continue;
        }
      }
      if (e.state === 'enter') {
        entering += 1;
        if (followWaypoints(e, dt, enterSpeed())) {
          e.state = 'form';
          const p = slotPos(e);
          e.x = p.x;
          e.y = p.y;
        }
        continue;
      }
      if (e.state === 'form') {
        const p = slotPos(e);
        e.x = p.x;
        e.y = p.y;
        continue;
      }
      if (e.state === 'hurt') {
        e.hurtT -= dt;
        e.y += 52 * dt;
        e.x += Math.sin(G.t * 7 + e.col) * 38 * dt;
        e.x = clamp(e.x, 16, VW - 16);
        if (e.y > VH + 20) {
          e.y = -24;
          e.wingOff = false;
          e.hp = e.maxHp;
          e.state = 'return';
          e.wps = [slotPos(e)];
          e.wpI = 0;
        } else if (e.hurtT <= 0) {
          e.wingOff = false;
          e.hp = e.maxHp;
          e.state = 'return';
          e.wps = [slotPos(e)];
          e.wpI = 0;
          audio.regen();
        }
        continue;
      }
      if (e.state === 'dive') {
        if (e.wpI >= 3 && e.y < PLAYER_Y - 50) {
          e.x += (G.ship.x - e.x) * dt * 0.4;
        }
        const done = followWaypoints(e, dt, diveSpeed());
        if (e.shotLeft > 0) {
          e.nextShot -= dt;
          if (e.nextShot <= 0 && e.y > 130 && e.y < 560) {
            enemyBomb(e);
            e.shotLeft -= 1;
            e.nextShot = rand(0.32, 0.68);
          }
        }
        if (done || e.y > VH + 28) {
          e.y = -28;
          e.state = 'return';
          e.wps = [slotPos(e)];
          e.wpI = 0;
        }
        continue;
      }
      if (e.state === 'return') {
        e.wps = [slotPos(e)];
        if (followWaypoints(e, dt, 270)) {
          e.state = 'form';
          const p = slotPos(e);
          e.x = p.x;
          e.y = p.y;
        }
      }
    }

    if (!G.formed) {
      const live = aliveCount();
      if (live > 0 && waiting === 0 && entering === 0 && formedCount() === live) {
        G.formed = true;
        G.diveCd = 0.5;
      }
      if (G.waveT > 9 && live > 0) G.formed = true;
    }

    if (G.formed) {
      G.diveCd -= dt;
      if (G.diveCd <= 0) {
        tryDive();
        const base = isCamp() ? 1.5 : 1.15;
        G.diveCd = Math.max(0.38, base - G.wave * 0.08) * rand(0.75, 1.15);
      }
    }

    updateBoss(dt);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.y += s.vy * dt;
      if (s.y < -16) {
        G.shots.splice(i, 1);
        if (G.combo > 0 && G.mode === 'play') audio.miss();
        G.combo = 0;
        G.comboT = 0;
        G.mult = 1;
        continue;
      }
      if (G.boss && G.boss.alive) {
        const kind = shotHitsBoss(s, G.boss);
        if (kind === 'core') {
          G.shots.splice(i, 1);
          hitCore(G.boss, s.x, s.y);
          continue;
        }
        if (kind === 'hull') {
          G.shots.splice(i, 1);
          spark(s.x, s.y, ORG);
          audio.hull();
          continue;
        }
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive || e.state === 'wait') continue;
        if (!shotHitsEnemy(s, e)) continue;
        G.shots.splice(i, 1);
        damageEnemy(e);
        hit = true;
        break;
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
      if (G.mode !== 'play' || G.deadT > 0) continue;
      if (shieldHit(b.x, b.y)) {
        G.bombs.splice(i, 1);
        blockShot(b);
        continue;
      }
      if (G.invuln > 0) continue;
      if (Math.abs(b.x - G.ship.x) < 12 && Math.abs(b.y - G.ship.y) < 12) {
        G.bombs.splice(i, 1);
        killPlayer('shot');
      }
    }
  }

  function collideDives() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.state !== 'dive' && e.state !== 'hurt' && e.state !== 'return') continue;
      if (e.y < PLAYER_Y - 28) continue;
      const hw = (e.wingOff ? 8 : TYPE_HW[e.type]) + 4;
      if (Math.abs(e.x - G.ship.x) < hw && Math.abs(e.y - G.ship.y) < 14) {
        explodeEnemy(e);
        killPlayer('ram');
        return;
      }
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shieldPing = Math.max(0, G.shieldPing - dt * 4.2);
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
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.v * dt * 0.28;
      if (s.y > VH) s.y = 0;
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
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
  }

  function waveClear() {
    if (G.mode !== 'play') return;
    const bonus = 250 * G.wave;
    addScore(bonus);
    audio.wave();
    toast('第 ' + G.wave + ' 波肃清', false, true);
    screenFlash(GOLD, 0.32);
    if (isCamp() && G.wave >= CAMP_WAVES) {
      winRun();
      return;
    }
    G.wave += 1;
    spawnWave();
    G.ready = 1.1;
    const next = waveKind(G.wave);
    if (next === 'boss') toast('母舰来袭', false, true);
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    addScore(8000);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.55);
    kick(3);
    showOverlay('win', '火海肃清', '五关打穿  本局 ' + G.score + ' · 最高 ' + G.best, '再来', '无尽');
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    G.fireHold = false;
    G.shielding = false;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    const lead = (why === 'ram' ? '被火鸟撞上' : '中弹了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '舰毁了', lead, '再来', '换模式');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'end' ? 'end' : 'camp';
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
    toast(isCamp() ? '火海 · 五关清场' : '无尽 · 火鸟不停', false, !isCamp());
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
    showOverlay('title', '火鸟', '底部开火，按住 Shift 举盾挡弹。火鸟编队俯冲，大鸟要打掉翅膀。第五关母舰里有会动的卵核。', '火海', '无尽');
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
    if ((G.fireHold || pointer.down) && G.mode === 'play' && !G.shielding) fire();
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateBombs(dt);
      return;
    }
    updateEnemies(dt);
    updateShots(dt);
    updateBombs(dt);
    collideDives();
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.waveT += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      playSim(dt);
      if (aliveCount() === 0 && !(G.boss && G.boss.alive)) spawnWave();
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
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || 'shot');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = PLAYER_Y;
        G.invuln = 1.5;
        G.bombs = [];
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play') {
      const live = aliveCount();
      if (G.boss) {
        if (!G.boss.alive) waveClear();
      } else if (live === 0) {
        waveClear();
      }
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
    g.addColorStop(0, '#2a0c08');
    g.addColorStop(0.42, '#140806');
    g.addColorStop(1, '#0c0604');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(160), 16 * scale, sx(240), sy(280), 380 * scale);
    vg.addColorStop(0, 'rgba(255, 90, 31, 0.1)');
    vg.addColorStop(0.55, 'rgba(255, 61, 184, 0.04)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.24)');
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

    ctx.fillStyle = 'rgba(255, 90, 31, 0.16)';
    ctx.fillRect(sx(10), sy(PLAYER_Y + 16), (VW - 20) * scale, 2 * scale);
  }

  function drawBoss() {
    const m = G.boss;
    if (!m || !m.alive) return;
    const jx = m.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
    const x = m.x + jx;
    const y = m.y;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(MAG, 0.16);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), 120 * scale, 36 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = rgba(FIRE, 0.95);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y - 6), 108 * scale, 22 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([90, 22, 18], 1);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y + 4), 96 * scale, 16 * scale, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba([40, 10, 12], 0.95);
    ctx.fillRect(sx(x - 44), sy(y - 4), 88 * scale, 28 * scale);

    ctx.fillStyle = rgba(ORG, 0.85);
    ctx.fillRect(sx(x - 104), sy(y + 4), 22 * scale, 10 * scale);
    ctx.fillRect(sx(x + 82), sy(y + 4), 22 * scale, 10 * scale);

    for (let i = 0; i < 7; i++) {
      const lx = x - 84 + i * 28;
      ctx.fillStyle = rgba(i % 2 === 0 ? GOLD : CYN, 0.55 + 0.45 * Math.sin(G.t * 8 + i));
      ctx.fillRect(sx(lx), sy(y - 14), 6 * scale, 4 * scale);
    }

    const egg = eggPos(m);
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 9);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(MAG, 0.28 * pulse);
    ctx.beginPath();
    ctx.ellipse(sx(egg.x), sy(egg.y), 18 * scale, 14 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
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

  function drawEnemies() {
    drawBoss();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state === 'wait') continue;
      const rgb = enemyRgb(e);
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), (10 + e.type * 2) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      if (e.wingOff) {
        drawSprite(e.x, e.y, SPR_HURT, rgb, 2.1, 1);
      } else {
        const frames = SPR[e.type];
        const spr = frames[G.frame & 1];
        const cell = e.type === 2 ? 2.3 : e.type === 1 ? 2.1 : 2;
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
        ctx.fillStyle = rgba(GOLD, 0.22);
        ctx.fillRect(sx(s.x - 1.4), sy(s.y), 2.8 * scale, 12 * scale);
      }
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.5), sy(s.y - 8), 3 * scale, 14 * scale);
      ctx.fillStyle = rgba(FIRE, 0.9);
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

  function drawShield() {
    if (!G.shielding || G.deadT > 0) return;
    const x = G.ship.x;
    const y = G.ship.y - 6;
    const pulse = 0.5 + 0.5 * Math.sin(G.t * 16);
    const ping = G.shieldPing;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), 32 * scale, 22 * scale, 0, Math.PI, TAU);
    ctx.fillStyle = rgba(CYN, 0.12 + ping * 0.28);
    ctx.fill();
    ctx.strokeStyle = rgba(ping > 0.2 ? WHT : GOLD, 0.55 + pulse * 0.35 + ping * 0.4);
    ctx.lineWidth = (2.2 + ping * 2) * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y + 1), 24 * scale, 16 * scale, 0, Math.PI, TAU);
    ctx.strokeStyle = rgba(CYN, 0.35 + pulse * 0.25);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
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
    ctx.fillStyle = rgba(G.shielding ? CYN : FIRE, 1);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), 14 * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawSprite(x, y, SPR_SHIP, G.shielding ? CYN : HOT, 2, 1);
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
    ctx.fillStyle = '#140806';
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
    ctx.fillStyle = '#140806';
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
    drawShield();
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
    if (k === 'Shift') {
      keys.shift = down;
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
      startGame(k === '2' ? 'end' : 'camp');
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

  function bindShieldBtn() {
    if (!btnShield) return;
    function down(e) {
      audio.ensure();
      e.preventDefault();
      pointer.shield = true;
    }
    function up() {
      pointer.shield = false;
    }
    btnShield.addEventListener('pointerdown', down);
    btnShield.addEventListener('pointerup', up);
    btnShield.addEventListener('pointercancel', up);
    btnShield.addEventListener('pointerleave', function () {
      pointer.shield = false;
    });
    btnShield.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
  bindShieldBtn();

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
      else if (G.mode === 'win') startGame('end');
      else startGame('end');
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
      keys.shift = false;
      G.fireHold = false;
      pointer.shield = false;
    }
  });

  requestAnimationFrame(frame);
})();
