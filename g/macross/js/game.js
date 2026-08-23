'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const GY = 328;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const WPN_MAX = 4;
  const FORMS = ['fighter', 'gerwalk', 'battroid'];
  const FORM_NAME = { fighter: '战斗机', gerwalk: '天行', battroid: '机甲' };
  const BEST_KEY = 'playbox-macross-best';
  const MUTE_KEY = 'playbox-macross-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 变形 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [62, 200, 255];
  const SKY = [122, 223, 255];
  const GOLD = [255, 227, 107];
  const WHT = [232, 246, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const VIO = [106, 155, 255];
  const STEEL = [120, 148, 168];
  const HULL = [42, 72, 98];
  const ORG = [255, 160, 72];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const SCORE = {
    scout: 50,
    pod: 80,
    dive: 90,
    heavy: 140,
    turret: 160,
    hull: 180,
    drop: 300,
    mid: 2000,
    boss: [4000, 6000, 9000],
    clear: 2000,
    all: 8000
  };

  const STAGES = [
    {
      name: '云海',
      biome: 'sky',
      mid: '突击荚',
      boss: '巡航舰',
      midHp: 44,
      bossHp: 102,
      waves: [
        { x: 40, kind: 'v', n: 5, y: 0.34 },
        { x: 150, kind: 'pods' },
        { x: 260, kind: 'stream', n: 6 },
        { x: 380, kind: 'dive', n: 4 },
        { x: 500, kind: 'turrets' },
        { x: 620, kind: 'v', n: 7, y: 0.46 },
        { x: 740, kind: 'drop' },
        { x: 840, kind: 'pods' },
        { x: 980, kind: 'mid' },
        { x: 1220, kind: 'stream', n: 7 },
        { x: 1340, kind: 'dive', n: 5 },
        { x: 1460, kind: 'heavy' },
        { x: 1560, kind: 'turrets' },
        { x: 1680, kind: 'v', n: 7, y: 0.4 },
        { x: 1800, kind: 'drop' },
        { x: 1900, kind: 'pods' },
        { x: 2050, kind: 'boss' }
      ]
    },
    {
      name: '残骸',
      biome: 'debris',
      mid: '重炮荚',
      boss: '装甲舰',
      midHp: 58,
      bossHp: 128,
      waves: [
        { x: 30, kind: 'v', n: 7, y: 0.3 },
        { x: 140, kind: 'hulls' },
        { x: 250, kind: 'pods' },
        { x: 380, kind: 'dive', n: 5 },
        { x: 500, kind: 'turrets' },
        { x: 620, kind: 'heavy' },
        { x: 740, kind: 'drop' },
        { x: 840, kind: 'stream', n: 8 },
        { x: 980, kind: 'mid' },
        { x: 1220, kind: 'hulls' },
        { x: 1320, kind: 'pods' },
        { x: 1440, kind: 'dive', n: 6 },
        { x: 1540, kind: 'turrets' },
        { x: 1640, kind: 'v', n: 9, y: 0.42 },
        { x: 1740, kind: 'drop' },
        { x: 1840, kind: 'heavy' },
        { x: 1940, kind: 'stream', n: 7 },
        { x: 2050, kind: 'boss' }
      ]
    },
    {
      name: '舰桥',
      biome: 'hull',
      mid: '舰首炮',
      boss: '超时空要塞',
      midHp: 72,
      bossHp: 176,
      waves: [
        { x: 20, kind: 'turrets' },
        { x: 120, kind: 'v', n: 8, y: 0.28 },
        { x: 220, kind: 'hulls' },
        { x: 320, kind: 'pods' },
        { x: 430, kind: 'dive', n: 6 },
        { x: 540, kind: 'stream', n: 8 },
        { x: 640, kind: 'turrets' },
        { x: 740, kind: 'drop' },
        { x: 860, kind: 'heavy' },
        { x: 980, kind: 'mid' },
        { x: 1220, kind: 'hulls' },
        { x: 1320, kind: 'turrets' },
        { x: 1420, kind: 'dive', n: 7 },
        { x: 1520, kind: 'pods' },
        { x: 1620, kind: 'v', n: 9, y: 0.4 },
        { x: 1720, kind: 'drop' },
        { x: 1820, kind: 'heavy' },
        { x: 1920, kind: 'stream', n: 8 },
        { x: 2050, kind: 'boss' }
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
  const btnFold = document.getElementById('btn-fold');
  const btnBridge = document.getElementById('btn-bridge');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnForm = document.getElementById('btn-form');
  const btnPadForm = document.getElementById('btn-pad-form');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const formLabel = document.getElementById('form-label');
  const wpnLabel = document.getElementById('wpn-label');
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
  let formTok = 0;
  let uid = 1;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.42, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const clouds = [];

  const G = {
    mode: 'title',
    kind: 'fold',
    t: 0,
    cam: 0,
    px: 90,
    py: VH * 0.42,
    bank: 0,
    prop: 0,
    form: 'fighter',
    formI: 0,
    formCd: 0,
    morph: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    pick: [],
    spawnI: 0,
    fireHold: false,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    mid: false,
    boss: false,
    winT: 0,
    powLv: 0,
    engineT: 0
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
  function isDense() {
    return G.kind === 'bridge';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function formRgb() {
    if (G.form === 'gerwalk') return GOLD;
    if (G.form === 'battroid') return MAG;
    return CYN;
  }
  function plySpd() {
    const d = isDense() ? 1.1 : 1;
    if (G.form === 'gerwalk') return (214 + G.powLv * 6) * d;
    if (G.form === 'battroid') return (156 + G.powLv * 5) * d;
    return (298 + G.powLv * 8) * d;
  }
  function plyRad() {
    if (G.form === 'gerwalk') return 8;
    if (G.form === 'battroid') return 10.2;
    return 6.4;
  }
  function fireMaxCd() {
    const p = G.powLv * 0.008;
    if (G.form === 'gerwalk') return 0.096 - p;
    if (G.form === 'battroid') return 0.118 - G.powLv * 0.009;
    return 0.078 - p;
  }
  function scrollSpd() {
    if (G.boss || G.mid) {
      const b = findBig();
      if (b && b.alive) {
        const x = b.x - G.cam;
        if (x < VW - 220) return isDense() ? 14 : 10;
        if (x < VW - 140) return isDense() ? 42 : 28;
      }
      return isDense() ? 54 : 38;
    }
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return (isDense() ? 144 : 104) + rush + (G.stage - 1) * (isDense() ? 10 : 7);
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function shotCap() {
    return isDense() ? 150 : 108;
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
      if (G.form === 'gerwalk') this.beep(620 + G.powLv * 36, 0.05, 'square', 0.03, 280);
      else if (G.form === 'battroid') this.beep(240 + G.powLv * 28, 0.062, 'sawtooth', 0.034, 90);
      else this.beep(780 + G.powLv * 42, 0.044, 'square', 0.03, 1560);
    },
    morph(form) {
      this.ensure();
      this.noise(0.07, 0.04, 420);
      if (form === 'fighter') {
        this.beep(220, 0.12, 'sawtooth', 0.05, 880);
        this.beep(440, 0.16, 'triangle', 0.032, 1320);
      } else if (form === 'gerwalk') {
        this.beep(360, 0.14, 'square', 0.046, 520);
        this.beep(180, 0.12, 'sawtooth', 0.03, 260);
      } else {
        this.beep(520, 0.1, 'sawtooth', 0.048, 140);
        this.beep(90, 0.2, 'sine', 0.04, 48);
      }
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (kind === 'ground') {
        this.noise(0.05, 0.038, 380);
        this.beep(220 * lift, 0.09, 'sawtooth', 0.038, 70);
      } else {
        this.noise(0.036, 0.032, 1200);
        this.beep(540 * lift, 0.066, 'square', 0.042, 920 * lift);
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
    engine() {
      this.ensure();
      const f = G.form === 'battroid' ? 62 : G.form === 'gerwalk' ? 78 : 96;
      this.beep(f, 0.04, 'sawtooth', 0.011, f * 0.72);
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
    if (G.powLv >= WPN_MAX) return '能 MAX';
    if (G.powLv <= 0) return '能';
    return '能 ' + WPN_ROMAN[G.powLv];
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
      const info = stageInfo();
      const big = G.boss ? info.boss : G.mid ? info.mid : ('第 ' + G.stage + ' 关 · ' + info.name);
      stageLabel.textContent = big;
      stageLabel.classList.toggle('hot', G.boss || G.mid || G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '舰桥' : '超时空';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (formLabel) {
      formLabel.textContent = FORM_NAME[G.form] || '战斗机';
      formLabel.classList.remove('fighter', 'gerwalk', 'battroid');
      formLabel.classList.add(G.form);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
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
    else if (G.mode === 'win') setHint('舰桥打穿 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 变形 · 空格射击', 'warn');
    else setHint('战斗机快 · 天行对地 · 机甲三向 · 空格射击', '');
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MCRS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
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
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'win')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6.4 ? 'die' : mag >= 3.6 ? 'morph' : mag >= 2.4 ? 'pow' : 'hit';
    stageEl.classList.remove('die', 'hit', 'pow', 'morph');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'hit', 'pow', 'morph');
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
    capArr(sparks, 44);
    capArr(rings, 28);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.92 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -88 : -70
    });
    capArr(floats, 28);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(36, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -240, vx1: 220, vy0: -220, vy1: 160,
      r0: 1.4, r1: 4.6, life: 0.44 + p * 0.006, rgb: rgb, g: 260
    });
    emit(7, {
      x: x, y: y, j: 3,
      vx0: -80, vx1: 80, vy0: -110, vy1: 60,
      r0: 2, r1: 5.2, life: 0.3, rgb: WHT, g: 70
    });
    popSpark(x, y, rgb, 12 + p * 0.42);
  }

  function hullBurst(x, y) {
    emit(10, {
      x: x, y: y, j: 8,
      vx0: -90, vx1: 90, vy0: -160, vy1: -20,
      r0: 1.2, r1: 3.4, life: 0.36, rgb: STEEL, g: 620
    });
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      floatText(G.px + 18, G.py - 22, '×' + G.mult, GOLD, true);
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
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function seedSky() {
    stars.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, GY - 12),
        z: rand(0.2, 1.2),
        a: rand(0.18, 0.8)
      });
    }
    clouds.length = 0;
    for (let i = 0; i < 14; i++) {
      clouds.push({
        x: rand(0, VW + 200),
        y: rand(18, GY - 80),
        w: rand(40, 110),
        h: rand(10, 22),
        a: rand(0.08, 0.2),
        z: rand(0.22, 0.7)
      });
    }
  }

  function findBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if ((e.type === 'boss' || e.type === 'mid') && e.alive) return e;
    }
    return null;
  }

  function pushEnt(e) {
    e.id = uid++;
    e.alive = e.alive !== false;
    e.t = e.t || 0;
    e.flash = 0;
    G.ents.push(e);
    capArr(G.ents, 130);
  }

  function spawnV(n, yNorm) {
    const extra = isDense() ? 2 : 0;
    const count = (n || 5) + extra;
    const baseY = 36 + (yNorm == null ? 0.4 : yNorm) * (GY - 90);
    for (let i = 0; i < count; i++) {
      const side = i - (count - 1) * 0.5;
      pushEnt({
        type: 'scout',
        form: 'v',
        x: G.cam + VW + 24 + i * 22,
        y: clamp(baseY + Math.abs(side) * 14, 28, GY - 36),
        vx: isDense() ? -168 : -132,
        vy: 0,
        hp: 1, maxHp: 1, w: 16, h: 10,
        shootCd: rand(0.6, 1.5),
        phase: rand(0, TAU),
        ground: false
      });
    }
  }

  function spawnStream(n) {
    const extra = isDense() ? 2 : 0;
    const count = (n || 6) + extra;
    const mid = 50 + Math.random() * (GY - 120);
    for (let i = 0; i < count; i++) {
      pushEnt({
        type: 'scout',
        form: 'stream',
        x: G.cam + VW + 20 + i * 20,
        y: mid,
        baseY: mid,
        vx: isDense() ? -154 : -122,
        vy: 0,
        hp: 1, maxHp: 1, w: 15, h: 9,
        shootCd: rand(0.7, 1.7),
        phase: i * 0.55,
        amp: 28 + rand(0, 16),
        ground: false
      });
    }
  }

  function spawnDive(n) {
    const extra = isDense() ? 1 : 0;
    const count = (n || 4) + extra;
    for (let i = 0; i < count; i++) {
      const fromTop = i % 2 === 0;
      pushEnt({
        type: 'dive',
        x: G.cam + VW + 30 + i * 28,
        y: fromTop ? 18 + rand(0, 36) : GY - 40 - rand(0, 30),
        vx: isDense() ? -150 : -118,
        vy: fromTop ? 70 : -70,
        hp: 1, maxHp: 1, w: 16, h: 12,
        shootCd: 99,
        ground: false
      });
    }
  }

  function spawnPods() {
    const n = isDense() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'pod',
        x: G.cam + VW + 28 + i * 36,
        y: 70 + rand(0, GY - 150),
        vx: isDense() ? -108 : -88,
        vy: 0,
        hp: Math.round(2 * hpMul()),
        maxHp: Math.round(2 * hpMul()),
        w: 18, h: 16,
        shootCd: rand(0.5, 1.1),
        phase: rand(0, TAU),
        ground: false
      });
    }
  }

  function spawnHeavy() {
    pushEnt({
      type: 'heavy',
      x: G.cam + VW + 40,
      y: 80 + rand(0, GY - 170),
      vx: isDense() ? -86 : -70,
      vy: 0,
      hp: Math.round(5 * hpMul()),
      maxHp: Math.round(5 * hpMul()),
      w: 32, h: 20,
      shootCd: rand(0.45, 0.85),
      ground: false
    });
  }

  function spawnDrop() {
    pushEnt({
      type: 'drop',
      x: G.cam + VW + 28,
      y: 60 + rand(0, GY - 140),
      vx: isDense() ? -110 : -90,
      vy: 0,
      hp: 2, maxHp: 2, w: 20, h: 12,
      shootCd: 99,
      drop: 'E',
      ground: false,
      phase: Math.random() < 0.5 ? -1 : 1
    });
  }

  function spawnTurrets() {
    const n = isDense() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'turret',
        x: G.cam + VW + 20 + i * 46,
        y: GY + 10,
        vx: 0,
        vy: 0,
        hp: Math.round(4 * hpMul()),
        maxHp: Math.round(4 * hpMul()),
        w: 18, h: 16,
        shootCd: rand(0.28, 0.7),
        ground: true
      });
    }
  }

  function spawnHulls() {
    const n = isDense() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'hull',
        x: G.cam + VW + 28 + i * 70,
        y: GY + 14,
        vx: 0,
        vy: 0,
        hp: Math.round(7 * hpMul()),
        maxHp: Math.round(7 * hpMul()),
        w: 34, h: 20,
        shootCd: rand(0.5, 1.1),
        ground: true
      });
    }
  }

  function spawnMid() {
    if (findBig()) return;
    const st = stageInfo();
    const hp = Math.round(st.midHp * hpMul());
    const biome = st.biome;
    const ground = biome === 'hull';
    pushEnt({
      type: 'mid',
      name: st.mid,
      variant: biome,
      x: G.cam + VW + 80,
      y: ground ? GY + 8 : 140,
      vx: -40,
      vy: 0,
      hp: hp, maxHp: hp,
      w: ground ? 64 : 54,
      h: ground ? 28 : 32,
      shootCd: 0.45,
      ground: ground,
      spin: 0
    });
    G.mid = true;
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(CYN, 0.34);
    kick(4.6);
    syncHud();
  }

  function spawnBoss() {
    if (findBig()) return;
    const st = stageInfo();
    const hp = Math.round(st.bossHp * hpMul());
    const biome = st.biome;
    pushEnt({
      type: 'boss',
      name: st.boss,
      variant: biome,
      x: G.cam + VW + 110,
      y: GY - (biome === 'hull' ? 18 : 8),
      vx: -36,
      vy: 0,
      hp: hp, maxHp: hp,
      w: biome === 'hull' ? 138 : 108,
      h: biome === 'hull' ? 64 : 40,
      shootCd: 0.5,
      ground: true,
      spin: 0,
      bits: [0, 2.1, 4.2]
    });
    G.boss = true;
    toast(st.boss, true, false);
    audio.boss();
    screenFlash(MAG, 0.42);
    kick(5.4);
    syncHud();
  }

  function spawnWave(w) {
    if (w.kind === 'v') spawnV(w.n, w.y);
    else if (w.kind === 'stream') spawnStream(w.n);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'pods') spawnPods();
    else if (w.kind === 'heavy') spawnHeavy();
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'hulls') spawnHulls();
    else if (w.kind === 'drop') spawnDrop();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
    if (isDense() && (w.kind === 'hulls' || w.kind === 'pods')) spawnTurrets();
  }

  function maybeSpawn() {
    const waves = stageInfo().waves;
    while (G.spawnI < waves.length) {
      const w = waves[G.spawnI];
      if (G.cam + VW < w.x) break;
      if ((G.mid || G.boss) && w.kind !== 'mid' && w.kind !== 'boss') break;
      G.spawnI += 1;
      if (w.kind === 'mid' || w.kind === 'boss' || G.cam + VW - w.x < 240) spawnWave(w);
    }
  }

  function spawnPickup(x, y) {
    G.pick.push({
      x: x, y: y, vx: -30, t: 0, life: 9.5, kind: 'E'
    });
    capArr(G.pick, 8);
  }

  function enemyShot(x, y, vx, vy, fat) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: fat ? 6.2 : 3.15,
      life: fat ? 2.6 : 3.0,
      fat: !!fat
    });
  }

  function aimShot(x, y, spd, spread, fat) {
    const dx = G.px - (x - G.cam);
    const dy = G.py - y;
    const ang = Math.atan2(dy, dx) + (spread || 0);
    enemyShot(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, fat);
  }

  function fanShot(x, y, n, spd, spread) {
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) * 0.5) * spread;
      aimShot(x, y, spd, a, false);
    }
  }

  function ringShot(x, y, n, spd, off) {
    for (let i = 0; i < n; i++) {
      const a = off + i * (TAU / n);
      enemyShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, false);
    }
  }

  function addShot(ox, oy, vx, vy, r, dmg, rgb) {
    if (G.shots.length > 64) return;
    G.shots.push({
      x: G.px + 18 + ox,
      y: G.py + oy,
      vx: vx,
      vy: vy,
      r: r || 3.1,
      dmg: dmg || 1,
      rgb: rgb,
      life: 1.12
    });
  }

  function fireGuns() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.powLv;
    G.fireCd = fireMaxCd();
    G.muzzle = 0.05;
    const rgb = formRgb();
    const spd = 680;
    const dmg = G.form === 'battroid' && lv >= 2 ? 2 : 1;
    if (G.form === 'gerwalk') {
      addShot(0, -3, spd, 0, 3.1, 1, rgb);
      if (lv >= 1) addShot(0, 4, spd, 0, 3.1, 1, rgb);
      if (lv >= 3) addShot(2, 0, spd, -40, 3.1, 1, rgb);
      addShot(4, 8, 70, 560, 3.4, 1, GOLD);
      if (lv >= 2) addShot(-2, 10, 160, 480, 3.2, 1, GOLD);
      if (lv >= 4) addShot(6, 6, 40, 620, 3.4, 1, GOLD);
    } else if (G.form === 'battroid') {
      const n = lv >= 2 ? 5 : 3;
      const spread = lv >= 4 ? 0.34 : lv >= 2 ? 0.3 : 0.26;
      for (let i = 0; i < n; i++) {
        const a = (i - (n - 1) * 0.5) * spread;
        addShot(2, 0, Math.cos(a) * 560, Math.sin(a) * 560, 3.4, dmg, rgb);
      }
      if (lv >= 3) addShot(8, 0, spd, 0, 3.6, dmg, GOLD);
    } else {
      if (lv <= 0) {
        addShot(0, -5, spd, 0, 3, 1, rgb);
        addShot(0, 5, spd, 0, 3, 1, rgb);
      } else if (lv === 1) {
        addShot(0, -8, spd, 0, 3, 1, rgb);
        addShot(4, 0, spd, 0, 3.2, 1, rgb);
        addShot(0, 8, spd, 0, 3, 1, rgb);
      } else if (lv === 2) {
        addShot(0, -10, spd, -40, 3, 1, rgb);
        addShot(4, 0, spd, 0, 3.2, 1, rgb);
        addShot(0, 10, spd, 40, 3, 1, rgb);
      } else if (lv === 3) {
        addShot(0, -12, spd, -50, 3, 1, rgb);
        addShot(0, -4, spd, 0, 3.1, 1, rgb);
        addShot(4, 4, spd, 0, 3.1, 1, rgb);
        addShot(0, 12, spd, 50, 3, 1, rgb);
        addShot(8, -2, 420, -18, 2.6, 1, GOLD);
        addShot(8, 2, 420, 18, 2.6, 1, GOLD);
      } else {
        addShot(0, -14, spd, -70, 3, 1, rgb);
        addShot(0, -6, spd, -18, 3.1, 1, rgb);
        addShot(6, 0, spd, 0, 3.3, 1, GOLD);
        addShot(0, 6, spd, 18, 3.1, 1, rgb);
        addShot(0, 14, spd, 70, 3, 1, rgb);
        addShot(8, -4, 440, -28, 2.6, 1, GOLD);
        addShot(8, 4, 440, 28, 2.6, 1, GOLD);
      }
    }
    audio.shoot();
    emit(3, {
      x: G.px + 20, y: G.py, j: 2.4,
      vx0: 80, vx1: 180, vy0: -24, vy1: 24,
      life: 0.12, r0: 1, r1: 2.2, rgb: rgb, g: 0
    });
  }

  function doTransform() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.formCd > 0) return;
    G.formI = (G.formI + 1) % FORMS.length;
    G.form = FORMS[G.formI];
    G.formCd = 0.32;
    G.morph = 0.22;
    audio.morph(G.form);
    popSpark(G.px, G.py, formRgb(), 22);
    emit(16, {
      x: G.px, y: G.py, j: 10,
      vx0: -160, vx1: 160, vy0: -180, vy1: 140,
      r0: 1.4, r1: 4.2, life: 0.32, rgb: formRgb(), g: 40
    });
    floatText(G.px, G.py - 20, FORM_NAME[G.form], formRgb(), true);
    toast(FORM_NAME[G.form], false, G.form === 'gerwalk');
    hitStop(0.038);
    kick(3.8);
    screenFlash(formRgb(), 0.28);
    flashForm();
    syncHud();
  }

  function hurtEnt(e, dmg, hx, hy) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    bumpCombo();
    const ground = !!e.ground;
    audio.hit(ground ? 'ground' : 'air', G.combo);
    popSpark(hx, hy, ground ? GOLD : formRgb(), e.type === 'boss' ? 12 : 8);
    emit(5, {
      x: hx, y: hy, j: 4,
      vx0: -90, vx1: 90, vy0: -90, vy1: 90,
      r0: 1.2, r1: 2.8, life: 0.22,
      rgb: ground ? GOLD : PNK, g: 70
    });
    if (e.type === 'boss' || e.type === 'mid') {
      hitStop(0.042);
      kick(2.6);
    } else {
      hitStop(0.034);
    }
    if (e.hp <= 0) killEnt(e, hx, hy);
  }

  function killEnt(e, hx, hy) {
    e.alive = false;
    e.hp = 0;
    let pts = SCORE.scout;
    let rgb = CYN;
    let pow = 16;
    if (e.type === 'pod') { pts = SCORE.pod; rgb = PNK; pow = 18; }
    else if (e.type === 'dive') { pts = SCORE.dive; rgb = GOLD; pow = 16; }
    else if (e.type === 'heavy') { pts = SCORE.heavy; rgb = VIO; pow = 24; }
    else if (e.type === 'turret') { pts = SCORE.turret; rgb = GOLD; pow = 18; }
    else if (e.type === 'hull') { pts = SCORE.hull; rgb = STEEL; pow = 22; }
    else if (e.type === 'drop') { pts = SCORE.drop; rgb = GOLD; pow = 22; }
    else if (e.type === 'mid') { pts = SCORE.mid; rgb = GOLD; pow = 36; }
    else if (e.type === 'boss') {
      pts = SCORE.boss[G.stage - 1] || 4000;
      rgb = GOLD;
      pow = 50;
    }
    const n = Math.round(pts * G.mult);
    addScore(n);
    floatText(hx, hy, '+' + n, rgb, e.type === 'boss' || e.type === 'mid' || G.mult >= 3);
    explode(hx, hy, rgb, pow);
    if (e.ground) hullBurst(hx, hy);
    if (e.type === 'drop' && e.drop) spawnPickup(e.x, e.y);
    if (e.type === 'mid') {
      hitStop(0.07);
      kick(6.4);
      screenFlash(GOLD, 0.42);
      G.mid = false;
      spawnPickup(e.x, e.y);
      toast(e.name + '击破', false, true);
      syncHud();
    } else if (e.type === 'boss') {
      hitStop(0.082);
      kick(7.4);
      screenFlash(GOLD, 0.58);
      audio.boom(true);
      for (let k = 0; k < 5; k++) {
        explode(hx + rand(-32, 32), hy + rand(-26, 26), k % 2 ? ORG : GOLD, 26);
      }
      onBossDown();
    } else {
      hitStop(0.042);
      kick(2.4);
      if (e.drop === 'E' || (e.ground && Math.random() < 0.12)) spawnPickup(e.x, e.y);
    }
    syncHud();
  }

  function onBossDown() {
    addScore(SCORE.clear);
    G.boss = false;
    if (G.stage >= 3) {
      G.winT = 1.55;
      toast('舰桥打穿', false, true);
    } else {
      toast(stageInfo().name + '肃清', false, true);
      G.stage += 1;
      G.cam = 0;
      G.spawnI = 0;
      G.ents.length = 0;
      G.eShots.length = 0;
      G.shots.length = 0;
      G.invuln = Math.max(G.invuln, 0.9);
      seedSky();
      syncHud();
    }
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.fireHold = false;
    breakCombo();
    if (G.powLv > 0) spawnPickup(G.cam + G.px + 24, G.py);
    G.powLv = 0;
    explode(G.px, G.py, MAG, 38);
    explode(G.px + 10, G.py, ORG, 18);
    audio.death();
    hitStop(0.072);
    kick(7.6);
    screenFlash(MAG, 0.62);
    flashWpn();
    syncPips();
    syncHud();
  }

  function respawn() {
    G.px = 90;
    G.py = VH * 0.42;
    G.form = 'fighter';
    G.formI = 0;
    G.invuln = 1.55;
    G.deadT = 0;
    if (keys.sht) G.fireHold = true;
    G.eShots.length = 0;
    syncHud();
  }

  function collectPickup(p) {
    if (G.powLv >= WPN_MAX) addScore(Math.round(500 * G.mult));
    else {
      G.powLv += 1;
      toast(G.powLv >= WPN_MAX ? '能 MAX' : wpnText(), false, true);
      flashWpn();
    }
    audio.pow();
    popSpark(p.x - G.cam, p.y, GOLD, 16);
    floatText(p.x - G.cam, p.y - 16, '能', GOLD, true);
    hitStop(0.034);
    kick(2.2);
    screenFlash(GOLD, 0.2);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
    }
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '机毁了', '战斗机突进，天行打甲板，机甲三向。分数 ' + G.score + '。');
    setHint('R 重开 · 撞机或中弹扣一命', 'warn');
  }

  function goWin() {
    G.mode = 'win';
    addScore(SCORE.all);
    audio.win();
    showOverlay('win', '舰桥打穿', '三关打穿。分数 ' + G.score + (isDense() ? ' · 舰桥' : ' · 超时空') + '。');
    setHint('舰桥打穿 · R 再来一局', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pick.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    seedSky();
    G.mode = 'play';
    G.kind = kind === 'bridge' ? 'bridge' : 'fold';
    G.t = 0;
    G.cam = 0;
    G.px = 90;
    G.py = VH * 0.42;
    G.bank = 0;
    G.prop = 0;
    G.form = 'fighter';
    G.formI = 0;
    G.formCd = 0;
    G.morph = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.nextLife = LIFE_EVERY;
    G.spawnI = 0;
    G.fireHold = false;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.12;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.mid = false;
    G.boss = false;
    G.winT = 0;
    G.powLv = 0;
    G.engineT = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isDense() ? '舰桥' : '超时空', isDense(), !isDense());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'fold';
    G.t = 0;
    G.cam = 80;
    G.px = 90;
    G.py = VH * 0.42;
    G.form = 'fighter';
    G.formI = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.mid = false;
    G.boss = false;
    G.winT = 0;
    G.powLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.fireHold = false;
    clearWorld();
    seedSky();
    showOverlay('title', '超时空', '变形空战。战斗机突进，天行打甲板炮，机甲三向覆盖。关卡打完冲舰桥。');
    syncHud();
  }

  function updateFx(dt) {
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    if (G.morph > 0) G.morph -= dt;
    G.prop += dt * (G.form === 'battroid' ? 10 : 28);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.4;
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
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= (12 + s.z * 36) * dt;
      if (s.x < -4) s.x = VW + rand(4, 40);
    }
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x -= (18 + c.z * 40) * dt;
      if (c.x < -c.w) c.x = VW + rand(20, 160);
    }
  }

  function updateMove(dt) {
    let mx = 0;
    let my = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      mx = pointer.x - G.px;
      my = pointer.y - G.py;
      const n = hypot(mx, my);
      const max = plySpd() * dt;
      if (n > max && n > 1) {
        mx = mx / n * max;
        my = my / n * max;
      }
    } else {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
      if (mx || my) {
        const n = hypot(mx, my) || 1;
        mx = mx / n * plySpd() * dt;
        my = my / n * plySpd() * dt;
      }
    }
    if (G.form === 'battroid' && !keys.u && inputSrc !== 'ptr') {
      my += 42 * dt;
    }
    G.px = clamp(G.px + mx, 26, VW * 0.46);
    G.py = clamp(G.py + my, 22, GY - 18);
    G.bank = lerp(G.bank, clamp(my * 8, -0.45, 0.45), clamp(dt * 8, 0, 1));
  }

  function updatePick(dt) {
    for (let i = G.pick.length - 1; i >= 0; i--) {
      const p = G.pick[i];
      p.t += dt;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y = clamp(p.y + Math.sin(p.t * 4.2) * 18 * dt, 28, GY - 20);
      const sxv = p.x - G.cam;
      if (p.life <= 0 || sxv < -40) {
        G.pick.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(sxv - G.px, p.y - G.py) < 18) {
        collectPickup(p);
        G.pick.splice(i, 1);
      }
    }
  }

  function updateEnts(dt) {
    const dense = isDense();
    const shotMul = dense ? 1.32 : 1;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.form === 'stream') {
        e.x += e.vx * dt;
        e.y = clamp((e.baseY || e.y) + Math.sin(e.t * 3.1 + e.phase) * e.amp, 24, GY - 28);
      } else if (e.type === 'dive') {
        const dy = G.py - e.y;
        e.vy += clamp(dy * 1.5, -170, 170) * dt;
        e.vy = clamp(e.vy, -150, 150);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.y = clamp(e.y, 16, GY - 22);
      } else if (e.type === 'pod') {
        e.x += e.vx * dt;
        e.y = clamp(e.y + Math.sin(e.t * 2.4 + e.phase) * 48 * dt, 36, GY - 36);
      } else if (e.type === 'mid' || e.type === 'boss') {
        const holdX = G.cam + VW - (e.type === 'boss' ? 196 : 176);
        if (e.x > holdX) e.x += e.vx * dt;
        else e.x = lerp(e.x, holdX, clamp(dt * 1.6, 0, 1));
        if (e.ground) {
          const base = e.variant === 'hull' ? GY - (e.type === 'boss' ? 18 : 4) : GY + 6;
          e.y = lerp(e.y, base, clamp(dt * 3, 0, 1));
        } else {
          e.y = lerp(e.y, 150 + Math.sin(e.t * 0.9) * 36, clamp(dt * 1.4, 0, 1));
        }
        e.x = clamp(e.x, G.cam + 140, G.cam + VW - 70);
        e.spin += dt * (e.hp < e.maxHp * 0.5 ? 2.2 : 1.3);
      } else {
        e.x += e.vx * dt;
        e.y += (e.vy || 0) * dt;
        if (e.type === 'drop') {
          e.y = clamp(e.y + Math.sin(e.t * 2.1) * 34 * dt, 36, GY - 36);
        }
        if (e.type === 'heavy') {
          e.y = clamp(e.y + Math.sin(e.t * 1.3) * 18 * dt, 40, GY - 80);
        }
        if (e.ground) {
          if (e.type === 'turret') e.y = GY + 10;
          else e.y = GY + 14;
        }
      }

      if (e.x - G.cam < -90 && e.type !== 'mid' && e.type !== 'boss') {
        e.alive = false;
        continue;
      }

      if (e.shootCd != null) e.shootCd -= dt;
      const on = e.x - G.cam < VW + 8 && e.x - G.cam > 36;
      if (e.shootCd <= 0 && on) {
        const rage = e.hp < e.maxHp * 0.5;
        const spd = dense ? 210 : 168;
        if (e.type === 'scout') {
          if (Math.random() < (dense ? 0.58 : 0.38)) aimShot(e.x, e.y, spd, 0, false);
          e.shootCd = rand(1.15, 2.05) / shotMul;
        } else if (e.type === 'dive') {
          if (Math.random() < 0.4) aimShot(e.x, e.y, spd * 0.9, 0, false);
          e.shootCd = 1.6 / shotMul;
        } else if (e.type === 'pod') {
          aimShot(e.x, e.y, spd * 0.92, 0, false);
          e.shootCd = (rage ? 0.85 : 1.25) / shotMul;
        } else if (e.type === 'heavy') {
          fanShot(e.x - 8, e.y + 4, 3, spd * 0.85, 0.18);
          e.shootCd = (rage ? 0.82 : 1.15) / shotMul;
        } else if (e.type === 'drop') {
          aimShot(e.x, e.y, 150, 0, false);
          e.shootCd = 1.25 / shotMul;
        } else if (e.type === 'turret') {
          aimShot(e.x, e.y - 10, dense ? 230 : 186, 0, false);
          if (dense) aimShot(e.x, e.y - 10, 200, (Math.random() - 0.5) * 0.22, false);
          e.shootCd = (rage ? 0.42 : 0.62) / shotMul;
        } else if (e.type === 'hull') {
          fanShot(e.x, e.y - 10, 3, spd, 0.16);
          e.shootCd = (rage ? 0.78 : 1.12) / shotMul;
        } else if (e.type === 'mid') {
          if (e.variant === 'sky') {
            fanShot(e.x - 8, e.y, rage ? 5 : 3, spd, 0.16);
            e.shootCd = (rage ? 0.7 : 1.0) / shotMul;
          } else if (e.variant === 'debris') {
            aimShot(e.x - 8, e.y, spd + 20, 0, true);
            enemyShot(e.x - 6, e.y, -160, -50, false);
            enemyShot(e.x - 6, e.y, -160, 40, false);
            e.shootCd = (rage ? 0.68 : 0.98) / shotMul;
          } else {
            ringShot(e.x, e.y - 12, rage ? 8 : 6, dense ? 150 : 128, e.spin);
            aimShot(e.x - 10, e.y - 12, 190, 0, false);
            e.shootCd = (rage ? 0.62 : 0.92) / shotMul;
          }
        } else if (e.type === 'boss') {
          if (e.variant === 'sky') {
            fanShot(e.x - 16, e.y - 10, rage ? 5 : 3, spd, 0.14);
            if (rage) ringShot(e.x, e.y - 8, 8, 130, e.spin);
            aimShot(e.x - 20, e.y - 12, 200, 0, true);
            e.shootCd = (rage ? 0.68 : 1.02) / shotMul;
          } else if (e.variant === 'debris') {
            ringShot(e.x - 10, e.y - 8, rage ? 10 : 7, 124, e.spin);
            fanShot(e.x - 16, e.y - 12, 3, 190, 0.12);
            e.shootCd = (rage ? 0.66 : 0.96) / shotMul;
          } else {
            ringShot(e.x, e.y - 16, rage ? 12 : 8, 118, e.spin);
            ringShot(e.x, e.y - 16, 6, 168, e.spin + 0.4);
            aimShot(e.x - 18, e.y - 18, 210, 0, true);
            if (rage) {
              aimShot(e.x - 10, e.y - 22, 180, -0.1, false);
              aimShot(e.x - 10, e.y - 22, 180, 0.1, false);
            }
            e.shootCd = (rage ? 0.56 : 0.86) / shotMul;
          }
        }
      }
    }
  }

  function updateShots(dt) {
    capArr(G.shots, 90);
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 40 || s.y < -24 || s.y > VH + 24) {
        G.shots.splice(i, 1);
        continue;
      }
      let used = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        const ex = e.x - G.cam;
        const ew = e.w * 0.45;
        const eh = e.h * 0.45;
        if (Math.abs(s.x - ex) < 5 + ew && Math.abs(s.y - e.y) < 4 + eh) {
          hurtEnt(e, s.dmg || 1, ex, e.y);
          used = true;
          break;
        }
      }
      if (used) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const sxv = s.x - G.cam;
      if (s.life <= 0 || sxv < -40 || sxv > VW + 40 || s.y < -24 || s.y > VH + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && G.invuln <= 0 && hypot(sxv - G.px, s.y - G.py) < plyRad() + s.r * 0.72) {
        G.eShots.splice(i, 1);
        diePlayer();
      }
    }
  }

  function collideBodies() {
    if (G.deadT > 0 || G.invuln > 0) return;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || e.ground) continue;
      const ex = e.x - G.cam;
      const r = Math.max(e.w, e.h) * 0.42;
      if (hypot(ex - G.px, e.y - G.py) < plyRad() + r) {
        diePlayer();
        return;
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.22);
      return;
    }
    updateFx(dt);
    if (G.mode === 'title') {
      G.cam += 28 * dt;
      G.py = VH * 0.42 + Math.sin(G.t * 1.4) * 10;
      const cycle = ((G.t / 2.4) | 0) % 3;
      G.formI = cycle;
      G.form = FORMS[G.formI];
      return;
    }
    if (G.mode === 'lose') return;
    if (G.mode === 'win') {
      G.cam += 22 * dt;
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      updateShots(dt);
      updateEnts(dt);
      updatePick(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    G.cam += scrollSpd() * dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnts(dt);
      updateShots(dt);
      updatePick(dt);
      maybeSpawn();
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.formCd > 0) G.formCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.fireCd > 0) G.fireCd -= dt;

    updateMove(dt);
    if (G.fireHold) fireGuns();

    G.engineT += dt;
    if (!REDUCE && G.engineT > 0.2) {
      G.engineT = 0;
      audio.engine();
    }
    if (!REDUCE && ((G.t * 22) | 0) !== (((G.t - dt) * 22) | 0)) {
      emit(1, {
        x: G.px - 16, y: G.py + 2, j: 2,
        vx0: -110, vx1: -30, vy0: -12, vy1: 12,
        r0: 1.1, r1: 2.4, life: 0.2, rgb: formRgb(), g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updatePick(dt);
    collideBodies();
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawSky() {
    const c = ctx;
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(GY));
    const st = G.stage;
    if (st === 1) {
      g.addColorStop(0, '#082038');
      g.addColorStop(0.55, '#0a2a48');
      g.addColorStop(1, '#123858');
    } else if (st === 2) {
      g.addColorStop(0, '#061018');
      g.addColorStop(0.6, '#0c1c28');
      g.addColorStop(1, '#142430');
    } else {
      g.addColorStop(0, '#040c14');
      g.addColorStop(0.55, '#0a1824');
      g.addColorStop(1, '#142838');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, GY * scale);

    const sunX = VW * 0.82 - (G.cam * 0.04) % 40;
    const sunY = 54;
    const sg = c.createRadialGradient(sx(sunX), sy(sunY), 4 * scale, sx(sunX), sy(sunY), 90 * scale);
    sg.addColorStop(0, rgba(st === 3 ? MAG : GOLD, 0.5));
    sg.addColorStop(0.4, rgba(CYN, 0.12));
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg;
    c.beginPath();
    c.arc(sx(sunX), sy(sunY), 90 * scale, 0, TAU);
    c.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      c.fillStyle = rgba(WHT, s.a);
      c.fillRect(sx(s.x), sy(s.y), Math.max(1, s.z * scale), Math.max(1, s.z * scale));
    }

    if (st === 1) {
      for (let i = 0; i < clouds.length; i++) {
        const cl = clouds[i];
        c.fillStyle = rgba(WHT, cl.a);
        c.beginPath();
        c.ellipse(sx(cl.x), sy(cl.y), cl.w * 0.5 * scale, cl.h * scale, 0, 0, TAU);
        c.fill();
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const ix = ((i * 180 - G.cam * 0.22) % (VW + 220)) - 80;
        const iy = 40 + hash2(i * 5) * (GY - 120);
        c.strokeStyle = rgba(STEEL, 0.18 + hash2(i) * 0.12);
        c.lineWidth = Math.max(1, 1.2 * scale);
        c.beginPath();
        c.moveTo(sx(ix), sy(iy));
        c.lineTo(sx(ix + 28 + hash2(i * 3) * 40), sy(iy + 8));
        c.stroke();
      }
    }
  }

  function drawGround() {
    const c = ctx;
    const biome = stageInfo().biome;
    const g = c.createLinearGradient(sx(0), sy(GY), sx(0), sy(VH));
    if (biome === 'sky') {
      g.addColorStop(0, '#1a4868');
      g.addColorStop(0.4, '#123850');
      g.addColorStop(1, '#0a2438');
    } else if (biome === 'debris') {
      g.addColorStop(0, '#243040');
      g.addColorStop(0.4, '#182430');
      g.addColorStop(1, '#0e161c');
    } else {
      g.addColorStop(0, '#2a4058');
      g.addColorStop(0.4, '#1a2c40');
      g.addColorStop(1, '#0c1824');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(GY), VW * scale, (VH - GY) * scale);

    const horizon = c.createLinearGradient(sx(0), sy(GY - 18), sx(0), sy(GY + 8));
    horizon.addColorStop(0, 'rgba(62,200,255,0)');
    horizon.addColorStop(1, rgba(CYN, 0.18));
    c.fillStyle = horizon;
    c.fillRect(sx(0), sy(GY - 18), VW * scale, 26 * scale);

    const cam = G.cam;
    if (biome === 'sky') {
      c.strokeStyle = rgba(SKY, 0.2);
      c.lineWidth = Math.max(1, 1.2 * scale);
      for (let k = 0; k < 4; k++) {
        c.beginPath();
        const y = GY + 16 + k * 18;
        for (let x = 0; x <= VW; x += 10) {
          const yy = y + Math.sin((x + cam * 1.4) * 0.04 + k) * (3 + k);
          if (x === 0) c.moveTo(sx(x), sy(yy));
          else c.lineTo(sx(x), sy(yy));
        }
        c.stroke();
      }
    } else {
      const plate0 = -((cam * 0.7) % 56);
      for (let x = plate0; x < VW; x += 56) {
        c.fillStyle = rgba(HULL, 0.7);
        c.fillRect(sx(x), sy(GY + 4), 40 * scale, 18 * scale);
        c.strokeStyle = rgba(CYN, 0.18);
        c.lineWidth = 1;
        c.strokeRect(sx(x), sy(GY + 4), 40 * scale, 18 * scale);
        c.fillStyle = rgba(GOLD, 0.18);
        c.fillRect(sx(x + 6), sy(GY + 8), 6 * scale, 4 * scale);
      }
      if (biome === 'hull') {
        const tower0 = -((cam * 0.4) % 160);
        for (let x = tower0; x < VW + 20; x += 160) {
          c.fillStyle = rgba(STEEL, 0.45);
          c.fillRect(sx(x + 20), sy(GY - 28), 14 * scale, 32 * scale);
          c.fillStyle = rgba(CYN, 0.35);
          c.fillRect(sx(x + 24), sy(GY - 36), 6 * scale, 10 * scale);
        }
      }
    }
  }

  function drawValkyrie() {
    const c = ctx;
    c.save();
    c.translate(sx(G.px), sy(G.py));
    c.rotate(G.bank * (G.form === 'battroid' ? 0.12 : 0.35));
    const morphS = G.morph > 0 ? 1 + G.morph * 0.35 : 1;
    c.scale(scale * morphS, scale * morphS);
    const rgb = formRgb();
    if (G.muzzle > 0) {
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.ellipse(22, 0, 10 + G.muzzle * 40, 3, 0, 0, TAU);
      c.fill();
    }
    if (G.form === 'battroid') {
      c.fillStyle = rgba(rgb, 0.95);
      roundRect(c, -8, -14, 16, 18, 3);
      c.fill();
      c.fillStyle = rgba(WHT, 0.92);
      roundRect(c, -5, -18, 10, 8, 2);
      c.fill();
      c.fillStyle = rgba(MAG, 0.95);
      c.fillRect(-3, -16, 6, 3);
      c.fillStyle = rgba(rgb, 0.95);
      c.fillRect(-14, -8, 8, 5);
      c.fillRect(6, -6, 16, 4);
      c.fillRect(-10, 4, 6, 14);
      c.fillRect(4, 4, 6, 14);
      c.fillStyle = rgba(GOLD, 0.9);
      c.fillRect(18, -8, 8, 6);
    } else if (G.form === 'gerwalk') {
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.ellipse(2, -2, 16, 5, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(SKY, 0.9);
      c.beginPath();
      c.ellipse(0, -2, 12, 12, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.92);
      roundRect(c, -2, -6, 12, 6, 2);
      c.fill();
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.moveTo(-4, 4);
      c.lineTo(-8, 16);
      c.lineTo(-2, 8);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(6, 4);
      c.lineTo(4, 16);
      c.lineTo(10, 8);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.fillRect(8, 6, 4, 10);
      c.beginPath();
      c.arc(16, -2, 3.6, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.ellipse(2, 0, 18, 5.5, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(SKY, 0.9);
      c.beginPath();
      c.ellipse(0, 0, 14, 15, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.moveTo(-16, 0);
      c.lineTo(-22, -7);
      c.lineTo(-10, -2);
      c.lineTo(-10, 2);
      c.lineTo(-22, 7);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(WHT, 0.92);
      roundRect(c, -2, -3.2, 12, 6.4, 2);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(18, 0, 4.2, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(WHT, 0.7);
      c.lineWidth = 1.1;
      c.beginPath();
      const a = G.prop;
      c.moveTo(18 + Math.cos(a) * 7, Math.sin(a) * 7);
      c.lineTo(18 - Math.cos(a) * 7, -Math.sin(a) * 7);
      c.moveTo(18 + Math.cos(a + 1.57) * 7, Math.sin(a + 1.57) * 7);
      c.lineTo(18 - Math.cos(a + 1.57) * 7, -Math.sin(a + 1.57) * 7);
      c.stroke();
      c.fillStyle = rgba(GOLD, 0.8);
      c.fillRect(6, -13, 4, 2);
      c.fillRect(6, 11, 4, 2);
    }
    c.restore();
  }

  function drawEnt(e) {
    const x = e.x - G.cam;
    if (e.type !== 'boss' && e.type !== 'mid' && (x < -60 || x > VW + 60)) return;
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.scale(scale, scale);
    if (e.flash > 0) c.globalAlpha = 0.55;
    const t = e.type;
    if (t === 'scout') {
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.moveTo(10, 0);
      c.lineTo(-8, -7);
      c.lineTo(-4, 0);
      c.lineTo(-8, 7);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(PNK, 0.8);
      c.fillRect(-2, -8, 3, 16);
    } else if (t === 'dive') {
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.moveTo(12, 2);
      c.lineTo(-10, -6);
      c.lineTo(-6, 4);
      c.closePath();
      c.fill();
      c.fillRect(-4, 2, 10, 3);
    } else if (t === 'pod') {
      c.fillStyle = rgba(RED, 0.95);
      c.beginPath();
      c.arc(0, 0, 10, 0, TAU);
      c.fill();
      c.fillStyle = rgba(PNK, 0.85);
      c.beginPath();
      c.arc(-2, -2, 4, 0, TAU);
      c.fill();
      c.fillStyle = rgba(STEEL, 0.9);
      c.fillRect(-8, 8, 4, 8);
      c.fillRect(4, 8, 4, 8);
    } else if (t === 'heavy') {
      c.fillStyle = rgba(VIO, 0.95);
      c.beginPath();
      c.ellipse(0, 0, 18, 11, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.85);
      c.fillRect(-6, -14, 5, 10);
      c.fillStyle = rgba(GOLD, 0.8);
      c.fillRect(8, -3, 12, 5);
    } else if (t === 'drop') {
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.moveTo(10, 0);
      c.lineTo(-8, -6);
      c.lineTo(-8, 6);
      c.closePath();
      c.fill();
      c.fillStyle = '#041018';
      c.font = 'bold 8px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('能', -1, 1);
    } else if (t === 'turret') {
      c.fillStyle = rgba(STEEL, 0.95);
      c.beginPath();
      c.arc(0, 4, 9, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.save();
      const ang = Math.atan2(G.py - e.y, G.px - (e.x - G.cam));
      c.rotate(ang);
      c.fillRect(0, -2, 16, 4);
      c.restore();
    } else if (t === 'hull') {
      c.fillStyle = rgba(HULL, 0.95);
      c.beginPath();
      c.moveTo(-18, 8);
      c.lineTo(-14, -8);
      c.lineTo(14, -8);
      c.lineTo(18, 8);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(STEEL, 0.9);
      c.fillRect(-6, -4, 12, 6);
      c.fillStyle = rgba(CYN, 0.55);
      c.fillRect(4, -6, 10, 3);
    } else if (t === 'mid') {
      if (e.variant === 'sky') {
        c.fillStyle = rgba(RED, 0.95);
        c.beginPath();
        c.ellipse(0, 0, 28, 16, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(STEEL, 0.9);
        c.fillRect(-8, -18, 8, 14);
        c.fillRect(-16, 8, 6, 12);
        c.fillRect(8, 8, 6, 12);
      } else if (e.variant === 'debris') {
        c.fillStyle = rgba(VIO, 0.95);
        roundRect(c, -28, -12, 56, 24, 4);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.85);
        c.fillRect(-8, -20, 16, 10);
        c.fillRect(10, -4, 22, 5);
      } else {
        c.fillStyle = rgba(HULL, 0.95);
        c.fillRect(-32, -8, 64, 22);
        c.fillStyle = rgba(STEEL, 0.9);
        c.fillRect(-12, -22, 24, 16);
        c.fillStyle = rgba(GOLD, 0.85);
        c.save();
        c.rotate(e.spin);
        c.fillRect(0, -3, 22, 6);
        c.restore();
      }
      drawHpPip(c, e, 36);
    } else if (t === 'boss') {
      if (e.variant === 'sky') {
        c.fillStyle = rgba(STEEL, 0.95);
        c.beginPath();
        c.ellipse(0, 6, 54, 16, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(HULL, 0.9);
        c.fillRect(-40, -10, 16, 22);
        c.fillRect(-8, -16, 18, 28);
        c.fillRect(28, -10, 16, 22);
        c.fillStyle = rgba(GOLD, 0.85);
        c.fillRect(-6, -4, 14, 6);
      } else if (e.variant === 'debris') {
        c.fillStyle = rgba(RED, 0.95);
        roundRect(c, -52, -14, 104, 30, 4);
        c.fill();
        c.fillStyle = rgba(STEEL, 0.9);
        c.fillRect(-46, -26, 28, 14);
        c.fillRect(-8, -22, 22, 10);
        c.fillRect(24, -20, 18, 10);
        c.fillStyle = rgba(GOLD, 0.8);
        c.fillRect(-4, -6, 18, 6);
      } else {
        c.fillStyle = rgba(HULL, 0.96);
        c.beginPath();
        c.moveTo(-66, 18);
        c.lineTo(-40, -8);
        c.lineTo(20, -16);
        c.lineTo(68, 6);
        c.lineTo(50, 22);
        c.lineTo(-50, 22);
        c.closePath();
        c.fill();
        c.fillStyle = rgba(STEEL, 0.92);
        c.fillRect(-8, -36, 22, 28);
        c.fillRect(-28, -8, 12, 16);
        c.fillRect(28, -4, 16, 14);
        c.fillStyle = rgba(CYN, 0.7);
        c.fillRect(-4, -42, 8, 10);
        c.fillStyle = rgba(GOLD, 0.9);
        c.save();
        c.rotate(e.spin * 0.35);
        c.fillRect(-4, -28, 8, 22);
        c.restore();
      }
      drawHpPip(c, e, 52);
    }
    c.restore();
  }

  function drawHpPip(c, e, w) {
    const t = clamp(e.hp / e.maxHp, 0, 1);
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(-w, -e.h * 0.5 - 12, w * 2, 4);
    c.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : CYN, 0.95);
    c.fillRect(-w, -e.h * 0.5 - 12, w * 2 * t, 4);
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.save();
      c.fillStyle = rgba(s.rgb, 0.95);
      c.shadowColor = rgba(s.rgb, 0.85);
      c.shadowBlur = 9 * scale;
      const ang = Math.atan2(s.vy, s.vx);
      c.translate(sx(s.x), sy(s.y));
      c.rotate(ang);
      c.fillRect(-7 * scale, -1.3 * scale, 14 * scale, 2.6 * scale);
      if (!REDUCE) {
        c.globalAlpha = 0.32;
        c.fillRect(-14 * scale, -1 * scale, 10 * scale, 2 * scale);
      }
      c.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = s.x - G.cam;
      c.save();
      c.fillStyle = rgba(s.fat ? GOLD : MAG, 0.95);
      c.shadowColor = rgba(MAG, 0.75);
      c.shadowBlur = 7 * scale;
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.55);
      c.beginPath();
      c.arc(sx(x - 0.6), sy(s.y - 0.6), s.r * 0.35 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawPicks() {
    const c = ctx;
    for (let i = 0; i < G.pick.length; i++) {
      const p = G.pick[i];
      const bob = Math.sin(p.t * 8) * 2;
      c.save();
      c.translate(sx(p.x - G.cam), sy(p.y + bob));
      c.rotate(p.t * 2.2);
      c.scale(scale, scale);
      c.fillStyle = rgba(GOLD, 0.95);
      c.shadowColor = rgba(GOLD, 0.8);
      c.shadowBlur = 12;
      c.beginPath();
      c.moveTo(0, -11);
      c.lineTo(11, 0);
      c.lineTo(0, 11);
      c.lineTo(-11, 0);
      c.closePath();
      c.fill();
      c.fillStyle = '#041018';
      c.font = 'bold 9px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.rotate(-p.t * 2.2);
      c.shadowBlur = 0;
      c.fillText('能', 0, 1);
      c.restore();
    }
  }

  function drawParticles() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), Math.max(0.6, p.r * a) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      c.strokeStyle = rgba(s.rgb, 1 - s.t);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      c.strokeStyle = rgba(r.rgb, 1 - r.t);
      c.lineWidth = 3 * (1 - r.t) * scale;
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + r.t * 46) * scale, 0, TAU);
      c.stroke();
    }
  }

  function drawFloats() {
    const c = ctx;
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.save();
      c.globalAlpha = a;
      c.fillStyle = rgba(f.rgb, 1);
      c.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.shadowColor = rgba(f.rgb, 0.7);
      c.shadowBlur = 8;
      c.fillText(f.text, sx(f.x), sy(f.y));
      c.restore();
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : CYN, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : CYN, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.font = 'bold ' + (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name || '', sx(VW * 0.5), sy(y - 6));
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#031018';
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
    drawSky();
    drawGround();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPicks();
    drawParticles();
    drawFloats();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawValkyrie();
    }

    drawBossBar();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.5);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('fold');
    else startGame(G.kind || 'fold');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('fold');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (space) keys.sht = down;
    const formKey = k === 'Shift' || k === 'z' || k === 'Z' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || formKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || formKey)) return;
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
      if (G.mode === 'play' && !overlayOpen()) doTransform();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'bridge' : 'fold');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play' && space) G.fireHold = true;
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
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      if (G.mode === 'play') G.fireHold = true;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (inputSrc === 'ptr') G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindFormBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      e.stopPropagation();
      if (G.mode === 'play') doTransform();
      el.classList.add('held');
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

  seedSky();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindFormBtn(btnForm);
  bindFormBtn(btnPadForm);

  if (btnFold) {
    btnFold.addEventListener('click', function () {
      audio.ensure();
      startGame('fold');
    });
  }
  if (btnBridge) {
    btnBridge.addEventListener('click', function () {
      audio.ensure();
      startGame('bridge');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'fold');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
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
      keys.sht = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
