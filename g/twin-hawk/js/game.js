'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const WPN_MAX = 4;
  const BOMB_MAX = 5;
  const BOMB_START = 3;
  const BOMB_R = 64;
  const BEST_KEY = 'playbox-twin-hawk-best';
  const MUTE_KEY = 'playbox-twin-hawk-mute';
  const AUTO_SPEED_KEY = 'playbox-twin-hawk-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '方向 / WASD 移动 · 空格射击 · Shift / Z 投弹 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const LIME = [32, 233, 106];
  const MINT = [124, 255, 176];
  const GOLD = [255, 227, 107];
  const WHT = [232, 255, 244];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const SAND = [210, 180, 110];
  const LAND = [58, 140, 80];
  const WHEAT = [196, 168, 72];
  const RIVER = [28, 110, 92];
  const RUST = [196, 86, 64];
  const ALLY = [80, 210, 120];
  const DIRT = [92, 72, 42];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const SCORE = {
    fighter: 50,
    dive: 80,
    bipe: 120,
    hawk: 160,
    tank: 180,
    barge: 140,
    bunker: 150,
    turret: 160,
    farm: 100,
    carrier: 300,
    mid: 2000,
    boss: 4000,
    clear: 1500,
    all: 8000,
    bombLeft: 400,
    allyOut: 200
  };

  const STAGES = [
    {
      name: '第 1 关 · 麦田',
      biome: 'field',
      mid: '粮仓炮',
      boss: '田野要塞',
      midHp: 42,
      bossHp: 98,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.0, kind: 'tanks' },
        { t: 3.5, kind: 'allies' },
        { t: 5.6, kind: 'stream', dir: 1 },
        { t: 8.0, kind: 'farm' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'carrier' },
        { t: 15.2, kind: 'tanks' },
        { t: 17.6, kind: 'v', n: 7 },
        { t: 20.4, kind: 'mid' },
        { t: 26.0, kind: 'stream', dir: -1 },
        { t: 28.4, kind: 'allies' },
        { t: 28.9, kind: 'tanks' },
        { t: 31.2, kind: 'dive', n: 5 },
        { t: 33.6, kind: 'farm' },
        { t: 36.0, kind: 'bipe' },
        { t: 38.4, kind: 'v', n: 7 },
        { t: 41.0, kind: 'carrier' },
        { t: 43.4, kind: 'tanks' },
        { t: 48.2, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 河湾',
      biome: 'river',
      mid: '趸船',
      boss: '铁桥堡',
      midHp: 54,
      bossHp: 128,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 2.8, kind: 'barges' },
        { t: 5.0, kind: 'tanks' },
        { t: 5.4, kind: 'allies' },
        { t: 7.4, kind: 'dive', n: 5 },
        { t: 9.6, kind: 'turrets' },
        { t: 12.0, kind: 'stream', dir: -1 },
        { t: 14.4, kind: 'barges' },
        { t: 16.8, kind: 'carrier' },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'turrets' },
        { t: 27.0, kind: 'bipe' },
        { t: 29.2, kind: 'dive', n: 6 },
        { t: 31.6, kind: 'tanks' },
        { t: 32.0, kind: 'allies' },
        { t: 34.2, kind: 'v', n: 9 },
        { t: 36.6, kind: 'barges' },
        { t: 39.0, kind: 'turrets' },
        { t: 41.4, kind: 'carrier' },
        { t: 50.2, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 鹰巢',
      biome: 'fort',
      mid: '高炮阵',
      boss: '鹰巢指挥所',
      midHp: 68,
      bossHp: 176,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'tanks' },
        { t: 2.8, kind: 'allies' },
        { t: 4.6, kind: 'hawk' },
        { t: 6.6, kind: 'bunkers' },
        { t: 8.6, kind: 'dive', n: 6 },
        { t: 10.6, kind: 'turrets' },
        { t: 12.8, kind: 'stream', dir: 1 },
        { t: 14.8, kind: 'tanks' },
        { t: 16.8, kind: 'carrier' },
        { t: 19.0, kind: 'mid' },
        { t: 24.8, kind: 'hawk' },
        { t: 26.8, kind: 'dive', n: 7 },
        { t: 29.0, kind: 'bunkers' },
        { t: 31.2, kind: 'tanks' },
        { t: 31.6, kind: 'allies' },
        { t: 33.6, kind: 'turrets' },
        { t: 35.8, kind: 'v', n: 11 },
        { t: 38.0, kind: 'stream', dir: -1 },
        { t: 40.2, kind: 'hawk' },
        { t: 42.4, kind: 'bunkers' },
        { t: 52.4, kind: 'boss' }
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
  const btnDive = document.getElementById('btn-dive');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPadBomb = document.getElementById('btn-pad-bomb');
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
  let bombTok = 0;
  let bombFxTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, bm: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const foam = [];
  const islands = [];
  const wash = [];
  const blasts = [];

  const G = {
    mode: 'title',
    kind: 'dive',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0, bank: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    powLv: 0,
    bombs: BOMB_START,
    ents: [],
    shots: [],
    eShots: [],
    aShots: [],
    nades: [],
    pows: [],
    fireCd: 0,
    fireHold: false,
    bombHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    why: '',
    propT: 0,
    propAng: 0
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = VW * 0.5;
  let autoTy = VH - 90;
  let autoStickS = -1e9;
  let autoOvWait = 0;
  let autoBombCd = 0;

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
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'field';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function plySpd() {
    return (isDense() ? 308 : 272) + G.powLv * 8;
  }
  function scrollSpd() {
    if (hasBig()) return isDense() ? 34 : 26;
    const base = isDense() ? 108 : 78;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isDense() ? 10 : 8);
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function shotCap() {
    return isDense() ? 168 : 112;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
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
      this.beep(680 + G.powLv * 36, 0.042, 'square', 0.028, 1420);
    },
    ping() {
      this.ensure();
      this.beep(1480, 0.04, 'triangle', 0.022, 620);
    },
    drop() {
      this.ensure();
      this.beep(240, 0.08, 'sine', 0.03, 120);
    },
    bomb() {
      this.ensure();
      this.noise(0.2, 0.08, 140);
      this.beep(110, 0.28, 'sawtooth', 0.06, 42);
      this.beep(320, 0.14, 'square', 0.04, 80);
    },
    dry() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.03, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1300);
      this.beep(520 * lift, 0.064, 'square', 0.042, 880 * lift);
    },
    groundHit() {
      this.ensure();
      this.noise(0.07, 0.044, 360);
      this.beep(190, 0.11, 'sawtooth', 0.04, 64);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.11, big ? 0.078 : 0.05, big ? 200 : 420);
      this.beep(big ? 150 : 230, big ? 0.28 : 0.15, 'sawtooth', 0.052, 48);
    },
    friendly() {
      this.ensure();
      this.beep(220, 0.12, 'sawtooth', 0.045, 140);
      this.beep(330, 0.16, 'triangle', 0.035, 90);
      this.noise(0.1, 0.04, 280);
    },
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    prop() {
      this.ensure();
      this.beep(118, 0.028, 'sine', 0.016, 86);
      this.noise(0.022, 0.01, 420);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.058, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 72);
      this.beep(150, 0.32, 'sine', 0.045, 42);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 96);
      this.beep(130, 0.3, 'square', 0.04, 70);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
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
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
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
    if (G.mode !== 'play' || !n) return;
    G.score = Math.max(0, G.score + n);
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (n > 0 && G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    }
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = (n > 0 ? '+' : '') + n;
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
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1350);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function wpnText() {
    if (G.powLv >= WPN_MAX) return '弹 MAX';
    if (G.powLv <= 0) return '弹';
    return '弹 ' + WPN_ROMAN[G.powLv];
  }

  function flashWpn() {
    if (!wpnLabel) return;
    wpnLabel.classList.remove('hot');
    void wpnLabel.offsetWidth;
    wpnLabel.classList.add('hot');
    wpnTok += 1;
    const tok = wpnTok;
    setTimeout(function () {
      if (tok === wpnTok && wpnLabel) wpnLabel.classList.remove('hot');
    }, 280);
  }

  function flashBombs() {
    if (!bombLabel) return;
    bombLabel.classList.remove('hot');
    void bombLabel.offsetWidth;
    bombLabel.classList.add('hot');
    bombTok += 1;
    const tok = bombTok;
    setTimeout(function () {
      if (tok === bombTok && bombLabel) bombLabel.classList.remove('hot');
    }, 280);
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('span');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > n) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const st = STAGES[G.stage - 1];
      stageLabel.textContent = st ? st.name : '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.stage >= 3 || hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密弹' : '俯冲';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) {
      btnBomb.classList.toggle('empty', G.bombs <= 0);
      btnBomb.classList.toggle('held', G.nades.length > 0);
    }
    if (btnPadBomb) btnPadBomb.classList.toggle('held', G.nades.length > 0);
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · 即将再飞 · A 停下', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint('双鹰凯旋 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格扫空 · Shift 投弹', 'warn');
    else if (G.bombs <= 0) setHint('爆弹用尽 · 吃 爆 补弹 · 空弹打不穿坦克', 'warn');
    else setHint('空格打飞机 · Shift 投弹炸坦克 · 友军坦克别误炸 · A 自动', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'HAWK';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const start = kind === 'title';
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', start);
    if (btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else if (kind === 'win') btnOvModes.textContent = isDense() ? '换模式' : '密弹';
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
    const cls = mag >= 6.5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
      }
    }, 360);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function boardBomb() {
    if (!stageEl || REDUCE) return;
    bombFxTok += 1;
    stageEl.classList.remove('bomb');
    void stageEl.offsetWidth;
    stageEl.classList.add('bomb');
    const tok = bombFxTok;
    setTimeout(function () {
      if (tok === bombFxTok && stageEl) stageEl.classList.remove('bomb');
    }, 240);
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
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 44);
    capArr(rings, 28);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.9 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -86 : -70
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -190 * p, vx1: 190 * p, vy0: -240 * p, vy1: 100 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.18 + p * 0.14);
    kick(2.2 + p * 2.6);
  }

  function seedWorld() {
    foam.length = 0;
    islands.length = 0;
    for (let i = 0; i < 52; i++) {
      foam.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.4, 1.3),
        a: rand(0.12, 0.5),
        w: rand(8, 22)
      });
    }
    for (let i = 0; i < 8; i++) {
      islands.push({
        x: hash2(i * 17 + 3) * VW,
        y: -40 - i * 100,
        w: 28 + hash2(i * 9) * 56,
        h: 18 + hash2(i * 13) * 28,
        kind: hash2(i * 5)
      });
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
        const tok = comboTok;
        setTimeout(function () {
          if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
        }, 280);
      }
    }
    G.mult = next;
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function spawnEnt(spec) {
    if (G.ents.length > 60) return null;
    const en = {
      type: spec.type,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      hp: spec.hp,
      maxHp: spec.hp,
      r: spec.r,
      t: 0,
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.28, 1.05),
      score: spec.score,
      drop: spec.drop || false,
      rgb: spec.rgb,
      ang: spec.ang || 0,
      flash: 0,
      ground: !!spec.ground,
      ally: !!spec.ally,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      spin: spec.spin || 0,
      meleeCd: 0
    };
    G.ents.push(en);
    return en;
  }

  function spawnFighter(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'fighter',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 98,
      hp: 1, r: 10, score: SCORE.fighter,
      rgb: extra.rgb || MAG,
      dive: extra.dive,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.9, 2.4)
    });
  }

  function spawnV(n, xmid) {
    n = n || 7;
    xmid = xmid == null ? VW * 0.5 + rand(-36, 36) : xmid;
    const gapX = 26;
    const gapY = 20;
    const y0 = -24;
    spawnFighter(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnFighter(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnFighter(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnFighter(side + rand(-8, 8), -20 - i * 24, {
        vx: dir * -78,
        vy: 122,
        rgb: PNK,
        fireCd: rand(0.7, 1.6)
      });
    }
  }

  function spawnDive(n) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i + 0.5) * ((VW - 100) / n) + rand(-16, 16);
      spawnEnt({
        type: 'dive',
        x: x, y: -30 - i * 16,
        vx: 0, vy: 64,
        hp: 1, r: 10, score: SCORE.dive,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnBipe() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'bipe',
      x: left ? -28 : VW + 28,
      y: rand(70, 180),
      vx: left ? 96 : -96,
      vy: 26,
      hp: 3, r: 16, score: SCORE.bipe,
      rgb: PNK,
      w: 34, h: 22,
      fireCd: rand(0.4, 0.9),
      phase: left ? 1 : -1
    });
  }

  function spawnHawk() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'hawk',
      x: left ? -36 : VW + 36,
      y: rand(64, 150),
      vx: left ? 72 : -72,
      vy: 22,
      hp: 5, r: 20, score: SCORE.hawk,
      rgb: RED,
      w: 46, h: 24,
      fireCd: rand(0.35, 0.8),
      phase: left ? 1 : -1,
      drop: Math.random() < 0.4
    });
  }

  function spawnTank(x, ally) {
    spawnEnt({
      type: ally ? 'ally' : 'tank',
      x: x == null ? rand(70, VW - 70) : x,
      y: -28,
      vx: ally ? rand(-22, 22) : rand(-36, 36),
      vy: 0,
      hp: ally ? 4 : 5,
      r: 16,
      score: ally ? 0 : SCORE.tank,
      rgb: ally ? ALLY : RUST,
      ground: true,
      ally: !!ally,
      drop: ally ? false : (Math.random() < 0.28 ? 'bomb' : false),
      w: 30, h: 18,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnTanks() {
    const n = isDense() ? 3 : 2;
    for (let i = 0; i < n; i++) spawnTank();
  }

  function spawnAllies() {
    const n = isDense() ? 2 : 2;
    for (let i = 0; i < n; i++) {
      const x = 80 + i * ((VW - 160) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnTank(clamp(x, 56, VW - 56), true);
    }
  }

  function spawnBarge(x) {
    spawnEnt({
      type: 'barge',
      x: x == null ? rand(60, VW - 60) : x,
      y: -32,
      vx: rand(-20, 20),
      vy: 0,
      hp: 4, r: 18, score: SCORE.barge,
      rgb: RIVER,
      ground: true,
      drop: Math.random() < 0.24 ? 'bomb' : false,
      w: 40, h: 16,
      fireCd: rand(0.5, 1.15)
    });
  }

  function spawnBarges() {
    const n = isDense() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      spawnBarge(70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-20, 20));
    }
  }

  function spawnFarm(x) {
    spawnEnt({
      type: 'farm',
      x: x == null ? rand(70, VW - 70) : x,
      y: -30,
      vx: 0, vy: 0,
      hp: 4, r: 18, score: SCORE.farm,
      rgb: WHEAT,
      ground: true,
      drop: Math.random() < 0.3 ? 'bomb' : false,
      w: 34, h: 22,
      fireCd: rand(0.7, 1.4)
    });
  }

  function spawnFarms() {
    const n = isDense() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 72 + i * ((VW - 144) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnFarm(clamp(x, 50, VW - 50));
    }
  }

  function spawnBunker(x) {
    spawnEnt({
      type: 'bunker',
      x: x == null ? rand(60, VW - 60) : x,
      y: -26,
      vx: 0, vy: 0,
      hp: 7, r: 18, score: SCORE.bunker,
      rgb: SAND,
      ground: true,
      drop: Math.random() < 0.3 ? 'bomb' : false,
      w: 32, h: 20,
      fireCd: rand(0.6, 1.3)
    });
  }

  function spawnBunkers() {
    const n = isDense() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 64 + i * ((VW - 128) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnBunker(clamp(x, 48, VW - 48));
    }
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 4, r: 12, score: SCORE.turret,
      rgb: GOLD,
      ground: true,
      w: 22, h: 18,
      fireCd: rand(0.4, 1.1)
    });
  }

  function spawnTurretWave() {
    const n = isDense() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnTurret(clamp(x, 40, VW - 40), -24 - i * 16);
    }
  }

  function spawnCarrier() {
    spawnEnt({
      type: 'carrier',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 78,
      hp: 2, r: 13, score: SCORE.carrier,
      rgb: GOLD,
      drop: 'shot',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = stageInfo();
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -60,
      vx: 56,
      vy: 46,
      hp: hp,
      r: 34,
      score: SCORE.mid,
      rgb: st.biome === 'river' ? RIVER : LAND,
      drop: 'shot',
      ground: true,
      w: 76,
      h: 36,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(LIME, 0.36);
    kick(4.6);
  }

  function spawnBoss() {
    if (hasBig()) return;
    const st = stageInfo();
    const hp = Math.round(st.bossHp * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -74,
      vx: 64,
      vy: 42,
      hp: hp,
      r: 46,
      score: SCORE.boss + G.stage * SCORE.clear,
      rgb: MAG,
      drop: 'bomb',
      ground: true,
      w: 102,
      h: 48,
      fireCd: 0.55,
      phase: 0,
      spin: 0
    });
    toast(st.boss, false, true);
    audio.boss();
    screenFlash(MAG, 0.42);
    kick(5.4);
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'mid' || t === 'boss') && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function findBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if ((e.type === 'mid' || e.type === 'boss') && e.hp > 0) return e;
    }
    return null;
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'tanks') spawnTanks();
    else if (w.kind === 'allies') spawnAllies();
    else if (w.kind === 'barges') spawnBarges();
    else if (w.kind === 'farm') spawnFarms();
    else if (w.kind === 'bunkers') spawnBunkers();
    else if (w.kind === 'turrets') spawnTurretWave();
    else if (w.kind === 'bipe') spawnBipe();
    else if (w.kind === 'hawk') spawnHawk();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38),
      kind: kind === 'bomb' ? 'bomb' : 'shot'
    });
    capArr(G.pows, 8);
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.05,
      rgb: rgb || MAG
    });
  }

  function aShot(x, y, vx, vy) {
    if (G.aShots.length > 48) return;
    G.aShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: 2.8,
      rgb: ALLY
    });
  }

  function aimShot(x, y, spd, rgb, r) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = hypot(dx, dy) || 1;
    eShot(x, y, dx / len * spd, dy / len * spd, rgb, r);
  }

  function ringShot(x, y, n, spd, rot, rgb, r) {
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r);
    }
  }

  function addShot(spec) {
    if (G.shots.length > 48) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      dmg: spec.dmg || 1
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.powLv;
    const x = G.player.x;
    const y = G.player.y - 16;
    G.muzzle = 0.05;
    G.fireCd = 0.11 - lv * 0.011;
    const spd = -700;
    const rgb = lv >= 3 ? GOLD : lv >= 1 ? MINT : WHT;
    function fan(ox, oy, vx, vy) {
      addShot({ x: x + ox, y: y + oy, vx: vx || 0, vy: vy == null ? spd : vy, r: 3.15, rgb: rgb, dmg: 1 });
    }
    if (lv <= 0) {
      fan(0, 0);
    } else if (lv === 1) {
      fan(-7, 2);
      fan(7, 2);
    } else if (lv === 2) {
      fan(-11, 3, -70, spd);
      fan(0, -2);
      fan(11, 3, 70, spd);
    } else if (lv === 3) {
      fan(-16, 5, -120, spd);
      fan(-7, 1, -40, spd);
      fan(0, -3);
      fan(7, 1, 40, spd);
      fan(16, 5, 120, spd);
    } else {
      fan(-18, 6, -150, spd);
      fan(-11, 2, -80, spd);
      fan(-4, -1);
      fan(0, -4);
      fan(4, -1);
      fan(11, 2, 80, spd);
      fan(18, 6, 150, spd);
    }
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: rgb,
      g: 0
    });
  }

  function dropBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (overlayOpen()) return;
    if (G.bombs <= 0) {
      toast('爆弹用尽', true);
      audio.dry();
      syncHud();
      return;
    }
    G.bombs -= 1;
    G.nades.push({
      x: G.player.x,
      y: G.player.y + 10,
      vy: 340,
      t: 0,
      fuse: 0.34,
      r: 8
    });
    capArr(G.nades, 6);
    audio.drop();
    emit(6, {
      x: G.player.x, y: G.player.y + 8, j: 4,
      vx0: -50, vx1: 50, vy0: 40, vy1: 160,
      life: 0.18, r0: 1.2, r1: 2.6, rgb: GOLD, g: 80
    });
    flashBombs();
    syncHud();
  }

  function detonate(b) {
    blasts.push({ x: b.x, y: b.y, t: 0, life: 0.34, r: BOMB_R });
    capArr(blasts, 10);
    juice(b.x, b.y, GOLD, 1.85);
    emit(16, {
      x: b.x, y: b.y, j: 12,
      vx0: -160, vx1: 160, vy0: -90, vy1: 70,
      life: 0.38, r0: 1.6, r1: 4.2, rgb: SAND, g: 240
    });
    emit(8, {
      x: b.x, y: b.y, j: 8,
      vx0: -80, vx1: 80, vy0: -140, vy1: -20,
      life: 0.3, r0: 1.2, r1: 3, rgb: LIME, g: 60
    });
    screenFlash(LIME, 0.52);
    hitStop(0.056);
    kick(5.5);
    boardBomb();
    audio.bomb();
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0 || !en.ground) continue;
      const dx = en.x - b.x;
      const dy = en.y - b.y;
      const rr = BOMB_R + en.r;
      if (dx * dx + dy * dy < rr * rr) {
        hurtEnt(en, 4, b.x, b.y, true);
      }
    }
  }

  function hurtEnt(en, dmg, hx, hy, fromBomb) {
    if (en.hp <= 0) return;
    if (en.ally) {
      en.hp -= dmg || 1;
      en.flash = 0.08;
      if (en.hp > 0) {
        emit(4, {
          x: hx, y: hy, j: 4,
          vx0: -80, vx1: 80, vy0: -90, vy1: 40,
          life: 0.16, r0: 1, r1: 2, rgb: ALLY, g: 200
        });
        return;
      }
      killAlly(en, !!fromBomb);
      return;
    }
    en.hp -= dmg || 1;
    en.flash = 0.08;
    if (en.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -80, vx1: 80, vy0: -90, vy1: 40,
        life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
      });
      if (en.type === 'boss' || en.type === 'mid') hitStop(0.032);
      return;
    }
    killEnt(en);
  }

  function killAlly(en, byPlayer) {
    if (en.hp < -90) return;
    en.hp = -99;
    juice(en.x, en.y, ALLY, 1.05);
    audio.groundHit();
    if (byPlayer) {
      breakCombo();
      addScore(-500);
      toast('误炸友军', true);
      floatText(en.x, en.y - 10, '误炸', MAG, false);
      audio.friendly();
      hitStop(0.048);
    } else {
      toast('友军被毁', true);
      floatText(en.x, en.y - 8, '友军', MAG, false);
    }
  }

  function killEnt(en) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.ground ? 1.25 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    if (en.ground) {
      audio.groundHit();
      emit(10, {
        x: en.x, y: en.y, j: 8,
        vx0: -120, vx1: 120, vy0: -80, vy1: 40,
        life: 0.32, r0: 1.4, r1: 3.4, rgb: SAND, g: 280
      });
    } else {
      audio.hit(G.combo);
    }
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'shot' || en.drop === 'p') spawnPow(en.x, en.y, 'shot');
    else if (en.drop === 'bomb') spawnPow(en.x, en.y, 'bomb');
    else if (en.drop === true) spawnPow(en.x, en.y, Math.random() < 0.45 ? 'bomb' : 'shot');
    else if ((en.type === 'tank' || en.type === 'bunker' || en.type === 'farm') && Math.random() < 0.2) {
      spawnPow(en.x, en.y, 'bomb');
    }
    if (en.type === 'boss') {
      G.stageClearT = 2.1;
      addScore(SCORE.clear * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      const st = STAGES[G.stage - 1];
      toast(st ? st.name.replace(/^第 \d 关 · /, '') + '肃清' : '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_MAX) {
        G.bombs += 1;
        toast(G.bombs >= BOMB_MAX ? '爆 MAX' : '爆弹 +1', false, true);
      } else {
        addScore(400 * G.mult);
        toast('+400', false, true);
      }
      flashBombs();
      juice(p.x, p.y, GOLD, 1.15);
      audio.pow();
      hitStop(0.038);
      floatText(p.x, p.y, '爆', GOLD, true);
    } else {
      if (G.powLv < WPN_MAX) {
        G.powLv += 1;
        toast(G.powLv >= WPN_MAX ? '弹 MAX' : '机枪加宽', false, true);
      } else if (G.bombs < BOMB_MAX) {
        G.bombs += 1;
        toast('爆弹 +1', false, true);
        flashBombs();
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
      flashWpn();
      juice(p.x, p.y, LIME, 1.15);
      audio.pow();
      hitStop(0.038);
      floatText(p.x, p.y, '弹', GOLD, true);
    }
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
    }
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.powLv > 0) spawnPow(G.player.x, G.player.y - 18, 'shot');
    G.powLv = 0;
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    autoTx = G.player.x;
    autoTy = G.player.y;
    autoStickS = -1e9;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '机毁了';
    saveBest();
    audio.lose();
    showOverlay('lose', '机毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(SCORE.all);
    if (G.bombs > 0) addScore(G.bombs * SCORE.bombLeft);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '双鹰凯旋', (isDense() ? '密弹通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingAir() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground) n += 1;
    }
    return n;
  }

  function nearestEnemyGround(from) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0 || !en.ground || en.ally) continue;
      if (en === from) continue;
      const dx = en.x - from.x;
      const dy = en.y - from.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = en;
      }
    }
    return best;
  }

  function diveThink() {
    if (G.stageClearT > 0 || hasBig()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function denseThink(dt) {
    if (hasBig() || G.stageClearT > 0) return;
    const st = STAGES[G.stage - 1];
    if (st) {
      while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t * 0.86) {
        fireWave(st.waves[G.waveI]);
        G.waveI += 1;
      }
    }
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = clamp(1.48 / (1 + G.stage * 0.12), 0.4, 1.48);
    if (livingAir() > 24) return;
    const r = Math.random();
    if (r < 0.2) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.34) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.46) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.58) spawnTanks();
    else if (r < 0.66) spawnAllies();
    else if (r < 0.76) spawnTurretWave();
    else if (r < 0.84) spawnBunkers();
    else if (r < 0.9) spawnBipe();
    else if (r < 0.96) spawnHawk();
    else spawnCarrier();
  }

  function bossFire(en, dense) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += dense ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, dense ? 210 : 176, LIME);
      eShot(en.x - 18, en.y + 10, -46, 186, PNK);
      eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      if (mid) ringShot(en.x, en.y, dense ? 10 : 8, 150, en.spin, GOLD, 3.2);
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 214, MAG);
      eShot(en.x - 28, en.y + 12, -50, 196, RED);
      eShot(en.x + 28, en.y + 12, 50, 196, RED);
      if (mid) ringShot(en.x, en.y + 6, dense ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, dense ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, dense ? 10 : 8, 118, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 16, 200, ORG);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, dense ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, dense ? 10 : 8, 108, -en.spin * 0.7, LIME, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 210, PNK);
        aimShot(en.x + 20, en.y + 14, 210, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, dense ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (dense) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0;
    const dense = isDense();
    const scr = scrollSpd();

    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.meleeCd > 0) en.meleeCd -= dt;
      if (en.ground && en.type !== 'mid' && en.type !== 'boss') {
        en.y += scr * dt;
        if (en.type === 'tank' || en.type === 'ally' || en.type === 'barge') {
          en.x += en.vx * dt;
          const pad = en.type === 'barge' ? 50 : 40;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < (en.type === 'boss' ? 108 : 124)) en.y += en.vy * dt;
        else {
          en.y = en.type === 'boss' ? 108 : 124;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 92 : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'carrier') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'bipe' || en.type === 'hawk') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 5) * 16 * dt;
        if (en.x > 80 && en.x < VW - 80) en.vx *= Math.exp(-dt * 0.32);
        en.spin += dt * 16;
      } else if (en.type === 'dive') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 178;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'fighter') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 92, dt * 2);
          en.vy = Math.max(en.vy, 154);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -72 || en.x > VW + 72 || (en.ground && en.y > VH + 42)) {
        if (en.ally && en.hp > 0 && playing && en.y > VH) {
          addScore(SCORE.allyOut);
          floatText(en.x, VH - 28, '突围', GOLD, true);
        }
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && (en.type === 'tank' || en.type === 'ally') && en.meleeCd <= 0) {
        const other = en.ally ? 'tank' : 'ally';
        for (let k = 0; k < G.ents.length; k++) {
          const ot = G.ents[k];
          if (ot.hp <= 0 || ot.type !== other) continue;
          const dx = ot.x - en.x;
          const dy = ot.y - en.y;
          const rr = en.r + ot.r - 4;
          if (dx * dx + dy * dy < rr * rr) {
            en.meleeCd = 0.42;
            hurtEnt(ot, 1, ot.x, ot.y, false);
            break;
          }
        }
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'fighter' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, dense ? 198 : 172, MAG);
            if (dense && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (dense ? 1.3 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'bipe' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, dense ? 196 : 164, PNK);
            eShot(en.x - 10, en.y + 6, -28, 150, MAG);
            eShot(en.x + 10, en.y + 6, 28, 150, MAG);
            en.fireCd = dense ? 0.72 : 1.08;
          } else if (en.type === 'hawk' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x - 12, en.y + 6, dense ? 200 : 170, RED);
            aimShot(en.x + 12, en.y + 6, dense ? 200 : 170, RED);
            eShot(en.x, en.y + 10, 0, 188, ORG);
            en.fireCd = dense ? 0.62 : 0.92;
          } else if (en.type === 'barge' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 188 : 156, RIVER);
            en.fireCd = (dense ? 0.72 : 1.08) + rand(0, 0.22);
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 218 : 176, GOLD);
            if (dense) {
              eShot(en.x - 8, en.y + 4, -42, 164, ORG);
              eShot(en.x + 8, en.y + 4, 42, 164, ORG);
            }
            en.fireCd = (dense ? 0.62 : 1.02) + rand(0, 0.24);
          } else if (en.type === 'tank' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 204 : 168, ORG);
            if (dense && Math.random() < 0.5) {
              eShot(en.x - 6, en.y + 4, -30, 150, SAND);
              eShot(en.x + 6, en.y + 4, 30, 150, SAND);
            }
            en.fireCd = dense ? 0.62 : 0.96;
          } else if (en.type === 'ally' && en.y > 8 && en.y < VH - 70) {
            const tgt = nearestEnemyGround(en);
            if (tgt) {
              const dx = tgt.x - en.x;
              const dy = tgt.y - en.y;
              const len = hypot(dx, dy) || 1;
              aShot(en.x, en.y, dx / len * 150, dy / len * 150);
            }
            en.fireCd = 0.7;
          } else if (en.type === 'farm' && en.y > 8 && en.y < VH - 70) {
            eShot(en.x - 8, en.y, -22, 160, WHEAT);
            eShot(en.x + 8, en.y, 22, 160, WHEAT);
            en.fireCd = dense ? 0.86 : 1.22;
          } else if (en.type === 'bunker' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 210 : 170, SAND);
            eShot(en.x - 12, en.y + 4, -48, 154, GOLD);
            eShot(en.x + 12, en.y + 4, 48, 154, GOLD);
            en.fireCd = dense ? 0.7 : 1.12;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, dense);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt && !en.ground) {
        const rr = en.r + 4.6;
        const dx = en.x - px;
        const dy = en.y - py;
        if (dx * dx + dy * dy < rr * rr) {
          if (!inv) killPlayer();
        }
      }
    }
  }

  function updateShots(dt) {
    const playing = G.mode === 'play';
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -22 || s.x < -16 || s.x > VW + 16 || s.y > VH + 24) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy >= rr * rr) continue;
        if (en.ground) {
          popSpark(s.x, s.y, SAND, 8);
          if (G.t - (G.pingT || 0) > 0.045) {
            G.pingT = G.t;
            audio.ping();
          }
          hit = true;
          break;
        }
        hurtEnt(en, s.dmg || 1, s.x, s.y, false);
        hit = true;
        break;
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y > VH + 22 || s.y < -32 || s.x < -22 || s.x > VW + 22) {
        G.eShots.splice(i, 1);
        continue;
      }
      let eaten = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (!en.ally || en.hp <= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, 1, s.x, s.y, false);
          eaten = true;
          break;
        }
      }
      if (eaten) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = s.x - G.player.x;
        const dy = s.y - (G.player.y - 2);
        const rr = 4.6 + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          G.eShots.splice(i, 1);
          killPlayer();
        }
      }
    }

    for (let i = G.aShots.length - 1; i >= 0; i--) {
      const s = G.aShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y > VH + 22 || s.y < -32 || s.x < -22 || s.x > VW + 22) {
        G.aShots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0 || !en.ground || en.ally) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, 1, s.x, s.y, false);
          hit = true;
          break;
        }
      }
      if (hit) G.aShots.splice(i, 1);
    }
  }

  function updateNades(dt) {
    for (let i = G.nades.length - 1; i >= 0; i--) {
      const b = G.nades[i];
      b.t += dt;
      b.y += b.vy * dt;
      b.vy += 420 * dt;
      let boom = b.t >= b.fuse || b.y > VH - 18;
      if (!boom) {
        for (let j = 0; j < G.ents.length; j++) {
          const en = G.ents[j];
          if (en.hp <= 0 || !en.ground) continue;
          const dx = en.x - b.x;
          const dy = en.y - b.y;
          const rr = en.r + b.r;
          if (dx * dx + dy * dy < rr * rr) {
            boom = true;
            break;
          }
        }
      }
      if (boom) {
        detonate(b);
        G.nades.splice(i, 1);
      }
    }
    for (let i = blasts.length - 1; i >= 0; i--) {
      blasts[i].t += dt;
      if (blasts[i].t >= blasts[i].life) blasts.splice(i, 1);
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.15);
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH + 22) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = p.x - G.player.x;
        const dy = p.y - G.player.y;
        if (dx * dx + dy * dy < 24 * 24) {
          pickPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < foam.length; i++) {
      const s = foam[i];
      s.y += scr * 0.55 * s.z * dt;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < islands.length; i++) {
      const isl = islands[i];
      isl.y += scr * dt;
      if (isl.y - isl.h > VH + 30) {
        isl.y = -60 - rand(0, 80);
        isl.x = hash2((G.scroll + isl.w) | 0) * VW;
        isl.w = 28 + hash2((G.scroll * 0.1) | 0) * 56;
        isl.h = 18 + hash2((G.scroll * 0.13) | 0) * 28;
        isl.kind = hash2(G.scroll | 0);
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      wash.push({
        x: G.player.x + rand(-10, 10),
        y: G.player.y + 12,
        t: 0,
        r: rand(4, 8)
      });
      capArr(wash, 18);
    }
    for (let i = wash.length - 1; i >= 0; i--) {
      wash[i].t += dt * 2.4;
      wash[i].y += 36 * dt;
      if (wash[i].t >= 1) wash.splice(i, 1);
    }
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
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) G.toastT -= dt;
  }

  function tickProp(dt) {
    G.propAng += dt * (REDUCE ? 8 : 28);
    G.propT -= dt;
    if (G.propT > 0) return;
    G.propT = G.mode === 'play' && G.deadT <= 0 ? 0.07 : 0.13;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.prop();
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.sht = false;
    keys.bm = false;
    pointer.down = false;
    G.fireHold = false;
    G.bombHold = false;
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
    autoTx = G.player.x;
    autoTy = G.player.y;
    autoStickS = -1e9;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('dive');
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
        startGame('dive');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'dive');
      }
    }
  }

  function autoDanger(x, y, look) {
    let d = 0;
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const relx = s.x - x;
      const rely = s.y - y;
      const vv = s.vx * s.vx + s.vy * s.vy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * s.vx + rely * s.vy) / vv, 0, look);
      const dist = hypot(relx + s.vx * t, rely + s.vy * t);
      const rad = 5.4 + s.r;
      if (t <= look && dist < rad + 28) {
        const soon = (look - t) / Math.max(0.08, look);
        d += Math.max(0.5, rad + 12 - dist) * soon * 24;
        if (dist < rad) d += 220 * soon;
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.hp <= 0 || e.ground) continue;
      const evx = e.vx || 0;
      const evy = e.vy || 0;
      const relx = e.x - x;
      const rely = e.y - y;
      const vv = evx * evx + evy * evy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * evx + rely * evy) / vv, 0, look);
      const dist = hypot(relx + evx * t, rely + evy * t);
      const hitR = 5.2 + e.r;
      if (dist < hitR + 26) {
        const soon = (look - t) / Math.max(0.08, look);
        const w = e.dive || e.type === 'dive' ? 34 : e.type === 'hawk' ? 22 : 16;
        d += Math.max(0.4, hitR + 14 - dist) * soon * w;
        if (dist < hitR) d += 260 * soon;
      }
      if (hypot(e.x - x, e.y - y) < hitR + 8) d += 120;
    }
    return d;
  }

  function autoAllyInBlast(bx, by) {
    const rr = BOMB_R + 18;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.hp <= 0 || !e.ally) continue;
      const dx = e.x - bx;
      const dy = e.y - by;
      if (dx * dx + dy * dy < (rr + e.r) * (rr + e.r)) return true;
    }
    return false;
  }

  function autoThink(dt) {
    if (autoBombCd > 0) autoBombCd -= dt;
    if (G.mode !== 'play' || G.deadT > 0) {
      G.fireHold = false;
      return;
    }
    G.fireHold = true;

    const px = G.player.x;
    const py = G.player.y;
    const horizon = isDense() ? 0.58 : 0.48;
    const big = findBig();
    let aimX = null;
    let aimY = null;
    let aimW = -1e9;
    let groundX = null;
    let groundY = null;
    let groundW = -1e9;
    let groundN = 0;
    let airN = 0;
    let pick = null;
    let pickW = -1e9;

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.hp <= 0) continue;
      if (e.ground) {
        if (e.ally) continue;
        if (e.y < -20 || e.y > VH + 20) continue;
        groundN += 1;
        let w = e.hp * 8 + 20;
        if (e.type === 'mid' || e.type === 'boss') w += 220;
        else if (e.type === 'tank' || e.type === 'bunker' || e.type === 'turret') w += 50;
        w -= Math.abs(e.x - px) * 0.22;
        w -= Math.abs(e.y - (py + 130)) * 0.12;
        if (e.y > py - 8 && e.y < py + 200) w += 28;
        if (w > groundW) {
          groundW = w;
          groundX = e.x;
          groundY = e.y;
        }
      } else {
        if (e.y < -36 || e.y > VH + 10) continue;
        airN += 1;
        let w = 30 + e.hp * 10;
        if (e.type === 'carrier') w += 110;
        else if (e.type === 'hawk') w += 70;
        else if (e.type === 'bipe') w += 48;
        else if (e.type === 'dive') w += 40;
        if (e.y < py) w += 24;
        w -= Math.abs(e.x - px) * 0.28;
        w -= Math.max(0, py - e.y) * 0.04;
        if (e.y > py + 8) w -= 40;
        if (w > aimW) {
          aimW = w;
          aimX = e.x;
          aimY = e.y;
        }
      }
    }

    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      let w = 80 - hypot(p.x - px, p.y - py) * 0.45;
      if (p.kind === 'shot' && G.powLv < WPN_MAX) w += 55;
      else if (p.kind === 'bomb' && G.bombs < BOMB_MAX) w += 42;
      else w += 10;
      if (p.y > py - 40) w += 18;
      if (w > pickW) {
        pickW = w;
        pick = p;
      }
    }

    const hereDang = autoDanger(px, py, horizon);
    const grabPick = pick && (
      G.invuln > 0.18
      || autoDanger(pick.x, pick.y, 0.3) < 40
      || hypot(pick.x - px, pick.y - py) < 52
    );

    let desiredX = VW * 0.5;
    let desiredY = VH - 108;
    if (aimX != null) {
      desiredX = aimX;
      desiredY = clamp(aimY + 96, 90, VH - 70);
      if (aimY > py - 30) desiredY = clamp(aimY + 70, 80, VH - 50);
    }
    if (big) {
      desiredX = lerp(desiredX, big.x, 0.55);
      if (G.bombs > 0 && Math.abs(px - big.x) < 90) desiredY = Math.min(desiredY, 52);
    }
    if (groundX != null && G.bombs > 0) {
      const bombY = clamp(groundY - 118, 48, VH - 70);
      const canStation = !autoAllyInBlast(groundX, groundY);
      if (canStation && (groundN >= 1 || big)) {
        desiredX = lerp(desiredX, groundX, 0.78);
        desiredY = bombY;
      }
    }
    if (hereDang > 80) desiredY = Math.min(VH - 48, desiredY + 36);
    if (airN >= 7) desiredY = Math.max(desiredY, VH - 90);
    if (grabPick) {
      desiredX = pick.x;
      desiredY = pick.y;
    }

    const xMin = 28;
    const xMax = VW - 28;
    const yMin = 44;
    const yMax = VH - 32;
    let bestX = clamp(autoTx, xMin, xMax);
    let bestY = clamp(autoTy, yMin, yMax);
    let bestS = -1e15;

    function consider(x, y) {
      x = clamp(x, xMin, xMax);
      y = clamp(y, yMin, yMax);
      let s = -autoDanger(x, y, horizon) * (isDense() ? 7.4 : 6.1);
      s -= Math.abs(x - desiredX) * 0.55;
      s -= Math.abs(y - desiredY) * 0.42;
      s -= hypot(x - px, y - py) * 0.14;
      if (x < 40 || x > VW - 40) s -= 18;
      if (y < 56 || y > VH - 48) s -= 12;
      if (grabPick) s -= hypot(x - pick.x, y - pick.y) * 0.62;
      if (aimX != null) s -= Math.abs(x - aimX) * 0.28;
      if (s > bestS) {
        bestS = s;
        bestX = x;
        bestY = y;
      }
    }

    consider(px, py);
    consider(autoTx, autoTy);
    consider(desiredX, desiredY);
    for (let ix = 0; ix < 7; ix++) {
      const x = 40 + ix * ((VW - 80) / 6);
      for (let iy = 0; iy < 6; iy++) {
        consider(x, 70 + iy * ((VH - 110) / 5));
      }
    }
    if (aimX != null) {
      consider(aimX, desiredY);
      consider(aimX, py);
      consider(px, desiredY);
    }
    if (groundX != null) consider(groundX, clamp(groundY - 132, yMin, yMax));
    if (big) consider(big.x, 50);
    if (grabPick) consider(pick.x, pick.y);

    const switchGap = hereDang > 52 ? 7 : 20;
    if (bestS > autoStickS + switchGap || hereDang > 58 || hypot(autoTx - px, autoTy - py) < 4) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    if (G.bombs > 0 && G.nades.length === 0 && autoBombCd <= 0) {
      let hits = 0;
      let hitHp = 0;
      let hitBig = false;
      let allyHit = false;
      let blastX = px;
      let blastY = py + 140;
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.hp <= 0 || !e.ground) continue;
        const fall = e.y - py;
        if (fall < -22 || fall > 210) continue;
        const rr = BOMB_R + e.r;
        if (Math.abs(e.x - px) > rr * 0.92) continue;
        if (e.ally) {
          allyHit = true;
          continue;
        }
        hits += 1;
        hitHp += e.hp;
        blastY = e.y;
        blastX = e.x;
        if (e.type === 'mid' || e.type === 'boss') hitBig = true;
      }
      const aligned = groundX == null || Math.abs(px - groundX) < 34 || (big && Math.abs(px - big.x) < 40);
      const topBomb = big && py < 90 && Math.abs(px - big.x) < 44;
      const want = hitBig || topBomb || hits >= 1;
      if (want && aligned && !allyHit && !autoAllyInBlast(blastX, blastY) && (hereDang < 160 || hitBig || hits >= 2)) {
        dropBomb();
        autoBombCd = hitBig ? 0.38 : 0.52;
      }
    }
  }

  function updatePlayer(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = plySpd();
    let dx = 0;
    let dy = 0;
    if (autoOn) {
      const ax = autoTx - G.player.x;
      const ay = autoTy - G.player.y;
      const d = hypot(ax, ay);
      const boost = autoSpeed >= 4 ? 1.22 : autoSpeed >= 3 ? 1.06 : autoSpeed <= 1 ? 0.86 : 0.96;
      const max = spd * dt * boost;
      if (d > 1.2) {
        const k = Math.min(1, max / d);
        G.player.vx = ax * k / Math.max(dt, 0.0001);
        G.player.vy = ay * k / Math.max(dt, 0.0001);
        G.player.x += ax * k;
        G.player.y += ay * k;
      } else {
        G.player.vx *= Math.exp(-dt * 10);
        G.player.vy *= Math.exp(-dt * 10);
      }
      G.player.x = clamp(G.player.x, 22, VW - 22);
      G.player.y = clamp(G.player.y, 40, VH - 28);
      const wantBank = clamp(G.player.vx * 0.0018, -0.28, 0.28);
      G.player.bank = lerp(G.player.bank || 0, wantBank, 1 - Math.exp(-dt * 10));
      return;
    }
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (dx || dy) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
      G.player.vx = dx * spd;
      G.player.vy = dy * spd;
      inputSrc = 'key';
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      G.player.x = lerp(G.player.x, tx, 1 - Math.exp(-dt * 16));
      G.player.y = lerp(G.player.y, ty, 1 - Math.exp(-dt * 16));
      G.player.vx = 0;
      G.player.vy = 0;
    } else {
      G.player.vx *= Math.exp(-dt * 10);
      G.player.vy *= Math.exp(-dt * 10);
    }
    G.player.x += G.player.vx * dt;
    G.player.y += G.player.vy * dt;
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 40, VH - 28);
    const wantBank = clamp(G.player.vx * 0.0018, -0.28, 0.28);
    G.player.bank = lerp(G.player.bank || 0, wantBank, 1 - Math.exp(-dt * 10));
  }

  function update(dt) {
    G.t += dt;
    tickAutoFlow(dt);
    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        tickProp(dt * 0.35);
        return;
      }
    }
    updateFx(dt);
    tickProp(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.player.bank = Math.sin(G.t * 0.7) * 0.12;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingAir() < 8) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.spawnT = 2.5;
      }
      updateEnts(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    G.clock += dt;
    if (!hasBig()) G.stageT += dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseGame();
          return;
        }
        respawn();
      }
    }

    if (G.stageClearT > 0) {
      G.stageClearT -= dt;
      if (G.stageClearT <= 0) {
        if (G.stage >= 3) {
          winGame();
          return;
        }
        G.stage += 1;
        G.stageT = 0;
        G.waveI = 0;
        G.invuln = Math.max(G.invuln, 0.85);
        if (G.bombs < BOMB_MAX) G.bombs += 1;
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isDense()) denseThink(dt);
    else diveThink();

    updateEnts(dt);
    updateShots(dt);
    updateNades(dt);
    updatePows(dt);
  }

  function drawIsland(isl, bio) {
    const x = sx(isl.x);
    const y = sy(isl.y);
    const w = isl.w * scale;
    const h = isl.h * scale;
    ctx.save();
    if (bio === 'field') {
      ctx.fillStyle = 'rgba(42, 58, 22, 0.92)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.48, h * 0.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHEAT, 0.42);
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.08, w * 0.28, h * 0.18, 0, 0, TAU);
      ctx.fill();
    } else if (bio === 'river') {
      ctx.fillStyle = 'rgba(22, 48, 36, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.5, h * 0.38, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(SAND, 0.4);
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.1, w * 0.38, h * 0.16, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(28, 36, 24, 0.92)';
      ctx.fillRect(x - w * 0.4, y - h * 0.28, w * 0.8, h * 0.55);
      ctx.strokeStyle = rgba(LIME, 0.22);
      ctx.lineWidth = 1;
      ctx.strokeRect(x - w * 0.4, y - h * 0.28, w * 0.8, h * 0.55);
    }
    ctx.restore();
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'field') {
      g.addColorStop(0, '#0c1c10');
      g.addColorStop(0.5, '#0a1810');
      g.addColorStop(1, '#06140c');
    } else if (bio === 'river') {
      g.addColorStop(0, '#082018');
      g.addColorStop(0.45, '#061c16');
      g.addColorStop(0.72, '#0a2018');
      g.addColorStop(1, '#061410');
    } else {
      g.addColorStop(0, '#0a1610');
      g.addColorStop(0.5, '#08140e');
      g.addColorStop(1, '#04120c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (bio === 'field') {
      ctx.save();
      const off = (G.scroll * 0.7) % 22;
      for (let i = -1; i < 38; i++) {
        const yy = sy(i * 22 - off);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(70, 96, 32, 0.22)' : 'rgba(48, 70, 24, 0.16)';
        ctx.fillRect(sx(0), yy, VW * scale, 11 * scale);
      }
      ctx.strokeStyle = 'rgba(70, 52, 28, 0.55)';
      ctx.lineWidth = 12 * scale;
      const roadX = sx(VW * 0.5 + Math.sin(G.scroll * 0.004) * 48);
      ctx.beginPath();
      ctx.moveTo(roadX, sy(-10));
      ctx.lineTo(roadX, sy(VH + 10));
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.2);
      ctx.lineWidth = 1.4 * scale;
      ctx.setLineDash([8 * scale, 12 * scale]);
      ctx.lineDashOffset = -G.scroll * scale * 0.4;
      ctx.beginPath();
      ctx.moveTo(roadX, sy(-10));
      ctx.lineTo(roadX, sy(VH + 10));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (bio === 'river') {
      ctx.save();
      ctx.fillStyle = 'rgba(18, 72, 64, 0.55)';
      ctx.beginPath();
      const rw = 78 * scale;
      ctx.moveTo(sx(VW * 0.5 - 70), sy(-8));
      for (let y = 0; y <= VH + 20; y += 16) {
        const wob = Math.sin((y + G.scroll) * 0.018) * 36;
        ctx.lineTo(sx(VW * 0.5 + wob - 70), sy(y));
      }
      for (let y = VH + 20; y >= -8; y -= 16) {
        const wob = Math.sin((y + G.scroll) * 0.018) * 36;
        ctx.lineTo(sx(VW * 0.5 + wob + 70), sy(y));
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(LIME, 0.14);
      ctx.lineWidth = 1;
      const off = (G.scroll * 0.4) % 24;
      for (let i = -1; i < 34; i++) {
        const yy = sy(i * 24 - off);
        ctx.beginPath();
        for (let x = 0; x <= VW; x += 16) {
          const wob = Math.sin((x + G.scroll * 0.5) * 0.04 + i) * 3;
          if (x === 0) ctx.moveTo(sx(x), yy + wob * scale);
          else ctx.lineTo(sx(x), yy + wob * scale);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.strokeStyle = 'rgba(48, 64, 42, 0.7)';
      ctx.lineWidth = 28 * scale;
      const ax = sx(VW * 0.5);
      ctx.beginPath();
      ctx.moveTo(ax, sy(-10));
      ctx.lineTo(ax, sy(VH + 10));
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.22);
      ctx.lineWidth = 1.6 * scale;
      ctx.setLineDash([14 * scale, 16 * scale]);
      ctx.lineDashOffset = -G.scroll * scale * 0.45;
      ctx.beginPath();
      ctx.moveTo(ax, sy(-10));
      ctx.lineTo(ax, sy(VH + 10));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    for (let i = 0; i < foam.length; i++) {
      const s = foam[i];
      if (bio === 'river') {
        ctx.fillStyle = rgba(WHT, s.a * 0.35);
        ctx.fillRect(sx(s.x), sy(s.y), s.w * 0.35 * scale, 1.3 * scale);
      } else {
        ctx.fillStyle = rgba(bio === 'fort' ? DIRT : WHEAT, s.a * 0.32);
        ctx.fillRect(sx(s.x), sy(s.y), 2.2 * scale, 2.2 * scale);
      }
    }

    for (let i = 0; i < islands.length; i++) drawIsland(islands[i], bio);

    for (let i = 0; i < wash.length; i++) {
      const w = wash[i];
      ctx.strokeStyle = rgba(LIME, (1 - w.t) * 0.22);
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), w.r * (0.5 + w.t) * scale, w.r * 0.28 * scale, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawBiplane(x, y, a, enemy, flashHit, bank) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(enemy ? Math.PI : (bank || 0));
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    const flash = flashHit || (!enemy && G.muzzle > 0);
    const body = enemy ? MAG : LIME;
    ctx.shadowColor = rgba(body, 0.55);
    ctx.shadowBlur = 12;
    ctx.strokeStyle = rgba(body, 0.95);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(16, -4);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-13, 5);
    ctx.lineTo(13, 5);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-7, 5);
    ctx.moveTo(8, -4);
    ctx.lineTo(7, 5);
    ctx.stroke();
    ctx.fillStyle = flash ? '#e8fff4' : rgba(body, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(3.4, -6);
    ctx.lineTo(3.2, 10);
    ctx.lineTo(0, 16);
    ctx.lineTo(-3.2, 10);
    ctx.lineTo(-3.4, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.78);
    ctx.beginPath();
    ctx.ellipse(0, -8, 2.2, 3.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(-15.5, -6, 5, 3);
    ctx.fillRect(10.5, -6, 5, 3);
    ctx.strokeStyle = rgba(MINT, 0.75);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-5, 12);
    ctx.lineTo(-8, 16);
    ctx.moveTo(5, 12);
    ctx.lineTo(8, 16);
    ctx.stroke();
    const ra = enemy ? G.t * 22 : G.propAng;
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ra) * 7, -18 + Math.sin(ra) * 2.2);
    ctx.lineTo(Math.cos(ra + Math.PI) * 7, -18 + Math.sin(ra + Math.PI) * 2.2);
    ctx.stroke();
    if (!enemy && G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(-2.4, -18);
      ctx.lineTo(0, -28);
      ctx.lineTo(2.4, -18);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.5);
    ctx.shadowBlur = 10;
    if (en.ground) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(1, 8, en.w * 0.42, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.shadowBlur = 10;
    }
    if (en.type === 'fighter' || en.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.lineTo(9, 1);
      ctx.lineTo(3, 1);
      ctx.lineTo(2.2, -10);
      ctx.lineTo(-2.2, -10);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-9, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-1.1, -2, 2.2, 7);
    } else if (en.type === 'bipe') {
      ctx.restore();
      drawBiplane(en.x, en.y, 1, true, flash, 0);
      return;
    } else if (en.type === 'hawk') {
      ctx.strokeStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();
      ctx.fillRect(-4, -10, 8, 22);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-16, -3, 6, 4);
      ctx.fillRect(10, -3, 6, 4);
    } else if (en.type === 'barge') {
      ctx.beginPath();
      ctx.moveTo(-20, -4);
      ctx.lineTo(20, -4);
      ctx.lineTo(16, 10);
      ctx.lineTo(-16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.22);
      ctx.fillRect(-8, -2, 16, 6);
    } else if (en.type === 'turret') {
      const dx = G.player.x - en.x;
      const dy = G.player.y - en.y;
      ctx.fillStyle = 'rgba(28, 40, 28, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, TAU);
      ctx.fill();
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillRect(4, -2.1, 14, 4.2);
    } else if (en.type === 'tank' || en.type === 'ally') {
      ctx.fillRect(-16, -6, 32, 14);
      ctx.fillRect(-18, 6, 10, 5);
      ctx.fillRect(8, 6, 10, 5);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-8, -3, 16, 5);
      if (en.ally) {
        ctx.fillStyle = rgba(WHT, 0.9);
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(2.2, -4);
        ctx.lineTo(8, -4);
        ctx.lineTo(3.4, 0);
        ctx.lineTo(5.2, 6);
        ctx.lineTo(0, 2.4);
        ctx.lineTo(-5.2, 6);
        ctx.lineTo(-3.4, 0);
        ctx.lineTo(-8, -4);
        ctx.lineTo(-2.2, -4);
        ctx.closePath();
        ctx.fill();
      }
      const aim = en.ally ? nearestEnemyGround(en) : null;
      const ax = en.ally ? (aim ? aim.x : en.x) : G.player.x;
      const ay = en.ally ? (aim ? aim.y : en.y - 20) : G.player.y;
      ctx.fillStyle = flash ? '#fff' : rgba(en.ally ? GOLD : ORG, 0.9);
      ctx.save();
      ctx.rotate(Math.atan2(ay - en.y, ax - en.x));
      ctx.fillRect(4, -1.6, 12, 3.2);
      ctx.restore();
    } else if (en.type === 'farm') {
      ctx.fillRect(-14, -4, 28, 14);
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(0, -16);
      ctx.lineTo(16, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(RUST, 0.9);
      ctx.fillRect(6, -18, 6, 16);
    } else if (en.type === 'bunker') {
      ctx.fillRect(-16, -6, 32, 16);
      ctx.fillStyle = 'rgba(18, 28, 22, 0.9)';
      ctx.fillRect(-12, -2, 8, 6);
      ctx.fillRect(4, -2, 8, 6);
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.8);
      ctx.fillRect(-2, -10, 4, 10);
    } else if (en.type === 'carrier') {
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 2);
      ctx.lineTo(3, 2);
      ctx.lineTo(2, 12);
      ctx.lineTo(-2, 12);
      ctx.lineTo(-3, 2);
      ctx.lineTo(-8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#04140c';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('弹', 0, 1);
    } else if (en.type === 'mid') {
      if (biome() === 'river') {
        ctx.beginPath();
        ctx.ellipse(0, 2, 40, 15, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-34, -8, 14, 22);
        ctx.fillRect(20, -8, 14, 22);
      } else if (biome() === 'field') {
        ctx.fillRect(-16, -20, 12, 34);
        ctx.fillRect(-28, 4, 56, 14);
        ctx.beginPath();
        ctx.moveTo(-20, -8);
        ctx.lineTo(-10, -22);
        ctx.lineTo(0, -8);
        ctx.fill();
      } else {
        ctx.fillRect(-36, -8, 18, 22);
        ctx.fillRect(18, -8, 18, 22);
        ctx.fillRect(-22, 6, 44, 12);
      }
      ctx.fillStyle = rgba(GOLD, 0.65);
      ctx.fillRect(-8, -2, 16, 8);
    } else if (en.type === 'boss') {
      if (G.stage === 1) {
        ctx.fillRect(-50, -8, 100, 26);
        ctx.fillRect(-18, -22, 36, 16);
        ctx.fillRect(-40, 14, 16, 10);
        ctx.fillRect(24, 14, 16, 10);
        ctx.fillRect(-8, -28, 8, 18);
      } else if (G.stage === 2) {
        ctx.fillRect(-52, -6, 104, 16);
        ctx.fillRect(-18, -20, 36, 18);
        ctx.fillRect(-46, 10, 20, 12);
        ctx.fillRect(26, 10, 20, 12);
      } else {
        ctx.fillRect(-52, -12, 104, 34);
        ctx.fillRect(-24, -28, 48, 18);
        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.lineTo(10, -20);
        ctx.lineTo(-10, -20);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-46, 16, 16, 12);
        ctx.fillRect(30, 16, 16, 12);
      }
      ctx.fillStyle = rgba(GOLD, 0.72);
      ctx.fillRect(-24, 0, 8, 8);
      ctx.fillRect(16, 0, 8, 8);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-30, -2, 60, 7);
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = 9 * scale;
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 7), 2.8 * scale, 13 * scale);
      if (!REDUCE) {
        ctx.globalAlpha = 0.32;
        ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 11 * scale);
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.75);
      ctx.shadowBlur = 7 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.beginPath();
      ctx.arc(sx(s.x - 0.6), sy(s.y - 0.6), s.r * 0.35 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < G.aShots.length; i++) {
      const s = G.aShots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.7);
      ctx.shadowBlur = 6 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawNades() {
    for (let i = 0; i < G.nades.length; i++) {
      const b = G.nades[i];
      ctx.save();
      ctx.translate(sx(b.x), sy(b.y));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.shadowColor = rgba(GOLD, 0.8);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(RUST, 0.9);
      ctx.fillRect(-1.4, -10, 2.8, 6);
      ctx.restore();
    }
    for (let i = 0; i < blasts.length; i++) {
      const b = blasts[i];
      const t = b.t / b.life;
      const rad = b.r * (0.35 + t * 0.75);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      const grd = ctx.createRadialGradient(sx(b.x), sy(b.y), 2 * scale, sx(b.x), sy(b.y), rad * scale);
      grd.addColorStop(0, rgba(WHT, 0.9));
      grd.addColorStop(0.35, rgba(GOLD, 0.7));
      grd.addColorStop(1, rgba(LIME, 0));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), rad * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      const bomb = p.kind === 'bomb';
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 2.2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(bomb ? GOLD : LIME, 0.95);
      ctx.shadowColor = rgba(bomb ? GOLD : LIME, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#04140c';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText(bomb ? '爆' : '弹', 0, 1);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.6, p.r * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = 3 * (1 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = rgba(f.rgb, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0) {
        boss = G.ents[i];
        if (t === 'boss') break;
      }
    }
    if (!boss) return;
    const x = 40;
    const y = 16;
    const w = VW - 80;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : LIME, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : LIME, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#04140c';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (!REDUCE && G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = W * 0.5;
      const cy = H * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawWorld();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawNades();
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawBiplane(G.player.x, G.player.y, 1, false, false, G.player.bank);
    }
    drawFloats();
    drawBossBar();
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

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.aShots.length = 0;
    G.nades.length = 0;
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wash.length = 0;
    blasts.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'dense' ? 'dense' : 'dive';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.powLv = 0;
    G.bombs = BOMB_START;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    autoTx = G.player.x;
    autoTy = G.player.y;
    autoStickS = -1e9;
    autoOvWait = 0;
    autoBombCd = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.bombHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnT = 0.7;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.propT = 0;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isDense() ? '密弹 · 对空更密' : '俯冲 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'dive';
    G.stage = 1;
    G.lives = LIVES;
    G.powLv = 0;
    G.bombs = BOMB_START;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '双鹰',
      '双翼俯冲。空格扫空，Shift 投弹炸坦克军舰。友军坦克在地上并肩打，别误炸。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('dive');
    else startGame(G.kind || 'dive');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('dive');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('dense');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isDense()) goTitle();
      else startGame('dense');
    }
  }

  function tryBomb() {
    audio.ensure();
    if (autoOn) return;
    if (overlayOpen()) return;
    if (G.mode === 'play') dropBomb();
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
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const bombKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';

    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
    }

    if (down && (isMove || space || bombKey || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space && !autoOn) G.fireHold = false;
      if (bombKey) G.bombHold = false;
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
    if (autoOn && (isMove || space || bombKey)) return;
    if (k === '1') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '2') {
      if (overlayOpen()) secondaryAction();
      return;
    }
    if (bombKey) {
      if (!G.bombHold) {
        G.bombHold = true;
        tryBomb();
      }
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play' && !autoOn) G.fireHold = true;
        return;
      }
      if (G.mode === 'play' && !autoOn) {
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
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (autoOn) return;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (autoOn) return;
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

  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();

  if (btnDive) {
    btnDive.addEventListener('click', function () {
      audio.ensure();
      startGame('dive');
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
      startGame(G.kind);
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && isDense()) goTitle();
      else if (G.mode === 'win') startGame('dense');
      else goTitle();
    });
  }
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    });
  }
  if (btnRetry) {
    btnRetry.addEventListener('click', function () {
      restart();
    });
  }
  if (btnBomb) {
    btnBomb.addEventListener('click', function () {
      tryBomb();
    });
  }
  if (btnPadBomb) {
    btnPadBomb.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      tryBomb();
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) last = 0;
  });
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  requestAnimationFrame(frame);
})();
