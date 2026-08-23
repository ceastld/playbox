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
  const BOX_T = 548;
  const BOX_B = 686;
  const SHOT_V = 640;
  const SHIP_SPD = 290;
  const COMBO_WIN = 1.48;
  const CELL_X = 40;
  const CELL_Y = 32;
  const FORM_X = 60;
  const FORM_Y = 78;
  const MAX_STAGE = 5;
  const BEST_KEY = 'playbox-galaga88-best';
  const MUTE_KEY = 'playbox-galaga88-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格开火 · R 重开 · M 静音';
  const STAGE_NAME = ['', '黄湾', '虹廊', '挑战', '核阵', '加王'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const TEAL = [46, 224, 168];
  const WHT = [255, 244, 212];
  const HOT = [255, 176, 32];
  const YEL = [255, 214, 70];
  const ORG = [255, 106, 58];
  const PNK = [255, 140, 200];

  const TYPE_RGB = [YEL, MAG, TEAL, ORG];
  const TYPE_RGB_HIT = [ORG, PNK, GOLD, WHT];
  const TYPE_HW = [11, 12, 14, 13];
  const TYPE_HH = [8, 8, 10, 9];
  const TYPE_SCORE_FORM = [50, 80, 400, 120];
  const TYPE_SCORE_DIVE = [100, 160, 800, 240];
  const TYPE_CHIP = [0, 0, 150, 80];

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
    ],
    [
      [
        '#        #',
        ' ## ## ## ',
        '##########',
        ' ###  ### ',
        '## #### ##',
        '  # ## #  ',
        ' ##    ## ',
        '#        #'
      ],
      [
        ' #      # ',
        '# ## ##  #',
        '##########',
        ' ###  ### ',
        '## #### ##',
        ' #  ##  # ',
        '##      ##',
        '  #    #  '
      ]
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

  const SPR_SHIP_CAP = [
    '     ##     ',
    '   ######   ',
    ' # ##  ## # ',
    '############',
    '  ## ## ##  ',
    ' #   ##   # ',
    '##        ##'
  ];

  const SPR_KING = [
    [
      '    ##      ##    ',
      '   ####    ####   ',
      '  ##  ########  ##',
      ' ################ ',
      '## ## ###### ## ##',
      '  ##############  ',
      '   ## ##  ## ##   ',
      '  ##   ####   ##  ',
      ' #      ##      # ',
      '        ##        '
    ],
    [
      '   ##        ##   ',
      '    ####  ####    ',
      '  ##  ########  ##',
      ' ################ ',
      '## ## ###### ## ##',
      '  ##############  ',
      ' ##  ## ## ##  ## ',
      '  ##   ####   ##  ',
      '        ##        ',
      '       ##  ##     '
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
  const shipLabel = document.getElementById('ship-label');
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
  const pointer = { down: false, hover: false, x: VW * 0.5, y: HOME_Y, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

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
    ship: { x: VW * 0.5, y: HOME_Y },
    dual: false,
    dualGlow: 0,
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
    flashRgb: GOLD,
    punch: 1,
    toastT: 0,
    why: '',
    flapT: 0,
    muzzle: 0,
    cap: null,
    rescue: null,
    beamCharge: 0,
    pendingWin: false,
    clearT: 0,
    challenge: false,
    chalHits: 0,
    chalTotal: 0,
    chalDone: 0,
    chalIdx: 0,
    kingPhase: 0,
    escortCd: 0,
    kingBeamed: false
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
    return G.wave === 5;
  }
  function isChallengeWave(w) {
    return w === 3;
  }
  function haste() {
    const base = isCore() ? 1.26 : 1;
    return base + Math.min(0.22, (G.wave - 1) * 0.04);
  }
  function shipMin() {
    return G.dual ? 28 : BOX_L;
  }
  function shipMax() {
    return G.dual ? 452 : BOX_R;
  }
  function modeName() {
    return isCore() ? '加核' : '加加';
  }
  function gunName() {
    return G.dual ? '双机' : '单机';
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
      this.beep(820, 0.05, 'square', 0.03, 1640);
    },
    dualShoot() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.028, 1760);
      this.beep(1320, 0.06, 'triangle', 0.022, 1980);
    },
    hit(type, combo) {
      this.ensure();
      const base = type === 4 ? 280 : type === 2 ? 1020 : type === 1 ? 760 : type === 3 ? 640 : 560;
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
    rescue() {
      this.ensure();
      this.beep(880, 0.09, 'square', 0.042, 1760);
      this.beep(1320, 0.14, 'sine', 0.04, 1980);
      this.beep(660, 0.1, 'triangle', 0.03, 990);
    },
    bossHit() {
      this.ensure();
      this.beep(220, 0.05, 'sawtooth', 0.03, 160);
      this.beep(640, 0.06, 'square', 0.028, 980);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '加加';
      else if (isKingWave() && G.mode === 'play') stageLabel.textContent = '加王';
      else stageLabel.textContent = '第 ' + G.wave + ' 关 ' + (STAGE_NAME[G.wave] || '');
      stageLabel.classList.toggle('hot', isKingWave() && G.mode === 'play');
    }
    if (tagLabel) {
      tagLabel.textContent = G.mode === 'title' ? 'GL88' : (G.challenge ? '挑战' : modeName());
      tagLabel.classList.toggle('warn', G.cap != null);
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.dual);
    }
    if (shipLabel) {
      shipLabel.textContent = gunName();
      shipLabel.classList.toggle('dual', G.dual);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint('移动开火 · 打掉俘获加王合体双机 · 五关见王', '');
    else if (G.dual) setHint('双机并射 · 再被俘会拆成单机', 'hot');
    else if (G.cap) setHint('被牵引中', 'warn');
    else if (G.challenge) setHint('挑战关 · 虫子不还击 · 打尽有奖', 'hot');
    else if (isKingWave()) setHint('加王 · 打掉俘获者合体 · 撞机扣命', 'hot');
    else setHint('←↑↓→ 移动 · 空格开火 · 打掉俘获加王合体', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GL88';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const start = kind === 'title';
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', start);
    if (btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else if (kind === 'win') btnOvModes.textContent = isCore() ? '换模式' : '加核';
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
    for (let i = 0; i < 92; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.7 : 1.3,
        a: rand(0.22, 0.9),
        p: rand(0, TAU),
        v: rand(10, 42),
        rgb: Math.random() < 0.16 ? HOT : Math.random() < 0.1 ? MAG : Math.random() < 0.1 ? TEAL : WHT
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
    if (e.isKing) return e.hp < e.maxHp * 0.4 ? ORG : TEAL;
    if (e.type === 2 && e.hp <= 1) return TYPE_RGB_HIT[2];
    if (e.type === 3 && e.hp <= 1) return TYPE_RGB_HIT[3];
    return TYPE_RGB[e.type] || GOLD;
  }

  function hitBox(e) {
    if (e.isKing) return { hw: 28, hh: 20 };
    return { hw: TYPE_HW[e.type] || 11, hh: TYPE_HH[e.type] || 8 };
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
      challenge: !!challenge,
      isKing: !!slot.isKing,
      ang: 0,
      orbit: 0
    };
  }

  function enterPath(side, slot) {
    const startX = side > 0 ? 510 : -30;
    const cx = 240;
    const amp = 88;
    const end = { x: FORM_X + slot.col * CELL_X, y: FORM_Y + slot.row * CELL_Y };
    return [
      { x: startX, y: 22 + slot.row * 8 },
      { x: cx + side * 138, y: 148 },
      { x: cx - side * amp * 0.42, y: 292 },
      { x: cx + side * amp * 0.72, y: 206 },
      { x: cx - side * 36, y: 116 },
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

  function buildSlots(wave, core) {
    const extra = core && wave !== 3 && wave !== 5;
    const out = [];
    function row(type, cols, r, hp, col0) {
      const c0 = col0 == null ? Math.floor((10 - cols) / 2) : col0;
      for (let i = 0; i < cols; i++) out.push({ type: type, col: c0 + i, row: r, hp: hp });
    }
    if (wave === 1) {
      row(2, 4, 0, 2);
      row(1, 8, 1, 1);
      row(1, 8, 2, 1);
      row(0, 10, 3, 1, 0);
      row(0, 10, 4, 1, 0);
      if (extra) row(0, 10, 5, 1, 0);
    } else if (wave === 2) {
      row(2, 4, 0, 2);
      row(3, 8, 1, 2);
      row(1, 8, 2, 1);
      row(0, 10, 3, 1, 0);
      row(0, 10, 4, 1, 0);
      if (extra) row(3, 8, 5, 2);
    } else if (wave === 4) {
      row(2, 6, 0, 2);
      row(3, 10, 1, 2, 0);
      row(1, 10, 2, 1, 0);
      row(0, 10, 3, 1, 0);
      row(0, 10, 4, 1, 0);
      if (extra) row(1, 10, 5, 1, 0);
    }
    return out;
  }

  function spawnKing() {
    const hp = Math.round((isCore() ? 118 : 96));
    const king = makeEnemy(
      { type: 2, col: 4, row: 0, hp: hp, isKing: true },
      0.15,
      [{ x: 240, y: -40 }, { x: 240, y: 132 }],
      false
    );
    king.isKing = true;
    king.type = 4;
    king.hp = hp;
    king.maxHp = hp;
    G.enemies.push(king);
    const n = isCore() ? 8 : 6;
    for (let i = 0; i < n; i++) {
      const type = i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 0;
      const ang = (i / n) * TAU;
      const slot = { type: type, col: 2 + (i % 6), row: 1 + (i % 3), hp: type === 3 ? 2 : 1 };
      const ex = 240 + Math.cos(ang) * 70;
      const ey = 210 + Math.sin(ang) * 28;
      const e = makeEnemy(slot, 0.55 + i * 0.12, [{ x: i % 2 ? 510 : -30, y: 40 }, { x: ex, y: ey }], false);
      e.escort = true;
      e.orbit = ang;
      G.enemies.push(e);
    }
    G.kingPhase = 0;
    G.escortCd = 2.2;
    G.kingBeamed = false;
  }

  function spawnWave() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.formed = false;
    G.formOx = 0;
    G.formDir = 1;
    G.formOy = 0;
    G.diveCd = 1.55;
    G.beamCharge = 0;
    G.challenge = isChallengeWave(G.wave);
    G.chalHits = 0;
    G.chalTotal = 40;
    G.chalDone = 0;
    G.pendingWin = false;
    G.clearT = 0;
    G.kingPhase = 0;
    G.kingBeamed = false;

    if (isKingWave()) {
      spawnKing();
      return;
    }

    if (G.challenge) {
      G.chalIdx += 1;
      const types = [0, 1, 3, 0, 1];
      for (let g = 0; g < 5; g++) {
        for (let i = 0; i < 8; i++) {
          const type = types[g];
          const slot = { type: type, col: i, row: g, hp: 1 };
          const wps = challengePath(g, i);
          const delay = g * 1.5 + i * 0.11;
          G.enemies.push(makeEnemy(slot, delay, wps, true));
        }
      }
      return;
    }

    const slots = buildSlots(G.wave, isCore());
    const groups = [];
    const byRow = {};
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const k = s.row;
      if (!byRow[k]) byRow[k] = [];
      byRow[k].push(i);
    }
    const rows = Object.keys(byRow).map(Number).sort(function (a, b) { return b - a; });
    let t0 = 0;
    let side = 1;
    for (let r = 0; r < rows.length; r++) {
      const idxs = byRow[rows[r]];
      const mid = Math.ceil(idxs.length / 2);
      groups.push({ idxs: idxs.slice(0, mid), side: side, t0: t0 });
      groups.push({ idxs: idxs.slice(mid), side: -side, t0: t0 });
      t0 += 1.55;
      side = -side;
    }
    const hs = Math.max(0.58, 1 - (G.wave - 1) * 0.05) / (isCore() ? 1.12 : 1);
    for (let g = 0; g < groups.length; g++) {
      const gr = groups[g];
      for (let i = 0; i < gr.idxs.length; i++) {
        const slot = slots[gr.idxs[i]];
        const wps = enterPath(gr.side, slot);
        G.enemies.push(makeEnemy(slot, (gr.t0 + i * 0.09) * hs, wps, false));
      }
    }
  }

  function resetField() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.ship.x = VW * 0.5;
    G.ship.y = HOME_Y;
    G.dual = false;
    G.dualGlow = 0;
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
    G.cap = null;
    G.rescue = null;
    G.beamCharge = 0;
    G.pendingWin = false;
    G.clearT = 0;
    G.chalIdx = 0;
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
    return false;
  }

  function diveSpeed() {
    return (270 + G.wave * 16) * haste();
  }

  function enterSpeed() {
    return (228 + G.wave * 8) * haste();
  }

  function startDive(e, beam) {
    if (!e.alive || e.state !== 'form') return;
    if (e.isKing) return;
    e.state = 'dive';
    e.wpI = 0;
    e.shotLeft = e.type === 2 ? 3 : e.type === 3 ? 3 : e.type === 1 ? 2 : 1 + (G.wave > 3 ? 1 : 0);
    e.nextShot = rand(0.24, 0.64);
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
      if (!e.alive || e.state !== 'form' || e.isKing) continue;
      if (e.type === 2) continue;
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

  function divingCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && (e.state === 'dive' || e.state === 'beam' || e.state === 'return')) n += 1;
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
      if (e.alive && e.state === 'form') n += 1;
    }
    return n;
  }

  function kingOf() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].isKing) return G.enemies[i];
    }
    return null;
  }

  function maxDives() {
    const n = isCore() ? 3 : 2;
    return Math.min(6, n + Math.floor((G.wave - 1) / 2));
  }

  function tryDive() {
    if (!G.formed || G.challenge || G.deadT > 0 || G.cap) return;
    if (isKingWave()) return;
    if (divingCount() >= maxDives()) return;
    const pool = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.state === 'form' && !e.isKing) pool.push(e);
    }
    if (!pool.length) return;
    let boss = null;
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].type === 2) { boss = pool[i]; break; }
    }
    const wantBeam = boss && !hasCapturer() && !hasBeam() && G.mode === 'play' && Math.random() < (0.24 + G.wave * 0.03);
    if (wantBeam) {
      startDive(boss, true);
      pickEscorts(boss, G.wave >= 4 || isCore() ? 2 : 1);
      return;
    }
    if (boss && Math.random() < 0.2) {
      startDive(boss, false);
      pickEscorts(boss, 1);
      return;
    }
    const bees = [];
    const flies = [];
    const scorps = [];
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].type === 0) bees.push(pool[i]);
      else if (pool[i].type === 1) flies.push(pool[i]);
      else if (pool[i].type === 3) scorps.push(pool[i]);
    }
    let src = bees;
    const roll = Math.random();
    if (scorps.length && roll < 0.28) src = scorps;
    else if (flies.length && roll < 0.58) src = flies;
    if (!src.length) src = pool;
    const a = src[(Math.random() * src.length) | 0];
    startDive(a, false);
    if (src.length > 1 && Math.random() < (isCore() ? 0.7 : 0.52)) {
      let b = src[(Math.random() * src.length) | 0];
      if (b === a && src.length > 1) b = src[(src.indexOf(a) + 1) % src.length];
      if (b !== a) startDive(b, false);
    }
  }

  function inBeam(px, py, boss) {
    const top = boss.y + 10;
    const bot = BOX_B + 8;
    if (py < top || py > bot + 8) return false;
    const t = clamp((py - top) / Math.max(40, bot - top), 0, 1);
    const half = lerp(8, 46, t * t);
    return Math.abs(px - boss.x) < half;
  }

  function beginTractor(e) {
    e.state = 'beam';
    e.willBeam = false;
    e.beamT = 0;
    e.beamLife = isCore() ? 2.7 : 3.2;
    e.shotLeft = 0;
    audio.tractor();
    screenFlash(TEAL, 0.28);
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
    boss.wps = boss.isKing ? [{ x: 240, y: 132 }] : [slotPos(boss)];
    boss.wpI = 0;
    G.cap = null;
    G.dualGlow = 0;
    if (G.dual) {
      G.dual = false;
      burst(G.ship.x, G.ship.y, CYN, 14, 220);
      toast('双机被拆 · 一机被俘', true, false);
      G.invuln = 1.35;
      G.ship.x = VW * 0.5;
      G.ship.y = HOME_Y;
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
    syncHud();
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
    const big = e.isKing || e.type === 2;
    burst(e.x, e.y, rgb, e.isKing ? 36 : big ? 22 : 14, e.isKing ? 380 : big ? 320 : 250);
    ring(e.x, e.y, rgb);
    spark(e.x, e.y, WHT);
    audio.explode();
    audio.hit(e.isKing ? 4 : e.type, G.combo);
    if (G.challenge) {
      G.chalHits += 1;
      G.chalDone += 1;
    }
    if (rescued) return;
    if (e.isKing) {
      const n = (4000 + 1500) * G.mult;
      addScore(n);
      floatText(e.x, e.y - 12, String(n), GOLD);
      hitStop(0.08);
      kick(6);
      screenFlash(GOLD, 0.55);
      G.pendingWin = true;
      G.clearT = 1.65;
      toast('加王击坠', false, true);
      return;
    }
    const diving = e.state === 'dive' || e.state === 'beam' || e.state === 'return';
    let base = diving ? TYPE_SCORE_DIVE[e.type] : TYPE_SCORE_FORM[e.type];
    if (e.challenge) base = 100 + (e.type * 40) + G.chalIdx * 50;
    const n = base * G.mult;
    addScore(n);
    floatText(e.x, e.y - 10, String(n), rgb);
    hitStop(e.type === 2 ? 0.07 : e.type === 3 ? 0.055 : e.type === 1 ? 0.05 : 0.038);
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
    if (e.isKing) {
      e.hp -= 1;
      e.hitFlash = 0.08;
      spark(e.x, e.y, GOLD);
      audio.bossHit();
      bumpCombo();
      addScore(10 * G.mult);
      hitStop(0.034);
      kick(1.2);
      if (e.hp <= 0) explodeEnemy(e, false);
      return;
    }
    if ((e.type === 2 || e.type === 3) && e.hp > 1) {
      e.hp -= 1;
      e.hitFlash = 0.12;
      spark(e.x, e.y, GOLD);
      audio.chip();
      bumpCombo();
      const chip = TYPE_CHIP[e.type] * G.mult;
      addScore(chip);
      floatText(e.x, e.y - 8, String(chip), GOLD);
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
      syncHud();
      return;
    }
    G.lives -= 1;
    G.why = why;
    G.deadT = 0.95;
    G.fireHold = false;
    G.shots = [];
    burst(G.ship.x, G.ship.y, CYN, 26, 340);
    ring(G.ship.x, G.ship.y, MAG);
    audio.death();
    screenFlash(MAG, 0.55);
    hitStop(0.078);
    kick(7);
    G.dual = false;
    if (why === 'capture') toast('舰被俘走', true, false);
    syncPips();
  }

  function enemyBomb(e, extra) {
    if (G.challenge || G.mode === 'title') return;
    const cap = isCore() ? 10 : 7;
    if (G.bombs.length >= cap) return;
    const aim = (G.ship.x - e.x) * (extra ? 0.28 : 0.16);
    const spd = (188 + G.wave * 12) * (isCore() ? 1.18 : 1);
    G.bombs.push({
      x: e.x,
      y: e.y + 12,
      vx: clamp(aim, extra ? -90 : -54, extra ? 90 : 54),
      vy: spd
    });
  }

  function kingRing(k) {
    const n = G.kingPhase >= 2 ? 12 : 8;
    const spd = 92 + G.wave * 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + G.t;
      G.bombs.push({
        x: k.x,
        y: k.y + 8,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd + 40
      });
    }
  }

  function kingSpread(k) {
    const n = G.kingPhase >= 1 ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1) - 0.5);
      const ang = Math.atan2(G.ship.y - k.y, G.ship.x - k.x) + t * 0.38;
      const spd = 160 + G.wave * 8;
      G.bombs.push({
        x: k.x,
        y: k.y + 10,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd
      });
    }
  }

  function spawnEscort() {
    if (G.mode !== 'play' || !isKingWave()) return;
    if (!kingOf()) return;
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && !G.enemies[i].isKing) n += 1;
    }
    if (n >= (isCore() ? 7 : 5)) return;
    const type = Math.random() < 0.4 ? 3 : Math.random() < 0.5 ? 1 : 0;
    const side = Math.random() < 0.5 ? 1 : -1;
    const slot = { type: type, col: 4, row: 2, hp: type === 3 ? 2 : 1 };
    const e = makeEnemy(slot, 0, [{ x: side > 0 ? 510 : -30, y: 80 }, { x: 240 + side * 80, y: 180 }], false);
    e.escort = true;
    e.state = 'enter';
    G.enemies.push(e);
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

  function shotHitsEnemy(s, e) {
    const b = hitBox(e);
    if (Math.abs(s.x - e.x) <= b.hw && Math.abs(s.y - e.y) <= b.hh) return 'body';
    if (e.captured && Math.abs(s.x - e.x) <= 12 && Math.abs(s.y - (e.y + 22)) <= 10) return 'cap';
    return null;
  }

  function shipHits(x, y, hw, hh) {
    const phw = 7;
    const phh = 8;
    if (G.dual) {
      return (Math.abs(x - (G.ship.x - 14)) < hw + phw && Math.abs(y - G.ship.y) < hh + phh)
        || (Math.abs(x - (G.ship.x + 14)) < hw + phw && Math.abs(y - G.ship.y) < hh + phh);
    }
    return Math.abs(x - G.ship.x) < hw + phw && Math.abs(y - G.ship.y) < hh + phh;
  }

  function updatePlayer(dt) {
    if (G.cap) return;
    if (G.deadT > 0) return;
    let ax = 0;
    let ay = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      G.ship.x = lerp(G.ship.x, clamp(pointer.x, shipMin(), shipMax()), 1 - Math.exp(-dt * 14));
      G.ship.y = lerp(G.ship.y, clamp(pointer.y, BOX_T, BOX_B), 1 - Math.exp(-dt * 14));
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax && ay) {
        ax *= 0.7071;
        ay *= 0.7071;
      }
      G.ship.x += ax * SHIP_SPD * dt;
      G.ship.y += ay * SHIP_SPD * dt;
    }
    G.ship.x = clamp(G.ship.x, shipMin(), shipMax());
    G.ship.y = clamp(G.ship.y, BOX_T, BOX_B);
  }

  function updateCapture(dt) {
    if (!G.cap) return;
    const c = G.cap;
    const boss = c.boss;
    c.t += dt;
    c.spin += dt * 8;
    if (!boss.alive) {
      G.cap = null;
      G.ship.y = HOME_Y;
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
      G.ship.y = HOME_Y;
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
    const ty = G.ship.y - 8;
    r.x = lerp(r.x, tx, 1 - Math.exp(-dt * 6));
    r.y = lerp(r.y, ty, 1 - Math.exp(-dt * 6));
    if (r.t > 0.72 || hypot(r.x - tx, r.y - ty) < 10) completeRescue();
  }

  function updateFormation(dt) {
    G.formOx += G.formDir * 26 * dt;
    if (G.formOx > 28) G.formDir = -1;
    if (G.formOx < -28) G.formDir = 1;
    G.formOy = Math.sin(G.t * 1.35) * 5;
    if (G.challenge || isKingWave()) return;
    if (!G.formed) {
      if (G.enemies.length && formedCount() + divingCount() >= aliveCount() && G.ready <= 0) {
        let waiting = false;
        for (let i = 0; i < G.enemies.length; i++) {
          const e = G.enemies[i];
          if (e.alive && (e.state === 'wait' || e.state === 'enter')) waiting = true;
        }
        if (!waiting) G.formed = true;
      }
    }
    G.diveCd -= dt;
    if (G.formed && G.diveCd <= 0) {
      tryDive();
      G.diveCd = (isCore() ? 0.42 : 0.88) / haste();
    }
  }

  function updateKing(e, dt) {
    if (e.state === 'wait') {
      e.delay -= dt;
      if (e.delay <= 0) e.state = 'enter';
      return;
    }
    if (e.state === 'enter') {
      if (followWaypoints(e, dt, 180)) {
        e.state = 'fight';
        e.nextShot = 0.8;
        e.ang = 0;
      }
      return;
    }
    if (e.state === 'beam') {
      e.beamT += dt;
      e.beamLife -= dt;
      e.x = lerp(e.x, 240, 1 - Math.exp(-dt * 3));
      e.y = lerp(e.y, 160, 1 - Math.exp(-dt * 3));
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !G.cap) {
        if (inBeam(G.ship.x, G.ship.y, e)) {
          G.beamCharge += dt;
          if (G.beamCharge >= 0.5) beginCapture(e);
        } else G.beamCharge = Math.max(0, G.beamCharge - dt * 1.6);
      }
      if (e.beamLife <= 0 && !G.cap) {
        e.state = 'fight';
        e.nextShot = 0.4;
      }
      return;
    }
    e.ang += dt * 0.7;
    e.x = 240 + Math.sin(e.ang) * (88 + (isCore() ? 18 : 0));
    e.y = 128 + Math.sin(e.ang * 1.4) * 16;
    const ratio = e.hp / e.maxHp;
    if (ratio < 0.55 && G.kingPhase < 1) G.kingPhase = 1;
    if (ratio < 0.32 && G.kingPhase < 2) G.kingPhase = 2;
    if (!G.kingBeamed && ratio < 0.5 && G.mode === 'play' && !hasCapturer() && !G.cap) {
      G.kingBeamed = true;
      beginTractor(e);
      return;
    }
    e.nextShot -= dt;
    if (e.nextShot <= 0 && G.mode === 'play') {
      if (G.kingPhase >= 2 && Math.random() < 0.38) {
        kingRing(e);
        kingSpread(e);
        e.nextShot = isCore() ? 0.72 : 0.92;
      } else if (Math.random() < 0.32) {
        kingRing(e);
        e.nextShot = isCore() ? 1.05 : 1.35;
      } else {
        kingSpread(e);
        e.nextShot = isCore() ? 0.55 : 0.78;
      }
    }
    G.escortCd -= dt;
    if (G.escortCd <= 0) {
      spawnEscort();
      const pool = [];
      for (let i = 0; i < G.enemies.length; i++) {
        const a = G.enemies[i];
        if (a.alive && !a.isKing && a.state === 'form') pool.push(a);
      }
      if (pool.length && divingCount() < (isCore() ? 4 : 3)) {
        startDive(pool[(Math.random() * pool.length) | 0], false);
      }
      G.escortCd = isCore() ? 1.6 : 2.2;
    }
  }

  function updateEnemies(dt) {
    const h = haste();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.isKing) {
        updateKing(e, dt);
        continue;
      }
      if (e.state === 'wait') {
        e.delay -= dt;
        if (e.delay <= 0) e.state = 'enter';
        continue;
      }
      if (e.state === 'enter') {
        const done = followWaypoints(e, dt, enterSpeed());
        if (done) {
          if (e.challenge) {
            e.alive = false;
            e.gone = true;
            G.chalDone += 1;
          } else if (isKingWave() && e.escort) {
            e.state = 'form';
            startDive(e, false);
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
        if (isKingWave()) {
          e.orbit += dt * 1.6;
          const k = kingOf();
          const cx = k ? k.x : 240;
          const cy = k ? k.y + 70 : 210;
          e.x = cx + Math.cos(e.orbit) * 78;
          e.y = cy + Math.sin(e.orbit) * 22;
          e.nextShot -= dt;
          if (e.nextShot <= 0 && G.mode === 'play') {
            enemyBomb(e, false);
            e.nextShot = rand(1.1, 1.8);
          }
        } else {
          const p = slotPos(e);
          e.x = p.x;
          e.y = p.y;
        }
        continue;
      }
      if (e.state === 'dive') {
        const done = followWaypoints(e, dt, diveSpeed());
        e.nextShot -= dt;
        if (e.nextShot <= 0 && e.shotLeft > 0 && G.mode === 'play') {
          enemyBomb(e, e.type === 3 || e.type === 2);
          e.shotLeft -= 1;
          e.nextShot = e.type === 3 ? 0.32 : 0.48;
        }
        if (done) {
          if (e.willBeam && G.mode === 'play' && !hasCapturer()) {
            beginTractor(e);
          } else {
            e.state = 'return';
            e.wps = [{ x: e.x, y: -24 }, e.challenge ? { x: e.x, y: -40 } : slotPos(e)];
            e.wpI = 0;
            e.y = -20;
          }
        }
        continue;
      }
      if (e.state === 'beam') {
        e.beamT += dt;
        e.beamLife -= dt;
        if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !G.cap) {
          if (inBeam(G.ship.x, G.ship.y, e)) {
            G.beamCharge += dt;
            if (G.beamCharge >= 0.52) beginCapture(e);
          } else G.beamCharge = Math.max(0, G.beamCharge - dt * 1.6);
        }
        if (e.beamLife <= 0 && !G.cap) {
          e.state = 'return';
          e.wps = [slotPos(e)];
          e.wpI = 0;
        }
        continue;
      }
      if (e.state === 'return') {
        const tgt = e.wps && e.wps[0] ? e.wps[0] : slotPos(e);
        if (!e.wps || e.wpI === 0 && e.y < 0) {
          e.x = tgt.x;
        }
        const done = followWaypoints(e, dt, 260 * h);
        if (done) {
          if (isKingWave()) {
            e.state = 'form';
          } else {
            e.state = 'form';
            const p = slotPos(e);
            e.x = p.x;
            e.y = p.y;
            e.escort = false;
          }
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.y += s.vy * dt;
      if (s.y < -12) {
        G.shots.splice(i, 1);
        if (G.mode === 'play') {
          audio.miss();
          breakCombo();
        }
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const kind = shotHitsEnemy(s, e);
        if (!kind) continue;
        G.shots.splice(i, 1);
        damageEnemy(e, s.x, s.y);
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
      if (b.y > VH + 16 || b.x < -20 || b.x > VW + 20 || b.y < -30) {
        G.bombs.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !G.cap) {
        if (shipHits(b.x, b.y, 3.4, 3.4)) {
          G.bombs.splice(i, 1);
          killPlayer('shot');
        }
      }
    }
  }

  function collideBodies() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.cap) return;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.state !== 'dive' && e.state !== 'beam' && !e.isKing) continue;
      const b = hitBox(e);
      if (shipHits(e.x, e.y, b.hw * 0.72, b.hh * 0.72)) {
        killPlayer('crash');
        return;
      }
      if (e.captured && shipHits(e.x, e.y + 22, 10, 8)) {
        killPlayer('crash');
        return;
      }
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.dualGlow = Math.max(0, G.dualGlow - dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.flapT += dt;
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.16) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.v * dt;
      if (s.y > VH) {
        s.y = -4;
        s.x = Math.random() * VW;
      }
    }
  }

  function onWaveClear() {
    if (G.mode !== 'play') return;
    if (G.challenge) {
      if (G.chalHits >= G.chalTotal) {
        const n = 1000 * G.chalIdx;
        addScore(n);
        toast('挑战全中 +' + n, false, true);
      } else {
        toast('挑战 ' + G.chalHits + '/' + G.chalTotal, false, false);
      }
    } else {
      addScore(250 * G.wave);
      toast(STAGE_NAME[G.wave] + ' 肃清', false, true);
    }
    audio.wave();
    G.wave += 1;
    if (G.wave > MAX_STAGE) {
      G.pendingWin = true;
      G.clearT = 1.2;
      return;
    }
    spawnWave();
    G.ready = 1.15;
    G.invuln = Math.max(G.invuln, 0.4);
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    addScore(isCore() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.55);
    kick(3);
    const title = isCore() ? '加核尽破' : '加加肃清';
    const lead = '五关打穿  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('win', title, lead);
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
    const lead = (why === 'capture' ? '舰被俘走' : '舰毁了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
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
    toast(isCore() ? '加核 · 编队更密更快' : '加加 · 五关见王', false, isCore());
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
    showOverlay('title', '加加', '编队入场再俯冲。加王牵引可俘走你的舰，打掉俘获者合体双机。五关见王。', '');
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
    if (G.challenge) {
      if (G.chalDone >= G.chalTotal) {
        G.clearT = 1.05;
      }
      return;
    }
    if (aliveCount() === 0) {
      G.clearT = 1.15;
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
      updateEnemies(dt * 0.4);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      updateEnemies(dt);
      updateBombs(dt);
      updateRescue(dt);
      updateFormation(dt);
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
        G.beamCharge = 0;
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
    ctx.fillStyle = '#0c0804';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#120c06';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, 'rgba(255, 176, 32, 0.07)');
    g.addColorStop(0.45, 'rgba(46, 224, 168, 0.03)');
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
    ctx.strokeStyle = 'rgba(255, 176, 32, 0.12)';
    ctx.lineWidth = Math.max(1, scale);
    ctx.setLineDash([4 * scale, 6 * scale]);
    ctx.strokeRect(sx(BOX_L), sy(BOX_T), (BOX_R - BOX_L) * scale, (BOX_B - BOX_T) * scale);
    ctx.setLineDash([]);
  }

  function drawTractor(e) {
    if (e.state !== 'beam') return;
    const top = e.y + 10;
    const bot = BOX_B;
    const h = bot - top;
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 14);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx(e.x - 6), sy(top));
    ctx.lineTo(sx(e.x + 6), sy(top));
    ctx.lineTo(sx(e.x + 46), sy(bot));
    ctx.lineTo(sx(e.x - 46), sy(bot));
    ctx.closePath();
    ctx.fillStyle = rgba(TEAL, 0.1 + 0.08 * pulse);
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, 0.45 * pulse);
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();
    const scan = top + ((G.t * 220) % h);
    ctx.fillStyle = rgba(WHT, 0.12);
    ctx.fillRect(sx(e.x - 40), sy(scan), 80 * scale, 3 * scale);
    ctx.restore();
  }

  function drawEnemies() {
    const flap = ((G.flapT * 8) | 0) % 2;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.state === 'wait') continue;
      drawTractor(e);
      const rgb = enemyRgb(e);
      if (e.isKing) {
        const rows = SPR_KING[flap];
        drawSprite(e.x, e.y, rows, rgb, 2.2, 1);
        ctx.strokeStyle = rgba(GOLD, 0.35);
        ctx.lineWidth = scale;
        ctx.beginPath();
        ctx.arc(sx(e.x), sy(e.y), 30 * scale, 0, TAU);
        ctx.stroke();
      } else {
        const spr = SPR[e.type] || SPR[0];
        const rows = spr[flap] || spr[0];
        drawSprite(e.x, e.y, rows, rgb, 1.7, 1);
      }
      if (e.captured) {
        drawSprite(e.x, e.y + 22, SPR_SHIP_CAP, CYN, 1.5, 0.95);
      }
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!REDUCE) {
        ctx.fillStyle = rgba(CYN, 0.28);
        ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 16 * scale);
      }
      ctx.fillStyle = rgba(WHT, 1);
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 6), 2.8 * scale, 10 * scale);
      ctx.fillStyle = rgba(CYN, 1);
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
    const alpha = G.cap ? 0.7 : 1;
    if (G.dual) {
      drawSprite(G.ship.x - 14, G.ship.y, SPR_SHIP, CYN, 1.7, alpha);
      drawSprite(G.ship.x + 14, G.ship.y, SPR_SHIP, GOLD, 1.7, alpha);
      if (G.dualGlow > 0) {
        ctx.strokeStyle = rgba(GOLD, G.dualGlow);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(sx(G.ship.x), sy(G.ship.y), 28 * scale, 0, TAU);
        ctx.stroke();
      }
    } else {
      drawSprite(G.ship.x, G.ship.y, G.cap ? SPR_SHIP_CAP : SPR_SHIP, CYN, 1.7, alpha);
    }
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      const mx = G.dual ? G.ship.x : G.ship.x;
      ctx.fillRect(sx(mx - 3), sy(G.ship.y - 20), 6 * scale, 8 * scale);
    }
    if (G.cap) {
      ctx.save();
      ctx.translate(sx(G.ship.x), sy(G.ship.y));
      ctx.rotate(G.cap.spin);
      ctx.strokeStyle = rgba(MAG, 0.7);
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect(-10 * scale, -10 * scale, 20 * scale, 20 * scale);
      ctx.restore();
    }
  }

  function drawRescue() {
    if (!G.rescue) return;
    drawSprite(G.rescue.x, G.rescue.y, SPR_SHIP, GOLD, 1.6, 1);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = scale;
    ctx.beginPath();
    ctx.arc(sx(G.rescue.x), sy(G.rescue.y), 14 * scale, 0, TAU);
    ctx.stroke();
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
    ctx.fillStyle = 'rgba(12, 8, 4, 0.55)';
    ctx.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    ctx.fillStyle = rgba(t < 0.32 ? MAG : t < 0.55 ? HOT : TEAL, 0.9);
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
    ctx.fillStyle = '#1a1206';
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
    drawRescue();
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
      pointer.x = clamp(pointerWorldX(e), shipMin(), shipMax());
      pointer.y = clamp(pointerWorldY(e), BOX_T, BOX_B);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), shipMin(), shipMax());
      pointer.y = clamp(pointerWorldY(e), BOX_T, BOX_B);
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
      keys.l = keys.r = keys.u = keys.d = false;
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
