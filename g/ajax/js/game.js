'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const CX = VW * 0.5;
  const HORIZON = 188;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const BOMB_CAP = 6;
  const PWR_MAX = 3;
  const VIEW_CD = 0.55;
  const VIEW_T = 0.38;
  const BEST_KEY = 'playbox-ajax-best';
  const MUTE_KEY = 'playbox-ajax-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 爆弹 · V / X 切视 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 41];
  const HOT2 = [255, 177, 74];
  const WHT = [255, 244, 234];
  const PNK = [255, 154, 210];
  const RED = [255, 86, 96];
  const ORG = [255, 160, 72];
  const INK = [20, 8, 6];

  const PWR_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'MAX'];
  const DROP_GLYPH = { pwr: '火', bomb: '爆' };

  const STAGES = [
    {
      name: '第 1 关 · 云峡',
      short: '云峡',
      biome: 'canyon',
      startView: 'top',
      mid: '峡台',
      boss: '峡卫',
      midHp: 40,
      bossHp: 96,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.4, kind: 'stream', dir: 1 },
        { t: 6.0, kind: 'turrets' },
        { t: 8.4, kind: 'dive', n: 4 },
        { t: 10.8, kind: 'courier' },
        { t: 13.2, kind: 'scouts' },
        { t: 15.4, kind: 'swap', view: 'into' },
        { t: 17.6, kind: 'heavy' },
        { t: 20.0, kind: 'v', n: 7 },
        { t: 22.4, kind: 'mid' },
        { t: 28.2, kind: 'stream', dir: -1 },
        { t: 30.6, kind: 'dive', n: 5 },
        { t: 33.0, kind: 'turrets' },
        { t: 35.4, kind: 'courier' },
        { t: 37.8, kind: 'heavy' },
        { t: 40.2, kind: 'scouts' },
        { t: 46.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 海脊',
      short: '海脊',
      biome: 'sea',
      startView: 'into',
      mid: '脊炮',
      boss: '脊舰',
      midHp: 52,
      bossHp: 126,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 3.0, kind: 'dive', n: 5 },
        { t: 5.4, kind: 'stream', dir: -1 },
        { t: 7.8, kind: 'turrets' },
        { t: 10.2, kind: 'heavy' },
        { t: 12.6, kind: 'courier' },
        { t: 14.8, kind: 'swap', view: 'top' },
        { t: 16.8, kind: 'scouts' },
        { t: 19.2, kind: 'mid' },
        { t: 25.0, kind: 'stream', dir: 1 },
        { t: 27.4, kind: 'dive', n: 6 },
        { t: 29.8, kind: 'heavy' },
        { t: 32.2, kind: 'turrets' },
        { t: 34.6, kind: 'v', n: 9 },
        { t: 36.8, kind: 'swap', view: 'into' },
        { t: 38.6, kind: 'courier' },
        { t: 41.0, kind: 'scouts' },
        { t: 49.2, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 核门',
      short: '核门',
      biome: 'core',
      startView: 'top',
      mid: '门卫',
      boss: '核门',
      midHp: 66,
      bossHp: 168,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.6, kind: 'stream', dir: 1 },
        { t: 4.4, kind: 'stream', dir: -1 },
        { t: 6.6, kind: 'dive', n: 6 },
        { t: 8.8, kind: 'heavy' },
        { t: 11.0, kind: 'courier' },
        { t: 12.8, kind: 'swap', view: 'into' },
        { t: 14.6, kind: 'scouts' },
        { t: 16.8, kind: 'turrets' },
        { t: 19.0, kind: 'mid' },
        { t: 24.8, kind: 'swap', view: 'top' },
        { t: 26.6, kind: 'dive', n: 7 },
        { t: 28.8, kind: 'heavy' },
        { t: 31.0, kind: 'v', n: 11 },
        { t: 33.2, kind: 'courier' },
        { t: 35.2, kind: 'swap', view: 'into' },
        { t: 37.0, kind: 'stream', dir: 1 },
        { t: 39.2, kind: 'turrets' },
        { t: 41.4, kind: 'heavy' },
        { t: 43.8, kind: 'dive', n: 6 },
        { t: 52.0, kind: 'boss' }
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
  const btnAjax = document.getElementById('btn-ajax');
  const btnCore = document.getElementById('btn-core');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnView = document.getElementById('btn-view');
  const btnPadBomb = document.getElementById('btn-pad-bomb');
  const btnPadView = document.getElementById('btn-pad-view');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const viewLabel = document.getElementById('view-label');
  const pwrLabel = document.getElementById('pwr-label');
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
  let pwrTok = 0;
  let viewTok = 0;
  let nextId = 1;

  const keys = { l: false, r: false, u: false, d: false, bomb: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const flakes = [];
  const isles = [];
  const clouds = [];
  const wash = [];
  const rains = [];
  const streaks = [];
  const PP = { x: 0, y: 0, s: 1 };

  const G = {
    mode: 'title',
    kind: 'ajax',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0, bank: 0 },
    lives: LIVES,
    score: 0,
    best: { a: 0, k: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    pwr: 0,
    bombs: 3,
    bombT: 0,
    rainT: 0,
    rainTick: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    why: '',
    view: 'top',
    blend: 0,
    viewCd: 0,
    rumbleT: 0
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
  function kindBest() {
    return isCore() ? G.best.k : G.best.a;
  }
  function plySpd() {
    return (isCore() ? 310 : 272) + G.pwr * 10;
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 34 : 26;
    const base = isCore() ? 114 : 82;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 8);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isCore() ? 150 : 96;
  }
  function hpMul() {
    return isCore() ? 1.22 : 1;
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'canyon';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
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
      const t = G.ents[i].type;
      if ((t === 'mid' || t === 'boss') && G.ents[i].hp > 0) return G.ents[i];
    }
    return null;
  }

  function projInto(x, y, out) {
    const depth = clamp(y / VH, 0.02, 1);
    const s = lerp(0.14, 1.2, depth * 0.62 + depth * depth * 0.38);
    out.x = CX + (x - CX) * lerp(0.16, 1.02, depth);
    out.y = lerp(HORIZON - 8, VH * 0.92, depth);
    out.s = s;
    return out;
  }

  function proj(x, y, out) {
    if (!out) out = PP;
    const b = G.blend;
    if (b <= 0.001) {
      out.x = x;
      out.y = y;
      out.s = 1;
      return out;
    }
    projInto(x, y, out);
    if (b >= 0.999) return out;
    out.x = lerp(x, out.x, b);
    out.y = lerp(y, out.y, b);
    out.s = lerp(1, out.s, b);
    return out;
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
      this.beep(700 + G.pwr * 52, 0.046, 'square', 0.028, 1680);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.034, 0.032, 1400);
      this.beep(560 * lift, 0.062, 'square', 0.042, 1120 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.11, big ? 0.08 : 0.05, big ? 200 : 440);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.14, 'sawtooth', 0.052, 48);
    },
    bomb() {
      this.ensure();
      this.noise(0.3, 0.084, 150);
      this.beep(86, 0.44, 'sawtooth', 0.072, 36);
      this.beep(560, 0.3, 'sine', 0.048, 1560);
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
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.025, 80);
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
    rumble() {
      this.ensure();
      this.noise(0.02, 0.012, 240);
      this.beep(88, 0.03, 'sine', 0.016, 48);
    },
    swap() {
      this.ensure();
      this.noise(0.12, 0.05, 280);
      this.beep(220, 0.16, 'sawtooth', 0.05, 620);
      this.beep(880, 0.18, 'triangle', 0.04, 220);
    },
    form() {
      this.ensure();
      this.beep(110, 0.24, 'sawtooth', 0.06, 48);
      this.noise(0.18, 0.06, 180);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.best.a = o.a | 0;
        G.best.k = o.k | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.a = n;
      }
    } catch (err) { /* ignore */ }
  }

  function maybeBest() {
    const k = isCore() ? 'k' : 'a';
    if (G.score > G.best[k]) {
      G.best[k] = G.score | 0;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (err) { /* ignore */ }
    }
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n | 0;
    maybeBest();
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    }
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + (n | 0);
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

  function pwrText() {
    if (G.pwr >= PWR_MAX) return '火 MAX';
    if (G.pwr <= 0) return '火';
    return '火 ' + PWR_ROMAN[G.pwr];
  }

  function flashPwr() {
    if (!pwrLabel) return;
    pwrLabel.classList.remove('hot');
    void pwrLabel.offsetWidth;
    pwrLabel.classList.add('hot');
    pwrTok += 1;
    const tok = pwrTok;
    setTimeout(function () {
      if (tok === pwrTok && pwrLabel) pwrLabel.classList.remove('hot');
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
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    if (stageLabel) {
      const st = STAGES[G.stage - 1];
      if (hasBig()) {
        const en = findBig();
        stageLabel.textContent = en && en.type === 'boss'
          ? (st ? st.boss : '关底')
          : (st ? st.mid : '中破');
        stageLabel.classList.add('boss');
      } else {
        stageLabel.textContent = st ? st.short : '云峡';
        stageLabel.classList.remove('boss');
      }
      stageLabel.classList.toggle('hot', G.stage >= 3 || hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '贾核' : '阿贾';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (viewLabel) {
      viewLabel.textContent = G.view === 'into' ? '冲' : '纵';
      viewLabel.classList.toggle('into', G.view === 'into');
    }
    if (pwrLabel) {
      pwrLabel.textContent = pwrText();
      pwrLabel.classList.toggle('max', G.pwr >= PWR_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.disabled = G.mode === 'play' && G.bombs <= 0;
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
    else if (G.mode === 'win') setHint((isCore() ? '贾核尽破' : '阿贾尽破') + ' · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 爆弹 · V 切视', 'warn');
    else setHint('空格射击 · Shift 爆弹 · V 切视 · 吃 火/爆', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'AJAX';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovRetry) ovRetry.textContent = '再飞';
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isCore() ? '换模式' : '贾核';
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const c = cls || (mag >= 6.5 ? 'die' : mag >= 5 ? 'bomb' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('bomb');
    stageEl.classList.remove('swap');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
        stageEl.classList.remove('bomb');
        stageEl.classList.remove('swap');
      }
    }, 420);
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
    flakes.length = 0;
    isles.length = 0;
    clouds.length = 0;
    streaks.length = 0;
    for (let i = 0; i < 52; i++) {
      flakes.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.35),
        a: rand(0.16, 0.55),
        s: rand(2, 9),
        spin: rand(0, TAU)
      });
    }
    for (let i = 0; i < 7; i++) {
      isles.push({
        x: hash2(i * 19 + 4) * VW,
        y: -30 - i * 118,
        w: 40 + hash2(i * 11) * 78,
        h: 22 + hash2(i * 7) * 30,
        kind: hash2(i * 13)
      });
    }
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: hash2(i * 31 + 2) * VW,
        y: -20 - i * 96,
        w: 50 + hash2(i * 17) * 90,
        h: 16 + hash2(i * 9) * 22,
        a: 0.18 + hash2(i * 5) * 0.22
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
      if (G.combo >= 3 && G.combo % 3 === 0) {
        floatText(G.player.x, G.player.y - 28, G.combo + ' 链', GOLD, true);
        hitStop(0.04);
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

  function nextDropKind() {
    const cycle = ['pwr', 'pwr', 'bomb'];
    const k = cycle[G.dropI % cycle.length];
    G.dropI += 1;
    return k;
  }

  function setView(v, forced) {
    if (v !== 'top' && v !== 'into') return;
    if (G.view === v && G.blend === (v === 'into' ? 1 : 0)) return;
    if (!forced && G.viewCd > 0) return;
    G.view = v;
    G.viewCd = VIEW_CD;
    audio.swap();
    hitStop(0.042);
    kick(4.2, 'swap');
    screenFlash(v === 'into' ? HOT2 : CYN, 0.46);
    toast(v === 'into' ? '冲视' : '纵视', false, true);
    if (viewLabel) {
      viewLabel.classList.remove('swap');
      void viewLabel.offsetWidth;
      viewLabel.classList.add('swap');
      viewTok += 1;
      const tok = viewTok;
      setTimeout(function () {
        if (tok === viewTok && viewLabel) viewLabel.classList.remove('swap');
      }, 320);
    }
    syncHud();
  }

  function toggleView() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    setView(G.view === 'into' ? 'top' : 'into', false);
  }

  function spawnEnt(spec) {
    if (G.ents.length > 56) return null;
    const en = {
      id: nextId++,
      type: spec.type,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      r: spec.r || 12,
      w: spec.w || 0,
      hp: spec.hp,
      maxHp: spec.hp,
      score: spec.score || 50,
      rgb: spec.rgb || HOT,
      t: 0,
      fireCd: spec.fireCd || rand(0.4, 1.1),
      phase: spec.phase || 0,
      ground: !!spec.ground,
      drop: spec.drop || null,
      flash: 0,
      spin: 0,
      formed: false,
      dive: false
    };
    G.ents.push(en);
    return en;
  }

  function spawnV(n) {
    const cx = lerp(90, VW - 90, hash2((G.clock * 10) | 0));
    const count = n || 5;
    for (let i = 0; i < count; i++) {
      const side = i - (count - 1) * 0.5;
      spawnEnt({
        type: 'scout',
        x: cx + side * 28,
        y: -24 - Math.abs(side) * 16,
        vx: 0,
        vy: 118 + G.stage * 8,
        r: 11,
        hp: 1,
        score: 50,
        rgb: CYN,
        fireCd: 0.9 + i * 0.08
      });
    }
  }

  function spawnStream(dir) {
    const d = dir || 1;
    for (let i = 0; i < 6; i++) {
      spawnEnt({
        type: 'fighter',
        x: d > 0 ? -20 - i * 26 : VW + 20 + i * 26,
        y: 70 + i * 18,
        vx: d * (148 + G.stage * 10),
        vy: 42,
        r: 12,
        hp: 1,
        score: 80,
        rgb: HOT,
        fireCd: 0.7 + i * 0.1
      });
    }
  }

  function spawnDive(n) {
    const count = n || 4;
    for (let i = 0; i < count; i++) {
      spawnEnt({
        type: 'dive',
        x: 50 + i * ((VW - 100) / Math.max(1, count - 1)),
        y: -30 - i * 22,
        vx: 0,
        vy: 70,
        r: 13,
        hp: 1,
        score: 110,
        rgb: PNK,
        fireCd: 9
      });
    }
  }

  function spawnTurrets() {
    const xs = [90 + rand(0, 40), VW * 0.5 + rand(-20, 20), VW - 110 + rand(0, 30)];
    for (let i = 0; i < xs.length; i++) {
      spawnEnt({
        type: 'turret',
        x: xs[i],
        y: -36 - i * 50,
        vx: 0,
        vy: 0,
        r: 16,
        hp: 3,
        score: 150,
        rgb: ORG,
        ground: true,
        fireCd: 0.8 + i * 0.2
      });
    }
  }

  function spawnHeavy() {
    spawnEnt({
      type: 'heavy',
      x: lerp(80, VW - 80, Math.random()),
      y: -36,
      vx: Math.random() < 0.5 ? -70 : 70,
      vy: 62,
      r: 18,
      hp: 5,
      score: 200,
      rgb: RED,
      fireCd: 0.6,
      drop: Math.random() < 0.28 ? nextDropKind() : null
    });
  }

  function spawnCourier() {
    spawnEnt({
      type: 'courier',
      x: Math.random() < 0.5 ? 70 : VW - 70,
      y: -28,
      vx: 0,
      vy: 96,
      r: 15,
      hp: 3,
      score: 300,
      rgb: GOLD,
      phase: Math.random() < 0.5 ? -1 : 1,
      drop: 'cycle',
      fireCd: 1.1
    });
  }

  function spawnScouts() {
    for (let i = 0; i < 4; i++) {
      spawnEnt({
        type: 'scout',
        x: 60 + i * 110,
        y: -18 - (i % 2) * 20,
        vx: i < 2 ? 40 : -40,
        vy: 128,
        r: 11,
        hp: 1,
        score: 50,
        rgb: CYN
      });
    }
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    spawnEnt({
      type: 'mid',
      x: CX,
      y: -80,
      vx: 70,
      vy: 86,
      r: 28,
      w: 64,
      hp: Math.round((st ? st.midHp : 40) * hpMul()),
      score: 2000,
      rgb: HOT2,
      fireCd: 0.8
    });
    audio.wave();
    toast(st ? st.mid : '中破', false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    spawnEnt({
      type: 'boss',
      x: CX,
      y: -110,
      vx: 58,
      vy: 72,
      r: 38,
      w: 92,
      hp: Math.round((st ? st.bossHp : 96) * hpMul()),
      score: 4000 + 1500 * G.stage,
      rgb: MAG,
      fireCd: 0.9
    });
    audio.boss();
    toast(st ? st.boss : '关底', true, false);
    syncHud();
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'heavy') spawnHeavy();
    else if (w.kind === 'courier') spawnCourier();
    else if (w.kind === 'scouts') spawnScouts();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
    else if (w.kind === 'swap') setView(w.view || (G.view === 'into' ? 'top' : 'into'), true);
  }

  function addShot(spec) {
    if (G.shots.length >= shotCap()) return;
    G.shots.push({
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? -710 : spec.vy,
      r: spec.r || 3.2,
      rgb: spec.rgb || HOT2,
      dmg: spec.dmg || 1,
      ang: spec.ang || 0,
      pierce: !!spec.pierce,
      hits: spec.pierce ? {} : null,
      life: spec.life || 0
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.pwr;
    G.fireCd = lv >= 3 ? 0.072 : lv >= 2 ? 0.084 : lv >= 1 ? 0.096 : 0.108;
    G.muzzle = 0.06;
    const x = G.player.x;
    const y = G.player.y - 16;
    const spd = 710;
    const rgb = lv >= 2 ? GOLD : HOT2;
    function bolt(ox, extraVy, vx, vspd, r) {
      addShot({
        x: x + ox,
        y: y + (extraVy || 0),
        vx: vx || 0,
        vy: -(vspd || spd),
        r: r || 3.2,
        rgb: rgb,
        dmg: 1
      });
    }
    bolt(-7, 0);
    bolt(7, 0);
    if (lv >= 1) bolt(0, -4, 0, spd + 20, 3.6);
    if (lv >= 2) {
      bolt(-16, 6, -90, spd);
      bolt(16, 6, 90, spd);
    }
    if (lv >= 3) {
      bolt(-22, 8, -150, spd, 3.0);
      bolt(22, 8, 150, spd, 3.0);
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

  function doBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.rainT > 0) return;
    if (G.bombs <= 0) {
      toast('爆弹用尽', true, false);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.rainT = 0.72;
    G.rainTick = 0;
    G.bombT = 0.52;
    G.invuln = Math.max(G.invuln, 0.52);
    G.eShots.length = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0) {
        const extra = G.ents[i].ground ? 4 : 0;
        hurtEnt(G.ents[i], 6 + extra, G.ents[i].x, G.ents[i].y);
      }
    }
    audio.bomb();
    hitStop(0.078);
    kick(7.4, 'bomb');
    screenFlash(GOLD, 0.62);
    popSpark(G.player.x, G.player.y, GOLD, 48);
    rings.push({ x: VW * 0.5, y: VH * 0.38, t: 0, rgb: GOLD, r: 28 });
    emit(28, {
      x: VW * 0.5, y: 80, j: 90,
      vx0: -160, vx1: 160, vy0: 80, vy1: 320,
      life: 0.55, r0: 1.4, r1: 4.2, rgb: GOLD, g: 80
    });
    toast('爆弹', false, true);
    syncHud();
  }

  function tickRain(dt) {
    if (G.rainT <= 0) return;
    G.rainT -= dt;
    G.rainTick -= dt;
    if (G.rainTick <= 0) {
      G.rainTick = 0.07;
      const xx = rand(24, VW - 24);
      rains.push({ x: xx, y: -16, t: 0, vy: 520 });
      for (let i = 0; i < G.ents.length; i++) {
        const en = G.ents[i];
        if (en.hp <= 0) continue;
        if (Math.abs(en.x - xx) < 42) hurtEnt(en, en.ground ? 3 : 2, en.x, en.y);
      }
      G.eShots.length = 0;
    }
    if (G.rainT <= 0) G.rainT = 0;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y,
      vx: rand(-50, 50),
      vy: 70,
      t: 0,
      kind: kind || 'pwr'
    });
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
      if (en.type === 'boss' && !en.formed && en.hp < en.maxHp * 0.5) {
        en.formed = true;
        en.r += 10;
        en.w += 18;
        toast('变形', false, true);
        audio.form();
        juice(en.x, en.y, MAG, 1.8);
        floatText(en.x, en.y - 28, '变形', MAG, true);
        hitStop(0.06);
      }
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
    audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'cycle') spawnPow(en.x, en.y, nextDropKind());
    else if (en.drop === 'bomb' || en.drop === 'pwr') spawnPow(en.x, en.y, en.drop);
    else if (en.drop === true) spawnPow(en.x, en.y, nextDropKind());
    else if (en.type === 'heavy' && Math.random() < 0.2) spawnPow(en.x, en.y, nextDropKind());
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(1500 * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      toast((STAGES[G.stage - 1] ? STAGES[G.stage - 1].short : '') + '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        toast('爆 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else {
      if (G.pwr < PWR_MAX) {
        G.pwr += 1;
        toast(G.pwr >= PWR_MAX ? '火 MAX' : '火 强化', false, true);
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
      flashPwr();
    }
    juice(p.x, p.y, p.kind === 'bomb' ? WHT : GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '火', p.kind === 'bomb' ? WHT : GOLD, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    if (G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2, 'die');
    screenFlash(MAG, 0.55);
    if (G.pwr > 0) spawnPow(G.player.x, G.player.y - 18, 'pwr');
    G.pwr = 0;
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
    maybeBest();
    audio.lose();
    showOverlay('lose', '机毁了', '分数 ' + G.score + (kindBest() === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(isCore() ? 10000 : 8000);
    addScore(G.lives * 380);
    G.mode = 'win';
    maybeBest();
    audio.win();
    showOverlay('win', isCore() ? '贾核尽破' : '阿贾尽破', (isCore() ? '贾核通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingAir() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground) n += 1;
    }
    return n;
  }

  function raidThink() {
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
    raidThink();
    G.spawnT -= dt;
    if (G.spawnT <= 0 && livingAir() < 14) {
      const roll = Math.random();
      if (roll < 0.34) spawnV(7);
      else if (roll < 0.55) spawnDive(4);
      else if (roll < 0.72) spawnStream(Math.random() < 0.5 ? -1 : 1);
      else if (roll < 0.86) spawnHeavy();
      else spawnScouts();
      G.spawnT = 2.2 + rand(0, 0.7);
    }
  }

  function eShot(x, y, vx, vy, rgb) {
    if (G.eShots.length > 220) return;
    G.eShots.push({
      x: x, y: y,
      vx: vx, vy: vy,
      r: 3.1,
      rgb: rgb || MAG
    });
  }

  function aimShot(x, y, spd, rgb) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = hypot(dx, dy) || 1;
    eShot(x, y, dx / len * spd, dy / len * spd, rgb);
  }

  function ringShot(x, y, n, spd, ang, rgb, r) {
    for (let i = 0; i < n; i++) {
      const a = ang + (i / n) * TAU;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb);
    }
    void r;
  }

  function bossFire(en, core) {
    const ratio = en.hp / en.maxHp;
    const mid = ratio < 0.62;
    const low = ratio < 0.34;
    en.spin += 0.22;
    const stg = G.stage;
    const formed = !!en.formed;
    if (en.type === 'mid') {
      if (stg === 1) {
        aimShot(en.x, en.y + 10, core ? 196 : 164, HOT);
        eShot(en.x - 18, en.y + 10, -46, 176, CYN);
        eShot(en.x + 18, en.y + 10, 46, 176, CYN);
        if (mid) ringShot(en.x, en.y + 4, core ? 10 : 8, 128, en.spin, GOLD, 3.0);
        en.fireCd = low ? 0.42 : 0.7;
      } else if (stg === 2) {
        ringShot(en.x, en.y + 6, core ? 12 : 9, 134, en.t * 1.6, CYN, 3.05);
        if (mid) aimShot(en.x, en.y + 12, 188, HOT);
        en.fireCd = low ? 0.4 : 0.64;
      } else {
        ringShot(en.x, en.y + 4, core ? 14 : 10, 142, en.spin, RED, 3.1);
        aimShot(en.x - 18, en.y + 8, 176, MAG);
        aimShot(en.x + 18, en.y + 8, 176, MAG);
        en.fireCd = low ? 0.36 : 0.58;
      }
      if (core) en.fireCd *= 0.76;
      return;
    }
    if (stg === 1) {
      eShot(en.x - 32, en.y + 16, -52, 200, RED);
      eShot(en.x, en.y + 20, 0, 216, MAG);
      eShot(en.x + 32, en.y + 16, 52, 200, RED);
      if (mid) ringShot(en.x, en.y + 8, core ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (formed) {
        eShot(en.x - 48, en.y + 8, -28, 168, CYN);
        eShot(en.x + 48, en.y + 8, 28, 168, CYN);
      }
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 16, en.y + 22, k * 44, 214, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 10, core ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 10, core ? 10 : 8, 118, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 18, 200, HOT);
      }
      if (formed) {
        aimShot(en.x - 36, en.y + 8, 188, CYN);
        aimShot(en.x + 36, en.y + 8, 188, CYN);
      }
      if (low) {
        aimShot(en.x - 30, en.y + 12, 224, RED);
        aimShot(en.x + 30, en.y + 12, 224, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 8, core ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 8, core ? 10 : 8, 108, -en.spin * 0.7, GOLD, 2.8);
      if (mid) {
        aimShot(en.x - 22, en.y + 16, 214, PNK);
        aimShot(en.x + 22, en.y + 16, 214, PNK);
      }
      if (formed) {
        ringShot(en.x, en.y, core ? 12 : 10, 160, en.t * 2.4, CYN, 3.2);
      }
      if (low) {
        ringShot(en.x, en.y, core ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (core) en.fireCd *= 0.76;
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let ax = 0;
    let ay = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay -= 1;
    if (keys.d) ay += 1;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.player.x;
      const dy = pointer.y - G.player.y;
      const sp = plySpd();
      G.player.x += clamp(dx, -sp * dt * 1.6, sp * dt * 1.6);
      G.player.y += clamp(dy, -sp * dt * 1.6, sp * dt * 1.6);
    } else {
      const len = hypot(ax, ay) || 1;
      const sp = plySpd();
      G.player.x += (ax / len) * sp * dt;
      G.player.y += (ay / len) * sp * dt;
    }
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 40, VH - 28);
    const want = clamp((keys.r ? 1 : 0) - (keys.l ? 1 : 0), -1, 1);
    if (inputSrc === 'ptr') {
      G.player.bank = lerp(G.player.bank, clamp((pointer.x - G.player.x) / 80, -1, 1), 1 - Math.exp(-dt * 10));
    } else {
      G.player.bank = lerp(G.player.bank, want, 1 - Math.exp(-dt * 10));
    }
    if (G.fireHold) fire();
    if (G.fireCd > 0) G.fireCd -= dt;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.bombT > 0;
    const core = isCore();
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
        const park = lerp(en.type === 'boss' ? 112 : 126, en.type === 'boss' ? 292 : 268, G.blend);
        if (en.y < park) en.y += en.vy * dt;
        else {
          en.y = park;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 96 : 80;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'courier') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && !en.turned) {
          en.turned = true;
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'heavy') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 50 || en.x > VW - 50) en.vx *= -1;
      } else if (en.type === 'dive') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 182;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'scout') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 92, dt * 2);
          en.vy = Math.max(en.vy, 154);
        }
        en.phase += dt * 3.2;
        en.x += en.vx * dt + Math.sin(en.phase || 0) * 8 * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'fighter') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 5) * 16 * dt;
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
          if (en.type === 'scout' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, core ? 198 : 172, MAG);
            if (core && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (core ? 1.3 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'fighter' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, core ? 196 : 164, MAG);
            eShot(en.x - 8, en.y + 6, -24, 156, HOT);
            eShot(en.x + 8, en.y + 6, 24, 156, HOT);
            en.fireCd = core ? 0.78 : 1.12;
          } else if (en.type === 'heavy' && en.y > 20 && en.y < VH - 70) {
            eShot(en.x - 10, en.y + 10, -36, 176, RED);
            eShot(en.x, en.y + 12, 0, 196, RED);
            eShot(en.x + 10, en.y + 10, 36, 176, RED);
            if (core) aimShot(en.x, en.y + 8, 186, HOT);
            en.fireCd = core ? 0.68 : 0.98;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, core ? 218 : 176, ORG);
            if (core) {
              eShot(en.x - 8, en.y + 4, -42, 164, HOT);
              eShot(en.x + 8, en.y + 4, 42, 164, HOT);
            }
            en.fireCd = (core ? 0.62 : 1.02) + rand(0, 0.24);
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, core);
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
      if (s.life > 0) {
        s.life -= dt;
        if (s.life <= 0) {
          G.shots.splice(i, 1);
          continue;
        }
      }
      if (s.y < -28 || s.x < -20 || s.x > VW + 20 || s.y > VH + 28) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (s.pierce && s.hits && s.hits[en.id]) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, s.dmg || 1, s.x, s.y);
          if (s.pierce) {
            if (s.hits) s.hits[en.id] = true;
            hitStop(0.028);
          } else {
            hit = true;
            hitStop(0.022);
          }
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
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
    for (let i = 0; i < flakes.length; i++) {
      const s = flakes[i];
      s.y += scr * 0.55 * s.z * dt;
      s.x += Math.sin(G.t * 0.8 + s.spin) * 10 * dt;
      s.spin += dt * 1.2;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < isles.length; i++) {
      const isl = isles[i];
      isl.y += scr * dt;
      if (isl.y - isl.h > VH + 30) {
        isl.y = -60 - rand(0, 80);
        isl.x = hash2((G.scroll + isl.w) | 0) * VW;
        isl.w = 40 + hash2((G.scroll * 0.1) | 0) * 78;
        isl.h = 22 + hash2((G.scroll * 0.13) | 0) * 30;
        isl.kind = hash2(G.scroll | 0);
      }
    }
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.y += scr * 0.72 * dt;
      if (c.y - c.h > VH + 40) {
        c.y = -50 - rand(0, 70);
        c.x = hash2((G.scroll * 0.3 + i) | 0) * VW;
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      wash.push({
        x: G.player.x + rand(-8, 8),
        y: G.player.y + 14,
        t: 0,
        r: rand(5, 10)
      });
      capArr(wash, 16);
    }
    for (let i = wash.length - 1; i >= 0; i--) {
      wash[i].t += dt * 2.4;
      wash[i].y += 28 * dt;
      if (wash[i].t >= 1) wash.splice(i, 1);
    }
    for (let i = rains.length - 1; i >= 0; i--) {
      rains[i].t += dt;
      rains[i].y += rains[i].vy * dt;
      if (rains[i].y > VH + 20 || rains[i].t > 1.2) rains.splice(i, 1);
    }
    if (G.blend > 0.2 && !REDUCE) {
      if (Math.random() < 0.45) {
        const ang = rand(-0.35, 0.35);
        streaks.push({
          x: CX + Math.sin(ang) * 40,
          y: HORIZON,
          vx: Math.sin(ang) * 220,
          vy: 520 + rand(0, 180),
          t: 0
        });
        capArr(streaks, 28);
      }
    }
    for (let i = streaks.length - 1; i >= 0; i--) {
      streaks[i].t += dt * 2.8;
      streaks[i].x += streaks[i].vx * dt;
      streaks[i].y += streaks[i].vy * dt;
      if (streaks[i].t >= 1 || streaks[i].y > VH + 10) streaks.splice(i, 1);
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
    if (G.bombT > 0) G.bombT -= dt;
  }

  function tickRumble(dt) {
    if (G.blend < 0.35 || G.mode === 'lose' || audio.muted) return;
    G.rumbleT -= dt;
    if (G.rumbleT > 0) return;
    G.rumbleT = 0.088;
    if (audio.ctx) audio.rumble();
  }

  function tickView(dt) {
    const target = G.view === 'into' ? 1 : 0;
    if (REDUCE) {
      G.blend = target;
      return;
    }
    const k = 1 - Math.exp(-dt * (1 / Math.max(0.08, VIEW_T)));
    G.blend = lerp(G.blend, target, k);
    if (Math.abs(G.blend - target) < 0.004) G.blend = target;
    if (G.viewCd > 0) G.viewCd -= dt;
  }

  function nextStage() {
    if (G.stage >= 3) {
      winGame();
      return;
    }
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.stageClearT = 0;
    if (G.bombs < BOMB_CAP) G.bombs += 1;
    const st = STAGES[G.stage - 1];
    if (st) setView(st.startView || 'top', true);
    G.ents.length = 0;
    G.eShots.length = 0;
    toast(st ? st.name : '下一关', false, true);
    audio.wave();
    syncHud();
  }

  function update(dt) {
    G.t += dt;
    updateFx(dt);
    tickView(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      if (G.stop > 0) return;
      G.stop = 0;
    }
    updateWorld(dt);
    if (G.mode === 'title') {
      G.player.x = CX + Math.sin(G.t * 0.7) * 18;
      G.player.y = VH - 96;
      G.player.bank = Math.sin(G.t * 0.7) * 0.35;
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      updateEnts(dt * 0.4);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      return;
    }
    G.clock += dt;
    if (G.stageClearT <= 0 && !hasBig()) G.stageT += dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.invuln > 0) G.invuln -= dt;
    if (G.stageClearT > 0) {
      G.stageClearT -= dt;
      if (G.stageClearT <= 0) nextStage();
    }
    updatePlayer(dt);
    tickRain(dt);
    if (isCore()) coreThink(dt);
    else raidThink();
    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    tickRumble(dt);
  }

  function drawSky() {
    const bio = biome();
    const b = G.blend;
    let top, mid, bot;
    if (bio === 'sea') {
      top = [18, 28, 48];
      mid = [24, 42, 58];
      bot = [12, 22, 28];
    } else if (bio === 'core') {
      top = [42, 10, 28];
      mid = [36, 12, 18];
      bot = [18, 6, 10];
    } else {
      top = [42, 18, 10];
      mid = [28, 12, 8];
      bot = [12, 6, 6];
    }
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, rgba(top, 1));
    g.addColorStop(lerp(0.42, 0.28, b), rgba(mid, 1));
    g.addColorStop(1, rgba(bot, 1));
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (b > 0.04) {
      const hg = ctx.createRadialGradient(sx(CX), sy(HORIZON), 8 * scale, sx(CX), sy(HORIZON), 220 * scale);
      hg.addColorStop(0, rgba(HOT2, 0.28 * b));
      hg.addColorStop(0.45, rgba(HOT, 0.1 * b));
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawGrid() {
    const b = G.blend;
    if (b < 0.04) return;
    ctx.save();
    ctx.globalAlpha = b * 0.55;
    const bio = biome();
    ctx.strokeStyle = bio === 'sea' ? rgba(CYN, 0.35) : bio === 'core' ? rgba(MAG, 0.32) : rgba(HOT2, 0.38);
    ctx.lineWidth = Math.max(1, 1.1 * scale);
    const scr = G.scroll;
    for (let i = 0; i < 20; i++) {
      const y = ((i * 44 + scr * 0.45) % (VH + 60)) - 30;
      const a = proj(0, y, { x: 0, y: 0, s: 1 });
      const c = proj(VW, y, { x: 0, y: 0, s: 1 });
      ctx.beginPath();
      ctx.moveTo(sx(a.x), sy(a.y));
      ctx.lineTo(sx(c.x), sy(c.y));
      ctx.stroke();
    }
    for (let k = -5; k <= 5; k++) {
      const x = CX + k * 52;
      const near = proj(x, VH + 20, { x: 0, y: 0, s: 1 });
      const far = proj(x, 8, { x: 0, y: 0, s: 1 });
      ctx.beginPath();
      ctx.moveTo(sx(far.x), sy(far.y));
      ctx.lineTo(sx(near.x), sy(near.y));
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(GOLD, 0.45);
    const n0 = proj(CX, VH + 20, { x: 0, y: 0, s: 1 });
    const f0 = proj(CX, 8, { x: 0, y: 0, s: 1 });
    ctx.beginPath();
    ctx.moveTo(sx(f0.x), sy(f0.y));
    ctx.lineTo(sx(n0.x), sy(n0.y));
    ctx.stroke();
    ctx.restore();
  }

  function drawWorld() {
    drawSky();
    const bio = biome();
    const b = G.blend;

    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      const p = proj(f.x, f.y, { x: 0, y: 0, s: 1 });
      const rr = f.s * p.s;
      ctx.fillStyle = rgba(bio === 'sea' ? CYN : bio === 'core' ? PNK : HOT2, f.a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.6, rr * scale * 0.35), 0, TAU);
      ctx.fill();
    }

    drawGrid();

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const p = proj(c.x, c.y, { x: 0, y: 0, s: 1 });
      ctx.fillStyle = rgba(WHT, c.a * lerp(0.55, 0.28, b));
      ctx.beginPath();
      ctx.ellipse(sx(p.x), sy(p.y), c.w * 0.5 * p.s * scale, c.h * 0.5 * p.s * scale, 0, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < isles.length; i++) {
      const isl = isles[i];
      const p = proj(isl.x, isl.y, { x: 0, y: 0, s: 1 });
      const col = bio === 'sea' ? [24, 64, 72] : bio === 'core' ? [72, 18, 36] : [64, 32, 16];
      ctx.fillStyle = rgba(col, 0.85);
      ctx.beginPath();
      ctx.ellipse(sx(p.x), sy(p.y), isl.w * 0.5 * p.s * scale, isl.h * 0.5 * p.s * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.18);
      ctx.beginPath();
      ctx.ellipse(sx(p.x), sy(p.y - 4 * p.s), isl.w * 0.28 * p.s * scale, isl.h * 0.22 * p.s * scale, 0, 0, TAU);
      ctx.fill();
    }

    if (b > 0.15) {
      ctx.save();
      ctx.globalAlpha = b * 0.7;
      const wall = bio === 'core' ? MAG : HOT;
      for (let side = -1; side <= 1; side += 2) {
        const x0 = side < 0 ? 8 : VW - 8;
        const a = proj(x0, VH, { x: 0, y: 0, s: 1 });
        const c = proj(x0 + side * 80, 20, { x: 0, y: 0, s: 1 });
        ctx.fillStyle = rgba(wall, 0.12);
        ctx.beginPath();
        ctx.moveTo(sx(side < 0 ? 0 : VW), sy(VH));
        ctx.lineTo(sx(a.x), sy(a.y));
        ctx.lineTo(sx(c.x), sy(c.y));
        ctx.lineTo(sx(side < 0 ? 0 : VW), sy(HORIZON - 20));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    if (!REDUCE) {
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        ctx.strokeStyle = rgba(WHT, (1 - s.t) * 0.35 * G.blend);
        ctx.lineWidth = Math.max(1, 1.4 * scale);
        ctx.beginPath();
        ctx.moveTo(sx(s.x), sy(s.y));
        ctx.lineTo(sx(s.x - s.vx * 0.04), sy(s.y - s.vy * 0.04));
        ctx.stroke();
      }
    }
  }

  function drawShipShape(into, bank) {
    ctx.rotate(bank * 0.42);
    if (into > 0.55) {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(10, 6);
      ctx.lineTo(6, 12);
      ctx.lineTo(-6, 12);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(HOT2, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(5, 4);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.fillRect(-2.2, -6, 4.4, 8);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.ellipse(-6, 12, 2.6, 2.1, 0, 0, TAU);
      ctx.ellipse(6, 12, 2.6, 2.1, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.ellipse(-6, 16, 1.6, 3.2, 0, 0, TAU);
      ctx.ellipse(6, 16, 1.6, 3.2, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(12, 8);
      ctx.lineTo(4, 6);
      ctx.lineTo(7, 14);
      ctx.lineTo(0, 10);
      ctx.lineTo(-7, 14);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(HOT2, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(5, 4);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.fillRect(-1.6, -8, 3.2, 10);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(-10, 1, 6, 1.6);
      ctx.fillRect(4, 1, 6, 1.6);
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.beginPath();
      ctx.moveTo(-4, 10);
      ctx.lineTo(4, 10);
      ctx.lineTo(0, 16);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawPlane(x, y, bank) {
    const p = proj(x, y, { x: 0, y: 0, s: 1 });
    const s = lerp(1, Math.max(0.82, p.s), 0.35);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(scale * s, scale * s);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(0, -20, 5, 0, TAU);
      ctx.fill();
    }
    if (!REDUCE) {
      for (let i = 0; i < wash.length; i++) {
        const w = wash[i];
        if (Math.abs(w.x - x) > 18) continue;
        ctx.fillStyle = rgba(HOT, (1 - w.t) * 0.28);
        ctx.beginPath();
        ctx.ellipse(w.x - x, (w.y - y) + 4, w.r * (1 - w.t * 0.4), w.r * 0.45, 0, 0, TAU);
        ctx.fill();
      }
    }
    drawShipShape(G.blend, bank);
    ctx.restore();
  }

  function drawEnt(en) {
    const p = proj(en.x, en.y, { x: 0, y: 0, s: 1 });
    const s = p.s;
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(scale * s, scale * s);
    const rgb = flash ? WHT : en.rgb;
    if (en.ground && en.type === 'turret') {
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.fillRect(-10, -6, 20, 12);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(-4, -14, 8, 12);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-2, -18, 4, 6);
    } else if (en.type === 'boss' || en.type === 'mid') {
      const w = (en.w || 64) * 0.5;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -w * 0.5);
      ctx.lineTo(w, w * 0.25);
      ctx.lineTo(w * 0.4, w * 0.55);
      ctx.lineTo(-w * 0.4, w * 0.55);
      ctx.lineTo(-w, w * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(INK, 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.22, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      if (en.formed) {
        ctx.strokeStyle = rgba(MAG, 0.7);
        ctx.beginPath();
        ctx.arc(0, 0, w * 0.7, 0, TAU);
        ctx.stroke();
      }
    } else if (en.type === 'heavy') {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.fillRect(-12, -8, 24, 16);
      ctx.fillStyle = rgba(HOT2, 0.9);
      ctx.fillRect(-6, -12, 12, 8);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(-14, 2, 6, 4);
      ctx.fillRect(8, 2, 6, 4);
    } else if (en.type === 'courier') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(-3, -4, 6, 8);
    } else if (en.type === 'dive') {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(9, -8);
      ctx.lineTo(-9, -8);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(8, -6);
      ctx.lineTo(0, -2);
      ctx.lineTo(-8, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(-1.4, -4, 2.8, 6);
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const p = proj(s.x, s.y, { x: 0, y: 0, s: 1 });
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(p.x), sy(p.y), 2.2 * p.s * scale, (REDUCE ? 5 : 8) * p.s * scale, 0, 0, TAU);
      ctx.fill();
      if (!REDUCE) {
        ctx.fillStyle = rgba(WHT, 0.7);
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), 1.1 * p.s * scale, 0, TAU);
        ctx.fill();
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const p = proj(s.x, s.y, { x: 0, y: 0, s: 1 });
      ctx.fillStyle = rgba(s.rgb, 0.92);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), s.r * p.s * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const q = proj(p.x, p.y, { x: 0, y: 0, s: 1 });
      const rgb = p.kind === 'bomb' ? WHT : GOLD;
      ctx.save();
      ctx.translate(sx(q.x), sy(q.y));
      ctx.rotate(p.t * 3);
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -8 * q.s * scale);
      ctx.lineTo(8 * q.s * scale, 0);
      ctx.lineTo(0, 8 * q.s * scale);
      ctx.lineTo(-8 * q.s * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = rgba(INK, 0.9);
      ctx.font = 'bold ' + Math.max(9, 11 * scale * q.s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(DROP_GLYPH[p.kind] || '火', sx(q.x), sy(q.y));
    }
  }

  function drawRain() {
    for (let i = 0; i < rains.length; i++) {
      const r = rains[i];
      const p = proj(r.x, r.y, { x: 0, y: 0, s: 1 });
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(sx(p.x - 1.4 * p.s), sy(p.y - 10 * p.s), 2.8 * p.s * scale, 16 * p.s * scale);
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const q = proj(p.x, p.y, { x: 0, y: 0, s: 1 });
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), Math.max(0.6, p.r * q.s * scale), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const q = proj(s.x, s.y, { x: 0, y: 0, s: 1 });
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = Math.max(1, 1.6 * scale);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), s.rad * s.t * 1.6 * q.s * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const q = proj(r.x, r.y, { x: 0, y: 0, s: 1 });
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = Math.max(1, 2 * scale * (1 - r.t));
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), (r.r + r.t * 36) * q.s * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const q = proj(f.x, f.y, { x: 0, y: 0, s: 1 });
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + Math.max(11, f.size * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(q.x), sy(q.y));
    }
  }

  function drawBossBar() {
    const boss = findBig();
    if (!boss) return;
    const x = 40;
    const y = 18;
    const w = VW - 80;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : HOT, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : HOT, 0.6);
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
    ctx.fillStyle = '#140806';
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
    drawRain();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawPlane(G.player.x, G.player.y, G.player.bank);
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
    rains.length = 0;
    streaks.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'ajax';
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
    G.pwr = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.rainT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    G.fireCd = 0;
    G.fireHold = false;
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
    G.dropI = 0;
    G.why = '';
    G.view = STAGES[0].startView || 'top';
    G.blend = G.view === 'into' ? 1 : 0;
    G.viewCd = 0;
    G.rumbleT = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '贾核 · 弹更密' : '阿贾 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'ajax';
    G.stage = 1;
    G.lives = LIVES;
    G.pwr = 0;
    G.bombs = 3;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.rainT = 0;
    G.view = 'top';
    G.blend = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '阿贾',
      '开三角战机打穿云峡。空格连射，Shift 爆弹清场。V 纵视切冲视。撞机扣命。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('ajax');
    else startGame(G.kind || 'ajax');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('ajax');
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
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const bombKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';
    const viewKey = k === 'v' || k === 'V' || k === 'x' || k === 'X';

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

    if (down && (isMove || space || k === 'Enter' || bombKey || viewKey)) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (bombKey) keys.bomb = false;
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
    if (viewKey) {
      if (!overlayOpen()) toggleView();
      return;
    }
    if (bombKey) {
      if (!keys.bomb) {
        keys.bomb = true;
        if (!overlayOpen() && G.mode === 'play') doBomb();
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

  if (btnAjax) {
    btnAjax.addEventListener('click', function () {
      audio.ensure();
      startGame('ajax');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && isCore()) goTitle();
      else if (G.mode === 'win') startGame('core');
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
  function bombClick(e) {
    if (e) e.preventDefault();
    audio.ensure();
    doBomb();
  }
  function viewClick(e) {
    if (e) e.preventDefault();
    audio.ensure();
    toggleView();
  }
  if (btnBomb) btnBomb.addEventListener('click', bombClick);
  if (btnPadBomb) btnPadBomb.addEventListener('click', bombClick);
  if (btnView) btnView.addEventListener('click', viewClick);
  if (btnPadView) btnPadView.addEventListener('click', viewClick);

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
      keys.bomb = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
