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
  const WPN_MAX = 3;
  const BOMB_MAX = 6;
  const BOMB_START = 3;
  const BEST_KEY = 'playbox-cosmo-gang-best';
  const MUTE_KEY = 'playbox-cosmo-gang-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 黑洞 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 74, 216];
  const CYN = [200, 160, 255];
  const SKY = [232, 212, 255];
  const GOLD = [255, 227, 107];
  const WHT = [246, 236, 255];
  const PNK = [255, 154, 220];
  const RED = [255, 86, 130];
  const HOT = [180, 122, 255];
  const VIO = [138, 92, 255];
  const LIME = [140, 255, 168];
  const YEL = [255, 230, 90];
  const AMBER = [255, 180, 80];
  const NEON = [255, 80, 200];
  const STEEL = [140, 110, 168];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'MAX'];

  const SCORE = {
    gang: 50,
    dive: 90,
    thug: 140,
    coin: 80,
    box: 150,
    crate: 200,
    save: 400,
    thief: 120,
    bakuto: 300,
    drake: 280,
    spark: 15,
    mid: 2000,
    boss: 4000,
    wipe: 500,
    clear: 1500,
    all: 8000
  };

  const STAGES = [
    {
      name: '霓虹巷',
      biome: 'alley',
      mid: '巷霸',
      boss: '巷门',
      midHp: 42,
      bossHp: 100,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.2, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'dive', n: 4 },
        { t: 8.0, kind: 'v', n: 7 },
        { t: 10.6, kind: 'boxes' },
        { t: 13.0, kind: 'thug' },
        { t: 15.4, kind: 'haul' },
        { t: 17.8, kind: 'v', n: 7 },
        { t: 20.4, kind: 'mid' },
        { t: 26.2, kind: 'stream', dir: -1 },
        { t: 28.6, kind: 'dive', n: 5 },
        { t: 31.0, kind: 'boxes' },
        { t: 33.4, kind: 'v', n: 7 },
        { t: 36.0, kind: 'thug' },
        { t: 38.4, kind: 'haul' },
        { t: 40.8, kind: 'dive', n: 5 },
        { t: 46.6, kind: 'boss' }
      ]
    },
    {
      name: '货仓港',
      biome: 'dock',
      mid: '仓卫',
      boss: '货舰',
      midHp: 54,
      bossHp: 128,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 2.8, kind: 'coins' },
        { t: 5.2, kind: 'cargo' },
        { t: 7.6, kind: 'dive', n: 5 },
        { t: 10.0, kind: 'boxes' },
        { t: 12.4, kind: 'thug' },
        { t: 14.8, kind: 'v', n: 9 },
        { t: 17.2, kind: 'haul' },
        { t: 19.6, kind: 'mid' },
        { t: 25.4, kind: 'cargo' },
        { t: 27.8, kind: 'coins' },
        { t: 30.2, kind: 'stream', dir: 1 },
        { t: 32.6, kind: 'dive', n: 6 },
        { t: 35.0, kind: 'boxes' },
        { t: 37.4, kind: 'v', n: 9 },
        { t: 39.8, kind: 'haul' },
        { t: 42.2, kind: 'cargo' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '帮核城',
      biome: 'keep',
      mid: '龙帮',
      boss: '堂主',
      midHp: 68,
      bossHp: 180,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.6, kind: 'drake' },
        { t: 5.0, kind: 'coins' },
        { t: 7.2, kind: 'dive', n: 6 },
        { t: 9.4, kind: 'thug' },
        { t: 11.6, kind: 'boxes' },
        { t: 13.8, kind: 'cargo' },
        { t: 16.0, kind: 'v', n: 9 },
        { t: 18.4, kind: 'mid' },
        { t: 24.4, kind: 'drake' },
        { t: 26.6, kind: 'dive', n: 7 },
        { t: 28.8, kind: 'coins' },
        { t: 31.0, kind: 'stream', dir: -1 },
        { t: 33.2, kind: 'thug' },
        { t: 35.4, kind: 'v', n: 11 },
        { t: 37.6, kind: 'haul' },
        { t: 39.8, kind: 'drake' },
        { t: 42.0, kind: 'boxes' },
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
  const btnRaid = document.getElementById('btn-raid');
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

  const keys = { l: false, r: false, u: false, d: false, sht: false, bm: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const signs = [];
  const swirls = [];
  const ghosts = [];

  const G = {
    mode: 'title',
    kind: 'raid',
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
    shield: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    gems: [],
    gangs: {},
    gangSeq: 0,
    fireCd: 0,
    bombCd: 0,
    fireHold: false,
    bombHold: false,
    deadT: 0,
    invuln: 0,
    hole: { on: false, x: 240, y: 360, t: 0, life: 0.92, rad: 0, maxRad: 196, dmgT: 0 },
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    diveCd: 0,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    why: '',
    pulseT: 0,
    pulseAng: 0,
    ghostT: 0
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
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'alley';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function plySpd() {
    return (isCore() ? 310 : 272) + G.powLv * 8 + (G.combo >= 8 ? 12 : 0);
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 36 : 28;
    const base = isCore() ? 116 : 84;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 8);
  }
  function hpMul() {
    return isCore() ? 1.22 : 1;
  }
  function shotCap() {
    return isCore() ? 172 : 116;
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
      this.beep(840 + G.powLv * 52, 0.04, 'square', 0.028, 1680);
    },
    hole() {
      this.ensure();
      this.noise(0.22, 0.07, 180);
      this.beep(140, 0.34, 'sine', 0.06, 48);
      this.beep(420, 0.2, 'sawtooth', 0.04, 90);
      this.beep(980, 0.12, 'triangle', 0.03, 220);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (kind === 'ground') {
        this.noise(0.05, 0.036, 420);
        this.beep(260 * lift, 0.09, 'sawtooth', 0.036, 80);
      } else {
        this.noise(0.032, 0.03, 1400);
        this.beep(640 * lift, 0.06, 'square', 0.04, 1100 * lift);
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
    jack() {
      this.ensure();
      this.beep(330, 0.06, 'square', 0.05, 660);
      this.beep(660, 0.08, 'square', 0.045, 990);
      this.beep(1320, 0.14, 'triangle', 0.04, 1760);
    },
    wipe() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.045, 784);
      this.beep(784, 0.1, 'triangle', 0.04, 1176);
      this.beep(1176, 0.16, 'sine', 0.04, 1568);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    pulse() {
      this.ensure();
      this.beep(540, 0.026, 'sine', 0.008, 420);
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
    gem() {
      this.ensure();
      this.beep(1480, 0.05, 'sine', 0.028, 1980);
    },
    shield() {
      this.ensure();
      this.beep(880, 0.08, 'triangle', 0.04, 440);
      this.noise(0.08, 0.04, 800);
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
    if (G.powLv >= WPN_MAX) return '拍 MAX';
    if (G.powLv <= 0) return '拍';
    return '拍 ' + WPN_ROMAN[G.powLv];
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
      tagLabel.textContent = isCore() ? '帮核' : '星帮';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '洞 ×' + G.bombsStock;
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
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
        comboEl.classList.toggle('ace', G.combo >= 8);
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint((isCore() ? '帮核尽破' : '星帮尽破') + ' · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格射帮众 · Shift 黑洞开路', 'warn');
    else if (G.bombsStock <= 0) setHint('黑洞用尽 · 吃 洞 补弹 · 清一帮仍会帮灭', 'warn');
    else setHint('空格射帮众 · 清一帮「帮灭」 · Shift 黑洞吸弹 · 吃 拍 加宽 吃 匣 定身', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'CGNG';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'win') btnOvModes.textContent = isCore() ? '换模式' : '帮核';
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

  function seedWorld() {
    stars.length = 0;
    signs.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.5),
        a: rand(0.16, 0.7),
        w: rand(1.2, 3.0),
        hue: Math.random() < 0.4 ? CYN : Math.random() < 0.5 ? MAG : GOLD
      });
    }
    for (let i = 0; i < 8; i++) {
      signs.push({
        x: hash2(i * 17 + 3) * VW,
        y: -40 - i * 100,
        w: 28 + hash2(i * 9) * 64,
        h: 70 + hash2(i * 13) * 90,
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
    if (G.combo >= 3 && G.combo % 3 === 0) {
      floatText(G.player.x, G.player.y - 36, G.combo + ' 链', GOLD, true);
      hitStop(0.04);
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
    if (G.ents.length > 64) return null;
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
      stun: 0,
      ground: !!spec.ground,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      spin: spec.spin || 0,
      gid: spec.gid || 0,
      slotX: spec.slotX || 0,
      slotY: spec.slotY || 0,
      state: spec.state || 'fly',
      holdT: spec.holdT || 0,
      delay: spec.delay || 0,
      crate: spec.crate || null,
      thief: spec.thief || null,
      saved: false
    };
    G.ents.push(en);
    return en;
  }

  function spawnGang(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: extra.type || 'gang',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 96,
      hp: extra.hp || 1,
      r: extra.r || 11,
      score: extra.score || SCORE.gang,
      rgb: extra.rgb || MAG,
      dive: extra.dive,
      gid: extra.gid || 0,
      slotX: extra.slotX,
      slotY: extra.slotY,
      state: extra.state || 'enter',
      delay: extra.delay || 0,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.8, 2.2),
      drop: extra.drop || false
    });
  }

  function spawnV(n, xmid) {
    n = n || 7;
    const gid = ++G.gangSeq;
    G.gangs[gid] = { alive: n, total: n, killed: 0 };
    xmid = xmid == null ? VW * 0.5 + rand(-28, 28) : xmid;
    const gapX = 28;
    const gapY = 22;
    const ySlot = 86;
    const fromLeft = Math.random() < 0.5;
    const side = fromLeft ? -24 : VW + 24;
    function one(sx0, sy0, i) {
      spawnGang(side, sy0 + rand(-8, 8), {
        vx: fromLeft ? 210 : -210,
        vy: 40,
        gid: gid,
        slotX: sx0,
        slotY: sy0,
        state: 'enter',
        delay: i * 0.06,
        rgb: i % 3 === 0 ? LIME : i % 3 === 1 ? MAG : CYN,
        fireCd: rand(1.1, 2.4)
      });
    }
    one(xmid, ySlot, 0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      one(xmid - k * gapX, ySlot + k * gapY, k);
      if (1 + k * 2 <= n) one(xmid + k * gapX, ySlot + k * gapY, k + wings);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    const gid = ++G.gangSeq;
    G.gangs[gid] = { alive: n, total: n, killed: 0 };
    for (let i = 0; i < n; i++) {
      spawnGang(side + rand(-8, 8), -20 - i * 24, {
        vx: dir * -78,
        vy: 126,
        rgb: PNK,
        gid: gid,
        state: 'fly',
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
        vx: 0, vy: 70,
        hp: 1, r: 11, score: SCORE.dive,
        rgb: GOLD,
        dive: true,
        state: 'dive',
        fireCd: 99
      });
    }
  }

  function spawnThug() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'thug',
      x: left ? -28 : VW + 28,
      y: rand(70, 180),
      vx: left ? 92 : -92,
      vy: 22,
      hp: 5, r: 18, score: SCORE.thug,
      rgb: VIO,
      w: 42, h: 18,
      fireCd: rand(0.4, 0.9),
      phase: left ? 1 : -1,
      drop: Math.random() < 0.4 ? 'j' : false
    });
  }

  function spawnCoins() {
    const n = isCore() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-12, 12);
      spawnEnt({
        type: 'coin',
        x: clamp(x, 54, VW - 54),
        y: -28,
        vx: 0, vy: 0,
        hp: 4, r: 18, score: SCORE.coin,
        rgb: GOLD,
        spin: rand(0, TAU),
        fireCd: 99
      });
      spawnGang(clamp(x, 54, VW - 54) + rand(-8, 8), -52, {
        vy: 0,
        state: 'cover',
        rgb: LIME,
        fireCd: rand(0.8, 1.6)
      });
    }
  }

  function spawnBoxes() {
    const n = isCore() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 64 + i * ((VW - 128) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnEnt({
        type: 'box',
        x: clamp(x, 48, VW - 48),
        y: -28,
        vx: 0, vy: 0,
        hp: 6, r: 16, score: SCORE.box,
        rgb: AMBER,
        ground: true,
        drop: Math.random() < 0.3 ? 'b' : false,
        w: 24, h: 24,
        fireCd: rand(0.55, 1.2)
      });
    }
  }

  function spawnCargo() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const crate = spawnEnt({
      type: 'crate',
      x: VW * 0.5 + rand(-40, 40),
      y: -26,
      vx: 0, vy: 38,
      hp: 8, r: 16, score: SCORE.crate,
      rgb: AMBER,
      ground: true,
      w: 28, h: 22,
      fireCd: 99,
      phase: dir
    });
    if (!crate) return;
    const thief = spawnEnt({
      type: 'thief',
      x: crate.x,
      y: crate.y - 18,
      vx: 0, vy: 38,
      hp: 2, r: 11, score: SCORE.thief,
      rgb: MAG,
      fireCd: 99,
      crate: crate
    });
    crate.thief = thief;
  }

  function spawnBakuto() {
    spawnEnt({
      type: 'bakuto',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 78,
      hp: 2, r: 13, score: SCORE.bakuto,
      rgb: GOLD,
      drop: Math.random() < 0.45 ? 'j' : 'p',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnDrake() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'drake',
      x: left ? -40 : VW + 40,
      y: rand(80, 160),
      vx: left ? 70 : -70,
      vy: 10,
      hp: 10, r: 22, score: SCORE.drake,
      rgb: NEON,
      w: 56, h: 20,
      fireCd: 0.6,
      phase: left ? 1 : -1,
      drop: 'p'
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
      vx: 58,
      vy: 46,
      hp: hp,
      r: 34,
      score: SCORE.mid,
      rgb: st.biome === 'alley' ? MAG : st.biome === 'dock' ? AMBER : VIO,
      drop: 'p',
      w: 76,
      h: 36,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(GOLD, 0.36);
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
      vx: 66,
      vy: 42,
      hp: hp,
      r: 46,
      score: SCORE.boss + G.stage * SCORE.clear,
      rgb: MAG,
      drop: 'p',
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
    else if (w.kind === 'boxes') spawnBoxes();
    else if (w.kind === 'coins') spawnCoins();
    else if (w.kind === 'cargo') spawnCargo();
    else if (w.kind === 'thug') spawnThug();
    else if (w.kind === 'haul') spawnBakuto();
    else if (w.kind === 'drake') spawnDrake();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y, kind) {
    const k = kind === 'b' || kind === 'j' || kind === 's' || kind === 'p' ? kind : 'p';
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38),
      kind: k
    });
    capArr(G.pows, 8);
  }

  function spawnGem(x, y) {
    G.gems.push({
      x: x, y: y,
      vx: rand(-40, 40),
      vy: rand(20, 70),
      t: 0
    });
    capArr(G.gems, 48);
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
    G.fireCd = 0.108 - lv * 0.011;
    const spd = -700;
    const rgb = lv >= 3 ? GOLD : lv >= 1 ? SKY : WHT;
    function gun(ox, oy, vx, vy, dmg, col, r) {
      addShot({
        x: x + ox, y: y + oy,
        vx: vx || 0,
        vy: vy == null ? spd : vy,
        r: r || 3.05,
        rgb: col || rgb,
        dmg: dmg || 1
      });
    }
    if (lv <= 0) {
      gun(-5, 2);
      gun(5, 2);
    } else if (lv === 1) {
      gun(0, -2);
      gun(-11, 3, -36, spd);
      gun(11, 3, 36, spd);
    } else if (lv === 2) {
      gun(0, -2);
      gun(-8, 1, -24, spd);
      gun(8, 1, 24, spd);
      gun(-16, 4, -78, spd);
      gun(16, 4, 78, spd);
    } else {
      gun(0, -3);
      gun(-7, 0, -18, spd);
      gun(7, 0, 18, spd);
      gun(-14, 2, -62, spd);
      gun(14, 2, 62, spd);
      gun(-10, 6, -40, -640, 2, GOLD, 4.4);
      gun(10, 6, 40, -640, 2, GOLD, 4.4);
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
      toast('黑洞用尽', true, false);
      audio.beep(160, 0.08, 'square', 0.03, 80);
      return;
    }
    G.bombsStock -= 1;
    G.bombCd = 0.52;
    startHole();
    flashBombHud();
    syncHud();
  }

  function startHole() {
    const px = G.player.x;
    const py = G.player.y - 18;
    G.hole.on = true;
    G.hole.x = px;
    G.hole.y = py;
    G.hole.t = 0;
    G.hole.life = 0.92;
    G.hole.rad = 28;
    G.hole.maxRad = 196;
    G.hole.dmgT = 0;
    juice(px, py, VIO, 2.1);
    audio.hole();
    hitStop(0.068);
    kick(6.4);
    screenFlash(VIO, 0.62);
    G.invuln = Math.max(G.invuln, 0.5);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      swirls.push({
        x: px, y: py,
        a: a, rad: 24,
        t: 0, life: 0.92,
        rgb: k % 2 ? VIO : CYN
      });
    }
    capArr(swirls, 36);
  }

  function collapseHole() {
    const h = G.hole;
    const rad = h.rad;
    popSpark(h.x, h.y, VIO, 42);
    juice(h.x, h.y, MAG, 1.8);
    audio.boom(true);
    hitStop(0.048);
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      const dx = s.x - h.x;
      const dy = s.y - h.y;
      if (dx * dx + dy * dy < rad * rad) {
        spawnGem(s.x, s.y);
        G.eShots.splice(i, 1);
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dx = en.x - h.x;
      const dy = en.y - h.y;
      if (dx * dx + dy * dy < (rad + en.r) * (rad + en.r)) {
        hurtEnt(en, en.ground ? 5 : 4, en.x, en.y);
      }
    }
    G.hole.on = false;
    G.hole.rad = 0;
  }

  function updateHole(dt) {
    const h = G.hole;
    if (!h.on) return;
    h.t += dt;
    const u = h.t / h.life;
    if (u < 0.35) h.rad = lerp(28, h.maxRad, u / 0.35);
    else if (u < 0.72) h.rad = h.maxRad;
    else h.rad = lerp(h.maxRad, 22, (u - 0.72) / 0.28);
    h.dmgT -= dt;
    const pull = 280;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      const dx = h.x - s.x;
      const dy = h.y - s.y;
      const d = hypot(dx, dy) || 1;
      if (d < h.rad + 8) {
        s.vx += (dx / d) * pull * dt * 2.4;
        s.vy += (dy / d) * pull * dt * 2.4;
        if (d < 16) {
          spawnGem(s.x, s.y);
          popSpark(s.x, s.y, CYN, 8);
          G.eShots.splice(i, 1);
        }
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dx = h.x - en.x;
      const dy = h.y - en.y;
      const d = hypot(dx, dy) || 1;
      if (d < h.rad + en.r) {
        if (!en.ground) {
          en.x += (dx / d) * pull * dt;
          en.y += (dy / d) * pull * dt;
        }
        if (h.dmgT <= 0) hurtEnt(en, 1, en.x, en.y);
      }
    }
    if (h.dmgT <= 0) h.dmgT = 0.12;
    if (h.t >= h.life) collapseHole();
  }

  function jackStun() {
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      if (en.type === 'boss' || en.type === 'mid') {
        en.stun = Math.max(en.stun, 0.55);
        continue;
      }
      en.stun = Math.max(en.stun, 1.12);
    }
    screenFlash(GOLD, 0.46);
    hitStop(0.05);
    kick(4.2);
    audio.jack();
    toast('惊吓匣', false, true);
    floatText(G.player.x, G.player.y - 40, '定身', GOLD, true);
    popSpark(G.player.x, G.player.y, GOLD, 36);
  }

  function noteGangKill(en) {
    if (!en.gid) return;
    const g = G.gangs[en.gid];
    if (!g) return;
    g.alive -= 1;
    g.killed += 1;
    if (g.killed >= g.total && g.total >= 4) {
      const pts = SCORE.wipe * G.mult;
      addScore(pts);
      floatText(en.x, en.y - 24, '帮灭', GOLD, true);
      audio.wipe();
      hitStop(0.055);
      popSpark(en.x, en.y, VIO, 28);
      toast('帮灭 ×' + G.mult, false, true);
      juice(en.x, en.y, CYN, 1.4);
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
        life: 0.32, r0: 1.4, r1: 3.4, rgb: AMBER, g: 280
      });
    } else {
      audio.hit('air', G.combo);
    }
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    noteGangKill(en);
    if (en.type === 'thief' && en.crate && en.crate.hp > 0) {
      en.crate.thief = null;
      en.crate.saved = true;
      en.crate.vy = 90;
      en.crate.vx = 0;
      addScore(SCORE.save * G.mult);
      floatText(en.crate.x, en.crate.y - 16, '货救', GOLD, true);
      toast('货救', false, true);
    }
    if (en.drop === 'p' || en.drop === 'b' || en.drop === 'j' || en.drop === 's') spawnPow(en.x, en.y, en.drop);
    else if (en.drop === true) spawnPow(en.x, en.y, Math.random() < 0.4 ? 'j' : 'p');
    else if ((en.type === 'box' || en.type === 'thug') && Math.random() < 0.22) {
      spawnPow(en.x, en.y, Math.random() < 0.5 ? 'b' : 'j');
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
        toast(G.bombsStock >= BOMB_MAX ? '洞满' : '补洞 +1', false, true);
      } else {
        addScore(400 * G.mult);
        toast('+400', false, true);
      }
      flashBombHud();
      floatText(p.x, p.y, '洞', GOLD, true);
    } else if (p.kind === 'j') {
      jackStun();
      floatText(p.x, p.y, '匣', GOLD, true);
    } else if (p.kind === 's') {
      G.shield = 1;
      toast('护罩', false, true);
      floatText(p.x, p.y, '罩', CYN, true);
    } else if (G.powLv < WPN_MAX) {
      G.powLv += 1;
      toast(G.powLv >= WPN_MAX ? '拍 MAX' : '火力加宽', false, true);
      flashWpn();
      floatText(p.x, p.y, '拍', GOLD, true);
    } else if (G.bombsStock < BOMB_MAX) {
      G.bombsStock += 1;
      toast('洞 +1', false, true);
      flashBombHud();
      floatText(p.x, p.y, '洞', GOLD, true);
    } else if (G.shield <= 0) {
      G.shield = 1;
      toast('护罩', false, true);
      floatText(p.x, p.y, '罩', CYN, true);
    } else {
      addScore(500 * G.mult);
      toast('+500', false, true);
      floatText(p.x, p.y, '拍', GOLD, true);
    }
    juice(p.x, p.y, GOLD, 1.15);
    if (p.kind !== 'j') audio.pow();
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
    if (G.invuln > 0) return;
    if (G.shield > 0) {
      G.shield = 0;
      G.invuln = 0.62;
      juice(G.player.x, G.player.y, CYN, 1.3);
      audio.shield();
      toast('护罩碎了', true, false);
      floatText(G.player.x, G.player.y - 28, '罩碎', CYN, false);
      syncHud();
      return;
    }
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
    G.shield = 0;
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
      isCore() ? '帮核尽破' : '星帮尽破',
      (isCore() ? '帮核通关' : '三关打穿') + ' · 分数 ' + G.score
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
    if (r < 0.24) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.4) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.54) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.66) spawnBoxes();
    else if (r < 0.76) spawnCoins();
    else if (r < 0.86) spawnThug();
    else if (r < 0.93) spawnCargo();
    else spawnBakuto();
  }

  function maybeDiveFromGang(en) {
    if (en.state !== 'hold') return;
    if (en.holdT < 0.85) return;
    if (G.diveCd > 0) return;
    if (Math.random() > 0.0036 + G.stage * 0.001 + (isCore() ? 0.0016 : 0)) return;
    en.state = 'dive';
    en.dive = true;
    G.diveCd = isCore() ? 0.22 : 0.38;
    const dx = G.player.x - en.x;
    const dy = Math.max(40, G.player.y - en.y);
    const len = hypot(dx, dy) || 1;
    const spd = 210 + G.stage * 18;
    en.vx = dx / len * spd;
    en.vy = dy / len * spd;
    if (G.mode === 'play') eShot(en.x, en.y + 8, dx / len * 40, isCore() ? 200 : 164, MAG);
  }

  function bossFire(en, core) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += core ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, core ? 210 : 176, GOLD);
      eShot(en.x - 18, en.y + 10, -46, 186, PNK);
      eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      if (mid) ringShot(en.x, en.y, core ? 10 : 8, 150, en.spin, HOT, 3.2);
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 214, MAG);
      eShot(en.x - 28, en.y + 12, -50, 196, RED);
      eShot(en.x + 28, en.y + 12, 50, 196, RED);
      if (mid) ringShot(en.x, en.y + 6, core ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, core ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, core ? 10 : 8, 118, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 16, 200, HOT);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, core ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, core ? 10 : 8, 108, -en.spin * 0.7, GOLD, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 210, PNK);
        aimShot(en.x + 20, en.y + 14, 210, PNK);
        if (Math.random() < 0.35 && livingAir() < 18) {
          spawnGang(en.x + rand(-40, 40), en.y + 24, {
            vy: 80, state: 'dive', dive: true, rgb: LIME, fireCd: 99
          });
        }
      }
      if (low) {
        ringShot(en.x, en.y, core ? 18 : 14, 168, en.t * 3.2, HOT, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (core) en.fireCd *= 0.76;
  }

  function thinkEnt(en, dt) {
    if (en.stun > 0) {
      en.stun -= dt;
      return;
    }
    const px = G.player.x;
    const py = G.player.y;
    const scroll = scrollSpd();
    const t = en.type;

    if (t === 'gang') {
      if (en.state === 'enter') {
        if (en.delay > 0) {
          en.delay -= dt;
          en.vx = 0;
          en.vy = 0;
        } else {
          const dx = en.slotX - en.x;
          const dy = en.slotY - en.y;
          const d = hypot(dx, dy) || 1;
          en.vx = dx / d * 220;
          en.vy = dy / d * 220;
          if (d < 10) {
            en.state = 'hold';
            en.x = en.slotX;
            en.y = en.slotY;
            en.vx = 0;
            en.vy = 0;
          }
        }
      } else if (en.state === 'hold') {
        en.holdT += dt;
        en.x = en.slotX + Math.sin(G.t * 1.6 + en.slotX * 0.02) * 14;
        en.y = en.slotY + Math.sin(G.t * 1.1 + en.slotY * 0.03) * 6;
        maybeDiveFromGang(en);
        en.fireCd -= dt;
        if (en.fireCd <= 0 && G.mode === 'play') {
          eShot(en.x, en.y + 8, 0, isCore() ? 186 : 146, MAG, 3.0);
          en.fireCd = rand(1.4, 2.6) / (isCore() ? 1.25 : 1);
        }
      } else if (en.state === 'cover') {
        en.y += scroll * dt;
        en.x += Math.sin(en.t * 2) * 10 * dt;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && G.mode === 'play') {
          aimShot(en.x, en.y + 8, isCore() ? 170 : 140, PNK);
          en.fireCd = rand(1.1, 2.0);
        }
      } else if (en.state === 'dive') {
        en.vx += (px - en.x) * 0.55 * dt;
        en.vy = Math.max(en.vy, 160);
      } else {
        en.y += 0;
      }
    } else if (t === 'dive') {
      en.vx += (px - en.x) * 1.1 * dt;
      en.vy += 40 * dt;
    } else if (t === 'thug') {
      en.vy = 18 + Math.sin(en.t * 2.2) * 22;
      if ((en.phase > 0 && en.x > VW + 40) || (en.phase < 0 && en.x < -40)) en.hp = -99;
      en.fireCd -= dt;
      if (en.fireCd <= 0 && G.mode === 'play') {
        aimShot(en.x, en.y + 8, isCore() ? 200 : 164, VIO);
        eShot(en.x - 12, en.y + 6, -40, 170, PNK);
        eShot(en.x + 12, en.y + 6, 40, 170, PNK);
        en.fireCd = rand(0.7, 1.2) * (isCore() ? 0.74 : 1);
      }
    } else if (t === 'coin') {
      en.y += scroll * dt;
      en.spin += dt * 3.2;
    } else if (t === 'box') {
      en.y += scroll * dt;
      en.fireCd -= dt;
      if (en.fireCd <= 0 && G.mode === 'play') {
        aimShot(en.x, en.y, isCore() ? 188 : 154, AMBER, 3.2);
        en.fireCd = rand(0.7, 1.25) * (isCore() ? 0.74 : 1);
      }
    } else if (t === 'crate') {
      if (en.saved) {
        en.vy = 110;
      } else if (en.thief && en.thief.hp > 0) {
        en.vx = en.phase * 46;
        en.vy = 22;
        if (en.x < 12 || en.x > VW - 12) {
          en.hp = -99;
          if (en.thief) en.thief.hp = -99;
          toast('货被抢', true, false);
        }
      } else {
        en.vy = 90;
        en.vx *= 0.9;
      }
    } else if (t === 'thief') {
      if (en.crate && en.crate.hp > 0 && !en.crate.saved) {
        en.x = en.crate.x;
        en.y = en.crate.y - 18;
        en.vx = en.crate.vx;
        en.vy = en.crate.vy;
      } else {
        en.vy = 160;
      }
    } else if (t === 'bakuto') {
      en.vx = en.phase * 70;
      en.phase = Math.sin(en.t * 1.8) > 0 ? (en.x < 80 ? 1 : en.x > VW - 80 ? -1 : en.phase) : en.phase;
    } else if (t === 'drake') {
      en.y += Math.sin(en.t * 2.4) * 28 * dt;
      if ((en.phase > 0 && en.x > VW + 50) || (en.phase < 0 && en.x < -50)) en.hp = -99;
      en.fireCd -= dt;
      if (en.fireCd <= 0 && G.mode === 'play') {
        aimShot(en.x, en.y + 8, isCore() ? 196 : 160, NEON);
        if (livingAir() < 22) {
          spawnGang(en.x, en.y + 16, {
            vy: 90, state: 'dive', dive: true, rgb: LIME, fireCd: 99
          });
        }
        en.fireCd = rand(0.85, 1.35) * (isCore() ? 0.74 : 1);
      }
    } else if (t === 'mid' || t === 'boss') {
      if (en.y < 118) en.y += 46 * dt;
      else {
        en.x += en.vx * dt;
        if (en.x < 70 || en.x > VW - 70) en.vx *= -1;
        en.x = clamp(en.x, 70, VW - 70);
        en.y = 118 + Math.sin(en.t * 1.4) * 10;
      }
      en.fireCd -= dt;
      if (en.fireCd <= 0 && G.mode === 'play' && en.y > 80) bossFire(en, isCore());
    }
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      thinkEnt(en, dt);
      en.x += en.vx * dt;
      en.y += en.vy * dt;

      if (en.y > VH + 50 || en.y < -90 || en.x < -70 || en.x > VW + 70) {
        if (en.type !== 'mid' && en.type !== 'boss' && en.state !== 'enter' && en.state !== 'hold') {
          if (en.gid && G.gangs[en.gid]) G.gangs[en.gid].alive = Math.max(0, G.gangs[en.gid].alive - 1);
          G.ents.splice(i, 1);
          continue;
        }
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !en.ground && en.type !== 'coin' && en.type !== 'crate') {
        const dx = en.x - px;
        const dy = en.y - py;
        const body = (en.type === 'boss' || en.type === 'mid') ? en.r * 0.55 : en.r;
        const hitR = body + 5.2;
        if (dx * dx + dy * dy < hitR * hitR) killPlayer();
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -16 || s.y > VH + 16 || s.x < -16 || s.x > VW + 16) {
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
          hurtEnt(en, s.dmg, s.x, s.y);
          hit = true;
          emit(3, {
            x: s.x, y: s.y, j: 3,
            vx0: -60, vx1: 60, vy0: -40, vy1: 40,
            life: 0.12, r0: 1, r1: 1.8, rgb: s.rgb, g: 80
          });
          if (en.type !== 'coin') hitStop(0.018);
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -20 || s.y > VH + 20 || s.x < -20 || s.x > VW + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode !== 'play' || G.deadT > 0) continue;
      const dx = s.x - G.player.x;
      const dy = s.y - G.player.y;
      const rr = s.r + 4.8;
      if (dx * dx + dy * dy < rr * rr) {
        G.eShots.splice(i, 1);
        killPlayer();
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 28 * dt;
      p.vx *= Math.exp(-dt * 0.8);
      if (p.x < 16 || p.x > VW - 16) p.vx *= -1;
      if (p.y > VH + 20) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = p.x - G.player.x;
        const dy = p.y - G.player.y;
        if (dx * dx + dy * dy < 28 * 28) {
          pickPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
    for (let i = G.gems.length - 1; i >= 0; i--) {
      const g = G.gems[i];
      g.t += dt;
      const dx = G.player.x - g.x;
      const dy = G.player.y - g.y;
      const d = hypot(dx, dy) || 1;
      if (d < 96) {
        g.vx += (dx / d) * 420 * dt;
        g.vy += (dy / d) * 420 * dt;
      } else {
        g.vy += 40 * dt;
      }
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (d < 18 && G.mode === 'play' && G.deadT <= 0) {
        addScore(SCORE.spark * G.mult);
        audio.gem();
        G.gems.splice(i, 1);
        continue;
      }
      if (g.t > 2.4 || g.y > VH + 20) G.gems.splice(i, 1);
    }
  }

  function updateWorld(dt) {
    G.scroll += scrollSpd() * dt;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += scrollSpd() * s.z * dt * 0.55;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < signs.length; i++) {
      const s = signs[i];
      s.y += scrollSpd() * dt * 0.72;
      if (s.y > VH + 80) {
        s.y = -80;
        s.x = hash2((i + (G.scroll | 0)) * 11) * VW;
        s.kind = hash2(i * 5 + (G.scroll | 0));
      }
    }
  }

  function updateGhosts(dt) {
    G.ghostT -= dt;
    if (G.mode === 'play' && G.deadT <= 0 && !REDUCE && G.ghostT <= 0) {
      G.ghostT = 0.046;
      if (Math.abs(G.player.vx) + Math.abs(G.player.vy) > 40) {
        ghosts.push({
          x: G.player.x, y: G.player.y,
          t: 0, bank: G.player.bank, life: 0.22
        });
        capArr(ghosts, 12);
      }
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t += dt;
      if (ghosts[i].t >= ghosts[i].life) ghosts.splice(i, 1);
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
    for (let i = swirls.length - 1; i >= 0; i--) {
      const s = swirls[i];
      s.t += dt;
      s.a += dt * 7;
      s.rad = lerp(s.rad, G.hole.on ? G.hole.rad * 0.72 : 8, 1 - Math.exp(-dt * 4));
      if (s.t >= s.life) swirls.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) G.toastT -= dt;
  }

  function tickPulse(dt) {
    G.pulseAng += dt * (REDUCE ? 6 : 16);
    G.pulseT -= dt;
    if (G.pulseT > 0) return;
    G.pulseT = G.mode === 'play' && G.deadT <= 0 ? 0.09 : 0.16;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.pulse();
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
      tickPulse(dt * 0.35);
      return;
    }
    updateFx(dt);
    tickPulse(dt);
    updateGhosts(dt);

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
    if (G.diveCd > 0) G.diveCd -= dt;
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
        G.bombsStock = Math.min(BOMB_MAX, G.bombsStock + 1);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isCore()) coreThink(dt);
    else raidThink();

    updateHole(dt);
    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawSign(isl, bio) {
    const x = sx(isl.x);
    const y = sy(isl.y);
    const w = isl.w * scale;
    const h = isl.h * scale;
    ctx.save();
    if (bio === 'dock') {
      ctx.fillStyle = 'rgba(24, 14, 32, 0.92)';
      ctx.fillRect(x - w * 0.4, y - h * 0.2, w * 0.8, h * 0.55);
      ctx.fillStyle = rgba(AMBER, 0.45);
      ctx.fillRect(x - w * 0.28, y - h * 0.08, w * 0.56, 6 * scale);
      ctx.fillStyle = rgba(GOLD, 0.28);
      ctx.fillRect(x - 2 * scale, y - h * 0.45, 4 * scale, h * 0.4);
    } else if (bio === 'keep') {
      ctx.fillStyle = 'rgba(22, 10, 32, 0.94)';
      ctx.fillRect(x - w * 0.35, y - h * 0.45, w * 0.7, h * 0.9);
      ctx.fillStyle = rgba(isl.kind > 0.5 ? MAG : GOLD, 0.35 + Math.sin(G.t * 5 + isl.kind * 10) * 0.18);
      for (let r = 0; r < 4; r++) {
        ctx.fillRect(x - w * 0.22, y - h * 0.32 + r * h * 0.16, w * 0.44, 3 * scale);
      }
    } else {
      ctx.fillStyle = 'rgba(20, 10, 30, 0.9)';
      ctx.fillRect(x - w * 0.38, y - h * 0.42, w * 0.76, h * 0.85);
      ctx.fillStyle = rgba(isl.kind > 0.5 ? MAG : CYN, 0.42 + Math.sin(G.t * 4 + isl.x) * 0.2);
      ctx.fillRect(x - w * 0.26, y - h * 0.18, w * 0.52, 7 * scale);
      ctx.fillStyle = rgba(GOLD, 0.28);
      ctx.fillRect(x - w * 0.16, y + h * 0.08, w * 0.32, 4 * scale);
    }
    ctx.restore();
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'dock') {
      g.addColorStop(0, '#1a1024');
      g.addColorStop(0.55, '#140c1c');
      g.addColorStop(1, '#1c1010');
    } else if (bio === 'keep') {
      g.addColorStop(0, '#1c0820');
      g.addColorStop(0.5, '#140818');
      g.addColorStop(1, '#200814');
    } else {
      g.addColorStop(0, '#180820');
      g.addColorStop(0.5, '#120814');
      g.addColorStop(1, '#1a0a18');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = rgba(s.hue, s.a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.w * scale * 0.45, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < signs.length; i++) drawSign(signs[i], bio);
  }

  function drawShip(x, y, a, bank) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(bank || 0);
    ctx.globalAlpha = a;
    ctx.scale(scale, scale);
    const pulse = 0.55 + Math.sin(G.pulseAng) * 0.45;
    ctx.fillStyle = rgba(VIO, 0.35 * pulse);
    ctx.beginPath();
    ctx.ellipse(0, 10, 7 + pulse * 3, 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(YEL, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(9, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-9, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(3.2, 2);
    ctx.lineTo(-3.2, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(-1.1, -2, 2.2, 8);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(-7, 6, 2.1, 0, TAU);
    ctx.arc(7, 6, 2.1, 0, TAU);
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, -18, 3.4, 0, TAU);
      ctx.fill();
    }
    if (G.shield > 0) {
      ctx.strokeStyle = rgba(CYN, 0.7 + pulse * 0.25);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 16 + pulse * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGangster(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    if (en.state === 'dive' || en.dive) ctx.rotate(Math.atan2(en.vy, en.vx) - Math.PI / 2);
    const rgb = flash ? WHT : en.rgb;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 5, 7.5, 6.5, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -3, 10, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-3.8, -4, 3.1, 2.6, -0.15, 0, TAU);
    ctx.ellipse(3.8, -4, 3.1, 2.6, 0.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0e22';
    ctx.beginPath();
    ctx.arc(-3.6, -3.8, 1.25, 0, TAU);
    ctx.arc(3.6, -3.8, 1.25, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(PNK, 0.55);
    ctx.beginPath();
    ctx.ellipse(-6.2, 0.4, 1.6, 1.1, 0, 0, TAU);
    ctx.ellipse(6.2, 0.4, 1.6, 1.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(-3.2, 1.4, 6.4, 1.5);
    if (en.stun > 0) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -16);
    }
    ctx.restore();
  }

  function drawCoin(en) {
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale * (0.7 + Math.abs(Math.cos(en.spin)) * 0.3), scale);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(AMBER, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#2a1800';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('币', 0, 1);
    ctx.restore();
  }

  function drawBox(en) {
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = rgba(en.flash > 0 ? WHT : AMBER, 0.95);
    ctx.fillRect(-12, -12, 24, 24);
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-12, -12, 24, 24);
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }

  function drawCrate(en) {
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = rgba(en.saved ? GOLD : AMBER, 0.95);
    ctx.fillRect(-14, -10, 28, 20);
    ctx.strokeStyle = rgba(WHT, 0.4);
    ctx.strokeRect(-14, -10, 28, 20);
    ctx.fillStyle = '#2a1808';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(en.saved ? '救' : '货', 0, 1);
    ctx.restore();
  }

  function drawDrake(en) {
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = rgba(en.flash > 0 ? WHT : NEON, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 9, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(en.vx >= 0 ? 22 : -22, 0);
    ctx.lineTo(en.vx >= 0 ? 36 : -36, -6);
    ctx.lineTo(en.vx >= 0 ? 36 : -36, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(en.vx >= 0 ? 10 : -10, -2, 3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawMidBoss(en) {
    const isDon = en.type === 'boss' && G.stage >= 3;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    const rgb = en.flash > 0 ? WHT : en.rgb;
    if (isDon) {
      ctx.fillStyle = rgba(rgb, 0.96);
      ctx.beginPath();
      ctx.ellipse(0, 10, 34, 22, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -8, 26, 0, TAU);
      ctx.fill();
      ctx.fillStyle = GOLD[0] ? rgba(GOLD, 0.95) : '#ffe36b';
      ctx.beginPath();
      ctx.moveTo(-20, -22);
      ctx.lineTo(-10, -36);
      ctx.lineTo(0, -24);
      ctx.lineTo(10, -36);
      ctx.lineTo(20, -22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-8, -10, 6, 5, -0.1, 0, TAU);
      ctx.ellipse(8, -10, 6, 5, 0.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a0e22';
      ctx.beginPath();
      ctx.arc(-7.5, -9.5, 2.4, 0, TAU);
      ctx.arc(7.5, -9.5, 2.4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 8, 18, 0.2, Math.PI - 0.2);
      ctx.stroke();
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = en.spin + (i * TAU) / n;
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 42, Math.sin(a) * 18, 7, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 6, en.w * 0.42, en.h * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -10, 18, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-6, -11, 4.5, 3.6, 0, 0, TAU);
      ctx.ellipse(6, -11, 4.5, 3.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a0e22';
      ctx.beginPath();
      ctx.arc(-5.8, -10.6, 1.8, 0, TAU);
      ctx.arc(5.8, -10.6, 1.8, 0, TAU);
      ctx.fill();
    }
    if (en.stun > 0) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -40);
    }
    ctx.restore();
  }

  function drawEnt(en) {
    const t = en.type;
    if (t === 'gang' || t === 'dive' || t === 'thug' || t === 'thief' || t === 'bakuto') drawGangster(en);
    else if (t === 'coin') drawCoin(en);
    else if (t === 'box') drawBox(en);
    else if (t === 'crate') drawCrate(en);
    else if (t === 'drake') drawDrake(en);
    else if (t === 'mid' || t === 'boss') drawMidBoss(en);
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.6);
      ctx.shadowBlur = REDUCE ? 0 : 8;
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), s.r * 0.7 * scale, (s.r + 4) * scale, 0, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const gold = p.kind === 'b' || p.kind === 'j';
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(p.t * 3);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(gold ? (p.kind === 'j' ? GOLD : HOT) : CYN, 0.95);
      ctx.shadowColor = rgba(gold ? GOLD : CYN, 0.7);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a0e22';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 3);
      ctx.fillText(p.kind === 'b' ? '洞' : p.kind === 'j' ? '匣' : p.kind === 's' ? '罩' : '拍', 0, 1);
      ctx.restore();
    }
    for (let i = 0; i < G.gems.length; i++) {
      const g = G.gems[i];
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(sx(g.x), sy(g.y), 3.2 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawHole() {
    if (!G.hole.on) return;
    const h = G.hole;
    ctx.save();
    ctx.translate(sx(h.x), sy(h.y));
    const r = h.rad * scale;
    const grd = ctx.createRadialGradient(0, 0, 4 * scale, 0, 0, r);
    grd.addColorStop(0, 'rgba(8, 0, 16, 0.92)');
    grd.addColorStop(0.45, 'rgba(88, 40, 160, 0.45)');
    grd.addColorStop(1, 'rgba(200, 160, 255, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.55);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, TAU);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < swirls.length; i++) {
      const s = swirls[i];
      const x = h.x + Math.cos(s.a) * s.rad;
      const y = h.y + Math.sin(s.a) * s.rad * 0.72;
      ctx.fillStyle = rgba(s.rgb, 1 - s.t / s.life);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 2.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = (1.6 - s.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * (0.4 + s.t * 1.4) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, (1 - r.t) * 0.7);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), r.r * (0.6 + r.t * 2.2) * scale, 0, TAU);
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
      ctx.font = 'bold ' + (f.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = rgba(f.gold ? GOLD : WHT, 0.6);
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawGhosts() {
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      const a = (1 - g.t / g.life) * 0.38;
      drawShip(g.x, g.y, a, g.bank);
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? HOT : GOLD, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : GOLD, 0.6);
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
    ctx.fillStyle = '#120814';
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
    drawHole();
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();
    drawGhosts();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawShip(G.player.x, G.player.y, 1, G.player.bank);
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
    G.gems.length = 0;
    G.gangs = {};
    G.gangSeq = 0;
    G.hole.on = false;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    swirls.length = 0;
    ghosts.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'raid';
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
    G.shield = 0;
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
    G.diveCd = 0;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.pulseT = 0;
    G.ghostT = 0;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '帮核 · 编队更密' : '星帮 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.powLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.bombsStock = BOMB_START;
    G.shield = 0;
    G.deadT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '星帮',
      '超拍战机向上打。空格射帮众，整帮打光蹦「帮灭」。Shift 放黑洞吸敌清弹。霓虹巷穿货仓，堂主决战。'
    );
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
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
