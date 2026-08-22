'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const GROUND = 412;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const SPREAD_MAX = 2;
  const SAT_MAX = 2;
  const BEST_KEY = 'playbox-forgotten-worlds-best';
  const MUTE_KEY = 'playbox-forgotten-worlds-mute';
  const OPS = '方向 / WASD 移动 · 鼠标或 IJKL 瞄准 · 空格射击 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 138, 40];
  const ORG = [255, 100, 20];
  const WHT = [255, 246, 234];
  const SKIN = [214, 160, 122];
  const SAND = [184, 132, 72];
  const STONE = [92, 68, 48];
  const TEAL = [64, 210, 180];
  const RED = [255, 86, 96];
  const PNK = [255, 154, 196];

  const SPREAD_COST = [180, 320];
  const SAT_COST = [240, 360];
  const SPREAD_NAME = ['单', '三', '五'];

  const STAGES = [
    {
      name: '第 1 关 · 荒原',
      biome: 'waste',
      mid: '石卫',
      boss: '岩神',
      midHp: 42,
      bossHp: 96,
      waves: [
        { t: 0.7, kind: 'imps', n: 5 },
        { t: 3.1, kind: 'turrets' },
        { t: 5.4, kind: 'wyrm' },
        { t: 8.0, kind: 'tanks' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'imps', n: 6 },
        { t: 15.4, kind: 'ruins' },
        { t: 17.8, kind: 'wyrm' },
        { t: 20.4, kind: 'mid' },
        { t: 26.2, kind: 'imps', n: 7 },
        { t: 28.6, kind: 'tanks' },
        { t: 31.2, kind: 'dive', n: 5 },
        { t: 33.8, kind: 'turrets' },
        { t: 36.4, kind: 'drake' },
        { t: 39.0, kind: 'imps', n: 7 },
        { t: 41.6, kind: 'idols' },
        { t: 48.2, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 云廊',
      biome: 'cloud',
      mid: '廊卫',
      boss: '云蛟',
      midHp: 54,
      bossHp: 124,
      waves: [
        { t: 0.6, kind: 'imps', n: 7 },
        { t: 2.8, kind: 'wyrm' },
        { t: 5.0, kind: 'dive', n: 5 },
        { t: 7.4, kind: 'drake' },
        { t: 9.6, kind: 'turrets' },
        { t: 12.0, kind: 'imps', n: 8 },
        { t: 14.4, kind: 'tanks' },
        { t: 16.8, kind: 'wyrm' },
        { t: 19.2, kind: 'mid' },
        { t: 25.0, kind: 'dive', n: 6 },
        { t: 27.4, kind: 'imps', n: 8 },
        { t: 29.8, kind: 'drake' },
        { t: 32.2, kind: 'idols' },
        { t: 34.8, kind: 'wyrm' },
        { t: 37.2, kind: 'ruins' },
        { t: 39.6, kind: 'imps', n: 9 },
        { t: 42.2, kind: 'tanks' },
        { t: 51.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 神殿',
      biome: 'temple',
      mid: '殿卫',
      boss: '忘神',
      midHp: 66,
      bossHp: 168,
      waves: [
        { t: 0.5, kind: 'imps', n: 8 },
        { t: 2.4, kind: 'drake' },
        { t: 4.6, kind: 'idols' },
        { t: 6.8, kind: 'wyrm' },
        { t: 9.0, kind: 'dive', n: 6 },
        { t: 11.2, kind: 'tanks' },
        { t: 13.4, kind: 'ruins' },
        { t: 15.6, kind: 'imps', n: 9 },
        { t: 18.0, kind: 'mid' },
        { t: 24.0, kind: 'drake' },
        { t: 26.2, kind: 'wyrm' },
        { t: 28.4, kind: 'dive', n: 7 },
        { t: 30.8, kind: 'turrets' },
        { t: 33.0, kind: 'imps', n: 10 },
        { t: 35.4, kind: 'idols' },
        { t: 37.8, kind: 'tanks' },
        { t: 40.2, kind: 'drake' },
        { t: 42.6, kind: 'ruins' },
        { t: 53.0, kind: 'boss' }
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
  const ovShop = document.getElementById('ov-shop');
  const ovEnd = document.getElementById('ov-end');
  const btnRaid = document.getElementById('btn-raid');
  const btnStorm = document.getElementById('btn-storm');
  const btnSpread = document.getElementById('btn-spread');
  const btnSat = document.getElementById('btn-sat');
  const btnGo = document.getElementById('btn-go');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const goldEl = document.getElementById('gold');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const satLabel = document.getElementById('sat-label');
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
  let satTok = 0;
  let aimSrc = 'key';

  const keys = {
    l: false, r: false, u: false, d: false,
    aimL: false, aimR: false, aimU: false, aimD: false
  };
  const pointer = { down: false, hover: false, x: 220, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const dust = [];
  const columns = [];
  const rocks = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: 88, y: VH * 0.5, vx: 0, vy: 0, bank: 0 },
    aimAng: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    gold: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    spread: 0,
    sats: [],
    ents: [],
    shots: [],
    eShots: [],
    coins: [],
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
    why: '',
    jetT: 0
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
  function isStorm() {
    return G.kind === 'storm';
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'waste';
  }
  function plySpd() {
    return (isStorm() ? 292 : 258) + G.spread * 6;
  }
  function scrollSpd() {
    if (hasBig()) return isStorm() ? 30 : 22;
    const base = isStorm() ? 128 : 88;
    const rush = G.combo >= 8 ? 14 : G.combo >= 4 ? 7 : 0;
    return base + rush + (G.stage - 1) * (isStorm() ? 10 : 7);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isStorm() ? 168 : 110;
  }
  function spreadCost() {
    return G.spread >= SPREAD_MAX ? 0 : SPREAD_COST[G.spread];
  }
  function satCost() {
    return G.sats.length >= SAT_MAX ? 0 : SAT_COST[G.sats.length];
  }
  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0) return true;
    }
    return false;
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
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
      this.beep(580 + G.spread * 50, 0.046, 'square', 0.03, 1420);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1200);
      this.beep(520 * lift, 0.066, 'square', 0.042, 900 * lift);
    },
    groundHit() {
      this.ensure();
      this.noise(0.058, 0.042, 380);
      this.beep(196, 0.1, 'sawtooth', 0.04, 64);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.11, big ? 0.078 : 0.048, big ? 200 : 440);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.14, 'sawtooth', 0.05, 48);
    },
    coin() {
      this.ensure();
      this.beep(988, 0.06, 'square', 0.036, 1480);
      this.beep(1320, 0.09, 'triangle', 0.03, 1760);
    },
    shop() {
      this.ensure();
      this.beep(523, 0.08, 'triangle', 0.045, 659);
      this.beep(659, 0.09, 'triangle', 0.04, 784);
      this.beep(784, 0.12, 'sine', 0.045, 1046);
      this.beep(1046, 0.18, 'triangle', 0.04, 1318);
    },
    buy() {
      this.ensure();
      this.beep(784, 0.07, 'square', 0.042, 988);
      this.beep(1175, 0.12, 'triangle', 0.04, 1568);
    },
    poor() {
      this.ensure();
      this.beep(180, 0.12, 'sawtooth', 0.04, 90);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.058, 300);
      this.beep(260, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.045, 40);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.18, 'sawtooth', 0.05, 90);
      this.beep(120, 0.3, 'square', 0.04, 64);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 86);
      this.beep(130, 0.3, 'sine', 0.05, 46);
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

  function addScore(n) {
    if ((G.mode !== 'play' && G.mode !== 'shop') || n <= 0) return;
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

  function addGold(n) {
    G.gold += n;
    if (goldEl) goldEl.textContent = String(G.gold);
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

  function flashChip(el, tokName) {
    if (!el) return;
    el.classList.remove('hot');
    void el.offsetWidth;
    el.classList.add('hot');
    if (tokName === 'wpn') {
      wpnTok += 1;
      const tok = wpnTok;
      setTimeout(function () {
        if (tok === wpnTok && wpnLabel) wpnLabel.classList.remove('hot');
      }, 280);
    } else {
      satTok += 1;
      const tok = satTok;
      setTimeout(function () {
        if (tok === satTok && satLabel) satLabel.classList.remove('hot');
      }, 280);
    }
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

  function shopLead() {
    return '金币 ' + G.gold + ' · 散射 ' + SPREAD_NAME[G.spread] + ' · 卫星 ' + G.sats.length
      + '。1 买散射 · 2 买卫星 · 回车出发。';
  }

  function syncShopBtns() {
    if (btnSpread) {
      const max = G.spread >= SPREAD_MAX;
      btnSpread.textContent = max ? '散射 MAX' : ('散射 ' + spreadCost());
      btnSpread.classList.toggle('max', max);
    }
    if (btnSat) {
      const max = G.sats.length >= SAT_MAX;
      btnSat.textContent = max ? '卫星 MAX' : ('卫星 ' + satCost());
      btnSat.classList.toggle('max', max);
    }
    if (ovLead && G.mode === 'shop') ovLead.textContent = shopLead();
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (goldEl) goldEl.textContent = String(G.gold);
    if (stageLabel) {
      const st = STAGES[G.stage - 1];
      if (hasBig()) {
        const b = findBig();
        stageLabel.textContent = b && b.type === 'boss'
          ? (st ? st.boss : '关底')
          : (st ? st.mid : '中卫');
      } else {
        stageLabel.textContent = st ? st.name : '第 ' + G.stage + ' 关';
      }
      stageLabel.classList.toggle('hot', G.stage >= 3 || hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isStorm() ? '弹幕' : '扫荡';
      tagLabel.classList.toggle('warn', isStorm());
      tagLabel.classList.toggle('hot', !isStorm() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = '炮 ' + SPREAD_NAME[G.spread];
      wpnLabel.classList.toggle('max', G.spread >= SPREAD_MAX);
    }
    if (satLabel) {
      satLabel.textContent = '卫 ' + G.sats.length;
      satLabel.classList.toggle('max', G.sats.length >= SAT_MAX);
    }
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
    else if (G.mode === 'win') setHint('神殿重光 · R 再来一局', 'hot');
    else if (G.mode === 'shop') setHint('1 散射 · 2 卫星 · 回车出发 · 金币花不完可留', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 转炮打空打地 · 拾金', 'warn');
    else setHint('WASD 飞 · 鼠标 / IJKL 转炮 · 空格射击 · 拾金进店', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, kicker) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    panel.classList.toggle('shop', kind === 'shop');
    ovKicker.textContent = kicker || (kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : kind === 'shop' ? 'SHOP' : 'FORG');
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = kind === 'shop'
      ? '1 散射 · 2 卫星 · 回车出发 · R 重开'
      : OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovShop) ovShop.classList.toggle('gone', kind !== 'shop');
    if (ovEnd) ovEnd.classList.toggle('gone', kind !== 'win' && kind !== 'lose');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) {
      if (kind === 'win' && !isStorm()) ovMenu.textContent = '弹幕';
      else ovMenu.textContent = '换模式';
    }
    if (kind === 'shop') syncShopBtns();
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

  function kick(mag) {
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'shop')) return;
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
        g: spec.g == null ? 480 : spec.g
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
    columns.length = 0;
    rocks.length = 0;
    for (let i = 0; i < 56; i++) {
      dust.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.4),
        a: rand(0.1, 0.45),
        w: rand(1.2, 3.4)
      });
    }
    for (let i = 0; i < 9; i++) {
      columns.push({
        x: hash2(i * 19 + 4) * (VW + 160) - 40,
        h: 48 + hash2(i * 11) * 90,
        w: 12 + hash2(i * 7) * 18,
        kind: hash2(i * 3)
      });
    }
    for (let i = 0; i < 6; i++) {
      rocks.push({
        x: hash2(i * 23 + 8) * VW,
        y: 40 + hash2(i * 17) * 180,
        r: 10 + hash2(i * 5) * 22,
        z: 0.4 + hash2(i * 9) * 0.7
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
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.35, 1.2),
      score: spec.score,
      rgb: spec.rgb,
      ang: spec.ang || 0,
      flash: 0,
      ground: !!spec.ground,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      baseY: spec.baseY != null ? spec.baseY : spec.y,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      gold: spec.gold || 15,
      spin: spec.spin || 0
    };
    G.ents.push(en);
    return en;
  }

  function spawnImp(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'imp',
      x: x, y: y,
      vx: extra.vx != null ? extra.vx : -118,
      vy: extra.vy || 0,
      hp: 1, r: 11, score: 60, gold: 15,
      rgb: extra.rgb || MAG,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.9, 2.2),
      phase: extra.phase || 0
    });
  }

  function spawnImps(n) {
    n = n || 5;
    const y0 = 70 + rand(0, 180);
    for (let i = 0; i < n; i++) {
      spawnImp(VW + 24 + i * 22, y0 + Math.sin(i * 0.9) * 36, {
        vy: Math.sin(i) * 28,
        phase: i * 0.4
      });
    }
    if (isStorm()) {
      spawnImp(VW + 40, y0 + 70, { rgb: PNK, vx: -140 });
    }
  }

  function spawnWyrm() {
    const y = 70 + rand(0, 200);
    const n = isStorm() ? 7 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'wyrm',
        x: VW + 18 + i * 20, y: y,
        vx: -96, vy: 0,
        hp: 2, r: 12, score: 80, gold: 20,
        rgb: TEAL,
        fireCd: rand(1.1, 2.4),
        phase: i * 0.55,
        baseY: y
      });
    }
  }

  function spawnDive(n) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'dive',
        x: VW * 0.45 + i * 48 + rand(-10, 10),
        y: -28 - i * 18,
        vx: -40, vy: 48,
        hp: 1, r: 11, score: 90, gold: 18,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnDrake() {
    const y = 60 + rand(0, 220);
    spawnEnt({
      type: 'drake',
      x: VW + 30, y: y,
      vx: -72, vy: 0,
      hp: 4, r: 18, score: 150, gold: 35,
      rgb: ORG,
      fireCd: rand(0.5, 1.1),
      baseY: y
    });
    if (isStorm()) {
      spawnEnt({
        type: 'drake',
        x: VW + 70, y: y + 80,
        vx: -80, vy: 0,
        hp: 3, r: 16, score: 150, gold: 30,
        rgb: RED,
        fireCd: rand(0.4, 0.9),
        baseY: y + 80
      });
    }
  }

  function spawnTurrets() {
    const n = isStorm() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'turret',
        x: VW + 40 + i * 70, y: GROUND - 18,
        vx: 0, vy: 0,
        hp: 4, r: 14, score: 120, gold: 22,
        rgb: SAND, ground: true,
        fireCd: rand(0.6, 1.4),
        w: 28, h: 22
      });
    }
  }

  function spawnTanks() {
    const n = isStorm() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'tank',
        x: VW + 30 + i * 80, y: GROUND - 16,
        vx: -46, vy: 0,
        hp: 5, r: 16, score: 180, gold: 28,
        rgb: STONE, ground: true,
        fireCd: rand(0.8, 1.6),
        w: 34, h: 20
      });
    }
  }

  function spawnRuins() {
    spawnEnt({
      type: 'ruin',
      x: VW + 36, y: GROUND - 22,
      vx: 0, vy: 0,
      hp: 7, r: 20, score: 150, gold: 30,
      rgb: SAND, ground: true,
      fireCd: rand(0.7, 1.3),
      w: 40, h: 28
    });
  }

  function spawnIdols() {
    const n = isStorm() ? 2 : 1;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'idol',
        x: VW + 50 + i * 90, y: GROUND - 26,
        vx: 0, vy: 0,
        hp: 6, r: 16, score: 160, gold: 32,
        rgb: GOLD, ground: true,
        fireCd: rand(0.55, 1.1),
        w: 26, h: 34
      });
    }
  }

  function hpMul() {
    return isStorm() ? 1.22 : 1;
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    const y = G.stage === 2 ? 160 : GROUND - 36;
    const ground = G.stage !== 2;
    spawnEnt({
      type: 'mid',
      x: VW + 40, y: y,
      vx: ground ? 0 : -36, vy: 0,
      hp: Math.round((st.midHp || 42) * hpMul()),
      r: 28, score: 2000, gold: 80,
      rgb: HOT, ground: ground,
      fireCd: 0.8,
      w: 56, h: 40,
      baseY: y
    });
    toast(st.mid + ' 现身', false, true);
    audio.boss();
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const ground = G.stage === 1;
    const y = ground ? GROUND - 48 : (G.stage === 2 ? 170 : 200);
    spawnEnt({
      type: 'boss',
      x: VW + 50, y: y,
      vx: 0, vy: 0,
      hp: Math.round((st.bossHp || 96) * hpMul()),
      r: G.stage === 3 ? 42 : 36,
      score: 4000, gold: 120,
      rgb: G.stage === 3 ? MAG : (G.stage === 2 ? CYN : HOT),
      ground: ground,
      fireCd: 0.6,
      w: 88, h: 52,
      baseY: y
    });
    toast(st.boss + ' · 关底', true, false);
    audio.boss();
    syncHud();
  }

  function runWave(w) {
    if (w.kind === 'imps') spawnImps(w.n);
    else if (w.kind === 'wyrm') spawnWyrm();
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'drake') spawnDrake();
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'tanks') spawnTanks();
    else if (w.kind === 'ruins') spawnRuins();
    else if (w.kind === 'idols') spawnIdols();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function dropCoins(x, y, n, val) {
    n = n || 1;
    for (let i = 0; i < n; i++) {
      G.coins.push({
        x: x + rand(-8, 8),
        y: y + rand(-8, 8),
        vx: rand(-50, 30),
        vy: rand(-90, -20),
        v: val || 15,
        t: 0,
        life: 7.5
      });
    }
    capArr(G.coins, 48);
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.1,
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
    if (G.shots.length > 96) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx, vy: spec.vy,
      r: spec.r || 3.2,
      rgb: spec.rgb,
      dmg: spec.dmg || 1,
      sat: !!spec.sat
    });
  }

  function cannonTip() {
    const a = G.aimAng;
    return {
      x: G.player.x + Math.cos(a) * 22,
      y: G.player.y + Math.sin(a) * 22 - 2
    };
  }

  function fire(demo) {
    if (!demo && (G.mode !== 'play' || G.deadT > 0)) return;
    if (G.fireCd > 0) return;
    const a = G.aimAng;
    const tip = cannonTip();
    G.muzzle = 0.05;
    G.fireCd = demo ? 0.16 : (isStorm() ? 0.1 : 0.108) - G.spread * 0.008;
    const spd = 640;
    const rgb = G.spread >= 2 ? GOLD : G.spread >= 1 ? HOT : WHT;
    let fans;
    if (G.spread <= 0) fans = [0];
    else if (G.spread === 1) fans = [-0.24, 0, 0.24];
    else fans = [-0.42, -0.21, 0, 0.21, 0.42];
    for (let i = 0; i < fans.length; i++) {
      const ang = a + fans[i];
      addShot({
        x: tip.x, y: tip.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 3.2, rgb: rgb, dmg: 1
      });
    }
    for (let i = 0; i < G.sats.length; i++) {
      const s = G.sats[i];
      addShot({
        x: s.x + Math.cos(a) * 8,
        y: s.y + Math.sin(a) * 8,
        vx: Math.cos(a) * 560,
        vy: Math.sin(a) * 560,
        r: 2.6, rgb: CYN, dmg: 1, sat: true
      });
    }
    if (!demo) audio.shoot();
    emit(3, {
      x: tip.x, y: tip.y, j: 3,
      vx0: Math.cos(a) * 40, vx1: Math.cos(a) * 120,
      vy0: Math.sin(a) * 40, vy1: Math.sin(a) * 120,
      life: 0.12, r0: 1, r1: 2.2, rgb: rgb, g: 0
    });
  }

  function findBig() {
    let mid = null;
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if (t === 'boss' && G.ents[i].hp > 0) return G.ents[i];
      if (t === 'mid' && G.ents[i].hp > 0) mid = G.ents[i];
    }
    return mid;
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
      hitStop(0.032);
      return;
    }
    killEnt(en);
  }

  function killEnt(en) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    const pwr = en.type === 'boss' ? 2.8 : en.type === 'mid' ? 2.1 : en.ground ? 1.2 : 0.85;
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
    hitStop(clamp(0.036 + G.combo * 0.0028, 0.036, 0.074));
    const nCoin = en.type === 'boss' ? 5 : en.type === 'mid' ? 3 : en.ground ? 2 : 1;
    dropCoins(en.x, en.y, nCoin, en.gold || 15);
    if (en.type === 'boss') {
      G.stageClearT = 1.85;
      addScore(1500 * G.stage);
      addGold(en.gold || 120);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      toast((STAGES[G.stage - 1] ? STAGES[G.stage - 1].boss : '关底') + ' 击坠', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickCoin(c) {
    addGold(c.v);
    addScore(10 * G.mult);
    audio.coin();
    emit(6, {
      x: c.x, y: c.y, j: 4,
      vx0: -60, vx1: 60, vy0: -90, vy1: -10,
      life: 0.22, r0: 1, r1: 2.4, rgb: GOLD, g: 0
    });
    floatText(c.x, c.y - 8, '+' + c.v, GOLD, false);
    if (goldEl) {
      goldEl.parentNode.classList.remove('flash');
      void goldEl.parentNode.offsetWidth;
      goldEl.parentNode.classList.add('flash');
    }
  }

  function buySpread() {
    if (G.mode !== 'shop') return;
    if (G.spread >= SPREAD_MAX) {
      toast('散射已满', false, true);
      audio.poor();
      return;
    }
    const c = spreadCost();
    if (G.gold < c) {
      toast('金币不够', true, false);
      audio.poor();
      return;
    }
    G.gold -= c;
    G.spread += 1;
    audio.buy();
    toast('散射 · ' + SPREAD_NAME[G.spread], false, true);
    flashChip(wpnLabel, 'wpn');
    juice(G.player.x, G.player.y, GOLD, 1.2);
    if (stageEl) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
      setTimeout(function () { if (stageEl) stageEl.classList.remove('pow'); }, 300);
    }
    syncShopBtns();
    syncHud();
  }

  function buySat() {
    if (G.mode !== 'shop') return;
    if (G.sats.length >= SAT_MAX) {
      toast('卫星已满', false, true);
      audio.poor();
      return;
    }
    const c = satCost();
    if (G.gold < c) {
      toast('金币不够', true, false);
      audio.poor();
      return;
    }
    G.gold -= c;
    const ang = G.sats.length * Math.PI;
    G.sats.push({
      ang: ang,
      x: G.player.x + Math.cos(ang) * 34,
      y: G.player.y + Math.sin(ang) * 34
    });
    audio.buy();
    toast('卫星 ×' + G.sats.length, false, true);
    flashChip(satLabel, 'sat');
    juice(G.player.x, G.player.y, CYN, 1.2);
    if (stageEl) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
      setTimeout(function () { if (stageEl) stageEl.classList.remove('pow'); }, 300);
    }
    syncShopBtns();
    syncHud();
  }

  function leaveShop() {
    if (G.mode !== 'shop') return;
    G.mode = 'play';
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.invuln = Math.max(G.invuln, 0.9);
    G.stageClearT = 0;
    hideOverlay();
    toast(STAGES[G.stage - 1].name, false, true);
    audio.wave();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function openShop() {
    G.mode = 'shop';
    G.eShots.length = 0;
    G.fireHold = false;
    showOverlay('shop', '武装店', shopLead(), 'SHOP');
    audio.shop();
    syncHud();
  }

  function hurtPlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.invuln = 0;
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.4);
    audio.death();
    hitStop(0.072);
    kick(8);
    screenFlash(MAG, 0.55);
    breakCombo();
    syncPips();
    syncHud();
  }

  function respawn() {
    G.player.x = 88;
    G.player.y = VH * 0.5;
    G.player.vx = 0;
    G.player.vy = 0;
    G.aimAng = 0;
    G.deadT = 0;
    G.invuln = 1.52;
    G.eShots.length = 0;
    toast('再起', false, false);
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '坠入忘界';
    showOverlay(
      'lose',
      '坠入忘界',
      '甲碎了。分数 ' + G.score + ' · 金币 ' + G.gold + ' · 连击峰值记在这一局。R 立刻再开。',
      'DOWN'
    );
    audio.lose();
    syncHud();
  }

  function winGame() {
    addScore(6000 + G.lives * 400 + G.gold);
    G.mode = 'win';
    showOverlay(
      'win',
      isStorm() ? '弹幕穿过' : '神殿重光',
      '三关打穿。分数 ' + G.score + ' · 剩余命 ' + G.lives + ' · 金币 ' + G.gold + '。',
      'CLEAR'
    );
    audio.win();
    juice(G.player.x, G.player.y, GOLD, 2.6);
    syncHud();
  }

  function thinkWaves() {
    const st = STAGES[G.stage - 1];
    if (!st || G.stageClearT > 0) return;
    if (hasBig()) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      runWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function stormExtra(dt) {
    if (!isStorm() || G.deadT > 0 || hasBig()) return;
    G.spawnT -= dt;
    if (G.spawnT <= 0 && G.ents.length < 22) {
      G.spawnT = rand(2.4, 3.6);
      if (Math.random() < 0.5) spawnImp(VW + 16, 50 + rand(0, 260), { rgb: PNK, vx: -150, fireCd: 0.6 });
      else if (Math.random() < 0.5) spawnDive(3);
    }
  }

  function updateSats(dt) {
    const n = G.sats.length;
    for (let i = 0; i < n; i++) {
      const s = G.sats[i];
      s.ang += dt * 2.35;
      const rad = 34 + (n > 1 ? 2 : 0);
      s.x = G.player.x + Math.cos(s.ang) * rad;
      s.y = G.player.y + Math.sin(s.ang) * rad;
    }
  }

  function updateAim(dt) {
    const ax = (keys.aimR ? 1 : 0) - (keys.aimL ? 1 : 0);
    const ay = (keys.aimD ? 1 : 0) - (keys.aimU ? 1 : 0);
    if (ax || ay) {
      G.aimAng = Math.atan2(ay, ax);
      aimSrc = 'key';
    } else if ((pointer.hover || pointer.down) && aimSrc === 'ptr') {
      const dx = pointer.x - G.player.x;
      const dy = pointer.y - G.player.y;
      if (dx * dx + dy * dy > 16) G.aimAng = Math.atan2(dy, dx);
    }
  }

  function fireAtPlayer(en, spd, rgb, r) {
    const s = (isStorm() ? spd * 1.18 : spd);
    aimShot(en.x, en.y, s, rgb || en.rgb, r);
  }

  function updateEnts(dt) {
    const scr = scrollSpd();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }

      if (en.ground && en.vx === 0 && en.type !== 'mid' && en.type !== 'boss') {
        en.x -= scr * dt;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.type === 'imp') {
        en.y = en.baseY + Math.sin(en.t * 3.2 + en.phase) * 18;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && G.mode === 'play') {
          en.fireCd = (isStorm() ? 1.05 : 1.55) + rand(0, 0.5);
          fireAtPlayer(en, 150, MAG, 3);
        }
      } else if (en.type === 'wyrm') {
        en.y = en.baseY + Math.sin(en.t * 2.6 + en.phase) * 46;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && G.mode === 'play') {
          en.fireCd = isStorm() ? 1.2 : 1.8;
          fireAtPlayer(en, 160, TEAL, 3);
        }
      } else if (en.type === 'dive') {
        if (en.y < G.player.y + 10) {
          en.vy = Math.min(240, en.vy + 140 * dt);
          const dx = G.player.x - en.x;
          en.vx += clamp(dx * 0.8, -90, 40) * dt;
        } else {
          en.vy = Math.min(280, en.vy + 80 * dt);
        }
      } else if (en.type === 'drake') {
        en.y = en.baseY + Math.sin(en.t * 1.5) * 28;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && G.mode === 'play') {
          en.fireCd = isStorm() ? 0.7 : 1.05;
          fireAtPlayer(en, 180, ORG, 3.6);
          if (isStorm()) {
            const a = Math.atan2(G.player.y - en.y, G.player.x - en.x);
            eShot(en.x, en.y, Math.cos(a + 0.22) * 160, Math.sin(a + 0.22) * 160, RED, 3);
            eShot(en.x, en.y, Math.cos(a - 0.22) * 160, Math.sin(a - 0.22) * 160, RED, 3);
          }
        }
      } else if (en.type === 'turret' || en.type === 'tank' || en.type === 'ruin' || en.type === 'idol') {
        en.y = GROUND - (en.type === 'idol' ? 26 : en.type === 'ruin' ? 22 : 16);
        en.fireCd -= dt;
        if (en.fireCd <= 0 && G.mode === 'play') {
          const cd = en.type === 'idol' ? 0.85 : en.type === 'turret' ? 0.95 : 1.15;
          en.fireCd = (isStorm() ? cd * 0.72 : cd) + rand(0, 0.25);
          fireAtPlayer(en, en.type === 'idol' ? 200 : 170, en.type === 'idol' ? GOLD : SAND, 3.3);
        }
        en.ang = Math.atan2(G.player.y - en.y, G.player.x - en.x);
      } else if (en.type === 'mid') {
        if (en.x > VW - 150) en.x -= 48 * dt;
        else en.x = VW - 150 + Math.sin(en.t * 0.7) * 18;
        if (!en.ground) en.y = en.baseY + Math.sin(en.t * 1.1) * 40;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && G.mode === 'play') {
          en.fireCd = isStorm() ? 0.55 : 0.78;
          if ((en.t * 2 | 0) % 3 === 0) ringShot(en.x, en.y, isStorm() ? 8 : 6, 130, en.t, HOT, 3.4);
          else fireAtPlayer(en, 200, HOT, 4);
        }
      } else if (en.type === 'boss') {
        if (en.x > VW - 170) en.x -= 42 * dt;
        else {
          en.x = VW - 170 + Math.sin(en.t * 0.55) * 22;
          if (!en.ground) en.y = clamp(en.baseY + Math.sin(en.t * 0.9) * 70, 70, GROUND - 60);
        }
        en.fireCd -= dt;
        if (en.fireCd <= 0 && G.mode === 'play') {
          const rage = en.hp < en.maxHp * 0.45;
          en.fireCd = (isStorm() ? 0.42 : 0.58) * (rage ? 0.72 : 1);
          const n = (G.stage === 3 ? 10 : 7) + (rage ? 3 : 0) + (isStorm() ? 2 : 0);
          if (G.stage === 1) {
            if (rage) ringShot(en.x, en.y - 10, n, 140, en.t, HOT, 3.6);
            fireAtPlayer(en, 210, ORG, 4.2);
            eShot(en.x - 20, en.y, -90, -160, SAND, 4);
            eShot(en.x - 10, en.y, -40, -180, SAND, 4);
          } else if (G.stage === 2) {
            ringShot(en.x, en.y, n, 150, en.t * 1.3, CYN, 3.3);
            if (rage) fireAtPlayer(en, 230, TEAL, 4);
          } else {
            ringShot(en.x, en.y, n, 155, en.t, MAG, 3.4);
            ringShot(en.x, en.y, 6, 110, -en.t * 0.7, GOLD, 3.2);
            if (rage) fireAtPlayer(en, 240, MAG, 4.4);
          }
        }
      }

      if (en.x < -80 || en.x > VW + 140 || en.y < -80 || en.y > VH + 80) {
        G.ents.splice(i, 1);
        continue;
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !en.ground) {
        const pr = 10;
        if (hypot(en.x - G.player.x, en.y - G.player.y) < pr + en.r * 0.72) {
          hurtPlayer();
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < -20 || s.x > VW + 20 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (hypot(s.x - en.x, s.y - en.y) < en.r + s.r) {
          hurtEnt(en, s.dmg, s.x, s.y);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < -16 || s.x > VW + 16 || s.y < -16 || s.y > VH + 16) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hypot(s.x - G.player.x, s.y - G.player.y) < 10 + s.r) {
          G.eShots.splice(i, 1);
          hurtPlayer();
        }
      }
    }
  }

  function updateCoins(dt) {
    const scr = scrollSpd() * 0.35;
    for (let i = G.coins.length - 1; i >= 0; i--) {
      const c = G.coins[i];
      c.t += dt;
      c.life -= dt;
      c.vy += 220 * dt;
      if (c.y > GROUND - 8) {
        c.y = GROUND - 8;
        c.vy *= -0.35;
        c.vx *= 0.8;
      }
      const dx = G.player.x - c.x;
      const dy = G.player.y - c.y;
      const d = hypot(dx, dy);
      if (G.mode === 'play' && G.deadT <= 0 && d < 56) {
        c.vx += dx * 9 * dt;
        c.vy += dy * 9 * dt;
      }
      c.x += (c.vx - scr) * dt;
      c.y += c.vy * dt;
      if (G.mode === 'play' && G.deadT <= 0 && d < 16) {
        pickCoin(c);
        G.coins.splice(i, 1);
        continue;
      }
      if (c.life <= 0 || c.x < -20) G.coins.splice(i, 1);
    }
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      d.x -= scr * d.z * 0.35 * dt;
      if (d.x < -8) d.x = VW + rand(0, 40);
    }
    for (let i = 0; i < columns.length; i++) {
      const c = columns[i];
      c.x -= scr * 0.55 * dt;
      if (c.x < -60) {
        c.x = VW + 40 + hash2((G.scroll | 0) + i) * 80;
        c.h = 48 + hash2((G.scroll | 0) * i + 3) * 90;
      }
    }
    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      r.x -= scr * r.z * 0.25 * dt;
      if (r.x < -40) r.x = VW + 20 + rand(0, 80);
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.muzzle > 0) G.muzzle -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 4.2;
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
  }

  function jetpack(dt) {
    G.jetT += dt;
    if (G.deadT > 0) return;
    if (G.jetT >= 0.04) {
      G.jetT = 0;
      emit(1, {
        x: G.player.x - 12, y: G.player.y + 6, j: 2,
        vx0: -90, vx1: -40, vy0: 10, vy1: 50,
        life: 0.18, r0: 1.2, r1: 2.6, rgb: Math.random() < 0.5 ? HOT : GOLD, g: -40
      });
    }
  }

  function updatePlayer(dt) {
    if (G.mode !== 'play' || G.deadT > 0) return;
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
    } else if (pointer.down && aimSrc === 'ptr') {
      const near = hypot(pointer.x - G.player.x, pointer.y - G.player.y) < 96;
      if (near) {
        G.player.x = lerp(G.player.x, pointer.x, 1 - Math.exp(-dt * 10));
        G.player.y = lerp(G.player.y, pointer.y, 1 - Math.exp(-dt * 10));
        G.player.vx = 0;
        G.player.vy = 0;
      } else {
        G.player.vx *= Math.exp(-dt * 10);
        G.player.vy *= Math.exp(-dt * 10);
      }
    } else {
      G.player.vx *= Math.exp(-dt * 10);
      G.player.vy *= Math.exp(-dt * 10);
    }
    G.player.x += G.player.vx * dt;
    G.player.y += G.player.vy * dt;
    G.player.x = clamp(G.player.x, 28, VW - 28);
    G.player.y = clamp(G.player.y, 28, GROUND - 18);
    const wantBank = clamp(G.player.vy * 0.0016, -0.32, 0.32);
    G.player.bank = lerp(G.player.bank || 0, wantBank, 1 - Math.exp(-dt * 10));
    updateSats(dt);
    jetpack(dt);
  }

  function nearestEnt() {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const d = hypot(en.x - G.player.x, en.y - G.player.y);
      if (d < bd) {
        bd = d;
        best = en;
      }
    }
    return best;
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.18);
      return;
    }
    updateFx(dt);
    updateAim(dt);

    if (G.mode === 'title') {
      G.player.x = 88;
      G.player.y = VH * 0.5 + Math.sin(G.t * 0.8) * 36;
      G.player.bank = Math.sin(G.t * 0.8) * 0.12;
      const n = nearestEnt();
      if (n) G.aimAng = Math.atan2(n.y - G.player.y, n.x - G.player.x);
      else G.aimAng = Math.sin(G.t * 0.7) * 0.6;
      updateSats(dt);
      jetpack(dt);
      G.spawnT -= dt;
      if (G.spawnT <= 0) {
        spawnImps(4);
        G.spawnT = 2.8;
      }
      if (G.fireCd > 0) G.fireCd -= dt;
      else fire(true);
      updateEnts(dt);
      updateShots(dt);
      updateWorld(dt * 0.55);
      updateCoins(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      updateSats(dt);
      return;
    }

    if (G.mode === 'shop') {
      updateWorld(dt * 0.35);
      updateSats(dt);
      jetpack(dt);
      G.player.y = lerp(G.player.y, VH * 0.5, 1 - Math.exp(-dt * 2));
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
        openShop();
        return;
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire(false);

    thinkWaves();
    stormExtra(dt);
    updateEnts(dt);
    updateShots(dt);
    updateCoins(dt);
  }

  function skyColors() {
    const b = biome();
    if (b === 'cloud') return { a: [18, 10, 28], b: [48, 22, 36], g: [42, 28, 40] };
    if (b === 'temple') return { a: [22, 8, 8], b: [48, 18, 12], g: [52, 24, 14] };
    return { a: [20, 10, 6], b: [56, 28, 10], g: [58, 36, 16] };
  }

  function drawWorld() {
    const pal = skyColors();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, rgba(pal.a, 1));
    g.addColorStop(0.55, rgba(pal.b, 1));
    g.addColorStop(1, rgba(pal.g, 1));
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.fillStyle = rgba(HOT, 0.08);
    ctx.beginPath();
    ctx.arc(sx(VW * 0.78), sy(70), 70 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.22);
    ctx.beginPath();
    ctx.arc(sx(VW * 0.78), sy(70), 28 * scale, 0, TAU);
    ctx.fill();

    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      ctx.fillStyle = rgba(STONE, 0.22 * r.z);
      ctx.beginPath();
      ctx.ellipse(sx(r.x), sy(r.y), r.r * scale, r.r * 0.45 * scale, 0, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      ctx.fillStyle = rgba(GOLD, d.a * 0.35);
      ctx.fillRect(sx(d.x), sy(d.y), d.w * scale, 1.2 * scale);
    }

    const gy = sy(GROUND);
    ctx.fillStyle = rgba(STONE, 0.95);
    ctx.fillRect(sx(0), gy, VW * scale, (VH - GROUND) * scale);
    ctx.fillStyle = rgba(SAND, 0.55);
    ctx.fillRect(sx(0), gy, VW * scale, 4 * scale);

    for (let i = 0; i < columns.length; i++) {
      const c = columns[i];
      const x = sx(c.x);
      const w = c.w * scale;
      const h = c.h * scale;
      ctx.fillStyle = rgba(c.kind > 0.5 ? STONE : SAND, 0.85);
      ctx.fillRect(x, gy - h, w, h);
      ctx.fillStyle = rgba(GOLD, 0.18);
      ctx.fillRect(x, gy - h, w, 4 * scale);
      if (c.kind > 0.6) {
        ctx.fillStyle = rgba(HOT, 0.25);
        ctx.fillRect(x + w * 0.3, gy - h + 8 * scale, w * 0.4, 10 * scale);
      }
    }

    const stripe = ((G.scroll * 0.4) % 40);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = -stripe; x < VW; x += 40) {
      ctx.fillRect(sx(x), gy + 8 * scale, 18 * scale, 6 * scale);
    }
  }

  function drawWarrior(x, y, a, alpha) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.bank || 0);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    const flash = G.muzzle > 0;

    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.quadraticCurveTo(-26, 10 + Math.sin(G.t * 28) * 3, -14, 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(1, 16, 10, 3.2, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(ORG, 0.95);
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(8, -4);
    ctx.lineTo(10, 10);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(-4, 10, 5, 8);
    ctx.fillRect(2, 10, 5, 8);

    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(2, -8, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(2, -9, 5.6, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(-2.4, -9, 9, 3);

    ctx.save();
    ctx.translate(6, -1);
    ctx.rotate(a - (G.player.bank || 0));
    ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
    ctx.shadowColor = rgba(GOLD, 0.7);
    ctx.shadowBlur = 8;
    ctx.fillRect(0, -2.2, 20, 4.4);
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, TAU);
    ctx.fill();
    if (flash) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.moveTo(20, -3.4);
      ctx.lineTo(30, 0);
      ctx.lineTo(20, 3.4);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillRect(-8, 2, 4, 6);
    ctx.restore();
  }

  function drawSat(s) {
    ctx.save();
    ctx.translate(sx(s.x), sy(s.y));
    ctx.rotate(s.ang);
    ctx.scale(scale, scale);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.shadowColor = rgba(CYN, 0.8);
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, TAU);
    ctx.fill();
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
      ctx.ellipse(1, 10, en.w * 0.42, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.shadowBlur = 10;
    }
    if (en.type === 'imp') {
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -8);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.4);
      ctx.beginPath();
      ctx.arc(2, -2, 1.6, 0, TAU);
      ctx.fill();
    } else if (en.type === 'wyrm') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 7, 0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-4, -2, 10, 3);
    } else if (en.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(8, -4);
      ctx.lineTo(0, -2);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'drake') {
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-4, -12);
      ctx.lineTo(-14, -4);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-14, 8);
      ctx.lineTo(-4, 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-2, -3, 10, 6);
    } else if (en.type === 'turret') {
      ctx.fillStyle = flash ? '#fff' : rgba(STONE, 0.95);
      ctx.beginPath();
      ctx.arc(0, 4, 12, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.rotate(en.ang || 0);
      ctx.fillRect(4, -2.1, 14, 4.2);
      ctx.restore();
    } else if (en.type === 'tank') {
      ctx.fillRect(-16, -6, 32, 14);
      ctx.fillRect(-18, 6, 10, 5);
      ctx.fillRect(8, 6, 10, 5);
      ctx.fillStyle = rgba(WHT, 0.22);
      ctx.fillRect(-8, -3, 16, 5);
      ctx.save();
      ctx.rotate(en.ang || 0);
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.85);
      ctx.fillRect(4, -1.6, 14, 3.2);
      ctx.restore();
    } else if (en.type === 'ruin') {
      ctx.fillRect(-18, -10, 36, 22);
      ctx.fillStyle = 'rgba(18, 12, 8, 0.85)';
      ctx.fillRect(-10, -4, 8, 8);
      ctx.fillRect(4, -4, 8, 8);
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.8);
      ctx.fillRect(-2, -16, 4, 12);
    } else if (en.type === 'idol') {
      ctx.fillRect(-8, -16, 16, 32);
      ctx.beginPath();
      ctx.arc(0, -20, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-3, -6, 6, 10);
    } else if (en.type === 'mid') {
      if (en.ground) {
        ctx.fillRect(-30, -14, 60, 30);
        ctx.fillRect(-16, -24, 32, 14);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, 34, 16, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-8, -18, 16, 12);
      }
      ctx.fillStyle = rgba(GOLD, 0.65);
      ctx.fillRect(-8, -4, 16, 8);
    } else if (en.type === 'boss') {
      if (G.stage === 1) {
        ctx.fillRect(-48, -18, 96, 40);
        ctx.fillRect(-20, -36, 40, 22);
        ctx.fillRect(-40, 16, 18, 12);
        ctx.fillRect(22, 16, 18, 12);
      } else if (G.stage === 2) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 52, 18, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-8, -22, 16, 16);
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-70, -16);
        ctx.lineTo(-52, 8);
        ctx.fill();
      } else {
        ctx.fillRect(-52, -20, 104, 44);
        ctx.beginPath();
        ctx.arc(0, -28, 22, 0, TAU);
        ctx.fill();
        ctx.fillRect(-36, 18, 16, 14);
        ctx.fillRect(20, 18, 16, 14);
        ctx.fillStyle = rgba(GOLD, 0.55);
        ctx.fillRect(-10, -8, 20, 12);
      }
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-22, -2, 8, 8);
      ctx.fillRect(14, -2, 8, 8);
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(Math.atan2(s.vy, s.vx));
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = 9 * scale;
      const L = s.sat ? 10 : 14;
      ctx.fillRect(-L * 0.5 * scale, -1.5 * scale, L * scale, 3 * scale);
      if (!REDUCE) {
        ctx.globalAlpha = 0.32;
        ctx.fillRect((-L * 0.5 - 8) * scale, -1.1 * scale, 10 * scale, 2.2 * scale);
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
  }

  function drawCoins() {
    for (let i = 0; i < G.coins.length; i++) {
      const c = G.coins[i];
      const bob = Math.sin(c.t * 8) * 2;
      ctx.save();
      ctx.translate(sx(c.x), sy(c.y + bob));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.shadowColor = rgba(GOLD, 0.85);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([90, 50, 8], 0.9);
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('金', 0, 1);
      ctx.restore();
    }
  }

  function drawAim() {
    if (G.deadT > 0) return;
    const a = G.aimAng;
    const tip = cannonTip();
    const len = 96;
    const ax = G.player.x + Math.cos(a) * len;
    const ay = G.player.y + Math.sin(a) * len;
    ctx.save();
    ctx.strokeStyle = rgba(GOLD, 0.28);
    ctx.lineWidth = 1.2 * scale;
    ctx.setLineDash([5 * scale, 6 * scale]);
    ctx.beginPath();
    ctx.moveTo(sx(tip.x), sy(tip.y));
    ctx.lineTo(sx(ax), sy(ay));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgba(HOT, 0.85);
    ctx.lineWidth = 1.6 * scale;
    const r = 8 * scale;
    ctx.beginPath();
    ctx.arc(sx(ax), sy(ay), r, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(ax) - 12 * scale, sy(ay));
    ctx.lineTo(sx(ax) + 12 * scale, sy(ay));
    ctx.moveTo(sx(ax), sy(ay) - 12 * scale);
    ctx.lineTo(sx(ax), sy(ay) + 12 * scale);
    ctx.stroke();
    ctx.restore();
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
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
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
    const boss = findBig();
    if (!boss) return;
    const x = 70;
    const y = 16;
    const w = VW - 140;
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
    ctx.fillStyle = '#140c06';
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
    drawCoins();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) {
        for (let i = 0; i < G.sats.length; i++) drawSat(G.sats[i]);
        drawWarrior(G.player.x, G.player.y, G.aimAng, 1);
        if (G.mode === 'play' || G.mode === 'title') drawAim();
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
    G.coins.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'storm' ? 'storm' : 'raid';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.lives = LIVES;
    G.score = 0;
    G.gold = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.spread = 0;
    G.sats.length = 0;
    G.player.x = 88;
    G.player.y = VH * 0.5;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    G.aimAng = 0;
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
    G.jetT = 0;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    if (goldEl) goldEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isStorm() ? '弹幕 · 更密更快' : '扫荡 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.spread = 0;
    G.sats.length = 0;
    G.combo = 0;
    G.mult = 1;
    G.gold = 0;
    G.deadT = 0;
    G.player.x = 88;
    G.player.y = VH * 0.5;
    G.aimAng = 0;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '忘界',
      '飞甲武士停在左舷。360° 转炮，空中地面都能打。拾金币进店买散射、卫星。撞机扣一命。',
      'FORG'
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
    else if (G.mode === 'shop') leaveShop();
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('storm');
    else if (G.mode === 'shop') buySat();
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isStorm()) goTitle();
      else startGame('storm');
    }
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const isAim = k === 'i' || k === 'I' || k === 'j' || k === 'J' || k === 'k' || k === 'K' || k === 'l' || k === 'L';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (k === 'j' || k === 'J') {
      keys.aimL = down;
      if (down) aimSrc = 'key';
    }
    if (k === 'l' || k === 'L') {
      keys.aimR = down;
      if (down) aimSrc = 'key';
    }
    if (k === 'i' || k === 'I') {
      keys.aimU = down;
      if (down) aimSrc = 'key';
    }
    if (k === 'k' || k === 'K') {
      keys.aimD = down;
      if (down) aimSrc = 'key';
    }

    if (down && (isMove || isAim || space || k === 'Enter')) e.preventDefault();

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
      if (G.mode === 'shop') buySpread();
      else if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '2') {
      if (G.mode === 'shop') buySat();
      else if (overlayOpen()) secondaryAction();
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
        fire(false);
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
      const stick = keys.aimL || keys.aimR || keys.aimU || keys.aimD;
      if (!stick) {
        aimSrc = 'ptr';
        G.aimAng = Math.atan2(pointer.y - G.player.y, pointer.x - G.player.x);
      }
      G.fireHold = true;
      if (G.mode === 'play') fire(false);
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      const stick = keys.aimL || keys.aimR || keys.aimU || keys.aimD;
      if (!stick && (pointer.down || e.pointerType === 'mouse')) {
        aimSrc = 'ptr';
        if (G.mode === 'play' || G.mode === 'title') {
          G.aimAng = Math.atan2(pointer.y - G.player.y, pointer.x - G.player.x);
        }
      }
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
  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
    });
  }
  if (btnSpread) btnSpread.addEventListener('click', function () { audio.ensure(); buySpread(); });
  if (btnSat) btnSat.addEventListener('click', function () { audio.ensure(); buySat(); });
  if (btnGo) btnGo.addEventListener('click', function () { audio.ensure(); leaveShop(); });
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && !isStorm()) startGame('storm');
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
      keys.aimL = false;
      keys.aimR = false;
      keys.aimU = false;
      keys.aimD = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
