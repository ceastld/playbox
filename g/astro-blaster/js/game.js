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
  const CAMP_WAVES = 8;
  const FUEL_MAX = 100;
  const BEST_KEY = 'playbox-astro-blaster-best';
  const MUTE_KEY = 'playbox-astro-blaster-mute';
  const AUTO_SPEED_KEY = 'playbox-astro-blaster-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_MAX_V = [0, 180, 250, 340, 620];
  const AUTO_ALIGN = [0, 8, 11, 15, 20];
  const AUTO_TIME = [0, 0.62, 0.85, 1, 2.5];
  const OPS = '← → 移动 · 空格开火 · S 跃迁 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 41];
  const HOT2 = [255, 177, 74];
  const WHT = [255, 244, 234];
  const PNK = [255, 140, 200];

  const WAVE_NAME = ['横列', '折翼', '俯冲', '火球', '旋翼', '飞碟', '分裂', '母舰'];
  const WAVE_KIND = ['line', 'vee', 'dive', 'rock', 'spin', 'saucer', 'split', 'dock'];

  const SPR_SHIP = [
    '     ##     ',
    '    ####    ',
    '   ######   ',
    ' ## #### ## ',
    '############',
    '  ##  ##  ##'
  ];
  const SPR_SCOUT = [
    [
      '  #    #  ',
      '   #  #   ',
      '  ######  ',
      ' ######## ',
      '## #### ##',
      ' ######## ',
      '  # ## #  '
    ],
    [
      ' #      # ',
      '  #    #  ',
      '  ######  ',
      ' ######## ',
      '## #### ##',
      ' ######## ',
      '   #  #   '
    ]
  ];
  const SPR_FLY = [
    [
      '##      ##',
      '###    ###',
      '##########',
      '  ######  ',
      ' ## ## ## ',
      '##  ##  ##'
    ],
    [
      '  #    #  ',
      '##      ##',
      '##########',
      '  ######  ',
      ' ## ## ## ',
      '### ## ###'
    ]
  ];
  const SPR_SAUCER = [
    [
      '   ######   ',
      ' ########## ',
      '############',
      '  ########  ',
      '    ####    '
    ],
    [
      '    ####    ',
      ' ########## ',
      '############',
      '  ########  ',
      '   ######   '
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
  const btnWarp = document.getElementById('btn-warp');
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
  const fuelBar = document.getElementById('fuel-bar');
  const heatBar = document.getElementById('heat-bar');
  const fuelMeter = document.getElementById('fuel-meter');
  const heatMeter = document.getElementById('heat-meter');
  const warpPip = document.getElementById('warp-pip');

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
  const pointer = { down: false, hover: false, x: VW * 0.5, id: null };
  let autoOn = false;
  let autoSpeed = 3;
  let autoTarget = VW * 0.5;
  let autoFire = false;
  let autoOvWait = 0;
  let autoStickX = VW * 0.5;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'chain',
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
    ship: { x: VW * 0.5, y: PLAYER_Y, vx: 0 },
    fuel: FUEL_MAX,
    heat: 0,
    overheat: false,
    warp: 1,
    warpT: 0,
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
    why: '',
    frame: 0,
    flapT: 0,
    muzzle: 0,
    waveKind: 'line',
    rockT: 0,
    rockSpawn: 0,
    bombCd: 0,
    saucerCd: 8,
    mother: null,
    fuelWarn: 0,
    heatSaid: false,
    missWave: 0,
    killWave: 0,
    rise: 0
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
  function isChain() {
    return G.kind !== 'dry';
  }
  function isDry() {
    return G.kind === 'dry';
  }
  function shipMin() {
    return 18;
  }
  function shipMax() {
    return VW - 18;
  }
  function waveScale() {
    const w = G.wave;
    const dry = isDry() ? 1.12 : 1;
    return (1 + (w - 1) * 0.07) * dry;
  }
  function fuelDrain() {
    return (isDry() ? 4.05 : 2.35) * (G.warpT > 0 ? 1.08 : 1);
  }
  function critFuel() {
    return G.fuel < 12;
  }
  function scoreMul() {
    return G.mult * (critFuel() ? 2 : 1);
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
      this.beep(880, 0.055, 'square', 0.03, 1680);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.035, 0.034, 1200);
      this.beep(560 * lift, 0.06, 'square', 0.042, 840 * lift);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.044, 70);
    },
    fuel() {
      this.ensure();
      this.beep(740, 0.07, 'sine', 0.046, 1180);
      this.beep(1180, 0.1, 'triangle', 0.032, 1760);
    },
    warp() {
      this.ensure();
      this.noise(0.16, 0.04, 300);
      this.beep(220, 0.22, 'sawtooth', 0.04, 90);
      this.beep(880, 0.18, 'sine', 0.04, 220);
    },
    overheat() {
      this.ensure();
      this.beep(320, 0.16, 'sawtooth', 0.04, 90);
      this.beep(180, 0.22, 'square', 0.03, 70);
    },
    cool() {
      this.ensure();
      this.beep(520, 0.08, 'sine', 0.03, 780);
    },
    warn() {
      this.ensure();
      this.beep(240, 0.12, 'square', 0.04, 160);
      this.beep(180, 0.16, 'sawtooth', 0.03, 90);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.045, 48);
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
    dock() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 784);
      this.beep(784, 0.14, 'triangle', 0.04, 1046);
      this.beep(1175, 0.24, 'sine', 0.05, 1568);
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
      this.beep(160, 0.05, 'sine', 0.016, 80);
    },
    saucer() {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.03, 440);
      this.beep(880, 0.12, 'triangle', 0.028, 520);
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
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
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

  function syncGauges() {
    const f = clamp(G.fuel / FUEL_MAX, 0, 1);
    const h = clamp(G.heat / 100, 0, 1);
    if (fuelBar) fuelBar.style.transform = 'scaleX(' + f + ')';
    if (heatBar) heatBar.style.transform = 'scaleX(' + h + ')';
    if (fuelMeter) {
      fuelMeter.classList.toggle('low', G.fuel < 28);
      fuelMeter.classList.toggle('crit', G.fuel < 12);
    }
    if (heatMeter) heatMeter.classList.toggle('hot', G.overheat);
    if (warpPip) {
      warpPip.classList.toggle('on', G.warp > 0 && G.warpT <= 0);
      warpPip.classList.toggle('live', G.warpT > 0);
    }
    if (btnWarp) {
      btnWarp.classList.toggle('off', G.warp <= 0 && G.warpT <= 0);
      btnWarp.setAttribute('aria-label', G.warpT > 0 ? '跃迁中' : (G.warp > 0 ? '跃迁' : '跃迁已用'));
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星炮';
      else if (G.waveKind === 'rock') stageLabel.textContent = '火球 ' + Math.max(0, G.rockT).toFixed(1) + 's';
      else if (G.waveKind === 'dock' && G.mother && G.mother.phase === 'bay') stageLabel.textContent = '对接';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.wave >= 6 || G.warpT > 0 || critFuel()));
    }
    if (tagLabel) {
      let tag = isChain() ? '连射' : '空仓';
      if (G.mode === 'play') {
        if (G.overheat) tag = '过热';
        else if (G.warpT > 0) tag = '跃迁 ' + G.warpT.toFixed(1);
        else if (critFuel()) tag = '危急 ×2';
        else if (G.fuel < 28) tag = '告急';
        else tag = WAVE_NAME[G.wave - 1] || tag;
      }
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.overheat || G.fuel < 28);
      tagLabel.classList.toggle('hot', G.warpT > 0 || G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint(autoOn ? '托管中 · R 重开接着打' : 'R 重开 · 燃料空或相撞扣命', autoOn ? 'hot' : 'warn');
    else if (G.mode === 'win') setHint(autoOn ? '托管中 · A 停下' : '航线打通 · R 再来 · 空格开火', 'hot');
    else if (G.overheat) setHint('炮管过热 · 停手冷却才能再射', 'warn');
    else if (critFuel()) setHint('燃料危急 · 击杀翻倍 · 快捡燃料', 'warn');
    else if (G.waveKind === 'dock') setHint('清护卫后对准母舰舱口对接', 'hot');
    else if (G.waveKind === 'rock') setHint('打火球补燃料 · 别撞上', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 燃料和碰撞都会扣', 'warn');
    else setHint('← → 移动 · 空格开火 · 打敌机捡燃料 · S 跃迁 · A 自动', '');
    syncPips();
    syncGauges();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    autoOvWait = 0;
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GUN';
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
    if (autoOn && autoSpeed >= 4) return;
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
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.7 : 1.3,
        a: rand(0.25, 0.9),
        p: rand(0, TAU),
        v: rand(10, 46),
        rgb: Math.random() < 0.16 ? HOT : Math.random() < 0.12 ? CYN : WHT
      });
    }
  }

  function enemyRgb(e) {
    if (e.hitFlash > 0) return WHT;
    if (e.type === 0) return HOT2;
    if (e.type === 1) return MAG;
    if (e.type === 2) return CYN;
    if (e.type === 3) return PNK;
    if (e.type === 4) return GOLD;
    if (e.type === 5) return HOT;
    return HOT;
  }

  function enemyScore(e) {
    if (e.type === 5) return 40;
    if (e.type === 4) return e.big ? 400 : 220;
    if (e.type === 3) return e.gen === 0 ? 120 : e.gen === 1 ? 70 : 40;
    if (e.type === 2) return 160;
    if (e.type === 1) return e.state === 'dive' ? 160 : 80;
    return e.state === 'dive' ? 100 : 50;
  }

  function hitBox(e) {
    if (e.type === 5) return { hw: 8, hh: 8 };
    if (e.type === 4) return { hw: e.big ? 18 : 14, hh: e.big ? 10 : 8 };
    if (e.type === 3) {
      const s = e.gen === 0 ? 14 : e.gen === 1 ? 10 : 7;
      return { hw: s, hh: s };
    }
    if (e.type === 2) return { hw: 12, hh: 12 };
    return { hw: 11, hh: 9 };
  }

  function pushEnemy(opts) {
    const e = {
      type: 0,
      col: 0,
      row: 0,
      hp: 1,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      ang: 0,
      state: 'enter',
      delay: 0,
      wps: [],
      wpI: 0,
      alive: true,
      shotLeft: 0,
      nextShot: 0,
      hitFlash: 0,
      gen: 0,
      spin: 0,
      orbit: 0,
      orbitR: 80,
      cx: 240,
      cy: 180,
      phase: 0,
      big: false,
      baseY: 120
    };
    for (const k in opts) e[k] = opts[k];
    G.enemies.push(e);
    return e;
  }

  function slotLine(col, row) {
    return {
      x: 52 + col * 48 + G.formOx,
      y: 92 + row * 38 + G.formOy
    };
  }

  function slotVee(i, n) {
    const mid = (n - 1) * 0.5;
    return {
      x: 240 + (i - mid) * 34 + G.formOx,
      y: 96 + Math.abs(i - mid) * 20 + G.formOy
    };
  }

  function slotDive(col, row) {
    return {
      x: 78 + col * 54 + G.formOx,
      y: 88 + row * 36 + G.formOy
    };
  }

  function slotOf(e) {
    if (e.formX != null) return { x: e.formX + G.formOx, y: e.formY + G.formOy };
    if (G.waveKind === 'vee') return slotVee(e.col, 13);
    if (G.waveKind === 'dive') return slotDive(e.col, e.row);
    return slotLine(e.col, e.row);
  }

  function enterPath(side, end, loop) {
    const startX = side > 0 ? 510 : -30;
    const amp = loop ? 100 : 60;
    return [
      { x: startX, y: 28 + Math.abs(end.y) * 0.08 },
      { x: 240 + side * 120, y: 140 },
      { x: 240 - side * amp * 0.4, y: 260 },
      { x: 240 + side * amp * 0.55, y: 180 },
      end
    ];
  }

  function spawnSaucer(big) {
    const fromLeft = Math.random() < 0.5;
    const y = rand(56, 110);
    pushEnemy({
      type: 4,
      big: !!big,
      hp: big ? 2 : 1,
      x: fromLeft ? -30 : VW + 30,
      y: y,
      vx: (fromLeft ? 1 : -1) * (big ? 86 : 120),
      state: 'weave',
      baseY: y,
      phase: rand(0, TAU),
      nextShot: rand(0.6, 1.3)
    });
    if (G.mode === 'play') {
      audio.saucer();
      toast(big ? '大型飞碟' : '飞碟掠过', false, true);
    }
  }

  function spawnFireball() {
    const x = rand(28, VW - 28);
    pushEnemy({
      type: 5,
      x: x,
      y: -16,
      vx: rand(-30, 30),
      vy: rand(110, 170) * waveScale(),
      state: 'fall',
      phase: rand(0, TAU),
      hp: 1
    });
  }

  function spawnLine() {
    const cols = 8;
    const rows = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const end = { x: 52 + c * 48, y: 92 + r * 38 };
        const side = c < 4 ? -1 : 1;
        pushEnemy({
          type: r === 0 ? 1 : 0,
          col: c,
          row: r,
          x: side > 0 ? 510 : -30,
          y: 20,
          delay: (r * 8 + c) * 0.07,
          state: 'wait',
          wps: enterPath(side, end, false),
          hp: 1
        });
      }
    }
  }

  function spawnVee() {
    const n = 13;
    for (let i = 0; i < n; i++) {
      const p = slotVee(i, n);
      const side = i % 2 === 0 ? -1 : 1;
      pushEnemy({
        type: i === 6 ? 2 : (Math.abs(i - 6) < 3 ? 1 : 0),
        hp: i === 6 ? 2 : 1,
        col: i,
        row: 0,
        x: side > 0 ? 510 : -30,
        y: 16,
        delay: i * 0.09,
        state: 'wait',
        wps: enterPath(side, { x: p.x, y: p.y }, true)
      });
    }
  }

  function spawnDive() {
    const cols = 6;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const end = { x: 78 + c * 54, y: 88 + r * 36 };
        const side = (r + c) % 2 === 0 ? -1 : 1;
        pushEnemy({
          type: r === 0 ? 1 : 0,
          col: c,
          row: r,
          x: side > 0 ? 520 : -40,
          y: 10,
          delay: (r * cols + c) * 0.065,
          state: 'wait',
          wps: enterPath(side, end, true),
          hp: 1
        });
      }
    }
  }

  function spawnSpin() {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      pushEnemy({
        type: 2,
        hp: 2,
        x: 240 + Math.cos(a) * 110,
        y: 180 + Math.sin(a) * 58,
        delay: i * 0.08,
        state: 'wait',
        wps: [
          { x: 240 + Math.cos(a) * 160, y: -20 },
          { x: 240 + Math.cos(a) * 110, y: 180 + Math.sin(a) * 58 }
        ],
        orbit: a,
        orbitR: 110,
        cx: 240,
        cy: 180,
        nextShot: rand(0.4, 1.2)
      });
    }
  }

  function spawnSaucerWave() {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const fromLeft = i % 2 === 0;
      const y = 70 + (i % 4) * 36;
      pushEnemy({
        type: 4,
        x: fromLeft ? -40 - i * 18 : VW + 40 + i * 18,
        y: y,
        vx: (fromLeft ? 1 : -1) * (96 + i * 4),
        state: 'wait',
        delay: i * 0.22,
        baseY: y,
        phase: i * 0.7,
        nextShot: rand(0.5, 1.1)
      });
    }
    pushEnemy({
      type: 4,
      big: true,
      hp: 2,
      x: -50,
      y: 54,
      vx: 70,
      state: 'wait',
      delay: 1.6,
      baseY: 54,
      phase: 0.2,
      nextShot: 0.8
    });
  }

  function spawnSplit() {
    for (let i = 0; i < 6; i++) {
      const x = 70 + i * 68;
      pushEnemy({
        type: 3,
        gen: 0,
        hp: 1,
        x: x,
        y: -30,
        delay: i * 0.18,
        state: 'wait',
        wps: [
          { x: x, y: -30 },
          { x: x + ((i & 1) ? 40 : -40), y: 140 },
          { x: x, y: 170 }
        ],
        vx: (i & 1) ? 40 : -40,
        vy: 16,
        phase: i
      });
    }
  }

  function spawnDock() {
    G.mother = {
      x: 240,
      y: -70,
      vx: 46,
      phase: 'enter',
      bay: false,
      dockT: 0,
      t: 0,
      w: 150,
      h: 40
    };
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      const col = i % 4;
      const fx = 70 + col * 110;
      const fy = 220 + (i < 4 ? 0 : 46);
      pushEnemy({
        type: 1,
        col: col,
        row: i < 4 ? 0 : 1,
        formX: fx,
        formY: fy,
        x: side > 0 ? 520 : -40,
        y: 20,
        delay: i * 0.12,
        state: 'wait',
        wps: enterPath(side, { x: fx, y: fy }, true),
        hp: 1
      });
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
    G.bombCd = 1.2;
    G.rockT = 0;
    G.rockSpawn = 0.2;
    G.mother = null;
    G.rise = 0;
    G.missWave = 0;
    G.killWave = 0;
    G.waveKind = WAVE_KIND[(G.wave - 1) % WAVE_KIND.length];
    if (G.mode === 'title') G.waveKind = 'line';
    const k = G.waveKind;
    if (k === 'line') spawnLine();
    else if (k === 'vee') spawnVee();
    else if (k === 'dive') spawnDive();
    else if (k === 'rock') {
      G.rockT = isDry() ? 12.2 : 13.6;
    } else if (k === 'spin') spawnSpin();
    else if (k === 'saucer') spawnSaucerWave();
    else if (k === 'split') spawnSplit();
    else spawnDock();
    G.saucerCd = k === 'rock' || k === 'saucer' || k === 'dock' ? 99 : rand(7.5, 12);
  }

  function resetField() {
    G.ship.x = VW * 0.5;
    G.ship.y = PLAYER_Y;
    G.ship.vx = 0;
    G.shots = [];
    G.bombs = [];
    G.drops = [];
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
    G.heat = 0;
    G.overheat = false;
    G.warpT = 0;
    G.fuelWarn = 0;
    G.heatSaid = false;
    G.rise = 0;
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
      if (e.alive && (e.state === 'form' || e.state === 'orbit' || e.state === 'float')) n += 1;
    }
    return n;
  }

  function divingCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].state === 'dive') n += 1;
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

  function dropFuel(x, y, amt, warpDrop) {
    G.drops.push({
      x: x,
      y: y,
      vy: 86,
      amt: amt,
      warp: !!warpDrop,
      life: 6
    });
    capArr(G.drops, 28);
  }

  function maybeDrop(e) {
    if (G.mode !== 'play') return;
    if (e.type === 5) {
      dropFuel(e.x, e.y, 9, false);
      return;
    }
    if (e.type === 4) {
      dropFuel(e.x, e.y, e.big ? 18 : 14, G.warp <= 0 && Math.random() < 0.35);
      return;
    }
    if (Math.random() < (isDry() ? 0.62 : 0.56)) {
      dropFuel(e.x, e.y, (6 + ((Math.random() * 5) | 0)), false);
    }
  }

  function explodeEnemy(e) {
    e.alive = false;
    const rgb = enemyRgb(e);
    burst(e.x, e.y, rgb, e.type === 4 || e.type === 2 ? 20 : 12, e.type === 5 ? 280 : 240);
    ring(e.x, e.y, rgb);
    spark(e.x, e.y, WHT);
    audio.explode();
    const n = Math.round(enemyScore(e) * scoreMul());
    addScore(n);
    floatText(e.x, e.y - 10, String(n), rgb);
    hitStop(e.type === 4 || e.type === 2 ? 0.06 : 0.038);
    kick(e.type === 4 ? 2.6 : 1.7);
    maybeDrop(e);
    G.killWave += 1;
  }

  function splitAmoeba(e) {
    if (e.gen >= 2) {
      explodeEnemy(e);
      return;
    }
    const rgb = enemyRgb(e);
    const n = Math.round(enemyScore(e) * scoreMul());
    addScore(n);
    floatText(e.x, e.y - 10, String(n), rgb);
    burst(e.x, e.y, rgb, 10, 200);
    spark(e.x, e.y, WHT);
    audio.hit(G.combo);
    hitStop(0.045);
    kick(1.6);
    e.alive = false;
    maybeDrop(e);
    for (let s = -1; s <= 1; s += 2) {
      pushEnemy({
        type: 3,
        gen: e.gen + 1,
        hp: 1,
        x: e.x + s * 10,
        y: e.y,
        vx: s * (55 + e.gen * 24),
        vy: 28 + e.gen * 10,
        state: 'float',
        phase: rand(0, TAU)
      });
    }
  }

  function damageEnemy(e) {
    if (!e.alive) return;
    bumpCombo();
    if (e.hp > 1) {
      e.hp -= 1;
      e.hitFlash = 0.1;
      spark(e.x, e.y, GOLD);
      audio.hit(G.combo);
      const n = Math.round(40 * scoreMul());
      addScore(n);
      floatText(e.x, e.y - 8, String(n), GOLD);
      hitStop(0.04);
      kick(1.3);
      return;
    }
    if (e.type === 3) {
      splitAmoeba(e);
      return;
    }
    explodeEnemy(e);
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.why = why;
    G.fireHold = false;
    G.shots = [];
    G.rise = 0;
    G.ship.y = PLAYER_Y;
    burst(G.ship.x, G.ship.y, CYN, 26, 340);
    ring(G.ship.x, G.ship.y, MAG);
    audio.death();
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    kick(7);
    if (why === 'fuel') toast('燃料耗尽', true, false);
    else if (why === 'ram') toast('相撞', true, false);
    else toast('中弹', true, false);
  }

  function enemyBomb(e, vx, vy) {
    if (G.mode === 'title') return;
    const cap = isDry() ? 9 : 6;
    if (G.bombs.length >= cap) return;
    G.bombs.push({
      x: e.x,
      y: e.y + 10,
      vx: vx == null ? clamp((G.ship.x - e.x) * 0.12, -70, 70) : vx,
      vy: vy == null ? (170 + G.wave * 10) * (isDry() ? 1.12 : 1) : vy
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0.4) return;
    if (G.overheat) return;
    if (G.shots.length >= 3 || G.fireCd > 0) return;
    G.shots.push({ x: G.ship.x, y: G.ship.y - 14, vy: -SHOT_V });
    audio.shoot();
    G.fireCd = 0.1;
    G.muzzle = 0.08;
    G.heat = Math.min(110, G.heat + 8);
    spark(G.ship.x, G.ship.y - 16, CYN);
    if (G.heat >= 100 && !G.overheat) {
      G.overheat = true;
      G.heatSaid = true;
      audio.overheat();
      toast('过热', true, false);
      screenFlash(MAG, 0.28);
    }
  }

  function tryWarp() {
    if (G.mode !== 'play' || G.deadT > 0 || G.warp <= 0 || G.warpT > 0) return;
    G.warp -= 1;
    G.warpT = 6.1;
    audio.warp();
    screenFlash(CYN, 0.5);
    kick(3);
    ring(G.ship.x, G.ship.y, CYN);
    burst(G.ship.x, G.ship.y, CYN, 18, 260);
    toast('跃迁启动', false, true);
    syncGauges();
  }

  function pickupDrop(d) {
    if (d.warp) {
      G.warp = 1;
      audio.extra();
      toast('跃迁充能', false, true);
      floatText(d.x, d.y - 8, '跃', CYN);
      ring(d.x, d.y, CYN);
    } else {
      const got = d.amt;
      G.fuel = Math.min(FUEL_MAX, G.fuel + got);
      if (G.fuel >= 32) G.fuelWarn = 0;
      audio.fuel();
      floatText(d.x, d.y - 8, '+' + got, HOT);
      spark(d.x, d.y, GOLD);
      burst(d.x, d.y, HOT, 8, 140);
    }
  }

  function startDive(e) {
    if (!e.alive || (e.state !== 'form' && e.state !== 'orbit' && e.state !== 'float')) return;
    e.state = 'dive';
    e.wpI = 0;
    e.shotLeft = e.type === 2 ? 3 : 2;
    e.nextShot = rand(0.2, 0.55);
    const side = e.x < VW * 0.5 ? -1 : 1;
    const px = G.ship.x;
    e.wps = [
      { x: e.x + side * 36, y: e.y - 12 },
      { x: lerp(e.x, px, 0.4) + side * 40, y: 300 },
      { x: px + side * 28, y: 460 },
      { x: px - side * 20, y: 600 },
      { x: px + side * 10, y: 780 }
    ];
  }

  function tryDive() {
    if (!G.formed || G.deadT > 0) return;
    if (G.waveKind === 'rock' || G.waveKind === 'saucer') return;
    const maxD = Math.min(5, (isDry() ? 3 : 2) + Math.floor((G.wave - 1) / 3));
    if (divingCount() >= maxD) return;
    const pool = [];
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && (e.state === 'form' || e.state === 'orbit' || e.state === 'float') && e.type !== 5) {
        pool.push(e);
      }
    }
    if (!pool.length) return;
    const a = pool[(Math.random() * pool.length) | 0];
    startDive(a);
    if (pool.length > 2 && Math.random() < 0.45) {
      let b = pool[(Math.random() * pool.length) | 0];
      if (b !== a) startDive(b);
    }
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    pointer.down = false;
    G.fireHold = false;
    autoFire = false;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoClearInput();
    autoTarget = G.ship.x;
    autoStickX = G.ship.x;
    syncAutoUi();
    syncHud();
    if (!autoOn) return;
    audio.ensure();
    if (G.mode === 'title') startGame('chain');
  }

  function autoLeadX(e) {
    const t = Math.max(0, (G.ship.y - 20 - e.y) / SHOT_V);
    if (e.state === 'weave' || e.state === 'fall') return e.x + e.vx * t;
    if (e.state === 'float') return e.x + e.vx * Math.min(0.35, t);
    return e.x;
  }

  function autoDangerAt(x, horizon) {
    let d = 0;
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.vy <= 8) continue;
      const t = (PLAYER_Y - 8 - b.y) / b.vy;
      if (t < -0.02 || t > horizon) continue;
      const gap = Math.abs(b.x + b.vx * t - x);
      if (gap < 14) d += (horizon - t) * 90;
      else if (gap < 26) d += (horizon - t) * 28;
      else if (gap < 40) d += (horizon - t) * 8;
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || (e.state !== 'dive' && e.state !== 'fall')) continue;
      if (e.y < 360) continue;
      const ev = e.state === 'fall' ? Math.max(80, e.vy) : 250 + G.wave * 12;
      const t = (PLAYER_Y - e.y) / ev;
      if (t < -0.05 || t > horizon + 0.12) continue;
      const box = hitBox(e);
      if (Math.abs(e.x - x) < box.hw + 12) {
        d += (e.state === 'fall' ? 78 : 58) * Math.max(0.12, horizon - t);
      }
    }
    return d;
  }

  function autoPickSafe(desired, horizon) {
    const lo = shipMin();
    const hi = shipMax();
    let bestX = clamp(desired, lo, hi);
    let best = 1e9;
    const here = G.ship.x;
    for (let x = lo; x <= hi; x += 10) {
      const dang = autoDangerAt(x, horizon);
      let cost = dang * 7.5 + Math.abs(x - desired) * 0.18;
      if (Math.abs(x - here) < 10) cost -= 8;
      if (x < lo + 22 || x > hi - 22) cost += 6;
      if (cost < best) {
        best = cost;
        bestX = x;
      }
    }
    return bestX;
  }

  function autoThink() {
    autoFire = false;
    autoTarget = G.ship.x;
    if (G.mode !== 'play' || G.deadT > 0) return;

    const align = AUTO_ALIGN[autoSpeed] || 14;
    const fuelNeed = G.fuel < (isDry() ? 52 : 36);
    const fuelCritNow = G.fuel < (isDry() ? 22 : 16);
    const bay = G.mother && G.mother.phase === 'bay' && G.mother.bay;
    let desired = autoStickX;
    let aimX = null;
    let urgent = false;
    let pickDrop = null;
    let dropScore = -1e9;
    let bestE = null;
    let bestS = -1e9;
    let nearBombs = 0;
    let lowThreats = 0;
    let crowd = 0;

    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      if (d.y > VH - 8) continue;
      const dist = hypot(d.x - G.ship.x, d.y - G.ship.y);
      let s = d.amt * 1.4 - dist * 0.22 + d.y * 0.12;
      if (d.warp && G.warp <= 0) s += 90;
      if (fuelNeed) s += 70;
      if (fuelCritNow) s += 140;
      if (d.y > 500) s += 40;
      if (s > dropScore) {
        dropScore = s;
        pickDrop = d;
      }
    }

    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.vy <= 8) continue;
      const t = (PLAYER_Y - 8 - b.y) / b.vy;
      if (t > 0 && t < 0.7 && Math.abs(b.x + b.vx * t - G.ship.x) < 70) {
        crowd += 1;
        if (b.y > 400) nearBombs += 1;
      }
    }

    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state === 'wait') continue;
      if ((e.state === 'dive' || e.state === 'fall') && e.y > 400 && Math.abs(e.x - G.ship.x) < 86) {
        lowThreats += 1;
        crowd += 1;
        if (e.y > 520 && Math.abs(e.x - G.ship.x) < 36) urgent = true;
      }
      if (e.y > PLAYER_Y - 28) continue;
      const lx = autoLeadX(e);
      let s = e.y * 0.42 - Math.abs(lx - G.ship.x) * 0.28;
      if (e.state === 'form' || e.state === 'orbit') s += 28;
      if (e.state === 'dive') s += 95;
      if (e.state === 'fall') s += 110;
      if (e.type === 4) s += e.big ? 90 : 55;
      if (e.type === 2) s += 36;
      if (e.type === 5) s += 80;
      if (e.hp > 1) s += 16;
      if (e.y > 280) s += 22;
      if (e.state === 'form' || e.state === 'orbit' || e.state === 'enter') {
        let stack = 0;
        for (let k = 0; k < G.enemies.length; k++) {
          const o = G.enemies[k];
          if (!o.alive || o === e || o.state === 'wait') continue;
          if (Math.abs(o.x - e.x) < 18) stack += 1;
        }
        s += stack * 20;
      }
      if (s > bestS) {
        bestS = s;
        bestE = e;
        aimX = lx;
      }
    }

    if (bay) {
      desired = G.mother.x;
    } else if (pickDrop && (fuelNeed || fuelCritNow || pickDrop.y > 470 || (pickDrop.warp && G.warp <= 0))) {
      const dropDang = autoDangerAt(pickDrop.x, 0.38);
      if (fuelCritNow || dropDang < 36 || pickDrop.y > 540) desired = pickDrop.x;
      else if (aimX != null) desired = lerp(aimX, pickDrop.x, 0.55);
      else desired = pickDrop.x;
    } else if (aimX != null) {
      if (Math.abs(aimX - autoStickX) < 16) desired = autoStickX;
      else desired = aimX;
    } else {
      desired = VW * 0.5;
    }

    const dodgeH = urgent ? 0.78 : 0.55;
    const hereDang = autoDangerAt(G.ship.x, dodgeH);
    if (hereDang > 18 || urgent) desired = autoPickSafe(desired, dodgeH);
    else desired = autoPickSafe(desired, 0.42);

    if (Math.abs(desired - autoStickX) > 9 || hereDang > 22) autoStickX = desired;
    autoTarget = clamp(autoStickX, shipMin(), shipMax());

    const lined = aimX != null && Math.abs(G.ship.x - aimX) < align + 8;
    let overhead = false;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state === 'wait') continue;
      if (e.y < G.ship.y - 24 && Math.abs(autoLeadX(e) - G.ship.x) < align + 10) {
        overhead = true;
        break;
      }
    }
    const heatOk = !G.overheat && (G.heat < (urgent ? 96 : 80));
    autoFire = heatOk && (lined || overhead || (bestE && (bestE.state === 'fall' || bestE.state === 'dive') && Math.abs(G.ship.x - autoLeadX(bestE)) < align + 12));
    if (bay && Math.abs(G.ship.x - G.mother.x) < 18 && !urgent) autoFire = heatOk && overhead;

    if (G.warp > 0 && G.warpT <= 0 && G.ready <= 0.2 && !bay) {
      const boxed = hereDang > 64 && autoDangerAt(autoTarget, 0.5) > 48;
      const packed = nearBombs + lowThreats >= 3 || crowd >= 4;
      const pinch = nearBombs >= 2 && lowThreats >= 1;
      if (boxed || packed || pinch || (fuelCritNow && hereDang > 40)) tryWarp();
    }
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.22 : 0.48)) {
        autoOvWait = 0;
        startGame('chain');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'chain');
      }
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let ax = 0;
    if (autoOn && G.mode === 'play') {
      const dx = autoTarget - G.ship.x;
      const max = (AUTO_MAX_V[autoSpeed] || 310) * dt;
      if (Math.abs(dx) <= Math.max(0.6, max)) G.ship.x = autoTarget;
      else G.ship.x += (dx < 0 ? -1 : 1) * max;
    } else if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.ship.x;
      if (Math.abs(dx) > 2) ax = dx > 0 ? 1 : -1;
      G.ship.x = lerp(G.ship.x, clamp(pointer.x, shipMin(), shipMax()), 1 - Math.exp(-dt * 14));
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      G.ship.x += ax * 310 * dt;
    }
    G.ship.x = clamp(G.ship.x, shipMin(), shipMax());

    if (G.mode === 'title') {
      G.ship.x = 240 + Math.sin(G.t * 0.8) * 140;
      G.ship.y = PLAYER_Y;
      return;
    }

    if (G.mother && G.mother.phase === 'bay' && G.mother.bay) {
      const aligned = Math.abs(G.ship.x - G.mother.x) < 20;
      if (aligned) {
        G.rise = Math.min(1, G.rise + dt * 0.95);
        G.ship.y = lerp(PLAYER_Y, G.mother.y + 28, G.rise);
        G.mother.dockT += dt;
        if (G.mother.dockT > 1.15) completeDock();
      } else {
        G.rise = Math.max(0, G.rise - dt * 1.6);
        G.ship.y = lerp(PLAYER_Y, G.mother.y + 28, G.rise);
        G.mother.dockT = Math.max(0, G.mother.dockT - dt);
      }
    } else {
      G.rise = Math.max(0, G.rise - dt * 2);
      G.ship.y = lerp(G.ship.y, PLAYER_Y, 1 - Math.exp(-dt * 8));
    }
  }

  function completeDock() {
    if (G.mode !== 'play' || !G.mother || G.mother.phase === 'docked') return;
    G.mother.phase = 'docked';
    G.fuel = FUEL_MAX;
    G.warp = 1;
    G.heat = 0;
    G.overheat = false;
    audio.dock();
    screenFlash(GOLD, 0.55);
    burst(G.ship.x, G.ship.y, GOLD, 28, 320);
    ring(G.mother.x, G.mother.y, CYN);
    toast('对接成功', false, true);
    addScore(Math.round((400 + G.fuel * 4) * G.mult));
    if (G.wave >= CAMP_WAVES) {
      winRun();
    } else {
      G.wave += 1;
      G.ready = 1.1;
      spawnWave();
    }
  }

  function updateMother(dt) {
    const m = G.mother;
    if (!m) return;
    if (m.phase === 'docked') return;
    if (m.phase === 'enter') {
      m.y += 70 * dt;
      if (m.y >= 92) {
        m.y = 92;
        m.phase = 'fight';
      }
      return;
    }
    m.x += m.vx * dt;
    if (m.x > 360) { m.x = 360; m.vx = -Math.abs(m.vx); }
    if (m.x < 120) { m.x = 120; m.vx = Math.abs(m.vx); }
    m.t += dt;
    const escorts = aliveCount();
    if (m.phase === 'fight' && (escorts <= 2 || m.t > 18)) {
      m.phase = 'bay';
      m.bay = true;
      toast('对准舱口对接', false, true);
      audio.saucer();
    }
    if (m.phase === 'bay') {
      m.y = lerp(m.y, 148, 1 - Math.exp(-dt * 0.8));
    }
  }

  function updateEnemies(dt) {
    G.flapT += dt;
    if (G.flapT >= 0.36) {
      G.flapT = 0;
      G.frame += 1;
    }

    if (G.waveKind === 'line' || G.waveKind === 'vee' || G.waveKind === 'dive' || G.waveKind === 'dock') {
      const edge = 30 + Math.min(20, (18 - aliveCount()) * 0.6);
      G.formOx += G.formDir * (22 + G.wave * 2) * dt;
      if (G.formOx > edge) G.formDir = -1;
      if (G.formOx < -edge) G.formDir = 1;
      G.formOy = Math.sin(G.clock * 1.15) * 4;
    }

    if (G.waveKind === 'rock') {
      G.rockT -= dt;
      G.rockSpawn -= dt;
      if (G.rockT > 0.35 && G.rockSpawn <= 0) {
        G.rockSpawn = (isDry() ? 0.3 : 0.4) / Math.max(0.85, waveScale() * 0.9);
        spawnFireball();
      }
    }

    G.saucerCd -= dt;
    if (G.saucerCd <= 0 && G.mode === 'play' && G.waveKind !== 'rock' && G.waveKind !== 'saucer' && G.waveKind !== 'dock') {
      spawnSaucer(false);
      G.saucerCd = rand(9, 14);
    }

    let waiting = 0;
    let entering = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.spin += dt * (e.type === 2 ? 3.2 : 1.4);

      if (e.state === 'wait') {
        e.delay -= dt;
        if (e.delay <= 0) {
          if (e.type === 4 && e.wps.length === 0) e.state = 'weave';
          else if (e.type === 2 && G.waveKind === 'spin') e.state = 'orbit';
          else e.state = 'enter';
          e.wpI = 0;
        } else {
          waiting += 1;
          continue;
        }
      }

      if (e.state === 'enter') {
        entering += 1;
        const spd = 220 + G.wave * 8;
        if (followWaypoints(e, dt, spd)) {
          if (e.type === 2 && G.waveKind === 'spin') e.state = 'orbit';
          else if (e.type === 3) e.state = 'float';
          else if (e.type === 4) e.state = 'weave';
          else e.state = 'form';
        }
        continue;
      }

      if (e.state === 'form') {
        const p = slotOf(e);
        e.x = p.x;
        e.y = p.y;
        continue;
      }

      if (e.state === 'orbit') {
        e.orbit += dt * (0.7 + G.wave * 0.04);
        e.orbitR = 100 + Math.sin(G.clock * 0.8) * 12;
        e.x = e.cx + Math.cos(e.orbit) * e.orbitR;
        e.y = e.cy + Math.sin(e.orbit) * e.orbitR * 0.52;
        e.nextShot -= dt;
        if (e.nextShot <= 0 && G.mode === 'play') {
          const ang = e.spin;
          enemyBomb(e, Math.cos(ang) * 40, 150 + Math.sin(ang) * 30);
          e.nextShot = rand(1.05, 1.7);
        }
        continue;
      }

      if (e.state === 'weave') {
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(G.clock * 2.4 + e.phase) * (e.big ? 18 : 28);
        e.nextShot -= dt;
        if (e.nextShot <= 0 && G.mode === 'play' && e.x > 20 && e.x < VW - 20) {
          enemyBomb(e, 0, 190);
          e.nextShot = rand(0.8, 1.4);
        }
        if (e.x < -40 || e.x > VW + 40) {
          if (G.waveKind === 'saucer') {
            e.vx *= -1;
            e.x = clamp(e.x, -38, VW + 38);
          } else {
            e.alive = false;
          }
        }
        continue;
      }

      if (e.state === 'float') {
        e.x += e.vx * dt;
        e.y += e.vy * dt + Math.sin(G.clock * 2 + e.phase) * 18 * dt;
        if (e.x < 18) { e.x = 18; e.vx = Math.abs(e.vx); }
        if (e.x > VW - 18) { e.x = VW - 18; e.vx = -Math.abs(e.vx); }
        if (e.y < 50) e.vy = Math.abs(e.vy) + 10;
        if (e.y > 420) e.vy = -Math.abs(e.vy);
        e.nextShot -= dt;
        if (e.nextShot <= 0 && G.mode === 'play' && e.gen === 0) {
          enemyBomb(e);
          e.nextShot = rand(1.4, 2.2);
        }
        continue;
      }

      if (e.state === 'fall') {
        e.phase += dt * 6;
        e.x += e.vx * dt + Math.sin(e.phase) * 18 * dt;
        e.y += e.vy * dt;
        if (e.y > VH + 20 || e.x < -30 || e.x > VW + 30) e.alive = false;
        continue;
      }

      if (e.state === 'dive') {
        if (e.wpI >= 2 && e.y < PLAYER_Y - 40) {
          e.x += (G.ship.x - e.x) * dt * 0.38;
        }
        const done = followWaypoints(e, dt, (250 + G.wave * 12) * (isDry() ? 1.1 : 1));
        if (e.shotLeft > 0) {
          e.nextShot -= dt;
          if (e.nextShot <= 0 && e.y > 120 && e.y < 560) {
            enemyBomb(e);
            e.shotLeft -= 1;
            e.nextShot = rand(0.32, 0.65);
          }
        }
        if (done || e.y > VH + 24) {
          if (G.waveKind === 'dive' || G.waveKind === 'line' || G.waveKind === 'vee' || G.waveKind === 'dock') {
            e.y = -24;
            e.state = 'return';
            e.wps = [slotOf(e)];
            e.wpI = 0;
          } else {
            e.alive = false;
          }
        }
        continue;
      }

      if (e.state === 'return') {
        const p = slotOf(e);
        e.wps = [p];
        if (followWaypoints(e, dt, 260)) {
          e.state = 'form';
          e.x = p.x;
          e.y = p.y;
        }
      }
    }

    if (!G.formed && G.waveKind !== 'rock' && G.waveKind !== 'saucer') {
      const live = aliveCount();
      if (live > 0 && waiting === 0 && entering === 0 && formedCount() === live) {
        G.formed = true;
        G.diveCd = 0.5;
      }
      if (G.clock > 11 && live > 0) G.formed = true;
    }

    if (G.formed && G.waveKind !== 'rock') {
      G.diveCd -= dt;
      if (G.diveCd <= 0) {
        tryDive();
        G.diveCd = Math.max(0.4, (isDry() ? 1.15 : 1.5) - G.wave * 0.07) * rand(0.75, 1.15);
      }
    }

    G.bombCd -= dt;
    if (G.bombCd <= 0 && G.formed && G.mode === 'play' && G.waveKind !== 'rock') {
      const pool = [];
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (e.alive && e.state === 'form') pool.push(e);
      }
      if (pool.length) enemyBomb(pool[(Math.random() * pool.length) | 0]);
      G.bombCd = Math.max(0.45, (isDry() ? 0.7 : 0.95) - G.wave * 0.04);
    }

    updateMother(dt);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.y += s.vy * dt;
      if (s.y < -16) {
        G.shots.splice(i, 1);
        G.missWave += 1;
        if (G.combo > 0 && G.mode === 'play') audio.miss();
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
      if (Math.abs(b.x - G.ship.x) < 12 && Math.abs(b.y - G.ship.y) < 12) {
        G.bombs.splice(i, 1);
        killPlayer('shot');
      }
    }
  }

  function updateDrops(dt) {
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.life -= dt;
      d.y += d.vy * dt;
      d.vy = Math.min(130, d.vy + 40 * dt);
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.ship.x - d.x;
        const dy = G.ship.y - d.y;
        const dist = hypot(dx, dy);
        if (dist < 56 && dist > 1) {
          d.x += (dx / dist) * 220 * dt;
          d.y += (dy / dist) * 220 * dt;
        }
        if (dist < 22) {
          pickupDrop(d);
          G.drops.splice(i, 1);
          continue;
        }
      }
      if (d.y > VH + 12 || d.life <= 0) G.drops.splice(i, 1);
    }
  }

  function collideBodies() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state === 'wait' || e.state === 'form' || e.state === 'orbit') continue;
      if (e.y < G.ship.y - 26) continue;
      const b = hitBox(e);
      if (Math.abs(e.x - G.ship.x) < b.hw + 10 && Math.abs(e.y - G.ship.y) < b.hh + 10) {
        explodeEnemy(e);
        killPlayer('ram');
        return;
      }
    }
    const m = G.mother;
    if (m && m.phase === 'bay' && G.rise > 0.2) {
      const inBay = Math.abs(G.ship.x - m.x) < 22;
      if (!inBay && Math.abs(G.ship.x - m.x) < m.w * 0.48 && G.ship.y < m.y + 42) {
        killPlayer('ram');
      }
    }
  }

  function updateFuel(dt) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.fuel -= fuelDrain() * dt;
    if (G.fuel < 28 && G.fuelWarn < 1) {
      G.fuelWarn = 1;
      toast('燃料告急', true, false);
      audio.warn();
    }
    if (G.fuel < 12 && G.fuelWarn < 2) {
      G.fuelWarn = 2;
      toast('燃料危急 ×2', true, false);
      audio.warn();
      screenFlash(HOT, 0.28);
    }
    if (G.fuel <= 0) {
      G.fuel = 0;
      killPlayer('fuel');
    }
  }

  function updateHeat(dt) {
    const firing = autoOn ? autoFire : (G.fireHold || pointer.down);
    const cool = G.overheat ? 48 : (firing ? 10 : 38);
    G.heat = Math.max(0, G.heat - cool * dt);
    if (G.overheat && G.heat < 24) {
      G.overheat = false;
      audio.cool();
      toast('冷却', false, false);
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.warpT > 0) G.warpT = Math.max(0, G.warpT - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    const starMul = G.warpT > 0 ? 0.28 : 1;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.v * dt * 0.28 * starMul;
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
    if (G.missWave === 0 && G.killWave > 0) {
      bonus += 800;
      toast('完美清波 +800', false, true);
      audio.wave();
    } else {
      toast('第 ' + G.wave + ' 波肃清', false, true);
      audio.wave();
    }
    if (G.waveKind === 'rock') bonus += 150 * G.wave;
    addScore(bonus);
    if (isChain() && G.wave === 4) {
      G.fuel = Math.min(FUEL_MAX, G.fuel + 36);
      G.fuelWarn = 0;
      toast('中继补燃', false, true);
      audio.fuel();
    }
    if (G.wave >= CAMP_WAVES) {
      if (G.waveKind === 'dock' && G.mother && G.mother.phase !== 'docked') return;
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
    addScore(isDry() ? 10000 : 8000);
    addScore(Math.round(G.fuel * 8));
    if (G.warp > 0) addScore(500);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.55);
    kick(3);
    const title = isDry() ? '空仓通关' : '航线打通';
    showOverlay('win', title, '本局 ' + G.score + ' · 最高 ' + G.best, '再来', isDry() ? '连射' : '空仓');
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
    const msg = why === 'fuel' ? '燃料耗尽' : '舰毁了';
    showOverlay('lose', msg, '本局 ' + G.score + ' · 最高 ' + G.best, '再来', '换模式');
    syncHud();
  }

  function startGame(kind) {
    autoOvWait = 0;
    autoTarget = VW * 0.5;
    autoStickX = VW * 0.5;
    autoFire = false;
    G.kind = kind === 'dry' ? 'dry' : 'chain';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    G.clock = 0;
    G.fuel = FUEL_MAX;
    G.warp = 1;
    resetField();
    G.ready = 0.7;
    hideOverlay();
    audio.start();
    toast(isChain() ? '连射 · 八波清场' : '空仓 · 燃料掉得更快', false, !isChain());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'chain';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    G.fuel = FUEL_MAX;
    G.warp = 1;
    resetField();
    G.ready = 0;
    showOverlay('title', '星炮', '连射编队。燃料一直掉，打爆敌机捡燃料。跃迁可把敌弹变慢。空仓掉得更快。', '连射', '空仓');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('chain');
    else startGame(G.kind || 'chain');
  }

  function checkWaveEnd() {
    if (G.mode !== 'play') return;
    if (G.waveKind === 'rock') {
      if (G.rockT <= 0) {
        let falling = 0;
        for (let i = 0; i < G.enemies.length; i++) {
          if (G.enemies[i].alive) falling += 1;
        }
        if (falling === 0) waveClear();
      }
      return;
    }
    if (G.waveKind === 'dock') {
      return;
    }
    if (aliveCount() === 0) waveClear();
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    updatePlayer(dt);
    const slow = G.warpT > 0 ? 0.32 : 1;
    if (G.mode === 'play') {
      if (autoOn) {
        if (autoFire) fire();
      } else if (G.fireHold || pointer.down) fire();
    }
    if (G.mode === 'title') {
      G.fireCd = Math.max(0, G.fireCd - dt);
      if (G.shots.length < 2 && G.fireCd <= 0) {
        G.shots.push({ x: G.ship.x, y: G.ship.y - 14, vy: -SHOT_V });
        G.fireCd = 0.22;
        G.muzzle = 0.06;
      }
    }
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateBombs(dt * slow);
      updateDrops(dt);
      return;
    }
    updateEnemies(dt * slow);
    updateShots(dt);
    updateBombs(dt * slow);
    updateDrops(dt);
    collideBodies();
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    tickAutoFlow(dt);

    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        updateFx(dt * 0.4);
        return;
      }
    }

    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();

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

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      const slow = G.warpT > 0 ? 0.32 : 1;
      updateEnemies(dt * slow);
      updateBombs(dt * slow);
      updateDrops(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why === 'fuel' ? 'fuel' : 'down');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = PLAYER_Y;
        G.invuln = 1.55;
        G.bombs = [];
        G.heat = 0;
        G.overheat = false;
        G.warp = 1;
        G.warpT = 0;
        if (G.why === 'fuel') G.fuel = 50;
        else G.fuel = Math.max(G.fuel, 18);
        G.fuelWarn = G.fuel < 28 ? 1 : 0;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);
    updateFuel(dt);
    updateHeat(dt);
    checkWaveEnd();
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
    g.addColorStop(0, '#1c0c08');
    g.addColorStop(0.5, '#120704');
    g.addColorStop(1, '#0a0503');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(160), 12 * scale, sx(240), sy(280), 360 * scale);
    vg.addColorStop(0, G.warpT > 0 ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 122, 41, 0.08)');
    vg.addColorStop(0.55, 'rgba(255, 61, 184, 0.03)');
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

    ctx.fillStyle = 'rgba(255, 122, 41, 0.16)';
    ctx.fillRect(sx(10), sy(PLAYER_Y + 16), (VW - 20) * scale, 2 * scale);
  }

  function drawSpinner(e, rgb) {
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.rotate(e.spin);
    ctx.fillStyle = rgba(rgb, 0.95);
    const s = 7 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.6);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s * 1.6);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.beginPath();
    ctx.arc(0, 0, 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawAmoeba(e, rgb) {
    const r = (e.gen === 0 ? 13 : e.gen === 1 ? 9 : 6) * scale;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.fillStyle = rgba(rgb, 0.9);
    ctx.beginPath();
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + e.spin * 0.4;
      const rr = r * (0.78 + 0.22 * Math.sin(G.t * 5 + i + e.phase));
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.12, r * 0.18, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFireball(e) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.75 + 0.25 * Math.sin(e.phase * 2);
    ctx.fillStyle = rgba(HOT, 0.35 * pulse);
    ctx.beginPath();
    ctx.arc(sx(e.x), sy(e.y), 11 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(sx(e.x), sy(e.y), 6 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(sx(e.x - 1.2), sy(e.y - 1.4), 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSaucer(e, rgb) {
    const spr = SPR_SAUCER[G.frame & 1];
    const cell = e.big ? 2.4 : 1.8;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = rgba(rgb, 1);
    ctx.beginPath();
    ctx.ellipse(sx(e.x), sy(e.y), (e.big ? 20 : 14) * scale, 7 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawSprite(e.x, e.y, spr, rgb, cell, 1);
    ctx.fillStyle = rgba(CYN, 0.8);
    ctx.beginPath();
    ctx.arc(sx(e.x), sy(e.y - (e.big ? 3 : 2)), (e.big ? 3.2 : 2.2) * scale, 0, TAU);
    ctx.fill();
  }

  function drawMother() {
    const m = G.mother;
    if (!m) return;
    ctx.save();
    ctx.fillStyle = rgba(HOT, 0.95);
    const x = sx(m.x - m.w * 0.5);
    const y = sy(m.y - m.h * 0.5);
    const w = m.w * scale;
    const h = m.h * scale;
    ctx.beginPath();
    ctx.moveTo(x + 10 * scale, y + h);
    ctx.lineTo(x, y + h * 0.45);
    ctx.lineTo(x + w * 0.18, y);
    ctx.lineTo(x + w * 0.82, y);
    ctx.lineTo(x + w, y + h * 0.45);
    ctx.lineTo(x + w - 10 * scale, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.5);
    ctx.fillRect(sx(m.x - 40), sy(m.y - 6), 80 * scale, 4 * scale);
    const pulse = m.bay ? 0.55 + 0.45 * Math.sin(G.t * 10) : 0.25;
    ctx.fillStyle = rgba(m.bay ? CYN : [80, 90, 110], pulse);
    ctx.fillRect(sx(m.x - 16), sy(m.y + 4), 32 * scale, 14 * scale);
    if (m.bay) {
      ctx.strokeStyle = rgba(CYN, 0.45);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(m.x - 16), sy(m.y + 18));
      ctx.lineTo(sx(m.x - 22), sy(PLAYER_Y));
      ctx.moveTo(sx(m.x + 16), sy(m.y + 18));
      ctx.lineTo(sx(m.x + 22), sy(PLAYER_Y));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemies() {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.state === 'wait') continue;
      const rgb = enemyRgb(e);
      if (e.type === 5) {
        drawFireball(e);
        continue;
      }
      if (e.type === 3) {
        drawAmoeba(e, rgb);
        continue;
      }
      if (e.type === 2) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = rgba(rgb, 1);
        ctx.beginPath();
        ctx.arc(sx(e.x), sy(e.y), 12 * scale, 0, TAU);
        ctx.fill();
        ctx.restore();
        drawSpinner(e, rgb);
        continue;
      }
      if (e.type === 4) {
        drawSaucer(e, rgb);
        continue;
      }
      const spr = (e.type === 1 ? SPR_FLY : SPR_SCOUT)[G.frame & 1];
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), 10 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawSprite(e.x, e.y, spr, rgb, 2, 1);
    }
    drawMother();
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!REDUCE) {
        ctx.fillStyle = rgba(HOT, 0.22);
        ctx.fillRect(sx(s.x - 1.4), sy(s.y), 2.8 * scale, 12 * scale);
      }
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.5), sy(s.y - 8), 3 * scale, 14 * scale);
      ctx.fillStyle = rgba(GOLD, 0.85);
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

  function drawDrops() {
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      const rgb = d.warp ? CYN : HOT;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(rgb, 0.35);
      ctx.beginPath();
      ctx.arc(sx(d.x), sy(d.y), 8 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(sx(d.x), sy(d.y - 7));
      ctx.quadraticCurveTo(sx(d.x + 6), sy(d.y), sx(d.x), sy(d.y + 7));
      ctx.quadraticCurveTo(sx(d.x - 6), sy(d.y), sx(d.x), sy(d.y - 7));
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(sx(d.x - 1.2), sy(d.y - 1.6), 1.6 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    ctx.save();
    ctx.globalAlpha = G.warpT > 0 ? 0.4 : 0.2;
    ctx.fillStyle = rgba(G.overheat ? MAG : CYN, 1);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), 14 * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawSprite(x, y, SPR_SHIP, G.overheat ? MAG : CYN, 2, 1);
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

  function drawWarpTint() {
    if (G.warpT <= 0) return;
    const a = 0.08 + 0.04 * Math.sin(G.t * 14);
    ctx.fillStyle = rgba(CYN, a);
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
    drawBg();
    drawEnemies();
    drawDrops();
    drawShots();
    drawShip();
    drawFx();
    drawWarpTint();
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
      startGame('chain');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space' || code === 'Space';
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down && !autoOn;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || space || k === 's' || k === 'S') {
      if (down) e.preventDefault();
    }
    if (!down) {
      if (space || k === 'ArrowUp' || k === 'w' || k === 'W') G.fireHold = false;
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
    if (autoOn) {
      if (k === 's' || k === 'S' || k === 'ArrowDown' || k === 'Shift' || space || k === 'Enter' || k === 'w' || k === 'W' || k === 'ArrowUp') {
        e.preventDefault();
      }
      if (overlayOpen() && (space || k === 'Enter')) {
        primaryAction();
      }
      return;
    }
    if (k === 's' || k === 'S' || k === 'ArrowDown' || k === 'Shift' || k === 'ShiftLeft' || k === 'ShiftRight') {
      if (overlayOpen()) return;
      tryWarp();
      return;
    }
    if (k === '1' && overlayOpen()) {
      startGame('chain');
      return;
    }
    if (k === '2' && overlayOpen()) {
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win') startGame(isDry() ? 'chain' : 'dry');
      else startGame('dry');
      return;
    }
    if (space || k === 'Enter' || k === 'ArrowUp' || k === 'w' || k === 'W') {
      if (overlayOpen()) {
        if (k === 'w' || k === 'W' || k === 'ArrowUp') return;
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
      if (autoOn) return;
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
    const scale = (autoOn && G.mode === 'play') ? (AUTO_TIME[autoSpeed] || 1) : 1;
    acc += dt * scale;
    let n = 0;
    const maxSteps = autoOn && autoSpeed >= 4 ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * maxSteps) acc = 0;
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
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();

  if (btnCamp) {
    btnCamp.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('chain');
    });
  }
  if (btnEnd) {
    btnEnd.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win') startGame(isDry() ? 'chain' : 'dry');
      else startGame('dry');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnWarp) {
    btnWarp.addEventListener('click', function () {
      if (autoOn) return;
      audio.ensure();
      tryWarp();
    });
  }
  if (btnAuto) btnAuto.addEventListener('click', toggleAuto);
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10));
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
