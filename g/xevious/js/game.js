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
  const RETICLE = 86;
  const BEST_KEY = 'playbox-xevious-best';
  const MUTE_KEY = 'playbox-xevious-mute';
  const AUTO_SPEED_KEY = 'playbox-xevious-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '方向 / WSD 飞 · 空格打空 · Shift / Z 投弹 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (BEST_KEY !== 'playbox-xevious-best') throw new Error('best key');
  if (AUTO_SPEED_KEY !== 'playbox-xevious-auto-speed') throw new Error('auto speed key');

  const MAG = [255, 61, 184];
  const LIME = [180, 255, 60];
  const MINT = [212, 255, 106];
  const GOLD = [255, 227, 107];
  const WHT = [232, 255, 224];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const MOSS = [90, 170, 72];
  const SAND = [210, 176, 96];
  const STEEL = [168, 186, 176];
  const CORE = [255, 92, 64];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const STAGES = [
    {
      name: '林泽',
      biome: 'marsh',
      mid: '泽塔',
      boss: '林核堡',
      midHp: 36,
      bossHp: 88,
      waves: [
        { t: 0.8, kind: 'rings', n: 5 },
        { t: 3.2, kind: 'turrets' },
        { t: 5.6, kind: 'stream', dir: 1 },
        { t: 8.0, kind: 'hidden' },
        { t: 10.6, kind: 'cones', n: 4 },
        { t: 13.0, kind: 'bacura' },
        { t: 15.4, kind: 'rings', n: 7 },
        { t: 17.8, kind: 'silos' },
        { t: 20.6, kind: 'mid' },
        { t: 26.2, kind: 'stream', dir: -1 },
        { t: 28.6, kind: 'bunkers' },
        { t: 31.0, kind: 'cones', n: 5 },
        { t: 33.6, kind: 'hidden' },
        { t: 36.0, kind: 'discs' },
        { t: 38.4, kind: 'rings', n: 7 },
        { t: 41.0, kind: 'carrier' },
        { t: 43.4, kind: 'turrets' },
        { t: 48.2, kind: 'boss' }
      ]
    },
    {
      name: '荒原',
      biome: 'waste',
      mid: '荒台',
      boss: '荒核城',
      midHp: 48,
      bossHp: 118,
      waves: [
        { t: 0.7, kind: 'rings', n: 7 },
        { t: 2.8, kind: 'silos' },
        { t: 5.0, kind: 'stream', dir: -1 },
        { t: 7.4, kind: 'cones', n: 5 },
        { t: 9.6, kind: 'hidden' },
        { t: 12.0, kind: 'bacura' },
        { t: 14.4, kind: 'bunkers' },
        { t: 16.8, kind: 'carrier' },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'discs' },
        { t: 27.0, kind: 'turrets' },
        { t: 29.2, kind: 'cones', n: 6 },
        { t: 31.6, kind: 'hidden' },
        { t: 34.0, kind: 'rings', n: 9 },
        { t: 36.4, kind: 'silos' },
        { t: 38.8, kind: 'stream', dir: 1 },
        { t: 41.2, kind: 'carrier' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '空核',
      biome: 'core',
      mid: '核门',
      boss: '安德核',
      midHp: 62,
      bossHp: 164,
      waves: [
        { t: 0.5, kind: 'rings', n: 9 },
        { t: 2.4, kind: 'bacura' },
        { t: 4.4, kind: 'discs' },
        { t: 6.4, kind: 'hidden' },
        { t: 8.4, kind: 'cones', n: 6 },
        { t: 10.4, kind: 'turrets' },
        { t: 12.6, kind: 'stream', dir: 1 },
        { t: 14.6, kind: 'silos' },
        { t: 16.6, kind: 'carrier' },
        { t: 18.8, kind: 'mid' },
        { t: 24.6, kind: 'discs' },
        { t: 26.6, kind: 'cones', n: 7 },
        { t: 28.8, kind: 'bunkers' },
        { t: 31.0, kind: 'bacura' },
        { t: 33.2, kind: 'hidden' },
        { t: 35.4, kind: 'rings', n: 11 },
        { t: 37.6, kind: 'stream', dir: -1 },
        { t: 39.8, kind: 'silos' },
        { t: 42.0, kind: 'turrets' },
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
  const btnMarsh = document.getElementById('btn-marsh');
  const btnCore = document.getElementById('btn-core');
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
  const lockLabel = document.getElementById('lock-label');
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
  let eid = 1;
  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = VW * 0.5;
  let autoTy = VH - 90;
  let autoStickS = -1e9;
  let autoOvWait = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trees = [];
  const wash = [];

  const G = {
    mode: 'title',
    kind: 'marsh',
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
    lock: null,
    lockId: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    fireCd: 0,
    bombCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
    punch: 1,
    muzzle: 0,
    bombFlash: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    rumbleT: 0,
    why: ''
  };

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
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'marsh';
  }
  function plySpd() {
    return (isCore() ? 308 : 272) + G.powLv * 8;
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 34 : 26;
    const base = isCore() ? 112 : 80;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 8);
  }
  function hpMul() {
    return isCore() ? 1.22 : 1;
  }
  function shotCap() {
    return isCore() ? 168 : 112;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if (t === 'mid' || t === 'boss') return true;
    }
    return false;
  }
  function hasBoss() {
    for (let i = 0; i < G.ents.length; i++) if (G.ents[i].type === 'boss') return true;
    return false;
  }
  function hasMid() {
    for (let i = 0; i < G.ents.length; i++) if (G.ents[i].type === 'mid') return true;
    return false;
  }
  function livingAir() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground && G.ents[i].type !== 'bacura') n += 1;
    }
    return n;
  }
  function reticleY() {
    return G.player.y - RETICLE;
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
      this.beep(880 + G.powLv * 50, 0.042, 'square', 0.028, 1680);
    },
    bombDrop() {
      this.ensure();
      this.beep(420, 0.12, 'sawtooth', 0.04, 180);
      this.beep(980, 0.06, 'square', 0.022, 420);
    },
    bombBoom() {
      this.ensure();
      this.noise(0.16, 0.07, 220);
      this.beep(140, 0.22, 'sawtooth', 0.055, 48);
      this.beep(620, 0.1, 'triangle', 0.03, 160);
    },
    lock() {
      this.ensure();
      this.beep(740, 0.05, 'sine', 0.036, 1180);
      this.beep(1180, 0.08, 'triangle', 0.028, 1480);
    },
    reveal() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(1046, 0.12, 'sine', 0.036, 1568);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.07, 'sine', 0.022, 80);
      this.noise(0.05, 0.02, 700);
    },
    scrape() {
      this.ensure();
      this.noise(0.04, 0.03, 1800);
      this.beep(1400, 0.04, 'square', 0.018, 600);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (kind === 'ground') {
        this.noise(0.055, 0.04, 360);
        this.beep(210 * lift, 0.1, 'sawtooth', 0.04, 64);
      } else {
        this.noise(0.034, 0.03, 1300);
        this.beep(580 * lift, 0.06, 'square', 0.042, 980 * lift);
      }
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.1, big ? 0.078 : 0.048, big ? 180 : 440);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.14, 'sawtooth', 0.052, 48);
    },
    pow() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.045, 740);
      this.beep(740, 0.12, 'triangle', 0.04, 1175);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.04, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.03, 1176);
    },
    rumble() {
      this.ensure();
      this.beep(78, 0.03, 'sawtooth', 0.01, 52);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(260, 0.22, 'sawtooth', 0.05, 64);
      this.beep(130, 0.34, 'sine', 0.044, 40);
    },
    wave() {
      this.ensure();
      this.beep(330, 0.09, 'sine', 0.04, 494);
      this.beep(494, 0.11, 'sine', 0.04, 660);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.2, 'sawtooth', 0.054, 88);
      this.beep(110, 0.32, 'square', 0.04, 58);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.04, 80);
      this.beep(120, 0.3, 'sine', 0.05, 42);
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
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    } else if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
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
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1280);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function wpnText() {
    if (G.powLv >= WPN_MAX) return '隼 MAX';
    if (G.powLv <= 0) return '隼';
    return '隼 ' + WPN_ROMAN[G.powLv];
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
      const big = hasBoss() ? (st ? st.boss : '关底') : hasMid() ? (st ? st.mid : '中核') : ('第 ' + G.stage + ' 区 · ' + (st ? st.name : ''));
      stageLabel.textContent = big;
      stageLabel.classList.toggle('hot', hasBig() || G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '空核' : '泽空';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    if (lockLabel) {
      const on = !!(G.lock && G.mode === 'play');
      lockLabel.hidden = !on;
      if (on) {
        lockLabel.textContent = G.lock.hidden && G.lock.revealed ? '发现' : '锁';
        lockLabel.classList.toggle('on', true);
      }
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · R 重开接着打', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint('空核已破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 准星变金再投弹', 'warn');
    else if (G.lock) setHint('锁定 · Shift 投弹砸核', 'hot');
    else setHint('空格打飞碟 · Shift 投弹砸地核 · 准星变金再丢 · A 自动', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'XEVS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else if (kind === 'win') btnOvModes.textContent = isCore() ? '换模式' : '空核';
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
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 48);
    capArr(rings, 32);
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
    screenFlash(rgb, 0.16 + p * 0.14);
    kick(2.2 + p * 2.6);
  }

  function seedWorld() {
    trees.length = 0;
    for (let i = 0; i < 18; i++) {
      trees.push({
        x: hash2(i * 19 + 7) * VW,
        y: -30 - i * 52,
        s: 16 + hash2(i * 11) * 22,
        k: hash2(i * 5)
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
      id: eid++,
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
      invuln: !!spec.invuln,
      hidden: !!spec.hidden,
      revealed: !spec.hidden,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      spin: spec.spin || 0,
      baseX: spec.x
    };
    G.ents.push(en);
    return en;
  }

  function spawnRing(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'ring',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy == null ? 86 : extra.vy,
      hp: 1, r: 11, score: 50,
      rgb: extra.rgb || MAG,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.8, 1.8),
      phase: extra.phase || 0
    });
  }

  function spawnRings(n, xmid) {
    const mid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const gap = 28;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      spawnRing(mid + k * gap, -18 - Math.abs(k) * 16, { vy: 90, fireCd: 0.7 + Math.abs(k) * 0.12 });
    }
  }

  function spawnStream(dir) {
    const x = dir > 0 ? -20 : VW + 20;
    for (let i = 0; i < 6; i++) {
      spawnEnt({
        type: 'wing',
        x: x, y: 36 + i * 26,
        vx: dir * 96, vy: 38,
        hp: 1, r: 12, score: 60,
        rgb: PNK, phase: i * 0.4, fireCd: 0.9 + i * 0.08
      });
    }
  }

  function spawnCones(n) {
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'cone',
        x: rand(50, VW - 50),
        y: -24 - i * 22,
        vx: rand(-16, 16),
        vy: 52,
        hp: 1, r: 12, score: 80,
        rgb: GOLD, dive: true,
        fireCd: 0.55 + i * 0.1, phase: i
      });
    }
  }

  function spawnDiscs() {
    const xs = [90, VW * 0.5, VW - 90];
    for (let i = 0; i < xs.length; i++) {
      spawnEnt({
        type: 'disc',
        x: xs[i], y: -28 - i * 14,
        vx: i === 1 ? 0 : (i === 0 ? 28 : -28),
        vy: 58,
        hp: 2, r: 15, score: 120,
        rgb: MINT, fireCd: 0.7 + i * 0.15, phase: i * 0.8
      });
    }
  }

  function spawnBacura() {
    const xs = [120, VW * 0.5, VW - 120];
    for (let i = 0; i < xs.length; i++) {
      spawnEnt({
        type: 'bacura',
        x: xs[i], y: -30 - i * 40,
        vx: 0, vy: 70,
        hp: 99, r: 16, score: 0,
        rgb: STEEL, invuln: true,
        spin: rand(0, TAU), w: 38, h: 10,
        fireCd: 99
      });
    }
  }

  function spawnTurrets() {
    const xs = [70, VW - 70, VW * 0.5];
    for (let i = 0; i < xs.length; i++) {
      spawnEnt({
        type: 'turret',
        x: xs[i], y: -18,
        vx: 0, vy: 0,
        hp: 4, r: 16, score: 150,
        rgb: GOLD, ground: true,
        fireCd: 0.8 + i * 0.2, w: 28, h: 20
      });
    }
  }

  function spawnBunkers() {
    const xs = [100, VW - 100];
    for (let i = 0; i < xs.length; i++) {
      spawnEnt({
        type: 'bunker',
        x: xs[i] + rand(-12, 12), y: -22,
        vx: 0, vy: 0,
        hp: 5, r: 18, score: 180,
        rgb: SAND, ground: true,
        fireCd: 1.0 + i * 0.2, w: 32, h: 22
      });
    }
  }

  function spawnSilos() {
    for (let i = 0; i < 3; i++) {
      spawnEnt({
        type: 'silo',
        x: 80 + i * 160 + rand(-18, 18),
        y: -20 - (i % 2) * 16,
        vx: 0, vy: 0,
        hp: 5, r: 17, score: 200,
        rgb: ORG, ground: true,
        fireCd: 0.9 + i * 0.18, w: 26, h: 24
      });
    }
  }

  function spawnHidden() {
    const n = 3 + (Math.random() * 2) | 0;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'hidden',
        x: 60 + rand(0, VW - 120),
        y: -16 - i * 28,
        vx: 0, vy: 0,
        hp: 3, r: 14, score: 250,
        rgb: CORE, ground: true, hidden: true,
        fireCd: 1.2, w: 22, h: 16
      });
    }
  }

  function spawnCarrier() {
    spawnEnt({
      type: 'carrier',
      x: rand(90, VW - 90), y: -28,
      vx: rand(-30, 30), vy: 48,
      hp: 5, r: 18, score: 300,
      rgb: GOLD, drop: true, fireCd: 1.4, phase: Math.random() < 0.5 ? 1 : -1
    });
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.midHp : 36) * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5, y: -50,
      vx: 42, vy: 42,
      hp: hp, r: 30, score: 2000,
      rgb: G.stage === 3 ? CORE : G.stage === 2 ? SAND : MOSS,
      ground: true, fireCd: 0.6, w: 64, h: 40
    });
    audio.boss();
    toast(st ? st.mid : '中核', false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.bossHp : 88) * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5, y: -70,
      vx: 36, vy: 28,
      hp: hp, r: 46, score: 4000 + 1500 * G.stage,
      rgb: G.stage === 3 ? GOLD : G.stage === 2 ? SAND : LIME,
      ground: true, fireCd: 0.45, w: 96, h: 72
    });
    audio.boss();
    toast(st ? st.boss : '空核城', false, true);
    kick(5.5);
    screenFlash(GOLD, 0.45);
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'rings') spawnRings(w.n || 5);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'cones') spawnCones(w.n || 4);
    else if (w.kind === 'discs') spawnDiscs();
    else if (w.kind === 'bacura') spawnBacura();
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'bunkers') spawnBunkers();
    else if (w.kind === 'silos') spawnSilos();
    else if (w.kind === 'hidden') spawnHidden();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y) {
    G.pows.push({
      x: x, y: y, vx: rand(-36, 36), vy: -70,
      t: 0, r: 11
    });
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length >= shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.3, rgb: rgb || MAG, life: 4.2
    });
  }

  function aimShot(x, y, spd, rgb, r) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const l = hypot(dx, dy) || 1;
    eShot(x, y, dx / l * spd, dy / l * spd, rgb, r);
  }

  function ringShot(x, y, n, spd, ang, rgb, r) {
    for (let i = 0; i < n; i++) {
      const a = ang + i * TAU / n;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.powLv;
    const x = G.player.x;
    const y = G.player.y - 18;
    G.muzzle = 0.05;
    G.fireCd = 0.11 - lv * 0.011;
    const spd = -700;
    const rgb = lv >= 3 ? GOLD : lv >= 1 ? MINT : WHT;
    function zap(ox, oy, vx, vy) {
      if (G.shots.length > 96) return;
      G.shots.push({
        kind: 'zap',
        x: x + ox, y: y + oy,
        vx: vx || 0, vy: vy == null ? spd : vy,
        r: 3.05, rgb: rgb, dmg: 1
      });
    }
    if (lv <= 0) zap(0, 0);
    else if (lv === 1) {
      zap(-7, 2);
      zap(7, 2);
    } else if (lv === 2) {
      zap(-11, 3, -70, spd);
      zap(0, -2);
      zap(11, 3, 70, spd);
    } else if (lv === 3) {
      zap(-16, 5, -120, spd);
      zap(-7, 1, -40, spd);
      zap(0, -3);
      zap(7, 1, 40, spd);
      zap(16, 5, 120, spd);
    } else {
      zap(-18, 6, -150, spd);
      zap(-11, 2, -80, spd);
      zap(-4, -1);
      zap(0, -4);
      zap(4, -1);
      zap(11, 2, 80, spd);
      zap(18, 6, 150, spd);
    }
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2, rgb: rgb, g: 0
    });
  }

  function dropBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombCd > 0) return;
    const lock = G.lock && G.lock.hp > 0 ? G.lock : null;
    const tx = lock ? lock.x : G.player.x;
    const ty = lock ? lock.y : reticleY();
    G.bombCd = 0.42 - G.powLv * 0.035;
    G.bombFlash = 0.18;
    const px = G.player.x;
    const py = G.player.y - 10;
    const dx = tx - px;
    const dy = ty - py;
    const len = hypot(dx, dy) || 1;
    const spd = 520 + G.powLv * 30;
    G.shots.push({
      kind: 'bomb',
      x: px, y: py,
      tx: tx, ty: ty,
      vx: dx / len * spd,
      vy: dy / len * spd,
      r: 6.2, rgb: GOLD,
      dmg: 2 + (G.powLv >= 2 ? 1 : 0),
      lock: !!lock,
      life: 0.85
    });
    audio.bombDrop();
    emit(5, {
      x: px, y: py, j: 4,
      vx0: -50, vx1: 50, vy0: -80, vy1: 20,
      life: 0.16, r0: 1.2, r1: 2.6, rgb: GOLD, g: 80
    });
    if (btnBomb) btnBomb.classList.add('held');
    if (btnPad) btnPad.classList.add('held');
    setTimeout(function () {
      if (btnBomb) btnBomb.classList.remove('held');
      if (btnPad) btnPad.classList.remove('held');
    }, 120);
  }

  function explodeBomb(s) {
    const x = s.tx;
    const y = s.ty;
    const rad = (s.lock ? 34 : 26) + G.powLv * 3;
    juice(x, y, GOLD, s.lock ? 1.55 : 1.15);
    emit(12, {
      x: x, y: y, j: 10,
      vx0: -140, vx1: 140, vy0: -90, vy1: 50,
      life: 0.36, r0: 1.6, r1: 3.6, rgb: SAND, g: 260
    });
    popSpark(x, y, GOLD, rad * 0.7);
    audio.bombBoom();
    hitStop(s.lock ? 0.056 : 0.04);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    let hits = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0 || !en.ground) continue;
      const d = hypot(en.x - x, en.y - y);
      if (d < rad + en.r) {
        if (en.hidden && !en.revealed) {
          en.revealed = true;
          audio.reveal();
        }
        hurtEnt(en, s.dmg, en.x, en.y);
        hits += 1;
      }
    }
    if (!hits) {
      audio.miss();
      floatText(x, y, '空', STEEL, false);
    } else if (s.lock) {
      floatText(x, y - 12, '锁爆', GOLD, true);
    }
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0) return;
    if (en.invuln) return;
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
    if (G.lock === en) G.lock = null;
    bumpCombo();
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.ground ? 1.25 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    audio.hit(en.ground ? 'ground' : 'air', G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === true) spawnPow(en.x, en.y);
    else if ((en.type === 'silo' || en.type === 'bunker' || en.type === 'hidden') && Math.random() < 0.2) spawnPow(en.x, en.y);
    if (en.type === 'boss') {
      G.stageClearT = 2.1;
      addScore(1500 * G.stage);
      floatText(en.x, en.y - 24, '核破', GOLD, true);
      toast((STAGES[G.stage - 1] ? STAGES[G.stage - 1].name : '') + '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (G.powLv < WPN_MAX) {
      G.powLv += 1;
      toast(G.powLv >= WPN_MAX ? '隼 MAX' : '泽 + 火力', false, true);
    } else {
      addScore(500 * G.mult);
      toast('+500', false, true);
    }
    flashWpn();
    juice(p.x, p.y, GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, '泽', GOLD, true);
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
    G.lock = null;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.powLv > 0) spawnPow(G.player.x, G.player.y - 18);
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
    addScore(8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '空核已破', (isCore() ? '空核通关' : '三区打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function marshThink() {
    if (G.stageClearT > 0 || hasBig()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function coreThink(dt) {
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
    if (r < 0.22) spawnRings(5 + (Math.random() * 6) | 0);
    else if (r < 0.36) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.48) spawnCones(3 + (Math.random() * 4) | 0);
    else if (r < 0.58) spawnHidden();
    else if (r < 0.68) spawnTurrets();
    else if (r < 0.78) spawnSilos();
    else if (r < 0.86) spawnBunkers();
    else if (r < 0.92) spawnDiscs();
    else if (r < 0.97) spawnBacura();
    else spawnCarrier();
  }

  function bossFire(en, dense) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += dense ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 12, dense ? 196 : 164, GOLD);
      eShot(en.x - 18, en.y + 8, -46, 176, PNK);
      eShot(en.x + 18, en.y + 8, 46, 176, PNK);
      if (mid) ringShot(en.x, en.y, dense ? 10 : 8, 138, en.spin, LIME, 3.1);
      if (low) {
        aimShot(en.x - 22, en.y + 6, 190, MAG);
        aimShot(en.x + 22, en.y + 6, 190, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 16, 204, MAG);
      eShot(en.x - 28, en.y + 10, -50, 186, RED);
      eShot(en.x + 28, en.y + 10, 50, 186, RED);
      if (mid) ringShot(en.x, en.y + 4, dense ? 12 : 9, 132, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 18, k * 42, 198, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 6, dense ? 14 : 11, 140, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 6, dense ? 10 : 8, 112, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 14, 190, ORG);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 8, 210, RED);
        aimShot(en.x + 28, en.y + 8, 210, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 4, dense ? 16 : 12, 148, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 4, dense ? 10 : 8, 104, -en.spin * 0.7, LIME, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 12, 200, PNK);
        aimShot(en.x + 20, en.y + 12, 200, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, dense ? 18 : 14, 160, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (dense) en.fireCd *= 0.76;
  }

  function updateLock() {
    const prev = G.lock && G.lock.hp > 0 ? G.lock : null;
    G.lock = null;
    if (G.mode !== 'play' || G.deadT > 0) {
      if (prev) syncHud();
      return;
    }
    const rx = G.player.x;
    const ry = reticleY();
    let best = 38;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0 || !en.ground) continue;
      if (en.y < -8 || en.y > VH + 8) continue;
      const d = hypot(en.x - rx, en.y - ry);
      const reach = 32 + en.r * 0.28;
      if (d < reach && d < best) {
        best = d;
        G.lock = en;
      }
    }
    if (G.lock && G.lock !== prev) {
      audio.lock();
      if (G.lock.hidden && !G.lock.revealed) {
        G.lock.revealed = true;
        audio.reveal();
        floatText(G.lock.x, G.lock.y - 8, '发现', GOLD, true);
        popSpark(G.lock.x, G.lock.y, GOLD, 18);
        juice(G.lock.x, G.lock.y, CORE, 0.7);
      }
    }
    if ((!!G.lock) !== (!!prev) || (G.lock && prev && G.lock.id !== prev.id)) syncHud();
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0;
    const dense = isCore();
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
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < (en.type === 'boss' ? 108 : 124)) en.y += en.vy * dt;
        else {
          en.y = en.type === 'boss' ? 108 : 124;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 92 : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'bacura') {
        en.spin += dt * 2.6;
        en.y += en.vy * dt;
        en.x += Math.sin(en.t * 1.4 + en.phase) * 18 * dt;
      } else if (en.type === 'carrier') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'cone') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 176;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'disc') {
        en.x = en.baseX + Math.sin(en.t * 1.7 + en.phase) * 48;
        en.y += en.vy * dt;
      } else if (en.type === 'ring') {
        if (en.t > 1.2 && Math.random() < dt * 0.45) en.dive = true;
        if (en.dive && en.t > 1.2) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 88, dt * 2);
          en.vy = Math.max(en.vy, 150);
        }
        en.x += en.vx * dt + Math.sin(en.t * 3.2 + en.phase) * 22 * dt;
        en.y += en.vy * dt;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -72 || en.x > VW + 72 || (en.ground && en.y > VH + 42)) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10 && !en.invuln) {
        const canFire = !en.hidden || en.revealed;
        if (canFire) en.fireCd -= dt;
        if (canFire && en.fireCd <= 0) {
          if (en.type === 'ring' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, dense ? 198 : 168, MAG);
            if (dense && Math.random() < 0.4) aimShot(en.x, en.y + 8, 160, PNK);
            en.fireCd = (dense ? 1.28 : 2.2) + rand(0, 0.5);
          } else if (en.type === 'wing' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 6, dense ? 186 : 156, PNK);
            en.fireCd = dense ? 0.86 : 1.18;
          } else if (en.type === 'disc' && en.y > 16 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, dense ? 190 : 158, MINT);
            eShot(en.x - 10, en.y + 4, -32, 146, LIME);
            eShot(en.x + 10, en.y + 4, 32, 146, LIME);
            en.fireCd = dense ? 0.74 : 1.08;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 214 : 174, GOLD);
            if (dense) {
              eShot(en.x - 8, en.y + 4, -42, 160, ORG);
              eShot(en.x + 8, en.y + 4, 42, 160, ORG);
            }
            en.fireCd = (dense ? 0.62 : 1.02) + rand(0, 0.24);
          } else if (en.type === 'bunker' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 206 : 168, SAND);
            eShot(en.x - 12, en.y + 4, -48, 150, GOLD);
            eShot(en.x + 12, en.y + 4, 48, 150, GOLD);
            en.fireCd = dense ? 0.7 : 1.12;
          } else if (en.type === 'silo' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 200 : 166, ORG);
            if (dense && Math.random() < 0.5) ringShot(en.x, en.y, 5, 120, en.t, GOLD, 3);
            en.fireCd = dense ? 0.68 : 1.0;
          } else if (en.type === 'hidden' && en.revealed && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 220 : 180, CORE);
            en.fireCd = dense ? 0.58 : 0.9;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, dense);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt && !en.ground) {
        const rr = (en.type === 'bacura' ? 12 : en.r) + 4.6;
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
      if (s.kind === 'bomb') {
        s.life -= dt;
        const d = hypot(s.x - s.tx, s.y - s.ty);
        if (d < 10 || s.life <= 0 || (s.vy < 0 && s.y <= s.ty) || (s.vy >= 0 && s.y >= s.ty && d < 28)) {
          explodeBomb(s);
          G.shots.splice(i, 1);
          continue;
        }
        if (s.y < -28 || s.x < -20 || s.x > VW + 20 || s.y > VH + 28) {
          G.shots.splice(i, 1);
        }
        continue;
      }
      if (s.y < -22 || s.x < -16 || s.x > VW + 16 || s.y > VH + 24) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (en.ground) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          if (en.invuln) {
            audio.scrape();
            popSpark(s.x, s.y, STEEL, 10);
            emit(3, {
              x: s.x, y: s.y, j: 3,
              vx0: -80, vx1: 80, vy0: -40, vy1: 40,
              life: 0.12, r0: 1, r1: 2, rgb: STEEL, g: 0
            });
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

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.15);
      p.vy += 46 * dt;
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH + 22 || p.t > 9.5) {
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
    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i];
      tr.y += scr * dt;
      if (tr.y - tr.s > VH + 24) {
        tr.y = -40 - rand(0, 50);
        tr.x = hash2((G.scroll + tr.s * 3) | 0) * VW;
        tr.s = 16 + hash2((G.scroll * 0.17) | 0) * 22;
        tr.k = hash2((G.scroll) | 0);
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      wash.push({
        x: G.player.x + rand(-5, 5),
        y: G.player.y + 12,
        t: 0,
        r: rand(5, 9)
      });
      capArr(wash, 16);
    }
    for (let i = wash.length - 1; i >= 0; i--) {
      wash[i].t += dt * 2.6;
      wash[i].y += 32 * dt;
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
    if (G.bombFlash > 0) G.bombFlash = Math.max(0, G.bombFlash - dt * 2.2);
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    pointer.down = false;
    G.fireHold = false;
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
    autoStickS = -1e9;
    autoClearInput();
    autoTx = G.player.x;
    autoTy = G.player.y;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('marsh');
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
        startGame('marsh');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'marsh');
      }
    }
  }

  function autoDanger(x, y, horizon) {
    let d = 0;
    const hitR = 6;
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const relx = s.x - x;
      const rely = s.y - y;
      const vv = s.vx * s.vx + s.vy * s.vy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * s.vx + rely * s.vy) / vv, 0, horizon);
      const dist = hypot(relx + s.vx * t, rely + s.vy * t);
      const rad = hitR + s.r;
      if (t <= horizon && dist < rad + 34) {
        const soon = (horizon - t) / Math.max(0.08, horizon);
        d += Math.max(0.5, rad + 12 - dist) * soon * 26;
        if (dist < rad) d += 260 * soon;
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.hp <= 0) continue;
      if (e.ground) continue;
      let evx = e.vx || 0;
      let evy = e.vy || 0;
      if (e.type === 'cone' && e.y < y - 20) {
        evx = (x - e.x) * 0.9;
        evy = 176;
      } else if (e.type === 'ring' && e.dive && e.y < y - 16) {
        evx = Math.sign(x - e.x) * 88;
        evy = Math.max(evy, 150);
      }
      const relx = e.x - x;
      const rely = e.y - y;
      const vv = evx * evx + evy * evy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * evx + rely * evy) / vv, 0, horizon);
      const dist = hypot(relx + evx * t, rely + evy * t);
      const bodyR = e.type === 'bacura' ? 18 : e.r * 0.72;
      const body = hitR + bodyR;
      if (dist < body + 28) {
        const soon = (horizon - t) / Math.max(0.08, horizon);
        const w = e.type === 'bacura' ? 42 : e.type === 'cone' ? 36 : 18;
        d += Math.max(0.4, body + 14 - dist) * soon * w;
        if (dist < body) d += 250 * soon;
      }
      if (hypot(e.x - x, e.y - y) < body + 8) d += 120;
    }
    return d;
  }

  function autoThink() {
    if (!autoOn) return;
    if (G.mode !== 'play' || G.deadT > 0) {
      G.fireHold = false;
      return;
    }

    const dense = isCore();
    const horizon = dense ? 0.62 : 0.5;
    const px = G.player.x;
    const py = G.player.y;
    const ry = reticleY();
    const spd = plySpd();
    const scr = scrollSpd();

    let air = null;
    let airW = -1e9;
    let ground = null;
    let groundW = -1e9;
    let pick = null;
    let pickW = -1e9;
    let nearbyShots = 0;
    let colShots = 0;
    let bombsAir = 0;
    let colHp = 0;

    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].kind === 'bomb') bombsAir += 1;
    }

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.hp <= 0) continue;
      if (e.y < -40 || e.y > VH + 16) continue;
      if (e.ground) {
        if (e.y < -8 || e.y > VH + 8) continue;
        const lockY = clamp(e.y + RETICLE, 80, VH - 28);
        const eta = hypot(e.x - px, lockY - py) / Math.max(80, spd);
        const predY = (e.type === 'mid' || e.type === 'boss') ? e.y : e.y + scr * eta;
        const dLock = hypot(e.x - px, predY - ry);
        let w = 90;
        if (e.type === 'boss') w = 420 + e.hp * 0.4;
        else if (e.type === 'mid') w = 340 + e.hp * 0.35;
        else if (e.type === 'hidden') w = 210;
        else if (e.type === 'silo') w = 160;
        else if (e.type === 'bunker') w = 140;
        else if (e.type === 'turret') w = 120;
        w -= dLock * 0.32;
        w -= Math.max(0, predY - (VH - 80)) * 0.4;
        if (e.y > 24 && e.y < VH - 24) w += 18;
        if (G.lock === e) w += 80;
        if (w > groundW) {
          groundW = w;
          ground = e;
        }
      } else if (e.type !== 'bacura') {
        if (e.y > py + 20) continue;
        let w = 36 + (e.hp || 1) * 8;
        if (e.type === 'cone') w = 88;
        else if (e.type === 'carrier') w = 170;
        else if (e.type === 'disc') w = 70;
        else if (e.type === 'wing') w = 58;
        w -= Math.abs(e.x - px) * 0.22;
        w -= Math.max(0, py - e.y) * 0.05;
        if (e.y > 40 && e.y < py - 10) w += 22;
        if (Math.abs(e.x - px) < 14 && e.y < py) colHp += e.hp || 1;
        if (w > airW) {
          airW = w;
          air = e;
        }
      }
    }

    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const dist = hypot(s.x - px, s.y - py);
      if (dist < 150) nearbyShots += 1;
      if (Math.abs(s.x - px) < 12 && s.y < py && s.y > py - 280) colShots += 1;
    }

    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      let w = 86 - hypot(p.x - px, p.y - py) * 0.42;
      if (G.powLv < WPN_MAX) w += 70;
      else w += 12;
      if (p.y > py - 50) w += 24;
      if (w > pickW) {
        pickW = w;
        pick = p;
      }
    }

    const hereDang = autoDanger(px, py, horizon);
    const panic = hereDang > 92 || (G.lives <= 1 && hereDang > 58);
    const grabPick = pick && (G.invuln > 0.15 || autoDanger(pick.x, pick.y, 0.28) < 52 || hypot(pick.x - px, pick.y - py) < 96);

    let desiredX = VW * 0.5;
    let desiredY = VH - 118;
    if (air) {
      desiredX = air.x;
      desiredY = clamp(air.y + 158, 210, VH - 72);
    }
    if (ground && !panic) {
      const lockY = (ground.type === 'mid' || ground.type === 'boss')
        ? ground.y
        : ground.y + scr * 0.18;
      desiredX = ground.x;
      desiredY = clamp(lockY + RETICLE, 80, VH - 28);
    }
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
      s -= Math.abs(x - desiredX) * (ground && !panic ? 1.15 : air ? 0.7 : 0.45);
      s -= Math.abs(y - desiredY) * (ground && !panic ? 0.95 : 0.72);
      s -= hypot(x - px, y - py) * 0.1;
      if (y < 150) s -= 28;
      if (y > VH - 36) s -= 6;
      if (x < 40 || x > VW - 40) s -= 12;
      if (air && Math.abs(x - air.x) < 12) s += 24;
      if (ground && !panic && Math.abs(x - ground.x) < 10) s += 18;
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
    if (air) {
      consider(air.x, desiredY);
      consider(air.x, py);
      consider(air.x - 48, desiredY);
      consider(air.x + 48, desiredY);
    }
    if (ground) {
      const gy = clamp(ground.y + RETICLE, yMin, yMax);
      consider(ground.x, gy);
      consider(ground.x, py);
      consider(ground.x - 36, gy);
      consider(ground.x + 36, gy);
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
    if (Math.abs(desiredY - py) > 36 || (grabPick && pick) || (ground && !panic)) {
      switchGap = Math.min(switchGap, 4);
    }
    if (bestS > autoStickS + switchGap || hereDang > 55 || hypot(autoTx - px, autoTy - py) < 5) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    G.fireHold = true;

    if (G.bombCd <= 0 && G.invuln < 0.18) {
      const locked = G.lock && G.lock.hp > 0 ? G.lock : null;
      const aim = locked || ground;
      if (aim && aim.ground && aim.hp > 0) {
        const dRet = hypot(aim.x - px, aim.y - ry);
        const reach = 32 + aim.r * 0.28;
        const big = aim.type === 'boss' || aim.type === 'mid';
        const wantBomb = locked || dRet < reach + 8;
        const ammoOk = big || bombsAir < 2;
        if (wantBomb && ammoOk && !panic) dropBomb();
        else if (locked && big && nearbyShots < 10) dropBomb();
      }
    }
  }

  function updatePlayer(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = plySpd();
    if (autoOn) {
      const ax = autoTx - G.player.x;
      const ay = autoTy - G.player.y;
      const d = hypot(ax, ay);
      const boost = autoSpeed >= 4 ? 1.22 : autoSpeed >= 3 ? 1.06 : autoSpeed <= 1 ? 0.86 : 0.96;
      if (d > 1.2) {
        const step = Math.min(d, spd * dt * boost);
        G.player.x += ax / d * step;
        G.player.y += ay / d * step;
        G.player.vx = ax / d * spd;
        G.player.vy = ay / d * spd;
      } else {
        G.player.vx = 0;
        G.player.vy = 0;
      }
    } else {
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
    }
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 40, VH - 28);
    G.player.bank = lerp(G.player.bank, clamp(G.player.vx / 280, -1, 1), 1 - Math.exp(-dt * 10));
  }

  function tickRumble(dt) {
    G.rumbleT -= dt;
    if (G.rumbleT > 0) return;
    G.rumbleT = G.mode === 'play' && G.deadT <= 0 ? 0.1 : 0.18;
    if (G.mode === 'lose') return;
    if (G.mode === 'play' || G.mode === 'title') audio.rumble();
  }

  function update(dt) {
    tickAutoFlow(dt);
    if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);
    tickRumble(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingAir() < 8) {
        spawnRings(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.spawnT = 2.6;
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
    if (G.bombCd > 0) G.bombCd -= dt;
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
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    if (autoOn) autoThink();
    updatePlayer(dt);
    updateLock();

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isCore()) coreThink(dt);
    else marshThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawTree(tr, bio) {
    const x = tr.x;
    const y = tr.y;
    const s = tr.s;
    ctx.save();
    if (bio === 'waste') {
      ctx.fillStyle = rgba([70 + tr.k * 40, 52, 28], 0.88);
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y - s * 0.35));
      ctx.lineTo(sx(x + s * 0.45), sy(y + s * 0.3));
      ctx.lineTo(sx(x - s * 0.45), sy(y + s * 0.3));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(SAND, 0.28);
      ctx.beginPath();
      ctx.ellipse(sx(x), sy(y + s * 0.22), s * 0.4 * scale, s * 0.12 * scale, 0, 0, TAU);
      ctx.fill();
    } else if (bio === 'core') {
      ctx.strokeStyle = rgba(LIME, 0.22 + tr.k * 0.12);
      ctx.lineWidth = 1.1 * scale;
      const hx = s * 0.38;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y - hx));
      ctx.lineTo(sx(x + hx), sy(y - hx * 0.4));
      ctx.lineTo(sx(x + hx), sy(y + hx * 0.4));
      ctx.lineTo(sx(x), sy(y + hx));
      ctx.lineTo(sx(x - hx), sy(y + hx * 0.4));
      ctx.lineTo(sx(x - hx), sy(y - hx * 0.4));
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba([28 + tr.k * 30, 72 + tr.k * 40, 22], 0.92);
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y - s));
      ctx.lineTo(sx(x + s * 0.58), sy(y + s * 0.42));
      ctx.lineTo(sx(x - s * 0.58), sy(y + s * 0.42));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(LIME, 0.22);
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y - s * 0.55));
      ctx.lineTo(sx(x + s * 0.28), sy(y + s * 0.08));
      ctx.lineTo(sx(x - s * 0.28), sy(y + s * 0.08));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'core') {
      g.addColorStop(0, '#081208');
      g.addColorStop(0.5, '#0c180a');
      g.addColorStop(1, '#060e04');
    } else if (bio === 'waste') {
      g.addColorStop(0, '#181408');
      g.addColorStop(0.45, '#20180c');
      g.addColorStop(1, '#120e06');
    } else {
      g.addColorStop(0, '#0c1c06');
      g.addColorStop(0.4, '#14280a');
      g.addColorStop(1, '#0a1604');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const off = (G.scroll * 0.42) % 64;
    if (bio === 'marsh') {
      ctx.fillStyle = 'rgba(40, 90, 40, 0.18)';
      ctx.fillRect(sx(0), sy(0), 52 * scale, VH * scale);
      ctx.fillRect(sx(VW - 52), sy(0), 52 * scale, VH * scale);
      ctx.strokeStyle = 'rgba(80, 160, 70, 0.16)';
      ctx.lineWidth = 10 * scale;
      ctx.beginPath();
      for (let y = -40; y < VH + 40; y += 12) {
        const wx = VW * 0.5 + Math.sin((y + G.scroll) * 0.018) * 46;
        if (y === -40) ctx.moveTo(sx(wx), sy(y + off * 0.2));
        else ctx.lineTo(sx(wx), sy(y));
      }
      ctx.stroke();
    } else if (bio === 'waste') {
      ctx.fillStyle = 'rgba(180, 140, 60, 0.08)';
      for (let y = -64; y < VH + 64; y += 48) {
        ctx.fillRect(sx(30), sy(y + off), (VW - 60) * scale, 10 * scale);
      }
    } else {
      ctx.strokeStyle = 'rgba(180, 255, 60, 0.08)';
      ctx.lineWidth = 1 * scale;
      const grid = 36;
      const gy = (G.scroll * 0.5) % grid;
      for (let y = -grid; y < VH + grid; y += grid) {
        ctx.beginPath();
        ctx.moveTo(sx(18), sy(y + gy));
        ctx.lineTo(sx(VW - 18), sy(y + gy));
        ctx.stroke();
      }
      for (let x = 18; x < VW; x += grid) {
        ctx.beginPath();
        ctx.moveTo(sx(x), sy(0));
        ctx.lineTo(sx(x), sy(VH));
        ctx.stroke();
      }
    }

    for (let i = 0; i < trees.length; i++) drawTree(trees[i], bio);

    for (let i = 0; i < wash.length; i++) {
      const w = wash[i];
      ctx.fillStyle = rgba(LIME, (1 - w.t) * 0.28);
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), w.r * scale, w.r * 0.4 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.bank * 0.18);
    ctx.scale(scale, scale);
    ctx.shadowColor = rgba(LIME, 0.7);
    ctx.shadowBlur = 12;
    ctx.fillStyle = rgba(LIME, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(5, -6);
    ctx.lineTo(11, 4);
    ctx.lineTo(5, 6);
    ctx.lineTo(3, 16);
    ctx.lineTo(0, 12);
    ctx.lineTo(-3, 16);
    ctx.lineTo(-5, 6);
    ctx.lineTo(-11, 4);
    ctx.lineTo(-5, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-1.1, -16, 2.2, 22);
    ctx.fillStyle = rgba([20, 40, 12], 0.9);
    ctx.beginPath();
    ctx.ellipse(0, -4, 2.2, 4.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MINT, 0.9);
    ctx.beginPath();
    ctx.ellipse(-8, 6, 2.4, 4.2, 0, 0, TAU);
    ctx.ellipse(8, 6, 2.4, 4.2, 0, 0, TAU);
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, Math.min(1, G.muzzle * 12));
      ctx.beginPath();
      ctx.arc(0, -22, 4.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(0, -26, 2.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawReticle() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const x = G.player.x;
    const y = reticleY();
    const locked = !!(G.lock && G.lock.hp > 0);
    const rgb = locked ? (G.lock.hidden ? CORE : GOLD) : LIME;
    const pulse = locked ? 1 + Math.sin(G.t * 14) * 0.12 : 1;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(scale * pulse, scale * pulse);
    ctx.strokeStyle = rgba(rgb, locked ? 0.95 : 0.55);
    ctx.lineWidth = locked ? 1.8 : 1.2;
    ctx.shadowColor = rgba(rgb, 0.7);
    ctx.shadowBlur = locked ? 10 : 4;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -7);
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 16);
    ctx.moveTo(-16, 0);
    ctx.lineTo(-7, 0);
    ctx.moveTo(7, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();
    if (locked) {
      ctx.strokeStyle = rgba(rgb, 0.85);
      ctx.beginPath();
      ctx.moveTo(-18, -10);
      ctx.lineTo(-18, -18);
      ctx.lineTo(-10, -18);
      ctx.moveTo(18, -10);
      ctx.lineTo(18, -18);
      ctx.lineTo(10, -18);
      ctx.moveTo(-18, 10);
      ctx.lineTo(-18, 18);
      ctx.lineTo(-10, 18);
      ctx.moveTo(18, 10);
      ctx.lineTo(18, 18);
      ctx.lineTo(10, 18);
      ctx.stroke();
    }
    ctx.restore();
    if (locked) {
      ctx.save();
      ctx.strokeStyle = rgba(rgb, 0.45 + Math.sin(G.t * 10) * 0.15);
      ctx.lineWidth = 1.2 * scale;
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y));
      ctx.lineTo(sx(G.lock.x), sy(G.lock.y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function drawEnt(en) {
    if (en.hidden && !en.revealed && en.type === 'hidden') {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = rgba(MOSS, 0.5);
      ctx.beginPath();
      ctx.ellipse(sx(en.x), sy(en.y), 10 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    const flash = en.flash > 0;
    const rgb = flash ? WHT : en.rgb;
    const big = en.type === 'mid' || en.type === 'boss';
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    const sc = scale * (en.type === 'boss' ? 1.12 : en.type === 'mid' ? 0.9 : 1);
    ctx.scale(sc, sc);
    ctx.shadowColor = rgba(rgb, 0.55);
    ctx.shadowBlur = big ? 16 : 10;
    ctx.fillStyle = rgba(rgb, 0.95);

    if (en.type === 'turret') {
      ctx.fillRect(-13, -6, 26, 16);
      ctx.fillStyle = rgba(flash ? WHT : GOLD, 0.9);
      ctx.fillRect(-3, -18, 6, 14);
      ctx.fillStyle = rgba(LIME, 0.8);
      ctx.beginPath();
      ctx.arc(0, 2, 5.5, 0, TAU);
      ctx.fill();
    } else if (en.type === 'bunker') {
      ctx.beginPath();
      ctx.moveTo(-16, 8);
      ctx.lineTo(-12, -8);
      ctx.lineTo(12, -8);
      ctx.lineTo(16, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba([20, 28, 12], 0.85);
      ctx.fillRect(-6, -4, 12, 6);
    } else if (en.type === 'silo') {
      ctx.beginPath();
      ctx.arc(0, 2, 13, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([20, 16, 8], 0.85);
      ctx.beginPath();
      ctx.arc(0, 2, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-2, -14, 4, 10);
    } else if (en.type === 'hidden') {
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
    } else if (en.type === 'bacura') {
      ctx.rotate(en.spin);
      ctx.fillStyle = rgba(flash ? WHT : STEEL, 0.95);
      ctx.fillRect(-20, -5, 40, 10);
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.fillRect(-18, -2, 36, 4);
    } else if (en.type === 'carrier') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 10, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
    } else if (en.type === 'disc') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, -2, 10, 5, 0, 0, TAU);
      ctx.fill();
    } else if (en.type === 'cone') {
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(10, -10);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(4, -6);
      ctx.lineTo(-4, -6);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'wing') {
      const flap = Math.sin(en.t * 9) * 6;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(18, flap);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 10);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-18, flap);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'mid') {
      ctx.fillRect(-30, -12, 60, 28);
      ctx.fillStyle = rgba([16, 24, 10], 0.9);
      ctx.fillRect(-18, -6, 36, 12);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.fillRect(-26, -22, 8, 14);
      ctx.fillRect(18, -22, 8, 14);
    } else if (en.type === 'boss') {
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = 3;
      ctx.beginPath();
      const hx = 42;
      ctx.moveTo(0, -hx);
      ctx.lineTo(hx * 0.86, -hx * 0.5);
      ctx.lineTo(hx * 0.86, hx * 0.5);
      ctx.lineTo(0, hx);
      ctx.lineTo(-hx * 0.86, hx * 0.5);
      ctx.lineTo(-hx * 0.86, -hx * 0.5);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = rgba(rgb, 0.22);
      ctx.fill();
      ctx.fillStyle = rgba(CORE, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 0.9);
      ctx.fillRect(-36, -8, 12, 16);
      ctx.fillRect(24, -8, 12, 16);
      ctx.fillRect(-8, -36, 16, 12);
      ctx.fillRect(-8, 24, 16, 12);
    } else {
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(rgb, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.kind === 'bomb') {
        ctx.save();
        ctx.translate(sx(s.x), sy(s.y));
        ctx.scale(scale, scale);
        ctx.shadowColor = rgba(GOLD, 0.8);
        ctx.shadowBlur = 12;
        ctx.fillStyle = rgba(GOLD, 0.96);
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.9);
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, TAU);
        ctx.fill();
        ctx.restore();
        if (!REDUCE) {
          ctx.strokeStyle = rgba(GOLD, 0.35);
          ctx.lineWidth = 1.4 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(s.x), sy(s.y));
          ctx.lineTo(sx(s.tx), sy(s.ty));
          ctx.stroke();
        }
      } else {
        ctx.save();
        ctx.shadowColor = rgba(s.rgb, 0.7);
        ctx.shadowBlur = REDUCE ? 0 : 8;
        ctx.strokeStyle = rgba(s.rgb, 0.95);
        ctx.lineWidth = 2.2 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx(s.x), sy(s.y + 7));
        ctx.lineTo(sx(s.x + s.vx * 0.012), sy(s.y - 8));
        ctx.stroke();
        ctx.restore();
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = rgba(s.rgb || MAG, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r || 3.2) * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 1.6);
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(GOLD, 0.7);
      ctx.shadowBlur = 10;
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba([20, 28, 8], 0.95);
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 1.6);
      ctx.fillText('泽', 0, 1);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / (p.max || 0.3);
      ctx.fillStyle = rgba(p.rgb, clamp(a, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, (1 - r.t) * 0.7);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 22) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' || G.ents[i].type === 'mid') {
        if (!boss || G.ents[i].type === 'boss') boss = G.ents[i];
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
    const st = STAGES[G.stage - 1];
    const name = boss.type === 'boss' ? (st ? st.boss : '关底') : (st ? st.mid : '中核');
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = 'bold ' + (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name + ' · 投弹', sx(x), sy(y - 4));
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(GOLD, G.bombFlash * 0.9);
      ctx.lineWidth = 7 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#081404';
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
      if (!blink) drawShip(G.player.x, G.player.y, 1);
      drawReticle();
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
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wash.length = 0;
    G.lock = null;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'marsh';
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
    G.lock = null;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    G.fireCd = 0;
    G.bombCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.bombFlash = 0;
    G.spawnT = 0.7;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.dropI = 0;
    G.rumbleT = 0;
    G.why = '';
    autoTx = G.player.x;
    autoTy = G.player.y;
    autoStickS = -1e9;
    autoOvWait = 0;
    if (autoOn) G.fireHold = true;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '空核 · 更密更快' : '泽空 · 第 1 区 林泽', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'marsh';
    G.stage = 1;
    G.lives = LIVES;
    G.powLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.lock = null;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    autoOvWait = 0;
    autoTx = G.player.x;
    autoTy = G.player.y;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '泽空',
      '空弹打飞，地弹砸核。准星锁住才炸得准。飞过林泽荒原，再轰空核城。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('marsh');
    else startGame(G.kind || 'marsh');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('marsh');
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
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

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

    if (down && (isMove || space || isBomb || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space && !autoOn) G.fireHold = false;
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
    if (autoOn && (isMove || space || isBomb || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
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
    if (isBomb) {
      if (!e.repeat) dropBomb();
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
      if (!pointer.down && !autoOn) G.fireHold = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  }

  function bindBomb(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      el.classList.add('held');
      dropBomb();
    });
    function up() { el.classList.remove('held'); }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
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
  bindBomb(btnBomb);
  bindBomb(btnPad);

  if (btnMarsh) {
    btnMarsh.addEventListener('click', function () {
      audio.ensure();
      startGame('marsh');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
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
      else if (G.mode === 'win' && isCore()) goTitle();
      else if (G.mode === 'win') startGame('core');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
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
      if (!autoOn) G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
