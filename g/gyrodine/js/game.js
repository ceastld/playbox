'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const WPN_MAX = 4;
  const BOMB_MAX = 5;
  const BOMB_START = 3;
  const BOMB_R = 68;
  const BEST_KEY = 'playbox-gyrodine-best';
  const MUTE_KEY = 'playbox-gyrodine-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 投弹 · R 重开 · M 静音';
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
  const RUST = [196, 86, 64];
  const STEEL = [88, 128, 118];
  const CORE = [90, 220, 170];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const SCORE = {
    jet: 50,
    dive: 80,
    copter: 120,
    gyro: 160,
    tank: 180,
    fort: 150,
    turret: 160,
    silo: 140,
    carrier: 300,
    mid: 2000,
    boss: 4000,
    clear: 1500,
    all: 8000,
    bombLeft: 400
  };

  const STAGES = [
    {
      name: '第 1 关 · 丘堡',
      biome: 'hill',
      mid: '丘炮',
      boss: '堡门',
      midHp: 40,
      bossHp: 96,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.0, kind: 'forts' },
        { t: 5.4, kind: 'stream', dir: 1 },
        { t: 7.8, kind: 'tanks' },
        { t: 10.2, kind: 'dive', n: 4 },
        { t: 12.6, kind: 'carrier' },
        { t: 14.8, kind: 'turrets' },
        { t: 17.2, kind: 'v', n: 7 },
        { t: 19.8, kind: 'mid' },
        { t: 25.4, kind: 'copter' },
        { t: 27.6, kind: 'forts' },
        { t: 30.0, kind: 'stream', dir: -1 },
        { t: 32.4, kind: 'tanks' },
        { t: 34.8, kind: 'gyro' },
        { t: 37.2, kind: 'dive', n: 5 },
        { t: 39.6, kind: 'carrier' },
        { t: 42.0, kind: 'silos' },
        { t: 47.6, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 钢峡',
      biome: 'gorge',
      mid: '峡塔',
      boss: '钢堡',
      midHp: 54,
      bossHp: 128,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 2.8, kind: 'tanks' },
        { t: 5.0, kind: 'forts' },
        { t: 7.2, kind: 'dive', n: 5 },
        { t: 9.4, kind: 'copter' },
        { t: 11.6, kind: 'turrets' },
        { t: 13.8, kind: 'stream', dir: -1 },
        { t: 16.0, kind: 'silos' },
        { t: 18.4, kind: 'carrier' },
        { t: 20.6, kind: 'mid' },
        { t: 26.2, kind: 'gyro' },
        { t: 28.4, kind: 'tanks' },
        { t: 30.6, kind: 'dive', n: 6 },
        { t: 32.8, kind: 'forts' },
        { t: 35.0, kind: 'copter' },
        { t: 37.2, kind: 'v', n: 9 },
        { t: 39.4, kind: 'turrets' },
        { t: 41.6, kind: 'carrier' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 旋核',
      biome: 'core',
      mid: '核环',
      boss: '旋核',
      midHp: 68,
      bossHp: 176,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'gyro' },
        { t: 4.4, kind: 'forts' },
        { t: 6.4, kind: 'dive', n: 6 },
        { t: 8.4, kind: 'copter' },
        { t: 10.4, kind: 'turrets' },
        { t: 12.4, kind: 'stream', dir: 1 },
        { t: 14.4, kind: 'tanks' },
        { t: 16.4, kind: 'silos' },
        { t: 18.4, kind: 'carrier' },
        { t: 20.4, kind: 'mid' },
        { t: 26.0, kind: 'gyro' },
        { t: 28.0, kind: 'dive', n: 7 },
        { t: 30.0, kind: 'forts' },
        { t: 32.0, kind: 'copter' },
        { t: 34.0, kind: 'turrets' },
        { t: 36.0, kind: 'v', n: 11 },
        { t: 38.0, kind: 'stream', dir: -1 },
        { t: 40.0, kind: 'tanks' },
        { t: 42.0, kind: 'carrier' },
        { t: 52.2, kind: 'boss' }
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
  const btnGyro = document.getElementById('btn-gyro');
  const btnRain = document.getElementById('btn-rain');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const dust = [];
  const cliffs = [];
  const wash = [];

  const G = {
    mode: 'title',
    kind: 'gyro',
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
    pows: [],
    drops: [],
    fireCd: 0,
    fireHold: false,
    bombHold: false,
    podCd: 0,
    chipCd: 0,
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
    rotorT: 0,
    rotorAng: 0,
    gyroAng: 0
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
  function isRain() {
    return G.kind === 'rain';
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'hill';
  }
  function plySpd() {
    return (isRain() ? 308 : 270) + G.powLv * 8;
  }
  function scrollSpd() {
    if (hasBig()) return isRain() ? 34 : 28;
    const base = isRain() ? 110 : 80;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isRain() ? 10 : 8);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isRain() ? 168 : 112;
  }
  function podCount() {
    if (G.powLv <= 0) return 0;
    if (G.powLv === 1) return 1;
    if (G.powLv >= 4) return 3;
    return 2;
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
      this.beep(740 + G.powLv * 42, 0.046, 'square', 0.03, 1520);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.034, 1280);
      this.beep(560 * lift, 0.066, 'square', 0.044, 940 * lift);
    },
    chip() {
      this.ensure();
      this.beep(880, 0.03, 'triangle', 0.018, 420);
    },
    groundHit() {
      this.ensure();
      this.noise(0.06, 0.042, 420);
      this.beep(210, 0.1, 'sawtooth', 0.04, 70);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.12, big ? 0.078 : 0.05, big ? 200 : 440);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.16, 'sawtooth', 0.052, 48);
    },
    bomb() {
      this.ensure();
      this.noise(0.16, 0.06, 280);
      this.beep(180, 0.2, 'sawtooth', 0.05, 56);
      this.beep(420, 0.1, 'triangle', 0.03, 180);
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
    rotor() {
      this.ensure();
      this.noise(0.028, 0.015, 150);
      this.beep(76, 0.034, 'sine', 0.018, 50);
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
    },
    empty() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.028, 90);
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
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
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
    scoreAdd.textContent = '+' + n;
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
    if (G.powLv >= WPN_MAX) return '旋 MAX';
    if (G.powLv <= 0) return '旋';
    return '旋 ' + WPN_ROMAN[G.powLv];
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

  function syncBombsUi() {
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.classList.toggle('empty', G.bombs <= 0);
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
      tagLabel.textContent = isRain() ? '谷雨' : '旋空';
      tagLabel.classList.toggle('warn', isRain());
      tagLabel.classList.toggle('hot', !isRain() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    syncBombsUi();
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint('旋空肃清 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空打机群，投弹炸碉', 'warn');
    else setHint('空格旋弹打空 · Shift 投弹炸碉 · 撞机扣命 · R 重开', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GYRO';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind !== 'title' && btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else btnOvModes.textContent = isRain() ? '换模式' : '谷雨';
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
    dust.length = 0;
    cliffs.length = 0;
    wash.length = 0;
    for (let i = 0; i < 56; i++) {
      dust.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.25),
        a: rand(0.1, 0.46),
        w: rand(6, 18)
      });
    }
    for (let i = 0; i < 10; i++) {
      cliffs.push({
        side: i % 2 === 0 ? -1 : 1,
        y: -40 - i * 86,
        w: 46 + hash2(i * 11) * 28,
        h: 70 + hash2(i * 7) * 40,
        k: hash2(i * 3)
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
    if (G.ents.length > 58) return null;
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
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      spin: spec.spin || 0
    };
    G.ents.push(en);
    return en;
  }

  function spawnJet(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'jet',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 98,
      hp: 1, r: 10, score: SCORE.jet,
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
    spawnJet(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnJet(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnJet(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnJet(side + rand(-8, 8), -20 - i * 24, {
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

  function spawnCopter() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'copter',
      x: left ? -28 : VW + 28,
      y: rand(70, 180),
      vx: left ? 96 : -96,
      vy: 26,
      hp: 3, r: 16, score: SCORE.copter,
      rgb: MINT,
      w: 34, h: 22,
      fireCd: rand(0.4, 0.9),
      phase: left ? 1 : -1
    });
  }

  function spawnGyro() {
    spawnEnt({
      type: 'gyro',
      x: VW * 0.5 + rand(-80, 80),
      y: -36,
      vx: rand(-40, 40),
      vy: 72,
      hp: 4, r: 18, score: SCORE.gyro,
      rgb: CORE,
      w: 32, h: 32,
      fireCd: rand(0.5, 0.9),
      spin: rand(0, TAU)
    });
  }

  function spawnTank(x) {
    spawnEnt({
      type: 'tank',
      x: x == null ? rand(90, VW - 90) : x,
      y: -28,
      vx: rand(-34, 34),
      vy: 0,
      hp: 5, r: 16, score: SCORE.tank,
      rgb: ORG,
      ground: true,
      drop: Math.random() < 0.2 ? 'bomb' : false,
      w: 30, h: 18,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnTanks() {
    const n = isRain() ? 3 : 2;
    for (let i = 0; i < n; i++) spawnTank();
  }

  function spawnFort(x) {
    spawnEnt({
      type: 'fort',
      x: x == null ? rand(80, VW - 80) : x,
      y: -28,
      vx: 0, vy: 0,
      hp: 8, r: 20, score: SCORE.fort,
      rgb: SAND,
      ground: true,
      drop: Math.random() < 0.3 ? 'bomb' : false,
      w: 36, h: 22,
      fireCd: rand(0.55, 1.2)
    });
  }

  function spawnForts() {
    const n = isRain() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 80 + i * ((VW - 160) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnFort(clamp(x, 70, VW - 70));
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
    const n = isRain() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const x = 80 + i * ((VW - 160) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnTurret(clamp(x, 60, VW - 60), -24 - i * 16);
    }
  }

  function spawnSilo(x) {
    spawnEnt({
      type: 'silo',
      x: x == null ? rand(90, VW - 90) : x,
      y: -30,
      vx: 0, vy: 0,
      hp: 6, r: 16, score: SCORE.silo,
      rgb: RUST,
      ground: true,
      drop: Math.random() < 0.24 ? 'spin' : false,
      w: 26, h: 24,
      fireCd: rand(0.7, 1.4)
    });
  }

  function spawnSilos() {
    const n = isRain() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      spawnSilo(90 + i * ((VW - 180) / Math.max(1, n - 1)) + rand(-14, 14));
    }
  }

  function spawnCarrier() {
    spawnEnt({
      type: 'carrier',
      x: Math.random() < 0.5 ? 64 : VW - 64,
      y: -26,
      vx: 0, vy: 78,
      hp: 2, r: 13, score: SCORE.carrier,
      rgb: GOLD,
      drop: 'spin',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function hpMul() {
    return isRain() ? 1.22 : 1;
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -60,
      vx: 54,
      vy: 46,
      hp: hp,
      r: 36,
      score: SCORE.mid,
      rgb: STEEL,
      drop: 'spin',
      ground: true,
      w: 80,
      h: 38,
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
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.bossHp * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -78,
      vx: 62,
      vy: 42,
      hp: hp,
      r: 48,
      score: SCORE.boss + G.stage * SCORE.clear,
      rgb: MAG,
      drop: 'spin',
      ground: true,
      w: 108,
      h: 52,
      fireCd: 0.52,
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

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'tanks') spawnTanks();
    else if (w.kind === 'forts') spawnForts();
    else if (w.kind === 'turrets') spawnTurretWave();
    else if (w.kind === 'silos') spawnSilos();
    else if (w.kind === 'copter') spawnCopter();
    else if (w.kind === 'gyro') spawnGyro();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38),
      kind: kind || 'spin'
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
    if (G.shots.length > 56) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      dmg: spec.dmg == null ? 1 : spec.dmg,
      groundDmg: spec.groundDmg == null ? 0.4 : spec.groundDmg,
      t: 0,
      wob: spec.wob == null ? rand(0, TAU) : spec.wob,
      corkscrew: spec.corkscrew !== false
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
      addShot({
        x: x + ox, y: y + oy,
        vx: vx || 0,
        vy: vy == null ? spd : vy,
        r: 3.2, rgb: rgb, dmg: 1, groundDmg: 0.4
      });
    }
    if (lv <= 0) {
      fan(-5, 2);
      fan(5, 2);
    } else if (lv === 1) {
      fan(-8, 2);
      fan(8, 2);
    } else if (lv === 2) {
      fan(-12, 3, -64, spd);
      fan(0, -2);
      fan(12, 3, 64, spd);
    } else if (lv === 3) {
      fan(-16, 5, -118, spd);
      fan(-7, 1, -38, spd);
      fan(0, -3);
      fan(7, 1, 38, spd);
      fan(16, 5, 118, spd);
    } else {
      fan(-18, 6, -148, spd);
      fan(-11, 2, -78, spd);
      fan(-4, -1);
      fan(0, -4);
      fan(4, -1);
      fan(11, 2, 78, spd);
      fan(18, 6, 148, spd);
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

  function firePods() {
    const n = podCount();
    if (n <= 0 || G.mode !== 'play' || G.deadT > 0) return;
    if (G.podCd > 0) return;
    G.podCd = 0.2;
    const rgb = GOLD;
    for (let i = 0; i < n; i++) {
      const a = G.gyroAng + (i * TAU) / n;
      const px = G.player.x + Math.cos(a) * 40;
      const py = G.player.y + Math.sin(a) * 24;
      let tx = 0;
      let ty = -620;
      let best = 1e9;
      for (let k = 0; k < G.ents.length; k++) {
        const en = G.ents[k];
        if (en.hp <= 0 || en.ground) continue;
        const d = hypot(en.x - px, en.y - py);
        if (d < best && en.y < G.player.y + 40) {
          best = d;
          const len = d || 1;
          tx = (en.x - px) / len * 640;
          ty = (en.y - py) / len * 640;
        }
      }
      addShot({
        x: px, y: py, vx: tx, vy: ty,
        r: 2.6, rgb: rgb, dmg: 1, groundDmg: 0.5, corkscrew: true
      });
    }
  }

  function tryBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombs <= 0) {
      toast('爆弹用尽', true, false);
      audio.empty();
      return;
    }
    G.bombs -= 1;
    syncBombsUi();
    flashBombs();
    G.drops.push({
      x: G.player.x,
      y: G.player.y + 8,
      vy: 90,
      t: 0,
      spin: G.gyroAng
    });
    audio.beep(320, 0.08, 'square', 0.03, 140);
  }

  function explodeBomb(b) {
    juice(b.x, b.y, GOLD, 2.1);
    audio.bomb();
    hitStop(0.056);
    kick(5.8);
    screenFlash(GOLD, 0.5);
    emit(16, {
      x: b.x, y: b.y, j: 10,
      vx0: -220, vx1: 220, vy0: -180, vy1: 90,
      life: 0.42, r0: 1.6, r1: 4.2, rgb: SAND, g: 260
    });
    for (let k = 0; k < 8; k++) {
      const a = b.spin + k * (TAU / 8);
      emit(3, {
        x: b.x + Math.cos(a) * 10, y: b.y + Math.sin(a) * 10, j: 3,
        vx0: Math.cos(a) * 180, vx1: Math.cos(a) * 280,
        vy0: Math.sin(a) * 180, vy1: Math.sin(a) * 280,
        life: 0.28, r0: 1.2, r1: 2.8, rgb: LIME, g: 0
      });
    }
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const d = hypot(en.x - b.x, en.y - b.y);
      if (en.ground && d < BOMB_R) hurtEnt(en, 4, en.x, en.y);
      else if (!en.ground && d < 42) hurtEnt(en, 2, en.x, en.y);
    }
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0) return;
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

  function killEnt(en) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.ground ? 1.2 : 0.85;
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
    if (en.drop === 'spin' || en.drop === 'bomb') spawnPow(en.x, en.y, en.drop);
    else if (en.drop === true) spawnPow(en.x, en.y, 'spin');
    else if ((en.type === 'tank' || en.type === 'fort') && Math.random() < 0.18) spawnPow(en.x, en.y, 'bomb');
    if (en.type === 'boss') {
      G.stageClearT = 2.1;
      addScore(SCORE.clear * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      const nm = STAGES[G.stage - 1] ? STAGES[G.stage - 1].name.replace(/^第 \d 关 · /, '') : '';
      toast(nm + '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_MAX) {
        G.bombs += 1;
        toast('爆 +1', false, true);
        flashBombs();
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
    } else if (G.powLv < WPN_MAX) {
      G.powLv += 1;
      toast(G.powLv >= WPN_MAX ? '旋 MAX' : '旋环加宽', false, true);
      flashWpn();
    } else if (G.bombs < BOMB_MAX) {
      G.bombs += 1;
      toast('爆 +1', false, true);
      flashBombs();
    } else {
      addScore(500 * G.mult);
      toast('+500', false, true);
    }
    juice(p.x, p.y, GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, p.kind === 'bomb' ? '爆' : '旋', GOLD, true);
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
    if (G.powLv > 0) spawnPow(G.player.x, G.player.y - 18, 'spin');
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
    showOverlay('win', '旋空肃清', (isRain() ? '谷雨通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingAir() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground) n += 1;
    }
    return n;
  }

  function stageThink() {
    if (G.stageClearT > 0 || hasBig()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    const scaleT = isRain() ? 0.86 : 1;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t * scaleT) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function rainThink(dt) {
    if (hasBig() || G.stageClearT > 0) return;
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = clamp(1.42 / (1 + G.stage * 0.12), 0.38, 1.42);
    if (livingAir() > 24) return;
    const r = Math.random();
    if (r < 0.2) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.34) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.46) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.58) spawnTanks();
    else if (r < 0.7) spawnTurretWave();
    else if (r < 0.8) spawnForts();
    else if (r < 0.88) spawnCopter();
    else if (r < 0.94) spawnGyro();
    else spawnCarrier();
  }

  function bossFire(en, rain) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += rain ? 0.24 : 0.17;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, rain ? 210 : 176, LIME);
      eShot(en.x - 18, en.y + 10, -46, 186, PNK);
      eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      if (mid) ringShot(en.x, en.y, rain ? 10 : 8, 150, en.spin, GOLD, 3.2);
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 214, MAG);
      eShot(en.x - 28, en.y + 12, -50, 196, RED);
      eShot(en.x + 28, en.y + 12, 50, 196, RED);
      if (mid) ringShot(en.x, en.y + 6, rain ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, rain ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, rain ? 10 : 8, 118, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 16, 200, ORG);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, rain ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, rain ? 10 : 8, 108, -en.spin * 0.7, LIME, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 210, PNK);
        aimShot(en.x + 20, en.y + 14, 210, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, rain ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (rain) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0;
    const rain = isRain();
    const scr = scrollSpd();

    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.ground && en.type !== 'mid' && en.type !== 'boss') {
        en.y += scr * dt;
        if (en.type === 'tank') {
          en.x += en.vx * dt;
          if (en.x < 70 || en.x > VW - 70) en.vx *= -1;
          en.x = clamp(en.x, 70, VW - 70);
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
      } else if (en.type === 'copter') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 5) * 18 * dt;
        if (en.x > 80 && en.x < VW - 80) en.vx *= Math.exp(-dt * 0.35);
        en.spin += dt * 14;
      } else if (en.type === 'gyro') {
        en.spin += dt * 4.2;
        en.x += Math.sin(en.t * 2.4) * 70 * dt + en.vx * dt;
        en.y += en.vy * dt;
        en.x = clamp(en.x, 40, VW - 40);
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
      } else if (en.type === 'jet') {
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
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'jet' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, rain ? 198 : 172, MAG);
            if (rain && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (rain ? 1.3 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'copter' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, rain ? 196 : 164, MINT);
            eShot(en.x - 10, en.y + 6, -28, 150, LIME);
            eShot(en.x + 10, en.y + 6, 28, 150, LIME);
            en.fireCd = rain ? 0.72 : 1.08;
          } else if (en.type === 'gyro' && en.y > 20 && en.y < VH - 70) {
            ringShot(en.x, en.y, rain ? 8 : 6, rain ? 150 : 128, en.spin, CORE, 3.0);
            en.fireCd = rain ? 0.86 : 1.22;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, rain ? 218 : 176, GOLD);
            if (rain) {
              eShot(en.x - 8, en.y + 4, -42, 164, ORG);
              eShot(en.x + 8, en.y + 4, 42, 164, ORG);
            }
            en.fireCd = (rain ? 0.62 : 1.02) + rand(0, 0.24);
          } else if (en.type === 'tank' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, rain ? 204 : 168, ORG);
            if (rain && Math.random() < 0.5) {
              eShot(en.x - 6, en.y + 4, -30, 150, SAND);
              eShot(en.x + 6, en.y + 4, 30, 150, SAND);
            }
            en.fireCd = rain ? 0.62 : 0.96;
          } else if (en.type === 'fort' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, rain ? 210 : 170, SAND);
            eShot(en.x - 12, en.y + 4, -48, 154, GOLD);
            eShot(en.x + 12, en.y + 4, 48, 154, GOLD);
            en.fireCd = rain ? 0.7 : 1.12;
          } else if (en.type === 'silo' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y - 8, rain ? 150 : 124, RUST, 4.2);
            en.fireCd = rain ? 0.92 : 1.36;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, rain);
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
      s.t += dt;
      if (s.corkscrew && !REDUCE) {
        s.x += Math.sin(s.t * 28 + s.wob) * 46 * dt;
      }
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
        if (dx * dx + dy * dy < rr * rr) {
          if (en.ground) {
            hurtEnt(en, s.groundDmg || 0.4, s.x, s.y);
            emit(3, {
              x: s.x, y: s.y, j: 3,
              vx0: -50, vx1: 50, vy0: -40, vy1: 20,
              life: 0.12, r0: 0.8, r1: 1.8, rgb: GOLD, g: 80
            });
            if (G.chipCd <= 0) {
              audio.chip();
              G.chipCd = 0.04;
            }
          } else {
            hurtEnt(en, s.dmg || 1, s.x, s.y);
          }
          hit = true;
          break;
        }
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
  }

  function updateBombs(dt) {
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const b = G.drops[i];
      b.t += dt;
      b.vy += 420 * dt;
      b.y += b.vy * dt;
      b.spin += dt * 10;
      let boom = b.t >= 0.38 || b.y > VH - 18;
      if (!boom) {
        for (let j = 0; j < G.ents.length; j++) {
          const en = G.ents[j];
          if (en.hp <= 0 || !en.ground) continue;
          const dx = en.x - b.x;
          const dy = en.y - b.y;
          const rr = en.r + 8;
          if (dx * dx + dy * dy < rr * rr) {
            boom = true;
            break;
          }
        }
      }
      if (boom) {
        explodeBomb(b);
        G.drops.splice(i, 1);
      }
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
    for (let i = 0; i < dust.length; i++) {
      const s = dust[i];
      s.y += scr * 0.55 * s.z * dt;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < cliffs.length; i++) {
      const c = cliffs[i];
      c.y += scr * dt;
      if (c.y - c.h > VH + 30) {
        c.y = -80 - rand(0, 60);
        c.w = 46 + hash2((G.scroll + c.h) | 0) * 28;
        c.h = 70 + hash2((G.scroll * 0.13) | 0) * 40;
        c.k = hash2((G.scroll) | 0);
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      wash.push({
        x: G.player.x + rand(-6, 6),
        y: G.player.y + 12,
        t: 0,
        r: rand(6, 11)
      });
      capArr(wash, 18);
    }
    for (let i = wash.length - 1; i >= 0; i--) {
      wash[i].t += dt * 2.4;
      wash[i].y += 28 * dt;
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

  function tickRotor(dt) {
    G.rotorAng += dt * (REDUCE ? 6 : 22);
    G.gyroAng += dt * (REDUCE ? 1.4 : 3.2);
    G.rotorT -= dt;
    if (G.rotorT > 0) return;
    G.rotorT = G.mode === 'play' && G.deadT <= 0 ? 0.082 : 0.14;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.rotor();
  }

  function updatePlayer(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = plySpd();
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
      G.player.vx = dx * spd;
      G.player.vy = dy * spd;
      inputSrc = 'key';
      G.player.x += G.player.vx * dt;
      G.player.y += G.player.vy * dt;
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      const oxp = G.player.x;
      G.player.x = lerp(G.player.x, tx, 1 - Math.exp(-dt * 16));
      G.player.y = lerp(G.player.y, ty, 1 - Math.exp(-dt * 16));
      G.player.vx = (G.player.x - oxp) / Math.max(dt, 0.0001);
      G.player.vy = 0;
    } else {
      G.player.vx *= Math.exp(-dt * 10);
      G.player.vy *= Math.exp(-dt * 10);
      G.player.x += G.player.vx * dt;
      G.player.y += G.player.vy * dt;
    }
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 40, VH - 28);
    const wantBank = clamp(G.player.vx * 0.0018, -0.28, 0.28);
    G.player.bank = lerp(G.player.bank || 0, wantBank, 1 - Math.exp(-dt * 10));
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      tickRotor(dt * 0.35);
      return;
    }
    updateFx(dt);
    tickRotor(dt);

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
    if (G.podCd > 0) G.podCd -= dt;
    if (G.chipCd > 0) G.chipCd -= dt;
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
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();
    if (G.mode === 'play' && G.deadT <= 0) firePods();

    stageThink();
    if (isRain()) rainThink(dt);

    updateEnts(dt);
    updateShots(dt);
    updateBombs(dt);
    updatePows(dt);
  }

  function drawCliff(c, bio) {
    const side = c.side;
    const x0 = side < 0 ? sx(0) : sx(VW);
    const inward = (c.w + Math.sin(c.y * 0.02 + c.k * 8) * 8) * scale;
    const x1 = side < 0 ? sx(0) + inward : sx(VW) - inward;
    const y0 = sy(c.y);
    const y1 = sy(c.y + c.h);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0 + 10 * scale);
    ctx.lineTo(x1 - side * 6 * scale, y1);
    ctx.lineTo(x0, y1);
    ctx.closePath();
    if (bio === 'gorge') ctx.fillStyle = 'rgba(22, 40, 36, 0.92)';
    else if (bio === 'core') ctx.fillStyle = 'rgba(16, 32, 28, 0.94)';
    else ctx.fillStyle = 'rgba(18, 42, 28, 0.92)';
    ctx.fill();
    ctx.strokeStyle = bio === 'core' ? rgba(CORE, 0.22) : rgba(LIME, 0.16);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    if (bio === 'gorge') {
      ctx.fillStyle = 'rgba(60, 70, 64, 0.45)';
      ctx.fillRect(side < 0 ? x0 : x1, y0 + 18 * scale, Math.abs(x1 - x0) * 0.4, 8 * scale);
    }
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'gorge') {
      g.addColorStop(0, '#0a1814');
      g.addColorStop(0.5, '#071410');
      g.addColorStop(1, '#04120e');
    } else if (bio === 'core') {
      g.addColorStop(0, '#061814');
      g.addColorStop(0.45, '#04140f');
      g.addColorStop(1, '#03100c');
    } else {
      g.addColorStop(0, '#0a1c12');
      g.addColorStop(0.5, '#081610');
      g.addColorStop(1, '#04140c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const roadX = VW * 0.5 + Math.sin(G.scroll * 0.004) * (bio === 'hill' ? 28 : 12);
    ctx.save();
    ctx.strokeStyle = bio === 'core' ? 'rgba(28, 60, 48, 0.55)' : 'rgba(36, 64, 42, 0.5)';
    ctx.lineWidth = (bio === 'gorge' ? 86 : 74) * scale;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(sx(roadX), sy(-12));
    ctx.lineTo(sx(roadX), sy(VH + 12));
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.2);
    ctx.lineWidth = 1.5 * scale;
    ctx.setLineDash([10 * scale, 14 * scale]);
    ctx.lineDashOffset = -G.scroll * scale * 0.42;
    ctx.beginPath();
    ctx.moveTo(sx(roadX), sy(-12));
    ctx.lineTo(sx(roadX), sy(VH + 12));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (bio === 'core' && !REDUCE) {
      ctx.save();
      ctx.strokeStyle = rgba(CORE, 0.1);
      ctx.lineWidth = 1;
      const off = (G.scroll * 0.25) % 36;
      for (let i = -1; i < 22; i++) {
        ctx.beginPath();
        ctx.arc(sx(VW * 0.5), sy(i * 36 - off), 22 * scale, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (let i = 0; i < dust.length; i++) {
      const s = dust[i];
      ctx.fillStyle = rgba(bio === 'core' ? CORE : LAND, s.a * 0.4);
      ctx.fillRect(sx(s.x), sy(s.y), 2 * scale, 2 * scale);
    }

    for (let i = 0; i < cliffs.length; i++) drawCliff(cliffs[i], bio);

    for (let i = 0; i < wash.length; i++) {
      const w = wash[i];
      ctx.strokeStyle = rgba(LIME, (1 - w.t) * 0.28);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), w.r * (0.6 + w.t) * scale, w.r * 0.35 * scale, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawHeli(x, y, a, enemy, flashHit) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(enemy ? 0 : (G.player.bank || 0));
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    const flash = flashHit || (!enemy && G.muzzle > 0);
    const body = enemy ? MINT : LIME;
    ctx.shadowColor = rgba(body, 0.55);
    ctx.shadowBlur = 12;
    const ra = enemy ? (G.t * 18) : G.rotorAng;

    if (!enemy) {
      ctx.strokeStyle = rgba(LIME, 0.55);
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 13, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = rgba(GOLD, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 9, G.gyroAng, 0, TAU);
      ctx.stroke();
    }

    ctx.strokeStyle = rgba(WHT, 0.28);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, -3, 15, 4, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(body, 0.9);
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ra) * 15, -3 + Math.sin(ra) * 3.4);
    ctx.lineTo(Math.cos(ra + Math.PI) * 15, -3 + Math.sin(ra + Math.PI) * 3.4);
    ctx.moveTo(Math.cos(ra + 1.57) * 15, -3 + Math.sin(ra + 1.57) * 3.4);
    ctx.lineTo(Math.cos(ra + 4.71) * 15, -3 + Math.sin(ra + 4.71) * 3.4);
    ctx.stroke();

    ctx.fillStyle = flash ? '#e8ffff' : rgba(body, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(3.6, -6);
    ctx.lineTo(5.2, 4);
    ctx.lineTo(2.4, 8);
    ctx.lineTo(1.6, 18);
    ctx.lineTo(0, 20);
    ctx.lineTo(-1.6, 18);
    ctx.lineTo(-2.4, 8);
    ctx.lineTo(-5.2, 4);
    ctx.lineTo(-3.6, -6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.beginPath();
    ctx.ellipse(0, -7, 2.3, 3.2, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-7, 6);
    ctx.lineTo(-9, 12);
    ctx.moveTo(7, 6);
    ctx.lineTo(9, 12);
    ctx.stroke();

    const tr = ra * 2.2;
    ctx.strokeStyle = rgba(MINT, 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3 + Math.cos(tr) * 4, 19);
    ctx.lineTo(-3 + Math.cos(tr + Math.PI) * 4, 19);
    ctx.stroke();

    if (!enemy && G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(-2.6, -16);
      ctx.lineTo(0, -27);
      ctx.lineTo(2.6, -16);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPods() {
    const n = podCount();
    if (n <= 0 || G.deadT > 0) return;
    for (let i = 0; i < n; i++) {
      const a = G.gyroAng + (i * TAU) / n;
      const px = G.player.x + Math.cos(a) * 40;
      const py = G.player.y + Math.sin(a) * 24;
      ctx.save();
      ctx.translate(sx(px), sy(py));
      ctx.scale(scale, scale);
      ctx.rotate(a + G.t * 4);
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = rgba(GOLD, 0.6);
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(LIME, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
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
    if (en.type === 'jet' || en.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(8, -4);
      ctx.lineTo(0, -10);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'copter') {
      ctx.restore();
      drawHeli(en.x, en.y, 1, true, flash);
      return;
    } else if (en.type === 'gyro') {
      ctx.rotate(en.spin);
      ctx.strokeStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 3.4, 0, TAU);
      ctx.fill();
    } else if (en.type === 'carrier') {
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 4);
      ctx.lineTo(0, 10);
      ctx.lineTo(-10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('旋', 0, 4);
    } else if (en.type === 'tank') {
      ctx.fillRect(-en.w * 0.5, -en.h * 0.4, en.w, en.h * 0.8);
      ctx.fillStyle = flash ? '#fff' : rgba(SAND, 0.8);
      ctx.fillRect(-5, -en.h * 0.7, 10, 8);
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(-en.w * 0.42, 4, 6, 4);
      ctx.fillRect(en.w * 0.18, 4, 6, 4);
    } else if (en.type === 'fort') {
      ctx.fillRect(-en.w * 0.5, -en.h * 0.2, en.w, en.h * 0.7);
      ctx.fillStyle = flash ? '#fff' : rgba(RUST, 0.85);
      ctx.fillRect(-10, -en.h * 0.7, 20, 12);
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.fillRect(-4, -4, 8, 6);
    } else if (en.type === 'turret') {
      ctx.beginPath();
      ctx.arc(0, 4, 10, 0, TAU);
      ctx.fill();
      const ang = Math.atan2(G.player.y - en.y, G.player.x - en.x);
      ctx.strokeStyle = flash ? '#fff' : rgba(GOLD, 0.95);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(Math.cos(ang) * 14, 4 + Math.sin(ang) * 14);
      ctx.stroke();
    } else if (en.type === 'silo') {
      ctx.fillRect(-8, -10, 16, 22);
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(0, -20);
      ctx.lineTo(6, -10);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'mid' || en.type === 'boss') {
      const big = en.type === 'boss';
      ctx.fillRect(-en.w * 0.5, -en.h * 0.35, en.w, en.h * 0.8);
      ctx.fillStyle = flash ? '#fff' : rgba(big ? MAG : STEEL, 0.95);
      ctx.fillRect(-en.w * 0.22, -en.h * 0.7, en.w * 0.44, 16);
      ctx.strokeStyle = rgba(LIME, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, big ? 18 : 12, en.spin, en.spin + TAU * 0.72);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, big ? 6 : 4.5, 0, TAU);
      ctx.fill();
      if (big) {
        ctx.strokeStyle = rgba(GOLD, 0.4);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 28, -en.spin, -en.spin + TAU);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, en.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.shadowColor = rgba(s.rgb, 0.7);
      ctx.shadowBlur = REDUCE ? 0 : 8;
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), s.r * 0.7 * scale, (s.r + 3.2) * scale, 0, 0, TAU);
      ctx.fill();
      if (!REDUCE) {
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(sx(s.x), sy(s.y + 8), s.r * 0.45 * scale, 6 * scale, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.shadowColor = rgba(s.rgb, 0.65);
      ctx.shadowBlur = REDUCE ? 0 : 7;
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < G.drops.length; i++) {
      const b = G.drops[i];
      ctx.save();
      ctx.translate(sx(b.x), sy(b.y));
      ctx.rotate(b.spin);
      ctx.scale(scale, scale);
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 2;
      ctx.shadowColor = rgba(GOLD, 0.7);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(LIME, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const pulse = 0.85 + Math.sin(p.t * 8) * 0.15;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(p.t * 2.4);
      ctx.scale(scale * pulse, scale * pulse);
      const bomb = p.kind === 'bomb';
      ctx.fillStyle = rgba(bomb ? ORG : GOLD, 0.95);
      ctx.shadowColor = rgba(bomb ? ORG : GOLD, 0.7);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a1200';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(bomb ? '爆' : '旋', 0, 0.5);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / p.max;
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
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
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) {
        drawHeli(G.player.x, G.player.y, 1, false);
        drawPods();
      }
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
    G.pows.length = 0;
    G.drops.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wash.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'gyro';
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
    G.fireCd = 0;
    G.podCd = 0;
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
    G.rotorT = 0;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRain() ? '谷雨 · 弹雨更密' : '旋空 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'gyro';
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
      '旋空',
      '旋翼直升机沿谷爬升。机枪旋弹打空，投弹炸碉堡。旋环护体，谷雨更密。别当成空牙、打击或战国——这是旋空，不是双人牙缝、不是喷气、不是妖刀。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('gyro');
    else startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('gyro');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    if (G.mode === 'title') startGame('rain');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win' && isRain()) goTitle();
    else if (G.mode === 'win') startGame('rain');
    else goTitle();
  }

  function onKey(e, down) {
    const k = e.key;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' ||
      k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S' ||
      k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    const bombKey = k === 'Shift' || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }

    if (down && (isMove || space || bombKey || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
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
        if (space && G.mode === 'play') G.fireHold = true;
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
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
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
  goTitle();
  resize();
  bindPointer();

  if (btnGyro) {
    btnGyro.addEventListener('click', function () {
      audio.ensure();
      startGame('gyro');
    });
  }
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
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
      secondaryAction();
    });
  }
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
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
