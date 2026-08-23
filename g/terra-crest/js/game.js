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
  const PHOENIX_T = 6;
  const BEST_KEY = 'playbox-terra-crest-best';
  const MUTE_KEY = 'playbox-terra-crest-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 编队 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const WING_IDS = [2, 3, 4, 5];

  const MAG = [255, 61, 184];
  const ORG = [255, 138, 50];
  const SKY = [255, 196, 74];
  const GOLD = [255, 227, 107];
  const HOT = [255, 154, 58];
  const WHT = [255, 244, 232];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 96];
  const DIRT = [168, 96, 48];
  const RUST = [196, 82, 42];

  const STAGES = [
    {
      name: '第 1 关 · 荒陆',
      short: '荒陆',
      mid: '陆台',
      boss: '陆堡',
      midHp: 42,
      bossHp: 100,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 2.6, kind: 'silo', num: 2 },
        { t: 4.4, kind: 'tanks' },
        { t: 6.2, kind: 'stream', dir: 1 },
        { t: 8.0, kind: 'silo', num: 3 },
        { t: 9.8, kind: 'dive', n: 4 },
        { t: 11.6, kind: 'turrets' },
        { t: 13.4, kind: 'silo', num: 4 },
        { t: 15.2, kind: 'forts' },
        { t: 17.2, kind: 'v', n: 7 },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'silo', num: 5 },
        { t: 26.8, kind: 'tanks' },
        { t: 28.8, kind: 'dive', n: 5 },
        { t: 31.0, kind: 'silos' },
        { t: 33.2, kind: 'stream', dir: -1 },
        { t: 35.6, kind: 'forts' },
        { t: 38.0, kind: 'v', n: 7 },
        { t: 41.2, kind: 'tanks' },
        { t: 48.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 堡链',
      short: '堡链',
      mid: '链台',
      boss: '链核',
      midHp: 56,
      bossHp: 132,
      waves: [
        { t: 0.6, kind: 'v', n: 7 },
        { t: 2.2, kind: 'silo', num: 2 },
        { t: 3.8, kind: 'tanks' },
        { t: 5.4, kind: 'silos' },
        { t: 7.0, kind: 'dive', n: 5 },
        { t: 8.6, kind: 'silo', num: 3 },
        { t: 10.2, kind: 'stream', dir: -1 },
        { t: 11.8, kind: 'turrets' },
        { t: 13.4, kind: 'silo', num: 4 },
        { t: 15.0, kind: 'forts' },
        { t: 16.8, kind: 'v', n: 9 },
        { t: 18.6, kind: 'mid' },
        { t: 24.4, kind: 'silo', num: 5 },
        { t: 26.0, kind: 'tanks' },
        { t: 27.8, kind: 'dive', n: 6 },
        { t: 29.6, kind: 'silos' },
        { t: 31.4, kind: 'stream', dir: 1 },
        { t: 33.2, kind: 'forts' },
        { t: 35.2, kind: 'turrets' },
        { t: 37.2, kind: 'v', n: 9 },
        { t: 39.4, kind: 'tanks' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 核丘',
      short: '核丘',
      mid: '核卫',
      boss: '曼德拉',
      midHp: 70,
      bossHp: 176,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 1.8, kind: 'silo', num: 2 },
        { t: 3.2, kind: 'tanks' },
        { t: 4.6, kind: 'dive', n: 6 },
        { t: 6.0, kind: 'silo', num: 3 },
        { t: 7.4, kind: 'silos' },
        { t: 8.8, kind: 'stream', dir: 1 },
        { t: 10.2, kind: 'turrets' },
        { t: 11.6, kind: 'silo', num: 4 },
        { t: 13.0, kind: 'forts' },
        { t: 14.6, kind: 'v', n: 9 },
        { t: 16.2, kind: 'mid' },
        { t: 22.0, kind: 'silo', num: 5 },
        { t: 23.4, kind: 'tanks' },
        { t: 24.8, kind: 'dive', n: 7 },
        { t: 26.4, kind: 'silos' },
        { t: 28.0, kind: 'stream', dir: -1 },
        { t: 29.6, kind: 'forts' },
        { t: 31.2, kind: 'turrets' },
        { t: 32.8, kind: 'v', n: 11 },
        { t: 34.6, kind: 'tanks' },
        { t: 36.4, kind: 'silos' },
        { t: 38.4, kind: 'dive', n: 6 },
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
  const btnLand = document.getElementById('btn-land');
  const btnFort = document.getElementById('btn-fort');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnForm = document.getElementById('btn-form');
  const btnPad = document.getElementById('btn-pad');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const formLabel = document.getElementById('form-label');
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
  let formTok = 0;
  let formHeld = false;
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const tiles = [];
  const rocks = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'land',
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
    wings: { 2: false, 3: false, 4: false, 5: false },
    wingPos: {
      2: { x: 0, y: 0 },
      3: { x: 0, y: 0 },
      4: { x: 0, y: 0 },
      5: { x: 0, y: 0 }
    },
    form: 'stack',
    phoenix: 0,
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
    flashRgb: ORG,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    rushSpawn: 1.6,
    engineT: 0,
    spawnT: 0.4,
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
  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }
  function isFort() {
    return G.kind === 'fort';
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function plySpd() {
    return (isFort() ? 318 : 276) + wingCount() * 6;
  }
  function scrollSpd() {
    if (hasBig()) return isFort() ? 34 : 26;
    const base = isFort() ? 118 : 86;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isFort() ? 10 : 8);
  }
  function hpMul() {
    return isFort() ? 1.22 : 1;
  }
  function wingCount() {
    let n = 0;
    for (let i = 0; i < WING_IDS.length; i++) if (G.wings[WING_IDS[i]]) n += 1;
    return n;
  }
  function allWings() {
    return !!(G.wings[2] && G.wings[3] && G.wings[4] && G.wings[5]);
  }
  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'mid' || t === 'boss') && G.ents[i].hp > 0) return true;
    }
    return false;
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
      const n = wingCount();
      this.beep(680 + n * 48 + (G.phoenix > 0 ? 80 : 0), 0.046, 'square', 0.03, 1480);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.034, 0.032, 1200);
      this.beep(540 * lift, 0.064, 'square', 0.042, 920 * lift);
    },
    groundHit() {
      this.ensure();
      this.noise(0.06, 0.044, 380);
      this.beep(200, 0.1, 'sawtooth', 0.04, 68);
    },
    clang() {
      this.ensure();
      this.beep(320, 0.04, 'square', 0.022, 180);
      this.noise(0.03, 0.02, 1600);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.1, big ? 0.076 : 0.048, big ? 220 : 460);
      this.beep(big ? 150 : 240, big ? 0.26 : 0.14, 'sawtooth', 0.05, 50);
    },
    dock() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.14, 'triangle', 0.04, 1175);
      this.beep(1175, 0.18, 'sine', 0.032, 1568);
    },
    form() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(659, 0.12, 'triangle', 0.036, 988);
    },
    phoenix() {
      this.ensure();
      this.noise(0.22, 0.07, 240);
      this.beep(180, 0.28, 'sawtooth', 0.05, 90);
      this.beep(392, 0.16, 'sine', 0.045, 784);
      this.beep(784, 0.22, 'triangle', 0.04, 1568);
    },
    deny() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.03, 90);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    engine() {
      this.ensure();
      this.noise(0.028, 0.014, 140);
      this.beep(64, 0.034, 'sine', 0.018, 42);
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
    siloOpen() {
      this.ensure();
      this.beep(240, 0.06, 'square', 0.018, 420);
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

  function formText() {
    if (G.phoenix > 0) return '凰';
    const n = 1 + wingCount();
    const tag = G.form === 'spread' ? '散' : '合';
    if (n >= 5) return '编 5 · ' + tag;
    return '编 ' + n + (n > 1 ? ' · ' + tag : '');
  }

  function flashForm() {
    if (!formLabel) return;
    formLabel.classList.remove('hot');
    void formLabel.offsetWidth;
    formLabel.classList.add('hot');
    formTok += 1;
    const tok = formTok;
    setTimeout(function () {
      if (tok === formTok && formLabel) formLabel.classList.remove('hot');
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
      tagLabel.textContent = isFort() ? '堡海' : '征陆';
      tagLabel.classList.toggle('warn', isFort());
      tagLabel.classList.toggle('hot', !isFort() && G.stage >= 3);
    }
    if (formLabel) {
      formLabel.textContent = formText();
      formLabel.classList.toggle('max', allWings() && G.phoenix <= 0);
      formLabel.classList.toggle('phoenix', G.phoenix > 0);
    }
    if (btnForm) btnForm.classList.toggle('on', G.form === 'spread' || G.phoenix > 0);
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
    else if (G.mode === 'win') setHint('陆核尽破 · R 再来一局', 'hot');
    else if (G.phoenix > 0) setHint('凰化无敌 · 火羽贯穿', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 打仓对接 · Shift 合散', 'warn');
    else setHint('方向飞 · 空格射击 · Shift 合散 · 五机化凰 · 打仓对接', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TCRS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'win' && btnOvModes) {
      btnOvModes.textContent = isFort() ? '换模式' : '堡海';
    } else if (btnOvModes) {
      btnOvModes.textContent = '换模式';
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
    tiles.length = 0;
    rocks.length = 0;
    for (let i = 0; i < 36; i++) {
      tiles.push({
        x: (i % 6) * 86 + 24,
        y: Math.floor(i / 6) * 130 - 40,
        z: 0.7 + hash2(i * 9) * 0.5
      });
    }
    for (let i = 0; i < 18; i++) {
      rocks.push({
        x: hash2(i * 17 + 3) * VW,
        y: hash2(i * 11) * VH,
        w: 10 + hash2(i * 5) * 22,
        h: 6 + hash2(i * 7) * 10
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
      hitStop(0.046);
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
      rgb: spec.rgb,
      ang: spec.ang || 0,
      flash: 0,
      ground: !!spec.ground,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      num: spec.num || 0,
      lid: spec.lid != null ? spec.lid : 0,
      opened: false
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
      hp: 1, r: 10, score: 50,
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
        hp: 1, r: 10, score: 100,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnTank(x) {
    spawnEnt({
      type: 'tank',
      x: x == null ? rand(70, VW - 70) : x,
      y: -28,
      vx: rand(-40, 40),
      vy: 0,
      hp: 5, r: 16, score: 160,
      rgb: ORG,
      ground: true,
      w: 30, h: 18,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnTanks() {
    const n = isFort() ? 3 : 2;
    for (let i = 0; i < n; i++) spawnTank();
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 4, r: 13, score: 150,
      rgb: SKY,
      ground: true,
      w: 24, h: 18,
      fireCd: rand(0.4, 1.0)
    });
  }

  function spawnTurrets() {
    const n = isFort() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnTurret(clamp(x, 40, VW - 40), -24 - i * 16);
    }
  }

  function spawnFort(x) {
    spawnEnt({
      type: 'fort',
      x: x == null ? rand(80, VW - 80) : x,
      y: -34,
      vx: 0, vy: 0,
      hp: 8, r: 22, score: 300,
      rgb: RUST,
      ground: true,
      w: 44, h: 26,
      fireCd: rand(0.45, 0.95)
    });
  }

  function spawnForts() {
    const n = isFort() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 80 + i * ((VW - 160) / Math.max(1, n - 1)) + rand(-20, 20);
      spawnFort(clamp(x, 60, VW - 60));
    }
  }

  function spawnSilo(x, num) {
    spawnEnt({
      type: 'silo',
      x: x == null ? rand(64, VW - 64) : x,
      y: -32,
      vx: 0, vy: 0,
      hp: num ? 8 : 5,
      r: 18,
      score: num ? 200 : 120,
      rgb: num ? GOLD : DIRT,
      ground: true,
      w: 36, h: 32,
      num: num || 0,
      lid: 0,
      phase: rand(0, TAU),
      fireCd: rand(0.55, 1.3)
    });
  }

  function spawnSilos() {
    const n = isFort() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnSilo(clamp(x, 48, VW - 48), 0);
    }
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -70,
      vx: 52,
      vy: 44,
      hp: hp,
      r: 36,
      score: 2000,
      rgb: ORG,
      ground: true,
      w: 88,
      h: 40,
      fireCd: 0.48,
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
      y: -80,
      vx: 58,
      vy: 40,
      hp: hp,
      r: 48,
      score: 4000 + G.stage * 1500,
      rgb: MAG,
      ground: true,
      w: 118,
      h: 56,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.boss, false, true);
    audio.boss();
    screenFlash(MAG, 0.42);
    kick(5.4);
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'tanks') spawnTanks();
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'forts') spawnForts();
    else if (w.kind === 'silo') spawnSilo(VW * 0.5 + rand(-90, 90), w.num);
    else if (w.kind === 'silos') spawnSilos();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnWingPick(x, y, num, extra) {
    extra = extra || {};
    G.pows.push({
      kind: 'wing',
      num: num,
      x: x,
      y: y,
      vx: extra.vx != null ? extra.vx : rand(-30, 30),
      vy: extra.vy != null ? extra.vy : 42,
      t: 0
    });
  }

  function eShot(x, y, vx, vy, rgb, r) {
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      rgb: rgb || MAG, r: r || 3.2
    });
    capArr(G.eShots, 220);
  }

  function aimShot(x, y, spd, rgb, r) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = Math.max(1, hypot(dx, dy));
    eShot(x, y, dx / len * spd, dy / len * spd, rgb, r);
  }

  function ringShot(x, y, n, spd, rot, rgb, r) {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r);
    }
  }

  function addShot(spec) {
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0, vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb || WHT,
      dmg: spec.dmg || 1,
      pierce: !!spec.pierce,
      hits: []
    });
    capArr(G.shots, 160);
  }

  function targetOffset(n) {
    if (G.phoenix > 0) {
      if (n === 2) return [-30, 4];
      if (n === 3) return [0, 20];
      if (n === 4) return [30, 4];
      return [0, 36];
    }
    if (G.form === 'spread') {
      if (n === 2) return [-54, 8];
      if (n === 3) return [-28, -4];
      if (n === 4) return [54, 8];
      return [28, -4];
    }
    if (n === 2) return [-16, 12];
    if (n === 3) return [0, 18];
    if (n === 4) return [16, 12];
    return [0, 30];
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const n = wingCount();
    const phoenix = G.phoenix > 0;
    const spread = G.form === 'spread' && !phoenix;
    G.muzzle = 0.05;
    G.fireCd = phoenix ? 0.055 : 0.110 - n * 0.0095;
    const spd = -680;
    const rgb = phoenix ? GOLD : n >= 3 ? ORG : n >= 1 ? SKY : WHT;
    const dmg = phoenix ? 2 : 1;

    function gun(x, y, vx, vy) {
      addShot({
        x: x, y: y,
        vx: vx || 0,
        vy: vy == null ? spd : vy,
        r: phoenix ? 4.2 : 3.1,
        rgb: rgb,
        dmg: dmg,
        pierce: phoenix
      });
    }

    gun(G.player.x, G.player.y - 16);
    for (let i = 0; i < WING_IDS.length; i++) {
      const k = WING_IDS[i];
      if (!G.wings[k]) continue;
      const o = G.wingPos[k];
      let vx = 0;
      if (spread) {
        if (k === 2) vx = -160;
        else if (k === 3) vx = -70;
        else if (k === 4) vx = 160;
        else vx = 70;
      }
      gun(o.x, o.y - 10, vx, spd);
    }
    if (phoenix) {
      gun(G.player.x - 18, G.player.y - 8, -90, spd);
      gun(G.player.x + 18, G.player.y - 8, 90, spd);
      gun(G.player.x - 32, G.player.y, -180, spd * 0.96);
      gun(G.player.x + 32, G.player.y, 180, spd * 0.96);
    }
    audio.shoot();
    emit(3, {
      x: G.player.x, y: G.player.y - 14, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2, rgb: rgb, g: 0
    });
  }

  function dockWing(num, x, y) {
    if (G.wings[num]) {
      const pts = 400 * G.mult;
      addScore(pts);
      toast('已对接 ' + num, false, true);
      floatText(x, y, '+' + pts, GOLD, true);
      juice(x, y, GOLD, 0.9);
      audio.dock();
      hitStop(0.034);
      return;
    }
    G.wings[num] = true;
    G.wingPos[num].x = x;
    G.wingPos[num].y = y;
    const pts = 500 * G.mult;
    addScore(pts);
    toast(num + ' 对接', false, true);
    floatText(x, y - 8, num + ' 对接', GOLD, true);
    juice(x, y, GOLD, 1.2);
    audio.dock();
    hitStop(0.05);
    kick(3.2);
    flashForm();
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
    }
    if (allWings()) {
      toast('五机齐 · Shift 化凰', false, true);
      screenFlash(GOLD, 0.4);
    }
    syncHud();
  }

  function scatterWings() {
    for (let i = 0; i < WING_IDS.length; i++) {
      const n = WING_IDS[i];
      if (!G.wings[n]) continue;
      const p = G.wingPos[n];
      spawnWingPick(p.x, p.y, n, { vx: rand(-90, 90), vy: rand(-30, 70) });
      G.wings[n] = false;
    }
    G.form = 'stack';
    G.phoenix = 0;
    syncHud();
  }

  function startPhoenix() {
    G.phoenix = PHOENIX_T;
    G.invuln = Math.max(G.invuln, PHOENIX_T);
    toast('凰化', false, true);
    floatText(G.player.x, G.player.y - 28, '凰', GOLD, true);
    audio.phoenix();
    hitStop(0.078);
    kick(7.2);
    screenFlash(GOLD, 0.55);
    juice(G.player.x, G.player.y, GOLD, 2.2);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('form');
      void stageEl.offsetWidth;
      stageEl.classList.add('form');
    }
    flashForm();
    syncHud();
  }

  function endPhoenix() {
    G.phoenix = 0;
    scatterWings();
    toast('编队散开');
    audio.form();
    popSpark(G.player.x, G.player.y, GOLD, 28);
  }

  function doForm() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.phoenix > 0) return;
    if (allWings()) {
      startPhoenix();
      return;
    }
    if (wingCount() === 0) {
      toast('先对接僚机', true);
      audio.deny();
      return;
    }
    G.form = G.form === 'stack' ? 'spread' : 'stack';
    toast(G.form === 'spread' ? '散开' : '合阵', false, G.form === 'spread');
    audio.form();
    hitStop(0.04);
    kick(2.4);
    flashForm();
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('form');
      void stageEl.offsetWidth;
      stageEl.classList.add('form');
    }
    syncHud();
  }

  function siloOpen(en) {
    return en.lid > 0.42;
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0) return;
    if (en.type === 'silo' && !siloOpen(en)) {
      audio.clang();
      emit(3, {
        x: hx, y: hy, j: 4,
        vx0: -50, vx1: 50, vy0: -40, vy1: 20,
        life: 0.12, r0: 1, r1: 1.8, rgb: SKY, g: 80
      });
      return;
    }
    en.hp -= dmg || 1;
    en.flash = 0.08;
    hitStop(0.022);
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
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.ground ? 1.25 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    if (en.ground) {
      audio.groundHit();
      emit(12, {
        x: en.x, y: en.y, j: 10,
        vx0: -140, vx1: 140, vy0: -90, vy1: 50,
        life: 0.34, r0: 1.4, r1: 3.6, rgb: DIRT, g: 280
      });
    } else {
      audio.hit(G.combo);
    }
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.type === 'silo' && en.num) {
      spawnWingPick(en.x, en.y - 8, en.num, { vx: rand(-24, 24), vy: -36 });
      floatText(en.x, en.y - 22, 'WING ' + en.num, GOLD, true);
    }
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(1500 * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      const st = STAGES[G.stage - 1];
      toast((st ? st.short : '') + '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function playerHurtAt(x, y, r) {
    if (G.phoenix > 0) return false;
    if (dist2(x, y, G.player.x, G.player.y - 2) < (r + 5.2) * (r + 5.2)) return true;
    for (let i = 0; i < WING_IDS.length; i++) {
      const n = WING_IDS[i];
      if (!G.wings[n]) continue;
      const p = G.wingPos[n];
      if (dist2(x, y, p.x, p.y) < (r + 4.6) * (r + 4.6)) return true;
    }
    return false;
  }

  function killPlayer() {
    if (G.deadT > 0 || G.phoenix > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    scatterWings();
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    G.form = 'stack';
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
    addScore(isFort() ? 10000 : 8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    const tag = isFort() ? '堡海尽破' : '陆核尽破';
    showOverlay('win', tag, (isFort() ? '堡海通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingAir() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground) n += 1;
    }
    return n;
  }

  function landThink() {
    if (G.stageClearT > 0 || hasBig()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function fortThink(dt) {
    landThink();
    if (G.stageClearT > 0 || hasBig()) return;
    G.rushSpawn -= dt;
    if (G.rushSpawn > 0) return;
    G.rushSpawn = rand(1.55, 2.6);
    const r = Math.random();
    if (r < 0.28) spawnV(5 + G.stage);
    else if (r < 0.5) spawnTanks();
    else if (r < 0.7) spawnSilos();
    else if (r < 0.86) spawnDive(4 + G.stage);
    else spawnTurrets();
  }

  function bossFire(en) {
    const flak = isFort();
    const low = en.hp / en.maxHp < 0.42;
    en.fireCd = (en.type === 'boss' ? 0.42 : 0.55) - (low ? 0.12 : 0) - (flak ? 0.06 : 0);
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 10, 210, ORG, 3.4);
      if (flak || low) {
        eShot(en.x - 22, en.y + 8, -40, 200, SKY, 3);
        eShot(en.x + 22, en.y + 8, 40, 200, SKY, 3);
      }
      return;
    }
    const st = G.stage;
    if (st <= 1) {
      aimShot(en.x, en.y + 12, 220, MAG, 3.6);
      eShot(en.x - 28, en.y + 6, -30, 190, ORG, 3.2);
      eShot(en.x + 28, en.y + 6, 30, 190, ORG, 3.2);
      if (low) ringShot(en.x, en.y, 8, 150, en.t * 0.7, PNK, 3);
    } else if (st === 2) {
      ringShot(en.x, en.y, low ? 10 : 8, 160, en.t * 1.1, MAG, 3.1);
      aimShot(en.x, en.y + 14, 230, GOLD, 3.5);
    } else {
      ringShot(en.x, en.y, 10, 168, en.t * 0.9, MAG, 3.2);
      ringShot(en.x, en.y, 8, 128, -en.t * 0.7, ORG, 3);
      aimShot(en.x, en.y + 16, 240, GOLD, 3.8);
      if (low) {
        eShot(en.x - 40, en.y, -20, 210, PNK, 3.4);
        eShot(en.x + 40, en.y, 20, 210, PNK, 3.4);
      }
    }
  }

  function updateEnts(dt) {
    const scr = scrollSpd();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.ground) en.y += scr * dt;
      else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.type === 'silo') {
        const want = Math.sin(en.t * 1.55 + en.phase) > 0.12 ? 1 : 0;
        const prev = en.lid;
        en.lid = lerp(en.lid, want, 1 - Math.exp(-dt * 6));
        if (prev < 0.35 && en.lid >= 0.35 && !en.opened) {
          en.opened = true;
          audio.siloOpen();
        }
        if (en.lid < 0.2) en.opened = false;
      }

      if (en.type === 'dive' && en.y > 80 && en.y < G.player.y - 40) {
        const dx = G.player.x - en.x;
        en.vx = lerp(en.vx, clamp(dx * 1.6, -160, 160), 1 - Math.exp(-dt * 3));
        en.vy = 210;
      }

      if (en.type === 'tank') {
        if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
      }

      if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < 88) en.y += 42 * dt;
        else {
          en.y = 88 + Math.sin(en.t * 0.7) * 8;
          en.x += en.vx * dt;
          if (en.x < 90 || en.x > VW - 90) en.vx *= -1;
        }
      }

      if (en.y > VH + 50 || en.x < -60 || en.x > VW + 60 || en.y < -120) {
        G.ents.splice(i, 1);
        continue;
      }

      en.fireCd -= dt;
      if (en.fireCd <= 0 && G.mode === 'play' && G.deadT <= 0) {
        if (en.type === 'fighter' && Math.random() < 0.55) {
          aimShot(en.x, en.y + 6, 180 + (isFort() ? 30 : 0), MAG, 3);
          en.fireCd = rand(1.1, 2.2);
        } else if (en.type === 'dive' && en.y > 120) {
          eShot(en.x, en.y + 8, 0, 240, GOLD, 3.2);
          en.fireCd = 9;
        } else if (en.type === 'tank') {
          aimShot(en.x, en.y - 6, 190, ORG, 3.3);
          en.fireCd = rand(0.85, 1.5);
        } else if (en.type === 'turret') {
          aimShot(en.x, en.y - 4, 200, SKY, 3.2);
          en.fireCd = rand(0.7, 1.3);
        } else if (en.type === 'fort') {
          eShot(en.x - 12, en.y - 6, -50, 200, RUST, 3.3);
          eShot(en.x, en.y - 8, 0, 220, ORG, 3.3);
          eShot(en.x + 12, en.y - 6, 50, 200, RUST, 3.3);
          en.fireCd = rand(0.8, 1.4);
        } else if (en.type === 'silo' && siloOpen(en)) {
          aimShot(en.x, en.y - 4, 185, en.num ? GOLD : DIRT, 3.2);
          en.fireCd = rand(0.7, 1.25);
        } else if (en.type === 'mid' || en.type === 'boss') {
          bossFire(en);
        } else {
          en.fireCd = rand(0.8, 1.8);
        }
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !en.ground) {
        if (playerHurtAt(en.x, en.y, en.r * 0.72)) killPlayer();
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
      let dead = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (s.hits.indexOf(en) >= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          s.hits.push(en);
          hurtEnt(en, s.dmg || 1, s.x, s.y);
          if (!s.pierce) {
            dead = true;
            break;
          }
          if (s.hits.length >= 5) {
            dead = true;
            break;
          }
        }
      }
      if (dead) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && G.phoenix <= 0;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y > VH + 22 || s.y < -32 || s.x < -22 || s.x > VW + 22) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (canHurt && playerHurtAt(s.x, s.y, s.r)) {
        G.eShots.splice(i, 1);
        killPlayer();
      }
    }
  }

  function updatePows(dt) {
    const scr = scrollSpd() * 0.35;
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt + scr * dt;
      p.vx *= Math.exp(-dt * 0.9);
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH + 28 || p.t > 9) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        if (dist2(p.x, p.y, G.player.x, G.player.y) < 26 * 26) {
          dockWing(p.num, p.x, p.y);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function updateWings(dt) {
    const k = 1 - Math.exp(-dt * 12);
    for (let i = 0; i < WING_IDS.length; i++) {
      const n = WING_IDS[i];
      if (!G.wings[n]) continue;
      const t = targetOffset(n);
      const p = G.wingPos[n];
      p.x = lerp(p.x, G.player.x + t[0], k);
      p.y = lerp(p.y, G.player.y + t[1], k);
    }
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      t.y += scr * 0.85 * dt;
      if (t.y > VH + 70) {
        t.y -= 130 * 6;
        t.x = (i % 6) * 86 + 24 + (hash2((G.scroll + i) | 0) - 0.5) * 18;
      }
    }
    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      r.y += scr * dt;
      if (r.y > VH + 20) {
        r.y = -20 - rand(0, 40);
        r.x = hash2((G.scroll + i * 3) | 0) * VW;
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      trails.push({
        x: G.player.x + rand(-4, 4),
        y: G.player.y + 12,
        t: 0,
        r: rand(4, 8),
        rgb: G.phoenix > 0 ? GOLD : ORG
      });
      capArr(trails, 22);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt * 2.6;
      trails[i].y += 32 * dt;
      if (trails[i].t >= 1) trails.splice(i, 1);
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.4;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.4;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
  }

  function tickEngine(dt) {
    if (G.mode === 'lose' || (G.mode !== 'play' && G.mode !== 'title')) return;
    if (G.deadT > 0) return;
    G.engineT -= dt;
    if (G.engineT > 0) return;
    G.engineT = 0.09;
    if (!audio.muted && audio.ctx) audio.engine();
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
    updateWings(dt);
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      tickEngine(dt * 0.35);
      return;
    }
    updateFx(dt);
    tickEngine(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.player.bank = Math.sin(G.t * 0.7) * 0.12;
      G.wings[2] = true;
      G.wings[3] = true;
      G.wings[4] = true;
      G.wings[5] = true;
      updateWings(dt);
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
    if (G.phoenix > 0) {
      G.phoenix -= dt;
      G.invuln = Math.max(G.invuln, G.phoenix);
      if (G.phoenix <= 0) endPhoenix();
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
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isFort()) fortThink(dt);
    else landThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function hexPath(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * (Math.PI / 3);
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#1a0806');
    g.addColorStop(0.35, '#241008');
    g.addColorStop(1, '#120604');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.strokeStyle = 'rgba(255, 138, 50, 0.08)';
    ctx.lineWidth = 1;
    const off = (G.scroll * 0.35) % 44;
    for (let y = -44; y < VH + 44; y += 44) {
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(y + off));
      ctx.lineTo(sx(VW), sy(y + off + 12));
      ctx.stroke();
    }

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      hexPath(t.x, t.y, 28 * t.z);
      ctx.fillStyle = 'rgba(42, 18, 10, 0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 138, 50, 0.12)';
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    }

    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      ctx.fillStyle = 'rgba(80, 36, 16, 0.7)';
      ctx.beginPath();
      ctx.ellipse(sx(r.x), sy(r.y), r.w * scale, r.h * scale, 0, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      ctx.fillStyle = rgba(t.rgb, (1 - t.t) * 0.35);
      ctx.beginPath();
      ctx.arc(sx(t.x), sy(t.y), t.r * (1 - t.t) * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawShipBody(x, y, a, bank, small, num, phoenix) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(bank || 0);
    ctx.globalAlpha = a;
    const s = (small ? 0.72 : 1) * scale;
    if (G.muzzle > 0 && !small) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 10);
      ctx.beginPath();
      ctx.ellipse(0, -18 * s, 3.4 * s, 9 * s, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(phoenix ? GOLD : ORG, 0.55);
    ctx.beginPath();
    ctx.moveTo(-5 * s, 12 * s);
    ctx.lineTo(0, 18 * s);
    ctx.lineTo(5 * s, 12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -16 * s);
    ctx.lineTo(7 * s, 4 * s);
    ctx.lineTo(12 * s, 10 * s);
    ctx.lineTo(4 * s, 7 * s);
    ctx.lineTo(0, 12 * s);
    ctx.lineTo(-4 * s, 7 * s);
    ctx.lineTo(-12 * s, 10 * s);
    ctx.lineTo(-7 * s, 4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(phoenix ? GOLD : ORG, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16 * s);
    ctx.lineTo(5 * s, 2 * s);
    ctx.lineTo(0, 6 * s);
    ctx.lineTo(-5 * s, 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-1.3 * s, -18 * s, 2.6 * s, 8 * s);
    if (num) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold ' + (9 * s) + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), 0, 2 * s);
    }
    ctx.restore();
  }

  function drawPhoenix(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y - 6));
    ctx.globalAlpha = a;
    const flap = REDUCE ? 0 : Math.sin(G.t * 14) * 0.18;
    ctx.fillStyle = rgba(ORG, 0.45);
    ctx.beginPath();
    ctx.ellipse(0, 8 * scale, 10 * scale, 18 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.92);
    ctx.beginPath();
    ctx.moveTo(-8 * scale, 4 * scale);
    ctx.quadraticCurveTo(-38 * scale, (-6 + flap * 20) * scale, -22 * scale, 18 * scale);
    ctx.quadraticCurveTo(-16 * scale, 8 * scale, -4 * scale, 10 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8 * scale, 4 * scale);
    ctx.quadraticCurveTo(38 * scale, (-6 + flap * 20) * scale, 22 * scale, 18 * scale);
    ctx.quadraticCurveTo(16 * scale, 8 * scale, 4 * scale, 10 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -22 * scale);
    ctx.lineTo(8 * scale, 4 * scale);
    ctx.lineTo(0, 16 * scale);
    ctx.lineTo(-8 * scale, 4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(ORG, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -22 * scale);
    ctx.lineTo(5 * scale, 0);
    ctx.lineTo(0, 8 * scale);
    ctx.lineTo(-5 * scale, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(0, -10 * scale, 3.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = rgba(GOLD, 0.45 + Math.sin(G.t * 10) * 0.15);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), (28 + Math.sin(G.t * 8) * 4) * scale, 0, TAU);
    ctx.stroke();
  }

  function drawPlayer() {
    const blink = G.invuln > 0 && G.phoenix <= 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    const a = 1;
    if (G.phoenix > 0) {
      drawPhoenix(G.player.x, G.player.y, a);
      return;
    }
    for (let i = WING_IDS.length - 1; i >= 0; i--) {
      const n = WING_IDS[i];
      if (!G.wings[n]) continue;
      const p = G.wingPos[n];
      drawShipBody(p.x, p.y, a, G.player.bank * 0.6, true, n, false);
    }
    drawShipBody(G.player.x, G.player.y, a, G.player.bank, false, 0, false);
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.globalAlpha = flash ? 0.55 : 1;
    if (en.type === 'fighter') {
      ctx.fillStyle = rgba(en.rgb, 0.92);
      ctx.beginPath();
      ctx.moveTo(sx(en.x), sy(en.y + 12));
      ctx.lineTo(sx(en.x + 11), sy(en.y - 8));
      ctx.lineTo(sx(en.x), sy(en.y - 4));
      ctx.lineTo(sx(en.x - 11), sy(en.y - 8));
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'dive') {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(sx(en.x), sy(en.y + 12));
      ctx.lineTo(sx(en.x + 8), sy(en.y - 8));
      ctx.lineTo(sx(en.x - 8), sy(en.y - 8));
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'tank') {
      ctx.fillStyle = '#2a1408';
      ctx.fillRect(sx(en.x - 15), sy(en.y - 8), 30 * scale, 16 * scale);
      ctx.strokeStyle = rgba(ORG, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.strokeRect(sx(en.x - 15), sy(en.y - 8), 30 * scale, 16 * scale);
      const ang = Math.atan2(G.player.y - en.y, G.player.x - en.x);
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(en.x), sy(en.y));
      ctx.lineTo(sx(en.x + Math.cos(ang) * 16), sy(en.y + Math.sin(ang) * 10));
      ctx.stroke();
    } else if (en.type === 'turret') {
      hexPath(en.x, en.y, 14);
      ctx.fillStyle = '#201008';
      ctx.fill();
      ctx.strokeStyle = rgba(SKY, 0.75);
      ctx.lineWidth = 1.3 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(ORG, 0.85);
      ctx.beginPath();
      ctx.arc(sx(en.x), sy(en.y), 5 * scale, 0, TAU);
      ctx.fill();
    } else if (en.type === 'fort') {
      ctx.fillStyle = '#1c0e08';
      ctx.fillRect(sx(en.x - 22), sy(en.y - 12), 44 * scale, 26 * scale);
      ctx.strokeStyle = rgba(RUST, 0.85);
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeRect(sx(en.x - 22), sy(en.y - 12), 44 * scale, 26 * scale);
      ctx.fillStyle = rgba(ORG, 0.7);
      ctx.fillRect(sx(en.x - 8), sy(en.y - 4), 16 * scale, 8 * scale);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(sx(en.x - 3), sy(en.y - 16), 6 * scale, 8 * scale);
    } else if (en.type === 'silo') {
      hexPath(en.x, en.y, 20);
      ctx.fillStyle = '#160c08';
      ctx.fill();
      ctx.strokeStyle = rgba(en.num ? GOLD : DIRT, 0.75);
      ctx.lineWidth = 1.8 * scale;
      ctx.stroke();
      const open = en.lid;
      hexPath(en.x, en.y, 12);
      ctx.fillStyle = rgba(open > 0.4 ? GOLD : ORG, 0.2 + open * 0.55);
      ctx.fill();
      if (en.num) {
        ctx.fillStyle = rgba(GOLD, 0.55 + open * 0.4);
        ctx.font = 'bold ' + (13 * scale) + 'px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(en.num), sx(en.x), sy(en.y + 1));
      }
      if (open > 0.5) {
        ctx.strokeStyle = rgba(GOLD, 0.45);
        ctx.lineWidth = 1.2 * scale;
        hexPath(en.x, en.y, 16);
        ctx.stroke();
      }
    } else if (en.type === 'mid' || en.type === 'boss') {
      const bw = en.type === 'boss' ? 118 : 88;
      const bh = en.type === 'boss' ? 58 : 42;
      hexPath(en.x, en.y + 6, bw * 0.48);
      ctx.fillStyle = '#140806';
      ctx.fill();
      ctx.strokeStyle = rgba(en.type === 'boss' ? MAG : ORG, 0.8);
      ctx.lineWidth = 2.2 * scale;
      ctx.stroke();
      ctx.fillStyle = '#0e0604';
      ctx.fillRect(sx(en.x - bw * 0.38), sy(en.y - 6), bw * 0.22 * scale, 16 * scale);
      ctx.fillRect(sx(en.x + bw * 0.16), sy(en.y - 6), bw * 0.22 * scale, 16 * scale);
      const core = 0.5 + Math.sin(en.t * 3) * 0.5;
      ctx.beginPath();
      ctx.arc(sx(en.x), sy(en.y + 8), (en.type === 'boss' ? 16 : 12) * scale, 0, TAU);
      ctx.fillStyle = rgba(core > 0.55 ? GOLD : ORG, 0.85);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      if (en.type === 'boss') {
        ctx.fillStyle = rgba(MAG, 0.55);
        ctx.fillRect(sx(en.x - 18), sy(en.y - 18), 36 * scale, 8 * scale);
        ctx.fillStyle = rgba(WHT, 0.5);
        ctx.beginPath();
        ctx.arc(sx(en.x - 10), sy(en.y - 4), 3 * scale, 0, TAU);
        ctx.arc(sx(en.x + 10), sy(en.y - 4), 3 * scale, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), (s.pierce ? 3.2 : 2.1) * scale, (s.pierce ? 9 : 7) * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(sx(s.x - 0.8), sy(s.y - 6), 1.6 * scale, 8 * scale);
      if (!REDUCE) {
        ctx.fillStyle = rgba(s.rgb, 0.28);
        ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 10 * scale);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * 0.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 6) * 2;
      hexPath(p.x, p.y + bob, 11);
      ctx.fillStyle = 'rgba(26, 12, 6, 0.85)';
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.font = 'bold ' + (12 * scale) + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(p.num), sx(p.x), sy(p.y + bob + 1));
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / Math.max(0.001, p.max));
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : ORG, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : ORG, 0.6);
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
    ctx.fillStyle = '#140804';
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

    if (G.mode !== 'lose' && G.deadT <= 0) drawPlayer();
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
    trails.length = 0;
  }

  function resetWings() {
    G.wings[2] = false;
    G.wings[3] = false;
    G.wings[4] = false;
    G.wings[5] = false;
    G.form = 'stack';
    G.phoenix = 0;
    for (let i = 0; i < WING_IDS.length; i++) {
      const n = WING_IDS[i];
      G.wingPos[n].x = G.player.x;
      G.wingPos[n].y = G.player.y;
    }
  }

  function startGame(kind) {
    G.kind = kind === 'fort' ? 'fort' : 'land';
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
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    resetWings();
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.rushSpawn = 1.6;
    G.engineT = 0;
    G.spawnT = 0.7;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isFort() ? '堡海 · 地堡更密' : '征陆 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'land';
    G.stage = 1;
    G.lives = LIVES;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.phoenix = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    G.wings[2] = true;
    G.wings[3] = true;
    G.wings[4] = true;
    G.wings[5] = true;
    G.form = 'spread';
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '征陆',
      '向上打。炸六角仓放出僚机对接。Shift 合散编队，五机齐则化凰。先扫地面堡垒再打关底。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('land');
    else startGame(G.kind || 'land');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('land');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('fort');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isFort()) goTitle();
      else startGame('fort');
    }
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const formKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';

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

    if (down && (isMove || space || k === 'Enter' || formKey)) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (formKey) formHeld = false;
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
    if (formKey) {
      if (!formHeld) {
        formHeld = true;
        if (G.mode === 'play' && !overlayOpen()) doForm();
      }
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

  if (btnLand) {
    btnLand.addEventListener('click', function () {
      audio.ensure();
      startGame('land');
    });
  }
  if (btnFort) {
    btnFort.addEventListener('click', function () {
      audio.ensure();
      startGame('fort');
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
      if (G.mode === 'win' && !isFort()) startGame('fort');
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
  function formClick(e) {
    if (e) e.preventDefault();
    audio.ensure();
    doForm();
  }
  if (btnForm) btnForm.addEventListener('click', formClick);
  if (btnPad) btnPad.addEventListener('click', formClick);

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
      formHeld = false;
    }
  });
  requestAnimationFrame(frame);
})();
