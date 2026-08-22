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
  const CELL_X = 38;
  const CELL_Y = 30;
  const FORM_X = 69;
  const FORM_Y = 86;
  const CAMP_WAVES = 8;
  const BEST_KEY = 'playbox-gal-raid-best';
  const MUTE_KEY = 'playbox-gal-raid-mute';
  const OPS = '← → / WASD 移动 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const MINT = [20, 224, 176];
  const TEAL = [0, 201, 160];
  const WHT = [232, 255, 248];
  const HOT = [92, 255, 200];
  const YEL = [255, 214, 70];
  const ORG = [255, 140, 64];

  const TYPE_RGB = [YEL, MAG, MINT];
  const TYPE_RGB_HIT = [ORG, [255, 140, 200], GOLD];
  const TYPE_HW = [11, 12, 13];
  const TYPE_HH = [8, 8, 9];
  const TYPE_SCORE_FORM = [50, 80, 400];
  const TYPE_SCORE_DIVE = [100, 160, 800];

  const SPR = [
    [
      [
        '  #    #  ',
        '   #  #   ',
        '  ######  ',
        ' ######## ',
        '## #### ##',
        ' ######## ',
        '  # ## #  ',
        ' #      # '
      ],
      [
        ' #      # ',
        '  #    #  ',
        '  ######  ',
        ' ######## ',
        '## #### ##',
        ' ######## ',
        '  # ## #  ',
        '   #  #   '
      ]
    ],
    [
      [
        '##      ##',
        '###    ###',
        '##########',
        '  ######  ',
        ' ## ## ## ',
        '##  ##  ##',
        '#        #',
        '  #    #  '
      ],
      [
        '  #    #  ',
        '##      ##',
        '##########',
        '  ######  ',
        ' ## ## ## ',
        '### ## ###',
        ' #      # ',
        '#        #'
      ]
    ],
    [
      [
        '  #     #  ',
        ' ## ## ##  ',
        ' ######### ',
        '###########',
        '## ## ## ##',
        '  #######  ',
        '  # ## #   ',
        ' #  ##  #  '
      ],
      [
        ' #       # ',
        '  # ## #   ',
        ' ######### ',
        '###########',
        '## ## ## ##',
        '  #######  ',
        ' ## ## ##  ',
        '  #     #  '
      ]
    ]
  ];

  const SPR_SHIP = [
    '     ##     ',
    '    ####    ',
    '   ######   ',
    ' ## #### ## ',
    '############',
    '  ##  ##  ##'
  ];

  const SLOTS = (function () {
    const out = [];
    for (let i = 0; i < 4; i++) out.push({ type: 2, col: 3 + i, row: 0, hp: 2 });
    for (let i = 0; i < 8; i++) out.push({ type: 1, col: 1 + i, row: 1, hp: 1 });
    for (let i = 0; i < 8; i++) out.push({ type: 1, col: 1 + i, row: 2, hp: 1 });
    for (let i = 0; i < 10; i++) out.push({ type: 0, col: i, row: 3, hp: 1 });
    for (let i = 0; i < 10; i++) out.push({ type: 0, col: i, row: 4, hp: 1 });
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
    dual: false,
    formOx: 0,
    formDir: 1,
    formOy: 0,
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
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    why: '',
    frame: 0,
    flapT: 0,
    beamCharge: 0,
    beamHum: 0,
    cap: null,
    rescue: null,
    challenge: false,
    chalHits: 0,
    chalTotal: 0,
    chalDone: 0,
    chalIdx: 0,
    muzzle: 0,
    dualGlow: 0
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
    return G.dual ? 28 : 18;
  }
  function shipMax() {
    return VW - (G.dual ? 28 : 18);
  }
  function shipHalfW() {
    return G.dual ? 22 : 12;
  }

  function waveScale() {
    const w = G.wave;
    if (isCamp()) return 1 + (w - 1) * 0.08;
    return 1 + Math.min(1.6, (w - 1) * 0.11);
  }

  function isChallengeWave(wave) {
    if (isCamp()) return wave === 3 || wave === 7;
    return wave > 1 && wave % 4 === 0;
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
      this.beep(880, 0.06, 'square', 0.032, 1680);
    },
    dualShoot() {
      this.ensure();
      this.beep(740, 0.05, 'square', 0.028, 1480);
      this.beep(980, 0.07, 'square', 0.03, 1760);
    },
    hit(type, combo) {
      this.ensure();
      const base = type === 2 ? 980 : type === 1 ? 720 : 540;
      const lift = 1 + Math.min(0.45, combo * 0.03);
      this.noise(0.04, 0.038, 1100);
      this.beep(base * lift, 0.07, 'square', 0.048, base * lift * 1.5);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.06, 'sawtooth', 0.04, 180);
      this.beep(620, 0.08, 'square', 0.035, 880);
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
    tractor() {
      this.ensure();
      this.beep(180, 0.12, 'sawtooth', 0.03, 90);
      this.beep(260, 0.1, 'sine', 0.022, 140);
    },
    capture() {
      this.ensure();
      this.beep(520, 0.18, 'sine', 0.05, 180);
      this.beep(880, 0.22, 'triangle', 0.04, 220);
      this.noise(0.16, 0.045, 400);
    },
    rescue() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.05, 784);
      this.beep(784, 0.14, 'triangle', 0.048, 1175);
      this.beep(1046, 0.22, 'sine', 0.04, 1560);
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
    perfect() {
      this.ensure();
      this.beep(659, 0.1, 'square', 0.045, 880);
      this.beep(880, 0.12, 'triangle', 0.04, 1175);
      this.beep(1318, 0.22, 'sine', 0.05, 1760);
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
      if (G.mode === 'title') stageLabel.textContent = '虫袭';
      else if (G.challenge) stageLabel.textContent = '挑战关';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.challenge || G.wave >= 5));
    }
    if (tagLabel) {
      let tag = isCamp() ? '编队' : '无尽';
      if (G.dual && G.mode === 'play') tag = '双机';
      if (G.challenge && G.mode === 'play') tag = G.chalHits + '/' + G.chalTotal;
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || !!G.cap);
      tagLabel.classList.toggle('hot', G.dual || G.combo >= 8);
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
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或相撞扣命，双机变单机', 'warn');
    else if (G.mode === 'win') setHint('编队肃清 · R 再来 · 空格开火', 'hot');
    else if (G.challenge) setHint('挑战关 · 虫子不还击 · 打中越多分越高', 'hot');
    else if (G.dual) setHint('双机火力 · 被击中会解体成单机', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 躲开俯冲和牵引', 'warn');
    else setHint('← → 移动 · 空格开火 · 打掉俘获 Boss 合体', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GAL';
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
    capArr(particles, 140);
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
    for (let i = 0; i < 86; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.7 : 1.3,
        a: rand(0.25, 0.9),
        p: rand(0, TAU),
        v: rand(8, 38),
        rgb: Math.random() < 0.18 ? MINT : Math.random() < 0.12 ? MAG : WHT
      });
    }
  }

  function slotPos(e) {
    return {
      x: FORM_X + e.col * CELL_X + G.formOx,
      y: FORM_Y + e.row * CELL_Y + G.formOy
    };
  }

  function enemyRgb(e) {
    if (e.hitFlash > 0) return WHT;
    if (e.type === 2 && e.hp <= 1) return TYPE_RGB_HIT[2];
    return TYPE_RGB[e.type];
  }

  function makeEnemy(slot, delay, wps, challenge) {
    return {
      type: slot.type,
      col: slot.col,
      row: slot.row,
      hp: slot.hp,
      maxHp: slot.hp,
      x: wps[0].x,
      y: wps[0].y,
      state: 'wait',
      delay: delay,
      wps: wps,
      wpI: 0,
      alive: true,
      captured: false,
      escort: false,
      willBeam: false,
      beamT: 0,
      beamLife: 0,
      shotLeft: 0,
      nextShot: 0,
      hitFlash: 0,
      gone: false,
      challenge: !!challenge
    };
  }

  function enterPath(side, slot, loop) {
    const startX = side > 0 ? 510 : -30;
    const cx = 240;
    const amp = loop ? 110 : 70;
    const end = { x: FORM_X + slot.col * CELL_X, y: FORM_Y + slot.row * CELL_Y };
    return [
      { x: startX, y: 24 + slot.row * 8 },
      { x: cx + side * 130, y: 150 },
      { x: cx - side * amp * 0.4, y: 290 },
      { x: cx + side * amp * 0.7, y: 210 },
      { x: cx - side * 40, y: 118 },
      end
    ];
  }

  function challengePath(group, i) {
    const t = i / 8;
    if (group === 0) {
      return [
        { x: -30, y: 70 + t * 20 },
        { x: 120, y: 180 },
        { x: 240, y: 140 + Math.sin(i) * 30 },
        { x: 360, y: 280 },
        { x: 520, y: 460 }
      ];
    }
    if (group === 1) {
      return [
        { x: 510, y: 60 + t * 18 },
        { x: 360, y: 200 },
        { x: 240, y: 160 },
        { x: 100, y: 320 },
        { x: -40, y: 520 }
      ];
    }
    if (group === 2) {
      const x = 70 + (i % 8) * 48;
      return [
        { x: x, y: -30 },
        { x: x + ((i & 1) ? 50 : -50), y: 160 },
        { x: 240, y: 260 },
        { x: VW - x, y: 400 },
        { x: VW - x, y: 760 }
      ];
    }
    if (group === 3) {
      const side = i < 4 ? -1 : 1;
      return [
        { x: side > 0 ? 510 : -30, y: 40 },
        { x: 240 + side * 40, y: 180 },
        { x: 240 - side * 90, y: 300 },
        { x: 240 + side * 30, y: 460 },
        { x: 240 - side * 20, y: 760 }
      ];
    }
    return [
      { x: 40 + i * 52, y: -24 },
      { x: 80 + i * 44, y: 140 },
      { x: 240, y: 220 + (i % 3) * 30 },
      { x: 400 - i * 28, y: 380 },
      { x: 240, y: 760 }
    ];
  }

  function spawnWave() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.formed = false;
    G.formOx = 0;
    G.formDir = 1;
    G.formOy = 0;
    G.diveCd = 1.6;
    G.beamCharge = 0;
    G.challenge = isChallengeWave(G.wave);
    G.chalHits = 0;
    G.chalTotal = 40;
    G.chalDone = 0;

    if (G.challenge) {
      G.chalIdx += 1;
      for (let g = 0; g < 5; g++) {
        for (let i = 0; i < 8; i++) {
          const slot = SLOTS[g * 8 + i];
          const wps = challengePath(g, i);
          const delay = g * 1.55 + i * 0.11;
          G.enemies.push(makeEnemy(slot, delay, wps, true));
        }
      }
      return;
    }

    const groups = [
      { from: 24, to: 32, side: 1, t0: 0 },
      { from: 32, to: 40, side: -1, t0: 1.7 },
      { from: 8, to: 16, side: 1, t0: 3.35 },
      { from: 0, to: 4, side: -1, t0: 5.05 },
      { from: 4, to: 8, side: 1, t0: 5.05 },
      { from: 16, to: 24, side: -1, t0: 6.7 }
    ];
    const haste = Math.max(0.62, 1 - (G.wave - 1) * 0.05);
    for (let g = 0; g < groups.length; g++) {
      const gr = groups[g];
      let k = 0;
      for (let i = gr.from; i < gr.to; i++) {
        const slot = SLOTS[i];
        const wps = enterPath(gr.side, slot, true);
        const delay = (gr.t0 + k * 0.12) * haste;
        G.enemies.push(makeEnemy(slot, delay, wps, false));
        k += 1;
      }
    }
  }

  function resetField() {
    G.ship.x = VW * 0.5;
    G.ship.vx = 0;
    G.dual = false;
    G.shots = [];
    G.bombs = [];
    G.cap = null;
    G.rescue = null;
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
    G.dualGlow = 0;
    G.chalIdx = 0;
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
      if (e.alive && (e.state === 'dive' || e.state === 'beam' || e.state === 'return')) n += 1;
    }
    return n;
  }

  function hasCapturer() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].captured) return true;
    }
    return false;
  }

  function hasBeam() {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && (e.state === 'beam' || e.willBeam)) return true;
    }
    return false;
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
    return (268 + G.wave * 14) * (isCamp() ? 1 : 1.08);
  }

  function enterSpeed() {
    return 232 + G.wave * 8;
  }

  function startDive(e, beam) {
    if (!e.alive || e.state !== 'form') return;
    e.state = 'dive';
    e.wpI = 0;
    e.shotLeft = e.type === 2 ? 3 : e.type === 1 ? 2 : 1 + (G.wave > 4 ? 1 : 0);
    e.nextShot = rand(0.28, 0.7);
    const side = e.x < VW * 0.5 ? -1 : 1;
    const px = G.ship.x;
    if (beam) {
      e.willBeam = true;
      e.wps = [
        { x: e.x + side * 24, y: e.y - 12 },
        { x: px + side * 10, y: 240 },
        { x: px, y: 348 }
      ];
    } else {
      e.willBeam = false;
      e.wps = [
        { x: e.x + side * 40, y: e.y - 16 },
        { x: e.x + side * 86, y: e.y + 54 },
        { x: lerp(e.x, px, 0.35) + side * 28, y: 280 },
        { x: px + side * 36, y: 420 },
        { x: px - side * 48, y: 540 },
        { x: px + side * 8, y: 650 },
        { x: px - side * 30, y: 780 }
      ];
    }
  }

  function pickEscorts(boss, n) {
    const cands = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state !== 'form' || e.type !== 1) continue;
      cands.push(e);
    }
    cands.sort(function (a, b) {
      return hypot(a.x - boss.x, a.y - boss.y) - hypot(b.x - boss.x, b.y - boss.y);
    });
    const take = Math.min(n, cands.length);
    for (let i = 0; i < take; i++) {
      startDive(cands[i], false);
      cands[i].escort = true;
    }
  }

  function tryDive() {
    if (!G.formed || G.challenge || G.deadT > 0 || G.cap) return;
    const maxD = Math.min(6, (isCamp() ? 2 : 3) + Math.floor((G.wave - 1) / 2));
    if (divingCount() >= maxD) return;
    const pool = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.state === 'form') pool.push(e);
    }
    if (!pool.length) return;
    let boss = null;
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].type === 2) { boss = pool[i]; break; }
    }
    const wantBeam = boss && !hasCapturer() && !hasBeam() && G.mode === 'play' && Math.random() < (0.22 + G.wave * 0.03);
    if (wantBeam) {
      startDive(boss, true);
      pickEscorts(boss, G.wave >= 5 ? 2 : 1);
      return;
    }
    if (boss && Math.random() < 0.18) {
      startDive(boss, false);
      pickEscorts(boss, 1);
      return;
    }
    const bees = [];
    const flies = [];
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].type === 0) bees.push(pool[i]);
      else if (pool[i].type === 1) flies.push(pool[i]);
    }
    const src = bees.length && Math.random() < 0.62 ? bees : (flies.length ? flies : pool);
    const a = src[(Math.random() * src.length) | 0];
    startDive(a, false);
    if (src.length > 1 && Math.random() < 0.55) {
      let b = src[(Math.random() * src.length) | 0];
      if (b === a && src.length > 1) b = src[(src.indexOf(a) + 1) % src.length];
      if (b !== a) startDive(b, false);
    }
  }

  function inBeam(px, py, boss) {
    const top = boss.y + 10;
    const bot = PLAYER_Y + 18;
    if (py < top || py > bot + 8) return false;
    const t = clamp((py - top) / Math.max(40, bot - top), 0, 1);
    const half = lerp(7, 42, t * t);
    return Math.abs(px - boss.x) < half;
  }

  function beginCapture(boss) {
    if (G.cap || G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.cap = { boss: boss, t: 0, spin: 0 };
    G.fireHold = false;
    G.beamCharge = 0;
    audio.capture();
    screenFlash(CYN, 0.55);
    screenFlash(MAG, 0.4);
    hitStop(0.08);
    kick(5);
    if (stageEl) {
      stageEl.classList.remove('cap');
      void stageEl.offsetWidth;
      stageEl.classList.add('cap');
    }
    toast('被俘获', true, false);
  }

  function finishCapture(boss) {
    boss.captured = true;
    boss.willBeam = false;
    boss.state = 'return';
    boss.wps = [slotPos(boss)];
    boss.wpI = 0;
    G.cap = null;
    G.dualGlow = 0;
    if (G.dual) {
      G.dual = false;
      burst(G.ship.x, G.ship.y, CYN, 14, 220);
      toast('双机被拆 · 一机被俘', true, false);
      G.invuln = 1.35;
      G.ship.x = VW * 0.5;
    } else {
      killPlayer('capture');
    }
  }

  function beginRescue(boss) {
    const x = boss.x;
    const y = boss.y + 22;
    explodeEnemy(boss, true);
    G.rescue = { x: x, y: y, t: 0 };
    audio.rescue();
    screenFlash(GOLD, 0.5);
    kick(4);
    toast('俘虏夺回', false, true);
  }

  function completeRescue() {
    G.rescue = null;
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.dual = true;
    G.dualGlow = 0.8;
    G.invuln = Math.max(G.invuln, 0.45);
    screenFlash(GOLD, 0.42);
    burst(G.ship.x, G.ship.y, GOLD, 22, 280);
    ring(G.ship.x, G.ship.y, GOLD);
    toast('双机合体', false, true);
    addScore(1000 * G.mult);
    floatText(G.ship.x, G.ship.y - 28, '双机', GOLD);
  }

  function destroyCaptive(boss) {
    boss.captured = false;
    burst(boss.x, boss.y + 22, CYN, 16, 240);
    ring(boss.x, boss.y + 22, MAG);
    audio.explode();
    toast('俘虏被毁', true, false);
    kick(3);
  }

  function explodeEnemy(e, rescued) {
    e.alive = false;
    e.captured = false;
    const rgb = enemyRgb(e);
    burst(e.x, e.y, rgb, e.type === 2 ? 22 : 14, e.type === 2 ? 320 : 250);
    ring(e.x, e.y, rgb);
    spark(e.x, e.y, WHT);
    audio.explode();
    if (G.challenge) {
      G.chalHits += 1;
      G.chalDone += 1;
    }
    if (rescued) return;
    const diving = e.state === 'dive' || e.state === 'beam' || e.state === 'return';
    let base = diving ? TYPE_SCORE_DIVE[e.type] : TYPE_SCORE_FORM[e.type];
    if (e.challenge) base = 100 + (e.type * 40) + G.chalIdx * 50;
    const n = base * G.mult;
    addScore(n);
    floatText(e.x, e.y - 10, String(n), rgb);
    hitStop(e.type === 2 ? 0.07 : e.type === 1 ? 0.05 : 0.038);
    kick(e.type === 2 ? 3.2 : 1.8);
  }

  function damageEnemy(e, fromX, fromY) {
    if (!e.alive) return;
    if (e.captured) {
      const capY = e.y + 22;
      if (Math.abs(fromY - capY) < Math.abs(fromY - e.y) && Math.abs(fromX - e.x) < 14) {
        destroyCaptive(e);
        bumpCombo();
        return;
      }
      beginRescue(e);
      bumpCombo();
      return;
    }
    if (e.type === 2 && e.hp > 1) {
      e.hp -= 1;
      e.hitFlash = 0.12;
      spark(e.x, e.y, GOLD);
      audio.bossHit();
      bumpCombo();
      addScore(150 * G.mult);
      floatText(e.x, e.y - 8, String(150 * G.mult), GOLD);
      hitStop(0.045);
      kick(1.4);
      return;
    }
    bumpCombo();
    explodeEnemy(e, false);
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.invuln > 0) return;
    if (G.dual && why !== 'capture') {
      G.dual = false;
      burst(G.ship.x + 14, G.ship.y, CYN, 16, 240);
      ring(G.ship.x + 14, G.ship.y, MAG);
      audio.death();
      screenFlash(MAG, 0.4);
      hitStop(0.06);
      kick(4);
      G.invuln = 1.4;
      toast('双机解体', true, false);
      return;
    }
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
    G.dual = false;
    if (why === 'capture') toast('舰被俘走', true, false);
  }

  function enemyBomb(e) {
    if (G.challenge || G.mode === 'title') return;
    if (G.bombs.length >= (isCamp() ? 6 : 9)) return;
    const aim = (G.ship.x - e.x) * 0.15;
    G.bombs.push({
      x: e.x,
      y: e.y + 10,
      vx: clamp(aim, -50, 50),
      vy: 190 + G.wave * 12
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.cap || G.ready > 0.35) return;
    const cap = G.dual ? 4 : 2;
    if (G.shots.length >= cap || G.fireCd > 0) return;
    if (G.dual) {
      if (G.shots.length > cap - 2) return;
      G.shots.push({ x: G.ship.x - 12, y: G.ship.y - 14, vy: -SHOT_V });
      G.shots.push({ x: G.ship.x + 12, y: G.ship.y - 14, vy: -SHOT_V });
      audio.dualShoot();
    } else {
      G.shots.push({ x: G.ship.x, y: G.ship.y - 14, vy: -SHOT_V });
      audio.shoot();
    }
    G.fireCd = G.dual ? 0.1 : 0.12;
    G.muzzle = 0.08;
    spark(G.ship.x, G.ship.y - 16, CYN);
  }

  function hitBox(e) {
    return { hw: TYPE_HW[e.type], hh: TYPE_HH[e.type] };
  }

  function shotHitsEnemy(s, e) {
    const b = hitBox(e);
    if (Math.abs(s.x - e.x) <= b.hw && Math.abs(s.y - e.y) <= b.hh) return 'body';
    if (e.captured && Math.abs(s.x - e.x) <= 12 && Math.abs(s.y - (e.y + 22)) <= 10) return 'cap';
    return null;
  }

  function updatePlayer(dt) {
    if (G.cap) return;
    if (G.deadT > 0) return;
    let ax = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.ship.x;
      if (Math.abs(dx) > 2) ax = dx > 0 ? 1 : -1;
      G.ship.x = lerp(G.ship.x, clamp(pointer.x, shipMin(), shipMax()), 1 - Math.exp(-dt * 14));
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      const spd = 300;
      G.ship.x += ax * spd * dt;
    }
    G.ship.x = clamp(G.ship.x, shipMin(), shipMax());
  }

  function updateCapture(dt) {
    if (!G.cap) return;
    const c = G.cap;
    const boss = c.boss;
    c.t += dt;
    c.spin += dt * 8;
    if (!boss.alive) {
      G.cap = null;
      return;
    }
    const dx = boss.x - G.ship.x;
    const dy = (boss.y + 20) - G.ship.y;
    const d = hypot(dx, dy);
    const v = 150 + c.t * 80;
    if (d < 10 || c.t > 1.35) {
      G.ship.x = boss.x;
      G.ship.y = boss.y + 20;
      finishCapture(boss);
      G.ship.y = PLAYER_Y;
      return;
    }
    G.ship.x += (dx / d) * v * dt;
    G.ship.y += (dy / d) * v * dt;
  }

  function updateRescue(dt) {
    if (!G.rescue) return;
    const r = G.rescue;
    r.t += dt;
    const tx = G.ship.x;
    const ty = G.ship.y;
    const dx = tx - r.x;
    const dy = ty - r.y;
    const d = hypot(dx, dy);
    const v = 280;
    if (G.deadT > 0) return;
    if (d < 12 || r.t > 1.6) {
      completeRescue();
      return;
    }
    r.x += (dx / d) * v * dt;
    r.y += (dy / d) * v * dt;
  }

  function updateEnemies(dt) {
    G.flapT += dt;
    if (G.flapT >= 0.38) {
      G.flapT = 0;
      G.frame += 1;
    }
    if (!G.challenge) {
      const edge = 36 + Math.min(18, (40 - aliveCount()) * 0.4);
      G.formOx += G.formDir * (18 + G.wave) * dt;
      if (G.formOx > edge) G.formDir = -1;
      if (G.formOx < -edge) G.formDir = 1;
      G.formOy = Math.sin(G.clock * 1.2) * 3;
    }

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
        const spd = e.challenge ? 250 + G.wave * 6 : enterSpeed();
        if (followWaypoints(e, dt, spd)) {
          if (e.challenge) {
            e.alive = false;
            e.gone = true;
            G.chalDone += 1;
          } else {
            e.state = 'form';
            const p = slotPos(e);
            e.x = p.x;
            e.y = p.y;
          }
        }
        continue;
      }
      if (e.state === 'form') {
        const p = slotPos(e);
        e.x = p.x;
        e.y = p.y;
        continue;
      }
      if (e.state === 'dive') {
        if (e.wpI >= 3 && e.y < PLAYER_Y - 50 && !e.willBeam) {
          e.x += (G.ship.x - e.x) * dt * 0.42;
        }
        const done = followWaypoints(e, dt, diveSpeed());
        if (!G.challenge && e.shotLeft > 0) {
          e.nextShot -= dt;
          if (e.nextShot <= 0 && e.y > 130 && e.y < 560) {
            enemyBomb(e);
            e.shotLeft -= 1;
            e.nextShot = rand(0.34, 0.7);
          }
        }
        if (done) {
          if (e.willBeam) {
            e.state = 'beam';
            e.beamT = 0;
            e.beamLife = 3.25;
            e.willBeam = false;
          } else if (e.y > VH - 8) {
            e.y = -28;
            e.state = 'return';
            e.wps = [slotPos(e)];
            e.wpI = 0;
            e.escort = false;
          } else {
            e.state = 'return';
            e.wps = [slotPos(e)];
            e.wpI = 0;
          }
        }
        if (e.y > VH + 30) {
          if (e.challenge) {
            e.alive = false;
            e.gone = true;
            G.chalDone += 1;
          } else {
            e.y = -28;
            e.state = 'return';
            e.wps = [slotPos(e)];
            e.wpI = 0;
          }
        }
        continue;
      }
      if (e.state === 'beam') {
        e.beamT += dt;
        e.x = lerp(e.x, G.ship.x, 1 - Math.exp(-dt * 1.6));
        G.beamHum -= dt;
        if (G.beamHum <= 0) {
          audio.tractor();
          G.beamHum = 0.16;
        }
        if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !G.cap) {
          if (inBeam(G.ship.x, G.ship.y, e)) G.beamCharge += dt;
          else G.beamCharge = Math.max(0, G.beamCharge - dt * 0.7);
          if (G.beamCharge >= 0.58) beginCapture(e);
        }
        if (e.beamT >= e.beamLife) {
          e.state = 'return';
          e.wps = [slotPos(e)];
          e.wpI = 0;
          G.beamCharge = 0;
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
          e.escort = false;
        }
      }
    }

    if (!G.formed && !G.challenge) {
      const live = aliveCount();
      if (live > 0 && waiting === 0 && entering === 0 && formedCount() === live) {
        G.formed = true;
        G.diveCd = 0.55;
      }
      if (G.clock > 12 && live > 0) G.formed = true;
    }

    if (G.formed && !G.challenge) {
      G.diveCd -= dt;
      if (G.diveCd <= 0) {
        tryDive();
        const base = isCamp() ? 1.55 : 1.2;
        G.diveCd = Math.max(0.42, base - G.wave * 0.08) * rand(0.75, 1.15);
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.y += s.vy * dt;
      if (s.y < -16) {
        G.shots.splice(i, 1);
        if (G.combo > 0 && G.mode === 'play') audio.miss();
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive || e.state === 'wait') continue;
        const kind = shotHitsEnemy(s, e);
        if (!kind) continue;
        G.shots.splice(i, 1);
        if (kind === 'cap') {
          destroyCaptive(e);
          bumpCombo();
        } else {
          damageEnemy(e, s.x, s.y);
        }
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
      if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.cap) continue;
      const hw = shipHalfW();
      if (Math.abs(b.x - G.ship.x) < hw && Math.abs(b.y - G.ship.y) < 12) {
        G.bombs.splice(i, 1);
        killPlayer('shot');
      }
    }
  }

  function collideDives() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.cap) return;
    const hw = shipHalfW();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.state !== 'dive' && e.state !== 'beam' && e.state !== 'return' && !e.challenge) continue;
      if (e.y < PLAYER_Y - 28) continue;
      if (Math.abs(e.x - G.ship.x) < hw + 8 && Math.abs(e.y - G.ship.y) < 14) {
        explodeEnemy(e, false);
        killPlayer('ram');
        return;
      }
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.dualGlow = Math.max(0, G.dualGlow - dt);
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
      s.y += s.v * dt * 0.25;
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
    let bonus = 200 * G.wave;
    if (G.challenge) {
      const perfect = G.chalHits >= G.chalTotal;
      bonus = G.chalHits * 40 + (perfect ? 1000 * Math.max(1, G.chalIdx) : 0);
      if (perfect) {
        audio.perfect();
        toast('全中 +' + (1000 * Math.max(1, G.chalIdx)), false, true);
        screenFlash(GOLD, 0.45);
      } else {
        toast('击中 ' + G.chalHits + '/' + G.chalTotal, false, false);
      }
    } else {
      toast('第 ' + G.wave + ' 波肃清', false, true);
    }
    addScore(bonus);
    audio.wave();
    if (isCamp() && G.wave >= CAMP_WAVES) {
      winRun();
      return;
    }
    G.wave += 1;
    spawnWave();
    G.ready = 1.15;
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    addScore(8000);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.55);
    kick(3);
    showOverlay('win', '虫群肃清', '编队打穿  本局 ' + G.score + ' · 最高 ' + G.best, '再来', '无尽');
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
    toast(isCamp() ? '编队 · 八波清场' : '无尽 · 俯冲不停', false, !isCamp());
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
    showOverlay('title', '虫袭', '编队入场再俯冲。Boss 牵引可俘走你的舰，打掉俘获者合体双机。', '编队', '无尽');
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
    updateCapture(dt);
    updateRescue(dt);
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
    collideDives();
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
      updateRescue(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('舰毁了');
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

    if (G.mode === 'play') {
      const live = aliveCount();
      if (G.challenge) {
        if (G.chalDone >= G.chalTotal && live === 0) waveClear();
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
    g.addColorStop(0, '#06241c');
    g.addColorStop(0.45, '#03140f');
    g.addColorStop(1, '#020a08');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(180), 16 * scale, sx(240), sy(280), 360 * scale);
    vg.addColorStop(0, 'rgba(20, 224, 176, 0.08)');
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

    ctx.fillStyle = 'rgba(20, 224, 176, 0.14)';
    ctx.fillRect(sx(10), sy(PLAYER_Y + 16), (VW - 20) * scale, 2 * scale);
  }

  function drawBeam(e) {
    const top = e.y + 10;
    const bot = PLAYER_Y + 18;
    const h = bot - top;
    if (h < 8) return;
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 14);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const t0 = i / 7;
      const t1 = (i + 1) / 7;
      const y0 = top + h * t0;
      const y1 = top + h * t1;
      const w0 = lerp(6, 40, t0 * t0);
      const w1 = lerp(6, 40, t1 * t1);
      ctx.beginPath();
      ctx.moveTo(sx(e.x - w0), sy(y0));
      ctx.lineTo(sx(e.x + w0), sy(y0));
      ctx.lineTo(sx(e.x + w1), sy(y1));
      ctx.lineTo(sx(e.x - w1), sy(y1));
      ctx.closePath();
      const rgb = i % 2 === 0 ? CYN : MAG;
      ctx.fillStyle = rgba(rgb, 0.07 * pulse);
      ctx.fill();
    }
    ctx.strokeStyle = rgba(CYN, 0.45 * pulse);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(e.x - 6), sy(top));
    ctx.lineTo(sx(e.x - 40), sy(bot));
    ctx.moveTo(sx(e.x + 6), sy(top));
    ctx.lineTo(sx(e.x + 40), sy(bot));
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemies() {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state === 'wait') continue;
      if (e.state === 'beam') drawBeam(e);
      const frames = SPR[e.type];
      const spr = frames[G.frame & 1];
      const rgb = enemyRgb(e);
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), (10 + e.type) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawSprite(e.x, e.y, spr, rgb, 2, 1);
      if (e.captured) {
        const bob = Math.sin(G.t * 6) * 1.5;
        drawSprite(e.x, e.y + 22 + bob, SPR_SHIP, [120, 180, 200], 1.6, 0.9);
      }
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!REDUCE) {
        ctx.fillStyle = rgba(MINT, 0.22);
        ctx.fillRect(sx(s.x - 1.4), sy(s.y), 2.8 * scale, 12 * scale);
      }
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.5), sy(s.y - 8), 3 * scale, 14 * scale);
      ctx.fillStyle = rgba(CYN, 0.85);
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
    if (G.cap) {
      ctx.save();
      ctx.translate(sx(G.ship.x), sy(G.ship.y));
      ctx.rotate(G.cap.spin);
      ctx.translate(-sx(G.ship.x), -sy(G.ship.y));
      drawSprite(G.ship.x, G.ship.y, SPR_SHIP, MAG, 2, 0.95);
      ctx.restore();
      return;
    }
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const glow = 0.2 + G.dualGlow * 0.5;
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = rgba(G.dual ? GOLD : CYN, 1);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), (G.dual ? 26 : 14) * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (G.dual) {
      drawSprite(x - 12, y, SPR_SHIP, CYN, 2, 1);
      drawSprite(x + 12, y, SPR_SHIP, CYN, 2, 1);
    } else {
      drawSprite(x, y, SPR_SHIP, CYN, 2, 1);
    }
    if (G.muzzle > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      if (G.dual) {
        ctx.beginPath();
        ctx.arc(sx(x - 12), sy(y - 16), 5 * scale, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx(x + 12), sy(y - 16), 5 * scale, 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawRescue() {
    if (!G.rescue) return;
    const r = G.rescue;
    drawSprite(r.x, r.y, SPR_SHIP, GOLD, 2, 0.95);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(r.x), sy(r.y));
    ctx.lineTo(sx(G.ship.x), sy(G.ship.y));
    ctx.stroke();
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
    ctx.fillStyle = '#03110c';
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
    ctx.fillStyle = '#03110c';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    drawBg();
    drawEnemies();
    drawShots();
    drawRescue();
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
    if (k === 'ArrowUp' || k === 'ArrowDown' || space) {
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
