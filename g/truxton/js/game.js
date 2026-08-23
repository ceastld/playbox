'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.5;
  const BEST_KEY = 'playbox-truxton-best';
  const MUTE_KEY = 'playbox-truxton-mute';
  const AUTO_SPEED_KEY = 'playbox-truxton-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '方向 / WSD 移动 · 空格开火 · Shift / Z 达鲁爆 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const VIO = [184, 107, 255];
  const CYN = [122, 208, 255];
  const GOLD = [255, 227, 107];
  const GRN = [92, 255, 154];
  const RED = [255, 90, 120];
  const WHT = [244, 236, 255];
  const PNK = [255, 154, 212];
  const BONE = [232, 214, 196];
  const DEEP = [16, 8, 28];

  const WPN_NAME = { red: '红', green: '绿', blue: '蓝' };
  const WPN_RGB = { red: RED, green: GRN, blue: CYN, bomb: GOLD };
  const DROP_CYCLE = ['red', 'green', 'blue', 'bomb'];
  const DROP_GLYPH = { red: '红', green: '绿', blue: '蓝', bomb: '爆' };

  const SCORE = {
    grunt: 50,
    dive: 80,
    turret: 150,
    orb: 120,
    elite: 240,
    carrier: 300,
    mid: 2000,
    boss: 4000,
    chip: 10,
    stage: 1500,
    pmax: 500
  };

  const STAGES = [
    {
      name: '紫星',
      biome: 'star',
      mid: '骷卫',
      boss: '角魔',
      form: 'horn',
      midHp: 34,
      bossHp: 82,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'stream', dir: 1 },
        { t: 5.4, kind: 'dive', n: 4 },
        { t: 7.6, kind: 'orbs', n: 3 },
        { t: 9.8, kind: 'carrier' },
        { t: 12.0, kind: 'v', n: 7 },
        { t: 14.2, kind: 'mid' },
        { t: 20.0, kind: 'stream', dir: -1 },
        { t: 22.2, kind: 'dive', n: 4 },
        { t: 24.4, kind: 'turrets' },
        { t: 26.6, kind: 'v', n: 7 },
        { t: 31.4, kind: 'boss' }
      ]
    },
    {
      name: '骨廊',
      biome: 'bone',
      mid: '骨环',
      boss: '骨王',
      form: 'bone',
      midHp: 46,
      bossHp: 112,
      waves: [
        { t: 0.6, kind: 'v', n: 7 },
        { t: 2.6, kind: 'turrets' },
        { t: 4.8, kind: 'dive', n: 5 },
        { t: 7.0, kind: 'stream', dir: -1 },
        { t: 9.2, kind: 'elite' },
        { t: 11.2, kind: 'carrier' },
        { t: 13.2, kind: 'orbs', n: 4 },
        { t: 15.2, kind: 'mid' },
        { t: 21.0, kind: 'v', n: 9 },
        { t: 23.0, kind: 'dive', n: 6 },
        { t: 25.0, kind: 'turrets' },
        { t: 27.0, kind: 'stream', dir: 1 },
        { t: 29.0, kind: 'elite' },
        { t: 34.4, kind: 'boss' }
      ]
    },
    {
      name: '魔核',
      biome: 'core',
      mid: '魔侍',
      boss: '达鲁魔',
      form: 'tats',
      midHp: 58,
      bossHp: 156,
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'dive', n: 5 },
        { t: 4.4, kind: 'elite' },
        { t: 6.4, kind: 'orbs', n: 5 },
        { t: 8.2, kind: 'turrets' },
        { t: 10.0, kind: 'carrier' },
        { t: 11.8, kind: 'stream', dir: 1 },
        { t: 13.6, kind: 'mid' },
        { t: 19.4, kind: 'v', n: 9 },
        { t: 21.2, kind: 'dive', n: 6 },
        { t: 23.0, kind: 'elite' },
        { t: 24.8, kind: 'orbs', n: 5 },
        { t: 26.6, kind: 'stream', dir: -1 },
        { t: 28.4, kind: 'turrets' },
        { t: 30.2, kind: 'carrier' },
        { t: 36.0, kind: 'boss' }
      ]
    }
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
  const btnHunt = document.getElementById('btn-hunt');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const bombLabel = document.getElementById('bomb-label');
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
  let wpnTok = 0;
  let dropCycle = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];
  const bolts = [];

  const G = {
    mode: 'title',
    kind: 'hunt',
    t: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    wpn: 'red',
    wpnLv: 0,
    shieldBroke: false,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    skullT: 0,
    enemies: [],
    shots: [],
    bullets: [],
    pows: [],
    ship: { x: VW * 0.5, y: 630, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: VIO,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    stageClear: false
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = VW * 0.5;
  let autoTy = 630;
  let autoStickS = -1e9;
  let autoOvWait = 0;

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
  function isDense() {
    return G.kind === 'dense';
  }
  function dens() {
    return isDense() ? 1.28 : 1;
  }
  function shipSpeed() {
    return (isDense() ? 312 : 270) + G.wpnLv * 8;
  }
  function bulletSpd() {
    return isDense() ? 188 : 148;
  }
  function scrollSpd() {
    if (hasBoss() || hasMid()) return 28;
    return isDense() ? 116 : 84;
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function stageData() {
    return STAGES[G.stage - 1] || STAGES[0];
  }
  function wpnRgb() {
    return WPN_RGB[G.wpn] || RED;
  }
  function hasShield() {
    return G.wpn === 'red' && G.wpnLv >= WPN_MAX && !G.shieldBroke;
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
    shoot(w, lv) {
      this.ensure();
      const lift = 1 + (lv || 0) * 0.1;
      if (w === 'green') {
        this.beep(420 * lift, 0.07, 'sawtooth', 0.03, 180);
        this.beep(880, 0.05, 'square', 0.016, 440);
      } else if (w === 'blue') {
        this.noise(0.04, 0.028, 1800);
        this.beep(980 * lift, 0.055, 'square', 0.03, 1640);
        this.beep(220, 0.06, 'sawtooth', 0.018, 90);
      } else {
        this.beep(700 * lift, 0.042, 'square', 0.026 + (lv || 0) * 0.004, 1420 * lift);
      }
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1400);
      this.beep(640 * lift, 0.055, 'square', 0.036, 980 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 500);
      this.beep(280, 0.14, 'sawtooth', 0.045, 70);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.055, 'sawtooth', 0.038, 180);
      this.beep(620, 0.07, 'square', 0.03, 880);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 280);
      this.beep(180, 0.28, 'sawtooth', 0.05, 50);
      this.beep(520, 0.2, 'triangle', 0.04, 220);
      this.beep(1040, 0.32, 'sine', 0.04, 1560);
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
    power() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 990);
      this.beep(990, 0.12, 'triangle', 0.036, 1480);
      this.beep(1320, 0.16, 'sine', 0.03, 1760);
    },
    max() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
      this.beep(1175, 0.2, 'sine', 0.05, 1568);
    },
    bomb() {
      this.ensure();
      this.noise(0.2, 0.07, 220);
      this.beep(140, 0.26, 'sawtooth', 0.06, 42);
      this.beep(360, 0.18, 'square', 0.04, 90);
      this.beep(880, 0.22, 'sine', 0.04, 1760);
    },
    shield() {
      this.ensure();
      this.beep(880, 0.08, 'sine', 0.04, 440);
      this.noise(0.08, 0.04, 900);
      this.beep(220, 0.14, 'triangle', 0.03, 110);
    },
    pickup() {
      this.ensure();
      this.beep(740, 0.07, 'sine', 0.036, 1480);
      this.beep(1180, 0.09, 'triangle', 0.022, 1760);
    },
    empty() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.03, 90);
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
    while (G.score >= G.next1up && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.next1up += LIFE_EVERY;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.055);
      kick(3.2);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.046);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
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
    const n = LIFE_CAP;
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

  function wpnText() {
    const name = WPN_NAME[G.wpn] || '红';
    if (G.wpnLv >= WPN_MAX) return name + ' MAX';
    return name + (G.wpnLv > 0 ? ' ' + G.wpnLv : '');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const st = stageData();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '达鲁';
      else if (hasBoss()) stageLabel.textContent = st.boss;
      else if (hasMid()) stageLabel.textContent = st.mid;
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密弹' : '降魔';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.wpnLv >= WPN_MAX);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.remove('red', 'green', 'blue', 'max');
      wpnLabel.classList.add(G.wpn === 'green' ? 'green' : G.wpn === 'blue' ? 'blue' : 'red');
      if (G.wpnLv >= WPN_MAX) wpnLabel.classList.add('max');
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    const bombOff = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (btnBomb) btnBomb.disabled = bombOff;
    if (btnPad) btnPad.disabled = bombOff;
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · R 重开接着打', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格连射，Shift 达鲁爆', 'warn');
    else if (G.mode === 'win') setHint('魔核已碎 · R 再来', 'hot');
    else if (G.wpnLv >= WPN_MAX) setHint(WPN_NAME[G.wpn] + ' MAX' + (hasShield() ? ' · 虹盾可挡一击' : ' · 铺满前路'), 'hot');
    else if (G.lives === 1) setHint('最后一命 · 达鲁爆清场', 'warn');
    else setHint('空格连射 · Shift 达鲁爆 · 捡 红/绿/蓝 · A 自动', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TRUX';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'win' && G.kind === 'hunt') btnOvModes.textContent = '密弹';
      else btnOvModes.textContent = '换模式';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.8 ? 'bomb' : mag >= 3.2 ? 'pow' : 'hit');
    stageEl.classList.remove('die', 'hit', 'pow', 'boss', 'bomb');
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
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 180,
        life: rand(0.22, 0.5),
        r: rand(1.2, 2.8),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      t: 0,
      life: gold ? 0.9 : 0.65,
      vy: gold ? -70 : -48,
      text: text,
      rgb: rgb,
      gold: !!gold
    });
    capArr(floats, 18);
  }

  function zap(x1, y1, x2, y2, rgb) {
    bolts.push({ x1: x1, y1: y1, x2: x2, y2: y2, t: 0, rgb: rgb || CYN });
    capArr(bolts, 24);
  }

  function explode(x, y, rgb, power) {
    const p = power || 16;
    burst(x, y, rgb, Math.min(28, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 72; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.12, 0.62),
        z: rand(0.35, 1.2)
      });
    }
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'mid';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'grunt',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 92 * dens() : spec.vy,
      hp: bossish ? spec.hp : hp,
      maxHp: bossish ? spec.hp : hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.grunt,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: !!spec.ground,
      drop: spec.drop || null,
      form: spec.form || '',
      name: spec.name || ''
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.5,
      life: 8
    });
    capArr(G.bullets, 260);
  }

  function aimedFire(e, n, spread, spd) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.3);
    }
  }

  function ringFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.4);
    }
  }

  function spawnGrunt(x, y, vx, vy) {
    spawnEnemy({
      kind: 'grunt',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 12,
      amp: 42,
      score: SCORE.grunt,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    const extra = isDense() ? 2 : 0;
    const total = n + extra;
    for (let i = 0; i < total; i++) {
      const k = i - (total - 1) * 0.5;
      spawnGrunt(c + k * 34, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isDense() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'grunt',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 12,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.grunt,
        fireCd: 0.7 + i * 0.12
      });
    }
  }

  function spawnDive(n) {
    const extra = isDense() ? 1 : 0;
    for (let i = 0; i < n + extra; i++) {
      spawnEnemy({
        kind: 'dive',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vy: 40,
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: 99
      });
    }
  }

  function spawnTurrets() {
    const n = isDense() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'turret',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 44 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.turret,
        fireCd: 0.55 + i * 0.1,
        ground: true
      });
    }
  }

  function spawnOrbs(n) {
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'orb',
        x: 80 + i * ((VW - 160) / Math.max(1, n - 1)),
        y: -24 - (i % 2) * 18,
        vy: 62 * dens(),
        hp: 4,
        r: 13,
        amp: 36,
        phase: i * 0.8,
        score: SCORE.orb,
        fireCd: 0.8 + i * 0.1
      });
    }
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: 150,
      vy: 56 * dens(),
      hp: 10,
      r: 18,
      amp: 86,
      score: SCORE.elite,
      fireCd: 0.5
    });
    spawnEnemy({
      kind: 'elite',
      x: 330,
      vy: 56 * dens(),
      hp: 10,
      r: 18,
      amp: 86,
      phase: 1.6,
      score: SCORE.elite,
      fireCd: 0.7
    });
    if (isDense()) {
      spawnEnemy({
        kind: 'elite',
        x: 240,
        vy: 50 * dens(),
        hp: 10,
        r: 18,
        amp: 70,
        phase: 0.8,
        score: SCORE.elite,
        fireCd: 0.6
      });
    }
  }

  function nextDrop() {
    const k = DROP_CYCLE[dropCycle % DROP_CYCLE.length];
    dropCycle += 1;
    return k;
  }

  function spawnCarrier() {
    spawnEnemy({
      kind: 'carrier',
      x: Math.random() < 0.5 ? 140 : 340,
      vy: 52 * dens(),
      hp: 8,
      r: 17,
      amp: 64,
      score: SCORE.carrier,
      fireCd: 0.7,
      drop: nextDrop()
    });
  }

  function spawnMid() {
    const st = stageData();
    const e = spawnEnemy({
      kind: 'mid',
      x: VW * 0.5,
      y: -70,
      vy: 0,
      hp: Math.round(st.midHp * hpMul()),
      r: 28,
      score: SCORE.mid,
      enter: 1.05,
      fireCd: 0.7,
      form: st.form,
      name: st.mid,
      drop: nextDrop()
    });
    e.maxHp = e.hp;
    toast(st.mid, false, true);
    audio.wave();
    screenFlash(VIO, 0.28);
    kick(3.8, 'boss');
    syncHud();
  }

  function spawnBoss() {
    const st = stageData();
    const e = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -90,
      vy: 0,
      hp: Math.round(st.bossHp * hpMul()),
      r: 40,
      score: SCORE.boss + 1500 * G.stage,
      enter: 1.35,
      fireCd: 0.85,
      form: st.form,
      name: st.boss
    });
    e.maxHp = e.hp;
    toast(st.boss, false, true);
    audio.wave();
    screenFlash(MAG, 0.36);
    kick(4.8, 'boss');
    syncHud();
    return e;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n, w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'orbs') spawnOrbs(w.n + (isDense() ? 1 : 0));
    else if (w.kind === 'elite') spawnElite();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function hasKind(kind) {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === kind) return true;
    }
    return false;
  }

  function hasBoss() {
    return hasKind('boss');
  }

  function hasMid() {
    return hasKind('mid');
  }

  function nearestEnemy(x, y, skip) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e === skip) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function fireRate() {
    const lv = G.wpnLv;
    if (G.wpn === 'green') return 0.128 - lv * 0.013;
    if (G.wpn === 'blue') return 0.148 - lv * 0.014;
    return 0.110 - lv * 0.012;
  }

  function addShot(spec) {
    G.shots.push(spec);
    capArr(G.shots, 90);
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.05 + G.wpnLv * 0.01;
    const lv = G.wpnLv;
    const x = G.ship.x;
    const y = G.ship.y - 16;
    const w = G.wpn;
    if (w === 'green') {
      const n = lv <= 0 ? 1 : lv === 1 ? 2 : lv === 2 ? 3 : 5;
      const gap = lv >= 3 ? 22 : 18;
      const dmg = 1.35 + lv * 0.35;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
        addShot({
          x: x + t * gap,
          y: y,
          vx: t * 18,
          vy: -820,
          r: 5 + lv * 0.8,
          w: 5 + lv * 1.6,
          h: 28 + lv * 6,
          dmg: dmg,
          pierce: 6 + lv * 2,
          last: null,
          kind: 'beam',
          rgb: GRN
        });
      }
    } else if (w === 'blue') {
      const n = lv <= 0 ? 1 : lv === 1 ? 2 : lv === 2 ? 3 : 5;
      const spd = 420 + lv * 30;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
        const a = -Math.PI * 0.5 + t * (0.18 + lv * 0.04);
        addShot({
          x: x + t * 8,
          y: y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: 4.2,
          dmg: 1.15 + lv * 0.2,
          kind: 'bolt',
          rgb: CYN,
          zig: rand(0, TAU),
          trail: []
        });
      }
    } else {
      const n = lv <= 0 ? 1 : lv === 1 ? 3 : 5;
      const spread = lv <= 0 ? 0 : lv === 1 ? 0.16 : lv === 2 ? 0.22 : 0.3;
      const dmg = 1 + lv * 0.22;
      const spd = 680;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
        const a = -Math.PI * 0.5 + t * spread;
        addShot({
          x: x + t * (4 + lv),
          y: y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: 3.4 + lv * 0.5,
          dmg: dmg,
          kind: 'spread',
          rgb: RED
        });
      }
    }
    audio.shoot(w, lv);
  }

  function tryBomb() {
    if (G.mode !== 'play' || overlayOpen() || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('爆弹用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.48;
    G.bombFlash = 0.6;
    G.skullT = 0.62;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    hitStop(0.078);
    kick(6.6, 'bomb');
    screenFlash(GOLD, 0.74);
    ring(G.ship.x, G.ship.y - 12, GOLD);
    ring(G.ship.x, G.ship.y - 12, VIO);
    burst(G.ship.x, G.ship.y - 16, VIO, 28, 250);
    burst(G.ship.x, G.ship.y - 16, WHT, 18, 200);
    floatText(G.ship.x, G.ship.y - 36, '达鲁爆', GOLD, true);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.5 + (i - 3) * 0.28;
      zap(G.ship.x, G.ship.y, G.ship.x + Math.cos(a) * 220, G.ship.y + Math.sin(a) * 260, i % 2 ? GOLD : CYN);
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      burst(G.bullets[i].x, G.bullets[i].y, GOLD, 3, 60);
      G.bullets.splice(i, 1);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dmg = e.kind === 'boss' ? 14 : e.kind === 'mid' ? 10 : 6;
      damageEnemy(e, dmg, 'bomb');
    }
    syncHud();
  }

  function spawnPow(x, y, kind) {
    const k = kind === 'bomb' ? 'bomb' : (kind === 'green' || kind === 'blue' || kind === 'red' ? kind : 'red');
    G.pows.push({
      x: x,
      y: y,
      vx: rand(-28, 28),
      vy: 42,
      kind: k,
      t: 0
    });
    capArr(G.pows, 12);
  }

  function pulseWpn() {
    if (!wpnLabel) return;
    wpnLabel.classList.remove('hot');
    void wpnLabel.offsetWidth;
    wpnLabel.classList.add('hot');
    wpnTok += 1;
  }

  function collectPow(p) {
    const rgb = WPN_RGB[p.kind] || GOLD;
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        floatText(p.x, p.y, '爆', GOLD, true);
      } else {
        const pts = Math.round(400 * G.mult);
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, GOLD, false);
      }
      audio.pickup();
    } else {
      const kind = p.kind;
      if (kind === G.wpn) {
        if (G.wpnLv < WPN_MAX) {
          G.wpnLv += 1;
          audio.power();
          floatText(p.x, p.y, wpnText(), rgb, true);
          pulseWpn();
          if (G.wpnLv >= WPN_MAX) {
            G.shieldBroke = false;
            audio.max();
            toast(WPN_NAME[kind] + ' MAX', false, true);
            floatText(G.ship.x, G.ship.y - 40, 'MAX', GOLD, true);
            hitStop(0.055);
            kick(3.6, 'pow');
            screenFlash(rgb, 0.42);
          }
        } else {
          G.shieldBroke = false;
          const pts = Math.round(SCORE.pmax * G.mult);
          addScore(pts);
          floatText(p.x, p.y, '+' + pts, rgb, true);
          audio.pickup();
        }
      } else {
        G.wpn = kind;
        G.wpnLv = Math.max(1, Math.min(2, G.wpnLv));
        G.shieldBroke = false;
        audio.power();
        toast('武装 · ' + WPN_NAME[kind], false, true);
        floatText(p.x, p.y, WPN_NAME[kind], rgb, true);
        pulseWpn();
        kick(2.8, 'pow');
        screenFlash(rgb, 0.28);
      }
    }
    burst(p.x, p.y, rgb, 10, 110);
    spark(p.x, p.y, rgb);
    if (G.combo >= 1) bumpCombo();
    else {
      G.combo = 1;
      G.comboT = COMBO_WIN;
      G.mult = 1;
    }
    syncHud();
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, wpnRgb());
      hitStop(0.034);
      audio.hit(G.combo);
      kick(1.7);
    }
    if ((e.kind === 'boss' || e.kind === 'mid') && src === 'shot') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'mid' || e.kind === 'elite' || e.kind === 'carrier' ? VIO : PNK;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 48 : e.kind === 'mid' ? 32 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss' || e.kind === 'mid');
    if (e.drop) spawnPow(e.x, e.y, e.drop);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.72);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, GOLD);
      G.bullets.length = 0;
      toast(e.name + '碎裂', false, true);
      if (G.stage >= 3) G.winT = 2.05;
      else {
        G.stageClear = true;
        G.gapT = 0;
      }
    } else if (e.kind === 'mid') {
      audio.explode();
      hitStop(0.062);
      kick(5.2, 'boss');
      screenFlash(VIO, 0.4);
      G.bullets.length = 0;
    } else if (e.kind === 'elite' || e.kind === 'carrier') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    syncHud();
  }

  function breakShield() {
    G.shieldBroke = true;
    G.invuln = Math.max(G.invuln, 0.55);
    audio.shield();
    hitStop(0.06);
    kick(4.2, 'pow');
    screenFlash(RED, 0.5);
    burst(G.ship.x, G.ship.y, GOLD, 18, 180);
    burst(G.ship.x, G.ship.y, RED, 12, 140);
    ring(G.ship.x, G.ship.y, GOLD);
    floatText(G.ship.x, G.ship.y - 32, '虹盾碎', GOLD, true);
    toast('虹盾碎了', true, false);
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.bombT > 0) return;
    if (hasShield()) {
      breakShield();
      return;
    }
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, VIO, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    if (G.wpn !== 'red' || G.wpnLv > 0) {
      spawnPow(G.ship.x, G.ship.y - 10, G.wpn);
    }
    G.wpn = 'red';
    G.wpnLv = 0;
    G.shieldBroke = false;
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = 630;
    G.invuln = 1.55;
    G.deadT = 0;
    G.bombT = 0;
    G.skullT = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '达鲁战机已碎。红散绿穿蓝雷，达鲁爆清场。分数 ' + G.score + '。');
    setHint('R 重开 · 空格连射，Shift 达鲁爆', 'warn');
  }

  function goWin() {
    addScore(isDense() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isDense() ? '密弹通关' : '魔核尽破',
      '三关打穿，达鲁魔已碎。分数 ' + G.score + (isDense() ? ' · 密弹' : ' · 降魔') + '。'
    );
    setHint('魔核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    bolts.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    G.stageClear = false;
    const st = stageData();
    toast('第 ' + G.stage + ' 关 · ' + st.name, false, true);
    audio.wave();
    screenFlash(VIO, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    dropCycle = 0;
    G.mode = 'play';
    G.kind = kind === 'dense' ? 'dense' : 'hunt';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.wpn = 'red';
    G.wpnLv = 0;
    G.shieldBroke = false;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.skullT = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.gapT = 0;
    G.stageClear = false;
    G.scroll = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 630;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isDense() ? '密弹' : '降魔', isDense(), !isDense());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'hunt';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.wpn = 'red';
    G.wpnLv = 0;
    G.bombs = 3;
    G.deadT = 0;
    G.skullT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 630;
    clearWorld();
    showOverlay('title', '达鲁', '纵向达鲁战机。捡红绿蓝切武装：红散、绿穿、蓝雷。达鲁爆是骷髅雷。短关之后是魔。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('hunt');
    else startGame(G.kind || 'hunt');
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      p.vx *= Math.exp(-dt * 1.8);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.6;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.6;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t += dt * 5.2;
      if (bolts[i].t >= 1) bolts.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.bombFlash > 0) G.bombFlash -= dt;
    if (G.skullT > 0) G.skullT -= dt;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      s.y += scr * 0.45 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.sht = false;
    pointer.down = false;
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
    autoTx = G.ship.x;
    autoTy = G.ship.y;
    autoStickS = -1e9;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('hunt');
    }
    syncHud();
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.22 : 0.48)) {
        autoOvWait = 0;
        startGame('hunt');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'hunt');
      }
    }
  }

  function autoDanger(x, y, horizon) {
    let d = 0;
    const look = horizon;
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const relx = b.x - x;
      const rely = b.y - y;
      const vv = b.vx * b.vx + b.vy * b.vy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * b.vx + rely * b.vy) / vv, 0, look);
      const dist = hypot(relx + b.vx * t, rely + b.vy * t);
      const rad = HIT_R + b.r * 0.55 + 1.2;
      if (t <= look && dist < rad + 34) {
        const soon = (look - t) / Math.max(0.08, look);
        d += Math.max(0.5, rad + 12 - dist) * soon * 26;
        if (dist < rad) d += 260 * soon;
      }
    }
    const den = dens();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.ground) continue;
      let evx = e.vx || 0;
      let evy = e.vy || 0;
      if (e.kind === 'dive' && e.t > 0.35) {
        const a = Math.atan2(y - e.y, x - e.x);
        evx = Math.cos(a) * 210 * den;
        evy = Math.sin(a) * 240 * den;
      }
      const relx = e.x - x;
      const rely = e.y - y;
      const vv = evx * evx + evy * evy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * evx + rely * evy) / vv, 0, look);
      const dist = hypot(relx + evx * t, rely + evy * t);
      const r = e.r * (e.kind === 'boss' || e.kind === 'mid' ? 0.62 : 0.7);
      const hitR = HIT_R + r;
      if (dist < hitR + 28) {
        const soon = (look - t) / Math.max(0.08, look);
        const w = e.kind === 'dive' ? 34 : e.kind === 'boss' || e.kind === 'mid' ? 14 : 18;
        d += Math.max(0.4, hitR + 14 - dist) * soon * w;
        if (dist < hitR) d += 250 * soon;
      }
      if (hypot(e.x - x, e.y - y) < hitR + 8) d += 120;
    }
    return d;
  }

  function autoWantKind() {
    let n = 0;
    let minX = 1e9;
    let maxX = -1e9;
    let lined = 0;
    let dives = 0;
    let big = false;
    const px = G.ship.x;
    const py = G.ship.y;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.y < -40 || e.y > py + 16) continue;
      n += 1;
      if (e.x < minX) minX = e.x;
      if (e.x > maxX) maxX = e.x;
      if (Math.abs(e.x - px) < 18 && e.y < py) lined += 1;
      if (e.kind === 'dive') dives += 1;
      if (e.kind === 'boss' || e.kind === 'mid') big = true;
    }
    if (big) return 'green';
    if (n >= 6 && (maxX - minX) > 140) return 'red';
    if (dives >= 3) return 'blue';
    if (lined >= 3) return 'green';
    if (G.wpn !== 'red') return G.wpn;
    return 'red';
  }

  function autoThink() {
    if (!autoOn) return;
    if (G.mode !== 'play' || G.deadT > 0) {
      keys.sht = false;
      return;
    }

    const dense = isDense();
    const horizon = dense ? 0.62 : 0.5;
    const px = G.ship.x;
    const py = G.ship.y;
    const want = autoWantKind();
    let aimX = VW * 0.5;
    let aimY = null;
    let aimW = -1e9;
    let cluster = 0;
    let colHp = 0;
    let nearbyShots = 0;
    let colShots = 0;
    let boss = null;
    let pick = null;
    let pickW = -1e9;

    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.y < -36 || e.y > py + 20) continue;
      let w = 32;
      if (e.kind === 'dive') w = 78;
      else if (e.kind === 'carrier') w = 150;
      else if (e.kind === 'turret') w = 88;
      else if (e.kind === 'orb') w = 70;
      else if (e.kind === 'elite') w = 140;
      else if (e.kind === 'mid') w = 240;
      else if (e.kind === 'boss') w = 280 + e.hp * 0.35;
      else w = 36 + (e.hp || 1) * 8;
      w += (e.hp || 1) * 4;
      w -= Math.abs(e.x - px) * 0.22;
      w -= Math.max(0, py - e.y) * 0.06;
      if (e.y > 40 && e.y < py - 10) w += 22;
      if (Math.abs(e.x - px) < 14 && e.y < py) colHp += e.hp || 1;
      if (e.kind === 'boss' || e.kind === 'mid') boss = e;
      if (w > aimW) {
        aimW = w;
        aimX = e.x;
        aimY = e.y;
      }
    }
    if (aimY != null) {
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (!e.alive) continue;
        if (Math.abs(e.x - aimX) < 28 && e.y < py) cluster += 1;
      }
    }

    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const dist = hypot(b.x - px, b.y - py);
      if (dist < 150) nearbyShots += 1;
      if (Math.abs(b.x - px) < 12 && b.y < py && b.y > py - 280) colShots += 1;
    }

    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      let w = 78 - hypot(p.x - px, p.y - py) * 0.42;
      if (p.kind === 'bomb') {
        w += G.bombs <= 0 ? 96 : G.bombs <= 1 ? 54 : G.bombs < BOMB_CAP ? 20 : 6;
      } else if (p.kind === G.wpn) {
        w += G.wpnLv < WPN_MAX ? 76 : 12;
      } else {
        if (G.wpn === 'red' && G.wpnLv <= 0) w += 88;
        else if (p.kind === want) w += 68;
        else if (G.wpnLv >= WPN_MAX) w += 44;
        else w += 26;
      }
      if (p.y > py - 50) w += 24;
      if (w > pickW) {
        pickW = w;
        pick = p;
      }
    }

    const hereDang = autoDanger(px, py, horizon);
    const panic = hereDang > 92 || (G.lives <= 1 && hereDang > 58);
    const crowded = nearbyShots >= (dense ? 6 : 8);
    const grabPick = pick && (G.invuln > 0.15 || autoDanger(pick.x, pick.y, 0.28) < 52 || hypot(pick.x - px, pick.y - py) < 96);

    let desiredX = aimY != null ? aimX : VW * 0.5;
    let desiredY = VH - 118;
    if (aimY != null) desiredY = clamp(aimY + 158, 210, VH - 72);
    if (boss) desiredY = clamp(boss.y + 168, 240, VH - 78);
    if (hereDang > 50) desiredY = Math.min(VH - 64, Math.max(desiredY, py + 12));
    if (panic) desiredY = clamp(py + 36, 260, VH - 32);
    if (colShots >= 1) {
      desiredX = clamp(px + (px < VW * 0.5 ? 56 : -56), 40, VW - 40);
      desiredY = clamp(py + (py > VH - 140 ? -48 : 36), 200, VH - 36);
    }
    if (grabPick && pick && !panic) {
      desiredX = pick.x;
      desiredY = clamp(pick.y, 90, VH - 32);
    }

    const xMin = 28;
    const xMax = VW - 28;
    const yMin = 80;
    const yMax = VH - 28;
    let bestX = clamp(autoTx, xMin, xMax);
    let bestY = clamp(autoTy, yMin, yMax);
    let bestS = -1e15;

    function consider(x, y) {
      x = clamp(x, xMin, xMax);
      y = clamp(y, yMin, yMax);
      let s = -autoDanger(x, y, horizon) * (dense ? 7.4 : 6.1);
      s -= Math.abs(x - desiredX) * (boss || cluster >= 3 ? 1.05 : 0.55);
      s -= Math.abs(y - desiredY) * 0.72;
      s -= hypot(x - px, y - py) * 0.1;
      if (y < 150) s -= 28;
      if (y > VH - 36) s -= 6;
      if (x < 40 || x > VW - 40) s -= 12;
      if (aimY != null && Math.abs(x - aimX) < 12) s += 22;
      if (colHp > 0 && Math.abs(x - px) < 10) s += 10;
      if (grabPick && pick) s -= hypot(x - pick.x, y - pick.y) * 0.5;
      if (s > bestS) {
        bestS = s;
        bestX = x;
        bestY = y;
      }
    }

    consider(px, py);
    consider(autoTx, autoTy);
    consider(desiredX, desiredY);
    for (let ix = 0; ix < 9; ix++) {
      const x = 40 + ix * ((VW - 80) / 8);
      for (let iy = 0; iy < 8; iy++) {
        consider(x, 110 + iy * ((VH - 150) / 7));
      }
    }
    if (aimY != null) {
      consider(aimX, desiredY);
      consider(aimX, py);
      consider(px, desiredY);
      consider(aimX - 48, desiredY);
      consider(aimX + 48, desiredY);
      consider(aimX, Math.min(VH - 40, aimY + 120));
    }
    if (grabPick && pick) consider(pick.x, pick.y);
    consider(px - 70, py);
    consider(px + 70, py);
    consider(px, py - 72);
    consider(px, py + 56);
    consider(px - 36, py - 40);
    consider(px + 36, py - 40);
    consider(px - 50, py + 30);
    consider(px + 50, py + 30);
    consider(desiredX, clamp(desiredY - 40, yMin, yMax));
    consider(desiredX, clamp(desiredY + 30, yMin, yMax));

    let switchGap = hereDang > 48 ? 6 : 20;
    if (Math.abs(desiredY - py) > 36 || (grabPick && pick)) switchGap = Math.min(switchGap, 4);
    if (bestS > autoStickS + switchGap || hereDang > 55 || hypot(autoTx - px, autoTy - py) < 5) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    keys.sht = true;

    if (G.bombs > 0 && G.bombT <= 0 && G.invuln < 0.12) {
      if (panic || crowded || (boss && nearbyShots >= 6 && hereDang > 70) || hereDang > 130) {
        tryBomb();
      }
    }
  }

  function updateShip(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = shipSpeed();
    if (autoOn) {
      const ax = autoTx - G.ship.x;
      const ay = autoTy - G.ship.y;
      const d = hypot(ax, ay);
      const boost = autoSpeed >= 4 ? 1.22 : autoSpeed >= 3 ? 1.06 : autoSpeed <= 1 ? 0.86 : 0.96;
      if (d > 1.2) {
        const step = Math.min(d, spd * dt * boost);
        G.ship.x += ax / d * step;
        G.ship.y += ay / d * step;
        G.ship.vx = ax / d * spd;
        G.ship.vy = ay / d * spd;
      } else {
        G.ship.vx = 0;
        G.ship.vy = 0;
      }
      G.ship.x = clamp(G.ship.x, 22, VW - 22);
      G.ship.y = clamp(G.ship.y, 40, VH - 28);
      return;
    }
    let dx = 0;
    let dy = 0;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (dx || dy) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
      G.ship.vx = dx * spd;
      G.ship.vy = dy * spd;
      inputSrc = 'key';
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      G.ship.x = lerp(G.ship.x, tx, 1 - Math.exp(-dt * 16));
      G.ship.y = lerp(G.ship.y, ty, 1 - Math.exp(-dt * 16));
      G.ship.vx = 0;
      G.ship.vy = 0;
    } else {
      G.ship.vx *= Math.exp(-dt * 10);
      G.ship.vy *= Math.exp(-dt * 10);
    }
    G.ship.x += G.ship.vx * dt;
    G.ship.y += G.ship.vy * dt;
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (wantFire()) fireShot();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.kind === 'bolt') {
        const tgt = nearestEnemy(s.x, s.y, s.last);
        if (tgt) {
          const a = Math.atan2(tgt.y - s.y, tgt.x - s.x);
          const spd = hypot(s.vx, s.vy) || 420;
          s.vx = lerp(s.vx, Math.cos(a) * spd, 1 - Math.exp(-dt * 7));
          s.vy = lerp(s.vy, Math.sin(a) * spd, 1 - Math.exp(-dt * 7));
          const nrm = hypot(s.vx, s.vy) || 1;
          s.vx = (s.vx / nrm) * spd;
          s.vy = (s.vy / nrm) * spd;
        }
        s.zig += dt * 22;
        if (!REDUCE) {
          if (!s.trail) s.trail = [];
          s.trail.push({ x: s.x, y: s.y });
          if (s.trail.length > 7) s.trail.shift();
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -40 || s.y > VH + 40 || s.x < -40 || s.x > VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let k = 0; k < G.enemies.length; k++) {
        const e = G.enemies[k];
        if (!e.alive) continue;
        if (s.last === e && s.kind === 'beam') continue;
        const rr = e.r + (s.r || 3);
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, s.dmg || 1, 'shot');
          if (s.kind === 'beam' && s.pierce > 0) {
            s.pierce -= 1;
            s.last = e;
            if (s.pierce <= 0) hit = true;
          } else {
            hit = true;
          }
          if (s.kind === 'bolt') zap(s.x, s.y, e.x, e.y, CYN);
          if (hit) break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 20 || b.y < -30 || b.x < -20 || b.x > VW + 20) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - G.ship.y;
        const rr = HIT_R + b.r * 0.55;
        if (dx * dx + dy * dy < rr * rr) {
          G.bullets.splice(i, 1);
          diePlayer();
        }
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 18 * dt;
      p.vx *= Math.exp(-dt * 0.6);
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      p.x = clamp(p.x, 18, VW - 18);
      if (p.y > VH + 20) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = p.x - G.ship.x;
        const dy = p.y - G.ship.y;
        if (dx * dx + dy * dy < 26 * 26) {
          collectPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function fireInterval(e) {
    const slow = isDense() ? 0.74 : 1;
    if (e.kind === 'boss') return 0.55 * slow;
    if (e.kind === 'mid') return 0.62 * slow;
    if (e.kind === 'elite') return 0.85 * slow;
    if (e.kind === 'turret') return 1.05 * slow;
    if (e.kind === 'orb') return 1.2 * slow;
    if (e.kind === 'carrier') return 1.15 * slow;
    return 1.35 * slow;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    const spd = bulletSpd();

    if (e.kind === 'boss' || e.kind === 'mid') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, e.kind === 'boss' ? 118 : 108, 1 - Math.exp(-dt * 2.4));
        return;
      }
      e.x = VW * 0.5 + Math.sin(e.t * 0.85 + e.phase) * (e.kind === 'boss' ? 110 : 86);
      e.y = (e.kind === 'boss' ? 118 : 108) + Math.sin(e.t * 1.3) * 10;
      e.spin += dt * (e.form === 'bone' ? 2.4 : 1.6);
      e.fireCd -= dt;
      if (e.fireCd > 0) return;
      const ratio = e.hp / Math.max(1, e.maxHp);
      if (e.kind === 'mid') {
        if (e.form === 'bone') {
          ringFire(e, 8, spd * 0.72, e.spin);
          e.fireCd = fireInterval(e);
        } else if (e.form === 'tats') {
          aimedFire(e, 3, 0.18, spd);
          if (ratio < 0.55) ringFire(e, 8, spd * 0.64, e.spin);
          e.fireCd = fireInterval(e);
        } else {
          aimedFire(e, ratio < 0.5 ? 3 : 1, 0.2, spd);
          e.fireCd = fireInterval(e);
        }
        return;
      }
      if (e.form === 'horn') {
        if (ratio > 0.5) {
          aimedFire(e, 5, 0.14, spd);
          e.fireCd = 0.72 * (isDense() ? 0.78 : 1);
        } else {
          aimedFire(e, 3, 0.16, spd * 1.05);
          ringFire(e, 6, spd * 0.7, e.spin);
          e.fireCd = 0.52 * (isDense() ? 0.78 : 1);
        }
      } else if (e.form === 'bone') {
        if (ratio > 0.5) {
          ringFire(e, 10, spd * 0.76, e.spin);
          e.fireCd = 0.64 * (isDense() ? 0.78 : 1);
        } else {
          ringFire(e, 12, spd * 0.7, e.spin);
          ringFire(e, 8, spd * 0.5, -e.spin * 0.7);
          e.fireCd = 0.5 * (isDense() ? 0.78 : 1);
        }
      } else {
        if (ratio > 0.55) {
          aimedFire(e, 5, 0.15, spd);
          if ((e.pattern++ % 3) === 0) ringFire(e, 8, spd * 0.68, e.spin);
          e.fireCd = 0.58 * (isDense() ? 0.78 : 1);
        } else if (ratio > 0.28) {
          ringFire(e, 12, spd * 0.78, e.spin);
          ringFire(e, 8, spd * 0.58, -e.spin * 0.7);
          aimedFire(e, 3, 0.16, spd * 1.05);
          e.fireCd = 0.46 * (isDense() ? 0.78 : 1);
        } else {
          ringFire(e, 14, spd * 0.8, e.spin);
          aimedFire(e, 5, 0.12, spd * 1.08);
          if ((e.pattern++ % 4) === 0) {
            spawnGrunt(e.x - 40, e.y + 24, -30, 110);
            spawnGrunt(e.x + 40, e.y + 24, 30, 110);
          }
          e.fireCd = 0.4 * (isDense() ? 0.78 : 1);
        }
      }
      return;
    }

    if (e.kind === 'dive') {
      if (e.t > 0.35) {
        e.vy = Math.min(e.vy + 280 * dt, 280 * dens());
        const ax = clamp(G.ship.x - e.x, -140, 140);
        e.vx = lerp(e.vx, ax * 0.9, 1 - Math.exp(-dt * 2));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      return;
    }

    if (e.kind === 'turret') {
      e.y += e.vy * dt;
      e.fireCd -= dt;
      if (e.fireCd <= 0 && e.y > 20 && e.y < VH - 80) {
        aimedFire(e, isDense() ? 2 : 1, 0.12, spd * 0.9);
        e.fireCd = fireInterval(e);
      }
      return;
    }

    if (e.kind === 'orb') {
      e.y += e.vy * dt;
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp;
      e.spin += dt * 3;
      e.fireCd -= dt;
      if (e.fireCd <= 0 && e.y > 30) {
        ringFire(e, 5, spd * 0.62, e.spin);
        e.fireCd = fireInterval(e);
      }
      return;
    }

    e.y += e.vy * dt;
    e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp + e.vx * e.t * 0.15;
    e.fireCd -= dt;
    if (e.fireCd <= 0 && e.y > 24 && e.y < VH - 90) {
      if (e.kind === 'elite') aimedFire(e, 3, 0.18, spd);
      else if (e.kind === 'carrier') aimedFire(e, 1, 0, spd * 0.9);
      else if (Math.random() < (isDense() ? 0.85 : 0.55)) aimedFire(e, 1, 0, spd);
      e.fireCd = fireInterval(e);
    }
  }

  function updateEnemies(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      thinkEnemy(e, dt);
      if (e.y > VH + 40 || e.x < -50 || e.x > VW + 50) {
        if (e.kind !== 'boss' && e.kind !== 'mid') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt && !e.ground) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' || e.kind === 'mid' ? e.r * 0.62 : e.r * 0.7) + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      }
    }
  }

  function updateWaves(dt) {
    if (hasBoss() || hasMid()) return;
    if (G.stageClear) {
      G.gapT += dt;
      if (G.gapT >= 1.6) nextStage();
      return;
    }
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function update(dt) {
    G.t += dt;
    tickAutoFlow(dt);
    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        return;
      }
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.ship.y = VH - 96;
      if (living() < 6 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.45) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 50);
      }
      updateEnemies(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateBullets(dt);
      updatePows(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.bombT > 0) G.bombT -= dt;
    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updatePows(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss() && !hasMid()) G.stageT += dt;
    if (autoOn) autoThink();
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePows(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathTrap(c, x, y, hw, h, peak) {
    c.beginPath();
    c.moveTo(sx(x), sy(y - h * (peak || 0.55)));
    c.lineTo(sx(x + hw), sy(y + h * 0.45));
    c.lineTo(sx(x - hw), sy(y + h * 0.45));
    c.closePath();
  }

  function drawSkullFace(c, x, y, s, rgb, flash) {
    const col = flash ? WHT : rgb;
    c.fillStyle = rgba(col, 0.96);
    c.beginPath();
    c.ellipse(sx(x), sy(y - s * 0.12), s * 0.74 * scale, s * 0.64 * scale, 0, 0, TAU);
    c.fill();
    c.beginPath();
    c.moveTo(sx(x - s * 0.42), sy(y + s * 0.18));
    c.lineTo(sx(x + s * 0.42), sy(y + s * 0.18));
    c.lineTo(sx(x + s * 0.32), sy(y + s * 0.52));
    c.lineTo(sx(x - s * 0.32), sy(y + s * 0.52));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 0.92);
    c.beginPath();
    c.ellipse(sx(x - s * 0.22), sy(y - s * 0.16), s * 0.16 * scale, s * 0.2 * scale, 0, 0, TAU);
    c.ellipse(sx(x + s * 0.22), sy(y - s * 0.16), s * 0.16 * scale, s * 0.2 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(MAG, 0.85);
    c.beginPath();
    c.ellipse(sx(x - s * 0.22), sy(y - s * 0.14), s * 0.07 * scale, s * 0.09 * scale, 0, 0, TAU);
    c.ellipse(sx(x + s * 0.22), sy(y - s * 0.14), s * 0.07 * scale, s * 0.09 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.moveTo(sx(x), sy(y - s * 0.02));
    c.lineTo(sx(x + s * 0.1), sy(y + s * 0.18));
    c.lineTo(sx(x - s * 0.1), sy(y + s * 0.18));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 0.8);
    const teeth = 4;
    for (let i = 0; i < teeth; i++) {
      const tx = x - s * 0.2 + i * (s * 0.14);
      c.fillRect(sx(tx), sy(y + s * 0.3), Math.max(1, s * 0.06 * scale), s * 0.14 * scale);
    }
  }

  function drawHorns(c, x, y, s, rgb) {
    c.fillStyle = rgba(rgb || GOLD, 0.95);
    c.beginPath();
    c.moveTo(sx(x - s * 0.42), sy(y - s * 0.42));
    c.lineTo(sx(x - s * 0.92), sy(y - s * 1.12));
    c.lineTo(sx(x - s * 0.18), sy(y - s * 0.55));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(x + s * 0.42), sy(y - s * 0.42));
    c.lineTo(sx(x + s * 0.92), sy(y - s * 1.12));
    c.lineTo(sx(x + s * 0.18), sy(y - s * 0.55));
    c.closePath();
    c.fill();
  }

  function drawWings(c, x, y, s, rgb) {
    c.fillStyle = rgba(rgb || VIO, 0.88);
    c.beginPath();
    c.moveTo(sx(x - s * 0.2), sy(y));
    c.lineTo(sx(x - s * 1.15), sy(y - s * 0.35));
    c.lineTo(sx(x - s * 0.95), sy(y + s * 0.25));
    c.lineTo(sx(x - s * 0.15), sy(y + s * 0.18));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(x + s * 0.2), sy(y));
    c.lineTo(sx(x + s * 1.15), sy(y - s * 0.35));
    c.lineTo(sx(x + s * 0.95), sy(y + s * 0.25));
    c.lineTo(sx(x + s * 0.15), sy(y + s * 0.18));
    c.closePath();
    c.fill();
  }

  function drawHpBar(e) {
    if (e.kind !== 'boss' && e.kind !== 'mid') return;
    const c = ctx;
    const w = e.kind === 'boss' ? 120 : 86;
    const x = e.x - w * 0.5;
    const y = e.y - e.r - 16;
    c.fillStyle = 'rgba(16,8,28,0.7)';
    c.fillRect(sx(x), sy(y), w * scale, 5 * scale);
    const p = clamp(e.hp / Math.max(1, e.maxHp), 0, 1);
    c.fillStyle = rgba(p < 0.3 ? MAG : p < 0.55 ? GOLD : GRN, 0.9);
    c.fillRect(sx(x), sy(y), w * p * scale, 5 * scale);
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0a0614';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(80), 8 * scale, sx(VW * 0.5), sy(VH * 0.4), 400 * scale);
    g.addColorStop(0, 'rgba(184,107,255,0.16)');
    g.addColorStop(0.55, 'rgba(255,61,184,0.05)');
    g.addColorStop(1, 'rgba(10,6,20,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const biome = stageData().biome;
    const yOff = G.scroll;

    if (biome === 'bone' || G.stage >= 2) {
      for (let col = 0; col < 6; col++) {
        const x = 28 + col * 86;
        const seed = col * 13.7 + G.stage * 9;
        for (let row = -1; row < 10; row++) {
          const y = ((row * 110 - yOff * 0.42) % (110 * 9) + 110 * 9) % (110 * 9) - 40;
          const hgt = 46 + hash(seed + row) * 64;
          c.fillStyle = 'rgba(42,24,48,' + (0.38 + hash(seed + row + 2) * 0.28) + ')';
          c.fillRect(sx(x), sy(y), 18 * scale, hgt * scale);
          c.strokeStyle = 'rgba(232,214,196,0.16)';
          c.lineWidth = Math.max(0.6, 0.8 * scale);
          c.strokeRect(sx(x), sy(y), 18 * scale, hgt * scale);
          c.fillStyle = 'rgba(244,236,255,0.12)';
          c.beginPath();
          c.ellipse(sx(x + 9), sy(y + 8), 7 * scale, 6 * scale, 0, 0, TAU);
          c.fill();
        }
      }
    }

    if (biome === 'core' || G.stage >= 3) {
      c.save();
      c.globalAlpha = 0.18;
      drawHorns(c, VW * 0.5, 90 + Math.sin(G.t * 0.4) * 6, 70, VIO);
      drawSkullFace(c, VW * 0.5, 130 + Math.sin(G.t * 0.4) * 6, 70, VIO, false);
      c.restore();
      const glyphOff = (yOff * 0.3) % 80;
      c.strokeStyle = 'rgba(184,107,255,0.18)';
      c.lineWidth = Math.max(0.7, scale);
      for (let i = -1; i < 12; i++) {
        const y = i * 80 - glyphOff;
        c.beginPath();
        c.arc(sx(48), sy(y + 20), 10 * scale, 0, TAU);
        c.arc(sx(VW - 48), sy(y + 40), 10 * scale, 0, TAU);
        c.stroke();
      }
    }

    if (biome === 'star' || G.stage === 1) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const cx = 70 + i * 110;
        const cy = ((G.scroll * 0.18 + i * 160) % (VH + 80)) - 40;
        c.strokeStyle = 'rgba(122,208,255,0.16)';
        c.lineWidth = Math.max(0.7, scale);
        c.beginPath();
        c.ellipse(sx(cx), sy(cy), 28 * scale, 8 * scale, 0.4, 0, TAU);
        c.stroke();
        c.fillStyle = 'rgba(184,107,255,0.22)';
        c.beginPath();
        c.arc(sx(cx), sy(cy), 4 * scale, 0, TAU);
        c.fill();
      }
      c.restore();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      c.fillStyle = rgba(i % 3 === 0 ? GOLD : i % 3 === 1 ? VIO : CYN, p.a * 0.55);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();

    c.fillStyle = 'rgba(18,8,32,0.55)';
    c.fillRect(sx(0), sy(0), 22 * scale, VH * scale);
    c.fillRect(sx(VW - 22), sy(0), 22 * scale, VH * scale);
    const wallOff = (G.scroll * 0.65) % 28;
    for (let i = -1; i < 28; i++) {
      const y = i * 28 - wallOff;
      c.fillStyle = 'rgba(184,107,255,0.14)';
      c.fillRect(sx(4), sy(y), 12 * scale, 14 * scale);
      c.fillRect(sx(VW - 16), sy(y + 10), 12 * scale, 14 * scale);
    }
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (e.kind === 'boss' ? BONE : e.kind === 'mid' ? VIO : e.kind === 'elite' ? PNK : BONE);
    if (e.kind === 'turret') {
      c.fillStyle = rgba(BONE, 0.85);
      c.fillRect(sx(e.x - 10), sy(e.y - 4), 20 * scale, 16 * scale);
      drawSkullFace(c, e.x, e.y - 4, 13, rgb, flash);
      drawHpBar(e);
      return;
    }
    if (e.kind === 'orb') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(VIO, 0.45);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), (16 + Math.sin(e.spin) * 3) * scale, 0, TAU);
      c.stroke();
      c.restore();
      drawSkullFace(c, e.x, e.y, 12, rgb, flash);
      return;
    }
    if (e.kind === 'dive') {
      drawWings(c, e.x, e.y, 11, MAG);
      drawSkullFace(c, e.x, e.y, 11, rgb, flash);
      return;
    }
    if (e.kind === 'elite' || e.kind === 'mid' || e.kind === 'boss') {
      const s = e.kind === 'boss' ? 36 : e.kind === 'mid' ? 24 : 16;
      drawWings(c, e.x, e.y + 4, s * 0.7, e.kind === 'boss' ? MAG : VIO);
      if (e.form !== 'bone') drawHorns(c, e.x, e.y, s, GOLD);
      else {
        c.strokeStyle = rgba(GOLD, 0.8);
        c.lineWidth = 2 * scale;
        c.beginPath();
        c.arc(sx(e.x), sy(e.y - s * 0.2), s * 0.9 * scale, Math.PI * 1.05, Math.PI * 1.95);
        c.stroke();
      }
      drawSkullFace(c, e.x, e.y, s, rgb, flash);
      if (e.kind === 'boss' || e.kind === 'mid') {
        c.strokeStyle = rgba(GOLD, 0.5);
        c.lineWidth = Math.max(1, 1.2 * scale);
        c.beginPath();
        c.arc(sx(e.x), sy(e.y), (e.r + 6) * scale, 0, TAU);
        c.stroke();
      }
      drawHpBar(e);
      return;
    }
    if (e.kind === 'carrier') {
      c.fillStyle = rgba(VIO, 0.35);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y + 4), 22 * scale, 12 * scale, 0, 0, TAU);
      c.fill();
      drawSkullFace(c, e.x, e.y, 16, rgb, flash);
      c.fillStyle = rgba(GOLD, 0.9);
      c.fillRect(sx(e.x - 5), sy(e.y + 10), 10 * scale, 5 * scale);
      return;
    }
    drawWings(c, e.x, e.y, 10, VIO);
    drawSkullFace(c, e.x, e.y, 11, rgb, flash);
  }

  function drawZig(c, x1, y1, x2, y2, segs, amp) {
    c.beginPath();
    c.moveTo(sx(x1), sy(y1));
    const n = segs || 6;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const nx = -(y2 - y1);
      const ny = x2 - x1;
      const len = hypot(nx, ny) || 1;
      const k = (i % 2 ? 1 : -1) * (amp || 8) * (i === n ? 0 : 1);
      c.lineTo(sx(px + nx / len * k), sy(py + ny / len * k));
    }
    c.stroke();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.kind === 'beam') {
        const h = s.h || 26;
        const w = s.w || 6;
        c.fillStyle = rgba(GRN, 0.22);
        c.fillRect(sx(s.x - w), sy(s.y - h), w * 2 * scale, h * 1.6 * scale);
        c.fillStyle = rgba(WHT, 0.85);
        c.fillRect(sx(s.x - w * 0.28), sy(s.y - h), w * 0.56 * scale, h * 1.6 * scale);
        c.fillStyle = rgba(GRN, 0.95);
        c.fillRect(sx(s.x - w * 0.55), sy(s.y - h * 0.15), w * 1.1 * scale, 8 * scale);
      } else if (s.kind === 'bolt') {
        const zig = Math.sin(s.zig || 0) * 6;
        c.strokeStyle = rgba(CYN, 0.9);
        c.lineWidth = 2.2 * scale;
        if (s.trail && s.trail.length > 1) {
          c.beginPath();
          c.moveTo(sx(s.trail[0].x), sy(s.trail[0].y));
          for (let k = 1; k < s.trail.length; k++) {
            const off = (k % 2 ? 1 : -1) * 5;
            c.lineTo(sx(s.trail[k].x + off), sy(s.trail[k].y));
          }
          c.lineTo(sx(s.x + zig), sy(s.y));
          c.stroke();
        }
        c.fillStyle = rgba(WHT, 0.95);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y), 3.2 * scale, 0, TAU);
        c.fill();
      } else {
        c.fillStyle = rgba(s.rgb || RED, 0.95);
        c.beginPath();
        c.ellipse(sx(s.x), sy(s.y), (s.r || 3) * 0.7 * scale, (s.r || 3) * 1.4 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.8);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y - 2), 1.4 * scale, 0, TAU);
        c.fill();
      }
    }
    c.restore();
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(b.x - 0.6), sy(b.y - 0.6), b.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawPows() {
    const c = ctx;
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = WPN_RGB[p.kind] || GOLD;
      const bob = Math.sin(p.t * 6) * 2;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(rgb, 0.22);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y + bob), 14 * scale, 0, TAU);
      c.fill();
      c.restore();
      drawSkullFace(c, p.x, p.y + bob, 11, p.kind === 'bomb' ? GOLD : BONE, false);
      c.fillStyle = rgba(rgb, 0.95);
      c.font = (9 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(DROP_GLYPH[p.kind] || '红', sx(p.x), sy(p.y + bob + 1));
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    const rgb = wpnRgb();

    if (hasShield()) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const pulse = 0.55 + Math.sin(G.t * 8) * 0.2;
      c.strokeStyle = rgba(RED, pulse * 0.7);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), 22 * scale, 0, TAU);
      c.stroke();
      c.strokeStyle = rgba(GOLD, pulse * 0.5);
      c.beginPath();
      c.arc(sx(x), sy(y), 18 * scale, 0, TAU);
      c.stroke();
      c.strokeStyle = rgba(GRN, pulse * 0.35);
      c.beginPath();
      c.arc(sx(x), sy(y), 15 * scale, 0, TAU);
      c.stroke();
      c.restore();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(rgb, 0.2 + (G.muzzle > 0 ? 0.22 : 0));
    c.beginPath();
    c.ellipse(sx(x), sy(y), 16 * scale, 12 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.55);
    c.beginPath();
    c.moveTo(sx(x - 5), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 5), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(VIO, 0.96);
    pathTrap(c, x, y + 2, 14, 24, 0.68);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.9);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathTrap(c, x, y + 2, 14, 24, 0.68);
    c.stroke();

    c.fillStyle = rgba(WHT, 0.95);
    pathTrap(c, x, y - 2, 5.5, 13, 0.72);
    c.fill();

    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.ellipse(sx(x - 2.2), sy(y - 4), 1.6 * scale, 2 * scale, 0, 0, TAU);
    c.ellipse(sx(x + 2.2), sy(y - 4), 1.6 * scale, 2 * scale, 0, 0, TAU);
    c.fill();

    c.fillStyle = rgba(rgb, 0.9);
    c.fillRect(sx(x - 13), sy(y + 4), 5 * scale, 3 * scale);
    c.fillRect(sx(x + 8), sy(y + 4), 5 * scale, 3 * scale);

    c.fillStyle = rgba(BONE, 0.85);
    c.beginPath();
    c.moveTo(sx(x - 12), sy(y + 2));
    c.lineTo(sx(x - 20), sy(y + 8));
    c.lineTo(sx(x - 10), sy(y + 8));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(x + 12), sy(y + 2));
    c.lineTo(sx(x + 20), sy(y + 8));
    c.lineTo(sx(x + 10), sy(y + 8));
    c.closePath();
    c.fill();

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 16), (5 + G.wpnLv) * scale, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawSkullBomb() {
    if (G.skullT <= 0) return;
    const c = ctx;
    const t = 1 - clamp(G.skullT / 0.62, 0, 1);
    const s = 28 + t * 90;
    c.save();
    c.globalAlpha = (1 - t) * 0.85;
    c.globalCompositeOperation = 'lighter';
    drawHorns(c, G.ship.x, G.ship.y - 10, s, GOLD);
    drawSkullFace(c, G.ship.x, G.ship.y - 8, s, GOLD, true);
    c.restore();
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / 0.4, 0, 1);
      c.fillStyle = rgba(q.rgb, a);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (6 + s.t * 42) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < bolts.length; i++) {
      const z = bolts[i];
      c.strokeStyle = rgba(z.rgb, 1 - z.t);
      c.lineWidth = (2.4 - z.t) * scale;
      drawZig(c, z.x1, z.y1, z.x2, z.y2, 7, 10);
    }
    c.restore();
    if (G.bombFlash > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(GOLD, G.bombFlash * 0.9);
      c.lineWidth = 3 * scale;
      c.beginPath();
      c.arc(sx(G.ship.x), sy(G.ship.y), (30 + (1 - G.bombFlash) * 150) * scale, 0, TAU);
      c.stroke();
      c.restore();
    }
    c.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      c.font = ((f.gold ? 13 : 11) * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#10081c';
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
    ctx.fillStyle = '#10081c';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
    drawPows();
    drawShots();
    drawSkullBomb();
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
      startGame('hunt');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (e.target === speedEl) return;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const space = k === ' ' || k === 'Spacebar' || k === 'Space' || code === 'Space';
    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (space) {
      keys.sht = down && !autoOn;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || isBomb) {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || isBomb)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (autoOn && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S' || isBomb)) {
      return;
    }
    if (isBomb) {
      tryBomb();
      return;
    }
    if (space) {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('hunt');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('dense');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (autoOn) return;
      if (e.button === 2) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (autoOn) return;
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
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
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      audio.ensure();
      tryBomb();
    });
  }

  seedEmbers();
  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();

  if (btnHunt) {
    btnHunt.addEventListener('click', function () {
      audio.ensure();
      startGame('hunt');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'hunt');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && G.kind === 'hunt') startGame('dense');
      else goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  bindBombBtn(btnBomb);
  bindBombBtn(btnPad);
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
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
      keys.sht = false;
    }
  });

  requestAnimationFrame(frame);
})();
