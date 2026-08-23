'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const FIRE_NEED = 8;
  const WPN_MAX = 4;
  const BOMB_MAX = 6;
  const BOMB_START = 3;
  const BEST_KEY = 'playbox-flak-attack-best';
  const MUTE_KEY = 'playbox-flak-attack-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 空炸 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const ORG = [255, 154, 40];
  const AMB = [255, 196, 106];
  const GOLD = [255, 227, 107];
  const WHT = [255, 244, 232];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const RUST = [208, 112, 48];
  const SAND = [200, 136, 72];
  const DUNE = [92, 52, 24];
  const IRON = [72, 40, 28];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const SCORE = {
    dart: 50,
    dive: 80,
    heli: 120,
    gun: 160,
    tank: 180,
    bunker: 150,
    haul: 300,
    mid: 2000,
    boss: 4000,
    clear: 1500,
    all: 8000
  };

  const STAGES = [
    {
      name: '沙原',
      biome: 'dune',
      mid: '沙炮',
      boss: '沙垒',
      midHp: 40,
      bossHp: 96,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.0, kind: 'guns' },
        { t: 5.4, kind: 'stream', dir: 1 },
        { t: 7.8, kind: 'tanks' },
        { t: 10.2, kind: 'dive', n: 4 },
        { t: 12.6, kind: 'haul' },
        { t: 15.0, kind: 'heli' },
        { t: 17.4, kind: 'v', n: 7 },
        { t: 20.2, kind: 'mid' },
        { t: 25.8, kind: 'stream', dir: -1 },
        { t: 28.2, kind: 'guns' },
        { t: 30.6, kind: 'dive', n: 5 },
        { t: 33.0, kind: 'tanks' },
        { t: 35.4, kind: 'heli' },
        { t: 37.8, kind: 'v', n: 7 },
        { t: 40.2, kind: 'haul' },
        { t: 42.6, kind: 'bunkers' },
        { t: 48.0, kind: 'boss' }
      ]
    },
    {
      name: '峡谷',
      biome: 'canyon',
      mid: '峡台',
      boss: '峡堡',
      midHp: 52,
      bossHp: 128,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 2.8, kind: 'guns' },
        { t: 5.0, kind: 'dive', n: 5 },
        { t: 7.4, kind: 'bunkers' },
        { t: 9.6, kind: 'stream', dir: -1 },
        { t: 12.0, kind: 'heli' },
        { t: 14.4, kind: 'haul' },
        { t: 16.8, kind: 'v', n: 9 },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'guns' },
        { t: 27.0, kind: 'dive', n: 6 },
        { t: 29.2, kind: 'tanks' },
        { t: 31.6, kind: 'stream', dir: 1 },
        { t: 34.0, kind: 'heli' },
        { t: 36.4, kind: 'v', n: 9 },
        { t: 38.8, kind: 'haul' },
        { t: 41.2, kind: 'bunkers' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '炮台',
      biome: 'fort',
      mid: '台卫',
      boss: '炮核',
      midHp: 66,
      bossHp: 176,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'heli' },
        { t: 4.4, kind: 'guns' },
        { t: 6.4, kind: 'dive', n: 6 },
        { t: 8.4, kind: 'bunkers' },
        { t: 10.4, kind: 'stream', dir: 1 },
        { t: 12.6, kind: 'haul' },
        { t: 14.6, kind: 'v', n: 9 },
        { t: 16.6, kind: 'tanks' },
        { t: 18.8, kind: 'mid' },
        { t: 24.6, kind: 'dive', n: 7 },
        { t: 26.6, kind: 'guns' },
        { t: 28.8, kind: 'bunkers' },
        { t: 31.0, kind: 'stream', dir: -1 },
        { t: 33.2, kind: 'heli' },
        { t: 35.4, kind: 'v', n: 11 },
        { t: 37.6, kind: 'haul' },
        { t: 39.8, kind: 'dive', n: 6 },
        { t: 42.0, kind: 'tanks' },
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
  const btnFlak = document.getElementById('btn-flak');
  const btnCore = document.getElementById('btn-core');
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
  let haulCycle = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, bm: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const dunes = [];
  const walls = [];
  const tiles = [];
  const grit = [];
  const trails = [];
  const clusters = [];
  const bursts = [];

  const G = {
    mode: 'title',
    kind: 'flak',
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
    bombsStock: BOMB_START,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    fireCd: 0,
    bombCd: 0,
    fireHold: false,
    bombHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ORG,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    why: '',
    burnT: 0,
    burn: 0
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
  function isFire() {
    return G.combo >= FIRE_NEED;
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'dune';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function plySpd() {
    return (isCore() ? 308 : 270) + G.powLv * 8 + (isFire() ? 12 : 0);
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 34 : 26;
    const base = isCore() ? 114 : 82;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 8);
  }
  function hpMul() {
    return isCore() ? 1.22 : 1;
  }
  function shotCap() {
    return isCore() ? 176 : 118;
  }
  function fuseLen() {
    const base = isCore() ? 0.72 : 0.92;
    return clamp(base - (G.stage - 1) * 0.06, 0.52, 1.05);
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
      this.beep(640 + G.powLv * 44, 0.046, 'square', 0.03, 1380);
    },
    flak() {
      this.ensure();
      this.noise(0.09, 0.05, 280);
      this.beep(210, 0.12, 'sawtooth', 0.042, 64);
      this.beep(720, 0.06, 'square', 0.028, 180);
    },
    bomb() {
      this.ensure();
      this.noise(0.24, 0.084, 160);
      this.beep(150, 0.3, 'sawtooth', 0.056, 46);
      this.beep(820, 0.16, 'square', 0.038, 160);
      this.beep(90, 0.22, 'sine', 0.04, 36);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (kind === 'ground') {
        this.noise(0.05, 0.036, 360);
        this.beep(240 * lift, 0.09, 'sawtooth', 0.036, 72);
      } else {
        this.noise(0.034, 0.03, 1400);
        this.beep(540 * lift, 0.062, 'square', 0.04, 920 * lift);
      }
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.1, big ? 0.076 : 0.048, big ? 220 : 460);
      this.beep(big ? 160 : 250, big ? 0.26 : 0.14, 'sawtooth', 0.05, 52);
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
    fire() {
      this.ensure();
      this.beep(392, 0.1, 'square', 0.045, 784);
      this.beep(784, 0.16, 'triangle', 0.04, 1175);
    },
    burn() {
      this.ensure();
      this.beep(68, 0.032, 'sawtooth', 0.01, 48);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 300);
      this.beep(270, 0.22, 'sawtooth', 0.052, 64);
      this.beep(140, 0.32, 'sine', 0.044, 40);
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
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    empty() {
      this.ensure();
      this.beep(160, 0.08, 'square', 0.03, 80);
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
    G.toastT = 1.28;
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
    if (G.powLv >= WPN_MAX) return '爆裂 MAX';
    if (G.powLv <= 0) return '炮';
    return '炮 ' + WPN_ROMAN[G.powLv];
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

  function flashBombHud() {
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
      const info = stageInfo();
      const big = hasBoss() ? info.boss : hasMid() ? info.mid : ('第 ' + G.stage + ' 关 · ' + info.name);
      stageLabel.textContent = big;
      stageLabel.classList.toggle('hot', hasBig() || G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '炮核' : '高炮';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombsStock;
      bombLabel.classList.toggle('empty', G.bombsStock <= 0);
    }
    if (btnBomb) {
      btnBomb.classList.toggle('empty', G.bombsStock <= 0);
      btnBomb.classList.toggle('held', G.bombHold && G.mode === 'play');
    }
    if (btnPadBomb) btnPadBomb.classList.toggle('held', G.bombHold && G.mode === 'play');
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        const fire = isFire();
        comboEl.classList.toggle('ace', fire);
        comboEl.textContent = fire
          ? '炮火 ' + G.combo + ' ×' + G.mult
          : (G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连');
      } else {
        comboEl.hidden = true;
        comboEl.classList.remove('ace');
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint((isCore() ? '炮核尽破' : '高炮尽破') + ' · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 躲开空爆圈 · Shift 空炸', 'warn');
    else if (G.bombsStock <= 0) setHint('空炸用尽 · 吃 爆 补弹 · 炮也能啃堡', 'warn');
    else if (isFire()) setHint('炮火 · 空爆更大 · 空炸清场', 'hot');
    else setHint('空格打空打地 · 躲开空爆圈 · Shift 空炸清弹 · 吃 炮 加宽 吃 爆 补弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'FLAK';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'win') btnOvModes.textContent = isCore() ? '换模式' : '炮核';
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

  function addBurst(x, y, r, rgb, life) {
    bursts.push({
      x: x, y: y,
      r: r || 36,
      t: 0,
      life: life || 0.38,
      rgb: rgb || ORG
    });
    capArr(bursts, 36);
  }

  function seedWorld() {
    dunes.length = 0;
    walls.length = 0;
    tiles.length = 0;
    grit.length = 0;
    const nGrit = REDUCE ? 22 : 48;
    for (let i = 0; i < nGrit; i++) {
      grit.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.35),
        a: rand(0.14, 0.5),
        w: rand(1.2, 3.4)
      });
    }
    for (let i = 0; i < 8; i++) {
      dunes.push({
        x: hash2(i * 17 + 3) * VW,
        y: -40 - i * 100,
        w: 70 + hash2(i * 9) * 90,
        h: 22 + hash2(i * 13) * 28
      });
    }
    for (let i = 0; i < 6; i++) {
      walls.push({
        side: i % 2 === 0 ? -1 : 1,
        y: -30 - i * 140,
        w: 48 + hash2(i * 11) * 36,
        h: 90 + hash2(i * 7) * 50
      });
    }
    for (let i = 0; i < 10; i++) {
      tiles.push({
        x: 40 + hash2(i * 23 + 5) * (VW - 80),
        y: -20 - i * 80,
        w: 28 + hash2(i * 5) * 36,
        h: 16 + hash2(i * 19) * 14
      });
    }
  }

  function bumpCombo() {
    const was = isFire();
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
    if (!was && isFire()) {
      toast('炮火', false, true);
      audio.fire();
      screenFlash(GOLD, 0.28);
      floatText(G.player.x, G.player.y - 28, '炮火', GOLD, true);
    }
    if (G.combo > 0 && G.combo % 3 === 0) {
      hitStop(0.034);
      floatText(G.player.x + rand(-20, 20), G.player.y - 36, G.combo + ' 链', GOLD, true);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function spawnEnt(spec) {
    if (G.ents.length > 56) return null;
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

  function spawnDart(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'dart',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 102,
      hp: 1, r: 10, score: SCORE.dart,
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
    spawnDart(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnDart(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnDart(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnDart(side + rand(-8, 8), -20 - i * 24, {
        vx: dir * -78,
        vy: 126,
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
        vx: 0, vy: 62,
        hp: 1, r: 11, score: SCORE.dive,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnHeli() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'heli',
      x: left ? -28 : VW + 28,
      y: rand(70, 180),
      vx: left ? 92 : -92,
      vy: 22,
      hp: 4, r: 16, score: SCORE.heli,
      rgb: AMB,
      w: 36, h: 18,
      fireCd: rand(0.4, 0.9),
      phase: left ? 1 : -1
    });
  }

  function spawnGun(x, y) {
    spawnEnt({
      type: 'gun',
      x: x, y: y == null ? -26 : y,
      vx: 0, vy: 0,
      hp: 4, r: 13, score: SCORE.gun,
      rgb: ORG,
      ground: true,
      drop: Math.random() < 0.22 ? 'b' : false,
      w: 22, h: 20,
      fireCd: rand(0.4, 1.05)
    });
  }

  function spawnGuns() {
    const n = isCore() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnGun(clamp(x, 40, VW - 40), -24 - i * 18);
    }
  }

  function spawnTank(x) {
    spawnEnt({
      type: 'tank',
      x: x == null ? rand(70, VW - 70) : x,
      y: -28,
      vx: rand(-36, 36),
      vy: 0,
      hp: 5, r: 16, score: SCORE.tank,
      rgb: RUST,
      ground: true,
      drop: Math.random() < 0.2 ? 'b' : false,
      w: 30, h: 18,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnTanks() {
    const n = isCore() ? 3 : 2;
    for (let i = 0; i < n; i++) spawnTank();
  }

  function spawnBunker(x) {
    spawnEnt({
      type: 'bunker',
      x: x == null ? rand(60, VW - 60) : x,
      y: -28,
      vx: 0, vy: 0,
      hp: 7, r: 18, score: SCORE.bunker,
      rgb: IRON,
      ground: true,
      drop: Math.random() < 0.36 ? 'b' : false,
      w: 32, h: 22,
      fireCd: rand(0.55, 1.2)
    });
  }

  function spawnBunkers() {
    const n = isCore() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 64 + i * ((VW - 128) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnBunker(clamp(x, 48, VW - 48));
    }
  }

  function spawnHaul() {
    spawnEnt({
      type: 'haul',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 76,
      hp: 2, r: 14, score: SCORE.haul,
      rgb: GOLD,
      drop: 'p',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
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
      rgb: st.biome === 'canyon' ? RUST : st.biome === 'fort' ? ORG : SAND,
      drop: 'p',
      ground: true,
      w: 78,
      h: 36,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(ORG, 0.36);
    kick(4.6);
  }

  function spawnBoss() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
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
      drop: 'p',
      ground: true,
      w: 104,
      h: 50,
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

  function hasBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function hasMid() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'mid' && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'heli') spawnHeli();
    else if (w.kind === 'guns') spawnGuns();
    else if (w.kind === 'tanks') spawnTanks();
    else if (w.kind === 'bunkers') spawnBunkers();
    else if (w.kind === 'haul') spawnHaul();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38),
      kind: kind === 'b' ? 'b' : 'p'
    });
    capArr(G.pows, 7);
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.05,
      rgb: rgb || MAG,
      kind: 'ball'
    });
  }

  function flakShell(x, y, vx, vy, extra) {
    if (G.eShots.length > shotCap()) return;
    extra = extra || {};
    const fuse = extra.fuse != null ? extra.fuse : fuseLen();
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: extra.r || 4.8,
      rgb: extra.rgb || ORG,
      kind: 'flak',
      fuse: fuse,
      fuseMax: fuse,
      burstN: extra.n || (isCore() ? 10 : 8),
      burstSpd: extra.spd || (isCore() ? 148 : 128)
    });
  }

  function aimFlak(x, y, spd, extra) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = hypot(dx, dy) || 1;
    flakShell(x, y, dx / len * spd, dy / len * spd, extra);
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

  function burstFlak(s) {
    addBurst(s.x, s.y, 42, s.rgb || ORG, 0.36);
    popSpark(s.x, s.y, s.rgb || ORG, 18);
    emit(8, {
      x: s.x, y: s.y, j: 6,
      vx0: -140, vx1: 140, vy0: -140, vy1: 80,
      life: 0.22, r0: 1.2, r1: 2.8, rgb: GOLD, g: 80
    });
    const n = s.burstN || 8;
    const spd = s.burstSpd || 128;
    const rot = rand(0, TAU);
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n;
      eShot(s.x, s.y, Math.cos(a) * spd, Math.sin(a) * spd, AMB, 2.7);
    }
    audio.flak();
  }

  function addShot(spec) {
    if (G.shots.length > 56) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      dmg: spec.dmg || 1,
      fuse: spec.fuse || 0,
      burst: !!spec.burst,
      burstR: spec.burstR || 0
    });
  }

  function splash(x, y, rad, dmg) {
    addBurst(x, y, rad, GOLD, 0.28);
    popSpark(x, y, GOLD, rad * 0.45);
    for (let j = 0; j < G.ents.length; j++) {
      const en = G.ents[j];
      if (en.hp <= 0) continue;
      const dx = en.x - x;
      const dy = en.y - y;
      const rr = rad + en.r;
      if (dx * dx + dy * dy < rr * rr) hurtEnt(en, dmg || 1, x, y);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.powLv;
    const x = G.player.x;
    const y = G.player.y - 16;
    G.muzzle = 0.05;
    G.fireCd = 0.11 - lv * 0.011;
    const spd = -690;
    const rgb = lv >= 3 ? GOLD : lv >= 1 ? AMB : WHT;
    const fireOn = isFire();
    const fuse = lv >= 2 ? (fireOn ? 0.16 : 0.22) : 0;
    const burstR = lv >= 2 ? (18 + lv * 5 + (fireOn ? 10 : 0)) : 0;
    function gun(ox, oy, vx, vy, dmg, col, r, burst) {
      addShot({
        x: x + ox, y: y + oy,
        vx: vx || 0,
        vy: vy == null ? spd : vy,
        r: r || (burst ? 3.8 : 2.9),
        rgb: col || rgb,
        dmg: dmg || 1,
        fuse: burst ? fuse : 0,
        burst: !!burst,
        burstR: burst ? burstR : 0
      });
    }
    if (lv <= 0) {
      gun(-5, 2);
      gun(5, 2);
    } else if (lv === 1) {
      gun(0, -1);
      gun(-10, 3, -28, spd);
      gun(10, 3, 28, spd);
    } else if (lv === 2) {
      gun(0, -2, 0, spd, 1, GOLD, 3.6, true);
      gun(-12, 2, -46, spd);
      gun(12, 2, 46, spd);
      gun(-20, 5, -96, spd);
      gun(20, 5, 96, spd);
    } else if (lv === 3) {
      gun(0, -2, 0, spd, 1, GOLD, 3.8, true);
      gun(-8, 0, -22, spd, 1, AMB, 3.2, true);
      gun(8, 0, 22, spd, 1, AMB, 3.2, true);
      gun(-18, 3, -78, spd);
      gun(18, 3, 78, spd);
    } else {
      gun(0, -3, 0, spd, 2, GOLD, 4.4, true);
      gun(-8, -1, -18, spd, 1, AMB, 3.4, true);
      gun(8, -1, 18, spd, 1, AMB, 3.4, true);
      gun(-16, 2, -62, spd, 1, ORG, 3.2, true);
      gun(16, 2, 62, spd, 1, ORG, 3.2, true);
      gun(-24, 6, -118, spd);
      gun(24, 6, 118, spd);
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
    if (G.bombCd > 0) return;
    if (G.bombsStock <= 0) {
      toast('空炸用尽', true, false);
      audio.empty();
      return;
    }
    G.bombsStock -= 1;
    G.bombCd = 0.52;
    const px = G.player.x;
    const py = G.player.y;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const ang = -1.2 + (i / (n - 1)) * 2.4;
      clusters.push({
        x: px + Math.sin(ang) * 18,
        y: py - 8,
        vx: Math.sin(ang) * 90,
        vy: -220 - i * 18,
        t: 0,
        delay: 0.08 + i * 0.07,
        live: true
      });
    }
    G.invuln = Math.max(G.invuln, 0.48);
    juice(px, py - 24, ORG, 1.5);
    audio.bomb();
    hitStop(0.056);
    kick(6.2);
    screenFlash(ORG, 0.52);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    flashBombHud();
    syncHud();
  }

  function detonateCluster(c) {
    c.live = false;
    addBurst(c.x, c.y, 78, ORG, 0.42);
    popSpark(c.x, c.y, GOLD, 26);
    juice(c.x, c.y, ORG, 1.15);
    const rad = 72;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      const dx = s.x - c.x;
      const dy = s.y - c.y;
      if (dx * dx + dy * dy < (rad + 10) * (rad + 10)) {
        emit(2, {
          x: s.x, y: s.y, j: 3,
          vx0: -40, vx1: 40, vy0: -30, vy1: 40,
          life: 0.14, r0: 1, r1: 2, rgb: GOLD, g: 0
        });
        G.eShots.splice(i, 1);
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dx = en.x - c.x;
      const dy = en.y - c.y;
      const rr = rad + en.r;
      if (dx * dx + dy * dy < rr * rr) {
        hurtEnt(en, en.ground ? 4 : 3, en.x, en.y);
      } else if (dx * dx + dy * dy < (rr + 36) * (rr + 36)) {
        hurtEnt(en, 1, en.x, en.y);
      }
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
      audio.hit('ground', G.combo);
      emit(10, {
        x: en.x, y: en.y, j: 8,
        vx0: -120, vx1: 120, vy0: -80, vy1: 40,
        life: 0.32, r0: 1.4, r1: 3.4, rgb: SAND, g: 280
      });
    } else {
      audio.hit('air', G.combo);
    }
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.type === 'haul') {
      haulCycle += 1;
      spawnPow(en.x, en.y, haulCycle % 3 === 0 ? 'b' : 'p');
    } else if (en.drop === 'p' || en.drop === 'b') {
      spawnPow(en.x, en.y, en.drop);
    } else if (en.drop === true) {
      spawnPow(en.x, en.y, Math.random() < 0.45 ? 'b' : 'p');
    } else if ((en.type === 'gun' || en.type === 'bunker' || en.type === 'tank') && Math.random() < 0.2) {
      spawnPow(en.x, en.y, Math.random() < 0.5 ? 'b' : 'p');
    }
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(SCORE.clear * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      toast(stageInfo().name + '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'b') {
      if (G.bombsStock < BOMB_MAX) {
        G.bombsStock += 1;
        toast(G.bombsStock >= BOMB_MAX ? '爆满' : '空炸 +1', false, true);
      } else {
        addScore(400 * G.mult);
        toast('+400', false, true);
      }
      flashBombHud();
      floatText(p.x, p.y, '爆', GOLD, true);
    } else if (G.powLv < WPN_MAX) {
      G.powLv += 1;
      toast(G.powLv >= WPN_MAX ? '爆裂 MAX' : '高炮加宽', false, true);
      flashWpn();
      floatText(p.x, p.y, '炮', GOLD, true);
    } else if (G.bombsStock < BOMB_MAX) {
      G.bombsStock += 1;
      toast('爆 +1', false, true);
      flashBombHud();
      floatText(p.x, p.y, '爆', GOLD, true);
    } else {
      addScore(500 * G.mult);
      toast('+500', false, true);
      floatText(p.x, p.y, '炮', GOLD, true);
    }
    juice(p.x, p.y, GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
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
    if (G.powLv > 0) spawnPow(G.player.x, G.player.y - 18, 'p');
    G.powLv = 0;
    G.bombsStock = BOMB_START;
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
    addScore(isCore() ? 10000 : SCORE.all);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay(
      'win',
      isCore() ? '炮核尽破' : '高炮尽破',
      (isCore() ? '炮核通关' : '三关打穿') + ' · 分数 ' + G.score
    );
    syncHud();
  }

  function livingAir() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground) n += 1;
    }
    return n;
  }

  function flakThink() {
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
    G.spawnT = clamp(1.42 / (1 + G.stage * 0.12), 0.38, 1.42);
    if (livingAir() > 24) return;
    const r = Math.random();
    if (r < 0.22) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.36) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.48) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.62) spawnGuns();
    else if (r < 0.74) spawnTanks();
    else if (r < 0.84) spawnBunkers();
    else if (r < 0.92) spawnHeli();
    else spawnHaul();
  }

  function bossFire(en, core) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += core ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimFlak(en.x, en.y + 16, core ? 168 : 142);
      eShot(en.x - 18, en.y + 10, -46, 186, PNK);
      eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      if (mid) ringShot(en.x, en.y, core ? 10 : 8, 150, en.spin, GOLD, 3.2);
      if (low) {
        aimFlak(en.x - 22, en.y + 8, 176, { n: 10 });
        aimFlak(en.x + 22, en.y + 8, 176, { n: 10 });
      }
      en.fireCd = low ? 0.36 : mid ? 0.5 : 0.66;
    } else if (stg === 1) {
      aimFlak(en.x, en.y + 18, 154);
      flakShell(en.x - 28, en.y + 12, -40, 120);
      flakShell(en.x + 28, en.y + 12, 40, 120);
      if (mid) ringShot(en.x, en.y + 6, core ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -2; k <= 2; k++) flakShell(en.x + k * 16, en.y + 18, k * 28, 110, { fuse: 0.7 });
      }
      en.fireCd = low ? 0.32 : mid ? 0.46 : 0.6;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, core ? 14 : 11, 146, en.spin, MAG, 3.15);
      aimFlak(en.x - 20, en.y + 10, 150);
      aimFlak(en.x + 20, en.y + 10, 150);
      if (mid) {
        ringShot(en.x, en.y + 8, core ? 10 : 8, 118, -en.spin * 1.4, GOLD, 3.0);
        flakShell(en.x, en.y + 16, 0, 90, { n: 12, fuse: 0.62 });
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
      }
      en.fireCd = low ? 0.32 : mid ? 0.46 : 0.6;
    } else {
      ringShot(en.x, en.y + 6, core ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, core ? 10 : 8, 108, -en.spin * 0.7, ORG, 2.8);
      flakShell(en.x - 24, en.y + 12, -30, 96, { n: 10 });
      flakShell(en.x + 24, en.y + 12, 30, 96, { n: 10 });
      if (mid) {
        aimFlak(en.x - 16, en.y + 14, 168);
        aimFlak(en.x + 16, en.y + 14, 168);
      }
      if (low) {
        ringShot(en.x, en.y, core ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
        flakShell(en.x, en.y + 8, 0, 70, { n: 14, fuse: 0.5, spd: 160 });
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.54;
    }
    if (core) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0;
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
        if (en.type === 'tank') {
          en.x += en.vx * dt;
          if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
        }
        const dx = px - en.x;
        const dy = py - en.y;
        en.ang = Math.atan2(dy, dx);
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < (en.type === 'boss' ? 108 : 124)) en.y += en.vy * dt;
        else {
          en.y = en.type === 'boss' ? 108 : 124;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 92 : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
        en.ang = Math.atan2(py - en.y, px - en.x);
      } else if (en.type === 'haul') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'heli') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 5) * 18 * dt;
        if (en.x > 80 && en.x < VW - 80) en.vx *= Math.exp(-dt * 0.35);
        en.spin += dt * 14;
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
      } else if (en.type === 'dart') {
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
          if (en.type === 'dart' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, core ? 198 : 172, MAG);
            if (core && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (core ? 1.3 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'heli' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, core ? 196 : 164, AMB);
            eShot(en.x - 10, en.y + 6, -28, 150, ORG);
            eShot(en.x + 10, en.y + 6, 28, 150, ORG);
            en.fireCd = core ? 0.72 : 1.08;
          } else if (en.type === 'gun' && en.y > 8 && en.y < VH - 70) {
            aimFlak(en.x, en.y, core ? 148 : 122);
            if (core) {
              flakShell(en.x - 8, en.y + 4, -36, 90, { fuse: fuseLen() * 0.85 });
              flakShell(en.x + 8, en.y + 4, 36, 90, { fuse: fuseLen() * 0.85 });
            }
            en.fireCd = (core ? 0.68 : 1.08) + rand(0, 0.24);
          } else if (en.type === 'tank' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, core ? 204 : 168, RUST);
            if (Math.random() < (core ? 0.7 : 0.4)) aimFlak(en.x, en.y, 110, { fuse: 0.8 });
            en.fireCd = core ? 0.62 : 0.96;
          } else if (en.type === 'bunker' && en.y > 8 && en.y < VH - 70) {
            aimFlak(en.x, en.y, core ? 140 : 116, { n: 10 });
            eShot(en.x - 12, en.y + 4, -48, 154, GOLD);
            eShot(en.x + 12, en.y + 4, 48, 154, GOLD);
            en.fireCd = core ? 0.72 : 1.14;
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
      if (s.fuse > 0) {
        s.fuse -= dt;
        if (s.fuse <= 0 && s.burst) {
          splash(s.x, s.y, s.burstR || 22, s.dmg || 1);
          G.shots.splice(i, 1);
          continue;
        }
      }
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
          if (s.burst) splash(s.x, s.y, s.burstR || 22, s.dmg || 1);
          else hurtEnt(en, s.dmg || 1, s.x, s.y);
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
      if (s.kind === 'flak' && s.fuse != null) {
        s.fuse -= dt;
        if (s.fuse <= 0) {
          burstFlak(s);
          G.eShots.splice(i, 1);
          continue;
        }
      }
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

  function updateClusters(dt) {
    for (let i = clusters.length - 1; i >= 0; i--) {
      const c = clusters[i];
      c.t += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 380 * dt;
      c.vx *= Math.exp(-dt * 0.8);
      if (c.live && c.t >= c.delay) {
        detonateCluster(c);
      }
      if (c.t > c.delay + 0.2 || c.y < -40 || c.y > VH + 40) {
        clusters.splice(i, 1);
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
    for (let i = 0; i < grit.length; i++) {
      const s = grit[i];
      s.y += scr * 0.55 * s.z * dt;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < dunes.length; i++) {
      const d = dunes[i];
      d.y += scr * dt;
      if (d.y - d.h > VH + 30) {
        d.y = -60 - rand(0, 80);
        d.x = hash2((G.scroll + d.w) | 0) * VW;
        d.w = 70 + hash2((G.scroll * 0.1) | 0) * 90;
        d.h = 22 + hash2((G.scroll * 0.13) | 0) * 28;
      }
    }
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      w.y += scr * dt;
      if (w.y - w.h > VH + 30) {
        w.y = -80 - rand(0, 60);
        w.h = 90 + hash2((G.scroll * 0.17) | 0) * 50;
        w.w = 48 + hash2((G.scroll * 0.11) | 0) * 36;
      }
    }
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      t.y += scr * dt;
      if (t.y - t.h > VH + 24) {
        t.y = -40 - rand(0, 50);
        t.x = 40 + hash2((G.scroll + t.w) | 0) * (VW - 80);
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      trails.push({
        x: G.player.x + rand(-4, 4),
        y: G.player.y + 12,
        t: 0,
        r: rand(4, 8)
      });
      capArr(trails, 18);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt * 2.6;
      trails[i].y += 34 * dt;
      if (trails[i].t >= 1) trails.splice(i, 1);
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
    for (let i = bursts.length - 1; i >= 0; i--) {
      bursts[i].t += dt;
      if (bursts[i].t >= bursts[i].life) bursts.splice(i, 1);
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

  function tickBurn(dt) {
    G.burn += dt * (REDUCE ? 4 : 10);
    G.burnT -= dt;
    if (G.burnT > 0) return;
    G.burnT = G.mode === 'play' && G.deadT <= 0 ? 0.088 : 0.16;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.burn();
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
    if (G.stop > 0) {
      G.stop -= dt;
      tickBurn(dt * 0.35);
      return;
    }
    updateFx(dt);
    tickBurn(dt);

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
        if (G.bombsStock < BOMB_MAX) G.bombsStock += 1;
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isCore()) coreThink(dt);
    else flakThink();

    updateEnts(dt);
    updateShots(dt);
    updateClusters(dt);
    updatePows(dt);
  }

  function drawDune(d) {
    const x = sx(d.x);
    const y = sy(d.y);
    const w = d.w * scale;
    const h = d.h * scale;
    ctx.fillStyle = 'rgba(92, 52, 24, 0.9)';
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.55, h * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(SAND, 0.38);
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.12, w * 0.32, h * 0.22, 0, 0, TAU);
    ctx.fill();
  }

  function drawWall(w) {
    const side = w.side;
    const x = sx(side < 0 ? w.w * 0.45 : VW - w.w * 0.45);
    const y = sy(w.y);
    const ww = w.w * scale;
    const hh = w.h * scale;
    ctx.fillStyle = 'rgba(72, 32, 16, 0.92)';
    ctx.beginPath();
    ctx.moveTo(x - ww * 0.5, y + hh * 0.5);
    ctx.lineTo(x - ww * 0.2, y - hh * 0.5);
    ctx.lineTo(x + ww * 0.35, y - hh * 0.35);
    ctx.lineTo(x + ww * 0.5, y + hh * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(RUST, 0.35);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
  }

  function drawTile(t) {
    const x = sx(t.x);
    const y = sy(t.y);
    const w = t.w * scale;
    const h = t.h * scale;
    ctx.fillStyle = 'rgba(48, 24, 16, 0.88)';
    ctx.fillRect(x - w * 0.5, y - h * 0.5, w, h);
    ctx.strokeStyle = rgba(ORG, 0.28);
    ctx.lineWidth = 1;
    ctx.strokeRect(x - w * 0.5, y - h * 0.5, w, h);
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'canyon') {
      g.addColorStop(0, '#1a0c08');
      g.addColorStop(0.5, '#160a06');
      g.addColorStop(1, '#100806');
    } else if (bio === 'fort') {
      g.addColorStop(0, '#160a08');
      g.addColorStop(0.46, '#120808');
      g.addColorStop(1, '#0e0606');
    } else {
      g.addColorStop(0, '#1c1006');
      g.addColorStop(0.5, '#160c06');
      g.addColorStop(1, '#100804');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < grit.length; i++) {
      const s = grit[i];
      ctx.fillStyle = rgba(AMB, s.a * 0.55);
      ctx.fillRect(sx(s.x), sy(s.y), s.w * s.z * scale * 0.4, s.w * s.z * scale * 0.4);
    }

    if (bio === 'canyon') {
      for (let i = 0; i < walls.length; i++) drawWall(walls[i]);
      for (let i = 0; i < dunes.length; i++) {
        if (i % 2 === 0) drawDune(dunes[i]);
      }
    } else if (bio === 'fort') {
      for (let i = 0; i < tiles.length; i++) drawTile(tiles[i]);
      for (let i = 0; i < dunes.length; i++) {
        if (i % 3 === 0) drawDune(dunes[i]);
      }
    } else {
      for (let i = 0; i < dunes.length; i++) drawDune(dunes[i]);
    }

    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      ctx.fillStyle = rgba(isFire() ? GOLD : ORG, (1 - t.t) * 0.45);
      ctx.beginPath();
      ctx.ellipse(sx(t.x), sy(t.y), t.r * scale, t.r * 0.6 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawJet(x, y, a, enemy, flashHit, rgb) {
    const px = sx(x);
    const py = sy(y);
    const s = scale;
    ctx.save();
    ctx.translate(px, py);
    const bank = enemy ? 0 : (G.player.bank || 0);
    ctx.rotate(bank);
    if (flashHit) {
      ctx.globalAlpha = 0.85;
    }
    const col = enemy ? (rgb || MAG) : (isFire() ? GOLD : ORG);
    const wing = enemy ? AMB : GOLD;
    if (!enemy && !REDUCE) {
      const pulse = 0.7 + Math.sin(G.burn * 9) * 0.3;
      ctx.fillStyle = rgba(isFire() ? GOLD : ORG, 0.45 * pulse);
      ctx.beginPath();
      ctx.moveTo(-4 * s, 10 * s);
      ctx.lineTo(0, (18 + pulse * 8) * s);
      ctx.lineTo(4 * s, 10 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(col, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16 * a * s);
    ctx.lineTo(11 * a * s, 8 * s);
    ctx.lineTo(3 * s, 6 * s);
    ctx.lineTo(0, 12 * s);
    ctx.lineTo(-3 * s, 6 * s);
    ctx.lineTo(-11 * a * s, 8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(wing, 0.85);
    ctx.beginPath();
    ctx.moveTo(-11 * a * s, 8 * s);
    ctx.lineTo(-16 * a * s, 12 * s);
    ctx.lineTo(-4 * s, 7 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11 * a * s, 8 * s);
    ctx.lineTo(16 * a * s, 12 * s);
    ctx.lineTo(4 * s, 7 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.fillRect(-1.2 * s, -8 * s, 2.4 * s, 10 * s);
    if (!enemy && G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(0, -18 * s, 4 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGun(en) {
    const x = sx(en.x);
    const y = sy(en.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 6 * s, 12 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(en.rgb, en.flash > 0 ? 1 : 0.92);
    ctx.beginPath();
    ctx.arc(0, 0, 9 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(ORG, 0.7);
    ctx.lineWidth = 1.4 * s;
    ctx.stroke();
    ctx.rotate(en.ang || -Math.PI / 2);
    ctx.fillStyle = rgba(SAND, 0.95);
    ctx.fillRect(4 * s, -2.2 * s, 16 * s, 4.4 * s);
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(16 * s, -1.2 * s, 5 * s, 2.4 * s);
    ctx.restore();
  }

  function drawTank(en) {
    const x = sx(en.x);
    const y = sy(en.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(en.rgb, en.flash > 0 ? 1 : 0.92);
    ctx.fillRect(-14 * s, -8 * s, 28 * s, 16 * s);
    ctx.fillStyle = rgba(SAND, 0.7);
    ctx.fillRect(-16 * s, 4 * s, 32 * s, 6 * s);
    ctx.fillStyle = rgba(IRON, 0.9);
    ctx.beginPath();
    ctx.arc(0, -2 * s, 7 * s, 0, TAU);
    ctx.fill();
    ctx.rotate(en.ang || -Math.PI / 2);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(4 * s, -1.6 * s, 14 * s, 3.2 * s);
    ctx.restore();
  }

  function drawBunker(en) {
    const x = sx(en.x);
    const y = sy(en.y);
    const s = scale;
    ctx.fillStyle = rgba(en.rgb, en.flash > 0 ? 1 : 0.94);
    ctx.fillRect(x - 16 * s, y - 10 * s, 32 * s, 20 * s);
    ctx.fillStyle = rgba(ORG, 0.45);
    ctx.fillRect(x - 10 * s, y - 6 * s, 20 * s, 8 * s);
    ctx.strokeStyle = rgba(GOLD, 0.4);
    ctx.lineWidth = 1.2 * s;
    ctx.strokeRect(x - 16 * s, y - 10 * s, 32 * s, 20 * s);
    ctx.fillStyle = rgba(RED, 0.8);
    ctx.beginPath();
    ctx.arc(x, y - 2 * s, 3.2 * s, 0, TAU);
    ctx.fill();
  }

  function drawHeli(en) {
    const x = sx(en.x);
    const y = sy(en.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(en.rgb, en.flash > 0 ? 1 : 0.92);
    ctx.beginPath();
    ctx.ellipse(0, 2 * s, 16 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(IRON, 0.85);
    ctx.fillRect(-2 * s, -6 * s, 4 * s, 8 * s);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.3 * s;
    const ang = en.spin || 0;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 18 * s, -6 * s + Math.sin(ang) * 4 * s);
    ctx.lineTo(Math.cos(ang + Math.PI) * 18 * s, -6 * s + Math.sin(ang + Math.PI) * 4 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang + 1.57) * 14 * s, -6 * s + Math.sin(ang + 1.57) * 3 * s);
    ctx.lineTo(Math.cos(ang + 4.71) * 14 * s, -6 * s + Math.sin(ang + 4.71) * 3 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawHaul(en) {
    const x = sx(en.x);
    const y = sy(en.y);
    const s = scale;
    ctx.fillStyle = rgba(en.rgb, en.flash > 0 ? 1 : 0.92);
    ctx.beginPath();
    ctx.moveTo(x, y - 14 * s);
    ctx.lineTo(x + 12 * s, y + 8 * s);
    ctx.lineTo(x - 12 * s, y + 8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(ORG, 0.7);
    ctx.fillRect(x - 4 * s, y - 2 * s, 8 * s, 8 * s);
  }

  function drawBig(en) {
    const x = sx(en.x);
    const y = sy(en.y);
    const s = scale;
    const boss = en.type === 'boss';
    const w = (boss ? 52 : 40) * s;
    const h = (boss ? 26 : 20) * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.fillRect(-w, -h * 0.4, w * 2, h);
    ctx.fillStyle = rgba(en.rgb, en.flash > 0 ? 1 : 0.88);
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.85, h * 0.7, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(ORG, 0.7);
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    const guns = boss ? 4 : 3;
    for (let i = 0; i < guns; i++) {
      const gx = ((i + 0.5) / guns - 0.5) * w * 1.5;
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(gx, h * 0.25, 5 * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(RED, 0.8);
    ctx.beginPath();
    ctx.arc(0, -4 * s, (boss ? 6 : 4.5) * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnt(en) {
    if (en.flash > 0 && ((G.t * 40) | 0) % 2 === 0) {
      ctx.globalCompositeOperation = 'lighter';
    }
    if (en.type === 'dart' || en.type === 'dive') {
      drawJet(en.x, en.y, en.type === 'dive' ? 0.85 : 0.78, true, en.flash > 0, en.rgb);
    } else if (en.type === 'heli') {
      drawHeli(en);
    } else if (en.type === 'gun') {
      drawGun(en);
    } else if (en.type === 'tank') {
      drawTank(en);
    } else if (en.type === 'bunker') {
      drawBunker(en);
    } else if (en.type === 'haul') {
      drawHaul(en);
    } else if (en.type === 'mid' || en.type === 'boss') {
      drawBig(en);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = sx(s.x);
      const y = sy(s.y);
      ctx.fillStyle = rgba(s.rgb, 0.95);
      if (s.burst) {
        ctx.beginPath();
        ctx.arc(x, y, s.r * scale, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(GOLD, 0.7);
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();
      } else {
        ctx.fillRect(x - 1.4 * scale, y - 7 * scale, 2.8 * scale, 10 * scale);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = sx(s.x);
      const y = sy(s.y);
      if (s.kind === 'flak') {
        const ratio = s.fuseMax > 0 ? clamp(s.fuse / s.fuseMax, 0, 1) : 1;
        const warn = ratio < 0.38;
        if (warn && !REDUCE) {
          const wr = (18 + (1 - ratio / 0.38) * 22) * scale;
          ctx.strokeStyle = rgba(ORG, 0.28 + (1 - ratio) * 0.4);
          ctx.lineWidth = 1.6 * scale;
          ctx.beginPath();
          ctx.arc(x, y, wr, 0, TAU);
          ctx.stroke();
        }
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.beginPath();
        ctx.arc(x, y, s.r * scale, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(GOLD, 0.55 + (1 - ratio) * 0.4);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.arc(x, y, (s.r + 2) * scale, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - ratio));
        ctx.stroke();
      } else {
        ctx.fillStyle = rgba(s.rgb, 0.92);
        ctx.beginPath();
        ctx.arc(x, y, s.r * scale, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawClusters() {
    for (let i = 0; i < clusters.length; i++) {
      const c = clusters[i];
      if (!c.live) continue;
      const x = sx(c.x);
      const y = sy(c.y);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 4.4 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(ORG, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
  }

  function drawBursts() {
    for (let i = 0; i < bursts.length; i++) {
      const b = bursts[i];
      const k = b.t / b.life;
      const r = b.r * (0.35 + k * 0.9) * scale;
      ctx.strokeStyle = rgba(b.rgb, (1 - k) * 0.85);
      ctx.lineWidth = (3.4 - k * 2.2) * scale;
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), r, 0, TAU);
      ctx.stroke();
      if (!REDUCE) {
        ctx.strokeStyle = rgba(GOLD, (1 - k) * 0.4);
        ctx.lineWidth = 1.1 * scale;
        ctx.beginPath();
        ctx.arc(sx(b.x), sy(b.y), r * 0.62, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const spin = p.t * 3.2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spin);
      ctx.fillStyle = p.kind === 'b' ? rgba(ORG, 0.95) : rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -9 * scale);
      ctx.lineTo(8 * scale, 0);
      ctx.lineTo(0, 9 * scale);
      ctx.lineTo(-8 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2a1400';
      ctx.font = 'bold ' + Math.round(10 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-spin);
      ctx.fillText(p.kind === 'b' ? '爆' : '炮', 0, 0.5 * scale);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / (p.max || 0.3), 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, (1 - r.t) * 0.55);
      ctx.lineWidth = 2 * scale;
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
      ctx.font = 'bold ' + Math.round(f.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawBossBar() {
    let en = null;
    for (let i = 0; i < G.ents.length; i++) {
      if ((G.ents[i].type === 'boss' || G.ents[i].type === 'mid') && G.ents[i].hp > 0) {
        en = G.ents[i];
        break;
      }
    }
    if (!en) return;
    const x = sx(40);
    const y = sy(18);
    const w = (VW - 80) * scale;
    const h = 7 * scale;
    ctx.fillStyle = 'rgba(20, 10, 4, 0.7)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = rgba(en.type === 'boss' ? MAG : ORG, 0.9);
    ctx.fillRect(x, y, w * clamp(en.hp / en.maxHp, 0, 1), h);
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140a04';
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
    drawBursts();
    drawClusters();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawJet(G.player.x, G.player.y, 1, false);
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
    clusters.length = 0;
    bursts.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'flak';
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
    G.bombsStock = BOMB_START;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    G.fireCd = 0;
    G.bombCd = 0;
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
    G.burnT = 0;
    G.why = '';
    haulCycle = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '炮核 · 空爆更密' : '高炮 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'flak';
    G.stage = 1;
    G.lives = LIVES;
    G.powLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.bombsStock = BOMB_START;
    G.deadT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '高炮',
      '纵版战斗机。地面高炮打定时空爆，躲开破片再反击。空格连射，Shift 空炸清弹。沙原、峡谷、炮台。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('flak');
    else startGame(G.kind || 'flak');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('flak');
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

  function tryBomb() {
    audio.ensure();
    if (overlayOpen()) return;
    if (G.mode === 'play') dropBomb();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const bombKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';

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

  if (btnFlak) {
    btnFlak.addEventListener('click', function () {
      audio.ensure();
      startGame('flak');
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
  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      G.bombHold = true;
      tryBomb();
    });
    el.addEventListener('pointerup', function () { G.bombHold = false; });
    el.addEventListener('pointerleave', function () { G.bombHold = false; });
  }
  bindBombBtn(btnBomb);
  bindBombBtn(btnPadBomb);

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
      G.fireHold = false;
      G.bombHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
